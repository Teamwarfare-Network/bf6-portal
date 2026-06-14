// @ts-nocheck
// Module: ready-dialog — Ready dialog, admin panel, join prompt, aircraft ceiling, countdown

//#region -------------------- UI - Ready Up Dialog (construction) --------------------

// Ensures the Admin Panel toggle button + container exist for this player and are shown/hidden correctly.
// Required for UI caching: we hide these widgets on dialog close (not delete), so reopen can simply re-show them.

// Some UI implementations do not cascade visibility from a container to its children.
// To avoid "ghost" admin widgets appearing when the panel is hidden, we explicitly toggle all admin/tester widgets.
function setAdminPanelChildWidgetsVisible(playerId: number, visible: boolean): void {
    const ids: string[] = [
        // Admin/tester header + row labels
        UI_TEST_HEADER_LABEL_ID,
        UI_TEST_LABEL_LEFT_WINS_ID,
        UI_TEST_LABEL_RIGHT_WINS_ID,
        UI_TEST_LABEL_LEFT_KILLS_ID,
        UI_TEST_LABEL_RIGHT_KILLS_ID,
        UI_TEST_LABEL_ROUND_KILLS_TARGET_ID,
        UI_TEST_VALUE_ROUND_KILLS_TARGET_ID,
        UI_TEST_LABEL_TIES_ID,
        UI_TEST_LABEL_CUR_ROUND_ID,
        UI_TEST_LABEL_CLOCK_TIME_ID,
        UI_ADMIN_LABEL_T1_ROUND_KILLS_ID,
        UI_ADMIN_LABEL_T2_ROUND_KILLS_ID,
        UI_ADMIN_TIEBREAKER_MODE_HEADER_ID,
        UI_ADMIN_TIEBREAKER_MODE_LABEL_ID,
        UI_ADMIN_LIVE_RESPAWN_TEXT_ID,
        UI_ADMIN_CEILING_PUNISH_TEXT_ID,

        // Row +/- buttons
        UI_TEST_BUTTON_LEFT_WINS_DEC_ID, UI_TEST_BUTTON_LEFT_WINS_INC_ID,
        UI_TEST_BUTTON_RIGHT_WINS_DEC_ID, UI_TEST_BUTTON_RIGHT_WINS_INC_ID,
        UI_TEST_BUTTON_LEFT_KILLS_DEC_ID, UI_TEST_BUTTON_LEFT_KILLS_INC_ID,
        UI_TEST_BUTTON_RIGHT_KILLS_DEC_ID, UI_TEST_BUTTON_RIGHT_KILLS_INC_ID,
        UI_TEST_BUTTON_ROUND_KILLS_TARGET_DEC_ID, UI_TEST_BUTTON_ROUND_KILLS_TARGET_INC_ID,
        UI_ADMIN_BUTTON_T1_ROUND_KILLS_DEC_ID, UI_ADMIN_BUTTON_T1_ROUND_KILLS_INC_ID,
        UI_ADMIN_BUTTON_T2_ROUND_KILLS_DEC_ID, UI_ADMIN_BUTTON_T2_ROUND_KILLS_INC_ID,
        UI_ADMIN_TIEBREAKER_MODE_DEC_ID, UI_ADMIN_TIEBREAKER_MODE_INC_ID,
        UI_ADMIN_LIVE_RESPAWN_BUTTON_ID,
        UI_ADMIN_CEILING_PUNISH_BUTTON_ID,
        UI_TEST_BUTTON_TIES_DEC_ID, UI_TEST_BUTTON_TIES_INC_ID,
        UI_TEST_BUTTON_CUR_ROUND_DEC_ID, UI_TEST_BUTTON_CUR_ROUND_INC_ID,
        UI_TEST_BUTTON_CLOCK_TIME_DEC_ID, UI_TEST_BUTTON_CLOCK_TIME_INC_ID,

        // +/- text overlays
        UI_TEST_MINUS_TEXT_ID,
        UI_TEST_PLUS_TEXT_ID,

        // Bottom admin buttons
        UI_TEST_BUTTON_CLOCK_RESET_ID, UI_TEST_RESET_TEXT_ID,
        UI_TEST_BUTTON_ROUND_START_ID, UI_TEST_ROUND_START_TEXT_ID,
        UI_TEST_BUTTON_ROUND_END_ID, UI_TEST_ROUND_END_TEXT_ID,
        UI_TEST_BUTTON_POS_DEBUG_ID, UI_TEST_POS_DEBUG_TEXT_ID,
    ];

    for (const baseId of ids) {
        const w = safeFind(baseId + playerId);
        if (w) mod.SetUIWidgetVisible(w, visible);
        const border = safeFind(baseId + playerId + "_BORDER");
        if (border) mod.SetUIWidgetVisible(border, visible);
    }

}

// Admin Panel lifecycle helper.
// We DO NOT cache the admin panel contents because some engines do not reliably hide container children.
// Instead, we delete the panel container + all children whenever it is closed, and rebuild on-demand.
function deleteAdminPanelUI(playerId: number, deleteToggle: boolean): void {
    // Hide child widgets first (covers any stray children that may have detached from the container).
    setAdminPanelChildWidgetsVisible(playerId, false);

    const adminContainer = safeFind(UI_ADMIN_PANEL_CONTAINER_ID + playerId);
    if (adminContainer) mod.DeleteUIWidget(adminContainer);

    if (deleteToggle) {
        const adminToggle = safeFind(UI_ADMIN_PANEL_BUTTON_ID + playerId);
        if (adminToggle) mod.DeleteUIWidget(adminToggle);
        const adminToggleLabel = safeFind(UI_ADMIN_PANEL_BUTTON_LABEL_ID + playerId);
        if (adminToggleLabel) mod.DeleteUIWidget(adminToggleLabel);
        const adminToggleBorder = safeFind(UI_ADMIN_PANEL_BUTTON_ID + playerId + "_BORDER");
        if (adminToggleBorder) mod.DeleteUIWidget(adminToggleBorder);
    }
}

function ensureAdminPanelWidgets(eventPlayer: mod.Player, playerId: number): void {
    const ADMIN_TOGGLE_BUTTON_ID = UI_ADMIN_PANEL_BUTTON_ID + playerId;
    const ADMIN_TOGGLE_LABEL_ID = UI_ADMIN_PANEL_BUTTON_LABEL_ID + playerId;
    const ADMIN_CONTAINER_ID = UI_ADMIN_PANEL_CONTAINER_ID + playerId;

    // Create toggle button if missing.
    let toggleBtn = safeFind(ADMIN_TOGGLE_BUTTON_ID);
    if (!toggleBtn) {
        const toggleBorder = addOutlinedButton(
            ADMIN_TOGGLE_BUTTON_ID,
            ADMIN_PANEL_TOGGLE_OFFSET_X,
            ADMIN_PANEL_TOGGLE_OFFSET_Y,
            ADMIN_PANEL_TOGGLE_WIDTH,
            ADMIN_PANEL_TOGGLE_HEIGHT,
            mod.UIAnchor.TopRight,
            mod.GetUIRoot(),
            eventPlayer
        );
        toggleBtn = mod.FindUIWidgetWithName(ADMIN_TOGGLE_BUTTON_ID, mod.GetUIRoot());
    }

    // Recreate label to guarantee correct anchor/parenting with outlined border.
    const existingToggleLabel = safeFind(ADMIN_TOGGLE_LABEL_ID);
    if (existingToggleLabel) mod.DeleteUIWidget(existingToggleLabel);
    const adminToggleBorder = safeFind(ADMIN_TOGGLE_BUTTON_ID + "_BORDER");
    const toggleLabel = addCenteredButtonText(
        ADMIN_TOGGLE_LABEL_ID,
        ADMIN_PANEL_TOGGLE_WIDTH,
        ADMIN_PANEL_TOGGLE_HEIGHT,
        mod.Message(mod.stringkeys.twl.adminPanel.buttons.panel),
        eventPlayer,
        adminToggleBorder ?? mod.GetUIRoot()
    );
    if (toggleLabel) {
        mod.SetUITextSize(toggleLabel, 12);
        mod.SetUITextColor(toggleLabel, ADMIN_PANEL_BUTTON_TEXT_COLOR);
        mod.SetUIWidgetDepth(toggleLabel, mod.UIDepth.AboveGameUI);
    }

    // Create admin container if missing.
    let adminContainer = safeFind(ADMIN_CONTAINER_ID);
    if (!adminContainer) {
        mod.AddUIContainer(
            ADMIN_CONTAINER_ID,
            mod.CreateVector(ADMIN_PANEL_OFFSET_X, ADMIN_PANEL_OFFSET_Y, 0),
            mod.CreateVector(ADMIN_PANEL_CONTENT_WIDTH + (ADMIN_PANEL_PADDING * 2), ADMIN_PANEL_HEIGHT + (ADMIN_PANEL_PADDING * 2), 0),
            mod.UIAnchor.TopRight,
            mod.GetUIRoot(),
            false,
            10,
            ADMIN_PANEL_BG_COLOR,
            ADMIN_PANEL_BG_ALPHA,
            ADMIN_PANEL_BG_FILL,
            mod.UIDepth.AboveGameUI,
            eventPlayer
        );
        adminContainer = mod.FindUIWidgetWithName(ADMIN_CONTAINER_ID, mod.GetUIRoot());
    }

    // Admin toggle button should exist only while the Ready Up dialog is open.
    // When caching is enabled, we hide/show rather than recreate.
    if (toggleBtn) mod.SetUIWidgetVisible(toggleBtn, true);
    if (toggleLabel) mod.SetUIWidgetVisible(toggleLabel, true);
    const toggleBorder = safeFind(ADMIN_TOGGLE_BUTTON_ID + "_BORDER");
    if (toggleBorder) mod.SetUIWidgetVisible(toggleBorder, true);

    // Default closed on first build; preserve state on reopen.
    if (!State.players.teamSwitchData[playerId]) initTeamSwitchData(eventPlayer);
    if (!State.players.teamSwitchData[playerId].adminPanelBuilt) {
        State.players.teamSwitchData[playerId].adminPanelVisible = false;
        if (adminContainer) mod.SetUIWidgetVisible(adminContainer, false);
        setAdminPanelChildWidgetsVisible(playerId, false);
    } else {
        const visible = State.players.teamSwitchData[playerId].adminPanelVisible;
        if (adminContainer) mod.SetUIWidgetVisible(adminContainer, visible);
        setAdminPanelChildWidgetsVisible(playerId, visible);
    }
}

// Atomic visibility flip for the Ready Dialog root + sibling chrome widgets (borders, map
// label/value, debug widget). Both the cold-build path and the cache-hit path call this at the
// end of their work to flip the dialog visible in one tick rather than letting widgets pop in
// one-by-one as they're built. Mirrors Conquest's finalizeReadyDialogVisibility pattern
// (dialog-build.ts:25-54) which fixed the same flicker class via deliberate atomic reveal.
//
// The dialog's internal widgets (rosters, headers, buttons) are children of containerBase and
// inherit visibility from the parent toggle. Sibling chrome (borders parented to containerBase,
// map label/value/debug widget parented to UIRoot) must be flipped individually.
function finalizeReadyDialogVisibility(
    playerId: number,
    containerBase: mod.UIWidget,
    reveal: boolean
): void {
    mod.SetUIWidgetVisible(containerBase, reveal);
    const borderTop = safeFind(UI_TEAMSWITCH_BORDER_TOP_ID + playerId);
    if (borderTop) mod.SetUIWidgetVisible(borderTop, reveal);
    const borderBottom = safeFind(UI_TEAMSWITCH_BORDER_BOTTOM_ID + playerId);
    if (borderBottom) mod.SetUIWidgetVisible(borderBottom, reveal);
    const borderLeft = safeFind(UI_TEAMSWITCH_BORDER_LEFT_ID + playerId);
    if (borderLeft) mod.SetUIWidgetVisible(borderLeft, reveal);
    const borderRight = safeFind(UI_TEAMSWITCH_BORDER_RIGHT_ID + playerId);
    if (borderRight) mod.SetUIWidgetVisible(borderRight, reveal);
    const mapLabel = safeFind(UI_READY_DIALOG_MAP_LABEL_ID + playerId);
    if (mapLabel) mod.SetUIWidgetVisible(mapLabel, reveal);
    const mapValue = safeFind(UI_READY_DIALOG_MAP_VALUE_ID + playerId);
    if (mapValue) mod.SetUIWidgetVisible(mapValue, reveal);
    const debugWidget = safeFind(UI_TEAMSWITCH_DEBUG_TIMELIMIT_ID + playerId);
    if (debugWidget) mod.SetUIWidgetVisible(debugWidget, reveal && SHOW_DEBUG_TIMELIMIT);
}

// v0.737 Ready dialog roster palette. Build-time BG color (READY_PANEL_T1_BG_COLOR /
// READY_PANEL_T2_BG_COLOR) seeds today's deep blue / deep red; the fixup below overwrites with
// viewer-relative values. The two panels stay where they are (T1 roster on left, T2 roster on
// right) -- only their background color flips per viewer.
function applyViewerTeamColorsForReadyDialogPid(pid: number): void {
    const t1Container = safeFind(UI_READY_DIALOG_TEAM1_CONTAINER_ID + pid);
    const t2Container = safeFind(UI_READY_DIALOG_TEAM2_CONTAINER_ID + pid);
    if (!t1Container && !t2Container) return; // dialog never built for this pid
    // Left container shows T1 roster; right container shows T2 roster. Color follows whether the
    // viewer's team matches the source team that container represents.
    const leftBg = getViewerOwnTeamColor(pid, TeamID.Team1, READY_PANEL_T1_BG_COLOR, READY_PANEL_T2_BG_COLOR);
    const rightBg = getViewerOwnTeamColor(pid, TeamID.Team2, READY_PANEL_T1_BG_COLOR, READY_PANEL_T2_BG_COLOR);
    if (t1Container) try { mod.SetUIWidgetBgColor(t1Container, leftBg); } catch {}
    if (t2Container) try { mod.SetUIWidgetBgColor(t2Container, rightBg); } catch {}
}

