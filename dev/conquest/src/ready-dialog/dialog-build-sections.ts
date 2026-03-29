// @ts-nocheck
// Module: ready-dialog/dialog-build-sections -- extracted Ready Dialog layout sections

function buildReadyDialogHeaderAndMapSection(
    eventPlayer: mod.Player,
    containerBase: mod.UIWidget,
    playerId: number
): void {
    // Header rows (string-backed for easy iteration).
    const readyHeaderId = UI_READY_DIALOG_HEADER_ID + playerId;
    const readyHeader2Id = UI_READY_DIALOG_HEADER2_ID + playerId;
    const readyHeader3Id = UI_READY_DIALOG_HEADER3_ID + playerId;
    const readyHeader4Id = UI_READY_DIALOG_HEADER4_ID + playerId;
    const readyHeader5Id = UI_READY_DIALOG_HEADER5_ID + playerId;
    const readyHeader6Id = UI_READY_DIALOG_HEADER6_ID + playerId;

    addReadyDialogText(
        readyHeaderId,
        -11,
        -5,
        900,
        22,
        mod.UIAnchor.TopLeft,
        mod.UIAnchor.TopLeft,
        mod.Message(mod.stringkeys.twl.readyDialog.header),
        eventPlayer,
        containerBase,
        20,
        false,
        READY_DIALOG_LABEL_TEXT_COLOR
    );

    addReadyDialogText(
        readyHeader2Id,
        -11,
        19,
        900,
        20,
        mod.UIAnchor.TopLeft,
        mod.UIAnchor.TopLeft,
        mod.Message(mod.stringkeys.twl.readyDialog.header2),
        eventPlayer,
        containerBase,
        16,
        false,
        READY_DIALOG_LABEL_TEXT_COLOR
    );

    addReadyDialogText(
        readyHeader3Id,
        -11,
        39,
        900,
        20,
        mod.UIAnchor.TopLeft,
        mod.UIAnchor.TopLeft,
        mod.Message(mod.stringkeys.twl.readyDialog.header3),
        eventPlayer,
        containerBase,
        16,
        false,
        READY_DIALOG_LABEL_TEXT_COLOR
    );

    addReadyDialogText(
        readyHeader4Id,
        -11,
        59,
        900,
        20,
        mod.UIAnchor.TopLeft,
        mod.UIAnchor.TopLeft,
        mod.Message(mod.stringkeys.twl.readyDialog.header4, Math.floor(VEHICLE_SPAWNER_KEEP_ALIVE_ABANDON_RADIUS)),
        eventPlayer,
        containerBase,
        16,
        false,
        READY_DIALOG_LABEL_TEXT_COLOR
    );

    addReadyDialogText(
        readyHeader5Id,
        -11,
        79,
        900,
        20,
        mod.UIAnchor.TopLeft,
        mod.UIAnchor.TopLeft,
        mod.Message(mod.stringkeys.twl.readyDialog.header5),
        eventPlayer,
        containerBase,
        16,
        false,
        READY_DIALOG_LABEL_TEXT_COLOR
    );

    addReadyDialogText(
        readyHeader6Id,
        -11,
        99,
        900,
        20,
        mod.UIAnchor.TopLeft,
        mod.UIAnchor.TopLeft,
        mod.Message(mod.stringkeys.twl.readyDialog.header6),
        eventPlayer,
        containerBase,
        16,
        false,
        READY_DIALOG_LABEL_TEXT_COLOR
    );

    const readyMapLabelId = UI_READY_DIALOG_MAP_LABEL_ID + playerId;
    const readyMapValueId = UI_READY_DIALOG_MAP_VALUE_ID + playerId;
    const mapLabelX = ADMIN_PANEL_OFFSET_X + ADMIN_PANEL_TOGGLE_WIDTH + 70;
    const mapValueX = ADMIN_PANEL_OFFSET_X + ADMIN_PANEL_TOGGLE_WIDTH - 63;
    const mapLabelY = ADMIN_PANEL_OFFSET_Y;
    const mapLabelSizeX = 60;
    const mapValueSizeX = 170;

    addReadyDialogText(
        readyMapLabelId,
        mapLabelX,
        mapLabelY,
        mapLabelSizeX,
        20,
        mod.UIAnchor.TopRight,
        mod.UIAnchor.CenterLeft,
        mod.Message(mod.stringkeys.twl.readyDialog.mapLabel),
        eventPlayer,
        mod.GetUIRoot(),
        12,
        false,
        READY_DIALOG_LABEL_TEXT_COLOR
    );

    addReadyDialogText(
        readyMapValueId,
        mapValueX,
        mapLabelY,
        mapValueSizeX,
        20,
        mod.UIAnchor.TopRight,
        mod.UIAnchor.CenterLeft,
        mod.Message(getMapNameKey(ACTIVE_MAP_KEY)),
        eventPlayer,
        mod.GetUIRoot(),
        12,
        false,
        READY_DIALOG_LABEL_TEXT_COLOR
    );
    updateReadyDialogMapLabelForPid(playerId);
}

