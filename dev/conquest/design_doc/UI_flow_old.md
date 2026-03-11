# Conquest UI Flow (Old Architecture)

This document captures the existing/old UI flow exactly as traced in code, including startup, ongoing loops, cache behavior, positioning chain, refresh rules, team swap/reconnect behavior, and `safeFind` behavior.

## 1) Simple Mental Model

1. `State` is the source of truth (tickets, capture ownership, readiness, deploy status, swap flags, etc.).
2. `hudCache` is the widget-handle cache (per `pid` references to already-created UI widgets).
3. `ensureHudForPlayer(player)` is the build/repair owner for Conquest HUD widgets.
4. `updateConquestPhase2ADebugHudForAllPlayers(force?)` is the live painter that updates visible widget values from state.
5. `destroyConquestHudForPid(pid)` is the teardown owner (delete per-player Conquest HUD + clear refs).

Primary files:
- `src/state/runtime-state.ts`
- `src/state/hud-cache-types.ts`
- `src/ui/conquest/hud-build.ts`
- `src/index/capture-tickets.ts`
- `src/ui/conquest/lifecycle.ts`

## 2) Runtime Entrypoints (From The Beginning)

Entrypoints are exported from `src/index.ts`:
- `OnGameModeStarted -> onGameModeStartedImpl`
- `OnPlayerJoinGame -> onPlayerJoinGameImpl`
- `OnPlayerLeaveGame -> onPlayerLeaveGameImpl`
- `OnPlayerDeployed -> onPlayerDeployedImpl`
- `OnPlayerUndeploy -> onPlayerUndeployImpl`
- `OngoingPlayer -> ongoingPlayerImpl`
- `OnPlayerInteract -> onPlayerInteractImpl`
- `OnPlayerUIButtonEvent -> onPlayerUIButtonEventImpl`
- `OngoingCapturePoint -> ongoingCapturePointImpl`

## 3) Game Start Flow

In `onGameModeStartedImpl` (`src/index/game-mode.ts`):

1. Detect/apply map config.
2. Initialize phase scaffolding (`initializeConquestPhase1Scaffold`).
3. Reset non-live/live phase state.
4. Set base engine variables.
5. Wait briefly, then for every currently connected valid player:
   - call `ensureHudForPlayer(player)`.
6. Push initial top-HUD state:
   - `setMatchStateTextForAllPlayers()`
   - `refreshConquestScaffoldHudForAllPlayers()` (currently no-op)
   - `updateHelpTextVisibilityForAllPlayers()`
   - clock preview.
7. Enter infinite loop (`while (true)`, every `0.25s`):
   - if live and at second boundary: `conquestPhase2AOnLiveTick()`
   - else in live: `updateConquestPhase2ADebugHudForAllPlayers()`
   - each second: update clock, takeoff checks, victory countdown/update if game over.

## 4) Ongoing Loops / Per-Tick Behavior

### 4.1 `OngoingPlayer`

`src/index/player-loop-inputs.ts`:

1. If deployed: evaluate ready-dialog interact-point removal.
2. Warm-up ready dialog once per player:
   - `createReadyDialogUI(player)`
   - immediately `hideReadyDialogUI(player)` (cached for fast open later).
3. If deployed and triple-click detector triggers:
   - arm join prompt triple-tap
   - spawn ready-dialog interact point.

### 4.2 Capture-point Ongoing

`src/index/area-triggers.ts`:

1. `ongoingCapturePointImpl` forwards to `conquestPhase2AOnCapturePointTick`.
2. Lost/captured edges forward to `conquestPhase2AOnCapturePointLost/Captured`.
3. Enter/exit capture point directly updates per-player engage ownership (`engagedObjIdByPid`) and forces immediate HUD refresh.

## 5) State + Cache Layout

`src/state/runtime-state.ts` defines mutable singleton `State`.

Important UI-related maps:
- `State.hudCache.hudByPid`
- `State.hudCache.clockWidgetCache`
- `State.hudCache.countdownWidgetCache`
- `State.conquest.debug.hudDirty`
- `State.conquest.debug.hudRenderBucketByPid`
- `State.conquest.debug.teamSwapHudResetPendingByPid`

`src/state/hud-cache-types.ts` defines `HudRefs` with:
- root handles (`topHudRoot`, `conquestCombatRoot`)
- ticket root/children refs
- flag root/children refs
- popout refs
- engage refs
- help/ready container refs
- optional root list for cleanup.

## 6) Build / Ensure / Repair Path

`ensureHudForPlayer` in `src/ui/conquest/hud-build.ts`:

