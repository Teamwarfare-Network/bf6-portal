# Plan: Replace ground-vehicle GCZ enforcement with SDK Surrounding Area API

**Created:** 2026-04-23
**Supersedes:** prior Supply Box launcher plan (shipped through v1.344, no open items).

---

## Context

The new SDK (`reference_sdk_1.2.3`) ships three functions for vehicle-aware boundary control, all keyed off the engine's "Surrounding Area" (the map-authored vanilla combat area):

- `mod.SetAllVehiclesAllowedInSurroundingArea(allowed: boolean)`
- `mod.SetVehicleAllowedInSurroundingArea(vehicle: VehicleList, allowed: boolean)`
- `mod.SetVehicleCategoryAllowedInSurroundingArea(category: VehicleCategories, allowed: boolean)`

`VehicleCategories` splits usefully: `Ground_All`, `Ground_Combat`, `Ground_Transport`, `Air_All`, `Air_Heli`, `Air_Plane`, `Naval_All`. Today our GCZ enforcement is 100% script-driven: `boundary/enforcement.ts` polls `State.round.boundary.inGroundCombatZoneByPid[pid]` every tick and drives warning → alarm → kill for anyone outside the custom trigger polygon. Aircraft are already exempt (`isPlayerGroundCombatZoneExempt` in `boundary/enforcement.ts:109-115`).

**What changes:** we adopt the SDK engine-cutout for **ground vehicles only** and exempt them from our script GCZ. Foot players, aircraft, and naval remain untouched.

**Geographic caveat (accept before we ship):** the SDK's Surrounding Area is the **vanilla map combat area**, which is almost certainly a different (larger) polygon than our custom `GroundCombatZone` trigger. Consequence: after this change, a tank can drive further than a foot player before hitting a boundary. If that asymmetry is unwanted, this plan is wrong — revert to "augment" instead of "replace".

### Godot-authored Surrounding Area — what it is and where it lives

The **Surrounding Area is not defined in our TypeScript code.** It is authored in the BF6 Portal map editor (Godot-based) as part of the map's spatial definition, and the game engine uses it for the vanilla "Leaving Combat Area" behavior (the classic grey-zone timer).

Consequences for this plan:
- We cannot change the SA polygon from code — we only *interact* with it via the three `*AllowedInSurroundingArea` calls.
- The SA for Operation_Firestorm is whatever the map author baked in. Our custom `GroundCombatZone` trigger (objId `666`, floor y=100, height=100) is a separately-authored AreaTrigger polygon used only by our script, unrelated to the engine's SA.
- When a ground vehicle crosses the SA boundary with `Ground_All` barred, the engine will:
  1. Cut engine thrust (vehicle becomes uncontrollable),
  2. Apply vanilla abandonment rules per `SetVehicleSpawnerAbandonVehiclesOutOfCombatArea` (already enabled in `vehicles/vanilla-spawner.ts`),
  3. Not fire any UI or script event we'd need to handle — behavior is entirely vanilla.
- No UI surface is required for vehicle SA enforcement; the vanilla engine already renders its own grey-zone timer widget when a player is outside SA. This is an acceptable replacement for our custom warning because the user has opted out of custom enforcement for vehicles.

What this plan ASSUMES about the Godot-authored SA (verify during playtest, not in code):
- The SA on Operation_Firestorm is larger than our GCZ polygon (standard BF map convention).
- The SA fully contains the main-base polygons for both teams (otherwise tanks would be engine-cut while in their own base, which would be broken).
- The SA extends to the map ceiling along Y (SA is 2D in practice; the engine clips on the XZ polygon only for vehicles).

If any of these assumptions are violated on a new map, the mitigation is: flip `groundAllBarred` to `false` for that map (we add a `MapConfig` override at that point — out of scope for this plan).

---

## Scope

Three source files + one new config field:

1. `src/boundary/enforcement.ts` — extend `isPlayerGroundCombatZoneExempt` to exempt anyone seated in a ground vehicle (in addition to the existing aircraft exemption). Foot-player path unchanged.
2. `src/config/map-runtime.ts` (or a new one-line init in game-mode start) — call `SetVehicleCategoryAllowedInSurroundingArea(Ground_All, false)` once per round start.
3. `src/index/game-mode.ts:23-28` — hook point where we trigger the SDK call after `applyMapConfig()` runs. The call is global and idempotent; running it once per round-start is fine.

No new string keys, no UI changes, no state-shape changes. `ACTIVE_BOUNDARY_CONFIG` gains one optional field for future override flexibility but default is hardcoded.

---

## Specific changes

### Change A — Add boundary-policy config field

**File:** `src/foundation/gameplay.ts` (or wherever `ACTIVE_BOUNDARY_CONFIG` lives — verify at read-time; Explore report referenced `boundary config assembled at map-runtime.ts:637-638`).

Add:
```ts
type VehicleSurroundingAreaPolicy = {
    groundAllBarred: boolean; // Default true: calls SetVehicleCategoryAllowedInSurroundingArea(Ground_All, false) on round start.
};
```

Default value: `{ groundAllBarred: true }`. Single-source global; if a map wants to opt out later, we add the `MapConfig` override then.

### Change B — Apply SDK setter at round start

**File:** `src/index/game-mode.ts` (inside `onGameModeStartedImpl` after `applyMapConfig()` returns).

```ts
if (boundaryPolicy.groundAllBarred) {
    try {
        mod.SetVehicleCategoryAllowedInSurroundingArea(mod.VehicleCategories.Ground_All, false);
    } catch {}
}
```

Belt-and-braces `try/catch` because this is a new-SDK call; keep it silent on failure so unmapped runtimes don't crash.

We do **not** touch `Air_Heli`, `Air_Plane`, or `Naval_All` — engine defaults apply.

### Change C — Exempt ground-vehicle occupants from script GCZ

**File:** `src/boundary/enforcement.ts:109-115` (`isPlayerGroundCombatZoneExempt`).

Current:
```ts
function isPlayerGroundCombatZoneExempt(player: mod.Player, pid: number): boolean {
    if (isPlayerProtectedByOwnMainBaseState(pid)) return true;
    const seatedVehicle = safeGetVehicleFromPlayer(player);
    if (seatedVehicle && isAircraftVehicleInstance(seatedVehicle)) return true;
    return false;
}
```

New: exempt anyone in ANY vehicle (the SDK now handles ground-vehicle enforcement; aircraft were already exempt; naval is de-facto exempt because no naval spawns):
```ts
function isPlayerGroundCombatZoneExempt(player: mod.Player, pid: number): boolean {
    if (isPlayerProtectedByOwnMainBaseState(pid)) return true;
    const seatedVehicle = safeGetVehicleFromPlayer(player);
    if (seatedVehicle) return true;
    return false;
}
```

