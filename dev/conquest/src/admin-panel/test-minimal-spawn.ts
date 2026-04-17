// @ts-nocheck
// Module: admin-panel/test-minimal-spawn -- isolated SDK spawn+teleport+seat pattern for Phase 1 diagnostic (v1.235)
//
// Purpose: a self-contained admin-panel row that reproduces the canonical BF6 SDK pattern for
// vehicle spawn and player seating, WITHOUT any conquest workaround layer
// (activeSpawn* singleton, CQ_Bug_49 Abrams-reject, rejectWrongCategoryBindForAircraftSlot,
//  suppressNextBindSpawnTransformCorrection, applySpawnYawToVehicle post-bind correction,
//  40m radius fallback, per-slot expectingSpawn/spawnRequestToken bookkeeping, retry loop).
//
// Why the file exists: after SDK 1.2.3 shipped "Corrected vehicle spawner behaviour" and
// "Corrected vehicle event behaviour so events now fire correctly for every seat", the production
// deploy path still fails for F22/AH64/MH6 (Air + HQ) while F16 succeeds everywhere.
// Running the clean pattern here lets us tell whether (a) the SDK is still bugged, or
// (b) our workaround layer is now the cause. That decides Phase 2's direction.
//
// Deliberate design notes:
// - Pre-seat teleport to (vehicle.pos + 5m Y) IS used here. The project memory notes a ban on
//   pre-seat teleport (v1.106-v1.108, v1.151-v1.154) — that ban may have been over-scoped to
//   specific wrong offsets/timings. This test is the instrument to learn whether the general
//   pattern works. Do NOT copy this teleport into the production fulfillment path yet.
// - The test spawner is runtime-created via mod.SpawnObject(RuntimeSpawn_Common.VehicleSpawner).
//   That prefab has AutoSpawn=true baked in (CQ_Bug_54 historical race) — we immediately flip it
//   off and we do NOT care if an interim Abrams spawns, because test success is measured by whether
//   a vehicle of the REQUESTED type appears after ForceVehicleSpawnerSpawn, not by AutoSpawn purity.
// - Cleanup is per-player: a new click replaces the previous test artefacts. Round end is expected
//   to also clean up (orphans would count against the test harness in logs).

const MIN_SPAWN_TEST_FORWARD_DISTANCE_METERS = 30.0;
const MIN_SPAWN_TEST_SPAWN_WAIT_TIMEOUT_SECONDS = 5.0;
const MIN_SPAWN_TEST_SPAWN_POLL_INTERVAL_SECONDS = 0.25;
const MIN_SPAWN_TEST_PRE_TELEPORT_Y_OFFSET_METERS = 5.0;
const MIN_SPAWN_TEST_SETTLE_SECONDS = 0.2;
const MIN_SPAWN_TEST_PRE_SEAT_WAIT_SECONDS = 0.2;
const MIN_SPAWN_TEST_POST_SEAT_WAIT_SECONDS = 0.3;
const MIN_SPAWN_TEST_SEAT_INDEX_ANY = -1;

// Per-player cleanup state. Tracks the most-recent spawner+vehicle so a repeat click on any of the
// five buttons can UnspawnObject the previous test artefacts before starting a new one.
// Keyed by admin player pid (GetObjId on the mod.Player).
interface MinimalSpawnTestSlot {
    spawner?: mod.Object;
    spawnerObjId?: number;
    vehicle?: mod.Vehicle;
    vehicleObjId?: number;
    inFlight: boolean;
}
const minimalSpawnTestSlotByPid: { [pid: number]: MinimalSpawnTestSlot } = {};

// Returns a stable per-player slot, creating it on first use.
function getMinimalSpawnTestSlot(pid: number): MinimalSpawnTestSlot {
    let slot = minimalSpawnTestSlotByPid[pid];
    if (!slot) {
        slot = { inFlight: false };
        minimalSpawnTestSlotByPid[pid] = slot;
    }
    return slot;
}

