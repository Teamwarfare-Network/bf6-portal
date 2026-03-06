// @ts-nocheck
// Module: vehicles/spawner-sequence -- sequential spawn orchestration, retries, and poll loop

async function runSequentialSpawns(slotIndices: number[], token: number): Promise<void> {
    // Consider hardening: Tight maps are vulnerable if a delayed spawn arrives after the token window; fallback binding may mis-bind.
    for (let i = 0; i < slotIndices.length; i++) {
        if (State.vehicles.spawnSequenceToken !== token) return;
        const slotIndex = slotIndices[i];
        const slot = State.vehicles.slots[slotIndex];
        if (!slot || !slot.enabled || slot.vehicleId !== -1) continue;
        await forceSpawnWithRetry(slotIndex);
        await mod.Wait(0.3);
    }

    if (State.vehicles.spawnSequenceToken === token) {
        State.vehicles.spawnSequenceInProgress = false;
    }
}

// Forces a spawn for a slot, polling until a vehicle binds or attempts are exhausted.
// Aborts if slot is disabled or token changes mid-attempt.
async function forceSpawnWithRetry(slotIndex: number): Promise<boolean> {
    const slot = State.vehicles.slots[slotIndex];
    if (!slot.enabled) return false;
    const token = slot.enableToken;
    slot.expectingSpawn = true;
    slot.spawnRequestToken += 1;
    slot.spawnRequestAtSeconds = Math.floor(mod.GetMatchTimeElapsed());
    State.vehicles.activeSpawnSlotIndex = slotIndex;
    State.vehicles.activeSpawnToken = slot.spawnRequestToken;
    State.vehicles.activeSpawnRequestedAtSeconds = slot.spawnRequestAtSeconds;

    // Re-apply config before forcing spawn to avoid the default vehicle type.
    configureVehicleSpawner(slot.spawner, slot.vehicleType);
    await mod.Wait(0);

    for (let attempt = 0; attempt < 20; attempt++) {
        if (!slot.enabled || slot.enableToken !== token) {
            slot.expectingSpawn = false;
            if (State.vehicles.activeSpawnSlotIndex === slotIndex && State.vehicles.activeSpawnToken === slot.spawnRequestToken) {
                State.vehicles.activeSpawnSlotIndex = undefined;
                State.vehicles.activeSpawnToken = undefined;
                State.vehicles.activeSpawnRequestedAtSeconds = undefined;
            }
            return false;
        }
        mod.ForceVehicleSpawnerSpawn(slot.spawner);

        if (!slot.expectingSpawn && slot.vehicleId !== -1) {
            return true;
        }

        await mod.Wait(0.25);
    }

    slot.expectingSpawn = false;
    if (State.vehicles.activeSpawnSlotIndex === slotIndex && State.vehicles.activeSpawnToken === slot.spawnRequestToken) {
        State.vehicles.activeSpawnSlotIndex = undefined;
        State.vehicles.activeSpawnToken = undefined;
        State.vehicles.activeSpawnRequestedAtSeconds = undefined;
    }
    return false;
}

// Schedules a delayed retry when spawn is blocked; rechecks slot/token before retry.
async function scheduleBlockedSpawnRetry(slotIndex: number): Promise<void> {
    const slot = State.vehicles.slots[slotIndex];
    if (!slot.enabled) return;
    if (slot.spawnRetryScheduled) return;
    slot.spawnRetryScheduled = true;
    const token = slot.enableToken;

    await mod.Wait(VEHICLE_SPAWNER_RESPAWN_DELAY_SECONDS);
    slot.spawnRetryScheduled = false;

    if (!slot.enabled || slot.enableToken !== token) return;
    if (slot.vehicleId !== -1) return;

    const teamNameKey = getTeamNameKey(slot.teamId);
    sendHighlightedWorldLogMessage(
        mod.Message(STR_VEHICLE_SPAWN_RETRY, teamNameKey, VEHICLE_SPAWNER_RESPAWN_DELAY_SECONDS),
        true,
        undefined,
        STR_VEHICLE_SPAWN_RETRY
    );

    const success = await forceSpawnWithRetry(slotIndex);
    if (!success) {
        void scheduleBlockedSpawnRetry(slotIndex);
    }
}

// Waits the respawn delay, clears old vehicle mapping, then spawns a replacement.
// Token-guarded to prevent respawns after disable/retune.
async function scheduleRespawn(slotIndex: number, lastVehicleId: number): Promise<void> {
    const slot = State.vehicles.slots[slotIndex];
    if (!slot.enabled) {
        delete State.vehicles.vehicleToSlot[lastVehicleId];
        if (slot.vehicleId === lastVehicleId) {
            slot.vehicleId = -1;
        }
        return;
    }
    // Guard against overlapping respawn timers for the same slot.
    if (slot.respawnRunning) return;

    slot.respawnRunning = true;
    const token = slot.enableToken;
    await mod.Wait(VEHICLE_SPAWNER_RESPAWN_DELAY_SECONDS);

    if (!slot.enabled || slot.enableToken !== token) {
        slot.respawnRunning = false;
        return;
    }

    delete State.vehicles.vehicleToSlot[lastVehicleId];
    slot.vehicleId = -1;

    const success = await forceSpawnWithRetry(slotIndex);
    if (!success) {
        void scheduleBlockedSpawnRetry(slotIndex);
    }
    slot.respawnRunning = false;
}

// Periodically verifies tracked vehicles still exist; if missing, triggers respawn.
async function pollVehicleSpawnerSlots(): Promise<void> {
    while (true) {
        await mod.Wait(VEHICLE_SPAWNER_POLL_INTERVAL_SECONDS);
        // Pause spawner maintenance during cleanup to avoid late respawns/binds.
        if (State.round.flow.cleanupActive) {
            continue;
        }

        for (let i = 0; i < State.vehicles.slots.length; i++) {
            const slot = State.vehicles.slots[i];
            if (slot.vehicleId === -1) continue;

            const vehicle = findVehicleById(slot.vehicleId);
            if (!vehicle) {
                const oldId = slot.vehicleId;
                slot.vehicleId = -1;
                // In continuous-live conquest, missing slot vehicles should always be replaced.
                scheduleRespawn(i, oldId);
                continue;
            }
        }
    }
}
