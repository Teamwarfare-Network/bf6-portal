// @ts-nocheck
// Module: interaction/build-pacer -- Wave 3 lazy-build serialization + paced drainer
//
// Foundation for Wave 3 lazy-load. Provides:
//   1) A global heavy-build mutex that serializes the two heaviest UI builds
//      (combat HUD + vehicle deploy timer) so concurrent triggers cannot stack
//      in a single frame budget (regression guard for CQ_Bug_40).
//   2) A FIFO queue + 10Hz drainer for paced builders. Dormant when empty so
//      the recurring Timers.setTimeout chain only runs while there is work.
//
// Banned: mod.Wait inside this module. All deferral uses Timers.setTimeout, per
// design_doc/4.27.26_conquest_wave_3_plan.md analysis B (locked v0.3).
//
// Ship 1 (registry + pacer + mutex foundation): nothing in production code
// currently calls into the pacer. Subsequent ships re-route per-surface
// triggers through it.

namespace LazyBuildPacer {
    // 10Hz drainer per Wave 3 plan v0.3 (analysis B locked decision).
    const DRAIN_INTERVAL_MS = 100;

    type PendingOp = {
        name: string;
        pid: number;
        op: () => void;
        opsPerTick: number;
    };

    const _pendingOps: PendingOp[] = [];
    let _drainerActive: boolean = false;
    let _drainerTimerId: number | undefined = undefined;
    let _mutexHeld: boolean = false;
    let _mutexHolderName: string | undefined = undefined;
    let _mutexHolderPid: number | undefined = undefined;
    let _drainerTickCount: number = 0;

    // Synchronous mutex acquisition. Returns true if (name, pid) now owns the
    // global heavy-build mutex; false when held by any other caller. Never
    // blocks. Pair every true result with a release in a finally block.
    export function tryAcquireHeavyBuildMutex(name: string, pid: number): boolean {
        if (_mutexHeld) return false;
        _mutexHeld = true;
        _mutexHolderName = name;
        _mutexHolderPid = pid;
        return true;
    }

    // Releases the global heavy-build mutex. Idempotent: no-op when unheld.
    // Callers MUST release in a finally branch paired with their tryAcquire.
    export function releaseHeavyBuildMutex(): void {
        _mutexHeld = false;
        _mutexHolderName = undefined;
        _mutexHolderPid = undefined;
    }

    // Read-only mutex inspection helpers, exposed for SP smoke instrumentation
    // and future paced-builder retry logic.
    export function isHeavyBuildMutexHeld(): boolean {
        return _mutexHeld;
    }

    export function getHeavyBuildMutexHolderName(): string | undefined {
        return _mutexHolderName;
    }

    export function getHeavyBuildMutexHolderPid(): number | undefined {
        return _mutexHolderPid;
    }

    // Enqueues a build op for paced execution. Starts the drainer if dormant.
    // Hard rule (Wave 3 plan analysis B): the op MUST NOT call mod.Wait. The op
    // is invoked synchronously inside the drain tick; long sync work in an op
    // counts against that frame's budget.
    export function enqueueBuildOp(
        name: string,
        pid: number,
        op: () => void,
        opsPerTick: number = 1
    ): void {
        const safeOpsPerTick = opsPerTick > 0 ? opsPerTick : 1;
        _pendingOps.push({ name, pid, op, opsPerTick: safeOpsPerTick });
        ensureDrainerStarted();
    }

    // Starts the recurring drainer if it is currently dormant and there is
    // queued work. The drainer self-stops when the queue empties.
    function ensureDrainerStarted(): void {
        if (_drainerActive) return;
        if (_pendingOps.length === 0) return;
        _drainerActive = true;
        _drainerTimerId = Timers.setTimeout(_drain, DRAIN_INTERVAL_MS);
    }

    // Drains up to opsPerTick ops from the queue head. The opsPerTick budget is
    // taken from the head op so different builders can advertise their own
    // pacing. After draining, schedules the next tick only if work remains.
    function _drain(): void {
        _drainerTimerId = undefined;
        _drainerTickCount++;
        let opsThisTick: number = _pendingOps.length > 0 ? _pendingOps[0].opsPerTick : 0;
        while (opsThisTick > 0 && _pendingOps.length > 0) {
            const entry = _pendingOps.shift();
            if (!entry) break;
            try {
                entry.op();
            } catch (err) {
                _logPacerOpError(entry.name, entry.pid, err);
            }
            opsThisTick--;
        }
        if (_pendingOps.length === 0) {
            _drainerActive = false;
            return;
        }
        _drainerTimerId = Timers.setTimeout(_drain, DRAIN_INTERVAL_MS);
    }

    // Pacer-internal error log. Writes to the runtime console only; world-log
    // emission requires a registered string key (AGENTS.md String Change
    // Authorization Policy) and is deferred until that string lands.
    function _logPacerOpError(name: string, pid: number, err: unknown): void {
        const errMsg = (err && (err as any).message) ? (err as any).message : String(err);
        try {
            console.log(`[lazy-build-pacer:${name}:${pid}] ${errMsg}`);
        } catch {}
    }

    export function getPendingOpCount(): number {
        return _pendingOps.length;
    }

    export function isDrainerActive(): boolean {
        return _drainerActive;
    }

    export function getDrainerTickCount(): number {
        return _drainerTickCount;
    }
}
