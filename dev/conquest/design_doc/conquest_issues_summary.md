# Conquest Issues — Summary Index

Last updated: 2026-04-21 (v1.338)

Cross-ref: Full detail, history, and investigation notes for each issue live in [`conquest_issues.md`](./conquest_issues.md). This doc is the at-a-glance index only.

## Status Table

| # | Name | Status | Last Tested | Summary |
|---|------|--------|-------------|---------|
| 1 | CQ_Bug_Ticket_Counter_Doubling | Resolved | v0.x | Duplicate ticket values during bleed caused by HUD ownership churn. |
| 2 | CQ_Bug_Neutral_Flag_Fill_Sliver | Resolved | v0.x | 1px fill sliver remained after neutralizing a flag. |
| 3 | CQ_Bug_PostSwap_Engage_HUD_FirstEntry | Open | v1.338 | First valid post-team-swap neutralization can fail to show Engage HUD. |
| 4 | CQ_Bug_Swap_HUD_Incremental_Rebuild | Resolved | v0.x | HUD appeared element-by-element after team swap. |
| 5 | CQ_Bug_Team_Swap_Crash | Resolved | v0.x | Swap-time crash during heavy HUD iteration. |
| 6 | CQ_Bug_Bleed_Chevrons_Not_Visible | Resolved | v0.x | Chevrons hidden until later lifecycle events. |
| 7 | CQ_Bug_Top_Row_Border_PopOut_Overlap | Resolved | v0.x | Active objective top-row border persisted during pop-out. |
| 8 | CQ_Bug_Differential_Stall_Neutralize_Recapture | Resolved | v0.x | Differential/bleed/chevron stalled at neutralize/recapture edges. |
| 9 | CQ_Bug_CrossPlayer_HUD_Clash | Resolved | v0.x | HUD elements redrew/clashed across players; root/name ownership drift. |
| 10 | CQ_Bug_Combat_HUD_DropShadow_Parity | Resolved | v0.440 | Core combat HUD text lacked legacy drop-shadow parity. |
| 11 | CQ_Bug_Help_Text_Reappears_After_Swap | Resolved | v0.434 | Help text reappeared mid-live after team swap. |
| 12 | CQ_Bug_Startup_TeamSwap_HUD_Ready_Latency | Resolved | v0.489 | Combat HUD and Ready dialog appeared after long delay on first spawn/swap. |
| 13 | CQ_Bug_MidRound_Combat_HUD_Disappear | Resolved | v0.491 | Combat HUD briefly disappeared during live play. |
| 14 | CQ_Bug_Engage_HUD_Stale_After_Death | Resolved | v0.495 | Engage HUD kept stale counts after player died on an objective. |
| 15 | CQ_Bug_FinalMinute_Clock_Disappear | Resolved | v0.510 | Final-minute clock fully disappeared instead of brief flicker. |
| 16 | CQ_Bug_Enemy_Terminal_VO_On_Point_Only | Open | v1.338 | Enemy terminal VO only heard when losing player stays on objective. |
| 17 | CQ_Bug_Marauder_Ground_Seat_Unreliable | Open | v1.338 | Marauder ground spawn does not reliably seat the player. |
| 18 | CQ_Bug_ReadyDialog_Admin_Log_Spam | Resolved | v0.732 | Ready-dialog open produced recurring engine/log error spam. |
| 19 | CQ_Bug_LateMatch_Deploy_Buttons_Disappear | Open | v1.338 | Deploy buttons vanish 5-10 min into MP; broader script degradation. |
| 20 | CQ_Bug_ReadyDialog_Roster_Stale_Live | Open | v1.338 | Roster In/Out base-state stops updating during live round. |
| 21 | CQ_Bug_ReadyDialog_Open_Latency | Resolved | v1.013 | Ready dialog could feel cold/delayed; needs MP confirmation. |
| 22 | CQ_Bug_MainBase_Ready_Deploy_WorldIcons | Resolved | v1.x | Main-base Ready/Deploy world icons had per-player visibility failures. |
| 23 | CQ_Bug_Live_Deploy_Terminal_Backplate_Drift | Resolved | v1.x | Live deploy terminal backplate drifted or shaded over controls. |
| 24 | CQ_Bug_Passive_Vehicle_HUD_Stale_After_Config_Apply | Resolved | v1.x | Passive deployed vehicle HUD did not refresh on config apply. |
| 25 | CQ_Bug_WorldIcon_PerPlayer_Visibility | Resolved | v1.064 | World icons only rendered for first player; AddUIIcon non-functional. |
| 26 | CQ_Bug_Passive_Vehicle_Menu_Hidden_After_Live_Air_Menu | Resolved | v1.025 | Passive vehicle menu stayed hidden after live air deploy menu closed. |
| 27 | CQ_Bug_Passive_Vehicle_Zero_Top_Slots_OnStart | Resolved | v1.025 | Empty vehicle top slots showed 0 values at round start. |
| 28 | CQ_Bug_Air_Deploy_Ground_Spawn_Wrong_Rotation | Open | v1.338 | Air deploy can spawn player on ground with wrong rotation. |
| 29 | CQ_Bug_Teleport_While_Live_Perf | Open | v1.338 | Suspected performance hitch when live players are teleported. |
| 30 | CQ_Bug_First_Time_Menu_Cold_Hitch | Resolved | v1.025 | First-time menu creation caused multi-second hitching on MP joins. |
| 31 | CQ_Bug_GadgetLocker_Deploy_Runtime_Errors | Obsolete | v1.313 | Post-gadget-locker runtime errors; underlying paths rewritten. |
| 32 | CQ_Bug_ReadyDialog_Flicker_On_First_Join | Open | v1.338 | Ready dialog briefly visible 1-2 frames before overlay fully occludes. |
| 33 | CQ_Bug_Loading_Overlay_Vanishes_On_Team_Swap | Open | v1.338 | Loading overlay briefly disappears during team swap. |
| 34 | CQ_Bug_Vehicle_Ground_Spawner_Rotation_PerMap | Mitigated | v1.141 | Firestorm orientations tuned; other maps still need pass. |
| 35 | CQ_Bug_EnableAllInputRestrictions_Spam | Resolved | v1.075 | Input-restriction spam on undeployed players during loading gate. |
| 36 | CQ_Bug_UndeployPlayer_On_Undeployed | Resolved | v1.071 | UndeployPlayer called on already-undeployed players during gate. |
| 37 | CQ_Bug_GetPlayerVehicleSeat_Invalid | Resolved | v1.076 | Cosmetic GetPlayerVehicleSeat engine errors during deploy transitions. |
| 38 | CQ_Bug_GetVehicleFromPlayer_Invalid | Resolved | v1.076 | Paired GetVehicleFromPlayer cosmetic error; same cache-guard fix. |
| 39 | CQ_Bug_UnspawnObject_Cosmetic_Log | Mitigated | v1.147 | All 14 UnspawnObject sites wrapped; engine still logs pre-catch. |
| 40 | CQ_Bug_Frame_Time_Budget_Exceeded | Needs MP Confirmation | v1.104 | Mod eval >1000ms during concurrent MP joins; prebuild serialized. |
| 41 | CQ_Bug_Central_Tick_Loop_AllPlayers | Needs MP Confirmation | v1.081 | All-player per-second polls replaced by self-terminating event loops. |
| 42 | CQ_Bug_CountOf_Undefined_Array | Needs MP Confirmation | v1.073 | CountOf called with undefined arrays; defensive guards added. |
| 43 | CQ_Bug_Cheetah_Gepard_Bind_Failure | Resolved | v1.133 | CompareVehicleName guard failed for Cheetah/Gepard; guard removed. |
| 44 | CQ_Bug_Deploy_Menu_Stale_After_Undeploy | Resolved | v1.143 | Deploy timer HUD not refreshed after undeploy from vehicle. |
| 45 | CQ_Bug_Transport_Slot_Relocate_Not_Applied | Mitigated | v1.138 | Knob-changed transport slot 4 spawner not relocated; Firestorm only. |
| 46 | CQ_Bug_Firestorm_Spawn_Rotations_Radians | Resolved | v1.127 | Jet/transport rotY authored in radians instead of degrees. |
| 47 | CQ_Bug_Admin_GroundDeployAll_Wrong_Type | Resolved | v1.137 | "Ground Deploy All" bypassed configure + bind pipeline. |
| 48 | CQ_Bug_Admin_Panel_Build_Errors | Resolved | v1.135 | Duplicate position-debug functions + missing setPerfDiagEnabled. |
| 49 | CQ_Bug_TankInTheAir_PrefabDefault | Obsolete | v1.259 | Fresh-aircraft runtime spawner bound prefab-default Abrams; path deleted. |
| 50 | CQ_Bug_Pre_Deploy_GetSoldierState_Error | Resolved | v1.148 | Reveal-path sync sample hit GetSoldierState pre-deploy. |
| 51 | CQ_Bug_PositionDebug_Admin_Toggle_Unstick | Resolved | v1.149 | Admin position-debug toggle reset on respawn/reveal. |
| 52 | CQ_Bug_ExpectingSpawn_Watchdog_Latch | Obsolete | v1.259 | expectingSpawn latched after 2s bind-tracker timeout; path deleted. |
| 53 | CQ_Bug_Air_Deploy_Flag_Or_Squadmate_Failure | Obsolete | v1.259 | Air deploy silent failure tied to deploy-screen selection; path deleted. |
| 54 | CQ_Bug_Fresh_Aircraft_PrefabDefault_Race | Obsolete | v1.259 | Runtime-spawner AutoSpawn race; per-click prefab instantiation deleted. |
| 55 | CQ_Bug_Air_Deploy_HQ_WorldIcons_Suppress | Obsolete | v1.259 | Air deploy left HQ icons visible; consumed-deploy branch deleted. |
| 56 | CQ_Bug_Kills_Counter_FriendlyFire | Needs MP Confirmation | v1.212 | Friendly-fire kills wrongly incremented Kills counter. |
| 57 | CQ_Feat_Forward_Deploy_FreeSpace | Resolved | v1.207 | Forward-deploy free-space guard + round-start delay gates. |
| 58 | CQ_Feat_Pregame_Countdown_Delay_Lines | Resolved | v1.209 | Staggered 3-line pregame countdown delay info + cache fix. |
| 59 | CQ_Feat_Round_Start_Gadget_Delay | Resolved | v1.211 | Gadget-locker round-start delay + dual-string status header. |
| 60 | CQ_Bug_Loading_Gate_Invariants | Resolved | v1.222 | Gate invariant asserts shipped then reverted; code audit closes. |
| 61 | CQ_Polish_MP_Validation_v1.214_to_v1.221 | Open | v1.338 | MP-only validation scenarios from stability/perf pass pending playtest. |
| 62 | CQ_Perf_Deploy_Timer_HotPath_SafeFind | Resolved | v1.215 | Cached loading-overlay flag + removed redundant safeFind. |
| 63 | CQ_Bug_Combat_HUD_Stale_Widget_Refs | Needs MP Confirmation | v1.216 | Generation counter + stamp/bail/recover prevents stale widget writes. |
| 64 | CQ_Refactor_forEachValidPlayer_Helper | Resolved | v1.217 | 23 *ForAllPlayers wrappers converted to shared helper. |
| 65 | CQ_Perf_TickContext_AllPlayers_Cache | Resolved | v1.220 | Per-subtick AllPlayers snapshot shared across all callers. |
| 66 | CQ_Perf_Combat_HUD_Dirty_Gate | Needs MP Confirmation | v1.221 | twlConquestHudTickFrame gated on hudDirty flag; dirty-flag contract added. |
| 67 | CQ_Bug_ActiveSpawnSingletonMPRace | Obsolete | v1.259 | Concurrent MP Air/Forward clicks clobbered global activeSpawn singleton. |
| 68 | CQ_Feat_Vehicle_Deploy_Method_Knob | Resolved | v1.277 | Ready-dialog Vehicle Deploy Method knob (VANILLA + HQ). |
| 69 | CQ_Refactor_Vanilla_Vehicle_Spawner_Rewrite | Resolved | v1.261 | Persistent spawner + mutex + event-bind + Clocks respawn. |
| 70 | CQ_Bug_Global_SetTimeout_Sandbox | Resolved | v1.261 | setTimeout not in Portal sandbox; switched to Timers.setTimeout. |
| 71 | CQ_Refactor_Live_Start_Fleet_Reset_Sink | Resolved | v1.262 | Live-start fleet sunk to y=-1000 then DealDamage; new vehicle types. |
| 72 | CQ_Refactor_Vehicle_Reset_Moved_To_Countdown_Start | Resolved | v1.265 | Fleet reset moved from LIVE-start to countdown-start. |
| 73 | CQ_Bug_Abrams_Substitution_Transport_Slot_Regression | Open | v1.289 | Wrong-vehicle visible at countdown start on post-toggle transport slots. |
| 74 | CQ_Refactor_Vehicle_Destroy_Consolidation | Resolved | v1.285 | Single sinkAndDestroyVehicle wrapper; X/Z preserved; slot.spawnPos priority. |
| 75 | CQ_Feat_Phase6_HQ_Deploy | Resolved | v1.289 | Opt-in HQ deploy mode with player-triggered per-slot spawn + auto seat. |
| 76 | CQ_Polish_Respawn_Redeploy_Timer_Audit | Open | v1.338 | Late-joiner SetRedeployTime may apply globally; (0) persistence unverified. |
| 77 | CQ_Refactor_Gadget_Locker_v1.290_to_v1.313 | Resolved | v1.313 | Authoritative slot state, slot-based probe, preference persistence. |
| 78 | CQ_Polish_Launcher_Ammo_Per_Launcher_Cap | Open | v1.338 | giveRocketCharge consumes charge at cap; AT4 second-slot ammo gap. |
| 79 | CQ_Feat_ReadyDialog_Config_Checkboxes_UI_Seed | Resolved | v1.328 | Ready-dialog checkbox rework (Vanilla/HQ/Air/Forward/SupplyBoxes). |
| 80 | CQ_Bug_Loadout_Not_Respected | Needs MP Confirmation | v1.334 | Loadout dropped on Forward/Air Deploy; v1.333/v1.334 post-seat Teleport fix. |
| 81 | CQ_Feat_Forward_Deploy_Reintroduction | Resolved | v1.328 | Forward Deploy reintroduced on persistent-spawner infra. |
| 82 | CQ_Feat_Air_Deploy_Reintroduction | Resolved | v1.329 | Air Deploy reintroduced as mirror of Forward with altitude sampling. |
| 83 | CQ_Bug_Air_Deploy_Jet_Position_Regression | Resolved | v1.332 | v1.331 probe regressed jets; reverted to yaw-only Teleport. |
| 84 | CQ_Bug_RemoveEquipment_JS_Error | Open | v1.338 | mod.RemoveEquipment JS error log observed v1.332; no repro yet. |
| 85 | CQ_Polish_Jet_Pitch_On_Air_Deploy | Deferred | v1.338 | Jet pitch lost on Air Deploy; pilot pitches manually. |
| 86 | CQ_Feat_Victory_Screen_Unify_Settings | Open | v1.338 | Victory screen XvY settings diverge across round-end/admin/HQ panels. |
| 87 | CQ_Bug_Border_OutOfBounds_Rework | Open | v1.338 | Border bug rework + OOB behavior with new Godot settings. |
| 88 | CQ_Bug_Oil_Tanker_In_Ground_B | Open | v1.338 | Oil Tanker at flag B clipped into ground; map-side Godot fix. |
| 89 | CQ_Polish_Vehicle_Spawn_Messaging_To_Admin_Panel | Open | v1.338 | Relegate "Vehicle spawned at X/Z" world-log behind admin toggle. |
| 90 | CQ_Bug_Launcher_Slot2_Double_Give | Open | v1.338 | RPG slot1 triggers AT4 in slot2 (double-give regression); related to #78. |