function createTeamSwitchUI(eventPlayer: mod.Player) {
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
    // UI caching (opt #1): if this player already built the dialog once, just show it again.
    // This avoids recreating ~100 widgets on every open and makes dialog open near-instant after first build.
    const existingBase = safeFind(UI_TEAMSWITCH_CONTAINER_BASE_ID + playerId);
    if (existingBase) {
        refreshReadyDialogButtonTextForPid(eventPlayer, playerId, existingBase as mod.UIWidget);
        updateReadyDialogModeConfigForPid(playerId);
        ensureAdminPanelWidgets(eventPlayer, playerId);
        // Critical: refresh roster rows with current state BEFORE revealing. Otherwise the
        // dialog reveals with stale row text/visibility from the previous close, then the
        // post-reveal renderReadyDialogForViewer in teamSwitchInteractPointActivated updates
        // them -- visible 1-frame flicker.
        refreshReadyDialogRosterForViewer(eventPlayer, playerId);
        finalizeReadyDialogVisibility(playerId, existingBase, true);
        // v0.737 paint roster panel BGs viewer-relative on dialog re-open too. Team may have
        // changed since the dialog was last built.
        applyViewerTeamColorsForReadyDialogPid(playerId);
        return;
    }

    const CONTAINER_BASE_ID = UI_TEAMSWITCH_CONTAINER_BASE_ID + playerId;
    const BORDER_TOP_ID = UI_TEAMSWITCH_BORDER_TOP_ID + playerId;
    const BORDER_BOTTOM_ID = UI_TEAMSWITCH_BORDER_BOTTOM_ID + playerId;
    const BORDER_LEFT_ID = UI_TEAMSWITCH_BORDER_LEFT_ID + playerId;
    const BORDER_RIGHT_ID = UI_TEAMSWITCH_BORDER_RIGHT_ID + playerId;
    const CONTAINER_BORDER_PADDING = 1;
    const CONTAINER_BORDER_THICKNESS = 2;
    const CONTAINER_BORDER_OVERLAP = 2;
    const CONTAINER_WIDTH = 1300;
    const CONTAINER_HEIGHT = 700;
    const READY_ROSTER_PANEL_WIDTH = 580;
    const READY_ROSTER_PANEL_HEIGHT = 440;
    const READY_ROSTER_PANEL_GAP = 40;
    const READY_ROSTER_PANEL_MARGIN = 40;
    const READY_ROSTER_PANEL_Y = 175;

    //const BUTTON_TEAM1_ID = UI_TEAMSWITCH_BUTTON_TEAM1_ID + playerId; //old button/dead
    //const BUTTON_TEAM1_LABEL_ID = UI_TEAMSWITCH_BUTTON_TEAM1_LABEL_ID + playerId; //old button/dead

    //const BUTTON_TEAM2_ID = UI_TEAMSWITCH_BUTTON_TEAM2_ID + playerId; //old button/dead
    //const BUTTON_TEAM2_LABEL_ID = UI_TEAMSWITCH_BUTTON_TEAM2_LABEL_ID + playerId; //old button/dead

    //const BUTTON_SPECTATE_ID = UI_TEAMSWITCH_BUTTON_SPECTATE_ID + playerId; //old button/dead
    //const BUTTON_SPECTATE_LABEL_ID = UI_TEAMSWITCH_BUTTON_SPECTATE_LABEL_ID + playerId; //old button/dead

    const BUTTON_CANCEL_ID = UI_TEAMSWITCH_BUTTON_CANCEL_ID + playerId;
    const BUTTON_CANCEL_LABEL_ID = UI_TEAMSWITCH_BUTTON_CANCEL_LABEL_ID + playerId;

    //const BUTTON_OPTOUT_ID = UI_TEAMSWITCH_BUTTON_OPTOUT_ID + playerId; //old button/dead
    //const BUTTON_OPTOUT_LABEL_ID = UI_TEAMSWITCH_BUTTON_OPTOUT_LABEL_ID + playerId; //old button/dead

    // Build root HIDDEN; atomic reveal happens via finalizeReadyDialogVisibility at the end.
    // Children parented to CONTAINER_BASE inherit hidden-ness from the parent (cascade), so they
    // build "visible: true" but stay visually hidden until the parent flip. Sibling chrome
    // (borders, map label/value, debug widget) is also built hidden and flipped at the same time.
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

    // Borders built HIDDEN; flipped together with root via finalizeReadyDialogVisibility at end.
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

    // Header rows (string-backed for easy iteration).
    const READY_HEADER_ID = UI_READY_DIALOG_HEADER_ID + playerId;
    const READY_HEADER2_ID = UI_READY_DIALOG_HEADER2_ID + playerId;
    const READY_HEADER3_ID = UI_READY_DIALOG_HEADER3_ID + playerId;
    const READY_HEADER4_ID = UI_READY_DIALOG_HEADER4_ID + playerId;
    const READY_HEADER5_ID = UI_READY_DIALOG_HEADER5_ID + playerId;
    const READY_HEADER6_ID = UI_READY_DIALOG_HEADER6_ID + playerId;

    mod.AddUIText(
        READY_HEADER_ID,
        //If Anchored at TopLeft, X is left offset - increase to move right, Y is down offset - increase to move down
        mod.CreateVector(-11, -5, 0),
        mod.CreateVector(900, 22, 0),
        mod.UIAnchor.TopLeft,
        mod.Message(mod.stringkeys.twl.readyDialog.header),
        eventPlayer
    );
    const READY_HEADER = mod.FindUIWidgetWithName(READY_HEADER_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(READY_HEADER, 0);
    mod.SetUITextSize(READY_HEADER, 20);
    applyReadyDialogLabelTextColor(READY_HEADER);
    mod.SetUIWidgetParent(READY_HEADER, CONTAINER_BASE);

    mod.AddUIText(
        READY_HEADER2_ID,
        mod.CreateVector(-11, 19, 0),
        mod.CreateVector(900, 20, 0),
        mod.UIAnchor.TopLeft,
        mod.Message(mod.stringkeys.twl.readyDialog.header2),
        eventPlayer
    );
    const READY_HEADER2 = mod.FindUIWidgetWithName(READY_HEADER2_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(READY_HEADER2, 0);
    mod.SetUITextSize(READY_HEADER2, 16);
    applyReadyDialogLabelTextColor(READY_HEADER2);
    mod.SetUIWidgetParent(READY_HEADER2, CONTAINER_BASE);

    mod.AddUIText(
        READY_HEADER3_ID,
        mod.CreateVector(-11, 39, 0),
        mod.CreateVector(900, 20, 0),
        mod.UIAnchor.TopLeft,
        mod.Message(mod.stringkeys.twl.readyDialog.header3),
        eventPlayer
    );
    const READY_HEADER3 = mod.FindUIWidgetWithName(READY_HEADER3_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(READY_HEADER3, 0);
    mod.SetUITextSize(READY_HEADER3, 16);
    applyReadyDialogLabelTextColor(READY_HEADER3);
    mod.SetUIWidgetParent(READY_HEADER3, CONTAINER_BASE);

    // Header 4 preserves the same vertical spacing as header 2 -> header 3.
    mod.AddUIText(
        READY_HEADER4_ID,
        mod.CreateVector(-11, 59, 0),
        mod.CreateVector(900, 20, 0),
        mod.UIAnchor.TopLeft,
        mod.Message(mod.stringkeys.twl.readyDialog.header4, Math.floor(VEHICLE_SPAWNER_KEEP_ALIVE_ABANDON_RADIUS)),
        eventPlayer
    );
    const READY_HEADER4 = mod.FindUIWidgetWithName(READY_HEADER4_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(READY_HEADER4, 0);
    mod.SetUITextSize(READY_HEADER4, 16);
    applyReadyDialogLabelTextColor(READY_HEADER4);
    mod.SetUIWidgetParent(READY_HEADER4, CONTAINER_BASE);

    mod.AddUIText(
        READY_HEADER5_ID,
        mod.CreateVector(-11, 79, 0),
        mod.CreateVector(900, 20, 0),
        mod.UIAnchor.TopLeft,
        mod.Message(mod.stringkeys.twl.readyDialog.header5),
        eventPlayer
    );
    const READY_HEADER5 = mod.FindUIWidgetWithName(READY_HEADER5_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(READY_HEADER5, 0);
    mod.SetUITextSize(READY_HEADER5, 16);
    applyReadyDialogLabelTextColor(READY_HEADER5);
    mod.SetUIWidgetParent(READY_HEADER5, CONTAINER_BASE);

    mod.AddUIText(
        READY_HEADER6_ID,
        mod.CreateVector(-11, 99, 0),
        mod.CreateVector(900, 20, 0),
        mod.UIAnchor.TopLeft,
        mod.Message(mod.stringkeys.twl.readyDialog.header6),
        eventPlayer
    );
    const READY_HEADER6 = mod.FindUIWidgetWithName(READY_HEADER6_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(READY_HEADER6, 0);
    mod.SetUITextSize(READY_HEADER6, 16);
    applyReadyDialogLabelTextColor(READY_HEADER6);
    mod.SetUIWidgetParent(READY_HEADER6, CONTAINER_BASE);

    const READY_MAP_LABEL_ID = UI_READY_DIALOG_MAP_LABEL_ID + playerId;
    const READY_MAP_VALUE_ID = UI_READY_DIALOG_MAP_VALUE_ID + playerId;
    const mapLabelX = ADMIN_PANEL_OFFSET_X + ADMIN_PANEL_TOGGLE_WIDTH + 70;
    const mapValueX = ADMIN_PANEL_OFFSET_X + ADMIN_PANEL_TOGGLE_WIDTH - 63; //-X moves right
    const mapLabelY = ADMIN_PANEL_OFFSET_Y;
    const mapLabelSizeX = 60;
    const mapValueSizeX = 170;

    mod.AddUIText(
        READY_MAP_LABEL_ID,
        mod.CreateVector(mapLabelX, mapLabelY, 0),
        mod.CreateVector(mapLabelSizeX, 20, 0),
        mod.UIAnchor.TopRight,
        mod.Message(mod.stringkeys.twl.readyDialog.mapLabel),
        eventPlayer
    );
    const READY_MAP_LABEL = mod.FindUIWidgetWithName(READY_MAP_LABEL_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(READY_MAP_LABEL, 0);
    mod.SetUITextSize(READY_MAP_LABEL, 12);
    applyReadyDialogLabelTextColor(READY_MAP_LABEL);
    mod.SetUIWidgetParent(READY_MAP_LABEL, mod.GetUIRoot());
    // Sibling chrome (parented to UIRoot, not CONTAINER_BASE) -- hide individually; revealed
    // atomically by finalizeReadyDialogVisibility at end of build.
    if (READY_MAP_LABEL) mod.SetUIWidgetVisible(READY_MAP_LABEL, false);

    mod.AddUIText(
        READY_MAP_VALUE_ID,
        mod.CreateVector(mapValueX, mapLabelY, 0),
        mod.CreateVector(mapValueSizeX, 20, 0),
        mod.UIAnchor.TopRight,
        mod.Message(getMapNameKey(ACTIVE_MAP_KEY)),
        eventPlayer
    );
    const READY_MAP_VALUE = mod.FindUIWidgetWithName(READY_MAP_VALUE_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(READY_MAP_VALUE, 0);
    mod.SetUITextSize(READY_MAP_VALUE, 12);
    applyReadyDialogLabelTextColor(READY_MAP_VALUE);
    mod.SetUIWidgetParent(READY_MAP_VALUE, mod.GetUIRoot());
    if (READY_MAP_VALUE) mod.SetUIWidgetVisible(READY_MAP_VALUE, false);
    updateReadyDialogMapLabelForPid(playerId);

    // Best-of rounds control (top-right): minus button, dynamic label, plus button.
    const BESTOF_DEC_ID = UI_READY_DIALOG_BESTOF_DEC_ID + playerId;
    const BESTOF_DEC_LABEL_ID = UI_READY_DIALOG_BESTOF_DEC_LABEL_ID + playerId;
    const BESTOF_LABEL_ID = UI_READY_DIALOG_BESTOF_LABEL_ID + playerId;
    const BESTOF_INC_ID = UI_READY_DIALOG_BESTOF_INC_ID + playerId;
    const BESTOF_INC_LABEL_ID = UI_READY_DIALOG_BESTOF_INC_LABEL_ID + playerId;

    const bestOfY = -3;
    const bestOfButtonSizeX = READY_DIALOG_SMALL_BUTTON_WIDTH;
    const bestOfButtonSizeY = READY_DIALOG_SMALL_BUTTON_HEIGHT;
    const bestOfLabelSizeX = 170;
    const bestOfLabelSizeY = 24;
    const leftSectionGapX = READY_DIALOG_SMALL_BUTTON_WIDTH + 12;
    const leftSectionButtonSpread = 18;
    const leftSectionShiftX = 128 + leftSectionGapX + leftSectionButtonSpread;
    const leftSectionLeftButtonX = 125 + leftSectionShiftX + leftSectionButtonSpread;
    const leftSectionRightButtonX = -3 + leftSectionShiftX - leftSectionButtonSpread;
    const leftSectionValueX = -58 + leftSectionShiftX;
    const leftSectionLabelGap = 4;
    const leftSectionLabelX = leftSectionLeftButtonX + bestOfButtonSizeX + leftSectionLabelGap;
    const leftSectionLabelWidth = 110;
    const leftSectionValueWidth = 200;
    const leftSectionRowGap = bestOfButtonSizeY + 6;
    const rightSectionRightButtonX = -3;
    const confirmButtonWidth = READY_DIALOG_CONFIRM_BUTTON_WIDTH;
    const resetButtonWidth = READY_DIALOG_RESET_BUTTON_WIDTH;
    const resetButtonX = rightSectionRightButtonX + READY_DIALOG_RESET_BUTTON_OFFSET_X;
    const confirmButtonX = resetButtonX + resetButtonWidth + READY_DIALOG_CONFIRM_BUTTON_GAP;

    const GAME_MODE_LABEL_ID = UI_READY_DIALOG_MODE_GAME_LABEL_ID + playerId;
    const GAME_MODE_DEC_ID = UI_READY_DIALOG_MODE_GAME_DEC_ID + playerId;
    const GAME_MODE_DEC_LABEL_ID = UI_READY_DIALOG_MODE_GAME_DEC_LABEL_ID + playerId;
    const GAME_MODE_VALUE_ID = UI_READY_DIALOG_MODE_GAME_VALUE_ID + playerId;
    const GAME_MODE_INC_ID = UI_READY_DIALOG_MODE_GAME_INC_ID + playerId;
    const GAME_MODE_INC_LABEL_ID = UI_READY_DIALOG_MODE_GAME_INC_LABEL_ID + playerId;

    const MODE_SETTINGS_LABEL_ID = UI_READY_DIALOG_MODE_SETTINGS_LABEL_ID + playerId;
    const MODE_SETTINGS_DEC_ID = UI_READY_DIALOG_MODE_SETTINGS_DEC_ID + playerId;
    const MODE_SETTINGS_DEC_LABEL_ID = UI_READY_DIALOG_MODE_SETTINGS_DEC_LABEL_ID + playerId;
    const MODE_SETTINGS_VALUE_ID = UI_READY_DIALOG_MODE_SETTINGS_VALUE_ID + playerId;
    const MODE_SETTINGS_INC_ID = UI_READY_DIALOG_MODE_SETTINGS_INC_ID + playerId;
    const MODE_SETTINGS_INC_LABEL_ID = UI_READY_DIALOG_MODE_SETTINGS_INC_LABEL_ID + playerId;

    const VEHICLE_HEALTH_DEC10_ID = UI_READY_DIALOG_VEHICLE_HEALTH_DEC10_ID + playerId;
    const VEHICLE_HEALTH_DEC10_LABEL_ID = UI_READY_DIALOG_VEHICLE_HEALTH_DEC10_LABEL_ID + playerId;
    const VEHICLE_HEALTH_DEC_ID = UI_READY_DIALOG_VEHICLE_HEALTH_DEC_ID + playerId;
    const VEHICLE_HEALTH_DEC_LABEL_ID = UI_READY_DIALOG_VEHICLE_HEALTH_DEC_LABEL_ID + playerId;
    const VEHICLE_HEALTH_VALUE_ID = UI_READY_DIALOG_VEHICLE_HEALTH_VALUE_ID + playerId;
    const VEHICLE_HEALTH_INC_ID = UI_READY_DIALOG_VEHICLE_HEALTH_INC_ID + playerId;
    const VEHICLE_HEALTH_INC_LABEL_ID = UI_READY_DIALOG_VEHICLE_HEALTH_INC_LABEL_ID + playerId;
    const VEHICLE_HEALTH_INC10_ID = UI_READY_DIALOG_VEHICLE_HEALTH_INC10_ID + playerId;
    const VEHICLE_HEALTH_INC10_LABEL_ID = UI_READY_DIALOG_VEHICLE_HEALTH_INC10_LABEL_ID + playerId;

    // v0.725 Soldier HP per-pid ID locals. Mirror VH shape exactly.
    const SOLDIER_HP_DEC10_ID = UI_READY_DIALOG_SOLDIER_HP_DEC10_ID + playerId;
    const SOLDIER_HP_DEC10_LABEL_ID = UI_READY_DIALOG_SOLDIER_HP_DEC10_LABEL_ID + playerId;
    const SOLDIER_HP_DEC_ID = UI_READY_DIALOG_SOLDIER_HP_DEC_ID + playerId;
    const SOLDIER_HP_DEC_LABEL_ID = UI_READY_DIALOG_SOLDIER_HP_DEC_LABEL_ID + playerId;
    const SOLDIER_HP_VALUE_ID = UI_READY_DIALOG_SOLDIER_HP_VALUE_ID + playerId;
    const SOLDIER_HP_INC_ID = UI_READY_DIALOG_SOLDIER_HP_INC_ID + playerId;
    const SOLDIER_HP_INC_LABEL_ID = UI_READY_DIALOG_SOLDIER_HP_INC_LABEL_ID + playerId;
    const SOLDIER_HP_INC10_ID = UI_READY_DIALOG_SOLDIER_HP_INC10_ID + playerId;
    const SOLDIER_HP_INC10_LABEL_ID = UI_READY_DIALOG_SOLDIER_HP_INC10_LABEL_ID + playerId;

    const VEHICLES_T1_LABEL_ID = UI_READY_DIALOG_MODE_VEHICLES_T1_LABEL_ID + playerId;
    const VEHICLES_T1_DEC_ID = UI_READY_DIALOG_MODE_VEHICLES_T1_DEC_ID + playerId;
    const VEHICLES_T1_DEC_LABEL_ID = UI_READY_DIALOG_MODE_VEHICLES_T1_DEC_LABEL_ID + playerId;
    const VEHICLES_T1_VALUE_ID = UI_READY_DIALOG_MODE_VEHICLES_T1_VALUE_ID + playerId;
    const VEHICLES_T1_INC_ID = UI_READY_DIALOG_MODE_VEHICLES_T1_INC_ID + playerId;
    const VEHICLES_T1_INC_LABEL_ID = UI_READY_DIALOG_MODE_VEHICLES_T1_INC_LABEL_ID + playerId;

    const VEHICLES_T2_LABEL_ID = UI_READY_DIALOG_MODE_VEHICLES_T2_LABEL_ID + playerId;
    const VEHICLES_T2_DEC_ID = UI_READY_DIALOG_MODE_VEHICLES_T2_DEC_ID + playerId;
    const VEHICLES_T2_DEC_LABEL_ID = UI_READY_DIALOG_MODE_VEHICLES_T2_DEC_LABEL_ID + playerId;
    const VEHICLES_T2_VALUE_ID = UI_READY_DIALOG_MODE_VEHICLES_T2_VALUE_ID + playerId;
    const VEHICLES_T2_INC_ID = UI_READY_DIALOG_MODE_VEHICLES_T2_INC_ID + playerId;
    const VEHICLES_T2_INC_LABEL_ID = UI_READY_DIALOG_MODE_VEHICLES_T2_INC_LABEL_ID + playerId;

    const MODE_CONFIRM_ID = UI_READY_DIALOG_MODE_CONFIRM_ID + playerId;
    const MODE_CONFIRM_LABEL_ID = UI_READY_DIALOG_MODE_CONFIRM_LABEL_ID + playerId;
    const MODE_RESET_ID = UI_READY_DIALOG_MODE_RESET_ID + playerId;
    const MODE_RESET_LABEL_ID = UI_READY_DIALOG_MODE_RESET_LABEL_ID + playerId;

    const gameModeY = bestOfY;
    const modeSettingsY = gameModeY + leftSectionRowGap;
    const vehiclesT1Y = modeSettingsY + leftSectionRowGap;
    const vehiclesT2Y = vehiclesT1Y + leftSectionRowGap;
    const confirmY = vehiclesT2Y + leftSectionRowGap + 4;

    addRightAlignedLabel(
        GAME_MODE_LABEL_ID,
        leftSectionLabelX,
        gameModeY,
        leftSectionLabelWidth,
        bestOfLabelSizeY,
        mod.UIAnchor.TopRight,
        mod.Message(mod.stringkeys.twl.readyDialog.gameModeLabel),
        eventPlayer,
        CONTAINER_BASE,
        12
    );

    const gameModeDecBorder = addOutlinedButton(
        GAME_MODE_DEC_ID,
        leftSectionLeftButtonX,
        gameModeY,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        CONTAINER_BASE,
        eventPlayer
    );
    const GAME_MODE_DEC_LABEL = addCenteredButtonText(
        GAME_MODE_DEC_LABEL_ID,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.ui.left),
        eventPlayer,
        gameModeDecBorder ?? CONTAINER_BASE
    );
    if (GAME_MODE_DEC_LABEL) {
        mod.SetUITextSize(GAME_MODE_DEC_LABEL, 14);
    }

    mod.AddUIText(
        GAME_MODE_VALUE_ID,
        mod.CreateVector(leftSectionValueX, gameModeY, 0),
        mod.CreateVector(leftSectionValueWidth, bestOfLabelSizeY, 0),
        mod.UIAnchor.TopRight,
        mod.Message(State.round.modeConfig.gameMode),
        eventPlayer
    );
    const GAME_MODE_VALUE = mod.FindUIWidgetWithName(GAME_MODE_VALUE_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(GAME_MODE_VALUE, 0);
    mod.SetUITextSize(GAME_MODE_VALUE, 12);
    applyReadyDialogLabelTextColor(GAME_MODE_VALUE);
    mod.SetUIWidgetParent(GAME_MODE_VALUE, CONTAINER_BASE);

    const gameModeIncBorder = addOutlinedButton(
        GAME_MODE_INC_ID,
        leftSectionRightButtonX,
        gameModeY,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        CONTAINER_BASE,
        eventPlayer
    );
    const GAME_MODE_INC_LABEL = addCenteredButtonText(
        GAME_MODE_INC_LABEL_ID,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.ui.right),
        eventPlayer,
        gameModeIncBorder ?? CONTAINER_BASE
    );
    if (GAME_MODE_INC_LABEL) {
        mod.SetUITextSize(GAME_MODE_INC_LABEL, 14);
    }

    addRightAlignedLabel(
        MODE_SETTINGS_LABEL_ID,
        leftSectionLabelX,
        modeSettingsY,
        leftSectionLabelWidth,
        bestOfLabelSizeY,
        mod.UIAnchor.TopRight,
        mod.Message(mod.stringkeys.twl.readyDialog.modeSettingsLabel),
        eventPlayer,
        CONTAINER_BASE,
        12
    );

    const modeSettingsDecBorder = addOutlinedButton(
        MODE_SETTINGS_DEC_ID,
        leftSectionLeftButtonX,
        modeSettingsY,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        CONTAINER_BASE,
        eventPlayer
    );
    const MODE_SETTINGS_DEC_LABEL = addCenteredButtonText(
        MODE_SETTINGS_DEC_LABEL_ID,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.ui.left),
        eventPlayer,
        modeSettingsDecBorder ?? CONTAINER_BASE
    );
    if (MODE_SETTINGS_DEC_LABEL) {
        mod.SetUITextSize(MODE_SETTINGS_DEC_LABEL, 14);
    }

    mod.AddUIText(
        MODE_SETTINGS_VALUE_ID,
        mod.CreateVector(leftSectionValueX, modeSettingsY, 0),
        mod.CreateVector(leftSectionValueWidth, bestOfLabelSizeY, 0),
        mod.UIAnchor.TopRight,
        mod.Message(mod.stringkeys.twl.readyDialog.modeSettingAircraftCeilingFormat, Math.floor(State.round.modeConfig.aircraftCeiling)),
        eventPlayer
    );
    const MODE_SETTINGS_VALUE = mod.FindUIWidgetWithName(MODE_SETTINGS_VALUE_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(MODE_SETTINGS_VALUE, 0);
    mod.SetUITextSize(MODE_SETTINGS_VALUE, 12);
    applyReadyDialogLabelTextColor(MODE_SETTINGS_VALUE);
    mod.SetUIWidgetParent(MODE_SETTINGS_VALUE, CONTAINER_BASE);

    const modeSettingsIncBorder = addOutlinedButton(
        MODE_SETTINGS_INC_ID,
        leftSectionRightButtonX,
        modeSettingsY,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        CONTAINER_BASE,
        eventPlayer
    );
    const MODE_SETTINGS_INC_LABEL = addCenteredButtonText(
        MODE_SETTINGS_INC_LABEL_ID,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.ui.right),
        eventPlayer,
        modeSettingsIncBorder ?? CONTAINER_BASE
    );
    if (MODE_SETTINGS_INC_LABEL) {
        mod.SetUITextSize(MODE_SETTINGS_INC_LABEL, 14);
    }

    // Vehicle Health Multiplier knob -- same Y as Mode Settings; positioned to the LEFT of the
    // Mode Settings label. With TopRight anchor, larger X = further left on screen. The VH block
    // occupies (left-to-right visually): [-10] [<] [Health: NNN%] [>] [+10] then a gap, then the
    // Mode Settings row. The +10/-10 outer buttons step by 0.10 (10%); the inner </> step by 0.01 (1%).
    const vehicleHealthOuterGap = 2;
    // Translate the entire VH block (all 5 widgets: -10, <, value, >, +10) right by N game units.
    // Smaller X-from-right (TopRight anchor) = further right on screen. Set this empirically by
    // looking at the rendered position in-game and adjusting. Going up if more rightward shift is
    // needed; down if overlapping Mode Settings label area. Earlier outerGap-only tweaks produced
    // only ~10-unit shifts which were not visibly perceptible.
    const VH_BLOCK_RIGHT_SHIFT = 35;
    const vehicleHealthInnerGap = 4;        // gap between the outer (-10/+10) buttons and the inner (</>) buttons
    const vehicleHealthValueWidth = 100;
    const vehicleHealthWideButtonWidth = 32; // outer -10/+10 buttons are slightly wider than </> to fit 3-char text
    const vehicleHealthInc10X = leftSectionLabelX + leftSectionLabelWidth + vehicleHealthOuterGap - VH_BLOCK_RIGHT_SHIFT;
    const vehicleHealthIncX = vehicleHealthInc10X + vehicleHealthWideButtonWidth + vehicleHealthInnerGap;
    const vehicleHealthValueX = vehicleHealthIncX + bestOfButtonSizeX;
    const vehicleHealthDecX = vehicleHealthValueX + vehicleHealthValueWidth;
    const vehicleHealthDec10X = vehicleHealthDecX + bestOfButtonSizeX + vehicleHealthInnerGap;

    // -10 button (leftmost VH widget)
    const vehicleHealthDec10Border = addOutlinedButton(
        VEHICLE_HEALTH_DEC10_ID,
        vehicleHealthDec10X,
        modeSettingsY,
        vehicleHealthWideButtonWidth,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        CONTAINER_BASE,
        eventPlayer
    );
    const VEHICLE_HEALTH_DEC10_LABEL = addCenteredButtonText(
        VEHICLE_HEALTH_DEC10_LABEL_ID,
        vehicleHealthWideButtonWidth,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.ui.minus10),
        eventPlayer,
        vehicleHealthDec10Border ?? CONTAINER_BASE
    );
    if (VEHICLE_HEALTH_DEC10_LABEL) {
        mod.SetUITextSize(VEHICLE_HEALTH_DEC10_LABEL, 13);
    }

    const vehicleHealthDecBorder = addOutlinedButton(
        VEHICLE_HEALTH_DEC_ID,
        vehicleHealthDecX,
        modeSettingsY,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        CONTAINER_BASE,
        eventPlayer
    );
    const VEHICLE_HEALTH_DEC_LABEL = addCenteredButtonText(
        VEHICLE_HEALTH_DEC_LABEL_ID,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.ui.left),
        eventPlayer,
        vehicleHealthDecBorder ?? CONTAINER_BASE
    );
    if (VEHICLE_HEALTH_DEC_LABEL) {
        mod.SetUITextSize(VEHICLE_HEALTH_DEC_LABEL, 14);
    }

    mod.AddUIText(
        VEHICLE_HEALTH_VALUE_ID,
        mod.CreateVector(vehicleHealthValueX, modeSettingsY, 0),
        mod.CreateVector(vehicleHealthValueWidth, bestOfLabelSizeY, 0),
        mod.UIAnchor.TopRight,
        mod.Message(STR_READY_DIALOG_VEHICLE_HEALTH_FORMAT, Math.round(State.round.modeConfig.vehicleHealthMultiplier * 100)),
        eventPlayer
    );
    const VEHICLE_HEALTH_VALUE = mod.FindUIWidgetWithName(VEHICLE_HEALTH_VALUE_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(VEHICLE_HEALTH_VALUE, 0);
    mod.SetUITextSize(VEHICLE_HEALTH_VALUE, 12);
    applyReadyDialogLabelTextColor(VEHICLE_HEALTH_VALUE);
    mod.SetUIWidgetParent(VEHICLE_HEALTH_VALUE, CONTAINER_BASE);

    const vehicleHealthIncBorder = addOutlinedButton(
        VEHICLE_HEALTH_INC_ID,
        vehicleHealthIncX,
        modeSettingsY,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        CONTAINER_BASE,
        eventPlayer
    );
    const VEHICLE_HEALTH_INC_LABEL = addCenteredButtonText(
        VEHICLE_HEALTH_INC_LABEL_ID,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.ui.right),
        eventPlayer,
        vehicleHealthIncBorder ?? CONTAINER_BASE
    );
    if (VEHICLE_HEALTH_INC_LABEL) {
        mod.SetUITextSize(VEHICLE_HEALTH_INC_LABEL, 14);
    }

    // +10 button (rightmost VH widget; visually just left of the Mode Settings label)
    const vehicleHealthInc10Border = addOutlinedButton(
        VEHICLE_HEALTH_INC10_ID,
        vehicleHealthInc10X,
        modeSettingsY,
        vehicleHealthWideButtonWidth,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        CONTAINER_BASE,
        eventPlayer
    );
    const VEHICLE_HEALTH_INC10_LABEL = addCenteredButtonText(
        VEHICLE_HEALTH_INC10_LABEL_ID,
        vehicleHealthWideButtonWidth,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.ui.plus10),
        eventPlayer,
        vehicleHealthInc10Border ?? CONTAINER_BASE
    );
    if (VEHICLE_HEALTH_INC10_LABEL) {
        mod.SetUITextSize(VEHICLE_HEALTH_INC10_LABEL, 13);
    }

    // v0.725 Soldier HP knob block. Same 5-widget shape and same X-block math as the VH block,
    // but rendered on gameModeY (the Game Mode row above Mode Settings). Lands directly above
    // the VH row in the empty far-left columns of the Game Mode row -- the Game Mode value/buttons
    // sit in the right columns (leftSectionLeftButtonX / leftSectionValueX / leftSectionRightButtonX),
    // so no collision.
    const soldierHpDec10Border = addOutlinedButton(
        SOLDIER_HP_DEC10_ID,
        vehicleHealthDec10X,
        gameModeY,
        vehicleHealthWideButtonWidth,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        CONTAINER_BASE,
        eventPlayer
    );
    const SOLDIER_HP_DEC10_LABEL = addCenteredButtonText(
        SOLDIER_HP_DEC10_LABEL_ID,
        vehicleHealthWideButtonWidth,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.ui.minus10),
        eventPlayer,
        soldierHpDec10Border ?? CONTAINER_BASE
    );
    if (SOLDIER_HP_DEC10_LABEL) {
        mod.SetUITextSize(SOLDIER_HP_DEC10_LABEL, 13);
    }

    const soldierHpDecBorder = addOutlinedButton(
        SOLDIER_HP_DEC_ID,
        vehicleHealthDecX,
        gameModeY,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        CONTAINER_BASE,
        eventPlayer
    );
    const SOLDIER_HP_DEC_LABEL = addCenteredButtonText(
        SOLDIER_HP_DEC_LABEL_ID,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.ui.left),
        eventPlayer,
        soldierHpDecBorder ?? CONTAINER_BASE
    );
    if (SOLDIER_HP_DEC_LABEL) {
        mod.SetUITextSize(SOLDIER_HP_DEC_LABEL, 14);
    }

    mod.AddUIText(
        SOLDIER_HP_VALUE_ID,
        mod.CreateVector(vehicleHealthValueX, gameModeY, 0),
        mod.CreateVector(vehicleHealthValueWidth, bestOfLabelSizeY, 0),
        mod.UIAnchor.TopRight,
        mod.Message(STR_READY_DIALOG_SOLDIER_HP_FORMAT, Math.round(State.round.modeConfig.soldierHpMultiplier * 100)),
        eventPlayer
    );
    const SOLDIER_HP_VALUE = mod.FindUIWidgetWithName(SOLDIER_HP_VALUE_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(SOLDIER_HP_VALUE, 0);
    mod.SetUITextSize(SOLDIER_HP_VALUE, 12);
    applyReadyDialogLabelTextColor(SOLDIER_HP_VALUE);
    mod.SetUIWidgetParent(SOLDIER_HP_VALUE, CONTAINER_BASE);

    const soldierHpIncBorder = addOutlinedButton(
        SOLDIER_HP_INC_ID,
        vehicleHealthIncX,
        gameModeY,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        CONTAINER_BASE,
        eventPlayer
    );
    const SOLDIER_HP_INC_LABEL = addCenteredButtonText(
        SOLDIER_HP_INC_LABEL_ID,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.ui.right),
        eventPlayer,
        soldierHpIncBorder ?? CONTAINER_BASE
    );
    if (SOLDIER_HP_INC_LABEL) {
        mod.SetUITextSize(SOLDIER_HP_INC_LABEL, 14);
    }

    const soldierHpInc10Border = addOutlinedButton(
        SOLDIER_HP_INC10_ID,
        vehicleHealthInc10X,
        gameModeY,
        vehicleHealthWideButtonWidth,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        CONTAINER_BASE,
        eventPlayer
    );
    const SOLDIER_HP_INC10_LABEL = addCenteredButtonText(
        SOLDIER_HP_INC10_LABEL_ID,
        vehicleHealthWideButtonWidth,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.ui.plus10),
        eventPlayer,
        soldierHpInc10Border ?? CONTAINER_BASE
    );
    if (SOLDIER_HP_INC10_LABEL) {
        mod.SetUITextSize(SOLDIER_HP_INC10_LABEL, 13);
    }

    addRightAlignedLabel(
        VEHICLES_T1_LABEL_ID,
        leftSectionLabelX,
        vehiclesT1Y,
        leftSectionLabelWidth,
        bestOfLabelSizeY,
        mod.UIAnchor.TopRight,
        mod.Message(mod.stringkeys.twl.readyDialog.vehiclesLabelFormat, getTeamNameKey(TeamID.Team1)),
        eventPlayer,
        CONTAINER_BASE,
        12
    );

    const vehiclesT1DecBorder = addOutlinedButton(
        VEHICLES_T1_DEC_ID,
        leftSectionLeftButtonX,
        vehiclesT1Y,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        CONTAINER_BASE,
        eventPlayer
    );
    const VEHICLES_T1_DEC_LABEL = addCenteredButtonText(
        VEHICLES_T1_DEC_LABEL_ID,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.ui.left),
        eventPlayer,
        vehiclesT1DecBorder ?? CONTAINER_BASE
    );
    if (VEHICLES_T1_DEC_LABEL) {
        mod.SetUITextSize(VEHICLES_T1_DEC_LABEL, 14);
    }

    mod.AddUIText(
        VEHICLES_T1_VALUE_ID,
        mod.CreateVector(leftSectionValueX, vehiclesT1Y, 0),
        mod.CreateVector(leftSectionValueWidth, bestOfLabelSizeY, 0),
        mod.UIAnchor.TopRight,
        mod.Message(State.round.modeConfig.vehiclesT1),
        eventPlayer
    );
    const VEHICLES_T1_VALUE = mod.FindUIWidgetWithName(VEHICLES_T1_VALUE_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(VEHICLES_T1_VALUE, 0);
    mod.SetUITextSize(VEHICLES_T1_VALUE, 12);
    applyReadyDialogLabelTextColor(VEHICLES_T1_VALUE);
    mod.SetUIWidgetParent(VEHICLES_T1_VALUE, CONTAINER_BASE);

    const vehiclesT1IncBorder = addOutlinedButton(
        VEHICLES_T1_INC_ID,
        leftSectionRightButtonX,
        vehiclesT1Y,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        CONTAINER_BASE,
        eventPlayer
    );
    const VEHICLES_T1_INC_LABEL = addCenteredButtonText(
        VEHICLES_T1_INC_LABEL_ID,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.ui.right),
        eventPlayer,
        vehiclesT1IncBorder ?? CONTAINER_BASE
    );
    if (VEHICLES_T1_INC_LABEL) {
        mod.SetUITextSize(VEHICLES_T1_INC_LABEL, 14);
    }

    addRightAlignedLabel(
        VEHICLES_T2_LABEL_ID,
        leftSectionLabelX,
        vehiclesT2Y,
        leftSectionLabelWidth,
        bestOfLabelSizeY,
        mod.UIAnchor.TopRight,
        mod.Message(mod.stringkeys.twl.readyDialog.vehiclesLabelFormat, getTeamNameKey(TeamID.Team2)),
        eventPlayer,
        CONTAINER_BASE,
        12
    );

    const vehiclesT2DecBorder = addOutlinedButton(
        VEHICLES_T2_DEC_ID,
        leftSectionLeftButtonX,
        vehiclesT2Y,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        CONTAINER_BASE,
        eventPlayer
    );
    const VEHICLES_T2_DEC_LABEL = addCenteredButtonText(
        VEHICLES_T2_DEC_LABEL_ID,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.ui.left),
        eventPlayer,
        vehiclesT2DecBorder ?? CONTAINER_BASE
    );
    if (VEHICLES_T2_DEC_LABEL) {
        mod.SetUITextSize(VEHICLES_T2_DEC_LABEL, 14);
    }

    mod.AddUIText(
        VEHICLES_T2_VALUE_ID,
        mod.CreateVector(leftSectionValueX, vehiclesT2Y, 0),
        mod.CreateVector(leftSectionValueWidth, bestOfLabelSizeY, 0),
        mod.UIAnchor.TopRight,
        mod.Message(State.round.modeConfig.vehiclesT2),
        eventPlayer
    );
    const VEHICLES_T2_VALUE = mod.FindUIWidgetWithName(VEHICLES_T2_VALUE_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(VEHICLES_T2_VALUE, 0);
    mod.SetUITextSize(VEHICLES_T2_VALUE, 12);
    applyReadyDialogLabelTextColor(VEHICLES_T2_VALUE);
    mod.SetUIWidgetParent(VEHICLES_T2_VALUE, CONTAINER_BASE);

    const vehiclesT2IncBorder = addOutlinedButton(
        VEHICLES_T2_INC_ID,
        leftSectionRightButtonX,
        vehiclesT2Y,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        CONTAINER_BASE,
        eventPlayer
    );
    const VEHICLES_T2_INC_LABEL = addCenteredButtonText(
        VEHICLES_T2_INC_LABEL_ID,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.ui.right),
        eventPlayer,
        vehiclesT2IncBorder ?? CONTAINER_BASE
    );
    if (VEHICLES_T2_INC_LABEL) {
        mod.SetUITextSize(VEHICLES_T2_INC_LABEL, 14);
    }

    const confirmBorder = addOutlinedButton(
        MODE_CONFIRM_ID,
        confirmButtonX,
        confirmY,
        confirmButtonWidth,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        CONTAINER_BASE,
        eventPlayer
    );
    const MODE_CONFIRM_LABEL = addCenteredButtonText(
        MODE_CONFIRM_LABEL_ID,
        confirmButtonWidth,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.readyDialog.confirmSettingsLabel),
        eventPlayer,
        confirmBorder ?? CONTAINER_BASE
    );
    if (MODE_CONFIRM_LABEL) {
        mod.SetUITextSize(MODE_CONFIRM_LABEL, 12);
    }

    const resetBorder = addOutlinedButton(
        MODE_RESET_ID,
        resetButtonX,
        confirmY,
        resetButtonWidth,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        CONTAINER_BASE,
        eventPlayer
    );
    const MODE_RESET_LABEL = addCenteredButtonText(
        MODE_RESET_LABEL_ID,
        resetButtonWidth,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.readyDialog.resetSettingsLabel),
        eventPlayer,
        resetBorder ?? CONTAINER_BASE
    );
    if (MODE_RESET_LABEL) {
        mod.SetUITextSize(MODE_RESET_LABEL, 12);
    }

    // v0.750: the 3 red/yellow callouts moved UP into the empty band the removed vehicle cyclers left
    // behind -- directly above the Confirm button, below the top-right knobs. Right-aligned (TopRight +
    // CenterRight) so they sit over the right-hand config/button column and clear the top-left header text.
    // Stacked bottom-to-top: ceiling-lock (row 1), unsaved (row 2), symmetric (row 3).
    const noticeStackStep = bestOfButtonSizeY - 2;
    const UNSAVED_NOTICE_ID = UI_READY_DIALOG_UNSAVED_NOTICE_ID + playerId;
    const unsavedNoticeWidth = 700;
    modlib.ParseUI({
        name: UNSAVED_NOTICE_ID,
        type: "Text",
        playerId: eventPlayer,
        position: [-3, confirmY - (noticeStackStep * 2)],
        size: [unsavedNoticeWidth, bestOfButtonSizeY],
        anchor: mod.UIAnchor.TopRight,
        visible: false,
        padding: 0,
        bgAlpha: 0,
        bgFill: mod.UIBgFill.None,
        textLabel: mod.Message(mod.stringkeys.twl.readyDialog.unsavedChangesLabel),
        textColor: COLOR_NOT_READY_RED,
        textAlpha: 1,
        textSize: 12,
        textAnchor: mod.UIAnchor.CenterRight,
    });
    const UNSAVED_NOTICE = safeFind(UNSAVED_NOTICE_ID);
    if (UNSAVED_NOTICE) mod.SetUIWidgetParent(UNSAVED_NOTICE, CONTAINER_BASE);

    // Yellow ceiling-vanilla-lock tip. Same centered layout, one row below the red notice.
    const CEILING_LOCK_NOTICE_ID = UI_READY_DIALOG_CEILING_LOCK_NOTICE_ID + playerId;
    modlib.ParseUI({
        name: CEILING_LOCK_NOTICE_ID,
        type: "Text",
        playerId: eventPlayer,
        position: [-3, confirmY - noticeStackStep],
        size: [unsavedNoticeWidth, bestOfButtonSizeY],
        anchor: mod.UIAnchor.TopRight,
        visible: false,
        padding: 0,
        bgAlpha: 0,
        bgFill: mod.UIBgFill.None,
        textLabel: mod.Message(mod.stringkeys.twl.readyDialog.ceilingVanillaLockedWarning),
        textColor: COLOR_WARNING_YELLOW,
        textAlpha: 1,
        textSize: 12,
        textAnchor: mod.UIAnchor.CenterRight,
    });
    const CEILING_LOCK_NOTICE = safeFind(CEILING_LOCK_NOTICE_ID);
    if (CEILING_LOCK_NOTICE) mod.SetUIWidgetParent(CEILING_LOCK_NOTICE, CONTAINER_BASE);

    // Symmetric-count guard notice (red), a couple of rows below the ceiling-lock tip. Shown when the
    // pending T1/T2 vehicle counts differ; Confirm is blocked until they match.
    const SYMMETRIC_WARNING_ID = UI_READY_DIALOG_SYMMETRIC_WARNING_ID + playerId;
    modlib.ParseUI({
        name: SYMMETRIC_WARNING_ID, type: "Text", playerId: eventPlayer,
        position: [-3, confirmY - (noticeStackStep * 3)], size: [unsavedNoticeWidth, bestOfButtonSizeY],
        anchor: mod.UIAnchor.TopRight, visible: false, padding: 0, bgAlpha: 0, bgFill: mod.UIBgFill.None,
        textLabel: mod.Message(mod.stringkeys.twl.readyDialog.symmetricCountWarning), textColor: COLOR_NOT_READY_RED,
        textAlpha: 1, textSize: 12, textAnchor: mod.UIAnchor.CenterRight,
    });
    const SYMMETRIC_WARNING = safeFind(SYMMETRIC_WARNING_ID);
    if (SYMMETRIC_WARNING) mod.SetUIWidgetParent(SYMMETRIC_WARNING, CONTAINER_BASE);

    // v0.734 Red "Vehicles changed - Restart Needed" notice -- right-aligned under the Restart button.
    // TopRight anchor + same x offset (-3) as the Restart button so its right edge sits flush with the
    // button's right edge. textAnchor CenterRight keeps the text right-aligned inside the 250-wide box.
    // Y is one row below the button (matches the ceiling-lock notice's vertical offset). Doesn't
    // overlap the centered notices (unsaved + ceiling-lock) because those use TopCenter with width 700;
    // this one sits in the right margin to the right of where those notices end. Visible only when
    // State.round.needsRestartForVehicleChange is true (set by Confirm when matchup/vehicle indices
    // changed; cleared by Restart click).
    const RESTART_NEEDED_NOTICE_ID = UI_READY_DIALOG_RESTART_NEEDED_NOTICE_ID + playerId;
    const restartNeededNoticeWidth = 250;
    modlib.ParseUI({
        name: RESTART_NEEDED_NOTICE_ID,
        type: "Text",
        playerId: eventPlayer,
        position: [resetButtonX, confirmY + bestOfButtonSizeY + 4],
        size: [restartNeededNoticeWidth, bestOfButtonSizeY],
        anchor: mod.UIAnchor.TopRight,
        visible: false,
        padding: 0,
        bgAlpha: 0,
        bgFill: mod.UIBgFill.None,
        textLabel: mod.Message(mod.stringkeys.twl.readyDialog.restartNeededWarning),
        textColor: COLOR_NOT_READY_RED,
        textAlpha: 1,
        textSize: 12,
        textAnchor: mod.UIAnchor.CenterRight,
    });
    const RESTART_NEEDED_NOTICE = safeFind(RESTART_NEEDED_NOTICE_ID);
    if (RESTART_NEEDED_NOTICE) mod.SetUIWidgetParent(RESTART_NEEDED_NOTICE, CONTAINER_BASE);

    // Best-of: minus button (left of label)
    const bestOfDecBorder = addOutlinedButton(
        BESTOF_DEC_ID,
        125,
        bestOfY,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        CONTAINER_BASE,
        eventPlayer
    );

    // Best-of: minus label (left of label)
    const BESTOF_DEC_LABEL = addCenteredButtonText(
        BESTOF_DEC_LABEL_ID,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.ui.minus),
        eventPlayer,
        bestOfDecBorder ?? CONTAINER_BASE
    );
    if (BESTOF_DEC_LABEL) {
        mod.SetUITextSize(BESTOF_DEC_LABEL, 14);
    }

    // Best-of: dynamic label
    mod.AddUIText(
        BESTOF_LABEL_ID,
        mod.CreateVector(-42, bestOfY, 0),
        mod.CreateVector(bestOfLabelSizeX, bestOfLabelSizeY, 0),
        mod.UIAnchor.TopRight,
        mod.Message(mod.stringkeys.twl.readyDialog.bestOfLabel, State.round.max),
        eventPlayer
    );
    const BESTOF_LABEL = mod.FindUIWidgetWithName(BESTOF_LABEL_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(BESTOF_LABEL, 0);
    mod.SetUITextSize(BESTOF_LABEL, 14);
    applyReadyDialogLabelTextColor(BESTOF_LABEL);
    mod.SetUIWidgetParent(BESTOF_LABEL, CONTAINER_BASE);

    // Best-of: plus button (right of label)
    const bestOfIncBorder = addOutlinedButton(
        BESTOF_INC_ID,
        -3,
        bestOfY,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        CONTAINER_BASE,
        eventPlayer
    );

    // Best-of: plus label (right of label)
    const BESTOF_INC_LABEL = addCenteredButtonText(
        BESTOF_INC_LABEL_ID,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.ui.plus),
        eventPlayer,
        bestOfIncBorder ?? CONTAINER_BASE
    );
    if (BESTOF_INC_LABEL) {
        mod.SetUITextSize(BESTOF_INC_LABEL, 14);
    }
    updateBestOfRoundsLabelForPid(playerId);

    // Matchup preset control (below Best-of): minus button, dynamic label, plus button.
    const MATCHUP_DEC_ID = UI_READY_DIALOG_MATCHUP_DEC_ID + playerId;
    const MATCHUP_DEC_LABEL_ID = UI_READY_DIALOG_MATCHUP_DEC_LABEL_ID + playerId;
    const MATCHUP_LABEL_ID = UI_READY_DIALOG_MATCHUP_LABEL_ID + playerId;
    const MATCHUP_INC_ID = UI_READY_DIALOG_MATCHUP_INC_ID + playerId;
    const MATCHUP_INC_LABEL_ID = UI_READY_DIALOG_MATCHUP_INC_LABEL_ID + playerId;
    const MATCHUP_MINPLAYERS_ID = UI_READY_DIALOG_MATCHUP_MINPLAYERS_ID + playerId;
    const MATCHUP_MINPLAYERS_TOTAL_ID = UI_READY_DIALOG_MATCHUP_MINPLAYERS_TOTAL_ID + playerId;
    const MATCHUP_KILLSTARGET_ID = UI_READY_DIALOG_MATCHUP_KILLSTARGET_ID + playerId;

    const matchupY = bestOfY + bestOfButtonSizeY + 4;
    const matchupLabelSizeX = bestOfLabelSizeX + 30;
    const matchupLabelOffsetX = -72;

    // Matchup: minus button (left of label)
    const matchupDecBorder = addOutlinedButton(
        MATCHUP_DEC_ID,
        125,
        matchupY,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        CONTAINER_BASE,
        eventPlayer
    );

    // Matchup: minus label
    const MATCHUP_DEC_LABEL = addCenteredButtonText(
        MATCHUP_DEC_LABEL_ID,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.ui.minus),
        eventPlayer,
        matchupDecBorder ?? CONTAINER_BASE
    );
    if (MATCHUP_DEC_LABEL) {
        mod.SetUITextSize(MATCHUP_DEC_LABEL, 14);
    }

    // Matchup: dynamic label
    mod.AddUIText(
        MATCHUP_LABEL_ID,
        mod.CreateVector(matchupLabelOffsetX, matchupY, 0),
        mod.CreateVector(matchupLabelSizeX, bestOfLabelSizeY, 0),
        mod.UIAnchor.TopRight,
        mod.Message(mod.stringkeys.twl.readyDialog.matchupFormat, 1, 0),
        eventPlayer
    );
    const MATCHUP_LABEL = mod.FindUIWidgetWithName(MATCHUP_LABEL_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(MATCHUP_LABEL, 0);
    mod.SetUITextSize(MATCHUP_LABEL, 14);
    applyReadyDialogLabelTextColor(MATCHUP_LABEL);
    mod.SetUIWidgetParent(MATCHUP_LABEL, CONTAINER_BASE);

    // Matchup: plus button (right of label)
    const matchupIncBorder = addOutlinedButton(
        MATCHUP_INC_ID,
        -3,
        matchupY,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        CONTAINER_BASE,
        eventPlayer
    );

    // Matchup: plus label (right of label)
    const MATCHUP_INC_LABEL = addCenteredButtonText(
        MATCHUP_INC_LABEL_ID,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.ui.plus),
        eventPlayer,
        matchupIncBorder ?? CONTAINER_BASE
    );
    if (MATCHUP_INC_LABEL) {
        mod.SetUITextSize(MATCHUP_INC_LABEL, 14);
    }

    // Matchup readouts (below matchup buttons)
    mod.AddUIText(
        MATCHUP_KILLSTARGET_ID,
        mod.CreateVector(-42 - (bestOfLabelSizeX + 80) / 4, matchupY + bestOfButtonSizeY - 1, 0),
        mod.CreateVector(bestOfLabelSizeX + 80, 16, 0),
        mod.UIAnchor.TopRight,
        mod.Message(mod.stringkeys.twl.readyDialog.targetKillsToWinFormat, State.round.killsTarget),
        eventPlayer
    );
    const MATCHUP_KILLSTARGET = mod.FindUIWidgetWithName(MATCHUP_KILLSTARGET_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(MATCHUP_KILLSTARGET, 0);
    mod.SetUITextSize(MATCHUP_KILLSTARGET, 12);
    applyReadyDialogLabelTextColor(MATCHUP_KILLSTARGET);
    mod.SetUIWidgetParent(MATCHUP_KILLSTARGET, CONTAINER_BASE);

    const PLAYERS_DEC_ID = UI_READY_DIALOG_MINPLAYERS_DEC_ID + playerId;
    const PLAYERS_DEC_LABEL_ID = UI_READY_DIALOG_MINPLAYERS_DEC_LABEL_ID + playerId;
    const PLAYERS_INC_ID = UI_READY_DIALOG_MINPLAYERS_INC_ID + playerId;
    const PLAYERS_INC_LABEL_ID = UI_READY_DIALOG_MINPLAYERS_INC_LABEL_ID + playerId;
    // Players row moved up one row into the slot vacated by the removed matchup ("Vehicles X v Y") row.
    const playersY = matchupY;
    const playersLabelSizeX = bestOfLabelSizeX + 30;
    const playersLabelOffsetX = -72;
    const playersLabelOffsetY = 4;

    const playersDecBorder = addOutlinedButton(
        PLAYERS_DEC_ID,
        125,
        playersY,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        CONTAINER_BASE,
        eventPlayer
    );

    const PLAYERS_DEC_LABEL = addCenteredButtonText(
        PLAYERS_DEC_LABEL_ID,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.ui.minus),
        eventPlayer,
        playersDecBorder ?? CONTAINER_BASE
    );
    if (PLAYERS_DEC_LABEL) {
        mod.SetUITextSize(PLAYERS_DEC_LABEL, 14);
    }

    const autoStartCounts = getAutoStartMinPlayerCounts();
    mod.AddUIText(
        MATCHUP_MINPLAYERS_ID,
        mod.CreateVector(playersLabelOffsetX, playersY + playersLabelOffsetY, 0),
        mod.CreateVector(playersLabelSizeX, 16, 0),
        mod.UIAnchor.TopRight,
        mod.Message(mod.stringkeys.twl.readyDialog.playersFormat, autoStartCounts.left, autoStartCounts.right),
        eventPlayer
    );
    const MATCHUP_MINPLAYERS = mod.FindUIWidgetWithName(MATCHUP_MINPLAYERS_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(MATCHUP_MINPLAYERS, 0);
    mod.SetUITextSize(MATCHUP_MINPLAYERS, 14);
    applyReadyDialogLabelTextColor(MATCHUP_MINPLAYERS);
    mod.SetUIWidgetParent(MATCHUP_MINPLAYERS, CONTAINER_BASE);

    const playersTotalY = playersY + bestOfButtonSizeY - 1;
    mod.AddUIText(
        MATCHUP_MINPLAYERS_TOTAL_ID,
        mod.CreateVector(-42 - (bestOfLabelSizeX + 80) / 4, playersTotalY, 0),
        mod.CreateVector(bestOfLabelSizeX + 80, 16, 0),
        mod.UIAnchor.TopRight,
        mod.Message(mod.stringkeys.twl.readyDialog.minPlayersToStartFormat, autoStartCounts.total),
        eventPlayer
    );
    const MATCHUP_MINPLAYERS_TOTAL = mod.FindUIWidgetWithName(MATCHUP_MINPLAYERS_TOTAL_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(MATCHUP_MINPLAYERS_TOTAL, 0);
    mod.SetUITextSize(MATCHUP_MINPLAYERS_TOTAL, 12);
    applyReadyDialogLabelTextColor(MATCHUP_MINPLAYERS_TOTAL);
    mod.SetUIWidgetParent(MATCHUP_MINPLAYERS_TOTAL, CONTAINER_BASE);

    const playersIncBorder = addOutlinedButton(
        PLAYERS_INC_ID,
        -3,
        playersY,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        CONTAINER_BASE,
        eventPlayer
    );

    const PLAYERS_INC_LABEL = addCenteredButtonText(
        PLAYERS_INC_LABEL_ID,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.ui.plus),
        eventPlayer,
        playersIncBorder ?? CONTAINER_BASE
    );
    if (PLAYERS_INC_LABEL) {
        mod.SetUITextSize(PLAYERS_INC_LABEL, 14);
    }

    updateMatchupLabelForPid(playerId);
    updateMatchupReadoutsForPid(playerId);
    updateReadyDialogModeConfigForPid(playerId);

    // Left and right roster containers (children are parented to these containers).
    const T1_CONTAINER_ID = UI_READY_DIALOG_TEAM1_CONTAINER_ID + playerId;
    const T2_CONTAINER_ID = UI_READY_DIALOG_TEAM2_CONTAINER_ID + playerId;

    mod.AddUIContainer(
        T1_CONTAINER_ID,
        mod.CreateVector(READY_ROSTER_PANEL_MARGIN, READY_ROSTER_PANEL_Y, 0),
        mod.CreateVector(READY_ROSTER_PANEL_WIDTH, READY_ROSTER_PANEL_HEIGHT, 0),
        mod.UIAnchor.TopLeft,
        CONTAINER_BASE,
        true,
        1,
        READY_PANEL_T1_BG_COLOR,
        READY_PANEL_BG_ALPHA,
        mod.UIBgFill.Solid,
        mod.UIDepth.AboveGameUI,
        eventPlayer
    );
    mod.AddUIContainer(
        T2_CONTAINER_ID,
        mod.CreateVector(READY_ROSTER_PANEL_MARGIN + READY_ROSTER_PANEL_WIDTH + READY_ROSTER_PANEL_GAP, READY_ROSTER_PANEL_Y, 0),
        mod.CreateVector(READY_ROSTER_PANEL_WIDTH, READY_ROSTER_PANEL_HEIGHT, 0),
        mod.UIAnchor.TopLeft,
        CONTAINER_BASE,
        true,
        1,
        READY_PANEL_T2_BG_COLOR,
        READY_PANEL_BG_ALPHA,
        mod.UIBgFill.Solid,
        mod.UIDepth.AboveGameUI,
        eventPlayer
    );

    const T1_CONTAINER = mod.FindUIWidgetWithName(T1_CONTAINER_ID, mod.GetUIRoot());
    const T2_CONTAINER = mod.FindUIWidgetWithName(T2_CONTAINER_ID, mod.GetUIRoot());

    // Team labels reuse existing team-name strings.
    const teamLabelY = 0;
    const teamLabelHeight = 24;
    const teamLabelWidth = READY_ROSTER_PANEL_WIDTH;
    const T1_LABEL_ID = UI_READY_DIALOG_TEAM1_LABEL_ID + playerId;
    const T2_LABEL_ID = UI_READY_DIALOG_TEAM2_LABEL_ID + playerId;
    // D12: team headers centered above their sections (textAnchor Center; full-width widget at top).
    // Top header labels the VEHICLES section (the knob grid sits directly below it).
    modlib.ParseUI({
        name: T1_LABEL_ID, type: "Text", playerId: eventPlayer,
        position: [0, teamLabelY], size: [teamLabelWidth, teamLabelHeight], anchor: mod.UIAnchor.TopLeft,
        visible: true, padding: 0, bgAlpha: 0, bgFill: mod.UIBgFill.None,
        textLabel: mod.Message(STR_READY_DIALOG_ROSTER_VEHICLES_HEADER_FORMAT, getTeamNameKey(TeamID.Team1)), textColor: [1, 1, 1], textAlpha: 1, textSize: 20, textAnchor: mod.UIAnchor.Center,
    });
    const T1_LABEL = mod.FindUIWidgetWithName(T1_LABEL_ID, mod.GetUIRoot());
    if (T1_LABEL) mod.SetUIWidgetParent(T1_LABEL, T1_CONTAINER);

    modlib.ParseUI({
        name: T2_LABEL_ID, type: "Text", playerId: eventPlayer,
        position: [0, teamLabelY], size: [teamLabelWidth, teamLabelHeight], anchor: mod.UIAnchor.TopLeft,
        visible: true, padding: 0, bgAlpha: 0, bgFill: mod.UIBgFill.None,
        textLabel: mod.Message(STR_READY_DIALOG_ROSTER_VEHICLES_HEADER_FORMAT, getTeamNameKey(TeamID.Team2)), textColor: [1, 1, 1], textAlpha: 1, textSize: 20, textAnchor: mod.UIAnchor.Center,
    });
    const T2_LABEL = mod.FindUIWidgetWithName(T2_LABEL_ID, mod.GetUIRoot());
    if (T2_LABEL) mod.SetUIWidgetParent(T2_LABEL, T2_CONTAINER);

    // Second header labels the PLAYERS section, sitting just above the roster rows (below the knob grid).
    const playersHeaderY = 114;
    const T1_PLAYERS_LABEL_ID = UI_READY_DIALOG_TEAM1_PLAYERS_LABEL_ID + playerId;
    const T2_PLAYERS_LABEL_ID = UI_READY_DIALOG_TEAM2_PLAYERS_LABEL_ID + playerId;
    modlib.ParseUI({
        name: T1_PLAYERS_LABEL_ID, type: "Text", playerId: eventPlayer,
        position: [0, playersHeaderY], size: [teamLabelWidth, 20], anchor: mod.UIAnchor.TopLeft,
        visible: true, padding: 0, bgAlpha: 0, bgFill: mod.UIBgFill.None,
        textLabel: mod.Message(STR_READY_DIALOG_ROSTER_PLAYERS_HEADER_FORMAT, getTeamNameKey(TeamID.Team1)), textColor: [1, 1, 1], textAlpha: 1, textSize: 15, textAnchor: mod.UIAnchor.Center,
    });
    const T1_PLAYERS_LABEL = mod.FindUIWidgetWithName(T1_PLAYERS_LABEL_ID, mod.GetUIRoot());
    if (T1_PLAYERS_LABEL) mod.SetUIWidgetParent(T1_PLAYERS_LABEL, T1_CONTAINER);
    modlib.ParseUI({
        name: T2_PLAYERS_LABEL_ID, type: "Text", playerId: eventPlayer,
        position: [0, playersHeaderY], size: [teamLabelWidth, 20], anchor: mod.UIAnchor.TopLeft,
        visible: true, padding: 0, bgAlpha: 0, bgFill: mod.UIBgFill.None,
        textLabel: mod.Message(STR_READY_DIALOG_ROSTER_PLAYERS_HEADER_FORMAT, getTeamNameKey(TeamID.Team2)), textColor: [1, 1, 1], textAlpha: 1, textSize: 15, textAnchor: mod.UIAnchor.Center,
    });
    const T2_PLAYERS_LABEL = mod.FindUIWidgetWithName(T2_PLAYERS_LABEL_ID, mod.GetUIRoot());
    if (T2_PLAYERS_LABEL) mod.SetUIWidgetParent(T2_PLAYERS_LABEL, T2_CONTAINER);

    // Per-spawner knob grid at the top of each roster box (3 cols x 2 rows): Jet1/Heli1/Heli3 over
    // Jet2/Heli2/Heli4. Lives in the space freed by capping the roster at 10 rows.
    buildReadyDialogKnobGridForTeam(eventPlayer, playerId, T1_CONTAINER, TeamID.Team1);
    buildReadyDialogKnobGridForTeam(eventPlayer, playerId, T2_CONTAINER, TeamID.Team2);
    updateReadyDialogKnobGridForPid(playerId); // initial render (mode-config render above ran pre-build)

    // Phase 3b: the in-roster knob grid replaces the old top-right matchup row + Vehicles T1/T2
    // cyclers. Delete those legacy widgets (build-then-remove avoids surgery in this megalith builder).
    // KEEP the Players (min-players) row + its readouts -- that drives the separate auto-start gate.
    {
        const delLegacy = (baseId: string): void => {
            const w = safeFind(baseId + playerId);
            if (w) mod.DeleteUIWidget(w);
            const border = safeFind(baseId + playerId + "_BORDER");
            if (border) mod.DeleteUIWidget(border);
        };
        const legacyIds = [
            UI_READY_DIALOG_MODE_VEHICLES_T1_LABEL_ID, UI_READY_DIALOG_MODE_VEHICLES_T1_DEC_ID, UI_READY_DIALOG_MODE_VEHICLES_T1_DEC_LABEL_ID,
            UI_READY_DIALOG_MODE_VEHICLES_T1_VALUE_ID, UI_READY_DIALOG_MODE_VEHICLES_T1_INC_ID, UI_READY_DIALOG_MODE_VEHICLES_T1_INC_LABEL_ID,
            UI_READY_DIALOG_MODE_VEHICLES_T2_LABEL_ID, UI_READY_DIALOG_MODE_VEHICLES_T2_DEC_ID, UI_READY_DIALOG_MODE_VEHICLES_T2_DEC_LABEL_ID,
            UI_READY_DIALOG_MODE_VEHICLES_T2_VALUE_ID, UI_READY_DIALOG_MODE_VEHICLES_T2_INC_ID, UI_READY_DIALOG_MODE_VEHICLES_T2_INC_LABEL_ID,
            UI_READY_DIALOG_MATCHUP_LABEL_ID, UI_READY_DIALOG_MATCHUP_DEC_ID, UI_READY_DIALOG_MATCHUP_DEC_LABEL_ID,
            UI_READY_DIALOG_MATCHUP_INC_ID, UI_READY_DIALOG_MATCHUP_INC_LABEL_ID, UI_READY_DIALOG_MATCHUP_KILLSTARGET_ID,
        ];
        for (const id of legacyIds) delLegacy(id);
    }

    // Roster rows start below the knob grid (~112) AND the PLAYERS header (114 + 20 = 134).
    const rowStartY = 138;
    const rowH = 26;
    const colNameX = 10;
    const colReadyX = 280;
    const colBaseX = 420;
    const colNameW = 260;
    const colStatusW = 140;

    // Roster rows built via modlib.ParseUI with visible:false from construction (not via post-hoc
    // SetUIWidgetVisible). The earlier v0.694 approach used mod.AddUIText (no visible param) then
    // SetUIWidgetVisible(false) after construction, but the BF6 engine appears to queue widget
    // creation and may paint the queued widgets BEFORE the deferred visibility update applies --
    // resulting in placeholder text flickering visibly in each row position. modlib.ParseUI commits
    // the visible:false flag at creation time, eliminating the race.
    const emptyRowLabel = mod.Message(mod.stringkeys.twl.system.genericCounter, "");
    const buildRosterTextHidden = (
        name: string,
        x: number,
        y: number,
        w: number,
        h: number,
        parent: mod.UIWidget
    ): void => {
        modlib.ParseUI({
            name,
            type: "Text",
            playerId: eventPlayer,
            position: [x, y],
            size: [w, h],
            anchor: mod.UIAnchor.TopLeft,
            visible: false,
            padding: 0,
            bgAlpha: 0,
            bgFill: mod.UIBgFill.None,
            textLabel: emptyRowLabel,
            textColor: [1, 1, 1],
            textAlpha: 1,
            textSize: 14,
            textAnchor: mod.UIAnchor.TopLeft,
        });
        const widget = mod.FindUIWidgetWithName(name, mod.GetUIRoot());
        if (widget) mod.SetUIWidgetParent(widget, parent);
    };
    for (let row = 0; row < TEAM_ROSTER_MAX_ROWS; row++) {
        const y = rowStartY + (row * rowH);
        buildRosterTextHidden(UI_READY_DIALOG_T1_ROW_NAME_ID + playerId + "_" + row, colNameX, y, colNameW, rowH, T1_CONTAINER);
        buildRosterTextHidden(UI_READY_DIALOG_T1_ROW_READY_ID + playerId + "_" + row, colReadyX, y, colStatusW, rowH, T1_CONTAINER);
        buildRosterTextHidden(UI_READY_DIALOG_T1_ROW_BASE_ID + playerId + "_" + row, colBaseX, y, colStatusW, rowH, T1_CONTAINER);
        buildRosterTextHidden(UI_READY_DIALOG_T2_ROW_NAME_ID + playerId + "_" + row, colNameX, y, colNameW, rowH, T2_CONTAINER);
        buildRosterTextHidden(UI_READY_DIALOG_T2_ROW_READY_ID + playerId + "_" + row, colReadyX, y, colStatusW, rowH, T2_CONTAINER);
        buildRosterTextHidden(UI_READY_DIALOG_T2_ROW_BASE_ID + playerId + "_" + row, colBaseX, y, colStatusW, rowH, T2_CONTAINER);
    }

    // Populate rows for this viewer .
    refreshReadyDialogRosterForViewer(eventPlayer, playerId);

    //#endregion ----------------- Ready Dialog (Roster UI) -  (header + team rosters) --------------------

    

    //#region -------------------- Ready Dialog - Swap Teams Button --------------------

    // Bottom-left toggle: swaps the player's current team (Team 1 <-> Team 2).
    const SWAP_BUTTON_ID = UI_READY_DIALOG_BUTTON_SWAP_ID + playerId;
    const SWAP_BUTTON_LABEL_ID = UI_READY_DIALOG_BUTTON_SWAP_LABEL_ID + playerId;

    const SWAP_BORDER = addOutlinedButton(
        SWAP_BUTTON_ID,
        0,
        0,
        READY_DIALOG_MAIN_BUTTON_WIDTH,
        READY_DIALOG_MAIN_BUTTON_HEIGHT,
        mod.UIAnchor.BottomLeft,
        CONTAINER_BASE,
        eventPlayer
    );

    const SWAP_BUTTON_LABEL = addCenteredButtonText(
        SWAP_BUTTON_LABEL_ID,
        READY_DIALOG_MAIN_BUTTON_WIDTH,
        READY_DIALOG_MAIN_BUTTON_HEIGHT,
        mod.Message(mod.stringkeys.twl.readyDialog.buttons.swapTeams),
        eventPlayer,
        SWAP_BORDER ?? CONTAINER_BASE
    );

    //#endregion ----------------- Ready Dialog - Swap Teams Button --------------------



    //#region -------------------- Ready Dialog  - Ready Toggle Button --------------------

    // Bottom-center toggle: starts as "Ready" (pressing it sets READY), then flips to "Not Ready".
    const READY_BUTTON_ID = UI_READY_DIALOG_BUTTON_READY_ID + playerId;
    const READY_BUTTON_LABEL_ID = UI_READY_DIALOG_BUTTON_READY_LABEL_ID + playerId;
    const READY_BUTTON_BORDER = addOutlinedButton(
        READY_BUTTON_ID,
        READY_DIALOG_READY_BUTTON_OFFSET_X,
        0,
        READY_DIALOG_MAIN_BUTTON_WIDTH,
        READY_DIALOG_MAIN_BUTTON_HEIGHT,
        mod.UIAnchor.BottomCenter,
        CONTAINER_BASE,
        eventPlayer
    );

    const READY_BUTTON_LABEL = addCenteredButtonText(
        READY_BUTTON_LABEL_ID,
        READY_DIALOG_MAIN_BUTTON_WIDTH,
        READY_DIALOG_MAIN_BUTTON_HEIGHT,
        mod.Message(mod.stringkeys.twl.readyDialog.buttons.ready),
        eventPlayer,
        READY_BUTTON_BORDER ?? CONTAINER_BASE
    );

    // Ensure the label matches the current stored state for this viewer (default is NOT READY).
    updateReadyToggleButtonForViewer(eventPlayer, playerId);

    // Bottom-center right: Auto-Ready toggle (Enable/Disable).
    const AUTO_READY_BUTTON_ID = UI_READY_DIALOG_BUTTON_AUTO_READY_ID + playerId;
    const AUTO_READY_BUTTON_LABEL_ID = UI_READY_DIALOG_BUTTON_AUTO_READY_LABEL_ID + playerId;
    const AUTO_READY_BUTTON_BORDER = addOutlinedButton(
        AUTO_READY_BUTTON_ID,
        READY_DIALOG_AUTO_READY_BUTTON_OFFSET_X,
        0,
        READY_DIALOG_MAIN_BUTTON_WIDTH,
        READY_DIALOG_MAIN_BUTTON_HEIGHT,
        mod.UIAnchor.BottomCenter,
        CONTAINER_BASE,
        eventPlayer
    );

    addCenteredButtonText(
        AUTO_READY_BUTTON_LABEL_ID,
        READY_DIALOG_MAIN_BUTTON_WIDTH,
        READY_DIALOG_MAIN_BUTTON_HEIGHT,
        mod.Message(mod.stringkeys.twl.readyDialog.buttons.autoReadyEnable),
        eventPlayer,
        AUTO_READY_BUTTON_BORDER ?? CONTAINER_BASE
    );
    updateAutoReadyToggleButtonForViewer(eventPlayer, playerId);

    //#endregion ----------------- Ready Dialog  - Ready Toggle Button --------------------



    //#region -------------------- Debug Info - Time Limit Seconds --------------------

    const DEBUG_TIMELIMIT_ID = UI_TEAMSWITCH_DEBUG_TIMELIMIT_ID + playerId;
    if (SHOW_DEBUG_TIMELIMIT) {

    // Shows the current inferred gamemode time limit (seconds) while the team switch dialog is open.
    const debugTimeLimitSeconds = Math.floor(mod.GetMatchTimeElapsed() + mod.GetMatchTimeRemaining());
    mod.AddUIText(
        DEBUG_TIMELIMIT_ID,
        mod.CreateVector(-320, -160, 0),  //mod.CreateVector(-220, 10, 0),
        mod.CreateVector(80, 28, 0),    //mod.CreateVector(80, 28, 0),
        mod.UIAnchor.TopRight,
        mod.Message(mod.stringkeys.twl.teamSwitch.debugTimeLimit, debugTimeLimitSeconds),
        eventPlayer
    );
    const DEBUG_TIMELIMIT = mod.FindUIWidgetWithName(DEBUG_TIMELIMIT_ID, mod.GetUIRoot());
    // Parent to the Team Switch container so the text is always drawn above the dialog background.
    mod.SetUIWidgetParent(DEBUG_TIMELIMIT, CONTAINER_BASE);
    mod.SetUIWidgetBgAlpha(DEBUG_TIMELIMIT, 0);
    mod.SetUITextSize(DEBUG_TIMELIMIT, 12);
    applyReadyDialogLabelTextColor(DEBUG_TIMELIMIT);


    } else {
        const existingDebug = safeFind(DEBUG_TIMELIMIT_ID);
        if (existingDebug) mod.SetUIWidgetVisible(existingDebug, false);
    }

    //#endregion -------------------- Debug Info - Time Limit Seconds --------------------


    
    //#region -------------------- Admin Panel Toggle Button (Top-Right, only while Ready Up dialog is open) --------------------

    // UI caching note: these widgets are created once and then hidden/shown on open/close.
    ensureAdminPanelWidgets(eventPlayer, playerId);

    //#endregion ----------------- Admin Panel Toggle Button (Top-Right, only while Ready Up dialog is open) --------------------



    //#region -------------------- Dialog Buttons (Left Side) - Cancel --------------------

    // Cancel remains a core function so players can dismiss the dialog and regain control.
    // (Team switching / spectate / opt-out buttons are intentionally not exposed in v0.5+; see Deprecated UI block below.)
    const BUTTON_CANCEL_BORDER = addOutlinedButton(
        BUTTON_CANCEL_ID,
        0,
        0,
        READY_DIALOG_MAIN_BUTTON_WIDTH,
        READY_DIALOG_MAIN_BUTTON_HEIGHT,
        mod.UIAnchor.BottomRight,
        CONTAINER_BASE,
        eventPlayer
    );

    const BUTTON_CANCEL_LABEL = addCenteredButtonText(
        BUTTON_CANCEL_LABEL_ID,
        READY_DIALOG_MAIN_BUTTON_WIDTH,
        READY_DIALOG_MAIN_BUTTON_HEIGHT,
        mod.Message(mod.stringkeys.twl.teamSwitch.buttons.cancel),
        eventPlayer,
        BUTTON_CANCEL_BORDER ?? CONTAINER_BASE
    );

    // Atomic reveal: entire dialog tree was built hidden; flip root + chrome to visible in one
    // engine tick so widgets don't pop in one-by-one during construction.
    finalizeReadyDialogVisibility(playerId, CONTAINER_BASE, true);
    updateHelpTextVisibilityForPlayer(eventPlayer);
    // v0.737 paint roster panel BGs viewer-relative (own team always blue).
    applyViewerTeamColorsForReadyDialogPid(playerId);
}

