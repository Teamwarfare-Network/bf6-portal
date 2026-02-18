// @ts-nocheck
// Module: admin-panel/visibility -- toggle lifecycle and child visibility guards.

// Some UI implementations do not cascade visibility from a container to its children.
// To avoid "ghost" admin widgets appearing when the panel is hidden, explicitly toggle all admin/tester widgets.
function setAdminPanelChildWidgetsVisible(playerId: number, visible: boolean): void {
    const ids: string[] = [
        // Admin panel header + row labels.
        UI_TEST_HEADER_LABEL_ID,
        UI_TEST_LABEL_CLOCK_TIME_ID,
        UI_ADMIN_MATCH_LENGTH_LABEL_ID,

        // Row +/- buttons.
        UI_TEST_BUTTON_CLOCK_TIME_DEC_ID, UI_TEST_BUTTON_CLOCK_TIME_INC_ID,
        UI_ADMIN_MATCH_LENGTH_DEC_ID, UI_ADMIN_MATCH_LENGTH_INC_ID,

        // +/- text overlays.
        UI_TEST_MINUS_TEXT_ID,
        UI_TEST_PLUS_TEXT_ID,

        // Admin action buttons.
        UI_TEST_BUTTON_CLOCK_RESET_ID, UI_TEST_RESET_TEXT_ID,
        UI_TEST_BUTTON_MATCH_START_ID, UI_TEST_MATCH_START_TEXT_ID,
        UI_TEST_BUTTON_MATCH_END_ID, UI_TEST_MATCH_END_TEXT_ID,
        UI_TEST_BUTTON_POS_DEBUG_ID, UI_TEST_POS_DEBUG_TEXT_ID,
    ];

    for (const baseId of ids) {
        const w = safeFind(baseId + playerId);
        if (w) mod.SetUIWidgetVisible(w, visible);
        const border = safeFind(baseId + playerId + "_BORDER");
        if (border) mod.SetUIWidgetVisible(border, visible);
    }
}

// Admin panel lifecycle helper.
// We do not cache panel contents because some clients do not reliably hide child widgets with container visibility.
// Instead, we delete the panel container + children whenever it is closed, and rebuild on demand.
function deleteAdminPanelUI(playerId: number, deleteToggle: boolean): void {
    // Hide child widgets first (covers any detached children that may outlive container hides).
    setAdminPanelChildWidgetsVisible(playerId, false);

    const adminContainer = safeFind(UI_ADMIN_PANEL_CONTAINER_ID + playerId);
    if (adminContainer) mod.DeleteUIWidget(adminContainer);

    if (deleteToggle) {
        const adminToggle = safeFind(UI_ADMIN_PANEL_BUTTON_ID + playerId);
        if (adminToggle) mod.DeleteUIWidget(adminToggle);
        const adminToggleLabel = safeFind(UI_ADMIN_PANEL_BUTTON_LABEL_ID + playerId);
        if (adminToggleLabel) mod.DeleteUIWidget(adminToggleLabel);
        const adminToggleBorder = safeFind(UI_ADMIN_PANEL_BUTTON_ID + playerId + "_BORDER");
        if (adminToggleBorder) mod.DeleteUIWidget(adminToggleBorder);
    }
}

function ensureAdminPanelWidgets(eventPlayer: mod.Player, playerId: number): void {
    const adminToggleButtonId = UI_ADMIN_PANEL_BUTTON_ID + playerId;
    const adminToggleLabelId = UI_ADMIN_PANEL_BUTTON_LABEL_ID + playerId;
    const adminContainerId = UI_ADMIN_PANEL_CONTAINER_ID + playerId;

    // Create toggle button if missing.
    let toggleBtn = safeFind(adminToggleButtonId);
    if (!toggleBtn) {
        addOutlinedButton(
            adminToggleButtonId,
            ADMIN_PANEL_TOGGLE_OFFSET_X,
            ADMIN_PANEL_TOGGLE_OFFSET_Y,
            ADMIN_PANEL_TOGGLE_WIDTH,
            ADMIN_PANEL_TOGGLE_HEIGHT,
            mod.UIAnchor.TopRight,
            mod.GetUIRoot(),
            eventPlayer
        );
        toggleBtn = mod.FindUIWidgetWithName(adminToggleButtonId, mod.GetUIRoot());
    }

    // Recreate label to guarantee correct anchor/parenting with outlined border.
    const existingToggleLabel = safeFind(adminToggleLabelId);
    if (existingToggleLabel) mod.DeleteUIWidget(existingToggleLabel);
    const adminToggleBorder = safeFind(adminToggleButtonId + "_BORDER");
    const toggleLabel = addCenteredButtonText(
        adminToggleLabelId,
        ADMIN_PANEL_TOGGLE_WIDTH,
        ADMIN_PANEL_TOGGLE_HEIGHT,
        mod.Message(mod.stringkeys.twl.adminPanel.buttons.panel),
        eventPlayer,
        adminToggleBorder ?? mod.GetUIRoot()
    );
    if (toggleLabel) {
        mod.SetUITextSize(toggleLabel, 12);
        mod.SetUITextColor(toggleLabel, ADMIN_PANEL_BUTTON_TEXT_COLOR);
        mod.SetUIWidgetDepth(toggleLabel, mod.UIDepth.AboveGameUI);
    }

    // Create admin container if missing.
    let adminContainer = safeFind(adminContainerId);
    if (!adminContainer) {
        mod.AddUIContainer(
            adminContainerId,
            mod.CreateVector(ADMIN_PANEL_OFFSET_X, ADMIN_PANEL_OFFSET_Y, 0),
            mod.CreateVector(
                ADMIN_PANEL_CONTENT_WIDTH + (ADMIN_PANEL_PADDING * 2),
                ADMIN_PANEL_HEIGHT + (ADMIN_PANEL_PADDING * 2),
                0
            ),
            mod.UIAnchor.TopRight,
            mod.GetUIRoot(),
            false,
            10,
            ADMIN_PANEL_BG_COLOR,
            ADMIN_PANEL_BG_ALPHA,
            ADMIN_PANEL_BG_FILL,
            mod.UIDepth.AboveGameUI,
            eventPlayer
        );
        adminContainer = mod.FindUIWidgetWithName(adminContainerId, mod.GetUIRoot());
    }

    // Admin toggle button should exist only while the Ready Dialog is open.
    // When caching is enabled, we hide/show rather than recreate.
    if (toggleBtn) mod.SetUIWidgetVisible(toggleBtn, true);
    if (toggleLabel) mod.SetUIWidgetVisible(toggleLabel, true);
    const toggleBorder = safeFind(adminToggleButtonId + "_BORDER");
    if (toggleBorder) mod.SetUIWidgetVisible(toggleBorder, true);

    // Default closed on first build; preserve state on reopen.
    if (!State.players.readyDialogData[playerId]) initReadyDialogData(eventPlayer);
    if (!State.players.readyDialogData[playerId].adminPanelBuilt) {
        State.players.readyDialogData[playerId].adminPanelVisible = false;
        if (adminContainer) mod.SetUIWidgetVisible(adminContainer, false);
        setAdminPanelChildWidgetsVisible(playerId, false);
    } else {
        const visible = State.players.readyDialogData[playerId].adminPanelVisible;
        if (adminContainer) mod.SetUIWidgetVisible(adminContainer, visible);
        setAdminPanelChildWidgetsVisible(playerId, visible);
    }
}
