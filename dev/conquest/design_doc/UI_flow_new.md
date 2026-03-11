# Conquest UI Flow (New Architecture)

Status: Draft skeleton  
Purpose: Define the rebuilt HUD/UI architecture that replaces legacy flow while preserving required gameplay behavior.

## 0) Inputs and Reference Mapping

Primary historical input:
- `design_doc/UI_flow_old.md`
  - Status: locked legacy reference (read-only; no further edits)

Locked legacy code snapshot:
- `reference_implementations/reference_conquest_attempt_a/src`
- `reference_implementations/reference_conquest_attempt_a/src_legacy_rebuild_start`

Canonical requirements:
- `design_doc/TWL_Conquest_Design.md`
- `design_doc/phase3_hud_polish3_teardown.md`
- `design_doc/phase3_hud_design.md`
- `design_doc/conquest_issues.md`

## 1) Objective

Build a deterministic, single-owner HUD architecture where:
- combat HUD is always centered by contract
- per-player ownership is strict and isolated
- swap/reconnect paths cannot produce stale handle drift
- ready dialog and interaction features remain stable

## 2) Scope (Phase 1 Rebuild)

In scope:
- top HUD root chain and combat lane ownership
- tickets and flags lane layout/positioning contract
- lifecycle contracts (startup, join, deploy, swap, reconnect)
- cache contracts for gameplay HUD refs

Out of scope for first implementation pass:
- visual polish iterations beyond contract parity
- optional motion/animation refinements

## 3) Architecture Principles (Locked)

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

### 3.1 UI Classification Contract (Locked)

| Class | Definition | Placement Source of Truth | Update Cadence | Lifecycle |
|---|---|---|---|---|
| `static` | Position never changes during runtime except intentional redesign edits | constants only | none (placement write at build/rebuild only) | pre-create per player, toggle as needed |
| `dynamic` | Position can change from state/runtime conditions | one explicit dynamic placement resolver (plus optional static anchors/constants) | main HUD refresh cadence | pre-create per player, update via resolver |
| `animated` | Position changes over time by animation intent | one explicit animation function per animation track | dedicated animation cadence (for example `0.12s`, `0.5s`) | pre-create or ephemeral based on frequency, but animation scheduler ownership is explicit |

### 3.2 Positional Determinism Contract (Locked)

1. Placement constants are the only legal source for initial placement.
2. Dynamic/animated placement functions must be discoverable from the widget owner module with one obvious entry path.
3. If placement origin cannot be found immediately from owner module + constants, architecture is considered failed.
4. Caches can store handles and quick-lookup metadata, but never replace constant/function placement authority.

### 3.3 Core Edge-Case Inventory (Must Be Handled)

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

## 4) Root Chain Contract (New)

Planned chain:
1. `TopHudRoot_{pid}` (centered anchor root under `UIRoot`)
2. `ConquestCombatHudRoot_{pid}` (single combat container)
3. `ConquestTicketsHudRoot_{pid}`
4. `ConquestFlagsHudRoot_{pid}`

Pending:
- exact numeric positions/sizes to lock after first centered validation pass
- whether any non-combat lanes should share this chain or stay separate
- centered lanes must remain center-anchored across aspect ratios; no left-origin center math fallback

## 5) Ownership Model (New)

| Surface | Create/Repair Owner | Render Owner | Destroy Owner | Notes |
|---|---|---|---|---|
| Combat root chain | pending | pending | pending | Single owner required |
| Tickets lane | pending | pending | pending | No render-time reparent |
| Flags lane | pending | pending | pending | Includes slot rows |
| Popout | pending | pending | pending | Reattach after core lane stability |
| Engage | pending | pending | pending | Reattach after core lane stability |
| Clock + round-state | pending | pending | pending | May remain separate owner |
| Ready/help lanes | pending | pending | pending | Must not destabilize combat chain |
| Ready dialog/admin | pending | pending | pending | Keep separate lifecycle |

### 5.1 PID Uniqueness Contract (Locked)

1. Every gameplay HUD widget id must include `pid`.
2. Every gameplay HUD cache map is keyed by `pid`.
3. No gameplay HUD widget is shared globally across players.
4. This follows the same per-player pattern used in `helis-only` (`State.hudCache.hudByPid[pid]`, `TopHudRoot_{pid}`, `MatchTimerRoot_{pid}` style naming).

