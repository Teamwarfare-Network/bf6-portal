// @ts-nocheck
// Module: ready-dialog — Ready dialog, admin panel, join prompt, aircraft ceiling, countdown

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

    // Best-of rounds control (top-right): minus button, dynamic label, plus button.
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

    // Best-of: minus button (left of label)
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

    // Best-of: minus label (left of label)
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

    // Best-of: dynamic label
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

    // Best-of: plus button (right of label)
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

    // Best-of: plus label (right of label)
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

    // Matchup preset control (below Best-of): minus button, dynamic label, plus button.
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



//#region -------------------- Admin Panel UI (Right Side) --------------------

// Builds the Admin Panel widgets lazily (to avoid a 1-frame flicker on dialog open).
function buildAdminPanelWidgets(eventPlayer: mod.Player, adminContainer: mod.UIWidget, playerId: number): void {

    // Fit at target resolutions.
    const testerBaseX = ADMIN_PANEL_BASE_X;
    const testerBaseY = ADMIN_PANEL_BASE_Y;

    const buttonSizeX = ADMIN_PANEL_BUTTON_SIZE_X;
    const buttonSizeY = ADMIN_PANEL_BUTTON_SIZE_Y;
    const labelSizeX = ADMIN_PANEL_LABEL_SIZE_X;
    const rowSpacingY = ADMIN_PANEL_ROW_SPACING_Y;

    const decOffsetX = 0;
    const labelOffsetX = buttonSizeX + 8;
    const incOffsetX = buttonSizeX + 8 + labelSizeX + 8;

    const headerId = UI_TEST_HEADER_LABEL_ID + playerId;

    modlib.ParseUI({
        name: headerId,
        type: "Text",
        playerId: eventPlayer,
        position: [0, testerBaseY + 2],
        size: [ADMIN_PANEL_CONTENT_WIDTH, 18],
        anchor: mod.UIAnchor.TopCenter,
        visible: true,
        padding: 0,
        bgAlpha: 0,
        bgFill: mod.UIBgFill.None,
        textLabel: mod.Message(mod.stringkeys.twl.adminPanel.tester.header),
        textColor: ADMIN_PANEL_LABEL_TEXT_COLOR_RGB,
        textAlpha: 1,
        textSize: 12,
        textAnchor: mod.UIAnchor.Center,
    });
    const TEST_HEADER = safeFind(headerId);
    applyAdminPanelLabelTextColor(TEST_HEADER);
    if (TEST_HEADER) mod.SetUIWidgetParent(TEST_HEADER, adminContainer);

    const row0Y = testerBaseY + 22;

    addTesterRow(eventPlayer, adminContainer, playerId, testerBaseX, row0Y + (buttonSizeY + rowSpacingY) * 0,
        UI_TEST_BUTTON_CLOCK_TIME_DEC_ID, UI_TEST_BUTTON_CLOCK_TIME_INC_ID, UI_TEST_LABEL_CLOCK_TIME_ID,
        mod.stringkeys.twl.adminPanel.tester.labels.clockTime, buttonSizeX, buttonSizeY, labelSizeX, decOffsetX, labelOffsetX, incOffsetX);

    addTesterRow(
        eventPlayer,
        adminContainer,
        playerId,
        testerBaseX,
        row0Y + (buttonSizeY + rowSpacingY) * 1,
        UI_ADMIN_ROUND_LENGTH_DEC_ID,
        UI_ADMIN_ROUND_LENGTH_INC_ID,
        UI_ADMIN_ROUND_LENGTH_LABEL_ID,
        mod.stringkeys.twl.adminPanel.labels.roundLengthFormat,
        buttonSizeX,
        buttonSizeY,
        labelSizeX,
        decOffsetX,
        labelOffsetX,
        incOffsetX
    );

    addTesterResetButton(eventPlayer, adminContainer, playerId, testerBaseX,
        row0Y + (buttonSizeY + rowSpacingY) * 2, (buttonSizeX + 8 + labelSizeX + 8 + buttonSizeX), 36);

    addTesterActionButton(eventPlayer, adminContainer, playerId, testerBaseX,
        row0Y + (buttonSizeY + rowSpacingY) * 3, (buttonSizeX + 8 + labelSizeX + 8 + buttonSizeX), 36,
        UI_TEST_BUTTON_ROUND_START_ID, UI_TEST_ROUND_START_TEXT_ID, mod.stringkeys.twl.adminPanel.tester.buttons.roundStart);

    addTesterActionButton(eventPlayer, adminContainer, playerId, testerBaseX,
        row0Y + (buttonSizeY + rowSpacingY) * 4, (buttonSizeX + 8 + labelSizeX + 8 + buttonSizeX), 36,
        UI_TEST_BUTTON_ROUND_END_ID, UI_TEST_ROUND_END_TEXT_ID, mod.stringkeys.twl.adminPanel.tester.buttons.roundEnd);

    addTesterActionButton(eventPlayer, adminContainer, playerId, testerBaseX,
        row0Y + (buttonSizeY + rowSpacingY) * 5, (buttonSizeX + 8 + labelSizeX + 8 + buttonSizeX), 36,
        UI_TEST_BUTTON_POS_DEBUG_ID, UI_TEST_POS_DEBUG_TEXT_ID, mod.stringkeys.twl.adminPanel.tester.buttons.positionDebug);

    syncAdminRoundLengthLabelForAllPlayers();
}

//#endregion ----------------- Admin Panel UI (Right Side) --------------------



//#region -------------------- Admin Panel UI builder helpers --------------------

