// @ts-nocheck
// Module: hud — HUD counter helpers, build/ensure, victory/round-end dialogs, update helpers

//#region -------------------- HUD Counter Helpers --------------------

function setCounterText(widget: mod.UIWidget | undefined, value: number): void {
    if (!widget) return;
    safeSetUITextLabel(widget, mod.Message(mod.stringkeys.twl.system.genericCounter, Math.floor(value)));
}

function setRoundRecordText(widget: mod.UIWidget | undefined, wins: number, losses: number, ties: number): void {
    if (!widget) return;
    safeSetUITextLabel(widget, mod.Message(mod.stringkeys.twl.hud.roundRecordFormat, Math.floor(wins), Math.floor(losses), Math.floor(ties)));
}

function getTrendingWinnerTeam(): TeamID | 0 {
    if (State.match.winsT1 > State.match.winsT2) return TeamID.Team1;
    if (State.match.winsT2 > State.match.winsT1) return TeamID.Team2;
    return 0;
}

function setTrendingWinnerCrownForRefs(refs: HudRefs | undefined): void {
    if (!refs) return;
    const winner = getTrendingWinnerTeam();
    const showLeft = winner === TeamID.Team1;
    const showRight = winner === TeamID.Team2;
    safeSetUIWidgetVisible(refs.leftTrendingWinnerCrown, showLeft);
    safeSetUIWidgetVisible(refs.rightTrendingWinnerCrown, showRight);
}

function setTrendingWinnerCrownForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const refs = ensureHudForPlayer(p);
        if (!refs) continue;
        setTrendingWinnerCrownForRefs(refs);
    }
}

function setAdminPanelActionCountText(widget: mod.UIWidget | undefined, value: number): void {
    if (!widget) return;
    mod.SetUITextLabel(widget, mod.Message(mod.stringkeys.twl.adminPanel.actionCountFormat, Math.floor(value)));
}

//#endregion ----------------- HUD Counter Helpers --------------------



//#region -------------------- HUD Round State + Help Text --------------------

function setRoundStateText(widget: mod.UIWidget | undefined): void {
    if (!widget) return;

    if (State.round.phase === RoundPhase.GameOver) {
        mod.SetUITextLabel(widget, mod.Message(mod.stringkeys.twl.hud.roundStateGameOver));
        mod.SetUITextColor(widget, COLOR_WARNING_YELLOW);
        return;
    }

    const isLive = isRoundLive();
    const stateKey = isLive ? mod.stringkeys.twl.hud.roundStateLive : mod.stringkeys.twl.hud.roundStateNotReady;
    mod.SetUITextLabel(widget, mod.Message(stateKey));

    // Color: white when LIVE, red when NOT READY
    mod.SetUITextColor(widget, isLive ? mod.CreateVector(1, 1, 1) : COLOR_NOT_READY_RED);
}

function setRoundLiveHelpText(
    root: mod.UIWidget | undefined,
    text: mod.UIWidget | undefined
): void {
    if (!root || !text) return;

    const show = (!State.match.isEnded) && (isRoundLive());
    mod.SetUIWidgetVisible(root, show);

    if (!show) return;

    const label = mod.Message(mod.stringkeys.twl.hud.roundLiveHelpFormat, Math.floor(State.round.killsTarget));
    if (text) {
        mod.SetUITextLabel(text, label);
        mod.SetUITextColor(text, mod.CreateVector(1, 1, 1));
    }
}

function getClockTimeParts(remainingSeconds: number): { minutes: number; secTens: number; secOnes: number } {
    const clamped = Math.max(0, Math.floor(remainingSeconds));
    const minutes = Math.floor(clamped / 60);
    const seconds = clamped % 60;
    const secTens = Math.floor(seconds / 10);
    const secOnes = seconds % 10;
    return {
        minutes,
        secTens,
        secOnes,
    };
}

// UI hardening helpers skip work if a widget is missing (ParseUI and safeFind can yield undefined).
// This prevents runtime issues and also avoids TS errors from passing UIWidget | undefined into mod.* UI calls.
function safeSetUIWidgetVisible(widget: mod.UIWidget | undefined, visible: boolean): void {
    if (!widget) return;
    try {
        mod.SetUIWidgetVisible(widget, visible);
    } catch {
        return;
    }
}

function safeSetUITextLabel(widget: mod.UIWidget | undefined, label: mod.Message): void {
    if (!widget) return;
    try {
        mod.SetUITextLabel(widget, label);
    } catch {
        return;
    }
}

function safeSetUITextColor(widget: mod.UIWidget | undefined, color: mod.Vector): void {
    if (!widget) return;
    try {
        mod.SetUITextColor(widget, color);
    } catch {
        return;
    }
}

function safeSetUIWidgetDepth(widget: mod.UIWidget | undefined, depth: mod.UIDepth): void {
    if (!widget) return;
    try {
        mod.SetUIWidgetDepth(widget, depth);
    } catch {
        return;
    }
}

function safeAddUIContainer(
    name: string,
    position: mod.Vector,
    size: mod.Vector,
    anchor: mod.UIAnchor,
    parent: mod.UIWidget,
    visible: boolean,
    padding: number,
    color: mod.Vector,
    alpha: number,
    fill: mod.UIBgFill,
    depth: mod.UIDepth,
    player: mod.Player
): void {
    try {
        mod.AddUIContainer(
            name,
            position,
            size,
            anchor,
            parent,
            visible,
            padding,
            color,
            alpha,
            fill,
            depth,
            player
        );
    } catch {
        return;
    }
}

function safeSetUIWidgetSize(widget: mod.UIWidget | undefined, size: mod.Vector): void {
    if (!widget) return;
    try {
        mod.SetUIWidgetSize(widget, size);
    } catch {
        return;
    }
}

function setWidgetVisible(widget: mod.UIWidget | undefined, visible: boolean): void {
    if (!widget) return;
    safeSetUIWidgetVisible(widget, visible);
// SetUITextLabel only accepts mod.Message; string inputs are treated as string keys and wrapped with mod.Message(key).
}

function setWidgetText(widget: mod.UIWidget | undefined, label: string | mod.Message): void {
    if (!widget) return;
    if (typeof label === 'string') {
        safeSetUITextLabel(widget, mod.Message(label));
        return;
    }
    safeSetUITextLabel(widget, label);
}

function ensureTopHudRootForPid(pid: number, player?: mod.Player): mod.UIWidget | undefined {
    const rootName = `TopHudRoot_${pid}`;
    let root = safeFind(rootName);
    if (!root && player) {
        mod.AddUIContainer(
            rootName,
            mod.CreateVector(0, 0, 0),
            mod.CreateVector(TOP_HUD_ROOT_WIDTH, TOP_HUD_ROOT_HEIGHT, 0),
            mod.UIAnchor.TopCenter,
            mod.GetUIRoot(),
            true,
            0,
            mod.CreateVector(0, 0, 0),
            0,
            mod.UIBgFill.None,
            mod.UIDepth.AboveGameUI,
            player
        );
        root = safeFind(rootName);
    }

    if (!root) return undefined;
    mod.SetUIWidgetDepth(root, mod.UIDepth.AboveGameUI);

    const reparentIds = [
        "Container_TopMiddle_CoreUI_",
        "Container_TopLeft_CoreUI_",
        "Container_TopRight_CoreUI_",
        "Container_TopLeft_RoundKills_",
        "Container_TopRight_RoundKills_",
        "RoundCounterContainer_",
        "RoundCounterMaxContainer_",
        "TeamLeft_Wins_Counter_",
        "TeamRight_Wins_Counter_",
        "TeamLeft_Kills_Counter_",
        "TeamRight_Kills_Counter_",
    ];

    for (const base of reparentIds) {
        const widget = safeFind(base + pid);
        if (!widget) continue;
        mod.SetUIWidgetParent(widget, root);
        mod.SetUIWidgetDepth(widget, mod.UIDepth.AboveGameUI);
    }

    const topHudDepthIds = [
        "MatchTimerRoot_",
        "RoundStateRoot_",
    ];
    for (const base of topHudDepthIds) {
        const widget = safeFind(base + pid);
        if (widget) mod.SetUIWidgetDepth(widget, mod.UIDepth.AboveGameUI);
    }

    return root;
}

