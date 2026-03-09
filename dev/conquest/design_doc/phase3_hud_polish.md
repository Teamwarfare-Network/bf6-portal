# Phase 3 HUD Polish - Architecture Assessment and Plan

Date: 2026-03-09

## Original Intent
Move Conquest HUD behavior to a predictable lifecycle:
1. For frequently reused HUD elements, pre-create once per player and toggle visibility.
2. For truly rare/ephemeral elements, create on demand and delete when done.
3. On team switch, hide first, rebuild cleanly, then resume normal updates.

## Current Architecture Reality (As Implemented)
1. The Conquest HUD is already mostly in a persistent-per-player model:
- `ensureHudForPlayer(...)` builds widget trees.
- `State.hudCache.hudByPid` stores refs.
- Runtime render paths mostly toggle visibility, labels, colors, and geometry.
2. Schema-version rebuilds are already used to safely introduce widget-tree changes.
3. Swap handling is hide-first with controlled redraw, added to reduce duplicate/stacked artifacts.
4. Known high-risk area remains `CQ_Bug_3` (post-swap engage ownership/show timing).

## What Could Go Wrong If We Re-Architect Further
1. Reintroducing create/delete in frequent paths can regress known bugs:
- Risk to `CQ_Bug_1` (duplicate layers/counters),
- `CQ_Bug_4` (incremental rebuild visibility),
- `CQ_Bug_5` (swap instability).
2. Mixed ownership writes can cause flicker and stale state:
- Lifecycle path sets one value,
- Render path sets another,
- Result is one-frame artifacts and hard-to-reproduce regressions.
3. Team-swap complexity can spike quickly:
- If hide/rebuild and render ownership are not strictly serialized, stale refs survive.
4. Border/pop-out/engage interdependence can drift:
- Top-row slot, pop-out, and engage status can disagree if not derived from one authoritative state.
5. Performance and reliability tradeoff:
- More dynamic creation can reduce idle widget count but usually increases runtime churn and lifecycle risk in this project.

## Recommendation
For Conquest HUD specifically, prefer:
1. Pre-create almost everything that appears during normal match flow.
2. Keep runtime to state-driven visibility/content updates only.
3. Reserve create/delete for truly rare modal UI or teardown/rebuild events.

This is the safest path given current bug history and architecture direction.

## Effort Estimate (If We Proceed)
1. Audit and classify all HUD widgets by lifecycle policy (persistent vs ephemeral): 0.5 to 1 day.
2. Consolidate ownership matrix (who writes visibility/content for each widget family): 0.5 to 1 day.
3. Refactor remaining outliers to persistent model and remove mixed writes: 1 to 2 days.
4. Swap-path hardening and schema/reset validations: 0.5 to 1 day.
5. Full regression validation pass across `CQ_Bug_1/2/3/4/5/6/7`: 1 day.

Estimated total: 3.5 to 6 days including validation.

## Implementation Plan (No Code Yet)
### Phase P0 - Inventory and Ownership Contract
1. Build a widget inventory by family:
- Tickets,
- Lead indicators (crown/border),
- Flag row (slot/fill/label/percent/border),
- Pop-out,
- Engage panel,
- Misc support roots.
2. For each family, document:
- Creation point,
- Cache binding point,
- Render owner,
- Lifecycle hide/reset owner.

### Phase P1 - Persistent Widget Standardization
1. Ensure all frequent gameplay widgets are created once per player.
2. Convert any remaining runtime create/delete usage in frequent flows to visibility toggles.
3. Keep delete operations only for:
- Schema rebuild,
- Player leave/teardown,
- Explicit lifecycle reset.

### Phase P2 - Swap and Respawn Safety
1. Enforce hide-first during swap.
2. Rebind refs deterministically from cache/safeFind fallback.
3. Prevent mixed frame writes between lifecycle and render owners.

### Phase P3 - Regression and Instrumentation
1. Add targeted debug tracing for edge transitions:
- swap,
- first post-swap objective entry,
- pop-out/engage visibility transitions.
2. Re-run phase gates and issue tracker validation.

### Phase P4 - Final Polish Pass
1. Tune spacing/motion only after ownership and lifecycle behavior are stable.
2. Keep polish changes isolated from ownership logic changes.

## Acceptance Criteria for This Re-Architecture
1. No new dynamic create/delete in frequent Conquest HUD update paths.
2. Single-writer ownership per widget family is documented and enforced.
3. Swap/respawn behavior remains stable and coherent.
4. No regression on `CQ_Bug_1/2/4/5/6/7` and no worsening of `CQ_Bug_3`.

## P0 Ownership Matrix (Current Code)
Date: 2026-03-09

### Authoritative Game State (Source of Truth)
1. `src/state/runtime-state.ts`
- Defines the global mutable `State` singleton and default values.
2. `src/state/runtime-types.ts`
- Defines runtime state contracts, including:
  - `ConquestLifecyclePhase`
  - `ConquestCapturePointRuntimeState`
  - `ConquestFlagVisualPhase`
  - `ConquestFlagVisualRuntimeState`
