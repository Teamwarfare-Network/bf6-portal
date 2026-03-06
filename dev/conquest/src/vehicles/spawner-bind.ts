// @ts-nocheck
// Module: vehicles/spawner-bind -- spawn yaw apply + slot binding by active token/distance

async function applySpawnYawToVehicle(eventVehicle: mod.Vehicle, slot: VehicleSpawnerSlot): Promise<void> {
    // Enforce the desired spawn yaw on the vehicle after it exists (map-specific spawner yaw can drift).
    const pos = slot.spawnPos;
    const yawDeg = mod.YComponentOf(slot.spawnRot);
    const yawRad = yawDeg * Math.PI / 180;
    mod.Teleport(eventVehicle, pos, yawRad);
    await mod.Wait(0);
    mod.Teleport(eventVehicle, pos, yawRad);
}

// Binding uses object position (not vehicle state) because it is stable at spawn time.
// Fallback binding can mis-assign on tight maps if a spawn arrives outside the token window.
function bindSpawnedVehicleToSlot(eventVehicle: mod.Vehicle, vehiclePos: mod.Vector): TeamID | 0 {
    const vehicleObjId = getObjId(eventVehicle);

    const activeIndex = State.vehicles.activeSpawnSlotIndex;
    const activeToken = State.vehicles.activeSpawnToken;
    const activeAt = State.vehicles.activeSpawnRequestedAtSeconds;
    if (activeIndex !== undefined && activeToken !== undefined && activeAt !== undefined) {
        const now = Math.floor(mod.GetMatchTimeElapsed());
        const expired = (now - activeAt) > VEHICLE_SPAWNER_BIND_TIMEOUT_SECONDS;
        if (!expired) {
            const activeSlot = State.vehicles.slots[activeIndex];
            if (activeSlot && activeSlot.enabled && activeSlot.expectingSpawn && activeSlot.spawnRequestToken === activeToken) {
                activeSlot.expectingSpawn = false;
                activeSlot.vehicleId = vehicleObjId;
                activeSlot.respawnRunning = false;
                activeSlot.spawnRetryScheduled = false;
                State.vehicles.vehicleToSlot[vehicleObjId] = activeIndex;
                State.vehicles.activeSpawnSlotIndex = undefined;
                State.vehicles.activeSpawnToken = undefined;
                State.vehicles.activeSpawnRequestedAtSeconds = undefined;
                void applySpawnYawToVehicle(eventVehicle, activeSlot);
                return activeSlot.teamId;
            }
        } else {
            State.vehicles.activeSpawnSlotIndex = undefined;
            State.vehicles.activeSpawnToken = undefined;
            State.vehicles.activeSpawnRequestedAtSeconds = undefined;
        }
    }

    for (let i = 0; i < State.vehicles.slots.length; i++) {
        const slot = State.vehicles.slots[i];
        if (!slot.expectingSpawn) continue;

        const spawnerPos = mod.GetObjectPosition(slot.spawner);
        const d = mod.DistanceBetween(vehiclePos, spawnerPos);
        if (d <= VEHICLE_SPAWNER_BIND_DISTANCE_METERS) {
            slot.expectingSpawn = false;
            slot.vehicleId = vehicleObjId;
            slot.respawnRunning = false;
            slot.spawnRetryScheduled = false;
            State.vehicles.vehicleToSlot[vehicleObjId] = i;
            if (State.vehicles.activeSpawnSlotIndex === i && State.vehicles.activeSpawnToken === slot.spawnRequestToken) {
                State.vehicles.activeSpawnSlotIndex = undefined;
                State.vehicles.activeSpawnToken = undefined;
                State.vehicles.activeSpawnRequestedAtSeconds = undefined;
            }
            void applySpawnYawToVehicle(eventVehicle, slot);
            return slot.teamId;
        }
    }

    return 0;
}

// Locates the first "expectingSpawn" slot within bind distance of the vehicle position.
function findSpawnerSlotByPosition(spawnPos: mod.Vector): number {
    for (let i = 0; i < State.vehicles.slots.length; i++) {
        const slot = State.vehicles.slots[i];
        const spawnerPos = mod.GetObjectPosition(slot.spawner);
        if (mod.DistanceBetween(spawnPos, spawnerPos) <= VEHICLE_SPAWNER_BIND_DISTANCE_METERS) {
            return i;
        }
    }
    return -1;
}

