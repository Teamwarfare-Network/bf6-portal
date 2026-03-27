// @ts-nocheck
// Module: boundary/prompt-ui -- cached per-player center-screen boundary warning prompt family

const BOUNDARY_PROMPT_PANEL_WIDTH = 1320;
const BOUNDARY_PROMPT_PANEL_HEIGHT = 278;
const BOUNDARY_PROMPT_PANEL_Y = -42;
const BOUNDARY_PROMPT_TITLE_1_Y = -84;
const BOUNDARY_PROMPT_TITLE_2_Y = -22;
const BOUNDARY_PROMPT_SUBTITLE_Y = 64;
const BOUNDARY_PROMPT_TITLE_SIZE = 48;
const BOUNDARY_PROMPT_SUBTITLE_SIZE = 34;
const BOUNDARY_PROMPT_TITLE_HEIGHT = 76;
const BOUNDARY_PROMPT_SUBTITLE_HEIGHT = 52;
const BOUNDARY_PROMPT_TEXT_WIDTH = BOUNDARY_PROMPT_PANEL_WIDTH - 640;
const BOUNDARY_PROMPT_ICON_SIZE = 260;
const BOUNDARY_PROMPT_LEFT_ICON_X = -486;
const BOUNDARY_PROMPT_RIGHT_ICON_X = 486;
const BOUNDARY_PROMPT_ICON_Y = -6;
const BOUNDARY_PROMPT_SHADOW_OFFSET_X = 4;
const BOUNDARY_PROMPT_SHADOW_OFFSET_Y = 4;
const BOUNDARY_PROMPT_PANEL_ALPHA = 0.92;
const BOUNDARY_PROMPT_TEXT_ALPHA = 1.0;
const BOUNDARY_PROMPT_ICON_ALPHA = 1.0;
const BOUNDARY_PROMPT_ICON_TEXT = mod.Message(STR_BOUNDARY_WARNING_ICON);

function boundaryPromptRootName(pid: number): string { return `BoundaryPromptRoot_${pid}`; }
function boundaryPromptBorderName(pid: number): string { return `BoundaryPromptBorder_${pid}`; }
function boundaryPromptTitle1Name(pid: number): string { return `BoundaryPromptTitle1_${pid}`; }
function boundaryPromptTitle1ShadowName(pid: number): string { return `BoundaryPromptTitle1Shadow_${pid}`; }
function boundaryPromptTitle2Name(pid: number): string { return `BoundaryPromptTitle2_${pid}`; }
function boundaryPromptTitle2ShadowName(pid: number): string { return `BoundaryPromptTitle2Shadow_${pid}`; }
function boundaryPromptSubtitleName(pid: number): string { return `BoundaryPromptSubtitle_${pid}`; }
function boundaryPromptSubtitleShadowName(pid: number): string { return `BoundaryPromptSubtitleShadow_${pid}`; }
function boundaryPromptLeftIconName(pid: number): string { return `BoundaryPromptLeftIcon_${pid}`; }
function boundaryPromptLeftIconShadowName(pid: number): string { return `BoundaryPromptLeftIconShadow_${pid}`; }
function boundaryPromptRightIconName(pid: number): string { return `BoundaryPromptRightIcon_${pid}`; }
function boundaryPromptRightIconShadowName(pid: number): string { return `BoundaryPromptRightIconShadow_${pid}`; }

function getBoundaryPromptTitle1Message(kind: BoundaryPromptKind): mod.Message {
    switch (kind) {
        case "prelive_main_base":
            return mod.Message(STR_BOUNDARY_PRELIVE_MAIN_BASE_TITLE_1);
        case "enemy_main_base_buffer":
            return mod.Message(STR_BOUNDARY_ENEMY_MAIN_BASE_BUFFER_TITLE_1);
        case "ground_combat_zone":
            return mod.Message(STR_BOUNDARY_GROUND_COMBAT_ZONE_TITLE_1);
        default:
            return mod.Message(STR_BOUNDARY_GROUND_COMBAT_ZONE_TITLE_1);
    }
}

