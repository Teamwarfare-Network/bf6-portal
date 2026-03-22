// @ts-nocheck
// Module: clock/ui -- clock widget build, cache, and digit rendering helpers

//#region -------------------- Match Clock - UI Build + Cache Helpers --------------------



/**
 * Ensures the clock UI widgets exist for a given player and returns the cached references.
 * Responsibilities:
 * - Create any missing digit/colon widgets (one-time per player).
 * - Return a cache object that the clock update code can use without repeated widget lookups.
 * Non-responsibilities:
 * - Does not start/stop the clock; it only ensures UI exists.
 */

function ensureClockUIAndGetCache(player: mod.Player): ClockWidgetCacheEntry | undefined {
    // Clock widgets are stored per-player; derive pid for cache lookup.
const pid = mod.GetObjId(player);
    const visible = isHudWarmReadyForPid(pid);
    const rootName = "MatchTimerRoot_" + pid;
    const surfaceName = "MatchTimerSurface_" + pid;
    const legacyPlateName = "MatchTimerPlate_" + pid;
    const legacyRoundStateRootName = "RoundStateRoot_" + pid;
    // Keep digit/colon spacing tied to the visual clock lane, independent of root-ownership normalization.
    const digitLayoutWidth = CLOCK_DIGIT_LAYOUT_WIDTH;
    const digitWidth = digitLayoutWidth * 0.22;
    const colonWidth = digitLayoutWidth * 0.08;
    const xOffsets = {
        minTens: -digitWidth * CLOCK_DIGIT_OUTER_OFFSET_MULT,
        minOnes: -digitWidth * CLOCK_DIGIT_INNER_OFFSET_MULT,
        // Keep the separator centered on the global top-HUD X lane; subpixel drift is corrected by layout constant.
        colon: CLOCK_COLON_OFFSET_X,
        secTens: digitWidth * CLOCK_DIGIT_INNER_OFFSET_MULT,
        secOnes: digitWidth * CLOCK_DIGIT_OUTER_OFFSET_MULT,
    };
    const deleteAllByName = (name: string, maxPasses: number = 128): void => {
        for (let i = 0; i < maxPasses; i++) {
            const widget = safeFind(name);
            if (!widget) return;
            try {
                mod.DeleteUIWidget(widget);
            } catch {
                return;
            }
        }
    };

    const cached = State.hudCache.clockWidgetCache[pid];
    if (cached) {
        const probeClock = safeFind(cached.rootName);
        const probePlate = safeFind(cached.surfaceName);
        if (probeClock && probePlate) {
            const legacyRoundStateRoot = safeFind(legacyRoundStateRootName);
            if (legacyRoundStateRoot) {
                try {
                    mod.SetUIWidgetVisible(legacyRoundStateRoot, false);
                } catch {
                    // Keep clock cache path resilient if legacy hide fails.
                }
            }
            const topHudRoot = ensureTopHudRootForPid(pid, player);
            normalizeClockRootAndPlate(probeClock, probePlate, topHudRoot);
            cached.root = probeClock as mod.UIWidget;
            cached.plate = probePlate as mod.UIWidget;
            if (cached.lastVisibleState === undefined) cached.lastVisibleState = true;
            setHudHelpDepthForPid(pid);
            return cached;
        }
    }

    // Cache-miss hard reset:
    // remove stale clock/status widgets from previous reloads so the rebuilt hierarchy is deterministic.
    deleteAllByName(rootName);
    deleteAllByName(surfaceName);
    deleteAllByName(legacyPlateName);
    deleteAllByName(legacyRoundStateRootName);
    deleteAllByName("MatchTimerMinTens_" + pid);
    deleteAllByName("MatchTimerMinTensShadow_" + pid);
    deleteAllByName("MatchTimerMinOnes_" + pid);
    deleteAllByName("MatchTimerMinOnesShadow_" + pid);
    deleteAllByName("MatchTimerColon_" + pid);
    deleteAllByName("MatchTimerColonShadow_" + pid);
    deleteAllByName("MatchTimerSecTens_" + pid);
    deleteAllByName("MatchTimerSecTensShadow_" + pid);
    deleteAllByName("MatchTimerSecOnes_" + pid);
    deleteAllByName("MatchTimerSecOnesShadow_" + pid);
    deleteAllByName("RoundStateText_" + pid);
    deleteAllByName("PlayersReadyText_" + pid);

    safeParseUI({
        name: rootName,
        type: "Container",
        playerId: player,
        anchor: mod.UIAnchor.TopCenter,
        // position: [x, y] offset; direction depends on anchor, so verify visually in-game
        position: [CLOCK_POSITION_X, CLOCK_POSITION_Y],
        size: [CLOCK_WIDTH, CLOCK_HEIGHT],
        visible,
        bgAlpha: 0,
        bgFill: mod.UIBgFill.None,
        children: [
            // Slow path: create digit widgets once per player, then cache refs for future updates.
            buildDigitShadow("MinTens", pid, xOffsets.minTens, digitWidth),
            buildDigit("MinTens", pid, xOffsets.minTens, digitWidth),
            buildDigitShadow("MinOnes", pid, xOffsets.minOnes, digitWidth),
            buildDigit("MinOnes", pid, xOffsets.minOnes, digitWidth),
            buildColonShadow(pid, xOffsets.colon, colonWidth),
            buildColon(pid, xOffsets.colon, colonWidth),
            buildDigitShadow("SecTens", pid, xOffsets.secTens, digitWidth),
            buildDigit("SecTens", pid, xOffsets.secTens, digitWidth),
            buildDigitShadow("SecOnes", pid, xOffsets.secOnes, digitWidth),
            buildDigit("SecOnes", pid, xOffsets.secOnes, digitWidth),
        ],
    });

    buildClockSurface(pid, player, visible);

    const entry: ClockWidgetCacheEntry = {
        root: safeFind(rootName) as mod.UIWidget,
        rootName: rootName,
        surfaceName,
        roundStateRootName: "",
        plate: safeFind(surfaceName) as mod.UIWidget,
        minTensShadow: safeFind("MatchTimerMinTensShadow_" + pid) as mod.UIWidget | undefined,
        minTens: safeFind("MatchTimerMinTens_" + pid) as mod.UIWidget,
        minOnesShadow: safeFind("MatchTimerMinOnesShadow_" + pid) as mod.UIWidget | undefined,
        minOnes: safeFind("MatchTimerMinOnes_" + pid) as mod.UIWidget,
        colonShadow: safeFind("MatchTimerColonShadow_" + pid) as mod.UIWidget | undefined,
        colon: safeFind("MatchTimerColon_" + pid) as mod.UIWidget,
        secTensShadow: safeFind("MatchTimerSecTensShadow_" + pid) as mod.UIWidget | undefined,
        secTens: safeFind("MatchTimerSecTens_" + pid) as mod.UIWidget,
        secOnesShadow: safeFind("MatchTimerSecOnesShadow_" + pid) as mod.UIWidget | undefined,
        secOnes: safeFind("MatchTimerSecOnes_" + pid) as mod.UIWidget,
        roundStateText: undefined,
        playersReadyText: undefined,
        lastVisibleState: true,
    };

    if (
        !entry.root ||
        !entry.minTens ||
        !entry.minOnes ||
        !entry.colon ||
        !entry.secTens ||
        !entry.secOnes ||
        !entry.plate
    ) {
        return undefined;
    }

    // Creation path hardening:
    // if a stale RoundStateRoot survived an earlier build, force it under the clock root
    // so LIVE/GAME OVER and ready count always follow the clock widget container.
    {
        const topHudRoot = ensureTopHudRootForPid(pid, player);
        const probeClock = safeFind(rootName);
        if (probeClock) {
            normalizeClockRootAndPlate(probeClock, entry.plate, topHudRoot);
        }
    }

    State.hudCache.clockWidgetCache[pid] = entry;
    setClockColorCached(entry, COLOR_NORMAL);
    ensureTopHudRootForPid(pid, player);
    setHudHelpDepthForPid(pid);

    return entry;
}