## Executive Summaries

### #1 — CQ_Bug_Ticket_Counter_Doubling
Status: Resolved (v0.x). Duplicate ticket values during bleed traced to HUD ownership churn; fixed via single-pass per-player render gating, swap-pending guardrails, and consolidated ticket writer ownership.

### #2 — CQ_Bug_Neutral_Flag_Fill_Sliver
Status: Resolved (v0.x). A 1px fill remnant survived neutralization; neutral-state clamping on fill geometry now hard-clears near-zero residual pixels on the idle render path.

### #3 — CQ_Bug_PostSwap_Engage_HUD_FirstEntry
Status: Open (v1.338). After team swap the first valid neutralization of the last-contested objective can fail to show the Engage HUD; seven attempted fixes (A–G) stabilized partial cases but no full resolution. Deferred pending instrumented team-switch cleanup.

### #4 — CQ_Bug_Swap_HUD_Incremental_Rebuild
Status: Resolved (v0.x). Element-by-element HUD rebuild on swap replaced with a non-destructive hide-first flow and a delayed authoritative redraw gated by pending state.

### #5 — CQ_Bug_Team_Swap_Crash
Status: Resolved (v0.x). Simplified the swap HUD lifecycle and hardened cleanup ordering to remove overlapping refresh paths that caused the original crash.

