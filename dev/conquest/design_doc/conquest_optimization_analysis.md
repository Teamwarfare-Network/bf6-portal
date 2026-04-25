# TWL Conquest Optimization Analysis

Last updated: v1.370 (2026-04-25) — boundary architecture stabilized (zone tracker → AreaTrigger enable → event-driven seatKind → squad-spawn inheritance, v1.360–v1.370). Refreshed TL;DR, baseline, H3 description, and priority list.
Earlier baseline (v1.338): match clock H2 resolved; H1 downgraded post-measurement; Category 1.1 / 1.2 estimates corrected; Admin Panel reclaim arithmetic retired. Carried forward where still accurate.
Companion to: `TWL_Conquest_Design.md` (see "Codebase Reference Map" for file/function index) and `conquest_issues.md`.

---

## TL;DR (v1.370)

1. **Bundle headroom at 1.53%.** v1.370 emits **1,032,490 bytes** against the 1,048,576-byte cap — **16,086 bytes of headroom.** Net +9,013 bytes across v1.339–v1.370 (boundary architecture work, mostly in v1.360–v1.370). Bundle pressure has tightened beyond the v1.010 / v1.338 lows. Any new feature requires offsetting cuts.
2. **Boundary architecture is now event-driven, single-source-of-truth for both zone state and seat state.** The classifier `getDesiredBoundaryViolationKind` is a pure read. No per-tick `mod.GetVehicleFromPlayer` / `mod.CompareVehicleName`. See `design_doc/event_driven_seat_state_plan_2026-04-25.md` and `squad_spawn_zone_inheritance_plan_2026-04-25.md`.
3. **AreaTriggers required explicit enabling** — `mod.EnableAreaTrigger(trigger, true)` was never called pre-v1.367, which silently broke trigger enter/exit events for ~50 versions. Now wired in `enableBoundaryAreaTriggers()` from `onGameModeStartedImpl`. Same lesson generalizes: **engine objects with explicit enable calls should be audited at game-mode start**.
4. **No remaining runtime HIGH hot paths.** H1 cleanup (consume TickContext at `pipeline.ts:125`) is still open as low-priority cleanup. H2 retired in v1.338. H3 (boundary tick) reshaped — see Category 2 update below; classifier is now O(1) per player on the read side, not O(engine query).
5. **Admin Panel accepted off indefinitely.** Last measurement at v1.334 was −3,536 bytes over cap when enabled (+28,635 byte panel delta). Bundle has grown +9K since then; gap is now ~−13K over cap. Re-enabling requires trimming `src/admin-panel/*` directly, not accumulating Category 1 items.
6. **Dead code inventory — small, opportunistic.** ~54 lines HIGH-confidence safe to remove (Category 3) for ~1.8K source / ~1K bundle bytes. Won't close the Admin Panel gap on its own.

**Playtest-blocking items:** none.

---

## Baseline (v1.334)

| Metric | v1.334 | v1.289 (prior published baseline) | Delta |
|--------|--------|----------------------------------|-------|
| Bundle size (script) | **1,023,477 bytes** | 968,479 bytes | **+54,998 bytes** |
| Bundle limit | 1,048,576 bytes (1 MiB) | same | — |
| Headroom | **25,099 bytes (2.39%)** | 80,097 bytes (7.64%) | **−54,998 / −5.25 pp** |
| Headroom with `FEATURE_ADMIN_PANEL=true` | **−3,536 bytes (OVER cap)** | — | — |
| Source files | 119 .ts + 1 .json (est. unchanged) | 119 .ts + 1 .json | — |
| `mod.AllPlayers()` call sites | 29 | 29 | flat |
| All four `FEATURE_*` flags | still `false` | all `false` | flat |

**Headroom status: TIGHT.** The v1.290–v1.334 feature arc (gadget locker refactor in v1.290–v1.313, Forward Deploy in v1.328, Air Deploy in v1.329, Phase 2a/2b loadout fix in v1.333/v1.334) consumed 55K of the 80K v1.289 reserve. The 2.39% margin is near the 2.2% floor of v1.010. **Bundle pressure returned** — any new feature needs to plan for offsetting cuts.

### Admin Panel Bundle Cost — Empirical Measurement

Measured at v1.334 by flipping `FEATURE_ADMIN_PANEL` from `false` to `true`, running `npm run build`, capturing size, then reverting the flag to `false` and rebuilding to restore the known-good state. No persistent code change.

| State | Bundle size | Headroom | Status |
|-------|-------------|----------|--------|
| `FEATURE_ADMIN_PANEL = false` | 1,023,477 bytes | 25,099 (2.39%) | PASS |
| `FEATURE_ADMIN_PANEL = true` | **1,052,112 bytes** | **−3,536 (OVER)** | FAIL |
| Admin panel delta | **+28,635 bytes** | — | — |

