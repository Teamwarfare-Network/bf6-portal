# Deploy/Undeploy Performance Analysis

Last updated: v1.110 (2026-04-06)
Companion to: `conquest_optimization_analysis.md`

## Context

Portal event handlers (`OnPlayerDeployed`, `OnPlayerUndeploy`) are synchronous entry points. Any async work inside is fire-and-forget — the engine doesn't wait for `await` to resolve before firing the next event. This means near-simultaneous deploy events from multiple players run their synchronous blocks back-to-back in the same frame.

The 1,000ms per-frame evaluation limit (CQ_Bug_40) applies to the total synchronous work across all handlers in a single frame.

## Premises

1. Location of the spawn/undeploy is NOT a factor — the work is UI/state driven, not spatial
2. Frequency of spawn/undeploy IS a factor — each cycle fires the full handler chain
3. This DOES stack with multiple players — N simultaneous deploys produce N × N player-iteration work

---

## Deploy Path (`onPlayerDeployedImpl`)

### Synchronous work before first `await` (line 80)

Everything from line 35 through line 79 runs in one frame with no yield. This is the critical block.

| Call | AllPlayers? | Iterates all? | safeFind per player | Engine API calls | Notes |
|------|-------------|---------------|---------------------|-----------------|-------|
| `syncWorldInteractableRuntimeIconsForPlayer` | No | No (single player) | 0 | Up to 24 configs × ~6 calls (SpawnObject, SetWorldIcon*) on cold first deploy; mostly no-ops after | 144 engine calls worst case on first deploy |
| `resetPlayerBoundaryStateOnDeploy` | No | No | 0 | O(1), cached widget writes | Negligible |
| `updatePlayersReadyHudTextForAllPlayers` | **Yes (2×)** | **Yes** | 0 (all refs cached) | Per player: ~6-8 (SetUITextLabel, SetUIWidgetVisible, SetUITextColor) | **Scales with player count.** 3p = 18-24 engine calls. Called every deploy. |
| `renderReadyDialogForAllVisibleViewers` | No | Only dialog-visible players | **~300+ per viewer** (96 roster rows + 28 mode-config knobs × ~7 each) | Per viewer: hundreds of SetUITextLabel/SetUIWidgetVisible | **The safeFind bomb.** Signature-guarded but always dirty on deploy. |
| `updateHelpTextVisibilityForAllPlayers` | **Yes (1×)** | **Yes** | 1-2 per player | Per player: ~3 (SetUIWidgetVisible, SetUITextLabel) | Scales with player count |
| `ensureTopHudShellForPlayer` (cold) | Yes (indirectly) | Yes (indirectly) | ~10-15 (bind helpers) | Dozens of CreateUIWidget on cold path; calls `updatePlayersReadyHudTextForAllPlayers` internally | **Cold path is very expensive** — full widget tree construction |
| `ensureTopHudShellForPlayer` (hot) | No | No | ~10-15 | 0 (cache hit) | Hot path is cheap |
| `renderCriticalHudForReveal` | No | No (single player) | ~10-15 (from ensureTopHudShell) | Single-player HUD pipeline tick + vehicle timer reveal | Piggybacks on ensureTopHudShell cost |
| `updateHudTeamSwapButtonVisibilityForPid` | No | No | 0 | 1 conditional SetUIWidgetVisible | Trivial |
| `invalidateVehicleDeployTimerHudViewerCache` | No | No | 0 | 0 (pure in-memory) | Nulls cache signatures |
| `conquestPhase2BOnPlayerDeployed` | No | No | 0 | ~2-3 (IsPlayerValid, GetMatchTimeElapsed, GetTeam) | State machine bookkeeping |

### After first `await` (line 80+)

| Call | What it does | Bounded? |
|------|-------------|----------|
| `conquestPhase5DTryFulfillVehicleSpawnButtonOnDeploy` | Vehicle spawn + seat verification loops | Yes — verify loop: 10 iterations × 0.05s; bind loop: 10 × 0.1s |
| `spawnReadyDialogInteractPoint` | Polls until player is grounded, spawns interact point | Yes — exits on undeploy check each iteration |

These are lightweight per-iteration (just seat checks and state reads) and properly guarded.

---

## Undeploy Path (`onPlayerUndeployImpl`)

### Entirely synchronous — no awaits at all

