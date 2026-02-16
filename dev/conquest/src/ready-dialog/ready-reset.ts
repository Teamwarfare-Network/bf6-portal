// @ts-nocheck
// Module: ready-dialog/ready-reset -- reset all player ready states between flow transitions

//#region -------------------- Ready Dialog - Ready State Reset --------------------

// Resets all players to NOT READY. Used by mode reset/start-end paths so each live start requires a fresh ready cycle.
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