1. Ensure clock UI first (`ensureClockUIAndGetCache`), then continue with Conquest HUD.
2. Purge known legacy roots/artifacts.
3. Cached path:
   - if cached refs exist, attempt to pin root chain:
     - `TopHudRoot_{pid} -> ConquestCombatHudRoot_{pid} -> TicketsRoot/FlagsRoot`
   - rebind refs from pinned subtrees (ticket subtree + flag subtree).
   - if valid, return cached refs.
4. If cached path fails:
   - hard reset (`destroyConquestHudForPid` + purge)
   - build full tree with `ParseUI`
   - pin root chain
   - rebind critical refs from subtrees
   - cache refs in `State.hudCache.hudByPid[pid]`
   - initialize default visibility/depth/text.
5. If pin/rebind fails, destroy and return `undefined`.

## 7) Positioning / Anchoring Chain (Centering Contract)

Core constants in `src/foundation/ui-layout.ts`:
- `TOP_HUD_ROOT_WIDTH = 1920`
- `TOP_HUD_ROOT_HEIGHT = 260`
- `CONQUEST_HUD_NON_CLOCK_SHIFT_Y = 0`
- `CONQUEST_HUD_TICKETS_FLAGS_SHIFT_Y = CONQUEST_HUD_NON_CLOCK_SHIFT_Y + 20`
- `CLOCK_POSITION_X = 0`
- `CLOCK_POSITION_Y = 47.73`

Top root owner in `src/hud/status.ts` (`ensureTopHudRootForPid`):
- parent forced to `UIRoot`
- anchor forced to `TopCenter`
- position forced to `(0,0)`
- size forced to top-root dimensions
- depth forced above game UI
- duplicate-name purge before first ensure pass (per pid init token).

Combat chain pin in `src/ui/conquest/hud-build.ts`:
- `combatRoot` parent = `topHudRoot`
- `combatRoot` anchor = `TopCenter`
- `combatRoot` position = `(0, CONQUEST_COMBAT_ROOT_Y)`
- `ticketsRoot` + `flagsRoot` parent = `combatRoot`
- both anchors = `TopCenter`
- both positions = `(0,0)`.

## 8) Render Refresh Path

`updateConquestPhase2ADebugHudForAllPlayers(force?)` in `src/index/capture-tickets.ts`:

1. If HUD disabled: return.
2. If not forced and not dirty:
   - skip full repaint, run bleed refresh-only path.
3. Clear dirty, timestamp update.
4. Loop all players:
   - skip duplicate same-bucket pass (`conquestPhase3TrackSinglePassRenderForPid`) unless forced.
   - publish derived top HUD slices (status/help/clock VM snapshots).
   - fetch refs from cache; if missing `ensureHudForPlayer`.
   - run critical-ref validation (`conquestPhase3HasCriticalHudRefs`):
     - validates pid ownership
     - validates root parent chain
     - validates anchor/position geometry
     - validates key child parent contracts (tickets/flags subtrees)
   - if invalid: destroy + ensure again.
   - derive view models for tickets/flags/popout/engage.
   - render each module:
     - ticket counters
     - ticket bars
     - leader crown/border
     - bleed chevrons
     - flag slots
     - active popout
     - engage widget
   - reveal roots last.

`conquestPhase2AOnLiveTick` calls this after sync/bleed/end checks.

## 9) Clock / Help / Ready Top-Lane Flow

Clock owner in `src/clock/ui.ts`:

1. `ensureClockUIAndGetCache(player)` checks `clockWidgetCache`.
2. On miss:
   - deletes old clock widgets by name
   - rebuilds ParseUI clock root + round state + ready count text
   - parents clock root to `TopHudRoot_{pid}` when available
   - caches refs.

Help/ready visibility in `src/hud/help-visibility.ts`:
- `updateHelpTextVisibilityForPid(pid)` uses derived VM snapshot from `getHudVisibilitySnapshotForPid(pid)` and toggles `Container_HelpText_{pid}` + `Container_ReadyStatus_{pid}`.

Match state/ready counts in `src/hud/status.ts`:
- `setMatchStateTextForAllPlayers()`
- `updatePlayersReadyHudTextForAllPlayers()`.

## 10) Team Switch Flow

Ready dialog swap path:
- `swapPlayerTeam` (`src/ready-dialog/swap-action.ts`) calls `processReadyDialogSelection`.

`processReadyDialogSelection` in `src/interaction/actions.ts`:

1. Hide ready dialog.
2. Mark player undeployed in script state.
3. `cleanupConquestHudForTeamSwap(pid)`:
   - set swap-pending flags
   - clear engage owner
   - hide conquest widgets
   - force-hide engage
   - `destroyConquestHudForPid(pid)`.