// Builds the explicit clock surface as its own top-center widget so visible panel geometry is deterministic.
function buildClockSurface(pid: number, player: mod.Player, visible: boolean): void {
    safeParseUI({
        name: "MatchTimerSurface_" + pid,
        type: "Container",
        playerId: player,
        anchor: mod.UIAnchor.TopCenter,
        position: [CLOCK_POSITION_X, CLOCK_POSITION_Y + CLOCK_PLATE_OFFSET_Y],
        size: [CLOCK_PLATE_WIDTH, CLOCK_PLATE_HEIGHT],
        visible,
        bgColor: [54 / 255, 57 / 255, 60 / 255],
        bgAlpha: CLOCK_PLATE_ALPHA,
        bgFill: mod.UIBgFill.Blur,
    });
}

// Normalizes clock root ownership/surface and the explicit plate geometry every ensure pass.
function normalizeClockRootAndPlate(
    root: mod.UIWidget | undefined,
    plate: mod.UIWidget | undefined,
    topHudRoot: mod.UIWidget | undefined
): void {
    if (!root || !plate) return;
    try {
        if (topHudRoot) mod.SetUIWidgetParent(root, topHudRoot);
        mod.SetUIWidgetAnchor(root, mod.UIAnchor.TopCenter);
        mod.SetUIWidgetPosition(root, mod.CreateVector(CLOCK_POSITION_X, CLOCK_POSITION_Y, 0));
        mod.SetUIWidgetSize(root, mod.CreateVector(CLOCK_WIDTH, CLOCK_HEIGHT, 0));
        mod.SetUIWidgetBgFill(root, mod.UIBgFill.None);
        mod.SetUIWidgetBgAlpha(root, 0);
        mod.SetUIWidgetDepth(root, mod.UIDepth.AboveGameUI);

        if (topHudRoot) mod.SetUIWidgetParent(plate, topHudRoot);
        mod.SetUIWidgetAnchor(plate, mod.UIAnchor.TopCenter);
        mod.SetUIWidgetPosition(plate, mod.CreateVector(CLOCK_POSITION_X, CLOCK_POSITION_Y + CLOCK_PLATE_OFFSET_Y, 0));
        mod.SetUIWidgetSize(plate, mod.CreateVector(CLOCK_PLATE_WIDTH, CLOCK_PLATE_HEIGHT, 0));
        mod.SetUIWidgetBgFill(plate, mod.UIBgFill.Blur);
        mod.SetUIWidgetBgColor(plate, COLOR_GRAY_DARK);
        mod.SetUIWidgetBgAlpha(plate, CLOCK_PLATE_ALPHA);
        mod.SetUIWidgetDepth(plate, mod.UIDepth.AboveGameUI);
    } catch {
        return;
    }
}

