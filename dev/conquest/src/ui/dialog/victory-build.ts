// @ts-nocheck
// Module: ui/dialog/victory-build -- victory dialog construction for per-player HUD cache.

// Rebinds all victory dialog widget refs from authoritative per-player names after build or recovery.
function bindVictoryDialogRefsByName(pid: number, refs: TopHudShellRefs): void {
    refs.victoryRoot = safeFind(`VictoryDialogRoot_${pid}`);
    refs.victoryRestartText = safeFind(`VictoryDialog_Restart_${pid}`);

    refs.victoryTimeHoursTens = safeFind(`VictoryDialog_TimeHT_${pid}`);
    refs.victoryTimeHoursOnes = safeFind(`VictoryDialog_TimeHO_${pid}`);
    refs.victoryTimeMinutesTens = safeFind(`VictoryDialog_TimeMT_${pid}`);
    refs.victoryTimeMinutesOnes = safeFind(`VictoryDialog_TimeMO_${pid}`);
    refs.victoryTimeSecondsTens = safeFind(`VictoryDialog_TimeST_${pid}`);
    refs.victoryTimeSecondsOnes = safeFind(`VictoryDialog_TimeSO_${pid}`);

    refs.victoryAdminActionsText = safeFind(`VictoryDialog_AdminActions_${pid}`);
    refs.victoryResultText = safeFind(`VictoryDialog_Result_${pid}`);
    refs.victoryLeftCrown = safeFind(`VictoryDialog_LeftCrown_${pid}`);
    refs.victoryRightCrown = safeFind(`VictoryDialog_RightCrown_${pid}`);
    refs.victoryLeftTeamNameText = safeFind(`VictoryDialog_LeftTeamName_${pid}`);
    refs.victoryRightTeamNameText = safeFind(`VictoryDialog_RightTeamName_${pid}`);
    refs.victoryLeftTicketText = safeFind(`VictoryDialog_LeftTickets_${pid}`);
    refs.victoryRightTicketText = safeFind(`VictoryDialog_RightTickets_${pid}`);
    refs.victoryRosterRow = safeFind(`VictoryDialog_RosterRow_${pid}`);
    refs.victoryRosterLeftContainer = safeFind(`VictoryDialog_RosterLeft_${pid}`);
    refs.victoryRosterRightContainer = safeFind(`VictoryDialog_RosterRight_${pid}`);

    refs.victoryLeftRosterText = [];
    refs.victoryRightRosterText = [];
    for (let i = 0; i < TEAM_ROSTER_MAX_ROWS; i++) {
        refs.victoryLeftRosterText.push(safeFind(`VictoryDialog_LeftRoster_${pid}_${i}`));
        refs.victoryRightRosterText.push(safeFind(`VictoryDialog_RightRoster_${pid}_${i}`));
    }
}

