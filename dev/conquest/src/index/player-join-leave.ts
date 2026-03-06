// @ts-nocheck
// Module: index/player-join-leave -- join/leave lifecycle handlers and join-time UI reset

//#region -------------------- Exported Event Handlers - Player Join + Leave --------------------

// Clears residual modal/UI state for a joining player before rebuilding HUD/dialog surfaces.
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

// Deletes all known per-player HUD roots and cache entries for disconnect/reconnect safety.
// This prevents duplicate HUD instances if the engine keeps stale widgets alive across leave/swap churn.
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

    const rootNames = [
        `ConquestTicketsHudRoot_${pid}`,
        `ConquestFlagsHudRoot_${pid}`,
        `ConquestTicketsDebugRoot_${pid}`,
        `ConquestFlagsDebugRoot_${pid}`,
        `ConquestTicketsHudTeam1_${pid}`,
        `ConquestTicketsHudTeam2_${pid}`,
        `ConquestTicketsHudSlash_${pid}`,
        `ConquestTicketsHudLeftBarTrack_${pid}`,
        `ConquestTicketsHudLeftBarFill_${pid}`,
        `ConquestTicketsHudRightBarTrack_${pid}`,
        `ConquestTicketsHudRightBarFill_${pid}`,
        `ConquestTicketsHudLeadBorderLeft_${pid}`,
        `ConquestTicketsHudLeadBorderRight_${pid}`,
        `ConquestTicketsHudLeadCrownLeft_${pid}`,
        `ConquestTicketsHudLeadCrownRight_${pid}`,
        `ConquestTicketsHudBleedChevronLeft1_${pid}`,
        `ConquestTicketsHudBleedChevronLeft2_${pid}`,
        `ConquestTicketsHudBleedChevronLeft3_${pid}`,
        `ConquestTicketsHudBleedChevronRight1_${pid}`,
        `ConquestTicketsHudBleedChevronRight2_${pid}`,
        `ConquestTicketsHudBleedChevronRight3_${pid}`,
        `ConquestFlagHudEngageRoot_${pid}`,
        `ConquestFlagHudEngageTrack_${pid}`,
        `ConquestFlagHudEngageFriendlyFill_${pid}`,
        `ConquestFlagHudEngageEnemyFill_${pid}`,
        `ConquestFlagHudEngageFriendlyCount_${pid}`,
        `ConquestFlagHudEngageEnemyCount_${pid}`,
        `ConquestFlagHudEngageStatus_${pid}`,
        `TopHudRoot_${pid}`,
        `Container_TopMiddle_CoreUI_${pid}`,
        `Container_TopLeft_CoreUI_${pid}`,
        `Container_TopRight_CoreUI_${pid}`,
        `Upper_Left_Container_${pid}`,
        `Upper_Left_Settings_${pid}`,
        `AdminPanelActionCount_${pid}`,
        `VictoryDialogRoot_${pid}`,
        `MatchTimerRoot_${pid}`,
        `RoundStateRoot_${pid}`,
        `PregameCountdownText_${pid}`,
    ];
    for (const name of rootNames) {
        deleteAllByName(name);
    }
    for (let i = 0; i < 7; i++) {
        deleteAllByName(`ConquestFlagHudSlot_${pid}_${i}`);
        deleteAllByName(`ConquestFlagHudBorder_${pid}_${i}`);
        deleteAllByName(`ConquestFlagHudFill_${pid}_${i}`);
        deleteAllByName(`ConquestFlagHudLabelShadowRight_${pid}_${i}`);
        deleteAllByName(`ConquestFlagHudLabelShadowLeft_${pid}_${i}`);
        deleteAllByName(`ConquestFlagHudLabelShadowUp_${pid}_${i}`);
        deleteAllByName(`ConquestFlagHudLabelShadowDown_${pid}_${i}`);
        deleteAllByName(`ConquestFlagHudLabelShadowUpLeft_${pid}_${i}`);
        deleteAllByName(`ConquestFlagHudLabelShadowUpRight_${pid}_${i}`);
        deleteAllByName(`ConquestFlagHudLabelShadowDownRight_${pid}_${i}`);
        deleteAllByName(`ConquestFlagHudLabelShadowDownLeft_${pid}_${i}`);
        deleteAllByName(`ConquestFlagHudLabelShadowInner_${pid}_${i}`);
        deleteAllByName(`ConquestFlagHudLabelShadowInnerDeep_${pid}_${i}`);
        deleteAllByName(`ConquestFlagHudLabelShadowCenter_${pid}_${i}`);
        deleteAllByName(`ConquestFlagHudPercentRoot_${pid}_${i}`);
        deleteAllByName(`ConquestFlagHudPercentShadowRight_${pid}_${i}`);
        deleteAllByName(`ConquestFlagHudPercentShadowLeft_${pid}_${i}`);
        deleteAllByName(`ConquestFlagHudPercentShadowUp_${pid}_${i}`);
        deleteAllByName(`ConquestFlagHudPercentShadowDown_${pid}_${i}`);
        deleteAllByName(`ConquestFlagHudPercentShadowUpLeft_${pid}_${i}`);
        deleteAllByName(`ConquestFlagHudPercentShadowUpRight_${pid}_${i}`);
        deleteAllByName(`ConquestFlagHudPercentShadowDownRight_${pid}_${i}`);
        deleteAllByName(`ConquestFlagHudPercentShadowDownLeft_${pid}_${i}`);
        deleteAllByName(`ConquestFlagHudPercentShadowInner_${pid}_${i}`);
        deleteAllByName(`ConquestFlagHudPercentText_${pid}_${i}`);
        deleteAllByName(`ConquestFlagHudLabel_${pid}_${i}`);
        deleteAllByName(`ConquestFlagFriendly_${pid}_${i}`);
        deleteAllByName(`ConquestFlagCenter_${pid}_${i}`);
        deleteAllByName(`ConquestFlagEnemy_${pid}_${i}`);
    }

    delete State.hudCache.hudByPid[pid];
    delete State.hudCache.clockWidgetCache[pid];
    delete State.hudCache.countdownWidgetCache[pid];
    delete State.conquest.debug.teamSwapRefreshTokenByPid[pid];
    delete State.conquest.debug.perspectiveTeamByPid[pid];
    delete State.conquest.debug.teamSwapPerspectiveLockUntilByPid[pid];
}

