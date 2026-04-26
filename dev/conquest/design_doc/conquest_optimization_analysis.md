# TWL Conquest Optimization Analysis

Last updated: v1.390 (2026-04-26) — pre-playtest tuning ships: gadget cooldown retune (v1.385), 3-line help tooltip (v1.386–v1.387), team-swap button width 190→210 (v1.389–v1.390), strings.json polish pass (v1.388). Net **+2,596 bytes** since v1.384 cleanup baseline; bundle now 1,035,351 / 13,225 byte headroom / **1.26%** — back near v1.383 levels but still above the v1.10 / v1.110 floors. Boundary architecture remains event-driven (v1.360–v1.370). Tier 1+2 cleanup shipped (v1.371–v1.372). v1.384 Category 6 cleanup retired 10 dead functions + `safetyFloorTriggered` field for −3,495 bytes. Earlier baseline (v1.334): match clock H2 resolved; H1 downgraded post-measurement; Category 1.1 / 1.2 estimates corrected; Admin Panel reclaim arithmetic retired. Carried forward where still accurate.

Companion to: `TWL_Conquest_Design.md` (see "Codebase Reference Map" for file/function index) and `conquest_issues.md`.

---

## TL;DR (v1.390)

1. **Bundle at 1,035,351 / 1.26% headroom — TIGHT but stable.** v1.384 cleanup pushed headroom to 1.51%; v1.385–v1.390 pre-playtest tuning consumed 2,596 bytes (mostly the +2 help-text widgets at v1.386/v1.387 = ~2,550 bytes combined). **Burn rate over the v1.385–v1.390 range: ~430 bytes/version** — slightly worse than the historical ~350. Cat 7 (`VehicleSpawnerSlot` write-only fields, ~700 bytes) remains the next defensive lever if pressure resumes.
2. **Boundary architecture remains event-driven, single-source-of-truth for both zone state and seat state.** v1.383 added a safety-net engine re-probe inside `getDesiredBoundaryViolationKind` for the on_foot Y>200 branch (#106) — does not change the per-tick cost shape (still O(1) per player on the read side; safety-net runs at most once per missed `OnPlayerEnterVehicle` event).
3. **AreaTriggers required explicit enabling** — `mod.EnableAreaTrigger(trigger, true)` was never called pre-v1.367, which silently broke trigger enter/exit events for ~50 versions. Now wired in `enableBoundaryAreaTriggers()` from `onGameModeStartedImpl`. Same lesson generalizes: **engine objects with explicit enable calls should be audited at game-mode start**.
4. **No remaining runtime HIGH hot paths.** H1 cleanup (consume TickContext at `pipeline.ts:125`) is still open as low-priority cleanup. H2 retired in v1.338. H3 (boundary tick) reshaped — see Category 2; classifier is now O(1) per player on the read side.
5. **Admin Panel accepted off indefinitely.** Last measurement at v1.334 was −3,536 bytes over cap when enabled (+28,635 byte panel delta). Bundle has grown +12.7K since then; gap is now ~−16.5K over cap. Re-enabling requires trimming `src/admin-panel/*` directly.
6. **Dead code inventory partially cleaned in v1.384.** Categories 6/7/8 status:
   - **Category 6 (functions):** 10 of 11 verified-dead functions removed in v1.384 (−3,495 bytes). 1 retained as intentional Phase 1 scaffold (`conquestSelectSpawnPoint`). Plus 1 cascading dead state field (`safetyFloorTriggered`) removed.
   - **Category 7 (state fields):** 11 write-only `VehicleSpawnerSlot` fields still present (~700 bundle bytes + ~1.4 KB runtime memory). **Open — recommended next lever.**
   - **Category 8 (strings):** ~73 dead string keys in `strings.json` (~5,889 raw bytes / ~8.8K JSON impact in `bundle.strings.json`, which is **separate from the 1,048,576-byte script cap**). Open.
   - **0 dead `if`/`switch` branches** — control flow is clean.
   See Categories 6, 7, 8 below.

**Playtest-blocking items:** none.

---

## Bundle vs. Strings — Two Separate Caps

**Important context for future analyzers:**

- `dist/bundle.ts` (the script bundle, 1,035,351 bytes at v1.390) is governed by the 1,048,576-byte (1 MiB) hard cap enforced by `scripts/verify.js`. **This is the playtest-blocking cap.**
- `dist/bundle.strings.json` (22,050 bytes at v1.390 — up from ~21,813 at v1.384 due to helpText2/3 + duration25m + v1.388 polish) is a **separate** runtime asset and is **NOT counted** against the 1 MiB script cap. Strings come out of a different pool.
- `FEATURE_*` flags (`FEATURE_ADMIN_PANEL`, `FEATURE_PERF_DIAG`, `FEATURE_POSITION_DEBUG`, `FEATURE_JOIN_PROMPT`) gate **TS code only**, via `prebuild.js` import scrub + `postbuild.js` dead-code strip. **They do NOT gate strings.json keys.** A flag-conditional feature like the join-prompt has its TS code stripped at `false` but its **strings remain bundled** in `bundle.strings.json` regardless.

**Implication:** dead strings in `strings.json` are runtime memory bloat (and translation maintenance overhead), not script-bundle pressure. Cleaning them would shrink `bundle.strings.json` by ~40% but would not move the script-bundle cap needle.

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

**Headroom status: TIGHT.** The v1.290–v1.334 feature arc consumed 55K of the 80K v1.289 reserve. The 2.39% margin is near the 2.2% floor of v1.010. **Bundle pressure returned** — any new feature needs to plan for offsetting cuts.

### Admin Panel Bundle Cost — Empirical Measurement (v1.334)

| State | Bundle size | Headroom | Status |
|-------|-------------|----------|--------|
| `FEATURE_ADMIN_PANEL = false` | 1,023,477 bytes | 25,099 (2.39%) | PASS |
| `FEATURE_ADMIN_PANEL = true` | **1,052,112 bytes** | **−3,536 (OVER)** | FAIL |
| Admin panel delta | **+28,635 bytes** | — | — |

**Correction (2026-04-21, post-v1.338).** The "reclaim-to-re-enable via Category 1" plan does not close. Measured reclaim at v1.338 was ~2.3K best-case — **−26,320 bytes short** of the panel's +28,635 byte delta. If re-enable becomes a goal later, the right investigation is a **trim audit of `src/admin-panel/*` itself**, not accumulating Category 1 items.

**Admin Panel accepted off indefinitely** (user decision 2026-04-21).

## Size Progression

| Version | Bundle | Headroom | Delta | Notable work |
|---------|--------|----------|-------|--------------|
| v1.010 | 1,025,710 | 22,866 (2.2%) | — | Phase 6 complete baseline |
| v1.110 | 1,038,559 | 10,017 (1.0%) | +12,849 | CQ_Bug_39 hardening — low-water mark |
| v1.190 | 995,854 | 52,722 (5.03%) | **−42,705** | Audit pass: 3 dev flags→false, 52 stale widget names, safeFindPlayer hot-path |
| v1.213 | 1,001,081 | 47,495 (4.53%) | +5,227 | Phase 10 feature adds; FEATURE_WORLD_ICON_DIAG removed |
| v1.221 | 998,868 | 49,708 (4.74%) | −2,213 | Stability/perf pass: loading-gate asserts, TickContext, dirty-flag HUD, forEachValidPlayer |
| v1.259 | — | — | **−~25K** (est.) | Vanilla spawner rewrite. Deleted 6 legacy files; added `vanilla-spawner.ts`. |
| v1.289 | 968,479 | 80,097 (7.64%) | −30,389 from v1.221 | Phase 6 HQ Deploy. All 4 FEATURE_* flags now `false`. |
| v1.313 | — | — | ~+15K | Gadget Locker + launcher-slot probe arc |
| v1.328 | — | — | ~+10K | **Forward Deploy reintroduction.** |
| v1.329 | — | — | ~+5K | **Air Deploy reintroduction.** |
| v1.334 | 1,023,477 | 25,099 (2.39%) | +54,998 from v1.289 | Phase 2a/2b loadout fix. |
| v1.338 | 1,024,810 | 23,766 (2.27%) | +1,333 | Match clock → `Clocks.CountDownClock`. H2 retired. |
| v1.370 | 1,032,490 | 16,086 (1.53%) | +7,680 | Boundary architecture pass — zone tracker, AreaTrigger enable, event-driven seatKind, squad-spawn inheritance. |
| v1.371 | — | — | ~−1,000 | **Tier 1 cleanup.** Triangle-math consolidation (Cat 1.3 done) + dead helpers (Cat 1.4 done). |
| v1.372 | — | — | ~−400 | **Tier 2 cleanup.** Removed 3 dead `VehicleSpawnerSlot` fields (`spawnRetryScheduled`, `freshAirRuntimeSpawner`, `suppressNextBindSpawnTransformCorrection`). |
| v1.373 | — | — | −1,409 | Launcher cap unified to 3 + non-destructive +1-ammo probe (#95, #96). Net negative. |
| v1.374 | — | — | small | Deleted dead `mod.GetVehicleFromPlayer` cache seed (#93). |
| v1.375 | 1,033,439 | 15,137 (1.44%) | +2,776 | Supply Box disabled-focused indicator (#97). |
| v1.376 | — | — | small | Boundary seed: default-in-bounds when no teammate inheritance signal (#98). |
| v1.377 | — | — | +9 (strings) | 8 NATO/PAX team-name combos (#102). |
| v1.378 | — | — | minimal | Firestorm Team 2 Fast slot 2 default flipped Flyer60→Vector. |
| v1.379 | — | — | +~500 | Per-team vehicle menus split (HELI + FAST slot1/2 → Team1/Team2 variants). |
| v1.380 | — | — | small | Vehicle-spawned world-log gated behind perfDiag (#89). |
| v1.381 | 1,034,107 | 14,469 (1.38%) | +668 | Apply Config warm-prime guard (#105) + new player-facing string. |
| v1.382 | 1,036,032 | 12,544 (1.20%) | +1,925 | Apply-blocked message moved to dialog inline `unsavedLabel` (#105 follow-up). |
| v1.383 | 1,036,250 | 12,326 (1.18%) | +218 | Y=200 OOB safety-net engine re-probe (#106). |
| v1.384 | 1,032,755 | 15,821 (1.51%) | −3,495 | **Category 6 cleanup.** Removed 10 verified-dead functions + dead `safetyFloorTriggered` field. |
| v1.385 | 1,032,801 | 15,775 (1.50%) | +46 | Gadget cooldown retune (Artillery 25m, Smoke 6m, Assault Ladder 10m). Added `duration25m` string. |
| v1.386 | 1,034,076 | 14,500 (1.38%) | +1,275 | helpText2 second line under help tooltip ("Alternatively, use any of the green smoke..."). |
| v1.387 | 1,035,351 | 13,225 (1.26%) | +1,275 | helpText3 third line above help tooltip ("The game is NOT Live..."). |
| v1.388 | 1,035,351 | 13,225 (1.26%) | 0 | Strings polish: tooltip text edits (loading messages, "DEPLOY"→"VEHICLES", help-text wording). No code changes. |
| v1.389 | 1,035,351 | 13,225 (1.26%) | 0 | Team-swap HUD button widened 190→200 (right edge only). Single int constant. |
| **v1.390** | **1,035,351** | **13,225 (1.26%)** | **0** | Team-swap HUD button widened 200→210 (right edge only). Single int constant. |

**Direction:** **STABLE.** v1.385–v1.390 was tuning, not feature growth. The two help-text widgets at v1.386/v1.387 account for nearly all the ~2.6KB consumption since v1.384. The 3-line help tooltip is now load-bearing UI for the playtest; not a candidate for removal. Remaining levers (Cat 7 + Cat 8.1) total ~700 bundle bytes + ~5.2 KB strings.json — modest reclaim if needed. **strings.json grew to 22,050 bytes** (helpText2/3 + duration25m + the v1.388 polish edits), still well below the script-bundle pressure that matters.

---

## Category 1: File Size Reduction

| # | Title | Status |
|---|-------|--------|
| 1 | Widget-name factory (residual conversion in 2 files) | **Open — LOW priority.** ~120–415 bytes residual. Factory `wn()` adopted across 230+ sites. Remaining: `vehicles/deploy-timer-ui.ts` (~120 bytes) + `interaction/ammo-resupply-menu.ts` wrapper (bundle-neutral if refactored, ~295 bytes if inlined). |
| 2 | Emitted comment / JSDoc audit (residual) | **Open — LOW priority.** ~100–300 bytes. `scripts/postbuild.js:114` already strips full-line `//`. Residual: inline trailing `//`, `/* */` blocks (9 in source, 13 in bundle), and 4 `/** */` JSDoc blocks across mega-files. |
| 3 | Consolidate duplicate triangle-sampling helpers | **Resolved (v1.371).** Moved to `src/vehicles/spawn-volume-math.ts`. ~1,000 bundle bytes reclaimed. |
| 4 | Remove 2 verified-dead vehicle-path helpers | **Resolved (v1.371).** `clearAllVehicleReservations` + `getDesiredSpawnerCountsForPreset` deleted. ~300 bundle bytes. |
| 5 | Audit `VehicleSpawnerSlot` for write-only/unread fields | **Partially resolved (v1.372)** — 3 fields removed. **Re-opened (v1.383 audit, still open at v1.384)** — Category 7 below identifies **11 additional dead fields** missed in the v1.372 sweep. Recommended as next reclaim lever. |
| 6 | Three 2K-line mega-files — split for navigability only | **Open — carry-over.** 0 bundle bytes; review readability only. |
| 7 | Post-v1.259 dead-module import scrub | **Resolved (v1.289 audit).** Confirmed clean. |

### 1.6 Mega-file splits — carry-over, still LOW (zero bundle impact)

| File | Lines (v1.383 est.) | Notes |
|---|---|---|
| `index/capture-tickets.ts` | ~2,150 | Phase 2A sync + bleed + 7 combat HUD view models + dispatch |
| `vehicles/deploy-timer-ui.ts` | ~2,026 | HQ/Forward/Air button wiring and pending-state header |
| `interaction/ammo-resupply-menu.ts` | ~2,504 | Gadget-delay status header, launcher tile gating, per-class slot-toggle row, launcher-slot probe |

Bundler concatenates — splits are for review readability, not bundle size. Priority remains low.

---

## Category 2: Per-Tick and Recurring Hot Paths — Updated for 64-Player MP

Audit context: 29 `mod.AllPlayers()` call sites across 21 files. TickContext caches per-subtick. Combat HUD dirty-flag gating active. Verified at v1.384.

### HIGH severity (playtest-blocking if a spike shows up)

**None currently open.**

| # | File:line | What it does | Cost @ 64p | Mitigation |
|---|-----------|-------------|-----------|------------|
| H2 | ~~`src/clock/state.ts` `updateAllPlayersClock`~~ | — | — | **RESOLVED v1.337+v1.338.** Match clock self-drives via `Clocks.CountDownClock`. |
| H3 (reshaped v1.369) | `src/boundary/enforcement.ts` `tickBoundaryEnforcement` | `forEachValidPlayer` tick → `refreshPlayerBoundaryState` → `getDesiredBoundaryViolationKind`. The classifier is now a **pure read** of cached `zoneStateByPid[pid]` (zone flags + `seatKind`). Only engine call inside the classifier is `safeGetSoldierStateVector` for the foot-Y-ceiling check, gated on `state.seatKind === "on_foot"`. **v1.383:** added `safeGetSoldierStateBool(IsInVehicle)` re-probe in the same on_foot+Y>200 branch as a safety-net (#106). | O(N) iteration with O(1) per-player work; the v1.383 re-probe runs at most once per missed `OnPlayerEnterVehicle` event (cache self-corrects to "aircraft" and short-circuits future ticks at line 247). | **No further action required.** |

### MED severity (non-blocking but worth watching)

| # | File:line | What it does | Cost @ 64p | Notes |
|---|-----------|-------------|-----------|-------|
| H1 (downgraded v1.338) | `src/ui/conquest/hud-core/pipeline.ts:125` (`twlConquestHudTickFrame`) | Raw `mod.AllPlayers()` bypassing an active TickContext. | ~0 in steady state (dirty-gated); on mutation, one O(N) `AllPlayers()` per dirty-tick. | Full loop is gated by `State.conquest.debug.hudDirty` at `src/index/capture-tickets.ts:2119`. Fix is ~5–10 lines (cleanup, not a latency fix). |
| M1 | `src/ui/conquest/hud-core/render.ts:93-181` | Per-player snapshot builder; 7-slot loop + engage panel. | O(N×7) | Dirty-flag gated + 0.25s cadence. Safe. |
| M2 | `src/index/capture-tickets.ts:180-187` | Per-player derived slice every tick, **not** dirty-flag gated. | O(N×3) | Intentional (clock is time-variant); documented in AGENTS.md. |
| M3 | `src/vehicles/deploy-timer-ui.ts:1986-1988` | 1 Hz refresh of per-slot × per-player vehicle timer widgets. | O(N × slot-count) | Cadence 1s — forgiving. |

### LOW severity (verified safe)

- `src/index/capture-tickets.ts:38-54` — sparse engaged-players map, ~4–8 keys typical.
- `src/index/capture-tickets.ts:1409-1444` — pre-computed `onPointTeam1/2` counters.

**No O(N²) nested player loops found.**

### Prior Category 2 items carried forward

| # | Title | Status |
|---|-------|--------|
| 1 | Cache `mod.AllPlayers()` once per tick — TickContext | **Resolved** (v1.219) — bypassed at H1; fix upstream. |
| 2 | Gate combat HUD render behind dirty flag | **Resolved** (v1.221). |
| 3 | Replace string signatures with generation counters | **Open — low priority.** Several HUD families still use `"v:${visible}|pid:..."` signatures. |
| 4 | Cache widget refs in hot render paths | **Resolved** (v1.215). |
| 5 | Skip boundary checks for unmoving/undeployed | **Resolved** (undeployed skip). |
| 6 | HQ Deploy seat-flow polling loop | **Open — low priority.** |
| 7 | `safeFind` call count | Flat vs. v1.221 (~342). |

---

## Category 3: Legacy Dead Code Inventory (resolved)

Pre-v1.371 inventory. Largely retired by v1.371/v1.372 cleanup. New findings re-opened in **Categories 6 / 7 / 8** below — kept here as reference for what shipped.

| File:line | Symbol | Resolution |
|-----------|--------|------------|
| `vanilla-spawner.ts:79-82` | `clearAllVehicleReservations()` | **Removed v1.371** |
| `vanilla-spawner.ts:63-69` | `getDesiredSpawnerCountsForPreset` | **Removed v1.371** |
| `air-spawn-volume.ts:17-56` | `airTriangleAreaXZ`, `airSamplePointInTriangle`, `airVolumeQuadAreaXZ` | **Consolidated to `spawn-volume-math.ts` v1.371** |
| `runtime-types.ts` | `VehicleSpawnerSlot.spawnRetryScheduled` | **Removed v1.372** |
| `runtime-types.ts` | `VehicleSpawnerSlot.freshAirRuntimeSpawner` | **Removed v1.372** |
| `runtime-types.ts` | `VehicleSpawnerSlot.suppressNextBindSpawnTransformCorrection` | **Removed v1.372** |

### Feature-flag-gated files (NOT dead — excluded from bundle)

`src/hud/deploy-diagnostic.ts` (218 lines), `src/hud/position-debug.ts` (359 lines), `src/hud/perf-diag.ts` (345 lines), and the four `admin-panel/*` files are flagged-out in source. They are excluded from the bundle by `prebuild.js` + postbuild dead-code strip. Treated correctly.

### Post-v1.259 dead-module scrub — still clean

Grep confirmed at v1.383: no surviving imports or type references to `deploy-fulfillment`, `reservations`, `spawner-sequence`, `spawner-bind`, `spawner-slots`, `spawner-bootstrap`.

---

## Category 4: Clock / Timer Module Reuse Opportunities

### HIGH value (cleaner + drift-correct)

1. **`src/index/capture-sound.ts:150-158`** — Manual `lastFlushAtSeconds` tracking. Migrate to `Timers.setInterval`.
2. **`src/index/capture-vo.ts:351-354`** — Per-recipient VO cooldown via map + manual compare. Migrate to per-key `Timers.setTimeout`.
3. ~~Match clock~~ **RESOLVED v1.338.**

### MED value

4. **`src/interaction/actions.ts:737`** — `teamSwapPerspectiveLockUntilByPid` per-tick expiry poll → `Timers.setTimeout`.
5. **`src/state/spawn-charge.ts:46-48`** — 1-second debug snapshot throttle. Debug-only.

### LOW value

- `src/vehicles/deploy-timer-ui.ts` — already reads from `slot.respawnClock` (`Clocks.CountDownClock`).
- `src/ready-dialog/countdown-flow.ts:70-86` — `mod.Wait()` for animation pacing. Fine.
- `src/utils/multi-click.ts:31-33` — `Date.now()` ms-granular interaction timing; intentional.
- `src/vehicles/hq-deploy.ts:80-82, 132-157` — O(1) integer compare.

---

## v1.337 / v1.338 — Match Clock Resolution (historical)

**Scope:** Category 2 H2 hot path + Category 4 HIGH item 3. Both retired.

**v1.337 (Phase A — early-return gate):** Added identical-state short-circuit at `clock/state.ts:150`. +174 bytes. Eliminates ~64 unconditional per-player ops/sec at steady state.

**v1.338 (Phase B — `Clocks.CountDownClock` migration):**
- Added `countdown?: Clocks.CountDownClock` to `State.round.clock` sub-state.
- Rewrote `resetMatchClock`, `setMatchClockPreview`, `getRemainingSeconds`, `adjustMatchClockBySeconds` to drive the `CountDownClock` instance.
- New `onClockSecond` callback (per-second HUD repaint) + `onClockComplete` callback (single-fire expiry).
- Removed `updateAllPlayersClock()` calls from `index/game-mode.ts` tick loop — clock now self-drives.
- Added `State.round.clock.countdown?.pause()` to `endMatch`.
- Bundle delta: +1,333 bytes total (v1.334 → v1.338).

Properties verified during implementation:
- `CountDownClock.addSeconds(n)` actually INCREASES remaining; the API audit's "inverted" warning was incorrect.
- Never-started countdown reports `isPaused = true` and `.seconds = duration`.
- `Timers.setTimeout` schedules next tick at `1000 - (elapsed % 1000)` ms — drift correction comes for free.

**Residual edge case (accepted):** A player joining during a paused pre-live preview won't get their clock widgets built until match start. In practice, pre-live joiners see the ready dialog UI, not the main HUD clock.

**Follow-up reference:** [design_doc/clock_countdown_migration_plan_2026-04-21.md](./clock_countdown_migration_plan_2026-04-21.md).

---

## Category 5: Crash Risks (carried forward)

| # | Title | Severity | Status |
|---|-------|----------|--------|
| 1 | `for...in` with `delete` during iteration | Medium | Partially fixed — remaining sites read-only per v1.190 audit |
| 2 | Stale widget references after team swap/reconnect | — | **Resolved** (v1.216 generation counter) |
| 3 | Unbounded loading gate polling loop | — | **Resolved** (v1.104) |
| 4 | Inverted null guards in hot-path state accessors | — | **Won't fix — intentional** |
| 5 | Race between async loading gate and synchronous deploy event | — | **Resolved** (v1.214 invariants) |
| 6 | HQ Deploy claim timeout orphans | Low | **Resolved** (v1.289) |
| 7 | `GetObjectPosition` unreliable at Vanilla→HQ countdown reset | Medium | **Mitigated** (v1.283/v1.285) |
| 8 | `SetRedeployTime` late-joiner global side-effect | Medium | **Open** — deferred to polish. See `CQ_Polish_Respawn_Redeploy_Timer_Audit`. |
| 9 | `mod.Teleport(vehicle, ...)` with seated occupant | Low | **Validated** (v1.333 Forward Deploy playtest). |
| **10 (NEW v1.381)** | Hard server-process crash from late-joiner ↔ Apply Config widget-tree collision | Resolved | **Mitigated** (v1.381 `warmPrimeActiveByPid` guard, #105). MP confirmation pending. **Symmetric guard (warm starts AFTER Apply begins) deferred** — open follow-up if recurs. |
| **11 (NEW v1.383)** | `OnPlayerEnterVehicle` engine event reliability gap (heli slot 2 AH-6M observed) | Mitigated | **Safety-net re-probe** in `getDesiredBoundaryViolationKind` (#106). Self-corrects `seatKind` via single writer; recursive `refreshPlayerBoundaryState` terminates on aircraft early-return. Root cause not addressed; Phase A diagnostic deferred unless recurs in MP. |

---

## Category 6: Dead Functions — RESOLVED v1.384

Original v1.383 audit identified 11 zero-call-site functions in production-bundle scope. After hard verification (looking for engine-callable patterns, type re-exports, indirect dispatch):

### Removed in v1.384 (9 functions + 1 cascading state field)

| File | Symbol | Reason removed |
|------|--------|----------------|
| `vehicles/vanilla-spawner.ts` | `getVanillaSlotRespawnRemainingSeconds` | Dead duplicate of live `getVehicleSlotRespawnRemainingSeconds` in `vehicles/timers.ts:10`. |
| `state/ui-helpers.ts` | `addRightAlignedLabel` | Orphan widget builder, no readers. |
| `ready-dialog/mode-config-presets.ts` | `isReadyDialogGameModeVanilla` | Dead twin of live `isReadyDialogGameModeCustom` (5 callers). |
| `interaction/hud-warm-state.ts` | `setSafetyFloorTriggeredForPid` | Dead writer. |
| `interaction/hud-warm-state.ts` | `isSafetyFloorTriggeredForPid` | Dead reader. |
| `interaction/hud-warm-state.ts` | `isSafetyTimeoutTriggeredForPid` | Dead reader. (`set` retained — it has callers in `actions.ts:617, :643` from gate-timeout fallback logic, even though the field it writes is now technically write-only. Field retained too as a safe-no-op reservation for future telemetry.) |
| `vehicles/registration.ts` | `inferBaseTeamFromPosition` | Orphan from base-team detection refactor. |
| `interaction/actions.ts` | `isCriticalHudReadyForPlayer` | Explicitly superseded per its own comment by `isAllUiFamiliesReadyForRelease`. |
| `ready-dialog/mode-config-aircraft-ceiling.ts` | `applyCustomAircraftCeilingHardLimiter` | User-confirmed: custom aircraft ceiling not needed. The engine-side hard-limiter never engaged anyway — `customEnabled` was write-only across the whole codebase. |
| `ready-dialog/mode-config-aircraft-ceiling.ts` | `enableCustomAircraftCeiling` | Same — user removed custom aircraft ceiling. |
| (cascading) `interaction/types.ts:61` + 2 init sites | `safetyFloorTriggered` field | Field had zero readers; only the dead floor-flag setter wrote to it. Removed cleanly. |

**Reclaim: −3,495 bundle bytes.** (Estimate was 1.5–1.8 KB; actual nearly 2× because helper-call chains and minifier opportunities surfaced.)

### Retained — intentional scaffold

| File | Symbol | Why kept |
|------|--------|----------|
| `interaction/spawn-selector.ts:28` | `conquestSelectSpawnPoint` | File comment is explicit: *"Phase 1 seam for future conquest spawn selection policy. Custom selection is intentionally deferred to later phases."* Module is registered via `index.ts:73`. Placeholder for planned feature, not dead code. |

### Cascading dead retained — touch-risk-not-justified

| File | Symbol | Why retained |
|------|--------|--------------|
| `interaction/hud-warm-state.ts` | `setSafetyTimeoutTriggeredForPid` | Has 2 callers in `actions.ts:617, :643` inside the gate-timeout fallback logic (`CQ_Bug_35/40` territory). Removing means editing the gate-timeout fallback, which is sensitive. Field-write is a safe no-op; cost is ~50 bytes for full safety. |
| `interaction/types.ts:62` | `safetyTimeoutTriggered` field | Same — kept for the live writer. |

### Verified clean

- **No `if (false)` / `if (true)` dead branches** anywhere in `src/`.
- **No code after unconditional `return`/`throw`** patterns.
- **3 TODO/FIXME markers total** across the codebase.

### Lessons from this pass

- **Automated grep over-reported.** The Explore agent flagged `vehicleId` as dead (32 occurrences but reported "never read") — manual verification proved it's the most-read field on `VehicleSpawnerSlot`. Future audits must split `\.<field>\b` reads vs `<field>:` writes.
- **`conquestSelectSpawnPoint`** would have been incorrectly removed without reading the file header. Always read context before removing functions.
- **Aircraft ceiling was a half-wired feature, not dead code.** The agent's "zero callers" was technically correct but missed the broader context (UI input configures a value that never reaches the engine). User decision required to disambiguate "delete" vs "fix the wiring."

---

## Category 7: Dead Variables / State Fields (NEW — v1.383 audit)

State fields written to but **never read** anywhere in `src/`. Each verified by grepping for both `.<field>` (read pattern) and `<field>:` (write/decl pattern). Where reads return zero and writes return ≥1, the field is write-only dead weight.

### HIGH confidence — `VehicleSpawnerSlot` write-only fields (11 total)

These are post-v1.259 rewrite hangovers that the v1.372 sweep missed:

| Field | Decl | Init site | Reads |
|-------|------|-----------|-------|
| `enableToken` | `runtime-types.ts:15` | `vanilla-spawner.ts:233` | **0** |
| `spawnRequestToken` | `runtime-types.ts:16` | `vanilla-spawner.ts:234` | **0** |
| `spawnRequestAtSeconds` | `runtime-types.ts` | `vanilla-spawner.ts:235` | **0** |
| `expectingSpawnStartedAtSeconds` | `runtime-types.ts:21` | `vanilla-spawner.ts:238` | **0** (intended for watchdog reap per comment, never wired) |
| `respawnQueuedAtSeconds` | `runtime-types.ts` | `vanilla-spawner.ts:240` | **0** |
| `respawnReadyAtSeconds` | `runtime-types.ts` | `vanilla-spawner.ts:241` | **0** |
| `lastSpawnedAtSeconds` | `runtime-types.ts` | `vanilla-spawner.ts:242` | **0** |
| `lastDestroyedAtSeconds` | `runtime-types.ts` | `vanilla-spawner.ts:243` | **0** |
| `lastMissingAtSeconds` | `runtime-types.ts:28` | `vanilla-spawner.ts:244` | **0** |
| `spawnCategory` | `runtime-types.ts:30` | `vanilla-spawner.ts:246` | **0** (`VehicleSlotSpawnCategory` enum has 1 reader site for type only) |
| `availabilityPhase` | `runtime-types.ts:32` | `vanilla-spawner.ts:250` | **0** (prior v1.375 doc claimed 1 read at `deploy-timer-ui.ts:182`; verified at v1.383 — that line reads `vehicleId`, not `availabilityPhase`. Doc was wrong.) |

**Estimated savings:** ~600 bytes type defs + ~250 bytes init writes + ~100 bytes scattered assignments = **~950 source bytes / ~700 bundle bytes.** Plus per-instance runtime memory: 11 fields × ~16 slots × ~8 bytes = **~1.4 KB held in `State` forever.**

### Verified clean

- `VehicleSpawnerSlot.vehicleId` — actively read at 32+ sites as the slot occupancy marker (`slot.vehicleId !== -1` is the canonical "slot occupied" check). The v1.383 audit agent flagged this as dead; verification proved it's the most-read field on the type. Do NOT remove.
- All `*Pos` / `*Rot` fields (`nextForwardPos`, `nextAirPos`, etc.) — actively used by Phase 2a/2b post-seat Teleport.
- `pendingSpawnOwnerPid`, `activeOwnerPid`, `pendingSpawnMode`, `expectingSpawn`, `respawnRunning`, `respawnClock`, `enabled`, `deployFlowTracked`, `slotNumber`, `vehicleType` — all actively read.

### LOW confidence

- `spawnCategory` (`VehicleSlotSpawnCategory` enum) — the enum type itself is referenced; field never read but might be a deliberate forward-declaration for a feature that never landed. Safe to remove with the type.

---

## Category 8: Dead Strings (NEW — v1.383 audit)

Keys in `src/strings.json` with **zero `mod.stringkeys.<path>` references** in `src/*.ts`. Verified by enumerating leaf keys then grepping each full dotted path.

**Important context:** strings.json compiles to `dist/bundle.strings.json` (21,813 bytes at v1.383) which is **separate from the 1,048,576-byte script-bundle cap**. Dead strings are runtime memory bloat + translation maintenance overhead, **not** main-bundle pressure. Cleanup helps memory and clarity, not the cap.

### Categorized dead-string inventory (~73 keys, ~5,889 raw bytes)

#### Category 8.1 — Join Prompt strings (28 keys, ~5,254 bytes — by far the largest)
Feature flag `FEATURE_JOIN_PROMPT = false`; TS code stripped at postbuild but strings remain bundled. **`FEATURE_*` flags do not gate strings.json.**
- `twl.joinPrompt.title`, `dismiss`, `dismissShowMoreTips`, `neverShowAgain`
- `twl.joinPrompt.body.mandatory1`, `mandatory2`
- `twl.joinPrompt.body.tip3` through `tip20` (18 keys)
- `twl.joinPrompt.body.20-skip` and other terminal markers

**If JOIN_PROMPT is permanently retired, ~5.2K of strings.json becomes dead weight.** If the feature is revived, restore intent.

#### Category 8.2 — Map name strings (8 keys, ~98 bytes)
Only `twl.maps.operationFirestorm` is referenced via `MAP_NAME_STRINGKEYS`. Unreferenced:
- `twl.maps.area22B`, `blackwellFields`, `defenseNexus`, `golfCourse`, `liberationPeak`, `manhattanBridge`, `mirakValley`, `sobekCity`

#### Category 8.3 — UI cache monitoring strings (5 keys, ~96 bytes)
Tied to a UI-cache HUD feature that was never wired:
- `twl.hud.uiCacheHeader`, `uiCacheVehicle`, `uiCacheReady`, `uiCacheGadget`
- `twl.adminPanel.actions.uiCachePerfToggle`, `tester.buttons.uiCachePerfOn/Off`

#### Category 8.4 — Unused team-name combos (~8 keys)
v1.377 added 8 NATO/PAX combos but only 4 are exercised by the current matchup-preset defaults across all maps. Unreferenced from code (still selectable from the dropdown UI, so partially "data" not "dead" — confirm with user before removing):
- `twl.teams.NORTH`, `SOUTH`, `NORTH_NATO`, `NORTH_PAX`, `SOUTH_NATO`, `SOUTH_PAX`, `EAST_NATO`, `WEST_PAX`

**CAUTION on 8.4:** these may be exposed via the team-name dropdown UI for runtime selection. Verify with knob-rendering code before removing — they could be data-bound, not literally referenced by `mod.stringkeys.twl.teams.NORTH`.

#### Category 8.5 — Unused readyDialog strings (~7 keys)
- `twl.readyDialog.heli3Label`, `heli4Label` — slot labels for slots that never materialized
- `matchupFormat`, `vehicleDeployLabel/HqForward/HqForwardAir`, `vehiclesCountLabel`, `vehiclesLabelFormat`, `vehicleOptionMapDefault`, `gameModeLabel`, `playerNameFormat`, `modeSettingsLabel`

#### Category 8.6 — Boundary / debug / system strings (~10 keys)
- `twl.boundary.preLiveMainBaseTitle`, `enemyMainBaseBufferTitle`, `groundCombatZoneTitle` (the title1/title2 versions are referenced; bare parents are not)
- `twl.debug.rotZ`, `rotX`
- `twl.system.debugPlaceholderName`, `unassigned`
- `twl.countdown.go`, `hud.conquest.bleedChevron`, `teamSwitch.debugTimeLimit`

#### Category 8.7 — UI element strings (~4 keys)
- `twl.ui.airStrike`, `ammo`, `duration7m30s`, `groundDeploy`, `igla`

### Estimated savings
- **Raw string content:** ~5,889 bytes
- **JSON overhead (~50%):** ~2,944 bytes
- **`bundle.strings.json` impact:** **~8.8 KB → ~13 KB** (40–60% of current 21,813 bytes)
- **Main script bundle impact:** **0 bytes** (separate cap)

---

## Unique Risks & Issues (NEW — v1.383 audit)

Beyond the categorized findings, the audit surfaced these systemic concerns:

### R1. Bundle-headroom burn rate without active offsets
Pre-cleanup trend: headroom went from 15,137 bytes (v1.375, 1.44%) to 12,326 bytes (v1.383, 1.18%) over 8 versions = **−351 bytes/version average.** v1.384 Category 6 cleanup reclaimed −3,495 bytes — pushed headroom back to 15,821 (1.51%). At the prior burn rate, this buys ~10 versions of runway. **Recommendation if headroom shrinks below 1.3% again:** ship Category 7 (~700 bytes, zero risk) as the next defensive reclaim, then mega-file end-to-end orphan reads.

### R2. Strings.json is a hidden runtime cost
`bundle.strings.json` is 21,813 bytes at v1.383 — and ~40% (~8.8 KB) is dead weight from disabled features (join prompt + UI cache + unused map names). Strings are loaded once at game-mode start and held forever. Trim is straightforward but requires playtesting to confirm no dynamic lookups via computed paths. **No FEATURE_* flag gates strings.json.**

### R3. Engine event reliability is asymmetric — `OnPlayerEnterVehicle` only
`OnPlayerEnterVehicle` is the documented unreliable one (v1.383 #106 fix; user confirms prior testing also showed enter-side issues). **`OnPlayerExitVehicle` has not exhibited reliability problems in playtest** (user confirmation 2026-04-26). The asymmetry tracks: enter-side requires the engine to bind seat → vehicle → script-event, exit-side just requires fire-on-detach. A symmetric safety-net at the aircraft-exemption early-return ([enforcement.ts:247](../src/boundary/enforcement.ts#L247)) is **NOT recommended** as pre-emptive defense — only ship if a future playtest produces "player in OOB / enemy base evading enforcement" reports, which would invert this finding.

### R4. v1.381 #105 fix has a known coverage gap
The `warmPrimeActiveByPid` guard refuses Apply Config when **a warm-prime is already in flight at Apply time**. It does NOT protect against **a late-joiner whose warm-prime starts AFTER Apply Config begins** (the symmetric race). If the hard-crash recurs in MP testing, the symmetric guard (have warm-prime path also check `applyConfigInFlight` and yield) is the next defensive layer. Capture if it fires.

### R5. Mega-files breed hidden dead code
Three 2,000+ line files (`capture-tickets.ts`, `deploy-timer-ui.ts`, `ammo-resupply-menu.ts`) hosted the bulk of removed Category 6 dead functions. Cognitive overhead of these files makes orphan helpers hard to spot in review. Mega-file splits (Category 1.6) are 0 bundle impact but would catch this class of bug at PR time. **Probability there are MORE undiscovered orphans inside these files is HIGH** — the v1.384 audit was symbol-grep based and would miss orphan code that's only reachable through removed callers.

### R6. `vehicleId` was almost reported as dead by automated grep
The v1.383 Explore-agent dead-variable sweep flagged `vehicleId` as dead (32 occurrences but reported "never read anywhere"). Manual verification proved it's the most-read field on `VehicleSpawnerSlot` (slot occupancy marker, `slot.vehicleId !== -1`). **Lesson:** automated dead-variable sweeps must distinguish read patterns (`obj.field`) from declaration patterns (`field:`); raw symbol grep over-reports. Future audits should use targeted `\.<field>\b` reads vs `<field>:` writes split.

### R7. Comment / JSDoc stripping is partial
`postbuild.js:114` strips full-line `//` only. Inline trailing `//` comments and `/* */` blocks survive into the bundle (13 `/**` blocks at v1.383). Low-priority but ~100–300 bytes recoverable with a `/* */` strip pass.

### R8. Plan files accumulate in design_doc/
14+ `*_plan_*.md` files in `bf6-portal/dev/conquest/design_doc/`. Excluded from bundle (markdown), so 0 bundle impact, but document hygiene is poor — many plans reference functions/files that have since been refactored or removed. Periodic plan-file cleanup (move to `design_doc/archive/` once shipped) would aid future analyzers.

---

## Implementation Priority (v1.385+)

Headroom recovered to 1.51% via v1.384 Category 6 cleanup. Above the v1.010 floor of 2.2% would still be ideal but no longer urgent. No runtime hot path is currently flagged HIGH.

### Playtest-blocking
*None at runtime.* Architecture is MP-stable.

### Remaining bundle-reclaim levers (ordered by ROI)

| # | Lever | Bundle reclaim | Strings.json | Effort | Risk | Notes |
|---|-------|---------------|---------------|--------|------|-------|
| 1 | **Cat 7** — Remove 11 write-only `VehicleSpawnerSlot` fields | **~700 bytes** + ~1.4 KB runtime memory | 0 | ~30 min | **Zero** (verified write-only) | Best next ship if headroom needs help. |
| 2 | **Cat 1.1 + 1.2 + R7** — Inline widget-name wrappers, strip JSDoc/`/* */`, trailing `//` | ~300–1,000 bytes combined | 0 | ~1 hr | Low | Diminishing returns; bundle together. |
| 3 | **Mega-file orphan re-read** — Read `capture-tickets.ts`, `deploy-timer-ui.ts`, `ammo-resupply-menu.ts` end-to-end for dead helpers grep missed | ~1–3 KB est. | 0 | ~2 hrs | Low (per-symbol grep verify before delete) | Symbol-grep audits miss code reachable only through previously-removed callers. |
| 4 | **Cat 8.1** — Trim 28 join-prompt strings | 0 (different cap) | **~5.2 KB** | ~15 min | None if FEATURE_JOIN_PROMPT permanently off | Runtime memory only. |
| 5 | **Cat 8.2–8.7** — Trim ~45 other dead string keys | 0 (different cap) | ~3.5 KB | ~30 min | Low (Cat 8.4 needs UI verification first) | Runtime memory only. |
| 6 | **Cat 4 items 1 & 2** — Migrate capture-sound + capture-VO to `Timers.*` | ~50–150 bytes (helper consolidation) | 0 | ~1 hr | Low | Architectural tidiness, near-zero direct savings. |
| 7 | **Admin Panel trim audit** | up to ~10–15 KB if `FEATURE_ADMIN_PANEL` is re-enabled later | 0 | ~3 hrs | Med | Only relevant if re-enabling admin panel becomes a goal. |
| 8 | **`FEATURE_PERF_DIAG` runtime profile pass** | Unknown — could surface big or zero | 0 | ~2 hrs | Low | H1/H2 were overstated when measured. Grep-based hot-path list may have other false positives or hidden true positives. |

**Combined practical reclaim (#1–#3, no admin-panel work): ~2–4.5 KB bundle bytes** = headroom up to ~1.7–1.9% if all shipped.

### Pending stability / polish (not bundle-related)

- **Category 5 Item 8** — Late-joiner `SetRedeployTime` audit. Tracked in `CQ_Polish_Respawn_Redeploy_Timer_Audit`.
- **`CQ_Bug_Abrams_Substitution_Transport_Slot_Regression`** — open in `conquest_issues.md`.
- **R3 — Symmetric `OnPlayerExitVehicle` safety-net** — only if MP playtest shows aircraft-state-stuck symptom.
- **R4 — Symmetric Apply Config in-flight guard** — only if hard crash recurs.
- **R5 — Mega-file split** — readability only, 0 bundle impact.
- **R8 — Plan-file archival** — `design_doc/archive/` cleanup pass for analyzer hygiene.

---

## Supersession notes (for future analyzers)

- **Do not re-open `CQ_Bug_49 / 52 / 53 / 54 / 55 / ActiveSpawnSingletonMPRace`.** Their host code paths were deleted wholesale in v1.259.
- **Do not re-introduce `mod.Teleport(player, ...)` immediately before `ForcePlayerToSeat`.** Banned permanently.
- **Post-seat `mod.Teleport(vehicle, ...)` is validated for occupant carry (v1.333).** Do not confuse this with the banned pre-seat player-Teleport.
- **`ForcePlayerToSeat` is only reliable inside `OnPlayerDeployed`.** Confirmed across v1.246–v1.252 and Phase 6 HQ Deploy playtest.
- **The dirty-flag HUD contract is load-bearing.** Any new per-player state affecting combat HUD rendering must call `conquestPhase3MarkHudDirty()` on mutation. See AGENTS.md.
- **`SetObjectTransform` is a no-op on `Vehicle` objects on the current engine build.** Every post-bind vehicle placement goes through `mod.Teleport`. Vehicle rotation post-bind is yaw-only.
- **`SetObjectTransform` on a persistent `VehicleSpawner` does not reliably propagate position updates to `ForceVehicleSpawnerSpawn` at altitude.** v1.331 probe confirmed.
- **`OnPlayerEnterVehicle` engine event is NOT 100% reliable** (v1.383 finding from #106 — heli slot 2 AH-6M observed across 3 different players). Any new code that depends on `seatKind` being correct must either accept the safety-net re-probe pattern OR add its own engine cross-check. See R3 above for the inverse risk.
- **`vehicleId` on `VehicleSpawnerSlot` is the canonical occupancy marker** (`!== -1` means occupied). It is NOT dead despite v1.383 automated grep flagging — see R6 for why.
- **`FEATURE_*` flags gate TS code only, NOT strings.json** — disabled features still bundle their strings. See "Bundle vs. Strings — Two Separate Caps" at the top.
