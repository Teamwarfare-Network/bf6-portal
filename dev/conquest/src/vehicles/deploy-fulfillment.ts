// @ts-nocheck
// Module: vehicles/deploy-fulfillment -- direct vehicle spawn-button fulfillment on deploy

const VEHICLE_DIRECT_SPAWN_FULFILLMENT_SEAT_NUMBER = 0;
const VEHICLE_DIRECT_SPAWN_FULFILLMENT_SPAWN_SETTLE_SECONDS = 0.1;
const VEHICLE_DIRECT_SPAWN_FULFILLMENT_VERIFY_INTERVAL_SECONDS = 0.05;
const VEHICLE_DIRECT_SPAWN_FULFILLMENT_VERIFY_ATTEMPTS = 10;
const VEHICLE_DIRECT_SPAWN_FULFILLMENT_UNDEPLOY_DELAY_SECONDS = 0.05;
const VEHICLE_DIRECT_SPAWN_DEPLOY_VERIFY_INTERVAL_SECONDS = 0.05;
const VEHICLE_DIRECT_SPAWN_DEPLOY_VERIFY_ATTEMPTS = 8;
const VEHICLE_DIRECT_SPAWN_BIND_VERIFY_INTERVAL_SECONDS = 0.1;
const VEHICLE_DIRECT_SPAWN_BIND_VERIFY_ATTEMPTS = 10;
const VEHICLE_DIRECT_SPAWN_FRESH_AIR_FIND_RADIUS_METERS = 40;
const VEHICLE_DIRECT_SPAWN_STALE_PAD_CLEANUP_RADIUS_METERS = 12;
const VEHICLE_DIRECT_SPAWN_FORWARD_BLOCKED_RADIUS_METERS = 10;

type ConquestVehicleDirectSpawnDeployResult = {
    consumedDeploy: boolean;
    fulfilled: boolean;
};

type VehiclePendingSpawnFailureMode = "undeploy" | "leave_alive";

// Applies the shared failure policy for pending spawn seat attempts.
function handlePendingVehicleSpawnSeatFailure(
    player: mod.Player,
    slot: VehicleSpawnerSlot,
    failureMode: VehiclePendingSpawnFailureMode
): ConquestVehicleDirectSpawnDeployResult {
    clearVehiclePendingSpawnRequestForSlot(slot);
    updateVehicleDeployTimerHudForAllPlayers();
    if (failureMode === "undeploy") {
        void forceUndeployAfterVehicleDirectSpawnFailure(player);
    }
    return { consumedDeploy: true, fulfilled: false };
}

function hasPlayerEnteredDeployedState(player: mod.Player): boolean {
    if (!player || !mod.IsPlayerValid(player)) return false;
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return false;
    return !!State.players.deployedByPid[pid];
}

async function waitForPlayerToEnterDeployedState(player: mod.Player): Promise<boolean> {
    for (let attempt = 0; attempt < VEHICLE_DIRECT_SPAWN_DEPLOY_VERIFY_ATTEMPTS; attempt++) {
        if (!player || !mod.IsPlayerValid(player)) return false;
        if (hasPlayerEnteredDeployedState(player)) return true;
        await mod.Wait(VEHICLE_DIRECT_SPAWN_DEPLOY_VERIFY_INTERVAL_SECONDS);
    }
    return hasPlayerEnteredDeployedState(player);
}

async function tryBeginVehicleDirectSpawnDeployFromSpawnPoint(player: mod.Player, spawnPointId: number): Promise<boolean> {
    if (!player || !mod.IsPlayerValid(player)) return false;
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return false;

    // Close out UI-input capture before forcing an engine deploy path.
    setUIInputModeForPlayer(player, false);

    let spawnPoint: mod.SpawnPoint | undefined = undefined;
    try {
        spawnPoint = mod.GetSpawnPoint(spawnPointId);
    } catch {
        spawnPoint = undefined;
    }

    if (spawnPoint) {
        try {
            mod.SpawnPlayerFromSpawnPoint(player, spawnPoint);
            if (await waitForPlayerToEnterDeployedState(player)) {
                if (FEATURE_DEPLOY_DIAGNOSTIC) deployDiagSetDeploy(player, "state-ok");
                return true;
            }
        } catch {
            // Fall through to id-based signature attempt below.
        }
    }

    try {
        mod.SpawnPlayerFromSpawnPoint(player, spawnPointId);
        if (await waitForPlayerToEnterDeployedState(player)) {
            if (FEATURE_DEPLOY_DIAGNOSTIC) deployDiagSetDeploy(player, "state-ok");
            return true;
        }
    } catch {
        // Fall through to normal engine deploy.
    }

    if (FEATURE_DEPLOY_DIAGNOSTIC) deployDiagSetDeploy(player, "timeout");
    return false;
}

