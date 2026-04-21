// @ts-nocheck
// Module: vehicles/air-spawn-volume -- pure sampling helpers for the air-deploy volume.
//
// Reads the existing authored `team{N}AircraftSpawnVolumes` (accessed via
// getVehicleSpawnVolumesForTeam(..., "aircraft")) and returns a random sky point plus
// the volume-authored rotation. Jet rotation = volume.rotPlane (may include pitch);
// heli rotation = volume.rotHeli. Altitude is additive on top of the quad floor Y:
// jets sample uniformly in [floorY + jetSpawnFloor, floorY + jetSpawnCeiling]; helis
// sample uniformly in [floorY, floorY + heliSpawnCeiling]. Altitude range mirrors the
// behavior in reference_conquest_attempt_b/src/vehicles/spawner-bind.ts:96-114 but is
// written fresh against the current infra — no code ported.
//
// No state mutation, no mod.* side effects beyond mod.CreateVector — call freely per click.

//#region -------------------- Triangle Sampling (air) --------------------

function airTriangleAreaXZ(a: mod.Vector, b: mod.Vector, c: mod.Vector): number {
    const ax = mod.XComponentOf(a);
    const az = mod.ZComponentOf(a);
    const bx = mod.XComponentOf(b);
    const bz = mod.ZComponentOf(b);
    const cx = mod.XComponentOf(c);
    const cz = mod.ZComponentOf(c);
    const cross = (bx - ax) * (cz - az) - (bz - az) * (cx - ax);
    return Math.abs(cross) * 0.5;
}

function airSamplePointInTriangle(a: mod.Vector, b: mod.Vector, c: mod.Vector): mod.Vector {
    const r1 = Math.random();
    const r2 = Math.random();
    const sqrtR1 = Math.sqrt(r1);
    const u = 1 - sqrtR1;
    const v = sqrtR1 * (1 - r2);
    const w = sqrtR1 * r2;
    const x = u * mod.XComponentOf(a) + v * mod.XComponentOf(b) + w * mod.XComponentOf(c);
    const y = u * mod.YComponentOf(a) + v * mod.YComponentOf(b) + w * mod.YComponentOf(c);
    const z = u * mod.ZComponentOf(a) + v * mod.ZComponentOf(b) + w * mod.ZComponentOf(c);
    return mod.CreateVector(x, y, z);
}

function airVolumeQuadAreaXZ(volume: VehicleSpawnVolumeSpec): number {
    const [a, b, c, d] = volume.floorCorners;
    return airTriangleAreaXZ(a, b, c) + airTriangleAreaXZ(a, c, d);
}

function sampleRandomFloorPointInAirVolume(volume: VehicleSpawnVolumeSpec): mod.Vector {
    const [a, b, c, d] = volume.floorCorners;
    const area1 = airTriangleAreaXZ(a, b, c);
    const area2 = airTriangleAreaXZ(a, c, d);
    const total = area1 + area2;
    if (total <= 0) return airSamplePointInTriangle(a, b, c);
    const pick = Math.random() * total;
    return pick < area1
        ? airSamplePointInTriangle(a, b, c)
        : airSamplePointInTriangle(a, c, d);
}

function sampleRandomPointInAirVolume(volume: VehicleSpawnVolumeSpec, vehicleType: mod.VehicleList): mod.Vector {
    const floor = sampleRandomFloorPointInAirVolume(volume);
    const isJet = isJetVehicleType(vehicleType);
    const minH = isJet ? Math.max(0, volume.jetSpawnFloor ?? 0) : 0;
    const maxH = isJet
        ? Math.max(minH, volume.jetSpawnCeiling ?? 0)
        : Math.max(0, volume.heliSpawnCeiling ?? 0);
    const yOffset = minH + Math.random() * Math.max(0, maxH - minH);
    return mod.CreateVector(
        mod.XComponentOf(floor),
        mod.YComponentOf(floor) + yOffset,
        mod.ZComponentOf(floor)
    );
}

//#endregion ----------------- Triangle Sampling (air) --------------------



//#region -------------------- Volume Selection (air) --------------------

// Picks one enabled aircraft volume for the team, weighted by surface area.
function pickAirVolumeForTeam(teamId: TeamID): VehicleSpawnVolumeSpec | undefined {
    const all = getVehicleSpawnVolumesForTeam(teamId, "aircraft");
    const enabled: VehicleSpawnVolumeSpec[] = [];
    for (const v of all) {
        if (!v) continue;
        if (v.enabled === false) continue;
        enabled.push(v);
    }
    if (enabled.length === 0) return undefined;
    if (enabled.length === 1) return enabled[0];

    let totalArea = 0;
    const areas: number[] = [];
    for (const v of enabled) {
        const a = airVolumeQuadAreaXZ(v);
        areas.push(a);
        totalArea += a;
    }
    if (totalArea <= 0) return enabled[0];

    let pick = Math.random() * totalArea;
    for (let i = 0; i < enabled.length; i++) {
        pick -= areas[i];
        if (pick <= 0) return enabled[i];
    }
    return enabled[enabled.length - 1];
}

// Composes a single air-deploy transform for a slot, or undefined when no enabled volume
// exists for the slot's team. Rotation: jet → rotPlane, heli → rotHeli; both fall back
// to the zero vector when the author left the field unset.
function sampleAirSpawnTransformForSlot(slot: VehicleSpawnerSlot | undefined): { pos: mod.Vector; rot: mod.Vector } | undefined {
    if (!slot) return undefined;
    const volume = pickAirVolumeForTeam(slot.teamId);
    if (!volume) return undefined;
    const pos = sampleRandomPointInAirVolume(volume, slot.vehicleType);
    const isJet = isJetVehicleType(slot.vehicleType);
    const rot = isJet
        ? (volume.rotPlane ?? mod.CreateVector(0, 0, 0))
        : (volume.rotHeli ?? mod.CreateVector(0, 0, 0));
    return { pos, rot };
}

// Seeds slot.nextAirPos / slot.nextAirRot so a subsequent air click can fire without
// re-sampling. No-op for non-aircraft slots. Safe to call repeatedly; leaves fields
// undefined when no aircraft volume is authored for the slot's team.
function seedNextAirTransformForSlot(slot: VehicleSpawnerSlot | undefined): void {
    if (!slot) return;
    if (!isAircraftVehicleType(slot.vehicleType)) {
        slot.nextAirPos = undefined;
        slot.nextAirRot = undefined;
        return;
    }
    const transform = sampleAirSpawnTransformForSlot(slot);
    if (!transform) {
        slot.nextAirPos = undefined;
        slot.nextAirRot = undefined;
        return;
    }
    slot.nextAirPos = transform.pos;
    slot.nextAirRot = transform.rot;
}

//#endregion ----------------- Volume Selection (air) --------------------
