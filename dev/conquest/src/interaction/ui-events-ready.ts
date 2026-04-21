// @ts-nocheck
// Module: interaction/ui-events-ready -- ready-dialog and admin-panel toggle button handlers

// Handles ready-dialog actions and admin panel open/close.
// Returns true when the widget name is recognized (even if the action is gated/no-op).
const READY_DIALOG_PRIMARY_CLICK_DEBOUNCE_SECONDS = 0.12;
const READY_DIALOG_PRIMARY_CLICK_RELEASE_GRACE_SECONDS = 2.0;
const readyDialogLastPrimaryClickByPid: UIButtonPrimaryClickTracker = {};

function tryConsumeReadyDialogPrimaryClickEvent(
    playerId: number,
    widgetName: string,
    eventUIButtonEvent: mod.UIButtonEvent
): boolean {
    return tryConsumeUIButtonPrimaryClickEvent(
        readyDialogLastPrimaryClickByPid,
        playerId,
        widgetName,
        eventUIButtonEvent,
        READY_DIALOG_PRIMARY_CLICK_DEBOUNCE_SECONDS,
        READY_DIALOG_PRIMARY_CLICK_RELEASE_GRACE_SECONDS
    );
}

function tryHandleReadyDialogPrimaryAction(
    eventPlayer: mod.Player,
    playerId: number,
    widgetName: string,
    eventUIButtonEvent: mod.UIButtonEvent,
    widgetBaseId: string,
    action: () => void
): boolean | undefined {
    if (widgetName !== widgetBaseId + playerId) return undefined;
    if (!tryConsumeReadyDialogPrimaryClickEvent(playerId, widgetName, eventUIButtonEvent)) return true;
    action();
    return true;
}

function handleReadyDialogGridKnobClick(
    eventPlayer: mod.Player,
    knobKey: string,
    delta: number
): boolean {
    if (isMatchLive()) return true;
    if (isReadyDialogModeGridPlaceholderKnobKey(knobKey)) {
        return true;
    }
    if (knobKey === READY_DIALOG_CONFIG_GAME_KNOB_KEY) {
        setReadyDialogGameModeIndex(State.round.modeConfig.gameModeIndex + delta, true, eventPlayer);
        return true;
    }
    if (knobKey === READY_DIALOG_CONFIG_PLAYERS_KNOB_KEY) {
        setAutoStartMinActivePlayers(State.round.modeConfig.autoStartMinActivePlayers + delta, eventPlayer);
        return true;
    }
    setReadyDialogVehicleSelectionIndexByKey(
        knobKey,
        (State.round.modeConfig.vehicleSelectionIndexByKey?.[knobKey] ?? 0) + delta,
        eventPlayer
    );
    return true;
}

function handleReadyDialogReadyButtonClick(eventPlayer: mod.Player, playerId: number): void {
    const pid = mod.GetObjId(eventPlayer);
    const currentlyReady = !!State.players.readyByPid[pid];
    const inBase = isPlayerInMainBaseForReady(pid);
    const nowSeconds = Math.floor(mod.GetMatchTimeElapsed());

    // Pre-live gating: players can only set READY while in main base.
    if (!currentlyReady) {
        if (!isMatchLive() && !inBase) {
            return;
        }
        State.players.readyByPid[pid] = true;
        delete State.players.readyNeedsReconfirmByPid[pid];

        const lastReadyAt = State.players.readyMessageCooldownByPid[pid] ?? -9999;
        if (nowSeconds - lastReadyAt >= READY_UP_MESSAGE_COOLDOWN_SECONDS) {
            State.players.readyMessageCooldownByPid[pid] = nowSeconds;
            const counts = getReadyCountsForMessage();
            sendHighlightedWorldLogMessage(
                mod.Message(STR_PLAYER_READIED_UP, eventPlayer, counts.readyCount, counts.totalCount),
                true,
                undefined,
                STR_PLAYER_READIED_UP
            );
        }
    } else {
        State.players.readyByPid[pid] = false;
        delete State.players.readyNeedsReconfirmByPid[pid];
    }

    updateHelpTextVisibilityForPid(pid);
    refreshReadyStatusForAllBuiltReadyDialogs();
    renderReadyDialogForViewer(eventPlayer, playerId);
    renderReadyDialogForAllVisibleViewers();
    updatePlayersReadyHudTextForAllPlayers();
    tryAutoStartMatchIfAllReady(eventPlayer);
}

