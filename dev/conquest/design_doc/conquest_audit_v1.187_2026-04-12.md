# Conquest Audit v1.187→v1.190 | 2026-04-12

Review type: current working-tree review, pre-Phase 10 optimization pass.
Updated: v1.190 results incorporated inline. Resolved items marked ~~strikethrough~~ or ✅.

- Repo root: `bf6-portal`
- Mode root: `dev/conquest`
- Primary code surface: `dev/conquest/src`
- Working-tree bundle version: `v1.190` (was v1.187 at audit start)
- Date perspective: `2026-04-12`
- Source file count: 116 (115 .ts + 1 .json) — 3 stub files deleted
- Bundle size (script): **995,854 bytes** (was 1,044,501)
- Bundle size (strings): 19,811 bytes (was 19,936)
- Bundle limit: 1,048,576 bytes (1 MiB)
- Headroom: **52,722 bytes (5.03%)** (was 4,075 / 0.39%)
- Headroom recovered in v1.188–v1.190: **+48,647 bytes**
- Static verification: `tsc --noEmit` passed; `npm run build` passed

## 1. Executive Summary

The codebase has matured significantly since the v0.725 audit. Phase 9 (KPI/scoreboard) is now implemented, boundary enforcement has been hardened with vehicle-exit checks, and several critical performance fixes (CQ_Bug_40/41) have dramatically reduced per-frame budget usage. The three ownership hotspots from v0.725 remain (`capture-tickets.ts`, `actions.ts`, `deploy-timer-ui.ts`), but they are stable and functional.

~~**Critical concern: bundle headroom is critically low at 4,075 bytes (0.39%).** Any new feature work requires aggressive dead-code cleanup first.~~

**✅ v1.190: Headroom crisis resolved.** Recovered 48,647 bytes through feature flag disabling, dead code deletion, duplicate call removal, and widget name cleanup. Headroom now at 52,722 bytes (5.03%). Phase 10 feature work can proceed.

### What is healthy now:

- Main game loop is well-structured: subtick (0.12s) for capture state, second-boundary (1s) for scoreboard/clock/boundary/interactables. No unnecessary per-subtick work.
- `OngoingPlayer` is lean: gate enforcement + interact check only. No UI update work.
- Per-violation boundary enforcement uses self-terminating async loops, not all-player polling.
- Vehicle deploy timers use per-slot self-terminating countdown loops.
- KPI tracking is event-driven with dirty-flag gating on scoreboard sync.
- Feature flag system with postbuild dead-code elimination works correctly.
- File organization is strong: 118 files across 27 directories with clear domain boundaries and no circular dependencies.
- Module comment compliance is at 93% (106/118 files have proper `// Module:` headers).
- Dependency graph is acyclic; all subsystems flow through the centralized `State` object.

### What needs attention:

- ~~**Headroom crisis**: 4,075 bytes remaining. Several diagnostic features shipping in production burn space unnecessarily.~~ ✅ v1.190: Resolved. 52,722 bytes headroom.
- ~~**Diagnostic flags left on**: `FEATURE_WORLD_ICON_DIAG = true` and `FEATURE_POSITION_DEBUG = true` are shipping in production. Both are dev tools.~~ ✅ v1.190: All three dev flags (`FEATURE_WORLD_ICON_DIAG`, `FEATURE_POSITION_DEBUG`, `FEATURE_ADMIN_PANEL`) set to `false`.
- ~~**Duplicate function calls**: Several handlers call the same cleanup function twice.~~ ✅ v1.190: Both duplicates removed.
- **Three mega-files** still dominate: `capture-tickets.ts` (87.6K), `deploy-timer-ui.ts` (86.2K), `ammo-resupply-menu.ts` (73.3K).
- ~~**Widget cleanup fragility**: Join/leave handlers use long hardcoded widget name lists for deletion — brittle and space-expensive.~~ ✅ v1.190: Culled 52 orphaned widget names (22 in `resetUiForPlayerOnJoin`, 30 in `cleanupHudForPid`). Lists now contain only verified active names.
- **Critical async race conditions**: Deploy-fulfillment, boundary enforcement, and vehicle respawn have unguarded async gaps that can cause silent failures.
- ~~**Dead code shipping**: ~18K bytes of disabled feature modules (`perf-diag.ts`, `ui-cache-perf.ts`) ship dead in production.~~ ✅ v1.190: All diagnostic modules excluded via feature flags + postbuild stripping. Join-prompt stubs deleted. VFX dead constants deleted. `statusProbeCodex` test string removed.
- **Comment gaps**: ~30 public functions missing header comments; 2 files missing module comments entirely.

---

## 2. Performance Audit

### 2.1 Main Game Loop (`index/game-mode.ts`)

The main loop runs at 0.12s (CONQUEST_LIVE_STATE_SUBTICK_SECONDS). Structure is correct:

**Every subtick (~8x/sec) while live:**
- `conquestPhase2ARefreshLiveCaptureStateSubtick()` — capture progress polling. Required for responsive fill bars.
- `conquestPhase4FlushCaptureSoundQueue()` — dequeues pending capture sounds.
- `conquestPhase4BFlushCaptureVoiceOverQueue()` — dequeues pending VOs.
- `updateConquestCombatHudForAllPlayers()` — renders dirty HUD entries. Gated by dirty flag system. Acceptable.

**Every second (1x/sec) while live:**
- `conquestPhase2AOnLiveTick()` — ticket bleed, end-condition check. Required.
- `scoreboardSyncTick()` — pushes dirty KPI values. Internally gated to 1s. Correct (fixed in v1.185).

**Every second (always):**
- `updateAllPlayersClock()` — clock digit updates. Low cost.
- `ensureActiveWorldInteractablesReady()` — world interactable health check.
- `checkTakeoffLimitForAllPlayers()` — aircraft altitude enforcement.

**Performance verdict: GOOD overall, with one significant hotspot.** No unnecessary per-subtick work. The v1.185 fix correctly moved scoreboard sync to second-boundary. The critical flash subtick path for clock is appropriately conditional.

### 2.1a CRITICAL: `safeFindPlayer()` in Capture Point Tick

**File:** `index/capture-tickets.ts` line 1786
**Frequency:** Every 0.12s, for EVERY player on EVERY capture point.

`safeFindPlayer(pid)` calls `mod.AllPlayers()` + iterates the entire player list to find a player by PID. This is called inside the per-player-on-point loop within `conquestPhase2AOnCapturePointTick()`.

With 5 capture points and 3 players per point, this is 15 full `AllPlayers()` iterations every 0.12s = 125 full player-list scans per second. With 16+ players (4v4), costs multiply further.

**Root cause:** Lines 1786-1792 look up the "live player" from AllPlayers to resolve the authoritative team — but `pointPlayer` from `mod.GetPlayersOnPoint()` (line 1779) IS the live engine reference. The `safeFindPlayer` re-lookup appears unnecessary; the team can be read directly from `pointPlayer`.

**File:** `state/player-lookup.ts`
`safeFindPlayer` itself is O(N) per call — it iterates all players every time. It has 19 call sites across the codebase, but only the capture-tick one is in a hot loop.

**OPTIMIZATION: Replace `safeFindPlayer(pointPid)` with direct use of `pointPlayer`.** The team resolution at lines 1787-1798 can use `pointPlayer` directly since it's already a validated engine reference from `GetPlayersOnPoint`. This eliminates 10-50 unnecessary `AllPlayers()` iterations per subtick.

