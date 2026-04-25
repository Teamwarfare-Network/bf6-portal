# Plan: v1.369 — Event-driven seat state (kill engine-state queries in boundary classifier)

**Created:** 2026-04-25
**Supersedes:** v1.360 zone tracker plan (complete, archived). This is a NEW task that extends the same single-source-of-truth pattern from zone state to seat state.
**Target version:** v1.369
**Archive after exit:** copy this file to [`bf6-portal/dev/conquest/design_doc/event_driven_seat_state_plan_2026-04-25.md`](bf6-portal/dev/conquest/design_doc/event_driven_seat_state_plan_2026-04-25.md) BEFORE running any implementation edits.

---

## Context

v1.360 fixed boundary zone tracking (HQ/buffer/GCZ). v1.367 enabled the AreaTriggers. Those work — user confirmed ground combat zone + HQ + buffer all detect correctly on foot.

**The remaining bug:** aircraft occupants get OOB-flagged outside the GCZ. v1.368 attempted a fix by bypassing `safeGetVehicleFromPlayer`'s cache gate and adding a slot-binding fallback for `isAircraftVehicleInstance`. **It did not work.** Aircraft still get flagged.

**Root cause is structural, same as the zone-tracker problem:** the boundary classifier queries engine state every tick (`mod.GetVehicleFromPlayer`, `mod.CompareVehicleName`, `safeGetPlayerVehicleSeat`). Each of those has documented reliability gaps on this Portal runtime:

- `safeGetVehicleFromPlayer` is gated on a `posDebugVehicleObjIdByPid` cache that lags reality at deploy time (Air Deploy timing race).
- `mod.CompareVehicleName` returns false for vehicles where the engine swapped the enum mid-spawn (CQ_Bug_43 documented Cheetah/Gepard; aircraft enums likely exhibit the same pattern).
- `safeGetPlayerVehicleSeat` has its own race conditions on freshly-deployed players.

The user is right: we don't need to query any of this at classifier-read time. The script ALREADY KNOWS the answer at the moments where seat state changes:

- **`OnPlayerEnterVehicle(player, vehicle)`** — we have the vehicle, we know they're seated.
- **`OnPlayerExitVehicle(player, vehicle)`** — we know they're now on foot.
- **`OnPlayerDeployed`** — we know the spawn mode (HQ Deploy / Forward Deploy / Air Deploy / standard) via `slot.pendingSpawnMode` + `slot.vehicleType`.
- **`OnPlayerUndeploy`** — we know they're no longer in the world.

**Intended outcome:** Cache seat state at these events. Classifier becomes a pure read of `state.seatKind`. No engine queries from the classifier. Same architectural pattern that fixed zone tracking in v1.360.

---

## Design

### Single source of truth

Add to `PlayerZoneState` (boundary state record per pid):

```typescript
type SeatKind = "on_foot" | "ground_vehicle" | "aircraft";

type PlayerZoneState = {
    inOwnHQ: boolean;
    inOwnBuffer: boolean;
    inGCZ: boolean;
    inEnemyHQ: boolean;
    inEnemyBuffer: boolean;
    seatKind: SeatKind;
};
```

Default for fresh records: `seatKind: "on_foot"`.

### Classification helper (called at write time, never at read time)

```typescript
// Pure-JS classification using slot.vehicleType (mod.VehicleList enum). Bypasses
// mod.CompareVehicleName entirely. Falls back to "ground_vehicle" for unbound vehicles
// (shouldn't occur in this mode -- all vehicles spawn from slots -- but safe default).
function classifyVehicleSeatKind(vehicle: mod.Vehicle): "ground_vehicle" | "aircraft" {
    const objId = safeGetObjId(vehicle);
    if (objId === undefined) return "ground_vehicle";
    const slotIndex = State.vehicles.vehicleToSlot[objId];
    if (slotIndex === undefined) return "ground_vehicle";
    const slot = State.vehicles.slots[slotIndex];
    if (!slot) return "ground_vehicle";
    return isAircraftVehicleType(slot.vehicleType) ? "aircraft" : "ground_vehicle";
}
```