//#endregion ----------------- Dialog Buttons (Left Side) - Cancel --------------------



//#region -------------------- Admin Panel UI (Right Side) --------------------

// Builds the Admin Panel widgets lazily (to avoid a 1-frame flicker on dialog open).
function buildAdminPanelWidgets(eventPlayer: mod.Player, adminContainer: mod.UIWidget, playerId: number): void {

    // Fit at target resolutions.
    const testerBaseX = ADMIN_PANEL_BASE_X;
    const testerBaseY = ADMIN_PANEL_BASE_Y;

    const buttonSizeX = ADMIN_PANEL_BUTTON_SIZE_X;
    const buttonSizeY = ADMIN_PANEL_BUTTON_SIZE_Y;
    const labelSizeX = ADMIN_PANEL_LABEL_SIZE_X;
    const rowSpacingY = ADMIN_PANEL_ROW_SPACING_Y;

    const decOffsetX = 0;
    const labelOffsetX = buttonSizeX + 8;
    const incOffsetX = buttonSizeX + 8 + labelSizeX + 8;

    const headerId = UI_TEST_HEADER_LABEL_ID + playerId;

    modlib.ParseUI({
        name: headerId,
        type: "Text",
        playerId: eventPlayer,
        position: [0, testerBaseY + 2],
        size: [ADMIN_PANEL_CONTENT_WIDTH, 18],
        anchor: mod.UIAnchor.TopCenter,
        visible: true,
        padding: 0,
        bgAlpha: 0,
        bgFill: mod.UIBgFill.None,
        textLabel: mod.Message(mod.stringkeys.twl.adminPanel.tester.header),
        textColor: ADMIN_PANEL_LABEL_TEXT_COLOR_RGB,
        textAlpha: 1,
        textSize: 12,
        textAnchor: mod.UIAnchor.Center,
    });
    const TEST_HEADER = safeFind(headerId);
    applyAdminPanelLabelTextColor(TEST_HEADER);
    if (TEST_HEADER) mod.SetUIWidgetParent(TEST_HEADER, adminContainer);

    const row0Y = testerBaseY + 22;

    addTesterRow(eventPlayer, adminContainer, playerId, testerBaseX, row0Y + (buttonSizeY + rowSpacingY) * 0,
        UI_TEST_BUTTON_LEFT_WINS_DEC_ID, UI_TEST_BUTTON_LEFT_WINS_INC_ID, UI_TEST_LABEL_LEFT_WINS_ID,
        mod.stringkeys.twl.adminPanel.tester.labels.leftWins, buttonSizeX, buttonSizeY, labelSizeX, decOffsetX, labelOffsetX, incOffsetX);

    addTesterRow(eventPlayer, adminContainer, playerId, testerBaseX, row0Y + (buttonSizeY + rowSpacingY) * 1,
        UI_TEST_BUTTON_RIGHT_WINS_DEC_ID, UI_TEST_BUTTON_RIGHT_WINS_INC_ID, UI_TEST_LABEL_RIGHT_WINS_ID,
        mod.stringkeys.twl.adminPanel.tester.labels.rightWins, buttonSizeX, buttonSizeY, labelSizeX, decOffsetX, labelOffsetX, incOffsetX);

    addTesterRow(eventPlayer, adminContainer, playerId, testerBaseX, row0Y + (buttonSizeY + rowSpacingY) * 2,
        UI_TEST_BUTTON_LEFT_KILLS_DEC_ID, UI_TEST_BUTTON_LEFT_KILLS_INC_ID, UI_TEST_LABEL_LEFT_KILLS_ID,
        mod.stringkeys.twl.adminPanel.tester.labels.leftKills, buttonSizeX, buttonSizeY, labelSizeX, decOffsetX, labelOffsetX, incOffsetX);

    addTesterRow(eventPlayer, adminContainer, playerId, testerBaseX, row0Y + (buttonSizeY + rowSpacingY) * 3,
        UI_TEST_BUTTON_RIGHT_KILLS_DEC_ID, UI_TEST_BUTTON_RIGHT_KILLS_INC_ID, UI_TEST_LABEL_RIGHT_KILLS_ID,
        mod.stringkeys.twl.adminPanel.tester.labels.rightKills, buttonSizeX, buttonSizeY, labelSizeX, decOffsetX, labelOffsetX, incOffsetX);

    addTesterRow(eventPlayer, adminContainer, playerId, testerBaseX, row0Y + (buttonSizeY + rowSpacingY) * 4,
        UI_ADMIN_BUTTON_T1_ROUND_KILLS_DEC_ID, UI_ADMIN_BUTTON_T1_ROUND_KILLS_INC_ID, UI_ADMIN_LABEL_T1_ROUND_KILLS_ID,
        mod.stringkeys.twl.adminPanel.labels.t1RoundKills, buttonSizeX, buttonSizeY, labelSizeX, decOffsetX, labelOffsetX, incOffsetX);

    addTesterRow(eventPlayer, adminContainer, playerId, testerBaseX, row0Y + (buttonSizeY + rowSpacingY) * 5,
        UI_ADMIN_BUTTON_T2_ROUND_KILLS_DEC_ID, UI_ADMIN_BUTTON_T2_ROUND_KILLS_INC_ID, UI_ADMIN_LABEL_T2_ROUND_KILLS_ID,
        mod.stringkeys.twl.adminPanel.labels.t2RoundKills, buttonSizeX, buttonSizeY, labelSizeX, decOffsetX, labelOffsetX, incOffsetX);

    addTesterRowWithValue(eventPlayer, adminContainer, playerId, testerBaseX, row0Y + (buttonSizeY + rowSpacingY) * 6,
        UI_TEST_BUTTON_ROUND_KILLS_TARGET_DEC_ID, UI_TEST_BUTTON_ROUND_KILLS_TARGET_INC_ID, UI_TEST_LABEL_ROUND_KILLS_TARGET_ID, UI_TEST_VALUE_ROUND_KILLS_TARGET_ID,
        mod.stringkeys.twl.adminPanel.tester.labels.roundKillsTarget, State.round.killsTarget, buttonSizeX, buttonSizeY, labelSizeX, ADMIN_PANEL_VALUE_SIZE_X, decOffsetX, labelOffsetX, incOffsetX);

    syncRoundKillsTargetTesterValueForAllPlayers();

    addTesterRow(eventPlayer, adminContainer, playerId, testerBaseX, row0Y + (buttonSizeY + rowSpacingY) * 7,
        UI_TEST_BUTTON_TIES_DEC_ID, UI_TEST_BUTTON_TIES_INC_ID, UI_TEST_LABEL_TIES_ID,
        mod.stringkeys.twl.adminPanel.tester.labels.ties, buttonSizeX, buttonSizeY, labelSizeX, decOffsetX, labelOffsetX, incOffsetX);

    addTesterRow(eventPlayer, adminContainer, playerId, testerBaseX, row0Y + (buttonSizeY + rowSpacingY) * 8,
        UI_TEST_BUTTON_CUR_ROUND_DEC_ID, UI_TEST_BUTTON_CUR_ROUND_INC_ID, UI_TEST_LABEL_CUR_ROUND_ID,
        mod.stringkeys.twl.adminPanel.tester.labels.currentRound, buttonSizeX, buttonSizeY, labelSizeX, decOffsetX, labelOffsetX, incOffsetX);

    addTesterRow(eventPlayer, adminContainer, playerId, testerBaseX, row0Y + (buttonSizeY + rowSpacingY) * 9,
        UI_TEST_BUTTON_CLOCK_TIME_DEC_ID, UI_TEST_BUTTON_CLOCK_TIME_INC_ID, UI_TEST_LABEL_CLOCK_TIME_ID,
        mod.stringkeys.twl.adminPanel.tester.labels.clockTime, buttonSizeX, buttonSizeY, labelSizeX, decOffsetX, labelOffsetX, incOffsetX);

    addTesterResetButton(eventPlayer, adminContainer, playerId, testerBaseX,
        row0Y + (buttonSizeY + rowSpacingY) * 10, (buttonSizeX + 8 + labelSizeX + 8 + buttonSizeX), 36);

    addTesterActionButton(eventPlayer, adminContainer, playerId, testerBaseX,
        row0Y + (buttonSizeY + rowSpacingY) * 11, (buttonSizeX + 8 + labelSizeX + 8 + buttonSizeX), 36,
        UI_TEST_BUTTON_ROUND_START_ID, UI_TEST_ROUND_START_TEXT_ID, mod.stringkeys.twl.adminPanel.tester.buttons.roundStart);

    addTesterActionButton(eventPlayer, adminContainer, playerId, testerBaseX,
        row0Y + (buttonSizeY + rowSpacingY) * 12, (buttonSizeX + 8 + labelSizeX + 8 + buttonSizeX), 36,
        UI_TEST_BUTTON_ROUND_END_ID, UI_TEST_ROUND_END_TEXT_ID, mod.stringkeys.twl.adminPanel.tester.buttons.roundEnd);

    addTesterActionButton(eventPlayer, adminContainer, playerId, testerBaseX,
        row0Y + (buttonSizeY + rowSpacingY) * 13, (buttonSizeX + 8 + labelSizeX + 8 + buttonSizeX), 36,
        UI_TEST_BUTTON_POS_DEBUG_ID, UI_TEST_POS_DEBUG_TEXT_ID, mod.stringkeys.twl.adminPanel.tester.buttons.positionDebug);

    // Plan 2 row reorder (v0.703): Tie-Breaker rows moved to the bottom of the admin section.
    // Top-to-bottom order is now: Live Redeploy -> Ceiling Punish -> Round Length -> Hard Buffer
    // -> Warn Buffer -> Tie-Breaker Setting -> Tie-Breaker Randomization Override (label + 7 buttons).
    // Rationale: everyday toggles live at the top; the busy 7-flag override is bottom-anchored.

    const liveRespawnRowY = row0Y + (buttonSizeY + rowSpacingY) * 14;
    addTesterActionButton(
        eventPlayer,
        adminContainer,
        playerId,
        testerBaseX,
        liveRespawnRowY,
        (buttonSizeX + 8 + labelSizeX + 8 + buttonSizeX),
        buttonSizeY,
        UI_ADMIN_LIVE_RESPAWN_BUTTON_ID,
        UI_ADMIN_LIVE_RESPAWN_TEXT_ID,
        getAdminLiveRespawnLabelKey()
    );

    const ceilingPunishRowY = liveRespawnRowY + (buttonSizeY + rowSpacingY);
    addTesterActionButton(
        eventPlayer,
        adminContainer,
        playerId,
        testerBaseX,
        ceilingPunishRowY,
        (buttonSizeX + 8 + labelSizeX + 8 + buttonSizeX),
        buttonSizeY,
        UI_ADMIN_CEILING_PUNISH_BUTTON_ID,
        UI_ADMIN_CEILING_PUNISH_TEXT_ID,
        getAdminCeilingPunishLabelKey()
    );

    const roundLengthRowY = ceilingPunishRowY + (buttonSizeY + rowSpacingY);
    // v0.719: roundLengthFormat = "Round Length: {0}:{1}{2}" has 3 placeholders. Without the
    // format args at build time, mod.Message(labelKey) was firing with 0 args -> engine error.
    // Pass the time parts now; syncAdminRoundLengthLabelForAllPlayers below will re-format on
    // every tick/admin-change but the build-time call must also satisfy the format contract.
    const initialRoundLengthTime = getClockTimeParts(getConfiguredRoundLengthSeconds());
    addTesterRow(
        eventPlayer,
        adminContainer,
        playerId,
        testerBaseX,
        roundLengthRowY,
        UI_ADMIN_ROUND_LENGTH_DEC_ID,
        UI_ADMIN_ROUND_LENGTH_INC_ID,
        UI_ADMIN_ROUND_LENGTH_LABEL_ID,
        mod.stringkeys.twl.adminPanel.labels.roundLengthFormat,
        buttonSizeX,
        buttonSizeY,
        labelSizeX,
        decOffsetX,
        labelOffsetX,
        incOffsetX,
        initialRoundLengthTime.minutes,
        initialRoundLengthTime.secTens,
        initialRoundLengthTime.secOnes
    );

    // H-P1: Aircraft hard-ceiling buffer (admin-tunable). Static "Hard Buffer" label + separate value widget
    // showing current meters; -/+ buttons step by AIRCRAFT_HARD_BUFFER_STEP.
    const aircraftBufferRowY = roundLengthRowY + (buttonSizeY + rowSpacingY);
    addTesterRowWithValue(
        eventPlayer,
        adminContainer,
        playerId,
        testerBaseX,
        aircraftBufferRowY,
        UI_ADMIN_AIRCRAFT_BUFFER_DEC_ID,
        UI_ADMIN_AIRCRAFT_BUFFER_INC_ID,
        UI_ADMIN_AIRCRAFT_BUFFER_LABEL_ID,
        UI_ADMIN_AIRCRAFT_BUFFER_VALUE_ID,
        STR_ADMIN_AIRCRAFT_BUFFER_LABEL,
        State.round.aircraftCeiling.hardBufferM,
        buttonSizeX,
        buttonSizeY,
        labelSizeX,
        ADMIN_PANEL_VALUE_SIZE_X,
        decOffsetX,
        labelOffsetX,
        incOffsetX
    );

    // v0.666: Aircraft warning buffer (admin-tunable). Gap between soft warning and black-screen
    // dialog. Same -/+ row as Hard Buffer, stepping by AIRCRAFT_WARNING_BUFFER_STEP.
    const aircraftWarnBufferRowY = aircraftBufferRowY + (buttonSizeY + rowSpacingY);
    addTesterRowWithValue(
        eventPlayer,
        adminContainer,
        playerId,
        testerBaseX,
        aircraftWarnBufferRowY,
        UI_ADMIN_AIRCRAFT_WARN_BUFFER_DEC_ID,
        UI_ADMIN_AIRCRAFT_WARN_BUFFER_INC_ID,
        UI_ADMIN_AIRCRAFT_WARN_BUFFER_LABEL_ID,
        UI_ADMIN_AIRCRAFT_WARN_BUFFER_VALUE_ID,
        STR_ADMIN_AIRCRAFT_WARN_BUFFER_LABEL,
        State.round.aircraftCeiling.warningBufferM,
        buttonSizeX,
        buttonSizeY,
        labelSizeX,
        ADMIN_PANEL_VALUE_SIZE_X,
        decOffsetX,
        labelOffsetX,
        incOffsetX
    );

    // Tie-Breaker Setting toggle (2nd to last). Extra TIEBREAKER_BOTTOM_GAP visually separates the
    // toggles cluster above from the busy 7-flag override block below.
    const TIEBREAKER_BOTTOM_GAP = 12;
    const tieBreakerModeRowY = aircraftWarnBufferRowY + (buttonSizeY + rowSpacingY) + TIEBREAKER_BOTTOM_GAP;
    addTesterRow(
        eventPlayer,
        adminContainer,
        playerId,
        testerBaseX,
        tieBreakerModeRowY,
        UI_ADMIN_TIEBREAKER_MODE_DEC_ID,
        UI_ADMIN_TIEBREAKER_MODE_INC_ID,
        UI_ADMIN_TIEBREAKER_MODE_LABEL_ID,
        getTieBreakerModeLabelKey(),
        buttonSizeX,
        buttonSizeY,
        labelSizeX,
        decOffsetX,
        labelOffsetX,
        incOffsetX
    );

    const tieBreakerHeaderId = UI_ADMIN_TIEBREAKER_MODE_HEADER_ID + playerId;
    const tieBreakerHeaderY = tieBreakerModeRowY + 2;
    const tieBreakerLabelHeight = 12;
    mod.AddUIText(
        tieBreakerHeaderId,
        mod.CreateVector(testerBaseX + labelOffsetX, tieBreakerHeaderY, 0),
        mod.CreateVector(labelSizeX, tieBreakerLabelHeight, 0),
        mod.UIAnchor.TopLeft,
        mod.Message(mod.stringkeys.twl.adminPanel.labels.tieBreakerSettingHeader),
        eventPlayer
    );
    const tieBreakerHeaderLabel = mod.FindUIWidgetWithName(tieBreakerHeaderId, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(tieBreakerHeaderLabel, 0);
    applyAdminPanelLabelTextColor(tieBreakerHeaderLabel);
    mod.SetUITextSize(tieBreakerHeaderLabel, 11);
    mod.SetUIWidgetParent(tieBreakerHeaderLabel, adminContainer);

    const tieBreakerModeLabel = safeFind(UI_ADMIN_TIEBREAKER_MODE_LABEL_ID + playerId);
    if (tieBreakerModeLabel) {
        const tieBreakerModeLabelY = tieBreakerModeRowY + buttonSizeY - 14;
        mod.SetUIWidgetPosition(tieBreakerModeLabel, mod.CreateVector(testerBaseX + labelOffsetX, tieBreakerModeLabelY, 0));
        safeSetUIWidgetSize(tieBreakerModeLabel, mod.CreateVector(labelSizeX, tieBreakerLabelHeight, 0));
        mod.SetUITextSize(tieBreakerModeLabel, 11);
    }

    // (Tie-Breaker is the last admin row. The randomization-override label + A-G flag buttons were
    // removed in v0.767 -- aircraft modes only ever field the single H heli flag, so forcing a zone
    // is meaningless. Overtime itself is unchanged; it still random-selects the one valid zone.)

    syncAdminTieBreakerModeLabelForAllPlayers();
    syncAdminLiveRespawnLabelForAllPlayers();
    syncAdminCeilingPunishLabelForAllPlayers();
    syncAdminRoundLengthLabelForAllPlayers();
    syncAircraftBufferAdminValueForAllPlayers();
    syncAircraftWarningBufferAdminValueForAllPlayers();
}

//#endregion ----------------- Admin Panel UI (Right Side) --------------------



//#region -------------------- Admin Panel UI builder helpers --------------------

function addTesterRow(
    eventPlayer: mod.Player,
    containerBase: mod.UIWidget,
    playerId: number,
    baseX: number,
    baseY: number,
    decButtonBaseId: string,
    incButtonBaseId: string,
    labelBaseId: string,
    labelKey: number,
    buttonSizeX: number,
    buttonSizeY: number,
    labelSizeX: number,
    decOffsetX: number,
    labelOffsetX: number,
    incOffsetX: number,
    // v0.719: optional format args for labelKey -- required when labelKey is a format string with
    // placeholders (e.g. roundLengthFormat = "Round Length: {0}:{1}{2}" has 3 placeholders).
    // Without these, mod.Message(labelKey) is called with 0 args while the format expects 3 ->
    // engine error log on admin panel open. Per the SDK 3-format-arg cap, max 3 args supported.
    labelArg0?: any,
    labelArg1?: any,
    labelArg2?: any
): void {
    // Steps:
    // 1) Ensure per-player dialog root exists
    // 2) Build left team panel widgets
    // 3) Build right team panel widgets
    // 4) Build admin panel widgets + bind button IDs
    // 5) Finalize visibility / default states

    const decButtonId = decButtonBaseId + playerId;
    const incButtonId = incButtonBaseId + playerId;

    const plusTextId = UI_TEST_PLUS_TEXT_ID + incButtonId;
    const minusTextId = UI_TEST_MINUS_TEXT_ID + decButtonId;

    const labelId = labelBaseId + playerId;

    addOutlinedButton(
        decButtonId,
        baseX + decOffsetX,
        baseY,
        buttonSizeX,
        buttonSizeY,
        mod.UIAnchor.TopLeft,
        containerBase,
        eventPlayer
    );

    const DEC_BORDER = safeFind(decButtonId + "_BORDER");
    const MINUS_TEXT = addCenteredButtonText(
        minusTextId,
        buttonSizeX,
        buttonSizeY,
        mod.Message(mod.stringkeys.twl.ui.minus),
        eventPlayer,
        DEC_BORDER ?? containerBase
    );
    if (MINUS_TEXT) {
        mod.SetUITextSize(MINUS_TEXT, 12);
        mod.SetUITextColor(MINUS_TEXT, ADMIN_PANEL_BUTTON_TEXT_COLOR);
    }

    // v0.719: build the label message with whatever format args the caller supplied. The 4
    // overloads match mod.Message's SDK signatures (0-3 format args). Avoids the engine error
    // when labelKey is a format string with placeholders but no args are passed.
    const labelMessage = (labelArg2 !== undefined)
        ? mod.Message(labelKey, labelArg0, labelArg1, labelArg2)
        : (labelArg1 !== undefined)
            ? mod.Message(labelKey, labelArg0, labelArg1)
            : (labelArg0 !== undefined)
                ? mod.Message(labelKey, labelArg0)
                : mod.Message(labelKey);
    mod.AddUIText(labelId, mod.CreateVector(baseX + labelOffsetX, baseY + 11, 0), mod.CreateVector(labelSizeX, buttonSizeY - 22, 0),
        mod.UIAnchor.TopLeft, labelMessage, eventPlayer);
    mod.SetUITextSize(mod.FindUIWidgetWithName(labelId, mod.GetUIRoot()), 12);
    const LABEL = mod.FindUIWidgetWithName(labelId, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(LABEL, 0);
    applyAdminPanelLabelTextColor(LABEL);
    mod.SetUIWidgetParent(LABEL, containerBase);

    addOutlinedButton(
        incButtonId,
        baseX + incOffsetX,
        baseY,
        buttonSizeX,
        buttonSizeY,
        mod.UIAnchor.TopLeft,
        containerBase,
        eventPlayer
    );

    const INC_BORDER = safeFind(incButtonId + "_BORDER");
    const PLUS_TEXT = addCenteredButtonText(
        plusTextId,
        buttonSizeX,
        buttonSizeY,
        mod.Message(mod.stringkeys.twl.ui.plus),
        eventPlayer,
        INC_BORDER ?? containerBase
    );
    if (PLUS_TEXT) {
        mod.SetUITextSize(PLUS_TEXT, 12);
        mod.SetUITextColor(PLUS_TEXT, ADMIN_PANEL_BUTTON_TEXT_COLOR);
    }
}

function addTesterRowWithValue(
    eventPlayer: mod.Player,
    containerBase: mod.UIWidget,
    playerId: number,
    baseX: number,
    baseY: number,
    decButtonBaseId: string,
    incButtonBaseId: string,
    labelBaseId: string,
    valueBaseId: string,
    labelKey: number,
    initialValue: number,
    buttonSizeX: number,
    buttonSizeY: number,
    labelSizeX: number,
    valueSizeX: number,
    decOffsetX: number,
    labelOffsetX: number,
    incOffsetX: number
): void {
    addTesterRow(eventPlayer, containerBase, playerId, baseX, baseY,
        decButtonBaseId, incButtonBaseId, labelBaseId, labelKey,
        buttonSizeX, buttonSizeY, labelSizeX, decOffsetX, labelOffsetX, incOffsetX);

    const valueId = valueBaseId + playerId;
    const valueX = baseX + incOffsetX - -3 - valueSizeX;

    mod.AddUIText(valueId, mod.CreateVector(valueX, baseY + 11, 0), mod.CreateVector(valueSizeX, buttonSizeY - 22, 0),
        mod.UIAnchor.TopLeft, mod.Message(mod.stringkeys.twl.system.genericCounter, Math.floor(initialValue)), eventPlayer);
    mod.SetUITextSize(mod.FindUIWidgetWithName(valueId, mod.GetUIRoot()), 12);
    const VALUE_TEXT = mod.FindUIWidgetWithName(valueId, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(VALUE_TEXT, 0);
    applyAdminPanelLabelTextColor(VALUE_TEXT);
    mod.SetUIWidgetParent(VALUE_TEXT, containerBase);
}

function syncRoundKillsTargetTesterValueForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);

    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const pid = getObjId(p);
        const widget = mod.FindUIWidgetWithName(UI_TEST_VALUE_ROUND_KILLS_TARGET_ID + pid, mod.GetUIRoot());
        if (!widget) continue;
        safeSetUITextLabel(widget, mod.Message(mod.stringkeys.twl.system.genericCounter, Math.floor(State.round.killsTarget)));
    }
    updateMatchupReadoutsForAllPlayers();
}

