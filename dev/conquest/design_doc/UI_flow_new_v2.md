# Conquest UI Flow (Hard-Cut Final Architecture)

Status: Proposed for approval
Owner: HUD rewrite track
Supersedes for combat HUD path: `design_doc/UI_flow_new.md` (after approval only)

## 0) Directive

This document defines a hard cut from the legacy combat HUD methodology.

Non-negotiable constraints:
1. No reuse of legacy combat function entrypoints.
2. No reuse of legacy combat widget names.
3. New combat HUD chain must be independently toggleable on/off.
4. New chain must be testable in isolation.
5. New names must be forward-facing (no `v2`, `phase2`, or temporary naming semantics).

## 0.1 Carried Architecture Principles (Locked)

The following design intent is carried forward unchanged from `UI_flow_new.md`.

1. Single writer for build/repair/destroy of combat HUD refs.
2. Single immutable parent chain for combat HUD roots.
3. Render paths mutate values/visibility only, not root ownership.
4. Missing/invalid critical refs fail-close into controlled rebuild.
5. Lifecycle transitions use explicit reset contracts, never implicit fallback.
6. Every positional placement is defined by constants; placement truth must not be scattered.
7. Every UI element must be classified as `static`, `dynamic`, or `animated`.
8. Static elements use one placement constant source only.
9. Dynamic elements must use explicit static references where possible; otherwise exactly one dynamic placement resolver function.
10. Animated elements must use explicit animation position functions and a dedicated animation update cadence (separate from static/dynamic refresh cadence).
11. Caches are handle/performance helpers only and must not become placement truth owners.
12. It must be immediately obvious where to move any UI element by reading one constant/function path.
13. Frequently reused HUD elements are pre-created per player and toggled.
14. Truly rare/ephemeral elements are create-on-demand and delete-on-close.
15. Team switch lifecycle is always `hide -> clean rebuild -> resume updates`.
16. Centered UI elements must be centered by anchor contract, not left-anchored then mathematically recentered.
17. All HUD/UI widgets are PID-scoped per player; no shared global gameplay HUD widgets.
18. No schema/internal lifecycle versioning for HUD ownership resets; each game load is treated as fresh script runtime.
19. UI/HUD projection is script-authoritative from game state; if visual state must persist, it is stored in per-player state (not hidden in UI code paths).
20. Telemetry requirements are part of architecture planning (per-player UI instance count and update-rate tracking), implementation deferred.
21. Join prompt can be intentionally policy-disabled, but suppression state/events must still be tracked per player.

### 0.1.1 UI Classification Contract (Locked)

| Class | Definition | Placement Source of Truth | Update Cadence | Lifecycle |
|---|---|---|---|---|
| `static` | Position never changes during runtime except intentional redesign edits | constants only | none (placement write at build/rebuild only) | pre-create per player, toggle as needed |
| `dynamic` | Position can change from state/runtime conditions | one explicit dynamic placement resolver (plus optional static anchors/constants) | main HUD refresh cadence | pre-create per player, update via resolver |
| `animated` | Position changes over time by animation intent | one explicit animation function per animation track | dedicated animation cadence (for example `0.12s`, `0.5s`) | pre-create or ephemeral based on frequency, but animation scheduler ownership is explicit |

### 0.1.2 Positional Determinism Contract (Locked)

1. Placement constants are the only legal source for initial placement.
2. Dynamic/animated placement functions must be discoverable from the widget owner module with one obvious entry path.
3. If placement origin cannot be found immediately from owner module + constants, architecture is considered failed.
4. Caches can store handles and quick-lookup metadata, but never replace constant/function placement authority.

### 0.1.3 Core Edge-Case Inventory (Must Be Handled)

| Principle Area | Edge Case | Required Handling |
|---|---|---|
| constant-driven placement | multiple constants controlling one widget in different modules | collapse to one canonical constant path; reject duplicate placement sources |
| static element safety | static widget moved during runtime by non-build code | ban runtime position writes for static class outside rebuild path |
| dynamic placement | multiple dynamic functions race and overwrite each other | one resolver per widget class; renderer consumes resolver output only |
| animation cadence | animation writes occur on main tick and cause jitter/contention | dedicated animation scheduler/cadence separated from main render cadence |
| animation + lifecycle | animation continues during swap/reconnect teardown | animation scheduler must stop/hide on lifecycle reset and rebind on rebuild |
| cache drift | cached refs survive but point to wrong ownership tree | critical ownership validation before render; fail-close rebuild on mismatch |
| move discoverability | engineer cannot identify where element position is sourced quickly | treat as architecture defect; add/repair explicit constant/function ownership |
| pre-create policy | frequent elements are recreated repeatedly and flicker | pre-create once per player and toggle visibility |
| ephemeral policy | rare elements are permanently kept and leak complexity | create on demand and delete on close/end |
| team swap | visual remnants from old team survive in new team context | enforce `hide -> destroy/rebuild -> release on deploy` only |
| aspect ratio | center lane drifts from center at non-default aspect ratio | anchor-centered roots and centered child contracts; avoid left-origin center math |
| player isolation | widget names collide across players | PID in widget IDs and per-pid caches/owners only |
| runtime freshness assumption | schema/version branch blocks correct rebuild | remove schema/version branching from HUD lifecycle |
| state authority | visual state hidden in UI helper locals diverges from game state | keep persistent visual truth in per-player `State`, UI code projects only |
| telemetry readiness | cannot explain per-player UI instance/update load | reserve per-player counters in architecture plan and diagnostics schema |

