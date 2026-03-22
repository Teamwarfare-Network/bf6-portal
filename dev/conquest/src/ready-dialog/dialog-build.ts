// @ts-nocheck
// Module: ready-dialog/dialog-build -- ready dialog root/container assembly and section orchestration

//#region -------------------- UI - Ready Up Dialog (construction) --------------------

const READY_DIALOG_LAYOUT_VERSION = 12;

// Refreshes ready-dialog section content in the same order for both cached reopen and first reveal.
// Admin widgets are ensured hidden first so content refresh does not visibly trickle child widgets.
function refreshReadyDialogSectionsForReveal(
    eventPlayer: mod.Player,
    playerId: number,
    containerBase: mod.UIWidget,
    reveal: boolean
): void {
    ensureAdminPanelWidgets(eventPlayer, playerId, containerBase, false);
    if (!reveal) return;
    // CQ_Bug_18: cached ready-dialog reveal should be a pure visibility flip.
    // The hidden prebuild path already owns section construction and initial labels.
    // Avoid any additional reveal-time text writes here.
}

// Applies the final ready-dialog visibility state once the dialog tree and content are fully prepared.
// This keeps cached reopen and first-build reveal on the same ownership path.
function finalizeReadyDialogVisibility(
    eventPlayer: mod.Player,
    playerId: number,
    containerBase: mod.UIWidget,
    reveal: boolean
): void {
    mod.SetUIWidgetVisible(containerBase, reveal);
    const borderTop = safeFind(UI_READY_DIALOG_BORDER_TOP_ID + playerId);
    if (borderTop) mod.SetUIWidgetVisible(borderTop, reveal);
    const borderBottom = safeFind(UI_READY_DIALOG_BORDER_BOTTOM_ID + playerId);
    if (borderBottom) mod.SetUIWidgetVisible(borderBottom, reveal);
    const borderLeft = safeFind(UI_READY_DIALOG_BORDER_LEFT_ID + playerId);
    if (borderLeft) mod.SetUIWidgetVisible(borderLeft, reveal);
    const borderRight = safeFind(UI_READY_DIALOG_BORDER_RIGHT_ID + playerId);
    if (borderRight) mod.SetUIWidgetVisible(borderRight, reveal);
    const debug = safeFind(UI_READY_DIALOG_DEBUG_TIMELIMIT_ID + playerId);
    if (debug) mod.SetUIWidgetVisible(debug, reveal && SHOW_DEBUG_TIMELIMIT);
    const mapLabel = safeFind(UI_READY_DIALOG_MAP_LABEL_ID + playerId);
    if (mapLabel) mod.SetUIWidgetVisible(mapLabel, reveal);
    const mapValue = safeFind(UI_READY_DIALOG_MAP_VALUE_ID + playerId);
    if (mapValue) mod.SetUIWidgetVisible(mapValue, reveal);
    const toggleButton = safeFind(UI_ADMIN_PANEL_BUTTON_ID + playerId);
    const toggleLabel = safeFind(UI_ADMIN_PANEL_BUTTON_LABEL_ID + playerId);
    const toggleBorder = safeFind(UI_ADMIN_PANEL_BUTTON_ID + playerId + "_BORDER");
    if (!toggleButton || !toggleLabel || !toggleBorder) {
        ensureAdminPanelWidgets(eventPlayer, playerId, containerBase, reveal);
        return;
    }
    safeSetUIWidgetVisible(toggleButton, reveal);
    safeSetUIWidgetVisible(toggleLabel, reveal);
    safeSetUIWidgetVisible(toggleBorder, reveal);
}

// Marks the cached ready-dialog shell as built for the current layout version after a successful build/reveal pass.
function markReadyDialogLayoutBuilt(playerId: number): void {
    State.players.readyDialogData[playerId].uiBuilt = true;
    State.players.readyDialogData[playerId].uiLayoutVersion = READY_DIALOG_LAYOUT_VERSION;
}

// Refreshes cached ready-dialog content while the dialog is still hidden.
// This keeps open/reveal as a pure visibility flip while ensuring roster/button/config content is fresh.
function refreshReadyDialogSectionsWhileHidden(
    eventPlayer: mod.Player,
    playerId: number,
    containerBase: mod.UIWidget
): void {
    ensureAdminPanelWidgets(eventPlayer, playerId, containerBase, false);
    // CQ_Bug_18: cached ready-dialog open must remain a pure reveal path.
    // Hidden dialog caches are invalidated when roster/map state changes underneath them,
    // so next open rebuilds fresh instead of relabeling a stale cached tree here.
}

