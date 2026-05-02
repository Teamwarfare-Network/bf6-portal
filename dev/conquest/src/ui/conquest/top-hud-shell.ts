// @ts-nocheck
// Module: ui/conquest/top-hud-shell -- dedicated non-combat top HUD shell ensure/cache owner

type ConquestTopHudShellLayout = {
    helpContainerX: number;
    helpContainerY: number;
    helpContainerWidth: number;
    helpContainerHeight: number;
    helpText3OffsetY: number;
    helpText3Height: number;
    helpTextOffsetY: number;
    helpTextHeight: number;
    helpText2OffsetY: number;
    helpText2Height: number;
    readyContainerX: number;
    readyContainerY: number;
    readyContainerWidth: number;
    readyContainerHeight: number;
    readyTextOffsetY: number;
    readyTextHeight: number;
};

const CONQUEST_TOP_HUD_SHELL_LAYOUT: ConquestTopHudShellLayout = {
    helpContainerX: -223.60,
    helpContainerY: 81.10,
    helpContainerWidth: 561.77,
    helpContainerHeight: 38.31,
    helpText3OffsetY: -2,
    helpText3Height: 18,
    helpTextOffsetY: 10,
    helpTextHeight: 18,
    helpText2OffsetY: 22,
    helpText2Height: 18,
    readyContainerX: -905.00,
    readyContainerY: 81.10 + CONQUEST_HUD_NON_CLOCK_SHIFT_Y,
    readyContainerWidth: 200.0,
    readyContainerHeight: 20.0,
    readyTextOffsetY: 1,
    readyTextHeight: 18,
};

// HUD Team Swap Button layout (pre-game only, to right of red team name label).
const TWL_HUD_TEAM_SWAP_BUTTON_WIDTH = 210;
const TWL_HUD_TEAM_SWAP_BUTTON_HEIGHT = 32;
const TWL_HUD_TEAM_SWAP_BUTTON_GAP_X = 3;
const TWL_HUD_TEAM_SWAP_BUTTON_TEXT_SIZE = 16;

