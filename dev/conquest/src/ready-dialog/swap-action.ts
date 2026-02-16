// @ts-nocheck
// Module: ready-dialog/swap-action -- single-button team swap action handler

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
