// @ts-nocheck
// Module: ready-dialog/dialog-build-mode-config -- mode/game settings controls inside the ready dialog

function buildReadyDialogModeConfigSection(
    eventPlayer: mod.Player,
    containerBase: mod.UIWidget,
    playerId: number,
    bestOfY: number,
    bestOfButtonSizeX: number,
    bestOfButtonSizeY: number,
    bestOfLabelSizeY: number,
    leftSectionLeftButtonX: number,
    leftSectionRightButtonX: number,
    leftSectionValueX: number,
    leftSectionLabelX: number,
    leftSectionLabelWidth: number,
    leftSectionValueWidth: number,
    leftSectionRowGap: number,
    confirmButtonX: number,
    confirmButtonWidth: number,
    resetButtonX: number,
    resetButtonWidth: number
): void {
    const gameModeLabelId = UI_READY_DIALOG_MODE_GAME_LABEL_ID + playerId;
    const gameModeDecId = UI_READY_DIALOG_MODE_GAME_DEC_ID + playerId;
    const gameModeDecLabelId = UI_READY_DIALOG_MODE_GAME_DEC_LABEL_ID + playerId;
    const gameModeValueId = UI_READY_DIALOG_MODE_GAME_VALUE_ID + playerId;
    const gameModeIncId = UI_READY_DIALOG_MODE_GAME_INC_ID + playerId;
    const gameModeIncLabelId = UI_READY_DIALOG_MODE_GAME_INC_LABEL_ID + playerId;

    const modeSettingsLabelId = UI_READY_DIALOG_MODE_SETTINGS_LABEL_ID + playerId;
    const modeSettingsDecId = UI_READY_DIALOG_MODE_SETTINGS_DEC_ID + playerId;
    const modeSettingsDecLabelId = UI_READY_DIALOG_MODE_SETTINGS_DEC_LABEL_ID + playerId;
    const modeSettingsValueId = UI_READY_DIALOG_MODE_SETTINGS_VALUE_ID + playerId;
    const modeSettingsIncId = UI_READY_DIALOG_MODE_SETTINGS_INC_ID + playerId;
    const modeSettingsIncLabelId = UI_READY_DIALOG_MODE_SETTINGS_INC_LABEL_ID + playerId;

    const vehiclesT1LabelId = UI_READY_DIALOG_MODE_VEHICLES_T1_LABEL_ID + playerId;
    const vehiclesT1DecId = UI_READY_DIALOG_MODE_VEHICLES_T1_DEC_ID + playerId;
    const vehiclesT1DecLabelId = UI_READY_DIALOG_MODE_VEHICLES_T1_DEC_LABEL_ID + playerId;
    const vehiclesT1ValueId = UI_READY_DIALOG_MODE_VEHICLES_T1_VALUE_ID + playerId;
    const vehiclesT1IncId = UI_READY_DIALOG_MODE_VEHICLES_T1_INC_ID + playerId;
    const vehiclesT1IncLabelId = UI_READY_DIALOG_MODE_VEHICLES_T1_INC_LABEL_ID + playerId;

    const vehiclesT2LabelId = UI_READY_DIALOG_MODE_VEHICLES_T2_LABEL_ID + playerId;
    const vehiclesT2DecId = UI_READY_DIALOG_MODE_VEHICLES_T2_DEC_ID + playerId;
    const vehiclesT2DecLabelId = UI_READY_DIALOG_MODE_VEHICLES_T2_DEC_LABEL_ID + playerId;
    const vehiclesT2ValueId = UI_READY_DIALOG_MODE_VEHICLES_T2_VALUE_ID + playerId;
    const vehiclesT2IncId = UI_READY_DIALOG_MODE_VEHICLES_T2_INC_ID + playerId;
    const vehiclesT2IncLabelId = UI_READY_DIALOG_MODE_VEHICLES_T2_INC_LABEL_ID + playerId;

    const modeConfirmId = UI_READY_DIALOG_MODE_CONFIRM_ID + playerId;
    const modeConfirmLabelId = UI_READY_DIALOG_MODE_CONFIRM_LABEL_ID + playerId;
    const modeResetId = UI_READY_DIALOG_MODE_RESET_ID + playerId;
    const modeResetLabelId = UI_READY_DIALOG_MODE_RESET_LABEL_ID + playerId;

    const gameModeY = bestOfY;
    const modeSettingsY = gameModeY + leftSectionRowGap;
    const vehiclesT1Y = modeSettingsY + leftSectionRowGap;
    const vehiclesT2Y = vehiclesT1Y + leftSectionRowGap;
    const confirmY = vehiclesT2Y + leftSectionRowGap + 4;

    addRightAlignedLabel(
        gameModeLabelId,
        leftSectionLabelX,
        gameModeY,
        leftSectionLabelWidth,
        bestOfLabelSizeY,
        mod.UIAnchor.TopRight,
        mod.Message(mod.stringkeys.twl.readyDialog.gameModeLabel),
        eventPlayer,
        containerBase,
        12
    );

    const gameModeDecBorder = addOutlinedButton(
        gameModeDecId,
        leftSectionLeftButtonX,
        gameModeY,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        containerBase,
        eventPlayer
    );
    const gameModeDecLabel = addCenteredButtonText(
        gameModeDecLabelId,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.ui.left),
        eventPlayer,
        gameModeDecBorder ?? containerBase
    );
    if (gameModeDecLabel) mod.SetUITextSize(gameModeDecLabel, 14);

    mod.AddUIText(
        gameModeValueId,
        mod.CreateVector(leftSectionValueX, gameModeY, 0),
        mod.CreateVector(leftSectionValueWidth, bestOfLabelSizeY, 0),
        mod.UIAnchor.TopRight,
        mod.Message(State.round.modeConfig.gameMode),
        eventPlayer
    );
    const gameModeValue = mod.FindUIWidgetWithName(gameModeValueId, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(gameModeValue, 0);
    mod.SetUITextSize(gameModeValue, 12);
    applyReadyDialogLabelTextColor(gameModeValue);
    mod.SetUIWidgetParent(gameModeValue, containerBase);

    const gameModeIncBorder = addOutlinedButton(
        gameModeIncId,
        leftSectionRightButtonX,
        gameModeY,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        containerBase,
        eventPlayer
    );
    const gameModeIncLabel = addCenteredButtonText(
        gameModeIncLabelId,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.ui.right),
        eventPlayer,
        gameModeIncBorder ?? containerBase
    );
    if (gameModeIncLabel) mod.SetUITextSize(gameModeIncLabel, 14);

    addRightAlignedLabel(
        modeSettingsLabelId,
        leftSectionLabelX,
        modeSettingsY,
        leftSectionLabelWidth,
        bestOfLabelSizeY,
        mod.UIAnchor.TopRight,
        mod.Message(mod.stringkeys.twl.readyDialog.modeSettingsLabel),
        eventPlayer,
        containerBase,
        12
    );

    const modeSettingsDecBorder = addOutlinedButton(
        modeSettingsDecId,
        leftSectionLeftButtonX,
        modeSettingsY,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        containerBase,
        eventPlayer
    );
    const modeSettingsDecLabel = addCenteredButtonText(
        modeSettingsDecLabelId,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.ui.left),
        eventPlayer,
        modeSettingsDecBorder ?? containerBase
    );
    if (modeSettingsDecLabel) mod.SetUITextSize(modeSettingsDecLabel, 14);

    mod.AddUIText(
        modeSettingsValueId,
        mod.CreateVector(leftSectionValueX, modeSettingsY, 0),
        mod.CreateVector(leftSectionValueWidth, bestOfLabelSizeY, 0),
        mod.UIAnchor.TopRight,
        mod.Message(mod.stringkeys.twl.readyDialog.modeSettingAircraftCeilingFormat, Math.floor(State.round.modeConfig.aircraftCeiling)),
        eventPlayer
    );
    const modeSettingsValue = mod.FindUIWidgetWithName(modeSettingsValueId, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(modeSettingsValue, 0);
    mod.SetUITextSize(modeSettingsValue, 12);
    applyReadyDialogLabelTextColor(modeSettingsValue);
    mod.SetUIWidgetParent(modeSettingsValue, containerBase);

    const modeSettingsIncBorder = addOutlinedButton(
        modeSettingsIncId,
        leftSectionRightButtonX,
        modeSettingsY,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        containerBase,
        eventPlayer
    );
    const modeSettingsIncLabel = addCenteredButtonText(
        modeSettingsIncLabelId,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.ui.right),
        eventPlayer,
        modeSettingsIncBorder ?? containerBase
    );
    if (modeSettingsIncLabel) mod.SetUITextSize(modeSettingsIncLabel, 14);

    addRightAlignedLabel(
        vehiclesT1LabelId,
        leftSectionLabelX,
        vehiclesT1Y,
        leftSectionLabelWidth,
        bestOfLabelSizeY,
        mod.UIAnchor.TopRight,
        mod.Message(mod.stringkeys.twl.readyDialog.vehiclesLabelFormat, getTeamNameKey(TeamID.Team1)),
        eventPlayer,
        containerBase,
        12
    );

    const vehiclesT1DecBorder = addOutlinedButton(
        vehiclesT1DecId,
        leftSectionLeftButtonX,
        vehiclesT1Y,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        containerBase,
        eventPlayer
    );
    const vehiclesT1DecLabel = addCenteredButtonText(
        vehiclesT1DecLabelId,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.ui.left),
        eventPlayer,
        vehiclesT1DecBorder ?? containerBase
    );
    if (vehiclesT1DecLabel) mod.SetUITextSize(vehiclesT1DecLabel, 14);

    mod.AddUIText(
        vehiclesT1ValueId,
        mod.CreateVector(leftSectionValueX, vehiclesT1Y, 0),
        mod.CreateVector(leftSectionValueWidth, bestOfLabelSizeY, 0),
        mod.UIAnchor.TopRight,
        mod.Message(State.round.modeConfig.vehiclesT1),
        eventPlayer
    );
    const vehiclesT1Value = mod.FindUIWidgetWithName(vehiclesT1ValueId, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(vehiclesT1Value, 0);
    mod.SetUITextSize(vehiclesT1Value, 12);
    applyReadyDialogLabelTextColor(vehiclesT1Value);
    mod.SetUIWidgetParent(vehiclesT1Value, containerBase);

    const vehiclesT1IncBorder = addOutlinedButton(
        vehiclesT1IncId,
        leftSectionRightButtonX,
        vehiclesT1Y,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        containerBase,
        eventPlayer
    );
    const vehiclesT1IncLabel = addCenteredButtonText(
        vehiclesT1IncLabelId,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.ui.right),
        eventPlayer,
        vehiclesT1IncBorder ?? containerBase
    );
    if (vehiclesT1IncLabel) mod.SetUITextSize(vehiclesT1IncLabel, 14);

    addRightAlignedLabel(
        vehiclesT2LabelId,
        leftSectionLabelX,
        vehiclesT2Y,
        leftSectionLabelWidth,
        bestOfLabelSizeY,
        mod.UIAnchor.TopRight,
        mod.Message(mod.stringkeys.twl.readyDialog.vehiclesLabelFormat, getTeamNameKey(TeamID.Team2)),
        eventPlayer,
        containerBase,
        12
    );

    const vehiclesT2DecBorder = addOutlinedButton(
        vehiclesT2DecId,
        leftSectionLeftButtonX,
        vehiclesT2Y,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        containerBase,
        eventPlayer
    );
    const vehiclesT2DecLabel = addCenteredButtonText(
        vehiclesT2DecLabelId,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.ui.left),
        eventPlayer,
        vehiclesT2DecBorder ?? containerBase
    );
    if (vehiclesT2DecLabel) mod.SetUITextSize(vehiclesT2DecLabel, 14);

    mod.AddUIText(
        vehiclesT2ValueId,
        mod.CreateVector(leftSectionValueX, vehiclesT2Y, 0),
        mod.CreateVector(leftSectionValueWidth, bestOfLabelSizeY, 0),
        mod.UIAnchor.TopRight,
        mod.Message(State.round.modeConfig.vehiclesT2),
        eventPlayer
    );
    const vehiclesT2Value = mod.FindUIWidgetWithName(vehiclesT2ValueId, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(vehiclesT2Value, 0);
    mod.SetUITextSize(vehiclesT2Value, 12);
    applyReadyDialogLabelTextColor(vehiclesT2Value);
    mod.SetUIWidgetParent(vehiclesT2Value, containerBase);

    const vehiclesT2IncBorder = addOutlinedButton(
        vehiclesT2IncId,
        leftSectionRightButtonX,
        vehiclesT2Y,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        containerBase,
        eventPlayer
    );
    const vehiclesT2IncLabel = addCenteredButtonText(
        vehiclesT2IncLabelId,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.ui.right),
        eventPlayer,
        vehiclesT2IncBorder ?? containerBase
    );
    if (vehiclesT2IncLabel) mod.SetUITextSize(vehiclesT2IncLabel, 14);

    const confirmBorder = addOutlinedButton(
        modeConfirmId,
        confirmButtonX,
        confirmY,
        confirmButtonWidth,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        containerBase,
        eventPlayer
    );
    const modeConfirmLabel = addCenteredButtonText(
        modeConfirmLabelId,
        confirmButtonWidth,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.readyDialog.confirmSettingsLabel),
        eventPlayer,
        confirmBorder ?? containerBase
    );
    if (modeConfirmLabel) mod.SetUITextSize(modeConfirmLabel, 12);

    const resetBorder = addOutlinedButton(
        modeResetId,
        resetButtonX,
        confirmY,
        resetButtonWidth,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        containerBase,
        eventPlayer
    );
    const modeResetLabel = addCenteredButtonText(
        modeResetLabelId,
        resetButtonWidth,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.readyDialog.resetSettingsLabel),
        eventPlayer,
        resetBorder ?? containerBase
    );
    if (modeResetLabel) mod.SetUITextSize(modeResetLabel, 12);
}
