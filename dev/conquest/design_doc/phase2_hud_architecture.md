# Phase 2 HUD Architecture Implementation Plan

## Purpose
Stabilize Conquest HUD behavior by removing mixed authority and duplicate render paths that keep causing regressions (stale widgets, wrong colors, duplicate overlays, incorrect visibility toggles).

## Scope
- Conquest ticket HUD
- Conquest flag HUD
- Conquest engage HUD
- Clock/status/help/ready interactions that currently overlap with Conquest rendering
- HUD lifecycle (build, teardown, team swap, join/leave/deploy)

## Core Architecture Decisions
1. Use one script-owned `ConquestHudViewModel` per player.
2. Split runtime flow into strict stages:
   - `ingest` (engine -> runtime state)
   - `derive` (runtime state -> per-player HUD view model)
   - `render` (view model -> widgets only)
   - `cleanup` (lifecycle transitions only)
3. Enforce single-writer ownership by widget group.
4. Replace multiple teardown/rebuild paths with one authoritative destroy/rebuild path.
5. Remove engine queries from render code.
6. Remove gameplay-state mutation from render code.

## Single-Writer Ownership Matrix

| Widget ID range/pattern | Single owner function | File |
|---|---|---|
| `ConquestTicketsHudRoot_${pid}` | `renderConquestRootsForPid(refs, vm)` | `src/index/capture-tickets.ts` |
| `ConquestFlagsHudRoot_${pid}` | `renderConquestRootsForPid(refs, vm)` | `src/index/capture-tickets.ts` |
| `ConquestTicketsHudTeam1Container_${pid}`, `ConquestTicketsHudTeam2Container_${pid}`, `ConquestTicketsHudTeam1_${pid}`, `ConquestTicketsHudTeam2_${pid}`, `ConquestTicketsHudSlash_${pid}` | `renderConquestTicketCountersForPid(refs, vm.tickets)` | `src/index/capture-tickets.ts` |
| `ConquestTicketsHudLeftBarTrack_${pid}`, `ConquestTicketsHudLeftBarFill_${pid}`, `ConquestTicketsHudRightBarTrack_${pid}`, `ConquestTicketsHudRightBarFill_${pid}` | `renderConquestTicketBarsForPid(refs, vm.tickets)` | `src/index/capture-tickets.ts` |
| `ConquestTicketsHudLeadBorderLeft_${pid}`, `ConquestTicketsHudLeadBorderRight_${pid}`, `ConquestTicketsHudLeadCrownLeft_${pid}`, `ConquestTicketsHudLeadCrownRight_${pid}` | `renderConquestTicketLeaderForPid(refs, vm.tickets)` | `src/index/capture-tickets.ts` |
| `ConquestTicketsHudBleedChevronLeft1..3_${pid}`, `ConquestTicketsHudBleedChevronRight1..3_${pid}` | `renderConquestTicketBleedForPid(refs, vm.tickets)` | `src/index/capture-tickets.ts` |
| `ConquestFlagHudSlot_${pid}_${i}`, `ConquestFlagHudFill_${pid}_${i}`, `ConquestFlagHudBorder_${pid}_${i}` | `renderConquestFlagSlotsForPid(refs, vm.flags)` | `src/index/capture-tickets.ts` |
| `ConquestFlagHudLabel_${pid}_${i}`, `ConquestFlagHudLabelShadow*_${pid}_${i}` | `renderConquestFlagLabelsForPid(refs, vm.flags)` | `src/index/capture-tickets.ts` |
| `ConquestFlagHudPercentRoot_${pid}_${i}`, `ConquestFlagHudPercentText_${pid}_${i}`, `ConquestFlagHudPercentShadow*_${pid}_${i}` | `renderConquestFlagPercentsForPid(refs, vm.flags)` | `src/index/capture-tickets.ts` |
| `ConquestFlagHudEngageRoot_${pid}`, `ConquestFlagHudEngageTrack_${pid}`, `ConquestFlagHudEngageFriendlyFill_${pid}`, `ConquestFlagHudEngageEnemyFill_${pid}`, `ConquestFlagHudEngageFriendlyCountBg_${pid}`, `ConquestFlagHudEngageEnemyCountBg_${pid}`, `ConquestFlagHudEngageFriendlyCount_${pid}`, `ConquestFlagHudEngageEnemyCount_${pid}`, `ConquestFlagHudEngageStatus_${pid}`, `ConquestFlagHudEngageStatusShadow*_${pid}` | `renderConquestEngageForPid(refs, vm.engage)` | `src/index/capture-tickets.ts` |
| `MatchTimerRoot_${pid}`, `MatchTimerMinTens_${pid}`, `MatchTimerMinOnes_${pid}`, `MatchTimerColon_${pid}`, `MatchTimerSecTens_${pid}`, `MatchTimerSecOnes_${pid}` | `renderClockDigitsForPid(clockCache, vm.clock)` | `src/clock/ui.ts` |
| `RoundStateRoot_${pid}`, `RoundStateText_${pid}`, `PlayersReadyText_${pid}` | `renderClockStatusLinesForPid(clockCache, vm.status)` | `src/hud/status.ts` |
| `Container_HelpText_${pid}`, `HelpText_${pid}`, `Container_ReadyStatus_${pid}`, `ReadyStatusText_${pid}` | `renderHelpReadyStripsForPid(refs, vm.helpReady)` | `src/hud/help-visibility.ts` |
| `TopHudRoot_${pid}`, `Container_TopLeft_CoreUI_${pid}`, `Container_TopMiddle_CoreUI_${pid}`, `Container_TopRight_CoreUI_${pid}` and conquest creation/layout/depth | `ensureHudForPlayer(player)` and `applyConquestAbsoluteLayout(refs)` only | `src/hud/build.ts` |
| All conquest HUD teardown widget names | `destroyHudForPid(pid, reason)` only | `src/hud/build.ts` |

