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
                return true;
            }
        } catch {
            // Fall through to id-based signature attempt below.
        }
    }

    try {
        mod.SpawnPlayerFromSpawnPoint(player, spawnPointId);
        if (await waitForPlayerToEnterDeployedState(player)) {
            return true;
        }
    } catch {
        // Fall through to normal engine deploy.
    }

    return false;
}

async function beginVehicleDirectSpawnDeployForPlayer(player: mod.Player): Promise<void> {
    if (!player || !mod.IsPlayerValid(player)) return;
    const pid = safeGetPlayerId(player);
    if (pid !== undefined && isHudTransitionBlockingForPid(pid)) return;
    const slot = getPendingVehicleDirectSpawnSlotForPlayer(player);
    if (slot) {
        const prepared = await preparePendingVehicleDirectSpawnVehicleForPlayer(player, slot);
        if (!prepared) {
            clearVehiclePendingSpawnRequestForSlot(slot);
            updateVehicleDeployTimerHudForAllPlayers();
            return;
        }
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
    if (slot.pendingSpawnMode !== "air" && slot.pendingSpawnMode !== "ground") return false;
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

// CQ_Bug_49: Forces a runtime aircraft spawner at the slot's birth-spawn volume and binds the
// resulting vehicle to the slot. The ordering matters: tracking is armed BEFORE SpawnObject so
// that the synchronous configure + force-spawn block pre-empts the engine's baked-in default
// auto-spawn from `RuntimeSpawn_Common.VehicleSpawner` (which would otherwise spawn an Abrams).
// A wrong-category bind (engine default slipping through) is caught downstream by the tank-instance
// reject guard in `bindSpawnedVehicleToSlot`.
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
    State.vehicles.activeSpawnSlotIndex = slotIndex;
    State.vehicles.activeSpawnToken = slot.spawnRequestToken;
    State.vehicles.activeSpawnRequestedAtSeconds = slot.spawnRequestAtSeconds;

    let spawnedVehicle: mod.Vehicle | undefined = undefined;
    let runtimeSpawner: mod.VehicleSpawner | undefined = undefined;

    try {
        runtimeSpawner = mod.SpawnObject(
            mod.RuntimeSpawn_Common.VehicleSpawner,
            birthSpawn.pos,
            birthSpawn.rot
        ) as mod.VehicleSpawner;
        if (!runtimeSpawner) return undefined;

        mod.SetVehicleSpawnerAutoSpawn(runtimeSpawner, false);
        configureVehicleSpawner(runtimeSpawner, slot.vehicleType);
        await mod.Wait(0);
        mod.ForceVehicleSpawnerSpawn(runtimeSpawner);
        await mod.Wait(VEHICLE_DIRECT_SPAWN_FULFILLMENT_SPAWN_SETTLE_SECONDS);

        spawnedVehicle = await waitForSpawnedVehicleForSlot(slot);
        if (!spawnedVehicle) {
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
                try {
                    mod.UnspawnObject(runtimeSpawner);
                } catch {}
            }
        } else if (runtimeSpawner) {
            slot.freshAirRuntimeSpawner = runtimeSpawner;
        }
    }
}

async function preparePendingVehicleDirectSpawnVehicleForPlayer(player: mod.Player, slot: VehicleSpawnerSlot): Promise<boolean> {
    if (!player || !mod.IsPlayerValid(player)) return false;
    if (!slot.enabled || slot.pendingSpawnOwnerPid === undefined || slot.pendingSpawnMode === undefined) return false;

    if (shouldUseFreshAircraftAirDirectSpawn(slot)) {
        return isVehicleSlotReadyForReservationDeploy(slot);
    }

    const prepToken = slot.enableToken;
    let vehicle = tryGetSpawnedVehicleForSlot(slot);
    if (!vehicle) {
        if (!isVehicleSlotReadyForReservationDeploy(slot)) return false;
        vehicle = await spawnDirectSpawnVehicleIfReady(slot);
        if (!vehicle) return false;
        // Guard: slot may have been disabled or retuned during the async spawn.
        if (!slot.enabled || slot.enableToken !== prepToken) return false;
    }
    if (!isDirectSpawnDriverSeatAvailable(vehicle)) return false;
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
    const slot = getPendingVehicleDirectSpawnSlotForPlayer(player);
    const pendingMode = getPendingVehicleDirectSpawnModeForPlayer(player);
    if (!slot) {
        return { consumedDeploy: false, fulfilled: false };
    }
    if (pendingMode !== "air" && pendingMode !== "ground") {
        clearVehiclePendingSpawnRequestForSlot(slot);
        return { consumedDeploy: false, fulfilled: false };
    }
    if (!canFulfillVehicleDirectSpawnForPlayer(player, slot)) {
        clearVehiclePendingSpawnRequestForSlot(slot);
        return { consumedDeploy: false, fulfilled: false };
    }

    const useFreshAircraftAirDirectSpawn = shouldUseFreshAircraftAirDirectSpawn(slot);
    const fulfillToken = slot.enableToken;
    let vehicle = tryGetSpawnedVehicleForSlot(slot);
    if (!vehicle) {
        if (!isVehicleSlotReadyForReservationDeploy(slot)) {
            clearVehiclePendingSpawnRequestForSlot(slot);
            return { consumedDeploy: false, fulfilled: false };
        }
        vehicle = useFreshAircraftAirDirectSpawn
            ? await spawnFreshAircraftDirectSpawnVehicleForSlot(slot)
            : await spawnDirectSpawnVehicleIfReady(slot);
        if (!vehicle) {
            return handlePendingVehicleSpawnSeatFailure(player, slot, failureMode);
        }
        // Guard: slot may have been disabled or retuned during the async spawn above.
        if (!slot.enabled || slot.enableToken !== fulfillToken) {
            clearVehiclePendingSpawnRequestForSlot(slot);
            return { consumedDeploy: false, fulfilled: false };
        }
    } else if (!isDirectSpawnDriverSeatAvailable(vehicle)) {
        clearVehiclePendingSpawnRequestForSlot(slot);
        return { consumedDeploy: false, fulfilled: false };
    }

    if (!isDirectSpawnDriverSeatAvailable(vehicle)) {
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
        mod.ForcePlayerToSeat(player, vehicle, -1);
        fulfilled = await verifyPlayerForcedIntoAnyDirectSpawnSeat(player, vehicle);
    }
    if (!fulfilled) {
        return handlePendingVehicleSpawnSeatFailure(player, slot, failureMode);
    }

    const pid = safeGetPlayerId(player);
    clearVehiclePendingSpawnRequestForSlot(slot);
    if (pid !== undefined) {
        slot.activeOwnerPid = pid;
    }
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

