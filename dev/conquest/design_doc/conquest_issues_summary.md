# Conquest Issues — Summary Index

Last updated: 2026-05-04 (v1.466) — **#113 resolved at v1.466.** Two-ship fix: v1.465 moved the Vehicle Deploy click action to fire on the first primary-click event via `tryConsumeUIButtonPrimaryClickEvent` dedupe (mirrors team-swap pattern that already worked on console); v1.466 added a per-player engine-deploy block during the HQ-claim window so the engine's deploy-on-foot can't win the input frame and strand the player on foot before the vehicle binds. Console controllers now land directly in the requested vehicle from the deploy screen. The original speculation about "input-mode / cursor-routing gap" was incorrect — actual cause was the `ButtonUp`-only action firing combined with the engine consuming the same controller input as a deploy. Prior 2026-05-03 update (v1.448): closed #34/#78/#85/#88/#89 per user direction (#34 + #85 reclassified by-design / accepted, #78 + #88 + #89 confirmed resolved). Player-facing impact reclassification: #3 / #16 / #86 dropped from the player-known-issues list as low-impact (they remain Open internally). #100 narrowed: only fires in B+C-owned-without-A state; future fix lands with the custom player spawner system.

Cross-ref: Full detail, history, and investigation notes for each issue live in [`conquest_issues.md`](./conquest_issues.md). This doc is the at-a-glance index only.

## Status Table