### 2.2 OngoingPlayer (`index/player-loop-inputs.ts`)

Fires per-player per-engine-tick (~10-30Hz depending on engine). Current contents:

1. `maintainUiLoadingGateWhileUnreleased()` — early-out if no gate active. Only runs engine calls if overlay not shown. Acceptable.
2. `enforceUiLoadingGateWhileDeployed()` — early-out if no gate active. Only runs if player slipped through. Acceptable.
3. `checkReadyDialogInteractPointRemoval()` — unknown cost, needs review.
4. `InteractMultiClickDetector.checkMultiClick()` — lightweight state check.

**Performance verdict: ACCEPTABLE.** Most paths early-return cheaply. The gate enforcement is defensive and necessary.

### 2.3 ForAllPlayers Iteration Patterns

Functions that iterate all connected players via `mod.AllPlayers()` + `mod.CountOf()`:

| Function | Called from | Frequency | Assessment |
|----------|-----------|-----------|------------|
| `updateConquestCombatHudForAllPlayers` | subtick (live) | ~8x/sec | Dirty-flag gated, acceptable |
| `updateAllPlayersClock` | second-boundary | 1x/sec | Low cost |
| `updateScoreboardForAllPlayers` | second-boundary | 1x/sec | Dirty-flag gated, acceptable |
| `updateScoreboardTeamScores` | second-boundary | 1x/sec | 2 API calls, trivial |
| `checkTakeoffLimitForAllPlayers` | second-boundary | 1x/sec | Acceptable |
| `syncDiagCounterForAllPlayers` | event-driven | per icon spawn/destroy | **UNNECESSARY in production** |
| `ensureActiveWorldInteractablesReady` | second-boundary | 1x/sec | Acceptable |

~~**OPTIMIZATION: Disable `FEATURE_WORLD_ICON_DIAG`.** It calls `syncDiagCounterForAllPlayers()` on every world icon spawn/destroy event, iterating all players for a diagnostic widget update. This flag was explicitly documented as temporary in v1.158.~~ ✅ v1.190: Flag set to `false`. Code stripped by postbuild.

### 2.4 Async Loop Patterns

All self-terminating async loops use token guards correctly:
- `runBoundaryViolationEnforcementLoop` — per-violation, 1s tick, token-guarded.
- `runVehicleTimerCountdownLoop` — per-slot, 1s tick, generation-guarded.
- `runArmMenuRefreshLoop` — per-player, 1Hz, close/leave termination.
- `runLoadingGateUntilReady` — per-player, join lifecycle.

No accumulation risk detected.

---

## 3. File Organization Audit

### 3.1 Top 10 Largest Files (Source Bytes)

| # | File | Bytes | Lines | Assessment |
|---|------|-------|-------|------------|
| 1 | Changelog.ts | 137,088 | 873 | ~0 bundle (stripped). Fine. |
| 2 | capture-tickets.ts | 87,640 | 2,161 | **Too large.** Owns capture ingestion + tickets + bleed + end checks + HUD projection + popout/engage. |
| 3 | deploy-timer-ui.ts | 86,240 | 1,977 | **Too large.** Owns policy + visibility + render plan + widget build + input. |
| 4 | ammo-resupply-menu.ts | 73,298 | 1,957 | **Too large.** Self-contained gadget menu. Could split build vs events. |
| 5 | hud-core/build.ts | 44,849 | 1,115 | Large but single-purpose widget construction. Acceptable. |
| 6 | config/map-runtime.ts | 34,291 | 788 | Map detection + config application + spawner relocation. Acceptable. |
| 7 | interaction/actions.ts | 33,727 | 760 | Loading gate orchestrator. Complex but necessary. |
| 8 | hud-core/render.ts | 31,696 | 667 | HUD rendering. Could split into render-flags / render-tickets / render-popout / render-common. |
| 9 | victory-build.ts | 25,075 | 527 | Victory dialog widgets. Acceptable. |
| 10 | vehicles/deploy-fulfillment.ts | 23,371 | 530 | Direct vehicle spawn. Acceptable. |

**Recommendation:** The top 3 non-changelog files should be split if any significant new work touches them. However, splitting purely for organization carries risk and should not be done during a headroom crisis.

### 3.2 File Naming and Placement

- **Consistent naming:** All files use kebab-case. Module headers present in most files. Good.
- **`kpi/` directory:** Correctly placed. Small, focused files. Good.
- **`boundary/` directory:** Clean separation of enforcement logic vs prompt UI.
- **`position-debug.ts` in `hud/`:** Correct placement — it's a HUD overlay.
- **`conquest-flow.ts` at root:** Contains `startMatch`, `endMatch`, `triggerFreshMatchSetup` plus `syncDiagCounterForAllPlayers`. The diag counter function should move to a diag-specific location or be removed.

### 3.3 Module Structure

The project uses a concatenation-based bundler (no ES imports). All files share a single global scope. This is by design for the Portal scripting environment.

**Cross-file coupling concerns:**
- `capture-tickets.ts` reaches into HUD render, status, clock, and flow systems. This is the #1 coupling hotspot.
- `actions.ts` orchestrates across HUD warm, reveal, deploy gating, team swap, and deferred UI prebuild. Necessary but complex.
- Most other files have clean ownership boundaries.

### 3.4 Directory Structure Assessment

| Directory | Files | Bytes | Domain | Clarity |
|-----------|-------|-------|--------|---------|
| `config/` | 6 | 99,552 | Configuration | Excellent |
| `state/` | 10 | 80,380 | State management | Excellent |
| `vehicles/` | 13 | 251,349 | Vehicle systems | Excellent |
| `boundary/` | 2 | 32,692 | Boundary enforcement | Excellent |
| `clock/` | 3 | 40,419 | Timer systems | Excellent |
| `kpi/` | 2 | 8,407 | Player stats | Excellent |
| `interaction/` | 10 | 158,592 | Player interaction | Good |
| `hud/` | 6 | 61,336 | HUD helpers | Good |
| `ui/` | 16 | 191,858 | UI rendering | Excellent |
| `ready-dialog/` | 17 | 98,149 | Pre-game UI | Good |
| `index/` | 11 | 163,075 | Game flow | Good* |
| `foundation/` | 3 | 44,558 | Shared types | Excellent |
| `admin-panel/` | 3 | ~14,000 | Admin features | Good |
| `strings/` | 1 | 8,706 | UI IDs | Good |
| `utils/` | 2 | 2,897 | Utilities | Acceptable |

**\* `index/`** contains both lifecycle handlers AND distributed gameplay systems (capture, vehicles, KPI events). Acceptable but could be cleaner.

### 3.5 Naming Ambiguities

| Issue | Files | Recommendation |
|-------|-------|----------------|
| Duplicate scaffold names | `hud/conquest-scaffold.ts` vs `index/conquest-scaffold.ts` | Clarify with prefix or rename |
| Config in wrong directory | `utils/main-base.ts` contains map position config | Move to `config/main-base.ts` |
| Empty directories | `loaders/`, `team-switch/` | Delete or document intended use |
| Audio in index | `index/capture-sound.ts`, `index/capture-vo.ts` | Could move to dedicated `audio/` directory |

### 3.6 Dependency Graph

**No circular dependencies detected.** Dependency flow is:

```
index.ts (hub)
  → index/* (lifecycle handlers)
    → state/* (centralized State object)
    → config/* (constants, map data)
    → vehicles/*, boundary/*, kpi/* (domain systems)
      → foundation/* (base types, layout)
        → ui/* (rendering — no gameplay logic)
```

All subsystems import from `state/runtime-state.ts` (single source of truth). Config flows unidirectionally from `config/` into runtime derivation. UI files contain no gameplay logic.

---

## 4. Dead Code and Bundle Size Opportunities

### 4.1 Feature Flags — Status as of v1.190

| Flag | v1.187 | v1.190 | Status |
|------|--------|--------|--------|
| `FEATURE_WORLD_ICON_DIAG` | `true` | `false` | ✅ Disabled in v1.190 |
| `FEATURE_POSITION_DEBUG` | `true` | `false` | ✅ Disabled in v1.190 |
| `FEATURE_ADMIN_PANEL` | `true` | `false` | ✅ Disabled in v1.190 (source preserved, imports commented with `@feature` annotations) |
| `FEATURE_PERF_DIAG` | `false` | `false` | Already excluded |
| `FEATURE_JOIN_PROMPT` | `false` | `false` | Already excluded |

All five feature flags are now `false`. Postbuild strips all guarded code blocks. Commented imports in `index.ts` tagged with `// @feature FEATURE_*` prevent the source files from entering the bundle.

### 4.2 ~~Duplicate Function Calls~~ ✅ Fixed in v1.190

| File | Function | Issue | Status |
|------|----------|-------|--------|
| `player-join-leave.ts:18,58` | `destroyArmMenu(pid)` | Called twice in `resetUiForPlayerOnJoin` | ✅ Duplicate removed |
| `player-join-leave.ts:190,209` | `cleanupWorldInteractableRuntimeIconsForPid(pid)` | Called twice in `onPlayerLeaveGameImpl` | ✅ Duplicate removed |

### 4.3 ~~Widget Name Cleanup Lists~~ ✅ Audited and Culled in v1.190

`resetUiForPlayerOnJoin` and `cleanupHudForPid` contained long hardcoded lists of widget names to delete. v1.190 audit cross-referenced every name against creation sites:

- **`resetUiForPlayerOnJoin`**: 22 orphaned names removed, 3 active names retained (`TwlConquestStatusDockRoot`, `TwlConquestStatusDockState`, `TwlConquestStatusDockReady`).
- **`cleanupHudForPid`**: 30 orphaned names removed, 13 active names retained (including `TopHudRoot`, `ConquestTopCenterAuxRoot`, `AdminPanelActionCount`, `VictoryDialogRoot`, `MatchTimerRoot`, `VehicleDeployTimerHudRoot`, `PregameCountdownText`, and 6 others).
- **Total strings removed**: 52 orphaned widget name strings.

### 4.4 Dead Feature Modules (Disabled but Shipping)

**`hud/perf-diag.ts`** — 351 lines, 15,136 bytes. Entire file is dead when `FEATURE_PERF_DIAG = false`. Contains 12 functions and 20+ constants that never execute. The import is commented out in `index.ts` lines 27-28 with `@feature FEATURE_PERF_DIAG`.

Dead functions: `perfDiagBeginSection`, `perfDiagEndSection`, `perfDiagAggregateUiCache`, `perfDiagOngoingGlobalTick`, `perfDiagUpdateHudForAllPlayers`, `perfDiagUpdateHudForPid`, `perfDiagResetWindow`, `buildPerfDiagWidgetsForPlayer`, `deletePerfDiagWidgetsForPid`, `setPerfDiagEnabled`, `ensurePerfDiagWidgetsForPlayer`, `cleanupPerfDiagWidgetsForPid`.

Dead state fields in `runtime-state.ts` lines 236-244: `State.admin.perfDiagEnabled`, `perfDiagTickCount`, `perfDiagWindowStart`, `perfDiagLastTickRate`, `perfDiagLastEmitAt`, `perfDiagSpikeTotal`, `perfDiagMinTickRate`, `perfDiagSectionMax`, `perfDiagSectionHits`.

**`hud/ui-cache-perf.ts`** — 35 lines, 1,540 bytes. Counter functions (`ensureUiCachePerfCountersForPid`, `resetUiCachePerfCountersForPid`, `incrementUiCachePerfCounter`) are called unconditionally from `dialog-build.ts`, `ammo-resupply-menu.ts`, `deploy-timer-ui.ts` — but the display is gated behind `FEATURE_PERF_DIAG`. The counters write to `State.players.uiCachePerfByPid` which nothing reads in production.

**Estimated dead code total: ~16,676 bytes** if build-level feature flag stripping is implemented for `FEATURE_PERF_DIAG`.

### 4.5 ~~Immediately Reclaimable Dead Code~~ ✅ Deleted in v1.190

| Item | File | Status |
|------|------|--------|
| Commented VFX constants | `foundation/gameplay.ts:197-200` | ✅ Deleted (VFX_GREEN_LIGHT, VFX_RED_LIGHT, VFX_YELLOW_LIGHT, VFX_SPAWN_BEACON) |
| Join-prompt stub files (3 files) | `ready-dialog/join-prompt-*.ts` | ✅ All 3 files deleted (`join-prompt-ids.ts`, `join-prompt-layout.ts`, `join-prompt-events.ts`) |

### 4.6 ~~`statusProbeCodex` String~~ ✅ Removed in v1.190

~~`strings.json` contains `"statusProbeCodex": "I'm Codex and I'm stupid"` — this appears to be a test/joke string.~~ Confirmed zero references in code. Removed from `strings.json`.

### 4.7 Changelog.ts

At 137,088 bytes, this is the largest source file. It contributes ~0 bundle bytes because postbuild strips full-line comments. **No action needed** — the changelog is valuable for historical context.

### 4.8 Dead Code Recovery Summary — v1.190 Results

| Category | Estimated | Actual | Status |
|----------|-----------|--------|--------|
| Feature flag disabling (ADMIN_PANEL, POSITION_DEBUG, WORLD_ICON_DIAG) | ~19K | ~42K | ✅ Done — admin panel exclusion was the largest win |
| Commented VFX constants + join-prompt stubs | ~633 | ~633 | ✅ Deleted |
| `statusProbeCodex` string removal | ~125 | ~125 | ✅ Deleted |
| Duplicate function call removal | ~100 | ~100 | ✅ Done |
| Orphaned widget name strings (52 names) | ~3K | ~5K+ | ✅ Done |
| **Total recovered** | **~18,709** | **~48,647** | ✅ |

The actual recovery far exceeded estimates because the admin panel exclusion (3 source files + all guarded code blocks) was larger than anticipated.

---

## 5. Risks and Bugs

### ~~5.1 CRITICAL: Bundle Headroom~~ ✅ Resolved in v1.190

~~**Severity: CRITICAL**~~
~~**Headroom: 4,075 bytes (0.39%)**~~

✅ v1.190: Headroom recovered to **52,722 bytes (5.03%)**. All P0 optimizations from §4 implemented. Feature work can proceed.

### 5.2 CRITICAL: Async Race Condition in Vehicle Deploy Fulfillment

**Severity: CRITICAL**
**File:** `vehicles/deploy-fulfillment.ts` lines 394-514

Multiple `await mod.Wait()` calls occur while holding slot references with no enableToken guard preventing the slot from being disabled or the vehicle from being destroyed mid-await.

