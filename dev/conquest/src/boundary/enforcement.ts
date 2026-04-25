// @ts-nocheck
// Module: boundary/enforcement -- boundary occupancy, prompt, and kill-timer enforcement

const PRELIVE_MAIN_BASE_KILL_SECONDS = 10;
const ENEMY_MAIN_BASE_BUFFER_KILL_SECONDS = 6;
const GROUND_COMBAT_ZONE_KILL_SECONDS = 10;
const PRELIVE_MAIN_BASE_WARNING_DELAY_SECONDS = 0.35;
const LIVE_BOUNDARY_WARNING_DELAY_SECONDS = 0.2;
const BOUNDARY_WARNING_ALARM_AMPLITUDE = 80;
// Window after deploy in which the GCZ classifier suppresses violations to give the engine
// trigger enter events time to settle. Engine fires synchronously on spawn-inside-trigger so
// the typical case needs no grace, but this guards the rare miss without an extra round-trip.
const GCZ_DEPLOY_GRACE_SECONDS = 1.5;

// Search radius used at squad-spawn deploy time to find the squadmate (the engine doesn't
// expose "who did I spawn on", so we proxy via nearest deployed teammate). Squad spawns
// realistically land within 5-10m of the squadmate; 25m is a generous buffer.
const SQUAD_SPAWN_PROXIMITY_RADIUS_METERS = 25;

function getBoundaryDurationSeconds(kind: BoundaryPromptKind): number {
    switch (kind) {
        case "prelive_main_base":
            return PRELIVE_MAIN_BASE_KILL_SECONDS;
        case "enemy_main_base_buffer":
            return ENEMY_MAIN_BASE_BUFFER_KILL_SECONDS;
        case "ground_combat_zone":
            return GROUND_COMBAT_ZONE_KILL_SECONDS;
        default:
            return PRELIVE_MAIN_BASE_KILL_SECONDS;
    }
}

function getBoundaryWarningDelaySeconds(kind: BoundaryPromptKind): number {
    return kind === "prelive_main_base"
        ? PRELIVE_MAIN_BASE_WARNING_DELAY_SECONDS
        : LIVE_BOUNDARY_WARNING_DELAY_SECONDS;
}

function isPlayerAliveForBoundary(player: mod.Player): boolean {
    return safeGetSoldierStateBool(player, mod.SoldierStateBool.IsAlive, false);
}

function hasValidBoundaryAlarmHandle(handle: any): boolean {
    if (handle === undefined || handle === null) return false;
    if (typeof handle === "number") return handle > 0;
    return true;
}

function safeUnspawnBoundaryAlarmHandle(handle: any): void {
    if (!hasValidBoundaryAlarmHandle(handle)) return;
    try {
        mod.UnspawnObject(handle);
    } catch {}
}

function cleanupBoundaryAlarmRuntime(): void {
    safeUnspawnBoundaryAlarmHandle(State.round.boundary.alarmHandle);
    State.round.boundary.alarmHandle = undefined;
    State.round.boundary.alarmReady = false;
}

function primeBoundaryAlarmRuntime(): void {
    if (State.round.boundary.alarmReady && hasValidBoundaryAlarmHandle(State.round.boundary.alarmHandle)) return;
    const zero = mod.CreateVector(0, 0, 0);
    if (!hasValidBoundaryAlarmHandle(State.round.boundary.alarmHandle)) {
        try {
            State.round.boundary.alarmHandle = mod.SpawnObject(
                mod.RuntimeSpawn_Common.SFX_Alarm,
                zero,
                zero
            );
        } catch {
            State.round.boundary.alarmHandle = undefined;
        }
    }
    State.round.boundary.alarmReady = hasValidBoundaryAlarmHandle(State.round.boundary.alarmHandle);
}

