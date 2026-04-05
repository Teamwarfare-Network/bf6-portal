// @ts-nocheck
// Module: vehicles/array-helpers -- engine array helpers for vehicle registry operations

//#region -------------------- Portal Array Helpers (engine arrays) --------------------

// Guard: modlib array functions call CountOf internally; undefined/non-array input causes engine error log spam (CQ_Bug_42).
function arrayContainsVehicle(arr: any, vehicle: mod.Vehicle): boolean {
    if (!arr) return false;
    return modlib.IsTrueForAny(arr, (el: any) => mod.Equals(el, vehicle));
}

// Returns a new array with the target vehicle removed from registry arrays.
// Guard: returns empty array if input is invalid to prevent CountOf errors (CQ_Bug_42).
function arrayRemoveVehicle(arr: any, vehicle: mod.Vehicle): any {
    if (!arr) return mod.EmptyArray();
    return modlib.FilteredArray(arr, (el: any) => mod.NotEqualTo(el, vehicle));
}

//#endregion ----------------- Portal Array Helpers (engine arrays) --------------------

