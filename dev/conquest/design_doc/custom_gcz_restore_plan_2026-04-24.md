# Plan: Revert SDK Surrounding Area, restore fully custom script GCZ

**Created:** 2026-04-24
**Supersedes:** 2026-04-24 hybrid plan (engine + 2 custom OOB cases). Approach v1.345–v1.356 with the SDK `*AllowedInSurroundingArea` calls did not exempt aircraft from the vanilla "Leaving Combat Area" grey-zone on the current Portal runtime, despite per-vehicle, per-category, and global call permutations all landing without runtime error.

---

## Context

The SDK route to aircraft grey-zone exemption is empirically not viable on this runtime. We revert to fully custom script-based GCZ enforcement, with a spatial change that lets the engine's `CombatArea` be the *air* boundary (grey-zone outer fence for aircraft only) and the script handle ground enforcement entirely.

**User has restored the spatial** at `spatials/MP_TWL_Conquest16_FireStorm.spatial.json`:
- `CombatArea.CombatVolume` = `AirCombatVolume` (large air polygon — engine grey-zone owns this for everyone, but aircraft fly inside it without trigger).
- `GroundAreaTrigger` (ObjId 666) wrapping `GroundCombatVolume` (small ground play polygon).

**Spawn semantics confirmed by user:**
- HQ deploy → starts inside HQ polygon (OUTSIDE ground area trigger 666 — HQ and ground area are adjacent but non-overlapping).
- Forward deploy → starts inside ground area trigger 666 (OUTSIDE HQ polygon).
- Air deploy → starts outside ground area trigger 666 (aircraft exempt by class anyway).

## Fresh-design considerations (not just resurrecting v1.344)

This is a fully script-owned re-implementation. Not a literal revert. Decisions examined from first principles:

- **Flag vs real-time polygon check**: we don't have a polygon-membership API from the Portal SDK — only trigger enter/exit events. The flag (`inGroundCombatZoneByPid`) is the only practical signal. A real-time "is-inside" check isn't possible without polygon-coordinate introspection.
- **Single classification point**: classification (on-foot vs non-aircraft vehicle vs aircraft) lives exclusively in `getDesiredBoundaryViolationKind`. Enter/exit handlers never classify — they only maintain the polygon-membership flag. Keeps the state write side dumb and the read side smart.
- **Aircraft exemption via `isAircraftVehicleInstance`, not a BoundaryPromptKind branch**: aircraft never produce a `"ground_combat_zone"` violation kind in the first place. No need to wire skip-logic in alarm/prompt UI.
- **Y-ceiling stays an ADDITIVE condition**: foot players above Y=200 are treated identically to foot players outside trigger 666. Same `"ground_combat_zone"` kind, same countdown, same HUD. One message, two physical conditions.
- **`tickBoundaryEnforcement` already wired** (v1.355). No loop-wiring work; just new branches inside the existing tick.
- **Vehicle entry/exit transitions**: `onPlayerEnterVehicle` / `onPlayerExitVehicle` should call `refreshPlayerBoundaryState(player)` so classification updates the moment the player sits/bails, not on the next tick. The existing `tickBoundaryEnforcement` handles the worst-case latency.
- **We do NOT re-introduce** `recheckBoundaryAfterAircraftExit`, `killOnBailAboveCeiling`, or `groundCombatZoneCeilingY` config field. The Y check is already folded into `getDesiredBoundaryViolationKind` using `AIRCRAFT_BAIL_CEILING_Y` directly (simpler than a per-map config).
- **We do NOT bring back the custom-aircraft-ceiling `SetMaxVehicleHeightLimitScale` calls** as part of this plan. That system is orthogonal and predates SDK 1.2.3 SA.

---

**Intended outcome:**
- **Foot players** outside ground area trigger 666 → custom HUD warning + alarm + 10s kill countdown.
- **Non-aircraft vehicle occupants** (tanks, bradleys, transports, naval) outside trigger 666 → same custom OOB.
- **Aircraft occupants** (heli or plane) → exempt from script GCZ. They can fly outside trigger 666 freely. Engine grey-zone via `CombatArea`/`AirCombatVolume` still kicks them when they leave that bigger polygon (vanilla behavior).
- **Foot Y-ceiling check (Y > 200) preserved** as belt-and-braces against bail above ground polygon ceiling.
- **Pre-live main-base** (500/501) and **enemy buffer** (502/503) enforcement unchanged.

---

## Critical files to modify

### Remove SDK Surrounding Area block

**`src/index/game-mode.ts`** — delete the entire SA init block at lines 52-80 (the global `SetAllVehiclesAllowedInSurroundingArea(true)` and 10 per-vehicle `SetVehicleAllowedInSurroundingArea(...)` calls). No replacement.

### Re-introduce trigger 666 config plumbing

**`src/config/types.ts`** — add `groundCombatZoneTriggerId?: number` field to `MapConfig` interface (alongside the existing main-base trigger fields).

