# Plan: Wire Forward Deploy to Ground Vehicle Slots

**Created:** 2026-04-19
**Status:** Drafted for review.
**Base:** v1.327 (post Supply Boxes wiring, post ready-dialog fixes).
**Supersedes:** Earlier launcher-ammo investigation (kept in design_doc); pre-v1.259 Forward Deploy code (deleted, reference-only).

---

## Context

Forward Deploy existed in v1.200-series but was deleted wholesale in the v1.259 vehicle-infra rewrite — the old path (`deploy-fulfillment.ts`, `reservations.ts`, `spawner-sequence.ts`) accumulated too many race-condition guards (CQ_Bug_39/49/52/54/55 + CQ_Bug_ActiveSpawnSingletonMPRace).

Now that HQ Deploy is stable (v1.277–v1.289) on the new infra and Supply Boxes was just wired with the same checkbox pattern (v1.325–v1.327), this change brings Forward Deploy back as a sibling to HQ Deploy: **HQ click spawns at the authored pad; Forward click spawns at a randomized point inside a per-map coordinate box**. Same seat flow as HQ, same serialized dispatch, same bind path — **same spawner, relocated in place**.

**Fresh-build discipline:** No code is ported from `reference_conquest_attempt_b` or any deleted module. The old reference is read-only inspiration — it tells us *what* needs to happen (sampling a random point in a quad, handling the post-spawn transform, etc.) but *every* line of forward-deploy code in this plan is new, shaped around the current HQ / `enqueueDispatch` / `OnVehicleSpawned` architecture. Lessons from the old failures are carried forward as constraints, not as source text.

Non-goals: Air Deploy (separate future work), aircraft forward-deploy, map-author tooling.

---

## Decisions locked by user

1. **Activation model:** Orthogonal `forwardDeployEnabled` checkbox (mirrors Supply Boxes pattern). Only meaningful when `confirmed.vehicleDeployMethod >= HQ`; ignored in Vanilla.
2. **Volume shape:** 4-corner floor quad + `rotTank` (matches old reference; hand-authored per map). Triangle-sampling math from old ref is proven.
3. **Respawn behavior:** Forward spawn is **request-only** — no auto-respawn ever. Position is **re-randomized every click**. Spawner position is **pre-sampled** so each click is as fast as HQ Deploy — see §3 on single-spawner reuse.
4. **Vehicle scope:** All ground vehicles (tanks, transports, quads, IFVs, etc.) — anything non-aircraft.
5. **Spawner-count budget: ≤ 40 persistent VehicleSpawner objects across the whole map.** Design must fit inside this budget; diagnostic must warn if we ever approach it.

---

## Spawner-budget reality check

Prior docs establish the count context ([abrams_substitution_plan.md:55-59](bf6-portal/dev/conquest/design_doc/abrams_substitution_plan.md)):

> Baseline static slots per match: ~14 per side × 2 = **28** (aircraft + ground slots across main bases).
> Optional forward-flag slots: 4 currently. Total persistent: **~32 spawners**.

User's stated rough ceiling: 12 per side + a few middle = ~30. Hard ceiling we want tracked: **40**.

A design that adds a second persistent spawner per ground slot (my first-pass draft did this) would push the total to **~50**, over budget. The plan below therefore uses **one spawner per slot, relocated in place** — count stays at today's ~32. The remaining headroom is reserved for future Air-Deploy work that may want its own pool.

---

## How the current infra works (key touchpoints)

