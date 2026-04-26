# Plan: Flip deploy-time boundary seed polarity to default-in-bounds (#98)

**Created:** 2026-04-25
**Issue:** [`#98 CQ_Bug_FlagSpawn_FalsePositive_OOB`](./conquest_issues.md)
**Predecessor / context:** `CQ_Feat_Zone_Tracker_Refactor` (v1.360), `CQ_Feat_AreaTrigger_Enable` (v1.367), `CQ_Feat_Squad_Spawn_Zone_Inheritance` (v1.370). This plan supersedes the v1.370 partial fix's "no-teammate" fallback policy.

---

## Context

The boundary system is event-driven via `OnPlayerEnter/ExitAreaTrigger`. The engine architecturally does not fire enter events on spawn-inside-trigger — it only fires on physical boundary crossings. The v1.358–v1.370 architecture work compensated for this with deploy-time seeding:

- **Slot-based deploys** (HQ / Forward / Air via the deploy menu) carry authoritative spawn-mode metadata on `slot.pendingSpawnMode` — seed is exact.
- **Standard on-foot HQ deploy** is caught by an HQ-anchor distance probe — sets `inOwnHQ = true`.
- **Squad spawn** is approximated via `tryInheritZonesFromNearbyTeammate(player, pid, state)` — copies non-HQ zone flags from the nearest deployed teammate within 25m if that teammate's state is past their own grace window.

**The flag-spawn case falls through all three branches** when a player is the first / only one on a flag. The grace window (1.5s) expires, the classifier sees `inSafeGround = inGCZ || inOwnBuffer = false`, and the player is incorrectly flagged as `ground_combat_zone` violation — kill timer starts, OOB warning paints, player dies in 10s if they don't move.

### Design-policy correction (per user 2026-04-25)

The current architecture's polarity is wrong. It assumes **"absence of zone-membership signal" = OOB**, which forces every spawn path to prove in-bounds. For paths the engine cannot deliver a signal for (spawn-inside-trigger), we'd need a position-containment query that the SDK does not expose.

The correct policy:

> **Default at deploy is in-bounds. Only flag OOB on spawn when we have definitive proof.**

The only path that can deliver definitive OOB-on-spawn proof is squad-spawn inheritance: if a teammate within 25m is in a settled OOB state (e.g., currently in the enemy buffer), the spawning player will land at the same place and inherits that OOB state. Every other "no signal" case — flag spawn, solo spawn, beacon spawn at unknown location — should default in-bounds because the engine's spawn-inside-trigger silence prevents us from learning otherwise.

---

## Files to modify

- [`src/boundary/enforcement.ts`](../src/boundary/enforcement.ts) — `seedZoneStateFromSpawnContext` (lines 436-461). One function modified; ~6-line change in the non-slot branch. No new state, no new SDK calls.

---

## Change set

### Single change to `seedZoneStateFromSpawnContext`

**Current code (lines 436-461):**

```ts
function seedZoneStateFromSpawnContext(player: mod.Player, pid: number, state: PlayerZoneState): void {
    const claimSlot = findSlotForHqClaim(pid);
    if (claimSlot && claimSlot.pendingSpawnMode !== undefined) {
        state.seatKind = isAircraftVehicleType(claimSlot.vehicleType) ? "aircraft" : "ground_vehicle";
        switch (claimSlot.pendingSpawnMode) {
            case "ground":  state.inOwnHQ = true;                         return;
            case "forward": state.inGCZ = true; state.inOwnBuffer = true; return;
            case "air":                                                   return;
        }
    }
    // No slot -- standard on-foot HQ deploy OR squad/flag spawn. seatKind via IsInVehicle probe.
    state.seatKind = probeSeatKindFromEngineState(player);
    tryInheritZonesFromNearbyTeammate(player, pid, state);
    state.inOwnHQ = isPlayerWithinOwnMainBaseAnchorRadius(player);
}
```

**New code:**

