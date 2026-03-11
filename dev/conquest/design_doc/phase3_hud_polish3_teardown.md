# Phase 3 HUD Polish 3 - Teardown and Rebuild Plan

## Objective
Rebuild Conquest HUD architecture with a clean, deterministic, per-player UI tree.

This pass explicitly removes patchwork layout logic and legacy fallback behavior.

## Hard Requirements
1. No migrations, schema gates, or translation layers for HUD placement.
2. No runtime movement of static HUD roots after build.
3. Only animation/dynamic-layout code can move child widgets.
4. Every HUD widget must be PID-scoped and owned by one player.
5. Pre-create reusable HUD widgets once per player, then show/hide.
6. Rare/ephemeral widgets can be create/delete on demand.
7. Team switch flow is hide -> rebuild -> resume updates.
8. Aspect ratio support comes from centered root anchoring, not per-frame correction.
9. When adjusting layout, edit authoritative values directly. Do not add one-off "nudge" constants.

## Element Inventory for `current_testing2.PNG`
This is the name map for the HUD elements visible in:
`bf6-portal/dev/conquest/reference_design_documentation/testing_images/current_testing2.PNG`

## Root Chain
`TopHudRoot_{pid}`
`ConquestCombatHudRoot_{pid}`
`MatchTimerRoot_{pid}`
`RoundStateRoot_{pid}`
`ConquestTicketsHudRoot_{pid}`
`ConquestFlagsHudRoot_{pid}`

## Clock and State Text
`MatchTimerRoot_{pid}`
`MatchTimerMinTens_{pid}`
`MatchTimerMinOnes_{pid}`
`MatchTimerColon_{pid}`
`MatchTimerSecTens_{pid}`
`MatchTimerSecOnes_{pid}`
`RoundStateRoot_{pid}`
`RoundStateText_{pid}`

## Tickets Row
`ConquestTicketsHudRoot_{pid}`
`ConquestTicketsHudLeftBarTrack_{pid}`
`ConquestTicketsHudLeftBarFill_{pid}`
`ConquestTicketsHudRightBarTrack_{pid}`
`ConquestTicketsHudRightBarFill_{pid}`
`ConquestTicketsHudTeam1Container_{pid}`
`ConquestTicketsHudTeam1Shadow_{pid}`
`ConquestTicketsHudTeam1_{pid}`
`ConquestTicketsHudTeam1CoreOverlay_{pid}`
`ConquestTicketsHudTeam2Container_{pid}`
`ConquestTicketsHudTeam2Shadow_{pid}`
`ConquestTicketsHudTeam2_{pid}`
`ConquestTicketsHudTeam2CoreOverlay_{pid}`
`ConquestTicketsHudLeadBorderLeft_{pid}`
`ConquestTicketsHudLeadBorderRight_{pid}`
`ConquestTicketsHudLeadCrownLeftShadow_{pid}`
`ConquestTicketsHudLeadCrownRightShadow_{pid}`
`ConquestTicketsHudLeadCrownLeft_{pid}`
`ConquestTicketsHudLeadCrownRight_{pid}`
`ConquestTicketsHudSlash_{pid}`

## Ticket Bleed Chevron Stack
`ConquestTicketsHudBleedChevronLeft{1..7}_{pid}`
`ConquestTicketsHudBleedChevronRight{1..7}_{pid}`
`ConquestTicketsHudBleedChevronLeft{1..7}ShadowRight_{pid}`
`ConquestTicketsHudBleedChevronLeft{1..7}ShadowLeft_{pid}`
`ConquestTicketsHudBleedChevronLeft{1..7}ShadowUp_{pid}`
`ConquestTicketsHudBleedChevronLeft{1..7}ShadowDown_{pid}`
`ConquestTicketsHudBleedChevronLeft{1..7}ShadowUpLeft_{pid}`
`ConquestTicketsHudBleedChevronLeft{1..7}ShadowUpRight_{pid}`
`ConquestTicketsHudBleedChevronLeft{1..7}ShadowDownRight_{pid}`
`ConquestTicketsHudBleedChevronLeft{1..7}ShadowDownLeft_{pid}`
`ConquestTicketsHudBleedChevronRight{1..7}ShadowRight_{pid}`
`ConquestTicketsHudBleedChevronRight{1..7}ShadowLeft_{pid}`
`ConquestTicketsHudBleedChevronRight{1..7}ShadowUp_{pid}`
`ConquestTicketsHudBleedChevronRight{1..7}ShadowDown_{pid}`
`ConquestTicketsHudBleedChevronRight{1..7}ShadowUpLeft_{pid}`
`ConquestTicketsHudBleedChevronRight{1..7}ShadowUpRight_{pid}`
`ConquestTicketsHudBleedChevronRight{1..7}ShadowDownRight_{pid}`
`ConquestTicketsHudBleedChevronRight{1..7}ShadowDownLeft_{pid}`

