// @ts-nocheck
// Module: lazy-build -- foundation for deferred HUD widget construction
//
// Goal: defeat the 1000ms per-frame engine evaluation budget breach (CQ_Bug_40 equivalent in
// Conquest) by deferring widget construction so a single tick never runs the full HUD build
// during a concurrent-join burst. Pattern ported from conquest/src/interaction/lazy-build-registry.ts
// + conquest/src/ui/conquest/hud-core/build.ts.
//
// Three building blocks provided here:
//   1. safeParseUI(...)            -- try/catch wrapper around modlib.ParseUI
//   2. wn(base, pid, suffix?)       -- widget-name helper, "<base>_<pid>" or "<base>_<pid>_<suffix>"
//   3. ensureHudContainer/Text/Image -- atomic per-widget builders that ALWAYS re-apply position/
//                                       size/anchor/depth (bakes the v0.686 altimeter fix into
//                                       every widget by default)
//   4. LAZY_BUILD_REGISTRY + triggerLazyBuild(name, pid) -- dispatch infrastructure with
//                                       re-entrancy guard, disconnect guard, error counters

//#region -------------------- safeParseUI --------------------

// Try/catch wrapper around modlib.ParseUI. Returns the widget on success, undefined on failure.
// Conquest pattern: lets builders soft-fail without killing the script.
function safeParseUI(config: any): mod.UIWidget | undefined {
    try {
        const widget = modlib.ParseUI(config);
        if (widget) return widget;
        // ParseUI sometimes returns undefined even on success; fall through to safeFind.
    } catch {
        // swallow; caller falls through to safeFind by name
    }
    try {
        if (config && config.name) {
            return safeFind(config.name);
        }
    } catch { }
    return undefined;
}

//#endregion ----------------- safeParseUI --------------------



//#region -------------------- wn (widget-name helper) --------------------

// Builds a pid-namespaced widget name: wn("VictoryDialog_Restart", pid) -> "VictoryDialog_Restart_<pid>"
// Optional suffix: wn("VictoryDialog_LeftRoster", pid, 3) -> "VictoryDialog_LeftRoster_<pid>_3"
function wn(base: string, pid: number, suffix?: string | number): string {
    if (suffix === undefined) return base + "_" + pid;
    return base + "_" + pid + "_" + suffix;
}

//#endregion ----------------- wn --------------------



//#region -------------------- ensureHudContainer / Text / Image --------------------

// Atomic per-widget builder for Container widgets.
// CONTRACT (must match for Text/Image variants too):
//   1. safeFind(name) -- look up existing widget
//   2. If missing, safeParseUI to create with the supplied config
//   3. UNCONDITIONALLY re-apply parent + anchor + position + size + depth via mod.SetUI* calls
// Step 3 is the v0.686 altimeter fix baked in by default: position constants stay live across
// script reloads + idempotent re-entries, so callers can edit constants and the next ensure
// call moves the widget to the new position.
function ensureHudContainer(
    player: mod.Player,
    name: string,
    parent: mod.UIWidget | undefined,
    anchor: mod.UIAnchor,
    x: number,
    y: number,
    width: number,
    height: number,
    bgColor?: [number, number, number],
    bgAlpha?: number,
    bgFill?: mod.UIBgFill,
    padding?: number,
    visible?: boolean
): mod.UIWidget | undefined {
    let widget = safeFind(name);
    if (!widget) {
        widget = safeParseUI({
            name,
            type: "Container",
            playerId: player,
            position: [x, y],
            size: [width, height],
            anchor,
            visible: visible ?? false,
            padding: padding ?? 0,
            bgColor: bgColor ?? [0, 0, 0],
            bgAlpha: bgAlpha ?? 0,
            bgFill: bgFill ?? mod.UIBgFill.None,
        });
    }
    if (!widget) return undefined;
    try {
        if (parent) mod.SetUIWidgetParent(widget, parent);
        mod.SetUIWidgetPosition(widget, mod.CreateVector(x, y, 0));
        mod.SetUIWidgetSize(widget, mod.CreateVector(width, height, 0));
        mod.SetUIWidgetDepth(widget, mod.UIDepth.AboveGameUI);
    } catch {
        return undefined;
    }
    return widget;
}

