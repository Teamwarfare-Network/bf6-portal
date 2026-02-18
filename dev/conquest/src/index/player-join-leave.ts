// @ts-nocheck
// Module: index/player-join-leave -- join/leave lifecycle handlers and join-time UI reset

//#region -------------------- Exported Event Handlers - Player Join + Leave --------------------

function resetUiForPlayerOnJoin(player: mod.Player): void {
    if (!player || !mod.IsPlayerValid(player)) return;
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return;

    setUIInputModeForPlayer(player, false);

    deleteJoinPromptWidget(joinPromptButtonTextName(pid));
    deleteJoinPromptWidget(joinPromptButtonName(pid));
    deleteJoinPromptWidget(joinPromptButtonBorderName(pid));
    deleteJoinPromptWidget(joinPromptNeverShowButtonTextName(pid));
    deleteJoinPromptWidget(joinPromptNeverShowButtonName(pid));
    deleteJoinPromptWidget(joinPromptNeverShowButtonBorderName(pid));
    deleteJoinPromptWidget(joinPromptBodyName(pid));
    deleteJoinPromptWidget(joinPromptTitleName(pid));
    deleteJoinPromptWidget(joinPromptPanelName(pid));
    deleteJoinPromptWidget(joinPromptRootName(pid));

    hideReadyDialogUI(player);
}

async function onPlayerJoinGameImpl(eventPlayer: mod.Player) {
    initReadyDialogData(eventPlayer);
    const joinPid = safeGetPlayerId(eventPlayer);
    if (joinPid !== undefined) {
        delete State.players.disconnectedByPid[joinPid];
        State.players.deployedByPid[joinPid] = false;
    }

    await mod.Wait(0.1);
    if (!mod.IsPlayerValid(eventPlayer)) return;

    resetUiForPlayerOnJoin(eventPlayer);

    ensureHudForPlayer(eventPlayer);
    {
        const cache = ensureClockUIAndGetCache(eventPlayer);
        if (cache) setMatchStateText(cache.roundStateText);
    updateHelpTextVisibilityForPlayer(eventPlayer);
    }
    if (joinPid !== undefined) {
        updateTeamNameWidgetsForPid(joinPid);
    }

    // Second join-time refresh after team assignment settles to avoid stale Ready dialog rosters.
    await mod.Wait(0.1);
    if (!mod.IsPlayerValid(eventPlayer)) return;
    renderReadyDialogForAllVisibleViewers();
    updatePlayersReadyHudTextForAllPlayers();
    updateHelpTextVisibilityForAllPlayers();
    // Ensure match-clock digits refresh for reconnecting players.
    State.round.clock.lastDisplayedSeconds = undefined;
    State.round.clock.lastLowTimeState = undefined;
    updateAllPlayersClock();

    // Join-time prompt is only shown once per player (undeploy prompts can repeat unless suppressed).
    if (!shouldShowJoinPromptForPlayer(eventPlayer)) return;
    const joinPromptPid = safeGetPlayerId(eventPlayer);
    if (joinPromptPid === undefined) return;
    if (State.players.joinPromptShownByPid[joinPromptPid]) return;
    State.players.joinPromptShownByPid[joinPromptPid] = true;

    await mod.Wait(0.2);
    if (!mod.IsPlayerValid(eventPlayer)) return;
    if (!shouldShowJoinPromptForPlayer(eventPlayer)) return;
    createJoinPromptForPlayer(eventPlayer);
}

/**
 * Disconnect handling:
 * - Clears per-player state maps so rejoin starts clean (NOT READY).
 * - Forces UI/HUD refresh for remaining players to drop the departed player immediately.
 */
function onPlayerLeaveGameImpl(eventNumber: number | mod.Player) {
    let pid: number | undefined;
    if (mod.IsType(eventNumber, mod.Types.Player)) {
        pid = safeGetPlayerId(eventNumber as mod.Player);
    } else {
        pid = eventNumber as number;
    }
    if (pid === undefined) return;

    State.players.disconnectedByPid[pid] = true;
    removeReadyDialogInteractPoint(pid);
    // Cleanup: delete cached UI widgets so we do not leak UI for disconnected players.
    destroyReadyDialogUI(pid);
    // Remove any persisted per-player state so rejoin starts clean (NOT READY by default).
    delete State.players.readyByPid[pid];
    delete State.players.readyMessageCooldownByPid[pid];
    delete State.players.joinPromptShownByPid[pid];
    delete State.players.joinPromptNeverShowByPidMap[pid];
    delete State.players.joinPromptReadyDialogOpenedByPid[pid];
    delete State.players.joinPromptTipIndexByPid[pid];
    delete State.players.joinPromptTipsUnlockedByPid[pid];
    delete State.players.joinPromptTripleTapArmedByPid[pid];
    delete State.players.uiInputEnabledByPid[pid];
    delete State.players.inMainBaseByPid[pid];
    delete State.players.overTakeoffLimitByPid[pid];
    delete State.players.deployedByPid[pid];
    // Also drop dialog-visible tracking if present (viewer is gone).
    delete State.players.readyDialogData[pid];
    clearJoinPromptForPlayerId(pid);

    // Refresh UI for remaining players so rosters + HUD ready counts immediately reflect the disconnect.
    if (!isMatchLive()) {
        renderReadyDialogForAllVisibleViewers();
        updatePlayersReadyHudTextForAllPlayers();
        updateHelpTextVisibilityForAllPlayers();
    }
}

//#endregion -------------------- Exported Event Handlers - Player Join + Leave --------------------
