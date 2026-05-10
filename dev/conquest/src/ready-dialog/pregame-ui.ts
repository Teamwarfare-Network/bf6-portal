// @ts-nocheck
// Module: ready-dialog/pregame-ui -- countdown widgets and shared countdown UI cache helpers

//#region -------------------- Ready Dialog - Pregame Countdown UI --------------------

// Implements a synchronized pre-live N-1-GO countdown (default 5-1-GO) that starts live on GO.
interface CountdownWidgetCacheEntry {
    rootName: string;
    widget?: mod.UIWidget;
    delayLineNames?: string[];
    delayLineWidgets?: Array<mod.UIWidget | undefined>;
}

const PREGAME_COUNTDOWN_DELAY_LINE_KEYS: number[] = [
    mod.stringkeys.twl.countdown.delayAircraftHq,
    mod.stringkeys.twl.countdown.delayAircraftAir,
    mod.stringkeys.twl.countdown.delayForward,
    mod.stringkeys.twl.countdown.delayGadgets,
];
// Y offsets are negative (above center) and pushed far enough up that the massive countdown digit
// (size ~620) does not overlap them. Lines are stacked 40px apart.
const PREGAME_COUNTDOWN_DELAY_LINE_Y: number[] = [-420, -380, -340, -300];
const PREGAME_COUNTDOWN_DELAY_LINE_COUNT = 4;
const PREGAME_COUNTDOWN_DELAY_LINE_WIDTH = 760;
const PREGAME_COUNTDOWN_DELAY_LINE_HEIGHT = 34;
const PREGAME_COUNTDOWN_DELAY_LINE_TEXT_SIZE = 22;

function getPregameCountdownDelayValueForIndex(index: number): number {
    if (index === 0) return ACTIVE_MAP_CONFIG.roundStartAirDelay ?? 0;
    if (index === 1) return ACTIVE_MAP_CONFIG.roundStartAirDeployDelay ?? 0;
    if (index === 2) return ACTIVE_MAP_CONFIG.roundStartForwardDeployDelay ?? 0;
    if (index === 3) return ACTIVE_MAP_CONFIG.roundStartGadgetDelay ?? 0;
    return 0;
}

// Ensures per-player countdown text exists and returns a cached widget handle.
function ensureCountdownUIAndGetWidget(player: mod.Player): mod.UIWidget | undefined {
    if (!isValidPlayer(player)) return undefined;
    const pid = mod.GetObjId(player);
    const rootName = "PregameCountdownText_" + pid;

    const cached = State.hudCache.countdownWidgetCache[pid];
    if (cached) {
        if (cached.widget) return cached.widget;

        const found = safeFind(cached.rootName);
        if (found) {
            cached.widget = found;
            return found;
        }
    }

    safeParseUI({
        name: rootName,
        type: "Text",
        playerId: player,
        position: [0, 0],
        size: [320, 140],
        anchor: mod.UIAnchor.Center,
        visible: false,
        padding: 0,
        bgColor: [0, 0, 0],
        bgAlpha: 0,
        bgFill: mod.UIBgFill.Solid,
        textLabel: msg(mod.stringkeys.twl.countdown.format, PREGAME_COUNTDOWN_START_NUMBER),
        textColor: [1, 1, 1],
        textAlpha: PREGAME_ALERT_TEXT_ALPHA,
        textSize: PREGAME_COUNTDOWN_SIZE_DIGIT_START,
        textAnchor: mod.UIAnchor.Center,
    });

    const widget = safeFind(rootName);
    if (widget) {
        try { mod.SetUIWidgetDepth(widget, mod.UIDepth.AboveGameUI); } catch {}
    }
    // Preserve any existing delay-line references on the entry so they aren't lost and then
    // fail to hide when the LIVE! text is removed.
    const existing = State.hudCache.countdownWidgetCache[pid];
    if (existing) {
        existing.rootName = rootName;
        existing.widget = widget;
    } else {
        State.hudCache.countdownWidgetCache[pid] = { rootName, widget };
    }
    return widget;
}

// Applies pregame countdown label/color/size/visibility to every active player.
function setPregameCountdownVisualForAllPlayers(
    labelKey: number,
    labelValue: number | undefined,
    color: mod.Vector,
    size: number,
    visible: boolean
): void {
    forEachValidPlayer((player) => {
        const w = ensureCountdownUIAndGetWidget(player);
        if (!w) return;

        mod.SetUIWidgetVisible(w, visible);
        if (visible) {
            const message = (labelValue !== undefined)
                ? msg(labelKey, labelValue)
                : msg(labelKey);
            safeSetUITextLabel(w, message);
            mod.SetUITextColor(w, color);
            mod.SetUITextSize(w, size);
        }
    });
}

