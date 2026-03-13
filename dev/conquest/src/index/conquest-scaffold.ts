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
    State.conquest.sound.enabled = CONQUEST_CAPTURE_SOUND_ENABLED;
    State.conquest.sound.captureTickFriendlyHandle = undefined;
    State.conquest.sound.captureTickEnemyHandle = undefined;
    State.conquest.sound.handlesReady = false;
    State.conquest.sound.queue = [];
    State.conquest.sound.lastFlushAtSeconds = -1;
    State.conquest.sound.lastEventAtByThrottleKey = {};
    State.conquest.sound.debug.queuedCount = 0;
    State.conquest.sound.debug.coalescedCount = 0;
    State.conquest.sound.debug.dispatchedCount = 0;
    State.conquest.sound.debug.dispatchedFriendlyCount = 0;
    State.conquest.sound.debug.dispatchedEnemyCount = 0;
    State.conquest.sound.debug.suppressedCount = 0;
    State.conquest.sound.debug.suppressedThrottleCount = 0;
    State.conquest.sound.debug.droppedNoHandleCount = 0;
    State.conquest.sound.debug.droppedNoRecipientCount = 0;
    State.conquest.sound.debug.droppedInvalidEventCount = 0;
    State.conquest.sound.debug.spawnFailureCount = 0;
    State.conquest.sound.debug.lastQueueDepth = 0;
    State.conquest.sound.debug.maxQueueDepth = 0;
    State.conquest.sound.debug.lastRecipientCount = 0;
    State.conquest.sound.debug.lastFlushQueuedCount = 0;
    State.conquest.sound.debug.lastFlushDispatchedCount = 0;
    State.conquest.sound.debug.lastFlushSuppressedCount = 0;
    State.conquest.sound.debug.lastFlushDroppedCount = 0;
    State.conquest.sound.debug.lastEventObjId = 0;
    State.conquest.sound.debug.lastEventSourceTeamId = 0;
    State.conquest.sound.debug.lastEventQueuedAtSeconds = -1;
    State.conquest.sound.debug.lastDispatchedAtSeconds = -1;
    State.conquest.sound.debug.playerCleanupCount = 0;
    State.conquest.sound.debug.lastCleanupPid = 0;
    State.conquest.vo.enabled = CONQUEST_CAPTURE_VO_ENABLED;
    State.conquest.vo.runtimeHandleByPid = {};
    State.conquest.vo.handlesReadyByPid = {};
    State.conquest.vo.queue = [];
    State.conquest.vo.lastFlushAtSeconds = -1;
    State.conquest.vo.lastEventAtByThrottleKey = {};
    State.conquest.vo.objectiveStateByObjId = {};
    State.conquest.vo.recentActiveObjIdByPid = {};
    State.conquest.vo.recentActiveAtSecondsByPid = {};
    State.conquest.vo.debug.queuedCount = 0;
    State.conquest.vo.debug.coalescedCount = 0;
    State.conquest.vo.debug.dispatchedCount = 0;
    State.conquest.vo.debug.suppressedCount = 0;
    State.conquest.vo.debug.droppedNoHandleCount = 0;
    State.conquest.vo.debug.droppedNoRecipientCount = 0;
    State.conquest.vo.debug.droppedInvalidEventCount = 0;
    State.conquest.vo.debug.droppedNoFlagCount = 0;
    State.conquest.vo.debug.spawnFailureCount = 0;
    State.conquest.vo.debug.lastQueueDepth = 0;
    State.conquest.vo.debug.maxQueueDepth = 0;
    State.conquest.vo.debug.lastRecipientCount = 0;
    State.conquest.vo.debug.lastFlushQueuedCount = 0;
    State.conquest.vo.debug.lastFlushDispatchedCount = 0;
    State.conquest.vo.debug.lastFlushSuppressedCount = 0;
    State.conquest.vo.debug.lastFlushDroppedCount = 0;
    State.conquest.vo.debug.lastEventKey = "none";
    State.conquest.vo.debug.lastEventObjId = 0;
    State.conquest.vo.debug.lastEventSourceTeamId = 0;
    State.conquest.vo.debug.lastEventQueuedAtSeconds = -1;
    State.conquest.vo.debug.lastDispatchedAtSeconds = -1;
    State.conquest.vo.debug.playerCleanupCount = 0;
    State.conquest.vo.debug.lastCleanupPid = 0;
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
