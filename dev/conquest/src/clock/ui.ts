// @ts-nocheck
// Module: clock/ui -- clock widget build, cache, and digit rendering helpers

//#region -------------------- Match Clock - UI Build + Cache Helpers --------------------



// Resolves the authoritative upper-left status container for one player, preferring cached HUD refs over global name lookup.
function resolveUpperLeftStatusRootForPid(pid: number): mod.UIWidget | undefined {
    const refs = State.hudCache.hudByPid[pid];
    return refs?.upperLeftStatusContainer ?? safeFind(`Upper_Left_Status_${pid}`);
}

// Reparents round-state and players-ready lines into the top-left status stack when available.
function attachRoundStateLaneToTopLeftStatus(pid: number, roundStateRootName: string): void {
    const roundStateRoot = safeFind(roundStateRootName);
    const statusRoot = resolveUpperLeftStatusRootForPid(pid);
    if (!roundStateRoot || !statusRoot) return;
    const statusWidth = 200;
    const statusHeight = 30;
    try {
        mod.SetUIWidgetParent(roundStateRoot, statusRoot);
        mod.SetUIWidgetAnchor(roundStateRoot, mod.UIAnchor.TopLeft);
        mod.SetUIWidgetPosition(roundStateRoot, mod.CreateVector(3, 1, 0));
        mod.SetUIWidgetSize(roundStateRoot, mod.CreateVector(statusWidth, statusHeight, 0));
        mod.SetUIWidgetDepth(roundStateRoot, mod.UIDepth.AboveGameUI);
        // Legacy status lane remains hidden; top-left status container owns visible state text now.
        mod.SetUIWidgetVisible(roundStateRoot, false);
    } catch {
        return;
    }
    const roundStateText = safeFind("RoundStateText_" + pid);
    const playersReadyText = safeFind("PlayersReadyText_" + pid);
    if (roundStateText) {
        try {
            mod.SetUIWidgetParent(roundStateText, roundStateRoot);
            mod.SetUIWidgetAnchor(roundStateText, mod.UIAnchor.TopLeft);
            mod.SetUIWidgetPosition(roundStateText, mod.CreateVector(0, 0, 0));
            mod.SetUIWidgetSize(roundStateText, mod.CreateVector(statusWidth, 14, 0));
            mod.SetUIWidgetDepth(roundStateText, mod.UIDepth.AboveGameUI);
            mod.SetUIWidgetVisible(roundStateText, false);
        } catch {
            // Keep lane alive even if text transform write fails.
        }
    }
    if (playersReadyText) {
        try {
            mod.SetUIWidgetParent(playersReadyText, roundStateRoot);
            mod.SetUIWidgetAnchor(playersReadyText, mod.UIAnchor.TopLeft);
            mod.SetUIWidgetPosition(playersReadyText, mod.CreateVector(0, 14, 0));
            mod.SetUIWidgetSize(playersReadyText, mod.CreateVector(statusWidth, 16, 0));
            mod.SetUIWidgetDepth(playersReadyText, mod.UIDepth.AboveGameUI);
            mod.SetUIWidgetVisible(playersReadyText, false);
        } catch {
            // Keep lane alive even if text transform write fails.
        }
    }
}

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
    const roundStateRootName = "RoundStateRoot_" + pid;
    // Keep digit/colon spacing tied to the original visual clock lane, independent of the widened container.
    const digitLayoutWidth = 99.01;
    const digitWidth = digitLayoutWidth * 0.22;
    const colonWidth = digitLayoutWidth * 0.08;
    // LIVE / GAME OVER + players-ready lane width tuned for the top-left status stack.
    const roundStateWidth = 200;
    const roundStateHeight = 32;
    const roundStateOffsetY = 22;
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
        const probeState = safeFind(cached.roundStateRootName);
        if (probeClock && probeState) {
            attachRoundStateLaneToTopLeftStatus(pid, cached.roundStateRootName);
            setHudHelpDepthForPid(pid);
            return cached;
        }
    }

    // Cache-miss hard reset:
    // remove stale clock/status widgets from previous reloads so the rebuilt hierarchy is deterministic.
    deleteAllByName(rootName);
    deleteAllByName(roundStateRootName);
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
            {
                name: roundStateRootName,
                type: "Container",
                anchor: mod.UIAnchor.TopCenter,
                // Nested inside clock root so round-state labels travel with the clock container.
                position: [0, roundStateOffsetY],
                size: [roundStateWidth, roundStateHeight],
                visible: true,
                bgColor: COLOR_NORMAL_RGB,
                bgAlpha: 0,
                bgFill: mod.UIBgFill.None,
                children: [
                    {
                        name: "RoundStateText_" + pid,
                        type: "Text",
                        anchor: mod.UIAnchor.TopCenter,
                        // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                        position: [0, 0],
                        size: [roundStateWidth, 14],
                        visible: true,
                        padding: 0,
                        bgAlpha: 0,
                        bgFill: mod.UIBgFill.None,
                        textLabel: mod.stringkeys.twl.hud.roundStateNotReady,
                        textColor: COLOR_NORMAL_RGB,
                        textAlpha: 1,
                        textSize: 11,
                        textAnchor: mod.UIAnchor.Center,
                    },
                    {
                        name: "PlayersReadyText_" + pid,
                        type: "Text",
                        anchor: mod.UIAnchor.TopCenter,
                        // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                        position: [0, 14],
                        size: [roundStateWidth, 18],
                        visible: false,
                        padding: 0,
                        bgAlpha: 0,
                        bgFill: mod.UIBgFill.None,
                        // Placeholder label; runtime will set full "{X} / {Y} PLAYERS READY" format.
                        textLabel: "",
                        // Yellow, matching other important HUD callouts.
                        textColor: COLOR_WARNING_YELLOW_RGB,
                        textAlpha: 1,
                        textSize: 11,
                        textAnchor: mod.UIAnchor.Center,
                    },
                ],
            },
        ],
    });

    const entry: ClockWidgetCacheEntry = {
        rootName: rootName,
        roundStateRootName: roundStateRootName,
        minTens: safeFind("MatchTimerMinTens_" + pid) as mod.UIWidget,
        minOnes: safeFind("MatchTimerMinOnes_" + pid) as mod.UIWidget,
        colon: safeFind("MatchTimerColon_" + pid) as mod.UIWidget,
        secTens: safeFind("MatchTimerSecTens_" + pid) as mod.UIWidget,
        secOnes: safeFind("MatchTimerSecOnes_" + pid) as mod.UIWidget,
        roundStateText: safeFind("RoundStateText_" + pid) as mod.UIWidget,
        playersReadyText: safeFind("PlayersReadyText_" + pid) as mod.UIWidget,
    };

    if (
        !entry.minTens ||
        !entry.minOnes ||
        !entry.colon ||
        !entry.secTens ||
        !entry.secOnes ||
        !entry.roundStateText ||
        !entry.playersReadyText
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
    attachRoundStateLaneToTopLeftStatus(pid, roundStateRootName);

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
