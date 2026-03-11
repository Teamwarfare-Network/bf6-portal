# Conquest Issues

Last Updated: 2026-03-10  
Last Tested Build: `v0.391`

## Current Snapshot
- `CQ_Bug_1`: Fixed
- `CQ_Bug_2`: Fixed
- `CQ_Bug_3`: Open (deferred for now)
- `CQ_Bug_4`: Fixed enough for current phase
- `CQ_Bug_5`: Fixed
- `CQ_Bug_6`: Fixed
- `CQ_Bug_7`: Resolved
- `CQ_Bug_8`: Resolved
- `CQ_Bug_9`: Open

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
- Resolved in latest user validation.

Potential Resolution Drivers:
- Active top-row slot neutralization when `engagedObjIdByPid` matches slot objective (border/fill/label/percent hidden on active slot projection).
- Active-slot border suppression in slot renderer (`suppressActiveBorder`) so the engaged top-row slot cannot render a border while pop-out is active.
- Force-hide hardening for top-row/pop-out/engage with cache rebind via name fallback (`safeFind`) to prevent stale border refs surviving swap/rebuild paths.

## CQ_Bug_8
Title: Intermittent Flag Differential Stall During Neutralization/Recapture Transition

Observed:
- In some neutralization/recapture transition windows, objective ownership differential can present as stale for bleed/chevron projection.
- Repro observed where enemy held only one objective while other previously-owned objectives were neutralized, but bleed/chevron did not immediately reflect differential.
- Behavior sometimes self-corrected after subsequent capture interaction.

Expected:
- Differential, bleed, and chevrons should update coherently at neutralization/recapture edges without requiring additional interaction.

Status:
- Resolved in latest user validation (keep monitoring for recurrence during high-transition rounds).

Potential Resolution Drivers:
- Differential ownership counting remains capture-state authoritative (`capture.byObjId.ownerTeam`).
- Authoritative owner resolver now includes pre-event edge inference for strong neutralization/recapture thresholds when edge callbacks are missed, so owner differential cannot stall until a later interaction.

## CQ_Bug_9
Title: Cross-Player HUD Clash / Double Draw

Observed:
- In multiplayer sessions, HUD elements can redraw/clash across players.
- Some HUD lanes appear to behave like shared/global UI instead of strict per-player ownership.
- Aspect-ratio alignment issues became harder to isolate due to mixed HUD ownership and repeated root rewrites.

Expected:
- Every Conquest HUD widget is unique per player and PID-scoped.
- No gameplay HUD widget is shared globally across players.
- Top combat HUD uses one deterministic centered root chain across aspect ratios.

Status:
- Open.

Scope/Intent:
- Align Conquest HUD lifecycle to Helis pattern:
  1. Frequent HUD widgets are pre-created once per player and toggled.
  2. Rare/ephemeral widgets are create-on-demand + delete-on-close.
  3. Team switch is hide-first, clean rebuild, then resume updates.

Current Workstream:
- Simplification pass started to remove competing runtime layout owners and reduce HUD migration churn in live tick paths.
- Added cached-root PID ownership guardrails in HUD bootstrap to prevent stale/shared ref collisions from surviving cache reuse.
- Removed schema-coupled live HUD bootstrap checks from the Conquest tick loop; HUD bootstrap is now cache/critical-ref driven.
- Added strict PID ownership validation for critical HUD refs before render, forcing per-player rebuild on ownership mismatch.
- Removed cached-path per-refresh layout rewrite calls (legacy purge/reposition churn) so HUD roots stay in their authored centered positions.
- Restored teardown root contract: `TopHudRoot_{pid} -> ConquestCombatHudRoot_{pid} -> ConquestTicketsHudRoot_{pid}/ConquestFlagsHudRoot_{pid}`.
- Removed render-loop layout revision rebuild logic; rebuild authority is back to `ensureHudForPlayer()` lifecycle ownership only.
- Tightened critical-ref parent validation to named parent-chain checks (combat root under top root; ticket/flag roots under combat root).
- Regression check pending in-game: confirm ready-dialog open path and triple-tap interact flow after the root-chain rebuild pass.
- End-to-end trace finding: startup + live loop + capture-event forced refresh all route through `ensureHudForPlayer()`; root placement failure was in build path silently returning refs even when pinning failed.
- Hardening applied: `ParseUI` return handles are now used for TopHud/Combat root creation; combat root pin success is now mandatory before returning refs.
- Visual leak guard applied: combat tickets/flags roots now build hidden and are only revealed by render owner after successful ensure.
- Additional root-cause refinement: duplicate-name `TopHudRoot_{pid}` instances could survive and still satisfy name-based parent checks, producing intermittent top-left/flicker behavior.
- Additional hardening applied: `ensureTopHudRootForPid()` now performs one-time per-runtime duplicate purge for `TopHudRoot_{pid}` before creation, and combat-root chain validation now requires direct parent-handle identity (not name-only checks).
- Hot-path root drift found in render owner: ticket counter renderer was still resolving by `safeFind(...)` and reparenting core counter widgets during normal updates, which could override build-time parent ownership.
- Hot-path hardening applied: ticket counter renderer is now refs-only for core counter widgets (no runtime parent rebinding), and critical-ref validation in `capture-tickets.ts` now enforces parent-handle identity for `TopHudRoot -> CombatRoot -> Tickets/Flags`.
- Cached-root drift found in ensure lifecycle: cached combat roots were still being rehydrated by name (`safeFind`) in `hud-build.ts`, allowing wrong duplicate handle selection despite valid cache objects.
- Lifecycle hardening applied: cache path now requires authoritative cached root handles (`topHudRoot`, `conquestCombatRoot`, tickets root, flags root) and no longer hydrates core roots by name; invalid/missing handles force a teardown rebuild.
- Combat-root duplicate hardening applied: `ConquestCombatHudRoot_{pid}` now gets one-time duplicate-name purge before first ensure per PID, with init-token reset on hard reset/leave cleanup.
- Critical-ref geometry hole found: live critical checks could still pass a top-left chain when parent handles were correct but anchors/positions were wrong.
- Geometry gate applied: critical checks now require centered anchor+position for `TopHudRoot`, `ConquestCombatHudRoot`, `ConquestTicketsHudRoot`, and `ConquestFlagsHudRoot`; failing geometry now forces teardown rebuild before render.
- Root-subtree ref drift found: global name lookups (`safeFind`) could still bind gameplay refs to off-root same-name widgets even when the centered root chain was valid.
- Ref-owner hardening applied: after centered root pin, gameplay refs are now rebound via subtree-scoped lookup (`FindUIWidgetWithName(name, ticketsRoot/flagsRoot)`) so runtime paths cannot target off-root duplicates.
- Critical-ref ownership expanded: validation now requires ticket container/bar parent contracts and flag slot/engage/popout parent contracts, forcing immediate teardown rebuild on any off-root handle selection.
