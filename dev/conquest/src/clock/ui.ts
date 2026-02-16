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
    const roundStateRootName = "RoundStateRoot_" + pid;

    const cached = State.hudCache.clockWidgetCache[pid];
    if (cached) {
        const probeClock = safeFind(cached.rootName);
        const probeState = safeFind(cached.roundStateRootName);
        if (probeClock && probeState) {
            ensureTopHudRootForPid(pid, player);
            setHudHelpDepthForPid(pid);
            return cached;
        }
    }

    const digitWidth = CLOCK_WIDTH * 0.12;
    const colonWidth = CLOCK_WIDTH * 0.06;

    const xOffsets = {
        minTens: -digitWidth * 1.8 + 14, 
        minOnes: -digitWidth * 0.8 + 8, 
        colon: -digitWidth * 0.05,
        secTens: digitWidth * 0.9 - 10, 
        secOnes: digitWidth * 1.9 - 16, 
    };

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

    // Create phase-state text under the match clock for this player.
    modlib.ParseUI({
        name: roundStateRootName,
        type: "Container",
        playerId: player,
        anchor: mod.UIAnchor.TopCenter,
        // position: [x, y] offset; direction depends on anchor, so verify visually in-game
        position: [CLOCK_POSITION_X, CLOCK_POSITION_Y + CLOCK_HEIGHT - 10],
        size: [CLOCK_WIDTH, 34],
        visible: true,
        bgAlpha: 0,
        children: [
            {
                name: "RoundStateText_" + pid,
                type: "Text",
                anchor: mod.UIAnchor.TopCenter,
                // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                position: [0, 0],
                size: [CLOCK_WIDTH, 18],
                visible: true,
                padding: 0,
                bgAlpha: 0,
                bgFill: mod.UIBgFill.None,
                textLabel: mod.stringkeys.twl.hud.roundStateNotReady,
                textColor: [1, 1, 1],
                textAlpha: 1,
                textSize: 12,
                textAnchor: mod.UIAnchor.Center,
            },
            {
                name: "PlayersReadyText_" + pid,
                type: "Text",
                anchor: mod.UIAnchor.TopCenter,
                // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                position: [0, 14],
                size: [CLOCK_WIDTH, 18],
                visible: false,
                padding: 0,
                bgAlpha: 0,
                bgFill: mod.UIBgFill.None,
                // Placeholder label; runtime will set full "{X} / {Y} PLAYERS READY" format.
                textLabel: "",
                // Yellow, matching other important HUD callouts.
                textColor: [1, 1, 0],
                textAlpha: 1,
                textSize: 11,
                textAnchor: mod.UIAnchor.Center,
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

    State.hudCache.clockWidgetCache[pid] = entry;
    setClockColorCached(entry, COLOR_NORMAL);
    ensureTopHudRootForPid(pid, player);
    setHudHelpDepthForPid(pid);

    return entry;
}

function buildDigit(part: string, pid: number, x: number, width: number) {
    return {
        name: "MatchTimer" + part + "_" + pid,
        type: "Text",
        anchor: mod.UIAnchor.Center,
        // position: [x, y] offset; direction depends on anchor, so verify visually in-game
        position: [x, 0],
        size: [width, CLOCK_HEIGHT],
        visible: true,
        bgAlpha: 0,
        textLabel: mod.Message(mod.stringkeys.twl.hud.clock.digit, 0),
        textSize: CLOCK_FONT_SIZE,
        textAnchor: mod.UIAnchor.Center,
    };
}

function buildColon(pid: number, x: number, width: number) {
    return {
        name: "MatchTimerColon_" + pid,
        type: "Text",
        anchor: mod.UIAnchor.Center,
        // position: [x, y] offset; direction depends on anchor, so verify visually in-game
        position: [x, 0],
        size: [width, CLOCK_HEIGHT],
        visible: true,
        bgAlpha: 0,
        textLabel: mod.stringkeys.twl.hud.clock.colon,
        textSize: CLOCK_FONT_SIZE,
        textAnchor: mod.UIAnchor.Center,
    };
}

function setDigitCached(widget: mod.UIWidget, digit: number): void {
    mod.SetUITextLabel(widget, mod.Message(mod.stringkeys.twl.hud.clock.digit, digit));
}

function setColonCached(widget: mod.UIWidget): void {
    mod.SetUITextLabel(widget, mod.Message(mod.stringkeys.twl.hud.clock.colon));
}

function setClockColorCached(cacheEntry: ClockWidgetCacheEntry, color: any): void {
    mod.SetUITextColor(cacheEntry.minTens, color);
    mod.SetUITextColor(cacheEntry.minOnes, color);
    mod.SetUITextColor(cacheEntry.colon, color);
    mod.SetUITextColor(cacheEntry.secTens, color);
    mod.SetUITextColor(cacheEntry.secOnes, color);
}

//#endregion ----------------- Match Clock - UI Build + Cache Helpers --------------------