async function beginVehicleDirectSpawnDeployForPlayer(player: mod.Player): Promise<void> {
    if (FEATURE_DEPLOY_DIAGNOSTIC && player && mod.IsPlayerValid(player)) deployDiagSetPrep(player, "entered");
    if (!player || !mod.IsPlayerValid(player)) return;
    const pid = safeGetPlayerId(player);
    if (pid !== undefined && isHudTransitionBlockingForPid(pid)) {
        if (FEATURE_DEPLOY_DIAGNOSTIC) deployDiagSetPrep(player, "hud-blocked");
        return;
    }
    const slot = getPendingVehicleDirectSpawnSlotForPlayer(player);
    if (slot) {
        const prepared = await preparePendingVehicleDirectSpawnVehicleForPlayer(player, slot);
        if (!prepared) {
            clearVehiclePendingSpawnRequestForSlot(slot);
            updateVehicleDeployTimerHudForAllPlayers();
            return;
        }
    } else {
        if (FEATURE_DEPLOY_DIAGNOSTIC) deployDiagSetPrep(player, "no-slot");
    }
    const teamId = safeGetTeamNumberFromPlayer(player, 0);
    if (teamId !== TeamID.Team1 && teamId !== TeamID.Team2) {
        mod.DeployPlayer(player);
        return;
    }
    const spawnPointId = getVehicleDeploySpawnPointIdForTeam(teamId);
    if (spawnPointId !== undefined) {
        if (await tryBeginVehicleDirectSpawnDeployFromSpawnPoint(player, spawnPointId)) {
            return;
        }
    }
    mod.DeployPlayer(player);
}

function getPendingVehicleDirectSpawnSlotForPlayer(player: mod.Player): VehicleSpawnerSlot | undefined {
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return undefined;
    return findVehicleSlotByPendingSpawnOwnerPid(pid);
}

function getPendingVehicleDirectSpawnModeForPlayer(player: mod.Player): VehicleDirectSpawnMode | undefined {
    const slot = getPendingVehicleDirectSpawnSlotForPlayer(player);
    return slot?.pendingSpawnMode;
}

function tryGetSpawnedVehicleForSlot(slot: VehicleSpawnerSlot | undefined): mod.Vehicle | undefined {
    if (!slot || slot.vehicleId === -1) return undefined;
    return findVehicleById(slot.vehicleId);
}

function canFulfillVehicleDirectSpawnForPlayer(player: mod.Player, slot: VehicleSpawnerSlot | undefined): boolean {
    if (!player || !mod.IsPlayerValid(player) || !slot) return false;
    const pid = safeGetPlayerId(player);
    if (pid === undefined || isPidDisconnected(pid)) return false;
    if (!State.players.deployedByPid[pid]) return false;
    if (!slot.enabled || !shouldGateVehicleSlotSpawnUntilReservationDeploy(slot)) return false;
    if (slot.pendingSpawnOwnerPid !== pid) return false;
    if (slot.pendingSpawnMode !== "air" && slot.pendingSpawnMode !== "ground" && slot.pendingSpawnMode !== "forward") return false;
    const playerTeam = safeGetTeamNumberFromPlayer(player, 0);
    return playerTeam === slot.teamId;
}

function shouldUseFreshAircraftAirDirectSpawn(slot: VehicleSpawnerSlot | undefined): boolean {
    return !!slot
        && slot.pendingSpawnMode === "air"
        && isAircraftSpawnVolumeVehicleType(slot.vehicleType);
}

function isDirectSpawnDriverSeatAvailable(vehicle: mod.Vehicle | undefined): boolean {
    if (!vehicle) return false;
    return !mod.IsVehicleSeatOccupied(vehicle, VEHICLE_DIRECT_SPAWN_FULFILLMENT_SEAT_NUMBER);
}

function isFastMoverDirectSpawnVehicle(vehicleType: mod.VehicleList): boolean {
    switch (vehicleType) {
        case mod.VehicleList.Marauder:
        case mod.VehicleList.Marauder_Pax:
        case mod.VehicleList.Quadbike:
        case mod.VehicleList.GolfCart:
        case mod.VehicleList.Flyer60:
        case VEHICLE_DIRTBIKE:
        case VEHICLE_DIRTBIKE_PAX:
            return true;
        default:
            return false;
    }
}

async function waitForSpawnedVehicleForSlot(slot: VehicleSpawnerSlot | undefined): Promise<mod.Vehicle | undefined> {
    for (let attempt = 0; attempt < VEHICLE_DIRECT_SPAWN_BIND_VERIFY_ATTEMPTS; attempt++) {
        const vehicle = tryGetSpawnedVehicleForSlot(slot);
        if (vehicle) return vehicle;
        await mod.Wait(VEHICLE_DIRECT_SPAWN_BIND_VERIFY_INTERVAL_SECONDS);
    }
    return tryGetSpawnedVehicleForSlot(slot);
}