// Atomic per-widget builder for Text widgets. Same contract as ensureHudContainer plus
// SetUITextSize / SetUITextLabel / SetUITextColor on the live widget.
function ensureHudText(
    player: mod.Player,
    name: string,
    parent: mod.UIWidget | undefined,
    anchor: mod.UIAnchor,
    x: number,
    y: number,
    width: number,
    height: number,
    textSize: number,
    label: mod.Message,
    colorRgb: [number, number, number],
    textAnchor: mod.UIAnchor = mod.UIAnchor.Center,
    visible?: boolean,
    bgColor?: [number, number, number],
    bgAlpha?: number,
    bgFill?: mod.UIBgFill
): mod.UIWidget | undefined {
    let widget = safeFind(name);
    if (!widget) {
        widget = safeParseUI({
            name,
            type: "Text",
            playerId: player,
            position: [x, y],
            size: [width, height],
            anchor,
            visible: visible ?? false,
            padding: 0,
            bgColor: bgColor ?? [0, 0, 0],
            bgAlpha: bgAlpha ?? 0,
            bgFill: bgFill ?? mod.UIBgFill.None,
            textLabel: label,
            textColor: colorRgb,
            textAlpha: 1,
            textSize,
            textAnchor,
        });
    }
    if (!widget) return undefined;
    try {
        if (parent) mod.SetUIWidgetParent(widget, parent);
        mod.SetUIWidgetPosition(widget, mod.CreateVector(x, y, 0));
        mod.SetUIWidgetSize(widget, mod.CreateVector(width, height, 0));
        mod.SetUIWidgetDepth(widget, mod.UIDepth.AboveGameUI);
        mod.SetUITextSize(widget, textSize);
        if (label !== undefined && label !== null) mod.SetUITextLabel(widget, label);
    } catch {
        return undefined;
    }
    return widget;
}

// Atomic per-widget builder for Image widgets.
function ensureHudImage(
    player: mod.Player,
    name: string,
    parent: mod.UIWidget | undefined,
    anchor: mod.UIAnchor,
    x: number,
    y: number,
    width: number,
    height: number,
    imageType: any,
    imageColor: [number, number, number],
    imageAlpha: number = 1,
    visible?: boolean
): mod.UIWidget | undefined {
    let widget = safeFind(name);
    if (!widget) {
        widget = safeParseUI({
            name,
            type: "Image",
            playerId: player,
            position: [x, y],
            size: [width, height],
            anchor,
            visible: visible ?? false,
            padding: 0,
            bgAlpha: 0,
            bgFill: mod.UIBgFill.None,
            imageType,
            imageColor,
            imageAlpha,
        });
    }
    if (!widget) return undefined;
    try {
        if (parent) mod.SetUIWidgetParent(widget, parent);
        mod.SetUIWidgetPosition(widget, mod.CreateVector(x, y, 0));
        mod.SetUIWidgetSize(widget, mod.CreateVector(width, height, 0));
        mod.SetUIWidgetDepth(widget, mod.UIDepth.AboveGameUI);
    } catch {
        return undefined;
    }
    return widget;
}

//#endregion ----------------- ensureHud* helpers --------------------



//#region -------------------- LAZY_BUILD_REGISTRY + triggerLazyBuild --------------------

// Declarative per-surface lazy-build config. Mirrors conquest/src/interaction/lazy-build-registry.ts
// minus the mutex/pacer machinery (overkill for <=8 player Helis).
type LazyBuildSurfaceName =
    | 'readyDialog'
    | 'adminPanel'
    | 'victoryDialog'
    | 'roundEndDialog'
    | 'topHud';

interface LazyBuildConfig {
    name: LazyBuildSurfaceName;
    teardownTrigger: 'disconnect' | 'roundEnd' | 'matchEnd' | 'menuClose' | 'never';
}

