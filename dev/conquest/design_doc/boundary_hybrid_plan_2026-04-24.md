# Plan: Hybrid boundary enforcement — engine vanilla + custom script OOB

**Created:** 2026-04-24
**Supersedes:** 2026-04-23 SDK Surrounding Area plan (superseded by empirical testing through v1.350)

---

## Context

The re-authored spatial `MP_TWL_Conquest14_FireStorm.spatial.json` changes the map-level geometry to let the **vanilla engine** own the ground/air combat-area enforcement, with the custom script layering ONLY two OOB cases on top. This replaces a long debugging arc (v1.345–v1.350) where we tried to make the SDK `SetVehicleCategoryAllowedInSurroundingArea` calls substitute for a custom script GCZ. Empirically — and per Andy's reference at `reference_implementations/reference_andys_conquest/script-conversion (9).ts:75` — the working pattern is **one SDK call** (`Air_All=true`) plus **custom script OOB for specific trigger polygons**, not blanket engine replacement.

**Intended outcome:**
- Foot players leaving `GroundCombatVolume` (horizontally or vertically above y≈200) are kicked by the **vanilla engine** "Leaving Combat Area" grey-zone.
- Ground vehicles leaving `GroundCombatVolume` are **also** kicked by vanilla engine (default Ground_All restriction in Surrounding Area).
- Aircraft are exempt from engine grey-zone (via `SetVehicleCategoryAllowedInSurroundingArea(Air_All, true)`) and can freely operate across the full `AirCombatVolume`.
- **Custom script OOB** retains two specific kill-countdown enforcements layered on top of engine vanilla:
  1. Pre-live "return to main base" (ObjIds 500 & 501)
  2. Live enemy main-base encroachment (ObjIds 502 & 503)
- The ground combat zone trigger (ObjId 666) is **fully decoupled** from script enforcement (user reserves it for future reuse).

---

## Spatial prerequisites (USER-OWNED; blockers for this plan)

These must be resolved in the Godot editor before the script changes land:

1. **ObjId 503 collision** — `spatials/MP_TWL_Conquest14_FireStorm.spatial.json:325` (`SpawnPoint_1_5`) and `:652` (`WestMainBufferTrigger`) both claim ObjId 503. Keep 503 on `WestMainBufferTrigger`; reassign `SpawnPoint_1_5` to a free ObjId in the SpawnPoint range.
2. **ObjId 504 collision** — `:830` (`SpawnPoint_2_7`) uses a boundary-range ObjId. Reassign to SpawnPoint range.
3. **Base trigger `Area: null`** — `:118` (EastBaseAreaTrigger/500) and `:623` (WestBaseAreaTrigger/501) show `Area: null` in the JSON export. User confirms the Godot editor shows them linked to the HQ polygons. **Verify empirically** during playtest — if pre-live main-base enforcement fires correctly, the null in JSON is an export quirk and acceptable; if it fails, re-introduce explicit `Area: TEAM_2_HQ/HQ_Team2` (and `TEAM_1_HQ/HQ_Team1`) bindings.

No script changes should be merged until (1) and (2) are resolved. Item (3) can be validated during the test plan.

---

## What the scripts will do (and not do)

### Keep (unchanged)

- **SDK call** at round start: `src/index/game-mode.ts` — single `mod.SetVehicleCategoryAllowedInSurroundingArea(mod.VehicleCategories.Air_All, true)` call, mirroring Andy's pattern. Already in place as of v1.350.
- **Main-base pre-live enforcement** (trigger 500/501) — warning UI + 10s kill countdown, ready-up clear on exit. Logic in `src/boundary/enforcement.ts` under the `prelive_main_base` branch. String key `twl.boundary.preLiveMainBaseTitle*`.
- **Enemy main-base encroachment** (trigger 502/503) — warning UI + 6s kill countdown during live. Logic in same file under `enemy_main_base_buffer` branch. String key `twl.boundary.enemyMainBaseBufferTitle*`.
- **Boundary alarm SFX + countdown UI** — shared infrastructure (`BoundaryViolationState`, alarm handle, prompt UI) used by both retained violation kinds.

### Remove (fully decouple trigger 666)

In `src/boundary/enforcement.ts`:
- Delete the `ground_combat_zone` case from `BoundaryPromptKind`, `getBoundaryDurationSeconds`, `getDesiredBoundaryViolationKind`.
- Delete `isPlayerGroundCombatZoneExempt` function entirely.
- Remove `inGroundCombatZoneByPid` reads and writes from `onPlayerEnter/ExitBoundaryAreaTrigger`, `resetPlayerBoundaryStateOnDeploy`, `resetPlayerBoundaryStateOnUndeployOrReset`.
- Remove `getGroundCombatZoneTriggerId` lookups in enter/exit handlers.

