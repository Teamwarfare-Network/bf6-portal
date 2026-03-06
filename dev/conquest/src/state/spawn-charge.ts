// @ts-nocheck
// Module: state/spawn-charge -- Phase 2B spawn-charge reason matrix and transaction safeguards

// Allocates zeroed per-reason counters for deploy attempts/charges.
function conquestPhase2BNewReasonCounterState(): ConquestSpawnChargeReasonCounters {
    return {
        deploy: 0,
        forced_redeploy: 0,
        team_switch: 0,
        admin_move: 0,
        phase_transition: 0,
        reconnect: 0,
    };
}

// Increments one reason bucket in a reason-counter map.
function conquestPhase2BIncrementReasonCounter(
    counters: ConquestSpawnChargeReasonCounters,
    reason: ConquestSpawnChargeReason
): void {
    counters[reason] = (counters[reason] ?? 0) + 1;
}

// Encodes reason keys as compact numeric IDs for no-string debug projection.
function conquestPhase2BGetReasonCode(reason: ConquestSpawnChargeReason): number {
    if (reason === 'deploy') return 1;
    if (reason === 'forced_redeploy') return 2;
    if (reason === 'team_switch') return 3;
    if (reason === 'admin_move') return 4;
    if (reason === 'phase_transition') return 5;
    return 6; // reconnect
}

// Computes total count across all reason buckets in a counter map.
function conquestPhase2BGetReasonCounterTotal(counters: ConquestSpawnChargeReasonCounters): number {
    return (
        counters.deploy +
        counters.forced_redeploy +
        counters.team_switch +
        counters.admin_move +
        counters.phase_transition +
        counters.reconnect
    );
}

// Emits gated debug-world-log snapshots (using existing debug format keys, no new strings).
function conquestPhase2BMaybeEmitDebugSnapshot(reason: ConquestSpawnChargeReason): void {
    const now = Math.floor(mod.GetMatchTimeElapsed());
    if (State.conquest.spawnCharge.lastDebugEmitAtSeconds === now) return;
    State.conquest.spawnCharge.lastDebugEmitAtSeconds = now;

    const deployTotal = conquestPhase2BGetReasonCounterTotal(State.conquest.spawnCharge.deployCountByReason);
    const chargedTotal = conquestPhase2BGetReasonCounterTotal(State.conquest.spawnCharge.chargedCountByReason);
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
            conquestPhase2BGetReasonCode(reason),
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
function conquestPhase2BEnsureDeployTxn(pid: number): ConquestSpawnChargeTxnState {
    const existing = State.conquest.spawnCharge.deployTxnByPid[pid];
    if (existing) return existing;
    const created: ConquestSpawnChargeTxnState = {
        deploySeq: 0,
        lastChargedDeploySeq: -1,
        lastChargeAtSeconds: -1,
        lastReason: 'none',
    };
    State.conquest.spawnCharge.deployTxnByPid[pid] = created;
    return created;
}

// Resolves and clears one pending deploy reason for the next chargeable deploy.
function conquestPhase2BResolvePendingReason(pid: number): ConquestSpawnChargeReason {
    const pending = State.conquest.spawnCharge.pendingReasonByPid[pid];
    if (pending) {
        delete State.conquest.spawnCharge.pendingReasonByPid[pid];
        return pending;
    }
    return 'deploy';
}

// Marks the next deploy reason for a player (team switch/reconnect/etc).
function conquestPhase2BMarkNextDeployReason(pid: number, reason: ConquestSpawnChargeReason): void {
    if (pid === undefined || pid === null) return;
    State.conquest.spawnCharge.pendingReasonByPid[pid] = reason;
}

// Clears all per-pid spawn-charge session state to enforce session-scoped identity policy.
function conquestPhase2BClearPidSessionState(pid: number): void {
    delete State.conquest.spawnCharge.firstLiveSpawnExemptByPid[pid];
    delete State.conquest.spawnCharge.deployTxnByPid[pid];
    delete State.conquest.spawnCharge.pendingReasonByPid[pid];
}

// Tracks how often session identity continuity is intentionally discarded for V1 fallback policy.
function conquestPhase2BTrackIdentityFallbackCounters(hadSessionState: boolean, wasDisconnected: boolean): void {
    if (hadSessionState || wasDisconnected) {
        State.conquest.spawnCharge.sessionIdentityResetCount += 1;
    }
    if (wasDisconnected) {
        State.conquest.spawnCharge.reconnectContinuityDropCount += 1;
    }
}

// Resets all spawn-charge state for a new lifecycle segment.
function conquestPhase2BResetSpawnChargeState(enable: boolean): void {
    State.conquest.spawnCharge.enabled = enable;
    State.conquest.spawnCharge.firstLiveSpawnExemptByPid = {};
    State.conquest.spawnCharge.deployTxnByPid = {};
    State.conquest.spawnCharge.pendingReasonByPid = {};
    State.conquest.spawnCharge.deployCountByReason = conquestPhase2BNewReasonCounterState();
    State.conquest.spawnCharge.chargedCountByReason = conquestPhase2BNewReasonCounterState();
    State.conquest.spawnCharge.duplicateChargeSuspicionCount = 0;
    State.conquest.spawnCharge.sessionIdentityResetCount = 0;
    State.conquest.spawnCharge.reconnectContinuityDropCount = 0;
    State.conquest.spawnCharge.lastDebugEmitAtSeconds = -1;
}

// Live-start hook: enables spawn-charge and grants first-live-spawn exemption to present players only.
function conquestPhase2BOnMatchLiveStart(): void {
    conquestPhase2BResetSpawnChargeState(true);
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const pid = safeGetPlayerId(p);
        if (pid === undefined || isPidDisconnected(pid)) continue;
        // First-live-spawn exemption is granted only to players present at round start.
        State.conquest.spawnCharge.firstLiveSpawnExemptByPid[pid] = true;
    }
}

