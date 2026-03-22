# Conquest Issues

Last Updated: 2026-03-22  
Last Tested Build: `v0.763` (fresh in-air aircraft birth-spawn path cleaned up; latest hardening pass routes the remaining ready-dialog/shared HUD label refresh paths through safe text setters while `CQ_Bug_18` / `CQ_Bug_19` stay under investigation)

## Current Snapshot
- `CQ_Bug_1`: Resolved
- `CQ_Bug_2`: Resolved
- `CQ_Bug_3`: Open (deferred for now)
- `CQ_Bug_4`: Resolved
- `CQ_Bug_5`: Resolved
- `CQ_Bug_6`: Resolved
- `CQ_Bug_7`: Resolved
- `CQ_Bug_8`: Resolved
- `CQ_Bug_9`: Resolved
- `CQ_Bug_10`: Resolved
- `CQ_Bug_11`: Resolved
- `CQ_Bug_12`: Resolved
- `CQ_Bug_13`: Resolved
- `CQ_Bug_14`: Resolved
- `CQ_Bug_15`: Resolved
- `CQ_Bug_16`: Open (deferred polish)
- `CQ_Bug_17`: Open (deferred polish)
- `CQ_Bug_18`: Open (deferred investigation)
- `CQ_Bug_19`: Open (deferred investigation)

## CQ_Bug_19
Title: Late-Match Multiplayer Deploy Buttons Disappear / Script Appears To Degrade

Observed:
- In multiplayer, at some indeterminate later point in a match, roughly `5-10` minutes in, the `GROUND DEPLOY` and `AIR DEPLOY` buttons stopped appearing.
- At the same time, the broader script behavior appeared to degrade or partially stop working, not just the button visuals.
- The only runtime errors noticed during that failure window were the same already-known spam errors currently tracked under `CQ_Bug_18`.
- This has not yet been isolated to:
  - admin panel usage
  - debug position visibility
  - one specific vehicle class
  - one specific deploy mode

Expected:
- The right-side vehicle deploy HUD should continue rendering `GROUND DEPLOY` / `AIR DEPLOY` buttons reliably for the full duration of a multiplayer match.
- The script should not enter a degraded mid-match state where vehicle deploy affordances disappear after several minutes of runtime.

Current Accepted Behavior:
- This is a newly tracked deferred bug.
- It is not yet isolated enough to block the current jet pitch investigation, but it is a serious stability item because it suggests a longer-session lifecycle failure rather than a one-off UI glitch.

Status:
- Open.
- Active investigation candidate after the current aircraft cleanup pass.

Current Best Read:
- This may be a secondary symptom of the same unresolved runtime/log-spam problem tracked in `CQ_Bug_18`, rather than a fully separate deploy-button-only issue.
- The strongest current suspicion is:
  - a longer-session lifecycle/cache invalidation problem in the right-side vehicle HUD or a shared ready/admin/HUD refresh path
  - with the visible loss of `GROUND DEPLOY` / `AIR DEPLOY` buttons being one downstream symptom once the mode enters that bad state

Latest Findings (2026-03-22):
- The failure is broader than "buttons disappear."
- Reported variants now include:
  - buttons do not render at all
  - buttons render but are not clickable
  - the script feels partially unresponsive once the bad state starts
- There is still no clean repro sequence yet.
- Current suspicion remains that this is a broader runtime degradation, not just a button-widget visibility issue.

Recommended Later Investigation:
- Reproduce in multiplayer from a fresh round and note:
  - time elapsed when buttons first disappear
  - whether the buttons are fully missing or present-but-dead
  - whether the right-side vehicle rows are still present but missing only the buttons
  - whether reservations / slot ownership continue updating correctly underneath
  - whether the ready dialog had been opened earlier in the session
  - whether admin panel or debug panel had been used earlier in the session
