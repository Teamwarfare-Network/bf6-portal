// @ts-nocheck
// Module: index/player-join-leave -- join/leave lifecycle handlers and join-time UI reset

//#region -------------------- Exported Event Handlers - Player Join + Leave --------------------

function resetUiForPlayerOnJoin(player: mod.Player): void {
    if (!isValidPlayer(player)) return;
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return;

    if (FEATURE_PERF_DIAG) resetUiCachePerfCountersForPid(pid);
    setUIInputModeForPlayer(player, false);
    resetVehicleDeployLiveMenuStateForPid(pid);
    resetArmState(pid);
    cleanupWorldInteractableRuntimeIconsForPid(pid);
    hideReadyDialogUI(pid);
    destroyArmMenu(pid);

    // Wave 6 Ship 0: pid-namespaced widget IDs via wn() can only produce duplicates if a prior
    // cleanup was interrupted mid-loop. 4 passes is 4x tolerance for that case; common path is 1-2.
    const deleteAllByName = (name: string, maxPasses: number = 4): void => {
        for (let i = 0; i < maxPasses; i++) {
            const widget = safeFind(name);
            if (!widget) return;
            try {
                mod.DeleteUIWidget(widget);
            } catch {
                return;
            }
        }
    };
    deleteAllByName(wn("TwlConquestStatusDockRoot", pid));
    deleteAllByName(wn("TwlConquestStatusDockState", pid));
    deleteAllByName(wn("TwlConquestStatusDockReady", pid));
    deleteVehicleDeployTimerHudArtifactsForPid(pid);
    // v1.471 Phase B: vehicleDeployTimerCache delete relocated to onPlayerJoinGameImpl sync
    // prelude (before the 100ms await) to close a race against runRoundStartDelayHudLoop.
    destroyBoundaryPromptUiForPid(pid);
}

function cleanupHudForPid(pid: number): void {
    // Wave 6 Ship 0: see Wave 6 plan L1. Same rationale as resetUiForPlayerOnJoin's local copy.
    const deleteAllByName = (name: string, maxPasses: number = 4): void => {
        for (let i = 0; i < maxPasses; i++) {
            const widget = safeFind(name);
            if (!widget) return;
            try {
                mod.DeleteUIWidget(widget);
            } catch {
                return;
            }
        }
    };

    twlConquestHudDestroyPlayer(pid);

    const rootNames = [
        wn("TopHudRoot", pid),
        wn("ConquestTopCenterAuxRoot", pid),
        wn("Container_HelpText", pid),
        wn("HelpText", pid),
        wn("Upper_Left_Container", pid),
        wn("TwlConquestStatusDockRoot", pid),
        wn("TwlConquestStatusDockState", pid),
        wn("TwlConquestStatusDockReady", pid),
        wn("AdminPanelActionCount", pid),
        wn("VictoryDialogRoot", pid),
        wn("MatchTimerRoot", pid),
        wn("VehicleDeployTimerHudRoot", pid),
        wn("PregameCountdownText", pid),
    ];
    for (const name of rootNames) {
        deleteAllByName(name);
    }
    deleteVehicleDeployTimerHudArtifactsForPid(pid);
    resetVehicleDeployPrimaryClickTrackerForPid(pid);
    resetAdminPanelPrimaryClickTrackerForPid(pid);
    resetReadyDialogPrimaryClickTrackerForPid(pid);
    resetPlayerReadyPanelPrimaryClickTrackerForPid(pid);
    // v1.466: defensive paired enable for the per-player engine-deploy block. Claim-clear paths
    // in hq-deploy.ts normally handle this, but if a player disconnects with a stale per-player
    // deploy block and Portal recycles their pid to a new joiner, the new joiner would inherit
    // the stuck-on-deploy-screen state. Idempotent: safe to call when no block was set.
    setVehicleDeployEngineDeployBlockForPid(pid, false);
    destroyBoundaryPromptUiForPid(pid);
    destroyPlayerReadyPanelForPid(pid);
    DelayBroadcast.destroyDelayBroadcastWidgetForPid(pid);
    resetTopHudRootInitializationForPid(pid);

    delete State.hudCache.clockWidgetCache[pid];
    delete State.hudCache.countdownWidgetCache[pid];
    delete State.hudCache.vehicleDeployTimerCache[pid];
    delete State.hudCache.topHudShellByPid[pid];
    delete State.conquest.debug.hudGenerationByPid[pid];
    delete State.conquest.debug.combatHudGenerationByPid[pid];
    delete State.conquest.debug.teamSwapRefreshTokenByPid[pid];
    delete State.conquest.debug.teamSwapHudResetPendingByPid[pid];
    delete State.conquest.debug.perspectiveTeamByPid[pid];
    delete State.conquest.debug.teamSwapPerspectiveLockUntilByPid[pid];
    delete State.conquest.debug.engageHiddenUntilDeployByPid[pid];
    delete State.conquest.debug.hudStatusVmByPid[pid];
    delete State.conquest.debug.hudHelpReadyVmByPid[pid];
    delete State.conquest.debug.hudClockVmByPid[pid];
}

