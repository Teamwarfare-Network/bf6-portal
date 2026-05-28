## Helis-Only Issues & Risks Design Doc

*Draft generated 2026-05-25 against Helis v0.630. Revised 2026-05-25 to lead with mission-critical crash-class items. Pending human review.*

This document catalogues the risks and likely bugs present in Helis-only.

> **Read order, by priority**:
> - **Section 0 — MISSION-CRITICAL: Crash-Class Bugs (leads this doc)** — issues that Conquest experienced as actual server crashes / script termination, and where Helis has the same code shape. Cite source: [conquest_issues_summary.md](../../conquest/design_doc/conquest_issues_summary.md) #109, #94, #40, #84, #36, #105, plus the project memory `project_engine_event_reliability_asymmetric`.
> - **Sections A / B / C / D** — secondary findings: cleanup, lower-severity bugs, risk areas, developer punchlist.

It is organized as: (**Section 0**) **mission-critical** crash-class bugs ported from Conquest (this is where the actual evidence lives), (A) issues identified by **static analysis** of the Helis source itself, (B) lower-severity issues ported from Conquest, (C) **risk areas** — patterns that warrant inspection or instrumentation, (D) developer's own punchlist.

Each entry uses the same template:
- **Symptom** — what the bug looks like (player-facing or developer-facing).
- **Where** — file:line citations.
- **Why** — what the underlying defect is.
- **Likelihood** — High / Medium / Low / Unknown.
- **Severity** — Critical / High / Medium / Low.
- **Fix sketch** — what the patch would look like (without writing it).
- **Conquest cross-ref** — the analogous Conquest issue, if any.

Numbered issues use the prefix `H-` (Helis) to distinguish from Conquest `CQ_*`.

For prioritized action with effort/value scoring, see [heli_improvement_plan.md](./heli_improvement_plan.md).

---

# Section 0 — MISSION-CRITICAL: Crash-Class Bugs Ported from Conquest

**These are the issues that should drive the next sprint of Helis work.** Each one corresponds to a confirmed Conquest production failure where Helis has the same code shape. Severity, likelihood, and evidence are weighted heavily because Conquest already paid for the discovery.

The shared root cause connecting most of these: **per-pid heap allocation + engine error-log allocation accumulates** until the JS Mod Evaluator terminates the script. Conquest #109 documented this: *"Mod Evaluator terminated script at load during a 16-player MP playtest with the JS heap limit error."* Conquest #94 documented the multiplier: *"Impact NOT cosmetic — engine log allocations contributed to the same heap pressure that crashed at 16p in #109."*

Helis hasn't crashed yet **because it hasn't been played at 16+ concurrent players.** The code shapes that cause the crash are present. Whether Helis ever needs to scale to 16+ players is the user's call; whether it would crash if it tried is not in question.

## 0.1 — Eager per-pid UI prebuild (Conquest #40 + #109 family) — **MISSION-CRITICAL**

