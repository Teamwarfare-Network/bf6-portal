# Plan: Tier 1 + 2 + 3 Cleanup (v1.371 → v1.373)

**Created:** 2026-04-25
**Git checkpoint:** user-confirmed before this plan
**Target versions:** v1.371 (Tier 1), v1.372 (Tier 2), v1.373 (Tier 3 audit)
**Companion to:** [conquest_optimization_analysis.md](./conquest_optimization_analysis.md)

---

## Context

Bundle headroom at v1.370 is **1.53%** (16,086 bytes free, 1,032,490 / 1,048,576). This plan executes the low-risk reclaim levers identified in the optimization analysis Categories 1, 1.5, and 3, in three versioned chunks with explicit test plans per chunk.

Tiers 1 and 2 are code deletions with concrete bundle reclaim. Tier 3 is audit-only — produces findings, not code changes — and explicitly excludes capture points (they use the `CapturePoint` event family, not `AreaTrigger`, so the v1.367 EnableAreaTrigger lesson does NOT generalize there).

**Out of scope (deferred):** Tier 4 gameplay bugs (Loadout_Not_Respected, Abrams_Substitution) and Tier 5 bundle survival (Admin Panel trim, mega-file splits).

---

## v1.371 — Tier 1: Free reclaim wins

Estimated reclaim: ~1,200–1,500 bundle bytes. Target headroom after: ~1.65%.

### 1.1 Remove `clearAllVehicleReservations` + its callsite

**Files:**
- [src/vehicles/vanilla-spawner.ts](bf6-portal/dev/conquest/src/vehicles/vanilla-spawner.ts) lines 79-82 — function body is a comment-only no-op marked "Kept as no-op for endMatch call-site compatibility. Reservations are gone." (orphaned in v1.259 rewrite).
- [src/conquest-flow.ts](bf6-portal/dev/conquest/src/conquest-flow.ts) line 66 — only callsite, inside `endMatch` flow.

**Action:** Delete both the function and the callsite.

**Risk:** **LOW.** Function does literally nothing. Removing a no-op call from `endMatch` cannot affect behavior.

**Pre-edit verification:**
- `grep -rn 'clearAllVehicleReservations' src/` — should return exactly the two known locations.

**Post-edit verification:**
- `npx tsc --pretty false --noEmit` exit 0.
- `npm run build` PASS.
- Bundle size decreases by ~76 bytes.

**Behavioral smoke test (after the v1.371 build is loaded):**
1. Start a match, let it reach LIVE.
2. End the match via the natural path (admin "End Match" button if available, or wait for ticket exhaustion in a 1v0 lobby).
3. Confirm no runtime error. Confirm victory dialog renders. Confirm next-match reset cleanly returns to NOT_READY.

### 1.2 Remove `getDesiredSpawnerCountsForPreset`

**File:** [src/vehicles/vanilla-spawner.ts](bf6-portal/dev/conquest/src/vehicles/vanilla-spawner.ts) lines 63-69.

**Action:** Delete the function.

**Risk:** **LOW.** Zero callers per v1.338 audit. We re-verify before deleting.

**Pre-edit verification:**
- `grep -rn 'getDesiredSpawnerCountsForPreset' src/` — must return zero matches outside the definition itself.

**Post-edit verification:**
- tsc + build clean. Bundle decreases ~313 bytes.

**Behavioral smoke test:** none specifically required (zero callers means zero runtime impact). Standard "match starts, vehicles spawn, deploy works" sanity pass is sufficient.

### 1.3 Consolidate triangle-sampling helpers into shared module

**Files involved:**
- [src/vehicles/forward-spawn-volume.ts](bf6-portal/dev/conquest/src/vehicles/forward-spawn-volume.ts) lines 14-43 — `triangleAreaXZ`, `samplePointInTriangle`, helpers used by Forward Deploy random sampling.
- [src/vehicles/air-spawn-volume.ts](bf6-portal/dev/conquest/src/vehicles/air-spawn-volume.ts) lines 17-56 — `airTriangleAreaXZ`, `airSamplePointInTriangle`, rename-only duplicates of the forward set per v1.338 audit.
- **New:** `src/vehicles/spawn-volume-math.ts` — extract shared math.

**Action:**
1. Create new file with the shared functions (use the canonical names from `forward-spawn-volume.ts`).
2. Update `forward-spawn-volume.ts` to import + use them; delete its local copies.
3. Update `air-spawn-volume.ts` to import + use them; delete the `air*`-prefixed copies and their call sites.

**Risk:** **MEDIUM.** Behavior must be byte-identical. v1.338 audit verified no axis/edge-case divergence, but the consolidation must preserve:
- Random sampling distribution (same RNG path, same parametrization).
- Triangle-area sign convention (the math is XZ-projected — confirm both versions project the same way, no Y-axis swap).
- Quad-fan triangulation order (the `floorCorners` are typed as a 4-tuple; both files fan from the same corner).