function playBoundaryAlarmForPlayer(player: mod.Player, violation: BoundaryViolationState): void {
    if (!player || !mod.IsPlayerValid(player)) return;
    if (violation.alarmPlayed) return;
    primeBoundaryAlarmRuntime();
    if (!State.round.boundary.alarmReady || !hasValidBoundaryAlarmHandle(State.round.boundary.alarmHandle)) return;
    try {
        mod.PlaySound(State.round.boundary.alarmHandle, BOUNDARY_WARNING_ALARM_AMPLITUDE, player);
        violation.alarmPlayed = true;
    } catch {}
}

function getEnemyTeamId(teamId: TeamID | 0): TeamID | 0 {
    if (teamId === TeamID.Team1) return TeamID.Team2;
    if (teamId === TeamID.Team2) return TeamID.Team1;
    return 0;
}

// Resolves and enables every boundary AreaTrigger so the engine fires OnPlayerEnter/Exit events
// for them. AreaTriggers are off by default in BF6 Portal -- without this call, none of the
// five boundary triggers (own HQ, own buffer, GCZ, enemy HQ, enemy buffer) deliver events,
// which silently breaks every system that depends on physical boundary crossings: HQ-back-walk
// OOB detection, ground-combat-zone OOB, enemy-buffer kill timers. Must run after applyMapConfig
// has populated the trigger ID lets, and ideally re-run on any map config swap.
function enableBoundaryAreaTriggers(): void {
    const ids = [
        getMainBaseTriggerIdForTeam(TeamID.Team1),
        getMainBaseTriggerIdForTeam(TeamID.Team2),
        getMainBaseBufferTriggerIdForTeam(TeamID.Team1),
        getMainBaseBufferTriggerIdForTeam(TeamID.Team2),
        getGroundCombatZoneTriggerId(),
    ];
    for (const id of ids) {
        if (id === undefined) continue;
        try {
            const trigger = mod.GetAreaTrigger(id);
            if (trigger) mod.EnableAreaTrigger(trigger, true);
        } catch {}
    }
}

// Lazy-initializes a default-false zone state record for the pid if absent. The default-false
// invariant is critical: every spawn path resets via resetPlayerBoundaryStateOnDeploy first,
// then the engine's synchronous trigger enter event for the spawn polygon flips exactly the
// matching flag to true. No flag should ever be true without a corresponding enter event.
// seatKind defaults to "on_foot"; setPlayerSeatKind owns transitions.
function getOrInitZoneStateForPid(pid: number): PlayerZoneState {
    let state = State.round.boundary.zoneStateByPid[pid];
    if (!state) {
        state = {
            inOwnHQ: false,
            inOwnBuffer: false,
            inGCZ: false,
            inEnemyHQ: false,
            inEnemyBuffer: false,
            seatKind: "on_foot",
        };
        State.round.boundary.zoneStateByPid[pid] = state;
    }
    return state;
}

// Classifies a vehicle as aircraft vs ground via slot-binding lookup, NOT mod.CompareVehicleName.
// vehicleToSlot gives us the slot index; slot.vehicleType is the mod.VehicleList enum the script
// itself set at slot configure time. isAircraftVehicleType is a pure JS switch on that enum --
// reliable on this runtime where CompareVehicleName is not (CQ_Bug_43). Defaults to ground_vehicle
// for unbound vehicles, which shouldn't occur in this mode but is the safe fallback.
function classifyVehicleSeatKind(vehicle: mod.Vehicle): "ground_vehicle" | "aircraft" {
    const objId = safeGetObjId(vehicle);
    if (objId === undefined) return "ground_vehicle";
    const slotIndex = State.vehicles.vehicleToSlot[objId];
    if (slotIndex === undefined) return "ground_vehicle";
    const slot = State.vehicles.slots[slotIndex];
    if (!slot) return "ground_vehicle";
    return isAircraftVehicleType(slot.vehicleType) ? "aircraft" : "ground_vehicle";
}

