// @ts-nocheck
// Module: clock/timer-instance -- reusable MM:SS timer widget helpers for clock-adjacent UI

type ReusableTimerUiConfig = {
    anchor: mod.UIAnchor;
    positionX: number;
    positionY: number;
    width: number;
    height: number;
    plateWidth: number;
    plateHeight: number;
    plateOffsetY: number;
    plateAlpha: number;
    plateColor: mod.Vector;
    fontSize: number;
    textOffsetY: number;
    textShadowOffsetX: number;
    textShadowOffsetY: number;
    textShadowAlpha: number;
    digitLayoutWidth: number;
    digitInnerOffsetMult: number;
    digitOuterOffsetMult: number;
    colonOffsetX: number;
    colonOffsetY?: number;
    minuteDigitOffsetX?: number;
    secondDigitOffsetX?: number;
};

function deleteAllReusableTimerWidgetsByName(name: string, maxPasses: number = 64): void {
    for (let i = 0; i < maxPasses; i++) {
        const widget = safeFind(name);
        if (!widget) return;
        try {
            mod.DeleteUIWidget(widget);
        } catch {
            return;
        }
    }
}

function purgeReusableTimerInstance(baseName: string, pid: number): void {
    deleteAllReusableTimerWidgetsByName(`${baseName}Root_${pid}`);
    deleteAllReusableTimerWidgetsByName(`${baseName}Surface_${pid}`);
    deleteAllReusableTimerWidgetsByName(`${baseName}Status_${pid}`);
    deleteAllReusableTimerWidgetsByName(`${baseName}StatusShadow_${pid}`);
    deleteAllReusableTimerWidgetsByName(`${baseName}MinTens_${pid}`);
    deleteAllReusableTimerWidgetsByName(`${baseName}MinTensShadow_${pid}`);
    deleteAllReusableTimerWidgetsByName(`${baseName}MinOnes_${pid}`);
    deleteAllReusableTimerWidgetsByName(`${baseName}MinOnesShadow_${pid}`);
    deleteAllReusableTimerWidgetsByName(`${baseName}Colon_${pid}`);
    deleteAllReusableTimerWidgetsByName(`${baseName}ColonShadow_${pid}`);
    deleteAllReusableTimerWidgetsByName(`${baseName}SecTens_${pid}`);
    deleteAllReusableTimerWidgetsByName(`${baseName}SecTensShadow_${pid}`);
    deleteAllReusableTimerWidgetsByName(`${baseName}SecOnes_${pid}`);
    deleteAllReusableTimerWidgetsByName(`${baseName}SecOnesShadow_${pid}`);
}

function buildReusableTimerDigit(name: string, x: number, width: number, cfg: ReusableTimerUiConfig) {
    return {
        name,
        type: "Text",
        anchor: mod.UIAnchor.Center,
        position: [x, cfg.textOffsetY],
        size: [width, cfg.height],
        visible: true,
        bgAlpha: 0,
        textLabel: msg(STR_HUD_CLOCK_DIGIT, 0),
        textSize: cfg.fontSize,
        textAnchor: mod.UIAnchor.Center,
    };
}

function buildReusableTimerDigitShadow(name: string, x: number, width: number, cfg: ReusableTimerUiConfig) {
    return {
        name,
        type: "Text",
        anchor: mod.UIAnchor.Center,
        position: [x + cfg.textShadowOffsetX, cfg.textOffsetY + cfg.textShadowOffsetY],
        size: [width, cfg.height],
        visible: true,
        bgAlpha: 0,
        textLabel: msg(STR_HUD_CLOCK_DIGIT, 0),
        textColor: [0, 0, 0],
        textAlpha: cfg.textShadowAlpha,
        textSize: cfg.fontSize,
        textAnchor: mod.UIAnchor.Center,
    };
}

function buildReusableTimerColon(name: string, x: number, width: number, cfg: ReusableTimerUiConfig) {
    return {
        name,
        type: "Text",
        anchor: mod.UIAnchor.Center,
        position: [x, cfg.textOffsetY + (cfg.colonOffsetY ?? 0)],
        size: [width, cfg.height],
        visible: true,
        bgAlpha: 0,
        textLabel: msg(mod.stringkeys.twl.hud.clock.colon),
        textSize: cfg.fontSize,
        textAnchor: mod.UIAnchor.Center,
    };
}

