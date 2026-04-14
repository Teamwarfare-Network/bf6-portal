// @ts-nocheck
// Module: state/tick-context -- per-tick mod.AllPlayers() cache for hot loop subticks

// Ambient tick context: the main tick loop (game-mode.ts) sets this at the start
// of each subtick so every forEachValidPlayer call inside that pass reuses the same
// mod.AllPlayers() snapshot. Non-tick callers (event handlers, one-shot lifecycle
// transitions) run outside an active context and fall back to a fresh AllPlayers call,
// matching prior behavior exactly.

interface ActiveTickContext {
    players: any;
    playerCount: number;
}

let activeTickContext: ActiveTickContext | undefined;

// Entered at the top of each subtick in the main game-mode loop.
// Must be paired with endTickContext() via try/finally so a thrown handler never
// leaves a stale cached player array visible to the next subtick.
function beginTickContext(): void {
    const players = mod.AllPlayers();
    activeTickContext = { players, playerCount: mod.CountOf(players) };
}

function endTickContext(): void {
    activeTickContext = undefined;
}

// Consulted by forEachValidPlayer to avoid re-querying mod.AllPlayers() when a
// subtick has already cached it. Returns undefined when no context is active.
function getActiveTickContext(): ActiveTickContext | undefined {
    return activeTickContext;
}