function addTesterRow(
    eventPlayer: mod.Player,
    containerBase: mod.UIWidget,
    playerId: number,
    baseX: number,
    baseY: number,
    decButtonBaseId: string,
    incButtonBaseId: string,
    labelBaseId: string,
    labelKey: number,
    buttonSizeX: number,
    buttonSizeY: number,
    labelSizeX: number,
    decOffsetX: number,
    labelOffsetX: number,
    incOffsetX: number
): void {
    // Steps:
    // 1) Ensure per-player dialog root exists
    // 2) Build left team panel widgets
    // 3) Build right team panel widgets
    // 4) Build admin panel widgets + bind button IDs
    // 5) Finalize visibility / default states

    const decButtonId = decButtonBaseId + playerId;
    const incButtonId = incButtonBaseId + playerId;

    const plusTextId = UI_TEST_PLUS_TEXT_ID + incButtonId;
    const minusTextId = UI_TEST_MINUS_TEXT_ID + decButtonId;

    const labelId = labelBaseId + playerId;

    addOutlinedButton(
        decButtonId,
        baseX + decOffsetX,
        baseY,
        buttonSizeX,
        buttonSizeY,
        mod.UIAnchor.TopLeft,
        containerBase,
        eventPlayer
    );

    const DEC_BORDER = safeFind(decButtonId + "_BORDER");
    const MINUS_TEXT = addCenteredButtonText(
        minusTextId,
        buttonSizeX,
        buttonSizeY,
        mod.Message(mod.stringkeys.twl.ui.minus),
        eventPlayer,
        DEC_BORDER ?? containerBase
    );
    if (MINUS_TEXT) {
        mod.SetUITextSize(MINUS_TEXT, 12);
        mod.SetUITextColor(MINUS_TEXT, ADMIN_PANEL_BUTTON_TEXT_COLOR);
    }

    mod.AddUIText(labelId, mod.CreateVector(baseX + labelOffsetX, baseY + 11, 0), mod.CreateVector(labelSizeX, buttonSizeY - 22, 0),
        mod.UIAnchor.TopLeft, mod.Message(labelKey), eventPlayer);
    mod.SetUITextSize(mod.FindUIWidgetWithName(labelId, mod.GetUIRoot()), 12);
    const LABEL = mod.FindUIWidgetWithName(labelId, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(LABEL, 0);
    applyAdminPanelLabelTextColor(LABEL);
    mod.SetUIWidgetParent(LABEL, containerBase);

    addOutlinedButton(
        incButtonId,
        baseX + incOffsetX,
        baseY,
        buttonSizeX,
        buttonSizeY,
        mod.UIAnchor.TopLeft,
        containerBase,
        eventPlayer
    );

    const INC_BORDER = safeFind(incButtonId + "_BORDER");
    const PLUS_TEXT = addCenteredButtonText(
        plusTextId,
        buttonSizeX,
        buttonSizeY,
        mod.Message(mod.stringkeys.twl.ui.plus),
        eventPlayer,
        INC_BORDER ?? containerBase
    );
    if (PLUS_TEXT) {
        mod.SetUITextSize(PLUS_TEXT, 12);
        mod.SetUITextColor(PLUS_TEXT, ADMIN_PANEL_BUTTON_TEXT_COLOR);
    }
}

// Legacy keep: retained intentionally for potential tester/admin value-row UI reuse.
function addTesterRowWithValue(
    eventPlayer: mod.Player,
    containerBase: mod.UIWidget,
    playerId: number,
    baseX: number,
    baseY: number,
    decButtonBaseId: string,
    incButtonBaseId: string,
    labelBaseId: string,
    valueBaseId: string,
    labelKey: number,
    initialValue: number,
    buttonSizeX: number,
    buttonSizeY: number,
    labelSizeX: number,
    valueSizeX: number,
    decOffsetX: number,
    labelOffsetX: number,
    incOffsetX: number
): void {
    addTesterRow(eventPlayer, containerBase, playerId, baseX, baseY,
        decButtonBaseId, incButtonBaseId, labelBaseId, labelKey,
        buttonSizeX, buttonSizeY, labelSizeX, decOffsetX, labelOffsetX, incOffsetX);

    const valueId = valueBaseId + playerId;
    const valueX = baseX + incOffsetX - -3 - valueSizeX;

    mod.AddUIText(valueId, mod.CreateVector(valueX, baseY + 11, 0), mod.CreateVector(valueSizeX, buttonSizeY - 22, 0),
        mod.UIAnchor.TopLeft, mod.Message(mod.stringkeys.twl.system.genericCounter, Math.floor(initialValue)), eventPlayer);
    mod.SetUITextSize(mod.FindUIWidgetWithName(valueId, mod.GetUIRoot()), 12);
    const VALUE_TEXT = mod.FindUIWidgetWithName(valueId, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(VALUE_TEXT, 0);
    applyAdminPanelLabelTextColor(VALUE_TEXT);
    mod.SetUIWidgetParent(VALUE_TEXT, containerBase);
}

function addTesterResetButton(
    eventPlayer: mod.Player,
    containerBase: mod.UIWidget,
    playerId: number,
    baseX: number,
    baseY: number,
    width: number,
    height: number
): void {
    const buttonId = UI_TEST_BUTTON_CLOCK_RESET_ID + playerId;
    const labelId = UI_TEST_RESET_TEXT_ID + playerId;

    addOutlinedButton(
        buttonId,
        baseX,
        baseY,
        width,
        height,
        mod.UIAnchor.TopLeft,
        containerBase,
        eventPlayer
    );

    const resetParent = safeFind(buttonId + "_BORDER") ?? containerBase;
    const resetLabel = addCenteredButtonText(
        labelId,
        width,
        height,
        mod.Message(mod.stringkeys.twl.adminPanel.tester.buttons.clockReset),
        eventPlayer,
        resetParent
    );
    if (resetLabel) {
        mod.SetUITextSize(resetLabel, 12);
        mod.SetUITextColor(resetLabel, ADMIN_PANEL_BUTTON_TEXT_COLOR);
    }
}

function addTesterActionButton(
    eventPlayer: mod.Player,
    containerBase: mod.UIWidget,
    playerId: number,
    baseX: number,
    baseY: number,
    width: number,
    height: number,
    buttonBaseId: string,
    labelBaseId: string,
    labelKey: number
): void {
    const buttonId = buttonBaseId + playerId;
    const labelId = labelBaseId + playerId;

    addOutlinedButton(
        buttonId,
        baseX,
        baseY,
        width,
        height,
        mod.UIAnchor.TopLeft,
        containerBase,
        eventPlayer
    );

    const actionParent = safeFind(buttonId + "_BORDER") ?? containerBase;
    const actionLabel = addCenteredButtonText(
        labelId,
        width,
        height,
        mod.Message(labelKey),
        eventPlayer,
        actionParent
    );
    if (actionLabel) {
        mod.SetUITextSize(actionLabel, 12);
        mod.SetUITextColor(actionLabel, ADMIN_PANEL_BUTTON_TEXT_COLOR);
    }
}

function ensurePositionDebugWidgets(player: mod.Player): { x: mod.UIWidget; y: mod.UIWidget; z: mod.UIWidget; rotY: mod.UIWidget } | undefined {
    const pid = mod.GetObjId(player);
    const containerId = UI_POS_DEBUG_CONTAINER_ID + pid;
    const xId = UI_POS_DEBUG_X_ID + pid;
    const yId = UI_POS_DEBUG_Y_ID + pid;
    const zId = UI_POS_DEBUG_Z_ID + pid;
    const rotYId = UI_POS_DEBUG_ROTY_ID + pid;

    let container = safeFind(containerId);
    if (!container) {
        mod.AddUIContainer(
            containerId,
            mod.CreateVector(300, 17, 0), // +X to move left, +Y to move down
            mod.CreateVector(360, 30, 0),
            mod.UIAnchor.TopRight,
            mod.GetUIRoot(),
            false,
            0,
            mod.CreateVector(0, 0, 0),
            0,
            mod.UIBgFill.None,
            mod.UIDepth.AboveGameUI,
            player
        );
        container = mod.FindUIWidgetWithName(containerId, mod.GetUIRoot());
    }
    if (container) {
        mod.SetUIWidgetVisible(container, true);
    }

    const makeText = (id: string, posY: number) => {
        mod.AddUIText(
            id,
            mod.CreateVector(0, posY, 0),
            mod.CreateVector(360, 14, 0),
            mod.UIAnchor.TopLeft,
            mod.Message(mod.stringkeys.twl.system.genericCounter, ""),
            player
        );
        const w = mod.FindUIWidgetWithName(id, mod.GetUIRoot());
        mod.SetUIWidgetBgAlpha(w, 0);
        mod.SetUITextSize(w, 10);
        mod.SetUITextColor(w, mod.CreateVector(1, 1, 1));
        if (container) mod.SetUIWidgetParent(w, container);
        return w;
    };

    // The first two rows are used for formatted debug strings; the last two are hidden legacy slots.
    let x = safeFind(xId);
    if (!x) x = makeText(xId, 0);
    let y = safeFind(yId);
    if (!y) y = makeText(yId, 14);
    let z = safeFind(zId);
    if (!z) z = makeText(zId, 0);
    let rotY = safeFind(rotYId);
    if (!rotY) rotY = makeText(rotYId, 14);

    if (!x || !y || !z || !rotY) return undefined;
    return { x, y, z, rotY };
}

async function positionDebugLoop(player: mod.Player, expectedToken: number): Promise<void> {
    const pid = mod.GetObjId(player);
    while (true) {
        const state = State.players.teamSwitchData[pid];
        if (!state || !state.posDebugVisible || state.posDebugToken !== expectedToken) return;
        if (!mod.IsPlayerValid(player)) return;
        if (!isPlayerDeployed(player)) return;

        const widgets = ensurePositionDebugWidgets(player);
        if (!widgets) return;

        const pos = safeGetSoldierStateVector(player, mod.SoldierStateVector.GetPosition);
        const facing = safeGetSoldierStateVector(player, mod.SoldierStateVector.GetFacingDirection);
        if (!pos || !facing) return;

        const roundTo3 = (value: number) => Math.round(value * 1000) / 1000;
        mod.SetUITextLabel(
            widgets.x,
            mod.Message(
                mod.stringkeys.twl.debug.adminPos,
                roundTo3(mod.XComponentOf(pos)),
                roundTo3(mod.YComponentOf(pos)),
                roundTo3(mod.ZComponentOf(pos))
            )
        );
        mod.SetUITextLabel(
            widgets.y,
            mod.Message(
                mod.stringkeys.twl.debug.adminFacing,
                roundTo3(mod.XComponentOf(facing)),
                roundTo3(mod.YComponentOf(facing)),
                roundTo3(mod.ZComponentOf(facing))
            )
        );
        mod.SetUITextLabel(widgets.z, mod.Message(mod.stringkeys.twl.system.genericCounter, ""));
        mod.SetUITextLabel(widgets.rotY, mod.Message(mod.stringkeys.twl.system.genericCounter, ""));

        await mod.Wait(2.0);
    }
}

function setPositionDebugVisibleForPlayer(player: mod.Player, visible: boolean): void {
    const pid = mod.GetObjId(player);
    const state = State.players.teamSwitchData[pid];
    if (!state) return;

    const widgets = ensurePositionDebugWidgets(player);
    if (!widgets) return;

    const container = safeFind(UI_POS_DEBUG_CONTAINER_ID + pid);
    if (container) mod.SetUIWidgetVisible(container, visible);

    mod.SetUIWidgetVisible(widgets.x, visible);
    mod.SetUIWidgetVisible(widgets.y, visible);
    mod.SetUIWidgetVisible(widgets.z, false);
    mod.SetUIWidgetVisible(widgets.rotY, false);

    state.posDebugToken = (state.posDebugToken + 1) % 1000000000;
    if (visible) {
        void positionDebugLoop(player, state.posDebugToken);
    }
}

//#endregion ----------------- Admin Panel UI builder helpers --------------------



//#region -------------------- Ready Dialog - Roster Render + Toggle Labels --------------------

// Builds the entire Team Switch + Admin Panel dialog.
// Responsibilities:
// - Creates left team, right team, and admin panel UI sections
// - Defines layout constants and row math for the admin panel
// - Wires all admin buttons to authoritative match state mutations
// - Ensures per-player UI roots are created once and reused

// Populates the roster UI for the given viewer. 
// - Real active player lists + team assignment
// - Default status values (NOT READY / IN MAIN BASE) for all rows
// Later phases will replace defaults with authoritative per-player state + gating + round integration.

// Applies per-row color policy for the Ready dialog:
// - Player name: white by default; green only when BOTH ready AND in main base.
// - READY / IN MAIN BASE: green
// - NOT READY / NOT IN MAIN BASE: red
function applyReadyDialogRowColors(nameWidget: mod.UIWidget | undefined, readyWidget: mod.UIWidget | undefined, baseWidget: mod.UIWidget | undefined, isReady: boolean, isInBase: boolean): void {
    if (readyWidget) mod.SetUITextColor(readyWidget, isReady ? COLOR_READY_GREEN : COLOR_NOT_READY_RED);
    if (baseWidget) mod.SetUITextColor(baseWidget, isInBase ? COLOR_READY_GREEN : COLOR_NOT_READY_RED);
    if (nameWidget) mod.SetUITextColor(nameWidget, (isReady && isInBase) ? COLOR_READY_GREEN : COLOR_NORMAL);
}

// Renders the entire Ready Up dialog state for a single viewer.
// Centralizing UI updates reduces refresh regressions as the dialog grows in complexity.
function renderReadyDialogForViewer(eventPlayer: mod.Player, viewerPid: number): void {
    refreshReadyDialogRosterForViewer(eventPlayer, viewerPid);
    updateReadyToggleButtonForViewer(eventPlayer, viewerPid);

}

// Renders the dialog for all players who currently have it open.
// Code Cleanup: Overlaps with refreshReadyDialogForAllVisibleViewers; consider consolidating to one entrypoint.
/**
 * Broadcast-style refresh for the ready dialog.
 * Call whenever roster membership or per-player display state changes (ready / in-main-base / team).
 */
function renderReadyDialogForAllVisibleViewers(): void {
    for (const pidStr in State.players.teamSwitchData) {
        const pid = Number(pidStr);
        const state = State.players.teamSwitchData[pid];
        if (!state || !state.dialogVisible) continue;
        const viewer = safeFindPlayer(pid);
        if (!viewer) continue;
        renderReadyDialogForViewer(viewer, pid);
    }
}

function refreshReadyDialogRosterForViewer(viewer: mod.Player, viewerPlayerId: number): void {
    const roster = getRosterDisplayEntries();
    const t1Players = roster.team1;
    const t2Players = roster.team2;

    const maxRowsPerTeam = TEAM_ROSTER_MAX_ROWS;
    const emptyMsg = mod.Message(mod.stringkeys.twl.system.genericCounter, "");
    for (let row = 0; row < maxRowsPerTeam; row++) {
        const t1NameId = UI_READY_DIALOG_T1_ROW_NAME_ID + viewerPlayerId + "_" + row;
        const t1ReadyId = UI_READY_DIALOG_T1_ROW_READY_ID + viewerPlayerId + "_" + row;
        const t1BaseId = UI_READY_DIALOG_T1_ROW_BASE_ID + viewerPlayerId + "_" + row;

        const t2NameId = UI_READY_DIALOG_T2_ROW_NAME_ID + viewerPlayerId + "_" + row;
        const t2ReadyId = UI_READY_DIALOG_T2_ROW_READY_ID + viewerPlayerId + "_" + row;
        const t2BaseId = UI_READY_DIALOG_T2_ROW_BASE_ID + viewerPlayerId + "_" + row;

        const t1Name = mod.FindUIWidgetWithName(t1NameId, mod.GetUIRoot());
        const t1Ready = mod.FindUIWidgetWithName(t1ReadyId, mod.GetUIRoot());
        const t1Base = mod.FindUIWidgetWithName(t1BaseId, mod.GetUIRoot());

        const t2Name = mod.FindUIWidgetWithName(t2NameId, mod.GetUIRoot());
        const t2Ready = mod.FindUIWidgetWithName(t2ReadyId, mod.GetUIRoot());
        const t2Base = mod.FindUIWidgetWithName(t2BaseId, mod.GetUIRoot());

        const t1Entry = (row < t1Players.length) ? t1Players[row] : undefined;
        const t2Entry = (row < t2Players.length) ? t2Players[row] : undefined;
        const p1 = t1Entry?.player;
        const p2 = t2Entry?.player;

        // Hide unused placeholder rows (prevents 'unknown string' artifacts and reduces visual noise).
        const hasP1 = !!t1Entry;
        const hasP2 = !!t2Entry;
        if (t1Name) mod.SetUIWidgetVisible(t1Name, hasP1);
        if (t1Ready) mod.SetUIWidgetVisible(t1Ready, hasP1);
        if (t1Base) mod.SetUIWidgetVisible(t1Base, hasP1);
        if (t2Name) mod.SetUIWidgetVisible(t2Name, hasP2);
        if (t2Ready) mod.SetUIWidgetVisible(t2Ready, hasP2);
        if (t2Base) mod.SetUIWidgetVisible(t2Base, hasP2);

        mod.SetUITextLabel(t1Name, hasP1 ? getRosterEntryNameMessage(t1Entry) : emptyMsg);
        mod.SetUITextLabel(
            t1Ready,
            hasP1
                ? (p1
                    ? (State.players.readyByPid[mod.GetObjId(p1)] ? mod.Message(mod.stringkeys.twl.readyDialog.status.ready) : mod.Message(mod.stringkeys.twl.readyDialog.status.notReady))
                    : mod.Message(mod.stringkeys.twl.readyDialog.status.notReady))
                : emptyMsg
        );
        mod.SetUITextLabel(
            t1Base,
            hasP1
                ? (p1
                    ? (isPlayerInMainBaseForReady(mod.GetObjId(p1)) ? mod.Message(mod.stringkeys.twl.readyDialog.baseStatus.in) : mod.Message(mod.stringkeys.twl.readyDialog.baseStatus.out))
                    : mod.Message(mod.stringkeys.twl.readyDialog.baseStatus.out))
                : emptyMsg
        );
        if (p1) {
            const p1Id = mod.GetObjId(p1);
            const p1Ready = !!State.players.readyByPid[p1Id];
            const p1InBase = isPlayerInMainBaseForReady(p1Id);
            applyReadyDialogRowColors(t1Name, t1Ready, t1Base, p1Ready, p1InBase);
        } else if (hasP1) {
            applyReadyDialogRowColors(t1Name, t1Ready, t1Base, false, false);
        } else {
            // Empty row: default to white for any placeholder text.
            if (t1Name) mod.SetUITextColor(t1Name, COLOR_NORMAL);
            if (t1Ready) mod.SetUITextColor(t1Ready, COLOR_NORMAL);
            if (t1Base) mod.SetUITextColor(t1Base, COLOR_NORMAL);
        }

        mod.SetUITextLabel(t2Name, hasP2 ? getRosterEntryNameMessage(t2Entry) : emptyMsg);
        mod.SetUITextLabel(
            t2Ready,
            hasP2
                ? (p2
                    ? (State.players.readyByPid[mod.GetObjId(p2)] ? mod.Message(mod.stringkeys.twl.readyDialog.status.ready) : mod.Message(mod.stringkeys.twl.readyDialog.status.notReady))
                    : mod.Message(mod.stringkeys.twl.readyDialog.status.notReady))
                : emptyMsg
        );
        mod.SetUITextLabel(
            t2Base,
            hasP2
                ? (p2
                    ? (isPlayerInMainBaseForReady(mod.GetObjId(p2)) ? mod.Message(mod.stringkeys.twl.readyDialog.baseStatus.in) : mod.Message(mod.stringkeys.twl.readyDialog.baseStatus.out))
                    : mod.Message(mod.stringkeys.twl.readyDialog.baseStatus.out))
                : emptyMsg
        );
        if (p2) {
            const p2Id = mod.GetObjId(p2);
            const p2Ready = !!State.players.readyByPid[p2Id];
            const p2InBase = isPlayerInMainBaseForReady(p2Id);
            applyReadyDialogRowColors(t2Name, t2Ready, t2Base, p2Ready, p2InBase);
        } else if (hasP2) {
            applyReadyDialogRowColors(t2Name, t2Ready, t2Base, false, false);
        } else {
            if (t2Name) mod.SetUITextColor(t2Name, COLOR_NORMAL);
            if (t2Ready) mod.SetUITextColor(t2Ready, COLOR_NORMAL);
            if (t2Base) mod.SetUITextColor(t2Base, COLOR_NORMAL);
        }
    }
}

// Updates the Ready toggle button label for the given viewer based on that viewer's current ready state.
function updateReadyToggleButtonForViewer(viewer: mod.Player, viewerPlayerId: number): void {
    const btnLabelId = UI_READY_DIALOG_BUTTON_READY_LABEL_ID + viewerPlayerId;
    const labelWidget = mod.FindUIWidgetWithName(btnLabelId, mod.GetUIRoot());
    if (!labelWidget) return;

    const isReady = !!State.players.readyByPid[viewerPlayerId];
    const labelMsg = isReady
        ? mod.Message(mod.stringkeys.twl.readyDialog.buttons.notReady)
        : mod.Message(mod.stringkeys.twl.readyDialog.buttons.ready);

    mod.SetUITextLabel(labelWidget, labelMsg);
}

//#endregion ----------------- Ready Dialog - Roster Render + Toggle Labels --------------------



//#region -------------------- Ready Dialog - Map/Mode Config UI Readout --------------------

// Updates the Ready Up dialog "Best of {0} Rounds" label for a single viewer.
function updateBestOfRoundsLabelForPid(pid: number): void {
    const labelId = UI_READY_DIALOG_BESTOF_LABEL_ID + pid;
    const labelWidget = safeFind(labelId);
    if (!labelWidget) return;
    mod.SetUITextLabel(labelWidget, mod.Message(mod.stringkeys.twl.readyDialog.bestOfLabel, Math.floor(State.round.max)));
}

function updateBestOfRoundsLabelForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        updateBestOfRoundsLabelForPid(mod.GetObjId(p));
    }
}