**Implication (original, now corrected below):** Admin panel costs ~28.6K of bundle space. Re-enabling it requires cutting at least ~4K of other code to clear the cap, and closer to ~10–15K to leave working headroom.

**Correction (2026-04-21, post-v1.338).** The "reclaim-to-re-enable via Category 1" plan does not close. Measured reclaim at v1.338:

| Lever | Prior estimate | Measured | Confidence |
|---|---|---|---|
| 1.1 widget factory | 2,000–4,000 | 120–415 | HIGH |
| 1.2 comment audit | 500–1,500 | 100–300 | HIGH |
| 1.3 triangle math | 1,200 | ~1,000–1,200 | HIGH |
| 1.4 dead helpers | 360 | 300–400 | HIGH |
| **Total plausible** | **4,060–7,060** | **1,520–2,315** | — |

Measured best case (~2.3K) is **−26,320 bytes short** of the panel's +28,635 byte delta. If re-enable becomes a goal later, the right investigation is a **trim audit of `src/admin-panel/*` itself** (redundant widgets, over-detailed per-player mirror rows, unused code paths), not accumulating Category 1 items.

**Admin Panel accepted off for the 2-day-out 64-player playtest** (user decision 2026-04-21). Re-enable deferred indefinitely.

## Size Progression

| Version | Bundle | Headroom | Delta | Notable work |
|---------|--------|----------|-------|--------------|
| v1.010 | 1,025,710 | 22,866 (2.2%) | — | Phase 6 complete baseline |
| v1.110 | 1,038,559 | 10,017 (1.0%) | +12,849 | CQ_Bug_39 hardening — low-water mark |
| v1.190 | 995,854 | 52,722 (5.03%) | **−42,705** | Audit pass: 3 dev flags→false, 52 stale widget names, safeFindPlayer hot-path |
| v1.213 | 1,001,081 | 47,495 (4.53%) | +5,227 | Phase 10 feature adds; FEATURE_WORLD_ICON_DIAG removed |
| v1.221 | 998,868 | 49,708 (4.74%) | −2,213 | Stability/perf pass: loading-gate asserts, TickContext, dirty-flag HUD, forEachValidPlayer |
| v1.259 | — | — | **−~25K** (est.) | Vanilla spawner rewrite. Deleted 6 legacy files (~60K source); added vanilla-spawner.ts (~25K). |
| v1.289 | 968,479 | 80,097 (7.64%) | −30,389 from v1.221 | Phase 6 HQ Deploy (hq-deploy.ts ~13K added). All 4 FEATURE_* flags now `false`. |
| v1.313 | — | — | ~+15K | Gadget Locker + launcher-slot probe arc (ammo-resupply-menu +496 lines) |
| v1.328 | — | — | ~+10K | **Forward Deploy reintroduction.** Fresh code on single-persistent-spawner infra. |
| v1.329 | — | — | ~+5K | **Air Deploy reintroduction.** Symmetric with Forward Deploy. |
| **v1.334** | **1,023,477** | **25,099 (2.39%)** | **+54,998 from v1.289** | Phase 2a/2b loadout fix: pre-seat vehicle Teleport deferred to post-`ForcePlayerToSeat`. |

**Direction vs. prior report:** **UP** from v1.289 baseline (+54,998 bytes). Returned to v1.010 / v1.110 class headroom.

---

## Category 1: File Size Reduction

| # | Title | Est. Savings (measured v1.338) | Impact | Effort | Status |
|---|-------|-------------|--------|--------|--------|
| 1 | Widget-name factory (residual conversion in 2 files) | **120–415 bytes** (was: 2,000–4,000) | Low | Low-Med | **Open — CORRECTED v1.338.** Factory already adopted across 230+ sites; residual only. |
| 2 | Emitted comment / JSDoc audit (residual) | **100–300 bytes** (was: 500–1,500) | Low | Low | **Open — CORRECTED v1.338.** Postbuild already strips full-line `//`. |
| 3 | Consolidate duplicate triangle-sampling helpers (`forward-spawn-volume.ts` + `air-spawn-volume.ts`) | ~1,000–1,200 bytes | Low | Low-Med | **Open — measured HIGH confidence (v1.338)** |
| 4 | Remove 2 verified-dead vehicle-path helpers (`clearAllVehicleReservations`, `getDesiredSpawnerCountsForPreset`) | ~300–400 bytes | Low | Low | **Open — measured HIGH confidence (v1.338)** |
| 5 | Audit `VehicleSpawnerSlot` for 3 write-only/unread fields | ~400 bytes | Low | Low | **Open** — needs read-site verification before removal |
| 6 | Three 2K-line mega-files — split for navigability only | 0 bundle bytes | Med (readability) | Med-High | **Open — carry-over** |
| 7 | Post-v1.259 dead-module import scrub | ~0 bytes | Low | Low | **Resolved** — confirmed clean in v1.289 audit |

