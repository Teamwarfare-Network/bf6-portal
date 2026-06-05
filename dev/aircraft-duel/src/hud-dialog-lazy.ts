// @ts-nocheck
// Module: hud-dialog-lazy -- Round-End + Victory dialog widget construction, extracted from
// ensureEagerHudShellForPlayer's body so it no longer runs at OnPlayerJoinGame time. Built on demand via
// triggerLazyBuild('roundEndDialog', pid) / triggerLazyBuild('victoryDialog', pid).
//
// Why: Phase A of the lazy-load HUD refactor (see design_doc/5.30.26_heli_lazy_load_hud_refactor_plan.md).
// These two ParseUI trees were ~835 lines of synchronous widget construction inside OPJG; deferring
// them removes the biggest single hitch from the join tick and helps mitigate the concurrent-join
// frame-budget crash (CQ_Bug_40 equivalent).
//
// Idempotency: both functions check for the existing root widget by name and early-return if found.
// triggerLazyBuild's re-entrancy guard also prevents concurrent double-builds for the same pid.
//
// Ref binding: each function writes back into State.hudCache.hudByPid[pid] (the same HudRefs entry
// that ensureEagerHudShellForPlayer populates). updateVictoryDialogForPlayer and updateRoundEndDialogForPlayer
// already defensive-check each ref before touching it, so updates fired before the lazy build no-op
// cleanly.

//#region -------------------- ensureRoundEndDialogUiBuiltHidden --------------------

// Builds the round-end "ROUND N / OUTCOME / DETAIL" modal. Originally lived inline in
// ensureEagerHudShellForPlayer at hud.ts:2025-2104 before Phase A extraction.
//
// Trigger: updateRoundEndDialogForPlayer (called from updateRoundEndDialogForAllPlayers at round-end).
function ensureRoundEndDialogUiBuiltHidden(player: mod.Player): void {
    if (!player || !mod.IsPlayerValid(player)) return;
    const pid = safeGetPlayerId(player);
    if (pid === undefined || isPidDisconnected(pid)) return;

    const refs = State.hudCache.hudByPid[pid];
    if (!refs) return;

    // Idempotency: if already built (widget exists in UI tree), just confirm refs are bound.
    const existing = safeFind(`RoundEndDialogRoot_${pid}`);
    if (existing) {
        if (!refs.roundEndRoot) refs.roundEndRoot = existing;
        if (!refs.roundEndRoundText) refs.roundEndRoundText = safeFind(`RoundEndDialog_Round_${pid}`);
        if (!refs.roundEndOutcomeText) refs.roundEndOutcomeText = safeFind(`RoundEndDialog_Outcome_${pid}`);
        if (!refs.roundEndDetailText) refs.roundEndDetailText = safeFind(`RoundEndDialog_Detail_${pid}`);
        return;
    }

    const roundEndModal = modlib.ParseUI({
        name: `RoundEndDialogRoot_${pid}`,
        type: "Container",
        playerId: player,
        position: [0, 150],
        size: [520, 112],
        anchor: mod.UIAnchor.TopCenter,
        visible: false,
        padding: 0,
        bgColor: [VICTORY_BG_RGB[0], VICTORY_BG_RGB[1], VICTORY_BG_RGB[2]],
        bgAlpha: 0.75,
        bgFill: mod.UIBgFill.Solid,
        children: [
            {
                name: `RoundEndDialog_Round_${pid}`,
                type: "Text",
                position: [0, 16],
                size: [340, 24],
                anchor: mod.UIAnchor.TopCenter,
                visible: true,
                padding: 0,
                bgAlpha: 0,
                bgFill: mod.UIBgFill.None,
                textLabel: mod.Message(mod.stringkeys.twl.roundEnd.roundNumber, State.round.current),
                textColor: [1, 1, 1],
                textAlpha: 1,
                textSize: 20,
                textAnchor: mod.UIAnchor.Center,
            },
            {
                name: `RoundEndDialog_Outcome_${pid}`,
                type: "Text",
                position: [0, 46],
                size: [340, 30],
                anchor: mod.UIAnchor.TopCenter,
                visible: true,
                padding: 0,
                bgAlpha: 0,
                bgFill: mod.UIBgFill.None,
                textLabel: mod.stringkeys.twl.roundEnd.draw,
                textColor: [1, 1, 1],
                textAlpha: 1,
                textSize: 26,
                textAnchor: mod.UIAnchor.Center,
            },
            {
                name: `RoundEndDialog_Detail_${pid}`,
                type: "Text",
                position: [0, 86],
                size: [500, 18],
                anchor: mod.UIAnchor.TopCenter,
                visible: true,
                padding: 0,
                bgAlpha: 0,
                bgFill: mod.UIBgFill.None,
                textLabel: mod.stringkeys.twl.roundEnd.draw,
                textColor: [1, 1, 1],
                textAlpha: 1,
                textSize: 14,
                textAnchor: mod.UIAnchor.Center,
            },
        ],
    });

    refs.roundEndRoot = roundEndModal;
    refs.roundEndRoundText = safeFind(`RoundEndDialog_Round_${pid}`);
    refs.roundEndOutcomeText = safeFind(`RoundEndDialog_Outcome_${pid}`);
    refs.roundEndDetailText = safeFind(`RoundEndDialog_Detail_${pid}`);
    if (roundEndModal) refs.roots.push(roundEndModal);
}

