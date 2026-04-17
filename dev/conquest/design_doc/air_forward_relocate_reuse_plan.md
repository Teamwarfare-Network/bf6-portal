# Plan: Air / Forward Deploy Rearchitecture — relocate-and-reuse persistent spawners

**Created**: 2026-04-14 (re-plan after v1.223–v1.227 patching cycle, current baseline v1.229)
**Status**: Planning — awaiting approval to execute

---

## Context

Air Deploy and Forward Deploy intermittently spawn an Abrams instead of the intended vehicle. HQ Deploy is rock-solid. Five rounds of iterative fixes (v1.223 Phase 1 per-slot tracking, v1.224 single-expecting fallback, v1.225–v1.227 hardening, v1.228 revert to pre-plan baseline, v1.229 SDK refresh + new vehicle options) have not resolved the bug. The current code is spaghetti across three independent bind layers.

**Why prior fixes went wrong** — concrete failure modes, not hand-waving:

1. **Phase 1 (v1.223) anchored bind lookup to `slot.lastRequestedSpawnPos` within 7m.** Aircraft have non-zero birth velocity; by the time `OnVehicleSpawned` fires they have left the 7m window. The scan returned -1, the bind never happened, fulfillment timed out. Regression introduced by the fix.
2. **Phase 1 made the prefab-default Abrams match the per-slot position perfectly (~0m).** Combined with `rejectWrongCategoryBindForAircraftSlot` only firing for aircraft slots, non-tank ground slots (Quadbike, Marauder) deterministically accepted the AutoSpawn Abrams. Another regression introduced by the fix.
3. **Phase 1a (v1.224) patched both with a single-expecting fallback and broader class-reject, but left all three bind layers in place.** The event handler, the fulfillment inline-scan, and the watchdog all still wrote to the same mapping state. Each Abrams source still had multiple admission paths.
4. **Every patch laid on top of the same three-layer architecture.** The actual problem — no single bind authority, hostile-AutoSpawn prefab spawned every click, one-shot spawn without retry — was never addressed.

**Confirmed root causes** (not hypotheses):
- `mod.SpawnObject(RuntimeSpawn_Common.VehicleSpawner, pos, rot)` called on every Air/Forward click ([deploy-fulfillment.ts:368, :440](../src/vehicles/deploy-fulfillment.ts)). The prefab has AutoSpawn=true baked in; an Abrams spawns before `SetVehicleSpawnerAutoSpawn(false)` lands. CQ_Bug_54.
- Air/Forward is one-shot: one `ForceVehicleSpawnerSpawn` call followed by a 1s wait then a radius-scan. HQ is a 5s retry loop ([spawner-sequence.ts::forceSpawnWithRetry](../src/vehicles/spawner-sequence.ts)).
- Global singleton `State.vehicles.activeSpawnSlotIndex/Token` is MP-unsafe. Two simultaneous clicks clobber each other.
- 40m radius fallback scan on Forward accepts any unmapped vehicle including tanks ([deploy-fulfillment.ts:454-475](../src/vehicles/deploy-fulfillment.ts)).
- `relocateSlotSpawner` ([map-runtime.ts:561](../src/config/map-runtime.ts)) unspawns and recreates the spawner, re-firing the AutoSpawn race on every ready-dialog vehicle-type change.

**Key SDK primitive confirmed**: `mod.SetObjectTransform(object, transform)` **relocates a VehicleSpawner in place without re-creating it**. The AutoSpawn race only happens at `SpawnObject` creation, not at transform updates. This unlocks the rearchitecture below.

## New architecture — relocate-and-reuse persistent spawners

Every enabled slot already has a persistent `slot.spawner` authored once at round init ([spawner-slots.ts::addVehicleSpawnerSlot](../src/vehicles/spawner-slots.ts)) whose initial AutoSpawn Abrams is handled by the existing bootstrap cleanup. HQ already uses this spawner directly with `forceSpawnWithRetry` and is reliable. Air/Forward currently bypass it and create fresh runtime spawners per click — which is where all the races live.