function resetRejectedDirectSpawnVehicleForSlot(slot: VehicleSpawnerSlot, vehicle: mod.Vehicle | undefined): void {
    const slotIndex = State.vehicles.slots.indexOf(slot);
    const vehicleObjId = vehicle ? safeGetObjId(vehicle) : undefined;
    if (vehicleObjId !== undefined) {
        delete State.vehicles.vehicleToSlot[vehicleObjId];
        if (slot.vehicleId === vehicleObjId) {
            slot.vehicleId = -1;
        }
    }
    slot.activeOwnerPid = undefined;
    slot.expectingSpawn = false;
    refreshVehicleSlotAuthoritativeState(slot);
    if (slotIndex >= 0) {
        clearVehicleDirectSpawnActiveTrackingForSlot(slotIndex, slot.spawnRequestToken);
    }
    if (vehicle) {
        try {
            mod.UnspawnObject(vehicle);
        } catch {}
    }
}

async function forceUndeployAfterVehicleDirectSpawnFailure(player: mod.Player): Promise<void> {
    await mod.Wait(VEHICLE_DIRECT_SPAWN_FULFILLMENT_UNDEPLOY_DELAY_SECONDS);
    if (!player || !mod.IsPlayerValid(player)) return;
    const pid = safeGetPlayerId(player);
    if (pid === undefined || !State.players.deployedByPid[pid]) return;
    mod.UndeployPlayer(player);
}

// Returns true when a vehicle has no occupied seats and can be treated as stale spawn-pad clutter.
function isVehicleUnoccupied(vehicle: mod.Vehicle | undefined): boolean {
    if (!vehicle) return false;
    const seatCount = mod.GetVehicleSeatCount(vehicle);
    for (let seatIndex = 0; seatIndex < seatCount; seatIndex++) {
        if (mod.IsVehicleSeatOccupied(vehicle, seatIndex)) {
            return false;
        }
    }
    return true;
}

// Removes unbound, unoccupied vehicles lingering within the cleanup radius of an arbitrary position.
// Shared helper used by both the ground-slot pad sweep and the CQ_Bug_49 fresh-aircraft birth-pos sweep.
function cleanupStaleVehiclesNearPosition(pos: mod.Vector): void {
    const vehicles = mod.AllVehicles();
    const count = mod.CountOf(vehicles);
    for (let i = 0; i < count; i++) {
        const vehicle = mod.ValueInArray(vehicles, i) as mod.Vehicle;
        if (!vehicle) continue;
        const vehicleObjId = getObjId(vehicle);
        if (State.vehicles.vehicleToSlot[vehicleObjId] !== undefined) continue;
        if (!isVehicleUnoccupied(vehicle)) continue;
        let vehiclePos: mod.Vector | undefined = undefined;
        try {
            vehiclePos = mod.GetObjectPosition(vehicle);
        } catch {
            vehiclePos = undefined;
        }
        if (!vehiclePos) continue;
        if (mod.DistanceBetween(vehiclePos, pos) > VEHICLE_DIRECT_SPAWN_STALE_PAD_CLEANUP_RADIUS_METERS) continue;
        try {
            mod.UnspawnObject(vehicle);
        } catch {
            // Best-effort cleanup: stale clutter should not block the main spawn path.
        }
    }
}

// Removes unbound, unoccupied vehicles lingering on a ground spawn pad before a fresh forced spawn.
function cleanupStaleVehiclesNearDirectSpawnSlot(slot: VehicleSpawnerSlot): void {
    cleanupStaleVehiclesNearPosition(slot.spawnPos);
}

// Returns true if any vehicle (bound or unbound, occupied or not) is within the forward-deploy
// blocked radius. Used to abort forward spawns when the target position is physically occupied.
function isForwardDeployPositionOccupied(pos: mod.Vector): boolean {
    const vehicles = mod.AllVehicles();
    const count = mod.CountOf(vehicles);
    for (let i = 0; i < count; i++) {
        const vehicle = mod.ValueInArray(vehicles, i) as mod.Vehicle;
        if (!vehicle) continue;
        let vehiclePos: mod.Vector | undefined;
        try { vehiclePos = mod.GetObjectPosition(vehicle); } catch { continue; }
        if (!vehiclePos) continue;
        if (mod.DistanceBetween(vehiclePos, pos) <= VEHICLE_DIRECT_SPAWN_FORWARD_BLOCKED_RADIUS_METERS) {
            return true;
        }
    }
    return false;
}

async function spawnDirectSpawnVehicleIfReady(slot: VehicleSpawnerSlot): Promise<mod.Vehicle | undefined> {
    let vehicle = tryGetSpawnedVehicleForSlot(slot);
    if (vehicle) return vehicle;
    if (!isVehicleSlotReadyForReservationDeploy(slot)) return undefined;

    const slotIndex = State.vehicles.slots.indexOf(slot);
    if (slotIndex === -1) return undefined;
    cleanupStaleVehiclesNearDirectSpawnSlot(slot);
    const success = await forceSpawnWithRetry(slotIndex);
    if (!success) return undefined;

    await mod.Wait(VEHICLE_DIRECT_SPAWN_FULFILLMENT_SPAWN_SETTLE_SECONDS);
    vehicle = await waitForSpawnedVehicleForSlot(slot);
    return vehicle;
}

