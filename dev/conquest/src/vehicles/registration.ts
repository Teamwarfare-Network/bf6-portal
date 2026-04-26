// @ts-nocheck
// Module: vehicles/registration -- team vehicle registry + base team inference cache

//#region -------------------- Vehicle Registration (team arrays) --------------------

// Registers vehicles to a team registry for spawn/team inference checks.
// IMPORTANT:
// - Vehicle ID and owning team must stay in sync
// - Reassignments must overwrite previous ownership

function registerVehicleToTeam(vehicle: mod.Vehicle, teamNum: TeamID): void {
    // Ensure the vehicle exists in exactly one registry by removing it from both first.
    mod.SetVariable(regVehiclesTeam1, arrayRemoveVehicle(mod.GetVariable(regVehiclesTeam1), vehicle));
    mod.SetVariable(regVehiclesTeam2, arrayRemoveVehicle(mod.GetVariable(regVehiclesTeam2), vehicle));

    // Append the vehicle to the chosen team's registry array.
    if (teamNum === TeamID.Team1) {
        mod.SetVariable(regVehiclesTeam1, mod.AppendToArray(mod.GetVariable(regVehiclesTeam1), vehicle));
    } else if (teamNum === TeamID.Team2) {
        mod.SetVariable(regVehiclesTeam2, mod.AppendToArray(mod.GetVariable(regVehiclesTeam2), vehicle));
    }
}

// Clears cached inferred base-team entries for vehicle ObjIds.
// Uses Object.keys snapshot to avoid for...in mutation during iteration.
function clearSpawnBaseTeamCache(): void {
    for (const k of Object.keys(vehicleSpawnBaseTeamByObjId)) delete vehicleSpawnBaseTeamByObjId[Number(k)];
}

//#endregion ----------------- Vehicle Registration (team arrays) --------------------

