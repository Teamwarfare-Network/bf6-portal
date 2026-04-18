# Vanilla-Only Vehicle Spawner Rewrite — Attempt D

**Created**: 2026-04-17
**Status**: Plan under review — no code changes yet
**Previous attempts**: A (pre-v1.223), B (v1.223–v1.252, preserved in `reference_implementations/reference_conquest_attempt_b/`), C (v1.254–v1.257, current `src/`)
**Companion plan file**: `C:\Users\Soldat\.claude\plans\sleepy-juggling-thunder.md`

---

## Why Attempt D

Attempt C (v1.254–v1.257) tried to surgically fix helicopter binding in Vanilla Deploy without removing the underlying architecture. Three fix iterations (v1.255, v1.256, v1.257) all failed. Root cause analysis (see `vehicle_spawner_lifecycle_audit.md`, `vehicle_spawner_bounty_hunter_reference.md`) shows the issue is not a single bug but the system's shape:

- Three bind paths (active-token, distance fallback, manual vehicle-search) race each other.
- `forceSpawnWithRetry` fires `ForceVehicleSpawnerSpawn` 20 times in 5 seconds on the same spawner object — faster than the engine can bind an aircraft, confusing engine state.
- `pollVehicleSpawnerSlots` runs every 5 seconds looking for "missing" vehicles and triggers respawns that collide with real events.
- Global `activeSpawnSlotIndex` singleton races under MP.
- `deploy-fulfillment.ts` has three independent runtime-spawner code paths (pad, fresh-air aircraft, forward-deploy tank) all with different timing.

The BountyHunter reference implementation achieves reliable aircraft spawning with ~17 lines of code. Isolated test buttons in Conquest (v1.246) confirmed the BountyHunter pattern works for F-16, UH-60, AH-6M, DirtBike in Conquest's own environment.

Attempt D replaces the entire Vanilla vehicle spawner pipeline. Non-Vanilla deploy methods (HQ/Air/Forward) are removed from `src/` for this attempt — they return on a clean foundation after Vanilla stabilizes. Existing non-Vanilla code is preserved in `reference_implementations/reference_conquest_attempt_b/`.

---

## Design Principles

**P1. Serial dispatch via Promise-chained mutex.** A module-level `spawnMutex: Promise<void> = Promise.resolve()` chains every spawn. New dispatch = `spawnMutex = spawnMutex.then(() => doDispatch(slot, index))`. No simultaneous `ForceVehicleSpawnerSpawn` calls on different slots; no polling for "am I the current spawner."

**P2. Events are authoritative.** `OnVehicleSpawned` is the only bind writer. `OnVehicleDestroyed` is the only respawn trigger. Nothing polls `AllVehicles()` to reconcile state.

**P3. Clocks for time, not `mod.Wait` for respawn.** Respawn timing uses `Clocks.CountDownClock` from `bf6-portal-utils`. `onSecond` drives the HUD; `onComplete` kicks the respawn dispatch. `mod.Wait(120)` is unsuitable because (a) it drifts over 120 ticks, (b) it cannot be paused/reset when slots are disabled or types change, (c) it has no natural HUD integration.

**P4. Configure once at bootstrap; update on change.** Spawners configured once after the 2-second init delay. Ready Dialog Apply re-pushes the vehicle type to any slot that changed. No per-spawn reconfiguration.

**P5. Single post-spawn Teleport for rotation.** `SpawnObject`'s rotation argument is ignored by the engine for VehicleSpawner (confirmed from iteration history). Vehicle rotation is enforced by `mod.Teleport(v, slot.spawnPos, slot.spawnYawRad)` once after bind. No yaw offset. No double-teleport.

**P6. No fallbacks, no watchdogs, no retries.** One `ForceVehicleSpawnerSpawn`, 3-second event wait, bound or not. Timeout is a logged diagnostic, not a runtime recovery trigger. Next destroy event or Ready Dialog refresh tries again.

---

## Scope

### DELETE
- `src/vehicles/deploy-fulfillment.ts` — all non-Vanilla spawn paths
- `src/vehicles/reservations.ts` — direct-spawn claims
- `src/vehicles/spawner-sequence.ts` — 20-retry loop, 5s poll, blocked-retry scheduler
- `src/vehicles/spawner-bind.ts` — three-path binding
- `src/vehicles/spawner-slots.ts` — old slot constructor
- `src/vehicles/spawner-bootstrap.ts` — old bootstrap