| Call | AllPlayers? | safeFind | Engine API calls | Notes |
|------|-------------|----------|-----------------|-------|
| `updateHudTeamSwapButtonVisibilityForPid` | No | 0 | 1 conditional SetUIWidgetVisible | Trivial |
| `resetPlayerBoundaryStateOnUndeployOrReset` | No | 0 | 0-3 cached widget writes | O(1), state dict deletes |
| `conquestPhase4OnPlayerLeaveOrResetPid` | No | 0 | 0 | JS object key filtering only |
| `conquestPhase4BOnPlayerLeaveOrResetPid` | No | 0 | 1 optional UnspawnObject | Same + VO handle cleanup |
| `twlConquestHudHideObjectiveFocusForPid` | No | 0 | ~15-25 SetUIWidgetVisible from cached refs | Shadow ring arrays + focus widgets, all cached |
| `conquestPhase3MarkHudDirty` | No | 0 | 0 | Single flag: `hudDirty = true` |
| `cleanupWorldInteractableRuntimeIconsForPid` | No | 0 | Up to 24 UnspawnObject | Per-config handle cleanup |
| `hideReadyDialogUI` | No | ~20 | + triggers `renderCriticalHudForReveal` | **Moderate-heavy if dialog was visible** |
| `closeArmMenu` | No | 0 | Cache-only widget hides | Early-exits if not open |
| `closeVehicleDeployLiveMenuForPlayer` | No | 0 | Cache-only widget hides | Early-exits if not open |
| `removeReadyDialogInteractPoint` | No | 0 | 2 max (EnableInteractPoint + UnspawnObject) | Trivial |

**Undeploy is much cheaper than deploy.** No AllPlayers calls, no all-player iterations. The only expensive path is `hideReadyDialogUI` if the dialog was visible (~20 safeFind + renderCriticalHudForReveal chain).

One fire-and-forget async: `reassertUiLoadingAfterUndeploy` (single `await mod.Wait(0)` yield, then gate check).

---

## The Three Things That Actually Hurt

### 1. `*ForAllPlayers` fan-out on every deploy

A single deploy triggers:
- `updatePlayersReadyHudTextForAllPlayers` → 2× `mod.AllPlayers()` + iterates all players × ~6-8 engine calls each
- `updateHelpTextVisibilityForAllPlayers` → 1× `mod.AllPlayers()` + iterates all players × ~3 engine calls each
- If `ensureTopHudShellForPlayer` is cold, it calls `updatePlayersReadyHudTextForAllPlayers` **again**

Total: **3-5 `mod.AllPlayers()` engine calls and 2-3 full player iterations per single deploy event.**

With 3 players deploying in quick succession, each deploy iterates all 3 players for status text + help text. That's:
- 3 deploys × 3 players × ~10 engine calls per player = **~90 engine calls** just from fan-out
- Plus 9-15 `mod.AllPlayers()` calls (engine round-trips returning the same list)

**This scales quadratically.** N near-simultaneous deploys produce N × N player-iteration work because each deploy's `ForAllPlayers` iterates all N players.

### 2. `renderReadyDialogForAllVisibleViewers` — the safeFind bomb

The most expensive single call in the deploy path. Per dialog-visible viewer:
- Roster render: 96+ safeFind (6 per row × 16 rows × 2 team columns visible)
- Mode config readout: ~200 safeFind (7 columns × 4 knobs × ~7 safeFind per knob)
- Team colors + toggle buttons: ~7 safeFind
- **Total: ~300+ `mod.FindUIWidgetWithName` calls per viewer**

Each `safeFind` calls `mod.FindUIWidgetWithName(name, mod.GetUIRoot())`, traversing the full widget tree. With 3 players × 50+ widgets each, the tree is 150+ nodes. 300 traversals of a 150+ node tree is substantial.

The signature guard should prevent redundant renders, but on deploy the signature is always dirty (player status changed). And this runs from the deploy handler — before the first `await` — all in one frame, synchronous, unavoidable.

**With 2 viewers when player 3 deploys: ~600 widget tree traversals in one synchronous block.**

### 3. `ensureTopHudShellForPlayer` cold path — widget construction

On first deploy after join (or after team swap HUD destroy), the shell cache is cold. This triggers:
- Full widget construction: branding panel, status dock, aux widgets, victory dialog, team swap button
- Dozens of `mod.CreateUIWidget` engine calls (each allocates in the widget tree)
- After construction: calls `updatePlayersReadyHudTextForAllPlayers` (another AllPlayers iteration)

Cold path is the normal path on first deploy. After that it's a cache hit (~10-15 safeFind from bind helpers).

---

## Stacking Model: 3 Players Deploy Simultaneously

Scenario: countdown completes → `mod.EnableAllPlayerDeploy(true)` → all 3 deploy in the same frame.

### Per-deploy synchronous frame cost

| Work | Player A deploys | Player B deploys | Player C deploys |
|------|-----------------|-----------------|-----------------|
| AllPlayers() calls | 3-5 | 3-5 | 3-5 |
| Player iterations | 3 players × 2-3 passes | 3 × 2-3 | 3 × 2-3 |
| safeFind (ready dialog viewers) | 2 viewers × ~300 = 600 | 1-2 viewers × ~300 = 300-600 | 0-1 viewer × ~300 = 0-300 |
| Engine calls (text/visibility) | ~30-40 | ~30-40 | ~30-40 |
| World interactable icons | 24 configs | 24 configs | 24 configs |

### Totals for one frame

| Metric | Estimated |
|--------|-----------|
| `mod.AllPlayers()` engine round-trips | 9-15 |
| Full player iterations | 6-9 (each iterating 3 players) |
| `safeFind` widget tree traversals | 600-1,500 |
| Total engine API calls (Create/Set/Find) | 300-500+ |
| World interactable spawn attempts | 72 |