```ts
function seedZoneStateFromSpawnContext(player: mod.Player, pid: number, state: PlayerZoneState): void {
    const claimSlot = findSlotForHqClaim(pid);
    if (claimSlot && claimSlot.pendingSpawnMode !== undefined) {
        state.seatKind = isAircraftVehicleType(claimSlot.vehicleType) ? "aircraft" : "ground_vehicle";
        switch (claimSlot.pendingSpawnMode) {
            case "ground":  state.inOwnHQ = true;                         return;
            case "forward": state.inGCZ = true; state.inOwnBuffer = true; return;
            case "air":                                                   return;
        }
    }
    // No slot -- standard on-foot HQ deploy OR squad/flag spawn. seatKind via IsInVehicle probe.
    state.seatKind = probeSeatKindFromEngineState(player);
    state.inOwnHQ = isPlayerWithinOwnMainBaseAnchorRadius(player);
    if (state.inOwnHQ) return;  // already in-bounds via HQ; nothing else to seed.
    // Squad-spawn proxy: inherit zones from nearest deployed teammate within 25m. This is the
    // only path that can deliver definitive OOB-on-spawn proof -- e.g., spawning on a teammate
    // currently in the enemy buffer should inherit that OOB state. Returns false when no
    // teammate is in range or the teammate is still in their own deploy grace window.
    const inheritedFromTeammate = tryInheritZonesFromNearbyTeammate(player, pid, state);
    if (inheritedFromTeammate) return;
    // Default-in-bounds fallback: no slot, not at HQ, no teammate signal. The engine does NOT
    // fire OnPlayerEnterAreaTrigger on spawn-inside-trigger -- so flag-spawns and solo spawns
    // would otherwise leave all zones false and trip the GCZ classifier 1.5s after deploy.
    // Per design policy (2026-04-25): default at deploy is in-bounds; only flag OOB when we
    // have definitive proof (teammate inheritance above). Captured flags are by definition
    // inside safe ground, so seeding inGCZ=true is the safe assumption.
    state.inGCZ = true;
}
```

### What this changes

- **Slot-based deploys (HQ / Forward / Air):** unchanged. Force-seed remains authoritative.
- **Standard on-foot HQ deploy:** unchanged. Anchor probe sets `inOwnHQ = true` and the function returns early before reaching the new fallback.
- **Squad spawn onto a teammate in safe ground:** unchanged. Inheritance copies `inGCZ` (likely true) and the function returns.
- **Squad spawn onto a teammate currently OOB** (e.g., teammate in enemy buffer): unchanged. Inheritance copies the OOB zone flag and the player correctly inherits OOB. This is the **only OOB-on-spawn signal** we trust.
- **Squad spawn onto a teammate still in their grace window:** previously bailed inheritance and left all zones false → OOB after grace. **NEW:** falls through to the default-in-bounds branch. Acceptable per policy — better to miss a brief OOB than to false-positive into killing players.
- **Flag spawn (solo, no teammate within 25m):** previously left all zones false → false-positive OOB. **NEW:** defaults to `inGCZ = true` → in-bounds. Bug fixed.
- **Beacon spawn / engine fallback spawn at unknown location:** previously OOB if no teammate nearby. **NEW:** defaults in-bounds. Trade-off: a beacon placed OOB by a teammate (rare; the teammate would themselves be killed by the OOB countdown) would briefly mask the OOB until the spawning player physically crosses a trigger. Acceptable per policy.

### What this does NOT change

- Trigger enter / exit events still flip flags as the player physically moves. So a player who spawns inside the GCZ via this default-in-bounds path and then walks OUT of the GCZ trigger will fire `OnPlayerExitAreaTrigger` for trigger 666, set `inGCZ = false`, and the classifier will correctly flag OOB. The default seed is just the starting state; it doesn't override movement.
- The 1.5s `GCZ_DEPLOY_GRACE_SECONDS` window still applies. Even with the default-in-bounds seed, the grace covers the brief settle period in case anything's still out-of-sync.
- The classifier (`getDesiredBoundaryViolationKind`) remains a pure read of `zoneStateByPid`. No structural change.
- `tryInheritZonesFromNearbyTeammate` is unchanged. Squad-spawn inheritance still uses the 25m proximity check and the teammate-grace-window guard. The change is just the FALLBACK when inheritance returns false.

---

## Edge cases (explicit policy decisions)

