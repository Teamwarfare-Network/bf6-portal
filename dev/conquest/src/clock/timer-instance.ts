// @ts-nocheck
// Module: clock/timer-instance -- reusable progress-bar timer widget helpers for clock-adjacent UI
//
// Wave 5 (v1.439): the original 5-digit MM:SS clock-style display was replaced with a
// decile-chunk progress bar (per Wave 5 plan L8 + L11 + L13 + L14). Bar fills 0% -> 100%
// in 10 visible steps (one per 10% elapsed) regardless of total cooldown duration.
// READY/ACTIVE/SPAWNING/DEPLOYING status modes are unchanged -- they still toggle the
// statusText + statusShadow widgets via setReusableTimerStatus. The bar only renders
// during the "timer" mode.

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

// Bar geometry — border overlays the plate exactly (same coords + size); fill insets
// 1px inside the border. Uses TopLeft anchors with explicit pixel positions.
//
// The plate sibling sits at (cfg.positionX, cfg.positionY + cfg.plateOffsetY) with
// size cfg.plateWidth × cfg.plateHeight in the parent of the root container. The bar
// widgets are CHILDREN of the root, so their positions are root-local.
//
// Layout (all measurements in root-local coords, for the typical 54 × 18 root with
// plateWidth=54 / plateHeight=16 / plateOffsetY=0):
//   Border  = (0, 0)  → 54 × 16  (overlays the plate exactly)
//   Fill    = (1, 1)  → max 52 × 14  (1px inset inside the border)
//
// The fill grows from 0 → fillMaxWidth left-to-right as the cooldown elapses; the
// border stays fixed-size, providing the gray frame that the red fill drains into.
function computeReusableTimerBarGeometry(cfg: ReusableTimerUiConfig): {
    borderX: number; borderY: number; borderWidth: number; borderHeight: number;
    fillX: number; fillY: number; fillMaxWidth: number; fillHeight: number;
} {
    const fillInset = 1;
    return {
        borderX: 0,
        borderY: cfg.plateOffsetY,
        borderWidth: cfg.plateWidth,
        borderHeight: cfg.plateHeight,
        fillX: fillInset,
        fillY: cfg.plateOffsetY + fillInset,
        fillMaxWidth: Math.max(0, cfg.plateWidth - (fillInset * 2)),
        fillHeight: Math.max(0, cfg.plateHeight - (fillInset * 2)),
    };
}

