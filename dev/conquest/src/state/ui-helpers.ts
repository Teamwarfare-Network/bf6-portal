// @ts-nocheck
// Module: state/ui-helpers -- shared widget builder helpers and ready-dialog label refresh

function addOutlinedButton(
    buttonId: string,
    posX: number,
    posY: number,
    sizeX: number,
    sizeY: number,
    anchor: mod.UIAnchor,
    parent: mod.UIWidget,
    player: mod.Player,
    borderPadding: number = BUTTON_BORDER_PADDING
): mod.UIWidget | undefined {
    const borderId = `${buttonId}_BORDER`;
    const borderSizeX = sizeX + (borderPadding * 2);
    const borderSizeY = sizeY + (borderPadding * 2);

    mod.AddUIContainer(
        borderId,
        mod.CreateVector(posX, posY, 0),
        mod.CreateVector(borderSizeX, borderSizeY, 0),
        anchor,
        parent,
        true,
        0,
        COLOR_BUTTON_BORDER,
        BUTTON_BORDER_OPACITY,
        mod.UIBgFill.OutlineThin,
        mod.UIDepth.AboveGameUI,
        player
    );

    const border = mod.FindUIWidgetWithName(borderId, mod.GetUIRoot());
    const buttonParent = border ?? parent;

    mod.AddUIButton(
        buttonId,
        mod.CreateVector(0, 0, 0),
        mod.CreateVector(sizeX, sizeY, 0),
        mod.UIAnchor.Center,
        buttonParent,
        true,
        0,
        COLOR_BUTTON_BASE,
        BUTTON_OPACITY_BASE,
        mod.UIBgFill.Solid,
        true,
        COLOR_BUTTON_BASE,
        BUTTON_OPACITY_BASE,
        COLOR_BUTTON_BASE,
        BUTTON_OPACITY_BASE,
        COLOR_BUTTON_PRESSED,
        BUTTON_OPACITY_PRESSED,
        COLOR_BUTTON_SELECTED,
        BUTTON_OPACITY_SELECTED,
        COLOR_BUTTON_SELECTED,
        BUTTON_OPACITY_SELECTED,
        mod.UIDepth.AboveGameUI,
        player
    );

    const button = mod.FindUIWidgetWithName(buttonId, mod.GetUIRoot());
    if (button && border) {
        mod.SetUIWidgetParent(button, border);
    }

    return border ?? undefined;
}

function addCenteredButtonText(
    labelId: string,
    sizeX: number,
    sizeY: number,
    label: number | mod.Message,
    player: mod.Player,
    parent: mod.UIWidget,
    textSize?: number
): mod.UIWidget | undefined {
    const existing = safeFind(labelId);
    if (existing) mod.DeleteUIWidget(existing);

    const config: any = {
        name: labelId,
        type: "Text",
        playerId: player,
        position: [0, 0],
        size: [sizeX, sizeY],
        anchor: mod.UIAnchor.Center,
        visible: true,
        padding: 0,
        bgAlpha: 0,
        bgFill: mod.UIBgFill.None,
        textLabel: label,
        textColor: READY_DIALOG_BUTTON_TEXT_COLOR_RGB,
        textAlpha: 1,
        textAnchor: mod.UIAnchor.Center,
    };
    if (typeof textSize === "number") {
        config.textSize = textSize;
    }

    modlib.ParseUI(config);

    const widget = safeFind(labelId);
    if (widget) {
        mod.SetUIWidgetParent(widget, parent);
        mod.SetUIWidgetPosition(widget, mod.CreateVector(0, 0, 0));
        if (typeof textSize === "number") {
            mod.SetUITextSize(widget, textSize);
        }
    }
    return widget;
}

function addRightAlignedLabel(
    labelId: string,
    posX: number,
    posY: number,
    sizeX: number,
    sizeY: number,
    anchor: mod.UIAnchor,
    label: mod.Message,
    player: mod.Player,
    parent: mod.UIWidget,
    textSize: number
): mod.UIWidget | undefined {
    const widget = modlib.ParseUI({
        name: labelId,
        type: "Text",
        playerId: player,
        position: [posX, posY],
        size: [sizeX, sizeY],
        anchor: anchor,
        visible: true,
        padding: 0,
        bgAlpha: 0,
        bgFill: mod.UIBgFill.None,
        textLabel: label,
        textColor: [1, 1, 1],
        textAlpha: 1,
        textSize: textSize,
        textAnchor: mod.UIAnchor.CenterRight,
    });
    if (widget) {
        mod.SetUIWidgetParent(widget, parent);
        applyReadyDialogLabelTextColor(widget);
    }
    return widget;
}

function applyReadyDialogLabelTextColor(widget?: mod.UIWidget): void {
    if (widget) mod.SetUITextColor(widget, READY_DIALOG_LABEL_TEXT_COLOR);
}

