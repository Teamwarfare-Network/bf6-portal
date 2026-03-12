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
    setConquestCombatHudV2TeamSwapPending(pid, false);
    markConquestCombatHudV2DirtyForPid(pid);
    markConquestCombatHudV2AnimationDirtyForPid(pid);
    State.players.deployedByPid[pid] = true;
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

    ensureHudForPlayer(eventPlayer);
    // Re-apply help/ready visibility after ensure so freshly rebuilt top-center widgets cannot keep default visibility.
    updateHelpTextVisibilityForPid(pid);
    // Keep conquest HUD state in sync for newly deployed viewers even when no new capture/ticket events fire.
    updateConquestPhase2ADebugHudForAllPlayers(true);
    // Drive one immediate core frame on deploy release so swap-pending viewers reveal in a single pass.
    try {
        twlConquestHudTickFrame(true);
        twlConquestHudTickAnimation(true);
    } catch {
        // Keep deploy flow robust even if a HUD frame write faults.
    }
    // First-life chevron stabilization:
    // run one clean-tick bleed projection pass right after deploy so chevrons don't wait
    // for a later unrelated HUD tick or team swap to appear.
    conquestPhase3RefreshTicketBleedWhenHudClean();
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
    // Keep engage panel suppressed after undeploy until the player physically re-enters a capture radius.
    State.conquest.debug.engageHiddenUntilDeployByPid[pid] = true;
    // Clear active objective engagement ownership on undeploy so stale swap/death samples cannot persist.
    delete State.conquest.capture.engagedObjIdByPid[pid];
    conquestPhase3ForceHideEngageWidgetsForPid(pid);
    conquestPhase3MarkHudDirty();
    updateConquestPhase2ADebugHudForAllPlayers(true);
    State.players.joinPromptTripleTapArmedByPid[pid] = false;
    if (State.players.readyDialogData[pid]?.dialogVisible) {
        hideReadyDialogUI(eventPlayer);
    }
    updateHelpTextVisibilityForPid(pid);

    removeReadyDialogInteractPoint(pid);

    if (shouldShowJoinPromptForPlayer(eventPlayer)) {
        createJoinPromptForPlayer(eventPlayer);
    }
}

//#endregion -------------------- Exported Event Handlers - Player Deploy + Undeploy --------------------