All call sites in `index/`, `hud/`, `interaction/`, `admin-panel/` that reference deleted symbols are rewired to the new module or removed.

### KEEP (with trim)
- `src/vehicles/vehicle-classification.ts` — no change
- `src/vehicles/registration.ts` — no change
- `src/vehicles/vehicle-events.ts` — rewrite `onVehicleSpawnedImpl` / `onVehicleDestroyedImpl`; keep Enter/Exit handlers
- `src/vehicles/timers.ts` — replace `runVehicleSlotCooldownHudLoop` with Clocks-based tick, delete `availabilityPhase`/`deployFlowTracked`
- Map-config specs (`src/map/operation-firestorm.ts` and spec tables) — no change

### CREATE
- `src/vehicles/vanilla-spawner.ts` — bootstrap, dispatch, mutex, Clocks-based respawn (~200 lines)
- `src/vehicles/vanilla-spawner-types.ts` — trimmed `VehicleSpawnerSlot` type (~30 lines)

---

## Simplified Slot Shape

```ts
type VehicleSpawnerSlot = {
    teamId: TeamID;
    slotNumber: number;

    spawner: mod.VehicleSpawner;
    spawnerObjId: number;

    spawnPos: mod.Vector;            // from map config
    spawnYawRad: number;             // from map config, applied via Teleport after bind

    vehicleType: mod.VehicleList;    // mutable — Ready Dialog can change this

    enabled: boolean;
    vehicleId: number;               // -1 if unbound

    respawnClock?: Clocks.CountDownClock;
};
```

Module state (private to `vanilla-spawner.ts`):
```ts
let spawnMutex: Promise<void> = Promise.resolve();
let currentlyExpectingSlotIndex: number = -1;
let currentSpawnResolve: ((vehicleObjId: number) => void) | undefined;
```

Fields eliminated from old shape: `enableToken`, `spawnRequestToken`, `spawnRequestAtSeconds`, `expectingSpawn`, `expectingSpawnStartedAtSeconds`, `lastSpawnedAtSeconds`, `lastDestroyedAtSeconds`, `lastMissingAtSeconds`, `respawnRunning`, `spawnRetryScheduled`, `spawnCategory`, `deployFlowTracked`, `availabilityPhase`, `pendingSpawnOwnerPid`, `pendingSpawnMode`, `activeOwnerPid`, `suppressNextBindSpawnTransformCorrection`, `freshAirRuntimeSpawner`.

---

## Lifecycle

### Bootstrap (`startVanillaVehicleSpawnerSystem`) — once per match

**Step 1.** Await config ready: `while (!State.vehicles.configReady) await mod.Wait(0.1)`.

**Step 2.** Post-config settle: `await mod.Wait(2.0)` — engine may still be dispatching initial events.

**Step 3.** Create all VehicleSpawner objects, position-only:
```ts
const spawner = mod.SpawnObject(mod.RuntimeSpawn_Common.VehicleSpawner, spec.pos, mod.CreateVector(0, 0, 0));
```
Spawners do not honor rotation — `CreateVector(0,0,0)` is explicit about what the engine uses. Vehicle rotation is enforced post-bind via Teleport.

**Step 4.** Engine-initialization wait: `await mod.Wait(2.0)` — BountyHunter-validated; not negotiable.

**Step 5.** Configure every spawner, one at a time with 0.1s gap between:
```ts
for (const slot of State.vehicles.slots) {
    mod.SetVehicleSpawnerVehicleType(slot.spawner, slot.vehicleType);
    mod.SetVehicleSpawnerAutoSpawn(slot.spawner, false);
    mod.SetVehicleSpawnerRespawnTime(slot.spawner, 0);
    mod.SetVehicleSpawnerApplyDamageToAbandonVehicle(slot.spawner, true);
    mod.SetVehicleSpawnerAbandonVehiclesOutOfCombatArea(slot.spawner, true);
    mod.SetVehicleSpawnerTimeUntilAbandon(slot.spawner, 30);
    mod.SetVehicleSpawnerKeepAliveAbandonRadius(slot.spawner, 100);
    mod.SetVehicleSpawnerKeepAliveSpawnerRadius(slot.spawner, 50);
    await mod.Wait(0.1);
}
```
0.1s-per-slot serialization lets the engine digest one spawner's config before the next. 6 slots × 0.1s = 0.6s added to bootstrap; imperceptible.
`ApplyDamageToAbandonVehicle=true` routes abandonment through `OnVehicleDestroyed` → normal respawn path.