4. Set new team (`mod.SetTeam`).
5. Mark HUD dirty and schedule delayed refresh (`refreshConquestHudAfterTeamSwap`).
6. Force undeploy so player returns to deploy screen.

Delayed refresh (`refreshConquestHudAfterTeamSwap`):
- waits briefly
- token-checks to avoid overlap
- `ensureHudForPlayer(player)`
- hides conquest widgets while swap is still pending until deploy callback confirms.

Deploy callback (`onPlayerDeployedImpl`) clears swap-pending and forces refresh.

## 11) Reconnect / Leave Flow

On leave (`onPlayerLeaveGameImpl`, `src/index/player-join-leave.ts`):

1. Mark disconnected.
2. Remove interact point.
3. `cleanupHudForPid(pid)`:
   - `destroyConquestHudForPid(pid)`
   - delete top roots + legacy roots
   - reset root init tokens
   - clear `hudCache` entries and debug maps.
4. Destroy ready dialog UI and clear ready/join prompt/deploy/input state maps.
5. Refresh remaining players' UI when match is not live.

On join (`onPlayerJoinGameImpl`):

1. Initialize ready-dialog data and reconnect flags.
2. reset UI surfaces.
3. `ensureHudForPlayer(player)`.
4. force immediate full HUD refresh (`updateConquestPhase2ADebugHudForAllPlayers(true)`).
5. refresh clock/help/ready/dialog views.

## 12) What `safeFind` Does

Defined in `src/state/id-helpers.ts`:

1. First try: `mod.FindUIWidgetWithName(name, mod.GetUIRoot())`.
2. If that throws: fallback try `mod.FindUIWidgetWithName(name)` (global/unscoped).
3. If both fail: return `undefined`.

Important consequence:
- `safeFind` is name-based and can return a wrong same-name instance if duplicates exist.
- This is why strict parent-chain checks and subtree-scoped lookups are mandatory in architecture.

## 13) Old Architecture Risk Summary

1. Many flows rely on name lookup under churn (swap/rebuild/reconnect).
2. Multiple lifecycle moments force immediate refreshes.
3. Swap adds asynchronous windows (`SetTeam`, undeploy, delayed rebuild, deploy callback).
4. If refs point to wrong instances, rendering can look "top-left" even when one chain is centered.

## 14) Rules For Clean Rebuild (From Scratch)

1. One owner for gameplay HUD lifecycle (build/repair/destroy/root pin).
2. One immutable root chain contract.
3. No global name lookup in render paths.
4. Refs must be bound from known subtrees only.
5. Render path must not reparent core roots.
6. Any parent/anchor/position mismatch = fail-close teardown/rebuild.
7. Swap/reconnect always use explicit `hide -> destroy -> rebuild`.
8. Separate gameplay HUD lifecycle from ready-dialog/admin lifecycle.
9. Keep clock separate, but anchored into same top-root contract.
10. Add one debug dump for root chain (`name,parent,anchor,pos`) on ensure/rebuild/swap/reconnect.
11. Remove any fallback path that can revive stale core roots silently.
12. If critical refs fail twice consecutively, stop rendering that slice and emit diagnostic.

## 15) Version Timeline (`v0.319` -> Current)

Use this as the historical backbone for architectural decisions.

| Version | Date | Change Summary | Intended Benefit | Observed Outcome | Regressions | Rollback Candidate |
|---|---|---|---|---|---|---|
| v0.319 | TBD | Baseline reference | Known working baseline | TBD | TBD | No |
| v0.320+ | TBD | TBD | TBD | TBD | TBD | TBD |

Notes:
- Always include concrete screenshot/video references for "Observed Outcome".
- Include exact files touched for each version row.

## 16) Widget Ownership Matrix

Define one authoritative writer/owner per widget family.

| Widget Family | Create Owner | Parent/Anchor Owner | Value/Color Owner | Visibility Owner | Delete Owner | Notes |
|---|---|---|---|---|---|---|
| Top root (`TopHudRoot_*`) | TBD | TBD | N/A | TBD | TBD | |
| Combat root (`ConquestCombatHudRoot_*`) | TBD | TBD | N/A | TBD | TBD | |
| Tickets roots/children | TBD | TBD | TBD | TBD | TBD | |
| Flags roots/slots | TBD | TBD | TBD | TBD | TBD | |
| Popout | TBD | TBD | TBD | TBD | TBD | |
| Engage | TBD | TBD | TBD | TBD | TBD | |
| Clock/round-state | TBD | TBD | TBD | TBD | TBD | |
| Ready/help lanes | TBD | TBD | TBD | TBD | TBD | |
| Ready dialog/admin panel | TBD | TBD | TBD | TBD | TBD | |