function clearVehicleDirectSpawnActiveTrackingForSlot(slotIndex: number, spawnToken: number): void {
    if (State.vehicles.activeSpawnSlotIndex === slotIndex && State.vehicles.activeSpawnToken === spawnToken) {
        State.vehicles.activeSpawnSlotIndex = undefined;
        State.vehicles.activeSpawnToken = undefined;
        State.vehicles.activeSpawnRequestedAtSeconds = undefined;
    }
}

function cleanupFreshAircraftRuntimeSpawnerForSlot(slot: VehicleSpawnerSlot): void {
    if (!slot.freshAirRuntimeSpawner) return;
    try {
        mod.UnspawnObject(slot.freshAirRuntimeSpawner);
    } catch {}
    slot.freshAirRuntimeSpawner = undefined;
}

function tryFindVehicleNearDirectSpawnAirPoint(pos: mod.Vector): mod.Vehicle | undefined {
    const vehicles = mod.AllVehicles();
    const count = mod.CountOf(vehicles);
    const maxDistanceSquared = VEHICLE_DIRECT_SPAWN_FRESH_AIR_FIND_RADIUS_METERS * VEHICLE_DIRECT_SPAWN_FRESH_AIR_FIND_RADIUS_METERS;
    let closestVehicle: mod.Vehicle | undefined = undefined;
    let closestDistanceSquared = Number.POSITIVE_INFINITY;

    for (let i = 0; i < count; i++) {
        const vehicle = mod.ValueInArray(vehicles, i) as mod.Vehicle;
        // CQ_Bug_49: exclude positively-identified tanks — the engine default Abrams from the runtime
        // spawner prefab must never be picked up by the aircraft-spawn fallback path.
        if (isTankVehicleInstance(vehicle)) continue;
        let vehiclePos: mod.Vector | undefined = undefined;
        try {
            vehiclePos = mod.GetObjectPosition(vehicle);
        } catch {
            continue;
        }
        const dx = mod.XComponentOf(vehiclePos) - mod.XComponentOf(pos);
        const dy = mod.YComponentOf(vehiclePos) - mod.YComponentOf(pos);
        const dz = mod.ZComponentOf(vehiclePos) - mod.ZComponentOf(pos);
        const distanceSquared = (dx * dx) + (dy * dy) + (dz * dz);
        if (distanceSquared > maxDistanceSquared || distanceSquared >= closestDistanceSquared) continue;
        closestVehicle = vehicle;
        closestDistanceSquared = distanceSquared;
    }

    return closestVehicle;
}