function getBoundaryPromptTitle2Message(kind: BoundaryPromptKind): mod.Message {
    switch (kind) {
        case "prelive_main_base":
            return mod.Message(STR_BOUNDARY_PRELIVE_MAIN_BASE_TITLE_2);
        case "enemy_main_base_buffer":
            return mod.Message(STR_BOUNDARY_ENEMY_MAIN_BASE_BUFFER_TITLE_2);
        case "ground_combat_zone":
            return mod.Message(STR_BOUNDARY_GROUND_COMBAT_ZONE_TITLE_2);
        default:
            return mod.Message(STR_BOUNDARY_GROUND_COMBAT_ZONE_TITLE_2);
    }
}

function getBoundaryPromptSubtitleMessage(remainingSeconds: number): mod.Message {
    return mod.Message(STR_BOUNDARY_COUNTDOWN_SUBTITLE_FORMAT, Math.max(0, Math.floor(remainingSeconds)));
}

function resolveBoundaryPromptCacheRefs(cache: BoundaryPromptWidgetCacheEntry): void {
    cache.root = cache.root ?? safeFind(cache.rootName);
    cache.border = cache.border ?? safeFind(cache.borderName);
    cache.title1 = cache.title1 ?? safeFind(cache.title1Name);
    cache.title1Shadow = cache.title1Shadow ?? safeFind(cache.title1ShadowName);
    cache.title2 = cache.title2 ?? safeFind(cache.title2Name);
    cache.title2Shadow = cache.title2Shadow ?? safeFind(cache.title2ShadowName);
    cache.subtitle = cache.subtitle ?? safeFind(cache.subtitleName);
    cache.subtitleShadow = cache.subtitleShadow ?? safeFind(cache.subtitleShadowName);
    cache.leftIcon = cache.leftIcon ?? safeFind(cache.leftIconName);
    cache.leftIconShadow = cache.leftIconShadow ?? safeFind(cache.leftIconShadowName);
    cache.rightIcon = cache.rightIcon ?? safeFind(cache.rightIconName);
    cache.rightIconShadow = cache.rightIconShadow ?? safeFind(cache.rightIconShadowName);
}

function setBoundaryPromptVisible(cache: BoundaryPromptWidgetCacheEntry, visible: boolean): void {
    resolveBoundaryPromptCacheRefs(cache);
    safeSetUIWidgetVisible(cache.root, visible);
    safeSetUIWidgetVisible(cache.border, visible);
    safeSetUIWidgetVisible(cache.title1Shadow, visible);
    safeSetUIWidgetVisible(cache.title1, visible);
    safeSetUIWidgetVisible(cache.title2Shadow, visible);
    safeSetUIWidgetVisible(cache.title2, visible);
    safeSetUIWidgetVisible(cache.subtitleShadow, visible);
    safeSetUIWidgetVisible(cache.subtitle, visible);
    safeSetUIWidgetVisible(cache.leftIconShadow, visible);
    safeSetUIWidgetVisible(cache.leftIcon, visible);
    safeSetUIWidgetVisible(cache.rightIconShadow, visible);
    safeSetUIWidgetVisible(cache.rightIcon, visible);
    cache.lastVisibleState = visible;
}