**Design**:
1. **One persistent spawner per slot, created at round init.** Already true. No change to slot count (~28–32).
2. **On Air/Forward click, relocate `slot.spawner` in place** via `mod.SetObjectTransform` to a randomly-sampled point in the team's aircraft or tank volume, with the correct pitch-down rotation for jets (`createAircraftBirthSpawnRotationForSlot`). Randomization is preserved.
3. **Then call `forceSpawnWithRetry(slotIndex)`** — the same HQ-reliable retry loop (20×0.25s = 5s).
4. **Single bind authority**: `OnVehicleSpawned` → per-slot class-primary + `expectingSpawn` lookup with distance tie-break. No fulfillment inline-bind. No 40m radius fallback.
5. **Delete** `slot.freshAirRuntimeSpawner`, the runtime-spawner `SpawnObject` calls, and the 40m fallback scan entirely. Kill the second and third layers.

This gives Air/Forward the same three properties that make HQ reliable:
- No per-click AutoSpawn race (spawner exists before click; prefab default already handled at init).
- Retry loop, not one-shot.
- One writer to `slot.vehicleId`.

**Known risk — engine abandonment**: the spawner's abandon system tracks distance from spawner to its current vehicle. Relocation moves the spawner away from any still-bound vehicle. Mitigation (applied in Phase B): **dynamically gate abandonment around the relocate window**. Before `SetObjectTransform`, call `mod.SetVehicleSpawnerApplyDamageToAbandonVehicle(slot.spawner, false)` and `mod.SetVehicleSpawnerAbandonVehiclesOutOfCombatArea(slot.spawner, false)`. Re-enable both after the freshly-spawned vehicle is bound. This prevents the engine from killing a previously-bound vehicle that is now far from the moved spawner. Relocation also only happens on a fresh click when `slot.vehicleId === -1` (slot claim is gated by `pendingSpawnOwnerPid`), so the previous-vehicle case is rare; this is belt-and-suspenders.

**UX risk — 5s retry window vs. player picking a different deploy option**: today, HQ Deploy already uses the 5s `forceSpawnWithRetry`, so the UX precedent is established. Air/Forward today is one-shot (~1s budget); extending to 5s broadens the window during which a player at the deploy screen might try to change their mind (e.g. cancel deploy, pick a different slot, pick HQ instead). Current `forceSpawnWithRetry` only bails on `slot.enabled === false` or `enableToken` bump — it does NOT check `slot.pendingSpawnOwnerPid`. Fix in Phase B: extend the retry loop's cancellation check to also bail when `slot.pendingSpawnOwnerPid === undefined` (meaning the player released their claim). On bail: clear `slot.expectingSpawn`, don't spawn, no orphan vehicle. If the player kicks off a new deploy in parallel (different slot), their new claim operates on a different slot; no interference. Same-slot re-claim during retry just resets the timer cleanly.

## Phases (bisectable, one commit each)

### Phase A — v1.230: Fix `relocateSlotSpawner` to use `SetObjectTransform`

**File**: [src/config/map-runtime.ts:561](../src/config/map-runtime.ts) (function body, 12 lines).

**Change**: replace the `UnspawnObject` + `SpawnObject` pair with `mod.SetObjectTransform(slot.spawner, { pos: newPos, rot: newRot })`. Keep `configureVehicleSpawner(slot.spawner, slot.vehicleType)` for the rotation yaw offset / respawn settings if the transform update doesn't preserve them (verify empirically). `slot.spawnerObjId` stays valid.

**Why first — the whole architecture bets on `SetObjectTransform` working on a VehicleSpawner**: this phase is the isolated sanity check. If it fails (e.g. the engine ignores the transform update on a prefab-spawned VehicleSpawner, or it silently unspawns and re-spawns the underlying vehicle), we abandon the relocate-and-reuse approach before investing in Phases B–E. As a side benefit, it closes a latent AutoSpawn race that currently fires every ready-dialog vehicle-type change (unspawn+respawn).

**SP test (also the go/no-go for the rest of the plan)**:
- Open ready dialog, cycle through 3–4 different vehicle types for the same slot. Each spawns the correct vehicle. No Abrams artefact at the slot position.
- Then: walk up to the persistent slot (HQ pad) and verify it still spawns vehicles correctly after the relocation call fires (i.e. the underlying spawner is still functional post-transform).
- If either verification fails, stop — the whole plan is invalid and we need a different architecture.

### Phase B — v1.231: Introduce relocate-and-retry primitive for Air/Forward

**New helper** in [src/vehicles/spawner-bind.ts](../src/vehicles/spawner-bind.ts) (or a new `spawner-relocate.ts` if the file is large):