### #6 — CQ_Bug_Bleed_Chevrons_Not_Visible
Status: Resolved (v0.x). Enforced layer order and stabilized chevron refs across first-life visibility and rebuild paths so chevrons now appear immediately when bleed differential applies.

### #7 — CQ_Bug_Top_Row_Border_PopOut_Overlap
Status: Resolved (v0.x). Active top-row slot now suppresses its border (`suppressActiveBorder`) while the pop-out is live, with safeFind rebind hardening against stale border refs.

### #8 — CQ_Bug_Differential_Stall_Neutralize_Recapture
Status: Resolved (v0.x). Owner resolver now includes pre-event edge inference for strong neutralization/recapture thresholds so differential/bleed/chevrons cannot stall waiting on a later capture interaction.

### #9 — CQ_Bug_CrossPlayer_HUD_Clash
Status: Resolved (v0.x). Enforced strict PID-scoped HUD ownership, duplicate-name purge on `TopHudRoot_{pid}`/`ConquestCombatHudRoot_{pid}`, centered-geometry gate, and subtree-scoped ref rebind so gameplay paths cannot bind off-root.

### #10 — CQ_Bug_Combat_HUD_DropShadow_Parity
Status: Resolved (v0.440). Core HUD text shadow widgets added with per-frame shadow label/color updates; shadow-ring builder reused for chevrons, percent chips, and popout chips.