The safeFind count is the dominant factor. At ~0.5-1ms per FindUIWidgetWithName traversal (estimated), 600-1,500 traversals alone could consume 300-1,500ms — potentially exceeding the 1,000ms frame budget.

---

## Rapid Deploy/Undeploy Cycling (Single Player)

If one player deploys and undeploys every ~0.5s:

**Per cycle (deploy + undeploy):**
- Deploy: 3-5 AllPlayers() + all-player iteration + 300+ safeFind (if dialog viewers exist) + world icon sync
- Undeploy: ~24 UnspawnObject + 15-25 cached SetUIWidgetVisible + hideReadyDialogUI chain

**Async chain accumulation:**
- Vehicle fulfillment verify loops: 2-3 concurrent (each ~0.5-1.5s lifespan, exits on `!deployedByPid`)
- `deferForcedUndeploy`: 2-3 concurrent (0.1s lifespan each, dies fast)
- `reassertUiLoadingAfterUndeploy`: 1-2 concurrent (instant yield, gate check kills it)
- `spawnReadyDialogInteractPoint` ground poll: 1-2 concurrent (exits on undeploy check)

**Peak concurrent suspended chains: ~6-10**

The async chains are lightweight and self-terminating. The real cost is the synchronous block repeated every cycle — specifically the AllPlayers fan-out and safeFind traversals firing every 0.5s.

---

## Proposed Remediation

### A. Debounce `*ForAllPlayers` calls to once per tick

`updatePlayersReadyHudTextForAllPlayers`, `updateHelpTextVisibilityForAllPlayers`, and `renderReadyDialogForAllVisibleViewers` don't need to run immediately on every deploy. They could set a dirty flag and be flushed once at the end of the next game loop tick (0.12s later).

**Effect:** Collapses N deploys' fan-out into a single pass. 3 simultaneous deploys go from 3 × full-player-iteration to 1 × full-player-iteration. Eliminates the quadratic scaling.

**Risk:** 0.12s delay before other players see updated status text. Imperceptible.

### B. Cache widget refs in ready dialog render

The roster render does 96+ safeFind calls per viewer because it looks up row widgets by name every time. The combat HUD already caches refs in `TwlConquestHudPlayerEntry.widgets` — the same pattern should apply here.

**Effect:** Signature-dirty render pass goes from ~300 safeFind + ~300 SetUITextLabel to ~0 safeFind + ~300 SetUITextLabel. Eliminates the dominant per-frame cost.

**Risk:** Must invalidate cache on dialog rebuild. Already solved pattern in the combat HUD.

### C. Skip `renderReadyDialogForAllVisibleViewers` during deploy transitions

When a player deploys, the ready dialog viewers' roster will update at the next game loop tick anyway (the main loop already calls it). The deploy handler doesn't need to force an immediate render.

**Effect:** Eliminates the entire 300-600+ safeFind bomb from the deploy frame. Zero cost.

**Risk:** ~0.12s delay before dialog viewers see the deploying player's status change. Imperceptible.

### D. Collapse `ensureTopHudShellForPlayer` internal fan-out

The cold path calls `updatePlayersReadyHudTextForAllPlayers` internally. This should set the debounce dirty flag (change A) instead of running immediately during construction.

**Effect:** Eliminates a redundant all-player iteration during the already-expensive widget construction frame.

### Impact Estimate

| Scenario | Before | After A+B+C+D |
|----------|--------|---------------|
| Single deploy, 3 players | ~100+ engine calls, ~300 safeFind | ~30 engine calls, ~0 safeFind |
| 3 simultaneous deploys | ~500 engine calls, 600-1500 safeFind | ~90 engine calls, ~0 safeFind |
| Rapid cycling (1 player, 0.5s/cycle) | ~200 engine calls/s, ~600 safeFind/s | ~60 engine calls/s, ~0 safeFind/s |

None of these changes alter behavior — they defer all-player work to the next tick boundary where it's already being done anyway.

---

# Implementation Plan: Deploy/Undeploy Event Handler Performance Optimization

Appended: v1.111 (2026-04-08)

## Context

**Problem:** Deploy events scale quadratically with player count. Each `OnPlayerDeployed` handler broadcasts UI updates to ALL players (3 separate `*ForAllPlayers` functions). With N simultaneous deploys, this produces N × N player-iteration work — all synchronous, all in one frame. With 3 players deploying simultaneously, the deploy handler alone produces 600-1,500 `safeFind` widget tree traversals and 300-500+ engine API calls in a single frame, potentially exceeding the 1,000ms frame budget (CQ_Bug_40).

**Goal:** Eliminate the quadratic scaling by replacing broadcast calls with per-player immediate updates + deferred dirty-flag flushes on the next game loop tick. Zero gameplay behavior change — updates are deferred by at most 0.12s (one tick), which is imperceptible.

**Baseline state:** v1.110, 1,038,559 bytes, 10,017 headroom.

---

## The Problem in Detail

In `src/index/player-deploy.ts:72-74`, every deploy fires these three broadcasts before the first `await`:

```typescript
updatePlayersReadyHudTextForAllPlayers();   // line 72 — 2× mod.AllPlayers() + iterates all × ~6-8 engine calls each
renderReadyDialogForAllVisibleViewers();    // line 73 — ~300+ safeFind per dialog-visible viewer
updateHelpTextVisibilityForAllPlayers();    // line 74 — 1× mod.AllPlayers() + iterates all × ~3 engine calls each
```

With 3 simultaneous deploys: 3 × (3 AllPlayers round-trips + 3 full-player iterations + 300-600 safeFind) = **quadratic**.

Additionally, there are redundant broadcast calls at other call sites:
- `src/ui/conquest/top-hud-shell.ts:229` — broadcasts to all players during single-player HUD construction (cold path)
- `src/interaction/ui-events-ready.ts:80,96,103` — calls `updatePlayersReadyHudTextForAllPlayers()` THREE times in one handler execution (two are redundant)
- `src/ready-dialog/ready-reset.ts:17` — broadcasts inside a per-player loop, then again at line 21 after the loop (N redundant calls)

---

## Implementation Changelog

### Change A: Dirty flags in runtime state (Steps 1-2)

**Files:** `src/state/runtime-types.ts`, `src/state/runtime-state.ts`, `src/hud/status.ts`

Added 3 boolean dirty flags (`pregameReadyHudDirty`, `pregameDialogDirty`, `pregameHelpDirty`) to `State.conquest.debug` alongside existing `hudDirty` pattern. Added 3 mark-dirty helpers and 1 `flushPregameDirtyFlags()` function in `src/hud/status.ts`.

**Rollback:** Delete the 3 type fields, 3 defaults, 3 mark functions, and flush function. Restore original calls at all sites that reference them.

### Change B: Game loop flush (Step 3)

**File:** `src/index/game-mode.ts` (non-live else branch)

Added `flushPregameDirtyFlags()` call after `lastLiveCoreTickSecond = -1;`. This is what actually runs the deferred broadcasts — once per 0.12s tick during non-live (pregame/post-game).

**Rollback:** Remove the `flushPregameDirtyFlags()` call. If Change A is also rolled back, no further action needed.

### Change C: Deploy handler per-pid + dirty flags (Step 4) — CRITICAL

**File:** `src/index/player-deploy.ts` (lines 72-74)

Replaced:
```typescript
updatePlayersReadyHudTextForAllPlayers();
renderReadyDialogForAllVisibleViewers();
updateHelpTextVisibilityForAllPlayers();
```
With:
```typescript
setMatchStateTextForPid(pid);
updateHelpTextVisibilityForPid(pid);
markPregameReadyHudDirty();
markPregameDialogDirty();
markPregameHelpDirty();
```

Deploying player's HUD updates instantly via per-pid calls. All-player broadcasts deferred to next tick via dirty flags.

**Rollback:** Restore the original 3 broadcast calls at lines 72-74.

### Change D: Cold-path HUD shell broadcast (Step 5)

**File:** `src/ui/conquest/top-hud-shell.ts` (line 229)

Replaced `updatePlayersReadyHudTextForAllPlayers()` with `markPregameReadyHudDirty()`. The line above (228) already calls `setMatchStateTextForPid(pid)` for the player whose HUD is being built.

**Rollback:** Restore `updatePlayersReadyHudTextForAllPlayers()` at line 229.

### Change E: Remove redundant ready button broadcasts (Step 6)

**File:** `src/interaction/ui-events-ready.ts` (lines 80, 96)

Removed 2 redundant calls to `updatePlayersReadyHudTextForAllPlayers()` inside the ready/unready if/else branches. Line 103 (unconditional broadcast after all state mutations) is the authoritative call and was kept.

**Rollback:** Re-add `updatePlayersReadyHudTextForAllPlayers();` after `State.players.readyByPid[pid] = true;` (line 79) and after `State.players.readyByPid[pid] = false;` (line 95).

### Change F: Remove redundant reset loop broadcast (Step 7)

**File:** `src/ready-dialog/ready-reset.ts` (line 17)

Removed `updatePlayersReadyHudTextForAllPlayers()` from inside the per-player loop. Line 21 (after the loop) already does the authoritative broadcast.

**Rollback:** Re-add `updatePlayersReadyHudTextForAllPlayers();` inside the for-loop after `State.players.readyByPid[pid] = false;`.

---

## Existing Functions Reused (No New Logic)

| Function | File | Purpose |
|----------|------|---------|
| `setMatchStateTextForPid(pid)` | `src/hud/status.ts:458` | Per-player top-left status dock update |
| `updateHelpTextVisibilityForPid(pid)` | `src/hud/help-visibility.ts:13` | Per-player help text visibility |
| `updatePlayersReadyHudTextForAllPlayers()` | `src/hud/status.ts:528` | Broadcast ready HUD (called by flush) |
| `renderReadyDialogForAllVisibleViewers()` | `src/ready-dialog/roster-render.ts:86` | Broadcast dialog render (called by flush) |
| `updateHelpTextVisibilityForAllPlayers()` | `src/hud/help-visibility.ts:40` | Broadcast help text (called by flush) |

