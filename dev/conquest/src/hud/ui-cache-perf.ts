// @ts-nocheck
// Module: hud/ui-cache-perf -- lightweight per-player UI cache instrumentation counters and HUD panel

const UI_CACHE_PERF_PANEL_X = TOP_LEFT_BASE_X + TOP_LEFT_BRANDING_WIDTH + TOP_LEFT_STATUS_GAP_X + TOP_LEFT_STATUS_WIDTH + 12;
const UI_CACHE_PERF_PANEL_Y = TOP_LEFT_BASE_Y_OFFSET + TOP_HUD_OFFSET_Y + CONQUEST_HUD_NON_CLOCK_SHIFT_Y;
const UI_CACHE_PERF_PANEL_WIDTH = 186;
const UI_CACHE_PERF_PANEL_HEIGHT = 90;
const UI_CACHE_PERF_LABEL_X = 6;
const UI_CACHE_PERF_VALUE_X = 54;
const UI_CACHE_PERF_HEADER_Y = 2;
const UI_CACHE_PERF_ROW_START_Y = 17;
const UI_CACHE_PERF_ROW_STEP_Y = 24;
const UI_CACHE_PERF_SECONDARY_GAP_Y = 11;

// Returns the authoritative per-player UI cache counters, creating a zeroed record on first access.
function ensureUiCachePerfCountersForPid(pid: number) {
    let counters = State.players.uiCachePerfByPid[pid];
    if (counters) return counters;
    counters = {
        vehicle: { built: 0, rebuilt: 0, cold: 0, invalid: 0 },
        ready: { built: 0, rebuilt: 0, cold: 0, invalid: 0 },
        gadget: { built: 0, rebuilt: 0, cold: 0, invalid: 0 },
    };
    State.players.uiCachePerfByPid[pid] = counters;
    return counters;
}

// Resets one player's UI cache instrumentation counters on fresh join/reconnect lifecycle setup.
function resetUiCachePerfCountersForPid(pid: number): void {
    delete State.players.uiCachePerfByPid[pid];
}

// Returns whether the lightweight UI cache panel should currently be visible.
function isUiCachePerfPanelEnabled(): boolean {
    return State.admin.uiCachePerfVisible !== false;
}

// Returns the admin-panel toggle label key for the global UI cache panel visibility state.
function getUiCachePerfAdminToggleLabelKey(): number {
    return isUiCachePerfPanelEnabled()
        ? mod.stringkeys.twl.adminPanel.tester.buttons.uiCachePerfOn
        : mod.stringkeys.twl.adminPanel.tester.buttons.uiCachePerfOff;
}

// Syncs one admin-panel toggle label so the button reflects the current global UI cache panel state.
function syncUiCachePerfAdminToggleLabelForPid(pid: number): void {
    const label = safeFind(UI_TEST_UI_CACHE_PERF_TOGGLE_TEXT_ID + pid);
    if (!label) return;
    safeSetUITextLabel(label, mod.Message(getUiCachePerfAdminToggleLabelKey()));
}

// Pushes the current admin toggle label to every active player.
function syncUiCachePerfAdminToggleLabelForAllPlayers(): void {
    for (const pidStr in State.players.readyDialogData) {
        syncUiCachePerfAdminToggleLabelForPid(Number(pidStr));
    }
}

// Writes one counter change and immediately refreshes the owning player's lightweight HUD panel.
function incrementUiCachePerfCounter(
    pid: number,
    family: "vehicle" | "ready" | "gadget",
    field: "built" | "rebuilt" | "cold" | "invalid"
): void {
    const counters = ensureUiCachePerfCountersForPid(pid);
    counters[family][field] = counters[family][field] + 1;
    syncUiCachePerfPanelForPid(pid);
}

// Returns the widget name for the per-player UI cache panel root.
function getUiCachePerfRootName(pid: number): string {
    return `UiCachePerfRoot_${pid}`;
}

// Returns the widget name for the per-player UI cache panel header label.
function getUiCachePerfHeaderName(pid: number): string {
    return `UiCachePerfHeader_${pid}`;
}

// Returns the widget name for one per-family static label row.
function getUiCachePerfFamilyLabelName(pid: number, familyIndex: number): string {
    return `UiCachePerfFamilyLabel_${pid}_${familyIndex}`;
}

// Returns the widget name for one per-family built/rebuilt value row.
function getUiCachePerfBuiltName(pid: number, familyIndex: number): string {
    return `UiCachePerfBuilt_${pid}_${familyIndex}`;
}

// Returns the widget name for one per-family cold/invalid value row.
function getUiCachePerfColdName(pid: number, familyIndex: number): string {
    return `UiCachePerfCold_${pid}_${familyIndex}`;
}