// Builds a single numeric clock digit descriptor for ParseUI clock children.
function buildDigit(part: string, pid: number, x: number, width: number) {
    return {
        name: "MatchTimer" + part + "_" + pid,
        type: "Text",
        anchor: mod.UIAnchor.Center,
        // position: [x, y] offset; direction depends on anchor, so verify visually in-game
        position: [x, CLOCK_TEXT_OFFSET_Y],
        size: [width, CLOCK_HEIGHT],
        visible: true,
        bgAlpha: 0,
        textLabel: mod.Message(mod.stringkeys.twl.hud.clock.digit, 0),
        textSize: CLOCK_FONT_SIZE,
        textAnchor: mod.UIAnchor.Center,
    };
}

function buildDigitShadow(part: string, pid: number, x: number, width: number) {
    return {
        name: "MatchTimer" + part + "Shadow_" + pid,
        type: "Text",
        anchor: mod.UIAnchor.Center,
        position: [x + CLOCK_TEXT_SHADOW_OFFSET_X, CLOCK_TEXT_OFFSET_Y + CLOCK_TEXT_SHADOW_OFFSET_Y],
        size: [width, CLOCK_HEIGHT],
        visible: true,
        bgAlpha: 0,
        textLabel: mod.Message(mod.stringkeys.twl.hud.clock.digit, 0),
        textColor: [0, 0, 0],
        textAlpha: CLOCK_TEXT_SHADOW_ALPHA,
        textSize: CLOCK_FONT_SIZE,
        textAnchor: mod.UIAnchor.Center,
    };
}

