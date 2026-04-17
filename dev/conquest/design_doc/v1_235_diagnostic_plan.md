# Plan: Vehicle Deploy Recovery — diagnose first, then surgically remove workarounds

**Created**: 2026-04-14 (revised after v1.229→v1.234 cycle; v1.234 shipped the spawn-category fix)
**Status**: Planning — awaiting approval to execute Phase 1

---

## Context

Three independent deploy failure modes remain after v1.234:

1. **Forward Deploy Abrams substitution** — Cheetah/Gepard/Leopard slots intermittently produce an Abrams.
2. **HQ Deploy aircraft-except-F16 failure** — F16 works reliably in every slot it's placed in; F22/JAS39/SU57/UH60/AH64/MH6 fail in HQ Deploy configurations.
3. **Air Deploy seat failure** — MH6 (and others) spawn the correct vehicle at the correct position, but `ForcePlayerToSeat` silently does nothing. Player stays on the deploy screen or falls.

Five rounds of patching (v1.223–v1.227) and the v1.228 revert did not resolve these. v1.229 pulled SDK 1.2.3, whose patch notes include:
- "Corrected vehicle spawner behaviour so the intended vehicles now spawn correctly."
- "Corrected vehicle event behaviour so events now fire correctly for every seat."

This is load-bearing: **the SDK patches may have fixed the bugs our workaround layer was built against.** If so, layers like the `activeSpawn*` singleton, CQ_Bug_49 Abrams-reject, `suppressNextBindSpawnTransformCorrection`, and the 40m radius fallback are now actively harmful — they reject correct spawns or mask the real post-SDK-patch behaviour.

Two new facts reshape the diagnosis:

- **F16 vs. other aircraft asymmetry** (user-confirmed): F16 works everywhere; other jets/helis fail everywhere. This eliminates slot-specific theories (position/volume/yaw-offset) and points at something vehicle-type-specific in the bind or seat layer.
- **ForcePlayerToSeat silently fails when player is far from the vehicle** (external SDK research, consistent with our `reference_sdk_1.2.3`). Our current fulfillment path does NOT teleport the player near the vehicle before `ForcePlayerToSeat` because of the pre-seat-teleport ban (v1.106–v1.108, v1.151–v1.154). That ban may have been over-scoped: prior failures could have been *specific* pattern failures (wrong offset, wrong timing), not the *general* "teleport before seat" pattern. Without data we don't know.

v1.234 shipped: `resolveVehicleSlotSpawnCategory` was missing DirtBike/DirtBike_Pax/AH6M_Pax/UH60/UH60_Pax/Vector/RHIB cases, which caused them to fall to "other", which filtered them from the deploy menu and caused bootstrap auto-spawn. User confirmed DirtBike now works.

**Why the previous "relocate-and-reuse" plan is on hold**: it assumes we know the root cause. We don't. Shipping a rearchitecture before we have data on whether the SDK patches plus our workaround-removal already fix things risks a fourth wasted cycle. Gather data first.

---

## Strategy

**Two-phase approach. No rearchitecture in the first phase.**

**Phase 1 (v1.235) — Diagnostic instrumentation + isolated minimal-pattern test.** No production code path changes. Adds telemetry to the existing deploy path and an admin-panel button that runs the canonical SDK spawn pattern in isolation, bypassing every workaround layer. Gathers the data needed to make Phase 2 surgical instead of speculative.

**Phase 2 (v1.236+) — Data-driven removal of harmful workaround layers, OR (if Phase 1 shows SDK still buggy) targeted fix for the specific failure mode.** One of two branches based on Phase 1 results.

The previous "relocate-and-reuse" rearchitecture (old Phase A–E, preserved in [air_forward_relocate_reuse_plan.md](bf6-portal/dev/conquest/design_doc/air_forward_relocate_reuse_plan.md)) is **deferred** — kept as a fallback if Phase 2 branch (c) is needed, but not the default path.

---

## Phase 1 — v1.235: Diagnostic HUD + Isolated minimal-pattern test button

**Goal**: produce concrete per-click data for each failure mode without touching the production deploy path.

### Part A — Diagnostic HUD (per-click telemetry)

**Host**: extend the existing per-player deploy-timer HUD pattern used in [src/vehicles/deploy-timer-ui.ts](bf6-portal/dev/conquest/src/vehicles/deploy-timer-ui.ts) (`ensureVehicleDeployCenteredText`, `safeParseUI`, `safeSetUITextLabel`). One new per-player text widget anchored TopLeft, visible only when a feature flag is on.

**New file**: [src/hud/deploy-diagnostic.ts](bf6-portal/dev/conquest/src/hud/deploy-diagnostic.ts) (mirror the pattern in [src/hud/position-debug.ts](bf6-portal/dev/conquest/src/hud/position-debug.ts) — token-gated lifecycle, 0.5s poll).