//#endregion ----------------- ensureRoundEndDialogUiBuiltHidden --------------------



//#region -------------------- ensureVictoryDialogUiBuiltHidden --------------------

// Builds the match-end victory modal (~745 lines of ParseUI tree). Originally lived inline in
// ensureEagerHudShellForPlayer at hud.ts:2110-2856 before Phase A extraction.
//
// Trigger: updateVictoryDialogForPlayer (called from updateVictoryDialogForAllPlayers at match-end
// + once-per-second while the dialog is active).
// v0.737 Victory dialog palette. Build-time literals at lines 443/568/706/740 (panel BGs) and the
// 14 sites referencing VICTORY_TEAM*_TEXT_RGB seed today's T1=dark-blue / T2=dark-red. The fixup
// below overwrites for the viewer's pid so own-team always paints with blue palette, enemy with red.
// Pre-built mod.Vector instances (one alloc each, reused per call) -- SetUIWidgetBgColor /
// SetUITextColor want Vector, not [R,G,B] tuple.
const VICTORY_OWN_PANEL_BG = mod.CreateVector(VICTORY_TEAM1_BG_RGB[0], VICTORY_TEAM1_BG_RGB[1], VICTORY_TEAM1_BG_RGB[2]);
const VICTORY_ENEMY_PANEL_BG = mod.CreateVector(VICTORY_TEAM2_BG_RGB[0], VICTORY_TEAM2_BG_RGB[1], VICTORY_TEAM2_BG_RGB[2]);
const VICTORY_OWN_TEXT = mod.CreateVector(VICTORY_TEAM1_TEXT_RGB[0], VICTORY_TEAM1_TEXT_RGB[1], VICTORY_TEAM1_TEXT_RGB[2]);
const VICTORY_ENEMY_TEXT = mod.CreateVector(VICTORY_TEAM2_TEXT_RGB[0], VICTORY_TEAM2_TEXT_RGB[1], VICTORY_TEAM2_TEXT_RGB[2]);