### 1.1 Widget-name factory — ALREADY IMPLEMENTED (most files); residual ~120–415 bytes

`wn(prefix, pid, ...parts)` exists at `src/state/ui-helpers.ts:5-11` and is adopted across 230+ call sites (including all of `src/boundary/prompt-ui.ts`). Remaining unconverted files (in-bundle) are:

- `src/vehicles/deploy-timer-ui.ts` — 4 conversion points (lines 78–84, 1734–1735). Measured savings: **~120 bytes**.
- `src/interaction/ammo-resupply-menu.ts` — 59 call sites behind the `ammoResupplyMenuName()` wrapper at line 200. Refactoring the wrapper to use `wn()` internally is bundle-neutral. Inlining the wrapper at every callsite could save ~295 bytes but adds string duplication risk.
- `src/admin-panel/build.ts` — gated behind `FEATURE_ADMIN_PANEL=false`, excluded from current bundle.

**Realistic net: 120–415 bytes**, not 2,000–4,000 as the earlier estimate claimed. Priority: LOW. The prior "raise to HIGH" framing was based on a stale estimate that predated the factory's wide adoption.

### 1.2 Emitted comment / JSDoc audit — MOSTLY AUTOMATED; residual ~100–300 bytes

`scripts/postbuild.js:114` already strips full-line `//` comments via `src.replace(/^[ \t]*\/\/.*\n/gm, "")`. Verified at v1.338 audit.

Residual categories not caught by the regex:

- Inline trailing `//` comments (`const x = 5; // reason`) — regex is line-anchored (`^`), so it leaves these alone.
- Multi-line `/* */` blocks (rare in this codebase; not stripped).
- `/** */` JSDoc preceding exported symbols — 4 blocks total across the three mega-files.

**Realistic net: 100–300 bytes**, not 500–1,500. Priority: LOW. Prior estimate predated the postbuild regex.

### 1.3 Duplicate triangle-sampling helpers — measured HIGH confidence (v1.338)

`src/vehicles/air-spawn-volume.ts:17-44` defines `airTriangleAreaXZ` (1,174 source bytes) — rename-only duplicates of `src/vehicles/forward-spawn-volume.ts:14-36`'s `triangleAreaXZ`, `samplePointInTriangle` (980 source bytes). Measurement at v1.338 confirmed no coordinate-axis or edge-case divergence.

Consolidate into `src/vehicles/spawn-volume-math.ts`:
- Remove: 2,154 source bytes across both files.
- Add: new module (~500 bytes) + 2 imports (~160 bytes) + rename call-sites (~50 bytes).
- **Net source: −1,240 bytes. Post-minification estimate: ~1,000 bytes reclaim.**

### 1.4 Two verified-dead helpers — measured HIGH confidence (v1.338)

Zero-call-site removals confirmed via grep at v1.338:
- `src/vehicles/vanilla-spawner.ts:79-82` — `clearAllVehicleReservations()` is a 3-line no-op explicitly marked as an orphan from the v1.259 rewrite, called once from `src/conquest-flow.ts:66` for interface compat. Callsite + wrapper both removable. ~76 bytes.
- `src/vehicles/vanilla-spawner.ts:63-69` — `getDesiredSpawnerCountsForPreset(presetIndex)` has zero callers across the entire `src/` tree. ~313 bytes.

**Combined: ~300–400 source bytes. Post-minification estimate: ~280–320 bytes.** Free; no risk.

### 1.5 Three write-only / no-read `VehicleSpawnerSlot` fields — NEW (v1.334, MEDIUM confidence)

`src/state/runtime-types.ts` — three fields warrant a read-site sweep before removal:
- `spawnRetryScheduled` — written once, read in a "busy" gate check only (may still be load-bearing).
- `freshAirRuntimeSpawner` — declared, set to undefined at init, never re-assigned. Zero reads found in audit.
- `suppressNextBindSpawnTransformCorrection` — assigned at init, no re-assignment found.

These are inherited from the v1.258–v1.259 rewrite and may be hangovers. **Do not remove pre-playtest** — verify read sites first. Savings is minor (~400 bytes type defs + small scattered assignment sites).

### 1.6 Mega-file splits — carry-over, still LOW (zero bundle impact)

