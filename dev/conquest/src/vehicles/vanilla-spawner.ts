// @ts-nocheck
// Module: vehicles/vanilla-spawner -- serial dispatch + Clocks-based respawn (v1.258 rewrite)
//
// Replaces the v1.223-v1.257 stack (deploy-fulfillment, reservations, spawner-sequence,
// spawner-bind, spawner-slots, spawner-bootstrap). One Vanilla path; events authoritative.
//
// Design: serial dispatch via Promise-chained mutex, OnVehicleSpawned is the only bind
// writer, OnVehicleDestroyed is the only respawn trigger, respawn countdown driven by
// Clocks.CountDownClock (drift-resistant, HUD-friendly, abortable).

//#region -------------------- Module-Level State --------------------

// Serializes every spawn: each new dispatch is chained via .then() so two simultaneous
// destroys or enable-changes can never race. Never reassign outside doDispatch caller sites.
let spawnMutex: Promise<void> = Promise.resolve();

// Chains a dispatch onto the mutex. The .catch() guarantees a single failed dispatch
// cannot poison the chain and block every subsequent slot (observed in v1.259).
function enqueueDispatch(slotIndex: number): void {
    spawnMutex = spawnMutex
        .then(() => doDispatch(State.vehicles.slots[slotIndex], slotIndex))
        .catch(() => { /* swallow: next dispatch must still run */ });
}

// Slot index currently expecting its OnVehicleSpawned event. Set before ForceVehicleSpawnerSpawn,
// cleared on bind or timeout. A delayed event arriving after timeout sees -1 and is dropped.
let currentlyExpectingSlotIndex: number = -1;

// Resolver for the in-flight bind promise, invoked by onVehicleSpawnedImpl.
let currentSpawnResolve: ((vehicleObjId: number) => void) | undefined;

//#endregion ----------------- Module-Level State --------------------



//#region -------------------- Public Helpers (preserved across rewrite) --------------------

// Applies the 8-setter configuration block for a single spawner. Runs after the 2-second
// engine init delay in bootstrap; also re-applied by map-runtime on spec refresh.
function configureVehicleSpawner(spawner: mod.VehicleSpawner, vehicleType: mod.VehicleList): void {
    mod.SetVehicleSpawnerVehicleType(spawner, vehicleType);
    mod.SetVehicleSpawnerAutoSpawn(spawner, false);
    mod.SetVehicleSpawnerRespawnTime(spawner, 0);
    mod.SetVehicleSpawnerApplyDamageToAbandonVehicle(spawner, true);
    mod.SetVehicleSpawnerAbandonVehiclesOutOfCombatArea(spawner, true);
    mod.SetVehicleSpawnerTimeUntilAbandon(spawner, VEHICLE_SPAWNER_TIME_UNTIL_ABANDON_SECONDS);
    mod.SetVehicleSpawnerKeepAliveAbandonRadius(spawner, VEHICLE_SPAWNER_KEEP_ALIVE_ABANDON_RADIUS);
    mod.SetVehicleSpawnerKeepAliveSpawnerRadius(spawner, VEHICLE_SPAWNER_KEEP_ALIVE_SPAWNER_RADIUS);
}

// Linear scan over AllVehicles(); returns undefined if the id no longer exists.
function findVehicleById(vehicleId: number): mod.Vehicle | undefined {
    const vehicles = mod.AllVehicles();
    const count = mod.CountOf(vehicles);
    for (let i = 0; i < count; i++) {
        const v = mod.ValueInArray(vehicles, i) as mod.Vehicle;
        if (mod.GetObjId(v) === vehicleId) return v;
    }
    return undefined;
}

// Gate helper — true only when the confirmed deploy method is Vanilla. All auto-dispatch
// sites (round-start fleet, countdown-reset fleet, post-destroy respawn) check this so HQ
// mode leaves the pads empty and owned by player-driven requests (see hq-deploy module).
function isVanillaDeployMode(): boolean {
    const confirmed = State.round.modeConfig.confirmed.vehicleDeployMethod ?? VEHICLE_DEPLOY_METHOD_DEFAULT;
    return confirmed === VEHICLE_DEPLOY_METHOD_VANILLA;
}

function clearVehicleReservationForPid(_pid: number): void {
    // no-op (v1.258): reservation system removed.
}

