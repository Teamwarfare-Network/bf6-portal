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
    clearLoadingOverlayForPlayerId(pid);
    hideReadyDialogUI(pid);
    destroyArmMenu(pid);

    const deleteAllByName = (name: string, maxPasses: number = 64): void => {
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
    delete State.hudCache.vehicleDeployTimerCache[pid];
    destroyBoundaryPromptUiForPid(pid);
}

function cleanupHudForPid(pid: number): void {
    const deleteAllByName = (name: string, maxPasses: number = 128): void => {
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
    destroyBoundaryPromptUiForPid(pid);
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

// Starts the first-join loading session immediately, then keeps deploy blocked until the join-owned warm/reveal path explicitly releases it.
async function onPlayerJoinGameImpl(eventPlayer: mod.Player) {
    initReadyDialogData(eventPlayer);
    const joinPid = safeGetPlayerId(eventPlayer);
    const wasDisconnected = joinPid !== undefined && State.players.disconnectedByPid[joinPid] === true;
    if (joinPid !== undefined) {
        beginLoadingGate(eventPlayer, joinPid, "join");
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
    }

    await mod.Wait(0.1);
    if (!mod.IsPlayerValid(eventPlayer)) return;

    resetUiForPlayerOnJoin(eventPlayer);
    if (joinPid !== undefined && mod.IsPlayerValid(eventPlayer)) {
        reassertPlayerUiLoadingGateVisuals(eventPlayer, joinPid);
        await runLoadingGateUntilReady(eventPlayer, joinPid);
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
    delete State.players.warmPrimeActiveByPid[pid];
    delete State.players.armS[pid];
    delete State.players.armG[pid];
    delete State.players.armL[pid];
    delete State.players.uiCachePerfByPid[pid];
    if (FEATURE_PERF_DIAG) cleanupPerfDiagWidgetsForPid(pid);
    delete State.players.posDebugTransformSourceByPid[pid];
    delete State.players.posDebugVehicleObjIdByPid[pid];
    kpiCleanupForPid(pid);
    delete State.players.inMainBaseByPid[pid];
    delete State.players.deployedByPid[pid];
    onPlayerLeaveSpawnCharge(pid);
    delete State.players.readyDialogData[pid];
    refreshBuiltReadyDialogCachesForAllPlayers();
    clearLoadingOverlayForPlayerId(pid);

    if (!isMatchLive()) {
        renderReadyDialogForAllVisibleViewers();
        updatePlayersReadyHudTextForAllPlayers();
        updateHelpTextVisibilityForAllPlayers();
    }
    updateVehicleDeployTimerHudForAllPlayers();
}

//#endregion -------------------- Exported Event Handlers - Player Join + Leave --------------------

