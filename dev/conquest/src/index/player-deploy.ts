// @ts-nocheck

async function deferForcedUndeploy(player: mod.Player, reason: string): Promise<void> {
    try {
        await mod.Wait(0.1);
        if (!player || !mod.IsPlayerValid(player)) return;
        mod.UndeployPlayer(player);
    } catch {
    }
}

async function onPlayerDeployedImpl(eventPlayer: mod.Player) {
    const pid = safeGetPlayerId(eventPlayer);
    if (pid === undefined) return;
    if (!State.players.readyDialogData[pid]) initReadyDialogData(eventPlayer);
    if (State.players.readyDialogData[pid].hudSwapTransitionActive || !isHudWarmReadyForPid(pid)) {
        State.players.deployedByPid[pid] = false;
        await deferForcedUndeploy(eventPlayer, "hud_warm_pending");
        return;
    }
    invalidateHudWarmTokenForPid(pid);
    mod.SetRedeployTime(eventPlayer, 0);
    const deployedTeam = safeGetTeamNumberFromPlayer(eventPlayer, 0);
    if (deployedTeam === TeamID.Team1 || deployedTeam === TeamID.Team2) {
        State.conquest.debug.perspectiveTeamByPid[pid] = deployedTeam;
    }
    setUIInputModeForPlayer(eventPlayer, false);
    if (State.round.flow.cleanupActive && !State.round.flow.cleanupAllowDeploy) {
        State.players.deployedByPid[pid] = false;
        conquestPhase2BMarkNextDeployReason(pid, "phase_transition");
        await deferForcedUndeploy(eventPlayer, "cleanup");
        return;
    }

    const wasAlreadyDeployed = !!State.players.deployedByPid[pid];
    conquestPhase2BOnPlayerDeployed(eventPlayer, wasAlreadyDeployed);
    State.players.deployedByPid[pid] = true;
    State.players.posDebugTransformSourceByPid[pid] = "soldier";
    delete State.players.posDebugVehicleObjIdByPid[pid];
    State.conquest.debug.teamSwapHudResetPendingByPid[pid] = false;
    State.players.readyByPid[pid] = false;
    delete State.players.readyNeedsReconfirmByPid[pid];
    State.players.inMainBaseByPid[pid] = true;
    syncWorldInteractableRuntimeIconsForPlayer(eventPlayer);
    resetPlayerBoundaryStateOnDeploy(eventPlayer, pid);
    updatePlayersReadyHudTextForAllPlayers();
    renderReadyDialogForAllVisibleViewers();
    updateHelpTextVisibilityForAllPlayers();

    if (!State.hudCache.topHudShellByPid[pid]) {
        ensureTopHudShellForPlayer(eventPlayer);
    }
    prepareVehicleDeployTimerHudForHiddenPrebuild(eventPlayer);
    prebuildArmMenu(eventPlayer);
    renderCriticalHudForReveal(eventPlayer, pid);
    const directSpawnDeployResult = await conquestPhase5DTryFulfillVehicleSpawnButtonOnDeploy(eventPlayer);
    if (directSpawnDeployResult.consumedDeploy) {
        return;
    }
    await spawnReadyDialogInteractPoint(eventPlayer);
}

function onPlayerUndeployImpl(eventPlayer: mod.Player) {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    const pid = safeGetPlayerId(eventPlayer);
    if (pid === undefined) return;
    if (isPidDisconnected(pid)) return;
    State.players.deployedByPid[pid] = false;
    State.players.posDebugTransformSourceByPid[pid] = "soldier";
    delete State.players.posDebugVehicleObjIdByPid[pid];
    State.conquest.debug.engageHiddenUntilDeployByPid[pid] = true;
    delete State.conquest.capture.engagedObjIdByPid[pid];
    resetPlayerBoundaryStateOnUndeployOrReset(pid);
    conquestPhase4OnPlayerLeaveOrResetPid(pid);
    conquestPhase4BOnPlayerLeaveOrResetPid(pid);
    twlConquestHudHideObjectiveFocusForPid(pid);
    conquestPhase3MarkHudDirty();
    cleanupWorldInteractableRuntimeIconsForPid(pid);
    if (State.players.readyDialogData[pid]?.dialogVisible) {
        hideReadyDialogUI(eventPlayer);
    }
    closeArmMenu(eventPlayer);
    closeVehicleDeployLiveMenuForPlayer(eventPlayer);

    removeReadyDialogInteractPoint(pid);
    if (State.players.readyDialogData[pid]?.hudSwapTransitionActive) {
        return;
    }
    if (!State.players.readyDialogData[pid]?.hudWarmCompleted) {
        void warmCriticalHudForPlayer(eventPlayer, {
        });
    }
}


