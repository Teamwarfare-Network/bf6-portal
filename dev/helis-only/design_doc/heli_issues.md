# Helis Issues

Last Updated: 2026-05-31 (v0.696)
Last Tested Build: `v0.696` — SP testing, Ready Dialog roster-cell flicker (see `H_Bug_3`) substantially reduced after four attempts (v0.693 atomic reveal, v0.694 post-construction hide, v0.695 cache-hit refresh + text-then-visibility order, v0.696 modlib.ParseUI hidden-construction). User reports residual flicker reduced to "good enough for now" but not eliminated. Issue parked as PARTIALLY FIXED — see `H_Bug_3`.

This file is the Conquest-style bug tracker for Helis (parallel to [`conquest/design_doc/conquest_issues.md`](../../conquest/design_doc/conquest_issues.md)). It catalogues bugs that have been **actively investigated** — observed, hypothesized, attempted-to-fix, with status tracked. For static-analysis-found patterns and risk inventory, see [`heli_issues_design.md`](./heli_issues_design.md).

Numbered issues use the prefix `H_Bug_N`. Open bugs are listed first.

---

## H_Bug_1
Title: "Received Undefined Values As Arguments" — 2 Engine Errors On MP Player Join (OPEN)

Observed:
- User reports: "I can only see them once I'm in the server. They appear immediately. It's an online MP live server. It's ALWAYS 2."
- Exactly 2 engine error log lines: `Received undefined values as arguments` (paraphrase) fire at the moment the user joins the MP server.
- Deterministic — same count every game start.
- Persists across all 4 fix attempts to date (v0.645 → v0.647).
- Game functions correctly; errors are cosmetic engine-log spam at the JS-execution layer.

User constraints (matter for debug strategy):
- Dev console is behind menus in online MP — cannot be observed simultaneously with in-game HUD.
- User can only see the console after joining the server.
- Probe widgets in the HUD are not viable for correlation (rejected by user 2026-05-29; the version-history `v0.639–v0.643` chain proved console+HUD cannot be cross-referenced in MP).

Candidate sources investigated and RULED OUT (in chronological order):

1. **`spawnTeamSwitchInteractPoint` (team-switch.ts) — RULED OUT (v0.641–v0.642 probe)**
   - Hypothesis: unguarded `mod.GetObjectPosition` / `mod.GetSoldierState` / `mod.SpawnObject` inside this function fires the errors during OnPlayerDeployed.
   - Test: v0.641 added 19 sequenced probe stamps `STIP_01–STIP_19` inside the function; v0.642 added 0.5 s waits between each so the user could read the HUD widget value.
   - Result: function progressed cleanly through `601 → 618` with the 2 errors STILL appearing. **Function body is not the source.**