function updateReadyDialogMapLabelForPid(pid: number): void {
    const valueId = UI_READY_DIALOG_MAP_VALUE_ID + pid;
    const valueWidget = safeFind(valueId);
    if (!valueWidget) return;
    mod.SetUITextLabel(valueWidget, mod.Message(getMapNameKey(ACTIVE_MAP_KEY)));
}

function updateReadyDialogMapLabelForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        updateReadyDialogMapLabelForPid(mod.GetObjId(p));
    }
}

function updateReadyDialogModeConfigForPid(pid: number): void {
    const cfg = State.round.modeConfig;

    const gameLabel = safeFind(UI_READY_DIALOG_MODE_GAME_LABEL_ID + pid);
    if (gameLabel) mod.SetUITextLabel(gameLabel, mod.Message(mod.stringkeys.twl.readyDialog.gameModeLabel));
    const gameValue = safeFind(UI_READY_DIALOG_MODE_GAME_VALUE_ID + pid);
    if (gameValue) mod.SetUITextLabel(gameValue, mod.Message(cfg.gameMode));

    const settingsLabel = safeFind(UI_READY_DIALOG_MODE_SETTINGS_LABEL_ID + pid);
    if (settingsLabel) mod.SetUITextLabel(settingsLabel, mod.Message(mod.stringkeys.twl.readyDialog.modeSettingsLabel));
    const settingsValue = safeFind(UI_READY_DIALOG_MODE_SETTINGS_VALUE_ID + pid);
    if (settingsValue) {
        const applyCustomCeiling = shouldApplyCustomCeilingForConfig(cfg.gameMode, cfg.aircraftCeilingOverridePending);
        const ceilingValue = applyCustomCeiling
            ? Math.floor(cfg.aircraftCeiling)
            : STR_READY_DIALOG_AIRCRAFT_CEILING_VANILLA;
        mod.SetUITextLabel(
            settingsValue,
            mod.Message(cfg.gameSettings, ceilingValue)
        );
    }

    const vehiclesT1Label = safeFind(UI_READY_DIALOG_MODE_VEHICLES_T1_LABEL_ID + pid);
    if (vehiclesT1Label) {
        mod.SetUITextLabel(
            vehiclesT1Label,
            mod.Message(mod.stringkeys.twl.readyDialog.vehiclesLabelFormat, getTeamNameKey(TeamID.Team1))
        );
    }
    const vehiclesT1Value = safeFind(UI_READY_DIALOG_MODE_VEHICLES_T1_VALUE_ID + pid);
    if (vehiclesT1Value) mod.SetUITextLabel(vehiclesT1Value, mod.Message(cfg.vehiclesT1));

    const vehiclesT2Label = safeFind(UI_READY_DIALOG_MODE_VEHICLES_T2_LABEL_ID + pid);
    if (vehiclesT2Label) {
        mod.SetUITextLabel(
            vehiclesT2Label,
            mod.Message(mod.stringkeys.twl.readyDialog.vehiclesLabelFormat, getTeamNameKey(TeamID.Team2))
        );
    }
    const vehiclesT2Value = safeFind(UI_READY_DIALOG_MODE_VEHICLES_T2_VALUE_ID + pid);
    if (vehiclesT2Value) mod.SetUITextLabel(vehiclesT2Value, mod.Message(cfg.vehiclesT2));
}

function updateReadyDialogModeConfigForAllVisibleViewers(): void {
    for (const pidStr in State.players.teamSwitchData) {
        const pid = Number(pidStr);
        const state = State.players.teamSwitchData[pid];
        if (!state || !state.dialogVisible) continue;
        updateReadyDialogModeConfigForPid(pid);
    }
}

//#endregion ----------------- Ready Dialog - Map/Mode Config UI Readout --------------------



//#region -------------------- Aircraft Ceiling (Hard Enforcement) --------------------

// Engine limiter expects a world-Y scale; convert HUD ceiling using the map's HUD floor/max offsets.
function applyCustomAircraftCeilingHardLimiter(): void {
    const floorY = Math.floor(State.round.aircraftCeiling.hudFloorY);
    const baseHud = Math.max(1, Math.floor(State.round.aircraftCeiling.hudMaxY));
    const targetHud = Math.max(1, Math.floor(State.round.modeConfig.confirmed.aircraftCeiling));
    // Convert HUD ceiling to world Y using the map-specific HUD floor offset.
    const baseWorldY = Math.max(1, floorY + baseHud);
    const targetWorldY = Math.max(1, floorY + targetHud);
    const scale = targetWorldY / baseWorldY;
    mod.SetMaxVehicleHeightLimitScale(scale);
}

function enableCustomAircraftCeiling(): void {
    State.round.aircraftCeiling.customEnabled = true;
    State.round.aircraftCeiling.vehicleStates = {};
}

function disableCustomAircraftCeilingAndRestoreDefault(): void {
    State.round.aircraftCeiling.customEnabled = false;
    State.round.aircraftCeiling.vehicleStates = {};
    State.round.modeConfig.aircraftCeiling = State.round.aircraftCeiling.mapDefaultHudCeiling;
    State.round.modeConfig.gameSettings = mod.stringkeys.twl.readyDialog.modeSettingAircraftCeilingFormat;
    State.round.modeConfig.confirmed.aircraftCeiling = State.round.aircraftCeiling.mapDefaultHudCeiling;
    mod.SetMaxVehicleHeightLimitScale(1.0);
    updateReadyDialogModeConfigForAllVisibleViewers();
}

function syncAircraftCeilingFromMapConfig(): void {
    const mapDefault = Math.max(1, Math.floor(ACTIVE_MAP_CONFIG.aircraftCeiling));
    const mapMaxHud = Math.max(1, Math.floor(ACTIVE_MAP_CONFIG.hudMaxY));
    const floorY = Math.floor(ACTIVE_MAP_CONFIG.hudFloorY);
    State.round.aircraftCeiling.mapDefaultHudCeiling = mapDefault;
    State.round.aircraftCeiling.hudMaxY = mapMaxHud;
    State.round.aircraftCeiling.hudFloorY = floorY;
    State.round.aircraftCeiling.customEnabled = false;
    State.round.aircraftCeiling.vehicleStates = {};
    // Keep the engine ceiling at vanilla scale; soft enforcement is confirm-gated.
    mod.SetMaxVehicleHeightLimitScale(1.0);

    State.round.modeConfig.aircraftCeiling = mapDefault;
    State.round.modeConfig.aircraftCeilingOverridePending = false;
    State.round.modeConfig.gameSettings = mod.stringkeys.twl.readyDialog.modeSettingAircraftCeilingFormat;
    State.round.modeConfig.confirmed.aircraftCeiling = mapDefault;
    State.round.modeConfig.confirmed.aircraftCeilingOverrideEnabled = false;

    updateReadyDialogModeConfigForAllVisibleViewers();
}

//#endregion ----------------- Aircraft Ceiling (Soft Enforcement) --------------------



//#region -------------------- Ready Dialog - Mode Presets + Confirm --------------------

function isReadyDialogGameModeVanilla(gameModeKey: number): boolean {
    return gameModeKey === mod.stringkeys.twl.readyDialog.gameModeHelisPractice;
}

function isReadyDialogGameModeLadder(gameModeKey: number): boolean {
    return gameModeKey === mod.stringkeys.twl.readyDialog.gameModeHelisLadder;
}

function isReadyDialogGameModeTwl1v1(gameModeKey: number): boolean {
    return gameModeKey === mod.stringkeys.twl.readyDialog.gameModeHelisTwl1v1;
}

function isReadyDialogGameModeCustom(gameModeKey: number): boolean {
    return gameModeKey === mod.stringkeys.twl.readyDialog.gameModeHelisCustom;
}

function isReadyDialogGameModeTwlPreset(gameModeKey: number): boolean {
    return isReadyDialogGameModeLadder(gameModeKey) || isReadyDialogGameModeTwl1v1(gameModeKey);
}

function getReadyDialogPresetPlayersPerSide(gameModeKey: number): number {
    if (isReadyDialogGameModeTwl1v1(gameModeKey)) {
        return READY_DIALOG_MODE_PRESET_PLAYERS_PER_SIDE_TWL_1V1;
    }
    if (isReadyDialogGameModeLadder(gameModeKey)) {
        return READY_DIALOG_MODE_PRESET_PLAYERS_PER_SIDE_TWL_2V2;
    }
    return READY_DIALOG_MODE_PRESET_PLAYERS_PER_SIDE_VANILLA;
}

function shouldApplyCustomCeilingForGameMode(gameModeKey: number): boolean {
    if (isReadyDialogGameModeVanilla(gameModeKey)) return false;
    if (isReadyDialogGameModeCustom(gameModeKey)) return true;
    if (isReadyDialogGameModeTwlPreset(gameModeKey)) return !!ACTIVE_MAP_CONFIG.useCustomCeiling;
    return true;
}

// Custom mode always applies the numeric ceiling; Vanilla/Ladder apply only when configured to do so.
function shouldApplyCustomCeilingForConfig(gameModeKey: number, overrideEnabled: boolean): boolean {
    if (isReadyDialogGameModeCustom(gameModeKey)) {
        return overrideEnabled;
    }
    return shouldApplyCustomCeilingForGameMode(gameModeKey);
}

// Forces Custom mode without applying presets or mutating other settings.
function ensureCustomGameModeForManualChange(): void {
    if (suppressReadyDialogModeAutoSwitch) return;
    if (State.round.modeConfig.gameModeIndex === READY_DIALOG_GAME_MODE_CUSTOM_INDEX) return;
    const priorMode = State.round.modeConfig.gameMode;
    const shouldKeepCeilingOverride =
        shouldApplyCustomCeilingForGameMode(priorMode)
        || State.round.modeConfig.aircraftCeilingOverridePending
        || State.round.modeConfig.confirmed.aircraftCeilingOverrideEnabled;
    if (shouldKeepCeilingOverride) {
        State.round.modeConfig.aircraftCeilingOverridePending = true;
    }
    State.round.modeConfig.gameModeIndex = READY_DIALOG_GAME_MODE_CUSTOM_INDEX;
    State.round.modeConfig.gameMode = READY_DIALOG_GAME_MODE_OPTIONS[READY_DIALOG_GAME_MODE_CUSTOM_INDEX];
    updateReadyDialogModeConfigForAllVisibleViewers();
    updateSettingsSummaryHudForAllPlayers();
}

// True only when all preset values match the selected mode (best-of, matchup, players, vehicles, ceiling).
function isReadyDialogModePresetActive(gameModeKey: number): boolean {
    if (isReadyDialogGameModeCustom(gameModeKey)) return false;
    const expectedBestOf = isReadyDialogGameModeTwlPreset(gameModeKey)
        ? READY_DIALOG_MODE_PRESET_BEST_OF_LADDER
        : READY_DIALOG_MODE_PRESET_BEST_OF_VANILLA;
    if (Math.floor(State.round.max) !== expectedBestOf) return false;
    if (State.round.matchupPresetIndex !== READY_DIALOG_MODE_PRESET_MATCHUP_INDEX) return false;
    if (State.round.autoStartMinActivePlayers !== getReadyDialogPresetPlayersPerSide(gameModeKey)) return false;
    if (State.round.modeConfig.vehicleIndexT1 !== READY_DIALOG_MODE_PRESET_VEHICLE_INDEX) return false;
    if (State.round.modeConfig.vehicleIndexT2 !== READY_DIALOG_MODE_PRESET_VEHICLE_INDEX) return false;
    if (Math.floor(State.round.modeConfig.aircraftCeiling) !== Math.floor(State.round.aircraftCeiling.mapDefaultHudCeiling)) return false;
    return true;
}

// Applies the full mode preset (the only place we intentionally sync multiple settings at once).
function applyReadyDialogModePresetForGameMode(gameModeKey: number): boolean {
    if (isReadyDialogGameModeCustom(gameModeKey)) return false;

    suppressReadyDialogModeAutoSwitch = true;
    const bestOfRounds = isReadyDialogGameModeTwlPreset(gameModeKey)
        ? READY_DIALOG_MODE_PRESET_BEST_OF_LADDER
        : READY_DIALOG_MODE_PRESET_BEST_OF_VANILLA;

    setHudRoundCountersForAllPlayers(State.round.current, bestOfRounds);
    applyMatchupPresetInternal(READY_DIALOG_MODE_PRESET_MATCHUP_INDEX, undefined, false, true);

    State.round.autoStartMinActivePlayers = getReadyDialogPresetPlayersPerSide(gameModeKey);
    updateMatchupReadoutsForAllPlayers();

    State.round.modeConfig.vehicleIndexT1 = READY_DIALOG_MODE_PRESET_VEHICLE_INDEX;
    State.round.modeConfig.vehicleIndexT2 = READY_DIALOG_MODE_PRESET_VEHICLE_INDEX;
    State.round.modeConfig.vehiclesT1 = READY_DIALOG_VEHICLE_OPTIONS[READY_DIALOG_MODE_PRESET_VEHICLE_INDEX];
    State.round.modeConfig.vehiclesT2 = READY_DIALOG_VEHICLE_OPTIONS[READY_DIALOG_MODE_PRESET_VEHICLE_INDEX];

    State.round.modeConfig.aircraftCeiling = State.round.aircraftCeiling.mapDefaultHudCeiling;
    State.round.modeConfig.aircraftCeilingOverridePending = false;
    State.round.modeConfig.gameSettings = mod.stringkeys.twl.readyDialog.modeSettingAircraftCeilingFormat;

    suppressReadyDialogModeAutoSwitch = false;

    updateReadyDialogModeConfigForAllVisibleViewers();
    updateSettingsSummaryHudForAllPlayers();
    return true;
}

