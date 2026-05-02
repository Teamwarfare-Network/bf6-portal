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

---

## How to use this file

- One section per wave or change set, with a heading like `## Wave N — <topic> (shipped v<version>, <date>)`.
- Each item is a single `- [ ]` checkbox with a clear pass condition.
- When all items in a wave's section are checked off, append `**Wave N validated <date>.**` under the heading.
- Do not delete completed items — they stay as a record. Old waves can be collapsed into a `## Validated waves (archive)` section once they've all passed if the file gets long.
