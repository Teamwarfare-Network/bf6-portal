// @ts-nocheck
// Module: hud/ui-cache-perf -- per-player UI cache instrumentation counters
//
// Tracks built/rebuilt/cold/invalid events for three UI families (vehicle, ready, gadget).
// Counters are incremented at source (dialog-build, deploy-timer-ui, ammo-resupply-menu).
// Aggregate display is handled by the perf diag panel (hud/perf-diag.ts).
// The standalone UI cache HUD panel was deprecated in v1.089.

// Returns the authoritative per-player UI cache counters, creating a zeroed record on first access.
function ensureUiCachePerfCountersForPid(pid: number) {
    let counters = State.players.uiCachePerfByPid[pid];
    if (counters) return counters;
    counters = {
        vehicle: { built: 0, rebuilt: 0, cold: 0, invalid: 0 },
        ready: { built: 0, rebuilt: 0, cold: 0, invalid: 0 },
        gadget: { built: 0, rebuilt: 0, cold: 0, invalid: 0 },
    };
    State.players.uiCachePerfByPid[pid] = counters;
    return counters;
}

// Resets one player's UI cache instrumentation counters on fresh join/reconnect lifecycle setup.
function resetUiCachePerfCountersForPid(pid: number): void {
    delete State.players.uiCachePerfByPid[pid];
}

// Writes one counter change. Display is driven by the perf diag panel's 1-second window sync.
function incrementUiCachePerfCounter(
    pid: number,
    family: "vehicle" | "ready" | "gadget",
    field: "built" | "rebuilt" | "cold" | "invalid"
): void {
    const counters = ensureUiCachePerfCountersForPid(pid);
    counters[family][field] = counters[family][field] + 1;
}
