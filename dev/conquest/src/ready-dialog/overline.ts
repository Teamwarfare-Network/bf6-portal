// @ts-nocheck
// Module: ready-dialog/overline -- big title/subtitle overline message widgets and rendering

//#region -------------------- Ready Dialog - OverLine UI Widgets + Big Messages --------------------

function ensureOverLineTitleShadowUIAndGetWidget(player: mod.Player): mod.UIWidget | undefined {
    if (!player || !mod.IsPlayerValid(player)) return undefined;
    const pid = mod.GetObjId(player);
    const rootName = BIG_TITLE_SHADOW_WIDGET_ID + pid;

    const cached = State.hudCache.overLineTitleShadowWidgetCache[pid];
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
        position: [HUD_TEXT_SHADOW_OFFSET_X, BIG_TITLE_OFFSET_Y + HUD_TEXT_SHADOW_OFFSET_Y],
        size: [BIG_TITLE_BG_WIDTH, BIG_TITLE_BG_HEIGHT],
        anchor: mod.UIAnchor.TopCenter,
        visible: false,
        padding: 0,
        bgAlpha: 0,
        bgFill: mod.UIBgFill.None,
        textLabel: mod.Message(STR_ROUND_START_TITLE),
        textColor: [0, 0, 0],
        textAlpha: PREGAME_ALERT_TEXT_ALPHA,
        textSize: BIG_TITLE_SIZE,
        textAnchor: mod.UIAnchor.Center,
    });

    const widget = safeFind(rootName);
    State.hudCache.overLineTitleShadowWidgetCache[pid] = { rootName, widget };
    return widget;
}

function ensureOverLineSubtitleShadowUIAndGetWidget(player: mod.Player): mod.UIWidget | undefined {
    if (!player || !mod.IsPlayerValid(player)) return undefined;
    const pid = mod.GetObjId(player);
    const rootName = BIG_SUBTITLE_SHADOW_WIDGET_ID + pid;

    const cached = State.hudCache.overLineSubtitleShadowWidgetCache[pid];
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
        position: [HUD_TEXT_SHADOW_OFFSET_X, BIG_SUBTITLE_OFFSET_Y + HUD_TEXT_SHADOW_OFFSET_Y],
        size: [BIG_SUBTITLE_BG_WIDTH, BIG_SUBTITLE_BG_HEIGHT],
        anchor: mod.UIAnchor.TopCenter,
        visible: false,
        padding: 0,
        bgAlpha: 0,
        bgFill: mod.UIBgFill.None,
        textLabel: mod.Message(STR_ROUND_START_SUBTITLE),
        textColor: [0, 0, 0],
        textAlpha: PREGAME_ALERT_TEXT_ALPHA,
        textSize: BIG_SUBTITLE_SIZE,
        textAnchor: mod.UIAnchor.Center,
    });

    const widget = safeFind(rootName);
    State.hudCache.overLineSubtitleShadowWidgetCache[pid] = { rootName, widget };
    return widget;
}

function ensureOverLineTitleUIAndGetWidget(player: mod.Player): mod.UIWidget | undefined {
    if (!player || !mod.IsPlayerValid(player)) return undefined;
    const pid = mod.GetObjId(player);
    const rootName = BIG_TITLE_WIDGET_ID + pid;

    const cached = State.hudCache.overLineTitleWidgetCache[pid];
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
        position: [0, BIG_TITLE_OFFSET_Y],
        size: [BIG_TITLE_BG_WIDTH, BIG_TITLE_BG_HEIGHT],
        anchor: mod.UIAnchor.TopCenter,
        visible: false,
        padding: 0,
        bgColor: COLOR_GRAY_DARK,
        bgAlpha: 0,
        bgFill: mod.UIBgFill.Blur,
        textLabel: mod.Message(STR_ROUND_START_TITLE),
        textColor: [1, 0, 0],
        textAlpha: PREGAME_ALERT_TEXT_ALPHA,
        textSize: BIG_TITLE_SIZE,
        textAnchor: mod.UIAnchor.Center,
    });

    const widget = safeFind(rootName);
    State.hudCache.overLineTitleWidgetCache[pid] = { rootName, widget };
    return widget;
}

