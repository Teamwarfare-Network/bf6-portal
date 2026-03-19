// @ts-nocheck
// Module: index/player-deploy -- deploy/undeploy lifecycle handlers

//#region -------------------- Exported Event Handlers - Player Deploy + Undeploy --------------------

// Forces a deferred undeploy during cleanup windows to avoid unstable immediate transitions.
async function deferForcedUndeploy(player: mod.Player, reason: string): Promise<void> {
    // Defer undeploy by a tick to avoid engine instability during deploy transitions.
    try {
        await mod.Wait(0.1);
        if (!player || !mod.IsPlayerValid(player)) return;
        mod.UndeployPlayer(player);
    } catch {
        // Intentionally silent to keep unstable transitions from crashing the experience.
    }
}

// Deploy entrypoint: restores per-player UI state and applies live-phase spawn-charge policy.
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
    // Clear any lingering forced redeploy delay so deployed players can immediately interact with HUD/ready workflows.
    mod.SetRedeployTime(eventPlayer, 0);
    // Seed viewer perspective on deploy so first-life HUD slices (including bleed chevrons)
    // do not wait for a later swap path to establish team context.
    const deployedTeam = safeGetTeamNumberFromPlayer(eventPlayer, 0);
    if (deployedTeam === TeamID.Team1 || deployedTeam === TeamID.Team2) {
        State.conquest.debug.perspectiveTeamByPid[pid] = deployedTeam;
    }
    // Safety: always restore UI input mode on deploy to avoid stuck UI suppressing messages.
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
    State.players.joinPromptTripleTapArmedByPid[pid] = false;
    // Rejoin/spawn behavior: players always start NOT READY for the next live-start gate.
    State.players.readyByPid[pid] = false;
    // Design assumption: players spawn in their main base; update immediately for roster display.
    State.players.inMainBaseByPid[pid] = true;
    delete State.players.overTakeoffLimitByPid[pid];
    updatePlayersReadyHudTextForAllPlayers();
    renderReadyDialogForAllVisibleViewers();
    updateHelpTextVisibilityForAllPlayers();

    // Avoid heavy per-deploy rebuilds unless this player's HUD cache is actually missing.
    if (!State.hudCache.topHudShellByPid[pid]) {
        ensureTopHudShellForPlayer(eventPlayer);
    }
    prepareVehicleDeployTimerHudForHiddenPrebuild(eventPlayer);
    renderCriticalHudForReveal(eventPlayer, pid);
    const directSpawnDeployResult = await conquestPhase5DTryFulfillVehicleSpawnButtonOnDeploy(eventPlayer);
    if (directSpawnDeployResult.consumedDeploy) {
        return;
    }
    await spawnReadyDialogInteractPoint(eventPlayer);
}

// Undeploy entrypoint: clears deployed-state projections and closes deploy-only UI affordances.
function onPlayerUndeployImpl(eventPlayer: mod.Player) {
    // If the player is leaving the deployed state (death / manual undeploy / forced redeploy),
    // the Ready Up dialog should be closed. This prevents interacting with the UI while undeployed.
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    const pid = safeGetPlayerId(eventPlayer);
    if (pid === undefined) return;
    if (isPidDisconnected(pid)) return;
    State.players.deployedByPid[pid] = false;
    State.players.posDebugTransformSourceByPid[pid] = "soldier";
    delete State.players.posDebugVehicleObjIdByPid[pid];
    // Keep engage panel suppressed after undeploy until the player physically re-enters a capture radius.
    State.conquest.debug.engageHiddenUntilDeployByPid[pid] = true;
    // Clear active objective engagement ownership on undeploy so stale swap/death samples cannot persist.
    delete State.conquest.capture.engagedObjIdByPid[pid];
    conquestPhase4OnPlayerLeaveOrResetPid(pid);
    conquestPhase4BOnPlayerLeaveOrResetPid(pid);
    twlConquestHudHideObjectiveFocusForPid(pid);
    conquestPhase3MarkHudDirty();
    State.players.joinPromptTripleTapArmedByPid[pid] = false;
    if (State.players.readyDialogData[pid]?.dialogVisible) {
        hideReadyDialogUI(eventPlayer);
    }

    removeReadyDialogInteractPoint(pid);
    if (State.players.readyDialogData[pid]?.hudSwapTransitionActive) {
        return;
    }
    if (!State.players.readyDialogData[pid]?.hudWarmCompleted) {
        void warmCriticalHudForPlayer(eventPlayer, {
            createJoinPrompt: false,
            joinPromptDelaySeconds: 0,
        });
    }
}

//#endregion -------------------- Exported Event Handlers - Player Deploy + Undeploy --------------------
