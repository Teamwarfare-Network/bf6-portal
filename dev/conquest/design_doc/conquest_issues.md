# Conquest Issues

Last Updated: 2026-04-18 (v1.313)
Last Tested Build: `v1.313` — Phase 6 HQ Deploy remains functional (both deploy-menu and on-foot live-terminal surfaces). Gadget locker rework (v1.290–v1.313) completed: per-launcher team pools, tuned durations, authoritative per-player slot state, slot-based `HasEquipment`-diff probe, per-class slot-toggle row with preference persistence. Vanilla regression path remains byte-identical to the v1.276 baseline. Outstanding: late-joiner redeploy-timer investigation deferred to the polish phase (see memory `project_respawn_redeploy_timer_polish.md`).

**Architecture note (v1.258–v1.259 rewrite).** The Vanilla vehicle spawner was rewritten around one persistent `VehicleSpawner` per slot, a serial `spawnMutex` dispatching via `ForceVehicleSpawnerSpawn`, event-driven bind via `OnVehicleSpawned`, and `Clocks.CountDownClock`-driven respawn. Files `src/vehicles/deploy-fulfillment.ts`, `src/vehicles/reservations.ts`, and `src/vehicles/spawner-sequence.ts` were deleted. All non-Vanilla deploy paths (legacy air-deploy, forward-deploy, HQ-forward) were removed. Any bug entry below whose root cause lived in those files is flagged **Obsolete (v1.259 rewrite)** — the underlying code no longer exists.

**Phase 6 HQ Deploy (v1.277–v1.289).** A parallel opt-in deploy mode lives in `src/vehicles/hq-deploy.ts`. It is selectable from the ready-dialog `Vehicle Deploy Method` knob (`VANILLA` | `HQ`). HQ mode pads start empty at LIVE; a player-triggered click on a per-slot HQ button (deploy screen or live-terminal) dispatches the slot's spawn and seats the requester via `ForcePlayerToSeat` inside the `OnPlayerDeployed` event (BountyHunter pattern). No auto-respawn in HQ mode.

## Current Snapshot
- `CQ_Bug_1`: Resolved
- `CQ_Bug_2`: Resolved
- `CQ_Bug_3`: Open (Phase 10 polish)
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
- `CQ_Bug_16`: Open (Phase 10 polish)
- `CQ_Bug_17`: Open (Phase 10 polish)
- `CQ_Bug_18`: Resolved
- `CQ_Bug_19`: Open (Phase 10 investigation)
- `CQ_Bug_20`: Open (Phase 10 polish)
- `CQ_Bug_21`: Likely resolved (believed fixed by v1.013 loading gate rearchitecture; needs confirmation)
- `CQ_Bug_22`: Resolved
- `CQ_Bug_23`: Resolved
- `CQ_Bug_24`: Resolved
- `CQ_Bug_25`: Resolved (single-player confirmed v1.064. v1.158 shipped a temporary `FEATURE_WORLD_ICON_DIAG` MP telemetry counter; removed v1.213 after user moved past the world-icon debugging path to smoke-based signalling. Pre-game HQ World Icons continue to render normally — only the diagnostic counter + state fields were removed)
- `CQ_Bug_26`: Likely resolved (believed fixed by vehicle HUD polish passes; needs confirmation)
- `CQ_Bug_27`: Resolved (fixed in vehicle HUD render passes)
- `CQ_Bug_28`: Open (Phase 10 — vehicle-specific, only some vehicles affected; needs investigation)
- `CQ_Bug_29`: Open (Phase 10 — needs repro)
- `CQ_Bug_30`: Likely resolved (believed fixed by loading gate rearchitecture and UI cache polish; needs confirmation)
- `CQ_Bug_31`: Likely obsolete (v1.308–v1.313 reworked the gadget locker slot-probe path wholesale; the v1.306 by-id probe that could destroy gadgets has been removed. Deploy path also substantially changed in v1.258–v1.289. Re-observe under v1.313 before acting — original symptom may no longer reproduce.)
- `CQ_Bug_32`: Open (Phase 10 polish)
- `CQ_Bug_33`: Open (Phase 10 polish)
- `CQ_Bug_34`: Partially resolved (Firestorm ground + air spawn orientations tuned v1.132-v1.141; other maps still need pass)
- `CQ_Bug_35`: Resolved (v1.075 — all call sites on undeployed players eliminated; error logs confirmed clean in SP testing)
- `CQ_Bug_36`: Resolved (v1.071 — guarded behind isPlayerDeployed; confirmed clean in SP testing)
- `CQ_Bug_37`: Resolved (v1.074+v1.076 — vehicle occupancy cache guard + proactive cache set before ForcePlayerToSeat)
- `CQ_Bug_38`: Resolved (v1.074+v1.076 — same vehicle occupancy cache guard; confirmed clean in SP testing)
- `CQ_Bug_39`: Hardened further (v1.147 — removed v1.145 deferred orphan-tank sweep since v1.146 inline intercept already reaps rejected vehicles synchronously; per-spawn cosmetic log source eliminated. Underlying engine-logs-before-JS-catch pattern remains for call sites that unavoidably touch DICE-authored or already-destroyed objects)
- `CQ_Bug_40`: Fix applied (v1.104 — root cause was concurrent `prebuildAllUiFamiliesHidden` execution across simultaneous player joins; fix: serialization lock + yield points + stagger delay; needs MP confirmation)
- `CQ_Bug_41`: Implemented (v1.078-v1.081 — self-terminating loops for boundary enforcement, vehicle timers, and gadget menu refresh; removed all-player per-second/per-tick polls; needs MP confirmation)
- `CQ_Bug_42`: Guarded (v1.073 — defensive null checks on array helpers and capture-tickets; needs MP confirmation)
- `CQ_Bug_43`: Resolved (v1.133 — root cause: `doesVehicleMatchConfiguredSlotType` used `CompareVehicleName` which fails for Cheetah/Gepard engine enum swap; removed all 4 guards; helis mode never had them)
- `CQ_Bug_44`: Resolved (v1.143 — `onPlayerUndeployImpl` never refreshed the deploy timer HUD after death/undeploy; now calls `updateVehicleDeployTimerHudForPlayer` at the end of the undeploy handler so the menu appears immediately on the deploy screen)
- `CQ_Bug_45`: Partially resolved (v1.138 — slot 4 root cause: spawner not relocated when knob changed vehicle type; slot 3 works; other maps untested)
- `CQ_Bug_46`: Resolved (v1.127 — jet and transport spawn rotations on Firestorm were authored in radians instead of degrees)
- `CQ_Bug_47`: Resolved (v1.137 — Ground Deploy All admin button spawned wrong vehicle types and bypassed orientation pipeline)
- `CQ_Bug_48`: Resolved (v1.135 — duplicate position debug functions and missing setPerfDiagEnabled when FEATURE_PERF_DIAG=false)
- `CQ_Bug_49`: **Obsolete (v1.259 rewrite)** — `spawnFreshAircraftDirectSpawnVehicleForSlot` path deleted. Preserved here as historical record of the four-layer guard approach.
- `CQ_Bug_50`: Fixed (v1.148 — root cause was NOT death races; it was the `releaseLoadingGate` → `revealAllUiFamilies` → `renderAdminUiFamilyForReveal` → `autoStartPositionDebugOnDeploy` reveal chain firing a sync initial sample against `mod.GetSoldierState` on a player still sitting on the deploy screen. Fixed by gating `autoStartPositionDebugOnDeploy` on `isPlayerDeployed` and routing the position-debug soldier sampler through `safeGetSoldierStateVector`)
- `CQ_Bug_51`: Fixed (v1.149 — admin position-debug toggle would un-stick after death/respawn or any reveal path because `autoStartPositionDebugOnDeploy` unconditionally reset `posDebugVisible=true`. Added `posDebugAdminOverride` sticky flag set by the admin handler; autoStart now only force-enables on the first reveal of a session and otherwise reattaches the loop to whatever state the admin left behind)
- `CQ_Bug_52`: **Obsolete (v1.259 rewrite)** — fresh-air bind-tracker + `pollVehicleSpawnerSlots` watchdog deleted with the fulfillment path. Admin CQ52 counter removed with the rewrite.
- `CQ_Bug_53`: **Obsolete (v1.259 rewrite)** — air-deploy path and `tryFulfillPendingVehicleDirectSpawnSeatForPlayer` deleted. The spawn-point-independent air-deploy design goal is superseded by Phase 6 HQ Deploy's player-triggered dispatch model. Memory `project_teleport_vehicle_spawn_mystery.md` retains the durable lesson: never teleport a player before `ForcePlayerToSeat`.
- `CQ_Bug_54`: **Obsolete (v1.259 rewrite)** — per-click runtime `RuntimeSpawn_Common.VehicleSpawner` prefab instantiation was deleted outright. Slots now use one persistent spawner each, so the prefab-default Abrams race cannot occur.
- `CQ_Bug_55`: **Obsolete (v1.259 rewrite)** — air-deploy consumed-deploy branch in `onPlayerDeployedImpl` no longer exists; Phase 6 HQ Deploy's seating path handles HQ World Icon visibility through its own `beginHqSeatFlow` lifecycle.
- `CQ_Bug_56`: Resolved (v1.212 — Kills counter incremented on friendly kills when team damage was on. `onPlayerEarnedKillImpl` now compares killer/victim team via `safeGetTeamNumberFromPlayer(..., 0)` and skips the increment when teams match; fails open on unassigned team (team 0) rather than silently dropping)
- `CQ_Feat_Pregame_Countdown_Delay_Lines`: Resolved (v1.208–v1.209 — staggered 3-line reveal of the round-start delay info at 0/+3s/+6s above the pregame countdown, Y raised to -420/-380/-340. Cache-preservation fix in `ensureCountdownUIAndGetWidget` so `delayLineWidgets` survives per-tick recreation and the lines actually hide on LIVE!)
- `CQ_Feat_Round_Start_Gadget_Delay`: Resolved (v1.210–v1.211 — new `roundStartGadgetDelay` MapConfig (Firestorm default 60). 4th pregame countdown line at Y=-300 staggered in with the forward-deploy line at -6s. Gadget locker menu opens pre-LIVE + during delay with preview/stats visible, all tiles forced disabled via `gadgetBlocked`, yellow status header counts down. Two string variants: `twl.countdown.delayGadgets` pre-LIVE, `twl.countdown.delayGadgetsLive` post-LIVE)
- `CQ_Bug_Loading_Gate_Invariants`: Closed-by-audit (v1.214 shipped GATE_INV_1/2/3 asserts, v1.222 reverted them — world-log channel is transient/unreliable for verification; dual-guard in code closes the race. Diagnostic recipe documented for future reintroduction as persistent HUD plate if needed)
- `CQ_Perf_Deploy_Timer_HotPath_SafeFind`: Resolved (v1.215 — cached loading-overlay exists flag + removed redundant safeFind in deploy-timer hot path)
- `CQ_Bug_Combat_HUD_Stale_Widget_Refs`: Resolved (v1.216 — `combatHudGenerationByPid` counter; render path stamps + bails + recovers on mismatch)
- `CQ_Refactor_forEachValidPlayer_Helper`: Resolved (v1.217 — `src/state/player-iteration.ts`; 23 wrappers converted)
- `CQ_Perf_TickContext_AllPlayers_Cache`: Resolved (v1.219 — `src/state/tick-context.ts`; per-subtick AllPlayers snapshot shared across all forEachValidPlayer callers)
- `CQ_Perf_Combat_HUD_Dirty_Gate`: Resolved (v1.221 — `twlConquestHudTickFrame` gated on `hudDirty || force`; AGENTS.md dirty-flag contract added)
- `CQ_Polish_MP_Validation_v1.214_to_v1.221`: Pending next playtest (MP-only scenarios from the stability/perf pass)
- `CQ_Bug_ActiveSpawnSingletonMPRace`: **Obsolete (v1.259 rewrite)** — the Air/Forward Deploy paths this raced on no longer exist. The v1.223 per-slot `lastRequestedSpawnPos` + `expectingSpawn` pattern informed the design of the persistent-spawner `bindSpawnedVehicleToExpectingSlot` helper. Historical record only.
- `CQ_Feat_Vehicle_Deploy_Method_Knob`: Resolved (v1.254 — ready-dialog knob for `Vehicle Deploy Method`. Initial option set scoped to `VANILLA`; `HQ` added v1.277. `HQ_FORWARD` / `HQ_FORWARD_AIR` remain out of scope.)
- `CQ_Refactor_Vanilla_Vehicle_Spawner_Rewrite`: Resolved (v1.258–v1.259 — deleted `deploy-fulfillment.ts`, `reservations.ts`, `spawner-sequence.ts`. Removed all non-Vanilla deploy paths. New shape: persistent `VehicleSpawner` per slot, serial `spawnMutex`, `ForceVehicleSpawnerSpawn` dispatch, `OnVehicleSpawned` bind, `Clocks.CountDownClock` respawn. Closes CQ_Bug_49/52/53/54/55/ActiveSpawnSingletonMPRace by deletion of the underlying paths.)
- `CQ_Bug_Global_SetTimeout_Sandbox`: Resolved (v1.261 — `setTimeout` does not exist in the Portal sandbox and rejected the first `doDispatch` promise, poisoning the mutex `.then()` chain and preventing subsequent slot dispatches. Switched to `Timers.setTimeout`; wrapped `Promise.race` in try/catch; every mutex enqueue now routes through `enqueueDispatch()` which appends `.catch(() => {})`.)
- `CQ_Refactor_Live_Start_Fleet_Reset_Sink`: Resolved (v1.262 — live-start pre-live vehicles sunk to y=-1000 then DealDamage; avoids audible explosions at pads and `UnspawnObject` engine-side error path. Also added vehicle types: `DirtBike`, `DirtBike_Pax`, `AH6M_Pax` across classification, deploy-timer labels, ready-dialog knob options, strings. Firestorm presets replaced `Quadbike` → `DirtBike`/`DirtBike_Pax` and swapped Team2 AH6M → AH6M_Pax across all matchup sizes.)
- `CQ_Refactor_Vehicle_Reset_Moved_To_Countdown_Start`: Resolved (v1.263–v1.265 — fleet reset moved from LIVE-start to countdown-start so fresh spawns complete during countdown and there is no jumble at LIVE!. Sink → 0.5s wait → `DealDamage`. Removed dead `destroyAllTrackedVehicles` helper.)
- `CQ_Bug_Abrams_Substitution_Transport_Slot_Regression`: **Open** — v1.266–v1.269 attempted a fix via `relocateSlotSpawner` + Phase C re-configure + Abrams-reject guard and reverted after multiple regressions (5 of 8 slots failing to spawn; audible explosions on retries). Current v1.289 behavior: wrong vehicle may be visible at countdown start on transport slots after heli/ground knob toggles, but no slots stay empty. Fresh diagnostic pass required before the next attempt. v1.271 mitigates by waiting 2s for engine init before `relocateSlotSpawner` configure.
- `CQ_Refactor_Vehicle_Destroy_Consolidation`: Resolved (v1.270–v1.276 — fix passes culminating in the single `sinkAndDestroyVehicle` wrapper. Preserves X/Z, teleports to y=-1000, damages after ~500–1500ms. Replaces 4 duplicated inline sites. v1.283/v1.285 re-confirmed the `slot.spawnPos`-priority fallback — `GetObjectPosition` returns bad X/Z at Vanilla→HQ countdown reset. See memory `project_getobjectposition_unreliable_on_destroy.md`.)
- `CQ_Feat_Phase6_HQ_Deploy`: Resolved (v1.277–v1.289 — opt-in `VEHICLE_DEPLOY_METHOD_HQ` deploy mode. Six implementation phases:
  - v1.277: ready-dialog knob option (no behavior).
  - v1.278: gate vanilla auto-spawn + auto-respawn on knob; HQ pads start empty.
  - v1.279: per-slot player-triggered dispatch via deploy-menu HQ buttons (seating stub).
  - v1.280: deploy-menu seating via `OnPlayerDeployed` + `ForcePlayerToSeat` (BountyHunter pattern).
  - v1.281–v1.285: sink-and-destroy polish for HQ cleanup; restore per-slot respawn cooldown in HQ mode.
  - v1.286: pending-state HUD signal (SPAWNING/DEPLOYING in warning yellow).
  - v1.287: on-foot live-terminal seating via undeploy → redeploy (Option C).
  - v1.288: poll undeploy completion; retry `DeployPlayer` 3× with 0.4s waits.
  - v1.289: zero redeploy timer (`SetRedeployTime=0`) around `UndeployPlayer` so the on-foot flow is not blocked by post-death countdown.
  Durable design constraints: never teleport player before `ForcePlayerToSeat`; `ForcePlayerToSeat` only reliable inside `OnPlayerDeployed`; no code copied from the deleted fulfillment/reservations modules.)
- `CQ_Polish_Respawn_Redeploy_Timer_Audit`: **Open** — late-joiner `SetRedeployTime(HUD_WARM_REDEPLOY_BLOCK_SECONDS)` in `holdPlayerAtDeploy` may be applying globally rather than per-player; `SetRedeployTime(0)` persistence (one-shot vs persistent) not empirically verified. Deferred to polish phase. See memory `project_respawn_redeploy_timer_polish.md`.

## CQ_Bug_42
Title: CountOf Called With Invalid/Undefined Array Argument During Gameplay

Observed:
- Engine reports `ERROR REPORTED BY COUNTOF WHILE RUNNING JS SCRIPT` / `Provided parameters () do not match any overload. Function supports the following overloads: [Array].`
- Appeared twice in v1.072 SP test during: deploy, ready dialog, gadget dialog, grab artillery, drop artillery.
- Player did NOT enter any capture point when the errors appeared.
- `CountOf` expects a Portal `Array` but received undefined or a non-array value.

Candidate Sources (ranked by likelihood):
1. `modlib.IsTrueForAny` / `modlib.FilteredArray` in `vehicles/array-helpers.ts` — internally call `CountOf` on their array argument. If `mod.GetVariable(regVehiclesTeam1/2)` returns a non-array (e.g. during transient registry state), two CountOf errors would fire (once per team). Matches the observed count of 2.
2. `capture-tickets.ts:1776` — `mod.GetPlayersOnPoint(eventCapturePoint)` could return undefined for a capture point in transient state; the `CountOf` call is inside a try-catch so the error is cosmetic but still logged by the engine.
3. Any `mod.AllPlayers()` call returning undefined — unlikely but possible during engine state transitions.

Expected:
- All `CountOf` calls should receive a valid Portal Array.
- Defensive guards should prevent undefined from reaching `CountOf`.

Fix:
1. Guard `arrayContainsVehicle` and `arrayRemoveVehicle` in `vehicles/array-helpers.ts` against undefined/non-array input.
2. Guard `GetPlayersOnPoint` result in `capture-tickets.ts` before passing to `CountOf`.

Status:
- Guarded (v1.073). Defensive null checks added to `arrayContainsVehicle`, `arrayRemoveVehicle`, and `GetPlayersOnPoint` call site.
- First observed in v1.072 SP test. May have been previously hidden by CQ_Bug_35 error log spam.
- Needs MP confirmation.

Related:
- CQ_Bug_37/38 (same cosmetic engine-log-before-throw pattern)

Evidence:
- Screenshot: `reference_design_documentation/testing_images/20260405142543_1.jpg`

## CQ_Bug_41
Title: Central Tick Loop Drives All Periodic UI Updates — Should Use Event-Driven Self-Terminating Loops

Observed:
- The main game loop (`game-mode.ts`) runs at 0.12s subtick (~8 ticks/sec). Every second boundary it calls `updateVehicleDeployTimerHudForAllPlayers()`, boundary enforcement, clock updates, and world interactable checks for ALL players.
- The `OngoingPlayer` rule fires `ongoingPlayerImpl` per-player per-engine-tick, calling `enforceUiLoadingGateWhileDeployed` and `maintainUiLoadingGateWhileUnreleased` unconditionally.
- Vehicle deploy timer refresh iterates all players and recomputes render plans every second even when nothing changed (signature early-out mitigates wasted widget work but not iteration + plan computation cost).
- This architecture scales poorly with player count and contributes to frame budget pressure (CQ_Bug_40).

Expected:
- Only run something in OngoingPlayer or persistent tick loops when it is literally the only methodology available.
- Protect tick size and tick contents — ensure every-tick or every-second work doesn't run expensively unless truly justified.
- Vehicle timers, boundary enforcement, and similar periodic checks should spawn their own event-driven loops that self-terminate when no longer needed (e.g., a respawn countdown loop starts when a slot enters cooldown and exits when cooldown hits 0).
- The central game loop should only drive global state mutation (bleed, capture sync, end conditions) — not per-player UI refresh.

Status:
- Implemented (v1.078-v1.081). Four-phase optimization:
  - v1.078: Increased vehicle spawner poll interval from 1s to 5s (safety-net only; normal destruction is event-driven).
  - v1.079: Replaced all-player per-second boundary enforcement poll with per-violation self-terminating async loops. Enter/exit area triggers already maintained boundary state; the poll only ticked kill countdowns. Now each violation spawns its own token-guarded loop that ticks once/second and self-terminates when cleared.
  - v1.080: Replaced all-player per-second vehicle deploy timer poll with per-slot self-terminating countdown loops. Each cooldown spawns a loop that updates only players with visible deploy timer HUD. 12+ existing event-driven call sites for state transitions preserved.
  - v1.081: Removed `updateArmMenu` from `ongoingPlayerImpl` (ran every engine tick per player). Gadget menu cooldown display now driven by a token-guarded 1Hz self-terminating loop launched on `openArmMenu()`, terminating when menu closes or player leaves.