3. `src/index/conquest-scaffold.ts`
- Initializes conquest scaffold baseline at mode start.
4. `src/index/capture-tickets.ts`
- Owns live conquest state evolution (tickets, capture states, visual phase transitions, end-race latch).
5. `src/index/area-triggers.ts`
- Owns per-player active objective membership (`engagedObjIdByPid`) on objective enter/exit.
6. `src/state/lifecycle-guardrails.ts` + `src/conquest-flow.ts`
- Own global lifecycle transitions (`NOT_READY`, `LIVE`, `GAME_OVER`) through guarded mutators.

### HUD/UI State Layers
1. Runtime visual FSM state (objective-level, persistent):
- `State.conquest.capture.visualByObjId` in `capture-tickets.ts`
- Drives slot/popout visuals through stable phases (`NEUTRAL_IDLE`, `OWNED_STABLE`, etc.).
2. Derived per-player HUD view models (ephemeral per render pass):
- `ConquestHudTicketViewModel`
- `ConquestHudFlagsViewModel`
- `ConquestHudActiveFlagPopoutViewModel`
- `ConquestHudEngageViewModel`
- `ConquestHudStatusViewModel`
- `ConquestHudHelpReadyViewModel`
- `ConquestHudClockViewModel`
- Built in `deriveHudViewModelForPlayer(...)` in `capture-tickets.ts`.
3. Cached per-player widget references (persistent):
- `State.hudCache.hudByPid[pid]` (`HudRefs` in `state/hud-cache-types.ts`).
- Built/recovered by `ensureHudForPlayer(...)` in `hud/build.ts`.
4. Render application layer:
- `renderConquest*ForPid(...)` functions in `capture-tickets.ts`.
- Applies visibility/content/geometry to pre-created widget refs.
5. Top-HUD derived slices:
- `State.conquest.debug.hudStatusVmByPid`
- `State.conquest.debug.hudHelpReadyVmByPid`
- `State.conquest.debug.hudClockVmByPid`
- Published in `capture-tickets.ts`, consumed by `hud/status.ts` and `hud/help-visibility.ts`.

### Widget Family Ownership (Current)
1. Tickets/bars/leader/bleed
- Create/cache owner: `ensureHudForPlayer(...)` (`hud/build.ts`)
- Render owner: `renderConquestTicket*ForPid(...)` (`capture-tickets.ts`)
- Hide/reset owner: `conquestPhase3ForceHideAllV2Widgets(...)`, swap gate in `updateConquestPhase2ADebugHudForAllPlayers(...)`, and `destroyConquestHudForPid(...)`
2. Flag top row (slot/fill/label/percent/border)
- Create/cache owner: `ensureHudForPlayer(...)`
- Render owner: `deriveConquestHudFlagsViewModel(...)` + `renderConquestFlagSlotsForPid(...)`
- Hide/reset owner: same as above
3. Active pop-out
- Create/cache owner: `ensureHudForPlayer(...)`
- Render owner: `deriveConquestHudActiveFlagPopoutViewModel(...)` + `renderConquestActiveFlagPopoutForPid(...)`
- Hide/reset owner: same as above
4. Engage panel
- Create/cache owner: `ensureHudForPlayer(...)`
- Render owner: `deriveConquestHudEngageViewModel(...)` + `renderConquestEngageForPid(...)`
- Suppression owner: `conquestPhase3ShouldRenderEngageForPid(...)` + `conquestPhase3ForceHideEngageWidgetsForPid(...)`
5. Top help/ready/round state/clock
- Clock widgets create/cache owner: `ensureClockUIAndGetCache(...)` (`clock/ui.ts`)
- Top visibility projection owner: `deriveConquestHudHelpReadyViewModel(...)` / `deriveConquestHudStatusViewModel(...)` / `deriveConquestHudClockViewModel(...)`
- Display owner: `hud/status.ts` and `hud/help-visibility.ts`

### Regression Triage: Game State vs UI Projection
Use this triage first before any redesign:
1. If ticket totals, owner team, progress values, or engaged objective ID are wrong in `State`, this is game-state logic.
2. If `State` is correct but border/label/percent/fill visibility is wrong, this is UI projection/render ownership.
3. If visibility is inconsistent across players or after swap/rebuild, this is likely ref-cache recovery or lifecycle ordering.

Current bug pattern (`CQ_Bug_7`) is a UI projection/render ownership issue, not core capture/ticket game-state corruption.

### Execution Decision for Phase 3 Polish
Proceed with the Phase 3 pattern as documented:
1. Keep frequent HUD widgets persistent and pre-created.
2. Keep all frequent updates as visibility/content/geometry writes only.
3. Reserve create/delete for schema rebuild, teardown, and explicit lifecycle reset paths.

This aligns with lower runtime churn, fewer rebuild races, and better stability at higher player counts.

## Implementation Progress Snapshot
Date: 2026-03-09

Completed:
1. P0 ownership map is documented in this file (state owners, UI state layers, and widget-family ownership).
2. P2 ref-rebind hardening added for top-row flag render path:
- Runtime now resolves missing per-slot refs via `safeFind(...)` and backfills cache arrays.
3. P2 lifecycle hide hardening added for force-hide path:
- Top-row border widgets are now explicitly hidden during force-hide passes.
- Force-hide pass now also rebinding-resolves per-slot widgets before hide.

Rationale:
1. These changes reduce stale-widget leakage during swap/rebuild windows.
2. These changes target CQ_Bug_7 class behavior (active-lane/top-row border persistence) without changing conquest game-state ownership.