// Tears down the previous test's spawner + vehicle for this player before a fresh click runs.
// UnspawnObject failures are swallowed because the engine may have already removed the object
// (round end, manual cleanup, or the vehicle being despawned by the abandon system).
function cleanupMinimalSpawnTestArtefactsForPid(pid: number): void {
    const slot = minimalSpawnTestSlotByPid[pid];
    if (!slot) return;
    if (slot.vehicle) {
        try { mod.UnspawnObject(slot.vehicle); } catch {}
    }
    if (slot.spawner) {
        try { mod.UnspawnObject(slot.spawner); } catch {}
    }
    slot.spawner = undefined;
    slot.spawnerObjId = undefined;
    slot.vehicle = undefined;
    slot.vehicleObjId = undefined;
}

// Computes the test spawn target as playerPos + forwardFacing * 30m, keeping the player's Y.
// Returns undefined if the soldier state is unavailable (e.g., player is not deployed).
// Note: the raw FacingDirection may have a non-zero Y component; we zero it before use so the
// target stays at soldier height, which keeps the vehicle on the ground for ground vehicles and
// gives aircraft a stable initial pose rather than a facing-aligned dive/climb.
function resolveMinimalSpawnTestTargetTransform(player: mod.Player): { pos: mod.Vector; rot: mod.Vector } | undefined {
    const playerPos = safeGetSoldierStateVector(player, mod.SoldierStateVector.GetPosition);
    if (!playerPos) return undefined;
    const facing = safeGetSoldierStateVector(player, mod.SoldierStateVector.GetFacingDirection);
    if (!facing) return undefined;

    const fx = mod.XComponentOf(facing);
    const fz = mod.ZComponentOf(facing);
    const planarMag = Math.sqrt((fx * fx) + (fz * fz));
    const safeMag = planarMag < 0.0001 ? 1.0 : planarMag;
    const dirX = fx / safeMag;
    const dirZ = fz / safeMag;

    const targetX = mod.XComponentOf(playerPos) + (dirX * MIN_SPAWN_TEST_FORWARD_DISTANCE_METERS);
    const targetY = mod.YComponentOf(playerPos);
    const targetZ = mod.ZComponentOf(playerPos) + (dirZ * MIN_SPAWN_TEST_FORWARD_DISTANCE_METERS);

    const pos = mod.CreateVector(targetX, targetY, targetZ);
    const rot = mod.CreateVector(0, 0, 0);
    return { pos, rot };
}

// Polls mod.AllVehicles() until a vehicle matching vehicleType appears within radius of targetPos,
// or the timeout elapses. Returns the vehicle or undefined.
// We deliberately do NOT subscribe to OnVehicleSpawned here — this test must work without touching
// the event layer, which has its own bind/reject paths we want to bypass for the diagnostic.
async function waitForMinimalSpawnTestVehicle(
    vehicleType: mod.VehicleList,
    targetPos: mod.Vector,
    radiusMeters: number
): Promise<mod.Vehicle | undefined> {
    const deadlineSeconds = mod.GetMatchTimeElapsed() + MIN_SPAWN_TEST_SPAWN_WAIT_TIMEOUT_SECONDS;
    while (mod.GetMatchTimeElapsed() < deadlineSeconds) {
        const vehicles = mod.AllVehicles();
        const count = mod.CountOf(vehicles);
        for (let i = 0; i < count; i++) {
            const v = mod.ValueInArray(vehicles, i) as mod.Vehicle;
            if (!v) continue;
            let vPos: mod.Vector | undefined;
            try { vPos = mod.GetObjectPosition(v); } catch { continue; }
            if (!vPos) continue;
            if (mod.DistanceBetween(vPos, targetPos) > radiusMeters) continue;
            // Accept any vehicle in the blast radius; the caller logs whether it matched vehicleType.
            // This is diagnostic: we want to observe AutoSpawn Abrams substitutions too.
            return v;
        }
        await mod.Wait(MIN_SPAWN_TEST_SPAWN_POLL_INTERVAL_SECONDS);
    }
    return undefined;
}

// Compares a spawned vehicle against the requested type using the standard CompareVehicleName API.
// Returns true on a positive match, false otherwise. Used only for post-hoc logging (world log),
// NOT to drive logic — the whole point of this test is to observe whatever the SDK actually did.
function isMinimalSpawnTestVehicleMatchingRequestedType(vehicle: mod.Vehicle, vehicleType: mod.VehicleList): boolean {
    if (!vehicle) return false;
    try { return mod.CompareVehicleName(vehicle, vehicleType); } catch { return false; }
}

