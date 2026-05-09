// @ts-nocheck
// Module: hud/update-helpers -- HUD state sync helpers and admin action count

//#region -------------------- HUD Update Helpers --------------------

// v1.492: was an N-player broadcast; now collapses to single-pid update against the
// current admin pid. The action-counter widget only renders on the admin's HUD (gated in
// top-hud-shell.ts), so updating non-admin viewers' refs would write to a non-existent
// widget anyway. Eliminates the per-action N-player broadcast that would compound the
// v1.491 1716ms-frame issue.
function updateAdminPanelActionCountForAllPlayers(): void {
    const adminPid = Admin.getCurrentAdminPid();
    if (adminPid === undefined) return;
    const adminPlayer = safeFindPlayer(adminPid);
    if (!adminPlayer) return;
    const refs = ensureTopHudShellForPlayer(adminPlayer);
    if (!refs) return;
    setAdminPanelActionCountText(refs.adminPanelActionCountText, State.admin.actionCount);
}

// Records one admin action press, updates HUD counters, and emits world-log telemetry.
function handleAdminPanelAction(eventPlayer: mod.Player, actionKey: number): void {
    // Increments the admin action counter and broadcasts the action to the world log.
    State.admin.actionCount = Math.max(0, Math.floor(State.admin.actionCount) + 1);
    updateAdminPanelActionCountForAllPlayers();
    sendHighlightedWorldLogMessage(
        msg(mod.stringkeys.twl.adminPanel.actionPressed, eventPlayer, actionKey),
        true,
        undefined,
        mod.stringkeys.twl.adminPanel.actionPressed
    );
}

//#endregion ----------------- HUD Update Helpers --------------------

