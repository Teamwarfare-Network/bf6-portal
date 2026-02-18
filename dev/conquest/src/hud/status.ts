// @ts-nocheck
// Module: hud/status -- counter helpers, phase/help text, ready counts, safe widget setters

//#region -------------------- HUD Counter Helpers --------------------

function setAdminPanelActionCountText(widget: mod.UIWidget | undefined, value: number): void {
    if (!widget) return;
    mod.SetUITextLabel(widget, mod.Message(mod.stringkeys.twl.adminPanel.actionCountFormat, Math.floor(value)));
}

//#endregion ----------------- HUD Counter Helpers --------------------



//#region -------------------- HUD Phase State + Help Text --------------------

function setMatchStateText(widget: mod.UIWidget | undefined): void {
    if (!widget) return;

    if (State.round.phase === MatchPhase.GameOver) {
        mod.SetUITextLabel(widget, mod.Message(mod.stringkeys.twl.hud.roundStateGameOver));
        mod.SetUITextColor(widget, COLOR_WARNING_YELLOW);
        return;
    }

    const isLive = isMatchLive();
    const stateKey = isLive ? mod.stringkeys.twl.hud.roundStateLive : mod.stringkeys.twl.hud.roundStateNotReady;
    mod.SetUITextLabel(widget, mod.Message(stateKey));

    // Color: white when LIVE, red when NOT READY
    mod.SetUITextColor(widget, isLive ? mod.CreateVector(1, 1, 1) : COLOR_NOT_READY_RED);
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
    ];
    for (const name of helpIds) {
        const widget = safeFind(name);
        if (widget) mod.SetUIWidgetDepth(widget, mod.UIDepth.BelowGameUI);
    }
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
        setMatchStateText(cache.roundStateText);
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

    const shouldShow = !State.match.victoryDialogActive;

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
