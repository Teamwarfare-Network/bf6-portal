# Phase 3 HUD Design Plan

## Goal
Deliver the active-objective "pop-out" HUD experience in controlled phases, with strict regression protection for existing Conquest HUD fixes.

This plan explicitly avoids an all-at-once rollout.

## Implementation Status (2026-03-09)
- Phase 3A: implemented in code (`build.ts`, `hud-cache-types.ts`, `capture-tickets.ts`, `ui-layout.ts`), compile and verify passing.
- Phase 3B (first pass): implemented in code:
  - active slot muting when `engagedObjIdByPid` matches slot objective.
  - pop-out view-model derives from same authoritative slot visual state path (fill/percent parity).
- Phase 3C: implemented as layout-only coordinate change; engage container is now positioned directly below pop-out with fixed gap and no engage predicate changes.
- Phase 3D (first pass): implemented in code with single-writer slot render ownership:
  - border is shown only when objective visual phase is stable ownership with full-progress threshold.
  - border is hidden for neutral and all partial-progress states.
  - border color is the owning team bright color from viewer perspective.
- Manual in-game regression gate is required before Phase 3E polish finalization.

## References
- `bf6-portal/dev/conquest/reference_design_documentation/bf6_live_hud_examples/hud6.PNG`
- `bf6-portal/dev/conquest/reference_design_documentation/bf6_live_hud_examples/hud7.PNG`
- `bf6-portal/dev/conquest/reference_design_documentation/bf6_live_hud_examples/hud8.PNG`
- `bf6-portal/dev/conquest/reference_design_documentation/bf6_live_hud_examples/hud9.PNG`
- `bf6-portal/dev/conquest/reference_design_documentation/bf6_live_hud_examples/hud10.PNG`

## Current Known Risk
`CQ_Bug_3` is still open (post-team-swap engage HUD logic instability).  
Phase 3 work must not expand that blast radius.

## Required Behavior (Target UX)
1. When player is on an objective, that objective in the top row is visually muted/ghosted.
2. A larger active objective appears centered below the row.
3. The larger active objective mirrors base slot state logic (fill, color, percent, ownership/neutral states).
4. Soldier differential engage panel is displayed below the pop-out.
5. Leaving objective hides pop-out and engage panel; top row returns to normal.

## Non-Regression Contract (Must Hold)
Do not regress:
- `CQ_Bug_1`: ticket counter doubling
- `CQ_Bug_2`: neutral sliver fill artifact
- `CQ_Bug_4`: visible incremental rebuild after team swap
- `CQ_Bug_5`: team-swap crash
- `CQ_Bug_6`: chevron visibility/layer order

## Bug 3 Containment Rules (Mandatory During Phase 3)
1. Treat engage ownership state as read-only for this phase:
- Read from `State.conquest.capture.engagedObjIdByPid`
- Do not introduce new engage ownership maps.

2. Do not add area-trigger logic for engage ownership:
- `OnPlayerEnterAreaTrigger` / `OnPlayerExitAreaTrigger` are not objective-membership authority.

3. Do not add new swap suppression branches tied to engage visibility.

4. Keep single-writer ownership:
- Pop-out widgets are owned by one pop-out render path only.
- Existing engage widgets remain owned by engage render path only.

5. Any Phase 3 change that touches engage show/hide predicates must be isolated in its own commit and tested independently.

## APIs / State Used in This Plan
- Objective state and progression:
  - `mod.GetCurrentOwnerTeam(capturePoint)`
  - `mod.GetOwnerProgressTeam(capturePoint)`
  - `mod.GetCaptureProgress(capturePoint)`
  - `mod.GetPlayersOnPoint(capturePoint)` (counting only)
  - `OngoingCapturePoint`, `OnCapturePointLost`, `OnCapturePointCaptured`
- Current active objective:
  - `State.conquest.capture.engagedObjIdByPid[pid]`
- Ordered objective model:
  - `State.conquest.capture.mappedObjIdsInOrder`
  - per-point runtime + derived flag visual state

## Phased Implementation Approach

### Phase 3A: Pop-Out Foundation (No Behavior Change)
Purpose:
- Create widget scaffolding and view-model fields without changing existing engage visibility logic.

Implementation:
- Add pop-out widget group (root, square, fill, letter, percent) hidden by default.
- Extend HUD view model with `activeFlagPopout` payload:
  - `visible`
  - `objId`
  - `label`
  - `slotBgColor`
  - `fillVisible`, `fillHeight`, `fillColor`
  - `percentVisible`, `percentMessage`, `percentColor`
  - `labelColor`
- Render function writes pop-out widgets only.

Out of Scope:
- No border changes.
- No engage rule changes.
- No swap-flow logic changes.

