// @ts-nocheck
// Module: admin-panel/events -- tester/admin clock action button handlers

// Handles admin tester controls that mutate match clock/start/end flow.
// Returns true when a button name is recognized (including gated no-op actions).
const ADMIN_PANEL_PRIMARY_CLICK_DEBOUNCE_SECONDS = 0.12;
const ADMIN_PANEL_PRIMARY_CLICK_RELEASE_GRACE_SECONDS = 2.0;
const adminPanelLastPrimaryClickByPid: UIButtonPrimaryClickTracker = {};

function tryConsumeAdminPanelPrimaryClickEvent(
    playerId: number,
    widgetName: string,
    eventUIButtonEvent: mod.UIButtonEvent
): boolean {
    return tryConsumeUIButtonPrimaryClickEvent(
        adminPanelLastPrimaryClickByPid,
        playerId,
        widgetName,
        eventUIButtonEvent,
        ADMIN_PANEL_PRIMARY_CLICK_DEBOUNCE_SECONDS,
        ADMIN_PANEL_PRIMARY_CLICK_RELEASE_GRACE_SECONDS
    );
}

function tryHandleAdminPanelPrimaryAction(
    playerId: number,
    widgetName: string,
    eventUIButtonEvent: mod.UIButtonEvent,
    widgetBaseId: string,
    action: () => void
): boolean | undefined {
    if (widgetName !== widgetBaseId + playerId) return undefined;
    if (!tryConsumeAdminPanelPrimaryClickEvent(playerId, widgetName, eventUIButtonEvent)) return true;
    action();
    return true;
}

function tryHandleAdminTesterButtonEvent(
    eventPlayer: mod.Player,
    playerId: number,
    widgetName: string,
    eventUIButtonEvent: mod.UIButtonEvent
): boolean {
    const clockDecHandled = tryHandleAdminPanelPrimaryAction(
        playerId,
        widgetName,
        eventUIButtonEvent,
        UI_TEST_BUTTON_CLOCK_TIME_DEC_ID,
        () => {
            adjustMatchClockBySeconds(-60);
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.clockTimeDec);
        }
    );
    if (clockDecHandled !== undefined) return clockDecHandled;

    const clockIncHandled = tryHandleAdminPanelPrimaryAction(
        playerId,
        widgetName,
        eventUIButtonEvent,
        UI_TEST_BUTTON_CLOCK_TIME_INC_ID,
        () => {
            if (!State.round.clock.isPaused && getRemainingSeconds() < 0) {
                resetMatchClock(60);
            } else {
                adjustMatchClockBySeconds(60);
            }
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.clockTimeInc);
        }
    );
    if (clockIncHandled !== undefined) return clockIncHandled;

    const clockResetHandled = tryHandleAdminPanelPrimaryAction(
        playerId,
        widgetName,
        eventUIButtonEvent,
        UI_TEST_BUTTON_CLOCK_RESET_ID,
        () => {
            if (isMatchLive()) {
                resetMatchClockToDefault();
            } else {
                setMatchClockPreview(getConfiguredMatchLengthSeconds());
            }
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.clockReset);
        }
    );
    if (clockResetHandled !== undefined) return clockResetHandled;

    const startHandled = tryHandleAdminPanelPrimaryAction(
        playerId,
        widgetName,
        eventUIButtonEvent,
        UI_TEST_BUTTON_MATCH_START_ID,
        () => {
            startPregameCountdown(eventPlayer, true);
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.roundStart);
        }
    );
    if (startHandled !== undefined) return startHandled;

    const endHandled = tryHandleAdminPanelPrimaryAction(
        playerId,
        widgetName,
        eventUIButtonEvent,
        UI_TEST_BUTTON_MATCH_END_ID,
        () => {
            endMatch(eventPlayer);
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.roundEnd);
        }
    );
    if (endHandled !== undefined) return endHandled;

    const posDebugHandled = tryHandleAdminPanelPrimaryAction(
        playerId,
        widgetName,
        eventUIButtonEvent,
        UI_TEST_BUTTON_POS_DEBUG_ID,
        () => {
            if (!State.players.readyDialogData[playerId]) initReadyDialogData(eventPlayer);
            const state = State.players.readyDialogData[playerId];
            state.posDebugVisible = !state.posDebugVisible;
            setPositionDebugVisibleForPlayer(eventPlayer, state.posDebugVisible);
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.positionDebug);
        }
    );
    if (posDebugHandled !== undefined) return posDebugHandled;

    const deployTimerHandled = tryHandleAdminPanelPrimaryAction(
        playerId,
        widgetName,
        eventUIButtonEvent,
        UI_TEST_BUTTON_DEPLOY_TIMERS_TOGGLE_ID,
        () => {
            if (!State.players.readyDialogData[playerId]) initReadyDialogData(eventPlayer);
            const state = State.players.readyDialogData[playerId];
            state.vehicleTimersVisibleWhileDeployed = !state.vehicleTimersVisibleWhileDeployed;
            syncVehicleDeployTimerAdminToggleLabelForPid(playerId);
            updateVehicleDeployTimerHudForPlayer(eventPlayer);
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.deployTimersVisibleToggle);
        }
    );
    if (deployTimerHandled !== undefined) return deployTimerHandled;

    const matchLengthDecHandled = tryHandleAdminPanelPrimaryAction(
        playerId,
        widgetName,
        eventUIButtonEvent,
        UI_ADMIN_MATCH_LENGTH_DEC_ID,
        () => {
            if (isMatchLive()) return;
            const next = clampMatchLengthSeconds(getConfiguredMatchLengthSeconds() - ADMIN_MATCH_LENGTH_STEP_SECONDS);
            setMatchClockPreview(next);
            updateAllPlayersClock();
            syncAdminMatchLengthLabelForAllPlayers();
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.roundLengthDec);
        }
    );
    if (matchLengthDecHandled !== undefined) return matchLengthDecHandled;

    const matchLengthIncHandled = tryHandleAdminPanelPrimaryAction(
        playerId,
        widgetName,
        eventUIButtonEvent,
        UI_ADMIN_MATCH_LENGTH_INC_ID,
        () => {
            if (isMatchLive()) return;
            const next = clampMatchLengthSeconds(getConfiguredMatchLengthSeconds() + ADMIN_MATCH_LENGTH_STEP_SECONDS);
            setMatchClockPreview(next);
            updateAllPlayersClock();
            syncAdminMatchLengthLabelForAllPlayers();
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.roundLengthInc);
        }
    );
    if (matchLengthIncHandled !== undefined) return matchLengthIncHandled;

    switch (widgetName) {
        case UI_TEST_BUTTON_CLOCK_TIME_DEC_ID + playerId:
        case UI_TEST_BUTTON_CLOCK_TIME_INC_ID + playerId:
        case UI_TEST_BUTTON_CLOCK_RESET_ID + playerId:
        case UI_TEST_BUTTON_MATCH_START_ID + playerId:
        case UI_TEST_BUTTON_MATCH_END_ID + playerId:
        case UI_TEST_BUTTON_POS_DEBUG_ID + playerId:
        case UI_TEST_BUTTON_DEPLOY_TIMERS_TOGGLE_ID + playerId:
        case UI_ADMIN_MATCH_LENGTH_DEC_ID + playerId:
        case UI_ADMIN_MATCH_LENGTH_INC_ID + playerId:
            return true;
    }

    return false;
}
