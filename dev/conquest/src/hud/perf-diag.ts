// @ts-nocheck
// Module: hud/perf-diag -- lightweight performance diagnostic system for lag spike attribution
//
// Two-layer architecture:
//   Layer 1 (Tick Rate): game-mode.ts loop iteration counter over a 1-second window.
//     The game loop fires every ~120ms (mod.Wait cadence), giving ~8 tps normally.
//     When lag occurs, fewer iterations fit in the window and tick rate drops.
//     A persistent "min tick rate" tracks the lowest observed rate since enable,
//     so spikes are visible after-the-fact even when current rate has recovered.
//     OngoingGlobal fires at ~1Hz (too slow); GetMatchTimeElapsed has 1-second
//     granularity (gap detection impossible). Tick counting is the reliable signal.
//   Layer 2 (Section Profiler): game-mode.ts loop sections wrapped with begin/end timing calls.
//     When a section's delta exceeds the spike threshold, it is recorded.
//     Note: GetMatchTimeElapsed has 1-second granularity, so section deltas only trigger
//     when a section happens to span a second boundary. Rarely fires in practice.
//
// UI Cache Aggregate: lines 2-3 show Built/Rebuilt and Cold/Invalid totals summed across
//   all players and all UI families (vehicle, ready, gadget). Data sourced from
//   State.players.uiCachePerfByPid. Updated every 1-second window.
//
// Section ID reference:
//   1 = conquestPhase2ARefreshLiveCaptureStateSubtick (every subtick)
//   2 = conquestPhase2AOnLiveTick (second boundary)
//   3 = updateConquestCombatHudForAllPlayers (non-second subtick)
//   4 = conquestPhase4FlushCaptureSoundQueue (every subtick)
//   5 = conquestPhase4BFlushCaptureVoiceOverQueue (every subtick)
//   6 = updateAllPlayersClock (second boundary or critical flash)
//   7 = ensureActiveWorldInteractablesReady (second boundary)
//   8 = checkTakeoffLimitForAllPlayers (second boundary)
//   9 = victory dialog update (second boundary)
//
// Output: persistent HUD panel (TopRight, below position debug) showing:
//   Line 0: tick rate header (tps, min, player count)
//   Line 1: UI cache Built/Rebuilt aggregate (always visible)
//   Line 2: UI cache Cold/Invalid aggregate (always visible)
//   Lines 3-4: section spike detail (conditional, when profiler triggers)

const PERF_DIAG_WINDOW_SECONDS = 1.0;
const PERF_DIAG_SPIKE_THRESHOLD = 0.005;
const PERF_DIAG_SECTION_COUNT = 9;
const PERF_DIAG_HEALTHY_TICK_RATE = 7;
const PERF_DIAG_STRESSED_TICK_RATE = 5;

const PERF_DIAG_PANEL_X = 300;
const PERF_DIAG_PANEL_Y = 50;
const PERF_DIAG_PANEL_WIDTH = 216;
const PERF_DIAG_HEADER_HEIGHT = 14;
const PERF_DIAG_LINE_HEIGHT = 12;
const PERF_DIAG_CACHE_LINES = 2;
const PERF_DIAG_MAX_SPIKE_LINES = 2;
const PERF_DIAG_TOTAL_LINES = PERF_DIAG_CACHE_LINES + PERF_DIAG_MAX_SPIKE_LINES;
const PERF_DIAG_PANEL_BASE_HEIGHT = PERF_DIAG_HEADER_HEIGHT + 2 + (PERF_DIAG_CACHE_LINES * PERF_DIAG_LINE_HEIGHT);

// Returns a time snapshot for the start of a profiled section.
function perfDiagBeginSection(): number {
    return mod.GetMatchTimeElapsed();
}

// Records a spike if the section's delta exceeds the threshold.
function perfDiagEndSection(id: number, start: number): void {
    const delta = mod.GetMatchTimeElapsed() - start;
    if (delta < PERF_DIAG_SPIKE_THRESHOLD) return;
    const a = State.admin;
    if (delta > (a.perfDiagSectionMax[id] ?? 0)) {
        a.perfDiagSectionMax[id] = delta;
    }
    a.perfDiagSectionHits[id] = (a.perfDiagSectionHits[id] ?? 0) + 1;
    a.perfDiagSpikeTotal++;
}