- Needs MP confirmation to verify frame budget improvement and correct behavior.

Related:
- CQ_Bug_40 (frame time budget — this optimization reduces per-second work significantly)
- CQ_Bug_35 (OngoingPlayer spam — separate fix, now resolved)

## CQ_Bug_40
Title: Mod Evaluator Frame Time Exceeds 1,000ms Budget During Multiplayer Loading Gate

Observed:
- Engine reports `Mod has been running for X ms this frame which exceeds max evaluation time of 1,000ms` with times ranging from 1,003ms to 1,347ms.
- Occurs during multiplayer when multiple players join simultaneously.
- Original hypothesis (CQ_Bug_35 spam) was partially correct for v1.070 but the bug recurred at v1.103 with 3 players despite CQ_Bug_35 being resolved.

Root Cause (confirmed v1.103):
- `prebuildAllUiFamiliesHidden()` builds 6 full UI families synchronously per player (ready dialog ~100 widgets, gadget locker ~50+ widgets, combat HUD, deploy timer, admin panel, top-left shell).
- When 3 players join simultaneously, all resume from `await mod.Wait(0.01)` in the same frame. Three concurrent synchronous prebuilds stack in one frame, exceeding 1,000ms total.

Expected:
- Script should never exceed the 1,000ms per-frame evaluation budget.

Status:
- Fix applied (v1.104). Three-part mitigation:
  1. Global serialization lock (`_prebuildBusy`) so only one player's heavy UI prebuild runs at a time.
  2. Yield points (`await mod.Wait(0)`) between each major UI family build to spread a single player's work across ~6 frames.
  3. Staggered initial delay per player (`_prebuildStaggerIndex * 0.25s`) so concurrent joins don't all resume in the same frame.
- v1.082: Performance diagnostic system added (admin-toggleable) to help attribute any remaining lag spikes.
- Needs MP confirmation to verify frame budget stays under 1,000ms with 3+ simultaneous players.

Related:
- CQ_Bug_35 (original contributor at v1.070 — now resolved)
- CQ_Bug_41 (structural cause — unconditional per-tick work, partially addressed v1.078-v1.081)

Evidence:
- v1.070 MP (2026-04-05): `reference_design_documentation/testing_images/20260405115204_1.jpg` through `20260405123302_1.jpg`
- v1.103 MP (2026-04-06): `reference_design_documentation/testing_images/20260406191016_1.jpg` (1,347ms frame time), `20260406191235_1.jpg`, `20260406191330_1.jpg`

## CQ_Bug_39
Title: UnspawnObject Error on Already-Destroyed Runtime Object During Cleanup

Observed:
- Engine reports `ERROR REPORTED BY UNSPAWNOBJECT WHILE RUNNING JS SCRIPT` during world interactable or runtime object cleanup.
- The try/catch in cleanup code swallows the JS exception, but the engine logs the error before the catch runs.
- Occurs during gate reset or round transitions when runtime-spawned WorldIcons may already have been destroyed by the engine.

Expected:
- Cleanup should not attempt to unspawn objects that no longer exist, or the error should be fully suppressed.

Status:
- Hardened (v1.110). All 14 UnspawnObject call sites across the codebase are now wrapped in try/catch.
- v1.110 guarded 6 previously unprotected calls in:
  - `index/vehicle-events.ts` (3 calls: disabled-slot rejection, type-mismatch respawn, initial-default replace)
  - `vehicles/spawner-bootstrap.ts` (1 call: startup pad cleanup)
  - `config/map-runtime.ts` (1 call: vehicle type swap during config apply)
  - `vehicles/spawner-slots.ts` (1 call: slot disable cleanup)
- BF6 Portal API does not expose `IsObjectValid` or equivalent, so no way to pre-check if a runtime-spawned object still exists before calling UnspawnObject. The engine logs the error before the JS catch runs (same pattern as CQ_Bug_37/38).
- The engine-side log noise ("ERROR REPORTED BY UNSPAWNOBJECT") is cosmetic — it fires before JS catch runs and cannot be suppressed from script. But all 6 unguarded calls could previously propagate as unhandled exceptions; this is no longer possible.
- Still occurring at v1.103 during MP testing with 3 players. Frequency may be exacerbated by CQ_Bug_40 frame overruns — when the script takes >1,000ms, the engine may destroy objects before the script's cleanup paths execute.
- Expect frequency to decrease after CQ_Bug_40 fix (v1.104) + this hardening (v1.110). Monitor during next MP test.

Evidence:
- v1.070 MP: `20260405121157_1.jpg`, `20260405122108_1.jpg`
- v1.103 MP: `20260406191016_1.jpg`, `20260406191330_1.jpg`

## CQ_Bug_38
Title: GetVehicleFromPlayer Invalid Value Error During Deploy/Vehicle Transitions

Observed:
- Engine reports `ERROR REPORTED BY GETVEHICLEFROMPLAYER WHILE RUNNING JS SCRIPT` / `Failed to perform operation as invalid value encountered.`
- Always paired with CQ_Bug_37 (GetPlayerVehicleSeat).
- The safe wrapper `safeGetVehicleFromPlayer` checks `isPlayerDeployed()` (script-side state) and uses try/catch, but the engine logs the error before the JS catch runs.
- Occurs during windows where script-side `deployedByPid` is true but the engine considers the player not in a valid vehicle state (death, respawn, vehicle destruction).

Expected:
- Vehicle queries should not produce engine error log entries during normal gameplay transitions.

Status:
- Resolved (v1.074+v1.076).
- v1.074: Added vehicle occupancy cache guard — `safeGetVehicleFromPlayer` checks `State.players.posDebugVehicleObjIdByPid[pid]` before querying the engine. Cache set on `OnPlayerEnterVehicle`, cleared on exit/undeploy.
- v1.076: Proactive cache set before `ForcePlayerToSeat` in deploy-fulfillment.ts prevents verification loop from failing due to missing cache entry.
- Residual edge case: in-vehicle death has a brief window where cache shows a vehicle but engine rejects the query. Try-catch handles this gracefully.
- Error logs confirmed clean in SP testing.

Related:
- CQ_Bug_37 (same root cause — engine/script deploy state divergence; fixed by same guard)

Evidence:
- Screenshots from v1.070 MP testing: `20260405115204_1.jpg`, `20260405115933_1.jpg`

## CQ_Bug_37
Title: GetPlayerVehicleSeat Invalid Value Error During Deploy/Vehicle Transitions

Observed:
- Engine reports `ERROR REPORTED BY GETPLAYERVEHICLESEAT WHILE RUNNING JS SCRIPT` / `Failed to perform operation as invalid value encountered.`
- The safe wrapper `safeGetPlayerVehicleSeat` checks `isPlayerDeployed()` and uses try/catch, but the engine logs before throwing.
- Called from `safeGetVehicleFromPlayer` (which calls seat check first) and from vehicle enter event handler.
- Occurs during transition windows: player death, between respawns, vehicle destruction, or seat changes.

Expected:
- Vehicle seat queries should not produce engine error log entries during normal gameplay transitions.

Status:
- Resolved (v1.074+v1.076).
- v1.074: Added vehicle occupancy cache guard — `safeGetPlayerVehicleSeat` checks `State.players.posDebugVehicleObjIdByPid[pid]` before calling `mod.GetPlayerVehicleSeat`. Skips the engine call entirely when the player has no cached vehicle.
- v1.076: Proactive cache set before `ForcePlayerToSeat` in deploy-fulfillment.ts prevents verification loop from failing due to missing cache entry.
- Error logs confirmed clean in SP testing.

Related:
- CQ_Bug_38 (paired — GetVehicleFromPlayer uses same guard chain)

Evidence:
- Screenshots from v1.070 MP testing: `20260405115204_1.jpg`, `20260405115933_1.jpg`

## CQ_Bug_36
Title: UndeployPlayer Called on Already-Undeployed Player During Loading Gate

Observed:
- Engine reports `ERROR REPORTED BY UNDEPLOYPLAYER WHILE RUNNING JS SCRIPT` / `Failed to apply action to player due to player not being deployed.`
- Two sources:
  1. `enforceUiLoadingGateWhileDeployed` (`player-loop-inputs.ts:21`) retries `mod.UndeployPlayer` every 0.2s while the gate is active, even if the player is already on the deploy screen.
  2. Gate loop belt-and-suspenders (`actions.ts:577`) fires `mod.UndeployPlayer` when `deployedByPid[pid]` is true but the engine considers the player undeployed.

Expected:
- UndeployPlayer should only be called when the engine actually considers the player deployed.

Fix:
- Guard both undeploy calls behind `isPlayerDeployed(player)` check (engine state, not just script state).

Status:
- Resolved (v1.071).
- Guarded both undeploy call sites behind `isPlayerDeployed(player)` check.
- Error logs confirmed clean in SP testing.

Related:
- CQ_Bug_35 (same loading gate spam pattern)
- CQ_Bug_40 (contributes to frame budget pressure)

Evidence:
- Screenshots from v1.070 MP testing: `20260405120805_1.jpg`, `20260405121157_1.jpg`, `20260405121803_1.jpg`, `20260405122108_1.jpg`, `20260405123302_1.jpg`

## CQ_Bug_35
Title: EnableAllInputRestrictions Spam on Undeployed Player During Loading Gate

Observed:
- Engine reports `ERROR REPORTED BY ENABLEALLINPUTRESTRICTIONS WHILE RUNNING JS SCRIPT` / `Failed to apply action to player due to player not being deployed.`
- Fills the entire error log — appears in all 8 MP test screenshots, heavily repeated (dozens of lines per screenshot).
- Source: `enforceUiLoadingGateWhileDeployed` (`player-loop-inputs.ts:14`) calls `setAllInputRestrictionsForPlayer(eventPlayer, true)` every OngoingPlayer engine tick while the gate is active. The engine rejects `EnableAllInputRestrictions` on undeployed players.
- Since the gate is active precisely because the player hasn't deployed yet, this fires every engine tick for the full 30s floor duration.
- Additionally, `maintainPlayerLoadingGateAuthority` in the gate loop calls `reassertPlayerUiLoadingGateVisuals` every 50ms iteration, which calls `holdPlayerAtDeploy` — redundant when the overlay and deploy block are already set.

Expected:
- Input restrictions should only be applied to deployed players.
- Gate authority reassertion should be set-and-forget, not hammered every tick.

Fix:
1. Guard `setAllInputRestrictionsForPlayer` call in `enforceUiLoadingGateWhileDeployed` behind `isPlayerDeployed(player)`.
2. Reduce `maintainPlayerLoadingGateAuthority` to only reassert on state changes, not every iteration.

Status:
- Resolved (v1.075).
- v1.071 added `isPlayerDeployed` guard in `enforceUiLoadingGateWhileDeployed` and throttled `maintainPlayerLoadingGateAuthority` via `GATE_REASSERT_INTERVAL = 20` (~1s at 50ms poll).
- v1.072 fixed non-ASCII em dash in inline comment that crashed the script on boot (prevented v1.071 from running).
- v1.075 eliminated remaining call sites: `onPlayerUndeployImpl` and `releaseLoadingGate` now use `recordUiLoadInputRestrictedForPid` instead of `setAllInputRestrictionsForPlayer` when player is undeployed.
- Error logs confirmed clean in SP testing.

Related:
- CQ_Bug_40 (frame budget — this spam was the primary cause; expected resolved)
- CQ_Bug_36 (same loading gate, same deploy-state mismatch; guarded in v1.071)
- CQ_Bug_41 (structural — OngoingPlayer does unconditional per-tick work)

Evidence:
- Screenshots from v1.070 MP testing: all 8 screenshots (`20260405115204_1.jpg` through `20260405123302_1.jpg`)
- v1.072 SP test: single occurrence visible in `20260405142543_1.jpg`

## CQ_Bug_34
Title: Vehicle Ground Spawner Rotation and Position Tuning Needed Across Maps

Observed:
- Some main-base vehicle ground spawners spawn vehicles in the wrong orientation.
- Positions may also be suboptimal for some slots on some maps.
- This is a per-map data tuning issue, not a code bug.

Expected:
- All vehicle ground spawners should place vehicles facing a sensible direction (toward the map/exit, not into walls or backward).
- Positions should avoid clipping or awkward placement.

Progress (v1.132-v1.141, Operation Firestorm):
- v1.132: Fixed team 2 jet, heli3, and transport1 rotY orientations (radians-to-degrees conversion).
- v1.138: Team 1 fast mover slot 1 rotY tuned to 134.0°. Team 2 fast mover slot 4 rotY tuned to -90.0°.
- v1.139: Reverted accidental all-slot changes; only slot 1 per team was intended to be adjusted.
- v1.141: Plane air deploy pitch (rotX) reduced from -75.0° to -45.0° for both teams (less steep nose-down angle).
- All ground vehicle spawn orientations on Firestorm confirmed correct by user testing.

Status:
- Partially resolved (Firestorm ground spawns and air deploy tuned).
- Other maps still need a per-map review of `spawnPos` / `spawnRot` values in `src/config/maps/*.ts`.

## CQ_Bug_33
Title: Loading Overlay Briefly Disappears During Team Swap

Observed:
- During a team swap, the loading overlay ("Custom Experience Engaging...") briefly vanishes for a frame or two before the warm prime cycle begins.
- The overlay then reappears and the gate continues normally.
- Likely the same root cause as CQ_Bug_32: the overlay show and warm prime are not separated by enough rendered frames.

Expected:
- The loading overlay should remain continuously visible from the moment the team-swap gate starts until the gate releases.

Status:
- Open.
- Deferred polish.
- Partially improved in `v1.013` by the same pre-prime overlay reassert + yield fix.
- Full fix likely requires ensuring `hideAllUiFamiliesForPlayer` does not transiently hide the overlay, or that the overlay is immediately reasserted after it runs.

Related:
- CQ_Bug_32 (same underlying timing issue)
- CQ_Bug_30 (parent issue for loading gate lifecycle)

## CQ_Bug_32
Title: Ready Dialog Flickers Briefly On First Join During Loading Gate

Observed:
- When a player first joins, the ready dialog is briefly visible for 1-2 frames before the loading overlay fully occludes it.
- This was introduced in `v1.011` when `UI_LOAD_TRACE_ENABLED` gating removed ~10-20ms of trace overhead from the gate startup path. That overhead had acted as an inadvertent timing buffer, giving the overlay time to fully composite before `primeReadyDialogRevealWhileBlocked` made the dialog temporarily visible.
- Partially improved in `v1.013` by reasserting the overlay and yielding one frame before the warm prime starts, but a small flicker may still be observable.

Expected:
- The loading overlay should be fully rendered and composited before any warm-prime show/hide cycle begins.
- The ready dialog should never be player-visible during its hidden warm prime pass.

Status:
- Open.
- Deferred polish.
- v1.013 fix (reassert overlay + `await mod.Wait(0)` before prime) reduced but did not fully eliminate the flicker.
- Full fix likely requires one of:
  - Build the ready dialog with explicit `visible: false` on all children during the prime pass instead of relying on the overlay to occlude it
  - Move the warm prime to occur before the player reaches the deploy screen (during an earlier lifecycle phase)
  - Use z-depth ordering to guarantee the overlay is always above the ready dialog during the prime

Related:
- CQ_Bug_30 (parent issue for first-use menu creation hitching and loading gate lifecycle)
- Design doc: loading gate "build -> refresh hidden/content-only -> reveal once" contract

## CQ_Bug_31
Title: Runtime Errors After Gadget Locker / Deploy Interaction

Observed:
- Screenshot reference:
  - `bf6-portal/dev/conquest/reference_design_documentation/testing_images/20260329161017_1.jpg`
- At least two runtime errors were observed in the same failure window.
- One appears related to the gadget locker path:
  - cooldown
  - charges
  - button state
  - or countdown state ownership
- Another appears likely related to deploy behavior.
- One observed engine error mentions `UnspawnObject`, but the exact ownership path is not yet confirmed.

Expected:
- Gadget locker interaction should not emit runtime errors while updating charges, cooldowns, or button states.
- Ground/air deploy actions should not produce cleanup or unspawn errors during ordinary use.

Status:
- Likely obsolete as of v1.313. Re-observe before treating as active.
- Gadget locker path reworked wholesale (v1.308 slot-based `HasEquipment`-diff probe replaced the v1.306 by-id probe; v1.309 dropped the destructive by-id sweep in `giveLauncher`; v1.311 corrected the `Deployable_Vehicle_Supply_Crate` enum; v1.312 removed the ambiguous `loaded===1 → launcher` inference from `probeSlot`). The failure surfaces (cooldown / charges / button state / countdown state) for this path have been re-implemented on top of authoritative per-player slot state (`State.players.lockerSlots`).
- Deploy cleanup `UnspawnObject` path was reworked via `sinkAndDestroyVehicle` consolidation (v1.270–v1.276) and Phase 6 HQ Deploy seat-flow (v1.277–v1.289).
- If the original symptom does not reproduce in v1.313, close this entry. If it does, open a fresh issue with a v1.313 stacktrace rather than re-opening v1.290-era analysis.

Current Best Read:
- Both suspected paths have been rewritten since the original observation; the original root cause (whatever it was) likely no longer exists.

Recommended Later Investigation:
- First re-test under v1.313 before investing further.
- If it still reproduces, capture admin log + exact action sequence and file a new CQ_Bug_* with a v1.313-specific body — do not treat CQ_Bug_31 as "the bug" since the code under it has been replaced twice over.

## CQ_Bug_30
Title: First-Time Menu Creation Causes Noticeable Hitching / Delay

Observed:
- Menus are lagged and delayed when players are loading into them for the first time.
- Once the major menus are cached and warmed, the script appears much more stable.
- This hitching is most noticeable when one player is already using a menu and another player opens a different menu for the first time.
- Latest playtest read with the `UI CACHE` panel during multiplayer stress:
  - `Vehicle` commonly landed at `Built/Rebuilt 1/1`, `Cold/Invalid 0/1`
  - `Ready` commonly landed at `Built/Rebuilt 2-3/0`, `Cold/Invalid 0/2`
  - `Gadget` was the most stable at `Built/Rebuilt 1/0`, `Cold/Invalid 0/0`
- The visible player experience is still unacceptable in bad cases:
  - a player can see the script and menus loading in
  - the first-use window can last roughly `10-15` seconds

Expected:
- Primary menus should already exist client-side before first deliberate interaction, so first opens should behave like reveals rather than cold builds.
- Players should not be able to interact physically, open production menus, deploy, or otherwise advance into gameplay before the critical UI/menu warm path is complete.
- Any temporary loading/lockout phase must be fail-safe:
  - no permanent player lockout
  - no infinite loading state if one warm/build step goes wrong
  - late joiners and live-phase joiners must still transition cleanly into a playable state

Status:
- Likely resolved.
- Believed fixed by loading gate rearchitecture and UI cache polish passes through v1.013–v1.025. Needs confirmation in multiplayer testing.

Current Best Read:
- This is a UI lifecycle / warm-order / invalidation issue rather than a steady-state runtime issue.
- Current likely candidate families:
  - vehicle HUD family
  - ready dialog
  - gadget locker
- The current problem is broader than one menu being slow.
- The system still lacks a fully authoritative "player blocked until warm" contract, so players can reach production interaction states while caches are still being created.
- Current code already has a partial deploy block / HUD-warm controller, but it currently proves only the critical HUD family and then lets deferred menu warm continue afterward.
- That means the architecture still allows players to be released before all production menu families are actually warm and cache-usable.
- Current playtests also suggest the gate is still releasing too early even after cache-usable checks pass:
  - the visible reveal path can still settle after release
  - the static HQ ready-dialog path can still feel cold on first use
  - team-swap loading visibility can still flicker or disappear
  - this suggests a missing second stage after deploy where deployed-only UI/runtime work still settles while the player is already free to move and interact
- The likely next architecture direction is:
  - extend the existing deploy-block / HUD-warm controller into a formal loading gate
  - define readiness as script-authoritative global + per-player warm ownership
  - block all production menu entry paths behind the same loading-state contract
  - release player input/deploy only after:
    - hidden warm is complete
    - visible reveal is complete
    - deploy is released
    - post-deploy finalize is complete
    - hot-open menu paths are primed
    - or the timeout/fallback path fails over safely
  - keep one idempotent release function so success and timeout use the same cleanup path
- Latest confirmed playtest result:
  - loading overlay timing is materially better on first join
  - menus can feel hotter before the overlay clears
  - but players are still not reliably prevented from deploying or moving while the loading gate is still active
  - this means the next blocker is no longer just UI warm sequencing
  - it is now a deploy/spawn gate correctness problem on first join
- Verified local BF6 API position:
  - per-player:
    - `EnablePlayerDeploy(player, deployAllowed)`
    - `SetRedeployTime(player, redeployTime)`
    - `EnableAllInputRestrictions(player, restricted)`
  - global:
    - `SetSpawnMode(spawnModes)`
  - current Conquest `src` does not call `SetSpawnMode(...)` / `AutoSpawn`
- Current best interpretation of that combination:
  - the remaining failure is likely in release timing or current deploy/spawn API usage
  - not in a known global auto-spawn configuration