// Initializes per-pid state and triggers the lazy-build cohort. With the loading gate deleted in
// Wave 3 Ship 8 (v1.418), surfaces build via their dispatcher triggers and complete in the same
// JS execution slice; the player lands directly on deploy screen without a loading-overlay window.
async function onPlayerJoinGameImpl(eventPlayer: mod.Player) {
    initReadyDialogData(eventPlayer);
    const joinPid = safeGetPlayerId(eventPlayer);
    const wasDisconnected = joinPid !== undefined && State.players.disconnectedByPid[joinPid] === true;
    if (joinPid !== undefined) {
        resetPlayerBoundaryStateOnUndeployOrReset(joinPid, true);
        delete State.players.disconnectedByPid[joinPid];
        State.players.deployedByPid[joinPid] = false;
        delete State.players.readyNeedsReconfirmByPid[joinPid];
        State.conquest.debug.teamSwapHudResetPendingByPid[joinPid] = false;
        State.conquest.debug.teamSwapRefreshTokenByPid[joinPid] = 0;
        State.conquest.debug.engageHiddenUntilDeployByPid[joinPid] = true;
        delete State.conquest.capture.engagedObjIdByPid[joinPid];
        captureSoundOnPlayerLeaveOrResetPid(joinPid);
        captureVoOnPlayerLeaveOrResetPid(joinPid);
        const joinTeamNum = safeGetTeamNumberFromPlayer(eventPlayer, 0);
        if (joinTeamNum === TeamID.Team1 || joinTeamNum === TeamID.Team2) {
            State.conquest.debug.perspectiveTeamByPid[joinPid] = joinTeamNum;
        }
        onPlayerJoinSpawnCharge(joinPid, wasDisconnected);
        // v1.471 Phase B: pre-await cache wipe. Late-joiner's pid may have a cache entry from
        // a tick-driven builder that fired between engine-bind and our T=0 handler. Wiping
        // here (before the 100ms await, not inside resetUiForPlayerOnJoin after it) ensures
        // the lazy-build cohort owns cache creation start-to-finish without racing
        // runRoundStartDelayHudLoop's post-await write window.
        delete State.hudCache.vehicleDeployTimerCache[joinPid];
    }

    await mod.Wait(0.1);
    if (!mod.IsPlayerValid(eventPlayer)) return;

    // v1.471 Phase C: re-read team after the 100ms wait if T=0 read returned 0 (engine
    // assignment lag for late-joiners). Idempotent — only writes if the early read missed.
    if (joinPid !== undefined && State.conquest.debug.perspectiveTeamByPid[joinPid] === undefined) {
        const lateTeamNum = safeGetTeamNumberFromPlayer(eventPlayer, 0);
        if (lateTeamNum === TeamID.Team1 || lateTeamNum === TeamID.Team2) {
            State.conquest.debug.perspectiveTeamByPid[joinPid] = lateTeamNum;
        }
    }

    resetUiForPlayerOnJoin(eventPlayer);
    if (joinPid !== undefined && mod.IsPlayerValid(eventPlayer)) {
        // Wave 6 Ship 1d: stagger 3 lazy-build triggers across 3 frames to distribute the join
        // cost. topHudShell stays immediate (player needs the clock visible). vehicleDeployTimer
        // defers 50ms (deploy menu opens on first death/respawn, well after join). combatHud
        // defers 150ms (not visible until first OnPlayerDeployed). triggerLazyBuild already
        // short-circuits on invalid pid, so the deferred callbacks are safe if the player
        // disconnects in the window.
        triggerLazyBuild('topHudShell', joinPid);
        Timers.setTimeout(() => triggerLazyBuild('vehicleDeployTimer', joinPid), 50);
        Timers.setTimeout(() => triggerLazyBuild('combatHud', joinPid), 150);
        SupplyBoxWarmScheduler.enqueueLateJoiner(joinPid);
    }
}