- Correlate the failure window with `CQ_Bug_18` runtime spam and treat both as likely connected unless evidence later proves otherwise.
- Add explicit diagnosis targets in the next pass:
  - whether the right-side deploy HUD root/container still exists
  - whether the button widgets still exist and remain visible
  - whether UI input is still enabled for the local player
  - whether the click handler path is still receiving events once the bad state begins

## CQ_Bug_18
Title: Ready-Dialog / Admin-Adjacent Runtime Log Spam

Observed:
- Runtime log spam can begin once the ready dialog has been opened.
- Earlier testing suggested the issue only appeared after opening the admin panel, but later testing reproduced it without opening the admin panel at all.
- The latest reports indicate:
  - ready dialog open is sufficient to enter the bad state
  - admin panel can still open successfully
  - debug position visibility is not required to trigger the issue
- Error classes seen repeatedly during this investigation include:
  - `GETVEHICLEFROMPLAYER`
  - `GETPLAYERVEHICLESEAT`
  - `SETUITEXTLABEL`

Expected:
- Opening the ready dialog should not put the UI/runtime into a state that begins recurring engine/log errors.
- Admin panel open, close, and debug tools should remain silent in logs unless a true exceptional condition occurs.

Current Accepted Behavior:
- This is a known deferred runtime-noise issue and is not currently blocking broader mode testing.
- Core user-facing behavior remains usable enough for the current checkpoint:
  - ready dialog works
  - admin panel opens
  - debug panel can be opened
  - aircraft air deploy remains stable in position

Status:
- Open.
- Active investigation candidate after the aircraft cleanup pass.

Latest Findings (v0.727-v0.732):
- The issue is no longer treated as admin-only.
- Multiple hardening passes already reduced or removed some obvious risky paths:
  - safe wrappers added around player->vehicle and player->seat reads
  - position debug sampling stopped falling back into risky player-object sampling while in vehicle
  - admin-panel toggle/build paths were moved onto safe UI wrappers
  - the right-side vehicle HUD owner-name path no longer scans all players with player->vehicle / seat engine queries and instead uses tracked `slot.activeOwnerPid`
- Despite those mitigations, the same class of log spam still appears after the ready dialog has been opened, which means at least one remaining caller is still being reached outside the already-fixed hot paths.

Current Best Read:
- The remaining issue is likely a ready-dialog-adjacent lifecycle/readback path rather than a pure admin-panel bug.
- The strongest unresolved candidates are:
  - a remaining UI label/visibility write against a stale widget handle after ready-dialog lifecycle transitions
  - a remaining player/vehicle state probe that still executes after ready-dialog/open HUD refreshes
  - a shared refresh path that is only exercised once the ready-dialog/admin family has been built at least once

Latest Findings (2026-03-22):
- The error log still begins spamming after opening the ready dialog.
- This is still reproducible without relying on the admin panel.
- The deploy-button degradation in `CQ_Bug_19` may be a later downstream symptom of the same unresolved runtime problem once enough log/error churn accumulates.
- `v0.763` removed the remaining direct `SetUITextLabel(...)` refresh writes from the ready-dialog/shared HUD hot paths and routed them through `safeSetUITextLabel(...)` instead.
- If spam persists after `v0.763`, the remaining likely source narrows further toward:
  - player->vehicle / seat readback timing inside the safe wrappers themselves
  - or another non-label ready-dialog/open lifecycle call that is still stale-widget-sensitive

Recommended Later Investigation:
- Reproduce from a fresh round with strict sequence logging:
  - fresh join
  - open ready dialog only
  - note exact first frame/tick when log spam begins
  - then separately open admin panel and debug panel
- Correlate the live log text against the remaining ready-dialog/admin refresh call sites instead of broader sweep hardening.
- Treat this as a dedicated runtime-error isolation pass, separate from aircraft pitch-down prototyping.
- Add one focused pass on the ready-dialog/open path itself:
  - widget build
  - widget reveal
  - ready-dialog refresh
  - right-side deploy HUD refresh
  - any player->vehicle / seat probes triggered from that same open path
