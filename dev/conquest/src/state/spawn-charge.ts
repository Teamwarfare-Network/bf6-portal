// @ts-nocheck
// Module: state/spawn-charge -- Phase 2B spawn-charge reason matrix and transaction safeguards

// Allocates zeroed per-reason counters for deploy attempts/charges.
function newReasonCounterState(): ConquestSpawnChargeReasonCounters {
    return {
        deploy: 0,
        forced_redeploy: 0,
        team_switch: 0,
        admin_move: 0,
        phase_transition: 0,
        reconnect: 0,
        vehicle_deploy: 0,
    };
}

// Increments one reason bucket in a reason-counter map.
function incrementReasonCounter(
    counters: ConquestSpawnChargeReasonCounters,
    reason: ConquestSpawnChargeReason
): void {
    counters[reason] = (counters[reason] ?? 0) + 1;
}

// Encodes reason keys as compact numeric IDs for no-string debug projection.
function getReasonCode(reason: ConquestSpawnChargeReason): number {
    if (reason === "deploy") return 1;
    if (reason === "forced_redeploy") return 2;
    if (reason === "team_switch") return 3;
    if (reason === "admin_move") return 4;
    if (reason === "phase_transition") return 5;
    if (reason === "reconnect") return 6;
    return 7; // vehicle_deploy
}

// Computes total count across all reason buckets in a counter map.
function getReasonCounterTotal(counters: ConquestSpawnChargeReasonCounters): number {
    return counters.deploy
        + counters.forced_redeploy
        + counters.team_switch
        + counters.admin_move
        + counters.phase_transition
        + counters.reconnect
        + counters.vehicle_deploy;
}

// Emits gated debug-world-log snapshots (using existing debug format keys, no new strings).
function maybeEmitDebugSnapshot(reason: ConquestSpawnChargeReason): void {
    const now = Math.floor(mod.GetMatchTimeElapsed());
    if (State.conquest.spawnCharge.lastDebugEmitAtSeconds === now) return;
    State.conquest.spawnCharge.lastDebugEmitAtSeconds = now;

    const deployTotal = getReasonCounterTotal(State.conquest.spawnCharge.deployCountByReason);
    const chargedTotal = getReasonCounterTotal(State.conquest.spawnCharge.chargedCountByReason);
    const reasonDeployCount = State.conquest.spawnCharge.deployCountByReason[reason] ?? 0;
    const reasonChargedCount = State.conquest.spawnCharge.chargedCountByReason[reason] ?? 0;

    sendHighlightedWorldLogMessage(
        mod.Message(
            mod.stringkeys.twl.debug.adminPos,
            deployTotal,
            chargedTotal,
            State.conquest.spawnCharge.duplicateChargeSuspicionCount
        ),
        false,
        undefined,
        mod.stringkeys.twl.debug.adminPos
    );

    sendHighlightedWorldLogMessage(
        mod.Message(
            mod.stringkeys.twl.debug.adminFacing,
            getReasonCode(reason),
            reasonDeployCount,
            reasonChargedCount
        ),
        false,
        undefined,
        mod.stringkeys.twl.debug.adminFacing
    );

    // Reason-code sentinel 90 projects session-identity fallback counters (CF-99/107/108).
    sendHighlightedWorldLogMessage(
        mod.Message(
            mod.stringkeys.twl.debug.adminFacing,
            90,
            State.conquest.spawnCharge.sessionIdentityResetCount,
            State.conquest.spawnCharge.reconnectContinuityDropCount
        ),
        false,
        undefined,
        mod.stringkeys.twl.debug.adminFacing
    );
}

// Ensures per-player deploy transaction state exists for duplicate-charge guards.
function ensureDeployTxn(pid: number): ConquestSpawnChargeTxnState {
    const existing = State.conquest.spawnCharge.deployTxnByPid[pid];
    if (existing) return existing;
    const created: ConquestSpawnChargeTxnState = {
        deploySeq: 0,
        lastChargedDeploySeq: -1,
        lastChargeAtSeconds: -1,
        lastReason: "none",
    };
    State.conquest.spawnCharge.deployTxnByPid[pid] = created;
    return created;
}

// Resolves and clears one pending deploy reason for the next chargeable deploy.
function resolvePendingReason(pid: number): ConquestSpawnChargeReason {
    const pending = State.conquest.spawnCharge.pendingReasonByPid[pid];
    if (pending) {
        delete State.conquest.spawnCharge.pendingReasonByPid[pid];
        return pending;
    }
    return "deploy";
}

// Marks the next deploy reason for a player (team switch/reconnect/etc).
function markNextDeployReason(pid: number, reason: ConquestSpawnChargeReason): void {
    if (pid === undefined || pid === null) return;
    State.conquest.spawnCharge.pendingReasonByPid[pid] = reason;
}

// Clears all per-pid spawn-charge session state to enforce session-scoped identity policy.
function clearPidSessionState(pid: number): void {
    delete State.conquest.spawnCharge.firstLiveSpawnExemptByPid[pid];
    delete State.conquest.spawnCharge.deployTxnByPid[pid];
    delete State.conquest.spawnCharge.pendingReasonByPid[pid];
}

// Tracks how often session identity continuity is intentionally discarded for V1 fallback policy.
function trackIdentityFallbackCounters(hadSessionState: boolean, wasDisconnected: boolean): void {
    if (hadSessionState || wasDisconnected) {
        State.conquest.spawnCharge.sessionIdentityResetCount += 1;
    }
    if (wasDisconnected) {
        State.conquest.spawnCharge.reconnectContinuityDropCount += 1;
    }
}