// Teleport-variant matrix for the isolated spawn test. Each button configures ONE axis of the
// ForcePlayerToSeat sequence so we can bisect what's missing between our isolated call and the
// production path (which works for F16). The 2026-04-15 run showed all five original F16 buttons
// failed to seat (identical teleport+5Y / wait 0.2s / seat=-1 pattern), so this variant set
// intentionally mirrors production's index=0 and offers no-teleport branches.
interface MinimalSpawnTestVariant {
    label: string;
    teleport: "none" | "ground" | "plus5y";
    preSeatWaitSeconds: number;
    seatIndex: number;
    resultOkKey: number;
    resultFailKey: number;
    resultAbortKey: number;
}

// Broadcasts a pre-registered result key to the admin via the world-log. Dynamic string args to
// mod.Message render as "unknown string" in world-log/button contexts, so every outcome uses a
// fully-registered key from strings.json.
function logMinSpawnTestResultKey(player: mod.Player, resultKey: number): void {
    try {
        mod.DisplayHighlightedWorldLogMessage(mod.Message(resultKey), player);
    } catch {}
}

// The isolated test pattern, parameterised by variant. All five admin buttons pipe into this with
// F16 as the control vehicle; the variant object selects the teleport mode, wait duration, and
// seat index. Failure modes are reported to the admin via world-log.
async function runMinimalSpawnTest(
    player: mod.Player,
    vehicleType: mod.VehicleList,
    variant: MinimalSpawnTestVariant
): Promise<void> {
    if (!FEATURE_MIN_SPAWN_TEST) return;
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return;

    const slot = getMinimalSpawnTestSlot(pid);
    if (slot.inFlight) return;
    slot.inFlight = true;

    try {
        cleanupMinimalSpawnTestArtefactsForPid(pid);

        const target = resolveMinimalSpawnTestTargetTransform(player);
        if (!target) { logMinSpawnTestResultKey(player, variant.resultAbortKey); return; }

        let spawner: mod.VehicleSpawner | undefined;
        try {
            spawner = mod.SpawnObject(
                mod.RuntimeSpawn_Common.VehicleSpawner,
                target.pos,
                target.rot
            ) as mod.VehicleSpawner;
        } catch { spawner = undefined; }
        if (!spawner) { logMinSpawnTestResultKey(player, variant.resultAbortKey); return; }

        slot.spawner = spawner;
        try { slot.spawnerObjId = mod.GetObjId(spawner); } catch {}

        try { mod.SetVehicleSpawnerAutoSpawn(spawner, false); } catch {}
        try { mod.SetVehicleSpawnerVehicleType(spawner, vehicleType); } catch {}
        await mod.Wait(0);
        try { mod.ForceVehicleSpawnerSpawn(spawner); } catch {}

        const vehicle = await waitForMinimalSpawnTestVehicle(
            vehicleType,
            target.pos,
            VEHICLE_DIRECT_SPAWN_FRESH_AIR_FIND_RADIUS_METERS
        );
        if (!vehicle) { logMinSpawnTestResultKey(player, variant.resultAbortKey); return; }

        slot.vehicle = vehicle;
        try { slot.vehicleObjId = mod.GetObjId(vehicle); } catch {}

        await mod.Wait(MIN_SPAWN_TEST_SETTLE_SECONDS);
        if (!safeGetSoldierStateBool(player, mod.SoldierStateBool.IsAlive, false)) {
            logMinSpawnTestResultKey(player, variant.resultAbortKey);
            return;
        }

        if (variant.teleport !== "none") {
            let vehiclePos: mod.Vector | undefined;
            try { vehiclePos = mod.GetObjectPosition(vehicle); } catch { vehiclePos = undefined; }
            if (!vehiclePos) {
                logMinSpawnTestResultKey(player, variant.resultAbortKey);
                return;
            }
            const yOffset = variant.teleport === "plus5y" ? MIN_SPAWN_TEST_PRE_TELEPORT_Y_OFFSET_METERS : 0;
            const teleportTarget = mod.CreateVector(
                mod.XComponentOf(vehiclePos),
                mod.YComponentOf(vehiclePos) + yOffset,
                mod.ZComponentOf(vehiclePos)
            );
            try { mod.Teleport(player, teleportTarget, 0); } catch {}
        }

        await mod.Wait(variant.preSeatWaitSeconds);
        try { mod.ForcePlayerToSeat(player, vehicle, variant.seatIndex); } catch {}
        await mod.Wait(MIN_SPAWN_TEST_POST_SEAT_WAIT_SECONDS);

        const vehicleOfPlayer = safeGetVehicleFromPlayer(player);
        const seated = vehicleOfPlayer !== undefined;
        logMinSpawnTestResultKey(player, seated ? variant.resultOkKey : variant.resultFailKey);
    } finally {
        slot.inFlight = false;
    }
}