- Re-test specifically on `v0.763` and note whether:
  - `SETUITEXTLABEL` spam is fully gone
  - only `GETVEHICLEFROMPLAYER` / `GETPLAYERVEHICLESEAT` remain
  - `CQ_Bug_19` still reproduces after a longer multiplayer session

## CQ_Bug_17
Title: Marauder Ground Spawn Fails To Seat Player Reliably

Observed:
- Ground spawning into Marauders is still failing.
- The transport may spawn, but the player does not reliably end up seated through the current ground-spawn path.

Expected:
- Selecting `GROUND DEPLOY` for a Marauder should consistently spawn the vehicle and place the player into a valid seat in one step.

Current Accepted Behavior:
- Other ground transports are considered functional enough for the current checkpoint.
- Marauder ground deploy remains a known deferred bug and should not be treated as solved.

Status:
- Open.
- Deferred to later polish.

Recommended Later Polish:
- Re-evaluate the Marauder-specific spawn-to-seat flow separately from lighter fast movers.
- Confirm whether the failure is:
  - seat forcing
  - spawn transform/clearance
  - vehicle-ready timing after spawn
- Validate both Team 1 and Team 2 Marauder variants after the transport polish pass.

## CQ_Bug_16
Title: Enemy Terminal Flag VO Only Reliable While Recipient Remains On Objective

Observed:
- In multiplayer testing, `ObjectiveContested` now comes through correctly.
- `ObjectiveCaptured` also appears to come through correctly.
- The enemy-side terminal VO is only reliably heard if the losing player remains on the objective when the loss completes.
- If that player leaves the objective even shortly before the loss completes, the enemy terminal VO may not play.

Expected:
- If later polish keeps the intended recent-objective grace behavior, the losing player should still be eligible to hear the enemy terminal VO for a short window after leaving the flag.

Current Accepted Behavior:
- For the current accepted checkpoint, flag VO is considered functional if:
  - `ObjectiveContested` works
  - `ObjectiveCaptured` works
  - enemy terminal VO is heard while the recipient remains on the flag
- Broader terminal grace after leaving the point is deferred as polish work, not a current blocker.

Status:
- Open.
- Deferred to later polish.

Latest Findings (v0.527-v0.528):
- Per-player VO handles fixed contested-delivery behavior that previously only reached one recipient.
- Swapping the enemy terminal default from `ObjectiveLost` to `ObjectiveCapturedEnemy` improved enemy-side playback behavior, but recent-leave terminal eligibility still does not fully match the intended grace model.

Recommended Later Polish:
- Revisit terminal-recipient eligibility after leaving the point.
- Decide whether the intended design should remain:
  - strict on-point-only terminal VO
  - or short recent-objective grace for terminal VO
- If grace remains desired, re-test and tune the recent-objective eligibility model specifically for enemy terminal events.

## CQ_Bug_15
Title: Final-Minute Clock Can Disappear Instead Of Brief Flicker

Observed:
- Under `1:00`, the match clock can fully disappear before `00:00` instead of only briefly blinking.

Expected:
- The clock remains visible most of the time in the final minute, with only a short off-blip once per second.

Status:
- Resolved at current accepted checkpoint.

Latest Mitigation (v0.506):
- Removed `updateAllPlayersClock()` dependence on the per-player derived HUD clock cache and switched the clock renderer to the authoritative round-clock state.
- This removes one stale intermediate state layer from the final-minute visibility/color path.

Latest Mitigation (v0.507):
- Replaced modulo-phase clock flicker with an explicit once-per-second hide window so the final-minute flash cannot remain stuck hidden due to runtime timing drift.

Latest Mitigation (v0.508):
- Removed final-minute visibility flicker entirely and replaced it with a red/white text color pulse so the clock never hides between `1:00` and `00:00`.

