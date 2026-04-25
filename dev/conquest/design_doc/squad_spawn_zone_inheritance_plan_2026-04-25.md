# Plan: v1.370 — Squad Spawn Zone Inheritance

**Created:** 2026-04-25
**Builds on:** v1.369 event-driven seat state ([archive](./event_driven_seat_state_plan_2026-04-25.md)).
**Target version:** v1.370

---

## Context

v1.369 introduced event-driven `seatKind` and fixed aircraft OOB false-positives. Squad spawn handling was explicitly deferred. The remaining gap:

A foot player squad-spawning deep inside the GCZ (or own buffer, etc.) currently goes through the no-slot branch in `seedZoneStateFromSpawnContext` and ends up with `seatKind = "on_foot"` (correct) but **all-false zone flags**. The HQ anchor probe sets `inOwnHQ` correctly. The other four flags (`inOwnBuffer`, `inGCZ`, `inEnemyHQ`, `inEnemyBuffer`) stay false.

The engine does NOT fire trigger enter events on spawn-inside-trigger, only on physical boundary crossings. So if the squad-spawned player lands inside trigger 666 and doesn't immediately walk anywhere, after the 1.5s grace window the classifier sees `inGCZ = false`, on-foot, no own-HQ → returns `"ground_combat_zone"` → false-positive OOB.

**Same vehicle-pax-seat squad spawn:** seatKind handled by the v1.369 IsInVehicle probe. But zone flags still missing.

**Intended outcome:** at deploy time, find the nearest deployed teammate within a small radius (the squadmate proxy — no documented SDK API gives us authoritative squad-spawn target). Inherit their zone flags. The new player's zone state matches the squadmate's, which matches reality almost always (spawn lands within meters of the squadmate, well inside the same trigger polygons in the typical case).

---

## Design

### Constants

```typescript
const SQUAD_SPAWN_PROXIMITY_RADIUS_METERS = 25;
```

Squad spawns realistically land within 5-10m of the squadmate; 25m is a generous search buffer that covers normal spawn-position jitter.

### Seed flow (extends v1.369)

```typescript
function seedZoneStateFromSpawnContext(player, pid, state): void {
    const claimSlot = findSlotForHqClaim(pid);
    if (claimSlot && claimSlot.pendingSpawnMode !== undefined) {
        // Slot-driven deploy: HQ Deploy / Forward Deploy / Air Deploy. Same as v1.369.
        // ...
        return;
    }
    // No slot -- standard on-foot HQ deploy OR squad/flag spawn.
    state.seatKind = probeSeatKindFromEngineState(player);
    tryInheritZonesFromNearbyTeammate(player, pid, state);
    // inOwnHQ is always owned by the anchor probe (independent reliable signal -- not inherited).
    // Inheriting from a teammate could disagree with the actual HQ trigger membership when the
    // squadmate is just outside HQ but the new player landed just inside (or vice versa).
    state.inOwnHQ = isPlayerWithinOwnMainBaseAnchorRadius(player);
}
```

### Helpers

```typescript
// Scans deployed players on the same team and returns the closest one within the squad-spawn
// proximity radius, or undefined if none. Linear in active player count -- one-shot per deploy,
// no per-tick cost.
function findNearestDeployedTeammatePid(
    player: mod.Player,
    selfPid: number,
    teamId: TeamID,
    selfPos: mod.Vector,
): number | undefined {
    let nearestPid: number | undefined;
    let nearestDist = SQUAD_SPAWN_PROXIMITY_RADIUS_METERS;
    forEachValidPlayer((other, otherPid) => {
        if (otherPid === selfPid) return;
        if (!isPlayerDeployed(other)) return;
        if (safeGetTeamNumberFromPlayer(other, 0) !== teamId) return;
        const otherPos = safeGetSoldierStateVector(other, mod.SoldierStateVector.GetPosition);
        if (!otherPos) return;
        const dist = mod.DistanceBetween(selfPos, otherPos);
        if (dist <= nearestDist) {
            nearestDist = dist;
            nearestPid = otherPid;
        }
    });
    return nearestPid;
}

// Inherits the four non-HQ zone flags from the nearest deployed teammate. Skips if the teammate
// is still in their own deploy grace window (their state may be unsettled). Returns true if any
// inheritance happened, false otherwise (caller continues with default-false zone flags).
function tryInheritZonesFromNearbyTeammate(
    player: mod.Player,
    pid: number,
    state: PlayerZoneState,
): boolean {
    const teamId = safeGetTeamNumberFromPlayer(player, 0);
    if (teamId !== TeamID.Team1 && teamId !== TeamID.Team2) return false;
    const selfPos = safeGetSoldierStateVector(player, mod.SoldierStateVector.GetPosition);
    if (!selfPos) return false;
    const teammatePid = findNearestDeployedTeammatePid(player, pid, teamId as TeamID, selfPos);
    if (teammatePid === undefined) return false;
    const teammateState = State.round.boundary.zoneStateByPid[teammatePid];
    if (!teammateState) return false;
    const teammateDeployedAt = State.players.deployedAtSecondsByPid[teammatePid];
    if (teammateDeployedAt !== undefined
        && (mod.GetMatchTimeElapsed() - teammateDeployedAt) < GCZ_DEPLOY_GRACE_SECONDS) {
        return false;
    }
    state.inOwnBuffer = teammateState.inOwnBuffer;
    state.inGCZ = teammateState.inGCZ;
    state.inEnemyHQ = teammateState.inEnemyHQ;
    state.inEnemyBuffer = teammateState.inEnemyBuffer;
    return true;
}
```

### Why `inOwnHQ` is NOT inherited

