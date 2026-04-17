# Vehicle Spawner Lifecycle Audit

Traces every step from bootstrap to a vehicle being bound to its slot.
Written to expose where complexity has accumulated and what each piece actually does.

---

## Constants

| Constant | Value | Where |
|----------|-------|-------|
| `VEHICLE_SPAWNER_START_DELAY_SECONDS` | 1 | gameplay.ts |
| `VEHICLE_SPAWNER_BIND_TIMEOUT_SECONDS` | 2.0 | gameplay.ts |
| `VEHICLE_SPAWNER_BIND_DISTANCE_METERS` | 7.0 | gameplay.ts |
| `VEHICLE_SPAWNER_RESPAWN_DELAY_SECONDS` | 120 | gameplay.ts |
| `VEHICLE_SPAWNER_POLL_INTERVAL_SECONDS` | 5.0 | gameplay.ts |
| `VEHICLE_SPAWNER_STARTUP_CLEANUP_RADIUS_METERS` | 50.0 | gameplay.ts |
| `VEHICLE_SPAWNER_STUCK_EXPECTING_SPAWN_THRESHOLD_SECONDS` | 10.0 | gameplay.ts |
| `VEHICLE_SPAWNER_TIME_UNTIL_ABANDON_SECONDS` | 30 | gameplay.ts |
| `VEHICLE_SPAWNER_KEEP_ALIVE_ABANDON_RADIUS` | 100 | gameplay.ts |
| `VEHICLE_SPAWNER_KEEP_ALIVE_SPAWNER_RADIUS` | 50 | gameplay.ts |
| `VEHICLE_SPAWN_YAW_OFFSET_DEG` (Op Firestorm) | 0 | operation-firestorm.ts |
| `VEHICLE_DIRECT_SPAWN_FULFILLMENT_SPAWN_SETTLE_SECONDS` | 0.1 | deploy-fulfillment.ts |
| `VEHICLE_DIRECT_SPAWN_BIND_VERIFY_ATTEMPTS` | 10 | deploy-fulfillment.ts |
| `VEHICLE_DIRECT_SPAWN_BIND_VERIFY_INTERVAL_SECONDS` | 0.1 | deploy-fulfillment.ts |

---

## Phase 1: Bootstrap (`startVehicleSpawnerSystem`)

**File:** `spawner-bootstrap.ts`

### Step 1 — Wait for map config
```
while (!State.vehicles.configReady) await mod.Wait(0.1);
```
**Why:** Map config sets spawn positions, vehicle types, spawn volumes. Nothing can proceed without it.

### Step 2 — Startup delay
```
await mod.Wait(1);  // VEHICLE_SPAWNER_START_DELAY_SECONDS
```
**Why:** Gives the engine a moment after match start before we create spawner objects.

### Step 3 — Reset state
```
State.vehicles.slots.length = 0;
State.vehicles.vehicleToSlot = {};
State.vehicles.desiredEnabledSlotsTeam1 = 0;
State.vehicles.desiredEnabledSlotsTeam2 = 0;
State.vehicles.spawnSequenceInProgress = false;
clearAllVehicleReservations();
```
**Why:** Clean slate. Prevents stale data from a prior bootstrap run.

### Step 4 — Create all spawner slots
```
for (const spec of team1Specs) addVehicleSpawnerSlot(TeamID.Team1, spec.slotNumber, spec.pos, spec.rot, spec.vehicle);
for (const spec of team2Specs) addVehicleSpawnerSlot(TeamID.Team2, ...);
```
Each call to `addVehicleSpawnerSlot` (spawner-slots.ts):
1. Applies yaw offset to rotation
2. `mod.SpawnObject(RuntimeSpawn_Common.VehicleSpawner, spawnPos, spawnerRot)` — creates engine spawner object
3. `mod.SetVehicleSpawnerAutoSpawn(spawner, false)` — suppress default Abrams auto-spawn
4. Creates a `VehicleSpawnerSlot` record: `enabled: false`, `vehicleId: -1`, `expectingSpawn: false`
5. Pushes to `State.vehicles.slots`

