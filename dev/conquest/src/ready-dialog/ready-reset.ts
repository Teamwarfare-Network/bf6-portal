// @ts-nocheck
// Module: ready-dialog/ready-reset -- reset all player ready states between flow transitions

//#region -------------------- Ready Dialog - Ready State Reset --------------------

// Resets all players to NOT READY. Used by mode reset/start-end paths so each live start requires a fresh ready cycle.
function resetReadyStateForAllPlayers(): void {
    forEachValidPlayer((_player, pid) => {
        State.players.readyByPid[pid] = false;
        delete State.players.readyNeedsReconfirmByPid[pid];
    });
    // If any dialogs are open, reflect the reset immediately.
    renderReadyDialogForAllVisibleViewers();
    updatePlayersReadyHudTextForAllPlayers();
}

//#endregion -------------------- Ready Dialog - Ready State Reset --------------------

