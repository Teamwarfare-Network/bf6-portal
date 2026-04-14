// @ts-nocheck
// Module: hud/update-helpers -- HUD state sync helpers and admin action count

//#region -------------------- HUD Update Helpers --------------------

function updateAdminPanelActionCountForAllPlayers(): void {
    forEachValidPlayer((player) => {
        const refs = ensureTopHudShellForPlayer(player);
        if (!refs) return;
        setAdminPanelActionCountText(refs.adminPanelActionCountText, State.admin.actionCount);
    });
}

// Records one admin action press, updates HUD counters, and emits world-log telemetry.
function handleAdminPanelAction(eventPlayer: mod.Player, actionKey: number): void {
    // Increments the admin action counter and broadcasts the action to the world log.
    State.admin.actionCount = Math.max(0, Math.floor(State.admin.actionCount) + 1);
    updateAdminPanelActionCountForAllPlayers();
    sendHighlightedWorldLogMessage(
        mod.Message(mod.stringkeys.twl.adminPanel.actionPressed, eventPlayer, actionKey),
        true,
        undefined,
        mod.stringkeys.twl.adminPanel.actionPressed
    );
}

//#endregion ----------------- HUD Update Helpers --------------------