## Top Flag Row
`ConquestFlagsHudRoot_{pid}`
`ConquestFlagHudSlot_{pid}_{i}`
`ConquestFlagHudFill_{pid}_{i}`
`ConquestFlagHudBorder_{pid}_{i}`
`ConquestFlagHudLabelShadowRight_{pid}_{i}`
`ConquestFlagHudLabelShadowLeft_{pid}_{i}`
`ConquestFlagHudLabelShadowUp_{pid}_{i}`
`ConquestFlagHudLabelShadowDown_{pid}_{i}`
`ConquestFlagHudLabelShadowUpLeft_{pid}_{i}`
`ConquestFlagHudLabelShadowUpRight_{pid}_{i}`
`ConquestFlagHudLabelShadowDownRight_{pid}_{i}`
`ConquestFlagHudLabelShadowDownLeft_{pid}_{i}`
`ConquestFlagHudLabelShadowInner_{pid}_{i}`
`ConquestFlagHudLabelShadowInnerDeep_{pid}_{i}`
`ConquestFlagHudLabel_{pid}_{i}`
`ConquestFlagHudPercentRoot_{pid}_{i}`
`ConquestFlagHudPercentShadowRight_{pid}_{i}`
`ConquestFlagHudPercentShadowLeft_{pid}_{i}`
`ConquestFlagHudPercentShadowUp_{pid}_{i}`
`ConquestFlagHudPercentShadowDown_{pid}_{i}`
`ConquestFlagHudPercentShadowUpLeft_{pid}_{i}`
`ConquestFlagHudPercentShadowUpRight_{pid}_{i}`
`ConquestFlagHudPercentShadowDownRight_{pid}_{i}`
`ConquestFlagHudPercentShadowDownLeft_{pid}_{i}`
`ConquestFlagHudPercentShadowInner_{pid}_{i}`
`ConquestFlagHudPercentText_{pid}_{i}`

## Active Flag Popout
`ConquestFlagHudActivePopoutRoot_{pid}`
`ConquestFlagHudActivePopoutSlot_{pid}`
`ConquestFlagHudActivePopoutFill_{pid}`
`ConquestFlagHudActivePopoutBorder_{pid}`
`ConquestFlagHudActivePopoutLabelShadowRight_{pid}`
`ConquestFlagHudActivePopoutLabelShadowLeft_{pid}`
`ConquestFlagHudActivePopoutLabelShadowUp_{pid}`
`ConquestFlagHudActivePopoutLabelShadowDown_{pid}`
`ConquestFlagHudActivePopoutLabelShadowUpLeft_{pid}`
`ConquestFlagHudActivePopoutLabelShadowUpRight_{pid}`
`ConquestFlagHudActivePopoutLabelShadowDownRight_{pid}`
`ConquestFlagHudActivePopoutLabelShadowDownLeft_{pid}`
`ConquestFlagHudActivePopoutLabel_{pid}`
`ConquestFlagHudActivePopoutPercentRoot_{pid}`
`ConquestFlagHudActivePopoutPercentShadowRight_{pid}`
`ConquestFlagHudActivePopoutPercentShadowLeft_{pid}`
`ConquestFlagHudActivePopoutPercentShadowUp_{pid}`
`ConquestFlagHudActivePopoutPercentShadowDown_{pid}`
`ConquestFlagHudActivePopoutPercentShadowUpLeft_{pid}`
`ConquestFlagHudActivePopoutPercentShadowUpRight_{pid}`
`ConquestFlagHudActivePopoutPercentShadowDownRight_{pid}`
`ConquestFlagHudActivePopoutPercentShadowDownLeft_{pid}`
`ConquestFlagHudActivePopoutPercentShadowInner_{pid}`
`ConquestFlagHudActivePopoutPercentText_{pid}`