// Single writer for seatKind. Called from OnPlayerEnter/ExitVehicle and from the deploy seed.
// No-op when the kind hasn't changed (avoids redundant refreshPlayerBoundaryState work). On any
// transition, refreshes the boundary classifier so OOB/clear edges fire synchronously with the
// seat change rather than waiting for the next tick.
function setPlayerSeatKind(player: mod.Player, kind: SeatKind): void {
    if (!player || !mod.IsPlayerValid(player)) return;
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return;
    const state = getOrInitZoneStateForPid(pid);
    if (state.seatKind === kind) return;
    state.seatKind = kind;
    refreshPlayerBoundaryState(player);
}

// Single write path for boundary trigger membership. Identifies which of the five tracked
// triggers (own HQ, own buffer, GCZ, enemy HQ, enemy buffer) the event matches based on the
// player's current team, sets exactly one boolean, and mirrors inOwnHQ to the legacy
// State.players.inMainBaseByPid flag for downstream consumers (world-interactables.ts,
// takeoff-gating.ts) that have not been migrated. Bails silently when the trigger is unrelated
// to boundary enforcement (capture-point triggers, etc) so it can be called unconditionally
// from area-trigger event handlers.
function updateZoneStateOnTriggerTransition(player: mod.Player, triggerObjId: number, entered: boolean): void {
    if (!player || !mod.IsPlayerValid(player)) return;
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return;
    const teamId = safeGetTeamNumberFromPlayer(player, 0);
    if (teamId !== TeamID.Team1 && teamId !== TeamID.Team2) return;

    const ownHqId    = getMainBaseTriggerIdForTeam(teamId as TeamID);
    const ownBufId   = getMainBaseBufferTriggerIdForTeam(teamId as TeamID);
    const enemyHqId  = getMainBaseTriggerIdForTeam(getEnemyTeamId(teamId) as TeamID);
    const enemyBufId = getMainBaseBufferTriggerIdForTeam(getEnemyTeamId(teamId) as TeamID);
    const gczId      = getGroundCombatZoneTriggerId();

    const state = getOrInitZoneStateForPid(pid);

    if (ownHqId !== undefined && triggerObjId === ownHqId) {
        state.inOwnHQ = entered;
    } else if (ownBufId !== undefined && triggerObjId === ownBufId) {
        state.inOwnBuffer = entered;
    } else if (gczId !== undefined && triggerObjId === gczId) {
        state.inGCZ = entered;
    } else if (enemyHqId !== undefined && triggerObjId === enemyHqId) {
        state.inEnemyHQ = entered;
    } else if (enemyBufId !== undefined && triggerObjId === enemyBufId) {
        state.inEnemyBuffer = entered;
    } else {
        return;
    }

    State.players.inMainBaseByPid[pid] = state.inOwnHQ;

    refreshPlayerBoundaryState(player);
}

// Returns the boundary-violation kind the player is currently subject to, if any. Pure read
// over the per-player zone state and cached seatKind -- no engine queries at classification
// time. seatKind is owned by setPlayerSeatKind (OnPlayerEnter/ExitVehicle + deploy seed).
// Branches in priority order:
//  - prelive_main_base: pre-live, not in own HQ trigger.
//  - own-HQ exemption short-circuit (live): inside own main base trigger -> no violation.
//  - enemy_main_base_buffer: inside enemy main-base or enemy buffer trigger.
//  - grace window: skip GCZ check during the brief post-deploy settle period.
//  - aircraft exemption: state.seatKind === "aircraft" -> never script-GCZ'd (engine grey-zone
//    at AirCombatVolume's outer edge owns aircraft).
//  - ground_combat_zone: on-foot OR in a non-aircraft vehicle, outside both GCZ (trigger 666)
//    AND own buffer (those two together form the live-play safe ground area). On-foot above
//    AIRCRAFT_BAIL_CEILING_Y also fires GCZ (belt-and-braces against bail above ceiling).
function getDesiredBoundaryViolationKind(player: mod.Player): BoundaryPromptKind | undefined {
    if (!player || !mod.IsPlayerValid(player)) return undefined;
    if (!isPlayerDeployed(player)) return undefined;
    if (!isPlayerAliveForBoundary(player)) return undefined;
    if (State.match.isEnded) return undefined;

    const pid = safeGetPlayerId(player);
    if (pid === undefined) return undefined;
    const state = State.round.boundary.zoneStateByPid[pid];
    if (!state) return undefined;

    if (!isMatchLive()) {
        return state.inOwnHQ ? undefined : "prelive_main_base";
    }

    if (state.inOwnHQ) return undefined;

    if (state.inEnemyHQ || state.inEnemyBuffer) return "enemy_main_base_buffer";

    const deployedAt = State.players.deployedAtSecondsByPid[pid];
    if (deployedAt !== undefined && (mod.GetMatchTimeElapsed() - deployedAt) < GCZ_DEPLOY_GRACE_SECONDS) {
        return undefined;
    }

    if (state.seatKind === "aircraft") return undefined;

    const inSafeGround = state.inGCZ || state.inOwnBuffer;
    if (!inSafeGround) return "ground_combat_zone";

    if (state.seatKind === "on_foot") {
        try {
            const pos = safeGetSoldierStateVector(player, mod.SoldierStateVector.GetPosition);
            if (pos && mod.YComponentOf(pos) > AIRCRAFT_BAIL_CEILING_Y) {
                return "ground_combat_zone";
            }
        } catch {}
    }

    return undefined;
}

