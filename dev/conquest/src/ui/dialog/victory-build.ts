// @ts-nocheck
// Module: ui/dialog/victory-build -- victory dialog construction for per-player HUD cache.

// Rebinds all victory dialog widget refs from authoritative per-player names after build or recovery.
function bindVictoryDialogRefsByName(pid: number, refs: TopHudShellRefs): void {
    refs.victoryRoot = safeFind(wn("VictoryDialogRoot", pid));
    refs.victoryRestartText = safeFind(wn("VictoryDialog_Restart", pid));

    refs.victoryTimeHoursTens = safeFind(wn("VictoryDialog_TimeHT", pid));
    refs.victoryTimeHoursOnes = safeFind(wn("VictoryDialog_TimeHO", pid));
    refs.victoryTimeMinutesTens = safeFind(wn("VictoryDialog_TimeMT", pid));
    refs.victoryTimeMinutesOnes = safeFind(wn("VictoryDialog_TimeMO", pid));
    refs.victoryTimeSecondsTens = safeFind(wn("VictoryDialog_TimeST", pid));
    refs.victoryTimeSecondsOnes = safeFind(wn("VictoryDialog_TimeSO", pid));

    refs.victoryAdminActionsText = safeFind(wn("VictoryDialog_AdminActions", pid));
    refs.victoryResultText = safeFind(wn("VictoryDialog_Result", pid));
    refs.victoryLeftCrown = safeFind(wn("VictoryDialog_LeftCrown", pid));
    refs.victoryRightCrown = safeFind(wn("VictoryDialog_RightCrown", pid));
    refs.victoryLeftTeamNameText = safeFind(wn("VictoryDialog_LeftTeamName", pid));
    refs.victoryRightTeamNameText = safeFind(wn("VictoryDialog_RightTeamName", pid));
    refs.victoryLeftTicketText = safeFind(wn("VictoryDialog_LeftTickets", pid));
    refs.victoryRightTicketText = safeFind(wn("VictoryDialog_RightTickets", pid));
    refs.victoryRosterRow = safeFind(wn("VictoryDialog_RosterRow", pid));
    refs.victoryRosterLeftContainer = safeFind(wn("VictoryDialog_RosterLeft", pid));
    refs.victoryRosterRightContainer = safeFind(wn("VictoryDialog_RosterRight", pid));

    refs.victoryLeftRosterText = [];
    refs.victoryRightRosterText = [];
    for (let i = 0; i < TEAM_ROSTER_MAX_ROWS; i++) {
        refs.victoryLeftRosterText.push(safeFind(wn("VictoryDialog_LeftRoster", pid, i)));
        refs.victoryRightRosterText.push(safeFind(wn("VictoryDialog_RightRoster", pid, i)));
    }
}