function ensureBoundaryPromptUiForPlayer(player: mod.Player): BoundaryPromptWidgetCacheEntry | undefined {
    if (!player || !mod.IsPlayerValid(player)) return undefined;
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return undefined;

    const existing = State.hudCache.boundaryPromptCache[pid];
    if (existing) {
        existing.borderName = existing.borderName ?? boundaryPromptBorderName(pid);
        existing.title1Name = existing.title1Name ?? boundaryPromptTitle1Name(pid);
        existing.title1ShadowName = existing.title1ShadowName ?? boundaryPromptTitle1ShadowName(pid);
        existing.title2Name = existing.title2Name ?? boundaryPromptTitle2Name(pid);
        existing.title2ShadowName = existing.title2ShadowName ?? boundaryPromptTitle2ShadowName(pid);
        existing.leftIconName = existing.leftIconName ?? boundaryPromptLeftIconName(pid);
        existing.leftIconShadowName = existing.leftIconShadowName ?? boundaryPromptLeftIconShadowName(pid);
        existing.rightIconName = existing.rightIconName ?? boundaryPromptRightIconName(pid);
        existing.rightIconShadowName = existing.rightIconShadowName ?? boundaryPromptRightIconShadowName(pid);
        resolveBoundaryPromptCacheRefs(existing);
        if (existing.root && existing.border && existing.title1 && existing.title2 && existing.subtitle && existing.leftIcon && existing.rightIcon) {
            return existing;
        }
    }

    const cache: BoundaryPromptWidgetCacheEntry = existing ?? {
        rootName: boundaryPromptRootName(pid),
        panelName: boundaryPromptRootName(pid),
        borderName: boundaryPromptBorderName(pid),
        title1Name: boundaryPromptTitle1Name(pid),
        title1ShadowName: boundaryPromptTitle1ShadowName(pid),
        title2Name: boundaryPromptTitle2Name(pid),
        title2ShadowName: boundaryPromptTitle2ShadowName(pid),
        subtitleName: boundaryPromptSubtitleName(pid),
        subtitleShadowName: boundaryPromptSubtitleShadowName(pid),
        leftIconName: boundaryPromptLeftIconName(pid),
        leftIconShadowName: boundaryPromptLeftIconShadowName(pid),
        rightIconName: boundaryPromptRightIconName(pid),
        rightIconShadowName: boundaryPromptRightIconShadowName(pid),
    };

    safeParseUI({
        name: cache.rootName,
        type: "Container",
        playerId: player,
        position: [0, BOUNDARY_PROMPT_PANEL_Y],
        size: [BOUNDARY_PROMPT_PANEL_WIDTH, BOUNDARY_PROMPT_PANEL_HEIGHT],
        anchor: mod.UIAnchor.Center,
        visible: false,
        padding: 0,
        bgColor: [92 / 255, 16 / 255, 16 / 255],
        bgAlpha: BOUNDARY_PROMPT_PANEL_ALPHA,
        bgFill: mod.UIBgFill.Blur,
    });

    cache.root = safeFind(cache.rootName);
    const parent = cache.root ?? mod.GetUIRoot();

    if (!safeFind(cache.borderName)) {
        mod.AddUIContainer(
            cache.borderName,
            mod.CreateVector(0, 0, 0),
            mod.CreateVector(BOUNDARY_PROMPT_PANEL_WIDTH, BOUNDARY_PROMPT_PANEL_HEIGHT, 0),
            mod.UIAnchor.Center,
            parent,
            false,
            0,
            COLOR_WHITE,
            1,
            mod.UIBgFill.OutlineThin,
            mod.UIDepth.AboveGameUI,
            player
        );
    }

    if (!safeFind(cache.leftIconShadowName)) {
        mod.AddUIText(
            cache.leftIconShadowName,
            mod.CreateVector(BOUNDARY_PROMPT_LEFT_ICON_X + BOUNDARY_PROMPT_SHADOW_OFFSET_X, BOUNDARY_PROMPT_ICON_Y + BOUNDARY_PROMPT_SHADOW_OFFSET_Y, 0),
            mod.CreateVector(260, 260, 0),
            mod.UIAnchor.Center,
            parent,
            false,
            0,
            COLOR_DARK_BLACK,
            0,
            mod.UIBgFill.None,
            BOUNDARY_PROMPT_ICON_TEXT,
            BOUNDARY_PROMPT_ICON_SIZE,
            COLOR_DARK_BLACK,
            BOUNDARY_PROMPT_ICON_ALPHA,
            mod.UIAnchor.Center,
            mod.UIDepth.AboveGameUI,
            player
        );
    }
    if (!safeFind(cache.leftIconName)) {
        mod.AddUIText(
            cache.leftIconName,
            mod.CreateVector(BOUNDARY_PROMPT_LEFT_ICON_X, BOUNDARY_PROMPT_ICON_Y, 0),
            mod.CreateVector(260, 260, 0),
            mod.UIAnchor.Center,
            parent,
            false,
            0,
            COLOR_DARK_BLACK,
            0,
            mod.UIBgFill.None,
            BOUNDARY_PROMPT_ICON_TEXT,
            BOUNDARY_PROMPT_ICON_SIZE,
            COLOR_NOT_READY_RED,
            BOUNDARY_PROMPT_ICON_ALPHA,
            mod.UIAnchor.Center,
            mod.UIDepth.AboveGameUI,
            player
        );
    }
    if (!safeFind(cache.rightIconShadowName)) {
        mod.AddUIText(
            cache.rightIconShadowName,
            mod.CreateVector(BOUNDARY_PROMPT_RIGHT_ICON_X + BOUNDARY_PROMPT_SHADOW_OFFSET_X, BOUNDARY_PROMPT_ICON_Y + BOUNDARY_PROMPT_SHADOW_OFFSET_Y, 0),
            mod.CreateVector(260, 260, 0),
            mod.UIAnchor.Center,
            parent,
            false,
            0,
            COLOR_DARK_BLACK,
            0,
            mod.UIBgFill.None,
            BOUNDARY_PROMPT_ICON_TEXT,
            BOUNDARY_PROMPT_ICON_SIZE,
            COLOR_DARK_BLACK,
            BOUNDARY_PROMPT_ICON_ALPHA,
            mod.UIAnchor.Center,
            mod.UIDepth.AboveGameUI,
            player
        );
    }
    if (!safeFind(cache.rightIconName)) {
        mod.AddUIText(
            cache.rightIconName,
            mod.CreateVector(BOUNDARY_PROMPT_RIGHT_ICON_X, BOUNDARY_PROMPT_ICON_Y, 0),
            mod.CreateVector(260, 260, 0),
            mod.UIAnchor.Center,
            parent,
            false,
            0,
            COLOR_DARK_BLACK,
            0,
            mod.UIBgFill.None,
            BOUNDARY_PROMPT_ICON_TEXT,
            BOUNDARY_PROMPT_ICON_SIZE,
            COLOR_NOT_READY_RED,
            BOUNDARY_PROMPT_ICON_ALPHA,
            mod.UIAnchor.Center,
            mod.UIDepth.AboveGameUI,
            player
        );
    }

    if (!safeFind(cache.title1ShadowName)) {
        mod.AddUIText(
            cache.title1ShadowName,
            mod.CreateVector(BOUNDARY_PROMPT_SHADOW_OFFSET_X, BOUNDARY_PROMPT_TITLE_1_Y + BOUNDARY_PROMPT_SHADOW_OFFSET_Y, 0),
            mod.CreateVector(BOUNDARY_PROMPT_TEXT_WIDTH, BOUNDARY_PROMPT_TITLE_HEIGHT, 0),
            mod.UIAnchor.Center,
            parent,
            false,
            0,
            COLOR_DARK_BLACK,
            0,
            mod.UIBgFill.None,
            getBoundaryPromptTitle1Message("prelive_main_base"),
            BOUNDARY_PROMPT_TITLE_SIZE,
            COLOR_DARK_BLACK,
            BOUNDARY_PROMPT_TEXT_ALPHA,
            mod.UIAnchor.Center,
            mod.UIDepth.AboveGameUI,
            player
        );
    }
    if (!safeFind(cache.title1Name)) {
        mod.AddUIText(
            cache.title1Name,
            mod.CreateVector(0, BOUNDARY_PROMPT_TITLE_1_Y, 0),
            mod.CreateVector(BOUNDARY_PROMPT_TEXT_WIDTH, BOUNDARY_PROMPT_TITLE_HEIGHT, 0),
            mod.UIAnchor.Center,
            parent,
            false,
            0,
            COLOR_DARK_BLACK,
            0,
            mod.UIBgFill.None,
            getBoundaryPromptTitle1Message("prelive_main_base"),
            BOUNDARY_PROMPT_TITLE_SIZE,
            COLOR_WHITE,
            BOUNDARY_PROMPT_TEXT_ALPHA,
            mod.UIAnchor.Center,
            mod.UIDepth.AboveGameUI,
            player
        );
    }
    if (!safeFind(cache.title2ShadowName)) {
        mod.AddUIText(
            cache.title2ShadowName,
            mod.CreateVector(BOUNDARY_PROMPT_SHADOW_OFFSET_X, BOUNDARY_PROMPT_TITLE_2_Y + BOUNDARY_PROMPT_SHADOW_OFFSET_Y, 0),
            mod.CreateVector(BOUNDARY_PROMPT_TEXT_WIDTH, BOUNDARY_PROMPT_TITLE_HEIGHT, 0),
            mod.UIAnchor.Center,
            parent,
            false,
            0,
            COLOR_DARK_BLACK,
            0,
            mod.UIBgFill.None,
            getBoundaryPromptTitle2Message("prelive_main_base"),
            BOUNDARY_PROMPT_TITLE_SIZE,
            COLOR_DARK_BLACK,
            BOUNDARY_PROMPT_TEXT_ALPHA,
            mod.UIAnchor.Center,
            mod.UIDepth.AboveGameUI,
            player
        );
    }
    if (!safeFind(cache.title2Name)) {
        mod.AddUIText(
            cache.title2Name,
            mod.CreateVector(0, BOUNDARY_PROMPT_TITLE_2_Y, 0),
            mod.CreateVector(BOUNDARY_PROMPT_TEXT_WIDTH, BOUNDARY_PROMPT_TITLE_HEIGHT, 0),
            mod.UIAnchor.Center,
            parent,
            false,
            0,
            COLOR_DARK_BLACK,
            0,
            mod.UIBgFill.None,
            getBoundaryPromptTitle2Message("prelive_main_base"),
            BOUNDARY_PROMPT_TITLE_SIZE,
            COLOR_WHITE,
            BOUNDARY_PROMPT_TEXT_ALPHA,
            mod.UIAnchor.Center,
            mod.UIDepth.AboveGameUI,
            player
        );
    }
    if (!safeFind(cache.subtitleShadowName)) {
        mod.AddUIText(
            cache.subtitleShadowName,
            mod.CreateVector(BOUNDARY_PROMPT_SHADOW_OFFSET_X, BOUNDARY_PROMPT_SUBTITLE_Y + BOUNDARY_PROMPT_SHADOW_OFFSET_Y, 0),
            mod.CreateVector(BOUNDARY_PROMPT_TEXT_WIDTH, BOUNDARY_PROMPT_SUBTITLE_HEIGHT, 0),
            mod.UIAnchor.Center,
            parent,
            false,
            0,
            COLOR_DARK_BLACK,
            0,
            mod.UIBgFill.None,
            getBoundaryPromptSubtitleMessage(5),
            BOUNDARY_PROMPT_SUBTITLE_SIZE,
            COLOR_DARK_BLACK,
            BOUNDARY_PROMPT_TEXT_ALPHA,
            mod.UIAnchor.Center,
            mod.UIDepth.AboveGameUI,
            player
        );
    }
    if (!safeFind(cache.subtitleName)) {
        mod.AddUIText(
            cache.subtitleName,
            mod.CreateVector(0, BOUNDARY_PROMPT_SUBTITLE_Y, 0),
            mod.CreateVector(BOUNDARY_PROMPT_TEXT_WIDTH, BOUNDARY_PROMPT_SUBTITLE_HEIGHT, 0),
            mod.UIAnchor.Center,
            parent,
            false,
            0,
            COLOR_DARK_BLACK,
            0,
            mod.UIBgFill.None,
            getBoundaryPromptSubtitleMessage(5),
            BOUNDARY_PROMPT_SUBTITLE_SIZE,
            COLOR_WHITE,
            BOUNDARY_PROMPT_TEXT_ALPHA,
            mod.UIAnchor.Center,
            mod.UIDepth.AboveGameUI,
            player
        );
    }

    resolveBoundaryPromptCacheRefs(cache);
    if (cache.root) mod.SetUIWidgetDepth(cache.root, mod.UIDepth.AboveGameUI);
    setBoundaryPromptVisible(cache, false);
    State.hudCache.boundaryPromptCache[pid] = cache;
    return cache;
}