function setReadyDialogGameModeIndex(nextIndex: number, applyPreset: boolean = true): void {
    const count = READY_DIALOG_GAME_MODE_OPTIONS.length;
    if (count <= 0) return;
    const clamped = ((nextIndex % count) + count) % count;
    State.round.modeConfig.gameModeIndex = clamped;
    State.round.modeConfig.gameMode = READY_DIALOG_GAME_MODE_OPTIONS[clamped];
    if (applyPreset) {
        const applied = applyReadyDialogModePresetForGameMode(State.round.modeConfig.gameMode);
        if (applied) return;
    }
    updateReadyDialogModeConfigForAllVisibleViewers();
    updateSettingsSummaryHudForAllPlayers();
}

function setReadyDialogAircraftCeiling(nextValue: number, _changedBy?: mod.Player): void {
    ensureCustomGameModeForManualChange();
    const clamped = Math.max(
        READY_DIALOG_AIRCRAFT_CEILING_MIN,
        Math.min(READY_DIALOG_AIRCRAFT_CEILING_MAX, Math.floor(nextValue))
    );
    State.round.modeConfig.aircraftCeiling = clamped;
    State.round.modeConfig.aircraftCeilingOverridePending = true;
    State.round.modeConfig.gameSettings = mod.stringkeys.twl.readyDialog.modeSettingAircraftCeilingFormat;
    updateReadyDialogModeConfigForAllVisibleViewers();
}

function setReadyDialogVehicleIndexT1(nextIndex: number): void {
    const count = READY_DIALOG_VEHICLE_OPTIONS.length;
    if (count <= 0) return;
    ensureCustomGameModeForManualChange();
    const clamped = ((nextIndex % count) + count) % count;
    State.round.modeConfig.vehicleIndexT1 = clamped;
    State.round.modeConfig.vehiclesT1 = READY_DIALOG_VEHICLE_OPTIONS[clamped];
    updateReadyDialogModeConfigForAllVisibleViewers();
}

function setReadyDialogVehicleIndexT2(nextIndex: number): void {
    const count = READY_DIALOG_VEHICLE_OPTIONS.length;
    if (count <= 0) return;
    ensureCustomGameModeForManualChange();
    const clamped = ((nextIndex % count) + count) % count;
    State.round.modeConfig.vehicleIndexT2 = clamped;
    State.round.modeConfig.vehiclesT2 = READY_DIALOG_VEHICLE_OPTIONS[clamped];
    updateReadyDialogModeConfigForAllVisibleViewers();
}

function confirmReadyDialogModeConfig(changedBy?: mod.Player): void {
    const cfg = State.round.modeConfig;
    const prevConfirmed = cfg.confirmed.aircraftCeiling;
    const prevGameMode = cfg.confirmed.gameMode;
    // Confirm is authoritative: it can force Custom if settings diverge from presets
    // and it is the only place we apply ceiling + vehicle overrides.
    if (!isReadyDialogGameModeCustom(cfg.gameMode) && !isReadyDialogModePresetActive(cfg.gameMode)) {
        cfg.gameModeIndex = READY_DIALOG_GAME_MODE_CUSTOM_INDEX;
        cfg.gameMode = READY_DIALOG_GAME_MODE_OPTIONS[READY_DIALOG_GAME_MODE_CUSTOM_INDEX];
    }
    const nextCeilingOverrideEnabled =
        cfg.confirmed.aircraftCeilingOverrideEnabled || cfg.aircraftCeilingOverridePending;
    const applyCustomCeiling = shouldApplyCustomCeilingForConfig(cfg.gameMode, nextCeilingOverrideEnabled);
    const isMapDefaultVehicle = cfg.vehicleIndexT1 === READY_DIALOG_VEHICLE_MAP_DEFAULT_INDEX;
    // Keep the selected heli override consistent across teams when confirming.
    cfg.vehicleIndexT2 = cfg.vehicleIndexT1;
    cfg.vehiclesT2 = cfg.vehiclesT1;
    cfg.confirmed = {
        gameMode: cfg.gameMode,
        gameSettings: cfg.gameSettings,
        vehiclesT1: cfg.vehiclesT1,
        vehiclesT2: cfg.vehiclesT1,
        aircraftCeiling: cfg.aircraftCeiling,
        aircraftCeilingOverrideEnabled: nextCeilingOverrideEnabled,
        vehicleIndexT1: cfg.vehicleIndexT1,
        vehicleIndexT2: cfg.vehicleIndexT1,
        vehicleOverrideEnabled: !isMapDefaultVehicle,
    };
    refreshOvertimeZonesFromMapConfig();
    // Apply custom ceiling only after the user confirms settings; enforcement runs while enabled.
    if (!applyCustomCeiling) {
        disableCustomAircraftCeilingAndRestoreDefault();
    } else {
        enableCustomAircraftCeiling();
        applyCustomAircraftCeilingHardLimiter();
    }
    if (changedBy && cfg.confirmed.aircraftCeiling !== prevConfirmed) {
        sendHighlightedWorldLogMessage(
            mod.Message(STR_READY_DIALOG_AIRCRAFT_CEILING_CHANGED, changedBy, Math.floor(cfg.confirmed.aircraftCeiling)),
            true,
            undefined,
            STR_READY_DIALOG_AIRCRAFT_CEILING_CHANGED
        );
    }
    if (changedBy && cfg.confirmed.gameMode !== prevGameMode) {
        sendHighlightedWorldLogMessage(
            mod.Message(STR_READY_DIALOG_GAME_MODE_CHANGED, changedBy, cfg.confirmed.gameMode),
            true,
            undefined,
            STR_READY_DIALOG_GAME_MODE_CHANGED
        );
    }
    refreshVehicleSpawnSpecsFromModeConfig();
    applyVehicleSpawnSpecsToExistingSlots();
    updateSettingsSummaryHudForAllPlayers();
}

//#endregion ----------------- Ready Dialog - Mode Presets + Confirm --------------------



//#region -------------------- Ready Dialog - Team/Matchup Readouts + Summary HUD --------------------

function updateTeamNameWidgetsForPid(pid: number): void {
    const t1NameKey = getTeamNameKey(TeamID.Team1);
    const t2NameKey = getTeamNameKey(TeamID.Team2);

    const hudT1 = safeFind(`TeamLeft_Name_${pid}`);
    const hudT2 = safeFind(`TeamRight_Name_${pid}`);
    if (hudT1) mod.SetUITextLabel(hudT1, mod.Message(t1NameKey));
    if (hudT2) mod.SetUITextLabel(hudT2, mod.Message(t2NameKey));

    const readyT1 = safeFind(UI_READY_DIALOG_TEAM1_LABEL_ID + pid);
    const readyT2 = safeFind(UI_READY_DIALOG_TEAM2_LABEL_ID + pid);
    if (readyT1) mod.SetUITextLabel(readyT1, mod.Message(t1NameKey));
    if (readyT2) mod.SetUITextLabel(readyT2, mod.Message(t2NameKey));

    updateReadyDialogModeConfigForPid(pid);
}

function updateTeamNameWidgetsForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        updateTeamNameWidgetsForPid(mod.GetObjId(p));
    }
    updateSettingsSummaryHudForAllPlayers();
}

function updateMatchupLabelForPid(pid: number): void {
    const labelId = UI_READY_DIALOG_MATCHUP_LABEL_ID + pid;
    const labelWidget = safeFind(labelId);
    if (!labelWidget) return;
    const showLabel = !isRoundLive();
    mod.SetUIWidgetVisible(labelWidget, showLabel);
    if (!showLabel) return;
    const preset = MATCHUP_PRESETS[State.round.matchupPresetIndex];
    mod.SetUITextLabel(
        labelWidget,
        mod.Message(mod.stringkeys.twl.readyDialog.matchupFormat, preset.leftPlayers, preset.rightPlayers)
    );
}

// Refreshes the matchup label (e.g., "1 vs 1") for every active player HUD.
function updateMatchupLabelForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        updateMatchupLabelForPid(mod.GetObjId(p));
    }
}

// Resolves the per-side + total player requirements from the auto-start setting.
// Special case: value 0 represents "1 vs 0" to allow solo starts.
function getAutoStartMinPlayerCounts(): { left: number; right: number; total: number } {
    const perSide = Math.floor(State.round.autoStartMinActivePlayers);
    if (perSide <= 0) {
        return { left: 1, right: 0, total: 1 };
    }
    return { left: perSide, right: perSide, total: perSide * 2 };
}

// Updates per-player Ready dialog readouts (target kills + players-per-side) for a single pid.
function updateMatchupReadoutsForPid(pid: number): void {
    const minPlayersWidget = safeFind(UI_READY_DIALOG_MATCHUP_MINPLAYERS_ID + pid);
    const minPlayersTotalWidget = safeFind(UI_READY_DIALOG_MATCHUP_MINPLAYERS_TOTAL_ID + pid);
    const killsTargetWidget = safeFind(UI_READY_DIALOG_MATCHUP_KILLSTARGET_ID + pid);
    const counts = getAutoStartMinPlayerCounts();
    const showLiveReadouts = !isRoundLive();
    if (minPlayersWidget) {
        mod.SetUIWidgetVisible(minPlayersWidget, showLiveReadouts);
    }
    if (minPlayersTotalWidget) {
        mod.SetUIWidgetVisible(minPlayersTotalWidget, showLiveReadouts);
    }
    if (killsTargetWidget) {
        mod.SetUIWidgetVisible(killsTargetWidget, showLiveReadouts);
    }
    if (!showLiveReadouts) return;
    if (minPlayersWidget) {
        mod.SetUITextLabel(
            minPlayersWidget,
            mod.Message(mod.stringkeys.twl.readyDialog.playersFormat, counts.left, counts.right)
        );
    }
    if (minPlayersTotalWidget) {
        mod.SetUITextLabel(
            minPlayersTotalWidget,
            mod.Message(mod.stringkeys.twl.readyDialog.minPlayersToStartFormat, counts.total)
        );
    }
    if (killsTargetWidget) {
        mod.SetUITextLabel(
            killsTargetWidget,
            mod.Message(mod.stringkeys.twl.readyDialog.targetKillsToWinFormat, Math.floor(State.round.killsTarget))
        );
    }
}

// Refreshes the matchup readouts for all players with a Ready dialog HUD.
function updateMatchupReadoutsForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        updateMatchupReadoutsForPid(mod.GetObjId(p));
    }
    updateSettingsSummaryHudForAllPlayers();
}

// Uses confirmed mode settings only (pending Ready dialog tweaks are not shown here).
function updateSettingsSummaryHudForPid(pid: number): void {
    const refs = State.hudCache.hudByPid[pid];
    if (!refs) return;

    const cfg = State.round.modeConfig;
    const gameModeValue = cfg.confirmed.gameMode;
    const applyCustomCeiling = shouldApplyCustomCeilingForConfig(gameModeValue, cfg.confirmed.aircraftCeilingOverrideEnabled);
    const ceilingValue = applyCustomCeiling
        ? Math.floor(cfg.confirmed.aircraftCeiling)
        : STR_READY_DIALOG_AIRCRAFT_CEILING_VANILLA;
    const vehiclesT1Value = cfg.confirmed.vehiclesT1;
    const vehiclesT2Value = cfg.confirmed.vehiclesT2;

    const preset = MATCHUP_PRESETS[State.round.matchupPresetIndex] ?? MATCHUP_PRESETS[0];
    const vehiclesLeft = preset?.leftPlayers ?? 1;
    const vehiclesRight = preset?.rightPlayers ?? 1;
    const autoStartCounts = getAutoStartMinPlayerCounts();

    if (refs.settingsGameModeText) {
        mod.SetUITextLabel(refs.settingsGameModeText, mod.Message(STR_HUD_SETTINGS_GAME_MODE_FORMAT, gameModeValue));
    }
    if (refs.settingsAircraftCeilingText) {
        mod.SetUITextLabel(refs.settingsAircraftCeilingText, mod.Message(STR_HUD_SETTINGS_AIRCRAFT_CEILING_FORMAT, ceilingValue));
    }
    if (refs.settingsVehiclesT1Text) {
        mod.SetUITextLabel(
            refs.settingsVehiclesT1Text,
            mod.Message(STR_HUD_SETTINGS_VEHICLES_TEAM_FORMAT, getTeamNameKey(TeamID.Team1), vehiclesT1Value)
        );
    }
    if (refs.settingsVehiclesT2Text) {
        mod.SetUITextLabel(
            refs.settingsVehiclesT2Text,
            mod.Message(STR_HUD_SETTINGS_VEHICLES_TEAM_FORMAT, getTeamNameKey(TeamID.Team2), vehiclesT2Value)
        );
    }
    if (refs.settingsVehiclesMatchupText) {
        const showMatchupText = !isRoundLive();
        mod.SetUIWidgetVisible(refs.settingsVehiclesMatchupText, showMatchupText);
        if (showMatchupText) {
            mod.SetUITextLabel(refs.settingsVehiclesMatchupText, mod.Message(STR_HUD_SETTINGS_VEHICLES_MATCHUP_FORMAT, vehiclesLeft, vehiclesRight));
        }
    }
    if (refs.settingsPlayersText) {
        mod.SetUITextLabel(refs.settingsPlayersText, mod.Message(STR_HUD_SETTINGS_PLAYERS_FORMAT, autoStartCounts.left, autoStartCounts.right));
    }
}

function updateSettingsSummaryHudForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        updateSettingsSummaryHudForPid(mod.GetObjId(p));
    }
}