function addTesterResetButton(
    eventPlayer: mod.Player,
    containerBase: mod.UIWidget,
    playerId: number,
    baseX: number,
    baseY: number,
    width: number,
    height: number
): void {
    const buttonId = UI_TEST_BUTTON_CLOCK_RESET_ID + playerId;
    const labelId = UI_TEST_RESET_TEXT_ID + playerId;

    addOutlinedButton(
        buttonId,
        baseX,
        baseY,
        width,
        height,
        mod.UIAnchor.TopLeft,
        containerBase,
        eventPlayer
    );

    const resetParent = safeFind(buttonId + "_BORDER") ?? containerBase;
    const resetLabel = addCenteredButtonText(
        labelId,
        width,
        height,
        mod.Message(mod.stringkeys.twl.adminPanel.tester.buttons.clockReset),
        eventPlayer,
        resetParent
    );
    if (resetLabel) {
        mod.SetUITextSize(resetLabel, 12);
        mod.SetUITextColor(resetLabel, ADMIN_PANEL_BUTTON_TEXT_COLOR);
    }
}

function addTesterActionButton(
    eventPlayer: mod.Player,
    containerBase: mod.UIWidget,
    playerId: number,
    baseX: number,
    baseY: number,
    width: number,
    height: number,
    buttonBaseId: string,
    labelBaseId: string,
    labelKey: number
): void {
    const buttonId = buttonBaseId + playerId;
    const labelId = labelBaseId + playerId;

    addOutlinedButton(
        buttonId,
        baseX,
        baseY,
        width,
        height,
        mod.UIAnchor.TopLeft,
        containerBase,
        eventPlayer
    );

    const actionParent = safeFind(buttonId + "_BORDER") ?? containerBase;
    const actionLabel = addCenteredButtonText(
        labelId,
        width,
        height,
        mod.Message(labelKey),
        eventPlayer,
        actionParent
    );
    if (actionLabel) {
        mod.SetUITextSize(actionLabel, 12);
        mod.SetUITextColor(actionLabel, ADMIN_PANEL_BUTTON_TEXT_COLOR);
    }
}

function ensurePositionDebugWidgets(player: mod.Player): { x: mod.UIWidget; y: mod.UIWidget; z: mod.UIWidget; rotY: mod.UIWidget } | undefined {
    const pid = mod.GetObjId(player);
    const containerId = UI_POS_DEBUG_CONTAINER_ID + pid;
    const xId = UI_POS_DEBUG_X_ID + pid;
    const yId = UI_POS_DEBUG_Y_ID + pid;
    const zId = UI_POS_DEBUG_Z_ID + pid;
    const rotYId = UI_POS_DEBUG_ROTY_ID + pid;

    let container = safeFind(containerId);
    if (!container) {
        mod.AddUIContainer(
            containerId,
            mod.CreateVector(300, 17, 0), // +X to move left, +Y to move down
            mod.CreateVector(200, 18, 0),
            mod.UIAnchor.TopRight,
            mod.GetUIRoot(),
            false,
            0,
            mod.CreateVector(0, 0, 0),
            0,
            mod.UIBgFill.None,
            mod.UIDepth.AboveGameUI,
            player
        );
        container = mod.FindUIWidgetWithName(containerId, mod.GetUIRoot());
    }
    if (container) {
        mod.SetUIWidgetVisible(container, true);
    }

    const makeText = (id: string, posX: number) => {
        mod.AddUIText(
            id,
            mod.CreateVector(posX, 0, 0),
            mod.CreateVector(80, 18, 0),
            mod.UIAnchor.TopLeft,
            mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
            player
        );
        const w = mod.FindUIWidgetWithName(id, mod.GetUIRoot());
        mod.SetUIWidgetBgAlpha(w, 0);
        mod.SetUITextSize(w, 10);
        mod.SetUITextColor(w, mod.CreateVector(1, 1, 1));
        if (container) mod.SetUIWidgetParent(w, container);
        return w;
    };

    // 0, 50, 90, 140 are spacing values for the 4 text widgets
    let x = safeFind(xId);
    if (!x) x = makeText(xId, 0);
    let y = safeFind(yId);
    if (!y) y = makeText(yId, 50);
    let z = safeFind(zId);
    if (!z) z = makeText(zId, 90);
    let rotY = safeFind(rotYId);
    if (!rotY) rotY = makeText(rotYId, 140);

    if (!x || !y || !z || !rotY) return undefined;
    return { x, y, z, rotY };
}

async function positionDebugLoop(player: mod.Player, expectedToken: number): Promise<void> {
    const pid = mod.GetObjId(player);
    while (true) {
        const state = State.players.teamSwitchData[pid];
        if (!state || !state.posDebugVisible || state.posDebugToken !== expectedToken) return;
        if (!mod.IsPlayerValid(player)) return;
        if (!isPlayerDeployed(player)) return;

        const widgets = ensurePositionDebugWidgets(player);
        if (!widgets) return;

        const pos = safeGetSoldierStateVector(player, mod.SoldierStateVector.GetPosition);
        const facing = safeGetSoldierStateVector(player, mod.SoldierStateVector.GetFacingDirection);
        if (!pos || !facing) return;

        const roundTo3 = (value: number) => Math.round(value * 1000) / 1000;
        const yawRad = Math.atan2(mod.XComponentOf(facing), mod.ZComponentOf(facing));
        const yawDeg = (yawRad * 180) / Math.PI;

        safeSetUITextLabel(widgets.x, mod.Message(mod.stringkeys.twl.system.genericCounter, roundTo3(mod.XComponentOf(pos))));
        safeSetUITextLabel(widgets.y, mod.Message(mod.stringkeys.twl.system.genericCounter, roundTo3(mod.YComponentOf(pos))));
        safeSetUITextLabel(widgets.z, mod.Message(mod.stringkeys.twl.system.genericCounter, roundTo3(mod.ZComponentOf(pos))));
        safeSetUITextLabel(widgets.rotY, mod.Message(mod.stringkeys.twl.system.genericCounter, roundTo3(yawDeg)));

        await mod.Wait(2.0);
    }
}

function setPositionDebugVisibleForPlayer(player: mod.Player, visible: boolean): void {
    const pid = mod.GetObjId(player);
    const state = State.players.teamSwitchData[pid];
    if (!state) return;

    const widgets = ensurePositionDebugWidgets(player);
    if (!widgets) return;

    const container = safeFind(UI_POS_DEBUG_CONTAINER_ID + pid);
    if (container) mod.SetUIWidgetVisible(container, visible);

    mod.SetUIWidgetVisible(widgets.x, visible);
    mod.SetUIWidgetVisible(widgets.y, visible);
    mod.SetUIWidgetVisible(widgets.z, visible);
    mod.SetUIWidgetVisible(widgets.rotY, visible);

    state.posDebugToken = (state.posDebugToken + 1) % 1000000000;
    if (visible) {
        void positionDebugLoop(player, state.posDebugToken);
    }
}

//#endregion ----------------- Admin Panel UI builder helpers --------------------



//#region -------------------- Ready Dialog - Roster Render + Toggle Labels --------------------

// Builds the entire Team Switch + Admin Panel dialog.
// Responsibilities:
// - Creates left team, right team, and admin panel UI sections
// - Defines layout constants and row math for the admin panel
// - Wires all admin buttons to authoritative match state mutations
// - Ensures per-player UI roots are created once and reused

// Populates the roster UI for the given viewer. 
// - Real active player lists + team assignment
// - Default status values (NOT READY / IN MAIN BASE) for all rows
// Later phases will replace defaults with authoritative per-player state + gating + round integration.

// Applies per-row color policy for the Ready dialog:
// - Player name: white by default; green only when BOTH ready AND in main base.
// - READY / IN MAIN BASE: green
// - NOT READY / NOT IN MAIN BASE: red
function applyReadyDialogRowColors(nameWidget: mod.UIWidget | undefined, readyWidget: mod.UIWidget | undefined, baseWidget: mod.UIWidget | undefined, isReady: boolean, isInBase: boolean): void {
    if (readyWidget) mod.SetUITextColor(readyWidget, isReady ? COLOR_READY_GREEN : COLOR_NOT_READY_RED);
    if (baseWidget) mod.SetUITextColor(baseWidget, isInBase ? COLOR_READY_GREEN : COLOR_NOT_READY_RED);
    if (nameWidget) mod.SetUITextColor(nameWidget, (isReady && isInBase) ? COLOR_READY_GREEN : COLOR_NORMAL);
}

// Renders the entire Ready Up dialog state for a single viewer.
// Centralizing UI updates reduces refresh regressions as the dialog grows in complexity.
function renderReadyDialogForViewer(eventPlayer: mod.Player, viewerPid: number): void {
    refreshReadyDialogRosterForViewer(eventPlayer, viewerPid);
    updateReadyToggleButtonForViewer(eventPlayer, viewerPid);
    updateAutoReadyToggleButtonForViewer(eventPlayer, viewerPid);

}

// Renders the dialog for all players who currently have it open.
// Code Cleanup: Overlaps with refreshReadyDialogForAllVisibleViewers; consider consolidating to one entrypoint.
/**
 * Broadcast-style refresh for the ready dialog.
 * Call whenever roster membership or per-player display state changes (ready / in-main-base / team).
 */
function renderReadyDialogForAllVisibleViewers(): void {
    for (const pidStr in State.players.teamSwitchData) {
        const pid = Number(pidStr);
        const state = State.players.teamSwitchData[pid];
        if (!state || !state.dialogVisible) continue;
        const viewer = safeFindPlayer(pid);
        if (!viewer) continue;
        renderReadyDialogForViewer(viewer, pid);
    }
}

function refreshReadyDialogRosterForViewer(viewer: mod.Player, viewerPlayerId: number): void {
    const roster = getRosterDisplayEntries();
    const t1Players = roster.team1;
    const t2Players = roster.team2;

    const maxRowsPerTeam = TEAM_ROSTER_MAX_ROWS;
    const emptyMsg = mod.Message(mod.stringkeys.twl.system.genericCounter, "");
    for (let row = 0; row < maxRowsPerTeam; row++) {
        const t1NameId = UI_READY_DIALOG_T1_ROW_NAME_ID + viewerPlayerId + "_" + row;
        const t1ReadyId = UI_READY_DIALOG_T1_ROW_READY_ID + viewerPlayerId + "_" + row;
        const t1BaseId = UI_READY_DIALOG_T1_ROW_BASE_ID + viewerPlayerId + "_" + row;

        const t2NameId = UI_READY_DIALOG_T2_ROW_NAME_ID + viewerPlayerId + "_" + row;
        const t2ReadyId = UI_READY_DIALOG_T2_ROW_READY_ID + viewerPlayerId + "_" + row;
        const t2BaseId = UI_READY_DIALOG_T2_ROW_BASE_ID + viewerPlayerId + "_" + row;

        const t1Name = mod.FindUIWidgetWithName(t1NameId, mod.GetUIRoot());
        const t1Ready = mod.FindUIWidgetWithName(t1ReadyId, mod.GetUIRoot());
        const t1Base = mod.FindUIWidgetWithName(t1BaseId, mod.GetUIRoot());

        const t2Name = mod.FindUIWidgetWithName(t2NameId, mod.GetUIRoot());
        const t2Ready = mod.FindUIWidgetWithName(t2ReadyId, mod.GetUIRoot());
        const t2Base = mod.FindUIWidgetWithName(t2BaseId, mod.GetUIRoot());

        const t1Entry = (row < t1Players.length) ? t1Players[row] : undefined;
        const t2Entry = (row < t2Players.length) ? t2Players[row] : undefined;
        const p1 = t1Entry?.player;
        const p2 = t2Entry?.player;

        // Hide unused placeholder rows (prevents 'unknown string' artifacts and reduces visual noise).
        // Anti-flicker order: set TEXT first, THEN visibility. If a previously-hidden row had stale
        // text "OLD_NAME" and refresh flipped visible BEFORE updating text, the engine could paint
        // one frame with the stale text before the text update applied. Setting text first
        // guarantees that by the time the widget becomes visible, the text is already correct.
        const hasP1 = !!t1Entry;
        const hasP2 = !!t2Entry;

        safeSetUITextLabel(t1Name, hasP1 ? getRosterEntryNameMessage(t1Entry) : emptyMsg);
        safeSetUITextLabel(
            t1Ready,
            hasP1
                ? (p1
                    ? (State.players.readyByPid[mod.GetObjId(p1)] ? mod.Message(mod.stringkeys.twl.readyDialog.status.ready) : mod.Message(mod.stringkeys.twl.readyDialog.status.notReady))
                    : mod.Message(mod.stringkeys.twl.readyDialog.status.notReady))
                : emptyMsg
        );
        safeSetUITextLabel(
            t1Base,
            hasP1
                ? (p1
                    ? (isPlayerInMainBaseForReady(mod.GetObjId(p1)) ? mod.Message(mod.stringkeys.twl.readyDialog.baseStatus.in) : mod.Message(mod.stringkeys.twl.readyDialog.baseStatus.out))
                    : mod.Message(mod.stringkeys.twl.readyDialog.baseStatus.out))
                : emptyMsg
        );
        if (p1) {
            const p1Id = mod.GetObjId(p1);
            const p1Ready = !!State.players.readyByPid[p1Id];
            const p1InBase = isPlayerInMainBaseForReady(p1Id);
            applyReadyDialogRowColors(t1Name, t1Ready, t1Base, p1Ready, p1InBase);
        } else if (hasP1) {
            applyReadyDialogRowColors(t1Name, t1Ready, t1Base, false, false);
        } else {
            // Empty row: default to white for any placeholder text.
            if (t1Name) mod.SetUITextColor(t1Name, COLOR_NORMAL);
            if (t1Ready) mod.SetUITextColor(t1Ready, COLOR_NORMAL);
            if (t1Base) mod.SetUITextColor(t1Base, COLOR_NORMAL);
        }

        safeSetUITextLabel(t2Name, hasP2 ? getRosterEntryNameMessage(t2Entry) : emptyMsg);
        safeSetUITextLabel(
            t2Ready,
            hasP2
                ? (p2
                    ? (State.players.readyByPid[mod.GetObjId(p2)] ? mod.Message(mod.stringkeys.twl.readyDialog.status.ready) : mod.Message(mod.stringkeys.twl.readyDialog.status.notReady))
                    : mod.Message(mod.stringkeys.twl.readyDialog.status.notReady))
                : emptyMsg
        );
        safeSetUITextLabel(
            t2Base,
            hasP2
                ? (p2
                    ? (isPlayerInMainBaseForReady(mod.GetObjId(p2)) ? mod.Message(mod.stringkeys.twl.readyDialog.baseStatus.in) : mod.Message(mod.stringkeys.twl.readyDialog.baseStatus.out))
                    : mod.Message(mod.stringkeys.twl.readyDialog.baseStatus.out))
                : emptyMsg
        );
        if (p2) {
            const p2Id = mod.GetObjId(p2);
            const p2Ready = !!State.players.readyByPid[p2Id];
            const p2InBase = isPlayerInMainBaseForReady(p2Id);
            applyReadyDialogRowColors(t2Name, t2Ready, t2Base, p2Ready, p2InBase);
        } else if (hasP2) {
            applyReadyDialogRowColors(t2Name, t2Ready, t2Base, false, false);
        } else {
            if (t2Name) mod.SetUITextColor(t2Name, COLOR_NORMAL);
            if (t2Ready) mod.SetUITextColor(t2Ready, COLOR_NORMAL);
            if (t2Base) mod.SetUITextColor(t2Base, COLOR_NORMAL);
        }

        // Visibility flip LAST (after text + colors set). See anti-flicker comment at top of loop.
        if (t1Name) mod.SetUIWidgetVisible(t1Name, hasP1);
        if (t1Ready) mod.SetUIWidgetVisible(t1Ready, hasP1);
        if (t1Base) mod.SetUIWidgetVisible(t1Base, hasP1);
        if (t2Name) mod.SetUIWidgetVisible(t2Name, hasP2);
        if (t2Ready) mod.SetUIWidgetVisible(t2Ready, hasP2);
        if (t2Base) mod.SetUIWidgetVisible(t2Base, hasP2);
    }
}

// Updates the Ready toggle button label for the given viewer based on that viewer's current ready state.
function updateReadyToggleButtonForViewer(viewer: mod.Player, viewerPlayerId: number): void {
    const btnLabelId = UI_READY_DIALOG_BUTTON_READY_LABEL_ID + viewerPlayerId;
    const labelWidget = mod.FindUIWidgetWithName(btnLabelId, mod.GetUIRoot());
    if (!labelWidget) return;

    const isReady = !!State.players.readyByPid[viewerPlayerId];
    const labelMsg = isReady
        ? mod.Message(mod.stringkeys.twl.readyDialog.buttons.notReady)
        : mod.Message(mod.stringkeys.twl.readyDialog.buttons.ready);

    safeSetUITextLabel(labelWidget, labelMsg);
}

// Updates the Auto-Ready toggle button label for the given viewer based on that viewer's current auto-ready state.
function updateAutoReadyToggleButtonForViewer(viewer: mod.Player, viewerPlayerId: number): void {
    const btnLabelId = UI_READY_DIALOG_BUTTON_AUTO_READY_LABEL_ID + viewerPlayerId;
    const labelWidget = mod.FindUIWidgetWithName(btnLabelId, mod.GetUIRoot());
    if (!labelWidget) return;

    const isAutoReady = !!State.players.autoReadyByPid[viewerPlayerId];
    const labelMsg = isAutoReady
        ? mod.Message(mod.stringkeys.twl.readyDialog.buttons.autoReadyDisable)
        : mod.Message(mod.stringkeys.twl.readyDialog.buttons.autoReadyEnable);

    safeSetUITextLabel(labelWidget, labelMsg);
}

//#endregion ----------------- Ready Dialog - Roster Render + Toggle Labels --------------------



//#region -------------------- Ready Dialog - Map/Mode Config UI Readout --------------------

// Updates the Ready Up dialog "Best of {0} Rounds" label for a single viewer.
function updateBestOfRoundsLabelForPid(pid: number): void {
    const labelId = UI_READY_DIALOG_BESTOF_LABEL_ID + pid;
    const labelWidget = safeFind(labelId);
    if (!labelWidget) return;
    safeSetUITextLabel(labelWidget, mod.Message(mod.stringkeys.twl.readyDialog.bestOfLabel, Math.floor(State.round.max)));
}

function updateBestOfRoundsLabelForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        updateBestOfRoundsLabelForPid(mod.GetObjId(p));
    }
}

function updateReadyDialogMapLabelForPid(pid: number): void {
    const valueId = UI_READY_DIALOG_MAP_VALUE_ID + pid;
    const valueWidget = safeFind(valueId);
    if (!valueWidget) return;
    safeSetUITextLabel(valueWidget, mod.Message(getMapNameKey(ACTIVE_MAP_KEY)));
}

function updateReadyDialogMapLabelForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        updateReadyDialogMapLabelForPid(mod.GetObjId(p));
    }
}

// Per-field dirty-state shape (Plan 2). buildReadyDialogModeConfigDiffState compares the pending
// modeConfig against confirmed; applyDirtyStateColorsForPid uses it to color value widgets and
// toggle the "Unsaved changes!" notice. T2 mirrors T1 on confirm so vehiclesT2Dirty effectively
// tracks the T1 delta, but we compute it independently for safety.
type ReadyDialogModeConfigDiffState = {
    hasUnsavedChanges: boolean;
    gameModeDirty: boolean;
    aircraftCeilingDirty: boolean;
    vehicleHealthDirty: boolean;
    soldierHpDirty: boolean;
    vehiclesT1Dirty: boolean;
    vehiclesT2Dirty: boolean;
    vehicleSelectionDirty: boolean;
    matchupDirty: boolean;
    playersDirty: boolean;
};

function buildReadyDialogModeConfigDiffState(): ReadyDialogModeConfigDiffState {
    const cfg = State.round.modeConfig;
    const c = cfg.confirmed;
    const gameModeDirty = cfg.gameMode !== c.gameMode;
    // v0.717: numeric value only -- override flag is internal implementation state and shouldn't
    // contribute to dirty signal. ensureCustomGameModeForManualChange has a load-bearing side
    // effect that sets pending.overridePending = true when flipping to Custom from a preset
    // with useCustomCeiling=true (preserves the Custom mode's ceiling display so it doesn't
    // flip from numeric to "Vanilla" when user edits any other knob). The flag mutation is
    // necessary for display consistency but should NOT cascade into a false dirty signal --
    // editing HP shouldn't paint the ceiling red. User only cares about the numeric value.
    const aircraftCeilingDirty = Math.floor(cfg.aircraftCeiling) !== Math.floor(c.aircraftCeiling);
    const vehicleHealthDirty =
        Math.round(cfg.vehicleHealthMultiplier * 100) !== Math.round(c.vehicleHealthMultiplier * 100);
    // v0.725 Soldier HP dirty diff -- parallel to vehicle health, same 2-decimal compare.
    const soldierHpDirty =
        Math.round(cfg.soldierHpMultiplier * 100) !== Math.round(c.soldierHpMultiplier * 100);
    const vehiclesT1Dirty = cfg.vehicleIndexT1 !== c.vehicleIndexT1;
    const vehiclesT2Dirty = cfg.vehicleIndexT2 !== c.vehicleIndexT2;
    // v0.732 matchup + players dirty diff. matchupPresetIndex drives both the "Vehicles: X v Y" row
    // and the "Target Kills to win Round: K" subtitle (kills target is derived from MATCHUP_PRESETS).
    const matchupDirty = cfg.matchupPresetIndex !== c.matchupPresetIndex;
    const playersDirty = cfg.autoStartMinActivePlayers !== c.autoStartMinActivePlayers;
    // Per-knob vehicle selection dirty: any knob whose pending index differs from confirmed. This is
    // what makes the "Unsaved changes!" notice fire when vehicles are changed via the knob grid (the
    // grid already colors individual knobs; this surfaces it to the global notice + Confirm gating).
    let vehicleSelectionDirty = false;
    const pendSel = cfg.vehicleSelectionIndexByKey || {};
    const confSel = c.vehicleSelectionIndexByKey || {};
    for (const k of READY_DIALOG_ALL_VEHICLE_KNOB_KEYS) {
        if ((pendSel[k] ?? 0) !== (confSel[k] ?? 0)) { vehicleSelectionDirty = true; break; }
    }
    const hasUnsavedChanges =
        gameModeDirty || aircraftCeilingDirty || vehicleHealthDirty || soldierHpDirty
        || vehiclesT1Dirty || vehiclesT2Dirty || vehicleSelectionDirty || matchupDirty || playersDirty;
    return { hasUnsavedChanges, gameModeDirty, aircraftCeilingDirty, vehicleHealthDirty, soldierHpDirty, vehiclesT1Dirty, vehiclesT2Dirty, vehicleSelectionDirty, matchupDirty, playersDirty };
}

// Three-color scheme per Q3 answer: labels stay white (untouched here), confirmed values green, dirty values red.
// Also toggles the "Unsaved changes!" notice visibility (Q4: hidden when nothing dirty).
function applyDirtyStateColorsForPid(pid: number): void {
    const diff = buildReadyDialogModeConfigDiffState();
    const setValueColor = (idBase: string, dirty: boolean) => {
        const w = safeFind(idBase + pid);
        if (w) mod.SetUITextColor(w, dirty ? COLOR_NOT_READY_RED : COLOR_READY_GREEN);
    };
    // v0.723: ceiling-vanilla-locked check. If sticky hasEverAppliedCustom AND pending would
    // resolve to Vanilla, the ceiling value renders YELLOW (not green/red) -- communicates the
    // confirm-time lockout without needing to wait for the user to try Confirm.
    const cfg = State.round.modeConfig;
    const pendingWouldBeVanilla = !shouldApplyCustomCeilingForConfig(cfg.gameMode, cfg.aircraftCeilingOverridePending);
    const ceilingLocked = State.round.aircraftCeiling.hasEverAppliedCustom && pendingWouldBeVanilla;

    setValueColor(UI_READY_DIALOG_MODE_GAME_VALUE_ID, diff.gameModeDirty);
    if (ceilingLocked) {
        const sw = safeFind(UI_READY_DIALOG_MODE_SETTINGS_VALUE_ID + pid);
        if (sw) mod.SetUITextColor(sw, COLOR_WARNING_YELLOW);
    } else {
        setValueColor(UI_READY_DIALOG_MODE_SETTINGS_VALUE_ID, diff.aircraftCeilingDirty);
    }
    setValueColor(UI_READY_DIALOG_VEHICLE_HEALTH_VALUE_ID, diff.vehicleHealthDirty);
    setValueColor(UI_READY_DIALOG_SOLDIER_HP_VALUE_ID, diff.soldierHpDirty);
    setValueColor(UI_READY_DIALOG_MODE_VEHICLES_T1_VALUE_ID, diff.vehiclesT1Dirty);
    setValueColor(UI_READY_DIALOG_MODE_VEHICLES_T2_VALUE_ID, diff.vehiclesT2Dirty);
    // v0.732 matchup row (vehicles/team + kills target subtitle) + players row (players/side + min-players subtitle).
    setValueColor(UI_READY_DIALOG_MATCHUP_LABEL_ID, diff.matchupDirty);
    setValueColor(UI_READY_DIALOG_MATCHUP_KILLSTARGET_ID, diff.matchupDirty);
    setValueColor(UI_READY_DIALOG_MATCHUP_MINPLAYERS_ID, diff.playersDirty);
    setValueColor(UI_READY_DIALOG_MATCHUP_MINPLAYERS_TOTAL_ID, diff.playersDirty);
    const notice = safeFind(UI_READY_DIALOG_UNSAVED_NOTICE_ID + pid);
    if (notice) mod.SetUIWidgetVisible(notice, diff.hasUnsavedChanges);
    // v0.723: yellow tip widget visibility -- shows ONLY when locked AND unsaved changes exist
    // (per user choice: "only when both fire"). Keeps quiet in steady-state; nags during edits.
    const ceilingLockNotice = safeFind(UI_READY_DIALOG_CEILING_LOCK_NOTICE_ID + pid);
    if (ceilingLockNotice) mod.SetUIWidgetVisible(ceilingLockNotice, ceilingLocked && diff.hasUnsavedChanges);
    // v0.724: gray out the Confirm button when the ceiling-lock would silently reject the save.
    // Disables click events too -- redundant with the team-switch.ts case-statement guard, but
    // means the visual cue and the click suppression are computed from the same condition.
    const confirmDisabled = ceilingLocked && diff.hasUnsavedChanges;
    const confirmBtn = safeFind(UI_READY_DIALOG_MODE_CONFIRM_ID + pid);
    if (confirmBtn) {
        try { mod.EnableUIButtonEvent(confirmBtn, mod.UIButtonEvent.ButtonUp, !confirmDisabled); } catch {}
    }
    const confirmLabel = safeFind(UI_READY_DIALOG_MODE_CONFIRM_LABEL_ID + pid);
    if (confirmLabel) mod.SetUITextColor(confirmLabel, confirmDisabled ? COLOR_GRAY : COLOR_WHITE);

    // v0.733 Restart-needed indicator. Highlights the Restart button label red + reveals the
    // "Vehicles changed - Restart Needed" notice when a Confirm since the last Restart click changed
    // vehicle-identity settings (matchup / vehicle T1 / vehicle T2). Cleared on Restart click via
    // triggerFreshRoundSetup. Independent of dirty state -- this fires AFTER Confirm has committed
    // the change.
    const needsRestart = State.round.needsRestartForVehicleChange;
    const resetLabel = safeFind(UI_READY_DIALOG_MODE_RESET_LABEL_ID + pid);
    if (resetLabel) mod.SetUITextColor(resetLabel, needsRestart ? COLOR_NOT_READY_RED : COLOR_WHITE);
    const restartNeededNotice = safeFind(UI_READY_DIALOG_RESTART_NEEDED_NOTICE_ID + pid);
    if (restartNeededNotice) mod.SetUIWidgetVisible(restartNeededNotice, needsRestart);
}

function updateReadyDialogModeConfigForPid(pid: number): void {
    const cfg = State.round.modeConfig;

    // Per-spawner knob grid (in-roster): value labels + dirty colors + "Not on this Map" lock.
    updateReadyDialogKnobGridForPid(pid);

    // D3 symmetric-count guard notice: visible when the pending T1/T2 vehicle counts differ.
    const symWarn = safeFind(UI_READY_DIALOG_SYMMETRIC_WARNING_ID + pid);
    if (symWarn) mod.SetUIWidgetVisible(symWarn, !isPendingVehicleCountSymmetric());

    const gameLabel = safeFind(UI_READY_DIALOG_MODE_GAME_LABEL_ID + pid);
    if (gameLabel) safeSetUITextLabel(gameLabel, mod.Message(mod.stringkeys.twl.readyDialog.gameModeLabel));
    const gameValue = safeFind(UI_READY_DIALOG_MODE_GAME_VALUE_ID + pid);
    if (gameValue) safeSetUITextLabel(gameValue, mod.Message(cfg.gameMode));

    const settingsLabel = safeFind(UI_READY_DIALOG_MODE_SETTINGS_LABEL_ID + pid);
    if (settingsLabel) safeSetUITextLabel(settingsLabel, mod.Message(mod.stringkeys.twl.readyDialog.modeSettingsLabel));
    const settingsValue = safeFind(UI_READY_DIALOG_MODE_SETTINGS_VALUE_ID + pid);
    if (settingsValue) {
        const applyCustomCeiling = shouldApplyCustomCeilingForConfig(cfg.gameMode, cfg.aircraftCeilingOverridePending);
        const ceilingValue = applyCustomCeiling
            ? Math.floor(cfg.aircraftCeiling)
            : STR_READY_DIALOG_AIRCRAFT_CEILING_VANILLA;
        safeSetUITextLabel(
            settingsValue,
            mod.Message(cfg.gameSettings, ceilingValue)
        );
    }

    // Vehicle Health Multiplier value text -- pending value, mirrors what's shown for the ceiling.
    const vehicleHealthValue = safeFind(UI_READY_DIALOG_VEHICLE_HEALTH_VALUE_ID + pid);
    if (vehicleHealthValue) {
        safeSetUITextLabel(
            vehicleHealthValue,
            mod.Message(STR_READY_DIALOG_VEHICLE_HEALTH_FORMAT, Math.round(cfg.vehicleHealthMultiplier * 100))
        );
    }

    // v0.725 Soldier HP value text -- pending value, parallel to vehicle health above.
    const soldierHpValue = safeFind(UI_READY_DIALOG_SOLDIER_HP_VALUE_ID + pid);
    if (soldierHpValue) {
        safeSetUITextLabel(
            soldierHpValue,
            mod.Message(STR_READY_DIALOG_SOLDIER_HP_FORMAT, Math.round(cfg.soldierHpMultiplier * 100))
        );
    }

    const vehiclesT1Label = safeFind(UI_READY_DIALOG_MODE_VEHICLES_T1_LABEL_ID + pid);
    if (vehiclesT1Label) {
        safeSetUITextLabel(
            vehiclesT1Label,
            mod.Message(mod.stringkeys.twl.readyDialog.vehiclesLabelFormat, getTeamNameKey(TeamID.Team1))
        );
    }
    const vehiclesT1Value = safeFind(UI_READY_DIALOG_MODE_VEHICLES_T1_VALUE_ID + pid);
    if (vehiclesT1Value) safeSetUITextLabel(vehiclesT1Value, mod.Message(cfg.vehiclesT1));

    const vehiclesT2Label = safeFind(UI_READY_DIALOG_MODE_VEHICLES_T2_LABEL_ID + pid);
    if (vehiclesT2Label) {
        safeSetUITextLabel(
            vehiclesT2Label,
            mod.Message(mod.stringkeys.twl.readyDialog.vehiclesLabelFormat, getTeamNameKey(TeamID.Team2))
        );
    }
    const vehiclesT2Value = safeFind(UI_READY_DIALOG_MODE_VEHICLES_T2_VALUE_ID + pid);
    if (vehiclesT2Value) safeSetUITextLabel(vehiclesT2Value, mod.Message(cfg.vehiclesT2));

    // Plan 2: recolor value widgets (green=confirmed, red=dirty) + toggle "Unsaved changes!" notice.
    applyDirtyStateColorsForPid(pid);
}