## Hard Rules
1. Only the owner function may write visibility/position/size/color/text for widgets in its range.
2. `ensureHudForPlayer` may create/layout/depth/cache refs, but not per-frame display decisions.
3. `destroyHudForPid` is the only delete path for conquest HUD widgets.
4. No `safeFind(...)` in live render loops once refs are cached.
5. Render functions must not mutate gameplay state maps.
6. No fallback perspective coloring (`Team1` fallback) during unresolved team state.

## Standard Render Order (per player, single pass)
1. `renderConquestRootsForPid`
2. `renderConquestTicketCountersForPid`
3. `renderConquestTicketBarsForPid`
4. `renderConquestTicketLeaderForPid`
5. `renderConquestTicketBleedForPid`
6. `renderConquestFlagSlotsForPid`
7. `renderConquestFlagLabelsForPid`
8. `renderConquestFlagPercentsForPid`
9. `renderConquestEngageForPid`
10. `renderClockDigitsForPid`
11. `renderClockStatusLinesForPid`
12. `renderHelpReadyStripsForPid`

## Implementation Plan

### Phase A: Baseline and Freeze
- [ ] Capture current behavior baseline screenshots for all known regression scenarios.
- [x] Add a temporary "single-pass render tracing" counter per pid to detect duplicate render passes.
- [x] Freeze non-architectural HUD changes until this phase is complete.
Notes:
Screenshot capture is intentionally skipped per current testing workflow; architecture passes are constrained to ownership/pipeline work only.

### Phase B: View Model and Pipeline
- [x] Create `ConquestHudViewModel` and child models (`tickets`, `flags`, `engage`, `status`, `helpReady`, `clock`).
- [x] Build `deriveHudViewModelForPlayer(pid)` as the only view-model builder.
- [x] Ensure ingest writes runtime state only; derive reads runtime state only; render writes widgets only.
Notes:
`ConquestHudViewModel` now includes child models for tickets/flags/engage/status/helpReady/clock and render uses model-derived tickets/flags/engage.
Status/help/clock owners now consume derived slices (`hudStatusVmByPid`, `hudHelpReadyVmByPid`, `hudClockVmByPid`) with fallback paths retained for safety.
Derived slices are now synthesized before status/help/clock reads via `conquestPhase3EnsureTopHudDerivedSlicesForPid`, so fallback/recompute code paths are reduced to defensive-only behavior.

### Phase C: Single-Writer Refactor
- [x] Introduce owner render functions listed in the matrix.
- [x] Move all conquest ticket/flag/engage widget writes into owner functions.
- [x] Remove `help-visibility.ts` cross-writes for `RoundStateText` and `PlayersReadyText` (owned by `status.ts`).
- [x] Remove remaining cross-writes between `capture-tickets.ts`, `status.ts`, `help-visibility.ts`, and `clock/ui.ts`.
Notes:
Owner writers now active for roots/tickets/flags/engage (`renderConquestRootsForPid`, `renderConquestTicketCountersForPid`, `renderConquestTicketBarsForPid`, `renderConquestTicketLeaderForPid`, `renderConquestTicketBleedForPid`, `renderConquestFlagSlotsForPid`, `renderConquestEngageForPid`).
Status/help visibility now routes through one shared snapshot helper (`getHudVisibilitySnapshotForPid`) to reduce cross-module rule drift.

