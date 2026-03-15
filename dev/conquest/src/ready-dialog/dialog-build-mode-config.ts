// @ts-nocheck
// Module: ready-dialog/dialog-build-mode-config -- 7-column ready-dialog knob grid

type ReadyDialogGridColumnSpec = {
    key: string;
    headerLabel: mod.Message;
    knobKeys: readonly string[];
    knobLabels: readonly number[];
    width: number;
    teamId?: TeamID;
    supportLabel?: mod.Message;
    supportVisible?: boolean;
};

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
    const widget = modlib.ParseUI({
        name: widgetId,
        type: "Text",
        playerId: eventPlayer,
        position: [posX, posY],
        size: [sizeX, sizeY],
        anchor,
        visible: true,
        padding: 0,
        bgAlpha: 0,
        bgFill: mod.UIBgFill.None,
        textLabel: label,
        textColor: [1, 1, 1],
        textAlpha: 1,
        textSize,
        textAnchor,
    });
    if (widget) {
        mod.SetUIWidgetParent(widget, parent);
        applyReadyDialogLabelTextColor(widget);
    }
    return widget;
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
    const isPlayersConfigKnob = knobKey === READY_DIALOG_CONFIG_PLAYERS_KNOB_KEY;
    const labelId = UI_READY_DIALOG_MODE_GRID_KNOB_LABEL_ID + knobKey + "_" + playerId;
    const valueId = UI_READY_DIALOG_MODE_GRID_KNOB_VALUE_ID + knobKey + "_" + playerId;
    const panelId = UI_READY_DIALOG_MODE_GRID_KNOB_PANEL_ID + knobKey + "_" + playerId;
    const decId = UI_READY_DIALOG_MODE_GRID_KNOB_DEC_ID + knobKey + "_" + playerId;
    const decLabelId = UI_READY_DIALOG_MODE_GRID_KNOB_DEC_LABEL_ID + knobKey + "_" + playerId;
    const incId = UI_READY_DIALOG_MODE_GRID_KNOB_INC_ID + knobKey + "_" + playerId;
    const incLabelId = UI_READY_DIALOG_MODE_GRID_KNOB_INC_LABEL_ID + knobKey + "_" + playerId;

    const labelY = isPlayersConfigKnob ? rowY + 4 : rowY + 4;
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
    addCenteredButtonText(
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
    addCenteredButtonText(
        incLabelId,
        buttonSizeX,
        buttonSizeY,
        mod.Message(mod.stringkeys.twl.ui.right),
        eventPlayer,
        incBorder ?? containerBase,
        14
    );
}

