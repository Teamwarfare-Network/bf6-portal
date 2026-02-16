// @ts-nocheck
// Module: team-switch/ui-events-admin -- tester/admin clock action button handlers

// Handles admin tester controls that mutate clock/start/end flow.
// Returns true when a button name is recognized (including gated no-op actions).
function tryHandleAdminTesterButtonEvent(
    eventPlayer: mod.Player,
    playerId: number,
    widgetName: string
): boolean {
    switch (widgetName) {
        case UI_TEST_BUTTON_CLOCK_TIME_DEC_ID + playerId:
            adjustRoundClockBySeconds(-60);
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.clockTimeDec);
            return true;

        case UI_TEST_BUTTON_CLOCK_TIME_INC_ID + playerId:
            if (!State.round.clock.isPaused && getRemainingSeconds() < 0) {
                ResetRoundClock(60);
            } else {
                adjustRoundClockBySeconds(60);
            }
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.clockTimeInc);
            return true;

        case UI_TEST_BUTTON_CLOCK_RESET_ID + playerId:
            if (isRoundLive()) {
                resetRoundClockToDefault();
            } else {
                setRoundClockPreview(getConfiguredRoundLengthSeconds());
            }
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.clockReset);
            return true;

        case UI_TEST_BUTTON_ROUND_START_ID + playerId:
            // Force-start path uses the same pregame countdown flow for consistent visuals and state transitions.
            startPregameCountdown(eventPlayer, true);
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.roundStart);
            return true;

        case UI_TEST_BUTTON_ROUND_END_ID + playerId:
            endRound(eventPlayer);
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.roundEnd);
            return true;

        case UI_TEST_BUTTON_POS_DEBUG_ID + playerId: {
            if (!State.players.teamSwitchData[playerId]) initTeamSwitchData(eventPlayer);
            const state = State.players.teamSwitchData[playerId];
            state.posDebugVisible = !state.posDebugVisible;
            setPositionDebugVisibleForPlayer(eventPlayer, state.posDebugVisible);
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.positionDebug);
            return true;
        }

        case UI_ADMIN_ROUND_LENGTH_DEC_ID + playerId:
            if (isRoundLive()) return true;
            {
                const next = clampRoundLengthSeconds(getConfiguredRoundLengthSeconds() - ADMIN_ROUND_LENGTH_STEP_SECONDS);
                setRoundClockPreview(next);
                updateAllPlayersClock();
                syncAdminRoundLengthLabelForAllPlayers();
                handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.roundLengthDec);
            }
            return true;

        case UI_ADMIN_ROUND_LENGTH_INC_ID + playerId:
            if (isRoundLive()) return true;
            {
                const next = clampRoundLengthSeconds(getConfiguredRoundLengthSeconds() + ADMIN_ROUND_LENGTH_STEP_SECONDS);
                setRoundClockPreview(next);
                updateAllPlayersClock();
                syncAdminRoundLengthLabelForAllPlayers();
                handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.roundLengthInc);
            }
            return true;
    }

    return false;
}

