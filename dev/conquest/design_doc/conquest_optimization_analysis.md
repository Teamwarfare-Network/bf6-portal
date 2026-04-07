# TWL Conquest Optimization Analysis

Last updated: v1.110 (2026-04-06)
Companion to: `TWL_Conquest_Design.md` (see "Codebase Reference Map" section for file/function index)

## Baseline

| Metric | Value |
|--------|-------|
| Bundle size | 1,038,559 bytes |
| Bundle limit | 1,048,576 bytes |
| Headroom | 10,017 bytes (1.0%) |
| Source files | 113 .ts |
| Source lines | ~28,728 |
| `mod.AllPlayers()` calls | 41 across 29 files |
| `*ForAllPlayers()` functions | 127 call sites across 34 files |
| `safeFind()` calls | ~311 across 34 files |

## Size Progression (v1.010 → v1.110)

| Version | Bundle Size | Headroom | Delta | Phase/Feature |
|---------|-------------|----------|-------|---------------|
| v1.010 | 1,025,710 | 22,866 (2.2%) | — | Baseline (Phase 6 complete) |
| v1.015 | 1,018,977 | 29,599 (2.8%) | -6,733 | Phase 7 pre-game countdown, code cleanup |
| v1.019 | 1,020,363 | 28,213 (2.7%) | +1,386 | Phase 7 countdown rework (20s, COUNTDOWN phase, vehicle reset) |
| v1.020 | ~1,026,000 | ~22,576 (2.2%) | +~5,637 | Victory dialog ticket scoreboard, crowns, result line |
| v1.025 | 1,029,260 | 19,316 (1.8%) | +~3,260 | Victory dialog polish iterations, endMatch winner fix |
| v1.064 | 1,024,269 | 24,307 (2.3%) | -4,991 | CQ_Bug_25 world icon fix, AddUIIcon removal, code cleanup |
| v1.093 | 1,032,996 | 15,580 (1.5%) | +8,727 | Phase 10 polish: gadget locker, deploy timer UI, perf diag, admin panel |
| v1.103 | 1,037,197 | 11,379 (1.1%) | +4,201 | Gadget locker layout polish, FocusIn help text |
| v1.104 | 1,037,456 | 11,120 (1.1%) | +259 | CQ_Bug_40 fix: prebuild serialization lock + yield points + stagger |
| v1.109 | 1,038,457 | 10,119 (1.0%) | +1,001 | Pre-seat teleport added then stripped; map gate restore; net from iteration |
| v1.110 | 1,038,559 | 10,017 (1.0%) | +102 | CQ_Bug_39 hardening: 6 UnspawnObject try/catch guards |

**Key observations:**
- Headroom has dropped from 2.3% at v1.064 to 1.0% at v1.110 — **critically low**
- Phase 10 polish (v1.064→v1.103) consumed ~13,000 bytes: gadget locker rework, deploy timer UI, perf diag panel, admin panel enhancements
- The CQ_Bug_40 crash fix (v1.104) added only ~260 bytes — efficient for the impact
- Net change v1.010→v1.110: +12,849 bytes (headroom lost: 22,866 → 10,017)
- Any significant feature addition now risks exceeding the 1,048,576 byte limit
- **Size reduction work is no longer optional — it should precede any new feature work**

---

## Category 1: File Size Reduction (Top 5)

| # | Title | Est. Savings | Impact | Effort | Status |
|---|-------|-------------|--------|--------|--------|
| 1 | Gate UI Cache Perf instrumentation behind compile flag | 1,000-2,000 bytes | Medium | Low | Partially done (v1.089: panel deprecated, now 35 lines; counters + perf-diag aggregation remain) |
| 2 | Compress repetitive widget name generation | 2,000-4,000 bytes | Medium | Medium | Open |
| 3 | Deduplicate `*ForAllPlayers` boilerplate patterns | 2,000-3,000 bytes | Medium | Medium | Open |
| 4 | Gate perf diag panel behind compile flag | 3,000-5,000 bytes | High | Low | Open |
| 5 | Trim Changelog.ts history | 5,000-10,000 bytes | High | Low | Open (809 lines / 125.7K — oldest entries are dead weight in the bundle) |

