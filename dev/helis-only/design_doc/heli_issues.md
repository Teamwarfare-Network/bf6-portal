# Helis Issues

Last Updated: 2026-05-29 (v0.647)
Last Tested Build: `v0.647` — MP server, 2 "Received undefined values as arguments" engine errors still fire on player join. 4 fix attempts (v0.645 wait, v0.646 CQ_Bug_42 helpers, v0.647 extended CQ_Bug_42 guards) did NOT resolve. Issue parked as OPEN — see `H_Bug_1`.

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
