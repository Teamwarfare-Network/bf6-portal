# TWL Conquest Optimization Analysis

Last updated: v1.025 (2026-04-04)
Companion to: `TWL_Conquest_Design.md` (see "Codebase Reference Map" section for file/function index)

## Baseline

| Metric | Value |
|--------|-------|
| Bundle size | 1,029,260 bytes |
| Bundle limit | 1,048,576 bytes |
| Headroom | 19,316 bytes (1.8%) |
| Source files | 114 .ts |
| Source lines | ~23,900 |
| `mod.AllPlayers()` calls | 35 across 26 files |
| `*ForAllPlayers()` functions | 30+ |
| `safeFind()` calls | ~298 across 35 files |

## Size Progression (v1.010 → v1.025)

| Version | Bundle Size | Headroom | Delta | Phase/Feature |
|---------|-------------|----------|-------|---------------|
| v1.010 | 1,025,710 | 22,866 (2.2%) | — | Baseline (Phase 6 complete) |
| v1.015 | 1,018,977 | 29,599 (2.8%) | -6,733 | Phase 7 pre-game countdown, code cleanup |
| v1.019 | 1,020,363 | 28,213 (2.7%) | +1,386 | Phase 7 countdown rework (20s, COUNTDOWN phase, vehicle reset) |
| v1.020 | ~1,026,000 | ~22,576 (2.2%) | +~5,637 | Victory dialog ticket scoreboard, crowns, result line |
| v1.025 | 1,029,260 | 19,316 (1.8%) | +~3,260 | Victory dialog polish iterations, endMatch winner fix |

**Key observations:**
- Phase 7 pre-game cleanup (v1.015) reclaimed ~6,700 bytes through dead code removal
- Victory dialog scoreboard feature (v1.020-v1.025) added ~10,300 bytes net — new widgets, layout constants, string keys, crown images, result computation
- Net change v1.010→v1.025: +3,550 bytes (headroom lost: 22,866 → 19,316)
- Headroom is now at 1.8% — approaching the cautionary threshold for major new features

---

## Category 1: File Size Reduction (Top 5)

| # | Title | Est. Savings | Impact | Effort |
|---|-------|-------------|--------|--------|
| 1 | Gate UI Cache Perf instrumentation behind compile flag | 5,000-8,000 bytes | High | Medium |
| 2 | Gate HUD Projection Debug snapshot behind compile flag | 4,000-6,000 bytes | High | Low |
| 3 | Gate UI Load Trace debug system behind compile flag | 3,000-5,000 bytes | High | Low |
| 4 | Compress repetitive widget name generation | 2,000-4,000 bytes | Medium | Medium |
| 5 | Eliminate dead `HARD_PLAYER_LOCK_AUDIT_MODE` branches | 1,000-1,500 bytes | Medium | Low |

**Total reclaimable: 15,000-24,500 bytes** (78%-127% of current headroom recovered as buffer)

Items 1-3 are preserved for development use but should be gated behind compile-time flags when bundle pressure increases. Items 4-5 are pure dead code removals, safe to delete now.

### 1. [PRESERVE] UI Cache Perf Instrumentation System

**File:** `hud/ui-cache-perf.ts` (295 lines)
**References:** 114 across 14 files

Full per-player admin-toggleable HUD panel showing build/rebuild/cold/invalid counters for three UI families. Creates widget trees per player. Maintains `State.players.uiCachePerfByPid` maps.

**Recommended action:** Gate behind `const UI_CACHE_PERF_ENABLED = false`. When the flag is false, all `incrementUiCachePerfCounter` calls become no-ops, the panel build is skipped, and the admin toggle button is hidden. This reclaims ~5,000-8,000 bytes from the bundle when disabled while preserving the system for future development sessions.

### 2. [PRESERVE] HUD Projection Debug Snapshot State

**File:** `index/capture-tickets.ts` (function `conquestPhase3PublishHudProjectionDebugSnapshotForPid`)
**State:** 12+ per-player `Record<number, *>` maps in `State.conquest.debug`

The function runs per-player per-tick and is documented as: "diagnostics-only state, does not own or mutate render/gameplay decisions." The 12 maps (`hudProjectionEngagedObjIdByPid`, `hudProjectionPopoutVisibleByPid`, etc.) exist solely for admin debug display.