**Total reclaimable: 13,000-24,000 bytes** (130-240% of current headroom recovered as buffer)

**Previously identified items — now resolved:**
- ~~Gate HUD Projection Debug snapshot~~ — Removed entirely (no `hudProjection*` references remain in src)
- ~~Gate UI Load Trace debug system~~ — `hud/ui-load-debug.ts` deleted; `pushUiLoadTraceForPid` no longer exists
- ~~Eliminate dead `HARD_PLAYER_LOCK_AUDIT_MODE` branches~~ — Constant and all guarded branches deleted (only Changelog.ts reference remains)
- ~~`setHudSwapTransitionActiveForPid` no-op~~ — Function removed, only `isHudSwapTransitionActiveForPid` remains (functional, used in 4 files)

### 1. [TRIM] UI Cache Perf Counters + Perf Diag Panel

**Files:** `hud/ui-cache-perf.ts` (35 lines), `hud/perf-diag.ts` (351 lines | 15.1K)

The standalone UI cache panel was deprecated in v1.089 and reduced to 35 lines of counter infrastructure. The remaining counters feed into the perf diag panel (`perf-diag.ts`, 351 lines). The perf diag panel is admin-toggleable and useful during MP testing, but at 15.1K it's the **8th largest source file** and contributes ~3-5% of headroom pressure.

**Recommended action:** Gate perf-diag.ts behind a compile flag. When disabled, `incrementUiCachePerfCounter` becomes a no-op, and the admin toggle button is hidden. Reclaims ~3,000-5,000 bytes when disabled. Keep the flag enabled during active MP testing; disable for release builds when headroom is needed.

### 2. Compress Repetitive Widget Name Generation

**Files:** `vehicles/deploy-timer-ui.ts` (1,961 lines | 85.3K), `interaction/ammo-resupply-menu.ts` (1,953 lines | 73.1K), `admin-panel/build.ts` (647 lines | 27.2K), `boundary/prompt-ui.ts` (477 lines | 19.2K)

These four files (combined 5,038 lines) use inline template literals for widget names: `VehicleDeployTimerRoot_${pid}`, `ArmMenuTile_${pid}_${col}_${row}`, etc. The same `prefix_${pid}_${suffix}` pattern repeats hundreds of times.

**Fix:** Single factory function `wn(prefix: string, ...parts: (number | string)[]): string` joining with `_`. Especially impactful in `deploy-timer-ui.ts` (85.3K — largest source file by far).

**Estimated savings:** 2,000-4,000 bytes

### 3. Deduplicate `*ForAllPlayers` Boilerplate

**Problem:** 127 call sites across 34 files use the `mod.AllPlayers()` / `CountOf` / `ValueInArray` / validity-check pattern. Many `*ForAllPlayers()` wrapper functions are thin for-loops over this boilerplate.

**Fix:** Create `forEachValidPlayer(cb: (player: mod.Player, pid: number) => void)`. Replace the 30+ thin wrappers that only iterate + delegate. This reduces bundle size from eliminating repeated loop scaffolding.

**Estimated savings:** 2,000-3,000 bytes

### 4. Gate Perf Diag Panel Behind Compile Flag

**File:** `hud/perf-diag.ts` (351 lines | 15.1K)

The section profiler, tick rate display, and cache aggregate panel are development-only. At 15.1K this is substantial bundle weight for a debug feature. The panel creates per-player widgets and maintains per-second timing state.

**Recommended action:** `const PERF_DIAG_ENABLED = true` compile flag. When false, all panel functions no-op and admin button is hidden. Toggle to false when shipping for size relief.

**Estimated savings:** 3,000-5,000 bytes (after dead code paths are eliminated by bundler inlining)

### 5. Trim Changelog.ts History

**File:** `Changelog.ts` (809 lines | 125.7K)

The full version history from v0.001 through v1.110 is compiled into the bundle. Only the most recent entries are useful at runtime (the branding title shows the current version). Older entries serve no runtime purpose.

**Fix:** Move entries older than v1.000 to a separate `CHANGELOG_ARCHIVE.md` (not compiled). Keep only the last ~50 entries in `Changelog.ts`.

**Estimated savings:** 5,000-10,000 bytes depending on cutoff point

---

## Category 2: Architecture and Organization (Top 5)

