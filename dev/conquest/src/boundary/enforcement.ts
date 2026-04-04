// @ts-nocheck
// Module: boundary/enforcement -- boundary occupancy, prompt, and kill-timer enforcement

const PRELIVE_MAIN_BASE_KILL_SECONDS = 10;
const ENEMY_MAIN_BASE_BUFFER_KILL_SECONDS = 3;
const GROUND_COMBAT_ZONE_KILL_SECONDS = 10;
const PRELIVE_MAIN_BASE_WARNING_DELAY_SECONDS = 0.35;
const LIVE_BOUNDARY_WARNING_DELAY_SECONDS = 0.2;
const BOUNDARY_WARNING_ALARM_AMPLITUDE = 80;

function getBoundaryDurationSeconds(kind: BoundaryPromptKind): number {
    switch (kind) {
        case "prelive_main_base":
            return PRELIVE_MAIN_BASE_KILL_SECONDS;
        case "enemy_main_base_buffer":
            return ENEMY_MAIN_BASE_BUFFER_KILL_SECONDS;
        case "ground_combat_zone":
            return GROUND_COMBAT_ZONE_KILL_SECONDS;
        default:
            return GROUND_COMBAT_ZONE_KILL_SECONDS;
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

function getEnemyMainBaseBufferTriggerIdForPlayerTeam(teamId: TeamID | 0): number | undefined {
    const enemyTeamId = getEnemyTeamId(teamId);
    if (enemyTeamId !== TeamID.Team1 && enemyTeamId !== TeamID.Team2) return undefined;
    return getMainBaseBufferTriggerIdForTeam(enemyTeamId as TeamID);
}

function getEnemyMainBaseTriggerIdForPlayerTeam(teamId: TeamID | 0): number | undefined {
    const enemyTeamId = getEnemyTeamId(teamId);
    if (enemyTeamId !== TeamID.Team1 && enemyTeamId !== TeamID.Team2) return undefined;
    return getMainBaseTriggerIdForTeam(enemyTeamId as TeamID);
}

// Enemy protected territory is the union of the enemy main-base core and overlapping buffer triggers.
function isPlayerInEnemyProtectedZone(pid: number): boolean {
    return State.round.boundary.inEnemyMainBaseBufferByPid[pid] === true
        || State.round.boundary.inEnemyMainBaseCoreByPid[pid] === true;
}

function isPlayerProtectedByOwnMainBaseState(pid: number): boolean {
    return State.players.inMainBaseByPid[pid] === true;
}

function isPlayerGroundCombatZoneExempt(player: mod.Player, pid: number): boolean {
    if (isPlayerProtectedByOwnMainBaseState(pid)) return true;

    const seatedVehicle = safeGetVehicleFromPlayer(player);
    if (seatedVehicle && isAircraftVehicleInstance(seatedVehicle)) return true;
    return false;
}

function getDesiredBoundaryViolationKind(player: mod.Player): BoundaryPromptKind | undefined {
    if (!player || !mod.IsPlayerValid(player)) return undefined;
    if (!isPlayerDeployed(player)) return undefined;
    if (!isPlayerAliveForBoundary(player)) return undefined;
    if (State.match.isEnded) return undefined;

    const pid = safeGetPlayerId(player);
    if (pid === undefined) return undefined;

    if (!isMatchLive() && !isPlayerInMainBaseForReady(pid)) {
        return "prelive_main_base";
    }

    const teamId = safeGetTeamNumberFromPlayer(player, 0);
    if (isMatchLive() && isPlayerInEnemyProtectedZone(pid)) {
        return "enemy_main_base_buffer";
    }

    const groundCombatZoneTriggerId = getGroundCombatZoneTriggerId();
    if (
        groundCombatZoneTriggerId !== undefined
        && State.round.boundary.inGroundCombatZoneByPid[pid] === false
        && !isPlayerGroundCombatZoneExempt(player, pid)
    ) {
        return "ground_combat_zone";
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
        State.round.boundary.activeViolationByPid[pid] = {
            kind: nextKind,
            startedAtSeconds: now,
            expiresAtSeconds: now + getBoundaryDurationSeconds(nextKind),
            alarmPlayed: false,
        };
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

function refreshBoundaryStateForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const player = mod.ValueInArray(players, i) as mod.Player;
        if (!player || !mod.IsPlayerValid(player)) continue;
        refreshPlayerBoundaryState(player);
    }
}

function tickBoundaryEnforcement(): void {
    if (State.match.isEnded) {
        clearActiveBoundaryViolationsForAllPlayers();
        return;
    }
    refreshBoundaryStateForAllPlayers();
}

function onPlayerEnterBoundaryAreaTrigger(player: mod.Player, areaTrigger: mod.AreaTrigger): void {
    if (!player || !mod.IsPlayerValid(player)) return;
    const pid = safeGetPlayerId(player);
    const triggerId = safeGetObjId(areaTrigger);
    if (pid === undefined || triggerId === undefined) return;

    if (triggerId === getGroundCombatZoneTriggerId()) {
        State.round.boundary.inGroundCombatZoneByPid[pid] = true;
    }

    const teamId = safeGetTeamNumberFromPlayer(player, 0);
    const enemyMainBaseTriggerId = getEnemyMainBaseTriggerIdForPlayerTeam(teamId);
    if (enemyMainBaseTriggerId !== undefined && triggerId === enemyMainBaseTriggerId) {
        State.round.boundary.inEnemyMainBaseCoreByPid[pid] = true;
    }

    const enemyBufferTriggerId = getEnemyMainBaseBufferTriggerIdForPlayerTeam(teamId);
    if (enemyBufferTriggerId !== undefined && triggerId === enemyBufferTriggerId) {
        State.round.boundary.inEnemyMainBaseBufferByPid[pid] = true;
    }

    refreshPlayerBoundaryState(player);
}

function onPlayerExitBoundaryAreaTrigger(player: mod.Player, areaTrigger: mod.AreaTrigger): void {
    if (!player || !mod.IsPlayerValid(player)) return;
    const pid = safeGetPlayerId(player);
    const triggerId = safeGetObjId(areaTrigger);
    if (pid === undefined || triggerId === undefined) return;

    if (triggerId === getGroundCombatZoneTriggerId()) {
        State.round.boundary.inGroundCombatZoneByPid[pid] = false;
    }

    const teamId = safeGetTeamNumberFromPlayer(player, 0);
    const enemyMainBaseTriggerId = getEnemyMainBaseTriggerIdForPlayerTeam(teamId);
    if (enemyMainBaseTriggerId !== undefined && triggerId === enemyMainBaseTriggerId) {
        State.round.boundary.inEnemyMainBaseCoreByPid[pid] = false;
    }

    const enemyBufferTriggerId = getEnemyMainBaseBufferTriggerIdForPlayerTeam(teamId);
    if (enemyBufferTriggerId !== undefined && triggerId === enemyBufferTriggerId) {
        State.round.boundary.inEnemyMainBaseBufferByPid[pid] = false;
    }

    refreshPlayerBoundaryState(player);
}

function resetPlayerBoundaryStateOnDeploy(player: mod.Player, pid: number): void {
    State.round.boundary.inEnemyMainBaseCoreByPid[pid] = false;
    State.round.boundary.inEnemyMainBaseBufferByPid[pid] = false;
    State.round.boundary.inGroundCombatZoneByPid[pid] = true;
    clearBoundaryViolationForPid(pid);
    if (!player || !mod.IsPlayerValid(player)) return;
    refreshPlayerBoundaryState(player);
}

function resetPlayerBoundaryStateOnUndeployOrReset(pid: number, destroyUi: boolean = false): void {
    delete State.round.boundary.inEnemyMainBaseCoreByPid[pid];
    delete State.round.boundary.inEnemyMainBaseBufferByPid[pid];
    delete State.round.boundary.inGroundCombatZoneByPid[pid];
    clearBoundaryViolationForPid(pid, destroyUi);
}

function clearActiveBoundaryViolationsForAllPlayers(): void {
    const seen: Record<number, boolean> = {};
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const player = mod.ValueInArray(players, i) as mod.Player;
        if (!player || !mod.IsPlayerValid(player)) continue;
        const pid = safeGetPlayerId(player);
        if (pid === undefined) continue;
        seen[pid] = true;
        clearBoundaryViolationForPid(pid);
    }

    for (const key in State.hudCache.boundaryPromptCache) {
        const pid = Number(key);
        if (seen[pid]) continue;
        hideBoundaryPromptForPid(pid);
    }

    State.round.boundary.activeViolationByPid = {};
}