function notePreliveMainBaseViolation(player: mod.Player, pid: number): void {
    const wasReady = State.players.readyByPid[pid] === true;
    State.players.readyByPid[pid] = false;
    if (wasReady) {
        State.players.readyNeedsReconfirmByPid[pid] = true;
    }
    refreshReadyStatusForAllBuiltReadyDialogs();
    if (!wasReady) return;

    updatePlayersReadyHudTextForAllPlayers();
    updateHelpTextVisibilityForPid(pid);
    renderReadyDialogForAllVisibleViewers();
}

function tryKillBoundaryPlayer(player: mod.Player): void {
    if (!player || !mod.IsPlayerValid(player)) return;
    try {
        const modAny = mod as any;
        if (typeof modAny.Kill === "function") {
            modAny.Kill(player);
            return;
        }
    } catch {}
    try {
        mod.UndeployPlayer(player);
    } catch {}
}

function clearBoundaryViolationForPid(pid: number, destroyUi: boolean = false): void {
    delete State.round.boundary.activeViolationByPid[pid];
    if (destroyUi) {
        destroyBoundaryPromptUiForPid(pid);
    } else {
        hideBoundaryPromptForPid(pid);
    }
}

function refreshPlayerBoundaryState(player: mod.Player): void {
    if (!player || !mod.IsPlayerValid(player)) return;

    const pid = safeGetPlayerId(player);
    if (pid === undefined) return;

    const now = mod.GetMatchTimeElapsed();
    const previous = State.round.boundary.activeViolationByPid[pid];
    const nextKind = getDesiredBoundaryViolationKind(player);

    if (!nextKind) {
        if (previous) {
            clearBoundaryViolationForPid(pid);
        }
        return;
    }

    if (!previous || previous.kind !== nextKind) {
        if (nextKind === "prelive_main_base") {
            notePreliveMainBaseViolation(player, pid);
        }
        const token = ++State.round.boundary.nextEnforcementToken;
        State.round.boundary.activeViolationByPid[pid] = {
            kind: nextKind,
            startedAtSeconds: now,
            expiresAtSeconds: now + getBoundaryDurationSeconds(nextKind),
            alarmPlayed: false,
            enforcementToken: token,
        };
        void runBoundaryViolationEnforcementLoop(pid, token);
    }

    const violation = State.round.boundary.activeViolationByPid[pid];
    if (!violation) return;

    if ((now - violation.startedAtSeconds) < getBoundaryWarningDelaySeconds(violation.kind)) {
        hideBoundaryPromptForPid(pid);
        return;
    }

    playBoundaryAlarmForPlayer(player, violation);

    const remainingSeconds = Math.max(0, Math.ceil(violation.expiresAtSeconds - now));
    if (remainingSeconds <= 0) {
        clearBoundaryViolationForPid(pid);
        try {
            if (mod.IsPlayerValid(player) && isPlayerDeployed(player) && isPlayerAliveForBoundary(player)) {
                tryKillBoundaryPlayer(player);
            }
        } catch {}
        return;
    }

    showBoundaryPromptForPlayer(player, violation.kind, remainingSeconds);
}

