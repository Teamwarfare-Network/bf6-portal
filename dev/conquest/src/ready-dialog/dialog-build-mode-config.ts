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
        hideLabel ? msg(STR_SYS_COUNTER, " ") : msg(labelKey),
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
        msg(mod.stringkeys.twl.ui.left),
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
        msg(STR_SYS_COUNTER, " "),
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
        msg(mod.stringkeys.twl.ui.right),
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

// v1.314: builds one checkbox row inside the config column's left sub-column. The outlined
// button is the clickable hit target; centered glyph text inside holds "X" (checked) or " "
// (unchecked), and the label text sits to the right. Widget names follow
// <BOX_ID | BOX_TEXT_ID | LABEL_ID> + checkboxKey + "_" + playerId so the readout path and the
// click dispatcher can locate them by key.
function buildReadyDialogConfigCheckboxRow(
    eventPlayer: mod.Player,
    containerBase: mod.UIWidget,
    playerId: number,
    checkboxKey: string,
    labelKey: number,
    subColX: number,
    rowY: number,
    subColWidth: number,
    indent: number
): void {
    const boxSize = 14;
    const textGap = 4;
    const boxX = subColX + indent;
    const boxY = rowY;
    const labelX = boxX + boxSize + textGap;
    const labelW = subColWidth - indent - boxSize - textGap;

    const boxId = UI_READY_DIALOG_CONFIG_CHECKBOX_BOX_ID + checkboxKey + "_" + playerId;
    const boxTextId = UI_READY_DIALOG_CONFIG_CHECKBOX_BOX_TEXT_ID + checkboxKey + "_" + playerId;
    const labelId = UI_READY_DIALOG_CONFIG_CHECKBOX_LABEL_ID + checkboxKey + "_" + playerId;

    const boxBorder = addOutlinedButton(
        boxId,
        boxX,
        boxY,
        boxSize,
        boxSize,
        mod.UIAnchor.TopLeft,
        containerBase,
        eventPlayer
    );
    addReadyDialogCenteredText(
        boxTextId,
        boxSize,
        boxSize,
        msg(mod.stringkeys.twl.ui.checkMarkEmpty),
        eventPlayer,
        boxBorder ?? containerBase,
        12
    );

    buildReadyDialogGridText(
        labelId,
        labelX,
        boxY + 1,
        labelW,
        boxSize,
        mod.UIAnchor.TopLeft,
        mod.UIAnchor.CenterLeft,
        msg(labelKey),
        12,
        eventPlayer,
        containerBase
    );
}

// v1.314: builds the config (center) column: Game Mode stepper in the reclaimed header slot,
// the 5-row checkbox block in the left sub-column, and the Players stepper below. Leaves the
// right sub-column intentionally empty as reserved space for future checkboxes.
function buildReadyDialogConfigColumn(
    eventPlayer: mod.Player,
    containerBase: mod.UIWidget,
    playerId: number,
    columnX: number,
    columnWidth: number,
    buttonSizeX: number,
    buttonSizeY: number,
    gameModeRowY: number,
    playersRowY: number,
    checkboxStartY: number
): void {
    const leftSubColX = columnX;
    // v1.316: widened left sub-col from 104→120 so "Forward Deploy" (14 chars @ font 12) fits on
    // one line. Indent tightened 20→10 for a gentler hierarchy visual. Rows packed tighter (18 px
    // step). Right sub-col is now 216-120-8=88 px — still ample for future checkboxes.
    // v1.319: checkboxStartY is now passed by the caller; the block sits below the Players stepper.
    const leftSubColW = 120;
    const indentChild = 10;
    const rowCheckboxHeightStep = 18;

    buildReadyDialogGridKnobRow(
        eventPlayer,
        containerBase,
        playerId,
        READY_DIALOG_CONFIG_GAME_KNOB_KEY,
        mod.stringkeys.twl.readyDialog.gameModeConfigurationLabel,
        columnX,
        gameModeRowY,
        columnWidth,
        buttonSizeX,
        buttonSizeY
    );

    const checkboxRows: { key: string; labelKey: number; indent: number }[] = [
        { key: READY_DIALOG_CONFIG_CHECKBOX_VANILLA_KEY, labelKey: mod.stringkeys.twl.readyDialog.vanillaDeployCheckboxLabel, indent: 0 },
        { key: READY_DIALOG_CONFIG_CHECKBOX_HQ_KEY, labelKey: mod.stringkeys.twl.readyDialog.hqDeployCheckboxLabel, indent: 0 },
        { key: READY_DIALOG_CONFIG_CHECKBOX_AIR_KEY, labelKey: mod.stringkeys.twl.readyDialog.airDeployCheckboxLabel, indent: indentChild },
        { key: READY_DIALOG_CONFIG_CHECKBOX_FORWARD_KEY, labelKey: mod.stringkeys.twl.readyDialog.forwardDeployCheckboxLabel, indent: indentChild },
        { key: READY_DIALOG_CONFIG_CHECKBOX_SUPPLY_BOXES_KEY, labelKey: mod.stringkeys.twl.readyDialog.supplyBoxesCheckboxLabel, indent: 0 },
    ];
    for (let r = 0; r < checkboxRows.length; r++) {
        const spec = checkboxRows[r];
        buildReadyDialogConfigCheckboxRow(
            eventPlayer,
            containerBase,
            playerId,
            spec.key,
            spec.labelKey,
            leftSubColX,
            checkboxStartY + (r * rowCheckboxHeightStep),
            leftSubColW,
            spec.indent
        );
    }

    buildReadyDialogGridKnobRow(
        eventPlayer,
        containerBase,
        playerId,
        READY_DIALOG_CONFIG_PLAYERS_KNOB_KEY,
        mod.stringkeys.twl.readyDialog.playersLabel,
        columnX,
        playersRowY,
        columnWidth,
        buttonSizeX,
        buttonSizeY
    );
}