function showBoundaryPromptForPlayer(player: mod.Player, kind: BoundaryPromptKind, remainingSeconds: number): void {
    if (!player || !mod.IsPlayerValid(player)) return;
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return;
    if (!isPlayerDeployed(player) || !safeGetSoldierStateBool(player, mod.SoldierStateBool.IsAlive, false)) {
        hideBoundaryPromptForPid(pid);
        return;
    }

    const cache = ensureBoundaryPromptUiForPlayer(player);
    if (!cache) return;

    const title1 = getBoundaryPromptTitle1Message(kind);
    const title2 = getBoundaryPromptTitle2Message(kind);
    const subtitle = getBoundaryPromptSubtitleMessage(remainingSeconds);
    if (cache.lastVisibleState !== true) {
        setBoundaryPromptVisible(cache, true);
    }
    if (cache.lastKind !== kind) {
        safeSetUITextLabel(cache.title1Shadow, title1);
        safeSetUITextLabel(cache.title1, title1);
        safeSetUITextLabel(cache.title2Shadow, title2);
        safeSetUITextLabel(cache.title2, title2);
        cache.lastKind = kind;
    }
    if (cache.lastRemainingSeconds !== remainingSeconds || cache.lastVisibleState !== true) {
        safeSetUITextLabel(cache.subtitleShadow, subtitle);
        safeSetUITextLabel(cache.subtitle, subtitle);
        cache.lastRemainingSeconds = remainingSeconds;
    }
}