**`src/config/maps/operation-firestorm.ts`** — add `groundCombatZoneTriggerId: 666` to the Firestorm map config fragment.

**`src/config/runtime.ts`** — add module-level `let GROUND_COMBAT_ZONE_TRIGGER_ID = ACTIVE_MAP_CONFIG.groundCombatZoneTriggerId;` near the existing main-base trigger ID lets.

**`src/config/map-runtime.ts`** — three additions:
- Add `groundCombatZoneTriggerId` entry to `buildMapConfigObjIdValidationEntries` (around line 336).
- Add `GROUND_COMBAT_ZONE_TRIGGER_ID = ACTIVE_MAP_CONFIG.groundCombatZoneTriggerId;` re-assignment in `applyMapConfig` (around line 637).
- Add `getGroundCombatZoneTriggerId()` getter function alongside the main-base getters (around line 715).

### Re-introduce `inGroundCombatZoneByPid` state

**`src/state/runtime-types.ts`** — add `inGroundCombatZoneByPid: Record<number, boolean>;` to the `boundary` shape (line 314).

**`src/state/runtime-state.ts`** — add `inGroundCombatZoneByPid: {},` to the boundary initializer (line 66).

### Wire trigger-666 enter/exit + classification check

**`src/boundary/enforcement.ts`** — edits:

1. `onPlayerEnterBoundaryAreaTrigger` — add a branch setting `inGroundCombatZoneByPid[pid] = true` when `triggerId === getGroundCombatZoneTriggerId()`.
2. `onPlayerExitBoundaryAreaTrigger` — mirror branch setting flag to `false`.
3. `resetPlayerBoundaryStateOnDeploy` — initialize `State.round.boundary.inGroundCombatZoneByPid[pid] = true;`. HQ-deployed players are main-base-exempt while in HQ; forward-deployed players spawn inside the polygon; aircraft-deployed players are class-exempt. Known edge case: HQ-to-direct-OOB walk stays wrongly `true`.
4. `resetPlayerBoundaryStateOnUndeployOrReset` — `delete State.round.boundary.inGroundCombatZoneByPid[pid];`.
5. `getDesiredBoundaryViolationKind` — replace the existing Y-only on-foot check with combined GCZ flag + Y check; add a non-aircraft vehicle branch. Aircraft occupants always exempt.

### Wire vehicle enter/exit to refresh boundary state

**`src/index/vehicle-events.ts`** — in both `onPlayerEnterVehicleImpl` and `onPlayerExitVehicleImpl`, call `refreshPlayerBoundaryState(eventPlayer)` so classification updates immediately on seat transitions.

### Design docs

- **`design_doc/TWL_Conquest_Design.md`** — Ground combat zone section updated for v1.357 behavior (fully script-owned, trigger 666 active, aircraft exempt via `isAircraftVehicleInstance`, foot + non-aircraft vehicle enforcement).
- **`design_doc/conquest_issues.md`** — add `CQ_Feat_Custom_GCZ_Restored` entry.

---

## Verification / test plan

### Boundary scenarios (Conquest16 spatial on Operation Firestorm)

1. **Foot inside ground area trigger 666**: no warning.
2. **Foot outside trigger 666** (live or pre-live, not in own main base): custom OOB + alarm + 10s kill.
3. **Foot above Y=200**: same custom OOB.
4. **Tank/Bradley/CV90 inside trigger 666**: no warning.
5. **Tank/Bradley/CV90 outside trigger 666**: custom OOB + 10s kill.
6. **Heli outside trigger 666, inside AirCombatVolume**: no script OOB, no engine grey-zone.
7. **Jet outside trigger 666, inside AirCombatVolume**: no script OOB, no engine grey-zone.
8. **Aircraft outside CombatArea/AirCombatVolume edge**: vanilla engine "Leaving Combat Area" timer.
9. **HQ deploy** (foot): main-base exemption holds.
10. **Forward deploy** (inside ground area): no warning at spawn.
11. **Air deploy** (aircraft, outside ground area): no warning at spawn.
12. **Pre-live main-base**: unchanged.
13. **Live enemy main-base buffer**: unchanged.
14. **Match end + victory dialog**: no stray boundary HUD.

### Build health

- `npm run bumpVersion -- -c "Revert SDK SurroundingArea; restore custom script GCZ for foot + non-aircraft vehicles outside trigger 666; aircraft exempt"`
- `npm run build` → PASS, bundle below 1,048,576 byte cap.
- `cmd /c npx tsc --pretty false --noEmit` → exit 0.

---

## Historical archive

This file is the frozen archive of the approved plan. Sibling archives: `boundary_hybrid_plan_2026-04-24.md`, `ground_vehicle_surrounding_area_plan_2026-04-23.md`, `supply_box_launcher_fixes_plan_2026-04-22.md`. Never edited after creation.
