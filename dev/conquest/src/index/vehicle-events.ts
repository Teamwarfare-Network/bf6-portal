// @ts-nocheck
// Module: index/vehicle-events -- player vehicle enter/exit and vehicle spawn/destroy handlers

//#region -------------------- Exported Event Handlers - Vehicle Entry + Exit --------------------

function onPlayerEnterVehicleImpl(eventPlayer: mod.Player, eventVehicle: mod.Vehicle) {
    if (!mod.IsPlayerValid(eventPlayer)) return;
    const pid = safeGetPlayerId(eventPlayer);
    if (pid !== undefined) {
        State.players.posDebugTransformSourceByPid[pid] = "vehicle";
        State.players.posDebugVehicleObjIdByPid[pid] = getObjId(eventVehicle);
    }

    const teamNum = getTeamNumber(mod.GetTeam(eventPlayer));
    if (teamNum !== TeamID.Team1 && teamNum !== TeamID.Team2) return;

    // Continuous conquest flow: keep vehicle registration lightweight.
    setLastDriver(eventVehicle, eventPlayer);
    registerVehicleToTeam(eventVehicle, teamNum);

    const vehicleObjId = getObjId(eventVehicle);
    const slotIndex = State.vehicles.vehicleToSlot[vehicleObjId];
    if (slotIndex !== undefined) {
        const slot = State.vehicles.slots[slotIndex];
        if (slot && safeGetPlayerVehicleSeat(eventPlayer) === 0) {
            slot.activeOwnerPid = safeGetPlayerId(eventPlayer);
            updateVehicleDeployTimerHudForAllPlayers();
        }
    }
}

// Boundary re-evaluation after exiting an aircraft. Checks the soldier's Y against the
// GroundCombatVolume ceiling from the map config. Above ceiling → player is outside the zone
// volume (set false + enforce). Below ceiling → player is inside the volume vertically
// (leave boolean unchanged, no false positive).
// When the player parachutes through the ceiling, OnPlayerEnterAreaTrigger fires on boundary
// crossing and corrects the boolean back to true — so in-zone landings self-heal.
// OnPlayerEnterAreaTrigger does NOT fire on soldier materialization inside a volume (only on
// boundary crossing), which is why we cannot blanket-set false for all exits.
function recheckBoundaryAfterAircraftExit(player: mod.Player, pid: number): void {
    const ceilingY = getGroundCombatZoneCeilingY();
    if (ceilingY === undefined) return;
    try {
        const pos = safeGetSoldierStateVector(player, mod.SoldierStateVector.GetPosition);
        if (!pos) return;
        const soldierY = mod.YComponentOf(pos);
        if (soldierY > ceilingY) {
            State.round.boundary.inGroundCombatZoneByPid[pid] = false;
            refreshPlayerBoundaryState(player);
        }
    } catch {}
}

// Exit hook: direct-spawn ownership is established on fulfillment, not on seat exit.
function onPlayerExitVehicleImpl(eventPlayer: mod.Player, eventVehicle: mod.Vehicle) {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    const vehicleObjId = getObjId(eventVehicle);
    const slotIndex = State.vehicles.vehicleToSlot[vehicleObjId];
    const pid = safeGetPlayerId(eventPlayer);
    if (pid !== undefined) {
        State.players.posDebugTransformSourceByPid[pid] = "soldier";
        delete State.players.posDebugVehicleObjIdByPid[pid];
        // For aircraft exits, check if the soldier is above the ground combat zone ceiling.
        // Ground vehicles (tanks, transports) rarely leave the combat zone — skip recheck.
        if (isAircraftVehicleInstance(eventVehicle)) {
            recheckBoundaryAfterAircraftExit(eventPlayer, pid);
        }
    }
    if (slotIndex === undefined) return;
    const slot = State.vehicles.slots[slotIndex];
    if (!slot || pid === undefined) return;
    if (slot.activeOwnerPid !== pid) return;
    slot.activeOwnerPid = undefined;
    updateVehicleDeployTimerHudForAllPlayers();
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
            try { mod.UnspawnObject(eventVehicle); } catch {}
            return;
        }
        if (!slot.expectingSpawn && slot.vehicleId === -1) {
            // Replace the spawner's initial default spawn with a forced spawn using the configured type.
            try { mod.UnspawnObject(eventVehicle); } catch {}
            await mod.Wait(0.1); // Give the engine a moment to clear the spawn before forcing again.
            configureVehicleSpawner(slot.spawner, slot.vehicleType);
            const success = await forceSpawnWithRetry(slotIndex);
            if (!success) {
                void scheduleBlockedSpawnRetry(slotIndex);
            }
            return;
        }
        // CQ_Bug_49: when the fresh-aircraft air direct-spawn path creates a runtime VehicleSpawner
        // prefab at a birth-spawn volume point, the prefab's baked-in AutoSpawn fires before we can
        // call SetVehicleSpawnerAutoSpawn(false), producing a mid-air Abrams at the slot's aerial
        // spawn position. Despawn that wrong-category vehicle here and return WITHOUT clearing
        // active tracking or slot.expectingSpawn, so the real aircraft from ForceVehicleSpawnerSpawn
        // (configured with the correct VehicleType) can bind on its subsequent OnVehicleSpawned.
        // This intercept must happen BEFORE the bind attempt on line ~96 and the failed-bind
        // fallback on lines ~113-120, because that fallback otherwise force-binds the tank to the
        // aircraft slot (ignoring the reject guard in bindSpawnedVehicleToSlot) when the bind
        // retry at line ~100 leaves inferredTeam === 0 and slot.vehicleId is still -1.
        if (isAircraftSpawnVolumeVehicleType(slot.vehicleType) && isTankVehicleInstance(eventVehicle)) {
            try { mod.UnspawnObject(eventVehicle); } catch {}
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
                bindVehicleToSpawnerSlot(slot, vehicleObjId);
                State.vehicles.vehicleToSlot[vehicleObjId] = slotIndex;
                void maybeApplySpawnTransformCorrectionToVehicle(eventVehicle, slot);
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
    const vehicleObjId = getObjId(eventVehicle);
    const slotIndex = State.vehicles.vehicleToSlot[vehicleObjId];
    if (slotIndex !== undefined) {
        const slot = State.vehicles.slots[slotIndex];
        if (slot) {
            slot.activeOwnerPid = undefined;
            slot.pendingSpawnOwnerPid = undefined;
            slot.pendingSpawnMode = undefined;
            markVehicleSlotDestroyed(slot);
            updateVehicleDeployTimerHudForAllPlayers();
        }
    }

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