// Canonical destroy path for any tracked vehicle we want gone (startup cleanup, countdown
// reset, prior-vehicle purge on vehicle-type change). Reads X/Z, teleports to (X, -1000, Z),
// then deals lethal damage after 1500ms so the explosion is muffled beneath the pad.
// slotPos-priority proved necessary at Vanilla->HQ countdown reset: GetObjectPosition
// returned an off-pad position that dragged vehicles to map-center. v1.284 tried a relative
// Y-200 offset with GetObjectPosition only -- that was worse, confirming the X/Z from
// GetObjectPosition is unreliable in that window. Slot-context callers pass slot.spawnPos;
// the startup Abrams cleanup is the only caller without a slot and falls back to
// GetObjectPosition.
// TODO (Phase 5 polish): revisit whether the fallback path can use a different authoritative
// source (object registration snapshot?) so we don't depend on GetObjectPosition at all.
function sinkAndDestroyVehicle(v: mod.Vehicle, slotPos?: mod.Vector): void {
    let x = 0;
    let z = 0;
    if (slotPos) {
        try {
            x = mod.XComponentOf(slotPos);
            z = mod.ZComponentOf(slotPos);
        } catch {}
    } else {
        try {
            const pos = mod.GetObjectPosition(v);
            x = mod.XComponentOf(pos);
            z = mod.ZComponentOf(pos);
        } catch {}
    }
    try { mod.Teleport(v, mod.CreateVector(x, -1000, z), 0); } catch {}
    Timers.setTimeout(() => { try { mod.DealDamage(v, 9999); } catch {} }, 1500);
}

//#endregion ----------------- Public Helpers --------------------



//#region -------------------- Bootstrap --------------------

// Reveals the vehicle-spawner HUD family once slot inventory exists for already-warmed undeployed players.
function revealVehicleSpawnerUiAfterStartup(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const player = mod.ValueInArray(players, i) as mod.Player;
        if (!player || !mod.IsPlayerValid(player)) continue;
        const pid = safeGetPlayerId(player);
        if (pid === undefined) continue;
        if (State.players.deployedByPid[pid]) continue;
        if (State.players.readyDialogData[pid]?.dialogVisible) continue;
        if (!isHudWarmReadyForPid(pid) || isHudSwapTransitionActiveForPid(pid)) continue;
        renderVehicleSpawnerUiFamilyForReveal(player, pid);
    }
}