### #11 — CQ_Bug_Help_Text_Reappears_After_Swap
Status: Resolved (v0.434). Default container visibility flipped to hidden and fallback visibility reapply on deploy prevents default state from surviving swap.

### #12 — CQ_Bug_Startup_TeamSwap_HUD_Ready_Latency
Status: Resolved (v0.489). Critical-ref validation throttled, core-mode legacy suppression made one-shot, Ready first-build switched to hidden-then-reveal, and warm-cache prebuild restored for cached first opens.

### #13 — CQ_Bug_MidRound_Combat_HUD_Disappear
Status: Resolved (v0.491). Core runtime validation made advisory-only; fail-safe no longer hides all combat HUD widgets on transient errors but resets scheduler cadence instead.

### #14 — CQ_Bug_Engage_HUD_Stale_After_Death
Status: Resolved (v0.495). Alive-only filtering added to `GetPlayersOnPoint` projection and subtick cleanup for engaged-objective ownership on dead/invalid/undeployed players.

### #15 — CQ_Bug_FinalMinute_Clock_Disappear
Status: Resolved (v0.510). Replaced final-minute hide/flicker with a red/white color pulse tied to the displayed remaining second so the clock stays continuously visible.

### #16 — CQ_Bug_Enemy_Terminal_VO_On_Point_Only
Status: Open (v1.338). Enemy-side terminal VO only plays when the losing player remains on the objective at loss time; deferred polish — revisit terminal-recipient grace after leaving the point.

### #17 — CQ_Bug_Marauder_Ground_Seat_Unreliable
Status: Open (v1.338). Ground deploy for Marauder does not reliably seat the player (both teams, both variants); deferred to later polish with the transport pass.

### #18 — CQ_Bug_ReadyDialog_Admin_Log_Spam
Status: Resolved (v0.732). Stabilized ready-dialog lifecycle around cached hidden build + pure reveal path; regression watch only — reopen if label spam recurs.

