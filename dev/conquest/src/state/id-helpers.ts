// @ts-nocheck
// Module: state/id-helpers -- object/player/team guards and safe widget lookup

//#region -------------------- Shared ID helpers --------------------

function getObjId(obj: any): number {
    return mod.GetObjId(obj);
}

function safeGetObjId(obj: any): number | undefined {
    if (!obj) return undefined;
    try {
        return mod.GetObjId(obj);
    } catch {
        return undefined;
    }
}

// Guarded pid resolution for disconnect race windows in hot paths.
function safeGetPlayerId(player: mod.Player | null | undefined): number | undefined {
    if (!player || !mod.IsPlayerValid(player)) return undefined;
    try {
        return mod.GetObjId(player);
    } catch {
        return undefined;
    }
}

function isPidDisconnected(pid: number): boolean {
    return State.players.disconnectedByPid[pid] === true;
}

function getTeamNumber(team: mod.Team): TeamID | 0 {
    if (mod.Equals(team, mod.GetTeam(TeamID.Team1))) return TeamID.Team1;
    if (mod.Equals(team, mod.GetTeam(TeamID.Team2))) return TeamID.Team2;
    return 0;
}

function safeGetTeamNumberFromPlayer(
    player: mod.Player | null | undefined,
    fallback: TeamID | 0 = 0
): TeamID | 0 {
    if (!player || !mod.IsPlayerValid(player)) return fallback;
    try {
        return getTeamNumber(mod.GetTeam(player));
    } catch {
        return fallback;
    }
}

function isPlayerDeployed(player: mod.Player): boolean {
    if (!player || !mod.IsPlayerValid(player)) return false;
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return false;
    return !!State.players.deployedByPid[pid];
}

// Safe GetSoldierState wrappers: avoid engine errors during undeploy/cleanup and keep deploy state in sync.
function safeGetSoldierStateBool(player: mod.Player, stateKey: any, fallback: boolean = false): boolean {
    if (!player || !mod.IsPlayerValid(player)) return fallback;
    if (!isPlayerDeployed(player)) return fallback;
    try {
        return !!mod.GetSoldierState(player, stateKey);
    } catch {
        const pid = safeGetPlayerId(player);
        if (pid !== undefined) {
            State.players.deployedByPid[pid] = false;
        }
        return fallback;
    }
}

function safeGetSoldierStateVector(player: mod.Player, stateKey: any): mod.Vector | undefined {
    if (!player || !mod.IsPlayerValid(player)) return undefined;
    if (!isPlayerDeployed(player)) return undefined;
    try {
        return mod.GetSoldierState(player, stateKey) as unknown as mod.Vector;
    } catch {
        const pid = safeGetPlayerId(player);
        if (pid !== undefined) {
            State.players.deployedByPid[pid] = false;
        }
        return undefined;
    }
}

function getTeamNameKey(teamNum: TeamID | 0): number {
    if (teamNum === TeamID.Team1) return ACTIVE_MAP_CONFIG?.team1Name ?? mod.stringkeys.twl.teams.WEST;
    if (teamNum === TeamID.Team2) return ACTIVE_MAP_CONFIG?.team2Name ?? mod.stringkeys.twl.teams.EAST;
    return mod.stringkeys.twl.system.unknownPlayer;
}

function safeFind(name: string): mod.UIWidget | undefined {
    try {
        return mod.FindUIWidgetWithName(name, mod.GetUIRoot()) as mod.UIWidget;
    } catch {
        try {
            return mod.FindUIWidgetWithName(name) as mod.UIWidget;
        } catch {
            return undefined;
        }
    }
}

// Outlined button helper: wraps a solid button inside a thin-outline container.