// One-time per match. Creates spawners at zero rotation, waits 2s for engine init (BountyHunter-
// validated window), configures them serially, cleans pre-live default vehicles, applies matchup
// enablement, reveals HUD, and kicks serial initial spawns. No poll loop.
async function startVanillaVehicleSpawnerSystem(): Promise<void> {
    while (!State.vehicles.configReady) {
        await mod.Wait(0.1);
    }

    State.vehicles.slots.length = 0;
    State.vehicles.vehicleToSlot = {};
    State.vehicles.desiredEnabledSlotsTeam1 = 0;
    State.vehicles.desiredEnabledSlotsTeam2 = 0;

    const team1Specs = [...TEAM1_VEHICLE_SLOT_INVENTORY_SPECS].sort((a, b) => a.slotNumber - b.slotNumber);
    const team2Specs = [...TEAM2_VEHICLE_SLOT_INVENTORY_SPECS].sort((a, b) => a.slotNumber - b.slotNumber);

    const zeroRot = mod.CreateVector(0, 0, 0);
    for (const spec of team1Specs) {
        addVanillaSpawnerSlot(TeamID.Team1, spec.slotNumber, spec.pos, spec.rot, spec.vehicle, zeroRot);
    }
    for (const spec of team2Specs) {
        addVanillaSpawnerSlot(TeamID.Team2, spec.slotNumber, spec.pos, spec.rot, spec.vehicle, zeroRot);
    }

    // Load-bearing: engine needs ~2s after SpawnObject before SetVehicleSpawner* calls apply.
    // BountyHunter-validated; removing this causes aircraft slots to spawn default Abrams.
    await mod.Wait(2.0);

    // Per-slot configuration with a small yield between slots so the engine digests each
    // object's state transitions before the next spawner is touched.
    for (const slot of State.vehicles.slots) {
        configureVehicleSpawner(slot.spawner, slot.vehicleType);
        await mod.Wait(0.1);
    }

    // Apply the ready-dialog's confirmed vehicle selections on top of the inventory defaults.
    applyVehicleSpawnSpecsToExistingSlots();

    // Pre-live cleanup: RuntimeSpawn_Common.VehicleSpawner auto-spawns its default vehicle
    // (typically Abrams) during the 2-second init window before AutoSpawn=false applies.
    // Nuke everything pre-live -- no player has a legit vehicle yet.
    if (!isMatchLive() && !State.vehicles.startupCleanupDone) {
        // Filter to Abrams only (the engine default auto-spawn from VehicleSpawner
        // during the 2s init window) so map emplacements / pre-placed vehicles survive.
        // Destroy via the canonical sinkAndDestroyVehicle wrapper.
        const vehicles = mod.AllVehicles();
        const vCount = mod.CountOf(vehicles);
        for (let i = 0; i < vCount; i++) {
            const v = mod.ValueInArray(vehicles, i) as mod.Vehicle;
            if (!v) continue;
            let isAbrams = false;
            try { isAbrams = mod.CompareVehicleName(v, mod.VehicleList.Abrams); } catch {}
            if (!isAbrams) continue;
            sinkAndDestroyVehicle(v);
        }
        State.vehicles.startupCleanupDone = true;
    }

    // Let the destroy events from cleanup drain before dispatching real spawns.
    await mod.Wait(2.0);

    applySpawnerEnablementForMatchup(State.round.matchupPresetIndex, false);
    revealVehicleSpawnerUiAfterStartup();

    // Guardrail: warn once if persistent VehicleSpawner count has drifted past the 40 budget
    // (forward-deploy reuses slot.spawner rather than adding a parallel spawner; this audit
    // catches any regression that would reintroduce per-slot spawner multiplication).
    try { auditSpawnerBudgetAtRoundStart(); } catch {}

    // Round-start fleet dispatch is Vanilla-only. HQ mode keeps pads empty at match start;
    // vehicles come from player-driven requests via hq-deploy.
    if (isVanillaDeployMode()) {
        for (let i = 0; i < State.vehicles.slots.length; i++) {
            const slot = State.vehicles.slots[i];
            if (!slot?.enabled) continue;
            enqueueDispatch(i);
        }
        await spawnMutex;
    }
}

// Creates one spawner at zeroRot and registers the slot. Map yaw is applied to the vehicle
// via Teleport after OnVehicleSpawned binds. Spawners do not honor rotation.
function addVanillaSpawnerSlot(
    teamId: TeamID,
    slotNumber: number,
    spawnPos: mod.Vector,
    spawnRot: mod.Vector,
    vehicleType: mod.VehicleList,
    zeroRot: mod.Vector
): number {
    const spawner = mod.SpawnObject(
        mod.RuntimeSpawn_Common.VehicleSpawner,
        spawnPos,
        zeroRot
    ) as mod.VehicleSpawner;
    mod.SetVehicleSpawnerAutoSpawn(spawner, false);

    const slot: VehicleSpawnerSlot = {
        teamId,
        slotNumber,
        spawner,
        spawnerObjId: getObjId(spawner),
        spawnPos,
        spawnRot,
        vehicleType,
        enabled: false,
        enableToken: 0,
        spawnRequestToken: 0,
        spawnRequestAtSeconds: -1,
        expectingSpawn: false,
        expectingSpawnStartedAtSeconds: -1,
        vehicleId: -1,
        respawnDelaySeconds: VEHICLE_SPAWNER_RESPAWN_DELAY_SECONDS,
        respawnQueuedAtSeconds: -1,
        respawnReadyAtSeconds: -1,
        lastSpawnedAtSeconds: -1,
        lastDestroyedAtSeconds: -1,
        lastMissingAtSeconds: -1,
        respawnRunning: false,
        spawnCategory: "other",
        // v1.279: HQ wiring — flip to true so button visibility can light up when HQ mode is active.
        // Downstream visibility still gates on hqDeployAllowed, so Vanilla stays unaffected.
        deployFlowTracked: true,
        availabilityPhase: "DISABLED",
        pendingSpawnOwnerPid: undefined,
        pendingSpawnMode: undefined,
        activeOwnerPid: undefined,
        respawnClock: undefined,
        nextForwardPos: undefined,
        nextForwardRot: undefined,
        nextAirPos: undefined,
        nextAirRot: undefined,
    };

    State.vehicles.slots.push(slot);
    // Pre-sample forward + air deploy transforms so the first respective click is instant.
    // Forward is a no-op for aircraft slots; air is a no-op for non-aircraft slots. Both are
    // no-ops when the map has no authored volume for the slot's team.
    try { seedNextForwardTransformForSlot(slot); } catch {}
    try { seedNextAirTransformForSlot(slot); } catch {}
    return State.vehicles.slots.length - 1;
}