Latest Mitigation (v0.509):
- Slowed the final-minute color pulse to one full color state per second so it reads in the same cadence as the second-boundary timer updates.

Latest Mitigation (v0.510):
- Removed elapsed-time-based pulse phasing and tied the final-minute red/white toggle directly to the displayed remaining second so the alert color stays visually consistent.

## CQ_Bug_14
Title: Engage HUD Stale After Player Death On Objective

Observed:
- When a player contests a flag and then dies, the custom engage UI can keep stale counts and/or active-objective ownership.
- Engine capture behavior continues correctly, but the custom engage HUD can lag behind the death state.

Expected:
- Dead/man-down players should be treated the same as leaving the objective for engage-count and active-popout ownership purposes.

Status:
- Resolved at current accepted checkpoint.

Latest Mitigation (v0.495):
- Added alive-only filtering for `GetPlayersOnPoint()` projection using soldier-state authority.
- Added subtick cleanup to clear engaged-objective ownership for dead/invalid/undeployed players even if exit callbacks lag.

## CQ_Bug_12
Title: Startup/Team-Swap HUD + Ready Dialog Latency

Observed:
- On first spawn and after team swap, combat HUD and Ready dialog can appear after a long delay.
- Ready dialog first open can visibly itemize through elements before becoming interactive.

Expected:
- HUD and Ready dialog should become responsive quickly and appear in one cohesive reveal.

Status:
- Resolved at current accepted checkpoint.

Latest Mitigation (v0.488-v0.489):
- Core runtime critical-ref validation reduced from every frame to periodic sampling to cut UI thread pressure.
- Core-mode legacy suppression changed to one-shot gating (not every forced refresh).
- Ready dialog first-build switched to hidden build then reveal-at-end to reduce itemized visual construction.
- Deferred join/deploy warm-cache prebuild restored so first real open can use cached dialog widgets instead of constructing live.

## CQ_Bug_13
Title: Intermittent Mid-Round Combat HUD Disappear

Observed:
- Combat tickets/flags lane can disappear briefly during live play.
- Repro reported both shortly after swap/capture activity and while stationary defending a flag.

Expected:
- Core combat HUD remains continuously visible when live and not swap-pending.

Status:
- Resolved at current accepted checkpoint.

Latest Mitigation (v0.491):
- Core runtime validation remains periodic but now advisory-only (no destructive recover on validation readback drift).
- Core fail-safe path no longer hides all combat HUD widgets on transient uncaught errors; it now resets scheduler cadence only.

## CQ_Bug_1
Title: Ticket Counter Overlay / Doubling During Bleed

Observed:
- Ticket values overlapped during bleed updates (multiple values rendered at once).

Expected:
- Exactly one ticket value per side, always.

Status:
- Resolved and re-verified multiple times in this session.
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
- Resolved and re-verified in this session.

Resolution Used:
- Neutral-state clamping on fill geometry to hard-clear near-zero residual pixels.
- Neutral idle render path forces no-fill state even when samples jitter near zero.

## CQ_Bug_3
Title: Post-Team-Swap Engage HUD Logic Failure

Current Observed Behavior:
- First team behavior works.
- After team swap and spawn, first valid neutralization/capture entry can fail to show Engage HUD (`Neutralizing`/soldier diff bar), even while player is on a real objective.
- Multiple variants were seen during iteration (false positive at spawn, first-entry miss, delayed appearance), but current blocking variant is first valid objective entry not showing.
- Repro refinement:
  - If the player was actively contesting Flag A in the previous life, then swaps teams, the first later attempt to neutralize Flag A is where the bug reproduces.
  - If that same player instead goes to neutralize Flag B or Flag C first, the bug does not reproduce there.
  - The failure is tied to the first neutralization of the last actively contested objective from the previous life, not to the immediate post-swap window in general.

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

