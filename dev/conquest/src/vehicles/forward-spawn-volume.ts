// @ts-nocheck
// Module: vehicles/forward-spawn-volume -- forward-deploy volume picker + transform sampler.
//
// Reads the existing authored `team{N}TankSpawnVolumes` (accessed via
// getVehicleSpawnVolumesForTeam(..., "tank")) and returns a random surface point + rotTank.
// No state mutation, no mod.* side effects beyond mod.CreateVector — call freely per click.
//
// Math helpers (`triangleAreaXZ`, `samplePointInTriangle`, `volumeQuadAreaXZ`,
// `sampleRandomFloorPointInVolume`) live in `spawn-volume-math.ts` and are shared with the
// air-deploy sampler.

//#region -------------------- Volume Selection --------------------

// Picks one enabled forward volume for the team, weighted by surface area.
function pickForwardVolumeForTeam(teamId: TeamID): VehicleSpawnVolumeSpec | undefined {
    const all = getVehicleSpawnVolumesForTeam(teamId, "tank");
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

// Composes a single forward-deploy transform for a slot, or undefined when no enabled volume
// exists for the slot's team. Rotation comes from volume.rotTank (falls back to slot.spawnRot).
function sampleForwardSpawnTransformForSlot(slot: VehicleSpawnerSlot | undefined): { pos: mod.Vector; rot: mod.Vector } | undefined {
    if (!slot) return undefined;
    const volume = pickForwardVolumeForTeam(slot.teamId);
    if (!volume) return undefined;
    const pos = sampleRandomFloorPointInVolume(volume);
    const rot = volume.rotTank ?? slot.spawnRot;
    return { pos, rot };
}

// Seeds slot.nextForwardPos / slot.nextForwardRot so a subsequent forward click can fire
// without re-sampling. Safe to call repeatedly; leaves fields undefined when unsupported.
function seedNextForwardTransformForSlot(slot: VehicleSpawnerSlot | undefined): void {
    if (!slot) return;
    if (isAircraftVehicleType(slot.vehicleType)) {
        slot.nextForwardPos = undefined;
        slot.nextForwardRot = undefined;
        return;
    }
    const transform = sampleForwardSpawnTransformForSlot(slot);
    if (!transform) {
        slot.nextForwardPos = undefined;
        slot.nextForwardRot = undefined;
        return;
    }
    slot.nextForwardPos = transform.pos;
    slot.nextForwardRot = transform.rot;
}

//#endregion ----------------- Volume Selection --------------------