- Latest confirmed evidence:
  - the hard audit lock proved `EnablePlayerDeploy(player, false)` works in Conquest
  - first-join screenshots through `v0.991` still show accepted deploy while the experience is not actually ready
  - so the remaining bug is script-side early join release ownership, not API incapability
  - later first-join testing showed undeploy-driven generic refresh warm could still preempt the join-owned loading session
  - `v0.994` now adds a dedicated first-join deploy-lock latch so generic warm state and join deploy authority are separated in code
  - `v1.003` now narrows Ready hotness ownership:
    - pre-deploy warm only proves hidden Ready warmth
    - deployed finalize refreshes hidden Ready state after spawn before movement release

Implementation / Debugging Failures Observed:
- Proven capability, weak conditional release:
  - the hard lock / timed lock proofs worked
  - this proves the BF6 deploy APIs are capable in this project
  - the failures happened after conditional readiness was layered back in
- Multiple concerns were mixed into one gate:
  - deploy authority
  - loading overlay lifecycle
  - hidden UI warm
  - visible reveal timing
  - first Ready-open hotness
  - this made it easy to "fix" one symptom while regressing another
- Hidden cache warmth was treated as equivalent to real first-open readiness:
  - hidden `uiBuilt`
  - hidden prime/show-hide
  - `readyDialogWarmPrimed`
  - actual static HQ first open
  - these are not the same thing and must not be collapsed into one flag
- Overlay visibility was incorrectly used as truth:
  - stale overlay could remain after release
  - later, visible finalize code made the overlay disappear and then come back
  - the overlay is presentation only; deploy authority must never depend on what the overlay appears to be doing on screen
- A bad regression path was introduced in deployed finalize:
  - finalize explicitly reasserted loading visuals after release
  - finalize also visibly opened the Ready dialog
  - this produced:
    - loading UI returning after it had already hidden
    - visible garbage / unknown strings in the Ready dialog
  - this path is architecturally wrong and should not be reintroduced
- Join-gate ownership drift happened repeatedly:
  - generic warm / refresh paths
  - undeploy handling
  - join release
  - deployed finalize
  - all competed to decide whether the player was "ready"
  - the result was early release, stale overlay state, or both
- Documentation drift also contributed:
  - some docs said first join must remain pre-deploy only
  - other docs allowed a short post-deploy finalize
  - that contradiction made it easier to rationalize the wrong implementation path
- Debugging visibility was often poor:
  - world-log messages were too transient
  - overlay-projected debug was tied to the wrong surface
  - temporary HUD debug helped more, but the core issue remained that the wrong state was being observed

Latest Regression Evidence To Preserve:
- Loading UI could hide and then come back.
- Player could still deploy/move while the system was not truly ready.
- Ready first-open still took roughly `2-3s` even after the lock period.
- Visible post-deploy Ready prime produced garbage / unknown-string state and was not acceptable.

Current Guardrail Before Further Work:
- Do not reintroduce visible post-deploy loading or visible Ready-dialog priming.
- Do not use overlay visibility as evidence that deploy should still be blocked or released.
- Keep deploy authority, hidden warm readiness, and first real Ready-open latency as separate things in both code and debugging notes.
- Locked next-step policy:
  - do not continue broad loading-gate changes until the first-join deploy-release race is instrumented and understood
  - do not revisit global spawn-mode changes without measured evidence
  - keep the next implementation scoped to a small, commented first-join state machine:
    - `beginJoinLoadingGate(...)`
    - `holdPlayerAtDeploy(...)`
    - `handlePlayerDeployedBeforeRelease(...)`
    - `releaseJoinLoadingGate(...)`
  - keep first join pre-deploy-first
  - if the actual first Ready-open cost still only appears after spawn, use one short join-owned post-deploy finalize under full input restriction
  - only `releaseJoinLoadingGate(...)` may authorize first-join deploy
  - add a dedicated first-join deploy-lock latch that starts in `beginJoinLoadingGate(...)` and clears only in `releaseJoinLoadingGate(...)`
  - no non-join path may clear that latch
  - treat join release readiness as a multi-frame handshake instead of one optimistic poll:
    - force widget visibility/build
    - wait `1-2` frames
    - write visibility/content again
    - require several stable post-reveal polls before deploy release
  - if the actual first Ready-open cost still only appears after spawn, first join may hand off into a short post-deploy finalize under full input restriction instead of freeing player movement immediately

Newcomer Handoff / Resume-From-Here:
- Current runtime baseline to resume from:
  - `v1.008`
  - team-swap staged loading-session work introduced in `v1.005-v1.007` has been rolled back
  - treat `v1.005-v1.007` as failed experiments, not as valid design direction
- What is currently true:
  - first join still uses the conservative hybrid gate and remains architecturally incomplete
  - team swap is back on the older baseline and still needs redesign
  - Ready first-open latency is still unresolved
- What is already proven:
  - `EnablePlayerDeploy(player, false)` works in this project
  - `EnableAllInputRestrictions(player, true)` works as the post-deploy movement lock
  - the main unresolved problem is release ownership / readiness definition, not BF6 API absence
- Proof timeline that should not be re-learned from scratch:
  - `v0.982`
    - hard audit lock proved deploy can be held indefinitely
    - conclusion: deploy API works here
  - `v0.997-v0.998`
    - fixed `10s` then `30s` hard-lock proofs worked
    - conclusion: deploy can be held and then released on demand
  - `v0.999+`
    - conservative hybrid gate with a minimum time floor improved safety
    - conclusion: this is a temporary mask, not proof that readiness logic is correct
  - `v1.003`
    - visible post-deploy finalize and visible Ready priming caused major regressions
    - conclusion: visible post-deploy loading / visible Ready prime is architecturally wrong for this project
  - `v1.005-v1.007`
    - staged team-swap loading-session attempt regressed into flicker / no-show / repeated ownership problems
    - conclusion: that branch is failed architecture and was rolled back
  - `v1.008`
    - rollback baseline
    - conclusion: resume redesign from here, not from the failed team-swap branch
- Exact code files a newcomer should read first:
  - `src/interaction/actions.ts`
    - loading-session start/reassert/release ownership
  - `src/interaction/hud-warm-state.ts`
    - per-player loading state and trace fields
  - `src/index/player-deploy.ts`
    - deploy / undeploy / recapture / finalize behavior
  - `src/index/player-join-leave.ts`
    - join entry path
  - `src/index/player-loop-inputs.ts`
    - ongoing authority / recapture behavior
  - `src/ready-dialog/dialog-build.ts`
    - Ready warm/prime path
  - `src/interaction/world-interactables.ts`
    - static HQ Ready interaction entry path
  - `src/interaction/interact-point.ts`
    - shared Ready open path
- What not to trust:
  - any assumption that hidden cache existence equals real first-open hotness
  - overlay visibility as evidence of deploy authority
  - the reverted team-swap staged-release branch as a base for extension
  - the current conservative first-join time floor as a finished design; it is only a temporary safety mask
  - temporary debug surfaces as source-of-truth state; use them as hints only
- Safest resume order:
  1. instrument first-join deploy-release ownership cleanly
  2. prove first-join deploy/movement authority end-to-end
  3. instrument static HQ Ready first-open latency end-to-end
  4. only then redesign team-swap loading from the older baseline
- Suggested proof artifacts for the next engineer:
  - one timeline table for first join
  - one timeline table for static HQ Ready first open
  - one list of exact show/hide owners for the loading overlay
  - one list of exact deploy-enable owners
- If a newcomer is unsure where to begin:
  - begin in `src/interaction/actions.ts`
  - identify every caller of:
    - `showJoinPromptLoadingForPlayer(...)`
    - `EnablePlayerDeploy(..., true)`
    - `EnableAllInputRestrictions(..., false)`
  - reduce those to explicit owners before changing behavior again

Recommended Later Investigation:
- Use the `UI CACHE` panel to identify which family is cold-building or rebuilding during the hitch window.
- Re-test first-open behavior with multiple players while all current cache counters are visible.
- Instrument the first-join deploy-release timeline specifically:
  - record every place deploy is re-enabled for the player
  - record whether `OnPlayerDeployed` fires while `!isUiLoadGateReleasedForPid(pid)`
  - confirm whether the current undeploy fallback is actually winning the race
- The staged team-swap loading-session attempt introduced after `v1.004` has been rolled back after repeated regressions.
- Team-swap loading now needs redesign from the earlier baseline rather than incremental extension of the failed staged-release attempt.

## CQ_Bug_29
Title: Teleport While Live May Cause Performance Degradation

Observed:
- There is a suspected performance impact when a player is teleported while live.
- Repro is currently unclear.

Expected:
- Teleporting a live player should not create a noticeable script hitch or broader runtime degradation.

Status:
- Open.
- Needs repro.

Current Best Read:
- This is not isolated enough to assign to one subsystem yet.
- Likely candidates include:
  - HUD/viewer refresh churn
  - vehicle/menu ownership changes
  - deployment-state transitions

Recommended Later Investigation:
- Capture a clean repro sequence with:
  - teleport source state
  - destination state
  - whether a menu was open
  - whether the player was in a vehicle
  - whether any cache counters changed at the same time

## CQ_Bug_28
Title: Air Deploy Can Spawn Player On Ground With Wrong Rotation

Observed:
- Air deploy can place the player on the ground instead of in the intended air spawn state.
- When this happens, the player rotation is also wrong.

Expected:
- Air deploy should spawn in the authored air state with the intended orientation.

Status:
- Open.
- Active investigation.

Current Best Read:
- This is likely in the spawn transform / spawn mode application path, not a UI-only problem.
- Rotation and altitude failures should be treated as one deploy contract bug until proven otherwise.

Recommended Later Investigation:
- Reproduce across the authored air-deploy locations and compare:
  - expected transform
  - actual transform
  - actual player orientation

## CQ_Bug_27
Title: Passive Vehicle Display Shows Zeroes For Empty Top Slots On Start

Observed:
- On round start, the passive vehicle display can show `0` values for the top four vehicle spots even when there are no active vehicles in those slots.

Expected:
- Empty vehicle slots should show the intended idle/empty state, not misleading zero values.

Status:
- Resolved.
- Fixed in vehicle HUD render passes during Phase 5/7 polish (v1.014–v1.025 era).

## CQ_Bug_26
Title: Passive Vehicle Menu Can Stay Hidden After Opening Live Air Deploy Menu

Observed:
- Opening the live air deploy menu can make the passive vehicle menu disappear.
- After that, the passive menu stays hidden until another menu is opened and closed, such as the ready dialog.

Expected:
- Closing or leaving the live deploy menu should restore the passive vehicle display immediately when that player still owns the passive vehicle HUD surface.

Status:
- Likely resolved.
- Believed fixed by vehicle HUD polish passes during Phase 5/7 work. Needs confirmation in multiplayer testing.

Current Best Read:
- This is likely another reveal-owner / visibility restoration issue inside the shared vehicle HUD family.
- The passive and live variants likely disagree on who is responsible for the final reveal after the live menu closes.

## CQ_Bug_25
Title: Main-Base / World Icons Still Fail Per-Player Distance And Visibility Ownership

Observed:
- Icons only appear correctly for the first player.
- They are not showing uniquely per player.
- Distance behavior is also wrong; visibility is not resolving correctly by each player's local position/state.

Expected:
- World icons should resolve independently per player, including distance gating and visibility state, instead of inheriting the first player's outcome.

Status:
- Resolved (single-player confirmed v1.064). Needs multi-player confirmation.

Investigation History (v1.047–v1.064):
- v1.047–v1.059: Exhaustive attempts to use `mod.AddUIIcon` on InteractPoints, authored WorldIcons, and spawned WorldIcons. All calls completed without error but **never rendered visible output**. Tested with multiple parent types, offsets, visibility params, and enum values across 12+ iterations.
- v1.060: Abandoned `AddUIIcon` entirely. Switched to per-player **spawned WorldIcon clones** via `mod.SpawnObject(RuntimeSpawn_Common.WorldIcon, pos, rot)` with `mod.SetWorldIconOwner(icon, player)` for per-player visibility. Single-player confirmed working: all main base and gadget icons render correctly.
- v1.061: Added `ownerTeamId` filter to restrict main base icons by team. Had a TS type error (`TeamID` vs `0` comparison) in bundle output.
- v1.062–v1.063: Fixed swapped anchor `ownerTeamId` assignments (reverted — anchors were correct), fixed TS type error.
- v1.064: Corrected the root data error — `team1Base`/`team2Base` position vectors were swapped in `operation-firestorm.ts`. Team1 (WEST) is at negative X (-761), Team2 (EAST) is at positive X (570). Anchors and all other ObjId assignments were already correct.

Root Cause:
- `mod.AddUIIcon` is non-functional in the Santiago engine build — completes without error but never renders.
- The original spawned-WorldIcon approach (pre-v1.047) failed because `mod.SpawnObject(RuntimeSpawn_Common.WorldIcon, ...)` creates icons with image/text **disabled by default**. The code never called `EnableWorldIconImage(icon, true)` or `EnableWorldIconText(icon, true)`.
- The `team1Base`/`team2Base` position vectors were swapped in the map config, causing the team ownership filter to compare against the wrong base.

Resolution:
- `src/interaction/world-interactables.ts`: Complete rewrite to per-player spawned WorldIcon clone pattern. Each player gets their own WorldIcon per config, tracked in `worldInteractableIconByPidByObjId[pid][objId]`. Icons are spawned at `config.iconAnchorPos`, configured with image/color/text, restricted via `SetWorldIconOwner(icon, player)`, and explicitly enabled.
- `src/config/maps/operation-firestorm.ts`: Corrected `team1Base`/`team2Base` position swap.
- Team filter in `shouldShowWorldInteractableRuntimeIconForPlayer` gates main base icons by `config.ownerTeamId` vs player team.
- Sync triggers: deploy, enter/exit main base area trigger, enter/exit gadget area trigger, undeploy/disconnect.
- Cleanup: `cleanupWorldInteractableRuntimeIconsForPid` unspawns all icons and clears state on undeploy/disconnect.

Key Lessons:
- `mod.AddUIIcon` is non-functional — documented in AGENTS.md. Do not use.
- Spawned WorldIcons start disabled — must call `EnableWorldIconImage(icon, true)` and `EnableWorldIconText(icon, true)`.
- `mod.Message()` requires registered string keys from `strings.json` via `mod.stringkeys.*` — literal strings produce "unknown string".

Remaining:
- Multi-player test: confirm per-player visibility isolation with 2+ players at different team bases.
- Confirm `SetWorldIconOwner` correctly restricts icons per-player in multiplayer.

## CQ_Bug_24
Title: Passive Deployed Vehicle HUD Failed To Refresh After Config Apply

Observed:
- While the player was already deployed and using the passive right-side vehicle list, applying a ready-dialog config change would not refresh that passive list immediately.
- The undeployed deploy-screen vehicle list could recover correctly, but the passive deployed list often stayed stale or missing until the player fully redeployed.
- The live deploy terminal menu also went through several stale-row / dead-row variants while this regression was being chased.

Expected:
- Applying vehicle config should rebuild the vehicle HUD content behind the scenes while hidden, then re-show the correct owners without requiring a redeploy.
- Deployed passive viewers, undeployed viewers, and live deploy terminal viewers should all resolve from the same authoritative selected slot set.

Status:
- Resolved.

Resolution Summary:
- Stopped treating config apply as a generic public refresh problem.
- Switched the live/passive vehicle row source to the selected spawn-spec slot set instead of stale live `slot.enabled` state.
- Restored the accepted hidden-build/reveal ownership contract:
  - invalidate render signatures
  - prebuild vehicle HUD content hidden for all viewers
  - reveal only the viewers that currently own that surface
- Removed the temporary vehicle-HUD `layoutVersion` workaround after the ownership path was corrected.

Regression Context:
- This bug regressed repeatedly because several fixes chased stale content or widget cache symptoms instead of the actual reveal owner.
- The stable solution was architectural, not cosmetic: content must be rebuilt hidden and revealed by the current owner, not force-refreshed as if visibility ownership were unchanged.

## CQ_Bug_23
Title: Live Deploy Terminal Backplate Drifted Or Shaded Over The Controls

Observed:
- The live deploy terminal menu backplate repeatedly regressed into the wrong coordinate frame or wrong layer.
- Reported bad variants included:
  - plate shifted far left or into a different screen region
  - plate tinting on top of buttons and labels instead of sitting behind them
  - close button drifting away from the intended lane

Expected:
- The live deploy menu should reuse the existing vehicle HUD lane and place a dedicated backplate behind the actionable columns only.
- The backplate should not introduce a second competing layout owner or shade over the row widgets.

Status:
- Resolved.

Resolution Summary:
- Re-centered the live panel around the existing vehicle HUD lane instead of mixing screen-space and container-local ownership.
- Kept the controls on the existing reused vehicle HUD root and treated the plate as dedicated background chrome.
- Restored the close button to a deliberate centered-below placement and kept it visually distinct without moving the reused row/button geometry.

Regression Context:
- The repeated regressions came from mixing coordinate frames and changing widget ownership without first confirming the actual rendering path.
- The accepted fix was to stop guessing and treat the live panel as one background owner around the already-working reused HUD lane.

## CQ_Bug_22
Title: Main-Base Ready/Deploy World Icons Failed Per-Player Visibility And Anchor Placement

Observed:
- Main-base ready/deploy icons went through several broken states during implementation:
  - visible globally instead of only inside own HQ
  - missing entirely
  - appearing near map center / origin instead of at the terminal
  - visible in the wrong team context
- The authored interact points were working, but icon ownership and placement were not stable.

Expected:
- Even `READY` and odd `DEPLOY` icons should appear only for the correct player while deployed inside their own HQ, at the authored terminal locations, and disappear cleanly when the player leaves HQ.

Status:
- Resolved.

Resolution Summary:
- Stopped depending on unreliable runtime-derived terminal positions for this path.
- Moved to explicit authored terminal anchor data for the map and spawned one per-player runtime `WorldIcon` at that authored anchor.
- Kept authored interact points shared and stable, while gating icon visibility and activation in script by team/HQ state.

Regression Context:
- Several earlier attempts mixed authored world icons, runtime-spawned world icons, and `AddUIIcon(...)` ownership patterns.
- The stable checkpoint is:
  - shared authored `WorldIcon` + `InteractPoint` pair for the terminal contract
  - explicit authored anchor position for the runtime icon
  - per-player runtime icon visibility controlled only by the HQ/team gate

## CQ_Bug_21
Title: Ready-Dialog Open Latency After Interact

Observed:
- The ready dialog can still take a noticeable amount of time to appear after pressing the interact key.
- This is most noticeable:
  - on first spawn in a server
  - after team switch
  - on some live-transition/open cases
- The current accepted checkpoint is functional and no longer spams the runtime log, but the dialog can still feel like it is losing a cache race or paying a cold-open cost.

Expected:
- Once the ready-dialog interact point is available and the player presses interact, the dialog should appear effectively immediately.
- The dialog should feel like a pure reveal path, not a delayed build/rebuild path.

Current Accepted Behavior:
- This is deferred for later polish.
- The current accepted checkpoint prioritizes:
  - no ready-dialog `SETUITEXTLABEL` runtime spam
  - stable dialog functionality
  - preserved interact-point behavior
- The remaining open-speed issue is therefore tracked as a standalone polish bug rather than being folded back into the older spam investigation.

Status:
- Likely resolved.
- Believed fixed by v1.013 loading gate rearchitecture and UI cache warm-prime improvements. Needs confirmation.

Current Best Read:
- The current issue is no longer the old label-spam problem.
- The stronger suspicion is:
  - hidden-cache warm timing
  - cache invalidation/rebuild timing around first join / team switch / some phase transitions
  - or remaining reveal/input delay after the cache exists

Recommended Later Investigation:
- Reproduce on the current accepted build and separate these cases:
  - first join/open
  - post-team-switch open
  - later reopen with no intervening invalidation
- Verify whether the open path is:
  - cold-building the hidden dialog
  - rebuilding one cached section
  - or merely delayed after cache already exists
- Keep this isolated from `CQ_Bug_18`; do not re-open broad ready-dialog lifecycle churn unless the current no-spam baseline is explicitly proven safe.

## CQ_Bug_20
Title: Ready-Dialog Roster Base-State Can Go Stale During Live Round

Observed:
- Once the round is live, the ready-dialog roster can stop reflecting live `In Main Base` changes.
- Example:
  - a player leaves or re-enters main base
  - the underlying base-state changes
  - the ready-dialog roster row still shows the old `IN` / `OUT` value while the dialog remains usable otherwise

Expected:
- The ready-dialog roster should continue reflecting current per-player base-state during live rounds, even if the ready button itself is visually locked.

Current Accepted Behavior:
- This is deferred for later polish.
- The current accepted checkpoint keeps the ready-dialog stable and avoids reopening the previous UI spam and cache-regression issues.
- Live-round roster freshness is therefore tracked as a separate polish bug instead of being folded back into the ready-dialog lifecycle work.

Status:
- Open.
- Deferred polish.

Current Best Read:
- The likely issue is not that `inMainBaseByPid` stops changing.
- The stronger suspicion is that the live-round roster refresh policy is still partly pre-live-oriented.
- Current likely source path:
  - [area-triggers.ts](c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/index/area-triggers.ts)
  - [roster-render.ts](c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/ready-dialog/roster-render.ts)
- Base-state updates still occur, but some refresh behavior and design assumptions were originally built around pre-live readiness gating.

