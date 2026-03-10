// @ts-nocheck
// Module: vehicles/array-helpers -- engine array helpers for vehicle registry operations

//#region -------------------- Portal Array Helpers (engine arrays) --------------------

function arrayContainsVehicle(arr: any, vehicle: mod.Vehicle): boolean {
    return modlib.IsTrueForAny(arr, (el: any) => mod.Equals(el, vehicle));
}

// Returns a new array with the target vehicle removed from registry arrays.
function arrayRemoveVehicle(arr: any, vehicle: mod.Vehicle): any {
    // FilteredArray must remain stable across engine updates; registry correctness depends on it.
    return modlib.FilteredArray(arr, (el: any) => mod.NotEqualTo(el, vehicle));
}

//#endregion ----------------- Portal Array Helpers (engine arrays) --------------------
