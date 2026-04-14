// @ts-nocheck
// Module: hud/help-visibility -- ready-dialog visibility and top-center help/ready text visibility

//#region -------------------- HUD Build/Ensure - Dialog Open + Help Text Visibility --------------------

/**
 * Applies the current 'help text' visibility rules to one specific player id.
 * This is intentionally pid-based (not Player-based) so it can be used during join/leave and UI rebuilds.
 * Keep in mind:
 * - The player may not be present at the time of the call; this function should tolerate missing UI refs.
 * - Visibility rules typically depend on per-player flags (e.g., 'dont show again') and current phase state.
 */
function updateHelpTextVisibilityForPid(pid: number): void {
    const refs = getTopHudShellRefsForPid(pid);
    const warmReady = isHudWarmReadyForPid(pid);

    const visibility = getHudVisibilitySnapshotForPid(pid);
    const showHelp = warmReady && visibility.showHelp;

    const helpContainer = refs?.helpTextContainer ?? safeFind(wn("Container_HelpText", pid));
    if (helpContainer) {
        safeSetUIWidgetVisible(helpContainer, showHelp);
    }

    const helpText = safeFind(wn("HelpText", pid));
    if (helpText) {
        safeSetUIWidgetVisible(helpText, showHelp);
        safeSetUITextLabel(helpText, mod.Message(mod.stringkeys.twl.hud.helpText));
    }

    // Round-state and players-ready line visibility are owned by hud/status.ts.
}

// Player-wrapper for pid-based help/ready visibility refresh.
function updateHelpTextVisibilityForPlayer(player: mod.Player): void {
    updateHelpTextVisibilityForPid(mod.GetObjId(player));
}

// Broadcast refresh for help/ready visibility across all currently valid players.
function updateHelpTextVisibilityForAllPlayers(): void {
    forEachValidPlayer((_player, pid) => updateHelpTextVisibilityForPid(pid));
}

//#endregion ----------------- HUD Build/Ensure - Dialog Open + Help Text Visibility --------------------

