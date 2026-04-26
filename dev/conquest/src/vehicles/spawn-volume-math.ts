// @ts-nocheck
// Module: vehicles/spawn-volume-math -- shared pure math for spawn-volume sampling.
// Consumed by forward-spawn-volume.ts (Forward Deploy) and air-spawn-volume.ts (Air Deploy).
// No state mutation, no mod.* side effects beyond mod.CreateVector. Safe to call freely.
//
// Triangle sampling: split a 4-corner quad into [a,b,c] + [a,c,d], weight each by 2D area
// in the X/Z plane, pick one, sample barycentric via (1 - sqrt(r1), sqrt(r1)*(1 - r2),
// sqrt(r1)*r2). Y is interpolated from the corner Ys (assumed near-planar for forward;
// air callers add altitude offset on top of the returned floor Y).

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

function volumeQuadAreaXZ(volume: VehicleSpawnVolumeSpec): number {
    const [a, b, c, d] = volume.floorCorners;
    return triangleAreaXZ(a, b, c) + triangleAreaXZ(a, c, d);
}

// Samples a uniform random point on the quad-fan floor of a 4-corner volume. Triangle-area-
// weighted across the two fan triangles to avoid sampling bias when triangles differ in size.
function sampleRandomFloorPointInVolume(volume: VehicleSpawnVolumeSpec): mod.Vector {
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
