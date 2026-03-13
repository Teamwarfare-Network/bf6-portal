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

    const visibility = getHudVisibilitySnapshotForPid(pid);
    const showHelp = visibility.showHelp;

    const helpContainer = refs?.helpTextContainer ?? safeFind(`Container_HelpText_${pid}`);
    if (helpContainer) {
        safeSetUIWidgetVisible(helpContainer, showHelp);
    }

    const helpText = safeFind(`HelpText_${pid}`);
    if (helpText) {
        mod.SetUITextLabel(helpText, mod.Message(mod.stringkeys.twl.hud.helpText));
    }

    // Round-state and players-ready line visibility are owned by hud/status.ts.
}

// Player-wrapper for pid-based help/ready visibility refresh.
function updateHelpTextVisibilityForPlayer(player: mod.Player): void {
    updateHelpTextVisibilityForPid(mod.GetObjId(player));
}

// Broadcast refresh for help/ready visibility across all currently valid players.
function updateHelpTextVisibilityForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        updateHelpTextVisibilityForPid(mod.GetObjId(p));
    }
}

//#endregion ----------------- HUD Build/Ensure - Dialog Open + Help Text Visibility --------------------
