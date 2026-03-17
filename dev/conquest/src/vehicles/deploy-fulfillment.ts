// @ts-nocheck
// Module: vehicles/deploy-fulfillment -- direct vehicle spawn-button fulfillment on deploy

const VEHICLE_DIRECT_SPAWN_FULFILLMENT_SEAT_NUMBER = 0;
const VEHICLE_DIRECT_SPAWN_FULFILLMENT_SPAWN_SETTLE_SECONDS = 0.1;
const VEHICLE_DIRECT_SPAWN_FULFILLMENT_POST_SEAT_TELEPORT_DELAY_SECONDS = 0.1;
const VEHICLE_DIRECT_SPAWN_FULFILLMENT_POST_TELEPORT_SETTLE_SECONDS = 0.1;
const VEHICLE_DIRECT_SPAWN_FULFILLMENT_VERIFY_INTERVAL_SECONDS = 0.05;
const VEHICLE_DIRECT_SPAWN_FULFILLMENT_VERIFY_ATTEMPTS = 10;
const VEHICLE_DIRECT_SPAWN_FULFILLMENT_UNDEPLOY_DELAY_SECONDS = 0.05;
const VEHICLE_DIRECT_SPAWN_DEPLOY_VERIFY_INTERVAL_SECONDS = 0.05;
const VEHICLE_DIRECT_SPAWN_DEPLOY_VERIFY_ATTEMPTS = 8;
const VEHICLE_DIRECT_SPAWN_BIND_VERIFY_INTERVAL_SECONDS = 0.1;
const VEHICLE_DIRECT_SPAWN_BIND_VERIFY_ATTEMPTS = 10;