// v1.245: BountyHunter-pattern fresh aircraft spawner. Creates a new runtime VehicleSpawner,
// waits 2s for engine initialization, cleans up any default auto-spawn, then configures with
// ONLY the 3 BountyHunter calls (VehicleType + AutoSpawn(true) + RespawnTime) and polls for
// the vehicle to appear. No configureVehicleSpawner, no ForceVehicleSpawnerSpawn.
async function spawnFreshAircraftDirectSpawnVehicleForSlot(slot: VehicleSpawnerSlot): Promise<mod.Vehicle | undefined> {
    if (!shouldUseFreshAircraftAirDirectSpawn(slot)) return undefined;
    if (!isVehicleSlotReadyForReservationDeploy(slot)) return undefined;

    const birthSpawn = tryResolveFreshAircraftBirthSpawnForSlot(slot);
    if (!birthSpawn) return undefined;

    if (slot.vehicleId === -1) {
        cleanupFreshAircraftRuntimeSpawnerForSlot(slot);
    }

    const slotIndex = State.vehicles.slots.indexOf(slot);
    if (slotIndex === -1) return undefined;

    slot.expectingSpawn = true;
    slot.expectingSpawnStartedAtSeconds = mod.GetMatchTimeElapsed();
    slot.spawnRequestToken += 1;
    slot.spawnRequestAtSeconds = Math.floor(mod.GetMatchTimeElapsed());
    slot.suppressNextBindSpawnTransformCorrection = true;
    refreshVehicleSlotAuthoritativeState(slot);

    let spawnedVehicle: mod.Vehicle | undefined = undefined;
    let runtimeSpawner: mod.VehicleSpawner | undefined = undefined;
    const fulfillToken = slot.enableToken;

    try {
        runtimeSpawner = mod.SpawnObject(
            mod.RuntimeSpawn_Common.VehicleSpawner,
            birthSpawn.pos,
            birthSpawn.rot
        ) as mod.VehicleSpawner;
        if (!runtimeSpawner) return undefined;

        await mod.Wait(2.0);
        if (!slot.enabled || slot.enableToken !== fulfillToken) return undefined;

        // Destroy any default vehicle (Abrams) that auto-spawned during the 2s wait.
        const staleVehicles = mod.AllVehicles();
        const staleCount = mod.CountOf(staleVehicles);
        for (let i = 0; i < staleCount; i++) {
            const sv = mod.ValueInArray(staleVehicles, i) as mod.Vehicle;
            if (!sv) continue;
            try {
                const svPos = mod.GetObjectPosition(sv);
                if (mod.DistanceBetween(svPos, birthSpawn.pos) <= VEHICLE_DIRECT_SPAWN_FRESH_AIR_FIND_RADIUS_METERS) {
                    mod.UnspawnObject(sv);
                }
            } catch {}
        }

        // Arm bind handler NOW (after stale cleanup, before the real vehicle spawns).
        State.vehicles.activeSpawnSlotIndex = slotIndex;
        State.vehicles.activeSpawnToken = slot.spawnRequestToken;
        State.vehicles.activeSpawnRequestedAtSeconds = slot.spawnRequestAtSeconds;

        // BountyHunter 3-call pattern — no configureVehicleSpawner, no ForceVehicleSpawnerSpawn.
        mod.SetVehicleSpawnerVehicleType(runtimeSpawner, slot.vehicleType);
        mod.SetVehicleSpawnerAutoSpawn(runtimeSpawner, true);
        mod.SetVehicleSpawnerRespawnTime(runtimeSpawner, 0);

        const deadline = mod.GetMatchTimeElapsed() + 8.0;
        while (mod.GetMatchTimeElapsed() < deadline) {
            if (!slot.enabled || slot.enableToken !== fulfillToken) break;
            if (slot.vehicleId !== -1) {
                spawnedVehicle = tryGetSpawnedVehicleForSlot(slot);
                break;
            }
            spawnedVehicle = tryFindVehicleNearDirectSpawnAirPoint(birthSpawn.pos);
            if (spawnedVehicle) {
                const vehicleObjId = getObjId(spawnedVehicle);
                slot.expectingSpawn = false;
                slot.suppressNextBindSpawnTransformCorrection = false;
                bindVehicleToSpawnerSlot(slot, vehicleObjId);
                State.vehicles.vehicleToSlot[vehicleObjId] = slotIndex;
                clearVehicleDirectSpawnActiveTrackingForSlot(slotIndex, slot.spawnRequestToken);
                vehicleSpawnBaseTeamByObjId[vehicleObjId] = slot.teamId;
                registerVehicleToTeam(spawnedVehicle, slot.teamId);
                break;
            }
            await mod.Wait(0.25);
        }

        try { mod.SetVehicleSpawnerAutoSpawn(runtimeSpawner, false); } catch {}
        return spawnedVehicle;
    } finally {
        if (!spawnedVehicle) {
            slot.expectingSpawn = false;
            slot.suppressNextBindSpawnTransformCorrection = false;
            refreshVehicleSlotAuthoritativeState(slot);
            clearVehicleDirectSpawnActiveTrackingForSlot(slotIndex, slot.spawnRequestToken);
            if (runtimeSpawner) {
                try { mod.SetVehicleSpawnerAutoSpawn(runtimeSpawner, false); } catch {}
                try { mod.UnspawnObject(runtimeSpawner); } catch {}
            }
        } else if (runtimeSpawner) {
            slot.freshAirRuntimeSpawner = runtimeSpawner;
        }
    }
}

async function spawnForwardDeployVehicleForSlot(slot: VehicleSpawnerSlot): Promise<mod.Vehicle | undefined> {
    if (!isTankSpawnVolumeVehicleType(slot.vehicleType)) return undefined;
    if (!isVehicleSlotReadyForReservationDeploy(slot)) return undefined;

    const boundedTransform = tryResolveBoundedSpawnTransformForSlot(slot);
    if (!boundedTransform) return undefined;

    const slotIndex = State.vehicles.slots.indexOf(slot);
    if (slotIndex === -1) return undefined;

    cleanupStaleVehiclesNearPosition(boundedTransform.pos);
    if (isForwardDeployPositionOccupied(boundedTransform.pos)) return undefined;

    slot.expectingSpawn = true;
    slot.expectingSpawnStartedAtSeconds = mod.GetMatchTimeElapsed();
    slot.spawnRequestToken += 1;
    slot.spawnRequestAtSeconds = Math.floor(mod.GetMatchTimeElapsed());
    slot.suppressNextBindSpawnTransformCorrection = true;
    refreshVehicleSlotAuthoritativeState(slot);
    State.vehicles.activeSpawnSlotIndex = slotIndex;
    State.vehicles.activeSpawnToken = slot.spawnRequestToken;
    State.vehicles.activeSpawnRequestedAtSeconds = slot.spawnRequestAtSeconds;

    let spawnedVehicle: mod.Vehicle | undefined = undefined;
    let runtimeSpawner: mod.VehicleSpawner | undefined = undefined;

    try {
        runtimeSpawner = mod.SpawnObject(
            mod.RuntimeSpawn_Common.VehicleSpawner,
            boundedTransform.pos,
            boundedTransform.rot
        ) as mod.VehicleSpawner;
        if (!runtimeSpawner) return undefined;

        mod.SetVehicleSpawnerAutoSpawn(runtimeSpawner, false);
        configureVehicleSpawner(runtimeSpawner, slot.vehicleType);
        await mod.Wait(0);
        mod.ForceVehicleSpawnerSpawn(runtimeSpawner);
        await mod.Wait(VEHICLE_DIRECT_SPAWN_FULFILLMENT_SPAWN_SETTLE_SECONDS);

        spawnedVehicle = await waitForSpawnedVehicleForSlot(slot);
        if (!spawnedVehicle) {
            const vehicles = mod.AllVehicles();
            const count = mod.CountOf(vehicles);
            for (let i = 0; i < count; i++) {
                const v = mod.ValueInArray(vehicles, i) as mod.Vehicle;
                if (!v) continue;
                const vObjId = getObjId(v);
                if (State.vehicles.vehicleToSlot[vObjId] !== undefined) continue;
                let vPos: mod.Vector | undefined;
                try { vPos = mod.GetObjectPosition(v); } catch { continue; }
                if (!vPos) continue;
                if (mod.DistanceBetween(vPos, boundedTransform.pos) > VEHICLE_DIRECT_SPAWN_FRESH_AIR_FIND_RADIUS_METERS) continue;
                spawnedVehicle = v;
                slot.expectingSpawn = false;
                slot.suppressNextBindSpawnTransformCorrection = false;
                bindVehicleToSpawnerSlot(slot, vObjId);
                State.vehicles.vehicleToSlot[vObjId] = slotIndex;
                clearVehicleDirectSpawnActiveTrackingForSlot(slotIndex, slot.spawnRequestToken);
                vehicleSpawnBaseTeamByObjId[vObjId] = slot.teamId;
                registerVehicleToTeam(spawnedVehicle, slot.teamId);
                break;
            }
        }
        return spawnedVehicle;
    } finally {
        if (!spawnedVehicle) {
            slot.expectingSpawn = false;
            slot.suppressNextBindSpawnTransformCorrection = false;
            refreshVehicleSlotAuthoritativeState(slot);
            clearVehicleDirectSpawnActiveTrackingForSlot(slotIndex, slot.spawnRequestToken);
            if (runtimeSpawner) {
                try { mod.UnspawnObject(runtimeSpawner); } catch {}
            }
        } else if (runtimeSpawner) {
            slot.freshAirRuntimeSpawner = runtimeSpawner;
        }
    }
}