**Why:** Each slot represents one vehicle pad. The spawner object is the engine hook that lets us call `ForceVehicleSpawnerSpawn` later. AutoSpawn is suppressed immediately because the engine default is to auto-spawn an Abrams the moment the spawner exists.

**Note:** Full configuration (vehicle type, abandon radius, etc.) is NOT applied here — only AutoSpawn(false). Full config is deferred to Step 6.

### Step 5 — Engine initialization delay
```
await mod.Wait(2.0);
```
**Why:** The engine needs time to initialize the spawner objects. `SetVehicleSpawner*` calls on a freshly-spawned spawner can be silently ignored. This 2-second delay ensures the engine is ready to accept our configuration.

### Step 6 — Configure all spawners
```
for (let i = 0; i < State.vehicles.slots.length; i++) {
    configureVehicleSpawner(State.vehicles.slots[i].spawner, State.vehicles.slots[i].vehicleType);
}
```
`configureVehicleSpawner` (spawner-slots.ts) calls:
- `SetVehicleSpawnerVehicleType(spawner, vehicleType)` — e.g. UH60, AH6M, F16, Abrams
- `SetVehicleSpawnerAutoSpawn(spawner, false)` — redundant but defensive
- `SetVehicleSpawnerRespawnTime(spawner, 120)`
- `SetVehicleSpawnerApplyDamageToAbandonVehicle(spawner, true)`
- `SetVehicleSpawnerAbandonVehiclesOutOfCombatArea(spawner, true)`
- `SetVehicleSpawnerTimeUntilAbandon(spawner, 30)`
- `SetVehicleSpawnerKeepAliveAbandonRadius(spawner, 100)`
- `SetVehicleSpawnerKeepAliveSpawnerRadius(spawner, 50)`

**Why:** Now that the engine has initialized the spawner objects, we set the vehicle type and all behavioral properties.

### Step 7 — Apply spawn specs from mode config
```
applyVehicleSpawnSpecsToExistingSlots();
```
(map-runtime.ts) For each slot:
- If vehicle type changed from spec: updates `slot.vehicleType`, re-configures spawner
- If position changed (>1m): calls `relocateSlotSpawner` which destroys the old spawner object and creates a new one at the spec position
- Updates `slot.spawnPos` and `slot.spawnRot` to the spec values
- Calls `refreshVehicleSlotAuthoritativeState(slot)`

**Why:** The ready dialog may have changed vehicle types or the mode config preset may differ from the default used during slot creation. This syncs slots to the confirmed config.

**Risk:** `relocateSlotSpawner` creates a FRESH spawner object and immediately configures it — same premature-config pattern we deferred in Step 4. If the position matches (which it does at startup for standard configs), this does NOT fire.

### Step 8 — Startup cleanup sweep
```
if (!isMatchLive() && !State.vehicles.startupCleanupDone) {
    // For each vehicle in world: if within 50m of any slot's spawnPos, unspawn it
    State.vehicles.startupCleanupDone = true;
}
```
**Why:** Despite suppressing AutoSpawn, the engine may have placed default vehicles near spawn pads before our scripts loaded. This sweep removes them.

### Step 9 — Short wait
```
await mod.Wait(0.1);
```
**Why:** Reduces chance of a default spawn appearing after cleanup.

### Step 10 — Enable slots for current matchup
```
applySpawnerEnablementForMatchup(State.round.matchupPresetIndex, false);
```
(spawner-slots.ts) For each slot:
- Determines if slot should be enabled based on the active vehicle spawn specs
- Calls `setSpawnerSlotEnabled(slotIndex, shouldEnable)`:
  - Sets `slot.enabled`, increments `slot.enableToken`
  - If disabling: unspawns any pre-live vehicle, clears owners/timers
  - If enabling: returns `slot.vehicleId === -1` (needs spawn)