function buildReusableTimerColonShadow(name: string, x: number, width: number, cfg: ReusableTimerUiConfig) {
    return {
        name,
        type: "Text",
        anchor: mod.UIAnchor.Center,
        position: [
            x + cfg.textShadowOffsetX,
            cfg.textOffsetY + (cfg.colonOffsetY ?? 0) + cfg.textShadowOffsetY
        ],
        size: [width, cfg.height],
        visible: true,
        bgAlpha: 0,
        textLabel: msg(mod.stringkeys.twl.hud.clock.colon),
        textColor: [0, 0, 0],
        textAlpha: cfg.textShadowAlpha,
        textSize: cfg.fontSize,
        textAnchor: mod.UIAnchor.Center,
    };
}

function buildReusableTimerStatus(name: string, cfg: ReusableTimerUiConfig) {
    return {
        name,
        type: "Text",
        anchor: mod.UIAnchor.Center,
        position: [0, cfg.textOffsetY],
        size: [cfg.width, cfg.height],
        visible: false,
        bgAlpha: 0,
        textLabel: msg(mod.stringkeys.twl.ui.ready),
        textSize: cfg.fontSize - 1,
        textAnchor: mod.UIAnchor.Center,
    };
}

function buildReusableTimerStatusShadow(name: string, cfg: ReusableTimerUiConfig) {
    return {
        name,
        type: "Text",
        anchor: mod.UIAnchor.Center,
        position: [cfg.textShadowOffsetX, cfg.textOffsetY + cfg.textShadowOffsetY],
        size: [cfg.width, cfg.height],
        visible: false,
        bgAlpha: 0,
        textLabel: msg(mod.stringkeys.twl.ui.ready),
        textColor: [0, 0, 0],
        textAlpha: cfg.textShadowAlpha,
        textSize: cfg.fontSize - 1,
        textAnchor: mod.UIAnchor.Center,
    };
}

function normalizeReusableTimerInstance(
    cache: ReusableTimerWidgetCacheEntry,
    parent: mod.UIWidget,
    cfg: ReusableTimerUiConfig
): void {
    if (!cache.root || !cache.plate) return;
    try {
        mod.SetUIWidgetParent(cache.root, parent);
        mod.SetUIWidgetAnchor(cache.root, cfg.anchor);
        mod.SetUIWidgetPosition(cache.root, mod.CreateVector(cfg.positionX, cfg.positionY, 0));
        mod.SetUIWidgetSize(cache.root, mod.CreateVector(cfg.width, cfg.height, 0));
        mod.SetUIWidgetBgFill(cache.root, mod.UIBgFill.None);
        mod.SetUIWidgetBgAlpha(cache.root, 0);
        mod.SetUIWidgetDepth(cache.root, mod.UIDepth.AboveGameUI);

        mod.SetUIWidgetParent(cache.plate, parent);
        mod.SetUIWidgetAnchor(cache.plate, cfg.anchor);
        mod.SetUIWidgetPosition(cache.plate, mod.CreateVector(cfg.positionX, cfg.positionY + cfg.plateOffsetY, 0));
        mod.SetUIWidgetSize(cache.plate, mod.CreateVector(cfg.plateWidth, cfg.plateHeight, 0));
        mod.SetUIWidgetBgFill(cache.plate, mod.UIBgFill.Blur);
        mod.SetUIWidgetBgColor(cache.plate, cfg.plateColor);
        mod.SetUIWidgetBgAlpha(cache.plate, cfg.plateAlpha);
        mod.SetUIWidgetDepth(cache.plate, mod.UIDepth.AboveGameUI);
    } catch {
        return;
    }
}