Exit Criteria:
- Build compiles.
- With pop-out feature flag off (or hidden state), current HUD behavior is unchanged.

### Phase 3B: Active Flag Mirroring
Purpose:
- Populate pop-out from existing authoritative flag state and tie top-row active slot muting.

Implementation:
- Derive pop-out from same flag visual state used by top-row slot rendering.
- Add top-row "muted active slot" visual treatment when `engagedObjIdByPid` points to that slot.
- Keep objective percent and fill behavior mirrored exactly from base slot logic.

Out of Scope:
- No engage panel predicate changes.
- No border reintroduction yet.

Exit Criteria:
- Enter point: top-row active slot mutes + pop-out appears.
- Leave point: pop-out hides and top-row un-mutes.
- Fill/percent parity holds between top-row active slot and pop-out.

### Phase 3C: Engage Panel Reposition and Pairing
Purpose:
- Move soldier differential panel below pop-out and align layout cleanly.

Implementation:
- Reposition existing engage panel container only.
- Keep existing engage data and visibility ownership unchanged.
- Ensure z-order and spacing with clock/ticket/flag layers remain stable.

Out of Scope:
- No engage gating logic changes.
- No swap lifecycle logic changes.

Exit Criteria:
- Engage panel appears below pop-out when visible.
- No overlap with top-row flags or ticket bars.
- No flicker/duplicate layers.

### Phase 3D: Border Reintroduction (Optional, Post Gate)
Purpose:
- Reintroduce objective borders only after 3A-3C pass and regression suite is green.

Authoritative Border Rules:
1. Show border only at stable full ownership (`100%`).
2. Hide border for neutral and all partial-progress states.
3. Border color = owner bright team color.
4. Border write ownership is single-path render only (no lifecycle side writes).

Hard Gate Before Starting 3D:
- `CQ_Bug_3` not worsening compared to current deferred baseline.
- `CQ_Bug_1/2/4/5/6` still green.

### Phase 3E: Polish and Motion
Purpose:
- Final spacing/size polish and optional animation tuning.

Implementation:
- Fine-tune pop-out size/position against references.
- Fine-tune engage panel spacing below pop-out.
- Optional lightweight transitions (no state ownership changes).

## File-Level Implementation Plan
Primary files (expected):
- `src/index/capture-tickets.ts`
  - derive pop-out view-model slice
  - render pop-out owner
  - top-row active muting
- `src/hud/build.ts`
  - pop-out widget construction and cached refs
- `src/state/hud-cache-types.ts`
  - add pop-out widget refs
- `src/design_doc/phase3_hud_design.md`
  - keep execution notes updated as each phase lands

Secondary files (only if required):
- `src/foundation/ui-layout.ts` for positions/constants
- `src/Changelog.ts` for concise version notes

## Test Plan

### Test Strategy
Run phase-gated tests. Do not advance if current phase fails.

### Phase 3A Tests
1. Baseline round start: no visual behavior changes with pop-out inactive.
2. Team swap and respawn: no additional HUD artifacts introduced.
3. Existing fixed bugs smoke:
   - no ticket doubling
   - no neutral sliver
   - chevrons still visible

### Phase 3B Tests
1. Enter objective:
   - top-row active slot mutes
   - pop-out appears
2. Leave objective:
   - pop-out hides
   - top-row active slot restores
3. State parity checks:
   - neutral, capturing, neutralizing, owned all match expected colors/fill/percent behavior.

### Phase 3C Tests
1. Engage panel appears below pop-out.
2. No overlap with pop-out, flag row, ticket bars, or clock area.
3. Team swap:
   - no incremental reconstruction artifact beyond accepted baseline
   - no duplicate overlays

### Regression Suite (Run After Every Phase)
1. `CQ_Bug_1`: ticket counter no overlay/doubling during bleed.
2. `CQ_Bug_2`: no residual 1px fill sliver at neutral idle.
3. `CQ_Bug_4`: team-swap HUD rebuild visually coherent.
4. `CQ_Bug_5`: no crash on team switch.
5. `CQ_Bug_6`: chevrons visible, layered correctly, and stable after swap.
6. `CQ_Bug_3` tracking:
   - record whether behavior is unchanged, improved, or regressed.
   - if worsened, stop and rollback the phase changes.

## Execution Order
1. Implement and validate 3A.
2. Implement and validate 3B.
3. Implement and validate 3C.
4. Reassess `CQ_Bug_3` status and remaining risk.
5. Only then consider 3D border reintroduction.
6. Finish with 3E polish.

## Acceptance Criteria
1. Pop-out objective behavior matches references and required behavior list.
2. No regression in Bugs 1/2/4/5/6.
3. Bug 3 is not worsened by Phase 3 work.
4. HUD ownership remains single-writer and script-authoritative.
