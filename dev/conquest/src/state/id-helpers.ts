// @ts-nocheck
// Module: state/id-helpers -- object/player/team guards and safe widget lookup

//#region -------------------- Shared ID helpers --------------------

// Fast object-id lookup for call sites that already control validity.
function getObjId(obj: any): number {
    return mod.GetObjId(obj);
}

// Guarded object-id lookup for paths where object validity is uncertain.
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

// Guarded vehicle lookup for players during seat/undeploy transition windows.
function safeGetVehicleFromPlayer(player: mod.Player | null | undefined): mod.Vehicle | undefined {
    if (!player || !mod.IsPlayerValid(player)) return undefined;
    if (!isPlayerDeployed(player)) return undefined;
    const seatIndex = safeGetPlayerVehicleSeat(player, -1);
    if (seatIndex < 0) return undefined;
    try {
        return mod.GetVehicleFromPlayer(player);
    } catch {
        return undefined;
    }
}

// Guarded player seat lookup for transition windows where the engine briefly rejects the query.
function safeGetPlayerVehicleSeat(player: mod.Player | null | undefined, fallback: number = -1): number {
    if (!player || !mod.IsPlayerValid(player)) return fallback;
    if (!isPlayerDeployed(player)) return fallback;
    try {
        return mod.GetPlayerVehicleSeat(player);
    } catch {
        return fallback;
    }
}

// Returns true when the runtime has marked this player id as disconnected.
function isPidDisconnected(pid: number): boolean {
    return State.players.disconnectedByPid[pid] === true;
}

// Normalizes engine Team handles into TeamID enum values.
function getTeamNumber(team: mod.Team): TeamID | 0 {
    if (mod.Equals(team, mod.GetTeam(TeamID.Team1))) return TeamID.Team1;
    if (mod.Equals(team, mod.GetTeam(TeamID.Team2))) return TeamID.Team2;
    return 0;
}

// Guarded team lookup for players, with explicit fallback for invalid/unavailable states.
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

// Returns deployed-state truth from script runtime for this player.
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

// Guarded vector soldier-state lookup that also clears deployed flag on engine access failures.
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

// Resolves the localized team-name key for scoreboard/HUD labels.
function getTeamNameKey(teamNum: TeamID | 0): number {
    if (teamNum === TeamID.Team1) return ACTIVE_MAP_CONFIG?.team1Name ?? mod.stringkeys.twl.teams.WEST;
    if (teamNum === TeamID.Team2) return ACTIVE_MAP_CONFIG?.team2Name ?? mod.stringkeys.twl.teams.EAST;
    return mod.stringkeys.twl.system.unknownPlayer;
}

// Player-name message helper for UI text paths.
// CQ_Bug_18 ended up being a ready-dialog reveal-path problem, not the Player-backed message itself,
// so player-facing UI should use the actual player name again.
function getUiSafePlayerPidMessage(pid: number | undefined): mod.Message {
    if (pid === undefined) return mod.Message(mod.stringkeys.twl.system.unknownPlayer);
    const player = safeFindPlayer(pid);
    if (!player) return mod.Message(mod.stringkeys.twl.system.unknownPlayer);
    return mod.Message(player);
}

function getUiSafePlayerMessage(player: mod.Player | null | undefined): mod.Message {
    if (!player || !mod.IsPlayerValid(player)) return mod.Message(mod.stringkeys.twl.system.unknownPlayer);
    return mod.Message(player);
}

// Best-effort UI widget lookup by name from UIRoot, then global fallback.
function safeFind(name: string): mod.UIWidget | undefined {
    try {
        return mod.FindUIWidgetWithName(name, mod.GetUIRoot()) as mod.UIWidget;
    } catch {
        return undefined;
    }
}

// Outlined button helper: wraps a solid button inside a thin-outline container.

