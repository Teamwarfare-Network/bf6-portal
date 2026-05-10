// @ts-nocheck
// Module: vehicles/air-spawn-volume -- air-deploy volume picker + altitude/rotation sampler.
//
// Reads the existing authored `team{N}AircraftSpawnVolumes` (accessed via
// getVehicleSpawnVolumesForTeam(..., "aircraft")) and returns a random sky point plus
// the volume-authored rotation. Jet rotation = volume.rotPlane (may include pitch);
// heli rotation = volume.rotHeli. Altitude is additive on top of the quad floor Y:
// jets sample uniformly in [floorY + jetSpawnFloor, floorY + jetSpawnCeiling]; helis
// sample uniformly in [floorY, floorY + heliSpawnCeiling].
//
// Floor sampling math (`triangleAreaXZ`, `samplePointInTriangle`, `volumeQuadAreaXZ`,
// `sampleRandomFloorPointInVolume`) lives in `spawn-volume-math.ts` and is shared with
// the forward-deploy sampler.
//
// No state mutation, no mod.* side effects beyond mod.CreateVector — call freely per click.

//#region -------------------- Altitude Layering --------------------

function sampleRandomPointInAirVolume(volume: VehicleSpawnVolumeSpec, vehicleType: mod.VehicleList): mod.Vector {
    const floor = sampleRandomFloorPointInVolume(volume);
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

//#endregion ----------------- Altitude Layering --------------------



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
        const a = volumeQuadAreaXZ(v);
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
        ? (volume.rotPlane ?? VEC_ZERO)
        : (volume.rotHeli ?? VEC_ZERO);
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
