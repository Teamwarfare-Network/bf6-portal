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

// Boundary re-evaluation after exiting an aircraft. Above-ceiling exit forces the player
// outside the ground combat zone volume; in-zone landings self-heal via the next area-trigger event.
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

function onPlayerExitVehicleImpl(eventPlayer: mod.Player, eventVehicle: mod.Vehicle) {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    const vehicleObjId = getObjId(eventVehicle);
    const slotIndex = State.vehicles.vehicleToSlot[vehicleObjId];
    const pid = safeGetPlayerId(eventPlayer);
    if (pid !== undefined) {
        State.players.posDebugTransformSourceByPid[pid] = "soldier";
        delete State.players.posDebugVehicleObjIdByPid[pid];
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

// Binds an event-delivered vehicle to whichever slot most recently called ForceVehicleSpawnerSpawn
// via vanilla-spawner. If no slot is expecting a spawn, the event is ignored (no fallback bind).
async function onVehicleSpawnedImpl(eventVehicle: mod.Vehicle): Promise<void> {
    const bound = bindSpawnedVehicleToExpectingSlot(eventVehicle);
    if (!bound) return;

    const pos = mod.GetVehicleState(eventVehicle, mod.VehicleStateVector.VehiclePosition);
    const vehicleObjId = getObjId(eventVehicle);
    const slotIndex = State.vehicles.vehicleToSlot[vehicleObjId];
    if (slotIndex === undefined) return;
    const slot = State.vehicles.slots[slotIndex];
    if (!slot) return;

    vehicleSpawnBaseTeamByObjId[vehicleObjId] = slot.teamId;
    clearLastDriverByVehicleObjId(vehicleObjId);

    const teamNameKey = getTeamNameKey(slot.teamId);
    const x = Math.floor(mod.XComponentOf(pos));
    const z = Math.floor(mod.ZComponentOf(pos));
    sendHighlightedWorldLogMessage(
        mod.Message(mod.stringkeys.twl.messages.vehicleSpawned, teamNameKey, x, z),
        true,
        undefined,
        mod.stringkeys.twl.messages.vehicleSpawned
    );
}

// Routes destroyed vehicle back to vanilla-spawner, which clears the slot bind and
// (if still enabled) starts a Clocks-based respawn countdown.
async function onVehicleDestroyedImpl(eventVehicle: mod.Vehicle) {
    const inT1 = arrayContainsVehicle(mod.GetVariable(regVehiclesTeam1), eventVehicle);
    const inT2 = arrayContainsVehicle(mod.GetVariable(regVehiclesTeam2), eventVehicle);

    onSlotVehicleDestroyed(eventVehicle);

    if (!inT1 && !inT2) return;

    mod.SetVariable(regVehiclesTeam1, arrayRemoveVehicle(mod.GetVariable(regVehiclesTeam1), eventVehicle));
    mod.SetVariable(regVehiclesTeam2, arrayRemoveVehicle(mod.GetVariable(regVehiclesTeam2), eventVehicle));
    popLastDriver(eventVehicle);
}

//#endregion -------------------- Exported Event Handlers - Vehicle Spawn + Destroy --------------------