Working Hypothesis (Updated):
- This now looks less like a general post-swap timing failure and more like stale objective-specific engage state surviving across death/team-switch boundaries.
- The likely missing cleanup is for "last contested objective by this player" when the player changes team without receiving a fully authoritative objective-leave path for that prior-life objective.
- Future fix attempt should explicitly test/clear engaged-objective state on team switch itself, not only on deploy/undeploy/death and capture-point enter/exit.

Why Deferred:
- Despite repeated targeted changes, final repro remains: after team swap, first valid neutralization can still fail to show engage panel.
- Further attempts without instrumentation risk repeating regressions.

Recommended Next Pass (When Resumed):
- Add minimal internal transition tracing for one player across:
  - capture-point enter/exit callbacks
  - `engagedObjIdByPid`
  - `teamSwapHudResetPendingByPid`
  - player team value before/after swap
  - engage view-model visibility decision
- Add objective-specific tracing for "last contested objective before death/swap" versus "first objective entered after swap".
- Freeze one authoritative engage state machine and remove any remaining parallel eligibility checks.
- Validate with strict scripted test sequence focused on:
  - contest Flag A -> die or swap -> neutralize Flag A first
  - contest Flag A -> die or swap -> neutralize Flag B first

## CQ_Bug_4
Title: Team Swap HUD Rebuild Visibly Incremental

Observed:
- HUD could appear element-by-element after swap.

Expected:
- Swap redraw should appear as a cohesive state.

Status:
- Resolved at current accepted checkpoint.

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
- Resolved.

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
- Resolved in latest user validation.

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
- Resolved at current accepted checkpoint.

Scope/Intent:
- Align Conquest HUD lifecycle to Helis pattern:
  1. Frequent HUD widgets are pre-created once per player and toggled.
  2. Rare/ephemeral widgets are create-on-demand + delete-on-close.
  3. Team switch is hide-first, clean rebuild, then resume updates.

Current Workstream:
- Simplification pass started to remove competing runtime layout owners and reduce HUD migration churn in live tick paths.
- Positioning pass (v0.429): added a dedicated hud-core top-stack Y offset so tickets/flags/progress bars render below the match clock lane while pop-out/engage preserve relative ordering.
- Positioning refinement (v0.430): increased hud-core top-stack offset and normalized ticket counter/slash row Y alignment to improve bar/counter lane cohesion.
- Parity refinement (v0.432): core ticket leader team now resolves from live ticket state (restores lead border/crown visibility in core mode), engage count chips now render with dark background fill, and core chevrons are static-visible (no pulse-hide index).
- Positioning refinement (v0.433): moved ticket counter row down toward bar lane, tied crown Y to counter row, and lowered pop-out lane (engage remains chained beneath pop-out).
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
- Latest regression evidence (2026-03-11):
  - `reference_design_documentation/testing_images/current_testing2.PNG` shows top combat lane collapse/off-center behavior after enabling combat owner `v2`, while ready/triple-tap flows remain functional.
- Code-trace findings (2026-03-11):
  - `src/config/conquest-constants.ts` now sets `CONQUEST_COMBAT_RENDER_OWNER = "v2"`.
  - `src/index/capture-tickets.ts` returns early to the v2 owner path and bypasses legacy combat-lane critical-ref geometry validation.
  - `src/ui/conquest/combat-v2/render.ts` critical-ref gate currently checks handle presence only (no parent-chain/anchor/position validation).
  - `src/ui/conquest/combat-v2/build.ts` uses `safeFind(name)` first and does not perform duplicate-name purge or subtree ownership validation before reuse.
  - `src/ui/conquest/combat-v2/lifecycle.ts` `resetAllConquestCombatHudV2()` only destroys entries present in v2 cache; stale same-name widgets can survive when runtime/cache state is reset by crash/reload.