---

## Performance Impact

| Scenario | Before (per frame) | After (per frame) |
|----------|--------------------|--------------------|
| **Single deploy, 3 players** | 3-5 AllPlayers() + 300+ safeFind + ~100 engine calls | 0 AllPlayers() + 0 safeFind + ~10 engine calls (per-pid only) |
| **3 simultaneous deploys** | 9-15 AllPlayers() + 600-1500 safeFind + ~500 engine calls | 0 AllPlayers() + 0 safeFind + ~30 engine calls (3 × per-pid only) |
| **Next tick flush (0.12s later)** | — | 3 AllPlayers() + 0-300 safeFind + ~30 engine calls (1 broadcast pass) |
| **Rapid cycling (0.5s/cycle)** | ~200 engine calls/s, ~600 safeFind/s | ~60 engine calls/s, ~0 safeFind/s |

The critical improvement: the synchronous block of the deploy handler drops from O(N²) to O(1) per deploy. The deferred flush is O(N) but runs once per tick regardless of how many deploys occurred.

---

## Call Sites NOT Changed (and Why)

| File | Call | Why keep direct broadcast |
|------|------|--------------------------|
| `conquest-flow.ts:58,136` | `updatePlayersReadyHudTextForAllPlayers()` | Phase transitions — once per flow change. |
| `conquest-flow.ts:57,109,135` | `updateHelpTextVisibilityForAllPlayers()` | Phase transitions. |
| `boundary/enforcement.ts:156-158` | All 3 broadcasts | Base boundary leave — low frequency. |
| `area-triggers.ts:83-84,121-122` | Dialog refresh + roster | Area enter/leave — future optimization candidate. |
| `mode-config-presets.ts:88,216` | Ready HUD + dialog | Admin config — extremely rare. |
| `player-join-leave.ts:220-222` | All 3 broadcasts | Player join — serialized by prebuild lock. |
| `ready-dialog/swap-action.ts:19,25` | Ready HUD + dialog | Team swap — single-player action. |
| `ui-events-ready.ts:102-103` | Dialog + ready HUD | Ready button — kept as direct broadcast (after removing redundant). |

---

## SP Verification Checklist

- [ ] Deploy → top-left status shows correct ready count
- [ ] Ready dialog roster updates on deploy/undeploy
- [ ] Help text visible/hidden at correct times
- [ ] Ready button toggles and broadcasts correctly
- [ ] Team swap + redeploy → HUD reconstructs properly

## MP Verification Checklist

- [ ] All players deploy simultaneously → no "exceeds max evaluation time" crash
- [ ] Ready dialog shows correct roster for all viewers
- [ ] Ready count text correct for all players
- [ ] Rapid deploy/undeploy cycling → no visual glitches or stale UI

---

# Phase 2: Per-Player Synchronous Cost Reduction

Appended: v1.112 (2026-04-08)
Follows: v1.111 dirty-flag debounce (Changes A-G)

## Context

v1.111 eliminated the quadratic N×N scaling from ForAllPlayers broadcasts. SP testing confirms no regressions. However, frame time spikes remain visible on the network performance overlay during deploy and undeploy events. These spikes are per-player synchronous work that still runs in a single frame.

**Goal:** Reduce the per-player synchronous engine call count on both the deploy and undeploy paths. These changes target the remaining spike sources identified via code analysis and confirmed by the SP frame time overlay.

**Baseline state:** v1.111, 1,039,506 bytes, 9,070 headroom.

---

## Remaining Synchronous Costs (Post v1.111)

### Deploy handler — before first `await` (hot path, caches warm)

| Line | Function | Engine calls | Notes |
|------|----------|-------------|-------|
| 70 | `syncWorldInteractableRuntimeIconsForPlayer` | **Up to 144** (7 per config × ~20 configs: SpawnObject + Set* × 6) | Spawns per-player WorldIcon clones |
| 71 | `resetPlayerBoundaryStateOnDeploy` | 0-3 | Mostly state, conditional alarm |
| 72-76 | Per-pid updates + dirty flags (v1.111) | ~15 | Already optimized |
| 78-80 | `ensureTopHudShellForPlayer` | 0 (cache hit) | Cold: 30-50+ CreateUIWidget |
| 81 | `renderCriticalHudForReveal` | ~20-30 | Hot path: visibility/text on cached refs |
| **Total** | | **~180-190** | Dominated by world icon sync |

### Undeploy handler — entirely synchronous (no awaits)

| Line | Function | Engine calls | safeFind | Notes |
|------|----------|-------------|----------|-------|
| 97-109 | State + boundary + phase cleanup | ~5 | 0 | Cheap |
| 108 | `twlConquestHudHideObjectiveFocusForPid` | ~15 | 0 | Cached refs |
| 110 | `cleanupWorldInteractableRuntimeIconsForPid` | Up to 24 UnspawnObject | 0 | Cached handles |
| 111-112 | `hideReadyDialogUI` (if dialog visible) | **250+** | **42+** | See breakdown below |
| 113 | `closeArmMenu` | 0-5 | 0 | Early-exit if not open |
| 114 | `closeVehicleDeployLiveMenuForPlayer` | 0-5 | 0 | Early-exit if not open |
| 116 | `removeReadyDialogInteractPoint` | 0-2 | 0 | |
| **Total** | | **~50-300+** | **0-42+** | Dominated by hideReadyDialogUI |