// Join entrypoint: initializes per-player state, rebuilds HUD, and re-syncs shared UI projections.
async function onPlayerJoinGameImpl(eventPlayer: mod.Player) {
    initReadyDialogData(eventPlayer);
    const joinPid = safeGetPlayerId(eventPlayer);
    const wasDisconnected = joinPid !== undefined && State.players.disconnectedByPid[joinPid] === true;
    if (joinPid !== undefined) {
        delete State.players.disconnectedByPid[joinPid];
        State.players.deployedByPid[joinPid] = false;
        const joinTeamNum = safeGetTeamNumberFromPlayer(eventPlayer, 0);
        if (joinTeamNum === TeamID.Team1 || joinTeamNum === TeamID.Team2) {
            State.conquest.debug.perspectiveTeamByPid[joinPid] = joinTeamNum;
        }
        conquestPhase2BOnPlayerJoin(joinPid, wasDisconnected);
    }

    await mod.Wait(0.1);
    if (!mod.IsPlayerValid(eventPlayer)) return;

    resetUiForPlayerOnJoin(eventPlayer);

    ensureHudForPlayer(eventPlayer);
    // Force a conquest HUD refresh so late joiners immediately receive current tickets/flag state.
    updateConquestPhase2ADebugHudForAllPlayers(true);
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
    cleanupHudForPid(pid);
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
    conquestPhase2BOnPlayerLeave(pid);
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
