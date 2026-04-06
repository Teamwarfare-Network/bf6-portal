// @ts-nocheck
// Module: index/player-join-leave -- join/leave lifecycle handlers and join-time UI reset

//#region -------------------- Exported Event Handlers - Player Join + Leave --------------------

function resetUiForPlayerOnJoin(player: mod.Player): void {
    if (!player || !mod.IsPlayerValid(player)) return;
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return;

    resetUiCachePerfCountersForPid(pid);
    setUIInputModeForPlayer(player, false);
    resetVehicleDeployLiveMenuStateForPid(pid);
    resetArmState(pid);
    cleanupWorldInteractableRuntimeIconsForPid(pid);
    clearJoinPromptForPlayerId(pid);
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
    deleteAllByName(wn("TwlConquestHudStatusLaneRoot", pid));
    deleteAllByName(wn("TwlConquestHudStatusLanePrimaryText", pid));
    deleteAllByName(wn("TwlConquestHudStatusLaneSecondaryText", pid));
    deleteAllByName(wn("TwlConquestStatusDockRoot", pid));
    deleteAllByName(wn("TwlConquestStatusDockState", pid));
    deleteAllByName(wn("TwlConquestStatusDockReady", pid));
    deleteAllByName(wn("TwlConquestHudStatusPanelRoot", pid));
    deleteAllByName(wn("TwlConquestHudStatusPanelStateText", pid));
    deleteAllByName(wn("TwlConquestHudStatusPanelReadyText", pid));
    deleteAllByName(wn("TwlConquestStatusStaticBox", pid));
    deleteAllByName(wn("TwlConquestStatusStaticText", pid));
    deleteAllByName(wn("TwlConquestHudStatusContainer", pid));
    deleteAllByName(wn("TwlConquestHudStatusStateText", pid));
    deleteAllByName(wn("TwlConquestHudStatusReadyText", pid));
    deleteAllByName(wn("TwlConquestStatusPanel", pid));
    deleteAllByName(wn("TwlConquestStatusStateLine", pid));
    deleteAllByName(wn("TwlConquestStatusReadyLine", pid));
    deleteAllByName(wn("Upper_Left_Status", pid));
    deleteAllByName(wn("Upper_Left_Status_StateText", pid));
    deleteAllByName(wn("Upper_Left_Status_ReadyText", pid));
    deleteAllByName(wn("RoundStateRoot", pid));
    deleteAllByName(wn("RoundStateText", pid));
    deleteAllByName(wn("PlayersReadyText", pid));
    deleteAllByName(wn("Container_ReadyStatus", pid));
    deleteAllByName(wn("ReadyStatusText", pid));
    deleteVehicleDeployTimerHudArtifactsForPid(pid);
    delete State.hudCache.vehicleDeployTimerCache[pid];
    destroyArmMenu(pid);
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
        wn("ConquestHudRoot", pid),
        wn("ConquestCombatHudRoot", pid),
        wn("ConquestTicketsLaneRoot", pid),
        wn("ConquestFlagsLaneRoot", pid),
        wn("Container_TopMiddle_CoreUI", pid),
        wn("Container_TopLeft_CoreUI", pid),
        wn("Container_TopRight_CoreUI", pid),
        wn("ConquestTopCenterAuxRoot", pid),
        wn("Container_HelpText", pid),
        wn("HelpText", pid),
        wn("Upper_Left_Container", pid),
        wn("TwlConquestHudStatusLaneRoot", pid),
        wn("TwlConquestHudStatusLanePrimaryText", pid),
        wn("TwlConquestHudStatusLaneSecondaryText", pid),
        wn("TwlConquestStatusDockRoot", pid),
        wn("TwlConquestStatusDockState", pid),
        wn("TwlConquestStatusDockReady", pid),
        wn("TwlConquestHudStatusPanelRoot", pid),
        wn("TwlConquestHudStatusPanelStateText", pid),
        wn("TwlConquestHudStatusPanelReadyText", pid),
        wn("TwlConquestStatusStaticBox", pid),
        wn("TwlConquestStatusStaticText", pid),
        wn("TwlConquestHudStatusContainer", pid),
        wn("TwlConquestHudStatusStateText", pid),
        wn("TwlConquestHudStatusReadyText", pid),
        wn("TwlConquestStatusPanel", pid),
        wn("TwlConquestStatusStateLine", pid),
        wn("TwlConquestStatusReadyLine", pid),
        wn("Upper_Left_Status", pid),
        wn("Upper_Left_Status_StateText", pid),
        wn("Upper_Left_Status_ReadyText", pid),
        wn("Upper_Left_Settings", pid),
        wn("Container_ReadyStatus", pid),
        wn("ReadyStatusText", pid),
        wn("AdminPanelActionCount", pid),
        wn("VictoryDialogRoot", pid),
        wn("MatchTimerRoot", pid),
        wn("VehicleDeployTimerHudRoot", pid),
        wn("RoundStateRoot", pid),
        wn("RoundStateText", pid),
        wn("PlayersReadyText", pid),
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
        conquestPhase4OnPlayerLeaveOrResetPid(joinPid);
        conquestPhase4BOnPlayerLeaveOrResetPid(joinPid);
        const joinTeamNum = safeGetTeamNumberFromPlayer(eventPlayer, 0);
        if (joinTeamNum === TeamID.Team1 || joinTeamNum === TeamID.Team2) {
            State.conquest.debug.perspectiveTeamByPid[joinPid] = joinTeamNum;
        }
        conquestPhase2BOnPlayerJoin(joinPid, wasDisconnected);
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
    cleanupWorldInteractableRuntimeIconsForPid(pid);
    removeReadyDialogInteractPoint(pid);
    cleanupHudForPid(pid);
    resetPlayerBoundaryStateOnUndeployOrReset(pid, true);
    conquestPhase4OnPlayerLeaveOrResetPid(pid);
    conquestPhase4BOnPlayerLeaveOrResetPid(pid);
    clearVehicleReservationForPid(pid);
    destroyReadyDialogUI(pid);
    delete State.players.readyByPid[pid];
    delete State.players.readyNeedsReconfirmByPid[pid];
    delete State.players.readyMessageCooldownByPid[pid];
    delete State.players.uiInputEnabledByPid[pid];
    delete State.players.liveVehicleDeployMenuVisibleByPid[pid];
    delete State.players.armO[pid];
    delete State.players.armI[pid];
    delete State.players.armT[pid];
    delete State.players.armS[pid];
    delete State.players.uiCachePerfByPid[pid];
    cleanupPerfDiagWidgetsForPid(pid);
    cleanupWorldInteractableRuntimeIconsForPid(pid);
    delete State.players.posDebugTransformSourceByPid[pid];
    delete State.players.posDebugVehicleObjIdByPid[pid];
    delete State.players.inMainBaseByPid[pid];
    delete State.players.deployedByPid[pid];
    conquestPhase2BOnPlayerLeave(pid);
    delete State.players.readyDialogData[pid];
    refreshBuiltReadyDialogCachesForAllPlayers();
    clearJoinPromptForPlayerId(pid);

    if (!isMatchLive()) {
        renderReadyDialogForAllVisibleViewers();
        updatePlayersReadyHudTextForAllPlayers();
        updateHelpTextVisibilityForAllPlayers();
    }
    updateVehicleDeployTimerHudForAllPlayers();
}

//#endregion -------------------- Exported Event Handlers - Player Join + Leave --------------------

