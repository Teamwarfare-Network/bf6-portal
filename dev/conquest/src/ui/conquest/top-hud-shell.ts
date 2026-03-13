// @ts-nocheck
// Module: ui/conquest/top-hud-shell -- dedicated non-combat top HUD shell ensure/cache owner

type ConquestTopHudShellLayout = {
    helpContainerX: number;
    helpContainerY: number;
    helpContainerWidth: number;
    helpContainerHeight: number;
    helpTextOffsetY: number;
    helpTextHeight: number;
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
    helpTextOffsetY: 10,
    helpTextHeight: 18,
    readyContainerX: -905.00,
    readyContainerY: 81.10 + CONQUEST_HUD_NON_CLOCK_SHIFT_Y,
    readyContainerWidth: 200.0,
    readyContainerHeight: 20.0,
    readyTextOffsetY: 1,
    readyTextHeight: 18,
};

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

// Returns the active top-HUD shell refs for one player, preferring the new shell cache with legacy fallback.
function getTopHudShellRefsForPid(pid: number): HudRefs | undefined {
    return State.hudCache.topHudShellByPid[pid] ?? State.hudCache.hudByPid[pid];
}

// Rebinds the shell-owned widget refs from authoritative widget names so cached handles stay current after cleanup/rejoin.
function bindTopHudShellRefsByName(pid: number, refs: HudRefs): void {
    refs.topHudRoot = safeFind(`TopHudRoot_${pid}`);
    refs.upperLeftContainer = safeFind(`Upper_Left_Container_${pid}`);
    refs.upperLeftStatusContainer = safeFind(`TwlConquestStatusDockRoot_${pid}`);
    refs.upperLeftStatusStateText = safeFind(`TwlConquestStatusDockState_${pid}`);
    refs.upperLeftStatusReadyText = safeFind(`TwlConquestStatusDockReady_${pid}`);
    refs.topCenterAuxRoot = safeFind(`ConquestTopCenterAuxRoot_${pid}`);
    refs.helpTextContainer = safeFind(`Container_HelpText_${pid}`);
    refs.adminPanelActionCountText = safeFind(`AdminPanelActionCount_${pid}`);
    bindVictoryDialogRefsByName(pid, refs);
}

// Reports whether the dedicated top-HUD shell has the minimum refs required for non-combat updates.
function hasCriticalTopHudShellRefs(refs: HudRefs | undefined): boolean {
    if (!refs) return false;
    return !!(
        refs.topHudRoot
        && refs.upperLeftContainer
        && refs.upperLeftStatusContainer
        && refs.upperLeftStatusStateText
        && refs.upperLeftStatusReadyText
        && refs.topCenterAuxRoot
        && refs.helpTextContainer
        && refs.adminPanelActionCountText
        && refs.victoryRoot
    );
}

// Removes shell-only widgets before a deterministic shell rebuild without touching combat HUD ownership.
function purgeTopHudShellArtifactsForPid(pid: number): void {
    deleteAllTopHudShellWidgetsByName(`AdminPanelActionCount_${pid}`);
    deleteAllTopHudShellWidgetsByName(`VictoryDialogRoot_${pid}`);
}

// Ensures the non-combat top-HUD shell exists for one player on the active hard-cut shell path.
function ensureTopHudShellForPlayer(player: mod.Player): HudRefs | undefined {
    if (!player || !mod.IsPlayerValid(player)) return undefined;

    const pid = getObjId(player);
    ensureClockUIAndGetCache(player);

    const cached = State.hudCache.topHudShellByPid[pid];
    if (cached) {
        bindTopHudShellRefsByName(pid, cached);
        if (hasCriticalTopHudShellRefs(cached)) {
            State.hudCache.topHudShellByPid[pid] = cached;
            setHudHelpDepthForPid(pid);
            return cached;
        }
        delete State.hudCache.topHudShellByPid[pid];
    }

    purgeTopHudShellArtifactsForPid(pid);

    const refs: HudRefs = { pid, roots: [] };
    refs.topHudRoot = ensureTopHudRootForPid(pid, player);

    buildConquestBrandingTopLeftWidgets(player, pid, refs);
    buildConquestStaticStatusLaneWidgets(player, pid, refs);
    buildConquestTopCenterAuxWidgets(player, pid, refs, CONQUEST_TOP_HUD_SHELL_LAYOUT);
    buildConquestAdminActionCounterWidget(player, pid, refs);
    buildVictoryDialogWidgets(player, pid, refs);
    bindTopHudShellRefsByName(pid, refs);

    State.conquest.debug.hudGenerationByPid[pid] = (State.conquest.debug.hudGenerationByPid[pid] ?? 0) + 1;
    State.hudCache.topHudShellByPid[pid] = refs;

    setAdminPanelActionCountText(refs.adminPanelActionCountText, State.admin.actionCount);
    setMatchStateTextForPid(pid);
    updatePlayersReadyHudTextForAllPlayers();
    setHudHelpDepthForPid(pid);
    updateVictoryDialogForPlayer(player, getRemainingSeconds());

    return refs;
}
