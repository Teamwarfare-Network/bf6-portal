// @ts-nocheck
// Module: hud/status -- counter helpers, phase/help text, ready counts, safe widget setters

//#region -------------------- HUD Counter Helpers --------------------

// Writes the admin panel action counter label if the widget is currently available.
function setAdminPanelActionCountText(widget: mod.UIWidget | undefined, value: number): void {
    if (!widget) return;
    safeSetUITextLabel(widget, mod.Message(mod.stringkeys.twl.adminPanel.actionCountFormat, Math.floor(value)));
}

//#endregion ----------------- HUD Counter Helpers --------------------



//#region -------------------- HUD Phase State + Help Text --------------------

// Builds the live/game-over line-1 status label: "{left}v{right} {gameMode}".
function getModePlayersHeaderLabel(): mod.Message {
    const counts = getAutoStartMinPlayerCounts();
    const cfg = State.round.modeConfig;
    const gameModeValue = cfg && cfg.confirmed
        ? cfg.confirmed.gameMode
        : STR_HUD_SETTINGS_GAME_MODE_DEFAULT;
    return mod.Message(mod.stringkeys.twl.hud.statusLiveModePlayersFormat, counts.left, counts.right, gameModeValue);
}

// Renders both top-left status lines from one authoritative phase+ready snapshot.
function renderTopLeftStatusDockForPid(
    pid: number,
    readyCount: number,
    totalCount: number,
    activeCount: number
): void {
    const statusRoot = resolveUpperLeftStatusRootForPid(pid);
    const statusStateText = resolveTopLeftStatusStateTextForPid(pid);
    const statusReadyText = resolveTopLeftStatusReadyTextForPid(pid);
    const visibility = getHudVisibilitySnapshotForPid(pid);

    safeSetUIWidgetVisible(statusRoot, true);
    safeSetUIWidgetVisible(statusStateText, true);
    safeSetUIWidgetVisible(statusReadyText, true);

    if (visibility.status.isLive) {
        safeSetUITextLabel(statusStateText, getModePlayersHeaderLabel());
        safeSetUITextColor(statusStateText, COLOR_READY_GREEN);
        safeSetUITextLabel(statusReadyText, mod.Message(mod.stringkeys.twl.hud.roundStateLive));
        safeSetUITextColor(statusReadyText, COLOR_READY_GREEN);
        return;
    }

    if (visibility.status.isGameOver) {
        safeSetUITextLabel(statusStateText, getModePlayersHeaderLabel());
        safeSetUITextColor(statusStateText, COLOR_READY_GREEN);
        safeSetUITextLabel(statusReadyText, mod.Message(mod.stringkeys.twl.hud.roundStateGameOver));
        safeSetUITextColor(statusReadyText, COLOR_READY_GREEN);
        return;
    }

    const isViewerReady = !!State.players.readyByPid[pid];
    if (isViewerReady) {
        safeSetUITextLabel(statusStateText, mod.Message(mod.stringkeys.twl.hud.readyText));
        safeSetUITextColor(statusStateText, COLOR_READY_GREEN);
    } else {
        safeSetUITextLabel(statusStateText, mod.Message(mod.stringkeys.twl.hud.roundStateNotReady));
        safeSetUITextColor(statusStateText, COLOR_READY_GREEN);
    }

    safeSetUITextLabel(
        statusReadyText,
        activeCount > totalCount
            ? mod.Message(
                mod.stringkeys.twl.hud.playersReadyWithServerFormat,
                Math.floor(readyCount),
                Math.floor(totalCount),
                Math.floor(activeCount)
            )
            : mod.Message(
                mod.stringkeys.twl.hud.playersReadyFormat,
                Math.floor(readyCount),
                Math.floor(totalCount)
            )
    );
    safeSetUITextColor(statusReadyText, COLOR_WARNING_YELLOW);
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
const topHudRootInitializedByPid: Record<number, boolean> = {};

// Deletes all matching top-HUD root instances by name to prevent duplicate-name frame ambiguity.
function deleteAllTopHudRootsByName(name: string, maxPasses: number = 128): void {
    for (let i = 0; i < maxPasses; i++) {
        const widget = safeFind(name);
        if (!widget) return;
        try {
            mod.DeleteUIWidget(widget);
        } catch {
            return;
        }
    }
}

// Clears one player's top-root initialization token so next ensure performs a duplicate purge.
function resetTopHudRootInitializationForPid(pid: number): void {
    delete topHudRootInitializedByPid[pid];
}

function safeSetUIWidgetVisible(widget: mod.UIWidget | undefined, visible: boolean): void {
    if (!widget) return;
    try {
        mod.SetUIWidgetVisible(widget, visible);
    } catch {
        return;
    }
}

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
// reaching the engine overload boundary.
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

// Safe text-color write helper used by HUD render paths.
function safeSetUITextColor(widget: mod.UIWidget | undefined, color: mod.Vector): void {
    const liveWidget = resolveLiveUITextWidget(widget);
    if (!liveWidget) return;
    try {
        mod.SetUITextColor(liveWidget, color);
    } catch {
        return;
    }
}

// Safe text-alpha write helper used by HUD render paths.
function safeSetUITextAlpha(widget: mod.UIWidget | undefined, alpha: number): void {
    const liveWidget = resolveLiveUITextWidget(widget);
    if (!liveWidget) return;
    try {
        mod.SetUITextAlpha(liveWidget, alpha);
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

// Resolves the authoritative top-left status state text widget for one player.
function resolveTopLeftStatusStateTextForPid(pid: number): mod.UIWidget | undefined {
    const refs = getTopHudShellRefsForPid(pid);
    return refs?.upperLeftStatusStateText;
}

// Resolves the authoritative static status-lane root for one player from HUD cache first, then current static status name.
function resolveUpperLeftStatusRootForPid(pid: number): mod.UIWidget | undefined {
    const refs = getTopHudShellRefsForPid(pid);
    return refs?.upperLeftStatusContainer;
}

// Resolves the authoritative top-left status ready text widget for one player.
function resolveTopLeftStatusReadyTextForPid(pid: number): mod.UIWidget | undefined {
    const refs = getTopHudShellRefsForPid(pid);
    return refs?.upperLeftStatusReadyText;
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
    const rootName = wn("TopHudRoot", pid);
    const uiRoot = mod.GetUIRoot();
    const visible = true;
    if (topHudRootInitializedByPid[pid] !== true) {
        deleteAllTopHudRootsByName(rootName);
    }
    let root = safeFind(rootName);
    if (!root && player) {
        const parsedRoot = safeParseUI({
            name: rootName,
            type: "Container",
            playerId: player,
            position: [0, 0],
            size: [TOP_HUD_ROOT_WIDTH, TOP_HUD_ROOT_HEIGHT],
            anchor: mod.UIAnchor.TopCenter,
            visible,
            padding: 0,
            bgAlpha: 0,
            bgFill: mod.UIBgFill.None,
        });
        root = parsedRoot ?? safeFind(rootName);
    }

    if (!root) return undefined;
    // Root normalization is authoritative each ensure pass:
    // stale HUD sessions can leave legacy parent/anchor/size, which drifts center lanes on aspect changes.
    try {
        mod.SetUIWidgetParent(root, uiRoot);
        mod.SetUIWidgetAnchor(root, mod.UIAnchor.TopCenter);
        mod.SetUIWidgetPosition(root, mod.CreateVector(0, 0, 0));
        mod.SetUIWidgetSize(root, mod.CreateVector(TOP_HUD_ROOT_WIDTH, TOP_HUD_ROOT_HEIGHT, 0));
        mod.SetUIWidgetDepth(root, mod.UIDepth.AboveGameUI);
        mod.SetUIWidgetVisible(root, visible);
    } catch {
        return undefined;
    }
    // Post-normalization verification is best-effort:
    // some runtimes can return non-identical root handles for equivalent UI parents, so parent handle
    // identity checks are advisory and should not suppress all combat HUD rendering.
    try {
        const parent = mod.GetUIWidgetParent(root);
        if (!parent) return undefined;
        const anchor = mod.GetUIWidgetAnchor(root);
        if (anchor !== mod.UIAnchor.TopCenter) {
            mod.SetUIWidgetAnchor(root, mod.UIAnchor.TopCenter);
        }
        const pos = mod.GetUIWidgetPosition(root);
        if (mod.AbsoluteValue(mod.XComponentOf(pos)) > 0.5 || mod.AbsoluteValue(mod.YComponentOf(pos)) > 0.5) {
            mod.SetUIWidgetPosition(root, mod.CreateVector(0, 0, 0));
        }
    } catch {
        // Keep root available even if readback checks fail intermittently.
    }

    const topHudDepthIds = [
        "MatchTimerRoot_",
    ];
    for (const base of topHudDepthIds) {
        const widget = safeFind(base + pid);
        if (widget) mod.SetUIWidgetDepth(widget, mod.UIDepth.AboveGameUI);
    }

    topHudRootInitializedByPid[pid] = true;
    return root;
}

// Forces help/ready lanes below gameplay HUD depth so they do not occlude critical combat overlays.
function setHudHelpDepthForPid(pid: number): void {
    // Top-left status lane must remain above its own blur container after reparenting.
    const statusLaneIds = [
        wn("TwlConquestStatusDockRoot", pid),
        wn("TwlConquestStatusDockState", pid),
        wn("TwlConquestStatusDockReady", pid),
        wn("TwlConquestHudStatusPanelRoot", pid),
        wn("TwlConquestHudStatusPanelStateText", pid),
        wn("TwlConquestHudStatusPanelReadyText", pid),
        wn("TwlConquestStatusStaticBox", pid),
        wn("TwlConquestStatusStaticText", pid),
        wn("TwlConquestHudStatusLaneRoot", pid),
        wn("TwlConquestHudStatusLanePrimaryText", pid),
        wn("TwlConquestHudStatusLaneSecondaryText", pid),
    ];
    for (const name of statusLaneIds) {
        const widget = safeFind(name);
        if (widget) mod.SetUIWidgetDepth(widget, mod.UIDepth.AboveGameUI);
    }
    // Legacy top-center help/ready prompt lanes stay below gameplay to avoid occluding combat HUD.
    const helpIds = [
        wn("Container_HelpText", pid),
        wn("HelpText", pid),
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
        // Top-left status lane must remain authoritative in live/game-over phases.
        // Normalize any stale help/ready slices so LIVE/GAME OVER never disappears.
        if (derivedStatus.isLive || derivedStatus.isGameOver) {
            return {
                showHelp: false,
                showReady: false,
                showRoundStateLine: true,
                showPlayersReadyLine: false,
                status: {
                    isLive: derivedStatus.isLive,
                    isGameOver: derivedStatus.isGameOver,
                },
            };
        }
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

// Refreshes one player's two-line top-left status dock using phase + ready-count state.
function setMatchStateTextForPid(pid: number): void {
    const counts = getReadyCountsForStatusHud();
    renderTopLeftStatusDockForPid(pid, counts.readyCount, counts.totalCount, counts.activeCount);
}

function setMatchStateTextForAllPlayers(): void {
    const counts = getReadyCountsForStatusHud();
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const pid = mod.GetObjId(p);
        renderTopLeftStatusDockForPid(pid, counts.readyCount, counts.totalCount, counts.activeCount);
    }
}

//#endregion ----------------- HUD Phase State + Help Text --------------------



//#region -------------------- HUD Ready Count --------------------

/**
 * Refreshes top-left status lines for every player after ready-state changes.
 * Mapping:
 * - Pre-live: line1 = NOT READY/You are Ready, line2 = X / Y PLAYERS READY
 * - Live: line1 = {left}v{right} {mode}, line2 = LIVE
 * - Game over: line1 = {left}v{right} {mode}, line2 = GAME OVER
 * IMPORTANT: Any code path that changes State.players.readyByPid MUST also refresh:
 *   - updatePlayersReadyHudTextForAllPlayers()
 *   - renderReadyDialogForAllVisibleViewers() (if the dialog can be open)
 * to prevent stale HUD/roster state (e.g., after swap teams or leaving base forces NOT READY).
 */
// Computes ready progress for top-left status HUD:
// - X = ready active players (with team-0 valid-player fallback)
// - Y = configured minimum total players-to-start
// - Z = total active players in server (fallback: valid connected players when team assignment is not available yet)
function getReadyCountsForStatusHud(): { readyCount: number; totalCount: number; activeCount: number } {
    const active = getActivePlayers();
    const activeCount = active.all.length;
    const requiredTotal = getAutoStartMinPlayerCounts().total;

    let activeReadyCount = 0;
    for (let i = 0; i < activeCount; i++) {
        const pid = safeGetPlayerId(active.all[i]);
        if (pid === undefined) continue;
        if (State.players.readyByPid[pid]) activeReadyCount++;
    }

    if (activeCount > 0) {
        return { readyCount: activeReadyCount, totalCount: requiredTotal, activeCount };
    }

    // Team-0 fallback: count valid connected players when no Team1/2 assignment exists yet.
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    let validPlayerCount = 0;
    let validReadyCount = 0;
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const pid = safeGetPlayerId(p);
        if (pid === undefined) continue;
        validPlayerCount++;
        if (State.players.readyByPid[pid]) validReadyCount++;
    }
    return { readyCount: validReadyCount, totalCount: requiredTotal, activeCount: validPlayerCount };
}

function updatePlayersReadyHudTextForAllPlayers(): void {
    // Compute counts once, then broadcast the same label to all viewers.
    const readyCounts = getReadyCountsForStatusHud();

    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const pid = mod.GetObjId(p);
        renderTopLeftStatusDockForPid(pid, readyCounts.readyCount, readyCounts.totalCount, readyCounts.activeCount);
    }
}

// Lightweight helper for ready-up broadcasts (avoids recomputing counts in UI handlers).
function getReadyCountsForMessage(): { readyCount: number; totalCount: number } {
    const statusCounts = getReadyCountsForStatusHud();
    return {
        readyCount: statusCounts.readyCount,
        totalCount: statusCounts.totalCount,
    };
}

//#endregion ----------------- HUD Ready Count --------------------


