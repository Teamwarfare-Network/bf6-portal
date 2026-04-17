# Vehicle Spawn/Bind Re-Architecture Notes

Saved 2026-04-14 after the v1.223-v1.227 cycle of incremental fixes failed to resolve the Abrams-substitution + seat-fail regressions. Intended as a reference for a future clean restructure, not as a plan to execute immediately.

## Current state (why it's spaghetti)

Three independent subsystems write to the same slot/vehicle mapping:

1. **Event-driven bind** — `onVehicleSpawnedImpl` in [src/index/vehicle-events.ts](bf6-portal/dev/conquest/src/index/vehicle-events.ts). On `OnVehicleSpawned`, runs the 3-tier `findExpectingSpawnerSlotForVehicle` lookup (position within 7m → single-expecting → class-match), plus a 0.2s retry, plus an explicit-bind fallback if lookup found a slot but `bindSpawnedVehicleToSlot` returned 0. Also contains the CQ_Bug_49 Abrams-reject intercept.

2. **Fulfillment poll-then-scan** — `spawnFreshAircraftDirectSpawnVehicleForSlot` / `spawnForwardDeployVehicleForSlot` in [src/vehicles/deploy-fulfillment.ts](bf6-portal/dev/conquest/src/vehicles/deploy-fulfillment.ts). Polls `slot.vehicleId` for up to 2.0s waiting for #1 to bind. If timeout, radius-scans `mod.AllVehicles()` (aircraft: 250m, tank-excluded; forward: 40m, no tank-exclude) and binds inline, bypassing #1.

3. **Watchdog** — `pollVehicleSpawnerSlots` in [src/vehicles/spawner-sequence.ts](bf6-portal/dev/conquest/src/vehicles/spawner-sequence.ts). 5s-interval sweep that clears stuck `expectingSpawn` flags after 10s.

Each layer was added to paper over a specific race. Invariants (who owns `slot.vehicleId`, `slot.expectingSpawn`, `vehicleToSlot[objId]`, `slot.lastRequestedSpawnPos`) are scattered across all three layers. Layers can disagree — e.g., fulfillment's radius scan can bind a vehicle that the event handler then tries to bind again, or the watchdog can clear an `expectingSpawn` flag that fulfillment is still waiting on.

The Phase 1 per-slot rewrite (v1.223) was meant to eliminate the MP singleton race but inherited all three layers unchanged and added `slot.lastRequestedSpawnPos` as a fourth piece of state that each layer reads/writes independently.

## Re-architecture sketch

**Goal:** one source of truth for "this vehicle belongs to this slot." Both entry points (event handler and fulfillment) delegate to it. No layer writes slot/vehicle mapping directly.

### Single bind authority

New function, owned by `spawner-bind.ts`:

```ts
function resolveAndBindVehicleToSlot(
    vehicle: mod.Vehicle,
    source: "event" | "fulfillment_scan"
): { slotIndex: number; bound: boolean; rejected: boolean }
```

All writes to `slot.vehicleId`, `slot.expectingSpawn`, `slot.lastRequestedSpawnPos`, and `State.vehicles.vehicleToSlot` happen inside this function. `vehicle-events.ts` calls it on spawn; fulfillment calls it after its timeout if `slot.vehicleId === -1`. Both callers must not touch mapping state.

### Promise-per-request

Replace fulfillment's poll loop with a resolver stored on the slot:

```ts
type VehicleSpawnerSlot = {
    ...existing fields...
    pendingSpawnResolver?: (vehicle: mod.Vehicle | undefined) => void;
}
```

`spawnFreshAircraftDirectSpawnVehicleForSlot` creates a promise, stores its resolver on the slot, arms `expectingSpawn`, calls `ForceVehicleSpawnerSpawn`, and awaits. `resolveAndBindVehicleToSlot` invokes the resolver the instant it binds. A single 2.0s timeout wraps the promise. No polling, no separate radius-scan fallback — the event IS the signal, and the resolver fires deterministically.

Last-ditch fallback (if timeout elapses with no bind): one radius scan, then fail. Not a parallel binding path.

### Match strategy: 1 tier, not 3

The 3-tier cascade exists because we don't trust any single signal. Cleaner primitive: **identity by spawn token**.

Before calling `ForceVehicleSpawnerSpawn`, increment `slot.spawnRequestToken`. The engine doesn't give us a token back on the event, so we reconstruct identity from `(expectingSpawn === true) + (vehicleType matches engine vehicle name via CompareVehicleName)`. If exactly one expecting slot matches the vehicle's type, it's ours. If multiple, break ties by nearest `lastRequestedSpawnPos`. No fallback soup — either we have a confident match or we reject the vehicle.

Position becomes a tie-breaker only. Class match becomes the primary signal (more reliable than position for fast-moving aircraft).

### CQ_Bug_49 integration

Abrams-reject stays as the first gate inside `resolveAndBindVehicleToSlot`: if we pick a slot whose `vehicleType !== Abrams` and the inbound `CompareVehicleName(v, Abrams) === true`, unspawn and return `{ rejected: true }`. The resolver does not fire — fulfillment's promise stays pending until the real vehicle arrives or the timeout hits.

## Expected net effect

| Metric | Before | After |
|---|---|---|
| Files that write `slot.vehicleId` | 4 | 1 |
| Independent bind paths | 3 | 1 |
| Lookup tiers | 3 | 1 (+ tie-break) |
| Fulfillment poll interval | 0.1s × 20 | event-driven (0) |
| Radius fallback | primary in 2 paths | last-ditch only |
| Estimated lines removed | — | ~150 |

## When to do this

Not now. The current mode has shipped v1.227 and the user's confidence in the spawn stack is low. A rewrite risks making it worse before it gets better, with no way to bisect.

Preconditions before starting:
1. A known-good baseline exists (likely a revert to pre-v1.223, i.e. commit 3aa9edf) that is MP-validated to work for the user's test cases.
2. The rewrite lands as a single commit behind a feature flag or on a branch, with the baseline as the fallback.
3. MP test plan agreed in advance: two players concurrent Air Deploy, two concurrent Forward Deploy, mixed Air+Forward, repeated Air on same slot, round cleanup + restart.

## What NOT to carry forward

- `activeSpawnSlotIndex` / `activeSpawnToken` / `activeSpawnRequestedAtSeconds` global singleton. Do not restore the MP-unsafe version.
- `findExpectingSpawnerSlotForVehicle` three-tier cascade. Replace with the class-match-primary strategy above.
- Parallel binding from `tryFindVehicleNearDirectSpawnAirPoint`. Fulfillment must not bind; only the authority binds.
- `suppressNextBindSpawnTransformCorrection` is load-bearing for aircraft teleport-back prevention — keep it but move the write/read into the authority.

## What to preserve

- Pre-seat `mod.Teleport` before `ForcePlayerToSeat` is BANNED (broke in v1.106-v1.108 and v1.151-v1.154). Do not reintroduce.
- CQ_Bug_49 Abrams-reject intercept semantics. Runtime spawner prefab's AutoSpawn default is Abrams; the authority must always reject wrong-class Abrams before binding.
- `cleanupStaleVehiclesNearPosition` and `isForwardDeployPositionOccupied` (v1.203-v1.204 hardening).
- `slot.freshAirRuntimeSpawner` cleanup on slot disable.