function setHudHelpDepthForPid(pid: number): void {
    const helpIds = [
        `Container_HelpText_${pid}`,
        `HelpText_${pid}`,
        `Container_ReadyStatus_${pid}`,
        `ReadyStatusText_${pid}`,
        `PlayersReadyText_${pid}`,
        `RoundLiveHelpRoot_${pid}`,
        `RoundLiveHelpText_${pid}`,
    ];
    for (const name of helpIds) {
        const widget = safeFind(name);
        if (widget) mod.SetUIWidgetDepth(widget, mod.UIDepth.BelowGameUI);
    }
}

function isLiveRespawnDisabled(): boolean {
    return !State.admin.liveRespawnEnabled;
}

/**
 * Sets the shared round state text (e.g., NOT READY / LIVE / GAME OVER) for every player's HUD.
 * This is a broadcast-style UI update:
 * - It does not mutate round state; it reflects whatever authoritative state already exists.
 * - It should be called after any change that affects the round phase so HUDs remain consistent.
 */

function setRoundStateTextForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const cache = ensureClockUIAndGetCache(p);
        if (!cache) continue;
        setRoundStateText(cache.roundStateText);
        setRoundLiveHelpText(cache.roundLiveHelpRoot, cache.roundLiveHelpText);
    }
    // Keep the pre-round ready count line in sync with any round-phase HUD refresh.
    updatePlayersReadyHudTextForAllPlayers();
}

//#endregion ----------------- HUD Round State + Help Text --------------------



//#region -------------------- HUD Ready Count --------------------

/**
 * Updates the yellow HUD line: "X / Y PLAYERS READY" (pre-round only).
 * Visibility rules:
 * - Only shown while preparing for a new round (round NOT live).
 * - Hidden during game-over / victory dialog phases.
 * - Remains visible until the round is actually live (isRoundLive() === true).
 * IMPORTANT: Any code path that changes State.players.readyByPid MUST also refresh:
 *   - updatePlayersReadyHudTextForAllPlayers()
 *   - renderReadyDialogForAllVisibleViewers() (if the dialog can be open)
 * to prevent stale HUD/roster state (e.g., after swap teams or leaving base forces NOT READY).
 */
function updatePlayersReadyHudTextForAllPlayers(): void {
    // Compute counts once, then broadcast the same label to all viewers.
    const active = getActivePlayers();
    const total = active.all.length;

    let readyCount = 0;
    for (let i = 0; i < total; i++) {
        const pid = safeGetPlayerId(active.all[i]);
        if (pid === undefined) continue;
        if (State.players.readyByPid[pid]) readyCount++;
    }

    const shouldShow = !State.match.isEnded && !State.match.victoryDialogActive;

    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const cache = ensureClockUIAndGetCache(p);
        if (!cache || !cache.playersReadyText) continue;

        // Toggle visibility first so we can avoid unnecessary label churn when hidden.
        safeSetUIWidgetVisible(cache.playersReadyText, shouldShow);
        if (!shouldShow) continue;

        let label: mod.Message;
        if (isRoundLive()) {
            const preset = MATCHUP_PRESETS[State.round.matchupPresetIndex];
            label = mod.Message(mod.stringkeys.twl.readyDialog.matchupFormat, preset.leftPlayers, preset.rightPlayers);
            mod.SetUITextLabel(cache.playersReadyText, label);
            mod.SetUITextColor(cache.playersReadyText, COLOR_NORMAL);
        } else {
            label = mod.Message(mod.stringkeys.twl.hud.playersReadyFormat, readyCount, total);
            mod.SetUITextLabel(cache.playersReadyText, label);
            mod.SetUITextColor(cache.playersReadyText, COLOR_WARNING_YELLOW);
        }
    }
}

// Lightweight helper for ready-up broadcasts (avoids recomputing counts in UI handlers).
function getReadyCountsForMessage(): { readyCount: number; totalCount: number } {
    const active = getActivePlayers();
    const totalCount = active.all.length;
    let readyCount = 0;
    for (let i = 0; i < totalCount; i++) {
        const pid = safeGetPlayerId(active.all[i]);
        if (pid === undefined) continue;
        if (State.players.readyByPid[pid]) readyCount++;
    }
    return { readyCount, totalCount };
}

//#endregion ----------------- HUD Ready Count --------------------



//#region -------------------- HUD Victory Dialog Updates --------------------

function getElapsedHmsParts(totalSeconds: number): { hours: number; minutes: number; seconds: number } {
    const sec = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const seconds = sec % 60;
    return { hours, minutes, seconds };
}

function setVictoryWinnerCrownForRefs(refs: HudRefs | undefined): void {
    if (!refs) return;
    const winner = getTrendingWinnerTeam();
    const showLeft = winner === TeamID.Team1;
    const showRight = winner === TeamID.Team2;
    safeSetUIWidgetVisible(refs.victoryLeftCrown, showLeft);
    safeSetUIWidgetVisible(refs.victoryRightCrown, showRight);
}

function updateVictoryDialogRosterSizing(refs: HudRefs, rosterRows: number): void {
    const clampedRows = Math.max(1, Math.min(TEAM_ROSTER_MAX_ROWS, Math.floor(rosterRows)));
    const rosterHeight = VICTORY_DIALOG_ROSTER_ROW_PADDING_TOP + (clampedRows * VICTORY_DIALOG_ROSTER_ROW_HEIGHT) + VICTORY_DIALOG_ROSTER_ROW_PADDING_BOTTOM;
    const dialogHeight = VICTORY_DIALOG_ROSTER_ROW_Y + rosterHeight + VICTORY_DIALOG_BOTTOM_PADDING;

    if (refs.victoryRoot) {
        mod.SetUIWidgetSize(refs.victoryRoot, mod.CreateVector(VICTORY_DIALOG_WIDTH, dialogHeight, 0));
    }
    if (refs.victoryRosterRow) {
        mod.SetUIWidgetSize(refs.victoryRosterRow, mod.CreateVector(VICTORY_DIALOG_ROSTER_ROW_WIDTH, rosterHeight, 0));
    }
    if (refs.victoryRosterLeftContainer) {
        mod.SetUIWidgetSize(refs.victoryRosterLeftContainer, mod.CreateVector(VICTORY_DIALOG_ROSTER_CONTAINER_WIDTH, rosterHeight, 0));
    }
    if (refs.victoryRosterRightContainer) {
        mod.SetUIWidgetSize(refs.victoryRosterRightContainer, mod.CreateVector(VICTORY_DIALOG_ROSTER_CONTAINER_WIDTH, rosterHeight, 0));
    }
}

function computeTeamOutcomeKey(teamNum: TeamID): number {
    if (State.match.winnerTeam === undefined || State.match.winnerTeam === 0) {
        return mod.stringkeys.twl.victory.draws;
    }
    return State.match.winnerTeam === teamNum ? mod.stringkeys.twl.victory.wins : mod.stringkeys.twl.victory.loses;
}

/**
 * Updates per-player Victory dialog widgets to reflect current match-end state.
 * Notes:
 * - This only updates UI text/visibility; it does not decide winners.
 * - Caller must ensure the dialog is built before updating.
 * - Remaining seconds can wrap at 0 (engine quirk); we clamp to 0 to avoid huge values.
 */