Latest Findings (2026-03-22):
- `onPlayerExitAreaTriggerImpl(...)` still contains explicit pre-live-only behavior for the ready/base path.
- The ready-dialog roster renderer itself can display live base-state correctly if refreshed.
- That points more toward a missing live refresh policy or stale visible-viewer update path than a bad data source.

Recommended Later Investigation:
- Reproduce while live with one dialog viewer open and another player crossing the main-base boundary.
- Verify separately:
  - `State.players.inMainBaseByPid[pid]` changes as expected
  - `renderReadyDialogForAllVisibleViewers()` is or is not being called on the live transition
  - `buildReadyDialogRosterSignature(...)` changes when the base-state flips live
- If the signature changes but the row stays stale, patch the visible-viewer refresh path.
- If the signature does not change live, patch the roster signature or state ownership first.

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
- Older investigation linked this to `CQ_Bug_18`, but that spam issue is currently fixed at the accepted checkpoint.
- Current best read should therefore treat this as an independent longer-session runtime/UI degradation bug unless a future repro proves the coupling again.
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
- Correlate the failure window with any current runtime noise or stale-widget behavior, but do not assume the old `CQ_Bug_18` spam coupling still holds without fresh evidence.
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
- Resolved at the current accepted checkpoint.
- The ready dialog can now be opened without re-entering the old repeated `SETUITEXTLABEL` spam state.

Status:
- Resolved.

Resolution Summary:
- The effective fix came from stabilizing the ready-dialog lifecycle around a cached hidden build plus pure reveal/open path, while removing the reopen/reveal-time text churn that had been reintroduced during later polish passes.
- The issue should still be watched as a regression risk whenever the ready-dialog open/reveal path is modified again.

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

Latest Findings (2026-03-23):
- The current accepted build no longer has a standing repro for the ready-dialog `SETUITEXTLABEL` spam.
- The remaining ready-dialog UX issue is open-speed / latency, now tracked separately as `CQ_Bug_21`.
- `CQ_Bug_19` should no longer treat this bug as an assumed active upstream cause unless a future regression brings the spam back.

Recommended Later Investigation:
- Regression watch only:
  - if future ready-dialog work reintroduces runtime spam, reopen this bug with the new checkpoint/build and exact repro path
  - otherwise keep follow-up ready-dialog UX work under `CQ_Bug_21` instead

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

## CQ_Bug_43
Title: Cheetah (AA Vehicle) Spawn Binding Failure — Untracked Vehicles and Respawn Loop

Observed (v1.127, Operation Firestorm, SP):
- Cheetah spawns physically at the authored tank slot position but is never bound to the spawner slot.
- The spawner system thinks the slot is empty and keeps attempting to spawn additional Cheetahs (respawn loop).
- On match start, `destroyAllTrackedVehicles()` does not destroy the unbound Cheetahs — they persist into the live match.
- Reproducible in ALL 4 team 1 tank slots when filled with Cheetahs.
- An Abrams spawned in the same slot (slot 2) binds correctly — confirms the position/config is valid for other vehicle types.
- The Cheetah also has a ~36° model forward-axis offset compared to the Abrams: authored rotY=140.047° produces debug rotY=~104° for the Cheetah, while the Abrams at authored rotY=143.849° faces correctly.

Candidate Causes:
1. **Spawn displacement**: The Cheetah's ~36° model offset or larger collision box may cause it to spawn displaced from the VehicleSpawner origin, causing the spawner-to-vehicle matching in `OnVehicleSpawned` to fail.
2. **Vehicle type classification**: The Cheetah may not be recognized during vehicle registration, causing the bind step to silently skip.
3. **Engine-side spawn failure**: The Cheetah may fail to fully initialize at these positions (collision with nearby structures), firing `OnVehicleDestroyed` before `OnVehicleSpawned` binding completes.

Expected:
- Cheetah should bind to slot like any other vehicle type.
- Unbound vehicles should not persist through match lifecycle transitions.

Root Cause (v1.133):
- `doesVehicleMatchConfiguredSlotType()` in `spawner-bind.ts` called `mod.CompareVehicleName(vehicle, slot.vehicleType)`.
- For `mod.VehicleList.Cheetah` (engine enum for actual Gepard), `CompareVehicleName` returned false — likely because the engine's internal vehicle name doesn't match the enum label.
- This guard existed at 4 call sites: `vehicle-events.ts:82` (actively destroyed vehicle + retried → respawn loop), `spawner-bind.ts:211` (token path), `spawner-bind.ts:237` (distance fallback), and `deploy-fulfillment.ts:471` (deploy flow).
- The original helis mode had NO equivalent guard — this was added speculatively for Conquest's dynamic vehicle selection.
- Fix: removed all 4 guards and the `doesVehicleMatchConfiguredSlotType` function entirely. Token/distance matching is sufficient identity proof.

Status:
- Resolved (v1.133). The ~36° model forward-axis offset may still exist visually but binding and orientation correction now fire correctly.

Related:
- CQ_Bug_34 (vehicle ground spawner orientations need per-map pass)
- CQ_Bug_28 (vehicle-specific issues, only some vehicles affected)

## CQ_Bug_44
Title: Deploy Menu Not Refreshing After Undeploy From Vehicle

Observed (v1.127–v1.142, Operation Firestorm, SP):
- During pre-game (not live), repeatedly ground deploying, redeploying, and returning to the deploy menu causes the deploy buttons and vehicle list to not reappear reliably.
- Re-repro'd in v1.142: got in a chopper, undeployed, and the deploy menu stayed hidden on the deploy screen until a respawn timer started for some vehicle (which forced a `updateVehicleDeployTimerHudForAllPlayers` call via the slot cooldown loop).

Root Cause:
- `onPlayerUndeployImpl` (src/index/player-deploy.ts) flipped `State.players.deployedByPid[pid] = false` and cleaned up state, but it never called the deploy timer HUD refresh. The only refresh in the undeploy path was inside `closeVehicleDeployLiveMenuForPlayer` (src/vehicles/deploy-live-menu.ts), which early-returned when the live terminal was never open (the common "alive in vehicle" case).
- Result: the HUD cache kept its "alive + hidden" `lastVisibleState` until some other event forced a refresh:
  - A discrete vehicle event calling `updateVehicleDeployTimerHudForAllPlayers` (e.g. `scheduleVehicleSlotRespawnTimer` → `runVehicleSlotCooldownHudLoop` in src/vehicles/timers.ts).
  - The v1.121 1-second live-tick re-assertion at `conquestPhase2AOnLiveTick` (capture-tickets.ts), which only runs during `isMatchLive() && !victoryDialogActive` — pre-live was completely uncovered.

Fix (v1.143):
- Added a direct `updateVehicleDeployTimerHudForPlayer(eventPlayer)` call at the end of `onPlayerUndeployImpl` (after the loading-gate early-return block).
- Relies on `refreshVehicleDeployTimersForPlayerPreservingVisibility`'s `autoOwnsVisibility` branch: with `deployedByPid[pid] = false` now set, the refresh computes `nextVisibleState = renderPlan.visible && true` and reveals the family immediately.
- Safe during both pre-live and live; the refresh function internally short-circuits when the loading gate is active.

Status:
- Resolved (v1.143). Needs SP repro verification: die in a vehicle → confirm deploy menu appears immediately on deploy screen without waiting for any vehicle respawn event.

## CQ_Bug_45
Title: Transport Slots 3 and 4 Not Spawning Vehicles

Observed (v1.127, Operation Firestorm, SP):
- Transport slots 3 and 4 (10v10 preset: Black Hawk + Quad Bike) are not functional — vehicles do not appear.
- Slot 3 (Black Hawk) worked correctly because its 10v10 default was already UH60, so the physical spawner was created at the heli anchor at bootstrap.
- Slot 4 (Quad Bike default, knob-changed to Black Hawk) failed: the physical spawner stayed at the fast mover anchor from bootstrap, but `slot.spawnPos` was updated to the heli anchor. The vehicle spawned at the old position and was teleported ~43-54m to the heli position, triggering engine abandonment (`SetVehicleSpawnerKeepAliveSpawnerRadius`) which destroyed the vehicle.

Root Cause:
- `applyVehicleSpawnSpecsToExistingSlots` updated `slot.spawnPos` and `slot.spawnRot` when the knob changed vehicle type (and thus the anchor changed from fastMoverSpawns to heliSpawns), but did not relocate the physical `VehicleSpawner` object. The spawner remained at the original bootstrap position.

Fix (v1.138):
- Added `relocateSlotSpawner(slot, newPos, newRot)` function in `map-runtime.ts` that destroys the old spawner and creates a new one at the updated position.
- `applyVehicleSpawnSpecsToExistingSlots` now detects position changes (>1m via `mod.DistanceBetween`) and calls `relocateSlotSpawner` when the anchor changes.
- New spawner gets `SetVehicleSpawnerAutoSpawn(false)` and `configureVehicleSpawner` with the correct vehicle type.

Status:
- Partially resolved (v1.138). Slot 4 knob-change scenario confirmed working on Firestorm SP. Slot 3 was never broken. Other maps untested.

## CQ_Bug_46
Title: Jet and Transport Spawn Rotations Authored in Radians Instead of Degrees (Firestorm)

Observed (v1.125, Operation Firestorm):
- F-16 jet (team 1, slot 1) spawned facing ~1° instead of ~52° — authored rotY was 0.914 (radians) but the spawner pipeline expects degrees.
- All jet spawns (team 1 and team 2) and all transport spawns (team 1 and team 2) had the same radians-as-degrees authoring error.
- Tank and heli spawns were correctly authored in degrees.

Fix:
- Converted all affected rotY values from radians to degrees: `value * 180 / π`.
- Team 2 jet rotX/rotZ values (3.142 = π radians) also converted to 180.0°.

Status:
- Resolved (v1.127). No other maps affected — Firestorm is the only map with jet/transport spawns.

## CQ_Bug_47
Title: Admin Panel "Ground Deploy All" Spawns Wrong Vehicle Types and Orientations

Observed (v1.134, Operation Firestorm, SP):
- The "Ground Deploy All" admin button forced Abrams tanks into every slot regardless of knob-selected vehicle types.
- Even after fixing vehicle type selection, spawned vehicles did not respect spawn orientations — they faced default direction instead of the tuned rotY values.

Root Cause:
- The original `forceSpawnAllReadyVehicleSlots` implementation called `ForceVehicleSpawnerSpawn` directly without first calling `configureVehicleSpawner` (so the spawner retained its last type — typically Abrams from bootstrap defaults).
- The function also bypassed the entire bind/teleport pipeline: no token tracking, no `OnVehicleSpawned` binding, no `maybeApplySpawnTransformCorrectionToVehicle` teleport correction.

Fix (v1.136-v1.137):
- v1.136: Added `configureVehicleSpawner(slot.spawner, slot.vehicleType)` before spawning so the correct vehicle type is used.
- v1.137: Replaced the entire function body with a call to `runSequentialSpawns(indices, token)` — the same sequential spawn pipeline used by normal player deploy. This ensures each vehicle is token-tracked, bound, and teleported to its correct orientation.

Status:
- Resolved (v1.137).

## CQ_Bug_48
Title: Admin Panel Feature Flag Interactions — Duplicate Functions and Missing References

Observed (v1.134, build errors):
- Restoring `FEATURE_ADMIN_PANEL = true` caused 14 duplicate function errors in the bundle.
- Root cause: `admin-panel/build.ts` contained stale copies of position debug functions (12-widget rotZ-based signatures) that conflicted with the canonical versions in `hud/position-debug.ts` (11-widget isVehicle-based signatures). The old copies predated the position debug extraction.
- Separately, `admin-panel/events.ts` called `setPerfDiagEnabled()` unconditionally, but that function lives in `hud/perf-diag.ts` which is excluded when `FEATURE_PERF_DIAG = false`, causing a "Cannot find name" build error.

Fix (v1.135):
- Removed the stale position debug function copies from `admin-panel/build.ts`.
- Added `if (FEATURE_PERF_DIAG)` guard around the `setPerfDiagEnabled` call in `admin-panel/events.ts`.

Status:
- Resolved (v1.135).

## CQ_Bug_49
Title: Fresh Aircraft Direct Spawn Binds Engine-Default Abrams To Heli/Jet Slot ("Tank In The Air")

Observed (v1.143, Operation Firestorm, SP, live match):
- Deployed into team 1 Heli/Transport 3 slot configured for Black Hawk. Player was force-seated into an M1 Abrams at the heli birth-spawn altitude (mid-air tank).
- Rare in v1.143 — one occurrence out of many deploys.
- Re-observed consistently in v1.144 (both deploys returned a tank) for the Apache slot and the Little Bird slot on team 1 Heli slot 1.
- Only affected the fresh-aircraft air direct-spawn path (`spawnFreshAircraftDirectSpawnVehicleForSlot`). Persistent ground spawners were never affected because they are pre-configured at bootstrap and the startup sweep in `spawner-bootstrap.ts` deletes any default Abrams that leaked during boot.

Root Cause:
- `mod.RuntimeSpawn_Common.VehicleSpawner` is a DICE-authored prefab with baked-in defaults: `AutoSpawn=true` and `VehicleType=Abrams`. The comments at `vehicles/spawner-slots.ts:37` and `vehicles/spawner-bootstrap.ts:51` already confirm this race exists for the bootstrap path.
- `spawnFreshAircraftDirectSpawnVehicleForSlot` armed `slot.expectingSpawn = true`, bumped `slot.spawnRequestToken`, and wrote `State.vehicles.activeSpawnSlotIndex` / `activeSpawnToken` before calling `mod.SpawnObject(RuntimeSpawn_Common.VehicleSpawner, ...)`.
- Under rare timing, the engine auto-spawned a default Abrams from the fresh runtime spawner before `SetVehicleSpawnerAutoSpawn(false)` and `configureVehicleSpawner(...)` took effect.
- `OnVehicleSpawned` fired for the Abrams. `bindSpawnedVehicleToSlot` token-based primary path matched (active token + slot index + `expectingSpawn=true`) and bound the Abrams to the aircraft slot.
- v1.133 had removed `doesVehicleMatchConfiguredSlotType` (the `CompareVehicleName` guard) to fix CQ_Bug_43 Cheetah/Gepard enum swap — so nothing rejected the wrong-type bind.
- `ForceVehicleSpawnerSpawn(runtimeSpawner)` then ran after reconfiguration. The real aircraft spawned but active tracking was already consumed, token no longer matched, and position-based fallback in `spawner-bind.ts` had no type check — the real aircraft became an orphan (and was later abandonment-cleaned).
- `waitForSpawnedVehicleForSlot` returned the bound Abrams. `ForcePlayerToSeat` dropped the player into the Abrams driver seat at the heli birth-spawn altitude → "tank in the air".

Scope:
- Air deploy only. Ground deploy uses the persistent `slot.spawner` which was created and configured at bootstrap, with the bootstrap startup sweep already eliminating any default-Abrams leakage.

v1.144 Attempt (FAILED, reverted in v1.145):
- Reordered `spawnFreshAircraftDirectSpawnVehicleForSlot` to create/configure the runtime spawner FIRST, wait 0.1s, sweep unbound vehicles near the birth position, then arm tracking, then force spawn.
- Hypothesis: give the default Abrams time to spawn so the sweep could reap it before tracking was armed.
- Actual result: the 0.1s wait made the race GUARANTEED. In the original layout, the synchronous `Wait(0) → ForceVehicleSpawnerSpawn → Wait(0.1)` block was pre-empting the engine's default auto-spawn in most cases (the force spawn fired before the auto-spawn could dispatch). By inserting a 0.1s yield before the force spawn, the default Abrams reliably fired first, and the 0.2s bind-retry window inside `onVehicleSpawnedImpl` (line 100) picked up the rejected position after tracking was re-armed — binding a dead Abrams objid to the slot every time.
- v1.145 reverts to the original ordering.

v1.145 Attempt (PARTIAL — helis worked most of the time, jets still failed):
- Added `isTankVehicleInstance(vehicle)` (`vehicles/vehicle-classification.ts`) + `rejectWrongCategoryBindForAircraftSlot(slot, vehicle)` helper in `vehicles/spawner-bind.ts`.
- `bindSpawnedVehicleToSlot` consulted the helper on both the active-tracking path and the position-distance fallback, returning 0 without clearing `slot.expectingSpawn` or active tracking.
- User-observed result after SP repro: Apache and Little Bird deploys worked; jet deploys still produced a mid-air Abrams at the jet birth-spawn position/orientation, every time on the first deploy of the slot.

True Root Cause (identified v1.146 via re-tracing):
- The v1.145 guard WAS working inside `bindSpawnedVehicleToSlot` — the tank's bind attempt correctly returned 0, and the 0.2s retry inside `onVehicleSpawnedImpl` also returned 0. But the code path immediately after the retry, at `index/vehicle-events.ts:108-121`, contains a failed-bind fallback that force-binds the event vehicle to the slot when `inferredTeam === 0`, `slotIndex >= 0`, `slot.enabled`, and `slot.vehicleId === -1`.
- That fallback was written to recover position-based bind matches for vehicles the reject guard was not consulted on, but it trusts the `slotIndex` that was resolved at the top of `onVehicleSpawnedImpl` from active tracking — including the one the reject guard deliberately refused to bind. It calls `bindVehicleToSpawnerSlot(slot, vehicleObjId)` and writes `State.vehicles.vehicleToSlot[vehicleObjId] = slotIndex` without any type check, completely bypassing the reject guard.
- After the fallback force-bound the Abrams, `waitForSpawnedVehicleForSlot` in `spawnFreshAircraftDirectSpawnVehicleForSlot` returned the Abrams by objid, and `tryFulfillPendingVehicleDirectSpawnSeatForPlayer` force-seated the player into it.
- Why helis usually worked and jets usually did not: pure race between the engine default auto-spawn (Abrams) and `ForceVehicleSpawnerSpawn` (real aircraft). For helis the real aircraft frequently won — its `OnVehicleSpawned` fired first, bound via active tracking (guard passes: aircraft type), set `slot.vehicleId`. When the tank's event then arrived, the bind path returned 0 AND the fallback's `slot.vehicleId === -1` check now failed, so the fallback was inert. For jets the higher-altitude volume sampling (`sampleRandomPointInSpawnVolume` with `jetSpawnFloor`/`jetSpawnCeiling`) and/or jet physics init let the tank's event arrive first every time, so the fallback always hit with `slot.vehicleId === -1`.

Fix (v1.146):
- `index/vehicle-events.ts`: Intercept wrong-category events at the top of `onVehicleSpawnedImpl`, immediately after the `slotIndex` is resolved (from active tracking or position) and after the existing `!slot.enabled` and replace-default branches.
  - New check: `if (isAircraftSpawnVolumeVehicleType(slot.vehicleType) && isTankVehicleInstance(eventVehicle)) { mod.UnspawnObject(eventVehicle); return; }`.
  - The immediate `mod.UnspawnObject` prevents the 0.2s retry, the failed-bind fallback, and the deferred sweep from ever seeing the rejected vehicle.
  - Active tracking and `slot.expectingSpawn` are intentionally LEFT armed so the real aircraft from `ForceVehicleSpawnerSpawn` (configured with the correct `VehicleType`) can bind on its subsequent `OnVehicleSpawned`.
- Retained from v1.145:
  - `isTankVehicleInstance` classifier (`vehicles/vehicle-classification.ts`).
  - `rejectWrongCategoryBindForAircraftSlot` guard in `bindSpawnedVehicleToSlot` (now defense-in-depth for the position-distance branch when active tracking is not armed).
  - Tank-instance filter in `tryFindVehicleNearDirectSpawnAirPoint` (prevents the fallback path in the fresh-air spawn from picking up a rejected Abrams if `waitForSpawnedVehicleForSlot` times out).
- Removed in v1.147:
  - Deferred orphan sweep (`scheduleOrphanTankSweepAfterFreshAircraftSpawn`) and its 0.35s delay constant. The v1.146 inline intercept in `onVehicleSpawnedImpl` already reaps rejected wrong-category vehicles synchronously on the spawn event, so running an additional 12m radius sweep 0.35s after every fresh aircraft force-spawn was redundant belt-and-suspenders and could produce CQ_Bug_39 cosmetic UnspawnObject logs when iterating clutter that cannot be unspawned from script.
- The v1.145 code in `bindSpawnedVehicleToSlot` was NOT the live bug — the bug was in `onVehicleSpawnedImpl`'s failed-bind fallback path. The guards in both places remain as layered defense.

Status:
- Behavioral fix confirmed (v1.146 SP, 2026-04-10). User tested multiple heli and jet deploys from the undeployed screen without observing any tank-in-the-air regression; ground deploys also verified correct. v1.147 cleanup removes the now-redundant deferred orphan sweep.

Related:
- CQ_Bug_43 (removal of `doesVehicleMatchConfiguredSlotType` exposed this race; the v1.145/v1.146 guards use positive tank-instance identification instead, avoiding the CompareVehicleName-on-Cheetah failure mode)
- CQ_Bug_45 (same "relocate + race" family for transport slots 3/4 ground anchor swap — already addressed via `relocateSlotSpawner`)

Side-Effect Investigation (re-scoped v1.147):
- The original v1.145 hypothesis (that `GetSoldierState` errors were downstream of the mid-air Abrams force-seat) was wrong. Two such errors persisted during v1.146 SP testing even though v1.146 prevents the player from ever reaching the Abrams. The actual source is unrelated to CQ_Bug_49 and is now tracked as CQ_Bug_50.

