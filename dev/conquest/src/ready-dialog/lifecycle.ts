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
    let player: mod.Player | undefined;

    if (mod.IsType(eventPlayer, mod.Types.Player)) {
        player = eventPlayer as mod.Player;
        setUIInputModeForPlayer(player, false);
        playerId = mod.GetObjId(player);
    } else if (Number.isInteger(eventPlayer)) {
        player = safeFindPlayer(eventPlayer as number);
    }

    setReadyDialogChromeVisible(playerId, false);
    resetReadyDialogAdminFamily(playerId);

    if (State.players.readyDialogData[playerId]) {
        State.players.readyDialogData[playerId].adminPanelVisible = false;
        State.players.readyDialogData[playerId].adminPanelBuilt = false;
        State.players.readyDialogData[playerId].dialogVisible = false;
    }

    updateHelpTextVisibilityForPid(playerId);
    if (player && mod.IsPlayerValid(player)) {
        const shouldRestoreCriticalHud = !isVehicleDeployLiveMenuOpenForPid(playerId);
        if (shouldRestoreCriticalHud) {
            prebuildVehicleDeployTimerHudHiddenForPlayer(player);
            renderCriticalHudForReveal(player, playerId);
        } else {
            updateVehicleDeployTimerHudForPlayer(player);
        }
    }
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

// Invalidates one hidden ready-dialog cache so the next open rebuilds with fresh roster/map state
// instead of relabeling a stale cached tree during open.
function invalidateHiddenReadyDialogCacheForPid(playerId: number): void {
    const state = State.players.readyDialogData[playerId];
    if (!state || state.dialogVisible) return;
    if (!state.uiBuilt) {
        resetReadyDialogSectionSignaturesForPid(playerId);
        return;
    }
    destroyReadyDialogUI(playerId);
}

// Invalidates hidden ready-dialog caches for all players when shared state changes while dialogs are closed.
function invalidateHiddenReadyDialogCacheForAllPlayers(): void {
    for (const pidStr in State.players.readyDialogData) {
        const pid = Number(pidStr);
        invalidateHiddenReadyDialogCacheForPid(pid);
    }
}

// Rebuilds one hidden ready-dialog cache ahead of user open so cached reveal stays fast.
function warmHiddenReadyDialogCacheForPid(playerId: number): void {
    const state = State.players.readyDialogData[playerId];
    if (!state || state.dialogVisible) return;
    if (!State.players.deployedByPid[playerId]) return;
    const player = safeFindPlayer(playerId);
    if (!player || !mod.IsPlayerValid(player)) return;
    ensureReadyDialogUiBuiltHidden(player);
}

//#endregion ----------------- Ready Dialog Lifecycle --------------------
