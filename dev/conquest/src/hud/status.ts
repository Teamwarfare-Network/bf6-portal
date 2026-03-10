// @ts-nocheck
// Module: hud/status -- counter helpers, phase/help text, ready counts, safe widget setters

//#region -------------------- HUD Counter Helpers --------------------

// Writes the admin panel action counter label if the widget is currently available.
function setAdminPanelActionCountText(widget: mod.UIWidget | undefined, value: number): void {
    if (!widget) return;
    mod.SetUITextLabel(widget, mod.Message(mod.stringkeys.twl.adminPanel.actionCountFormat, Math.floor(value)));
}

//#endregion ----------------- HUD Counter Helpers --------------------



//#region -------------------- HUD Phase State + Help Text --------------------

function setMatchStateText(
    widget: mod.UIWidget | undefined,
    derivedStatus: {
        isLive: boolean;
        isGameOver: boolean;
    }
): void {
    if (!widget) return;

    const isGameOver = derivedStatus.isGameOver;
    if (isGameOver) {
        mod.SetUITextLabel(widget, mod.Message(mod.stringkeys.twl.hud.roundStateGameOver));
        mod.SetUITextColor(widget, COLOR_WARNING_YELLOW);
        return;
    }

    const isLive = derivedStatus.isLive;
    const stateKey = isLive ? mod.stringkeys.twl.hud.roundStateLive : mod.stringkeys.twl.hud.roundStateNotReady;
    mod.SetUITextLabel(widget, mod.Message(stateKey));

    // Color: white when LIVE, red when NOT READY
    mod.SetUITextColor(widget, isLive ? mod.CreateVector(1, 1, 1) : COLOR_NOT_READY_RED);
}

// Splits remaining clock seconds into minute and second digit parts for HUD glyph widgets.
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

// Safe text-label write helper used by HUD render paths.
function safeSetUITextLabel(widget: mod.UIWidget | undefined, label: mod.Message): void {
    if (!widget) return;
    try {
        mod.SetUITextLabel(widget, label);
    } catch {
        return;
    }
}

// Safe text-color write helper used by HUD render paths.
function safeSetUITextColor(widget: mod.UIWidget | undefined, color: mod.Vector): void {
    if (!widget) return;
    try {
        mod.SetUITextColor(widget, color);
    } catch {
        return;
    }
}

// Safe text-alpha write helper used by HUD render paths.
function safeSetUITextAlpha(widget: mod.UIWidget | undefined, alpha: number): void {
    if (!widget) return;
    try {
        mod.SetUITextAlpha(widget, alpha);
    } catch {
        return;
    }
}

// Safe background-color write helper used by HUD render paths.
function safeSetUIWidgetBgColor(widget: mod.UIWidget | undefined, color: mod.Vector): void {
    if (!widget) return;
    try {
        mod.SetUIWidgetBgColor(widget, color);
    } catch {
        return;
    }
}

// Safe background-alpha write helper used by HUD render paths.
function safeSetUIWidgetBgAlpha(widget: mod.UIWidget | undefined, alpha: number): void {
    if (!widget) return;
    try {
        mod.SetUIWidgetBgAlpha(widget, alpha);
    } catch {
        return;
    }
}

// Safe depth write helper used by HUD render/restack paths.
function safeSetUIWidgetDepth(widget: mod.UIWidget | undefined, depth: mod.UIDepth): void {
    if (!widget) return;
    try {
        mod.SetUIWidgetDepth(widget, depth);
    } catch {
        return;
    }
}

// Safe parent write helper used by render restack paths.
function safeSetUIWidgetParent(widget: mod.UIWidget | undefined, parent: mod.UIWidget | undefined): void {
    if (!widget || !parent) return;
    try {
        mod.SetUIWidgetParent(widget, parent);
    } catch {
        return;
    }
}

// Safe size write helper used by HUD render/layout paths.
function safeSetUIWidgetSize(widget: mod.UIWidget | undefined, size: mod.Vector): void {
    if (!widget) return;
    try {
        mod.SetUIWidgetSize(widget, size);
    } catch {
        return;
    }
}

// Safe position write helper used by HUD render/layout paths.
function safeSetUIWidgetPosition(widget: mod.UIWidget | undefined, position: mod.Vector): void {
    if (!widget) return;
    try {
        mod.SetUIWidgetPosition(widget, position);
    } catch {
        return;
    }
}

// Small visibility wrapper to keep call sites semantically clear.
function setWidgetVisible(widget: mod.UIWidget | undefined, visible: boolean): void {
    if (!widget) return;
    safeSetUIWidgetVisible(widget, visible);
}

