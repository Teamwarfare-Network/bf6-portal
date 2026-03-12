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
    State.conquest.capture.engagedObjIdByPid = {};
    State.conquest.debug.hudEnabled = true;
    // Reset mode override each startup so one fail-safe event cannot hide combat HUD across restarts.
    State.conquest.debug.hudModeOverride = undefined;
    State.conquest.debug.hudLastUpdatedAtSeconds = -1;
    State.conquest.debug.hudDirty = true;
    State.conquest.debug.hudRenderBucketByPid = {};
    State.conquest.debug.hudRenderBurstByPid = {};
    State.conquest.debug.hudRenderDuplicateBurstByPid = {};
    State.conquest.debug.teamSwapRefreshTokenByPid = {};
    State.conquest.debug.teamSwapHudResetPendingByPid = {};
    State.conquest.debug.perspectiveTeamByPid = {};
    State.conquest.debug.teamSwapPerspectiveLockUntilByPid = {};
    State.conquest.debug.engageHiddenUntilDeployByPid = {};
    State.conquest.debug.bleedPulseQueueLeftByPid = {};
    State.conquest.debug.bleedPulseQueueRightByPid = {};
    State.conquest.debug.bleedPulseActiveSideByPid = {};
    State.conquest.debug.bleedPulseStepByPid = {};
    State.conquest.debug.bleedPulseLimitByPid = {};
    State.conquest.debug.bleedPulsePhaseByPid = {};
    State.conquest.debug.bleedPulseNextAtByPid = {};
    State.conquest.debug.hudStatusVmByPid = {};
    State.conquest.debug.hudHelpReadyVmByPid = {};
    State.conquest.debug.hudClockVmByPid = {};
}