### #19 — CQ_Bug_LateMatch_Deploy_Buttons_Disappear
Status: Open (v1.338). 5-10 minutes into MP, Ground/Air Deploy buttons disappear and script feels partially unresponsive. No clean repro; suspected longer-session lifecycle/cache invalidation in a shared HUD refresh path.

### #20 — CQ_Bug_ReadyDialog_Roster_Stale_Live
Status: Open (v1.338). Live-round roster row stops reflecting `inMainBaseByPid` changes. Suspected missing live refresh policy; deferred polish pending repro and signature verification.

### #21 — CQ_Bug_ReadyDialog_Open_Latency
Status: Resolved (v1.013). Believed fixed by loading-gate rearchitecture and UI cache warm-prime improvements; open speed now feels like a reveal rather than a cold build. Needs standalone MP confirmation.

### #22 — CQ_Bug_MainBase_Ready_Deploy_WorldIcons
Status: Resolved (v1.x). Switched to shared authored WorldIcon + InteractPoint pair with per-player runtime icon spawned at an explicit authored anchor; visibility gated by HQ/team state.

### #23 — CQ_Bug_Live_Deploy_Terminal_Backplate_Drift
Status: Resolved (v1.x). Re-centered the live panel around the existing vehicle HUD lane and kept the plate as dedicated background chrome, stopping the mixed coordinate-frame regressions.

### #24 — CQ_Bug_Passive_Vehicle_HUD_Stale_After_Config_Apply
Status: Resolved (v1.x). Switched live/passive vehicle row source to the selected spawn-spec slot set and restored the hidden-build/reveal ownership contract; removed the temporary layoutVersion workaround.

### #25 — CQ_Bug_WorldIcon_PerPlayer_Visibility
Status: Resolved (v1.064). Abandoned `mod.AddUIIcon` (non-functional) for per-player spawned `WorldIcon` clones with `SetWorldIconOwner`. Single-player confirmed; needs MP per-player isolation test.

### #26 — CQ_Bug_Passive_Vehicle_Menu_Hidden_After_Live_Air_Menu
Status: Resolved (v1.025). Believed fixed by vehicle HUD polish passes (Phase 5/7); passive viewer restores correctly when the live menu closes. Needs MP confirmation.

### #27 — CQ_Bug_Passive_Vehicle_Zero_Top_Slots_OnStart
Status: Resolved (v1.025). Fixed in vehicle HUD render passes during Phase 5/7 polish; empty slots now show idle/empty state instead of `0`.

### #28 — CQ_Bug_Air_Deploy_Ground_Spawn_Wrong_Rotation
Status: Open (v1.338). Air deploy occasionally places the player on the ground with the wrong rotation; vehicle-specific. Needs active investigation of spawn transform and spawn mode application.

### #29 — CQ_Bug_Teleport_While_Live_Perf
Status: Open (v1.338). Suspected script hitch when live players are teleported; repro unclear. Candidates include HUD/viewer refresh churn, vehicle/menu ownership changes, and deploy-state transitions.

### #30 — CQ_Bug_First_Time_Menu_Cold_Hitch
Status: Resolved (v1.025). Believed fixed by loading-gate rearchitecture and UI cache polish through v1.013–v1.025; first-open now behaves like a reveal. Needs MP confirmation.

### #31 — CQ_Bug_GadgetLocker_Deploy_Runtime_Errors
Status: Obsolete (v1.313). Gadget locker rewritten wholesale (v1.308–v1.312) and deploy cleanup migrated to `sinkAndDestroyVehicle` + Phase 6 HQ Deploy; re-observe under v1.313 before re-opening with a fresh stacktrace.

### #32 — CQ_Bug_ReadyDialog_Flicker_On_First_Join
Status: Open (v1.338). Ready dialog briefly visible 1-2 frames before the loading overlay occludes it on first join; v1.013 reassert+yield reduced but did not eliminate the flicker. Deferred polish.

### #33 — CQ_Bug_Loading_Overlay_Vanishes_On_Team_Swap
Status: Open (v1.338). Loading overlay briefly vanishes during team swap before warm prime begins; same root cause family as #32. Deferred polish.

### #34 — CQ_Bug_Vehicle_Ground_Spawner_Rotation_PerMap
Status: Mitigated (v1.141). Firestorm ground + air spawn orientations tuned across v1.132–v1.141; other maps still need a per-map `spawnPos`/`spawnRot` pass.

### #35 — CQ_Bug_EnableAllInputRestrictions_Spam
Status: Resolved (v1.075). Guarded input-restriction calls behind `isPlayerDeployed`, throttled gate reassertion, and eliminated remaining call sites on undeployed players.

### #36 — CQ_Bug_UndeployPlayer_On_Undeployed
Status: Resolved (v1.071). Both undeploy call sites in the loading-gate path now guard on `isPlayerDeployed` (engine state); confirmed clean in SP.

### #37 — CQ_Bug_GetPlayerVehicleSeat_Invalid
Status: Resolved (v1.076). Added vehicle-occupancy cache guard and proactive cache set before `ForcePlayerToSeat`; engine-logs-before-JS-catch residue remains cosmetic.

### #38 — CQ_Bug_GetVehicleFromPlayer_Invalid
Status: Resolved (v1.076). Paired with #37 under the same cache-guard fix; same proactive cache write eliminates the pre-seat verification failure.