1. **Solo flag spawn — common case:** default-in-bounds via `inGCZ = true`. **Fixed.**
2. **Squad spawn onto OOB teammate (legitimate OOB-on-spawn):** inheritance fires, copies OOB flags, classifier flags OOB on next refresh. **Preserved.**
3. **Squad spawn onto teammate in own-grace window:** previously OOB, now in-bounds. **Policy: better to miss a brief OOB than to false-positive.**
4. **Spawn beacon placed at OOB location:** previously OOB if no teammate, now in-bounds. **Policy: rare edge case; teammate-placer would themselves be OOB-killed; if they're alive within 25m, inheritance fires.**
5. **Engine fallback spawn (e.g., respawn at HQ pad):** anchor probe catches → `inOwnHQ=true` → unchanged.
6. **Flag inside enemy buffer trigger** (geometrically possible but unusual): default-in-bounds would mask the enemy-buffer violation. **Policy:** if maps ever place capturable flags inside enemy-zone triggers, that is a map design problem to fix; the OOB system should not be the safety net.
7. **Flag spawn into a vehicle (e.g., teammate's heli passenger seat at a flag):** `probeSeatKindFromEngineState` correctly classifies as `aircraft`/`ground_vehicle` via `IsInVehicle` probe. Aircraft are exempt from GCZ; ground vehicles go through the same `inSafeGround` check, where the new default-in-bounds applies. **Both paths handled.**

---

## Bundle / build impact

- ~6 lines added, 0 removed (the `tryInheritZonesFromNearbyTeammate` call is preserved, just hoisted to a guard pattern).
- Estimated: **+50–100 bytes** (mostly comment text — the actual logic is 2 lines: `return` early on inherit success, and `state.inGCZ = true` fallback).
- Headroom at v1.375: 15,137 bytes (1.44%) — comfortable.

---

## Verification

### Build / typecheck
1. Apply changes; bump version: `npm run bumpVersion -- -c "boundary seed: default-in-bounds when no teammate inheritance signal; fixes flag-spawn false-positive OOB (#98)"`.
2. `npm run build` PASS; capture bundle delta.
3. `cmd /c npx tsc --pretty false --noEmit` exit 0.

### Behavioral test plan (single-player, Firestorm)

**Bug-fix verification:**
1. Live match. Capture flag B (or any flag). Die. Open deploy screen, click flag B to flag-spawn. Confirm: spawn at flag, no OOB warning fires, no kill timer, no kill. Player free to play.
2. Same as #1 but capture a flag deep in the GCZ (e.g., flag near the GCZ boundary). Same expected behavior: in-bounds.
3. Repeat for each flag (A, B, C). All should be in-bounds on solo spawn.

**No-regression verification:**
4. **HQ deploy regression:** On the deploy screen, click the HQ ground-deploy button (or the standard on-foot deploy from main base). Confirm: spawn inside HQ, `inOwnHQ` flips true via anchor probe, no OOB. (No change expected.)
5. **Forward deploy regression:** Click Forward Deploy on a ground slot. Confirm: spawn at the forward point, `inGCZ + inOwnBuffer` set via slot-claim seed, no OOB. (No change expected.)
6. **Air deploy regression:** Click Air Deploy on an aircraft slot. Confirm: spawn in the air, `seatKind=aircraft`, no OOB via aircraft exemption. (No change expected.)
7. **Vanilla deploy regression:** Live match in Vanilla mode. Walk into a ground vehicle on the HQ pad. Confirm: enter event fires, `seatKind=ground_vehicle`, classifier exempts. (No change expected.)
8. **Pre-live HQ-leave regression:** Pre-live, walk out of HQ. Confirm: `prelive_main_base` violation fires, "RETURN TO YOUR MAIN BASE" prompt, kill timer starts. (No change expected.)
9. **Live HQ-back-walk regression:** Live, walk to back of HQ such that you exit trigger 500/501 toward the back wall (out of HQ AND out of buffer). Confirm: `ground_combat_zone` violation fires correctly. (No change expected — exit event flipped `inOwnHQ=false`, classifier sees `inSafeGround=false`.)
10. **GCZ exit regression:** Live, drive a ground vehicle out of trigger 666 (the GCZ). Confirm: exit event flips `inGCZ=false`, classifier fires OOB. (No change expected — the fix is on seed, not on movement.)

**Squad-spawn-on-OOB-teammate edge case:**
11. Two players, same team. Player A walks into the enemy buffer (becomes OOB, kill timer starts). Player B dies; before A's countdown expires, B squad-spawns on A. Confirm: B inherits OOB state, B's countdown begins. (Inheritance behavior preserved; legitimate OOB-on-spawn case still works.)

**Solo-flag-spawn-with-grace-window-teammate:**
12. Two players, same team. Player A flag-spawns (now in-bounds via the new fallback, in their 1.5s grace window). Within those 1.5s, player B dies and squad-spawns on A. Confirm: inheritance returns false (A is in grace), B falls through to default-in-bounds, B is also in-bounds. (Both handled correctly.)

---

## Out of scope

- **Position-containment SDK query:** Not available in `reference_bf6_core` (only `EnableAreaTrigger` and `GetAreaTrigger`). If a future SDK update adds it, we can revisit and use it as a confirmation step. Not blocking.
- **Spawn beacon location validation:** Out of scope for this fix. If beacons placed OOB become a problem, address separately.
- **Map-design enforcement:** If a map authoring mistake puts a capturable flag inside an enemy-zone trigger, that's a map fix, not a code fix.
