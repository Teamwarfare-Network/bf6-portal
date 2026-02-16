// @ts-nocheck
// Module: ready-dialog/roster-active -- active player selection and roster entry derivation

//#region -------------------- Ready Dialog - Active Player Resolution + Roster --------------------

// Returns true when every active player on Team 1/2 is currently READY.

// -----------------------------------------------------------------------------
// Active Player Resolution
// -----------------------------------------------------------------------------
// Single source of truth for who counts as an "active" player across:
//   - roster population (Ready Up UI)
//   - all-ready checks / auto-start gating
//   - any future live-start gating logic
//
// Definition (low-risk, conservative):
//   - Must be present in mod.AllPlayers() (avoids stale/disconnected pids)
//   - Must be valid (mod.IsPlayerValid)
//   - Must be assigned to TeamID.Team1 or TeamID.Team2 (spectators/neutral excluded)
//
// Note: We intentionally do NOT filter by "deployed" state here. Some APIs expose deployment state,
// but this codebase does not currently have a typed/portable check. Treating undeployed teammates as
// active is safer for readiness gating and avoids edge-case mismatches during team switching.
type ActivePlayers_t = {
    all: mod.Player[];
    team1: mod.Player[];
    team2: mod.Player[];
};

type RosterDisplayEntry = {
    player?: mod.Player;
    nameKey?: number;
};

type RosterDisplay_t = {
    team1: RosterDisplayEntry[];
    team2: RosterDisplayEntry[];
    maxRows: number;
};

/**
 * Active-player definition (single source of truth).
 * Used by: roster population, all-ready checks, live-start gating, and the HUD ready-count line.
 * Notes: excludes undeployed/neutral/stale players by reading current engine team state each call; do not cache long-term.
 */
function getActivePlayers(): ActivePlayers_t {
    const all: mod.Player[] = [];
    const team1: mod.Player[] = [];
    const team2: mod.Player[] = [];
    const pidByPlayer = new Map<mod.Player, number>();

    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        let pid: number;
        try {
            pid = mod.GetObjId(p);
        } catch {
            continue;
        }
        const teamNum = getTeamNumber(mod.GetTeam(p));
        // Only Team 1/2 are considered active for rosters/ready gating.
        if (teamNum !== TeamID.Team1 && teamNum !== TeamID.Team2) continue;

        pidByPlayer.set(p, pid);
        all.push(p);
        if (teamNum === TeamID.Team1) team1.push(p);
        else team2.push(p);
    }

    // Stable UI ordering: sort by pid (object id).
    // This prevents rows from shuffling across refreshes.
    const byPidCached = (a: mod.Player, b: mod.Player) => (pidByPlayer.get(a) ?? 0) - (pidByPlayer.get(b) ?? 0);
    all.sort(byPidCached);
    team1.sort(byPidCached);
    team2.sort(byPidCached);

    return { all, team1, team2 };
}

function buildRosterDisplayEntries(players: mod.Player[], debugCount: number): RosterDisplayEntry[] {
    const entries: RosterDisplayEntry[] = [];
    for (const p of players) entries.push({ player: p });

    const extraCount = Math.max(0, Math.floor(debugCount));
    for (let i = 0; i < extraCount; i++) {
        entries.push({ nameKey: DEBUG_TEST_PLACEHOLDER_NAME_KEY });
    }
    return entries;
}

function getRosterDisplayEntries(): RosterDisplay_t {
    const active = getActivePlayers();
    const team1 = buildRosterDisplayEntries(active.team1, DEBUG_TEST_NAMES_TEAM_1);
    const team2 = buildRosterDisplayEntries(active.team2, DEBUG_TEST_NAMES_TEAM_2);
    return { team1, team2, maxRows: Math.max(team1.length, team2.length) };
}

function getRosterEntryNameMessage(entry: RosterDisplayEntry | undefined): mod.Message {
    if (!entry) return mod.Message(mod.stringkeys.twl.system.genericCounter, "");
    if (entry.player) return mod.Message(mod.stringkeys.twl.readyDialog.playerNameFormat, entry.player);
    if (entry.nameKey) return mod.Message(entry.nameKey);
    return mod.Message(mod.stringkeys.twl.system.genericCounter, "");
}

function areAllActivePlayersReady(): boolean {
    const active = getActivePlayers();
    const activeCount = active.all.length;
    const requiredTotalPlayers = getAutoStartMinPlayerCounts().total;
    if (activeCount < requiredTotalPlayers) {
        if (activeCount !== 0) return false;

        // Fallback: if no Team 1/2 players are assigned yet (team 0 pre-deploy),
        // allow the ready check to use all valid players.
        const players = mod.AllPlayers();
        const count = mod.CountOf(players);
        let validCount = 0;
        for (let i = 0; i < count; i++) {
            const p = mod.ValueInArray(players, i) as mod.Player;
            if (!p || !mod.IsPlayerValid(p)) continue;
            const pid = safeGetPlayerId(p);
            if (pid === undefined) continue;
            if (!State.players.readyByPid[pid]) return false;
            validCount++;
        }
        return validCount >= requiredTotalPlayers;
    }

    for (const p of active.all) {
        const pid = safeGetPlayerId(p);
        if (pid === undefined) continue;
        if (!State.players.readyByPid[pid]) return false;
    }
    return true;
}

//#endregion -------------------- Ready Dialog - Active Player Resolution + Roster --------------------