function applyViewerTeamColorsForVictoryDialogPid(pid: number): void {
    const refs = State.hudCache.hudByPid[pid];
    if (!refs || !refs.victoryRoot) return; // victory dialog never built for this pid
    // Panel BGs: T1 sub-panel + T1 roster sub-panel on left; T2 sub-panel + T2 roster sub-panel on right.
    const leftPanelBg = getViewerOwnTeamColor(pid, TeamID.Team1, VICTORY_OWN_PANEL_BG, VICTORY_ENEMY_PANEL_BG);
    const rightPanelBg = getViewerOwnTeamColor(pid, TeamID.Team2, VICTORY_OWN_PANEL_BG, VICTORY_ENEMY_PANEL_BG);
    const t1Main = safeFind(`VictoryDialog_TeamLeft_${pid}`);
    const t2Main = safeFind(`VictoryDialog_TeamRight_${pid}`);
    if (t1Main) try { mod.SetUIWidgetBgColor(t1Main, leftPanelBg); } catch {}
    if (t2Main) try { mod.SetUIWidgetBgColor(t2Main, rightPanelBg); } catch {}
    if (refs.victoryRosterLeftContainer) try { mod.SetUIWidgetBgColor(refs.victoryRosterLeftContainer, leftPanelBg); } catch {}
    if (refs.victoryRosterRightContainer) try { mod.SetUIWidgetBgColor(refs.victoryRosterRightContainer, rightPanelBg); } catch {}
    // Text colors: 6 widgets per team side (outcome, record, roundWins, roundLosses, roundTies, totalKills)
    // plus the 16-row roster on each side. Left-side widgets paint the T1 own-or-enemy color; right-side
    // widgets paint the T2 own-or-enemy color. Layout doesn't flip; only the color follows the viewer.
    const leftText = getViewerOwnTeamColor(pid, TeamID.Team1, VICTORY_OWN_TEXT, VICTORY_ENEMY_TEXT);
    const rightText = getViewerOwnTeamColor(pid, TeamID.Team2, VICTORY_OWN_TEXT, VICTORY_ENEMY_TEXT);
    const leftTextWidgets = [
        refs.victoryLeftOutcomeText,
        refs.victoryLeftRecordText,
        refs.victoryLeftRoundWinsText,
        refs.victoryLeftRoundLossesText,
        refs.victoryLeftRoundTiesText,
        refs.victoryLeftTotalKillsText,
    ];
    const rightTextWidgets = [
        refs.victoryRightOutcomeText,
        refs.victoryRightRecordText,
        refs.victoryRightRoundWinsText,
        refs.victoryRightRoundLossesText,
        refs.victoryRightRoundTiesText,
        refs.victoryRightTotalKillsText,
    ];
    for (const w of leftTextWidgets) {
        if (w) try { mod.SetUITextColor(w, leftText); } catch {}
    }
    for (const w of rightTextWidgets) {
        if (w) try { mod.SetUITextColor(w, rightText); } catch {}
    }
    // Roster rows: 16 per team side, all in arrays on the refs object.
    if (refs.victoryLeftRosterText) {
        for (const w of refs.victoryLeftRosterText) {
            if (w) try { mod.SetUITextColor(w, leftText); } catch {}
        }
    }
    if (refs.victoryRightRosterText) {
        for (const w of refs.victoryRightRosterText) {
            if (w) try { mod.SetUITextColor(w, rightText); } catch {}
        }
    }
}