### Phase D: Lifecycle Unification
- [x] Implement centralized conquest teardown owner (`destroyConquestHudForPid(pid)`) in one place.
- [x] Replace team-swap cleanup and leave conquest-cleanup paths to use centralized teardown owner.
- [x] Replace remaining ad-hoc conquest delete loops (including schema-reset rebuild path) with centralized teardown owner.
- [x] Keep one rebuild path: `ensureHudForPlayer(player)`.

### Phase E: Generation Tokens and Async Safety
- [x] Add `hudGenerationByPid`.
- [x] Increment generation on destroy/rebuild/team swap teardown path.
- [x] Gate delayed refresh callbacks with generation token checks.

### Phase F: Ref Cache Hardening
- [x] Add missing refs to `HudRefs` (`ConquestTicketsHudTeam1Container`, `ConquestTicketsHudTeam2Container`, `ConquestTicketsHudSlash`).
- [x] Replace ticket container/slash render visibility writes to use cached refs instead of live `safeFind`.
- [x] Remove additional per-frame conquest render `safeFind` fallbacks (legacy shadow/border hide writes in main render loop).
- [x] Remove remaining live-loop conquest `safeFind` usage by switching live update to cached refs + rebuild-on-missing.
- [x] If critical refs are missing for a player, trigger conquest HUD rebuild and skip partial-frame writes.

### Phase G: Authority Cleanup
- [x] Remove engine point-membership queries from render path for engage visibility.
- [x] Keep engage visibility derived from script state (`engagedObjIdByPid` + capture runtime state).
- [x] Remove gameplay-state mutations from render path (for example deleting `engagedObjIdByPid` in render).
- [x] Remove perspective fallback-to-Team1 for unresolved team state; hide team-colored widgets until resolved.

### Phase H: Validation and Regression Tests
- [ ] Validate swap-on-flag case.
- [ ] Validate leaving radius while neutralizing.
- [ ] Validate neutralized idle (no sliver fill).
- [ ] Validate no duplicate ticket text overlays.
- [ ] Validate no stale crowns/borders/engage panel persistence.
- [ ] Validate reconnect and late join HUD consistency.

## Tracking Board
- [ ] A. Baseline and Freeze
- [x] B. View Model and Pipeline
- [x] C. Single-Writer Refactor
- [x] D. Lifecycle Unification
- [x] E. Generation Tokens and Async Safety
- [x] F. Ref Cache Hardening
- [x] G. Authority Cleanup
- [ ] H. Validation and Regression Tests

## Definition of Done
1. Every conquest HUD widget is controlled by one owner function.
2. No conquest render path performs engine queries.
3. No conquest render path mutates gameplay state.
4. One destroy path and one rebuild path are used everywhere.
5. Team swap, join/leave, and deploy transitions produce zero duplicate/stale widgets.
6. Regression checklist passes in singleplayer and multiplayer test sessions.

## Moved From Phase 3 (2026-03-09)
The following section was previously stored in `design_doc/phase3_hud_design.md` and was moved here when Phase 3 was re-scoped to the active-flag pop-out design.

## Phase 3B Execution Plan (Active)

### Purpose
Polish the Conquest ticket/flag HUD so bleed pressure is readable at a glance, animations match gameplay cadence, and all updates remain script-authoritative.

### Workstream 1: Chevron Visual Stack
- [x] Parent bleed chevrons to ticket HUD root (not bar tracks) so bar fill cannot occlude chevron foreground text.
- [x] Keep drop-shadow ring and colored foreground chevron in deterministic order by reattaching the core glyph after shadow widgets.
- [ ] Verify in-game that each visible chevron shows colored core + black drop shadow on both teams.

### Workstream 2: Bleed-Cadence Animation
- [x] Derive pulse timing from script bleed rate (`perDiffPerSecond`) and active chevron count.
- [x] Enforce one full inner->outer sequence per bleed interval:
  - diff 1 at 1 ticket/3s -> full sequence 3s
  - diff 3 at 1 ticket/3s -> full sequence 1s
- [x] Keep each per-slot blink short for a faster flicker feel while preserving total sequence timing.
- [ ] Validate by changing ownership differential live (1, 2, 3+) and observing cadence scale.

### Workstream 3: Regression Guardrails
- [ ] Confirm no stale chevrons remain after team swap.
- [ ] Confirm chevrons hide when bleed differential returns to 0.
- [ ] Confirm no ticket text duplication while bleed pulses are active.

### Test Checklist (Manual)
1. Start a live round, force 1-flag differential, confirm one-side chevrons are colored and animate inner->outer.
2. Increase to 2 and 3 differential, confirm all visible chevrons animate and sequence duration matches bleed speed.
3. Swap teams while bleed is active, confirm no black-only chevrons, no stale carryover, no duplicate overlays.
4. Return to equal ownership, confirm chevrons and pulse queue clear immediately.