async function preparePendingVehicleDirectSpawnVehicleForPlayer(player: mod.Player, slot: VehicleSpawnerSlot): Promise<boolean> {
    if (!player || !mod.IsPlayerValid(player)) {
        if (FEATURE_DEPLOY_DIAGNOSTIC) deployDiagSetPrep(player, "failed");
        return false;
    }
    if (!slot.enabled || slot.pendingSpawnOwnerPid === undefined || slot.pendingSpawnMode === undefined) {
        if (FEATURE_DEPLOY_DIAGNOSTIC) deployDiagSetPrep(player, "failed");
        return false;
    }

    if (shouldUseFreshAircraftAirDirectSpawn(slot)) {
        const ready = isVehicleSlotReadyForReservationDeploy(slot);
        if (FEATURE_DEPLOY_DIAGNOSTIC) deployDiagSetPrep(player, ready ? "skip" : (("fail-" + describeVehicleSlotReadyFailure(slot)) as any));
        return ready;
    }

    // Forward deploy: skip vehicleId === -1 readiness check — the existing pad vehicle will be
    // destroyed during fulfillment before spawning at the forward position.
    if (slot.pendingSpawnMode === "forward" && isTankSpawnVolumeVehicleType(slot.vehicleType)) {
        const ready = slot.enabled && shouldGateVehicleSlotSpawnUntilReservationDeploy(slot);
        if (FEATURE_DEPLOY_DIAGNOSTIC) deployDiagSetPrep(player, ready ? "skip" : "failed");
        return ready;
    }

    const prepToken = slot.enableToken;
    let vehicle = tryGetSpawnedVehicleForSlot(slot);
    if (!vehicle) {
        if (!isVehicleSlotReadyForReservationDeploy(slot)) {
            if (FEATURE_DEPLOY_DIAGNOSTIC) deployDiagSetPrep(player, ("fail-" + describeVehicleSlotReadyFailure(slot)) as any);
            return false;
        }
        vehicle = await spawnDirectSpawnVehicleIfReady(slot);
        if (!vehicle) {
            if (FEATURE_DEPLOY_DIAGNOSTIC) deployDiagSetPrep(player, "failed");
            return false;
        }
        if (!slot.enabled || slot.enableToken !== prepToken) {
            if (FEATURE_DEPLOY_DIAGNOSTIC) deployDiagSetPrep(player, "failed");
            return false;
        }
    }
    if (!isDirectSpawnDriverSeatAvailable(vehicle)) {
        if (FEATURE_DEPLOY_DIAGNOSTIC) deployDiagSetPrep(player, "failed");
        return false;
    }
    if (FEATURE_DEPLOY_DIAGNOSTIC) deployDiagSetPrep(player, "ok");
    return true;
}