function ensureReusableTimerInstance(
    player: mod.Player,
    baseName: string,
    parent: mod.UIWidget,
    cfg: ReusableTimerUiConfig,
    existing?: ReusableTimerWidgetCacheEntry
): ReusableTimerWidgetCacheEntry | undefined {
    if (!isValidPlayer(player)) return undefined;
    const pid = mod.GetObjId(player);
    const rootName = `${baseName}Root_${pid}`;
    const surfaceName = `${baseName}Surface_${pid}`;
    const digitWidth = cfg.digitLayoutWidth * 0.22;
    const colonWidth = cfg.digitLayoutWidth * 0.08;
    const glyphGap = 2;
    const innerDigitCenterOffset = (colonWidth * 0.5) + glyphGap + (digitWidth * 0.5);
    const outerDigitCenterOffset = innerDigitCenterOffset + digitWidth + glyphGap;
    const glyphCenterOffset = cfg.colonOffsetX;
    const minuteDigitOffsetX = cfg.minuteDigitOffsetX ?? 0;
    const secondDigitOffsetX = cfg.secondDigitOffsetX ?? 0;
    const xOffsets = {
        minTens: glyphCenterOffset - outerDigitCenterOffset + minuteDigitOffsetX,
        minOnes: glyphCenterOffset - innerDigitCenterOffset + minuteDigitOffsetX,
        colon: glyphCenterOffset,
        secTens: glyphCenterOffset + innerDigitCenterOffset + secondDigitOffsetX,
        secOnes: glyphCenterOffset + outerDigitCenterOffset + secondDigitOffsetX,
    };

    const cached = existing;
    if (cached) {
        cached.root = safeFind(rootName) as mod.UIWidget;
        cached.plate = safeFind(surfaceName) as mod.UIWidget;
        cached.statusShadow = safeFind(`${baseName}StatusShadow_${pid}`) as mod.UIWidget | undefined;
        cached.statusText = safeFind(`${baseName}Status_${pid}`) as mod.UIWidget | undefined;
        cached.minTensShadow = safeFind(`${baseName}MinTensShadow_${pid}`) as mod.UIWidget | undefined;
        cached.minTens = safeFind(`${baseName}MinTens_${pid}`) as mod.UIWidget;
        cached.minOnesShadow = safeFind(`${baseName}MinOnesShadow_${pid}`) as mod.UIWidget | undefined;
        cached.minOnes = safeFind(`${baseName}MinOnes_${pid}`) as mod.UIWidget;
        cached.colonShadow = safeFind(`${baseName}ColonShadow_${pid}`) as mod.UIWidget | undefined;
        cached.colon = safeFind(`${baseName}Colon_${pid}`) as mod.UIWidget;
        cached.secTensShadow = safeFind(`${baseName}SecTensShadow_${pid}`) as mod.UIWidget | undefined;
        cached.secTens = safeFind(`${baseName}SecTens_${pid}`) as mod.UIWidget;
        cached.secOnesShadow = safeFind(`${baseName}SecOnesShadow_${pid}`) as mod.UIWidget | undefined;
        cached.secOnes = safeFind(`${baseName}SecOnes_${pid}`) as mod.UIWidget;
        if (
            cached.root && cached.plate && cached.minTens && cached.minOnes && cached.colon && cached.secTens && cached.secOnes
        ) {
            normalizeReusableTimerInstance(cached, parent, cfg);
            return cached;
        }
    }

    purgeReusableTimerInstance(baseName, pid);

    safeParseUI({
        name: rootName,
        type: "Container",
        playerId: player,
        anchor: cfg.anchor,
        position: [cfg.positionX, cfg.positionY],
        size: [cfg.width, cfg.height],
        visible: true,
        bgAlpha: 0,
        bgFill: mod.UIBgFill.None,
        children: [
            buildReusableTimerDigitShadow(`${baseName}MinTensShadow_${pid}`, xOffsets.minTens, digitWidth, cfg),
            buildReusableTimerDigit(`${baseName}MinTens_${pid}`, xOffsets.minTens, digitWidth, cfg),
            buildReusableTimerDigitShadow(`${baseName}MinOnesShadow_${pid}`, xOffsets.minOnes, digitWidth, cfg),
            buildReusableTimerDigit(`${baseName}MinOnes_${pid}`, xOffsets.minOnes, digitWidth, cfg),
            buildReusableTimerColonShadow(`${baseName}ColonShadow_${pid}`, xOffsets.colon, colonWidth, cfg),
            buildReusableTimerColon(`${baseName}Colon_${pid}`, xOffsets.colon, colonWidth, cfg),
            buildReusableTimerDigitShadow(`${baseName}SecTensShadow_${pid}`, xOffsets.secTens, digitWidth, cfg),
            buildReusableTimerDigit(`${baseName}SecTens_${pid}`, xOffsets.secTens, digitWidth, cfg),
            buildReusableTimerDigitShadow(`${baseName}SecOnesShadow_${pid}`, xOffsets.secOnes, digitWidth, cfg),
            buildReusableTimerDigit(`${baseName}SecOnes_${pid}`, xOffsets.secOnes, digitWidth, cfg),
            buildReusableTimerStatusShadow(`${baseName}StatusShadow_${pid}`, cfg),
            buildReusableTimerStatus(`${baseName}Status_${pid}`, cfg),
        ],
    });

    safeParseUI({
        name: surfaceName,
        type: "Container",
        playerId: player,
        anchor: cfg.anchor,
        position: [cfg.positionX, cfg.positionY + cfg.plateOffsetY],
        size: [cfg.plateWidth, cfg.plateHeight],
        visible: true,
        bgColor: [
            mod.XComponentOf(cfg.plateColor),
            mod.YComponentOf(cfg.plateColor),
            mod.ZComponentOf(cfg.plateColor),
        ],
        bgAlpha: cfg.plateAlpha,
        bgFill: mod.UIBgFill.Blur,
    });

    const created: ReusableTimerWidgetCacheEntry = {
        rootName,
        surfaceName,
        root: safeFind(rootName) as mod.UIWidget,
        plate: safeFind(surfaceName) as mod.UIWidget,
        statusShadow: safeFind(`${baseName}StatusShadow_${pid}`) as mod.UIWidget | undefined,
        statusText: safeFind(`${baseName}Status_${pid}`) as mod.UIWidget | undefined,
        minTensShadow: safeFind(`${baseName}MinTensShadow_${pid}`) as mod.UIWidget | undefined,
        minTens: safeFind(`${baseName}MinTens_${pid}`) as mod.UIWidget,
        minOnesShadow: safeFind(`${baseName}MinOnesShadow_${pid}`) as mod.UIWidget | undefined,
        minOnes: safeFind(`${baseName}MinOnes_${pid}`) as mod.UIWidget,
        colonShadow: safeFind(`${baseName}ColonShadow_${pid}`) as mod.UIWidget | undefined,
        colon: safeFind(`${baseName}Colon_${pid}`) as mod.UIWidget,
        secTensShadow: safeFind(`${baseName}SecTensShadow_${pid}`) as mod.UIWidget | undefined,
        secTens: safeFind(`${baseName}SecTens_${pid}`) as mod.UIWidget,
        secOnesShadow: safeFind(`${baseName}SecOnesShadow_${pid}`) as mod.UIWidget | undefined,
        secOnes: safeFind(`${baseName}SecOnes_${pid}`) as mod.UIWidget,
        lastDisplayedSeconds: undefined,
        lastVisibleState: true,
        lastStatusMode: "timer",
    };
    if (!created.root || !created.plate || !created.minTens || !created.minOnes || !created.colon || !created.secTens || !created.secOnes) {
        return undefined;
    }
    normalizeReusableTimerInstance(created, parent, cfg);
    return created;
}