function updateReadyDialogModeConfigForAllVisibleViewers(): void {
    // v0.715: try to snap-back from Custom to a matching preset BEFORE rendering, so the label
    // (and the per-pid render that reads State.round.modeConfig.gameMode) sees the correct
    // value when the user edits a knob and then edits it back to the preset value. See
    // detectAndApplyMatchingPreset at ready-dialog.ts:~3114 for the full why.
    detectAndApplyMatchingPreset();
    for (const pidStr in State.players.teamSwitchData) {
        const pid = Number(pidStr);
        const state = State.players.teamSwitchData[pid];
        if (!state || !state.dialogVisible) continue;
        updateReadyDialogModeConfigForPid(pid);
    }
}

//#endregion ----------------- Ready Dialog - Map/Mode Config UI Readout --------------------



//#region -------------------- Aircraft Ceiling (Soft Enforcement) --------------------

// v0.669 H-P1 3-STAGE LAYERED AIRCRAFT CEILING (ceiling-centered re-anchor)
//
// The user-facing `aircraftCeiling` setting is now the BLACK-SCREEN threshold -- the central
// reference point. The warning buffer extends BELOW the ceiling (yellow altimeter + small
// label) and the hard buffer extends ABOVE it (engine physics pushback). This means when the
// altimeter readout matches the ceiling setting exactly, the black screen is about to fire --
// a clean visual correspondence the v0.666 stacked-above layout didn't have.
//
// Vertical layout (world Y), Firestorm/TWL example values (floor=132, ceiling=130,
// warnBuf=5, hardBuf=25):
//
//   ground (floorY=132)
//     ...
//     WARNING        = floor + ceilingSetting - warningBufferM      = 257
//                      altimeter text goes YELLOW
//                      "ALTITUDE WARNING" label appears above altimeter
//     ... warningBufferM gap (default 5; player flies up through it) ...
//     BLACK SCREEN   = floor + ceilingSetting                       = 262   <-- CEILING ANCHOR
//                      960x540 centered black dialog appears
//     ... hardBufferM gap (default 25; player flies up through it) ...
//     HARD PHYSICS   = floor + ceilingSetting + hardBufferM         = 287
//                      mod.SetMaxVehicleHeightLimitScale engages engine pushback
//
// Engine scaling note (v0.664 diagnosis, still applies): mod.SetMaxVehicleHeightLimitScale
// applies the scale to hudMaxY ONLY, NOT to (floorY + hudMaxY). So to land the engine cap
// at targetWorldY we use scale = targetWorldY / hudMaxY (no floor offset in denominator).
//
// Migration from v0.666 layout (warnBuf used to stack ABOVE ceiling): on Firestorm/TWL the
// hard cap moves from 292 -> 287 (5 units lower) and the black screen moves from 267 -> 262
// (5 units lower). The warning threshold drops 257 (was 262). Per-map ceilingSetting values
// may need a small downward retune since "ceiling" now means where physics gives a 25-unit
// runway instead of where the warning text first appears.
function getAircraftSoftCeilingWorldY(): number {
    // WARNING threshold: warningBufferM BELOW the ceiling setting. Yellow + label fire here.
    const floorY = Math.floor(State.round.aircraftCeiling.hudFloorY);
    const softHud = Math.max(1, Math.floor(State.round.modeConfig.confirmed.aircraftCeiling));
    const warnBuffer = Math.max(0, Math.floor(State.round.aircraftCeiling.warningBufferM));
    return floorY + softHud - warnBuffer;
}

// v0.669: BLACK SCREEN threshold = AT the ceiling value (the central anchor). Aircraft only.
function getAircraftWarningCeilingWorldY(): number {
    const floorY = Math.floor(State.round.aircraftCeiling.hudFloorY);
    const softHud = Math.max(1, Math.floor(State.round.modeConfig.confirmed.aircraftCeiling));
    return floorY + softHud;
}

// v0.669: HARD PHYSICS threshold = ceiling + hardBufferM (above the ceiling).
function getAircraftHardCeilingWorldY(): number {
    const floorY = Math.floor(State.round.aircraftCeiling.hudFloorY);
    const softHud = Math.max(1, Math.floor(State.round.modeConfig.confirmed.aircraftCeiling));
    const hardBuffer = Math.max(0, Math.floor(State.round.aircraftCeiling.hardBufferM));
    return floorY + softHud + hardBuffer;
}

// v0.669 H-P1 layered ceiling -- HARD CAP (engine pushback) at ceiling + hardBufferM.
// See header comment on getAircraftSoftCeilingWorldY() for the full 3-stage layout + scale derivation.
function applyCustomAircraftCeilingHardLimiter(): void {
    const baseHud = Math.max(1, Math.floor(State.round.aircraftCeiling.hudMaxY));
    const targetWorldY = Math.max(1, getAircraftHardCeilingWorldY());
    // Engine applies scale relative to hudMaxY only (NO floor offset). See v0.664 diagnosis.
    const scale = targetWorldY / baseHud;
    mod.SetMaxVehicleHeightLimitScale(scale);
}

// v0.662 ROOT CAUSE: mod.CompareVehicleName is unreliable per Conquest CQ_Bug_43 (documented at
// conquest/boundary/enforcement.ts:140-144 + conquest Changelog v1.368). Confirmed in helis-only
// v0.661 diagnostic: user in heli with vehicleFoundCount=1 but isAircraftCount=0 -- CompareVehicleName
// returned false for every entry in the chain despite the user being in an AH64/Eurocopter/UH60.
//
// Fix: classify aircraft via slot binding (the spawn system stores the pre-known vehicleType enum
// in State.vehicles.slots[i].vehicleType, and binds spawned vehicle objIds via vehicleToSlot[objId]).
// Pure JS switch on the enum is reliable; mod.CompareVehicleName at runtime is not.
function isAircraftVehicleType(vehicleType: mod.VehicleList): boolean {
    // Jets
    if (vehicleType === mod.VehicleList.F16) return true;
    if (vehicleType === mod.VehicleList.F22) return true;
    if (vehicleType === mod.VehicleList.JAS39) return true;
    if (vehicleType === mod.VehicleList.SU57) return true;
    // Helis + transports
    if (vehicleType === mod.VehicleList.AH64) return true;
    if (vehicleType === mod.VehicleList.Eurocopter) return true;
    if (vehicleType === mod.VehicleList.UH60) return true;
    if (vehicleType === mod.VehicleList.UH60_Pax) return true;
    if (vehicleType === (mod.VehicleList as any).AH6M) return true;
    if (vehicleType === (mod.VehicleList as any).AH6M_Pax) return true;
    if (vehicleType === mod.VehicleList.Cheetah) return true;
    if (vehicleType === mod.VehicleList.Flyer60) return true;
    return false;
}

function isAircraftVehicle(vehicle: mod.Vehicle): boolean {
    const objId = safeGetObjId(vehicle);
    if (objId === undefined) return false;
    const slotIndex = State.vehicles.vehicleToSlot[objId];
    if (slotIndex === undefined) return false;
    const slot = State.vehicles.slots[slotIndex];
    if (!slot) return false;
    return isAircraftVehicleType(slot.vehicleType);
}

// H-P1: per-pid widget visibility toggle with countdown lifecycle.
//   On show: stamp startedAtSecondsByPid[pid] = now, seed countdown digit at ALTITUDE_WARNING_COUNTDOWN_SECONDS.
//   On hide: delete the timestamp so the next ascent starts a fresh window.
// Diff-gated via altitudeWarningVisibleByPid so repeated calls don't re-fire widget writes.
function setAltitudeWarningVisibleForPid(pid: number, visible: boolean): void {
    const previously = !!State.players.altitudeWarningVisibleByPid?.[pid];
    if (previously === visible) return;
    State.players.altitudeWarningVisibleByPid[pid] = visible;

    const refs = State.hudCache.hudByPid[pid];
    if (!refs) return;
    if (visible) {
        const player = safeFindPlayer(pid);
        if (player) ensureAltitudeWarningUiForPlayer(player);
    }
    safeSetUIWidgetVisible(refs.altitudeWarningRoot, visible);
    if (visible) {
        State.players.altitudeWarningStartedAtSecondsByPid[pid] = mod.GetMatchTimeElapsed();
        if (refs.altitudeWarningCountdown) {
            safeSetUITextLabel(
                refs.altitudeWarningCountdown,
                mod.Message(mod.stringkeys.twl.system.genericCounter, ALTITUDE_WARNING_COUNTDOWN_SECONDS)
            );
        }
        // v0.670: stamp "Ceiling: X" with the currently-confirmed ceiling setting each time the
        // dialog shows. The ceiling can change between rounds via the Ready Dialog so we resolve
        // it fresh per show rather than baking it into the widget at construction time.
        if (refs.altitudeWarningCeilingLabel) {
            const ceilingValue = Math.floor(State.round.modeConfig.confirmed.aircraftCeiling);
            safeSetUITextLabel(
                refs.altitudeWarningCeilingLabel,
                mod.Message(STR_HUD_ALTITUDE_WARNING_CEILING_FORMAT, ceilingValue)
            );
        }
        // v0.706: show the red "YOU WILL BE DESTROYED!" line only when ceiling punish is ON. If the
        // admin toggle flips OFF mid-exposure the line stays visible until next show -- acceptable
        // since the punishment isn't going to fire anyway (admin gate also checked in the loop).
        if (refs.altitudeWarningDestroyedLabel) {
            safeSetUIWidgetVisible(refs.altitudeWarningDestroyedLabel, State.admin.ceilingPunishEnabled);
        }
    } else {
        delete State.players.altitudeWarningStartedAtSecondsByPid[pid];
        // Re-arm ceiling-punish for the next exposure (descend below warning, exit vehicle, undeploy).
        delete State.players.ceilingPunishFiredByPid[pid];
    }
}

// v0.666 H-P1 3-STAGE LAYERED ALTITUDE LOOP (5Hz, iterates mod.AllPlayers each tick).
//
// Per player each tick:
//   not in aircraft           → hide altimeter, hide warning label, hide black-screen dialog
//   in aircraft, posY <= soft → altimeter GREEN with current Y, no label, no dialog
//   posY > soft, <= warning   → altimeter YELLOW with current Y, "ALTITUDE WARNING" label, no dialog
//   posY > warning            → altimeter YELLOW + label visible + BLACK SCREEN dialog
//   (engine hard cap engages at warning + hardBuffer, outside this loop's concern — that's just
//    SetMaxVehicleHeightLimitScale silently pushing the vehicle back down.)
//
// Why AllPlayers each tick (v0.650-v0.652 lesson): the playerInAircraftByPid cache populated by
// OnPlayerEnterVehicle is unreliable -- the event drops silently when team is unassigned at the
// time of entry. Iterating AllPlayers and reading IsInVehicle/GetVehicleFromPlayer per-tick reads
// the engine's authoritative state. At N=2-8 players this is trivially cheap.
//
// customEnabled gate (Vanilla mode + useCustomCeiling=false maps): when off, the entire
// 3-stage warning is suppressed AND the altimeter card hides — the engine's vanilla ceiling
// applies and the player shouldn't see custom-ceiling chrome.
async function runAircraftWarningLoop(): Promise<void> {
    const lastCountdownByPid: Record<number, number> = {};
    const lastAltimeterTextYByPid: Record<number, number> = {};
    const lastAltimeterStageByPid: Record<number, number> = {};
    const lastWarningLabelVisibleByPid: Record<number, boolean> = {};

    // Three-stage altitude warning, per v0.666 H-P1 layered ceiling spec.
    // Thresholds (world-Y, derived from State.round.modeConfig.confirmed.aircraftCeiling):
    //   - STAGE_GREEN  altimeter green text, no warning  (posY <= softY)
    //   - STAGE_YELLOW altimeter yellow + "ALT WARNING"  (softY < posY <= warningY)
    //   - STAGE_BLACK  STAGE_YELLOW + 960x540 black-screen dialog with countdown (posY > warningY)
    //
    // softY    = floorY + ceiling - warningBufferM   (configurable via admin warn buffer)
    // warningY = floorY + ceiling                    (the "you are AT the ceiling" line)
    // hardY    = floorY + ceiling + hardBufferM      (engine pushback via SetMaxVehicleHeightLimitScale)
    //
    // Hysteresis: see AIRCRAFT_SOFT_CEILING_ENTER_BUFFER / EXIT_BUFFER for stage-flip thresholds.
    const STAGE_GREEN = 0;     // altimeter green, no label, no black screen
    const STAGE_YELLOW = 1;    // altimeter yellow + "ALTITUDE WARNING" label
    const STAGE_BLACK = 2;     // STAGE_YELLOW + 960x540 black-screen dialog

    // Fix 4 (v0.692): teardown sentinel. When customEnabled flips false, tear down once and
    // then skip the per-tick AllPlayers iteration until it flips back to true. Saves 5
    // AllPlayers iterations / sec in Vanilla mode + on any map with useCustomCeiling: false.
    let teardownComplete = false;

    while (true) {
        await mod.Wait(AIRCRAFT_SOFT_CEILING_TICK_SECONDS);

        if (!State.round.aircraftCeiling.customEnabled) {
            if (!teardownComplete) {
                // Vanilla mode: tear down everything we own (one-shot).
                for (const pidStr in State.players.altitudeWarningVisibleByPid) {
                    const pid = Number(pidStr);
                    if (State.players.altitudeWarningVisibleByPid[pid]) {
                        setAltitudeWarningVisibleForPid(pid, false);
                        delete lastCountdownByPid[pid];
                    }
                }
                const players = mod.AllPlayers();
                const count = mod.CountOf(players);
                for (let i = 0; i < count; i++) {
                    const player = mod.ValueInArray(players, i) as mod.Player;
                    const pid = safeGetPlayerId(player);
                    if (pid === undefined) continue;
                    setAltimeterVisibleForPid(pid, false);
                    setAltimeterWarningLabelVisibleForPid(pid, false);
                    delete lastAltimeterTextYByPid[pid];
                    delete lastAltimeterStageByPid[pid];
                    delete lastWarningLabelVisibleByPid[pid];
                }
                teardownComplete = true;
            }
            continue;
        }
        teardownComplete = false;  // reset when custom ceiling re-enables (admin Confirm flip)

        const softY = getAircraftSoftCeilingWorldY();
        const warningY = getAircraftWarningCeilingWorldY();
        if (softY <= 0) continue;
        const now = mod.GetMatchTimeElapsed();

        const players = mod.AllPlayers();
        const count = mod.CountOf(players);
        for (let i = 0; i < count; i++) {
            const player = mod.ValueInArray(players, i) as mod.Player;
            if (!player || !mod.IsPlayerValid(player)) continue;
            const pid = safeGetPlayerId(player);
            if (pid === undefined) continue;

            // IsInVehicle preflight (helis pattern at overtime.ts:761) — GetVehicleFromPlayer
            // can silently return null without it.
            const inVehicle = safeGetSoldierStateBool(player, mod.SoldierStateBool.IsInVehicle, false);
            if (!inVehicle) {
                if (State.players.altitudeWarningVisibleByPid?.[pid]) {
                    setAltitudeWarningVisibleForPid(pid, false);
                    delete lastCountdownByPid[pid];
                }
                setAltimeterVisibleForPid(pid, false);
                setAltimeterWarningLabelVisibleForPid(pid, false);
                delete lastAltimeterTextYByPid[pid];
                delete lastAltimeterStageByPid[pid];
                delete lastWarningLabelVisibleByPid[pid];
                continue;
            }

            let vehicle: mod.Vehicle | undefined;
            try { vehicle = mod.GetVehicleFromPlayer(player); } catch (_e) {}
            if (!vehicle || !isAircraftVehicle(vehicle)) {
                // In a vehicle but NOT an aircraft (tank/jeep). Per v0.666 spec: altimeter is
                // aircraft-only, so hide everything.
                if (State.players.altitudeWarningVisibleByPid?.[pid]) {
                    setAltitudeWarningVisibleForPid(pid, false);
                    delete lastCountdownByPid[pid];
                }
                setAltimeterVisibleForPid(pid, false);
                setAltimeterWarningLabelVisibleForPid(pid, false);
                delete lastAltimeterTextYByPid[pid];
                delete lastAltimeterStageByPid[pid];
                delete lastWarningLabelVisibleByPid[pid];
                continue;
            }
            const pos = mod.GetVehicleState(vehicle, mod.VehicleStateVector.VehiclePosition);
            const posY = mod.YComponentOf(pos);
            // v0.667: altimeter shows HUD altitude (posY - hudFloorY) so the displayed number
            // matches the same scale as the Ready-Dialog ceiling setting. On Firestorm/TWL with
            // floor=132 and ceiling=130, the altimeter reads 130 exactly when the player crosses
            // the soft warning at world Y=262. World-Y thresholds (softY/warningY) are unchanged.
            const floorY = Math.floor(State.round.aircraftCeiling.hudFloorY);
            const hudAltitudeInt = Math.floor(posY - floorY);

            // Lazy-build altimeter on first show. Same pattern as the black-screen dialog.
            ensureAltimeterUiForPlayer(player);
            setAltimeterVisibleForPid(pid, true);

            // Determine 3-stage state (still uses world-Y thresholds — the math doesn't change).
            const stage = posY > warningY ? STAGE_BLACK : (posY > softY ? STAGE_YELLOW : STAGE_GREEN);

            // Update altimeter text — diff-gated on integer HUD altitude so we don't rewrite 5×/sec
            // for sub-1m drift.
            if (lastAltimeterTextYByPid[pid] !== hudAltitudeInt) {
                lastAltimeterTextYByPid[pid] = hudAltitudeInt;
                updateAltimeterTextForPid(pid, hudAltitudeInt);
            }
            // Update altimeter color (green/yellow) — diff-gated on stage transition.
            if (lastAltimeterStageByPid[pid] !== stage) {
                lastAltimeterStageByPid[pid] = stage;
                setAltimeterStageColorForPid(pid, stage >= STAGE_YELLOW);
            }
            // Show/hide small "ALTITUDE WARNING" label above altimeter.
            const wantLabel = stage >= STAGE_YELLOW;
            if (lastWarningLabelVisibleByPid[pid] !== wantLabel) {
                lastWarningLabelVisibleByPid[pid] = wantLabel;
                setAltimeterWarningLabelVisibleForPid(pid, wantLabel);
            }

            // Black-screen dialog visibility — toggled by the existing setAltitudeWarningVisibleForPid.
            const currentlyVisibleBlack = !!State.players.altitudeWarningVisibleByPid?.[pid];
            const shouldShowBlack = stage === STAGE_BLACK;
            if (shouldShowBlack && !currentlyVisibleBlack) {
                setAltitudeWarningVisibleForPid(pid, true);
            } else if (!shouldShowBlack && currentlyVisibleBlack) {
                setAltitudeWarningVisibleForPid(pid, false);
                delete lastCountdownByPid[pid];
            }

            // Countdown digit update inside the black-screen dialog: only while it's visible.
            if (State.players.altitudeWarningVisibleByPid?.[pid]) {
                const startedAt = State.players.altitudeWarningStartedAtSecondsByPid[pid] ?? now;
                const elapsed = Math.max(0, now - startedAt);
                const remaining = Math.max(0, ALTITUDE_WARNING_COUNTDOWN_SECONDS - Math.floor(elapsed));
                if (lastCountdownByPid[pid] !== remaining) {
                    lastCountdownByPid[pid] = remaining;
                    const refs = State.hudCache.hudByPid[pid];
                    if (refs?.altitudeWarningCountdown) {
                        safeSetUITextLabel(
                            refs.altitudeWarningCountdown,
                            mod.Message(mod.stringkeys.twl.system.genericCounter, remaining)
                        );
                    }
                }

                // Ceiling punish: destroy aircraft 1s after countdown hits 0. Once per exposure event
                // (sentinel cleared in setAltitudeWarningVisibleForPid on visible->invisible). Admin-togglable.
                if (
                    State.admin.ceilingPunishEnabled
                    && elapsed >= ALTITUDE_WARNING_COUNTDOWN_SECONDS + CEILING_PUNISH_GRACE_SECONDS
                    && !State.players.ceilingPunishFiredByPid[pid]
                ) {
                    State.players.ceilingPunishFiredByPid[pid] = true;
                    try { mod.DealDamage(vehicle, 10000); } catch {}
                    broadcastStringKey(STR_CEILING_PUNISH_DESTROYED, player);
                }
            }
        }
    }
}

// H-P1: admin-panel Buffer knob action target. Clamps to [MIN, MAX] with STEP increments,
// writes state, and re-applies the engine cap immediately so the new hard ceiling takes effect.
// Updates the per-pid value widget on each click.
function setAircraftHardBuffer(nextValue: number, _changedBy?: mod.Player): void {
    const clamped = Math.max(
        AIRCRAFT_HARD_BUFFER_MIN,
        Math.min(AIRCRAFT_HARD_BUFFER_MAX, Math.floor(nextValue))
    );
    if (clamped === State.round.aircraftCeiling.hardBufferM) return;
    State.round.aircraftCeiling.hardBufferM = clamped;
    if (State.round.aircraftCeiling.customEnabled) {
        applyCustomAircraftCeilingHardLimiter();
    }
    syncAircraftBufferAdminValueForAllPlayers();
}

// H-P1: per-pid sync of the Buffer value widget on the Admin Panel.
function syncAircraftBufferAdminValueForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    const bufferValue = Math.max(0, Math.floor(State.round.aircraftCeiling.hardBufferM));
    for (let i = 0; i < count; i++) {
        const player = mod.ValueInArray(players, i) as mod.Player;
        if (!player || !mod.IsPlayerValid(player)) continue;
        const pid = safeGetPlayerId(player);
        if (pid === undefined || isPidDisconnected(pid)) continue;
        const widget = safeFind(UI_ADMIN_AIRCRAFT_BUFFER_VALUE_ID + pid);
        if (!widget) continue;
        safeSetUITextLabel(widget, mod.Message(mod.stringkeys.twl.system.genericCounter, bufferValue));
    }
}

// v0.666: admin "Warn Buffer" knob action target. Same shape as setAircraftHardBuffer; the
// warning buffer is the gap between the yellow soft warning and the black-screen dialog.
// Re-applying the hard limiter is required because the hard cap stacks on top of warningBufferM.
function setAircraftWarningBuffer(nextValue: number, _changedBy?: mod.Player): void {
    const clamped = Math.max(
        AIRCRAFT_WARNING_BUFFER_MIN,
        Math.min(AIRCRAFT_WARNING_BUFFER_MAX, Math.floor(nextValue))
    );
    if (clamped === State.round.aircraftCeiling.warningBufferM) return;
    State.round.aircraftCeiling.warningBufferM = clamped;
    if (State.round.aircraftCeiling.customEnabled) {
        applyCustomAircraftCeilingHardLimiter();
    }
    syncAircraftWarningBufferAdminValueForAllPlayers();
}

// v0.666: per-pid sync of the Warn Buffer value widget on the Admin Panel.
function syncAircraftWarningBufferAdminValueForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    const bufferValue = Math.max(0, Math.floor(State.round.aircraftCeiling.warningBufferM));
    for (let i = 0; i < count; i++) {
        const player = mod.ValueInArray(players, i) as mod.Player;
        if (!player || !mod.IsPlayerValid(player)) continue;
        const pid = safeGetPlayerId(player);
        if (pid === undefined || isPidDisconnected(pid)) continue;
        const widget = safeFind(UI_ADMIN_AIRCRAFT_WARN_BUFFER_VALUE_ID + pid);
        if (!widget) continue;
        safeSetUITextLabel(widget, mod.Message(mod.stringkeys.twl.system.genericCounter, bufferValue));
    }
}

function enableCustomAircraftCeiling(): void {
    State.round.aircraftCeiling.customEnabled = true;
    // v0.723: sticky flag for the session. Once a custom ceiling has been applied, the engine
    // is observed not to revert to Vanilla (mod.SetMaxVehicleHeightLimitScale(1.0) is one-way).
    // Setting this true gates the UI warning AND the confirm-path lockout.
    State.round.aircraftCeiling.hasEverAppliedCustom = true;
}

function disableCustomAircraftCeilingAndRestoreDefault(): void {
    State.round.aircraftCeiling.customEnabled = false;
    State.round.modeConfig.aircraftCeiling = State.round.aircraftCeiling.mapDefaultHudCeiling;
    State.round.modeConfig.gameSettings = mod.stringkeys.twl.readyDialog.modeSettingAircraftCeilingFormat;
    State.round.modeConfig.confirmed.aircraftCeiling = State.round.aircraftCeiling.mapDefaultHudCeiling;
    mod.SetMaxVehicleHeightLimitScale(1.0);
    updateReadyDialogModeConfigForAllVisibleViewers();
}

function syncAircraftCeilingFromMapConfig(): void {
    const mapDefault = Math.max(1, Math.floor(ACTIVE_MAP_CONFIG.aircraftCeiling));
    const mapMaxHud = Math.max(1, Math.floor(ACTIVE_MAP_CONFIG.hudMaxY));
    const floorY = Math.floor(ACTIVE_MAP_CONFIG.hudFloorY);
    State.round.aircraftCeiling.mapDefaultHudCeiling = mapDefault;
    State.round.aircraftCeiling.hudMaxY = mapMaxHud;
    State.round.aircraftCeiling.hudFloorY = floorY;
    State.round.aircraftCeiling.customEnabled = false;
    // Keep the engine ceiling at vanilla scale; layered enforcement is confirm-gated.
    mod.SetMaxVehicleHeightLimitScale(1.0);

    State.round.modeConfig.aircraftCeiling = mapDefault;
    State.round.modeConfig.aircraftCeilingOverridePending = false;
    State.round.modeConfig.gameSettings = mod.stringkeys.twl.readyDialog.modeSettingAircraftCeilingFormat;
    State.round.modeConfig.confirmed.aircraftCeiling = mapDefault;
    State.round.modeConfig.confirmed.aircraftCeilingOverrideEnabled = false;

    updateReadyDialogModeConfigForAllVisibleViewers();
}

//#endregion ----------------- Aircraft Ceiling (Soft Enforcement) --------------------



//#region -------------------- Ready Dialog - Mode Presets + Confirm --------------------

// v0.727: mode predicates split into per-mode atoms + family helpers. The "family" predicates
// (isReadyDialogGameModeVanilla, isReadyDialogGameModeTwlPreset) determine ceiling/best-of behavior;
// the per-mode atoms feed the per-preset getters below.
function isReadyDialogGameModeVanillaPractice(gameModeKey: number): boolean {
    return gameModeKey === mod.stringkeys.twl.readyDialog.gameModeHelisPractice;
}

function isReadyDialogGameModeHelisOnlyVanilla(gameModeKey: number): boolean {
    return gameModeKey === mod.stringkeys.twl.readyDialog.gameModeHelisOnlyVanilla;
}

function isReadyDialogGameModeLittleBirdsVanilla(gameModeKey: number): boolean {
    return gameModeKey === mod.stringkeys.twl.readyDialog.gameModeLittleBirdsVanilla;
}

function isReadyDialogGameModeLadder(gameModeKey: number): boolean {
    return gameModeKey === mod.stringkeys.twl.readyDialog.gameModeHelisLadder;
}

function isReadyDialogGameModeTwl1v1(gameModeKey: number): boolean {
    return gameModeKey === mod.stringkeys.twl.readyDialog.gameModeHelisTwl1v1;
}

function isReadyDialogGameModeLittleBirdsTwl2v2(gameModeKey: number): boolean {
    return gameModeKey === mod.stringkeys.twl.readyDialog.gameModeLittleBirdsTwl2v2;
}

function isReadyDialogGameModeLittleBirdsTwl1v1(gameModeKey: number): boolean {
    return gameModeKey === mod.stringkeys.twl.readyDialog.gameModeLittleBirdsTwl1v1;
}

function isReadyDialogGameModeJetsOnly1v1(gameModeKey: number): boolean {
    return gameModeKey === mod.stringkeys.twl.readyDialog.gameModeJetsOnly1v1;
}

function isReadyDialogGameModeJetsOnly2v2(gameModeKey: number): boolean {
    return gameModeKey === mod.stringkeys.twl.readyDialog.gameModeJetsOnly2v2;
}

function isReadyDialogGameModeJetsOnlyVanilla(gameModeKey: number): boolean {
    return gameModeKey === mod.stringkeys.twl.readyDialog.gameModeJetsOnlyVanilla;
}

function isReadyDialogGameModeMixedAir6v6(gameModeKey: number): boolean {
    return gameModeKey === mod.stringkeys.twl.readyDialog.gameModeMixedAir6v6;
}
function isReadyDialogGameModeHelisOnlyCustom(gameModeKey: number): boolean {
    return gameModeKey === mod.stringkeys.twl.readyDialog.gameModeHelisCustom;
}
function isReadyDialogGameModeJetsOnlyCustom(gameModeKey: number): boolean {
    return gameModeKey === mod.stringkeys.twl.readyDialog.gameModeJetsOnlyCustom;
}
function isReadyDialogGameModeMixedAirCustom(gameModeKey: number): boolean {
    return gameModeKey === mod.stringkeys.twl.readyDialog.gameModeMixedAirCustom;
}

// Any mode that fields jets. Plane-inclusive modes use the vanilla ceiling (D8) and are hidden on
// jetless maps (D15): the two Jets Only presets, the Mixed Air 6v6 preset, and the Jets/Mixed Custom
// flavors (the Custom flavor string already encodes the composition -- Helis Only Custom is excluded).
function isPlaneInclusiveGameMode(gameModeKey: number): boolean {
    return isReadyDialogGameModeJetsOnly1v1(gameModeKey)
        || isReadyDialogGameModeJetsOnly2v2(gameModeKey)
        || isReadyDialogGameModeJetsOnlyVanilla(gameModeKey)
        || isReadyDialogGameModeMixedAir6v6(gameModeKey)
        || isReadyDialogGameModeJetsOnlyCustom(gameModeKey)
        || isReadyDialogGameModeMixedAirCustom(gameModeKey);
}

// The single Custom slot displays one of three flavor labels depending on the live selection
// composition: Helis Only (no jets), Jets Only (no choppers), or Mixed Air (both). All three are
// "Custom" for mode-machine purposes (isReadyDialogGameModeCustom).
function isReadyDialogGameModeCustom(gameModeKey: number): boolean {
    return isReadyDialogGameModeHelisOnlyCustom(gameModeKey)
        || isReadyDialogGameModeJetsOnlyCustom(gameModeKey)
        || isReadyDialogGameModeMixedAirCustom(gameModeKey);
}

// Resolve which Custom flavor string fits the current pending vehicle selection.
function resolveCustomGameModeKey(): number {
    const sel = State.round.modeConfig.vehicleSelectionIndexByKey || {};
    let jets = 0;
    let helis = 0;
    for (let i = 0; i < State.vehicles.slots.length; i++) {
        const slot = State.vehicles.slots[i];
        const knobKey = getKnobKeyForSlot(slot);
        const idx = sel[knobKey] !== undefined ? sel[knobKey] : 0;
        const v = getReadyDialogSelectedVehicleForKnob(knobKey, idx, slot.anchorVehicle);
        if (v === undefined) continue;
        if (slot.family === "plane") jets++;
        else helis++;
    }
    if (jets > 0 && helis > 0) return mod.stringkeys.twl.readyDialog.gameModeMixedAirCustom;
    if (jets > 0) return mod.stringkeys.twl.readyDialog.gameModeJetsOnlyCustom;
    return mod.stringkeys.twl.readyDialog.gameModeHelisCustom;
}

// Builds the full per-knob selection map for a game-mode preset (which knobs on, which vehicle).
// All knobs default to Off (0); the mode then turns on its recipe. Faction-locked heli options
// share index meaning across teams, so the same index yields the correct per-team variant.
function buildDefaultVehicleSelectionForGameMode(gameModeKey: number): Record<string, number> {
    const sel: Record<string, number> = {};
    for (const k of READY_DIALOG_ALL_VEHICLE_KNOB_KEYS) sel[k] = 0;
    const setHelis = (count: number, optIndex: number): void => {
        for (let i = 1; i <= count; i++) {
            sel["team1Heli" + i] = optIndex;
            sel["team2Heli" + i] = optIndex;
        }
    };
    const setPlanes = (count: number, t1OptIndex: number, t2OptIndex: number): void => {
        for (let i = 1; i <= count; i++) {
            sel["team1Plane" + i] = t1OptIndex;
            sel["team2Plane" + i] = t2OptIndex;
        }
    };
    if (isReadyDialogGameModeHelisOnlyVanilla(gameModeKey)) { setHelis(4, HELI_OPT_MAP_DEFAULT); return sel; }
    if (isReadyDialogGameModeLittleBirdsVanilla(gameModeKey)) { setHelis(1, HELI_OPT_LITTLEBIRD); return sel; }
    if (isReadyDialogGameModeLittleBirdsTwl2v2(gameModeKey)) { setHelis(2, HELI_OPT_LITTLEBIRD); return sel; }
    if (isReadyDialogGameModeLittleBirdsTwl1v1(gameModeKey)) { setHelis(1, HELI_OPT_LITTLEBIRD); return sel; }
    if (isReadyDialogGameModeJetsOnly1v1(gameModeKey)) { setPlanes(1, PLANE_OPT_F16, PLANE_OPT_JAS39); return sel; }
    if (isReadyDialogGameModeJetsOnly2v2(gameModeKey) || isReadyDialogGameModeJetsOnlyVanilla(gameModeKey)) {
        // 2 distinct jets per side: NATO (F-61V + F-97) on T1; JAS-39 + Su-57 on T2. Shared by the
        // best-of-11 "Jets - TWL 2v2" and the best-of-3 "All Jets - BF6 Vanilla".
        sel["team1Plane1"] = PLANE_OPT_F16;
        sel["team1Plane2"] = PLANE_OPT_F22;
        sel["team2Plane1"] = PLANE_OPT_JAS39;
        sel["team2Plane2"] = PLANE_OPT_SU57;
        return sel;
    }
    if (isReadyDialogGameModeMixedAir6v6(gameModeKey)) {
        // 6 vehicles/side: one of each chopper type (Apache, Euro, BlackHawk, LittleBird) + 2 distinct
        // jets. NATO jets (F-16 + F-22) on T1; the other pair (JAS-39 + Su-57) on T2.
        sel["team1Heli1"] = sel["team2Heli1"] = HELI_OPT_APACHE;
        sel["team1Heli2"] = sel["team2Heli2"] = HELI_OPT_EURO;
        sel["team1Heli3"] = sel["team2Heli3"] = HELI_OPT_BLACKHAWK;
        sel["team1Heli4"] = sel["team2Heli4"] = HELI_OPT_LITTLEBIRD;
        sel["team1Plane1"] = PLANE_OPT_F16;
        sel["team1Plane2"] = PLANE_OPT_F22;
        sel["team2Plane1"] = PLANE_OPT_JAS39;
        sel["team2Plane2"] = PLANE_OPT_SU57;
        return sel;
    }
    // Attack Helis family (Practice / Ladder / TWL 1v1) + Custom fallback: 1 Apache per side.
    setHelis(1, HELI_OPT_APACHE);
    return sel;
}

// Family helper: any "vanilla-derived" mode. These force vanilla aircraft ceiling regardless of map.
// Used by shouldApplyCustomCeilingForGameMode + getPresetSoldierHpMultiplierForGameMode.
function isReadyDialogGameModeVanilla(gameModeKey: number): boolean {
    return isReadyDialogGameModeVanillaPractice(gameModeKey)
        || isReadyDialogGameModeHelisOnlyVanilla(gameModeKey)
        || isReadyDialogGameModeLittleBirdsVanilla(gameModeKey);
}

// Family helper: any "TWL-derived" preset. These use map's useCustomCeiling flag + best-of-11.
function isReadyDialogGameModeTwlPreset(gameModeKey: number): boolean {
    return isReadyDialogGameModeLadder(gameModeKey)
        || isReadyDialogGameModeTwl1v1(gameModeKey)
        || isReadyDialogGameModeLittleBirdsTwl2v2(gameModeKey)
        || isReadyDialogGameModeLittleBirdsTwl1v1(gameModeKey)
        // Jets - TWL 1v1/2v2 run best-of-11 (HP stays stock, ceiling stays vanilla via the
        // plane-inclusive short-circuit). The "All Jets - BF6 Vanilla" preset is NOT here -> best-of-3.
        || isReadyDialogGameModeJetsOnly1v1(gameModeKey)
        || isReadyDialogGameModeJetsOnly2v2(gameModeKey);
}

