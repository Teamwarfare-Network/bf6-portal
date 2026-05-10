// @ts-nocheck
// Module: state/player-iteration -- shared valid-player iteration helper

// Centralizes the mod.AllPlayers() + IsPlayerValid + safeGetPlayerId loop
// that ~29 per-tick/per-event wrappers were repeating. Iteration order
// matches the engine ordering (forward 0..count-1) that callers depend on.
function forEachValidPlayer(cb: (player: mod.Player, pid: number) => void): void {
    const ctx = getActiveTickContext();
    const players = ctx ? ctx.players : mod.AllPlayers();
    const count = ctx ? ctx.playerCount : mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const player = mod.ValueInArray(players, i) as mod.Player;
        if (!isValidPlayer(player)) continue;
        const pid = safeGetPlayerId(player);
        if (pid === undefined) continue;
        cb(player, pid);
    }
}
