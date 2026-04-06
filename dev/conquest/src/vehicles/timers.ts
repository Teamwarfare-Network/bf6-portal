// @ts-nocheck
// Module: vehicles/timers -- authoritative per-slot respawn timer ownership for Phase 5 vehicle systems

function resolveVehicleSlotSpawnCategory(vehicleType: mod.VehicleList): VehicleSlotSpawnCategory {
    switch (vehicleType) {
        case mod.VehicleList.AH64:
        case mod.VehicleList.Eurocopter:
        case VEHICLE_AH6M:
            return "attack_chopper";
        case mod.VehicleList.UH60:
        case mod.VehicleList.UH60_Pax:
            return "transport_chopper";
        case mod.VehicleList.F16:
        case mod.VehicleList.F22:
        case mod.VehicleList.JAS39:
        case mod.VehicleList.SU57:
            return "jet";
        case mod.VehicleList.Abrams:
        case mod.VehicleList.Leopard:
        case mod.VehicleList.M2Bradley:
        case mod.VehicleList.CV90:
        case mod.VehicleList.Cheetah:
        case mod.VehicleList.Gepard:
            return "ground_vehicle";
        case mod.VehicleList.Marauder:
        case mod.VehicleList.Marauder_Pax:
        case mod.VehicleList.Quadbike:
        case mod.VehicleList.GolfCart:
        case mod.VehicleList.Flyer60:
            return "fast_mover";
        default:
            return "other";
    }
}

function shouldTrackVehicleSlotForDeployFlow(slot: VehicleSpawnerSlot): boolean {
    if (ACTIVE_MAP_KEY !== "Operation_Firestorm") return false;
    return (
        slot.spawnCategory === "attack_chopper"
        || slot.spawnCategory === "transport_chopper"
        || slot.spawnCategory === "jet"
        || slot.spawnCategory === "ground_vehicle"
        || slot.spawnCategory === "fast_mover"
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

// Schedules the authoritative respawn countdown for a slot and launches a self-terminating HUD loop.
function scheduleVehicleSlotRespawnTimer(slot: VehicleSpawnerSlot, delaySeconds: number): void {
    const now = mod.GetMatchTimeElapsed();
    slot.respawnDelaySeconds = delaySeconds;
    slot.respawnQueuedAtSeconds = now;
    slot.respawnReadyAtSeconds = now + delaySeconds;
    refreshVehicleSlotAuthoritativeState(slot);
    void runVehicleSlotCooldownHudLoop(slot);
}

// Self-terminating async loop that drives HUD countdown updates for one slot's cooldown.
// Ticks once per second, updating only players who have the deploy timer HUD visible.
// Terminates when the slot is disabled, timer is cleared, or countdown reaches 0.
async function runVehicleSlotCooldownHudLoop(slot: VehicleSpawnerSlot): Promise<void> {
    const token = slot.enableToken;
    const readyAt = slot.respawnReadyAtSeconds;
    if (readyAt < 0) return;

    while (true) {
        await mod.Wait(1.0);
        if (!slot.enabled || slot.enableToken !== token) return;
        if (slot.respawnReadyAtSeconds !== readyAt) return;
        const remaining = getVehicleSlotRespawnRemainingSeconds(slot);
        if (remaining <= 0) {
            updateVehicleDeployTimerHudForAllPlayers();
            return;
        }
        updateVehicleDeployTimerHudForViewers();
    }
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

