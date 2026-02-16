// @ts-nocheck
// Module: ready-dialog/dialog-build -- ready dialog layout construction and left-panel buttons

//#region -------------------- UI - Ready Up Dialog (construction) --------------------

// Ensures the Admin Panel toggle button + container exist for this player and are shown/hidden correctly.
// Required for UI caching: we hide these widgets on dialog close (not delete), so reopen can simply re-show them.

// Some UI implementations do not cascade visibility from a container to its children.
// To avoid "ghost" admin widgets appearing when the panel is hidden, we explicitly toggle all admin/tester widgets.
function setAdminPanelChildWidgetsVisible(playerId: number, visible: boolean): void {
    const ids: string[] = [
        // Admin panel header + row labels
        UI_TEST_HEADER_LABEL_ID,
        UI_TEST_LABEL_CLOCK_TIME_ID,
        UI_ADMIN_ROUND_LENGTH_LABEL_ID,

        // Row +/- buttons
        UI_TEST_BUTTON_CLOCK_TIME_DEC_ID, UI_TEST_BUTTON_CLOCK_TIME_INC_ID,
        UI_ADMIN_ROUND_LENGTH_DEC_ID, UI_ADMIN_ROUND_LENGTH_INC_ID,

        // +/- text overlays
        UI_TEST_MINUS_TEXT_ID,
        UI_TEST_PLUS_TEXT_ID,

        // Admin action buttons
        UI_TEST_BUTTON_CLOCK_RESET_ID, UI_TEST_RESET_TEXT_ID,
        UI_TEST_BUTTON_ROUND_START_ID, UI_TEST_ROUND_START_TEXT_ID,
        UI_TEST_BUTTON_ROUND_END_ID, UI_TEST_ROUND_END_TEXT_ID,
        UI_TEST_BUTTON_POS_DEBUG_ID, UI_TEST_POS_DEBUG_TEXT_ID,
    ];

    for (const baseId of ids) {
        const w = safeFind(baseId + playerId);
        if (w) mod.SetUIWidgetVisible(w, visible);
        const border = safeFind(baseId + playerId + "_BORDER");
        if (border) mod.SetUIWidgetVisible(border, visible);
    }

}