// Builds the cached victory dialog widget tree for one player and binds all dialog refs.
function buildVictoryDialogWidgets(player: mod.Player, pid: number, refs: TopHudShellRefs): void {
    const modal = safeParseUI({
        name: wn("VictoryDialogRoot", pid),
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
                name: wn("VictoryDialog_Header1", pid),
                type: "Text",
                position: [0, 14],
                size: [340, 22],
                anchor: mod.UIAnchor.TopCenter,
                visible: true,
                padding: 0,
                bgAlpha: 0,
                bgFill: mod.UIBgFill.None,
                textLabel: msg(mod.stringkeys.twl.hud.branding.title),
                textColor: [1, 1, 1],
                textAlpha: 1,
                textSize: 18,
                textAnchor: mod.UIAnchor.Center,
            },
            {
                name: wn("VictoryDialog_Header2", pid),
                type: "Text",
                position: [0, 36],
                size: [340, 22],
                anchor: mod.UIAnchor.TopCenter,
                visible: true,
                padding: 0,
                bgAlpha: 0,
                bgFill: mod.UIBgFill.None,
                textLabel: msg(mod.stringkeys.twl.hud.branding.subtitle),
                textColor: [1, 1, 1],
                textAlpha: 1,
                textSize: 18,
                textAnchor: mod.UIAnchor.Center,
            },
            {
                name: wn("VictoryDialog_Screenshot", pid),
                type: "Text",
                position: [0, 62],
                size: [340, 16],
                anchor: mod.UIAnchor.TopCenter,
                visible: true,
                padding: 0,
                bgAlpha: 0,
                bgFill: mod.UIBgFill.None,
                textLabel: msg(mod.stringkeys.twl.victory.screenshotPrompt),
                textColor: [1, 1, 0],
                textAlpha: 1,
                textSize: 12,
                textAnchor: mod.UIAnchor.Center,
            },
            {
                name: wn("VictoryDialog_Restart", pid),
                type: "Text",
                position: [0, 82],
                size: [340, 16],
                anchor: mod.UIAnchor.TopCenter,
                visible: true,
                padding: 0,
                bgAlpha: 0,
                bgFill: mod.UIBgFill.None,
                textLabel: msg(mod.stringkeys.twl.victory.restartInFormat, MATCH_END_DELAY_SECONDS),
                textColor: [1, 1, 1],
                textAlpha: 1,
                textSize: 12,
                textAnchor: mod.UIAnchor.Center,
            },
            {
                name: wn("VictoryDialog_TotalTimeRow", pid),
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
                        name: wn("VictoryDialog_TotalTimeLabel", pid),
                        type: "Text",
                        position: [-45, 0],
                        size: [130, 16],
                        anchor: mod.UIAnchor.Center,
                        visible: true,
                        padding: 0,
                        bgAlpha: 0,
                        bgFill: mod.UIBgFill.None,
                        textLabel: msg(mod.stringkeys.twl.victory.totalMatchTimeLabel),
                        textColor: [1, 1, 1],
                        textAlpha: 1,
                        textSize: 12,
                        textAnchor: mod.UIAnchor.Center,
                    },
                    {
                        name: wn("VictoryDialog_TotalTimeDigits", pid),
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
                                name: wn("VictoryDialog_TimeHT", pid),
                                type: "Text",
                                position: [-45, 0],
                                size: [10, 16],
                                anchor: mod.UIAnchor.Center,
                                visible: true,
                                padding: 0,
                                bgAlpha: 0,
                                bgFill: mod.UIBgFill.None,
                                textLabel: msg(STR_HUD_CLOCK_DIGIT, 0),
                                textColor: [1, 1, 1],
                                textAlpha: 1,
                                textSize: 12,
                                textAnchor: mod.UIAnchor.Center,
                            },
                            {
                                name: wn("VictoryDialog_TimeHO", pid),
                                type: "Text",
                                position: [-35, 0],
                                size: [10, 16],
                                anchor: mod.UIAnchor.Center,
                                visible: true,
                                padding: 0,
                                bgAlpha: 0,
                                bgFill: mod.UIBgFill.None,
                                textLabel: msg(STR_HUD_CLOCK_DIGIT, 0),
                                textColor: [1, 1, 1],
                                textAlpha: 1,
                                textSize: 12,
                                textAnchor: mod.UIAnchor.Center,
                            },
                            {
                                name: wn("VictoryDialog_TimeC1", pid),
                                type: "Text",
                                position: [-25, 0],
                                size: [10, 16],
                                anchor: mod.UIAnchor.Center,
                                visible: true,
                                padding: 0,
                                bgAlpha: 0,
                                bgFill: mod.UIBgFill.None,
                                textLabel: msg(mod.stringkeys.twl.hud.clock.colon),
                                textColor: [1, 1, 1],
                                textAlpha: 1,
                                textSize: 12,
                                textAnchor: mod.UIAnchor.Center,
                            },
                            {
                                name: wn("VictoryDialog_TimeMT", pid),
                                type: "Text",
                                position: [-15, 0],
                                size: [10, 16],
                                anchor: mod.UIAnchor.Center,
                                visible: true,
                                padding: 0,
                                bgAlpha: 0,
                                bgFill: mod.UIBgFill.None,
                                textLabel: msg(STR_HUD_CLOCK_DIGIT, 0),
                                textColor: [1, 1, 1],
                                textAlpha: 1,
                                textSize: 12,
                                textAnchor: mod.UIAnchor.Center,
                            },
                            {
                                name: wn("VictoryDialog_TimeMO", pid),
                                type: "Text",
                                position: [-5, 0],
                                size: [10, 16],
                                anchor: mod.UIAnchor.Center,
                                visible: true,
                                padding: 0,
                                bgAlpha: 0,
                                bgFill: mod.UIBgFill.None,
                                textLabel: msg(STR_HUD_CLOCK_DIGIT, 0),
                                textColor: [1, 1, 1],
                                textAlpha: 1,
                                textSize: 12,
                                textAnchor: mod.UIAnchor.Center,
                            },
                            {
                                name: wn("VictoryDialog_TimeC2", pid),
                                type: "Text",
                                position: [5, 0],
                                size: [10, 16],
                                anchor: mod.UIAnchor.Center,
                                visible: true,
                                padding: 0,
                                bgAlpha: 0,
                                bgFill: mod.UIBgFill.None,
                                textLabel: msg(mod.stringkeys.twl.hud.clock.colon),
                                textColor: [1, 1, 1],
                                textAlpha: 1,
                                textSize: 12,
                                textAnchor: mod.UIAnchor.Center,
                            },
                            {
                                name: wn("VictoryDialog_TimeST", pid),
                                type: "Text",
                                position: [15, 0],
                                size: [10, 16],
                                anchor: mod.UIAnchor.Center,
                                visible: true,
                                padding: 0,
                                bgAlpha: 0,
                                bgFill: mod.UIBgFill.None,
                                textLabel: msg(STR_HUD_CLOCK_DIGIT, 0),
                                textColor: [1, 1, 1],
                                textAlpha: 1,
                                textSize: 12,
                                textAnchor: mod.UIAnchor.Center,
                            },
                            {
                                name: wn("VictoryDialog_TimeSO", pid),
                                type: "Text",
                                position: [25, 0],
                                size: [10, 16],
                                anchor: mod.UIAnchor.Center,
                                visible: true,
                                padding: 0,
                                bgAlpha: 0,
                                bgFill: mod.UIBgFill.None,
                                textLabel: msg(STR_HUD_CLOCK_DIGIT, 0),
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
                name: wn("VictoryDialog_AdminActions", pid),
                type: "Text",
                position: [0, 122],
                size: [340, 16],
                anchor: mod.UIAnchor.TopCenter,
                visible: false,
                padding: 0,
                bgAlpha: 0,
                bgFill: mod.UIBgFill.None,
                textLabel: msg(mod.stringkeys.twl.adminPanel.actionCountVictoryFormat, 0),
                textColor: [1, 1, 0],
                textAlpha: 1,
                textSize: 12,
                textAnchor: mod.UIAnchor.Center,
            },
            {
                name: wn("VictoryDialog_ResultBorder", pid),
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
                name: wn("VictoryDialog_Result", pid),
                type: "Text",
                position: [0, VICTORY_RESULT_Y],
                size: [340, 22],
                anchor: mod.UIAnchor.TopCenter,
                visible: false,
                padding: 0,
                bgAlpha: 0,
                bgFill: mod.UIBgFill.None,
                textLabel: msg(STR_SYS_COUNTER, " "),
                textColor: [0, 1, 0],
                textAlpha: 1,
                textSize: VICTORY_RESULT_TEXT_SIZE,
                textAnchor: mod.UIAnchor.Center,
            },
            {
                name: wn("VictoryDialog_LeftTeamName", pid),
                type: "Text",
                position: [-85, VICTORY_TEAM_NAME_Y],
                size: [160, 24],
                anchor: mod.UIAnchor.TopCenter,
                visible: true,
                padding: 0,
                bgAlpha: 0,
                bgFill: mod.UIBgFill.None,
                textLabel: msg(getTeamNameKey(TeamID.Team1)),
                textColor: [VICTORY_TEAM1_TEXT_RGB[0], VICTORY_TEAM1_TEXT_RGB[1], VICTORY_TEAM1_TEXT_RGB[2]],
                textAlpha: 1,
                textSize: VICTORY_TEAM_NAME_TEXT_SIZE,
                textAnchor: mod.UIAnchor.Center,
            },
            {
                name: wn("VictoryDialog_RightTeamName", pid),
                type: "Text",
                position: [85, VICTORY_TEAM_NAME_Y],
                size: [160, 24],
                anchor: mod.UIAnchor.TopCenter,
                visible: true,
                padding: 0,
                bgAlpha: 0,
                bgFill: mod.UIBgFill.None,
                textLabel: msg(getTeamNameKey(TeamID.Team2)),
                textColor: [VICTORY_TEAM2_TEXT_RGB[0], VICTORY_TEAM2_TEXT_RGB[1], VICTORY_TEAM2_TEXT_RGB[2]],
                textAlpha: 1,
                textSize: VICTORY_TEAM_NAME_TEXT_SIZE,
                textAnchor: mod.UIAnchor.Center,
            },
            {
                name: wn("VictoryDialog_LeftTickets", pid),
                type: "Text",
                position: [-85, VICTORY_TICKET_Y],
                size: [160, 58],
                anchor: mod.UIAnchor.TopCenter,
                visible: true,
                padding: 0,
                bgAlpha: 0,
                bgFill: mod.UIBgFill.None,
                textLabel: msg(STR_SYS_COUNTER, 0),
                textColor: [VICTORY_TEAM1_TEXT_RGB[0], VICTORY_TEAM1_TEXT_RGB[1], VICTORY_TEAM1_TEXT_RGB[2]],
                textAlpha: 1,
                textSize: VICTORY_TICKET_TEXT_SIZE,
                textAnchor: mod.UIAnchor.Center,
            },
            {
                name: wn("VictoryDialog_RightTickets", pid),
                type: "Text",
                position: [85, VICTORY_TICKET_Y],
                size: [160, 58],
                anchor: mod.UIAnchor.TopCenter,
                visible: true,
                padding: 0,
                bgAlpha: 0,
                bgFill: mod.UIBgFill.None,
                textLabel: msg(STR_SYS_COUNTER, 0),
                textColor: [VICTORY_TEAM2_TEXT_RGB[0], VICTORY_TEAM2_TEXT_RGB[1], VICTORY_TEAM2_TEXT_RGB[2]],
                textAlpha: 1,
                textSize: VICTORY_TICKET_TEXT_SIZE,
                textAnchor: mod.UIAnchor.Center,
            },
            {
                name: wn("VictoryDialog_RosterRow", pid),
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
                        name: wn("VictoryDialog_RosterLeft", pid),
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
                                    name: wn("VictoryDialog_LeftRoster", pid, i),
                                    type: "Text",
                                    position: [0, VICTORY_DIALOG_ROSTER_ROW_PADDING_TOP + i * VICTORY_DIALOG_ROSTER_ROW_HEIGHT],
                                    size: [VICTORY_DIALOG_ROSTER_CONTAINER_WIDTH, VICTORY_DIALOG_ROSTER_ROW_HEIGHT],
                                    anchor: mod.UIAnchor.TopCenter,
                                    visible: true,
                                    padding: 0,
                                    bgAlpha: 0,
                                    bgFill: mod.UIBgFill.None,
                                    textLabel: msg(STR_SYS_COUNTER, " "),
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
                        name: wn("VictoryDialog_RosterRight", pid),
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
                                    name: wn("VictoryDialog_RightRoster", pid, i),
                                    type: "Text",
                                    position: [0, VICTORY_DIALOG_ROSTER_ROW_PADDING_TOP + i * VICTORY_DIALOG_ROSTER_ROW_HEIGHT],
                                    size: [VICTORY_DIALOG_ROSTER_CONTAINER_WIDTH, VICTORY_DIALOG_ROSTER_ROW_HEIGHT],
                                    anchor: mod.UIAnchor.TopCenter,
                                    visible: true,
                                    padding: 0,
                                    bgAlpha: 0,
                                    bgFill: mod.UIBgFill.None,
                                    textLabel: msg(STR_SYS_COUNTER, " "),
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
    const dialogRoot = safeFind(wn("VictoryDialogRoot", pid));
    if (dialogRoot) {
        safeParseUI({
            name: wn("VictoryDialog_LeftCrown", pid),
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
        const leftCrown = safeFind(wn("VictoryDialog_LeftCrown", pid));
        if (leftCrown) {
            try { mod.SetUIWidgetParent(leftCrown, dialogRoot); } catch {}
        }
        safeParseUI({
            name: wn("VictoryDialog_RightCrown", pid),
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
        const rightCrown = safeFind(wn("VictoryDialog_RightCrown", pid));
        if (rightCrown) {
            try { mod.SetUIWidgetParent(rightCrown, dialogRoot); } catch {}
        }
    }

    bindVictoryDialogRefsByName(pid, refs);
}