2. **Transitional vehicle position state at `OnVehicleSpawned` entry — RULED OUT (v0.645)**
   - Hypothesis: `mod.GetObjectPosition(eventVehicle)` at the very top of `OnVehicleSpawned` ([index.ts:566–568](../src/index.ts#L566)) is called before the engine has settled the vehicle's transform. 2 initial forced spawns in 1v1 default × 1 unguarded position read = 2 errors. Pattern matches.
   - Test: v0.645 inserted `await mod.Wait(0.05)` before the position read.
   - Result: 2 errors still appear. **Not a transitional-state-on-spawn issue.**

3. **CQ_Bug_42 family — `arrayContainsVehicle` / `arrayRemoveVehicle` helpers (vehicles.ts:6–17) — RULED OUT (v0.646)**
   - Hypothesis: Conquest's documented v1.073 fix for the same "2 engine errors" pattern. `mod.GetVariable(regVehiclesTeam1/2)` can return a non-array during transient registry state; the helpers internally call `modlib.IsTrueForAny` / `modlib.FilteredArray` → `mod.CountOf(undefined)` → engine error. Once per team = 2.
   - Test: v0.646 added `if (!arr) return false;` and `if (!arr) return mod.EmptyArray();` guards (verbatim port of Conquest's fix).
   - Result: 2 errors still appear. **Helpers were not the path firing the user's specific errors** (though the guards are kept — they prevent the same vulnerability class in other scenarios).

4. **CQ_Bug_42 family extended — `getRegisteredVehicleCount` (clock.ts:89–94) + `registerVehicleToTeam` (vehicles.ts:102–117) — RULED OUT (v0.647)**
   - Hypothesis: 2 more unguarded sites passing `mod.GetVariable(...)` to `mod.CountOf` / `mod.AppendToArray` directly. `getRegisteredVehicleCount` is called twice per main-loop tick (Team1 + Team2) inside the `isRoundLive()` gate — for a player joining mid-round, the first tick after join fires `getRegisteredVehicleCount(Team1)` + `getRegisteredVehicleCount(Team2)` = exactly 2 errors. Matches the user-observed "exactly 2 errors on MP join" pattern perfectly.
   - Test: v0.647 added `if (!arr) return 0;` to `getRegisteredVehicleCount` and `?? mod.EmptyArray()` coercion to `registerVehicleToTeam`.
   - Result: 2 errors still appear. **Neither of these is the source either.**

5. **`mod.GlobalVariable` at module-load — RULED OUT (static comparison, v0.647)**
   - Hypothesis: `const regVehiclesTeam1/2 = mod.GlobalVariable(0/1)` at types.ts:161–162 fires errors at module-load before engine is ready.
   - Test: grep confirmed Conquest has the identical pattern at `foundation/gameplay.ts:47–48` and doesn't observe this bug. **Not the divergence.**

Expected:
- The 2 errors are paired (Team1 + Team2) and fire on player join in MP.
- The source is somewhere in the OPJG / first-tick path that does a paired Team1/Team2 operation with at least one unguarded undefined-able input. We've ruled out the most obvious such paths.

Fix (NOT YET APPLIED):
- Source remains unknown after 4 fix attempts. The defensive guards in v0.646 and v0.647 are kept (strict improvements regardless of root cause).
- Untried approaches when picked up later:
  - **World-log probe** with 5–10 pre-registered string keys in strings.json (requires user approval for string changes). Each suspect call site emits a unique stamp via `sendHighlightedWorldLogMessage` (visible in-game, no menu needed). Trade-off: ~5 string-key additions per probe round, but works around the console-behind-menu constraint that killed the HUD-widget probe.
  - **Bisection by commenting** in `OPJG` and `ensureHudForPlayer`. Comment out major chunks, observe whether errors drop from 2 → 1 → 0, drill in. Slow but deterministic.
  - **Audit modlib functions** Helis uses beyond `IsTrueForAny` / `FilteredArray`. There may be a 3rd modlib helper internally calling `mod.CountOf(undefined)` that we haven't touched.
  - **Compare Helis `ensureHudForPlayer` slow-path line-by-line to Conquest's equivalent.** The 1,812-line Helis builder may have a specific `modlib.ParseUI` call with undefined property (e.g., color, position) that Conquest's equivalent doesn't have.
  - **Check `updateTeamNameWidgetsForPid` and `rebuildOvertimeUiForPlayer`** in OPJG path for paired Team1/Team2 widget builds that could pass undefined args. These are also called on first join and have left/right symmetry.

Status:
- **OPEN** as of 2026-05-29 / v0.647.
- 4 fix attempts shipped, none resolved the symptom.
- Defensive guards from v0.646 + v0.647 stay regardless (they fix latent vulnerabilities even if not the user-observed symptom).
- **Recommended next session**: try the world-log probe approach (option above) for a definitive bisection without the HUD-vs-console UX problem.
- **Acceptance criterion**: per Conquest's #94 / #109 documentation, accumulating engine error logs contribute to JS heap pressure that has caused 16-player MP crashes. For Helis at typical scale (≤8p, short sessions), 2 errors per join is tolerable cosmetic spam. For long-uptime MP servers, this should be fixed.

Related:
- CQ_Bug_42 — the documented Conquest fix for an identical-looking "2 errors per game" pattern. Conquest's fix (helpers + capture-tickets guard) ported here in v0.646 + extended in v0.647, but did not address Helis's specific symptom. Either Conquest had a DIFFERENT 2-error source that happened to also be paired, or Helis has an additional unique source.
- CQ_Bug_94 / CQ_Bug_109 — heap-pressure mechanism. Each leaked engine error log allocates per-log JS objects. At scale, these accumulate to the script-load termination Conquest hit at 16p.
- H_Bug_2 (GetSoldierState on death) — sibling cosmetic-engine-log issue, same heap-pressure concern.

Evidence:
- User reports across multiple version cycles (v0.638, v0.642, v0.643, v0.645, v0.646, v0.647): "2 errors at game start, always 2, deterministic, on MP join."
- Version history: see `src/Changelog.ts` v0.639–v0.647 entries for each fix attempt and outcome.

Reproduction:
- Online MP server (live, not SP).
- Join the server (errors fire immediately on join).
- Open dev console after joining — 2 "Received undefined values as arguments" lines are present.

---

## H_Bug_2
Title: "GetSoldierState ... Player Not Being Deployed" — Cosmetic Engine Log On Plain Death / Round End

Observed:
- Engine reports: `ERROR REPORTED BY GETSOLDIERSTATE WHILE: Failed to apply action to player due to player not being deployed`.
- Originally fired on every plain (non-vehicle) death and at round end.
- After v0.638 (Plan A10 — port of Conquest CQ_Bug_37/38 v1.074 cache-guard pattern via `State.players.isAliveByPid`), frequency reduced from "every death" to approximately "1 in 10 deaths" per user report 2026-05-29.
- Cosmetic — no functional impact; safe-wrapper try/catch handles the JS exception cleanly. Engine log spam remains.

Candidate Sources:
- Per-tick callsites that read `safeGetSoldierState*` for a player after they undeploy but before the `OnPlayerUndeploy` event fires (race window).
- Specifically the 6 callsites guarded in v0.638:
  - [team-switch.ts](../src/team-switch.ts) `isVelocityBeyond`, `checkTeamSwitchInteractPointRemoval` (IsDead read)
  - [utils.ts](../src/utils.ts) `InteractMultiClickDetector.checkMultiClick` (IsInteracting read)
  - [ready-dialog.ts](../src/ready-dialog.ts) `applyAutoReadyForPid` (IsInVehicle read), `checkTakeoffLimitForAllPlayers` (GetPosition read)
  - [hud.ts](../src/hud.ts) `updateHelpTextVisibilityForPid` (IsInVehicle read, paired with existing deploy-grace from Plan A2)
  - [overtime.ts](../src/overtime.ts) `syncOvertimePlayerVehicleState` (IsInVehicle read)

Expected:
- Per Conquest CQ_Bug_37/38/50 documentation: this is an **engine-logs-before-JS-catch residue**. The engine logs the error log line *before* the JS exception is throwable, so try/catch doesn't suppress the log itself — only the JS-side exception propagation.
- Conquest accepts this as a known cosmetic residual after their cache-guard pattern. Helis is now in the same state.

Fix Status:
- **Partially fixed (v0.638)** — Plan A10 / CQ_Bug_37/38 v1.074 cache-guard port.
  - Added `State.players.isAliveByPid: Record<number, boolean>` cache.
  - `isPlayerAlive(player)` helper inserted as a precheck before every `safeGetSoldierState*` at the 6 per-tick callsites.
  - Cache flipped: TRUE in `OnPlayerDeployed`, FALSE in `OnPlayerUndeploy`, on `OnPlayerLeaveGame` (delete), in `OnVehicleDestroyed` (proactive flip via `popLastDriver` for the vehicle's victim), and in both `safeGetSoldierState*` catch blocks (self-healing).
- **Residual** matches Conquest's documented residual: first tick after death where cache shows alive but engine has already undeployed → 1 cosmetic log line per affected death.
- Plan archive: [`5.27.26_heli_isAliveByPid_cache_plan.md`](./5.27.26_heli_isAliveByPid_cache_plan.md).

Status:
- **Closed-Accepted (cosmetic residual)** matching Conquest's own status for the same bug family.
- If frequency increases or heap-pressure data emerges, revisit by tightening the OnVehicleDestroyed → popLastDriver flip timing or adding a post-deploy-grace gate to additional callsites.

Related:
- CQ_Bug_37 / CQ_Bug_38 / CQ_Bug_50 — Conquest's identical residual pattern.
- CQ_Bug_94 / CQ_Bug_109 — heap-pressure mechanism.

Evidence:
- User report 2026-05-29: "the frequency of the getsoldier state error seems less. But it is still occurring. I tried it over 9-10 deaths and saw it once."
- v0.638 changelog entry in `src/Changelog.ts`.

---

## H_Bug_3
Title: Ready Dialog Roster Cell Placeholder Flicker On First Open (PARTIALLY FIXED)

Observed:
- On first triple-tap to open the Ready Dialog after a fresh map load, placeholder text briefly flickers in the roster cells where player names would appear (and possibly other elements per user 2026-05-31: "possibly some other elements though, its really hard to tell").
- The placeholders render as `<unknown string>` or similar — visible artifacts of `mod.Message(mod.stringkeys.twl.system.genericCounter, "")` (empty-arg interpolation) being painted before `refreshReadyDialogRosterForViewer` populates real player names.
- Volume: 192 roster widgets (`TEAM_ROSTER_MAX_ROWS=16` rows × 6 widgets/row × 2 teams). Most rows are empty in typical SP/MP scenarios so most cells should be hidden — the empty-row placeholders are what flicker.
- BF6 Portal has no widget persistence across map loads — every load is a fresh script with fresh widgets — so this is purely a cold-build issue.
- After v0.696, user reports "not fully gone, but its good enough for now."

Candidate sources investigated and addressed (in chronological order):

1. **Cold-build had no atomic reveal — RULED-IN, FIXED (v0.693)**
   - Hypothesis: `createTeamSwitchUI` was building `CONTAINER_BASE_ID` + 4 borders + map label/value with `visible: true`, so each widget appeared visually as it was constructed (~hundreds of widgets popping in sequentially).
   - Fix: ported Conquest's `finalizeReadyDialogVisibility` atomic-reveal pattern (Conquest [dialog-build.ts:25-54](../../conquest/src/ready-dialog/dialog-build.ts#L25)). Root + chrome built `visible: false`; entire tree atomically revealed at end of `createTeamSwitchUI` via single helper call. Cache-hit path refactored to use the same helper.
   - Result: chrome flicker eliminated. Player-name roster cells still flickered.

2. **Roster row widgets built with default-visible — PARTIALLY FIXED (v0.694)**
   - Hypothesis: The 192 roster row widgets (built via `mod.AddUIText`, which has no `visible` parameter) defaulted to `visible: true`. Cascade through hidden `CONTAINER_BASE` was expected to hide them — but the codebase's own admin-panel comment ("some engines do not cascade container visibility") suggested cascade is unreliable in this engine.
   - Fix: added explicit `mod.SetUIWidgetVisible(widget, false)` immediately after each `mod.AddUIText` call + reparent.
   - Result: user reported "possibly a bit better but hard to tell" — flicker reduced but not eliminated. The post-construction hide was racing with the engine's queued widget creation/render cycle.

3. **Refresh set visibility before text + cache-hit skipped refresh — FIXED (v0.695)**
   - Hypothesis A: `refreshReadyDialogRosterForViewer` set per-row visibility FIRST then text. For a previously-hidden row with stale text, refresh flipped visible=true while stale text was still in the widget — one-frame paint with stale text.
   - Hypothesis B: my v0.693 cache-hit refactor consolidated 8 inline visibility flips into one `finalizeReadyDialogVisibility` call but didn't add `refreshReadyDialogRosterForViewer` before reveal. On dialog reopen, the reveal showed stale row state until the post-reveal `renderReadyDialogForViewer` (called from `teamSwitchInteractPointActivated`) updated them.
   - Fix: reordered refresh to set text FIRST, then visibility flip LAST. Added refresh call to cache-hit path before reveal.
   - Result: addresses in-session reopen flicker, but doesn't fix the cold-build first-open case (BF6 Portal has no cross-game widget persistence so cold-build is the dominant test path).

4. **`mod.AddUIText` construction-time race — MOSTLY FIXED (v0.696)**
   - Hypothesis: `mod.AddUIText` creates the widget VISIBLE by default. The BF6 Portal engine appears to queue widget creation and may paint the queued widgets BEFORE the deferred `SetUIWidgetVisible(false)` applies — even though both are in the same JS tick. Placeholder text painted briefly during the queued-creation window.
   - Fix: replaced the 192 `mod.AddUIText` calls with `modlib.ParseUI({type: "Text", visible: false, ...})`. ParseUI commits the visible flag at creation time, eliminating the race. Extracted into local `buildRosterTextHidden` helper to keep the loop body compact (was 42 lines/iteration, now 6 calls).
   - Same pattern as Conquest's roster build in [dialog-build-roster.ts](../../conquest/src/ready-dialog/dialog-build-roster.ts).
   - Also added defense-in-depth: `deleteTeamSwitchUI` now explicitly hides all 192 roster rows on close (in-session relevance only).
   - Result: user reports "not fully gone, but its good enough for now." Substantial reduction; residual flicker remains.

Engine behavior learned during investigation:
- `mod.AddUIContainer` accepts a `visible` parameter; `mod.AddUIText` does NOT — must use `modlib.ParseUI({type: "Text", visible: false, ...})` to build text widgets hidden from construction.
- Visibility cascade through container parents is unreliable in this engine (per the codebase's own admin-panel comment). Explicit per-widget visibility is the safer pattern for any widget that must stay hidden.
- `mod.Message(stringkey, "")` with empty-string argument substitution can render as `<unknown string>` or similar engine fallback — not safe to use as a "transparent" placeholder.
- Widgets created via `mod.AddUI*` may be queued and rendered in a deferred window BEFORE subsequent `SetUIWidget*` calls apply — even within a single synchronous JS tick. The BF6 Portal engine's exact rendering model isn't documented; treat post-construction state mutations as racy.
- Refresh order matters: when flipping a widget from hidden to visible, set TEXT and COLORS FIRST, then VISIBILITY LAST. The reverse order allows a one-frame paint of stale state.
- No cross-game widget persistence in BF6 Portal — every map load is a fresh script with fresh widgets. Cache-hit paths only matter for in-session dialog open/close cycles (not cross-game).

Expected:
- Residual flicker source is not yet identified. Hypotheses for next session:
  - Some OTHER widget set in the dialog (not roster rows) still uses `mod.AddUIText` + default-visible — may need a full audit of every `mod.AddUIText` callsite in `createTeamSwitchUI` and convert to `modlib.ParseUI({visible: false})`.
  - Refresh during the build itself triggers paints (e.g., `updateReadyDialogModeConfigForPid` called mid-build, or `applyReadyDialogLabelTextColor` cascading repaints).
  - Engine paints between `modlib.ParseUI` calls if construction spans multiple frames — would require a "build entirely then reveal" pattern where NO post-construction mutation happens before reveal.

Fix Status:
- **Partially fixed across v0.693 → v0.696.** User confirmed "good enough for now" after v0.696.
- Untried approaches when picked up later:
  - **Audit every `mod.AddUIText` call** in `createTeamSwitchUI` (and `ensureAdminPanelWidgets`) — convert to `modlib.ParseUI({visible: false})` for any that don't have meaningful initial text. The roster row conversion in v0.696 addressed only 192 of an unknown total.
  - **Move all text-update calls (`refresh*`, `update*`) to before the atomic reveal**, ensuring no `SetUITextLabel` fires post-reveal. Audit `renderReadyDialogForViewer`'s post-reveal call in `teamSwitchInteractPointActivated:102` — that may still cause a stale-text repaint cycle.
  - **Add a single mid-build `await mod.Wait(0)` yield** before the atomic reveal — gives the engine a chance to commit all queued widget creations as hidden before the visibility flip fires. Conquest may do this; worth a comparison.
  - **Use `modlib.ParseUI` with `children: [...]` nested trees** for the entire dialog body, building everything in one ParseUI call rather than hundreds of separate `mod.AddUI*` calls. The nested-tree pattern guarantees a single atomic commit.

Related:
- Lazy-load HUD refactor v0.687–v0.691 (Phases 0/A/B/E) addressed the broader concurrent-join crash; this dialog-flicker issue is a sibling rendering concern with overlapping root cause (engine widget commit/render timing).
- [Conquest dialog-build.ts](../../conquest/src/ready-dialog/dialog-build.ts) — reference implementation of the hidden-build-then-reveal pattern; their CQ_Bug_32/33 entries were closed by deleting the warm-up path rather than refactoring it.

Evidence:
- User report 2026-05-31 across multiple version cycles:
  - v0.693: "its still occurring, maybe a bit better possibly, hard to tell"
  - v0.695: "is there a cache? Is there another spot to check?"
  - v0.696: "I dont think its fully gone, but its good enough for now"
- Version history: `src/Changelog.ts` v0.693–v0.696 entries for each fix attempt and outcome.

Reproduction:
- SP or fresh map load.
- Triple-tap interact keybind to open the Ready Dialog for the first time.
- Watch the roster cells (where player names would appear) — placeholder text flickers visible for a frame or two during the build window.
- The closer the user looks, the more elements may appear to flicker briefly; primary observation is the roster cells.

Status:
- **PARTIALLY FIXED** as of 2026-05-31 / v0.696.
- Substantial reduction in flicker visibility; user accepts as "good enough for now."
- Not closed — residual flicker remains and the engine-behavior hypotheses above are untested.
- **Acceptance criterion**: complete elimination would require either (a) a comprehensive `mod.AddUIText` → `modlib.ParseUI` audit across the entire dialog build, or (b) restructuring `createTeamSwitchUI` to use one big nested-tree `modlib.ParseUI` call (Conquest pattern). Either is a meaningful refactor; weighed against current user-acceptable visual quality.

---

## Fixed Bugs (Historical)

Versions v0.631–v0.638 shipped a series of substantive Conquest ports that closed several cosmetic engine-log classes. Each is documented in `src/Changelog.ts`:

| Version | Issue Class | Conquest Ref | Status |
| --- | --- | --- | --- |
| v0.631 | `mod.UndeployPlayer` cosmetic engine log on already-undeployed players | CQ_Bug_36/39 (v1.071) | Closed (4 callsites wrapped via `safeUndeployPlayer`) |
| v0.632 | Stale Player ref to `mod.Message` ("Received undefined values" class) | CQ_Bug_94 family | Closed (`getUiSafePlayerMessage` helper + roster-validity guard) |
| v0.632 | Post-deploy `GetSoldierState` race | Conquest deploy-settle pattern | Closed (`DEPLOY_SETTLE_GRACE_SECONDS` + `deployedAtSecondsByPid` stamp) |
| v0.633 | `mod.RemoveEquipment` on empty gadget slots ("Received undefined values" class) | CQ_Bug_84 (v1.341) + #94 (v1.448) | Closed (dropped RemoveEquipment; AddEquipment clobbers cleanly) |
| v0.633 | Roundend loop running pregame-only functions | — (Helis-specific) | Closed (added phase + cleanupActive gates) |
| v0.634 | Stale Player ref as format arg ("Received undefined values" class) | CQ_Bug_94 family | Closed (`safePlayerArg` helper at 14 callsites) |
| v0.635 | `vehicleSpawned` broadcast with NaN coords ("Received undefined values" class) | Conquest gates behind `FEATURE_PERF_DIAG` | Closed (broadcast dropped) |
| v0.636 | `safeSetUITextLabel` undefined-label crash | CQ_Bug_18 (v0.764) | Closed (hardened wrapper) |
| v0.637 | 57 direct `mod.SetUITextLabel` callsites bypassing the safe wrapper | CQ_Bug_18 second-half | Closed (mass migration) |
| v0.638 | `GetSoldierState ... player not being deployed` engine log on death | CQ_Bug_37/38 (v1.074) | Reduced-to-residual (see H_Bug_2 above) |
| v0.646 | `arrayContainsVehicle` / `arrayRemoveVehicle` undefined-array crash | CQ_Bug_42 (v1.073) | Closed (defensive guards added; did not resolve H_Bug_1 specifically but is a strict improvement) |
| v0.647 | `getRegisteredVehicleCount` (clock.ts) + `registerVehicleToTeam` (vehicles.ts) undefined-array passes | CQ_Bug_42 family extended | Closed (defensive guards added; did not resolve H_Bug_1 specifically but is a strict improvement) |

---

## Investigation Notes For Future Sessions

When picking up `H_Bug_1` again:

1. **Read this file first** to avoid re-trying the 5 already-ruled-out hypotheses.
2. **Read `src/Changelog.ts` v0.639–v0.647** for the detailed trace of each attempt and the runtime evidence used to rule each one out.
3. **Most promising untried approach**: world-log probe with pre-registered string keys (see `H_Bug_1` "Fix" section). Requires ~5 string-key additions to `src/strings.json` (user approval needed). This works around the MP "console behind menus" UX constraint by surfacing stamps in the in-game world log.
4. **Default to OPEN unless source is identified by runtime evidence, not static analysis.** Four static-analysis-based fixes failed; we need a runtime signal to converge.
5. **Defensive guards are not the fix path here.** The defensive guards from v0.646 + v0.647 are good (they fix latent issues), but adding more speculative guards is unlikely to address the user's specific symptom without first identifying the actual call site.

When picking up `H_Bug_3` again:

1. **Read this file's H_Bug_3 entry** to avoid re-trying the 4 already-shipped approaches (atomic reveal / post-construction hide / refresh order / `modlib.ParseUI` conversion).
2. **Read `src/Changelog.ts` v0.693–v0.696** for the detailed trace of each fix attempt and what was ruled out.
3. **Most promising untried approaches** (in order of expected ROI):
   - Audit every `mod.AddUIText` call in `createTeamSwitchUI` + `ensureAdminPanelWidgets` and convert any with empty/placeholder initial text to `modlib.ParseUI({type: "Text", visible: false, ...})`. v0.696 only converted the 192 roster widgets — there may be others.
   - Audit refresh callsites that fire AFTER the atomic reveal (`teamSwitchInteractPointActivated:102` calls `renderReadyDialogForViewer` post-reveal). Move all text/visibility updates BEFORE `finalizeReadyDialogVisibility`.
   - Try restructuring the dialog body into one big nested-tree `modlib.ParseUI({children: [...]})` call matching Conquest's atomic-commit pattern. Larger refactor but eliminates the build-window race entirely.
4. **Don't try post-construction `SetUIWidgetVisible(false)` fixes** — v0.694 proved that's racy in this engine. Always build hidden via `modlib.ParseUI({visible: false})`.
5. **No cross-game persistence** — every map load is fresh. Don't waste cycles investigating "stale state from previous run" hypotheses for this bug.