### hideReadyDialogUI cost breakdown (when dialog is visible)

```
setReadyDialogChromeVisible        → 7× safeFind + 7× SetUIWidgetVisible
resetReadyDialogAdminFamily:
  deleteAdminPanelUI               → 1× safeFind + DeleteUIWidget
  setAdminPanelChildWidgetsVisible → 32× safeFind + 32× SetUIWidgetVisible  (16 IDs × 2 finds each)
  setReadyDialogAdminToggleVisible → 3× safeFind + 3× SetUIWidgetVisible
updateHelpTextVisibilityForPid     → 2× safeFind + 3× SetUIWidgetVisible
renderCriticalHudForReveal         → 200+ engine calls (full HUD reveal pipeline)
                                     ↳ renderTopLeftUiFamilyForReveal
                                     ↳ renderVehicleSpawnerUiFamilyForReveal
                                     ↳ armCombatHudFamilyForSchedulerReveal
                                     ↳ twlConquestHudPrimePlayerFrame
                                     ↳ renderAdminUiFamilyForReveal
```

**Key finding:** During undeploy, `hideReadyDialogUI` calls `renderCriticalHudForReveal` to "restore" the combat HUD underneath the closing dialog. But the player is undeploying — they're heading to the deploy screen. The HUD restore is completely wasted work. This is the single largest remaining cost.

---

## Implementation Changelog

### Change H: Defer world icon sync past first await in deploy handler

**File:** `src/index/player-deploy.ts`

**What:** Move `syncWorldInteractableRuntimeIconsForPlayer(eventPlayer)` from line 70 (before first await) to after line 82 (after the first await), with a player validity guard.

**Before:**
```typescript
// line 70 (synchronous, before first await)
syncWorldInteractableRuntimeIconsForPlayer(eventPlayer);
resetPlayerBoundaryStateOnDeploy(eventPlayer, pid);
// ...
const directSpawnDeployResult = await conquestPhase5D...  // line 82 — first await
```

**After:**
```typescript
// line 70 removed from here
resetPlayerBoundaryStateOnDeploy(eventPlayer, pid);
// ...
const directSpawnDeployResult = await conquestPhase5D...  // first await
if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
syncWorldInteractableRuntimeIconsForPlayer(eventPlayer);  // deferred past await
if (directSpawnDeployResult.consumedDeploy) { return; }
```

**Why this is safe:** World icons are purely visual — they mark interact points on the player's screen. A 1-frame delay (time for the await to yield and resume) before icons appear is imperceptible. Gameplay logic (interact points, area triggers) does not depend on icons being visible.

**Impact:** Removes up to **144 engine calls** from the synchronous deploy frame budget. These calls (SpawnObject + 6× Set* per config) are the dominant remaining hot-path cost.

**Rollback:** Move `syncWorldInteractableRuntimeIconsForPlayer(eventPlayer)` back to before `resetPlayerBoundaryStateOnDeploy` (its original position at line 70). Remove the validity guard.

---

### Change I: Skip HUD restore in hideReadyDialogUI during undeploy

**File:** `src/ready-dialog/lifecycle.ts` (line 88)

**What:** Gate the `renderCriticalHudForReveal` + `prebuildVehicleDeployTimerHudHiddenForPlayer` block on `State.players.deployedByPid[playerId]`. When the player is undeploying, `deployedByPid` is already `false` (set at `player-deploy.ts:98`, before `hideReadyDialogUI` is called at line 112).

**Before:**
```typescript
if (player && mod.IsPlayerValid(player)) {
    const shouldRestoreCriticalHud = !isVehicleDeployLiveMenuOpenForPid(playerId);
    if (shouldRestoreCriticalHud) {
        prebuildVehicleDeployTimerHudHiddenForPlayer(player);
        renderCriticalHudForReveal(player, playerId);
    } else {
        updateVehicleDeployTimerHudForPlayer(player);
    }
}
```

**After:**
```typescript
if (player && mod.IsPlayerValid(player) && State.players.deployedByPid[playerId]) {
    const shouldRestoreCriticalHud = !isVehicleDeployLiveMenuOpenForPid(playerId);
    if (shouldRestoreCriticalHud) {
        prebuildVehicleDeployTimerHudHiddenForPlayer(player);
        renderCriticalHudForReveal(player, playerId);
    } else {
        updateVehicleDeployTimerHudForPlayer(player);
    }
}
```

**Why this is safe:** The HUD restore exists so that when a player closes the ready dialog while deployed (e.g., pressing dismiss), the combat HUD reappears underneath. During undeploy, the player is leaving the game world — restoring the HUD is pointless because the deploy screen takes over. The `deployedByPid` flag is already `false` by the time the undeploy handler calls `hideReadyDialogUI`, so this naturally gates off the expensive work.