function ensureVictoryDialogUiBuiltHidden(player: mod.Player): void {
    if (!player || !mod.IsPlayerValid(player)) return;
    const pid = safeGetPlayerId(player);
    if (pid === undefined || isPidDisconnected(pid)) return;

    const refs = State.hudCache.hudByPid[pid];
    if (!refs) return;

    // Idempotency: if already built (root exists in UI tree), just confirm refs are bound.
    const existing = safeFind(`VictoryDialogRoot_${pid}`);
    if (existing) {
        if (!refs.victoryRoot) {
            bindVictoryDialogRefsByName(refs, pid);
        }
        // v0.737 re-apply viewer-relative colors even on existing-widget path (team may have changed).
        applyViewerTeamColorsForVictoryDialogPid(pid);
        return;
    }

    const modal = modlib.ParseUI({
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
                textLabel: mod.stringkeys.twl.hud.branding.title,
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
                textLabel: mod.stringkeys.twl.hud.branding.subtitle,
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
                textLabel: mod.stringkeys.twl.victory.screenshotPrompt,
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
                        textLabel: mod.stringkeys.twl.victory.totalMatchTimeLabel,
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
                name: `VictoryDialog_Rounds_${pid}`,
                type: "Text",
                position: [0, 122],
                size: [340, 16],
                anchor: mod.UIAnchor.TopCenter,
                visible: true,
                padding: 0,
                bgAlpha: 0,
                bgFill: mod.UIBgFill.None,
                textLabel: mod.Message(mod.stringkeys.twl.victory.roundsSummaryFormat, 0, 0),
                textColor: [1, 1, 1],
                textAlpha: 1,
                textSize: 12,
                textAnchor: mod.UIAnchor.Center,
            },
            {
                name: `VictoryDialog_AdminActions_${pid}`,
                type: "Text",
                position: [0, 138],
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
                name: `VictoryDialog_TeamsRow_${pid}`,
                type: "Container",
                position: [0, 154],
                size: [340, 70],
                anchor: mod.UIAnchor.TopCenter,
                visible: true,
                padding: 0,
                bgAlpha: 0,
                bgFill: mod.UIBgFill.None,
                children: [
                    {
                        name: `VictoryDialog_TeamLeft_${pid}`,
                        type: "Container",
                        position: [-85, 0],
                        size: [160, 122],
                        anchor: mod.UIAnchor.TopCenter,
                        visible: true,
                        padding: 0,
                        bgColor: [VICTORY_TEAM1_BG_RGB[0], VICTORY_TEAM1_BG_RGB[1], VICTORY_TEAM1_BG_RGB[2]],
                        bgAlpha: 0.95,
                        bgFill: mod.UIBgFill.Solid,
                        children: [
                            {
                                name: `VictoryDialog_LeftOutcome_${pid}`,
                                type: "Text",
                                position: [0, 6],
                                size: [150, 22],
                                anchor: mod.UIAnchor.TopCenter,
                                visible: true,
                                padding: 0,
                                bgAlpha: 0,
                                bgFill: mod.UIBgFill.None,
                                textLabel: mod.Message(mod.stringkeys.twl.victory.teamOutcomeFormat, getTeamNameKey(TeamID.Team1), mod.stringkeys.twl.victory.loses),
                                textColor: [VICTORY_TEAM1_TEXT_RGB[0], VICTORY_TEAM1_TEXT_RGB[1], VICTORY_TEAM1_TEXT_RGB[2]],
                                textAlpha: 1,
                                textSize: 18,
                                textAnchor: mod.UIAnchor.Center,
                            },
                            {
                                // Winning crown (shown only for the winning team)
                                name: `VictoryDialog_LeftCrown_${pid}`,
                                type: "Image",
                                position: [VICTORY_CROWN_OFFSET_X_LEFT, VICTORY_CROWN_OFFSET_Y],
                                size: [VICTORY_CROWN_SIZE, VICTORY_CROWN_SIZE],
                                anchor: mod.UIAnchor.TopCenter,
                                visible: false,
                                padding: 0,
                                bgAlpha: 0,
                                bgFill: mod.UIBgFill.None,
                                imageType: mod.UIImageType.CrownSolid,
                                imageColor: VICTORY_CROWN_COLOR_RGB,
                                imageAlpha: 1,
                            },
                            {
                                name: `VictoryDialog_LeftRecord_${pid}`,
                                type: "Text",
                                position: [0, 30],
                                size: [150, 16],
                                anchor: mod.UIAnchor.TopCenter,
                                visible: true,
                                padding: 0,
                                bgAlpha: 0,
                                bgFill: mod.UIBgFill.None,
                                textLabel: mod.Message(mod.stringkeys.twl.hud.roundRecordFormat, 0, 0, 0),
                                textColor: [VICTORY_TEAM1_TEXT_RGB[0], VICTORY_TEAM1_TEXT_RGB[1], VICTORY_TEAM1_TEXT_RGB[2]],
                                textAlpha: 1,
                                textSize: 18,
                                textAnchor: mod.UIAnchor.Center,
                            },
                            {
                                name: `VictoryDialog_LeftRoundWins_${pid}`,
                                type: "Text",
                                position: [0, 50],
                                size: [150, 16],
                                anchor: mod.UIAnchor.TopCenter,
                                visible: true,
                                padding: 0,
                                bgAlpha: 0,
                                bgFill: mod.UIBgFill.None,
                                textLabel: mod.Message(mod.stringkeys.twl.victory.roundWinsFormat, 0),
                                textColor: [VICTORY_TEAM1_TEXT_RGB[0], VICTORY_TEAM1_TEXT_RGB[1], VICTORY_TEAM1_TEXT_RGB[2]],
                                textAlpha: 1,
                                textSize: 12,
                                textAnchor: mod.UIAnchor.Center,
                            },
                            {
                                name: `VictoryDialog_LeftRoundLosses_${pid}`,
                                type: "Text",
                                position: [0, 68],
                                size: [150, 16],
                                anchor: mod.UIAnchor.TopCenter,
                                visible: true,
                                padding: 0,
                                bgAlpha: 0,
                                bgFill: mod.UIBgFill.None,
                                textLabel: mod.Message(mod.stringkeys.twl.victory.roundLossesFormat, 0),
                                textColor: [VICTORY_TEAM1_TEXT_RGB[0], VICTORY_TEAM1_TEXT_RGB[1], VICTORY_TEAM1_TEXT_RGB[2]],
                                textAlpha: 1,
                                textSize: 12,
                                textAnchor: mod.UIAnchor.Center,
                            },
                            {
                                name: `VictoryDialog_LeftRoundTies_${pid}`,
                                type: "Text",
                                position: [0, 86],
                                size: [150, 16],
                                anchor: mod.UIAnchor.TopCenter,
                                visible: true,
                                padding: 0,
                                bgAlpha: 0,
                                bgFill: mod.UIBgFill.None,
                                textLabel: mod.Message(mod.stringkeys.twl.victory.roundTiesFormat, 0),
                                textColor: [VICTORY_TEAM1_TEXT_RGB[0], VICTORY_TEAM1_TEXT_RGB[1], VICTORY_TEAM1_TEXT_RGB[2]],
                                textAlpha: 1,
                                textSize: 12,
                                textAnchor: mod.UIAnchor.Center,
                            },
                            {
                                name: `VictoryDialog_LeftTotalKills_${pid}`,
                                type: "Text",
                                position: [0, 104],
                                size: [150, 16],
                                anchor: mod.UIAnchor.TopCenter,
                                visible: true,
                                padding: 0,
                                bgAlpha: 0,
                                bgFill: mod.UIBgFill.None,
                                textLabel: mod.Message(mod.stringkeys.twl.victory.totalKillsFormat, 0),
                                textColor: [VICTORY_TEAM1_TEXT_RGB[0], VICTORY_TEAM1_TEXT_RGB[1], VICTORY_TEAM1_TEXT_RGB[2]],
                                textAlpha: 1,
                                textSize: 12,
                                textAnchor: mod.UIAnchor.Center,
                            },
                        ],
                    },
                    {
                        name: `VictoryDialog_TeamRight_${pid}`,
                        type: "Container",
                        position: [85, 0],
                        size: [160, 122],
                        anchor: mod.UIAnchor.TopCenter,
                        visible: true,
                        padding: 0,
                        bgColor: [VICTORY_TEAM2_BG_RGB[0], VICTORY_TEAM2_BG_RGB[1], VICTORY_TEAM2_BG_RGB[2]],
                        bgAlpha: 0.95,
                        bgFill: mod.UIBgFill.Solid,
                        children: [
                            {
                                name: `VictoryDialog_RightOutcome_${pid}`,
                                type: "Text",
                                position: [0, 6],
                                size: [150, 22],
                                anchor: mod.UIAnchor.TopCenter,
                                visible: true,
                                padding: 0,
                                bgAlpha: 0,
                                bgFill: mod.UIBgFill.None,
                                textLabel: mod.Message(mod.stringkeys.twl.victory.teamOutcomeFormat, getTeamNameKey(TeamID.Team2), mod.stringkeys.twl.victory.wins),
                                textColor: [VICTORY_TEAM2_TEXT_RGB[0], VICTORY_TEAM2_TEXT_RGB[1], VICTORY_TEAM2_TEXT_RGB[2]],
                                textAlpha: 1,
                                textSize: 18,
                                textAnchor: mod.UIAnchor.Center,
                            },
                            {
                                // Winning crown (shown only for the winning team)
                                name: `VictoryDialog_RightCrown_${pid}`,
                                type: "Image",
                                position: [VICTORY_CROWN_OFFSET_X_RIGHT, VICTORY_CROWN_OFFSET_Y],
                                size: [VICTORY_CROWN_SIZE, VICTORY_CROWN_SIZE],
                                anchor: mod.UIAnchor.TopCenter,
                                visible: false,
                                padding: 0,
                                bgAlpha: 0,
                                bgFill: mod.UIBgFill.None,
                                imageType: mod.UIImageType.CrownSolid,
                                imageColor: VICTORY_CROWN_COLOR_RGB,
                                imageAlpha: 1,
                            },
                            {
                                name: `VictoryDialog_RightRecord_${pid}`,
                                type: "Text",
                                position: [0, 30],
                                size: [150, 16],
                                anchor: mod.UIAnchor.TopCenter,
                                visible: true,
                                padding: 0,
                                bgAlpha: 0,
                                bgFill: mod.UIBgFill.None,
                                textLabel: mod.Message(mod.stringkeys.twl.hud.roundRecordFormat, 0, 0, 0),
                                textColor: [VICTORY_TEAM2_TEXT_RGB[0], VICTORY_TEAM2_TEXT_RGB[1], VICTORY_TEAM2_TEXT_RGB[2]],
                                textAlpha: 1,
                                textSize: 18,
                                textAnchor: mod.UIAnchor.Center,
                            },
                            {
                                name: `VictoryDialog_RightRoundWins_${pid}`,
                                type: "Text",
                                position: [0, 50],
                                size: [150, 16],
                                anchor: mod.UIAnchor.TopCenter,
                                visible: true,
                                padding: 0,
                                bgAlpha: 0,
                                bgFill: mod.UIBgFill.None,
                                textLabel: mod.Message(mod.stringkeys.twl.victory.roundWinsFormat, 0),
                                textColor: [VICTORY_TEAM2_TEXT_RGB[0], VICTORY_TEAM2_TEXT_RGB[1], VICTORY_TEAM2_TEXT_RGB[2]],
                                textAlpha: 1,
                                textSize: 12,
                                textAnchor: mod.UIAnchor.Center,
                            },
                            {
                                name: `VictoryDialog_RightRoundLosses_${pid}`,
                                type: "Text",
                                position: [0, 68],
                                size: [150, 16],
                                anchor: mod.UIAnchor.TopCenter,
                                visible: true,
                                padding: 0,
                                bgAlpha: 0,
                                bgFill: mod.UIBgFill.None,
                                textLabel: mod.Message(mod.stringkeys.twl.victory.roundLossesFormat, 0),
                                textColor: [VICTORY_TEAM2_TEXT_RGB[0], VICTORY_TEAM2_TEXT_RGB[1], VICTORY_TEAM2_TEXT_RGB[2]],
                                textAlpha: 1,
                                textSize: 12,
                                textAnchor: mod.UIAnchor.Center,
                            },
                            {
                                name: `VictoryDialog_RightRoundTies_${pid}`,
                                type: "Text",
                                position: [0, 86],
                                size: [150, 16],
                                anchor: mod.UIAnchor.TopCenter,
                                visible: true,
                                padding: 0,
                                bgAlpha: 0,
                                bgFill: mod.UIBgFill.None,
                                textLabel: mod.Message(mod.stringkeys.twl.victory.roundTiesFormat, 0),
                                textColor: [VICTORY_TEAM2_TEXT_RGB[0], VICTORY_TEAM2_TEXT_RGB[1], VICTORY_TEAM2_TEXT_RGB[2]],
                                textAlpha: 1,
                                textSize: 12,
                                textAnchor: mod.UIAnchor.Center,
                            },
                            {
                                name: `VictoryDialog_RightTotalKills_${pid}`,
                                type: "Text",
                                position: [0, 104],
                                size: [150, 16],
                                anchor: mod.UIAnchor.TopCenter,
                                visible: true,
                                padding: 0,
                                bgAlpha: 0,
                                bgFill: mod.UIBgFill.None,
                                textLabel: mod.Message(mod.stringkeys.twl.victory.totalKillsFormat, 0),
                                textColor: [VICTORY_TEAM2_TEXT_RGB[0], VICTORY_TEAM2_TEXT_RGB[1], VICTORY_TEAM2_TEXT_RGB[2]],
                                textAlpha: 1,
                                textSize: 12,
                                textAnchor: mod.UIAnchor.Center,
                            },
                        ],
                    },
                ],
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
                                    textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, ""),
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
                                    textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, ""),
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
    bindVictoryDialogRefsByName(refs, pid);
    // v0.737 paint viewer-relative colors immediately after build so own team always shows blue.
    applyViewerTeamColorsForVictoryDialogPid(pid);
}

