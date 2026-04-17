# Plan: Fix HQ Deploy for F22/MH6/Eurocopter/JAS39 — Apply BountyHunter spawner initialization pattern

**Created**: 2026-04-16
**Status**: Ready for approval
**Version target**: v1.244

---

## Context

v1.240–v1.243 diagnostic instrumentation (Phase 1 Part A) conclusively proved that `mod.ForceVehicleSpawnerSpawn` on runtime-created VehicleSpawner objects **silently produces no vehicle** for F22, MH6, MH6_Pax, Eurocopter, and JAS39. F16 works reliably on any slot. The engine doesn't fire `OnVehicleSpawned` for the failing types. Swap tests confirmed this is **per-vehicle-type**, not per-slot-position.

**External insight** (from another BF6 Portal modder): *"Trick is you need to wait a bit between spawning the spawner and then setting the options on the spawner — even 1 second is fine."*

**BountyHunter reference implementation** ([reference_BountyHunter/src/vehicles.ts](bf6-portal/dev/conquest/reference_implementations/reference_BountyHunter/src/vehicles.ts)) confirms this with a working dynamic vehicle spawner that uses:
1. A **2-second delay** (`Timers.setTimeout(setup, 2_000)`) between `SpawnObject` and ANY `SetVehicleSpawner*` configuration calls
2. **AutoSpawn** (`SetVehicleSpawnerAutoSpawn(spawner, true)`) instead of `ForceVehicleSpawnerSpawn`

Our code does both wrong: configures immediately after SpawnObject (zero delay), and relies exclusively on `ForceVehicleSpawnerSpawn`.

---

## Root Cause

