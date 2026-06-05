## Helis-Only Improvement Plan — Effort × Value Matrix

*Draft generated 2026-05-25 against Helis v0.630. Revised 2026-05-25 to lead with P0 mission-critical tier. Pending human review. NOT approval to execute.*

This document is the action-oriented complement to:
- [heli_features.md](./heli_features.md) — what the project is.
- [heli_v_conquest_comp.md](./heli_v_conquest_comp.md) — how it differs from Conquest.
- [heli_issues_design.md](./heli_issues_design.md) — what risks / bugs are present. **Section 0 of that doc is the evidence base for the P0 tier here.**

> Per Helis project convention: **a plan file existing is NOT approval to apply it; wait for explicit go-ahead per item** (mirrors the Conquest memory `feedback_plans_are_not_instructions_to_execute`).

---

### 0. Reading guide

- **Effort scale**: XS (≤1 hour), S (1–4 hours), M (4–12 hours), L (12+ hours).
- **Value scale**: Low / Medium / High / Critical. Considered across player-experience impact + maintainability + perf risk reduction + bug-fix-equivalent value.
- **Type tag**: 🐛 Bug fix · ⚡ Perf · 🧹 Cleanup · 🛡 Risk reduction · 📐 Architecture · 🛠 Tooling · 💥 Crash-class.
- **Strategic intent** (per user direction 2026-05-25): **Keep Helis distinct, selectively port from Conquest**. Don't add Conquest features that don't belong (ground vehicles, supply crates, ticket economy). Do port the actually-mission-critical fixes — undeployed-player guards and JS-heap defenses are the headline.

### Master Priority Stack

```
TIER P0 — MUST FIX BEFORE NEXT MEDIUM-SCALE (8+) MP PLAYTEST
  ── these are crash-class or crash-contributor bugs Conquest already paid for ──
  P0-1  Delete Ready Dialog warm-build in OngoingPlayer        [S, Critical]
  P0-2  Undeployed-player API guards (Undeploy, RemoveEquip,
        GetPlayerVehicleSeat, GetSoldierState audit)           [S, High]
  P0-3  OnPlayerEnterVehicle reconciliation pass               [M, High]
  P0-4  SetRedeployTime global-vs-per-player verification      [XS verify
                                                                + S fix]
  P0-5  Late-joiner in-flight guard                            [M, High]
  P0-6  Ready state auto-clear deletion (Conquest #58 port)    [S, High]
  P0-7  Spawn sequence stall watchdog                          [S, High]
  P0-8  Per-pid map consolidation                              [M, Medium-High]

TIER P1 — SHOULD FIX BEFORE 16-PLAYER TARGET
  P1-1  Lazy-build HUD sub-panels (Wave-3-equivalent)          [L, Critical
                                                                at 16p]
  P1-2  OnPlayerJoinGame concurrent-join stagger               [M, Medium-High]
  P1-3  Tick-context + forEachValidPlayer helper               [S-M, Medium]
  P1-4  Telemetry: frame-time + cadence probes                 [S, Medium]
  P1-5  HUD dirty-flag contract for kills/victory dialog       [M, Medium]
  P1-6  Spawner hardening (bind distance + cleanup pass)       [S, Medium]
  P1-7  Defensive wrappers: UnspawnObject + CountOf guards     [S, Medium]

TIER P2 — CLEANUP / MAINTAINABILITY (was the original "quick wins")
  P2-1  Dead-code purge (10 TODO(1.0) + 2 disabled fns +
        duplicate clear + dead enum value)                     [S, Low-Medium]
  P2-2  Em-dash replacement in // Module headers               [XS, Low]
  P2-3  Vehicle ownership cache → Map                          [S, Low]
  P2-4  Aircraft ceiling enforce: cache aircraft subset        [S, Low]
  P2-5  Message audit (world-log vs notification)              [M, Medium]
  P2-6  Round-end cleanup pipeline timeout audit               [M, Medium]
  P2-7  ensureHudForPlayer mega-function split                 [L, High maint]
  P2-8  ready-dialog.ts file split                             [L, High maint]
  P2-9  Punchlist UI/SFX polish (developer's items)            [varies]
```

The original "quick wins" framing was wrong — most of those items are P2 cleanup. Real quick wins are P0-1, P0-2, P0-6, P0-7, P0-8 — small diffs against mission-critical bugs.

---

# TIER P0 — Mission-critical (must fix before next medium-scale MP playtest)

The items in this tier each correspond to a confirmed Conquest production failure where Helis has the same code shape. Severity is anchored to Conquest's actual evidence, not speculation. See [heli_issues_design.md](./heli_issues_design.md) Section 0 for full evidence.

## P0-1. Delete the Ready Dialog warm-build in `OngoingPlayer`