- Immediate containment plan:
  1. Add v2 root-chain validation (parent handle + anchor + position geometry) and fail-close rebuild.
  2. Add one-time duplicate purge for v2 root chain per PID before first ensure.
  3. Add startup hard-purge of v2 widget names for active players before first v2 render pass.
- Additional regression evidence (2026-03-11):
  - `reference_design_documentation/testing_images/current_testing3.PNG` still shows legacy-style left-aligned combat lane fragments while centered v2 lane is expected.
- Additional root-cause finding (2026-03-11):
  - `src/ui/conquest/hud-build.ts` still built legacy combat roots/widgets during `ensureHudForPlayer()` even when combat owner was `v2` (`combatHudEnabled === false`).
  - This allowed legacy combat artifacts to survive/render in mixed-owner sessions and visually mask v2 ownership behavior.
- Mitigation applied (2026-03-11):
  - Legacy combat build block in `ensureHudForPlayer()` is now gated by `combatHudEnabled`; when owner is `v2`, legacy combat roots are not built and only non-combat HUD lanes remain.
- Architecture cutover requirement (2026-03-11):
  - Mixed-owner regressions confirm containment patches are insufficient as a long-term strategy.
  - Hard-cut replacement plan is now preserved in `design_doc/TWL_Conquest_Design.md` (Phase 3 HUD/UI reference + Phase 3C cleanup closeout) with:
    - all-new `twlConquestHud*` function namespace,
    - all-new `TwlConquestHud_*` widget naming contract,
    - runtime mode toggle (`off` / `legacy` / `core`),
    - explicit ban on legacy combat function/name reuse in `core` mode.
- Hard-cut implementation kickoff (2026-03-11):
  - Added new isolated combat HUD pipeline under `src/ui/conquest/hud-core/*` with all-new names (`TwlConquestHud_*`) and all-new function chain (`twlConquestHud*`).
  - Added runtime mode gate in `src/config/conquest-constants.ts` (`getConquestHudMode/setConquestHudMode`, default `core`) and routed combat update owner to new pipeline when mode is `core`.
  - Legacy combat build path in `ensureHudForPlayer()` now only builds when mode is `legacy`.
  - Immediate validation target: verify centered placement of `TwlConquestHud` ticket/objective lanes before expanding feature parity.
- Additional runtime-coupling finding (2026-03-11):
  - HUD-core forced tick could throw during startup/live HUD refresh and abort upstream mode flow, which can prevent vehicle spawner startup and core match-loop continuity.
- Mitigation applied (2026-03-11):
  - Added HUD-core fail-safe guards to auto-disable HUD-core mode (`off`) on runtime fault without terminating gameplay loops.
  - Moved vehicle-spawner backend startup earlier in `onGameModeStartedImpl` so vehicle systems are not blocked by optional HUD warmup.
- Root-cause isolated (2026-03-11):
  - New combat HUD paths (`hud-core` and `combat-v2`) referenced `mod.stringkeys.twl.hud.clock.slash`, but slash is defined at `mod.stringkeys.twl.system.slash` in `src/strings.json`.
  - This key mismatch can fault ticket-lane slash label writes and trigger fail-safe mode-off behavior (no combat HUD visible).
- Fix applied (2026-03-11):
  - Replaced slash key usage with `mod.stringkeys.twl.system.slash` in new combat HUD build/render paths.
  - Reset `State.conquest.debug.hudModeOverride` during startup scaffold so prior fail-safe `off` latches do not persist across restarts.
- Runtime-visibility hardening (2026-03-11):
  - In `hud-core` tick, strict ref validation is now advisory (single cold-start recovery attempt, then fail-open render) to prevent a false-negative validator from suppressing all combat HUD visibility.
- Additional no-HUD regression finding (2026-03-11):
  - `hud-core` had hard fail-close behavior in startup/live catches that set `hudModeOverride` to `"off"` on any uncaught exception; a single transient fault could leave combat HUD permanently hidden for the session.