```ts
function relocateSlotSpawnerInPlace(slot: VehicleSpawnerSlot, targetPos: mod.Vector, targetRot: mod.Vector): void {
    // Gate abandonment so a previously-bound vehicle (rare: slot is normally empty at this point)
    // isn't killed by the engine when the spawner jumps away from it. Re-armed post-spawn by
    // restoreSlotSpawnerAbandonmentDefaults() once the bind completes.
    try { mod.SetVehicleSpawnerApplyDamageToAbandonVehicle(slot.spawner, false); } catch {}
    try { mod.SetVehicleSpawnerAbandonVehiclesOutOfCombatArea(slot.spawner, false); } catch {}
    mod.SetObjectTransform(slot.spawner, { pos: targetPos, rot: targetRot });
    slot.spawnPos = targetPos;
    slot.spawnRot = targetRot;
}

function restoreSlotSpawnerAbandonmentDefaults(slot: VehicleSpawnerSlot): void {
    try { mod.SetVehicleSpawnerApplyDamageToAbandonVehicle(slot.spawner, true); } catch {}
    try { mod.SetVehicleSpawnerAbandonVehiclesOutOfCombatArea(slot.spawner, true); } catch {}
}
```

**Also in Phase B — extend `forceSpawnWithRetry` cancellation check** ([spawner-sequence.ts:44](../src/vehicles/spawner-sequence.ts)): the existing `if (!slot.enabled || slot.enableToken !== token)` early-exit should also bail when `slot.pendingSpawnOwnerPid === undefined && slot.pendingSpawnMode !== undefined` (i.e. a claim was active but got released mid-retry). Gate the addition behind a mode flag so the round-start sequential-spawn path is unaffected — or more simply, add a parameter `bailOnClaimReleased: boolean` to `forceSpawnWithRetry` and set it true only for Air/Forward calls.

**New fulfillment entry** in [src/vehicles/deploy-fulfillment.ts](../src/vehicles/deploy-fulfillment.ts):

```ts
async function spawnAirOrForwardViaSlotSpawner(slotIndex: number, mode: "air" | "forward"): Promise<mod.Vehicle | undefined> {
    const slot = State.vehicles.slots[slotIndex];
    const target = mode === "air"
        ? tryResolveFreshAircraftBirthSpawnForSlot(slot)
        : tryResolveBoundedSpawnTransformForSlot(slot);
    if (!target) return undefined;
    if (mode === "forward") {
        cleanupStaleVehiclesNearPosition(target.pos);
        if (isForwardDeployPositionOccupied(target.pos)) return undefined;
    }
    relocateSlotSpawnerInPlace(slot, target.pos, target.rot);
    await forceSpawnWithRetry(slotIndex, /*bailOnClaimReleased*/ true);
    restoreSlotSpawnerAbandonmentDefaults(slot);
    return slot.vehicleId !== -1 ? findVehicleById(slot.vehicleId) : undefined;
}
```

**Do NOT delete the old paths yet** — let them coexist for one commit so this phase is pure addition. Air/Forward still uses the old runtime-spawner path; we'll flip in Phase C.

**SP test**: wire a compile-time flag (e.g. `FEATURE_RELOCATE_REUSE_SPAWN`) at the top of [deploy-timer-ui.ts](../src/vehicles/deploy-timer-ui.ts) button-up handlers: when true, route Air/Forward clicks through `spawnAirOrForwardViaSlotSpawner`; when false (default in this phase), use existing path. Flip the flag locally for a playtest run. Verify:
- One Air Deploy through the new path produces the correct vehicle at a random volume point.
- Vehicle is reachable, seat works, player can fly it.
- Ready-dialog vehicle-type change + new-path deploy still produces the correct type.
- If this phase fails, we revise the plan before Phase C lands anything destructive.

### Phase C — v1.232: Flip Air/Forward fulfillment to the new path; delete the old path

**Changes**:
- In `spawnFreshAircraftDirectSpawnVehicleForSlot` and `spawnForwardDeployVehicleForSlot`, replace the body with a call to `spawnAirOrForwardViaSlotSpawner(slotIndex, "air" | "forward")`.
- Delete all `mod.SpawnObject(mod.RuntimeSpawn_Common.VehicleSpawner, ...)` calls in [deploy-fulfillment.ts](../src/vehicles/deploy-fulfillment.ts).
- Delete the 40m radius-scan fallback ([deploy-fulfillment.ts:315](../src/vehicles/deploy-fulfillment.ts), [:454-475](../src/vehicles/deploy-fulfillment.ts)) and `tryFindVehicleNearDirectSpawnAirPoint`.
- Delete `slot.freshAirRuntimeSpawner` field from [runtime-types.ts](../src/state/runtime-types.ts) and all its references (slot-disable cleanup in [spawner-slots.ts:98-103](../src/vehicles/spawner-slots.ts); any init default).
- Keep `suppressNextBindSpawnTransformCorrection` wiring untouched (load-bearing per Do-Not-Repeat). The correction teleport now sends the vehicle back to `slot.spawnPos` which IS the random volume point, so it becomes a no-op verification — safe.
- Keep `cleanupStaleVehiclesNearPosition` and `isForwardDeployPositionOccupied`.