## CQ_Bug_50
Title: Pre-Deploy GetSoldierState Cosmetic Error From Reveal-Path Position Debug Sync Sample

Observed (v1.146 / v1.147 SP, 2026-04-10):
- Engine reports `ERROR REPORTED BY GETSOLDIERSTATE WHILE RUNNING JS SCRIPT / Failed to apply action to player due to player not being deployed`.
- User-reported key clue: "the getsoldier state errors are triggered before even spawning in the first time upon load". Reproducible on every first-join, which rules out death/respawn races and rules out CQ_Bug_49's mid-air Abrams path entirely.

Investigation History (prior hypothesis discarded):
- Initial triage (v1.147) pointed at death → respawn races against the stale `deployedByPid` cache, noting the missing `OnPlayerDied` handler. That hypothesis was wrong: the error fires before the player has ever deployed, so no death transition can be involved.
- The stale-cache concern is real in theory but is not the observed error source. Leaving it as background context for any future audit of `isPlayerDeployed()` semantics.

Actual Root Cause:
- `interaction/actions.ts:544 releaseLoadingGate` runs on first-join once the unified loading gate warms, while the player is still on the deploy screen (undeployed).
- `releaseLoadingGate` calls `revealAllUiFamilies(eventPlayer, pid)` at line 560.
- `revealAllUiFamilies` calls `renderAdminUiFamilyForReveal(eventPlayer, pid)` at line 538.
- `renderAdminUiFamilyForReveal` (line 366) calls `autoStartPositionDebugOnDeploy(eventPlayer)` at line 375 when `FEATURE_POSITION_DEBUG === true` (currently always on).
- `autoStartPositionDebugOnDeploy` (`hud/position-debug.ts:337`) calls `setPositionDebugVisibleForPlayer(player, true)`.
- `setPositionDebugVisibleForPlayer` runs a synchronous initial sample at line 325: `trySamplePositionDebugSnapshot(player, pid)`.
- `trySamplePositionDebugSnapshot` defaults `transformSource` to `"soldier"` at line 185 (since the player has never been in a vehicle yet) and calls `sampleSoldierVector(mod.SoldierStateVector.GetPosition)` at line 212.
- The `sampleSoldierVector` helper (pre-fix: `position-debug.ts:177-183`) called `mod.GetSoldierState(player, stateKey)` DIRECTLY inside a local try/catch, bypassing the `safeGetSoldierStateVector` wrapper and therefore bypassing the `isPlayerDeployed` pre-check. The engine logs the error before throwing; the local catch silently swallows the thrown exception but the log is already out.

Why the position-debug loop itself is not the culprit:
- `positionDebugLoop` at line 258 pre-checks `isPlayerDeployed(player)` and exits. So the error is one-shot per reveal, not a 0.5s-cadence repeater.
- The one reproducer is the unguarded sync sample at line 325, which runs once on the first-join reveal and once on any subsequent reveal path that bypasses the deploy gate (the admin panel position-debug toggle pressed from the ready dialog, etc.).

Expected:
- Engine error log should stay clean during the first-join warm → reveal → deploy flow.

Fix Applied (v1.148):
1. `hud/position-debug.ts autoStartPositionDebugOnDeploy` — added early return `if (!isPlayerDeployed(player)) return;` so the function matches its name. Pre-deploy reveal-path callers become no-ops; the real `OnPlayerDeployed` handler (`player-deploy.ts:80 renderCriticalHudForReveal` → `renderAdminUiFamilyForReveal` → `autoStartPositionDebugOnDeploy`) still fires autostart once `deployedByPid[pid] = true` is set at `player-deploy.ts:61`, earlier in the same handler.
2. `hud/position-debug.ts trySamplePositionDebugSnapshot` — replaced the direct `mod.GetSoldierState` call inside `sampleSoldierVector` with `safeGetSoldierStateVector(player, stateKey)`. The wrapper pre-checks `isPlayerDeployed` and self-corrects `deployedByPid` on any residual engine failure, so any future caller that lands in this sampler pre-deploy or during a death race is also protected.

Status:
- Fixed (v1.148). Expected error log delta: two GetSoldierState entries per fresh first-join should drop to zero. Admin-panel position-debug toggle pressed pre-deploy no longer logs either. No functional regression: on deploy the player's `onPlayerDeployedImpl` path still starts position debug as before; the admin toggle's pre-deploy behavior becomes "state flag set, widgets visibly start on next deploy" which is semantically fine (and already the expectation during ready-up).

Related:
- CQ_Bug_37 / CQ_Bug_38 / CQ_Bug_39 (same family: engine-logs-before-JS-catch cosmetic noise from stale script-side state or unguarded engine calls)
- Stale `deployedByPid` during death window remains a theoretical concern; if it ever does reproduce in practice, the v1.148 `safeGetSoldierStateVector` routing in `trySamplePositionDebugSnapshot` already makes the position-debug loop self-correcting on the first tick after death, leaving only the polling loops in `capture-tickets.ts` / `boundary/enforcement.ts` as potential sources — those already route through `safeGetSoldierStateBool` with its own self-correction.

## CQ_Bug_51
Title: Admin Position-Debug Toggle Un-Sticks After Respawn / Reveal

Observed (v1.148 SP, 2026-04-10):
- Admin presses the position-debug toggle from the ready-dialog admin panel. Widgets hide correctly at the moment of the press.
- Shortly after (on next respawn, or any ready-dialog close-while-deployed, or team-swap re-warm) the widgets come back on their own, overriding the admin's choice.

Root Cause:
- `interact-point.ts:158 initReadyDialogData` seeds `posDebugVisible: false`.
- `hud/position-debug.ts autoStartPositionDebugOnDeploy` unconditionally did `state.posDebugVisible = true` and called `setPositionDebugVisibleForPlayer(player, true)`. This was intentional as the "on by default" behavior for first-join.
- However, `autoStartPositionDebugOnDeploy` is invoked from EVERY path that enters `renderAdminUiFamilyForReveal`, not just first-join. The other reveal paths in a session:
  - `index/player-deploy.ts:80 onPlayerDeployedImpl` → every respawn after death fires autoStart again.
  - `interaction/actions.ts:544 releaseLoadingGate` → team-swap re-warm triggers a fresh gate release and therefore another reveal.
  - `ready-dialog/lifecycle.ts:96 closeReadyDialogUI` → closing the ready dialog while deployed re-enters `renderCriticalHudForReveal`.
- Each of those subsequent autoStart calls overwrote the admin's `posDebugVisible=false` back to `true` and restarted the position-debug loop. From the admin's point of view the toggle "stopped working after a few seconds".

Fix Applied (v1.149):
- Added `posDebugAdminOverride: boolean` to the ready-dialog state shape (`interaction/types.ts`) and initialized it to `false` in `initReadyDialogData` (`interact-point.ts`).
- `admin-panel/events.ts` position-debug handler now sets `posDebugAdminOverride = true` alongside the `posDebugVisible` flip, so pressing the toggle at any time (before or after first deploy) locks in the admin's choice for the rest of the session.
- `hud/position-debug.ts autoStartPositionDebugOnDeploy` now only force-enables `posDebugVisible` when `posDebugAdminOverride` is still false. It always calls `setPositionDebugVisibleForPlayer(player, state.posDebugVisible)` so the loop reattaches correctly on respawn regardless of the current visibility state — this handles the "admin has it ON, player just respawned" case where the old loop exited at the `isPlayerDeployed` check inside `positionDebugLoop` and needs to restart with a fresh token.

Behavior Matrix After Fix:
- First deploy of a fresh session, admin has not touched the button → autoStart enables (posDebugVisible=true), loop starts. Unchanged from prior behavior.
- Admin presses toggle OFF at any time → posDebugVisible=false, posDebugAdminOverride=true, widgets hide, loop exits on next tick via token bump. Subsequent deploys leave posDebugVisible=false because autoStart respects the override flag.
- Admin presses toggle ON after having pressed it off → posDebugVisible=true, override stays true, setPositionDebugVisibleForPlayer restarts the loop. Subsequent deploys keep it on because the override flag stays true and autoStart re-attaches the loop to `posDebugVisible=true`.
- Player leaves and rejoins the server → `readyDialogData` is deleted in `player-join-leave.ts:215` and re-created on rejoin with `posDebugAdminOverride=false`, so behavior resets to "on by default". This matches the intent and also isolates per-player state from other admins.

Non-Regression Reasoning:
- First-join behavior is unchanged because `posDebugAdminOverride` defaults to false and the first autoStart still sets `posDebugVisible=true`.
- The respawn loop-reattach path still works because `setPositionDebugVisibleForPlayer` is always called with the current `posDebugVisible`, and the token bump inside that function exits any stale loop cleanly before starting a new one.
- No other caller of `setPositionDebugVisibleForPlayer` needs to be aware of the override flag — the admin button is the only path that flips `posDebugAdminOverride` to true.

Status:
- Fixed (v1.149). Bundle delta: +189 bytes (one new boolean field on the per-player state plus a small amount of guard logic).

Related:
- CQ_Bug_50 (same subsystem: both were ways `autoStartPositionDebugOnDeploy` misbehaved; CQ_Bug_50 fixed the pre-deploy sync-sample engine error, CQ_Bug_51 fixes the admin-toggle reassertion).

## CQ_Bug_52
Title: Silent Air Deploy Failure — `expectingSpawn` Latched After 2s Bind-Tracker Timeout

Observed (v1.149 live MP, 2026-04-10):
- Pressing an Air Deploy button on specific slots (UH60 slot 3 on both teams and Apache slot 2) occasionally produced no vehicle spawn and no deploy. Completely silent from the player's perspective — the button still appeared available but the click did nothing.
- No lag spikes witnessed. Failure was sporadic and not correlated with player count or match phase.
- Game-breaking in a competitive environment: a failed air deploy distorts the remainder of the round's balance because one team loses a planned rotation.

Root Cause:
- `tryClaimVehicleDirectSpawnForPlayer` (`src/vehicles/reservations.ts`) gates on `slot.expectingSpawn || slot.respawnRunning || slot.spawnRetryScheduled`. If any of those three flags is latched `true` while the HUD still paints the button as ready (`isVehicleDeploySlotReadyForSpawnButton` reads the same flags), the click is silently rejected.
- `bindSpawnedVehicleToSlot` (`src/vehicles/spawner-bind.ts:200-242`) used the 2s `VEHICLE_SPAWNER_BIND_TIMEOUT_SECONDS` window to correlate an inbound `OnVehicleSpawned` event with the most recent forced spawn. When the window expired, the `else` branch only released the global tracker (`activeSpawnSlotIndex`/`activeSpawnToken`/`activeSpawnRequestedAtSeconds`) and did **not** clear `slot.expectingSpawn` on the tracked slot.
- The fresh-aircraft air direct-spawn path (`spawnFreshAircraftDirectSpawnVehicleForSlot` in `src/vehicles/deploy-fulfillment.ts`) uses a `RuntimeSpawn_Common.VehicleSpawner` prefab at the team birth-spawn volume, which is typically meters away from `slot.spawner`. When the real aircraft spawn landed **after** the 2s window, it failed the 7m distance fallback in `bindSpawnedVehicleToSlot` too, so nothing ever cleared `expectingSpawn` on that slot — latched until round reset. Every subsequent click on that slot's Air Deploy button silently rejected.
- Secondary HUD-vs-truth window: `bindVehicleToSpawnerSlot` (`src/vehicles/timers.ts`) wrote `vehicleId` but did not force a `updateVehicleDeployTimerHudForAllPlayers()` call. Between the bind and the next periodic HUD refresh, the HUD continued to paint the slot as "ready" while the claim path would reject because `vehicleId !== -1`.

Fix Applied (v1.150):
1. **Close the primary leak:** `bindSpawnedVehicleToSlot` expired `else` branch now also clears `slot.expectingSpawn` on the tracked slot, calls `refreshVehicleSlotAuthoritativeState`, and `updateVehicleDeployTimerHudForAllPlayers` (`src/vehicles/spawner-bind.ts:227-241`).
2. **Watchdog reap:** `pollVehicleSpawnerSlots` now sweeps any slot whose `expectingSpawn` has been true longer than `VEHICLE_SPAWNER_STUCK_EXPECTING_SPAWN_THRESHOLD_SECONDS = 10.0` and is not currently the active global-tracker target. Clears the flag, refreshes authoritative state, refreshes the HUD. This catches any future leak in any writer. Added `expectingSpawnStartedAtSeconds: number` to `VehicleSpawnerSlot` and stamped it at the three writers (`forceSpawnWithRetry`, `spawnFreshAircraftDirectSpawnVehicleForSlot`, and reset to `-1` inside `bindVehicleToSpawnerSlot`).
3. **HUD refresh on bind:** `bindVehicleToSpawnerSlot` now calls `updateVehicleDeployTimerHudForAllPlayers()` at the end so the HUD can never paint "ready" for a slot that has just bound a live vehicle.
4. **Temporary validation counter:** added `State.vehicles.gateDesyncCount` (initialized 0) and a `"CQ52: <n>"` text widget on the admin panel below the Ground Deploy All button. `tryClaimVehicleDirectSpawnForPlayer` bumps the counter only when the combined gate rejects a click (the specific anomaly we are hunting) — not for wrong team, already deployed, wrong category, etc. The widget is refreshed only when the number changes via `syncCq52GateDesyncCounterForAllPlayers()`, so per-frame cost is zero. **This is diagnostic telemetry to validate the fix over a few live rounds; remove it once the counter stays at 0 across several rounds.**

Behavior Matrix After Fix:
- Air deploy click where the bind arrives inside the 2s window → same as before; slot binds successfully on the active-tracker path.
- Air deploy click where the bind arrives **after** the 2s window via the fresh-air path → the 2s-expired else branch clears `expectingSpawn`, then the later `OnVehicleSpawned` event falls through to the distance fallback or the ObjectDestroyed path without leaving the slot latched. The next click on the same slot is eligible again.
- Bind lands on the wrong slot entirely → the tracked slot's `expectingSpawn` is still eventually reaped by the watchdog after 10s if nothing else clears it.
- A slot binds a vehicle → HUD refreshes synchronously, eliminating the stale "ready" window entirely.

Non-Regression Reasoning:
- Step 1 only runs in the expired branch that was already clearing global tracker fields; we're adding three more field writes to the same branch. No new control flow.
- Step 2 runs inside the existing `pollVehicleSpawnerSlots` loop with a generous 10s threshold — far beyond the 2s tracker window — so it cannot reap a slot while a legitimate spawn is in flight.
- Step 3 only adds one HUD refresh call inside an already-expensive state mutation function; the HUD refresh path is throttled per-player on its own.
- Step 4 never fires in normal operation; the counter bump is guarded by the exact same condition the bug creates, so its presence is load-bearing only when the bug (or a residual variant) actually reproduces.

Status:
- Fixed (v1.150). Live MP bake in progress to validate the counter stays at 0 across several rounds.

Related:
- CQ_Bug_49 (same binding surface: CQ_Bug_49 rejected wrong-category binds so the real aircraft spawn could later correlate; CQ_Bug_52 closes the case where the real aircraft spawn arrived too late for that correlation).
- When the live bake confirms 0 desync bumps, the next version can rip out the `gateDesyncCount` state field, the `UI_ADMIN_CQ52_COUNTER_ID` widget, `syncCq52GateDesyncCounterForAllPlayers`, the `cq52CounterFormat` string, and restore `ADMIN_PANEL_HEIGHT` to 390.

## CQ_Bug_53
Title: Air Deploy Silent Failure When Player Has A Captured Flag Or Squad-Mate Selected

Observed (v1.150 SP, 2026-04-10):
- As Team 2 after capturing flag A, clicking an Air Deploy button with "HQ" selected in the deploy screen produced no aircraft and left the player stuck — or sometimes placed them in a tank that should not have existed.
- Reported as reproducing consistently whenever the engine had a non-HQ spawn option available (captured flag, squad-mate). Pure HQ-only situations kept working.
- User-framed design principle: _"if a Player selects Air Deploy from the deploy screen, their chosen flag or HQ should not meaningfully matter to the player."_

Original Hypothesized Root Cause:
- `tryBeginVehicleDirectSpawnDeployFromSpawnPoint` calls `mod.SpawnPlayerFromSpawnPoint(player, hqSpawnPoint)` expecting to force the player onto Team HQ regardless of their deploy-screen selection. Hypothesis was that `SpawnPlayerFromSpawnPoint` is not an unconditional override and the engine silently honors the deploy-screen selection (flag, squad-mate) instead, leaving the player 300-500m from the aircraft and failing the `ForcePlayerToSeat` handoff.

### Status (2026-04-11): Provisionally resolved, cause unverified.

After a day-long investigation and a failed in-place fix (see the 2026-04-11 fix-attempt record below), `deploy-fulfillment.ts` was reverted byte-for-byte to its `b228efc` shape on v1.155. Against that baseline, the user can no longer reproduce the original symptom — Team 2 owning flag A or C no longer interrupts air deploy in SP testing.

Since no runtime code changed between `b228efc` and v1.155, the improvement must come from outside today's work. Most likely explanations, in order:

1. **The original symptom was mostly the CQ_Bug_49 tank race, not an `SpawnPlayerFromSpawnPoint` override issue.** The original report already noted a secondary "placed in a tank" symptom, which is the CQ_Bug_49/54 race. That race is defended in the current codebase at four layers, all added in v1.144-v1.147: inline intercept in `onVehicleSpawnedImpl` at [src/index/vehicle-events.ts:103](../src/index/vehicle-events.ts), active-token reject in `bindSpawnedVehicleToSlot` at [src/vehicles/spawner-bind.ts:215](../src/vehicles/spawner-bind.ts), distance-fallback reject in the same file around line 252, and the tank-exclusion filter in `tryFindVehicleNearDirectSpawnAirPoint` at [src/vehicles/deploy-fulfillment.ts:296](../src/vehicles/deploy-fulfillment.ts). If the original failures were timing-dependent tank-race manifestations, these guards explain the current apparent resolution.
2. **`SpawnPlayerFromSpawnPoint` may honor the HQ override more reliably than the original report assumed.** The hypothesized root cause was based on a day of debugging under time pressure and was never verified against instrumented telemetry.
3. **External state changed** (BF6 engine patch, portal runtime update) between 2026-04-10 and today.
4. **The original "reproduces consistently" label was incomplete.** The bug may have always been intermittent and today's testing happened not to hit it.

Do not treat CQ_Bug_53 as closed until MP bake testing has confirmed no regression over multiple rounds and the squad-mate-explicitly-highlighted scenario has been tested deliberately. If the failure does recur, the first diagnostic step is to determine whether the symptom is "no aircraft at all" or "landed in a tank" — the former would point back at the original hypothesis, the latter would point at CQ_Bug_54 and the four existing guards.

### Fix Attempt Record (2026-04-11)

A day-long attempt to fix CQ_Bug_53 in-place introduced a regression worse than the original bug and was fully reverted in v1.155. Retained here so future investigation does not re-walk the same path:

- Attempted fix added a pre-seat player teleport (`mod.Teleport(player, vehiclePos + 10m, 0)` immediately before `mod.ForcePlayerToSeat`) inside `tryFulfillPendingVehicleDirectSpawnSeatForPlayer`'s fresh-aircraft branch. Intent was to bridge the 300-500m gap from a flag-A / squad-mate deploy to the aircraft so the seat handoff would succeed regardless of where the engine placed the player.
- The teleport was the only net source-code change from `b228efc` through v1.154 (verified via `git diff b228efc`). A layered narrative of "Phase B removed the HQ spawn-point pre-step" turned out to be fictional — the HQ pre-step was never actually removed in any state, committed or working-directory, that could be diffed against `b228efc`.
- Pre-seat player teleport is a known-broken pattern in this codebase. Memory note `project_teleport_vehicle_spawn_mystery.md` records that the same pattern in v1.106-v1.108 caused vehicles to spawn at map center and choppers to spawn underground, and was "stripped entirely in v1.109." Re-introducing it against the fresh-aircraft runtime-spawner path (which didn't exist in the v1.106 era) produced an engine-native AirCombatVolume OOB latch with a 10-second timer that killed player + vehicle, plus a secondary sound-system break that required a full game restart. Reproduction rate was roughly 100% on v1.152 and did not improve with a 150ms settle inserted in v1.153.
- v1.155 deleted the teleport block and restored `deploy-fulfillment.ts` to `b228efc` byte-for-byte. SP tested clean.

Rules for any future fix attempt at CQ_Bug_53:
1. Do not use `mod.Teleport(player, ...)` before `mod.ForcePlayerToSeat` on the fresh-aircraft path. This codebase has now burned on that pattern twice.
2. Test in isolation on a single aircraft type before touching the fulfillment hot path.
3. Commit each incremental change so subsequent investigation can diff against a real git history instead of reconstructing uncommitted working-directory state from memory.
4. Before designing a new fix, reproduce the original failure deliberately on a current build so the starting assumption is verified, not inherited.

Related:
- CQ_Bug_49 (tank-rejection guards; four layers currently active and the most likely explanation for the current apparent resolution).
- CQ_Bug_54 (fresh-aircraft runtime-spawner prefab-default Abrams race; unaffected by today's work and remains open).

## CQ_Bug_54
Title: Fresh-Aircraft Runtime Spawner Race — Prefab Default Abrams Fires Before Override, Real Aircraft Never Arrives

Observed (v1.151 SP, 2026-04-10):
- Intermittent Air Deploy failures where a tank briefly appears at the aircraft spawn volume, the CQ_Bug_49 guard unspawns it, and the real aircraft from `ForceVehicleSpawnerSpawn` never arrives. Fulfillment then fails the seat check and triggers a graceful undeploy.
- Not every click. Timing-dependent. Phase A testing showed the failure rate is independent of the player's origin spawn (the bug reproduces from HQ as well as from a captured flag), which rules out CQ_Bug_53's spawn-point dependency as the cause.

Current Hypothesis:
- `spawnFreshAircraftDirectSpawnVehicleForSlot` instantiates a `RuntimeSpawn_Common.VehicleSpawner` prefab at a birth-spawn volume point. The prefab ships with AutoSpawn baked in and its default `VehicleType` is the engine-default Abrams. The sequence is: spawn prefab → `SetVehicleSpawnerAutoSpawn(false)` → `configureVehicleSpawner(spawner, slot.vehicleType)` → `await Wait(0)` → `ForceVehicleSpawnerSpawn(spawner, ...)`.
- When the prefab's AutoSpawn fires **before** the JS engine processes `SetVehicleSpawnerAutoSpawn(false)`, the tank lands in the air-spawn volume. `onVehicleSpawnedImpl` recognizes the category mismatch (slot is aircraft, instance is tank) via the CQ_Bug_49 guard at `src/index/vehicle-events.ts:103-106` and `mod.UnspawnObject`s the tank **without** clearing `slot.expectingSpawn`, by design, so the real aircraft from `ForceVehicleSpawnerSpawn` can bind on its subsequent `OnVehicleSpawned`.
- In the failure mode the real aircraft does not subsequently spawn. Possible reasons:
  1. The engine treats a runtime VehicleSpawner that has already spawned once (even if the spawn was unspawned) differently from a fresh one, and `ForceVehicleSpawnerSpawn` is a no-op in that state.
  2. The `configureVehicleSpawner` override arrived after `ForceVehicleSpawnerSpawn` was already dispatched on the still-default prefab.
  3. A hidden engine cooldown on `ForceVehicleSpawnerSpawn` after a `SetVehicleSpawnerAutoSpawn(false)` toggle.

Candidate Fixes (ranked by the user's priorities and blocked on the primitive verification below):
1. **Despawn-and-retry kludge** — after the guard unspawns the tank, reschedule `configureVehicleSpawner` + `ForceVehicleSpawnerSpawn` with a small delay. User explicitly rejected: _"cludge if we get stuck, not now while we're still diagnosing root cause."_ Fallback only.
2. **Dummy spawn + teleport the spawner** — instantiate the `RuntimeSpawn_Common.VehicleSpawner` prefab once at a throwaway location, let its AutoSpawn race expire, configure + suppress it, then `mod.Teleport` the spawner itself to the birth-spawn volume point per deploy and `ForceVehicleSpawnerSpawn`. Isolates the race to one-off init; per-deploy path is clean.
3. **Pre-spawned pool** — at match start (or lazily on the first air deploy per team), pre-spawn one runtime VehicleSpawner per air slot, let its AutoSpawn race + configure + suppress happen once, and `mod.Teleport` it to a freshly-sampled birth-spawn volume point per deploy before `ForceVehicleSpawnerSpawn`. Preserves the existing randomization within the air spawn box. User's preferred option: _"this feels like a more authentic approach for a fix ... as long as this enables us to continue randomizing within the air spawn box boundaries."_

All three options (even option 1 on retry) are blocked on a primitive verification question: **does `mod.Teleport` operate on `mod.VehicleSpawner` instances**, or only on `mod.Vehicle`/`mod.Player`/`mod.Object`? If `mod.Teleport` is Vehicle-only, options 2 and 3 are non-starters and the fix has to either (a) reuse the prefab at its original world location and randomize the vehicle spawn direction via `configureVehicleSpawner`-level knobs, or (b) accept option 1 as a kludge.

Secondary Open Questions:
- Is `configureVehicleSpawner`'s VehicleType override racing against `ForceVehicleSpawnerSpawn`, or is the race only between the prefab's baked AutoSpawn and `SetVehicleSpawnerAutoSpawn(false)`? Adding a diagnostic counter for "real aircraft spawn never arrived" vs "real aircraft spawn was wrong type" would separate these.
- Does `UnspawnObject` on the tank implicitly reset the spawner to an "unused" state that re-arms `ForceVehicleSpawnerSpawn`? If so, option 1 becomes a one-retry fix rather than a kludge.

Status:
- Open. Remains an independent race condition in the fresh-aircraft runtime-spawner path. Priority is driven by whether MP bake testing surfaces "landed in a tank" or "no aircraft" symptoms — either would point here. The CQ_Bug_49 guards (inline intercept in `onVehicleSpawnedImpl`, reject-wrong-category in `bindSpawnedVehicleToSlot`, tank-exclusion in `tryFindVehicleNearDirectSpawnAirPoint`) catch the immediate tank-in-air symptom, but do not fix the underlying question of why the real aircraft sometimes fails to arrive after the reject.
- v1.230 (Phase A of `air_forward_relocate_reuse_plan.md`): `relocateSlotSpawner` ([src/config/map-runtime.ts:561](../src/config/map-runtime.ts)) now uses `mod.SetObjectTransform` on the persistent `slot.spawner` instead of `UnspawnObject` + `SpawnObject(RuntimeSpawn_Common.VehicleSpawner)`. This closes one Abrams-AutoSpawn race surface (every ready-dialog vehicle-type change) and is the architecture-validation gate for Phases B–E, which will eliminate the per-click fresh runtime spawner used by Air/Forward today. Air/Forward fulfillment paths still use the racy fresh runtime spawner — CQ_Bug_54 stays Open until Phase C lands.

Related:
- CQ_Bug_49 (the tank rejection guard is the immediate symptom's handler; CQ_Bug_54 is the question of why the follow-up real aircraft spawn fails to arrive).
- CQ_Bug_52 (not the same issue, but shares the fresh-aircraft runtime-spawner subsystem — the CQ52 counter will stay live across CQ_Bug_54 investigation to confirm no regression).
- `air_forward_relocate_reuse_plan.md` (Phases A–E rearchitecture; Phase A landed in v1.230).

## CQ_Bug_55
Title: Air Deploy Does Not Suppress Main-Base HQ World Icons

Observed (SP, prior to v1.158):
- Player selects an air vehicle slot on the deploy screen and clicks Deploy. The fresh-aircraft runtime-spawner path birth-spawns the aircraft kilometers away from HQ and seats the player into it via `ForcePlayerToSeat`. The player is now flying over or near a captured flag, not at main base.
- The HQ World Icons (Ready terminal, Vehicle Spawn terminal) remain visible to that player for the remainder of the flight. They only disappear when the player physically lands and walks inside the main-base area trigger — at which point the enter-then-exit cycle finally clears `inMainBaseByPid[pid]`.
- Root cause: `onPlayerDeployedImpl` unconditionally set `State.players.inMainBaseByPid[pid] = true` on every deploy before the direct-spawn fulfillment had a chance to run. The subsequent `syncWorldInteractableRuntimeIconsForPlayer` call at the end of the handler then spawned the HQ icons for the air-deployed player because the gate in `shouldShowWorldInteractableRuntimeIconForPlayer` checks `inMainBaseByPid[pid] === true` plus an own-team filter, and the flag was true.

Expected:
- Air-deploy should leave the player with zero HQ World Icons visible (since they are not physically at their main base).
- Ground deploy at HQ should still show the icons (unchanged behavior).
- When the air-deployed player later lands and walks into the main-base area trigger, `onMainBaseEnter` should set `inMainBaseByPid[pid] = true` and re-sync, restoring the icons. When they leave again, `onMainBaseExit` should clear them.

Resolution (v1.158):
- `src/index/player-deploy.ts` `onPlayerDeployedImpl`: snapshot `pendingDirectSpawnMode` from `getPendingVehicleDirectSpawnModeForPlayer(eventPlayer)` before calling `conquestPhase5DTryFulfillVehicleSpawnButtonOnDeploy` (the fulfillment path clears the slot's `pendingSpawnMode` as a side effect, so the snapshot has to be taken first). After fulfillment returns, if `directSpawnDeployResult.consumedDeploy && pendingDirectSpawnMode === "air"`, set `State.players.inMainBaseByPid[pid] = false`. The existing `syncWorldInteractableRuntimeIconsForPlayer` call at the end of the handler then observes the cleared flag and hides the HQ icons.
- Four new lines in one function, no new helpers, no new state fields, no changes to the sync path or the fulfillment path. `getPendingVehicleDirectSpawnModeForPlayer` already existed at `src/vehicles/deploy-fulfillment.ts:124` and is the authoritative source for whether the slot's `pendingSpawnMode` is `"air"` or `"ground"` at deploy time.
- Main-base re-entry continues to work via `onMainBaseEnter` at `src/index/area-triggers.ts:80`, which sets `inMainBaseByPid[pid] = true` and calls sync — unchanged.

Verification (SP on Operation Firestorm):
1. Ground deploy at HQ: HQ icons visible, walk out they disappear, walk back in they reappear. Expected: unchanged from v1.155.
2. Air deploy at HQ: player spawns in aircraft away from HQ, zero HQ icons visible. Fly to main base and land inside the area trigger: HQ icons appear. Leave: disappear.
3. Air deploy then undeploy then ground deploy: HQ icons should appear on the ground-deploy step since the consumed-deploy check is false for ground.
4. Gadget locker point icon: walking into a gadget locker area trigger spawns the ammo icon. Air deploy does not affect point icons (they are gated by area trigger membership, not the main-base flag).

Related:
- CQ_Bug_25 (per-player World Icon visibility). The v1.158 build also adds a `FEATURE_WORLD_ICON_DIAG` dev-only telemetry flag to `src/interaction/world-interactables.ts` that emits a `DisplayHighlightedWorldLogMessage` on every WorldIcon spawn/destroy with an encoded `pid*10000000 + objId*1000 + action*100 + total` payload so the next MP playtest can disambiguate whether `SetWorldIconOwner` actually filters per-player visibility in multiplayer. The flag defaults `false` and is stripped from shipping builds by postbuild dead-code elimination.

## CQ_Feat_Forward_Deploy_FreeSpace (v1.203-v1.207)
Title: Forward-Deploy Free-Space Guard + Round-Start Deploy Delay Gates

Context:
- Forward deploy (spawn-near-captured-flag) shipped in v1.203 using tank volume positions. Two gaps remained: (a) nothing prevented stacking vehicles at the same forward-deploy position when multiple players deployed in quick succession; (b) the deploy menu had no way to pace aircraft vs forward vs HQ deploy at round start, so high-mobility options were available instantly on live transition and ground-vehicle rallies felt unbalanced.

Resolution (v1.207):

1. **Free-space guard (`src/vehicles/deploy-fulfillment.ts`)**
   - Added `VEHICLE_DIRECT_SPAWN_FORWARD_BLOCKED_RADIUS_METERS = 10` and `isForwardDeployPositionOccupied(pos)` which iterates `mod.AllVehicles()` and returns `true` if any vehicle is within range of the candidate forward-deploy point.
   - `spawnForwardDeployVehicleForSlot` now short-circuits and returns `undefined` when the position is occupied, which routes through the existing `handlePendingVehicleSpawnSeatFailure` path to undeploy the player cleanly rather than stacking vehicles.

2. **Round-start deploy delay constants (new MapConfig fields)**
   - `src/config/types.ts`: added three optional `MapConfig` fields — `roundStartAirDelay` (blocks all aircraft deployment, including HQ), `roundStartAirDeployDelay` (blocks air-deploy button only; aircraft HQ unlocks after `airDelay`), `roundStartForwardDeployDelay` (blocks forward-deploy button).
   - `src/config/maps/operation-firestorm.ts`: set `airDelay: 10, airDeployDelay: 20, forwardDeployDelay: 20` as the initial tuning pass.
   - `src/state/runtime-state.ts` + `src/state/runtime-types.ts`: added `liveStartedAtSeconds: number | undefined` on `State.round`. (Note: the `runtime-types.ts` type had to be updated alongside `runtime-state.ts` or the `bundle.ts` post-process would emit TS errors, because `bundle.ts` is type-checked even though all `src/*.ts` files use `@ts-nocheck`.)
   - `src/conquest-flow.ts`: `startMatch()` stamps `State.round.liveStartedAtSeconds = Math.floor(mod.GetMatchTimeElapsed())` right after `lifecycleSetLiveBaseline` and kicks `void runRoundStartDelayHudLoop();`. `endMatch` and `triggerFreshMatchSetup` clear the stamp.
   - `src/state/core.ts`: added `getSecondsSinceLive`, `isRoundStartAirDelayActive`, `isRoundStartAirDeployDelayActive`, `isRoundStartForwardDeployDelayActive`, `getRoundStartAirDelayRemainingSeconds` next to `isMatchLive`. Placed here (rather than in `deploy-timer-ui.ts`) so the `reservations.ts` claim gates can read them without a cross-file bundle order concern.
   - `src/vehicles/reservations.ts`: `tryClaimVehicleDirectSpawnForPlayer` now rejects claims when the corresponding delay is active — aircraft under `airDelay` or `airDeployDelay`, ground claims into aircraft slots under `airDelay` (HQ-into-aircraft is still gated by `airDelay`), and forward claims under `forwardDeployDelay`. Uses `isAircraftVehicleType` (earlier in bundle load order) rather than `doesVehicleTypeSupportAirDeploy` to avoid a forward reference.
   - `src/vehicles/deploy-timer-ui.ts`: `renderVehicleDeployTimerRow` toggles `showSpawnButton`/`showGroundButton` against the delay flags and adds a countdown display branch that shows `getRoundStartAirDelayRemainingSeconds()` when the aircraft row is in `airDelayActive` with no vehicle present.

3. **Countdown freeze bug (fixed in same cutline)**
   - Observed: with delays configured, the aircraft-row countdown numbers froze on the first sample and never ticked down, even though the HUD loop was calling `updateVehicleDeployTimerHudForViewers()` every second.
   - Root cause: the deploy-timer render had a signature-based short-circuit cache (`deploy-timer-ui.ts` around line 156 / 1902) that hashed "vehicle state + slot state + lifecycle phase" but did NOT include any of the round-start delay timers. Every repaint landed on the same signature as the first paint, so the render was skipped before it reached the timer branch.
   - Fix: extended the signature string to include `getRoundStartAirDelayRemainingSeconds()`, `isRoundStartAirDeployDelayActive() ? 1 : 0`, and `isRoundStartForwardDeployDelayActive() ? 1 : 0`. The countdown now ticks at the same cadence as a respawn timer.
   - Feedback preserved: first attempt (adding a HUD loop call) looked plausible but did not address the real gate — user correctly pushed back with "do real investigations, don't just jump at the first thing you think is wrong." The signature-cache angle was only found on the second pass by tracing the render short-circuit.

Status:
- Resolved v1.207. Bundle 994,811 / 1,048,576 bytes (53,765 headroom, 5.13%).
- Verification: with all delays at 0, behavior matches v1.203. With firestorm's `airDelay=10, airDeployDelay=20, forwardDeployDelay=20`: aircraft rows show countdown at live, aircraft HQ unlocks at +10s, forward unlocks at +20s, air deploy unlocks at +20s. Forward-deploy into a position already occupied by a vehicle undeploys the player cleanly instead of stacking.

Related:
- CQ_Bug_52, CQ_Bug_54 (fresh-aircraft runtime-spawner subsystem is untouched by this change).

## CQ_Feat_Pregame_Countdown_Delay_Lines (v1.208-v1.209)
Title: Staggered Pregame Countdown Delay-Info Lines + Cache Preservation Fix

Context:
- v1.207 shipped three `roundStart*Delay` MapConfig fields that gate deploy availability after LIVE. A single static delay-info line was shown above the pregame countdown digits but had two problems: (a) it rendered on top of or adjacent to the countdown digit at its original Y, crowding the visual center; (b) all lines appeared simultaneously, giving players no time to read them before the countdown moved.
- A third bug surfaced after the stagger work landed in v1.208: the delay-info lines never hid when the LIVE! text hid, so they lingered into the match.

Resolution (v1.209):

1. **Staggered reveal (`src/ready-dialog/pregame-ui.ts` + `src/ready-dialog/countdown-flow.ts`)**
   - `PREGAME_COUNTDOWN_DELAY_LINE_KEYS` and `PREGAME_COUNTDOWN_DELAY_LINE_Y` extended to 3 entries; Y values `[-420, -380, -340]` raise the lines well above the countdown digit (which renders at size 620 near screen center).
   - `showPregameCountdownDelayLineForAllPlayers(idx)` is a per-index helper so the countdown loop in `runPregameCountdown` can reveal lines at specific tick points: idx 0 immediately, idx 1 at `PREGAME_COUNTDOWN_START_NUMBER - 3`, idx 2 at `PREGAME_COUNTDOWN_START_NUMBER - 6`.
   - `PREGAME_COUNTDOWN_START_NUMBER = 20` in `foundation/gameplay.ts` now carries an inline comment noting that a minimum of 10s is required for all three staggered lines to get meaningful screen time.

2. **Cache-preservation fix (`ensureCountdownUIAndGetWidget` in `pregame-ui.ts`)**
   - Bug: `ensureCountdownUIAndGetWidget` overwrote the entire `countdownWidgetCache[pid]` entry every tick (`State.hudCache.countdownWidgetCache[pid] = { rootName, widget }`), wiping out the `delayLineWidgets` array that `ensurePregameCountdownDelayLineWidgetsForPlayer` had populated. `hidePregameCountdownForAllPlayers` then iterated an empty array and skipped the hide, leaving the lines visible into LIVE.
   - Fix: the ensure path now checks for an existing entry and mutates `rootName`/`widget` in place, preserving `delayLineWidgets`/`delayLineNames` so hide-on-LIVE actually runs.
   - Extended `CountdownWidgetCacheEntry` with `delayLineNames?` + `delayLineWidgets?` so the type matches runtime usage.

Status:
- Resolved v1.209. Extended further in v1.210–v1.211 (4th line for gadget delay — see `CQ_Feat_Round_Start_Gadget_Delay`).
- Verification: all delay lines appear in sequence with ~3s spacing, sit above the countdown digits without overlap, and disappear together with the LIVE! text when the pop-in hold expires.

Related:
- CQ_Feat_Forward_Deploy_FreeSpace (v1.207 shipped the config fields these lines describe).
- CQ_Feat_Round_Start_Gadget_Delay (v1.210-v1.211 adds a 4th line on top of this plumbing).

## CQ_Feat_Round_Start_Gadget_Delay (v1.210-v1.211)
Title: Gadget Locker Round-Start Delay + Dual-String Status Header

Context:
- v1.207 gated aircraft and forward-deploy under `roundStart*Delay` fields but the gadget locker was still the only system that unlocked instantly on LIVE (and was even fully usable pre-LIVE), breaking the pacing the other delays established. Requirement: gate gadget lockers with the same pattern and also lock them pre-LIVE so round openings are about vehicle positioning rather than stockpiling supplies — but keep the menu openable with preview/stats visible so players can plan.

Resolution (v1.211):

1. **New MapConfig field + state helpers**
   - `src/config/types.ts`: added optional `roundStartGadgetDelay?: number` on `MapConfig` alongside the other three round-start delays.
   - `src/config/maps/operation-firestorm.ts`: `roundStartGadgetDelay: 60` as the initial tuning pass (matches `roundStartForwardDeployDelay`).
   - `src/state/core.ts`: added `isRoundStartGadgetDelayActive()` and `getRoundStartGadgetDelayRemainingSeconds()` next to the three existing pairs. Intentional asymmetry: `getRoundStartGadgetDelayRemainingSeconds` returns the raw configured delay pre-LIVE (not 0) so the menu header can display the configured value before the match clock starts; mirrors how pregame-ui reads `ACTIVE_MAP_CONFIG` directly.

2. **4th pregame countdown line**
   - `src/ready-dialog/pregame-ui.ts`: `PREGAME_COUNTDOWN_DELAY_LINE_KEYS` extended with `mod.stringkeys.twl.countdown.delayGadgets` (new idx 3). Y array extended to `[-420, -380, -340, -300]`. `getPregameCountdownDelayValueForIndex` returns `ACTIVE_MAP_CONFIG.roundStartGadgetDelay ?? 0` for idx 3. `ensurePregameCountdownDelayLineWidgetsForPlayer` now builds 4 widgets via `PREGAME_COUNTDOWN_DELAY_LINE_COUNT`.
   - `src/ready-dialog/countdown-flow.ts`: stagger reveal — idx 2 + idx 3 both fire at `PREGAME_COUNTDOWN_START_NUMBER - 6` so gadget info appears alongside the forward-deploy line.

3. **Gadget locker menu — status header + tile lockout (`src/interaction/ammo-resupply-menu.ts`)**
   - Added `gadgetDelayStatus?: mod.UIWidget` + `gadgetDelayStatusSig?: string` to `AmmoResupplyMenuCacheEntry` (`state/hud-cache-types.ts`).
   - Build: new yellow text widget at Y=-410 (above the class header at -366), full `HELP_TEXT_WIDTH`, size 22, hidden initially.
   - `refreshArmMenu` early block computes `gadgetBlocked = !isMatchLive() || isRoundStartGadgetDelayActive()` and `gadgetRemaining`; sig-cached label/visibility update picks `delayGadgets` pre-LIVE (“Gadgets at the Supply Boxes (Yellow Smoke) are available {0}s after match is Live”) vs `delayGadgetsLive` post-LIVE (“Gadgets at the Supply Boxes (Yellow Smoke) will be available in {0}s”). Two string variants approved by user this session.
   - Tile lockout: every `const enabled = ...` branch is gated with `&& !gadgetBlocked` across the 6 tile types (assault smoke, assault class, medic smoke, engineer launcher, ammo, recon). Each tile's `sig` includes `gadgetBlocked ? 1 : 0` so cached renders refresh when the gate flips.
   - Defensive click guard in the button activation handler: early return if `!isMatchLive() || isRoundStartGadgetDelayActive()`.

4. **New strings (explicitly approved)**
   - `twl.countdown.delayGadgets`: "Gadgets at the Supply Boxes (Yellow Smoke) are available {0}s after match is Live"
   - `twl.countdown.delayGadgetsLive`: "Gadgets at the Supply Boxes (Yellow Smoke) will be available in {0}s"

Status:
- Resolved v1.211. Bundle 1,001,946 / 1,048,576 bytes (46,630 headroom, 4.45%).
- Verification: pre-LIVE menu opens with stats visible, all tiles disabled, yellow header reads 60s. Countdown 4th line reveals at the -6s stagger and hides with LIVE. LIVE+0..59s: header counts down, tiles remain locked. LIVE+60s: header hides, tiles follow existing class/readiness rules. With `roundStartGadgetDelay: 0` behavior matches v1.208.

Related:
- CQ_Feat_Forward_Deploy_FreeSpace (v1.207 established the `roundStart*Delay` pattern this extends).
- CQ_Feat_Pregame_Countdown_Delay_Lines (v1.208-v1.209 plumbing this builds on).

## CQ_Bug_56
Title: Kills Counter Increments On Friendly Kills When Team Damage Is On

Observed:
- With team damage enabled, killing a teammate incremented the Kills column on the custom tab scoreboard. Portal's `OnPlayerEarnedKill` fires for every death including team kills and self-inflicted deaths; the Phase 9 KPI wiring only guarded against self-kills, not team kills.

Expected:
- The Kills counter should only increment on confirmed enemy kills. Team kills should be ignored; if team numbers are unknown the system should fail open rather than silently drop valid kills.

Root cause:
- `onPlayerEarnedKillImpl` in `src/index/player-kpi-events.ts` checked only `mod.Equals(eventPlayer, eventOtherPlayer)` for self-kill rejection. No killer/victim team comparison.

Fix (v1.212):
- Added team-equality guard using `safeGetTeamNumberFromPlayer(player, 0)` fallback helper (already in `id-helpers.ts`).
- Guard reads: `if (killerTeam !== 0 && killerTeam === victimTeam) return;` — the `!== 0` check ensures the function fails open on unassigned-team state rather than silently dropping the kill.
- `_eventDeathType` and `_eventWeaponUnlock` remain unread; this is purely a team-equality check.

Status:
- Fixed v1.212. Bundle 1,002,150 / 1,048,576 bytes (46,426 headroom, 4.43%).
- Needs MP confirmation: verify on a 2-player session that friendly kills no longer increment the Kills column, enemy kills still do, and suicides still register as 0 kills.

Related:
- Phase 9 scoreboard KPI wiring (v1.178) — this closes a gap in the original event handler that was only tested in friendly-fire-off environments.

## CQ_Bug_Loading_Gate_Invariants (v1.214 shipped, v1.222 reverted)
Title: Loading Gate Dual-Guard Invariant Unverified at Runtime

Context:
- The v1.104 serialization lock established a dual-guard pattern around the loading gate and deploy event, but no runtime assertion verified the invariant held. Category 3 Item 5 in `conquest_optimization_analysis.md` identified this as a medium-high crash risk.

Resolution history:
- v1.214: shipped GATE_INV_1/2/3 asserts that emitted via `sendHighlightedWorldLogMessage`.
- v1.222: **reverted** the asserts. The world-log channel is transient/unreliable (messages scroll off and may be filtered), so the asserts could not be used to confirm the invariant held or violated. Pre-implementation audit had already concluded the dual-guard closes the race; the asserts were belt-and-suspenders documentation, not bug detection. Net: reclaim bundle bytes, keep the actual dual-guard code that closes the race (`active || !released` in `onPlayerDeployedImpl`, per-iteration `deployedByPid` check in `runLoadingGateUntilReady`), drop the unobservable instrumentation.

Status:
- Closed via code audit, not runtime verification. The dual-guard in `onPlayerDeployedImpl` ([index/player-deploy.ts](../src/index/player-deploy.ts)) + gate-loop force-undeploy in `runLoadingGateUntilReady` ([interaction/actions.ts](../src/interaction/actions.ts)) together close the race.

Future diagnostic recipe (if this path ever becomes suspect):
If we see symptoms like a player deploying while the UI loading overlay is still visible, or the force-undeploy loop thrashing, reintroduce observability via a **persistent HUD plate** (not world-log). Pattern:
1. Add `State.conquest.debug.gateInvariantCountersByInvId: Record<1|2|3, number>` to runtime state; initialize to 0.
2. Bump counter in three spots:
   - GATE_INV_1: [interaction/actions.ts](../src/interaction/actions.ts) in the gate-loop force-undeploy branch — fire when `State.players.deployedByPid[pid] && isUiLoadGateReleasedForPid(pid)` (deployed while gate already released → ordering drift).
   - GATE_INV_2: [index/player-deploy.ts](../src/index/player-deploy.ts) at top of `onPlayerDeployedImpl` — fire when `isUiLoadGateActiveForPid(pid) && isUiLoadGateReleasedForPid(pid)` (both flags simultaneously true → release wasn't atomic).
   - GATE_INV_3: [interaction/hud-warm-state.ts](../src/interaction/hud-warm-state.ts) in `setUiLoadGateReleasedForPid` — fire when `released && state.uiLoadGateActive` (releasing before active was cleared → caller flipped order).
3. Render via a small always-on HUD text widget (3 counters, "INV: 0/0/0") using the same widget pattern as the perf-diag plate. Hide when all three are 0 so it stays invisible in clean runs.

Bundle cost of the diag plate (estimated): ~400-800 bytes for state + 3 counter bumps + widget build/update. Only worth paying when a concrete bug repro exists.

Related:
- CQ_Bug_40 (v1.104 serialization lock — the mechanism these checks would protect).
- conquest_optimization_analysis.md Category 3 Item 5.

## CQ_Perf_Deploy_Timer_HotPath_SafeFind (v1.215)
Title: Redundant safeFind Calls on Every Deploy-Timer HUD Tick

Context:
- `vehicles/deploy-timer-ui.ts` was calling `safeFind` to check for the loading overlay and performing at least one redundant lookup on every timer tick. With the timer running per deployed player, this added measurable safeFind volume to the hot path.

Resolution (v1.215):
- Cached the loading-overlay exists flag to avoid re-querying on every tick.
- Removed the redundant `safeFind` call identified in the deploy-timer hot path.
- Companion to the v1.190 `safeFindPlayer` hot-path fix (BUG-A8 at `capture-tickets.ts:1783`).

Status:
- Resolved v1.215.

Related:
- conquest_optimization_analysis.md Category 4 Item 4 (safeFind caching).
- CQ_Bug_Loading_Gate_Invariants (same pass — v1.214-v1.221).

## CQ_Bug_Combat_HUD_Stale_Widget_Refs (v1.216)
Title: Combat HUD Renders Into Stale Widget References After Team Swap or Reconnect

Context:
- v1.190 removed 52 orphaned widget-name strings but the underlying pattern remained: the combat HUD could hold cached widget refs that were destroyed and recreated (e.g., after a team swap or mid-round reconnect). Revalidation happened only every 40 updates, leaving a window where writes targeted already-destroyed widgets.

Resolution (v1.216):
- Added `State.conquest.debug.combatHudGenerationByPid` — a per-player counter incremented every time combat HUD widgets are destroyed.
- The render path stamps the generation at build time. On each render it compares the stamp to the current counter; on mismatch it bails and triggers a rebuild before continuing.
- Closes the stale-ref race without lowering the revalidation interval.

Status:
- Resolved v1.216. SP testing confirmed stamp/bail/recover cycle fires correctly after simulated destroy.
- Team-swap and reconnect paths need MP confirmation — see `CQ_Polish_MP_Validation_v1.214_to_v1.221`.

Related:
- conquest_optimization_analysis.md Category 3 Item 2.
- CQ_Bug_40 / CQ_Bug_42 (related widget-lifecycle hardening history).

## CQ_Refactor_forEachValidPlayer_Helper (v1.217)
Title: 23 ForAllPlayers Wrappers Repeat the Same Validity-Check Loop

Context:
- 44 `mod.AllPlayers()` call sites across 31 files each repeated an inline validity-check pattern. 23 of those were thin `*ForAllPlayers` wrapper functions with no substantive logic beyond the loop.

Resolution (v1.217):
- New file `src/state/player-iteration.ts` introduces `forEachValidPlayer(cb)`.
- 23 `*ForAllPlayers` wrappers converted to delegate to the helper.
- Enables the Category 4 Item 1 per-tick cache (implemented in v1.219 via `TickContext`).
- Net bundle savings absorbed into the overall pass delta.

Status:
- Resolved v1.217.

Related:
- conquest_optimization_analysis.md Category 2 Item 2 + Category 1 Item 3.
- CQ_Perf_TickContext_AllPlayers_Cache (v1.219 — builds on this helper).

## CQ_Perf_TickContext_AllPlayers_Cache (v1.219)
Title: mod.AllPlayers() Called Multiple Times Per Subtick Across Independent Callers

Context:
- Even after the `forEachValidPlayer` refactor (v1.217), independent callers within a single subtick each triggered their own `mod.AllPlayers()` engine call. With 6-8 redundant invocations per tick cycle the cumulative engine overhead was measurable.

Resolution (v1.219):
- New file `src/state/tick-context.ts` introduces `TickContext` with `beginTickContext()` / `endTickContext()`.
- `beginTickContext()` / `endTickContext()` wrap the main game-mode subtick body in `src/index/game-mode.ts`.
- `forEachValidPlayer` consults the ambient context so all per-subtick callers share one `mod.AllPlayers()` snapshot.
- Event handlers and one-shot lifecycle transitions fall back to a fresh `mod.AllPlayers()` call when no context is active.
- v1.218 was a duplicate version bump, collapsed into v1.219. v1.220 was a type-fix follow-up (`mod.Array` is not generic so `players` is typed `any`).

Status:
- Resolved v1.219 / v1.220.

Related:
- conquest_optimization_analysis.md Category 4 Item 1.
- CQ_Refactor_forEachValidPlayer_Helper (v1.217 — prerequisite).

## CQ_Perf_Combat_HUD_Dirty_Gate (v1.221)
Title: Combat HUD twlConquestHudTickFrame Runs Every Tick Regardless of State Changes

Context:
- `conquestPhase3MarkHudDirty()` set a `hudDirty` flag but `twlConquestHudTickFrame` ignored it entirely, re-rendering the full combat HUD on every tick. This was the single largest per-tick CPU regression item identified in the optimization analysis (Category 4 Item 2), estimated to waste 70-80% of HUD render work.

Resolution (v1.221):
- `updateConquestCombatHudForAllPlayers` is now gated on `State.conquest.debug.hudDirty || force`.
- Derived top-HUD slices (clock view model) and `twlConquestHudTickAnimation` remain unconditional because they are time-variant.
- AGENTS.md gained a "Combat HUD Dirty-Flag Contract" section enumerating 9 state fields that must call `conquestPhase3MarkHudDirty()` on mutation; this is the enforcement mechanism to prevent silent regressions where a state change skips the dirty mark.

Status:
- Resolved v1.221. Bundle 998,868 / 1,048,576 bytes (49,708 headroom, 4.74%).
- SP verified: HUD updates when dirty-marked state changes; no spurious skips observed.
- Simultaneous team-swap dirty-mark from two clients needs MP confirmation — see `CQ_Polish_MP_Validation_v1.214_to_v1.221`.

Related:
- conquest_optimization_analysis.md Category 4 Item 2.
- CQ_Bug_Combat_HUD_Stale_Widget_Refs (v1.216 — companion hardening in the same pass).
- AGENTS.md "Combat HUD Dirty-Flag Contract" (review rule).

## CQ_Polish_MP_Validation_v1.214_to_v1.221
Title: MP-Only Scenarios From the v1.214-v1.221 Stability/Perf Pass — Pending Playtest

Context:
- The v1.214-v1.221 pass was developed and smoke-tested in SP. Several correctness scenarios require two or more real clients and cannot be confirmed in a single-player session.

Pending scenarios (next MP playtest):

- **Two clients deploying within 50ms of loading-gate release** — verifies the dual-guard holds under real concurrent join pressure (CQ_Bug_Loading_Gate_Invariants). No runtime instrumentation is shipped in this bundle; if this scenario turns up a bug, reintroduce the GATE_INV counters as a persistent HUD plate per the diagnostic recipe in that issue entry.
- **Client reconnects mid-prebuild** — verifies the generation counter in `combatHudGenerationByPid` rebuilds cleanly and the stamp/bail/recover cycle fires correctly for the reconnecting player without corrupting the other client's HUD (CQ_Bug_Combat_HUD_Stale_Widget_Refs).
- **Simultaneous team swaps (both clients swap teams within the same tick)** — verifies generation counter increments and dirty-flag marks land correctly for both PIDs; no stale-ref writes, no missed HUD refresh (CQ_Bug_Combat_HUD_Stale_Widget_Refs + CQ_Perf_Combat_HUD_Dirty_Gate).
- **Two clients on opposing teams watching the same flag capture** — verifies `TickContext` snapshot is consistent across both players' HUD paths within the same subtick; no split-brain from one player seeing a stale snapshot (CQ_Perf_TickContext_AllPlayers_Cache).
- **Deploy-timer hot path under concurrent load** — two players each deploying vehicles at the same time; confirms the cached loading-overlay flag is per-player and does not leak across PIDs (CQ_Perf_Deploy_Timer_HotPath_SafeFind).

Status:
- Pending next playtest. All SP smoke checks passed. No new blocking issues observed.

## CQ_Bug_ActiveSpawnSingletonMPRace
Title: Concurrent MP Air/Forward Deploy Clicks Clobber Global `activeSpawn*` Singleton → Wrong-Slot Vehicle Attribution → Abrams Substitution

Observed (v1.222 MP, 2026-04-13):
- **Air Deploy and Forward Deploy intermittently spawn an Abrams in place of the intended vehicle.** Happens across every tested vehicle class (Jets, Helis, Transports, quads) — not isolated to specific slots.
- **MP-specific**: the user could not reproduce in SP despite hammering Air/Forward. Strong signal that shared state is being mutated by concurrent players.
- HQ Deploy is always safe.
- Error log (v1.221 screenshot): repeated `UNSPAWNOBJECT`, `GETPLAYERVEHICLESEAT`, `GETVEHICLEFROMPLAYER` script errors accumulate during the match. Those are secondary but indicate orphan vehicles and stale caches compound the symptom.

Root Cause (v1.223 fix target):
- `State.vehicles.activeSpawnSlotIndex / activeSpawnToken / activeSpawnRequestedAtSeconds` was a **global singleton** armed by every direct-spawn path (fresh-air: `spawnFreshAircraftDirectSpawnVehicleForSlot`; forward: `spawnForwardDeployVehicleForSlot`; sequence: `forceSpawnWithRetry`) and read on every `OnVehicleSpawned` in `vehicle-events.ts` + `spawner-bind.ts`. Two players clicking Air/Forward within the ~0.1-0.4s bind window caused the second click to overwrite the first's tracking. When player A's aircraft then fired its spawn event, the bind path attributed it to player B's slot — and if player B's slot was not aircraft-class, the CQ_Bug_49 tank-reject guard did not fire, so a prefab-default Abrams could bind to player B's aircraft slot (or worse, a wrong-class instance could seat as if it were the requested vehicle).
- SP never reproduced because the singleton was sufficient for serialized single-click flows.

Resolution (v1.223):
- Removed `State.vehicles.activeSpawn*` triple entirely (runtime-types.ts, runtime-state.ts).
- Added per-slot `VehicleSpawnerSlot.lastRequestedSpawnPos?: mod.Vector`. Writers:
  - `forceSpawnWithRetry` (sequence): sets to `mod.GetObjectPosition(slot.spawner)` — map-authored pad pos.
  - `spawnFreshAircraftDirectSpawnVehicleForSlot`: sets to `birthSpawn.pos` — sampled aircraft volume pos.
  - `spawnForwardDeployVehicleForSlot`: sets to `boundedTransform.pos` — forward-deploy volume pos.
- `spawner-bind.ts`: new `findExpectingSpawnerSlotForVehiclePos(vehiclePos)` scans all enabled slots with `expectingSpawn=true && !expired`, returns the closest within `VEHICLE_SPAWNER_BIND_DISTANCE_METERS (7m)`. Used by both `bindSpawnedVehicleToSlot` and `onVehicleSpawnedImpl`.
- Cleared on bind success, on failure paths, on fulfillment reset, and in the CQ_Bug_52 watchdog reap in `pollVehicleSpawnerSlots`.
- Removed now-redundant `clearVehicleDirectSpawnActiveTrackingForSlot` helper.
- Preserves CQ_Bug_49 tank-instance reject for aircraft slots. Preserves `suppressNextBindSpawnTransformCorrection` wiring. Preserves `expectingSpawn` watchdog.

Files changed: `src/state/runtime-types.ts`, `src/state/runtime-state.ts`, `src/vehicles/spawner-slots.ts`, `src/vehicles/spawner-bind.ts`, `src/vehicles/spawner-sequence.ts`, `src/vehicles/deploy-fulfillment.ts`, `src/index/vehicle-events.ts`.

Regression + Hotfix (v1.224):
- v1.223 broke SP Air and Forward Deploy entirely. User report: "Forward Deploy and Air Deploy are not working at all. HQ deploys seem to work fine. Sometimes I'm seeing the aircraft spawn in the distance, and sometimes I'm not sure anything spawned."
- Root causes:
  1. **Aircraft bind radius too tight**. Jets/helis spawn with initial velocity; by the time `OnVehicleSpawned` fires, the aircraft has been displaced beyond `VEHICLE_SPAWNER_BIND_DISTANCE_METERS` (7m) from `slot.lastRequestedSpawnPos = birthSpawn.pos`. The position-only scan returned -1 → aircraft orphaned → `slot.vehicleId` stayed -1 → `waitForSpawnedVehicleForSlot` timed out → fulfillment failed with no seat. The prior global `activeSpawn*` path had no distance constraint.
  2. **Non-tank-volume slots (Quadbike/Marauder) now deterministically caught the AutoSpawn Abrams**. The runtime-spawner prefab's AutoSpawn fires before `SetVehicleSpawnerAutoSpawn(false)` lands, spawning an Abrams at `boundedTransform.pos`. With per-slot position tracking, that Abrams now matches the slot's `lastRequestedSpawnPos` exactly (d≈0) and binds via `bindSpawnedVehicleToSlot`. The `CQ_Bug_49` intercept only fired for aircraft slots; non-tank ground slots fell through and Abrams-substituted every time.
- Hotfix:
  - `spawner-bind.ts::findExpectingSpawnerSlotForVehiclePos`: if the position scan finds no match but exactly one slot is expecting, return it unconditionally. MP safety preserved — the concurrent case still requires position disambiguation on the primary pass.
  - `vehicle-events.ts` onVehicleSpawnedImpl: generalized the CQ_Bug_49 intercept from `isAircraftSpawnVolumeVehicleType(slot.vehicleType)` to `!isTankVehicleType(slot.vehicleType)` — covers aircraft AND non-tank ground slots (Quadbike, Marauder, etc.).
  - Renamed `rejectWrongCategoryBindForAircraftSlot` → `rejectWrongCategoryBindForSlot` with matching logic.

Second Regression + Fix (v1.226):
- v1.224 hotfix still failed in SP. User report (2026-04-14): "Air deploy still does not work. I tried 4-5 times and all times they failed. Some spawned Tanks. None spawned me in the vehicle, I was either spawned as a soldier, or didn't spawn at all. I saw the vehicles on the minimap in the far distance spawn without me."
- Post-mortem identified FOUR distinct failure modes compounding:
  1. **Aircraft physics displacement >7m**. Same v1.223 root cause: `birthSpawn.pos` is the sample point, but jet/heli velocity carries the vehicle outside the 7m bind radius before `OnVehicleSpawned` fires. Position-only scan returns -1.
  2. **Single-expecting fallback insufficient for watchdog-driven respawns**. The CQ_Bug_52 watchdog (`pollVehicleSpawnerSlots`) calls `scheduleRespawn` mid-match. If two slots are expecting simultaneously (one from user click + one from watchdog), the single-expecting fallback returns -1. Multiple MP players clicking concurrently hits the same failure mode.
  3. **Tank-type slots (Leopard/CV90/Bradley) still Abrams-substituted**. The v1.224 intercept `!isTankVehicleType(slot.vehicleType)` skipped tank-type slots entirely. When a tank slot's runtime spawner fires AutoSpawn (always producing Abrams, the prefab default), the intercept did not run. If user had configured Leopard/CV90/Bradley, they still got Abrams because `isTankVehicleInstance(Abrams) === true` and `rejectWrongCategoryBindForAircraftSlot` only rejected aircraft-slot binds.
  4. **UnspawnObject silent failure** (deferred — error log evidence from v1.221 screenshot shows >10 silent failures per match; orphan Abrams persist and can be picked up by subsequent position scans).
- v1.226 fixes:
  - `spawner-bind.ts::findExpectingSpawnerSlotForVehicle(eventVehicle, vehiclePos)` — renamed + third-tier class-aware fallback. Primary pass: position match within 7m (closest). Secondary: single-expecting slot. Tertiary: **class match** — aircraft instance → aircraft-volume slot; tank instance → tank-type slot; other ground → non-aircraft-non-tank slot. If exactly one class-match exists, bind to it. Solves #1 (aircraft displacement) and #2 (watchdog mid-match, MP concurrent).
  - `spawner-bind.ts::rejectWrongCategoryBindForSlot` — rewrote to target Abrams specifically via `mod.CompareVehicleName(eventVehicle, mod.VehicleList.Abrams)`. Reject any Abrams instance binding to any slot whose `vehicleType !== Abrams`. Does not over-reject real Leopard/CV90/Bradley (which ARE tank-instances) on their correctly-configured tank slots.
  - `vehicle-events.ts` onVehicleSpawnedImpl — CQ_Bug_49 intercept tightened to the same Abrams-specific test: `slot.vehicleType !== mod.VehicleList.Abrams && mod.CompareVehicleName(eventVehicle, mod.VehicleList.Abrams)`. Covers aircraft slots, non-tank ground slots, AND non-Abrams tank slots (Leopard/CV90/Bradley). Fixes #3.
- Deferred to future phase: UnspawnObject silent-failure mitigation (rejection blacklist for orphan objIds so subsequent scans skip them).

Status:
- Fixed in code v1.226. **Pending SP playtest** before MP validation.

Related:
- CQ_Bug_49 (tank-reject intercept — rewritten in v1.226 to target Abrams specifically, preserving real-tank binds on tank slots).
- CQ_Bug_52 (`expectingSpawn` watchdog in `pollVehicleSpawnerSlots` — simplified in v1.223, no longer gates on the now-removed global active-tracker).
- CQ_Bug_54 (fresh-aircraft runtime-spawner prefab AutoSpawn race — independent, targeted in Phase 4 of the Abrams plan).

Supersession note: the entire Air/Forward Deploy path that this bug guarded was deleted in the v1.259 rewrite. The pattern of per-slot `lastRequestedSpawnPos` + `expectingSpawn` + nearest-slot bind informed the v1.259 persistent-spawner design and lives on inside `bindSpawnedVehicleToExpectingSlot` in `vanilla-spawner.ts`.

## CQ_Refactor_Vanilla_Vehicle_Spawner_Rewrite (v1.258–v1.259)
Title: Full Rewrite of Vehicle Spawner — Persistent Spawner + Serial Mutex + Event-Driven Bind + Clocks-Driven Respawn

Motivation:
- The v1.200-series deploy-fulfillment path had accumulated ~6 layered guards (CQ_Bug_39/49/52/54/55 + CQ_Bug_ActiveSpawnSingletonMPRace + the v1.226 class-aware fallback). Each incremental fix narrowed the failure envelope but never eliminated the underlying race: per-click runtime prefab instantiation + global active-tracker + 20-retry loop + 5s poll + 3-path bind cascade.
- Root architectural fix: one persistent `VehicleSpawner` per slot created at match start; all spawn requests serialized through a single mutex that calls `ForceVehicleSpawnerSpawn`; bind is event-driven via `OnVehicleSpawned`; respawn is time-driven via `Clocks.CountDownClock`.

Resolution (v1.258–v1.261):
- New file: `src/vehicles/vanilla-spawner.ts` — ~565 lines. Owns `enqueueDispatch`, `doDispatch`, `bindSpawnedVehicleToExpectingSlot`, `resetVehicleSlotsAtCountdownStart`, `startRespawnCountdown`, `sinkAndDestroyVehicle`.
- Deleted: `src/vehicles/deploy-fulfillment.ts`, `src/vehicles/reservations.ts`, `src/vehicles/spawner-sequence.ts`, `src/vehicles/spawner-bind.ts`, runtime-side bind helpers, `pollVehicleSpawnerSlots` watchdog.
- Removed: all `VEHICLE_DEPLOY_METHOD_AIR` / `VEHICLE_DEPLOY_METHOD_FORWARD` / `VEHICLE_DEPLOY_METHOD_HQ_FORWARD` / `VEHICLE_DEPLOY_METHOD_HQ_FORWARD_AIR` branches and their supporting helpers. `VEHICLE_DEPLOY_METHOD_VANILLA` is the only deploy method; `VEHICLE_DEPLOY_METHOD_HQ` was added on top as Phase 6 opt-in.
- v1.261 follow-up: `setTimeout` is not in the Portal sandbox and rejected the first `doDispatch` promise, poisoning the `.then()` chain. Switched to `Timers.setTimeout`; wrapped `Promise.race` in try/catch; routed every mutex enqueue through `enqueueDispatch()` with `.catch(() => {})`.

Obsoleted by this rewrite (underlying code deleted):
- CQ_Bug_49, CQ_Bug_52, CQ_Bug_53, CQ_Bug_54, CQ_Bug_55, CQ_Bug_ActiveSpawnSingletonMPRace.

Preserved:
- Durable lessons live in memory: `project_teleport_vehicle_spawn_mystery.md`, `project_force_player_to_seat_unreliable.md`, `project_getobjectposition_unreliable_on_destroy.md`.

Status: Resolved v1.259. SP regression-tested through the v1.260–v1.289 bumps; no v1.258-rewrite-specific regressions observed.

## CQ_Refactor_Vehicle_Destroy_Consolidation (v1.270–v1.276)
Title: Single `sinkAndDestroyVehicle` Wrapper Replaces Four Duplicated Inline Destroy Sites

Motivation:
- Four call sites duplicated the "sink to y=-1000, wait, DealDamage" idiom (startup cleanup, countdown-reset, prior-vehicle teardown, respawn-triggered teardown). Each had slightly different parameters; some did not preserve X/Z on the sink teleport, causing a minimap "slide to map-center" artifact at countdown reset.

Key fixes along the path:
- v1.270: preserve X/Z when teleporting vehicles down at countdown.
- v1.271: `relocateSlotSpawner` waits 2s for engine init before configure (fixes transport-3 Abrams-instead-of-selected bug when heli/ground toggle forces pad relocation).
- v1.272: replace vehicle `UnspawnObject` with `DealDamage` at startup cleanup and prior-vehicle destruction (`UnspawnObject` on transitional vehicles emits engine-side errors that try/catch cannot suppress).
- v1.273: sink vehicles to y=-1000 BEFORE `DealDamage` at startup cleanup + prior-vehicle destroy sites so explosions are not audible at pad positions.
- v1.274: cleanup sweeps skip vehicles not near our slot pads (15m) so map-authored emplacements survive.
- v1.275: rework cleanup filters — countdown-reset uses tracked `vehicleId` set (not pad-proximity which missed drifted vehicles); startup cleanup filters by Abrams type (the engine default auto-spawn) so emplacements survive.
- v1.276: **consolidation** — single `sinkAndDestroyVehicle(vehicle, fallbackPos)` wrapper. Preserves X/Z. Sinks to y=-1000. Damages after 500–1500ms depending on call site. Prefers `slot.spawnPos` over `GetObjectPosition` (v1.283/v1.285) because `GetObjectPosition` returns bad X/Z at Vanilla→HQ countdown reset. See memory `project_getobjectposition_unreliable_on_destroy.md`.

Status: Resolved v1.276. Confirmed during v1.277–v1.289 HQ Deploy work; used as the canonical destroy wrapper for HQ-mode cleanup (LIVE start, respawn suppression cleanup, orphan on abort).

## CQ_Feat_Phase6_HQ_Deploy (v1.277–v1.289)
Title: Opt-In HQ Deploy Mode — Player-Triggered Per-Slot Vehicle Spawn with Automatic Seating

Design:
- Ready-dialog knob `Vehicle Deploy Method`: `VANILLA` (default) | `HQ`.
- Vanilla mode (unchanged): fleet pre-spawns at LIVE; auto-respawn after destruction.
- HQ mode: pads start empty at LIVE. A player presses an HQ button for a specific slot (deploy screen OR on-foot live-terminal) → that slot's spawn is dispatched → after the vehicle settles, the requesting player is seated into it. No auto-respawn.

Architecture:
- New file: `src/vehicles/hq-deploy.ts` (~430 lines). No code copied from the deleted fulfillment/reservations modules.
- `requestHqVehicleSpawn(player, pid, rowIndex, source)` — validates + reserves + dispatches. Slot fields used: `pendingSpawnOwnerPid`, `pendingSpawnMode`, `hqSource` ("deploy_menu" | "on_foot").
- Dispatch reuses the Vanilla `enqueueDispatch(slotIndex)` serial mutex. No new spawn mechanism.
- Post-bind hook: `bindSpawnedVehicleToExpectingSlot` (vanilla-spawner.ts) now checks `slot.pendingSpawnOwnerPid` after bind and calls `onHqVehicleSpawnedForClaim` to transition the claim from `spawn_pending` → `seat_pending`.
- Seating: `beginHqSeatFlow` waits `HQ_DEPLOY_SEAT_SETTLE_SECONDS`, then calls `mod.DeployPlayer(player)`. `onHqSeatPendingPlayerDeployed` (hooked in `src/index/player-deploy.ts`) fires inside the `OnPlayerDeployed` event and calls `mod.ForcePlayerToSeat(player, vehicle, -1)` — the BountyHunter pattern is the only reliable context for `ForcePlayerToSeat`.
- On-foot seating (v1.287–v1.289, Option C): alive on-foot players are `mod.UndeployPlayer`'d → redeployed → seated in the `OnPlayerDeployed` chain. v1.289 wraps the transition with `mod.SetRedeployTime(player, 0)` to bypass the post-death countdown that `UndeployPlayer` triggers.
- Abort / timeout / disconnect: `sinkAndDestroyVehicle` cleans up orphaned vehicles. 10s claim timeout forces clearing + destroy.

Durable constraints (do not violate):
- Never `mod.Teleport` a player before `ForcePlayerToSeat`. Caused engine OOB latch twice historically (v1.106–v1.108, v1.151–v1.154).
- `ForcePlayerToSeat` is only reliable inside the `OnPlayerDeployed` event chain.
- Do not copy code from the deleted `deploy-fulfillment.ts` / `reservations.ts` / `spawner-sequence.ts`.
- Vanilla mode must remain byte-identical when HQ is active. All HQ logic is gated on `isVanillaDeployMode()` returning false.

Phases shipped:
- v1.277 — ready-dialog knob option (no behavior yet).
- v1.278 — gate vanilla auto-spawn + auto-respawn on knob; HQ pads start empty at LIVE.
- v1.279 — per-slot player-triggered dispatch via deploy-menu HQ buttons (seating stub).
- v1.280 — deploy-menu seating via `OnPlayerDeployed` + `ForcePlayerToSeat`.
- v1.281–v1.285 — sink-and-destroy polish for HQ cleanup; restore per-slot respawn cooldown in HQ mode.
- v1.286 — pending-state HUD signal (SPAWNING/DEPLOYING in warning yellow); tighten `sinkAndDestroyVehicle` slot context at vehicle-type change.
- v1.287 — on-foot live-terminal seating via undeploy → redeploy (Option C).
- v1.288 — poll undeploy completion; retry `DeployPlayer` 3× with 0.4s waits.
- v1.289 — `mod.SetRedeployTime(player, 0)` around `UndeployPlayer` so on-foot seat flow is not delayed by post-death countdown.

Status: Resolved v1.289. Playtested for deploy-menu (transport / tank / helicopter slots) and on-foot live-terminal. Late-joiner redeploy-timer audit deferred to polish phase (see `CQ_Polish_Respawn_Redeploy_Timer_Audit`).

## CQ_Bug_Abrams_Substitution_Transport_Slot_Regression
Title: Transport-Slot Wrong-Vehicle on Heli/Ground Knob Toggle (Post-v1.259)

Observed (v1.266–v1.269):
- After toggling the vehicle-type knob (heli ↔ ground) for a transport slot, the wrong vehicle (often default Abrams) can appear at the pad at countdown start.
- Root cause candidate: spawner not correctly re-configured when the physical pad was relocated.

v1.266–v1.268 fix attempts and reverts:
- v1.266: `relocateSlotSpawner` → `SetObjectTransform` in-place + Phase C re-push `configureVehicleSpawner` before each dispatch + `bindSpawnedVehicleToExpectingSlot` rejects stray default Abrams when expecting slot's intended type is not a tank.
- v1.267: reverted v1.266 (5 of 8 slots failed to spawn at map start; rejected-Abrams `DealDamage` produced audible explosions on retries).
- v1.268: re-attempted with teleport-straight-down + sink-then-delayed-damage on rejected Abrams. Also reverted.
- v1.269: reverted to v1.265 spawner behavior — wrong-vehicle may be visible at countdown start, but no slots are empty.
- v1.271: mitigated by waiting 2s for engine init before `relocateSlotSpawner` configure.

Status: **Open.** Fresh diagnostic pass required before next attempt. Current shipped behavior (v1.289): wrong-vehicle visible at countdown start on post-toggle transport slots is possible; no empty slots. Not blocking Phase 6 HQ Deploy since HQ mode does not rely on countdown-start fleet behavior.

## CQ_Polish_Respawn_Redeploy_Timer_Audit
Title: Late-Joiner `SetRedeployTime` May Apply Globally; `SetRedeployTime(0)` Persistence Not Verified

Observed (v1.289):
- User report during HQ Deploy on-foot playtest: when a late-joining player is held at deploy via `holdPlayerAtDeploy` / `applyPlayerDeployAvailability` with `mod.SetRedeployTime(eventPlayer, HUD_WARM_REDEPLOY_BLOCK_SECONDS)` (constant = 60 in `src/interaction/actions.ts`), the long redeploy timer appears to apply to every player in the match, not just the late joiner.
- Additionally, `SetRedeployTime(player, 0)` is used by `beginHqSeatFlow` (HQ on-foot) to bypass the post-death countdown before `DeployPlayer`. It is not empirically verified whether this is a one-shot override consumed by the next redeploy or a persistent value that could give the player instant respawn on their next death.

Candidate experiments (polish phase):
- Remove `SetRedeployTime(HUD_WARM_REDEPLOY_BLOCK_SECONDS)` from `holdPlayerAtDeploy` / `applyPlayerDeployAvailability` and rely solely on `EnablePlayerDeploy(false)` + loading overlay. Confirm on a fresh join whether other players' timers change.
- After HQ seat completes, explicitly restore `SetRedeployTime(player, <prior_value>)` if persistence is confirmed.

Related:
- Memory: `project_respawn_redeploy_timer_polish.md` (holds the three open questions verbatim).
- Phase 6 HQ Deploy on-foot flow depends on `SetRedeployTime(0)`; behavior change here must be regression-tested against HQ flow.

Status: **Open.** Deferred to polish phase per user direction at v1.289 closeout.

## CQ_Polish_Launcher_Ammo_Per_Launcher_Cap
Title: `giveRocketCharge` Consumes a Charge at Max Launcher Ammo

Observed (v1.300):
- Each launcher has a hard in-engine cap on reserve rockets that differs per variant (RPG vs AT4 vs Stinger). `giveRocketCharge` in `src/interaction/ammo-resupply-menu.ts` increments `SetInventoryMagazineAmmo(slot, mag + 1)` (or sets loaded=1 when empty) without knowing the per-launcher cap, so the engine silently clamps the write and the locker's `launch.aC` charge is still consumed.
- Accepted for now: user tolerates the wasted charge and has chosen not to gate the tile on a cap check.

Candidate experiments (polish phase):
- Hardcode per-launcher max-reserve values keyed off the `gadget` id stored in `State.players.lockerSlots[pid]` (the slot holding the launcher).
- Either pre-read `GetInventoryMagazineAmmo` + compare to the cap and refuse (return false → no charge consumed), or render the Launcher Ammo tile as disabled once at cap.
- Verify caps empirically per launcher; engine constants are not exposed via the API.

Related:
- v1.300 authoritative per-player slot state: `src/interaction/ammo-resupply-menu.ts::giveRocketCharge` (uses `slotWithLauncher(slotsState)` to pick the target slot).
- Plan: `C:\Users\Soldat\.claude\plans\sleepy-juggling-thunder.md` (scope explicitly excluded per-launcher caps).

Status: **Open.** Deferred to polish phase per user direction at v1.300 closeout.

## CQ_Refactor_Gadget_Locker_v1.290_to_v1.313
Title: Gadget Locker Authoritative Slot State + Slot-Based Probe + Preference Persistence

Scope:
- `src/interaction/ammo-resupply-menu.ts` (2,504 lines as of v1.313; +496 since v1.221).
- `src/state/runtime-state.ts` added `State.players.lockerSlots` and `State.players.lockerSlotToggle`.

Goal:
- Replace ammo-inference-based launcher detection with an authoritative per-player slot map, supply a per-class slot-toggle control in the menu header, and make the probe safe enough that a destructive by-id `RemoveEquipment` cannot silently delete the player's Supply Crate during a launcher swap.

Timeline:
- v1.290–v1.292: per-launcher team pool config (AT4 3/team, 180s per-charge drip) and duration-label tuning (Artillery 10m, Smoke 7m, Spawn Beacon 15m).
- v1.293–v1.299: snapshot-probe dynamic slot management — dup-prevent, same-slot launcher swap, honest launcher ammo.
- v1.300: authoritative `State.players.lockerSlots[pid]` (g1/g2 with `kind: unknown|empty|launcher|gadget`); probe on open, update on click.
- v1.301–v1.303: ammo-locker retargeting — sweep class-loadout duplicates (C4/Drone) before `AddEquipment`; retarget recon/assault/medic gadget placements to empty sibling slot; re-probe sibling after placement.
- v1.304–v1.305: per-class slot-toggle row under each class header (visual tuning: narrow row, equalized gutters, tiles pushed down 50px).
- v1.306–v1.307: differential-remove probe authoritatively identifies launcher slot; removed dead `ARM_SCHEMA` cache-version field.
- v1.308: **slot-based probe** — `probeLauncherSlot` uses `RemoveEquipment(player, GadgetOne)` + `HasEquipment` diff to identify which gadget was in slot 1, then restores it. Replaces the v1.306 by-id probe that could destroy the wrong gadget.
- v1.309: dropped the by-id defensive sweep in `giveLauncher` — slot-based remove of `targetSlot` is sufficient. Fixes: engineer with Supply Crate slot 1 + Stinger slot 2 clicking AT4 no longer loses the Supply Crate.
- v1.310: narrowed probe candidates to the 4 engineer buckets — launcher variants + AV Mine + EOD Bot + Supply Crate — replacing the 42-entry `GADGET_SLOT_CANDIDATES` with `ENGINEER_GADGET_CANDIDATES`.
- v1.311: **enum-mismatch fix** — added `mod.Gadgets.Deployable_Vehicle_Supply_Crate` to the probe candidates. The engineer default Supply Crate registers as `Deployable_Vehicle_Supply_Crate`, NOT `Class_Supply_Bag`. Without this the v1.310 probe removed the Supply Crate but the diff found no flip and skipped the restore. Captured as durable memory (`project_engineer_supply_crate_enum.md`).
- v1.312: **probe-disambiguation fix** — removed the ambiguous `loaded === 1 → launcher` inference from `probeSlot`. Supply Crate also reports `loaded === 1`, so the old heuristic false-positively marked a Supply Crate slot as "launcher"; `slotWithLauncher` then returned the wrong slot and (a) the slot-toggle was ignored when no launcher was held, and (b) the Launcher Ammo tile became incorrectly enabled. `probeSlot` now reports `kind: "gadget"` for any populated slot without trying to distinguish launcher vs non-launcher.
- v1.313: **toggle preference persistence** — `closeArmMenu` wipes `State.players.lockerSlots[pid]` (probed, re-derivable state) but preserves `State.players.lockerSlotToggle[pid]` (player preference). Default remains slot 2 at round start; once changed, the preference sticks across close/reopen.

Durable lessons:
- Engineer default Supply Crate enum = `Deployable_Vehicle_Supply_Crate` (not `Class_Supply_Bag`).
- `GetInventoryAmmo === 1` is ambiguous across launcher vs Supply Crate; do NOT use it to distinguish slot contents.
- By-id `RemoveEquipment(player, gadget_id)` can destroy the wrong gadget under Portal's current behavior; slot-based `RemoveEquipment(player, InventorySlots.GadgetOne/Two)` is deterministic.
- Probe candidate lists must be validated against the specific engine-registered enum for the class's default loadout, not a nominally similar enum.

Status: **Resolved** at v1.313. Regression surfaces to watch on future playtests:
- Engineer default loadout + click each launcher tile: Supply Crate survives, launcher lands in the toggled slot.
- Engineer with no launcher: toggle honored when giving first launcher; Launcher Ammo tile disabled.
- Engineer with launcher in slot 1 vs slot 2: refill and swap both target the occupied slot.
- Kit pickup of an off-spec gadget: probe still identifies the correct buckets.

Related:
- `CQ_Polish_Launcher_Ammo_Per_Launcher_Cap` (still open; per-launcher reserve cap not consulted in `giveRocketCharge`).
- Memory: `project_engineer_supply_crate_enum.md`.