const MIN_SPAWN_TEST_VARIANT_BASE: MinimalSpawnTestVariant = {
    label: "BASE", teleport: "none", preSeatWaitSeconds: 0.2, seatIndex: 0,
    resultOkKey: mod.stringkeys.twl.adminPanel.tester.buttons.minSpawnResultBaseOk,
    resultFailKey: mod.stringkeys.twl.adminPanel.tester.buttons.minSpawnResultBaseFail,
    resultAbortKey: mod.stringkeys.twl.adminPanel.tester.buttons.minSpawnResultBaseAbort,
};
const MIN_SPAWN_TEST_VARIANT_SEAT_MINUS_ONE: MinimalSpawnTestVariant = {
    label: "S-1", teleport: "none", preSeatWaitSeconds: 0.2, seatIndex: -1,
    resultOkKey: mod.stringkeys.twl.adminPanel.tester.buttons.minSpawnResultSeatMinusOneOk,
    resultFailKey: mod.stringkeys.twl.adminPanel.tester.buttons.minSpawnResultSeatMinusOneFail,
    resultAbortKey: mod.stringkeys.twl.adminPanel.tester.buttons.minSpawnResultSeatMinusOneAbort,
};
const MIN_SPAWN_TEST_VARIANT_TP_GROUND: MinimalSpawnTestVariant = {
    label: "TP0", teleport: "ground", preSeatWaitSeconds: 1.0, seatIndex: 0,
    resultOkKey: mod.stringkeys.twl.adminPanel.tester.buttons.minSpawnResultTpGroundOk,
    resultFailKey: mod.stringkeys.twl.adminPanel.tester.buttons.minSpawnResultTpGroundFail,
    resultAbortKey: mod.stringkeys.twl.adminPanel.tester.buttons.minSpawnResultTpGroundAbort,
};
const MIN_SPAWN_TEST_VARIANT_TP_5Y: MinimalSpawnTestVariant = {
    label: "TP5", teleport: "plus5y", preSeatWaitSeconds: 1.0, seatIndex: 0,
    resultOkKey: mod.stringkeys.twl.adminPanel.tester.buttons.minSpawnResultTp5yOk,
    resultFailKey: mod.stringkeys.twl.adminPanel.tester.buttons.minSpawnResultTp5yFail,
    resultAbortKey: mod.stringkeys.twl.adminPanel.tester.buttons.minSpawnResultTp5yAbort,
};
const MIN_SPAWN_TEST_VARIANT_TP_5Y_LONG: MinimalSpawnTestVariant = {
    label: "TPW", teleport: "plus5y", preSeatWaitSeconds: 2.5, seatIndex: 0,
    resultOkKey: mod.stringkeys.twl.adminPanel.tester.buttons.minSpawnResultTp5yLongOk,
    resultFailKey: mod.stringkeys.twl.adminPanel.tester.buttons.minSpawnResultTp5yLongFail,
    resultAbortKey: mod.stringkeys.twl.adminPanel.tester.buttons.minSpawnResultTp5yLongAbort,
};

const MIN_SPAWN_TEST_SPWN_DEPLOY_POLL_INTERVAL_SECONDS = 0.1;
const MIN_SPAWN_TEST_SPWN_DEPLOY_POLL_ATTEMPTS = 30;

