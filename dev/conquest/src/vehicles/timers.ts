// @ts-nocheck
// Module: vehicles/timers -- slot-time accessors bridging deploy-timer-ui/map-runtime to Clocks-backed countdowns
//
// v1.258 rewrite: the authoritative respawn timer lives on slot.respawnClock (a
// Clocks.CountDownClock owned by vanilla-spawner). This module keeps the two
// read helpers that external modules still reference.

// Returns remaining whole seconds until the slot's countdown completes, or 0 if no
// countdown is active (active vehicle, no-pending, or disabled slot).
function getVehicleSlotRespawnRemainingSeconds(slot: VehicleSpawnerSlot): number {
    if (!slot || !slot.respawnClock) return 0;
    return Math.max(0, Math.ceil(slot.respawnClock.seconds));
}

// No-op in the Vanilla-only rewrite; preserved for map-runtime compatibility while
// legacy authoritative-state fields remain on the slot. Safe to remove once the slot
// type is simplified to the minimal field set.
function refreshVehicleSlotAuthoritativeState(_slot: VehicleSpawnerSlot): void {
    // intentionally empty
}
