// @ts-nocheck
// Module: kpi/scoreboard-tab -- custom two-team tab scoreboard configuration and per-player value sync.
// Columns: Score | Kills | Deaths | Assists | Captures (5 max, Portal API limit).
// Sorted by Score descending (CF-40). Re-asserts config every 60s to survive Portal metadata resets.

//#region -------------------- Scoreboard Configuration --------------------

let scoreboardConfigured = false;
let scoreboardLastSyncAtSeconds = -1;

const SCOREBOARD_SYNC_INTERVAL_SECONDS = 1.0;

// One-time scoreboard setup: type, column names/widths, sorting.
// Called once at game mode start. Does NOT set target score (handled by game-mode init).
// SetScoreboardType must not be called mid-game — engine may stall rebuilding the UI.
function configureScoreboard(): void {
    try {
        mod.SetScoreboardType(mod.ScoreboardType.CustomTwoTeams);
    } catch {
        return;
    }
    try {
        mod.SetScoreboardHeader(
            msg(getTeamNameKey(TeamID.Team1)),
            msg(getTeamNameKey(TeamID.Team2))
        );
    } catch {
    }
    try {
        mod.SetScoreboardColumnNames(
            msg(mod.stringkeys.twl.scoreboard.colScore),
            msg(mod.stringkeys.twl.scoreboard.colKills),
            msg(mod.stringkeys.twl.scoreboard.colDeaths),
            msg(mod.stringkeys.twl.scoreboard.colAssists),
            msg(mod.stringkeys.twl.scoreboard.colCaptures)
        );
        mod.SetScoreboardColumnWidths(1.2, 0.7, 0.7, 0.7, 0.7);
        mod.SetScoreboardSorting(0, false);
    } catch {
    }
    scoreboardConfigured = true;
}

//#endregion -------------------- Scoreboard Configuration --------------------

//#region -------------------- Scoreboard Player Sync --------------------

// Pushes KPI values for a single player to the scoreboard. Clears the dirty flag on success.
// Uses engine GetPlayerDeaths for death count (authoritative) and script-tracked kills/assists/captures.
function updateScoreboardForPlayer(player: mod.Player): void {
    if (!isValidPlayer(player)) return;
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return;
    const kpi = State.players.kpiByPid[pid];
    if (!kpi) return;

    // Sync engine-authoritative death count into KPI. Subtracts the baseline snapshot taken at
    // match start so only per-match deaths are counted (engine counter is cumulative across session).
    try {
        const engineDeaths = mod.GetPlayerDeaths(player);
        const matchDeaths = Math.max(0, engineDeaths - kpi.deathsBaseline);
        if (matchDeaths !== kpi.deaths) {
            kpi.deaths = matchDeaths;
            kpiRecalcScore(pid);
        }
    } catch {
    }

    try {
        mod.SetScoreboardPlayerValues(
            player,
            kpi.score,
            kpi.kills,
            kpi.deaths,
            kpi.assists,
            kpi.captures
        );
        kpi.dirty = false;
    } catch {
    }
}

// Pushes KPI values for all connected players. Only updates dirty entries unless forced.
function updateScoreboardForAllPlayers(force?: boolean): void {
    forEachValidPlayer((player, pid) => {
        const kpi = State.players.kpiByPid[pid];
        if (!kpi) return;
        if (!force && !kpi.dirty) return;
        updateScoreboardForPlayer(player);
    });
}

// Pushes team ticket counts to the scoreboard header display via SetGameModeScore.
function updateScoreboardTeamScores(): void {
    try {
        mod.SetGameModeScore(mod.GetTeam(TeamID.Team1), State.conquest.tickets.team1);
        mod.SetGameModeScore(mod.GetTeam(TeamID.Team2), State.conquest.tickets.team2);
    } catch {
    }
}

// Gated sync pass: updates all dirty players and team scores at most once per second.
// Called from the main game-mode second-boundary block (not every subtick).
function scoreboardSyncTick(): void {
    if (!scoreboardConfigured) return;
    const now = mod.GetMatchTimeElapsed();
    if (now - scoreboardLastSyncAtSeconds < SCOREBOARD_SYNC_INTERVAL_SECONDS) return;
    scoreboardLastSyncAtSeconds = now;
    updateScoreboardForAllPlayers();
    updateScoreboardTeamScores();
}

//#endregion -------------------- Scoreboard Player Sync --------------------