function setAutoStartMinActivePlayers(value: number, eventPlayer?: mod.Player): void {
    const clamped = Math.max(AUTO_START_MIN_ACTIVE_PLAYERS_MIN, Math.min(AUTO_START_MIN_ACTIVE_PLAYERS_MAX, Math.floor(value)));
    if (clamped === State.round.autoStartMinActivePlayers) return;
    ensureCustomGameModeForManualChange();
    State.round.autoStartMinActivePlayers = clamped;
    updateMatchupReadoutsForAllPlayers();
    if (eventPlayer) {
        const counts = getAutoStartMinPlayerCounts();
        sendHighlightedWorldLogMessage(
            mod.Message(STR_READY_DIALOG_PLAYERS_CHANGED, eventPlayer, counts.left, counts.right),
            true,
            undefined,
            STR_READY_DIALOG_PLAYERS_CHANGED
        );
        tryAutoStartRoundIfAllReady(eventPlayer);
    }
}

// Applies the selected matchup preset, updates UI/state, and re-enables spawners (not-live only).
function applyMatchupPresetInternal(
    index: number,
    eventPlayer?: mod.Player,
    announce: boolean = true,
    bypassCooldown: boolean = false
): void {
    const clamped = Math.max(0, Math.min(MATCHUP_PRESETS.length - 1, Math.floor(index)));
    if (clamped === State.round.matchupPresetIndex) return;
    if (State.vehicles.spawnSequenceInProgress) return;
    const now = Math.floor(mod.GetMatchTimeElapsed());
    if (!bypassCooldown && now - State.round.lastMatchupChangeAtSeconds < MATCHUP_CHANGE_COOLDOWN_SECONDS) return;
    if (announce) {
        ensureCustomGameModeForManualChange();
    }
    const preset = MATCHUP_PRESETS[clamped];
    State.round.matchupPresetIndex = clamped;
    State.round.lastMatchupChangeAtSeconds = now;
    State.round.killsTarget = preset.roundKillsTarget;

    updateMatchupLabelForAllPlayers();
    updateMatchupReadoutsForAllPlayers();
    setRoundStateTextForAllPlayers();

    if (announce && eventPlayer) {
        sendHighlightedWorldLogMessage(
            mod.Message(STR_READY_DIALOG_MATCHUP_CHANGED, eventPlayer, preset.leftPlayers, preset.rightPlayers),
            true,
            undefined,
            STR_READY_DIALOG_MATCHUP_CHANGED
        );
    }

    applySpawnerEnablementForMatchup(clamped, true);

    // If the new minimum is satisfied, auto-start when all active players are ready.
    if (announce && eventPlayer) {
        tryAutoStartRoundIfAllReady(eventPlayer);
    }
}

// Applies the selected matchup preset, updates UI/state, and re-enables spawners (not-live only).
function applyMatchupPreset(index: number, eventPlayer: mod.Player): void {
    applyMatchupPresetInternal(index, eventPlayer, true, false);
}

//#endregion ----------------- Ready Dialog - Team/Matchup Readouts + Summary HUD --------------------



//#region -------------------- Join Prompt - IDs + Gating --------------------

function joinPromptRootName(pid: number): string { return "join_prompt_root_" + pid; }
function joinPromptPanelName(pid: number): string { return "join_prompt_panel_" + pid; }
function joinPromptTitleName(pid: number): string { return "join_prompt_title_" + pid; }
function joinPromptBodyName(pid: number): string { return "join_prompt_body_" + pid; }
function joinPromptButtonName(pid: number): string { return "join_prompt_dismiss_" + pid; }
function joinPromptButtonBorderName(pid: number): string { return joinPromptButtonName(pid) + "_BORDER"; }
function joinPromptButtonTextName(pid: number): string { return "join_prompt_dismiss_text_" + pid; }
function joinPromptNeverShowButtonName(pid: number): string { return "join_prompt_never_show_" + pid; }
function joinPromptNeverShowButtonBorderName(pid: number): string { return joinPromptNeverShowButtonName(pid) + "_BORDER"; }
function joinPromptNeverShowButtonTextName(pid: number): string { return "join_prompt_never_show_text_" + pid; }

function deleteJoinPromptWidget(name: string): void {
    const w = safeFind(name);
    if (!w) return;
    // Best-effort delete: widget may already be gone during undeploy/reconnect churn.
    try {
        mod.DeleteUIWidget(w);
    } catch {
        // Intentionally silent to avoid engine-side crashes on invalid handles.
    }
}

function isJoinPromptSuppressedForPlayer(pid: number): boolean {
    return !!State.players.joinPromptNeverShowByPidMap[pid]?.[ACTIVE_MAP_KEY];
}

// Persist "Never Show Again" per-map so other maps can still show the prompt
function setJoinPromptSuppressedForPlayer(pid: number): void {
    if (!State.players.joinPromptNeverShowByPidMap[pid]) {
        State.players.joinPromptNeverShowByPidMap[pid] = {};
    }
    State.players.joinPromptNeverShowByPidMap[pid][ACTIVE_MAP_KEY] = true;
}

// Lightweight gating used for both join-time and undeploy prompts (join-time "only once" is tracked separately).
function shouldShowJoinPromptForPlayer(player: mod.Player): boolean {
    if (!SHOW_HELP_TEXT_PROMPT_ON_JOIN) return false;
    if (!player || !mod.IsPlayerValid(player)) return false;
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return false;
    if (isJoinPromptSuppressedForPlayer(pid)) return false;
    if (safeFind(joinPromptRootName(pid))) return false;
    return true;
}

// Join prompt sequencing helpers:
// These keep the prompt flow deterministic and low-risk by only adjusting
// in-memory per-player state and selecting string keys accordingly.
function ensureJoinPromptStateForPid(pid: number): void {
    if (State.players.joinPromptReadyDialogOpenedByPid[pid] === undefined) {
        State.players.joinPromptReadyDialogOpenedByPid[pid] = false;
    }
    if (State.players.joinPromptTipIndexByPid[pid] === undefined) {
        State.players.joinPromptTipIndexByPid[pid] = 0;
    }
    if (State.players.joinPromptTipsUnlockedByPid[pid] === undefined) {
        State.players.joinPromptTipsUnlockedByPid[pid] = false;
    }
}

// Marks that the player successfully opened the Ready Up dialog (true unlock event).
// Ensures the next prompt shows mandatory2 before tips begin.
function markJoinPromptReadyDialogOpened(pid: number): void {
    ensureJoinPromptStateForPid(pid);
    if (State.players.joinPromptReadyDialogOpenedByPid[pid]) return;
    State.players.joinPromptReadyDialogOpenedByPid[pid] = true;
    if ((State.players.joinPromptTipIndexByPid[pid] ?? 0) < 1) {
        State.players.joinPromptTipIndexByPid[pid] = 1;
    }
}

// Arms a one-shot flag when a player triggers the triple-tap detector.
// This lets us require the multi-click path before unlocking join prompt tips.
function armJoinPromptTripleTapForPid(pid: number): void {
    State.players.joinPromptTripleTapArmedByPid[pid] = true;
}

function consumeJoinPromptTripleTapForPid(pid: number): boolean {
    if (!State.players.joinPromptTripleTapArmedByPid[pid]) return false;
    State.players.joinPromptTripleTapArmedByPid[pid] = false;
    return true;
}

function isJoinPromptBodyKeySkipped(key: number): boolean {
    return JOIN_PROMPT_BODY_SEQUENCE_SKIP_KEYS.indexOf(key) !== -1;
}

function findNextJoinPromptSequenceIndex(startIndex: number): number {
    const max = JOIN_PROMPT_BODY_SEQUENCE_KEYS.length;
    if (max <= 0) return 0;
    for (let offset = 0; offset < max; offset++) {
        const idx = (startIndex + offset) % max;
        const key = JOIN_PROMPT_BODY_SEQUENCE_KEYS[idx];
        if (!isJoinPromptBodyKeySkipped(key)) return idx;
    }
    return 0;
}

// Returns the clamped sequence index for this player.
function getJoinPromptSequenceIndexForPid(pid: number): number {
    ensureJoinPromptStateForPid(pid);
    const raw = Math.floor(State.players.joinPromptTipIndexByPid[pid] ?? 0);
    const max = JOIN_PROMPT_BODY_SEQUENCE_KEYS.length;
    const clamped = (raw >= 0 && raw < max) ? raw : 0;
    const resolved = findNextJoinPromptSequenceIndex(clamped);
    State.players.joinPromptTipIndexByPid[pid] = resolved;
    return resolved;
}

// Selects the body key for the prompt based on unlock + sequence state.
function getJoinPromptBodyKeyForPid(pid: number): number {
    ensureJoinPromptStateForPid(pid);
    if (!State.players.joinPromptReadyDialogOpenedByPid[pid]) {
        return STR_JOIN_PROMPT_BODY_MANDATORY1;
    }
    const index = getJoinPromptSequenceIndexForPid(pid);
    if (index >= 2) {
        State.players.joinPromptTipsUnlockedByPid[pid] = true;
    }
    return JOIN_PROMPT_BODY_SEQUENCE_KEYS[index];
}

// Chooses the dismiss label based on whether tips are unlocked.
function getJoinPromptDismissLabelKeyForPid(pid: number): number {
    ensureJoinPromptStateForPid(pid);
    return State.players.joinPromptTipsUnlockedByPid[pid]
        ? STR_JOIN_PROMPT_DISMISS_SHOW_MORE_TIPS
        : STR_JOIN_PROMPT_DISMISS;
}

// Never Show Again is only available after tips are unlocked.
function shouldShowJoinPromptNeverShowButtonForPid(pid: number): boolean {
    ensureJoinPromptStateForPid(pid);
    return State.players.joinPromptReadyDialogOpenedByPid[pid] && State.players.joinPromptTipsUnlockedByPid[pid];
}

// Advances the sequence only after the player has unlocked tips.
function advanceJoinPromptSequenceOnDismiss(pid: number): void {
    ensureJoinPromptStateForPid(pid);
    if (!State.players.joinPromptReadyDialogOpenedByPid[pid]) {
        State.players.joinPromptTipIndexByPid[pid] = 0;
        return;
    }
    const current = getJoinPromptSequenceIndexForPid(pid);
    const next = findNextJoinPromptSequenceIndex(current + 1);
    State.players.joinPromptTipIndexByPid[pid] = next;
    if (next >= 2) {
        State.players.joinPromptTipsUnlockedByPid[pid] = true;
    }
}

//#endregion ----------------- Join Prompt - IDs + Gating --------------------



//#region -------------------- Join Prompt - Layout --------------------