type ConquestVehicleDirectSpawnDeployResult = {
    consumedDeploy: boolean;
    fulfilled: boolean;
};

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
    if (pid !== undefined && isHudLoadingGateActiveForPid(pid)) return;
    const slot = getPendingVehicleDirectSpawnSlotForPlayer(player);
    if (slot) {
        const prepared = await preparePendingVehicleDirectSpawnVehicleForPlayer(player, slot);
        if (!prepared) {
            clearVehiclePendingSpawnRequestForSlot(slot);
            conquestPhase5BRenderVehicleDeployTimersForAllPlayers();
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

async function forceUndeployAfterVehicleDirectSpawnFailure(player: mod.Player): Promise<void> {
    await mod.Wait(VEHICLE_DIRECT_SPAWN_FULFILLMENT_UNDEPLOY_DELAY_SECONDS);
    if (!player || !mod.IsPlayerValid(player)) return;
    const pid = safeGetPlayerId(player);
    if (pid === undefined || !State.players.deployedByPid[pid]) return;
    mod.UndeployPlayer(player);
}

async function spawnDirectSpawnVehicleIfReady(slot: VehicleSpawnerSlot): Promise<mod.Vehicle | undefined> {
    let vehicle = tryGetSpawnedVehicleForSlot(slot);
    if (vehicle) return vehicle;
    if (!isVehicleSlotReadyForReservationDeploy(slot)) return undefined;

    const slotIndex = State.vehicles.slots.indexOf(slot);
    if (slotIndex === -1) return undefined;
    const success = await forceSpawnWithRetry(slotIndex);
    if (!success) return undefined;

    await mod.Wait(VEHICLE_DIRECT_SPAWN_FULFILLMENT_SPAWN_SETTLE_SECONDS);
    vehicle = await waitForSpawnedVehicleForSlot(slot);
    return vehicle;
}

async function preparePendingVehicleDirectSpawnVehicleForPlayer(player: mod.Player, slot: VehicleSpawnerSlot): Promise<boolean> {
    if (!player || !mod.IsPlayerValid(player)) return false;
    if (!slot.enabled || slot.pendingSpawnOwnerPid === undefined || slot.pendingSpawnMode === undefined) return false;

    let vehicle = tryGetSpawnedVehicleForSlot(slot);
    if (!vehicle) {
        if (!isVehicleSlotReadyForReservationDeploy(slot)) return false;
        vehicle = await spawnDirectSpawnVehicleIfReady(slot);
        if (!vehicle) return false;
    }
    if (!isDirectSpawnDriverSeatAvailable(vehicle)) return false;
    return true;
}

async function verifyPlayerForcedIntoDirectSpawnSeat(player: mod.Player, vehicle: mod.Vehicle): Promise<boolean> {
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return false;

    for (let attempt = 0; attempt < VEHICLE_DIRECT_SPAWN_FULFILLMENT_VERIFY_ATTEMPTS; attempt++) {
        if (!player || !mod.IsPlayerValid(player) || !State.players.deployedByPid[pid]) return false;
        const seatedVehicle = mod.GetVehicleFromPlayer(player);
        const seatIndex = mod.GetPlayerVehicleSeat(player);
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
        const seatedVehicle = mod.GetVehicleFromPlayer(player);
        const seatIndex = mod.GetPlayerVehicleSeat(player);
        if (seatedVehicle && mod.Equals(seatedVehicle, vehicle) && seatIndex >= 0) {
            return true;
        }
        await mod.Wait(VEHICLE_DIRECT_SPAWN_FULFILLMENT_VERIFY_INTERVAL_SECONDS);
    }

    return false;
}

async function tryTeleportDirectSpawnVehicleIntoBoundedAirVolume(
    player: mod.Player,
    vehicle: mod.Vehicle | undefined,
    slot: VehicleSpawnerSlot
): Promise<void> {
    if (!player || !mod.IsPlayerValid(player) || !vehicle) return;
    const boundedTransform = tryResolveBoundedSpawnTransformForSlot(slot);
    if (!boundedTransform) return;

    await mod.Wait(VEHICLE_DIRECT_SPAWN_FULFILLMENT_POST_SEAT_TELEPORT_DELAY_SECONDS);
    if (!player || !mod.IsPlayerValid(player)) return;

    const seatedVehicle = mod.GetVehicleFromPlayer(player);
    if (!seatedVehicle || !mod.Equals(seatedVehicle, vehicle)) return;
    if (mod.GetPlayerVehicleSeat(player) !== VEHICLE_DIRECT_SPAWN_FULFILLMENT_SEAT_NUMBER) return;

    await teleportVehicleToTransform(vehicle, boundedTransform.pos, boundedTransform.rot);
    await mod.Wait(VEHICLE_DIRECT_SPAWN_FULFILLMENT_POST_TELEPORT_SETTLE_SECONDS);
}

async function conquestPhase5DTryFulfillVehicleSpawnButtonOnDeploy(player: mod.Player): Promise<ConquestVehicleDirectSpawnDeployResult> {
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

    let vehicle = tryGetSpawnedVehicleForSlot(slot);
    if (!vehicle) {
        if (!isVehicleSlotReadyForReservationDeploy(slot)) {
            clearVehiclePendingSpawnRequestForSlot(slot);
            return { consumedDeploy: false, fulfilled: false };
        }
        vehicle = await spawnDirectSpawnVehicleIfReady(slot);
        if (!vehicle) {
            clearVehiclePendingSpawnRequestForSlot(slot);
            conquestPhase5BRenderVehicleDeployTimersForAllPlayers();
            void forceUndeployAfterVehicleDirectSpawnFailure(player);
            return { consumedDeploy: true, fulfilled: false };
        }
    } else if (!isDirectSpawnDriverSeatAvailable(vehicle)) {
        clearVehiclePendingSpawnRequestForSlot(slot);
        return { consumedDeploy: false, fulfilled: false };
    }

    if (!isDirectSpawnDriverSeatAvailable(vehicle)) {
        clearVehiclePendingSpawnRequestForSlot(slot);
        conquestPhase5BRenderVehicleDeployTimersForAllPlayers();
        void forceUndeployAfterVehicleDirectSpawnFailure(player);
        return { consumedDeploy: true, fulfilled: false };
    }

    mod.ForcePlayerToSeat(player, vehicle, VEHICLE_DIRECT_SPAWN_FULFILLMENT_SEAT_NUMBER);

    let fulfilled = await verifyPlayerForcedIntoDirectSpawnSeat(player, vehicle);
    if (!fulfilled && isFastMoverDirectSpawnVehicle(slot.vehicleType)) {
        mod.ForcePlayerToSeat(player, vehicle, -1);
        fulfilled = await verifyPlayerForcedIntoAnyDirectSpawnSeat(player, vehicle);
    }
    if (!fulfilled) {
        clearVehiclePendingSpawnRequestForSlot(slot);
        conquestPhase5BRenderVehicleDeployTimersForAllPlayers();
        void forceUndeployAfterVehicleDirectSpawnFailure(player);
        return { consumedDeploy: true, fulfilled: false };
    }

    if (pendingMode === "air") {
        await tryTeleportDirectSpawnVehicleIntoBoundedAirVolume(player, vehicle, slot);
    }

    const pid = safeGetPlayerId(player);
    clearVehiclePendingSpawnRequestForSlot(slot);
    if (pid !== undefined) {
        slot.activeOwnerPid = pid;
    }
    conquestPhase5BRenderVehicleDeployTimersForAllPlayers();
    return { consumedDeploy: true, fulfilled: true };
}
