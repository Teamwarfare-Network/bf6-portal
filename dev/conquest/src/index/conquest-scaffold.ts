// @ts-nocheck
// Module: index/conquest-scaffold -- Phase 1 conquest state reset/wiring seam

// Resets conquest runtime scaffold fields to a known baseline before map/live flow starts.
function initializeConquestPhase1Scaffold(): void {
    cleanupSoundRuntimeHandles();
    cleanupAllVoiceOverRuntimeHandles();
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
        vehicle_deploy: 0,
    };
    State.conquest.spawnCharge.chargedCountByReason = {
        deploy: 0,
        forced_redeploy: 0,
        team_switch: 0,
        admin_move: 0,
        phase_transition: 0,
        reconnect: 0,
        vehicle_deploy: 0,
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
    State.conquest.sound.enabled = CONQUEST_CAPTURE_SOUND_ENABLED;
    State.conquest.sound.captureTickFriendlyHandle = undefined;
    State.conquest.sound.captureTickEnemyHandle = undefined;
    State.conquest.sound.handlesReady = false;
    State.conquest.sound.queue = [];
    State.conquest.sound.lastFlushAtSeconds = -1;
    State.conquest.sound.lastEventAtByThrottleKey = {};
    State.conquest.vo.enabled = CONQUEST_CAPTURE_VO_ENABLED;
    State.conquest.vo.runtimeHandleByPid = {};
    State.conquest.vo.handlesReadyByPid = {};
    State.conquest.vo.queue = [];
    State.conquest.vo.lastFlushAtSeconds = -1;
    State.conquest.vo.lastEventAtByThrottleKey = {};
    State.conquest.vo.objectiveStateByObjId = {};
    State.conquest.vo.recentActiveObjIdByPid = {};
    State.conquest.vo.recentActiveAtSecondsByPid = {};
    State.conquest.debug.hudEnabled = true;
    // Reset mode override each startup so one fail-safe event cannot hide combat HUD across restarts.
    State.conquest.debug.hudModeOverride = undefined;
    State.conquest.debug.hudLastUpdatedAtSeconds = -1;
    State.conquest.debug.hudDirty = true;
    State.conquest.debug.teamSwapRefreshTokenByPid = {};
    State.conquest.debug.teamSwapHudResetPendingByPid = {};
    State.conquest.debug.perspectiveTeamByPid = {};
    State.conquest.debug.teamSwapPerspectiveLockUntilByPid = {};
    State.conquest.debug.engageHiddenUntilDeployByPid = {};
    State.conquest.debug.hudStatusVmByPid = {};
    State.conquest.debug.hudHelpReadyVmByPid = {};
    State.conquest.debug.hudClockVmByPid = {};
    State.round.smk = {};
    State.round.asg = {};
    State.round.asgL = {};
}

