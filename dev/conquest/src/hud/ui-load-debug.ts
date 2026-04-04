// @ts-nocheck
// Module: hud/ui-load-debug -- temporary on-foot loading-gate audit panel for deploy authority debugging

const UI_LOAD_DEBUG_PANEL_X = UI_CACHE_PERF_PANEL_X;
const UI_LOAD_DEBUG_PANEL_Y = UI_CACHE_PERF_PANEL_Y + UI_CACHE_PERF_PANEL_HEIGHT + 8;
const UI_LOAD_DEBUG_PANEL_WIDTH = 186;
const UI_LOAD_DEBUG_PANEL_HEIGHT = 31;
const UI_LOAD_DEBUG_LINE_X = 6;
const UI_LOAD_DEBUG_PRIMARY_Y = 4;
const UI_LOAD_DEBUG_SECONDARY_Y = 15;

// Returns the widget name for the per-player loading-gate debug root.
function getUiLoadDebugRootName(pid: number): string {
    return `UiLoadDebugRoot_${pid}`;
}

// Returns the widget name for the per-player loading-gate debug primary line.
function getUiLoadDebugPrimaryName(pid: number): string {
    return `UiLoadDebugPrimary_${pid}`;
}

// Returns the widget name for the per-player loading-gate debug secondary line.
function getUiLoadDebugSecondaryName(pid: number): string {
    return `UiLoadDebugSecondary_${pid}`;
}

// Removes all loading-gate debug widgets for one player before deterministic shell rebuild.
function deleteUiLoadDebugWidgetsForPid(pid: number): void {
    deleteAllTopHudShellWidgetsByName(getUiLoadDebugRootName(pid));
    deleteAllTopHudShellWidgetsByName(getUiLoadDebugPrimaryName(pid));
    deleteAllTopHudShellWidgetsByName(getUiLoadDebugSecondaryName(pid));
}

// Rebinds loading-gate debug refs from authoritative widget names.
function bindUiLoadDebugPanelRefsByName(pid: number, refs: TopHudShellRefs): void {
    refs.uiLoadDebugRoot = safeFind(getUiLoadDebugRootName(pid));
    refs.uiLoadDebugPrimaryText = safeFind(getUiLoadDebugPrimaryName(pid));
    refs.uiLoadDebugSecondaryText = safeFind(getUiLoadDebugSecondaryName(pid));
}

// Returns whether the on-foot loading-gate audit panel should currently be visible for one player.
function shouldShowUiLoadDebugPanelForPid(pid: number): boolean {
    const state = State.players.readyDialogData[pid];
    return (state?.uiLoadTrace?.length ?? 0) > 0;
}

