// @ts-nocheck
// Module: ready-dialog/loading-overlay -- loading overlay shown during player UI warm gate

//#region -------------------- Loading Overlay - IDs --------------------

function joinPromptRootName(pid: number): string { return "join_prompt_root_" + pid; }
function joinPromptPanelName(pid: number): string { return "join_prompt_panel_" + pid; }
function joinPromptTitleName(pid: number): string { return "join_prompt_title_" + pid; }
function joinPromptSubtitleName(pid: number): string { return "join_prompt_subtitle_" + pid; }
function joinPromptBodyName(pid: number): string { return "join_prompt_body_" + pid; }
function joinPromptDetailName(pid: number): string { return "join_prompt_detail_" + pid; }

// Returns every widget id owned by the loading overlay for batch hide/delete operations.
function getLoadingOverlayWidgetNames(pid: number): string[] {
    return [
        joinPromptDetailName(pid),
        joinPromptBodyName(pid),
        joinPromptSubtitleName(pid),
        joinPromptTitleName(pid),
        joinPromptPanelName(pid),
        joinPromptRootName(pid),
    ];
}

//#endregion ----------------- Loading Overlay - IDs --------------------

//#region -------------------- Loading Overlay - Lifecycle --------------------

// Hides every widget in the loading overlay without destroying the tree.
function hideLoadingOverlayForPlayerId(playerId: number): void {
    for (const widgetName of getLoadingOverlayWidgetNames(playerId)) {
        safeSetUIWidgetVisible(safeFind(widgetName), false);
    }
}

// Completely destroys all loading overlay widgets for a player.
function clearLoadingOverlayForPlayerId(playerId: number): void {
    for (const widgetName of getLoadingOverlayWidgetNames(playerId)) {
        for (let i = 0; i < 16; i++) {
            const widget = safeFind(widgetName);
            if (!widget) break;
            try {
                mod.DeleteUIWidget(widget);
            } catch {
                break;
            }
        }
    }
    const state = getReadyDialogStateForPid(playerId);
    if (state) state.loadingOverlayExists = false;
}

//#endregion ----------------- Loading Overlay - Lifecycle --------------------

//#region -------------------- Loading Overlay - Layout --------------------

const LOADING_OVERLAY_PANEL_WIDTH = 520;
const LOADING_OVERLAY_PANEL_HEIGHT = 220;
const LOADING_OVERLAY_HEADER_OFFSET_Y = -60;
const LOADING_OVERLAY_TITLE_OFFSET_Y = -18;
const LOADING_OVERLAY_SUBTITLE_OFFSET_Y = 18;
const LOADING_OVERLAY_BODY_OFFSET_Y = 60;

