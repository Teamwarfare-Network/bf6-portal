// @ts-nocheck
// Module: vehicles/timers -- authoritative per-slot respawn timer ownership for Phase 5 vehicle systems

function resolveVehicleSlotSpawnCategory(vehicleType: mod.VehicleList): VehicleSlotSpawnCategory {
    switch (vehicleType) {
        case mod.VehicleList.AH64:
        case mod.VehicleList.Eurocopter:
            return "attack_chopper";
        case mod.VehicleList.UH60:
        case mod.VehicleList.UH60_Pax:
            return "transport_chopper";
        default:
            return "other";
    }
}

function shouldTrackVehicleSlotForDeployFlow(slot: VehicleSpawnerSlot): boolean {
    if (ACTIVE_MAP_KEY !== "Operation_Firestorm") return false;
    if (!isHeliGameMode(State.round.modeConfig.confirmed.gameMode)) return false;
    return (
        slot.spawnCategory === "attack_chopper"
        || slot.spawnCategory === "transport_chopper"
    );
}

function shouldGateVehicleSlotSpawnUntilReservationDeploy(slot: VehicleSpawnerSlot): boolean {
    return slot.deployFlowTracked;
}

function isVehicleSlotReadyForReservationDeploy(slot: VehicleSpawnerSlot): boolean {
    return slot.enabled
        && shouldGateVehicleSlotSpawnUntilReservationDeploy(slot)
        && slot.vehicleId === -1
        && !slot.expectingSpawn
        && !slot.respawnRunning
        && !slot.spawnRetryScheduled
        && getVehicleSlotRespawnRemainingSeconds(slot) <= 0;
}

// Recomputes authoritative slot metadata used by later deploy-screen/timer/queue work.
// This must stay behavior-neutral for current spawning; it describes slot state, it does not drive new flows yet.
function refreshVehicleSlotAuthoritativeState(slot: VehicleSpawnerSlot): void {
    slot.spawnCategory = resolveVehicleSlotSpawnCategory(slot.vehicleType);
    slot.deployFlowTracked = shouldTrackVehicleSlotForDeployFlow(slot);
    validateVehicleSlotReservationState(slot);

    if (!slot.enabled) {
        slot.availabilityPhase = "DISABLED";
        return;
    }
    if (slot.expectingSpawn) {
        slot.availabilityPhase = "SPAWN_REQUESTED";
        return;
    }
    if (slot.vehicleId !== -1) {
        slot.availabilityPhase = "ACTIVE";
        return;
    }
    if (slot.respawnReadyAtSeconds >= 0) {
        slot.availabilityPhase = getVehicleSlotRespawnRemainingSeconds(slot) > 0
            ? "RESPAWN_PENDING"
            : "RESPAWN_READY";
        return;
    }
    slot.availabilityPhase = "EMPTY_ENABLED";
}

// Initializes authoritative timer fields for one spawner slot.
// Keep timer truth here so future HUD rendering reads one source of truth instead of inferring from waits.
function initializeVehicleSlotTimerState(slot: VehicleSpawnerSlot): void {
    slot.respawnDelaySeconds = VEHICLE_SPAWNER_RESPAWN_DELAY_SECONDS;
    slot.respawnQueuedAtSeconds = -1;
    slot.respawnReadyAtSeconds = -1;
    slot.lastSpawnedAtSeconds = -1;
    slot.lastDestroyedAtSeconds = -1;
    slot.lastMissingAtSeconds = -1;
    refreshVehicleSlotAuthoritativeState(slot);
}

// Clears any active respawn/retry countdown for a slot without changing its bound vehicle identity.
function clearVehicleSlotRespawnTimer(slot: VehicleSpawnerSlot): void {
    slot.respawnQueuedAtSeconds = -1;
    slot.respawnReadyAtSeconds = -1;
    refreshVehicleSlotAuthoritativeState(slot);
}

// Schedules the authoritative respawn countdown for a slot.
function scheduleVehicleSlotRespawnTimer(slot: VehicleSpawnerSlot, delaySeconds: number): void {
    const now = mod.GetMatchTimeElapsed();
    slot.respawnDelaySeconds = delaySeconds;
    slot.respawnQueuedAtSeconds = now;
    slot.respawnReadyAtSeconds = now + delaySeconds;
    refreshVehicleSlotAuthoritativeState(slot);
}

// Records a successful bind/spawn and clears any prior respawn countdown for the slot.
function bindVehicleToSpawnerSlot(slot: VehicleSpawnerSlot, vehicleObjId: number): void {
    slot.vehicleId = vehicleObjId;
    slot.respawnRunning = false;
    slot.spawnRetryScheduled = false;
    slot.lastSpawnedAtSeconds = mod.GetMatchTimeElapsed();
    clearVehicleSlotRespawnTimer(slot);
    refreshVehicleSlotAuthoritativeState(slot);
}

function markVehicleSlotDestroyed(slot: VehicleSpawnerSlot): void {
    slot.lastDestroyedAtSeconds = mod.GetMatchTimeElapsed();
    refreshVehicleSlotAuthoritativeState(slot);
}

function markVehicleSlotMissing(slot: VehicleSpawnerSlot): void {
    slot.lastMissingAtSeconds = mod.GetMatchTimeElapsed();
    refreshVehicleSlotAuthoritativeState(slot);
}

// Returns remaining whole seconds for the slot's current respawn countdown.
function getVehicleSlotRespawnRemainingSeconds(slot: VehicleSpawnerSlot): number {
    if (slot.respawnReadyAtSeconds < 0) return 0;
    return Math.max(0, Math.ceil(slot.respawnReadyAtSeconds - mod.GetMatchTimeElapsed()));
}
