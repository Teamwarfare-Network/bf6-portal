// @ts-nocheck
// Module: index/capture-shared -- shared helpers for capture-sound and capture-vo subsystems

// Returns true if the runtime handle is a valid spawned-object reference (non-null, non-zero).
function conquestCaptureHasValidHandle(handle: any): boolean {
    if (handle === undefined || handle === null) return false;
    if (typeof handle === "number") return handle > 0;
    return true;
}

// Safely unspawns a runtime handle if it looks valid. Swallows engine errors.
function conquestCaptureSafeUnspawnHandle(handle: any): void {
    if (!conquestCaptureHasValidHandle(handle)) return;
    try {
        mod.UnspawnObject(handle);
    } catch {}
}

// Rebuilds a throttle map excluding all entries whose key contains the given pid token.
// Used by both sound and VO subsystems to purge stale per-player cooldown entries on leave/reset.
function conquestCaptureFilterThrottleMapByPid(
    throttleMap: Record<string, number>,
    pid: number
): Record<string, number> {
    const next: Record<string, number> = {};
    const needle = `:${pid}:`;
    for (const key in throttleMap) {
        if (!key) continue;
        if (key.indexOf(needle) >= 0) continue;
        next[key] = throttleMap[key];
    }
    return next;
}
