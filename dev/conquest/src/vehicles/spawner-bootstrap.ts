// @ts-nocheck
// Module: vehicles/spawner-bootstrap -- one-time spawner startup and initial spawn kick

// Reveals the vehicle-spawner HUD family once slot inventory exists for already-warmed undeployed players.
// This preserves the Phase 5G ownership rule: routine refresh stays content-only, but startup lifecycle can still own first reveal.
function revealVehicleSpawnerUiAfterStartup(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const player = mod.ValueInArray(players, i) as mod.Player;
        if (!player || !mod.IsPlayerValid(player)) continue;
        const pid = safeGetPlayerId(player);
        if (pid === undefined) continue;
        if (State.players.deployedByPid[pid]) continue;
        if (State.players.readyDialogData[pid]?.dialogVisible) continue;
        if (!isHudWarmReadyForPid(pid) || isHudSwapTransitionActiveForPid(pid)) continue;
        renderVehicleSpawnerUiFamilyForReveal(player, pid);
    }
}

async function startVehicleSpawnerSystem(): Promise<void> {
    // WARNING: This should run once per match; duplicate runs can create extra spawners/slots.
    // Ensure map config is applied before any spawners are created or forced to spawn.
    while (!State.vehicles.configReady) {
        await mod.Wait(0.1);
    }
    await mod.Wait(VEHICLE_SPAWNER_START_DELAY_SECONDS);

    State.vehicles.slots.length = 0;
    State.vehicles.vehicleToSlot = {};
    State.vehicles.desiredEnabledSlotsTeam1 = 0;
    State.vehicles.desiredEnabledSlotsTeam2 = 0;
    State.vehicles.spawnSequenceInProgress = false;
    clearAllVehicleReservations();

    const team1Specs = [...TEAM1_VEHICLE_SLOT_INVENTORY_SPECS].sort((a, b) => a.slotNumber - b.slotNumber);
    const team2Specs = [...TEAM2_VEHICLE_SLOT_INVENTORY_SPECS].sort((a, b) => a.slotNumber - b.slotNumber);

    for (const spec of team1Specs) {
        addVehicleSpawnerSlot(TeamID.Team1, spec.slotNumber, spec.pos, spec.rot, spec.vehicle);
    }
    for (const spec of team2Specs) {
        addVehicleSpawnerSlot(TeamID.Team2, spec.slotNumber, spec.pos, spec.rot, spec.vehicle);
    }

    // Startup must sync the already-confirmed package into the newly-created slot inventory
    // before first enable/reveal so the pre-live vehicle HUD matches the ready-dialog defaults.
    applyVehicleSpawnSpecsToExistingSlots();

    // One-time cleanup: remove any default vehicles sitting on or near spawn pads before first forced spawns.
    // This prevents a default Abrams from persisting if it spawned before our spawners were configured.
    // Keep this one-shot and pre-live to avoid deleting player vehicles later in the match.
    // Consider Hardening with a second cleanup pass before first forced spawns if default spawns reappear after cleanup
    if (!isMatchLive() && !State.vehicles.startupCleanupDone) {
        const vehicles = mod.AllVehicles();
        const vCount = mod.CountOf(vehicles);
        for (let v = 0; v < vCount; v++) {
            const vehicle = mod.ValueInArray(vehicles, v) as mod.Vehicle;
            if (!vehicle) continue;
            const pos = mod.GetObjectPosition(vehicle);
            let nearSpawn = false;
            for (let i = 0; i < State.vehicles.slots.length; i++) {
                const slot = State.vehicles.slots[i];
                if (mod.DistanceBetween(pos, slot.spawnPos) <= VEHICLE_SPAWNER_STARTUP_CLEANUP_RADIUS_METERS) {
                    nearSpawn = true;
                    break;
                }
            }
            if (nearSpawn) {
                mod.UnspawnObject(vehicle);
            }
        }
        State.vehicles.startupCleanupDone = true;
    }


    // Extra short wait reduces the chance of a default spawn appearing after cleanup.
    await mod.Wait(0.1);
    // Apply enablement before spawning so only the desired slots can spawn.
    applySpawnerEnablementForMatchup(State.round.matchupPresetIndex, false);
    revealVehicleSpawnerUiAfterStartup();

    // Kick initial spawns so each slot has a vehicle bound before the poll loop starts.
    for (let i = 0; i < State.vehicles.slots.length; i++) {
        const slot = State.vehicles.slots[i];
        if (!slot?.enabled) continue;
        if (shouldGateVehicleSlotSpawnUntilReservationDeploy(slot)) continue;
        const success = await forceSpawnWithRetry(i);
        if (!success) {
            void scheduleBlockedSpawnRetry(i);
        }
        await mod.Wait(0.5);
    }

    // Long-running poll loop to detect missing vehicles and respawn.
    void pollVehicleSpawnerSlots();
}

//#endregion ----------------- Vehicle Spawner System --------------------