function setReusableTimerSeconds(cache: ReusableTimerWidgetCacheEntry, totalSeconds: number): void {
    if (cache.lastStatusMode !== "timer") {
        safeSetUIWidgetVisible(cache.statusShadow, false);
        safeSetUIWidgetVisible(cache.statusText, false);
        safeSetUIWidgetVisible(cache.minTensShadow, true);
        safeSetUIWidgetVisible(cache.minTens, true);
        safeSetUIWidgetVisible(cache.minOnesShadow, true);
        safeSetUIWidgetVisible(cache.minOnes, true);
        safeSetUIWidgetVisible(cache.colonShadow, true);
        safeSetUIWidgetVisible(cache.colon, true);
        safeSetUIWidgetVisible(cache.secTensShadow, true);
        safeSetUIWidgetVisible(cache.secTens, true);
        safeSetUIWidgetVisible(cache.secOnesShadow, true);
        safeSetUIWidgetVisible(cache.secOnes, true);
        cache.lastStatusMode = "timer";
    }
    const displaySeconds = Math.max(0, Math.floor(totalSeconds));
    if (cache.lastDisplayedSeconds === displaySeconds) return;
    const minutes = Math.floor(displaySeconds / 60);
    const seconds = displaySeconds % 60;
    const digits = {
        mT: Math.floor(minutes / 10),
        mO: minutes % 10,
        sT: Math.floor(seconds / 10),
        sO: seconds % 10,
    };
    if (cache.minTensShadow) setDigitCached(cache.minTensShadow, digits.mT);
    setDigitCached(cache.minTens, digits.mT);
    if (cache.minOnesShadow) setDigitCached(cache.minOnesShadow, digits.mO);
    setDigitCached(cache.minOnes, digits.mO);
    if (cache.colonShadow) setColonCached(cache.colonShadow);
    setColonCached(cache.colon);
    if (cache.secTensShadow) setDigitCached(cache.secTensShadow, digits.sT);
    setDigitCached(cache.secTens, digits.sT);
    if (cache.secOnesShadow) setDigitCached(cache.secOnesShadow, digits.sO);
    setDigitCached(cache.secOnes, digits.sO);
    cache.lastDisplayedSeconds = displaySeconds;
}

