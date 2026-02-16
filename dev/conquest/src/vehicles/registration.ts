// @ts-nocheck
// Module: vehicles/registration -- team vehicle registry + base team inference cache

//#region -------------------- Vehicle Registration (team arrays) --------------------

// Registers vehicles to a team registry for spawn/team inference and compatibility checks.
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

function clearSpawnBaseTeamCache(): void {
    for (const k in vehicleSpawnBaseTeamByObjId) delete vehicleSpawnBaseTeamByObjId[k as any];
}

function inferBaseTeamFromPosition(pos: mod.Vector): TeamID | 0 {
    const d1 = mod.DistanceBetween(pos, MAIN_BASE_TEAM1_POS); // Distance from vehicle to Team 1 base anchor.
    const d2 = mod.DistanceBetween(pos, MAIN_BASE_TEAM2_POS); // Distance from vehicle to Team 2 base anchor.
    const best = d1 <= d2 ? TeamID.Team1 : TeamID.Team2; // Pick the nearer base as the inferred team.
    const bestDist = d1 <= d2 ? d1 : d2; // Track the distance to that nearest base.

    if (bestDist > MAIN_BASE_BIND_RADIUS_METERS) { // Outside bind radius: treat as unassigned.
        return 0;
    }

    return best; // Within radius: return the inferred team id.
}

//#endregion ----------------- Vehicle Registration (team arrays) --------------------
