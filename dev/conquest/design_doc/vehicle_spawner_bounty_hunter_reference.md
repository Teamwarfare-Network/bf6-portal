# BountyHunter Vehicle Spawner Lifecycle — Reference Mapping

Source: `reference_implementations/reference_BountyHunter/src/vehicles.ts` (77 lines total)

---

## Overview

BountyHunter's vehicle spawning is **6 steps, ~30 lines of logic, zero custom tracking**. The engine handles all respawn lifecycle after initial configuration.

---

## Step-by-Step Lifecycle

### Step 1: Game Mode Setup triggers spawn creation
**Where:** `index.ts:170` inside `handleGameModeSetup()`  
**What:** Calls `spawnVehicleSpawners(adminLogger)`  
**When:** `Events.OnGameModeStarted`  
**Purpose:** Entry point. Vehicle spawners are created as part of world setup.

### Step 2: Create the VehicleSpawner object
**Where:** `vehicles.ts:13-17`  
```
const spawner = mod.SpawnObject(
    mod.RuntimeSpawn_Common.VehicleSpawner,
    position,
    Vectors.getRotationVector(orientation)
) as mod.VehicleSpawner;
```
**Purpose:** Creates the spawner entity in the world at the desired position and orientation.  
**Key detail:** The spawner is returned **immediately** via `resolve(spawner)` (line 33). No waiting.

### Step 3: Wait 2 seconds, THEN configure
**Where:** `vehicles.ts:31`  
```
Timers.setTimeout(setupVehicleSpawner, 2_000);
```
**Purpose:** The engine needs time to initialize the spawner object. Configuration applied immediately after `SpawnObject` is silently ignored. The 2-second delay ensures the spawner is ready to accept configuration.

### Step 4: Apply configuration (inside the 2-second callback)
**Where:** `vehicles.ts:19-28`  
```
mod.SetVehicleSpawnerVehicleType(spawner, vehicleType);
mod.SetVehicleSpawnerAutoSpawn(spawner, autoSpawn);
mod.SetVehicleSpawnerRespawnTime(spawner, respawnTime);
```
**Purpose:** Sets the vehicle type, enables auto-spawn, and sets respawn delay.  
**Key detail:** `autoSpawn = true` — the engine handles all spawn triggering. No `ForceVehicleSpawnerSpawn` calls anywhere.

### Step 5: Engine auto-spawns the vehicle
**Where:** Engine-internal (not in script)  
**When:** After configuration takes effect with `autoSpawn = true`  
**Purpose:** The engine spawns the configured vehicle type at the spawner's position automatically.  
**Key detail:** No `ForceVehicleSpawnerSpawn`. No retry loop. No polling. The engine does it.

### Step 6: Engine auto-respawns on destruction
**Where:** Engine-internal (not in script)  
**When:** Vehicle is destroyed, after `respawnTime` seconds (10s for map spawners, 5s for debug spawners)  
**Purpose:** Replacement vehicle appears automatically.  
**Key detail:** No `OnVehicleDestroyed` handler. No `scheduleRespawn`. No `forceSpawnWithRetry`. The engine respawn timer handles everything.

---

## What BountyHunter does NOT have

| Feature | BountyHunter | Conquest |
|---|---|---|
| `ForceVehicleSpawnerSpawn` | Never called | 20-attempt retry loop |
| `OnVehicleSpawned` handler | None | 100+ line bind/classify/correct flow |
| `OnVehicleDestroyed` handler (for respawn) | None | Triggers `scheduleRespawn` chain |
| Vehicle-to-slot tracking | None | `vehicleToSlot` map, `vehicleId` on slot |
| Active spawn tracking | None | `activeSpawnSlotIndex/Token/RequestedAtSeconds` |
| `expectingSpawn` flag | None | Set/cleared across 5+ code paths |
| Spawn transform correction | None | Double-teleport after bind |
| Poll loop for missing vehicles | None | `pollVehicleSpawnerSlots` infinite loop |
| Spawn sequence token | None | Token-guarded sequential spawn queue |
| Retry scheduling | None | `scheduleBlockedSpawnRetry` recursive chain |
| Vehicle search fallback | None | Searches all vehicles within 3x bind radius |
| CQ_Bug_49 guard | None | Rejects default Abrams from aircraft slots |
| CQ_Bug_52 watchdog | None | Clears stuck `expectingSpawn` flags |

---

## What BountyHunter DOES have that matters

1. **2-second delay before configuration** — This is the critical pattern. `SpawnObject` returns immediately but the spawner isn't ready for `SetVehicleSpawner*` calls yet. BountyHunter waits 2 seconds before configuring. Conquest's bootstrap added this delay (v1.255), but `forceSpawnWithRetry` still re-configures with `await mod.Wait(0)` — essentially zero delay.

2. **`autoSpawn = true`** — Lets the engine handle spawn triggering entirely. Conquest sets `autoSpawn = false` and manually calls `ForceVehicleSpawnerSpawn`, taking on all the complexity of spawn orchestration.

3. **No tracking, no binding, no correction** — The spawner owns the lifecycle. BountyHunter doesn't need to know which vehicle belongs to which spawner because it doesn't manage respawns, ownership, or HUD state.

---

## Why Conquest can't use pure autoSpawn

Conquest needs `autoSpawn = false` because:
- **Deploy flow:** Players choose when/where to spawn vehicles in non-Vanilla modes
- **Team ownership:** Vehicles must be registered to teams for scoring/HUD
- **Slot tracking:** HUD shows respawn timers, availability, deploy buttons
- **Type enforcement:** Preset changes swap vehicle types mid-session
- **Position correction:** Some spawners need post-spawn teleport for rotation

But Conquest COULD use the **timing pattern** from BountyHunter:
- Create spawner → wait 2s → configure → THEN trigger spawn
- Instead of: Create spawner → immediately configure → force-spawn in a retry loop

---

## The key lesson for the helicopter bug

BountyHunter spawns AH-64 Apaches (helicopters) from the debug menu using the exact same `createVehicleSpawner` with `autoSpawn = true` and a 2-second config delay. It works.

Conquest's `forceSpawnWithRetry` does this:
1. `configureVehicleSpawner(slot.spawner, slot.vehicleType)` — re-configures
2. `await mod.Wait(0)` — zero delay (yield only)
3. Calls `ForceVehicleSpawnerSpawn` up to 20 times with 0.25s gaps

The spawner may not have absorbed the configuration by the time step 3 starts. Each `ForceVehicleSpawnerSpawn` on an unconfigured spawner produces a default Abrams, which the CQ_Bug_49 guard rejects from aircraft slots. All 20 attempts fail.

**BountyHunter's answer:** wait 2 seconds after configuration before expecting the spawner to work.