//#endregion ----------------- Bootstrap --------------------



//#region -------------------- Serial Dispatch --------------------

// Dispatches one spawn for one slot. Awaits bind (or 3s timeout); on timeout, retries once
// after a 1s settle. Applies final yaw via Teleport on the bound vehicle. Always safe to
// chain onto spawnMutex; returns after the slot is either bound, skipped, or logged.
async function doDispatch(slot: VehicleSpawnerSlot, slotIndex: number): Promise<void> {
    if (!slot || !slot.enabled) return;
    if (slot.vehicleId !== -1) return;

    let vehicleObjId = await forceSpawnAndAwaitBind(slot, slotIndex);
    if (vehicleObjId === -1) {
        await mod.Wait(1.0);
        if (!slot.enabled || slot.vehicleId !== -1) return;
        vehicleObjId = await forceSpawnAndAwaitBind(slot, slotIndex);
        if (vehicleObjId === -1) return;
    }

    const vehicle = findVehicleById(vehicleObjId);
    if (!vehicle) return;
    // Forward Deploy: skip pre-seat Teleport. Vehicle stays at HQ pad so the engine applies
    // the player's chosen vehicle loadout during DeployPlayer -> ForcePlayerToSeat (HQ Deploy
    // respects loadout; Forward/Air did not until this change). Post-seat Teleport in
    // onHqSeatPendingPlayerDeployed relocates vehicle + seated player to the forward point
    // after loadout is locked in.
    if (slot.pendingSpawnMode === "forward" && slot.nextForwardPos && slot.nextForwardRot) {
        return;
    }
    // Air Deploy: mirror the forward branch. Skip pre-seat Teleport so the engine applies the
    // player's chosen vehicle loadout during DeployPlayer -> ForcePlayerToSeat; post-seat
    // Teleport in onHqSeatPendingPlayerDeployed lifts vehicle + seated player to the air point.
    if (slot.pendingSpawnMode === "air" && slot.nextAirPos && slot.nextAirRot) {
        return;
    }
    const yawDeg = mod.YComponentOf(slot.spawnRot) + VEHICLE_SPAWN_YAW_OFFSET_DEG;
    const yawRad = yawDeg * (Math.PI / 180);
    try { mod.Teleport(vehicle, slot.spawnPos, yawRad); } catch {}
}

// Fires ForceVehicleSpawnerSpawn, awaits OnVehicleSpawned (up to 3s). Clears the
// expecting-index on every exit so a late event from a timed-out call cannot bind to
// a later slot's dispatch.
async function forceSpawnAndAwaitBind(slot: VehicleSpawnerSlot, slotIndex: number): Promise<number> {
    currentlyExpectingSlotIndex = slotIndex;
    const bindPromise = new Promise<number>((resolve) => { currentSpawnResolve = resolve; });

    // Forward / Air Deploy: relocate slot.spawner to the pre-sampled point before firing. The
    // spawner is restored to slot.spawnPos post-seat in onForwardSpawnSuccess / onAirSpawnSuccess
    // so subsequent HQ clicks stay instant. SetObjectTransform on a VehicleSpawner has no
    // AutoSpawn race (AutoSpawn=false is configured at bootstrap and never re-toggled here).
    if (slot.pendingSpawnMode === "forward" && slot.nextForwardPos && slot.nextForwardRot) {
        try {
            mod.SetObjectTransform(
                slot.spawner,
                mod.CreateTransform(slot.nextForwardPos, slot.nextForwardRot)
            );
        } catch {}
    } else if (slot.pendingSpawnMode === "air" && slot.nextAirPos && slot.nextAirRot) {
        try {
            mod.SetObjectTransform(
                slot.spawner,
                mod.CreateTransform(slot.nextAirPos, slot.nextAirRot)
            );
        } catch {}
    }

    try { mod.ForceVehicleSpawnerSpawn(slot.spawner); } catch {}

    const timeoutPromise = new Promise<number>((resolve) => {
        try { Timers.setTimeout(() => resolve(-1), 3000); } catch { resolve(-1); }
    });

    let result: number;
    try {
        result = await Promise.race([bindPromise, timeoutPromise]);
    } catch {
        result = -1;
    }
    currentlyExpectingSlotIndex = -1;
    currentSpawnResolve = undefined;
    return result;
}

