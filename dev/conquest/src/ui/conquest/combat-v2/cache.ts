// @ts-nocheck
// Module: ui/conquest/combat-v2/cache -- per-player cache owner for combat HUD v2

const conquestCombatHudV2ByPid: Record<number, ConquestCombatHudV2PlayerEntry> = {};
const conquestCombatHudV2InitialPurgeCompletedByPid: Record<number, boolean> = {};

// Returns the current combat HUD v2 cache entry for one player id.
function getConquestCombatHudV2Entry(pid: number): ConquestCombatHudV2PlayerEntry | undefined {
    return conquestCombatHudV2ByPid[pid];
}

// Creates a fresh combat HUD v2 cache entry for one player id.
function createConquestCombatHudV2Entry(pid: number): ConquestCombatHudV2PlayerEntry {
    const entry: ConquestCombatHudV2PlayerEntry = {
        pid,
        initialized: false,
        dirty: true,
        animationDirty: true,
        teamSwapPending: false,
        widgets: {},
        telemetry: {
            instanceCount: 0,
            mainUpdates: 0,
            animationUpdates: 0,
            lastMainUpdateAtSeconds: -1,
            lastAnimationUpdateAtSeconds: -1,
        },
    };
    conquestCombatHudV2ByPid[pid] = entry;
    return entry;
}

// Returns an existing combat HUD v2 entry or creates one when missing.
function ensureConquestCombatHudV2Entry(pid: number): ConquestCombatHudV2PlayerEntry {
    return getConquestCombatHudV2Entry(pid) ?? createConquestCombatHudV2Entry(pid);
}

// Deletes one player's combat HUD v2 cache entry.
function clearConquestCombatHudV2Entry(pid: number): void {
    delete conquestCombatHudV2ByPid[pid];
}

// Returns true when initial duplicate-purge has run for one player id.
function hasConquestCombatHudV2InitialPurgeCompleted(pid: number): boolean {
    return conquestCombatHudV2InitialPurgeCompletedByPid[pid] === true;
}

// Marks one player id as having completed initial duplicate-purge.
function markConquestCombatHudV2InitialPurgeCompleted(pid: number): void {
    conquestCombatHudV2InitialPurgeCompletedByPid[pid] = true;
}

// Clears the initial duplicate-purge marker for one player id.
function resetConquestCombatHudV2InitialPurgeCompleted(pid: number): void {
    delete conquestCombatHudV2InitialPurgeCompletedByPid[pid];
}

// Deletes all combat HUD v2 cache entries.
function clearAllConquestCombatHudV2Entries(): void {
    for (const pidKey in conquestCombatHudV2ByPid) {
        if (!Object.prototype.hasOwnProperty.call(conquestCombatHudV2ByPid, pidKey)) continue;
        delete conquestCombatHudV2ByPid[Number(pidKey)];
    }
    for (const pidKey in conquestCombatHudV2InitialPurgeCompletedByPid) {
        if (!Object.prototype.hasOwnProperty.call(conquestCombatHudV2InitialPurgeCompletedByPid, pidKey)) continue;
        delete conquestCombatHudV2InitialPurgeCompletedByPid[Number(pidKey)];
    }
}

// Runs a callback for each cached combat-v2 entry.
function forEachConquestCombatHudV2Entry(
    callback: (pid: number, entry: ConquestCombatHudV2PlayerEntry) => void
): void {
    for (const pidKey in conquestCombatHudV2ByPid) {
        if (!Object.prototype.hasOwnProperty.call(conquestCombatHudV2ByPid, pidKey)) continue;
        const pid = Number(pidKey);
        const entry = conquestCombatHudV2ByPid[pid];
        if (!entry) continue;
        callback(pid, entry);
    }
}
