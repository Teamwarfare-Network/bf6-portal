// @ts-nocheck
// Module: kpi/kpi-state -- per-player KPI tracking: kills, deaths, assists, captures, computed score.
// Score formula constants from CF-38. Dirty flag drives event-driven scoreboard pushes.

//#region -------------------- KPI Score Constants (CF-38) --------------------

const KPI_SCORE_KILL = 100;
const KPI_SCORE_ASSIST = 50;
const KPI_SCORE_FLAG_CAPTURE = 300;
const KPI_SCORE_DEATH_PENALTY = 0;

//#endregion -------------------- KPI Score Constants --------------------

//#region -------------------- KPI State Mutations --------------------

// Ensures a KPI record exists for the given pid. No-op if already initialized.
// deathsBaseline stores the engine's cumulative death count at init time so per-match deaths
// are computed as (engineDeaths - baseline) during scoreboard sync.
function kpiInitForPid(pid: number): void {
    if (State.players.kpiByPid[pid]) return;
    State.players.kpiByPid[pid] = {
        kills: 0,
        deaths: 0,
        assists: 0,
        captures: 0,
        score: 0,
        dirty: true,
        deathsBaseline: 0,
    };
}

// Recomputes the derived score from raw KPI fields and marks dirty.
function kpiRecalcScore(pid: number): void {
    const kpi = State.players.kpiByPid[pid];
    if (!kpi) return;
    kpi.score =
        kpi.kills * KPI_SCORE_KILL +
        kpi.assists * KPI_SCORE_ASSIST +
        kpi.captures * KPI_SCORE_FLAG_CAPTURE -
        kpi.deaths * KPI_SCORE_DEATH_PENALTY;
    kpi.dirty = true;
}

// Records a kill for the given pid and recalculates score.
function kpiRecordKill(pid: number): void {
    kpiInitForPid(pid);
    State.players.kpiByPid[pid].kills++;
    kpiRecalcScore(pid);
}

// Records a death for the given pid and recalculates score.
function kpiRecordDeath(pid: number): void {
    kpiInitForPid(pid);
    State.players.kpiByPid[pid].deaths++;
    kpiRecalcScore(pid);
}

// Records an assist for the given pid and recalculates score.
function kpiRecordAssist(pid: number): void {
    kpiInitForPid(pid);
    State.players.kpiByPid[pid].assists++;
    kpiRecalcScore(pid);
}

// Records a flag capture for the given pid and recalculates score.
function kpiRecordCapture(pid: number): void {
    kpiInitForPid(pid);
    State.players.kpiByPid[pid].captures++;
    kpiRecalcScore(pid);
}

// Initializes KPI for a player and snapshots their current engine death count as the baseline.
// Used on deploy so late joiners start with correct per-match death offset.
function kpiInitWithBaselineForPlayer(player: mod.Player, pid: number): void {
    kpiInitForPid(pid);
    const kpi = State.players.kpiByPid[pid];
    if (!kpi) return;
    try { kpi.deathsBaseline = mod.GetPlayerDeaths(player); } catch {}
}

// Removes KPI state for a disconnecting player.
function kpiCleanupForPid(pid: number): void {
    delete State.players.kpiByPid[pid];
}

// Resets all KPI state for all players. Called on match start and round reset (CF-44).
// Snapshots each player's engine death count as their baseline so per-match deaths start at 0.
function kpiResetAll(): void {
    const pids = Object.keys(State.players.kpiByPid);
    for (let i = 0; i < pids.length; i++) {
        delete State.players.kpiByPid[Number(pids[i])];
    }
}

// Snapshots the engine's cumulative death count for all connected players into their KPI baseline.
// Called immediately after kpiResetAll at match-live transition so pre-match deaths are excluded.
function kpiSnapshotDeathBaselines(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const player = mod.ValueInArray(players, i) as mod.Player;
        if (!player || !mod.IsPlayerValid(player)) continue;
        const pid = safeGetPlayerId(player);
        if (pid === undefined) continue;
        kpiInitForPid(pid);
        try {
            State.players.kpiByPid[pid].deathsBaseline = mod.GetPlayerDeaths(player);
        } catch {
        }
    }
}

//#endregion -------------------- KPI State Mutations --------------------
