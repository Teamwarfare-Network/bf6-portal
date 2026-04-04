// @ts-nocheck

async function deferForcedUndeploy(player: mod.Player, reason: string): Promise<void> {
    try {
        await mod.Wait(0.1);
        if (!player || !mod.IsPlayerValid(player)) return;
        const pid = safeGetPlayerId(player);
        if (pid !== undefined) pushUiLoadTraceForPid(pid, `UNDEPLOY_RETRY:${reason}`);
        mod.UndeployPlayer(player);
    } catch {
    }
}

// Handles the "deployed before release" race by freezing the player immediately and forcing them back to deploy.
async function handlePlayerDeployedBeforeRelease(eventPlayer: mod.Player, pid: number): Promise<void> {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    pushUiLoadTraceForPid(pid, "DEPLOY_EARLY");
    reassertPlayerUiLoadingGateVisuals(eventPlayer, pid);
    setAllInputRestrictionsForPlayer(eventPlayer, true, "deploy_early");
    try {
        pushUiLoadTraceForPid(pid, "UNDEPLOY_TRY:deploy_early");
        mod.UndeployPlayer(eventPlayer);
    } catch {
    }
    await deferForcedUndeploy(eventPlayer, "hud_warm_pending");
}

// Reasserts the loading overlay after the deploy-screen transition has taken ownership so team-swap load is actually visible.
async function reassertUiLoadingAfterUndeploy(eventPlayer: mod.Player): Promise<void> {
    await mod.Wait(0);
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    const pid = safeGetPlayerId(eventPlayer);
    if (pid === undefined) return;
    if (!isUiLoadGateActiveForPid(pid)) return;
    reassertPlayerUiLoadingGateVisuals(eventPlayer, pid);
}

async function onPlayerDeployedImpl(eventPlayer: mod.Player) {
    const pid = safeGetPlayerId(eventPlayer);
    if (pid === undefined) return;
    if (!State.players.readyDialogData[pid]) initReadyDialogData(eventPlayer);
    pushUiLoadTraceForPid(pid, "DEPLOY_EVT");
    // Unified gate check: if gate is still active (not yet released), recapture.
    if (isUiLoadGateActiveForPid(pid) || !isUiLoadGateReleasedForPid(pid)) {
        State.players.deployedByPid[pid] = false;
        await handlePlayerDeployedBeforeRelease(eventPlayer, pid);
        return;
    }
    pushUiLoadTraceForPid(pid, "DEPLOY_ACCEPT");
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
    renderCriticalHudForReveal(eventPlayer, pid);
    const directSpawnDeployResult = await conquestPhase5DTryFulfillVehicleSpawnButtonOnDeploy(eventPlayer);
    if (directSpawnDeployResult.consumedDeploy) {
        return;
    }
    await spawnReadyDialogInteractPoint(eventPlayer);
}

// Cleans up deployed state. If a loading gate is active, reasserts overlay + deploy block without starting new warm.
function onPlayerUndeployImpl(eventPlayer: mod.Player) {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    const pid = safeGetPlayerId(eventPlayer);
    if (pid === undefined) return;
    if (isPidDisconnected(pid)) return;
    pushUiLoadTraceForPid(pid, "UNDEPLOY_EVT");
    setAllInputRestrictionsForPlayer(eventPlayer, false, "undeploy");
    State.players.deployedByPid[pid] = false;
    State.players.inMainBaseByPid[pid] = false;
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

    // If any loading gate is active (join or team_swap), reassert overlay + deploy block.
    // The running gate loop owns warm — do not start a new warm pass here.
    if (isUiLoadGateActiveForPid(pid)) {
        reassertPlayerUiLoadingGateVisuals(eventPlayer, pid);
        void reassertUiLoadingAfterUndeploy(eventPlayer);
        return;
    }
}