**Specific gaps:**
- **Line 405:** After checking `shouldUseFreshAircraftAirDirectSpawn(slot)`, the function awaits `spawnDirectSpawnVehicleIfReady(slot)`. If `slot.enabled` changes during the wait, subsequent `isDirectSpawnDriverSeatAvailable(vehicle)` (line 408) operates on stale references.
- **Lines 472-474:** `slot` and `vehicle` are queried, then an await occurs to spawn the vehicle. No enableToken guard prevents a disable/retune race.
- **Line 496:** `mod.ForcePlayerToSeat` is called without guarding that the player is still deployed and the vehicle still exists.

**What could go wrong:**
- Silent deploy failure followed by graceful undeploy (line 504) — player sees a failed spawn with no feedback.
- Script exception if spawn returns undefined but code continues.
- Player undeployed mid-fulfillment if timing aligns with respawn/destruction event.

**Suggested fix:** Capture `slot.enableToken` at function entry, validate `slot.enableToken === token` before every mod API call after each await. Guard `mod.ForcePlayerToSeat` with `if (!mod.IsPlayerValid(player) || !State.players.deployedByPid[pid])`.

### 5.3 CRITICAL: Boundary Enforcement Loop Disconnect Cleanup

**Severity: CRITICAL**
**File:** `boundary/enforcement.ts` lines 243-256

When the enforcement loop detects an invalid player (line 249-250), it calls `clearBoundaryViolationForPid(pid)` with the default `destroyUi=false` parameter. This calls `hideBoundaryPromptForPid(pid)` instead of `destroyBoundaryPromptUiForPid(pid)`.

**The gap:** If a player disconnects while violating a boundary, the HUD widget cache entry (`State.hudCache.boundaryPromptCache[pid]`) persists. On rejoin, the cached widget may still exist, causing invisible duplicates or orphaned state.

**What could go wrong:**
- Boundary prompt widgets accumulate across rejoin cycles.
- Memory leak over long-running servers with frequent boundary violations + disconnects.

**Suggested fix:** Change line 250 to `clearBoundaryViolationForPid(pid, true)` to destroy UI on disconnect, not just hide it.

### 5.4 CRITICAL: Vehicle Respawn Loop Token Race

**Severity: CRITICAL**
**File:** `vehicles/spawner-sequence.ts` lines 122-169

The respawn sequence has a gap between the enableToken check and state cleanup:

- **Line 145:** After the token check passes, the code deletes `vehicleToSlot` mapping and clears the vehicle (lines 150-153).
- **Line 155:** If `shouldGateVehicleSlotSpawnUntilReservationDeploy(slot)` returns true, the function returns early at line 157 without spawning.
- **The gap:** Between line 145 and line 155, if `slot.enabled` becomes false or the token changes, the vehicle mapping has already been cleared but the respawn won't be rescheduled. The slot's `vehicleId = -1` is orphaned.
- **Line 167:** `slot.respawnRunning = false` is only cleared in the `finally` block — but the early return at line 157 skips the `try`/`catch` path that reaches `finally`. The flag stays true, permanently blocking future respawns for that slot.

**What could go wrong:**
- Vehicle slot permanently stuck in "missing" state — deploy buttons never show it as available.
- Players see a dead vehicle slot that never recovers for the rest of the match.

**Suggested fix:** Add `slot.respawnRunning = false` before the early return at line 157. Add a belt-and-suspenders watchdog in `pollVehicleSpawnerSlots` to detect `respawnRunning=true && vehicleId=-1` persisting beyond 30s and reset the flag.

### 5.5 HIGH: Unguarded `mod.GetObjectPosition()` in Spawner Bind Loop

**Severity: HIGH**
**File:** `vehicles/spawner-bind.ts` lines 248, 275

`mod.GetObjectPosition(slot.spawner)` is called without try/catch inside a loop iterating all spawner slots. This runs on every vehicle spawn during live gameplay.

- Line 248: Inside the `bindSpawnedVehicleToSlot` for-loop (potentially 6+ iterations).
- Line 275: Inside `findSpawnerSlotByPosition` fallback path.

If a spawner object becomes invalid (destroyed OOB, despawned mid-frame), the engine throws and crashes the script — potentially exceeding the 1,000ms frame budget if multiple spawners fail.

**Suggested fix:** Wrap in try/catch with `continue` on failure:
```typescript
try {
    const spawnerPos = mod.GetObjectPosition(slot.spawner);
    // ... rest of logic
} catch { continue; }
```

### 5.6 HIGH: Boundary Enforcement After Vehicle Exit — Timing Assumption

**Severity: HIGH** (partially fixed: v1.187 added vehicle-exit check, v1.190 fixed ceiling Y)
**File:** `index/vehicle-events.ts`, `config/maps/operation-firestorm.ts`

The `recheckBoundaryAfterAircraftExit` function samples soldier Y and compares against `groundCombatZoneCeilingY`. This is a good deterministic approach.

**v1.190 fix:** `groundCombatZoneCeilingY` corrected from 100 to **200** for Operation Firestorm. The spatial data shows GroundCombatVolume polygon points at Y=100 (floor) with height=100 extending **upward** = ceiling at Y=200. The prior value of 100 was using the floor Y as the ceiling, causing the check to always trigger.

Remaining concerns:
- Only checks aircraft exits. Ground vehicle exits are not checked.
- Relies on `safeGetSoldierStateVector` returning a valid position immediately at vehicle exit. If the engine hasn't committed the soldier position yet, the check could get a stale/invalid Y.
- The ceiling Y is map-config-authored. If a future map forgets to set `groundCombatZoneCeilingY`, the function silently returns without any check.

**Mitigation:** Add a fallback in `getGroundCombatZoneCeilingY` that derives from the trigger ObjId if the explicit ceiling is not configured.

### 5.7 HIGH: State Leak on Player Disconnect During Async Operations

**Severity: HIGH**
**Files:** `interaction/actions.ts`, `vehicles/deploy-fulfillment.ts`

Several async functions (`runLoadingGateUntilReady`, `conquestPhase5DTryFulfillVehicleSpawnButtonOnDeploy`) use `await mod.Wait()` and check player validity after each wait. However, state mutations that happened before the wait are not rolled back if the player disconnects during the wait.

Example: In `onPlayerDeployedImpl` (`index/player-deploy.ts:63-131`), state like `deployedByPid[pid] = true` (line 89) and `inMainBaseByPid[pid] = true` (line 97) are set before the await for vehicle fulfillment (line 110). If the player disconnects during fulfillment, `onPlayerLeaveGameImpl` cleans up most state, but ordering may leave transient orphans.

**Specific asymmetry:** Deploy sets `inMainBaseByPid[pid] = true` optimistically at line 97, then overwrites at line 116 based on fulfillment result. If fulfillment is canceled mid-await, the overwrite never happens. Undeploy unconditionally sets `inMainBaseByPid[pid] = false`. The next deploy may inherit wrong `inMainBaseByPid` if the prior deploy was canceled between lines 97 and 116.

**Mitigation:** The existing cleanup in `onPlayerLeaveGameImpl` covers most cases. Monitor during MP testing. Consider resetting `inMainBaseByPid[pid] = false` at the start of `onPlayerDeployedImpl` before any awaits.

### 5.8 HIGH: `refreshBoundaryStateForAllPlayers` Unguarded

**Severity: HIGH**
**File:** `boundary/enforcement.ts` lines 259-266