- **Symptom (Conquest evidence)**: At 16 concurrent players in a Conquest MP playtest, the JS Mod Evaluator terminated the script with a heap limit error at load time. Wave 3 (v1.409–v1.419) targeted per-pid eager allocations directly. Per-pid heap shape collapsed substantially more than the 30 KB bundle delta. Conquest had a separate frame-time breach #40 from `prebuildAllUiFamiliesHidden` running concurrently across simultaneous joiners (>1000 ms mod eval).
- **Where in Helis**:
  - [src/index.ts:195](../src/index.ts#L195) — `OnPlayerJoinGame` calls `ensureHudForPlayer(eventPlayer)` after 0.1 s wait. `ensureHudForPlayer` is the 1,812-line mega-builder ([src/hud.ts:936-2748](../src/hud.ts#L936)) that builds ~50–70 UIWidgets for the player.
  - [src/index.ts:399-407](../src/index.ts#L399) — `OngoingPlayer` warm-builds the Ready Dialog for every player on first tick: `createTeamSwitchUI(eventPlayer)` (~1,230 lines of widget creation in [src/ready-dialog.ts](../src/ready-dialog.ts)), then `deleteTeamSwitchUI(eventPlayer)` to hide it. **Every single connected player goes through this exactly once.** This is the equivalent of Conquest's deleted `prebuildAllUiFamiliesHidden`.
- **Why it crashes**:
  - At N=16: ~16 × (70 + ~80 ready-dialog) ≈ ~2,400 widgets allocated up front.
  - At N=24: ~3,600 widgets.
  - Each `mod.UIWidget` reference is held by `State.hudCache.hudByPid[pid].*` + the ~80 named widgets attached to the Ready Dialog tree.
  - The crash is at script-load eval time, not at runtime — Conquest's evidence is that the script never gets to run its first tick at 16p with eager prebuild.
  - Concurrent joiner frame-time breach is a separate failure mode in the same family: if multiple players join in the same engine frame, the synchronous prebuild work blows past the 1000 ms mod-eval budget.
- **Likelihood for Helis at current scale (≤8 players)**: Low — eager prebuild fits in heap budget.
- **Likelihood for Helis at 12+ players**: **High** — same code shape as Conquest pre-Wave-3.
- **Likelihood for Helis at 16+ players**: **Crash-class certain** unless lazy-build is adopted.
- **Severity**: **Critical** (script termination — game mode dead).
- **Fix sketch**:
  1. **Step 1 (low effort, high value)** — Delete the Ready Dialog warm-build from `OngoingPlayer` at [src/index.ts:399-407](../src/index.ts#L399). Build the Ready Dialog on first interaction instead (`teamSwitchInteractPointActivated` in [src/team-switch.ts](../src/team-switch.ts) is the natural site). This alone cuts ~half of the per-pid eager build cost and replicates Conquest's Wave 3 Ship 8 deletion of warm-prime.
  2. **Step 2 (high effort, defers further)** — Port Conquest's lazy-build framework to defer `ensureHudForPlayer` sub-panels until first use (victory dialog, round-end dialog, settings summary built only when needed). This is the "really big" version. Recommend gating on Step 1's measurement: ship Step 1, do MP playtest at 8p+12p; if heap pressure still observed, do Step 2.
  3. **Step 3 (medium effort)** — Add a stagger to `OnPlayerJoinGame` HUD-build to mitigate concurrent-join frame-time breach (Conquest #40 v1.104 pattern).
- **Conquest cross-ref**: **#40 (v1.104)** + **#109 (v1.406 → Wave 3 v1.409–v1.419)** + warm-prime deletion in **#33 (v1.418 Ship 8)**. Wave 3 plan files: [4.27.26_conquest_wave_3_plan.md](../../conquest/design_doc/4.27.26_conquest_wave_3_plan.md).
- **Improvement plan item**: **P0-1** (see [heli_improvement_plan.md](./heli_improvement_plan.md)).

## 0.2 — Undeployed-player API call family (Conquest #35/#36/#37/#38/#50/#84) — **MISSION-CRITICAL**

- **Symptom (Conquest evidence)**: Each unguarded call to a deploy-state-sensitive engine API generates an engine error log when the player is not in the right state. Individual calls are "cosmetic" (no functional break). **In aggregate they allocated enough JS heap to contribute to the #109 16-player crash** (Conquest #94 made this explicit). Affected APIs: `UndeployPlayer`, `EnableAllInputRestrictions`, `GetSoldierState`, `GetPlayerVehicleSeat`, `GetVehicleFromPlayer`, `RemoveEquipment`.
- **Where in Helis** (specific findings from the 2026-05-25 audit):

  **0.2.a — `mod.UndeployPlayer` called without `isPlayerDeployed` guard**
  - [src/team-switch.ts:185, 188](../src/team-switch.ts#L185) — `forceUndeployPlayer` calls `mod.UndeployPlayer` twice (0.05 s gap) checking only `mod.IsPlayerValid`. **Not** checking `isPlayerDeployed`. **Not** wrapped in try/catch. **High risk** — every team-switch attempt on an already-undeployed player generates an engine error log.
  - [src/round-flow.ts:225](../src/round-flow.ts#L225) — `scheduleRoundEndCleanup` undeploy loop is properly wrapped in try/catch + checks `IsPlayerValid` + `isPidDisconnected`. **Safe** — but missing the explicit `isPlayerDeployed` precheck would still log even with try/catch (the engine log fires *before* the JS exception, per the Conquest #39 pattern).
  - [src/index.ts:305](../src/index.ts#L305) — `deferForcedUndeploy` properly wrapped in try/catch + checks `IsPlayerValid`. Same caveat as above.
  - **Fix**: Add `if (!isPlayerDeployed(player)) return;` guard at the top of each call site. Pattern matches Conquest #36 v1.071 fix.

  **0.2.b — `mod.RemoveEquipment` without `isSlotEmpty` precheck**
  - [src/index.ts:332-333](../src/index.ts#L332) — `OnPlayerDeployed` calls `mod.RemoveEquipment(eventPlayer, mod.InventorySlots.GadgetOne)` then `GadgetTwo` unconditionally. Player just deployed, so deploy state is OK, but the slot may already be empty (first life, prior teardown, etc.).
  - **Conquest #84 fixed this exact pattern**: *"Not observed since v1.341 `isSlotEmpty` precheck gate."* The engine logs an error on RemoveEquipment for an empty slot.
  - **Impact in Helis**: 2 engine log allocations per player deploy × N players × frequency of redeploys. Compounds in long matches.
  - **Fix**: Add `if (mod.HasEquipment(eventPlayer, mod.InventorySlots.GadgetOne)) mod.RemoveEquipment(...)` precheck. Or replace the remove-then-add pattern entirely with a single conditional `AddEquipment` (AddEquipment clobbers cleanly per the Conquest v1.448 finding for #94).

  **0.2.c — `mod.GetPlayerVehicleSeat` without try/catch or isPlayerDeployed check**
  - [src/index.ts:444](../src/index.ts#L444) — `isVehicleEmptyForEntry` calls `mod.GetPlayerVehicleSeat(enteringPlayer)` directly. Called from `OnPlayerEnterVehicle`. Conquest #37 documented this throws during the deploy→vehicle-enter transition window.
  - **Fix**: Wrap in try/catch with fallback `return true` (treat as "empty for entry" if seat query fails). Matches Conquest v1.076 cache-guard fix.

  **0.2.d — `mod.GetVehicleFromPlayer` ALREADY properly guarded**
  - [src/overtime.ts:763-767](../src/overtime.ts#L763) — wrapped in try/catch. **Safe.**

  **0.2.e — `mod.GetSoldierState` ALREADY routed through `safeGetSoldierState*` helpers**
  - Only direct call sites are in the safe wrappers at [src/state.ts:207, 221](../src/state.ts#L207). The wrappers check `isPlayerDeployed` first AND auto-flip `deployedByPid` to false on engine error. **Safe** — the safe-wrapper pattern is the right Conquest port (predates #50 fix). Verify all soldier-state reads route through the wrappers, no direct `mod.GetSoldierState` slipped through.

- **Likelihood**: Cumulative — every leaked engine log adds heap pressure. Each individual misuse is cosmetic; collectively they're the slow-burn that fills the bucket.
- **Severity**: **High** (heap pressure contributor to crash-class #109 family).
- **Fix sketch**:
  1. Add `isPlayerDeployed` precheck guard helper (could be a single `safeUndeployPlayer(player)` wrapper) and apply to all `mod.UndeployPlayer` sites.
  2. Add `isSlotEmpty` precheck wrapper or `hasEquipmentInSlot(player, slot)` check before every `mod.RemoveEquipment`.
  3. Wrap `mod.GetPlayerVehicleSeat` in `safeGetPlayerVehicleSeat(player)` helper.
  4. Audit every `mod.GetSoldierState` call site — confirm all route through `safeGetSoldierStateBool` / `safeGetSoldierStateVector`.
- **Conquest cross-ref**: **#36 (v1.071)** UndeployPlayer guard. **#37 (v1.076)** + **#38 (v1.076)** vehicle query guards. **#50 (v1.148)** GetSoldierState guard. **#84 (v1.341)** + **#94 (v1.447–v1.448)** RemoveEquipment / equipment-slot probe fixes.
- **Improvement plan item**: **P0-2**.

## 0.3 — `OnPlayerEnterVehicle` event-drop + cumulative log spam (Conquest memory `project_engine_event_reliability_asymmetric`) — **HIGH**

- **Symptom**: Source comment at [src/index.ts:440](../src/index.ts#L440) self-flags this handler: *"Code Cleanup: Known fragility — we need to refactor or identify a different method entirely as OnPlayerEnterVehicle is error prone."* Conquest project memory documents that `OnPlayerEnterVehicle` drops events under load; `OnPlayerExitVehicle` is reliable. When the enter event drops:
  - Vehicle is in play but not registered to either team.
  - Destroying it awards no score.
  - The 2× `sendHighlightedWorldLogMessage` broadcast inside the handler still fires (because it's gated on the team-number check, which succeeds), but the underlying registration is missing.
- **Where**: [src/index.ts:454-557](../src/index.ts#L454) — `OnPlayerEnterVehicle` body, plus the spawn-time fallback registration in [src/index.ts:572-663](../src/index.ts#L572) `OnVehicleSpawned`.
- **Why heap-relevant**: The handler does 2× `mod.GetVariable(regVehiclesTeam{1,2})` + 2× `mod.SetVariable` per registration. Under event-drop conditions, the script may attempt registration on transitions that never complete, allocating engine arrays repeatedly. Compounds with #94's "engine log allocation accumulates heap pressure" mechanism.
- **Likelihood**: Confirmed in Conquest under MP load. Helis likely has the same behavior but un-stress-tested.
- **Severity**: **High** (vehicle scoring correctness is core gameplay; heap-pressure contributor at MP scale).
- **Fix sketch**:
  1. **Defense-in-depth via reconciliation poll**: in `pollVehicleSpawnerSlots` (already 1 Hz), walk `mod.AllVehicles()`, check each is in one of the registries, re-register from `vehicleSpawnBaseTeamByObjId` cache if missing. Bounded cost (≤16 vehicles); recovers from any event drop within 1 s.
  2. **Tighten the handler**: cache the registration team per-vid in a `Map<vid, TeamID>` so the handler can early-return if already correctly registered (skip the 4 `GetVariable / SetVariable` calls).
- **Conquest cross-ref**: Conquest's solution was wave-spread; the reconciliation pattern is the load-bearing fix. Memory `project_engine_event_reliability_asymmetric`.
- **Improvement plan item**: **P0-3**.

## 0.4 — `mod.SetRedeployTime` may apply globally (Conquest memory `respawn_redeploy_timer_polish`) — **MEDIUM-HIGH**

- **Symptom**: Conquest project memory: *"Late-joiner `SetRedeployTime` may affect all players; verify one-shot vs persistent; retune HQ deploy retries."* Conquest never fully resolved this — listed as ongoing watch item #76.
- **Where in Helis**: [src/team-switch.ts:212](../src/team-switch.ts#L212) — `processTeamSwitch` calls `mod.SetRedeployTime(eventPlayer, ROUND_END_REDEPLOY_DELAY_SECONDS)` immediately before `forceUndeployPlayer`. If the engine applies SetRedeployTime globally rather than per-player, every other player's redeploy timer also extends to `ROUND_END_REDEPLOY_DELAY_SECONDS` (10 s).
- **Likelihood**: Unknown — depends on engine version. Worth verifying empirically.
- **Severity**: Medium-High if it's actually global (would cause cascading 10 s delays after every team switch).
- **Fix sketch**:
  1. Add a 1-line probe: before the call, log each connected player's current redeploy time (if queryable); after the call + 0.1 s wait, log again. Compare. (Use the persistent-HUD-overlay diagnostic pattern from AGENTS.md, not world log.)
  2. If confirmed global: remove the call entirely; let team-switch use the engine default redeploy.
- **Conquest cross-ref**: Memory `respawn_redeploy_timer_polish` + Conquest #76 (open).
- **Improvement plan item**: **P0-4** (verification first; fix conditional on findings).

## 0.5 — Late-joiner crash during pre-game config + concurrent action (Conquest #105) — **HIGH**

- **Symptom (Conquest evidence)**: *"Hard server crash during late-joiner + Apply Config + team-swap combo."* Fixed via `warmPrimeActiveByPid` flag refusing Apply during any pid's mid-warm. Later fix mechanism was removed in v1.418 Ship 8 when the underlying loading-gate machinery was deleted; the new line of defense is the lazy-build dispatcher's per-surface in-flight guard.
- **Where in Helis**: 
  - [src/index.ts:181-243](../src/index.ts#L181) — `OnPlayerJoinGame` does its eager HUD prebuild after a 0.1 s wait, then another 0.1 s wait, then re-renders the Ready Dialog.
  - If a teammate confirms a Ready Dialog change (`confirmReadyDialogModeConfig` in [src/ready-dialog.ts](../src/ready-dialog.ts)) during that window, **and** the matchup change triggers `applyMatchupPresetInternal` which mutates spawner state and re-renders dialogs, the joiner's incomplete HUD build can interleave unsafely.
  - Helis does not have Conquest's per-pid in-flight guard.
- **Likelihood**: Unknown — Helis hasn't been MP-stress-tested with concurrent late-joiners + admin actions.
- **Severity**: **High** (crash-class if reproducible).
- **Fix sketch**:
  1. Add `State.players.joinInProgressByPid: Record<number, boolean>` set true at the top of `OnPlayerJoinGame`, cleared after the second-pass HUD render.
  2. In `confirmReadyDialogModeConfig` and `applyMatchupPreset`, if any pid has `joinInProgress`, defer the action by 0.2 s and retry once.
- **Conquest cross-ref**: **#105 (v1.382)**, then mechanism replaced in v1.418 Ship 8 by lazy-build per-surface in-flight guard.
- **Improvement plan item**: **P0-5**.

## 0.6 — Ready state auto-cleared on deploy and HQ-exit (Conquest #58) — **HIGH (UX-class, but cluttered enough to mask other bugs)**

- **Symptom**: Player presses READY in the dialog. Round is not yet live. Player dies, walks out of main base, or admin redeploys — `readyByPid[pid]` is auto-cleared. Player has to re-READY repeatedly during pre-game cycling.
- **Where in Helis**:
  - [src/index.ts:345](../src/index.ts#L345) — `OnPlayerDeployed` unconditionally sets `State.players.readyByPid[pid] = false`.
  - [src/index.ts:872-880](../src/index.ts#L872) — `OnPlayerExitAreaTrigger` on `!isRoundLive()` sets `readyByPid[pid] = false`.
- **Why "mission-critical"**: Not a crash but a confidence-class bug — when a player presses READY 5 times in a row and it keeps reverting, **other bugs become hard to triage** because users blame everything on "the ready system is broken." Conquest #58 was fixed because it was masking other pre-game bugs. Same case applies to Helis.
- **Likelihood**: Confirmed by code inspection.
- **Severity**: **Medium** (functional UX bug) but **High** in its impact on user trust + bug-triage signal-to-noise.
- **Fix sketch**: Per Conquest v1.445:
  1. Delete `readyByPid = false` from `OnPlayerDeployed`.
  2. Delete `readyByPid = false` from `OnPlayerExitAreaTrigger` pre-live branch.
  3. Auto-unready triggers reduce to: SWAP TEAMS + admin config Confirm.
- **Conquest cross-ref**: **#58 (v1.445)** via [5.02.26_conquest_ready_tuning_plan.md](../../conquest/design_doc/5.02.26_conquest_ready_tuning_plan.md).
- **Improvement plan item**: **P0-6**.

## 0.7 — Vehicle spawn sequence can stall and lock out matchup changes (self-flagged, Conquest #69 family) — **HIGH**

- **Symptom**: Source comment at [src/vehicles.ts:280](../src/vehicles.ts#L280): *"Consider hardening: If a spawn sequence stalls, `spawnSequenceInProgress` can remain true and block matchup changes."* If the engine drops one of the spawn events in a sequential spawn batch, `State.vehicles.spawnSequenceInProgress` latches true forever and **every subsequent matchup change is silently blocked** (`applySpawnerEnablementForMatchup` returns early when `isRoundLive()`, but the lock-out path through the spawn sequence has no escape).
- **Where**: [src/vehicles.ts:281-303](../src/vehicles.ts#L281) `queueSequentialSpawns` / `runSequentialSpawns`.
- **Why heap-relevant**: Stalled sequences keep `expectingSpawn` slots in a half-bound state; subsequent spawn attempts trigger fallback binding paths that allocate Map entries and engine arrays.
- **Likelihood**: Medium — engine event reliability is asymmetric; spawn-event drop is plausible.
- **Severity**: **High** — once it stalls, the match is effectively broken for matchup tuning.
- **Fix sketch**:
  1. Watchdog timer: stamp `spawnSequenceStartedAt`. If `now - spawnSequenceStartedAt > 10 s` AND `spawnSequenceInProgress === true`, force-clear (`spawnSequenceInProgress = false; spawnSequenceToken += 1`).
  2. Optionally surface a one-shot world-log warning when the watchdog fires.
- **Conquest cross-ref**: Conquest's vanilla-spawner rewrite (**#69 v1.261**) addressed a related class of issues.
- **Improvement plan item**: **P0-7**.

## 0.8 — Per-pid map proliferation (heap-pressure contributor at MP scale) — **MEDIUM-HIGH**

- **Symptom**: `State.players` has **14 separate `Record<number, T>` maps** for per-pid state, plus **7 separate `joinPrompt*ByPid` maps**, plus the static `InteractMultiClickDetector.STATES: Record<number, …>` outside `State`. Each map allocates its own hashmap header (~constant cost) and grows as players join. **`OnPlayerLeaveGame` already missed one cleanup site** (the InteractMultiClickDetector static — A1 below).
- **Why heap-relevant**: Each `Record<number, T>` is a JS object with its own internal storage. At N=24, that's 22+ objects holding ~24 entries each, plus the hashmap overhead per object. Individually small; collectively part of the per-pid footprint that contributes to #109.
- **Where**: [src/state.ts:938-958](../src/state.ts#L938) `players: { …14 maps… }` + `joinPrompt*` family.
- **Likelihood**: Confirmed structure.
- **Severity**: Medium individually; High in aggregate as a heap-pressure contributor + as a **maintenance landmine** — missed cleanup sites are how leaks land.
- **Fix sketch**: Consolidate into one `Record<pid, PerPlayerState>` struct. Disconnect cleanup becomes `delete State.players.byPid[pid]`. Single point of truth; impossible to miss a per-pid field on cleanup.
- **Conquest cross-ref**: Conquest's Wave 3 (`readyDialogData_t` lost 18 fields, `warmPrimeActiveByPid` removed, ~30 `hud-warm-state.ts` accessors deleted) collapsed per-pid heap shape substantially more than the bundle delta.
- **Improvement plan item**: **P0-8**.

---

# Section A — Lower-Severity Issues identified by static analysis of Helis source

> Section 0 above contains the crash-class items. This section is the secondary findings.


## A1. Triple-tap detector state leaks across player disconnects

- **Symptom**: A pid that was used by a disconnected player and is later reused by a new joiner could inherit stale triple-tap state (e.g., `clickCount: 2` from the prior player), causing the new player's first interact-key press to register as a triple-tap and immediately summon a team-switch InteractPoint.
- **Where**: [src/utils.ts](../src/utils.ts) — `InteractMultiClickDetector.STATES: Record<number, {…}>` is **never cleared on `OnPlayerLeaveGame`**. The class is static-only and has no remove method. `OnPlayerLeaveGame` deletes ~14 per-pid maps in `State.players.*ByPid` but does not touch this static record.
- **Why**: Single missed cleanup site. The detector was probably added independently of the central player-leave cleanup pass.
- **Likelihood**: Medium. Engine pid reuse pattern unknown without playtest; in many engines pids are monotonically incremented and never reused within a session, in which case this is a non-issue at session scope but still a small leak over time.
- **Severity**: Low (potential UX glitch; not a crash).
- **Fix sketch**: Add `static clearForPid(pid: number): void { delete InteractMultiClickDetector.STATES[pid]; }` and call it from `OnPlayerLeaveGame` next to the existing `delete State.players.*[pid]` block.
- **Conquest cross-ref**: None directly — Conquest does not have an exact analog because triple-tap interact is Helis-specific.

## A2. `ensureHudForPlayer` is a 1,812-line mega-function with no internal lifecycle separation

- **Symptom**: Single function in [src/hud.ts:936-2748](../src/hud.ts#L936). Self-flagged in source: *"Code Cleanup: This is an absurd mega-function — we should refactor and break down"*. Issues this causes:
  - Hard to PR-review; any change touches a 2-page diff context.
  - Cached fast-path runs adjustments (resize/reposition help/ready/admin counter) on every call, including build calls — meaning some positions are reapplied on every `ensureHudForPlayer` invocation regardless of whether they changed.
  - No clear "what is build-once, what is reapply-each-call" contract.
- **Where**: [src/hud.ts:936](../src/hud.ts#L936).
- **Why**: Organic growth. Likely started as a small builder and accreted features without a refactor pass.
- **Likelihood**: N/A — this is a maintainability issue, not a runtime bug.
- **Severity**: Medium (development velocity).
- **Fix sketch**: Split into (a) `buildHudWidgets(pid, player)` — one-time builder; (b) `applyHudLayout(pid)` — idempotent layout adjustments that run on every cached-fast-path; (c) one helper per sub-panel (`buildUpperLeft`, `buildSettingsSummary`, `buildTopCenter`, `buildVictoryDialog`, `buildRoundEndDialog`, `buildSpawnDisabledWarning`, `buildHelpAndReady`). See improvement plan item C1.
- **Conquest cross-ref**: Conquest's [ui/conquest/hud-core/](../../conquest/src/ui/conquest/hud-core/) shows the modular shape after the same refactor.

## A3. `OnPlayerEnterVehicle` flagged as "Known fragility — error prone"

- **Symptom**: Self-flagged in source comment at [src/index.ts:440](../src/index.ts#L440): *"Code Cleanup: Known fragility - we need to refactor or identify a different method entirely as OnPlayerEnterVehicle is error prone."*
- **Where**: [src/index.ts:440](../src/index.ts#L440)–557.
- **Why**: The function does a lot:
  - 2× `mod.GetVariable(regVehiclesTeam{1,2})` for membership check.
  - `getLastDriver` linear scan of `vehIds[]`.
  - `mod.GetObjId` × 2.
  - Possibly `mod.GetObjectPosition` + `inferBaseTeamFromPosition` if no prior owner.
  - `registerVehicleToTeam` (which itself does 2× `mod.SetVariable` + 2× `mod.GetVariable` for the remove-from-both pattern).
  - 2× `sendHighlightedWorldLogMessage` (T1 + T2 broadcast).
  - `handleOvertimePlayerEnterVehicle`.
  - **Engine drops `OnPlayerEnterVehicle` events under load** per Conquest project memory `project_engine_event_reliability_asymmetric`. If the registration message broadcasts but the underlying registration never lands, the state desyncs.
- **Likelihood**: Medium-High. Conquest has documented event-drop as observed behavior.
- **Severity**: High during MP load — vehicle scoring requires correct registration.
- **Fix sketch**: Two-fold defensive layer (Conquest's pattern):
  1. **Re-establish registration on `OnVehicleSpawned`** (already done in Helis — good).
  2. **Add a periodic reconciliation** on the 1 s spawner poll that walks `mod.AllVehicles()`, infers the team from cached `vehicleSpawnBaseTeamByObjId` or position, and re-registers if `arrayContainsVehicle` returns false for both registries.
  3. Consider **per-vehicle state cache** (`Record<vid, {team, ownerPid, lastEvent}>`) so we don't keep flipping `mod.GetVariable` arrays on every event.
- **Conquest cross-ref**: Memory `project_engine_event_reliability_asymmetric` notes this exact pattern; Conquest's defense is a heavier reconciliation pass.

## A4. 10 unused functions tagged `TODO(1.0): Unused; remove before final 1.0 release`

- **Symptom**: Dead code shipping in the bundle. Adds bundle bytes without benefit; risks accidental use in future patches.
- **Where**:
  - [src/round-flow.ts](../src/round-flow.ts) `broadcastGameplayNotificationKey`
  - [src/round-flow.ts](../src/round-flow.ts) `broadcastGameplayHighlightedStringKey`
  - [src/overtime.ts](../src/overtime.ts) `getActiveOvertimeAreaTrigger`
  - [src/overtime.ts](../src/overtime.ts) `getActiveOvertimeSector`
  - [src/overtime.ts](../src/overtime.ts) `getOvertimeProgressPercent`
  - [src/overtime.ts](../src/overtime.ts) `updateOvertimeGlobalHudForAllPlayers`
  - [src/overtime.ts](../src/overtime.ts) `ensureOvertimeGlobalHudForPlayer`
  - [src/overtime.ts](../src/overtime.ts) `buildRemainingTimeMessage`
  - [src/overtime.ts](../src/overtime.ts) `shouldShowOvertimeUnlockMessageForPlayer`
  - [src/ready-dialog.ts](../src/ready-dialog.ts) `applyCustomAircraftCeilingHardLimiter` + 3 helpers
  - [src/ready-dialog.ts](../src/ready-dialog.ts) `resetReadyDialogVehicleOverrides` ("Deprecated by Fresh Respawn Setup button")
- **Why**: Dev never circled back. Some were stubs for features that landed elsewhere; some were superseded.
- **Likelihood**: N/A — present in code.
- **Severity**: Low (bundle bloat; ~1–5 KB net).
- **Fix sketch**: Delete them. If any helper is still referenced indirectly, the bundler/TS compile will catch it. See improvement plan item A2.
- **Conquest cross-ref**: Conquest does its own dead-code passes at wave milestones; same workflow.

## A5. Two disabled overtime functions with commented bodies

- **Symptom**: Dead code paths that no longer fire but are still in the bundle.
- **Where**:
  - [src/overtime.ts](../src/overtime.ts) `enterOvertimeNoticeStage` — body commented out: *"2:30 notice message disabled (visibility now handled at half time)"*.
  - [src/overtime.ts](../src/overtime.ts) `maybeSendOvertimeUnlockReminder` — first line is `return;` then the rest is dead.
- **Why**: Intentional disable while keeping the structure visible.
- **Likelihood**: N/A.
- **Severity**: Low.
- **Fix sketch**: Either delete the functions and their call sites, or replace the bodies with a single comment "intentionally disabled; was the 2:30 notice / unlock reminder feature". Decide whether the feature might come back; if no, delete. See improvement plan item A2.

## A6. Two "deprecated v0.5 UI" preserved code paths

- **Symptom**: Code in [src/team-switch.ts:350-353](../src/team-switch.ts#L350) and [src/team-switch.ts:562-564](../src/team-switch.ts#L562) marked *"Deprecated UI (v0.5): … button removed from the dialog. This handler path is intentionally retained…"*.
- **Where**: As above.
- **Why**: Dev retained the handler in case the button comes back.
- **Likelihood**: N/A.
- **Severity**: Low.
- **Fix sketch**: Decide policy. If keeping, gate behind a clear `// preserved: see commit XXX for why` comment with a link. If not, delete. Same as A4/A5.

## A7. `safeFindPlayer` linear scan in hot paths

- **Symptom**: `safeFindPlayer(pid)` in [src/state.ts:625](../src/state.ts#L625) does `mod.AllPlayers()` + `mod.CountOf()` + linear scan + `mod.GetObjId` per candidate. Called from `updateHelpTextVisibilityForPid` (which runs in the per-tick help-text path), `handleOvertimePlayerLeaveById`, and several other per-pid functions.
- **Where**: [src/state.ts:625](../src/state.ts#L625) and ~12 call sites.
- **Why**: No cached player lookup. Every call does O(N) engine work.
- **Likelihood**: Confirmed at runtime — it's not a bug, it's a perf hit.
- **Severity**: Medium at higher player counts (scales as N² when called from a `forAllPlayers` helper).
- **Fix sketch**: Use the tick-context pattern (see [heli_v_conquest_comp.md](./heli_v_conquest_comp.md) Section 3.2) so `safeFindPlayer` walks the cached snapshot. Alternative: cache `Player` ref on `OnPlayerJoinGame` and remove on `OnPlayerLeaveGame`. See improvement plan item B2.
- **Conquest cross-ref**: Conquest R33 (safeFindPlayer caching) + G2/G3 (tick-context wrapping).

## A8. `applyAutoReadyForAllPlayers` runs every 1 s during NotReady

- **Symptom**: Master loop calls `applyAutoReadyForAllPlayers` unconditionally every 1 s. The function iterates every active player, reads `IsInVehicle` + `IsPlayerInMainBaseForReady` (involves per-pid state read), conditionally flips `readyByPid`.
- **Where**: [src/index.ts:133](../src/index.ts#L133) (call site) + [src/ready-dialog.ts](../src/ready-dialog.ts) `applyAutoReadyForAllPlayers`.
- **Why**: Auto-ready needs to detect "player has entered vehicle in main base" without an explicit event. The `AUTO_READY_CHECK_INTERVAL_SECONDS = 3` constant exists but doesn't seem to be enforced — the loop runs every 1 s, and the check is throttled internally somewhere (or not).
- **Likelihood**: Medium — depends on whether the internal throttle is in place.
- **Severity**: Low-Medium (steady-state CPU during NotReady).
- **Fix sketch**: Audit the throttle. If `AUTO_READY_CHECK_INTERVAL_SECONDS` is supposed to be honored, gate the call in the master loop with `if (now - lastAutoReadyCheckAtSeconds >= 3)`. Currently `lastAutoReadyCheckAtSeconds` is defined as a module-level let in [src/types.ts:28](../src/types.ts#L28) but search shows ambiguous usage.
- **Conquest cross-ref**: Conquest has explicit cadence gates for auto-ready equivalents.

## A9. `OnPlayerLeaveGame` does 14 individual `delete State.players.*[pid]` calls

- **Symptom**: Long block of repetitive deletes that's easy to forget when adding new per-pid state.
- **Where**: [src/index.ts:259-284](../src/index.ts#L259).
- **Why**: Each per-pid map is independently allocated; no central registry.
- **Likelihood**: N/A.
- **Severity**: Low (maintainability — already missed once: `InteractMultiClickDetector.STATES`, see A1).
- **Fix sketch**: Consolidate per-pid state into a single struct (`Record<pid, PlayerState>`) — then disconnect cleanup is `delete State.players.byPid[pid]`. See improvement plan item A1.
- **Conquest cross-ref**: Conquest decomposed its pid state into a smaller number of larger structs as part of Wave 3.

## A10. `OnGameModeStarted` calls `clearSpawnBaseTeamCache()` twice in a row

- **Symptom**: [src/index.ts:52-53](../src/index.ts#L52) — `clearSpawnBaseTeamCache()` is called on consecutive lines. No-op duplicate.
- **Where**: As above.
- **Why**: Either a copy-paste error or an intentional double-clear that's now redundant.
- **Likelihood**: Confirmed by inspection.
- **Severity**: Trivial.
- **Fix sketch**: Delete one of the calls. See improvement plan item A2.

## A11. World log used as the primary diagnostic surface

- **Symptom**: ~15+ `sendHighlightedWorldLogMessage` calls across vehicle registration, vehicle spawning, vehicle destruction, main-base entry/exit, etc. The world log:
  - holds at most 4 lines at once,
  - is unreliable under load (per Conquest project memory),
  - mixes player-facing messages and developer-facing diagnostics in the same surface.
- **Where**: Throughout `index.ts`, `vehicles.ts`, `round-flow.ts`, `utils.ts`.
- **Why**: Convenience — `mod.DisplayHighlightedWorldLogMessage` is the easiest way to surface state from script-side.
- **Likelihood**: Low for player-facing messages (gated by `ENABLE_GAMEPLAY_MESSAGES`); High for the debug-tagged ones (gated by `ENABLE_DEBUG_HIGHLIGHTED_MESSAGES = false`).
- **Severity**: Low (debug messages are off in production); Medium for the player-facing ones if the world log silently drops them under load.
- **Fix sketch**: Audit the calls. For each, decide:
  - Is it a player-facing gameplay message? Keep on world log.
  - Is it a debug-only diagnostic? Move to a `DisplayNotificationMessage` per-player surface (more reliable) gated behind the existing debug flag — OR delete if no longer useful.
- **Conquest cross-ref**: [conquest/AGENTS.md](../../conquest/AGENTS.md) "Debugging / Diagnostic Output Policy" — explicit policy that world log is not a diagnostic surface; rely on persistent HUD widget overlays or implicit verification.

## A12. `mod.Teleport` called twice in `applySpawnYawToVehicle`

- **Symptom**: [src/vehicles.ts:452-454](../src/vehicles.ts#L452) calls `mod.Teleport(eventVehicle, pos, yawRad)` → `await mod.Wait(0)` → `mod.Teleport(eventVehicle, pos, yawRad)`. Two teleports back-to-back.
- **Where**: As above.
- **Why**: Empirical workaround — first teleport sometimes "doesn't take" so a second one is fired after a tick. This is the same pattern Conquest landed for post-seat teleport in v1.333/v1.334.
- **Likelihood**: Pattern is in place because the bug exists.
- **Severity**: Low (workaround works; the underlying engine behavior is the bug).
- **Fix sketch**: Leave as-is unless engine fix lands. Add a comment explaining "double teleport intentional — first one is empirically unreliable for spawn yaw correction". Watch Conquest project memory for any update.
- **Conquest cross-ref**: Conquest #80, #83 (Air Deploy Jet regression) — same workaround family.

## A13. Vehicle ownership cache (`vehIds[]`/`vehOwners[]`) is parallel arrays with linear scans

- **Symptom**: Every `getLastDriver`, `setLastDriver`, `popLastDriver`, `clearLastDriverByVehicleObjId` linear-scans `vehIds[]`. At ~8 vehicles this is fine; at 32 (Conquest) it would be a hot-path cost.
- **Where**: [src/vehicles.ts:25-89](../src/vehicles.ts#L25).
- **Why**: Designed for small N; never refactored.
- **Likelihood**: N/A.
- **Severity**: Low at current Helis vehicle counts.
- **Fix sketch**: Replace with `Map<number, mod.Player>` keyed by vid. One-line refactor. See improvement plan item C3.

## A14. Hardcoded `OnPlayerLeaveGame` second-arg signature

- **Symptom**: [src/index.ts:250](../src/index.ts#L250) `OnPlayerLeaveGame(eventNumber: number | mod.Player)` accepts both a number and a Player, then runtime-checks via `mod.IsType`. The engine signature is presumably one or the other — defensive coding suggests the dev didn't know which.
- **Where**: As above.
- **Why**: Engine API uncertainty.
- **Likelihood**: N/A.
- **Severity**: Trivial.
- **Fix sketch**: Verify against `reference_bf6_core/` and remove the unused branch. Document the correct signature in `header-file.ts`.

## A15. `OvertimeStage.Notice` is dead code (stage transitions skip it)

- **Symptom**: `enterOvertimeNoticeStage` body commented out (see A5), and `updateOvertimeStage` likely never sets `stage = Notice`. The enum value `OvertimeStage.Notice = 1` exists in [src/types.ts:144](../src/types.ts#L144) but the transition is dead.
- **Where**: [src/types.ts:144](../src/types.ts#L144) + [src/overtime.ts](../src/overtime.ts) stage-transition functions.
- **Why**: Feature was disabled (per the source comment).
- **Likelihood**: N/A.
- **Severity**: Trivial.
- **Fix sketch**: Either remove `OvertimeStage.Notice` from the enum (renumber) or keep it for future use with a comment. See improvement plan item A2.

---

# Section B — Issues ported from Conquest bug history that apply to Helis

These are bugs Conquest fixed in code that Helis still has (because Helis predates the Conquest fork point or because Conquest's fix never came back).

## B1. Ready state auto-clears on deploy and on HQ exit (Conquest #58 fix not ported)

- **Symptom**: Player presses READY in the dialog. Round is not yet live. Player dies, walks out of main base, or admin redeploys them — `readyByPid[pid]` is auto-cleared without user action. Player has to re-READY. Confusing UX during pre-game cycling.
- **Where**:
  - [src/index.ts:345](../src/index.ts#L345) — `OnPlayerDeployed` unconditionally sets `State.players.readyByPid[pid] = false`.
  - [src/index.ts:872-880](../src/index.ts#L872) — `OnPlayerExitAreaTrigger` (main base exit, when `!isRoundLive()`) sets `State.players.readyByPid[pid] = false`.
- **Why**: Defensive over-clearing. The original intent was probably "you can't be ready if you're not deployed in main base" — but the proper place to enforce that is at the auto-start gate, not in event handlers that fire for non-pre-game reasons too.
- **Likelihood**: Confirmed by code inspection.
- **Severity**: Medium (UX friction; not a crash).
- **Fix sketch**: Per Conquest v1.445 fix:
  - Delete the `readyByPid = false` line from `OnPlayerDeployed`.
  - Delete the `readyByPid = false` block from `OnPlayerExitAreaTrigger` (and the broadcast that follows).
  - Auto-unready triggers reduce to two: SWAP TEAMS + admin config change.
- **Conquest cross-ref**: **Conquest #58** ([conquest_issues_summary.md](../../conquest/design_doc/conquest_issues_summary.md) line 121) — fixed v1.445 via [5.02.26_conquest_ready_tuning_plan.md](../../conquest/design_doc/5.02.26_conquest_ready_tuning_plan.md). Helis still has the original bug.

## B2. `getPlayerVehicleSeat` / `getVehicleFromPlayer` engine errors during deploy transitions (Conquest #37/#38)

- **Symptom**: Engine logs `getPlayerVehicleSeat` / `getVehicleFromPlayer` errors during the deploy → vehicle-enter transition window.
- **Where**: Anywhere Helis reads vehicle seat or vehicle-from-player without an in-flight cache guard. Look at `OnPlayerEnterVehicle` body and any soldier-state vehicle queries.
- **Why**: Engine queries fire before vehicle/seat state is committed.
- **Likelihood**: Medium — Helis hasn't been MP-stress-tested but the engine behavior is documented.
- **Severity**: Low (cosmetic log spam) unless it correlates with downstream desyncs.
- **Fix sketch**: Add proactive cache write before `mod.ForcePlayerToSeat` calls (none currently in Helis); wrap engine-vehicle queries in `safeGet*` helpers (some already exist).
- **Conquest cross-ref**: **Conquest #37, #38** — fixed v1.076 via cache-guard fix.

## B3. `UnspawnObject` cosmetic engine log (Conquest #39)

- **Symptom**: Engine logs warnings when `mod.UnspawnObject` is called on already-destroyed or invalid objects. Cosmetic but contributes to heap pressure under load.
- **Where**: All `mod.UnspawnObject` call sites in Helis — search [src/vehicles.ts](../src/vehicles.ts), [src/round-flow.ts](../src/round-flow.ts), [src/overtime.ts](../src/overtime.ts), [src/team-switch.ts](../src/team-switch.ts), [src/ready-dialog.ts](../src/ready-dialog.ts).
- **Why**: Engine doesn't tolerate `UnspawnObject` on stale handles.
- **Likelihood**: Confirmed pattern.
- **Severity**: Low.
- **Fix sketch**: Wrap every `UnspawnObject` call site in `try { } catch {}`. Conquest wrapped 14 sites.
- **Conquest cross-ref**: **Conquest #39** — mitigated v1.147.

## B4. `CountOf` on undefined arrays during disconnect race (Conquest #42)

- **Symptom**: A `CountOf(undefined)` engine call during a disconnect race window could throw and abort the in-flight broadcast.
- **Where**: Anywhere Helis does `mod.CountOf(mod.GetVariable(regVehiclesTeam{1,2}))` without checking for `undefined`. Search [src/vehicles.ts](../src/vehicles.ts) for `CountOf`.
- **Why**: Engine returns `undefined` for some queries in narrow race windows.
- **Likelihood**: Medium under load.
- **Severity**: Medium — could abort a broadcast and leave UI half-rendered.
- **Fix sketch**: Defensive null checks before `CountOf`. The `arrayContainsVehicle` / `arrayRemoveVehicle` helpers in [src/vehicles.ts:6-13](../src/vehicles.ts#L6) should null-guard their `arr` parameter too.
- **Conquest cross-ref**: **Conquest #42** — fixed v1.073.

## B5. Vehicle spawner stall — `spawnSequenceInProgress` latches true (self-flagged "Consider hardening")

- **Symptom**: If a sequential spawn sequence stalls (e.g., engine never fires `OnVehicleSpawned` for one of the spawn attempts), `State.vehicles.spawnSequenceInProgress` remains true and blocks future matchup changes.
- **Where**: [src/vehicles.ts:280](../src/vehicles.ts#L280) (source comment: *"Consider hardening: If a spawn sequence stalls, spawnSequenceInProgress can remain true and block matchup changes."*) and [src/vehicles.ts:281-303](../src/vehicles.ts#L281) `queueSequentialSpawns` / `runSequentialSpawns`.
- **Why**: No watchdog timer on the sequence.
- **Likelihood**: Medium — engine spawn events have asymmetric reliability.
- **Severity**: High when it happens — locks out matchup changes until next match.
- **Fix sketch**: Add a watchdog: timestamp the sequence start; if `Date.now() - sequenceStartedAt > SEQUENCE_TIMEOUT_MS`, set `spawnSequenceInProgress = false` and bump the cancel token. The token-cancellation pattern is already in place; just needs a timeout sweep.
- **Conquest cross-ref**: Conquest hardened this in the vanilla-spawner rewrite (v1.261) — Conquest #69.

## B6. Tight-map spawner cross-binding (self-flagged "Consider hardening")

- **Symptom**: On tight maps where spawn pads are close together, a delayed spawn event arriving after the token window can mis-bind to the wrong slot via the position-fallback path.
- **Where**: [src/vehicles.ts:290](../src/vehicles.ts#L290) (source comment: *"Consider hardening: Tight maps are vulnerable if a delayed spawn arrives after the token window; fallback binding may mis-bind."*) and the `bindSpawnedVehicleToSlot` function.
- **Why**: `VEHICLE_SPAWNER_BIND_TIMEOUT_SECONDS = 2.0` is the token window; outside it, the function falls back to position-based binding with `VEHICLE_SPAWNER_BIND_DISTANCE_METERS = 7.0`. On a map where two slots are within 14 m of each other, fallback could mis-bind.
- **Likelihood**: Low for current maps (slot pads are well-separated per `MAP_CONFIGS`).
- **Severity**: Medium when it happens — wrong vehicle bound to wrong slot means wrong respawn cadence.
- **Fix sketch**: Tighten `VEHICLE_SPAWNER_BIND_DISTANCE_METERS` to half the minimum inter-slot distance on the tightest map; or replace fallback with team-anchored bind (already half-implemented via `vehicleSpawnBaseTeamByObjId`).
- **Conquest cross-ref**: Conquest's spawner has the same shape and the same comment; they tightened the bind distance per-map.

## B7. Startup cleanup may miss late-spawned default vehicles (self-flagged "Consider hardening")

- **Symptom**: Default vehicles that spawn shortly after `startVehicleSpawnerSystem`'s startup cleanup pass aren't removed, and the configured slots end up with the default vehicle type instead of the intended one.
- **Where**: [src/vehicles.ts:552](../src/vehicles.ts#L552) (source comment: *"Consider Hardening with a second cleanup pass before first forced spawns if default spawns reappear after cleanup"*).
- **Why**: Engine spawns default vehicles before our spawner is fully configured.
- **Likelihood**: Low (the existing 1-pass cleanup + force-replace path in `OnVehicleSpawned` covers most cases).
- **Severity**: Medium when it happens — wrong vehicle type in slot.
- **Fix sketch**: Add a second cleanup pass after the matchup enable step, before the initial force-spawn loop.

## B8. Late-joiner crash during Apply Config + team-swap combo (Conquest #105 — uncertain if Helis has it)

- **Symptom**: Conquest documented a hard server crash when a late-joiner's HUD prebuild raced with an Apply Config + team-swap combo.
- **Where**: Helis has no Apply Config button — instead, mode config is confirmed via the Ready Dialog Confirm button. The race may not directly apply, but the **late-joiner HUD prebuild race** does: `OnPlayerJoinGame` does a 0.1 s `mod.Wait` then `ensureHudForPlayer` then another 0.1 s wait then re-renders the Ready Dialog. If a teammate triggers a Confirm in that window, race possible.
- **Why**: No global serialization lock on HUD prebuild + dialog re-render.
- **Likelihood**: Unknown until MP playtest.
- **Severity**: High if it crashes the server.
- **Fix sketch**: Wrap `OnPlayerJoinGame` in a per-pid in-flight guard; reject Confirm/swap actions targeting a pid that's still in HUD prebuild.
- **Conquest cross-ref**: **Conquest #105** — fixed v1.382, then the fix was removed in v1.418 Ship 8 when lazy-build replaced the prebuild path entirely.

## B9. Frame budget exceeded during concurrent MP joins (Conquest #40 — uncertain if Helis has it)

- **Symptom**: Conquest observed mod eval >1000 ms during concurrent MP joins because every joining player triggered a full UI prebuild simultaneously.
- **Where**: Helis's `OnPlayerJoinGame` does the same thing: `ensureHudForPlayer` (1,800-line builder) + `createTeamSwitchUI` warmup later. Concurrent joins would multiply this.
- **Why**: No global serialization or per-frame budget gate.
- **Likelihood**: Medium-High at concurrent join counts ≥3.
- **Severity**: Medium-High (could trigger script termination per Conquest #109).
- **Fix sketch**: Conquest's two-stage fix:
  1. Add a global "in-flight HUD build count" mutex; new joins queue with a small stagger.
  2. Long-term: lazy-build the Ready Dialog (don't warmup during `OngoingPlayer`).
- **Conquest cross-ref**: **Conquest #40** — fixed v1.104, scenario changed in Wave 3.

---

# Section C — Risk areas (not necessarily bugs, but worth instrumenting or reviewing)

## C1. No frame-time visibility

- **Risk**: Helis has no telemetry of per-frame cost. Conquest discovered its v1.491 1,716 ms breach only because frame-time histograms were instrumented.
- **Recommendation**: Add a minimal frame-time histogram (per Conquest M3) before any optimization work. ~50 LOC. See improvement plan item B5.

## C2. No per-tick cadence verification

- **Risk**: `OngoingPlayer`'s actual cadence (8 Hz assumed, could be 60 Hz on some platforms) determines whether per-tick reclaims are 1× or 7.5× more valuable. Helis assumes 8 Hz; this is a guess.
- **Recommendation**: Add a one-shot cadence probe (Conquest D5). ~20 LOC; strip after measurement. See improvement plan item B5.

## C3. No MP playtest history

- **Risk**: Helis hasn't been validated at ≥4 concurrent players. All the issues above are either static-analysis hypotheses or ports from Conquest where the bug shape is similar but the failure mode is unverified for Helis.
- **Recommendation**: Schedule a 4–6 player MP playtest with diagnostic toggles for: vehicle registration consistency, ready-dialog roster integrity, late-joiner HUD build, vehicle spawner stall detection. Compare against this issue list to confirm which are real and which were paranoia.

## C4. `round-flow.ts` cleanup is synchronous-with-waits — no global timeout

- **Risk**: `scheduleRoundEndCleanup` does multiple `await mod.Wait(...)` calls in sequence. If any of the awaited conditions never resolves (e.g., `areCleanupSpawnsReady` never returns true), the cleanup pipeline could hang and block the next round indefinitely.
- **Where**: [src/round-flow.ts](../src/round-flow.ts).
- **Recommendation**: Audit the cleanup pipeline for global timeout. Conquest's `ROUND_END_CLEANUP_SPAWN_TIMEOUT_SECONDS = 60` constant exists in Helis too ([src/types.ts:24](../src/types.ts#L24)) but verify it's the master ceiling, not just a sub-step timeout.

## C5. Aircraft ceiling enforcement uses 0.2 s tick polling all aircraft

- **Risk**: The soft-enforcement loop iterates `mod.AllVehicles()` every 0.2 s. At high aircraft counts (e.g., 8 helis live + 8 jets), this is 80 vehicle queries per second.
- **Where**: [src/ready-dialog.ts](../src/ready-dialog.ts) `runAircraftCeilingSoftEnforcementLoop`.
- **Recommendation**: Cache the aircraft subset; only refresh on `OnVehicleSpawned`/`OnVehicleDestroyed`.

## C6. Position-debug loop runs per-player when toggled

- **Risk**: `positionDebugLoop` in [src/ready-dialog.ts](../src/ready-dialog.ts) is per-player; if admin toggles position-debug on for many players, the loop count scales linearly.
- **Recommendation**: Verify the loop self-cancels when admin toggles off. The `expectedToken` pattern suggests it does but worth confirming.

## C7. `strings.json` has 360 lines under `twl.*` — no audit for unused keys

- **Risk**: Bundle bytes for unused string keys.
- **Recommendation**: Run a grep audit (`mod.stringkeys.twl.X.Y` across `src/`) to find unused keys. Conquest does this periodically.

## C8. `MAX_ROUNDS = 3` is a `const`, not user-configurable at runtime

- **Risk**: The Ready Dialog has a "Best Of" ± control but the underlying `MAX_ROUNDS` is `const`. If the control updates `State.round.max` correctly, no issue; if it doesn't, the dialog displays a value that doesn't drive behavior.
- **Where**: [src/types.ts:18](../src/types.ts#L18).
- **Recommendation**: Verify the Best Of buttons mutate `State.round.max` and that all round-flow code reads `State.round.max` not the `MAX_ROUNDS` const.

## C9. ASCII guardrail catches em-dashes in `// Module: …` comments — only the postbuild strip saves us

- **Risk**: If postbuild step 4 (strip `// Module: …` lines) ever regresses, every `.ts` file's leading `// Module: foo — bar` comment would leak em-dashes into the bundle, triggering the silent Portal sandbox failure.
- **Where**: [src/clock.ts:2](../src/clock.ts#L2), [src/config.ts:2](../src/config.ts#L2), and ~10 more files.
- **Recommendation**: Either (a) replace em-dashes with `--` or `-` in all `// Module:` headers as defense-in-depth, or (b) document this dependency explicitly in CLAUDE.md/AGENTS.md. The ASCII guardrail at postbuild step 11.5 catches this at build time, so the existing protection is sound — but a single `// Module` strip regression would expose it.

## C10. No string-key change authorization gate

- **Risk**: `strings.json` can be edited without explicit approval, contrary to the Conquest String Change Authorization Policy.
- **Recommendation**: Port the policy text into the new Helis AGENTS.md draft.

---

# Section D — Issues from the human-curated Improvements Punchlist

These are the developer's own self-noted items in [src/ImprovementsPunchlist.ts](../src/ImprovementsPunchlist.ts). Cross-referenced into this design doc so they don't get lost. **The punchlist is flagged "for only humans and not LLMs, CODEX or GPT to design and implement"** — so the items below are tracked here, but proposals to act on them should still wait for human direction.

## D1. Code-cleanup items (from punchlist)

- "Gut unused functions / commented out functions from script file (done?)" — covered by A4 + A5.
- "Address things like renderReadyDialogForAllVisibleViewers vs refreshReadyDialogForAllVisibleViewers (overlap/duplication?)" — source code already calls this out at [src/ready-dialog.ts:2024](../src/ready-dialog.ts#L2024).
- "The UI patterns are bonkers. We dont need unique functions for single message strings? can we simplify this type of pattern: NotifyAmmoRestocked(eventPlayer);" — design feedback; would touch [src/utils.ts](../src/utils.ts) and the `BroadcastMainBaseEvent` family.
- "There are many various functions which generally do the same thing, can we consider how to unify UI updates/refreshes or use TS template UI library (major refactor)" — large item; aligns with C1/C2 in the improvement plan.

## D2. UI/SFX polish items (from punchlist)

- "Respawn in 10s..." message synced with clock in yellow during round-end window.
- "Restart in Xs still rolls over on top match clock" — display bug.
- Sound effects for ready up, round-start countdown, round-end display, victory display, vehicle registration, vehicle destruction, flag capture.

## D3. Spatial data bug (from punchlist)

- "Defense Nexus: prevent tanks from getting stuck under semi-trailers (e.g. near north main base)" — map-side fix.

---

# Issue Index (alphabetical-cum-priority)

| ID | Title | Severity | Likelihood | Effort | Improvement plan item |
|---|---|---|---|---|---|
| A1 | Triple-tap detector state leak | Low | Medium | XS | A1 |
| A2 | `ensureHudForPlayer` mega-function | Medium (maint) | N/A | L | C1 |
| A3 | `OnPlayerEnterVehicle` fragility | High | Medium-High | M | B6 |
| A4 | 10 unused `TODO(1.0)` functions | Low | N/A | XS | A2 |
| A5 | 2 disabled overtime functions (commented bodies) | Trivial | N/A | XS | A2 |
| A6 | 2 deprecated v0.5 UI handlers | Low | N/A | XS | A2 |
| A7 | `safeFindPlayer` linear scan in hot paths | Medium | Confirmed | S | B2 |
| A8 | Auto-ready throttle not honored | Low-Medium | Medium | S | B5 |
| A9 | 14 `delete State.players.*` calls in disconnect | Low (maint) | N/A | M | A1 |
| A10 | Duplicate `clearSpawnBaseTeamCache()` call | Trivial | Confirmed | XS | A2 |
| A11 | World log used as diagnostic surface | Medium | High | S | A3 |
| A12 | Double `mod.Teleport` workaround | Low | Confirmed | XS (doc only) | — |
| A13 | Parallel-array vehicle ownership cache | Low | N/A | S | C3 |
| A14 | `OnPlayerLeaveGame` defensive signature | Trivial | N/A | XS | A2 |
| A15 | `OvertimeStage.Notice` dead enum value | Trivial | N/A | XS | A2 |
| B1 | Ready auto-clears on deploy/HQ-exit | Medium | Confirmed | S | B1 |
| B2 | `getPlayerVehicleSeat` engine errors | Low | Medium | S | B6 |
| B3 | `UnspawnObject` cosmetic log | Low | Confirmed | S | B7 |
| B4 | `CountOf` on undefined arrays | Medium | Medium | XS | B7 |
| B5 | Spawner stall — `spawnSequenceInProgress` latch | High | Medium | S | B4 |
| B6 | Tight-map spawner cross-binding | Medium | Low | S | B4 |
| B7 | Startup cleanup misses late default spawns | Medium | Low | S | B4 |
| B8 | Late-joiner crash race | High | Unknown | M | B8 |
| B9 | Frame budget exceeded on concurrent joins | Medium-High | Medium-High | M | B8 |
| C1 | No frame-time visibility | (risk) | — | S | B5 |
| C2 | No cadence verification | (risk) | — | XS | B5 |
| C3 | No MP playtest history | (risk) | — | M (playtest schedule) | (process) |
| C4 | Cleanup pipeline timeout audit | Medium (latent) | Low | S | I3 |
| C5 | Aircraft ceiling polls all vehicles | Low | Low | S | C4 |
| C6 | Position-debug loop self-cancel audit | Low | Low | XS | — |
| C7 | Unused string keys in `strings.json` | Low | Low | S | A3 |
| C8 | `MAX_ROUNDS` const vs Best Of control | Low | Low | XS | — |
| C9 | ASCII guardrail dependency on `// Module` strip | Medium (latent) | Low | XS | A4 |
| C10 | No string-change authorization gate | Low | N/A | XS (doc) | — |
| D1 | Punchlist code-cleanup items | (varies) | — | (varies) | — |
| D2 | Punchlist UI/SFX polish | (varies) | — | (varies) | — |
| D3 | Defense Nexus tank-stuck under trailers (spatial) | Low | Low | (map-side) | — |