Rules:
- If a cell has more than one owner, architecture is invalid.

## 17) State Ownership Matrix

Define authoritative writers for critical state fields.

| State Field | Authoritative Writer | Allowed Secondary Writers | Invalidation Trigger | Notes |
|---|---|---|---|---|
| `State.hudCache.hudByPid[pid]` | TBD | None | TBD | |
| `State.conquest.debug.hudDirty` | TBD | TBD | N/A | |
| `State.conquest.debug.teamSwapHudResetPendingByPid[pid]` | TBD | TBD | N/A | |
| `State.conquest.capture.engagedObjIdByPid[pid]` | TBD | TBD | TBD | |
| `State.players.deployedByPid[pid]` | TBD | TBD | N/A | |
| `State.players.readyByPid[pid]` | TBD | TBD | N/A | |

## 18) Lifecycle Sequence Charts

Capture event order with explicit "owner actions".

### 18.1 Startup Sequence

1. `OnGameModeStarted`
2. State scaffold initialization
3. Per-player `ensureHudForPlayer`
4. Initial HUD refresh
5. Ongoing loop begins

### 18.2 Join Sequence

1. `OnPlayerJoinGame`
2. Reset UI surfaces
3. `ensureHudForPlayer`
4. Force HUD refresh
5. Ready dialog/clock/help sync

### 18.3 Deploy Sequence

1. `OnPlayerDeployed`
2. Deploy flags update
3. `ensureHudForPlayer`
4. Force HUD refresh

### 18.4 Live Tick Sequence

1. Capture sync
2. Suppression/bleed/end checks
3. `updateConquestPhase2ADebugHudForAllPlayers`

### 18.5 Team Swap Sequence

1. Swap request
2. Hide + destroy HUD
3. `SetTeam`
4. Force undeploy
5. Delayed refresh
6. Deploy callback release

### 18.6 Reconnect/Leave Sequence

1. Leave: cleanup and cache clear
2. Join: rebuild and full refresh

## 19) Cache Contract Table

Define exact cache semantics for each map.

| Cache | Key | Populate When | Read When | Validity Check | Invalidate When | Hard Rebuild Trigger |
|---|---|---|---|---|---|---|
| `hudByPid` | `pid` | TBD | TBD | TBD | TBD | TBD |
| `clockWidgetCache` | `pid` | TBD | TBD | TBD | TBD | TBD |
| `countdownWidgetCache` | `pid` | TBD | TBD | TBD | TBD | TBD |

## 20) Root-Chain Invariants (Numerical)

Record hard invariants with tolerances used in code.

| Widget | Expected Parent | Expected Anchor | Expected Position (x,y) | Expected Size | Depth | Tolerance |
|---|---|---|---|---|---|---|
| `TopHudRoot_{pid}` | `UIRoot` | `TopCenter` | `(0,0)` | `(1920,260)` | `AboveGameUI` | `<= 0.5` |
| `ConquestCombatHudRoot_{pid}` | `TopHudRoot_{pid}` | `TopCenter` | `(0, CONQUEST_HUD_TICKETS_FLAGS_SHIFT_Y)` | TBD | `AboveGameUI` | `<= 1` |
| `ConquestTicketsHudRoot_{pid}` | `ConquestCombatHudRoot_{pid}` | `TopCenter` | `(0,0)` | TBD | `AboveGameUI` | `<= 1` |
| `ConquestFlagsHudRoot_{pid}` | `ConquestCombatHudRoot_{pid}` | `TopCenter` | `(0,0)` | TBD | `AboveGameUI` | `<= 1` |

## 21) Failure Taxonomy (Historical)

Track every symptom with reproducible evidence.

| Failure ID | Symptom | Trigger Steps | Expected | Actual | First Seen Version | Last Seen Version | Evidence |
|---|---|---|---|---|---|---|---|
| F-001 | HUD top-left | TBD | Centered | Top-left | TBD | TBD | `testing_images/*.PNG` |
| F-002 | Flicker center/top-left | TBD | Stable center | Oscillation | TBD | TBD | |
| F-003 | Ready dialog broken | TBD | Open/close works | Broken | TBD | TBD | |
| F-004 | Triple tap broken | TBD | Interact spawns | No spawn | TBD | TBD | |

## 22) Race-Window Inventory

Document asynchronous hazards and required guards.

