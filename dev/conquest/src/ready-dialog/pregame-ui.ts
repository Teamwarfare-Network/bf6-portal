// @ts-nocheck
// Module: ready-dialog/pregame-ui -- countdown widgets and shared countdown UI cache helpers

//#region -------------------- Ready Dialog - Pregame Countdown UI --------------------

// Implements a synchronized pre-live N-1-GO countdown (default 5-1-GO) that starts live on GO.
interface CountdownWidgetCacheEntry {
    rootName: string;
    widget?: mod.UIWidget;
}

function ensureCountdownUIAndGetWidget(player: mod.Player): mod.UIWidget | undefined {
    if (!player || !mod.IsPlayerValid(player)) return undefined;
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

    modlib.ParseUI({
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
        textLabel: mod.Message(mod.stringkeys.twl.countdown.format, PREGAME_COUNTDOWN_START_NUMBER),
        textColor: [1, 1, 1],
        textAlpha: PREGAME_ALERT_TEXT_ALPHA,
        textSize: PREGAME_COUNTDOWN_SIZE_DIGIT_START,
        textAnchor: mod.UIAnchor.Center,
    });

    const widget = safeFind(rootName);
    State.hudCache.countdownWidgetCache[pid] = { rootName, widget };
    return widget;
}

function setPregameCountdownVisualForAllPlayers(
    labelKey: number,
    labelValue: number | undefined,
    color: mod.Vector,
    size: number,
    visible: boolean
): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const w = ensureCountdownUIAndGetWidget(p);
        if (!w) continue;

        mod.SetUIWidgetVisible(w, visible);
        if (visible) {
            const message = (labelValue !== undefined)
                ? mod.Message(labelKey, labelValue)
                : mod.Message(labelKey);
            mod.SetUITextLabel(w, message);
            mod.SetUITextColor(w, color);
            mod.SetUITextSize(w, size);
        }
    }
}

function setPregameCountdownSizeForAllPlayers(size: number): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const w = ensureCountdownUIAndGetWidget(p);
        if (!w) continue;
        mod.SetUITextSize(w, size);
    }
}

function hidePregameCountdownForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const w = ensureCountdownUIAndGetWidget(p);
        if (!w) continue;
        mod.SetUIWidgetVisible(w, false);
    }
}

//#endregion -------------------- Ready Dialog - Pregame Countdown UI --------------------
