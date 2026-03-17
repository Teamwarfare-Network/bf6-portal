// @ts-nocheck
// Module: vehicles/spawner-bind -- spawn yaw apply + slot binding by active token/distance

function isAircraftSpawnVolumeVehicleType(vehicleType: mod.VehicleList): boolean {
    switch (vehicleType) {
        case mod.VehicleList.AH64:
        case mod.VehicleList.Eurocopter:
        case mod.VehicleList.UH60:
        case mod.VehicleList.UH60_Pax:
        case mod.VehicleList.F16:
        case mod.VehicleList.F22:
        case mod.VehicleList.JAS39:
        case mod.VehicleList.SU57:
            return true;
        default:
            return false;
    }
}

function isJetSpawnVolumeVehicleType(vehicleType: mod.VehicleList): boolean {
    switch (vehicleType) {
        case mod.VehicleList.F16:
        case mod.VehicleList.F22:
        case mod.VehicleList.JAS39:
        case mod.VehicleList.SU57:
            return true;
        default:
            return false;
    }
}

function isTankSpawnVolumeVehicleType(vehicleType: mod.VehicleList): boolean {
    switch (vehicleType) {
        case mod.VehicleList.Abrams:
        case mod.VehicleList.Leopard:
        case mod.VehicleList.CV90:
        case mod.VehicleList.M2Bradley:
        case mod.VehicleList.Cheetah:
        case mod.VehicleList.Gepard:
            return true;
        default:
            return false;
    }
}

function getSpawnVolumeClassForSlot(slot: VehicleSpawnerSlot): VehicleSlotSpawnCategory | "tank" | undefined {
    if (isAircraftSpawnVolumeVehicleType(slot.vehicleType)) return "attack_chopper";
    if (isTankSpawnVolumeVehicleType(slot.vehicleType)) return "tank";
    return undefined;
}

function createVectorAdd(a: mod.Vector, b: mod.Vector): mod.Vector {
    return mod.CreateVector(
        mod.XComponentOf(a) + mod.XComponentOf(b),
        mod.YComponentOf(a) + mod.YComponentOf(b),
        mod.ZComponentOf(a) + mod.ZComponentOf(b)
    );
}

function getTriangleArea2D(a: mod.Vector, b: mod.Vector, c: mod.Vector): number {
    const abX = mod.XComponentOf(b) - mod.XComponentOf(a);
    const abZ = mod.ZComponentOf(b) - mod.ZComponentOf(a);
    const acX = mod.XComponentOf(c) - mod.XComponentOf(a);
    const acZ = mod.ZComponentOf(c) - mod.ZComponentOf(a);
    return Math.abs((abX * acZ) - (abZ * acX)) * 0.5;
}

function sampleRandomPointInTriangle(a: mod.Vector, b: mod.Vector, c: mod.Vector): mod.Vector {
    const r1 = Math.random();
    const r2 = Math.random();
    const sqrtR1 = Math.sqrt(r1);
    const wA = 1 - sqrtR1;
    const wB = sqrtR1 * (1 - r2);
    const wC = sqrtR1 * r2;
    return mod.CreateVector(
        (mod.XComponentOf(a) * wA) + (mod.XComponentOf(b) * wB) + (mod.XComponentOf(c) * wC),
        (mod.YComponentOf(a) * wA) + (mod.YComponentOf(b) * wB) + (mod.YComponentOf(c) * wC),
        (mod.ZComponentOf(a) * wA) + (mod.ZComponentOf(b) * wB) + (mod.ZComponentOf(c) * wC)
    );
}

function sampleRandomPointInSpawnVolume(volume: VehicleSpawnVolumeSpec, vehicleType: mod.VehicleList): mod.Vector {
    const [a, b, c, d] = volume.floorCorners;
    const areaABC = getTriangleArea2D(a, b, c);
    const areaACD = getTriangleArea2D(a, c, d);
    const chooseFirstTriangle = (areaABC + areaACD) <= 0
        ? true
        : (Math.random() * (areaABC + areaACD)) < areaABC;
    const floorPoint = chooseFirstTriangle
        ? sampleRandomPointInTriangle(a, b, c)
        : sampleRandomPointInTriangle(a, c, d);
    const minHeight = isJetSpawnVolumeVehicleType(vehicleType)
        ? Math.max(0, volume.jetSpawnFloor)
        : 0;
    const maxHeight = isJetSpawnVolumeVehicleType(vehicleType)
        ? Math.max(minHeight, volume.jetSpawnCeiling)
        : Math.max(0, volume.heliSpawnCeiling);
    const randomHeight = minHeight + (Math.random() * Math.max(0, maxHeight - minHeight));
    return createVectorAdd(floorPoint, mod.CreateVector(0, randomHeight, 0));
}

function sampleRandomJetSpawnRotation(volume: VehicleSpawnVolumeSpec): mod.Vector {
    const rotations = [volume.rotPlaneN, volume.rotPlaneE, volume.rotPlaneW, volume.rotPlaneS];
    const index = Math.floor(Math.random() * rotations.length);
    return rotations[index] ?? volume.rotPlaneN;
}

function tryResolveBoundedSpawnTransformForSlot(slot: VehicleSpawnerSlot): { pos: mod.Vector; rot: mod.Vector } | undefined {
    const volumeClass = getSpawnVolumeClassForSlot(slot);
    if (!volumeClass) return undefined;
    const mappedClass: VehicleSpawnVolumeClass = volumeClass === "tank" ? "tank" : "aircraft";
    const volumes = getVehicleSpawnVolumesForTeam(slot.teamId, mappedClass);
    if (!volumes || volumes.length === 0) return undefined;
    const volume = volumes[0];
    if (!volume) return undefined;
    return {
        pos: sampleRandomPointInSpawnVolume(volume, slot.vehicleType),
        rot: isJetSpawnVolumeVehicleType(slot.vehicleType) ? sampleRandomJetSpawnRotation(volume) : volume.rotHeli,
    };
}

async function teleportVehicleToTransform(eventVehicle: mod.Vehicle, pos: mod.Vector, rot: mod.Vector): Promise<void> {
    const yawDeg = mod.YComponentOf(rot);
    const yawRad = yawDeg * Math.PI / 180;
    mod.Teleport(eventVehicle, pos, yawRad);
    await mod.Wait(0);
    mod.Teleport(eventVehicle, pos, yawRad);
}

async function applySpawnYawToVehicle(eventVehicle: mod.Vehicle, slot: VehicleSpawnerSlot): Promise<void> {
    // Enforce the desired spawn transform on the vehicle after it exists (map-specific spawner yaw can drift).
    await teleportVehicleToTransform(eventVehicle, slot.spawnPos, slot.spawnRot);
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
                bindVehicleToSpawnerSlot(activeSlot, vehicleObjId);
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
            bindVehicleToSpawnerSlot(slot, vehicleObjId);
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