function onPlayerLeaveGameImpl(eventNumber: number | mod.Player) {
    let pid: number | undefined;
    if (mod.IsType(eventNumber, mod.Types.Player)) {
        pid = safeGetPlayerId(eventNumber as mod.Player);
    } else {
        pid = eventNumber as number;
    }
    if (pid === undefined) return;

    State.players.disconnectedByPid[pid] = true;
    resetVehicleDeployLiveMenuStateForPid(pid);
    resetArmState(pid);
    destroyArmMenu(pid); // A6: free ammoResupplyMenuCache[pid] widget tree on leave; resetArmState only clears small per-pid scalars.
    cleanupWorldInteractableRuntimeIconsForPid(pid);
    removeReadyDialogInteractPoint(pid);
    cleanupHudForPid(pid);
    resetPlayerBoundaryStateOnUndeployOrReset(pid, true);
    captureSoundOnPlayerLeaveOrResetPid(pid);
    captureVoOnPlayerLeaveOrResetPid(pid);
    clearVehicleReservationForPid(pid);
    // Clear vehicle slot ownership so the slot isn't stuck as "occupied" after disconnect.
    for (let i = 0; i < State.vehicles.slots.length; i++) {
        if (State.vehicles.slots[i].activeOwnerPid === pid) {
            State.vehicles.slots[i].activeOwnerPid = undefined;
        }
    }
    destroyReadyDialogUI(pid);
    delete State.players.readyByPid[pid];
    delete State.players.readyNeedsReconfirmByPid[pid];
    delete State.players.readyMessageCooldownByPid[pid];
    delete State.players.uiInputEnabledByPid[pid];
    delete State.players.liveVehicleDeployMenuVisibleByPid[pid];
    delete State.hqDeploy.lastRequestAtSecondsByPid[pid]; // A7: rate-limit timestamp; consumers fall back to -999 when key absent.
    delete State.players.armO[pid];
    delete State.players.armI[pid];
    delete State.players.armT[pid];
    delete State.players.armFocusedTileKeyByPid[pid];
    delete State.players.armS[pid];
    delete State.players.armG[pid];
    delete State.players.armL[pid];
    delete State.players.lockerSlotToggle[pid];
    delete State.players.uiCachePerfByPid[pid];
    if (FEATURE_PERF_DIAG) cleanupPerfDiagWidgetsForPid(pid);
    delete State.players.posDebugTransformSourceByPid[pid];
    delete State.players.posDebugVehicleObjIdByPid[pid];
    kpiCleanupForPid(pid);
    delete State.players.inMainBaseByPid[pid];
    delete State.players.deployedByPid[pid];
    onPlayerLeaveSpawnCharge(pid);
    delete State.players.readyDialogData[pid];
    Admin.onPlayerLeave(pid);
    onSpectatorPlayerLeave(pid);
    refreshBuiltReadyDialogCachesForAllPlayers();

    if (!isMatchLive()) {
        renderReadyDialogForAllVisibleViewers();
        updatePlayersReadyHudTextForAllPlayers();
        updateHelpTextVisibilityForAllPlayers();
    }
    updateVehicleDeployTimerHudForAllPlayers();
}

//#endregion -------------------- Exported Event Handlers - Player Join + Leave --------------------

