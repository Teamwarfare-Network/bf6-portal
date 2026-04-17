# Plan: Abrams-Substitution Bug on Air & Forward Deploy (MP-focused)

**Created**: 2026-04-13 (session at v1.222)
**Status**: Planning — awaiting answers to open questions before implementation
**Tracking**: Each phase should update its status line as shipped/tested (SP) / validated (MP).

| Phase | Target Version | Status (SP) | Status (MP) |
|---|---|---|---|
| 1 — Per-slot spawn tracking | v1.223 | shipped 2026-04-13, regressed SP Air/Forward | superseded by v1.224 hotfix |
| 1a — Hotfix: single-expecting fallback + extended Abrams intercept | v1.224 | shipped 2026-04-13 (SP playtest pending) | pending |
| 2 — Wrong-vehicle slot recovery safety net | v1.225 | pending | pending |
| 3 — Tank-reject on forward fallback + UnspawnObject failure blacklist | v1.226 | pending | pending |
| 4 — Preemptive Abrams wipe around runtime spawner | v1.227 | pending | pending |
| 5 — Remove silent Air→Forward rewrite + UI class audit | v1.228 | pending | pending |
| 6 — Forward-deploy pad despawn ordering fix | v1.229 | pending | pending |
| 7 — Vehicle-occupancy cache safety + spawner-leak audit | v1.230 | pending | pending |
| 8 — Console deploy-screen input audit (investigate only) | v1.231 | deferred | deferred |

---

## Phase 1a Hotfix (v1.224) — Post-mortem

**Reported after v1.223 playtest**: "Forward Deploy and Air Deploy are not working at all. HQ deploys seem to work fine. Sometimes I'm seeing the aircraft spawn in the distance, and sometimes I'm not sure anything spawned."

**Two distinct regressions introduced by Phase 1**:

1. **Aircraft bind radius too tight**. Phase 1 anchored the bind lookup to `slot.lastRequestedSpawnPos` and required the inbound vehicle to be within `VEHICLE_SPAWNER_BIND_DISTANCE_METERS` (7m). Jets and helis spawn with initial velocity, so by the time `OnVehicleSpawned` fires the aircraft has been displaced beyond 7m. The scan returned -1, the aircraft was orphaned, `slot.vehicleId` stayed -1, `waitForSpawnedVehicleForSlot` timed out, and fulfillment failed with no seat. The prior `activeSpawn*` singleton had no distance constraint, so this regression was Phase-1-introduced.

2. **Non-tank ground slots now deterministically catch the AutoSpawn Abrams**. The `RuntimeSpawn_Common.VehicleSpawner` prefab's AutoSpawn fires synchronously before `SetVehicleSpawnerAutoSpawn(false)` can land, spawning an Abrams at the requested position. With Phase 1's per-slot position tracking, that Abrams now matches `slot.lastRequestedSpawnPos` exactly (distance ≈ 0). The `CQ_Bug_49` intercept at `vehicle-events.ts:121` only fired for aircraft-class slots; non-tank ground slots (Quadbike, Marauder) fell through to `bindSpawnedVehicleToSlot`, where `rejectWrongCategoryBindForAircraftSlot` also only rejected for aircraft slots. Result: 100% Abrams-substitution on non-tank forward deploys.

**Fix shipped in v1.224**:
- `spawner-bind.ts::findExpectingSpawnerSlotForVehiclePos`: add single-expecting fallback. If the position scan finds no slot within 7m but exactly one slot is expecting, return it. MP safety preserved because two concurrent expecting slots still require position disambiguation in the primary pass.
- `spawner-bind.ts`: rename `rejectWrongCategoryBindForAircraftSlot` → `rejectWrongCategoryBindForSlot` and generalize to `isTankVehicleInstance(eventVehicle) && !isTankVehicleType(slot.vehicleType)`.
- `vehicle-events.ts::onVehicleSpawnedImpl`: generalize the CQ_Bug_49 intercept from `isAircraftSpawnVolumeVehicleType(slot.vehicleType)` to `!isTankVehicleType(slot.vehicleType)` — now covers aircraft AND non-tank ground slots.

**Lesson captured**: any per-slot position anchor must account for engine-side post-spawn physics. For aircraft, this means either (a) a much larger bind radius or (b) a fallback when the scan is unambiguous. v1.224 uses (b) because it preserves the tighter MP-safety envelope when contention exists.

---

## Context