| # | Title | Impact | Effort | Status |
|---|-------|--------|--------|--------|
| 1 | Split `capture-tickets.ts` (2,159 lines) by concern | High | High | Open |
| 2 | Introduce shared `forEachValidPlayer()` abstraction | High | Medium | Open (also saves size — see Category 1 Item 3) |
| 3 | Consolidate `hud-warm-state.ts` 40+ getter/setter pairs | Medium | Medium | Open |
| 4 | Decouple debug/diagnostics state from core runtime | Medium | Medium | Partially done (hudProjection debug maps removed; perf diag and cache counters remain) |
| 5 | Extract loading gate into self-contained module | Medium | Medium-High | Open |

### 1. Split capture-tickets.ts

**Problem:** 2,159 lines mixing Phase 2A engine sync, ticket bleed math, end-condition checks, 7 combat HUD view model types, Phase 3 HUD projection publishing, and top-level dispatch. Violates single-responsibility. The single largest logic file besides the two UI builders.

**Fix:** Extract into at least 4 files:
- `capture-state.ts` — engine sync, point mapping, ownership tracking
- `ticket-bleed.ts` — bleed calculation and end-condition checks
- `combat-hud-viewmodel.ts` — all `ConquestHud*ViewModel` types and `derive*ViewModel` functions
- Keep tick-dispatch orchestration in `capture-tickets.ts` (now ~200 lines)

**Note:** This split has zero bundle size impact (bundler concatenates all files) but dramatically improves navigability and maintainability.

### 2. Shared `forEachValidPlayer()` Abstraction

**Problem:** 41 `mod.AllPlayers()` calls across 29 files with identical boilerplate:
```typescript
const players = mod.AllPlayers();
const count = mod.CountOf(players);
for (let i = 0; i < count; i++) {
    const player = mod.ValueInArray(players, i) as mod.Player;
    if (!player || !mod.IsPlayerValid(player)) continue;
    // ...
}
```
127 `*ForAllPlayers()` call sites duplicate this pattern.

**Fix:** Create `forEachValidPlayer(cb: (player: mod.Player, pid: number) => void)`. For tick-grouped operations, introduce a `TickContext` that caches the player list once per tick and passes it through to all subsystems.

### 3. Consolidate hud-warm-state.ts Getter/Setter Pairs

**Problem:** 40+ individual functions that are trivial one-liner accessors to `readyDialogData_t` fields. Each generates its own function body in the bundle. Examples: `setUiLoadGateActiveForPid`, `isUiLoadGateActiveForPid`, `setUiLoadGateReleasedForPid`, `isUiLoadGateReleasedForPid`, etc.

**Fix:** Generic `setPlayerGateFlag(pid, field, value)` / `getPlayerGateFlag(pid, field)` replacing ~40 functions with 2. Also saves bundle bytes.

### 4. Decouple Debug State from Core Runtime

**Problem:** `State.conquest.debug` still mixes authoritative state (`hudDirty`, `perspectiveTeamByPid`, `teamSwapHudResetPendingByPid`) with diagnostics (counter maps, status snapshots). The large HUD projection debug maps were removed, but perf counters and cache counters remain interleaved.

**Fix:** Move remaining diagnostic maps to `State.conquest.diagnostics` gated behind compile flags. This enables the size reductions in Category 1 Items 1 and 4.

### 5. Extract Loading Gate into Self-Contained Module

**Problem:** The loading gate state machine is spread across 5 files: `interaction/actions.ts` (757 lines), `interaction/hud-warm-state.ts`, `interaction/types.ts`, `index/player-join-leave.ts`, `index/player-deploy.ts`. The serialization lock and stagger logic added in v1.104 makes this even more important to centralize.

**Fix:** Dedicated `loading-gate.ts` module isolating gate lifecycle functions. Keep call sites in deploy/join files but centralize ownership, lock, and stagger state.

---

## Category 3: Crash Risks (Top 5)