function getReadyDialogPresetPlayersPerSide(gameModeKey: number): number {
    // 1v1-style modes.
    if (isReadyDialogGameModeLittleBirdsVanilla(gameModeKey)) return READY_DIALOG_MODE_PRESET_PLAYERS_PER_SIDE_TWL_1V1;
    if (isReadyDialogGameModeLittleBirdsTwl1v1(gameModeKey)) return READY_DIALOG_MODE_PRESET_PLAYERS_PER_SIDE_TWL_1V1;
    if (isReadyDialogGameModeTwl1v1(gameModeKey)) return READY_DIALOG_MODE_PRESET_PLAYERS_PER_SIDE_TWL_1V1;
    if (isReadyDialogGameModeJetsOnly1v1(gameModeKey)) return READY_DIALOG_MODE_PRESET_PLAYERS_PER_SIDE_TWL_1V1; // 1 jet/side = 1 pilot
    if (isReadyDialogGameModeJetsOnly2v2(gameModeKey)) return READY_DIALOG_MODE_PRESET_PLAYERS_PER_SIDE_TWL_2V2; // 2 jets/side = 2 pilots
    if (isReadyDialogGameModeJetsOnlyVanilla(gameModeKey)) return READY_DIALOG_MODE_PRESET_PLAYERS_PER_SIDE_TWL_2V2; // All Jets = 2 jets/side
    // All Helis - BF6 Vanilla ships as 4v4 (slug kept as gameModeHelisOnlyVanilla; display renamed v0.728).
    if (isReadyDialogGameModeHelisOnlyVanilla(gameModeKey)) return 4;
    // Mixed Air 6v6: Apache(2)+Euro(2)+BlackHawk(2)+LittleBird(1) + 2 jets(1 each) = 9 players/side.
    if (isReadyDialogGameModeMixedAir6v6(gameModeKey)) return 9;
    // 2v2-style modes (TWL Ladder, Practice Vanilla, new Little Birds TWL 2v2).
    if (isReadyDialogGameModeLadder(gameModeKey)) return READY_DIALOG_MODE_PRESET_PLAYERS_PER_SIDE_TWL_2V2;
    if (isReadyDialogGameModeLittleBirdsTwl2v2(gameModeKey)) return READY_DIALOG_MODE_PRESET_PLAYERS_PER_SIDE_TWL_2V2;
    return READY_DIALOG_MODE_PRESET_PLAYERS_PER_SIDE_VANILLA;
}

// v0.728 Per-preset matchup index. Returns the MATCHUP_PRESETS row to apply on preset activation.
// All Helis - BF6 Vanilla is 4v4 (index 3 -> 4 vehicle slots/team, 4 kills/round). Everything else
// stays at index 0 (1v1, 1 kill/round) preserving the pre-v0.728 default. Note: the matchup row
// controls vehicle-slot count and per-round kills target, NOT auto-start min players (that's
// getReadyDialogPresetPlayersPerSide above).
function getPresetMatchupIndexForGameMode(gameModeKey: number): number {
    // v0.730: matchup row decoupled from players/side. Attack Helis BF6 Vanilla + TWL 2v2 reverted
    // to 1v1 matchup (1 vehicle slot/team) but keep 2 players/side. All Helis = 4v4. Little Birds
    // TWL 2v2 = 2v2 matchup (2 slots/team).
    if (isReadyDialogGameModeHelisOnlyVanilla(gameModeKey)) return 3;        // 4v4
    if (isReadyDialogGameModeMixedAir6v6(gameModeKey)) return 3;             // legacy field caps at 4v4; knob selection is authoritative
    if (isReadyDialogGameModeLittleBirdsTwl2v2(gameModeKey)) return 1;       // Little Birds - TWL 2v2 -> 2v2
    // Everything else stays at the 1v1 default (incl. Attack Helis Practice + Ladder + Twl1v1,
    // Little Birds Vanilla + Twl1v1).
    return READY_DIALOG_MODE_PRESET_MATCHUP_INDEX;                           // 0 (1v1)
}

// v0.730 Attack Helis - TWL ladder modes (2v2 + 1v1) both ship at 160% vehicle health. Every other
// preset uses the map default.
function getPresetVehicleHealthMultiplierForGameMode(gameModeKey: number): number {
    if (isReadyDialogGameModeLadder(gameModeKey)) return 1.6;
    if (isReadyDialogGameModeTwl1v1(gameModeKey)) return 1.6;
    return State.round.mapDefaultVehicleHealthMultiplier;
}

// v0.727 Soldier HP per-preset defaults. Little Birds presets ship with 500% soldier HP so the
// on-foot phase between heli kills survives a moment longer (MH-6 has thin armor + low ammo).
// Attack Helis / Helis Only family: 100%. Custom + safety fallback uses the per-map default.
function getPresetSoldierHpMultiplierForGameMode(gameModeKey: number): number {
    if (isReadyDialogGameModeLittleBirdsVanilla(gameModeKey)) return 5.0;    // Little Birds - BF6 Vanilla
    if (isReadyDialogGameModeLittleBirdsTwl2v2(gameModeKey)) return 5.0;     // Little Birds - TWL 2v2
    if (isReadyDialogGameModeLittleBirdsTwl1v1(gameModeKey)) return 5.0;     // Little Birds - TWL 1v1
    if (isReadyDialogGameModeLadder(gameModeKey)) return 1.0;                // Attack Helis - TWL 2v2
    if (isReadyDialogGameModeTwl1v1(gameModeKey)) return 1.0;                // Attack Helis - TWL 1v1
    if (isReadyDialogGameModeVanillaPractice(gameModeKey)) return 1.0;       // Attack Helis - BF6 Vanilla
    if (isReadyDialogGameModeHelisOnlyVanilla(gameModeKey)) return 1.0;      // All Helis - BF6 Vanilla
    return State.round.mapDefaultSoldierHpMultiplier;                        // Custom + safety fallback
}

// v0.727 Per-team vehicle cycler indices per preset. Returns { t1, t2 } cycler indices that the
// preset should apply on activation. Replaces the single READY_DIALOG_MODE_PRESET_VEHICLE_INDEX
// constant so Little Birds presets can ship asymmetric T1=MH6 / T2=MH6 PAX, and Helis Only Vanilla
// can ship T1=T2=Map Default.
function getPresetVehicleIndicesForGameMode(gameModeKey: number): { t1: number; t2: number } {
    if (isReadyDialogGameModeHelisOnlyVanilla(gameModeKey)) {
        return { t1: READY_DIALOG_VEHICLE_MAP_DEFAULT_INDEX, t2: READY_DIALOG_VEHICLE_MAP_DEFAULT_INDEX };
    }
    if (isReadyDialogGameModeLittleBirdsVanilla(gameModeKey)
        || isReadyDialogGameModeLittleBirdsTwl2v2(gameModeKey)
        || isReadyDialogGameModeLittleBirdsTwl1v1(gameModeKey)) {
        return { t1: READY_DIALOG_VEHICLE_INDEX_LITTLEBIRD, t2: READY_DIALOG_VEHICLE_INDEX_LITTLEBIRD_PAX };
    }
    // Attack Helis variants (Practice, Ladder, Twl1v1): Falchion (Apache) for both teams.
    return { t1: READY_DIALOG_VEHICLE_INDEX_FALCHION, t2: READY_DIALOG_VEHICLE_INDEX_FALCHION };
}

function shouldApplyCustomCeilingForGameMode(gameModeKey: number): boolean {
    // D8: any plane-inclusive mode uses the vanilla ceiling (jets fly high; the soft ceiling would
    // constantly punish them). Checked first so it wins over the TWL/custom branches.
    if (isPlaneInclusiveGameMode(gameModeKey)) return false;
    if (isReadyDialogGameModeVanilla(gameModeKey)) return false;
    if (isReadyDialogGameModeCustom(gameModeKey)) return true;
    if (isReadyDialogGameModeTwlPreset(gameModeKey)) return !!ACTIVE_MAP_CONFIG.useCustomCeiling;
    return true;
}

function hasCustomCeilingOverride(ceilingValue: number): boolean {
    return Math.floor(ceilingValue) !== Math.floor(State.round.aircraftCeiling.mapDefaultHudCeiling);
}

// Authoritative ceiling decision. Custom (incl. Jets/Mixed flavors) applies the numeric ceiling ONLY
// when its override is set -- so a manually-tuned ceiling sticks even on jet modes. Plane-inclusive
// PRESETS still DEFAULT to vanilla via shouldApplyCustomCeilingForGameMode (no override = vanilla);
// the user must opt in by adjusting the ceiling (which flips the mode to a Custom flavor + sets the
// override). v0.751: removed the blanket plane-inclusive short-circuit that previously DISABLED a
// custom ceiling on jet modes entirely (vanilla is only the starting point, not a hard lock).
function shouldApplyCustomCeilingForConfig(gameModeKey: number, overrideEnabled: boolean): boolean {
    if (isReadyDialogGameModeCustom(gameModeKey)) {
        return overrideEnabled;
    }
    return shouldApplyCustomCeilingForGameMode(gameModeKey);
}

// Forces Custom mode without applying presets or mutating other settings.
function ensureCustomGameModeForManualChange(): void {
    if (suppressReadyDialogModeAutoSwitch) return;
    const customKey = resolveCustomGameModeKey();
    if (State.round.modeConfig.gameModeIndex === READY_DIALOG_GAME_MODE_CUSTOM_INDEX) {
        // Already Custom -- the composition may have changed (e.g. a jet was added), so re-resolve the
        // flavor label (Helis Only / Jets Only / Mixed Air) and repaint if it flipped.
        if (State.round.modeConfig.gameMode !== customKey) {
            State.round.modeConfig.gameMode = customKey;
            suppressReadyDialogModeAutoSwitch = true;
            updateReadyDialogModeConfigForAllVisibleViewers();
            suppressReadyDialogModeAutoSwitch = false;
            updateSettingsSummaryHudForAllPlayers();
        }
        return;
    }
    const priorMode = State.round.modeConfig.gameMode;
    const shouldKeepCeilingOverride =
        shouldApplyCustomCeilingForGameMode(priorMode)
        || State.round.modeConfig.aircraftCeilingOverridePending
        || State.round.modeConfig.confirmed.aircraftCeilingOverrideEnabled;
    if (shouldKeepCeilingOverride) {
        State.round.modeConfig.aircraftCeilingOverridePending = true;
    }
    State.round.modeConfig.gameModeIndex = READY_DIALOG_GAME_MODE_CUSTOM_INDEX;
    State.round.modeConfig.gameMode = customKey;
    // v0.715: suppress detectAndApplyMatchingPreset during this nested refresh. The knob
    // mutation that triggered us hasn't happened yet -- if snap-back ran now, it would see
    // the unchanged preset-matching values and undo this flip-to-Custom. The setter's OUTER
    // refresh (post-mutation, at the bottom of e.g. setReadyDialogVehicleHealthMultiplier) is
    // where snap-back should evaluate. detectAndApplyMatchingPreset checks this same flag and
    // early-returns -- same semantics as how applyReadyDialogModePresetForGameMode uses it.
    suppressReadyDialogModeAutoSwitch = true;
    updateReadyDialogModeConfigForAllVisibleViewers();
    suppressReadyDialogModeAutoSwitch = false;
    updateSettingsSummaryHudForAllPlayers();
}

// v0.715: complement to ensureCustomGameModeForManualChange. When the user is in Custom mode
// (most likely because they edited a knob that flipped them out of a preset), check whether
// the current pending values now match a known preset -- if so, snap the game mode label back
// to that preset. Without this, editing a knob and editing it back leaves the label stuck on
// "Custom" forever even though all values match TWL 2v2 (or whichever preset was active).
//
// Called from updateReadyDialogModeConfigForAllVisibleViewers so every refresh path naturally
// runs this check, regardless of which knob setter triggered the refresh.
//
// Edge case: multiple presets matching simultaneously is structurally prevented by per-mode
// autoStartMinActivePlayers + per-mode best-of values (see isReadyDialogModePresetActive at
// line 3116) -- TWL 2v2 = 2 players/side, TWL 1v1 = 1, Vanilla Practice = different best-of.
// First match wins for safety; deterministic given the strict per-mode checks.
function detectAndApplyMatchingPreset(): void {
    if (suppressReadyDialogModeAutoSwitch) return;
    if (State.round.modeConfig.gameModeIndex !== READY_DIALOG_GAME_MODE_CUSTOM_INDEX) return;
    for (let i = 0; i < READY_DIALOG_GAME_MODE_OPTIONS.length; i++) {
        if (i === READY_DIALOG_GAME_MODE_CUSTOM_INDEX) continue;
        const modeKey = READY_DIALOG_GAME_MODE_OPTIONS[i];
        if (isReadyDialogModePresetActive(modeKey)) {
            State.round.modeConfig.gameModeIndex = i;
            State.round.modeConfig.gameMode = modeKey;
            // v0.717: do NOT mutate aircraftCeilingOverridePending here. v0.716 cleared it as
            // a patch for ceiling-stays-red on snap-back, but the right fix (in v0.717) was to
            // simplify the ceiling dirty check to look at numeric value only -- so the flag
            // mismatch never paints red in the first place. Cascading the flag clear violated
            // the "only flip game mode, don't cascade other knobs" rule. Snap-back now only
            // touches the game mode label.
            return;
        }
    }
}

// True only when all preset values match the selected mode (best-of, matchup, players, vehicles, ceiling).
// v0.727: T1/T2 vehicle indices now come from getPresetVehicleIndicesForGameMode so Little Birds
// presets can check T1=MH6 and T2=MH6 PAX independently.
function isReadyDialogModePresetActive(gameModeKey: number): boolean {
    if (isReadyDialogGameModeCustom(gameModeKey)) return false;
    const expectedBestOf = isReadyDialogGameModeTwlPreset(gameModeKey)
        ? READY_DIALOG_MODE_PRESET_BEST_OF_LADDER
        : READY_DIALOG_MODE_PRESET_BEST_OF_VANILLA;
    if (Math.floor(State.round.max) !== expectedBestOf) return false;
    // v0.732 matchup + players checks now read PENDING modeConfig (pre-v0.732 read live State.round).
    // Snap-back logic needs to compare against the user's current pending edits, not the previously-
    // applied live state. The applied state still matches if no Confirm has happened yet, but in flux.
    if (State.round.modeConfig.matchupPresetIndex !== getPresetMatchupIndexForGameMode(gameModeKey)) return false;
    if (State.round.modeConfig.autoStartMinActivePlayers !== getReadyDialogPresetPlayersPerSide(gameModeKey)) return false;
    const expectedVehicles = getPresetVehicleIndicesForGameMode(gameModeKey);
    if (State.round.modeConfig.vehicleIndexT1 !== expectedVehicles.t1) return false;
    if (State.round.modeConfig.vehicleIndexT2 !== expectedVehicles.t2) return false;
    if (Math.floor(State.round.modeConfig.aircraftCeiling) !== Math.floor(State.round.aircraftCeiling.mapDefaultHudCeiling)) return false;
    // Health-multiplier check: preset is "active" only when the pending knob matches the preset's expected default.
    // TWL 2v2 = 160%, everything else = map default. Compare via 2-decimal round to absorb 0.01-step float drift.
    const expectedHealthMult = getPresetVehicleHealthMultiplierForGameMode(gameModeKey);
    if (Math.round(State.round.modeConfig.vehicleHealthMultiplier * 100) !== Math.round(expectedHealthMult * 100)) return false;
    // Soldier HP check: parallel to vehicle health.
    const expectedSoldierHp = getPresetSoldierHpMultiplierForGameMode(gameModeKey);
    if (Math.round(State.round.modeConfig.soldierHpMultiplier * 100) !== Math.round(expectedSoldierHp * 100)) return false;
    // Per-knob vehicle selection must match the preset's recipe. Without this, a knob edit (which
    // leaves the legacy vehicleIndexT1/T2 fields untouched) would still "match" the prior preset and
    // detectAndApplyMatchingPreset would snap the user right back out of Custom. This is also what
    // makes snap-back work: editing a knob back to a preset's exact recipe restores its label.
    const expectedSel = buildDefaultVehicleSelectionForGameMode(gameModeKey);
    for (const k of READY_DIALOG_ALL_VEHICLE_KNOB_KEYS) {
        if ((State.round.modeConfig.vehicleSelectionIndexByKey[k] ?? 0) !== (expectedSel[k] ?? 0)) return false;
    }
    return true;
}

// v0.732 Applies the full mode preset as PENDING values only -- no live-state mutation, no spawn. The
// user clicks Confirm to materialize everything. Sets pending matchupPresetIndex + autoStartMinActivePlayers
// alongside the other pending fields. Pre-v0.732 this function called applyMatchupPresetInternal which force-
// spawned vehicles inline; that race is the bug the v0.732 refactor exists to eliminate.
function applyReadyDialogModePresetForGameMode(gameModeKey: number): boolean {
    if (isReadyDialogGameModeCustom(gameModeKey)) return false;

    suppressReadyDialogModeAutoSwitch = true;
    const bestOfRounds = isReadyDialogGameModeTwlPreset(gameModeKey)
        ? READY_DIALOG_MODE_PRESET_BEST_OF_LADDER
        : READY_DIALOG_MODE_PRESET_BEST_OF_VANILLA;

    setHudRoundCountersForAllPlayers(State.round.current, bestOfRounds);

    // v0.732 pending matchup + players. Live state untouched until Confirm.
    State.round.modeConfig.matchupPresetIndex = getPresetMatchupIndexForGameMode(gameModeKey);
    State.round.modeConfig.autoStartMinActivePlayers = getReadyDialogPresetPlayersPerSide(gameModeKey);

    // v0.727 per-team vehicle indices (legacy cycler -- retained until the matchup/cycler UI is removed).
    const presetVehicles = getPresetVehicleIndicesForGameMode(gameModeKey);
    State.round.modeConfig.vehicleIndexT1 = presetVehicles.t1;
    State.round.modeConfig.vehicleIndexT2 = presetVehicles.t2;
    State.round.modeConfig.vehiclesT1 = READY_DIALOG_VEHICLE_OPTIONS[presetVehicles.t1];
    State.round.modeConfig.vehiclesT2 = READY_DIALOG_VEHICLE_OPTIONS[presetVehicles.t2];

    // Per-knob model: the preset sets the full per-slot vehicle selection (pending). Applied on Confirm.
    State.round.modeConfig.vehicleSelectionIndexByKey = buildDefaultVehicleSelectionForGameMode(gameModeKey);

    State.round.modeConfig.aircraftCeiling = State.round.aircraftCeiling.mapDefaultHudCeiling;
    State.round.modeConfig.aircraftCeilingOverridePending = false;
    State.round.modeConfig.gameSettings = mod.stringkeys.twl.readyDialog.modeSettingAircraftCeilingFormat;
    // Vehicle Health Multiplier: TWL 2v2 = 160%, every other preset = map default.
    State.round.modeConfig.vehicleHealthMultiplier = getPresetVehicleHealthMultiplierForGameMode(gameModeKey);
    // Soldier HP: Little Birds presets = 500%, every other preset = 100%.
    State.round.modeConfig.soldierHpMultiplier = getPresetSoldierHpMultiplierForGameMode(gameModeKey);

    suppressReadyDialogModeAutoSwitch = false;

    // v0.733 also refresh matchup row + players row so cycling the game mode shows the new
    // matchup/players values immediately. Pre-v0.733 these updated via the inline applyMatchupPresetInternal
    // call; v0.732 dropped that call without restoring the UI refresh.
    updateMatchupLabelForAllPlayers();
    updateMatchupReadoutsForAllPlayers();
    updateReadyDialogModeConfigForAllVisibleViewers();
    updateSettingsSummaryHudForAllPlayers();
    return true;
}

function setReadyDialogGameModeIndex(nextIndex: number, applyPreset: boolean = true): void {
    const count = READY_DIALOG_GAME_MODE_OPTIONS.length;
    if (count <= 0) return;
    const current = State.round.modeConfig.gameModeIndex;
    const dir = nextIndex >= current ? 1 : -1;
    let clamped = ((nextIndex % count) + count) % count;
    // D15: skip plane-inclusive modes on jetless maps; keep stepping in the cycle direction.
    if (!mapSupportsPlanes(ACTIVE_MAP_CONFIG)) {
        let guard = 0;
        while (isPlaneInclusiveGameMode(READY_DIALOG_GAME_MODE_OPTIONS[clamped]) && guard < count) {
            clamped = (((clamped + dir) % count) + count) % count;
            guard++;
        }
    }
    State.round.modeConfig.gameModeIndex = clamped;
    State.round.modeConfig.gameMode = READY_DIALOG_GAME_MODE_OPTIONS[clamped];
    if (applyPreset) {
        const applied = applyReadyDialogModePresetForGameMode(State.round.modeConfig.gameMode);
        if (applied) return;
    }
    // Landed on the Custom slot (OPTIONS holds the Helis Only Custom placeholder) -- relabel to the
    // flavor that matches the current selection so cycling onto Custom shows e.g. "Mixed Air - Custom".
    if (State.round.modeConfig.gameModeIndex === READY_DIALOG_GAME_MODE_CUSTOM_INDEX) {
        State.round.modeConfig.gameMode = resolveCustomGameModeKey();
    }
    // v0.718: suppress detectAndApplyMatchingPreset during the fall-through update. When user
    // explicitly picks Custom via the cycler, applyReadyDialogModePresetForGameMode returns
    // false (no preset values to apply) and we fall through here. Without suppression, the
    // snap-back helper inside updateReadyDialogModeConfigForAllVisibleViewers sees that pending
    // values still match the previous preset and snaps gameMode RIGHT BACK -- making the cycler
    // dead-end at the last preset before Custom. User's explicit selection must stick.
    suppressReadyDialogModeAutoSwitch = true;
    updateReadyDialogModeConfigForAllVisibleViewers();
    suppressReadyDialogModeAutoSwitch = false;
    updateSettingsSummaryHudForAllPlayers();
}

function setReadyDialogAircraftCeiling(nextValue: number, _changedBy?: mod.Player): void {
    ensureCustomGameModeForManualChange();
    const clamped = Math.max(
        READY_DIALOG_AIRCRAFT_CEILING_MIN,
        Math.min(READY_DIALOG_AIRCRAFT_CEILING_MAX, Math.floor(nextValue))
    );
    State.round.modeConfig.aircraftCeiling = clamped;
    State.round.modeConfig.aircraftCeilingOverridePending = true;
    State.round.modeConfig.gameSettings = mod.stringkeys.twl.readyDialog.modeSettingAircraftCeilingFormat;
    updateReadyDialogModeConfigForAllVisibleViewers();
}

// Manual change to Vehicle Health Multiplier; flips game mode to Custom (matches ceiling pattern).
// Pending value is held in modeConfig.vehicleHealthMultiplier until Confirm snapshots to confirmed.
// Float-precision-safe clamp: 1e-9 epsilon used because step 0.01 + JS float math otherwise drifts.
function setReadyDialogVehicleHealthMultiplier(nextValue: number, _changedBy?: mod.Player): void {
    ensureCustomGameModeForManualChange();
    const clamped = Math.max(
        READY_DIALOG_VEHICLE_HEALTH_MULT_MIN,
        Math.min(READY_DIALOG_VEHICLE_HEALTH_MULT_MAX, nextValue)
    );
    // Round to 2 decimal places so accumulated 0.01 steps don't drift (e.g. 1.00 + 0.01 - 0.01 = 0.99999...)
    State.round.modeConfig.vehicleHealthMultiplier = Math.round(clamped * 100) / 100;
    updateReadyDialogModeConfigForAllVisibleViewers();
}

// v0.725 Soldier HP setter -- twin of setReadyDialogVehicleHealthMultiplier.
function setReadyDialogSoldierHpMultiplier(nextValue: number, _changedBy?: mod.Player): void {
    ensureCustomGameModeForManualChange();
    const clamped = Math.max(
        READY_DIALOG_SOLDIER_HP_MULT_MIN,
        Math.min(READY_DIALOG_SOLDIER_HP_MULT_MAX, nextValue)
    );
    State.round.modeConfig.soldierHpMultiplier = Math.round(clamped * 100) / 100;
    updateReadyDialogModeConfigForAllVisibleViewers();
}

function setReadyDialogVehicleIndexT1(nextIndex: number): void {
    const count = READY_DIALOG_VEHICLE_OPTIONS.length;
    if (count <= 0) return;
    ensureCustomGameModeForManualChange();
    const clamped = ((nextIndex % count) + count) % count;
    State.round.modeConfig.vehicleIndexT1 = clamped;
    State.round.modeConfig.vehiclesT1 = READY_DIALOG_VEHICLE_OPTIONS[clamped];
    updateReadyDialogModeConfigForAllVisibleViewers();
}

function setReadyDialogVehicleIndexT2(nextIndex: number): void {
    const count = READY_DIALOG_VEHICLE_OPTIONS.length;
    if (count <= 0) return;
    ensureCustomGameModeForManualChange();
    const clamped = ((nextIndex % count) + count) % count;
    State.round.modeConfig.vehicleIndexT2 = clamped;
    State.round.modeConfig.vehiclesT2 = READY_DIALOG_VEHICLE_OPTIONS[clamped];
    updateReadyDialogModeConfigForAllVisibleViewers();
}

// Per-knob vehicle selection setter. Clamps + stores the pending index for one knob, flips to
// Custom mode (manual change), and refreshes the dialog. Applied to spawner slots only on Confirm.
function setReadyDialogVehicleSelectionIndexByKey(knobKey: string, nextIndex: number, _changedBy?: mod.Player): void {
    const count = getReadyDialogVehicleSelectionCount(knobKey);
    if (count <= 0) return;
    const clamped = ((nextIndex % count) + count) % count;
    // Store the new selection FIRST so ensureCustomGameModeForManualChange/resolveCustomGameModeKey
    // see the updated composition (adding a jet must flip the flavor to Mixed Air, not the stale value).
    State.round.modeConfig.vehicleSelectionIndexByKey[knobKey] = clamped;
    ensureCustomGameModeForManualChange();
    updateReadyDialogModeConfigForAllVisibleViewers();
}

// Routes a knob dec/inc click. Ignores locked knobs (live round, or jet knob on a jetless map).
function handleReadyDialogKnobStep(eventPlayer: mod.Player, knobKey: string, delta: number): void {
    if (isRoundLive()) return;
    if (isPlaneKnobKey(knobKey) && !mapSupportsPlanes(ACTIVE_MAP_CONFIG)) return;
    const current = State.round.modeConfig.vehicleSelectionIndexByKey[knobKey] ?? 0;
    setReadyDialogVehicleSelectionIndexByKey(knobKey, current + delta, eventPlayer);
}

// True when the pending T1 and T2 active vehicle counts match (the D3 symmetric-count requirement).
function isPendingVehicleCountSymmetric(): boolean {
    const sel = State.round.modeConfig.vehicleSelectionIndexByKey || {};
    return getActiveVehicleCountForTeamFromSelection(TeamID.Team1, sel)
        === getActiveVehicleCountForTeamFromSelection(TeamID.Team2, sel);
}

// Builds the 3-col x 2-row per-spawner knob grid at the top of a team's roster box.
// Layout: Jet1/Heli1/Heli3 (top row), Jet2/Heli2/Heli4 (bottom row).
function buildReadyDialogKnobGridForTeam(eventPlayer: mod.Player, pid: number, container: mod.UIWidget, team: TeamID): void {
    const teamPart = team === TeamID.Team1 ? "team1" : "team2";
    const panelW = 580;
    const cellW = Math.floor(panelW / 3);
    const gridStartY = 28;
    const cellH = 42;
    const labelH = 14;
    const btnW = 18; // slim arrow buttons -> wider value box so longer vehicle names fit at textSize 12
    const valueRowH = 22;
    const cells: { knobKey: string; labelMsg: mod.Message; col: number; row: number }[] = [
        { knobKey: teamPart + "Plane1", labelMsg: mod.Message(mod.stringkeys.twl.readyDialog.knobJetFormat, 1), col: 0, row: 0 },
        { knobKey: teamPart + "Plane2", labelMsg: mod.Message(mod.stringkeys.twl.readyDialog.knobJetFormat, 2), col: 0, row: 1 },
        { knobKey: teamPart + "Heli1", labelMsg: mod.Message(mod.stringkeys.twl.readyDialog.knobHeliFormat, 1), col: 1, row: 0 },
        { knobKey: teamPart + "Heli2", labelMsg: mod.Message(mod.stringkeys.twl.readyDialog.knobHeliFormat, 2), col: 1, row: 1 },
        { knobKey: teamPart + "Heli3", labelMsg: mod.Message(mod.stringkeys.twl.readyDialog.knobHeliFormat, 3), col: 2, row: 0 },
        { knobKey: teamPart + "Heli4", labelMsg: mod.Message(mod.stringkeys.twl.readyDialog.knobHeliFormat, 4), col: 2, row: 1 },
    ];
    for (const cell of cells) {
        const cellX = cell.col * cellW + 6;
        const cellY = gridStartY + cell.row * cellH;
        const innerW = cellW - 12;
        const labelName = UI_RD_KNOB_LABEL_ID + cell.knobKey + "_" + pid;
        modlib.ParseUI({
            name: labelName, type: "Text", playerId: eventPlayer,
            position: [cellX, cellY], size: [innerW, labelH], anchor: mod.UIAnchor.TopLeft,
            visible: true, padding: 0, bgAlpha: 0, bgFill: mod.UIBgFill.None,
            textLabel: cell.labelMsg, textColor: [1, 1, 1], textAlpha: 1, textSize: 12, textAnchor: mod.UIAnchor.Center,
        });
        const labelWidget = mod.FindUIWidgetWithName(labelName, mod.GetUIRoot());
        if (labelWidget) mod.SetUIWidgetParent(labelWidget, container);
        const valueY = cellY + labelH;
        const decBorder = addOutlinedButton(UI_RD_KNOB_DEC_ID + cell.knobKey + "_" + pid, cellX, valueY, btnW, valueRowH, mod.UIAnchor.TopLeft, container, eventPlayer);
        const decLabel = addCenteredButtonText(UI_RD_KNOB_DEC_LABEL_ID + cell.knobKey + "_" + pid, btnW, valueRowH, mod.Message(mod.stringkeys.twl.ui.left), eventPlayer, decBorder ?? container);
        if (decLabel) mod.SetUITextSize(decLabel, 12);
        const valueName = UI_RD_KNOB_VALUE_ID + cell.knobKey + "_" + pid;
        const valueX = cellX + btnW + 1;
        const valueW = innerW - 2 * btnW - 2;
        modlib.ParseUI({
            name: valueName, type: "Text", playerId: eventPlayer,
            position: [valueX, valueY], size: [valueW, valueRowH], anchor: mod.UIAnchor.TopLeft,
            visible: true, padding: 0, bgAlpha: 0, bgFill: mod.UIBgFill.None,
            textLabel: mod.Message(mod.stringkeys.twl.readyDialog.vehicleOptionOff), textColor: [1, 1, 1], textAlpha: 1, textSize: 12, textAnchor: mod.UIAnchor.Center,
        });
        const valueWidget = mod.FindUIWidgetWithName(valueName, mod.GetUIRoot());
        if (valueWidget) mod.SetUIWidgetParent(valueWidget, container);
        const incBorder = addOutlinedButton(UI_RD_KNOB_INC_ID + cell.knobKey + "_" + pid, cellX + innerW - btnW, valueY, btnW, valueRowH, mod.UIAnchor.TopLeft, container, eventPlayer);
        const incLabel = addCenteredButtonText(UI_RD_KNOB_INC_LABEL_ID + cell.knobKey + "_" + pid, btnW, valueRowH, mod.Message(mod.stringkeys.twl.ui.right), eventPlayer, incBorder ?? container);
        if (incLabel) mod.SetUITextSize(incLabel, 12);
    }
}

// Map-default (anchor) vehicle for a knob, read from its bound spawner slot (undefined if no slot yet).
function getAnchorVehicleForKnobKey(knobKey: string): mod.VehicleList | undefined {
    for (let i = 0; i < State.vehicles.slots.length; i++) {
        const slot = State.vehicles.slots[i];
        if (getKnobKeyForSlot(slot) === knobKey) return slot.anchorVehicle;
    }
    return undefined;
}

// Renders all 12 knob value labels + dirty colors + locked "Not on this Map" state for one viewer.
function updateReadyDialogKnobGridForPid(pid: number): void {
    const planesOk = mapSupportsPlanes(ACTIVE_MAP_CONFIG);
    const live = isRoundLive();
    const sel = State.round.modeConfig.vehicleSelectionIndexByKey || {};
    const confirmedSel = State.round.modeConfig.confirmed.vehicleSelectionIndexByKey || {};
    for (const knobKey of READY_DIALOG_ALL_VEHICLE_KNOB_KEYS) {
        const valueWidget = safeFind(UI_RD_KNOB_VALUE_ID + knobKey + "_" + pid);
        const decWidget = safeFind(UI_RD_KNOB_DEC_ID + knobKey + "_" + pid);
        const incWidget = safeFind(UI_RD_KNOB_INC_ID + knobKey + "_" + pid);
        const locked = isPlaneKnobKey(knobKey) && !planesOk;
        const idx = sel[knobKey] ?? 0;
        if (valueWidget) {
            if (locked) {
                safeSetUITextLabel(valueWidget, mod.Message(READY_DIALOG_VEHICLE_OPTION_NOT_ON_MAP_LABEL));
                mod.SetUITextColor(valueWidget, COLOR_GRAY);
            } else {
                safeSetUITextLabel(valueWidget, mod.Message(getReadyDialogVehicleSelectionLabelKey(knobKey, idx, getAnchorVehicleForKnobKey(knobKey))));
                const dirty = idx !== (confirmedSel[knobKey] ?? 0);
                mod.SetUITextColor(valueWidget, dirty ? COLOR_NOT_READY_RED : COLOR_READY_GREEN);
            }
        }
        if (decWidget) mod.SetUIButtonEnabled(decWidget, !locked && !live);
        if (incWidget) mod.SetUIButtonEnabled(incWidget, !locked && !live);
    }
}

// TODO(1.0): Deprecated by "Fresh Respawn Setup" button; remove before final 1.0 release.
function resetReadyDialogVehicleOverrides(): void {
    State.round.modeConfig.vehicleIndexT1 = READY_DIALOG_VEHICLE_T1_DEFAULT_INDEX;
    State.round.modeConfig.vehicleIndexT2 = READY_DIALOG_VEHICLE_T2_DEFAULT_INDEX;
    State.round.modeConfig.vehiclesT1 = READY_DIALOG_VEHICLE_OPTIONS[READY_DIALOG_VEHICLE_T1_DEFAULT_INDEX];
    State.round.modeConfig.vehiclesT2 = READY_DIALOG_VEHICLE_OPTIONS[READY_DIALOG_VEHICLE_T2_DEFAULT_INDEX];
    State.round.modeConfig.confirmed.vehicleIndexT1 = READY_DIALOG_VEHICLE_T1_DEFAULT_INDEX;
    State.round.modeConfig.confirmed.vehicleIndexT2 = READY_DIALOG_VEHICLE_T2_DEFAULT_INDEX;
    State.round.modeConfig.confirmed.vehiclesT1 = READY_DIALOG_VEHICLE_OPTIONS[READY_DIALOG_VEHICLE_T1_DEFAULT_INDEX];
    State.round.modeConfig.confirmed.vehiclesT2 = READY_DIALOG_VEHICLE_OPTIONS[READY_DIALOG_VEHICLE_T2_DEFAULT_INDEX];
    State.round.modeConfig.confirmed.vehicleOverrideEnabled = false;
    refreshVehicleSpawnSpecsFromModeConfig();
    applyVehicleSpawnSpecsToExistingSlots();
    updateReadyDialogModeConfigForAllVisibleViewers();
    updateSettingsSummaryHudForAllPlayers();
}