async function verifyPlayerForcedIntoDirectSpawnSeat(player: mod.Player, vehicle: mod.Vehicle): Promise<boolean> {
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return false;

    for (let attempt = 0; attempt < VEHICLE_DIRECT_SPAWN_FULFILLMENT_VERIFY_ATTEMPTS; attempt++) {
        if (!player || !mod.IsPlayerValid(player) || !State.players.deployedByPid[pid]) return false;
        const seatedVehicle = safeGetVehicleFromPlayer(player);
        const seatIndex = safeGetPlayerVehicleSeat(player);
        if (seatedVehicle && mod.Equals(seatedVehicle, vehicle) && seatIndex === VEHICLE_DIRECT_SPAWN_FULFILLMENT_SEAT_NUMBER) {
            return true;
        }
        await mod.Wait(VEHICLE_DIRECT_SPAWN_FULFILLMENT_VERIFY_INTERVAL_SECONDS);
    }

    return false;
}

async function verifyPlayerForcedIntoAnyDirectSpawnSeat(player: mod.Player, vehicle: mod.Vehicle): Promise<boolean> {
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return false;

    for (let attempt = 0; attempt < VEHICLE_DIRECT_SPAWN_FULFILLMENT_VERIFY_ATTEMPTS; attempt++) {
        if (!player || !mod.IsPlayerValid(player) || !State.players.deployedByPid[pid]) return false;
        const seatedVehicle = safeGetVehicleFromPlayer(player);
        const seatIndex = safeGetPlayerVehicleSeat(player);
        if (seatedVehicle && mod.Equals(seatedVehicle, vehicle) && seatIndex >= 0) {
            return true;
        }
        await mod.Wait(VEHICLE_DIRECT_SPAWN_FULFILLMENT_VERIFY_INTERVAL_SECONDS);
    }

    return false;
}