**Reported symptoms** (v1.222):
- HQ Deploy: always correct vehicle. Safe.
- **Air Deploy and Forward Deploy: intermittently spawn an Abrams in place of the intended vehicle. Happens on every vehicle the user has tested** (Jets, Helis, Transports, quads) — not isolated to specific slots. Specific slots mentioned earlier (Jet 1/2, Transport 1/4 quad) are examples, not the scope.
- **Catastrophic slot-lock**: when an Abrams spawns instead of the intended vehicle, the affected slot becomes permanently locked for the rest of the match — `slot.vehicleId` points at the wrong vehicle, `slot.activeOwnerPid` never clears, and the deploy timer sits dead. Phase 2 addresses this worst-case recovery explicitly.
- **Strong MP-specific signal**: the user could not reproduce the bug in a solo session despite hammering Air/Forward Deploy. Likely (not guaranteed) caused by multi-player contention on shared state.
- **Console-specific deploy-screen behaviour**: a console-platform player reported that clicking the deploy-screen Air/Forward rows did NOT trigger vehicle deploy — they were dropped into the map and had to use the static interact-point ("arm menu") to Air or Forward Deploy. HQ Deploy from the deploy-screen worked for them. (Caveat: single player report; may be user error.)
- Error log (screenshot `reference_design_documentation/testing_images/20260413174939_1.jpg`, game v1.221):
  - `ERROR REPORTED BY UNSPAWNOBJECT WHILE RUNNING JS SCRIPT. Failed to perform operation as invalid value encountered.` ×10+
  - `ERROR REPORTED BY GETPLAYERVEHICLESEAT WHILE RUNNING JS SCRIPT. Failed to perform operation as invalid value encountered.` ×10+
  - `ERROR REPORTED BY GETVEHICLEFROMPLAYER WHILE RUNNING JS SCRIPT. Failed to perform operation as invalid value encountered.` ×10+

**Why this matters**: Air and Forward Deploy are core features. Correct-vehicle reliability must be 100%. This has cost days across multiple rollback cycles (v1.106-v1.108, v1.151-v1.155) — the fix must be surgical, bisectable, and not reintroduce banned patterns.

**Spawner-count context (user concern)**: performance advice suggests too many vehicle spawners is costly. Current budget:
- Baseline static slots per match: ~14 per side × 2 = **28** (aircraft + ground slots across main bases).
- Optional forward-flag slots: 4 currently. Total persistent: **~32 spawners**.
- Every Air or Forward Deploy click spawns an **additional runtime `VehicleSpawner` prefab** (deploy-fulfillment.ts:368, 440). These are stored on `slot.freshAirRuntimeSpawner` and despawned when the **next fresh-aircraft/forward request** for that slot begins (reuse-by-destroy pattern at deploy-fulfillment.ts:347-349). The prior spawner is **NOT cleaned up on vehicle destruction or player undeploy**. If a slot's vehicle is destroyed and never re-requested (end of round / team swap / long idle), the runtime spawner leaks until slot disable (spawner-slots.ts:98-102).
- Leak ceiling: one leaked runtime spawner per Air/Forward slot × matches without slot-disable = bounded, but the additive footprint raises the count during a long match.

## Root-Cause Multi-Hypothesis Analysis

Each click of Air/Forward produces a user-visible Abrams only if an Abrams physically exists in the world *and* gets bound to the target slot / seated into directly. The system has several places where an Abrams can be born and several places where one can be accepted.

### PRIMARY MP-SPECIFIC HYPOTHESIS

- **M. GLOBAL SINGLETON `activeSpawn*` TRACKING** — runtime-state.ts active fields: only a SINGLE slot can be the "active spawn" at any moment across the whole mode. Writers: deploy-fulfillment.ts:360-362 (Air), :432-434 (Forward), spawner-sequence.ts:34-36 (round-start sequence).

  **MP race**: Player A clicks Air on an aircraft slot — `activeSpawnSlotIndex` is armed to aircraft slot X. Before A's aircraft binds (~0.1-0.4 s window), Player B clicks Air/Forward on a different slot Y — `activeSpawnSlotIndex` is **clobbered** to Y. When A's `OnVehicleSpawned` aircraft event fires, vehicle-events.ts:89-98 reads active tracking pointing to slot Y. Two failure modes follow:
  - If Y is not aircraft-class, the CQ_Bug_49 intercept at vehicle-events.ts:130-133 does NOT fire for a prefab-default Abrams event for slot Y (wrong class check). Abrams gets bound to Y via the active-token path in `bindSpawnedVehicleToSlot`.
  - If A's real aircraft arrives after clobber, it sees active pointing at Y, is not an aircraft in Y's eyes, falls through to position-based bind which fails (aircraft is aerial, Y is a ground pad), and ends up orphaned.

  This is the most plausible explanation for "no solo repro, reliable MP repro". A single active-slot singleton cannot serialize two concurrent direct-spawn clicks correctly.