**Step 6.** Pre-live global cleanup — unspawn every `mod.AllVehicles()` entry (pre-live, no legitimate vehicles exist). This targets the default Abrams from the `RuntimeSpawn_Common.VehicleSpawner` prefab's built-in AutoSpawn behavior during the Step 3→Step 5 2-second window. Global scope avoids the overlapping-radius concern of the current 50m approach. Guarded by `!isMatchLive() && !State.vehicles.startupCleanupDone`.

**Step 7.** Post-cleanup settle: `await mod.Wait(2.0)` — lets `OnVehicleDestroyed` events from the cleanup drain before our own spawns trigger `OnVehicleSpawned` events.

**Step 8.** Apply matchup enablement from config:
```ts
const desired = getDesiredSpawnerCountsForPreset(State.round.matchupPresetIndex);
const team1Slots = State.vehicles.slots.filter(s => s.teamId === TeamID.Team1);
const team2Slots = State.vehicles.slots.filter(s => s.teamId === TeamID.Team2);
for (let i = 0; i < team1Slots.length; i++) team1Slots[i].enabled = i < desired.team1;
for (let i = 0; i < team2Slots.length; i++) team2Slots[i].enabled = i < desired.team2;
```
Matches slots to the matchup preset (1v1/2v2/3v3/4v4) knob values from Ready Dialog.

**Step 9.** HUD reveal — existing `revealVehicleSpawnerUiAfterStartup()`.

**Step 10.** Initial spawn burst via mutex:
```ts
for (let i = 0; i < State.vehicles.slots.length; i++) {
    const slot = State.vehicles.slots[i];
    if (!slot.enabled) continue;
    spawnMutex = spawnMutex.then(() => doDispatch(slot, i));
}
await spawnMutex;
```

**Step 11.** Done. No poll loop.

### Spawn dispatch

```ts
async function doDispatch(slot: VehicleSpawnerSlot, slotIndex: number): Promise<void> {
    if (!slot.enabled) return;
    if (slot.vehicleId !== -1) return;

    const vehicleObjId = await forceSpawnAndAwaitBind(slot, slotIndex);

    if (vehicleObjId === -1) {
        // Option B: one retry after a 1s settle. Fall back to option A (log + move on).
        await mod.Wait(1.0);
        const retryId = await forceSpawnAndAwaitBind(slot, slotIndex);
        if (retryId === -1) {
            logger(`[spawn-timeout-final] slot ${slotIndex} type=${slot.vehicleType}`);
            return;
        }
        const retryVehicle = findVehicleById(retryId);
        if (retryVehicle) mod.Teleport(retryVehicle, slot.spawnPos, slot.spawnYawRad);
        return;
    }

    const vehicle = findVehicleById(vehicleObjId);
    if (vehicle) mod.Teleport(vehicle, slot.spawnPos, slot.spawnYawRad);
}

// Always clears expecting-index on exit so a delayed event from a timed-out
// call cannot bind to a later slot's dispatch.
async function forceSpawnAndAwaitBind(slot: VehicleSpawnerSlot, slotIndex: number): Promise<number> {
    currentlyExpectingSlotIndex = slotIndex;
    const bindPromise = new Promise<number>((resolve) => { currentSpawnResolve = resolve; });
    mod.ForceVehicleSpawnerSpawn(slot.spawner);
    const result = await Promise.race([
        bindPromise,
        new Promise<number>((res) => setTimeout(() => res(-1), 3000)),
    ]);
    currentlyExpectingSlotIndex = -1;
    currentSpawnResolve = undefined;
    return result;
}
```

**Timeout handling (option B → A):** The 3s timeout is a liveness guarantee for `spawnMutex`, not a correctness validator. Past v1.223–v1.257 helicopter failures were driven by the 20-retry cascade, parallel bind paths, and default-Abrams mis-binds — all structurally removed here. The late-event tail risk (timeout fires, then a delayed event arrives while a different slot is expecting) is defused by clearing `currentlyExpectingSlotIndex` between attempts so `onVehicleSpawnedImpl` drops any stale event.