function applyAdminPanelLabelTextColor(widget?: mod.UIWidget): void {
    if (widget) mod.SetUITextColor(widget, ADMIN_PANEL_LABEL_TEXT_COLOR);
}

function refreshReadyDialogButtonTextForPid(player: mod.Player, pid: number, baseContainer: mod.UIWidget): void {
    const swapBorder = safeFind(UI_READY_DIALOG_BUTTON_SWAP_ID + pid + "_BORDER");
    addCenteredButtonText(
        UI_READY_DIALOG_BUTTON_SWAP_LABEL_ID + pid,
        READY_DIALOG_MAIN_BUTTON_WIDTH,
        READY_DIALOG_MAIN_BUTTON_HEIGHT,
        mod.stringkeys.twl.readyDialog.buttons.swapTeams,
        player,
        swapBorder ?? baseContainer
    );

    const readyBorder = safeFind(UI_READY_DIALOG_BUTTON_READY_ID + pid + "_BORDER");
    addCenteredButtonText(
        UI_READY_DIALOG_BUTTON_READY_LABEL_ID + pid,
        READY_DIALOG_MAIN_BUTTON_WIDTH,
        READY_DIALOG_MAIN_BUTTON_HEIGHT,
        mod.stringkeys.twl.readyDialog.buttons.ready,
        player,
        readyBorder ?? baseContainer
    );
    updateReadyToggleButtonForViewer(player, pid);

    const cancelBorder = safeFind(UI_READY_DIALOG_BUTTON_CANCEL_ID + pid + "_BORDER");
    addCenteredButtonText(
        UI_READY_DIALOG_BUTTON_CANCEL_LABEL_ID + pid,
        READY_DIALOG_MAIN_BUTTON_WIDTH,
        READY_DIALOG_MAIN_BUTTON_HEIGHT,
        mod.stringkeys.twl.teamSwitch.buttons.cancel,
        player,
        cancelBorder ?? baseContainer
    );

    const matchupDecBorder = safeFind(UI_READY_DIALOG_MATCHUP_DEC_ID + pid + "_BORDER");
    addCenteredButtonText(
        UI_READY_DIALOG_MATCHUP_DEC_LABEL_ID + pid,
        READY_DIALOG_SMALL_BUTTON_WIDTH,
        READY_DIALOG_SMALL_BUTTON_HEIGHT,
        mod.stringkeys.twl.ui.minus,
        player,
        matchupDecBorder ?? baseContainer,
        14
    );
    const matchupIncBorder = safeFind(UI_READY_DIALOG_MATCHUP_INC_ID + pid + "_BORDER");
    addCenteredButtonText(
        UI_READY_DIALOG_MATCHUP_INC_LABEL_ID + pid,
        READY_DIALOG_SMALL_BUTTON_WIDTH,
        READY_DIALOG_SMALL_BUTTON_HEIGHT,
        mod.stringkeys.twl.ui.plus,
        player,
        matchupIncBorder ?? baseContainer,
        14
    );

    const minPlayersDecBorder = safeFind(UI_READY_DIALOG_MINPLAYERS_DEC_ID + pid + "_BORDER");
    addCenteredButtonText(
        UI_READY_DIALOG_MINPLAYERS_DEC_LABEL_ID + pid,
        READY_DIALOG_SMALL_BUTTON_WIDTH,
        READY_DIALOG_SMALL_BUTTON_HEIGHT,
        mod.stringkeys.twl.ui.minus,
        player,
        minPlayersDecBorder ?? baseContainer,
        14
    );
    const minPlayersIncBorder = safeFind(UI_READY_DIALOG_MINPLAYERS_INC_ID + pid + "_BORDER");
    addCenteredButtonText(
        UI_READY_DIALOG_MINPLAYERS_INC_LABEL_ID + pid,
        READY_DIALOG_SMALL_BUTTON_WIDTH,
        READY_DIALOG_SMALL_BUTTON_HEIGHT,
        mod.stringkeys.twl.ui.plus,
        player,
        minPlayersIncBorder ?? baseContainer,
        14
    );

    const modeGameDecBorder = safeFind(UI_READY_DIALOG_MODE_GAME_DEC_ID + pid + "_BORDER");
    addCenteredButtonText(
        UI_READY_DIALOG_MODE_GAME_DEC_LABEL_ID + pid,
        READY_DIALOG_SMALL_BUTTON_WIDTH,
        READY_DIALOG_SMALL_BUTTON_HEIGHT,
        mod.stringkeys.twl.ui.left,
        player,
        modeGameDecBorder ?? baseContainer,
        14
    );
    const modeGameIncBorder = safeFind(UI_READY_DIALOG_MODE_GAME_INC_ID + pid + "_BORDER");
    addCenteredButtonText(
        UI_READY_DIALOG_MODE_GAME_INC_LABEL_ID + pid,
        READY_DIALOG_SMALL_BUTTON_WIDTH,
        READY_DIALOG_SMALL_BUTTON_HEIGHT,
        mod.stringkeys.twl.ui.right,
        player,
        modeGameIncBorder ?? baseContainer,
        14
    );

    const modeSettingsDecBorder = safeFind(UI_READY_DIALOG_MODE_SETTINGS_DEC_ID + pid + "_BORDER");
    addCenteredButtonText(
        UI_READY_DIALOG_MODE_SETTINGS_DEC_LABEL_ID + pid,
        READY_DIALOG_SMALL_BUTTON_WIDTH,
        READY_DIALOG_SMALL_BUTTON_HEIGHT,
        mod.stringkeys.twl.ui.left,
        player,
        modeSettingsDecBorder ?? baseContainer,
        14
    );
    const modeSettingsIncBorder = safeFind(UI_READY_DIALOG_MODE_SETTINGS_INC_ID + pid + "_BORDER");
    addCenteredButtonText(
        UI_READY_DIALOG_MODE_SETTINGS_INC_LABEL_ID + pid,
        READY_DIALOG_SMALL_BUTTON_WIDTH,
        READY_DIALOG_SMALL_BUTTON_HEIGHT,
        mod.stringkeys.twl.ui.right,
        player,
        modeSettingsIncBorder ?? baseContainer,
        14
    );

    const vehiclesT1DecBorder = safeFind(UI_READY_DIALOG_MODE_VEHICLES_T1_DEC_ID + pid + "_BORDER");
    addCenteredButtonText(
        UI_READY_DIALOG_MODE_VEHICLES_T1_DEC_LABEL_ID + pid,
        READY_DIALOG_SMALL_BUTTON_WIDTH,
        READY_DIALOG_SMALL_BUTTON_HEIGHT,
        mod.stringkeys.twl.ui.left,
        player,
        vehiclesT1DecBorder ?? baseContainer,
        14
    );
    const vehiclesT1IncBorder = safeFind(UI_READY_DIALOG_MODE_VEHICLES_T1_INC_ID + pid + "_BORDER");
    addCenteredButtonText(
        UI_READY_DIALOG_MODE_VEHICLES_T1_INC_LABEL_ID + pid,
        READY_DIALOG_SMALL_BUTTON_WIDTH,
        READY_DIALOG_SMALL_BUTTON_HEIGHT,
        mod.stringkeys.twl.ui.right,
        player,
        vehiclesT1IncBorder ?? baseContainer,
        14
    );

    const vehiclesT2DecBorder = safeFind(UI_READY_DIALOG_MODE_VEHICLES_T2_DEC_ID + pid + "_BORDER");
    addCenteredButtonText(
        UI_READY_DIALOG_MODE_VEHICLES_T2_DEC_LABEL_ID + pid,
        READY_DIALOG_SMALL_BUTTON_WIDTH,
        READY_DIALOG_SMALL_BUTTON_HEIGHT,
        mod.stringkeys.twl.ui.left,
        player,
        vehiclesT2DecBorder ?? baseContainer,
        14
    );
    const vehiclesT2IncBorder = safeFind(UI_READY_DIALOG_MODE_VEHICLES_T2_INC_ID + pid + "_BORDER");
    addCenteredButtonText(
        UI_READY_DIALOG_MODE_VEHICLES_T2_INC_LABEL_ID + pid,
        READY_DIALOG_SMALL_BUTTON_WIDTH,
        READY_DIALOG_SMALL_BUTTON_HEIGHT,
        mod.stringkeys.twl.ui.right,
        player,
        vehiclesT2IncBorder ?? baseContainer,
        14
    );

    const confirmBorder = safeFind(UI_READY_DIALOG_MODE_CONFIRM_ID + pid + "_BORDER");
    addCenteredButtonText(
        UI_READY_DIALOG_MODE_CONFIRM_LABEL_ID + pid,
        READY_DIALOG_CONFIRM_BUTTON_WIDTH,
        READY_DIALOG_SMALL_BUTTON_HEIGHT,
        mod.stringkeys.twl.readyDialog.confirmSettingsLabel,
        player,
        confirmBorder ?? baseContainer,
        12
    );
    const resetBorder = safeFind(UI_READY_DIALOG_MODE_RESET_ID + pid + "_BORDER");
    addCenteredButtonText(
        UI_READY_DIALOG_MODE_RESET_LABEL_ID + pid,
        READY_DIALOG_RESET_BUTTON_WIDTH,
        READY_DIALOG_SMALL_BUTTON_HEIGHT,
        mod.stringkeys.twl.readyDialog.resetSettingsLabel,
        player,
        resetBorder ?? baseContainer,
        12
    );
}

// Safely resolve a Player by pid (mod.GetObjId(player)). Returns undefined if not found.
