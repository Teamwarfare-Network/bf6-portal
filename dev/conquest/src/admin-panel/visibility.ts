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
        UI_TEST_BUTTON_DEPLOY_TIMERS_TOGGLE_ID, UI_TEST_DEPLOY_TIMERS_TOGGLE_TEXT_ID,
    ];

    for (const baseId of ids) {
        const w = safeFind(baseId + playerId);
        safeSetUIWidgetVisible(w, visible);
        const border = safeFind(baseId + playerId + "_BORDER");
        safeSetUIWidgetVisible(border, visible);
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

// Ensures the static admin-panel toggle exists under the ready dialog.
// The panel contents remain lazy-built from the button event path.
function ensureAdminPanelWidgets(
    eventPlayer: mod.Player,
    playerId: number,
    parent?: mod.UIWidget,
    visible: boolean = true
): void {
    const adminToggleButtonId = UI_ADMIN_PANEL_BUTTON_ID + playerId;
    const adminToggleLabelId = UI_ADMIN_PANEL_BUTTON_LABEL_ID + playerId;
    const adminToggleParent = mod.GetUIRoot();

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
            adminToggleParent,
            eventPlayer
        );
        toggleBtn = safeFind(adminToggleButtonId);
    }

    const adminToggleBorder = safeFind(adminToggleButtonId + "_BORDER");
    if (toggleBtn) {
        mod.SetUIWidgetParent(toggleBtn, adminToggleParent);
        mod.SetUIWidgetAnchor(toggleBtn, mod.UIAnchor.TopRight);
        mod.SetUIWidgetPosition(toggleBtn, mod.CreateVector(ADMIN_PANEL_TOGGLE_OFFSET_X, ADMIN_PANEL_TOGGLE_OFFSET_Y, 0));
        mod.SetUIWidgetSize(toggleBtn, mod.CreateVector(ADMIN_PANEL_TOGGLE_WIDTH, ADMIN_PANEL_TOGGLE_HEIGHT, 0));
        mod.SetUIWidgetDepth(toggleBtn, mod.UIDepth.AboveGameUI);
    }
    if (adminToggleBorder) {
        mod.SetUIWidgetParent(adminToggleBorder, adminToggleParent);
        mod.SetUIWidgetAnchor(adminToggleBorder, mod.UIAnchor.TopRight);
        mod.SetUIWidgetPosition(adminToggleBorder, mod.CreateVector(ADMIN_PANEL_TOGGLE_OFFSET_X, ADMIN_PANEL_TOGGLE_OFFSET_Y, 0));
        mod.SetUIWidgetSize(adminToggleBorder, mod.CreateVector(ADMIN_PANEL_TOGGLE_WIDTH, ADMIN_PANEL_TOGGLE_HEIGHT, 0));
        mod.SetUIWidgetDepth(adminToggleBorder, mod.UIDepth.AboveGameUI);
    }
    let toggleLabel = safeFind(adminToggleLabelId);
    if (!toggleLabel) {
        toggleLabel = addCenteredButtonText(
            adminToggleLabelId,
            ADMIN_PANEL_TOGGLE_WIDTH,
            ADMIN_PANEL_TOGGLE_HEIGHT,
            mod.Message(mod.stringkeys.twl.adminPanel.buttons.panel),
            eventPlayer,
            adminToggleBorder ?? adminToggleParent
        );
    } else {
        safeSetUITextLabel(toggleLabel, mod.Message(mod.stringkeys.twl.adminPanel.buttons.panel));
        if (adminToggleBorder) {
            mod.SetUIWidgetParent(toggleLabel, adminToggleBorder);
        }
    }
    if (toggleLabel) {
        mod.SetUITextSize(toggleLabel, 12);
        mod.SetUITextColor(toggleLabel, ADMIN_PANEL_BUTTON_TEXT_COLOR);
        mod.SetUIWidgetDepth(toggleLabel, mod.UIDepth.AboveGameUI);
    }

    safeSetUIWidgetVisible(toggleBtn, visible);
    safeSetUIWidgetVisible(toggleLabel, visible);
    const toggleBorder = safeFind(adminToggleButtonId + "_BORDER");
    safeSetUIWidgetVisible(toggleBorder, visible);

    if (!State.players.readyDialogData[playerId]) initReadyDialogData(eventPlayer);
    if (!State.players.readyDialogData[playerId].adminPanelBuilt) {
        State.players.readyDialogData[playerId].adminPanelVisible = false;
    }
}

// Toggles the lazy admin panel body from the ready-dialog admin button without leaking that lifecycle into input routing.
function toggleReadyDialogAdminPanel(eventPlayer: mod.Player, playerId: number): void {
    if (!State.players.readyDialogData[playerId]) initReadyDialogData(eventPlayer);
    const state = State.players.readyDialogData[playerId];
    const now = mod.GetMatchTimeElapsed();
    if (now - state.lastAdminPanelToggleAt < ADMIN_PANEL_TOGGLE_COOLDOWN_SECONDS) {
        return;
    }
    state.lastAdminPanelToggleAt = now;

    state.adminPanelVisible = !state.adminPanelVisible;
    if (!state.adminPanelVisible) {
        deleteAdminPanelUI(playerId, false);
        state.adminPanelBuilt = false;
        return;
    }

    sendHighlightedWorldLogMessage(
        mod.Message(mod.stringkeys.twl.adminPanel.accessed, eventPlayer),
        true,
        undefined,
        mod.stringkeys.twl.adminPanel.accessed
    );

    deleteAdminPanelUI(playerId, false);
    mod.AddUIContainer(
        UI_ADMIN_PANEL_CONTAINER_ID + playerId,
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

    const adminContainer = safeFind(UI_ADMIN_PANEL_CONTAINER_ID + playerId);
    if (!adminContainer) {
        return;
    }
    buildAdminPanelWidgets(eventPlayer, adminContainer, playerId);
    state.adminPanelBuilt = true;
    safeSetUIWidgetVisible(adminContainer, true);
    setAdminPanelChildWidgetsVisible(playerId, true);
}