| File | Lines (v1.313) | Lines (v1.334 est.) | Notes |
|---|---|---|---|
| `index/capture-tickets.ts` | 2,150 | ~2,150 | Stable; Phase 2A sync + bleed + 7 combat HUD view models + dispatch |
| `vehicles/deploy-timer-ui.ts` | 2,026 | ~2,026 | HQ/Forward/Air button wiring and pending-state header |
| `interaction/ammo-resupply-menu.ts` | 2,504 | ~2,504 | Gadget-delay status header, launcher tile gating, per-class slot-toggle row, launcher-slot probe |

Bundler concatenates — splits are for review readability, not bundle size. Priority remains low; not a playtest concern.

---

## Category 2: Per-Tick and Recurring Hot Paths — Updated for 64-Player MP

Audit context: 29 `mod.AllPlayers()` call sites across 21 files. TickContext caches per-subtick. Combat HUD dirty-flag gating active. Verified via targeted grep at v1.334.

### HIGH severity (playtest-blocking if a spike shows up)

**None currently open.** H1 downgraded to MED at v1.338 post-measurement (see below). H2 resolved at v1.337 + v1.338. H3 is a verification-only item.

| # | File:line | What it does | Cost @ 64p | Mitigation |
|---|-----------|-------------|-----------|------------|
| ~~**H1** (was HIGH, now MED)~~ | — | — | — | **Downgraded — see MED table below.** |
| **H2** | ~~`src/clock/state.ts:150-189` (`updateAllPlayersClock`)~~ | ~~Raw `mod.AllPlayers()` + per-player 8–10 widget writes when display seconds change.~~ | ~~O(N) AllPlayers + O(N×M) widget writes~~ | **RESOLVED v1.337 (Phase A gate) + v1.338 (Phase B `Clocks.CountDownClock` migration).** See "v1.337 / v1.338 — Match Clock Resolution" below. Also: original "5,120+ writes/sec" framing was incorrect — caller `index/game-mode.ts` was already gated to 1 Hz via `nowSecondBoundary !== lastSecondBoundary`. Real per-64p cost was ~64 per-player ops/sec, and Phase A's `lastDisplayedSeconds`/`lastLowTimeState` gate now short-circuits the identical-second repeats. Phase B makes the 1 Hz tick self-driven (no longer runs from game-mode loop). |
| **H3 (reshaped v1.369)** | `src/boundary/enforcement.ts` `tickBoundaryEnforcement` | `forEachValidPlayer` tick per second → `refreshPlayerBoundaryState(player)` → `getDesiredBoundaryViolationKind`. The classifier is now a **pure read** of cached `zoneStateByPid[pid]` (zone flags + `seatKind`). The only engine call inside the classifier is `safeGetSoldierStateVector` for the foot-Y-ceiling check, gated on `state.seatKind === "on_foot"`. | O(N) iteration with O(1) per-player work (one position read per foot player, none for vehicle occupants) | **No further action required.** Per-tick polling for vehicle/seat state was eliminated in v1.369 — the prior `mod.GetVehicleFromPlayer` / `mod.CompareVehicleName` chain ran once per tick per player and was the actual cost driver under the old design. Current shape is acceptable for 64p. |

### MED severity (non-blocking but worth watching)

| # | File:line | What it does | Cost @ 64p | Notes |
|---|-----------|-------------|-----------|-------|
| **H1 (downgraded v1.338)** | `src/ui/conquest/hud-core/pipeline.ts:125` (`twlConquestHudTickFrame`) | Raw `mod.AllPlayers()` bypassing an active TickContext. | ~0 in steady state (dirty-gated); on mutation, one O(N) `AllPlayers()` per dirty-tick. Per-player body is pure 7-slot read-through — no `safeFindPlayer`, no widget writes. | **Severity reclassified from HIGH to MED at v1.338.** The full loop is gated by `State.conquest.debug.hudDirty` at `src/index/capture-tickets.ts:2119` — does not run in steady-state play. TickContext is active; the call simply doesn't consume `getActiveTickContext().players`. Fix is ~5–10 lines (cleanup, not a latency fix). Same "overstated severity" pattern as H2 was before measurement. |
| M1 | `src/ui/conquest/hud-core/render.ts:93-181` (`twlConquestHudBuildSnapshotForPlayer`) | Per-player snapshot builder with 7-slot loop + engage panel. Called once per player per HUD frame. | O(N×7) | Dirty-flag gated + 0.25s cadence. Per-player work is O(constant slot count), not player-count-dependent. Safe. |
| M2 | `src/index/capture-tickets.ts:180-187` (`conquestPhase3RefreshTopHudDerivedSlicesForAllPlayers`) | Per-player derived slice (help/ready, status, clock) every tick, **not** dirty-flag gated. | O(N×3) | Intentional (clock is time-variant); documented in AGENTS.md dirty-flag contract. Keep as-is. |
| M3 | `src/vehicles/deploy-timer-ui.ts:1986-1988` (`updateVehicleDeployTimerHudForAllPlayers`) | 1 Hz refresh of per-slot × per-player vehicle timer widgets. | O(N × slot-count) | Uses `forEachValidPlayer`. Cadence is 1s — forgiving. Verify per-player body is O(1) per slot, not O(slots²). |