function confirmReadyDialogModeConfig(changedBy?: mod.Player): void {
    const cfg = State.round.modeConfig;
    // D3 symmetric-count guard: block Confirm when the two teams' pending vehicle counts differ.
    // The dialog shows the red symmetric-count warning (toggled in updateReadyDialogModeConfigForPid).
    if (!isPendingVehicleCountSymmetric()) {
        updateReadyDialogModeConfigForAllVisibleViewers();
        return;
    }
    const prevConfirmed = cfg.confirmed.aircraftCeiling;
    const prevGameMode = cfg.confirmed.gameMode;
    const prevConfirmedHealth = cfg.confirmed.vehicleHealthMultiplier;
    const prevConfirmedSoldierHp = cfg.confirmed.soldierHpMultiplier;
    // v0.732 capture previous matchup + players for change-announce; live State.round values are
    // mutated below via applyMatchupPresetToLiveState + direct assignment so we must snapshot pre-mutation.
    const prevConfirmedMatchup = cfg.confirmed.matchupPresetIndex;
    const prevConfirmedPlayers = cfg.confirmed.autoStartMinActivePlayers;
    // v0.733 capture previous vehicle indices for the Restart-needed indicator. If any of these
    // change after Confirm, the live world still contains the previous mode's vehicles -- Confirm
    // updates spawner config + force-spawns newly-enabled slots, but doesn't despawn existing live
    // vehicles. needsRestartForVehicleChange flips true so the Restart button highlights red.
    const prevConfirmedT1 = cfg.confirmed.vehicleIndexT1;
    const prevConfirmedT2 = cfg.confirmed.vehicleIndexT2;
    // Snapshot the confirmed per-knob selection before it is overwritten below -- used to detect a
    // vehicle change and flag needsRestartForVehicleChange (parallel to the legacy vehicleIndex check).
    const prevConfirmedSel = { ...(cfg.confirmed.vehicleSelectionIndexByKey || {}) };
    // Confirm is authoritative: it can force Custom if settings diverge from presets
    // and it is the only place we apply ceiling + vehicle overrides.
    if (!isReadyDialogGameModeCustom(cfg.gameMode) && !isReadyDialogModePresetActive(cfg.gameMode)) {
        cfg.gameModeIndex = READY_DIALOG_GAME_MODE_CUSTOM_INDEX;
        cfg.gameMode = resolveCustomGameModeKey();
    }
    // v0.716: confirmed.overrideEnabled is now a DIRECT COPY of pending.overridePending, not
    // a sticky-OR with the previous confirmed value. The old sticky-OR meant once-true-always-true:
    // user could never disable an override via Confirm because picking a preset (which clears
    // pending.overridePending=false) would still resolve to true via OR. Symptom: pick a new
    // preset and Confirm -- ceiling value stayed red because confirmed.overrideEnabled remained
    // true while pending.overridePending was false from the preset application. Direct copy
    // means Confirm now respects whatever the user actually has pending.
    let nextCeilingOverrideEnabled = cfg.aircraftCeilingOverridePending;
    let applyCustomCeiling = shouldApplyCustomCeilingForConfig(cfg.gameMode, nextCeilingOverrideEnabled);

    // v0.723: ceiling-revert lockout. mod.SetMaxVehicleHeightLimitScale(1.0) is observed to be
    // one-way -- once a custom scale has been applied this session, the engine refuses to revert
    // to Vanilla without a server restart. Keep JS state in sync with engine state by restoring
    // the previously-confirmed ceiling values (and the gameMode that selected them) whenever the
    // user tries to confirm a config that would result in Vanilla. UI yellow tip in the Ready
    // Dialog warns the user beforehand so the block isn't surprising.
    if (State.round.aircraftCeiling.hasEverAppliedCustom && !applyCustomCeiling) {
        cfg.gameMode = cfg.confirmed.gameMode;
        const restoredIdx = READY_DIALOG_GAME_MODE_OPTIONS.indexOf(cfg.gameMode);
        cfg.gameModeIndex = restoredIdx >= 0 ? restoredIdx : READY_DIALOG_GAME_MODE_CUSTOM_INDEX;
        cfg.aircraftCeiling = cfg.confirmed.aircraftCeiling;
        cfg.aircraftCeilingOverridePending = cfg.confirmed.aircraftCeilingOverrideEnabled;
        nextCeilingOverrideEnabled = cfg.aircraftCeilingOverridePending;
        applyCustomCeiling = shouldApplyCustomCeilingForConfig(cfg.gameMode, nextCeilingOverrideEnabled);
    }

    // v0.727: independent per-team vehicle selection (Little Birds presets need T1=MH6, T2=MH6 PAX).
    // vehicleOverrideEnabled is true when EITHER team is not on Map Default; the actual per-team
    // override is computed in refreshVehicleSpawnSpecsFromModeConfig from each index directly.
    const t1IsMapDefault = cfg.vehicleIndexT1 === READY_DIALOG_VEHICLE_MAP_DEFAULT_INDEX;
    const t2IsMapDefault = cfg.vehicleIndexT2 === READY_DIALOG_VEHICLE_MAP_DEFAULT_INDEX;
    cfg.confirmed = {
        gameMode: cfg.gameMode,
        gameSettings: cfg.gameSettings,
        vehiclesT1: cfg.vehiclesT1,
        vehiclesT2: cfg.vehiclesT2,
        aircraftCeiling: cfg.aircraftCeiling,
        aircraftCeilingOverrideEnabled: nextCeilingOverrideEnabled,
        vehicleIndexT1: cfg.vehicleIndexT1,
        vehicleIndexT2: cfg.vehicleIndexT2,
        vehicleOverrideEnabled: !t1IsMapDefault || !t2IsMapDefault,
        vehicleHealthMultiplier: cfg.vehicleHealthMultiplier,
        soldierHpMultiplier: cfg.soldierHpMultiplier,
        matchupPresetIndex: cfg.matchupPresetIndex,
        autoStartMinActivePlayers: cfg.autoStartMinActivePlayers,
        vehicleSelectionIndexByKey: { ...cfg.vehicleSelectionIndexByKey },
    };
    refreshOvertimeZonesFromMapConfig();
    // Apply custom ceiling only after the user confirms settings; enforcement runs while enabled.
    if (!applyCustomCeiling) {
        disableCustomAircraftCeilingAndRestoreDefault();
    } else {
        enableCustomAircraftCeiling();
        // H-P1: layered ceiling always engages the engine cap. The previous AIRCRAFT_CEILING_ENFORCEMENT_MODE
        // gate has been removed -- both layers (engine hard cap + per-pid warning loop) now always fire when
        // customEnabled is true.
        applyCustomAircraftCeilingHardLimiter();
    }
    // Player-arg-safety: wrap changedBy through safePlayerArg per the v0.634 CQ_Bug_94 defensive
    // pattern. The original aircraftCeiling and gameMode broadcasts here were missed by that pass.
    if (changedBy && cfg.confirmed.aircraftCeiling !== prevConfirmed) {
        sendHighlightedWorldLogMessage(
            mod.Message(STR_READY_DIALOG_AIRCRAFT_CEILING_CHANGED, safePlayerArg(changedBy), Math.floor(cfg.confirmed.aircraftCeiling)),
            true,
            undefined,
            STR_READY_DIALOG_AIRCRAFT_CEILING_CHANGED
        );
    }
    if (changedBy && cfg.confirmed.gameMode !== prevGameMode) {
        sendHighlightedWorldLogMessage(
            mod.Message(STR_READY_DIALOG_GAME_MODE_CHANGED, safePlayerArg(changedBy), cfg.confirmed.gameMode),
            true,
            undefined,
            STR_READY_DIALOG_GAME_MODE_CHANGED
        );
    }
    if (changedBy && cfg.confirmed.vehicleHealthMultiplier !== prevConfirmedHealth) {
        sendHighlightedWorldLogMessage(
            mod.Message(STR_READY_DIALOG_VEHICLE_HEALTH_CHANGED, safePlayerArg(changedBy), Math.round(cfg.confirmed.vehicleHealthMultiplier * 100)),
            true,
            undefined,
            STR_READY_DIALOG_VEHICLE_HEALTH_CHANGED
        );
    }
    if (changedBy && cfg.confirmed.soldierHpMultiplier !== prevConfirmedSoldierHp) {
        sendHighlightedWorldLogMessage(
            mod.Message(STR_READY_DIALOG_SOLDIER_HP_CHANGED, safePlayerArg(changedBy), Math.round(cfg.confirmed.soldierHpMultiplier * 100)),
            true,
            undefined,
            STR_READY_DIALOG_SOLDIER_HP_CHANGED
        );
    }
    // v0.732 ORDERING IS LOAD-BEARING: slot.vehicleType must be rewritten BEFORE slot enablement +
    // force-spawn. refreshVehicleSpawnSpecsFromModeConfig builds the new TEAM*_VEHICLE_SPAWN_SPECS arrays
    // from confirmed cycler indices; applyVehicleSpawnSpecsToExistingSlots writes those types onto the
    // existing spawner slots; THEN applyMatchupPresetToLiveState calls applySpawnerEnablementForMatchup
    // which force-spawns newly-enabled slots. If matchup were applied first, the new spawns would inherit
    // stale slot.vehicleType from the previous confirmed mode -- this is the exact bug v0.732 fixes.
    refreshVehicleSpawnSpecsFromModeConfig();
    // Per-knob model: apply the confirmed selection to every slot (vehicle type + enable/disable +
    // spawn newly-enabled). Replaces the old refreshSpecs -> applySpecsToSlots -> matchup-enablement chain.
    applyVehicleSelectionToSlots(true);
    // Kills target = active vehicles per side (symmetric presets -> T1 count == T2 count).
    State.round.killsTarget = Math.max(1, getConfirmedActiveVehicleCountForTeam(TeamID.Team1));
    State.round.autoStartMinActivePlayers = cfg.confirmed.autoStartMinActivePlayers;
    updateMatchupLabelForAllPlayers();
    updateMatchupReadoutsForAllPlayers();
    updateSettingsSummaryHudForAllPlayers();
    // v0.732 announce matchup + players changes on Confirm (was inline on setter pre-v0.732).
    if (changedBy && cfg.confirmed.matchupPresetIndex !== prevConfirmedMatchup) {
        const preset = MATCHUP_PRESETS[cfg.confirmed.matchupPresetIndex];
        sendHighlightedWorldLogMessage(
            mod.Message(STR_READY_DIALOG_MATCHUP_CHANGED, safePlayerArg(changedBy), preset.leftPlayers, preset.rightPlayers),
            true,
            undefined,
            STR_READY_DIALOG_MATCHUP_CHANGED
        );
    }
    if (changedBy && cfg.confirmed.autoStartMinActivePlayers !== prevConfirmedPlayers) {
        const counts = getAutoStartMinPlayerCounts();
        sendHighlightedWorldLogMessage(
            mod.Message(STR_READY_DIALOG_PLAYERS_CHANGED, safePlayerArg(changedBy), counts.left, counts.right),
            true,
            undefined,
            STR_READY_DIALOG_PLAYERS_CHANGED
        );
    }
    // v0.734 set the Restart-needed sticky flag on vehicle-identity OR HP-multiplier changes. All four
    // categories share the same problem: Confirm updates spawner/deploy config but doesn't refresh
    // already-spawned vehicles or already-deployed soldiers. Specifically:
    //   - matchupPresetIndex / vehicleIndexT1/T2: live vehicles keep their old type (Confirm only force-
    //     spawns newly-enabled slots; existing vehicles keep their pre-Confirm vehicle type).
    //   - vehicleHealthMultiplier: live vehicles keep their old max HP (OnVehicleSpawned applies the
    //     multiplier per-spawn; existing vehicles aren't re-multiplied).
    //   - soldierHpMultiplier: live soldiers keep their old max HP (OnPlayerDeployed applies the
    //     multiplier per-deploy; existing soldiers aren't re-applied until next death/redeploy).
    // Compare HP values via 2-decimal round to absorb 0.01-step float drift (same pattern as the
    // dirty-state diff).
    let vehicleSelectionChanged = false;
    for (const k of READY_DIALOG_ALL_VEHICLE_KNOB_KEYS) {
        if ((cfg.confirmed.vehicleSelectionIndexByKey[k] ?? 0) !== (prevConfirmedSel[k] ?? 0)) { vehicleSelectionChanged = true; break; }
    }
    // Chat broadcast on vehicle-lineup change (parity with the ceiling/HP/mode change announcements).
    // Fires for any knob-grid edit that confirms, including within-flavor swaps (Apache -> Euro) that
    // don't move the game-mode label.
    if (changedBy && vehicleSelectionChanged) {
        sendHighlightedWorldLogMessage(
            mod.Message(mod.stringkeys.twl.readyDialog.vehiclesLineupChanged, safePlayerArg(changedBy)),
            true,
            undefined,
            mod.stringkeys.twl.readyDialog.vehiclesLineupChanged
        );
    }
    // Overtime tie-breaker auto-default by composition. Jets can't capture the objective, so switching
    // TO a jets-only comp defaults the admin Tie-Breaker setting to Disabled (the admin button reflects
    // it, and players can still flip it back on if they choose). Switching back to a chopper-involved
    // comp restores the standard "Last Round ONLY" default. Only fires on a composition TRANSITION, so a
    // deliberate admin override within the same class persists.
    const prevHadChoppers = getActiveChopperCountFromSelection(prevConfirmedSel) > 0;
    const nowHasChoppers = getActiveChopperCountFromSelection(cfg.confirmed.vehicleSelectionIndexByKey) > 0;
    if (prevHadChoppers && !nowHasChoppers) {
        State.admin.tieBreakerModeIndex = ADMIN_TIEBREAKER_MODE_DISABLED_INDEX; // jets-only default
        syncAdminTieBreakerModeLabelForAllPlayers();
    } else if (!prevHadChoppers && nowHasChoppers) {
        State.admin.tieBreakerModeIndex = ADMIN_TIEBREAKER_MODE_DEFAULT_INDEX; // Last Round ONLY
        syncAdminTieBreakerModeLabelForAllPlayers();
    }
    const matchupOrVehicleChanged =
        cfg.confirmed.matchupPresetIndex !== prevConfirmedMatchup
        || cfg.confirmed.vehicleIndexT1 !== prevConfirmedT1
        || cfg.confirmed.vehicleIndexT2 !== prevConfirmedT2
        || vehicleSelectionChanged;
    const hpChanged =
        Math.round(cfg.confirmed.vehicleHealthMultiplier * 100) !== Math.round(prevConfirmedHealth * 100)
        || Math.round(cfg.confirmed.soldierHpMultiplier * 100) !== Math.round(prevConfirmedSoldierHp * 100);
    if (matchupOrVehicleChanged || hpChanged) {
        State.round.needsRestartForVehicleChange = true;
    }
    // v0.733 trigger a dialog refresh so dirty colors clear (pending == confirmed now) and the new
    // restart-needed indicator paints. updateReadyDialogModeConfigForAllVisibleViewers calls
    // applyDirtyStateColorsForPid which drives both effects in a single pass.
    updateReadyDialogModeConfigForAllVisibleViewers();

    // v0.732 re-evaluate auto-start in case the new players/side threshold or matchup-driven kills target
    // means the round can fire now. Pre-v0.732 this lived inline in the matchup/players setters.
    if (changedBy) {
        tryAutoStartRoundIfAllReady(changedBy);
    }
}

//#endregion ----------------- Ready Dialog - Mode Presets + Confirm --------------------



//#region -------------------- Ready Dialog - Team/Matchup Readouts + Summary HUD --------------------

function updateTeamNameWidgetsForPid(pid: number): void {
    const t1NameKey = getTeamNameKey(TeamID.Team1);
    const t2NameKey = getTeamNameKey(TeamID.Team2);

    const hudT1 = safeFind(`TeamLeft_Name_${pid}`);
    const hudT2 = safeFind(`TeamRight_Name_${pid}`);
    if (hudT1) safeSetUITextLabel(hudT1, mod.Message(t1NameKey));
    if (hudT2) safeSetUITextLabel(hudT2, mod.Message(t2NameKey));

    const readyT1 = safeFind(UI_READY_DIALOG_TEAM1_LABEL_ID + pid);
    const readyT2 = safeFind(UI_READY_DIALOG_TEAM2_LABEL_ID + pid);
    if (readyT1) safeSetUITextLabel(readyT1, mod.Message(STR_READY_DIALOG_ROSTER_VEHICLES_HEADER_FORMAT, t1NameKey));
    if (readyT2) safeSetUITextLabel(readyT2, mod.Message(STR_READY_DIALOG_ROSTER_VEHICLES_HEADER_FORMAT, t2NameKey));
    const playersT1 = safeFind(UI_READY_DIALOG_TEAM1_PLAYERS_LABEL_ID + pid);
    const playersT2 = safeFind(UI_READY_DIALOG_TEAM2_PLAYERS_LABEL_ID + pid);
    if (playersT1) safeSetUITextLabel(playersT1, mod.Message(STR_READY_DIALOG_ROSTER_PLAYERS_HEADER_FORMAT, t1NameKey));
    if (playersT2) safeSetUITextLabel(playersT2, mod.Message(STR_READY_DIALOG_ROSTER_PLAYERS_HEADER_FORMAT, t2NameKey));

    updateReadyDialogModeConfigForPid(pid);
}

function updateTeamNameWidgetsForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        updateTeamNameWidgetsForPid(mod.GetObjId(p));
    }
    updateSettingsSummaryHudForAllPlayers();
}

// v0.732 The matchup row (and kills-target subtitle below) reads from PENDING modeConfig so the dialog
// reflects user navigation in real time. Live State.round.matchupPresetIndex stays as the applied/
// playable value (drives spawner enablement) until Confirm fires.
function updateMatchupLabelForPid(pid: number): void {
    const labelId = UI_READY_DIALOG_MATCHUP_LABEL_ID + pid;
    const labelWidget = safeFind(labelId);
    if (!labelWidget) return;
    const preset = MATCHUP_PRESETS[State.round.modeConfig.matchupPresetIndex];
    safeSetUITextLabel(
        labelWidget,
        mod.Message(mod.stringkeys.twl.readyDialog.matchupFormat, preset.leftPlayers, preset.rightPlayers)
    );
}

// Refreshes the matchup label (e.g., "1 vs 1") for every active player HUD.
function updateMatchupLabelForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        updateMatchupLabelForPid(mod.GetObjId(p));
    }
}

// v0.732 Resolves the per-side + total player requirements. Accepts a pending/confirmed/live value so
// each caller picks the right lifecycle stage. Default reads live State.round.autoStartMinActivePlayers
// for back-compat with the auto-start gate caller. Special case: value 0 represents "1 vs 0" to allow
// solo starts.
function getAutoStartMinPlayerCounts(perSideOverride?: number): { left: number; right: number; total: number } {
    const raw = perSideOverride !== undefined ? perSideOverride : State.round.autoStartMinActivePlayers;
    const perSide = Math.floor(raw);
    if (perSide <= 0) {
        return { left: 1, right: 0, total: 1 };
    }
    return { left: perSide, right: perSide, total: perSide * 2 };
}

// v0.732 Reads PENDING modeConfig values so the dialog updates immediately on +/- presses. Kills target
// is derived from MATCHUP_PRESETS[pendingMatchupIndex].roundKillsTarget (pre-v0.732 read State.round.killsTarget
// which was set inline by the matchup setter; now killsTarget only updates on Confirm).
function updateMatchupReadoutsForPid(pid: number): void {
    const minPlayersWidget = safeFind(UI_READY_DIALOG_MATCHUP_MINPLAYERS_ID + pid);
    const minPlayersTotalWidget = safeFind(UI_READY_DIALOG_MATCHUP_MINPLAYERS_TOTAL_ID + pid);
    const killsTargetWidget = safeFind(UI_READY_DIALOG_MATCHUP_KILLSTARGET_ID + pid);
    const counts = getAutoStartMinPlayerCounts(State.round.modeConfig.autoStartMinActivePlayers);
    const pendingMatchup = MATCHUP_PRESETS[State.round.modeConfig.matchupPresetIndex];
    if (minPlayersWidget) {
        safeSetUITextLabel(
            minPlayersWidget,
            mod.Message(mod.stringkeys.twl.readyDialog.playersFormat, counts.left, counts.right)
        );
    }
    if (minPlayersTotalWidget) {
        safeSetUITextLabel(
            minPlayersTotalWidget,
            mod.Message(mod.stringkeys.twl.readyDialog.minPlayersToStartFormat, counts.total)
        );
    }
    if (killsTargetWidget) {
        safeSetUITextLabel(
            killsTargetWidget,
            mod.Message(mod.stringkeys.twl.readyDialog.targetKillsToWinFormat, Math.floor(pendingMatchup.roundKillsTarget))
        );
    }
}

// Refreshes the matchup readouts for all players with a Ready dialog HUD.
function updateMatchupReadoutsForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        updateMatchupReadoutsForPid(mod.GetObjId(p));
    }
    updateSettingsSummaryHudForAllPlayers();
}

// Uses confirmed mode settings only (pending Ready dialog tweaks are not shown here).
function updateSettingsSummaryHudForPid(pid: number): void {
    const refs = State.hudCache.hudByPid[pid];
    if (!refs) return;

    const cfg = State.round.modeConfig;
    const gameModeValue = cfg.confirmed.gameMode;
    const applyCustomCeiling = shouldApplyCustomCeilingForConfig(gameModeValue, cfg.confirmed.aircraftCeilingOverrideEnabled);
    const ceilingValue = applyCustomCeiling
        ? Math.floor(cfg.confirmed.aircraftCeiling)
        : STR_READY_DIALOG_AIRCRAFT_CEILING_VANILLA;
    const vehiclesT1Value = cfg.confirmed.vehiclesT1;
    const vehiclesT2Value = cfg.confirmed.vehiclesT2;

    // v0.732 HUD reflects CONFIRMED matchup + players (not pending). Matches the established pattern
    // for other modeConfig fields -- HUD only updates when the user has actually committed the change.
    const preset = MATCHUP_PRESETS[cfg.confirmed.matchupPresetIndex] ?? MATCHUP_PRESETS[0];
    const vehiclesLeft = preset?.leftPlayers ?? 1;
    const vehiclesRight = preset?.rightPlayers ?? 1;
    const autoStartCounts = getAutoStartMinPlayerCounts(cfg.confirmed.autoStartMinActivePlayers);

    if (refs.settingsGameModeText) {
        safeSetUITextLabel(refs.settingsGameModeText, mod.Message(STR_HUD_SETTINGS_GAME_MODE_FORMAT, gameModeValue));
    }
    if (refs.settingsAircraftCeilingText) {
        // Punish reads "On" only when a custom ceiling is actually applied AND the admin toggle is enabled.
        // Vanilla (no enforced ceiling) -> always "Off" because there's nothing to punish against.
        const punishKey = applyCustomCeiling && State.admin.ceilingPunishEnabled
            ? STR_HUD_SETTINGS_PUNISH_ON
            : STR_HUD_SETTINGS_PUNISH_OFF;
        safeSetUITextLabel(refs.settingsAircraftCeilingText, mod.Message(STR_HUD_SETTINGS_AIRCRAFT_CEILING_FORMAT, ceilingValue, punishKey));
    }
    // Vehicle Health Multiplier line -- always shown (even at the default 100%).
    if (refs.settingsVehicleHealthText) {
        safeSetUITextLabel(
            refs.settingsVehicleHealthText,
            mod.Message(STR_HUD_SETTINGS_VEHICLE_HEALTH_FORMAT, Math.round(cfg.confirmed.vehicleHealthMultiplier * 100))
        );
    }
    if (refs.settingsSoldierHpText) {
        safeSetUITextLabel(
            refs.settingsSoldierHpText,
            mod.Message(STR_HUD_SETTINGS_SOLDIER_HP_FORMAT, Math.round(cfg.confirmed.soldierHpMultiplier * 100))
        );
    }
    // D14: per-team vehicle composition readout from the confirmed selection (e.g. "1 Jet(s), 1 Chopper(s)").
    if (refs.settingsVehiclesT1Text) {
        const c1 = getConfirmedVehicleCompositionForTeam(TeamID.Team1);
        safeSetUITextLabel(
            refs.settingsVehiclesT1Text,
            mod.Message(STR_HUD_SETTINGS_VEHICLES_COMPOSITION_TEAM_FORMAT, getTeamNameKey(TeamID.Team1), c1.jets, c1.choppers)
        );
    }
    if (refs.settingsVehiclesT2Text) {
        const c2 = getConfirmedVehicleCompositionForTeam(TeamID.Team2);
        safeSetUITextLabel(
            refs.settingsVehiclesT2Text,
            mod.Message(STR_HUD_SETTINGS_VEHICLES_COMPOSITION_TEAM_FORMAT, getTeamNameKey(TeamID.Team2), c2.jets, c2.choppers)
        );
    }
    // "First to X Vehicle Kills" -- reuses the empty slot where the old vehicle-count (matchup) line
    // sat in the settings panel. Green to flag the win condition. X = confirmed round kills target.
    if (refs.settingsVehiclesMatchupText) {
        mod.SetUIWidgetVisible(refs.settingsVehiclesMatchupText, true);
        mod.SetUITextColor(refs.settingsVehiclesMatchupText, COLOR_READY_GREEN);
        safeSetUITextLabel(refs.settingsVehiclesMatchupText, mod.Message(mod.stringkeys.twl.readyDialog.firstToKillsFormat, Math.max(1, Math.floor(State.round.killsTarget))));
    }
    if (refs.settingsPlayersText) {
        safeSetUITextLabel(refs.settingsPlayersText, mod.Message(STR_HUD_SETTINGS_PLAYERS_FORMAT, autoStartCounts.left, autoStartCounts.right));
    }
    // Player-facing Overtime readout (when-based, 3 states). Reflects "will I see the tie-breaker
    // objective?" on a single axis: "Off" = admin setting Disabled (auto-set for jets-only comps);
    // "This Round" = active in the round being played (All Rounds, or the final round under Last-Round-
    // ONLY); "Final Round" = enabled but not yet (Last-Round-ONLY before the last round). The third
    // possible boolean combo (Disabled + active) can't occur, so this is 3 states, not 4.
    if (refs.settingsOvertimeText) {
        const otMode = State.admin.tieBreakerModeIndex;
        let otValueKey: number;
        if (normalizeTieBreakerModeIndex(otMode) === ADMIN_TIEBREAKER_MODE_DISABLED_INDEX) {
            otValueKey = STR_HUD_SETTINGS_OVERTIME_OFF;
        } else if (computeTieBreakerEnabledForRound(State.round.current, State.round.max, otMode)) {
            otValueKey = STR_HUD_SETTINGS_OVERTIME_THIS_ROUND;
        } else {
            otValueKey = STR_HUD_SETTINGS_OVERTIME_FINAL_ROUND;
        }
        safeSetUITextLabel(refs.settingsOvertimeText, mod.Message(STR_HUD_SETTINGS_OVERTIME_FLAG_FORMAT, otValueKey));
    }
}

function updateSettingsSummaryHudForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        updateSettingsSummaryHudForPid(mod.GetObjId(p));
    }
}

// v0.732 Pending-only setter for auto-start min players per side. Mutates modeConfig.autoStartMinActivePlayers;
// the live State.round.autoStartMinActivePlayers stays unchanged until the user clicks Confirm. Drops the
// pre-v0.732 tryAutoStartRoundIfAllReady trigger and the announce log -- both fire from confirmReadyDialogModeConfig
// now. ensureCustomGameModeForManualChange() flips the game-mode label to Custom when the pending value diverges
// from the active preset, matching aircraftCeiling / vehicleHP setter behavior.
function setAutoStartMinActivePlayers(value: number, _eventPlayer?: mod.Player): void {
    const clamped = Math.max(AUTO_START_MIN_ACTIVE_PLAYERS_MIN, Math.min(AUTO_START_MIN_ACTIVE_PLAYERS_MAX, Math.floor(value)));
    if (clamped === State.round.modeConfig.autoStartMinActivePlayers) return;
    ensureCustomGameModeForManualChange();
    State.round.modeConfig.autoStartMinActivePlayers = clamped;
    // v0.733 also refresh the players row readouts so the +/- press updates the visible value
    // immediately. updateReadyDialogModeConfigForAllVisibleViewers only refreshes the game-mode/
    // ceiling/HP/vehicle rows; the matchup + players rows have their own render functions.
    updateMatchupReadoutsForAllPlayers();
    updateReadyDialogModeConfigForAllVisibleViewers();
}

// v0.732 Pending-only setter for the matchup preset (vehicles/team + kills target). Mutates
// modeConfig.matchupPresetIndex; live State.round.matchupPresetIndex (and spawner enablement, kills target)
// stays unchanged until Confirm. Kept the cooldown -- still throttles UI flicker on rapid +/-. Drops the
// pre-v0.732 force-spawn + announce + tryAutoStartRoundIfAllReady -- those fire from confirmReadyDialogModeConfig.
function setReadyDialogMatchupPreset(index: number, _eventPlayer?: mod.Player, bypassCooldown: boolean = false): void {
    const clamped = Math.max(0, Math.min(MATCHUP_PRESETS.length - 1, Math.floor(index)));
    if (clamped === State.round.modeConfig.matchupPresetIndex) return;
    const now = Math.floor(mod.GetMatchTimeElapsed());
    if (!bypassCooldown && now - State.round.lastMatchupChangeAtSeconds < MATCHUP_CHANGE_COOLDOWN_SECONDS) return;
    ensureCustomGameModeForManualChange();
    State.round.modeConfig.matchupPresetIndex = clamped;
    State.round.lastMatchupChangeAtSeconds = now;
    // v0.733 also refresh the matchup row label ("Vehicles: X v Y") + the kills-target subtitle
    // so the +/- press updates the visible value immediately. Without these, the user only sees the
    // red dirty-color flip without seeing what the new value is.
    updateMatchupLabelForAllPlayers();
    updateMatchupReadoutsForAllPlayers();
    updateReadyDialogModeConfigForAllVisibleViewers();
}

// v0.732 Live-state applier for matchup preset. Called from confirmReadyDialogModeConfig only. Mutates
// State.round.matchupPresetIndex + State.round.killsTarget, refreshes the LIVE matchup label/readouts,
// and triggers slot enablement + force-spawn via applySpawnerEnablementForMatchup. Returns the matchup
// preset object so the caller can use roundKillsTarget for downstream logic if needed.
function applyMatchupPresetToLiveState(index: number): MatchupPreset {
    const clamped = Math.max(0, Math.min(MATCHUP_PRESETS.length - 1, Math.floor(index)));
    const preset = MATCHUP_PRESETS[clamped];
    State.round.matchupPresetIndex = clamped;
    State.round.lastMatchupChangeAtSeconds = Math.floor(mod.GetMatchTimeElapsed());
    State.round.killsTarget = preset.roundKillsTarget;
    setRoundStateTextForAllPlayers();
    syncRoundKillsTargetTesterValueForAllPlayers();
    applySpawnerEnablementForMatchup(clamped, true);
    return preset;
}

// v0.732 Backward-compat wrapper -- kept temporarily for any straggling caller. Routes manual cycler clicks
// through the new pending-only setter. (The +/- buttons in the dialog already call applyMatchupPreset; this
// wrapper just forwards to setReadyDialogMatchupPreset.)
function applyMatchupPreset(index: number, eventPlayer: mod.Player): void {
    setReadyDialogMatchupPreset(index, eventPlayer, false);
}

/* Dead function - commenting out for now to ensure we can kill it
// Refreshes the roster UI for every player who currently has the dialog open.
// Phase 3 uses this to reflect main-base state changes live without requiring users to reopen the dialog.
function refreshReadyDialogForAllVisibleViewers(): void {
    const viewers = mod.AllPlayers();
    const viewerCount = mod.CountOf(viewers);
    for (let i = 0; i < viewerCount; i++) {
        const viewer = mod.ValueInArray(viewers, i) as mod.Player;
        const vid = mod.GetObjId(viewer);
        if (State.players.teamSwitchData[vid] && State.players.teamSwitchData[vid].dialogVisible) {
            refreshReadyDialogRosterForViewer(viewer, vid);
            updateReadyToggleButtonForViewer(viewer, vid);
        }
    }
}
*/

//#endregion ----------------- Ready Dialog - Team/Matchup Readouts + Summary HUD --------------------



//#region -------------------- Join Prompt - IDs + Gating --------------------

function joinPromptRootName(pid: number): string { return "join_prompt_root_" + pid; }
function joinPromptPanelName(pid: number): string { return "join_prompt_panel_" + pid; }
function joinPromptTitleName(pid: number): string { return "join_prompt_title_" + pid; }
function joinPromptBodyName(pid: number): string { return "join_prompt_body_" + pid; }
function joinPromptButtonName(pid: number): string { return "join_prompt_dismiss_" + pid; }
function joinPromptButtonBorderName(pid: number): string { return joinPromptButtonName(pid) + "_BORDER"; }
function joinPromptButtonTextName(pid: number): string { return "join_prompt_dismiss_text_" + pid; }
function joinPromptNeverShowButtonName(pid: number): string { return "join_prompt_never_show_" + pid; }
function joinPromptNeverShowButtonBorderName(pid: number): string { return joinPromptNeverShowButtonName(pid) + "_BORDER"; }
function joinPromptNeverShowButtonTextName(pid: number): string { return "join_prompt_never_show_text_" + pid; }

function deleteJoinPromptWidget(name: string): void {
    const w = safeFind(name);
    if (!w) return;
    // Best-effort delete: widget may already be gone during undeploy/reconnect churn.
    try {
        mod.DeleteUIWidget(w);
    } catch {
        // Intentionally silent to avoid engine-side crashes on invalid handles.
    }
}

function isJoinPromptSuppressedForPlayer(pid: number): boolean {
    return !!State.players.joinPromptNeverShowByPidMap[pid]?.[ACTIVE_MAP_KEY];
}

// Persist "Never Show Again" per-map so other maps can still show the prompt
function setJoinPromptSuppressedForPlayer(pid: number): void {
    if (!State.players.joinPromptNeverShowByPidMap[pid]) {
        State.players.joinPromptNeverShowByPidMap[pid] = {};
    }
    State.players.joinPromptNeverShowByPidMap[pid][ACTIVE_MAP_KEY] = true;
}

// Lightweight gating used for both join-time and undeploy prompts (join-time "only once" is tracked separately).
function shouldShowJoinPromptForPlayer(player: mod.Player): boolean {
    if (!SHOW_HELP_TEXT_PROMPT_ON_JOIN) return false;
    if (!player || !mod.IsPlayerValid(player)) return false;
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return false;
    if (isJoinPromptSuppressedForPlayer(pid)) return false;
    if (safeFind(joinPromptRootName(pid))) return false;
    return true;
}

// Join prompt sequencing helpers:
// These keep the prompt flow deterministic and low-risk by only adjusting
// in-memory per-player state and selecting string keys accordingly.
function ensureJoinPromptStateForPid(pid: number): void {
    if (State.players.joinPromptReadyDialogOpenedByPid[pid] === undefined) {
        State.players.joinPromptReadyDialogOpenedByPid[pid] = false;
    }
    if (State.players.joinPromptTipIndexByPid[pid] === undefined) {
        State.players.joinPromptTipIndexByPid[pid] = 0;
    }
    if (State.players.joinPromptTipsUnlockedByPid[pid] === undefined) {
        State.players.joinPromptTipsUnlockedByPid[pid] = false;
    }
}

// Marks that the player successfully opened the Ready Up dialog (true unlock event).
// Ensures the next prompt shows mandatory2 before tips begin.
function markJoinPromptReadyDialogOpened(pid: number): void {
    ensureJoinPromptStateForPid(pid);
    if (State.players.joinPromptReadyDialogOpenedByPid[pid]) return;
    State.players.joinPromptReadyDialogOpenedByPid[pid] = true;
    if ((State.players.joinPromptTipIndexByPid[pid] ?? 0) < 1) {
        State.players.joinPromptTipIndexByPid[pid] = 1;
    }
}

// Arms a one-shot flag when a player triggers the triple-tap detector.
// This lets us require the multi-click path before unlocking join prompt tips.
function armJoinPromptTripleTapForPid(pid: number): void {
    State.players.joinPromptTripleTapArmedByPid[pid] = true;
}

function consumeJoinPromptTripleTapForPid(pid: number): boolean {
    if (!State.players.joinPromptTripleTapArmedByPid[pid]) return false;
    State.players.joinPromptTripleTapArmedByPid[pid] = false;
    return true;
}

function isJoinPromptBodyKeySkipped(key: number): boolean {
    return JOIN_PROMPT_BODY_SEQUENCE_SKIP_KEYS.indexOf(key) !== -1;
}

function findNextJoinPromptSequenceIndex(startIndex: number): number {
    const max = JOIN_PROMPT_BODY_SEQUENCE_KEYS.length;
    if (max <= 0) return 0;
    for (let offset = 0; offset < max; offset++) {
        const idx = (startIndex + offset) % max;
        const key = JOIN_PROMPT_BODY_SEQUENCE_KEYS[idx];
        if (!isJoinPromptBodyKeySkipped(key)) return idx;
    }
    return 0;
}

// Returns the clamped sequence index for this player.
function getJoinPromptSequenceIndexForPid(pid: number): number {
    ensureJoinPromptStateForPid(pid);
    const raw = Math.floor(State.players.joinPromptTipIndexByPid[pid] ?? 0);
    const max = JOIN_PROMPT_BODY_SEQUENCE_KEYS.length;
    const clamped = (raw >= 0 && raw < max) ? raw : 0;
    const resolved = findNextJoinPromptSequenceIndex(clamped);
    State.players.joinPromptTipIndexByPid[pid] = resolved;
    return resolved;
}

// Selects the body key for the prompt based on unlock + sequence state.
function getJoinPromptBodyKeyForPid(pid: number): number {
    ensureJoinPromptStateForPid(pid);
    if (!State.players.joinPromptReadyDialogOpenedByPid[pid]) {
        return STR_JOIN_PROMPT_BODY_MANDATORY1;
    }
    const index = getJoinPromptSequenceIndexForPid(pid);
    if (index >= 2) {
        State.players.joinPromptTipsUnlockedByPid[pid] = true;
    }
    return JOIN_PROMPT_BODY_SEQUENCE_KEYS[index];
}