// Resets all spawn-charge state for a new lifecycle segment.
function resetSpawnChargeState(enable: boolean): void {
    State.conquest.spawnCharge.enabled = enable;
    State.conquest.spawnCharge.firstLiveSpawnExemptByPid = {};
    State.conquest.spawnCharge.deployTxnByPid = {};
    State.conquest.spawnCharge.pendingReasonByPid = {};
    State.conquest.spawnCharge.deployCountByReason = newReasonCounterState();
    State.conquest.spawnCharge.chargedCountByReason = newReasonCounterState();
    State.conquest.spawnCharge.duplicateChargeSuspicionCount = 0;
    State.conquest.spawnCharge.sessionIdentityResetCount = 0;
    State.conquest.spawnCharge.reconnectContinuityDropCount = 0;
    State.conquest.spawnCharge.lastDebugEmitAtSeconds = -1;
}

// Live-start hook: enables spawn-charge and grants first-live-spawn exemption to present players only.
function spawnChargeOnMatchLiveStart(): void {
    resetSpawnChargeState(true);
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!isValidPlayer(p)) continue;
        const pid = safeGetPlayerId(p);
        if (pid === undefined || isPidDisconnected(pid)) continue;
        // First-live-spawn exemption is granted only to players present at round start.
        State.conquest.spawnCharge.firstLiveSpawnExemptByPid[pid] = true;
    }
}

// Non-live hook: disables spawn-charge and clears transactional state.
function spawnChargeOnNotLiveReset(): void {
    resetSpawnChargeState(false);
}

// Join hook: always starts a fresh pid session; reconnects never retain prior exemption/txn continuity.
function onPlayerJoinSpawnCharge(pid: number, wasDisconnected: boolean): void {
    const hadSessionState =
        State.conquest.spawnCharge.firstLiveSpawnExemptByPid[pid] !== undefined
        || State.conquest.spawnCharge.deployTxnByPid[pid] !== undefined
        || State.conquest.spawnCharge.pendingReasonByPid[pid] !== undefined;
    clearPidSessionState(pid);
    trackIdentityFallbackCounters(hadSessionState, wasDisconnected);
    if (isMatchLive()) {
        if (wasDisconnected) {
            // Reconnect deploys are chargeable and do not regain first-live-spawn exemption in this match.
            markNextDeployReason(pid, "reconnect");
            maybeEmitDebugSnapshot("reconnect");
        }
    }
}

// Leave hook: drops session-scoped spawn-charge state for the departing pid.
function onPlayerLeaveSpawnCharge(pid: number): void {
    clearPidSessionState(pid);
}

// Deploy hook: enforces Phase 2B charge policy with first-spawn exemption and duplicate-charge guards.
function onPlayerDeployedSpawnCharge(eventPlayer: mod.Player, wasAlreadyDeployed: boolean): void {
    if (!isValidPlayer(eventPlayer)) return;
    if (!isMatchLive()) return;
    if (!State.conquest.spawnCharge.enabled) return;
    if (State.conquest.endRace.endLatched) return;

    const pid = safeGetPlayerId(eventPlayer);
    if (pid === undefined) return;

    const reason = resolvePendingReason(pid);
    incrementReasonCounter(State.conquest.spawnCharge.deployCountByReason, reason);

    // Exempt voluntary UX-driven redeploys: alive-on-foot vehicle deploy and team-swap.
    // Death-respawn / forced-redeploy / admin-move / phase-transition / reconnect still charge.
    if (reason === "vehicle_deploy" || reason === "team_switch") return;

    if (wasAlreadyDeployed) {
        // Duplicate deploy event for a still-deployed player; track suspicion and avoid double-charge.
        State.conquest.spawnCharge.duplicateChargeSuspicionCount += 1;
        maybeEmitDebugSnapshot(reason);
        return;
    }

    const txn = ensureDeployTxn(pid);
    txn.deploySeq += 1;
    txn.lastReason = reason;

    if (State.conquest.spawnCharge.firstLiveSpawnExemptByPid[pid]) {
        State.conquest.spawnCharge.firstLiveSpawnExemptByPid[pid] = false;
        return;
    }

    const chargePerDeploy = Math.max(0, Math.floor(State.conquest.spawnCharge.chargePerDeploy));
    if (chargePerDeploy <= 0) return;

    if (txn.lastChargedDeploySeq === txn.deploySeq) {
        State.conquest.spawnCharge.duplicateChargeSuspicionCount += 1;
        maybeEmitDebugSnapshot(reason);
        return;
    }

    const teamNum = safeGetTeamNumberFromPlayer(eventPlayer, 0);
    if (teamNum !== TeamID.Team1 && teamNum !== TeamID.Team2) return;

    const changed = applyTicketDelta(teamNum, -chargePerDeploy);
    if (!changed) return;

    txn.lastChargedDeploySeq = txn.deploySeq;
    txn.lastChargeAtSeconds = Math.floor(mod.GetMatchTimeElapsed());
    incrementReasonCounter(State.conquest.spawnCharge.chargedCountByReason, reason);
    mirrorTicketsToEngineScore();
    checkEndCondition();
    updateConquestCombatHudForAllPlayers(true);
    maybeEmitDebugSnapshot(reason);
}