**SP test**: 20+ Air Deploys across jet/heli slots, 20+ Forward Deploys across tank/fast slots, in that order and mixed. Verify:
- Correct vehicle every time, zero Abrams substitutions.
- Respawn-after-destroy works (destroy the vehicle, wait respawn timer, deploy again).
- Round cleanup + restart: slots reset cleanly, no leaked runtime spawners in `mod.AllVehicles()`.

### Phase D — v1.233: Replace `activeSpawn*` singleton with per-slot class-primary bind lookup

**Now** that there is no runtime-spawner AutoSpawn race and no inline fallback bind, the bind lookup can finally be simplified.

**Changes**:
- Remove `State.vehicles.activeSpawnSlotIndex / activeSpawnToken / activeSpawnRequestedAtSeconds` from [runtime-state.ts](../src/state/runtime-state.ts).
- Remove all writes and clears from [spawner-bind.ts](../src/vehicles/spawner-bind.ts), [spawner-sequence.ts](../src/vehicles/spawner-sequence.ts), and [deploy-fulfillment.ts](../src/vehicles/deploy-fulfillment.ts).
- Rewrite `bindSpawnedVehicleToSlot` lookup:
  1. Filter candidates: `slot.expectingSpawn === true && (now − slot.expectingSpawnStartedAtSeconds) < VEHICLE_SPAWNER_BIND_TIMEOUT_SECONDS`.
  2. **Class-primary match**: prefer candidates where `slot.vehicleType` matches the inbound vehicle's engine name via `mod.CompareVehicleName` (or falls into the same broad class via `isTankVehicleInstance` / `isAircraftVehicleInstance`).
  3. **Tie-break**: if multiple class-matched candidates, pick the one with nearest `slot.spawnPos` to the inbound vehicle's position.
  4. **Reject**: if no class-matched candidate and the inbound is an Abrams (CQ_Bug_49 rule), return 0 without binding. Let the retry loop's next iteration produce the real vehicle.
- Keep the existing `CQ_Bug_49` Abrams-reject behaviour and `suppressNextBindSpawnTransformCorrection` wiring.

**SP test**: same as Phase C plus specific Abrams-race torture (rapid-fire Air on jet slots, rapid-fire Forward on quad slots). Zero substitutions expected.

**MP test queue** (gates Phase E): two players concurrent Air on different slots, concurrent Forward on different slots, mixed, 10 trials each.

### Phase E — v1.234: Slot-lock recovery watchdog

Defensive safety net in case any exotic race reaches bind or seat.

**Changes**:
- New helper in [src/vehicles/vehicle-classification.ts](../src/vehicles/vehicle-classification.ts): `isVehicleClassMatchForSlot(vehicle, slot)` using `isAircraftVehicleInstance` / `isTankVehicleInstance`.
- Bind-time class assertion in `bindSpawnedVehicleToSlot`: after picking a candidate, verify class-match. If mismatch, `UnspawnObject` the vehicle, clear `slot.expectingSpawn`, and let the retry loop try again (keep `pendingSpawnOwnerPid` intact).
- Post-seat class verification in [deploy-fulfillment.ts:642-649](../src/vehicles/deploy-fulfillment.ts): after `ForcePlayerToSeat`, if mismatch → force-eject, unspawn, reset slot, use `forceUndeployAfterVehicleDirectSpawnFailure` to release the player's claim cleanly (no respawn-timer penalty).
- Periodic 2s sweep (piggyback on existing deploy-timer-hud tick): for each slot with `vehicleId !== -1`, verify the vehicle still exists and class-matches; reset on mismatch. Also clear `activeOwnerPid` if it's been ghost for >5s.

## Critical files