Normal dialog close while deployed: `deployedByPid` is `true` → HUD restore runs (unchanged).
Dialog force-hide during undeploy: `deployedByPid` is `false` → HUD restore skipped (new).

**Impact:** Removes **200+ engine calls** (full renderCriticalHudForReveal pipeline) from the undeploy path when the ready dialog was visible. This is the single largest remaining cost in the undeploy handler.

**Rollback:** Remove `&& State.players.deployedByPid[playerId]` from the if condition.

---

### Change J: Guard admin panel widget cleanup with built-state check

**File:** `src/ready-dialog/lifecycle.ts` (inside `resetReadyDialogAdminFamily`, line 59)

**What:** Skip `deleteAdminPanelUI` and `setAdminPanelChildWidgetsVisible` when the admin panel was never built. The admin panel toggle button (3 widgets) still gets hidden regardless.

**Before:**
```typescript
function resetReadyDialogAdminFamily(playerId: number): void {
    deleteAdminPanelUI(playerId, false);
    setAdminPanelChildWidgetsVisible(playerId, false);
    setReadyDialogAdminToggleVisible(playerId, false);
}
```

**After:**
```typescript
function resetReadyDialogAdminFamily(playerId: number): void {
    if (State.players.readyDialogData[playerId]?.adminPanelBuilt) {
        deleteAdminPanelUI(playerId, false);
        setAdminPanelChildWidgetsVisible(playerId, false);
    }
    setReadyDialogAdminToggleVisible(playerId, false);
}
```

**Why this is safe:** `setAdminPanelChildWidgetsVisible` does 32 safeFind calls (16 widget IDs × 2 lookups each for base + border) to hide admin panel children. If the admin panel was never built, these widgets don't exist — every safeFind traverses the full widget tree and returns null. Skipping them when `adminPanelBuilt` is false avoids 33 pointless widget tree traversals.

The admin toggle button (3 widgets) is always hidden regardless, since it exists independently of the panel body.

**Impact:** Removes **33 safeFind calls** from every dialog hide when the admin panel hasn't been opened (which is the common case — admin panel is a developer/debug tool).

**Rollback:** Remove the `adminPanelBuilt` guard, restoring the unconditional cleanup calls.

---

## Combined Performance Impact

### Deploy synchronous frame cost (hot path, 1 player)

| Metric | v1.110 (before) | v1.111 (debounce) | v1.112 (this) |
|--------|-----------------|-------------------|----------------|
| AllPlayers() round-trips | 3-5 | 0 | 0 |
| safeFind traversals | 300+ | ~2-5 | ~2-5 |
| Total engine calls | ~300-500 | ~180-190 | **~35-45** |

### Undeploy synchronous frame cost (1 player, dialog visible)

| Metric | v1.110 (before) | v1.111 (debounce) | v1.112 (this) |
|--------|-----------------|-------------------|----------------|
| safeFind traversals | ~42 | ~42 | **~10** |
| Total engine calls | ~300+ | ~300+ | **~50-65** |

### 3 simultaneous deploys

| Metric | v1.110 | v1.111 | v1.112 |
|--------|--------|--------|--------|
| Synchronous engine calls | 500-1500+ | ~540-570 | **~105-135** |

---

## Bundle Size

| Change | Estimated bytes |
|--------|----------------|
| Change H: Move icon sync + add validity guard | +50 |
| Change I: Add deployedByPid check | +45 |
| Change J: Add adminPanelBuilt guard | +60 |
| **Net** | **~+155 bytes** |
| **Projected total** | **~1,039,661 bytes** |
| **Projected headroom** | **~8,915 bytes** |

---

## Files Modified

| File | Change | Description |
|------|--------|-------------|
| `src/index/player-deploy.ts` | H | Move icon sync past first await |
| `src/ready-dialog/lifecycle.ts` | I, J, K | Skip HUD restore + help text on undeploy; guard admin cleanup |

---

### Change K: Guard help text update in hideReadyDialogUI during undeploy

**File:** `src/ready-dialog/lifecycle.ts` (line 89)

**What:** Wrap `updateHelpTextVisibilityForPid(playerId)` in a `deployedByPid` check, same pattern as Change I. During undeploy, help text visibility is irrelevant — the player is heading to the deploy screen.

**Before:**
```typescript
updateHelpTextVisibilityForPid(playerId);
```

**After:**
```typescript
if (State.players.deployedByPid[playerId]) {
    updateHelpTextVisibilityForPid(playerId);
}
```

**Impact:** Saves 2 safeFind + 3 engine calls during every undeploy when the dialog was visible.

**Rollback:** Remove the `deployedByPid` guard.

---

## Test Results

### SP Test (v1.111 — dirty-flag debounce)
- [x] No gameplay regressions observed
- [x] Ready dialog, ready button, help text, team swap all functional
- [x] Frame time spikes still visible on network overlay during deploy/undeploy (expected — per-player work remains)