async function runMinimalSpawnTestWithSpawnPoint(player: mod.Player): Promise<void> {
    if (!FEATURE_MIN_SPAWN_TEST) return;
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return;

    const resultOkKey = mod.stringkeys.twl.adminPanel.tester.buttons.minSpawnResultSpwnOk;
    const resultFailKey = mod.stringkeys.twl.adminPanel.tester.buttons.minSpawnResultSpwnFail;
    const resultAbortKey = mod.stringkeys.twl.adminPanel.tester.buttons.minSpawnResultSpwnAbort;

    const slot = getMinimalSpawnTestSlot(pid);
    if (slot.inFlight) return;
    slot.inFlight = true;

    try {
        cleanupMinimalSpawnTestArtefactsForPid(pid);

        const target = resolveMinimalSpawnTestTargetTransform(player);
        if (!target) { logMinSpawnTestResultKey(player, resultAbortKey); return; }

        let spawner: mod.VehicleSpawner | undefined;
        try {
            spawner = mod.SpawnObject(
                mod.RuntimeSpawn_Common.VehicleSpawner,
                target.pos,
                target.rot
            ) as mod.VehicleSpawner;
        } catch { spawner = undefined; }
        if (!spawner) { logMinSpawnTestResultKey(player, resultAbortKey); return; }

        slot.spawner = spawner;
        try { slot.spawnerObjId = mod.GetObjId(spawner); } catch {}

        try { mod.SetVehicleSpawnerAutoSpawn(spawner, false); } catch {}
        try { mod.SetVehicleSpawnerVehicleType(spawner, mod.VehicleList.F16); } catch {}
        await mod.Wait(0);
        try { mod.ForceVehicleSpawnerSpawn(spawner); } catch {}

        const vehicle = await waitForMinimalSpawnTestVehicle(
            mod.VehicleList.F16,
            target.pos,
            VEHICLE_DIRECT_SPAWN_FRESH_AIR_FIND_RADIUS_METERS
        );
        if (!vehicle) { logMinSpawnTestResultKey(player, resultAbortKey); return; }

        slot.vehicle = vehicle;
        try { slot.vehicleObjId = mod.GetObjId(vehicle); } catch {}

        const teamId = safeGetTeamNumberFromPlayer(player, 0);
        const spawnPointId = (teamId === TeamID.Team1 || teamId === TeamID.Team2)
            ? getVehicleDeploySpawnPointIdForTeam(teamId)
            : undefined;
        if (spawnPointId === undefined) { logMinSpawnTestResultKey(player, resultAbortKey); return; }

        let spawnPoint: mod.SpawnPoint | undefined;
        try { spawnPoint = mod.GetSpawnPoint(spawnPointId); } catch { spawnPoint = undefined; }

        if (spawnPoint) {
            try { mod.SpawnPlayerFromSpawnPoint(player, spawnPoint); } catch {}
        } else {
            try { mod.SpawnPlayerFromSpawnPoint(player, spawnPointId); } catch {}
        }

        let deployed = false;
        for (let i = 0; i < MIN_SPAWN_TEST_SPWN_DEPLOY_POLL_ATTEMPTS; i++) {
            if (!mod.IsPlayerValid(player)) break;
            if (safeGetSoldierStateBool(player, mod.SoldierStateBool.IsAlive, false)) {
                deployed = true;
                break;
            }
            await mod.Wait(MIN_SPAWN_TEST_SPWN_DEPLOY_POLL_INTERVAL_SECONDS);
        }
        if (!deployed) { logMinSpawnTestResultKey(player, resultAbortKey); return; }

        await mod.Wait(MIN_SPAWN_TEST_SETTLE_SECONDS);

        mod.ForcePlayerToSeat(player, vehicle, 0);
        await mod.Wait(MIN_SPAWN_TEST_POST_SEAT_WAIT_SECONDS);

        const vehicleOfPlayer = safeGetVehicleFromPlayer(player);
        const seated = vehicleOfPlayer !== undefined;
        logMinSpawnTestResultKey(player, seated ? resultOkKey : resultFailKey);
    } finally {
        slot.inFlight = false;
    }
}