### How an Abrams can be born

- **A. Engine default `RuntimeSpawn_Common.VehicleSpawner` prefab AutoSpawn race** (CQ_Bug_54, OPEN).
  deploy-fulfillment.ts:368-378 and 440-450: `mod.SpawnObject(mod.RuntimeSpawn_Common.VehicleSpawner, ...)` → `SetVehicleSpawnerAutoSpawn(false)` → `configureVehicleSpawner` → `await mod.Wait(0)` → `ForceVehicleSpawnerSpawn`. The prefab's baked-in AutoSpawn can fire synchronously in the gap between `SpawnObject` returning and `SetVehicleSpawnerAutoSpawn(false)` landing. The default spawn is an Abrams. Applies to **every** Air/Forward runtime-spawner invocation.

- **B. Map-configured engine VehicleSpawner pads** can emit a default Abrams before `configureVehicleSpawner` runs on round start. vehicle-events.ts:109-118 covers initial-round boot, but not mid-round after a destroy/respawn cycle if timing is unlucky.

- **C. Leaked Abrams from a prior failed despawn**. `UnspawnObject` errors in the log (10+ per match) prove every `try { mod.UnspawnObject(x); } catch {}` call site can silently leave the Abrams alive. Sites:
  - vehicle-events.ts:106, 111, 131
  - deploy-fulfillment.ts:197, 242, 404, 485, 588
  - Each catch is silent. The Abrams stays in `mod.AllVehicles()` with no `vehicleToSlot[objId]` mapping → picked up by any subsequent radius scan that does not reject tanks. **Orphans accumulate through the match** — explains why reliability degrades over time.

- **D. Leaked runtime VehicleSpawner prefabs**. `slot.freshAirRuntimeSpawner` is only despawned when a **new** same-slot spawn request begins (deploy-fulfillment.ts:347-349) or on slot disable (spawner-slots.ts:98-102). If a slot's vehicle is destroyed and the slot is not re-requested for a long time, the runtime spawner persists and can continue to tick AutoSpawn internally on some engine paths. Lower-probability Abrams source but an active leak.

### How a born Abrams can be accepted as the requested vehicle

- **1. SILENT "Air" → "Forward" MODE CONVERSION FOR NON-AIRCRAFT SLOTS** — deploy-timer-ui.ts:1818-1820. Air button on non-aircraft slots is silently rewritten to `"forward"` and routed through `spawnForwardDeployVehicleForSlot`. Means the bug surface on non-aircraft rows folds into the forward-deploy path's fallback weaknesses.

- **2. UNBOUNDED FORWARD-DEPLOY RADIUS FALLBACK ACCEPTS ANY UNMAPPED VEHICLE** — deploy-fulfillment.ts:454-475. Scans 40 m around the forward position and accepts any unmapped vehicle. **No tank-instance rejection.** Air fallback deploy-fulfillment.ts:315 rejects tanks; forward does not.

- **3. CQ_Bug_49 INTERCEPT HAS A TIMING AND CLASS-CHECK GAP**.
  vehicle-events.ts:130-133 requires the intercepting slot to be **aircraft-class AND** the inbound vehicle to be a tank instance. With the MP singleton clobber (Hypothesis M), the active slot may be the wrong class at intercept time → no rejection. Also, if the real aircraft binds first and clears active tracking before the prefab Abrams event fires, the Abrams arrives unclassified → orphan.

- **4. UNSPAWNOBJECT SILENT FAILURE COMPOUNDS #3 AND LEAKS #C**. Every despawn call site swallows errors silently.

- **5. FULFILLMENT DESPAWN ORDERING RACE ON FORWARD DEPLOY** — deploy-fulfillment.ts:580-595. `vehicleToSlot[existingObjId]` cleared before `UnspawnObject(existingPadVehicle)`. On despawn failure the old vehicle becomes unmapped and alive, feeding the radius scan #2.

- **6. VEHICLE-OCCUPANCY CACHE STALENESS / `GETPLAYERVEHICLESEAT` SPAM** — deploy-fulfillment.ts:634-638. Pre-seat cache set happens before a safe re-check of `mod.IsPlayerValid`. Explains two of the three error classes in the log. Independent of Abrams bug.

### Console-specific hypothesis (corrected)