function hideBoundaryPromptForPid(pid: number): void {
    const cache = State.hudCache.boundaryPromptCache[pid];
    if (!cache) return;
    if (cache.lastVisibleState !== false) {
        setBoundaryPromptVisible(cache, false);
    }
    cache.lastKind = undefined;
    cache.lastRemainingSeconds = undefined;
}

function destroyBoundaryPromptUiForPid(pid: number): void {
    const cache = State.hudCache.boundaryPromptCache[pid] ?? {
        rootName: boundaryPromptRootName(pid),
        panelName: boundaryPromptRootName(pid),
        borderName: boundaryPromptBorderName(pid),
        title1Name: boundaryPromptTitle1Name(pid),
        title1ShadowName: boundaryPromptTitle1ShadowName(pid),
        title2Name: boundaryPromptTitle2Name(pid),
        title2ShadowName: boundaryPromptTitle2ShadowName(pid),
        subtitleName: boundaryPromptSubtitleName(pid),
        subtitleShadowName: boundaryPromptSubtitleShadowName(pid),
        leftIconName: boundaryPromptLeftIconName(pid),
        leftIconShadowName: boundaryPromptLeftIconShadowName(pid),
        rightIconName: boundaryPromptRightIconName(pid),
        rightIconShadowName: boundaryPromptRightIconShadowName(pid),
    };
    const names = [
        cache.borderName,
        cache.leftIconShadowName,
        cache.leftIconName,
        cache.rightIconShadowName,
        cache.rightIconName,
        cache.title1ShadowName,
        cache.title1Name,
        cache.title2ShadowName,
        cache.title2Name,
        cache.subtitleShadowName,
        cache.subtitleName,
        cache.rootName,
    ];
    for (const name of names) {
        for (let i = 0; i < 32; i++) {
            const widget = safeFind(name);
            if (!widget) break;
            try {
                mod.DeleteUIWidget(widget);
            } catch {
                break;
            }
        }
    }
    delete State.hudCache.boundaryPromptCache[pid];
}