**Our spawner creation in `addVehicleSpawnerSlot` ([spawner-slots.ts:28–40](bf6-portal/dev/conquest/src/vehicles/spawner-slots.ts#L28-L40))**:
```
SpawnObject(VehicleSpawner) → SetAutoSpawn(false) → configureVehicleSpawner(...)  // ALL IMMEDIATE
```

**BountyHunter's working pattern ([reference_BountyHunter/src/vehicles.ts:5–35](bf6-portal/dev/conquest/reference_implementations/reference_BountyHunter/src/vehicles.ts#L5-L35))**:
```
SpawnObject(VehicleSpawner) → [2 SECOND DELAY] → SetVehicleSpawnerVehicleType + SetAutoSpawn(true) + SetRespawnTime
```

The engine's `RuntimeSpawn_Common.VehicleSpawner` requires time to initialize its internal state after `SpawnObject`. Configuration calls made before initialization are silently ignored. The spawner's vehicle type stays at its default (undefined/broken for most types). Later calls to `ForceVehicleSpawnerSpawn` produce nothing because the spawner's internal type was never properly set.

**Why F16 works**: Unknown engine-internal detail (possibly related to enum order, asset loading priority, or the engine's default spawner prefab). F16 may be the one type whose asset loads fast enough that zero-delay configuration succeeds. Regardless, the BountyHunter pattern should fix all types.

Additionally, `ForceVehicleSpawnerSpawn` itself may be unreliable compared to AutoSpawn for runtime-created spawners. The BountyHunter never uses ForceVehicleSpawnerSpawn — it relies entirely on AutoSpawn.

---

## Changes (3 files, 1 version)

### 1. `spawner-slots.ts` — Remove immediate configuration from `addVehicleSpawnerSlot`

**Current** (lines 28–40): SpawnObject → SetAutoSpawn(false) → configureVehicleSpawner  
**New**: SpawnObject only. Save spawner reference to slot. Do NOT call any `SetVehicleSpawner*` APIs.

Remove lines 37–40:
```typescript
// REMOVE: mod.SetVehicleSpawnerAutoSpawn(spawner, false);
// REMOVE: configureVehicleSpawner(spawner, vehicleType);
```

The slot's `vehicleType` field is still set from the argument — the slot knows its intended type. Configuration is deferred to bootstrap.

### 2. `spawner-bootstrap.ts` — Add 2-second initialization delay in `startVehicleSpawnerSystem`

**Current flow** (lines 36–48):
```
Create team1 spawners → Create team2 spawners → applyVehicleSpawnSpecsToExistingSlots() → cleanup
```

**New flow**:
```
Create team1 spawners → Create team2 spawners → await mod.Wait(2.0) → configure ALL slots → applyVehicleSpawnSpecsToExistingSlots() → cleanup
```

After the two slot-creation loops, insert:
```typescript
// BountyHunter pattern: wait for engine to initialize spawner objects before configuration.
await mod.Wait(2.0);
for (let i = 0; i < State.vehicles.slots.length; i++) {
    const slot = State.vehicles.slots[i];
    configureVehicleSpawner(slot.spawner, slot.vehicleType);
}
```

**Side effect**: During the 2-second wait, the engine may auto-spawn default vehicles (Abrams) on the unconfigured spawners. The existing startup cleanup sweep (lines 54–74) already removes all vehicles near spawn pads, so these get cleaned up. No additional cleanup code needed — just ensure cleanup runs AFTER configuration.

### 3. `spawner-sequence.ts` — Add AutoSpawn fallback in `forceSpawnWithRetry`

**Current** (lines 38–62): configure → Wait(0) → loop 20× { ForceVehicleSpawnerSpawn → Wait(0.25) }

**New**: configure → Wait(1.0) → Phase 1: loop 5× { ForceVehicleSpawnerSpawn → Wait(0.25) } → Phase 2: SetAutoSpawn(true) → loop 15× { poll → Wait(0.25) } → SetAutoSpawn(false)

```typescript
try {
    configureVehicleSpawner(slot.spawner, slot.vehicleType);
    await mod.Wait(1.0);  // Increased: give engine time to process type change

    // Phase 1: ForceVehicleSpawnerSpawn (works for F16/DirtBike/etc)
    for (let attempt = 0; attempt < 5; attempt++) {
        if (!slot.enabled || slot.enableToken !== token) { /* existing bail */ }
        mod.ForceVehicleSpawnerSpawn(slot.spawner);
        if (!slot.expectingSpawn && slot.vehicleId !== -1) return true;
        await mod.Wait(0.25);
    }

    // Phase 2: AutoSpawn fallback (BountyHunter pattern — works for all types)
    mod.SetVehicleSpawnerAutoSpawn(slot.spawner, true);
    for (let attempt = 0; attempt < 15; attempt++) {
        if (!slot.enabled || slot.enableToken !== token) break;
        if (!slot.expectingSpawn && slot.vehicleId !== -1) {
            mod.SetVehicleSpawnerAutoSpawn(slot.spawner, false);
            return true;
        }
        await mod.Wait(0.25);
    }
    mod.SetVehicleSpawnerAutoSpawn(slot.spawner, false);
} catch { /* existing catch */ }
```

**Total timeout**: 1.0s config delay + 1.25s Phase 1 + 3.75s Phase 2 = 6.0s max. Acceptable for on-demand spawns.

---

## What about Air Deploy / Forward Deploy fresh spawner paths?

`spawnFreshAircraftDirectSpawnVehicleForSlot` ([deploy-fulfillment.ts:378–389](bf6-portal/dev/conquest/src/vehicles/deploy-fulfillment.ts#L378-L389)) and `spawnForwardDeployVehicleForSlot` ([deploy-fulfillment.ts:450–461](bf6-portal/dev/conquest/src/vehicles/deploy-fulfillment.ts#L450-L461)) both create NEW runtime spawners mid-match with the same zero-delay pattern.

**Defer to v1.245**: These paths are Air Deploy and Forward Deploy, not HQ Deploy. The HQ Deploy fix is the priority. Apply the same timing pattern to these paths in a follow-up version once HQ Deploy is confirmed working.

---

## What NOT to change

1. **`configureVehicleSpawner` function itself** — stays as-is. Called from many places; the function is fine, the timing of WHEN it's called is the bug.
2. **`applyVehicleSpawnSpecsToExistingSlots`** — stays synchronous. By the time it runs (after 2s wait + initial config), spawners are fully initialized. Ready-dialog reconfiguration should work.
3. **Diagnostic instrumentation (FEATURE_DEPLOY_DIAGNOSTIC)** — keep enabled for this version to verify the fix with HUD telemetry.
4. **No workaround layer removal yet** (CQ_Bug_49 Abrams-reject, activeSpawn singleton, etc.) — Phase 2 Branch (a) from the original plan. Fix the spawn first, clean up later.

---

## Verification

1. `npm run build` — must pass, bundle under 1,048,576 bytes.
2. `npm run bumpVersion -- -c "fix: apply BountyHunter spawner initialization pattern — 2s delay between SpawnObject and configuration at startup + AutoSpawn fallback in forceSpawnWithRetry for vehicle types where ForceVehicleSpawnerSpawn silently fails (F22/MH6/Eurocopter/JAS39)"`
3. **Test matrix** (HQ Deploy from live terminal, alive on foot):
   - F16: must still work (regression check)
   - F22: must now work (primary fix target)
   - MH6: must now work
   - Eurocopter: must now work
   - JAS39: must now work
   - DirtBike: must still work (regression check — fast mover)
4. Diagnostic HUD should show PREP progressing past `fulfill-entry` to `fulfill-gotveh` or spawn→bind→seat for all types.
5. Ground vehicles (Abrams/Leopard/etc.) must still work if they use the same forceSpawnWithRetry path.

---

## Files to modify

| File | Change |
|---|---|
| [src/vehicles/spawner-slots.ts](bf6-portal/dev/conquest/src/vehicles/spawner-slots.ts) | Remove `SetAutoSpawn(false)` + `configureVehicleSpawner` from `addVehicleSpawnerSlot` |
| [src/vehicles/spawner-bootstrap.ts](bf6-portal/dev/conquest/src/vehicles/spawner-bootstrap.ts) | Add `await mod.Wait(2.0)` + config loop in `startVehicleSpawnerSystem` |
| [src/vehicles/spawner-sequence.ts](bf6-portal/dev/conquest/src/vehicles/spawner-sequence.ts) | Rework `forceSpawnWithRetry`: Wait(0)→Wait(1.0), add AutoSpawn fallback after 5 ForceVehicleSpawnerSpawn attempts |

## Existing utilities reused

- `configureVehicleSpawner` — [spawner-slots.ts:4](bf6-portal/dev/conquest/src/vehicles/spawner-slots.ts#L4) (unchanged, just called at different time)
- `VEHICLE_SPAWNER_STARTUP_CLEANUP_RADIUS_METERS` — existing constant, used by startup cleanup sweep
- `refreshVehicleSlotAuthoritativeState` — existing, called from forceSpawnWithRetry (unchanged)
- Diagnostic: `deployDiagSetPrep` markers from v1.241–v1.243 (keep for verification)

## Risk assessment

- **2-second startup delay**: Acceptable. Bootstrap already has `VEHICLE_SPAWNER_START_DELAY_SECONDS` (1s) + inter-slot waits. Adding 2s is invisible to the user.
- **Default Abrams during 2s wait**: Handled by existing cleanup sweep. No user-visible impact.
- **AutoSpawn fallback producing wrong vehicle type**: Mitigated by `configureVehicleSpawner` call before enabling AutoSpawn. If the type is properly set after the 2s init delay, AutoSpawn should produce the correct type. CQ_Bug_49 Abrams-reject guard is still active as a safety net.
- **forceSpawnWithRetry total timeout increase (5s → 6s)**: Marginal. Most successful spawns complete in under 2s. The extra time is only consumed on failure.