// Self-terminating async loop that enforces a boundary violation countdown for one player.
// Ticks once per second, re-evaluating via refreshPlayerBoundaryState (which handles warning,
// alarm, and kill). Terminates when the violation is cleared, replaced, or the player is invalid.
async function runBoundaryViolationEnforcementLoop(pid: number, token: number): Promise<void> {
    while (true) {
        await mod.Wait(1.0);
        const violation = State.round.boundary.activeViolationByPid[pid];
        if (!violation || violation.enforcementToken !== token) return;
        const player = safeFindPlayer(pid);
        if (!player || !mod.IsPlayerValid(player)) {
            clearBoundaryViolationForPid(pid);
            return;
        }
        refreshPlayerBoundaryState(player);
        const post = State.round.boundary.activeViolationByPid[pid];
        if (!post || post.enforcementToken !== token) return;
    }
}

function refreshBoundaryStateForAllPlayers(): void {
    forEachValidPlayer((player) => refreshPlayerBoundaryState(player));
}

function tickBoundaryEnforcement(): void {
    if (State.match.isEnded) {
        clearActiveBoundaryViolationsForAllPlayers();
        return;
    }
    refreshBoundaryStateForAllPlayers();
}

// Thin wrappers around the single update path. Called from onPlayerEnter/ExitAreaTriggerImpl
// for every area-trigger event; updateZoneStateOnTriggerTransition silently ignores triggers
// that are not part of boundary enforcement.
function onPlayerEnterBoundaryAreaTrigger(player: mod.Player, areaTrigger: mod.AreaTrigger): void {
    const triggerId = safeGetObjId(areaTrigger);
    if (triggerId === undefined) return;
    updateZoneStateOnTriggerTransition(player, triggerId, true);
}

function onPlayerExitBoundaryAreaTrigger(player: mod.Player, areaTrigger: mod.AreaTrigger): void {
    const triggerId = safeGetObjId(areaTrigger);
    if (triggerId === undefined) return;
    updateZoneStateOnTriggerTransition(player, triggerId, false);
}

// Resets boundary state at the start of a fresh deploy. Drops the prior life's zone snapshot
// then SEEDS the new state to match where the player landed. The engine does NOT fire trigger
// enter events on spawn-inside-trigger -- only on physical boundary crossings -- so without
// an explicit seed, HQ-deploy players spawn with inMainBaseByPid=false and cannot ready up,
// and Forward-deploy players would briefly read as "outside the safe ground zone" until they
// stepped across a trigger boundary. Trigger exit events remain the sole writer that flips
// flags back to false when the player physically crosses out of a boundary, preserving the
// HQ-back-walk OOB fix. Seed source priority: (1) slot.pendingSpawnMode if a vehicle deploy
// claim is in flight (script-driven, authoritative), (2) HQ anchor distance probe (covers
// standard on-foot HQ deploy where no slot is involved). Squad/flag spawns hit neither path
// and rely on the grace window + trigger enter event when the player walks/drives.
function resetPlayerBoundaryStateOnDeploy(player: mod.Player, pid: number): void {
    delete State.round.boundary.zoneStateByPid[pid];
    State.players.deployedAtSecondsByPid[pid] = mod.GetMatchTimeElapsed();
    clearBoundaryViolationForPid(pid);
    if (!player || !mod.IsPlayerValid(player)) {
        State.players.inMainBaseByPid[pid] = false;
        return;
    }
    const state = getOrInitZoneStateForPid(pid);
    seedZoneStateFromSpawnContext(player, pid, state);
    State.players.inMainBaseByPid[pid] = state.inOwnHQ;
    refreshPlayerBoundaryState(player);
}