### OnVehicleSpawned

```ts
function onVehicleSpawnedImpl(eventVehicle: mod.Vehicle): void {
    if (currentlyExpectingSlotIndex === -1) return;
    const slot = State.vehicles.slots[currentlyExpectingSlotIndex];
    if (!slot) return;
    const vehicleObjId = getObjId(eventVehicle);
    slot.vehicleId = vehicleObjId;
    State.vehicles.vehicleToSlot[vehicleObjId] = currentlyExpectingSlotIndex;
    if (slot.respawnClock) { slot.respawnClock.reset(); slot.respawnClock = undefined; }
    registerVehicleToTeam(eventVehicle, slot.teamId);
    updateVehicleDeployTimerHudForAllPlayers();
    currentSpawnResolve?.(vehicleObjId);
}
```

### OnVehicleDestroyed

```ts
function onVehicleDestroyedImpl(eventVehicle: mod.Vehicle): void {
    const vehicleObjId = getObjId(eventVehicle);
    const slotIndex = State.vehicles.vehicleToSlot[vehicleObjId];
    if (slotIndex === undefined) return;
    const slot = State.vehicles.slots[slotIndex];
    delete State.vehicles.vehicleToSlot[vehicleObjId];
    slot.vehicleId = -1;
    if (!slot.enabled) return;
    startRespawnCountdown(slot, slotIndex);
}
```

### Respawn countdown via Clocks

```ts
const VEHICLE_RESPAWN_SECONDS = 120;

function startRespawnCountdown(slot: VehicleSpawnerSlot, slotIndex: number): void {
    if (slot.respawnClock) slot.respawnClock.reset();

    slot.respawnClock = new Clocks.CountDownClock(VEHICLE_RESPAWN_SECONDS, {
        onSecond: (secondsRemaining) => {
            updateVehicleDeployTimerHudForSlot(slot, secondsRemaining);
        },
        onComplete: () => {
            slot.respawnClock = undefined;
            if (!slot.enabled) return;
            if (slot.vehicleId !== -1) return;
            spawnMutex = spawnMutex.then(() => doDispatch(slot, slotIndex));
        },
    });
    slot.respawnClock.start();
}
```

Advantages over `mod.Wait(120)`:
1. Drift-resistant (aligns to whole-second boundaries).
2. HUD tick is `onSecond` — deletes `runVehicleSlotCooldownHudLoop` in timers.ts.
3. Abortable: `slot.respawnClock.reset()` works at any time; no stale timer problem.
4. Inspectable: `slot.respawnClock.seconds` for debug/HUD reads.
5. Simultaneous destroys serialize via `spawnMutex` — no polling between clocks.

### Enable / disable slot

```ts
function setSpawnerSlotEnabled(slotIndex: number, enabled: boolean): void {
    const slot = State.vehicles.slots[slotIndex];
    if (slot.enabled === enabled) return;
    slot.enabled = enabled;

    if (!enabled) {
        if (slot.respawnClock) { slot.respawnClock.reset(); slot.respawnClock = undefined; }
        if (slot.vehicleId !== -1) {
            const v = findVehicleById(slot.vehicleId);
            delete State.vehicles.vehicleToSlot[slot.vehicleId];
            slot.vehicleId = -1;
            if (v) { try { mod.UnspawnObject(v); } catch {} }
        }
    } else {
        if (slot.vehicleId === -1) {
            spawnMutex = spawnMutex.then(() => doDispatch(slot, slotIndex));
        }
    }
    updateVehicleDeployTimerHudForAllPlayers();
}
```

### Ready Dialog Apply

Vanilla mode does NOT mean "no Ready Dialog." Players still tune vehicle types per slot via Ready Dialog knobs, and hit Apply:

```ts
function applyReadyDialogConfig(): void {
    // 1. Re-apply matchup enablement
    const desired = getDesiredSpawnerCountsForPreset(State.round.matchupPresetIndex);
    // ... setSpawnerSlotEnabled per slot based on new counts ...

    // 2. Re-apply vehicle type per slot from fresh spec
    const freshSpecs = resolveVehicleSpawnSpecsFromReadyDialog();
    for (const spec of freshSpecs) {
        const slot = findSlotByTeamAndNumber(spec.teamId, spec.slotNumber);
        if (!slot || slot.vehicleType === spec.vehicle) continue;
        slot.vehicleType = spec.vehicle;
        mod.SetVehicleSpawnerVehicleType(slot.spawner, spec.vehicle);

        if (!isMatchLive()) {
            // Pre-live: destroy & respawn with new type now
            if (slot.vehicleId !== -1) {
                const v = findVehicleById(slot.vehicleId);
                delete State.vehicles.vehicleToSlot[slot.vehicleId];
                slot.vehicleId = -1;
                if (v) { try { mod.UnspawnObject(v); } catch {} }
            }
            if (slot.respawnClock) { slot.respawnClock.reset(); slot.respawnClock = undefined; }
            if (slot.enabled) {
                spawnMutex = spawnMutex.then(() => doDispatch(slot, State.vehicles.slots.indexOf(slot)));
            }
        }
        // Live: leave existing vehicle alone; next respawn uses new type
    }
    updateVehicleDeployTimerHudForAllPlayers();
}
```

---

## What's Gone vs. Attempt C

| Complexity | Attempt C | Attempt D |
|---|---|---|
| Bind paths | 3 (active-token, distance fallback, search) | 1 (event handler reads `currentlyExpectingSlotIndex`) |
| Retry loop | 20 attempts × 0.25s per slot | None |
| Poll loop | Every 5s, checks all slots | None |
| Global race tracker | `activeSpawnSlotIndex` | `currentlyExpectingSlotIndex` (serial by construction) |
| Workaround guards | CQ_Bug_49 Abrams reject, CQ_Bug_52 stuck-flag reaper | None |
| Runtime-spawner code paths | 3 (pad, fresh-air aircraft, forward-deploy tank) | 1 (pad only) |
| Respawn timing | `mod.Wait(VEHICLE_SPAWNER_RESPAWN_DELAY_SECONDS)` + watchdog flags | `Clocks.CountDownClock` — drift-resistant, abortable |
| HUD countdown | Separate `runVehicleSlotCooldownHudLoop` | `onSecond` on the same CountDownClock |
| Transform correction | Double-teleport via `maybeApplySpawnTransformCorrectionToVehicle` | Single Teleport in `doDispatch` |
| Reservation system | `pendingSpawnOwnerPid`, `pendingSpawnMode`, `validateVehicleSlotReservationState` | None (Vanilla has no deploy buttons) |

Expected line count reduction: ~1,500 lines from `src/vehicles/` + direct callers.

---

## Execution Details (added during implementation kickoff)

These are tactical details surfaced while reading the actual source, not in the original plan body. They do not change the strategy — only the order and scope of edits.

### File-path correction
The plan body lists `src/vehicles/vehicle-events.ts`; the file actually lives at [src/index/vehicle-events.ts](bf6-portal/dev/conquest/src/index/vehicle-events.ts). Rewrite happens in place there.