The second argument `false` means `spawnOnEnable = false` — we do NOT spawn here, just toggle enablement.

**Why:** Not all slots are active in every matchup. A 1v1 has fewer vehicles than a 4v4.

### Step 11 — Reveal vehicle HUD
```
revealVehicleSpawnerUiAfterStartup();
```
**Why:** Shows the vehicle status panel to undeployed players now that slot inventory exists.

### Step 12 — Initial spawn kick
```
for (let i = 0; i < State.vehicles.slots.length; i++) {
    const slot = State.vehicles.slots[i];
    if (!slot?.enabled) continue;
    if (shouldGateVehicleSlotSpawnUntilReservationDeploy(slot)) continue;
    const success = await forceSpawnWithRetry(i);
    if (!success) void scheduleBlockedSpawnRetry(i);
    await mod.Wait(0.5);
}
```
- Skips disabled slots
- Skips deploy-flow-tracked slots (non-Vanilla modes gate aircraft/ground behind deploy buttons)
- In Vanilla Deploy mode: ALL enabled slots are spawned here
- 0.5-second gap between each slot to avoid cross-slot binding

**Why:** Each enabled, ungated slot needs a vehicle. This is the first time `ForceVehicleSpawnerSpawn` is called.

### Step 13 — Start poll loop
```
void pollVehicleSpawnerSlots();
```
Long-running loop (every 5 seconds) that checks each slot's tracked vehicle still exists. If missing, triggers respawn.

---

## Phase 2: `forceSpawnWithRetry` (spawner-sequence.ts)

This is the function that actually makes a vehicle appear at a spawner slot. Called from:
- Bootstrap initial spawn kick (Step 12)
- `scheduleBlockedSpawnRetry`
- `scheduleRespawn`
- `onVehicleSpawnedImpl` (unexpected auto-spawn branch)
- `queueSequentialSpawns`

### Step 1 — Arm the slot
```
slot.expectingSpawn = true;
slot.expectingSpawnStartedAtSeconds = now;
slot.spawnRequestToken += 1;
slot.spawnRequestAtSeconds = Math.floor(now);
refreshVehicleSlotAuthoritativeState(slot);
```
Sets global active spawn tracker:
```
State.vehicles.activeSpawnSlotIndex = slotIndex;
State.vehicles.activeSpawnToken = slot.spawnRequestToken;
State.vehicles.activeSpawnRequestedAtSeconds = slot.spawnRequestAtSeconds;
```
**Why:** `expectingSpawn` tells the bind pipeline "this slot is waiting for a vehicle." The global active tracker is the PRIMARY bind path — when `OnVehicleSpawned` fires, the handler checks this to know WHICH slot should receive the vehicle.

### Step 2 — Re-configure spawner
```
configureVehicleSpawner(slot.spawner, slot.vehicleType);
await mod.Wait(0);
```
**Why:** Defensive re-apply. On initial boot, the spawner was configured in Step 6. On respawns, the type might have changed. The `Wait(0)` yields to let the engine process the config.

### Step 3 — 20-attempt retry loop
```
for (let attempt = 0; attempt < 20; attempt++) {
    // Refresh bind timestamp
    slot.spawnRequestAtSeconds = Math.floor(now);
    State.vehicles.activeSpawnRequestedAtSeconds = slot.spawnRequestAtSeconds;

    mod.ForceVehicleSpawnerSpawn(slot.spawner);

    if (!slot.expectingSpawn && slot.vehicleId !== -1) return true;
    await mod.Wait(0.25);
    if (!slot.expectingSpawn && slot.vehicleId !== -1) return true;
}
```
Each attempt:
1. Refreshes the bind timestamp (keeps the 2-second bind window alive)
2. Calls `ForceVehicleSpawnerSpawn` — tells engine to spawn a vehicle at this spawner
3. Checks if `OnVehicleSpawned` → `bindSpawnedVehicleToSlot` already set `vehicleId`
4. Waits 0.25 seconds, checks again

