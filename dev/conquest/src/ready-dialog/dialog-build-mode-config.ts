// @ts-nocheck
// Module: ready-dialog/dialog-build-mode-config -- 7-column ready-dialog knob grid

function buildReadyDialogGridText(
    widgetId: string,
    posX: number,
    posY: number,
    sizeX: number,
    sizeY: number,
    anchor: mod.UIAnchor,
    textAnchor: mod.UIAnchor,
    label: number | mod.Message,
    textSize: number,
    eventPlayer: mod.Player,
    parent: mod.UIWidget
): mod.UIWidget | undefined {
    return addReadyDialogText(
        widgetId,
        posX,
        posY,
        sizeX,
        sizeY,
        anchor,
        textAnchor,
        label,
        eventPlayer,
        parent,
        textSize,
        true,
        READY_DIALOG_LABEL_TEXT_COLOR
    );
}

function buildReadyDialogGridKnobRow(
    eventPlayer: mod.Player,
    containerBase: mod.UIWidget,
    playerId: number,
    knobKey: string,
    labelKey: number,
    columnX: number,
    rowY: number,
    columnWidth: number,
    buttonSizeX: number,
    buttonSizeY: number
): void {
    const hideLabel = knobKey === READY_DIALOG_CONFIG_PLAYERS_KNOB_KEY;
    const isPlayersConfigKnob = hideLabel;
    const labelId = UI_READY_DIALOG_MODE_GRID_KNOB_LABEL_ID + knobKey + "_" + playerId;
    const valueId = UI_READY_DIALOG_MODE_GRID_KNOB_VALUE_ID + knobKey + "_" + playerId;
    const panelId = UI_READY_DIALOG_MODE_GRID_KNOB_PANEL_ID + knobKey + "_" + playerId;
    const decId = UI_READY_DIALOG_MODE_GRID_KNOB_DEC_ID + knobKey + "_" + playerId;
    const decLabelId = UI_READY_DIALOG_MODE_GRID_KNOB_DEC_LABEL_ID + knobKey + "_" + playerId;
    const incId = UI_READY_DIALOG_MODE_GRID_KNOB_INC_ID + knobKey + "_" + playerId;
    const incLabelId = UI_READY_DIALOG_MODE_GRID_KNOB_INC_LABEL_ID + knobKey + "_" + playerId;

    const labelY = rowY + 4;
    const labelHeight = 8;
    const controlY = rowY + 5;
    const valueY = isPlayersConfigKnob ? controlY : rowY + 9;
    const valueHeight = isPlayersConfigKnob ? 12 : buttonSizeY;
    const valueWidth = columnWidth - (buttonSizeX * 2);
    const panelHeight = buttonSizeY;

    mod.AddUIContainer(
        panelId,
        mod.CreateVector(columnX + buttonSizeX, controlY, 0),
        mod.CreateVector(valueWidth, panelHeight, 0),
        mod.UIAnchor.TopLeft,
        containerBase,
        true,
        0,
        COLOR_GRAY_DARK,
        0.40,
        mod.UIBgFill.Solid,
        mod.UIDepth.AboveGameUI,
        eventPlayer
    );

    buildReadyDialogGridText(
        labelId,
        columnX + buttonSizeX,
        labelY,
        valueWidth,
        labelHeight,
        mod.UIAnchor.TopLeft,
        mod.UIAnchor.Center,
        hideLabel ? mod.Message(mod.stringkeys.twl.system.genericCounter, "") : mod.Message(labelKey),
        11,
        eventPlayer,
        containerBase
    );
    if (hideLabel) {
        const labelWidget = safeFind(labelId);
        if (labelWidget) mod.SetUIWidgetVisible(labelWidget, false);
    }

    const decBorder = addOutlinedButton(
        decId,
        columnX,
        controlY,
        buttonSizeX,
        buttonSizeY,
        mod.UIAnchor.TopLeft,
        containerBase,
        eventPlayer
    );
    addReadyDialogCenteredText(
        decLabelId,
        buttonSizeX,
        buttonSizeY,
        mod.Message(mod.stringkeys.twl.ui.left),
        eventPlayer,
        decBorder ?? containerBase,
        14
    );

    buildReadyDialogGridText(
        valueId,
        columnX + buttonSizeX,
        valueY,
        valueWidth,
        valueHeight,
        mod.UIAnchor.TopLeft,
        mod.UIAnchor.Center,
        mod.Message(mod.stringkeys.twl.system.genericCounter, ""),
        12,
        eventPlayer,
        containerBase
    );

    const incBorder = addOutlinedButton(
        incId,
        columnX + columnWidth - buttonSizeX,
        controlY,
        buttonSizeX,
        buttonSizeY,
        mod.UIAnchor.TopLeft,
        containerBase,
        eventPlayer
    );
    addReadyDialogCenteredText(
        incLabelId,
        buttonSizeX,
        buttonSizeY,
        mod.Message(mod.stringkeys.twl.ui.right),
        eventPlayer,
        incBorder ?? containerBase,
        14
    );

    if (isReadyDialogModeGridPlaceholderKnobKey(knobKey)) {
        const toHide = [
            safeFind(panelId),
            safeFind(labelId),
            safeFind(valueId),
            safeFind(decId),
            safeFind(decId + "_BORDER"),
            safeFind(decLabelId),
            safeFind(incId),
            safeFind(incId + "_BORDER"),
            safeFind(incLabelId),
        ];
        for (const widget of toHide) {
            if (widget) mod.SetUIWidgetVisible(widget, false);
        }
        const decButton = safeFind(decId);
        const incButton = safeFind(incId);
        if (decButton) mod.SetUIButtonEnabled(decButton, false);
        if (incButton) mod.SetUIButtonEnabled(incButton, false);
    }
}