## 1) New Namespace Contract

### 1.1 Code namespace

All new combat HUD code uses `twlConquestHud` prefix.

Examples:
- `twlConquestHudBootRuntime()`
- `twlConquestHudTickFrame(force?: boolean)`
- `twlConquestHudEnsurePlayerGraph(player: mod.Player)`
- `twlConquestHudRenderPlayerFrame(pid: number, snapshot: TwlConquestHudSnapshot)`

### 1.2 Widget ID namespace

All new combat HUD widgets use `TwlConquestHud_` prefix.

Examples:
- `TwlConquestHud_Root_{pid}`
- `TwlConquestHud_CombatLane_{pid}`
- `TwlConquestHud_TicketsLane_{pid}`
- `TwlConquestHud_ObjectivesLane_{pid}`
- `TwlConquestHud_ActiveObjective_{pid}`
- `TwlConquestHud_Engagement_{pid}`

Collision rule:
- No new widget name may start with legacy prefixes:
  - `ConquestCombatHud`
  - `ConquestTicketsHud`
  - `ConquestFlagHud`
  - `ConquestHudRoot`
  - `TopHudRoot`

## 2) New Module Topology (No Legacy Reuse)

Planned new directory:
- `src/ui/conquest/hud-core/`

Planned modules:
1. `hud-core/types.ts`
2. `hud-core/constants.ts`
3. `hud-core/names.ts`
4. `hud-core/state.ts`
5. `hud-core/build.ts`
6. `hud-core/validate.ts`
7. `hud-core/render.ts`
8. `hud-core/lifecycle.ts`
9. `hud-core/pipeline.ts`
10. `hud-core/toggle.ts`

Dependency contract:
1. `pipeline.ts` is the only entrypoint called by live tick.
2. `render.ts` mutates values/visibility only.
3. `build.ts` mutates parent/anchor/size/position only.
4. `validate.ts` owns critical ref checks.
5. `lifecycle.ts` owns hide/destroy/reset semantics.
6. `toggle.ts` owns runtime mode switching and isolation gates.

## 3) Runtime Toggle Model

New config mode:
- `CONQUEST_HUD_MODE: "off" | "legacy" | "core"`

Meaning:
1. `off`: no combat HUD path writes.
2. `legacy`: existing legacy path only.
3. `core`: new `twlConquestHud` path only.

Isolation behavior when mode is `core`:
1. Legacy combat entrypoints are not called.
2. Legacy combat widget names are hard-hidden and destroyed once per player lifecycle reset.
3. Only `TwlConquestHud_*` widgets are eligible for combat rendering.

## 4) New Core Function Chain (Top Down)

### 4.1 Boot

`twlConquestHudBootRuntime()`
1. Reset hud-core per-player state maps.
2. Clear scheduler timers.
3. Register mode gate snapshot for diagnostics.

### 4.2 Tick entrypoint

`twlConquestHudTickFrame(force?: boolean)`
1. Exit if mode is not `core`.
2. Build authoritative snapshot per player.
3. Ensure player graph.
4. Validate critical refs.
5. Render player frame.

### 4.3 Player ensure

`twlConquestHudEnsurePlayerGraph(player: mod.Player)`
1. Ensure `TwlConquestHud_Root_{pid}` under `UIRoot`.
2. Ensure combat lane subtree under root.
3. Ensure ticket/objective/popout/engagement subtree.
4. Cache handles in `State.conquestHud.coreByPid[pid]`.

### 4.4 Validation

`twlConquestHudValidateCriticalRefs(entry: TwlConquestHudEntry): boolean`
1. Validate direct parent handles.
2. Validate anchors.
3. Validate local positions.
4. Validate lane ownership boundaries.

Failure action:
- `twlConquestHudRecoverEntry(pid)`:
  1. hide
  2. destroy
  3. rebuild
  4. resume on next tick

### 4.5 Render

`twlConquestHudRenderPlayerFrame(pid: number, snapshot: TwlConquestHudSnapshot)`
1. Render tickets lane values.
2. Render objectives lane values.
3. Render active objective panel.
4. Render engagement panel.
5. Commit root visibility last.

## 5) Legacy Cut List (Hard Ban in Core Mode)