function updateVictoryDialogForPlayer(player: mod.Player, remainingSeconds: number): void {
    // Per-player update for the match-end victory modal: winner label, scores, and restart/rotate countdown.
    // This is called once per second while the victory dialog is active.
    // Determine the target player id; dialog widgets are keyed per-player.
    if (!player || !mod.IsPlayerValid(player)) return;
    const pid = safeGetPlayerId(player);
    if (pid === undefined || isPidDisconnected(pid)) return;
    // Look up cached UI references for this player (if missing, this update becomes a no-op).
    const refs = State.hudCache.hudByPid[pid];
    if (!refs) return;

    if (refs.victoryRoot) {
        // Apply visibility rules for the dialog parts based on match-end state.
        setWidgetVisible(refs.victoryRoot, State.match.victoryDialogActive);
    }

    if (!State.match.victoryDialogActive) {
        return;
    }
    if (refs.victoryRestartText) {
        // Update string-key labels (Strings.json) so the dialog reflects the latest outcome/countdown.
        // Remaining seconds can wrap/roll over on some engine timers at the moment it hits 0.
        // Treat any out-of-range value as 0 to avoid displaying a huge number at the end.
        let displaySeconds = Math.floor(remainingSeconds);
        if (displaySeconds < 0) displaySeconds = 0;
        if (displaySeconds > MATCH_END_DELAY_SECONDS) displaySeconds = 0;
        safeSetUITextLabel(refs.victoryRestartText, mod.Message(mod.stringkeys.twl.victory.restartInFormat, displaySeconds));
    }
    const parts = getElapsedHmsParts(State.match.endElapsedSecondsSnapshot);
    const hours = Math.min(99, Math.max(0, Math.floor(parts.hours)));
    const minutes = Math.min(59, Math.max(0, Math.floor(parts.minutes)));
    const seconds = Math.min(59, Math.max(0, Math.floor(parts.seconds)));

    const hT = Math.floor(hours / 10);
    const hO = hours % 10;
    const mT = Math.floor(minutes / 10);
    const mO = minutes % 10;
    const sT = Math.floor(seconds / 10);
    const sO = seconds % 10;

    if (refs.victoryTimeHoursTens) safeSetUITextLabel(refs.victoryTimeHoursTens, mod.Message(mod.stringkeys.twl.hud.clock.digit, hT));
    if (refs.victoryTimeHoursOnes) safeSetUITextLabel(refs.victoryTimeHoursOnes, mod.Message(mod.stringkeys.twl.hud.clock.digit, hO));
    if (refs.victoryTimeMinutesTens) safeSetUITextLabel(refs.victoryTimeMinutesTens, mod.Message(mod.stringkeys.twl.hud.clock.digit, mT));
    if (refs.victoryTimeMinutesOnes) safeSetUITextLabel(refs.victoryTimeMinutesOnes, mod.Message(mod.stringkeys.twl.hud.clock.digit, mO));
    if (refs.victoryTimeSecondsTens) safeSetUITextLabel(refs.victoryTimeSecondsTens, mod.Message(mod.stringkeys.twl.hud.clock.digit, sT));
    if (refs.victoryTimeSecondsOnes) safeSetUITextLabel(refs.victoryTimeSecondsOnes, mod.Message(mod.stringkeys.twl.hud.clock.digit, sO));

    if (refs.victoryRoundsSummaryText) {
        safeSetUITextLabel(refs.victoryRoundsSummaryText, mod.Message(mod.stringkeys.twl.victory.roundsSummaryFormat, Math.floor(State.round.current), Math.floor(State.round.max)));
    }
    if (refs.victoryAdminActionsText) {
        const actionCount = Math.max(0, Math.floor(State.admin.actionCount));
        setWidgetVisible(refs.victoryAdminActionsText, actionCount > 0);
        if (actionCount > 0) {
            const overrideUsed = State.admin.tieBreakerOverrideUsed; // Highlight if any override was used this match.
            safeSetUITextLabel(
                refs.victoryAdminActionsText,
                mod.Message(
                    overrideUsed
                        ? mod.stringkeys.twl.adminPanel.actionCountVictoryFormatRandomOverride
                        : mod.stringkeys.twl.adminPanel.actionCountVictoryFormat,
                    actionCount
                )
            );
            safeSetUITextColor(refs.victoryAdminActionsText, overrideUsed ? COLOR_RED : COLOR_WARNING_YELLOW);
        }
    }

    const t1OutcomeKey = computeTeamOutcomeKey(TeamID.Team1);
    const t2OutcomeKey = computeTeamOutcomeKey(TeamID.Team2);

    if (refs.victoryLeftOutcomeText) {
        safeSetUITextLabel(refs.victoryLeftOutcomeText, mod.Message(mod.stringkeys.twl.victory.teamOutcomeFormat, getTeamNameKey(TeamID.Team1), t1OutcomeKey));
    }
    if (refs.victoryRightOutcomeText) {
        safeSetUITextLabel(refs.victoryRightOutcomeText, mod.Message(mod.stringkeys.twl.victory.teamOutcomeFormat, getTeamNameKey(TeamID.Team2), t2OutcomeKey));
    }
    setVictoryWinnerCrownForRefs(refs);

    if (refs.victoryLeftRecordText) {
        safeSetUITextLabel(refs.victoryLeftRecordText, mod.Message(mod.stringkeys.twl.hud.roundRecordFormat, Math.floor(State.match.winsT1), Math.floor(State.match.winsT2), Math.floor(State.match.tiesT1)));
    }
    if (refs.victoryRightRecordText) {
        safeSetUITextLabel(refs.victoryRightRecordText, mod.Message(mod.stringkeys.twl.hud.roundRecordFormat, Math.floor(State.match.winsT2), Math.floor(State.match.winsT1), Math.floor(State.match.tiesT2)));
    }

    if (refs.victoryLeftRoundWinsText) {
        safeSetUITextLabel(refs.victoryLeftRoundWinsText, mod.Message(mod.stringkeys.twl.victory.roundWinsFormat, Math.floor(State.match.winsT1)));
    }
    if (refs.victoryRightRoundWinsText) {
        safeSetUITextLabel(refs.victoryRightRoundWinsText, mod.Message(mod.stringkeys.twl.victory.roundWinsFormat, Math.floor(State.match.winsT2)));
    }

    const lossesT1 = State.match.lossesT1;
    const lossesT2 = State.match.lossesT2;

    if (refs.victoryLeftRoundLossesText) {
        safeSetUITextLabel(refs.victoryLeftRoundLossesText, mod.Message(mod.stringkeys.twl.victory.roundLossesFormat, Math.floor(lossesT1)));
    }
    if (refs.victoryRightRoundLossesText) {
        safeSetUITextLabel(refs.victoryRightRoundLossesText, mod.Message(mod.stringkeys.twl.victory.roundLossesFormat, Math.floor(lossesT2)));
    }
    if (refs.victoryLeftRoundTiesText) {
        safeSetUITextLabel(refs.victoryLeftRoundTiesText, mod.Message(mod.stringkeys.twl.victory.roundTiesFormat, Math.floor(State.match.tiesT1)));
    }
    if (refs.victoryRightRoundTiesText) {
        safeSetUITextLabel(refs.victoryRightRoundTiesText, mod.Message(mod.stringkeys.twl.victory.roundTiesFormat, Math.floor(State.match.tiesT2)));
    }

    if (refs.victoryLeftTotalKillsText) {
        safeSetUITextLabel(refs.victoryLeftTotalKillsText, mod.Message(mod.stringkeys.twl.victory.totalKillsFormat, Math.floor(State.scores.t1TotalKills)));
    }
    if (refs.victoryRightTotalKillsText) {
        safeSetUITextLabel(refs.victoryRightTotalKillsText, mod.Message(mod.stringkeys.twl.victory.totalKillsFormat, Math.floor(State.scores.t2TotalKills)));
    }

    if (refs.victoryLeftRosterText || refs.victoryRightRosterText) {
        const roster = getRosterDisplayEntries();
        updateVictoryDialogRosterSizing(refs, roster.maxRows);
        for (let i = 0; i < TEAM_ROSTER_MAX_ROWS; i++) {
            const leftWidget = refs.victoryLeftRosterText?.[i];
            if (leftWidget) {
                const leftEntry = roster.team1[i];
                setWidgetVisible(leftWidget, !!leftEntry);
                if (leftEntry) {
                    safeSetUITextLabel(leftWidget, getRosterEntryNameMessage(leftEntry));
                }
            }

            const rightWidget = refs.victoryRightRosterText?.[i];
            if (rightWidget) {
                const rightEntry = roster.team2[i];
                setWidgetVisible(rightWidget, !!rightEntry);
                if (rightEntry) {
                    safeSetUITextLabel(rightWidget, getRosterEntryNameMessage(rightEntry));
                }
            }
        }
    }
}