// Builds the join overlay, blocks deploy, and enables UI input until dismissed.
function createJoinPromptForPlayer(player: mod.Player): void {
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return;
    const uiRoot = mod.GetUIRoot();
    const bodyKey = getJoinPromptBodyKeyForPid(pid);
    const dismissLabelKey = getJoinPromptDismissLabelKeyForPid(pid);
    const showNeverShow = shouldShowJoinPromptNeverShowButtonForPid(pid);

    deleteJoinPromptWidget(joinPromptRootName(pid));
    deleteJoinPromptWidget(joinPromptButtonBorderName(pid));
    deleteJoinPromptWidget(joinPromptNeverShowButtonBorderName(pid));

    mod.EnablePlayerDeploy(player, false);
    setUIInputModeForPlayer(player, true);

    mod.AddUIContainer(
        joinPromptRootName(pid),
        mod.CreateVector(0, 0, 0),
        mod.CreateVector(1920, 1080, 0),
        mod.UIAnchor.Center,
        uiRoot,
        true,
        0,
        mod.CreateVector(0, 0, 0),
        0.55,
        mod.UIBgFill.Solid,
        mod.UIDepth.AboveGameUI,
        player
    );

    const root = safeFind(joinPromptRootName(pid));
    if (root) mod.SetUIWidgetDepth(root, mod.UIDepth.AboveGameUI);

    const joinPromptPanelOffsetY = -54;
    const joinPromptButtonOffsetY = 173;

    mod.AddUIContainer(
        joinPromptPanelName(pid),
        mod.CreateVector(0, joinPromptPanelOffsetY, 0),
        mod.CreateVector(900, 444, 0),
        mod.UIAnchor.Center,
        root ?? uiRoot,
        true,
        0,
        mod.CreateVector(0.08, 0.08, 0.08),
        0.95,
        mod.UIBgFill.Solid,
        mod.UIDepth.AboveGameUI,
        player
    );

    const panel = safeFind(joinPromptPanelName(pid));
    if (panel) mod.SetUIWidgetDepth(panel, mod.UIDepth.AboveGameUI);

    mod.AddUIText(
        joinPromptTitleName(pid),
        mod.CreateVector(0, -192, 0),
        mod.CreateVector(820, 60, 0),
        mod.UIAnchor.Center,
        panel ?? uiRoot,
        true,
        0,
        mod.CreateVector(0, 0, 0),
        0,
        mod.UIBgFill.None,
        mod.Message(STR_JOIN_PROMPT_TITLE),
        42,
        mod.CreateVector(1, 1, 1),
        1,
        mod.UIAnchor.Center,
        mod.UIDepth.AboveGameUI,
        player
    );

    mod.AddUIText(
        joinPromptBodyName(pid),
        mod.CreateVector(0, 0, 0),
        mod.CreateVector(740, 300, 0), // 900-wide panel with 80px side inset on each side
        mod.UIAnchor.Center,
        panel ?? uiRoot,
        true,
        0,
        mod.CreateVector(0, 0, 0),
        0,
        mod.UIBgFill.None,
        mod.Message(bodyKey),
        22,
        mod.CreateVector(1, 1, 1),
        1,
        mod.UIAnchor.TopLeft,
        mod.UIDepth.AboveGameUI,
        player
    );

    const neverShowBorder = addOutlinedButton(
        joinPromptNeverShowButtonName(pid),
        -200,
        joinPromptButtonOffsetY,
        360,
        70,
        mod.UIAnchor.Center,
        panel ?? uiRoot,
        player
    );

    const neverShowButton = safeFind(joinPromptNeverShowButtonName(pid));
    if (neverShowButton) {
        mod.SetUIWidgetDepth(neverShowButton, mod.UIDepth.AboveGameUI);
        mod.SetUIWidgetVisible(neverShowButton, showNeverShow);
        mod.EnableUIButtonEvent(neverShowButton, mod.UIButtonEvent.ButtonUp, showNeverShow);
    }
    const neverShowBorderWidget = safeFind(joinPromptNeverShowButtonBorderName(pid));
    if (neverShowBorderWidget) {
        mod.SetUIWidgetDepth(neverShowBorderWidget, mod.UIDepth.AboveGameUI);
        mod.SetUIWidgetVisible(neverShowBorderWidget, showNeverShow);
    }

    const neverShowTextParent = neverShowBorder ?? panel ?? uiRoot;
    const neverShowText = addCenteredButtonText(
        joinPromptNeverShowButtonTextName(pid),
        360,
        70,
        mod.Message(STR_JOIN_PROMPT_NEVER_SHOW),
        player,
        neverShowTextParent
    );
    if (neverShowText) {
        mod.SetUITextSize(neverShowText, 24);
        mod.SetUITextColor(neverShowText, mod.CreateVector(1, 1, 1));
        mod.SetUIWidgetDepth(neverShowText, mod.UIDepth.AboveGameUI);
        mod.SetUIWidgetParent(neverShowText, neverShowTextParent);
        mod.SetUIWidgetPosition(
            neverShowText,
            neverShowBorder ? mod.CreateVector(0, 0, 0) : mod.CreateVector(-200, joinPromptButtonOffsetY, 0)
        );
        mod.SetUIWidgetVisible(neverShowText, showNeverShow);
    }

    const dismissBorder = addOutlinedButton(
        joinPromptButtonName(pid),
        200,
        joinPromptButtonOffsetY,
        360,
        70,
        mod.UIAnchor.Center,
        panel ?? uiRoot,
        player
    );

    const dismissButton = safeFind(joinPromptButtonName(pid));
    if (dismissButton) {
        mod.SetUIWidgetDepth(dismissButton, mod.UIDepth.AboveGameUI);
        mod.EnableUIButtonEvent(dismissButton, mod.UIButtonEvent.ButtonUp, true);
    }
    const dismissBorderWidget = safeFind(joinPromptButtonBorderName(pid));
    if (dismissBorderWidget) mod.SetUIWidgetDepth(dismissBorderWidget, mod.UIDepth.AboveGameUI);

    const dismissTextParent = dismissBorder ?? panel ?? uiRoot;
    const dismissText = addCenteredButtonText(
        joinPromptButtonTextName(pid),
        360,
        70,
        mod.Message(dismissLabelKey),
        player,
        dismissTextParent
    );
    if (dismissText) {
        mod.SetUITextSize(dismissText, 24);
        mod.SetUITextColor(dismissText, mod.CreateVector(1, 1, 1));
        mod.SetUIWidgetDepth(dismissText, mod.UIDepth.AboveGameUI);
        mod.SetUIWidgetParent(dismissText, dismissTextParent);
        mod.SetUIWidgetPosition(
            dismissText,
            dismissBorder ? mod.CreateVector(0, 0, 0) : mod.CreateVector(200, joinPromptButtonOffsetY, 0)
        );
    }
}

//#endregion ----------------- Join Prompt - Layout --------------------



//#region -------------------- Join Prompt - Lifecycle + Events --------------------

// Respects round/cleanup locks when re-enabling deploy after dismiss.
function canEnableDeployAfterJoinPrompt(): boolean {
    if (State.round.flow.cleanupActive && !State.round.flow.cleanupAllowDeploy) return false;
    return true;
}

// Dismisses the overlay and restores input/deploy based on current locks.
function dismissJoinPromptForPlayer(player: mod.Player): void {
    const pid = mod.GetObjId(player);

    setUIInputModeForPlayer(player, false);
    mod.EnablePlayerDeploy(player, canEnableDeployAfterJoinPrompt());
    deleteJoinPromptWidget(joinPromptButtonTextName(pid));
    deleteJoinPromptWidget(joinPromptButtonName(pid));
    deleteJoinPromptWidget(joinPromptButtonBorderName(pid));
    deleteJoinPromptWidget(joinPromptNeverShowButtonTextName(pid));
    deleteJoinPromptWidget(joinPromptNeverShowButtonName(pid));
    deleteJoinPromptWidget(joinPromptNeverShowButtonBorderName(pid));
    deleteJoinPromptWidget(joinPromptBodyName(pid));
    deleteJoinPromptWidget(joinPromptTitleName(pid));
    deleteJoinPromptWidget(joinPromptPanelName(pid));
    deleteJoinPromptWidget(joinPromptRootName(pid));
}

// Hard cleanup for disconnects (removes any prompt widgets for that pid).
function clearJoinPromptForPlayerId(playerId: number): void {
    deleteJoinPromptWidget(joinPromptButtonTextName(playerId));
    deleteJoinPromptWidget(joinPromptButtonName(playerId));
    deleteJoinPromptWidget(joinPromptButtonBorderName(playerId));
    deleteJoinPromptWidget(joinPromptNeverShowButtonTextName(playerId));
    deleteJoinPromptWidget(joinPromptNeverShowButtonName(playerId));
    deleteJoinPromptWidget(joinPromptNeverShowButtonBorderName(playerId));
    deleteJoinPromptWidget(joinPromptBodyName(playerId));
    deleteJoinPromptWidget(joinPromptTitleName(playerId));
    deleteJoinPromptWidget(joinPromptPanelName(playerId));
    deleteJoinPromptWidget(joinPromptRootName(playerId));
}

// Button handler: dismisses when the OK button (or its children) is clicked.
function tryHandleJoinPromptButton(
    eventPlayer: mod.Player,
    eventUIWidget: mod.UIWidget,
    eventUIButtonEvent: mod.UIButtonEvent
): boolean {
    if (!SHOW_HELP_TEXT_PROMPT_ON_JOIN) return false;
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return false;
    if (!mod.Equals(eventUIButtonEvent, mod.UIButtonEvent.ButtonUp)) return false;

    const pid = mod.GetObjId(eventPlayer);
    const dismissId = joinPromptButtonName(pid);
    const neverShowId = joinPromptNeverShowButtonName(pid);
    let w: mod.UIWidget = eventUIWidget;
    for (let i = 0; i < 8; i++) {
        const name = mod.GetUIWidgetName(w);
        if (name === dismissId) {
            advanceJoinPromptSequenceOnDismiss(pid);
            dismissJoinPromptForPlayer(eventPlayer);
            return true;
        }
        if (name === neverShowId) {
            setJoinPromptSuppressedForPlayer(pid);
            dismissJoinPromptForPlayer(eventPlayer);
            return true;
        }
        const parent = mod.GetUIWidgetParent(w);
        if (!parent) break;
        w = parent;
    }
    return false;
}

//#endregion ----------------- Join Prompt - Lifecycle + Events --------------------



//#region -------------------- Ready Dialog - Ready State Reset --------------------

// Resets all players to NOT READY. Called when a round ends (including match-end paths) so the next round requires a fresh ready-up cycle.
function resetReadyStateForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const pid = mod.GetObjId(p);
        State.players.readyByPid[pid] = false;
        delete State.players.overTakeoffLimitByPid[pid];
        // Keep the HUD "X / Y PLAYERS READY" line in sync on every ready-state change.
        updatePlayersReadyHudTextForAllPlayers();
    }
    // If any dialogs are open, reflect the reset immediately.
    renderReadyDialogForAllVisibleViewers();
    updatePlayersReadyHudTextForAllPlayers();
}

//#endregion -------------------- Ready Dialog - Ready State Reset --------------------



//#region -------------------- Ready Dialog - Takeoff Limit Gating --------------------

function isPlayerInMainBaseForReady(pid: number): boolean {
    const inBase = (State.players.inMainBaseByPid[pid] !== undefined) ? State.players.inMainBaseByPid[pid] : true;
    if (State.players.overTakeoffLimitByPid[pid]) return false;
    return inBase;
}

async function showOverTakeoffMessageForAllPlayers(offender: mod.Player): Promise<void> {
    const offenderToken = (offender && mod.IsPlayerValid(offender))
        ? offender
        : mod.stringkeys.twl.system.unknownPlayer;
    await showGlobalTitleSubtitleMessageForAllPlayers(
        mod.Message(STR_OVERLINE_TAKEOFF_TITLE, offenderToken),
        mod.Message(STR_OVERLINE_TAKEOFF_SUBTITLE, offenderToken),
        COLOR_NOT_READY_RED,
        COLOR_WARNING_YELLOW
    );
}

function checkTakeoffLimitForAllPlayers(): void {
    if (State.match.isEnded) return;
    if (isRoundLive()) return;

    const floorY = Math.floor(State.round.aircraftCeiling.hudFloorY);
    const limitY = floorY + TAKEOFF_LIMIT_HUD_OFFSET;

    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const pid = safeGetPlayerId(p);
        if (pid === undefined) continue;

        if (!isPlayerDeployed(p)) {
            delete State.players.overTakeoffLimitByPid[pid];
            continue;
        }

        const pos = safeGetSoldierStateVector(p, mod.SoldierStateVector.GetPosition);
        if (!pos) continue;
        const posY = mod.YComponentOf(pos);
        const currentlyOver = !!State.players.overTakeoffLimitByPid[pid];
        const overLimit = posY > limitY;

        if (overLimit && !currentlyOver && isPlayerInMainBaseForReady(pid)) {
            State.players.overTakeoffLimitByPid[pid] = true;
            State.players.readyByPid[pid] = false;
            updatePlayersReadyHudTextForAllPlayers();
            updateHelpTextVisibilityForPid(pid);
            if (State.round.countdown.isRequested) {
                cancelPregameCountdown();
                void showOverTakeoffMessageForAllPlayers(p);
            }
            sendHighlightedWorldLogMessage(
                mod.Message(STR_READYUP_RETURN_TO_BASE_NOT_LIVE, Math.floor(State.round.current)),
                false,
                p,
                STR_READYUP_RETURN_TO_BASE_NOT_LIVE
            );
            renderReadyDialogForAllVisibleViewers();
            continue;
        }

        if (!overLimit && currentlyOver) {
            delete State.players.overTakeoffLimitByPid[pid];
            renderReadyDialogForAllVisibleViewers();
        }
    }
}

//#endregion -------------------- Ready Dialog - Takeoff Limit Gating --------------------


//#region -------------------- Ready Dialog - Active Player Resolution + Roster --------------------

// Returns true when every active player on Team 1/2 is currently READY.

// -----------------------------------------------------------------------------
// Active Player Resolution
// -----------------------------------------------------------------------------
// Single source of truth for who counts as an "active" player across:
//   - roster population (Ready Up UI)
//   - all-ready checks / auto-start gating
//   - any future round gating logic
//
// Definition (low-risk, conservative):
//   - Must be present in mod.AllPlayers() (avoids stale/disconnected pids)
//   - Must be valid (mod.IsPlayerValid)
//   - Must be assigned to TeamID.Team1 or TeamID.Team2 (spectators/neutral excluded)
//
// Note: We intentionally do NOT filter by "deployed" state here. Some APIs expose deployment state,
// but this codebase does not currently have a typed/portable check. Treating undeployed teammates as
// active is safer for readiness gating and avoids edge-case mismatches during team switching.
type ActivePlayers_t = {
    all: mod.Player[];
    team1: mod.Player[];
    team2: mod.Player[];
};

type RosterDisplayEntry = {
    player?: mod.Player;
    nameKey?: number;
};

type RosterDisplay_t = {
    team1: RosterDisplayEntry[];
    team2: RosterDisplayEntry[];
    maxRows: number;
};

/**
 * Active-player definition (single source of truth).
 * Used by: roster population, all-ready checks, round start gating, and the HUD ready-count line.
 * Notes: excludes undeployed/neutral/stale players by reading current engine team state each call; do not cache long-term.
 */
function getActivePlayers(): ActivePlayers_t {
    const all: mod.Player[] = [];
    const team1: mod.Player[] = [];
    const team2: mod.Player[] = [];
    const pidByPlayer = new Map<mod.Player, number>();

    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        let pid: number;
        try {
            pid = mod.GetObjId(p);
        } catch {
            continue;
        }
        const teamNum = getTeamNumber(mod.GetTeam(p));
        // Only Team 1/2 are considered active for rosters/ready gating.
        if (teamNum !== TeamID.Team1 && teamNum !== TeamID.Team2) continue;

        pidByPlayer.set(p, pid);
        all.push(p);
        if (teamNum === TeamID.Team1) team1.push(p);
        else team2.push(p);
    }

    // Stable UI ordering: sort by pid (object id).
    // This prevents rows from shuffling across refreshes.
    const byPidCached = (a: mod.Player, b: mod.Player) => (pidByPlayer.get(a) ?? 0) - (pidByPlayer.get(b) ?? 0);
    all.sort(byPidCached);
    team1.sort(byPidCached);
    team2.sort(byPidCached);

    return { all, team1, team2 };
}

function buildRosterDisplayEntries(players: mod.Player[], debugCount: number): RosterDisplayEntry[] {
    const entries: RosterDisplayEntry[] = [];
    for (const p of players) entries.push({ player: p });

    const extraCount = Math.max(0, Math.floor(debugCount));
    for (let i = 0; i < extraCount; i++) {
        entries.push({ nameKey: DEBUG_TEST_PLACEHOLDER_NAME_KEY });
    }
    return entries;
}

