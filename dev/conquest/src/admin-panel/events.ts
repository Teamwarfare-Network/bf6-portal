// @ts-nocheck
// Module: admin-panel/events -- tester/admin clock action button handlers

// Handles admin tester controls that mutate match clock/start/end flow.
// Returns true when a button name is recognized (including gated no-op actions).
function tryHandleAdminTesterButtonEvent(
    eventPlayer: mod.Player,
    playerId: number,
    widgetName: string
): boolean {
    switch (widgetName) {
        case UI_TEST_BUTTON_CLOCK_TIME_DEC_ID + playerId:
            adjustMatchClockBySeconds(-60);
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.clockTimeDec);
            return true;

        case UI_TEST_BUTTON_CLOCK_TIME_INC_ID + playerId:
            if (!State.round.clock.isPaused && getRemainingSeconds() < 0) {
                resetMatchClock(60);
            } else {
                adjustMatchClockBySeconds(60);
            }
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.clockTimeInc);
            return true;

        case UI_TEST_BUTTON_CLOCK_RESET_ID + playerId:
            if (isMatchLive()) {
                resetMatchClockToDefault();
            } else {
                setMatchClockPreview(getConfiguredMatchLengthSeconds());
            }
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.clockReset);
            return true;

        case UI_TEST_BUTTON_MATCH_START_ID + playerId:
            // Force-start path uses the same pregame countdown flow for consistent visuals and state transitions.
            startPregameCountdown(eventPlayer, true);
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.roundStart);
            return true;

        case UI_TEST_BUTTON_MATCH_END_ID + playerId:
            endMatch(eventPlayer);
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.roundEnd);
            return true;

        case UI_TEST_BUTTON_POS_DEBUG_ID + playerId: {
            if (!State.players.readyDialogData[playerId]) initReadyDialogData(eventPlayer);
            const state = State.players.readyDialogData[playerId];
            state.posDebugVisible = !state.posDebugVisible;
            setPositionDebugVisibleForPlayer(eventPlayer, state.posDebugVisible);
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.positionDebug);
            return true;
        }

        case UI_ADMIN_MATCH_LENGTH_DEC_ID + playerId:
            if (isMatchLive()) return true;
            {
                const next = clampMatchLengthSeconds(getConfiguredMatchLengthSeconds() - ADMIN_MATCH_LENGTH_STEP_SECONDS);
                setMatchClockPreview(next);
                updateAllPlayersClock();
                syncAdminMatchLengthLabelForAllPlayers();
                handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.roundLengthDec);
            }
            return true;

        case UI_ADMIN_MATCH_LENGTH_INC_ID + playerId:
            if (isMatchLive()) return true;
            {
                const next = clampMatchLengthSeconds(getConfiguredMatchLengthSeconds() + ADMIN_MATCH_LENGTH_STEP_SECONDS);
                setMatchClockPreview(next);
                updateAllPlayersClock();
                syncAdminMatchLengthLabelForAllPlayers();
                handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.roundLengthInc);
            }
            return true;
    }

    return false;
}