// Spawn-mode-aware seed. When a player deploys via a slot-based vehicle deploy (HQ / Forward
// / Air buttons), the slot still holds `pendingSpawnOwnerPid === pid`, `pendingSpawnMode`, and
// `vehicleType` at the moment of OnPlayerDeployed -- the script knows authoritatively where it
// asked the engine to land them and what vehicle they're seated in. For standard on-foot HQ
// deploy (no slot claim), falls back to the HQ-anchor distance probe and a one-shot IsInVehicle
// engine read so squad/flag spawns that land in a vehicle still classify correctly. For squad
// spawns, additionally inherits non-HQ zone flags from the nearest deployed teammate -- see
// tryInheritZonesFromNearbyTeammate.
function seedZoneStateFromSpawnContext(player: mod.Player, pid: number, state: PlayerZoneState): void {
    const claimSlot = findSlotForHqClaim(pid);
    if (claimSlot && claimSlot.pendingSpawnMode !== undefined) {
        state.seatKind = isAircraftVehicleType(claimSlot.vehicleType) ? "aircraft" : "ground_vehicle";
        switch (claimSlot.pendingSpawnMode) {
            case "ground":
                state.inOwnHQ = true;
                return;
            case "forward":
                state.inGCZ = true;
                state.inOwnBuffer = true;
                return;
            case "air":
                return;
        }
    }
    // No slot -- standard on-foot HQ deploy OR squad/flag spawn. seatKind via IsInVehicle probe.
    state.seatKind = probeSeatKindFromEngineState(player);
    // Squad-spawn proxy: copy non-HQ zone flags from the nearest deployed teammate so a player
    // spawning deep inside GCZ / own buffer / enemy zones inherits the correct flags without
    // waiting for a physical trigger crossing. inOwnHQ is NOT inherited -- the anchor probe is
    // an independent reliable signal that may legitimately disagree with a squadmate near the
    // HQ trigger edge. See design_doc/squad_spawn_zone_inheritance_plan_2026-04-25.md.
    tryInheritZonesFromNearbyTeammate(player, pid, state);
    state.inOwnHQ = isPlayerWithinOwnMainBaseAnchorRadius(player);
}

// Scans deployed teammates and returns the closest one within SQUAD_SPAWN_PROXIMITY_RADIUS_METERS
// of the player's current position, or undefined. Used as the squad-spawn target proxy because
// the engine does not expose "who did this player squad-spawn on". One-shot at deploy; never
// called on a per-tick path.
function findNearestDeployedTeammatePid(
    selfPid: number,
    teamId: TeamID,
    selfPos: mod.Vector,
): number | undefined {
    let nearestPid: number | undefined;
    let nearestDist = SQUAD_SPAWN_PROXIMITY_RADIUS_METERS;
    forEachValidPlayer((other, otherPid) => {
        if (otherPid === selfPid) return;
        if (!isPlayerDeployed(other)) return;
        if (safeGetTeamNumberFromPlayer(other, 0) !== teamId) return;
        const otherPos = safeGetSoldierStateVector(other, mod.SoldierStateVector.GetPosition);
        if (!otherPos) return;
        const dist = mod.DistanceBetween(selfPos, otherPos);
        if (dist <= nearestDist) {
            nearestDist = dist;
            nearestPid = otherPid;
        }
    });
    return nearestPid;
}

