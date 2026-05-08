// @ts-nocheck
// Module: spectator/coach-button-sync -- per-pid COACH button visual+enable state.
//
// Mirror of syncPlayerReadyPanelClaimAdminButtonForPid (player-ready-panel.ts:346): a
// refresh-time sync that reads State.players.spectatorPid + isMatchLive() + the active
// map's spectator-camera authoring, and applies enabled/disabled treatment to the COACH
// button widget triple (button + border + label).
//
// Two callers, one per surface:
//   - syncCoachButtonForPanelPid(pid): the non-admin Player Ready Panel COACH button
//   - syncCoachButtonForDialogPid(pid): the admin's full ready dialog COACH button
//
// State matrix (both surfaces):
//
//   | spectator slot     | match state | camera authored | treatment           |
//   |--------------------|-------------|-----------------|---------------------|
//   | vacant             | pre-live    | yes             | enabled, white      |
//   | vacant             | live        | yes             | disabled, grey      |
//   | owned by viewer    | any         | yes             | disabled, grey      |
//   | owned by other     | any         | yes             | disabled, grey      |
//   | any                | any         | no              | disabled, grey      |
//
// Called from:
//   - refreshPlayerReadyPanelContentForPid (player-ready-panel.ts) -- per-pid panel refresh
//   - renderReadyDialogForViewer (roster-render.ts) -- per-pid dialog refresh
// Both refresh paths fan out via existing broadcast helpers, so a single State write to
// State.players.spectatorPid + a refreshAllVisiblePlayerReadyPanels() +
// renderReadyDialogForAllVisibleViewers() pair updates every viewer's COACH button.

function isCoachButtonEnabledForPid(pid: number): boolean {
    if (!isSpectatorAvailableForActiveMap()) return false;
    if (isMatchLive()) return false;
    const slot = State.players.spectatorPid;
    if (slot !== null && slot !== pid) return false; // taken by another pid
    if (slot === pid) return false; // already this pid's slot; click would be a no-op anyway
    return true;
}

// Apply enabled/disabled visual state to a COACH button widget triple. Shared between the
// panel and dialog surfaces so a future visual tweak lands in one place.
function applyCoachButtonState(
    buttonWidget: any,
    borderWidget: any,
    labelWidget: any,
    enabled: boolean
): void {
    if (buttonWidget) {
        mod.SetUIButtonEnabled(buttonWidget, enabled);
        mod.SetUIWidgetBgColor(buttonWidget, enabled ? COLOR_BUTTON_BASE : COLOR_GRAY_DARK);
        mod.SetUIWidgetBgAlpha(buttonWidget, enabled ? BUTTON_OPACITY_BASE : 0.45);
    }
    if (borderWidget) {
        mod.SetUIWidgetBgColor(borderWidget, enabled ? COLOR_BUTTON_BORDER : COLOR_GRAY_DARK);
        mod.SetUIWidgetBgAlpha(borderWidget, enabled ? BUTTON_BORDER_OPACITY : 0.45);
    }
    if (labelWidget) {
        mod.SetUITextColor(labelWidget, enabled ? COLOR_WHITE : COLOR_GRAY);
    }
}

// Per-pid panel-side COACH button refresh. Called from refreshPlayerReadyPanelContentForPid.
function syncCoachButtonForPanelPid(pid: number): void {
    const enabled = isCoachButtonEnabledForPid(pid);
    const buttonWidget = safeFind(UI_PLAYER_READY_PANEL_BUTTON_COACH_ID + pid);
    const borderWidget = safeFind(UI_PLAYER_READY_PANEL_BUTTON_COACH_ID + pid + "_BORDER");
    const labelWidget = safeFind(UI_PLAYER_READY_PANEL_BUTTON_COACH_LABEL_ID + pid);
    applyCoachButtonState(buttonWidget, borderWidget, labelWidget, enabled);
}

// Per-pid dialog-side COACH button refresh. Called from renderReadyDialogForViewer.
function syncCoachButtonForDialogPid(pid: number): void {
    const enabled = isCoachButtonEnabledForPid(pid);
    const buttonWidget = safeFind(UI_READY_DIALOG_BUTTON_COACH_ID + pid);
    const borderWidget = safeFind(UI_READY_DIALOG_BUTTON_COACH_ID + pid + "_BORDER");
    const labelWidget = safeFind(UI_READY_DIALOG_BUTTON_COACH_LABEL_ID + pid);
    applyCoachButtonState(buttonWidget, borderWidget, labelWidget, enabled);
}
