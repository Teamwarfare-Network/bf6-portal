// @ts-nocheck
// Module: vehicles/spawner-slots -- spawner config, slot registration, and matchup enablement

function configureVehicleSpawner(spawner: mod.VehicleSpawner, vehicleType: mod.VehicleList): void {
    // Spawner settings are tuned for consistent respawn behavior; adjust with caution.
    mod.SetVehicleSpawnerVehicleType(spawner, vehicleType);
    mod.SetVehicleSpawnerAutoSpawn(spawner, false);
    mod.SetVehicleSpawnerRespawnTime(spawner, VEHICLE_SPAWNER_RESPAWN_DELAY_SECONDS);
    mod.SetVehicleSpawnerApplyDamageToAbandonVehicle(spawner, true);
    mod.SetVehicleSpawnerAbandonVehiclesOutOfCombatArea(spawner, true);
    mod.SetVehicleSpawnerTimeUntilAbandon(spawner, VEHICLE_SPAWNER_TIME_UNTIL_ABANDON_SECONDS);
    mod.SetVehicleSpawnerKeepAliveAbandonRadius(spawner, VEHICLE_SPAWNER_KEEP_ALIVE_ABANDON_RADIUS);
    mod.SetVehicleSpawnerKeepAliveSpawnerRadius(spawner, VEHICLE_SPAWNER_KEEP_ALIVE_SPAWNER_RADIUS);
}

// Poll helper: returns undefined if the vehicle no longer exists (destroyed/unspawned/OOB).
function findVehicleById(vehicleId: number): mod.Vehicle | undefined {
    const vehicles = mod.AllVehicles();
    const count = mod.CountOf(vehicles);
    for (let i = 0; i < count; i++) {
        const v = mod.ValueInArray(vehicles, i) as mod.Vehicle;
        if (mod.GetObjId(v) === vehicleId) return v;
    }
    return undefined;
}

// Creates a spawner object, applies map-specific yaw, configures vehicle type, and registers the slot state.
function addVehicleSpawnerSlot(teamId: TeamID, slotNumber: number, spawnPos: mod.Vector, spawnRot: mod.Vector, vehicleType: mod.VehicleList): number {
    const yaw = mod.YComponentOf(spawnRot) + VEHICLE_SPAWN_YAW_OFFSET_DEG;
    const spawnerRot = mod.CreateVector(mod.XComponentOf(spawnRot), yaw, mod.ZComponentOf(spawnRot));
    const spawner = mod.SpawnObject(
        mod.RuntimeSpawn_Common.VehicleSpawner,
        spawnPos,
        spawnerRot
    ) as mod.VehicleSpawner;

    // Disable autos right away to avoid the default vehicle spawning before we configure the spawner.
    mod.SetVehicleSpawnerAutoSpawn(spawner, false);

    configureVehicleSpawner(spawner, vehicleType);

    const slot: VehicleSpawnerSlot = {
        teamId,
        slotNumber,
        spawner,
        spawnerObjId: getObjId(spawner),
        spawnPos,
        spawnRot: spawnerRot,
        vehicleType,
        enabled: false,
        enableToken: 0,
        spawnRequestToken: 0,
        spawnRequestAtSeconds: -1,
        expectingSpawn: false,
        vehicleId: -1,
        respawnRunning: false,
        spawnRetryScheduled: false,
    };

    State.vehicles.slots.push(slot);
    return State.vehicles.slots.length - 1;
}

function getDesiredSpawnerCountsForPreset(presetIndex: number): { team1: number; team2: number } {
    const preset = MATCHUP_PRESETS[presetIndex] ?? MATCHUP_PRESETS[0];
    // Rule: 1v0 still spawns 1 vehicle per side (practice + tooling consistency).
    const desiredTeam1 = Math.max(1, Math.floor(preset.leftPlayers));
    const desiredTeam2 = Math.max(1, Math.floor(preset.rightPlayers));
    return { team1: desiredTeam1, team2: desiredTeam2 };
}

// Toggles slot enabled state; bumps token to cancel pending waits.
// Returns true only when enabling a slot that has no tracked vehicle (needs spawn).
function setSpawnerSlotEnabled(slotIndex: number, enabled: boolean): boolean {
    const slot = State.vehicles.slots[slotIndex];
    if (slot.enabled === enabled) return false;
    slot.enabled = enabled;
    slot.enableToken += 1;
    slot.expectingSpawn = false;
    if (!enabled) return false;
    return slot.vehicleId === -1;
}

// Applies matchup -> desired slot counts, in slotNumber order, and queues sequential spawns for new slots.
function applySpawnerEnablementForMatchup(presetIndex: number, spawnOnEnable: boolean): void {
    if (isMatchLive()) return;

    const desired = getDesiredSpawnerCountsForPreset(presetIndex);
    const team1SlotIndices: number[] = [];
    const team2SlotIndices: number[] = [];
    const spawnQueue: number[] = [];

    for (let i = 0; i < State.vehicles.slots.length; i++) {
        const slot = State.vehicles.slots[i];
        if (slot.teamId === TeamID.Team1) team1SlotIndices.push(i);
        else if (slot.teamId === TeamID.Team2) team2SlotIndices.push(i);
    }

    // Enablement order is driven by slotNumber, not array order.
    team1SlotIndices.sort((a, b) => State.vehicles.slots[a].slotNumber - State.vehicles.slots[b].slotNumber);
    team2SlotIndices.sort((a, b) => State.vehicles.slots[a].slotNumber - State.vehicles.slots[b].slotNumber);

    for (let i = 0; i < team1SlotIndices.length; i++) {
        const slotIndex = team1SlotIndices[i];
        const shouldEnable = i < desired.team1;
        const shouldSpawn = setSpawnerSlotEnabled(slotIndex, shouldEnable);
        if (spawnOnEnable && shouldSpawn) spawnQueue.push(slotIndex);
    }

    for (let i = 0; i < team2SlotIndices.length; i++) {
        const slotIndex = team2SlotIndices[i];
        const shouldEnable = i < desired.team2;
        const shouldSpawn = setSpawnerSlotEnabled(slotIndex, shouldEnable);
        if (spawnOnEnable && shouldSpawn) spawnQueue.push(slotIndex);
    }

    if (spawnOnEnable) {
        // Re-queue any enabled but empty slots to cover rapid preset changes.
        for (let i = 0; i < State.vehicles.slots.length; i++) {
            const slot = State.vehicles.slots[i];
            if (!slot.enabled) continue;
            if (slot.vehicleId !== -1) continue;
            if (slot.expectingSpawn) continue;
            spawnQueue.push(i);
        }
    }

    // Cannot spawn in parallel - spawn sequentially to avoid cross-binding when multiple spawners fire at once.
    if (spawnOnEnable && spawnQueue.length > 0) {
        queueSequentialSpawns(spawnQueue);
    }
}

function queueSequentialSpawns(slotIndices: number[]): void {
    if (slotIndices.length === 0) return;
    // Token cancels any prior spawn sequence if a new one is queued.
    // Consider hardening: If a spawn sequence stalls, spawnSequenceInProgress can remain true and block matchup changes.
    State.vehicles.spawnSequenceToken += 1;
    const token = State.vehicles.spawnSequenceToken;
    State.vehicles.spawnSequenceInProgress = true;
    void runSequentialSpawns(slotIndices, token);
}

