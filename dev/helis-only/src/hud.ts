// @ts-nocheck
// Module: hud -- HUD counter helpers, eager HUD shell build/ensure, update helpers, altitude warning.
//
// Widget position convention (also applies to hud-dialog-lazy.ts, hud-scoring-lazy.ts, clock.ts):
//   position: [x, y] is anchor-relative. +X = right of anchor, +Y = down from anchor.
//   For non-center anchors, verify visually in-game -- TopCenter children with negative X don't
//   always render exactly where the math suggests (v0.684 diagnosed negative-X clipping on
//   TopLeft-anchored parents).
//
// Post-Phase-A/B (v0.690) eager scope of ensureEagerHudShellForPlayer:
//   - Upper-Left branding container (Upper_Left_Container_)
//   - Upper-Left settings summary panel (Upper_Left_Settings_ + Settings_* rows)
//   - Altimeter root + card + warning label (eager since v0.674)
//   - Spawn-disabled live text (built lazily-first-use via ensureSpawnDisabledLiveText helper)
//   - Cache write to State.hudCache.hudByPid[pid]
//   - Settings refs resolution
//
// Lazy (NOT built here):
//   - Top-Center Panels + Counter Widgets + Admin Action Counter
//       -> hud-scoring-lazy.ts (triggered on OnPlayerDeployed)
//   - Round-End Dialog + Victory Dialog
//       -> hud-dialog-lazy.ts (triggered when their update functions fire)
//   - Ready Dialog + Admin Panel
//       -> built inline in ready-dialog.ts / team-switch.ts on triple-tap / button click
//   - Altitude warning dialog
//       -> ensureAltitudeWarningUiForPlayer (lazy first-show)

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
        const refs = ensureEagerHudShellForPlayer(p);
        if (!refs) continue;
        setTrendingWinnerCrownForRefs(refs);
    }
}

function setAdminPanelActionCountText(widget: mod.UIWidget | undefined, value: number): void {
    if (!widget) return;
    safeSetUITextLabel(widget, mod.Message(mod.stringkeys.twl.adminPanel.actionCountFormat, Math.floor(value)));
}

//#endregion ----------------- HUD Counter Helpers --------------------



//#region -------------------- HUD Round State + Help Text --------------------

function setRoundStateText(widget: mod.UIWidget | undefined): void {
    if (!widget) return;

    if (State.round.phase === RoundPhase.GameOver) {
        safeSetUITextLabel(widget, mod.Message(mod.stringkeys.twl.hud.roundStateGameOver));
        mod.SetUITextColor(widget, COLOR_WARNING_YELLOW);
        return;
    }

    const isLive = isRoundLive();
    const stateKey = isLive ? mod.stringkeys.twl.hud.roundStateLive : mod.stringkeys.twl.hud.roundStateNotReady;

    safeSetUITextLabel(
        widget,
        mod.Message(mod.stringkeys.twl.hud.roundStateFormat, mod.stringkeys.twl.hud.roundText, Math.floor(State.round.current), stateKey)
    );

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
        safeSetUITextLabel(text, label);
        mod.SetUITextColor(text, mod.CreateVector(1, 1, 1));
    }
}

function getRoundKillsLabelRound(): number {
    if (State.round.phase === RoundPhase.Live) return Math.max(1, Math.floor(State.round.current));
    if (State.round.phase === RoundPhase.GameOver) return Math.max(1, Math.floor(State.round.current));
    return Math.max(1, Math.floor(State.round.current - 1));
}

