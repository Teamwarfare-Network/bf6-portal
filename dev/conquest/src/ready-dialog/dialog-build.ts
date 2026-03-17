// @ts-nocheck
// Module: ready-dialog/dialog-build -- ready dialog root/container assembly and section orchestration

//#region -------------------- UI - Ready Up Dialog (construction) --------------------

const readyDialogUiWarmCacheTokenByPid: Record<number, number> = {};
const READY_DIALOG_LAYOUT_VERSION = 12;

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
        if (reveal) {
            ensureAdminPanelWidgets(eventPlayer, playerId, rebuiltBase as mod.UIWidget, false);
            refreshReadyDialogButtonTextForPid(eventPlayer, playerId, rebuiltBase as mod.UIWidget);
            updateReadyDialogMapLabelForPid(playerId);
            updateReadyDialogModeConfigForPid(playerId);
            refreshReadyDialogRosterForViewer(eventPlayer, playerId);
            updateReadyToggleButtonForViewer(eventPlayer, playerId);
        } else {
            ensureAdminPanelWidgets(eventPlayer, playerId, rebuiltBase as mod.UIWidget, false);
        }
        mod.SetUIWidgetVisible(rebuiltBase, reveal);
        const existingBorderTop = safeFind(UI_READY_DIALOG_BORDER_TOP_ID + playerId);
        if (existingBorderTop) mod.SetUIWidgetVisible(existingBorderTop, reveal);
        const existingBorderBottom = safeFind(UI_READY_DIALOG_BORDER_BOTTOM_ID + playerId);
        if (existingBorderBottom) mod.SetUIWidgetVisible(existingBorderBottom, reveal);
        const existingBorderLeft = safeFind(UI_READY_DIALOG_BORDER_LEFT_ID + playerId);
        if (existingBorderLeft) mod.SetUIWidgetVisible(existingBorderLeft, reveal);
        const existingBorderRight = safeFind(UI_READY_DIALOG_BORDER_RIGHT_ID + playerId);
        if (existingBorderRight) mod.SetUIWidgetVisible(existingBorderRight, reveal);
        const existingDebug = safeFind(UI_READY_DIALOG_DEBUG_TIMELIMIT_ID + playerId);
        if (existingDebug) mod.SetUIWidgetVisible(existingDebug, reveal && SHOW_DEBUG_TIMELIMIT);
        const existingMapLabel = safeFind(UI_READY_DIALOG_MAP_LABEL_ID + playerId);
        if (existingMapLabel) mod.SetUIWidgetVisible(existingMapLabel, reveal);
        const existingMapValue = safeFind(UI_READY_DIALOG_MAP_VALUE_ID + playerId);
        if (existingMapValue) mod.SetUIWidgetVisible(existingMapValue, reveal);
        ensureAdminPanelWidgets(eventPlayer, playerId, rebuiltBase as mod.UIWidget, reveal);
        State.players.readyDialogData[playerId].uiBuilt = true;
        State.players.readyDialogData[playerId].uiLayoutVersion = READY_DIALOG_LAYOUT_VERSION;
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
    const CONTAINER_BASE = mod.FindUIWidgetWithName(CONTAINER_BASE_ID, mod.GetUIRoot());
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

    if (reveal) {
        ensureAdminPanelWidgets(eventPlayer, playerId, CONTAINER_BASE, false);
        refreshReadyDialogButtonTextForPid(eventPlayer, playerId, CONTAINER_BASE);
        updateReadyDialogMapLabelForPid(playerId);
        updateReadyDialogModeConfigForPid(playerId);
        refreshReadyDialogRosterForViewer(eventPlayer, playerId);
        updateReadyToggleButtonForViewer(eventPlayer, playerId);
    } else {
        ensureAdminPanelWidgets(eventPlayer, playerId, CONTAINER_BASE, false);
    }
    // Reveal only after the full dialog tree is built and labels refreshed.
    mod.SetUIWidgetVisible(CONTAINER_BASE, reveal);
    const builtBorderTop = safeFind(BORDER_TOP_ID);
    if (builtBorderTop) mod.SetUIWidgetVisible(builtBorderTop, reveal);
    const builtBorderBottom = safeFind(BORDER_BOTTOM_ID);
    if (builtBorderBottom) mod.SetUIWidgetVisible(builtBorderBottom, reveal);
    const builtBorderLeft = safeFind(BORDER_LEFT_ID);
    if (builtBorderLeft) mod.SetUIWidgetVisible(builtBorderLeft, reveal);
    const builtBorderRight = safeFind(BORDER_RIGHT_ID);
    if (builtBorderRight) mod.SetUIWidgetVisible(builtBorderRight, reveal);
    const builtDebug = safeFind(UI_READY_DIALOG_DEBUG_TIMELIMIT_ID + playerId);
    if (builtDebug) mod.SetUIWidgetVisible(builtDebug, reveal && SHOW_DEBUG_TIMELIMIT);
    const builtMapLabel = safeFind(UI_READY_DIALOG_MAP_LABEL_ID + playerId);
    if (builtMapLabel) mod.SetUIWidgetVisible(builtMapLabel, reveal);
    const builtMapValue = safeFind(UI_READY_DIALOG_MAP_VALUE_ID + playerId);
    if (builtMapValue) mod.SetUIWidgetVisible(builtMapValue, reveal);
    ensureAdminPanelWidgets(eventPlayer, playerId, CONTAINER_BASE, reveal);
    State.players.readyDialogData[playerId].uiBuilt = true;
    State.players.readyDialogData[playerId].uiLayoutVersion = READY_DIALOG_LAYOUT_VERSION;
}

// Schedules one deferred prebuild/hide pass so first real dialog open uses cached widgets.
// This keeps deploy/join paths responsive while avoiding first-open "trickle" construction.
async function scheduleReadyDialogUiWarmCacheForPlayer(
    eventPlayer: mod.Player,
    delaySeconds: number = 0.25
): Promise<void> {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    const playerId = safeGetPlayerId(eventPlayer);
    if (playerId === undefined) return;
    if (!State.players.readyDialogData[playerId]) initReadyDialogData(eventPlayer);
    const readyData = State.players.readyDialogData[playerId];
    if (!readyData || readyData.uiBuilt || readyData.dialogVisible) return;

    const nextToken = (readyDialogUiWarmCacheTokenByPid[playerId] ?? 0) + 1;
    readyDialogUiWarmCacheTokenByPid[playerId] = nextToken;

    if (delaySeconds > 0) {
        await mod.Wait(delaySeconds);
    }
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    if ((readyDialogUiWarmCacheTokenByPid[playerId] ?? 0) !== nextToken) return;
    const current = State.players.readyDialogData[playerId];
    if (!current || current.uiBuilt || current.dialogVisible) return;

    createReadyDialogUI(eventPlayer, false);
    current.dialogVisible = false;
    current.uiBuilt = true;
}

//#endregion ----------------- Dialog Buttons (Left Side) - Cancel --------------------