function updateVictoryDialogForAllPlayers(remainingSeconds: number): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const pid = safeGetPlayerId(p);
        if (pid === undefined || isPidDisconnected(pid)) continue;
        updateVictoryDialogForPlayer(p, remainingSeconds);
    }
}

//#endregion ----------------- HUD Victory Dialog Updates --------------------



//#region -------------------- HUD Round-End Dialog Updates --------------------

function setRoundWinCrownForRefs(refs: HudRefs | undefined, winnerTeamNum: TeamID | 0, visible: boolean): void {
    if (!refs) return;
    const showLeft = visible && winnerTeamNum === TeamID.Team1;
    const showRight = visible && winnerTeamNum === TeamID.Team2;
    safeSetUIWidgetVisible(refs.leftRoundKillsCrown, showLeft);
    safeSetUIWidgetVisible(refs.rightRoundKillsCrown, showRight);
}

function setRoundWinCrownForAllPlayers(winnerTeamNum: TeamID | 0, visible: boolean): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const pid = safeGetPlayerId(p);
        if (pid === undefined || isPidDisconnected(pid)) continue;
        const refs = State.hudCache.hudByPid[pid];
        if (!refs) continue;
        setRoundWinCrownForRefs(refs, winnerTeamNum, visible);
    }
}

function setRoundEndDialogVisibleForAllPlayers(visible: boolean): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    State.round.flow.roundEndDialogVisible = visible;
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const pid = safeGetPlayerId(p);
        if (pid === undefined || isPidDisconnected(pid)) continue;
        const refs = State.hudCache.hudByPid[pid];
        if (!refs) continue;
        if (refs.roundEndRoot) {
            setWidgetVisible(refs.roundEndRoot, visible);
        }
    }
    setRoundWinCrownForAllPlayers(State.round.lastWinnerTeam, visible);
    updateHelpTextVisibilityForAllPlayers();
}

// Round-end UI lockdown: avoid touching overtime HUD widgets during teardown transitions.
function isRoundEndUiLockdownActive(): boolean {
    return State.round.flow.roundEndUiLockdown
        || State.round.flow.roundEndDialogVisible
        || State.round.flow.cleanupActive;
}

function isRoundEndDetailDrawReason(reason: RoundEndDetailReason): boolean {
    return reason === RoundEndDetailReason.TimeOverDrawEvenElims
        || reason === RoundEndDetailReason.TimeOverDrawNoAction;
}

function getRoundEndDetailForViewer(
    viewerTeamNum: TeamID | 0,
    winnerTeamNum: TeamID | 0
): { key: number; color: mod.Vector; value?: number } | undefined {
    const reason = State.round.lastEndDetailReason;
    if (reason === RoundEndDetailReason.None) return undefined;

    if (isRoundEndDetailDrawReason(reason) || winnerTeamNum === 0) {
        const drawKey = reason === RoundEndDetailReason.TimeOverDrawNoAction
            ? STR_ROUND_END_DETAIL_DRAW_NO_ACTION
            : STR_ROUND_END_DETAIL_DRAW_EVEN_ELIMS;
        return { key: drawKey, color: COLOR_WHITE };
    }

    const isViewerWinner = viewerTeamNum !== 0 && viewerTeamNum === winnerTeamNum;
    let key: number;
    let value: number | undefined;
    switch (reason) {
        case RoundEndDetailReason.Elimination:
            key = isViewerWinner ? STR_ROUND_END_DETAIL_WIN_ELIMINATION : STR_ROUND_END_DETAIL_LOSE_ELIMINATION;
            break;
        case RoundEndDetailReason.ObjectiveCaptured:
            key = isViewerWinner ? STR_ROUND_END_DETAIL_WIN_OBJECTIVE_CAPTURED : STR_ROUND_END_DETAIL_LOSE_OBJECTIVE_CAPTURED;
            break;
        case RoundEndDetailReason.TimeOverObjectiveProgress:
            key = isViewerWinner ? STR_ROUND_END_DETAIL_WIN_OBJECTIVE_PROGRESS : STR_ROUND_END_DETAIL_LOSE_OBJECTIVE_PROGRESS;
            const percents = getOvertimeDisplayPercents(State.round.lastObjectiveProgress);
            value = winnerTeamNum === TeamID.Team1
                ? percents.left
                : (winnerTeamNum === TeamID.Team2 ? percents.right : 50);
            break;
        case RoundEndDetailReason.TimeOverKills:
            key = isViewerWinner ? STR_ROUND_END_DETAIL_WIN_TIME_OVER_KILLS : STR_ROUND_END_DETAIL_LOSE_TIME_OVER_KILLS;
            break;
        default:
            return undefined;
    }

    const teamColor = winnerTeamNum === TeamID.Team1
        ? COLOR_BLUE
        : (winnerTeamNum === TeamID.Team2 ? COLOR_RED : COLOR_WHITE);
    return { key, color: teamColor, value };
}

function updateRoundEndDialogForAllPlayers(winnerTeamNum: TeamID | 0): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const pid = safeGetPlayerId(p);
        if (pid === undefined || isPidDisconnected(pid)) continue;
        updateRoundEndDialogForPlayer(p, winnerTeamNum);
    }
}

function updateRoundEndDialogForPlayer(player: mod.Player, winnerTeamNum: TeamID | 0): void {
    if (!player || !mod.IsPlayerValid(player)) return;
    const pid = safeGetPlayerId(player);
    if (pid === undefined || isPidDisconnected(pid)) return;
    const refs = State.hudCache.hudByPid[pid];
    if (!refs) return;

    // Ensure labels are always authoritative at the time the dialog is shown.
    if (refs.roundEndRoundText) {
        safeSetUITextLabel(
            refs.roundEndRoundText,
            // RoundEnd_RoundNumber is a dedicated format key ("ROUND {0}") to avoid passing an empty string into RoundState_Format,
            // which Portal renders as <unknown string> when the key cannot be resolved.
            mod.Message(mod.stringkeys.twl.roundEnd.roundNumber, State.round.current)
        );
    }

    if (refs.roundEndOutcomeText) {
        if (winnerTeamNum === TeamID.Team1) {
            safeSetUITextLabel(
                refs.roundEndOutcomeText,
                mod.Message(mod.stringkeys.twl.victory.teamOutcomeFormat, getTeamNameKey(TeamID.Team1), mod.stringkeys.twl.victory.wins)
            );
        } else if (winnerTeamNum === TeamID.Team2) {
            safeSetUITextLabel(
                refs.roundEndOutcomeText,
                mod.Message(mod.stringkeys.twl.victory.teamOutcomeFormat, getTeamNameKey(TeamID.Team2), mod.stringkeys.twl.victory.wins)
            );
        } else {
            setWidgetText(refs.roundEndOutcomeText, mod.stringkeys.twl.roundEnd.draw);
        }
    }

    if (refs.roundEndDetailText) {
        const viewerTeamNum = getTeamNumber(mod.GetTeam(player));
        const detail = getRoundEndDetailForViewer(viewerTeamNum, winnerTeamNum);
        if (detail) {
            const label = detail.value !== undefined
                ? mod.Message(detail.key, detail.value)
                : mod.Message(detail.key);
            safeSetUITextLabel(refs.roundEndDetailText, label);
            safeSetUITextColor(refs.roundEndDetailText, detail.color);
            setWidgetVisible(refs.roundEndDetailText, true);
        } else {
            setWidgetVisible(refs.roundEndDetailText, false);
        }
    }

}