### LOW severity (verified safe)

- `src/index/capture-tickets.ts:38-54` — `conquestPhase2AClearInactiveEngagedObjectiveOwners` iterates sparse engaged-players map (~4–8 keys typical), not all 64. O(E) where E << N.
- `src/index/capture-tickets.ts:1409-1444` — `conquestPhase3GetFlagEngageDisplayForViewer` reads pre-computed `onPointTeam1/2` counters; no inner rescan.

**No O(N²) nested player loops found.** No `forEachValidPlayer → forEachValidPlayer` pattern. Engage panel derivation does not rescan all players.

### Prior Category 2 items carried forward

| # | Title | Status |
|---|-------|--------|
| 1 | Cache `mod.AllPlayers()` once per tick — TickContext | **Resolved** (v1.219) — but bypassed at H1 and H2 above; fix upstream callers. |
| 2 | Gate combat HUD render behind dirty flag | **Resolved** (v1.221) — working as designed. |
| 3 | Replace string signatures with generation counters | **Open — low priority** — several HUD families still use `"v:${visible}|pid:..."` signatures. |
| 4 | Cache widget refs in hot render paths | **Resolved** (v1.215). |
| 5 | Skip boundary checks for unmoving/undeployed | **Resolved** (undeployed skip). Position-delta skip still open but not blocking. |
| 6 | HQ Deploy seat-flow polling loop | **Open — low priority.** |
| 7 | `safeFind` call count | Flat vs. v1.221 (~342). Not a hot-path regression. |

---

## Category 3: Dead Code Inventory (Document Only — No Deletions)

Per user instruction: this section inventories verified dead or dying code for future cleanup. **No code is being deleted as part of this pass.**

### HIGH confidence (zero call sites or explicit orphan markers)

| File:line | Symbol | Why dead | Size |
|-----------|--------|---------|------|
| `src/vehicles/vanilla-spawner.ts:79-82` | `clearAllVehicleReservations()` | Function body is a comment: "Kept as no-op for endMatch call-site compatibility. Reservations are gone." Called once from `conquest-flow.ts:66`. | ~3 lines |
| `src/vehicles/vanilla-spawner.ts:63-69` | `getDesiredSpawnerCountsForPreset(presetIndex)` | Zero callers anywhere in source tree (grep-verified). | ~6 lines |
| `src/vehicles/air-spawn-volume.ts:17-56` | `airTriangleAreaXZ`, `airSamplePointInTriangle`, `airVolumeQuadAreaXZ` | Exact functional duplicates of `forward-spawn-volume.ts:14-43` equivalents. Both files are imported, but one copy is redundant. Consolidate into a shared module. | ~45 lines |

**HIGH-confidence total: ~54 lines / ~1.8K production source bytes.**

### MEDIUM confidence (needs read-site verification before removal)

| File:line | Symbol | Why suspect | Size |
|-----------|--------|------------|------|
| `src/state/runtime-types.ts` | `VehicleSpawnerSlot.spawnRetryScheduled` | Written once (vanilla-spawner init ~line 260), read only in a "busy" gate check. May be redundant with the claim-lifecycle fields. | 1 line type def + scattered uses |
| `src/state/runtime-types.ts` | `VehicleSpawnerSlot.freshAirRuntimeSpawner` | Declared, set to undefined at init, never re-assigned. Zero reads found in audit. | 1 line type def |
| `src/state/runtime-types.ts` | `VehicleSpawnerSlot.suppressNextBindSpawnTransformCorrection` | Assigned at init, no re-assignment found. Possibly a leftover from the v1.258 rewrite's snap-to-spawner bug. | 1 line type def |

### LOW confidence (do not remove without a deliberate refactor pass)

- `VehicleSpawnerSlot.availabilityPhase` (enum, 6 variants) — 1 read site in `deploy-timer-ui.ts:182`; may be UI-only but warrants deeper verification.
- `VehicleSpawnerSlot.nextForwardPos/Rot` / `nextAirPos/Rot` — actively written by sampling helpers and read by Phase 2a/2b post-seat Teleport (v1.333/v1.334). Not dead; flagged here only because the pre-seat Teleport call-site was removed in v1.333.

### Feature-flag-gated files (NOT dead — excluded from bundle)

