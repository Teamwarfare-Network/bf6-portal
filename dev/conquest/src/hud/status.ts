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
    mod.SetUITextColor(widget, isLive ? COLOR_NORMAL : COLOR_NOT_READY_RED);
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

// Resolves the authoritative top-left status state text widget for one player.
function resolveTopLeftStatusStateTextForPid(pid: number): mod.UIWidget | undefined {
    const refs = State.hudCache.hudByPid[pid];
    return refs?.upperLeftStatusStateText ?? safeFind(`Upper_Left_Status_StateText_${pid}`);
}

// Resolves the authoritative top-left status ready text widget for one player.
function resolveTopLeftStatusReadyTextForPid(pid: number): mod.UIWidget | undefined {
    const refs = State.hudCache.hudByPid[pid];
    return refs?.upperLeftStatusReadyText ?? safeFind(`Upper_Left_Status_ReadyText_${pid}`);
}

// Hides legacy clock-owned status widgets so only the top-left status container remains visible.
function hideLegacyClockStatusLaneForPid(pid: number): void {
    safeSetUIWidgetVisible(safeFind(`RoundStateRoot_${pid}`), false);
    safeSetUIWidgetVisible(safeFind(`RoundStateText_${pid}`), false);
    safeSetUIWidgetVisible(safeFind(`PlayersReadyText_${pid}`), false);
}

// Enforces one deterministic layout for top-left status texts each refresh so stray legacy parent chains cannot pull them out of place.
function ensureTopLeftStatusTextLayoutForPid(pid: number): void {
    const statusRoot = resolveUpperLeftStatusRootForPid(pid);
    const statusStateText = resolveTopLeftStatusStateTextForPid(pid);
    const statusReadyText = resolveTopLeftStatusReadyTextForPid(pid);
    if (!statusRoot) return;
    const statusWidth = 206;
    const stateY = 1;
    const readyY = 15;
    const stateHeight = 14;
    const readyHeight = 15;
    try {
        mod.SetUIWidgetAnchor(statusRoot, mod.UIAnchor.TopLeft);
        mod.SetUIWidgetSize(statusRoot, mod.CreateVector(statusWidth, 30, 0));
        mod.SetUIWidgetDepth(statusRoot, mod.UIDepth.AboveGameUI);
    } catch {
        // Keep HUD lane alive even if one transform write fails.
    }
    if (statusStateText) {
        try {
            mod.SetUIWidgetParent(statusStateText, statusRoot);
            mod.SetUIWidgetAnchor(statusStateText, mod.UIAnchor.TopLeft);
            mod.SetUIWidgetPosition(statusStateText, mod.CreateVector(0, stateY, 0));
            mod.SetUIWidgetSize(statusStateText, mod.CreateVector(statusWidth, stateHeight, 0));
            mod.SetUITextAnchor(statusStateText, mod.UIAnchor.Center);
            mod.SetUIWidgetDepth(statusStateText, mod.UIDepth.AboveGameUI);
        } catch {
            // Keep HUD lane alive even if one transform write fails.
        }
    }
    if (statusReadyText) {
        try {
            mod.SetUIWidgetParent(statusReadyText, statusRoot);
            mod.SetUIWidgetAnchor(statusReadyText, mod.UIAnchor.TopLeft);
            mod.SetUIWidgetPosition(statusReadyText, mod.CreateVector(0, readyY, 0));
            mod.SetUIWidgetSize(statusReadyText, mod.CreateVector(statusWidth, readyHeight, 0));
            mod.SetUITextAnchor(statusReadyText, mod.UIAnchor.Center);
            mod.SetUIWidgetDepth(statusReadyText, mod.UIDepth.AboveGameUI);
        } catch {
            // Keep HUD lane alive even if one transform write fails.
        }
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
    const uiRoot = mod.GetUIRoot();
    if (topHudRootInitializedByPid[pid] !== true) {
        deleteAllTopHudRootsByName(rootName);
    }
    let root = safeFind(rootName);
    if (!root && player) {
        const parsedRoot = modlib.ParseUI({
            name: rootName,
            type: "Container",
            playerId: player,
            position: [0, 0],
            size: [TOP_HUD_ROOT_WIDTH, TOP_HUD_ROOT_HEIGHT],
            anchor: mod.UIAnchor.TopCenter,
            visible: true,
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
        `Upper_Left_Status_${pid}`,
        `Upper_Left_Status_StateText_${pid}`,
        `Upper_Left_Status_ReadyText_${pid}`,
        `Container_ReadyStatus_${pid}`,
        `ReadyStatusText_${pid}`,
        `RoundStateRoot_${pid}`,
        `RoundStateText_${pid}`,
        `PlayersReadyText_${pid}`,
    ];
    for (const name of statusLaneIds) {
        const widget = safeFind(name);
        if (widget) mod.SetUIWidgetDepth(widget, mod.UIDepth.AboveGameUI);
    }
    // Legacy top-center help/ready prompt lanes stay below gameplay to avoid occluding combat HUD.
    const helpIds = [
        `Container_HelpText_${pid}`,
        `HelpText_${pid}`,
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

// Refreshes one player's round-state lane placement + label so post-build HUDs never wait on a later broadcast to reparent.
function setMatchStateTextForPid(pid: number): void {
    ensureTopLeftStatusTextLayoutForPid(pid);
    const statusRoot = resolveUpperLeftStatusRootForPid(pid);
    const statusStateText = resolveTopLeftStatusStateTextForPid(pid);
    const visibility = getHudVisibilitySnapshotForPid(pid);
    safeSetUIWidgetVisible(statusRoot, true);
    safeSetUIWidgetVisible(statusStateText, true);
    setMatchStateText(statusStateText, visibility.status);
    hideLegacyClockStatusLaneForPid(pid);
}

function setMatchStateTextForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const pid = mod.GetObjId(p);
        setMatchStateTextForPid(pid);
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

        const pid = mod.GetObjId(p);
        ensureTopLeftStatusTextLayoutForPid(pid);
        const statusRoot = resolveUpperLeftStatusRootForPid(pid);
        const statusReadyText = resolveTopLeftStatusReadyTextForPid(pid);
        if (!statusReadyText) continue;
        const visibility = getHudVisibilitySnapshotForPid(pid);
        const showReadyLine = shouldShow && visibility.showPlayersReadyLine;
        const showReadyPrompt = visibility.showReady && !showReadyLine;
        safeSetUIWidgetVisible(statusRoot, true);

        // Toggle visibility first so we can avoid unnecessary label churn when hidden.
        safeSetUIWidgetVisible(statusReadyText, showReadyLine || showReadyPrompt);
        hideLegacyClockStatusLaneForPid(pid);
        if (showReadyLine) {
            const label = mod.Message(mod.stringkeys.twl.hud.playersReadyFormat, readyCount, total);
            mod.SetUITextLabel(statusReadyText, label);
            mod.SetUITextColor(statusReadyText, COLOR_WARNING_YELLOW);
            continue;
        }
        if (showReadyPrompt) {
            mod.SetUITextLabel(statusReadyText, mod.Message(mod.stringkeys.twl.hud.readyText));
            mod.SetUITextColor(statusReadyText, COLOR_READY_GREEN);
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
