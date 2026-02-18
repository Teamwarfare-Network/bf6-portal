// @ts-nocheck
// Module: hud/help-visibility -- ready-dialog visibility and top-center help/ready text visibility

//#region -------------------- HUD Build/Ensure - Dialog Open + Help Text Visibility --------------------

function isReadyDialogOpenForPid(pid: number): boolean {
    // With UI caching, the dialog root widget may continue to exist while hidden.
    // Use the explicit per-player state flag as the source of truth for "open".
    return !!State.players.readyDialogData[pid]?.dialogVisible;
}

/**
 * Applies the current 'help text' visibility rules to one specific player id.
 * This is intentionally pid-based (not Player-based) so it can be used during join/leave and UI rebuilds.
 * Keep in mind:
 * - The player may not be present at the time of the call; this function should tolerate missing UI refs.
 * - Visibility rules typically depend on per-player flags (e.g., 'dont show again') and current phase state.
 */
function updateHelpTextVisibilityForPid(pid: number): void {
    const refs = State.hudCache.hudByPid[pid];
    if (!refs) return;

    const isDialogOpen = isReadyDialogOpenForPid(pid);
    const isReady = !!State.players.readyByPid[pid];
    const isDeployed = !!State.players.deployedByPid[pid];
    const canShow = (!State.match.isEnded)
        && (!State.match.victoryDialogActive)
        && (!State.round.flow.cleanupActive)
        && (isDeployed);
    const showHelp = canShow && (!isMatchLive()) && (!isReady) && (!isDialogOpen);
    const showReady = canShow && (!isMatchLive()) && (isReady) && (!isDialogOpen);

    const helpContainer = refs.helpTextContainer ?? safeFind(`Container_HelpText_${pid}`);
    if (helpContainer) {
        safeSetUIWidgetVisible(helpContainer, showHelp);
    }

    const helpText = safeFind(`HelpText_${pid}`);
    if (helpText) {
        mod.SetUITextLabel(helpText, mod.Message(mod.stringkeys.twl.hud.helpText));
    }

    const readyContainer = refs.readyStatusContainer ?? safeFind(`Container_ReadyStatus_${pid}`);
    if (readyContainer) {
        safeSetUIWidgetVisible(readyContainer, showReady);
    }

    const readyText = safeFind(`ReadyStatusText_${pid}`);
    if (readyText) {
        mod.SetUITextLabel(readyText, mod.Message(mod.stringkeys.twl.hud.readyText));
    }
}

function updateHelpTextVisibilityForPlayer(player: mod.Player): void {
    updateHelpTextVisibilityForPid(mod.GetObjId(player));
}

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
