// @ts-nocheck
// Module: vehicles/spawner-budget -- audit persistent VehicleSpawner count against the 40-budget ceiling.
//
// Design cap: we keep the total number of mod.VehicleSpawner objects on the map <= 40 so the
// engine doesn't thrash. Today's baseline is ~28-32 (per-side HQ ground + aircraft slots).
// This diagnostic surfaces a warning if a future change drifts past the threshold so we can
// pool rather than multiply. Forward Deploy intentionally reuses slot.spawner (relocate on
// click, restore after seat) rather than adding a second spawner per slot -- this audit is
// our guardrail for that decision.

const SPAWNER_COUNT_WARN_THRESHOLD = 40;

function countPersistentVehicleSpawners(): number {
    const slots = State.vehicles?.slots;
    if (!slots) return 0;
    let count = 0;
    for (let i = 0; i < slots.length; i++) {
        if (slots[i]?.spawner) count += 1;
    }
    return count;
}

// One-shot audit; invoke after slot setup finishes. Broadcasts a visible warning when the
// count reaches the ceiling so the author notices before the next slot addition is merged.
function auditSpawnerBudgetAtRoundStart(): void {
    const count = countPersistentVehicleSpawners();
    if (count < SPAWNER_COUNT_WARN_THRESHOLD) return;
    try {
        sendHighlightedWorldLogMessage(
            mod.Message(
                mod.stringkeys.twl.system.genericCounter,
                `[spawner-budget] persistent VehicleSpawner count=${count} >= threshold ${SPAWNER_COUNT_WARN_THRESHOLD}`
            ),
            false,
            undefined,
            mod.stringkeys.twl.system.genericCounter
        );
    } catch {}
}