The HQ trigger polygon and the 100m HQ anchor radius are different shapes. They mostly agree but not perfectly. Inheriting `inOwnHQ` from a teammate could conflict with what the anchor probe says about the new player. To avoid that conflict:

- `inOwnHQ` is set ONLY by the anchor probe (`isPlayerWithinOwnMainBaseAnchorRadius`).
- Other zones (`inOwnBuffer`, `inGCZ`, `inEnemyHQ`, `inEnemyBuffer`) are inherited from the teammate, since we have no anchor-distance proxy for them.

The trigger event system corrects any post-deploy drift via the AreaTrigger enable/exit pipeline (already enabled in v1.367).

---

## Critical files

| File | Edit |
|------|------|
| [src/boundary/enforcement.ts](bf6-portal/dev/conquest/src/boundary/enforcement.ts) | Add `SQUAD_SPAWN_PROXIMITY_RADIUS_METERS` constant, `findNearestDeployedTeammatePid`, `tryInheritZonesFromNearbyTeammate`. Modify `seedZoneStateFromSpawnContext` no-slot branch to call `tryInheritZonesFromNearbyTeammate` before the anchor probe. |

No other files change.

## Reuse

- [`forEachValidPlayer`](bf6-portal/dev/conquest/src/state/player-iteration.ts) — existing helper, signature `(player, pid) => void`.
- [`isPlayerDeployed`](bf6-portal/dev/conquest/src/state/id-helpers.ts) — existing.
- [`safeGetTeamNumberFromPlayer`](bf6-portal/dev/conquest/src/state/id-helpers.ts) — existing.
- [`safeGetSoldierStateVector`](bf6-portal/dev/conquest/src/state/id-helpers.ts) — existing, used in classifier.
- `mod.DistanceBetween` — same call shape as `isPlayerWithinOwnMainBaseAnchorRadius`.
- `GCZ_DEPLOY_GRACE_SECONDS` — existing constant in enforcement.ts.

## Out of scope (accepted edge cases — do NOT solve in v1.370)

- **Squadmate near a trigger boundary** producing inheritance mismatch with the new player's actual polygon membership. Rare in practice (trigger polygons are 100s of meters wide; spawn within 25m of squadmate is almost always in the same polygon). Physical movement after deploy corrects via trigger enter/exit events.
- **Inheriting an OOB squadmate's `inEnemyBuffer = true`**. New player gets routed through the enemy-buffer kill timer. Probably the right behavior — squad-spawning into a teammate's death trap should kill you too.
- **No nearby teammate found within 25m**. Fall through to anchor probe + all-false zones. Same behavior as v1.369. Rare (squad spawn implies a teammate is nearby by definition; if none found, this isn't actually a squad spawn).
- **Squadmate's cached state is itself stale.** Inheritance propagates the staleness. Acceptable; corrected by next physical crossing.

---

## Verification

### Squad spawn (the bugs this fixes)

1. **Foot squad spawn inside GCZ** → no slot, IsInVehicle=false → seatKind=on_foot. Nearest teammate within 25m is inside GCZ (state.inGCZ=true). Inherit inGCZ=true. Anchor probe sets inOwnHQ=false. Classifier post-grace: inGCZ=true → safe ground → no OOB. ✓
2. **Foot squad spawn inside own buffer** → inherit inOwnBuffer=true → no OOB.
3. **Pax-seat squad spawn into a tank** → IsInVehicle=true, classifyVehicleSeatKind=ground_vehicle. Nearest teammate is the driver (inside GCZ); inherit zones. Classifier: not in HQ, in safe ground (inGCZ=true) → no OOB.
4. **Pax-seat squad spawn into a heli** → seatKind=aircraft → classifier exempts regardless of zone state. ✓ (Inheritance still happens but is moot.)

### Regression checks

5. **Standard HQ deploy with teammate nearby (typical pre-live state)** → No slot. IsInVehicle=false. Nearest teammate is at HQ (inOwnHQ=true, others false). Inherit zones (all false except possibly inOwnHQ which we DO NOT inherit). Anchor probe sets inOwnHQ=true. Ready-up works.
6. **HQ deploy alone (no teammates)** → `findNearestDeployedTeammatePid` returns undefined. Fall through to anchor probe. inOwnHQ=true via anchor. Same as v1.369. ✓
7. **Forward Deploy** (slot-driven) → slot path runs, no teammate inheritance. Same as v1.369. ✓
8. **Air Deploy** (slot-driven) → slot path runs, seatKind=aircraft. Same as v1.369. ✓
9. **Walk-into-chopper from HQ** → not a deploy event, doesn't go through seedZoneStateFromSpawnContext. Still handled by setPlayerSeatKind on OnPlayerEnterVehicle. ✓
10. **HQ-back-walk on foot** → trigger 500 exit fires → state.inOwnHQ=false → classifier returns "prelive_main_base" or "ground_combat_zone". No change from v1.369. ✓

### Build health

- `npm run bumpVersion -- -c "Squad spawn zone inheritance: at deploy, copy inOwnBuffer/inGCZ/inEnemyHQ/inEnemyBuffer from nearest deployed teammate within 25m; inOwnHQ stays anchor-probe-driven; one-shot at deploy, no per-tick cost"`
- `npm run build` PASS, bundle below 1,048,576 bytes.
- `cmd /c npx tsc --pretty false --noEmit` exit 0.

### Design doc updates (post-implementation)

- [`design_doc/conquest_issues.md`](bf6-portal/dev/conquest/design_doc/conquest_issues.md) — add `CQ_Feat_Squad_Spawn_Zone_Inheritance` entry alongside `CQ_Feat_Event_Driven_Seat_State`. Note that this completes the v1.358 -> v1.370 boundary state architecture: zone state is event-driven; seat state is event-driven; squad spawn closes the only remaining seed gap.