### State shape change (touches runtime-types.ts + runtime-state.ts)
The current [VehicleSpawnerSlot](bf6-portal/dev/conquest/src/state/runtime-types.ts#L6-L39) type has ~25 fields (enableToken, spawnRequestToken, expectingSpawn, availabilityPhase, deployFlowTracked, spawnCategory, pendingSpawnOwnerPid, freshAirRuntimeSpawner, etc.). The new shape is 9 fields: `{ teamId, slotNumber, spawner, spawnerObjId, spawnPos, spawnYawRad, vehicleType, enabled, vehicleId, respawnClock? }`.

Collateral updates:
- [src/state/runtime-types.ts](bf6-portal/dev/conquest/src/state/runtime-types.ts) — trim `VehicleSpawnerSlot` and delete `VehicleSlotSpawnCategory`, `VehicleDirectSpawnMode`, `VehicleSlotAvailabilityPhase` types (no longer referenced).
- [src/state/runtime-state.ts](bf6-portal/dev/conquest/src/state/runtime-state.ts) — drop the race-tracker fields from `State.vehicles` initializer: `spawnSequenceToken`, `spawnSequenceInProgress`, `activeSpawnSlotIndex`, `activeSpawnToken`, `activeSpawnRequestedAtSeconds`, `desiredEnabledSlotsTeam1`, `desiredEnabledSlotsTeam2`. Keep `slots`, `vehicleToSlot`, `configReady`, `startupCleanupDone`.
- HUD readers of removed fields (`deploy-timer-ui.ts`, etc.) switch to `slot.respawnClock?.seconds` for the countdown display.

### Preserved external API surfaces
The new [src/vehicles/vanilla-spawner.ts](bf6-portal/dev/conquest/src/vehicles/vanilla-spawner.ts) re-exports these names so external callers don't move:
- `startVehicleSpawnerSystem()` — called by [src/index/game-mode.ts:70](bf6-portal/dev/conquest/src/index/game-mode.ts#L70).
- `applySpawnerEnablementForMatchup(presetIndex, spawnOnEnable)` — called by [src/conquest-flow.ts:157](bf6-portal/dev/conquest/src/conquest-flow.ts#L157), [src/ready-dialog/matchup-summary.ts:93](bf6-portal/dev/conquest/src/ready-dialog/matchup-summary.ts#L93), [src/ready-dialog/mode-config-presets.ts:233](bf6-portal/dev/conquest/src/ready-dialog/mode-config-presets.ts#L233).
- `updateVehicleDeployTimerHudForAllPlayers()` / `updateVehicleDeployTimerHudForPlayer(player)` — 16+ callers across codebase (unchanged signatures; moved from timers.ts).
- `getDesiredSpawnerCountsForPreset(presetIndex)` — keep as a helper exported from the new module.
- `registerVehicleToTeam(vehicle, teamNum)` — stays in [src/vehicles/registration.ts](bf6-portal/dev/conquest/src/vehicles/registration.ts) unchanged.
- `isAircraftVehicleType`, `isJetVehicleType`, `isTankVehicleType`, `isAircraftVehicleInstance`, `isTankVehicleInstance` — stay in [src/vehicles/vehicle-classification.ts](bf6-portal/dev/conquest/src/vehicles/vehicle-classification.ts) unchanged.

Deleted symbols that had no-external-callers (safe to remove outright): `forceSpawnWithRetry`, `scheduleBlockedSpawnRetry`, `runSequentialSpawns`, `bindSpawnedVehicleToSlot`, `addVehicleSpawnerSlot`, `validateVehicleSlotReservationState`, `refreshVehicleSlotAuthoritativeState`, `initializeVehicleSlotTimerState`, `clearVehicleSlotRespawnTimer`, `scheduleVehicleSlotRespawnTimer`, `runVehicleSlotCooldownHudLoop`, `markVehicleSlotDestroyed`, `markVehicleSlotMissing`, `getVehicleSlotRespawnRemainingSeconds` (HUD now reads `slot.respawnClock?.seconds` directly), `resolveVehicleSlotSpawnCategory`, `shouldTrackVehicleSlotForDeployFlow`, `isVehicleSlotReadyForReservationDeploy`.

### Execution ordering (single commit, staged edits)
1. Update State shape (`runtime-types.ts` + `runtime-state.ts`) — shape comes first so new code compiles against it.
2. Create [src/vehicles/vanilla-spawner-types.ts](bf6-portal/dev/conquest/src/vehicles/vanilla-spawner-types.ts) and [src/vehicles/vanilla-spawner.ts](bf6-portal/dev/conquest/src/vehicles/vanilla-spawner.ts) with the preserved export names listed above.
3. Rewrite [src/index/vehicle-events.ts](bf6-portal/dev/conquest/src/index/vehicle-events.ts) handlers to the tiny event-driven form.
4. Rewire the 4 external callers (conquest-flow, matchup-summary, mode-config-presets, game-mode) to import from the new module.
5. Freeze Ready Dialog Vehicle Deploy Method knob to Vanilla-only.
6. Delete the 6 old files + trim `timers.ts` down to nothing (or delete it outright once `vanilla-spawner.ts` re-exports the HUD helpers). Also delete `reservations.ts`.
7. Build → `tsc --noEmit` → verify bundle size under cap.
8. Only after compile-clean: `npm run bumpVersion -- -c "..."` to v1.258.
9. Update [Codebase Reference Map](bf6-portal/dev/conquest/design_doc/TWL_Conquest_Design.md) + Project Stats per AGENTS.md policy.

Rollback: `git revert` of the single v1.258 commit.

---

## Verification Plan

### Build & compile gates (blocking)
1. **Build succeeds**: `npm run build` completes with no errors.
2. **TypeScript clean**: `cmd /c npx tsc --pretty false --noEmit` emits no errors.
3. **Bundle under cap**: `dist/bundle.ts` size < 1,048,576 bytes. Report exact bytes, direction vs v1.257 (expected: **down** meaningfully — ~1,500 lines removed).
4. **No orphaned imports**: grep dist/bundle.ts for deleted symbol names (`forceSpawnWithRetry`, `runSequentialSpawns`, `pollVehicleSpawnerSlots`, `activeSpawnSlotIndex`, `availabilityPhase`, `deployFlowTracked`, `spawnSequenceToken`) — should return zero hits.
5. **No dead type refs**: grep src/ for `VehicleSlotSpawnCategory`, `VehicleDirectSpawnMode`, `VehicleSlotAvailabilityPhase` — should return zero hits.

### Runtime — cold start (pre-live)
6. **Bootstrap completes once**: single `startVehicleSpawnerSystem()` run; logs show exactly one run of Steps 1→11 with the expected waits (0.1s config, 2s post-config, 2s engine-init, 0.1s×N config-serial, 2s post-cleanup).
7. **Vehicle count matches matchup**: at 4v4 preset, 4 vehicles per team visible on pads. At 2v2, only 2 per team. At 1v1, only 1.
8. **All helicopters bind (primary fix)**: UH-60 and AH-6M spawn at their correct pads with correct yaw rotation within ~3s of bootstrap step 10. HUD shows them present, not "respawning."
9. **Jets bind (regression)**: F-16 spawns at correct pad, correct yaw.
10. **Ground vehicles bind (regression)**: Abrams, Leopard, Cheetah, Gepard all spawn at correct pads with correct yaw.
11. **No default Abrams artifacts**: after bootstrap complete, no extra Abrams at non-Abrams pads; cleanup sweep removed any prefab-default Abrams.
12. **HUD reveal timing**: `revealVehicleSpawnerUiAfterStartup()` fires after initial bind burst; HUD shows live vehicle icons (not respawn timers) for successfully-bound slots.

### Runtime — destroy/respawn cycle (core loop)
13. **Destroy triggers countdown**: destroy a helicopter (C4/rocket/abandonment); within 1s, HUD countdown appears showing "120".
14. **Countdown ticks**: HUD decrements 120 → 119 → 118… each whole second. No drift beyond ±1s over 120s (CountDownClock's drift-resistance).
15. **Respawn fires at zero**: at countdown 0, new vehicle appears at pad within 3s. Correct type, correct yaw rotation.
16. **Same slot rebinds**: destroyed slot's `vehicleId` goes -1 during countdown, then updates to new vehicle's objId after respawn.

### Runtime — abandonment
17. **OOB abandonment path**: drive Abrams out of combat area; wait >30s (`TimeUntilAbandon`); engine applies damage; vehicle dies; `OnVehicleDestroyed` fires; countdown starts from 120s; respawn at pad.
18. **KeepAlive radius respected**: stand within 100m of abandoned vehicle — no abandonment kicks in. Walk >100m — 30s countdown begins.

### Runtime — Ready Dialog (pre-live)
19. **Matchup decrease (4v4 → 2v2)**: change preset in Ready Dialog; Apply; slots 3-4 on each team are destroyed and disabled; slots 1-2 unchanged.
20. **Matchup increase (2v2 → 4v4)**: reverse; slots 3-4 are enabled and spawn new vehicles via mutex chain.
21. **Type change**: change Slot 1 Team 1 from UH-60 → AH-6M; Apply; existing UH-60 at that pad is destroyed (`UnspawnObject`); AH-6M spawns at same pad with correct yaw.
22. **No double-spawn on Apply**: rapid-fire two Apply presses in under 1s — verify slot count doesn't double; mutex serializes.

### Runtime — Ready Dialog (live)
23. **Vehicle-type knob locked live**: after round goes live, the Vehicle section of Ready Dialog is read-only (no interaction possible with vehicle-type or matchup knobs for vehicle slots).
24. **No live-type-change handler**: confirm `applyReadyDialogConfig()` is not reachable post-`isMatchLive() === true`.

### Runtime — mutex & timeout
25. **Serial dispatch under load**: destroy 2 vehicles simultaneously (e.g. two choppers via single C4 blast or scripted test); both countdowns start; at t=120s both fire `onComplete` in the same frame; both dispatches chain onto `spawnMutex` and execute sequentially (not in parallel); both slots rebind correctly.
26. **Timeout retry works**: (dev-only test) temporarily make first `ForceVehicleSpawnerSpawn` a no-op for one slot; confirm after 3s+1s+retry, the slot binds on the second attempt. Confirm `spawnMutex` continues to next slot (not deadlocked).
27. **Timeout final failure logs**: (dev-only) make both Force calls no-op; confirm `[spawn-timeout-final]` log emits; confirm the slot stays empty; confirm other slots still dispatch normally; confirm next destroy cycle on another slot is unaffected.
28. **Late-event drop**: (dev-only) simulate engine producing a late vehicle 4s after the first Force call; confirm it is ignored (no misbind) because `currentlyExpectingSlotIndex === -1` by then.

### Runtime — no poll side-effects
29. **10-minute playtest**: play a full round with destruction/respawn activity; confirm no unexpected vehicle appearances, no orphan vehicles at non-pad locations, no stuck HUD countdowns (value frozen while vehicle alive), no ghost `vehicleToSlot` entries.
30. **No 5s poll log**: grep runtime log for `pollVehicleSpawnerSlots` or equivalent — should never fire.

### UI regression
31. **No deploy button for Vanilla**: vehicle HUD for each slot shows only status (alive/respawning) and time, not a "deploy" interact prompt.
32. **Deploy Method knob frozen**: in Ready Dialog, Vehicle Deploy Method shows "Vanilla" as the only option; cannot be changed.
33. **HUD countdown matches clock**: `slot.respawnClock.seconds` equals the HUD-displayed number at all times during countdown (sample at 100s, 60s, 30s, 5s).

### Post-handoff reporting (required by AGENTS.md)
34. **Bundle size line**: report current bytes, remaining headroom under 1,048,576, direction vs v1.257.
35. **Changelog entry**: `src/Changelog.ts` contains a v1.258 entry with summary of removals and new architecture.
36. **Reference map updated**: `design_doc/TWL_Conquest_Design.md` Codebase Reference Map reflects the deleted files and the new `vanilla-spawner.ts` / `vanilla-spawner-types.ts`.

---

## Resolved Questions (user-confirmed 2026-04-17)

1. **Live Ready Dialog type change** — Vehicle-type tuning is **locked** once the match goes live. `applyReadyDialogConfig()` only fires from the pre-live path; no live-apply branch.
2. **Pre-live cleanup scope** — Global cleanup is acceptable on Operation Firestorm; revisit if future maps add decorative `mod.Vehicle` instances.
3. **Spawn timeout behavior** — **One retry after 1s, then log and move on** (option B → A). Timeout is a liveness guarantee on `spawnMutex`; not a correctness validator and not a driver of past failures. Expecting-index cleared between attempts so delayed events can't misbind.
4. **Clocks dependency — inline, don't npm-install.** The `Clocks.CountDownClock` utility this rewrite depends on is inlined into `src/foundation/bf6-utils/` rather than installed as an npm dependency. Reason: Conquest uses a flat bundle-concatenation model (not module bundling), so `namespace` declarations without `export` merge into the bundle's global scope alongside every other `src/**/*.ts` file. The inlined files are near-verbatim ports of `reference_implementations/reference_bf6PortalUtils/{logging,callback-handler,timers,clocks}/index.ts`, with: (a) `export` removed from the namespace lines, (b) cross-module `import` statements removed (the bundle resolves references globally), (c) `@ts-nocheck` added to match the rest of the project, (d) attribution headers at the top of each file pointing at Michael De Luca's MIT-licensed `bf6-portal-utils` repo. A consolidated attribution entry also lives in `src/header-file.ts` under the Authors / Attribution section. Migration path: when Conquest adopts the package proper (`npm i -D bf6-portal-utils`), delete `src/foundation/bf6-utils/` and replace with imports from the package.

---

## Rollout

Single commit, `npm run bumpVersion -- -c "Vanilla vehicle spawner rewrite: serial dispatch via Promise mutex, event-driven bind, Clocks-based respawn. Deletes deploy-fulfillment, reservations, 20-retry loop, 5s poll. Non-Vanilla paths removed (see reference_conquest_attempt_b for history)."`

No feature flag. Rollback = `git revert`.