`src/hud/deploy-diagnostic.ts` (218 lines), `src/hud/position-debug.ts` (359 lines), `src/hud/perf-diag.ts` (345 lines), and the four `admin-panel/*` files are included in source but excluded from the bundle by `prebuild.js` + postbuild dead-code strip when their flags are `false`. They are **not dead code** — they are conditional features ready to re-enable. The bundle treats them correctly.

### Post-v1.259 dead-module scrub — still clean

Grep confirmed: no surviving imports or type references to `deploy-fulfillment`, `reservations`, `spawner-sequence`, `spawner-bind`, `spawner-slots`, `spawner-bootstrap`. The v1.259 rewrite was surgically clean.

---

## Category 4: Clock / Timer Module Reuse Opportunities

Two reusable primitives already exist in the codebase:
- `src/foundation/bf6-utils/timers.ts` — `Timers` namespace: drift-free `setTimeout`/`setInterval`/`clear` portable over Portal's time source.
- `src/foundation/bf6-utils/clocks.ts` — `Clocks` namespace: `BaseClock`, `CountUpClock`, `CountDownClock` with drift-corrected `onSecond`/`onMinute`/`onComplete` callbacks.
- `src/clock/timer-instance.ts` — reusable MM:SS widget builders, already used for vehicle deploy timer readouts.

Many places still roll their own timing. Candidates ranked by value:

### HIGH value (cleaner + drift-correct)

1. **`src/index/capture-sound.ts:150-158`** — Manual `lastFlushAtSeconds` tracking with `(now - lastFlush) < CONQUEST_CAPTURE_SOUND_FLUSH_SECONDS` check per tick. Migrate to `Timers.setInterval` with a 0.5s cadence. Removes per-tick compare; auto-correct drift.
2. **`src/index/capture-vo.ts:351-354`** — Per-recipient VO cooldown with `lastEventAtByThrottleKey` map + manual compare. Migrate to per-key `Timers.setTimeout` lockouts. Eliminates the map-scan cost and the compare logic.
3. ~~**`src/clock/state.ts`** — Match clock currently polls `mod.GetMatchTimeElapsed()` directly. Candidate for `Clocks.CountDownClock` with `onSecond` → `updateAllPlayersClock()` (and in doing so, fix hot-path H2 from Category 2 by running only on second-boundary, not every subtick).~~ **RESOLVED v1.338.** See "v1.337 / v1.338 — Match Clock Resolution" below.

### MED value (small cleanup, consistency)

4. **`src/interaction/actions.ts:737`** — `teamSwapPerspectiveLockUntilByPid[pid] = elapsed + LOCK_SECONDS` + per-tick expiry poll. Migrate to `Timers.setTimeout(() => clearFlag(pid), LOCK_MS)`.
5. **`src/state/spawn-charge.ts:46-48`** — 1-second debug snapshot throttle via `lastDebugEmitAtSeconds`. Migrate to `Timers.setInterval(emitSnapshot, 1000)`. Debug-only; low priority.

### LOW value (already modern or intentional)

- `src/vehicles/deploy-timer-ui.ts` — already reads from `slot.respawnClock` (`Clocks.CountDownClock`). Good.
- `src/ready-dialog/countdown-flow.ts:70-86` — uses `mod.Wait()` for animation pacing. Fine.
- `src/utils/multi-click.ts:31-33` — `Date.now()` ms-granular interaction timing; intentional, not game-time.
- `src/vehicles/hq-deploy.ts:80-82, 132-157` — cooldown read from `mod.GetMatchTimeElapsed()` comparison (O(1) integer check); migration marginal.

### Proposal

**If Category 4 Item 3 lands (match clock → `Clocks.CountDownClock`),** the Category 2 H2 hot path gets fixed for free: the per-subtick `updateAllPlayersClock()` call disappears and is replaced by a per-second `onSecond` callback wrapped in TickContext. This is the single highest-leverage architectural tidy-up available pre-playtest and it retires two items at once.

---

## v1.337 / v1.338 — Match Clock Resolution

**Scope:** Category 2 H2 hot path + Category 4 HIGH item 3. Both retired.

**v1.337 (Phase A — early-return gate):**
- Added `if (lastDisplayedSeconds === displayRemaining && lastLowTimeState === clockColorIsLow) return;` at `clock/state.ts:150`, before the per-player loop.
- Bundle delta: +174 bytes. No API surface change.
- Effect: when the caller's 1 Hz tick fires with identical display state (e.g., paused preview), the entire per-player loop short-circuits. Eliminates ~64 unconditional per-player ops/sec at steady state.

