// @ts-nocheck
// Module: ready-dialog/dialog-build-roster -- ready dialog roster panel/widget construction

function buildReadyDialogRosterSection(
    eventPlayer: mod.Player,
    containerBase: mod.UIWidget,
    playerId: number
): void {
    const buildHiddenRosterText = (
        id: string,
        parent: mod.UIWidget,
        x: number,
        y: number,
        width: number,
        height: number,
        label: mod.Message,
        textSize: number,
        textAnchor: mod.UIAnchor,
        visible: boolean = false
    ): mod.UIWidget | undefined => {
        return addReadyDialogText(
            id,
            x,
            y,
            width,
            height,
            mod.UIAnchor.TopLeft,
            textAnchor,
            label,
            eventPlayer,
            parent,
            textSize,
            visible,
            READY_DIALOG_LABEL_TEXT_COLOR
        );
    };

    const containerWidth = READY_DIALOG_CONTAINER_WIDTH;
    const readyRosterPanelWidth = 566;
    const readyRosterPanelHeight = 440;
    const readyRosterPanelGap = 68;
    const readyRosterTotalWidth = READY_DIALOG_CONTENT_LANE_WIDTH;
    const laneLeftX = Math.floor((containerWidth - READY_DIALOG_CONTENT_LANE_WIDTH) / 2) + READY_DIALOG_CONTENT_OFFSET_X;
    const readyRosterPanelMargin =
        laneLeftX +
        Math.floor((readyRosterTotalWidth - ((readyRosterPanelWidth * 2) + readyRosterPanelGap)) / 2) +
        READY_DIALOG_ROSTER_VISUAL_OFFSET_X;
    const readyRosterPanelY = 175;

    // Left and right roster containers (children are parented to these containers).
    const t1ContainerId = UI_READY_DIALOG_TEAM1_CONTAINER_ID + playerId;
    const t2ContainerId = UI_READY_DIALOG_TEAM2_CONTAINER_ID + playerId;

    mod.AddUIContainer(
        t1ContainerId,
        mod.CreateVector(readyRosterPanelMargin, readyRosterPanelY, 0),
        mod.CreateVector(readyRosterPanelWidth, readyRosterPanelHeight, 0),
        mod.UIAnchor.TopLeft,
        containerBase,
        true,
        1,
        READY_PANEL_T1_BG_COLOR,
        READY_PANEL_BG_ALPHA,
        mod.UIBgFill.Solid,
        mod.UIDepth.AboveGameUI,
        eventPlayer
    );
    mod.AddUIContainer(
        t2ContainerId,
        mod.CreateVector(readyRosterPanelMargin + readyRosterPanelWidth + readyRosterPanelGap, readyRosterPanelY, 0),
        mod.CreateVector(readyRosterPanelWidth, readyRosterPanelHeight, 0),
        mod.UIAnchor.TopLeft,
        containerBase,
        true,
        1,
        READY_PANEL_T2_BG_COLOR,
        READY_PANEL_BG_ALPHA,
        mod.UIBgFill.Solid,
        mod.UIDepth.AboveGameUI,
        eventPlayer
    );

    const t1Container = safeFind(t1ContainerId);
    const t2Container = safeFind(t2ContainerId);
    if (!t1Container || !t2Container) return;

    const teamLabelY = 0;
    const teamLabelHeight = 24;
    const teamLabelWidth = readyRosterPanelWidth;
    const t1LabelId = UI_READY_DIALOG_TEAM1_LABEL_ID + playerId;
    const t2LabelId = UI_READY_DIALOG_TEAM2_LABEL_ID + playerId;
    const t1Label = buildHiddenRosterText(
        t1LabelId,
        t1Container,
        0,
        teamLabelY,
        teamLabelWidth,
        teamLabelHeight,
        mod.Message(getTeamNameKey(TeamID.Team1)),
        20,
        mod.UIAnchor.Center,
        true
    );
    if (t1Label) {
        mod.SetUIWidgetBgAlpha(t1Label, 0);
        mod.SetUITextAnchor(t1Label, mod.UIAnchor.Center);
    }

    const t2Label = buildHiddenRosterText(
        t2LabelId,
        t2Container,
        0,
        teamLabelY,
        teamLabelWidth,
        teamLabelHeight,
        mod.Message(getTeamNameKey(TeamID.Team2)),
        20,
        mod.UIAnchor.Center,
        true
    );
    if (t2Label) {
        mod.SetUIWidgetBgAlpha(t2Label, 0);
        mod.SetUITextAnchor(t2Label, mod.UIAnchor.Center);
    }

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

        const t1Name = buildHiddenRosterText(
            t1NameId,
            t1Container,
            colNameX,
            y,
            colNameW,
            rowH,
            mod.Message(mod.stringkeys.twl.system.genericCounter, " "),
            14,
            mod.UIAnchor.TopLeft
        );
        if (t1Name) mod.SetUIWidgetBgAlpha(t1Name, 0);

        const t1Ready = buildHiddenRosterText(
            t1ReadyId,
            t1Container,
            colReadyX,
            y,
            colStatusW,
            rowH,
            mod.Message(mod.stringkeys.twl.system.genericCounter, " "),
            14,
            mod.UIAnchor.TopLeft
        );
        if (t1Ready) mod.SetUIWidgetBgAlpha(t1Ready, 0);

        const t1Base = buildHiddenRosterText(
            t1BaseId,
            t1Container,
            colBaseX,
            y,
            colStatusW,
            rowH,
            mod.Message(mod.stringkeys.twl.system.genericCounter, " "),
            14,
            mod.UIAnchor.TopLeft
        );
        if (t1Base) mod.SetUIWidgetBgAlpha(t1Base, 0);

        const t2NameId = UI_READY_DIALOG_T2_ROW_NAME_ID + playerId + "_" + row;
        const t2ReadyId = UI_READY_DIALOG_T2_ROW_READY_ID + playerId + "_" + row;
        const t2BaseId = UI_READY_DIALOG_T2_ROW_BASE_ID + playerId + "_" + row;

        const t2Name = buildHiddenRosterText(
            t2NameId,
            t2Container,
            colNameX,
            y,
            colNameW,
            rowH,
            mod.Message(mod.stringkeys.twl.system.genericCounter, " "),
            14,
            mod.UIAnchor.TopLeft
        );
        if (t2Name) mod.SetUIWidgetBgAlpha(t2Name, 0);

        const t2Ready = buildHiddenRosterText(
            t2ReadyId,
            t2Container,
            colReadyX,
            y,
            colStatusW,
            rowH,
            mod.Message(mod.stringkeys.twl.system.genericCounter, " "),
            14,
            mod.UIAnchor.TopLeft
        );
        if (t2Ready) mod.SetUIWidgetBgAlpha(t2Ready, 0);

        const t2Base = buildHiddenRosterText(
            t2BaseId,
            t2Container,
            colBaseX,
            y,
            colStatusW,
            rowH,
            mod.Message(mod.stringkeys.twl.system.genericCounter, " "),
            14,
            mod.UIAnchor.TopLeft
        );
        if (t2Base) mod.SetUIWidgetBgAlpha(t2Base, 0);
    }
    refreshReadyDialogRosterForViewer(eventPlayer, playerId);
}