// Resolves the pending claimed slot by seating an already-deployed player into the prepared vehicle.
async function tryFulfillPendingVehicleDirectSpawnSeatForPlayer(
    player: mod.Player,
    failureMode: VehiclePendingSpawnFailureMode
): Promise<ConquestVehicleDirectSpawnDeployResult> {
    if (FEATURE_DEPLOY_DIAGNOSTIC && player && mod.IsPlayerValid(player)) deployDiagSetPrep(player, "fulfill-entry");
    const slot = getPendingVehicleDirectSpawnSlotForPlayer(player);
    const pendingMode = getPendingVehicleDirectSpawnModeForPlayer(player);
    if (!slot) {
        if (FEATURE_DEPLOY_DIAGNOSTIC && player && mod.IsPlayerValid(player)) deployDiagSetPrep(player, "fulfill-no-slot");
        return { consumedDeploy: false, fulfilled: false };
    }
    if (pendingMode !== "air" && pendingMode !== "ground" && pendingMode !== "forward") {
        if (FEATURE_DEPLOY_DIAGNOSTIC && player && mod.IsPlayerValid(player)) deployDiagSetPrep(player, "fulfill-bad-mode");
        clearVehiclePendingSpawnRequestForSlot(slot);
        return { consumedDeploy: false, fulfilled: false };
    }
    if (!canFulfillVehicleDirectSpawnForPlayer(player, slot)) {
        if (FEATURE_DEPLOY_DIAGNOSTIC && player && mod.IsPlayerValid(player)) deployDiagSetPrep(player, "fulfill-can't");
        clearVehiclePendingSpawnRequestForSlot(slot);
        return { consumedDeploy: false, fulfilled: false };
    }

    const useFreshAircraftAirDirectSpawn = shouldUseFreshAircraftAirDirectSpawn(slot);
    const useForwardTankSpawn = pendingMode === "forward" && isTankSpawnVolumeVehicleType(slot.vehicleType);
    const fulfillToken = slot.enableToken;

    // Forward deploy: destroy the existing pad vehicle so the slot becomes ready for a fresh
    // forward-position spawn. The pad vehicle is no longer needed — the player will be seated
    // into the new vehicle at the forward tank volume.
    if (useForwardTankSpawn) {
        const existingPadVehicle = tryGetSpawnedVehicleForSlot(slot);
        if (existingPadVehicle) {
            const existingObjId = safeGetObjId(existingPadVehicle);
            if (existingObjId !== undefined) {
                delete State.vehicles.vehicleToSlot[existingObjId];
            }
            slot.vehicleId = -1;
            try { mod.UnspawnObject(existingPadVehicle); } catch {}
            await mod.Wait(VEHICLE_DIRECT_SPAWN_FULFILLMENT_SPAWN_SETTLE_SECONDS);
            if (!slot.enabled || slot.enableToken !== fulfillToken) {
                clearVehiclePendingSpawnRequestForSlot(slot);
                return { consumedDeploy: false, fulfilled: false };
            }
        }
    }

    let vehicle = tryGetSpawnedVehicleForSlot(slot);
    if (!vehicle) {
        if (!isVehicleSlotReadyForReservationDeploy(slot)) {
            if (FEATURE_DEPLOY_DIAGNOSTIC && player && mod.IsPlayerValid(player)) deployDiagSetPrep(player, "fulfill-notready");
            clearVehiclePendingSpawnRequestForSlot(slot);
            return { consumedDeploy: false, fulfilled: false };
        }
        vehicle = useFreshAircraftAirDirectSpawn
            ? await spawnFreshAircraftDirectSpawnVehicleForSlot(slot)
            : useForwardTankSpawn
                ? await spawnForwardDeployVehicleForSlot(slot)
                : await spawnDirectSpawnVehicleIfReady(slot);
        if (!vehicle) {
            if (FEATURE_DEPLOY_DIAGNOSTIC && player && mod.IsPlayerValid(player)) deployDiagSetPrep(player, "fulfill-nospawn");
            return handlePendingVehicleSpawnSeatFailure(player, slot, failureMode);
        }
        // Guard: slot may have been disabled or retuned during the async spawn above.
        if (!slot.enabled || slot.enableToken !== fulfillToken) {
            if (FEATURE_DEPLOY_DIAGNOSTIC && player && mod.IsPlayerValid(player)) deployDiagSetPrep(player, "fulfill-token");
            clearVehiclePendingSpawnRequestForSlot(slot);
            return { consumedDeploy: false, fulfilled: false };
        }
    } else if (!isDirectSpawnDriverSeatAvailable(vehicle)) {
        if (FEATURE_DEPLOY_DIAGNOSTIC && player && mod.IsPlayerValid(player)) deployDiagSetPrep(player, "fulfill-seatocc");
        clearVehiclePendingSpawnRequestForSlot(slot);
        return { consumedDeploy: false, fulfilled: false };
    } else {
        if (FEATURE_DEPLOY_DIAGNOSTIC && player && mod.IsPlayerValid(player)) deployDiagSetPrep(player, "fulfill-gotveh");
    }

    if (!isDirectSpawnDriverSeatAvailable(vehicle)) {
        if (FEATURE_DEPLOY_DIAGNOSTIC && player && mod.IsPlayerValid(player)) deployDiagSetPrep(player, "fulfill-seatocc");
        return handlePendingVehicleSpawnSeatFailure(player, slot, failureMode);
    }

    // Guard: validate player is still valid and deployed before seating.
    if (!player || !mod.IsPlayerValid(player) || !State.players.deployedByPid[safeGetPlayerId(player)!]) {
        clearVehiclePendingSpawnRequestForSlot(slot);
        return { consumedDeploy: false, fulfilled: false };
    }

    // Pre-set vehicle occupancy cache so safeGetVehicleFromPlayer/safeGetPlayerVehicleSeat
    // don't skip the engine query during verification. OnPlayerEnterVehicle may not have
    // fired yet after ForcePlayerToSeat, but the cache guard (CQ_Bug_37/38) needs it set.
    const preSeatPid = safeGetPlayerId(player);
    if (preSeatPid !== undefined) {
        State.players.posDebugVehicleObjIdByPid[preSeatPid] = getObjId(vehicle);
        State.players.posDebugTransformSourceByPid[preSeatPid] = "vehicle";
    }

    mod.ForcePlayerToSeat(player, vehicle, VEHICLE_DIRECT_SPAWN_FULFILLMENT_SEAT_NUMBER);

    let fulfilled = await verifyPlayerForcedIntoDirectSpawnSeat(player, vehicle);
    if (!fulfilled && isFastMoverDirectSpawnVehicle(slot.vehicleType)) {
        if (FEATURE_DEPLOY_DIAGNOSTIC) deployDiagSetSeat(player, "retry-neg1");
        mod.ForcePlayerToSeat(player, vehicle, -1);
        fulfilled = await verifyPlayerForcedIntoAnyDirectSpawnSeat(player, vehicle);
    }
    if (!fulfilled) {
        if (FEATURE_DEPLOY_DIAGNOSTIC) deployDiagSetSeat(player, "verify-failed");
        return handlePendingVehicleSpawnSeatFailure(player, slot, failureMode);
    }
    if (FEATURE_DEPLOY_DIAGNOSTIC) deployDiagSetSeat(player, "verify-ok");

    const pid = safeGetPlayerId(player);
    clearVehiclePendingSpawnRequestForSlot(slot);
    if (pid !== undefined) {
        slot.activeOwnerPid = pid;
    }
    if (FEATURE_DEPLOY_DIAGNOSTIC && player && mod.IsPlayerValid(player)) deployDiagSetPrep(player, "fulfill-ok");
    updateVehicleDeployTimerHudForAllPlayers();
    return { consumedDeploy: true, fulfilled: true };
}

// Resolves the pending claimed slot on deploy using the direct-spawn seat path.
async function conquestPhase5DTryFulfillVehicleSpawnButtonOnDeploy(player: mod.Player): Promise<ConquestVehicleDirectSpawnDeployResult> {
    return tryFulfillPendingVehicleDirectSpawnSeatForPlayer(player, "undeploy");
}

// Resolves a claimed slot from the live world-terminal menu without undeploying the already-alive player.
async function beginVehicleLiveTerminalSpawnForPlayer(player: mod.Player): Promise<boolean> {
    if (!player || !mod.IsPlayerValid(player)) return false;
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return false;
    if (!State.players.deployedByPid[pid]) return false;
    const result = await tryFulfillPendingVehicleDirectSpawnSeatForPlayer(player, "leave_alive");
    return result.fulfilled;
}

