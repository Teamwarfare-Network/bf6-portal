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

    mod.AddUIText(
        readyHeaderId,
        mod.CreateVector(-11, -5, 0),
        mod.CreateVector(900, 22, 0),
        mod.UIAnchor.TopLeft,
        mod.Message(mod.stringkeys.twl.readyDialog.header),
        eventPlayer
    );
    const readyHeader = mod.FindUIWidgetWithName(readyHeaderId, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(readyHeader, 0);
    mod.SetUITextSize(readyHeader, 20);
    applyReadyDialogLabelTextColor(readyHeader);
    mod.SetUIWidgetParent(readyHeader, containerBase);

    mod.AddUIText(
        readyHeader2Id,
        mod.CreateVector(-11, 19, 0),
        mod.CreateVector(900, 20, 0),
        mod.UIAnchor.TopLeft,
        mod.Message(mod.stringkeys.twl.readyDialog.header2),
        eventPlayer
    );
    const readyHeader2 = mod.FindUIWidgetWithName(readyHeader2Id, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(readyHeader2, 0);
    mod.SetUITextSize(readyHeader2, 16);
    applyReadyDialogLabelTextColor(readyHeader2);
    mod.SetUIWidgetParent(readyHeader2, containerBase);

    mod.AddUIText(
        readyHeader3Id,
        mod.CreateVector(-11, 39, 0),
        mod.CreateVector(900, 20, 0),
        mod.UIAnchor.TopLeft,
        mod.Message(mod.stringkeys.twl.readyDialog.header3),
        eventPlayer
    );
    const readyHeader3 = mod.FindUIWidgetWithName(readyHeader3Id, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(readyHeader3, 0);
    mod.SetUITextSize(readyHeader3, 16);
    applyReadyDialogLabelTextColor(readyHeader3);
    mod.SetUIWidgetParent(readyHeader3, containerBase);

    mod.AddUIText(
        readyHeader4Id,
        mod.CreateVector(-11, 59, 0),
        mod.CreateVector(900, 20, 0),
        mod.UIAnchor.TopLeft,
        mod.Message(mod.stringkeys.twl.readyDialog.header4, Math.floor(VEHICLE_SPAWNER_KEEP_ALIVE_ABANDON_RADIUS)),
        eventPlayer
    );
    const readyHeader4 = mod.FindUIWidgetWithName(readyHeader4Id, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(readyHeader4, 0);
    mod.SetUITextSize(readyHeader4, 16);
    applyReadyDialogLabelTextColor(readyHeader4);
    mod.SetUIWidgetParent(readyHeader4, containerBase);

    mod.AddUIText(
        readyHeader5Id,
        mod.CreateVector(-11, 79, 0),
        mod.CreateVector(900, 20, 0),
        mod.UIAnchor.TopLeft,
        mod.Message(mod.stringkeys.twl.readyDialog.header5),
        eventPlayer
    );
    const readyHeader5 = mod.FindUIWidgetWithName(readyHeader5Id, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(readyHeader5, 0);
    mod.SetUITextSize(readyHeader5, 16);
    applyReadyDialogLabelTextColor(readyHeader5);
    mod.SetUIWidgetParent(readyHeader5, containerBase);

    mod.AddUIText(
        readyHeader6Id,
        mod.CreateVector(-11, 99, 0),
        mod.CreateVector(900, 20, 0),
        mod.UIAnchor.TopLeft,
        mod.Message(mod.stringkeys.twl.readyDialog.header6),
        eventPlayer
    );
    const readyHeader6 = mod.FindUIWidgetWithName(readyHeader6Id, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(readyHeader6, 0);
    mod.SetUITextSize(readyHeader6, 16);
    applyReadyDialogLabelTextColor(readyHeader6);
    mod.SetUIWidgetParent(readyHeader6, containerBase);

    const readyMapLabelId = UI_READY_DIALOG_MAP_LABEL_ID + playerId;
    const readyMapValueId = UI_READY_DIALOG_MAP_VALUE_ID + playerId;
    const mapLabelX = ADMIN_PANEL_OFFSET_X + ADMIN_PANEL_TOGGLE_WIDTH + 70;
    const mapValueX = ADMIN_PANEL_OFFSET_X + ADMIN_PANEL_TOGGLE_WIDTH - 63;
    const mapLabelY = ADMIN_PANEL_OFFSET_Y;
    const mapLabelSizeX = 60;
    const mapValueSizeX = 170;

    mod.AddUIText(
        readyMapLabelId,
        mod.CreateVector(mapLabelX, mapLabelY, 0),
        mod.CreateVector(mapLabelSizeX, 20, 0),
        mod.UIAnchor.TopRight,
        mod.Message(mod.stringkeys.twl.readyDialog.mapLabel),
        eventPlayer
    );
    const readyMapLabel = mod.FindUIWidgetWithName(readyMapLabelId, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(readyMapLabel, 0);
    mod.SetUITextSize(readyMapLabel, 12);
    applyReadyDialogLabelTextColor(readyMapLabel);
    mod.SetUIWidgetParent(readyMapLabel, mod.GetUIRoot());

    mod.AddUIText(
        readyMapValueId,
        mod.CreateVector(mapValueX, mapLabelY, 0),
        mod.CreateVector(mapValueSizeX, 20, 0),
        mod.UIAnchor.TopRight,
        mod.Message(getMapNameKey(ACTIVE_MAP_KEY)),
        eventPlayer
    );
    const readyMapValue = mod.FindUIWidgetWithName(readyMapValueId, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(readyMapValue, 0);
    mod.SetUITextSize(readyMapValue, 12);
    applyReadyDialogLabelTextColor(readyMapValue);
    mod.SetUIWidgetParent(readyMapValue, mod.GetUIRoot());
    updateReadyDialogMapLabelForPid(playerId);
}

function buildReadyDialogMatchupAndPlayersSection(
    eventPlayer: mod.Player,
    containerBase: mod.UIWidget,
    playerId: number,
    bestOfY: number,
    bestOfButtonSizeX: number,
    bestOfButtonSizeY: number,
    bestOfLabelSizeX: number,
    bestOfLabelSizeY: number
): void {
    const matchupDecId = UI_READY_DIALOG_MATCHUP_DEC_ID + playerId;
    const matchupDecLabelId = UI_READY_DIALOG_MATCHUP_DEC_LABEL_ID + playerId;
    const matchupLabelId = UI_READY_DIALOG_MATCHUP_LABEL_ID + playerId;
    const matchupIncId = UI_READY_DIALOG_MATCHUP_INC_ID + playerId;
    const matchupIncLabelId = UI_READY_DIALOG_MATCHUP_INC_LABEL_ID + playerId;
    const matchupMinPlayersId = UI_READY_DIALOG_MATCHUP_MINPLAYERS_ID + playerId;
    const matchupMinPlayersTotalId = UI_READY_DIALOG_MATCHUP_MINPLAYERS_TOTAL_ID + playerId;

    const matchupY = bestOfY + bestOfButtonSizeY + 4;
    const matchupLabelSizeX = bestOfLabelSizeX + 30;
    const matchupLabelOffsetX = -72;

    const matchupDecBorder = addOutlinedButton(
        matchupDecId,
        125,
        matchupY,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        containerBase,
        eventPlayer
    );

    const matchupDecLabel = addCenteredButtonText(
        matchupDecLabelId,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.ui.minus),
        eventPlayer,
        matchupDecBorder ?? containerBase
    );
    if (matchupDecLabel) {
        mod.SetUITextSize(matchupDecLabel, 14);
    }

    mod.AddUIText(
        matchupLabelId,
        mod.CreateVector(matchupLabelOffsetX, matchupY, 0),
        mod.CreateVector(matchupLabelSizeX, bestOfLabelSizeY, 0),
        mod.UIAnchor.TopRight,
        isMatchLive()
            ? mod.Message(mod.stringkeys.twl.system.genericCounter, "")
            : mod.Message(mod.stringkeys.twl.readyDialog.matchupFormat, 1, 0),
        eventPlayer
    );
    const matchupLabel = mod.FindUIWidgetWithName(matchupLabelId, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(matchupLabel, 0);
    mod.SetUITextSize(matchupLabel, 14);
    mod.SetUIWidgetVisible(matchupLabel, !isMatchLive());
    applyReadyDialogLabelTextColor(matchupLabel);
    mod.SetUIWidgetParent(matchupLabel, containerBase);

    const matchupIncBorder = addOutlinedButton(
        matchupIncId,
        -3,
        matchupY,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        containerBase,
        eventPlayer
    );

    const matchupIncLabel = addCenteredButtonText(
        matchupIncLabelId,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.ui.plus),
        eventPlayer,
        matchupIncBorder ?? containerBase
    );
    if (matchupIncLabel) {
        mod.SetUITextSize(matchupIncLabel, 14);
    }

    const playersDecId = UI_READY_DIALOG_MINPLAYERS_DEC_ID + playerId;
    const playersDecLabelId = UI_READY_DIALOG_MINPLAYERS_DEC_LABEL_ID + playerId;
    const playersIncId = UI_READY_DIALOG_MINPLAYERS_INC_ID + playerId;
    const playersIncLabelId = UI_READY_DIALOG_MINPLAYERS_INC_LABEL_ID + playerId;
    const playersY = matchupY + bestOfButtonSizeY + 20;
    const playersLabelSizeX = bestOfLabelSizeX + 30;
    const playersLabelOffsetX = -72;
    const playersLabelOffsetY = 4;

    const playersDecBorder = addOutlinedButton(
        playersDecId,
        125,
        playersY,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        containerBase,
        eventPlayer
    );

    const playersDecLabel = addCenteredButtonText(
        playersDecLabelId,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.ui.minus),
        eventPlayer,
        playersDecBorder ?? containerBase
    );
    if (playersDecLabel) {
        mod.SetUITextSize(playersDecLabel, 14);
    }

    const autoStartCounts = getAutoStartMinPlayerCounts();
    mod.AddUIText(
        matchupMinPlayersId,
        mod.CreateVector(playersLabelOffsetX, playersY + playersLabelOffsetY, 0),
        mod.CreateVector(playersLabelSizeX, 16, 0),
        mod.UIAnchor.TopRight,
        mod.Message(mod.stringkeys.twl.readyDialog.playersFormat, autoStartCounts.left, autoStartCounts.right),
        eventPlayer
    );
    const matchupMinPlayers = mod.FindUIWidgetWithName(matchupMinPlayersId, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(matchupMinPlayers, 0);
    mod.SetUITextSize(matchupMinPlayers, 14);
    applyReadyDialogLabelTextColor(matchupMinPlayers);
    mod.SetUIWidgetParent(matchupMinPlayers, containerBase);

    const playersTotalY = playersY + bestOfButtonSizeY - 1;
    mod.AddUIText(
        matchupMinPlayersTotalId,
        mod.CreateVector(-42 - (bestOfLabelSizeX + 80) / 4, playersTotalY, 0),
        mod.CreateVector(bestOfLabelSizeX + 80, 16, 0),
        mod.UIAnchor.TopRight,
        mod.Message(mod.stringkeys.twl.readyDialog.minPlayersToStartFormat, autoStartCounts.total),
        eventPlayer
    );
    const matchupMinPlayersTotal = mod.FindUIWidgetWithName(matchupMinPlayersTotalId, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(matchupMinPlayersTotal, 0);
    mod.SetUITextSize(matchupMinPlayersTotal, 12);
    applyReadyDialogLabelTextColor(matchupMinPlayersTotal);
    mod.SetUIWidgetParent(matchupMinPlayersTotal, containerBase);

    const playersIncBorder = addOutlinedButton(
        playersIncId,
        -3,
        playersY,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        containerBase,
        eventPlayer
    );

    const playersIncLabel = addCenteredButtonText(
        playersIncLabelId,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.ui.plus),
        eventPlayer,
        playersIncBorder ?? containerBase
    );
    if (playersIncLabel) {
        mod.SetUITextSize(playersIncLabel, 14);
    }

    updateMatchupLabelForPid(playerId);
    updateMatchupReadoutsForPid(playerId);
    updateReadyDialogModeConfigForPid(playerId);
}

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
    addCenteredButtonText(
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
    addCenteredButtonText(
        readyButtonLabelId,
        READY_DIALOG_MAIN_BUTTON_WIDTH,
        READY_DIALOG_MAIN_BUTTON_HEIGHT,
        mod.Message(mod.stringkeys.twl.readyDialog.buttons.ready),
        eventPlayer,
        readyButtonBorder ?? containerBase
    );
    updateReadyToggleButtonForViewer(eventPlayer, playerId);

    const debugTimelimitId = UI_READY_DIALOG_DEBUG_TIMELIMIT_ID + playerId;
    if (SHOW_DEBUG_TIMELIMIT) {
        const debugTimeLimitSeconds = Math.floor(mod.GetMatchTimeElapsed() + mod.GetMatchTimeRemaining());
        mod.AddUIText(
            debugTimelimitId,
            mod.CreateVector(-320, -160, 0),
            mod.CreateVector(80, 28, 0),
            mod.UIAnchor.TopRight,
            mod.Message(mod.stringkeys.twl.teamSwitch.debugTimeLimit, debugTimeLimitSeconds),
            eventPlayer
        );
        const debugTimelimit = mod.FindUIWidgetWithName(debugTimelimitId, mod.GetUIRoot());
        mod.SetUIWidgetParent(debugTimelimit, containerBase);
        mod.SetUIWidgetBgAlpha(debugTimelimit, 0);
        mod.SetUITextSize(debugTimelimit, 12);
        applyReadyDialogLabelTextColor(debugTimelimit);
    } else {
        const existingDebug = safeFind(debugTimelimitId);
        if (existingDebug) mod.SetUIWidgetVisible(existingDebug, false);
    }

    // UI caching note: these widgets are created once and then hidden/shown on open/close.
    ensureAdminPanelWidgets(eventPlayer, playerId);

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
    addCenteredButtonText(
        buttonCancelLabelId,
        READY_DIALOG_MAIN_BUTTON_WIDTH,
        READY_DIALOG_MAIN_BUTTON_HEIGHT,
        mod.Message(mod.stringkeys.twl.teamSwitch.buttons.cancel),
        eventPlayer,
        buttonCancelBorder ?? containerBase
    );

    updateHelpTextVisibilityForPlayer(eventPlayer);
}