// Updates pregame countdown text size for all active players.
function setPregameCountdownSizeForAllPlayers(size: number): void {
    forEachValidPlayer((player) => {
        const w = ensureCountdownUIAndGetWidget(player);
        if (!w) return;
        mod.SetUITextSize(w, size);
    });
}

// Invalidates cached countdown widget handles so fresh widgets are created on the next show.
function invalidateCountdownWidgetCacheForAllPlayers(): void {
    State.hudCache.countdownWidgetCache = {};
}

// Ensures per-player delay info lines exist above the countdown and returns their widget handles.
function ensurePregameCountdownDelayLineWidgetsForPlayer(player: mod.Player): Array<mod.UIWidget | undefined> {
    if (!isValidPlayer(player)) return [];
    const pid = mod.GetObjId(player);
    let entry = State.hudCache.countdownWidgetCache[pid];
    if (!entry) {
        entry = { rootName: "PregameCountdownText_" + pid };
        State.hudCache.countdownWidgetCache[pid] = entry;
    }
    if (!entry.delayLineNames) {
        entry.delayLineNames = [];
        for (let i = 0; i < PREGAME_COUNTDOWN_DELAY_LINE_COUNT; i++) {
            entry.delayLineNames.push("PregameCountdownDelay" + i + "_" + pid);
        }
    }
    if (!entry.delayLineWidgets) {
        entry.delayLineWidgets = [];
        for (let i = 0; i < PREGAME_COUNTDOWN_DELAY_LINE_COUNT; i++) entry.delayLineWidgets.push(undefined);
    }

    for (let i = 0; i < PREGAME_COUNTDOWN_DELAY_LINE_COUNT; i++) {
        if (entry.delayLineWidgets[i]) continue;
        const found = safeFind(entry.delayLineNames[i]);
        if (found) { entry.delayLineWidgets[i] = found; continue; }
        safeParseUI({
            name: entry.delayLineNames[i],
            type: "Text",
            playerId: player,
            position: [0, PREGAME_COUNTDOWN_DELAY_LINE_Y[i]],
            size: [PREGAME_COUNTDOWN_DELAY_LINE_WIDTH, PREGAME_COUNTDOWN_DELAY_LINE_HEIGHT],
            anchor: mod.UIAnchor.Center,
            visible: false,
            padding: 0,
            bgColor: [0, 0, 0],
            bgAlpha: 0,
            bgFill: mod.UIBgFill.Solid,
            textLabel: msg(PREGAME_COUNTDOWN_DELAY_LINE_KEYS[i], 0),
            textColor: [1, 1, 1],
            textAlpha: PREGAME_ALERT_TEXT_ALPHA,
            textSize: PREGAME_COUNTDOWN_DELAY_LINE_TEXT_SIZE,
            textAnchor: mod.UIAnchor.Center,
        });
        const widget = safeFind(entry.delayLineNames[i]);
        if (widget) {
            try { mod.SetUIWidgetDepth(widget, mod.UIDepth.AboveGameUI); } catch {}
            entry.delayLineWidgets[i] = widget;
        }
    }
    return entry.delayLineWidgets;
}

// Shows a single delay-info line (by index 0..2) above the countdown, populated from ACTIVE_MAP_CONFIG.
// A line with a 0 delay stays hidden so zero-delay maps remain visually identical to v1.207.
function showPregameCountdownDelayLineForAllPlayers(idx: number): void {
    if (idx < 0 || idx >= PREGAME_COUNTDOWN_DELAY_LINE_COUNT) return;
    forEachValidPlayer((player) => {
        const widgets = ensurePregameCountdownDelayLineWidgetsForPlayer(player);
        const w = widgets[idx];
        if (!w) return;
        const seconds = getPregameCountdownDelayValueForIndex(idx);
        if (seconds <= 0) {
            mod.SetUIWidgetVisible(w, false);
            return;
        }
        safeSetUITextLabel(w, msg(PREGAME_COUNTDOWN_DELAY_LINE_KEYS[idx], seconds));
        mod.SetUIWidgetVisible(w, true);
    });
}

// Hides the pregame countdown widget (and its delay info lines) for all active players.
function hidePregameCountdownForAllPlayers(): void {
    forEachValidPlayer((player, pid) => {
        const w = ensureCountdownUIAndGetWidget(player);
        if (w) mod.SetUIWidgetVisible(w, false);
        const entry = State.hudCache.countdownWidgetCache[pid];
        if (entry && entry.delayLineWidgets) {
            for (let idx = 0; idx < entry.delayLineWidgets.length; idx++) {
                const lw = entry.delayLineWidgets[idx];
                if (lw) mod.SetUIWidgetVisible(lw, false);
            }
        }
    });
}

//#endregion -------------------- Ready Dialog - Pregame Countdown UI --------------------


