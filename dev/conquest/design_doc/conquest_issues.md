# Conquest Issues

Last Updated: 2026-03-09  
Last Tested Build: `v0.278`

## Current Snapshot
- `CQ_Bug_1`: Fixed
- `CQ_Bug_2`: Fixed
- `CQ_Bug_3`: Open (deferred for now)
- `CQ_Bug_4`: Fixed enough for current phase
- `CQ_Bug_5`: Fixed
- `CQ_Bug_6`: Fixed
- `CQ_Bug_7`: Open

## CQ_Bug_1
Title: Ticket Counter Overlay / Doubling During Bleed

Observed:
- Ticket values overlapped during bleed updates (multiple values rendered at once).

Expected:
- Exactly one ticket value per side, always.

Status:
- Fixed and re-verified multiple times in this session.
- Known regressions were resolved by tightening HUD ownership/render paths.

Resolution Used:
- Single-pass per-player HUD render gating to prevent duplicate writes in the same render window.
- Swap-pending guardrails to avoid duplicate rebuild/repaint paths creating stacked counters.
- Consolidated Conquest HUD ownership so one path writes ticket counters.

## CQ_Bug_2
Title: Residual 1px Flag Fill Sliver After Neutralization

Observed:
- After neutralizing and leaving a flag, a tiny fill sliver could remain in the flag square.

Expected:
- At true neutral, fill must be fully hidden.

Status:
- Fixed and re-verified in this session.

Resolution Used:
- Neutral-state clamping on fill geometry to hard-clear near-zero residual pixels.
- Neutral idle render path forces no-fill state even when samples jitter near zero.

## CQ_Bug_3
Title: Post-Team-Swap Engage HUD Logic Failure

Current Observed Behavior:
- First team behavior works.
- After team swap and spawn, first valid neutralization/capture entry can fail to show Engage HUD (`Neutralizing`/soldier diff bar), even while player is on a real objective.
- Multiple variants were seen during iteration (false positive at spawn, first-entry miss, delayed appearance), but current blocking variant is first valid objective entry not showing.

Expected:
- Engage HUD appears only when player is actively on a mapped capture point and participating in capture/neutralization conditions.
- Engage HUD never appears outside that condition.

Status:
- Open.
- Deferred to unblock progress.

What Was Tried (Detailed, With Outcomes):
- Attempt A: swap suppression + confirmation gating (`engageSwapClearRequiredByPid`, confirm ticks, candidate maps).
  - Goal: block stale post-swap engage rows.
  - Outcome: unstable flip-flop behavior (fixed one variant, regressed another): either false engage at/after spawn or first valid objective entry suppressed.
- Attempt B: area-trigger-informed gating (main-base state influence).
  - Goal: suppress engage while in base / right after swap.
  - Outcome: unreliable for engage authority. Area triggers are not objective-membership truth and introduced false timing dependencies (base trigger transitions could still align with incorrect engage visibility windows).
- Attempt C: sync-pass `GetPlayersOnPoint` ownership for engage binding.
  - Goal: make one polling owner for `engagedObjIdByPid`.
  - Outcome: still vulnerable to transient sampling/order issues around swap/deploy; stale or mismatched samples could either attach wrong state or miss first valid attach.
- Attempt D: mismatch filtering (`GetPlayersOnPoint` sampled team vs live team).
  - Goal: reject old-team stale echoes.
  - Outcome: reduced some false positives but also dropped valid first post-swap samples in some sequences.
- Attempt E: direct capture-point event ownership (`OnPlayerEnterCapturePoint` / `OnPlayerExitCapturePoint`).
  - Goal: bind engage only from direct capture-point enter/exit APIs.
  - Outcome: improved signal quality but still not fully resolved in final repro due remaining lifecycle/order interactions with swap/deploy/render gating.
- Attempt F: deploy/swap clear-path adjustments (remove deploy-time clears, relax/adjust pending guards).
  - Goal: preserve first valid post-swap objective bind.
  - Outcome: did not fully resolve the repro; first post-swap neutralization can still fail to render engage panel.
