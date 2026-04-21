// @ts-nocheck
// Module: vehicles/forward-spawn-volume -- pure sampling helpers for the forward-deploy volume.
//
// Reads the existing authored `team{N}TankSpawnVolumes` (accessed via
// getVehicleSpawnVolumesForTeam(..., "tank")) and returns a random surface point + rotTank.
// No state mutation, no mod.* side effects beyond mod.CreateVector — call freely per click.
//
// Triangle sampling: split the 4-corner quad into [a,b,c] + [a,c,d], weight each by 2D area
// in the X/Z plane, pick one, sample barycentric via (1 - sqrt(r1), sqrt(r1)*(1 - r2),
// sqrt(r1)*r2). Height comes from the quad's own Y (all four corners assumed near-planar).

//#region -------------------- Triangle Sampling --------------------

function triangleAreaXZ(a: mod.Vector, b: mod.Vector, c: mod.Vector): number {
    const ax = mod.XComponentOf(a);
    const az = mod.ZComponentOf(a);
    const bx = mod.XComponentOf(b);
    const bz = mod.ZComponentOf(b);
    const cx = mod.XComponentOf(c);
    const cz = mod.ZComponentOf(c);
    const cross = (bx - ax) * (cz - az) - (bz - az) * (cx - ax);
    return Math.abs(cross) * 0.5;
}

function samplePointInTriangle(a: mod.Vector, b: mod.Vector, c: mod.Vector): mod.Vector {
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

function sampleRandomPointInForwardVolume(volume: VehicleSpawnVolumeSpec): mod.Vector {
    const [a, b, c, d] = volume.floorCorners;
    const area1 = triangleAreaXZ(a, b, c);
    const area2 = triangleAreaXZ(a, c, d);
    const total = area1 + area2;
    if (total <= 0) return samplePointInTriangle(a, b, c);
    const pick = Math.random() * total;
    return pick < area1
        ? samplePointInTriangle(a, b, c)
        : samplePointInTriangle(a, c, d);
}

//#endregion ----------------- Triangle Sampling --------------------



//#region -------------------- Volume Selection --------------------

function volumeQuadAreaXZ(volume: VehicleSpawnVolumeSpec): number {
    const [a, b, c, d] = volume.floorCorners;
    return triangleAreaXZ(a, b, c) + triangleAreaXZ(a, c, d);
}

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
    const pos = sampleRandomPointInForwardVolume(volume);
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