// Chooses the dismiss label based on whether tips are unlocked.
function getJoinPromptDismissLabelKeyForPid(pid: number): number {
    ensureJoinPromptStateForPid(pid);
    return State.players.joinPromptTipsUnlockedByPid[pid]
        ? STR_JOIN_PROMPT_DISMISS_SHOW_MORE_TIPS
        : STR_JOIN_PROMPT_DISMISS;
}

// Never Show Again is only available after tips are unlocked.
function shouldShowJoinPromptNeverShowButtonForPid(pid: number): boolean {
    ensureJoinPromptStateForPid(pid);
    return State.players.joinPromptReadyDialogOpenedByPid[pid] && State.players.joinPromptTipsUnlockedByPid[pid];
}

// Advances the sequence only after the player has unlocked tips.
function advanceJoinPromptSequenceOnDismiss(pid: number): void {
    ensureJoinPromptStateForPid(pid);
    if (!State.players.joinPromptReadyDialogOpenedByPid[pid]) {
        State.players.joinPromptTipIndexByPid[pid] = 0;
        return;
    }
    const current = getJoinPromptSequenceIndexForPid(pid);
    const next = findNextJoinPromptSequenceIndex(current + 1);
    State.players.joinPromptTipIndexByPid[pid] = next;
    if (next >= 2) {
        State.players.joinPromptTipsUnlockedByPid[pid] = true;
    }
}

//#endregion ----------------- Join Prompt - IDs + Gating --------------------



//#region -------------------- Join Prompt - Layout --------------------

// Builds the join overlay, blocks deploy, and enables UI input until dismissed.
function createJoinPromptForPlayer(player: mod.Player): void {
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return;
    const uiRoot = mod.GetUIRoot();
    const bodyKey = getJoinPromptBodyKeyForPid(pid);
    const dismissLabelKey = getJoinPromptDismissLabelKeyForPid(pid);
    const showNeverShow = shouldShowJoinPromptNeverShowButtonForPid(pid);

    deleteJoinPromptWidget(joinPromptRootName(pid));
    deleteJoinPromptWidget(joinPromptButtonBorderName(pid));
    deleteJoinPromptWidget(joinPromptNeverShowButtonBorderName(pid));

    mod.EnablePlayerDeploy(player, false);
    setUIInputModeForPlayer(player, true);

    mod.AddUIContainer(
        joinPromptRootName(pid),
        mod.CreateVector(0, 0, 0),
        mod.CreateVector(1920, 1080, 0),
        mod.UIAnchor.Center,
        uiRoot,
        true,
        0,
        mod.CreateVector(0, 0, 0),
        0.55,
        mod.UIBgFill.Solid,
        mod.UIDepth.AboveGameUI,
        player
    );

    const root = safeFind(joinPromptRootName(pid));
    if (root) mod.SetUIWidgetDepth(root, mod.UIDepth.AboveGameUI);
    if (root) reparentSpawnDisabledLiveTextForPid(pid, root);

    const joinPromptPanelOffsetY = -54;
    const joinPromptButtonOffsetY = 173;

    mod.AddUIContainer(
        joinPromptPanelName(pid),
        mod.CreateVector(0, joinPromptPanelOffsetY, 0),
        mod.CreateVector(900, 444, 0),
        mod.UIAnchor.Center,
        root ?? uiRoot,
        true,
        0,
        mod.CreateVector(0.08, 0.08, 0.08),
        0.95,
        mod.UIBgFill.Solid,
        mod.UIDepth.AboveGameUI,
        player
    );

    const panel = safeFind(joinPromptPanelName(pid));
    if (panel) mod.SetUIWidgetDepth(panel, mod.UIDepth.AboveGameUI);

    mod.AddUIText(
        joinPromptTitleName(pid),
        mod.CreateVector(0, -192, 0),
        mod.CreateVector(820, 60, 0),
        mod.UIAnchor.Center,
        panel ?? uiRoot,
        true,
        0,
        mod.CreateVector(0, 0, 0),
        0,
        mod.UIBgFill.None,
        mod.Message(STR_JOIN_PROMPT_TITLE),
        42,
        mod.CreateVector(1, 1, 1),
        1,
        mod.UIAnchor.Center,
        mod.UIDepth.AboveGameUI,
        player
    );

    mod.AddUIText(
        joinPromptBodyName(pid),
        mod.CreateVector(0, 0, 0),
        mod.CreateVector(740, 300, 0), // 900-wide panel with 80px side inset on each side
        mod.UIAnchor.Center,
        panel ?? uiRoot,
        true,
        0,
        mod.CreateVector(0, 0, 0),
        0,
        mod.UIBgFill.None,
        mod.Message(bodyKey),
        22,
        mod.CreateVector(1, 1, 1),
        1,
        mod.UIAnchor.TopLeft,
        mod.UIDepth.AboveGameUI,
        player
    );

    const neverShowBorder = addOutlinedButton(
        joinPromptNeverShowButtonName(pid),
        -200,
        joinPromptButtonOffsetY,
        360,
        70,
        mod.UIAnchor.Center,
        panel ?? uiRoot,
        player
    );

    const neverShowButton = safeFind(joinPromptNeverShowButtonName(pid));
    if (neverShowButton) {
        mod.SetUIWidgetDepth(neverShowButton, mod.UIDepth.AboveGameUI);
        mod.SetUIWidgetVisible(neverShowButton, showNeverShow);
        mod.EnableUIButtonEvent(neverShowButton, mod.UIButtonEvent.ButtonUp, showNeverShow);
    }
    const neverShowBorderWidget = safeFind(joinPromptNeverShowButtonBorderName(pid));
    if (neverShowBorderWidget) {
        mod.SetUIWidgetDepth(neverShowBorderWidget, mod.UIDepth.AboveGameUI);
        mod.SetUIWidgetVisible(neverShowBorderWidget, showNeverShow);
    }

    const neverShowTextParent = neverShowBorder ?? panel ?? uiRoot;
    const neverShowText = addCenteredButtonText(
        joinPromptNeverShowButtonTextName(pid),
        360,
        70,
        mod.Message(STR_JOIN_PROMPT_NEVER_SHOW),
        player,
        neverShowTextParent
    );
    if (neverShowText) {
        mod.SetUITextSize(neverShowText, 24);
        mod.SetUITextColor(neverShowText, mod.CreateVector(1, 1, 1));
        mod.SetUIWidgetDepth(neverShowText, mod.UIDepth.AboveGameUI);
        mod.SetUIWidgetParent(neverShowText, neverShowTextParent);
        mod.SetUIWidgetPosition(
            neverShowText,
            neverShowBorder ? mod.CreateVector(0, 0, 0) : mod.CreateVector(-200, joinPromptButtonOffsetY, 0)
        );
        mod.SetUIWidgetVisible(neverShowText, showNeverShow);
    }

    const dismissBorder = addOutlinedButton(
        joinPromptButtonName(pid),
        200,
        joinPromptButtonOffsetY,
        360,
        70,
        mod.UIAnchor.Center,
        panel ?? uiRoot,
        player
    );

    const dismissButton = safeFind(joinPromptButtonName(pid));
    if (dismissButton) {
        mod.SetUIWidgetDepth(dismissButton, mod.UIDepth.AboveGameUI);
        mod.EnableUIButtonEvent(dismissButton, mod.UIButtonEvent.ButtonUp, true);
    }
    const dismissBorderWidget = safeFind(joinPromptButtonBorderName(pid));
    if (dismissBorderWidget) mod.SetUIWidgetDepth(dismissBorderWidget, mod.UIDepth.AboveGameUI);

    const dismissTextParent = dismissBorder ?? panel ?? uiRoot;
    const dismissText = addCenteredButtonText(
        joinPromptButtonTextName(pid),
        360,
        70,
        mod.Message(dismissLabelKey),
        player,
        dismissTextParent
    );
    if (dismissText) {
        mod.SetUITextSize(dismissText, 24);
        mod.SetUITextColor(dismissText, mod.CreateVector(1, 1, 1));
        mod.SetUIWidgetDepth(dismissText, mod.UIDepth.AboveGameUI);
        mod.SetUIWidgetParent(dismissText, dismissTextParent);
        mod.SetUIWidgetPosition(
            dismissText,
            dismissBorder ? mod.CreateVector(0, 0, 0) : mod.CreateVector(200, joinPromptButtonOffsetY, 0)
        );
    }
}

//#endregion ----------------- Join Prompt - Layout --------------------



//#region -------------------- Join Prompt - Lifecycle + Events --------------------

// Respects round/cleanup locks when re-enabling deploy after dismiss.
function canEnableDeployAfterJoinPrompt(): boolean {
    if (State.round.flow.cleanupActive && !State.round.flow.cleanupAllowDeploy) return false;
    if (isLiveRespawnDisabled() && isRoundLive()) return false;
    return true;
}

// Dismisses the overlay and restores input/deploy based on current locks.
function dismissJoinPromptForPlayer(player: mod.Player): void {
    const pid = mod.GetObjId(player);

    setUIInputModeForPlayer(player, false);
    mod.EnablePlayerDeploy(player, canEnableDeployAfterJoinPrompt());
    reparentSpawnDisabledLiveTextForPid(pid, mod.GetUIRoot());

    deleteJoinPromptWidget(joinPromptButtonTextName(pid));
    deleteJoinPromptWidget(joinPromptButtonName(pid));
    deleteJoinPromptWidget(joinPromptButtonBorderName(pid));
    deleteJoinPromptWidget(joinPromptNeverShowButtonTextName(pid));
    deleteJoinPromptWidget(joinPromptNeverShowButtonName(pid));
    deleteJoinPromptWidget(joinPromptNeverShowButtonBorderName(pid));
    deleteJoinPromptWidget(joinPromptBodyName(pid));
    deleteJoinPromptWidget(joinPromptTitleName(pid));
    deleteJoinPromptWidget(joinPromptPanelName(pid));
    deleteJoinPromptWidget(joinPromptRootName(pid));
}

// Hard cleanup for disconnects (removes any prompt widgets for that pid).
function clearJoinPromptForPlayerId(playerId: number): void {
    reparentSpawnDisabledLiveTextForPid(playerId, mod.GetUIRoot());
    deleteJoinPromptWidget(joinPromptButtonTextName(playerId));
    deleteJoinPromptWidget(joinPromptButtonName(playerId));
    deleteJoinPromptWidget(joinPromptButtonBorderName(playerId));
    deleteJoinPromptWidget(joinPromptNeverShowButtonTextName(playerId));
    deleteJoinPromptWidget(joinPromptNeverShowButtonName(playerId));
    deleteJoinPromptWidget(joinPromptNeverShowButtonBorderName(playerId));
    deleteJoinPromptWidget(joinPromptBodyName(playerId));
    deleteJoinPromptWidget(joinPromptTitleName(playerId));
    deleteJoinPromptWidget(joinPromptPanelName(playerId));
    deleteJoinPromptWidget(joinPromptRootName(playerId));
}

// Button handler: dismisses when the OK button (or its children) is clicked.
function tryHandleJoinPromptButton(
    eventPlayer: mod.Player,
    eventUIWidget: mod.UIWidget,
    eventUIButtonEvent: mod.UIButtonEvent
): boolean {
    if (!SHOW_HELP_TEXT_PROMPT_ON_JOIN) return false;
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return false;
    if (!mod.Equals(eventUIButtonEvent, mod.UIButtonEvent.ButtonUp)) return false;

    const pid = mod.GetObjId(eventPlayer);
    const dismissId = joinPromptButtonName(pid);
    const neverShowId = joinPromptNeverShowButtonName(pid);
    let w: mod.UIWidget = eventUIWidget;
    for (let i = 0; i < 8; i++) {
        const name = mod.GetUIWidgetName(w);
        if (name === dismissId) {
            advanceJoinPromptSequenceOnDismiss(pid);
            dismissJoinPromptForPlayer(eventPlayer);
            return true;
        }
        if (name === neverShowId) {
            setJoinPromptSuppressedForPlayer(pid);
            dismissJoinPromptForPlayer(eventPlayer);
            return true;
        }
        const parent = mod.GetUIWidgetParent(w);
        if (!parent) break;
        w = parent;
    }
    return false;
}

//#endregion ----------------- Join Prompt - Lifecycle + Events --------------------



//#region -------------------- Ready Dialog - Ready State Reset --------------------

// Resets all players to NOT READY. Called when a round ends (including match-end paths) so the next round requires a fresh ready-up cycle.
function resetReadyStateForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const pid = mod.GetObjId(p);
        State.players.readyByPid[pid] = false;
        delete State.players.overTakeoffLimitByPid[pid];
        // Keep the HUD "X / Y PLAYERS READY" line in sync on every ready-state change.
        updatePlayersReadyHudTextForAllPlayers();
    }
    // If any dialogs are open, reflect the reset immediately.
    renderReadyDialogForAllVisibleViewers();
    updatePlayersReadyHudTextForAllPlayers();
}

//#endregion -------------------- Ready Dialog - Ready State Reset --------------------



//#region -------------------- Ready Dialog - Takeoff Limit Gating --------------------

function isPlayerInMainBaseForReady(pid: number): boolean {
    const inBase = (State.players.inMainBaseByPid[pid] !== undefined) ? State.players.inMainBaseByPid[pid] : true;
    if (State.players.overTakeoffLimitByPid[pid]) return false;
    return inBase;
}

async function showOverTakeoffMessageForAllPlayers(offender: mod.Player): Promise<void> {
    const offenderToken = (offender && mod.IsPlayerValid(offender))
        ? offender
        : mod.stringkeys.twl.system.unknownPlayer;
    await showGlobalTitleSubtitleMessageForAllPlayers(
        mod.Message(STR_OVERLINE_TAKEOFF_TITLE, offenderToken),
        // takeoffSubtitle has no {0} placeholder; drop the extra arg to silence
        // engine "Received undefined values" warning on unused format slots.
        mod.Message(STR_OVERLINE_TAKEOFF_SUBTITLE),
        COLOR_NOT_READY_RED,
        COLOR_WARNING_YELLOW
    );
}

function checkTakeoffLimitForAllPlayers(cachedPlayers?: any, cachedCount?: number): void {
    if (State.match.isEnded) return;
    // Skip during any phase other than pregame NotReady, and during round-end cleanup.
    // Eliminates SoldierState reads on players whose deployedByPid cache is stale
    // during the post-death undeploy race (Conquest #94 family).
    if (State.round.phase !== RoundPhase.NotReady) return;
    if (State.round.flow.cleanupActive) return;

    const floorY = Math.floor(State.round.aircraftCeiling.hudFloorY);
    const limitY = floorY + TAKEOFF_LIMIT_HUD_OFFSET;

    // v0.712: accept a tick-context AllPlayers snapshot from the main loop; fall through to a
    // fresh fetch when called from non-tick paths (currently none, but keep the helper safe).
    const players = cachedPlayers ?? mod.AllPlayers();
    const count = cachedCount ?? mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const pid = safeGetPlayerId(p);
        if (pid === undefined) continue;

        if (!isPlayerDeployed(p)) {
            delete State.players.overTakeoffLimitByPid[pid];
            continue;
        }
        if (!isPlayerAlive(p)) {
            continue;
        }

        const pos = safeGetSoldierStateVector(p, mod.SoldierStateVector.GetPosition);
        if (!pos) continue;
        const posY = mod.YComponentOf(pos);
        const currentlyOver = !!State.players.overTakeoffLimitByPid[pid];
        const overLimit = posY > limitY;

        if (overLimit && !currentlyOver && isPlayerInMainBaseForReady(pid)) {
            State.players.overTakeoffLimitByPid[pid] = true;
            State.players.readyByPid[pid] = false;
            updatePlayersReadyHudTextForAllPlayers();
            updateHelpTextVisibilityForPid(pid);
            if (State.round.countdown.isRequested) {
                cancelPregameCountdown();
                void showOverTakeoffMessageForAllPlayers(p);
            }
            sendHighlightedWorldLogMessage(
                mod.Message(STR_READYUP_RETURN_TO_BASE_NOT_LIVE, Math.floor(State.round.current)),
                false,
                p,
                STR_READYUP_RETURN_TO_BASE_NOT_LIVE
            );
            renderReadyDialogForAllVisibleViewers();
            continue;
        }

        if (!overLimit && currentlyOver) {
            delete State.players.overTakeoffLimitByPid[pid];
            renderReadyDialogForAllVisibleViewers();
        }
    }
}

//#endregion -------------------- Ready Dialog - Takeoff Limit Gating --------------------


//#region -------------------- Ready Dialog - Auto-Ready --------------------

// Applies auto-ready rules for a single player. Returns true if ready state changed.
function applyAutoReadyForPid(player: mod.Player, pid: number): boolean {
    if (!player || !mod.IsPlayerValid(player)) return false;
    if (!State.players.autoReadyByPid[pid]) return false;
    if (State.match.isEnded || isRoundLive()) return false;

    const inVehicle = (isPlayerDeployed(player) && isPlayerAlive(player))
        ? safeGetSoldierStateBool(player, mod.SoldierStateBool.IsInVehicle)
        : false;
    const inBase = isPlayerInMainBaseForReady(pid);
    const shouldBeReady = !!inVehicle && inBase;
    const currentlyReady = !!State.players.readyByPid[pid];

    if (shouldBeReady === currentlyReady) return false;

    State.players.readyByPid[pid] = shouldBeReady;
    updateHelpTextVisibilityForPid(pid);

    if (shouldBeReady) {
        sendHighlightedWorldLogMessage(
            mod.Message(STR_PLAYER_AUTO_READIED_UP, safePlayerArg(player)),
            true,
            undefined,
            STR_PLAYER_AUTO_READIED_UP
        );
    }
    return true;
}

// Applies auto-ready rules for all players who have auto-ready enabled.
function applyAutoReadyForAllPlayers(cachedPlayers?: any, cachedCount?: number): void {
    if (State.match.isEnded) return;
    // Match the pregame-only gate pattern: skip during GameOver and cleanupActive
    // to avoid SoldierState reads on just-died players (Conquest #94 family).
    if (State.round.phase !== RoundPhase.NotReady) return;
    if (State.round.flow.cleanupActive) return;

    const nowSeconds = Math.floor(mod.GetMatchTimeElapsed());
    if (nowSeconds - lastAutoReadyCheckAtSeconds < AUTO_READY_CHECK_INTERVAL_SECONDS) return;
    lastAutoReadyCheckAtSeconds = nowSeconds;

    // v0.712: accept a tick-context AllPlayers snapshot from the main loop; fall through to a
    // fresh fetch when called from non-tick paths (currently none, but keep the helper safe).
    const players = cachedPlayers ?? mod.AllPlayers();
    const count = cachedCount ?? mod.CountOf(players);
    let anyChanged = false;

    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const pid = safeGetPlayerId(p);
        if (pid === undefined) continue;
        if (!State.players.autoReadyByPid[pid]) continue;
        if (applyAutoReadyForPid(p, pid)) anyChanged = true;
    }

    if (!anyChanged) return;

    updatePlayersReadyHudTextForAllPlayers();
    renderReadyDialogForAllVisibleViewers();
    tryAutoStartRoundIfAllReady();
}

//#endregion -------------------- Ready Dialog - Auto-Ready --------------------



//#region -------------------- Ready Dialog - Active Player Resolution + Roster --------------------

// Returns true when every active player on Team 1/2 is currently READY.

// -----------------------------------------------------------------------------
// Active Player Resolution
// -----------------------------------------------------------------------------
// Single source of truth for who counts as an "active" player across:
//   - roster population (Ready Up UI)
//   - all-ready checks / auto-start gating
//   - any future round gating logic
//
// Definition (low-risk, conservative):
//   - Must be present in mod.AllPlayers() (avoids stale/disconnected pids)
//   - Must be valid (mod.IsPlayerValid)
//   - Must be assigned to TeamID.Team1 or TeamID.Team2 (spectators/neutral excluded)
//
// Note: We intentionally do NOT filter by "deployed" state here. Some APIs expose deployment state,
// but this codebase does not currently have a typed/portable check. Treating undeployed teammates as
// active is safer for readiness gating and avoids edge-case mismatches during team switching.
type ActivePlayers_t = {
    all: mod.Player[];
    team1: mod.Player[];
    team2: mod.Player[];
};

type RosterDisplayEntry = {
    player?: mod.Player;
    nameKey?: number;
};

type RosterDisplay_t = {
    team1: RosterDisplayEntry[];
    team2: RosterDisplayEntry[];
    maxRows: number;
};

/**
 * Active-player definition (single source of truth).
 * Used by: roster population, all-ready checks, round start gating, and the HUD ready-count line.
 * Notes: excludes undeployed/neutral/stale players by reading current engine team state each call; do not cache long-term.
 */
function getActivePlayers(): ActivePlayers_t {
    const all: mod.Player[] = [];
    const team1: mod.Player[] = [];
    const team2: mod.Player[] = [];
    const pidByPlayer = new Map<mod.Player, number>();

    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        let pid: number;
        try {
            pid = mod.GetObjId(p);
        } catch {
            continue;
        }
        const teamNum = getTeamNumber(mod.GetTeam(p));
        // Only Team 1/2 are considered active for rosters/ready gating.
        if (teamNum !== TeamID.Team1 && teamNum !== TeamID.Team2) continue;

        pidByPlayer.set(p, pid);
        all.push(p);
        if (teamNum === TeamID.Team1) team1.push(p);
        else team2.push(p);
    }

    // Stable UI ordering: sort by pid (object id).
    // This prevents rows from shuffling across refreshes.
    const byPidCached = (a: mod.Player, b: mod.Player) => (pidByPlayer.get(a) ?? 0) - (pidByPlayer.get(b) ?? 0);
    all.sort(byPidCached);
    team1.sort(byPidCached);
    team2.sort(byPidCached);

    return { all, team1, team2 };
}

function buildRosterDisplayEntries(players: mod.Player[], debugCount: number): RosterDisplayEntry[] {
    const entries: RosterDisplayEntry[] = [];
    for (const p of players) entries.push({ player: p });

    const extraCount = Math.max(0, Math.floor(debugCount));
    for (let i = 0; i < extraCount; i++) {
        entries.push({ nameKey: DEBUG_TEST_PLACEHOLDER_NAME_KEY });
    }
    return entries;
}

function getRosterDisplayEntries(): RosterDisplay_t {
    const active = getActivePlayers();
    const team1 = buildRosterDisplayEntries(active.team1, DEBUG_TEST_NAMES_TEAM_1);
    const team2 = buildRosterDisplayEntries(active.team2, DEBUG_TEST_NAMES_TEAM_2);
    return { team1, team2, maxRows: Math.max(team1.length, team2.length) };
}

function getRosterEntryNameMessage(entry: RosterDisplayEntry | undefined): mod.Message {
    if (!entry) return mod.Message(mod.stringkeys.twl.system.genericCounter, "");
    // Delegate to getUiSafePlayerMessage which guards against stale Player refs.
    // Conquest port (roster-active.ts:100 + id-helpers.ts:152) for the "Received undefined
    // values as arguments" engine error during roster rebuild races (Conquest #94 family).
    if (entry.player) return getUiSafePlayerMessage(entry.player);
    if (entry.nameKey) return mod.Message(entry.nameKey);
    return mod.Message(mod.stringkeys.twl.system.genericCounter, "");
}

function areAllActivePlayersReady(): boolean {
    const active = getActivePlayers();
    const activeCount = active.all.length;
    const requiredTotalPlayers = getAutoStartMinPlayerCounts().total;
    if (activeCount < requiredTotalPlayers) {
        if (activeCount !== 0) return false;

        // Fallback: if no Team 1/2 players are assigned yet (team 0 pre-deploy),
        // allow the ready check to use all valid players.
        const players = mod.AllPlayers();
        const count = mod.CountOf(players);
        let validCount = 0;
        for (let i = 0; i < count; i++) {
            const p = mod.ValueInArray(players, i) as mod.Player;
            if (!p || !mod.IsPlayerValid(p)) continue;
            const pid = safeGetPlayerId(p);
            if (pid === undefined) continue;
            if (!State.players.readyByPid[pid]) return false;
            validCount++;
        }
        return validCount >= requiredTotalPlayers;
    }

    for (const p of active.all) {
        const pid = safeGetPlayerId(p);
        if (pid === undefined) continue;
        if (!State.players.readyByPid[pid]) return false;
    }
    return true;
}

//#endregion -------------------- Ready Dialog - Active Player Resolution + Roster --------------------



//#region -------------------- Ready Dialog - Pregame Countdown UI --------------------

// Implements a synchronized pre-round 10-1-GO! countdown that starts the round on GO.
interface CountdownWidgetCacheEntry {
    rootName: string;
    widget?: mod.UIWidget;
}

function ensureCountdownUIAndGetWidget(player: mod.Player): mod.UIWidget | undefined {
    if (!player || !mod.IsPlayerValid(player)) return undefined;
    const pid = mod.GetObjId(player);
    const rootName = "PregameCountdownText_" + pid;

    const cached = State.hudCache.countdownWidgetCache[pid];
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
        position: [0, 0],
        size: [320, 140],
        anchor: mod.UIAnchor.Center,
        visible: false,
        padding: 0,
        bgColor: [0, 0, 0],
        bgAlpha: 0,
        bgFill: mod.UIBgFill.Solid,
        textLabel: mod.Message(mod.stringkeys.twl.countdown.format, PREGAME_COUNTDOWN_START_NUMBER),
        textColor: [1, 1, 1],
        textAlpha: PREGAME_ALERT_TEXT_ALPHA,
        textSize: PREGAME_COUNTDOWN_SIZE_DIGIT_START,
        textAnchor: mod.UIAnchor.Center,
    });

    const widget = safeFind(rootName);
    State.hudCache.countdownWidgetCache[pid] = { rootName, widget };
    return widget;
}

function setPregameCountdownVisualForAllPlayers(
    labelKey: number,
    labelValue: number | undefined,
    color: mod.Vector,
    size: number,
    visible: boolean
): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const w = ensureCountdownUIAndGetWidget(p);
        if (!w) continue;

        mod.SetUIWidgetVisible(w, visible);
        if (visible) {
            const message = (labelValue !== undefined)
                ? mod.Message(labelKey, labelValue)
                : mod.Message(labelKey);
            safeSetUITextLabel(w, message);
            mod.SetUITextColor(w, color);
            mod.SetUITextSize(w, size);
        }
    }
}

function setPregameCountdownSizeForAllPlayers(size: number): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const w = ensureCountdownUIAndGetWidget(p);
        if (!w) continue;
        mod.SetUITextSize(w, size);
    }
}

function hidePregameCountdownForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const w = ensureCountdownUIAndGetWidget(p);
        if (!w) continue;
        mod.SetUIWidgetVisible(w, false);
    }
}

//#endregion -------------------- Ready Dialog - Pregame Countdown UI --------------------



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
        textLabel: mod.Message(mod.stringkeys.twl.overLine.title, safePlayerArg(player)),
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
        // overLine.subtitle has no {0} placeholder; drop the extra arg.
        textLabel: mod.Message(mod.stringkeys.twl.overLine.subtitle),
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
        textLabel: mod.Message(mod.stringkeys.twl.overLine.title, safePlayerArg(player)),
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
        // overLine.subtitle has no {0} placeholder; drop the extra arg.
        textLabel: mod.Message(mod.stringkeys.twl.overLine.subtitle),
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

async function showOverLineMessageForAllPlayers(offender: mod.Player): Promise<void> {
    const offenderToken = (offender && mod.IsPlayerValid(offender))
        ? offender
        : mod.stringkeys.twl.system.unknownPlayer;
    await showGlobalTitleSubtitleMessageForAllPlayers(
        mod.Message(mod.stringkeys.twl.overLine.title, offenderToken),
        mod.Message(mod.stringkeys.twl.overLine.subtitle, offenderToken),
        COLOR_NOT_READY_RED,
        COLOR_WARNING_YELLOW
    );
}

type BigMessageBuilder = (remainingSeconds: number) => mod.Message | undefined;
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
                safeSetUITextLabel(titleShadowWidget, title);
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
                safeSetUITextLabel(titleWidget, title);
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
                safeSetUITextLabel(subtitleShadowWidget, subtitle);
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
                safeSetUITextLabel(subtitleWidget, subtitle);
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

async function showDynamicGlobalTitleSubtitleMessageForAllPlayers(
    titleBuilder: BigMessageBuilder | undefined,
    subtitleBuilder: BigMessageBuilder | undefined,
    titleColor: mod.Vector,
    subtitleColor: mod.Vector,
    durationSeconds: number = BIG_MESSAGE_DURATION_SECONDS,
    refreshIntervalSeconds: number = 1,
    layout: GlobalMessageLayout = BIG_MESSAGE_LAYOUT,
    playerFilter?: BigMessagePlayerFilter
): Promise<void> {
    State.round.countdown.overLineMessageToken = (State.round.countdown.overLineMessageToken + 1) % 1000000000;
    const expectedToken = State.round.countdown.overLineMessageToken;
    const endAtSeconds = mod.GetMatchTimeElapsed() + Math.max(0, durationSeconds);
    let lastRemainingSeconds = -1;

    while (true) {
        if (expectedToken !== State.round.countdown.overLineMessageToken) return;

        const remainingSeconds = Math.floor(getRemainingSeconds());
        if (remainingSeconds !== lastRemainingSeconds) {
            lastRemainingSeconds = remainingSeconds;
            const title = titleBuilder ? titleBuilder(remainingSeconds) : undefined;
            const subtitle = subtitleBuilder ? subtitleBuilder(remainingSeconds) : undefined;
            if (title || subtitle) {
                renderBigTitleSubtitleMessageForAllPlayers(title, subtitle, titleColor, subtitleColor, layout, playerFilter);
            }
        }

        const remainingDuration = endAtSeconds - mod.GetMatchTimeElapsed();
        if (remainingDuration <= 0) break;
        await mod.Wait(Math.min(refreshIntervalSeconds, remainingDuration));
    }

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



//#region -------------------- Ready Dialog - Pregame Countdown Flow --------------------

function startPregameCountdown(triggerPlayer?: mod.Player, force?: boolean): void {
    if (State.round.countdown.isActive) return;
    if (State.match.isEnded || isRoundLive()) return;
    if (!force && !areAllActivePlayersReady()) return;

    closeReadyDialogForAllPlayers();
    State.round.countdown.isActive = true;
    State.round.countdown.isRequested = true;
    State.round.countdown.token++;
    const expectedToken = State.round.countdown.token;

    void runPregameCountdown(expectedToken, triggerPlayer, force === true);
}

function isPregameCountdownStillValid(expectedToken: number, force?: boolean, allowRoundActive?: boolean): boolean {
    if (expectedToken !== State.round.countdown.token) return false;
    if (State.match.isEnded) return false;
    if (!allowRoundActive && isRoundLive()) return false;
    if (!force && !areAllActivePlayersReady()) return false;
    return true;
}

function getPregameCountdownColor(value: number): mod.Vector {
    return value === 1 ? mod.CreateVector(1, 1, 0) : mod.CreateVector(1, 0, 0);
}

async function animatePregameCountdownSize(
    expectedToken: number,
    force: boolean,
    startSize: number,
    endSize: number,
    allowRoundActive?: boolean
): Promise<boolean> {
    const stepSeconds = PREGAME_COUNTDOWN_STEP_SECONDS / PREGAME_COUNTDOWN_ANIMATION_STEPS;
    for (let i = 1; i <= PREGAME_COUNTDOWN_ANIMATION_STEPS; i++) {
        await mod.Wait(stepSeconds);
        if (!isPregameCountdownStillValid(expectedToken, force, allowRoundActive)) return false;
        const t = i / PREGAME_COUNTDOWN_ANIMATION_STEPS;
        const size = Math.max(1, Math.floor(startSize + (endSize - startSize) * t));
        setPregameCountdownSizeForAllPlayers(size);
    }
    return true;
}

async function runPregameCountdown(expectedToken: number, triggerPlayer?: mod.Player, force?: boolean): Promise<void> {
    await mod.Wait(PREGAME_COUNTDOWN_INITIAL_DELAY_SECONDS);

    if (!isPregameCountdownStillValid(expectedToken, force)) {
        State.round.countdown.isActive = false;
        hidePregameCountdownForAllPlayers();
        return;
    }

    for (let value = PREGAME_COUNTDOWN_START_NUMBER; value >= 1; value--) {
        if (!isPregameCountdownStillValid(expectedToken, force)) {
            State.round.countdown.isActive = false;
            hidePregameCountdownForAllPlayers();
            return;
        }

        if (value === 4) {
            // Start the round-start messaging so it ends with the GO! hide.
            const remainingSeconds = ((value + 1) * PREGAME_COUNTDOWN_STEP_SECONDS) + PREGAME_COUNTDOWN_GO_HOLD_SECONDS;
            void showRoundStartMessageForAllPlayers(remainingSeconds);
        }

        setPregameCountdownVisualForAllPlayers(
            mod.stringkeys.twl.countdown.format,
            value,
            getPregameCountdownColor(value),
            PREGAME_COUNTDOWN_SIZE_DIGIT_START,
            true
        );

        const ok = await animatePregameCountdownSize(
            expectedToken,
            force === true,
            PREGAME_COUNTDOWN_SIZE_DIGIT_START,
            PREGAME_COUNTDOWN_SIZE_DIGIT_END
        );
        if (!ok) {
            State.round.countdown.isActive = false;
            hidePregameCountdownForAllPlayers();
            return;
        }
    }

    if (!isPregameCountdownStillValid(expectedToken, force)) {
        State.round.countdown.isActive = false;
        hidePregameCountdownForAllPlayers();
        return;
    }

    setPregameCountdownVisualForAllPlayers(
        mod.stringkeys.twl.countdown.go,
        undefined,
        mod.CreateVector(0, 1, 0),
        PREGAME_COUNTDOWN_SIZE_GO_START,
        true
    );
    startRound(triggerPlayer);

    const ok = await animatePregameCountdownSize(
        expectedToken,
        force === true,
        PREGAME_COUNTDOWN_SIZE_GO_START,
        PREGAME_COUNTDOWN_SIZE_GO_END,
        true
    );
    if (!ok || expectedToken !== State.round.countdown.token) {
        // If the animation aborted, hide immediately to avoid a stuck GO.
        if (expectedToken === State.round.countdown.token) {
            hidePregameCountdownForAllPlayers();
            State.round.countdown.isActive = false;
        }
        return;
    }

    // Keep GO visible for a short hold to finish the visual beat (unpredictable repro issues).
    if (State.match.isEnded) {
        hidePregameCountdownForAllPlayers();
        State.round.countdown.isActive = false;
        return;
    }

    await mod.Wait(PREGAME_COUNTDOWN_GO_HOLD_SECONDS);
    if (expectedToken !== State.round.countdown.token) return;

    hidePregameCountdownForAllPlayers();
    State.round.countdown.isActive = false;

    await mod.Wait(1);
}

//#endregion -------------------- Ready Dialog - Pregame Countdown Flow --------------------



//#region -------------------- Ready Dialog - Auto-Start --------------------

// Starts the round as soon as all active players are READY.
// Notes:
// - Only triggers when round is NOT active and match is NOT ended.
// - Uses the existing startRound() flow; we do not bypass or reimplement round init logic.
function tryAutoStartRoundIfAllReady(triggerPlayer?: mod.Player): void {
    if (State.match.isEnded || isRoundLive()) return;
    if (!areAllActivePlayersReady()) return;
    // All players ready: start the round using the existing function.
    startPregameCountdown(triggerPlayer); //old: startRound(triggerPlayer);
}

//#endregion -------------------- Ready Dialog - Auto-Start --------------------



//#region -------------------- Ready Dialog - Swap Teams Button (single toggle) --------------------

// Swaps the given player between Team 1 and Team 2. This reuses the existing team-assignment APIs,
// but exposes them as a single toggle button rather than separate Team 1 / Team 2 buttons.
function swapPlayerTeam(eventPlayer: mod.Player): void {
    // Swap Teams button:: single-button team toggle (Team 1 <-> Team 2).
    // - Apply the team assignment change
    // - Undeploy (forces redeploy) so the player actually respawns on the new team
    // - Close the dialog and broadcast the team-switch message
    // We achieve that by reusing the retained processTeamSwitch() pathway.
    const pid = mod.GetObjId(eventPlayer);
    // Swapping teams must always force the player back to NOT READY.
    // This prevents a player from carrying READY status across team assignment changes.
    State.players.readyByPid[pid] = false;
    // Keep the HUD "X / Y PLAYERS READY" line in sync on every ready-state change.
    updatePlayersReadyHudTextForAllPlayers();
    updateHelpTextVisibilityForPid(pid);

    processTeamSwitch(eventPlayer);

    // If other viewers have the ready dialog open, refresh their rosters so this player moves columns immediately.
    renderReadyDialogForAllVisibleViewers();
}

//#endregion ----------------- Ready Dialog - Swap Teams Button (single toggle) --------------------
