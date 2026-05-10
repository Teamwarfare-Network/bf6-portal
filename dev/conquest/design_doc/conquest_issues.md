# Conquest Issues

Last Updated: 2026-05-07 (v1.474)
Last Tested Build: `v1.474` — single-player verified clean for the late-join-during-countdown fix (CQ_Bug_115; removed the per-frame `areAllActivePlayersReady` check from `isPregameCountdownStillValid` so a fresh late-joiner's undefined `readyByPid` no longer cancels the countdown via a bail path that leaks the deploy-disable gate). Plan archive: `design_doc/5.07.26_late_join_during_countdown_fix_plan.md`. Earlier: v1.471 — single-player verified clean for the late-join crash defense bundle (Phase A try/catch + Phase B cache-race close + Phase C team-bind re-read; see #114). Issue housekeeping pass 2026-05-05 retired CQ_Bug_29, CQ_Bug_32, CQ_Bug_33, and CQ_Polish_Respawn_Redeploy_Timer_Audit (design changes since v1.418 made them no longer applicable). CQ_Polish_Jet_Pitch_On_Air_Deploy reaffirmed as Closed-Accepted / known shippable for V1. Earlier history retained: `v1.375` — single-player verified for v1.373 launcher cap + at-cap label, v1.374 GetVehicleFromPlayer error-log cleanup (user-confirmed via error-log inspection at v1.374), and v1.375 Supply Box disabled-focused indicator (user-confirmed via in-menu navigation). MP confirmation pending. Phase 6 HQ Deploy remains functional. Gadget locker rework (v1.290–v1.313) and the v1.339–v1.344 launcher probe + ammo polish stand. Vanilla regression path remains byte-identical to the v1.276 baseline. v1.314 reworks the ready-dialog config column to checkbox seeds (Supply Boxes wired v1.325; Forward Deploy wired v1.328; Air Deploy wired v1.329). v1.333/v1.334 move Forward/Air Deploy vehicle Teleport to post-seat to fix loadout drop. v1.337–v1.338 migrate the match clock to `Clocks.CountDownClock`. v1.358–v1.370 stabilized the boundary architecture (single-zone-state, event-driven seatKind, squad-spawn inheritance, `mod.EnableAreaTrigger` wired). v1.371–v1.372 shipped Tier 1+2 cleanup. v1.373 unified launcher caps to 3 + non-destructive +1-ammo slot probe (#95, #96). v1.374 deleted dead `GetVehicleFromPlayer` cache seed (#93) — completes v1.369 design intent. v1.375 added Supply Box disabled-focused border indicator (#97). Outstanding: late-joiner redeploy-timer investigation deferred to polish phase; #94 `GetInventoryAmmo` error log noted as not-recently-observed (review pending).

**Cross-reference:** for the numbered, named, at-a-glance index of all 105 issues (status table + per-issue executive summary), see [`conquest_issues_summary.md`](./conquest_issues_summary.md). This doc holds the full body — history, investigation notes, timelines. The summary is the authoritative numeric index.

**Architecture note (v1.258–v1.259 rewrite).** The Vanilla vehicle spawner was rewritten around one persistent `VehicleSpawner` per slot, a serial `spawnMutex` dispatching via `ForceVehicleSpawnerSpawn`, event-driven bind via `OnVehicleSpawned`, and `Clocks.CountDownClock`-driven respawn. Files `src/vehicles/deploy-fulfillment.ts`, `src/vehicles/reservations.ts`, and `src/vehicles/spawner-sequence.ts` were deleted. All non-Vanilla deploy paths (legacy air-deploy, forward-deploy, HQ-forward) were removed. Any bug entry below whose root cause lived in those files is flagged **Obsolete (v1.259 rewrite)** — the underlying code no longer exists.

**Phase 6 HQ Deploy (v1.277–v1.289).** A parallel opt-in deploy mode lives in `src/vehicles/hq-deploy.ts`. It is selectable from the ready-dialog `Vehicle Deploy Method` knob (`VANILLA` | `HQ`). HQ mode pads start empty at LIVE; a player-triggered click on a per-slot HQ button (deploy screen or live-terminal) dispatches the slot's spawn and seats the requester via `ForcePlayerToSeat` inside the `OnPlayerDeployed` event (BountyHunter pattern). No auto-respawn in HQ mode.

## Current Snapshot
- `CQ_Bug_1`: Resolved
- `CQ_Bug_2`: Resolved
- `CQ_Bug_3`: **Open — still reproducing at v1.372** (user confirmation 2026-04-25). Phase 10 polish; instrumented team-switch cleanup pending.
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
- `CQ_Bug_17`: Likely resolved — not observed since the v1.328+ Forward/Air Deploy reintroduction refactor (user confirmation 2026-04-25). Needs MP confirmation under load before final close.
- `CQ_Bug_18`: Resolved
- `CQ_Bug_19`: **Not reproducing in v1.372 testing** (user confirmation 2026-04-25). Closing pending re-observation under 64p MP load. The 5–10 min late-match deploy-button-disappear symptom has not recurred since the v1.358–v1.370 boundary architecture stabilization. Re-open if the symptom returns.
- `CQ_Bug_20`: Likely resolved — not observed since the recent ready-dialog refresh fix (user confirmation 2026-04-25). Needs MP confirmation before final close.
- `CQ_Bug_21`: Likely resolved (believed fixed by v1.013 loading gate rearchitecture; needs confirmation)
- `CQ_Bug_22`: Resolved
- `CQ_Bug_23`: Resolved
- `CQ_Bug_24`: Resolved
- `CQ_Bug_25`: Resolved (single-player confirmed v1.064. v1.158 shipped a temporary `FEATURE_WORLD_ICON_DIAG` MP telemetry counter; removed v1.213 after user moved past the world-icon debugging path to smoke-based signalling. Pre-game HQ World Icons continue to render normally — only the diagnostic counter + state fields were removed)
- `CQ_Bug_26`: Likely resolved (believed fixed by vehicle HUD polish passes; needs confirmation)
- `CQ_Bug_27`: Resolved (fixed in vehicle HUD render passes)
- `CQ_Bug_28`: Likely resolved — not observed since the v1.328+ Forward/Air Deploy reintroduction refactor and the v1.333/v1.334 post-seat Teleport pattern (user confirmation 2026-04-25). Needs MP confirmation across all aircraft slots.
- `CQ_Bug_29`: Closed — no longer reproducing (2026-05-05 user direction); retired from active list
- `CQ_Bug_30`: Likely resolved (believed fixed by loading gate rearchitecture and UI cache polish; needs confirmation)
- `CQ_Bug_31`: Likely obsolete (v1.308–v1.313 reworked the gadget locker slot-probe path wholesale; the v1.306 by-id probe that could destroy gadgets has been removed. Deploy path also substantially changed in v1.258–v1.289. Re-observe under v1.313 before acting — original symptom may no longer reproduce.)
- `CQ_Bug_32`: Closed — design change resolved (2026-05-05); the loading-gate rearchitecture (v1.418, Wave 3 Ship 8) eliminated the warm-prime show/hide cycle the flicker was tied to
- `CQ_Bug_33`: Closed — design change resolved (2026-05-05); same root cause as #32, eliminated by v1.418 loading-gate deletion
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
- `CQ_Bug_57`: Resolved (v1.442 — squad-spawn on a teammate inside own HQ flagged the spawning player as out-of-bounds. `tryInheritZonesFromNearbyTeammate` in `boundary/enforcement.ts` was copying 4 zone flags from the teammate but explicitly omitting `inOwnHQ`. When teammate had `inOwnHQ=true` and all-other-flags=false, spawner inherited all-false (no `inOwnHQ` set, no `inGCZ` fallback fired because inheritance returned true) → classifier fired pre-live `prelive_main_base` or live `ground_combat_zone` violation. Fix: one-line addition `state.inOwnHQ = teammateState.inOwnHQ || state.inOwnHQ;` so the spawner inherits the teammate's HQ status if the teammate is at HQ, OR retains the anchor-radius probe result if it had already set it. Squad-spawn on HQ teammate now correctly seeds `inOwnHQ=true`.)
- `CQ_Bug_58`: Resolved (v1.445 — pre-game READY state was getting auto-cleared by gameplay events the user did not intend, specifically (a) every respawn (the engine `OnPlayerDeployed` callback at `player-deploy.ts:42-43` unconditionally cleared `readyByPid`/`readyNeedsReconfirmByPid`) and (b) every pre-live exit from the player's own HQ trigger (the `notePreliveMainBaseViolation` helper in `boundary/enforcement.ts` invoked from `enforcement.ts:330` per-tick refresh and `area-triggers.ts:112` immediate AreaTrigger exit). Fix: deleted the deploy-event clear (Edit 1), removed both `notePreliveMainBaseViolation` callers (Edits 2+3), and deleted the now-unused function definition (Edit 4). Auto-unready triggers reduced to exactly two legitimate cases per L1 of plan: SWAP TEAMS (`swap-action.ts:17`) and admin config change (`mode-config-presets.ts` — `requireReadyReconfirmAfterConfigChange` for non-admin viewers + `forceUnreadyApplierAfterConfirm` for the admin themselves on APPLY). Match-start fresh-cycle reset (`resetReadyStateForAllPlayers`), explicit READY/NOT READY button clicks, and join/leave housekeeping all preserved. Plan archive: `design_doc/5.02.26_conquest_ready_tuning_plan.md`.)
- `CQ_Bug_Loadout_Not_Respected`: **Open — scope confirmed (v1.332 playtest)**. Forward Deploy and Air Deploy do NOT respect the player's loadout (e.g. TOW on AH-6M); HQ Deploy does. Same `ForcePlayerToSeat` call site (`onHqSeatPendingPlayerDeployed`); suspected cause is vehicle position at deploy-time — HQ vehicle sits at `slot.spawnPos` (HQ pad) when `DeployPlayer` + `ForcePlayerToSeat` fire, Forward/Air vehicle has already been Teleported to the forward/air point pre-seat. Engine likely applies vehicle loadout via proximity to the player's deploy origin. Proposed fix (unimplemented): delay the Forward/Air vehicle Teleport until AFTER `ForcePlayerToSeat`, not pre-seat. Risk: Teleport on aircraft with player aboard may strip seating or desync physics — needs probe.
- `CQ_Bug_Air_Deploy_Jet_Position_Regression`: **Open** (v1.331 probe regressed jets — reverted v1.332). v1.331 Phase A probe (skip post-bind Teleport for jets) left jets birthed at the primary spawner's last position rather than `nextAirPos`. Confirms `SetObjectTransform` on a persistent `VehicleSpawner` does not reliably propagate position updates to `ForceVehicleSpawnerSpawn` at altitude — the post-bind `mod.Teleport` is what delivers Air Deploy position for both heli and jet. v1.332 restores the yaw-only Teleport path. Jet pitch (rotPlane.X=-45°) remains lost; sister-spawner plan at `~/.claude/plans/sleepy-juggling-thunder.md` Phase B is the documented path. Phase B depends on the same `SetObjectTransform`-at-altitude hypothesis that just failed for Phase A; deferred until a separate probe verifies sibling-spawner position updates at y≈1000.
- `CQ_Bug_RemoveEquipment_JS_Error`: Likely resolved — not observed since the v1.341 RemoveEquipment `isSlotEmpty` precheck gate (user confirmation 2026-04-25, no recent error-log occurrence). Needs MP confirmation before final close.
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
- `CQ_Bug_Abrams_Substitution_Transport_Slot_Regression`: Likely resolved — not observed since the v1.328+ Forward/Air Deploy reintroduction refactor (user confirmation 2026-04-25). Needs MP confirmation under heli/ground knob-toggle scenarios. Original v1.266–v1.269 fix attempts reverted; v1.271 2s init-wait mitigation remains in place.
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
- `CQ_Polish_Respawn_Redeploy_Timer_Audit`: Closed — design change resolved (2026-05-05). Item (3) was already resolved-by-removal in v1.418 (loading-gate deletion eliminated `holdPlayerAtDeploy` and the `HUD_WARM_REDEPLOY_BLOCK_SECONDS` constant). Items (1) and (2) retired by user direction — the respawn-timer call-site landscape has shifted enough since v1.289 that the original suspicions no longer apply. See memory `project_respawn_redeploy_timer_polish.md` (now stale and pending update).
- `CQ_Feat_ReadyDialog_Config_Checkboxes_UI_Seed`: Resolved for UI-only scope (v1.314 — ready-dialog center column reworked. Configuration header removed; Game Mode stepper moved into the reclaimed header row and relabeled to `Game Mode Configuration:`; Vehicle Deploy stepper removed. Replaced with 5 checkboxes in a left sub-column: Vanilla Deploy, HQ Deploy, Air Deploy (indented), Forward Deploy (indented), Supply Boxes. Vanilla/HQ are a radio pair backed by the existing `vehicleDeployMethod` enum; Air/Forward/SupplyBoxes are new optional booleans (`airDeployEnabled`, `forwardDeployEnabled`, `supplyBoxesEnabled`) on `ReadyDialogModeConfig` that persist through Apply/Reset/preset-apply but are not yet read by any downstream consumer. Clicking Air or Forward while Vanilla is on auto-switches to HQ. Right sub-column reserved empty for future checkboxes. Wiring of Air/Forward into the spawn path and Supply Boxes into the ammo-resupply interactable remains TODO.)
  - v1.328 (Forward Deploy wired): see `CQ_Feat_Forward_Deploy_Reintroduction` below.
  - v1.325 (Supply Boxes wired): the `supplyBoxesEnabled` flag is now read at three call sites in `src/interaction/world-interactables.ts`: (1) VFX spawn loop skips supply-box configs when disabled, (2) `shouldEnableWorldInteractableAuthoredInteractPoint` returns false for supply-box configs when disabled, (3) `shouldAllowWorldInteractableActivationForPlayer` returns `isSupplyBoxesEnabled()` for the `open_ammo_resupply_menu` branch. Apply-time resync `refreshSupplyBoxInteractableStateFromConfirmedConfig()` runs at the tail of `confirmReadyDialogModeConfig` to reconcile already-spawned VFX + InteractPoint state and to force-close any open ammo-resupply menus via `closeArmMenu(pid)` when Supply Boxes flips off. Default remains true. Air Deploy and Forward Deploy wiring are still UI-only and remain TODO. See `design_doc/supply_boxes_wiring_plan_2026-04-19.md` for full rationale.
- `CQ_Feat_SDK_Surrounding_Area_Ground_Vehicles`: Implemented (v1.345 — adopted SDK 1.2.3 `SetVehicleCategoryAllowedInSurroundingArea(Ground_All, false)` to block ground vehicles at the vanilla map-authored Surrounding Area boundary. Call site: `index/game-mode.ts` `onGameModeStartedImpl` after the baseline engine setters, gated by `VEHICLE_SURROUNDING_AREA_GROUND_ALL_BARRED` in `config/conquest-constants.ts`. Script GCZ exemption in `boundary/enforcement.ts::isPlayerGroundCombatZoneExempt` widened from aircraft-only to any seated-vehicle occupant; foot-player GCZ enforcement unchanged. Known geographic asymmetry: tanks are bounded by the vanilla SA polygon (typically larger than our GCZ trigger), foot players remain bounded by the custom GCZ polygon — historical context in archived `TWL_Conquest_Design.md`. Plan archive: `design_doc/ground_vehicle_surrounding_area_plan_2026-04-23.md`.)
- `CQ_Feat_Hybrid_Boundary_Engine_Plus_Custom_OOB`: Implemented (v1.351 — supersedes v1.345 approach. After empirical testing (v1.346–v1.350) showed aircraft kept getting grey-zoned despite various SDK call combinations, the solution was re-authoring the spatial (`MP_TWL_Conquest14_FireStorm.spatial.json`) to let the engine own the CombatArea geometry and reducing the script to Andy's reference pattern: one `SetVehicleCategoryAllowedInSurroundingArea(Air_All, true)` call at round start, custom script OOB only for pre-live main-base (500/501) and live enemy-buffer (502/503) violations. Fully removed: `ground_combat_zone` BoundaryPromptKind, `isPlayerGroundCombatZoneExempt`, `recheckBoundaryAfterAircraftExit`, `inGroundCombatZoneByPid`, `groundCombatZoneTriggerId`/`groundCombatZoneCeilingY` map-config fields, orphan `STR_BOUNDARY_GROUND_COMBAT_ZONE_*` constants. `VEHICLE_SURROUNDING_AREA_GROUND_ALL_BARRED` constant was removed in v1.348. The spatial's `GroundAreaCeilingTrigger` (ObjId 666) remains reserved but unconsumed by script. Plan archive: `design_doc/boundary_hybrid_plan_2026-04-24.md`.)
- `CQ_Feat_Custom_GCZ_Restored`: Implemented (v1.357 — supersedes v1.351 hybrid approach. After v1.354–v1.356 exhaustive SDK Surrounding Area testing (global allow, per-category Air_All/Air_Heli/Air_Plane, per-vehicle for all 10 aircraft `VehicleList` members) failed to exempt aircraft from the engine grey-zone on Conquest14/15 spatials, the SDK route was abandoned. User re-authored the spatial at `MP_TWL_Conquest16_FireStorm.spatial.json` to bind `CombatArea.CombatVolume = AirCombatVolume` (aircraft bound only by the outer air polygon) and retained `GroundAreaTrigger` ObjId 666 for custom script enforcement. Restored: `inGroundCombatZoneByPid` state, trigger-666 enter/exit wiring in `onPlayerEnter/ExitBoundaryAreaTrigger`, `groundCombatZoneTriggerId` map-config field and getter, deploy-default `true` flag init. Added: synchronous `refreshPlayerBoundaryState` call on `onPlayerEnter/ExitVehicleImpl` so GCZ classification flips immediately on seat change. `getDesiredBoundaryViolationKind` now returns `"ground_combat_zone"` when (a) on-foot outside trigger 666, (b) on-foot above Y=200, or (c) in a non-aircraft vehicle outside trigger 666. Aircraft occupants (`isAircraftVehicleInstance`) are exempt. Fully removed: all `Set*AllowedInSurroundingArea` calls from `index/game-mode.ts`. Plan archive: `design_doc/custom_gcz_restore_plan_2026-04-24.md`.)
- `CQ_Feat_Zone_Tracker_Refactor`: Implemented (v1.360 — structural fix for two surviving v1.358–v1.359 bugs: HQ-back-walk (player exits trigger 500/501 toward the back of HQ, away from buffer + GCZ — should be OOB but `inMainBaseByPid` stayed stuck `true`) and bail-from-aircraft (Air-deployed pilot bails outside GCZ — should be OOB but flag stays exempting). Root cause: boundary state spread across five independently-written booleans with multiple writers (`area-triggers.ts` direct write via `IsPlayerInOwnMainBase`, `enforcement.ts` enter/exit branches, `player-deploy.ts::classifyDeployInOwnMainBase` 100m distance-check setter that overrode v1.359's removal of the unconditional `=true` setter). Fix: single `PlayerZoneState` record at `State.round.boundary.zoneStateByPid[pid]` (`inOwnHQ` / `inOwnBuffer` / `inGCZ` / `inEnemyHQ` / `inEnemyBuffer`); single writer `updateZoneStateOnTriggerTransition` that maps any of the five tracked AreaTriggers to exactly one boolean and mirrors `inOwnHQ` to legacy `inMainBaseByPid` for downstream consumers; classifier `getDesiredBoundaryViolationKind` becomes a pure read with no fallback flags or distance checks. Added 1.5s `GCZ_DEPLOY_GRACE_SECONDS` post-deploy grace window via new `deployedAtSecondsByPid` field to cover rare missed enter events. Removed: `inGroundCombatZoneByPid`, `inEnemyMainBaseCoreByPid`, `inEnemyMainBaseBufferByPid`, `classifyDeployInOwnMainBase`, `getEnemyMainBaseTriggerIdForPlayerTeam`/`getEnemyMainBaseBufferTriggerIdForPlayerTeam`, `isPlayerInEnemyProtectedZone`, `isPlayerProtectedByOwnMainBaseState`. Bundle decreased 2,167 bytes vs v1.359. Plan archive: `design_doc/zone_tracker_refactor_plan_2026-04-25.md`.)
- `CQ_Feat_AreaTrigger_Enable`: Implemented (v1.367 — root cause for the v1.358–v1.366 OOB bug class: `mod.EnableAreaTrigger` was never called anywhere in the codebase, and AreaTriggers do not fire `OnPlayerEnter/ExitAreaTrigger` events until explicitly enabled per the SDK doc. Every "main base" signal across all prior versions came from the deploy-time distance probe, NOT from real trigger events. Added `enableBoundaryAreaTriggers()` in `boundary/enforcement.ts` that resolves the five trigger IDs via `mod.GetAreaTrigger` and calls `mod.EnableAreaTrigger(trigger, true)` on each; called from `onGameModeStartedImpl` after `applyMapConfig`. With this in place, HQ-back-walk and other physical-crossing OOB scenarios fire correctly.)
- `CQ_Feat_Squad_Spawn_Zone_Inheritance`: Implemented (v1.370 — closes the last seed gap left open by `CQ_Feat_Event_Driven_Seat_State`. Squad spawn (no slot claim, IsInVehicle probe handles seatKind) previously left zone flags all-false except `inOwnHQ` (anchor probe). A foot squad-spawn deep inside the GCZ would post-grace flag OOB until the player physically crossed a trigger boundary. Fix: at deploy time, find the nearest deployed teammate within `SQUAD_SPAWN_PROXIMITY_RADIUS_METERS = 25` (engine doesn't expose authoritative squad-spawn target — proximity is the proxy); copy `inOwnBuffer`/`inGCZ`/`inEnemyHQ`/`inEnemyBuffer` from their cached state. `inOwnHQ` is NOT inherited — anchor probe owns it (independent reliable signal that may legitimately disagree with a squadmate at the HQ trigger edge). Skip inheritance when the teammate is still inside their own deploy grace window. One-shot at deploy, no per-tick cost. Helpers: `findNearestDeployedTeammatePid`, `tryInheritZonesFromNearbyTeammate`. Plan archive: `design_doc/squad_spawn_zone_inheritance_plan_2026-04-25.md`. Edge cases (squadmate near trigger boundary, inheriting OOB-state from a teammate currently in enemy buffer countdown) accepted and documented in the plan.)
- `CQ_Bug_LateJoin_LiveCrash_v1469` (#114): **Defenses shipped (v1.471), pending MP confirmation.** Silent server crash on fresh 2nd-player late-join during LIVE pre-deploy window. Three bundled defenses: outer try/catch on `OnPlayerJoinGame` async export (S1), pre-await `vehicleDeployTimerCache[pid]` delete to close race against `runRoundStartDelayHudLoop` (S2), post-await idempotent re-read of `perspectiveTeamByPid` if T=0 returned 0 (S3).
- `CQ_Bug_LateJoin_During_Countdown` (#115): **Resolved (v1.474), MP-confirmed at 2 players (2026-05-08).** Late-joiner-undefined-ready-state cancelled countdown via per-frame `areAllActivePlayersReady` check; bail paths didn't restore deploy gate. Fix removed the ready check from countdown validity.
- `CQ_Feat_Event_Driven_Seat_State`: Implemented (v1.369 — structural fix for the v1.367–v1.368 aircraft OOB false-positive bug. After AreaTriggers were enabled in v1.367, ground/foot OOB worked, but aircraft occupants kept getting flagged when flying outside the GCZ. v1.368 attempted a fix by bypassing `safeGetVehicleFromPlayer`'s cache gate and adding a slot-binding fallback for `isAircraftVehicleInstance`; did not work. Root cause matches `CQ_Feat_Zone_Tracker_Refactor` (v1.360): per-tick engine queries (`mod.GetVehicleFromPlayer`, `mod.CompareVehicleName`, `safeGetPlayerVehicleSeat`) are unreliable on this Portal runtime — `safeGetVehicleFromPlayer`'s `posDebugVehicleObjIdByPid` cache lags reality at deploy time (Air Deploy timing race), and `CompareVehicleName` has documented enum-swap reliability gaps (CQ_Bug_43). Fix: add `seatKind: "on_foot" | "ground_vehicle" | "aircraft"` to `PlayerZoneState`, owned exclusively by `setPlayerSeatKind` (called from `onPlayerEnterVehicleImpl`, `onPlayerExitVehicleImpl`, and the deploy-mode seed). Vehicle classification at the event boundary uses `classifyVehicleSeatKind(vehicle)` which looks up `slot.vehicleType` via `vehicleToSlot` and routes to the existing pure-JS `isAircraftVehicleType(enum)` switch — no `mod.CompareVehicleName` calls. The boundary classifier's vehicle block is now a pure read of `state.seatKind`. Non-slot deploys (squad/flag spawn) get a one-shot `mod.GetSoldierState(IsInVehicle)` probe in `seedZoneStateFromSpawnContext` (Andy's reference pattern; reliable). NO per-tick polling — drift after deploy is owned by the OnPlayerEnter/ExitVehicle events. Removed: `isPlayerSeatedInAircraftForBoundary` (v1.368). Plan archive: `design_doc/event_driven_seat_state_plan_2026-04-25.md`. Squad-spawn zone seeding deferred — see plan "Future considerations".)

## CQ_Bug_58
Title: Pre-Game READY State Cleared by Death-Respawn and Leaving-HQ-Pre-Live

Observed:
- Player triple-tap-readies up via the Player Ready Up Panel or full Ready Dialog. UI shows them as READY.
- Player dies (boundary kill, vehicle explosion, suicide, etc.) and respawns. UI now shows them as NOT READY again — they have to re-click READY.
- Or: player walks out of their own HQ trigger pre-live (e.g. to look at a vehicle nearby). The moment they cross the trigger boundary, UI flips them to NOT READY with a "needs reconfirm" warning.
- Both behaviours are user-disruptive — readying up should be a stable commitment that persists through movement and death.

Expected:
- Pre-game READY state should persist through death + respawn and through walking in/out of the main base.
- The ONLY events that should auto-clear READY status are:
  1. Player explicitly clicks SWAP TEAMS (legitimate — new team, fresh confirmation).
  2. Admin changes match configuration (every previously-ready player including the admin themselves on APPLY auto-unreadies so they re-confirm against the new settings).

Root cause analysis:
- Two write sites were responsible:
  - **Site #9** in `src/index/player-deploy.ts:42-43`: `onPlayerDeployedImpl` unconditionally cleared `State.players.readyByPid[pid]` and deleted `State.players.readyNeedsReconfirmByPid[pid]` on every body-into-world event. The engine `OnPlayerDeployed` callback fires not just on initial spawn but on every respawn after death, which is the path users observed as "death unreadies you".
  - **Site #10** in `src/boundary/enforcement.ts:274-286`: `notePreliveMainBaseViolation` set `readyByPid=false` + `readyNeedsReconfirmByPid=true` whenever a player exited their own HQ trigger pre-live. Called from two sites: `enforcement.ts:330` (per-tick boundary-state refresh transition) and `area-triggers.ts:112` (immediate AreaTrigger exit event).
- The function existed because pre-Wave-4 design assumed players who left HQ pre-live were "no longer ready"; that assumption no longer matches user intent.
- `readyNeedsReconfirmByPid` is consumed by `roster-render.ts:217` to drive a "you need to re-confirm" visual state on the ready toggle button. After this fix, that flag is still written by the two admin-config-change paths, so the visual state remains functional for its intended purpose.

Verification path:
- Exhaustive grep for both `readyByPid` and `readyNeedsReconfirmByPid` across `src/` produced a 10-site inventory (full table in plan archive). Sites #1-#8 stay; sites #9 and #10 removed.
- Verified no other call sites of `notePreliveMainBaseViolation` exist; function safely deletable after removing 2 callers.
- Verified match-start lifecycle does NOT force-redeploy already-deployed players (no `OnPlayerDeployed` fires on phase transition), so removing site #9 does not break the bulk reset path at `resetReadyStateForAllPlayers` which handles fresh-cycle resets independently.

Resolution (v1.445):
- 4 edits across 3 files:
  - `src/index/player-deploy.ts:42-43` — deleted 2 lines.
  - `src/index/area-triggers.ts:108-114` + header comment — dropped `notePreliveMainBaseViolation` call + inner `if (!isMatchLive())` wrapper; refresh broadcasts kept (ready dialog still shows IN/NOT IN MAIN BASE indicators on trigger exit).
  - `src/boundary/enforcement.ts:328-331` — dropped `if (nextKind === "prelive_main_base")` block.
  - `src/boundary/enforcement.ts:274-286` — deleted entire `notePreliveMainBaseViolation` function (zero remaining callers; refresh broadcasts inside body were redundant with the now-preserved area-triggers exit broadcast path).
- Plan archive: `design_doc/5.02.26_conquest_ready_tuning_plan.md`.

## CQ_Bug_57
Title: Squad-Spawn on Teammate at HQ Flags Spawner as Out-of-Bounds

Observed:
- Player squad-spawns onto a teammate who is currently inside the team's own main base (HQ) trigger volume.
- Engine fires the boundary-violation prompt on the spawner: "MATCH IS NOT LIVE; RETURN TO YOUR MAIN BASE!" pre-live, or "YOU ARE OUT OF BOUNDS; RETURN NOW!" live.
- Teammate (the spawn target) is correctly inside HQ and not flagged.
- Spawner is also physically at HQ but the boundary classifier disagrees.

Root cause:
- `seedZoneStateFromSpawnContext` ([boundary/enforcement.ts:446](../src/boundary/enforcement.ts#L446)) classifies non-slot deploys (squad/flag spawn) in priority order: anchor-radius probe → teammate inheritance → default-in-bounds fallback (`inGCZ = true`).
- The anchor-radius probe (`isPlayerWithinOwnMainBaseAnchorRadius`) reads `safeGetSoldierStateVector(player, GetPosition)` immediately on `OnPlayerDeployed`. If the engine hasn't settled the spawner's position yet — or if `DEPLOY_MAIN_BASE_RADIUS_METERS` is tighter than the actual HQ trigger volume — this probe returns false even when the player is physically at HQ.
- Control then falls through to `tryInheritZonesFromNearbyTeammate` ([enforcement.ts:516](../src/boundary/enforcement.ts#L516)), which copies the teammate's `inOwnBuffer`, `inGCZ`, `inEnemyHQ`, `inEnemyBuffer` flags but **explicitly omits `inOwnHQ`**.
- When the teammate is `inOwnHQ=true` (and all other flags false because they're at HQ, not in GCZ or buffer), the spawner inherits all-four-false. `state.inOwnHQ` stays false (default).
- Inheritance returns true → the default-in-bounds fallback (`state.inGCZ = true`) is **bypassed**.
- Classifier ([enforcement.ts:223](../src/boundary/enforcement.ts#L223)) sees:
  - Pre-live: `!inOwnHQ` → `prelive_main_base` violation.
  - Live: not `inOwnHQ`, not enemy HQ/buffer, grace expires, on-foot/ground-vehicle, not `inGCZ` + not `inOwnBuffer` → `ground_combat_zone` violation.
- All five trigger types (own HQ, own buffer, GCZ, enemy HQ, enemy buffer) are correctly tracked by `OnPlayerEnterAreaTrigger` / `OnPlayerExitAreaTrigger` after the spawner physically crosses a trigger boundary, but the engine does NOT fire those events on spawn-inside-trigger — so the seed at deploy time is the only mechanism to set initial state for squad/flag spawns.

Expected:
- Spawning on a teammate inside own HQ should result in spawner having `inOwnHQ=true`, no violation.
- Default policy is "in-bounds unless we have proof otherwise" — see comment block at [enforcement.ts:475-484](../src/boundary/enforcement.ts#L475).

Fix:
- One-line addition to `tryInheritZonesFromNearbyTeammate`:
  ```ts
  state.inOwnHQ = teammateState.inOwnHQ || state.inOwnHQ;
  ```
- Inherits `inOwnHQ=true` when the teammate is at HQ. Preserves any earlier-set true value from the anchor-radius probe (the `|| state.inOwnHQ` keeps prior-true intact even if teammate happens to be false).
- Edge case: 25m squad-spawn proximity radius means a teammate just inside HQ could give the spawner `inOwnHQ=true` even if the spawner lands just outside the trigger. The trigger-exit event on the next physical movement out of HQ will correctly flip the flag back to false. Acceptable trade — better than the current always-flag-as-violation outcome.

Status:
- Resolved (v1.442). Boundary inheritance now propagates `inOwnHQ` from the squad-spawn target.

Related:
- `CQ_Feat_Event_Driven_Seat_State` (v1.369): same family of bugs — engine doesn't fire trigger-enter on spawn-inside-trigger, so the deploy-time seed is the sole authority for initial zone state.
- `design_doc/squad_spawn_zone_inheritance_plan_2026-04-25.md` (referenced in the inheritance function comment): original design that introduced the inheritance path. Did not include `inOwnHQ` per its scope ("non-HQ zone flags"), but the at-HQ case wasn't validated against the pre-live + live classifier behavior.

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

v1.418 update (Wave 3 Ship 8): the v1.104 fix mechanism (`_prebuildBusy` lock + `prebuildAllUiFamiliesHidden` + `_prebuildStaggerIndex`) was deleted along with the loading-gate machinery. The ORIGINAL scenario (3 players synchronously running `prebuildAllUiFamiliesHidden` in one frame) no longer exists — there is no `prebuildAllUiFamiliesHidden`. Lazy-build surfaces still build synchronously per-trigger, and `LazyBuildPacer` (v1.409 Ship 1) provides a global heavy-build mutex that serializes contending lazy builds in the same frame; but the failure mode (3+ simultaneous heavy synchronous builds in one frame) has not been re-stressed at 24+ players post-Ship-8. Reopen if frame-budget breaches recur.

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
- **Closed — design change resolved (2026-05-05).** The loading-gate rearchitecture in v1.418 (Wave 3 Ship 8) deleted the loading-gate machinery entirely along with the warm-prime show/hide cycle this flicker was tied to. With the gate gone, there is no overlay-vs-warm-prime race to lose. Retired from the active list. Reopen if a team-swap visual flicker resurfaces in MP playtest.

Related:
- CQ_Bug_32 (same underlying timing issue, also closed)
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
- **Closed — design change resolved (2026-05-05).** The loading-gate rearchitecture in v1.418 (Wave 3 Ship 8) deleted the entire loading-gate machinery — the warm-prime show/hide cycle that produced the flicker no longer exists. UI surfaces now build via `triggerLazyBuild` only when used (Wave 3 lazy-build dispatcher), so there is no first-join "ready dialog briefly visible before overlay composites" path to flicker on. Retired from the active list. Reopen if a similar visual artifact resurfaces in MP playtest.

Related:
- CQ_Bug_33 (same underlying timing issue, also closed)
- CQ_Bug_30 (parent issue for first-use menu creation hitching and loading gate lifecycle)
- Design doc: loading gate "build -> refresh hidden/content-only -> reveal once" contract — superseded by lazy-build dispatcher

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
- **Closed — no longer reproducing (2026-05-05, user direction).** Retired from the active list. The original suspicion was never tied to a clean repro and the broader v1.358–v1.470 architecture passes (boundary rewrite, lazy-build dispatch, dirty-flag combat HUD, tick-context AllPlayers cache) substantially reshaped the per-tick cost surface that any live-teleport hitch would have shown up against. Reopen if a teleport-induced hitch surfaces in MP playtest.

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
  - Hard-cut replacement plan is preserved in archived `reference_design_documentation/archive/TWL_Conquest_Design.md` (Phase 3 HUD/UI reference + Phase 3C cleanup closeout) with:
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
  - The v1.121 1-second live-tick re-assertion at `onLiveTick` (capture-tickets.ts), which only runs during `isMatchLive() && !victoryDialogActive` — pre-live was completely uncovered.

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
- `markHudDirty()` set a `hudDirty` flag but `twlConquestHudTickFrame` ignored it entirely, re-rendering the full combat HUD on every tick. This was the single largest per-tick CPU regression item identified in the optimization analysis (Category 4 Item 2), estimated to waste 70-80% of HUD render work.

Resolution (v1.221):
- `updateConquestCombatHudForAllPlayers` is now gated on `State.conquest.debug.hudDirty || force`.
- Derived top-HUD slices (clock view model) and `twlConquestHudTickAnimation` remain unconditional because they are time-variant.
- AGENTS.md gained a "Combat HUD Dirty-Flag Contract" section enumerating 9 state fields that must call `markHudDirty()` on mutation; this is the enforcement mechanism to prevent silent regressions where a state change skips the dirty mark.

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

Latest findings (2026-04-21):
- Merged scope for the v1.338+ polish pass now includes three respawn-timer tweaks raised by the user:
  1. Respawn time after a normal death.
  2. Respawn time after an HQ deploy seat (whether the `SetRedeployTime(0)` override leaks into the next life).
  3. Respawn timing during a live-connection / late-join transition (the `HUD_WARM_REDEPLOY_BLOCK_SECONDS` suspected-global behavior above).
- All three need MP playtest evidence before the fix direction is chosen. Treat them as one investigation bucket — they share the same `SetRedeployTime` call-site cluster in `src/interaction/actions.ts` and `src/vehicles/hq-deploy.ts`.

Status update (2026-04-25, v1.376): user reaffirmed all three scope items remain on the punch list. Investigation still pending MP repro / `FEATURE_PERF_DIAG=true` playtest data.

Status update (2026-05-01, v1.418, Wave 3 Ship 8): scope item (3) — `holdPlayerAtDeploy` global-application concern — is **resolved-by-removal**. The function `holdPlayerAtDeploy` and the `HUD_WARM_REDEPLOY_BLOCK_SECONDS` constant were both deleted along with the loading-gate machinery.

Status update (2026-05-05, v1.471): **Closed — design change resolved (user direction).** Items (1) and (2) retired from the active list. The respawn-timer call-site landscape has shifted enough since v1.289 (loading-gate deletion v1.418, HQ Deploy maturation across v1.281–v1.289, vehicle-deploy block-engine-deploy fix v1.466) that the original suspicions about global-application and `SetRedeployTime(0)` persistence no longer apply against the current code shape. Reopen if a respawn-timer anomaly is observed in MP playtest. Memory `project_respawn_redeploy_timer_polish.md` is now stale and should be retired.

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
- `CQ_Bug_Launcher_Slot2_Double_Give` (#90) — the adjacent launcher-slot regression captured 2026-04-21.

Status: **Resolved (superseded by v1.373; closure user-confirmed 2026-05-03).** The original "charge consumed at silent cap clamp" failure mode no longer fires:
- v1.373 introduced a uniform 3-rocket cap across all launchers (`maxAmmo: 3` on RPG / AT4 / Stinger in `DEFAULT_GADGET_LOCKER_CONFIG`), eliminating the per-variant cap divergence that produced silent clamps.
- The Launcher Ammo tile now disables (renders "FULL" in gray) once the launcher is at cap — `atCap === true` gates `ammoEnabled` to false so charges are never consumed against a clamped write.
- v1.343 read-back-verify continues to refund a charge if the engine ever silently no-ops a write.
- v1.373's +1-ammo non-destructive probe (#96) replaced the destructive launcher-slot identification path, fixing the AT4 second-slot ammo gap noted in the original "Latest findings" below.

Historical findings (2026-04-21, retained for archive):
- The original "Launcher Ammo tile not giving second-slot ammo on AT4" observation traced to two possibilities. Both were closed by v1.373:
  1. `slotWithLauncher` returning the wrong slot — addressed by the +1-ammo non-destructive probe in #96.
  2. Engine cap clamp landing before the increment — addressed by the uniform 3-cap + `atCap` tile-disable gate in #95.

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

## CQ_Feat_Forward_Deploy_Reintroduction (v1.328)
Title: Reintroduce Forward Deploy on the v1.258 vehicle infra

Context:
- Forward Deploy existed in the v1.200-series (pre-v1.259) but was deleted wholesale in the vehicle-infra rewrite. The old path (`deploy-fulfillment.ts`, `reservations.ts`, `spawner-sequence.ts`) had accumulated too many race guards (CQ_Bug_39/49/52/54/55 + `CQ_Bug_ActiveSpawnSingletonMPRace`).
- HQ Deploy has been stable on the new single-spawner-per-slot infra since v1.277–v1.289. v1.314 added the `forwardDeployEnabled` checkbox to the ready-dialog (UI-only seed; no runtime consumers). v1.325–v1.327 shipped Supply Boxes on the same checkbox pattern. v1.328 wires the Forward Deploy checkbox into the spawn path.

Design (fresh-build, no code ported from `reference_conquest_attempt_b` or any pre-v1.259 file):
- Forward Deploy reuses the existing `slot.spawner` via `mod.SetObjectTransform` — one persistent spawner per slot, relocated to the forward point at dispatch time and restored to `slot.spawnPos` post-seat. Keeps the persistent `VehicleSpawner` count at today's ~28–32 baseline; no per-slot second spawner. A 40-spawner budget audit (`auditSpawnerBudgetAtRoundStart` in `src/vehicles/spawner-budget.ts`) warns if the count ever drifts to the threshold.
- New `src/vehicles/forward-spawn-volume.ts` supplies pure sampling helpers: triangle-split + barycentric sample of a 4-corner quad in X/Z, weighted by triangle area. Re-reads the already-authored `team{N}TankSpawnVolumes` via `getVehicleSpawnVolumesForTeam(teamId, "tank")`; no new map-config type.
- `VehicleSpawnerSlot` extended with `nextForwardPos` / `nextForwardRot` fields. Seeded by `seedNextForwardTransformForSlot` at slot init (`addVanillaSpawnerSlot`) and at countdown-reset (`resetVehicleSlotsAtCountdownStart`) — so the first forward click of a round is as instant as HQ: one `SetObjectTransform` + `ForceVehicleSpawnerSpawn`.
- New `requestForwardVehicleSpawn` in `src/vehicles/hq-deploy.ts` mirrors `requestHqVehicleSpawn` validation, rejects aircraft slots + missing-volume cases, flags the slot with `pendingSpawnMode = "forward"`, and dispatches through the same serial `spawnMutex`.
- Dispatch branch in `forceSpawnAndAwaitBind` (`src/vehicles/vanilla-spawner.ts`) relocates `slot.spawner` to `nextForwardPos`/`Rot` before `ForceVehicleSpawnerSpawn` when `pendingSpawnMode === "forward"`. `doDispatch`'s post-bind Teleport uses the forward point instead of `slot.spawnPos` for forward dispatches.
- Post-seat hook `onForwardSpawnSuccess` (called from `onHqSeatPendingPlayerDeployed` and from the claim-timeout cleanup in `scheduleHqClaimTimeout`): restores `slot.spawner` to `slot.spawnPos` via `SetObjectTransform` + re-seeds the next forward point. Ordering — relocate-back happens *after* seat completes — preserves a safety margin against the pre-v1.259 "engine snaps vehicle back to spawner" behavior; if that behavior reappears, a fresh per-slot suppress flag gets added at that point (not ported from the old flag).
- UI: `deploy-timer-ui.ts` re-gates `forwardDeployAllowed` on `confirmedMethod >= HQ && forwardDeployEnabled === true`. The spawn-button click ("air" widget id) routes to `requestForwardVehicleSpawn` when the slot is non-aircraft, or `requestHqVehicleSpawn` otherwise. Pregame-countdown delay line at `src/ready-dialog/countdown-flow.ts:106` now gates on the checkbox instead of the legacy `HQ_FORWARD` enum tier.

Lessons carried forward from the deleted v1.200-series implementation (as constraints, not source):
- Never `mod.SpawnObject(RuntimeSpawn_Common.VehicleSpawner, ...)` per click — caused CQ_Bug_49 / CQ_Bug_54 / CQ_Bug_ActiveSpawnSingletonMPRace.
- Never globally track "the currently spawning slot" — per-slot `pendingSpawnMode` / `pendingSpawnOwnerPid` are the discipline.
- Never `mod.Teleport` a player before `ForcePlayerToSeat` — broke in v1.106–v1.108 and v1.151–v1.154.
- Spawner count growth is a perf concern (memory: `project_*_spawner_budget`); new designs must pool, not multiply.

Files touched:
- `src/vehicles/forward-spawn-volume.ts` — new, sampling helpers.
- `src/vehicles/spawner-budget.ts` — new, 40-spawner audit.
- `src/state/runtime-types.ts` — `nextForwardPos` / `nextForwardRot` on `VehicleSpawnerSlot`.
- `src/vehicles/vanilla-spawner.ts` — seed-on-init, seed-on-countdown-reset, relocate-dispatch branch, budget audit call.
- `src/vehicles/hq-deploy.ts` — `isForwardDeployEnabled`, `requestForwardVehicleSpawn`, `onForwardSpawnSuccess`, seat-path and timeout-path hooks.
- `src/vehicles/deploy-timer-ui.ts` — checkbox-based `forwardDeployAllowed`, click-router branch for non-aircraft rows.
- `src/ready-dialog/countdown-flow.ts` — pregame-delay line gated on checkbox.
- `src/index.ts` — register the two new modules.
- `design_doc/forward_deploy_wiring_plan_2026-04-19.md` — historical copy of the approved plan.

Status: **Resolved** at v1.328 (pending playtest). Verification matrix is in the plan doc.

Related:
- Memory: `feedback_plans_are_not_instructions_to_execute.md` (plan approval gate).
- `CQ_Feat_ReadyDialog_Config_Checkboxes_UI_Seed` (v1.314 introduced the checkbox; this wires it).
- `CQ_Feat_Phase6_HQ_Deploy` (v1.277–v1.289 — the infra this rides on).

## CQ_Feat_Air_Deploy_Reintroduction (v1.329)
Title: Reintroduce Air Deploy on the v1.258 vehicle infra

Context:
- Air Deploy existed in the pre-v1.259 vehicle stack and was deleted wholesale in the rewrite; `CQ_Bug_53` captures the old path's end-of-life. Since v1.328 shipped Forward Deploy as a checkbox-gated sibling of HQ Deploy, Air Deploy is the near-mechanical mirror for aircraft slots: same single-spawner reuse, same serial dispatch, same bind path, same request-only respawn contract. The `airDeployEnabled` checkbox has lived in `modeConfig` / `modeConfig.confirmed` since v1.314 (UI-only); this pass wires it into the spawn path.

Design (fresh-build, no code ported from `reference_conquest_attempt_b` or any pre-v1.259 file — altitude semantics mirror `reference_conquest_attempt_b/src/vehicles/spawner-bind.ts:96-114` in behavior only):
- New `src/vehicles/air-spawn-volume.ts` supplies pure sampling helpers against the existing `team{N}AircraftSpawnVolumes` via `getVehicleSpawnVolumesForTeam(teamId, "aircraft")`. Floor X/Z come from a triangle-split + barycentric sample of the authored quad (weighted by surface area across multiple enabled volumes); altitude is additive on top of the floor Y: jets sample uniformly in `[floorY + jetSpawnFloor, floorY + jetSpawnCeiling]`, helis sample uniformly in `[floorY, floorY + heliSpawnCeiling]`. Rotation: jets use `volume.rotPlane` (X/Y/Z — pitch preserved); helis use `volume.rotHeli`. Both fall back to zero vector if unset.
- `VehicleSpawnerSlot` extended with `nextAirPos` / `nextAirRot` fields. Seeded by `seedNextAirTransformForSlot` at slot init (`addVanillaSpawnerSlot`) and at countdown-reset (`resetVehicleSlotsAtCountdownStart`) — no-op for non-aircraft slots and for maps without an authored aircraft volume.
- New `requestAirVehicleSpawn` in `src/vehicles/hq-deploy.ts` mirrors `requestForwardVehicleSpawn`: same cooldown / claim-in-flight / team / slot-disabled / occupancy / busy / respawn-cooldown guards, plus `isAircraftVehicleType(slot.vehicleType)` and `slot.nextAirPos` presence checks. Flags the slot with `pendingSpawnMode = "air"` and dispatches through the same serial `spawnMutex`. Gates on `isHqDeployMode()` + `isAirDeployEnabled()` + `!isRoundStartAirDeployDelayActive()` + `!isRoundStartAirDelayActive()`.
- Dispatch branch in `forceSpawnAndAwaitBind` (`src/vehicles/vanilla-spawner.ts`) relocates `slot.spawner` to `nextAirPos` / `nextAirRot` via `SetObjectTransform` before `ForceVehicleSpawnerSpawn` when `pendingSpawnMode === "air"`. `doDispatch`'s post-bind placement uses `mod.SetObjectTransform(vehicle, CreateTransform(nextAirPos, nextAirRot))` — not the yaw-only `mod.Teleport` used for ground/forward — so the jet's authored pitch (e.g. Firestorm `rotPlane.X = -45°`) survives the post-bind correction.
- Post-seat hook `onAirSpawnSuccess` (called from `onHqSeatPendingPlayerDeployed` and from the claim-timeout cleanup in `scheduleHqClaimTimeout`): restores `slot.spawner` to `slot.spawnPos` via `SetObjectTransform` + re-seeds the next air point. Same ordering rationale as forward: relocate-back happens after seat completes.
- UI: `deploy-timer-ui.ts` re-gates `airDeployAllowed` on `hqDeployAllowed && airDeployEnabled === true` (replacing the legacy `confirmedMethod === HQ_FORWARD_AIR` check), plus a new `hasEnabledAircraftSpawnVolumesForTeam(teamId)` volume-presence gate paralleling the tank one. The spawn-button click router now resolves three cases: aircraft rows → `requestAirVehicleSpawn`, non-aircraft forward-eligible rows → `requestForwardVehicleSpawn`, else → `requestHqVehicleSpawn`.
- Pregame-countdown delay line in `src/ready-dialog/countdown-flow.ts` now gates the air-delay text (line 1) on the checkbox instead of the legacy `HQ_FORWARD_AIR` enum tier.
- Spawner count: zero new persistent spawners. Relocate-in-place on the existing `slot.spawner`. `auditSpawnerBudgetAtRoundStart` unchanged; count remains at today's ~28–32 baseline; 40-spawner warn threshold intact.

Lessons carried forward (banned patterns — same as Forward Deploy):
- Never `mod.SpawnObject(RuntimeSpawn_Common.VehicleSpawner, ...)` per click.
- Never globally track "the currently spawning slot".
- Never `mod.Teleport` a player before `ForcePlayerToSeat`.
- If post-bind snap-to-spawner behavior reappears on occupied aircraft, add a fresh per-slot suppress flag against the current bind path — do not port old code.

Files touched:
- `src/vehicles/air-spawn-volume.ts` — new, sampling helpers (triangle + altitude math, jet-vs-heli rotation).
- `src/state/runtime-types.ts` — `nextAirPos` / `nextAirRot` on `VehicleSpawnerSlot`.
- `src/vehicles/vanilla-spawner.ts` — air-branch seed on slot init + countdown reset; air-branch `SetObjectTransform` on spawner (pre-spawn) and on vehicle (post-bind).
- `src/vehicles/hq-deploy.ts` — `isAirDeployEnabled`, `requestAirVehicleSpawn`, `onAirSpawnSuccess`; seat-path and timeout-path 3-way branches (`wasAir` / `wasForward` / neither).
- `src/vehicles/deploy-timer-ui.ts` — checkbox-based `airDeployAllowed`, `hasEnabledAircraftSpawnVolumesForTeam`, click-router aircraft branch.
- `src/ready-dialog/countdown-flow.ts` — pregame delay line (air) gated on checkbox.
- `src/index.ts` — register the new module.

Status: **Resolved** at v1.329 (pending playtest). Verification matrix is in the plan doc at `~/.claude/plans/sleepy-juggling-thunder.md`.

Related:
- `CQ_Feat_Forward_Deploy_Reintroduction` (v1.328 — direct template).
- `CQ_Feat_ReadyDialog_Config_Checkboxes_UI_Seed` (v1.314 introduced the checkbox).
- `CQ_Feat_Phase6_HQ_Deploy` (v1.277–v1.289 — the infra this rides on).
- `CQ_Bug_53` (historical air-deploy path, obsolete by v1.259 rewrite).

## CQ_Bug_Loadout_Not_Respected
Title: Player's chosen loadout not always applied on deploy

Observed:
- v1.328 playtest: reported anecdotally, intermittent.
- v1.332 playtest (controlled): the player's **vehicle loadout** (e.g. TOW on AH-6M) is dropped on **Forward Deploy** and **Air Deploy**. **HQ Deploy respects it.** All three paths route through `onHqSeatPendingPlayerDeployed` → `mod.ForcePlayerToSeat(player, vehicle, -1)`, so the seat API itself is not the differentiator.

Root cause (inferred):
- HQ Deploy vehicle sits at `slot.spawnPos` when `DeployPlayer` fires. Forward / Air Deploy vehicles had already been `mod.Teleport`-ed to the forward/air target **pre-seat** in `doDispatch`. That pre-seat Teleport inside the bind → DeployPlayer → seat window is what broke loadout application.
- Mechanism indistinguishable from script (position gate, timing, or engine handle invalidation on Teleport — see `design_doc/air_deploy_jet_pitch_investigation_2026-04-20.md` for the four candidate hypotheses). Fix targets all of them by removing the pre-seat Teleport.

Resolution:
- **v1.333 (Phase 2a):** Forward Deploy vehicle Teleport moved from pre-seat (`doDispatch`) to post-seat (`onHqSeatPendingPlayerDeployed`, after `ForcePlayerToSeat`). Forward target is captured into locals **before** `onForwardSpawnSuccess` re-seeds `nextForwardPos/Rot` for the next click. **Playtest confirmed working by user (2026-04-20).**
- **v1.334 (Phase 2b):** Air Deploy mirror of Phase 2a. Same capture-before-success-hook pattern; symmetric post-seat `mod.Teleport(vehicle, nextAirPos, yawRad + offset)`. **User reported: "air deploy loadout on choppers is not respected" — v1.334 is the fix probe. Playtest verification pending.**

Validated side-effects of the post-seat Teleport:
- **Seated player travels with the vehicle.** User playtest confirmation: "all seatings always occur in all instances in testing" — the primary risk flagged in the plan (`~/.claude/plans/sleepy-juggling-thunder.md`) that `mod.Teleport(vehicle, ...)` would strip the occupant did **not** manifest on Phase 2a. Phase 2b inherits that validation for helis; jet altitude teleport with occupant is the remaining empirical gap.
- No visible pop observed on the 0.5s HQ-pad occupancy window (the player is in the deploy UI, not the 3D world, during that window).

Files touched:
- `src/vehicles/vanilla-spawner.ts` — `doDispatch`: `pendingSpawnMode === "forward"` and `"air"` branches early-return (skip pre-seat Teleport). Ground default branch unchanged.
- `src/vehicles/hq-deploy.ts` — `onHqSeatPendingPlayerDeployed`: snapshot `forwardTargetPos/Rot` + `airTargetPos/Rot` before success hooks; post-`ForcePlayerToSeat` Teleport to captured target.

Status: **Forward Deploy resolved at v1.333 (user-confirmed). Air Deploy resolved at v1.334, pending playtest.** If v1.334 fails, the fallback is to accept loadout drop on Air Deploy; the alternative architecture (spawn vehicle at HQ, seat, then relocate vehicle) would need a different Teleport-carries-occupant property we cannot currently probe.

Related:
- `CQ_Feat_Forward_Deploy_Reintroduction` (v1.328), `CQ_Feat_Air_Deploy_Reintroduction` (v1.329).
- `CQ_Bug_Air_Deploy_Jet_Position_Regression` (v1.331).
- `design_doc/air_deploy_jet_pitch_investigation_2026-04-20.md` — historical four-hypothesis record.

## CQ_Bug_Air_Deploy_Jet_Position_Regression (v1.331)
Title: v1.331 Phase A probe regressed jets — they stayed at HQ instead of reaching the sampled sky point

Context:
- v1.329 shipped Air Deploy using `mod.SetObjectTransform(vehicle, ...)` post-bind to preserve jet pitch (`rotPlane.X = -45°` on Firestorm). Regression: vehicles landed near HQ with engine-default rotation — `SetObjectTransform` is a no-op on `Vehicle` objects on the current engine build.
- v1.330 reverted to the Forward-Deploy heli-equivalent path: yaw-only `mod.Teleport(vehicle, nextAirPos, yawRad)` post-bind. Position + yaw correct for both jets and helis; jet pitch discarded (pilots pitch manually after seat).
- v1.331 Phase A probe: skip the post-bind Teleport for jets on the theory that the pre-spawn `SetObjectTransform(spawner, nextAirPos)` might propagate rotation at birth time. **Regression: jets birthed at the spawner's last authoritative position (HQ), not at `nextAirPos`.** Confirmed empirically that `SetObjectTransform` on a persistent `VehicleSpawner` does not reliably propagate position updates to `ForceVehicleSpawnerSpawn` at altitude. The post-bind `mod.Teleport` is load-bearing for Air Deploy position delivery.

Resolution:
- **v1.332:** Reverted v1.331 probe. Jets back on the heli-equivalent path (yaw-only post-bind Teleport). Position + yaw correct; pitch lost.

Files touched (v1.331 → v1.332 revert):
- `src/vehicles/vanilla-spawner.ts` — removed the jet-branch early-return in `doDispatch`; reinstated the yaw-only `mod.Teleport` for aircraft.

Status: **Resolved at v1.332 by revert.** Jet pitch on Air Deploy remains an **open polish item** — see `CQ_Polish_Jet_Pitch_On_Air_Deploy` below.

Related:
- `CQ_Feat_Air_Deploy_Reintroduction` (v1.329).
- `design_doc/air_deploy_jet_pitch_investigation_2026-04-20.md` — durable lessons on `SetObjectTransform` no-op on Vehicle, spawner-relocate non-propagation at altitude, and `mod.Teleport` having no pitch/roll signature.

## CQ_Polish_Jet_Pitch_On_Air_Deploy
Title: Jet pitch (`rotPlane.X`) lost on Air Deploy — pilot must pitch down manually after seat

Scope:
- Air Deploy spawns jets with engine-default pitch (flat) regardless of the authored `volume.rotPlane.X`. Yaw is preserved via the post-bind `mod.Teleport`; pitch has no argument in `mod.Teleport` and `mod.SetObjectTransform` is a no-op on `Vehicle`.
- Sister-spawner plan (per-jet-slot sibling `VehicleSpawner` born with `rotPlane`, relocated per click) was deferred in v1.332: its core assumption is spawner-relocate propagates at altitude, which v1.331 disproved for position. Reviving the plan requires a **narrow probe**: create a runtime `VehicleSpawner` at ground level with non-zero pitch, fire `ForceVehicleSpawnerSpawn` without relocation, observe whether the birthed vehicle inherits the pitch. If yes, the sibling pattern's upper bound is "pitched vehicle at HQ pad" — still a net loss without position. If no, birth-rotation is engine-determined and the sibling pattern cannot help.

Status: **Closed — Accepted / Known Shippable (reaffirmed 2026-05-05).** Jet pitch loss on Air Deploy is accepted as-is for V1 — pilots pitch manually after seat. The sister-spawner workaround is not pursued. Documented as a **known V1 limitation, shippable as-is**. Reopen only if a future engine update exposes a pitch-aware Teleport signature for `Vehicle` objects. Original close: 2026-05-03 user direction.

## CQ_Bug_RemoveEquipment_JS_Error
Title: `mod.RemoveEquipment` JS error log — scope and repro unconfirmed

Status: **Open, polish-phase.** Needs controlled repro. Out of scope for the MP playtest; logged for the polish pass.

## v1.333 / v1.334 / MP Playtest Readiness Summary

Consolidated status for the MP playtest window (2026-04-22):

- **v1.333** — Forward Deploy loadout fix (Phase 2a). User-confirmed working.
- **v1.334** — Air Deploy loadout fix (Phase 2b). Pending playtest on helis (reported broken in user testing before v1.334) and jets.
- Bundle: **1,023,477 bytes** at v1.334 / **25,099 bytes headroom (2.39%)** under the 1,048,576 cap. Trend: up (+55K vs v1.289 baseline 968,479) across v1.290–v1.334 feature arc (gadget locker refactor, Forward Deploy, Air Deploy).
- Admin panel re-enable blocked: flipping `FEATURE_ADMIN_PANEL=true` produces a **1,052,112 byte** bundle (+28,635 bytes delta), exceeding the cap by **3,536 bytes**. Verification fails. Re-enable requires ~3.5K of offsetting cuts before the playtest; see `design_doc/conquest_optimization_analysis.md` for dead-code candidates.

Open non-polish bugs carrying into the playtest:
- `CQ_Bug_Loadout_Not_Respected` — Air Deploy half pending v1.334 playtest.
- `CQ_Bug_Abrams_Substitution_Transport_Slot_Regression` — Open; transport-slot wrong-vehicle on heli/ground knob toggle. No repro steps recently refreshed.
- `CQ_Polish_Respawn_Redeploy_Timer_Audit` — `SetRedeployTime` may apply globally to late joiners; `SetRedeployTime(0)` persistence not empirically verified. Could affect perceived deploy UX under 64-player churn.

Known polish-phase items (do not block playtest but should be logged):
- `CQ_Polish_Jet_Pitch_On_Air_Deploy`
- `CQ_Polish_Launcher_Ammo_Per_Launcher_Cap`
- `CQ_Bug_RemoveEquipment_JS_Error`

## CQ_Feat_Victory_Screen_Unify_Settings (#86)
Title: Unify Victory screen XvY settings across all presets/surfaces

Observed (2026-04-21):
- The Victory screen (end-of-round summary) and the various XvY preset surfaces (ready-dialog, admin panel, HQ terminal) carry divergent copies of the same "matchup size" configuration. Changes in one place do not reliably reflect in the others.

Intent:
- Consolidate to a single source of truth for the XvY selection so the Victory screen, ready-dialog preset picker, and any admin-side surfaces all render from the same value.

Status: **Open — Low-impact (2026-05-03 reclassification).** Cosmetic only — divergent copies do not affect gameplay or match outcome, just inconsistent UI display. Dropped from the player-facing known-issues list as low player impact; remains Open internally for the polish phase. Originally scoped at v1.338, reaffirmed on punch list 2026-04-25 (v1.376).

## CQ_Bug_Border_OutOfBounds_Rework (#87)
Title: Border bug rework + out-of-bounds handling aligned with new Godot settings

Observed (2026-04-21):
- Border-enforcement logic and out-of-bounds kill-volume behavior need a rework to align with the new Godot map-authoring settings. Current script-side boundary logic is tuned to the pre-Godot-refresh map geometry.

Resolution (2026-04-25):
- User confirmed the boundary rework was completed across the v1.358–v1.370 architecture pass: `CQ_Feat_Custom_GCZ_Restored` (v1.357), `CQ_Feat_Zone_Tracker_Refactor` (v1.360), `CQ_Feat_AreaTrigger_Enable` (v1.367), `CQ_Feat_Event_Driven_Seat_State` (v1.369), and `CQ_Feat_Squad_Spawn_Zone_Inheritance` (v1.370). Map-side spatial was re-authored at `MP_TWL_Conquest16_FireStorm.spatial.json` to bind aircraft to the outer air polygon while retaining trigger 666 for ground/foot enforcement.

Status: **Resolved (v1.370).** Boundary architecture is event-driven and event-stable. Re-tuning was effectively the boundary architecture pass; no separate "boundary geometry refresh" plan needed.

Related:
- `CQ_Feat_Zone_Tracker_Refactor` (v1.360) — single PlayerZoneState owner.
- `CQ_Feat_AreaTrigger_Enable` (v1.367) — explained the missing-events root cause.
- `CQ_Feat_Event_Driven_Seat_State` (v1.369) — fixed aircraft OOB false-positives.

## CQ_Bug_Oil_Tanker_In_Ground_B (#88)
Title: Oil tanker at flag B clips into the ground

Observed (2026-04-21):
- The authored oil-tanker prop at flag B sits partially sunk into the terrain on the current Godot build.

Resolution path:
- Map-side fix: reposition the oil tanker in Godot. Not a code issue; no script change required.

Status: **Resolved (v1.379, user-confirmed 2026-04-26 + closure reaffirmed 2026-05-03).** Map-side Godot fix applied — oil tanker repositioned out of the terrain at flag B. No code change required.

## CQ_Polish_Vehicle_Spawn_Messaging_To_Admin_Panel (#89)
Title: Relegate "Vehicle spawned at X/Z" world-log messaging to admin-panel

Observed (2026-04-21):
- The "Vehicle spawned at X/Z" diagnostic toasts / world-log lines fire during normal play. Noise level is fine in SP / small-scale testing but will spam a 64-player playtest.

Intent:
- Gate the messaging behind an admin-panel button/toggle so it stays available for diagnostics (the info is genuinely useful when debugging spawn-transform regressions like #82) but does not emit during normal play.

Resolution shipped at v1.380:
- Wrapped the emitter at [`index/vehicle-events.ts:84-95`](../src/index/vehicle-events.ts#L84) in `if (FEATURE_PERF_DIAG && State.admin.perfDiagEnabled) { ... }`. This matches the destroy-side gating pattern (referenced in the original issue) and the global game-loop diag pattern at [`index/game-mode.ts:111`](../src/index/game-mode.ts#L111).
- In production (`FEATURE_PERF_DIAG = false` per [`config/conquest-constants.ts:6`](../src/config/conquest-constants.ts#L6)), the entire block — including the `mod.Message` construction and `sendHighlightedWorldLogMessage` call — is stripped by `postbuild.js` dead-code elimination. Bundle delta v1.379 → v1.380: **−362 bytes**.
- In dev / diag builds (`FEATURE_PERF_DIAG = true`), the existing perfDiag admin button at [`admin-panel/events.ts:161`](../src/admin-panel/events.ts#L161) toggles `State.admin.perfDiagEnabled` runtime, which controls whether the messaging emits.

Status: **Resolved (v1.380).**

Related:
- `CQ_Bug_Air_Deploy_Jet_Position_Regression` (#82) — the kind of regression these messages help catch.
- `CQ_Refactor_Vehicle_Destroy_Consolidation` (#74) — the destroy-side already gates its diag under `FEATURE_PERF_DIAG`; the spawn-side is the remaining exposed path.

## CQ_Bug_Launcher_Slot2_Double_Give (#90)
Title: RPG-then-AT4 double-gives a launcher instead of slot-swapping

Observed (2026-04-21):
- Repro: equip RPG via the gadget-locker launcher row (lands in the toggled slot — typically slot 2 by default, or slot 1 after toggle). Then click AT4 from the same row. The AT4 lands in a fresh slot instead of replacing the RPG in the existing slot — player ends up with both launchers simultaneously.

Suspected root cause:
- The v1.308–v1.313 gadget-locker rework added slot-based `RemoveEquipment(player, InventorySlots.GadgetOne/Two)` for slot-targeted swaps. The `slotWithLauncher(slotsState)` helper that resolves the swap target may be returning an empty slot when the probed `State.players.lockerSlots[pid]` has not yet been re-probed after the first RPG placement. Second click then hits the "give to empty slot" branch instead of the "swap same slot" branch.
- Alternative hypothesis: the `probeLauncherSlot` call between the two clicks is classifying the RPG slot as `kind: "gadget"` (post-v1.312 disambiguation fix removed `loaded === 1 → launcher` inference) — which would now cause `slotWithLauncher` to return `null` even though a launcher is present.

Intent:
- Diagnose whether the bug is in the probe (slot kind misclassified) or in the `slotWithLauncher` lookup (correct probe, wrong consumer). Candidate fix: re-probe both slots immediately before `giveLauncher` resolves its target slot, or maintain a `kind: "launcher"` marker that survives the probe (reintroduced via a non-ammo signal, e.g. the known engineer launcher-enum set from `#77`'s `ENGINEER_GADGET_CANDIDATES`).

Status: Likely resolved (user confirmation 2026-04-25 — not observed since the v1.339–v1.344 launcher probe + ammo-write polish passes). Needs MP confirmation. The v1.339 wielded-bail removal in `probeLauncherSlot`, the v1.342 launcher-ammo preservation across destructive probes, the v1.343 read-back/retry on ammo writes, and the v1.344 sibling-slot disambiguation likely closed this together.

Related:
- `CQ_Refactor_Gadget_Locker_v1.290_to_v1.313` (#77) — v1.312 probe-disambiguation fix is the likely regression surface.
- `CQ_Polish_Launcher_Ammo_Per_Launcher_Cap` (#78) — AT4 second-slot ammo gap is adjacent.
- Memory: `project_engineer_supply_crate_enum.md`.

## CQ_Audit_Engine_Enable_Calls (Tier 3.1, v1.372)
Title: Engine-object `Enable*` SDK call audit — generalize the v1.367 EnableAreaTrigger lesson

Audit scope (per [tier_1_2_3_cleanup_plan_2026-04-25.md](./tier_1_2_3_cleanup_plan_2026-04-25.md) §3.1):
- Every `mod.Enable*` SDK function in [reference_bf6_core/mod/functions/](../../reference_bf6_core/mod/functions/) was enumerated. For each engine-object enable function, every call site in [src/](../src/) was located, and every object-creation/get site for that object type was traced to confirm whether the engine's default state requires an explicit script call to flip.
- Capture points are out of scope (separate audit `CQ_Audit_CapturePoint_HotPath_State` below).

SDK enumeration:
- **Engine-object enables** (in scope): `EnableAreaTrigger`, `EnableInteractPoint`, `EnableSpatialObject`, `EnableHQ`, `EnableGameModeObjective`, `EnableVFX`, `EnableWorldIconImage`, `EnableWorldIconText`, `EnableCapturePointDeploying`.
- **Player-state controls** (out of scope): `EnablePlayerDeploy`, `EnableAllPlayerDeploy`, `EnableInputRestriction`, `EnableAllInputRestrictions`, `EnableUIButtonEvent`, `EnableUIInputMode`, `EnableScreenEffect`.

Findings — per object type:

| Object type | Used? | Enable wired? | Where |
|---|---|---|---|
| `AreaTrigger` | yes (boundary triggers via `mod.GetAreaTrigger`) | YES | [boundary/enforcement.ts:114](../src/boundary/enforcement.ts#L114) `enableBoundaryAreaTriggers()` called from `onGameModeStartedImpl` ([index/game-mode.ts:29](../src/index/game-mode.ts#L29)). The v1.367 lesson. |
| `InteractPoint` (authored) | yes (world interactables: ready, vehicle spawn, ammo resupply) | YES | [interaction/world-interactables.ts:79](../src/interaction/world-interactables.ts#L79) `applyWorldInteractableAuthoredInteractPointState`, called from `configureActiveWorldInteractables` ([:399](../src/interaction/world-interactables.ts#L399)) which runs from `applyMapConfig` ([config/map-runtime.ts:644](../src/config/map-runtime.ts#L644)) at game-mode start. Per-second retry via `ensureActiveWorldInteractablesReady` ([index/game-mode.ts:151](../src/index/game-mode.ts#L151)) covers the case where authored objects are not queryable on the first pass. |
| `InteractPoint` (runtime-spawned, ready dialog) | yes (per-player) | YES | [interaction/interact-point.ts:44](../src/interaction/interact-point.ts#L44) on spawn; disabled at [:105](../src/interaction/interact-point.ts#L105) on cleanup. |
| `WorldIcon` (authored) | yes (HQ icons) | YES (intentionally disabled) | [interaction/world-interactables.ts:64-65](../src/interaction/world-interactables.ts#L64) — authored icons are explicitly hidden via `EnableWorldIconImage(false)` + `EnableWorldIconText(false)` so per-player runtime clones own presentation (per AGENTS.md `mod.AddUIIcon is Non-Functional` and memory `feedback_adduiicon_broken.md`). |
| `WorldIcon` (runtime-spawned) | yes (per-team HQ clones) | YES | [interaction/world-interactables.ts:168-169](../src/interaction/world-interactables.ts#L168) — clones spawn DISABLED, must call image+text enable after `SetWorldIconImage`/`SetWorldIconColor`/`SetWorldIconText`/`SetWorldIconOwner`. Documented constraint per memory `feedback_adduiicon_broken.md` ("Spawned WorldIcons start with image/text DISABLED"). |
| `VFX` (runtime-spawned smoke markers) | yes (yellow gadget anchors, team-coloured HQ markers) | YES | [interaction/world-interactables.ts:232,279](../src/interaction/world-interactables.ts#L232) — VFX handles return DISABLED from `mod.SpawnObject` for `FX_*` prefabs; explicit `mod.EnableVFX(vfx, true)` is the load-bearing step (the v1.166 lesson). |
| `HQ` | read-only (`mod.GetHQ(1/2)` for map detection) | n/a — no enable required for read-only `mod.GetObjectPosition` access | [config/map-runtime.ts:731-732](../src/config/map-runtime.ts#L731) — used in `detectMapKeyFromHqs()`. We never need the HQ-as-objective behavior `EnableHQ` controls. |
| `SpatialObject` | NO usage anywhere in src | n/a | grep returned zero `mod.GetSpatialObject`, zero `as mod.SpatialObject`, zero `EnableSpatialObject`. No latent risk. |
| `GameModeObjective` | NO usage anywhere in src | n/a | grep returned zero hits. We do not register custom objectives. |
| `MCOM` / `Sector` | NO usage anywhere in src | n/a | Not part of conquest game-mode surface. |
| `CapturePoint` (read access) | yes (`mod.GetCapturePoint`, `GetCurrentOwnerTeam`, etc.) | n/a — `EnableCapturePointDeploying` controls *deploying-on-point*, not the event/read surface we use | We rely on engine-vanilla CapturePoint event firing (`OnPlayerEnter/ExitCapturePoint`, `OngoingCapturePoint`, `OnCapturePointCaptured/Lost`). 90+ versions of working capture mechanics confirm no enable miss. |

Conclusion: **Clean.** Every engine-object type whose `Enable*` SDK call governs core functionality is properly wired at game-mode start. The v1.367 EnableAreaTrigger lesson does NOT generalize to a hidden bug — the same pattern (explicit enable call required because the engine's default state is "off") is already learned and applied for `VFX` (v1.166), `WorldIcon` (v1.064), and `AreaTrigger` (v1.367). No latent enable misses on object types we currently use.

Latent risk noted (NOT a defect, but worth documenting):
- The authored-`InteractPoint` enable path runs from `applyMapConfig` ([config/map-runtime.ts:644](../src/config/map-runtime.ts#L644)) which only fires when `detectMapKeyFromHqs()` returns a known map key. On an unknown map (or a startup tick before HQs are queryable), `applyMapConfig` is skipped entirely and no authored InteractPoints get enabled. Mitigated by the per-second `ensureActiveWorldInteractablesReady()` retry at [index/game-mode.ts:151](../src/index/game-mode.ts#L151), which calls `configureActiveWorldInteractables()` once `worldInteractablePresentationConfigured === false`. If a future map adds InteractPoints whose default-disabled state would manifest as "interaction does nothing for one second after game-mode start", the retry already covers it. No code change needed.

Status: **Resolved (audit clean).** No follow-up plan required. If a new engine-object type is added (e.g. a custom `Sector` or `MCOM` for an alternate game mode), revisit this audit and add the corresponding `Enable*` call site.

Related:
- v1.367 wiring change: `mod.EnableAreaTrigger` ([Changelog.ts:11](../src/Changelog.ts#L11)).
- v1.166 wiring change: `mod.EnableVFX` ([Changelog.ts:186](../src/Changelog.ts#L186)).
- AGENTS.md `mod.AddUIIcon is Non-Functional` (records the WorldIcon enable contract).
- Memory: `feedback_adduiicon_broken.md`.

## CQ_Audit_CapturePoint_HotPath_State (Tier 3.2, v1.372)
Title: Capture-point engagement-state hot-path audit — apply v1.369 cache-at-events principle to capture polling

Audit scope (per [tier_1_2_3_cleanup_plan_2026-04-25.md](./tier_1_2_3_cleanup_plan_2026-04-25.md) §3.2):
- Every read of `State.conquest.capture.engagedObjIdByPid[pid]` and `State.conquest.capture.byObjId[objId]` was traced for whether it's a pure cache read or triggers an engine query underneath.
- Every `mod.GetCapture*` / `mod.GetPlayersOnPoint` call was traced for cadence (event-driven vs per-tick polling) and for whether the result could be cached at events.
- Reference pattern: v1.358–v1.369 boundary refactor, where per-tick `mod.GetVehicleFromPlayer` was replaced by event-driven `seatKind` cached at `OnPlayerEnter/ExitVehicle` + spawn-mode seed. The general principle is "cache at events, read pure state on the hot path."

Inventory of engine queries against capture-point objects:

| File:line | Call | Cadence | Notes |
|---|---|---|---|
| [index/area-triggers.ts:8,18](../src/index/area-triggers.ts#L8) | `OngoingCapturePoint` → `onCapturePointTick` and `OnCapturePointCaptured/Lost` edges | event-driven | These are the engine's per-point callbacks. Already correct. |
| [index/area-triggers.ts:32,54](../src/index/area-triggers.ts#L32) | `OnPlayerEnter/ExitCapturePoint` → updates `engagedObjIdByPid[pid]`, fires `onCapturePointTick` immediately, marks HUD dirty | event-driven | This is the cache-at-events pathway for engage-HUD ownership. Authoritative. |
| [index/capture-tickets.ts:1751,1756,1761,1769](../src/index/capture-tickets.ts#L1751) | Inside `onCapturePointTick`: `GetCurrentOwnerTeam`, `GetOwnerProgressTeam`, `GetCaptureProgress`, `GetPlayersOnPoint` (all per-call) | event-driven OR polled (depending on caller) | Each call is ~one engine query per mapped point per invocation. |
| [index/capture-tickets.ts:2058,2070,2075](../src/index/capture-tickets.ts#L2058) | `syncMappedCapturePointsFromEngine` per-subtick: for each mapped point, `mod.GetCapturePoint(objId)` + `onCapturePointTick(cp)` | **per-subtick (~8.3 Hz)** | Called from `refreshLiveCaptureStateSubtick` ([index/game-mode.ts:118](../src/index/game-mode.ts#L118)) inside the live game-mode loop. |
| [index/player-kpi-events.ts:51](../src/index/player-kpi-events.ts#L51) | `mod.GetPlayersOnPoint` inside `OnCapturePointCaptured` → KPI capture credit | event-driven (one call per capture event) | Correct. |
| [index/capture-tickets.ts:1548](../src/index/capture-tickets.ts#L1548) | `mod.GetCapturePoint(objId)` inside `applyCaptureTimingForMappedPoints` | one-shot at live-state reset | Correct. |

Per-subtick cost arithmetic:
- 3 mapped capture points × 4 engine queries (`GetCapturePoint` + `GetCurrentOwnerTeam` + `GetOwnerProgressTeam` + `GetCaptureProgress` + `GetPlayersOnPoint` + array iteration) at 0.12s subtick (~8.3 Hz) = **~100 capture-point engine queries per second**, regardless of actual capture activity.
- For comparison, the v1.358–v1.369 boundary work eliminated `mod.GetVehicleFromPlayer` × N players × per-second tick (~64 queries/sec at 64p) which was deemed worth fixing.

Why the polling exists (load-bearing, do NOT blindly remove):
- Comment at [index/capture-tickets.ts:2052-2056](../src/index/capture-tickets.ts#L2052): "OngoingCapturePoint callbacks can miss the exact neutralization-edge sample on some clients. If that final sample is missed, the previous contested frame can keep an old owner border visible. Live polling guarantees the visual FSM receives authoritative owner/progress updates at least once per tick."
- The polling is a correctness backstop, not an arbitrary tick. Removing it risks reintroducing the missed-edge contested-border bug. Cadence (per-subtick vs per-second) is a deliberate design tradeoff for sub-second HUD fill/percent responsiveness — calling out per the comment at [index/game-mode.ts:103](../src/index/game-mode.ts#L103).

Findings — actionable optimizations (none playtest-blocking):

1. **`mod.GetPlayersOnPoint` inside the per-subtick polling could be replaced with a cached set fed by `OnPlayerEnter/ExitCapturePoint` events.** The enter/exit handlers at [index/area-triggers.ts:32,54](../src/index/area-triggers.ts#L32) already maintain `engagedObjIdByPid[pid]` authoritatively. A reverse index `State.conquest.capture.byObjId[objId].onPointPids: Set<number>` (or array) maintained at the same enter/exit edges would let `onCapturePointTick` derive `onPointTeam1` / `onPointTeam2` from the cache instead of re-querying the engine + iterating an allocated array. Saves ~25 engine queries/sec + 25 array allocations/sec at 3 mapped points. Owner/progress queries must remain (they exist precisely to plug missed `OngoingCapturePoint` events). Estimated cost: medium effort (the cache must stay consistent across deploy/undeploy/disconnect, all of which already touch `engagedObjIdByPid`); medium reward (smaller absolute savings than the v1.358 boundary fix because per-point-per-tick is smaller than per-player-per-tick).

2. **Cadence reduction is NOT recommended.** Dropping the polling from per-subtick to per-second would halve the HUD fill/percent update rate — the comment explicitly cites "sub-second cadence to keep fill/percent updates responsive" as the reason for the current design.

3. **Owner/progress queries remain necessary.** `GetCurrentOwnerTeam` / `GetOwnerProgressTeam` / `GetCaptureProgress` cannot be cached at events because the events themselves can be missed (the failure mode the polling exists to backstop).

Conclusion: **Clean for correctness. One actionable optimization deferred.** The capture-point polling is intentional, documented, and load-bearing. It does not exhibit the v1.358 anti-pattern of "per-tick engine query when an event-driven cache would do" for the owner/progress fields, because the polling specifically exists to compensate for missed events. The one applicable v1.369 lesson — replace `GetPlayersOnPoint` with an event-driven cache — is logged as a low-priority optimization, not a bug.

Status: **Resolved (audit clean).** Optional follow-up: cache `onPointPids` at enter/exit events and read the cached set inside `onCapturePointTick` instead of calling `mod.GetPlayersOnPoint`. Defer until a 64-player playtest with `FEATURE_PERF_DIAG=true` confirms the per-subtick cost is measurable on the section-1 timer.

Related:
- v1.358–v1.369 boundary refactor (cache-at-events principle generalized from this work).
- AGENTS.md "Combat HUD Dirty-Flag Contract" (the dirty-flag system that gates per-subtick HUD writes; capture-point sync feeds this gate).
- `CQ_Perf_TickContext_AllPlayers_Cache` (#65) — companion cache pattern.

## CQ_Bug_GetVehicleFromPlayer_Boundary_ForwardDeploy (#93)
Title: `GetVehicleFromPlayer` engine error log spam during Forward Deploy boundary check

Observed (2026-04-25, v1.372B error-log capture at [reference_design_documentation/testing_images/20260425101723_1.jpg](../reference_design_documentation/testing_images/20260425101723_1.jpg)):
- Error log shows 5 rapid-fire occurrences of `Error reported by GetVehicleFromPlayer while running JS Script — Failed to perform operation as invalid value encountered.`
- User-reported trigger: spawning with a vehicle from Forward Deploy. Suspected origin: boundary checks running before the vehicle handle is valid for the freshly-deployed player.

Suspected root cause:
- Single remaining `mod.GetVehicleFromPlayer` call site is at [src/boundary/enforcement.ts:530](../src/boundary/enforcement.ts#L530) (inside the boundary classifier helper, called from per-second `tickBoundaryEnforcement` and from synchronous `refreshPlayerBoundaryState` on enter/exit-vehicle events). The deploy-time / Forward-Deploy seating handoff fires `OnPlayerDeployed` → `ForcePlayerToSeat` → post-seat vehicle Teleport (Phase 2a/2b loadout fix). Boundary tick can fall in the brief window where the player is reported as deployed but `GetVehicleFromPlayer` still returns invalid (the engine-level handle lags).
- v1.368 deliberately bypassed `safeGetVehicleFromPlayer`'s `posDebugVehicleObjIdByPid` cache gate to fix aircraft OOB false-positives; v1.369 then moved per-tick reads to a cached `seatKind` flag. The remaining direct call at enforcement.ts:530 (and at [player-deploy.ts:71](../src/index/player-deploy.ts#L71)) is the residual surface for this error class.
- Pattern matches the engine-logs-before-JS-catch family (`CQ_Bug_38` / `CQ_Bug_39`): the `try { vehicle = mod.GetVehicleFromPlayer(player); } catch {}` swallows the exception in JS, but the engine still emits the error log line before JS catches.

Impact:
- Cosmetic / log-noise only at present. No observed gameplay regression. Risk amplifier under 64p where Forward/Air Deploy + boundary tick contention is denser.

Proposed fix paths (one of):
1. Gate the `GetVehicleFromPlayer` call at [enforcement.ts:530](../src/boundary/enforcement.ts#L530) behind the cached `state.seatKind` flag — if `seatKind === "on_foot"`, skip the engine call entirely; if vehicle, the cached flag is already authoritative for the boundary classifier (per the v1.369 design, the only remaining engine call inside the classifier is `safeGetSoldierStateVector` for the foot-Y-ceiling check). Investigate whether the line 530 read is even needed once seatKind drives classification.
2. Add a deploy-grace window check before the boundary tick reads vehicle state for a freshly-deployed player (mirror the `GCZ_DEPLOY_GRACE_SECONDS` pattern from v1.360).
3. Replace the direct `mod.GetVehicleFromPlayer` with the existing `safeGetVehicleFromPlayer` at [id-helpers.ts:34](../src/state/id-helpers.ts#L34) which already wraps in try/catch and caches by pid — but the cache lag was the v1.368 bug, so this only papers over the issue.

Status: **Resolved (v1.374) pending MP confirmation.**

Call-site audit revealed three sites in [src/](../src/) call `mod.GetVehicleFromPlayer`:
1. [`index/player-deploy.ts:71`](../src/index/player-deploy.ts#L71) inside `onPlayerDeployedImpl` — fires every `OnPlayerDeployed` event. **Dominant fire path.**
2. [`boundary/enforcement.ts:530`](../src/boundary/enforcement.ts#L530) inside `probeSeatKindFromEngineState` — fires only on non-slot deploys (squad/flag spawn into vehicle). Skipped on Forward/HQ/Air slot-based deploys via the slot-claim branch at [:438](../src/boundary/enforcement.ts#L438).
3. [`state/id-helpers.ts:43`](../src/state/id-helpers.ts#L43) inside `safeGetVehicleFromPlayer` wrapper — wrapper has zero callers; effectively dead.

The cache `posDebugVehicleObjIdByPid` that site #1 seeds is consumed only by `FEATURE_POSITION_DEBUG`-gated code in [`hud/position-debug.ts:187`](../src/hud/position-debug.ts#L187). The flag has been `false` since v1.190 (80+ versions); the consumer is stripped from production bundles. The two `safe*` wrappers that gate on the cache (`safeGetVehicleFromPlayer`, `safeGetPlayerVehicleSeat`) have effectively zero production callers. Net: seeding a dead cache and paying for engine error logs on every deploy timing race.

**Fix shipped in v1.374:** deleted lines 65-76 of `player-deploy.ts`:
```ts
// Removed:
// delete State.players.posDebugVehicleObjIdByPid[pid];
// State.players.posDebugTransformSourceByPid[pid] = "soldier";
// try {
//     const deployedVehicle = mod.GetVehicleFromPlayer(eventPlayer);
//     if (deployedVehicle) { ... }
// } catch {}
```
Replaced with a comment block documenting the cache ownership (now exclusively `OnPlayerEnter/ExitVehicle` events at [`vehicle-events.ts:10-12`](../src/index/vehicle-events.ts#L10) for normal entries; Air Deploy's no-enter-event case loses cache initialization, which is the position-debug feature's problem to solve if `FEATURE_POSITION_DEBUG` is ever re-enabled — boundary classification doesn't depend on it).

Boundary-side probe at `enforcement.ts:530` left as-is per Fix F: rare edge case (squad-spawn-into-aircraft passenger seat), already gated by `IsInVehicle` returning true, genuinely needed for boundary correctness, and any error there would be a real signal worth seeing.

Bundle delta v1.373 → v1.374: **−418 bytes** (1.71% headroom).

Verification (single-player playtest):
1. Forward Deploy a vehicle → confirm zero `GetVehicleFromPlayer` engine errors in admin error log.
2. HQ Deploy a vehicle → same.
3. Air Deploy an aircraft → same.
4. Vanilla deploy + walk-into-vehicle → same.
5. On-foot deploy (no vehicle) → same.
6. Boundary regression: Forward Deploy ground vehicle, drive outside GCZ → OOB warning fires correctly. Air Deploy aircraft, fly outside GCZ at altitude → no false-positive OOB. Bail from heli at altitude → ceiling-Y kill fires.
7. Squad-spawn smoke: teammate in heli passenger seat, squad-spawn onto them → boundary classifies as aircraft. If `enforcement.ts:530` ever logs an error in this path, that's expected and acceptable.

Related:
- `CQ_Bug_38` / `CQ_Bug_37` — v1.076 vehicle-occupancy cache fix for the same error class (different call site).
- `CQ_Feat_Event_Driven_Seat_State` (v1.369) — eliminated per-tick `GetVehicleFromPlayer` from the boundary classifier; this fix completes the v1.369 design intent by removing the last per-deploy seed call whose cache is no longer consumed in production.
- v1.368 changelog ([Changelog.ts:10](../src/Changelog.ts#L10)) — bypass of `safeGetVehicleFromPlayer` cache gate for Air Deploy timing race.
- Memory `project_force_player_to_seat_unreliable.md`.
- Plan: [`design_doc/get_vehicle_from_player_fix_plan_2026-04-25.md`](./get_vehicle_from_player_fix_plan_2026-04-25.md).

## CQ_Bug_GetInventoryAmmo_SupplyBox_OpenMenu (#94)
Title: `GetInventoryAmmo` / `GetInventoryMagazineAmmo` engine error log on Supply Box menu open

Observed (2026-04-25, v1.372B error-log capture at [reference_design_documentation/testing_images/20260425101723_1.jpg](../reference_design_documentation/testing_images/20260425101723_1.jpg)):
- Error log shows one occurrence each of `Error reported by GetInventoryAmmo while running JS Script — Failed to return ammo amount due to an invalid player or inventory item.` and `Error reported by GetInventoryMagazineAmmo while running JS Script — Failed to return ammo amount due to an invalid player or inventory item.`
- User-reported trigger: opening the gadget Supply Box (ammo-resupply) menu, possibly while playing as Assault.

Re-observed (2026-04-27, v1.408 SP smoke test at [reference_design_documentation/testing_images/20260427212633_1.jpg](../reference_design_documentation/testing_images/20260427212633_1.jpg)):
- Same engine errors (`GetInventoryAmmo` + `GetInventoryMagazineAmmo` invalid-player-or-inventory-item), now multiple repetitions per menu interaction (4 errors visible in the v1.408 capture vs 2 in the v1.372B capture).
- **Class context: Medic.** Trigger path: opening the Supply Box and selecting medic gadgets and/or smoke artillery. This rules out the earlier "Assault-specific" hypothesis — the bug is class-agnostic, fired wherever the slot probe lands on an empty or non-launcher slot.
- **Not a Wave 1/2 regression.** Wave 1 (v1.407) only modified `onPlayerLeaveGameImpl` cleanups; Wave 2 (v1.408) was a phase-prefix rename pass that did not touch `ammo-resupply-menu.ts`. The bug is the same pre-existing latent issue from v1.372B; the v1.379 "not reproducing" mark was premature.

Suspected root cause:
- The Supply Box menu's slot-probe path in [src/interaction/ammo-resupply-menu.ts](../src/interaction/ammo-resupply-menu.ts) calls `mod.GetInventoryAmmo` and `mod.GetInventoryMagazineAmmo` against `mod.InventorySlots.GadgetOne` / `GadgetTwo` to classify slot contents. Calls at lines 1135/1139 and 1333/1336 are NOT wrapped in try/catch (others at 863-876, 937-943, 1354-1364, 2294-2295 are wrapped). When the player has no item in a probed slot — or when the slot holds a class-loadout item the probe is not expecting — the engine reports an invalid-inventory-item error.
- Confirmed class-agnostic per v1.408 Medic repro: probing for a launcher slot on any class that has no launcher (Assault, Medic, Recon — any non-Engineer class) lands on an empty-or-non-launcher slot and triggers the invalid-item error.
- Pattern matches `CQ_Polish_Launcher_Ammo_Per_Launcher_Cap` (#78) and the v1.341 `RemoveEquipment` fix, where slot-targeted SDK calls without an `isSlotEmpty` / `HasEquipment` precheck produce engine error spam.

Impact:
- **Cosmetic / log-noise only.** No observed gameplay regression — game continues, gadgets work, Supply Box still functions. The errors fill the world log overlay which is visually noisy but not blocking.
- Could mask other Supply Box menu issues if the error log fills up.

Possible fix paths (not actioned in current wave):

1. **Minimum-effort fix (~15–30 min)**: at the four unwrapped call sites (lines 1135/1139 and 1333/1336 in [`ammo-resupply-menu.ts`](../src/interaction/ammo-resupply-menu.ts)), add `try { ... } catch {}` wrapping. Still emits the engine log (engine logs fire BEFORE the JS catch), but prevents any JS-side exception fallout. This matches the wrap pattern at the other call sites (863-876, 937-943, 1354-1364, 2294-2295) but does not silence the log itself.

2. **Cleaner fix (~30–45 min — preferred for log silence)**: gate every `GetInventoryAmmo` / `GetInventoryMagazineAmmo` call behind a `mod.HasEquipment(player, slot)` precheck (or an equivalent `isSlotEmpty(slot)` check derived from `IsInventorySlotActive`). When the slot is empty or holds a non-launcher class loadout, skip the ammo probe entirely. This is the v1.341 `RemoveEquipment` precheck pattern from `CQ_Bug_RemoveEquipment_JS_Error` (#84) reapplied to the `GetInventoryAmmo` family. Eliminates the engine log entirely.

3. **Architectural fix (larger, deferred)**: refactor the slot-probe path to use the authoritative `State.players.lockerSlots[pid]` map (already maintained by the locker open flow) as the source of truth for slot contents. Eliminates the need for live `GetInventoryAmmo` probes during menu refresh. Out of scope for a small bugfix; would belong to a Supply Box rework.

Status: **Resolved (v1.447 menu-open path + v1.448 placement path, 2026-05-03, pending MP confirm)**. Bundle impact of fix paths #1 / #2: near-zero (a few `if` checks). Verify by reproducing the menu-open across all four classes (Assault, Engineer, Medic, Recon) with various gadget combinations and confirming the log lines no longer appear (path #2) or are properly absorbed (path #1).

**Resolution shipped at v1.447 (per-class scoped probes — variant of fix path #2):**
- Engineer's `probeSlot` left untouched (original ammo-based detection + destructive `probeLauncherSlot` semantics for launcher identification — works "best it can" per user direction; engine-log noise on Engineer cold-spawn opens is accepted as out of scope, since removing it would require the larger architectural rework of fix path #3).
- Three new HasEquipment-based per-class probes added in [`src/interaction/ammo-resupply-menu.ts`](../src/interaction/ammo-resupply-menu.ts): `probeAssaultSlot`, `probeMedicSlot`, `probeReconSlot`. Each iterates `ACTIVE_GADGET_CONFIG.{assault,medicItems,recon}` filtered by slot; uses `mod.IsInventorySlotActive` for the unknown branch + `mod.HasEquipment` for gadget detection. Neither call emits the engine error log on miss.
- Small dispatcher `probeSlotForClass(player, slot)` routes by class (Engineer → existing `probeSlot`; others → matching per-class probe; unknown class → safe `{ kind: "empty" }` default).
- Wired into both consumers: `initLockerSlotStateFromProbe` (line 1062, first-open menu probe) and `reprobeSiblingGadgetSlot` (line 1141, placement-time sibling re-probe).
- Bundle delta: +2,614 bytes (866,137 → 868,751).
- Plan: [`design_doc/5.03.26_conquest_supplybox_medic_fix_plan.md`](./5.03.26_conquest_supplybox_medic_fix_plan.md).
- Also corrects the original "cosmetic / log-noise only" framing of impact: every engine error log entry allocates against the same JS heap that crashed the script at 16p in [`#109`](#cq_bug_16player_playtest_js_memory_limit-109). Eliminating 4 errors per menu open across N players × N opens removes a non-trivial heap-pressure contributor that would have eaten back some of Wave 6's reclaim.

**Follow-up at v1.448 (placement path):** v1.447 SP-test pushback — "still triggers as a medic and as assault." The menu-open path was clean post-v1.447 (per-class probes worked) but the menu-PLACEMENT path was still emitting engine log via `isSlotEmpty()` ([line 875-880](../src/interaction/ammo-resupply-menu.ts#L875)) which itself calls `GetInventoryAmmo` + `GetInventoryMagazineAmmo`. `isSlotEmpty` was invoked on every tile click from `giveMedicSmoke` (line 1356), `giveAssaultItem` (line 1401), and `giveReconItem` (line 1450). User-directed simplification: drop the `if (!isSlotEmpty(targetSlot)) { RemoveEquipment(targetSlot); }` precheck entirely — engine `AddEquipment` cleanly clobbers the slot, users own the slot choice via the slot-toggle UI, dup prevention is handled by the existing `ownedByLockerState` (gray-out via `tileOwned`) + HasEquipment-based gadget-id sweep. Engineer's `giveLauncher` LEFT UNTOUCHED (launcher swap-in-place needs the slot-targeted RemoveEquipment). Bundle delta v1.448: −362 bytes (868,751 → 868,389). Combined v1.447+v1.448 result: non-Engineer classes emit ZERO `GetInventoryAmmo` / `GetInventoryMagazineAmmo` engine error log entries on either menu-open OR placement.

Related:
- `CQ_Polish_Launcher_Ammo_Per_Launcher_Cap` (#78) — same call-family, adjacent issue.
- `CQ_Bug_Launcher_Slot2_Double_Give` (#90) — same file, recently iterated on.
- `CQ_Bug_RemoveEquipment_JS_Error` (#84) — same engine-logs-before-JS-catch family. v1.341 precheck pattern is the prior art.
- v1.343 changelog ([Changelog.ts:31](../src/Changelog.ts#L31)) — read-back verify after `SetInventoryAmmo`/`SetInventoryMagazineAmmo`.

## CQ_Polish_SupplyBox_DisabledFocused_Indicator (#97)
Title: Supply Box menu — disabled-but-focused tiles now show a distinct border indicator for console / controller navigation

Observed (2026-04-25, design feedback):
- Many tiles in the Supply Box (gadget) menu start disabled (wrong class, gadget cooldown active, ammo at cap, gadget round-start delay, etc.).
- Console / controller players have no visual cue when navigating across disabled tiles — the engine fires `FocusIn` events on disabled buttons (already consumed at [ammo-resupply-menu.ts:2596](../src/interaction/ammo-resupply-menu.ts#L2596) for help-text updates) but the tile's disabled visual fully wins, so players can be "selecting" a button without knowing it.

Resolution shipped at v1.375:
- New per-pid state field `armFocusedTileKeyByPid: Record<number, string>` ([runtime-types.ts:390](../src/state/runtime-types.ts#L390), [runtime-state.ts:212](../src/state/runtime-state.ts#L212)) tracks which tile the player has focus on. Cleared on FocusOut, on `setArmOpen(pid, false)` (menu close), in `resetArmState` (round/state reset), and in the player-leave handler.
- New color constant `COLOR_BUTTON_BORDER_DISABLED_FOCUSED = COLOR_WHITE_LOW` ([ui-layout.ts:194](../src/foundation/ui-layout.ts#L194)) — cool blue-white (`#D5EBF9`), per design direction (no yellow).
- `FocusOut` events wired alongside the existing `FocusIn` at the two tile-button-creation sites ([:626](../src/interaction/ammo-resupply-menu.ts#L626), [:1635](../src/interaction/ammo-resupply-menu.ts#L1635)).
- `setTileVis` and `setActVis` ([:803](../src/interaction/ammo-resupply-menu.ts#L803), [:817](../src/interaction/ammo-resupply-menu.ts#L817)) accept a new `focused` parameter (default false). When `!enabled && focused`, paint the border with `COLOR_BUTTON_BORDER_DISABLED_FOCUSED` at full opacity AND lift the button background from `COLOR_GRAY_DARK` to `COLOR_GRAY` for additional contrast.
- `refreshArmMenu` reads `focusedKey` once at the top ([:2046](../src/interaction/ammo-resupply-menu.ts#L2046)) and passes `focused = (focusedKey === thisTileKey)` to every `setTileVis`/`setActVis` call. Per-tile signatures appended a `focused ? 1 : 0` field so the existing dirty-detection re-renders both the prev-focused and new-focused tiles when focus moves.
- `handleArmMenuEvt` derives a stable `tileKey` from the widget-name parsing already in place (assault → `"a:N"`, medic-smoke → `"m"`, medic-items → `"x:N"`, launcher rows → `"row:N"`, launcher-ammo → `"e"`, recon → `"q:N"`). FocusIn writes `armFocusedTileKeyByPid[pid] = tileKey` and triggers `refreshArmMenu(force=true)`. FocusOut clears the key only if it still matches the leaving tile (guards out-of-order events) and forces a refresh. Close button is intentionally excluded from focus tracking — it is always enabled, so the disabled-focused state is unreachable.

Bundle delta v1.374 → v1.375: **+2,776 bytes** (1.71% → 1.44% headroom — within budget).

Verification (single-player playtest, controller / keyboard navigation):
1. Open Supply Box menu. Confirm currently-focused tile shows the new cool blue-white border ring + slightly brighter background when disabled.
2. Navigate to an enabled tile. Confirm the existing engine focus visual continues to apply (no regression).
3. Navigate back to disabled. Confirm border ring re-appears on the focused tile.
4. Class swap mid-menu: confirm focus visual stays on the same widget and updates if its enabled state flips.
5. Round-start gadget delay: open menu pre-LIVE; navigate; confirm every tile shows the disabled-focused indicator on its turn.
6. Close menu while a tile is focused; reopen. Confirm focus state from previous session does not leak.
7. Mouse hover regression: hover a disabled tile with mouse — disabled-focused visual may or may not fire (FocusIn vs HoverIn engine behavior); acceptable either way (controller is the primary target).

Status: **Resolved (v1.375) pending MP confirmation.**

Out of scope:
- Other menus (Ready Dialog, Vehicle Deploy, etc.) — same pattern could be extracted into a shared utility if/when extended. User explicitly scoped to Supply Box only for this iteration.
- Migration to SDK button-state primitives (`SetUIButtonColor{Base,Disabled,Focused,Hover,Pressed}`) — larger refactor; would replace the `safeSetUIWidgetBgColor` pattern. Captured as a future cleanup option; not needed for this fix.
- HoverIn / HoverOut explicit wiring — engine likely conflates with FocusIn for mouse, untested.

Related:
- Plan: [`design_doc/supply_box_disabled_focus_indicator_plan_2026-04-25.md`](./supply_box_disabled_focus_indicator_plan_2026-04-25.md).

## CQ_Bug_Launcher_Ammo_Cap_Below_Designed (#95)
Title: Launcher ammo button caps below configured `maxAmmo`; observed RPG=4 / AT4=3 / Stinger=4 vs. configured 6 / 5 / 6

Observed (2026-04-25, user report):
- Per-launcher `maxAmmo` is configured at [interaction/ammo-resupply-menu.ts:67-69](../src/interaction/ammo-resupply-menu.ts#L67) as RPG=6, AT4=5, Stinger=6 (loaded + magazine total).
- Real cap experienced by clicking the Launcher Ammo tile to refusal: RPG=4, AT4=3, Stinger=4.
- Pattern is uniform: every launcher caps at exactly **2 below** its configured `maxAmmo` (RPG 6→4, AT4 5→3, Stinger 6→4).

Root-cause hypothesis (engine-side reserve clamp):
- `giveRocketCharge` at [ammo-resupply-menu.ts:1324](../src/interaction/ammo-resupply-menu.ts#L1324) writes via `mod.SetInventoryAmmo` (chamber path) when chamber is empty, otherwise via `mod.SetInventoryMagazineAmmo` (mag path) with the absolute new value `magAmmo + 1`.
- BF6 launcher class loadouts deploy with **chamber=1 + reserve=N** for some N less than (`maxAmmo − 1`). Engineer's RPG default appears to be 1 chamber + 3 reserve = 4 total. AT4 looks like 1 + 2 = 3. Stinger 1 + 3 = 4.
- Each click of the Launcher Ammo tile takes the chamber-fresh path on the first call, then the mag path on subsequent calls (chamber stays at 1). The mag path writes `magAmmo + 1` absolute, but the **engine silently clamps** any write above its per-launcher reserve maximum (the v1.343 changelog already noted "the launcher API can silently no-op a chamber/magazine write"). The cap-defense gate at [:1341](../src/interaction/ammo-resupply-menu.ts#L1341) never trips because our configured `maxAmmo` is higher than the engine's actual reserve max — so we keep accepting clicks while the engine drops the writes.
- The v1.343 read-back-verify at [:1354-1365](../src/interaction/ammo-resupply-menu.ts#L1354) catches the no-op on a per-click basis (returns false, charge NOT consumed) — but the UI's `atCap` recompute at [:2287-2297](../src/interaction/ammo-resupply-menu.ts#L2287) compares `loaded + mag` to our configured `maxAmmo` and stays false, so the tile never grays out and the player keeps spamming clicks to no effect.

Diagnostic quick-test (one playtest run, optional, to confirm the hypothesis before changing the design):
1. Spawn engineer with each launcher in turn.
2. Note `loaded` + `mag` at spawn (probably 1 + N, where N is the engine reserve cap minus 1).
3. Click Launcher Ammo until clicks no longer change ammo (use `FEATURE_PERF_DIAG=true` admin panel ammo readout or temporary world-log). Confirm clicks return false (no charge consumed) once cap is hit.
4. Verify the cap matches engine-default reserve — this validates the hypothesis and tells us the SDK's clamp is the source of truth, not our config.

Design change (per user direction, 2026-04-25):
- Move from per-launcher caps (6 / 5 / 6) to a **uniform 3-rocket cap** for any launcher.
- When the cap is reached, the Launcher Ammo tile must visibly indicate "not available" (gray header, gray countdown, optional message) so the player knows further clicks won't help.

Implementation sketch:
1. Update each entry at [ammo-resupply-menu.ts:67-69](../src/interaction/ammo-resupply-menu.ts#L67) to `maxAmmo: 3` (RPG, AT4, Stinger).
2. The existing `atCap` gate at [:2287-2297](../src/interaction/ammo-resupply-menu.ts#L2287) and the `ammoEnabled` evaluation at [:2302](../src/interaction/ammo-resupply-menu.ts#L2302) already wire `atCap` into `ammoEnabled = ... && !atCap`. Tile header color flips to `COLOR_GRAY` via the existing branch at [:2313](../src/interaction/ammo-resupply-menu.ts#L2313) when `ammoEnabled === false && isEngineerClass === true`.
3. Add an explicit "at cap" copy variant: extend the `cd` countdown label at [:2317-2319](../src/interaction/ammo-resupply-menu.ts#L2317) so when `atCap === true`, label reads (e.g.) `STR_UI_LAUNCHER_AT_CAP` ("Full") instead of `STR_UI_READY` ("Ready"). Requires a new string-key (player-facing — needs human approval per AGENTS.md `String Change Authorization Policy`).
4. The `giveRocketCharge` cap-defense gate at [:1341](../src/interaction/ammo-resupply-menu.ts#L1341) automatically follows because it reads `launcherMaxAmmoFor(gadgetId)` from the same config.
5. **Caveat:** because the engine still clamps below 3 for some launchers (e.g., AT4 caps at 3 total naturally via 1 chamber + 2 reserve), the user will hit the engine cap *before* our configured cap of 3 in some cases. That is acceptable per the user's design intent — "cap the player at 3 rockets maximum" — and the read-back verify at [:1354-1365](../src/interaction/ammo-resupply-menu.ts#L1354) will refund charges that the engine drops. UI will show `atCap === false` until our `maxAmmo` cap is hit, but those interim clicks no-op and don't cost charges. Acceptable.

Test plan:
1. Engineer spawn → menu open. Confirm Launcher Ammo tile is enabled, tile header green, countdown "Ready" (or appropriate variant).
2. Click Launcher Ammo. Confirm ammo total goes 1→2→3 (reaching our new cap). Charges decrement on each successful click.
3. At total=3, click again. Confirm tile grays out (header `COLOR_GRAY`, countdown `COLOR_GRAY`, label "Full" or equivalent), charge NOT consumed, ammo stays 3.
4. Fire a rocket → total drops to 2. Confirm tile re-enables.
5. Repeat with each launcher type (RPG, AT4, Stinger) and each toggled slot (slot 1 vs slot 2).

Status: **Resolved (v1.373) pending MP confirmation.** Implementation:
- All three `launchers[]` entries at [ammo-resupply-menu.ts:67-69](../src/interaction/ammo-resupply-menu.ts#L67) now `maxAmmo: 3`.
- New `STR_UI_LAUNCHER_AT_CAP` constant ([foundation/string-keys.ts:83](../src/foundation/string-keys.ts#L83)) sourcing `twl.ui.atCap` = "FULL" ([strings.json:350](../src/strings.json#L350)). User-approved 2026-04-25.
- Cd label + color branches at [:2314-2326](../src/interaction/ammo-resupply-menu.ts#L2314) extended: when `atCap === true`, label = "FULL" in `COLOR_GRAY`. Otherwise existing `STR_UI_READY` / clock / `STR_UI_NO_LAUNCHER` precedence preserved.
- Existing `atCap` gate at [:2287-2297](../src/interaction/ammo-resupply-menu.ts#L2287) drives `ammoEnabled === false` at cap; tile signature already factors `ammoEnabled` so re-render fires when atCap flips.
- Bundle delta v1.372 → v1.373: −1,409 bytes (combined with #96; the v1.344 short-circuit removal in #96 dominated).

Verification (single-player playtest, Engineer class, Firestorm):
1. Spawn with each launcher in turn. Open Supply Box menu. Confirm Launcher Ammo tile is enabled (green header), countdown reads "READY" (or current cooldown).
2. Click Launcher Ammo. Confirm ammo total goes 1→2→3 (verify via admin position-debug or temporary log).
3. At total = 3, click again. Confirm tile grays out: header = `COLOR_GRAY`, countdown = "FULL" in `COLOR_GRAY`. Charge NOT consumed.
4. Fire one rocket → total drops to 2. Confirm tile re-enables on next menu refresh tick.

Related:
- v1.340 changelog ([Changelog.ts:34](../src/Changelog.ts#L34)) — original per-launcher cap rollout (RPG=6, AT4=5, Stinger=6).
- v1.343 changelog ([Changelog.ts:31](../src/Changelog.ts#L31)) — read-back-verify pattern that already protects against engine clamp ammo loss.
- `CQ_Polish_Launcher_Ammo_Per_Launcher_Cap` (#78) — original investigation thread; this issue supersedes the per-launcher-cap design with the uniform cap.
- Plan: [`design_doc/launcher_ammo_fixes_plan_2026-04-25.md`](./launcher_ammo_fixes_plan_2026-04-25.md).

## CQ_Bug_Launcher_Slot_Identification_Zero_Ammo (#96)
Title: Launcher slot identification fails (or risks clobbering other gadgets) when launcher reads 0/0 — engineer cold-spawn or post-fire-empty case

Observed (2026-04-25, user report):
- When an engineer holds a launcher with 0 ammo (cold-spawn with empty default, or fired the last rocket), `slotWithLauncher` returns undefined and the Supply Box menu's Launcher Ammo tile cannot resolve the target slot.
- The current v1.344 mitigation at [probeLauncherSlot:929-948](../src/interaction/ammo-resupply-menu.ts#L929) short-circuits *only* when slot 2 is populated (any ammo) or active. When BOTH slots read 0/0/inactive (the cold-spawn case), the function falls through to the destructive probe at [:950-1001](../src/interaction/ammo-resupply-menu.ts#L950).
- The destructive probe calls `RemoveEquipment(player, GadgetOne)` and uses a `HasEquipment` before/after diff to identify what was removed, then re-adds it. Failure modes that can clobber other gadgets:
  - If the engine's `AddEquipment` restore at [:990](../src/interaction/ammo-resupply-menu.ts#L990) silently fails or restores to the wrong slot, the gadget that was in slot 1 is permanently lost.
  - If the slot-1 gadget is a non-launcher engineer item (Supply Crate / AV Mine / EOD Bot) and the launcher was actually in slot 2, the probe destructively removes a non-launcher to learn nothing useful (it then restores; but every probe is a destructive round-trip on slot 1).
  - The `multipleFlips` branch at [:977-985](../src/interaction/ammo-resupply-menu.ts#L977) bails with `slot: undefined` if more than one gadget disappears from the HasEquipment list — which can happen if the engine's removal cascades (e.g., class-loadout-linked gadgets).

SDK constraints (verified 2026-04-25):
- `mod.HasEquipment(player, gadget)` is **not slot-aware** — it returns boolean for the player's whole inventory. There is no `mod.HasEquipmentInSlot(player, slot, gadget)` in [reference_bf6_core/mod/functions/](../../reference_bf6_core/mod/functions/).
- The only non-destructive slot probes are `IsInventorySlotActive(player, slot)`, `GetInventoryAmmo(player, slot)`, `GetInventoryMagazineAmmo(player, slot)`. None of them tell us *which gadget id* is in a given slot — only its activity / ammo state.
- Therefore: when launcher reads 0/0/inactive, there is **no non-destructive SDK path** to learn which slot it occupies from a cold start. The destructive RemoveEquipment + diff is the only mechanism the SDK exposes.

Recommended resolution (defense-in-depth: cache aggressively at every reliable signal; defer destructive probe to explicit user intent; add safe fallbacks):

1. **Cache the launcher slot at every reliable signal we already have.** Each of these is a moment where the slot is unambiguous and we should write to `State.players.lockerSlots[pid].g{1,2}.kind = "launcher"` + `.gadget = <id>`:
   - `OnPlayerDeployed` for engineer class: snapshot `mod.IsInventorySlotActive(GadgetOne)` and `(GadgetTwo)` immediately. If exactly one is active at deploy and the player owns a launcher (HasEquipment positive on any `ALL_LAUNCHER_VARIANTS`), assume the active slot holds the wielded launcher. Engineer default loadout almost always wields the launcher at deploy.
   - First non-zero ammo read: when `GetInventoryAmmo + GetInventoryMagazineAmmo > 0` for a slot AND the player owns a launcher (HasEquipment), and `slotsState.g{n}.kind` is not yet "launcher", set kind=launcher for that slot. (This catches the post-resupply or post-pickup case before the player clicks Launcher Ammo a second time.)
   - User-driven slot toggle: the per-class slot-toggle row added in v1.304 already lets the user choose where future launchers go — when they do, persist that as `lockerSlots[pid].launcherSlotPreference` and trust it for subsequent placements.
   - `OnPlayerEarnedKill` with a launcher weapon kill: the killing weapon is a strong slot signal (active slot at kill time). Worth catching opportunistically.

2. **Defer the destructive probe to explicit user click intent.** Today, `probeLauncherSlot` is called from menu refresh paths ([:1181](../src/interaction/ammo-resupply-menu.ts#L1181), [:2421](../src/interaction/ammo-resupply-menu.ts#L2421)) — every menu-open or refresh runs the destructive probe if the cache is cold. Change this so the probe only fires when the player has explicitly clicked the Launcher Ammo button AND the cache is still uncertain (i.e., we are about to commit a write that requires knowing the slot). Until then, render the Launcher Ammo tile as DISABLED with a help hint ("Pick up ammo at a Supply Box to resupply") — degraded UX but no clobber risk.

3. **Pre-probe safety check on the destructive path.** Before `RemoveEquipment(GadgetOne)`, snapshot `slot1Loaded`, `slot1Mag`, `slot1Active` AND a `HasEquipment` snapshot of every `ENGINEER_GADGET_CANDIDATES` entry. If the snapshot disagrees with what we expect (e.g., player owns a non-launcher candidate and slot 1 reads non-empty in any way other than "launcher with 0 ammo"), abort the probe and disable the tile. This narrows the probe to only the case it's designed for.

4. **Sticky cache after first successful probe.** Once `probeLauncherSlot` returns a definitive `{slot, gadget}`, write it to `lockerSlots[pid].g{n}.kind="launcher"` and never re-probe within the same life. Re-probe only on `OnPlayerDeployed` (new spawn) or `OnPlayerUndeploy` (death) — both of which already fire deploy-snapshot logic per recommendation #1.

5. **Class-default fallback when destructive probe is impossible.** If we are forced into the destructive branch and either `multipleFlips` triggers or the AddEquipment restore appears to fail (post-restore HasEquipment for the removed gadget is false), fall back to assuming the launcher is in `lockerSlots[pid].launcherSlotPreference` (user toggle), or if no preference set, **GadgetTwo** (engineer default in BF6 vanilla). This trades correctness for non-clobbering behavior — better to occasionally write to the wrong slot's empty state and let the user observe than to permanently lose their EOD Bot.

6. **(Stretch) Replace destructive probe with a non-destructive heuristic when the player owns exactly one non-launcher engineer gadget.** If `HasEquipment(launcher) === true` AND exactly one of `[Supply Crate, AV Mine variants, EOD Bot]` returns true, AND we know the player has both slots populated (one active, one not), then the launcher must be in the slot opposite the non-launcher. We don't have a non-destructive way to learn which slot the *non-launcher* is in either — but in practice, BF6's class-loadout config places the player's loadout-configured gadget in slot 1 and the launcher in slot 2 by default. Testable hypothesis: spawn engineer with EOD Bot + RPG, check `IsInventorySlotActive` immediately, see whether we can infer from spawn-time defaults. Worth a 30-min probe before trusting this as a code path.

Combined with the #95 design change (uniform 3-rocket cap + at-cap visibility), the user's likely interaction frequency drops — there's less reason to spam the Launcher Ammo button. That makes a degraded "tile disabled, pick up Supply Box to resupply" UX more palatable when the cache is cold.

Status: **Resolved (v1.373) pending MP confirmation.** User rejected the cache-at-events approach (kit pickup mid-life invalidates pre-menu cache) in favor of a non-destructive +1-ammo probe. Implementation summary:

- Replaced the v1.344 short-circuit block at `probeLauncherSlot` with a two-stage non-destructive probe:
  - **Step B2 — cheap-positive populated check:** a slot with `loaded > 0 || mag > 0 || active` is populated; no write. Generalizes the v1.344 "slot 2 populated" short-circuit per-slot.
  - **Step B3 — +1-ammo disambiguation:** for slots reading 0/0/inactive, write `loaded + 1` via `SetInventoryAmmo` and read back. Populated iff the +1 took. Empty slot's write silently no-ops (no item to write to) so it stays at the original 0.
- Branched on the four populated combinations:
  - `(populated, !populated)` → return `GadgetOne` (skip destructive probe)
  - `(!populated, populated)` → return `GadgetTwo` (skip destructive probe)
  - `(populated, populated)` → run existing destructive RemoveEquipment + HasEquipment-diff (operates on post-+1 state)
  - `(!populated, !populated)` → bail with `undefined` (contradiction; player owns launcher per HasEquipment but neither slot accepted +1)
- Hoisted ammo snapshots (`slot1Loaded/Mag`, `slot2Loaded/Mag`) and the `before[]` HasEquipment cache to the top of the function so they're available to every branch.
- Centralized restore via `restoreOriginalState()` helper that writes back original loaded+mag for both slots and `ForceSwitchInventory` to the original wielded slot. Called on every exit branch.

Combat-interruption guarantees:
- All synchronous JS (no `mod.Wait`, no async window). Probe completes in ~microseconds.
- Player cannot close the menu mid-probe; cannot pick up a different kit mid-probe. JS doesn't yield.
- Probe runs at exactly two call sites: `openArmMenu` ([:2421](../src/interaction/ammo-resupply-menu.ts#L2421)) and `tryPlaceLauncher` ([:1181](../src/interaction/ammo-resupply-menu.ts#L1181)). Not on refresh ticks.
- Restore is unconditional — the player's pre-probe loadout state (active slot + ammo on both slots) is fully reinstated before return.

Bundle delta v1.372 → v1.373: −1,409 bytes (combined with #95). The +1 probe replaces ~20 lines (v1.344 short-circuit) with ~70 lines but the consolidated `restoreOriginalState` helper + minifier produced a net reduction.

Test plan (single-player, Engineer class, Firestorm):
1. Engineer cold-spawn, immediately open Supply Box menu without firing. Confirm Launcher Ammo tile state matches deploy-time slot snapshot (enabled if launcher placed via class default, with correct slot known).
2. Engineer spawn → fire all rockets to 0 → open Supply Box menu. Confirm tile shows correct slot from sticky cache (set during deploy snapshot). No destructive probe runs.
3. Engineer spawn with no launcher in default loadout → open menu → click Launcher row to place launcher. Confirm cache writes happen at the placement event, no destructive probe needed afterward.
4. Engineer spawn → toggle slot preference via per-class row → place launcher → fire to 0 → open menu. Confirm tile shows preference-respected slot.
5. Re-deploy after death. Confirm cache resets and re-snapshots fresh on the new life.
6. Cross-class test: switch to Assault → switch back to Engineer. Confirm cache invalidates correctly across class swaps (per existing `lockerSlots[pid]` lifecycle).

Related:
- `CQ_Refactor_Gadget_Locker_v1.290_to_v1.313` (#77) — authoritative per-player slot-state foundation.
- v1.344 changelog ([Changelog.ts:30](../src/Changelog.ts#L30)) — short-circuit + sibling-slot discriminator (the partial fix this issue supersedes).
- v1.339 changelog ([Changelog.ts:35](../src/Changelog.ts#L35)) — wielded-bail removal that opened the door for the destructive probe to run more often.
- `CQ_Bug_Launcher_Slot2_Double_Give` (#90) — adjacent slot-resolution issue; same `probeLauncherSlot` rewrite path.
- Plan: [`design_doc/launcher_ammo_fixes_plan_2026-04-25.md`](./launcher_ammo_fixes_plan_2026-04-25.md).

## CQ_Bug_FlagSpawn_FalsePositive_OOB (#98)
Title: Solo flag-spawn falsely flagged as out-of-bounds (`ground_combat_zone` violation) when no teammate is within squad-spawn-inheritance range

Observed (2026-04-25, user report):
- A player who deploys onto a captured CapturePoint (flag spawn) with no teammate within `SQUAD_SPAWN_PROXIMITY_RADIUS_METERS` (25m) is incorrectly flagged as out-of-bounds shortly after spawn. The `ground_combat_zone` warning fires, the 10-second OOB countdown begins, and the player is killed if they don't move.
- Trigger conditions: first player to spawn on a freshly-captured flag, OR last player on a flag after squadmates have died/left.

Root cause (architectural):
- The boundary system tracks zone membership via 5 booleans (`inOwnHQ` / `inOwnBuffer` / `inGCZ` / `inEnemyHQ` / `inEnemyBuffer`) on `State.round.boundary.zoneStateByPid[pid]`. These flip via engine `OnPlayerEnter/ExitAreaTrigger` events.
- The engine **does NOT fire trigger enter events on spawn-inside-trigger** — only on physical boundary crossings ([enforcement.ts:404-407](../src/boundary/enforcement.ts#L404)). So a player who spawns inside the GCZ trigger has `inGCZ = false` until they physically cross out and back in.
- `seedZoneStateFromSpawnContext` ([enforcement.ts:436](../src/boundary/enforcement.ts#L436)) handles seeding for non-slot deploys via two branches: (1) HQ-anchor distance probe (sets `inOwnHQ=true` if at HQ) and (2) `tryInheritZonesFromNearbyTeammate` (copies zone flags from nearest deployed teammate within 25m).
- **The flag-spawn case falls through both branches** when the player is solo: not at HQ, no teammate within 25m. All zones default to `false`. The `GCZ_DEPLOY_GRACE_SECONDS = 1.5s` window expires, then the classifier hits `state.inGCZ || state.inOwnBuffer = false` and returns `"ground_combat_zone"`.

Design policy violation:
- Per user direction (2026-04-25): **the deploy-time default must be in-bounds**, not out-of-bounds. The current architecture assumes "absence of zone-membership signal" = OOB, which is wrong for the spawn case where the engine architecturally cannot deliver the signal. The correct policy is: only flag OOB on spawn when we have **definitive proof** (either via slot-claim metadata or via inheritance from a teammate whose own zone state is settled and OOB). When no proof exists, assume the player landed in safe ground.

Status: **Resolved (v1.376) pending MP confirmation.**

Implementation shipped at v1.376 — restructured `seedZoneStateFromSpawnContext` ([enforcement.ts:436-472](../src/boundary/enforcement.ts#L436)) non-slot branch into three guarded steps:

```ts
// Step 1: anchor probe — standard on-foot HQ deploy
state.inOwnHQ = isPlayerWithinOwnMainBaseAnchorRadius(player);
if (state.inOwnHQ) return;
// Step 2: squad-spawn inheritance — only OOB-on-spawn proof path
const inheritedFromTeammate = tryInheritZonesFromNearbyTeammate(player, pid, state);
if (inheritedFromTeammate) return;
// Step 3: default-in-bounds fallback (NEW) — no slot, not at HQ, no teammate signal
state.inGCZ = true;
```

Key behavioral changes:
- Solo flag-spawn (no teammate within 25m) → previously left all zones false → false-positive OOB after grace; now defaults to `inGCZ=true` → in-bounds. **Bug fixed.**
- Squad-spawn during teammate's grace window → previously also left all zones false → false-positive OOB; now defaults in-bounds. Acceptable per policy.
- Squad-spawn onto OOB teammate → unchanged. Inheritance fires, copies OOB flag, classifier fires OOB on next refresh. Legitimate OOB-on-spawn case **preserved**.
- All slot-based deploy paths (HQ / Forward / Air) unchanged — slot-claim seed remains authoritative.
- Trigger enter / exit events still flip flags as the player moves. The default seed is the starting state only, not a permanent override; players who walk OUT of the GCZ trigger from a default-in-bounds spawn correctly fire OOB via `OnPlayerExitAreaTrigger`.

Bundle delta v1.375 → v1.376: **+124 bytes** (1.43% headroom).

Verification (single-player playtest, Firestorm):
1. **Bug-fix:** Live match, capture flag B, die, click flag B on deploy screen → spawn at flag, no OOB warning, no kill timer. Repeat for flags A, C.
2. **HQ deploy regression:** standard on-foot deploy → `inOwnHQ=true`, no OOB.
3. **Forward deploy regression:** ground slot Forward Deploy → `inGCZ + inOwnBuffer` set via slot-claim, no OOB.
4. **Air deploy regression:** aircraft slot → seatKind=aircraft exemption, no OOB.
5. **Vanilla deploy regression:** walk into HQ-pad ground vehicle → seatKind=ground_vehicle, classifier exempts.
6. **Pre-live regression:** pre-live, walk out of HQ → `prelive_main_base` violation fires correctly.
7. **HQ-back-walk regression:** live, walk to back of HQ to exit trigger 500/501 → `ground_combat_zone` violation fires correctly.
8. **GCZ exit regression:** live, drive ground vehicle out of trigger 666 → exit event flips `inGCZ=false`, OOB fires.
9. **Squad-spawn-on-OOB-teammate edge case:** A walks into enemy buffer, B squad-spawns on A → B inherits OOB.
10. **Squad-spawn-during-grace edge case:** A flag-spawns (in-bounds, in grace), B squad-spawns on A within those 1.5s → both in-bounds.

Plan: [`design_doc/flag_spawn_oob_default_inbounds_plan_2026-04-25.md`](./flag_spawn_oob_default_inbounds_plan_2026-04-25.md).

Related:
- `CQ_Feat_Zone_Tracker_Refactor` (v1.360) — single PlayerZoneState foundation; this fix lives in the seed function.
- `CQ_Feat_AreaTrigger_Enable` (v1.367) — wired enter/exit events; explained why spawn-inside-trigger remains unfixed (it's an engine-design choice, not a wiring bug).
- `CQ_Feat_Squad_Spawn_Zone_Inheritance` (v1.370) — the partial fix this issue supersedes; teammate inheritance still applies as the OOB-proof path, but the no-teammate fallback flips polarity to in-bounds.

## CQ_Polish_GadgetSlot_Selector_Top_Row_Focus_Highlights (#99)
Title: Extend the disabled-focused border indicator (#97) to the top-row gadget slot selector controls

Observed (2026-04-25, user punch list):
- v1.375 added a disabled-focused border indicator for the gadget tile buttons in the Supply Box menu (#97), but the same pattern needs to apply to the **top-row gadget slot selector controls** (the prev / next slot-toggle buttons that select which gadget slot to target — `SlotTogglePrev` / `SlotToggleNext` widgets per [ammo-resupply-menu.ts:2552-2556](../src/interaction/ammo-resupply-menu.ts#L2552)). Console / controller players currently get the same lack-of-feedback problem on those rows: when navigating to a disabled prev/next selector (e.g., a class that has no gadgets in that slot), no visible focus indicator paints.

Implementation direction:
- Mirror the v1.375 pattern: each prev/next slot-toggle button gets `FocusIn` + `FocusOut` event wiring; `setActVis` already accepts the `focused` param so existing call sites can pass through the focus state. The widget-name parsing at the top of `handleArmMenuEvt` already detects `toggleClassIdx >= 0` for the slot-toggle widgets — extend the `tileKey` resolver to emit a stable key for these (e.g., `"slotToggle:<class>:<dir>"`) and pass it through the same focus-tracking + per-tile-sig pipeline.
- Estimated effort: small (~30–60 min). Bundle impact: ~+200–300 bytes.

Status: **Open.** Punch-list polish 2026-04-25.

Related:
- `CQ_Polish_SupplyBox_DisabledFocused_Indicator` (#97) — original v1.375 fix; this extends scope to the top-row selectors that were not in the v1.375 plan.
- Plan reference: [`design_doc/supply_box_disabled_focus_indicator_plan_2026-04-25.md`](./supply_box_disabled_focus_indicator_plan_2026-04-25.md) noted "Out of scope: Other menus" — top-row slot selectors are within the same Supply Box surface and should ride the same pattern.

## CQ_Bug_FlagB_Spawn_Failure (#100)
Title: Cannot spawn on flag B in B+C-owned-without-A ownership state — Godot spawner limitation

Observed (2026-04-25, user punch list):
- Players unable to deploy onto flag B from the deploy screen. Symptom: clicking flag B on the deploy screen does not produce a spawn at the flag (or spawns at a fallback location instead).
- Suspected origin: Godot spatial configuration for the flag B `CapturePoint` object — possibly a misconfigured spawn-point reference or a missing/disabled `PlayerSpawner` association on the captured-by-team state of that point.

Repro narrowed (2026-05-03, user clarification):
- The failure fires **only when the team owns flag B + flag C but NOT flag A**. Other ownership topologies (B alone, B+A, all three) work as expected.
- This is a Godot-side spawner limitation in how flag B's spawn associations resolve when the upstream-ownership chain skips A. Not a script-side configuration issue (`getActiveCapturePointConfigByObjId` returns a valid config; the script is already wired correctly).

Resolution plan:
- **Deferred to custom player spawner system.** Rather than spot-patching this single ownership topology in the current Godot-driven spawner, the fix will land with the planned custom player spawner — which gives us full control over per-team / per-flag spawn association and removes the dependency on Godot's built-in spawner behavior. Spec for the custom spawner is out of scope for V1; tracked separately.
- In the meantime: surfaced on the player-facing known-issues list so players can avoid the failure mode mid-match (work around by capturing A or losing C to restore expected ownership topology).

Investigation notes (retained for archive):
- Compared flag B's spatial entry against flag A and flag C in `MP_TWL_Conquest16_FireStorm.spatial.json` — no obvious structural diff explains the topology-conditional failure, supporting the "Godot spawner internal logic" hypothesis.
- The recently-shipped #98 (flag-spawn default-in-bounds) only fixed the post-spawn OOB path; it does not affect the spawn-mechanism itself. B's failure is a separate root cause.

Status: **Open — deferred to custom player spawner system (2026-05-03).** Surfaced on the player-known-issues page; not in active code-side investigation pending the custom spawner architecture.

Related:
- `CQ_Bug_FlagSpawn_FalsePositive_OOB` (#98) — adjacent flag-spawn bug; resolved at v1.376. Different root cause from this issue.
- `CQ_Bug_Oil_Tanker_In_Ground_B` (#88) — also at flag B, also Godot-side. Worth investigating together.

## CQ_Tweak_Vehicle_Display_Name_Defaults (#101)
Title: Update default vehicle display names — add faction tags to Flyer and Vector

Observed (2026-04-25, user punch list):
- Default vehicle display names in [`strings.json`](../src/strings.json) currently use bare model names: `Flyer 60`, `Vector`. User direction: tag these with faction affiliation — Flyer 60 → NATO variant, Vector → PAX variant.
- Affects ready-dialog vehicle column display, deploy-timer HUD vehicle labels, and any world-log messages that reference vehicle short names.

Proposed string changes (player-facing — needs explicit user approval per AGENTS.md `String Change Authorization Policy`):
- `twl.readyDialog.vehicleShortFlyer60`: `"Flyer 60"` → `"Flyer 60 NATO"` (or similar)
- `twl.readyDialog.vehicleShortVector`: `"Vector"` → `"Vector PAX"` (or similar)

Implementation: pure string update in `strings.json`. No code change. Bundle impact: ~+10 bytes.

Status: **Open — pending approved string copy from user.**

Related:
- `CQ_Tweak_Team_Names_Add_Faction` (#102) — companion: append PAX/NATO suffix to the team names, same faction-affiliation rationale.

## CQ_Tweak_Team_Names_Add_Faction (#102)
Title: Append PAX / NATO faction suffix to team names

Observed (2026-04-25, user punch list):
- Current team names in [`strings.json`](../src/strings.json) are bare directional strings: `WEST`, `EAST`, `NORTH`, `SOUTH` (under `twl.teams`). User direction: append the faction (PAX or NATO) so team identity is unambiguous in HUD/log output.

Resolution shipped at v1.377:
- Added 8 new combo entries to `twl.teams` in [`strings.json:60-73`](../src/strings.json#L60), keeping the original 4 bare directionals: total 12 selectable team-name keys.
  - Combos: `WEST_NATO`, `WEST_PAX`, `EAST_NATO`, `EAST_PAX`, `NORTH_NATO`, `NORTH_PAX`, `SOUTH_NATO`, `SOUTH_PAX` — each rendered as e.g. `"WEST / NATO"` (user-approved format with spaces around the slash).
  - The 4 bare entries (`WEST`, `EAST`, `NORTH`, `SOUTH`) are preserved so a map can opt out of the faction tag entirely.
- Updated Firestorm map config at [`config/maps/operation-firestorm.ts:10-11`](../src/config/maps/operation-firestorm.ts#L10) to default to `WEST_NATO` (Team 1) + `EAST_PAX` (Team 2). Easy to flip to any other combo per-map.
- Existing consumers ([`id-helpers.ts:129-130`](../src/state/id-helpers.ts#L129)) read `ACTIVE_MAP_CONFIG?.team1Name` / `.team2Name` and resolve via `mod.Message(key)` — no code change required since the field is `number` (string-key id) and any of the 12 keys is valid.
- The pre-composed approach was chosen over runtime composition because `mod.Message` format args accept `string | number | Player` only (no nested `mod.Message` objects per AGENTS.md), so composing direction + faction at runtime would require either passing literal strings (loses any future i18n hook) or a `mod.Message` rewrite at every consumer site. Pre-composed entries keep the existing `team1Name: number` shape and let map authors pick from a fixed menu.

Bundle delta v1.376 → v1.377: **+9 bytes** (1.43% headroom — strings live in the bundled `dist/bundle.strings.json`, not the script bundle, so the cost is near-zero).

To change a map's team faction:
- Pick any of the 12 keys: `mod.stringkeys.twl.teams.WEST` / `WEST_NATO` / `WEST_PAX` / `EAST` / `EAST_NATO` / ... etc.
- Set in the map config's `team1Name` / `team2Name` fields. Per-team independence: Team 1 can be NATO while Team 2 is PAX, or both same faction, or both bare directionals.

Status: **Resolved (v1.377) pending MP confirmation.**

Related:
- `CQ_Tweak_Vehicle_Display_Name_Defaults` (#101) — companion faction-tagging on vehicle names; same string-approval policy applies; not yet implemented.

## CQ_Tweak_Bleed_Rate_Mancours_Calibration (#103)
Title: Recalibrate ticket bleed rates against Mancours-style reference rates

Observed (2026-04-25, user punch list):
- Current ticket bleed configuration (in [`config/conquest-constants.ts`](../src/config/conquest-constants.ts) — see `BLEED_*` / ticket constants) is a first-cut tuning. User direction: align rates against Mancours reference values to produce a more recognizable / classic Conquest pacing.

Investigation steps:
1. Capture current bleed parameters (rate per second, asymmetric thresholds, multiplier on differential ownership).
2. Source Mancours reference rates (presumably from a known Battlefield community-tuned config).
3. Map Mancours values onto our tick / scoring model.
4. Playtest to feel-check.

Implementation: parameter-tuning only (numeric constants in `config/conquest-constants.ts`). No structural change.

Open question: design — TBD. Specific Mancours target values not yet sourced.

Status: **Open — design TBD; needs reference-rate sourcing.**

Related:
- Existing bleed system: `applyBleedTick` in [`index/capture-tickets.ts`](../src/index/capture-tickets.ts). Per-second tick gated to live-match. Tunable via `BLEED_*` constants.
- `design_doc/bleed_tuning.md` — historical bleed tuning notes (review for prior calibration baselines).

## CQ_Audit_Weapon_Gadget_Bans (#104)
Title: Re-review the current weapon / gadget ban list against current design intent

Observed (2026-04-25, user punch list):
- Tip 7 in the join prompt currently states: *"All gadgets except torch and supply crates are banned."* This was set early in the design and may no longer reflect current intent (the v1.290–v1.313 gadget locker rework, plus the v1.325 Supply Boxes wiring, plus v1.328 Forward Deploy / v1.329 Air Deploy reintroductions, all expand the gameplay surface beyond "torch + supply crates only").
- User wants a fresh review of which weapons / gadgets are allowed vs banned, and whether the join-prompt copy is still accurate.

Investigation steps:
1. Enumerate currently-banned weapons / gadgets (likely in `config/conquest-constants.ts` or a similar feature-flag block).
2. Cross-check against the gadget locker offerings (assault / medic / engineer / recon trays — see `ACTIVE_GADGET_CONFIG` in [`interaction/ammo-resupply-menu.ts`](../src/interaction/ammo-resupply-menu.ts)) and the launcher rows.
3. Identify discrepancies: gadgets the locker offers that the ban list says are forbidden, or vice versa.
4. Update Tip 7 copy to match (player-facing string — needs approval per AGENTS.md).

Status: **Open — needs audit + design pass.**

Related:
- `CQ_Refactor_Gadget_Locker_v1.290_to_v1.313` (#77) — the gadget locker rewrite that expanded the offered surface.
- `CQ_Feat_Round_Start_Gadget_Delay` (#59) — gadget round-start delay implementation; orthogonal but related to the gadget surface design.

## CQ_Bug_HardCrash_LateJoiner_ApplyConfig (#105)
Title: Hard server-process crash during late-joiner + Apply Configuration + team-swap combo

Observed (2026-04-26, v1.380):
- User-reported hard server crash (whole server process died, all players disconnected, game ended). No visible error log captured before the crash. Pre-LIVE phase (Apply Configuration was legal). Scenario: one or more players joining the server for the first time **while** another player applied map configuration changes and/or swapped teams.
- User intuition: "we're changing the configuration out from under the late joiner while they load or cache the UI."

Theory of the crash:
- Apply Configuration's per-player rebuild paths — `prebuildAndRevealVehicleDeployTimerHudForAllPlayers` ([deploy-timer-ui.ts:2042](../src/vehicles/deploy-timer-ui.ts#L2042)), `cleanupActiveWorldInteractableRuntimeIconsForAllPlayers` ([world-interactables.ts:349](../src/interaction/world-interactables.ts#L349)), `applyVehicleSpawnSpecsToExistingSlots` ([map-runtime.ts:589](../src/config/map-runtime.ts#L589)) — all iterate over every connected pid via `forEachValidPlayer` and operate on per-player UI cache state.
- A late-joiner whose own `prebuildAllUiFamiliesHidden` is mid-flight has a partially-populated UI cache (some widget handles cached, others uninitialized).
- When Apply Config's parallel rebuild operates on the late-joiner's pid, the two parallel widget-tree mutations collide. Engine-level invalid-handle operations on a half-built widget tree (or `mod.UnspawnObject` on a half-wired runtime spawn) are the documented hard-crash pattern in BF6 Portal — the script try/catch does not catch engine faults.
- The hard-process death + pre-LIVE phase + no-error-log signature is most consistent with this theory.

Resolution shipped at v1.381:
- New per-pid state field `State.players.warmPrimeActiveByPid: Record<number, boolean>` ([runtime-types.ts](../src/state/runtime-types.ts), [runtime-state.ts](../src/state/runtime-state.ts)).
- `prebuildAllUiFamiliesHidden` ([interaction/actions.ts:264](../src/interaction/actions.ts#L264)) wrapped in an outer `try { warmPrimeActiveByPid[pid] = true; ...existing body... } finally { delete warmPrimeActiveByPid[pid]; }`. The flag is set at function entry (covering the lock-wait phase) and cleared in the outer `finally` so disconnect / throw / early-return all guarantee the flag clears.
- `confirmReadyDialogModeConfig` ([ready-dialog/mode-config-presets.ts:294](../src/ready-dialog/mode-config-presets.ts#L294)) now refuses Apply with a player-visible world-log message when any pid has `warmPrimeActiveByPid[pid] === true`. The dialog state remains "Unsaved changes" so the user can press Apply again once loaders settle.
- New player-facing string `twl.readyDialog.applyBlockedLoading` = `"Cannot apply: {0} player(s) still loading"` (user-approved 2026-04-26).
- `player-join-leave.ts` cleanup path also `delete`s the flag so a disconnect mid-warm cannot permanently block applies.
- Bundle delta v1.380 → v1.381: **+668 bytes** (1.31% headroom).

What this does NOT cover (followup-eligible):
- A late-joiner whose warm-prime starts AFTER Apply Configuration begins. If a join lands during the ~1-2 second window where Apply Config's rebuild iterations are running, the guard does not protect. If the crash recurs, the symmetric guard would be: have the warm-prime path also check `applyConfigInFlight` and yield/wait. Capture as a follow-up if needed.
- Team-swap mid-Apply collisions. Same logic could extend to refuse team-swap-during-Apply, but the user's reported crash specifically called out late-joiner.
- Generic instrumentation. No diagnostic world-log sentinels added in this iteration.

Status: **Resolved (v1.382) pending MP confirmation — fix mechanism replaced in v1.418 (Wave 3 Ship 8).**

v1.382 follow-up: moved the rejection message from `sendHighlightedWorldLogMessage` (world-log overlay) to the dialog's inline `unsavedLabel` red-text slot — same widget that normally renders "Unsaved changes! Press 'Apply Configuration' to save" / "Round live. Config locked." Added `applyBlockedAtSeconds` + `applyBlockedCount` fields to `ReadyDialogModeConfig` ([foundation/gameplay.ts:124](../src/foundation/gameplay.ts#L124)) and `APPLY_BLOCKED_LABEL_DURATION_SECONDS = 5` constant. `confirmReadyDialogModeConfig`'s guard branch now sets the timestamp + count, calls `updateReadyDialogModeConfigForAllVisibleViewers()`, and schedules a deferred clear after 5s. `syncReadyDialogModeActionWidgetsForPid` ([ready-dialog/mode-config-readout.ts:167](../src/ready-dialog/mode-config-readout.ts#L167)) checks the timestamp first and renders the block message before falling through to live/unsaved logic. Rationale: world-log message was easy to miss; the dialog slot is where the user is already looking when they press Apply.

v1.418 update (Wave 3 Ship 8): the entire fix machinery was deleted along with the loading-gate. Specifically: `warmPrimeActiveByPid` flag (deleted from `runtime-state.ts` + `runtime-types.ts`), the Apply-blocked-loading guard branch in `confirmReadyDialogModeConfig` (deleted; `mode-config-presets.ts` simplified), `prebuildAllUiFamiliesHidden` itself (deleted from `actions.ts`), and the join-leave cleanup site for the flag. The `applyBlockedAtSeconds` / `applyBlockedCount` fields and the `applyBlockedLoading` string remain in shape but are never set (writers gone) — the dialog renderer's read branch is dead. The lazy-build dispatcher's per-surface in-flight guard (`_lazyBuildInFlightByName` in `lazy-build-registry.ts`) now serializes per-pid mid-build contention, but the original race condition (parallel widget-tree mutations from Apply Config vs. mid-warm late-joiner) has not been re-stressed at scale post-Ship-8. Reopen if the original hard-crash recurs in MP at 24+ players.

Verification:
1. Build clean (v1.381). Typecheck exit 0.
2. **No-regression (single-player):** Open Ready Dialog. Press Apply. Apply succeeds — no false "Cannot apply" message.
3. **Bug-fix path (multiplayer):** Two players. Player A joins (mid-warm). Within the warm window, Player B presses Apply. Confirm world-log shows "Cannot apply: 1 player(s) still loading"; Apply does NOT mutate state; "Unsaved changes" indicator remains. Player A finishes warm. Player B presses Apply again. Confirm Apply succeeds.
4. **Repro the original 64p+ scenario** (multiple late joiners + Apply + team swaps). Confirm no hard server crash.
5. **Disconnect resilience:** Player A joins, gets stuck mid-warm (force a network drop). Confirm `warmPrimeActiveByPid[A]` clears via the player-leave cleanup OR the `finally` block. Apply by Player B is not permanently blocked.

Related:
- Plan: [`design_doc/apply_config_late_joiner_guard_plan_2026-04-26.md`](./apply_config_late_joiner_guard_plan_2026-04-26.md).
- `CQ_Bug_40` (#40, v1.104) — earlier serialization-lock fix for concurrent first-join `prebuildAllUiFamiliesHidden`. The `_prebuildBusy` lock prevents concurrent join-vs-join collisions; #105 closes the join-vs-Apply-Config collision left open by that fix.
- `CQ_Feat_Phase6_HQ_Deploy` (#75) — earlier example of cross-player state mutation that needed careful sequencing.

## CQ_Bug_HighSev_Y200_OOB_HeliSlot2_SeatKindStale (#106)
Title: Players in AH-6M (heli slot 2) marked OOB at Y=200 ceiling — `seatKind` cache stuck at `on_foot`

Observed (2026-04-26, v1.382):
- Three different players walked into the AH-6M heli on heli slot 2 during a live round, flew up, and were marked out-of-bounds at the Y=200 aircraft-bail ceiling. None squad-spawned directly into the chopper — all entered on foot from outside.
- Y=200 OOB check at [enforcement.ts:252-258](../src/boundary/enforcement.ts#L252-L258) only fires when `state.seatKind === "on_foot"` (line 252). For three players in the heli to hit the OOB, all three must have had `seatKind = "on_foot"` cached while physically in the aircraft.

Root cause theory:
- `seatKind` is owned by `setPlayerSeatKind` ([enforcement.ts:159](../src/boundary/enforcement.ts#L159)). The three writers are: `OnPlayerEnterVehicle` ([index.ts:170](../src/index.ts#L170) → [vehicle-events.ts:6](../src/index/vehicle-events.ts#L6)) which classifies via `classifyVehicleSeatKind`, `OnPlayerExitVehicle` ([vehicle-events.ts:36](../src/index/vehicle-events.ts#L36)) which sets back to `on_foot`, and the deploy-time seed `seedZoneStateFromSpawnContext` (only fires on fresh deploy, not on walk-in).
- `classifyVehicleSeatKind` defaults to `"ground_vehicle"` on a slot-binding miss — that would NOT trigger the on_foot Y=200 path. So this is not a binding gap; `seatKind` was actually `"on_foot"`.
- Most likely cause: `OnPlayerEnterVehicle` did not fire when the players entered the AH-6M heli slot 2. Engine-side event reliability gap in the same family as `CQ_Bug_43` (`mod.CompareVehicleName` returning unreliable results). Less likely: phantom `OnPlayerExitVehicle` mid-flight, or stale engine read at deploy seed.

Resolution shipped at v1.383 (Resolved (v1.383) pending MP confirmation):
- Safety-net engine re-probe in `getDesiredBoundaryViolationKind` ([enforcement.ts:252-265](../src/boundary/enforcement.ts#L252-L265)). When the on_foot Y>200 branch is about to fire OOB, re-probe `mod.SoldierStateBool.IsInVehicle`. If the engine reports the player IS in a vehicle, self-correct the cache via `setPlayerSeatKind(player, "aircraft")` and exempt this tick. The corrected cache means the aircraft early-return at line 247 short-circuits future ticks, so the re-probe runs at most once per missed enter event.
- Single-writer paradigm preserved: the safety-net calls the same `setPlayerSeatKind` writer used by the enter/exit events. The recursive `refreshPlayerBoundaryState` call from inside the classifier terminates immediately on the aircraft early-return — safe but a one-deep recursion.

What this does NOT cover:
- Does not address the root cause (missing `OnPlayerEnterVehicle` event). If the safety-net trips repeatedly in MP, recommend Phase A: add a one-shot diagnostic world-log when the safety-net fires, capturing pid + vehicle objId + slot, to identify which slot/vehicle types the engine is missing on.
- Symmetric concern (`OnPlayerExitVehicle` missing → cache stuck at `aircraft` for an on-foot player) not addressed by this fix. Less dangerous because the worst case is a player escaping OOB enforcement, not a false-positive OOB.

Verification:
1. Build clean. Typecheck exit 0.
2. **No-regression:** legitimate on-foot bail above Y=200 (player exits aircraft mid-flight) still triggers OOB. The re-probe returns false in that case (engine confirms not in vehicle), so the original `return "ground_combat_zone"` path runs.
3. **Bug-fix path (MP repro):** repro the original AH-6M heli slot 2 walk-in scenario. Confirm players are no longer OOB'd at Y=200 while inside the heli.

Status: **Resolved (v1.383) pending MP confirmation.** Leave open until manual MP repro confirms players in heli slot 2 no longer hit Y=200 OOB.

Related:
- `CQ_Bug_43` — `mod.CompareVehicleName` engine reliability gap. Same family of engine-side reliability issue.
- `CQ_Bug_AircraftBail_OOB` — original Y=200 ceiling enforcement design. This fix adds a safety-net to that mechanism without changing the policy.

## CQ_Tweak_SpawnCharge_Exempt_Vehicle_And_TeamSwitch (#107)
Title: Exempt voluntary UX redeploys from Phase 2B spawn-charge ticket cost

Observed (2026-04-26, v1.392):
- During pre-playtest bleed-rate calibration discussion (#103), surfaced that vehicle HQ-Deploy / Forward-Deploy / Air-Deploy from on-foot was firing a chargeable redeploy event despite the player not having died. The player was alive, voluntarily grabbed a vehicle, and lost a ticket from their team. Same gap applied to pre-game and live team-swaps — the team_switch reason was wired but still charged tickets.
- Phase 2B spawn-charge model ([spawn-charge.ts:197 `onPlayerDeployedSpawnCharge`](../src/state/spawn-charge.ts#L197)) charged on every deploy event with no per-reason exempt mechanism. All 6 reasons (`deploy`, `forced_redeploy`, `team_switch`, `admin_move`, `phase_transition`, `reconnect`) charged equally.

Resolution shipped at v1.393:
- Added `"vehicle_deploy"` as a 7th reason in the `ConquestSpawnChargeReason` union ([runtime-types.ts:139-146](../src/state/runtime-types.ts#L139-L146)).
- Updated all 4 reason-counter initializers (`runtime-state.ts`, `conquest-scaffold.ts`, `spawn-charge.ts:NewReasonCounterState`) and the reason-code/total enumerations.
- In `onPlayerDeployedSpawnCharge`, after `IncrementReasonCounter` (so diagnostic counts still track the deploy) but before the charge logic, early-return when `reason === "vehicle_deploy" || reason === "team_switch"`.
- In `hq-deploy.ts:289-295` on-foot branch, added `markNextDeployReason(pid, "vehicle_deploy")` before `mod.SetRedeployTime` / `mod.UndeployPlayer`. The `team_switch` reason was already wired at [actions.ts:752](../src/interaction/actions.ts#L752) — no marker change needed there, only the exempt-set in the charge function picks it up.
- Bundle delta v1.392 → v1.393: **+397 bytes** (slightly above the ~140-200 estimate due to expanded counter initializers across 4 files).

Behavior change matrix:

| Action | v1.392 | v1.393 |
|---|---|---|
| Death → on-foot respawn | 1 ticket | 1 ticket |
| Voluntary suicide → respawn | 1 ticket | 1 ticket |
| Alive on-foot → HQ Deploy a vehicle | 1 ticket | **0 tickets** |
| Alive on-foot → Forward Deploy | 1 ticket | **0 tickets** |
| Alive on-foot → Air Deploy | 1 ticket | **0 tickets** |
| Pre-game / live team-swap | 1 ticket | **0 tickets** |
| Forced admin redeploy | 1 ticket | 1 ticket |
| Reconnect after disconnect | 1 ticket | 1 ticket |

Diagnostic preservation: `deployCountByReason.vehicle_deploy` still increments for every vehicle deploy event (and `team_switch` was already counted), so admin perfDiag tracking is complete. Only `chargedCountByReason` reflects actual ticket impact, which is unchanged for charged reasons.

What this does NOT cover:
- Death → vehicle deploy from the `slot.hqSource === "deploy_menu"` branch (player was dead and selected vehicle from the deploy screen) still charges 1 ticket. Correct behavior — the player consumed a death-respawn anyway.
- The `forced_redeploy`, `admin_move`, `phase_transition`, `reconnect` reasons remain charged. These represent involuntary or death-equivalent events.

Status: **Resolved (v1.393) pending MP confirmation.** Watch playtest for any unintended 0-ticket deploys (e.g., a deploy_menu path mis-marked as vehicle_deploy).

Related:
- Plan: [`design_doc/spawn_charge_exempt_reasons_plan_2026-04-26.md`](./spawn_charge_exempt_reasons_plan_2026-04-26.md).
- `#103 CQ_Tweak_Bleed_Rate_Mancours_Calibration` — companion playtest tuning. Bleed math + spawn-charge math together determine match length.
- Plan companion: [`design_doc/bleed_rate_mancours_calibration_plan_2026-04-26.md`](./bleed_rate_mancours_calibration_plan_2026-04-26.md).

## CQ_Tweak_HQ_SupplyBox_Disable_OnLive (#108)
Title: HQ supply boxes auto-disable when match goes LIVE; non-HQ boxes remain available

Observed (2026-04-26, v1.393):
- All 8 supply boxes on Operation Firestorm were equally available pre-LIVE and during LIVE. Two of those (objIds 1056 at Team1 HQ, 1057 at Team2 HQ) sit inside each team's main base. User wants players to leave their HQ for resupply during live play — that means hiding the in-HQ resupply convenience once the match starts.
- All 8 boxes share `ownerTeamId: 0` and `vfx: VFX_YELLOW_SMOKE`; HQ ones are differentiated only by position (~35-40m from each team-base anchor). No existing classifier for "HQ supply box" in the config.

Resolution shipped at v1.394:
- New optional flag `disableOnLive?: boolean` on `WorldInteractableAnchorConfig` and `WorldInteractableConfig` ([config/types.ts](../src/config/types.ts)). Generic by design — any future map can mark any interactable with this flag.
- Set `disableOnLive: true` on the two HQ supply box anchors (objIds 1056, 1057) in [`config/maps/operation-firestorm.ts`](../src/config/maps/operation-firestorm.ts). Other 6 anchors (1050-1055, at flags / between flags) unchanged.
- `buildWorldInteractableConfigsFromMapConfig` ([config/map-runtime.ts](../src/config/map-runtime.ts)) now carries `disableOnLive` from anchor → runtime config.
- New helper `isWorldInteractableDisabledByLive(config)` in [`interaction/world-interactables.ts`](../src/interaction/world-interactables.ts) — returns true when `config.disableOnLive === true && isMatchLive()`. Integrated at three gate sites: `shouldEnableWorldInteractableAuthoredInteractPoint`, `spawnWorldInteractableVfxForActiveConfigs`, `ensureWorldInteractableVfxForConfig`.
- New `refreshDisableOnLiveInteractableStateForLiveTransition()` iterates active configs and immediately disables interact-point + despawns VFX for every flagged entry. Called from `startMatch` ([conquest-flow.ts:33](../src/conquest-flow.ts#L33)) right after `cleanupMainBaseTeamWorldIconsForLiveTransition()` so the transition is snappy (<frame), not gated on the per-second refresh cadence.
- Bundle delta v1.393 → v1.394: **+1,160 bytes** (above the ~250-byte estimate; helper + 3 gate sites + refresh function + carry-through compounded more than projected).

What this does NOT cover:
- **Re-enable on match end.** When a match ends and resets to NotReady, the existing per-second refresh paths will pick up the new `!isMatchLive()` state and re-enable. May need an explicit refresh call at match-end if there's a visible delay; defer to playtest.
- **Other maps.** Only Firestorm has `disableOnLive: true` set today. New maps choose their own flagging.
- **Visual polish.** VFX unspawns instantly at the live transition (no fade/dissolve). If jarring, add `mod.EnableVFX(vfx, false)` followed by a delayed unspawn in a follow-up.

Status: **Resolved (v1.394) pending MP confirmation.**

Verification (pre-playtest):
1. Build clean. Typecheck exit 0.
2. Pre-LIVE: open Ready Dialog, do not start. All 8 supply boxes have yellow smoke and are interactable.
3. Match-live transition: start match. Within 1s of LIVE, smoke disappears at HQ (1056, 1057); interact prompt no longer appears at the HQ boxes.
4. Non-HQ unchanged: confirm the 6 flag/between-flag boxes (1050-1055) still have smoke and remain interactable during LIVE.
5. End match → next pre-LIVE phase: HQ supply boxes re-appear.
6. Apply Config + Supply Boxes toggle interaction: toggle Supply Boxes off → all 8 disappear; toggle on → all 8 reappear pre-LIVE; start match → only 6 remain. Verifies orthogonality of the two gates.

Related:
- Plan: [`design_doc/hq_supply_box_disable_on_live_plan_2026-04-26.md`](./hq_supply_box_disable_on_live_plan_2026-04-26.md).

## CQ_Bug_16Player_Playtest_JS_Memory_Limit (#109)
Title: 16-player playtest terminated by Mod Evaluator JS script memory usage limit at script load

Observed (2026-04-27, v1.406, 16-player MP playtest):
- Mod Evaluator terminated the script with the engine error: `ERROR REPORTED BY MOD EVALUATOR WHILE RUNNING JS SCRIPT — Mod has reached its js script memory usage limit. It has been terminated`.
- Game was unplayable. Functionality and gameplay are confirmed-good in low-player-count testing; failure mode is purely capacity (memory budget) rather than logic.
- Bundle at v1.406 measures **872,014 bytes** (well below the 1,048,576-byte upload cap; ~17% headroom). Upload-cap pressure is **not** the failure axis — runtime JS heap is.

Symptom interpretation:
- The Portal Mod Evaluator enforces a script JS memory ceiling separate from the upload byte cap. The engine does not expose `mod.GetScriptMemory*` or comparable telemetry (verified against `reference_sdk_1.2.3/code/types/mod/index.d.ts`), so the budget is observed only at the boundary as termination.
- Capacity scales with **per-player heap multipliers** more than with bundle bytes. Module-level constants are paid once; per-player widget caches, view-model snapshots, and string formatters are paid N times. 16 players is the first time the project has stressed those multipliers in MP.

Suspected per-player allocation contributors (no isolated repro yet — ranking is by static-analysis weight):
1. **Per-player widget caches in `State.hudCache.*`** ([state/runtime-types.ts:496](../src/state/runtime-types.ts#L496)) — `topHudShellByPid`, `clockWidgetCache`, `countdownWidgetCache`, `vehicleDeployTimerCache`, `ammoResupplyMenuCache`, `boundaryPromptCache`. Each entry holds dozens-to-hundreds of cached `mod.UIWidget` references plus parallel "lastVisibleState"/"lastSig" diffing fields. The vehicle deploy timer alone ([state/hud-cache-types.ts:67](../src/state/hud-cache-types.ts#L67)) caches ~25 widget refs **per row × N rows** per player; the ammo-resupply menu cache ([state/hud-cache-types.ts:188](../src/state/hud-cache-types.ts#L188)) holds another large widget tree per player.
2. **Per-player view-model snapshots** ([state/runtime-types.ts:277-291](../src/state/runtime-types.ts#L277)) — `hudStatusVmByPid`, `hudHelpReadyVmByPid`, `hudClockVmByPid`. Object literals per pid that are rebuilt every dirty tick.
3. **Combat HUD entry graph** built per player by `twlConquestHudEnsurePlayerGraph` ([ui/conquest/hud-core/build.ts:198](../src/ui/conquest/hud-core/build.ts#L198)) — tickets / 3 flag slots / engage / clock / status — each with shadow-ring text widgets (multiple stacked widgets per glyph), retained for the player's session.
4. **`AmmoResupplyMenuCacheEntry.rows`** + `.a`/`.x`/`.q` charge arrays ([state/hud-cache-types.ts:188](../src/state/hud-cache-types.ts#L188)) — array-of-objects-of-widget-refs, sized by gadget config.
5. **Per-pid `Record<number, T>` maps in `State.players.*` and `State.conquest.debug.*`** — ~30+ per-pid records initialized lazily; each one of the 16 pids receives an object/array allocation across most of them.
6. **Module-level constants count** — bundle has **3,231 module-level `const` + 171 `let`** declarations (3,402 retained module-level identifiers). UI-layout constants alone account for **373** entries (`TWL_CONQUEST_HUD_*`, `CONQUEST_HUD_*`, `VEHICLE_HUD_*`, `READY_DIALOG_*`, `AMMO_RESUPPLY_*`, `GADGET_LOCKER_*`, `HUD_*`). These are paid once each but their cumulative retained set is large.
7. **Strings.json runtime asset** — `dist/bundle.strings.json` is 22,082 bytes, separate from the script cap, but **all** keys are loaded and held including ~5.2KB of dead `joinPrompt.*` keys (FEATURE_JOIN_PROMPT=false strips TS code, NOT strings — see Cat 8.1 in optimization analysis). Estimated ~8.8KB of dead strings still resident.
8. **Closures captured by `Timers.setTimeout` and `mod.Wait` continuations** in mega-files (`actions.ts`, `vanilla-spawner.ts`, `hq-deploy.ts`, `ammo-resupply-menu.ts`). Each pending continuation retains its enclosing scope; many of these capture a `pid`, a `player`, and incidental local objects that prevent GC of those frames.

Investigation deferred to optimization pass (this branch):
- This branch's purpose is documentation + analysis only. No source code changes in this pass.
- The optimization analysis at [`design_doc/conquest_optimization_analysis.md`](./conquest_optimization_analysis.md) is being re-issued with a memory-focused lens: dead code, variable hygiene, helper extraction, and per-player allocation reduction.
- Functionality-preserving cleanup must not change UI look, gameplay behavior, or any feature surface. Variables retained ONLY when they (a) need to be modified at runtime due to dynamic events (resolution change, spatial movement, dynamic re-config) or (b) are forward-facing tuning knobs. Variables existing solely to cache an immutable inline value should be inlined.

Status: **Awaiting MP confirmation (Wave 3 complete, 2026-05-01).** Wave 3 (v1.409–v1.418) targeted the per-pid allocation contributors directly — every UI surface now builds via `triggerLazyBuild` only when used, the loading-gate machinery + per-pid gate state is deleted, `readyDialogData_t` lost 18 fields, `warmPrimeActiveByPid` removed, ~30 `hud-warm-state.ts` accessors deleted. Bundle 877,390 → 847,898 bytes (−29,492); per-pid heap shape collapsed substantially more. Verification requires a 16+ player MP playtest (see `conquest_mp_ongoing_tests.md` Waves 3.1–3.8).

Pre-Wave-3 status: **Open — Critical (playtest-blocking).** No isolated repro; crash signature was "lifetime accumulation reaches budget"-shaped, not deterministic.

Verification (post-Wave-3):
1. Re-run a 24+ player playtest with v1.418 (or later). Goal: full match (start to victory dialog) without termination.
2. Capture engine error log immediately on termination if it recurs; note approximate elapsed seconds + connected pid count.
3. If recurs at 24+ players, the remaining contributors are likely M1 (`vehicleDeployTimerCache`, ~150–250 widget refs/pid) and the combat HUD entry graph. Wave 4 candidates would target those.

Related:
- [`conquest_optimization_analysis.md`](./conquest_optimization_analysis.md) — full reclaim inventory under #109 lens.
- `CQ_Refactor_forEachValidPlayer_Helper` (#64), `CQ_Perf_TickContext_AllPlayers_Cache` (#65), `CQ_Perf_Combat_HUD_Dirty_Gate` (#66) — prior performance work; reduced CPU per-tick but did not target heap.
- `CQ_Bug_40 CQ_Bug_Frame_Time_Budget_Exceeded` (#40) — earlier capacity issue (frame time, not memory). Same shape: stress at concurrent join.

## CQ_Bug_Console_DeployScreen_Vehicle_Buttons_Unresponsive (#113)
Title: Console / controller players cannot trigger HQ / Forward / Air Deploy from the deploy screen's Vehicle Deploy menu

**Status: Resolved (v1.465 + v1.466, 2026-05-04). Console MP playtest validation pending.**

### Originally observed (2026-05-03, console MP playtest)
- On controller, the SPAWN buttons in the Vehicle Deploy menu surfaced on the deploy screen did not respond correctly to controller input. The menu rendered correctly — rows visible, statuses correct, WAIT / READY labels accurate — but pressing A / X on a row resulted in the player being deployed on foot instead of into the requested vehicle (initially appearing as no response, then after v1.465 partial fix as "vehicle spawns but player still on foot").
- The same menu opened on-foot via the purple smoke triple-tap at HQ worked correctly on console.
- PC mouse input worked in both contexts (deploy screen + on-foot live terminal).

### Investigation arc and actual root cause

**Initial hypothesis (incorrect).** The first investigation suspected an input-mode / cursor-routing gap: the live-terminal path in `tryOpenVehicleDeployLiveMenuForPlayer` ([`src/vehicles/deploy-live-menu.ts:74`](../src/vehicles/deploy-live-menu.ts#L74)) explicitly calls `setUIInputModeForPlayer(eventPlayer, true)` before revealing the HUD family, while the deploy-screen reveal path (via `revealVehicleDeployTimerHudForPlayer` called from `renderCriticalHudForReveal` in [`src/interaction/actions.ts`](../src/interaction/actions.ts)) does not. This was a reasonable guess but turned out to be wrong — the click WAS being received on console, just consumed by the wrong action.

**Actual root cause (discovered 2026-05-04 during the precise button comparison work in [`conquest_vehicle_deploy_comparisons.md`](./conquest_vehicle_deploy_comparisons.md) §4.5).** The Vehicle Deploy buttons enabled all 6 `mod.UIButtonEvent` types but only fired the spawn-request action inside the `ButtonUp` handler at [`src/vehicles/deploy-timer-ui.ts:1633`](../src/vehicles/deploy-timer-ui.ts#L1633). The team-swap button — which always worked on console — fired on the first primary-click event (`ButtonDown` or `ButtonUp`) via the `tryConsumeUIButtonPrimaryClickEvent` dedupe helper at [`src/interaction/ui-primary-click.ts:54`](../src/interaction/ui-primary-click.ts#L54). On console, the engine's "deploy on foot" controller action shares the same physical button as UI clicks; firing the spawn action on `ButtonUp` meant the engine's deploy-on-foot completed first, and the spawn request either never fired (if `ButtonUp` was lost in the deploy-screen-dismissed context) or fired against an already-deployed player (where the seat hook would no-op).

### Two-ship resolution

**v1.465 (ButtonDown dedupe).** Plan: [`5.04.26_conquest_vehicle_deploy_buttondown_fix_plan.md`](./5.04.26_conquest_vehicle_deploy_buttondown_fix_plan.md). Replaced the `ButtonUp`-only firing in both the close button handler ([`src/vehicles/deploy-timer-ui.ts:1542-1546`](../src/vehicles/deploy-timer-ui.ts) pre-edit) and the action button handler with `tryConsumeUIButtonPrimaryClickEvent` calls. New module-local `vehicleDeployLastPrimaryClickByPid` tracker + module-local debounce / release-grace constants. Per-pid cleanup helper `resetVehicleDeployPrimaryClickTrackerForPid(pid)` paired with `cleanupHudForPid` in [`src/index/player-join-leave.ts`](../src/index/player-join-leave.ts). After v1.465: console click WAS recognized — the spawn request fired and the vehicle spawned — but the player still ended up deployed on foot because the engine's deploy-on-foot action completed before the vehicle finished spawning. The 10s claim timeout then sank the orphan vehicle.

**v1.466 (per-player engine deploy block).** Plan: [`5.04.26_conquest_vehicle_deploy_block_engine_deploy_plan.md`](./5.04.26_conquest_vehicle_deploy_block_engine_deploy_plan.md). Closes the residual race by blocking deploy-on-foot for the requesting player only, during the HQ-claim window. New centralized helper `setVehicleDeployEngineDeployBlockForPid(pid: number, blocked: boolean)` in [`src/vehicles/hq-deploy.ts`](../src/vehicles/hq-deploy.ts) — the single source of truth for the API call. Calls `mod.EnablePlayerDeploy(player, !blocked)` (the per-player API) and silently no-ops if the player has disconnected. **Per-player only** — never touches `mod.EnableAllPlayerDeploy` (the global gate owned by countdown-flow.ts and conquest-flow.ts).

Set sites (3 — gated on `source === "deploy_menu"`; on_foot path already has the player alive):
- `requestHqVehicleSpawn` ([line 132](../src/vehicles/hq-deploy.ts#L132))
- `requestForwardVehicleSpawn` ([line 231](../src/vehicles/hq-deploy.ts#L231))
- `requestAirVehicleSpawn` ([line 284](../src/vehicles/hq-deploy.ts#L284))

Clear sites (4):
- `beginHqSeatFlow` ([line 363](../src/vehicles/hq-deploy.ts#L363)) — load-bearing call IMMEDIATELY before `mod.DeployPlayer(player)` so the engine permits the deploy.
- `scheduleHqClaimTimeout` ([line 181](../src/vehicles/hq-deploy.ts#L181)) — paired with claim-timeout cleanup.
- `onHqSeatPendingPlayerDeployed` ([line 414](../src/vehicles/hq-deploy.ts#L414)) — defensive, idempotent with the `beginHqSeatFlow` call.
- `cleanupHudForPid` ([`src/index/player-join-leave.ts:80`](../src/index/player-join-leave.ts#L80)) — defensive on disconnect, prevents stuck per-player block from surviving pid recycling.

### Risk profile (post-v1.466)
- Worst-case stuck-on-deploy-screen window in normal flow: 10 seconds (the claim timeout). After 10s the timeout fires and re-enables.
- Edge case requiring two simultaneous events: admin force-restarts the match (which triggers global `EnableAllPlayerDeploy(false)` → `(true)` cycle) within the 10s window of an active claim, AND the global re-enable does not reset per-player flags. Verifiability is empirical; if observed in playtest, follow-up is to ensure the `scheduleHqClaimTimeout` always runs the enable as the last step regardless of early-return paths.
- Self-recovery: disconnect + reconnect always works (`cleanupHudForPid` defensive enable).

### Related
- Live-terminal entry path: `tryOpenVehicleDeployLiveMenuForPlayer` in [`src/vehicles/deploy-live-menu.ts`](../src/vehicles/deploy-live-menu.ts).
- Deploy-screen reveal path: `revealVehicleDeployTimerHudForPlayer` (called from `renderCriticalHudForReveal` in [`src/interaction/actions.ts`](../src/interaction/actions.ts)).
- Vehicle Deploy menu rendering: [`src/vehicles/deploy-timer-ui.ts`](../src/vehicles/deploy-timer-ui.ts).
- Click routing dispatcher: `tryHandleVehicleDeployTimerButtonEvent` in [`src/vehicles/deploy-timer-ui.ts`](../src/vehicles/deploy-timer-ui.ts).
- Dedupe helper: `tryConsumeUIButtonPrimaryClickEvent` in [`src/interaction/ui-primary-click.ts`](../src/interaction/ui-primary-click.ts).
- Per-player API: `mod.EnablePlayerDeploy(player, bool)` — verified in [`reference_sdk_1.2.3/code/types/mod/index.d.ts:26394`](../../reference_sdk_1.2.3/code/types/mod/index.d.ts#L26394).
- Global API (NOT touched by this fix): `mod.EnableAllPlayerDeploy(bool)` — used by countdown-flow.ts and conquest-flow.ts for match-lifecycle gating.
- Architectural comparison: [`conquest_vehicle_deploy_comparisons.md`](./conquest_vehicle_deploy_comparisons.md) §4.5 documents BillDukes' opposite approach (`EnablePlayerDeploy(player, true)` + pre-seat teleport — banned in Conquest by the v1.106-v1.108 / v1.151-v1.154 aircraft OOB regression history).
- Player-facing surface: Custom Dialogs / Vehicle Deploy entries in [`conquest_player_design_documentation_features.md`](./conquest_player_design_documentation_features.md).

## CQ_Bug_LateJoin_LiveCrash_v1469 (#114)
Title: Silent server crash when a fresh 2nd-player late-joins during LIVE

**Status: Defenses shipped at v1.471 (Phase A + Phase B + Phase C bundled), pending MP repro validation.** Single repro at v1.469 (2026-05-04); never reproduced on retry.

### Observed (2026-05-04, v1.469, 2-player MP playtest)
- Server crashed **silently** — no error string surfaced, all players disconnected simultaneously.
- 2 players in the match (rules out heap pressure as the failure axis).
- Late-joiner came in during LIVE and joined the **same side** as the existing player.
- Approximate timing: "couple minutes" into the match (could be sub-2-min or more — not certain).
- **Fresh 2nd-player join — NOT a reconnect, no pid recycle in play.**
- **Player crashed before any action** — never deployed, never interacted. Crash window is the pre-deploy interval between engine-bind and the late-joiner's first input.
- Repro'd once, never reproduced on retry.

### Root cause analysis (none proven; 3 surviving suspects)

The "all players crashed simultaneously + silent + no error string" signature points to an engine-side abort triggered by a script call that hit an invalid state on a late-joiner-specific code path during the pre-deploy window. None of the suspects are individually proven; repro fragility means we likely cannot isolate cleanly. Plan archive (full suspect inventory, sequencing rationale): [`design_doc/5.04.26_late_join_crash_defense_plan.md`](./5.04.26_late_join_crash_defense_plan.md).

- **S1 — `OnPlayerJoinGame` async bare-forward (no try/catch).** [`src/index.ts:133`](../src/index.ts#L133) was bare-forwarded to `onPlayerJoinGameImpl`. After `await mod.Wait(0.1)` at [`src/index/player-join-leave.ts:127`](../src/index/player-join-leave.ts#L127), any throw becomes an unhandled rejection on the script context. Some Frostbite script runtimes treat unhandled rejection as fatal → server abort.
- **S2 — Cache-mutation race against `runRoundStartDelayHudLoop`.** The 1Hz iteration at [`src/vehicles/deploy-timer-ui.ts:1827-1837`](../src/vehicles/deploy-timer-ui.ts#L1827) walks `State.hudCache.vehicleDeployTimerCache`. Late-joiner appears in `mod.AllPlayers()` immediately on engine-bind. A tick can build a cache entry between bind and our T=0 handler, get it deleted at T=100ms by `resetUiForPlayerOnJoin`, then re-bound by the lazy-build cohort against engine-side widgets still tied to the deleted cache record — the classic stale-handle write that aborts on the engine side.
- **S3 — T=0 team-bind read on a late-joiner.** [`src/index/player-join-leave.ts:120`](../src/index/player-join-leave.ts#L120) called `safeGetTeamNumberFromPlayer(eventPlayer, 0)` BEFORE the 100ms wait. On a fresh late-join the engine may not have bound the team yet — read returns 0, `perspectiveTeamByPid[joinPid]` left undefined, downstream HUD code reads undefined for the rest of the session. Doesn't crash on its own; compounds with S2.
- ~~S4 — `OnPlayerDeployed` async bare-forward~~ **ELIMINATED** by user constraint: player never deployed.
- ~~S5 — `mod.SetRedeployTime` broadcast scope~~ **DROPPED** — was an unverified hypothesis incorrectly framed as a banked fact, not actual carry-over knowledge.

### Resolution shipped at v1.471 — three orthogonal defenses bundled

- **Phase A (S1):** [`src/index.ts:133-141`](../src/index.ts#L133-L141) — `OnPlayerJoinGame` wrapped in outer try/catch with `console.log` on the catch path. Converts an unhandled rejection (suspected silent script-runtime kill → engine abort) into a logged `[OnPlayerJoinGame] <message>` line. Both a candidate fix (if the crash mechanism is unhandled-rejection-as-fatal) AND a diagnostic enabler for the next repro.
- **Phase B (S2):** `delete State.hudCache.vehicleDeployTimerCache[pid]` relocated from inside `resetUiForPlayerOnJoin` (post-await, T=100ms) to [`onPlayerJoinGameImpl` sync prelude](../src/index/player-join-leave.ts#L131) (pre-await, T=0). Closes the race window where `runRoundStartDelayHudLoop` could fight the lazy-build cohort over a freshly-deleted cache record.
- **Phase C (S3):** [Post-await idempotent re-read](../src/index/player-join-leave.ts#L137-L144) of `perspectiveTeamByPid` — if the T=0 read returned 0, re-read after the 100ms wait. No-ops on normal joins.

Bundle delta v1.470 → v1.471: **+~1KB** (try/catch wrapper + relocated delete + post-await re-read block). Typecheck clean. SP smoke clean (user-confirmed 2026-05-05).

### What this does NOT cover (followup-eligible if recurs)

- **Wraps for `OnGameModeStarted` and `OnPlayerDeployed`** — the other two async exports. Both have the same structural defense gap as `OnPlayerJoinGame`, but neither fires in the late-joiner pre-deploy crash window. Out of scope for v1.471 per "don't add things beyond what the task requires" guidance. Documented in plan-doc as a follow-up if the next repro shifts the symptom.
- **Engine-side aborts triggered by `mod.*` calls inside `triggerLazyBuild`** whose try/catch wraps the JS exception but the engine asserts before JS sees it. These would NOT surface on the Phase A console line — would still be silent.
- **Per-tick iterations** (conquest tick, capture-tickets tick, scoreboardSyncTick, tickBoundaryEnforcement) hitting a late-joiner with partially-built per-pid state and triggering an engine assert through a stale-handle write.

### Verification

1. Build clean (v1.471). Typecheck exit 0.
2. **No-regression (single-player):** cold-launch, deploy, no console error, HUD builds normally. **User-confirmed clean (2026-05-05).**
3. **Bug-fix path (multiplayer — pending):** late-join during round-start delay window (Firestorm 0–120s) at varying times across ≥5 separate matches. See [`conquest_mp_ongoing_tests.md`](./conquest_mp_ongoing_tests.md) v1.471 section for the full 8-item MP validation list.

### Diagnostic instructions for next MP repro

If the crash recurs:
- **First check the runtime console for `[OnPlayerJoinGame] <error message>`.** Any such line is the **smoking gun** — it identifies the actual throw site inside `onPlayerJoinGameImpl`. Capture verbatim and file as a new instrumentation target.
- **If the crash is silent again despite the wrapper:** the throw is happening outside the wrapper's reach. Most likely vectors: (a) engine-side C++ assert from a `mod.*` call that aborts before JS sees the exception (Phase A would NOT log this — still silent); (b) per-tick iteration hitting partially-built late-joiner state. Investigation pivots to instrumenting sync engine calls during the pre-deploy window.

### Related
- Plan: [`5.04.26_late_join_crash_defense_plan.md`](./5.04.26_late_join_crash_defense_plan.md) — full suspect inventory, phase analysis, sequencing rationale.
- MP test list: [`conquest_mp_ongoing_tests.md`](./conquest_mp_ongoing_tests.md) v1.471 section — 8 MP validation items targeting each suspect.
- `CQ_Bug_HardCrash_LateJoiner_ApplyConfig` (#105) — earlier related crash. **Different scenario** (pre-LIVE, requires Apply Config + late-joiner UI cache collision); resolved v1.382, mechanism deleted v1.418 alongside loading-gate rearchitecture, race not re-stressed at scale post-Ship-8.
- `CQ_Bug_16Player_Playtest_JS_Memory_Limit` (#109) — different mechanism (heap accumulation, deterministic at scale), but similar "silent termination" surface symptom. v1.469 ruled out heap by 2-player count.

## CQ_Bug_LateJoin_During_Countdown (#115)
Title: Late-joiner during pregame countdown cancels it and locks out all watching players from deploying

**Status: Resolved (v1.474), MP-confirmed at 2 players (2026-05-08).** Targeted late-join repro test passed: P2 joined mid-countdown, countdown did not cancel, both players deployed at LIVE. Higher player counts + secondary tests (repeated late-joins, admin-reset-during-countdown, toggle-ready-off-during-countdown) remain pending future MP windows but the primary failure mode is closed.

### Observed
- A player late-joins during the live pregame countdown (20..19..LIVE!).
- The join handler does not explicitly initialize `State.players.readyByPid[joinPid]` — it stays `undefined`.
- Every countdown animation frame calls `isPregameCountdownStillValid` which calls `areAllActivePlayersReady`. The undefined ready value reads as falsy → check fails → coroutine bails.
- **All players who were watching the countdown are now stuck on the deploy screen with deploy disabled.** They cannot deploy and cannot ready-up to retrigger the countdown without admin intervention.

### Root cause
- [`src/ready-dialog/countdown-flow.ts:61`](../src/ready-dialog/countdown-flow.ts#L61) — `isPregameCountdownStillValid` rechecks `areAllActivePlayersReady()` every frame.
- Late-joiner's undefined `readyByPid` value fails this check.
- The bail paths in `runPregameCountdown` (lines 91-94, 111-114, 131-134, 138-141) clear `isActive` and hide the visual, but DO NOT call `mod.EnableAllPlayerDeploy(true)` or reset `lifecyclePhase` from `"COUNTDOWN"` to `"NOT_READY"`. The full cleanup only happens in `cancelPregameCountdown()` (lines 6-17), which is admin-only via `triggerFreshMatchSetup`.

### Resolution shipped at v1.474
- Removed the `areAllActivePlayersReady()` check from `isPregameCountdownStillValid` ([`countdown-flow.ts:61`](../src/ready-dialog/countdown-flow.ts#L61)). Countdown is now only abortable by:
  - Token mismatch (admin reset via `triggerFreshMatchSetup` → `cancelPregameCountdown` → token++; this path already does full cleanup).
  - `State.match.isEnded` (defensive).
  - `isMatchLive()` already true with `allowRoundActive` not set (defensive).
- The "ready" concept now stops applying once the countdown begins, per the design intent.
- The bail-path cleanup gap (lines 91-94 etc.) is unchanged but becomes unreachable in practice — token-mismatch bails only fire after `cancelPregameCountdown` already cleaned up.
- Bundle delta v1.473 → v1.474: minimal (1 line removed + 4-line explanatory comment).

### What this does NOT cover
- Ready button click handler is not disabled during countdown. Clicks during countdown still mutate `readyByPid` but no longer cancel the countdown — they're harmless. (User chose minimum scope.) A late-joiner who opens the ready dialog mid-countdown can see and click READY but the click has no functional effect — `tryAutoStartMatchIfAllReady` early-returns on `State.round.countdown.isActive === true`.
- Team-swap during countdown is not blocked. (User chose minimum scope.)
- The bail-path cleanup gap in `runPregameCountdown` is not patched. Defensive only — currently unreachable; would need patching if a future change re-introduces a non-token bail trigger.

### Verification
1. Build clean (v1.474). Typecheck exit 0.
2. **No-regression (single-player):** start a normal match — countdown plays through 20..LIVE!, players deploy normally.
3. **Bug-fix path (multiplayer — pending):** P1 readies up, countdown starts. P2 joins mid-countdown. Confirm countdown does NOT cancel; reaches LIVE; both players are deployable on the LIVE transition. See [`conquest_mp_ongoing_tests.md`](./conquest_mp_ongoing_tests.md) v1.474 section.
4. **Admin reset still works:** during an active countdown, admin clicks "Reset Match"; confirm `cancelPregameCountdown` runs full cleanup (deploy re-enabled, phase back to NOT_READY) and the lobby returns to normal pregame state.

### Related
- Plan archive: [`5.07.26_late_join_during_countdown_fix_plan.md`](./5.07.26_late_join_during_countdown_fix_plan.md) — full pre-flight findings, suspect analysis, fix rationale, follow-up scope.
- MP test list: [`conquest_mp_ongoing_tests.md`](./conquest_mp_ongoing_tests.md) v1.474 section — 4 MP validation items.
- `CQ_Bug_LateJoin_LiveCrash_v1469` (#114) — different late-join scenario (silent crash during LIVE pre-deploy window). Both relate to fragile late-joiner state handling but with distinct root causes.