| File | Phase |
|---|---|
| [src/config/map-runtime.ts](../src/config/map-runtime.ts) | A |
| [src/vehicles/spawner-bind.ts](../src/vehicles/spawner-bind.ts) | B, D, E |
| [src/vehicles/deploy-fulfillment.ts](../src/vehicles/deploy-fulfillment.ts) | B, C, E |
| [src/vehicles/spawner-sequence.ts](../src/vehicles/spawner-sequence.ts) | B, D |
| [src/state/runtime-state.ts](../src/state/runtime-state.ts) | D |
| [src/state/runtime-types.ts](../src/state/runtime-types.ts) | C |
| [src/vehicles/spawner-slots.ts](../src/vehicles/spawner-slots.ts) | C |
| [src/index/vehicle-events.ts](../src/index/vehicle-events.ts) | D, E |
| [src/vehicles/vehicle-classification.ts](../src/vehicles/vehicle-classification.ts) | E |
| [conquest_issues.md](./conquest_issues.md) + [TWL_Conquest_Design.md](./TWL_Conquest_Design.md) | all |

## Verification per phase

1. `npm run build` succeeds, bundle under 1,048,576 B (current v1.229 baseline: 998,726 B).
2. TypeScript clean (noting `@ts-nocheck` files).
3. SP test plan for that phase passes — primary gate is "zero Abrams substitutions across 20+ Air and 20+ Forward trials".
4. `npm run bumpVersion -- -c "<summary>"` runs cleanly.
5. Design doc Project Stats refreshed per [AGENTS.md](../AGENTS.md).
6. [conquest_issues.md](./conquest_issues.md) updated with new or closed CQ_Bug_ entries.

## MP validation (gating Phase E release)

After Phase D is SP-validated, queue an MP playtest before shipping Phase E:
- Two players click Air on two aircraft slots within 50–200ms: both get correct aircraft, 10 trials.
- Two players click Forward on two ground slots within 50–200ms: both correct, 10 trials.
- Mixed Air + Forward concurrent, 10 trials.
- Record: zero Abrams substitutions = Phase D validated. Any substitution = revisit before Phase E.

## Do Not Repeat

1. **No pre-seat `mod.Teleport` on the player before `ForcePlayerToSeat`.** Banned (v1.106–v1.108, v1.151–v1.154).
2. **Do not re-introduce `mod.SpawnObject(mod.RuntimeSpawn_Common.VehicleSpawner, ...)` per click.** The whole point of this plan is to eliminate that AutoSpawn race.
3. **Keep CQ_Bug_49 Abrams-reject semantics** in the Phase D lookup rewrite.
4. **Keep `suppressNextBindSpawnTransformCorrection` wiring.** Still load-bearing.
5. **Keep `cleanupStaleVehiclesNearPosition` and `isForwardDeployPositionOccupied`.** v1.203–v1.204 hardening.
6. **One bisectable commit per phase.** No bundling.

## Open questions resolved

- **Randomization preserved**: yes — `mod.SetObjectTransform` relocates in place per click; the spawner can land at a new random volume point on every request without recreation overhead.
- **Phasing**: five bisectable phases A → E.
- **40m radius fallback**: deleted in Phase C.
- **Teleport-after-bind option (user's concern about prior jet pitch-down failure)**: not needed. Spawner is moved to the target point; vehicle is born at the correct pose. If Phase C surfaces a born-pose issue, we have a contained fallback: apply `createAircraftBirthSpawnRotationForSlot` pitch post-bind via `applySpawnYawToVehicle`, which already exists.
- **Architecture validation before commitment**: Phases A and B are the validation gates. Phase A proves `SetObjectTransform` works on a VehicleSpawner in isolation. Phase B adds the new path behind a flag so we can A/B test one deploy before flipping the default. Phase C is the point of no return (deletes the old path); it ships only if A and B both check out.
- **Retry-loop UX cancellation**: `forceSpawnWithRetry` gets a new `bailOnClaimReleased` parameter (Phase B) so if a player releases their deploy claim mid-retry (e.g. picks a different slot, cancels deploy), the in-flight retry exits cleanly with `slot.expectingSpawn` reset and no orphan vehicle. Same-slot re-claim during retry resets the timer; different-slot claim operates on a different slot with no interference.
- **Abandonment toggle (user-approved)**: Phase B dynamically disables `ApplyDamageToAbandonVehicle` and `AbandonVehiclesOutOfCombatArea` on the slot's spawner immediately before the relocate call, and restores them after the spawn binds. Prevents the engine's abandon system from killing a previously-bound vehicle if the spawner jumps away from it.