## 6) Lifecycle Contract (New)

### 6.1 Startup
1. Initialize state.
2. Ensure per-player root chain.
3. Run first render pass.

### 6.2 Join
1. Cleanup stale per-pid state.
2. Ensure root chain.
3. Force full projection refresh.

### 6.3 Deploy
1. Update deploy-state gates.
2. Ensure root chain if needed.
3. Force one authoritative render pass.

### 6.4 Live Tick
1. Derive view models from state.
2. Validate critical refs.
3. Render values/visibility only.

### 6.5 Team Swap
1. Set swap pending.
2. Hide + destroy combat HUD.
3. Apply team change and undeploy.
4. Rebuild once after settle window.
5. Release on deploy callback only.

### 6.6 Reconnect/Leave
1. Full per-pid cleanup (roots, cache, lifecycle tokens).
2. Rejoin path behaves like fresh join.

### 6.7 Join Prompt Policy
1. Join prompt remains disabled by policy unless explicitly enabled.
2. Disabled policy must still write per-player suppression telemetry/state.
3. Suppression state must be explicit in runtime state (not implied by early returns alone).
4. Existing widget cleanup must still run when policy disables prompt rendering.

## 7) Cache Contract (New)

Locked cache rules:
1. Cache stores widget handles and ownership metadata, never placement authority.
2. Cache reads must still route through deterministic placement contracts (constants + resolver functions).
3. Cache hit does not bypass ownership/anchor validation.

| Cache | Key | Populate Rule | Validation Rule | Invalidate Rule |
|---|---|---|---|---|
| `hudByPid` | `pid` | pending | pending | pending |
| `clockWidgetCache` | `pid` | pending | pending | pending |
| `countdownWidgetCache` | `pid` | pending | pending | pending |

## 8) Lookup and Handle Policy

Locked policy:
1. No global name lookup fallback in combat HUD render/update hot paths.
2. Combat HUD render/update uses per-pid cached handles as authoritative refs.
3. Critical refs must pass ownership/anchor/geometry validation before mutation.
4. On validation failure, run controlled lifecycle reset: `hide -> destroy -> rebuild -> resume`.
5. `safeFind` remains valid for bootstrap/recovery/cleanup, and should prefer subtree-scoped lookup when possible.

Clarification:
- `safeFind` is crash-safety (`undefined` instead of throw), not ownership-safety.
- Stale player lookup handling is separate (`safeFindPlayer` / player validity checks).

## 9) Failure Handling Contract

Planned behavior:
1. Critical-ref validation failure triggers immediate controlled teardown/rebuild.
2. Repeated failures emit diagnostics and suspend that slice rather than half-rendering.
3. No silent fallback to unknown widget ownership.

## 10) Diagnostics Contract

Required runtime fields (minimum):
- `timestamp`
- `pid`
- `event`
- `rootChainState`
- `criticalRefCheck`
- `cacheState`
- `action`
- `reason`

Reserved telemetry additions (design target, not implemented yet):
- per-player UI/HUD instance count
- per-player UI update throughput (updates per second / per tick buckets)

## 11) Verification Plan Skeleton

Core scenarios:
1. fresh boot centering
2. team swap once
3. swap spam
4. reconnect
5. two-player isolation
6. ready dialog open/close
7. triple tap interact

Evidence format:
- screenshot path(s)
- short pass/fail summary
- timestamp/build version note

## 12) Open Decisions

Pending user decisions:
1. Exact validation gate checklist before phase progression (user-owned/deferred).

## 13) Acceptance Gate (Draft)

New architecture is ready to proceed only when:
1. center alignment is deterministic in all core scenarios
2. ownership tables and cache contracts are fully resolved (no pending rows)
3. swap/reconnect contracts pass without regressions
4. non-combat UI remains functional

## 14) Document Change Log

- `2026-03-11`: Initial skeleton created on new rebuild branch.
- `2026-03-11`: Added locked redesign principles for positional determinism, static/dynamic/animated classification, animation cadence separation, PID-only HUD ownership, cache placement rules, and core edge-case inventory.
- `2026-03-11`: Locked lookup policy: no global name fallback in combat hot paths; cached refs + validation are authoritative; `safeFind` limited to bootstrap/recovery/cleanup.