**v1.338 (Phase B — `Clocks.CountDownClock` migration):**
- Added `countdown?: Clocks.CountDownClock` to `State.round.clock` sub-state ([runtime-types.ts](bf6-portal/dev/conquest/src/state/runtime-types.ts), [runtime-state.ts](bf6-portal/dev/conquest/src/state/runtime-state.ts)).
- Rewrote `resetMatchClock`, `setMatchClockPreview`, `getRemainingSeconds`, `adjustMatchClockBySeconds` in [clock/state.ts](bf6-portal/dev/conquest/src/clock/state.ts) to drive the `CountDownClock` instance. Existing shadow fields (`durationSeconds`, `matchStartElapsedSeconds`, `pausedRemainingSeconds`, `isPaused`) stay in sync for external readers (`capture-tickets.ts:376-388` viewmodel, `interaction/actions.ts:145-148`, `admin-panel/events.ts:59`).
- New `onClockSecond` callback (per-second HUD repaint, pausedRemainingSeconds shadow refresh) + `onClockComplete` callback (single-fire expiry handler dispatch, idempotent via `expiryFired` guard).
- Removed both `updateAllPlayersClock()` calls from `index/game-mode.ts` tick loop — clock now self-drives. Scoreboard sync still runs on the same 1 Hz boundary gate. Removed dead `clockUpdatedThisLoop` local.
- Added `State.round.clock.countdown?.pause()` to `endMatch` in [conquest-flow.ts](bf6-portal/dev/conquest/src/conquest-flow.ts) — stops onSecond callbacks from firing into a tearing-down UI.
- Admin post-expiry +time path: `countdown.isComplete && delta > 0` branch re-primes via `setDuration(delta) + reset() + start()`.
- **No consumer refactor required.** Shadow fields cover every external reach-around site found in the audit.
- Bundle delta: +1,333 bytes total (v1.334 → v1.338). Headroom now 23,766 bytes (2.27%).

**Known properties verified during implementation:**
- `CountDownClock.addSeconds(n)` actually INCREASES remaining (the API audit's "inverted" warning was incorrect; `_adjustElapsedTime(-n)` reduces elapsed, which increases `duration - elapsed`). Used `addSeconds` / `subtractSeconds` directly without a wrapper.
- Never-started countdown reports `isPaused = true` and `.seconds = duration` — exactly what preview mode needs.
- `Timers.setTimeout` schedules next tick at `1000 - (elapsed % 1000)` ms for whole-second boundary alignment — drift correction comes for free.

**Residual edge case (accepted):**
- A player joining during a paused pre-live preview won't get their clock widgets built until match start (since `onSecond` doesn't fire on a paused clock and the 1 Hz game-mode tick no longer repaints). In practice, pre-live joiners see the ready dialog UI, not the main HUD clock, so this is not visible. If it becomes an issue, add an explicit `updateAllPlayersClock()` call in `resetUiForPlayerOnJoin()` or at `top-hud-shell.ts:225`.

**Follow-up reference:** Full design + exploration notes in [design_doc/clock_countdown_migration_plan_2026-04-21.md](bf6-portal/dev/conquest/design_doc/clock_countdown_migration_plan_2026-04-21.md).

---

## Category 5: Crash Risks (carried forward from prior analysis)

| # | Title | Severity | Status |
|---|-------|----------|--------|
| 1 | `for...in` with `delete` during iteration | Medium | Partially fixed — remaining sites read-only per v1.190 audit |
| 2 | Stale widget references after team swap/reconnect | — | **Resolved** (v1.216 generation counter) |
| 3 | Unbounded loading gate polling loop | — | **Resolved** (v1.104) |
| 4 | Inverted null guards in hot-path state accessors | — | **Won't fix — intentional** (warm-on-unknown) |
| 5 | Race between async loading gate and synchronous deploy event | — | **Resolved** (v1.214 invariants) |
| 6 | HQ Deploy claim timeout orphans | Low | **Resolved** (v1.289) |
| 7 | `GetObjectPosition` unreliable at Vanilla→HQ countdown reset | Medium | **Mitigated** (v1.283/v1.285) |
| 8 | `SetRedeployTime` late-joiner global side-effect | Medium | **Open** — deferred to polish. Hypothesis only; could affect 64-player join-churn. See `CQ_Polish_Respawn_Redeploy_Timer_Audit`. |
| 9 | **NEW (v1.334)** — `mod.Teleport(vehicle, ...)` with seated occupant | Medium → Low | **Validated** (v1.333 Forward Deploy playtest) — occupant is carried with vehicle; primary risk from Phase 2 plan did not manifest. Air Deploy jet altitude teleport with occupant is the only remaining gap, scheduled for v1.334 playtest. |

---

## Implementation Priority (v1.370+)

Headroom at 1.53% is **critical** (below the v1.010 floor of 2.2%). No runtime hot path is currently flagged HIGH. Admin Panel deferred indefinitely. Boundary architecture rework (v1.358–v1.370) is complete; cleanup of superseded code is the highest-value lever now.

