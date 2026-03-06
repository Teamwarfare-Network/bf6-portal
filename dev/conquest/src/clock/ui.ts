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
    // Keep digit/colon spacing tied to the original visual clock lane, independent of the widened container.
    const digitLayoutWidth = 99.01;
    const digitWidth = digitLayoutWidth * 0.22;
    const colonWidth = digitLayoutWidth * 0.08;
    // LIVE / GAME OVER status lane directly below the clock digits (inside clock container footprint).
    const roundStateWidth = CLOCK_WIDTH;
    const roundStateHeight = 14;
    const roundStateOffsetY = 22;
    const roundStateTextOffsetY = 41;
    // Pre-live ready count lane is relocated to the left HUD stack under branding/settings.
    const playersReadyLeftX = 5;
    const playersReadyLeftY = 131;
    const playersReadyWidth = 200;
    const playersReadyHeight = 18;
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
            ensureTopHudRootForPid(pid, player);
            // Keep cached widgets synchronized with latest layout constants.
            mod.SetUIWidgetPosition(probeClock, mod.CreateVector(CLOCK_POSITION_X, CLOCK_POSITION_Y, 0));
            mod.SetUIWidgetPosition(cached.minTens, mod.CreateVector(xOffsets.minTens, CLOCK_TEXT_OFFSET_Y, 0));
            mod.SetUIWidgetPosition(cached.minOnes, mod.CreateVector(xOffsets.minOnes, CLOCK_TEXT_OFFSET_Y, 0));
            mod.SetUIWidgetPosition(cached.colon, mod.CreateVector(xOffsets.colon, CLOCK_TEXT_OFFSET_Y, 0));
            mod.SetUIWidgetPosition(cached.secTens, mod.CreateVector(xOffsets.secTens, CLOCK_TEXT_OFFSET_Y, 0));
            mod.SetUIWidgetPosition(cached.secOnes, mod.CreateVector(xOffsets.secOnes, CLOCK_TEXT_OFFSET_Y, 0));
            // Reparent legacy detached status text under the clock root so state labels move with the clock.
            mod.SetUIWidgetParent(probeState, probeClock);
            mod.SetUIWidgetPosition(probeState, mod.CreateVector(0, roundStateOffsetY, 0));
            mod.SetUIWidgetSize(probeState, mod.CreateVector(roundStateWidth, roundStateHeight, 0));
            if (cached.roundStateText) {
                // Authoritatively drive the visible LIVE/GAME OVER text from the clock root itself.
                // This avoids stale parent/container transforms from older HUD trees.
                mod.SetUIWidgetParent(cached.roundStateText, probeClock);
                mod.SetUIWidgetAnchor(cached.roundStateText, mod.UIAnchor.TopCenter);
                mod.SetUIWidgetPosition(cached.roundStateText, mod.CreateVector(0, roundStateTextOffsetY, 0));
                mod.SetUIWidgetSize(cached.roundStateText, mod.CreateVector(roundStateWidth, roundStateHeight, 0));
            }
            if (cached.playersReadyText) {
                mod.SetUIWidgetParent(cached.playersReadyText, mod.GetUIRoot());
                mod.SetUIWidgetAnchor(cached.playersReadyText, mod.UIAnchor.TopLeft);
                mod.SetUIWidgetPosition(cached.playersReadyText, mod.CreateVector(playersReadyLeftX, playersReadyLeftY, 0));
                mod.SetUIWidgetSize(cached.playersReadyText, mod.CreateVector(playersReadyWidth, playersReadyHeight, 0));
            }
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
                bgColor: [1, 1, 1],
                bgAlpha: 0,
                bgFill: mod.UIBgFill.None,
                children: [
                    {
                        name: "RoundStateText_" + pid,
                        type: "Text",
                        anchor: mod.UIAnchor.TopCenter,
                        // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                        position: [0, 0],
                        size: [roundStateWidth, roundStateHeight],
                        visible: true,
                        padding: 0,
                        bgAlpha: 0,
                        bgFill: mod.UIBgFill.None,
                        textLabel: mod.stringkeys.twl.hud.roundStateNotReady,
                        textColor: [1, 1, 1],
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
                        textColor: [1, 1, 0],
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
        ensureTopHudRootForPid(pid, player);
        const probeClock = safeFind(rootName);
        const probeState = safeFind(roundStateRootName);
        if (probeClock && probeState) {
            mod.SetUIWidgetParent(probeState, probeClock);
            mod.SetUIWidgetPosition(probeState, mod.CreateVector(0, roundStateOffsetY, 0));
            mod.SetUIWidgetSize(probeState, mod.CreateVector(roundStateWidth, roundStateHeight, 0));
        }
        const roundStateText = safeFind("RoundStateText_" + pid);
        if (probeClock && roundStateText) {
            // Keep the runtime label directly under the clock digits regardless of legacy container state.
            mod.SetUIWidgetParent(roundStateText, probeClock);
            mod.SetUIWidgetAnchor(roundStateText, mod.UIAnchor.TopCenter);
            mod.SetUIWidgetPosition(roundStateText, mod.CreateVector(0, roundStateTextOffsetY, 0));
            mod.SetUIWidgetSize(roundStateText, mod.CreateVector(roundStateWidth, roundStateHeight, 0));
        }
        const playersReady = safeFind("PlayersReadyText_" + pid);
        if (playersReady) {
            mod.SetUIWidgetParent(playersReady, mod.GetUIRoot());
            mod.SetUIWidgetAnchor(playersReady, mod.UIAnchor.TopLeft);
            mod.SetUIWidgetPosition(playersReady, mod.CreateVector(playersReadyLeftX, playersReadyLeftY, 0));
            mod.SetUIWidgetSize(playersReady, mod.CreateVector(playersReadyWidth, playersReadyHeight, 0));
        }
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
        position: [x, CLOCK_TEXT_OFFSET_Y],
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
        position: [x, CLOCK_TEXT_OFFSET_Y],
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
