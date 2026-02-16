// @ts-nocheck
// Module: index/vehicle-events -- player vehicle enter/exit and vehicle spawn/destroy handlers

//#region -------------------- Exported Event Handlers - Vehicle Entry + Exit --------------------

function onPlayerEnterVehicleImpl(eventPlayer: mod.Player, eventVehicle: mod.Vehicle) {
    if (!mod.IsPlayerValid(eventPlayer)) return;

    const teamNum = getTeamNumber(mod.GetTeam(eventPlayer));
    if (teamNum !== TeamID.Team1 && teamNum !== TeamID.Team2) return;

    // Continuous conquest flow: keep vehicle registration lightweight.
    setLastDriver(eventVehicle, eventPlayer);
    registerVehicleToTeam(eventVehicle, teamNum);
}

function onPlayerExitVehicleImpl(eventPlayer: mod.Player, eventVehicle: mod.Vehicle) {
    if (!mod.IsPlayerValid(eventPlayer)) return;
    return;
}

//#endregion -------------------- Exported Event Handlers - Vehicle Entry + Exit --------------------



//#region -------------------- Exported Event Handlers - Vehicle Spawn + Destroy --------------------

// OnVehicleSpawned:
// Registers a spawned vehicle to the nearest main base team using its world position.
async function onVehicleSpawnedImpl(eventVehicle: mod.Vehicle): Promise<void> {
    // Bind vehicle to a spawner slot first; fall back to base inference if not spawned by our spawners.
    const posObject = mod.GetObjectPosition(eventVehicle);
    let slotIndex = -1;
    const activeIndex = State.vehicles.activeSpawnSlotIndex;
    const activeToken = State.vehicles.activeSpawnToken;
    const activeAt = State.vehicles.activeSpawnRequestedAtSeconds;
    if (activeIndex !== undefined && activeToken !== undefined && activeAt !== undefined) {
        const now = Math.floor(mod.GetMatchTimeElapsed());
        const expired = (now - activeAt) > VEHICLE_SPAWNER_BIND_TIMEOUT_SECONDS;
        const activeSlot = State.vehicles.slots[activeIndex];
        if (!expired && activeSlot && activeSlot.expectingSpawn && activeSlot.spawnRequestToken === activeToken) {
            slotIndex = activeIndex;
        }
    }
    if (slotIndex === -1) {
        slotIndex = findSpawnerSlotByPosition(posObject);
    }
    if (slotIndex >= 0) {
        const slot = State.vehicles.slots[slotIndex];
        if (!slot.enabled) {
            mod.UnspawnObject(eventVehicle);
            return;
        }
        if (!slot.expectingSpawn && slot.vehicleId === -1) {
            // Replace the spawner's initial default spawn with a forced spawn using the configured type.
            mod.UnspawnObject(eventVehicle);
            await mod.Wait(0.1); // Give the engine a moment to clear the spawn before forcing again.
            configureVehicleSpawner(slot.spawner, slot.vehicleType);
            const success = await forceSpawnWithRetry(slotIndex);
            if (!success) {
                void scheduleBlockedSpawnRetry(slotIndex);
            }
            return;
        }
    }
    
    // Primary path: bind to a spawner slot that is expecting this spawn.
    let inferredTeam = bindSpawnedVehicleToSlot(eventVehicle, posObject);

    if (inferredTeam === 0) {
        // Retry once after a short delay in case the spawn position hasn't settled yet.
        await mod.Wait(0.2);
        const posRetry = mod.GetObjectPosition(eventVehicle);
        inferredTeam = bindSpawnedVehicleToSlot(eventVehicle, posRetry);
    }

    const pos = mod.GetVehicleState(eventVehicle, mod.VehicleStateVector.VehiclePosition);
    const vehicleObjId = getObjId(eventVehicle);

    if (inferredTeam === 0) {
        // Fallback path: assign to the nearest main base if within bind radius.
        inferredTeam = inferBaseTeamFromPosition(pos);

        // If the spawn matched a known spawner but failed to bind, bind the slot explicitly.
        if (slotIndex >= 0) {
            const slot = State.vehicles.slots[slotIndex];
            if (slot && slot.enabled && slot.vehicleId === -1) {
                slot.expectingSpawn = false;
                slot.vehicleId = vehicleObjId;
                slot.respawnRunning = false;
                slot.spawnRetryScheduled = false;
                State.vehicles.vehicleToSlot[vehicleObjId] = slotIndex;
            }
        }
    }

    // Bail out if the vehicle didn't spawn near a known team base.
    // Unassigned spawns are not registered and will not count toward scoring/HUD.
    if (inferredTeam !== TeamID.Team1 && inferredTeam !== TeamID.Team2) {
        return;
    }

    // Cache base-team inference for later reconciliation on enter.
    vehicleSpawnBaseTeamByObjId[vehicleObjId] = inferredTeam; 

    // Reset cached owner so enter events can establish a new owner.
    clearLastDriverByVehicleObjId(vehicleObjId); 

    // Spawn-time registration is authoritative only after a slot binds (before any player enters).
    registerVehicleToTeam(eventVehicle, inferredTeam);

    const teamNameKey = getTeamNameKey(inferredTeam);
    const x = Math.floor(mod.XComponentOf(pos));
    const z = Math.floor(mod.ZComponentOf(pos));
    sendHighlightedWorldLogMessage(
        mod.Message(mod.stringkeys.twl.messages.vehicleSpawned, teamNameKey, x, z),
        true,
        undefined,
        mod.stringkeys.twl.messages.vehicleSpawned
    );
}

// OnVehicleDestroyed:
// Conquest cut behavior:
// - No score is awarded from vehicle destruction.
// - No phase transitions are triggered here.
// - Registered vehicles are still deregistered on destroy.
async function onVehicleDestroyedImpl(eventVehicle: mod.Vehicle) {
    const inT1 = arrayContainsVehicle(mod.GetVariable(regVehiclesTeam1), eventVehicle);
    const inT2 = arrayContainsVehicle(mod.GetVariable(regVehiclesTeam2), eventVehicle);

    // Registration is the scoring gate; unregistered vehicles are ignored.
    if (!inT1 && !inT2) {
        return;
    }

    // Conquest cut: vehicle destruction no longer contributes to scoring or phase flow.
    // Keep only registration/ownership cleanup.
    mod.SetVariable(regVehiclesTeam1, arrayRemoveVehicle(mod.GetVariable(regVehiclesTeam1), eventVehicle));
    mod.SetVariable(regVehiclesTeam2, arrayRemoveVehicle(mod.GetVariable(regVehiclesTeam2), eventVehicle));
    popLastDriver(eventVehicle);
}

//#endregion -------------------- Exported Event Handlers - Vehicle Spawn + Destroy --------------------