function buildReadyDialogModeConfigSection(
    eventPlayer: mod.Player,
    containerBase: mod.UIWidget,
    playerId: number
): void {
    const gridTopY = 6;
    const headerHeight = 18;
    const knobBlockHeight = 30;
    const supportRowHeight = 12;
    const buttonRowY = 156;
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
        const isConfigColumn = column.key === "config";

        // v1.314: config column has no "Configuration" header — Game Mode occupies the header row
        // (see buildReadyDialogConfigColumn below). Creating and hiding a header widget here would
        // leave a stale placeholder alive in the cache, so skip creation entirely for config.
        if (!isConfigColumn) {
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
        }

        if (isConfigColumn) {
            // v1.319: stack order is Mode Config → Players → Checkboxes. Players now sits on row-0
            // of the vehicle columns (Tank 1 / Jet 1 / Transport 1 line). Mode Config sits one
            // knobBlockHeight above Players so the stepper-to-stepper gutter matches the vehicle
            // columns' knob-row spacing (30 px). Checkboxes start one knobBlockHeight below
            // Players (row-1 line of vehicle columns) and use their own tighter 18 px step.
            const playersRowY = gridTopY + headerHeight + 2;
            const gameModeRowY = playersRowY - knobBlockHeight;
            const checkboxStartY = playersRowY + knobBlockHeight + 3;
            buildReadyDialogConfigColumn(
                eventPlayer,
                containerBase,
                playerId,
                columnX,
                column.width,
                buttonSizeX,
                buttonSizeY,
                gameModeRowY,
                playersRowY,
                checkboxStartY
            );
        } else {
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
        }

        const supportId = UI_READY_DIALOG_MODE_GRID_SUPPORT_ID + column.key + "_" + playerId;
        const supportInsidePlayersPanel = column.key === "config";
        const supportWidget = buildReadyDialogGridText(
            supportId,
            supportInsidePlayersPanel ? columnX + buttonSizeX : columnX,
            supportInsidePlayersPanel
                ? gridTopY + headerHeight + 2 + 17
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
    const giveUpAdminId = UI_READY_DIALOG_BUTTON_GIVE_UP_ADMIN_ID + playerId;
    const giveUpAdminLabelId = UI_READY_DIALOG_BUTTON_GIVE_UP_ADMIN_LABEL_ID + playerId;
    const unsavedLabelId = UI_READY_DIALOG_MODE_UNSAVED_LABEL_ID + playerId;
    // Wave 4 Ship 6 / v1.2: GIVE UP ADMIN button inserted to the LEFT of RESET (per Q7);
    // same width + height as RESET. Layout row is now [GIVE UP ADMIN] [RESET] [CONFIRM]
    // centered as a unit in the content lane.
    const actionRowWidth = READY_DIALOG_RESET_BUTTON_WIDTH
        + READY_DIALOG_CONFIRM_BUTTON_GAP
        + READY_DIALOG_RESET_BUTTON_WIDTH
        + READY_DIALOG_CONFIRM_BUTTON_GAP
        + READY_DIALOG_CONFIRM_BUTTON_WIDTH;
    const actionRowX = laneLeftX + Math.floor((READY_DIALOG_CONTENT_LANE_WIDTH - actionRowWidth) / 2);
    const giveUpAdminX = actionRowX;
    const resetButtonX = giveUpAdminX + READY_DIALOG_RESET_BUTTON_WIDTH + READY_DIALOG_CONFIRM_BUTTON_GAP;
    const confirmButtonX = resetButtonX + READY_DIALOG_RESET_BUTTON_WIDTH + READY_DIALOG_CONFIRM_BUTTON_GAP;

    const giveUpAdminBorder = addOutlinedButton(
        giveUpAdminId,
        giveUpAdminX,
        buttonRowY,
        READY_DIALOG_RESET_BUTTON_WIDTH,
        READY_DIALOG_SMALL_BUTTON_HEIGHT,
        mod.UIAnchor.TopLeft,
        containerBase,
        eventPlayer
    );
    addReadyDialogCenteredText(
        giveUpAdminLabelId,
        READY_DIALOG_RESET_BUTTON_WIDTH,
        READY_DIALOG_SMALL_BUTTON_HEIGHT,
        msg(mod.stringkeys.twl.readyDialog.buttons.giveUpAdmin),
        eventPlayer,
        giveUpAdminBorder ?? containerBase,
        12
    );

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
        msg(mod.stringkeys.twl.readyDialog.resetSettingsLabel),
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
        msg(mod.stringkeys.twl.readyDialog.confirmSettingsLabel),
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
        msg(mod.stringkeys.twl.readyDialog.unsavedChangesLabel),
        eventPlayer,
        containerBase,
        12,
        false,
        COLOR_NOT_READY_RED
    );

    updateReadyDialogModeConfigForPid(playerId);
}