**Recommended action:** Gate behind `const HUD_PROJECTION_DEBUG_ENABLED = false`. Skip the snapshot function call and state map initialization when disabled. Reclaims ~4,000-6,000 bytes.

### 3. [PRESERVE] UI Load Trace Debug System

**File:** `hud/ui-load-debug.ts` (154 lines)
**References:** `pushUiLoadTraceForPid` — 29 occurrences across 7 files

Builds formatted 9-field trace strings per loading gate event (`{stamp}|{code}|s{id}|r{reason}|...`) and renders them in a debug panel. Useful during loading gate development.

**Recommended action:** Gate behind `const UI_LOAD_TRACE_ENABLED = false`. When disabled, `pushUiLoadTraceForPid` becomes a no-op and the debug panel is never built. Reclaims ~3,000-5,000 bytes.

### 4. Compress Repetitive Widget Name Generation

**Files:** `vehicles/deploy-timer-ui.ts`, `interaction/ammo-resupply-menu.ts`, `admin-panel/build.ts`, `boundary/prompt-ui.ts`

These four files (combined 4,925 lines) use inline template literals for widget names: `VehicleDeployTimerRoot_${pid}`, `VehicleDeployTimerRow_${pid}_${rowIndex}`, etc. The same `prefix_${pid}_${suffix}` pattern repeats hundreds of times.

**Fix:** Create a single factory function `wn(prefix: string, pid: number, ...parts: (number | string)[]): string` that joins with `_`. Replace inline template literals across all four files. This is especially effective in `deploy-timer-ui.ts` where the same row-index pattern repeats across 12+ widget types per row.

**Estimated savings:** 2,000-4,000 bytes

### 5. Eliminate Dead `HARD_PLAYER_LOCK_AUDIT_MODE` Branches

**File:** `interaction/types.ts` — `const HARD_PLAYER_LOCK_AUDIT_MODE = false`

This `const false` has 6 guarded branches that compile into the bundle because the bundler does not perform dead-code elimination. Also, `setHudSwapTransitionActiveForPid` in `hud-warm-state.ts` is a documented "No-op" that still has a function body and call sites.

**Fix:** Delete the constant, all `if (HARD_PLAYER_LOCK_AUDIT_MODE)` branches, the no-op function, and its call sites.

**Estimated savings:** 1,000-1,500 bytes

---

## Category 2: Architecture and Organization (Top 5)

| # | Title | Impact | Effort |
|---|-------|--------|--------|
| 1 | Split `capture-tickets.ts` (2,238 lines) by concern | High | High |
| 2 | Introduce shared `forEachValidPlayer()` abstraction | High | Medium |
| 3 | Consolidate `hud-warm-state.ts` 40+ getter/setter pairs | Medium | Medium |
| 4 | Decouple debug/diagnostics state from core runtime | Medium | Medium |
| 5 | Extract loading gate into self-contained module | Medium | Medium-High |

### 1. Split capture-tickets.ts

**Problem:** 2,238 lines mixing Phase 2A engine sync, ticket bleed math, end-condition checks, 7 combat HUD view model types, Phase 3 HUD projection publishing, and top-level dispatch. Violates single-responsibility. Nearly impossible to navigate.

**Fix:** Extract into at least 4 files:
- `capture-state.ts` — engine sync, point mapping, ownership tracking
- `ticket-bleed.ts` — bleed calculation and end-condition checks
- `combat-hud-viewmodel.ts` — all `ConquestHud*ViewModel` types and `derive*ViewModel` functions
- Keep tick-dispatch orchestration in `capture-tickets.ts` (now ~200 lines)

### 2. Shared `forEachValidPlayer()` Abstraction

**Problem:** 35 `mod.AllPlayers()` calls across 26 files with identical boilerplate:
```typescript
const players = mod.AllPlayers();
const count = mod.CountOf(players);
for (let i = 0; i < count; i++) {
    const player = mod.ValueInArray(players, i) as mod.Player;
    if (!player || !mod.IsPlayerValid(player)) continue;
    // ...
}
```
30+ `*ForAllPlayers()` functions duplicate this pattern.

