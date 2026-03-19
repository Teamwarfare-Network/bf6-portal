// @ts-nocheck
// Module: ready-dialog/lifecycle -- ready-dialog close/destroy lifecycle and chrome visibility ownership

//#region -------------------- Ready Dialog Lifecycle --------------------

// Returns the cached ready-dialog chrome widgets that live outside the main content tree.
function getReadyDialogChromeWidgetIds(playerId: number): string[] {
    return [
        UI_READY_DIALOG_CONTAINER_BASE_ID + playerId,
        UI_READY_DIALOG_BORDER_TOP_ID + playerId,
        UI_READY_DIALOG_BORDER_BOTTOM_ID + playerId,
        UI_READY_DIALOG_BORDER_LEFT_ID + playerId,
        UI_READY_DIALOG_BORDER_RIGHT_ID + playerId,
        UI_READY_DIALOG_DEBUG_TIMELIMIT_ID + playerId,
        UI_READY_DIALOG_MAP_LABEL_ID + playerId,
        UI_READY_DIALOG_MAP_VALUE_ID + playerId,
    ];
}

// Returns the cached ready-dialog admin-toggle widgets that outlive the lazy admin panel body.
function getReadyDialogAdminToggleWidgetIds(playerId: number): string[] {
    return [
        UI_ADMIN_PANEL_BUTTON_ID + playerId,
        UI_ADMIN_PANEL_BUTTON_LABEL_ID + playerId,
        UI_ADMIN_PANEL_BUTTON_ID + playerId + "_BORDER",
    ];
}

// Applies one visibility value across a ready-dialog widget-id group.
function setReadyDialogWidgetGroupVisible(widgetIds: string[], visible: boolean): void {
    for (const widgetId of widgetIds) {
        safeSetUIWidgetVisible(safeFind(widgetId), visible);
    }
}

// Deletes a ready-dialog widget-id group during a hard cleanup.
function deleteReadyDialogWidgetGroup(widgetIds: string[]): void {
    for (const widgetId of widgetIds) {
        const widget = safeFind(widgetId);
        if (widget) mod.DeleteUIWidget(widget);
    }
}

// Applies visibility to the cached ready-dialog chrome widgets.
function setReadyDialogChromeVisible(playerId: number, visible: boolean): void {
    setReadyDialogWidgetGroupVisible(getReadyDialogChromeWidgetIds(playerId), visible);
}

// Applies visibility to the cached ready-dialog admin toggle widgets.
function setReadyDialogAdminToggleVisible(playerId: number, visible: boolean): void {
    setReadyDialogWidgetGroupVisible(getReadyDialogAdminToggleWidgetIds(playerId), visible);
}

// Hard-deletes the cached ready-dialog chrome widgets for a player.
function deleteReadyDialogChromeWidgets(playerId: number): void {
    deleteReadyDialogWidgetGroup(getReadyDialogChromeWidgetIds(playerId));
}

// Resets the lazy admin-panel body and toggle state while preserving the cached ready-dialog shell.
function resetReadyDialogAdminFamily(playerId: number): void {
    deleteAdminPanelUI(playerId, false);
    setAdminPanelChildWidgetsVisible(playerId, false);
    setReadyDialogAdminToggleVisible(playerId, false);
}

// Hides the Ready Dialog (cached widgets) and clears per-player dialog/admin visibility state.
function hideReadyDialogUI(eventPlayer: mod.Player | number) {
    let playerId: any = eventPlayer;

    if (mod.IsType(eventPlayer, mod.Types.Player)) {
        setUIInputModeForPlayer(eventPlayer as mod.Player, false);
        playerId = mod.GetObjId(eventPlayer as mod.Player);
    }

    setReadyDialogChromeVisible(playerId, false);
    resetReadyDialogAdminFamily(playerId);

    if (State.players.readyDialogData[playerId]) {
        State.players.readyDialogData[playerId].adminPanelVisible = false;
        State.players.readyDialogData[playerId].adminPanelBuilt = false;
        State.players.readyDialogData[playerId].dialogVisible = false;
    }

    updateHelpTextVisibilityForPid(playerId);
}

// Closes Ready Dialog UI for every viewer that currently has the dialog open.
function closeReadyDialogForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const pid = mod.GetObjId(p);
        if (State.players.readyDialogData[pid]?.dialogVisible) {
            hideReadyDialogUI(p);
        }
    }
}

// Hard delete used only for cleanup such as player leave or layout invalidation.
function destroyReadyDialogUI(playerId: number): void {
    deleteReadyDialogChromeWidgets(playerId);
    deleteAdminPanelUI(playerId, true);
    deletePositionDebugWidgetsForPid(playerId);
    const state = State.players.readyDialogData[playerId];
    if (state) {
        state.uiBuilt = false;
        state.adminPanelBuilt = false;
        state.dialogVisible = false;
        resetReadyDialogSectionSignaturesForPid(playerId);
    }
}

//#endregion ----------------- Ready Dialog Lifecycle --------------------