### #39 — CQ_Bug_UnspawnObject_Cosmetic_Log
Status: Mitigated (v1.147). All 14 UnspawnObject call sites wrapped in try/catch; engine still logs pre-catch as a cosmetic pattern but no unhandled exception is possible.

### #40 — CQ_Bug_Frame_Time_Budget_Exceeded
Status: Needs MP Confirmation (v1.104). Concurrent `prebuildAllUiFamiliesHidden` calls on simultaneous joins fixed via global serialization lock, yield points between UI family builds, and staggered per-player delay.

### #41 — CQ_Bug_Central_Tick_Loop_AllPlayers
Status: Needs MP Confirmation (v1.081). All-player per-second and per-tick polls replaced by self-terminating event-driven loops for boundary enforcement, vehicle timers, and gadget menu refresh.

### #42 — CQ_Bug_CountOf_Undefined_Array
Status: Needs MP Confirmation (v1.073). Defensive null checks added to `arrayContainsVehicle`, `arrayRemoveVehicle`, and the `GetPlayersOnPoint` result before `CountOf`.

### #43 — CQ_Bug_Cheetah_Gepard_Bind_Failure
Status: Resolved (v1.133). Root cause was `CompareVehicleName` failing for Cheetah/Gepard engine enum swap; all four guards in `doesVehicleMatchConfiguredSlotType` removed.

### #44 — CQ_Bug_Deploy_Menu_Stale_After_Undeploy
Status: Resolved (v1.143). `onPlayerUndeployImpl` now calls `updateVehicleDeployTimerHudForPlayer` at the end so the deploy menu appears immediately after dying/undeploying in a vehicle.

### #45 — CQ_Bug_Transport_Slot_Relocate_Not_Applied
Status: Mitigated (v1.138). `relocateSlotSpawner` destroys-and-recreates a spawner when vehicle type changes anchors. Slot 4 confirmed on Firestorm SP; other maps untested.

### #46 — CQ_Bug_Firestorm_Spawn_Rotations_Radians
Status: Resolved (v1.127). All jet and transport rotY values on Firestorm authored in radians; converted to degrees (Team 2 jet rotX/rotZ π → 180°). No other maps affected.

### #47 — CQ_Bug_Admin_GroundDeployAll_Wrong_Type
Status: Resolved (v1.137). Replaced `forceSpawnAllReadyVehicleSlots` body with `runSequentialSpawns` so every slot is configured, bound, and transform-corrected like normal deploy.

### #48 — CQ_Bug_Admin_Panel_Build_Errors
Status: Resolved (v1.135). Removed stale position-debug function copies in `admin-panel/build.ts` and guarded `setPerfDiagEnabled` behind `FEATURE_PERF_DIAG`.

### #49 — CQ_Bug_TankInTheAir_PrefabDefault
Status: Obsolete (v1.259). Fresh-aircraft direct-spawn path deleted in the vanilla-spawner rewrite; historical record only. Four-layer guard approach preserved in memory.

### #50 — CQ_Bug_Pre_Deploy_GetSoldierState_Error
Status: Resolved (v1.148). Reveal-path `autoStartPositionDebugOnDeploy` now guards on `isPlayerDeployed`; `trySamplePositionDebugSnapshot` routes through `safeGetSoldierStateVector`.

### #51 — CQ_Bug_PositionDebug_Admin_Toggle_Unstick
Status: Resolved (v1.149). Added sticky `posDebugAdminOverride` flag set by the admin handler; autoStart only force-enables on first reveal and otherwise reattaches the loop to admin's choice.

### #52 — CQ_Bug_ExpectingSpawn_Watchdog_Latch
Status: Obsolete (v1.259). Air-deploy fulfillment path and fresh-air watchdog deleted with the vanilla-spawner rewrite; the admin CQ52 counter was retired.

### #53 — CQ_Bug_Air_Deploy_Flag_Or_Squadmate_Failure
Status: Obsolete (v1.259). Pre-v1.259 air-deploy path deleted. Never definitively root-caused; durable lesson preserved in `project_teleport_vehicle_spawn_mystery.md` (never teleport before ForcePlayerToSeat).

### #54 — CQ_Bug_Fresh_Aircraft_PrefabDefault_Race
Status: Obsolete (v1.259). Per-click `RuntimeSpawn_Common.VehicleSpawner` prefab instantiation was deleted outright; persistent spawners eliminate the race.

### #55 — CQ_Bug_Air_Deploy_HQ_WorldIcons_Suppress
Status: Obsolete (v1.259). Air-deploy consumed-deploy branch no longer exists; Phase 6 HQ Deploy's `beginHqSeatFlow` lifecycle owns HQ World Icon visibility.

### #56 — CQ_Bug_Kills_Counter_FriendlyFire
Status: Needs MP Confirmation (v1.212). `onPlayerEarnedKillImpl` now compares killer/victim teams via `safeGetTeamNumberFromPlayer(..., 0)` and fails open on unassigned team (0).

### #57 — CQ_Feat_Forward_Deploy_FreeSpace
Status: Resolved (v1.207). Forward-deploy free-space guard (10m radius) plus three new `roundStart*Delay` MapConfig fields gating air/air-deploy/forward-deploy buttons. Signature-cache bug in deploy-timer render also fixed.

