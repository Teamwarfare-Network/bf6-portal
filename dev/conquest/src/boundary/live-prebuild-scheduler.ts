// @ts-nocheck
// Module: boundary/live-prebuild-scheduler -- LIVE-phase 10-batch staggered prebuild of boundary prompt UI
//
// Wave 3 Ship 6: at LIVE start, fan the 12-widget boundary prompt build out across 10 one-second
// batches so a 24+ player room doesn't try to build all caches in the same engine eval slice.
// The boundary prompt is a registered lazy-build surface (see lazy-build-registry.ts:'boundaryPrompt');
// each batch dispatches `triggerLazyBuild('boundaryPrompt', pid)` per pid in its slice.
//
// Snapshot, not persistent queue: the pid set is captured once at LIVE start. Late joiners are
// NOT enqueued -- their cache builds on first violation via the existing path in
// showBoundaryPromptForPlayer -> ensureBoundaryPromptUiForPlayer. This is structurally simpler
// than Ship 3.5's supply-box scheduler (no enqueueLateJoiner, no chain-restart-on-drain).
//
// Cancellation: token-based. startBoundaryPromptPrebuildForLive() bumps _activeToken; each
// scheduled batch callback compares its captured token to _activeToken and aborts silently on
// mismatch. cancelBoundaryPromptPrebuild() bumps the token, clears the queue, clears scheduled
// timer handles.
//
// Cadence justification: 10 batches at 1s spacing covers the user-defined 10s pre-LIVE countdown
// window. Batch size = ceil(connectedPidCount / 10), capped at MAX_BATCH_SIZE = 8 so even very
// large rooms (>80 pids) never fire more than 8 sync 12-widget builds per batch. 8 sync builds
// per second is well within the 1000ms engine eval budget.

namespace BoundaryPromptLivePrebuildScheduler {
    const BATCH_INTERVAL_MS = 1000;
    const BATCH_COUNT = 10;
    const MAX_BATCH_SIZE = 8;

    let _activeToken: number = 0;
    let _scheduledTimerIds: number[] = [];
    let _pidsSnapshot: number[] = [];

    // Starts the staggered LIVE-phase prebuild. Snapshots currently-connected pids in ascending
    // order, computes 10 slice ranges (`ceil(N/10)` per batch, capped at MAX_BATCH_SIZE), and
    // schedules each batch via Timers.setTimeout at +0s, +1s, ..., +9s. Idempotent on the call
    // side: cancelBoundaryPromptPrebuild() runs first to invalidate any in-flight chain.
    //
    // Called from conquest-flow.ts:startMatch immediately after SupplyBoxWarmScheduler.startWarmStaggerForLive.
    export function startBoundaryPromptPrebuildForLive(): void {
        cancelBoundaryPromptPrebuild();
        _activeToken += 1;
        _pidsSnapshot = collectConnectedPidsOrdered();
        if (_pidsSnapshot.length === 0) return;

        const batchSize = Math.min(MAX_BATCH_SIZE, Math.ceil(_pidsSnapshot.length / BATCH_COUNT));
        const token = _activeToken;
        for (let batchIndex = 0; batchIndex < BATCH_COUNT; batchIndex++) {
            const start = batchIndex * batchSize;
            if (start >= _pidsSnapshot.length) break;
            const end = Math.min(start + batchSize, _pidsSnapshot.length);
            const delayMs = batchIndex * BATCH_INTERVAL_MS;
            const timerId = Timers.setTimeout(() => {
                if (token !== _activeToken) return;
                for (let i = start; i < end; i++) {
                    const pid = _pidsSnapshot[i];
                    try {
                        triggerLazyBuild('boundaryPrompt', pid);
                    } catch {}
                }
            }, delayMs);
            _scheduledTimerIds.push(timerId);
        }
    }

    // Cancels any pending LIVE prebuild batches. Bumps the active token (invalidates any pending
    // scheduled batch callback), clears scheduled timer handles, clears the snapshot.
    //
    // Called from conquest-flow.ts:endMatch and triggerFreshMatchSetup. Safe to call when no
    // chain is active. Idempotent.
    export function cancelBoundaryPromptPrebuild(): void {
        _activeToken += 1;
        _pidsSnapshot = [];
        for (const timerId of _scheduledTimerIds) {
            Timers.clear(timerId);
        }
        _scheduledTimerIds = [];
    }

    // Read-only telemetry helper for soak-test instrumentation.
    export function isBoundaryPromptPrebuildActive(): boolean {
        return _scheduledTimerIds.length > 0;
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