// Deletes all widgets for one player's lightweight UI cache panel before deterministic rebuild.
function deleteUiCachePerfWidgetsForPid(pid: number): void {
    deleteAllTopHudShellWidgetsByName(getUiCachePerfRootName(pid));
    deleteAllTopHudShellWidgetsByName(getUiCachePerfHeaderName(pid));
    for (let i = 0; i < 3; i++) {
        deleteAllTopHudShellWidgetsByName(getUiCachePerfFamilyLabelName(pid, i));
        deleteAllTopHudShellWidgetsByName(getUiCachePerfBuiltName(pid, i));
        deleteAllTopHudShellWidgetsByName(getUiCachePerfColdName(pid, i));
    }
}

// Rebinds the lightweight UI cache panel refs from authoritative widget names.
function bindUiCachePerfPanelRefsByName(pid: number, refs: TopHudShellRefs): void {
    refs.uiCachePerfRoot = safeFind(getUiCachePerfRootName(pid));
    refs.uiCachePerfHeader = safeFind(getUiCachePerfHeaderName(pid));
    refs.uiCachePerfFamilyLabel = [];
    refs.uiCachePerfBuiltText = [];
    refs.uiCachePerfColdText = [];
    for (let i = 0; i < 3; i++) {
        refs.uiCachePerfFamilyLabel[i] = safeFind(getUiCachePerfFamilyLabelName(pid, i));
        refs.uiCachePerfBuiltText[i] = safeFind(getUiCachePerfBuiltName(pid, i));
        refs.uiCachePerfColdText[i] = safeFind(getUiCachePerfColdName(pid, i));
    }
}