// Admin Panel lifecycle helper.
// We DO NOT cache the admin panel contents because some engines do not reliably hide container children.
// Instead, we delete the panel container + all children whenever it is closed, and rebuild on-demand.
function deleteAdminPanelUI(playerId: number, deleteToggle: boolean): void {
    // Hide child widgets first (covers any stray children that may have detached from the container).
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
    const ADMIN_TOGGLE_BUTTON_ID = UI_ADMIN_PANEL_BUTTON_ID + playerId;
    const ADMIN_TOGGLE_LABEL_ID = UI_ADMIN_PANEL_BUTTON_LABEL_ID + playerId;
    const ADMIN_CONTAINER_ID = UI_ADMIN_PANEL_CONTAINER_ID + playerId;

    // Create toggle button if missing.
    let toggleBtn = safeFind(ADMIN_TOGGLE_BUTTON_ID);
    if (!toggleBtn) {
        const toggleBorder = addOutlinedButton(
            ADMIN_TOGGLE_BUTTON_ID,
            ADMIN_PANEL_TOGGLE_OFFSET_X,
            ADMIN_PANEL_TOGGLE_OFFSET_Y,
            ADMIN_PANEL_TOGGLE_WIDTH,
            ADMIN_PANEL_TOGGLE_HEIGHT,
            mod.UIAnchor.TopRight,
            mod.GetUIRoot(),
            eventPlayer
        );
        toggleBtn = mod.FindUIWidgetWithName(ADMIN_TOGGLE_BUTTON_ID, mod.GetUIRoot());
    }

    // Recreate label to guarantee correct anchor/parenting with outlined border.
    const existingToggleLabel = safeFind(ADMIN_TOGGLE_LABEL_ID);
    if (existingToggleLabel) mod.DeleteUIWidget(existingToggleLabel);
    const adminToggleBorder = safeFind(ADMIN_TOGGLE_BUTTON_ID + "_BORDER");
    const toggleLabel = addCenteredButtonText(
        ADMIN_TOGGLE_LABEL_ID,
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
    let adminContainer = safeFind(ADMIN_CONTAINER_ID);
    if (!adminContainer) {
        mod.AddUIContainer(
            ADMIN_CONTAINER_ID,
            mod.CreateVector(ADMIN_PANEL_OFFSET_X, ADMIN_PANEL_OFFSET_Y, 0),
            mod.CreateVector(ADMIN_PANEL_CONTENT_WIDTH + (ADMIN_PANEL_PADDING * 2), ADMIN_PANEL_HEIGHT + (ADMIN_PANEL_PADDING * 2), 0),
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
        adminContainer = mod.FindUIWidgetWithName(ADMIN_CONTAINER_ID, mod.GetUIRoot());
    }

    // Admin toggle button should exist only while the Ready Up dialog is open.
    // When caching is enabled, we hide/show rather than recreate.
    if (toggleBtn) mod.SetUIWidgetVisible(toggleBtn, true);
    if (toggleLabel) mod.SetUIWidgetVisible(toggleLabel, true);
    const toggleBorder = safeFind(ADMIN_TOGGLE_BUTTON_ID + "_BORDER");
    if (toggleBorder) mod.SetUIWidgetVisible(toggleBorder, true);

    // Default closed on first build; preserve state on reopen.
    if (!State.players.teamSwitchData[playerId]) initTeamSwitchData(eventPlayer);
    if (!State.players.teamSwitchData[playerId].adminPanelBuilt) {
        State.players.teamSwitchData[playerId].adminPanelVisible = false;
        if (adminContainer) mod.SetUIWidgetVisible(adminContainer, false);
        setAdminPanelChildWidgetsVisible(playerId, false);
    } else {
        const visible = State.players.teamSwitchData[playerId].adminPanelVisible;
        if (adminContainer) mod.SetUIWidgetVisible(adminContainer, visible);
        setAdminPanelChildWidgetsVisible(playerId, visible);
    }
}

function createTeamSwitchUI(eventPlayer: mod.Player) {
    // Steps:
    // 1) Ensure per-player dialog root exists
    // 2) Build left team panel widgets
    // 3) Build right team panel widgets
    // 4) Build admin panel widgets + bind button IDs
    // 5) Finalize visibility / default states

    // UI layout maps (per panel):
    // - Left panel: Team 1 roster / interaction surface (layout-driven).
    // - Right panel: Team 2 roster / interaction surface (layout-driven).
    // - Admin panel: Tunable controls that mutate authoritative state; rows are placed via row0Y + N * (buttonSizeY + rowSpacingY).
    // Layout rule: if a label wraps or overlaps, adjust labelSizeX or text size before touching row math.

    const playerId = mod.GetObjId(eventPlayer);
    // UI caching (opt #1): if this player already built the dialog once, just show it again.
    // This avoids recreating ~100 widgets on every open and makes dialog open near-instant after first build.
    const existingBase = safeFind(UI_TEAMSWITCH_CONTAINER_BASE_ID + playerId);
    if (existingBase) {
        mod.SetUIWidgetVisible(existingBase, true);
        const existingBorderTop = safeFind(UI_TEAMSWITCH_BORDER_TOP_ID + playerId);
        if (existingBorderTop) mod.SetUIWidgetVisible(existingBorderTop, true);
        const existingBorderBottom = safeFind(UI_TEAMSWITCH_BORDER_BOTTOM_ID + playerId);
        if (existingBorderBottom) mod.SetUIWidgetVisible(existingBorderBottom, true);
        const existingBorderLeft = safeFind(UI_TEAMSWITCH_BORDER_LEFT_ID + playerId);
        if (existingBorderLeft) mod.SetUIWidgetVisible(existingBorderLeft, true);
        const existingBorderRight = safeFind(UI_TEAMSWITCH_BORDER_RIGHT_ID + playerId);
        if (existingBorderRight) mod.SetUIWidgetVisible(existingBorderRight, true);
        const existingDebug = safeFind(UI_TEAMSWITCH_DEBUG_TIMELIMIT_ID + playerId);
        if (existingDebug) mod.SetUIWidgetVisible(existingDebug, SHOW_DEBUG_TIMELIMIT);
        refreshReadyDialogButtonTextForPid(eventPlayer, playerId, existingBase as mod.UIWidget);
        const existingMapLabel = safeFind(UI_READY_DIALOG_MAP_LABEL_ID + playerId);
        if (existingMapLabel) mod.SetUIWidgetVisible(existingMapLabel, true);
        const existingMapValue = safeFind(UI_READY_DIALOG_MAP_VALUE_ID + playerId);
        if (existingMapValue) mod.SetUIWidgetVisible(existingMapValue, true);
        updateReadyDialogModeConfigForPid(playerId);
        ensureAdminPanelWidgets(eventPlayer, playerId);
        return;
    }

    const CONTAINER_BASE_ID = UI_TEAMSWITCH_CONTAINER_BASE_ID + playerId;
    const BORDER_TOP_ID = UI_TEAMSWITCH_BORDER_TOP_ID + playerId;
    const BORDER_BOTTOM_ID = UI_TEAMSWITCH_BORDER_BOTTOM_ID + playerId;
    const BORDER_LEFT_ID = UI_TEAMSWITCH_BORDER_LEFT_ID + playerId;
    const BORDER_RIGHT_ID = UI_TEAMSWITCH_BORDER_RIGHT_ID + playerId;
    const CONTAINER_BORDER_PADDING = 1;
    const CONTAINER_BORDER_THICKNESS = 2;
    const CONTAINER_BORDER_OVERLAP = 2;
    const CONTAINER_WIDTH = 1300;
    const CONTAINER_HEIGHT = 700;
    const READY_ROSTER_PANEL_WIDTH = 580;
    const READY_ROSTER_PANEL_HEIGHT = 440;
    const READY_ROSTER_PANEL_GAP = 40;
    const READY_ROSTER_PANEL_MARGIN = 40;
    const READY_ROSTER_PANEL_Y = 175;

    const BUTTON_CANCEL_ID = UI_TEAMSWITCH_BUTTON_CANCEL_ID + playerId;
    const BUTTON_CANCEL_LABEL_ID = UI_TEAMSWITCH_BUTTON_CANCEL_LABEL_ID + playerId;

    mod.AddUIContainer(
        CONTAINER_BASE_ID,
        mod.CreateVector(0, 0, 0),
        mod.CreateVector(CONTAINER_WIDTH, CONTAINER_HEIGHT, 0),
        mod.UIAnchor.Center,
        mod.GetUIRoot(),
        true,
        10,
        mod.CreateVector(0, 0, 0),
        0.995,
        mod.UIBgFill.Blur,
        mod.UIDepth.AboveGameUI,
        eventPlayer
    );
    const CONTAINER_BASE = mod.FindUIWidgetWithName(CONTAINER_BASE_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(CONTAINER_BASE, 0.995); // Force darker overlay (some clients render blur lighter)

    const borderHalfWidth = (CONTAINER_WIDTH / 2) + CONTAINER_BORDER_PADDING + (CONTAINER_BORDER_THICKNESS / 2);
    const borderHalfHeight = (CONTAINER_HEIGHT / 2) + CONTAINER_BORDER_PADDING + (CONTAINER_BORDER_THICKNESS / 2);
    const borderLineWidth = CONTAINER_WIDTH + (CONTAINER_BORDER_PADDING * 2) + (CONTAINER_BORDER_OVERLAP * 2);
    const borderLineHeight = CONTAINER_HEIGHT + (CONTAINER_BORDER_PADDING * 2) + (CONTAINER_BORDER_OVERLAP * 2);

    // Top border line
    mod.AddUIContainer(
        BORDER_TOP_ID,
        mod.CreateVector(0, -borderHalfHeight, 0),
        mod.CreateVector(borderLineWidth, CONTAINER_BORDER_THICKNESS, 0),
        mod.UIAnchor.Center,
        CONTAINER_BASE,
        true,
        0,
        READY_DIALOG_BORDER_COLOR,
        1,
        mod.UIBgFill.Solid,
        mod.UIDepth.AboveGameUI,
        eventPlayer
    );

    // Bottom border line
    mod.AddUIContainer(
        BORDER_BOTTOM_ID,
        mod.CreateVector(0, borderHalfHeight, 0),
        mod.CreateVector(borderLineWidth, CONTAINER_BORDER_THICKNESS, 0),
        mod.UIAnchor.Center,
        CONTAINER_BASE,
        true,
        0,
        READY_DIALOG_BORDER_COLOR,
        1,
        mod.UIBgFill.Solid,
        mod.UIDepth.AboveGameUI,
        eventPlayer
    );

    // Left border line
    mod.AddUIContainer(
        BORDER_LEFT_ID,
        mod.CreateVector(-borderHalfWidth, 0, 0),
        mod.CreateVector(CONTAINER_BORDER_THICKNESS, borderLineHeight, 0),
        mod.UIAnchor.Center,
        CONTAINER_BASE,
        true,
        0,
        READY_DIALOG_BORDER_COLOR,
        1,
        mod.UIBgFill.Solid,
        mod.UIDepth.AboveGameUI,
        eventPlayer
    );

    // Right border line
    mod.AddUIContainer(
        BORDER_RIGHT_ID,
        mod.CreateVector(borderHalfWidth, 0, 0),
        mod.CreateVector(CONTAINER_BORDER_THICKNESS, borderLineHeight, 0),
        mod.UIAnchor.Center,
        CONTAINER_BASE,
        true,
        0,
        READY_DIALOG_BORDER_COLOR,
        1,
        mod.UIBgFill.Solid,
        mod.UIDepth.AboveGameUI,
        eventPlayer
    );

    //#endregion -------------------- UI - Ready Up Dialog (construction) --------------------



    //#region -------------------- Ready Dialog (Roster UI) -  (header + team rosters) --------------------

    // Header rows (string-backed for easy iteration).
    const READY_HEADER_ID = UI_READY_DIALOG_HEADER_ID + playerId;
    const READY_HEADER2_ID = UI_READY_DIALOG_HEADER2_ID + playerId;
    const READY_HEADER3_ID = UI_READY_DIALOG_HEADER3_ID + playerId;
    const READY_HEADER4_ID = UI_READY_DIALOG_HEADER4_ID + playerId;
    const READY_HEADER5_ID = UI_READY_DIALOG_HEADER5_ID + playerId;
    const READY_HEADER6_ID = UI_READY_DIALOG_HEADER6_ID + playerId;

    mod.AddUIText(
        READY_HEADER_ID,
        //If Anchored at TopLeft, X is left offset - increase to move right, Y is down offset - increase to move down
        mod.CreateVector(-11, -5, 0),
        mod.CreateVector(900, 22, 0),
        mod.UIAnchor.TopLeft,
        mod.Message(mod.stringkeys.twl.readyDialog.header),
        eventPlayer
    );
    const READY_HEADER = mod.FindUIWidgetWithName(READY_HEADER_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(READY_HEADER, 0);
    mod.SetUITextSize(READY_HEADER, 20);
    applyReadyDialogLabelTextColor(READY_HEADER);
    mod.SetUIWidgetParent(READY_HEADER, CONTAINER_BASE);

    mod.AddUIText(
        READY_HEADER2_ID,
        mod.CreateVector(-11, 19, 0),
        mod.CreateVector(900, 20, 0),
        mod.UIAnchor.TopLeft,
        mod.Message(mod.stringkeys.twl.readyDialog.header2),
        eventPlayer
    );
    const READY_HEADER2 = mod.FindUIWidgetWithName(READY_HEADER2_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(READY_HEADER2, 0);
    mod.SetUITextSize(READY_HEADER2, 16);
    applyReadyDialogLabelTextColor(READY_HEADER2);
    mod.SetUIWidgetParent(READY_HEADER2, CONTAINER_BASE);

    mod.AddUIText(
        READY_HEADER3_ID,
        mod.CreateVector(-11, 39, 0),
        mod.CreateVector(900, 20, 0),
        mod.UIAnchor.TopLeft,
        mod.Message(mod.stringkeys.twl.readyDialog.header3),
        eventPlayer
    );
    const READY_HEADER3 = mod.FindUIWidgetWithName(READY_HEADER3_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(READY_HEADER3, 0);
    mod.SetUITextSize(READY_HEADER3, 16);
    applyReadyDialogLabelTextColor(READY_HEADER3);
    mod.SetUIWidgetParent(READY_HEADER3, CONTAINER_BASE);

    // Header 4 preserves the same vertical spacing as header 2 -> header 3.
    mod.AddUIText(
        READY_HEADER4_ID,
        mod.CreateVector(-11, 59, 0),
        mod.CreateVector(900, 20, 0),
        mod.UIAnchor.TopLeft,
        mod.Message(mod.stringkeys.twl.readyDialog.header4, Math.floor(VEHICLE_SPAWNER_KEEP_ALIVE_ABANDON_RADIUS)),
        eventPlayer
    );
    const READY_HEADER4 = mod.FindUIWidgetWithName(READY_HEADER4_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(READY_HEADER4, 0);
    mod.SetUITextSize(READY_HEADER4, 16);
    applyReadyDialogLabelTextColor(READY_HEADER4);
    mod.SetUIWidgetParent(READY_HEADER4, CONTAINER_BASE);

    mod.AddUIText(
        READY_HEADER5_ID,
        mod.CreateVector(-11, 79, 0),
        mod.CreateVector(900, 20, 0),
        mod.UIAnchor.TopLeft,
        mod.Message(mod.stringkeys.twl.readyDialog.header5),
        eventPlayer
    );
    const READY_HEADER5 = mod.FindUIWidgetWithName(READY_HEADER5_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(READY_HEADER5, 0);
    mod.SetUITextSize(READY_HEADER5, 16);
    applyReadyDialogLabelTextColor(READY_HEADER5);
    mod.SetUIWidgetParent(READY_HEADER5, CONTAINER_BASE);

    mod.AddUIText(
        READY_HEADER6_ID,
        mod.CreateVector(-11, 99, 0),
        mod.CreateVector(900, 20, 0),
        mod.UIAnchor.TopLeft,
        mod.Message(mod.stringkeys.twl.readyDialog.header6),
        eventPlayer
    );
    const READY_HEADER6 = mod.FindUIWidgetWithName(READY_HEADER6_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(READY_HEADER6, 0);
    mod.SetUITextSize(READY_HEADER6, 16);
    applyReadyDialogLabelTextColor(READY_HEADER6);
    mod.SetUIWidgetParent(READY_HEADER6, CONTAINER_BASE);

    const READY_MAP_LABEL_ID = UI_READY_DIALOG_MAP_LABEL_ID + playerId;
    const READY_MAP_VALUE_ID = UI_READY_DIALOG_MAP_VALUE_ID + playerId;
    const mapLabelX = ADMIN_PANEL_OFFSET_X + ADMIN_PANEL_TOGGLE_WIDTH + 70;
    const mapValueX = ADMIN_PANEL_OFFSET_X + ADMIN_PANEL_TOGGLE_WIDTH - 63; //-X moves right
    const mapLabelY = ADMIN_PANEL_OFFSET_Y;
    const mapLabelSizeX = 60;
    const mapValueSizeX = 170;

    mod.AddUIText(
        READY_MAP_LABEL_ID,
        mod.CreateVector(mapLabelX, mapLabelY, 0),
        mod.CreateVector(mapLabelSizeX, 20, 0),
        mod.UIAnchor.TopRight,
        mod.Message(mod.stringkeys.twl.readyDialog.mapLabel),
        eventPlayer
    );
    const READY_MAP_LABEL = mod.FindUIWidgetWithName(READY_MAP_LABEL_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(READY_MAP_LABEL, 0);
    mod.SetUITextSize(READY_MAP_LABEL, 12);
    applyReadyDialogLabelTextColor(READY_MAP_LABEL);
    mod.SetUIWidgetParent(READY_MAP_LABEL, mod.GetUIRoot());

    mod.AddUIText(
        READY_MAP_VALUE_ID,
        mod.CreateVector(mapValueX, mapLabelY, 0),
        mod.CreateVector(mapValueSizeX, 20, 0),
        mod.UIAnchor.TopRight,
        mod.Message(getMapNameKey(ACTIVE_MAP_KEY)),
        eventPlayer
    );
    const READY_MAP_VALUE = mod.FindUIWidgetWithName(READY_MAP_VALUE_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(READY_MAP_VALUE, 0);
    mod.SetUITextSize(READY_MAP_VALUE, 12);
    applyReadyDialogLabelTextColor(READY_MAP_VALUE);
    mod.SetUIWidgetParent(READY_MAP_VALUE, mod.GetUIRoot());
    updateReadyDialogMapLabelForPid(playerId);

    // Match-length control (Best-of label, top-right): minus button, dynamic label, plus button.
    const BESTOF_DEC_ID = UI_READY_DIALOG_BESTOF_DEC_ID + playerId;
    const BESTOF_DEC_LABEL_ID = UI_READY_DIALOG_BESTOF_DEC_LABEL_ID + playerId;
    const BESTOF_LABEL_ID = UI_READY_DIALOG_BESTOF_LABEL_ID + playerId;
    const BESTOF_INC_ID = UI_READY_DIALOG_BESTOF_INC_ID + playerId;
    const BESTOF_INC_LABEL_ID = UI_READY_DIALOG_BESTOF_INC_LABEL_ID + playerId;

    const bestOfY = -3;
    const bestOfButtonSizeX = READY_DIALOG_SMALL_BUTTON_WIDTH;
    const bestOfButtonSizeY = READY_DIALOG_SMALL_BUTTON_HEIGHT;
    const bestOfLabelSizeX = 170;
    const bestOfLabelSizeY = 24;
    const leftSectionGapX = READY_DIALOG_SMALL_BUTTON_WIDTH + 12;
    const leftSectionButtonSpread = 18;
    const leftSectionShiftX = 128 + leftSectionGapX + leftSectionButtonSpread;
    const leftSectionLeftButtonX = 125 + leftSectionShiftX + leftSectionButtonSpread;
    const leftSectionRightButtonX = -3 + leftSectionShiftX - leftSectionButtonSpread;
    const leftSectionValueX = -58 + leftSectionShiftX;
    const leftSectionLabelGap = 4;
    const leftSectionLabelX = leftSectionLeftButtonX + bestOfButtonSizeX + leftSectionLabelGap;
    const leftSectionLabelWidth = 110;
    const leftSectionValueWidth = 200;
    const leftSectionRowGap = bestOfButtonSizeY + 6;
    const rightSectionRightButtonX = -3;
    const confirmButtonWidth = READY_DIALOG_CONFIRM_BUTTON_WIDTH;
    const resetButtonWidth = READY_DIALOG_RESET_BUTTON_WIDTH;
    const resetButtonX = rightSectionRightButtonX + READY_DIALOG_RESET_BUTTON_OFFSET_X;
    const confirmButtonX = resetButtonX + resetButtonWidth + READY_DIALOG_CONFIRM_BUTTON_GAP;

    const GAME_MODE_LABEL_ID = UI_READY_DIALOG_MODE_GAME_LABEL_ID + playerId;
    const GAME_MODE_DEC_ID = UI_READY_DIALOG_MODE_GAME_DEC_ID + playerId;
    const GAME_MODE_DEC_LABEL_ID = UI_READY_DIALOG_MODE_GAME_DEC_LABEL_ID + playerId;
    const GAME_MODE_VALUE_ID = UI_READY_DIALOG_MODE_GAME_VALUE_ID + playerId;
    const GAME_MODE_INC_ID = UI_READY_DIALOG_MODE_GAME_INC_ID + playerId;
    const GAME_MODE_INC_LABEL_ID = UI_READY_DIALOG_MODE_GAME_INC_LABEL_ID + playerId;

    const MODE_SETTINGS_LABEL_ID = UI_READY_DIALOG_MODE_SETTINGS_LABEL_ID + playerId;
    const MODE_SETTINGS_DEC_ID = UI_READY_DIALOG_MODE_SETTINGS_DEC_ID + playerId;
    const MODE_SETTINGS_DEC_LABEL_ID = UI_READY_DIALOG_MODE_SETTINGS_DEC_LABEL_ID + playerId;
    const MODE_SETTINGS_VALUE_ID = UI_READY_DIALOG_MODE_SETTINGS_VALUE_ID + playerId;
    const MODE_SETTINGS_INC_ID = UI_READY_DIALOG_MODE_SETTINGS_INC_ID + playerId;
    const MODE_SETTINGS_INC_LABEL_ID = UI_READY_DIALOG_MODE_SETTINGS_INC_LABEL_ID + playerId;

    const VEHICLES_T1_LABEL_ID = UI_READY_DIALOG_MODE_VEHICLES_T1_LABEL_ID + playerId;
    const VEHICLES_T1_DEC_ID = UI_READY_DIALOG_MODE_VEHICLES_T1_DEC_ID + playerId;
    const VEHICLES_T1_DEC_LABEL_ID = UI_READY_DIALOG_MODE_VEHICLES_T1_DEC_LABEL_ID + playerId;
    const VEHICLES_T1_VALUE_ID = UI_READY_DIALOG_MODE_VEHICLES_T1_VALUE_ID + playerId;
    const VEHICLES_T1_INC_ID = UI_READY_DIALOG_MODE_VEHICLES_T1_INC_ID + playerId;
    const VEHICLES_T1_INC_LABEL_ID = UI_READY_DIALOG_MODE_VEHICLES_T1_INC_LABEL_ID + playerId;

    const VEHICLES_T2_LABEL_ID = UI_READY_DIALOG_MODE_VEHICLES_T2_LABEL_ID + playerId;
    const VEHICLES_T2_DEC_ID = UI_READY_DIALOG_MODE_VEHICLES_T2_DEC_ID + playerId;
    const VEHICLES_T2_DEC_LABEL_ID = UI_READY_DIALOG_MODE_VEHICLES_T2_DEC_LABEL_ID + playerId;
    const VEHICLES_T2_VALUE_ID = UI_READY_DIALOG_MODE_VEHICLES_T2_VALUE_ID + playerId;
    const VEHICLES_T2_INC_ID = UI_READY_DIALOG_MODE_VEHICLES_T2_INC_ID + playerId;
    const VEHICLES_T2_INC_LABEL_ID = UI_READY_DIALOG_MODE_VEHICLES_T2_INC_LABEL_ID + playerId;

    const MODE_CONFIRM_ID = UI_READY_DIALOG_MODE_CONFIRM_ID + playerId;
    const MODE_CONFIRM_LABEL_ID = UI_READY_DIALOG_MODE_CONFIRM_LABEL_ID + playerId;
    const MODE_RESET_ID = UI_READY_DIALOG_MODE_RESET_ID + playerId;
    const MODE_RESET_LABEL_ID = UI_READY_DIALOG_MODE_RESET_LABEL_ID + playerId;

    const gameModeY = bestOfY;
    const modeSettingsY = gameModeY + leftSectionRowGap;
    const vehiclesT1Y = modeSettingsY + leftSectionRowGap;
    const vehiclesT2Y = vehiclesT1Y + leftSectionRowGap;
    const confirmY = vehiclesT2Y + leftSectionRowGap + 4;

    addRightAlignedLabel(
        GAME_MODE_LABEL_ID,
        leftSectionLabelX,
        gameModeY,
        leftSectionLabelWidth,
        bestOfLabelSizeY,
        mod.UIAnchor.TopRight,
        mod.Message(mod.stringkeys.twl.readyDialog.gameModeLabel),
        eventPlayer,
        CONTAINER_BASE,
        12
    );

    const gameModeDecBorder = addOutlinedButton(
        GAME_MODE_DEC_ID,
        leftSectionLeftButtonX,
        gameModeY,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        CONTAINER_BASE,
        eventPlayer
    );
    const GAME_MODE_DEC_LABEL = addCenteredButtonText(
        GAME_MODE_DEC_LABEL_ID,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.ui.left),
        eventPlayer,
        gameModeDecBorder ?? CONTAINER_BASE
    );
    if (GAME_MODE_DEC_LABEL) {
        mod.SetUITextSize(GAME_MODE_DEC_LABEL, 14);
    }

    mod.AddUIText(
        GAME_MODE_VALUE_ID,
        mod.CreateVector(leftSectionValueX, gameModeY, 0),
        mod.CreateVector(leftSectionValueWidth, bestOfLabelSizeY, 0),
        mod.UIAnchor.TopRight,
        mod.Message(State.round.modeConfig.gameMode),
        eventPlayer
    );
    const GAME_MODE_VALUE = mod.FindUIWidgetWithName(GAME_MODE_VALUE_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(GAME_MODE_VALUE, 0);
    mod.SetUITextSize(GAME_MODE_VALUE, 12);
    applyReadyDialogLabelTextColor(GAME_MODE_VALUE);
    mod.SetUIWidgetParent(GAME_MODE_VALUE, CONTAINER_BASE);

    const gameModeIncBorder = addOutlinedButton(
        GAME_MODE_INC_ID,
        leftSectionRightButtonX,
        gameModeY,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        CONTAINER_BASE,
        eventPlayer
    );
    const GAME_MODE_INC_LABEL = addCenteredButtonText(
        GAME_MODE_INC_LABEL_ID,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.ui.right),
        eventPlayer,
        gameModeIncBorder ?? CONTAINER_BASE
    );
    if (GAME_MODE_INC_LABEL) {
        mod.SetUITextSize(GAME_MODE_INC_LABEL, 14);
    }

    addRightAlignedLabel(
        MODE_SETTINGS_LABEL_ID,
        leftSectionLabelX,
        modeSettingsY,
        leftSectionLabelWidth,
        bestOfLabelSizeY,
        mod.UIAnchor.TopRight,
        mod.Message(mod.stringkeys.twl.readyDialog.modeSettingsLabel),
        eventPlayer,
        CONTAINER_BASE,
        12
    );

    const modeSettingsDecBorder = addOutlinedButton(
        MODE_SETTINGS_DEC_ID,
        leftSectionLeftButtonX,
        modeSettingsY,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        CONTAINER_BASE,
        eventPlayer
    );
    const MODE_SETTINGS_DEC_LABEL = addCenteredButtonText(
        MODE_SETTINGS_DEC_LABEL_ID,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.ui.left),
        eventPlayer,
        modeSettingsDecBorder ?? CONTAINER_BASE
    );
    if (MODE_SETTINGS_DEC_LABEL) {
        mod.SetUITextSize(MODE_SETTINGS_DEC_LABEL, 14);
    }

    mod.AddUIText(
        MODE_SETTINGS_VALUE_ID,
        mod.CreateVector(leftSectionValueX, modeSettingsY, 0),
        mod.CreateVector(leftSectionValueWidth, bestOfLabelSizeY, 0),
        mod.UIAnchor.TopRight,
        mod.Message(mod.stringkeys.twl.readyDialog.modeSettingAircraftCeilingFormat, Math.floor(State.round.modeConfig.aircraftCeiling)),
        eventPlayer
    );
    const MODE_SETTINGS_VALUE = mod.FindUIWidgetWithName(MODE_SETTINGS_VALUE_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(MODE_SETTINGS_VALUE, 0);
    mod.SetUITextSize(MODE_SETTINGS_VALUE, 12);
    applyReadyDialogLabelTextColor(MODE_SETTINGS_VALUE);
    mod.SetUIWidgetParent(MODE_SETTINGS_VALUE, CONTAINER_BASE);

    const modeSettingsIncBorder = addOutlinedButton(
        MODE_SETTINGS_INC_ID,
        leftSectionRightButtonX,
        modeSettingsY,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        CONTAINER_BASE,
        eventPlayer
    );
    const MODE_SETTINGS_INC_LABEL = addCenteredButtonText(
        MODE_SETTINGS_INC_LABEL_ID,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.ui.right),
        eventPlayer,
        modeSettingsIncBorder ?? CONTAINER_BASE
    );
    if (MODE_SETTINGS_INC_LABEL) {
        mod.SetUITextSize(MODE_SETTINGS_INC_LABEL, 14);
    }

    addRightAlignedLabel(
        VEHICLES_T1_LABEL_ID,
        leftSectionLabelX,
        vehiclesT1Y,
        leftSectionLabelWidth,
        bestOfLabelSizeY,
        mod.UIAnchor.TopRight,
        mod.Message(mod.stringkeys.twl.readyDialog.vehiclesLabelFormat, getTeamNameKey(TeamID.Team1)),
        eventPlayer,
        CONTAINER_BASE,
        12
    );

    const vehiclesT1DecBorder = addOutlinedButton(
        VEHICLES_T1_DEC_ID,
        leftSectionLeftButtonX,
        vehiclesT1Y,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        CONTAINER_BASE,
        eventPlayer
    );
    const VEHICLES_T1_DEC_LABEL = addCenteredButtonText(
        VEHICLES_T1_DEC_LABEL_ID,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.ui.left),
        eventPlayer,
        vehiclesT1DecBorder ?? CONTAINER_BASE
    );
    if (VEHICLES_T1_DEC_LABEL) {
        mod.SetUITextSize(VEHICLES_T1_DEC_LABEL, 14);
    }

    mod.AddUIText(
        VEHICLES_T1_VALUE_ID,
        mod.CreateVector(leftSectionValueX, vehiclesT1Y, 0),
        mod.CreateVector(leftSectionValueWidth, bestOfLabelSizeY, 0),
        mod.UIAnchor.TopRight,
        mod.Message(State.round.modeConfig.vehiclesT1),
        eventPlayer
    );
    const VEHICLES_T1_VALUE = mod.FindUIWidgetWithName(VEHICLES_T1_VALUE_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(VEHICLES_T1_VALUE, 0);
    mod.SetUITextSize(VEHICLES_T1_VALUE, 12);
    applyReadyDialogLabelTextColor(VEHICLES_T1_VALUE);
    mod.SetUIWidgetParent(VEHICLES_T1_VALUE, CONTAINER_BASE);

    const vehiclesT1IncBorder = addOutlinedButton(
        VEHICLES_T1_INC_ID,
        leftSectionRightButtonX,
        vehiclesT1Y,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        CONTAINER_BASE,
        eventPlayer
    );
    const VEHICLES_T1_INC_LABEL = addCenteredButtonText(
        VEHICLES_T1_INC_LABEL_ID,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.ui.right),
        eventPlayer,
        vehiclesT1IncBorder ?? CONTAINER_BASE
    );
    if (VEHICLES_T1_INC_LABEL) {
        mod.SetUITextSize(VEHICLES_T1_INC_LABEL, 14);
    }

    addRightAlignedLabel(
        VEHICLES_T2_LABEL_ID,
        leftSectionLabelX,
        vehiclesT2Y,
        leftSectionLabelWidth,
        bestOfLabelSizeY,
        mod.UIAnchor.TopRight,
        mod.Message(mod.stringkeys.twl.readyDialog.vehiclesLabelFormat, getTeamNameKey(TeamID.Team2)),
        eventPlayer,
        CONTAINER_BASE,
        12
    );

    const vehiclesT2DecBorder = addOutlinedButton(
        VEHICLES_T2_DEC_ID,
        leftSectionLeftButtonX,
        vehiclesT2Y,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        CONTAINER_BASE,
        eventPlayer
    );
    const VEHICLES_T2_DEC_LABEL = addCenteredButtonText(
        VEHICLES_T2_DEC_LABEL_ID,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.ui.left),
        eventPlayer,
        vehiclesT2DecBorder ?? CONTAINER_BASE
    );
    if (VEHICLES_T2_DEC_LABEL) {
        mod.SetUITextSize(VEHICLES_T2_DEC_LABEL, 14);
    }

    mod.AddUIText(
        VEHICLES_T2_VALUE_ID,
        mod.CreateVector(leftSectionValueX, vehiclesT2Y, 0),
        mod.CreateVector(leftSectionValueWidth, bestOfLabelSizeY, 0),
        mod.UIAnchor.TopRight,
        mod.Message(State.round.modeConfig.vehiclesT2),
        eventPlayer
    );
    const VEHICLES_T2_VALUE = mod.FindUIWidgetWithName(VEHICLES_T2_VALUE_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(VEHICLES_T2_VALUE, 0);
    mod.SetUITextSize(VEHICLES_T2_VALUE, 12);
    applyReadyDialogLabelTextColor(VEHICLES_T2_VALUE);
    mod.SetUIWidgetParent(VEHICLES_T2_VALUE, CONTAINER_BASE);

    const vehiclesT2IncBorder = addOutlinedButton(
        VEHICLES_T2_INC_ID,
        leftSectionRightButtonX,
        vehiclesT2Y,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        CONTAINER_BASE,
        eventPlayer
    );
    const VEHICLES_T2_INC_LABEL = addCenteredButtonText(
        VEHICLES_T2_INC_LABEL_ID,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.ui.right),
        eventPlayer,
        vehiclesT2IncBorder ?? CONTAINER_BASE
    );
    if (VEHICLES_T2_INC_LABEL) {
        mod.SetUITextSize(VEHICLES_T2_INC_LABEL, 14);
    }

    const confirmBorder = addOutlinedButton(
        MODE_CONFIRM_ID,
        confirmButtonX,
        confirmY,
        confirmButtonWidth,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        CONTAINER_BASE,
        eventPlayer
    );
    const MODE_CONFIRM_LABEL = addCenteredButtonText(
        MODE_CONFIRM_LABEL_ID,
        confirmButtonWidth,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.readyDialog.confirmSettingsLabel),
        eventPlayer,
        confirmBorder ?? CONTAINER_BASE
    );
    if (MODE_CONFIRM_LABEL) {
        mod.SetUITextSize(MODE_CONFIRM_LABEL, 12);
    }

    const resetBorder = addOutlinedButton(
        MODE_RESET_ID,
        resetButtonX,
        confirmY,
        resetButtonWidth,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        CONTAINER_BASE,
        eventPlayer
    );
    const MODE_RESET_LABEL = addCenteredButtonText(
        MODE_RESET_LABEL_ID,
        resetButtonWidth,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.readyDialog.resetSettingsLabel),
        eventPlayer,
        resetBorder ?? CONTAINER_BASE
    );
    if (MODE_RESET_LABEL) {
        mod.SetUITextSize(MODE_RESET_LABEL, 12);
    }

    // Match-length control: minus button (left of label)
    const bestOfDecBorder = addOutlinedButton(
        BESTOF_DEC_ID,
        125,
        bestOfY,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        CONTAINER_BASE,
        eventPlayer
    );

    // Match-length control: minus label (left of label)
    const BESTOF_DEC_LABEL = addCenteredButtonText(
        BESTOF_DEC_LABEL_ID,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.ui.minus),
        eventPlayer,
        bestOfDecBorder ?? CONTAINER_BASE
    );
    if (BESTOF_DEC_LABEL) {
        mod.SetUITextSize(BESTOF_DEC_LABEL, 14);
    }

    // Match-length control: dynamic label
    mod.AddUIText(
        BESTOF_LABEL_ID,
        mod.CreateVector(-42, bestOfY, 0),
        mod.CreateVector(bestOfLabelSizeX, bestOfLabelSizeY, 0),
        mod.UIAnchor.TopRight,
        mod.Message(mod.stringkeys.twl.readyDialog.bestOfLabel, State.round.max),
        eventPlayer
    );
    const BESTOF_LABEL = mod.FindUIWidgetWithName(BESTOF_LABEL_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(BESTOF_LABEL, 0);
    mod.SetUITextSize(BESTOF_LABEL, 14);
    applyReadyDialogLabelTextColor(BESTOF_LABEL);
    mod.SetUIWidgetParent(BESTOF_LABEL, CONTAINER_BASE);

    // Match-length control: plus button (right of label)
    const bestOfIncBorder = addOutlinedButton(
        BESTOF_INC_ID,
        -3,
        bestOfY,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        CONTAINER_BASE,
        eventPlayer
    );

    // Match-length control: plus label (right of label)
    const BESTOF_INC_LABEL = addCenteredButtonText(
        BESTOF_INC_LABEL_ID,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.ui.plus),
        eventPlayer,
        bestOfIncBorder ?? CONTAINER_BASE
    );
    if (BESTOF_INC_LABEL) {
        mod.SetUITextSize(BESTOF_INC_LABEL, 14);
    }
    updateBestOfRoundsLabelForPid(playerId);

    // Matchup preset control (below match-length control): minus button, dynamic label, plus button.
    const MATCHUP_DEC_ID = UI_READY_DIALOG_MATCHUP_DEC_ID + playerId;
    const MATCHUP_DEC_LABEL_ID = UI_READY_DIALOG_MATCHUP_DEC_LABEL_ID + playerId;
    const MATCHUP_LABEL_ID = UI_READY_DIALOG_MATCHUP_LABEL_ID + playerId;
    const MATCHUP_INC_ID = UI_READY_DIALOG_MATCHUP_INC_ID + playerId;
    const MATCHUP_INC_LABEL_ID = UI_READY_DIALOG_MATCHUP_INC_LABEL_ID + playerId;
    const MATCHUP_MINPLAYERS_ID = UI_READY_DIALOG_MATCHUP_MINPLAYERS_ID + playerId;
    const MATCHUP_MINPLAYERS_TOTAL_ID = UI_READY_DIALOG_MATCHUP_MINPLAYERS_TOTAL_ID + playerId;
    const MATCHUP_KILLSTARGET_ID = UI_READY_DIALOG_MATCHUP_KILLSTARGET_ID + playerId;

    const matchupY = bestOfY + bestOfButtonSizeY + 4;
    const matchupLabelSizeX = bestOfLabelSizeX + 30;
    const matchupLabelOffsetX = -72;

    // Matchup: minus button (left of label)
    const matchupDecBorder = addOutlinedButton(
        MATCHUP_DEC_ID,
        125,
        matchupY,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        CONTAINER_BASE,
        eventPlayer
    );

    // Matchup: minus label
    const MATCHUP_DEC_LABEL = addCenteredButtonText(
        MATCHUP_DEC_LABEL_ID,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.ui.minus),
        eventPlayer,
        matchupDecBorder ?? CONTAINER_BASE
    );
    if (MATCHUP_DEC_LABEL) {
        mod.SetUITextSize(MATCHUP_DEC_LABEL, 14);
    }

    // Matchup: dynamic label
    mod.AddUIText(
        MATCHUP_LABEL_ID,
        mod.CreateVector(matchupLabelOffsetX, matchupY, 0),
        mod.CreateVector(matchupLabelSizeX, bestOfLabelSizeY, 0),
        mod.UIAnchor.TopRight,
        isRoundLive()
            ? mod.Message(mod.stringkeys.twl.system.genericCounter, "")
            : mod.Message(mod.stringkeys.twl.readyDialog.matchupFormat, 1, 0),
        eventPlayer
    );
    const MATCHUP_LABEL = mod.FindUIWidgetWithName(MATCHUP_LABEL_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(MATCHUP_LABEL, 0);
    mod.SetUITextSize(MATCHUP_LABEL, 14);
    mod.SetUIWidgetVisible(MATCHUP_LABEL, !isRoundLive());
    applyReadyDialogLabelTextColor(MATCHUP_LABEL);
    mod.SetUIWidgetParent(MATCHUP_LABEL, CONTAINER_BASE);

    // Matchup: plus button (right of label)
    const matchupIncBorder = addOutlinedButton(
        MATCHUP_INC_ID,
        -3,
        matchupY,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        CONTAINER_BASE,
        eventPlayer
    );

    // Matchup: plus label (right of label)
    const MATCHUP_INC_LABEL = addCenteredButtonText(
        MATCHUP_INC_LABEL_ID,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.ui.plus),
        eventPlayer,
        matchupIncBorder ?? CONTAINER_BASE
    );
    if (MATCHUP_INC_LABEL) {
        mod.SetUITextSize(MATCHUP_INC_LABEL, 14);
    }

    // Matchup readouts (below matchup buttons)
    mod.AddUIText(
        MATCHUP_KILLSTARGET_ID,
        mod.CreateVector(-42 - (bestOfLabelSizeX + 80) / 4, matchupY + bestOfButtonSizeY - 1, 0),
        mod.CreateVector(bestOfLabelSizeX + 80, 16, 0),
        mod.UIAnchor.TopRight,
        isRoundLive()
            ? mod.Message(mod.stringkeys.twl.system.genericCounter, "")
            : mod.Message(mod.stringkeys.twl.readyDialog.targetKillsToWinFormat, State.round.killsTarget),
        eventPlayer
    );
    const MATCHUP_KILLSTARGET = mod.FindUIWidgetWithName(MATCHUP_KILLSTARGET_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(MATCHUP_KILLSTARGET, 0);
    mod.SetUITextSize(MATCHUP_KILLSTARGET, 12);
    mod.SetUIWidgetVisible(MATCHUP_KILLSTARGET, !isRoundLive());
    applyReadyDialogLabelTextColor(MATCHUP_KILLSTARGET);
    mod.SetUIWidgetParent(MATCHUP_KILLSTARGET, CONTAINER_BASE);

    const PLAYERS_DEC_ID = UI_READY_DIALOG_MINPLAYERS_DEC_ID + playerId;
    const PLAYERS_DEC_LABEL_ID = UI_READY_DIALOG_MINPLAYERS_DEC_LABEL_ID + playerId;
    const PLAYERS_INC_ID = UI_READY_DIALOG_MINPLAYERS_INC_ID + playerId;
    const PLAYERS_INC_LABEL_ID = UI_READY_DIALOG_MINPLAYERS_INC_LABEL_ID + playerId;
    const playersY = matchupY + bestOfButtonSizeY + 20;
    const playersLabelSizeX = bestOfLabelSizeX + 30;
    const playersLabelOffsetX = -72;
    const playersLabelOffsetY = 4;

    const playersDecBorder = addOutlinedButton(
        PLAYERS_DEC_ID,
        125,
        playersY,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        CONTAINER_BASE,
        eventPlayer
    );

    const PLAYERS_DEC_LABEL = addCenteredButtonText(
        PLAYERS_DEC_LABEL_ID,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.ui.minus),
        eventPlayer,
        playersDecBorder ?? CONTAINER_BASE
    );
    if (PLAYERS_DEC_LABEL) {
        mod.SetUITextSize(PLAYERS_DEC_LABEL, 14);
    }

    const autoStartCounts = getAutoStartMinPlayerCounts();
    mod.AddUIText(
        MATCHUP_MINPLAYERS_ID,
        mod.CreateVector(playersLabelOffsetX, playersY + playersLabelOffsetY, 0),
        mod.CreateVector(playersLabelSizeX, 16, 0),
        mod.UIAnchor.TopRight,
        mod.Message(mod.stringkeys.twl.readyDialog.playersFormat, autoStartCounts.left, autoStartCounts.right),
        eventPlayer
    );
    const MATCHUP_MINPLAYERS = mod.FindUIWidgetWithName(MATCHUP_MINPLAYERS_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(MATCHUP_MINPLAYERS, 0);
    mod.SetUITextSize(MATCHUP_MINPLAYERS, 14);
    applyReadyDialogLabelTextColor(MATCHUP_MINPLAYERS);
    mod.SetUIWidgetParent(MATCHUP_MINPLAYERS, CONTAINER_BASE);

    const playersTotalY = playersY + bestOfButtonSizeY - 1;
    mod.AddUIText(
        MATCHUP_MINPLAYERS_TOTAL_ID,
        mod.CreateVector(-42 - (bestOfLabelSizeX + 80) / 4, playersTotalY, 0),
        mod.CreateVector(bestOfLabelSizeX + 80, 16, 0),
        mod.UIAnchor.TopRight,
        mod.Message(mod.stringkeys.twl.readyDialog.minPlayersToStartFormat, autoStartCounts.total),
        eventPlayer
    );
    const MATCHUP_MINPLAYERS_TOTAL = mod.FindUIWidgetWithName(MATCHUP_MINPLAYERS_TOTAL_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(MATCHUP_MINPLAYERS_TOTAL, 0);
    mod.SetUITextSize(MATCHUP_MINPLAYERS_TOTAL, 12);
    applyReadyDialogLabelTextColor(MATCHUP_MINPLAYERS_TOTAL);
    mod.SetUIWidgetParent(MATCHUP_MINPLAYERS_TOTAL, CONTAINER_BASE);

    const playersIncBorder = addOutlinedButton(
        PLAYERS_INC_ID,
        -3,
        playersY,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        CONTAINER_BASE,
        eventPlayer
    );

    const PLAYERS_INC_LABEL = addCenteredButtonText(
        PLAYERS_INC_LABEL_ID,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.ui.plus),
        eventPlayer,
        playersIncBorder ?? CONTAINER_BASE
    );
    if (PLAYERS_INC_LABEL) {
        mod.SetUITextSize(PLAYERS_INC_LABEL, 14);
    }

    updateMatchupLabelForPid(playerId);
    updateMatchupReadoutsForPid(playerId);
    updateReadyDialogModeConfigForPid(playerId);

    // Left and right roster containers (children are parented to these containers).
    const T1_CONTAINER_ID = UI_READY_DIALOG_TEAM1_CONTAINER_ID + playerId;
    const T2_CONTAINER_ID = UI_READY_DIALOG_TEAM2_CONTAINER_ID + playerId;

    mod.AddUIContainer(
        T1_CONTAINER_ID,
        mod.CreateVector(READY_ROSTER_PANEL_MARGIN, READY_ROSTER_PANEL_Y, 0),
        mod.CreateVector(READY_ROSTER_PANEL_WIDTH, READY_ROSTER_PANEL_HEIGHT, 0),
        mod.UIAnchor.TopLeft,
        CONTAINER_BASE,
        true,
        1,
        READY_PANEL_T1_BG_COLOR,
        READY_PANEL_BG_ALPHA,
        mod.UIBgFill.Solid,
        mod.UIDepth.AboveGameUI,
        eventPlayer
    );
    mod.AddUIContainer(
        T2_CONTAINER_ID,
        mod.CreateVector(READY_ROSTER_PANEL_MARGIN + READY_ROSTER_PANEL_WIDTH + READY_ROSTER_PANEL_GAP, READY_ROSTER_PANEL_Y, 0),
        mod.CreateVector(READY_ROSTER_PANEL_WIDTH, READY_ROSTER_PANEL_HEIGHT, 0),
        mod.UIAnchor.TopLeft,
        CONTAINER_BASE,
        true,
        1,
        READY_PANEL_T2_BG_COLOR,
        READY_PANEL_BG_ALPHA,
        mod.UIBgFill.Solid,
        mod.UIDepth.AboveGameUI,
        eventPlayer
    );

    const T1_CONTAINER = mod.FindUIWidgetWithName(T1_CONTAINER_ID, mod.GetUIRoot());
    const T2_CONTAINER = mod.FindUIWidgetWithName(T2_CONTAINER_ID, mod.GetUIRoot());

    // Team labels reuse existing team-name strings.
    const teamLabelY = 0;
    const teamLabelHeight = 24;
    const teamLabelWidth = READY_ROSTER_PANEL_WIDTH;
    const T1_LABEL_ID = UI_READY_DIALOG_TEAM1_LABEL_ID + playerId;
    const T2_LABEL_ID = UI_READY_DIALOG_TEAM2_LABEL_ID + playerId;
    mod.AddUIText(
        T1_LABEL_ID,
        mod.CreateVector(0, teamLabelY, 0),
        mod.CreateVector(teamLabelWidth, teamLabelHeight, 0),
        mod.UIAnchor.TopCenter,
        mod.Message(getTeamNameKey(TeamID.Team1)),
        eventPlayer
    );
    const T1_LABEL = mod.FindUIWidgetWithName(T1_LABEL_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(T1_LABEL, 0);
    mod.SetUITextSize(T1_LABEL, 20);
    mod.SetUIWidgetParent(T1_LABEL, T1_CONTAINER);

    mod.AddUIText(
        T2_LABEL_ID,
        mod.CreateVector(0, teamLabelY, 0),
        mod.CreateVector(teamLabelWidth, teamLabelHeight, 0),
        mod.UIAnchor.TopCenter,
        mod.Message(getTeamNameKey(TeamID.Team2)),
        eventPlayer
    );
    const T2_LABEL = mod.FindUIWidgetWithName(T2_LABEL_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(T2_LABEL, 0);
    mod.SetUITextSize(T2_LABEL, 20);
    mod.SetUIWidgetParent(T2_LABEL, T2_CONTAINER);

    // Fixed rows: up to 16 players per team (32 max). If we ever want to go above 16 per team, we should introduce a Next Page or Previous Page button? Slider?
    const rowStartY = teamLabelY + teamLabelHeight;
    const rowH = 26;
    const colNameX = 10;
    const colReadyX = 280;
    const colBaseX = 420;
    const colNameW = 260;
    const colStatusW = 140;

    for (let row = 0; row < TEAM_ROSTER_MAX_ROWS; row++) {
        const y = rowStartY + (row * rowH);

        const t1NameId = UI_READY_DIALOG_T1_ROW_NAME_ID + playerId + "_" + row;
        const t1ReadyId = UI_READY_DIALOG_T1_ROW_READY_ID + playerId + "_" + row;
        const t1BaseId = UI_READY_DIALOG_T1_ROW_BASE_ID + playerId + "_" + row;

        mod.AddUIText(t1NameId, mod.CreateVector(colNameX, y, 0), mod.CreateVector(colNameW, rowH, 0), mod.UIAnchor.TopLeft, mod.Message(mod.stringkeys.twl.system.genericCounter, ""), eventPlayer);
        const T1_NAME = mod.FindUIWidgetWithName(t1NameId, mod.GetUIRoot());
        mod.SetUIWidgetBgAlpha(T1_NAME, 0);
        mod.SetUITextSize(T1_NAME, 14);
        mod.SetUIWidgetParent(T1_NAME, T1_CONTAINER);

        mod.AddUIText(t1ReadyId, mod.CreateVector(colReadyX, y, 0), mod.CreateVector(colStatusW, rowH, 0), mod.UIAnchor.TopLeft, mod.Message(mod.stringkeys.twl.system.genericCounter, ""), eventPlayer);
        const T1_READY = mod.FindUIWidgetWithName(t1ReadyId, mod.GetUIRoot());
        mod.SetUIWidgetBgAlpha(T1_READY, 0);
        mod.SetUITextSize(T1_READY, 14);
        mod.SetUIWidgetParent(T1_READY, T1_CONTAINER);

        mod.AddUIText(t1BaseId, mod.CreateVector(colBaseX, y, 0), mod.CreateVector(colStatusW, rowH, 0), mod.UIAnchor.TopLeft, mod.Message(mod.stringkeys.twl.system.genericCounter, ""), eventPlayer);
        const T1_BASE = mod.FindUIWidgetWithName(t1BaseId, mod.GetUIRoot());
        mod.SetUIWidgetBgAlpha(T1_BASE, 0);
        mod.SetUITextSize(T1_BASE, 14);
        mod.SetUIWidgetParent(T1_BASE, T1_CONTAINER);

        const t2NameId = UI_READY_DIALOG_T2_ROW_NAME_ID + playerId + "_" + row;
        const t2ReadyId = UI_READY_DIALOG_T2_ROW_READY_ID + playerId + "_" + row;
        const t2BaseId = UI_READY_DIALOG_T2_ROW_BASE_ID + playerId + "_" + row;

        mod.AddUIText(t2NameId, mod.CreateVector(colNameX, y, 0), mod.CreateVector(colNameW, rowH, 0), mod.UIAnchor.TopLeft, mod.Message(mod.stringkeys.twl.system.genericCounter, ""), eventPlayer);
        const T2_NAME = mod.FindUIWidgetWithName(t2NameId, mod.GetUIRoot());
        mod.SetUIWidgetBgAlpha(T2_NAME, 0);
        mod.SetUITextSize(T2_NAME, 14);
        mod.SetUIWidgetParent(T2_NAME, T2_CONTAINER);

        mod.AddUIText(t2ReadyId, mod.CreateVector(colReadyX, y, 0), mod.CreateVector(colStatusW, rowH, 0), mod.UIAnchor.TopLeft, mod.Message(mod.stringkeys.twl.system.genericCounter, ""), eventPlayer);
        const T2_READY = mod.FindUIWidgetWithName(t2ReadyId, mod.GetUIRoot());
        mod.SetUIWidgetBgAlpha(T2_READY, 0);
        mod.SetUITextSize(T2_READY, 14);
        mod.SetUIWidgetParent(T2_READY, T2_CONTAINER);

        mod.AddUIText(t2BaseId, mod.CreateVector(colBaseX, y, 0), mod.CreateVector(colStatusW, rowH, 0), mod.UIAnchor.TopLeft, mod.Message(mod.stringkeys.twl.system.genericCounter, ""), eventPlayer);
        const T2_BASE = mod.FindUIWidgetWithName(t2BaseId, mod.GetUIRoot());
        mod.SetUIWidgetBgAlpha(T2_BASE, 0);
        mod.SetUITextSize(T2_BASE, 14);
        mod.SetUIWidgetParent(T2_BASE, T2_CONTAINER);
    }

    // Populate rows for this viewer .
    refreshReadyDialogRosterForViewer(eventPlayer, playerId);

    //#endregion ----------------- Ready Dialog (Roster UI) -  (header + team rosters) --------------------

    

    //#region -------------------- Ready Dialog - Swap Teams Button --------------------

    // Bottom-left toggle: swaps the player's current team (Team 1 <-> Team 2).
    const SWAP_BUTTON_ID = UI_READY_DIALOG_BUTTON_SWAP_ID + playerId;
    const SWAP_BUTTON_LABEL_ID = UI_READY_DIALOG_BUTTON_SWAP_LABEL_ID + playerId;

    const SWAP_BORDER = addOutlinedButton(
        SWAP_BUTTON_ID,
        0,
        0,
        READY_DIALOG_MAIN_BUTTON_WIDTH,
        READY_DIALOG_MAIN_BUTTON_HEIGHT,
        mod.UIAnchor.BottomLeft,
        CONTAINER_BASE,
        eventPlayer
    );

    const SWAP_BUTTON_LABEL = addCenteredButtonText(
        SWAP_BUTTON_LABEL_ID,
        READY_DIALOG_MAIN_BUTTON_WIDTH,
        READY_DIALOG_MAIN_BUTTON_HEIGHT,
        mod.Message(mod.stringkeys.twl.readyDialog.buttons.swapTeams),
        eventPlayer,
        SWAP_BORDER ?? CONTAINER_BASE
    );

    //#endregion ----------------- Ready Dialog - Swap Teams Button --------------------



    //#region -------------------- Ready Dialog  - Ready Toggle Button --------------------

    // Bottom-center toggle: starts as "Ready" (pressing it sets READY), then flips to "Not Ready".
    const READY_BUTTON_ID = UI_READY_DIALOG_BUTTON_READY_ID + playerId;
    const READY_BUTTON_LABEL_ID = UI_READY_DIALOG_BUTTON_READY_LABEL_ID + playerId;
    const READY_BUTTON_BORDER = addOutlinedButton(
        READY_BUTTON_ID,
        READY_DIALOG_READY_BUTTON_OFFSET_X,
        0,
        READY_DIALOG_MAIN_BUTTON_WIDTH,
        READY_DIALOG_MAIN_BUTTON_HEIGHT,
        mod.UIAnchor.BottomCenter,
        CONTAINER_BASE,
        eventPlayer
    );

    const READY_BUTTON_LABEL = addCenteredButtonText(
        READY_BUTTON_LABEL_ID,
        READY_DIALOG_MAIN_BUTTON_WIDTH,
        READY_DIALOG_MAIN_BUTTON_HEIGHT,
        mod.Message(mod.stringkeys.twl.readyDialog.buttons.ready),
        eventPlayer,
        READY_BUTTON_BORDER ?? CONTAINER_BASE
    );

    // Ensure the label matches the current stored state for this viewer (default is NOT READY).
    updateReadyToggleButtonForViewer(eventPlayer, playerId);

    //#endregion ----------------- Ready Dialog  - Ready Toggle Button --------------------



    //#region -------------------- Debug Info - Time Limit Seconds --------------------

    const DEBUG_TIMELIMIT_ID = UI_TEAMSWITCH_DEBUG_TIMELIMIT_ID + playerId;
    if (SHOW_DEBUG_TIMELIMIT) {

    // Shows the current inferred gamemode time limit (seconds) while the team switch dialog is open.
    const debugTimeLimitSeconds = Math.floor(mod.GetMatchTimeElapsed() + mod.GetMatchTimeRemaining());
    mod.AddUIText(
        DEBUG_TIMELIMIT_ID,
        mod.CreateVector(-320, -160, 0),  //mod.CreateVector(-220, 10, 0),
        mod.CreateVector(80, 28, 0),    //mod.CreateVector(80, 28, 0),
        mod.UIAnchor.TopRight,
        mod.Message(mod.stringkeys.twl.teamSwitch.debugTimeLimit, debugTimeLimitSeconds),
        eventPlayer
    );
    const DEBUG_TIMELIMIT = mod.FindUIWidgetWithName(DEBUG_TIMELIMIT_ID, mod.GetUIRoot());
    // Parent to the Team Switch container so the text is always drawn above the dialog background.
    mod.SetUIWidgetParent(DEBUG_TIMELIMIT, CONTAINER_BASE);
    mod.SetUIWidgetBgAlpha(DEBUG_TIMELIMIT, 0);
    mod.SetUITextSize(DEBUG_TIMELIMIT, 12);
    applyReadyDialogLabelTextColor(DEBUG_TIMELIMIT);


    } else {
        const existingDebug = safeFind(DEBUG_TIMELIMIT_ID);
        if (existingDebug) mod.SetUIWidgetVisible(existingDebug, false);
    }

    //#endregion -------------------- Debug Info - Time Limit Seconds --------------------


    
    //#region -------------------- Admin Panel Toggle Button (Top-Right, only while Ready Up dialog is open) --------------------

    // UI caching note: these widgets are created once and then hidden/shown on open/close.
    ensureAdminPanelWidgets(eventPlayer, playerId);

    //#endregion ----------------- Admin Panel Toggle Button (Top-Right, only while Ready Up dialog is open) --------------------



    //#region -------------------- Dialog Buttons (Left Side) - Cancel --------------------

    // Cancel remains a core function so players can dismiss the dialog and regain control.
    // Team/spectate/opt-out buttons are intentionally not exposed in conquest.
    const BUTTON_CANCEL_BORDER = addOutlinedButton(
        BUTTON_CANCEL_ID,
        0,
        0,
        READY_DIALOG_MAIN_BUTTON_WIDTH,
        READY_DIALOG_MAIN_BUTTON_HEIGHT,
        mod.UIAnchor.BottomRight,
        CONTAINER_BASE,
        eventPlayer
    );

    const BUTTON_CANCEL_LABEL = addCenteredButtonText(
        BUTTON_CANCEL_LABEL_ID,
        READY_DIALOG_MAIN_BUTTON_WIDTH,
        READY_DIALOG_MAIN_BUTTON_HEIGHT,
        mod.Message(mod.stringkeys.twl.teamSwitch.buttons.cancel),
        eventPlayer,
        BUTTON_CANCEL_BORDER ?? CONTAINER_BASE
    );

    // Layout constants: adjust cautiously; verify in-game dialog Admin panel widgets are built lazily on first open (see buildAdminPanelWidgets) to prevent a one-tick render flicker.
    updateHelpTextVisibilityForPlayer(eventPlayer);
}

//#endregion ----------------- Dialog Buttons (Left Side) - Cancel --------------------