**Pre-edit verification (DO BEFORE EXTRACTION):**
- Side-by-side diff of `triangleAreaXZ` vs `airTriangleAreaXZ` — must be byte-identical except for the function name. **If any non-trivial difference is found, STOP and document it before proceeding.**
- Same for `samplePointInTriangle` vs `airSamplePointInTriangle`.
- Same for any `volumeQuadArea*` helpers.

**Post-edit verification:**
- tsc + build clean. Bundle decreases ~1,000 bytes.
- `grep -rn 'airTriangleAreaXZ\|airSamplePointInTriangle\|airVolumeQuadAreaXZ' src/` — must return zero matches (confirms cleanup is complete).

**Behavioral test plan (CRITICAL — this is the highest-risk Tier 1 item):**
1. **Forward Deploy × 3 attempts:** click Forward button on a ground slot. Each spawn must land inside the team's authored forward polygon (visually confirm by spawn position). Vehicle must face the correct rotation per `slot.nextForwardRot`.
2. **Air Deploy heli × 3 attempts:** Each must land at heli altitude (~250m above ground, per `heliSpawnCeiling`). Rotation = `rotHeli`.
3. **Air Deploy jet × 3 attempts:** Each must land at jet altitude (~750m). Rotation = `rotPlane` with the -45° pitch component preserved.
4. **No spawn outside polygon:** if any of the above lands outside the configured volume, the consolidation broke something — REVERT.

**Rollback plan:** if behavioral test fails, `git restore` the three files. The version bump can roll forward to v1.372 directly.

---

## v1.372 — Tier 2: VehicleSpawnerSlot field audit + cut

Estimated reclaim: ~300-500 bundle bytes. Target headroom after: ~1.7%.

### 2.1 Audit three suspected dead fields

**File:** [src/state/runtime-types.ts](bf6-portal/dev/conquest/src/state/runtime-types.ts) (type definitions), various write sites in `src/vehicles/`.

**Fields under audit (from optimization analysis Category 1.5 / Category 3 MEDIUM-confidence list):**

| Field | Optimization analysis claim | What we re-verify |
|-------|-----------------------------|-------------------|
| `spawnRetryScheduled` | Written once, "may be load-bearing in a busy gate check" | Find every read site; trace whether the read affects control flow |
| `freshAirRuntimeSpawner` | Declared, set to undefined at init, "zero reads found" | Re-confirm zero reads across `src/` |
| `suppressNextBindSpawnTransformCorrection` | Assigned at init, "no re-assignment found" | Re-confirm zero reads; document any historical reason |

**Audit process (DO NOT REMOVE until this completes):**

For each field:
1. `grep -rn '<fieldName>' src/` — collect every occurrence.
2. Classify each occurrence as: type-definition, write, read, or comment.
3. For each read found:
   - Trace the conditional/expression it gates.
   - Determine if removing the read changes runtime behavior.
4. Document findings inline in this plan section before any code edit.

**Decision rule:**
- If a field has zero reads → safe to remove (definition + all writes).
- If a field has reads but the reads are dead-code (e.g., always-false branch) → safe to remove.
- If a field has live reads → leave it alone, update the optimization analysis to note "live, retain".

**Risk:** **MEDIUM.** `spawnRetryScheduled` is the highest concern — the optimization analysis flagged it as possibly load-bearing in a "busy gate" check. Misclassifying it as dead would break the spawn-retry pathway, which manifests as: vehicle slot stuck in `expectingSpawn=true` after a failed `ForceVehicleSpawnerSpawn`, no respawn fires. Symptoms would be subtle and intermittent under MP.

**Behavioral test plan (run AFTER any field is removed):**

This is the canonical "vehicle spawn flow regression" suite. Run all in single-player on Firestorm:

1. **Vanilla deploy + respawn cycle (all 8 slots):**
   - Set Game Mode = Vanilla. LIVE the match.
   - For each slot 1-8 across both teams: get in vehicle, drive away, kill it (DealDamage or wreck).
   - Verify all 8 vehicles respawn within `respawnDelaySeconds`.
2. **HQ Deploy click flow (all slots, all categories):**
   - Set Game Mode = HQ. LIVE.
   - Click each HQ button. Verify vehicle spawns at HQ pad and player gets seated within ~2 seconds.
3. **Forward Deploy × all 4 ground/transport slots:**
   - Forward Deploy enabled in ready dialog.
   - LIVE, wait for `roundStartForwardDeployDelay` (90s on Firestorm).
   - Click Forward on each ground slot. Verify vehicle teleports to forward point with loadout.
4. **Air Deploy × all 4 aircraft slots (heli + jet):**
   - Air Deploy enabled.
   - LIVE, wait for `roundStartAirDeployDelay` (60s).
   - Click Air on each aircraft slot. Verify altitude correct (heli ~250m, jet ~750m, jet pitch = -45°).
5. **Vehicle type swap mid-pre-live:**
   - On NOT_READY, change a slot's vehicle type via ready dialog (e.g. Cheetah → Gepard, Falchion → Black Hawk).
   - LIVE. Confirm slot spawns the NEW type, not stale prior type.