// Ensures one shared top-HUD root exists for this player and reparents core top-HUD lanes under it.
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

// Forces help/ready lanes below gameplay HUD depth so they do not occlude critical combat overlays.
function setHudHelpDepthForPid(pid: number): void {
    const helpIds = [
        `Container_HelpText_${pid}`,
        `HelpText_${pid}`,
        `Container_ReadyStatus_${pid}`,
        `ReadyStatusText_${pid}`,
        `PlayersReadyText_${pid}`,
    ];
    for (const name of helpIds) {
        const widget = safeFind(name);
        if (widget) mod.SetUIWidgetDepth(widget, mod.UIDepth.BelowGameUI);
    }
}

type HudVisibilitySnapshot = {
    showHelp: boolean;
    showReady: boolean;
    showRoundStateLine: boolean;
    showPlayersReadyLine: boolean;
    status: {
        isLive: boolean;
        isGameOver: boolean;
    };
};

// Returns one authoritative visibility snapshot for top HUD help/ready/round-state lanes.
// Priority:
// 1) derived Conquest HUD VM slices
// 2) local fallback computation
function getHudVisibilitySnapshotForPid(pid: number): HudVisibilitySnapshot {
    conquestPhase3EnsureTopHudDerivedSlicesForPid(pid);
    const derivedStatus = State.conquest.debug.hudStatusVmByPid[pid];
    const derivedHelpReady = State.conquest.debug.hudHelpReadyVmByPid[pid];
    if (derivedStatus && derivedHelpReady) {
        return {
            showHelp: derivedHelpReady.showHelp,
            showReady: derivedHelpReady.showReady,
            showRoundStateLine: derivedStatus.showRoundStateLine,
            showPlayersReadyLine: derivedStatus.showPlayersReadyLine,
            status: {
                isLive: derivedStatus.isLive,
                isGameOver: derivedStatus.isGameOver,
            },
        };
    }

    const isLive = isMatchLive();
    const isGameOver = State.round.phase === MatchPhase.GameOver;
    // Defensive fallback (should be rare): keep only state/ready line visible.
    const showHelp = false;
    const showReady = false;
    return {
        showHelp,
        showReady,
        showRoundStateLine: true,
        showPlayersReadyLine: (!State.match.victoryDialogActive) && (!isLive),
        status: {
            isLive,
            isGameOver,
        },
    };
}

/**
 * Sets the shared phase-state text (e.g., NOT READY / LIVE / GAME OVER) for every player's HUD.
 * This is a broadcast-style UI update:
 * - It does not mutate phase state; it reflects whatever authoritative state already exists.
 * - It should be called after any change that affects phase state so HUDs remain consistent.
 */

function setMatchStateTextForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const cache = ensureClockUIAndGetCache(p);
        if (!cache) continue;
        const pid = mod.GetObjId(p);
        const visibility = getHudVisibilitySnapshotForPid(pid);
        safeSetUIWidgetVisible(cache.roundStateText, visibility.showRoundStateLine);
        setMatchStateText(cache.roundStateText, visibility.status);
    }
    // Keep the pre-live ready count line in sync with phase-state HUD refreshes.
    updatePlayersReadyHudTextForAllPlayers();
}

//#endregion ----------------- HUD Phase State + Help Text --------------------



//#region -------------------- HUD Ready Count --------------------

/**
 * Updates the yellow HUD line: "X / Y PLAYERS READY" (pre-live only).
 * Visibility rules:
 * - Only shown while preparing for live start (phase NOT live).
 * - Hidden during game-over / victory dialog phases.
 * - Remains visible until the phase is live (isMatchLive() === true).
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

    const shouldShow = (!State.match.victoryDialogActive) && (!isMatchLive());

    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const cache = ensureClockUIAndGetCache(p);
        if (!cache || !cache.playersReadyText) continue;

        const pid = mod.GetObjId(p);
        const visibility = getHudVisibilitySnapshotForPid(pid);
        const showReadyLine = shouldShow && visibility.showPlayersReadyLine;

        // Toggle visibility first so we can avoid unnecessary label churn when hidden.
        safeSetUIWidgetVisible(cache.playersReadyText, showReadyLine);
        if (!showReadyLine) continue;

        const label = mod.Message(mod.stringkeys.twl.hud.playersReadyFormat, readyCount, total);
        mod.SetUITextLabel(cache.playersReadyText, label);
        mod.SetUITextColor(cache.playersReadyText, COLOR_WARNING_YELLOW);
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