// Ensures the ready-dialog tree exists in a hidden state so later open paths can stay near-pure reveal.
function ensureReadyDialogUiBuiltHidden(eventPlayer: mod.Player): mod.UIWidget | undefined {
    const playerId = mod.GetObjId(eventPlayer);
    if (!State.players.readyDialogData[playerId]) initReadyDialogData(eventPlayer);
    const state = State.players.readyDialogData[playerId];
    const existingBase = safeFind(UI_READY_DIALOG_CONTAINER_BASE_ID + playerId) as mod.UIWidget | undefined;
    if (!state?.uiBuilt || !existingBase || state.uiLayoutVersion !== READY_DIALOG_LAYOUT_VERSION) {
        createReadyDialogUI(eventPlayer, false);
    }
    return safeFind(UI_READY_DIALOG_CONTAINER_BASE_ID + playerId) as mod.UIWidget | undefined;
}

// Shows the ready dialog from the builder-owned lifecycle path after ensuring the hidden tree already exists.
function showReadyDialogUI(eventPlayer: mod.Player): mod.UIWidget | undefined {
    const playerId = mod.GetObjId(eventPlayer);
    const dialogRoot = ensureReadyDialogUiBuiltHidden(eventPlayer);
    if (!dialogRoot) return undefined;
    refreshReadyDialogSectionsWhileHidden(eventPlayer, playerId, dialogRoot as mod.UIWidget);
    State.players.readyDialogData[playerId].dialogVisible = true;
    finalizeReadyDialogVisibility(eventPlayer, playerId, dialogRoot as mod.UIWidget, true);
    markReadyDialogLayoutBuilt(playerId);
    return dialogRoot as mod.UIWidget;
}