6. **Live-start fleet reset:**
   - On NOT_READY, get vehicles spawning via Vanilla mode preview.
   - Click Apply Configuration to trigger LIVE → fleet should sink-and-destroy then respawn the fresh configured fleet.
7. **Stuck-slot watchdog:**
   - If any slot remains empty / `expectingSpawn=true` for >30 seconds in any of the above: BLOCKER. Likely cause: a removed field was load-bearing.

**Rollback plan:** if any test fails, `git restore` the field-removal commit. Field stays in `runtime-types.ts`. Update the audit findings inline to mark "live, retain" with the discovered read site.

---

## v1.373 — Tier 3: Architecture parallel audits (audit only, no code changes)

This version produces audit findings, not code changes. If anything actionable is discovered, it gets logged to `conquest_issues.md` with a CQ tag and queued for a separate planned change.

### 3.1 Engine-object enable audit

**Goal:** Generalize the v1.367 lesson — `mod.EnableAreaTrigger` was missing, silently breaking event delivery for ~50 versions. Find any other engine objects in our codebase that require an explicit enable call we may have missed.

**Capture points are explicitly excluded** from this audit per user feedback: they use `CapturePoint` event handlers (`OnPlayerEnter/ExitCapturePoint`, `OnCapturePointCaptured`, `OnCapturePointLost`, `OngoingCapturePoint`), NOT the `AreaTrigger` family. The EnableAreaTrigger lesson does not transfer.

**In-scope SDK functions to investigate:**
- `mod.EnableInteractPoint(interactPoint, enable)` — InteractPoints are heavily used (ready dialog, vehicle deploy menus, world interactables, ammo resupply). Existing call sites need review.
- `mod.EnableSpatialObject(spatialObject, enable)` — research what SpatialObjects are in our codebase.
- Any other `Enable*` SDK function found in [reference_bf6_core/mod/functions/](bf6-portal/dev/reference_bf6_core/mod/functions/).

**Audit process:**
1. Enumerate every `Enable*` function in the SDK reference.
2. For each: identify what objects of that type exist in our codebase.
3. For each object usage: confirm whether the engine's default state (enabled vs disabled on map load) requires an explicit script call to flip.
4. Compare against existing call sites: do all object instances get the right enable state?

**Risk:** **LOW** for the audit itself (no code changes). Risk only materializes if findings reveal a latent bug, which we'd then plan separately.

**Output:** A short summary appended to `conquest_issues.md` as either:
- `CQ_Audit_Engine_Enable_Calls`: **Clean** — all required Enable* calls are wired correctly, OR
- `CQ_Audit_Engine_Enable_Calls`: **Findings** at locations X, Y, Z — file a separate v1.374+ plan to address.

### 3.2 Capture-point engagement state audit

**Goal:** Apply the general principle behind v1.369 (cache at events, read pure state) to the capture-point system. Verify there's no per-tick polling of engine state that could be cached.

**User-corrected scope reminder:** capture points use a different SDK surface than AreaTriggers. The principle of "cache at events" is general; the specific implementation (whether it's broken in the same way as the AreaTrigger system was) is unknown until we audit.

**Audit process:**
1. Map every read of `State.conquest.capture.engagedObjIdByPid[pid]` and `State.conquest.capture.byObjId[objId]`. Are they purely event-driven or does any read trigger an engine query?
2. Search for `mod.GetCapture*` / `mod.GetPlayersOnPoint` calls in hot paths. Each occurrence: is it cached, or does it re-query per tick?
3. Look for the same pattern that bit us at v1.358 (per-tick `mod.GetVehicleFromPlayer`) — engine state read inside a `forEachValidPlayer` loop without caching.

**Risk:** **LOW.** Audit-only.

**Output:** Same as 3.1 — log clean or log findings with a follow-up version plan.

---

## Build health gates (all three versions)

After each version's edits:
- `npm run bumpVersion -- -c "..."`
- `npm run build` PASS, bundle below 1,048,576 bytes.
- `cmd /c npx tsc --pretty false --noEmit` exit 0.
- Report bundle delta vs prior version.

After each version's edits AND smoke tests pass:
- Update `conquest_issues.md` with a CQ entry summarizing what changed.

---

## Sequencing notes

- Tier 1 ships independently. Each of 1.1, 1.2, 1.3 can be reverted in isolation if their behavioral test fails.
- Tier 2 should not ship until Tier 1 is verified clean — overlapping vehicle-spawner edits would muddy a regression search if both rolled at once.
- Tier 3 is audit-only and can run any time. If audit findings are surprising, defer their implementation to a separate plan rather than bundling with v1.373.

## What this plan does NOT do

- Touch `src/admin-panel/*` (Tier 5, deferred).
- Split mega-files (Tier 5, zero bundle impact, readability only, deferred).
- Investigate `CQ_Bug_Loadout_Not_Respected` (Tier 4, gameplay quality, separate plan).
- Investigate `CQ_Bug_Abrams_Substitution_Transport_Slot_Regression` (Tier 4, separate plan).
- Apply the EnableAreaTrigger lesson to capture points (user-clarified out of scope).