//#endregion ----------------- Serial Dispatch --------------------



//#region -------------------- Event Bindings --------------------

// Called from OnVehicleSpawned. Binds the event vehicle to the slot that requested it,
// clears any active respawn countdown, registers team ownership, resolves the waiting promise.
function bindSpawnedVehicleToExpectingSlot(eventVehicle: mod.Vehicle): boolean {
    if (currentlyExpectingSlotIndex === -1) return false;
    const slot = State.vehicles.slots[currentlyExpectingSlotIndex];
    if (!slot) return false;
    const vehicleObjId = getObjId(eventVehicle);
    slot.vehicleId = vehicleObjId;
    State.vehicles.vehicleToSlot[vehicleObjId] = currentlyExpectingSlotIndex;
    if (slot.respawnClock) {
        slot.respawnClock.reset();
        slot.respawnClock = undefined;
    }
    registerVehicleToTeam(eventVehicle, slot.teamId);
    // HQ post-bind hook: if this dispatch was a player-triggered HQ claim, notify hq-deploy
    // so Phase 3 can clear the claim (Phase 4 will route this into the seating flow).
    if (slot.pendingSpawnOwnerPid !== undefined) {
        try { onHqVehicleSpawnedForClaim(slot, eventVehicle); } catch {}
    }
    try { updateVehicleDeployTimerHudForAllPlayers(); } catch {}
    const resolver = currentSpawnResolve;
    currentSpawnResolve = undefined;
    currentlyExpectingSlotIndex = -1;
    resolver?.(vehicleObjId);
    return true;
}

// Called from OnVehicleDestroyed. Clears the slot's bind and, if still enabled, starts a
// respawn countdown. Abandoned vehicles route through here (ApplyDamageToAbandonVehicle=true).
function onSlotVehicleDestroyed(eventVehicle: mod.Vehicle): void {
    const vehicleObjId = getObjId(eventVehicle);
    const slotIndex = State.vehicles.vehicleToSlot[vehicleObjId];
    if (slotIndex === undefined) return;
    const slot = State.vehicles.slots[slotIndex];
    delete State.vehicles.vehicleToSlot[vehicleObjId];
    if (!slot) return;
    slot.vehicleId = -1;
    slot.activeOwnerPid = undefined;
    if (!slot.enabled) {
        try { updateVehicleDeployTimerHudForAllPlayers(); } catch {}
        return;
    }
    // Start the cooldown in both modes. In Vanilla the onComplete auto-dispatches; in HQ
    // the onComplete just clears the clock, and the active clock acts as a request gate in
    // requestHqVehicleSpawn so players cannot re-request the same slot before the 120s
    // cooldown expires.
    startRespawnCountdown(slot, slotIndex);
    try { updateVehicleDeployTimerHudForAllPlayers(); } catch {}
}

//#endregion ----------------- Event Bindings --------------------



//#region -------------------- Respawn Countdown --------------------

// Starts (or resets) a drift-resistant 120s countdown. onSecond drives the HUD tick;
// onComplete chains a fresh dispatch onto spawnMutex.
function startRespawnCountdown(slot: VehicleSpawnerSlot, slotIndex: number): void {
    if (slot.respawnClock) slot.respawnClock.reset();
    slot.respawnClock = new Clocks.CountDownClock(slot.respawnDelaySeconds, {
        onSecond: (_secondsRemaining: number) => {
            try { updateVehicleDeployTimerHudForAllPlayers(); } catch {}
        },
        onComplete: () => {
            slot.respawnClock = undefined;
            if (!slot.enabled) return;
            if (slot.vehicleId !== -1) return;
            // Vanilla: auto-dispatch the respawn. HQ: clock expiry just re-opens the slot
            // for a fresh player-driven request (handled by requestHqVehicleSpawn gating
            // on slot.respawnClock presence).
            if (!isVanillaDeployMode()) {
                try { updateVehicleDeployTimerHudForAllPlayers(); } catch {}
                return;
            }
            enqueueDispatch(slotIndex);
        },
    });
    slot.respawnClock.start();
}