| # | Name | Status | Last Tested | Summary |
|---|------|--------|-------------|---------|
| 1 | CQ_Bug_Ticket_Counter_Doubling | Resolved | v0.x | Duplicate ticket values during bleed caused by HUD ownership churn. |
| 2 | CQ_Bug_Neutral_Flag_Fill_Sliver | Resolved | v0.x | 1px fill sliver remained after neutralizing a flag. |
| 3 | CQ_Bug_PostSwap_Engage_HUD_FirstEntry | Open — Deferred (post-playtest) | v1.372 | First valid post-team-swap neutralization can fail to show Engage HUD. Low priority; revisit post-playtest. |
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
| 16 | CQ_Bug_Enemy_Terminal_VO_On_Point_Only | Open — Deferred (post-playtest) | v1.338 | Enemy terminal VO only heard when losing player stays on objective. Low priority. |
| 17 | CQ_Bug_Marauder_Ground_Seat_Unreliable | Likely Resolved | v1.372 | Not observed since v1.328+ Forward/Air refactor; needs MP confirmation. |
| 18 | CQ_Bug_ReadyDialog_Admin_Log_Spam | Resolved | v0.732 | Ready-dialog open produced recurring engine/log error spam. |
| 19 | CQ_Bug_LateMatch_Deploy_Buttons_Disappear | Not Reproducing | v1.372 | Not observed in v1.372 testing; closing pending re-observation under 64p MP load. |
| 20 | CQ_Bug_ReadyDialog_Roster_Stale_Live | Likely Resolved | v1.372 | Not observed since recent ready-dialog refresh fix; needs MP confirmation. |
| 21 | CQ_Bug_ReadyDialog_Open_Latency | Resolved | v1.013 | Ready dialog could feel cold/delayed; needs MP confirmation. |
| 22 | CQ_Bug_MainBase_Ready_Deploy_WorldIcons | Resolved | v1.x | Main-base Ready/Deploy world icons had per-player visibility failures. |
| 23 | CQ_Bug_Live_Deploy_Terminal_Backplate_Drift | Resolved | v1.x | Live deploy terminal backplate drifted or shaded over controls. |
| 24 | CQ_Bug_Passive_Vehicle_HUD_Stale_After_Config_Apply | Resolved | v1.x | Passive deployed vehicle HUD did not refresh on config apply. |
| 25 | CQ_Bug_WorldIcon_PerPlayer_Visibility | Resolved | v1.064 | World icons only rendered for first player; AddUIIcon non-functional. |
| 26 | CQ_Bug_Passive_Vehicle_Menu_Hidden_After_Live_Air_Menu | Resolved | v1.025 | Passive vehicle menu stayed hidden after live air deploy menu closed. |
| 27 | CQ_Bug_Passive_Vehicle_Zero_Top_Slots_OnStart | Resolved | v1.025 | Empty vehicle top slots showed 0 values at round start. |
| 28 | CQ_Bug_Air_Deploy_Ground_Spawn_Wrong_Rotation | Likely Resolved | v1.372 | Not observed since v1.328+ Forward/Air refactor + v1.333/v1.334 post-seat Teleport pattern. |
| 29 | CQ_Bug_Teleport_While_Live_Perf | Open — Watch (MP playtest) | v1.338 | Suspected performance hitch when live players are teleported. Watch during 64p MP playtest. |
| 30 | CQ_Bug_First_Time_Menu_Cold_Hitch | Resolved | v1.025 | First-time menu creation caused multi-second hitching on MP joins. |
| 31 | CQ_Bug_GadgetLocker_Deploy_Runtime_Errors | Obsolete | v1.313 | Post-gadget-locker runtime errors; underlying paths rewritten. |
| 32 | CQ_Bug_ReadyDialog_Flicker_On_First_Join | Resolved-by-removal (v1.418) | v1.338 | Loading overlay deleted in Wave 3 Ship 8 — no overlay to flicker behind. |
| 33 | CQ_Bug_Loading_Overlay_Vanishes_On_Team_Swap | Resolved-by-removal (v1.418) | v1.338 | Loading overlay + team-swap warm prime both deleted in Wave 3 Ship 8 — no overlay to vanish. |
| 34 | CQ_Bug_Vehicle_Ground_Spawner_Rotation_PerMap | Closed — By Design | v1.141 | Per-map vehicle spawn-orientation tuning is part of normal map authoring; not a bug. Firestorm tuned, other maps tune at authoring time. |
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
| 61 | CQ_Polish_MP_Validation_v1.214_to_v1.221 | Open — Watch (MP playtest) | v1.338 | MP-only validation scenarios from stability/perf pass pending playtest. |
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
| 73 | CQ_Bug_Abrams_Substitution_Transport_Slot_Regression | Likely Resolved | v1.372 | Not observed since v1.328+ Forward/Air refactor; needs MP confirmation under heli/ground knob toggles. |
| 74 | CQ_Refactor_Vehicle_Destroy_Consolidation | Resolved | v1.285 | Single sinkAndDestroyVehicle wrapper; X/Z preserved; slot.spawnPos priority. |
| 75 | CQ_Feat_Phase6_HQ_Deploy | Resolved | v1.289 | Opt-in HQ deploy mode with player-triggered per-slot spawn + auto seat. |
| 76 | CQ_Polish_Respawn_Redeploy_Timer_Audit | Open — Watch (MP playtest) | v1.338 | Late-joiner SetRedeployTime may apply globally; (0) persistence unverified. Watch during 64p MP. |
| 77 | CQ_Refactor_Gadget_Locker_v1.290_to_v1.313 | Resolved | v1.313 | Authoritative slot state, slot-based probe, preference persistence. |
| 78 | CQ_Polish_Launcher_Ammo_Per_Launcher_Cap | Resolved (superseded by v1.373) | v1.379 | Substantively addressed by v1.373 work: uniform 3-rocket cap (#95), cap-defense gate at giveRocketCharge:1399, read-back-verify with retry, +1-ammo non-destructive slot probe (#96). |
| 79 | CQ_Feat_ReadyDialog_Config_Checkboxes_UI_Seed | Resolved | v1.328 | Ready-dialog checkbox rework (Vanilla/HQ/Air/Forward/SupplyBoxes). |
| 80 | CQ_Bug_Loadout_Not_Respected | Needs MP Confirmation | v1.334 | Loadout dropped on Forward/Air Deploy; v1.333/v1.334 post-seat Teleport fix. |
| 81 | CQ_Feat_Forward_Deploy_Reintroduction | Resolved | v1.328 | Forward Deploy reintroduced on persistent-spawner infra. |
| 82 | CQ_Feat_Air_Deploy_Reintroduction | Resolved | v1.329 | Air Deploy reintroduced as mirror of Forward with altitude sampling. |
| 83 | CQ_Bug_Air_Deploy_Jet_Position_Regression | Resolved | v1.332 | v1.331 probe regressed jets; reverted to yaw-only Teleport. |
| 84 | CQ_Bug_RemoveEquipment_JS_Error | Likely Resolved | v1.372 | Not observed since v1.341 isSlotEmpty precheck gate; needs MP confirmation. |
| 85 | CQ_Polish_Jet_Pitch_On_Air_Deploy | Closed — Accepted | v1.338 | Jet pitch lost on Air Deploy accepted as-is; pilot pitches manually after seat. |
| 86 | CQ_Feat_Victory_Screen_Unify_Settings | Open | v1.338 | Victory screen XvY settings diverge across round-end/admin/HQ panels. |
| 87 | CQ_Bug_Border_OutOfBounds_Rework | Resolved | v1.370 | Boundary architecture pass v1.358–v1.370 + spatial re-author closes this. |
| 88 | CQ_Bug_Oil_Tanker_In_Ground_B | Resolved | v1.379 | Map-side Godot fix applied. User-confirmed 2026-04-26. |
| 89 | CQ_Polish_Vehicle_Spawn_Messaging_To_Admin_Panel | Resolved | v1.380 | Emitter at vehicle-events.ts:84-89 wrapped in `FEATURE_PERF_DIAG && State.admin.perfDiagEnabled` gate. Off in production (compile-time strip); toggleable via existing perfDiag admin button. Bundle delta −362 bytes. |
| 90 | CQ_Bug_Launcher_Slot2_Double_Give | Likely Resolved | v1.372 | Not observed since v1.339–v1.344 launcher probe + ammo polish; needs MP confirmation. |
| 91 | CQ_Audit_Engine_Enable_Calls | Resolved (audit clean) | v1.372 | Tier 3.1 audit: every engine-object `Enable*` SDK call is correctly wired. v1.367 lesson does not generalize to a hidden bug. |
| 92 | CQ_Audit_CapturePoint_HotPath_State | Resolved (audit clean) | v1.372 | Tier 3.2 audit: per-subtick capture polling is load-bearing (missed-edge backstop); one optional `GetPlayersOnPoint`→cached-set optimization deferred. |
| 93 | CQ_Bug_GetVehicleFromPlayer_Boundary_ForwardDeploy | Resolved | v1.374 | Deleted the dead cache seed at player-deploy.ts:65-76. User-confirmed in v1.378 testing — no engine errors observed. |
| 94 | CQ_Bug_GetInventoryAmmo_SupplyBox_OpenMenu | Resolved (pending MP confirm) | v1.448 | Two-step fix: **v1.447** added per-class HasEquipment-based probes for non-Engineer menu-open path (`probeAssaultSlot`, `probeMedicSlot`, `probeReconSlot`, dispatcher `probeSlotForClass` wired into `initLockerSlotStateFromProbe` + `reprobeSiblingGadgetSlot`). **v1.448** dropped the `isSlotEmpty` precheck from non-Engineer give helpers (`giveMedicSmoke`, `giveAssaultItem`, `giveReconItem`) — was the remaining `GetInventoryAmmo` source firing on tile clicks. AddEquipment clobbers cleanly; users own slot choice; dup prevention via gray-out (HasEquipment). Engineer paths (`probeSlot`, `giveLauncher`, `giveRocketCharge`) untouched throughout (launcher detection + swap-in-place need destructive-probe semantics). Impact NOT cosmetic — engine log allocations contributed to the same heap pressure that crashed at 16p in #109. Plan: [`5.03.26_conquest_supplybox_medic_fix_plan.md`](./5.03.26_conquest_supplybox_medic_fix_plan.md). Bundle: +2,614 bytes (v1.447) −362 bytes (v1.448) = +2,252 bytes net. |
| 95 | CQ_Bug_Launcher_Ammo_Cap_Below_Designed | Resolved | v1.373 | Uniform `maxAmmo: 3` for all launchers; "FULL" at-cap label with gray header. User-confirmed in v1.378 testing. |
| 96 | CQ_Bug_Launcher_Slot_Identification_Zero_Ammo | Resolved (pending MP confirm) | v1.373 | v1.344 short-circuit replaced by +1-ammo non-destructive probe (Step B2 cheap-positive + Step B3 +1-write disambiguation); destructive probe runs only on both-populated branch. Restores both slots' ammo on every exit. |
| 97 | CQ_Polish_SupplyBox_DisabledFocused_Indicator | Resolved | v1.375 | Disabled tiles in the Supply Box menu paint a cool blue-white border ring + lifted background when focused. User-confirmed in v1.378 testing. |
| 98 | CQ_Bug_FlagSpawn_FalsePositive_OOB | Resolved | v1.376 | Flipped `seedZoneStateFromSpawnContext` polarity: HQ-anchor probe → teammate inheritance → default `inGCZ=true` if neither delivered a signal. User-confirmed in v1.378 testing. |
| 99 | CQ_Polish_GadgetSlot_Selector_Top_Row_Focus_Highlights | Open | v1.376 | Extend #97's disabled-focused border indicator to the top-row gadget slot selector (prev/next) buttons; same tile-key + FocusOut pattern. |
| 100 | CQ_Bug_FlagB_Spawn_Failure | Open — Deferred to custom spawner work | v1.376 | Repro narrowed (2026-05-03): only fires when a team owns flag B + flag C but NOT flag A. Underlying Godot spawner limitation; full fix bundled into the planned custom player spawner system rather than spot-patched. |
| 101 | CQ_Tweak_Vehicle_Display_Name_Defaults | Resolved | v1.379 | strings.json updated: Flyer60 = "Jeep", Vector = "Jeep PAX", plus class tags (MBT/IFV/AAV/Fighter/Attack) on Abrams/Leopard/Bradley/CV90/Cheetah/Gepard/F16/F22/JAS39/SU57. |
| 102 | CQ_Tweak_Team_Names_Add_Faction | Resolved | v1.377 | Added 8 combo entries (WEST/EAST/NORTH/SOUTH × NATO/PAX) to `twl.teams`. Firestorm = WEST_NATO + EAST_PAX. User-confirmed in v1.378 testing. |
| 103 | CQ_Tweak_Bleed_Rate_Mancours_Calibration | Open | v1.376 | Recalibrate ticket bleed rates against Mancours-style reference values; design TBD. Tunable via `BLEED_*` constants in `config/conquest-constants.ts`. |
| 104 | CQ_Audit_Weapon_Gadget_Bans | Open — Deferred (post-playtest) | v1.379 | Re-review weapon/gadget ban list against current gadget-locker offerings; update Tip 7 join-prompt copy. Low priority. |
| 105 | CQ_Bug_HardCrash_LateJoiner_ApplyConfig | Resolved (pending MP confirm) — **fix mechanism replaced in v1.418** | v1.382 | Hard server crash during late-joiner + Apply Config + team-swap combo. v1.382 fix used `warmPrimeActiveByPid` flag to refuse Apply during any pid's mid-warm. **v1.418 Ship 8 deleted both the flag and the Apply guard** when the loading-gate machinery was removed; the lazy-build dispatcher's per-surface in-flight guard is the new line of defense, but the original race condition has not been re-verified post-Ship-8. Reopen if recurs in MP. |
| 106 | CQ_Bug_HighSev_Y200_OOB_HeliSlot2_SeatKindStale | Resolved (pending MP confirm) | v1.383 | Players in AH-6M heli slot 2 marked OOB at Y=200 ceiling — `seatKind` cache stuck at `on_foot` (suspected missing `OnPlayerEnterVehicle` event). Safety-net engine re-probe in `getDesiredBoundaryViolationKind`: when on_foot Y>200 branch is about to fire OOB, re-probe `IsInVehicle`; if engine confirms in-vehicle, self-correct cache via `setPlayerSeatKind` and exempt. |
| 107 | CQ_Tweak_SpawnCharge_Exempt_Vehicle_And_TeamSwitch | Resolved (pending MP confirm) | v1.393 | Phase 2B spawn-charge: exempt voluntary UX redeploys from ticket cost. Added new `vehicle_deploy` reason; vehicle HQ/Forward/Air Deploy from on-foot now marks this reason and skips the charge. `team_switch` reason added to exempt set. Diagnostic counters preserved. Death-respawns / forced-redeploys / admin-moves / phase-transitions / reconnects still charge. Bundle: +397 bytes. |
| 108 | CQ_Tweak_HQ_SupplyBox_Disable_OnLive | Resolved (pending MP confirm) | v1.394 | HQ supply boxes (Firestorm objIds 1056, 1057) auto-disable when match goes LIVE — interact point + yellow smoke VFX both hidden. Non-HQ boxes (1050-1055) unchanged. New generic `disableOnLive?: boolean` map-config flag on world-interactable anchors; gate at 3 sites (`shouldEnable...`, `spawnWorldInteractableVfxForActiveConfigs`, `ensureWorldInteractableVfxForConfig`); `refreshDisableOnLiveInteractableStateForLiveTransition()` called from `startMatch` for snappy transition. Bundle: +1,160 bytes. |
| 109 | CQ_Bug_16Player_Playtest_JS_Memory_Limit | Awaiting MP confirmation (Wave 3 complete v1.418) | v1.406 | Mod Evaluator terminated script at load during a 16-player MP playtest with the JS heap limit error. Wave 3 (v1.409–v1.419) targeted the per-pid allocation contributors directly — every UI surface now builds via `triggerLazyBuild` only when used, the loading-gate machinery is deleted, `readyDialogData_t` lost 18 fields, `warmPrimeActiveByPid` removed, ~30 `hud-warm-state.ts` accessors deleted, `loading-overlay.ts` deleted. Bundle 877,390 → 847,560 bytes (−29,830). Per-pid heap shape collapsed substantially more than the bundle delta. Verification requires a 16+ player MP playtest. If termination recurs at 24+ players, the remaining contributors are M1 (`vehicleDeployTimerCache`) + the combat HUD entry graph — Wave 4 candidates. |
| 110 | CQ_Bug_57_SquadSpawn_HQ_OOB | Resolved (pending MP confirm) | v1.442 | Player squad-spawning onto a teammate at HQ flagged as OOB; `tryInheritZonesFromNearbyTeammate` was copying 4 zone flags but explicitly omitting `inOwnHQ`. Fix: one-line addition `state.inOwnHQ = teammateState.inOwnHQ \|\| state.inOwnHQ;` so the spawner inherits the teammate's HQ status without clobbering an anchor-radius probe result. |
| 111 | CQ_Bug_58_ReadyState_Persists_Through_Death_And_HQ_Exit | Resolved (pending MP confirm) | v1.445 | Pre-game READY state was getting auto-cleared by death-respawn (engine `OnPlayerDeployed` callback unconditionally cleared `readyByPid`) AND by walking out of own HQ pre-live (`notePreliveMainBaseViolation` invoked from per-tick boundary refresh + AreaTrigger exit). Fix: deleted the deploy-event clear, removed both `notePreliveMainBaseViolation` callers, deleted the now-unused function. Auto-unready triggers reduced to two: SWAP TEAMS + admin config change. Plan: [`5.02.26_conquest_ready_tuning_plan.md`](./5.02.26_conquest_ready_tuning_plan.md). |
| 112 | CQ_Tweak_WAIT_Label_OnTimerBar | Resolved (pending MP confirm) | v1.446 | Vehicle deploy timer rows now show a "WAIT" label drawn on top of the red/gray progress bar (black text, centered, visible only in timer mode — hidden in READY/ACTIVE/SPAWNING/DEPLOYING). New `barText` widget on `ReusableTimerWidgetCacheEntry`; new `twl.ui.wait` string key; new `buildReusableTimerBarText` helper inserted in the children array AFTER `buildReusableTimerBarFill` so it draws on top in z-order. Bundle delta: +933 bytes (script) +30 bytes (strings). |
| 113 | CQ_Bug_Console_DeployScreen_Vehicle_Buttons_Unresponsive | **Resolved (v1.465 + v1.466, 2026-05-04)** | v1.466 | Two-ship fix. Actual root cause was NOT the input-mode gap originally suspected; it was a combination of (a) Vehicle Deploy buttons firing the spawn action on `ButtonUp` while team-swap fires on `ButtonDown` via `tryConsumeUIButtonPrimaryClickEvent` dedupe, and (b) the engine's deploy-on-foot action consuming the same controller input as the UI click in the deploy-screen context. v1.465 moved the action to the first primary-click event seen (matches team-swap pattern that already worked). v1.466 added a per-player engine-deploy block during the HQ-claim window via `mod.EnablePlayerDeploy(player, false)` so the engine deploy can't strand the player on foot before the vehicle binds. Per-player only; does not touch the global `mod.EnableAllPlayerDeploy` countdown gate. |

## Executive Summaries

### #1 — CQ_Bug_Ticket_Counter_Doubling
Status: Resolved (v0.x). Duplicate ticket values during bleed traced to HUD ownership churn; fixed via single-pass per-player render gating, swap-pending guardrails, and consolidated ticket writer ownership.

### #2 — CQ_Bug_Neutral_Flag_Fill_Sliver
Status: Resolved (v0.x). A 1px fill remnant survived neutralization; neutral-state clamping on fill geometry now hard-clears near-zero residual pixels on the idle render path.

### #3 — CQ_Bug_PostSwap_Engage_HUD_FirstEntry
Status: Open — Low-impact (2026-05-03 reclassification). Repro tightened: occurs only when the team swap happens **while standing on a flag**; missing Engage HUD does NOT prevent capture progress. Seven attempted fixes (A–G) stabilized partial cases but no full resolution. Dropped from the player-known-issues list as low-impact; remains Open internally for a future instrumented team-switch cleanup pass.

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
Status: Open — Low-impact (2026-05-03 reclassification). Enemy-side terminal VO only plays when the losing player remains on the objective at loss time. Dropped from the player-known-issues list as low-impact; remains Open internally for the polish pass — terminal-recipient grace after leaving the point is the candidate fix.

### #17 — CQ_Bug_Marauder_Ground_Seat_Unreliable
Status: Likely Resolved (v1.372, user confirmation 2026-04-25). Not observed since the v1.328+ Forward/Air Deploy reintroduction refactor and the v1.333/v1.334 post-seat Teleport pattern. Needs MP confirmation across both teams + both variants before final close.

### #18 — CQ_Bug_ReadyDialog_Admin_Log_Spam
Status: Resolved (v0.732). Stabilized ready-dialog lifecycle around cached hidden build + pure reveal path; regression watch only — reopen if label spam recurs.

### #19 — CQ_Bug_LateMatch_Deploy_Buttons_Disappear
Status: Not Reproducing (v1.372, user confirmation 2026-04-25). The 5-10 min late-match deploy-button-disappear symptom has not recurred since the v1.358–v1.370 boundary architecture stabilization. Closing pending re-observation under 64p MP load. Re-open if the symptom returns.

### #20 — CQ_Bug_ReadyDialog_Roster_Stale_Live
Status: Likely Resolved (v1.372, user confirmation 2026-04-25). Not observed since the recent ready-dialog refresh fix. Needs MP confirmation before final close.

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
Status: Likely Resolved (v1.372, user confirmation 2026-04-25). Not observed since the v1.328+ Forward/Air Deploy reintroduction refactor and the v1.333/v1.334 post-seat Teleport pattern. Needs MP confirmation across all aircraft slots.

### #29 — CQ_Bug_Teleport_While_Live_Perf
Status: Open (v1.338). Suspected script hitch when live players are teleported; repro unclear. Candidates include HUD/viewer refresh churn, vehicle/menu ownership changes, and deploy-state transitions.

### #30 — CQ_Bug_First_Time_Menu_Cold_Hitch
Status: Resolved (v1.025). Believed fixed by loading-gate rearchitecture and UI cache polish through v1.013–v1.025; first-open now behaves like a reveal. Needs MP confirmation.

### #31 — CQ_Bug_GadgetLocker_Deploy_Runtime_Errors
Status: Obsolete (v1.313). Gadget locker rewritten wholesale (v1.308–v1.312) and deploy cleanup migrated to `sinkAndDestroyVehicle` + Phase 6 HQ Deploy; re-observe under v1.313 before re-opening with a fresh stacktrace.

### #32 — CQ_Bug_ReadyDialog_Flicker_On_First_Join
Status: Resolved-by-removal (v1.418). The loading overlay was deleted in Wave 3 Ship 8 — there is no overlay to occlude the dialog with anymore, so the flicker scenario cannot occur. Pre-Ship-8 status was Open since v1.338 (deferred polish).

### #33 — CQ_Bug_Loading_Overlay_Vanishes_On_Team_Swap
Status: Resolved-by-removal (v1.418). The loading overlay AND the team-swap warm-prime path were both deleted in Wave 3 Ship 8 — team-swap now snaps directly to deploy screen with no overlay involved. Pre-Ship-8 status was Open since v1.338 (deferred polish).

### #34 — CQ_Bug_Vehicle_Ground_Spawner_Rotation_PerMap
Status: Closed — By Design (2026-05-03, user direction). Per-map vehicle spawn-orientation tuning is part of normal map authoring, not a defect — each new map's `spawnPos` / `spawnRot` pass is expected as part of bringing that map online. Firestorm orientations tuned across v1.132–v1.141; future maps tune at authoring time.

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
Status: Needs MP Confirmation — **scenario shape changed in v1.418** (v1.104 fix removed). v1.104 fixed concurrent `prebuildAllUiFamiliesHidden` calls on simultaneous joins via a global serialization lock + yield points + staggered per-player delay. **Wave 3 Ship 8 (v1.418) deleted `prebuildAllUiFamiliesHidden` entirely**, so the original concurrent-prebuild scenario no longer exists. The `LazyBuildPacer` namespace (v1.409 Ship 1) provides a global heavy-build mutex for lazy builds that contend on the same frame, but the failure mode has not been re-stressed at 24+ players post-Ship-8. Reopen if frame-budget breaches recur.

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
Status: Likely Resolved (v1.372, user confirmation 2026-04-25). Not observed since the v1.328+ Forward/Air Deploy reintroduction refactor. Needs MP confirmation under heli/ground knob-toggle scenarios. Original v1.266–v1.269 fix attempts reverted; v1.271 2s init-wait mitigation remains in place.

### #74 — CQ_Refactor_Vehicle_Destroy_Consolidation
Status: Resolved (v1.285). Single `sinkAndDestroyVehicle(vehicle, fallbackPos)` wrapper. Preserves X/Z, sinks to y=-1000, damages after 500–1500ms. Prefers `slot.spawnPos` over `GetObjectPosition` at countdown reset.

### #75 — CQ_Feat_Phase6_HQ_Deploy
Status: Resolved (v1.289). Opt-in HQ deploy mode in `src/vehicles/hq-deploy.ts`: pads empty at LIVE, per-slot player-triggered dispatch via deploy-menu or on-foot live-terminal, seating via `OnPlayerDeployed` + `ForcePlayerToSeat` (BountyHunter pattern).

### #76 — CQ_Polish_Respawn_Redeploy_Timer_Audit
Status: Open — narrowed (v1.418). The `holdPlayerAtDeploy` global-application concern is **resolved-by-removal**: that function (and the `HUD_WARM_REDEPLOY_BLOCK_SECONDS` site) was deleted in Wave 3 Ship 8 along with the loading-gate machinery. Remaining open: `SetRedeployTime(0)` persistence (one-shot vs persistent) is still empirically unverified, and respawn-timing tweaks on death and after HQ deploy are still TBD.

### #77 — CQ_Refactor_Gadget_Locker_v1.290_to_v1.313
Status: Resolved (v1.313). Authoritative per-player `State.players.lockerSlots` + slot-based `HasEquipment`-diff probe + per-class slot-toggle row with preference persistence. Supply Crate enum corrected to `Deployable_Vehicle_Supply_Crate`.

### #78 — CQ_Polish_Launcher_Ammo_Per_Launcher_Cap
Status: Resolved (superseded by v1.373; closure user-confirmed 2026-05-03). Substantively addressed by v1.373 work: uniform 3-rocket cap (#95), cap-defense gate at `giveRocketCharge`, read-back-verify with retry, and the +1-ammo non-destructive slot probe (#96). The original "charge consumed at cap" failure mode no longer fires because `atCap` now disables the tile and refunds any silent-clamp write.

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
Status: Likely Resolved (v1.372, user confirmation 2026-04-25). Not observed since the v1.341 `RemoveEquipment` `isSlotEmpty` precheck gate (and v1.342 + sweep guards). Needs MP confirmation before final close.

### #85 — CQ_Polish_Jet_Pitch_On_Air_Deploy
Status: Closed — Accepted (2026-05-03, user direction). Jet pitch (`rotPlane.X`) is lost on Air Deploy because `mod.Teleport` has no pitch/roll signature and `SetObjectTransform` is a no-op on Vehicle. Pilots pitch manually after seat — accepted as-is for V1; the sister-spawner workaround is not pursued. Reopen if a future engine update exposes a pitch-aware Teleport signature.

### #86 — CQ_Feat_Victory_Screen_Unify_Settings
Status: Open — Low-impact (2026-05-03 reclassification). Victory screen XvY settings diverge between round-end, admin panel, and HQ panels. Dropped from the player-known-issues list as low-impact (cosmetic only — single-source-of-truth refactor still desired, not blocking). Remains Open internally for the polish phase.

### #87 — CQ_Bug_Border_OutOfBounds_Rework
Status: Resolved (v1.370, user confirmation 2026-04-25). Closed by the v1.358–v1.370 boundary architecture pass: `CQ_Feat_Custom_GCZ_Restored` (v1.357), `CQ_Feat_Zone_Tracker_Refactor` (v1.360), `CQ_Feat_AreaTrigger_Enable` (v1.367), `CQ_Feat_Event_Driven_Seat_State` (v1.369), `CQ_Feat_Squad_Spawn_Zone_Inheritance` (v1.370), plus the spatial re-author at `MP_TWL_Conquest16_FireStorm.spatial.json`.

### #88 — CQ_Bug_Oil_Tanker_In_Ground_B
Status: Resolved (v1.379, user-confirmed 2026-04-26 + reaffirmed 2026-05-03). Map-side Godot fix applied — oil tanker repositioned out of the ground at flag B. No code change required.

### #89 — CQ_Polish_Vehicle_Spawn_Messaging_To_Admin_Panel
Status: Resolved (v1.380, closure user-confirmed 2026-05-03). Emitter at `index/vehicle-events.ts:84-89` wrapped in `FEATURE_PERF_DIAG && State.admin.perfDiagEnabled` gate. Off in production (compile-time strip via `postbuild.js`); toggleable via the existing perfDiag admin button when running diag builds. Bundle delta: −362 bytes.

### #90 — CQ_Bug_Launcher_Slot2_Double_Give
Status: Likely Resolved (v1.372, user confirmation 2026-04-25). Not observed since the v1.339–v1.344 launcher-probe + ammo-write polish (wielded-bail removal, launcher-ammo preservation across destructive probes, read-back/retry on ammo writes, sibling-slot disambiguation). Needs MP confirmation across RPG↔AT4 swap scenarios.

### #91 — CQ_Audit_Engine_Enable_Calls
Status: Resolved — audit clean (v1.372, Tier 3.1). Enumerated every `mod.Enable*` SDK function; for each engine-object enable, traced our object usages and confirmed the right enable state is applied at game-mode start. `AreaTrigger`, authored + spawned `InteractPoint`, authored + spawned `WorldIcon`, and runtime-spawned `VFX` are all wired correctly (the v1.367/v1.166/v1.064 lessons). `SpatialObject`, `GameModeObjective`, `MCOM`, `Sector` are unused. `HQ` is read-only (map detection). The v1.367 EnableAreaTrigger lesson does NOT generalize to a hidden bug. One latent risk noted (authored InteractPoint enable depends on `applyMapConfig` running, which is gated by `detectMapKeyFromHqs`); already mitigated by the per-second `ensureActiveWorldInteractablesReady` retry.

### #92 — CQ_Audit_CapturePoint_HotPath_State
Status: Resolved — audit clean (v1.372, Tier 3.2). Inventoried every `mod.GetCapture*` / `GetPlayersOnPoint` call site. Per-subtick polling in `syncMappedCapturePointsFromEngine` (~100 capture-point engine queries/sec across 3 mapped points) is **intentional and load-bearing**: it backstops missed `OngoingCapturePoint` neutralization-edge samples per the in-code rationale. Owner/progress queries must remain. One actionable optimization deferred: replace `mod.GetPlayersOnPoint` inside the polling with a cached `onPointPids` set fed by `OnPlayerEnter/ExitCapturePoint` (saves ~25 engine queries + array allocations/sec at 3 mapped points). Defer until a 64p playtest with `FEATURE_PERF_DIAG=true` confirms the section-1 cost is measurable.

### #93 — CQ_Bug_GetVehicleFromPlayer_Boundary_ForwardDeploy
Status: Resolved (v1.374) pending MP confirmation. Call-site audit revealed the dominant fire path was [player-deploy.ts:71](../src/index/player-deploy.ts#L71) inside `onPlayerDeployedImpl` (not `enforcement.ts:530` as initially suspected — that site is gated to non-slot deploys and skipped on Forward/HQ/Air). The deploy-time call seeded `posDebugVehicleObjIdByPid` cache, which is consumed only by `FEATURE_POSITION_DEBUG=false`-gated code (off in production for 80+ versions). Wrappers `safeGetVehicleFromPlayer`/`safeGetPlayerVehicleSeat` that read the cache have effectively zero callers. Net production effect: seeding a dead cache, paying for engine error log on every deploy timing race. **Fix:** deleted lines 65-76 of `player-deploy.ts`. `OnPlayerEnterVehicle` continues to populate the cache for the normal entry path if `FEATURE_POSITION_DEBUG` is ever re-enabled. Boundary classification is event-driven via seatKind (v1.369) and unaffected. Boundary-side probe at `enforcement.ts:530` left as-is — rare squad-spawn-into-aircraft edge case, already gated by `IsInVehicle`. Bundle delta v1.373 → v1.374: −418 bytes.

### #94 — CQ_Bug_GetInventoryAmmo_SupplyBox_OpenMenu
Status: **Resolved (v1.447 menu-open path + v1.448 placement path, 2026-05-03, pending MP confirm)**. Originally captured in v1.372B; marked "Resolved (not reproducing)" at v1.379 prematurely. Re-emerged in v1.408 SP smoke test ([screenshot](../reference_design_documentation/testing_images/20260427212633_1.jpg)) — `GetInventoryAmmo` + `GetInventoryMagazineAmmo` engine errors fired multiple times when a Medic player opened the Supply Box and selected medic gadgets / smoke artillery. **Class-agnostic** (rules out the v1.372B Assault-specific hypothesis). **Not a Wave 1/2 regression** — pre-existing latent bug; Waves 1 (v1.407) and 2 (v1.408) did not modify `ammo-resupply-menu.ts`. **Impact correctly framed (corrected from "cosmetic only"):** every engine error log entry allocates against the same JS heap that crashed at 16p in [#109](#109--cq_bug_16player_playtest_js_memory_limit). At 4 errors per menu interaction × N players × N opens per match, accumulated allocation is non-trivial against the heap envelope Wave 6 just spent ~280 widgets/pid reclaiming. **Resolution shipped at v1.447** via per-class scoped probes (variant of fix path #2): Engineer's `probeSlot` left untouched (launcher detection requires its destructive-probe semantics — works "best it can"); 3 new HasEquipment-based per-class probes added (`probeAssaultSlot`, `probeMedicSlot`, `probeReconSlot`) + dispatcher (`probeSlotForClass`); wired into both consumers (`initLockerSlotStateFromProbe` first-open + `reprobeSiblingGadgetSlot` placement-time). Pre-Ship audit confirmed the original Path A ("class-gate the entire probe") would break tile dup-dim for non-Engineer classes since all 4 classes use `GadgetTwo` for at least one gadget per `DEFAULT_GADGET_LOCKER_CONFIG`. Plan: [`5.03.26_conquest_supplybox_medic_fix_plan.md`](./5.03.26_conquest_supplybox_medic_fix_plan.md). Bundle delta: +2,614 bytes (v1.447) −362 bytes (v1.448) = +2,252 bytes net. **v1.448 follow-up:** v1.447 SP-test pushback ("still triggers as a medic and as assault") revealed the menu-PLACEMENT path was still emitting engine log via `isSlotEmpty()` ([line 875-880](../src/interaction/ammo-resupply-menu.ts#L875)) which itself calls `GetInventoryAmmo` + `GetInventoryMagazineAmmo`. v1.448 dropped the `isSlotEmpty` + slot-targeted RemoveEquipment precheck from `giveMedicSmoke`, `giveAssaultItem`, `giveReconItem`. Combined v1.447+v1.448: non-Engineer classes emit ZERO `GetInventoryAmmo` errors on either menu-open OR placement.

### #95 — CQ_Bug_Launcher_Ammo_Cap_Below_Designed
Status: Resolved (v1.373) pending MP confirmation. User dropped the engine-clamp investigation in favor of a uniform 3-rocket cap. Implementation: changed all three `launchers[]` entries at [ammo-resupply-menu.ts:67-69](../src/interaction/ammo-resupply-menu.ts#L67) to `maxAmmo: 3`. Added new `STR_UI_LAUNCHER_AT_CAP` constant (string-key `twl.ui.atCap` = "FULL", user-approved). Extended the cd-label and cd-color branches at [:2314-2326](../src/interaction/ammo-resupply-menu.ts#L2314) so when `atCap === true` the countdown shows "FULL" in `COLOR_GRAY` instead of "READY" in green. Existing `atCap` gate already drives `ammoEnabled` false at cap so charges aren't consumed. v1.343 read-back-verify continues to refund charges if engine clamp ever silently no-ops a write.

### #96 — CQ_Bug_Launcher_Slot_Identification_Zero_Ammo
Status: Resolved (v1.373) pending MP confirmation. User rejected the cache-at-events approach (kit pickup mid-life invalidates pre-menu cache) in favor of a non-destructive +1-ammo probe at menu-open / launcher-placement. Replaced the v1.344 short-circuit at `probeLauncherSlot` with: (Step B2) cheap-positive populated check — slot with `loaded > 0 || mag > 0 || active` is populated, no write; (Step B3) +1-ammo disambiguation — for slots reading 0/0/inactive, write `loaded + 1` and read back; populated iff the +1 took (empty slot's write silently no-ops). Branches: only-slot-1 → return GadgetOne; only-slot-2 → return GadgetTwo; both-populated → existing destructive RemoveEquipment + HasEquipment-diff (now operates on post-+1 state); neither → bail with undefined. Hoisted ammo snapshots + `before[]` HasEquipment scan to top of function so a single `restoreOriginalState` helper writes back original ammo + ForceSwitchInventory on every exit branch. Synchronous; ~microseconds; no combat-interruption window. Cold-spawn 0-ammo launcher case: launcher slot accepts +1, empty slot's write no-ops → identified without destructive probe → no clobber risk.

### #97 — CQ_Polish_SupplyBox_DisabledFocused_Indicator
Status: Resolved (v1.375) pending MP confirmation. Console / controller players had no visual cue when navigating across disabled tiles in the Supply Box menu. Implementation: per-pid `armFocusedTileKeyByPid` state, FocusOut events wired alongside FocusIn at the two tile-button creation sites, `setTileVis`/`setActVis` accept a `focused` param that paints `COLOR_WHITE_LOW` (cool blue-white) on the border + lifts button bg from `COLOR_GRAY_DARK` to `COLOR_GRAY` when `!enabled && focused`. `handleArmMenuEvt` derives a stable tile key (`"a:N"` / `"m"` / `"x:N"` / `"row:N"` / `"e"` / `"q:N"`) on FocusIn and force-refreshes the menu so prev-focused and new-focused tiles both repaint via per-tile sig (now includes a focused-bit). Cleanup on `setArmOpen(pid, false)` (menu close), `resetArmState`, and the player-leave handler. Close button intentionally excluded (always enabled). Bundle delta v1.374 → v1.375: +2,776 bytes (1.44% headroom). Plan: [`design_doc/supply_box_disabled_focus_indicator_plan_2026-04-25.md`](../design_doc/supply_box_disabled_focus_indicator_plan_2026-04-25.md).

### #98 — CQ_Bug_FlagSpawn_FalsePositive_OOB
Status: Resolved (v1.376) pending MP confirmation. Solo flag-spawn (no teammate within `SQUAD_SPAWN_PROXIMITY_RADIUS_METERS = 25m`) was falsely firing `ground_combat_zone` violation 1.5s after deploy because the engine doesn't fire `OnPlayerEnterAreaTrigger` on spawn-inside-trigger — `seedZoneStateFromSpawnContext` for non-slot deploys left all zones `false`, classifier saw `inSafeGround=false`, returned OOB. **Fix shipped v1.376:** restructured the non-slot branch into three guarded steps — (1) HQ-anchor probe sets `inOwnHQ=true` and returns; (2) `tryInheritZonesFromNearbyTeammate` returns true and returns (only path that delivers definitive OOB-on-spawn proof); (3) NEW default-in-bounds fallback sets `inGCZ=true`. Squad-spawn-onto-OOB-teammate inheritance behavior preserved unchanged. Trigger exit events still flip `inGCZ=false` if the player walks out of the GCZ trigger after a default-in-bounds spawn. Bundle delta: +124 bytes. Plan: [`design_doc/flag_spawn_oob_default_inbounds_plan_2026-04-25.md`](../design_doc/flag_spawn_oob_default_inbounds_plan_2026-04-25.md).

### #99 — CQ_Polish_GadgetSlot_Selector_Top_Row_Focus_Highlights
Status: Open (v1.376). Punch-list extension of #97. The v1.375 disabled-focused border indicator was scoped to the gadget tile buttons but does not paint on the top-row prev/next slot selectors (`SlotTogglePrev` / `SlotToggleNext`). Console / controller players hit the same missing-feedback problem when navigating to a disabled slot-toggle row. Fix: mirror the v1.375 pattern — wire `FocusIn`/`FocusOut`, extend the `tileKey` resolver in `handleArmMenuEvt` to emit a stable key for these widgets (e.g. `"slotToggle:<class>:<dir>"`), and pass `focused` through to the existing `setActVis` call site. Estimated 30–60 min, +200–300 bytes.

### #100 — CQ_Bug_FlagB_Spawn_Failure
Status: Open — Deferred to custom spawner work (2026-05-03 reclassification). Repro narrowed: failure only fires when a team owns **flag B + flag C but NOT flag A**. Underlying Godot spawner limitation in the captured-by-team state of B under that ownership topology — distinct root cause from #98 (post-spawn OOB false-positive). Will be addressed as part of the planned **custom player spawner system** rather than a spot-patch on the current Godot-driven spawner. May still overlap with #88 (oil-tanker-clipped-into-ground at flag B, also Godot-side). Listed on the player-facing known-issues page so players can avoid the failure mode in-match.

### #101 — CQ_Tweak_Vehicle_Display_Name_Defaults
Status: Open (v1.376). Punch-list tweak: add faction tags to default vehicle display names. `vehicleShortFlyer60`: `"Flyer 60"` → `"Flyer 60 NATO"` (or similar). `vehicleShortVector`: `"Vector"` → `"Vector PAX"` (or similar). Pure string update in `strings.json`; no code change. Player-facing — needs explicit approved copy per AGENTS.md `String Change Authorization Policy` before edit.

### #102 — CQ_Tweak_Team_Names_Add_Faction
Status: Resolved (v1.377) pending MP confirmation. Added 8 new combo entries to `twl.teams` in [`strings.json`](../src/strings.json) — `WEST_NATO`, `WEST_PAX`, `EAST_NATO`, `EAST_PAX`, `NORTH_NATO`, `NORTH_PAX`, `SOUTH_NATO`, `SOUTH_PAX` (each rendered with `/` separator e.g. `"WEST / NATO"`). Original 4 bare directionals retained — total 12 options selectable per map per team. Firestorm defaulted to `WEST_NATO` (Team 1) + `EAST_PAX` (Team 2); other maps freely pick their own combo. No code change — `team1Name`/`team2Name` field type was already `number` (string-key id) and existing consumers in [id-helpers.ts:129-130](../src/state/id-helpers.ts#L129) work transparently. Bundle delta: +9 bytes (strings are in the strings.json bundle, not the script bundle).

### #103 — CQ_Tweak_Bleed_Rate_Mancours_Calibration
Status: Open (v1.376). Punch-list design item: recalibrate ticket bleed rates against Mancours-style reference values. Specific target rates TBD; user to source. Tunable via `BLEED_*` constants in [`config/conquest-constants.ts`](../src/config/conquest-constants.ts); no structural change. Bleed system at `applyBleedTick` in [`index/capture-tickets.ts`](../src/index/capture-tickets.ts).

### #104 — CQ_Audit_Weapon_Gadget_Bans
Status: Open (v1.376). Punch-list audit: re-review current weapon / gadget ban list against current design intent. Tip 7 in the join prompt currently states "all gadgets except torch and supply crates are banned" but the v1.290–v1.329 gadget-locker / Forward / Air expansions broaden the playable surface. Output: list of discrepancies between ban config and current gadget-locker offerings; updated Tip 7 copy if needed (player-facing — would need approval to edit).

### #105 — CQ_Bug_HardCrash_LateJoiner_ApplyConfig
Status: Resolved (v1.381) pending MP confirmation — **fix mechanism replaced in v1.418 (Wave 3 Ship 8)**. User-reported hard server-process crash (whole server died, no error log) during pre-LIVE combination of late-joiners + Apply Configuration + team swaps. Theory: Apply Config's per-player widget rebuild paths (`prebuildAndRevealVehicleDeployTimerHudForAllPlayers`, `cleanupActiveWorldInteractableRuntimeIconsForAllPlayers`, `applyVehicleSpawnSpecsToExistingSlots`) iterate over every pid via `forEachValidPlayer`. A late-joiner mid-`prebuildAllUiFamiliesHidden` has a partially-populated UI cache; parallel rebuild on top of it produces engine-level invalid-handle hard crashes that script try/catch can't catch. **Fix shipped v1.381:** new `State.players.warmPrimeActiveByPid` flag set in `prebuildAllUiFamiliesHidden` outer try and cleared in finally + player-leave cleanup. `confirmReadyDialogModeConfig` checks this flag at entry and refuses with player-visible world-log "Cannot apply: N player(s) still loading" if any pid is mid-warm. Dialog state remains "Unsaved changes" so user can retry once loaders settle. Bundle delta: +668 bytes. Plan: [`design_doc/apply_config_late_joiner_guard_plan_2026-04-26.md`](../design_doc/apply_config_late_joiner_guard_plan_2026-04-26.md). Followup left open: late-joiner whose warm STARTS after Apply Config began — if recurs in MP, ship symmetric `applyConfigInFlight` guard as v1.382. **v1.418 Wave 3 Ship 8 update:** the `warmPrimeActiveByPid` flag, the Apply guard branch, and `prebuildAllUiFamiliesHidden` itself were all deleted along with the loading-gate machinery. The lazy-build dispatcher's per-surface in-flight guard (`_lazyBuildInFlightByName`) now owns the same race-shape protection, but the original crash scenario has not been re-verified at scale post-Ship-8. Reopen if recurs in MP at 24+ players.

### #106 — CQ_Bug_HighSev_Y200_OOB_HeliSlot2_SeatKindStale
Status: Resolved (v1.383) pending MP confirmation. User-reported: three different players walked into AH-6M heli (heli slot 2) on foot during live round, flew up, and were marked OOB at Y=200 ceiling despite being in aircraft. The Y=200 OOB check at [enforcement.ts:252-258](../src/boundary/enforcement.ts#L252-L258) only fires when `state.seatKind === "on_foot"` — so all three players had `seatKind` cached as on_foot while physically in the heli. `classifyVehicleSeatKind` defaults to `ground_vehicle` (not on_foot) on a binding miss, so this is not a slot-binding gap. Most likely cause: `OnPlayerEnterVehicle` engine event did not fire on entry (engine reliability gap, same family as `CQ_Bug_43`). **Fix shipped v1.383:** safety-net engine re-probe in `getDesiredBoundaryViolationKind`. When the on_foot Y>200 branch is about to fire OOB, re-probe `mod.SoldierStateBool.IsInVehicle`; if engine reports the player IS in a vehicle, self-correct via `setPlayerSeatKind(player, "aircraft")` and exempt this tick. Single-writer paradigm preserved (calls existing `setPlayerSeatKind`). Aircraft early-return at line 247 ensures the re-probe runs at most once per missed enter event. Does not address root cause (missing event); if recurs in MP, recommend Phase A diagnostic world-log when safety-net trips. Leave open until MP repro confirms fix.

### #107 — CQ_Tweak_SpawnCharge_Exempt_Vehicle_And_TeamSwitch
Status: Resolved (v1.393) pending MP confirmation. Phase 2B spawn-charge model charged 1 ticket on every deploy event regardless of reason; surfaced during #103 bleed-rate tuning that vehicle HQ/Forward/Air Deploy from on-foot AND team-swaps were eating tickets despite being voluntary UX actions, not deaths. **Fix shipped v1.393:** added new `vehicle_deploy` reason to `ConquestSpawnChargeReason` union; updated 4 counter initializers; `onPlayerDeployedSpawnCharge` now early-returns on `reason === "vehicle_deploy" || reason === "team_switch"` after the diagnostic counter increment but before the ticket charge. `hq-deploy.ts` on-foot branch marks `vehicle_deploy` before `UndeployPlayer`. Diagnostic counts preserved in `deployCountByReason`; only `chargedCountByReason` reflects actual ticket impact. Behavior matrix: death-respawns / forced-redeploys / admin-moves / phase-transitions / reconnects still charge; alive-on-foot vehicle deploys + pre-game/live team-swaps now exempt. Bundle delta: +397 bytes. Plan: [`design_doc/spawn_charge_exempt_reasons_plan_2026-04-26.md`](../design_doc/spawn_charge_exempt_reasons_plan_2026-04-26.md). Companion to #103.

### #108 — CQ_Tweak_HQ_SupplyBox_Disable_OnLive
Status: Resolved (v1.394) pending MP confirmation. HQ-located supply boxes on Firestorm (objIds 1056 at Team1 HQ, 1057 at Team2 HQ) were equally available pre-LIVE and during LIVE; user wants players incentivized to leave their HQ for resupply during live play. **Fix shipped v1.394:** generic `disableOnLive?: boolean` flag on `WorldInteractableAnchorConfig` + `WorldInteractableConfig`; set `disableOnLive: true` on the two HQ anchors. New `isWorldInteractableDisabledByLive(config)` helper integrated at 3 gate sites (interact-point enable, VFX spawn-bulk, VFX ensure-single). `refreshDisableOnLiveInteractableStateForLiveTransition()` called from `startMatch` immediately after `cleanupMainBaseTeamWorldIconsForLiveTransition()` so HQ smoke + interact disappear within a frame of match-live, not waiting on the per-second refresh. Non-HQ boxes (1050-1055) unaffected. Generic by design — any future map can mark any interactable with the flag, not limited to HQ supply boxes. Bundle delta: +1,160 bytes. Plan: [`design_doc/hq_supply_box_disable_on_live_plan_2026-04-26.md`](../design_doc/hq_supply_box_disable_on_live_plan_2026-04-26.md).

### #109 — CQ_Bug_16Player_Playtest_JS_Memory_Limit
Status: **Awaiting MP confirmation (Wave 3 complete, v1.419, 2026-05-01).** Original observation (v1.406, 2026-04-27): Mod Evaluator terminated the script at load during a 16-player MP playtest with `Mod has reached its js script memory usage limit. It has been terminated`. Bundle was 872,014 bytes — well below the 1,048,576-byte upload cap (~17% headroom) — so the upload byte cap was **not** the failure axis; runtime JS heap was. Wave 3 (v1.409–v1.419) targeted the per-pid allocation contributors directly: every UI surface (top HUD shell, vehicle deploy timer, supply box, combat HUD, boundary prompt, ready dialog) now builds via `triggerLazyBuild` only when used; the loading-gate machinery is deleted; `readyDialogData_t` lost 18 fields; `warmPrimeActiveByPid` removed; ~30 `hud-warm-state.ts` accessors deleted; `loading-overlay.ts` deleted; `setAllInputRestrictionsForPlayer` + `primeReadyDialogRevealWhileBlocked` + `warmHiddenReadyDialogCacheForPid` deleted. **Bundle: 877,390 → 847,560 bytes (−29,830). Headroom: 16.33% → 19.17%.** Per-pid heap shape collapsed substantially more than the bundle delta, since fields gone are paid 16+ times. **Verification:** re-run a 16+ player (ideally 24+) MP playtest with v1.419 (or later); goal is full Pregame → LIVE → Victory without termination. If termination recurs at 24+ players, the remaining largest per-pid contributors are M1 (`vehicleDeployTimerCache`, ~150–250 widget refs/pid) + the combat HUD entry graph (M3) — both are Wave 4 candidates. Reclaim plan + Mn ranking maintained in [`conquest_optimization_analysis.md`](./conquest_optimization_analysis.md). **Update — Wave 6 shipped v1.443+v1.444 (combat HUD compass shadow rings eliminated, ~280 widgets/pid reclaim, `maxPasses` 128→4 for ~70% disconnect-spike reclaim, join-trigger stagger across 3 frames). 13-15p MP test passed cleanly without termination at v1.442 baseline; Wave 6 + WAIT label (v1.446) await next MP playtest at 16+ to confirm.**

### #110 — CQ_Bug_57_SquadSpawn_HQ_OOB
Status: Resolved (v1.442, pending MP confirm). User-observed: a player squad-spawning onto a teammate currently inside their team's main base trigger gets immediately flagged as out-of-bounds (pre-live `MATCH IS NOT LIVE; RETURN TO YOUR MAIN BASE!` or live `YOU ARE OUT OF BOUNDS; RETURN NOW!`). Teammate spawn target is correctly inside HQ and not flagged; spawner is also physically at HQ but the boundary classifier disagrees. Root cause: `tryInheritZonesFromNearbyTeammate` in [`boundary/enforcement.ts`](../src/boundary/enforcement.ts) was copying 4 zone flags from the teammate (`inOwnBuffer`, `inGCZ`, `inEnemyHQ`, `inEnemyBuffer`) but explicitly omitting `inOwnHQ` based on the original Wave 6 design that "anchor probe owns inOwnHQ". When the teammate had `inOwnHQ=true` and all-other-flags=false, the spawner inherited all-false, the inheritance branch returned true (which prevented the anchor-radius fallback from setting `inOwnHQ=true`), and the classifier fired a violation kind. Fix: one-line addition `state.inOwnHQ = teammateState.inOwnHQ || state.inOwnHQ;` so the spawner inherits the teammate's HQ status if positive, OR retains the anchor-radius probe result if it had already set it (preserves the original "anchor probe wins" semantic for the case where teammate is at trigger edge but spawner anchor-probe is decisive). Squad-spawn on HQ teammate now correctly seeds `inOwnHQ=true`. Bundle delta: ~+50 bytes.

### #111 — CQ_Bug_58_ReadyState_Persists_Through_Death_And_HQ_Exit
Status: Resolved (v1.445, pending MP confirm). User-observed: pre-game READY state was getting auto-cleared by gameplay events the user did not intend, specifically (a) every respawn-after-death (the engine `OnPlayerDeployed` callback at `player-deploy.ts:42-43` unconditionally cleared `readyByPid`/`readyNeedsReconfirmByPid`) and (b) every pre-live exit from the player's own HQ trigger (`notePreliveMainBaseViolation` helper in `boundary/enforcement.ts`, invoked from `enforcement.ts:330` per-tick refresh and `area-triggers.ts:112` immediate AreaTrigger exit event). Fix: 4 edits across 3 files — deleted the deploy-event clear (Edit 1), removed both `notePreliveMainBaseViolation` callers (Edits 2+3), deleted the now-unused function definition (Edit 4). Auto-unready triggers reduced to exactly two legitimate cases: **(1) team switch** (player clicks SWAP TEAMS — `swap-action.ts:17`) and **(2) admin config change** (`requireReadyReconfirmAfterConfigChange` for non-admin viewers + `forceUnreadyApplierAfterConfirm` for the admin themselves on APPLY — `mode-config-presets.ts`). Match-start fresh-cycle reset (`resetReadyStateForAllPlayers`), explicit READY/NOT READY button clicks, and join/leave housekeeping all preserved. Plan archive: [`5.02.26_conquest_ready_tuning_plan.md`](./5.02.26_conquest_ready_tuning_plan.md). Bundle delta: −754 bytes.

### #112 — CQ_Tweak_WAIT_Label_OnTimerBar
Status: Resolved (v1.446, pending MP confirm). UX polish: the vehicle deploy timer rows now display a "WAIT" label drawn on top of the red/gray progress bar (black text, centered inside the bar plate area) so players can read the bar's purpose at a glance. Visible only in timer mode; hidden when the row transitions to READY/ACTIVE/SPAWNING/DEPLOYING status modes (toggled in lockstep with `barBorder`/`barFill` via the three visibility setters in [`clock/timer-instance.ts`](../src/clock/timer-instance.ts)). Implementation: new `barText` field on `ReusableTimerWidgetCacheEntry`, new `twl.ui.wait = "WAIT"` string key, new `buildReusableTimerBarText` helper inserted in the `safeParseUI` children array AFTER `buildReusableTimerBarFill` so it draws on top in z-order. Wired into `purgeReusableTimerInstance` (cleanup), `ensureReusableTimerInstance` (cache resolve + validity check + post-parse find), and all three visibility setters. Bundle delta: +933 bytes (script) +30 bytes (strings).

### #113 — CQ_Bug_Console_DeployScreen_Vehicle_Buttons_Unresponsive
Status: **Resolved (v1.465 + v1.466, 2026-05-04).** Two-ship fix. Original speculation that the bug was an input-mode / cursor-routing gap proved incorrect. Actual cause: the Vehicle Deploy buttons fired their spawn-request action on `ButtonUp` only, while the engine's deploy-on-foot action consumed the same controller input synchronously — so by the time `ButtonUp` reached the userland handler, the engine had already deployed the player on foot. **v1.465** moved the action to fire on the first primary-click event (`ButtonDown` or `ButtonUp`, whichever the engine delivers) using the existing `tryConsumeUIButtonPrimaryClickEvent` dedupe helper — same pattern as the team-swap button which had always worked on console. **v1.466** addressed the residual race where the engine's deploy-on-foot still completed before the vehicle finished spawning: added a per-player `mod.EnablePlayerDeploy(player, false)` block in `requestHqVehicleSpawn` / `requestForwardVehicleSpawn` / `requestAirVehicleSpawn`, paired with `EnablePlayerDeploy(player, true)` in `beginHqSeatFlow` immediately before `mod.DeployPlayer`, plus paired re-enables on every claim-clear path (`scheduleHqClaimTimeout`, `onHqSeatPendingPlayerDeployed`) and a defensive re-enable in `cleanupHudForPid` for player disconnect. Per-player only — does NOT touch the global `mod.EnableAllPlayerDeploy` API used by countdown-flow / conquest-flow. Plans archived: [`5.04.26_conquest_vehicle_deploy_buttondown_fix_plan.md`](./5.04.26_conquest_vehicle_deploy_buttondown_fix_plan.md), [`5.04.26_conquest_vehicle_deploy_block_engine_deploy_plan.md`](./5.04.26_conquest_vehicle_deploy_block_engine_deploy_plan.md). Console MP playtest validation pending.