### Playtest-blocking

*None at runtime.* Architecture is MP-stable. Bundle headroom is the constraint — any new feature must come with a deletion offset.

### Low-risk cleanup (can ship any time; ~1.5K reclaim total)

1. **Category 1.3** — Consolidate triangle helpers into `spawn-volume-math.ts` (~1,000–1,200 bytes, ~30 min).
2. **Category 1.4** — Remove 2 verified-dead helpers + 1 callsite (~300–400 bytes, ~10 min).
3. **H1 (downgraded)** — Consume active TickContext at `pipeline.ts:125` (~5 lines, ~15 min). Cleanup, not a latency fix.
4. **H3 verification** — Read-only confirmation that `isPlayerDeployed` gate runs before `safeFindPlayer` in `boundary/enforcement.ts` (~15 min).

### Post-playtest stability / polish

5. **Category 5 Item 8** — Late-joiner `SetRedeployTime` audit. Open. Tracked in `CQ_Polish_Respawn_Redeploy_Timer_Audit`.
6. **`CQ_Bug_Abrams_Substitution_Transport_Slot_Regression`** — open in `conquest_issues.md`. Needs fresh diagnostic.
7. ~~**Category 4 Item 3** — Match clock to `Clocks.CountDownClock`.~~ **DONE v1.338.**
8. **Category 4 items 1 & 2** — Migrate capture-sound flush and capture-VO cooldown to `Timers.setInterval` / `setTimeout`. Architectural tidiness, drift correction. Bundle impact near-zero.

### Residual / opportunistic (low value, bundle together with other work)

9. **Category 1.1 residual** — Convert `deploy-timer-ui.ts` + `ammo-resupply-menu.ts` to `wn()` factory if either file gets touched for other reasons (~120–415 bytes).
10. **Category 1.2 residual** — Not worth a dedicated pass (~100–300 bytes, postbuild already handles the bulk).
11. **Category 1.6** — Mega-file splits for `capture-tickets.ts`, `deploy-timer-ui.ts`, `ammo-resupply-menu.ts`. Zero bundle impact; readability only.

### New investigations (conditional)

12. **Admin Panel trim audit** — Only if re-enabling the panel becomes a goal. Audit `src/admin-panel/*` for bloat: redundant widgets, per-player mirror rows, unused code paths. Potential order-of-magnitude larger payoff than accumulating Category 1 items. Out of scope for current playtest.
13. **Fresh `FEATURE_PERF_DIAG` profile pass** — Both H1 and H2 turned out overstated once measured. That's a pattern. The current hot-path list is inferred from call-site grep, not from runtime profiling. A 10-player stress test with `perf-diag.ts` enabled could surface real cost and reveal the "big" optimization isn't in this doc at all.

### Dead-code cleanup (opportunistic, ~1.8K source saving)

11. Remove the 3 HIGH-confidence items from Category 3.
12. Post-playtest: verify read sites on the 3 MEDIUM-confidence `VehicleSpawnerSlot` fields before removal.

---

## Supersession notes (for future analyzers)

- **Do not re-open `CQ_Bug_49 / 52 / 53 / 54 / 55 / ActiveSpawnSingletonMPRace`.** Their host code paths were deleted wholesale in v1.259. The bugs cannot recur in their original form.
- **Do not re-introduce `mod.Teleport(player, ...)` immediately before `ForcePlayerToSeat`.** Banned permanently (memory `project_teleport_vehicle_spawn_mystery.md`).
- **Post-seat `mod.Teleport(vehicle, ...)` is validated for occupant carry (v1.333).** Do not confuse this with the banned pre-seat player-Teleport. The vehicle-post-seat pattern is Phase 2's empirical finding and is load-bearing for Forward/Air Deploy loadout correctness.
- **`ForcePlayerToSeat` is only reliable inside `OnPlayerDeployed`.** Confirmed across v1.246–v1.252 and the Phase 6 HQ Deploy playtest. Any new seating pathway must route through that event.
- **The dirty-flag HUD contract is load-bearing.** Any new per-player state that affects combat HUD rendering must call `conquestPhase3MarkHudDirty()` on mutation. See AGENTS.md.
- **`SetObjectTransform` is a no-op on `Vehicle` objects on the current engine build.** Every post-bind vehicle placement goes through `mod.Teleport`. `mod.Teleport` has no pitch/roll signature — vehicle rotation post-bind is yaw-only.
- **`SetObjectTransform` on a persistent `VehicleSpawner` does not reliably propagate position updates to `ForceVehicleSpawnerSpawn` at altitude.** v1.331 probe confirmed. The post-bind `mod.Teleport` is what delivers Air Deploy position.
