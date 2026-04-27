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

    // Cache seatKind at the event boundary -- the boundary classifier reads this directly
    // instead of querying mod.GetVehicleFromPlayer / mod.CompareVehicleName per tick.
    // setPlayerSeatKind triggers refreshPlayerBoundaryState on transition.
    setPlayerSeatKind(eventPlayer, classifyVehicleSeatKind(eventVehicle));

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

function onPlayerExitVehicleImpl(eventPlayer: mod.Player, eventVehicle: mod.Vehicle) {
    if (!isValidPlayer(eventPlayer)) return;
    const vehicleObjId = getObjId(eventVehicle);
    const slotIndex = State.vehicles.vehicleToSlot[vehicleObjId];
    const pid = safeGetPlayerId(eventPlayer);
    if (pid !== undefined) {
        State.players.posDebugTransformSourceByPid[pid] = "soldier";
        delete State.players.posDebugVehicleObjIdByPid[pid];
    }

    // Cache the seat transition -- triggers refreshPlayerBoundaryState so OOB fires immediately
    // when a pilot bails outside the GCZ.
    setPlayerSeatKind(eventPlayer, "on_foot");

    if (slotIndex !== undefined) {
        const slot = State.vehicles.slots[slotIndex];
        if (slot && pid !== undefined && slot.activeOwnerPid === pid) {
            slot.activeOwnerPid = undefined;
            updateVehicleDeployTimerHudForAllPlayers();
        }
    }
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

    // Spawn-position diagnostic message. Gated behind FEATURE_PERF_DIAG (compile-time strip in
    // production) AND the admin's runtime toggle State.admin.perfDiagEnabled (matches the
    // destroy-side pattern). Useful when debugging spawn-transform regressions like the v1.331
    // jet-position one (#82) but spammy for normal play and a 64p match. Toggle on via the
    // perfDiag admin button when needed (admin-panel/events.ts:161).
    if (FEATURE_PERF_DIAG && State.admin.perfDiagEnabled) {
        const teamNameKey = getTeamNameKey(slot.teamId);
        const x = Math.floor(mod.XComponentOf(pos));
        const z = Math.floor(mod.ZComponentOf(pos));
        sendHighlightedWorldLogMessage(
            msg(mod.stringkeys.twl.messages.vehicleSpawned, teamNameKey, x, z),
            true,
            undefined,
            mod.stringkeys.twl.messages.vehicleSpawned
        );
    }
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