### SP Test (v1.112 — per-player sync cost reduction)
- [x] No gameplay regressions observed
- [x] World icons appear correctly after deploy
- [x] Ready dialog hides cleanly on undeploy
- [x] Admin panel cleanup works correctly
- [x] Close dialog while deployed → combat HUD restores (pre-existing 1-frame flicker, see note)

### MP Test (v1.112 — heavy deploy/undeploy spam)
- [x] **No performance spikes observed** during rapid deploy/undeploy cycling
- [x] No crashes, no stale UI

---

## Known Behavior: Combat HUD Flicker on Dialog Close

When the ready dialog is closed while deployed (not during undeploy), there is a brief 1-frame flicker before the combat HUD appears. **This is pre-existing behavior, not caused by these changes.**

Root cause: `hideReadyDialogUI` calls `renderCriticalHudForReveal`, which calls `armCombatHudFamilyForSchedulerReveal`. This function HIDES the combat HUD widgets (`twlConquestHudHidePlayer`) and sets `pendingFirstReveal = true`. The actual combat HUD reveal happens on the **next frame** via the scheduler — not immediately. This deferred-reveal pattern is by design for smooth combat HUD transitions, but it creates a 1-frame window where the dialog is gone and the combat HUD hasn't appeared yet.

Our `deployedByPid` check (Change I) does **not affect this path** — when closing the dialog while deployed, `deployedByPid` is `true`, so the HUD restore runs exactly as before.

---

## Optimization Journey Summary

### v1.110 Baseline → v1.112 Final

| Metric | v1.110 | v1.111 | v1.112 | Reduction |
|--------|--------|--------|--------|-----------|
| **Deploy sync — 1 player (hot)** | ~300-500 calls | ~180-190 calls | **~35-45 calls** | **~90%** |
| **Deploy sync — 3 simultaneous** | 500-1500+ calls | ~540-570 calls | **~105-135 calls** | **~90%** |
| **Undeploy sync (dialog visible)** | ~300+ calls | ~300+ calls | **~50-65 calls** | **~80%** |
| **safeFind per deploy** | 300+ | ~2-5 | ~2-5 | **~99%** |
| **AllPlayers() per deploy** | 3-5 | 0 | 0 | **100%** |
| **Quadratic scaling (N players)** | O(N²) | O(N) flush | O(N) flush | **Eliminated** |

### What Made the Difference

**Phase 1 (v1.111 — Changes A-G):** Dirty-flag debounce. Replaced 3 ForAllPlayers broadcast calls in the deploy handler with per-pid immediate updates + deferred dirty flags flushed once per game tick. Eliminated quadratic scaling. Also removed 5 redundant broadcast calls across `ui-events-ready.ts`, `ready-reset.ts`, and `top-hud-shell.ts`.

**Phase 2 (v1.112 — Changes H-K):** Per-player sync cost reduction. Deferred the world icon sync (up to 144 SpawnObject/Set* calls) past the first await in the deploy handler. Eliminated the full `renderCriticalHudForReveal` pipeline (200+ calls) from the undeploy path when the dialog was visible. Guarded admin panel widget cleanup (33 safeFind) with a built-state check.

### Why These Optimizations Are Safe

Every change follows one principle: **the deploying/undeploying player's own HUD updates immediately via per-pid calls; all-player broadcasts and non-critical visual work defer by at most one game tick (0.12s) or one engine frame.**

- 0.12s is below the threshold of human perception for UI text changes
- 1 engine frame (the await yield) is imperceptible for icon appearance
- The player heading to the deploy screen doesn't need their combat HUD revealed
- Admin panel widgets that were never built don't need 33 widget tree traversals to "hide"

### Bundle Size Impact

| Version | Size | Headroom | Change |
|---------|------|----------|--------|
| v1.110 | 1,038,559 | 10,017 | Baseline |
| v1.111 | 1,039,506 | 9,070 | +947 (dirty flags + flush infrastructure) |
| v1.112 | ~1,039,700 | ~8,876 | +194 (guards + deferred icon sync) |

---

## Future Optimization Candidates

| Idea | Savings | Risk/Effort | Notes |
|------|---------|-------------|-------|
| Cache ready dialog chrome widget refs at build time | -7 safeFind per hide | Medium effort (plumbing in dialog build) | Deterministic widget names, stable lifetime |
| Keep world icons alive across deploy/undeploy (toggle visibility instead of spawn/unspawn) | -144 spawn + -24 unspawn per cycle | Higher effort + lifecycle complexity | Would replace SpawnObject/UnspawnObject with EnableWorldIcon toggles |
| Defer undeploy visual cleanup via async yield | Split undeploy cost across 2 frames | Medium risk (execution order, gate check) | Would require `onPlayerUndeployImpl` to become async |
| Cache setAdminPanelChildWidgets refs at admin panel build | -32 safeFind when admin panel IS built | Medium effort | Only applies to admin-open scenarios |
| Fix combat HUD flicker on dialog close | Cosmetic only | Medium (scheduler integration) | Pre-existing; `armCombatHudFamilyForSchedulerReveal` hides before deferred reveal |