function tryHandleReadyDialogButtonEvent(
    eventPlayer: mod.Player,
    playerId: number,
    widgetName: string,
    eventUIButtonEvent: mod.UIButtonEvent
): boolean {
    const tryParseGridKnobKey = (prefix: string): string | undefined => {
        const suffix = "_" + playerId;
        if (!widgetName.startsWith(prefix) || !widgetName.endsWith(suffix)) return undefined;
        return widgetName.substring(prefix.length, widgetName.length - suffix.length);
    };

    const gridDecKnobKey = tryParseGridKnobKey(UI_READY_DIALOG_MODE_GRID_KNOB_DEC_ID);
    if (gridDecKnobKey !== undefined) {
        if (!tryConsumeReadyDialogPrimaryClickEvent(playerId, widgetName, eventUIButtonEvent)) return true;
        return handleReadyDialogGridKnobClick(eventPlayer, gridDecKnobKey, -1);
    }

    const gridIncKnobKey = tryParseGridKnobKey(UI_READY_DIALOG_MODE_GRID_KNOB_INC_ID);
    if (gridIncKnobKey !== undefined) {
        if (!tryConsumeReadyDialogPrimaryClickEvent(playerId, widgetName, eventUIButtonEvent)) return true;
        return handleReadyDialogGridKnobClick(eventPlayer, gridIncKnobKey, 1);
    }

    const checkboxKey = tryParseGridKnobKey(UI_READY_DIALOG_CONFIG_CHECKBOX_BOX_ID);
    if (checkboxKey !== undefined) {
        if (!tryConsumeReadyDialogPrimaryClickEvent(playerId, widgetName, eventUIButtonEvent)) return true;
        if (isMatchLive()) return true;
        if (checkboxKey === READY_DIALOG_CONFIG_CHECKBOX_VANILLA_KEY) {
            toggleReadyDialogVanillaDeployCheckbox(eventPlayer);
        } else if (checkboxKey === READY_DIALOG_CONFIG_CHECKBOX_HQ_KEY) {
            toggleReadyDialogHqDeployCheckbox(eventPlayer);
        } else if (checkboxKey === READY_DIALOG_CONFIG_CHECKBOX_AIR_KEY) {
            toggleReadyDialogAirDeployCheckbox(eventPlayer);
        } else if (checkboxKey === READY_DIALOG_CONFIG_CHECKBOX_FORWARD_KEY) {
            toggleReadyDialogForwardDeployCheckbox(eventPlayer);
        } else if (checkboxKey === READY_DIALOG_CONFIG_CHECKBOX_SUPPLY_BOXES_KEY) {
            toggleReadyDialogSupplyBoxesCheckbox(eventPlayer);
        }
        return true;
    }

    const cancelHandled = tryHandleReadyDialogPrimaryAction(
        eventPlayer,
        playerId,
        widgetName,
        eventUIButtonEvent,
        UI_READY_DIALOG_BUTTON_CANCEL_ID,
        () => {
            hideReadyDialogUI(eventPlayer);
        }
    );
    if (cancelHandled !== undefined) return cancelHandled;

    const readyHandled = tryHandleReadyDialogPrimaryAction(
        eventPlayer,
        playerId,
        widgetName,
        eventUIButtonEvent,
        UI_READY_DIALOG_BUTTON_READY_ID,
        () => handleReadyDialogReadyButtonClick(eventPlayer, playerId)
    );
    if (readyHandled !== undefined) return readyHandled;

    const swapHandled = tryHandleReadyDialogPrimaryAction(
        eventPlayer,
        playerId,
        widgetName,
        eventUIButtonEvent,
        UI_READY_DIALOG_BUTTON_SWAP_ID,
        () => {
            swapPlayerTeam(eventPlayer);
        }
    );
    if (swapHandled !== undefined) return swapHandled;

    const confirmHandled = tryHandleReadyDialogPrimaryAction(
        eventPlayer,
        playerId,
        widgetName,
        eventUIButtonEvent,
        UI_READY_DIALOG_MODE_CONFIRM_ID,
        () => {
            if (isMatchLive()) return true;
            confirmReadyDialogModeConfig(eventPlayer);
            updateReadyDialogModeConfigForAllVisibleViewers();
        }
    );
    if (confirmHandled !== undefined) return confirmHandled;

    const resetHandled = tryHandleReadyDialogPrimaryAction(
        eventPlayer,
        playerId,
        widgetName,
        eventUIButtonEvent,
        UI_READY_DIALOG_MODE_RESET_ID,
        () => {
            if (isMatchLive()) return true;
            resetReadyDialogModeConfigToDefaults(eventPlayer);
        }
    );
    if (resetHandled !== undefined) return resetHandled;

    if (FEATURE_ADMIN_PANEL) {
        const adminHandled = tryHandleReadyDialogPrimaryAction(
            eventPlayer,
            playerId,
            widgetName,
            eventUIButtonEvent,
            UI_ADMIN_PANEL_BUTTON_ID,
            () => toggleReadyDialogAdminPanel(eventPlayer, playerId)
        );
        if (adminHandled !== undefined) return adminHandled;
    }

    const hudSwapHandled = tryHandleReadyDialogPrimaryAction(
        eventPlayer,
        playerId,
        widgetName,
        eventUIButtonEvent,
        UI_HUD_TEAM_SWAP_BUTTON_ID,
        () => {
            if (isMatchLive()) return;
            swapPlayerTeam(eventPlayer);
        }
    );
    if (hudSwapHandled !== undefined) return hudSwapHandled;

    return false;
}