// Deletes all widgets with one specific name so shell rebuilds cannot accumulate duplicate roots.
function deleteAllTopHudShellWidgetsByName(name: string, maxPasses: number = 128): void {
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

// Returns the active top-HUD shell refs for one player from the dedicated shell cache only.
function getTopHudShellRefsForPid(pid: number): TopHudShellRefs | undefined {
    return State.hudCache.topHudShellByPid[pid];
}

// Rebinds the shell-owned widget refs from authoritative widget names so cached handles stay current after cleanup/rejoin.
function bindTopHudShellRefsByName(pid: number, refs: TopHudShellRefs): void {
    refs.topHudRoot = safeFind(wn("TopHudRoot", pid));
    refs.upperLeftContainer = safeFind(wn("Upper_Left_Container", pid));
    refs.upperLeftStatusContainer = safeFind(wn("TwlConquestStatusDockRoot", pid));
    refs.upperLeftStatusStateText = safeFind(wn("TwlConquestStatusDockState", pid));
    refs.upperLeftStatusReadyText = safeFind(wn("TwlConquestStatusDockReady", pid));
    refs.topCenterAuxRoot = safeFind(wn("ConquestTopCenterAuxRoot", pid));
    refs.helpTextContainer = safeFind(wn("Container_HelpText", pid));
    refs.adminPanelActionCountText = safeFind(wn("AdminPanelActionCount", pid));
    bindVictoryDialogRefsByName(pid, refs);
}

// Reports whether the dedicated top-HUD shell has the minimum refs required for the always-visible top-left/top-center family.
function hasTopLeftHudShellRefs(refs: TopHudShellRefs | undefined): boolean {
    if (!refs) return false;
    return !!(
        refs.topHudRoot
        && refs.upperLeftContainer
        && refs.upperLeftStatusContainer
        && refs.upperLeftStatusStateText
        && refs.upperLeftStatusReadyText
        && refs.topCenterAuxRoot
        && refs.helpTextContainer
    );
}

// Full shell completeness includes non-critical admin/victory helpers that should not block core top-left readiness.
function hasCriticalTopHudShellRefs(refs: TopHudShellRefs | undefined): boolean {
    if (!refs) return false;
    return !!(
        hasTopLeftHudShellRefs(refs)
        && refs.adminPanelActionCountText
        && refs.victoryRoot
    );
}

// Removes shell-only widgets before a deterministic shell rebuild without touching combat HUD ownership.
function purgeTopHudShellArtifactsForPid(pid: number): void {
    deleteAllTopHudShellWidgetsByName(wn("AdminPanelActionCount", pid));
    deleteAllTopHudShellWidgetsByName(wn("VictoryDialogRoot", pid));
    deleteHudTeamSwapWidgetsForPid(pid);
}

// Builds the pre-game team swap button to the right of the red team name label.
function buildHudTeamSwapButton(player: mod.Player, pid: number, refs: TopHudShellRefs): void {
    const topHudRoot = refs.topHudRoot;
    if (!topHudRoot) return;

    const buttonId = UI_HUD_TEAM_SWAP_BUTTON_ID + pid;
    const labelId = UI_HUD_TEAM_SWAP_LABEL_ID + pid;

    deleteAllTopHudShellWidgetsByName(buttonId);
    deleteAllTopHudShellWidgetsByName(buttonId + "_BORDER");
    deleteAllTopHudShellWidgetsByName(labelId);

    const ticketLayout = twlConquestHudBuildTicketLayout();
    const redLabelCenterX = twlConquestHudGetTicketRedTeamLabelRootX(ticketLayout);
    const posX = redLabelCenterX
        + (TWL_CONQUEST_HUD_TICKET_TEAM_LABEL_WIDTH / 2)
        + TWL_HUD_TEAM_SWAP_BUTTON_GAP_X
        + (TWL_HUD_TEAM_SWAP_BUTTON_WIDTH / 2);
    const posY = TWL_CONQUEST_HUD_TICKET_TEAM_LABEL_ROOT_Y
        + (TWL_CONQUEST_HUD_TICKET_TEAM_LABEL_HEIGHT - TWL_HUD_TEAM_SWAP_BUTTON_HEIGHT) / 2;

    const teamNum = safeGetTeamNumberFromPlayer(player, 0);
    const oppositeTeam = teamNum === TeamID.Team1 ? TeamID.Team2 : TeamID.Team1;

    const border = addOutlinedButton(
        buttonId,
        posX,
        posY,
        TWL_HUD_TEAM_SWAP_BUTTON_WIDTH,
        TWL_HUD_TEAM_SWAP_BUTTON_HEIGHT,
        mod.UIAnchor.TopCenter,
        topHudRoot,
        player
    );

    const label = msg(mod.stringkeys.twl.teamSwitch.changeTeamToFormat, getTeamNameKey(oppositeTeam));
    addCenteredButtonText(
        labelId,
        TWL_HUD_TEAM_SWAP_BUTTON_WIDTH,
        TWL_HUD_TEAM_SWAP_BUTTON_HEIGHT,
        label,
        player,
        border ?? topHudRoot,
        TWL_HUD_TEAM_SWAP_BUTTON_TEXT_SIZE
    );

    refs.teamSwapBorder = border ?? undefined;
    refs.teamSwapLabel = safeFind(labelId) ?? undefined;

    const visible = !isMatchLive() && State.conquest.lifecyclePhase !== "COUNTDOWN" && !State.players.deployedByPid[pid];
    safeSetUIWidgetVisible(refs.teamSwapBorder, visible);
}

// Rebinds team swap button refs from authoritative widget names.
function bindHudTeamSwapRefsByName(pid: number, refs: TopHudShellRefs): void {
    refs.teamSwapBorder = safeFind(UI_HUD_TEAM_SWAP_BUTTON_ID + pid + "_BORDER") ?? undefined;
    refs.teamSwapLabel = safeFind(UI_HUD_TEAM_SWAP_LABEL_ID + pid) ?? undefined;
}

// Deletes team swap button widgets for one player during shell purge.
function deleteHudTeamSwapWidgetsForPid(pid: number): void {
    deleteAllTopHudShellWidgetsByName(UI_HUD_TEAM_SWAP_BUTTON_ID + pid);
    deleteAllTopHudShellWidgetsByName(UI_HUD_TEAM_SWAP_BUTTON_ID + pid + "_BORDER");
    deleteAllTopHudShellWidgetsByName(UI_HUD_TEAM_SWAP_LABEL_ID + pid);
}

// Shows or hides the HUD team swap button for one player based on match state.
function updateHudTeamSwapButtonVisibilityForPid(pid: number): void {
    const refs = State.hudCache.topHudShellByPid[pid];
    if (!refs) return;
    const visible = !isMatchLive() && State.conquest.lifecyclePhase !== "COUNTDOWN" && !State.players.deployedByPid[pid];
    safeSetUIWidgetVisible(refs.teamSwapBorder, visible);
}

// Updates team swap button visibility for all active players.
function updateHudTeamSwapButtonVisibilityForAllPlayers(): void {
    forEachValidPlayer((_player, pid) => updateHudTeamSwapButtonVisibilityForPid(pid));
}

// Ensures the non-combat top-HUD shell exists for one player on the active hard-cut shell path.
function ensureTopHudShellForPlayer(player: mod.Player): TopHudShellRefs | undefined {
    if (!isValidPlayer(player)) return undefined;

    const pid = getObjId(player);

    const cached = State.hudCache.topHudShellByPid[pid];
    if (cached) {
        bindTopHudShellRefsByName(pid, cached);
        bindHudTeamSwapRefsByName(pid, cached);
        if (hasTopLeftHudShellRefs(cached)) {
            if (FEATURE_ADMIN_PANEL && !cached.adminPanelActionCountText) buildConquestAdminActionCounterWidget(player, pid, cached);
            if (!cached.teamSwapBorder) buildHudTeamSwapButton(player, pid, cached);
            bindTopHudShellRefsByName(pid, cached);
            bindHudTeamSwapRefsByName(pid, cached);
            State.hudCache.topHudShellByPid[pid] = cached;
            setHudHelpDepthForPid(pid);
            return cached;
        }
        delete State.hudCache.topHudShellByPid[pid];
    }

    purgeTopHudShellArtifactsForPid(pid);

    const refs: TopHudShellRefs = { pid, roots: [] };
    refs.topHudRoot = ensureTopHudRootForPid(pid, player);
    ensureClockUIAndGetCache(player);

    buildConquestBrandingTopLeftWidgets(player, pid, refs);
    buildConquestStaticStatusLaneWidgets(player, pid, refs);
    buildConquestTopCenterAuxWidgets(player, pid, refs, CONQUEST_TOP_HUD_SHELL_LAYOUT);
    if (FEATURE_ADMIN_PANEL) buildConquestAdminActionCounterWidget(player, pid, refs);
    buildVictoryDialogWidgets(player, pid, refs);
    buildHudTeamSwapButton(player, pid, refs);
    bindTopHudShellRefsByName(pid, refs);
    bindHudTeamSwapRefsByName(pid, refs);

    State.conquest.debug.hudGenerationByPid[pid] = (State.conquest.debug.hudGenerationByPid[pid] ?? 0) + 1;
    State.hudCache.topHudShellByPid[pid] = refs;

    if (FEATURE_ADMIN_PANEL) setAdminPanelActionCountText(refs.adminPanelActionCountText, State.admin.actionCount);
    setMatchStateTextForPid(pid);
    markPregameReadyHudDirty();
    setHudHelpDepthForPid(pid);
    updateVictoryDialogForPlayer(player, getRemainingSeconds());

    return refs;
}