// Non-live hook: disables spawn-charge and clears transactional state.
function conquestPhase2BOnNotLiveReset(): void {
    conquestPhase2BResetSpawnChargeState(false);
}

// Join hook: always starts a fresh pid session; reconnects never retain prior exemption/txn continuity.
function conquestPhase2BOnPlayerJoin(pid: number, wasDisconnected: boolean): void {
    const hadSessionState =
        State.conquest.spawnCharge.firstLiveSpawnExemptByPid[pid] !== undefined ||
        State.conquest.spawnCharge.deployTxnByPid[pid] !== undefined ||
        State.conquest.spawnCharge.pendingReasonByPid[pid] !== undefined;
    conquestPhase2BClearPidSessionState(pid);
    conquestPhase2BTrackIdentityFallbackCounters(hadSessionState, wasDisconnected);
    if (isMatchLive()) {
        if (wasDisconnected) {
            // Reconnect deploys are chargeable and do not regain first-live-spawn exemption in this match.
            conquestPhase2BMarkNextDeployReason(pid, 'reconnect');
            conquestPhase2BMaybeEmitDebugSnapshot('reconnect');
        }
    }
}

// Leave hook: drops session-scoped spawn-charge state for the departing pid.
function conquestPhase2BOnPlayerLeave(pid: number): void {
    conquestPhase2BClearPidSessionState(pid);
}

// Deploy hook: enforces Phase 2B charge policy with first-spawn exemption and duplicate-charge guards.
function conquestPhase2BOnPlayerDeployed(eventPlayer: mod.Player, wasAlreadyDeployed: boolean): void {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    if (!isMatchLive()) return;
    if (!State.conquest.spawnCharge.enabled) return;
    if (State.conquest.endRace.endLatched) return;

    const pid = safeGetPlayerId(eventPlayer);
    if (pid === undefined) return;

    const reason = conquestPhase2BResolvePendingReason(pid);
    conquestPhase2BIncrementReasonCounter(State.conquest.spawnCharge.deployCountByReason, reason);

    if (wasAlreadyDeployed) {
        // Duplicate deploy event for a still-deployed player; track suspicion and avoid double-charge.
        State.conquest.spawnCharge.duplicateChargeSuspicionCount += 1;
        conquestPhase2BMaybeEmitDebugSnapshot(reason);
        return;
    }

    const txn = conquestPhase2BEnsureDeployTxn(pid);
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
        conquestPhase2BMaybeEmitDebugSnapshot(reason);
        return;
    }

    const teamNum = safeGetTeamNumberFromPlayer(eventPlayer, 0);
    if (teamNum !== TeamID.Team1 && teamNum !== TeamID.Team2) return;

    const changed = conquestPhase2AApplyTicketDelta(teamNum, -chargePerDeploy);
    if (!changed) return;

    txn.lastChargedDeploySeq = txn.deploySeq;
    txn.lastChargeAtSeconds = Math.floor(mod.GetMatchTimeElapsed());
    conquestPhase2BIncrementReasonCounter(State.conquest.spawnCharge.chargedCountByReason, reason);
    conquestPhase2AMirrorTicketsToEngineScore();
    conquestPhase2ACheckEndCondition();
    updateConquestPhase2ADebugHudForAllPlayers(true);
    conquestPhase2BMaybeEmitDebugSnapshot(reason);
}
