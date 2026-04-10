// @ts-nocheck
// Module: vehicles/spawner-bind -- spawn yaw apply + slot binding by active token/distance

function isAircraftSpawnVolumeVehicleType(vehicleType: mod.VehicleList): boolean {
    return isAircraftVehicleType(vehicleType);
}

function isJetSpawnVolumeVehicleType(vehicleType: mod.VehicleList): boolean {
    return isJetVehicleType(vehicleType);
}

function isTankSpawnVolumeVehicleType(vehicleType: mod.VehicleList): boolean {
    return isTankVehicleType(vehicleType);
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

function getSpawnVolumeFootprintArea(volume: VehicleSpawnVolumeSpec): number {
    const [a, b, c, d] = volume.floorCorners;
    return getTriangleArea2D(a, b, c) + getTriangleArea2D(a, c, d);
}

function getSpawnVolumeSelectionWeight(volume: VehicleSpawnVolumeSpec, vehicleType: mod.VehicleList): number {
    const footprintArea = getSpawnVolumeFootprintArea(volume);
    if (!Number.isFinite(footprintArea) || footprintArea <= 0) return 0;
    if (isTankSpawnVolumeVehicleType(vehicleType)) return footprintArea;
    if (isJetSpawnVolumeVehicleType(vehicleType)) {
        const jetBand = Math.max(0, volume.jetSpawnCeiling - Math.max(0, volume.jetSpawnFloor));
        return footprintArea * Math.max(1, jetBand);
    }
    return footprintArea * Math.max(1, Math.max(0, volume.heliSpawnCeiling));
}

function chooseSpawnVolumeForVehicleType(
    volumes: VehicleSpawnVolumeSpec[],
    vehicleType: mod.VehicleList
): VehicleSpawnVolumeSpec | undefined {
    if (!volumes || volumes.length <= 0) return undefined;
    let totalWeight = 0;
    const weights: number[] = [];
    for (let i = 0; i < volumes.length; i++) {
        const weight = getSpawnVolumeSelectionWeight(volumes[i], vehicleType);
        weights[i] = weight;
        totalWeight += weight;
    }
    if (totalWeight <= 0) {
        const fallbackIndex = Math.floor(Math.random() * volumes.length);
        return volumes[fallbackIndex];
    }

    let threshold = Math.random() * totalWeight;
    for (let i = 0; i < volumes.length; i++) {
        threshold -= weights[i];
        if (threshold <= 0) {
            return volumes[i];
        }
    }
    return volumes[volumes.length - 1];
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

function tryResolveBoundedSpawnTransformForSlot(slot: VehicleSpawnerSlot): { pos: mod.Vector; rot: mod.Vector } | undefined {
    const volumeClass = getSpawnVolumeClassForSlot(slot);
    if (!volumeClass) return undefined;
    const mappedClass: VehicleSpawnVolumeClass = volumeClass === "tank" ? "tank" : "aircraft";
    const volumes = getVehicleSpawnVolumesForTeam(slot.teamId, mappedClass);
    if (!volumes || volumes.length === 0) return undefined;
    const volume = chooseSpawnVolumeForVehicleType(volumes, slot.vehicleType);
    if (!volume) return undefined;
    return {
        pos: sampleRandomPointInSpawnVolume(volume, slot.vehicleType),
        rot: isJetSpawnVolumeVehicleType(slot.vehicleType) ? volume.rotPlane : volume.rotHeli,
    };
}

function normalizeAircraftBirthRotationAxisToRadians(value: number): number {
    return Math.abs(value) > (Math.PI * 2)
        ? mod.DegreesToRadians(value)
        : value;
}

function normalizeAircraftBirthPitchXToRadians(slot: VehicleSpawnerSlot, value: number): number {
    if (!isJetSpawnVolumeVehicleType(slot.vehicleType)) {
        return normalizeAircraftBirthRotationAxisToRadians(value);
    }
    // Legacy bounded-air jet pitch was authored with the opposite sign assumption.
    // Current birth-spawn testing showed positive X is the usable nose-down direction.
    if (Math.abs(value) > (Math.PI * 2)) {
        return mod.DegreesToRadians(Math.abs(value));
    }
    return value;
}

function createAircraftBirthSpawnRotationForSlot(slot: VehicleSpawnerSlot, rot: mod.Vector): mod.Vector {
    return mod.CreateVector(
        normalizeAircraftBirthPitchXToRadians(slot, mod.XComponentOf(rot)),
        normalizeAircraftBirthRotationAxisToRadians(mod.YComponentOf(rot)),
        normalizeAircraftBirthRotationAxisToRadians(mod.ZComponentOf(rot))
    );
}

function tryResolveFreshAircraftBirthSpawnForSlot(slot: VehicleSpawnerSlot): { pos: mod.Vector; rot: mod.Vector } | undefined {
    if (!isAircraftSpawnVolumeVehicleType(slot.vehicleType)) return undefined;
    const boundedTransform = tryResolveBoundedSpawnTransformForSlot(slot);
    if (!boundedTransform) return undefined;
    return {
        pos: boundedTransform.pos,
        rot: createAircraftBirthSpawnRotationForSlot(slot, boundedTransform.rot),
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

async function maybeApplySpawnTransformCorrectionToVehicle(eventVehicle: mod.Vehicle, slot: VehicleSpawnerSlot): Promise<void> {
    if (slot.suppressNextBindSpawnTransformCorrection) {
        slot.suppressNextBindSpawnTransformCorrection = false;
        return;
    }
    await applySpawnYawToVehicle(eventVehicle, slot);
}

// CQ_Bug_49: Rejects a spawned vehicle that is positively identified as a tank when the slot is
// configured for an aircraft. Used to block the engine-default Abrams from `RuntimeSpawn_Common.VehicleSpawner`
// from binding to a heli/jet slot via active tracking or position fallback. Does NOT unspawn the
// rejected vehicle — the bind-retry path in `onVehicleSpawnedImpl` may still reference it, and the
// fresh-aircraft caller runs a post-spawn sweep at the birth-spawn position to reap the orphan
// once binding of the real aircraft has completed.
function rejectWrongCategoryBindForAircraftSlot(slot: VehicleSpawnerSlot, eventVehicle: mod.Vehicle): boolean {
    if (!isAircraftSpawnVolumeVehicleType(slot.vehicleType)) return false;
    if (!isTankVehicleInstance(eventVehicle)) return false;
    return true;
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
                // CQ_Bug_49: reject wrong-category bind but leave active tracking armed so the real
                // aircraft spawn (forced by ForceVehicleSpawnerSpawn with the configured type) can
                // bind on its own OnVehicleSpawned event.
                if (rejectWrongCategoryBindForAircraftSlot(activeSlot, eventVehicle)) {
                    return 0;
                }
                activeSlot.expectingSpawn = false;
                bindVehicleToSpawnerSlot(activeSlot, vehicleObjId);
                State.vehicles.vehicleToSlot[vehicleObjId] = activeIndex;
                State.vehicles.activeSpawnSlotIndex = undefined;
                State.vehicles.activeSpawnToken = undefined;
                State.vehicles.activeSpawnRequestedAtSeconds = undefined;
                void maybeApplySpawnTransformCorrectionToVehicle(eventVehicle, activeSlot);
                return activeSlot.teamId;
            }
        } else {
            // CQ_Bug_52: release global tracking AND the tracked slot's expectingSpawn flag.
            // Without this, an aircraft birth-spawn landing more than VEHICLE_SPAWNER_BIND_TIMEOUT_SECONDS
            // after the click (fresh-air fallback path is far from slot.spawner and fails the distance
            // bind) leaves expectingSpawn latched and every subsequent click is silently rejected.
            State.vehicles.activeSpawnSlotIndex = undefined;
            State.vehicles.activeSpawnToken = undefined;
            State.vehicles.activeSpawnRequestedAtSeconds = undefined;
            const expiredSlot = State.vehicles.slots[activeIndex];
            if (expiredSlot && expiredSlot.expectingSpawn) {
                expiredSlot.expectingSpawn = false;
                refreshVehicleSlotAuthoritativeState(expiredSlot);
                updateVehicleDeployTimerHudForAllPlayers();
            }
        }
    }

    for (let i = 0; i < State.vehicles.slots.length; i++) {
        const slot = State.vehicles.slots[i];
        if (!slot.expectingSpawn) continue;

        const spawnerPos = mod.GetObjectPosition(slot.spawner);
        const d = mod.DistanceBetween(vehiclePos, spawnerPos);
        if (d <= VEHICLE_SPAWNER_BIND_DISTANCE_METERS) {
            // CQ_Bug_49: same reject rule applies to the distance fallback path.
            if (rejectWrongCategoryBindForAircraftSlot(slot, eventVehicle)) {
                return 0;
            }
            slot.expectingSpawn = false;
            bindVehicleToSpawnerSlot(slot, vehicleObjId);
            State.vehicles.vehicleToSlot[vehicleObjId] = i;
            if (State.vehicles.activeSpawnSlotIndex === i && State.vehicles.activeSpawnToken === slot.spawnRequestToken) {
                State.vehicles.activeSpawnSlotIndex = undefined;
                State.vehicles.activeSpawnToken = undefined;
                State.vehicles.activeSpawnRequestedAtSeconds = undefined;
            }
            void maybeApplySpawnTransformCorrectionToVehicle(eventVehicle, slot);
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