- Mitigation applied (2026-03-11):
  - Converted HUD-core fail handling to soft-fail (hide/reset only, do not auto-switch mode to `"off"`), so core can recover on subsequent ticks.
  - Reduced HUD-core palette dependency risk by sourcing vectors from existing `CONQUEST_HUD_*_RGB`/shared HUD constants in `ui-layout`, avoiding extra cross-module vector alias coupling.
- Additional root-acquisition finding (2026-03-12):
  - `hud-core` root build path depends on `ensureTopHudRootForPid(...)`; strict post-normalization parent-handle identity checks in that helper could return `undefined` even when UI was otherwise valid, suppressing all core combat HUD creation.
- Mitigation applied (2026-03-12):
  - Relaxed `ensureTopHudRootForPid(...)` post-normalization verification to best-effort (anchor/position correction without fatal parent-handle identity rejection).
  - Added `TopHudRoot_{pid}` name-fallback resolution in `hud-core/build.ts` before aborting root creation.
- Additional visual-parity finding (2026-03-12):
  - New `hud-core` surfaces were created as `bgFill: None`, and several visual lanes retained zero background alpha, which produced text-only rendering (ticket numbers/labels visible while bars/slot/panel surfaces looked missing).
- Mitigation applied (2026-03-12):
  - Applied explicit `Solid` fill + authored alpha to `hud-core` ticket bars, objective slot/fill surfaces, active-popout slot/fill surfaces, and engage track/fill surfaces.
- Additional parity + flicker finding (2026-03-12):
  - `hud-core` ticket lane spacing had drifted from the legacy geometry contract (simplified fixed X positions), and live capture-state sampling was second-boundary driven, producing synchronized engage/count strobing with the clock cadence.
- Mitigation applied (2026-03-12):
  - Restored legacy ticket/center-gap spacing formulas in `hud-core` constants for parity with the prior approved HUD look.
  - Moved live capture-state sync onto the sub-second main loop cadence so dynamic engage/count data updates no longer pulse only on second boundaries.
- Additional flicker root-cause refinement (2026-03-12):
  - `hud-core` runtime fail-safe hid all combat widgets globally when any single per-player frame update faulted, which could present as periodic full-lane blinking.
  - Engine-sync pass zeroed per-objective on-point counts before each sample; transient `GetCapturePoint` misses could briefly drive engage counts to zero and then restore on the next sample.
- Mitigation applied (2026-03-12):
  - Converted `hud-core` runtime fault handling to per-player recovery first, with scheduler-only soft reset on outer faults (no global hide pulse).
  - Added on-point sample grace in capture sync: retain last counts through short engine-miss windows and clear only after sustained staleness.
- Additional startup-blocker finding (2026-03-12):
  - `detectMapKeyFromHqs()` executed raw `mod.GetHQ`/`mod.GetObjectPosition`/distance checks at startup with no fail-open guard.
  - If HQ objects were not queryable yet on startup frame timing, `onGameModeStartedImpl` could abort before logic loops and spawner startup, presenting as a full experience no-load.
- Mitigation applied (2026-03-12):
  - Hardened `detectMapKeyFromHqs()` to fail-open (`undefined`) when HQ probe/distance checks are unavailable, so startup continues with default map config instead of hard-aborting boot.
- Isolation step applied (2026-03-12):
  - Rolled back the three `v0.423` core HUD runtime experiments (per-player pipeline fault-isolation variant, on-point sample grace, and label fallback tweak) to reduce variables while validating startup no-load behavior.
- Additional visual-correction pass (2026-03-12):
  - Core ticket bars were using friendly-vs-enemy split ratio, which rendered start-state bars as half full.
  - Core ticket lane spacing was keyed to a forced fallback objective count rather than configured objective count.
- Mitigation applied (2026-03-12):
  - Restored ticket bar fill ratio to legacy intent (`current team tickets / CONQUEST_STARTING_TICKETS`).
  - Aligned ticket spacing calculation to configured objective count (no forced fallback slot count).
