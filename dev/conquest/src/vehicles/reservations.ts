// @ts-nocheck
// Module: vehicles/reservations -- direct-spawn claim helpers retained after the reservation prototype removal

function clearVehiclePendingSpawnRequestForSlot(slot: VehicleSpawnerSlot | undefined): void {
    if (!slot) return;
    slot.pendingSpawnOwnerPid = undefined;
    slot.pendingSpawnMode = undefined;
}

function clearVehiclePendingSpawnRequestForPid(pid: number): void {
    for (let i = 0; i < State.vehicles.slots.length; i++) {
        if (State.vehicles.slots[i].pendingSpawnOwnerPid === pid) {
            State.vehicles.slots[i].pendingSpawnOwnerPid = undefined;
            State.vehicles.slots[i].pendingSpawnMode = undefined;
        }
    }
}

function findVehicleSlotByPendingSpawnOwnerPid(pid: number | undefined): VehicleSpawnerSlot | undefined {
    if (pid === undefined) return undefined;
    for (let i = 0; i < State.vehicles.slots.length; i++) {
        const slot = State.vehicles.slots[i];
        if (slot.pendingSpawnOwnerPid === pid) return slot;
    }
    return undefined;
}

function clearVehicleReservationForPid(pid: number): void {
    clearVehiclePendingSpawnRequestForPid(pid);
}

function clearAllVehicleReservations(): void {
    const slots = State.vehicles.slots;
    for (let i = 0; i < slots.length; i++) {
        slots[i].pendingSpawnOwnerPid = undefined;
        slots[i].pendingSpawnMode = undefined;
        slots[i].activeOwnerPid = undefined;
    }
}

function validateVehicleSlotReservationState(slot: VehicleSpawnerSlot): void {
    const pendingOwnerPid = slot.pendingSpawnOwnerPid;
    if (pendingOwnerPid === undefined) return;
    if (!slot.enabled || !slot.deployFlowTracked || slot.pendingSpawnMode === undefined || State.players.disconnectedByPid[pendingOwnerPid]) {
        slot.pendingSpawnOwnerPid = undefined;
        slot.pendingSpawnMode = undefined;
        return;
    }

    const pendingPlayer = safeFindPlayer(pendingOwnerPid);
    const pendingTeam = pendingPlayer && mod.IsPlayerValid(pendingPlayer)
        ? safeGetTeamNumberFromPlayer(pendingPlayer, 0)
        : 0;
    if (pendingTeam !== slot.teamId) {
        slot.pendingSpawnOwnerPid = undefined;
        slot.pendingSpawnMode = undefined;
    }
}

function tryClaimVehicleDirectSpawnForPlayer(eventPlayer: mod.Player, slot: VehicleSpawnerSlot | undefined, mode: VehicleDirectSpawnMode): boolean {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer) || !slot) return false;
    if (!isMatchLive() && mode === "air") return false;
    const pid = safeGetPlayerId(eventPlayer);
    if (pid === undefined) return false;
    const playerTeam = safeGetTeamNumberFromPlayer(eventPlayer, 0);
    if (playerTeam !== slot.teamId) return false;
    if (!slot.enabled || !slot.deployFlowTracked) return false;
    if (slot.vehicleId !== -1) return false;
    if (slot.expectingSpawn || slot.respawnRunning || slot.spawnRetryScheduled) return false;
    if (getVehicleSlotRespawnRemainingSeconds(slot) > 0) return false;
    if (slot.pendingSpawnOwnerPid !== undefined && slot.pendingSpawnOwnerPid !== pid) return false;

    clearVehiclePendingSpawnRequestForPid(pid);
    clearVehicleReservationForPid(pid);
    slot.pendingSpawnOwnerPid = pid;
    slot.pendingSpawnMode = mode;
    return true;
}