// Wave 6 Ship 0: pid-namespaced widget IDs only produce duplicates if a prior cleanup was
// interrupted mid-loop. 4 passes is 4x tolerance for that case; common path is 1 pass.
function deleteAllReusableTimerWidgetsByName(name: string, maxPasses: number = 4): void {
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
    deleteAllReusableTimerWidgetsByName(`${baseName}BarBorder_${pid}`);
    deleteAllReusableTimerWidgetsByName(`${baseName}BarFill_${pid}`);
    deleteAllReusableTimerWidgetsByName(`${baseName}BarText_${pid}`);
    // v1.439: stale digit + shadow widget names cleaned up so any pre-bump cached widgets
    // from an older bundle are torn down on the first ensure call. Safe to remove once
    // confidence is high that no pre-v1.439 widgets remain in any environment.
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

// Bar border container — gray outer frame inset 2px from the root edges. Fills the
// plate area visually. Built hidden; setReusableTimerProgress flips visibility on
// the first transition into timer mode.
function buildReusableTimerBarBorder(name: string, cfg: ReusableTimerUiConfig) {
    const bar = computeReusableTimerBarGeometry(cfg);
    return {
        name,
        type: "Container",
        anchor: mod.UIAnchor.TopLeft,
        position: [bar.borderX, bar.borderY],
        size: [bar.borderWidth, bar.borderHeight],
        visible: false,
        bgColor: [1, 1, 1],
        bgAlpha: 0.35,
        bgFill: mod.UIBgFill.Solid,
    };
}

// Bar fill container — red rectangle inset 1px inside the border, growing left→right
// as the cooldown progresses. Built at width 0 (empty); setReusableTimerProgress
// sizes + reveals on each decile transition. TopLeft anchor with fixed left edge
// guarantees the fill always aligns inside the border regardless of width.
function buildReusableTimerBarFill(name: string, cfg: ReusableTimerUiConfig) {
    const bar = computeReusableTimerBarGeometry(cfg);
    return {
        name,
        type: "Container",
        anchor: mod.UIAnchor.TopLeft,
        position: [bar.fillX, bar.fillY],
        size: [0, bar.fillHeight],
        visible: false,
        bgColor: [1, 0, 0],
        bgAlpha: 0.95,
        bgFill: mod.UIBgFill.Solid,
    };
}

// "WAIT" label drawn ON TOP of the bar (z-order via child-list ordering: must be appended
// AFTER barFill in the children array). Centered inside the bar plate area; black text on
// the gray border + advancing red fill. Visible only in timer mode -- toggled in lockstep
// with barBorder/barFill by the three visibility setters below.
function buildReusableTimerBarText(name: string, cfg: ReusableTimerUiConfig) {
    const bar = computeReusableTimerBarGeometry(cfg);
    return {
        name,
        type: "Text",
        anchor: mod.UIAnchor.TopLeft,
        position: [bar.borderX, bar.borderY],
        size: [bar.borderWidth, bar.borderHeight],
        visible: false,
        bgAlpha: 0,
        textLabel: msg(mod.stringkeys.twl.ui.wait),
        textColor: [0, 0, 0],
        textAlpha: 1,
        textSize: cfg.fontSize - 2,
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
    const barBorderName = `${baseName}BarBorder_${pid}`;
    const barFillName = `${baseName}BarFill_${pid}`;
    const barTextName = `${baseName}BarText_${pid}`;
    const statusName = `${baseName}Status_${pid}`;
    const statusShadowName = `${baseName}StatusShadow_${pid}`;

    const cached = existing;
    if (cached) {
        cached.root = safeFind(rootName) as mod.UIWidget;
        cached.plate = safeFind(surfaceName) as mod.UIWidget;
        cached.statusShadow = safeFind(statusShadowName) as mod.UIWidget | undefined;
        cached.statusText = safeFind(statusName) as mod.UIWidget | undefined;
        cached.barBorder = safeFind(barBorderName) as mod.UIWidget | undefined;
        cached.barFill = safeFind(barFillName) as mod.UIWidget | undefined;
        cached.barText = safeFind(barTextName) as mod.UIWidget | undefined;
        if (cached.root && cached.plate && cached.barBorder && cached.barFill && cached.barText) {
            // Re-stamp the cached fill geometry from current cfg so a config change between
            // builds (e.g. a layout-constant tune) propagates to the per-tick update path.
            const cachedBarGeo = computeReusableTimerBarGeometry(cfg);
            cached.barFillMaxWidth = cachedBarGeo.fillMaxWidth;
            cached.barFillHeight = cachedBarGeo.fillHeight;
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
            buildReusableTimerBarBorder(barBorderName, cfg),
            buildReusableTimerBarFill(barFillName, cfg),
            buildReusableTimerBarText(barTextName, cfg),
            buildReusableTimerStatusShadow(statusShadowName, cfg),
            buildReusableTimerStatus(statusName, cfg),
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

    const barGeo = computeReusableTimerBarGeometry(cfg);
    const created: ReusableTimerWidgetCacheEntry = {
        rootName,
        surfaceName,
        root: safeFind(rootName) as mod.UIWidget,
        plate: safeFind(surfaceName) as mod.UIWidget,
        statusShadow: safeFind(statusShadowName) as mod.UIWidget | undefined,
        statusText: safeFind(statusName) as mod.UIWidget | undefined,
        barBorder: safeFind(barBorderName) as mod.UIWidget | undefined,
        barFill: safeFind(barFillName) as mod.UIWidget | undefined,
        barText: safeFind(barTextName) as mod.UIWidget | undefined,
        barFillMaxWidth: barGeo.fillMaxWidth,
        barFillHeight: barGeo.fillHeight,
        lastDecile: undefined,
        lastVisibleState: true,
        lastStatusMode: "timer",
    };
    if (!created.root || !created.plate || !created.barBorder || !created.barFill || !created.barText) {
        return undefined;
    }
    normalizeReusableTimerInstance(created, parent, cfg);
    return created;
}

// Wave 5 (v1.439): replaces the per-tick digit refresh. Updates the bar fill in
// 10% chunks (decile-chunk diff-cache per L8) so SetUIWidgetSize fires only on
// chunk boundaries. ~10 widget writes per countdown regardless of total duration.
//
// elapsedFraction: 0 = cooldown just started (bar empty), 1 = cooldown complete
// (bar full). Caller computes from total + remaining (e.g.
// `1 - (remainingSeconds / totalDurationSeconds)`).
//
// READY swap is NOT this function's job: when remaining hits 0, the call site
// still calls setReusableTimerStatus(cache, "ready", ...) which hides the bar
// and shows statusText with "READY" label.
function setReusableTimerProgress(cache: ReusableTimerWidgetCacheEntry, elapsedFraction: number): void {
    if (cache.lastStatusMode !== "timer") {
        safeSetUIWidgetVisible(cache.statusShadow, false);
        safeSetUIWidgetVisible(cache.statusText, false);
        safeSetUIWidgetVisible(cache.barBorder, true);
        safeSetUIWidgetVisible(cache.barFill, true);
        safeSetUIWidgetVisible(cache.barText, true);
        cache.lastStatusMode = "timer";
    }
    const clamped = elapsedFraction <= 0 ? 0 : elapsedFraction >= 1 ? 1 : elapsedFraction;
    const decile = Math.floor(clamped * 10);
    if (decile === cache.lastDecile) return;
    if (cache.barFill) {
        const fillMax = cache.barFillMaxWidth ?? 0;
        const fillHeight = cache.barFillHeight ?? 0;
        const fillPx = Math.floor(fillMax * (decile / 10));
        mod.SetUIWidgetSize(cache.barFill, mod.CreateVector(fillPx, fillHeight, 0));
    }
    cache.lastDecile = decile;
}

function setReusableTimerStatus(
    cache: ReusableTimerWidgetCacheEntry,
    statusMode: "ready" | "active" | "spawning" | "deploying",
    label: mod.Message,
    color: mod.Vector
): void {
    if (cache.lastStatusMode !== statusMode) {
        safeSetUIWidgetVisible(cache.barBorder, false);
        safeSetUIWidgetVisible(cache.barFill, false);
        safeSetUIWidgetVisible(cache.barText, false);
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

function setReusableTimerVisible(cache: ReusableTimerWidgetCacheEntry, visible: boolean): void {
    if (!visible && cache.lastVisibleState === false) return;
    const showBar = visible && cache.lastStatusMode === "timer";
    safeSetUIWidgetVisible(cache.root, visible);
    safeSetUIWidgetVisible(cache.plate, visible);
    safeSetUIWidgetVisible(cache.statusShadow, visible && cache.lastStatusMode !== "timer");
    safeSetUIWidgetVisible(cache.statusText, visible && cache.lastStatusMode !== "timer");
    safeSetUIWidgetVisible(cache.barBorder, showBar);
    safeSetUIWidgetVisible(cache.barFill, showBar);
    safeSetUIWidgetVisible(cache.barText, showBar);
    cache.lastVisibleState = visible;
}
