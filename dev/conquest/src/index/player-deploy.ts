// @ts-nocheck
// Module: index/player-deploy -- deploy/undeploy lifecycle handlers

//#region -------------------- Exported Event Handlers - Player Deploy + Undeploy --------------------

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

async function onPlayerDeployedImpl(eventPlayer: mod.Player) {
    const pid = safeGetPlayerId(eventPlayer);
    if (pid === undefined) return;
    // Safety: always restore UI input mode on deploy to avoid stuck UI suppressing messages.
    setUIInputModeForPlayer(eventPlayer, false);
    if (State.round.flow.cleanupActive && !State.round.flow.cleanupAllowDeploy) {
        State.players.deployedByPid[pid] = false;
        await deferForcedUndeploy(eventPlayer, "cleanup");
        return;
    }

    State.players.deployedByPid[pid] = true;
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
    await spawnReadyDialogInteractPoint(eventPlayer);
}

function onPlayerUndeployImpl(eventPlayer: mod.Player) {
    // If the player is leaving the deployed state (death / manual undeploy / forced redeploy),
    // the Ready Up dialog should be closed. This prevents interacting with the UI while undeployed.
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    const pid = safeGetPlayerId(eventPlayer);
    if (pid === undefined) return;
    if (isPidDisconnected(pid)) return;
    State.players.deployedByPid[pid] = false;
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