function setRoundKillsLabelTextForRefs(refs: HudRefs | undefined): void {
    if (!refs) return;
    const label = mod.Message(mod.stringkeys.twl.hud.labels.roundKillsWithRoundFormat, getRoundKillsLabelRound());
    if (refs.leftRoundKillsLabel) safeSetUITextLabel(refs.leftRoundKillsLabel, label);
    if (refs.rightRoundKillsLabel) safeSetUITextLabel(refs.rightRoundKillsLabel, label);
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

// Probes whether a widget handle is still live and is a text widget.
// Calls mod.GetUITextSize defensively; if the engine rejects (stale handle or
// wrong widget type), returns false. Used by resolveLiveUITextWidget to filter
// stale handles after dialog/HUD rebuild paths.
function isUITextWidget(widget: mod.UIWidget | undefined): widget is mod.UIWidget {
    if (!widget) return false;
    try {
        mod.GetUITextSize(widget);
        return true;
    } catch {
        return false;
    }
}

// Re-resolves cached UI handles by name so reopen/rebuild paths do not keep
// writing through stale widget references after dialog/HUD lifecycle changes.
// Conquest port (hud/status.ts:144) CQ_Bug_18.
function resolveLiveUITextWidget(widget: mod.UIWidget | undefined): mod.UIWidget | undefined {
    if (isUITextWidget(widget)) return widget;
    if (!widget) return undefined;
    try {
        const widgetName = mod.GetUIWidgetName(widget);
        if (!widgetName) return undefined;
        const liveWidget = safeFind(widgetName);
        return isUITextWidget(liveWidget) ? liveWidget : undefined;
    } catch {
        return undefined;
    }
}

// Safe text-label write helper used by HUD render paths.
// Some callers build labels through helper chains that can transiently return
// undefined/null during UI lifecycle transitions, so normalize or skip before
// reaching the engine overload boundary. Conquest port (hud/status.ts:161)
// CQ_Bug_18 v0.764 -- closes "Received undefined values as arguments" engine
// error class on UI text writes.
function safeSetUITextLabel(widget: mod.UIWidget | undefined, label: mod.Message | number | undefined | null): void {
    const liveWidget = resolveLiveUITextWidget(widget);
    if (!liveWidget) return;
    if (label === undefined || label === null) return;
    let resolvedLabel: mod.Message;
    if (typeof label === "number") {
        try {
            resolvedLabel = mod.Message(label);
        } catch {
            return;
        }
    } else {
        resolvedLabel = label;
    }
    try {
        mod.SetUITextLabel(liveWidget, resolvedLabel);
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

function reparentSpawnDisabledLiveTextForPid(pid: number, parentOverride?: mod.UIWidget): void {
    const widget = safeFind(`SpawnDisabledLiveText_${pid}`);
    if (!widget) return;
    const parent = parentOverride ?? safeFind(joinPromptRootName(pid)) ?? mod.GetUIRoot();
    mod.SetUIWidgetParent(widget, parent);
    mod.SetUIWidgetDepth(widget, mod.UIDepth.AboveGameUI);
}

function ensureSpawnDisabledLiveText(player: mod.Player): mod.UIWidget | undefined {
    const pid = getObjId(player);
    const existing = safeFind(`SpawnDisabledLiveText_${pid}`);
    if (existing) {
        reparentSpawnDisabledLiveTextForPid(pid);
        return existing;
    }
    const spawnDisabledText = modlib.ParseUI({
        name: `SpawnDisabledLiveText_${pid}`,
        type: "Text",
        playerId: player,
        position: [0, SPAWN_DISABLED_TEXT_POS_Y],
        size: [SPAWN_DISABLED_TEXT_WIDTH, SPAWN_DISABLED_TEXT_HEIGHT],
        anchor: mod.UIAnchor.BottomCenter,
        visible: false,
        padding: 0,
        bgColor: [0, 0, 0],
        bgAlpha: 1,
        bgFill: mod.UIBgFill.Solid,
        textLabel: mod.stringkeys.twl.hud.spawnDisabledLive,
        textColor: SPAWN_DISABLED_TEXT_COLOR_RGB,
        textAlpha: 1,
        textSize: SPAWN_DISABLED_TEXT_SIZE,
        textAnchor: mod.UIAnchor.Center,
    });
    if (spawnDisabledText) {
        mod.SetUIWidgetDepth(spawnDisabledText, mod.UIDepth.AboveGameUI);
        reparentSpawnDisabledLiveTextForPid(pid);
    }
    return spawnDisabledText;
}

function setSpawnDisabledLiveTextVisibleForPlayer(player: mod.Player, visible: boolean): void {
    const refs = ensureEagerHudShellForPlayer(player);
    if (!refs || !refs.spawnDisabledLiveText) return;
    safeSetUIWidgetVisible(refs.spawnDisabledLiveText, visible);
}

function setSpawnDisabledLiveTextVisibleForAllPlayers(visible: boolean): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        setSpawnDisabledLiveTextVisibleForPlayer(p, visible);
    }
}

function isLiveRespawnDisabled(): boolean {
    return !State.admin.liveRespawnEnabled;
}

function updateSpawnDisabledWarningForPlayer(player: mod.Player): void {
    if (!player || !mod.IsPlayerValid(player)) return;
    const pid = getObjId(player);
    const shouldShow = isLiveRespawnDisabled() && isRoundLive() && !isPlayerDeployed(player);
    const lastVisible = State.players.spawnDisabledWarningVisibleByPid[pid] ?? false;
    if (shouldShow === lastVisible) return;
    State.players.spawnDisabledWarningVisibleByPid[pid] = shouldShow;
    const widget = ensureSpawnDisabledLiveText(player);
    safeSetUIWidgetVisible(widget, shouldShow);
}

function updateSpawnDisabledWarningForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        updateSpawnDisabledWarningForPlayer(p);
    }
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
        const refs = ensureEagerHudShellForPlayer(p);
        if (refs) setRoundKillsLabelTextForRefs(refs);
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
            safeSetUITextLabel(cache.playersReadyText, label);
            mod.SetUITextColor(cache.playersReadyText, COLOR_NORMAL);
        } else {
            label = mod.Message(mod.stringkeys.twl.hud.playersReadyFormat, readyCount, total);
            safeSetUITextLabel(cache.playersReadyText, label);
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
    // Phase A gate: this function is called both from round-flow.ts at match-end AND from
    // ensureEagerHudShellForPlayer's cache-init path as a defensive no-op for late joiners.
    // The gate ensures the OPJG path doesn't fire the lazy build -- only the real match-end
    // path should. Without this gate, the Victory dialog widget tree builds during the join
    // tick, defeating Phase A.
    if (State.match.victoryDialogActive) triggerLazyBuild('victoryDialog', pid);
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
    // Phase A: lazy-build the round-end dialog widgets if not built yet. Idempotent + re-entrancy-guarded.
    triggerLazyBuild('roundEndDialog', pid);
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
        const autoReadyHelpActive = !!State.players.autoReadyByPid[pid] && (!isReady);
        const helpLabel = autoReadyHelpActive
            ? mod.Message(STR_HUD_AUTO_READY_HELP_TEXT)
            : mod.Message(mod.stringkeys.twl.hud.helpText);
        safeSetUITextLabel(helpText, helpLabel);
    }

    const readyContainer = refs.readyStatusContainer ?? safeFind(`Container_ReadyStatus_${pid}`);
    if (readyContainer) {
        safeSetUIWidgetVisible(readyContainer, showReady);
    }

    const readyText = safeFind(`ReadyStatusText_${pid}`);
    if (readyText) {
        const viewer = safeFindPlayer(pid);
        // Skip IsInVehicle read during the deploy-settle window to avoid the engine error
        // log (Conquest #94 pattern). Defaults to "not in vehicle" -- correct for a
        // just-deployed on-foot player; the auto-ready text branch requires in-vehicle anyway.
        const deployedAt = State.players.deployedAtSecondsByPid[pid];
        const isSettled = deployedAt === undefined
            || (mod.GetMatchTimeElapsed() - deployedAt) >= DEPLOY_SETTLE_GRACE_SECONDS;
        const inVehicle = (viewer && isDeployed && isSettled && isPlayerAlive(viewer))
            ? safeGetSoldierStateBool(viewer, mod.SoldierStateBool.IsInVehicle)
            : false;
        const autoReadyActive = !!State.players.autoReadyByPid[pid]
            && isReady
            && inVehicle
            && isPlayerInMainBaseForReady(pid);
        const readyLabel = autoReadyActive
            ? mod.Message(STR_HUD_AUTO_READY_TEXT)
            : mod.Message(mod.stringkeys.twl.hud.readyText);
        safeSetUITextLabel(readyText, readyLabel);
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

function ensureEagerHudShellForPlayer(player: mod.Player): HudRefs | undefined {
    // Per-player HUD lifecycle:
    // - HUD widgets are created once per player and then only updated (never recreated) during the match.
    // - This function is safe to call repeatedly (join, respawn, reconnect, admin actions).
    // - If a widget is missing, create it and store/find it via the UI root.

    if (!player || !mod.IsPlayerValid(player)) return undefined;

    const pid = getObjId(player);

    // If cached and still valid, return it
    const cached = State.hudCache.hudByPid[pid];
    // Cache invariant: settingsGameModeText is the load-bearing eager ref. Settings widgets are
    // the only ones populated unconditionally at the end of the eager build, so they're the
    // reliable "did we run the eager pass?" sentinel. Do NOT change this to a top-HUD ref --
    // those are lazy (Phase B) and undefined until OnPlayerDeployed fires triggerLazyBuild('topHud').
    if (cached && cached.settingsGameModeText) {
        cached.spawnDisabledLiveText = ensureSpawnDisabledLiveText(player);
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
                    name: `Upper_Left_Text_${pid}`,
                    type: "Text",
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
                    name: `Upper_Left_Text_2_${pid}`,
                    type: "Text",
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

    // --- Static HUD: Altimeter card on the lower-left (v0.674) ---
    // EAGER build, modeled byte-for-byte on Upper_Left_Container_ above (the user explicitly
    // asked "why can't it work like the upper left branding squares" -- this IS that pattern).
    // Root is visible:true with a non-zero bgAlpha so the engine treats it as a real laid-out
    // container (the v0.666-v0.673 lazy-built invisible root never positioned where requested).
    // CARD child holds the black backplate + "Altitude: YYY" text + small yellow "ALTITUDE
    // WARNING" label. All children's visibility is toggled by the loop's set*ForPid helpers --
    // root stays where ensureEagerHudShellForPlayer placed it.
    {
        const altimeterRoot = modlib.ParseUI({
            name: UI_ALTIMETER_ROOT_ID + pid,
            type: "Container",
            playerId: player,
            position: [ALTIMETER_HUD_ANCHOR_OFFSET_X, ALTIMETER_HUD_ANCHOR_OFFSET_Y],
            size: [ALTIMETER_HUD_ROOT_WIDTH, ALTIMETER_HUD_ROOT_HEIGHT],
            anchor: mod.UIAnchor.TopLeft,
            visible: true,
            padding: 1,
            bgColor: [0, 0, 0],
            bgAlpha: 0.0001,   // effectively invisible but treated as a real container during layout
            bgFill: mod.UIBgFill.Blur,
            children: [
                // Yellow "ALTITUDE WARNING!" label, top of root, hidden by default.
                // v0.685: label widget is WIDER (200) than the card (130), centered horizontally
                // above the card so the text overhangs equally left+right. textAnchor: Center
                // centers the text within the 200-wide widget; CARD_OFFSET_X (35) shifts the card
                // such that (root_X + 35 + card_W/2) == (root_X + 0 + label_W/2), aligning both
                // horizontal centers on the screen.
                {
                    name: UI_ALTIMETER_WARNING_LABEL_ID + pid,
                    type: "Text",
                    position: [ALTIMETER_HUD_LABEL_OFFSET_X, 0],
                    size: [ALTIMETER_HUD_LABEL_WIDTH, ALTIMETER_HUD_LABEL_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: false,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(STR_HUD_ALTIMETER_WARNING_LABEL),
                    textColor: COLOR_WARNING_YELLOW,
                    textAlpha: 1,
                    textSize: ALTIMETER_HUD_LABEL_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.Center,
                },
                // Black-backplate card below the label (hidden until player enters aircraft).
                // v0.684: X = ALTIMETER_HUD_CARD_OFFSET_X (25) -- card is inset within the root so
                // the warning label (at root X=0) can sit further LEFT of the card without using
                // negative child positions (which clip silently in this engine).
                {
                    name: UI_ALTIMETER_CARD_ID + pid,
                    type: "Container",
                    position: [ALTIMETER_HUD_CARD_OFFSET_X, ALTIMETER_HUD_CARD_OFFSET_Y],
                    size: [ALTIMETER_HUD_CARD_WIDTH, ALTIMETER_HUD_CARD_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: false,
                    padding: 0,
                    bgColor: [0, 0, 0],
                    bgAlpha: 0.75,
                    bgFill: mod.UIBgFill.Blur,
                },
                // "Altitude: YYY" text -- sibling of card, declared AFTER it so it renders on top.
                // v0.684: X = CARD_OFFSET_X + TEXT_LEFT_PADDING so text sits 10px inside the card.
                {
                    name: UI_ALTIMETER_TEXT_ID + pid,
                    type: "Text",
                    position: [ALTIMETER_HUD_CARD_OFFSET_X + ALTIMETER_HUD_TEXT_LEFT_PADDING, ALTIMETER_HUD_CARD_OFFSET_Y],
                    size: [ALTIMETER_HUD_CARD_WIDTH - ALTIMETER_HUD_TEXT_LEFT_PADDING, ALTIMETER_HUD_CARD_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: false,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(STR_HUD_ALTIMETER_FORMAT, 0),
                    textColor: COLOR_READY_GREEN,
                    textAlpha: 1,
                    textSize: ALTIMETER_HUD_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.CenterLeft,
                },
            ],
        });
        if (altimeterRoot) refs.roots.push(altimeterRoot);
        refs.altimeterRoot = altimeterRoot;
        refs.altimeterCard = safeFind(UI_ALTIMETER_CARD_ID + pid);
        refs.altimeterText = safeFind(UI_ALTIMETER_TEXT_ID + pid);
        refs.altimeterWarningLabel = safeFind(UI_ALTIMETER_WARNING_LABEL_ID + pid);
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
            size: [SETTINGS_TEXT_WIDTH, SETTINGS_LINE_HEIGHT * 8],
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
                    textLabel: mod.Message(STR_HUD_SETTINGS_AIRCRAFT_CEILING_FORMAT, STR_READY_DIALOG_AIRCRAFT_CEILING_VANILLA, STR_HUD_SETTINGS_PUNISH_OFF),
                    textColor: SETTINGS_TEXT_COLOR,
                    textAlpha: 1,
                    textSize: SETTINGS_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.TopLeft,
                },
                {
                    name: `Settings_VehicleHealth_${pid}`,
                    type: "Text",
                    position: [6, SETTINGS_LINE_HEIGHT * 2],
                    size: [SETTINGS_TEXT_WIDTH - 12, 16],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(STR_HUD_SETTINGS_VEHICLE_HEALTH_FORMAT, 100),
                    textColor: SETTINGS_TEXT_COLOR,
                    textAlpha: 1,
                    textSize: SETTINGS_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.TopLeft,
                },
                {
                    name: `Settings_SoldierHp_${pid}`,
                    type: "Text",
                    position: [6, SETTINGS_LINE_HEIGHT * 3],
                    size: [SETTINGS_TEXT_WIDTH - 12, 16],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(STR_HUD_SETTINGS_SOLDIER_HP_FORMAT, 100),
                    textColor: SETTINGS_TEXT_COLOR,
                    textAlpha: 1,
                    textSize: SETTINGS_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.TopLeft,
                },
                {
                    name: `Settings_VehiclesT1_${pid}`,
                    type: "Text",
                    position: [6, SETTINGS_LINE_HEIGHT * 4],
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
                    position: [6, SETTINGS_LINE_HEIGHT * 5],
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
                    position: [6, SETTINGS_LINE_HEIGHT * 6],
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
                    position: [6, SETTINGS_LINE_HEIGHT * 7],
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

    // TOP-CENTER PANELS WIDGETS -- extracted to hud-scoring-lazy.ts (Phase B, 2026-05-31).
    // Build deferred until OnPlayerDeployed fires triggerLazyBuild('topHud', pid).
    // ~540 lines of nested ParseUI no longer run during OnPlayerJoinGame.



    //#region -------------------- HUD Build/Ensure - Admin Action Counter --------------------

    // ADMIN ACTION COUNTER WIDGET + top-hud ref bindings -- extracted to hud-scoring-lazy.ts (Phase B, 2026-05-31).



    //#region -------------------- HUD Build/Ensure - Counter Widgets --------------------

    // COUNTER WIDGETS (digits) -- extracted to hud-scoring-lazy.ts (Phase B, 2026-05-31).
    // ~90 lines of ParseUI no longer run during OnPlayerJoinGame.



    //#region -------------------- HUD Build/Ensure - Round-End Dialog --------------------

    {
        const spawnDisabledText = ensureSpawnDisabledLiveText(player);
        if (spawnDisabledText) refs.roots.push(spawnDisabledText);
    }

    // ROUND-END DIALOG WIDGETS -- extracted to hud-dialog-lazy.ts (Phase A, 2026-05-30).
    // Build deferred until updateRoundEndDialogForPlayer fires triggerLazyBuild('roundEndDialog', pid)
    // at round-end. ~80 lines of ParseUI no longer run during OnPlayerJoinGame.

    //#endregion ----------------- HUD Build/Ensure - Round-End Dialog --------------------



    //#region -------------------- HUD Build/Ensure - Victory Dialog --------------------

    // VICTORY DIALOG WIDGETS -- extracted to hud-dialog-lazy.ts (Phase A, 2026-05-30).
    // Build deferred until updateVictoryDialogForPlayer fires triggerLazyBuild('victoryDialog', pid)
    // at match-end. ~745 lines of ParseUI no longer run during OnPlayerJoinGame.

    //#endregion ----------------- HUD Build/Ensure - Victory Dialog --------------------



    //#region -------------------- HUD Build/Ensure - Altitude Warning (H-P1) --------------------

    // H-P1: altitude warning widgets are NOT built here -- they are built LAZILY at first
    // setAltitudeWarningVisibleForPid call. See ensureAltitudeWarningUiForPlayer below.
    // Confirmed required by the Helis overtime HUD pattern (overtime.ts:1443+1490) and the
    // Conquest boundary prompt pattern (prompt-ui.ts called from showBoundaryPromptForPlayer):
    // cockpit-overlay widgets built EAGERLY in ensureEagerHudShellForPlayer at OnPlayerJoinGame time are
    // INVISIBLE despite identical construction code. v0.650-v0.655 all hit this. v0.656 fixes by
    // moving the construction to lazy first-show.

    //#endregion ----------------- HUD Build/Ensure - Altitude Warning (H-P1) --------------------



    //#region -------------------- HUD Build/Ensure - Cache Init + Defaults --------------------

    refs.helpTextContainer = safeFind(`Container_HelpText_${pid}`);
    refs.readyStatusContainer = safeFind(`Container_ReadyStatus_${pid}`);
    refs.spawnDisabledLiveText = safeFind(`SpawnDisabledLiveText_${pid}`);
    refs.settingsGameModeText = safeFind(`Settings_GameMode_${pid}`);
    refs.settingsAircraftCeilingText = safeFind(`Settings_Ceiling_${pid}`);
    refs.settingsVehicleHealthText = safeFind(`Settings_VehicleHealth_${pid}`);
    refs.settingsSoldierHpText = safeFind(`Settings_SoldierHp_${pid}`);
    refs.settingsVehiclesT1Text = safeFind(`Settings_VehiclesT1_${pid}`);
    refs.settingsVehiclesT2Text = safeFind(`Settings_VehiclesT2_${pid}`);
    refs.settingsVehiclesMatchupText = safeFind(`Settings_VehiclesMatchup_${pid}`);
    refs.settingsPlayersText = safeFind(`Settings_Players_${pid}`);
    // Altitude warning widgets are NOT resolved here -- ensureAltitudeWarningUiForPlayer builds
    // them lazily on first show + populates refs at that time. Eager safeFind would return undefined
    // because the widgets don't exist yet.

    State.hudCache.hudByPid[pid] = refs;

    // Initialize visible numbers immediately
    // Top-HUD value seeding + reparent + depth -- moved into hud-scoring-lazy.ts
    // (seedTopHudFromState + ensureTopHudRootForPid + setHudHelpDepthForPid run in there).
    // Settings summary stays eager:
    updateSettingsSummaryHudForPid(pid);
    updateVictoryDialogForPlayer(player, getRemainingSeconds());

    return refs;
}

//#endregion ----------------- HUD Build/Ensure - Cache Init + Defaults --------------------



//#region -------------------- Altitude Warning HUD (H-P1, standalone) --------------------

// H-P1 altitude warning HUD: a per-pid centered dialog (title + body + countdown digit) shown
// while a player flies an aircraft above the soft ceiling. This is a STANDALONE widget system
// with its own root, child widgets, and lifecycle -- it is NOT a part of the overtime/capture
// HUD, the settings HUD, or any other widget group.
//
// Lifecycle: built LAZILY on first call to ensureAltitudeWarningUiForPlayer (triggered from
// setAltitudeWarningVisibleForPid before toggling visibility). Cockpit-overlay widgets built
// eagerly in ensureEagerHudShellForPlayer at OnPlayerJoinGame time render invisibly (v0.650-v0.655);
// lazy first-show construction is required.
//
// Construction recipe (proven independently by Helis's own overtime HUD and by Conquest's
// boundary prompt -- both render reliably over the cockpit):
//   1. ONE atomic modlib.ParseUI call: Container root + Text children nested in `children: [...]`
//   2. safeFind(root) -- early return if construction failed
//   3. safeSetUIWidgetDepth(root, mod.UIDepth.AboveGameUI)
//   4. safeFind each child + populate HudRefs for runtime text updates
// Visibility toggles on the ROOT only -- children inherit.
function ensureAltitudeWarningUiForPlayer(player: mod.Player): mod.UIWidget | undefined {
    if (!player || !mod.IsPlayerValid(player)) return undefined;
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return undefined;

    const rootName = `Altitude_Warning_Root_${pid}`;
    const refs = State.hudCache.hudByPid[pid];

    // Idempotent path: widget tree already exists -- just rehydrate refs and return.
    const existingRoot = safeFind(rootName);
    if (existingRoot) {
        if (refs) {
            refs.altitudeWarningRoot = existingRoot;
            refs.altitudeWarningCeilingLabel = safeFind(`Altitude_Warning_Ceiling_${pid}`);
            refs.altitudeWarningTitle = safeFind(`Altitude_Warning_Title_${pid}`);
            refs.altitudeWarningBody = safeFind(`Altitude_Warning_Body_${pid}`);
            refs.altitudeWarningCountdown = safeFind(`Altitude_Warning_Countdown_${pid}`);
            refs.altitudeWarningDestroyedLabel = safeFind(`Altitude_Warning_Destroyed_${pid}`);
        }
        return existingRoot;
    }

    // v0.665: Container covers the CENTER ~50% of the screen (960x540 against the 1920x1080
    // UI reference frame). Pre-v0.665 the backplate was full-screen 3840x2160, which blocked
    // pilots' peripheral instruments/horizon entirely; pilots still need bearings to descend
    // safely. The central block is large enough to dominate the player's view but leaves the
    // edges of the screen unobstructed so altitude/heading/instrument readouts stay visible.
    // Children's text positions are unchanged (relative to container center; well inside 960x540).
    try {
        modlib.ParseUI({
            name: rootName,
            type: "Container",
            playerId: player,
            position: [0, 0],
            size: [960, 540],
            anchor: mod.UIAnchor.Center,
            visible: false,
            padding: 0,
            bgColor: [0, 0, 0],
            bgAlpha: 1,
            bgFill: mod.UIBgFill.Solid,
            children: [
                // v0.670: "Ceiling: 130" callout, sits ABOVE the title. White text so it reads
                // as informational rather than alarming. Value is stamped on first show by the
                // setAltitudeWarningVisibleForPid path (and rewritten there each show in case the
                // ceiling was changed between rounds).
                {
                    name: `Altitude_Warning_Ceiling_${pid}`,
                    type: "Text",
                    position: [0, -180],
                    size: [800, 36],
                    anchor: mod.UIAnchor.Center,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(STR_HUD_ALTITUDE_WARNING_CEILING_FORMAT, 0),
                    textColor: COLOR_WHITE,
                    textAlpha: 1,
                    textSize: 24,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    name: `Altitude_Warning_Title_${pid}`,
                    type: "Text",
                    position: [0, -120],
                    size: [800, 60],
                    anchor: mod.UIAnchor.Center,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(STR_HUD_ALTITUDE_WARNING_TITLE),
                    textColor: COLOR_WARNING_YELLOW,
                    textAlpha: 1,
                    textSize: 36,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    name: `Altitude_Warning_Body_${pid}`,
                    type: "Text",
                    position: [0, -60],
                    size: [800, 30],
                    anchor: mod.UIAnchor.Center,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(STR_HUD_ALTITUDE_WARNING_BODY),
                    textColor: COLOR_WHITE,
                    textAlpha: 1,
                    textSize: 20,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    name: `Altitude_Warning_Countdown_${pid}`,
                    type: "Text",
                    position: [0, 10],
                    size: [400, 100],
                    anchor: mod.UIAnchor.Center,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, ALTITUDE_WARNING_COUNTDOWN_SECONDS),
                    textColor: COLOR_WARNING_YELLOW,
                    textAlpha: 1,
                    textSize: 64,
                    textAnchor: mod.UIAnchor.Center,
                },
                // v0.709: red "YOU WILL BE DESTROYED!" line below the countdown. visible captured at
                // BUILD TIME from the current admin state. modlib.ParseUI post-construction visibility
                // flips don't commit on the same JS tick as the build -- v0.706 (built visible:false,
                // tried to toggle on at first show) and v0.708 (built visible:true, tried to toggle off
                // at first show) BOTH failed to apply correctly on the first dialog open. Subsequent
                // shows work because the widget is fully committed by then. By capturing admin state
                // at build time, the initial render is correct with no same-tick toggle needed.
                // setAltitudeWarningVisibleForPid still toggles on each show as a best-effort update
                // for cases where the admin button is pressed between shows.
                {
                    name: `Altitude_Warning_Destroyed_${pid}`,
                    type: "Text",
                    position: [0, 120],
                    size: [800, 36],
                    anchor: mod.UIAnchor.Center,
                    visible: State.admin.ceilingPunishEnabled,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(STR_HUD_ALTITUDE_WARNING_DESTROYED),
                    textColor: COLOR_NOT_READY_RED,
                    textAlpha: 1,
                    textSize: 28,
                    textAnchor: mod.UIAnchor.Center,
                },
            ],
        });
    } catch (_e) {
        return undefined;
    }

    const root = safeFind(rootName);
    if (!root) return undefined;
    safeSetUIWidgetDepth(root, mod.UIDepth.AboveGameUI);

    if (refs) {
        refs.altitudeWarningRoot = root;
        refs.altitudeWarningCeilingLabel = safeFind(`Altitude_Warning_Ceiling_${pid}`);
        refs.altitudeWarningTitle = safeFind(`Altitude_Warning_Title_${pid}`);
        refs.altitudeWarningBody = safeFind(`Altitude_Warning_Body_${pid}`);
        refs.altitudeWarningCountdown = safeFind(`Altitude_Warning_Countdown_${pid}`);
    }
    return root;
}

//#endregion ----------------- Altitude Warning HUD (H-P1, standalone) --------------------



//#region -------------------- Altimeter HUD (v0.666 H-P1, standalone) --------------------
//
// Per-pid altimeter card showing the player's current vehicle world Y coordinate. Shown
// only when the player is in an AIRCRAFT (not tanks/jeeps). Layout:
//
//   ┌─────────────────────────┐  ← root container (lazy-built; aligned BottomLeft on screen)
//   │ ALTITUDE WARNING        │  ← yellow label, visible only when posY > soft
//   ├─────────────────────────┤
//   │ Alt: 218                │  ← black backplate card, GREEN by default, YELLOW above soft
//   └─────────────────────────┘
//
// Built LAZILY on first show (runAircraftWarningLoop -> ensureAltimeterUiForPlayer) to avoid
// the eager-build invisible-widget pattern that bit the black-screen dialog in v0.650-v0.655.
// Toggled per-pid by setAltimeterVisibleForPid; text + color updated by the loop's diff-gates.

function ensureAltimeterUiForPlayer(player: mod.Player): mod.UIWidget | undefined {
    if (!player || !mod.IsPlayerValid(player)) return undefined;
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return undefined;

    const rootName = UI_ALTIMETER_ROOT_ID + pid;
    const refs = State.hudCache.hudByPid[pid];

    // Idempotent path: widget tree exists, just rehydrate refs.
    // v0.673 ROOT CAUSE FIX: also RE-APPLY position / size each call. If a widget persists
    // across script reloads (or just wasn't rebuilt because safeFind matched), the lazy build
    // path returns without ever applying the latest ALTIMETER_HUD_ANCHOR_OFFSET_* values --
    // which is why v0.667->v0.672 position changes appeared to have NO effect for the user.
    // SetUIWidgetPosition + SetUIWidgetSize hit the LIVE widget; they always win.
    const existingRoot = safeFind(rootName);
    if (existingRoot) {
        const existingCard = safeFind(UI_ALTIMETER_CARD_ID + pid);
        const existingText = safeFind(UI_ALTIMETER_TEXT_ID + pid);
        const existingLabel = safeFind(UI_ALTIMETER_WARNING_LABEL_ID + pid);
        try {
            mod.SetUIWidgetPosition(existingRoot, mod.CreateVector(ALTIMETER_HUD_ANCHOR_OFFSET_X, ALTIMETER_HUD_ANCHOR_OFFSET_Y, 0));
            mod.SetUIWidgetSize(existingRoot, mod.CreateVector(ALTIMETER_HUD_ROOT_WIDTH, ALTIMETER_HUD_ROOT_HEIGHT, 0));
            // v0.686: keep the per-child constants here IN SYNC with the eager-build positions
            // above (line ~1100). Previously this path hardcoded card.x=0 and label.x=TEXT_LEFT_PADDING,
            // which silently dragged the card to root_x=0 and mispositioned the label every loop
            // tick -- explaining the v0.684+ "altimeter not where I put it" reports.
            if (existingLabel) {
                mod.SetUIWidgetPosition(existingLabel, mod.CreateVector(ALTIMETER_HUD_LABEL_OFFSET_X, 0, 0));
                mod.SetUIWidgetSize(existingLabel, mod.CreateVector(ALTIMETER_HUD_LABEL_WIDTH, ALTIMETER_HUD_LABEL_HEIGHT, 0));
            }
            if (existingCard) {
                mod.SetUIWidgetPosition(existingCard, mod.CreateVector(ALTIMETER_HUD_CARD_OFFSET_X, ALTIMETER_HUD_CARD_OFFSET_Y, 0));
                mod.SetUIWidgetSize(existingCard, mod.CreateVector(ALTIMETER_HUD_CARD_WIDTH, ALTIMETER_HUD_CARD_HEIGHT, 0));
            }
            if (existingText) {
                mod.SetUIWidgetPosition(existingText, mod.CreateVector(ALTIMETER_HUD_CARD_OFFSET_X + ALTIMETER_HUD_TEXT_LEFT_PADDING, ALTIMETER_HUD_CARD_OFFSET_Y, 0));
                mod.SetUIWidgetSize(existingText, mod.CreateVector(ALTIMETER_HUD_CARD_WIDTH - ALTIMETER_HUD_TEXT_LEFT_PADDING, ALTIMETER_HUD_CARD_HEIGHT, 0));
            }
        } catch (_e) {}
        if (refs) {
            refs.altimeterRoot = existingRoot;
            refs.altimeterCard = existingCard;
            refs.altimeterText = existingText;
            refs.altimeterWarningLabel = existingLabel;
        }
        return existingRoot;
    }

    // v0.672: TopLeft root anchor (the ONLY left-side root anchor this engine accepts in
    // ParseUI; CenterLeft/BottomLeft silently fall back). To position lower-left we use a
    // large Y in ALTIMETER_HUD_ANCHOR_OFFSET_Y (800 of 1080). Same pattern as the existing
    // Upper_Left_Container_ / Container_TopLeft_CoreUI_ which both use TopLeft + explicit
    // pixel offsets and render at their named positions reliably.
    // Children stay TopLeft within the root (sibling text+card -- no nesting drift, see v0.668).
    try {
        modlib.ParseUI({
            name: rootName,
            type: "Container",
            playerId: player,
            position: [ALTIMETER_HUD_ANCHOR_OFFSET_X, ALTIMETER_HUD_ANCHOR_OFFSET_Y],
            size: [ALTIMETER_HUD_ROOT_WIDTH, ALTIMETER_HUD_ROOT_HEIGHT],
            anchor: mod.UIAnchor.TopLeft,
            visible: false,
            padding: 0,
            bgAlpha: 0,
            bgFill: mod.UIBgFill.None,
            children: [
                // 1) Yellow "ALTITUDE WARNING" label at top of root, hidden by default.
                //    Indented to match the altitude text's horizontal position.
                {
                    name: UI_ALTIMETER_WARNING_LABEL_ID + pid,
                    type: "Text",
                    position: [ALTIMETER_HUD_TEXT_LEFT_PADDING, 0],
                    size: [ALTIMETER_HUD_LABEL_WIDTH, ALTIMETER_HUD_LABEL_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: false,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(STR_HUD_ALTIMETER_WARNING_LABEL),
                    textColor: COLOR_WARNING_YELLOW,
                    textAlpha: 1,
                    textSize: ALTIMETER_HUD_LABEL_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.CenterLeft,
                },
                // 2) Black-backplate card -- pure visual backplate, no text inside.
                {
                    name: UI_ALTIMETER_CARD_ID + pid,
                    type: "Container",
                    position: [0, ALTIMETER_HUD_CARD_OFFSET_Y],
                    size: [ALTIMETER_HUD_CARD_WIDTH, ALTIMETER_HUD_CARD_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgColor: [0, 0, 0],
                    bgAlpha: 0.75,
                    bgFill: mod.UIBgFill.Blur,
                },
                // 3) Altitude text -- SIBLING of the card (not nested), overlaid on top.
                //    Declared after the card so it renders on top in the parent's child order.
                {
                    name: UI_ALTIMETER_TEXT_ID + pid,
                    type: "Text",
                    position: [ALTIMETER_HUD_TEXT_LEFT_PADDING, ALTIMETER_HUD_CARD_OFFSET_Y],
                    size: [ALTIMETER_HUD_CARD_WIDTH - ALTIMETER_HUD_TEXT_LEFT_PADDING, ALTIMETER_HUD_CARD_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(STR_HUD_ALTIMETER_FORMAT, 0),
                    textColor: COLOR_READY_GREEN,
                    textAlpha: 1,
                    textSize: ALTIMETER_HUD_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.CenterLeft,
                },
            ],
        });
    } catch (_e) {
        return undefined;
    }

    const root = safeFind(rootName);
    if (!root) return undefined;
    safeSetUIWidgetDepth(root, mod.UIDepth.AboveGameUI);
    // Belt-and-suspenders depth on the card and the label so they ride above the cockpit overlay
    // even if the parent's depth doesn't cascade (the existing altitude warning dialog needed this).
    const card = safeFind(UI_ALTIMETER_CARD_ID + pid);
    const text = safeFind(UI_ALTIMETER_TEXT_ID + pid);
    const label = safeFind(UI_ALTIMETER_WARNING_LABEL_ID + pid);
    safeSetUIWidgetDepth(card, mod.UIDepth.AboveGameUI);
    safeSetUIWidgetDepth(text, mod.UIDepth.AboveGameUI);
    safeSetUIWidgetDepth(label, mod.UIDepth.AboveGameUI);

    if (refs) {
        refs.altimeterRoot = root;
        refs.altimeterCard = card;
        refs.altimeterText = text;
        refs.altimeterWarningLabel = label;
    }
    return root;
}

// v0.674: show/hide the altimeter CARD + TEXT (the visible parts). Root stays always-visible
// as an invisibly-rendered positioning frame so the engine keeps it at its build-time TopLeft
// (20, 800) position. Toggling visibility on the root itself was unreliable -- v0.673 left the
// invisible root alive but lazy and engine ended up rendering children wherever.
function setAltimeterVisibleForPid(pid: number, visible: boolean): void {
    const refs = State.hudCache.hudByPid[pid];
    let card = refs?.altimeterCard;
    let text = refs?.altimeterText;
    if (!card) {
        card = safeFind(UI_ALTIMETER_CARD_ID + pid);
        if (card && refs) refs.altimeterCard = card;
    }
    if (!text) {
        text = safeFind(UI_ALTIMETER_TEXT_ID + pid);
        if (text && refs) refs.altimeterText = text;
    }
    safeSetUIWidgetVisible(card, visible);
    safeSetUIWidgetVisible(text, visible);
}

// v0.666: update the "Alt: {Y}" text. Called only when the integer Y changes (diff-gated in loop).
function updateAltimeterTextForPid(pid: number, posY: number): void {
    const refs = State.hudCache.hudByPid[pid];
    if (!refs?.altimeterText) return;
    safeSetUITextLabel(refs.altimeterText, mod.Message(STR_HUD_ALTIMETER_FORMAT, posY));
}

// v0.666: green when below soft, yellow when above. Called on stage transition only.
function setAltimeterStageColorForPid(pid: number, isWarning: boolean): void {
    const refs = State.hudCache.hudByPid[pid];
    if (!refs?.altimeterText) return;
    safeSetUITextColor(refs.altimeterText, isWarning ? COLOR_WARNING_YELLOW : COLOR_READY_GREEN);
}

// v0.670: toggle the small yellow "ALTITUDE WARNING" label above the altimeter. safeFind fallback
// for the same reasons as setAltimeterVisibleForPid.
function setAltimeterWarningLabelVisibleForPid(pid: number, visible: boolean): void {
    const refs = State.hudCache.hudByPid[pid];
    let label = refs?.altimeterWarningLabel;
    if (!label) {
        label = safeFind(UI_ALTIMETER_WARNING_LABEL_ID + pid);
        if (label && refs) refs.altimeterWarningLabel = label;
    }
    safeSetUIWidgetVisible(label, visible);
}

//#endregion ----------------- Altimeter HUD (v0.666 H-P1, standalone) --------------------



//#region -------------------- HUD Update Helpers --------------------

function setHudRoundCountersForAllPlayers(cur: number, max: number): void {
    // Sets authoritative round current/max values and syncs HUD + Ready dialog "Best of".
    State.round.current = Math.max(1, Math.floor(cur));
    State.round.max = Math.max(1, Math.floor(max));
    if (State.round.max < State.round.current) {
        State.round.max = State.round.current;
    }

    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const refs = ensureEagerHudShellForPlayer(p);
        if (!refs) continue;
        setCounterText(refs.roundCurText, State.round.current);
        setCounterText(refs.roundMaxText, State.round.max);
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

    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const refs = ensureEagerHudShellForPlayer(p);
        if (!refs) continue;
        setCounterText(refs.leftWinsText, lw);
        setCounterText(refs.rightWinsText, rw);
    }
    setTrendingWinnerCrownForAllPlayers();

    syncRoundRecordHudForAllPlayers();
}

function syncRoundRecordHudForAllPlayers(): void {
    // Derives losses from wins/ties and syncs the Round Record HUD for both teams.
    // Losses are derived from the opponent's win count when rounds end with a single winner.
    State.match.lossesT1 = State.match.winsT2;
    State.match.lossesT2 = State.match.winsT1;

    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const refs = ensureEagerHudShellForPlayer(p);
        if (!refs) continue;
        setRoundRecordText(refs.leftRecordText, State.match.winsT1, State.match.lossesT1, State.match.tiesT1);
        setRoundRecordText(refs.rightRecordText, State.match.winsT2, State.match.lossesT2, State.match.tiesT2);
    }
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
        const refs = ensureEagerHudShellForPlayer(p);
        if (!refs) continue;
        setAdminPanelActionCountText(refs.adminPanelActionCountText, State.admin.actionCount);
    }
}

function handleAdminPanelAction(eventPlayer: mod.Player, actionKey: number): void {
    // Increments the admin action counter and broadcasts the action to the world log.
    State.admin.actionCount = Math.max(0, Math.floor(State.admin.actionCount) + 1);
    updateAdminPanelActionCountForAllPlayers();
    sendHighlightedWorldLogMessage(
        mod.Message(mod.stringkeys.twl.adminPanel.actionPressed, safePlayerArg(eventPlayer), actionKey),
        true,
        undefined,
        mod.stringkeys.twl.adminPanel.actionPressed
    );
}

//#endregion ----------------- HUD Update Helpers --------------------