// Builds the cached victory dialog widget tree for one player and binds all dialog refs.
function buildVictoryDialogWidgets(player: mod.Player, pid: number, refs: TopHudShellRefs): void {
    const modal = safeParseUI({
        name: `VictoryDialogRoot_${pid}`,
        type: "Container",
        playerId: player,
        position: [0, 135],
        size: [VICTORY_DIALOG_WIDTH, VICTORY_DIALOG_HEIGHT],
        anchor: mod.UIAnchor.Center,
        visible: false,
        padding: 0,
        bgColor: [VICTORY_BG_RGB[0], VICTORY_BG_RGB[1], VICTORY_BG_RGB[2]],
        bgAlpha: 0.95,
        bgFill: mod.UIBgFill.Solid,
        children: [
            {
                name: `VictoryDialog_Header1_${pid}`,
                type: "Text",
                position: [0, 14],
                size: [340, 22],
                anchor: mod.UIAnchor.TopCenter,
                visible: true,
                padding: 0,
                bgAlpha: 0,
                bgFill: mod.UIBgFill.None,
                textLabel: mod.Message(mod.stringkeys.twl.hud.branding.title),
                textColor: [1, 1, 1],
                textAlpha: 1,
                textSize: 18,
                textAnchor: mod.UIAnchor.Center,
            },
            {
                name: `VictoryDialog_Header2_${pid}`,
                type: "Text",
                position: [0, 36],
                size: [340, 22],
                anchor: mod.UIAnchor.TopCenter,
                visible: true,
                padding: 0,
                bgAlpha: 0,
                bgFill: mod.UIBgFill.None,
                textLabel: mod.Message(mod.stringkeys.twl.hud.branding.subtitle),
                textColor: [1, 1, 1],
                textAlpha: 1,
                textSize: 18,
                textAnchor: mod.UIAnchor.Center,
            },
            {
                name: `VictoryDialog_Screenshot_${pid}`,
                type: "Text",
                position: [0, 62],
                size: [340, 16],
                anchor: mod.UIAnchor.TopCenter,
                visible: true,
                padding: 0,
                bgAlpha: 0,
                bgFill: mod.UIBgFill.None,
                textLabel: mod.Message(mod.stringkeys.twl.victory.screenshotPrompt),
                textColor: [1, 1, 0],
                textAlpha: 1,
                textSize: 12,
                textAnchor: mod.UIAnchor.Center,
            },
            {
                name: `VictoryDialog_Restart_${pid}`,
                type: "Text",
                position: [0, 82],
                size: [340, 16],
                anchor: mod.UIAnchor.TopCenter,
                visible: true,
                padding: 0,
                bgAlpha: 0,
                bgFill: mod.UIBgFill.None,
                textLabel: mod.Message(mod.stringkeys.twl.victory.restartInFormat, MATCH_END_DELAY_SECONDS),
                textColor: [1, 1, 1],
                textAlpha: 1,
                textSize: 12,
                textAnchor: mod.UIAnchor.Center,
            },
            {
                name: `VictoryDialog_TotalTimeRow_${pid}`,
                type: "Container",
                position: [0, 102],
                size: [340, 16],
                anchor: mod.UIAnchor.TopCenter,
                visible: true,
                padding: 0,
                bgAlpha: 0,
                bgFill: mod.UIBgFill.None,
                children: [
                    {
                        name: `VictoryDialog_TotalTimeLabel_${pid}`,
                        type: "Text",
                        position: [-45, 0],
                        size: [130, 16],
                        anchor: mod.UIAnchor.Center,
                        visible: true,
                        padding: 0,
                        bgAlpha: 0,
                        bgFill: mod.UIBgFill.None,
                        textLabel: mod.Message(mod.stringkeys.twl.victory.totalMatchTimeLabel),
                        textColor: [1, 1, 1],
                        textAlpha: 1,
                        textSize: 12,
                        textAnchor: mod.UIAnchor.Center,
                    },
                    {
                        name: `VictoryDialog_TotalTimeDigits_${pid}`,
                        type: "Container",
                        position: [55, 0],
                        size: [120, 16],
                        anchor: mod.UIAnchor.Center,
                        visible: true,
                        padding: 0,
                        bgAlpha: 0,
                        bgFill: mod.UIBgFill.None,
                        children: [
                            {
                                name: `VictoryDialog_TimeHT_${pid}`,
                                type: "Text",
                                position: [-45, 0],
                                size: [10, 16],
                                anchor: mod.UIAnchor.Center,
                                visible: true,
                                padding: 0,
                                bgAlpha: 0,
                                bgFill: mod.UIBgFill.None,
                                textLabel: mod.Message(mod.stringkeys.twl.hud.clock.digit, 0),
                                textColor: [1, 1, 1],
                                textAlpha: 1,
                                textSize: 12,
                                textAnchor: mod.UIAnchor.Center,
                            },
                            {
                                name: `VictoryDialog_TimeHO_${pid}`,
                                type: "Text",
                                position: [-35, 0],
                                size: [10, 16],
                                anchor: mod.UIAnchor.Center,
                                visible: true,
                                padding: 0,
                                bgAlpha: 0,
                                bgFill: mod.UIBgFill.None,
                                textLabel: mod.Message(mod.stringkeys.twl.hud.clock.digit, 0),
                                textColor: [1, 1, 1],
                                textAlpha: 1,
                                textSize: 12,
                                textAnchor: mod.UIAnchor.Center,
                            },
                            {
                                name: `VictoryDialog_TimeC1_${pid}`,
                                type: "Text",
                                position: [-25, 0],
                                size: [10, 16],
                                anchor: mod.UIAnchor.Center,
                                visible: true,
                                padding: 0,
                                bgAlpha: 0,
                                bgFill: mod.UIBgFill.None,
                                textLabel: mod.Message(mod.stringkeys.twl.hud.clock.colon),
                                textColor: [1, 1, 1],
                                textAlpha: 1,
                                textSize: 12,
                                textAnchor: mod.UIAnchor.Center,
                            },
                            {
                                name: `VictoryDialog_TimeMT_${pid}`,
                                type: "Text",
                                position: [-15, 0],
                                size: [10, 16],
                                anchor: mod.UIAnchor.Center,
                                visible: true,
                                padding: 0,
                                bgAlpha: 0,
                                bgFill: mod.UIBgFill.None,
                                textLabel: mod.Message(mod.stringkeys.twl.hud.clock.digit, 0),
                                textColor: [1, 1, 1],
                                textAlpha: 1,
                                textSize: 12,
                                textAnchor: mod.UIAnchor.Center,
                            },
                            {
                                name: `VictoryDialog_TimeMO_${pid}`,
                                type: "Text",
                                position: [-5, 0],
                                size: [10, 16],
                                anchor: mod.UIAnchor.Center,
                                visible: true,
                                padding: 0,
                                bgAlpha: 0,
                                bgFill: mod.UIBgFill.None,
                                textLabel: mod.Message(mod.stringkeys.twl.hud.clock.digit, 0),
                                textColor: [1, 1, 1],
                                textAlpha: 1,
                                textSize: 12,
                                textAnchor: mod.UIAnchor.Center,
                            },
                            {
                                name: `VictoryDialog_TimeC2_${pid}`,
                                type: "Text",
                                position: [5, 0],
                                size: [10, 16],
                                anchor: mod.UIAnchor.Center,
                                visible: true,
                                padding: 0,
                                bgAlpha: 0,
                                bgFill: mod.UIBgFill.None,
                                textLabel: mod.Message(mod.stringkeys.twl.hud.clock.colon),
                                textColor: [1, 1, 1],
                                textAlpha: 1,
                                textSize: 12,
                                textAnchor: mod.UIAnchor.Center,
                            },
                            {
                                name: `VictoryDialog_TimeST_${pid}`,
                                type: "Text",
                                position: [15, 0],
                                size: [10, 16],
                                anchor: mod.UIAnchor.Center,
                                visible: true,
                                padding: 0,
                                bgAlpha: 0,
                                bgFill: mod.UIBgFill.None,
                                textLabel: mod.Message(mod.stringkeys.twl.hud.clock.digit, 0),
                                textColor: [1, 1, 1],
                                textAlpha: 1,
                                textSize: 12,
                                textAnchor: mod.UIAnchor.Center,
                            },
                            {
                                name: `VictoryDialog_TimeSO_${pid}`,
                                type: "Text",
                                position: [25, 0],
                                size: [10, 16],
                                anchor: mod.UIAnchor.Center,
                                visible: true,
                                padding: 0,
                                bgAlpha: 0,
                                bgFill: mod.UIBgFill.None,
                                textLabel: mod.Message(mod.stringkeys.twl.hud.clock.digit, 0),
                                textColor: [1, 1, 1],
                                textAlpha: 1,
                                textSize: 12,
                                textAnchor: mod.UIAnchor.Center,
                            },
                        ],
                    },
                ],
            },
            {
                name: `VictoryDialog_AdminActions_${pid}`,
                type: "Text",
                position: [0, 122],
                size: [340, 16],
                anchor: mod.UIAnchor.TopCenter,
                visible: false,
                padding: 0,
                bgAlpha: 0,
                bgFill: mod.UIBgFill.None,
                textLabel: mod.Message(mod.stringkeys.twl.adminPanel.actionCountVictoryFormat, 0),
                textColor: [1, 1, 0],
                textAlpha: 1,
                textSize: 12,
                textAnchor: mod.UIAnchor.Center,
            },
            {
                name: `VictoryDialog_ResultBorder_${pid}`,
                type: "Container",
                position: [0, VICTORY_RESULT_BORDER_Y],
                size: [VICTORY_RESULT_BORDER_WIDTH, VICTORY_RESULT_BORDER_HEIGHT],
                anchor: mod.UIAnchor.TopCenter,
                visible: true,
                padding: 0,
                bgColor: [1, 1, 1],
                bgAlpha: 0.5,
                bgFill: mod.UIBgFill.OutlineThin,
            },
            {
                name: `VictoryDialog_Result_${pid}`,
                type: "Text",
                position: [0, VICTORY_RESULT_Y],
                size: [340, 22],
                anchor: mod.UIAnchor.TopCenter,
                visible: false,
                padding: 0,
                bgAlpha: 0,
                bgFill: mod.UIBgFill.None,
                textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, " "),
                textColor: [0, 1, 0],
                textAlpha: 1,
                textSize: VICTORY_RESULT_TEXT_SIZE,
                textAnchor: mod.UIAnchor.Center,
            },
            {
                name: `VictoryDialog_LeftTeamName_${pid}`,
                type: "Text",
                position: [-85, VICTORY_TEAM_NAME_Y],
                size: [160, 24],
                anchor: mod.UIAnchor.TopCenter,
                visible: true,
                padding: 0,
                bgAlpha: 0,
                bgFill: mod.UIBgFill.None,
                textLabel: mod.Message(getTeamNameKey(TeamID.Team1)),
                textColor: [VICTORY_TEAM1_TEXT_RGB[0], VICTORY_TEAM1_TEXT_RGB[1], VICTORY_TEAM1_TEXT_RGB[2]],
                textAlpha: 1,
                textSize: VICTORY_TEAM_NAME_TEXT_SIZE,
                textAnchor: mod.UIAnchor.Center,
            },
            {
                name: `VictoryDialog_RightTeamName_${pid}`,
                type: "Text",
                position: [85, VICTORY_TEAM_NAME_Y],
                size: [160, 24],
                anchor: mod.UIAnchor.TopCenter,
                visible: true,
                padding: 0,
                bgAlpha: 0,
                bgFill: mod.UIBgFill.None,
                textLabel: mod.Message(getTeamNameKey(TeamID.Team2)),
                textColor: [VICTORY_TEAM2_TEXT_RGB[0], VICTORY_TEAM2_TEXT_RGB[1], VICTORY_TEAM2_TEXT_RGB[2]],
                textAlpha: 1,
                textSize: VICTORY_TEAM_NAME_TEXT_SIZE,
                textAnchor: mod.UIAnchor.Center,
            },
            {
                name: `VictoryDialog_LeftTickets_${pid}`,
                type: "Text",
                position: [-85, VICTORY_TICKET_Y],
                size: [160, 58],
                anchor: mod.UIAnchor.TopCenter,
                visible: true,
                padding: 0,
                bgAlpha: 0,
                bgFill: mod.UIBgFill.None,
                textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                textColor: [VICTORY_TEAM1_TEXT_RGB[0], VICTORY_TEAM1_TEXT_RGB[1], VICTORY_TEAM1_TEXT_RGB[2]],
                textAlpha: 1,
                textSize: VICTORY_TICKET_TEXT_SIZE,
                textAnchor: mod.UIAnchor.Center,
            },
            {
                name: `VictoryDialog_RightTickets_${pid}`,
                type: "Text",
                position: [85, VICTORY_TICKET_Y],
                size: [160, 58],
                anchor: mod.UIAnchor.TopCenter,
                visible: true,
                padding: 0,
                bgAlpha: 0,
                bgFill: mod.UIBgFill.None,
                textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                textColor: [VICTORY_TEAM2_TEXT_RGB[0], VICTORY_TEAM2_TEXT_RGB[1], VICTORY_TEAM2_TEXT_RGB[2]],
                textAlpha: 1,
                textSize: VICTORY_TICKET_TEXT_SIZE,
                textAnchor: mod.UIAnchor.Center,
            },
            {
                name: `VictoryDialog_RosterRow_${pid}`,
                type: "Container",
                position: [0, VICTORY_DIALOG_ROSTER_ROW_Y],
                size: [VICTORY_DIALOG_ROSTER_ROW_WIDTH, VICTORY_DIALOG_ROSTER_ROW_HEIGHT_MAX],
                anchor: mod.UIAnchor.TopCenter,
                visible: true,
                padding: 0,
                bgAlpha: 0,
                bgFill: mod.UIBgFill.None,
                children: [
                    {
                        name: `VictoryDialog_RosterLeft_${pid}`,
                        type: "Container",
                        position: [-85, 0],
                        size: [VICTORY_DIALOG_ROSTER_CONTAINER_WIDTH, VICTORY_DIALOG_ROSTER_ROW_HEIGHT_MAX],
                        anchor: mod.UIAnchor.TopCenter,
                        visible: true,
                        padding: 0,
                        bgColor: [VICTORY_TEAM1_BG_RGB[0], VICTORY_TEAM1_BG_RGB[1], VICTORY_TEAM1_BG_RGB[2]],
                        bgAlpha: 0.95,
                        bgFill: mod.UIBgFill.Solid,
                        children: (function () {
                            const rows: any[] = [];
                            for (let i = 0; i < TEAM_ROSTER_MAX_ROWS; i++) {
                                rows.push({
                                    name: `VictoryDialog_LeftRoster_${pid}_${i}`,
                                    type: "Text",
                                    position: [0, VICTORY_DIALOG_ROSTER_ROW_PADDING_TOP + i * VICTORY_DIALOG_ROSTER_ROW_HEIGHT],
                                    size: [VICTORY_DIALOG_ROSTER_CONTAINER_WIDTH, VICTORY_DIALOG_ROSTER_ROW_HEIGHT],
                                    anchor: mod.UIAnchor.TopCenter,
                                    visible: true,
                                    padding: 0,
                                    bgAlpha: 0,
                                    bgFill: mod.UIBgFill.None,
                                    textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, " "),
                                    textColor: [VICTORY_TEAM1_TEXT_RGB[0], VICTORY_TEAM1_TEXT_RGB[1], VICTORY_TEAM1_TEXT_RGB[2]],
                                    textAlpha: 1,
                                    textSize: 11,
                                    textAnchor: mod.UIAnchor.Center,
                                });
                            }
                            return rows;
                        })(),
                    },
                    {
                        name: `VictoryDialog_RosterRight_${pid}`,
                        type: "Container",
                        position: [85, 0],
                        size: [VICTORY_DIALOG_ROSTER_CONTAINER_WIDTH, VICTORY_DIALOG_ROSTER_ROW_HEIGHT_MAX],
                        anchor: mod.UIAnchor.TopCenter,
                        visible: true,
                        padding: 0,
                        bgColor: [VICTORY_TEAM2_BG_RGB[0], VICTORY_TEAM2_BG_RGB[1], VICTORY_TEAM2_BG_RGB[2]],
                        bgAlpha: 0.95,
                        bgFill: mod.UIBgFill.Solid,
                        children: (function () {
                            const rows: any[] = [];
                            for (let i = 0; i < TEAM_ROSTER_MAX_ROWS; i++) {
                                rows.push({
                                    name: `VictoryDialog_RightRoster_${pid}_${i}`,
                                    type: "Text",
                                    position: [0, VICTORY_DIALOG_ROSTER_ROW_PADDING_TOP + i * VICTORY_DIALOG_ROSTER_ROW_HEIGHT],
                                    size: [VICTORY_DIALOG_ROSTER_CONTAINER_WIDTH, VICTORY_DIALOG_ROSTER_ROW_HEIGHT],
                                    anchor: mod.UIAnchor.TopCenter,
                                    visible: true,
                                    padding: 0,
                                    bgAlpha: 0,
                                    bgFill: mod.UIBgFill.None,
                                    textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, " "),
                                    textColor: [VICTORY_TEAM2_TEXT_RGB[0], VICTORY_TEAM2_TEXT_RGB[1], VICTORY_TEAM2_TEXT_RGB[2]],
                                    textAlpha: 1,
                                    textSize: 11,
                                    textAnchor: mod.UIAnchor.Center,
                                });
                            }
                            return rows;
                        })(),
                    },
                ],
            },
        ],
    });

    if (modal) refs.roots.push(modal);

    // Crown images created as standalone widgets and parented to dialog root.
    // ParseUI nested children only support Container and Text types.
    const dialogRoot = safeFind(`VictoryDialogRoot_${pid}`);
    if (dialogRoot) {
        safeParseUI({
            name: `VictoryDialog_LeftCrown_${pid}`,
            type: "Image",
            playerId: player,
            position: [-85, VICTORY_CROWN_Y],
            size: [VICTORY_CROWN_SIZE, VICTORY_CROWN_SIZE],
            anchor: mod.UIAnchor.TopCenter,
            visible: false,
            padding: 0,
            bgAlpha: 0,
            bgFill: mod.UIBgFill.None,
            imageType: mod.UIImageType.CrownSolid,
            imageColor: [VICTORY_CROWN_RGB[0], VICTORY_CROWN_RGB[1], VICTORY_CROWN_RGB[2]],
            imageAlpha: 1,
        });
        const leftCrown = safeFind(`VictoryDialog_LeftCrown_${pid}`);
        if (leftCrown) {
            try { mod.SetUIWidgetParent(leftCrown, dialogRoot); } catch {}
        }
        safeParseUI({
            name: `VictoryDialog_RightCrown_${pid}`,
            type: "Image",
            playerId: player,
            position: [85, VICTORY_CROWN_Y],
            size: [VICTORY_CROWN_SIZE, VICTORY_CROWN_SIZE],
            anchor: mod.UIAnchor.TopCenter,
            visible: false,
            padding: 0,
            bgAlpha: 0,
            bgFill: mod.UIBgFill.None,
            imageType: mod.UIImageType.CrownSolid,
            imageColor: [VICTORY_CROWN_RGB[0], VICTORY_CROWN_RGB[1], VICTORY_CROWN_RGB[2]],
            imageAlpha: 1,
        });
        const rightCrown = safeFind(`VictoryDialog_RightCrown_${pid}`);
        if (rightCrown) {
            try { mod.SetUIWidgetParent(rightCrown, dialogRoot); } catch {}
        }
    }

    bindVictoryDialogRefsByName(pid, refs);
}