// Builds the static ":" clock separator descriptor for ParseUI clock children.
function buildColon(pid: number, x: number, width: number) {
    return {
        name: "MatchTimerColon_" + pid,
        type: "Text",
        anchor: mod.UIAnchor.Center,
        // position: [x, y] offset; direction depends on anchor, so verify visually in-game
        position: [x, CLOCK_TEXT_OFFSET_Y],
        size: [width, CLOCK_HEIGHT],
        visible: true,
        bgAlpha: 0,
        textLabel: mod.Message(mod.stringkeys.twl.hud.clock.colon),
        textSize: CLOCK_FONT_SIZE,
        textAnchor: mod.UIAnchor.Center,
    };
}

function buildColonShadow(pid: number, x: number, width: number) {
    return {
        name: "MatchTimerColonShadow_" + pid,
        type: "Text",
        anchor: mod.UIAnchor.Center,
        position: [x + CLOCK_TEXT_SHADOW_OFFSET_X, CLOCK_TEXT_OFFSET_Y + CLOCK_TEXT_SHADOW_OFFSET_Y],
        size: [width, CLOCK_HEIGHT],
        visible: true,
        bgAlpha: 0,
        textLabel: mod.Message(mod.stringkeys.twl.hud.clock.colon),
        textColor: [0, 0, 0],
        textAlpha: CLOCK_TEXT_SHADOW_ALPHA,
        textSize: CLOCK_FONT_SIZE,
        textAnchor: mod.UIAnchor.Center,
    };
}

// Writes a single numeric digit into an existing cached clock text widget.
function setDigitCached(widget: mod.UIWidget, digit: number): void {
    safeSetUITextLabel(widget, mod.Message(mod.stringkeys.twl.hud.clock.digit, digit));
}

// Writes the colon glyph into an existing cached clock separator widget.
function setColonCached(widget: mod.UIWidget): void {
    safeSetUITextLabel(widget, mod.Message(mod.stringkeys.twl.hud.clock.colon));
}

// Applies one color value across all cached clock digit/separator widgets.
function setClockColorCached(cacheEntry: ClockWidgetCacheEntry, color: any): void {
    mod.SetUITextColor(cacheEntry.minTens, color);
    mod.SetUITextColor(cacheEntry.minOnes, color);
    mod.SetUITextColor(cacheEntry.colon, color);
    mod.SetUITextColor(cacheEntry.secTens, color);
    mod.SetUITextColor(cacheEntry.secOnes, color);
}

// Toggles only clock-specific widgets so final-minute flash never hides shared root-owned status text.
function setClockVisibilityCached(cacheEntry: ClockWidgetCacheEntry, visible: boolean): void {
    // Loading-gate and swap transitions need the entire clock tree dark until the final reveal.
    safeSetUIWidgetVisible(cacheEntry.root, visible);
    // Reassert the visible phase every pass so transient external hides cannot leave the clock stuck off.
    if (!visible && cacheEntry.lastVisibleState === false) return;
    safeSetUIWidgetVisible(cacheEntry.plate, visible);
    safeSetUIWidgetVisible(cacheEntry.minTensShadow, visible);
    safeSetUIWidgetVisible(cacheEntry.minTens, visible);
    safeSetUIWidgetVisible(cacheEntry.minOnesShadow, visible);
    safeSetUIWidgetVisible(cacheEntry.minOnes, visible);
    safeSetUIWidgetVisible(cacheEntry.colonShadow, visible);
    safeSetUIWidgetVisible(cacheEntry.colon, visible);
    safeSetUIWidgetVisible(cacheEntry.secTensShadow, visible);
    safeSetUIWidgetVisible(cacheEntry.secTens, visible);
    safeSetUIWidgetVisible(cacheEntry.secOnesShadow, visible);
    safeSetUIWidgetVisible(cacheEntry.secOnes, visible);
    cacheEntry.lastVisibleState = visible;
}

//#endregion ----------------- Match Clock - UI Build + Cache Helpers --------------------

