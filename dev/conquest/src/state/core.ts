// @ts-nocheck
// Module: state/core -- gameplay state helpers and world-log messaging gates

//#region -------------------- Core gameplay state helpers --------------------

// Core gameplay helper utilities (state sync + messaging gates).

function getMatchWinsTeam(teamNum: TeamID): number {
    // Debug-only: engine GameModeScore can be transient during reconnects / team swaps.
    return Math.floor(mod.GetGameModeScore(mod.GetTeam(teamNum)));
}

function setMatchWinsTeam(teamNum: TeamID, wins: number): void {
    mod.SetGameModeScore(mod.GetTeam(teamNum), Math.max(0, Math.floor(wins)));
}

// Central message-gating policy: gameplay vs debug, and highlighted vs notification.
function shouldSendMessage(isGameplay: boolean, isHighlighted: boolean): boolean {
    if (isGameplay) return ENABLE_GAMEPLAY_MESSAGES;
    return isHighlighted ? ENABLE_DEBUG_HIGHLIGHTED_MESSAGES : ENABLE_DEBUG_NOTIFICATION_MESSAGES;
}

function setUIInputModeForPlayer(player: mod.Player, enabled: boolean): void {
    if (!player || !mod.IsPlayerValid(player)) return;
    mod.EnableUIInputMode(enabled, player);
    State.players.uiInputEnabledByPid[mod.GetObjId(player)] = enabled;
}

function noteHighlightedMessageSent(messageKey?: number): void {
    State.debug.highlightedMessageCount = State.debug.highlightedMessageCount + 1;
    State.debug.lastHighlightedMessageAtSeconds = Math.floor(mod.GetMatchTimeElapsed());
    if (messageKey !== undefined) {
        State.debug.lastHighlightedMessageKey = messageKey;
    }
}

// Phase helper for readability (avoids scattered enum comparisons).
function isRoundLive(): boolean {
    return State.round.phase === RoundPhase.Live;
}

// Returns true if the given team currently has at least one valid player.
function hasPlayersOnTeam(team: mod.Team): boolean {
    if (mod.Equals(team, mod.GetTeam(0))) return false;
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        if (mod.Equals(mod.GetTeam(p), team)) return true;
    }
    return false;
}

// World-log wrapper; respects gameplay/debug gates and optional target.
function sendHighlightedWorldLogMessage(message: mod.Message, isGameplay: boolean, target?: mod.Player | mod.Team, debugKey?: number): void {
    if (!shouldSendMessage(isGameplay, true)) return;
    noteHighlightedMessageSent(debugKey);
    if (target) {
        // Route to the correct overload; Team cast-as-Player can silently drop messages after team switches.
        if (mod.IsType(target, mod.Types.Team)) {
            const teamTarget = target as mod.Team;
            if (!hasPlayersOnTeam(teamTarget)) return;
            mod.DisplayHighlightedWorldLogMessage(message, teamTarget);
            return;
        }
        if (mod.IsType(target, mod.Types.Player)) {
            const playerTarget = target as mod.Player;
            if (!playerTarget || !mod.IsPlayerValid(playerTarget)) return;
            mod.DisplayHighlightedWorldLogMessage(message, playerTarget);
            return;
        }
        return;
    }
    mod.DisplayHighlightedWorldLogMessage(message);
}


// Synchronizes HUD win counters from authoritative match state.
// This should be called after any admin or gameplay mutation of State.match.winsT1/T2.
function syncWinCountersHudFromGameModeScore(): void {
    // Debug-only: do not use for authoritative state; pulling from engine here can latch transient values.
    const t1Wins = getMatchWinsTeam(TeamID.Team1);
    const t2Wins = getMatchWinsTeam(TeamID.Team2);

    State.match.winsT1 = t1Wins;
    State.match.winsT2 = t2Wins;
    syncRoundRecordHudForAllPlayers();
    setTrendingWinnerCrownForAllPlayers();

    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const refs = ensureHudForPlayer(p);
        if (!refs) continue;
        setCounterText(refs.leftWinsText, t1Wins);
        setCounterText(refs.rightWinsText, t2Wins);
    }
}

function endGameModeForTeamNum(teamNum: TeamID | 0): void {
    const winningTeam = mod.GetTeam(teamNum);

    // End the match by team consistently; ending "by player" can yield inconsistent engine finalization
    // when players reconnect or briefly join different teams.
    mod.EndGameMode(winningTeam);
}

//#endregion ----------------- Core gameplay state helpers --------------------