// Ensures the loading overlay tree exists for one player so the warm gate can show a stable loading message.
function ensureLoadingOverlayForPlayer(eventPlayer: mod.Player): mod.UIWidget | undefined {
    if (!isValidPlayer(eventPlayer)) return undefined;
    const pid = safeGetPlayerId(eventPlayer);
    if (pid === undefined) return undefined;

    let root = safeFind(joinPromptRootName(pid)) as mod.UIWidget | undefined;
    if (
        root
        && safeFind(joinPromptPanelName(pid))
        && safeFind(joinPromptTitleName(pid))
        && safeFind(joinPromptSubtitleName(pid))
        && safeFind(joinPromptBodyName(pid))
        && safeFind(joinPromptDetailName(pid))
    ) {
        const cachedState = getReadyDialogStateForPid(pid);
        if (cachedState) cachedState.loadingOverlayExists = true;
        return root;
    }
    if (root) {
        clearLoadingOverlayForPlayerId(pid);
        root = undefined;
    }

    mod.AddUIContainer(
        joinPromptRootName(pid),
        VEC_ZERO,
        mod.CreateVector(640, 240, 0),
        mod.UIAnchor.Center,
        mod.GetUIRoot(),
        true,
        0,
        COLOR_DARK_BLACK,
        0,
        mod.UIBgFill.None,
        mod.UIDepth.AboveGameUI,
        eventPlayer
    );
    root = safeFind(joinPromptRootName(pid)) as mod.UIWidget | undefined;
    if (!root) return undefined;
    const state = getReadyDialogStateForPid(pid);
    if (state) state.loadingOverlayExists = true;

    mod.AddUIContainer(
        joinPromptPanelName(pid),
        VEC_ZERO,
        mod.CreateVector(LOADING_OVERLAY_PANEL_WIDTH, LOADING_OVERLAY_PANEL_HEIGHT, 0),
        mod.UIAnchor.Center,
        root,
        true,
        0,
        COLOR_DARK_BLACK,
        0.92,
        mod.UIBgFill.Blur,
        mod.UIDepth.AboveGameUI,
        eventPlayer
    );

    const panel = safeFind(joinPromptPanelName(pid)) as mod.UIWidget | undefined;
    if (!panel) return root;

    addReadyDialogText(
        joinPromptTitleName(pid),
        0,
        LOADING_OVERLAY_HEADER_OFFSET_Y,
        LOADING_OVERLAY_PANEL_WIDTH - 40,
        34,
        mod.UIAnchor.Center,
        mod.UIAnchor.Center,
        msg(mod.stringkeys.twl.ui.loading),
        eventPlayer,
        panel,
        24,
        true,
        COLOR_WHITE
    );
    addReadyDialogText(
        joinPromptSubtitleName(pid),
        0,
        LOADING_OVERLAY_TITLE_OFFSET_Y,
        LOADING_OVERLAY_PANEL_WIDTH - 60,
        28,
        mod.UIAnchor.Center,
        mod.UIAnchor.Center,
        msg(mod.stringkeys.twl.hud.branding.title),
        eventPlayer,
        panel,
        18,
        true,
        COLOR_WHITE
    );
    addReadyDialogText(
        joinPromptBodyName(pid),
        0,
        LOADING_OVERLAY_SUBTITLE_OFFSET_Y,
        LOADING_OVERLAY_PANEL_WIDTH - 60,
        24,
        mod.UIAnchor.Center,
        mod.UIAnchor.Center,
        msg(mod.stringkeys.twl.hud.branding.subtitle),
        eventPlayer,
        panel,
        15,
        true,
        COLOR_WHITE
    );
    addReadyDialogText(
        joinPromptDetailName(pid),
        0,
        LOADING_OVERLAY_BODY_OFFSET_Y,
        LOADING_OVERLAY_PANEL_WIDTH - 60,
        28,
        mod.UIAnchor.Center,
        mod.UIAnchor.Center,
        msg(mod.stringkeys.twl.ui.customScriptsLoading),
        eventPlayer,
        panel,
        17,
        true,
        COLOR_WHITE
    );

    return root;
}

// Shows the loading overlay for one player while the warm controller blocks deploy and menu interaction.
function showLoadingOverlayForPlayer(eventPlayer: mod.Player): void {
    const pid = safeGetPlayerId(eventPlayer);
    if (pid === undefined) return;
    const root = ensureLoadingOverlayForPlayer(eventPlayer);
    if (!root) return;
    safeSetUIWidgetVisible(root, true);
    safeSetUIWidgetVisible(safeFind(joinPromptPanelName(pid)), true);
    safeSetUIWidgetVisible(safeFind(joinPromptTitleName(pid)), true);
    safeSetUIWidgetVisible(safeFind(joinPromptSubtitleName(pid)), true);
    safeSetUIWidgetVisible(safeFind(joinPromptBodyName(pid)), true);
    safeSetUIWidgetVisible(safeFind(joinPromptDetailName(pid)), true);
    safeSetUITextLabel(safeFind(joinPromptBodyName(pid)), msg(mod.stringkeys.twl.hud.branding.subtitle));
    safeSetUITextLabel(safeFind(joinPromptDetailName(pid)), msg(mod.stringkeys.twl.ui.customScriptsLoading));
}

//#endregion ----------------- Loading Overlay - Layout --------------------