function ensureOverLineSubtitleUIAndGetWidget(player: mod.Player): mod.UIWidget | undefined {
    if (!player || !mod.IsPlayerValid(player)) return undefined;
    const pid = mod.GetObjId(player);
    const rootName = BIG_SUBTITLE_WIDGET_ID + pid;

    const cached = State.hudCache.overLineSubtitleWidgetCache[pid];
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
        position: [0, BIG_SUBTITLE_OFFSET_Y],
        size: [BIG_SUBTITLE_BG_WIDTH, BIG_SUBTITLE_BG_HEIGHT],
        anchor: mod.UIAnchor.TopCenter,
        visible: false,
        padding: 0,
        bgColor: COLOR_GRAY_DARK,
        bgAlpha: 0,
        bgFill: mod.UIBgFill.Blur,
        textLabel: mod.Message(STR_ROUND_START_SUBTITLE),
        textColor: [1, 1, 0],
        textAlpha: PREGAME_ALERT_TEXT_ALPHA,
        textSize: BIG_SUBTITLE_SIZE,
        textAnchor: mod.UIAnchor.Center,
    });

    const widget = safeFind(rootName);
    State.hudCache.overLineSubtitleWidgetCache[pid] = { rootName, widget };
    return widget;
}

function cancelPregameCountdown(): void {
    if (!State.round.countdown.isActive) return;
    State.round.countdown.token++;
    State.round.countdown.isActive = false;
    hidePregameCountdownForAllPlayers();
}

function hideBigTitleSubtitleMessageForPlayer(pid: number): void {
    const titleShadow = safeFind(BIG_TITLE_SHADOW_WIDGET_ID + pid);
    if (titleShadow) mod.SetUIWidgetVisible(titleShadow, false);

    const title = safeFind(BIG_TITLE_WIDGET_ID + pid);
    if (title) mod.SetUIWidgetVisible(title, false);

    const subtitleShadow = safeFind(BIG_SUBTITLE_SHADOW_WIDGET_ID + pid);
    if (subtitleShadow) mod.SetUIWidgetVisible(subtitleShadow, false);

    const subtitle = safeFind(BIG_SUBTITLE_WIDGET_ID + pid);
    if (subtitle) mod.SetUIWidgetVisible(subtitle, false);
}

type BigMessagePlayerFilter = (player: mod.Player) => boolean;

