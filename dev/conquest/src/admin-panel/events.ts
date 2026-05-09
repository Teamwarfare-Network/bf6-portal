// @ts-nocheck

const ADMIN_PANEL_PRIMARY_CLICK_DEBOUNCE_SECONDS = 0.12;
const ADMIN_PANEL_PRIMARY_CLICK_RELEASE_GRACE_SECONDS = 2.0;
const adminPanelLastPrimaryClickByPid: UIButtonPrimaryClickTracker = {};

// Per-pid cleanup hook - paired with onPlayerLeaveGameImpl-reachable cleanup in player-join-leave.ts
// to prevent stale tracker entries surviving disconnect-reconnect on recycled pids.
function resetAdminPanelPrimaryClickTrackerForPid(pid: number): void {
    delete adminPanelLastPrimaryClickByPid[pid];
}

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
            setPositionDebugVisibleForPlayer(eventPlayer, state.posDebugVisible);
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.positionDebug);
        }
    );
    if (posDebugHandled !== undefined) return posDebugHandled;

    // v1.493: deploy-timers-visible-toggle handler removed; superseded by Toggle Vehicle Overlay.

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

    // v1.493: perf diag toggle handler removed; FEATURE_PERF_DIAG profiler is non-functional.

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

    // v1.492: Toggle Combat HUD — flips the global hudModeOverride between "core" and "off".
    // Off mode early-returns the per-player VM-build at pipeline.ts:106-115, eliminating S1/S2
    // forced-broadcast hot path.
    // v1.494: explicitly call updateConquestCombatHudForAllPlayers(force=true) after the mode
    // flip so the hide/restore lands on this tick instead of waiting for the next natural
    // render trigger (which pre-game may never come since onLiveTick doesn't fire). Off mode:
    // the dispatcher hits its `if (hudMode === "off")` branch at capture-tickets.ts:2114 and
    // calls twlConquestHudHideAllPlayers() immediately. On mode: markHudDirty() + force=true
    // triggers a full re-render so engage/popout state restores cleanly.
    const combatHudToggleHandled = tryHandleAdminPanelPrimaryAction(
        playerId,
        widgetName,
        eventUIButtonEvent,
        UI_TEST_BUTTON_HUD_TOGGLE_ID,
        () => {
            const next = getConquestHudMode() === "core" ? "off" : "core";
            setConquestHudMode(next);
            if (next === "core") markHudDirty();
            // Force-apply the new mode immediately. Without this, pre-game the widgets
            // stay visible until something else triggers a HUD render (which may never
            // come pre-game) -- the user-visible bug from v1.493.
            updateConquestCombatHudForAllPlayers(true);
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.combatHudToggle);
        }
    );
    if (combatHudToggleHandled !== undefined) return combatHudToggleHandled;

    // v1.492: Toggle Vehicle Overlay — flips the global vehicleDeployTimerDisabledByAdmin flag
    // and triggers a refresh on every viewer so the visibility flip lands immediately. Disable
    // path short-circuits the per-pid render-plan compute at refreshVehicleDeployTimers...
    // (see deploy-timer-ui.ts S3 comment).
    const vehicleOverlayToggleHandled = tryHandleAdminPanelPrimaryAction(
        playerId,
        widgetName,
        eventUIButtonEvent,
        UI_TEST_BUTTON_VEHICLE_OVERLAY_TOGGLE_ID,
        () => {
            State.conquest.debug.vehicleDeployTimerDisabledByAdmin = !State.conquest.debug.vehicleDeployTimerDisabledByAdmin;
            updateVehicleDeployTimerHudForAllPlayers();
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.vehicleOverlayToggle);
        }
    );
    if (vehicleOverlayToggleHandled !== undefined) return vehicleOverlayToggleHandled;

    // v1.492: Toggle Spectator — flips the global spectatorDisabledByAdmin flag. When
    // transitioning ENABLED -> DISABLED, kick any active spectator out cleanly via
    // exitSpectatorMode (idempotent). Refreshes panel + dialog so every viewer's COACH/SPECTATE
    // button picks up the new disabled-grey state. Refreshes the spectator-toggle button's own
    // label to match the new state. Audit log uses the *current* state's label key.
    const spectatorToggleHandled = tryHandleAdminPanelPrimaryAction(
        playerId,
        widgetName,
        eventUIButtonEvent,
        UI_TEST_BUTTON_SPECTATOR_TOGGLE_ID,
        () => {
            const wasDisabled = State.conquest.debug.spectatorDisabledByAdmin;
            State.conquest.debug.spectatorDisabledByAdmin = !wasDisabled;
            // ENABLED -> DISABLED transition: kick any active spectator.
            if (!wasDisabled) {
                const specPid = State.players.spectatorPid;
                if (specPid !== null) {
                    const specPlayer = safeFindPlayer(specPid);
                    if (specPlayer) {
                        try { exitSpectatorMode(specPlayer, specPid); } catch {}
                    }
                }
            }
            // v1.493: refresh every viewer's COACH/SPECTATE button — picks up the new
            // disabled-grey + "Spectator Disabled" label swap from coach-button-sync's
            // applyCoachButtonState. The admin's own panel button stays static-labeled
            // ("Toggle Spectator") so no separate label refresh is needed for it.
            refreshAllVisiblePlayerReadyPanels();
            renderReadyDialogForAllVisibleViewers();
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.spectatorToggle);
        }
    );
    if (spectatorToggleHandled !== undefined) return spectatorToggleHandled;

    switch (widgetName) {
        case UI_TEST_BUTTON_CLOCK_TIME_DEC_ID + playerId:
        case UI_TEST_BUTTON_CLOCK_TIME_INC_ID + playerId:
        case UI_TEST_BUTTON_CLOCK_RESET_ID + playerId:
        case UI_TEST_BUTTON_MATCH_START_ID + playerId:
        case UI_TEST_BUTTON_MATCH_END_ID + playerId:
        case UI_TEST_BUTTON_POS_DEBUG_ID + playerId:
        case UI_TEST_BUTTON_RESET_GADGET_TIMERS_ID + playerId:
        case UI_ADMIN_MATCH_LENGTH_DEC_ID + playerId:
        case UI_ADMIN_MATCH_LENGTH_INC_ID + playerId:
        case UI_TEST_BUTTON_GROUND_DEPLOY_ALL_ID + playerId:
        case UI_TEST_BUTTON_HUD_TOGGLE_ID + playerId:
        case UI_TEST_BUTTON_VEHICLE_OVERLAY_TOGGLE_ID + playerId:
        case UI_TEST_BUTTON_SPECTATOR_TOGGLE_ID + playerId:
            return true;
    }

    return false;
}

