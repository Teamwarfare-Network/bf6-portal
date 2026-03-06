// @ts-nocheck
// Module: ready-dialog/dialog-build -- ready dialog root/container assembly and section orchestration

//#region -------------------- UI - Ready Up Dialog (construction) --------------------

// Legacy function name is preserved to avoid call-site churn.
// Function name intentionally preserved to avoid call-site churn.
function createReadyDialogUI(eventPlayer: mod.Player) {
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
    const existingBase = safeFind(UI_READY_DIALOG_CONTAINER_BASE_ID + playerId);
    if (existingBase) {
        mod.SetUIWidgetVisible(existingBase, true);
        const existingBorderTop = safeFind(UI_READY_DIALOG_BORDER_TOP_ID + playerId);
        if (existingBorderTop) mod.SetUIWidgetVisible(existingBorderTop, true);
        const existingBorderBottom = safeFind(UI_READY_DIALOG_BORDER_BOTTOM_ID + playerId);
        if (existingBorderBottom) mod.SetUIWidgetVisible(existingBorderBottom, true);
        const existingBorderLeft = safeFind(UI_READY_DIALOG_BORDER_LEFT_ID + playerId);
        if (existingBorderLeft) mod.SetUIWidgetVisible(existingBorderLeft, true);
        const existingBorderRight = safeFind(UI_READY_DIALOG_BORDER_RIGHT_ID + playerId);
        if (existingBorderRight) mod.SetUIWidgetVisible(existingBorderRight, true);
        const existingDebug = safeFind(UI_READY_DIALOG_DEBUG_TIMELIMIT_ID + playerId);
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

    const CONTAINER_BASE_ID = UI_READY_DIALOG_CONTAINER_BASE_ID + playerId;
    const BORDER_TOP_ID = UI_READY_DIALOG_BORDER_TOP_ID + playerId;
    const BORDER_BOTTOM_ID = UI_READY_DIALOG_BORDER_BOTTOM_ID + playerId;
    const BORDER_LEFT_ID = UI_READY_DIALOG_BORDER_LEFT_ID + playerId;
    const BORDER_RIGHT_ID = UI_READY_DIALOG_BORDER_RIGHT_ID + playerId;
    const CONTAINER_BORDER_PADDING = 1;
    const CONTAINER_BORDER_THICKNESS = 2;
    const CONTAINER_BORDER_OVERLAP = 2;
    const CONTAINER_WIDTH = 1300;
    const CONTAINER_HEIGHT = 700;

    const BUTTON_CANCEL_ID = UI_READY_DIALOG_BUTTON_CANCEL_ID + playerId;
    const BUTTON_CANCEL_LABEL_ID = UI_READY_DIALOG_BUTTON_CANCEL_LABEL_ID + playerId;

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

    buildReadyDialogHeaderAndMapSection(eventPlayer, CONTAINER_BASE, playerId);

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
    buildReadyDialogModeConfigSection(
        eventPlayer,
        CONTAINER_BASE,
        playerId,
        bestOfY,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        bestOfLabelSizeY,
        leftSectionLeftButtonX,
        leftSectionRightButtonX,
        leftSectionValueX,
        leftSectionLabelX,
        leftSectionLabelWidth,
        leftSectionValueWidth,
        leftSectionRowGap,
        confirmButtonX,
        confirmButtonWidth,
        resetButtonX,
        resetButtonWidth
    );

    buildReadyDialogMatchupAndPlayersSection(
        eventPlayer,
        CONTAINER_BASE,
        playerId,
        bestOfY,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        bestOfLabelSizeX,
        bestOfLabelSizeY
    );

    buildReadyDialogRosterSection(eventPlayer, CONTAINER_BASE, playerId);

    //#endregion ----------------- Ready Dialog (Roster UI) -  (header + team rosters) --------------------

    

    buildReadyDialogBottomButtonsSection(
        eventPlayer,
        CONTAINER_BASE,
        playerId,
        BUTTON_CANCEL_ID,
        BUTTON_CANCEL_LABEL_ID
    );
}

//#endregion ----------------- Dialog Buttons (Left Side) - Cancel --------------------