`mod.AllPlayers()` is called and iterated without a top-level try/catch. If the player array is invalidated mid-iteration (rapid join/leave during the loop), subsequent iterations may throw. This wouldn't cause data corruption but could cause boundary violations to be missed for one tick.

**Suggested fix:** Wrap the iteration in try/catch.

### 5.9 MEDIUM: KPI Double-Count Risk on Capture Attribution

**Severity: MEDIUM**
**File:** `index/player-kpi-events.ts`

`onCapturePointCapturedKpiImpl` uses `mod.GetPlayersOnPoint()` to snapshot players on the point at capture time. If two captures fire rapidly (edge case on final-flag clusters), players could be counted twice.

**Mitigation:** The engine fires `OnCapturePointCaptured` once per ownership change. Low risk but worth monitoring.

### 5.10 MEDIUM: HUD Widget Lifecycle Gap on Team Swap

**Severity: MEDIUM**
**File:** `ready-dialog/swap-action.ts`

When a player swaps teams, the combat HUD uses a cached team reference that is not invalidated on team swap. Vehicle ownership may be tracked to the wrong team temporarily. Team-dependent HUD colors (blue/red) may show incorrectly until the next full refresh.

**Suggested fix:** Add `invalidateConquestHudForPlayer(pid)` call in the team-swap path, or add a team-swap listener that clears team-dependent HUD cache entries.

### 5.11 MEDIUM: Stale Widget Names in Cleanup Lists

**Severity: MEDIUM**
**Files:** `index/player-join-leave.ts` lines 31-55, 63-130