| Race Window | Start Event | End Event | Shared State | Hazard | Existing Guard | Required Guard |
|---|---|---|---|---|---|---|
| Swap team settle | `SetTeam` | deploy callback | `teamSwap*`, cache refs | stale team/frame | token + delay | TBD |
| Rebuild vs render tick | `destroy/ensure` | next render pass | `hudByPid` | stale handles | critical-ref check | TBD |
| Leave/join churn | leave | rejoin ensure | per-pid maps | leaked refs | cleanup path | TBD |

## 23) Unsafe Pattern Log (Banned For New Architecture)

| Pattern | Why Unsafe | Old Location Example | Replacement Rule |
|---|---|---|---|
| Global unscoped widget lookup fallback | can bind wrong duplicate | `safeFind` fallback path | subtree-scoped lookup only |
| Multiple writers for parent/anchor | non-deterministic layout | mixed ensure/render ownership | single parent/anchor owner |
| Reparenting core roots during render | frame drift and flicker | render-time restacks | build-time only |
| Silent fallback to stale refs | hidden corruption | cache hits without strict validation | fail-close rebuild |

## 24) Diagnostic Schema (For Runtime Logs)

Use one structured line/object schema for all critical lifecycle points.

Required fields:
- `timestamp`
- `pid`
- `event` (`ensure_start`, `ensure_success`, `ensure_fail`, `render_skip`, `render_rebuild`, `swap_start`, `swap_release`, `leave_cleanup`, `join_rebuild`)
- `widget`
- `widgetName`
- `parentName`
- `anchor`
- `positionX`
- `positionY`
- `sizeX`
- `sizeY`
- `depth`
- `cacheGeneration`
- `result`
- `reason`

Log points:
- after ensure root pin
- before/after critical-ref validation
- on teardown trigger
- on swap and reconnect transitions

## 25) Test Matrix (Historical + Rebuild Validation)

| Test ID | Scenario | Players | Steps | Expected Result | Pass/Fail | Notes |
|---|---|---|---|---|---|---|
| T-001 | Fresh boot HUD center | 1 | start -> deploy | centered HUD | TBD | |
| T-002 | Swap once | 1 | ready dialog swap -> deploy | centered + functional | TBD | |
| T-003 | Swap spam | 1 | rapid swaps | no flicker/drift | TBD | |
| T-004 | Reconnect | 1 | leave -> rejoin | clean rebuild | TBD | |
| T-005 | Two-player isolation | 2 | both live | no cross-player clashes | TBD | |
| T-006 | Aspect ratio change | 1 | different resolutions | still centered | TBD | |
| T-007 | Triple tap interact | 1 | live + not live paths | interact works | TBD | |
| T-008 | Ready dialog open/close | 1 | repeated toggles | no breakage | TBD | |

## 26) Acceptance Criteria (New Architecture Gate)

Release gate is blocked unless all are true:

1. All root-chain invariants pass continuously under stress tests.
2. No global fallback widget lookup in gameplay render lifecycle.
3. Single owner per widget family and per state field (matrices complete).
4. Team swap path passes without top-left drift or UI regressions.
5. Reconnect path passes without stale overlays or missing widgets.
6. Multi-player isolation test passes (no cross-player handle drift).
7. Diagnostics show zero critical-ref failures after stabilization window.

## 27) Known Unknowns

Capture unresolved areas explicitly.

| Unknown | Why Unknown | Needed Evidence | Owner | Status |
|---|---|---|---|---|
| Engine duplicate-name resolution order | not guaranteed by API docs | runtime instrumented traces | TBD | Open |
| Timing guarantees around `SetTeam` and deploy callbacks | async engine behavior | high-frequency timestamped logs | TBD | Open |
| Widget invalidation semantics after delete/recreate in same frame | observed inconsistencies | synthetic stress test harness | TBD | Open |

## 28) Legacy Artifact Appendix (Do Not Reintroduce)

Track old names/trees that historically caused collisions.

Legacy root/artifact names:
- `ConquestHudRoot_{pid}`
- `ConquestTicketsDebugRoot_{pid}`
- `ConquestFlagsDebugRoot_{pid}`
- `ConquestTicketsLaneRoot_{pid}`
- `ConquestFlagsLaneRoot_{pid}`
- `Container_TopLeft_CoreUI_{pid}`
- `Container_TopMiddle_CoreUI_{pid}`
- `Container_TopRight_CoreUI_{pid}`
- `ConquestFlagFriendly_{pid}_{i}`
- `ConquestFlagCenter_{pid}_{i}`
- `ConquestFlagEnemy_{pid}_{i}`

Rule:
- If any legacy artifact appears in runtime diagnostics, force teardown and flag test failure.
