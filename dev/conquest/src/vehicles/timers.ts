// @ts-nocheck
// Module: vehicles/timers -- authoritative per-slot respawn timer ownership for Phase 5 vehicle systems

// Initializes authoritative timer fields for one spawner slot.
// Keep timer truth here so future HUD rendering reads one source of truth instead of inferring from waits.
function initializeVehicleSlotTimerState(slot: VehicleSpawnerSlot): void {
    slot.respawnDelaySeconds = VEHICLE_SPAWNER_RESPAWN_DELAY_SECONDS;
    slot.respawnQueuedAtSeconds = -1;
    slot.respawnReadyAtSeconds = -1;
    slot.lastSpawnedAtSeconds = -1;
}

// Clears any active respawn/retry countdown for a slot without changing its bound vehicle identity.
function clearVehicleSlotRespawnTimer(slot: VehicleSpawnerSlot): void {
    slot.respawnQueuedAtSeconds = -1;
    slot.respawnReadyAtSeconds = -1;
}

// Schedules the authoritative respawn countdown for a slot.
function scheduleVehicleSlotRespawnTimer(slot: VehicleSpawnerSlot, delaySeconds: number): void {
    const now = mod.GetMatchTimeElapsed();
    slot.respawnDelaySeconds = delaySeconds;
    slot.respawnQueuedAtSeconds = now;
    slot.respawnReadyAtSeconds = now + delaySeconds;
}

// Records a successful bind/spawn and clears any prior respawn countdown for the slot.
function bindVehicleToSpawnerSlot(slot: VehicleSpawnerSlot, vehicleObjId: number): void {
    slot.vehicleId = vehicleObjId;
    slot.respawnRunning = false;
    slot.spawnRetryScheduled = false;
    slot.lastSpawnedAtSeconds = mod.GetMatchTimeElapsed();
    clearVehicleSlotRespawnTimer(slot);
}

// Returns remaining whole seconds for the slot's current respawn countdown.
function getVehicleSlotRespawnRemainingSeconds(slot: VehicleSpawnerSlot): number {
    if (slot.respawnReadyAtSeconds < 0) return 0;
    return Math.max(0, Math.ceil(slot.respawnReadyAtSeconds - mod.GetMatchTimeElapsed()));
}
