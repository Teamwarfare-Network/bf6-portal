// @ts-nocheck
// Module: vehicles/hq-deploy -- HQ deploy method: player-triggered per-slot dispatch + seating.
//
// Phase 3: deploy-menu button routes to requestHqVehicleSpawn -> enqueueDispatch.
// Phase 4: bindSpawnedVehicleToExpectingSlot fires onHqVehicleSpawnedForClaim, which kicks
// off the async seat flow: short settle wait -> mod.DeployPlayer -> OnPlayerDeployed handler
// calls mod.ForcePlayerToSeat. BountyHunter pattern (v1.252) confirmed ForcePlayerToSeat is
// only reliable inside the OnPlayerDeployed event chain.
//
// Claim lifecycle (stored directly on the slot; no parallel map):
//   spawn_pending  -- pendingSpawnOwnerPid = pid, vehicleId === -1
//   seat_pending   -- pendingSpawnOwnerPid = pid, vehicleId !== -1 (bound, not yet seated)
//   resolved       -- pendingSpawnOwnerPid = undefined (seat hook or timeout cleared it)
//
// Hard rules (from the reintroduction plan):
//   1. Do not touch the spawn mechanism itself. HQ is a caller of enqueueDispatch only.
//   2. No code copied from the deleted deploy-fulfillment / reservations / spawner-sequence.
//   3. Vanilla must remain byte-identical -- every HQ code path gates on isHqDeployMode().
//   4. Never mod.Teleport a player immediately before ForcePlayerToSeat. Banned.

//#region -------------------- Constants --------------------

const HQ_DEPLOY_REQUEST_COOLDOWN_SECONDS = 5.0;
// Settle wait between bind and mod.DeployPlayer. BountyHunter used ~0.5s; shorter values
// were untested against fresh binds, so start here and tune down after playtest.
const HQ_DEPLOY_SEAT_SETTLE_SECONDS = 0.5;
// If the claim isn't consumed (seated) within this window, treat it as a failed deploy and
// clean up so the pad becomes requestable again. doDispatch's own timeout+retry is ~7s, plus
// the settle + deploy chain is typically <1s, so 10s leaves ~2s of slack.
const HQ_DEPLOY_CLAIM_TIMEOUT_SECONDS = 10.0;

//#endregion ----------------- Constants --------------------



//#region -------------------- Mode Gate --------------------

// HQ is any knob value at or above HQ (currently only HQ; Forward/Air stay excluded for now).
function isHqDeployMode(): boolean {
    const confirmed = State.round.modeConfig.confirmed.vehicleDeployMethod ?? VEHICLE_DEPLOY_METHOD_DEFAULT;
    return confirmed >= VEHICLE_DEPLOY_METHOD_HQ;
}

//#endregion ----------------- Mode Gate --------------------



//#region -------------------- Request Validation + Dispatch --------------------

type HqRequestResult = { ok: boolean; reason?: string };