// Builds bottom action row (swap/ready/cancel) and ensures admin-toggle widgets exist.
function buildReadyDialogBottomButtonsSection(
    eventPlayer: mod.Player,
    containerBase: mod.UIWidget,
    playerId: number,
    buttonCancelId: string,
    buttonCancelLabelId: string
): void {
    const swapButtonId = UI_READY_DIALOG_BUTTON_SWAP_ID + playerId;
    const swapButtonLabelId = UI_READY_DIALOG_BUTTON_SWAP_LABEL_ID + playerId;
    const swapBorder = addOutlinedButton(
        swapButtonId,
        0,
        0,
        READY_DIALOG_MAIN_BUTTON_WIDTH,
        READY_DIALOG_MAIN_BUTTON_HEIGHT,
        mod.UIAnchor.BottomLeft,
        containerBase,
        eventPlayer
    );
    addReadyDialogCenteredText(
        swapButtonLabelId,
        READY_DIALOG_MAIN_BUTTON_WIDTH,
        READY_DIALOG_MAIN_BUTTON_HEIGHT,
        mod.Message(mod.stringkeys.twl.readyDialog.buttons.swapTeams),
        eventPlayer,
        swapBorder ?? containerBase
    );

    const readyButtonId = UI_READY_DIALOG_BUTTON_READY_ID + playerId;
    const readyButtonLabelId = UI_READY_DIALOG_BUTTON_READY_LABEL_ID + playerId;
    const readyButtonBorder = addOutlinedButton(
        readyButtonId,
        READY_DIALOG_READY_BUTTON_OFFSET_X,
        0,
        READY_DIALOG_MAIN_BUTTON_WIDTH,
        READY_DIALOG_MAIN_BUTTON_HEIGHT,
        mod.UIAnchor.BottomCenter,
        containerBase,
        eventPlayer
    );
    addReadyDialogCenteredText(
        readyButtonLabelId,
        READY_DIALOG_MAIN_BUTTON_WIDTH,
        READY_DIALOG_MAIN_BUTTON_HEIGHT,
        mod.Message(mod.stringkeys.twl.readyDialog.buttons.ready),
        eventPlayer,
        readyButtonBorder ?? containerBase
    );
    updateReadyToggleButtonForViewer(eventPlayer, playerId);

    const coachButtonId = UI_READY_DIALOG_BUTTON_COACH_ID + playerId;
    const coachButtonLabelId = UI_READY_DIALOG_BUTTON_COACH_LABEL_ID + playerId;
    const coachButtonBorder = addOutlinedButton(
        coachButtonId,
        READY_DIALOG_COACH_BUTTON_OFFSET_X,
        0,
        READY_DIALOG_MAIN_BUTTON_WIDTH,
        READY_DIALOG_MAIN_BUTTON_HEIGHT,
        mod.UIAnchor.BottomCenter,
        containerBase,
        eventPlayer
    );
    const coachButton = safeFind(coachButtonId);
    const coachBorder = safeFind(coachButtonId + "_BORDER");
    const coachLabel = addReadyDialogCenteredText(
        coachButtonLabelId,
        READY_DIALOG_MAIN_BUTTON_WIDTH,
        READY_DIALOG_MAIN_BUTTON_HEIGHT,
        mod.Message(mod.stringkeys.twl.readyDialog.buttons.spectateCoach),
        eventPlayer,
        coachButtonBorder ?? containerBase
    );
    if (coachButton) {
        mod.SetUIButtonEnabled(coachButton, false);
        mod.SetUIWidgetBgColor(coachButton, COLOR_GRAY_DARK);
        mod.SetUIWidgetBgAlpha(coachButton, 0.45);
    }
    if (coachBorder) {
        mod.SetUIWidgetBgColor(coachBorder, COLOR_GRAY_DARK);
        mod.SetUIWidgetBgAlpha(coachBorder, 0.45);
    }
    if (coachLabel) {
        mod.SetUITextColor(coachLabel, COLOR_GRAY);
    }

    // UI caching note: the admin toggle is created once with the dialog, while the admin panel contents stay lazy-built.
    ensureAdminPanelWidgets(eventPlayer, playerId, containerBase, false);

    const buttonCancelBorder = addOutlinedButton(
        buttonCancelId,
        0,
        0,
        READY_DIALOG_MAIN_BUTTON_WIDTH,
        READY_DIALOG_MAIN_BUTTON_HEIGHT,
        mod.UIAnchor.BottomRight,
        containerBase,
        eventPlayer
    );
    addReadyDialogCenteredText(
        buttonCancelLabelId,
        READY_DIALOG_MAIN_BUTTON_WIDTH,
        READY_DIALOG_MAIN_BUTTON_HEIGHT,
        mod.Message(mod.stringkeys.twl.teamSwitch.buttons.cancel),
        eventPlayer,
        buttonCancelBorder ?? containerBase
    );

    updateHelpTextVisibilityForPlayer(eventPlayer);
}

