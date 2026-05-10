// @ts-nocheck
// Module: interaction/supply-box-warm-scheduler -- staggered LIVE-phase warm of supply box widget tree
//
// Wave 3 Ship 3.5 (post-v1.411 follow-up): supply box ships first-interact-only by default in
// Ship 3 (heap-friendly), but most players don't visit the supply crate before they actually need
// a gadget under combat pressure. To pre-warm without overwhelming the runtime, this module kicks
// off a slow stagger at LIVE-phase transition: one player every 2 seconds.
//
// Persistent queue (not a snapshot): late joiners during LIVE get appended via enqueueLateJoiner.
// The dispatcher's per-surface in-flight guard + prebuildArmMenu's armCacheOk short-circuit make
// the scheduled trigger an effective no-op for any pid that interacted earlier in the cycle.
//
// Cancellation: token-based. startWarmStaggerForLive() bumps the token; the next scheduled tick
// compares to the active token and aborts if mismatched. cancelWarmStagger() bumps the token,
// clears the queue, and clears the pending Timers handle.
//
// Cadence justification: 2s/op spreads the ~50ms supply-box hitch to one per 2s, well under the
// runtime's frame budget headroom. At 16 players the cycle wraps in ~32s; at 64 players it's
// ~128s and may exceed match duration. Pids whose slot never fires fall back to the existing
// first-interact path in openArmMenu (Ship 3 default).

namespace SupplyBoxWarmScheduler {
    const WARM_STAGGER_INTERVAL_MS = 2000;

    let _activeToken: number = 0;
    let _scheduledTimerId: number | undefined = undefined;
    let _warmQueue: number[] = [];
    let _liveActive: boolean = false;

    // Starts the staggered warm cycle. Snapshots currently-connected pids in ascending-pid order
    // into the persistent queue, then schedules the first trigger at +2s. Idempotent on the call
    // side: cancelWarmStagger() runs first to invalidate any in-flight chain.
    //
    // Called from conquest-flow.ts:startMatch immediately after lifecycleSetLiveBaseline.
    export function startWarmStaggerForLive(): void {
        cancelWarmStagger();
        _liveActive = true;
        _activeToken += 1;
        _warmQueue = collectConnectedPidsOrdered();
        scheduleNext(_activeToken);
    }

    // Cancels any pending staggered warm-build. Bumps the active token (invalidates any in-flight
    // scheduled tick), clears the queue, and clears the pending Timers handle.
    //
    // Called from conquest-flow.ts:endMatch and triggerFreshMatchSetup. Safe to call when no
    // chain is active. Idempotent.
    export function cancelWarmStagger(): void {
        _activeToken += 1;
        _liveActive = false;
        _warmQueue = [];
        if (_scheduledTimerId !== undefined) {
            Timers.clear(_scheduledTimerId);
            _scheduledTimerId = undefined;
        }
    }

    // Appends a late-joining pid to the warm queue tail. No-ops when LIVE is not active or when
    // the pid is already queued. Restarts the chain if it had self-terminated (queue drained).
    //
    // Called from player-join-leave.ts:onPlayerJoinGameImpl. Internally guarded so the join flow
    // can fire it unconditionally regardless of phase.
    export function enqueueLateJoiner(pid: number): void {
        if (!_liveActive) return;
        if (_warmQueue.indexOf(pid) >= 0) return;
        _warmQueue.push(pid);
        if (_scheduledTimerId === undefined) {
            scheduleNext(_activeToken);
        }
    }

    // Read-only telemetry helper for soak-test instrumentation.
    export function isWarmStaggerActive(): boolean {
        return _scheduledTimerId !== undefined;
    }

    // Schedules the next warm trigger at the front of the queue, then recursively schedules the
    // one after it. Aborts silently when the captured token no longer matches the active token
    // (cancellation race) or when the queue is empty (self-terminate; restart is via
    // enqueueLateJoiner if a late join arrives later).
    function scheduleNext(token: number): void {
        if (token !== _activeToken) return;
        if (_warmQueue.length === 0) {
            _scheduledTimerId = undefined;
            return;
        }
        _scheduledTimerId = Timers.setTimeout(() => {
            _scheduledTimerId = undefined;
            if (token !== _activeToken) return;
            if (_warmQueue.length === 0) return;
            const pid = _warmQueue.shift() as number;
            try {
                triggerLazyBuild('supplyBox', pid);
            } catch {}
            scheduleNext(token);
        }, WARM_STAGGER_INTERVAL_MS);
    }

    // Snapshot helper: returns currently-connected pids sorted ascending. Deterministic ordering
    // makes soak-test behavior reproducible. Disconnected pids are filtered.
    function collectConnectedPidsOrdered(): number[] {
        const pids: number[] = [];
        const players = mod.AllPlayers();
        const count = mod.CountOf(players);
        for (let i = 0; i < count; i++) {
            const player = mod.ValueInArray(players, i) as mod.Player;
            if (!isValidPlayer(player)) continue;
            const pid = safeGetPlayerId(player);
            if (pid === undefined) continue;
            if (isPidDisconnected(pid)) continue;
            pids.push(pid);
        }
        pids.sort((a, b) => a - b);
        return pids;
    }
}