// HUD read path. Returns seconds remaining, or undefined if no countdown is active.
function getVanillaSlotRespawnRemainingSeconds(slot: VehicleSpawnerSlot | undefined): number | undefined {
    if (!slot || !slot.respawnClock) return undefined;
    const seconds = slot.respawnClock.seconds;
    return Math.ceil(seconds);
}

//#endregion ----------------- Respawn Countdown --------------------



//#region -------------------- Enable / Disable --------------------

function setSpawnerSlotEnabled(slotIndex: number, enabled: boolean): boolean {
    const slot = State.vehicles.slots[slotIndex];
    if (!slot || slot.enabled === enabled) return false;
    slot.enabled = enabled;

    if (!enabled) {
        if (slot.respawnClock) {
            slot.respawnClock.reset();
            slot.respawnClock = undefined;
        }
        if (slot.vehicleId !== -1) {
            const priorVehicleId = slot.vehicleId;
            const priorVehicle = findVehicleById(priorVehicleId);
            delete State.vehicles.vehicleToSlot[priorVehicleId];
            slot.vehicleId = -1;
            if (priorVehicle) sinkAndDestroyVehicle(priorVehicle, slot.spawnPos);
        }
        slot.activeOwnerPid = undefined;
        return false;
    }

    return slot.vehicleId === -1;
}

// Applies matchup counts to slots. spawnOnEnable=true chains dispatches for newly-enabled
// empty slots onto spawnMutex (used by ready-dialog apply and end-of-match refresh).
function applySpawnerEnablementForMatchup(presetIndex: number, spawnOnEnable: boolean): void {
    if (isMatchLive()) return;

    const team1EnabledSlotNumbers: Record<number, boolean> = {};
    const team2EnabledSlotNumbers: Record<number, boolean> = {};
    for (const spec of TEAM1_VEHICLE_SPAWN_SPECS) team1EnabledSlotNumbers[spec.slotNumber] = true;
    for (const spec of TEAM2_VEHICLE_SPAWN_SPECS) team2EnabledSlotNumbers[spec.slotNumber] = true;
    State.vehicles.desiredEnabledSlotsTeam1 = TEAM1_VEHICLE_SPAWN_SPECS.length;
    State.vehicles.desiredEnabledSlotsTeam2 = TEAM2_VEHICLE_SPAWN_SPECS.length;

    const team1SlotIndices: number[] = [];
    const team2SlotIndices: number[] = [];
    const spawnQueue: number[] = [];

    for (let i = 0; i < State.vehicles.slots.length; i++) {
        const slot = State.vehicles.slots[i];
        if (slot.teamId === TeamID.Team1) team1SlotIndices.push(i);
        else if (slot.teamId === TeamID.Team2) team2SlotIndices.push(i);
    }
    team1SlotIndices.sort((a, b) => (State.vehicles.slots[a]?.slotNumber ?? 0) - (State.vehicles.slots[b]?.slotNumber ?? 0));
    team2SlotIndices.sort((a, b) => (State.vehicles.slots[a]?.slotNumber ?? 0) - (State.vehicles.slots[b]?.slotNumber ?? 0));

    for (const slotIndex of team1SlotIndices) {
        const slot = State.vehicles.slots[slotIndex];
        if (!slot) continue;
        const shouldEnable = team1EnabledSlotNumbers[slot.slotNumber] === true;
        const shouldSpawn = setSpawnerSlotEnabled(slotIndex, shouldEnable);
        if (spawnOnEnable && shouldSpawn) spawnQueue.push(slotIndex);
    }
    for (const slotIndex of team2SlotIndices) {
        const slot = State.vehicles.slots[slotIndex];
        if (!slot) continue;
        const shouldEnable = team2EnabledSlotNumbers[slot.slotNumber] === true;
        const shouldSpawn = setSpawnerSlotEnabled(slotIndex, shouldEnable);
        if (spawnOnEnable && shouldSpawn) spawnQueue.push(slotIndex);
    }

    // spawnOnEnable fires auto-dispatch to fill newly-enabled slots (ready-dialog apply,
    // startMatch, post-match refresh). HQ mode skips it entirely — slots remain enabled
    // (so hq-deploy requests can target them) but stay empty until a player click.
    if (spawnOnEnable && isVanillaDeployMode()) {
        for (let i = 0; i < State.vehicles.slots.length; i++) {
            const slot = State.vehicles.slots[i];
            if (!slot.enabled) continue;
            if (slot.vehicleId !== -1) continue;
            if (spawnQueue.indexOf(i) !== -1) continue;
            spawnQueue.push(i);
        }
        for (const slotIndex of spawnQueue) {
            enqueueDispatch(slotIndex);
        }
    }

    try { updateVehicleDeployTimerHudForAllPlayers(); } catch {}
}