Reuses existing `isAircraftVehicleType(vehicleType: mod.VehicleList): boolean` at [src/vehicles/vehicle-classification.ts:4](bf6-portal/dev/conquest/src/vehicles/vehicle-classification.ts#L4) — pure switch on the enum, no engine call.

### Single writer

```typescript
function setPlayerSeatKind(player: mod.Player, kind: SeatKind): void {
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return;
    const state = getOrInitZoneStateForPid(pid);
    if (state.seatKind === kind) return;
    state.seatKind = kind;
    refreshPlayerBoundaryState(player);
}
```

### One-shot deploy-time verification (no per-tick polling)

Andy's reference reads `mod.GetSoldierState(player, mod.SoldierStateBool.IsInVehicle)` directly as the on-foot/in-vehicle source of truth (lines 1117, 1154, 1182, 1232 of [`script-conversion (9).ts`](bf6-portal/dev/conquest/reference_implementations/reference_andys_conquest/script-conversion%20(9).ts)). Reliable, no cache.

We use it ONCE per deploy as a verification belt-and-braces — never on a per-tick loop (per-tick polling for every player every second is unacceptable cost given the rest of the live tick budget). Fold this into `seedZoneStateFromSpawnContext` as a final check after the slot-mode branch:

```typescript
function seedZoneStateFromSpawnContext(player, pid, state): void {
    const claimSlot = findSlotForHqClaim(pid);
    if (claimSlot && claimSlot.pendingSpawnMode !== undefined) {
        state.seatKind = isAircraftVehicleType(claimSlot.vehicleType) ? "aircraft" : "ground_vehicle";
        // ... existing zone seed (inOwnHQ for "ground", inGCZ+inOwnBuffer for "forward", etc.)
        return;
    }
    // No slot -- standard on-foot deploy OR squad/flag spawn (no script-driven slot claim).
    // One-shot soldier-state probe so squad/flag spawns that land in a vehicle still classify.
    let inVehicleAtDeploy = false;
    try { inVehicleAtDeploy = !!mod.GetSoldierState(player, mod.SoldierStateBool.IsInVehicle); } catch {}
    if (inVehicleAtDeploy) {
        let vehicle: mod.Vehicle | undefined;
        try { vehicle = mod.GetVehicleFromPlayer(player); } catch {}
        state.seatKind = vehicle ? classifyVehicleSeatKind(vehicle) : "ground_vehicle";
    } else {
        state.seatKind = "on_foot";
    }
    state.inOwnHQ = isPlayerWithinOwnMainBaseAnchorRadius(player);
}
```

Cost: one extra engine boolean read per deploy event. Zero ongoing cost.

Drift after this point is owned by the `OnPlayerEnterVehicle` / `OnPlayerExitVehicle` events. If those events ever miss in production, we'll see a recurring symptom and can add targeted handling — not pre-pay with a polled loop.

### Write call sites

1. **`onPlayerEnterVehicleImpl`** ([src/index/vehicle-events.ts:6](bf6-portal/dev/conquest/src/index/vehicle-events.ts#L6)) — call `setPlayerSeatKind(eventPlayer, classifyVehicleSeatKind(eventVehicle))`. Place it BEFORE the existing `teamNum !== TeamID.Team1 && teamNum !== TeamID.Team2` early return so spectators/no-team players still get classified. The existing tail `refreshPlayerBoundaryState(eventPlayer)` becomes redundant when the seatKind transition fires (which already calls refresh) — leave it for the no-transition case.

2. **`onPlayerExitVehicleImpl`** ([src/index/vehicle-events.ts:39](bf6-portal/dev/conquest/src/index/vehicle-events.ts#L39)) — call `setPlayerSeatKind(eventPlayer, "on_foot")`. Same placement note.

3. **`seedZoneStateFromSpawnContext`** ([src/boundary/enforcement.ts](bf6-portal/dev/conquest/src/boundary/enforcement.ts)) — extend to set `state.seatKind` based on the claim slot:
   - claim slot exists, `isAircraftVehicleType(claimSlot.vehicleType) === true` → `seatKind = "aircraft"`
   - claim slot exists, vehicleType is non-aircraft → `seatKind = "ground_vehicle"`
   - no claim slot (standard on-foot deploy) → `seatKind = "on_foot"`

4. **`resetPlayerBoundaryStateOnUndeployOrReset`** — already deletes the zone state record, so seatKind goes with it. No change needed.

### Classifier becomes a pure read

Replace the entire vehicle-detection block in `getDesiredBoundaryViolationKind` ([src/boundary/enforcement.ts](bf6-portal/dev/conquest/src/boundary/enforcement.ts)):

**Delete:** the call to `isPlayerSeatedInAircraftForBoundary(player)` and `safeGetPlayerVehicleSeat(player, -1)` — both engine queries.

**Replace with:**
```typescript
if (state.seatKind === "aircraft") return undefined;

const inSafeGround = state.inGCZ || state.inOwnBuffer;
if (!inSafeGround) return "ground_combat_zone";

if (state.seatKind === "on_foot") {
    try {
        const pos = safeGetSoldierStateVector(player, mod.SoldierStateVector.GetPosition);
        if (pos && mod.YComponentOf(pos) > AIRCRAFT_BAIL_CEILING_Y) {
            return "ground_combat_zone";
        }
    } catch {}
}
```

`safeGetSoldierStateVector` for the Y-ceiling check is the only remaining engine read in the classifier, and it only fires for foot players — necessary since we don't have a polled Y from event state.

### Delete dead code

- `isPlayerSeatedInAircraftForBoundary` (added v1.368) — no longer needed.
- The slot-binding fallback inside it — now the primary classification, lifted into `classifyVehicleSeatKind`.

---

## Critical files

| File | Edit |
|------|------|
| [src/state/runtime-types.ts](bf6-portal/dev/conquest/src/state/runtime-types.ts) | Add `SeatKind` type alias and `seatKind: SeatKind` field to `PlayerZoneState`. |
| [src/boundary/enforcement.ts](bf6-portal/dev/conquest/src/boundary/enforcement.ts) | Update `getOrInitZoneStateForPid` default to include `seatKind: "on_foot"`. Add `classifyVehicleSeatKind`, `setPlayerSeatKind`. Extend `seedZoneStateFromSpawnContext` to set seatKind (with one-shot `IsInVehicle` probe for non-slot deploys). Rewrite the vehicle block in `getDesiredBoundaryViolationKind` as a pure read of `state.seatKind`. Delete `isPlayerSeatedInAircraftForBoundary`. |
| [src/index/vehicle-events.ts](bf6-portal/dev/conquest/src/index/vehicle-events.ts) | Add `setPlayerSeatKind` calls at the top of `onPlayerEnterVehicleImpl` (with `classifyVehicleSeatKind`) and `onPlayerExitVehicleImpl` (with `"on_foot"`). |

No edits to `src/state/runtime-state.ts` (records lazy-init), `src/index/player-deploy.ts` (already calls `seedZoneStateFromSpawnContext`), or `src/vehicles/vehicle-classification.ts` (`isAircraftVehicleType` is reused unchanged).

## Reuse (no new abstractions)

- [`isAircraftVehicleType(vehicleType: mod.VehicleList): boolean`](bf6-portal/dev/conquest/src/vehicles/vehicle-classification.ts#L4) — authoritative aircraft check on the enum. Pure switch, no engine call.
- [`State.vehicles.vehicleToSlot[objId]`](bf6-portal/dev/conquest/src/state/runtime-types.ts) — vehicle→slot lookup.
- [`slot.vehicleType: mod.VehicleList`](bf6-portal/dev/conquest/src/state/runtime-types.ts) — set at slot configure time.
- [`findSlotForHqClaim(pid)`](bf6-portal/dev/conquest/src/vehicles/hq-deploy.ts#L122) — already used by `seedZoneStateFromSpawnContext`.
- [`getOrInitZoneStateForPid`](bf6-portal/dev/conquest/src/boundary/enforcement.ts) — existing.
- [`refreshPlayerBoundaryState`](bf6-portal/dev/conquest/src/boundary/enforcement.ts) — existing.
- `mod.GetSoldierState(player, mod.SoldierStateBool.IsInVehicle)` — engine boolean used by Andy's reference for reliable on-foot/in-vehicle detection. Adopted for the reconciliation check.

## Reference cross-check (Andy's conquest)

Investigated [`reference_implementations/reference_andys_conquest/script-conversion (9).ts`](bf6-portal/dev/conquest/reference_implementations/reference_andys_conquest/script-conversion%20(9).ts):

- **"New method" (script triggers + per-player flag):** Andy uses ObjectVariable `OutOfBoundsPlayerVar` per player, set true on enter-trigger event, false on exit (and on death/respawn). `OutOfBounds(eventInfo)` runs the countdown loop. Mirrors our `activeViolationByPid` + `runBoundaryViolationEnforcementLoop`. ✓ aligned.
- **"Old method" (engine grey-zone for aircraft):** Andy calls `mod.SetVehicleCategoryAllowedInSurroundingArea(mod.VehicleCategories.Air_All, true)` once at game start (line 75). This permits aircraft in the engine `SurroundingArea` so they fly outside `CombatArea` without being grey-zoned, until they leave the SurroundingArea outer fence. We tried this exhaustively v1.345–v1.356 (global + per-category + per-vehicle permutations) and aircraft kept getting grey-zoned on our runtime, so v1.357 abandoned it (archive: [`design_doc/custom_gcz_restore_plan_2026-04-24.md`](bf6-portal/dev/conquest/design_doc/custom_gcz_restore_plan_2026-04-24.md)). Hypothesized cause: `mod.VehicleCategories` undefined in our SDK type package. **Not re-introducing in v1.369** — the script-side aircraft exemption (via cached seatKind) is the working path. If the user wants to retest the SDK call later as an additional safety net, that's a separate feature.
- **Verification pattern adopted:** Andy reads `mod.GetSoldierState(player, mod.SoldierStateBool.IsInVehicle)` directly to gate on-foot vs in-vehicle behavior (lines 1117, 1154, 1182, 1232). No cache, no enum compare. We use this in `reconcilePlayerSeatKind` to catch any drift between cached `seatKind` and engine reality.

## Out of scope

- `safeGetVehicleFromPlayer`'s cache gate at [src/state/id-helpers.ts:39](bf6-portal/dev/conquest/src/state/id-helpers.ts#L39) — boundary classifier no longer uses this function. Other callers can keep using it (mostly for HUD perf gating). Don't churn.
- `isAircraftVehicleInstance` at [src/vehicles/vehicle-classification.ts:48](bf6-portal/dev/conquest/src/vehicles/vehicle-classification.ts#L48) — still used by spawn-side validation paths. Leave alone.
- The `posDebugVehicleObjIdByPid` cache itself — used by position-debug HUD; orthogonal.

## Future considerations (deferred — do not block v1.369)

### Squad spawn

A player spawning on a squadmate doesn't go through the slot system (`findSlotForHqClaim` returns undefined), so the v1.369 seed falls through to the on-foot/IsInVehicle probe. That's the right answer for squad spawns that land on a foot squadmate, and the IsInVehicle probe also catches the case where the squadmate is in a vehicle (pax seat). However:

- **Zone seed for squad spawn is unknown.** A squad spawn lands the player wherever the squadmate is. The script doesn't know which trigger volume that is. Right now `seedZoneStateFromSpawnContext` only seeds `inOwnHQ` via the HQ anchor distance probe — squad-spawning into the GCZ or own buffer leaves `inGCZ`/`inOwnBuffer` false until the player physically crosses a trigger boundary.
- **Mitigation that already exists:** the 1.5s `GCZ_DEPLOY_GRACE_SECONDS` window suppresses violations during the settle period. If the squadmate is already inside a trigger volume, the engine fires `OnPlayerEnterAreaTrigger` for the spawning player at spawn-inside-trigger time on most runtimes — the user's testing of HQ-back-walk confirmed our triggers fire reliably once enabled, so this should mostly self-correct within the grace window.

**Ideas to track:**
1. **Anchor-radius probes for GCZ + buffers** — add `groundCombatZoneAnchor + radius` and `team{1,2}BufferAnchor + radius` to map config. At deploy time, do three more distance probes alongside the HQ probe. Imperfect (circular vs polygon) but fully script-side, no engine event dependency. Cheap.
2. **Defer squad spawn handling until proven broken** — if squad spawns work correctly via grace + trigger enter events, no extra code needed.
3. **Probe the squadmate's cached zone state at spawn time** — if we know the squadmate's pid, we can read `State.round.boundary.zoneStateByPid[squadPid]` and copy zone flags. Requires identifying the squadmate at spawn time; no documented API for that, so this is exploratory.
4. **Hook `OnPlayerSpawnedAtSquadMember`** if such an event exists in the SDK — would give us authoritative seed source. Needs SDK reference verification.

Option (1) is the most practical if a fix is needed. Option (2) is the default until evidence shows squad spawn breaks classification.

---

## Verification

### Aircraft scenarios (the bug class this plan fixes)

1. **Air Deploy** → `slot.pendingSpawnMode === "air"`, `slot.vehicleType` is heli/jet → seed sets `seatKind = "aircraft"` → fly anywhere inside `AirCombatVolume` → no OOB.
2. **HQ Deploy heli pad** → claim slot is aircraft type → seed `seatKind = "aircraft"` → take off → fly outside GCZ → no OOB.
3. **Walk-into-chopper from HQ on foot** → `OnPlayerEnterVehicle` fires → `setPlayerSeatKind("aircraft")` → fly outside GCZ → no OOB.
4. **On-foot OOB → enter chopper** → `OnPlayerEnterVehicle` → `setPlayerSeatKind("aircraft")` → `refreshPlayerBoundaryState` clears the active "ground_combat_zone" violation → no OOB.
5. **Aircraft pilot bails outside GCZ** → `OnPlayerExitVehicle` → `setPlayerSeatKind("on_foot")` → classifier returns `"ground_combat_zone"` → OOB fires within 1s.

### Ground vehicle / on-foot regressions

6. **HQ Deploy tank/transport** → claim slot is ground type → `seatKind = "ground_vehicle"` → drive outside GCZ → OOB fires.
7. **Forward Deploy** → claim slot is ground vehicle → `seatKind = "ground_vehicle"` → drive outside GCZ → OOB fires.
8. **HQ-back-walk on foot** → trigger 500 exit fires → `state.inOwnHQ = false` → classifier returns `"prelive_main_base"` (pre-live) or `"ground_combat_zone"` (live) → OOB fires.
9. **Foot bail above Y=200** → `seatKind === "on_foot"` → Y-ceiling check fires → OOB.

### Build health

- `npm run bumpVersion -- -c "Event-driven seat state: cache seatKind at OnPlayerEnter/ExitVehicle + spawn-mode seed; classifier reads pre-computed flag instead of querying mod.GetVehicleFromPlayer / mod.CompareVehicleName"`
- `npm run build` PASS, bundle below 1,048,576 bytes.
- `cmd /c npx tsc --pretty false --noEmit` exit 0.
- Bundle size expected to drop slightly: deletion of `isPlayerSeatedInAircraftForBoundary` (~25 lines) outweighs the added seatKind plumbing.

### Design doc updates (post-implementation)

- [`design_doc/conquest_issues.md`](bf6-portal/dev/conquest/design_doc/conquest_issues.md) — close the v1.367–v1.368 aircraft-OOB arc with a `CQ_Feat_Event_Driven_Seat_State` entry. Note that the underlying lesson matches `CQ_Feat_Zone_Tracker_Refactor` (v1.360): per-tick engine queries are unreliable on this Portal runtime; cache at events, read pure state.