// Aggregates UI cache counters across all players and families into per-player averages and max outliers.
function perfDiagAggregateUiCache(): {
    avgBuilt: number; avgRebuilt: number; maxRebuilt: number;
    avgCold: number; avgInvalid: number; maxInvalid: number;
} {
    let totalBuilt = 0, totalRebuilt = 0, totalCold = 0, totalInvalid = 0;
    let maxRebuilt = 0, maxInvalid = 0;
    let playerCount = 0;
    for (const pidStr in State.players.uiCachePerfByPid) {
        const c = State.players.uiCachePerfByPid[pidStr];
        if (!c) continue;
        playerCount++;
        let pBuilt = 0, pRebuilt = 0, pCold = 0, pInvalid = 0;
        const families = [c.vehicle, c.ready, c.gadget];
        for (let f = 0; f < 3; f++) {
            pBuilt += families[f].built;
            pRebuilt += families[f].rebuilt;
            pCold += families[f].cold;
            pInvalid += families[f].invalid;
        }
        totalBuilt += pBuilt;
        totalRebuilt += pRebuilt;
        totalCold += pCold;
        totalInvalid += pInvalid;
        if (pRebuilt > maxRebuilt) maxRebuilt = pRebuilt;
        if (pInvalid > maxInvalid) maxInvalid = pInvalid;
    }
    const n = playerCount > 0 ? playerCount : 1;
    return {
        avgBuilt: Math.round(totalBuilt / n),
        avgRebuilt: Math.round(totalRebuilt / n),
        maxRebuilt,
        avgCold: Math.round(totalCold / n),
        avgInvalid: Math.round(totalInvalid / n),
        maxInvalid,
    };
}

// Called from the game-mode loop every ~120ms. Counts iterations per 1-second window.
// When the window completes, computes tick rate and updates the HUD for all players.
// Tick rate is the primary lag signal: normal ~8 tps, stressed <7 tps, severe <5 tps.
function perfDiagOngoingGlobalTick(): void {
    const a = State.admin;
    a.perfDiagTickCount++;
    const now = mod.GetMatchTimeElapsed();

    if (a.perfDiagWindowStart < 0) {
        a.perfDiagWindowStart = now;
        a.perfDiagTickCount = 0;
        return;
    }
    const elapsed = now - a.perfDiagWindowStart;
    if (elapsed < PERF_DIAG_WINDOW_SECONDS) return;

    // Window complete — compute tick rate and update HUD.
    const tickRate = Math.round(a.perfDiagTickCount / elapsed);
    a.perfDiagLastTickRate = tickRate;
    // Skip min recording for the first window after enable (always partial due to 1s timer granularity).
    if (a.perfDiagLastEmitAt < 0) {
        a.perfDiagLastEmitAt = now;
    } else if (tickRate < a.perfDiagMinTickRate) {
        a.perfDiagMinTickRate = tickRate;
    }
    perfDiagUpdateHudForAllPlayers(tickRate);
    perfDiagResetWindow(now);
}

// Updates every connected player's perf diag HUD panel with current window data.
function perfDiagUpdateHudForAllPlayers(tickRate: number): void {
    const a = State.admin;
    const playerCount = mod.CountOf(mod.AllPlayers());
    const cache = perfDiagAggregateUiCache();

    // Collect section indices with spikes, sorted by worst max delta descending.
    const spikeSections: number[] = [];
    for (let i = 1; i <= PERF_DIAG_SECTION_COUNT; i++) {
        if ((a.perfDiagSectionHits[i] ?? 0) > 0) spikeSections.push(i);
    }
    spikeSections.sort((x, y) => (a.perfDiagSectionMax[y] ?? 0) - (a.perfDiagSectionMax[x] ?? 0));

    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let p = 0; p < count; p++) {
        const player = mod.ValueInArray(players, p) as mod.Player;
        if (!player || !mod.IsPlayerValid(player)) continue;
        const pid = safeGetPlayerId(player);
        if (pid === undefined) continue;
        perfDiagUpdateHudForPid(pid, tickRate, playerCount, cache, spikeSections, a);
    }
}