//#endregion ----------------- Enable / Disable --------------------



//#region -------------------- Countdown-Start Reset --------------------

// Called from startPregameCountdown at the very beginning of the pregame countdown.
// Clears every pre-live vehicle and any in-flight respawn clocks, then enqueues fresh
// dispatches so the live-round fleet spawns DURING the countdown — by the time the
// "LIVE!" banner fades, vehicles are already bound and teleported into place. No 120s
// cooldown, and no mid-LIVE "jumble" of explosions + respawns.
//
// Blow-up strategy (user-directed): teleport every vehicle to y=-1000 first, wait a
// short beat so the teleport lands visibly, THEN DealDamage. Players don't see/hear
// explosions at the pad positions. Avoids UnspawnObject (history of flakiness).
async function resetVehicleSlotsAtCountdownStart(): Promise<void> {
    if (!State.vehicles?.slots) return;

    // Collect the bound vehicles BEFORE dropping bindings so we know exactly which
    // vehicles to destroy — position-based filtering was fragile and missed vehicles
    // that had drifted beyond the pad radius, leaving them alive + unbound after reset.
    // Pair with the slot's spawnPos so sinkAndDestroyVehicle has an authoritative
    // fallback if the engine returns a zero-vector GetObjectPosition on a transitional
    // vehicle (observed during Vanilla→HQ countdown-start).
    const vehiclesToKill: { vehicle: mod.Vehicle; fallbackPos: mod.Vector | undefined }[] = [];
    for (const slot of State.vehicles.slots) {
        if (!slot) continue;
        if (slot.respawnClock) {
            slot.respawnClock.reset();
            slot.respawnClock = undefined;
        }
        if (slot.vehicleId !== -1) {
            const boundVehicle = findVehicleById(slot.vehicleId);
            delete State.vehicles.vehicleToSlot[slot.vehicleId];
            slot.vehicleId = -1;
            slot.activeOwnerPid = undefined;
            if (boundVehicle) vehiclesToKill.push({ vehicle: boundVehicle, fallbackPos: slot.spawnPos });
        }
    }

    // Destroy each bound vehicle via the canonical wrapper (sinks to y=-1000 preserving
    // X/Z, then DealDamage after 500ms so explosions aren't audible at the pad).
    for (const entry of vehiclesToKill) sinkAndDestroyVehicle(entry.vehicle, entry.fallbackPos);

    // Re-seed forward + air deploy transforms per slot so the first respective click of the
    // round fires an instant relocate + ForceVehicleSpawnerSpawn with no round-start sampling.
    for (const slot of State.vehicles.slots) {
        if (!slot) continue;
        try { seedNextForwardTransformForSlot(slot); } catch {}
        try { seedNextAirTransformForSlot(slot); } catch {}
    }

    // Phase C -- enqueue fresh dispatches. Vanilla-only: HQ mode leaves pads empty until
    // a player-driven request fires via hq-deploy. The destroy pass above still runs in
    // HQ mode so any stray bound vehicles from a prior Vanilla round are cleaned.
    if (isVanillaDeployMode()) {
        for (let i = 0; i < State.vehicles.slots.length; i++) {
            const slot = State.vehicles.slots[i];
            if (!slot?.enabled) continue;
            enqueueDispatch(i);
        }
    }

    try { updateVehicleDeployTimerHudForAllPlayers(); } catch {}
}

//#endregion ----------------- Countdown-Start Reset --------------------