- Additional timing/appearance pass (2026-03-12):
  - Core popout/engage lanes now use atomic first-frame reveal sequencing (root visible last after child state writes) to prevent staged widget appearance.
  - Core chevron rendering now refreshes label/color/alpha each frame and includes dedicated shadow-layer widgets with explicit lifecycle cleanup.
- Additional layout/flicker refinement (2026-03-12):
  - Core ticket/objective spacing inputs were still resolved as module-load constants; when objective mapping/config finalized later, built widget X positions could remain on stale spacing and hide expected top-row slots.
  - Objective labels in core snapshot defaulted to `?` when derived label messages were transiently unavailable, and transient snapshot-build faults could force visible fallback oscillation.
- Mitigation applied (2026-03-12):
  - Replaced static ticket-lane X constants with runtime layout resolution keyed to live mapped/configured objective count and added per-player layout-count rebuild trigger.
  - Added deterministic objective-letter fallback by objective id/row and last-good snapshot reuse on transient snapshot-build faults.
- Additional pulsing/label regression finding (2026-03-12):
  - `hud-core` ensure/build path still executed every tick and reapplied default text values (`?`, `0`) before render ownership updated real values, causing visible pulse/flicker under live cadence.
  - Fallback objective label path used literal letters via `mod.Message("A")` style calls, which can resolve as unknown and show `?`.
- Mitigation applied (2026-03-12):
  - `hud-core` build path now short-circuits when initialized and layout signature is unchanged; render remains value owner.
  - `hud-core` text ensure writes defaults only on first widget creation, preventing per-tick default-value stomps.
  - Fallback objective/popout labels now map to explicit localized flag-letter string keys (`STR_HUD_CONQUEST_FLAG_LETTER_*`).

## CQ_Bug_10
Title: Combat HUD Drop-Shadow Parity Missing (Core Path)

Observed:
- Core combat HUD text currently lacks legacy-style drop-shadow layering on key combat text surfaces.

Expected:
- Legacy-equivalent drop-shadow treatment restored for combat HUD text groups.

Status:
- Resolved at current accepted checkpoint.

Sequencing Contract:
1. First lock approved parity for positioning, sizing, and color.
2. Only after that lock, run a dedicated drop-shadow restoration pass.
3. Validate shadow offsets/layering after geometry/color lock so they are not invalidated by later layout changes.

Latest Progress (v0.438):
- Added core HUD text shadow widgets and per-frame shadow label/color updates for:
  - ticket counters,
  - objective labels/percent rows,
  - active popout label/percent rows,
  - engage counts/status row.
- Further parity tuning may still be needed after live screenshot validation.

Latest Progress (v0.440):
- Restored differential bleed-chevron visibility in core path (no static all-7 fallback).
- Added reusable shadow-ring profile builder in `hud-core` constants and applied it to:
  - bleed chevrons (legacy-style up-bias profile),
  - objective percent chips,
  - popout percent chip.
- Nudged core engage lane upward slightly and moved objective percent chip row up for tighter visual attachment to top flag squares.

Latest Progress (v0.441):
- Hardened shadow-ring render/hide paths with null-safe array access so stale in-memory entries cannot throw and suppress lane visibility.

## CQ_Bug_11
Title: Help Text Reappears After Team Swap During Live Match

Observed:
- After swapping teams while match is already live, top-center help text can reappear.

Expected:
- Help text must remain hidden while match is live.
- Help text should only follow pre-live ready/not-ready visibility rules.

Status:
- Resolved in `v0.434`.

Resolution Used:
- Changed top-center help container default creation visibility to hidden.
- Removed early return in pid visibility refresh when HUD refs are temporarily missing; fallback name lookup now still applies authoritative visibility.
- Added post-ensure visibility reapply on deploy so newly rebuilt widgets cannot keep default state after swap.