// Copies non-HQ zone flags from the nearest deployed teammate. Skips inheritance when no
// teammate is within range, the teammate has no cached state, or the teammate is still inside
// their own deploy grace window (their flags may be unsettled). Returns true on a successful
// inheritance for callers that want to log/diagnose -- the seed function ignores the return.
function tryInheritZonesFromNearbyTeammate(
    player: mod.Player,
    pid: number,
    state: PlayerZoneState,
): boolean {
    const teamId = safeGetTeamNumberFromPlayer(player, 0);
    if (teamId !== TeamID.Team1 && teamId !== TeamID.Team2) return false;
    const selfPos = safeGetSoldierStateVector(player, mod.SoldierStateVector.GetPosition);
    if (!selfPos) return false;
    const teammatePid = findNearestDeployedTeammatePid(pid, teamId as TeamID, selfPos);
    if (teammatePid === undefined) return false;
    const teammateState = State.round.boundary.zoneStateByPid[teammatePid];
    if (!teammateState) return false;
    const teammateDeployedAt = State.players.deployedAtSecondsByPid[teammatePid];
    if (teammateDeployedAt !== undefined
        && (mod.GetMatchTimeElapsed() - teammateDeployedAt) < GCZ_DEPLOY_GRACE_SECONDS) {
        return false;
    }
    state.inOwnBuffer = teammateState.inOwnBuffer;
    state.inGCZ = teammateState.inGCZ;
    state.inEnemyHQ = teammateState.inEnemyHQ;
    state.inEnemyBuffer = teammateState.inEnemyBuffer;
    return true;
}

// One-shot soldier-state probe used by seedZoneStateFromSpawnContext for non-slot deploys.
// Mirrors Andy's reference pattern (mod.GetSoldierState(IsInVehicle) is reliable on this runtime
// where mod.CompareVehicleName is not). NEVER called per-tick -- only at deploy.
function probeSeatKindFromEngineState(player: mod.Player): SeatKind {
    let inVehicle = false;
    try {
        inVehicle = !!mod.GetSoldierState(player, mod.SoldierStateBool.IsInVehicle);
    } catch {
        return "on_foot";
    }
    if (!inVehicle) return "on_foot";
    let vehicle: mod.Vehicle | undefined;
    try { vehicle = mod.GetVehicleFromPlayer(player); } catch {}
    if (!vehicle) return "ground_vehicle";
    return classifyVehicleSeatKind(vehicle);
}

// One-shot positional probe: is the player physically within the team HQ anchor radius right
// now? Used as the fallback seed for standard on-foot HQ deploy where no slot claim exists.
// NOT a substitute for trigger-event-driven ongoing tracking -- once seeded, only trigger
// exit/enter events are allowed to flip inOwnHQ.
function isPlayerWithinOwnMainBaseAnchorRadius(player: mod.Player): boolean {
    const teamId = safeGetTeamNumberFromPlayer(player, 0);
    const anchor = teamId === TeamID.Team1
        ? MAIN_BASE_TEAM1_POS
        : teamId === TeamID.Team2
            ? MAIN_BASE_TEAM2_POS
            : undefined;
    if (!anchor) return false;
    const pos = safeGetSoldierStateVector(player, mod.SoldierStateVector.GetPosition);
    if (!pos) return false;
    return mod.DistanceBetween(pos, anchor) <= DEPLOY_MAIN_BASE_RADIUS_METERS;
}

function resetPlayerBoundaryStateOnUndeployOrReset(pid: number, destroyUi: boolean = false): void {
    delete State.round.boundary.zoneStateByPid[pid];
    delete State.players.deployedAtSecondsByPid[pid];
    // Clear inMainBaseByPid so downstream consumers reflect the player's undeployed state
    // and a stale-true cannot leak into the next deploy's pre-trigger-event window.
    delete State.players.inMainBaseByPid[pid];
    clearBoundaryViolationForPid(pid, destroyUi);
}

function clearActiveBoundaryViolationsForAllPlayers(): void {
    const seen: Record<number, boolean> = {};
    forEachValidPlayer((_player, pid) => {
        seen[pid] = true;
        clearBoundaryViolationForPid(pid);
    });

    for (const key in State.hudCache.boundaryPromptCache) {
        const pid = Number(key);
        if (seen[pid]) continue;
        hideBoundaryPromptForPid(pid);
    }

    State.round.boundary.activeViolationByPid = {};
}