function getRosterDisplayEntries(): RosterDisplay_t {
    const active = getActivePlayers();
    const team1 = buildRosterDisplayEntries(active.team1, DEBUG_TEST_NAMES_TEAM_1);
    const team2 = buildRosterDisplayEntries(active.team2, DEBUG_TEST_NAMES_TEAM_2);
    return { team1, team2, maxRows: Math.max(team1.length, team2.length) };
}

function getRosterEntryNameMessage(entry: RosterDisplayEntry | undefined): mod.Message {
    if (!entry) return mod.Message(mod.stringkeys.twl.system.genericCounter, "");
    if (entry.player) return mod.Message(mod.stringkeys.twl.readyDialog.playerNameFormat, entry.player);
    if (entry.nameKey) return mod.Message(entry.nameKey);
    return mod.Message(mod.stringkeys.twl.system.genericCounter, "");
}

function areAllActivePlayersReady(): boolean {
    const active = getActivePlayers();
    const activeCount = active.all.length;
    const requiredTotalPlayers = getAutoStartMinPlayerCounts().total;
    if (activeCount < requiredTotalPlayers) {
        if (activeCount !== 0) return false;

        // Fallback: if no Team 1/2 players are assigned yet (team 0 pre-deploy),
        // allow the ready check to use all valid players.
        const players = mod.AllPlayers();
        const count = mod.CountOf(players);
        let validCount = 0;
        for (let i = 0; i < count; i++) {
            const p = mod.ValueInArray(players, i) as mod.Player;
            if (!p || !mod.IsPlayerValid(p)) continue;
            const pid = safeGetPlayerId(p);
            if (pid === undefined) continue;
            if (!State.players.readyByPid[pid]) return false;
            validCount++;
        }
        return validCount >= requiredTotalPlayers;
    }

    for (const p of active.all) {
        const pid = safeGetPlayerId(p);
        if (pid === undefined) continue;
        if (!State.players.readyByPid[pid]) return false;
    }
    return true;
}

//#endregion -------------------- Ready Dialog - Active Player Resolution + Roster --------------------



//#region -------------------- Ready Dialog - Pregame Countdown UI --------------------

// Implements a synchronized pre-round 10-1-GO! countdown that starts the round on GO.
interface CountdownWidgetCacheEntry {
    rootName: string;
    widget?: mod.UIWidget;
}

function ensureCountdownUIAndGetWidget(player: mod.Player): mod.UIWidget | undefined {
    if (!player || !mod.IsPlayerValid(player)) return undefined;
    const pid = mod.GetObjId(player);
    const rootName = "PregameCountdownText_" + pid;

    const cached = State.hudCache.countdownWidgetCache[pid];
    if (cached) {
        if (cached.widget) return cached.widget;

        const found = safeFind(cached.rootName);
        if (found) {
            cached.widget = found;
            return found;
        }
    }

    modlib.ParseUI({
        name: rootName,
        type: "Text",
        playerId: player,
        position: [0, 0],
        size: [320, 140],
        anchor: mod.UIAnchor.Center,
        visible: false,
        padding: 0,
        bgColor: [0, 0, 0],
        bgAlpha: 0,
        bgFill: mod.UIBgFill.Solid,
        textLabel: mod.Message(mod.stringkeys.twl.countdown.format, PREGAME_COUNTDOWN_START_NUMBER),
        textColor: [1, 1, 1],
        textAlpha: PREGAME_ALERT_TEXT_ALPHA,
        textSize: PREGAME_COUNTDOWN_SIZE_DIGIT_START,
        textAnchor: mod.UIAnchor.Center,
    });

    const widget = safeFind(rootName);
    State.hudCache.countdownWidgetCache[pid] = { rootName, widget };
    return widget;
}

function setPregameCountdownVisualForAllPlayers(
    labelKey: number,
    labelValue: number | undefined,
    color: mod.Vector,
    size: number,
    visible: boolean
): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const w = ensureCountdownUIAndGetWidget(p);
        if (!w) continue;

        mod.SetUIWidgetVisible(w, visible);
        if (visible) {
            const message = (labelValue !== undefined)
                ? mod.Message(labelKey, labelValue)
                : mod.Message(labelKey);
            mod.SetUITextLabel(w, message);
            mod.SetUITextColor(w, color);
            mod.SetUITextSize(w, size);
        }
    }
}

function setPregameCountdownSizeForAllPlayers(size: number): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const w = ensureCountdownUIAndGetWidget(p);
        if (!w) continue;
        mod.SetUITextSize(w, size);
    }
}

function hidePregameCountdownForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const w = ensureCountdownUIAndGetWidget(p);
        if (!w) continue;
        mod.SetUIWidgetVisible(w, false);
    }
}

//#endregion -------------------- Ready Dialog - Pregame Countdown UI --------------------



//#region -------------------- Ready Dialog - OverLine UI Widgets + Big Messages --------------------

function ensureOverLineTitleShadowUIAndGetWidget(player: mod.Player): mod.UIWidget | undefined {
    if (!player || !mod.IsPlayerValid(player)) return undefined;
    const pid = mod.GetObjId(player);
    const rootName = BIG_TITLE_SHADOW_WIDGET_ID + pid;

    const cached = State.hudCache.overLineTitleShadowWidgetCache[pid];
    if (cached) {
        if (cached.widget) return cached.widget;

        const found = safeFind(cached.rootName);
        if (found) {
            cached.widget = found;
            return found;
        }
    }

    modlib.ParseUI({
        name: rootName,
        type: "Text",
        playerId: player,
        position: [HUD_TEXT_SHADOW_OFFSET_X, BIG_TITLE_OFFSET_Y + HUD_TEXT_SHADOW_OFFSET_Y],
        size: [BIG_TITLE_BG_WIDTH, BIG_TITLE_BG_HEIGHT],
        anchor: mod.UIAnchor.TopCenter,
        visible: false,
        padding: 0,
        bgAlpha: 0,
        bgFill: mod.UIBgFill.None,
        textLabel: mod.Message(mod.stringkeys.twl.overLine.title, player),
        textColor: [0, 0, 0],
        textAlpha: PREGAME_ALERT_TEXT_ALPHA,
        textSize: BIG_TITLE_SIZE,
        textAnchor: mod.UIAnchor.Center,
    });

    const widget = safeFind(rootName);
    State.hudCache.overLineTitleShadowWidgetCache[pid] = { rootName, widget };
    return widget;
}

function ensureOverLineSubtitleShadowUIAndGetWidget(player: mod.Player): mod.UIWidget | undefined {
    if (!player || !mod.IsPlayerValid(player)) return undefined;
    const pid = mod.GetObjId(player);
    const rootName = BIG_SUBTITLE_SHADOW_WIDGET_ID + pid;

    const cached = State.hudCache.overLineSubtitleShadowWidgetCache[pid];
    if (cached) {
        if (cached.widget) return cached.widget;

        const found = safeFind(cached.rootName);
        if (found) {
            cached.widget = found;
            return found;
        }
    }

    modlib.ParseUI({
        name: rootName,
        type: "Text",
        playerId: player,
        position: [HUD_TEXT_SHADOW_OFFSET_X, BIG_SUBTITLE_OFFSET_Y + HUD_TEXT_SHADOW_OFFSET_Y],
        size: [BIG_SUBTITLE_BG_WIDTH, BIG_SUBTITLE_BG_HEIGHT],
        anchor: mod.UIAnchor.TopCenter,
        visible: false,
        padding: 0,
        bgAlpha: 0,
        bgFill: mod.UIBgFill.None,
        textLabel: mod.Message(mod.stringkeys.twl.overLine.subtitle, player),
        textColor: [0, 0, 0],
        textAlpha: PREGAME_ALERT_TEXT_ALPHA,
        textSize: BIG_SUBTITLE_SIZE,
        textAnchor: mod.UIAnchor.Center,
    });

    const widget = safeFind(rootName);
    State.hudCache.overLineSubtitleShadowWidgetCache[pid] = { rootName, widget };
    return widget;
}

function ensureOverLineTitleUIAndGetWidget(player: mod.Player): mod.UIWidget | undefined {
    if (!player || !mod.IsPlayerValid(player)) return undefined;
    const pid = mod.GetObjId(player);
    const rootName = BIG_TITLE_WIDGET_ID + pid;

    const cached = State.hudCache.overLineTitleWidgetCache[pid];
    if (cached) {
        if (cached.widget) return cached.widget;

        const found = safeFind(cached.rootName);
        if (found) {
            cached.widget = found;
            return found;
        }
    }

    modlib.ParseUI({
        name: rootName,
        type: "Text",
        playerId: player,
        position: [0, BIG_TITLE_OFFSET_Y],
        size: [BIG_TITLE_BG_WIDTH, BIG_TITLE_BG_HEIGHT],
        anchor: mod.UIAnchor.TopCenter,
        visible: false,
        padding: 0,
        bgColor: COLOR_GRAY_DARK,
        bgAlpha: 0,
        bgFill: mod.UIBgFill.Blur,
        textLabel: mod.Message(mod.stringkeys.twl.overLine.title, player),
        textColor: [1, 0, 0],
        textAlpha: PREGAME_ALERT_TEXT_ALPHA,
        textSize: BIG_TITLE_SIZE,
        textAnchor: mod.UIAnchor.Center,
    });

    const widget = safeFind(rootName);
    State.hudCache.overLineTitleWidgetCache[pid] = { rootName, widget };
    return widget;
}

function ensureOverLineSubtitleUIAndGetWidget(player: mod.Player): mod.UIWidget | undefined {
    if (!player || !mod.IsPlayerValid(player)) return undefined;
    const pid = mod.GetObjId(player);
    const rootName = BIG_SUBTITLE_WIDGET_ID + pid;

    const cached = State.hudCache.overLineSubtitleWidgetCache[pid];
    if (cached) {
        if (cached.widget) return cached.widget;

        const found = safeFind(cached.rootName);
        if (found) {
            cached.widget = found;
            return found;
        }
    }

    modlib.ParseUI({
        name: rootName,
        type: "Text",
        playerId: player,
        position: [0, BIG_SUBTITLE_OFFSET_Y],
        size: [BIG_SUBTITLE_BG_WIDTH, BIG_SUBTITLE_BG_HEIGHT],
        anchor: mod.UIAnchor.TopCenter,
        visible: false,
        padding: 0,
        bgColor: COLOR_GRAY_DARK,
        bgAlpha: 0,
        bgFill: mod.UIBgFill.Blur,
        textLabel: mod.Message(mod.stringkeys.twl.overLine.subtitle, player),
        textColor: [1, 1, 0],
        textAlpha: PREGAME_ALERT_TEXT_ALPHA,
        textSize: BIG_SUBTITLE_SIZE,
        textAnchor: mod.UIAnchor.Center,
    });

    const widget = safeFind(rootName);
    State.hudCache.overLineSubtitleWidgetCache[pid] = { rootName, widget };
    return widget;
}

function cancelPregameCountdown(): void {
    if (!State.round.countdown.isActive) return;
    State.round.countdown.token++;
    State.round.countdown.isActive = false;
    hidePregameCountdownForAllPlayers();
}

function hideBigTitleSubtitleMessageForPlayer(pid: number): void {
    const titleShadow = safeFind(BIG_TITLE_SHADOW_WIDGET_ID + pid);
    if (titleShadow) mod.SetUIWidgetVisible(titleShadow, false);

    const title = safeFind(BIG_TITLE_WIDGET_ID + pid);
    if (title) mod.SetUIWidgetVisible(title, false);

    const subtitleShadow = safeFind(BIG_SUBTITLE_SHADOW_WIDGET_ID + pid);
    if (subtitleShadow) mod.SetUIWidgetVisible(subtitleShadow, false);

    const subtitle = safeFind(BIG_SUBTITLE_WIDGET_ID + pid);
    if (subtitle) mod.SetUIWidgetVisible(subtitle, false);
}

async function showOverLineMessageForAllPlayers(offender: mod.Player): Promise<void> {
    const offenderToken = (offender && mod.IsPlayerValid(offender))
        ? offender
        : mod.stringkeys.twl.system.unknownPlayer;
    await showGlobalTitleSubtitleMessageForAllPlayers(
        mod.Message(mod.stringkeys.twl.overLine.title, offenderToken),
        mod.Message(mod.stringkeys.twl.overLine.subtitle, offenderToken),
        COLOR_NOT_READY_RED,
        COLOR_WARNING_YELLOW
    );
}

type BigMessageBuilder = (remainingSeconds: number) => mod.Message | undefined;
type BigMessagePlayerFilter = (player: mod.Player) => boolean;

