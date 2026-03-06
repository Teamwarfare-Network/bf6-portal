// @ts-nocheck
// Module: index/conquest-scaffold -- Phase 1 conquest state reset/wiring seam

// Resets conquest runtime scaffold fields to a known baseline before map/live flow starts.
function initializeConquestPhase1Scaffold(): void {
    State.conquest.lifecyclePhase = "NOT_READY";
    State.conquest.tickets.team1 = CONQUEST_STARTING_TICKETS;
    State.conquest.tickets.team2 = CONQUEST_STARTING_TICKETS;
    State.conquest.bleed.enabled = true;
    State.conquest.bleed.lastTickSeconds = -1;
    State.conquest.bleed.perDiffPerSecond = CONQUEST_BLEED_PER_DIFF_PER_SECOND;
    State.conquest.bleed.carryTeam1 = 0;
    State.conquest.bleed.carryTeam2 = 0;
    State.conquest.spawnCharge.enabled = false;
    State.conquest.spawnCharge.chargePerDeploy = CONQUEST_SPAWN_CHARGE_PER_DEPLOY;
    State.conquest.spawnCharge.firstLiveSpawnExemptByPid = {};
    State.conquest.spawnCharge.deployTxnByPid = {};
    State.conquest.spawnCharge.pendingReasonByPid = {};
    State.conquest.spawnCharge.deployCountByReason = {
        deploy: 0,
        forced_redeploy: 0,
        team_switch: 0,
        admin_move: 0,
        phase_transition: 0,
        reconnect: 0,
    };
    State.conquest.spawnCharge.chargedCountByReason = {
        deploy: 0,
        forced_redeploy: 0,
        team_switch: 0,
        admin_move: 0,
        phase_transition: 0,
        reconnect: 0,
    };
    State.conquest.spawnCharge.duplicateChargeSuspicionCount = 0;
    State.conquest.spawnCharge.sessionIdentityResetCount = 0;
    State.conquest.spawnCharge.reconnectContinuityDropCount = 0;
    State.conquest.spawnCharge.lastDebugEmitAtSeconds = -1;
    State.conquest.endRace.endLatched = false;
    State.conquest.endRace.endReason = undefined;
    State.conquest.endRace.endSnapshot = undefined;
    State.conquest.capture.byObjId = {};
    State.conquest.capture.mappedObjIdsInOrder = [];
    State.conquest.capture.lastUnmappedObjId = undefined;
    State.conquest.capture.unmappedSeenCount = 0;
    State.conquest.capture.visualByObjId = {};
    State.conquest.debug.hudEnabled = true;
    State.conquest.debug.hudLastUpdatedAtSeconds = -1;
    State.conquest.debug.hudDirty = true;
}