// Updates one player's perf diag HUD text widgets.
function perfDiagUpdateHudForPid(
    pid: number, tickRate: number, playerCount: number,
    cache: { avgBuilt: number; avgRebuilt: number; maxRebuilt: number; avgCold: number; avgInvalid: number; maxInvalid: number },
    spikeSections: number[], a: typeof State.admin
): void {
    const header = safeFind(UI_PERF_DIAG_HEADER_ID + pid);
    if (!header) return;

    // Header: current tick rate, worst tick rate since enable, player count.
    safeSetUITextLabel(header, mod.Message(mod.stringkeys.twl.debug.perfHeader, tickRate, a.perfDiagMinTickRate, playerCount));
    // Color-code header by current tick rate: green >= 7, yellow 5-6, red < 5.
    if (tickRate >= PERF_DIAG_HEALTHY_TICK_RATE) {
        safeSetUITextColor(header, COLOR_GREEN);
    } else if (tickRate >= PERF_DIAG_STRESSED_TICK_RATE) {
        safeSetUITextColor(header, COLOR_WARNING_YELLOW);
    } else {
        safeSetUITextColor(header, COLOR_NOT_READY_RED);
    }

    // Cache lines (always visible, slots 0-1): avg per player and max outlier.
    const cacheBuiltW = safeFind(UI_PERF_DIAG_SECTION_ID + pid + "_0");
    if (cacheBuiltW) {
        safeSetUITextLabel(cacheBuiltW, mod.Message(mod.stringkeys.twl.hud.uiCacheBuiltRebuiltFormat, cache.avgBuilt, cache.avgRebuilt, cache.maxRebuilt));
        safeSetUITextColor(cacheBuiltW, cache.maxRebuilt > 0 ? COLOR_WARNING_YELLOW : COLOR_GREEN);
    }
    const cacheColdW = safeFind(UI_PERF_DIAG_SECTION_ID + pid + "_1");
    if (cacheColdW) {
        safeSetUITextLabel(cacheColdW, mod.Message(mod.stringkeys.twl.hud.uiCacheColdInvalidFormat, cache.avgCold, cache.avgInvalid, cache.maxInvalid));
        safeSetUITextColor(cacheColdW, cache.maxInvalid > 0 ? COLOR_WARNING_YELLOW : COLOR_GREEN);
    }

    // Section spike lines (conditional, slots 2-3).
    const visibleSpikes = Math.min(spikeSections.length, PERF_DIAG_MAX_SPIKE_LINES);
    for (let slot = 0; slot < PERF_DIAG_MAX_SPIKE_LINES; slot++) {
        const w = safeFind(UI_PERF_DIAG_SECTION_ID + pid + "_" + (slot + PERF_DIAG_CACHE_LINES));
        if (!w) continue;
        if (slot < visibleSpikes) {
            const sId = spikeSections[slot];
            const maxMs = Math.round((a.perfDiagSectionMax[sId] ?? 0) * 1000);
            safeSetUITextLabel(w, mod.Message(mod.stringkeys.twl.debug.perfSection, sId, maxMs, a.perfDiagSectionHits[sId] ?? 0));
            safeSetUIWidgetVisible(w, true);
        } else {
            safeSetUIWidgetVisible(w, false);
        }
    }

    // Resize container: base (header + 2 cache lines) + visible spike lines.
    const container = safeFind(UI_PERF_DIAG_CONTAINER_ID + pid);
    if (container) {
        const panelHeight = PERF_DIAG_PANEL_BASE_HEIGHT + (visibleSpikes * PERF_DIAG_LINE_HEIGHT);
        safeSetUIWidgetSize(container, mod.CreateVector(PERF_DIAG_PANEL_WIDTH, panelHeight, 0));
    }
}

// Resets per-window counters for the next sample period. Does NOT reset perfDiagMinTickRate.
function perfDiagResetWindow(now: number): void {
    const a = State.admin;
    a.perfDiagTickCount = 0;
    a.perfDiagWindowStart = now;
    a.perfDiagSpikeTotal = 0;
    for (let i = 0; i <= PERF_DIAG_SECTION_COUNT; i++) {
        a.perfDiagSectionMax[i] = 0;
        a.perfDiagSectionHits[i] = 0;
    }
}