// Core request entry. Validates + reserves the slot, then enqueues the same serial dispatch
// the Vanilla path uses at countdown start. Returns immediately; bind + seat resolution
// happen asynchronously via OnVehicleSpawned -> onHqVehicleSpawnedForClaim -> beginHqSeatFlow.
//
// `source` selects the seat path inside beginHqSeatFlow:
//   "deploy_menu" -- player is dead at deploy screen; DeployPlayer directly (Phase 4 path).
//   "on_foot"     -- player is alive at live-terminal; UndeployPlayer -> DeployPlayer so the
//                    seat call runs inside the redeploy's OnPlayerDeployed chain (Phase 6).
function requestHqVehicleSpawn(player: mod.Player, pid: number, rowIndex: number, source: "deploy_menu" | "on_foot" = "deploy_menu"): HqRequestResult {
    if (!isHqDeployMode()) return { ok: false, reason: "not_hq_mode" };
    if (!player || !mod.IsPlayerValid(player)) return { ok: false, reason: "invalid_player" };

    const playerTeamId = safeGetTeamNumberFromPlayer(player, 0);
    if (playerTeamId !== TeamID.Team1 && playerTeamId !== TeamID.Team2) return { ok: false, reason: "bad_team" };

    // Per-player cooldown gate -- swallow spam clicks before touching the slot.
    const nowSeconds = mod.GetMatchTimeElapsed();
    const lastRequestAt = State.hqDeploy.lastRequestAtSecondsByPid[pid] ?? -999;
    if (nowSeconds - lastRequestAt < HQ_DEPLOY_REQUEST_COOLDOWN_SECONDS) return { ok: false, reason: "cooldown" };

    // Only one claim per player at a time. If they have an in-flight claim, reject.
    if (findSlotForHqClaim(pid)) return { ok: false, reason: "claim_in_flight" };

    // rowIndex is a position in the filtered per-team visible list -- translate to a real slot.
    const visibleSlots = getVehicleDeployVisibleSlotsForPlayer(player);
    const slot = visibleSlots[rowIndex];
    if (!slot) return { ok: false, reason: "no_slot" };
    if (slot.teamId !== playerTeamId) return { ok: false, reason: "team_mismatch" };
    if (!slot.enabled) return { ok: false, reason: "slot_disabled" };
    if (slot.vehicleId !== -1) return { ok: false, reason: "slot_occupied" };
    if (slot.pendingSpawnOwnerPid !== undefined) return { ok: false, reason: "slot_claimed" };
    if (slot.expectingSpawn || slot.respawnRunning || slot.spawnRetryScheduled) return { ok: false, reason: "slot_busy" };
    // 120s post-destroy cooldown (matches Vanilla respawn delay). Prevents instant
    // re-request after a vehicle is destroyed; the HUD countdown surfaces the remaining time.
    if (slot.respawnClock) return { ok: false, reason: "respawn_cooldown" };

    const slotIndex = State.vehicles.slots.indexOf(slot);
    if (slotIndex < 0) return { ok: false, reason: "no_slot_index" };

    // Reserve. pendingSpawnMode is reused as a presence flag for the HUD signature.
    slot.pendingSpawnOwnerPid = pid;
    slot.pendingSpawnMode = "ground";
    slot.hqSource = source;
    State.hqDeploy.lastRequestAtSecondsByPid[pid] = nowSeconds;

    // Schedule a claim-timeout guard. Covers both spawn_pending (bind never arrives) and
    // seat_pending (bind arrived but OnPlayerDeployed never fires, e.g. player disconnected).
    void scheduleHqClaimTimeout(slotIndex, pid, nowSeconds);

    // Same dispatch channel Vanilla uses at countdown start. No new spawn code.
    enqueueDispatch(slotIndex);

    try { updateVehicleDeployTimerHudForAllPlayers(); } catch {}
    return { ok: true };
}

// Scans slots for an in-flight HQ claim owned by pid. Used both for one-claim-per-player
// enforcement at request time and for the OnPlayerDeployed seat lookup.
function findSlotForHqClaim(pid: number): VehicleSpawnerSlot | undefined {
    for (const slot of State.vehicles.slots) {
        if (slot && slot.pendingSpawnOwnerPid === pid) return slot;
    }
    return undefined;
}

// Clears a stale claim N seconds after the request if seat never completes. If the slot has
// already bound a vehicle (seat_pending window) we also destroy the orphaned vehicle so the
// pad is requestable again -- otherwise the vehicle sits there un-owned.
async function scheduleHqClaimTimeout(slotIndex: number, pid: number, requestedAtSeconds: number): Promise<void> {
    await mod.Wait(HQ_DEPLOY_CLAIM_TIMEOUT_SECONDS);
    const slot = State.vehicles.slots[slotIndex];
    if (!slot) return;
    // Claim resolved (seat succeeded) or replaced by a newer request -- skip.
    if (slot.pendingSpawnOwnerPid !== pid) return;
    const latest = State.hqDeploy.lastRequestAtSecondsByPid[pid] ?? -999;
    if (latest !== requestedAtSeconds) return;

    // Still live at timeout. If bound (seat_pending), destroy the orphan. If unbound
    // (spawn_pending), just clear the slot's claim flags.
    if (slot.vehicleId !== -1) {
        const v = findVehicleById(slot.vehicleId);
        if (v) sinkAndDestroyVehicle(v, slot.spawnPos);
    }
    slot.pendingSpawnOwnerPid = undefined;
    slot.pendingSpawnMode = undefined;
    slot.hqSource = undefined;
    try { updateVehicleDeployTimerHudForAllPlayers(); } catch {}
}

//#endregion ----------------- Request Validation + Dispatch --------------------



//#region -------------------- Post-Bind -> Seat Flow (Phase 4) --------------------

// Called by bindSpawnedVehicleToExpectingSlot once OnVehicleSpawned has resolved the slot.
// The slot is now seat_pending (pendingSpawnOwnerPid still set, vehicleId bound). Kick off
// the async seat flow and return -- bind must not block on awaits.
function onHqVehicleSpawnedForClaim(slot: VehicleSpawnerSlot, vehicle: mod.Vehicle): void {
    if (!slot) return;
    const pid = slot.pendingSpawnOwnerPid;
    if (pid === undefined) return;
    void beginHqSeatFlow(pid, vehicle);
}