## Engage HUD
`ConquestFlagHudEngageRoot_{pid}`
`ConquestFlagHudEngageTrack_{pid}`
`ConquestFlagHudEngageFriendlyFill_{pid}`
`ConquestFlagHudEngageEnemyFill_{pid}`
`ConquestFlagHudEngageFriendlyCountBg_{pid}`
`ConquestFlagHudEngageEnemyCountBg_{pid}`
`ConquestFlagHudEngageFriendlyCountShadow_{pid}`
`ConquestFlagHudEngageEnemyCountShadow_{pid}`
`ConquestFlagHudEngageFriendlyCount_{pid}`
`ConquestFlagHudEngageEnemyCount_{pid}`
`ConquestFlagHudEngageStatusShadowRight_{pid}`
`ConquestFlagHudEngageStatusShadowLeft_{pid}`
`ConquestFlagHudEngageStatusShadowUp_{pid}`
`ConquestFlagHudEngageStatusShadowDown_{pid}`
`ConquestFlagHudEngageStatusShadowUpLeft_{pid}`
`ConquestFlagHudEngageStatusShadowUpRight_{pid}`
`ConquestFlagHudEngageStatusShadowDownRight_{pid}`
`ConquestFlagHudEngageStatusShadowDownLeft_{pid}`
`ConquestFlagHudEngageStatus_{pid}`

## 3-Flag Screenshot Slot Assumption
Assuming active flags are A/B/C and max row slots are 7, visible objectives are centered at indexes `2,3,4`.
That means screenshot top-row slots are expected to be:
`ConquestFlagHudSlot_{pid}_2`
`ConquestFlagHudSlot_{pid}_3`
`ConquestFlagHudSlot_{pid}_4`

## Target File Architecture
Move non-combat features out of `src/hud/build.ts`.

## File Size and Structure Guardrails
Hard limit: no new UI file should exceed 800 lines.

Soft targets:
1. Build modules: 250-500 lines each.
2. Render modules: 200-450 lines each.
3. Shared constants/types: under 300 lines each.
4. Lifecycle/orchestrator modules: under 400 lines.

If a file crosses 800 lines, split by concern immediately before adding new behavior.

## Files for Non-Combat Features
`src/ui/branding/top-left.ts`
`src/ui/admin/action-counter.ts`
`src/ui/ready/ready-line.ts`
`src/ui/dialog/ready-up-dialog.ts`
`src/ui/dialog/victory-dialog.ts`

## Files for Conquest Combat HUD
`src/ui/conquest/root.ts`
`src/ui/conquest/tickets-build.ts`
`src/ui/conquest/tickets-render.ts`
`src/ui/conquest/flags-build.ts`
`src/ui/conquest/flags-render.ts`
`src/ui/conquest/popout-render.ts`
`src/ui/conquest/engage-render.ts`
`src/ui/conquest/types.ts`
`src/ui/conquest/constants.ts`
`src/ui/conquest/lifecycle.ts`

## Helis Pattern Audit: Adopt vs Reject
This section compares Helis architecture patterns to the Conquest teardown plan.

Important framing:
Helis is reference-only for lifecycle/ownership ideas.
Helis file size and module shape are not a target architecture.

Patterns to adopt from Helis:
1. Per-PID widget naming and ownership (`..._${pid}` everywhere).
2. One HUD cache entry per PID (`State.hudCache.hudByPid[pid]` as single owner).
3. Build-once `ensureHudForPlayer(player)` lifecycle.
4. Explicit root creation with `TopCenter` anchoring for top-stack HUD.
5. Ephemeral UI strategy for rare panels: create on open, delete on close.

Patterns to reject from Helis for this Conquest rebuild:
1. Monolithic files (`hud.ts`, `ready-dialog.ts`) containing multiple unrelated systems.
2. Reparenting broad widget groups during routine ensure calls.
3. Runtime reposition writes in cached paths for static containers.
4. Name-based ownership recovery in hot render paths for core combat HUD widgets.
5. Mixed concerns where build, render, cleanup, and mode logic are interleaved in one file.

Helis conflicts with this plan (must not be copied):
1. `ensureTopHudRootForPid` in Helis reparents many widget groups each ensure pass.
2. Cached ensure path in Helis repositions help/ready/admin containers.
3. Helis relies heavily on runtime `safeFind` fallback rebinding after cache.
4. Helis uses large combined modules that obscure ownership boundaries.

Conquest implementation rule:
Only copy Helis ownership principles (PID scope + cache owner + lifecycle intent).
Do not copy Helis monolith structure or runtime reparent/reposition habits.