- **Per-slot persistent spawner:** `slot.spawner` is a `mod.VehicleSpawner` created at round init at `slot.spawnPos` (HQ pad) with AutoSpawn off. See [vanilla-spawner.ts:210-272](bf6-portal/dev/conquest/src/vehicles/vanilla-spawner.ts#L210-L272) and type in [runtime-types.ts:6-45](bf6-portal/dev/conquest/src/state/runtime-types.ts#L6-L45).
- **Dispatch pipeline:** HQ click → `requestHqVehicleSpawn` ([hq-deploy.ts:60-106](bf6-portal/dev/conquest/src/vehicles/hq-deploy.ts#L60-L106)) → `enqueueDispatch(slotIndex)` → serialized via `spawnMutex` → `mod.ForceVehicleSpawnerSpawn(slot.spawner)` → `OnVehicleSpawned` fires → `bindSpawnedVehicleToExpectingSlot` maps to slot → `onHqVehicleSpawnedForClaim` → `beginHqSeatFlow` → `mod.DeployPlayer` + `ForcePlayerToSeat(player, vehicle, -1)`.
- **`mod.SetObjectTransform` on a VehicleSpawner relocates in place with no AutoSpawn race.** This is the enabling primitive (established in `air_forward_relocate_reuse_plan.md` line 26).
- **UI gate (partially wired):** [deploy-timer-ui.ts:1515-1520](bf6-portal/dev/conquest/src/vehicles/deploy-timer-ui.ts#L1515-L1520) computes `forwardDeployAllowed` from `confirmedMethod >= HQ_FORWARD`; label flips between "Forward Deploy" and "Air Deploy" at line 1529. We re-gate this on the checkbox instead of the enum tier.
- **Round-start delay:** `isRoundStartForwardDeployDelayActive()` at [state/core.ts:46-50](bf6-portal/dev/conquest/src/state/core.ts#L46-L50), seeded from `ACTIVE_MAP_CONFIG.roundStartForwardDeployDelay` (90s on Firestorm).
- **Countdown reset:** `resetVehicleSlotsAtCountdownStart()` at [vanilla-spawner.ts:522](bf6-portal/dev/conquest/src/vehicles/vanilla-spawner.ts#L522).
- **Confirmed-state funnel:** `confirmReadyDialogModeConfig()` at [mode-config-presets.ts:294](bf6-portal/dev/conquest/src/ready-dialog/mode-config-presets.ts#L294).
- **Existing enum values:** `VEHICLE_DEPLOY_METHOD_HQ_FORWARD = 2`, `HQ_FORWARD_AIR = 3` at [foundation/gameplay.ts:205-209](bf6-portal/dev/conquest/src/foundation/gameplay.ts#L205-L209). Left as-is — checkbox is orthogonal.

---

## Design

### 1. Map config: `team1ForwardVolumes` / `team2ForwardVolumes`

Add to `MapConfig` in [config/types.ts](bf6-portal/dev/conquest/src/config/types.ts), sibling to existing spawn fields (~line 107):

```ts
type ForwardSpawnVolumeSpec = {
    label: string;                     // Dev-facing, for debug
    enabled?: boolean;                  // Author-side on/off
    floorCorners: [mod.Vector, mod.Vector, mod.Vector, mod.Vector];
    rotTank: mod.Vector;                // Yaw for spawned vehicles
};
team1ForwardVolumes?: ForwardSpawnVolumeSpec[];
team2ForwardVolumes?: ForwardSpawnVolumeSpec[];
```

Multiple volumes per team supported, weighted random pick by footprint area. The 4-corner quad shape is chosen for author flexibility (non-rectangular zones, rotated boundaries). Hand-authored per map.

Seed Operation Firestorm (and any other active maps) with one volume per team.

**Sampling helpers** (new file `src/vehicles/forward-spawn-volume.ts`, written fresh — no code ported from any prior module):

- `sampleRandomPointInForwardVolume(volume): mod.Vector` — samples a uniformly random point inside the quad. Approach: split the quad into two triangles (corners `[a,b,c]` and `[a,c,d]`), weight each by its 2D area (X/Z plane, area = `0.5 * |cross(b-a, c-a)|`), pick one with `Math.random() * totalArea`, then sample the chosen triangle via the standard `(1-√r1, √r1·(1-r2), √r1·r2)` barycentric scheme. Height is taken from the corner Y values (average or pick one — same plane assumed for authoring).
- `pickForwardVolumeForTeam(teamId): ForwardSpawnVolumeSpec | undefined` — iterates `ACTIVE_MAP_CONFIG.team{N}ForwardVolumes`, filters `enabled !== false`, weighted-picks by quad area so larger zones get proportionally more traffic.
- `sampleForwardSpawnTransformForSlot(slot): { pos, rot } | undefined` — picks a volume, samples a point, returns `{ pos, rot: volume.rotTank }` or undefined when no enabled volume exists for the slot's team.

All three functions are pure (no state mutation, no `mod.*` side effects beyond `mod.CreateVector`), making them cheap to call repeatedly and trivially testable. Written with explicit variable names and short comments — they should read as obvious geometry, not as inherited mystery.

### 2. State shape additions

Extend `VehicleSpawnerSlot` in [runtime-types.ts](bf6-portal/dev/conquest/src/state/runtime-types.ts):

```ts
nextForwardPos?: mod.Vector;       // Pre-sampled random point in team's forward volume
nextForwardRot?: mod.Vector;       // Pre-sampled rotation (= volume.rotTank)
```

No new spawner field — `slot.spawner` is reused. No change to `modeConfig.confirmed` (the `forwardDeployEnabled` flag is already there, UI-only today).

### 3. Single-spawner lifecycle — relocate on forward click, restore after

**One spawner per slot** (the existing `slot.spawner`). Default parked at `slot.spawnPos` (HQ pad) so HQ clicks stay instant. Forward clicks temporarily relocate the spawner, fire, then relocate back after seat flow completes.

"Pre-randomization" lives in `slot.nextForwardPos`/`nextForwardRot` — always sampled ahead so the forward click itself is: one `SetObjectTransform` (instant) + `ForceVehicleSpawnerSpawn` + normal bind. Same end-to-end latency as HQ, plus one instant relocate.

**Seeding:** At round init (after `slot.spawner` is created) AND at countdown-reset time, if the slot is ground-class and the map has a forward volume for the team, sample a point and store it:

```ts
function seedNextForwardTransformForSlot(slot: VehicleSpawnerSlot): void {
    if (isAircraftVehicleType(slot.vehicleType)) return;
    const transform = sampleForwardSpawnTransformForSlot(slot);
    if (!transform) return;
    slot.nextForwardPos = transform.pos;
    slot.nextForwardRot = transform.rot;
}
```

Call from `resetVehicleSlotsAtCountdownStart` and from the slot-init path. No spawner churn — just a coordinate computation.

### 4. Forward deploy request path

New function in [hq-deploy.ts](bf6-portal/dev/conquest/src/vehicles/hq-deploy.ts), close sibling of `requestHqVehicleSpawn`:

```ts
function requestForwardVehicleSpawn(eventPlayer: mod.Player, pid: number, rowIndex: number, source: "deploy_menu" | "on_foot"): boolean {
    if (!isHqDeployMode()) return false;                         // Vanilla → off
    if (!isForwardDeployEnabled()) return false;                 // Checkbox off → off
    if (isRoundStartForwardDeployDelayActive()) return false;    // Pre-delay gate
    // Reuse HQ's validation: cooldown, one-claim-per-player, slot enablement, respawn cooldown.
    // ... same row-to-slot translation as requestHqVehicleSpawn ...
    if (isAircraftVehicleType(slot.vehicleType)) return false;   // Ground-only
    if (!slot.nextForwardPos) return false;                      // No forward volume / map unsupported
    slot.pendingSpawnOwnerPid = pid;
    slot.pendingSpawnMode = "forward";                            // Read by dispatch branch (§5)
    slot.hqSource = source;
    enqueueDispatch(slotIndex);
    return true;
}

function isForwardDeployEnabled(): boolean {
    return State.round.modeConfig.confirmed.forwardDeployEnabled === true;
}
```

### 5. Dispatch branches on `pendingSpawnMode`

Inside the HQ dispatch path ([vanilla-spawner.ts:282-299](bf6-portal/dev/conquest/src/vehicles/vanilla-spawner.ts#L282-L299)), **before** `ForceVehicleSpawnerSpawn`, relocate when mode is forward:

```ts
if (slot.pendingSpawnMode === "forward" && slot.nextForwardPos && slot.nextForwardRot) {
    try {
        mod.SetObjectTransform(
            slot.spawner,
            mod.CreateTransform(slot.nextForwardPos, slot.nextForwardRot)
        );
    } catch {}
}
mod.ForceVehicleSpawnerSpawn(slot.spawner);
```

Everything after — bind, seat flow — stays identical. Seat flow doesn't care where the spawner sat; it operates on the bound vehicle.

### 6. Post-seat: restore spawner, re-sample next forward point

After `beginHqSeatFlow` confirms the player is seated (success path only), run:

```ts
function onForwardSpawnSuccess(slot: VehicleSpawnerSlot): void {
    // Relocate the spawner back to the HQ pad so the next HQ click is instant.
    try {
        mod.SetObjectTransform(
            slot.spawner,
            mod.CreateTransform(slot.spawnPos, slot.spawnRot)
        );
    } catch {}
    // Pre-randomize the next forward point so a subsequent forward click is ready.
    seedNextForwardTransformForSlot(slot);
}
```

Hook this from the success branch inside `onHqVehicleSpawnedForClaim` / seat-flow completion, gated on `slot.pendingSpawnMode === "forward"` at the moment of bind (capture before `pendingSpawnMode` is cleared).

**Ordering rationale:** relocate the spawner only AFTER the player is seated. A lesson from the old failed implementation: the engine has (or had) a tendency to correct spawned vehicles back toward the spawner transform shortly after bind. If that still happens on the current engine build, keeping the spawner at the forward position until the player is seated means any correction lands at the forward point (a no-op). Verification test #4 specifically probes for this.

If snap-back is observed, the fix is a small slot-level boolean (e.g., `suppressNextSpawnerTransformCorrection: true`) consulted by our current bind path — **written fresh against the new bind logic, not copied from any prior implementation of the same idea**. Minimal surface, added only if the behavior reappears.

### 7. UI rewire

In [deploy-timer-ui.ts:1515-1520](bf6-portal/dev/conquest/src/vehicles/deploy-timer-ui.ts#L1515-L1520):

```ts
// OLD
const forwardDeployAllowed = confirmedMethod >= VEHICLE_DEPLOY_METHOD_HQ_FORWARD;
// NEW
const forwardDeployAllowed = confirmedMethod >= VEHICLE_DEPLOY_METHOD_HQ
    && State.round.modeConfig.confirmed.forwardDeployEnabled === true;
```

The existing click-handler branch that dispatches to `requestHqVehicleSpawn` for the Forward Deploy button gets reworked to call `requestForwardVehicleSpawn` instead when the button label is "Forward Deploy" (the air/forward/ground discriminator already exists in the UI layer).

In [countdown-flow.ts:106](bf6-portal/dev/conquest/src/ready-dialog/countdown-flow.ts#L106), swap the pregame-delay-text gate:

```ts
// OLD
if (countdownDeployMethod >= VEHICLE_DEPLOY_METHOD_HQ_FORWARD) showPregameCountdownDelayLineForAllPlayers(2);
// NEW
if (State.round.modeConfig.confirmed.forwardDeployEnabled) showPregameCountdownDelayLineForAllPlayers(2);
```

### 8. Confirm-funnel hook

`confirmReadyDialogModeConfig` at [mode-config-presets.ts:329-333](bf6-portal/dev/conquest/src/ready-dialog/mode-config-presets.ts#L329-L333) — no world-state resync needed, since we do not create or destroy spawners based on the checkbox; toggling just gates request acceptance and UI visibility. The deploy-timer-ui already refreshes from confirmed state via existing HUD pipelines.

### 9. Occupied-spot check: defer

With pre-randomized positions inside a reasonably-large forward volume, collisions with existing vehicles or players are unlikely. **Skip initially.** If playtesting reveals vehicles spawning on top of each other, add a fresh per-sample rejection loop (sample → check distance to `mod.AllVehicles()` → retry N times → accept best-effort). Written new against current infra when/if needed.

### 10. Spawner-count diagnostic (budget guardrail)

New file `src/vehicles/spawner-budget.ts`, tiny:

```ts
const SPAWNER_COUNT_WARN_THRESHOLD = 40;

function countPersistentVehicleSpawners(): number {
    const slots = State.vehicles?.slots;
    if (!slots) return 0;
    let count = 0;
    for (let i = 0; i < slots.length; i++) {
        if (slots[i].spawner) count += 1;
    }
    return count;
}

function auditSpawnerBudgetAtRoundStart(): void {
    const count = countPersistentVehicleSpawners();
    if (count >= SPAWNER_COUNT_WARN_THRESHOLD) {
        // Visible-to-admin console warning. Hook whatever logging we have (maybe a SetShowNotificationMessage for admin team, or printLineAllPlayers behind FEATURE_DEBUG_LOG).
        try { mod.DisplayCustomNotificationMessage(mod.Message(mod.stringkeys.twl.system.genericCounter, count), "spawnerBudgetWarn" as any, 5); } catch {}
    }
}
```

Invoke once at end of slot setup (after every slot's spawner is created, before the first spawn fires). One-shot. No per-frame cost.

**Where growth could come from in the future** (things to watch):

| Source | Spawners added | Mitigation |
|---|---|---|
| This plan (relocate single spawner) | **0** | — |
| Adding a second spawner per ground slot | +20-ish | **Don't.** The plan deliberately avoids this. |
| Air Deploy with its own pool | up to +16 | Pool per team, not per slot (e.g., 2 per team = +4). |
| Pooled middle-objective spawners | +4-8 | Budget allows; monitor. |
| `mod.SpawnObject(RuntimeSpawn_Common.VehicleSpawner, ...)` per click (the old pattern) | unbounded leak | Banned; cleanup-on-destroy required if ever reintroduced. |

If Air Deploy later wants "pre-randomized" spawners per slot the same way I considered here, we bust 40. **Air's design must pool at the team level, not per-slot.** Record that constraint in the Air plan when it comes up.

---

## Files touched

| File | Change |
|---|---|
| `src/config/types.ts` | Add `ForwardSpawnVolumeSpec` type; add `team1ForwardVolumes` / `team2ForwardVolumes` to `MapConfig`. |
| `src/config/maps/operation-firestorm.ts` | Seed one forward volume per team (hand-authored quad + `rotTank`). Other active maps: at least one volume each or leave undefined (feature safely no-ops). |
| `src/vehicles/forward-spawn-volume.ts` | **New.** Triangle-sampling helpers written fresh (§1). No code inherited from any prior module. |
| `src/vehicles/spawner-budget.ts` | **New.** `countPersistentVehicleSpawners` + `auditSpawnerBudgetAtRoundStart`. |
| `src/state/runtime-types.ts` | Add `nextForwardPos`, `nextForwardRot` to `VehicleSpawnerSlot`. |
| `src/vehicles/vanilla-spawner.ts` | Call `seedNextForwardTransformForSlot` at slot init and inside `resetVehicleSlotsAtCountdownStart`. Dispatch relocate-branch on `pendingSpawnMode === "forward"`. Call `auditSpawnerBudgetAtRoundStart()` once after slot setup. |
| `src/vehicles/hq-deploy.ts` | Add `requestForwardVehicleSpawn` + `isForwardDeployEnabled`. Hook `onForwardSpawnSuccess` into the post-seat success branch. |
| `src/vehicles/deploy-timer-ui.ts` | Re-gate `forwardDeployAllowed` on checkbox + HQ mode; reroute Forward Deploy click to `requestForwardVehicleSpawn`. |
| `src/ready-dialog/countdown-flow.ts` | Update pregame-delay-text gate to `forwardDeployEnabled`. |
| `src/Changelog.ts` + version files | Via `node scripts/bump-version.js --comment="..."`. |
| `design_doc/conquest_issues.md` | Note under historic Forward Deploy entries: superseded by v1.3xx wiring. Add `CQ_Feat_Forward_Deploy_Reintroduction` resolved entry. |
| `design_doc/forward_deploy_wiring_plan_2026-04-19.md` | **New.** Copy of this plan for historical record. |

**Explicitly NOT touched:**
- `reference_conquest_attempt_b/*` — reference only, never imported.
- Any aircraft spawn code. Air Deploy is future work.
- `open_vehicle_spawn_menu` interactable logic. No new menu.

---

## Lessons carried forward from the deleted v1.200-series implementation

The old code is read-only inspiration — none of it is imported. These lessons shape the constraints above:

- **Never `mod.SpawnObject(RuntimeSpawn_Common.VehicleSpawner, ...)` per click.** That pattern caused the AutoSpawn-Abrams race (CQ_Bug_49, CQ_Bug_54) and the MP singleton clobber (CQ_Bug_ActiveSpawnSingletonMPRace). Our design reuses the one persistent spawner per slot — no per-click spawner creation, ever.
- **Never globally track "the currently spawning slot".** Per-slot `pendingSpawnMode` / `pendingSpawnOwnerPid` is already how HQ Deploy does it; Forward Deploy uses the same fields, same discipline.
- **Never `mod.Teleport` a player before `ForcePlayerToSeat`.** Broke the deploy flow in v1.106–v1.108 and v1.151–v1.154. We use HQ's `beginHqSeatFlow` path unchanged (Deploy → OnPlayerDeployed → ForcePlayerToSeat).
- **Be defensive about post-bind spawner transform corrections.** If observed, add a fresh per-slot suppress flag — do not port the old flag name or logic.
- **Spawner count growth is a performance concern** (§10). The old design let it drift upward per-click; ours keeps the count at its current 28–32 baseline and monitors it.

## Risks and mitigations

1. **Engine post-spawn "snap vehicle to spawner" behavior.** **Mitigation:** relocate the spawner back to HQ only AFTER seat flow completes (§6). If snap-back is still observed, add a fresh one-shot slot flag consulted by the new bind path — not ported from old code.
2. **Two players forward-click same slot concurrently.** Existing `spawnMutex` serialization in dispatch handles it; `pendingSpawnOwnerPid` claim catches re-entry.
3. **Forward click when map has no volume defined.** `slot.nextForwardPos === undefined` → request returns false → UI button hidden (gate reads the same field indirectly through a helper). Safe silent degradation.
4. **Checkbox flips mid-pregame.** No spawner churn (§8); toggle only gates request acceptance and UI visibility.
5. **Spawner count creeps past 40 later.** Diagnostic (§10) surfaces the number at round start. Future additions must pool, not multiply.
6. **`SetObjectTransform` is not instant on some engine build.** If we see a measurable delay between relocate and spawn that misaligns the vehicle, insert one `mod.Wait(0)` between the transform and the force-spawn. Trivial fix, only add if observed.
7. **Forward spawn during HQ respawn cooldown.** Existing `respawnClock` check in `findSlotForHqClaim` handles it uniformly.

---

## Verification

**Build:**
- `node scripts/bump-version.js --comment="wire Forward Deploy: single-spawner relocate on click, pre-sampled random forward point, checkbox-gated"`
- Bundle must stay under 1,048,576 bytes.

**Functional matrix:**
1. Vanilla mode and HQ-only mode behave exactly as today. Forward Deploy button hidden / disabled when checkbox off.
2. HQ + Forward Deploy ON, LIVE, click HQ Deploy: vehicle spawns at pad, seat flow works.
3. HQ + Forward Deploy ON, LIVE past `roundStartForwardDeployDelay`, click Forward Deploy on a tank: vehicle spawns inside authored forward volume, player auto-seats. Rotation matches `rotTank`.
4. Repeat #3 ten times: each spawn at a different random point; spawner visibly relocates between clicks if debug-draw is added. **No vehicle teleports back to old position after spawn.**
5. Forward Deploy on transport / quad: works same as tank.
6. Aircraft slots: forward button hidden / disabled. HQ click on aircraft still works.
7. Forward Deploy when volume undefined for map: button never visible. No crash.
8. Click Forward during delay window: silently rejected.
9. Two players click Forward on different slots concurrently: both succeed at their own slot's forward point.
10. Same team, same slot race: second claim rejected.
11. Vanilla mode with `forwardDeployEnabled=true`: checkbox ignored, button hidden.
12. Countdown restart (ready again): next forward position re-sampled per slot.
13. Match end → next round: slot teardown/setup unchanged; forward state cleanly re-initialized.
14. Post-forward, immediately click HQ: vehicle spawns at HQ pad (spawner was restored).
15. Spawner-count audit: with current maps + forward volumes active, count ≤ 40. Warning does not fire.

**Regression:**
16. Supply Boxes behave identically after Apply + round cycle.
17. HQ Deploy seating still works on-foot and from deploy menu.
18. Vanilla fleet spawns untouched.

---

## Rollback

Single-commit revert restores v1.327 behavior. No state-shape persistence crosses sessions — the new slot fields just go unused. Map configs with the new fields still type-check (fields are optional).

---

## Open questions (flagged, not blocking)

- Should we expose `HQ_FORWARD` as a dropdown tier to users too, or leave only Vanilla/HQ in the options list and rely solely on the checkbox? Current plan: checkbox-only, dropdown stays at 2 options. The enum values remain for internal gating.
- Triangle-sampling assumes convex quads with consistent winding. If authors produce a non-convex or inverted-winding quad, samples may land outside the visible area. Defer: document the constraint, catch it in review when a volume is authored.