| # | Title | Severity | Effort | Status |
|---|-------|----------|--------|--------|
| 1 | `for...in` with `delete` during iteration | Medium | Low | Partially fixed (boundary enforcement uses `AllPlayers()` iteration; registration uses `Object.keys()` snapshot; other `for...in` patterns remain — see below) |
| 2 | Stale widget references after team swap/reconnect | High | Medium | Open |
| 3 | Unbounded loading gate polling loop | ~~High~~ | ~~Low~~ | **Resolved** (v1.104 — `GATE_MAX_ITERATIONS = 1500` cap added alongside time-based timeout) |
| 4 | Inverted null guards in hot-path state accessors | Medium-High | Low | Open (`isHudWarmReadyForPid` still uses `!== false` which returns `true` for missing entries) |
| 5 | Race between async loading gate and synchronous deploy event | Medium-High | Low | Open |

### 1. `for...in` Patterns — Remaining Sites

The original two high-risk `for...in` + `delete` sites are resolved:
- `clearActiveBoundaryViolationsForAllPlayers` — now uses `mod.AllPlayers()` iteration
- `clearSpawnBaseTeamCache` — now uses `Object.keys()` snapshot

However, ~21 `for (const key in ...)` patterns remain across the codebase (capture-sound, capture-vo, perf-diag, map-runtime, deploy-timer-ui, lifecycle, ammo-resupply-menu, world-interactables, hud-core/state, roster-render, mode-config-readout). Most iterate read-only or append-only maps, which is safe. Review needed to confirm none perform `delete` inside the loop body.

### 2. Stale Widget References After Team Swap/Reconnect

**File:** `ui/conquest/hud-core/state.ts` — `twlConquestHudEntriesByPid[pid].widgets` (~30 cached handles per player)

The combat HUD only revalidates cached widget refs every 40 updates (`TWL_CONQUEST_HUD_RUNTIME_VALIDATION_INTERVAL_UPDATES`). If async code holds a reference to a widget that was destroyed during `cleanupHudForPid`, subsequent widget calls on that stale handle will throw.

**Fix:** Reduce validation interval to 5-10 during the first frames after a team swap. Add a `widgetGeneration` counter that increments on destroy and is checked before any cached-ref write.

### 3. Unbounded Loading Gate Polling Loop — RESOLVED

**Resolved in v1.104.** `GATE_MAX_ITERATIONS = 1500` added as belt-and-suspenders cap alongside the `GATE_TIMEOUT_SECONDS = 60` time-based timeout. If the iteration cap fires, a hard timeout message is logged to the world log.

### 4. Inverted Null Guards in Hot-Path State Accessors

**File:** `interaction/hud-warm-state.ts:171` — `isHudWarmReadyForPid(pid)`

Returns `getReadyDialogStateForPid(pid)?.hudWarmCompleted !== false`, which evaluates to `true` when the entry is missing (since `undefined !== false` is `true`). A player with no `readyDialogData` entry is incorrectly treated as "warm ready," which could allow premature UI reveals or gate bypasses.

**Fix:** Change to `=== true` (explicit true check). Audit all `!== false` / `!== undefined` guard patterns.

### 5. Race Between Async Loading Gate and Synchronous Deploy Event

**Files:** `index/player-deploy.ts` (`onPlayerDeployedImpl`), `interaction/actions.ts` (`runLoadingGateUntilReady`)

The deploy handler checks `isUiLoadGateActiveForPid(pid)` and force-undeploys, but there is a window where the gate loop's next iteration sees the player as "deployed" before the force-undeploy takes effect. The v1.104 serialization lock adds another dimension: if the deploy fires while another player holds the prebuild lock, the gate loop is paused at `_prebuildBusy`, and the deploy handler's force-undeploy may not be rechecked until the lock releases.

**Fix:** In the deploy handler, after force-undeploy, reassert gate visuals. Ensure the gate loop checks `State.players.deployedByPid[pid]` at the top of each iteration.

---

## Category 4: Performance Overhead (Top 5)

| # | Title | Per-Tick Savings | Impact | Effort | Status |
|---|-------|-----------------|--------|--------|--------|
| 1 | Cache `mod.AllPlayers()` once per tick | 5-7 engine calls/tick | High | Medium | Open (41 calls across 29 files; 6-8 per tick cycle) |
| 2 | Gate combat HUD render behind dirty flag | Skip 70-80% of renders | High | Medium | Open (`hudDirty` flag exists but `twlConquestHudTickFrame` still ignores it) |
| 3 | Replace string signatures with generation counters | Eliminate per-player string alloc | Medium | Medium | Open |
| 4 | Cache widget refs in hot render paths | Eliminate ~200 safeFind calls | Medium | Medium | Open (311 safeFind calls; combat HUD caches, but deploy-timer/boundary/clock do not) |
| 5 | Skip boundary checks for unmoving/undeployed players | Skip 60-80% of checks | Medium | Medium | Open |