- **Type**: 💥 Crash-class defense · ⚡ Perf · 📐 Architecture
- **Effort**: **S** (single-block deletion + decision on first-open behavior)
- **Value**: **Critical** at 12+ player counts; mission-critical at 16+.
- **Issues addressed**: 0.1 (eager UI prebuild — Conquest #40 / #109 family).

**What**: Delete the warm-prime block at [src/index.ts:399-407](../src/index.ts#L399):

```ts
if (State.players.teamSwitchData[pid] && !State.players.teamSwitchData[pid].uiBuilt) {
    createTeamSwitchUI(eventPlayer);
    State.players.teamSwitchData[pid].dialogVisible = false;
    deleteTeamSwitchUI(eventPlayer); // now hides (cached) rather than deleting
    State.players.teamSwitchData[pid].uiBuilt = true;
}
```

Defer Ready Dialog construction to the first time `teamSwitchInteractPointActivated` fires for each player ([src/team-switch.ts](../src/team-switch.ts)). On first open, build + show; on subsequent opens, the cached widgets are still in the engine so just show. Add an in-flight guard `State.players.teamSwitchData[pid].buildInProgress` to prevent re-entry if the player triple-taps during the build.

**Why**: This is the same warm-prime pattern Conquest deleted in v1.418 Ship 8 to address the 16-player JS heap crash (#109). At N=8 (Helis's current target), the warm-build cost is borderline acceptable; at N=12+ it becomes the dominant heap-pressure contributor. The Ready Dialog has ~80 widgets; deleting the warm-prime for it cuts per-pid eager allocation roughly in half.

**Files touched**: [src/index.ts](../src/index.ts) (`OngoingPlayer` body), [src/team-switch.ts](../src/team-switch.ts) (`teamSwitchInteractPointActivated` first-open behavior).

**Risk**: Low. First-time dialog open will feel slightly slower than warm-primed (perceptibly ~50–100 ms). Conquest's experience: the trade was easily worth the crash defense, and most players never noticed.

**Verification**: SP smoke covering full lifecycle (join → no dialog visible → triple-tap → dialog opens → close → re-open uses cache). MP smoke covering concurrent joins.

**Plan file when scheduled**: `design_doc/<MM.DD.YY>_heli_ready_dialog_lazy_build_plan.md`.

---

## P0-2. Undeployed-player API guards (the audit + fixes)

- **Type**: 🐛 Bug fix · 💥 Crash-class contributor (via heap-pressure mechanism documented in Conquest #94)
- **Effort**: **S**
- **Value**: **High**
- **Issues addressed**: 0.2 (undeployed-player API call family).

**What**: Three concrete fixes against the audit findings:

1. **Guard `mod.UndeployPlayer` calls** (Conquest #36 v1.071):
   - [src/team-switch.ts:185, 188](../src/team-switch.ts#L185) `forceUndeployPlayer`: add `if (!isPlayerDeployed(eventPlayer)) return;` before each `mod.UndeployPlayer` call. Replace `mod.IsPlayerValid` check with `isPlayerDeployed` (which already includes validity check).
   - [src/index.ts:305](../src/index.ts#L305) `deferForcedUndeploy`: add `if (!isPlayerDeployed(player)) return;` before `mod.UndeployPlayer`. Keep the try/catch as defense-in-depth.
   - [src/round-flow.ts:225](../src/round-flow.ts#L225) cleanup loop: add `if (!isPlayerDeployed(player)) continue;` between the disconnect check and the try/catch. Engine still logs even with try/catch (the engine error log is allocated *before* the JS exception fires).

2. **Guard `mod.RemoveEquipment` calls** (Conquest #84 v1.341 + #94 v1.448):
   - [src/index.ts:332-333](../src/index.ts#L332): wrap each `mod.RemoveEquipment` call with `if (mod.HasEquipment(eventPlayer, slot)) mod.RemoveEquipment(...)`. Alternative: delete the RemoveEquipment calls entirely and rely on AddEquipment's clobber semantics (per Conquest v1.448 finding: *"AddEquipment clobbers cleanly"*). The latter is the cleaner fix — recommend that.

3. **Wrap `mod.GetPlayerVehicleSeat` in safe-helper** (Conquest #37 v1.076):
   - Add `safeGetPlayerVehicleSeat(player): number | -1` helper in [src/state.ts](../src/state.ts) that try/catches and returns -1 on failure.
   - Use in [src/index.ts:444](../src/index.ts#L444) `isVehicleEmptyForEntry`. If seat query fails, treat as "empty for entry" (return true) — matches Conquest's defensive default.

**Verification audit**: After fixes, grep `src/` for any remaining `mod.GetSoldierState\(` outside the safe wrappers — confirm zero hits.

**Why**: Each unguarded misuse logs an engine error. Engine error logs allocate JS heap (Conquest #94 made this explicit: *"engine log allocations contributed to the same heap pressure that crashed at 16p in #109"*). At 16+ players these aggregate into the script-termination crash.

**Files touched**: [src/team-switch.ts](../src/team-switch.ts), [src/index.ts](../src/index.ts), [src/round-flow.ts](../src/round-flow.ts), [src/state.ts](../src/state.ts) (helper).

**Risk**: Very low. All changes are guards in front of existing behavior; the only behavior change is that misuse is silently skipped instead of misused.

**Verification**: SP smoke for team-switch (was the most exposed call site). Build the bundle and verify no compile errors.

**Plan file when scheduled**: `design_doc/<MM.DD.YY>_heli_undeployed_api_guards_plan.md`.

---

## P0-3. `OnPlayerEnterVehicle` reconciliation pass

- **Type**: 🐛 Bug fix · 🛡 Risk reduction · 💥 Crash-class contributor
- **Effort**: **M**
- **Value**: **High** (vehicle scoring correctness is core; heap-pressure mitigation is bonus)
- **Issues addressed**: 0.3 (engine event drop / handler fragility).

**What**:

1. In `pollVehicleSpawnerSlots` (1 Hz loop in [src/vehicles.ts:420](../src/vehicles.ts#L420)) add a reconciliation step:
   - Walk `mod.AllVehicles()` (or even better — the spawner slot list, which has only enabled vehicles).
   - For each vehicle, check `arrayContainsVehicle(regVehiclesTeam1, v) || arrayContainsVehicle(regVehiclesTeam2, v)`.
   - If neither, infer the team from `vehicleSpawnBaseTeamByObjId[vid]` (cached) or `inferBaseTeamFromPosition(GetObjectPosition(v))`, then `registerVehicleToTeam(v, inferredTeam)`.
   - Recover from any dropped `OnPlayerEnterVehicle` events within 1 s.

2. Add per-vid registration cache (`State.vehicles.registrationByVid: Map<number, TeamID>`) — `OnPlayerEnterVehicle` early-returns if already correctly registered. Skips the 4× `GetVariable / SetVariable` engine arrays calls on re-entry.

3. Replace the parallel `vehIds[] / vehOwners[]` arrays with `Map<vid, mod.Player>` (P2-3 candidate — could fold in here for one consolidated PR).

**Why**: `OnPlayerEnterVehicle` is self-flagged as "Known fragility — error prone" and engine drops the event under load (Conquest memory). Without reconciliation, a vehicle can be in play but unregistered → destroying it awards no score → silent gameplay correctness bug. Plus every retry-on-failure allocates engine arrays repeatedly.

**Files touched**: [src/vehicles.ts](../src/vehicles.ts), [src/state.ts](../src/state.ts) (cache + helper).

**Risk**: Medium. Adding state writes from the 1 Hz poll while events also fire — must use the same token-guard discipline already in place for spawn binding to avoid double-registration races.

**Verification**: SP smoke for normal vehicle flow. MP playtest with rapid vehicle entry/exit ideal but not blocking.

**Plan file when scheduled**: `design_doc/<MM.DD.YY>_heli_vehicle_registration_reconciliation_plan.md`.

---

## P0-4. Verify (then conditionally fix) `mod.SetRedeployTime` scope

- **Type**: 🛡 Risk reduction · 🐛 Possible bug fix
- **Effort**: **XS** (verify) + **S** (fix if confirmed)
- **Value**: **Medium-High** if the call is actually global; trivial if it's per-player.
- **Issues addressed**: 0.4 (SetRedeployTime scope unverified).

**What**:

1. **Verify first**: Add a persistent-HUD-overlay diagnostic probe (per AGENTS.md guidance — world log is not reliable for this).
   - Before `mod.SetRedeployTime(eventPlayer, ...)` in [src/team-switch.ts:212](../src/team-switch.ts#L212), capture each connected player's current redeploy time if queryable (check `reference_bf6_core/` for a query API).
   - After the call + 0.1 s wait, capture again.
   - Display the per-player delta on each player's HUD for 5 s.
   - Run a 2v2 SP smoke (1 SP player + 3 bots, or 2 real if available).

2. **Decision**:
   - If per-player → no fix needed; remove probe; close item.
   - If global → either (a) delete the `SetRedeployTime` call entirely (let engine default handle redeploy timing), or (b) save the global redeploy time before the call, restore it on the next tick.

**Why**: Conquest memory `respawn_redeploy_timer_polish` warns this is unverified. Conquest #76 left it as a watch item. Helis inherited the same code; should not inherit the same blind spot.

**Files touched**: probe-only initially; if fix needed, [src/team-switch.ts](../src/team-switch.ts).

**Risk**: Very low for the probe. Fix risk depends on which approach.

**Plan file when scheduled**: `design_doc/<MM.DD.YY>_heli_redeploy_time_scope_verification_plan.md`.

---

## P0-5. Late-joiner in-flight guard

- **Type**: 🛡 Risk reduction · 💥 Possible crash defense
- **Effort**: **M**
- **Value**: **High** (potentially crash-class)
- **Issues addressed**: 0.5 (Conquest #105 late-joiner crash race).

**What**:

1. Add `State.players.joinInProgressByPid: Record<number, boolean>` (or — even better — fold into the consolidated per-pid struct from P0-8 as a `joinInProgress: boolean` field).
2. Set true at the top of `OnPlayerJoinGame`; clear after the second-pass HUD render completes (line 243 in `OnPlayerJoinGame`).
3. In `confirmReadyDialogModeConfig` and `applyMatchupPreset` (and any other admin action that triggers a wide HUD refresh), check `Object.values(joinInProgressByPid).some(v => v)` — if any pid is mid-join, defer the action by 200 ms and retry once; abort if still in flight on retry.

**Why**: Conquest hit a hard server crash in this exact race window (#105). Conquest's first fix (v1.382) used the same `joinInProgress` flag pattern; the mechanism was retired in v1.418 only because lazy-build replaced the underlying prebuild. Since Helis is keeping eager-ish builds (per Section P0-1 only the Ready Dialog warm goes lazy; the HUD itself remains eager-on-join), the race window remains.

**Files touched**: [src/state.ts](../src/state.ts), [src/index.ts](../src/index.ts), [src/ready-dialog.ts](../src/ready-dialog.ts).

**Risk**: Medium. Race-detection logic is sometimes wrong. Mitigate with conservative behavior: defer rather than refuse.

**Plan file when scheduled**: `design_doc/<MM.DD.YY>_heli_late_joiner_guard_plan.md`.

---

## P0-6. Port Conquest #58 — stop auto-clearing ready state on deploy and HQ-exit

- **Type**: 🐛 Bug fix · UX
- **Effort**: **S** (≤5 lines deletion + audit)
- **Value**: **High** (high signal-to-noise improvement for triage)
- **Issues addressed**: 0.6.

**What**: Apply the same diff Conquest landed in v1.445:

1. Delete `State.players.readyByPid[pid] = false;` from `OnPlayerDeployed` at [src/index.ts:345](../src/index.ts#L345).
2. Delete the `readyByPid = false` block (lines 873-880) from `OnPlayerExitAreaTrigger`. Keep the `inMainBaseByPid = false` write and the broadcast.
3. Audit the remaining auto-clear sites — should reduce to exactly two:
   - SWAP TEAMS (`processTeamSwitch` in [src/team-switch.ts](../src/team-switch.ts))
   - Admin config Confirm (`confirmReadyDialogModeConfig` in [src/ready-dialog.ts](../src/ready-dialog.ts))

**Why**: When players have to re-press READY 3–5 times during pre-game cycling, **other pre-game bugs become hard to identify** because all friction blames the ready system. Fixing this is value-multiplied because it cleans the triage surface.

**Files touched**: [src/index.ts](../src/index.ts) primarily; audit-only for `team-switch.ts` and `ready-dialog.ts`.

**Risk**: Low.

**Verification**: SP smoke — READY → deploy/die → re-deploy → READY state persists. SWAP TEAMS still clears it. Admin Confirm still clears it.

**Plan file when scheduled**: `design_doc/<MM.DD.YY>_heli_ready_persistence_plan.md`.

---

## P0-7. Vehicle spawn-sequence stall watchdog

- **Type**: 🐛 Bug fix · 🛡 Risk reduction
- **Effort**: **S**
- **Value**: **High** (eliminates a class of "matchup change blocked indefinitely" failures)
- **Issues addressed**: 0.7 (spawn sequence stall).

**What**:

1. Add `State.vehicles.spawnSequenceStartedAt: number` field. Stamp it in `queueSequentialSpawns` ([src/vehicles.ts:281](../src/vehicles.ts#L281)).
2. In `applySpawnerEnablementForMatchup`, if `spawnSequenceInProgress === true` AND `Math.floor(mod.GetMatchTimeElapsed()) - spawnSequenceStartedAt > 10`, force-reset (`spawnSequenceInProgress = false; spawnSequenceToken += 1`) and proceed.
3. Optionally surface a one-shot world-log warning when the watchdog fires (gated behind `ENABLE_DEBUG_HIGHLIGHTED_MESSAGES` per the AGENTS.md diagnostic policy).

**Why**: Self-flagged "Consider hardening" comment in source. Token-cancellation pattern is already in place; just needs a timeout. Without this, a single dropped engine event can stall the entire spawner system for the rest of the match.

**Files touched**: [src/vehicles.ts](../src/vehicles.ts), [src/state.ts](../src/state.ts) (state field).

**Risk**: Very low. Watchdog is additive; the worst case is firing the watchdog when the sequence actually was still in progress (the next forced respawn would re-trigger normally).

**Plan file when scheduled**: `design_doc/<MM.DD.YY>_heli_spawner_watchdog_plan.md`.

---

## P0-8. Consolidate per-pid maps into one struct

- **Type**: 📐 Architecture · 🧹 Cleanup · 💥 Heap-pressure contributor
- **Effort**: **M** (mechanical refactor across ~30 call sites)
- **Value**: **High** — eliminates the "missed-cleanup leak" failure mode that already happened once (`InteractMultiClickDetector.STATES`).
- **Issues addressed**: 0.8, plus A1 and A9 from Section A below.

**What**: Replace 14 separate `Record<number, T>` maps in `State.players` + 7 separate `joinPrompt*ByPid` maps with one `Record<number, PerPlayerState>`.

Define in [src/state.ts](../src/state.ts):

```ts
type PerPlayerState = {
  // existing player flags
  ready: boolean;
  autoReady: boolean;
  readyMessageCooldownAt: number;
  inMainBase: boolean;
  overTakeoffLimit: boolean;
  deployed: boolean;
  disconnected: boolean;
  uiInputEnabled: boolean;
  spawnDisabledWarningVisible: boolean;
  joinInProgress: boolean;      // new — from P0-5
  // join-prompt cluster
  joinPromptShown: boolean;
  joinPromptNeverShowByMap: Partial<Record<MapKey, boolean>>;
  joinPromptReadyDialogOpened: boolean;
  joinPromptTipIndex: number;
  joinPromptTipsUnlocked: boolean;
  joinPromptTripleTapArmed: boolean;
  // team-switch
  teamSwitchData: teamSwitchData_t;
};

players: {
  byPid: Record<number, PerPlayerState>;
}
```

Then:
- `OnPlayerJoinGame` initializes one struct.
- `OnPlayerLeaveGame` does ONE `delete State.players.byPid[pid]` — replaces the 14-line block in [src/index.ts:268-284](../src/index.ts#L268).
- All ~80 read sites change from `State.players.deployedByPid[pid]` to `State.players.byPid[pid]?.deployed` (or with a getter helper).

Additionally:
- Add `static clearForPid(pid)` to `InteractMultiClickDetector` and call it from `OnPlayerLeaveGame` (fixes A1).

**Why**: The 14 separate maps each allocate their own hashmap header and grow as players join. Per-pid heap shape matters for #109 family at 16+ players. More importantly, **`OnPlayerLeaveGame` already missed one cleanup site** (the InteractMultiClickDetector static) — consolidation makes future "did we clear everything?" questions trivially answerable.

**Files touched**: [src/state.ts](../src/state.ts), [src/index.ts](../src/index.ts) (handlers), [src/utils.ts](../src/utils.ts) (InteractMultiClickDetector clearForPid), ~30 read-site renames across `hud.ts`, `ready-dialog.ts`, `overtime.ts`, `team-switch.ts`, etc.

**Risk**: Mechanical refactor churn. Cleanest if landed as a single large PR rather than split.

**Verification**: Build + SP smoke covering join → deploy → undeploy → disconnect → rejoin. Re-grep `State.players.` to confirm zero old patterns remain.

**Plan file when scheduled**: `design_doc/<MM.DD.YY>_heli_perpid_consolidation_plan.md`.

---

# TIER P1 — Should fix before targeting 16-player scale

These items are crash-class at 16+ players but acceptable at Helis's current ≤8 target. They become P0 if the player count target moves up. They are also defenses against the same heap-pressure crash family.

## P1-1. Lazy-build HUD sub-panels (Conquest Wave-3-equivalent)

- **Type**: 💥 Crash-class defense at 16+ · 📐 Architecture · ⚡ Perf
- **Effort**: **L**
- **Value**: **Critical at 16+ players; Low at ≤8.**

**What**: Port Conquest's lazy-build framework — defer the construction of `ensureHudForPlayer`'s sub-panels (victory dialog, round-end dialog, settings summary, spawn-disabled warning, help/ready containers) until their first visible-use. The top HUD (clock, kills, wins counters, round counter) stays eager — those need to be visible immediately on deploy.

**When to schedule**: After P0-1 is shipped and measured. If P0-1 alone gets Helis through a 12p MP playtest cleanly, P1-1 may not be needed for Helis's target audience. Reopen this item if Helis ever targets 16+ players or if a 12p playtest still shows heap pressure.

**Plan file when scheduled**: `design_doc/<MM.DD.YY>_heli_lazy_build_plan.md`.

---

## P1-2. `OnPlayerJoinGame` concurrent-join stagger

- **Type**: 🛡 Risk reduction · ⚡ Perf
- **Effort**: **M**
- **Value**: **Medium-High** at 6+ concurrent joiners.

**What**: Conquest #40 v1.104 added a global serialization lock + per-player stagger to prevent the >1000 ms mod-eval breach when multiple players join in the same frame. Port the pattern:

1. Module-level `let joiningPidQueue: number[] = []; let joinSerializationActive = false;`
2. `OnPlayerJoinGame` pushes the pid and awaits a slot.
3. The serialization loop processes one pid at a time with ~200 ms stagger.

**When to schedule**: After P0-1 (eager Ready Dialog warm-build deletion). Becomes more important once HUD build is the only eager-allocation path on join.

**Plan file when scheduled**: `design_doc/<MM.DD.YY>_heli_join_stagger_plan.md`.

---

## P1-3. Tick-context + `forEachValidPlayer` helper

- **Type**: ⚡ Perf · 📐 Architecture
- **Effort**: **S-M**
- **Value**: **Medium** (modest perf win × broad applicability).

(Was B2 in the prior version of this doc. Detail unchanged. See Section P1-3-detail at the end of this doc.)

---

## P1-4. Telemetry: frame-time + cadence probes

- **Type**: 🛠 Tooling · 🛡 Risk reduction
- **Effort**: **S**
- **Value**: **Medium** (prerequisite for sizing future perf work).

(Was B5 in the prior version. Detail unchanged. Now demoted to P1 since the P0 items are sized against Conquest's evidence base, not against Helis-internal measurements.)

---

## P1-5. HUD dirty-flag contract for kills/victory dialog

- **Type**: ⚡ Perf · 📐 Architecture
- **Effort**: **M**
- **Value**: **Medium**.

(Was B3. Detail unchanged.)

---

## P1-6. Spawner hardening — bind distance + cleanup pass

- **Type**: 🐛 Bug fix · 🛡 Risk reduction
- **Effort**: **S**
- **Value**: **Medium**.

(Was B4 minus the watchdog component, which was promoted to P0-7. The remaining items: tighter bind distance + second startup cleanup pass.)

---

## P1-7. Defensive wrappers — `UnspawnObject` try/catch + `CountOf` null guards

- **Type**: 🐛 Bug fix · 🛡 Risk reduction · 💥 Heap-pressure contributor
- **Effort**: **S**
- **Value**: **Medium-High** (each prevents a class of cosmetic engine logs that feed #94/#109 pattern).

(Was B7. Detail unchanged.)

---

# TIER P2 — Cleanup / maintainability (was previously framed as "quick wins")

## A1. Consolidate per-pid player state into one struct

- **Type**: 📐 Architecture · 🧹 Cleanup
- **Effort**: **M** (mechanical refactor across ~30 call sites)
- **Value**: **High**
- **Issues addressed**: A1 (triple-tap leak), A9 (14-delete disconnect block).

**What**: Replace 14 separate `Record<number, T>` maps in `State.players` + 7 separate `joinPrompt*ByPid` maps with a single `Record<number, PerPlayerState>` struct.

**Why**: Helis already missed one cleanup site (A1 — `InteractMultiClickDetector.STATES`); the consolidation makes future "did we clear everything on disconnect?" questions trivially answerable. Also collapses 14 lines in `OnPlayerLeaveGame` to 1.

**Files touched**:
- [src/state.ts](../src/state.ts) — define `PerPlayerState` type, replace `players: {…}` with `players: { byPid: Record<number, PerPlayerState> }`.
- [src/index.ts](../src/index.ts) — `OnPlayerJoinGame` (init), `OnPlayerLeaveGame` (single delete).
- ~30 other call sites that read `State.players.xByPid[pid]` — mechanical rename.

**Risk**: Mechanical churn risk; mitigated by `@ts-nocheck` *not* covering the new struct (it does, but the compile pass will still catch missing fields if you don't typo).

**Verification**: Build passes; ready-up / deploy / disconnect cycle works in SP smoke. Confirm A1 is fixed by reusing a pid in a contrived test.

**Plan file when scheduled**: `design_doc/<MM.DD.YY>_heli_perpid_consolidation_plan.md`.

---

## A2. Dead-code purge

- **Type**: 🧹 Cleanup
- **Effort**: **S** (one focused session)
- **Value**: **Medium-High** (bundle size + readability + reduced risk of accidental re-use)
- **Issues addressed**: A4, A5, A6, A10, A14, A15.

**What**: Delete the items below in one PR:

1. The 10 functions tagged `TODO(1.0): Unused; remove before final 1.0 release.` (list in heli_issues_design.md A4).
2. `enterOvertimeNoticeStage` body (already commented out) — replace function with a 1-line comment or delete entirely if there's no plan to restore.
3. `maybeSendOvertimeUnlockReminder` — same treatment.
4. The two "Deprecated UI (v0.5)" handler retentions in [src/team-switch.ts:350, 562](../src/team-switch.ts) — decide policy: delete or document why preserved.
5. Duplicate `clearSpawnBaseTeamCache()` call at [src/index.ts:53](../src/index.ts#L53).
6. `OnPlayerLeaveGame` second-arg signature — verify against `../reference_bf6_core/`, narrow to `mod.Player` if confirmed.
7. `OvertimeStage.Notice` enum value — either delete (+ renumber) or document why preserved.

**Why**: Bundle bytes (~1–5 KB savings), but mostly **reduces noise** when reading the source. The mega-files become more legible when ~300 lines of dead code are pruned.

**Files touched**: [src/round-flow.ts](../src/round-flow.ts), [src/overtime.ts](../src/overtime.ts), [src/ready-dialog.ts](../src/ready-dialog.ts), [src/team-switch.ts](../src/team-switch.ts), [src/index.ts](../src/index.ts), [src/types.ts](../src/types.ts).

**Risk**: Low. Each item is clearly inert. Run a `grep` for every function name being deleted to confirm no surviving call site.

**Verification**: Build passes; `npm run bumpVersion`; SP smoke. Bundle byte delta reported in PR.

**Plan file when scheduled**: `design_doc/<MM.DD.YY>_heli_dead_code_purge_plan.md`.

---

## B1. Port Conquest #58 fix — stop auto-clearing ready state on deploy and HQ-exit

- **Type**: 🐛 Bug fix · UX
- **Effort**: **S** (3 line deletions + their broadcast follow-ups)
- **Value**: **High**
- **Issues addressed**: B1.

**What**: Apply the same diff Conquest landed in v1.445:

1. Delete `State.players.readyByPid[pid] = false;` from `OnPlayerDeployed` at [src/index.ts:345](../src/index.ts#L345).
2. Delete the `readyByPid = false` block from `OnPlayerExitAreaTrigger` at [src/index.ts:872-880](../src/index.ts#L872) (the pre-live `if (!isRoundLive())` branch). Keep the `inMainBaseByPid = false` write.
3. Audit the remaining auto-clear sites — should reduce to exactly two: SWAP TEAMS (`processTeamSwitch` in [src/team-switch.ts](../src/team-switch.ts)) and admin config Confirm (`confirmReadyDialogModeConfig` in [src/ready-dialog.ts](../src/ready-dialog.ts)).

**Why**: Pre-game READY state currently doesn't survive death-respawn or walking out of main base, even though both happen organically during pre-game cycling. Players have to re-press READY repeatedly. Conquest had the identical bug.

**Files touched**: [src/index.ts](../src/index.ts) (deploy + exit-trigger), `src/team-switch.ts` and `src/ready-dialog.ts` for audit only.

**Risk**: Low. Helis has identical UX; same fix applies cleanly.

**Verification**: SP smoke — READY → deploy/die → re-deploy → READY state should persist. SWAP TEAMS still clears it. Admin Confirm still clears it.

**Plan file when scheduled**: `design_doc/<MM.DD.YY>_heli_ready_persistence_plan.md`.

---

## B2. Port Conquest tick-context + `forEachValidPlayer` helper

- **Type**: ⚡ Perf · 📐 Architecture
- **Effort**: **S-M** (new ~40-LOC file + ~30 call-site mechanical renames)
- **Value**: **High** (modest perf win × broad applicability)
- **Issues addressed**: A7.

**What**:

1. Create `src/tick-context.ts` with:
   - `beginTickContext()` — cache `mod.AllPlayers()` + `mod.CountOf()` once.
   - `endTickContext()` — clear cache.
   - `getActiveTickContext()` — returns cached snapshot or undefined.
   - `forEachValidPlayer(callback)` — iterate cached snapshot (or fresh fetch if no context active).
2. Wrap the master loop body in `OnGameModeStarted` with `beginTickContext` / `endTickContext`.
3. Refactor `safeFindPlayer` to use the cached snapshot when available.
4. Replace ~30 `mod.AllPlayers / CountOf / for / ValueInArray / IsPlayerValid` blocks across `hud.ts`, `ready-dialog.ts`, `overtime.ts`, `vehicles.ts`, `clock.ts` with `forEachValidPlayer(player => ...)`.

**Why**: Each broadcast helper currently does its own `AllPlayers` fetch. At N=24 in a single subtick with 5 broadcasts, that's 120 `AllPlayers` engine calls/sec. With tick-context, drops to 1 per subtick (8/sec).

**Files touched**: new `src/tick-context.ts`; [src/state.ts](../src/state.ts) (`safeFindPlayer`); [src/index.ts](../src/index.ts) (loop body); ~5 other files for call-site replacement.

**Risk**: Low. Pattern is well-proven in Conquest (G2/G3). Wrap-and-use; no behavior change in callbacks.

**Verification**: SP smoke; verify bundle size delta is small (the helper adds 40 LOC but call sites get shorter).

**Plan file when scheduled**: `design_doc/<MM.DD.YY>_heli_tick_context_plan.md`.

---

## B3. Apply HUD dirty-flag contract to the 1 s master loop

- **Type**: ⚡ Perf · 📐 Architecture
- **Effort**: **M** (audit + instrumentation)
- **Value**: **High**
- **Issues addressed**: P3 in heli_features.md.

**What**: Per Conquest's "Combat HUD Dirty-Flag Contract" pattern:

1. Add `State.hudCache.dirty: { kills: boolean, roundCounters: boolean, winCounters: boolean, victoryDialog: boolean }` (or one bool, but separate is more granular).
2. Audit every mutation site for `State.scores.*`, `State.match.*`, `State.round.current/max`, `State.players.deployedByPid` — add `markHudDirty('kills' / etc.)` calls.
3. Gate `syncKillsHudFromTrackedTotals`, `syncWinCountersHudFromGameModeScore`, `setHudRoundCountersForAllPlayers`, `updateVictoryDialogForAllPlayers` on the dirty flag in the master loop.
4. Document the contract in the new AGENTS.md draft so future agents know to add `markHudDirty` when adding new mutation sites.

**Why**: The 1 s master loop currently calls these 4 broadcasts unconditionally. Most of the time, kills haven't changed and the broadcasts are a no-op IPC round trip. At N=24, eliminating ~3 of 4 broadcasts saves ~72 per-pid widget passes/sec.

**Files touched**: [src/state.ts](../src/state.ts), [src/hud.ts](../src/hud.ts), [src/index.ts](../src/index.ts), [src/vehicles.ts](../src/vehicles.ts), [src/round-flow.ts](../src/round-flow.ts) (mutation sites).

**Risk**: Medium. Missing a mutation site = stale HUD until next force-render. Audit needs to be thorough.

**Verification**: SP smoke; intentionally trigger kills, ready-up changes, round transitions, watch HUD reflect correctly without lag.

**Plan file when scheduled**: `design_doc/<MM.DD.YY>_heli_hud_dirty_flag_plan.md`.

---

## B4. Spawner stall hardening + tighter bind distance

- **Type**: 🐛 Bug fix · 🛡 Risk reduction
- **Effort**: **S**
- **Value**: **High** (eliminates a class of "matchup change blocked" failures)
- **Issues addressed**: B5, B6, B7.

**What**: Three small hardenings to [src/vehicles.ts](../src/vehicles.ts):

1. **Sequence watchdog**: Add `State.vehicles.spawnSequenceStartedAt: number`. In `queueSequentialSpawns`, stamp it. In `applySpawnerEnablementForMatchup`, if `spawnSequenceInProgress === true` AND `now - spawnSequenceStartedAt > 10` seconds, force-reset (`spawnSequenceInProgress = false; spawnSequenceToken += 1`). This unblocks future matchup changes if the sequence stalls.
2. **Tighter bind distance**: Reduce `VEHICLE_SPAWNER_BIND_DISTANCE_METERS = 7.0` to 4.0 (half the typical minimum inter-slot distance). Verify with per-map slot data that no map has slots closer than 8 m to each other. Tightens the cross-binding window.
3. **Second startup cleanup pass**: In `startVehicleSpawnerSystem`, after `applySpawnerEnablementForMatchup` and before the initial force-spawn loop, run the startup cleanup loop a second time. Catches default vehicles that spawned during the wait.

**Why**: All three are self-flagged "Consider hardening" comments in source. Conquest landed similar hardening across waves; Helis hasn't yet.

**Files touched**: [src/vehicles.ts](../src/vehicles.ts), [src/types.ts](../src/types.ts) (constant).

**Risk**: Low. Watchdog is additive; bind-distance tightening could mis-bind if a map has tight slots (audit `MAP_CONFIGS` first).

**Verification**: SP smoke for matchup changes; SP smoke for round-start spawn correctness.

**Plan file when scheduled**: `design_doc/<MM.DD.YY>_heli_spawner_hardening_plan.md`.

---

## B5. Add frame-time + cadence telemetry

- **Type**: 🛠 Tooling · 🛡 Risk reduction
- **Effort**: **S**
- **Value**: **High** (foundational prerequisite for any future optimization)
- **Issues addressed**: A8 (auto-ready throttle audit), C1, C2.

**What**: Add three minimal telemetry probes, all stripped in production via a single `ENABLE_TELEMETRY = false` flag:

1. **Frame-time histogram** (Conquest M3): bucket per-subtick elapsed into `[0-20ms, 20-50ms, 50-100ms, 100-200ms, 200-500ms, 500ms+]`. Emit one world-log summary per minute. Tells us where Helis's baseline sits.
2. **`OngoingPlayer` cadence probe** (Conquest D5): per-pid counter; emit per-second max. Tells us whether per-tick reclaims scale 1× or 7.5×.
3. **Auto-ready throttle audit** (A8): log every call to `applyAutoReadyForAllPlayers` with `now - lastAutoReadyCheckAtSeconds` delta. Confirms the throttle is actually working.

**Why**: Conquest discovered its v1.491 1,716 ms breach only because it had frame-time histograms. Helis has no visibility today. Every other perf item in this plan is sized against assumptions; this work converts assumptions into data.

**Files touched**: new `src/telemetry.ts` (~80 LOC); single-line additions at subtick boundary and `OngoingPlayer` entry.

**Risk**: Very low — gated behind a flag, easy to remove.

**Verification**: Toggle flag on, run a playtest, inspect world-log output. Toggle off for production.

**Plan file when scheduled**: `design_doc/<MM.DD.YY>_heli_telemetry_plan.md`.

---

## B7. Defensive wrappers — `UnspawnObject` try/catch + `CountOf` null guards

- **Type**: 🐛 Bug fix · 🛡 Risk reduction
- **Effort**: **S**
- **Value**: **Medium-High** (eliminates a class of latent log spam + abort races)
- **Issues addressed**: B3, B4.

**What**: Two passes:

1. **`UnspawnObject` wrap**: Wrap every `mod.UnspawnObject(...)` call site in `try { mod.UnspawnObject(x); } catch {}`. Search `src/` for `UnspawnObject` to enumerate. Conquest wrapped 14 sites.
2. **`CountOf` null guard**: Update `arrayContainsVehicle` and `arrayRemoveVehicle` in [src/vehicles.ts:6-13](../src/vehicles.ts#L6) to early-return if `arr == null` (treat as empty / no-op). Also audit any direct `mod.CountOf(...)` call where the array could come from `mod.GetVariable` during a disconnect race.

**Why**: Both are Conquest-fixed bugs (#39, #42) that share the same underlying code shape in Helis.

**Files touched**: [src/vehicles.ts](../src/vehicles.ts), [src/round-flow.ts](../src/round-flow.ts), [src/overtime.ts](../src/overtime.ts), others.

**Risk**: Very low. Try/catch around `UnspawnObject` is purely additive. Null guards on `arrayContainsVehicle` / `arrayRemoveVehicle` are semantically equivalent.

**Verification**: Build + SP smoke.

**Plan file when scheduled**: `design_doc/<MM.DD.YY>_heli_defensive_wrappers_plan.md`.

---

# Medium-effort items (M)

## A3. Audit `sendHighlightedWorldLogMessage` call sites — separate gameplay from debug

- **Type**: 🧹 Cleanup
- **Effort**: **M** (audit + reclassify ~30 sites)
- **Value**: **Medium**
- **Issues addressed**: A11, C7 (partial — string keys orphaned by deleted messages).

**What**:

1. List every `sendHighlightedWorldLogMessage` call in `src/` (~30 sites).
2. For each, classify:
   - **Player-facing gameplay**: keep on world log (`ENABLE_GAMEPLAY_MESSAGES`).
   - **Debug-only**: convert to `DisplayNotificationMessage(player)` for per-player visibility (more reliable than world log), still gated behind `ENABLE_DEBUG_HIGHLIGHTED_MESSAGES`.
   - **No longer useful**: delete; cross-reference `strings.json` to remove orphaned keys.
3. Document the resulting policy in AGENTS.md.

**Why**: World log holds at most 4 lines and is unreliable under load (per Conquest project memory). Mixing player-facing and developer-facing messages on the same surface means a player can have a critical gameplay message buried behind a vehicle-registration debug log.

**Files touched**: ~6 files with broadcast call sites, [src/strings.json](../src/strings.json), AGENTS.md draft.

**Risk**: Medium. String edits require human approval per the new policy. **Do not edit `strings.json` without explicit approval per call**.

**Verification**: SP smoke for player-facing messages remaining intact; debug messages no longer surface in production.

**Plan file when scheduled**: `design_doc/<MM.DD.YY>_heli_message_audit_plan.md`.

---

## A4. Replace em-dashes in `// Module:` header comments with ASCII

- **Type**: 🛡 Risk reduction · 🧹 Cleanup
- **Effort**: **XS** (mechanical replace)
- **Value**: **Medium** (defense-in-depth on the ASCII guardrail)
- **Issues addressed**: C9.

**What**: Replace every em-dash (`—`, U+2014) in `// Module: foo — bar` headers across `.ts` files with `--`. Affects ~12 files (clock.ts, config.ts, hud.ts, overtime.ts, round-flow.ts, state.ts, ready-dialog.ts, strings.ts, team-switch.ts, utils.ts, vehicles.ts, foundation/modlib.ts).

**Why**: The postbuild ASCII guardrail (step 11.5) catches this at build time, and step 4 strips the `// Module:` line before the guardrail runs. But if step 4 ever regresses, the bundle would silently fail to load. ASCII-everywhere is cheaper insurance than relying on the strip step.

**Files touched**: ~12 source files (only the header comment on line 2 of each).

**Risk**: Trivial. No runtime behavior change.

**Verification**: Build, bundle size unchanged.

**Plan file when scheduled**: Trivial enough to combine with A2 dead-code purge.

---

## C3. Convert vehicle ownership cache from parallel arrays to a `Map`

- **Type**: 🧹 Cleanup · 📐 Architecture
- **Effort**: **S**
- **Value**: **Medium**
- **Issues addressed**: A13.

**What**: Replace `vehIds[]` + `vehOwners[]` in [src/types.ts:163-164](../src/types.ts#L163) with `const vehicleLastDriver: Map<number, mod.Player> = new Map();`. Update `getLastDriver`, `setLastDriver`, `popLastDriver`, `clearLastDriverByVehicleObjId` in [src/vehicles.ts:19-89](../src/vehicles.ts#L19) to use Map methods.

**Why**: Cleaner reads, O(1) instead of O(N) lookups, idiomatic. At current Helis vehicle counts the perf difference is irrelevant; the value is readability + future-proofing.

**Files touched**: [src/types.ts](../src/types.ts), [src/vehicles.ts](../src/vehicles.ts), `OnGameModeStarted` reset code in [src/index.ts:50-51](../src/index.ts#L50).

**Risk**: Low. Mechanical refactor.

**Verification**: SP smoke for vehicle registration messaging.

**Plan file when scheduled**: `design_doc/<MM.DD.YY>_heli_vehicle_owner_map_plan.md`.

---

## C4. Cache aircraft subset for soft ceiling enforcement

- **Type**: ⚡ Perf
- **Effort**: **S**
- **Value**: **Medium**
- **Issues addressed**: C5.

**What**: Maintain `State.round.aircraftCeiling.activeAircraftVids: Set<number>` mutated on `OnVehicleSpawned` (add if aircraft) and `OnVehicleDestroyed` (remove). `runAircraftCeilingSoftEnforcementLoop` iterates the cached set instead of `mod.AllVehicles()`.

**Why**: At 0.2 s tick × 16 vehicles total but 8 aircraft, current code is ~80 `mod.AllVehicles()` engine calls/sec + 16 `isAircraftVehicle` checks. With cached set, ~5 fewer engine calls/sec and the per-vehicle work is exactly what's needed.

**Files touched**: [src/state.ts](../src/state.ts), [src/index.ts](../src/index.ts) (handlers), [src/ready-dialog.ts](../src/ready-dialog.ts) (loop).

**Risk**: Low. Set is event-mutated; engine-event-drop risk per `project_engine_event_reliability_asymmetric` — add a 5 s reconciler that walks `mod.AllVehicles()` and adds missed entries.

**Verification**: SP smoke; verify ceiling enforcement still works for aircraft at high altitude.

**Plan file when scheduled**: `design_doc/<MM.DD.YY>_heli_aircraft_subset_cache_plan.md`.

---

## I3. Audit round-end cleanup pipeline — global timeout + race investigation

- **Type**: 🛡 Risk reduction
- **Effort**: **M**
- **Value**: **Medium-High** (eliminates a potential "stuck round" failure mode)
- **Issues addressed**: C4. Also opportunistic test of whether porting Conquest's `sinkAndDestroyVehicle` is warranted.

**What**:

1. Audit `scheduleRoundEndCleanup` in [src/round-flow.ts](../src/round-flow.ts). Trace every `await mod.Wait(...)` call.
2. Verify `ROUND_END_CLEANUP_SPAWN_TIMEOUT_SECONDS = 60` is honored as a master ceiling — if not, add a single `Promise.race([cleanup(), timeoutAfter(60)])` wrapper at the top.
3. Add per-step timestamps in telemetry (gated behind the B5 flag) so we can measure how long each cleanup step actually takes.
4. **Decision**: based on telemetry data, decide whether to port Conquest's `sinkAndDestroyVehicle` pattern. Don't port preemptively.

**Why**: Helis's cleanup is synchronous-with-waits; if any await hangs, the round transition blocks indefinitely. Conquest discovered (and fixed) this exact pattern in v1.262.

**Files touched**: [src/round-flow.ts](../src/round-flow.ts), [src/telemetry.ts](../src/telemetry.ts) (from B5).

**Risk**: Medium. Touching the round-end pipeline always has regression risk.

**Verification**: SP smoke covering full round cycle x 3 rounds; intentional disconnect-during-cleanup test.

**Plan file when scheduled**: `design_doc/<MM.DD.YY>_heli_roundend_cleanup_audit_plan.md`.

---

## B6. `OnPlayerEnterVehicle` reconciliation pass

- **Type**: 🐛 Bug fix · 🛡 Risk reduction
- **Effort**: **M**
- **Value**: **High** (eliminates a confirmed-in-Conquest class of vehicle-scoring desyncs)
- **Issues addressed**: A3, B2.

**What**:

1. In `pollVehicleSpawnerSlots` (1 s tick), add a reconciliation step: walk `mod.AllVehicles()`, for each vehicle check `arrayContainsVehicle(regVehiclesTeam1, v) || arrayContainsVehicle(regVehiclesTeam2, v)`. If neither, infer the team from `vehicleSpawnBaseTeamByObjId[vid]` (cached) or `inferBaseTeamFromPosition(GetObjectPosition(v))`, then `registerVehicleToTeam(v, inferredTeam)`.
2. Audit `OnPlayerEnterVehicle` body — wrap heavy reads (`mod.GetObjectPosition`, `mod.GetVariable`) in safe-helpers. Verify the proactive cache-write pattern matches Conquest #37/#38.

**Why**: Engine drops `OnPlayerEnterVehicle` events under load. Without reconciliation, a vehicle can be in play but not in either team's registry, meaning destroying it awards no score. Conquest's defense is a periodic reconciliation pass.

**Files touched**: [src/vehicles.ts](../src/vehicles.ts), [src/index.ts](../src/index.ts).

**Risk**: Medium. Adding state writes from a poll loop while events also fire — token-guard pattern needed to avoid double-registration.

**Verification**: SP smoke for normal vehicle flow; ideally MP playtest with intentional rapid vehicle entry/exit.

**Plan file when scheduled**: `design_doc/<MM.DD.YY>_heli_vehicle_registration_reconciliation_plan.md`.

---

# Large-effort items (L) — deferred until justified by playtest data

## C1. Split `ensureHudForPlayer` mega-function

- **Type**: 📐 Architecture · 🧹 Cleanup
- **Effort**: **L** (touches 1,812 lines)
- **Value**: **High** (development velocity)
- **Issues addressed**: A2.

**What**: Split [src/hud.ts:936-2748](../src/hud.ts#L936) `ensureHudForPlayer` into:

- `buildHudForPlayer(player, pid)` — one-time build path; new helpers per sub-panel: `buildUpperLeft`, `buildSettingsSummary`, `buildTopCenter`, `buildVictoryDialog`, `buildRoundEndDialog`, `buildSpawnDisabledWarning`, `buildHelpAndReady`.
- `applyHudLayout(pid)` — idempotent layout adjustments (the positions currently reapplied on cached fast-path).
- `ensureHudForPlayer(player)` — orchestrator: cached return path + build call + layout call.

Decision matrix per sub-panel:
- Same file (`hud.ts`)? Yes — keeps the per-panel scope local. Splitting into separate files (per Conquest hud-core) is overkill for Helis's size.

**Why**: The mega-function is the single worst code-review burden in the project. Diffs touching one sub-panel currently require scrolling 1800 lines of unrelated context.

**Files touched**: [src/hud.ts](../src/hud.ts) only.

**Risk**: **High**. Touching 1800 lines of UI build code is a regression magnet. Strongly recommend splitting into 2 PRs:
- PR 1: extract one sub-panel (e.g., `buildVictoryDialog` — most isolated). Verify SP smoke. Land.
- PR 2: extract the remaining sub-panels one at a time.

**Verification**: Pixel-perfect SP smoke — screenshot each sub-panel before/after each PR.

**Plan file when scheduled**: `design_doc/<MM.DD.YY>_heli_hud_megafunction_split_plan.md`.

---

## C2. Split `ready-dialog.ts` into purpose-aligned files

- **Type**: 📐 Architecture · 🧹 Cleanup
- **Effort**: **L**
- **Value**: **Medium-High** (development velocity)
- **Issues addressed**: A2 (analogous).

**What**: Split the 4,302-line [src/ready-dialog.ts](../src/ready-dialog.ts) into ~5 files, by purpose (not by copying Conquest's exact module boundaries):

- `src/ready-dialog/build.ts` — `createTeamSwitchUI` + admin panel build helpers.
- `src/ready-dialog/render.ts` — roster + label + matchup + settings sync.
- `src/ready-dialog/countdown.ts` — pregame countdown + over-the-line message + big title/subtitle.
- `src/ready-dialog/auto-ready.ts` — `applyAutoReadyForAllPlayers`, `tryAutoStartRoundIfAllReady`, takeoff limit.
- `src/ready-dialog/join-prompt.ts` — the entire join-prompt subsystem.
- `src/ready-dialog/aircraft-ceiling.ts` — the ceiling enforcement loop + game-mode helpers (or split ceiling into its own top-level file since it's not really a ready-dialog concern).

**Why**: Same as C1 — the file is too big to navigate.

**Files touched**: [src/ready-dialog.ts](../src/ready-dialog.ts) (deleted) + 6 new files; [src/index.ts](../src/index.ts) imports.

**Risk**: **High** for the same reason as C1. Land in multiple PRs.

**Verification**: SP smoke covering each sub-area (open dialog, ready, swap, confirm, join prompt, ceiling enforcement, countdown).

**Plan file when scheduled**: `design_doc/<MM.DD.YY>_heli_ready_dialog_split_plan.md`.

---

## B8. Late-joiner race investigation

- **Type**: 🐛 Bug fix · 🛡 Risk reduction
- **Effort**: **M-L** (depends on what investigation finds)
- **Value**: **High** (potentially crash-class)
- **Issues addressed**: B8, B9.

**What**:

1. **Investigate first** — set up a controlled MP playtest where a late-joiner arrives during Confirm + concurrent SWAP TEAMS. Look for crash or HUD desync.
2. If reproducible: add per-pid in-flight HUD build guard (Conquest #105 / #109 family).
3. If concurrent-join is the issue: add stagger to `OnPlayerJoinGame` (Conquest #40).

**Why**: Both bug families exist in Conquest and the underlying code shape is the same in Helis. Unverified for Helis. Deferred until either playtest evidence or a higher player count target makes it likely.

**Files touched**: [src/index.ts](../src/index.ts), possibly [src/state.ts](../src/state.ts).

**Risk**: Medium-High depending on fix shape.

**Verification**: MP playtest scenario design.

**Plan file when scheduled**: `design_doc/<MM.DD.YY>_heli_late_joiner_race_plan.md`.

---

## D1. UI/SFX polish items from punchlist

- **Type**: UX · 🧹 Cleanup
- **Effort**: **M-L** (each item is small, but there are 6 of them)
- **Value**: **Medium** (player-facing UX wins)
- **Issues addressed**: D2 (punchlist UI/SFX items).

**What**: From [src/ImprovementsPunchlist.ts](../src/ImprovementsPunchlist.ts):

1. "Respawn in 10s..." message synced with clock during round-end window (yellow, top, replaces "ready up" dialog).
2. "Restart in Xs" rollover bug on top match clock.
3. SFX: ready up, round-start countdown, round-end display, victory display, vehicle registration, vehicle destruction, flag capture.

**Why**: The punchlist is the developer's curated list of "what would make this game feel better." Direct UX value.

**Caveat**: The punchlist says *"for only humans and not LLMs, CODEX or GPT to design and implement"*. This item is listed here for tracking; **all proposals require explicit human direction** before any work.

**Files touched**: TBD per item.

**Risk**: Per item.

**Verification**: Per item.

**Plan file when scheduled**: One plan per item.

---

## D2. (Now P1-1) Lazy-build HUD sub-panels

**Re-classified 2026-05-25**: This item has been promoted to **P1-1** in the priority stack. It is no longer "deferred — only if player counts increase"; rather, it's the **insurance** in case **P0-1** (Ready Dialog warm-build deletion) doesn't fully address the per-pid heap budget at 12+ players.

The original argument for full deferral was correct at the time but didn't reflect the **#94 / #109 mechanism** clearly enough: even if Helis stays at ≤8 players, the cumulative effect of `OnPlayerEnterVehicle` event drops, missing undeployed-player guards, and engine error log accumulation across a 40-minute match could push the script toward script-termination conditions Conquest only saw at 16p+. **P1-1 is defense in depth, not capacity expansion.**

Schedule P1-1 after: (a) P0-1 lands and is measured under 8p MP playtest, and (b) P1-4 telemetry data is collected. If heap pressure indicators are clean at 8p, leave P1-1 unscheduled but documented. If heap pressure is observed, P1-1 becomes scheduled.

---

# Items explicitly NOT in scope

Per the user direction "Keep Helis distinct, selectively port" — these Conquest features are intentionally out of scope:

| Conquest feature | Why not for Helis |
|---|---|
| Tickets / bleed system | Helis is kills-based; tickets would be a redesign. |
| Multi-flag capture (5–6 simultaneous flags) | Helis has one overtime zone; that's the design. |
| Spawn-charge ticket economy | No tickets to charge. |
| Gadget locker with 4 classes | Helis equips 2× Supply Crate; no class selection. |
| Forward Deploy / Air Deploy / HQ Deploy methods | Helis is base-only by design. |
| Boundary enforcement subsystem (GCZ/OOB) | Helis uses aircraft-ceiling enforcement; ground OOB is not relevant. |
| Spectator subsystem | Helis has no dedicated spectator role. |
| `FEATURE_PERF_DIAG` flag machinery | Nothing in Helis is gated behind perf-diag; no value to add the framework. |
| Full Conquest design-doc structure (40+ files) | Overkill for Helis's scope. This 4-doc set + future plan files is sufficient. |

---

# Suggested sequence for next ship cycles

> Replaces the original "quick wins" framing. The original sequence treated cleanup as the headline; that was wrong. The crash-class items in tier P0 are the headline.

## Phase 1 — P0 mission-critical (BEFORE any other work)

The order within this phase reflects: smallest diff first (to land momentum), then larger items.

1. **P0-6** — Port Conquest #58 (delete ready-state auto-clears). ~5 line deletion. Cleans the triage surface for the rest of the phase.
2. **P0-1** — Delete Ready Dialog warm-build in `OngoingPlayer`. Single block deletion + first-open behavior decision. Largest single per-pid heap reclaim in the project.
3. **P0-7** — Spawn-sequence stall watchdog. ~10 LOC; eliminates a class of "match silently locked" failures.
4. **P0-2** — Undeployed-player API guards (the audit + ~6 fix sites: 3 UndeployPlayer, 2 RemoveEquipment, 1 GetPlayerVehicleSeat).
5. **P0-4** — `mod.SetRedeployTime` verification probe. Cheap verify; conditional fix.
6. **P0-8** — Per-pid map consolidation. The mechanical refactor that prevents future cleanup-leak bugs.
7. **P0-3** — `OnPlayerEnterVehicle` reconciliation pass. Defense against the documented engine-event-drop pattern.
8. **P0-5** — Late-joiner in-flight guard. The race-condition defense.

**Stop here and run an 8p MP playtest.** Compare against the failure modes documented in Section 0 of [heli_issues_design.md](./heli_issues_design.md). Iterate as needed.

## Phase 2 — P1 (BEFORE targeting 12+ player counts)

9. **P1-4** — Telemetry: frame-time + cadence probes. Provides the evidence base for sizing P1-1.
10. **P1-3** — Tick-context + `forEachValidPlayer` helper. Modest perf win × broad applicability.
11. **P1-7** — Defensive wrappers: `UnspawnObject` try/catch + `CountOf` null guards. Eliminates more cosmetic-log heap-pressure sources.
12. **P1-2** — `OnPlayerJoinGame` concurrent-join stagger. Required before pushing into 6+ concurrent joiner territory.
13. **P1-6** — Spawner hardening: tighter bind distance + second startup cleanup pass.
14. **P1-5** — HUD dirty-flag contract for kills/victory dialog.

**Stop here. Decision point.** If telemetry from Phase 2 shows clean heap behavior at 12p, P1-1 stays unscheduled. If heap pressure is observed → schedule P1-1.

## Phase 3 — P1-1 (only if Phase 2 data demands it)

15. **P1-1** — Lazy-build HUD sub-panels. Large infrastructure port; only justified by measured heap pressure data.

## Phase 4 — P2 cleanup (any time after Phase 1 lands; non-critical)

16. **P2-1** — Dead-code purge (was A2).
17. **P2-2** — Em-dash replacement in `// Module` headers (was A4).
18. **P2-3** — Vehicle ownership cache → Map (was C3).
19. **P2-4** — Aircraft ceiling enforce: cache aircraft subset (was C4).
20. **P2-5** — Message audit (was A3); requires string-edit approval per AGENTS.md policy.
21. **P2-6** — Round-end cleanup pipeline timeout audit (was I3).
22. **P2-7** — `ensureHudForPlayer` mega-function split (was C1). Land in 3+ PRs.
23. **P2-8** — `ready-dialog.ts` file split (was C2). Land in 4+ PRs.
24. **P2-9** — Punchlist UI/SFX polish (was D1); developer-curated.

## What the original Sprint 1 had wrong

The original "Sprint 1 quick wins" surfaced:
- A2 (dead-code purge) — now P2-1. Demoted because cleanup is not crash-defense.
- B1 (ready persistence) — now P0-6. Promoted because it's high signal-to-noise.
- A4 (em-dash replacement) — now P2-2. Demoted because the ASCII guardrail already catches it.
- B7 (defensive wrappers) — now P1-7. Demoted because the specific call sites in P0-2 are more urgent.

The actual mission-critical items (Ready Dialog warm-build deletion, undeployed-player guards, `OnPlayerEnterVehicle` reconciliation, late-joiner race, spawn-sequence stall watchdog, per-pid consolidation) were either buried in the body or framed as "deferred until evidence." Conquest already has the evidence; Helis inherits the bug shapes. The revised plan reflects that.
