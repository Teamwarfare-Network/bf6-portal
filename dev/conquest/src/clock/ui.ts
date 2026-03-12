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
    const rootName = "MatchTimerRoot_" + pid;
    const legacyRoundStateRootName = "RoundStateRoot_" + pid;
    // Keep digit/colon spacing tied to the original visual clock lane, independent of the widened container.
    const digitLayoutWidth = 99.01;
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
        if (probeClock) {
            const legacyRoundStateRoot = safeFind(legacyRoundStateRootName);
            if (legacyRoundStateRoot) {
                try {
                    mod.SetUIWidgetVisible(legacyRoundStateRoot, false);
                } catch {
                    // Keep clock cache path resilient if legacy hide fails.
                }
            }
            setHudHelpDepthForPid(pid);
            return cached;
        }
    }

    // Cache-miss hard reset:
    // remove stale clock/status widgets from previous reloads so the rebuilt hierarchy is deterministic.
    deleteAllByName(rootName);
    deleteAllByName(legacyRoundStateRootName);
    deleteAllByName("MatchTimerMinTens_" + pid);
    deleteAllByName("MatchTimerMinOnes_" + pid);
    deleteAllByName("MatchTimerColon_" + pid);
    deleteAllByName("MatchTimerSecTens_" + pid);
    deleteAllByName("MatchTimerSecOnes_" + pid);
    deleteAllByName("RoundStateText_" + pid);
    deleteAllByName("PlayersReadyText_" + pid);

    modlib.ParseUI({
        name: rootName,
        type: "Container",
        playerId: player,
        anchor: mod.UIAnchor.TopCenter,
        // position: [x, y] offset; direction depends on anchor, so verify visually in-game
        position: [CLOCK_POSITION_X, CLOCK_POSITION_Y],
        size: [CLOCK_WIDTH, CLOCK_HEIGHT],
        visible: true,
        bgAlpha: 0,
        children: [
            // Slow path: create digit widgets once per player, then cache refs for future updates.
            buildDigit("MinTens", pid, xOffsets.minTens, digitWidth),
            buildDigit("MinOnes", pid, xOffsets.minOnes, digitWidth),
            buildColon(pid, xOffsets.colon, colonWidth),
            buildDigit("SecTens", pid, xOffsets.secTens, digitWidth),
            buildDigit("SecOnes", pid, xOffsets.secOnes, digitWidth),
        ],
    });

    const entry: ClockWidgetCacheEntry = {
        rootName: rootName,
        roundStateRootName: "",
        minTens: safeFind("MatchTimerMinTens_" + pid) as mod.UIWidget,
        minOnes: safeFind("MatchTimerMinOnes_" + pid) as mod.UIWidget,
        colon: safeFind("MatchTimerColon_" + pid) as mod.UIWidget,
        secTens: safeFind("MatchTimerSecTens_" + pid) as mod.UIWidget,
        secOnes: safeFind("MatchTimerSecOnes_" + pid) as mod.UIWidget,
        roundStateText: undefined,
        playersReadyText: undefined,
    };

    if (
        !entry.minTens ||
        !entry.minOnes ||
        !entry.colon ||
        !entry.secTens ||
        !entry.secOnes
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
            if (topHudRoot) mod.SetUIWidgetParent(probeClock, topHudRoot);
        }
    }

    State.hudCache.clockWidgetCache[pid] = entry;
    setClockColorCached(entry, COLOR_NORMAL);
    ensureTopHudRootForPid(pid, player);
    setHudHelpDepthForPid(pid);

    return entry;
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
        textLabel: mod.stringkeys.twl.hud.clock.colon,
        textSize: CLOCK_FONT_SIZE,
        textAnchor: mod.UIAnchor.Center,
    };
}

// Writes a single numeric digit into an existing cached clock text widget.
function setDigitCached(widget: mod.UIWidget, digit: number): void {
    mod.SetUITextLabel(widget, mod.Message(mod.stringkeys.twl.hud.clock.digit, digit));
}

// Writes the colon glyph into an existing cached clock separator widget.
function setColonCached(widget: mod.UIWidget): void {
    mod.SetUITextLabel(widget, mod.Message(mod.stringkeys.twl.hud.clock.colon));
}

// Applies one color value across all cached clock digit/separator widgets.
function setClockColorCached(cacheEntry: ClockWidgetCacheEntry, color: any): void {
    mod.SetUITextColor(cacheEntry.minTens, color);
    mod.SetUITextColor(cacheEntry.minOnes, color);
    mod.SetUITextColor(cacheEntry.colon, color);
    mod.SetUITextColor(cacheEntry.secTens, color);
    mod.SetUITextColor(cacheEntry.secOnes, color);
}

//#endregion ----------------- Match Clock - UI Build + Cache Helpers --------------------