**Fix:** Create `forEachValidPlayer(cb: (player: mod.Player, pid: number) => void)`. For tick-grouped operations, introduce a `TickContext` that caches the player list once per tick and passes it through to all subsystems.

### 3. Consolidate hud-warm-state.ts Getter/Setter Pairs

**Problem:** 40+ individual functions that are trivial one-liner accessors to `readyDialogData_t` fields. Each generates its own function body in the bundle. Examples: `setUiLoadGateActiveForPid`, `isUiLoadGateActiveForPid`, `setUiLoadGateReleasedForPid`, `isUiLoadGateReleasedForPid`, etc.

**Fix:** Generic `setPlayerGateFlag(pid: number, field: keyof readyDialogData_t, value: boolean)` / `getPlayerGateFlag(pid: number, field: keyof readyDialogData_t): boolean` replacing ~40 functions with 2. Also saves ~5,000+ bytes in the bundle.

### 4. Decouple Debug State from Core Runtime

**Problem:** `State.conquest.debug` mixes authoritative runtime state (`hudDirty`, `perspectiveTeamByPid`, `teamSwapHudResetPendingByPid`) with pure diagnostics (`hudProjection*ByPid`, `hudStatusVmByPid`, counter maps). Makes it unclear what is essential vs. optional.

**Fix:** Separate into `State.conquest.core` (authoritative — must exist for gameplay) and `State.conquest.diagnostics` (optional — can be gated behind compile flags). This enables the size reductions in Category 1 items 1-3.

### 5. Extract Loading Gate into Self-Contained Module

**Problem:** The loading gate state machine is spread across 5 files: `interaction/actions.ts`, `interaction/hud-warm-state.ts`, `interaction/types.ts`, `index/player-join-leave.ts`, `index/player-deploy.ts`. Understanding the full gate lifecycle requires reading all 5.

**Fix:** Dedicated `loading-gate.ts` module with a `GateSessionState` type isolating gate lifecycle functions (`beginLoadingGate`, `runLoadingGateUntilReady`, `releaseLoadingGate`, `maintainPlayerLoadingGateAuthority`). Keep call sites in deploy/join files but centralize ownership.

---

## Category 3: Crash Risks (Top 5)

| # | Title | Severity | Effort |
|---|-------|----------|--------|
| 1 | `for...in` with `delete` during iteration | High | Low |
| 2 | Stale widget references after team swap/reconnect | High | Medium |
| 3 | Unbounded loading gate polling loop | High | Low |
| 4 | Inverted null guards in hot-path state accessors | Medium-High | Low |
| 5 | Race between async loading gate and synchronous deploy event | Medium-High | Low |

### 1. `for...in` with `delete` During Iteration

**Files:** `boundary/enforcement.ts` (`clearActiveBoundaryViolationsForAllPlayers`), `vehicles/registration.ts` (`clearSpawnBaseTeamCache`)

Both iterate with `for (const key in map)` and `delete map[key]` inside the loop body. While V8 defines this behavior (skipping already-deleted keys), the Portal scripting engine may not follow V8's exact semantics. Future changes could introduce mutations within the loop body that add keys, causing skips.

**Fix:** Collect keys first with `Object.keys()`, iterate the snapshot array, then delete. Or reassign `= {}` when the intent is to clear all entries. ~5 call sites.

### 2. Stale Widget References After Team Swap/Reconnect

**File:** `ui/conquest/hud-core/state.ts` — `twlConquestHudEntriesByPid[pid].widgets` (~30 cached handles per player)

The combat HUD only revalidates cached widget refs every 40 updates (`TWL_CONQUEST_HUD_RUNTIME_VALIDATION_INTERVAL_UPDATES`). If async code (loading gate, countdown flow) holds a reference to a widget that was destroyed during `cleanupHudForPid`, subsequent `mod.SetUIWidgetVisible()` or `mod.SetUITextLabel()` calls on that stale handle will throw.

**Fix:** Reduce validation interval to 5-10 during the first frames after a team swap. Add a `widgetGeneration` counter that increments on destroy and is checked before any cached-ref write.

### 3. Unbounded Loading Gate Polling Loop