### #58 — CQ_Feat_Pregame_Countdown_Delay_Lines
Status: Resolved (v1.209). Staggered 3-line pregame countdown delay-info reveal at 0/+3s/+6s (Y=-420/-380/-340). Cache-preservation fix prevents `delayLineWidgets` being wiped on tick.

### #59 — CQ_Feat_Round_Start_Gadget_Delay
Status: Resolved (v1.211). New `roundStartGadgetDelay` MapConfig (Firestorm 60s) plus 4th pregame countdown line. Gadget locker opens pre-LIVE with tiles disabled via `gadgetBlocked`; two string variants.

### #60 — CQ_Bug_Loading_Gate_Invariants
Status: Resolved (v1.222). GATE_INV_1/2/3 asserts shipped v1.214 then reverted v1.222 because world-log is transient. Dual-guard in code closes the race; persistent-HUD diagnostic recipe preserved.

### #61 — CQ_Polish_MP_Validation_v1.214_to_v1.221
Status: Open (v1.338). MP-only scenarios from the stability/perf pass remain unverified (concurrent join gate, reconnect mid-prebuild, simultaneous swaps, cross-player TickContext, concurrent deploy-timer load).

### #62 — CQ_Perf_Deploy_Timer_HotPath_SafeFind
Status: Resolved (v1.215). Cached the loading-overlay exists flag and removed a redundant safeFind call from the deploy-timer hot path. Companion to the v1.190 `safeFindPlayer` fix.

### #63 — CQ_Bug_Combat_HUD_Stale_Widget_Refs
Status: Needs MP Confirmation (v1.216). Per-player `combatHudGenerationByPid` counter plus render-path stamp/bail/recover cycle closes the stale-ref race without lowering the revalidation interval.

### #64 — CQ_Refactor_forEachValidPlayer_Helper
Status: Resolved (v1.217). New `src/state/player-iteration.ts::forEachValidPlayer`; 23 `*ForAllPlayers` wrappers now delegate to the helper. Enables the v1.219 per-subtick cache.

### #65 — CQ_Perf_TickContext_AllPlayers_Cache
Status: Resolved (v1.220). New `src/state/tick-context.ts`; `beginTickContext`/`endTickContext` wrap the game-mode subtick so all per-subtick callers share one `mod.AllPlayers()` snapshot.

### #66 — CQ_Perf_Combat_HUD_Dirty_Gate
Status: Needs MP Confirmation (v1.221). `updateConquestCombatHudForAllPlayers` now gated on `hudDirty || force`; AGENTS.md "Combat HUD Dirty-Flag Contract" enumerates the 9 state fields that must mark dirty.

### #67 — CQ_Bug_ActiveSpawnSingletonMPRace
Status: Obsolete (v1.259). Air/Forward Deploy paths deleted. The per-slot `lastRequestedSpawnPos + expectingSpawn` pattern informed the `bindSpawnedVehicleToExpectingSlot` helper in `vanilla-spawner.ts`.

### #68 — CQ_Feat_Vehicle_Deploy_Method_Knob
Status: Resolved (v1.277). Ready-dialog `Vehicle Deploy Method` knob. Initial option was `VANILLA`; `HQ` added v1.277. `HQ_FORWARD` / `HQ_FORWARD_AIR` remain out of scope.

### #69 — CQ_Refactor_Vanilla_Vehicle_Spawner_Rewrite
Status: Resolved (v1.261). Persistent `VehicleSpawner` per slot; serial `spawnMutex`; `ForceVehicleSpawnerSpawn` dispatch; `OnVehicleSpawned` bind; `Clocks.CountDownClock` respawn. Obsoletes #49/#52/#53/#54/#55/#67.

### #70 — CQ_Bug_Global_SetTimeout_Sandbox
Status: Resolved (v1.261). `setTimeout` does not exist in the Portal sandbox; switched to `Timers.setTimeout`, wrapped `Promise.race` in try/catch, routed every mutex enqueue through `enqueueDispatch()` with a catch.

### #71 — CQ_Refactor_Live_Start_Fleet_Reset_Sink
Status: Resolved (v1.262). Pre-live fleet sunk to y=-1000 before `DealDamage` to avoid audible pad explosions and the `UnspawnObject` engine error path. Added DirtBike/DirtBike_Pax/AH6M_Pax vehicle types.

### #72 — CQ_Refactor_Vehicle_Reset_Moved_To_Countdown_Start
Status: Resolved (v1.265). Fleet reset moved from LIVE-start to countdown-start so fresh spawns finish during countdown; sink → 0.5s wait → `DealDamage`. Dead `destroyAllTrackedVehicles` helper removed.

### #73 — CQ_Bug_Abrams_Substitution_Transport_Slot_Regression
Status: Open (v1.289). Wrong vehicle (often default Abrams) visible at countdown start on transport slots after heli/ground knob toggle. v1.266–v1.268 fix attempts reverted; v1.271 2s init-wait mitigates. Fresh diagnostic pass required.

### #74 — CQ_Refactor_Vehicle_Destroy_Consolidation
Status: Resolved (v1.285). Single `sinkAndDestroyVehicle(vehicle, fallbackPos)` wrapper. Preserves X/Z, sinks to y=-1000, damages after 500–1500ms. Prefers `slot.spawnPos` over `GetObjectPosition` at countdown reset.