### 1. Cache `mod.AllPlayers()` Once Per Tick

**Problem:** 41 `mod.AllPlayers()` calls across 29 files. In a single 0.12s tick cycle, 6-8 calls return the same list. At 8.3 ticks/second, that is 50-66 wasted engine API calls per second.

**Fix:** Fetch once at the top of the main game loop iteration. Pass as parameter or store in `TickContext`. Reduces 6-8 engine round-trips to 1.

### 2. Gate Combat HUD Render Behind Dirty Flag

**Problem:** `updateConquestCombatHudForAllPlayers` runs every 0.12s. Builds full view model snapshot per player even when nothing changed. `conquestPhase3MarkHudDirty()` sets `State.conquest.debug.hudDirty` but `twlConquestHudTickFrame` ignores it.

**Fix:** Gate per-player snapshot: `if (!force && !hudDirty && entry.mainUpdates > 0) continue;`. Most ticks during stable captures skip entirely.

### 3. Replace String Signatures with Generation Counters

**Problem:** `buildVehicleDeployTimerRenderPlan` constructs ~400-character signature strings per player per second-boundary tick even when no vehicle state changed.

**Fix:** Global `vehicleStateGeneration` counter incremented on any slot mutation. Compare `entry.lastVehicleGeneration !== vehicleStateGeneration` instead of string comparison.

### 4. Cache Widget Refs in Hot Render Paths

**Problem:** 311 `safeFind()` calls across 34 files. Each traverses the UI widget tree by name. Combat HUD caches refs in `TwlConquestHudPlayerEntry.widgets` — but `deploy-timer-ui.ts` (13 calls), `boundary/prompt-ui.ts` (25 calls), `clock/ui.ts` (17 calls), and `clock/timer-instance.ts` (29 calls) still use `safeFind` in render paths.

**Fix:** Cache widget refs in per-player structs after first lookup. Invalidate on destroy/rebuild.

### 5. Skip Boundary Checks for Unmoving/Undeployed Players

**Problem:** `tickBoundaryEnforcement()` checks all players every second. Most players during stable gameplay are undeployed or stationary in a safe zone.

**Fix:** Skip undeployed players (`if (!State.players.deployedByPid[pid]) continue`). For deployed players, track `lastBoundaryCheckPosition` per pid and skip if delta < threshold.

---

## Implementation Priority

Headroom is now **10,017 bytes (1.0%)** — critically low. Any significant feature addition risks exceeding the 1,048,576 byte limit. Optimization work must precede new feature work.

### Immediate (unblock feature headroom):

1. **Category 1, Item 5** — Trim Changelog.ts older entries to archive (low effort, 5,000-10,000 byte gain)
2. **Category 1, Item 2** — Compress widget name generation (medium effort, 2,000-4,000 byte gain)
3. **Category 1, Item 3** — Deduplicate `*ForAllPlayers` boilerplate (medium effort, 2,000-3,000 byte gain)
4. **Category 1, Item 4** — Gate perf diag behind compile flag (low effort, 3,000-5,000 byte gain when disabled)

**Expected headroom after immediate items:** ~22,000-32,000 bytes (2.1-3.1%) — comfortable for feature work.

### Before next MP test session:

5. **Category 3, Item 4** — Fix inverted `!== false` null guard in `isHudWarmReadyForPid` (low effort, high crash prevention)
6. **Category 4, Item 1** — Cache `mod.AllPlayers()` once per tick (most impactful single perf change)
7. **Category 4, Item 2** — Dirty-flag combat HUD render (most CPU time saved per tick)

### When time permits:

8. **Category 2, Item 1** — Split `capture-tickets.ts` (navigability, zero size impact)
9. **Category 2, Item 5** — Extract loading gate module (maintainability, especially with new serialization logic)
10. **Category 3, Item 2** — Widget generation counter to prevent stale ref crashes