function buildReadyDialogModeConfigSection(
    eventPlayer: mod.Player,
    containerBase: mod.UIWidget,
    playerId: number,
    _bestOfY?: number,
    _bestOfButtonSizeX?: number,
    _bestOfButtonSizeY?: number,
    _bestOfLabelSizeY?: number,
    _leftSectionLeftButtonX?: number,
    _leftSectionRightButtonX?: number,
    _leftSectionValueX?: number,
    _leftSectionLabelX?: number,
    _leftSectionLabelWidth?: number,
    _leftSectionValueWidth?: number,
    _leftSectionRowGap?: number,
    _confirmButtonX?: number,
    _confirmButtonWidth?: number,
    _resetButtonX?: number,
    _resetButtonWidth?: number
): void {
    const gridTopY = -6;
    const headerHeight = 18;
    const knobBlockHeight = 30;
    const supportRowHeight = 12;
    const buttonRowY = 144;
    const teamColumnWidth = 158;
    const configColumnWidth = 216;
    const columnGap = 6;
    const buttonSizeX = READY_DIALOG_SMALL_BUTTON_WIDTH;
    const buttonSizeY = READY_DIALOG_SMALL_BUTTON_HEIGHT;
    const containerWidth = 1300;

    const columns: ReadyDialogGridColumnSpec[] = [
        {
            key: "team1Fast",
            headerLabel: mod.Message(mod.stringkeys.twl.readyDialog.columnFastFormat, getTeamNameKey(TeamID.Team1)),
            knobKeys: READY_DIALOG_TEAM1_FAST_KNOB_KEYS,
            knobLabels: [
                mod.stringkeys.twl.readyDialog.transport1Label,
                mod.stringkeys.twl.readyDialog.transport2Label,
                mod.stringkeys.twl.readyDialog.transport3Label,
                mod.stringkeys.twl.readyDialog.transport4Label,
            ],
            width: teamColumnWidth,
            teamId: TeamID.Team1,
            supportVisible: false,
        },
        {
            key: "team1Ground",
            headerLabel: mod.Message(mod.stringkeys.twl.readyDialog.columnGroundFormat, getTeamNameKey(TeamID.Team1)),
            knobKeys: READY_DIALOG_TEAM1_GROUND_KNOB_KEYS,
            knobLabels: [
                mod.stringkeys.twl.readyDialog.tank1Label,
                mod.stringkeys.twl.readyDialog.tank2Label,
                mod.stringkeys.twl.readyDialog.tank3Label,
                mod.stringkeys.twl.readyDialog.tank4Label,
            ],
            width: teamColumnWidth,
            teamId: TeamID.Team1,
            supportVisible: false,
        },
        {
            key: "team1Air",
            headerLabel: mod.Message(mod.stringkeys.twl.readyDialog.columnAirFormat, getTeamNameKey(TeamID.Team1)),
            knobKeys: [...READY_DIALOG_TEAM1_JET_KNOB_KEYS, ...READY_DIALOG_TEAM1_HELI_KNOB_KEYS],
            knobLabels: [
                mod.stringkeys.twl.readyDialog.jet1Label,
                mod.stringkeys.twl.readyDialog.jet2Label,
                mod.stringkeys.twl.readyDialog.heli1Label,
                mod.stringkeys.twl.readyDialog.heli2Label,
            ],
            width: teamColumnWidth,
            teamId: TeamID.Team1,
            supportVisible: false,
        },
        {
            key: "config",
            headerLabel: mod.Message(mod.stringkeys.twl.readyDialog.configurationColumnLabel),
            knobKeys: [
                READY_DIALOG_CONFIG_GAME_KNOB_KEY,
                READY_DIALOG_CONFIG_MODE_SETTINGS_KNOB_KEY,
                READY_DIALOG_CONFIG_VEHICLES_KNOB_KEY,
                READY_DIALOG_CONFIG_PLAYERS_KNOB_KEY,
            ],
            knobLabels: [
                mod.stringkeys.twl.readyDialog.gameModeLabel,
                mod.stringkeys.twl.readyDialog.modeSettingsLabel,
                mod.stringkeys.twl.readyDialog.vehiclesCountLabel,
                mod.stringkeys.twl.readyDialog.playersLabel,
            ],
            width: configColumnWidth,
            supportLabel: mod.Message(mod.stringkeys.twl.readyDialog.minPlayersToStartFormat, 0),
            supportVisible: true,
        },
        {
            key: "team2Air",
            headerLabel: mod.Message(mod.stringkeys.twl.readyDialog.columnAirFormat, getTeamNameKey(TeamID.Team2)),
            knobKeys: [...READY_DIALOG_TEAM2_JET_KNOB_KEYS, ...READY_DIALOG_TEAM2_HELI_KNOB_KEYS],
            knobLabels: [
                mod.stringkeys.twl.readyDialog.jet1Label,
                mod.stringkeys.twl.readyDialog.jet2Label,
                mod.stringkeys.twl.readyDialog.heli1Label,
                mod.stringkeys.twl.readyDialog.heli2Label,
            ],
            width: teamColumnWidth,
            teamId: TeamID.Team2,
            supportVisible: false,
        },
        {
            key: "team2Ground",
            headerLabel: mod.Message(mod.stringkeys.twl.readyDialog.columnGroundFormat, getTeamNameKey(TeamID.Team2)),
            knobKeys: READY_DIALOG_TEAM2_GROUND_KNOB_KEYS,
            knobLabels: [
                mod.stringkeys.twl.readyDialog.tank1Label,
                mod.stringkeys.twl.readyDialog.tank2Label,
                mod.stringkeys.twl.readyDialog.tank3Label,
                mod.stringkeys.twl.readyDialog.tank4Label,
            ],
            width: teamColumnWidth,
            teamId: TeamID.Team2,
            supportVisible: false,
        },
        {
            key: "team2Fast",
            headerLabel: mod.Message(mod.stringkeys.twl.readyDialog.columnFastFormat, getTeamNameKey(TeamID.Team2)),
            knobKeys: READY_DIALOG_TEAM2_FAST_KNOB_KEYS,
            knobLabels: [
                mod.stringkeys.twl.readyDialog.transport1Label,
                mod.stringkeys.twl.readyDialog.transport2Label,
                mod.stringkeys.twl.readyDialog.transport3Label,
                mod.stringkeys.twl.readyDialog.transport4Label,
            ],
            width: teamColumnWidth,
            teamId: TeamID.Team2,
            supportVisible: false,
        },
    ];

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
            column.headerLabel,
            14,
            eventPlayer,
            containerBase
        );

        for (let row = 0; row < column.knobKeys.length; row++) {
            const rowY = gridTopY + headerHeight + 2 + (row * knobBlockHeight);
            buildReadyDialogGridKnobRow(
                eventPlayer,
                containerBase,
                playerId,
                column.knobKeys[row],
                column.knobLabels[row],
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
            column.supportLabel ?? mod.Message(mod.stringkeys.twl.system.genericCounter, " "),
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
    const confirmButtonX = laneLeftX + Math.floor((READY_DIALOG_CONTENT_LANE_WIDTH - READY_DIALOG_CONFIRM_BUTTON_WIDTH) / 2);
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
    addCenteredButtonText(
        modeConfirmLabelId,
        READY_DIALOG_CONFIRM_BUTTON_WIDTH,
        READY_DIALOG_SMALL_BUTTON_HEIGHT,
        mod.Message(mod.stringkeys.twl.readyDialog.confirmSettingsLabel),
        eventPlayer,
        confirmBorder ?? containerBase,
        12
    );
}