**Why this exists:** The retry loop was built to handle cases where `ForceVehicleSpawnerSpawn` silently fails (engine doesn't produce a vehicle). 20 attempts × 0.25s = 5 seconds max.

**Problem:** This is NOT how deploy-fulfillment does it. Deploy-fulfillment calls `ForceVehicleSpawnerSpawn` ONCE, waits 0.1s, then polls for binding success. Calling it 20 times on the same spawner may produce MULTIPLE vehicles or confuse the engine.

### Step 4 — Vehicle search fallback (v1.257)
```
if (slot.vehicleId === -1) {
    // Search AllVehicles() within 21m of spawner for untracked vehicle
    // If found: bind it, apply transform correction
}
```
**Why:** If the event-based bind pipeline missed the vehicle (timing, engine quirks), this manually finds and binds it.

### Step 5 — Cleanup on failure
```
slot.expectingSpawn = false;
refreshVehicleSlotAuthoritativeState(slot);
// Clear active tracking
return false;
```
**Why:** If all attempts failed, clear the armed state so the slot doesn't stay permanently locked.

---

## Phase 3: `OnVehicleSpawned` → Binding (vehicle-events.ts, spawner-bind.ts)

When the engine creates ANY vehicle in the world, `onVehicleSpawnedImpl` fires.

### Step 1 — Find which slot this vehicle belongs to
Two methods, tried in order:

**Active tracking (primary):**
```
if (State.vehicles.activeSpawnSlotIndex exists
    && token matches
    && (now - activeSpawnRequestedAtSeconds) <= 2.0) {
    slotIndex = activeSpawnSlotIndex;
}
```
**Why:** The slot that called `ForceVehicleSpawnerSpawn` registered itself globally. If the vehicle arrives within 2 seconds, we know exactly which slot it belongs to.

**Position fallback:**
```
slotIndex = findSpawnerSlotByPosition(vehiclePos);  // within 7m of any spawner
```
**Why:** If active tracking expired or wasn't set, check if the vehicle is physically near a spawner.

### Step 2 — Guard checks (if slot found)
- **Disabled slot:** Unspawn vehicle, return.
- **Unexpected auto-spawn** (`!slot.expectingSpawn && slot.vehicleId === -1`): Unspawn vehicle, reconfigure spawner, call `forceSpawnWithRetry` to replace it.
- **CQ_Bug_49** (aircraft slot + tank vehicle): Unspawn the default Abrams, return WITHOUT clearing `expectingSpawn` so the real aircraft can bind later.

### Step 3 — Primary binding
```
inferredTeam = bindSpawnedVehicleToSlot(eventVehicle, posObject);
```
(spawner-bind.ts) Tries two paths:

**Active tracking path:**
- If global tracker set, not expired, slot expecting, token matches:
  - Reject if wrong category (CQ_Bug_49)
  - `slot.expectingSpawn = false`
  - `bindVehicleToSpawnerSlot(slot, vehicleObjId)` → sets `slot.vehicleId`
  - Clears global tracker
  - Applies transform correction (teleport to correct position/rotation)
  - Returns team

**If expired (CQ_Bug_52):**
- Clears global tracker
- Clears `expectingSpawn` on the expired slot
- Falls through to distance path

**Distance fallback path:**
- For each slot with `expectingSpawn == true`:
  - Check if vehicle is within 7m of spawner
  - Same reject/bind logic as active path

### Step 4 — Retry after 0.2s
If binding failed, wait 0.2s and try again (vehicle position may have settled).

### Step 5 — Last-resort force bind
If binding still failed but a slot WAS found by position:
```
slot.expectingSpawn = false;
bindVehicleToSpawnerSlot(slot, vehicleObjId);
State.vehicles.vehicleToSlot[vehicleObjId] = slotIndex;
maybeApplySpawnTransformCorrectionToVehicle(eventVehicle, slot);  // (v1.256)
```
**Why:** Catches edge cases where active tracking expired AND distance fallback missed, but position search found the slot.

### Step 6 — Register to team
```
vehicleSpawnBaseTeamByObjId[vehicleObjId] = inferredTeam;
registerVehicleToTeam(eventVehicle, inferredTeam);
// Log spawn message
```

---

## Phase 4: Bind to Slot (`bindVehicleToSpawnerSlot`, timers.ts)

```
slot.vehicleId = vehicleObjId;        // THIS IS THE CRITICAL LINE
slot.expectingSpawnStartedAtSeconds = -1;
slot.respawnRunning = false;
slot.spawnRetryScheduled = false;
slot.lastSpawnedAtSeconds = now;
clearVehicleSlotRespawnTimer(slot);    // clears respawn countdown
refreshVehicleSlotAuthoritativeState(slot);  // sets availabilityPhase = "ACTIVE"
updateVehicleDeployTimerHudForAllPlayers();
```
**Why:** This is the "vehicle is home" moment. `vehicleId` being set is what the poll loop, the HUD, and `forceSpawnWithRetry`'s success check all look at.

---

## Phase 5: Transform Correction (`maybeApplySpawnTransformCorrectionToVehicle`)

```
// Skip if suppressed (deploy-fulfillment sets this for air spawns)
if (slot.suppressNextBindSpawnTransformCorrection) return;

// Double-teleport to slot's configured position/rotation
mod.Teleport(vehicle, slot.spawnPos, yawRad);
await mod.Wait(0);
mod.Teleport(vehicle, slot.spawnPos, yawRad);
```
**Why:** The engine may spawn the vehicle at a slightly different position/rotation than what we configured. The teleport forces it to the exact desired transform. Double-teleport because a single teleport can be ignored by the physics engine on the first frame.

---

## Comparison: Deploy-Fulfillment Aircraft Spawn (deploy-fulfillment.ts)

This path WORKS for helicopters in non-Vanilla modes. Key differences from `forceSpawnWithRetry`:

```
// 1. Create FRESH runtime spawner at birth-spawn position
runtimeSpawner = mod.SpawnObject(VehicleSpawner, birthSpawn.pos, birthSpawn.rot);
mod.SetVehicleSpawnerAutoSpawn(runtimeSpawner, false);
configureVehicleSpawner(runtimeSpawner, slot.vehicleType);

// 2. Single spawn attempt
await mod.Wait(0);
mod.ForceVehicleSpawnerSpawn(runtimeSpawner);

// 3. Wait for binding
await mod.Wait(0.1);   // settle
spawnedVehicle = await waitForSpawnedVehicleForSlot(slot);
// polls slot.vehicleId for up to 10 * 0.1s = 1 second

// 4. Fallback: manual search
if (!spawnedVehicle) {
    spawnedVehicle = tryFindVehicleNearDirectSpawnAirPoint(birthSpawn.pos);
    if (spawnedVehicle) bindVehicleToSpawnerSlot(slot, vehicleObjId);
}
```

**Key differences:**
1. Creates a FRESH spawner (not reusing the slot's long-lived spawner)
2. ONE `ForceVehicleSpawnerSpawn` call (not 20)
3. Polls for result instead of relying on immediate event + retry
4. Has explicit vehicle-search fallback

---

## The Helicopter Problem

In Vanilla Deploy mode, helicopter slots (`deployFlowTracked = false`) go through the bootstrap → `forceSpawnWithRetry` path for the FIRST TIME (previously they were always gated behind deploy buttons).

Jets and ground vehicles work through `forceSpawnWithRetry`. Helicopters do not. The binding either fails silently or the event pipeline misses them.

Deploy-fulfillment's aircraft spawn path works for helicopters. It uses a simpler pattern: one spawn, poll, search fallback.

The 20-attempt retry loop in `forceSpawnWithRetry` may be counterproductive for helicopters — calling `ForceVehicleSpawnerSpawn` repeatedly on the same spawner while a helicopter is mid-spawn could confuse the engine or produce orphan vehicles.