// Builds the perf diag HUD panel for one player. Positioned below the position debug panel (TopRight).
function buildPerfDiagWidgetsForPlayer(player: mod.Player): void {
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return;

    deletePerfDiagWidgetsForPid(pid);

    mod.AddUIContainer(
        UI_PERF_DIAG_CONTAINER_ID + pid,
        mod.CreateVector(PERF_DIAG_PANEL_X, PERF_DIAG_PANEL_Y, 0),
        mod.CreateVector(PERF_DIAG_PANEL_WIDTH, PERF_DIAG_PANEL_BASE_HEIGHT, 0),
        mod.UIAnchor.TopRight,
        mod.GetUIRoot(),
        false,
        0,
        COLOR_DARK_BLACK,
        0.9,
        mod.UIBgFill.Solid,
        mod.UIDepth.AboveGameUI,
        player
    );
    const container = safeFind(UI_PERF_DIAG_CONTAINER_ID + pid);
    if (!container) return;
    safeSetUIWidgetVisible(container, true);

    // Header text widget.
    const headerWidget = safeParseUI({
        name: UI_PERF_DIAG_HEADER_ID + pid,
        type: "Text",
        playerId: player,
        position: [4, 0],
        size: [PERF_DIAG_PANEL_WIDTH - 8, PERF_DIAG_HEADER_HEIGHT],
        anchor: mod.UIAnchor.TopLeft,
        visible: true,
        padding: 0,
        bgAlpha: 0,
        bgFill: mod.UIBgFill.None,
        textLabel: mod.Message(mod.stringkeys.twl.debug.perfHeader, 8, 8, 1),
        textColor: [1, 1, 1],
        textAlpha: 1,
        textSize: 10,
        textAnchor: mod.UIAnchor.CenterLeft,
    });
    if (headerWidget) {
        mod.SetUIWidgetParent(headerWidget, container);
        mod.SetUIWidgetDepth(headerWidget, mod.UIDepth.AboveGameUI);
    }

    // Line widgets: slots 0-1 are always-visible cache lines, slots 2-3 are conditional spike lines.
    for (let slot = 0; slot < PERF_DIAG_TOTAL_LINES; slot++) {
        const isCacheLine = slot < PERF_DIAG_CACHE_LINES;
        const sectionWidget = safeParseUI({
            name: UI_PERF_DIAG_SECTION_ID + pid + "_" + slot,
            type: "Text",
            playerId: player,
            position: [4, PERF_DIAG_HEADER_HEIGHT + (slot * PERF_DIAG_LINE_HEIGHT)],
            size: [PERF_DIAG_PANEL_WIDTH - 8, PERF_DIAG_LINE_HEIGHT],
            anchor: mod.UIAnchor.TopLeft,
            visible: isCacheLine,
            padding: 0,
            bgAlpha: 0,
            bgFill: mod.UIBgFill.None,
            textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, " "),
            textColor: isCacheLine ? [0.6784, 0.9922, 0.5255] : [1, 0.7, 0.3],
            textAlpha: 1,
            textSize: 9,
            textAnchor: mod.UIAnchor.CenterLeft,
        });
        if (sectionWidget) {
            mod.SetUIWidgetParent(sectionWidget, container);
            mod.SetUIWidgetDepth(sectionWidget, mod.UIDepth.AboveGameUI);
        }
    }
}

// Removes all perf diag widgets for one player.
function deletePerfDiagWidgetsForPid(pid: number): void {
    for (let slot = PERF_DIAG_TOTAL_LINES - 1; slot >= 0; slot--) {
        const sw = safeFind(UI_PERF_DIAG_SECTION_ID + pid + "_" + slot);
        if (sw) { try { mod.DeleteUIWidget(sw); } catch {} }
    }
    const hw = safeFind(UI_PERF_DIAG_HEADER_ID + pid);
    if (hw) { try { mod.DeleteUIWidget(hw); } catch {} }
    const cw = safeFind(UI_PERF_DIAG_CONTAINER_ID + pid);
    if (cw) { try { mod.DeleteUIWidget(cw); } catch {} }
}

// Toggles the diagnostic system on/off. Builds or destroys HUD widgets for all connected players.
function setPerfDiagEnabled(enabled: boolean): void {
    State.admin.perfDiagEnabled = enabled;
    if (enabled) {
        State.admin.perfDiagWindowStart = -1;
        State.admin.perfDiagTickCount = 0;
        State.admin.perfDiagLastEmitAt = -1;
        State.admin.perfDiagSpikeTotal = 0;
        State.admin.perfDiagMinTickRate = 999;
        State.admin.perfDiagSectionMax = [];
        State.admin.perfDiagSectionHits = [];
    }
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        if (enabled) {
            buildPerfDiagWidgetsForPlayer(p);
        } else {
            const pid = safeGetPlayerId(p);
            if (pid !== undefined) deletePerfDiagWidgetsForPid(pid);
        }
    }
}

// Called during player join to build perf diag widgets if the system is currently enabled.
function ensurePerfDiagWidgetsForPlayer(player: mod.Player): void {
    if (!State.admin.perfDiagEnabled) return;
    buildPerfDiagWidgetsForPlayer(player);
}

// Called during player leave to clean up perf diag widgets.
function cleanupPerfDiagWidgetsForPid(pid: number): void {
    deletePerfDiagWidgetsForPid(pid);
}