### #75 — CQ_Feat_Phase6_HQ_Deploy
Status: Resolved (v1.289). Opt-in HQ deploy mode in `src/vehicles/hq-deploy.ts`: pads empty at LIVE, per-slot player-triggered dispatch via deploy-menu or on-foot live-terminal, seating via `OnPlayerDeployed` + `ForcePlayerToSeat` (BountyHunter pattern).

### #76 — CQ_Polish_Respawn_Redeploy_Timer_Audit
Status: Open (v1.338). Late-joiner `SetRedeployTime(HUD_WARM_REDEPLOY_BLOCK_SECONDS)` in `holdPlayerAtDeploy` may be applying globally; `SetRedeployTime(0)` persistence (one-shot vs persistent) not empirically verified. Also covers open tweaks for respawn timing on death and after HQ deploy.

### #77 — CQ_Refactor_Gadget_Locker_v1.290_to_v1.313
Status: Resolved (v1.313). Authoritative per-player `State.players.lockerSlots` + slot-based `HasEquipment`-diff probe + per-class slot-toggle row with preference persistence. Supply Crate enum corrected to `Deployable_Vehicle_Supply_Crate`.

### #78 — CQ_Polish_Launcher_Ammo_Per_Launcher_Cap
Status: Open (v1.338). `giveRocketCharge` consumes an ammo-locker charge even when the engine silently clamps at the per-launcher reserve cap. Latest finding: Launcher Ammo tile not giving 2nd-slot ammo on AT4. Deferred polish.

### #79 — CQ_Feat_ReadyDialog_Config_Checkboxes_UI_Seed
Status: Resolved (v1.328). Ready-dialog center column reworked: `Game Mode Configuration:` header + 5 checkboxes (Vanilla/HQ radio pair, Air/Forward/SupplyBoxes booleans). Supply Boxes wired v1.325; Forward Deploy wired v1.328.

### #80 — CQ_Bug_Loadout_Not_Respected
Status: Needs MP Confirmation (v1.334). Vehicle loadout (e.g. TOW on AH-6M) dropped on Forward/Air Deploy but not HQ Deploy. v1.333 moved Forward pre-seat Teleport to post-seat (user-confirmed); v1.334 mirror for Air pending playtest.

### #81 — CQ_Feat_Forward_Deploy_Reintroduction
Status: Resolved (v1.328). Reintroduced on persistent-spawner infra via `mod.SetObjectTransform` on `slot.spawner`. New `forward-spawn-volume.ts` triangle-split sampling; `requestForwardVehicleSpawn` mirrors HQ validation; post-seat relocate-back.

### #82 — CQ_Feat_Air_Deploy_Reintroduction
Status: Resolved (v1.329). Mirror of Forward Deploy for aircraft slots. New `air-spawn-volume.ts` with floor X/Z + additive altitude sampling, jet-vs-heli rotation selection; `requestAirVehicleSpawn`; relocate-dispatch + post-seat relocate-back.

### #83 — CQ_Bug_Air_Deploy_Jet_Position_Regression
Status: Resolved (v1.332). v1.331 Phase A probe (skip post-bind Teleport for jets) caused jets to birth at HQ rather than `nextAirPos`; reverted to yaw-only `mod.Teleport`. Confirms spawner-relocate does not propagate position at altitude.

### #84 — CQ_Bug_RemoveEquipment_JS_Error
Status: Open (v1.338). `Error reported by RemoveEquipment when running JS Script` observed v1.332; suspected trigger is opening the gadget locker menu but no repro captured. Deferred to polish phase.

### #85 — CQ_Polish_Jet_Pitch_On_Air_Deploy
Status: Deferred (v1.338). Jet pitch (`rotPlane.X`) lost on Air Deploy because `mod.Teleport` has no pitch/roll signature and `SetObjectTransform` is a no-op on Vehicle. Pilots pitch manually after seat. Sister-spawner plan deferred.

### #86 — CQ_Feat_Victory_Screen_Unify_Settings
Status: Open (v1.338). Victory screen XvY settings diverge between round-end, admin panel, and HQ panels; need a single source of truth for the XvY selection across all surfaces.

### #87 — CQ_Bug_Border_OutOfBounds_Rework
Status: Open (v1.338). Border bug rework plus out-of-bounds behavior revisit with new Godot settings; boundary alarm and kill-volume layering to be re-tuned once map geometry settles.

### #88 — CQ_Bug_Oil_Tanker_In_Ground_B
Status: Open (v1.338). Oil Tanker at flag B is clipped into the ground. Map-side fix (move the asset in Godot), not a code issue.

### #89 — CQ_Polish_Vehicle_Spawn_Messaging_To_Admin_Panel
Status: Open (v1.338). Remove the "Vehicle spawned at X/Z" world-log messaging from default output; relegate it behind an admin-panel toggle or button for diagnostics-only.

### #90 — CQ_Bug_Launcher_Slot2_Double_Give
Status: Open (v1.338). RPG given in slot 1 also triggers an AT4 to land in slot 2 (double-give regression). Related to #78 (per-launcher cap / AT4 ammo investigation).