// Builds the lightweight UI cache instrumentation panel under the shared top-HUD root.
function buildConquestUiCachePerfPanelWidgets(player: mod.Player, pid: number, refs: TopHudShellRefs): void {
    const parent = refs.topHudRoot ?? ensureTopHudRootForPid(pid, player);
    if (!parent) return;

    deleteUiCachePerfWidgetsForPid(pid);

    const root = safeParseUI({
        name: getUiCachePerfRootName(pid),
        type: "Container",
        playerId: player,
        position: [UI_CACHE_PERF_PANEL_X, UI_CACHE_PERF_PANEL_Y],
        size: [UI_CACHE_PERF_PANEL_WIDTH, UI_CACHE_PERF_PANEL_HEIGHT],
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

    const header = safeParseUI({
        name: getUiCachePerfHeaderName(pid),
        type: "Text",
        playerId: player,
        position: [UI_CACHE_PERF_LABEL_X, UI_CACHE_PERF_HEADER_Y],
        size: [UI_CACHE_PERF_PANEL_WIDTH - 12, 12],
        anchor: mod.UIAnchor.TopLeft,
        visible: true,
        padding: 0,
        bgAlpha: 0,
        bgFill: mod.UIBgFill.None,
        textLabel: mod.Message(mod.stringkeys.twl.hud.uiCacheHeader),
        textColor: [1, 1, 1],
        textAlpha: 1,
        textSize: 10,
        textAnchor: mod.UIAnchor.CenterLeft,
    });
    if (header) {
        mod.SetUIWidgetParent(header, root);
        mod.SetUIWidgetDepth(header, mod.UIDepth.AboveGameUI);
        refs.roots.push(header);
    }

    const familyKeys = [
        mod.stringkeys.twl.hud.uiCacheVehicle,
        mod.stringkeys.twl.hud.uiCacheReady,
        mod.stringkeys.twl.hud.uiCacheGadget,
    ];
    refs.uiCachePerfFamilyLabel = [];
    refs.uiCachePerfBuiltText = [];
    refs.uiCachePerfColdText = [];
    for (let i = 0; i < familyKeys.length; i++) {
        const rowY = UI_CACHE_PERF_ROW_START_Y + (i * UI_CACHE_PERF_ROW_STEP_Y);
        const familyLabel = safeParseUI({
            name: getUiCachePerfFamilyLabelName(pid, i),
            type: "Text",
            playerId: player,
            position: [UI_CACHE_PERF_LABEL_X, rowY],
            size: [50, 11],
            anchor: mod.UIAnchor.TopLeft,
            visible: true,
            padding: 0,
            bgAlpha: 0,
            bgFill: mod.UIBgFill.None,
            textLabel: mod.Message(familyKeys[i]),
            textColor: [0.6784, 0.9922, 0.5255],
            textAlpha: 1,
            textSize: 9,
            textAnchor: mod.UIAnchor.CenterLeft,
        });
        if (familyLabel) {
            mod.SetUIWidgetParent(familyLabel, root);
            mod.SetUIWidgetDepth(familyLabel, mod.UIDepth.AboveGameUI);
            refs.roots.push(familyLabel);
        }

        const builtText = safeParseUI({
            name: getUiCachePerfBuiltName(pid, i),
            type: "Text",
            playerId: player,
            position: [UI_CACHE_PERF_VALUE_X, rowY],
            size: [UI_CACHE_PERF_PANEL_WIDTH - UI_CACHE_PERF_VALUE_X - 6, 11],
            anchor: mod.UIAnchor.TopLeft,
            visible: true,
            padding: 0,
            bgAlpha: 0,
            bgFill: mod.UIBgFill.None,
            textLabel: mod.Message(mod.stringkeys.twl.hud.uiCacheBuiltRebuiltFormat, 0, 0),
            textColor: [1, 1, 1],
            textAlpha: 1,
            textSize: 9,
            textAnchor: mod.UIAnchor.CenterLeft,
        });
        if (builtText) {
            mod.SetUIWidgetParent(builtText, root);
            mod.SetUIWidgetDepth(builtText, mod.UIDepth.AboveGameUI);
            refs.roots.push(builtText);
        }

        const coldText = safeParseUI({
            name: getUiCachePerfColdName(pid, i),
            type: "Text",
            playerId: player,
            position: [UI_CACHE_PERF_VALUE_X, rowY + UI_CACHE_PERF_SECONDARY_GAP_Y],
            size: [UI_CACHE_PERF_PANEL_WIDTH - UI_CACHE_PERF_VALUE_X - 6, 11],
            anchor: mod.UIAnchor.TopLeft,
            visible: true,
            padding: 0,
            bgAlpha: 0,
            bgFill: mod.UIBgFill.None,
            textLabel: mod.Message(mod.stringkeys.twl.hud.uiCacheColdInvalidFormat, 0, 0),
            textColor: [0.85, 0.85, 0.85],
            textAlpha: 1,
            textSize: 9,
            textAnchor: mod.UIAnchor.CenterLeft,
        });
        if (coldText) {
            mod.SetUIWidgetParent(coldText, root);
            mod.SetUIWidgetDepth(coldText, mod.UIDepth.AboveGameUI);
            refs.roots.push(coldText);
        }

        refs.uiCachePerfFamilyLabel[i] = familyLabel;
        refs.uiCachePerfBuiltText[i] = builtText;
        refs.uiCachePerfColdText[i] = coldText;
    }

    bindUiCachePerfPanelRefsByName(pid, refs);
    syncUiCachePerfPanelForPid(pid);
}

// Sets the lightweight UI cache panel visibility for one player without touching other shell widgets.
function setUiCachePerfPanelVisibleForPid(pid: number, visible: boolean): void {
    const refs = getTopHudShellRefsForPid(pid);
    safeSetUIWidgetVisible(refs?.uiCachePerfRoot, visible && isUiCachePerfPanelEnabled());
}

// Renders one player's UI cache counters into the lightweight top-HUD panel.
function syncUiCachePerfPanelForPid(pid: number): void {
    const refs = getTopHudShellRefsForPid(pid);
    if (!refs?.uiCachePerfRoot) return;
    const counters = ensureUiCachePerfCountersForPid(pid);
    const families = [counters.vehicle, counters.ready, counters.gadget];
    for (let i = 0; i < families.length; i++) {
        safeSetUITextLabel(
            refs.uiCachePerfBuiltText?.[i],
            mod.Message(mod.stringkeys.twl.hud.uiCacheBuiltRebuiltFormat, families[i].built, families[i].rebuilt)
        );
        safeSetUITextLabel(
            refs.uiCachePerfColdText?.[i],
            mod.Message(mod.stringkeys.twl.hud.uiCacheColdInvalidFormat, families[i].cold, families[i].invalid)
        );
    }
}

// Pushes the current UI cache counters to every player that already has a top-HUD shell.
function syncUiCachePerfPanelForAllPlayers(): void {
    for (const pidStr in State.hudCache.topHudShellByPid) {
        syncUiCachePerfPanelForPid(Number(pidStr));
    }
}

// Applies the global UI cache panel visibility state and syncs both panel content and admin toggle labels.
function setUiCachePerfPanelEnabled(enabled: boolean): void {
    State.admin.uiCachePerfVisible = enabled;
    for (const pidStr in State.hudCache.topHudShellByPid) {
        setUiCachePerfPanelVisibleForPid(Number(pidStr), enabled);
    }
    syncUiCachePerfPanelForAllPlayers();
    syncUiCachePerfAdminToggleLabelForAllPlayers();
}