function buildReadyDialogModeConfigSection(
    eventPlayer: mod.Player,
    containerBase: mod.UIWidget,
    playerId: number
): void {
    const gridTopY = -6;
    const headerHeight = 18;
    const knobBlockHeight = 30;
    const supportRowHeight = 12;
    const buttonRowY = 144;
    const columnGap = 6;
    const buttonSizeX = READY_DIALOG_SMALL_BUTTON_WIDTH;
    const buttonSizeY = READY_DIALOG_SMALL_BUTTON_HEIGHT;
    const containerWidth = READY_DIALOG_CONTAINER_WIDTH;
    const columns = getReadyDialogModeGridColumnSpecs();

    const laneLeftX = Math.floor((containerWidth - READY_DIALOG_CONTENT_LANE_WIDTH) / 2) + READY_DIALOG_CONTENT_OFFSET_X;
    const gridWidth = columns.reduce((sum, column) => sum + column.width, 0) + ((columns.length - 1) * columnGap);
    const gridLeftX = laneLeftX + Math.floor((READY_DIALOG_CONTENT_LANE_WIDTH - gridWidth) / 2);
    let columnX = gridLeftX;

    for (let i = 0; i < columns.length; i++) {
        const column = columns[i];
        const headerId = UI_READY_DIALOG_MODE_GRID_COLUMN_HEADER_ID + column.key + "_" + playerId;

        buildReadyDialogGridText(
            headerId,
            columnX,
            gridTopY,
            column.width,
            headerHeight,
            mod.UIAnchor.TopLeft,
            mod.UIAnchor.Center,
            getReadyDialogModeGridColumnHeaderMessage(column),
            14,
            eventPlayer,
            containerBase
        );

        for (let row = 0; row < column.knobSpecs.length; row++) {
            const rowY = gridTopY + headerHeight + 2 + (row * knobBlockHeight);
            buildReadyDialogGridKnobRow(
                eventPlayer,
                containerBase,
                playerId,
                column.knobSpecs[row].key,
                column.knobSpecs[row].labelKey,
                columnX,
                rowY,
                column.width,
                buttonSizeX,
                buttonSizeY
            );
        }

        const supportId = UI_READY_DIALOG_MODE_GRID_SUPPORT_ID + column.key + "_" + playerId;
        const supportInsidePlayersPanel = column.key === "config";
        const supportWidget = buildReadyDialogGridText(
            supportId,
            supportInsidePlayersPanel ? columnX + buttonSizeX : columnX,
            supportInsidePlayersPanel
                ? gridTopY + headerHeight + 2 + (3 * knobBlockHeight) + 17
                : gridTopY + headerHeight + 2 + (4 * knobBlockHeight) - 4,
            supportInsidePlayersPanel ? column.width - (buttonSizeX * 2) : column.width,
            supportInsidePlayersPanel ? 8 : supportRowHeight,
            mod.UIAnchor.TopLeft,
            mod.UIAnchor.Center,
            getReadyDialogModeGridSupportPlaceholder(column),
            10,
            eventPlayer,
            containerBase
        );
        if (supportWidget && !column.supportVisible) {
            mod.SetUIWidgetVisible(supportWidget, false);
        }

        columnX += column.width + columnGap;
    }

    const modeConfirmId = UI_READY_DIALOG_MODE_CONFIRM_ID + playerId;
    const modeConfirmLabelId = UI_READY_DIALOG_MODE_CONFIRM_LABEL_ID + playerId;
    const modeResetId = UI_READY_DIALOG_MODE_RESET_ID + playerId;
    const modeResetLabelId = UI_READY_DIALOG_MODE_RESET_LABEL_ID + playerId;
    const unsavedLabelId = UI_READY_DIALOG_MODE_UNSAVED_LABEL_ID + playerId;
    const actionRowWidth = READY_DIALOG_RESET_BUTTON_WIDTH + READY_DIALOG_CONFIRM_BUTTON_GAP + READY_DIALOG_CONFIRM_BUTTON_WIDTH;
    const actionRowX = laneLeftX + Math.floor((READY_DIALOG_CONTENT_LANE_WIDTH - actionRowWidth) / 2);
    const resetButtonX = actionRowX;
    const confirmButtonX = resetButtonX + READY_DIALOG_RESET_BUTTON_WIDTH + READY_DIALOG_CONFIRM_BUTTON_GAP;

    const resetBorder = addOutlinedButton(
        modeResetId,
        resetButtonX,
        buttonRowY,
        READY_DIALOG_RESET_BUTTON_WIDTH,
        READY_DIALOG_SMALL_BUTTON_HEIGHT,
        mod.UIAnchor.TopLeft,
        containerBase,
        eventPlayer
    );
    addReadyDialogCenteredText(
        modeResetLabelId,
        READY_DIALOG_RESET_BUTTON_WIDTH,
        READY_DIALOG_SMALL_BUTTON_HEIGHT,
        mod.Message(mod.stringkeys.twl.readyDialog.resetSettingsLabel),
        eventPlayer,
        resetBorder ?? containerBase,
        12
    );

    const confirmBorder = addOutlinedButton(
        modeConfirmId,
        confirmButtonX,
        buttonRowY,
        READY_DIALOG_CONFIRM_BUTTON_WIDTH,
        READY_DIALOG_SMALL_BUTTON_HEIGHT,
        mod.UIAnchor.TopLeft,
        containerBase,
        eventPlayer
    );
    addReadyDialogCenteredText(
        modeConfirmLabelId,
        READY_DIALOG_CONFIRM_BUTTON_WIDTH,
        READY_DIALOG_SMALL_BUTTON_HEIGHT,
        mod.Message(mod.stringkeys.twl.readyDialog.confirmSettingsLabel),
        eventPlayer,
        confirmBorder ?? containerBase,
        12
    );

    addReadyDialogText(
        unsavedLabelId,
        confirmButtonX + READY_DIALOG_CONFIRM_BUTTON_WIDTH + 20,
        buttonRowY,
        430,
        READY_DIALOG_SMALL_BUTTON_HEIGHT,
        mod.UIAnchor.TopLeft,
        mod.UIAnchor.CenterLeft,
        mod.Message(mod.stringkeys.twl.readyDialog.unsavedChangesLabel),
        eventPlayer,
        containerBase,
        12,
        false,
        COLOR_NOT_READY_RED
    );

    updateReadyDialogModeConfigForPid(playerId);
}
