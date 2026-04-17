// @ts-nocheck

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
            // CQ_Bug_51: lock in the admin's choice so later reveal paths (respawn, team-swap
            // re-warm, ready-dialog close) stop re-asserting posDebugVisible=true via autoStart.
            state.posDebugAdminOverride = true;
            if (FEATURE_POSITION_DEBUG) setPositionDebugVisibleForPlayer(eventPlayer, state.posDebugVisible);
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

    const resetGadgetTimersHandled = tryHandleAdminPanelPrimaryAction(
        playerId,
        widgetName,
        eventUIButtonEvent,
        UI_TEST_BUTTON_RESET_GADGET_TIMERS_ID,
        () => {
            resetAllArmTimers();
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.resetGadgetTimers);
        }
    );
    if (resetGadgetTimersHandled !== undefined) return resetGadgetTimersHandled;

    const perfDiagHandled = tryHandleAdminPanelPrimaryAction(
        playerId,
        widgetName,
        eventUIButtonEvent,
        UI_TEST_BUTTON_PERF_DIAG_TOGGLE_ID,
        () => {
            if (FEATURE_PERF_DIAG) setPerfDiagEnabled(!State.admin.perfDiagEnabled);
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.perfDiagToggle);
        }
    );
    if (perfDiagHandled !== undefined) return perfDiagHandled;

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

    const groundDeployAllHandled = tryHandleAdminPanelPrimaryAction(
        playerId,
        widgetName,
        eventUIButtonEvent,
        UI_TEST_BUTTON_GROUND_DEPLOY_ALL_ID,
        () => {
            forceSpawnAllReadyVehicleSlots();
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.groundDeployAll);
        }
    );
    if (groundDeployAllHandled !== undefined) return groundDeployAllHandled;

    if (FEATURE_ADMIN_PANEL) {
        const bhF16Handled = tryHandleAdminPanelPrimaryAction(
            playerId, widgetName, eventUIButtonEvent, UI_TEST_BUTTON_BH_F16_ID,
            () => { runBhSpawnTestF16(eventPlayer); }
        );
        if (bhF16Handled !== undefined) return bhF16Handled;

        const bhAH6MHandled = tryHandleAdminPanelPrimaryAction(
            playerId, widgetName, eventUIButtonEvent, UI_TEST_BUTTON_BH_AH6M_ID,
            () => { runBhSpawnTestAH6M(eventPlayer); }
        );
        if (bhAH6MHandled !== undefined) return bhAH6MHandled;

        const bhDirtBikeHandled = tryHandleAdminPanelPrimaryAction(
            playerId, widgetName, eventUIButtonEvent, UI_TEST_BUTTON_BH_DIRTBIKE_ID,
            () => { runBhSpawnTestDirtBike(eventPlayer); }
        );
        if (bhDirtBikeHandled !== undefined) return bhDirtBikeHandled;

        const bhBlackHawkHandled = tryHandleAdminPanelPrimaryAction(
            playerId, widgetName, eventUIButtonEvent, UI_TEST_BUTTON_BH_BLACKHAWK_ID,
            () => { runBhSpawnTestBlackHawk(eventPlayer); }
        );
        if (bhBlackHawkHandled !== undefined) return bhBlackHawkHandled;
    }

    if (FEATURE_MIN_SPAWN_TEST) {
        // v1.236 Phase 1: all 5 buttons test F16 (control vehicle) with different teleport+wait+seat
        // variants. Button IDs are repurposed from the original per-vehicle matrix — the ID
        // constants keep their old names but the handlers now map variant axes, not vehicles.
        const minSpawnBaseHandled = tryHandleAdminPanelPrimaryAction(
            playerId, widgetName, eventUIButtonEvent, UI_TEST_BUTTON_MIN_SPAWN_F16_ID,
            () => { void runMinimalSpawnTest(eventPlayer, mod.VehicleList.F16, MIN_SPAWN_TEST_VARIANT_BASE); }
        );
        if (minSpawnBaseHandled !== undefined) return minSpawnBaseHandled;

        const minSpawnSeatMinusOneHandled = tryHandleAdminPanelPrimaryAction(
            playerId, widgetName, eventUIButtonEvent, UI_TEST_BUTTON_MIN_SPAWN_AH64_ID,
            () => { void runMinimalSpawnTest(eventPlayer, mod.VehicleList.F16, MIN_SPAWN_TEST_VARIANT_SEAT_MINUS_ONE); }
        );
        if (minSpawnSeatMinusOneHandled !== undefined) return minSpawnSeatMinusOneHandled;

        const minSpawnTpGroundHandled = tryHandleAdminPanelPrimaryAction(
            playerId, widgetName, eventUIButtonEvent, UI_TEST_BUTTON_MIN_SPAWN_F22_ID,
            () => { void runMinimalSpawnTest(eventPlayer, mod.VehicleList.F16, MIN_SPAWN_TEST_VARIANT_TP_GROUND); }
        );
        if (minSpawnTpGroundHandled !== undefined) return minSpawnTpGroundHandled;

        const minSpawnTp5yHandled = tryHandleAdminPanelPrimaryAction(
            playerId, widgetName, eventUIButtonEvent, UI_TEST_BUTTON_MIN_SPAWN_MH6_ID,
            () => { void runMinimalSpawnTest(eventPlayer, mod.VehicleList.F16, MIN_SPAWN_TEST_VARIANT_TP_5Y); }
        );
        if (minSpawnTp5yHandled !== undefined) return minSpawnTp5yHandled;

        const minSpawnTp5yLongHandled = tryHandleAdminPanelPrimaryAction(
            playerId, widgetName, eventUIButtonEvent, UI_TEST_BUTTON_MIN_SPAWN_ABRAMS_ID,
            () => { void runMinimalSpawnTest(eventPlayer, mod.VehicleList.F16, MIN_SPAWN_TEST_VARIANT_TP_5Y_LONG); }
        );
        if (minSpawnTp5yLongHandled !== undefined) return minSpawnTp5yLongHandled;

        const minSpawnSpwnHandled = tryHandleAdminPanelPrimaryAction(
            playerId, widgetName, eventUIButtonEvent, UI_TEST_BUTTON_MIN_SPAWN_SPWN_ID,
            () => { void runMinimalSpawnTestWithSpawnPoint(eventPlayer); }
        );
        if (minSpawnSpwnHandled !== undefined) return minSpawnSpwnHandled;
    }

    switch (widgetName) {
        case UI_TEST_BUTTON_CLOCK_TIME_DEC_ID + playerId:
        case UI_TEST_BUTTON_CLOCK_TIME_INC_ID + playerId:
        case UI_TEST_BUTTON_CLOCK_RESET_ID + playerId:
        case UI_TEST_BUTTON_MATCH_START_ID + playerId:
        case UI_TEST_BUTTON_MATCH_END_ID + playerId:
        case UI_TEST_BUTTON_POS_DEBUG_ID + playerId:
        case UI_TEST_BUTTON_DEPLOY_TIMERS_TOGGLE_ID + playerId:
        case UI_TEST_BUTTON_RESET_GADGET_TIMERS_ID + playerId:
        case UI_TEST_BUTTON_PERF_DIAG_TOGGLE_ID + playerId:
        case UI_ADMIN_MATCH_LENGTH_DEC_ID + playerId:
        case UI_ADMIN_MATCH_LENGTH_INC_ID + playerId:
        case UI_TEST_BUTTON_GROUND_DEPLOY_ALL_ID + playerId:
        case UI_TEST_BUTTON_MIN_SPAWN_F16_ID + playerId:
        case UI_TEST_BUTTON_MIN_SPAWN_AH64_ID + playerId:
        case UI_TEST_BUTTON_MIN_SPAWN_F22_ID + playerId:
        case UI_TEST_BUTTON_MIN_SPAWN_MH6_ID + playerId:
        case UI_TEST_BUTTON_MIN_SPAWN_ABRAMS_ID + playerId:
        case UI_TEST_BUTTON_MIN_SPAWN_SPWN_ID + playerId:
        case UI_TEST_BUTTON_BH_F16_ID + playerId:
        case UI_TEST_BUTTON_BH_AH6M_ID + playerId:
        case UI_TEST_BUTTON_BH_DIRTBIKE_ID + playerId:
        case UI_TEST_BUTTON_BH_BLACKHAWK_ID + playerId:
            return true;
    }

    return false;
}