function renderBigTitleSubtitleMessageForAllPlayers(
    title: mod.Message | undefined,
    subtitle: mod.Message | undefined,
    titleColor: mod.Vector,
    subtitleColor: mod.Vector,
    layout: GlobalMessageLayout,
    playerFilter?: BigMessagePlayerFilter
): void {
    const titleBgAlpha = layout.useBackground ? BIG_MESSAGE_BG_ALPHA : 0;
    const subtitleBgAlpha = (layout.subtitleUseBackground ?? layout.useBackground) ? BIG_MESSAGE_BG_ALPHA : 0;
    const titleBgHeight = layout.titleBgHeight ?? BIG_TITLE_BG_HEIGHT;
    const titleOffsetY = layout.titleOffsetY + (BIG_TITLE_BG_HEIGHT - titleBgHeight) / 2;

    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        if (playerFilter && !playerFilter(p)) {
            hideBigTitleSubtitleMessageForPlayer(getObjId(p));
            continue;
        }

        const titleShadowWidget = ensureOverLineTitleShadowUIAndGetWidget(p);
        if (titleShadowWidget) {
            if (title !== undefined) {
                mod.SetUITextLabel(titleShadowWidget, title);
                mod.SetUITextColor(titleShadowWidget, mod.CreateVector(0, 0, 0));
                mod.SetUITextSize(titleShadowWidget, layout.titleSize);
                mod.SetUIWidgetSize(titleShadowWidget, mod.CreateVector(BIG_TITLE_BG_WIDTH, titleBgHeight, 0));
                mod.SetUIWidgetPosition(
                    titleShadowWidget,
                    mod.CreateVector(HUD_TEXT_SHADOW_OFFSET_X, titleOffsetY + HUD_TEXT_SHADOW_OFFSET_Y, 0)
                );
                mod.SetUIWidgetVisible(titleShadowWidget, true);
            } else {
                mod.SetUIWidgetVisible(titleShadowWidget, false);
            }
        }

        const titleWidget = ensureOverLineTitleUIAndGetWidget(p);
        if (titleWidget) {
            if (title !== undefined) {
                mod.SetUITextLabel(titleWidget, title);
                mod.SetUITextColor(titleWidget, titleColor);
                mod.SetUITextSize(titleWidget, layout.titleSize);
                mod.SetUIWidgetSize(titleWidget, mod.CreateVector(BIG_TITLE_BG_WIDTH, titleBgHeight, 0));
                mod.SetUIWidgetPosition(titleWidget, mod.CreateVector(0, titleOffsetY, 0));
                mod.SetUIWidgetBgAlpha(titleWidget, titleBgAlpha);
                mod.SetUIWidgetVisible(titleWidget, true);
            } else {
                mod.SetUIWidgetVisible(titleWidget, false);
            }
        }

        const subtitleShadowWidget = ensureOverLineSubtitleShadowUIAndGetWidget(p);
        if (subtitleShadowWidget) {
            if (subtitle !== undefined) {
                mod.SetUITextLabel(subtitleShadowWidget, subtitle);
                mod.SetUITextColor(subtitleShadowWidget, mod.CreateVector(0, 0, 0));
                mod.SetUITextSize(subtitleShadowWidget, layout.subtitleSize);
                mod.SetUIWidgetPosition(
                    subtitleShadowWidget,
                    mod.CreateVector(HUD_TEXT_SHADOW_OFFSET_X, layout.subtitleOffsetY + HUD_TEXT_SHADOW_OFFSET_Y, 0)
                );
                mod.SetUIWidgetVisible(subtitleShadowWidget, true);
            } else {
                mod.SetUIWidgetVisible(subtitleShadowWidget, false);
            }
        }

        const subtitleWidget = ensureOverLineSubtitleUIAndGetWidget(p);
        if (subtitleWidget) {
            if (subtitle !== undefined) {
                mod.SetUITextLabel(subtitleWidget, subtitle);
                mod.SetUITextColor(subtitleWidget, subtitleColor);
                mod.SetUITextSize(subtitleWidget, layout.subtitleSize);
                mod.SetUIWidgetPosition(subtitleWidget, mod.CreateVector(0, layout.subtitleOffsetY, 0));
                mod.SetUIWidgetBgAlpha(subtitleWidget, subtitleBgAlpha);
                mod.SetUIWidgetVisible(subtitleWidget, true);
            } else {
                mod.SetUIWidgetVisible(subtitleWidget, false);
            }
        }
    }
}

function hideBigTitleSubtitleMessageForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        hideBigTitleSubtitleMessageForPlayer(mod.GetObjId(p));
    }
}

async function showGlobalTitleSubtitleMessageForAllPlayers(
    title: mod.Message | undefined,
    subtitle: mod.Message | undefined,
    titleColor: mod.Vector,
    subtitleColor: mod.Vector,
    durationSeconds: number = BIG_MESSAGE_DURATION_SECONDS,
    layout: GlobalMessageLayout = BIG_MESSAGE_LAYOUT,
    playerFilter?: BigMessagePlayerFilter
): Promise<void> {
    State.round.countdown.overLineMessageToken = (State.round.countdown.overLineMessageToken + 1) % 1000000000;
    const expectedToken = State.round.countdown.overLineMessageToken;

    renderBigTitleSubtitleMessageForAllPlayers(title, subtitle, titleColor, subtitleColor, layout, playerFilter);

    await mod.Wait(durationSeconds);
    if (expectedToken !== State.round.countdown.overLineMessageToken) return;
    hideBigTitleSubtitleMessageForAllPlayers();
}

async function showRoundStartMessageForAllPlayers(durationSeconds?: number): Promise<void> {
    await showGlobalTitleSubtitleMessageForAllPlayers(
        mod.Message(STR_ROUND_START_TITLE),
        mod.Message(STR_ROUND_START_SUBTITLE),
        COLOR_WHITE,
        COLOR_WHITE,
        durationSeconds
    );
}

//#endregion -------------------- Ready Dialog - OverLine UI Widgets + Big Messages --------------------