const LAZY_BUILD_REGISTRY: { readonly [K in LazyBuildSurfaceName]: LazyBuildConfig } = {
    readyDialog: {
        name: 'readyDialog',
        teardownTrigger: 'roundEnd',
    },
    adminPanel: {
        name: 'adminPanel',
        teardownTrigger: 'menuClose',
    },
    victoryDialog: {
        name: 'victoryDialog',
        teardownTrigger: 'matchEnd',
    },
    roundEndDialog: {
        name: 'roundEndDialog',
        teardownTrigger: 'roundEnd',
    },
    topHud: {
        name: 'topHud',
        teardownTrigger: 'disconnect',
    },
};

// Per-surface in-flight pid set. Re-entrancy guard so a build doesn't double-fire for the same pid
// before the first build settles or fails. Cleared in triggerLazyBuild's finally block.
const _lazyBuildInFlightByName: { [K in LazyBuildSurfaceName]: Record<number, true> } = {
    readyDialog: {},
    adminPanel: {},
    victoryDialog: {},
    roundEndDialog: {},
    topHud: {},
};

// Telemetry counters (success / error per surface). Useful when chasing crashes.
const _lazyBuildSuccessByName: { [K in LazyBuildSurfaceName]: number } = {
    readyDialog: 0,
    adminPanel: 0,
    victoryDialog: 0,
    roundEndDialog: 0,
    topHud: 0,
};

const _lazyBuildErrorByName: { [K in LazyBuildSurfaceName]: number } = {
    readyDialog: 0,
    adminPanel: 0,
    victoryDialog: 0,
    roundEndDialog: 0,
    topHud: 0,
};

function getLazyBuildSuccessCount(name: LazyBuildSurfaceName): number {
    return _lazyBuildSuccessByName[name];
}

function getLazyBuildErrorCount(name: LazyBuildSurfaceName): number {
    return _lazyBuildErrorByName[name];
}

// Resolves per-surface builder closure. Each entry delegates to the existing ensure* helper for
// that widget group; the actual builder lives next to the widget group it builds. Wiring is done
// here so triggerLazyBuild's call site doesn't need to know which builder it's invoking.
function _resolveLazyBuildHandler(
    name: LazyBuildSurfaceName,
    eventPlayer: mod.Player,
    pid: number
): (() => void) | undefined {
    switch (name) {
        case 'readyDialog':
            // Ready Dialog routing through registry is Phase C of the lazy-load HUD refactor.
            // Today the dialog still builds inline via createTeamSwitchUI on triple-tap; this
            // handler is a no-op until Phase C lands ensureReadyDialogUiBuiltHidden.
            return () => { };
        case 'adminPanel':
            // Admin panel builds are still done inline in the toggle-button handler today; the
            // registry entry is reserved for telemetry + future migration. No-op for now.
            return () => { };
        case 'victoryDialog':
            return () => ensureVictoryDialogUiBuiltHidden(eventPlayer);
        case 'roundEndDialog':
            return () => ensureRoundEndDialogUiBuiltHidden(eventPlayer);
        case 'topHud':
            return () => ensureTopHudScoringUiBuiltHidden(eventPlayer);
    }
    return undefined;
}

// Dispatches a lazy build for the named surface and pid.
//
// Behavior contract:
//   - Re-entrancy: returns early if a build for (name, pid) is already in flight.
//   - Disconnect guard: returns early if the player is no longer resolvable.
//   - Sync builders run inline; their hitch counts against the caller's frame.
//   - Errors: caught, logged, error counter bumped. Per-surface lock released in finally so
//     the next call retries cleanly.
function triggerLazyBuild(name: LazyBuildSurfaceName, pid: number): void {
    const config = LAZY_BUILD_REGISTRY[name];
    if (!config) return;

    const inFlight = _lazyBuildInFlightByName[name];
    if (inFlight[pid]) return;

    const eventPlayer = safeFindPlayer(pid);
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;

    const handler = _resolveLazyBuildHandler(name, eventPlayer, pid);
    if (!handler) return;

    inFlight[pid] = true;
    try {
        handler();
        _lazyBuildSuccessByName[name] = _lazyBuildSuccessByName[name] + 1;
    } catch (_err) {
        _lazyBuildErrorByName[name] = _lazyBuildErrorByName[name] + 1;
    } finally {
        delete inFlight[pid];
    }
}

//#endregion ----------------- LAZY_BUILD_REGISTRY + triggerLazyBuild --------------------