## Ownership and Lifecycle Model
1. `ensureHudForPlayer(pid)` builds exactly once per player and returns cached refs.
2. Render paths only read `refs` and write content/visibility.
3. `safeFind` is allowed as a crash-safety guard (null checks, defensive fallback), but not as normal ownership/placement authority in hot render loops.
4. Render paths do not reparent static roots or static children.
5. Reparenting is allowed only for intentional dynamic behavior (animation/effect-driven widget transitions).
6. Root positions are static after build.
7. Team swap lifecycle calls `hideHudForPid(pid)`, then `destroyHudForPid(pid)`, then `ensureHudForPlayer(pid)`, then resumes updates.

## Root Placement Contract
1. `TopHudRoot_{pid}` anchor is `TopCenter`, position `[0,0]`.
2. `ConquestCombatHudRoot_{pid}` anchor is `TopCenter`, position `[0, yTopStack]`.
3. `ConquestTicketsHudRoot_{pid}` anchor is `TopCenter`, position `[0, 0]` under combat root.
4. `ConquestFlagsHudRoot_{pid}` anchor is `TopCenter`, position `[0, 0]` under combat root.
5. Ticket and flag children use local coordinates only.
6. Dynamic objective count computes slot X positions once at round init.

## Animation and Dynamic Layout Rules
1. Allowed movement writes are only for bar fill animation and objective-count slot layout.
2. Popout show/hide is visibility-driven.
3. Engage show/hide is visibility-driven.
4. No root or parent movement during normal update loop.

## Teardown Scope for Legacy/Unused Paths
Remove these patterns from Conquest HUD code after new modules are wired:
1. `applyConquestAbsoluteLayout` path and centered lane roots.
2. `ConquestTicketsLaneRoot_{pid}` and `ConquestFlagsLaneRoot_{pid}`.
3. `ConquestTicketsDebugRoot_{pid}` and `ConquestFlagsDebugRoot_{pid}` aliases.
4. Per-frame `safeFind` fallback rebinding for core widgets.
5. Legacy purge logic for deprecated top-core containers after cutover.
6. Any duplicate root-parent normalization logic outside root build phase.

## Phased Implementation Plan
1. Create new module layout and types without behavior change.
2. Move Victory Dialog builder out of `src/hud/*` into `src/ui/dialog/victory-dialog.ts`.
3. Move Ready-up dialog and ready-line HUD out of `src/hud/*` into `src/ui/ready` and `src/ui/dialog`.
4. Move admin action counter and branding top-left builders into `src/ui/admin` and `src/ui/branding`.
5. Build new Conquest combat root and child builders in `src/ui/conquest/*`.
6. Wire one ensure path that builds roots once and stores refs once per PID.
7. Switch render loop to refs-only access with no core `safeFind` fallback.
8. Implement team-switch hide->rebuild->resume lifecycle path in one owner function.
9. Delete old `hud/build.ts` combat sections and dead helpers.
10. Keep `hud/build.ts` as thin orchestrator or remove it entirely if fully replaced.

## Verification Plan
1. Compile and dist build after each phase.
2. Verify unique PID widget ownership in multiplayer with 2+ players.
3. Validate aspect ratios `16:9`, `16:10`, `21:9`, `4:3`.
4. Validate top stack centerline against clock centerline.
5. Validate team swap hide->rebuild behavior has no duplicate HUD or stale widgets.
6. Validate no per-frame root movement through code audit and logging.

## Completion Definition
1. No Conquest combat UI logic remains in `src/hud/build.ts`.
2. Non-combat features are isolated in dedicated modules.
3. Conquest combat HUD has one centered root chain and refs-only rendering.
4. No legacy migration/schema/lane-root mechanisms remain.
5. Current screenshot target layout is reproducible across aspect ratios with identical center alignment.

## Implementation Status (2026-03-10)
Completed:
1. Non-combat builders split out of `src/hud/build.ts`:
`src/ui/branding/top-left.ts`, `src/ui/ready/ready-line.ts`, `src/ui/admin/action-counter.ts`, `src/ui/dialog/victory.ts`, `src/ui/dialog/victory-build.ts`.
2. HUD lifecycle helpers centralized in `src/ui/conquest/lifecycle.ts` and wired through `src/index.ts`.
3. Removed unused `applyConquestAbsoluteLayout` legacy block from `src/hud/build.ts`.
4. Root pinning now places `ConquestTicketsHudRoot_{pid}` and `ConquestFlagsHudRoot_{pid}` at `x=0` under `ConquestCombatHudRoot_{pid}`.
5. Ticket bleed chevrons now parent to `ConquestTicketsHudRoot_{pid}` using ticket-root-local coordinates.

Validated:
1. `npx tsc --noEmit` passes.
2. `npm run build` passes (existing `modlib` unresolved-import warning remains unchanged).