In `core` mode, the new pipeline must not call:
1. `ensureHudForPlayer(...)` for combat lane creation.
2. `updateConquestPhase2ADebugHudForAllPlayers(...)` combat lane branch.
3. Any `conquestPhase3...` combat render helpers.
4. Any legacy combat lookup via `safeFind("ConquestTicketsHud...")` or `safeFind("ConquestFlagHud...")`.

Permitted legacy coexistence during migration:
1. Clock/help/ready/admin surfaces can remain temporarily on legacy owners.
2. Combat lane ownership is exclusive to `twlConquestHud` in `core` mode.

## 6) Data Contracts

New state branch:
- `State.conquestHud.coreByPid[pid]`
- `State.conquestHud.lifecycleByPid[pid]`
- `State.conquestHud.telemetryByPid[pid]`

New snapshot contract:
- `TwlConquestHudSnapshot` is derived from authoritative Conquest runtime state each tick.
- No UI state is authoritative for gameplay truth.

## 7) Naming Map (Initial Proposal)

### 7.1 Functions

1. `twlConquestHudBootRuntime`
2. `twlConquestHudTickFrame`
3. `twlConquestHudTickAnimation`
4. `twlConquestHudEnsurePlayerGraph`
5. `twlConquestHudBuildRootGraph`
6. `twlConquestHudValidateCriticalRefs`
7. `twlConquestHudRenderPlayerFrame`
8. `twlConquestHudRenderTickets`
9. `twlConquestHudRenderObjectives`
10. `twlConquestHudRenderActiveObjective`
11. `twlConquestHudRenderEngagement`
12. `twlConquestHudHidePlayer`
13. `twlConquestHudDestroyPlayer`
14. `twlConquestHudRecoverEntry`
15. `twlConquestHudSetMode`

### 7.2 Widget names

1. `TwlConquestHud_Root_{pid}`
2. `TwlConquestHud_CombatLane_{pid}`
3. `TwlConquestHud_TicketsLane_{pid}`
4. `TwlConquestHud_ObjectivesLane_{pid}`
5. `TwlConquestHud_TicketBlueCount_{pid}`
6. `TwlConquestHud_TicketRedCount_{pid}`
7. `TwlConquestHud_TicketBlueBar_{pid}`
8. `TwlConquestHud_TicketRedBar_{pid}`
9. `TwlConquestHud_ObjectiveSlot_{pid}_{slot}`
10. `TwlConquestHud_ObjectiveFill_{pid}_{slot}`
11. `TwlConquestHud_ObjectiveLabel_{pid}_{slot}`
12. `TwlConquestHud_ActiveObjective_{pid}`
13. `TwlConquestHud_Engagement_{pid}`

## 8) Implementation Plan

### Step A: Scaffolding
1. Add `hud-core` modules with empty contracts and compile wiring.
2. Add `CONQUEST_HUD_MODE` with default `legacy`.
3. Add no-op `twlConquestHudTickFrame()` call in live loop behind mode gate.

### Step B: Build/Validate path
1. Implement root graph creation with new names only.
2. Implement strict critical-ref validation.
3. Implement lifecycle recover path.

### Step C: Render path
1. Implement tickets + objectives render.
2. Implement active objective + engagement render.
3. Implement visibility commit ordering.

### Step D: Isolation enforcement
1. In `core` mode, disable legacy combat update branch.
2. Add one-time legacy combat hard cleanup per player join/reset.
3. Verify no `safeFind("ConquestTicketsHud...")` or `safeFind("ConquestFlagHud...")` remains in new path.

### Step E: Cutover
1. Switch default mode from `legacy` to `core` after acceptance.
2. Delete dead legacy combat entrypoints once stable window completes.
3. Keep rollback toggle for one release window only.

## 9) Verification Matrix

Required checks in `core` mode:
1. Fresh match boot: centered combat lane.
2. Team swap once: no stale old team visuals.
3. Team swap spam: no duplicated bars/slots.
4. Reconnect: single widget chain per pid.
5. Two-player POV: independent HUD ownership.
6. Toggle `core -> off -> core`: deterministic rebuild, no drift.
7. Toggle `legacy -> core`: no mixed-owner frame after settle.

Evidence per check:
1. Screenshot path
2. Mode value
3. Build version
4. Pass/fail

## 10) Acceptance Criteria

Approved for implementation completion when:
1. `core` mode has zero visual usage of legacy combat names.
2. Combat lane is centered and stable across lifecycle transitions.
3. No render-time reparent/anchor/position writes outside `build.ts`.
4. Toggle behavior is deterministic and reversible.
5. Legacy combat path is unreachable when `core` is active.

## 11) Open Naming Decisions (User Approval Requested)

If you want changes before code implementation, pick preferred naming for:
1. Namespace prefix: `twlConquestHud` or your alternative.
2. Widget prefix: `TwlConquestHud_` or your alternative.
3. Mode name `core` or your alternative.

Once approved, these names become locked and implementation starts with no temporary aliases.