// Re-binds all victory-dialog refs onto the cached HudRefs entry by widget name. Called both at
// initial build and at idempotent-re-entry (when widget exists but refs got wiped).
function bindVictoryDialogRefsByName(refs: HudRefs, pid: number): void {
    refs.victoryRoot = safeFind(`VictoryDialogRoot_${pid}`);
    refs.victoryRestartText = safeFind(`VictoryDialog_Restart_${pid}`);

    refs.victoryTimeHoursTens = safeFind(`VictoryDialog_TimeHT_${pid}`);
    refs.victoryTimeHoursOnes = safeFind(`VictoryDialog_TimeHO_${pid}`);
    refs.victoryTimeMinutesTens = safeFind(`VictoryDialog_TimeMT_${pid}`);
    refs.victoryTimeMinutesOnes = safeFind(`VictoryDialog_TimeMO_${pid}`);
    refs.victoryTimeSecondsTens = safeFind(`VictoryDialog_TimeST_${pid}`);
    refs.victoryTimeSecondsOnes = safeFind(`VictoryDialog_TimeSO_${pid}`);

    refs.victoryRoundsSummaryText = safeFind(`VictoryDialog_Rounds_${pid}`);
    refs.victoryAdminActionsText = safeFind(`VictoryDialog_AdminActions_${pid}`);

    refs.victoryLeftOutcomeText = safeFind(`VictoryDialog_LeftOutcome_${pid}`);
    refs.victoryLeftRoundWinsText = safeFind(`VictoryDialog_LeftRoundWins_${pid}`);
    refs.victoryLeftRoundLossesText = safeFind(`VictoryDialog_LeftRoundLosses_${pid}`);
    refs.victoryLeftRoundTiesText = safeFind(`VictoryDialog_LeftRoundTies_${pid}`);
    refs.victoryLeftTotalKillsText = safeFind(`VictoryDialog_LeftTotalKills_${pid}`);
    refs.victoryLeftCrown = safeFind(`VictoryDialog_LeftCrown_${pid}`);

    refs.victoryRightOutcomeText = safeFind(`VictoryDialog_RightOutcome_${pid}`);
    refs.victoryRightRoundWinsText = safeFind(`VictoryDialog_RightRoundWins_${pid}`);
    refs.victoryRightRoundLossesText = safeFind(`VictoryDialog_RightRoundLosses_${pid}`);
    refs.victoryRightRoundTiesText = safeFind(`VictoryDialog_RightRoundTies_${pid}`);
    refs.victoryLeftRecordText = safeFind(`VictoryDialog_LeftRecord_${pid}`);
    refs.victoryRightRecordText = safeFind(`VictoryDialog_RightRecord_${pid}`);
    refs.victoryRightTotalKillsText = safeFind(`VictoryDialog_RightTotalKills_${pid}`);
    refs.victoryRightCrown = safeFind(`VictoryDialog_RightCrown_${pid}`);
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

//#endregion ----------------- ensureVictoryDialogUiBuiltHidden --------------------
