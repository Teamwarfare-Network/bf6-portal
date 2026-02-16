// @ts-nocheck
// Module: hud/update-helpers -- HUD state sync helpers and admin action count

//#region -------------------- HUD Update Helpers --------------------

function setHudRoundCountersForAllPlayers(cur: number, max: number): void {
    // Sets legacy round metadata values and syncs HUD + Ready Dialog "Best of" readouts.
    State.round.current = Math.max(1, Math.floor(cur));
    State.round.max = Math.max(1, Math.floor(max));
    if (State.round.max < State.round.current) {
        State.round.max = State.round.current;
    }

    setRoundStateTextForAllPlayers();
    // Keep Ready Dialog "Best of" label in sync with State.round.max.
    updateBestOfRoundsLabelForAllPlayers();
}

function setHudWinCountersForAllPlayers(t1Wins: number, t2Wins: number): void {
    // Updates compatibility win counters in script state and GameModeScore, then refreshes HUD.
    const lw = Math.max(0, Math.floor(t1Wins));
    const rw = Math.max(0, Math.floor(t2Wins));

    // Script state is authoritative; GameModeScore is mirrored for scoreboard compatibility.
    setMatchWinsTeam(TeamID.Team1, lw);
    setMatchWinsTeam(TeamID.Team2, rw);

    // Cache locally for immediate UI + logic.
    State.match.winsT1 = lw;
    State.match.winsT2 = rw;

    syncRoundRecordHudForAllPlayers();
}

function syncRoundRecordHudForAllPlayers(): void {
    // Derives compatibility loss counters from win counters for HUD readouts.
    State.match.lossesT1 = State.match.winsT2;
    State.match.lossesT2 = State.match.winsT1;
}

function updateAdminPanelActionCountForAllPlayers(): void {
    // Pushes the admin action count to every player's HUD widget.
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const refs = ensureHudForPlayer(p);
        if (!refs) continue;
        setAdminPanelActionCountText(refs.adminPanelActionCountText, State.admin.actionCount);
    }
}

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