- **7. DEPLOY-SCREEN BUTTON EVENT PATH IS CONSOLE-BROKEN**. User correction: console player did NOT get Air/Forward deployed from the **deploy-screen row buttons**; they spawned normally and then used the in-world static interact-point arm menu to Air/Forward, which worked. HQ Deploy from the deploy-screen worked for them.
  - The deploy-screen button hooks at deploy-timer-ui.ts:555-560 and 755-760 enable `HoverIn/HoverOut/FocusIn/FocusOut/ButtonDown/ButtonUp`. Console-controller input may not dispatch all of these events identically; or the deploy-screen `tryClaimVehicleDirectSpawnForPlayer` path may be gated by something assuming keyboard/mouse.
  - The arm-menu path (interaction/actions.ts) uses a different event flow, which is why it works.
  - **Caveat**: single player report; may be user error. Keep this as a low-priority investigation, not a blocking fix.

### Ranking by confidence

| Rank | Hypothesis | Confidence | Reproduction context |
|---|---|---|---|
| 1 | Global `activeSpawn*` singleton clobber on concurrent MP clicks (M) | **Very high** | Matches "MP repro, SP no-repro" |
| 2 | Runtime-spawner prefab AutoSpawn race (A) | **High** | Source of Abrams instances |
| 3 | Forward-deploy fallback has no tank-reject (#2) | **High** | How Abrams reaches a non-tank slot |
| 4 | UnspawnObject silent failures → orphans (#4, C) | **High** | Degradation over match; log evidence |
| 5 | Silent Air→Forward mode rewrite (#1) | **Medium-high** | Folds non-aircraft clicks into #2/#3 |
| 6 | Fulfillment despawn ordering (#5) | **Medium** | Pad-swap window |
| 7 | Runtime-spawner leak over match (D) | **Medium** | Spawner count growth, possible perf contributor |
| 8 | Console deploy-screen button event path (#7) | **Low** (single report) | Console only |
| 9 | `GetPlayerVehicleSeat`/`GetVehicleFromPlayer` cache staleness (#6) | **Low** (log-only) | Independent log noise |

## Recommended Phased Fix Plan

Each phase is **one commit** for bisectability. Ship highest-MP-impact first, lowest-risk within that tier. Bundle cap 1,048,576 B (v1.222: 998,184 B).

### Phase 1 — v1.223: Per-Slot Spawn Tracking (kill the global singleton)

**Goal**: Eliminate the MP concurrent-click race. This is the likely primary cause and must ship first.

**Change**:
- Replace `State.vehicles.activeSpawnSlotIndex / activeSpawnToken / activeSpawnRequestedAtSeconds` with a per-slot structure. Every slot already carries `spawnRequestToken` and `expectingSpawn` — we just need a lookup *from vehicle spawn event back to the slot* that is safe against concurrency.
- Approach: in vehicle-events.ts:89-98 and spawner-bind.ts:208-229, change lookup to **scan all slots** for `slot.expectingSpawn === true && (now - slot.expectingSpawnStartedAtSeconds) < VEHICLE_SPAWNER_BIND_TIMEOUT_SECONDS`, plus match by position within a tight radius (< 5 m) to disambiguate between multiple concurrently-expecting slots.
- If multiple slots are expecting and the inbound position matches more than one, take the one with the closest position.
- Remove all writes to `State.vehicles.activeSpawn*` (deploy-fulfillment.ts:360-362/432-434, spawner-sequence.ts:34-36) and all clears (spawner-bind.ts:226-228/237-239/264-267, deploy-fulfillment.ts:289-292). Delete the fields from `runtime-state.ts`.
- Update spawner-sequence.ts:34-47 to set `slot.expectingSpawn=true` + timestamp instead of touching global tracking.

**Why position-plus-expecting is correct**: two players cannot physically spawn at the same forward volume within <5 m of each other (volumes are per-team and spaced). Aircraft birth-spawn positions differ per slot. The position-plus-token approach degrades gracefully if two aircraft slots expect simultaneously — each one's `OnVehicleSpawned` arrives at its own birth position.

**SP Test**:
- All single-player Air/Forward/HQ deploys work identically (token race is non-existent in SP)
- Initial round-start spawn sequence still fires all persistent slot spawns
- Repeated Air Deploy on same slot: each spawn binds to that slot
- Round cleanup + restart: new spawns bind correctly

**MP Test** (required before v1.224 ships):
- Two players click Air on two different aircraft slots within 100 ms: both get correct aircraft
- Two players click Forward on two different transport/tank slots within 100 ms: both get correct vehicle
- Two players click Air on the SAME slot (should not be possible — pendingSpawnOwnerPid gates it, but verify): second player gets "already claimed" rejection cleanly

**Blast radius**: Medium. Changes a cross-cutting pattern touched by 4 files. High-reward: closes the #1 hypothesis. All changes remove code (global fields, their writes/clears) — net bundle decrease expected.

### Phase 2 — v1.224: Wrong-Vehicle Slot Recovery Safety Net (worst-case unlock)

**Goal**: Even if the class mismatch reaches bind (race slipped through Phase 1) or seat (player ends up in an Abrams when they requested a Jet), the slot MUST recover so the player can try again after the normal respawn timer. Under the current code, a wrong-class bind locks the slot — `slot.vehicleId` points at the Abrams, `slot.activeOwnerPid` never gets cleared, and the deploy timer sits dead for the rest of the match. This is the reported "catastrophic slot-lock" symptom.

**Change** — three complementary mechanisms:

1. **Synchronous class-mismatch detect at bind time** — in spawner-bind.ts:bindSpawnedVehicleToSlot (and the Phase 1 per-slot equivalent): after the position/expecting match picks a slot, assert that the class matches via a new helper `isVehicleClassMatchForSlot(vehicle, slot)`:
   - aircraft slot → vehicle must pass `!isTankVehicleInstance` AND ideally `isAircraftVehicleInstance` (add this helper if missing)
   - tank/ground slot → vehicle must not be an aircraft instance
   If mismatch: `UnspawnObject(vehicle)` (catch to blacklist), do NOT call `bindVehicleToSpawnerSlot`, do NOT set `slot.vehicleId`, clear `slot.expectingSpawn`, keep `slot.pendingSpawnOwnerPid`/`pendingSpawnMode` intact, schedule a retry via `scheduleBlockedSpawnRetry(slotIndex)` or equivalent. The player's claim survives; the slot re-requests via its existing respawn plumbing.

2. **Post-seat class verification** — in the fulfillment verify loop deploy-fulfillment.ts:642-649: after `ForcePlayerToSeat` succeeds, verify `isVehicleClassMatchForSlot(vehicle, slot)`. If mismatch (e.g. player is now in an Abrams for a Jet slot):
   - Force-eject the player (`mod.ForceExitVehicle` or equivalent)
   - `UnspawnObject(vehicle)` (catch to blacklist)
   - Clear `slot.vehicleId = -1`, `slot.activeOwnerPid = undefined`, `slot.pendingSpawnOwnerPid = undefined`
   - Force-undeploy the player so they can re-claim (existing `forceUndeployAfterVehicleDirectSpawnFailure` path)
   - Mark slot as available immediately; respawn timer governs next availability (no double-penalty)

3. **Periodic class-mismatch watchdog** — add a low-frequency sweep (every 2 s is plenty; piggyback on existing vehicle-deploy-timer tick or a dedicated small timer):
   - Iterate `State.vehicles.slots` where `slot.vehicleId !== -1`
   - Resolve `findVehicleById(slot.vehicleId)`; if missing → `markVehicleSlotDestroyed(slot)` (handles engine-side vehicle loss we missed)
   - If present → check `isVehicleClassMatchForSlot(vehicle, slot)`; if mismatch → execute the recovery path from #1 (despawn + reset + respawn schedule)
   - Also: if slot has `activeOwnerPid` set but that pid is not `deployedByPid[pid]` for >5 s → clear `activeOwnerPid` (fixes the "owner ghost" subtype of lock)

**Why three layers**: #1 is the fast path and the normal case; #2 catches anything that slipped through to seat (cheaper to check than watchdog); #3 is the worst-case safety net — any exotic race, any engine event we missed, the slot still recovers within 2-4 s.

**SP Test**:
- Manually corrupt a slot (via dev harness or debug command): set `slot.vehicleType = Jet` while the actual vehicle is an Abrams → watchdog detects and resets within one tick
- Standard Air/Forward flows: no regression, no false positives on correct vehicles (class-match helper must be strictly correct)
- Slot-lock recovery timing: measure elapsed from wrong-class bind to slot becoming available again — should be ≤ respawnDelaySeconds + detection latency

**MP validation queue**:
- Force the Abrams race (two concurrent clicks on Phase 1 pre-fix build for contrast; then retest on Phase 1+2 build): verify no slot locks across 30 trials
- Observe watchdog does not false-positive under normal concurrent deploy flows

**Blast radius**: Medium. Adds one helper (`isVehicleClassMatchForSlot`), three call sites, and one periodic sweep. No existing behaviour removed; all new code is defensive and gated on mismatch.

### Phase 3 — v1.225: Tank-Instance Reject On Forward-Deploy Fallback + UnspawnObject Failure Handling

**Goal**: Symmetry with the Air fallback; surface silent despawn failures so orphans are tracked not ignored.

**Change**:
- deploy-fulfillment.ts:454-475: add `if (isTankVehicleInstance(v)) continue;` unless the slot itself is tank-class. Extract into `tryFindUnmappedVehicleNearPosition(pos, maxDistance, allowTankInstances)` and reuse from both Air and Forward fallbacks.
- Add a rejection blacklist `State.vehicles.rejectedTankObjIds: { [objId: number]: true }` in `runtime-state.ts`. Every despawn-on-reject site (vehicle-events.ts:131, deploy-fulfillment.ts:197, 242, 404, 485, 588) wraps the `UnspawnObject` call; on throw, mark the objId on the blacklist. The reusable scan helper skips blacklisted ids.
- This closes both the "no tank reject on forward fallback" gap and the "orphans from UnspawnObject failures" accumulation.

**SP Test**: every vehicle class spawns correctly; manual force of a failed despawn (only reachable by testing code) verifies blacklist entry.

**MP Test (deferred polish note)**: two concurrent clicks on adjacent forward volumes do not cross-pollute.

**Blast radius**: Small. Adds a helper and a blacklist; all writes to blacklist are within existing try/catch blocks.

### Phase 4 — v1.226: Preemptive Abrams Wipe Around Runtime Spawner

**Goal**: Eliminate the prefab-default Abrams source before any intercept needs to fire. Close CQ_Bug_54.

**Change**: in both `spawnFreshAircraftDirectSpawnVehicleForSlot` and `spawnForwardDeployVehicleForSlot`, immediately after `mod.SpawnObject(RuntimeSpawn_Common.VehicleSpawner, pos, rot)` and BEFORE `SetVehicleSpawnerAutoSpawn(false)`:
- Scan `mod.AllVehicles()` once, find any `isTankVehicleInstance` within 2 m of `pos` with no `vehicleToSlot` mapping, `UnspawnObject` it synchronously.
- If `UnspawnObject` throws, mark on the blacklist (Phase 3 groundwork).

Reactive form (alternative, lower cost): wait until after `await mod.Wait(0)` and before `ForceVehicleSpawnerSpawn` — by then the prefab AutoSpawn has fired. This reduces the per-click scan frequency to only when something actually arrived; the intercept already handles active-token cases, so this is the "belt" under the "suspenders" (Phase 1's per-slot tracking already closes most of it; this handles the residual prefab race).

**SP Test**: every aircraft and forward request results in the correct vehicle, no Abrams artefact ever appears in world.

**Blast radius**: Medium. Adds a per-click scan — O(vehicles) per Air/Forward click only (not per tick). Acceptable because the user rarely clicks >1/sec and `mod.AllVehicles()` is bounded by our own budget.

### Phase 5 — v1.227: Remove Silent Air→Forward Mode Conversion + UI Class Audit

**Goal**: Stop the silent rewrite so click intent matches execution.

**Change**:
- deploy-timer-ui.ts:1818-1820: delete the block.
- Audit row rendering at deploy-timer-ui.ts:1501 + button-creation paths at lines 450-760: non-aircraft slots render only HQ + Forward buttons; aircraft slots render only HQ + Air; no Air button ever on non-aircraft row.
- Defensive early-return: `if (mode === "air" && !isAircraftSpawnVolumeVehicleType(slot.vehicleType)) return true;` at button-up handler entry.

**SP Test**: every row's button set matches vehicle class; every button spawns correct vehicle; no regression.

**Blast radius**: Small-medium. UI surface audit.

### Phase 6 — v1.228: Forward-Deploy Pad Despawn Ordering Fix

**Goal**: Don't orphan the existing pad vehicle on a forward claim.

**Change** at deploy-fulfillment.ts:580-595:
- Reverse order: `UnspawnObject(existingPadVehicle)` first.
- On throw: mark old vehicle on the blacklist, leave mapping/`vehicleId` intact, fail the fulfillment cleanly.
- Keep 0.1 s settle wait.

**Blast radius**: Small.

### Phase 7 — v1.229: Vehicle-Occupancy Cache Safety + Spawner-Leak Audit

**Goal**: Eliminate `GetPlayerVehicleSeat`/`GetVehicleFromPlayer` error spam and bound the runtime-spawner lifetime.

**Changes**:
- id-helpers.ts: `safeGetVehicleFromPlayer`/`safeGetPlayerVehicleSeat` early-return `undefined` if `!mod.IsPlayerValid(player)`.
- `onPlayerLeaveImpl` / disconnect path: explicitly `delete State.players.posDebugVehicleObjIdByPid[pid]`.
- Re-check `mod.IsPlayerValid(player)` immediately before pre-seat cache set at deploy-fulfillment.ts:634.
- **Runtime-spawner leak mitigation**: on `OnVehicleDestroyed` (vehicle-events.ts:195+), if the destroyed vehicle's slot has a `freshAirRuntimeSpawner`, despawn it immediately and null it. This ensures: one vehicle per slot → destroyed → one runtime spawner cleaned up → no accumulation through a match.
- Add a one-shot diagnostic: at round start, count `mod.AllVehicles().length` and the per-slot `freshAirRuntimeSpawner` count; log once per minute gated on `FEATURE_DEBUG_LOG`.

**SP Test**: deploy into vehicle, destroy vehicle, confirm per-slot `freshAirRuntimeSpawner` returns to `undefined` immediately. Log counts remain stable across a 20 min match.

**Blast radius**: Small. Defensive.

### Phase 8 (optional, deferred) — v1.230: Console Deploy-Screen Input Audit

**Goal**: Investigate (not yet fix) the console deploy-screen button-event gap.

**Action**: no code change yet. Queue as `CQ_Investigate_Console_Deploy_Buttons` with:
- Hypothesis: controller input may not dispatch the same `UIButtonEvent.HoverIn/HoverOut/FocusIn/FocusOut` sequence as mouse/kb.
- Diagnostic: temporarily (under `FEATURE_DEBUG_LOG`) log every UIButtonEvent received for deploy-timer-ui rows with pid + event + platform inference.
- Defer until we have a confirmed console playtest and repeatable observation, then open a targeted fix.

**Ship condition**: only after Phases 1-7 are deployed and MP-stable.

## Verification

### Per phase
1. `npm run build` succeeds, bundle under cap
2. TypeScript clean
3. SP test plan for that phase passes
4. `npm run bumpVersion -- -c "<summary>"` runs cleanly
5. Design doc Project Stats refreshed per AGENTS.md
6. `conquest_issues.md` updated
7. This plan file's status table updated

### MP validation (gating Phase 1 only, deferred for Phases 2-7)
Phase 1 must be MP-tested before Phase 2 ships, because Phase 1 is the theorized primary cause and Phases 2-7 are hardening that rides on Phase 1's correctness. Test scenarios:
- Two players click Air on two aircraft slots within 50-200 ms: both receive correct aircraft, 10 trials
- Two players click Forward on two ground slots within 50-200 ms: both correct, 10 trials
- One player clicks Air on aircraft while another clicks Forward on transport: both correct, 10 trials
- Record: if zero Abrams-substitution events across 30 trials, Phase 1 is validated.

### Across the stack (after v1.229)
- Close `CQ_Bug_54` at v1.226
- New entries: `CQ_Bug_ActiveSpawnSingletonMPRace` (Phase 1), `CQ_Bug_WrongVehicleSlotLock` (Phase 2), `CQ_Bug_ForwardFallbackNoTankReject` (Phase 3), `CQ_Bug_RuntimeSpawnerLeakOnDestroy` (Phase 7), `CQ_Bug_UnspawnObjectErrorSpam` (Phase 7)
- Transcribe the error-log screenshot into the relevant issue body as a reproduction artefact

### MP validation queue (Phases 2-7, not gating each commit)
- 8-player playtest with ≥1 console client
- Mass Air/Forward deploys across 15-20 min
- Observe runtime-spawner count stability via diagnostic logs
- Console deploy-screen button audit (Phase 8 hook)

## Critical Files

| File | Phases |
|---|---|
| src/state/runtime-state.ts | 1 (remove `activeSpawn*`), 3 (add `rejectedTankObjIds`) |
| src/vehicles/deploy-fulfillment.ts | 1, 2 (post-seat verify), 3, 4, 6, 7 |
| src/vehicles/spawner-bind.ts | 1 (lookup strategy), 2 (bind-time class check) |
| src/vehicles/spawner-sequence.ts | 1 (remove global writes) |
| src/index/vehicle-events.ts | 1 (lookup), 2 (watchdog hook), 3 (blacklist), 7 (leak mitigation) |
| src/vehicles/vehicle-classification.ts | 2 (add `isVehicleClassMatchForSlot` + `isAircraftVehicleInstance`) |
| src/vehicles/deploy-timer-ui.ts | 5 |
| src/state/id-helpers.ts | 7 |
| conquest_issues.md + TWL_Conquest_Design.md | all (issue entries + stats bump) |

## Do Not Repeat

1. **No pre-seat `mod.Teleport` before `ForcePlayerToSeat`.** Banned. Broke twice (v1.106-v1.108, v1.151-v1.155).
2. **Keep CQ_Bug_49 intercept at vehicle-events.ts:130 and reject in spawner-bind.ts:197.** Load-bearing — Phase 1's per-slot lookup must preserve the class-reject semantics.
3. **Keep `suppressNextBindSpawnTransformCorrection` wiring.** Prevents aircraft teleport-back to HQ pad.
4. **Keep `cleanupStaleVehiclesNearPosition` and `isForwardDeployPositionOccupied`.** v1.203-v1.204 hardening.
5. **Do not swap `RuntimeSpawn_Common.VehicleSpawner` prefab** without verifying its default spawn.
6. **One small bisectable commit per phase.** No refactor bundling.

## Concise Summary & Recommendations

**Primary root cause (MP-specific)**: `State.vehicles.activeSpawnSlotIndex/Token` is a **global singleton** shared across all players. When two players click Air/Forward within <0.4 s, the second click clobbers the first's active tracking. `OnVehicleSpawned` for player A's vehicle is then attributed to player B's slot, the class-based intercept (CQ_Bug_49) does not fire, and a prefab-default Abrams binds to whichever slot the tracking points at. Matches the user's observation: no solo repro, reliable MP failure across all vehicle classes.

**Secondary causes** (stack on top of primary):
- CQ_Bug_54 prefab-default Abrams AutoSpawn race (deploy-fulfillment.ts:368/440).
- Forward-deploy radius fallback accepts any unmapped vehicle including tanks (deploy-fulfillment.ts:454-475) — symmetry gap with Air fallback.
- Silent `UnspawnObject` failures (log evidence) leak orphan vehicles that subsequent scans pick up.
- Silent Air→Forward rewrite on non-aircraft rows (deploy-timer-ui.ts:1818) widens the attack surface of the forward fallback.

**Spawner-count audit (addressing user's perf concern)**:
- Persistent slot spawners: ~28-32.
- Each Air/Forward click adds one runtime VehicleSpawner prefab, cleaned up only when the same slot is re-requested or disabled. Destruction of a slot's vehicle does NOT currently clean it up. **Phase 7 adds destroy-path cleanup**, bounding the total to ~1 transient per active slot.

**Recommended sequence**:
- **Phase 1 (v1.223)** — replace the global singleton with per-slot tracking. Closes the MP race (primary cause). MP-test before proceeding.
- **Phase 2 (v1.224)** — **wrong-vehicle slot-lock recovery safety net**. Even if a class-mismatched vehicle bind slips through, the slot must self-heal: detect at bind, detect at seat, and a periodic watchdog. Guarantees worst-case "they try again after the normal timer" instead of permanent slot death.
- **Phase 3 (v1.225)** adds the tank-reject symmetry on the forward fallback and the orphan-objId blacklist.
- **Phase 4 (v1.226)** preemptively wipes prefab Abrams to close CQ_Bug_54.
- **Phases 5-7** remove the silent UI rewrite, fix pad-despawn ordering, bound the runtime-spawner lifetime, and clean log spam.
- **Phase 8** is a deferred diagnostic for the console deploy-screen button-event issue.

**Open questions before implementation**:
- Phase 1 lookup strategy: scan-all-expecting-slots with position disambiguation (my recommendation) versus a per-player/per-slot token table. Scan is simpler, slot count (~32) makes it negligible. OK?
- Phase 2 post-seat recovery: should the recovered player be granted an immediate deploy re-credit (no respawn-timer penalty), or does the normal respawn timer apply? I recommend **no penalty** on class-mismatch recovery — the bug is ours, not theirs.
- Phase 2 watchdog cadence: 2 s sweep frequency OK, or slower (5 s) to limit cost? Slot count is small; 2 s is cheap and user-visible latency improvement is worth it.
- Phase 4: proactive per-click preemptive wipe vs. reactive post-Wait(0) wipe? I recommend proactive (uniform code path, negligible cost).
- Phase 7 destroy-path spawner cleanup: OnVehicleDestroyed-only vs. also a timeout? I recommend destroy-only first.
- Phase 8: diagnose-first or blind fix? I recommend diagnose-first; single report is ambiguous.
