// @ts-nocheck
// Module: ready-dialog/dialog-build-roster -- ready dialog roster panel/widget construction

function buildReadyDialogRosterSection(
    eventPlayer: mod.Player,
    containerBase: mod.UIWidget,
    playerId: number
): void {
    const readyRosterPanelWidth = 580;
    const readyRosterPanelHeight = 440;
    const readyRosterPanelGap = 40;
    const readyRosterPanelMargin = 40;
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

    const t1Container = mod.FindUIWidgetWithName(t1ContainerId, mod.GetUIRoot());
    const t2Container = mod.FindUIWidgetWithName(t2ContainerId, mod.GetUIRoot());

    const teamLabelY = 0;
    const teamLabelHeight = 24;
    const teamLabelWidth = readyRosterPanelWidth;
    const t1LabelId = UI_READY_DIALOG_TEAM1_LABEL_ID + playerId;
    const t2LabelId = UI_READY_DIALOG_TEAM2_LABEL_ID + playerId;
    mod.AddUIText(
        t1LabelId,
        mod.CreateVector(0, teamLabelY, 0),
        mod.CreateVector(teamLabelWidth, teamLabelHeight, 0),
        mod.UIAnchor.TopCenter,
        mod.Message(getTeamNameKey(TeamID.Team1)),
        eventPlayer
    );
    const t1Label = mod.FindUIWidgetWithName(t1LabelId, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(t1Label, 0);
    mod.SetUITextSize(t1Label, 20);
    mod.SetUIWidgetParent(t1Label, t1Container);

    mod.AddUIText(
        t2LabelId,
        mod.CreateVector(0, teamLabelY, 0),
        mod.CreateVector(teamLabelWidth, teamLabelHeight, 0),
        mod.UIAnchor.TopCenter,
        mod.Message(getTeamNameKey(TeamID.Team2)),
        eventPlayer
    );
    const t2Label = mod.FindUIWidgetWithName(t2LabelId, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(t2Label, 0);
    mod.SetUITextSize(t2Label, 20);
    mod.SetUIWidgetParent(t2Label, t2Container);

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
        const t1Name = mod.FindUIWidgetWithName(t1NameId, mod.GetUIRoot());
        mod.SetUIWidgetBgAlpha(t1Name, 0);
        mod.SetUITextSize(t1Name, 14);
        mod.SetUIWidgetParent(t1Name, t1Container);

        mod.AddUIText(t1ReadyId, mod.CreateVector(colReadyX, y, 0), mod.CreateVector(colStatusW, rowH, 0), mod.UIAnchor.TopLeft, mod.Message(mod.stringkeys.twl.system.genericCounter, ""), eventPlayer);
        const t1Ready = mod.FindUIWidgetWithName(t1ReadyId, mod.GetUIRoot());
        mod.SetUIWidgetBgAlpha(t1Ready, 0);
        mod.SetUITextSize(t1Ready, 14);
        mod.SetUIWidgetParent(t1Ready, t1Container);

        mod.AddUIText(t1BaseId, mod.CreateVector(colBaseX, y, 0), mod.CreateVector(colStatusW, rowH, 0), mod.UIAnchor.TopLeft, mod.Message(mod.stringkeys.twl.system.genericCounter, ""), eventPlayer);
        const t1Base = mod.FindUIWidgetWithName(t1BaseId, mod.GetUIRoot());
        mod.SetUIWidgetBgAlpha(t1Base, 0);
        mod.SetUITextSize(t1Base, 14);
        mod.SetUIWidgetParent(t1Base, t1Container);

        const t2NameId = UI_READY_DIALOG_T2_ROW_NAME_ID + playerId + "_" + row;
        const t2ReadyId = UI_READY_DIALOG_T2_ROW_READY_ID + playerId + "_" + row;
        const t2BaseId = UI_READY_DIALOG_T2_ROW_BASE_ID + playerId + "_" + row;

        mod.AddUIText(t2NameId, mod.CreateVector(colNameX, y, 0), mod.CreateVector(colNameW, rowH, 0), mod.UIAnchor.TopLeft, mod.Message(mod.stringkeys.twl.system.genericCounter, ""), eventPlayer);
        const t2Name = mod.FindUIWidgetWithName(t2NameId, mod.GetUIRoot());
        mod.SetUIWidgetBgAlpha(t2Name, 0);
        mod.SetUITextSize(t2Name, 14);
        mod.SetUIWidgetParent(t2Name, t2Container);

        mod.AddUIText(t2ReadyId, mod.CreateVector(colReadyX, y, 0), mod.CreateVector(colStatusW, rowH, 0), mod.UIAnchor.TopLeft, mod.Message(mod.stringkeys.twl.system.genericCounter, ""), eventPlayer);
        const t2Ready = mod.FindUIWidgetWithName(t2ReadyId, mod.GetUIRoot());
        mod.SetUIWidgetBgAlpha(t2Ready, 0);
        mod.SetUITextSize(t2Ready, 14);
        mod.SetUIWidgetParent(t2Ready, t2Container);

        mod.AddUIText(t2BaseId, mod.CreateVector(colBaseX, y, 0), mod.CreateVector(colStatusW, rowH, 0), mod.UIAnchor.TopLeft, mod.Message(mod.stringkeys.twl.system.genericCounter, ""), eventPlayer);
        const t2Base = mod.FindUIWidgetWithName(t2BaseId, mod.GetUIRoot());
        mod.SetUIWidgetBgAlpha(t2Base, 0);
        mod.SetUITextSize(t2Base, 14);
        mod.SetUIWidgetParent(t2Base, t2Container);
    }

    refreshReadyDialogRosterForViewer(eventPlayer, playerId);
}
