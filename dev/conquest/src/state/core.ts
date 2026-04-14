// @ts-nocheck

function setUIInputModeForPlayer(player: mod.Player, enabled: boolean): void {
    if (!player || !mod.IsPlayerValid(player)) return;
    mod.EnableUIInputMode(enabled, player);
    State.players.uiInputEnabledByPid[mod.GetObjId(player)] = enabled;
}

// Applies full movement/fire/look input restriction for one player during short loading/finalize windows.
function setAllInputRestrictionsForPlayer(player: mod.Player, restricted: boolean): void {
    if (!player || !mod.IsPlayerValid(player)) return;
    const pid = safeGetPlayerId(player);
    if (pid !== undefined) {
        recordUiLoadInputRestrictedForPid(pid, restricted);
    }
    mod.EnableAllInputRestrictions(player, restricted);
}

function isMatchLive(): boolean {
    return State.round.phase === MatchPhase.Live;
}

// Returns seconds elapsed since the match went live (0 if not live or timestamp missing).
function getSecondsSinceLive(): number {
    if (!isMatchLive()) return 0;
    const liveAt = State.round.liveStartedAtSeconds;
    if (liveAt === undefined) return 0;
    return Math.max(0, Math.floor(mod.GetMatchTimeElapsed()) - liveAt);
}

// True while all aircraft deployment (HQ + air) is blocked at round start.
function isRoundStartAirDelayActive(): boolean {
    if (!isMatchLive()) return false;
    const delay = ACTIVE_MAP_CONFIG.roundStartAirDelay ?? 0;
    return delay > 0 && getSecondsSinceLive() < delay;
}

// True while the air-deploy button is blocked (aircraft HQ may already be available after airDelay).
function isRoundStartAirDeployDelayActive(): boolean {
    if (!isMatchLive()) return false;
    const delay = ACTIVE_MAP_CONFIG.roundStartAirDeployDelay ?? 0;
    return delay > 0 && getSecondsSinceLive() < delay;
}

// True while the forward-deploy button is blocked at round start.
function isRoundStartForwardDeployDelayActive(): boolean {
    if (!isMatchLive()) return false;
    const delay = ACTIVE_MAP_CONFIG.roundStartForwardDeployDelay ?? 0;
    return delay > 0 && getSecondsSinceLive() < delay;
}

// Remaining seconds until the air delay expires (for countdown display).
function getRoundStartAirDelayRemainingSeconds(): number {
    const delay = ACTIVE_MAP_CONFIG.roundStartAirDelay ?? 0;
    return Math.max(0, delay - getSecondsSinceLive());
}

// True while gadget locker tiles are blocked at round start.
function isRoundStartGadgetDelayActive(): boolean {
    if (!isMatchLive()) return false;
    const delay = ACTIVE_MAP_CONFIG.roundStartGadgetDelay ?? 0;
    return delay > 0 && getSecondsSinceLive() < delay;
}

// Remaining seconds until gadget lockers unlock. Pre-LIVE, returns the raw configured delay so
// the locker menu can display the full value before the match clock starts.
function getRoundStartGadgetDelayRemainingSeconds(): number {
    const delay = ACTIVE_MAP_CONFIG.roundStartGadgetDelay ?? 0;
    if (!isMatchLive()) return delay;
    return Math.max(0, delay - getSecondsSinceLive());
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