- Attempt G: soldier count source hardening (live team preference, remove deployed-map filter in count path).
  - Goal: prevent engage hide due to transient zero friendly count.
  - Outcome: no durable fix for this specific repro.

Area Trigger Note (Important):
- Area triggers (`OnPlayerEnterAreaTrigger` / `OnPlayerExitAreaTrigger`) are valid for main-base/ready gating, but proved unreliable for engage ownership.
- Engage ownership must remain capture-point authoritative; area-trigger state should not be used as the primary source for engage show/hide decisions.

APIs / Signals Currently Used (Latest State):
- Engage ownership intent:
  - `OnPlayerEnterCapturePoint(eventPlayer, eventCapturePoint)`
  - `OnPlayerExitCapturePoint(eventPlayer, eventCapturePoint)`
  - Runtime map: `State.conquest.capture.engagedObjIdByPid`
- Capture state + soldier differential inputs:
  - `mod.GetPlayersOnPoint(capturePoint)` (counts only; not intended as primary engage-owner signal)
  - `mod.GetCurrentOwnerTeam(capturePoint)`
  - `mod.GetOwnerProgressTeam(capturePoint)`
  - `mod.GetCaptureProgress(capturePoint)`
  - `OngoingCapturePoint`, `OnCapturePointLost`, `OnCapturePointCaptured`
- Swap lifecycle controls involved in suppression/hide windows:
  - `State.conquest.debug.teamSwapHudResetPendingByPid`
  - `OnPlayerDeployed` release path
  - swap action path using `mod.SetTeam(...)` + forced undeploy/redeploy flow

Why Deferred:
- Despite repeated targeted changes, final repro remains: after team swap, first valid neutralization can still fail to show engage panel.
- Further attempts without instrumentation risk repeating regressions.

Recommended Next Pass (When Resumed):
- Add minimal internal transition tracing for one player across:
  - capture-point enter/exit callbacks
  - `engagedObjIdByPid`
  - `teamSwapHudResetPendingByPid`
  - engage view-model visibility decision
- Freeze one authoritative engage state machine and remove any remaining parallel eligibility checks.
- Validate with strict scripted test sequence focused only on swap -> first objective entry.

## CQ_Bug_4
Title: Team Swap HUD Rebuild Visibly Incremental

Observed:
- HUD could appear element-by-element after swap.

Expected:
- Swap redraw should appear as a cohesive state.

Status:
- Fixed enough for current phase based on latest user validation.

Resolution Used:
- Non-destructive swap reset/hide flow.
- Delayed authoritative redraw with pending gating to reduce visible incremental construction.

## CQ_Bug_5
Title: Team Swap Crash

Observed:
- Swap-time crash introduced during heavy HUD iteration.

Expected:
- No crash on team swap under any live HUD state.

Status:
- Fixed.

Resolution Used:
- Simplified swap HUD lifecycle and removed unstable overlapping refresh behavior.
- Hardened swap cleanup ordering to avoid conflicting redraw/update paths.

## CQ_Bug_6
Title: Ticket Bleed Chevrons Not Visible

Observed:
- Chevrons missing or hidden until later lifecycle events.

Expected:
- Chevrons visible immediately when bleed differential applies.

Status:
- Fixed in latest user validation.

Resolution Used:
- Enforced render/layer order and swap lifecycle hide/recovery behavior.
- Stabilized first-life visibility and rebuild ordering for chevron refs.

## CQ_Bug_7
Title: Top Row Flag Border Persists While Pop-Out Is Visible

Observed:
- During active objective pop-out display, top-row flag border color can remain visible.

Expected:
- When pop-out is visible, there should be no top-row border on the active slot.
- Active objective status should be represented by the pop-out only.

Status:
- Open.

Notes:
- This is a UI ownership/presentation rule issue for the active objective lane.