**File:** `interaction/actions.ts` — `runLoadingGateUntilReady`

The function runs a `while (true)` loop with `await mod.Wait(HUD_WARM_READY_POLL_SECONDS)`. It has a time-based hard timeout (`GATE_TIMEOUT_SECONDS = 60`) but if `mod.GetMatchTimeElapsed()` stalls, returns unexpected values, or the engine restarts the match, the elapsed computation could remain below the timeout indefinitely. An infinite loop in the single-threaded engine blocks all game processing.

**Fix:** Add an absolute iteration cap (e.g., 1200 iterations at 0.05s = 60s) as a belt-and-suspenders failsafe alongside the time-based timeout. Log when the iteration cap fires.

### 4. Inverted Null Guards in Hot-Path State Accessors

**File:** `interaction/hud-warm-state.ts` — `isHudWarmReadyForPid(pid)`

Returns `getReadyDialogStateForPid(pid)?.hudWarmCompleted !== false`, which evaluates to `true` when the entry is missing (since `undefined !== false` is `true`). A player with no `readyDialogData` entry is incorrectly treated as "warm ready," which could allow premature UI reveals or gate bypasses.

**Fix:** Change to `=== true` (explicit true check). Audit all `!== false` / `!== undefined` guard patterns across the codebase — estimated ~10 sites with similar inverted logic.

### 5. Race Between Async Loading Gate and Synchronous Deploy Event

**Files:** `index/player-deploy.ts` (`onPlayerDeployedImpl`), `interaction/actions.ts` (`runLoadingGateUntilReady`)

`onPlayerDeployedImpl` fires synchronously when the engine triggers a deploy event. Meanwhile, `runLoadingGateUntilReady` may be mid-`await`. The deploy handler already checks `isUiLoadGateActiveForPid(pid)` and force-undeploys, but there is a window where the gate loop's next iteration sees the player as "deployed" before the force-undeploy takes effect.

**Fix:** In the deploy handler, after the force-undeploy, also push a specific trace event `DEPLOY_DURING_GATE` and explicitly reassert the gate visuals. Ensure the gate loop checks `State.players.deployedByPid[pid]` at the top of each iteration and force-undeploys if still true.

---

## Category 4: Performance Overhead (Top 5)

| # | Title | Per-Tick Savings | Impact | Effort |
|---|-------|-----------------|--------|--------|
| 1 | Cache `mod.AllPlayers()` once per tick | 5-7 engine calls/tick | High | Medium |
| 2 | Gate combat HUD render behind dirty flag | Skip 70-80% of renders | High | Medium |
| 3 | Replace string signatures with generation counters | Eliminate per-player string alloc | Medium | Medium |
| 4 | Cache widget refs in hot render paths | Eliminate ~200 safeFind calls | Medium | Medium |
| 5 | Skip boundary checks for unmoving/undeployed players | Skip 60-80% of checks | Medium | Medium |

### 1. Cache `mod.AllPlayers()` Once Per Tick

**Problem:** Currently 6-8 `mod.AllPlayers()` calls per 0.12s tick cycle, all returning the same list. At 8.3 ticks/second, that is 40-58 wasted engine API calls per second. Each call may involve engine-side array construction.

Callers in a single tick cycle:
- `conquestPhase2ARefreshLiveCaptureStateSubtick()` -> `conquestPhase3RefreshTopHudDerivedSlicesForAllPlayers()`
- `updateConquestCombatHudForAllPlayers()` -> `twlConquestHudTickFrame()`
- `conquestPhase4FlushCaptureSoundQueue()` (recipient resolution)
- `conquestPhase4BFlushCaptureVoiceOverQueue()` (recipient resolution)
- Second boundary: `updateVehicleDeployTimerHudForAllPlayers()`, `tickBoundaryEnforcement()`, `ensureActiveWorldInteractablesReady()`

**Fix:** Fetch `mod.AllPlayers()` once at the top of the main game loop iteration. Pass as a parameter to all subsystem functions, or store in a `TickContext` struct that subsystems read. This reduces 6-8 engine round-trips to 1.

### 2. Gate Combat HUD Render Behind Dirty Flag