// Legacy function name is preserved to avoid call-site churn.
// Function name intentionally preserved to avoid call-site churn.
function createReadyDialogUI(eventPlayer: mod.Player, reveal: boolean = true) {
    // Steps:
    // 1) Ensure per-player dialog root exists
    // 2) Build left team panel widgets
    // 3) Build right team panel widgets
    // 4) Build admin panel widgets + bind button IDs
    // 5) Finalize visibility / default states

    // UI layout maps (per panel):
    // - Left panel: Team 1 roster / interaction surface (layout-driven).
    // - Right panel: Team 2 roster / interaction surface (layout-driven).
    // - Admin panel: Tunable controls that mutate authoritative state; rows are placed via row0Y + N * (buttonSizeY + rowSpacingY).
    // Layout rule: if a label wraps or overlaps, adjust labelSizeX or text size before touching row math.

    const playerId = mod.GetObjId(eventPlayer);
    if (!State.players.readyDialogData[playerId]) initReadyDialogData(eventPlayer);
    const readyDialogState = State.players.readyDialogData[playerId];
    // UI caching (opt #1): if this player already built the dialog once, just show it again.
    // This avoids recreating ~100 widgets on every open and makes dialog open near-instant after first build.
    const existingBase = safeFind(UI_READY_DIALOG_CONTAINER_BASE_ID + playerId);
    if (existingBase && readyDialogState && readyDialogState.uiLayoutVersion !== READY_DIALOG_LAYOUT_VERSION) {
        destroyReadyDialogUI(playerId);
        readyDialogState.uiBuilt = false;
        readyDialogState.adminPanelBuilt = false;
        readyDialogState.uiLayoutVersion = READY_DIALOG_LAYOUT_VERSION;
    }
    const rebuiltBase = safeFind(UI_READY_DIALOG_CONTAINER_BASE_ID + playerId);
    if (rebuiltBase) {
        refreshReadyDialogSectionsForReveal(eventPlayer, playerId, rebuiltBase as mod.UIWidget, reveal);
        finalizeReadyDialogVisibility(eventPlayer, playerId, rebuiltBase as mod.UIWidget, reveal);
        markReadyDialogLayoutBuilt(playerId);
        return;
    }

    const CONTAINER_BASE_ID = UI_READY_DIALOG_CONTAINER_BASE_ID + playerId;
    const BORDER_TOP_ID = UI_READY_DIALOG_BORDER_TOP_ID + playerId;
    const BORDER_BOTTOM_ID = UI_READY_DIALOG_BORDER_BOTTOM_ID + playerId;
    const BORDER_LEFT_ID = UI_READY_DIALOG_BORDER_LEFT_ID + playerId;
    const BORDER_RIGHT_ID = UI_READY_DIALOG_BORDER_RIGHT_ID + playerId;
    const CONTAINER_BORDER_PADDING = 1;
    const CONTAINER_BORDER_THICKNESS = 2;
    const CONTAINER_BORDER_OVERLAP = 2;
    const CONTAINER_WIDTH = READY_DIALOG_CONTAINER_WIDTH;
    const CONTAINER_HEIGHT = 700;

    const BUTTON_CANCEL_ID = UI_READY_DIALOG_BUTTON_CANCEL_ID + playerId;
    const BUTTON_CANCEL_LABEL_ID = UI_READY_DIALOG_BUTTON_CANCEL_LABEL_ID + playerId;

    mod.AddUIContainer(
        CONTAINER_BASE_ID,
        mod.CreateVector(0, 0, 0),
        mod.CreateVector(CONTAINER_WIDTH, CONTAINER_HEIGHT, 0),
        mod.UIAnchor.Center,
        mod.GetUIRoot(),
        false,
        10,
        mod.CreateVector(0, 0, 0),
        0.995,
        mod.UIBgFill.Blur,
        mod.UIDepth.AboveGameUI,
        eventPlayer
    );
    const CONTAINER_BASE = safeFind(CONTAINER_BASE_ID);
    if (!CONTAINER_BASE) return;
    mod.SetUIWidgetBgAlpha(CONTAINER_BASE, 0.995); // Force darker overlay (some clients render blur lighter)

    const borderHalfWidth = (CONTAINER_WIDTH / 2) + CONTAINER_BORDER_PADDING + (CONTAINER_BORDER_THICKNESS / 2);
    const borderHalfHeight = (CONTAINER_HEIGHT / 2) + CONTAINER_BORDER_PADDING + (CONTAINER_BORDER_THICKNESS / 2);
    const borderLineWidth = CONTAINER_WIDTH + (CONTAINER_BORDER_PADDING * 2) + (CONTAINER_BORDER_OVERLAP * 2);
    const borderLineHeight = CONTAINER_HEIGHT + (CONTAINER_BORDER_PADDING * 2) + (CONTAINER_BORDER_OVERLAP * 2);

    // Top border line
    mod.AddUIContainer(
        BORDER_TOP_ID,
        mod.CreateVector(0, -borderHalfHeight, 0),
        mod.CreateVector(borderLineWidth, CONTAINER_BORDER_THICKNESS, 0),
        mod.UIAnchor.Center,
        CONTAINER_BASE,
        false,
        0,
        READY_DIALOG_BORDER_COLOR,
        1,
        mod.UIBgFill.Solid,
        mod.UIDepth.AboveGameUI,
        eventPlayer
    );

    // Bottom border line
    mod.AddUIContainer(
        BORDER_BOTTOM_ID,
        mod.CreateVector(0, borderHalfHeight, 0),
        mod.CreateVector(borderLineWidth, CONTAINER_BORDER_THICKNESS, 0),
        mod.UIAnchor.Center,
        CONTAINER_BASE,
        false,
        0,
        READY_DIALOG_BORDER_COLOR,
        1,
        mod.UIBgFill.Solid,
        mod.UIDepth.AboveGameUI,
        eventPlayer
    );

    // Left border line
    mod.AddUIContainer(
        BORDER_LEFT_ID,
        mod.CreateVector(-borderHalfWidth, 0, 0),
        mod.CreateVector(CONTAINER_BORDER_THICKNESS, borderLineHeight, 0),
        mod.UIAnchor.Center,
        CONTAINER_BASE,
        false,
        0,
        READY_DIALOG_BORDER_COLOR,
        1,
        mod.UIBgFill.Solid,
        mod.UIDepth.AboveGameUI,
        eventPlayer
    );

    // Right border line
    mod.AddUIContainer(
        BORDER_RIGHT_ID,
        mod.CreateVector(borderHalfWidth, 0, 0),
        mod.CreateVector(CONTAINER_BORDER_THICKNESS, borderLineHeight, 0),
        mod.UIAnchor.Center,
        CONTAINER_BASE,
        false,
        0,
        READY_DIALOG_BORDER_COLOR,
        1,
        mod.UIBgFill.Solid,
        mod.UIDepth.AboveGameUI,
        eventPlayer
    );

    //#endregion -------------------- UI - Ready Up Dialog (construction) --------------------



    //#region -------------------- Ready Dialog (Roster UI) -  (header + team rosters) --------------------

    buildReadyDialogHeaderAndMapSection(eventPlayer, CONTAINER_BASE, playerId);

    buildReadyDialogModeConfigSection(
        eventPlayer,
        CONTAINER_BASE,
        playerId
    );

    buildReadyDialogRosterSection(eventPlayer, CONTAINER_BASE, playerId);

    //#endregion ----------------- Ready Dialog (Roster UI) -  (header + team rosters) --------------------

    

    buildReadyDialogBottomButtonsSection(
        eventPlayer,
        CONTAINER_BASE,
        playerId,
        BUTTON_CANCEL_ID,
        BUTTON_CANCEL_LABEL_ID
    );

    refreshReadyDialogSectionsForReveal(eventPlayer, playerId, CONTAINER_BASE, reveal);
    // Reveal only after the full dialog tree is built and labels refreshed.
    finalizeReadyDialogVisibility(eventPlayer, playerId, CONTAINER_BASE, reveal);
    markReadyDialogLayoutBuilt(playerId);
}

//#endregion ----------------- Dialog Buttons (Left Side) - Cancel --------------------