// Builds the temporary loading-gate audit panel under the shared top-HUD root.
// No-op when UI_LOAD_TRACE_ENABLED is false; panel is never created in production.
function buildConquestUiLoadDebugPanelWidgets(player: mod.Player, pid: number, refs: TopHudShellRefs): void {
    if (!UI_LOAD_TRACE_ENABLED) return;
    const parent = refs.topHudRoot ?? ensureTopHudRootForPid(pid, player);
    if (!parent) return;

    deleteUiLoadDebugWidgetsForPid(pid);

    const root = safeParseUI({
        name: getUiLoadDebugRootName(pid),
        type: "Container",
        playerId: player,
        position: [UI_LOAD_DEBUG_PANEL_X, UI_LOAD_DEBUG_PANEL_Y],
        size: [UI_LOAD_DEBUG_PANEL_WIDTH, UI_LOAD_DEBUG_PANEL_HEIGHT],
        anchor: mod.UIAnchor.TopLeft,
        visible: false,
        padding: 1,
        bgColor: [0, 0, 0],
        bgAlpha: 0.45,
        bgFill: mod.UIBgFill.Blur,
    });
    if (!root) return;
    mod.SetUIWidgetParent(root, parent);
    mod.SetUIWidgetDepth(root, mod.UIDepth.AboveGameUI);
    refs.roots.push(root);

    const primary = safeParseUI({
        name: getUiLoadDebugPrimaryName(pid),
        type: "Text",
        playerId: player,
        position: [UI_LOAD_DEBUG_LINE_X, UI_LOAD_DEBUG_PRIMARY_Y],
        size: [UI_LOAD_DEBUG_PANEL_WIDTH - 12, 10],
        anchor: mod.UIAnchor.TopLeft,
        visible: true,
        padding: 0,
        bgAlpha: 0,
        bgFill: mod.UIBgFill.None,
        textLabel: mod.Message(mod.stringkeys.twl.debug.adminPos, 0, 0, 0),
        textColor: [1, 1, 1],
        textAlpha: 1,
        textSize: 8,
        textAnchor: mod.UIAnchor.CenterLeft,
    });
    if (primary) {
        mod.SetUIWidgetParent(primary, root);
        mod.SetUIWidgetDepth(primary, mod.UIDepth.AboveGameUI);
        refs.roots.push(primary);
    }

    const secondary = safeParseUI({
        name: getUiLoadDebugSecondaryName(pid),
        type: "Text",
        playerId: player,
        position: [UI_LOAD_DEBUG_LINE_X, UI_LOAD_DEBUG_SECONDARY_Y],
        size: [UI_LOAD_DEBUG_PANEL_WIDTH - 12, 10],
        anchor: mod.UIAnchor.TopLeft,
        visible: true,
        padding: 0,
        bgAlpha: 0,
        bgFill: mod.UIBgFill.None,
        textLabel: mod.Message(mod.stringkeys.twl.debug.adminFacing, 0, 0, 0),
        textColor: [0.85, 0.85, 0.85],
        textAlpha: 1,
        textSize: 8,
        textAnchor: mod.UIAnchor.CenterLeft,
    });
    if (secondary) {
        mod.SetUIWidgetParent(secondary, root);
        mod.SetUIWidgetDepth(secondary, mod.UIDepth.AboveGameUI);
        refs.roots.push(secondary);
    }

    bindUiLoadDebugPanelRefsByName(pid, refs);
    syncUiLoadDebugPanelForPid(pid);
}

// Sets loading-gate debug panel visibility for one player without touching the rest of the HUD shell.
// No-op when UI_LOAD_TRACE_ENABLED is false.
function setUiLoadDebugPanelVisibleForPid(pid: number, visible: boolean): void {
    if (!UI_LOAD_TRACE_ENABLED) return;
    const refs = getTopHudShellRefsForPid(pid);
    safeSetUIWidgetVisible(refs?.uiLoadDebugRoot, visible && shouldShowUiLoadDebugPanelForPid(pid));
}

// Renders the current loading-gate audit state into the temporary on-foot debug panel.
// No-op when UI_LOAD_TRACE_ENABLED is false.
function syncUiLoadDebugPanelForPid(pid: number): void {
    if (!UI_LOAD_TRACE_ENABLED) return;
    const refs = getTopHudShellRefsForPid(pid);
    const state = State.players.readyDialogData[pid];
    if (!refs?.uiLoadDebugRoot || !state) return;

    safeSetUITextLabel(
        refs.uiLoadDebugPrimaryText,
        mod.Message(
            mod.stringkeys.twl.debug.adminPos,
            state.uiLoadLastEventDebugCode ?? 0,
            state.uiLoadGateActive ? 1 : 0,
            state.uiLoadGateReleased ? 1 : 0
        )
    );
    safeSetUITextLabel(
        refs.uiLoadDebugSecondaryText,
        mod.Message(
            mod.stringkeys.twl.debug.adminFacing,
            state.uiLoadDeployEnabled ? 1 : 0,
            state.uiLoadDeployAuthorized ? 1 : 0,
            state.uiLoadInputRestricted ? 1 : 0
        )
    );
    setUiLoadDebugPanelVisibleForPid(pid, true);
}