**Problem:** `updateConquestCombatHudForAllPlayers` runs every 0.12s during a live match. Inside `twlConquestHudTickFrame`, it builds a full view model snapshot per player (ticket counts, flag states, engage states, help/ready visibility). Even when nothing has changed (stable capture, no player movement), the full computation runs. The `conquestPhase3MarkHudDirty()` function already sets `State.conquest.debug.hudDirty` but `twlConquestHudTickFrame` ignores it.

**Fix:** Gate the snapshot build: `if (!force && !State.conquest.debug.hudDirty && entry.mainUpdates > 0) continue;` per player. Most ticks during stable captures will skip the render entirely. The existing `hudDirty` flag is already set on all state mutations that affect the HUD.

### 3. Replace String Signatures with Generation Counters

**Problem:** `buildVehicleDeployTimerRenderPlan` (in `deploy-timer-ui.ts`) constructs a signature string by concatenating slot state for every slot on every call: `'#${i}:${slot.slotNumber},${slot.vehicleType},...'`. This ~400-character string is built per player per second-boundary tick even when no vehicle state has changed. The same pattern exists in ready-dialog section signatures.

**Fix:** Increment a global `vehicleStateGeneration` counter whenever any slot state changes (spawn, destroy, respawn timer tick). Compare `entry.lastVehicleGeneration !== vehicleStateGeneration` instead of building and comparing strings. Slot-level changes are already channeled through mutation functions in `spawner-sequence.ts` and `spawner-slots.ts`.

### 4. Cache Widget Refs in Hot Render Paths

**Problem:** ~298 `safeFind()` calls across 35 files. Each call invokes `mod.FindUIWidgetWithName(name, mod.GetUIRoot())`, traversing the UI widget tree by name string. With 16 players each adding ~50+ widgets, the tree can be 800+ nodes. The combat HUD already caches refs in `TwlConquestHudPlayerEntry.widgets` — but `deploy-timer-ui.ts`, `boundary/prompt-ui.ts`, and `clock/ui.ts` still use `safeFind` in their render paths.

**Fix:** Cache widget refs in per-player entry structs after the first successful lookup. Invalidate cached refs on destroy/rebuild. Extend the combat HUD's caching pattern to deploy-timer, boundary, and clock subsystems. This could eliminate ~200 of the 298 `safeFind` calls in hot paths.

### 5. Skip Boundary Checks for Unmoving/Undeployed Players

**Problem:** `tickBoundaryEnforcement()` calls `refreshBoundaryStateForAllPlayers()` every second, which iterates all players and for each calls `refreshPlayerBoundaryState()`. This checks 3 zone triggers and manages violation state per player. During stable gameplay, most players are either undeployed (in deploy screen) or stationary in a safe zone.

**Fix:** Skip undeployed players entirely (`if (!State.players.deployedByPid[pid]) continue`). For deployed players, track `lastBoundaryCheckPosition` per pid and skip the check if the player's position delta is below a threshold (e.g., 5 meters). This could reduce checks from N players to ~2-4 deployed-and-moving players in typical gameplay.

---

## Implementation Priority

Headroom is now 19,316 bytes (1.8%). If Phase 8 spawn data adds ~5,000-10,000 bytes for per-flag spawn arrays, headroom could drop below 10,000 bytes. Optimization work should be prioritized alongside or before Phase 8 implementation. Recommended execution order:

1. **Category 1, Item 5** — delete dead `HARD_PLAYER_LOCK_AUDIT_MODE` branches (low effort, immediate 1,000-1,500 byte gain)
2. **Category 1, Item 4** — compress widget name generation (medium effort, 2,000-4,000 byte gain)
3. **Category 1, Items 1-3** — gate debug systems behind compile flags (medium effort, 12,000-19,000 byte gain when disabled)
4. **Category 2, Item 2** — shared `forEachValidPlayer()` (reduces both code size and per-tick overhead)
5. **Category 3, Items 1+3** — fix iteration safety and add gate loop cap (low effort, high crash prevention)

For performance improvements during multiplayer testing:

1. **Category 4, Item 1** — cache `mod.AllPlayers()` once per tick (most impactful single change)
2. **Category 4, Item 2** — dirty-flag combat HUD render (most CPU time saved per tick)