function setReusableTimerStatus(
    cache: ReusableTimerWidgetCacheEntry,
    statusMode: "ready" | "active" | "spawning" | "deploying",
    label: mod.Message,
    color: mod.Vector
): void {
    if (cache.lastStatusMode !== statusMode) {
        safeSetUIWidgetVisible(cache.minTensShadow, false);
        safeSetUIWidgetVisible(cache.minTens, false);
        safeSetUIWidgetVisible(cache.minOnesShadow, false);
        safeSetUIWidgetVisible(cache.minOnes, false);
        safeSetUIWidgetVisible(cache.colonShadow, false);
        safeSetUIWidgetVisible(cache.colon, false);
        safeSetUIWidgetVisible(cache.secTensShadow, false);
        safeSetUIWidgetVisible(cache.secTens, false);
        safeSetUIWidgetVisible(cache.secOnesShadow, false);
        safeSetUIWidgetVisible(cache.secOnes, false);
        safeSetUIWidgetVisible(cache.statusShadow, true);
        safeSetUIWidgetVisible(cache.statusText, true);
        cache.lastStatusMode = statusMode;
    }
    safeSetUITextLabel(cache.statusShadow, label);
    safeSetUITextLabel(cache.statusText, label);
    if (cache.statusText) {
        mod.SetUITextColor(cache.statusText, color);
    }
}

function setReusableTimerColor(cache: ReusableTimerWidgetCacheEntry, color: mod.Vector): void {
    mod.SetUITextColor(cache.minTens, color);
    mod.SetUITextColor(cache.minOnes, color);
    mod.SetUITextColor(cache.colon, color);
    mod.SetUITextColor(cache.secTens, color);
    mod.SetUITextColor(cache.secOnes, color);
}

function setReusableTimerVisible(cache: ReusableTimerWidgetCacheEntry, visible: boolean): void {
    if (!visible && cache.lastVisibleState === false) return;
    const showDigits = visible && cache.lastStatusMode === "timer";
    safeSetUIWidgetVisible(cache.root, visible);
    safeSetUIWidgetVisible(cache.plate, visible);
    safeSetUIWidgetVisible(cache.statusShadow, visible && cache.lastStatusMode !== "timer");
    safeSetUIWidgetVisible(cache.statusText, visible && cache.lastStatusMode !== "timer");
    safeSetUIWidgetVisible(cache.minTensShadow, showDigits);
    safeSetUIWidgetVisible(cache.minTens, showDigits);
    safeSetUIWidgetVisible(cache.minOnesShadow, showDigits);
    safeSetUIWidgetVisible(cache.minOnes, showDigits);
    safeSetUIWidgetVisible(cache.colonShadow, showDigits);
    safeSetUIWidgetVisible(cache.colon, showDigits);
    safeSetUIWidgetVisible(cache.secTensShadow, showDigits);
    safeSetUIWidgetVisible(cache.secTens, showDigits);
    safeSetUIWidgetVisible(cache.secOnesShadow, showDigits);
    safeSetUIWidgetVisible(cache.secOnes, showDigits);
    cache.lastVisibleState = visible;
}