**Feature flag**: `FEATURE_DEPLOY_DIAGNOSTIC` in [src/config/conquest-constants.ts](bf6-portal/dev/conquest/src/config/conquest-constants.ts). Default off; enable locally for playtests.

**Log points** (each emits one line of HUD text keyed by event, last N=8 lines shown):
- Click: `[click] mode=air slot=12 type=AH64 targetPos=(x,y,z)`.
- Post-spawn: `[spawned] vehicle=Abrams boundTo=slot12 dist=3.2m` (vehicle name via `mod.CompareVehicleName` probe chain, distance from target).
- Bind outcome: `[bind] slot=12 ok|reject=abrams_on_aircraft|not_expecting`.
- Seat attempt: `[seat] dist=42.1m result=ok|silent_fail` (compare player position pre/post `ForcePlayerToSeat`; if player position unchanged AND player still on foot AND `GetVehicleOfPlayer` returns undefined, treat as silent fail).
- Retry-loop tick: `[retry] attempt=3/20 vehicleId=-1`.

**Log hook sites** (minimally invasive — emit events, don't gate logic):
- [deploy-fulfillment.ts::spawnFreshAircraftDirectSpawnVehicleForSlot, ::spawnForwardDeployVehicleForSlot, ::spawnHqDeployVehicleForSlot] — click, pre/post ForcePlayerToSeat.
- [spawner-bind.ts::bindSpawnedVehicleToSlot] — bind entry, bind outcome, reject branches.
- [spawner-sequence.ts::forceSpawnWithRetry] — per-attempt tick.

**Why this works**: the HUD gives us exactly the field we don't have — the per-event sequence from one player's perspective, visible in SP without a debugger.

### Part B — Isolated minimal-pattern test button

**Host**: new admin-panel row via [src/admin-panel/build.ts::addTesterActionButton](bf6-portal/dev/conquest/src/admin-panel/build.ts). Gated by the existing `FEATURE_ADMIN_PANEL` flag (already in [src/config/conquest-constants.ts](bf6-portal/dev/conquest/src/config/conquest-constants.ts)); click handler via `tryHandleAdminPanelPrimaryAction`.

**New file**: [src/admin-panel/test-minimal-spawn.ts](bf6-portal/dev/conquest/src/admin-panel/test-minimal-spawn.ts).

**Button label**: `Test Minimal Spawn: <VehicleType>` — 5 buttons covering: `F16` (known-good control), `AH64`, `F22`, `MH6 (AH6M)`, `Abrams` (CQ_Bug_54 control). F16 in the matrix confirms the test harness itself is not broken; if F16 fails in isolation, the test is the problem, not the production code.

**What the button does — no workaround layers at all**:
```
1. Pick a test position 30m in front of the admin player, at their Y level.
2. const spawner = mod.SpawnObject(mod.RuntimeSpawn_Common.VehicleSpawner, pos, rot);
3. mod.SetVehicleSpawnerAutoSpawn(spawner, false);
4. mod.SetVehicleSpawnerSpawnedVehicle(spawner, TEST_VEHICLE_TYPE);
5. mod.ForceVehicleSpawnerSpawn(spawner);
6. Wait for OnVehicleSpawned from that spawner (with 5s timeout, scan mod.AllVehicles() as fallback).
7. Log: "spawned=<name> pos=<pos> dist=<dist-from-target>"
8. Wait mod.IsPlayerAlive(player) && 0.2s settle.
9. mod.Teleport(player, <vehicle.pos + (0, 5, 0)>).
10. Wait 0.2s.
11. mod.ForcePlayerToSeat(player, vehicle, -1).
12. Wait 0.3s.
13. Log: "seat result: inVehicle=<bool> vehicleName=<name>".
14. Manual cleanup after ~60s: mod.UnspawnObject(spawner) and vehicle if still orphaned.
```

**Critical properties of the test button**:
- No `activeSpawn*` singleton touch.
- No `expectingSpawn` / per-slot state touch.
- No `rejectWrongCategoryBindForAircraftSlot`.
- No `suppressNextBindSpawnTransformCorrection`.
- No `applySpawnYawToVehicle` post-bind correction.
- Pre-seat teleport +5m above vehicle **IS** used — this is the specific test of the banned-but-maybe-over-scoped pattern. If it works for aircraft that currently fail, the ban is over-scoped.

**The four outcomes** define Phase 2:

| Test result | Diagnosis | Phase 2 action |
|---|---|---|
| Spawns correct type + seats reliably for **all four** test vehicles | SDK 1.2.3 patched the bugs; our workaround layer is now the cause | **Phase 2 branch (a)**: delete workaround layers surgically |
| Spawns correct type + seats reliably for **F16/Abrams** but NOT for AH64/F22/MH6 | SDK still bugged for a vehicle-type subclass; workarounds partially valid | Targeted: investigate that subclass (heli/jet) specifically |
| Spawns **Abrams** instead of requested type | SDK spawner not patched; CQ_Bug_54 AutoSpawn race still active | Revive old relocate-and-reuse plan (deferred Phases A–E) |
| Spawns correct type but seat fails even with +5m teleport | SDK seat event not patched; pre-seat teleport ban is correct | Investigate alt-seat API (e.g. `mod.SpawnPlayerFromSpawnPoint` variants, seat index != -1) |

### Phase 1 test matrix (SP only — gather data)

For each of F16 / AH64 / F22 / MH6 / Abrams using the admin test button:
- 5 clicks. Record: vehicle type spawned, distance from target, seat success.
- F16 must pass all 5 — if it doesn't, abort analysis and fix the harness.

For the production path with Diagnostic HUD on:
- 5 Forward Deploys on Cheetah, 5 on Gepard, 5 on Leopard, 5 on Abrams slots. Record: Abrams substitution rate, bind reject reason.
- 5 HQ Deploys on F16, 5 on F22, 5 on MH6, 5 on UH60, 5 on AH64. Record: spawn success + seat result.
- 5 Air Deploys each vehicle type.

**Verification**:
1. `npm run build` under 1,048,576 B (v1.234 was 999,867 B; new file ~+800 B expected).
2. Both feature flags default OFF — shipped bundle behaves identically to v1.234 for real matches.
3. TypeScript clean.
4. `npm run bumpVersion -- -c "diag: per-click deploy telemetry HUD + admin panel isolated minimal-pattern test button (both flag-gated, default off)"`.
5. Design doc Project Stats refreshed.
6. Manual toggle flags on, run the test matrix, paste results back.

**Phase 1 explicitly does NOT**:
- Change any production deploy path.
- Add/remove workaround layers.
- Touch `slot.spawnRot`, `applyVehicleSpawnSpecsToExistingSlots`, or the relocate code.
- Ship with flags enabled.

---

## Phase 2 — v1.236+: Branches based on Phase 1 data

**Do not pre-commit to a phase 2 direction.** After Phase 1 test matrix comes back, pick one of these branches and write a separate implementation plan. Sketched here only so Phase 1 design anticipates them.

### Branch (a) — SDK patched, workarounds now harmful
Delete layers in bisectable order, smallest to largest:
1. **v1.236**: Remove `CQ_Bug_49` Abrams-reject from `rejectWrongCategoryBindForAircraftSlot` + bind-layer Abrams reject (keep the reject helper file, gate behind a flag turned off). Test 20 Air Deploys on aircraft slots. If Abrams substitutions resume → restore, SDK spawner not patched, jump to branch (c).
2. **v1.237**: Remove the 40m radius fallback in Forward Deploy. Test 20 Forward Deploys.
3. **v1.238**: Replace `activeSpawn*` singleton with per-slot `expectingSpawn` + class tie-break (same algorithm as old plan Phase D but standalone).
4. **v1.239**: Remove `suppressNextBindSpawnTransformCorrection` flag and dependent `applySpawnYawToVehicle` post-bind teleport, if no longer needed.
5. **v1.240**: Fix `applyVehicleSpawnSpecsToExistingSlots` yaw-offset strip at [map-runtime.ts:607](bf6-portal/dev/conquest/src/config/map-runtime.ts) — bug: `slot.spawnRot = spec.rot` without adding `VEHICLE_SPAWN_YAW_OFFSET_DEG`, so when `posChanged === false` the offset is lost.

Each step is one bisectable commit. Any regression → revert just that step.

### Branch (b) — Pre-seat teleport is the missing piece
If the isolated test button proves +5m teleport+ForcePlayerToSeat works where production fails, port that pattern into the production fulfillment path:
1. **v1.236**: Add minimal pre-seat teleport (+5m Y above vehicle, 0.2s wait) in `spawnHqDeployVehicleForSlot`, `spawnFreshAircraftDirectSpawnVehicleForSlot`, `spawnForwardDeployVehicleForSlot`. Gate behind a flag for one commit, then remove the flag next version after SP testing.
2. Update the memory note `project_teleport_vehicle_spawn_mystery.md` to narrow the ban: "Pre-seat teleport is allowed IF target is vehicle.pos + (0,5,0) AND a 0.2s wait follows. Past failures were specific-offset failures, not the general pattern."

### Branch (c) — SDK spawner still buggy
Revive the old relocate-and-reuse plan (preserved at [air_forward_relocate_reuse_plan.md](bf6-portal/dev/conquest/design_doc/air_forward_relocate_reuse_plan.md)). The architecture diagnosis still holds; the phases still bisect correctly. Don't delete workaround layers — they're still load-bearing.

### Branch (d) — Partial SDK fix, vehicle-subclass-specific
Investigate the specific subclass (heli/jet) that still fails in isolation. Read [reference_sdk_1.2.3/code/types/mod/index.d.ts](bf6-portal/reference_sdk_1.2.3/code/types/mod/index.d.ts) for new seat/spawn primitives introduced in 1.2.3. Likely candidates: per-seat event parameters, alternate seat-from-spawn-point APIs.

---

## Critical files

| File | Phase 1 | Phase 2 (likely branches) |
|---|---|---|
| [src/config/conquest-constants.ts](bf6-portal/dev/conquest/src/config/conquest-constants.ts) | add `FEATURE_DEPLOY_DIAGNOSTIC` | — |
| [src/hud/deploy-diagnostic.ts](bf6-portal/dev/conquest/src/hud/deploy-diagnostic.ts) | new file | — |
| [src/admin-panel/test-minimal-spawn.ts](bf6-portal/dev/conquest/src/admin-panel/test-minimal-spawn.ts) | new file | — |
| [src/admin-panel/build.ts](bf6-portal/dev/conquest/src/admin-panel/build.ts) | wire test-row | — |
| [src/vehicles/deploy-fulfillment.ts](bf6-portal/dev/conquest/src/vehicles/deploy-fulfillment.ts) | add log hooks only | (a), (b), (c) |
| [src/vehicles/spawner-bind.ts](bf6-portal/dev/conquest/src/vehicles/spawner-bind.ts) | add log hooks only | (a), (c) |
| [src/vehicles/spawner-sequence.ts](bf6-portal/dev/conquest/src/vehicles/spawner-sequence.ts) | add log hooks only | (a), (c) |
| [src/config/map-runtime.ts](bf6-portal/dev/conquest/src/config/map-runtime.ts) | — | (a) step 5, (c) |
| [src/index/vehicle-events.ts](bf6-portal/dev/conquest/src/index/vehicle-events.ts) | — | (a), (c) |
| [design_doc/conquest_issues.md](bf6-portal/dev/conquest/design_doc/conquest_issues.md) | update | update |

## Reused existing utilities

- `safeParseUI`, `safeSetUITextLabel`, `safeSetUIWidgetVisible` — [src/vehicles/deploy-timer-ui.ts](bf6-portal/dev/conquest/src/vehicles/deploy-timer-ui.ts)
- Token-gated poll loop pattern — [src/hud/position-debug.ts](bf6-portal/dev/conquest/src/hud/position-debug.ts::positionDebugLoop)
- `addTesterActionButton` — [src/admin-panel/build.ts](bf6-portal/dev/conquest/src/admin-panel/build.ts)
- `tryHandleAdminPanelPrimaryAction` — [src/admin-panel/events.ts](bf6-portal/dev/conquest/src/admin-panel/events.ts)
- `isAircraftVehicleInstance`, `isTankVehicleInstance` — [src/vehicles/vehicle-classification.ts](bf6-portal/dev/conquest/src/vehicles/vehicle-classification.ts)
- `mod.CompareVehicleName` chain — for HUD vehicle-name readout

## Verification (end-to-end)

1. Build green, bundle under limit, TypeScript clean, `@ts-nocheck` respected.
2. Flags OFF: Play one SP round, confirm no HUD/UI change vs. v1.234.
3. Flags ON: run the Phase 1 test matrix (above). Save the HUD text results.
4. Paste results back into conversation; pick Phase 2 branch; write separate plan.

## Do Not Repeat

1. **No pre-seat `mod.Teleport` in production deploy path yet.** Only in the admin test button, in isolation. Branch (b) promotes it to production *only* if the test confirms it works.
2. **Do not delete workaround layers in Phase 1.** Phase 1 is read-only on production paths. Delete only in Phase 2 branch (a) with data backing each step.
3. **Ship both flags OFF by default.** Production builds must be behaviour-identical to v1.234.
4. **One bisectable commit per phase/step.** No bundling.
5. **Both SDK patch notes claims must be tested, not trusted.** "Spawner behaviour corrected" and "events fire for every seat" are claims — Phase 1 tests whether they hold in our usage.
6. **Keep the `resolveVehicleSlotSpawnCategory` fix from v1.234.** Verified working; do not regress.

## User decisions (resolved 2026-04-14)

- **Test matrix**: F16 + AH64 + F22 + MH6 + Abrams. F16 is the known-good control — if it fails in isolation, the harness is broken, abort analysis.
- **Flag defaults**: both OFF. Production v1.235 behaviour identical to v1.234.
- **slot.spawnRot yaw-offset fix**: deferred to Phase 2 branch (a) step 5. v1.235 stays purely diagnostic, no production path change.