//#endregion ----------------- HUD Round-End Dialog Updates --------------------



//#region -------------------- HUD Build/Ensure - Dialog Open + Help Text Visibility --------------------

function isTeamSwitchDialogOpenForPid(pid: number): boolean {
    // With UI caching, the dialog root widget may continue to exist while hidden.
    // Use the explicit per-player state flag as the source of truth for "open".
    return !!State.players.teamSwitchData[pid]?.dialogVisible;
}

/**
 * Applies the current 'help text' visibility rules to one specific player id.
 * This is intentionally pid-based (not Player-based) so it can be used during join/leave and UI rebuilds.
 * Keep in mind:
 * - The player may not be present at the time of the call; this function should tolerate missing UI refs.
 * - Visibility rules typically depend on per-player flags (e.g., 'dont show again') and current round state.
 */

function updateHelpTextVisibilityForPid(pid: number): void {
    // Fetch this player's HUD/widget refs; if missing (e.g., during join), bail out safely.
    const refs = State.hudCache.hudByPid[pid];
    if (!refs) return;

    const isDialogOpen = isTeamSwitchDialogOpenForPid(pid);
    const isReady = !!State.players.readyByPid[pid];
    const isDeployed = !!State.players.deployedByPid[pid];
    const canShow = (!State.match.isEnded)
        && (!State.match.victoryDialogActive)
        && (!State.round.flow.roundEndDialogVisible)
        && (!State.round.flow.cleanupActive)
        && (isDeployed);
    const showHelp = canShow && (!isRoundLive()) && (!isReady) && (!isDialogOpen);
    const showReady = canShow && (!isRoundLive()) && (isReady) && (!isDialogOpen);

    const helpContainer = refs.helpTextContainer ?? safeFind(`Container_HelpText_${pid}`);
    if (helpContainer) {
        // Apply the computed visibility to the help text widget.
        safeSetUIWidgetVisible(helpContainer, showHelp);
    }

    const helpText = safeFind(`HelpText_${pid}`);
    if (helpText) {
        mod.SetUITextLabel(helpText, mod.Message(mod.stringkeys.twl.hud.helpText));
    }

    const readyContainer = refs.readyStatusContainer ?? safeFind(`Container_ReadyStatus_${pid}`);
    if (readyContainer) {
        safeSetUIWidgetVisible(readyContainer, showReady);
    }

    const readyText = safeFind(`ReadyStatusText_${pid}`);
    if (readyText) {
        mod.SetUITextLabel(readyText, mod.Message(mod.stringkeys.twl.hud.readyText));
    }
}

function updateHelpTextVisibilityForPlayer(player: mod.Player): void {
    updateHelpTextVisibilityForPid(mod.GetObjId(player));
}

function updateHelpTextVisibilityForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        updateHelpTextVisibilityForPid(mod.GetObjId(p));
    }
}

//#endregion ----------------- HUD Build/Ensure - Dialog Open + Help Text Visibility --------------------



//#region -------------------- HUD Build/Ensure Function Start --------------------

// Code Cleanup: This is an absurd mega-function - we should refactor and break down
// Ensures all persistent HUD widgets exist for a player.
// This function is idempotent and safe to call on join, respawn, or reconnect.
// Widget references created here are reused and updated elsewhere.