function renderBigTitleSubtitleMessageForAllPlayers(
    title: mod.Message | undefined,
    subtitle: mod.Message | undefined,
    titleColor: mod.Vector,
    subtitleColor: mod.Vector,
    layout: GlobalMessageLayout,
    playerFilter?: BigMessagePlayerFilter
): void {
    const titleBgAlpha = layout.useBackground ? BIG_MESSAGE_BG_ALPHA : 0;
    const subtitleBgAlpha = (layout.subtitleUseBackground ?? layout.useBackground) ? BIG_MESSAGE_BG_ALPHA : 0;
    const titleBgHeight = layout.titleBgHeight ?? BIG_TITLE_BG_HEIGHT;
    const titleOffsetY = layout.titleOffsetY + (BIG_TITLE_BG_HEIGHT - titleBgHeight) / 2;

    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        if (playerFilter && !playerFilter(p)) {
            hideBigTitleSubtitleMessageForPlayer(getObjId(p));
            continue;
        }

        const titleShadowWidget = ensureOverLineTitleShadowUIAndGetWidget(p);
        if (titleShadowWidget) {
            if (title !== undefined) {
                mod.SetUITextLabel(titleShadowWidget, title);
                mod.SetUITextColor(titleShadowWidget, mod.CreateVector(0, 0, 0));
                mod.SetUITextSize(titleShadowWidget, layout.titleSize);
                mod.SetUIWidgetSize(titleShadowWidget, mod.CreateVector(BIG_TITLE_BG_WIDTH, titleBgHeight, 0));
                mod.SetUIWidgetPosition(
                    titleShadowWidget,
                    mod.CreateVector(HUD_TEXT_SHADOW_OFFSET_X, titleOffsetY + HUD_TEXT_SHADOW_OFFSET_Y, 0)
                );
                mod.SetUIWidgetVisible(titleShadowWidget, true);
            } else {
                mod.SetUIWidgetVisible(titleShadowWidget, false);
            }
        }

        const titleWidget = ensureOverLineTitleUIAndGetWidget(p);
        if (titleWidget) {
            if (title !== undefined) {
                mod.SetUITextLabel(titleWidget, title);
                mod.SetUITextColor(titleWidget, titleColor);
                mod.SetUITextSize(titleWidget, layout.titleSize);
                mod.SetUIWidgetSize(titleWidget, mod.CreateVector(BIG_TITLE_BG_WIDTH, titleBgHeight, 0));
                mod.SetUIWidgetPosition(titleWidget, mod.CreateVector(0, titleOffsetY, 0));
                mod.SetUIWidgetBgAlpha(titleWidget, titleBgAlpha);
                mod.SetUIWidgetVisible(titleWidget, true);
            } else {
                mod.SetUIWidgetVisible(titleWidget, false);
            }
        }

        const subtitleShadowWidget = ensureOverLineSubtitleShadowUIAndGetWidget(p);
        if (subtitleShadowWidget) {
            if (subtitle !== undefined) {
                mod.SetUITextLabel(subtitleShadowWidget, subtitle);
                mod.SetUITextColor(subtitleShadowWidget, mod.CreateVector(0, 0, 0));
                mod.SetUITextSize(subtitleShadowWidget, layout.subtitleSize);
                mod.SetUIWidgetPosition(
                    subtitleShadowWidget,
                    mod.CreateVector(HUD_TEXT_SHADOW_OFFSET_X, layout.subtitleOffsetY + HUD_TEXT_SHADOW_OFFSET_Y, 0)
                );
                mod.SetUIWidgetVisible(subtitleShadowWidget, true);
            } else {
                mod.SetUIWidgetVisible(subtitleShadowWidget, false);
            }
        }

        const subtitleWidget = ensureOverLineSubtitleUIAndGetWidget(p);
        if (subtitleWidget) {
            if (subtitle !== undefined) {
                mod.SetUITextLabel(subtitleWidget, subtitle);
                mod.SetUITextColor(subtitleWidget, subtitleColor);
                mod.SetUITextSize(subtitleWidget, layout.subtitleSize);
                mod.SetUIWidgetPosition(subtitleWidget, mod.CreateVector(0, layout.subtitleOffsetY, 0));
                mod.SetUIWidgetBgAlpha(subtitleWidget, subtitleBgAlpha);
                mod.SetUIWidgetVisible(subtitleWidget, true);
            } else {
                mod.SetUIWidgetVisible(subtitleWidget, false);
            }
        }
    }
}

function hideBigTitleSubtitleMessageForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        hideBigTitleSubtitleMessageForPlayer(mod.GetObjId(p));
    }
}

async function showGlobalTitleSubtitleMessageForAllPlayers(
    title: mod.Message | undefined,
    subtitle: mod.Message | undefined,
    titleColor: mod.Vector,
    subtitleColor: mod.Vector,
    durationSeconds: number = BIG_MESSAGE_DURATION_SECONDS,
    layout: GlobalMessageLayout = BIG_MESSAGE_LAYOUT,
    playerFilter?: BigMessagePlayerFilter
): Promise<void> {
    State.round.countdown.overLineMessageToken = (State.round.countdown.overLineMessageToken + 1) % 1000000000;
    const expectedToken = State.round.countdown.overLineMessageToken;

    renderBigTitleSubtitleMessageForAllPlayers(title, subtitle, titleColor, subtitleColor, layout, playerFilter);

    await mod.Wait(durationSeconds);
    if (expectedToken !== State.round.countdown.overLineMessageToken) return;
    hideBigTitleSubtitleMessageForAllPlayers();
}

async function showDynamicGlobalTitleSubtitleMessageForAllPlayers(
    titleBuilder: BigMessageBuilder | undefined,
    subtitleBuilder: BigMessageBuilder | undefined,
    titleColor: mod.Vector,
    subtitleColor: mod.Vector,
    durationSeconds: number = BIG_MESSAGE_DURATION_SECONDS,
    refreshIntervalSeconds: number = 1,
    layout: GlobalMessageLayout = BIG_MESSAGE_LAYOUT,
    playerFilter?: BigMessagePlayerFilter
): Promise<void> {
    State.round.countdown.overLineMessageToken = (State.round.countdown.overLineMessageToken + 1) % 1000000000;
    const expectedToken = State.round.countdown.overLineMessageToken;
    const endAtSeconds = mod.GetMatchTimeElapsed() + Math.max(0, durationSeconds);
    let lastRemainingSeconds = -1;

    while (true) {
        if (expectedToken !== State.round.countdown.overLineMessageToken) return;

        const remainingSeconds = Math.floor(getRemainingSeconds());
        if (remainingSeconds !== lastRemainingSeconds) {
            lastRemainingSeconds = remainingSeconds;
            const title = titleBuilder ? titleBuilder(remainingSeconds) : undefined;
            const subtitle = subtitleBuilder ? subtitleBuilder(remainingSeconds) : undefined;
            if (title || subtitle) {
                renderBigTitleSubtitleMessageForAllPlayers(title, subtitle, titleColor, subtitleColor, layout, playerFilter);
            }
        }

        const remainingDuration = endAtSeconds - mod.GetMatchTimeElapsed();
        if (remainingDuration <= 0) break;
        await mod.Wait(Math.min(refreshIntervalSeconds, remainingDuration));
    }

    if (expectedToken !== State.round.countdown.overLineMessageToken) return;
    hideBigTitleSubtitleMessageForAllPlayers();
}

async function showRoundStartMessageForAllPlayers(durationSeconds?: number): Promise<void> {
    await showGlobalTitleSubtitleMessageForAllPlayers(
        mod.Message(STR_ROUND_START_TITLE),
        mod.Message(STR_ROUND_START_SUBTITLE),
        COLOR_WHITE,
        COLOR_WHITE,
        durationSeconds
    );
}

//#endregion -------------------- Ready Dialog - OverLine UI Widgets + Big Messages --------------------



//#region -------------------- Ready Dialog - Pregame Countdown Flow --------------------

function startPregameCountdown(triggerPlayer?: mod.Player, force?: boolean): void {
    if (State.round.countdown.isActive) return;
    if (State.match.isEnded || isRoundLive()) return;
    if (!force && !areAllActivePlayersReady()) return;

    closeReadyDialogForAllPlayers();
    State.round.countdown.isActive = true;
    State.round.countdown.isRequested = true;
    State.round.countdown.token++;
    const expectedToken = State.round.countdown.token;

    void runPregameCountdown(expectedToken, triggerPlayer, force === true);
}

function isPregameCountdownStillValid(expectedToken: number, force?: boolean, allowRoundActive?: boolean): boolean {
    if (expectedToken !== State.round.countdown.token) return false;
    if (State.match.isEnded) return false;
    if (!allowRoundActive && isRoundLive()) return false;
    if (!force && !areAllActivePlayersReady()) return false;
    return true;
}

function getPregameCountdownColor(value: number): mod.Vector {
    return value === 1 ? mod.CreateVector(1, 1, 0) : mod.CreateVector(1, 0, 0);
}

async function animatePregameCountdownSize(
    expectedToken: number,
    force: boolean,
    startSize: number,
    endSize: number,
    allowRoundActive?: boolean
): Promise<boolean> {
    const stepSeconds = PREGAME_COUNTDOWN_STEP_SECONDS / PREGAME_COUNTDOWN_ANIMATION_STEPS;
    for (let i = 1; i <= PREGAME_COUNTDOWN_ANIMATION_STEPS; i++) {
        await mod.Wait(stepSeconds);
        if (!isPregameCountdownStillValid(expectedToken, force, allowRoundActive)) return false;
        const t = i / PREGAME_COUNTDOWN_ANIMATION_STEPS;
        const size = Math.max(1, Math.floor(startSize + (endSize - startSize) * t));
        setPregameCountdownSizeForAllPlayers(size);
    }
    return true;
}

async function runPregameCountdown(expectedToken: number, triggerPlayer?: mod.Player, force?: boolean): Promise<void> {
    await mod.Wait(PREGAME_COUNTDOWN_INITIAL_DELAY_SECONDS);

    if (!isPregameCountdownStillValid(expectedToken, force)) {
        State.round.countdown.isActive = false;
        hidePregameCountdownForAllPlayers();
        return;
    }

    for (let value = PREGAME_COUNTDOWN_START_NUMBER; value >= 1; value--) {
        if (!isPregameCountdownStillValid(expectedToken, force)) {
            State.round.countdown.isActive = false;
            hidePregameCountdownForAllPlayers();
            return;
        }

        if (value === 4) {
            // Start the round-start messaging so it ends with the GO! hide.
            const remainingSeconds = ((value + 1) * PREGAME_COUNTDOWN_STEP_SECONDS) + PREGAME_COUNTDOWN_GO_HOLD_SECONDS;
            void showRoundStartMessageForAllPlayers(remainingSeconds);
        }

        setPregameCountdownVisualForAllPlayers(
            mod.stringkeys.twl.countdown.format,
            value,
            getPregameCountdownColor(value),
            PREGAME_COUNTDOWN_SIZE_DIGIT_START,
            true
        );

        const ok = await animatePregameCountdownSize(
            expectedToken,
            force === true,
            PREGAME_COUNTDOWN_SIZE_DIGIT_START,
            PREGAME_COUNTDOWN_SIZE_DIGIT_END
        );
        if (!ok) {
            State.round.countdown.isActive = false;
            hidePregameCountdownForAllPlayers();
            return;
        }
    }

    if (!isPregameCountdownStillValid(expectedToken, force)) {
        State.round.countdown.isActive = false;
        hidePregameCountdownForAllPlayers();
        return;
    }

    setPregameCountdownVisualForAllPlayers(
        mod.stringkeys.twl.countdown.go,
        undefined,
        mod.CreateVector(0, 1, 0),
        PREGAME_COUNTDOWN_SIZE_GO_START,
        true
    );
    startRound(triggerPlayer);

    const ok = await animatePregameCountdownSize(
        expectedToken,
        force === true,
        PREGAME_COUNTDOWN_SIZE_GO_START,
        PREGAME_COUNTDOWN_SIZE_GO_END,
        true
    );
    if (!ok || expectedToken !== State.round.countdown.token) {
        // If the animation aborted, hide immediately to avoid a stuck GO.
        if (expectedToken === State.round.countdown.token) {
            hidePregameCountdownForAllPlayers();
            State.round.countdown.isActive = false;
        }
        return;
    }

    // Keep GO visible for a short hold to finish the visual beat (unpredictable repro issues).
    if (State.match.isEnded) {
        hidePregameCountdownForAllPlayers();
        State.round.countdown.isActive = false;
        return;
    }

    await mod.Wait(PREGAME_COUNTDOWN_GO_HOLD_SECONDS);
    if (expectedToken !== State.round.countdown.token) return;

    hidePregameCountdownForAllPlayers();
    State.round.countdown.isActive = false;

    await mod.Wait(1);
}

//#endregion -------------------- Ready Dialog - Pregame Countdown Flow --------------------



//#region -------------------- Ready Dialog - Auto-Start --------------------

// Starts the round as soon as all active players are READY.
// Notes:
// - Only triggers when round is NOT active and match is NOT ended.
// - Uses the existing startRound() flow; we do not bypass or reimplement round init logic.
function tryAutoStartRoundIfAllReady(triggerPlayer?: mod.Player): void {
    if (State.match.isEnded || isRoundLive()) return;
    if (!areAllActivePlayersReady()) return;
    // All players ready: start the round using the existing function.
    startPregameCountdown(triggerPlayer); //old: startRound(triggerPlayer);
}

//#endregion -------------------- Ready Dialog - Auto-Start --------------------



//#region -------------------- Ready Dialog - Swap Teams Button (single toggle) --------------------

// Swaps the given player between Team 1 and Team 2. This reuses the existing team-assignment APIs,
// but exposes them as a single toggle button rather than separate Team 1 / Team 2 buttons.
function swapPlayerTeam(eventPlayer: mod.Player): void {
    // Swap Teams button:: single-button team toggle (Team 1 <-> Team 2).
    // - Apply the team assignment change
    // - Undeploy (forces redeploy) so the player actually respawns on the new team
    // - Close the dialog and broadcast the team-switch message
    // We achieve that by reusing the retained processTeamSwitch() pathway.
    const pid = mod.GetObjId(eventPlayer);
    // Swapping teams must always force the player back to NOT READY.
    // This prevents a player from carrying READY status across team assignment changes.
    State.players.readyByPid[pid] = false;
    // Keep the HUD "X / Y PLAYERS READY" line in sync on every ready-state change.
    updatePlayersReadyHudTextForAllPlayers();
    updateHelpTextVisibilityForPid(pid);

    processTeamSwitch(eventPlayer);

    // If other viewers have the ready dialog open, refresh their rosters so this player moves columns immediately.
    renderReadyDialogForAllVisibleViewers();
}

//#endregion ----------------- Ready Dialog - Swap Teams Button (single toggle) --------------------
