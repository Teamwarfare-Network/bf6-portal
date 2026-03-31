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
    deleteAllByName(`TwlConquestHudStatusLaneRoot_${pid}`);
    deleteAllByName(`TwlConquestHudStatusLanePrimaryText_${pid}`);
    deleteAllByName(`TwlConquestHudStatusLaneSecondaryText_${pid}`);
    deleteAllByName(`TwlConquestStatusDockRoot_${pid}`);
    deleteAllByName(`TwlConquestStatusDockState_${pid}`);
    deleteAllByName(`TwlConquestStatusDockReady_${pid}`);
    deleteAllByName(`TwlConquestHudStatusPanelRoot_${pid}`);
    deleteAllByName(`TwlConquestHudStatusPanelStateText_${pid}`);
    deleteAllByName(`TwlConquestHudStatusPanelReadyText_${pid}`);
    deleteAllByName(`TwlConquestStatusStaticBox_${pid}`);
    deleteAllByName(`TwlConquestStatusStaticText_${pid}`);
    deleteAllByName(`TwlConquestHudStatusContainer_${pid}`);
    deleteAllByName(`TwlConquestHudStatusStateText_${pid}`);
    deleteAllByName(`TwlConquestHudStatusReadyText_${pid}`);
    deleteAllByName(`TwlConquestStatusPanel_${pid}`);
    deleteAllByName(`TwlConquestStatusStateLine_${pid}`);
    deleteAllByName(`TwlConquestStatusReadyLine_${pid}`);
    deleteAllByName(`Upper_Left_Status_${pid}`);
    deleteAllByName(`Upper_Left_Status_StateText_${pid}`);
    deleteAllByName(`Upper_Left_Status_ReadyText_${pid}`);
    deleteAllByName(`RoundStateRoot_${pid}`);
    deleteAllByName(`RoundStateText_${pid}`);
    deleteAllByName(`PlayersReadyText_${pid}`);
    deleteAllByName(`Container_ReadyStatus_${pid}`);
    deleteAllByName(`ReadyStatusText_${pid}`);
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
        `TopHudRoot_${pid}`,
        `ConquestHudRoot_${pid}`,
        `ConquestCombatHudRoot_${pid}`,
        `ConquestTicketsLaneRoot_${pid}`,
        `ConquestFlagsLaneRoot_${pid}`,
        `Container_TopMiddle_CoreUI_${pid}`,
        `Container_TopLeft_CoreUI_${pid}`,
        `Container_TopRight_CoreUI_${pid}`,
        `ConquestTopCenterAuxRoot_${pid}`,
        `Container_HelpText_${pid}`,
        `HelpText_${pid}`,
        `Upper_Left_Container_${pid}`,
        `TwlConquestHudStatusLaneRoot_${pid}`,
        `TwlConquestHudStatusLanePrimaryText_${pid}`,
        `TwlConquestHudStatusLaneSecondaryText_${pid}`,
        `TwlConquestStatusDockRoot_${pid}`,
        `TwlConquestStatusDockState_${pid}`,
        `TwlConquestStatusDockReady_${pid}`,
        `TwlConquestHudStatusPanelRoot_${pid}`,
        `TwlConquestHudStatusPanelStateText_${pid}`,
        `TwlConquestHudStatusPanelReadyText_${pid}`,
        `TwlConquestStatusStaticBox_${pid}`,
        `TwlConquestStatusStaticText_${pid}`,
        `TwlConquestHudStatusContainer_${pid}`,
        `TwlConquestHudStatusStateText_${pid}`,
        `TwlConquestHudStatusReadyText_${pid}`,
        `TwlConquestStatusPanel_${pid}`,
        `TwlConquestStatusStateLine_${pid}`,
        `TwlConquestStatusReadyLine_${pid}`,
        `Upper_Left_Status_${pid}`,
        `Upper_Left_Status_StateText_${pid}`,
        `Upper_Left_Status_ReadyText_${pid}`,
        `Upper_Left_Settings_${pid}`,
        `Container_ReadyStatus_${pid}`,
        `ReadyStatusText_${pid}`,
        `AdminPanelActionCount_${pid}`,
        `VictoryDialogRoot_${pid}`,
        `MatchTimerRoot_${pid}`,
        `VehicleDeployTimerHudRoot_${pid}`,
        `RoundStateRoot_${pid}`,
        `RoundStateText_${pid}`,
        `PlayersReadyText_${pid}`,
        `PregameCountdownText_${pid}`,
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
        beginJoinLoadingGate(eventPlayer, joinPid);
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
        if (JOIN_CONSERVATIVE_FIRST_JOIN_GATE_MODE) {
            await runJoinLoadingGateWithConservativeRelease(eventPlayer, joinPid);
        } else {
            await runJoinLoadingGateUntilReady(eventPlayer, joinPid);
        }
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
    delete State.players.armS[pid];
    delete State.players.uiCachePerfByPid[pid];
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