function ensureHudForPlayer(player: mod.Player): HudRefs | undefined {
    // Per-player HUD lifecycle:
    // - HUD widgets are created once per player and then only updated (never recreated) during the match.
    // - This function is safe to call repeatedly (join, respawn, reconnect, admin actions).
    // - If a widget is missing, create it and store/find it via the UI root.

    if (!player || !mod.IsPlayerValid(player)) return undefined;

    const pid = getObjId(player);

    // If cached and still valid, return it
    const cached = State.hudCache.hudByPid[pid];
    if (cached && (safeFind(`Container_HelpText_${pid}`) || safeFind(`Container_ReadyStatus_${pid}`))) {
        const helpContainer = safeFind(`Container_HelpText_${pid}`);
        if (helpContainer) {
            mod.SetUIWidgetPosition(helpContainer, mod.CreateVector(-165.5, 75.25, 0)); //-116.5, 75.25, 0
        }
        const readyContainer = safeFind(`Container_ReadyStatus_${pid}`);
        if (readyContainer) {
            mod.SetUIWidgetPosition(readyContainer, mod.CreateVector(-165.5, 75.25, 0));
        }
        const adminActionCounter = safeFind(`AdminPanelActionCount_${pid}`);
        if (adminActionCounter) {
            mod.SetUIWidgetPosition(adminActionCounter, mod.CreateVector(20, 22, 0));
        }
        ensureTopHudRootForPid(pid, player);
        setHudHelpDepthForPid(pid);
        updateSettingsSummaryHudForPid(pid);

        return cached;
    }

    const refs: HudRefs = { pid, roots: [] };

    //#endregion -------------------- HUD Build/Ensure Function Start --------------------



    //#region -------------------- HUD Build/Ensure - Upper-Left HUD --------------------

    // --- Static HUD: Upper-left small box ---
    {
        const rootName = `Upper_Left_Container_${pid}`;
        const upperLeft = modlib.ParseUI({
            name: rootName,
            type: "Container",
            playerId: player,
            // position: [x, y] offset; direction depends on anchor, so verify visually in-game
            position: [5, 5 + TOP_HUD_OFFSET_Y],
            size: [200, 30],
            anchor: mod.UIAnchor.TopLeft,
            visible: true,
            padding: 1,
            bgColor: [0.251, 0.0941, 0.0667],
            bgAlpha: 0.5625,
            bgFill: mod.UIBgFill.Blur,
            children: [
                {
                    // UI element: Upper_Left_Text_${pid}
                    name: `Upper_Left_Text_${pid}`,
                    type: "Text",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [5, -5.5],
                    size: [200, 17],
                    anchor: mod.UIAnchor.CenterLeft,
                    visible: true,
                    padding: 0,
                    bgColor: [0.8353, 0.9216, 0.9765],
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.Blur,
                    textLabel: mod.stringkeys.twl.hud.branding.title,
                    textColor: [0.6784, 0.9922, 0.5255],
                    textAlpha: 1,
                    textSize: 9,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    // UI element: Upper_Left_Text_2_${pid}
                    name: `Upper_Left_Text_2_${pid}`,
                    type: "Text",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [7.25, 12.5],
                    size: [200, 16.5],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgColor: [0.2, 0.2, 0.2],
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.stringkeys.twl.hud.branding.subtitle,
                    textColor: [0.6784, 0.9922, 0.5255],
                    textAlpha: 1,
                    textSize: 9,
                    textAnchor: mod.UIAnchor.Center,
                },
            ],
        });
        if (upperLeft) refs.roots.push(upperLeft);
    }

    // --- Static HUD: Upper-left settings summary (below branding) ---
    {
        const SETTINGS_CONTAINER_X = 5;
        const SETTINGS_CONTAINER_Y = 5 + TOP_HUD_OFFSET_Y + 30 + 6;
        const SETTINGS_LINE_HEIGHT = 12;
        const SETTINGS_TEXT_WIDTH = 200;
        const SETTINGS_TEXT_SIZE = 9;
        const SETTINGS_TEXT_COLOR: [number, number, number] = [0.6784, 0.9922, 0.5255];

        const settingsSummary = modlib.ParseUI({
            name: `Upper_Left_Settings_${pid}`,
            type: "Container",
            playerId: player,
            position: [SETTINGS_CONTAINER_X, SETTINGS_CONTAINER_Y],
            size: [SETTINGS_TEXT_WIDTH, SETTINGS_LINE_HEIGHT * 6],
            anchor: mod.UIAnchor.TopLeft,
            visible: true,
            padding: 1,
            bgColor: [0.251, 0.0941, 0.0667],
            bgAlpha: 0.5625,
            bgFill: mod.UIBgFill.Blur,
            children: [
                {
                    name: `Settings_GameMode_${pid}`,
                    type: "Text",
                    position: [6, 0],
                    size: [SETTINGS_TEXT_WIDTH - 12, 16],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(STR_HUD_SETTINGS_GAME_MODE_FORMAT, STR_HUD_SETTINGS_GAME_MODE_DEFAULT),
                    textColor: SETTINGS_TEXT_COLOR,
                    textAlpha: 1,
                    textSize: SETTINGS_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.TopLeft,
                },
                {
                    name: `Settings_Ceiling_${pid}`,
                    type: "Text",
                    position: [6, SETTINGS_LINE_HEIGHT],
                    size: [SETTINGS_TEXT_WIDTH - 12, 16],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(STR_HUD_SETTINGS_AIRCRAFT_CEILING_FORMAT, STR_READY_DIALOG_AIRCRAFT_CEILING_VANILLA),
                    textColor: SETTINGS_TEXT_COLOR,
                    textAlpha: 1,
                    textSize: SETTINGS_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.TopLeft,
                },
                {
                    name: `Settings_VehiclesT1_${pid}`,
                    type: "Text",
                    position: [6, SETTINGS_LINE_HEIGHT * 2],
                    size: [SETTINGS_TEXT_WIDTH - 12, 16],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(
                        STR_HUD_SETTINGS_VEHICLES_TEAM_FORMAT,
                        getTeamNameKey(TeamID.Team1),
                        STR_HUD_SETTINGS_VALUE_DEFAULT
                    ),
                    textColor: SETTINGS_TEXT_COLOR,
                    textAlpha: 1,
                    textSize: SETTINGS_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.TopLeft,
                },
                {
                    name: `Settings_VehiclesT2_${pid}`,
                    type: "Text",
                    position: [6, SETTINGS_LINE_HEIGHT * 3],
                    size: [SETTINGS_TEXT_WIDTH - 12, 16],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(
                        STR_HUD_SETTINGS_VEHICLES_TEAM_FORMAT,
                        getTeamNameKey(TeamID.Team2),
                        STR_HUD_SETTINGS_VALUE_DEFAULT
                    ),
                    textColor: SETTINGS_TEXT_COLOR,
                    textAlpha: 1,
                    textSize: SETTINGS_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.TopLeft,
                },
                {
                    name: `Settings_VehiclesMatchup_${pid}`,
                    type: "Text",
                    position: [6, SETTINGS_LINE_HEIGHT * 4],
                    size: [SETTINGS_TEXT_WIDTH - 12, 16],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(STR_HUD_SETTINGS_VEHICLES_MATCHUP_FORMAT, 1, 1),
                    textColor: SETTINGS_TEXT_COLOR,
                    textAlpha: 1,
                    textSize: SETTINGS_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.TopLeft,
                },
                {
                    name: `Settings_Players_${pid}`,
                    type: "Text",
                    position: [6, SETTINGS_LINE_HEIGHT * 5],
                    size: [SETTINGS_TEXT_WIDTH - 12, 16],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(STR_HUD_SETTINGS_PLAYERS_FORMAT, 1, 1),
                    textColor: SETTINGS_TEXT_COLOR,
                    textAlpha: 1,
                    textSize: SETTINGS_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.TopLeft,
                },
            ],
        });
        if (settingsSummary) refs.roots.push(settingsSummary);
    }

    //#endregion ----------------- HUD Build/Ensure - Upper-Left HUD --------------------



    //#region -------------------- HUD Build/Ensure - Top-Center Panels --------------------

    // --- Static HUD: Top-center panels (TeamLeft / Middle / TeamRight) ---
    {
        const TOP_PANEL_Y = 44.75 + TOP_HUD_OFFSET_Y;
        const PANEL_WIDTH = 114.5;
        const PANEL_HEIGHT = 74;
        const MID_PANEL_X = 902.75;
        const LEFT_PANEL_X = 783.86;
        const RIGHT_PANEL_X = 1021.64;
        const PANEL_GAP = MID_PANEL_X - LEFT_PANEL_X - PANEL_WIDTH;
        const ROUND_KILLS_PANEL_SIZE = PANEL_HEIGHT;
        const ROUND_KILLS_LEFT_X = LEFT_PANEL_X - ROUND_KILLS_PANEL_SIZE - PANEL_GAP;
        const ROUND_KILLS_RIGHT_X = RIGHT_PANEL_X + PANEL_WIDTH + PANEL_GAP;
        const TRENDING_CROWN_SIZE = 18;
        const TRENDING_CROWN_OFFSET_Y = 4;
        const TRENDING_CROWN_LEFT_X = PANEL_WIDTH - TRENDING_CROWN_SIZE - 10;
        const TRENDING_CROWN_RIGHT_X = 10;
        const mid = modlib.ParseUI({
            // UI element: Container_TopMiddle_CoreUI_${pid}
            name: `Container_TopMiddle_CoreUI_${pid}`,
            type: "Container",
            playerId: player,
            // position: [x, y] offset; direction depends on anchor, so verify visually in-game
            position: [MID_PANEL_X, TOP_PANEL_Y],
            size: [PANEL_WIDTH, PANEL_HEIGHT],
            anchor: mod.UIAnchor.TopLeft,
            visible: true,
            padding: 0,
            bgColor: [0.0314, 0.0431, 0.0431],
            bgAlpha: 0.75,
            bgFill: mod.UIBgFill.Blur,
            children: [
                {
                    // Help/instructions text shown when enabled for this player
                    name: `Container_HelpText_${pid}`,
                    type: "Container",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [-165.5, 92], //[-116.5, 92]
                    size: [450, 20],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgColor: [1, 0.9882, 0.6118],
                    bgAlpha: 1,
                    bgFill: mod.UIBgFill.Solid,
                    children: [
                        {
                            // Help/instructions text shown when enabled for this player
                            name: `HelpText_${pid}`,
                            type: "Text",
                            // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                            position: [0, 2],
                            size: [450, 14],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: true,
                            padding: 0,
                            bgColor: [0.2, 0.2, 0.2],
                            bgAlpha: 1,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.stringkeys.twl.hud.helpText,
                            textColor: [0.251, 0.0941, 0.0667],
                            textAlpha: 1,
                            textSize: 12,
                            textAnchor: mod.UIAnchor.Center,
                        },
                    ],
                },
                {
                    // Ready status text shown when the player is READY and the round is not live
                    name: `Container_ReadyStatus_${pid}`,
                    type: "Container",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [-165.5, 92], //[-116.5, 92]
                    size: [450, 20],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: false,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    children: [
                        {
                            // Ready status text shown when enabled for this player
                            name: `ReadyStatusText_${pid}`,
                            type: "Text",
                            // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                            position: [0, 2],
                            size: [450, 14],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: true,
                            padding: 0,
                            bgAlpha: 0,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.stringkeys.twl.hud.readyText,
                            textColor: [0.6784, 0.9922, 0.5255],
                            textAlpha: 1,
                            textSize: 12,
                            textAnchor: mod.UIAnchor.Center,
                        },
                    ],
                },
            ],
        });
        if (mid) refs.roots.push(mid);
    }

    //#endregion ----------------- HUD Build/Ensure - Top-Center Panels --------------------



    //#region -------------------- HUD Build/Ensure - Admin Action Counter --------------------

    {
        // Admin action audit counter (top-right)
        const auditCounter = modlib.ParseUI({
            name: `AdminPanelActionCount_${pid}`,
            type: "Text",
            playerId: player,
            // position: [x, y] offset; increase X to move right, increase Y to move down
            position: [20, 22],
            size: [60, 12],
            anchor: mod.UIAnchor.TopRight,
            visible: true,
            padding: 0,
            bgAlpha: 0,
            bgFill: mod.UIBgFill.None,
            textLabel: mod.Message(mod.stringkeys.twl.adminPanel.actionCountFormat, 0),
            textColor: [1, 1, 1],
            textAlpha: 1,
            textSize: 10,
            textAnchor: mod.UIAnchor.CenterRight,
        });
        if (auditCounter) refs.roots.push(auditCounter);
    }

    refs.adminPanelActionCountText = safeFind(`AdminPanelActionCount_${pid}`);

    //#endregion ----------------- HUD Build/Ensure - Admin Action Counter --------------------



    //#region -------------------- HUD Build/Ensure - Counter Widgets --------------------

    // West/East score panels and top round X/Y counters intentionally removed for conquest HUD simplification.

    //#endregion ----------------- HUD Build/Ensure - Counter Widgets --------------------



    //#region -------------------- HUD Build/Ensure - Round-End Dialog --------------------

    //Code Cleanup: Need to reduce redundant comments, and when manually adjusting position/sizes update directions (e.g. +X is right or left)
    {
        const roundEndModal = modlib.ParseUI({
            // UI element: RoundEndDialogRoot_${pid}
            name: `RoundEndDialogRoot_${pid}`,
            type: "Container",
            playerId: player,
            // position: [x, y] offset; direction depends on anchor, so verify visually in-game
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
                    // UI element: RoundEndDialog_Round_${pid}
                    name: `RoundEndDialog_Round_${pid}`,
                    type: "Text",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
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
                    // UI element: RoundEndDialog_Outcome_${pid}
                    name: `RoundEndDialog_Outcome_${pid}`,
                    type: "Text",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
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
                    // UI element: RoundEndDialog_Detail_${pid}
                    name: `RoundEndDialog_Detail_${pid}`,
                    type: "Text",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
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

    //#endregion ----------------- HUD Build/Ensure - Round-End Dialog --------------------



    //#region -------------------- HUD Build/Ensure - Victory Dialog --------------------

    {
        const modal = modlib.ParseUI({
                        // UI element: VictoryDialogRoot_${pid}
                        name: `VictoryDialogRoot_${pid}`,
            type: "Container",
            playerId: player,
            // position: [x, y] offset; direction depends on anchor, so verify visually in-game
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
            // UI element: VictoryDialog_Header1_${pid}
            name: `VictoryDialog_Header1_${pid}`,
                    type: "Text",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
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
                    // UI element: VictoryDialog_Header2_${pid}
                    name: `VictoryDialog_Header2_${pid}`,
                    type: "Text",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
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
                    // UI element: VictoryDialog_Screenshot_${pid}
                    name: `VictoryDialog_Screenshot_${pid}`,
                    type: "Text",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
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
                    // UI element: VictoryDialog_Restart_${pid}
                    name: `VictoryDialog_Restart_${pid}`,
                    type: "Text",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
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
                    // UI element: VictoryDialog_TotalTimeRow_${pid}
                    name: `VictoryDialog_TotalTimeRow_${pid}`,
                    type: "Container",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [0, 102],
                    size: [340, 16],
                    anchor: mod.UIAnchor.TopCenter,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    children: [
                        {
                            // UI element: VictoryDialog_TotalTimeLabel_${pid}
                            name: `VictoryDialog_TotalTimeLabel_${pid}`,
                            type: "Text",
                            // position: [x, y] offset; direction depends on anchor, so verify visually in-game
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
                            // UI element: VictoryDialog_TotalTimeDigits_${pid}
                            name: `VictoryDialog_TotalTimeDigits_${pid}`,
                            type: "Container",
                            // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                            position: [55, 0],
                            size: [120, 16],
                            anchor: mod.UIAnchor.Center,
                            visible: true,
                            padding: 0,
                            bgAlpha: 0,
                            bgFill: mod.UIBgFill.None,
                            children: [
                                {
                                    // UI element: VictoryDialog_TimeHT_${pid}
                                    name: `VictoryDialog_TimeHT_${pid}`,
                                    type: "Text",
                                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
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
                                    // UI element: VictoryDialog_TimeHO_${pid}
                                    name: `VictoryDialog_TimeHO_${pid}`,
                                    type: "Text",
                                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
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
                                    // UI element: VictoryDialog_TimeC1_${pid}
                                    name: `VictoryDialog_TimeC1_${pid}`,
                                    type: "Text",
                                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
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
                                    // UI element: VictoryDialog_TimeMT_${pid}
                                    name: `VictoryDialog_TimeMT_${pid}`,
                                    type: "Text",
                                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
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
                                    // UI element: VictoryDialog_TimeMO_${pid}
                                    name: `VictoryDialog_TimeMO_${pid}`,
                                    type: "Text",
                                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
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
                                    // UI element: VictoryDialog_TimeC2_${pid}
                                    name: `VictoryDialog_TimeC2_${pid}`,
                                    type: "Text",
                                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
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
                                    // UI element: VictoryDialog_TimeST_${pid}
                                    name: `VictoryDialog_TimeST_${pid}`,
                                    type: "Text",
                                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
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
                                    // UI element: VictoryDialog_TimeSO_${pid}
                                    name: `VictoryDialog_TimeSO_${pid}`,
                                    type: "Text",
                                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
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
                    // UI element: VictoryDialog_Rounds_${pid}
                    name: `VictoryDialog_Rounds_${pid}`,
                    type: "Text",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
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
                    // UI element: VictoryDialog_AdminActions_${pid}
                    name: `VictoryDialog_AdminActions_${pid}`,
                    type: "Text",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
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
                    // UI element: VictoryDialog_TeamsRow_${pid}
                    name: `VictoryDialog_TeamsRow_${pid}`,
                    type: "Container",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [0, 154],
                    size: [340, 70],
                    anchor: mod.UIAnchor.TopCenter,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    children: [
                        {
                            // UI element: VictoryDialog_TeamLeft_${pid}
                            name: `VictoryDialog_TeamLeft_${pid}`,
                            type: "Container",
                            // position: [x, y] offset; direction depends on anchor, so verify visually in-game
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
                                    // UI element: VictoryDialog_LeftOutcome_${pid}
                                    name: `VictoryDialog_LeftOutcome_${pid}`,
                                    type: "Text",
                                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
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
                                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
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
                                    // UI element: VictoryDialog_LeftRecord_${pid}
                                    name: `VictoryDialog_LeftRecord_${pid}`,
                                    type: "Text",
                                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
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
                                    // UI element: VictoryDialog_LeftRoundWins_${pid}
                                    name: `VictoryDialog_LeftRoundWins_${pid}`,
                                    type: "Text",
                                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
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
                                    // UI element: VictoryDialog_LeftRoundLosses_${pid}
                                    name: `VictoryDialog_LeftRoundLosses_${pid}`,
                                    type: "Text",
                                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
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
                                    // UI element: VictoryDialog_LeftRoundTies_${pid}
                                    name: `VictoryDialog_LeftRoundTies_${pid}`,
                                    type: "Text",
                                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
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
                                    // UI element: VictoryDialog_LeftTotalKills_${pid}
                                    name: `VictoryDialog_LeftTotalKills_${pid}`,
                                    type: "Text",
                                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
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
                            // UI element: VictoryDialog_TeamRight_${pid}
                            name: `VictoryDialog_TeamRight_${pid}`,
                            type: "Container",
                            // position: [x, y] offset; direction depends on anchor, so verify visually in-game
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
                                    // UI element: VictoryDialog_RightOutcome_${pid}
                                    name: `VictoryDialog_RightOutcome_${pid}`,
                                    type: "Text",
                                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
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
                                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
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
                                    // UI element: VictoryDialog_RightRecord_${pid}
                                    name: `VictoryDialog_RightRecord_${pid}`,
                                    type: "Text",
                                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
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
                                    // UI element: VictoryDialog_RightRoundWins_${pid}
                                    name: `VictoryDialog_RightRoundWins_${pid}`,
                                    type: "Text",
                                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
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
                                    // UI element: VictoryDialog_RightRoundLosses_${pid}
                                    name: `VictoryDialog_RightRoundLosses_${pid}`,
                                    type: "Text",
                                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
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
                                    // UI element: VictoryDialog_RightRoundTies_${pid}
                                    name: `VictoryDialog_RightRoundTies_${pid}`,
                                    type: "Text",
                                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
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
                                    // UI element: VictoryDialog_RightTotalKills_${pid}
                                    name: `VictoryDialog_RightTotalKills_${pid}`,
                                    type: "Text",
                                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
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
                    // UI element: VictoryDialog_RosterRow_${pid}
                    name: `VictoryDialog_RosterRow_${pid}`,
                    type: "Container",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [0, VICTORY_DIALOG_ROSTER_ROW_Y],
                    size: [VICTORY_DIALOG_ROSTER_ROW_WIDTH, VICTORY_DIALOG_ROSTER_ROW_HEIGHT_MAX],
                    anchor: mod.UIAnchor.TopCenter,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    children: [
                        {
                            // UI element: VictoryDialog_RosterLeft_${pid}
                            name: `VictoryDialog_RosterLeft_${pid}`,
                            type: "Container",
                            // position: [x, y] offset; direction depends on anchor, so verify visually in-game
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
                                        // position: [x, y] offset; direction depends on anchor, so verify visually in-game
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
                            // UI element: VictoryDialog_RosterRight_${pid}
                            name: `VictoryDialog_RosterRight_${pid}`,
                            type: "Container",
                            // position: [x, y] offset; direction depends on anchor, so verify visually in-game
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
                                        // position: [x, y] offset; direction depends on anchor, so verify visually in-game
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

    //#endregion ----------------- HUD Build/Ensure - Victory Dialog --------------------



    //#region -------------------- HUD Build/Ensure - Cache Init + Defaults --------------------

    refs.helpTextContainer = safeFind(`Container_HelpText_${pid}`);
    refs.readyStatusContainer = safeFind(`Container_ReadyStatus_${pid}`);
    refs.settingsGameModeText = safeFind(`Settings_GameMode_${pid}`);
    refs.settingsAircraftCeilingText = safeFind(`Settings_Ceiling_${pid}`);
    refs.settingsVehiclesT1Text = safeFind(`Settings_VehiclesT1_${pid}`);
    refs.settingsVehiclesT2Text = safeFind(`Settings_VehiclesT2_${pid}`);
    refs.settingsVehiclesMatchupText = safeFind(`Settings_VehiclesMatchup_${pid}`);
    refs.settingsPlayersText = safeFind(`Settings_Players_${pid}`);
    State.hudCache.hudByPid[pid] = refs;

    // Keep only HUD elements retained for conquest's simplified center HUD + overlays.
    setAdminPanelActionCountText(refs.adminPanelActionCountText, State.admin.actionCount);
    updateSettingsSummaryHudForPid(pid);

    ensureTopHudRootForPid(pid, player);
    setHudHelpDepthForPid(pid);

    updateVictoryDialogForPlayer(player, getRemainingSeconds());

    return refs;
}

//#endregion ----------------- HUD Build/Ensure - Cache Init + Defaults --------------------



//#region -------------------- HUD Update Helpers --------------------

function setHudRoundCountersForAllPlayers(cur: number, max: number): void {
    // Sets authoritative round current/max values and syncs HUD + Ready dialog "Best of".
    State.round.current = Math.max(1, Math.floor(cur));
    State.round.max = Math.max(1, Math.floor(max));
    if (State.round.max < State.round.current) {
        State.round.max = State.round.current;
    }

    setRoundStateTextForAllPlayers();
    // Keep Ready Up dialog "Best of" label in sync with State.round.max.
    updateBestOfRoundsLabelForAllPlayers();
}

function setHudWinCountersForAllPlayers(t1Wins: number, t2Wins: number): void {
    // Updates match win counters in script state and GameModeScore, then refreshes HUD.
    const lw = Math.max(0, Math.floor(t1Wins));
    const rw = Math.max(0, Math.floor(t2Wins));

    // Match wins are authoritative in script state; GameModeScore is mirrored for scoreboard display.
    setMatchWinsTeam(TeamID.Team1, lw);
    setMatchWinsTeam(TeamID.Team2, rw);

    // Cache locally for immediate UI + logic.
    State.match.winsT1 = lw;
    State.match.winsT2 = rw;

    syncRoundRecordHudForAllPlayers();
}

function syncRoundRecordHudForAllPlayers(): void {
    // Derives losses from wins/ties and syncs the Round Record HUD for both teams.
    // Losses are derived from the opponent's win count when rounds end with a single winner.
    State.match.lossesT1 = State.match.winsT2;
    State.match.lossesT2 = State.match.winsT1;
}

function adjustMatchTiesForBothTeams(delta: number): void {
    // Applies a delta to match ties for both teams and refreshes the Round Record HUD.
    const current = Math.min(State.match.tiesT1, State.match.tiesT2);
    const next = Math.max(0, Math.floor(current + delta));
    State.match.tiesT1 = next;
    State.match.tiesT2 = next;
    syncRoundRecordHudForAllPlayers();
}

function updateAdminPanelActionCountForAllPlayers(): void {
    // Pushes the admin action count to every player's HUD widget.
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const refs = ensureHudForPlayer(p);
        if (!refs) continue;
        setAdminPanelActionCountText(refs.adminPanelActionCountText, State.admin.actionCount);
    }
}

function handleAdminPanelAction(eventPlayer: mod.Player, actionKey: number): void {
    // Increments the admin action counter and broadcasts the action to the world log.
    State.admin.actionCount = Math.max(0, Math.floor(State.admin.actionCount) + 1);
    updateAdminPanelActionCountForAllPlayers();
    sendHighlightedWorldLogMessage(
        mod.Message(mod.stringkeys.twl.adminPanel.actionPressed, eventPlayer, actionKey),
        true,
        undefined,
        mod.stringkeys.twl.adminPanel.actionPressed
    );
}

//#endregion ----------------- HUD Update Helpers --------------------



//#region -------------------- Legacy UI Cleanup (old score_root_* containers) --------------------

// Code Cleanup: Is this still needed???
function deleteLegacyScoreRootForPlayer(player: mod.Player): void {
    const name = "score_root_" + getObjId(player);
    try {
        mod.DeleteUIWidget(mod.FindUIWidgetWithName(name));
    } catch { }
}

function deleteLegacyScoreRootsForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);

    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p) continue;
        if (!mod.IsPlayerValid(p)) continue;
        deleteLegacyScoreRootForPlayer(p);
    }
}
//#endregion ----------------- Legacy UI Cleanup (old score_root_* containers) --------------------