// Settles the newly-spawned vehicle, then triggers the engine's deploy event chain. The
// seat itself happens inside onHqSeatPendingPlayerDeployed, invoked from onPlayerDeployedImpl.
//
// Phase 6: for source === "on_foot" the player is alive, so OnPlayerDeployed won't fire
// from DeployPlayer alone. We UndeployPlayer first, then DeployPlayer -- the redeploy fires
// OnPlayerDeployed naturally and the seat hook runs in BountyHunter context.
async function beginHqSeatFlow(pid: number, vehicle: mod.Vehicle): Promise<void> {
    await mod.Wait(HQ_DEPLOY_SEAT_SETTLE_SECONDS);

    const player = safeFindPlayer(pid);
    if (!player || !mod.IsPlayerValid(player)) return;

    // Re-validate: the claim may have been cleared/replaced during the settle.
    const slot = findSlotForHqClaim(pid);
    if (!slot) return;
    if (slot.vehicleId === -1) return;

    if (slot.hqSource === "on_foot") {
        // Alive on-foot player -- undeploy first so the redeploy fires OnPlayerDeployed.
        // closeVehicleDeployLiveMenuForPlayer runs as part of onPlayerUndeployImpl and
        // closes the menu naturally. No mod.Teleport before the seat call -- the ban stands.
        // Zero the player's redeploy timer so the forced DeployPlayer below is not delayed
        // by the engine's post-death countdown (UndeployPlayer is treated like a death).
        try { mod.SetRedeployTime(player, 0); } catch {}
        try { mod.UndeployPlayer(player); } catch {}
        // Poll for the undeploy to register (mirrors the deferForcedUndeploy retry pattern
        // in player-deploy.ts: a single UndeployPlayer call is sometimes swallowed). Wait
        // up to 1.5s for deployedByPid to flip false, then fall through regardless.
        for (let i = 0; i < 15; i++) {
            await mod.Wait(0.1);
            if (!mod.IsPlayerValid(player)) return;
            if (!State.players.deployedByPid[pid]) break;
            if (i === 5) { try { mod.UndeployPlayer(player); } catch {} }
        }
        // Extra grace for the deploy-screen transition to settle before DeployPlayer fires.
        await mod.Wait(0.3);
        if (!mod.IsPlayerValid(player)) return;
        if (State.players.deployedByPid[pid]) return;  // undeploy never took; abort seat
    }

    // Trigger OnPlayerDeployed. The seat call runs inside that handler (BountyHunter context).
    // On-foot path: retry up to 3x if the first DeployPlayer is swallowed before the deploy
    // screen finishes loading. Each retry waits for deployedByPid to flip true before stopping.
    // Re-zero the redeploy timer defensively in case the deploy-screen transition restored it.
    if (slot.hqSource === "on_foot") { try { mod.SetRedeployTime(player, 0); } catch {} }
    try { mod.DeployPlayer(player); } catch {}
    if (slot.hqSource === "on_foot") {
        for (let i = 0; i < 3; i++) {
            await mod.Wait(0.4);
            if (!mod.IsPlayerValid(player)) return;
            if (State.players.deployedByPid[pid]) break;
            try { mod.SetRedeployTime(player, 0); } catch {}
            try { mod.DeployPlayer(player); } catch {}
        }
    }
}

// Called from onPlayerDeployedImpl. If a HQ claim is seat_pending for this pid, seat the
// player into the bound vehicle via ForcePlayerToSeat. Per BountyHunter findings, this is
// the only context in which ForcePlayerToSeat reliably succeeds on a freshly-deployed player.
//
// NEVER add a mod.Teleport(player, ...) before this call -- pre-seat player teleport is
// banned. Broke in v1.106-v1.108 and v1.151-v1.154 with engine OOB latch on aircraft.
function onHqSeatPendingPlayerDeployed(player: mod.Player, pid: number): void {
    const slot = findSlotForHqClaim(pid);
    if (!slot) return;
    if (slot.vehicleId === -1) return;  // still spawn_pending; nothing to seat into
    const vehicle = findVehicleById(slot.vehicleId);

    // Clear the claim regardless of ForcePlayerToSeat outcome. On verify failure the player
    // lands on foot at the pad and can press E to enter manually -- no retry loop.
    slot.pendingSpawnOwnerPid = undefined;
    slot.pendingSpawnMode = undefined;
    slot.hqSource = undefined;

    if (!vehicle) {
        try { updateVehicleDeployTimerHudForAllPlayers(); } catch {}
        return;
    }

    try { mod.ForcePlayerToSeat(player, vehicle, -1); } catch {}
    try { updateVehicleDeployTimerHudForAllPlayers(); } catch {}
}

//#endregion ----------------- Post-Bind -> Seat Flow (Phase 4) --------------------