This drops the `isAircraftVehicleInstance` import usage from this file (keep the helper — it's still used elsewhere like `recheckBoundaryAfterAircraftExit`).

### Change D — Post-bailout ceiling check stays

**File:** `src/index/vehicle-events.ts:34-45` (`recheckBoundaryAfterAircraftExit`).

No change. This exists specifically for a foot player who bails from a heli above the GCZ ceiling — they need to be re-evaluated on landing. Since foot players still use the custom polygon, this logic is still correct.

---

## What this plan does NOT change

- Foot-player GCZ polling, warning UI, alarm, kill timer — all unchanged.
- Aircraft exemption — semantically unchanged (was specific via `isAircraftVehicleInstance`, now subsumed into the broader "any vehicle" rule).
- `groundCombatZoneCeilingY` behavior — still used by `recheckBoundaryAfterAircraftExit` for foot players.
- Vehicle abandonment/cleanup — `vehicles/vanilla-spawner.ts` already calls `SetVehicleSpawnerAbandonVehiclesOutOfCombatArea`; no change here.
- Main-base buffer enforcement — untouched.
- No per-map config; this is a global flag.

---

## Critical files

- `bf6-portal/dev/conquest/src/index/game-mode.ts:23-28` — insertion point for the SDK call
- `bf6-portal/dev/conquest/src/boundary/enforcement.ts:109-115` — `isPlayerGroundCombatZoneExempt` simplification
- `bf6-portal/dev/conquest/src/foundation/gameplay.ts` — add `VehicleSurroundingAreaPolicy` (path to verify at read-time against actual ACTIVE_BOUNDARY_CONFIG location)
- `bf6-portal/dev/conquest/design_doc/conquest_issues.md` — post-test note under boundary-enforcement section
- `bf6-portal/dev/conquest/design_doc/TWL_Conquest_Design.md` — update the GCZ section to reflect the split (foot: script, vehicles: SDK)

## Reference (read-only, no edits)

- `reference_sdk_1.2.3/code/types/mod/index.d.ts:27487-27499` — new vehicle-surrounding-area functions
- `reference_sdk_1.2.3/code/types/mod/index.d.ts:25548-25556` — `VehicleCategories` enum
- `src/boundary/enforcement.ts:135-142` — `getDesiredBoundaryViolationKind`
- `src/vehicles/vehicle-classification.ts:48-62` — `isAircraftVehicleInstance`
- `src/vehicles/vanilla-spawner.ts` — existing abandonment-cleanup calls (unchanged)

---

## Historical archive

Copy this plan file to `bf6-portal/dev/conquest/design_doc/ground_vehicle_surrounding_area_plan_2026-04-23.md` as a frozen historical reference before any code changes are applied. That file lives next to the prior plan archives (e.g. `supply_box_launcher_fixes_plan_2026-04-22.md`) and is never edited after creation — it captures the plan as approved.

---

## Verification

1. **Build clean:** `npm run bumpVersion -- -c "Replace ground-vehicle GCZ with SDK Surrounding Area"`. TS compile + bundle-size budget.
2. **Manual scenarios on Operation Firestorm:**
   - **Ground vehicle barred at vanilla boundary:** Spawn a tank, drive toward the map edge. Verify engine cuts out at the vanilla combat-area boundary (SDK behavior). Verify **no** script warning countdown fires while you're in the tank — UI should stay silent.
   - **Tank crosses custom GCZ polygon:** Drive the tank outside our custom GCZ polygon but still inside the vanilla combat area. Verify **no** kill timer, no warning — the script now exempts you because you're in a vehicle. This is the expected asymmetry.
   - **Foot player crosses custom GCZ polygon:** Get out of the tank outside the GCZ. Verify warning UI appears, 10-second kill timer, alarm — existing behavior preserved.
   - **Bail from aircraft above GCZ ceiling:** Fly a heli over the GCZ ceiling, bail out. Verify `recheckBoundaryAfterAircraftExit` still fires on landing and the warning kicks in.
   - **Aircraft freedom:** Fly a heli/jet anywhere, including into the Surrounding Area. Verify no engine cut (we did not bar Air_All) and no script kill (still exempt in vehicle).
3. **Post-test doc updates:** log the GCZ-vs-vanilla asymmetry explicitly in `TWL_Conquest_Design.md`; add a line to `conquest_issues.md` under boundary enforcement with the shipping version.

---

## Out of scope

- Per-map override (add a `vehicleSurroundingAreaPolicy?` field to `MapConfig` later if a map wants different behavior).
- Barring helicopters or jets from Surrounding Area — user did not select these.
- Replacing foot-player GCZ enforcement (SDK has no equivalent; would require engine changes).
- Using `SetMaxVehicleHeightLimitScale` to replace our custom aircraft ceiling — different API, different scope; can be its own follow-up plan.
- Per-vehicle overrides via `SetVehicleAllowedInSurroundingArea` (not needed when the category-level call covers everything).