The `deleteAllByName` loops iterate up to 64/128 times per widget name, calling `safeFind` each time. With ~25 names in each list, this is up to 3,200 `safeFind` calls on player join and 3,200 on player leave. Most will miss on the first try (widget doesn't exist), so cost is low per-call, but it's still significant for a player join/leave event.

**Mitigation:** Audit which names are still created by current code. Remove stale entries. Consider caching created widget names per-player.

### 5.12 MEDIUM: Boundary Prompt Cache Not Cleaned on Match Reset

**Severity: MEDIUM**
**File:** `boundary/enforcement.ts`

`clearActiveBoundaryViolationsForAllPlayers` iterates current players and clears violations. But for disconnected players (pids in cache but not in `AllPlayers()`), the `State.hudCache.boundaryPromptCache[pid]` entry is never deleted. Over multiple rounds, the cache grows unbounded with disconnected player entries.

**Suggested fix:** After clearing violations for connected players, sweep the cache for orphaned entries:
```typescript
const cachedPids = Object.keys(State.hudCache.boundaryPromptCache);
for (const pidStr of cachedPids) {
    const pid = Number(pidStr);
    if (!seenPids[pid]) delete State.hudCache.boundaryPromptCache[pid];
}
```

### 5.13 LOW: Empty Catch Blocks

Many engine API calls use bare `catch {}` blocks. This is intentional — the engine logs errors before JS catch runs, so logging in catch adds noise. However, it means genuine unexpected errors are silently swallowed.

**No action needed** — this is the established pattern for this project given the Portal engine behavior.

---

## 6. Code Quality and Comments

### 6.1 Overall Assessment

Comment quality has improved significantly since v0.725. Most new functions (Phase 9, boundary fixes) have appropriate header comments explaining purpose and constraints. Module comment compliance is 93% (106/118 files). ~30 public functions are missing header comments.

### 6.2 Well-Commented Files (Rating 4-5/5)

| File | Rating | Notes |
|------|--------|-------|
| `boundary/enforcement.ts` | 5/5 | Clear comments on each function, timer constants, enforcement loop |
| `kpi/kpi-state.ts` | 5/5 | Score formula documented, mutations clear |
| `kpi/scoreboard-tab.ts` | 5/5 | One-time vs periodic behavior clearly noted |
| `index/game-mode.ts` | 5/5 | Exemplary: main loop structure well-documented, 4-point flow explanation |
| `config/conquest-constants.ts` | 5/5 | Feature flags documented |
| `vehicles/ownership.ts` | 5/5 | Excellent swap-remove pattern explanation |
| `vehicles/registration.ts` | 5/5 | Clear team registry comments |
| `interaction/spawn-selector.ts` | 5/5 | Clear Phase 1 scaffold explanation |
| `interaction/hud-warm-state.ts` | 5/5 | Clear accessor functions |
| `ui/conquest/top-hud-shell.ts` | 4/5 | Clear shell cache pattern |
| `hud/status.ts` | 4/5 | Excellent safe-setter helpers |

### 6.3 Under-Commented Files (Rating 2-3/5)

| File | Rating | Issues |
|------|--------|--------|
| `state/core.ts` | 2/5 | **Missing module comment entirely.** Critical functions `setUIInputModeForPlayer`, `isMatchLive`, `hasPlayersOnTeam` lack header comments. |
| `interaction/ammo-resupply-menu.ts` | 2/5 | **Missing module comment entirely.** 99 lines of pure constants with no explanatory header. Gadget state machine transitions not documented. |
| `index/player-join-leave.ts` | 3/5 | Missing handler comments for `onPlayerJoinGameImpl`, `resetUiForPlayerOnJoin`, `cleanupHudForPid`. Repetitive cleanup code unexplained. |
| `interaction/actions.ts` | 3/5 | Missing comments for `holdPlayerAtDeploy`, `applyPlayerDeployAvailability`, `beginLoadingGate`, `canEnablePlayerDeployForPid`, `syncPlayerDeployAvailability`. |
| `vehicles/spawner-sequence.ts` | 3/5 | Missing comments for `runSequentialSpawns`, `forceSpawnWithRetry`, `scheduleBlockedSpawnRetry`. |
| `vehicles/spawner-slots.ts` | 3/5 | Missing comments for `addVehicleSpawnerSlot`, `getDesiredSpawnerCountsForPreset`, `setSpawnerSlotEnabled`, `applySpawnerEnablementForMatchup`. |
| `index/capture-tickets.ts` | 3/5 | At 2,161 lines, many internal helpers lack comments. Unexplained constants: deadband thresholds (0.01, 0.04, 0.96, 0.99). |
| `vehicles/deploy-timer-ui.ts` | 3/5 | Large render-plan derivation functions lack comments. |
| `vehicles/deploy-fulfillment.ts` | 3/5 | Timing constant rationale not documented (0.1s settle, 0.05s intervals, 10 attempts = 0.5s window). |
| `ui/conquest/hud-core/render.ts` | 3/5 | Missing helper comments: clamp, shadow ring, flag letters. |

### 6.4 Files Missing Module Comments

Two files lack the `// Module:` header comment:

1. **`state/core.ts`** — Contains `setUIInputModeForPlayer`, `isMatchLive`, `hasPlayersOnTeam`, `sendHighlightedWorldLogMessage`, `endGameModeForTeamNum`. Should be: `// Module: state/core -- input mode control, match state queries, and team message helpers`

2. **`interaction/ammo-resupply-menu.ts`** — Contains gadget loadout UI constants and help text mapping. Should be: `// Module: interaction/ammo-resupply-menu -- gadget loadout UI constants and help text mapping`

### 6.5 Missing Function Header Comments (High Priority)

These public-facing functions have no header comments and are non-obvious:

| File | Function | Suggested Comment |
|------|----------|-------------------|
| `state/core.ts:3` | `setUIInputModeForPlayer` | Enables or disables UI input mode (interaction/radial menu) for one player |
| `state/core.ts:19` | `isMatchLive` | Returns true when the match is in the Live phase |
| `state/core.ts:23` | `hasPlayersOnTeam` | Returns true when at least one valid player is assigned to the given team |
| `index/player-join-leave.ts:6` | `resetUiForPlayerOnJoin` | Clears all UI artifacts for a newly-joined player to prevent stale state from previous session |
| `index/player-join-leave.ts:62` | `cleanupHudForPid` | Deletes all HUD widgets and cache entries for a disconnected player |
| `index/player-join-leave.ts:144` | `onPlayerJoinGameImpl` | Starts first-join loading session, blocks deploy until warm/reveal completes |
| `index/player-deploy.ts:30` | `deferForcedUndeploy` | Defers an undeploy by 0.1s to allow engine state to settle after blocking operation |
| `index/player-deploy.ts:63` | `onPlayerDeployedImpl` | Main deploy handler: gate check, HUD invalidation, boundary seed, vehicle fulfillment |
| `boundary/enforcement.ts:11` | `getBoundaryDurationSeconds` | Returns kill-timer duration in seconds for each boundary violation type |
| `boundary/enforcement.ts:24` | `getBoundaryWarningDelaySeconds` | Returns delay before alarm plays (pre-live has longer delay for UI readiness) |
| `boundary/enforcement.ts:30` | `isPlayerAliveForBoundary` | Returns true when player is alive and valid |
| `boundary/enforcement.ts:117` | `getDesiredBoundaryViolationKind` | Determines which boundary violation type applies based on match phase and player position |
| `boundary/enforcement.ts:147` | `notePreliveMainBaseViolation` | Records pre-live violation: marks not-ready, triggers prompt, sends message |
| `interaction/actions.ts` | `beginLoadingGate` | Entry point for join/swap: shows overlay, blocks deploy, hides UI before warm begins |
| `interaction/actions.ts` | `holdPlayerAtDeploy` | Prevents deploy by hiding UI, setting long redeploy timer, disabling input |
| `interaction/actions.ts` | `canEnablePlayerDeployForPid` | Returns true only if all deploy-blocking conditions are clear |
| `vehicles/spawner-sequence.ts:3` | `runSequentialSpawns` | Sequentially spawns vehicles in slot order with 0.3s delays, aborts if token changes |
| `vehicles/spawner-sequence.ts:24` | `forceSpawnWithRetry` | Forces spawn for a slot, polling until vehicle binds or attempts exhausted |
| `vehicles/spawner-slots.ts:27` | `addVehicleSpawnerSlot` | Creates vehicle spawner at position, applies config, registers slot state |
| `vehicles/spawner-slots.ts:90` | `setSpawnerSlotEnabled` | Toggles slot enabled state and bumps token; returns true when enabling needs spawn |

### 6.6 Undocumented Ordering Constraints

The `game-mode.ts` startup sequence (lines 22-100) has critical ordering dependencies that are not documented:

| Line | Operation | Constraint |
|------|-----------|------------|
| `applyMapConfig(...)` | Load map config | Must precede vehicle config |
| `State.vehicles.configReady = true` | Mark config ready | **Must be after `applyMapConfig`** — prerequisite for vehicle types |
| `twlConquestHudHideAllPlayers()` | Hide HUD | **Must precede `configureScoreboard()`** — prevents column-width glitch |
| `void startVehicleSpawnerSystem()` | Async vehicle init | **Intentionally not awaited** — gameplay proceeds independently |

Similarly, the join flow in `player-join-leave.ts` has undocumented dependencies:
- Loading gate must start before HUD warm (warm passes check gate state).
- HUD cache invalidation must happen after gate, before warm, to get fresh state.

### 6.7 Unexplained Magic Numbers

| File | Values | What They Mean |
|------|--------|----------------|
| `capture-tickets.ts:21-25` | `0.01, 0.99, 0.04, 0.96` | Deadbands prevent oscillation near 0/1 boundaries (1% threshold); phase transitions mark when capture visually changes state (4% hysteresis window) |
| `deploy-fulfillment.ts:4-13` | `0.1, 0.05, 10` | 0.1s settle allows engine to finalize vehicle ownership; 10 × 0.05s = 0.5s max wait window for vehicle bind |
| `interaction/interact-point.ts:35` | `1.5` (Y offset) | 1.5 units above facing direction ensures interact point is at head level |

### 6.8 Specific Comment Issues

- `player-deploy.ts:112` — references "line 69" which is stale after edits. Line references in comments should use semantic descriptions instead.
- Several files still contain `// @ts-nocheck` at the top — this is required by the bundler and is correct.

---

## 7. Actionable Recommendations (Priority Order)

### P0 — Immediate (headroom + production quality) — ✅ ALL COMPLETE in v1.190

1. ~~**Set `FEATURE_WORLD_ICON_DIAG = false`**~~ ✅ Done. Also disabled `FEATURE_POSITION_DEBUG` and `FEATURE_ADMIN_PANEL`.
2. ~~**Remove duplicate function calls**~~ ✅ Both duplicates removed.
3. ~~**Delete commented VFX constants and join-prompt stub files**~~ ✅ 4 VFX constants + 3 stub files deleted. `statusProbeCodex` string also removed.
4. ~~**Audit widget name cleanup lists**~~ ✅ 52 orphaned names culled across both functions.

### P1 — Short-term (stability + safety)

5. **Add enableToken guards to deploy-fulfillment** — capture token at entry, validate before every mod API call after each await. Prevents silent deploy failures from slot disable/retune race.
6. **Fix boundary enforcement disconnect cleanup** — change `clearBoundaryViolationForPid(pid)` to `clearBoundaryViolationForPid(pid, true)` in the enforcement loop disconnect path (line 250). Prevents HUD widget leak on rejoin.
7. **Fix respawn loop early-return** — add `slot.respawnRunning = false` before the early return at `spawner-sequence.ts:157`. Prevents permanent slot loss.
8. **Add try/catch around `mod.GetObjectPosition`** in `spawner-bind.ts:248,275` to prevent script crash on invalid spawner.
9. **Verify boundary vehicle-exit fix** — test all scenarios: grounded heli exit, airborne heli exit, tank exit, squad deploy outside zone.
10. **Add `groundCombatZoneCeilingY` to all future map configs** — currently only Firestorm has it. Add validation warning if missing.
11. **Replace `safeFindPlayer(pointPid)` with `pointPlayer`** in `capture-tickets.ts:1786` — eliminates 10-50 unnecessary `AllPlayers()` iterations per subtick.

### P2 — Medium-term (maintenance quality)

12. **Add module comments** to `state/core.ts` and `interaction/ammo-resupply-menu.ts`.
13. **Add function header comments** to the ~30 high-priority functions listed in §6.5.
14. **Document ordering constraints** in `game-mode.ts` startup and `player-join-leave.ts` join flow.
15. **Document magic numbers** in `capture-tickets.ts`, `deploy-fulfillment.ts`, and `interact-point.ts`.
16. ~~**Consider disabling `FEATURE_POSITION_DEBUG`** for production when spawn tuning is complete.~~ ✅ Disabled in v1.190.
17. **Gate `incrementUiCachePerfCounter` calls** behind `FEATURE_PERF_DIAG` to stop writing to counters nothing reads.
18. **Add boundary prompt cache sweep** on match reset to clear orphaned disconnected-player entries.
19. **Add belt-and-suspenders watchdog** in `pollVehicleSpawnerSlots` for `respawnRunning=true && vehicleId=-1` stuck state.
20. **Wrap `refreshBoundaryStateForAllPlayers`** iteration in try/catch.

### P3 — Long-term (architecture)

21. **Split `capture-tickets.ts`** into capture-state (mutation/ticks) and capture-hud (projection/rendering).
22. **Split `deploy-timer-ui.ts`** into timer-policy (visibility rules) and timer-widgets (render/input).
23. **Split `ammo-resupply-menu.ts`** into gadget-build (widget construction) and gadget-events (click/cooldown).
24. **Split `hud-core/render.ts`** into render-flags, render-tickets, render-popout, render-common.
25. **Consolidate widget cleanup** — replace hardcoded name lists with a registry pattern that tracks created widgets per-player.
26. **Implement build-level feature flag dead code elimination** for `FEATURE_PERF_DIAG` — potential +18K bytes headroom.
27. **Move `utils/main-base.ts` to `config/main-base.ts`** — contains map position config, not utilities.
28. **Clarify duplicate scaffold names** — `hud/conquest-scaffold.ts` vs `index/conquest-scaffold.ts`.

---

## 8. File Inventory Matrix

### Source Files by Size (Top 30)

| File | Bytes | Lines | Status | Notes |
|------|-------|-------|--------|-------|
| `Changelog.ts` | 137,088 | 873 | Active | ~0 bundle contribution |
| `index/capture-tickets.ts` | 87,640 | 2,161 | Active | Ownership hotspot |
| `vehicles/deploy-timer-ui.ts` | 86,240 | 1,977 | Active | Ownership hotspot |
| `interaction/ammo-resupply-menu.ts` | 73,298 | 1,957 | Active | Self-contained |
| `ui/conquest/hud-core/build.ts` | 44,849 | 1,115 | Active | Widget construction |
| `config/map-runtime.ts` | 34,291 | 788 | Active | Map config + spawner |
| `interaction/actions.ts` | 33,727 | 760 | Active | Loading gate orchestrator |
| `ui/conquest/hud-core/render.ts` | 31,696 | 667 | Active | HUD rendering — split candidate |
| `ui/dialog/victory-build.ts` | 25,075 | 527 | Active | Victory dialog |
| `vehicles/deploy-fulfillment.ts` | 23,371 | 530 | Active | Direct vehicle spawn |
| `hud/status.ts` | 22,460 | 575 | Active | Status dock + clock fmt |
| `config/maps/operation-firestorm.ts` | 22,225 | — | Active | Map config data |
| `foundation/ui-layout.ts` | 22,068 | — | Active | Layout constants |
| `ui/conquest/hud-core/constants.ts` | 21,109 | 402 | Active | HUD layout constants |
| `strings.json` | 19,936 | 395 | Active | String keys |
| `boundary/prompt-ui.ts` | 19,207 | 477 | Active | Boundary violation UI |
| `hud/position-debug.ts` | 18,623 | — | Active | **Dev tool, consider disable** |
| `index/capture-vo.ts` | 18,385 | 436 | Active | Voice over queue |
| `clock/timer-instance.ts` | 17,965 | 404 | Active | Timer widget builders |
| `foundation/gameplay.ts` | 16,825 | — | Active | Core constants |
| `state/runtime-types.ts` | 16,490 | 483 | Active | State type definitions |
| `ready-dialog/mode-config-readout.ts` | 16,108 | — | Active | Vehicle readout |
| `ui/conquest/hud-core/lifecycle.ts` | 15,646 | — | Active | HUD lifecycle |
| `interaction/world-interactables.ts` | 15,702 | — | Active | World icons + VFX |
| `hud/perf-diag.ts` | 15,136 | — | Excluded | `FEATURE_PERF_DIAG=false` (dead) |
| `ready-dialog/dialog-build.ts` | 14,322 | — | Active | Ready dialog widgets |
| `clock/ui.ts` | 14,237 | — | Active | Clock widget build |
| `state/ui-helpers.ts` | 13,515 | — | Active | Widget builder helpers |
| `boundary/enforcement.ts` | 13,485 | — | Active | Boundary logic |
| `ready-dialog/roster-render.ts` | 13,187 | — | Active | Roster rendering |

### Directories by Total Size

| Directory | File Count | Total Bytes | % of Total |
|-----------|-----------|-------------|-----------|
| `vehicles/` | 13 | 251,349 | 18.5% |
| `index/` | 11 | 163,075 | 12.0% |
| `interaction/` | 10 | 158,592 | 11.7% |
| `ui/conquest/hud-core/` | 9 | 142,840 | 10.5% |
| `config/` | 6 | 99,552 | 7.3% |
| `ready-dialog/` | 17 | 98,149 | 7.2% |
| `state/` | 10 | 80,380 | 5.9% |
| `hud/` | 6 | 61,336 | 4.5% |
| `ui/` (other) | 5 | 49,018 | 3.6% |
| `foundation/` | 3 | 44,558 | 3.3% |
| `clock/` | 3 | 40,419 | 3.0% |
| `boundary/` | 2 | 32,692 | 2.4% |
| `kpi/` | 2 | 8,407 | 0.6% |
| `strings/` | 1 | 8,706 | 0.6% |
| `utils/` | 2 | 2,897 | 0.2% |
| Root files | 7 | 174,437 | 12.8% |

---

## 9. Project Stats (Updated)

| Metric | v0.725 (2026-03-19) | v1.187 (2026-04-12) | v1.190 (2026-04-12) | v1.187→v1.190 |
|--------|--------------------|--------------------|---------------------|---------------|
| Version | 0.725 | 1.187 | 1.190 | +3 |
| Source files | 114 | 119 | 116 | -3 (stubs deleted) |
| Bundle size (script) | ~1,020,000 | 1,044,501 | **995,854** | **-48,647** |
| Headroom | ~28,000 | 4,075 (CRITICAL) | **52,722 (5.03%)** | **+48,647** |
| Entry point exports | 20 | 22 | 22 | — |

### v1.188–v1.190 Changes Summary
- **Feature flags disabled**: `FEATURE_ADMIN_PANEL`, `FEATURE_POSITION_DEBUG`, `FEATURE_WORLD_ICON_DIAG` all set to `false`
- **5 imports commented** in `index.ts` with `@feature` annotations (admin panel × 4, position debug × 1)
- **Dead code deleted**: 4 VFX constants, 3 join-prompt stub files, `statusProbeCodex` string
- **Duplicate calls removed**: `destroyArmMenu(pid)` and `cleanupWorldInteractableRuntimeIconsForPid(pid)`
- **52 orphaned widget names culled** from join/leave cleanup lists
- **`groundCombatZoneCeilingY` fixed**: 100 → 200 (spatial: floor Y=100 + height=100 = ceiling Y=200)

New files since v0.725:
- `kpi/kpi-state.ts` — Phase 9 KPI state
- `kpi/scoreboard-tab.ts` — Phase 9 scoreboard
- `index/player-kpi-events.ts` — Phase 9 event handlers
- `hud/position-debug.ts` — extracted from admin panel
- `ready-dialog/loading-overlay.ts` — extracted from join prompt

Files deleted in v1.190:
- `ready-dialog/join-prompt-ids.ts` — empty stub
- `ready-dialog/join-prompt-layout.ts` — empty stub
- `ready-dialog/join-prompt-events.ts` — empty stub

---

## 10. Open Questions and Assumptions

1. **Assumption:** `OnPlayerEnterAreaTrigger` fires when a parachuting soldier crosses the ground combat zone ceiling (Y=200, corrected from Y=100 in v1.190). This is fundamental to the v1.187 boundary fix. Needs in-game verification.

2. **Assumption:** The engine's `GetSoldierState(GetPosition)` returns a committed position at the moment of `OnPlayerExitVehicle`. If there's a frame delay, the ceiling check could get a stale Y.

3. ~~**Question:** Are the widget names in the cleanup lists (lines 31-55, 63-130 of `player-join-leave.ts`) all still created by current code?~~ ✅ Answered in v1.190: Audited all names. 52 orphaned names removed.

4. ~~**Question:** Is `FEATURE_POSITION_DEBUG` still needed for active spawn tuning, or can it be disabled for production?~~ ✅ Answered: Disabled in v1.190. Re-enable by setting flag to `true` when needed.

5. ~~**Question:** The `statusProbeCodex` string in `strings.json` — is this intentional or should it be removed?~~ ✅ Answered: Zero code references. Removed in v1.190.

6. **Question:** Some spatial files (`MP_TWL_Conquest2/3/4_FireStorm.spatial.json`) lack `GroundCombatVolume`. Are these older spatial versions that are no longer active?

---

## 11. Bugs Found During Audit

### ~~BUG-A1~~ ✅: Duplicate `destroyArmMenu(pid)` in `resetUiForPlayerOnJoin`
**Fixed in v1.190.** Duplicate call removed.

### ~~BUG-A2~~ ✅: Duplicate `cleanupWorldInteractableRuntimeIconsForPid(pid)` in `onPlayerLeaveGameImpl`
**Fixed in v1.190.** Duplicate call removed.

### ~~BUG-A3~~ ✅: `FEATURE_WORLD_ICON_DIAG = true` shipping in production
**Fixed in v1.190.** All three dev flags set to `false`.

### BUG-A4: Stale line reference in deploy handler comment
**File:** `index/player-deploy.ts` line 112 — references "line 69" which is no longer accurate.
**Severity:** Cosmetic
**Fix:** Replace with semantic description.

### BUG-A5: Boundary enforcement loop uses `destroyUi=false` on disconnect
**File:** `boundary/enforcement.ts` line 250
**Severity:** Medium (HUD widget cache leak across rejoin cycles)
**Fix:** Change to `clearBoundaryViolationForPid(pid, true)`.

### BUG-A6: Vehicle respawn `respawnRunning` not cleared on reservation-gate early return
**File:** `vehicles/spawner-sequence.ts` line 155-157
**Severity:** High (vehicle slot permanently stuck in missing state)
**Fix:** Add `slot.respawnRunning = false` before the early return.

### BUG-A7: Unguarded `mod.GetObjectPosition(slot.spawner)` in spawner bind loop
**File:** `vehicles/spawner-bind.ts` lines 248, 275
**Severity:** High (script crash on invalid spawner)
**Fix:** Wrap in try/catch with `continue`.

### BUG-A8: Deploy-fulfillment async operations lack enableToken guard
**File:** `vehicles/deploy-fulfillment.ts` lines 394-514
**Severity:** High (silent deploy failure on slot disable/retune race)
**Fix:** Capture `slot.enableToken` at entry, validate after each await.

### ~~BUG-A9~~ ✅: `ui-cache-perf` counters written unconditionally with no reader
**Resolved in v1.190.** All callsites (`dialog-build.ts`, `ammo-resupply-menu.ts`, `deploy-timer-ui.ts`) are guarded by `FEATURE_PERF_DIAG = false` — the calling functions are inside `if (FEATURE_PERF_DIAG)` blocks that postbuild strips. The unconditional counter writes no longer ship in production.

### BUG-A10: Boundary prompt cache grows unbounded with disconnected players
**File:** `boundary/enforcement.ts`
**Severity:** Low-Medium (memory leak on long-running servers)
**Fix:** Add cache sweep on match reset.

---

## 12. Future Polish Ready to Implement (Low Risk)

1. **CQ_Bug_3** (Phase 10): Unknown specifics — needs review.
2. **CQ_Bug_16** (Phase 10): Unknown specifics — needs review.
3. **CQ_Bug_17** (Phase 10): Unknown specifics — needs review.
4. **CQ_Bug_20** (Phase 10): Unknown specifics — needs review.
5. **CQ_Bug_32**: Ready dialog flickers during warm prime — could be fixed by building dialog children with `visible: false`.
6. **CQ_Bug_33**: Loading overlay briefly disappears during team swap — related to CQ_Bug_32.

---

## 13. Next Priorities (Post-v1.190)

With P0 headroom resolved and 52K bytes of breathing room, the remaining items sort by risk-to-effort ratio:

### Tier 1 — Stability fixes (bugs that can cause in-game failures)

| # | Item | Bug | Effort | Risk if Deferred |
|---|------|-----|--------|------------------|
| 1 | **Fix `respawnRunning` not cleared on reservation-gate early return** | BUG-A6 | ~5 lines | HIGH — vehicle slot permanently stuck |
| 2 | **Add enableToken guards to deploy-fulfillment** | BUG-A8 | ~20 lines | HIGH — silent deploy failure on race |
| 3 | **Add try/catch around `GetObjectPosition` in spawner-bind** | BUG-A7 | ~10 lines | HIGH — script crash on invalid spawner |
| 4 | **Fix boundary enforcement disconnect cleanup (`destroyUi=true`)** | BUG-A5 | ~1 line | MEDIUM — HUD widget leak across rejoin |
| 5 | **Add boundary prompt cache sweep on match reset** | BUG-A10 | ~10 lines | LOW-MEDIUM — cache grows with disconnected players |

### Tier 2 — Performance (measurable hot-path improvement)

| # | Item | Section | Effort |
|---|------|---------|--------|
| 6 | **Replace `safeFindPlayer(pointPid)` with `pointPlayer`** in capture-tickets.ts:1786 | §2.1a | ~5 lines — eliminates 10-50 `AllPlayers()` scans per subtick |

### Tier 3 — Code quality (maintenance, no gameplay impact)

| # | Item | Section | Effort |
|---|------|---------|--------|
| 7 | Add module comments to `state/core.ts` and `ammo-resupply-menu.ts` | §6.4 | ~2 lines each |
| 8 | Document ordering constraints in `game-mode.ts` startup | §6.6 | ~10 comment lines |
| 9 | Document magic numbers in `capture-tickets.ts` | §6.7 | ~5 comment lines |
| 10 | Wrap `refreshBoundaryStateForAllPlayers` iteration in try/catch | §5.8 | ~5 lines |

### Tier 4 — Architecture (valuable but high-effort, defer until needed)

- Split mega-files (capture-tickets, deploy-timer-ui, ammo-resupply-menu) — only when significant new work touches them
- Consolidate widget cleanup into a registry pattern
- Move `utils/main-base.ts` to `config/main-base.ts`

**Recommendation:** Start with Tier 1 items 1-3 (the vehicle system stability fixes). These are small, isolated changes that prevent rare but serious in-game failures. Item 6 (safeFindPlayer) is the single highest-impact performance fix remaining.

---

*End of audit. Last updated: v1.190, 2026-04-12.*
