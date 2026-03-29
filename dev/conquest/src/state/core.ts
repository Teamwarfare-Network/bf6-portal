// @ts-nocheck

function setUIInputModeForPlayer(player: mod.Player, enabled: boolean): void {
    if (!player || !mod.IsPlayerValid(player)) return;
    mod.EnableUIInputMode(enabled, player);
    State.players.uiInputEnabledByPid[mod.GetObjId(player)] = enabled;
}

function isMatchLive(): boolean {
    return State.round.phase === MatchPhase.Live;
}

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

function sendHighlightedWorldLogMessage(message: mod.Message, isGameplay: boolean, target?: mod.Player | mod.Team, debugKey?: number): void {
    if (!isGameplay) return;
    if (target) {
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

function endGameModeForTeamNum(teamNum: TeamID | 0): void {
    const winningTeam = mod.GetTeam(teamNum);
    mod.EndGameMode(winningTeam);
}

