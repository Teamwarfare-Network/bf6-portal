// @ts-nocheck
// Module: vehicles/ownership -- last-driver tracking for spawned vehicles

//#region -------------------- Vehicle Ownership Tracking (vehIds/vehOwners) --------------------
// Vehicle owner cache lifecycle:
// - setLastDriver on entry, popLastDriver on destruction, clearLastDriverByVehicleObjId on spawn/respawn.

function getVehicleId(v: mod.Vehicle): number { return getObjId(v); }

function setLastDriver(vehicle: mod.Vehicle, player: mod.Player): void {
    if (!player || !mod.IsPlayerValid(player)) return;
    const vid = getVehicleId(vehicle);
    // Update existing entry if this vehicle is already tracked.
    for (let i = 0; i < vehIds.length; i++) {
        if (vehIds[i] === vid) {
            vehOwners[i] = player;
            return;
        }
    }
    // First time we see this vehicle: append to the parallel arrays.
    vehIds.push(vid);
    vehOwners.push(player);
}

function popLastDriver(vehicle: mod.Vehicle): mod.Player | undefined {
    const vid = getVehicleId(vehicle);

    for (let i = 0; i < vehIds.length; i++) {
        // Find the vehicle entry, return its owner, then remove it from the cache.
        if (vehIds[i] === vid) {
            const owner = vehOwners[i];

            // Swap-remove to avoid shifting the arrays.
            const lastIdx = vehIds.length - 1;
            vehIds[i] = vehIds[lastIdx];
            vehOwners[i] = vehOwners[lastIdx];
            vehIds.pop();
            vehOwners.pop();

            // Return the removed owner (caller may use for messaging).
            return owner;
        }
    }
    // No cached entry found.
    return undefined;
}

function clearLastDriverByVehicleObjId(vehicleObjId: number): void {
    // Remove the last-driver entry for a specific vehicle ObjId (if it exists).
    for (let i = 0; i < vehIds.length; i++) {
        // Find the matching vehicle id in the parallel arrays.
        if (vehIds[i] === vehicleObjId) {
            // Swap-remove to keep arrays compact without preserving order.
            const lastIdx = vehIds.length - 1;
            vehIds[i] = vehIds[lastIdx];
            vehOwners[i] = vehOwners[lastIdx];
            vehIds.pop();
            vehOwners.pop();
            // Done: there is no longer a cached owner for this vehicle.
            return;
        }
    }
}

//#endregion ----------------- Vehicle Ownership Tracking (vehIds/vehOwners) --------------------