In `src/index/vehicle-events.ts:33-45`:
- Delete `recheckBoundaryAfterAircraftExit` function and its call site in `onPlayerExitVehicleImpl` (foot players above y≈200 after heli bail are now caught by engine vanilla grey-zone, since they're outside `GroundCombatVolume`).

In `src/state/runtime-types.ts:317`:
- Remove `inGroundCombatZoneByPid: Record<number, boolean>` from the `boundary` state shape.

In `src/config/types.ts`:
- Remove `groundCombatZoneTriggerId?: number` and `groundCombatZoneCeilingY?: number` fields from `MapConfig`.

In `src/config/maps/operation-firestorm.ts:16-17`:
- Remove the two corresponding lines.

In `src/config/map-runtime.ts`:
- Remove `GROUND_COMBAT_ZONE_TRIGGER_ID` and `GROUND_COMBAT_ZONE_CEILING_Y` module-level lets (lines ~59-60 in `src/config/runtime.ts` plus their re-assignment in `applyMapConfig` at lines ~637-638).
- Remove `getGroundCombatZoneTriggerId` and `getGroundCombatZoneCeilingY` functions (lines ~719-730).
- Remove the `groundCombatZoneTriggerId` entry from the map-config validation list (line ~336).

### Deprecate (mark as orphan strings, do not delete yet)

String keys `twl.boundary.groundCombatZoneTitle*` in `src/strings.json` become unreferenced. Leave in place for now — user may reuse trigger 666 later and rebuild this message. A follow-up pass can remove them if reuse doesn't materialize by a future milestone. No string-file edits in this plan (AGENTS.md §75 requires explicit approval).

### Do NOT add

- Any new `SetAllVehiclesAllowedInSurroundingArea`, `SetVehicleAllowedInSurroundingArea`, `SetMaxVehicleHeightLimitScale`, or `SetVehicleCategoryAllowedInSurroundingArea(Ground_All, ...)` call. Andy's working reference uses none of these; v1.345–v1.349 confirmed they don't solve the problem.
- Any fallback "script GCZ" safety net for ground. Engine vanilla grey-zone is now authoritative for the GroundCombatVolume boundary.

---

## Critical files to modify

| File | Change |
|---|---|
| `src/boundary/enforcement.ts` | Remove `ground_combat_zone` kind + `isPlayerGroundCombatZoneExempt` + all `inGroundCombatZone*` reads/writes |
| `src/index/vehicle-events.ts` | Remove `recheckBoundaryAfterAircraftExit` and its call |
| `src/state/runtime-types.ts` | Remove `inGroundCombatZoneByPid` from `round.boundary` |
| `src/state/runtime-state.ts` | Remove the corresponding initializer |
| `src/config/types.ts` | Remove `groundCombatZoneTriggerId`, `groundCombatZoneCeilingY` from `MapConfig` |
| `src/config/maps/operation-firestorm.ts` | Remove the two corresponding field lines |
| `src/config/map-runtime.ts` | Remove getters + `applyMapConfig` assignments + validation entry |
| `src/config/runtime.ts` | Remove module-level `let` declarations for the two removed config values |
| `design_doc/TWL_Conquest_Design.md` | Update GCZ section: "vanilla engine owns GroundCombatVolume boundary for foot + ground; aircraft exempt via SDK; script retains main-base + enemy-buffer custom OOB only" |
| `design_doc/conquest_issues.md` | Add resolution entry for the aircraft grey-zone + boundary saga |

---

## Gaps and insights from the new spatial

### Gaps flagged to user (spatial side)

- **ObjId hygiene regressed** between Conquest13 and Conquest14. The old spatial had no collisions; the new one has two. The OBJ_ID_RUBRIC.md convention (one authored object = one ObjId) must be re-asserted — consider re-reading it against the spatial before the next edit.
- **`Area: null` on AreaTrigger** is a novel state we have never shipped. If it works (Godot resolves parent polygon at runtime), document that pattern in the rubric. If it doesn't, re-add explicit Area bindings.
- **Vehicle spawner `P_AbandonVehiclesOutOfCombatArea` properties** were `false` across all 8 spawners in Conquest13. Verify same in Conquest14 (not checked in audit) — inconsistency there would cause vehicles to self-destruct when pushed outside `GroundCombatVolume`.

### Insight: engine semantics finally confirmed

The v1.345–v1.350 arc proved two things by exclusion:
1. **Engine default in Surrounding Area is "restricted for all vehicles"** — Andy's `Air_All, true` would be pointless otherwise. Ground default = restricted = vanilla grey-zone. No need to call `Ground_All, false`.
2. **`SetAllVehiclesAllowedInSurroundingArea(true)` does not cascade into per-category state** — proven when Air_All alone worked (v1.348 per-category) but the global-allow version (v1.347) did not exempt aircraft.

### Insight: custom GCZ script overlay is unnecessary when CombatArea is correctly authored

The v1.345 attempt to supplement engine OOB with a custom script GCZ failed because the custom polygon's geometry wasn't reliably aligned with the engine's SurroundingVolume. With Conquest14 authoring ground and air volumes explicitly (via `CombatArea` binding), the engine handles all horizontal + vertical clipping. Custom script overlay is now only for the two specific UX moments (pre-live return-to-base and enemy buffer) where we want bespoke HUD copy.

---

## Implementation order

1. **User resolves spatial prerequisites** (collisions + optional Area-binding re-assertion).
2. **Script changes** in the order listed in the "Critical files to modify" table. Compile-check after each file to catch type-level fallout from removing `inGroundCombatZoneByPid` and the config fields.
3. **Design-doc updates** in the same commit.
4. **Bump version** via `npm run bumpVersion -- -c "Decouple script GCZ (trigger 666); rely on engine vanilla CombatArea for ground/foot; keep Air_All SDK exempt and custom pre-live+enemy-buffer OOB"`.
5. **Post-bump `tsc --pretty false --noEmit`** per AGENTS.md §109.

---

## Verification / test plan

### Foot-player scenarios
1. **Pre-live return-to-base:** spawn in main base, leave base polygon before match is live. Expected: "MATCH IS NOT LIVE; RETURN TO YOUR MAIN BASE!" + alarm + 10s kill countdown (custom script OOB, trigger 500/501).
2. **Enemy main-base encroachment:** during live match, foot-cross into enemy buffer polygon (trigger 502/503). Expected: "ENEMY MAIN BASE OUT OF BOUNDS; LEAVE NOW!" + alarm + 6s kill countdown.
3. **Leave GroundCombatVolume horizontally:** walk to the polygon edge and cross it (during live). Expected: **vanilla engine** "Leaving Combat Area" grey-zone timer appears, engine kicks at timeout. **No** custom "YOU ARE OUT OF BOUNDS" HUD string (that path is deleted).
4. **Leave GroundCombatVolume vertically (y > 200):** bail from a heli above ceiling. Expected: vanilla engine grey-zone fires on landing (foot position outside CombatVolume). **No** custom script recheck logic.

### Ground-vehicle scenarios
5. **Drive tank to GroundCombatVolume edge:** cross polygon horizontally. Expected: vanilla engine behavior — grey-zone timer, engine-cut or kick per vanilla rules.

### Aircraft scenarios
6. **Fly heli/jet out of GroundCombatVolume, across AirCombatVolume:** no grey-zone timer, no engine cut, no custom kick. Aircraft freely operate across ~3800×2800 polygon with 5000-unit vertical ceiling.
7. **Fly aircraft to AirCombatVolume outer edge:** expected vanilla engine grey-zone fires (aircraft exempt from Surrounding Area, but AirCombatVolume IS the SurroundingVolume — crossing out of it puts them fully OOB and engine kicks).

### Base-trigger sanity (resolves spatial prerequisite #3)
8. **Enter own main base from the field:** `State.players.inMainBaseByPid` flips true, ready-up UI refreshes. If this fails, the `Area: null` in the JSON export is broken and user re-authors.
9. **Exit own main base during live:** `inMainBaseByPid` flips false. No kill countdown (own base has no live-kill).

### Regression checks
10. **Match end + victory dialog:** no stray boundary HUD elements, no stuck alarm. `clearActiveBoundaryViolationsForAllPlayers` still clears both retained kinds.
11. **Redeploy after boundary kill:** respawn in main base, boundary state is reset.
12. **Admin panel end-match:** boundary UI tears down cleanly.

### Bundle health
13. **`npm run build` passes**, bundle size below 1,048,576 byte cap, report direction vs v1.350 (expected: **down** — net deletion).
14. **`npx tsc --pretty false --noEmit`** exits clean.

---

## Historical archive

This file is the frozen archive of the approved plan. Parent plan file in `~/.claude/plans/sleepy-juggling-thunder.md`. Sibling archives: `ground_vehicle_surrounding_area_plan_2026-04-23.md`, `supply_box_launcher_fixes_plan_2026-04-22.md`. Never edited after creation.

---

## Out of scope

- Per-map config for the decoupled trigger 666 (it's gone from all maps until reused).
- Replacing custom main-base/enemy-buffer HUD with vanilla engine equivalents (custom UX is intentional).
- Other maps' spatials — Conquest14 is Firestorm only; other maps must be re-authored separately before this pattern propagates.
- Cleaning orphan `twl.boundary.groundCombatZoneTitle*` strings (deferred; requires string-edit approval per AGENTS.md §75).
- Adjusting aircraft ceiling (`aircraftCeiling: 130` map-default) — that system is orthogonal to boundary.
