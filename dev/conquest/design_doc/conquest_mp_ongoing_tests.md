# Conquest — Multiplayer Ongoing Test Checklist

**Maintained over time.** New MP-only validation entries get appended as each wave / change ships. The user runs MP playtests opportunistically (not on a fixed cadence); ticks items off in batches when feasible.

**Player count target:** minimum 24, ideal 64. (16-player runs were where the original heap crash surfaced — they are not the validation target.)

**Pass model:** an MP item is checked when the listed pass condition holds during a playtest at or above the minimum player count. If something fails or is inconclusive, append a note next to the item rather than removing it.

**Single-player tests are not tracked here.** SP smoke tests run with every wave and gate the bumpVersion; they do not accumulate. This file is purely the MP backlog.

---

## Wave 1 — A6 + A7 leak fixes (shipped v1.407, 2026-04-27)
b
- [ ] **Join / Supply-Box-open / leave cycle.** ≥4 players join, each opens the Supply Box once, then disconnects. New players take their slots. Repeat ≥3 cycles. Pass: server still responsive; no script termination during or after the cycles.
- [ ] **HQ Deploy spam + churn.** Players use HQ Deploy multiple times across leave/rejoin cycles. Pass: no script termination; vehicle slots still spawn correctly for new joiners.
- [ ] **Full match start → victory dialog at ≥24 players (ideal 64).** Pass: match starts, plays, ends without `Mod has reached its js script memory usage limit` termination.
- [ ] **If termination still occurs**: capture termination time + connected pid count + match phase. Wave 1 leaks are contributors to the heap pressure tracked in [#109](./conquest_issues.md), not the sole cause; Wave 2+ continues regardless.

## Wave 2 — F1 phase-prefix strip (shipped v1.408, 2026-04-27)

- [ ] **Match completes correctly at 24+ players.** Pass: tickets bleed, captures register, sounds/VO play, victory dialog appears at end. (Catches any cross-file call site missed by rename — would manifest as undefined-function errors at runtime. SP smoke test passed; this is the defense-in-depth check.)
- [ ] **No console errors referencing `conquestPhase*` symbols.** Pass: world log clean during a full match. Any lingering `is not a function` or `undefined` errors mentioning a phase-prefixed name indicates a missed cross-file call site.

## Wave 3.1 — registry + pacer foundation (shipped v1.409, 2026-04-30)

- [ ] **24+ player full match plays identically to pre-Wave-3.1 (no behavior change yet).** Pass: tickets bleed, captures register, sounds/VO play, victory dialog appears at end. The new modules ship in the bundle but no production caller routes through `triggerLazyBuild`; identical observable behavior to v1.408 is the success condition.
- [ ] **No new world-log errors at any phase transition.** Pass: world log shows the same set of entries (or fewer) than v1.408 across Pregame → LIVE → Victory.
- [ ] **No script termination.** Pass: 24+ player match runs to completion without `Mod has reached its js script memory usage limit` or undefined-function errors.

## Wave 3.2 — top HUD shell lazy build (shipped v1.410, 2026-04-30)

- [ ] **24+ players join; each sees top HUD shell within join window; no flicker.** Pass: every player's clock + branding + status dock appear cleanly during the gate-loading window; no half-built shell exposure.
- [ ] **No script termination at join-burst (multiple joiners in same frame).** Pass: ≥4 simultaneous joins do not trigger `Mod has reached its js script memory usage limit` or any "is not a function" / undefined errors. The top-shell `triggerLazyBuild` calls land sync in each join handler frame; concurrent calls share the per-surface in-flight guard.
- [ ] **Late-joiner during LIVE: top HUD shell builds on join, clock advances correctly.** Pass: a player who joins after match start sees their clock counting down in real time within ~1s of join; no stuck-at-zero or missing-clock states.
- [ ] **Team swap mid-match.** Pass: a swap during LIVE keeps the top-shell working — clock continues advancing, status dock updates. The gate-poll retry covers the team-swap path's top-shell readiness check.

## Wave 3.3 — supply box lazy build (shipped v1.411, 2026-04-30)

- [ ] **24+ players each open supply box ≥3 times; first open <50ms feel; subsequent opens essentially instant.** Pass: first interact builds the menu without visible hitch; close-then-reopen reveals the cached menu immediately (hide-on-close retains cache until disconnect).
- [ ] **Disconnect mid-menu by ≥2 players; no script termination; no widget orphaning visible.** Pass: leaving while supply box is open triggers Wave 1 `destroyArmMenu(pid)` cleanup from `onPlayerLeaveGameImpl`; no script termination; remaining players see no orphaned widgets.
- [ ] **Match completes; victory dialog appears.** Pass: full Pregame → LIVE → Victory cycle plays; gate releases on schedule for every joiner without ever waiting on supply-box readiness.
- [ ] **Heap headroom check at 24+ players.** Pass: heap pressure improves vs Ship-2 baseline for any player who *never opens* a supply box during a match. Players who do open get their M2 cache cleaned at disconnect (existing behavior); not freed mid-match.

## Wave 3.3.5 — supply box LIVE-phase warm stagger (shipped v1.412, 2026-04-30)

- [ ] **24+ players: at LIVE, supply-box widgets warm one-pid-per-2s without script termination or frame-budget breach.** Pass: ~50ms hitch lands every 2s as scheduler progresses through the queue; no "Mod has reached its js script memory usage limit" termination; match plays normally throughout.
- [ ] **Mid-stagger disconnect.** Pass: ≥2 players leave mid-warm; their slots no-op silently when fired (dispatcher's `safeFindPlayer` guard); no orphaned widgets; chain advances.
- [ ] **Mid-stagger late join.** Pass: ≥2 players join after LIVE has started; each is enqueued at queue tail via `enqueueLateJoiner`; warmed in turn at the 2s cadence.
- [ ] **Late join after queue drained.** Pass: a player joining post-warm-completion (after all initial pids warmed) restarts the chain for themselves; their warm fires +2s after their join handler.
- [ ] **Cancellation on early match end.** Pass: admin "End Match" mid-stagger nukes the chain (token bump in `cancelWarmStagger`); no widget builds after match end; subsequent restart kicks off fresh stagger correctly.
- [ ] **64-player worst case.** Pass: warm cycle is 128s; pids whose slot never fires successfully fall back to first-interact at their next supply-box visit; first-interact path still works on those pids.

## Wave 3.4 — vehicle deploy timer lazy build (shipped v1.413, 2026-04-30)

- [ ] **24+ players join + reach gate release; deploy menu appears smoothly with no visible hitch.** Pass: build happens during loading-overlay window (gate-entry trigger pattern, mirrors Ship 2 top-shell); reveal at gate release finds cache built; no ~300ms hitch visible to player.
- [ ] **Concurrent join-burst (≥4 simultaneous joiners).** Pass: no script termination; no overlapped builds (mutex acquire/release per pid); each pid's gate-entry trigger lands sequentially via the per-surface in-flight guard.
- [ ] **Late-joiner during LIVE.** Pass: joiner's gate window covers the build; deploy menu ready at gate release; clock + scoreboard intact.
- [ ] **Vehicle slot updates fire correctly.** Pass: timer ticks down per slot, deploy fires correctly (existing behavior), team-swap rebuild path unaffected.
- [ ] **No new world-log errors.** Pass: world log shows the same set of entries as v1.412 across full Pregame → LIVE → Victory cycle.

## Wave 3.5 — combat HUD entry graph lazy build (shipped v1.414, 2026-04-30)

- [ ] **24+ players each: gate window covers the build; combat HUD ready by deploy event.** Pass: tickets/flags/popout render via existing reveal path immediately when the player deploys; no ~500ms hitch at deploy moment.
- [ ] **MUTEX CONTENTION TEST (load-bearing).** Concurrent join-burst (≥4 simultaneous joiners): `vehicleDeployTimer` + `combatHud` triggers contend the global heavy-build mutex. **No frame-budget breach** ("Mod has reached its js script memory usage limit" termination would indicate stacked builds breaching the 1000ms engine eval budget — see CQ_Bug_40). The pacer drains the second-acquire-attempt on its 10Hz tick.
- [ ] **Tickets bleed, captures register, capture sounds + VO play, victory dialog appears, all surfaces stable through full match.** Pass: full Pregame → LIVE → Victory cycle plays normally; combat HUD updates correctly per dirty-flag contract.
- [ ] **Team swap mid-LIVE.** Pass: HUD destroyed via `cleanupConquestHudForTeamSwap`; team-swap gate triggers fresh build via dispatcher; new perspective reflected in tickets/flags.
- [ ] **Late-joiner mid-LIVE.** Pass: gate window covers the build; combat HUD ready when they deploy; tickets/flags correct from first paint.
- [ ] **No script termination at any point during a 24+ player full match.** Pass: combat HUD is the highest-impact surface (M3); if any wave-3 build path is going to break under load, this is where it shows.

## Wave 3.6 — boundary prompt LIVE-batched prebuild (shipped v1.415, 2026-04-30)

- [ ] **24+ players: LIVE transition triggers 10-batch sweep across +0s..+9s.** Pass: batches dispatch at 1s spacing; no frame-budget breach; no `Mod has reached its js script memory usage limit` termination. Batch size = `ceil(N/10)` capped at 8, so even at 24 players each batch fires 2-3 sync 12-widget builds.
- [ ] **Mid-sweep early match end.** Pass: admin "End Match" during the 10s window cancels pending batches cleanly via token bump in `cancelBoundaryPromptPrebuild`; no widget builds after match end; subsequent restart kicks off fresh sweep correctly.
- [ ] **Late-joiner during sweep.** Pass: a player joining between LIVE+0s and LIVE+9s is *not* enqueued (snapshot-only); their first violation builds the cache via the existing first-violation path in `showBoundaryPromptForPlayer`; no regression in their join flow.
- [ ] **Late-joiner post-sweep.** Pass: a player joining after LIVE+10s gets cache via first-violation path; prompt renders cleanly; no missing-widget states.
- [ ] **64-player worst case.** Pass: batch size = `ceil(64/10) = 7` (under MAX_BATCH_SIZE = 8); 7 sync 12-widget builds per second is well within the 1000ms engine eval budget; no script termination; sweep wraps in 10s flat.
- [ ] **Pre-warm interaction with sweep.** Pass: a player who triggers a violation during pregame (forcing a build via existing path before LIVE) sees no double-build when their batch fires post-LIVE — `ensureBoundaryPromptUiForPlayer`'s `existing` branch returns the cached entry as a fast no-op.

## Wave 3.8 — loading-gate deletion (shipped v1.418, 2026-04-30)

- [ ] **24+ player full match: every Ship 2–7 surface continues to function correctly without gate orchestration.** Pass: top HUD, vehicle deploy timer, supply box, combat HUD, boundary prompt, ready dialog all build via lazy triggers when expected; no missing-function errors; no script termination.
- [ ] **First-join race condition: no players reach world state with missing HUD.** Pass: previously prevented by the gate's force-undeploy loop; now relies on lazy-build sync-completion timing. If players occasionally land deployed with a partially-built HUD, regression — restore at minimum a deploy-event-bound guard or rebuild trigger.
- [ ] **Team-swap UX at scale: snap-to-deploy-screen evaluated subjectively across multiple players.** Pass condition is qualitative: does the team-swap feel acceptable without the loading overlay (instant snap), or jarring (no visual continuity between dialog dismissal and new perspective)? If jarring at scale, restore the team-swap-only overlay.
- [ ] **No `mod.EnableAllInputRestrictions` regression spam.** Pass: CQ_Bug_35 stays fixed even though `setAllInputRestrictionsForPlayer` was deleted — the engine call is no longer made from script.
- [ ] **No script termination during full match.** Pass: 24+ player match runs Pregame → LIVE → Victory cleanly.
- [ ] **Final heap headroom captured.** v1.418 = 200,678 bytes (19.14%) headroom. Compared to pre-Wave-3 baseline (v1.408 = 877,390 bytes / 16.33%): bundle shrank 29,492 bytes total across the wave; heap-footprint reductions are larger because per-pid gate state fields are also deleted.

## Wave 3.7 — ready dialog lazy build (shipped v1.416, follow-up v1.417, 2026-04-30)

- [ ] **24+ players: each player's first triple-tap pays a one-time ~300–500ms blank, then dialog appears.** Pass: no script termination across the join-burst; cold build hits the `hitchBudgetMs: 500` ceiling on the slowest pid; subsequent re-opens are instant (cache hit). v1.417 follow-up: deploy-time warm in `spawnReadyDialogInteractPoint` deleted, so the hitch is now genuinely on first triple-tap (in v1.416 it was masked by deploy-time warm).
- [ ] **Gate-release latency improvement vs v1.415.** Pass: players exit the loading overlay sooner now that the gate no longer waits on `isReadyDialogUiCacheUsableForPid` + `isReadyDialogHotReadyForPid`. Subjective comparison against the prior wave's join-feel.
- [ ] **Heap reclaim: never-openers truly skip the build.** Pass: a player who deploys but never triple-taps (e.g. spectator-style behavior) never builds the dialog cache — confirmable via existing telemetry hooks. v1.416 alone did NOT deliver this because of the deploy-time warm; v1.417 closes the loop.
- [ ] **Round-end teardown.** Pass: full Pregame → LIVE → Victory cycle plays normally; ready-dialog widgets torn down via existing `destroyReadyDialogUI` paths; no orphan widgets visible.
- [ ] **Concurrent first-opens (≥2 players triple-tap in same frame).** Pass: per-surface in-flight guard in the dispatcher prevents double-build; both players' dialogs appear; no orphan widgets; no thrown errors in world log.
- [ ] **Reconnect during round.** Pass: a rejoining player who never re-opens the dialog never rebuilds the cache (heap saved). When they do triple-tap, fresh cold build runs cleanly.
- [ ] **Disconnect mid-build.** Pass: a player who triple-taps then immediately disconnects mid-cold-build — dispatcher's existing `isValidPlayer` guards short-circuit subsequent steps; `cleanupHudForPid` path on disconnect tears down any partial widgets.

## Wave 4 — Single-Admin + Player Ready Up Panel (shipped v1.421–v1.436, 2026-05-02)

See [`design_doc/5.01.26_conquest_wave_4_plan.md`](./5.01.26_conquest_wave_4_plan.md) for full plan + locked decisions (v1.3 = first-ever-joiner auto-admin one-time exception + no auto-promotion thereafter; refines v1.2 explicit handoff).

- [ ] **24+ players: cold launch + first triple-tap routing (v1.3).** Pass: first joiner is auto-admin (one-time server-lifetime exception, gated on `_hostFirstPid === undefined`); their triple-tap opens the existing full ready dialog. All other joiners' triple-tap opens the new Player Ready Up Panel (~20 widgets/pid, lazy-built first time only). Game Admin row on non-admin panels reads the first joiner's name (live Player). No script termination; no missing widgets on either surface.
- [ ] **Admin disconnect auto-vacate (NO auto-promotion, v1.436).** Pass: when current admin disconnects mid-pregame, `Admin.onPlayerLeave` clears `_currentAdminPid` and broadcasts `refreshAllVisiblePlayerReadyPanels()`; every viewer's panel updates: Game Admin row reads "No Admin" + CLAIM ADMIN button becomes visible top-right. **A new joiner arriving after the disconnect does NOT inherit the admin slot** (auto-admin branch is permanently inert after first-ever join). New joiner sees the panel with CLAIM ADMIN visible and must press it to take the slot.
- [ ] **Claim race condition (two non-admins click CLAIM ADMIN within same frame).** Pass: first click wins (`Admin.claimAdmin` returns true → handoff happens), second click is a silent no-op (returns false). Loser's panel CLAIM ADMIN button hides on the next refresh broadcast triggered by the winner. No double-admin state, no error spam.
- [ ] **GIVE UP ADMIN handoff at scale.** Pass: admin presses GIVE UP ADMIN on the dialog → dialog hides + cursor restores; all visible non-admin panels refresh (Game Admin "No Admin" + CLAIM ADMIN button appears). A second player presses CLAIM ADMIN → their panel hides + they're admin; all other panels refresh again. Loop confirms no state leaks.
- [ ] **Live-disable parity.** Pass: once match goes LIVE, both CLAIM ADMIN (panel) and GIVE UP ADMIN (dialog) are greyed + click-disabled (`SetUIButtonEnabled(false)`); raw click events that slip through hit the `isMatchLive()` defensive guard and no-op. Admin handoff is impossible during a live match. RESET / APPLY also disabled (existing behavior; verify still works).
- [ ] **Host display post-disconnect (R5 verify).** Pass: when the original first-joiner disconnects, every player's Game Host line should still read the original host's name (cached `_hostNameMessage`). If instead it reads "Unknown" — the cached `mod.Message` token did NOT survive player handle invalidation (R5 risk realized); document the SDK behavior and consider falling back to a static "(host disconnected)" string in a future wave. **Note:** Ship 4 chose live-Player rendering instead of cached-Message rendering, so this currently displays "Unknown" by design when host is disconnected. Re-evaluate if user wants the cached-Message behavior wired in.
- [ ] **Triple-tap admin-gate single chokepoint at scale.** Pass: there is no MP scenario in which the dialog opens for a non-admin or the panel opens for an admin. Every routing decision flows through `tryOpenReadyDialogForPlayer` (`Admin.isAdmin(playerId)` check). Both interact-point and green-smoke world-interactable trigger paths verified — no bypass surfaces.
- [ ] **CHANGE TEAMS auto-close + redeploy.** Pass: pressing CHANGE TEAMS on the panel hides the panel before `swapPlayerTeam` fires the redeploy lifecycle, mirroring the dialog's `processReadyDialogSelection:257` pattern. No orphan panel widgets visible during the undeploy/redeploy window.
- [ ] **READY auto-close on panel.** Pass: pressing READY on the panel hides the panel + restores cursor + fires `handleReadyDialogReadyButtonClick` (world-log "X readied up", HUD ready-count, auto-start gate) identically to the dialog path. No double-toggle, no missing world-log.
- [ ] **Heap reclaim accounting.** Pass: 16-player room target was ~80% reduction in admin-dialog widget refs (1500 → 100 + 225 panel = 325 net). Confirm via existing `getReadyDialogStateForPid` + new panel cache count. Panel never builds for players who don't triple-tap (lazy).
- [ ] **No script termination over a full Wave-4 round.** Pass: cold launch → ready up → match live → victory → restart, with multiple admin handoffs across the cycle. No frame-budget breach, no `Mod has reached its js script memory usage limit` termination.
- [ ] **CLAIM ADMIN visibility consistency (v1.438 bugfix).** Pass: across all four state combinations the button behaves correctly: (admin in place + pre-live → hidden), (admin in place + live → hidden), (admin vacant + pre-live → visible + enabled), (admin vacant + live → visible + greyed/disabled). Verifies the show-loop bug — where every visible-flip was overriding the sync function's vacancy-gated visibility — does not return at scale (multiple panels open simultaneously when admin transitions occur).

## Wave 5 — Timer Simplification (shipped v1.439, 2026-05-02)

See [`design_doc/5.02.26_conquest_wave_5_plan.md`](./5.02.26_conquest_wave_5_plan.md) for full plan + locked decisions L1-L14.

- [ ] **24+ players: vehicle deploy timer rows render bars instead of digits.** Pass: every visible deploy timer row shows the vehicle name label + a red progress bar in the slot the digit clock used to occupy. NO MM:SS digit display anywhere on the deploy timer HUD. Master clock (top of HUD) still shows digital MM:SS — that's correct, untouched per L2.
- [ ] **Bar fills UP in 10% chunks at 1Hz.** Pass: bar drains visibly step-by-step (full → 90% → 80% → ... → 0%) as the cooldown elapses. NOT continuous motion — discrete steps per L8 + L11. Verify at 24+ players running multiple countdowns simultaneously: no per-frame stutter, no hitches on decile transitions.
- [ ] **At 100% the bar is replaced by green "READY" text** in the same widget slot per L12. No bar remnant visible alongside the READY text. Other status modes (ACTIVE/SPAWNING/DEPLOYING) still display correctly with their respective colors per the existing `setReusableTimerStatus` path.
- [ ] **Air delay timer (HQ/Forward/Air post-LIVE delays) follows the same fill-up + READY pattern.** Pass: post-LIVE delay rows show a red bar filling up to the unlock moment, then swap to green READY text. No regression from pre-Wave-5 behavior other than the visual change.
- [ ] **Vehicle spawn cycle loop.** Pass: deploy a vehicle → row resets to empty bar → fills up to READY → loop. No stuck "READY" or missing bar states. Bar reset on cycle boundary is clean.
- [ ] **Heap reclaim verified at scale.** Pass: per-pid `ReusableTimerWidgetCacheEntry` is ~8 widget refs lighter per row × ~12 rows = ~96 widget refs reclaimed per pid. Across 24 pids: ~2,300 widget refs reclaimed total. Subjectively, no `Mod has reached its js script memory usage limit` termination over a full Pregame → LIVE → Victory cycle that previously came close to the limit.
- [ ] **CPU/GC under load.** Pass: at 24+ players running multiple cooldowns simultaneously, no visible stutter on decile transition events. The decile-chunk diff-cache (L8) caps `mod.SetUIWidgetSize` writes at ~10 per countdown per row; steady-state should be 1-3 writes/sec across the whole HUD even with many active timers.
- [ ] **Status mode transitions stay clean.** Pass: rapid mode swaps (timer ↔ ready ↔ active ↔ spawning ↔ deploying — e.g. via vehicle deploy → death → respawn cycle) don't cause widget orphan states. The bar widgets correctly hide when a non-timer status mode is set; statusText correctly hides when timer mode resumes.
- [ ] **No regression in adjacent UI.** Pass: combat HUD + boundary prompt + pregame countdown + master clock + ready dialog all render identically to v1.438. Wave 5 is timer-display-only; no other surface should be visibly affected.
- [ ] **No script termination over a full Wave-5 round.** Pass: cold launch → ready up → match live → victory → restart with vehicles deploying / dying / respawning throughout. No frame-budget breach.

## Wave 6 — Connect/disconnect frame-budget bundle (shipped v1.443 + chevron color polish v1.444, 2026-05-02)

See [`design_doc/5.02.26_conquest_wave_6_plan.md`](./5.02.26_conquest_wave_6_plan.md) for full plan + locked decisions L1-L8. Bundle = Ship 0 (`maxPasses` 128→4) + Ship 1c (eliminate combat HUD compass shadow rings, ~280 widgets/pid reclaim) + Ship 1d (stagger 3 join triggers across 3 frames) + chevron color inversion (left=red on blue bar, right=blue on red bar — improves contrast post-shadow-removal).

- [ ] **13-15 player connect/disconnect spike comparison vs v1.442 baseline.** Pass: subjectively, both spikes feel reduced or eliminated. Ship 0 cuts ~95% of `safeFind` ops on disconnect; Ship 1c cuts ~75% of widgets to delete; Ship 1d distributes the remaining join cost across 3 frames. **Decision gate:** if disconnect spike still visible after this bundle, revive Ship 2 (coalesced post-leave refresh).
- [ ] **Combat HUD reads correctly at scale on a bright map (Operation Firestorm / snow / sand).** Pass: chevrons, objective slot labels (A/B/C... letters and percent text), engage status text, team name labels in top ticket bar, popout text — all legible without their pre-Wave-6 dark shadow halos. If any one surface is hard to read, log which one — single-offset shadow restoration on just that surface is the rollback path (Wave 7 candidate).
- [ ] **Bleed chevron color inversion verified.** Pass: when bleed differential triggers, left chevrons (on blue ticket bar) display in RED; right chevrons (on red ticket bar) display in BLUE. Inverted color reinforces the "enemy is bleeding you" semantic and provides the contrast that the removed shadow halo used to.
- [ ] **No orphan combat HUD widgets across leave/rejoin cycles.** Pass: after Ship 0 reduced `maxPasses` from 128 to 4, a player who disconnects then reconnects on the same pid sees a clean HUD rebuild. If orphan widgets surface (visible stuck text/chevrons from prior pid occupancy), bump `maxPasses` to 8 (R4 mitigation).
- [ ] **Bot disconnect-during-join race test (R6 verification).** Pass: bot connects, then disconnects within 200ms (before the 150ms `combatHud` deferred trigger fires). No console errors, no orphan widgets on the now-disconnected bot's slot, no impact on other players' HUDs. Verifies that `triggerLazyBuild`'s existing `safeFindPlayer`+`isValidPlayer` guard correctly catches the deferred-window invalidation.
- [ ] **Concurrent disconnect (2-3 players within a few seconds).** Pass: no crash, no script termination, all surviving players' HUDs stay correct. Tests that the `maxPasses=4` ceiling holds up when multiple cleanup loops race.
- [ ] **Reconnect mid-match.** Pass: disconnected player reconnects on same pid (BF6 reuses pid integers within a match); their HUD rebuilds cleanly via the lazy-build dispatchers; no doomed-parent races. Pid-recycle hazard is the documented reason Ship 3 (paced cleanup) was deferred — the existing sync rebuild path is the validation here.
- [ ] **Bleed event chevron rendering correctness.** Pass: when bleed differential triggers (control more objectives than enemy), chevrons appear on the bleeding team's side, count matches the differential level, color is correctly inverted per the policy above. No missing-on-first-bleed regressions (chevron lazy-build was DROPPED in v0.2 lock per L3, so chevrons build at HUD-ensure time alongside the rest of the HUD).
- [ ] **Heap reclaim accounting at scale.** Pass: combat HUD widget count per pid drops from ~372 to ~92 (a ~75% reduction). At 13-15 players, ~280 widgets/pid × 14 pids = ~3,920 widget refs reclaimed total. Should move M3 (combat HUD) below M2 (supply box) in the heap-impact ranking — confirmable by absence of pressure on heap headroom during a long match.
- [ ] **No script termination over a full Wave-6 round.** Pass: cold launch → ready up → match live → victory → restart, with multiple connect/disconnect events throughout. No frame-budget breach, no `Mod has reached its js script memory usage limit` termination.

## HUD Backplates — engage status only (shipped v1.449, iteratively polished through v1.453, 2026-05-03)

Reuses tickets-box visual style (Blur fill, dark color, 0.75 alpha). **Final scope (v1.451): engage-status backplate only** (DEFEND/CAPTURING/CONTESTING/NEUTRALIZING text on the engage panel). Team-name backplates added in v1.449 then removed in v1.451. **Final dimensions (v1.453):** engage box 98 wide × 14 tall (covers only the visible glyph cap-height; the 18px text widget had ~4px of bounding-box padding the backplate didn't need to back), Y shifted +2 from text Y so the box top doesn't touch the engage-track bar above. Centered in the 152-wide engage root. +1 widget/pid net in M3.

- [ ] **Cold launch + view top HUD bar.** Pass: NO backplates behind WEST/NATO + EAST/PAX team names (v1.451 removal). Tickets backplates still visible behind the count text.
- [ ] **Approach an objective + trigger CONTESTING / CAPTURING / NEUTRALIZING / DEFEND state cycling.** Pass: engage status text rotates through all 4 labels with backplate behind. **v1.453 dimension check:** NEUTRALIZING fits inside the backplate with a thin visible margin (no clipping); the box wraps tightly around the visible glyph height (no empty padding above or below the rendered letters); the box top has visible vertical separation from the engage-track bar above (no touching/overlap); CAPTURING / CONTESTED / DEFEND (shorter labels) appear centered within the same backplate width.
- [ ] **Engage panel show/hide cycle (enter objective → leave → re-enter).** Pass: engage status backplate appears + disappears in lockstep with the engage status text. No orphan backplate visible after the panel hides.
- [ ] **Team swap mid-match.** Pass: engage status backplate rebuilds correctly with new perspective.
- [ ] **Bright-map screenshot comparison vs v1.448.** Pass: subjective readability of engage status text improved on Operation Firestorm.
- [ ] **13-15p MP at scale.** Pass: engage status text readable mid-objective contest. Concurrent objective contests don't produce missing-backplate states.
- [ ] **Bot disconnect mid-match.** Pass: no crash, no orphan backplate, no stuck widgets.

---

## CQ_Bug_94 — Supply Box engine-log noise on Medic/Assault/Recon (shipped v1.447 + v1.448, 2026-05-03)

See [`design_doc/5.03.26_conquest_supplybox_medic_fix_plan.md`](./5.03.26_conquest_supplybox_medic_fix_plan.md). Two-step fix: **v1.447** added per-class HasEquipment-based probes for the menu-OPEN path. **v1.448** dropped the `isSlotEmpty` precheck from non-Engineer give helpers for the menu-PLACEMENT path. Combined: non-Engineer classes emit ZERO `GetInventoryAmmo` / `GetInventoryMagazineAmmo` engine error log entries on either path. Engineer's `probeSlot` + give helpers left untouched.

- [ ] **Engineer + open supply box on cold spawn (no gadgets placed yet).** Pass: menu builds correctly. (Note: Engineer ammo-based probe still in place, so engine log noise on Engineer cold-spawn is EXPECTED — not a regression.)
- [ ] **Engineer + place RPG → close menu → re-open.** Pass: launcher tile dimmed (dup-dim works), no new behavioral regression.
- [ ] **Medic + open supply box on cold spawn.** Pass: menu builds with smoke + intercept tiles, **NO `GetInventoryAmmo` / `GetInventoryMagazineAmmo` engine error log entries.** (v1.447 fix)
- [ ] **Medic + click GrenadeIntercept tile (placement).** Pass: gadget placed in GadgetTwo, **no engine error log on the click**. (v1.448 fix — was firing pre-v1.448 via `isSlotEmpty` in `giveAssaultItem`.) Tile becomes gray-dimmed on next refresh (dup-dim via `tileOwned` → `ownedByLockerState`).
- [ ] **Medic + click MissileIntercept tile while GrenadeIntercept is already in GadgetTwo.** Pass: clobbers cleanly (engine `AddEquipment` semantic), GrenadeIntercept replaced with MissileIntercept, no error log, no soft-lock.
- [ ] **Medic + click Smoke tile (Callins slot).** Pass: smoke placed, no error log. (v1.448 fix — `giveMedicSmoke` was firing pre-v1.448.)
- [ ] **Assault + open supply box on cold spawn.** Pass: menu builds with artillery + beacon + ladder tiles, no engine error log. (v1.447 fix)
- [ ] **Assault + click SpawnBeacon tile (placement).** Pass: beacon placed, no error log on click. (v1.448 fix.) Tile gray-dim post-placement.
- [ ] **Assault + click AssaultLadder while Beacon already in GadgetTwo.** Pass: clobbers cleanly, ladder replaces beacon, no error log.
- [ ] **Recon + open supply box on cold spawn.** Pass: menu builds with drone + C4 + AV grenade tiles, no engine error log. (v1.447 fix)
- [ ] **Recon + click Drone tile (placement).** Pass: drone placed, no error log on click. (v1.448 fix.) Tile gray-dim post-placement.
- [ ] **Recon + C4 anti-double-up check.** Click C4 tile → C4 placed → click C4 tile again. Pass: second click silent-rejects via `ownedByLockerState`/`HasEquipment` dup check, tile is gray-dimmed, no error log, no double C4.
- [ ] **Class swap mid-match (Engineer with placed RPG → Medic via team swap → open supply box).** Pass: menu builds correctly for new class; locker state re-populates on the new class's first open via `initLockerSlotStateFromProbe` re-call (heals naturally — no separate cleanup needed). No error log on the post-swap open.
- [ ] **Concurrent supply-box opens at scale (≥3 non-Engineer players in same frame at 13-15p MP).** Pass: no error log spam, no crash, all menus build correctly. This is the concrete heap-pressure test — if removing the per-pid log allocations holds the engine envelope where Wave 6 reclaim left it, this scenario should run cleanly indefinitely.
- [ ] **Bot disconnect mid-menu.** Pass: no crash, no orphan widgets, no stuck per-pid state.
- [ ] **24+ player full match: world-log overlay free of `GetInventoryAmmo` / `GetInventoryMagazineAmmo` invalid-item errors throughout.** Pass: cold launch → ready up → match live → players use supply boxes throughout → victory. Engineer rows in the world log are acceptable (out of scope for this fix). Non-Engineer rows should be zero.

---

## CQ_Tweak_WAIT_Label — "WAIT" label on vehicle deploy timer bars (shipped v1.446, 2026-05-02)

UX polish: every vehicle deploy timer row's progress bar now shows a "WAIT" label centered on top (black text, drawn last in z-order so it appears over the red fill).

- [ ] **Cold launch + open deploy menu mid-cooldown.** Pass: every visible row in timer mode shows "WAIT" centered on the bar in black, readable on top of both the gray frame and the advancing red fill.
- [ ] **Row transitions timer → READY → timer (e.g. spawn a vehicle, wait for cooldown).** Pass: WAIT label hides when row swaps to "READY" green text mode; reappears on the next timer cycle. No flicker, no orphan WAIT visible alongside status text.
- [ ] **Row transitions timer → ACTIVE / SPAWNING / DEPLOYING.** Pass: WAIT label hides correctly during all four non-timer status modes (`setReusableTimerStatus` toggles all three bar widgets — border, fill, text — together).
- [ ] **Multi-row HUD at scale (24+ pids active).** Pass: WAIT renders correctly on every visible row simultaneously; no missing-text states; no positional drift.

---

## CQ_Bug_58 — Ready-state auto-unready tuning (shipped v1.445, 2026-05-02)

See [`design_doc/5.02.26_conquest_ready_tuning_plan.md`](./5.02.26_conquest_ready_tuning_plan.md). Behaviour change: auto-unready triggers reduced to two — SWAP TEAMS + admin config change. Removed: death-respawn auto-unready, leaving-main-base-pre-live auto-unready.

- [ ] **Player readies up, dies, respawns.** Pass: still shows READY post-respawn. No "needs reconfirm" warning visible. Pre-fix would have shown them as NOT READY with a warning halo.
- [ ] **Player readies up, walks out of HQ pre-live, walks back in.** Pass: stays READY throughout the entire walk-out / walk-back cycle. The IN MAIN BASE / NOT IN MAIN BASE indicator on the panel still updates correctly to reflect their position, but the READY flag does NOT flip.
- [ ] **Player clicks SWAP TEAMS.** Pass: flips to NOT READY as before. (Sanity check that this trigger still works.)
- [ ] **Admin opens dialog, changes vehicle config, clicks APPLY.** Pass: every previously-ready player including the admin themselves shows NOT READY with the reconfirm warning visual on the ready toggle button. (Sanity check that this trigger still works.)
- [ ] **Player clicks NOT READY explicitly.** Pass: flips to NOT READY as before. (Sanity check on the explicit user toggle path.)
- [ ] **Match-start fresh-cycle reset (admin RESET).** Pass: all players go to NOT READY at fresh-cycle start. (Sanity check that the bulk reset path still works after removing the deploy clear.)
- [ ] **24+ player full match: no script termination, no orphan ready-state inconsistencies.** Pass: cold launch → ready up → match live → players die/respawn during pre-live (e.g. boundary kills) → all surviving ready players still show READY → match starts → live play normal → victory. No regression in adjacent UI surfaces (Player Ready Up Panel, full Ready Dialog, ready-up HUD count).
- [ ] **Bot disconnect mid-match.** Pass: leaving cleanup still removes the bot's ready state cleanly. No stuck "X is still ready" entry on remaining players' rosters.

## Delay-Elapsed Broadcasts (shipped v1.455, 2026-05-04)

See [`design_doc/5.03.26_conquest_delay_broadcasts_plan.md`](./5.03.26_conquest_delay_broadcasts_plan.md). 4 transient on-screen text widgets fire at each `roundStart*Delay` milestone after LIVE (Firestorm: 30/60/90/120s) announcing vehicle/gadget unlock states. 5s display window per broadcast. Per-PID widgets, lazy-built on first broadcast, hidden after auto-hide timer.

- [ ] **Full match plays from LIVE through all 4 broadcast milestones at 24+ players.** Pass: at LIVE+30s, "Aircraft can now HQ Ground Deploy (Purple Smoke)!" appears at the top-center of every player's screen for 5s, then auto-hides. At LIVE+60/90/120s the corresponding Aircraft Air / Forward / Gadgets broadcasts fire similarly. No overlap. No stuck-visible widgets between broadcasts.
- [ ] **Late-joiner during the LIVE phase (post-LIVE+30s).** Pass: late-joiner sees only the broadcasts they're still on track to receive (per Q5 lock — no replay). Past broadcasts do NOT re-fire for them. Future broadcasts fire normally.
- [ ] **Match ends mid-broadcast.** Pass: end-match cleanly cancels the visible broadcast (no stuck "X is now available!" widget on the victory dialog overlay). Pending broadcasts also cancel — next match's LIVE re-schedules cleanly.
- [ ] **Admin resets to fresh setup mid-LIVE.** Pass: `triggerFreshMatchSetup` cancellation hides any visible broadcast. Re-LIVE re-schedules from zero.
- [ ] **Bot/player disconnect mid-broadcast.** Pass: `cleanupHudForPid` destroys the per-pid widget tree + cancels the per-pid hide timer; no orphan widgets on remaining players' screens; no script termination.
- [ ] **Heap headroom check across full match.** Pass: 24+ player match runs to completion; M16 (delayBroadcastByPid) does not contribute meaningful heap pressure (~32 widget refs at full lobby; auto-hide timers cancel cleanly). No `Mod has reached its js script memory usage limit` termination.

---

## How to use this file

- One section per wave or change set, with a heading like `## Wave N — <topic> (shipped v<version>, <date>)`.
- Each item is a single `- [ ]` checkbox with a clear pass condition.
- When all items in a wave's section are checked off, append `**Wave N validated <date>.**` under the heading.
- Do not delete completed items — they stay as a record. Old waves can be collapsed into a `## Validated waves (archive)` section once they've all passed if the file gets long.
