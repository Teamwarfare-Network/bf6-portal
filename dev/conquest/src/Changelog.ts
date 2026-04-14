// @ts-nocheck
// Module: compact runtime changelog

//#region -------------------- Changelog / History --------------------

// v1.222: Revert GATE_INV_1/2/3 world-log asserts (v1.214): world-log channel is transient and unreliable for invariant verification. Dual-guard in code closes the race. Diagnostic recipe documented in conquest_issues.md for future reintroduction as persistent HUD plate if a concrete bug repro surfaces.
// v1.221: Combat HUD dirty-flag gate: skip expensive per-player TickFrame when hudDirty=false and not forced; keep derived-slice + animation ticks unconditional (clock/anim are time-variant). AGENTS.md documents the dirty-flag contract (state fields that must call conquestPhase3MarkHudDirty).
// v1.220: fix: tick-context ActiveTickContext.players typed as any (mod.Array is not generic in Portal types)
// v1.219: TickContext for per-tick mod.AllPlayers() caching in hot subtick loop — adds beginTickContext/endTickContext wrapping the main subtick body so every forEachValidPlayer call inside a subtick reuses one cached AllPlayers snapshot. Event handlers and one-shot lifecycle transitions fall back to a fresh AllPlayers call (no behavior change).
// v1.217: forEachValidPlayer helper + 23 wrapper conversions — dedupes the mod.AllPlayers + IsPlayerValid + safeGetPlayerId loop that was being repeated across ForAllPlayers wrappers. No behavior change; sets up TickContext in the next commit.
// v1.216: Combat HUD widget generation counter — invalidate cached widget refs on destroy so team swap + reconnect cycles cannot render through stale handles. Adds combatHudGenerationByPid to State.conquest.debug, stamps each entry on build, and bails + recovers in the render path on stamp mismatch.
// v1.215: Cache loading-overlay exists flag; drop redundant safeFind in vehicle deploy timer cache build
// v1.214: Add loading gate invariant asserts (GATE_INV_1/2/3) for SP-testable verification
// v1.213: remove FEATURE_WORLD_ICON_DIAG telemetry: drop flag const, diag state fields, CQ52 admin counter widget + string + sync fn; HQ/gadget WorldIcon spawn/render code unchanged
// v1.212: KPI: exclude team kills from kills counter (portal OnPlayerEarnedKill fires on friendly fire)
// v1.211: gadget locker: post-LIVE status line uses 'will be available in Xs' variant while counting; pre-LIVE keeps 'after match is Live'
// v1.210: round-start gadget delay: gate locker tiles + 4th countdown line (gadgets) + menu status message
// v1.209: stagger pregame countdown delay-info lines (0s/+3s/+6s), raise above countdown digit, fix hide-on-LIVE by preserving delay widget refs across cache ensure
// v1.208: pregame countdown: display 3 delay-info lines above countdown digits showing map-config air/airDeploy/forwardDeploy delays; hidden when value is 0
// v1.207: v1.206: fix frozen round-start delay countdown - include delay state in render signature so cache invalidates every tick
// v1.206: v1.205: round-start delay countdown ticks every second via self-terminating HUD loop
// v1.204: v1.204: forward deploy free-space check + round-start deploy delay constants (airDelay, airDeployDelay, forwardDeployDelay)
// v1.203: fix forward deploy: add suppressNextBindSpawnTransformCorrection to prevent vehicle teleport back to HQ pad
// v1.202: forward deploy: expand to all ground vehicles, fix existing pad vehicle blocking forward spawn
// v1.201: strip aircraft-only fields from tank spawn volumes, make VehicleSpawnVolumeSpec aircraft fields optional
// v1.200: fix: capture mode as const for portal TS closure narrowing
// v1.198: fix: narrow mode type for portal TS compiler
// v1.196: Gadget locker config: replace hardcoded items/cooldowns with per-map GadgetLockerConfig; asg state uses indexed array; all menu functions read from ACTIVE_GADGET_CONFIG
// v1.195: Fix stale player name in vehicle deploy menu after undeploy/death — clear activeOwnerPid on undeploy since OnPlayerExitVehicle does not fire
// v1.194: Fix B1 residue: remove 48 stale sound/vo debug resets from conquest-scaffold, dead nextQueueDepth vars and orphaned braces from queue functions, empty if/else from flush dispatch
// v1.193: B2: consolidate duplicate hasValidHandle, safeUnspawn, and throttle-map-rebuild helpers from capture-sound/vo into shared capture-shared.ts
// v1.192: S1: fix armG/armL state leak on player leave; S2: clear vehicle activeOwnerPid on disconnect; B1: remove write-only sound/vo debug counters from state and code; Scoreboard: full column words (Score/Kills/Deaths/Assists/Captures), team names via SetScoreboardHeader, adjusted column widths
// v1.191: Fix BUG-A6 respawnRunning not cleared on reservation-gate early return; BUG-A8 enableToken guards in deploy-fulfillment async paths; BUG-A7 try/catch around GetObjectPosition in spawner-bind; Replace safeFindPlayer hot-path with direct pointPlayer in capture-tickets subtick loop
// v1.190: Headroom recovery: disable FEATURE_ADMIN_PANEL, FEATURE_POSITION_DEBUG, FEATURE_WORLD_ICON_DIAG (source preserved, excluded from bundle via flags). Delete commented VFX constants, join-prompt stubs, unused statusProbeCodex string. Remove duplicate destroyArmMenu and cleanupWorldInteractableRuntimeIconsForPid calls in player-join-leave. Cull 30 orphaned widget names from cleanup lists. Fix groundCombatZoneCeilingY from 100 to 200 (floor+height, not floor). Bundle 1,044,501 → 995,854 bytes; headroom 4,075 → 52,722 bytes.
// v1.185: Fix: scoreboard sync moved to 1s boundary (was every 0.12s subtick); remove mid-game SetScoreboardType reassert (engine UI rebuild stall); remove conflicting SetGameModeTargetScore from scoreboard init
// v1.184: Phase 9: fix deathsBaseline TS narrowing — delegate to kpiInitWithBaselineForPlayer
// v1.182: Fix: TS narrowing error on kpiByPid deathsBaseline access after init
// v1.181: Increase enemy main base buffer kill timer from 3s to 6s
// v1.180: KPI death baseline: subtract pre-match engine deaths so per-match count resets to 0 on go-live
// v1.179: Fix: exclude self-kills from KPI kill count (OnPlayerEarnedKill fires for suicides)
// v1.178: Phase 9: custom tab scoreboard with KPI tracking (kills, deaths, assists, captures, computed score)
// v1.172: Fix: use mod.UnspawnObject instead of non-existent mod.DestroyObject in VFX cleanup
// v1.171: VFX late-joiner fix: destroy-and-respawn cycle on player deploy with 2s cooldown; DestroyObject replaces EnableVFX(false) in cleanup; added objId 1058 gadget anchor
// v1.168: v1.168: Generic map-config-driven VFX spawning. VFX prefab enum and orientation vector now authored per-anchor in the map config via vfx/rot fields, mirroring the vehicle preset constant pattern (VFX_GREEN_SMOKE, VFX_YELLOW_SMOKE, VFX_VIOLET_SMOKE, VFX_RED_SMOKE). Deleted WorldInteractableSmokeColor type, classifyWorldInteractableSmokeColor derivation, and getSmokePrefabForColor lookup. Renamed smoke-specific state and functions to generic VFX equivalents. All 24 Operation Firestorm interactable anchors now carry explicit vfx fields.
// v1.167: v1.167: Runtime-spawn colored smoke markers at all world interactables (yellow=gadget locker, green=ready terminal, violet=deploy spawner as blue stand-in). HQ WorldIcons now pre-game only: torn down at startMatch via cleanupMainBaseTeamWorldIconsForLiveTransition and blocked from respawn by isMatchLive() guard in ensureMainBaseTeamIconForPlayer. Gadget scope no longer renders runtime WorldIcons (interact point stays functional). Stripped vfxObjIds config field, FEATURE_WI_VFX_MARKERS, FEATURE_WI_AUTHORED_POINT_OWNER, worldInteractableAreaByPidByObjId state, updateWorldInteractableAreaTriggerMembershipForPlayer, and 10+ dead helpers in world-interactables.ts. Smokes spawn once after applyMapConfig in onGameModeStartedImpl using the reference SpawnObject -> IsType(VFX) -> EnableVFX(true) -> SetVFXScale(1) pattern proven in v1.166.
// v1.166: v1.166: fix yellow smoke at gadget locker 1056 - call mod.EnableVFX(vfx, true) on SpawnObject result per fx-showcase reference pattern. VFX handles return disabled; missing the enable step was the root cause of v1.162-v1.165 silent failures. Also reverted v1.163-v1.164 diagnostics in world-interactables.ts (force-on EnableSpatialObject seed, runtime-spawn diag block, hardcoded occupied flag).
// v1.165: DIAG direct mod.SpawnObject FX_Granite_Strike_Smoke_Marker_Yellow at hardcoded gadget locker 1056 coordinates negative 729.66 slash 134.095 slash 202.982 from top of onGameModeStartedImpl no feature flag no config lookup no try catch matches minimal test harness pattern
// v1.164: DIAG runtime spawn FX_Granite_Strike_Smoke_Marker_Yellow at 1056 anchor pos via mod.SpawnObject once per session alongside existing EnableSpatialObject force on path validates which API path renders VFX for gadget locker marker test
// v1.163: DIAG force gadget locker 1056 VFX markers 10561 10562 permanently on bypass area trigger occupancy gating validates EnableSpatialObject works for the two FX prefabs before re-enabling toggling
// v1.162: Gadget locker VFX markers: placed SpatialObjects at 10561/10562 toggle on area-trigger occupancy for objId 1056. EnableSpatialObject-driven, config-threaded via vfxObjIds, FEATURE_WI_VFX_MARKERS flag.
// v1.161: Test 1: main_base HQ icons use SetWorldIconOwner(icon, team) via mod.GetTeam + team-scoped handle cache; drop per-player inMainBase gating. Test 2: point-scope authored WorldIcon direct owner-rotation (FEATURE_WI_AUTHORED_POINT_OWNER) to MP-validate authored-icon per-player filtering.
// v1.160: Classify HQ icon initial state by spatial check (100m radius); ground/air button short-circuits preserved for future per-map tuning
// v1.159: Replace transient WI diagnostic with persistent admin-panel widget; repurpose CQ52 counter row (3 nums)
// v1.158: CQ_Bug_55 air deploy HQ icon suppression: onPlayerDeployedImpl clears inMainBaseByPid[pid] when a consumed deploy was air-mode so the existing world-interactable sync call hides the HQ icons; snapshots pendingDirectSpawnMode before fulfillment clears the slot. Also adds FEATURE_WORLD_ICON_DIAG dev flag (default false, stripped by postbuild) emitting one DisplayHighlightedWorldLogMessage per WorldIcon spawn/destroy with encoded (pid, objId, action, total) payload for CQ_Bug_25 MP visibility diagnostic
// v1.155: CQ_Bug_53 v1.155: git archaeology revealed the whole Phase B/C regression story was a phantom — HQ pre-step was never actually removed in any committed state. Only real net delta from b228efc was the Phase A pre-seat player teleport, which matches the v1.106-v1.108 teleport-before-ForcePlayerToSeat pattern the team already knew caused vehicles to spawn at map center. Stripped Phase A teleport entirely; deploy-fulfillment.ts now byte-equals b228efc. CQ_Bug_53 original goal deferred.
// v1.154: CQ_Bug_53 v1.154: revert Phase B/C, restore v1.151 HQ SpawnPlayerFromSpawnPoint pre-step + Phase A teleport shape to stop engine OOB latch regression; v1.155 SP-only instrumentation build planned to investigate root cause
// v1.153: CQ_Bug_53 Phase C: one-shot 150ms settle before Phase A teleport on the fresh-aircraft path to cover the aircraft-pose, Abrams-reject, and on-foot-tracker commits that the v1.152 HQ spawn-point removal had been implicitly providing; v1.152 showed engine OOB latching for 10+ seconds on the pre-seat teleport window
// v1.152: CQ_Bug_53 Phase B: strip HQ spawn-point forcing chain, delete dead helpers and dead VEHICLE_DEPLOY_SPAWN_POINT_ID config; air deploy is now fully spawn-point-independent. Phase A teleport-above-aircraft from v1.151 stays. CQ_Bug_54 opened to track the residual fresh-aircraft runtime-spawner race separately.
// v1.150: CQ_Bug_52 air deploy silent-failure hardening: close expectingSpawn leak in bind-tracker expired branch, add 10s watchdog reap, force HUD refresh on bind, add temporary CQ52 desync counter widget
// v1.149: admin position-debug toggle sticks across reveal paths (CQ_Bug_51)
// v1.148: fix pre-deploy GetSoldierState error from reveal-path position-debug sync sample (CQ_Bug_50)
// v1.147: remove redundant v1.145 deferred orphan-tank sweep (CQ_Bug_39 noise reduction); v1.146 inline intercept already reaps rejected wrong-category vehicles synchronously
// v1.146: CQ_Bug_49: intercept wrong-category default-auto-spawn at top of onVehicleSpawnedImpl before the failed-bind fallback force-binds the Abrams to the aircraft slot
// v1.145: fix CQ_Bug_49 v2: reject tank-instance binds on aircraft slots via bindSpawnedVehicleToSlot guard + deferred orphan sweep - revert v1.144 layout change which made the race guaranteed
// v1.144: fix CQ_Bug_49: tank-in-air on heli/jet direct spawn - defer active tracking and sweep default Abrams at birth-spawn position before forcing real aircraft spawn
// v1.143: fix CQ_Bug_44: refresh deploy timer HUD on undeploy so ground/air deploy menu appears immediately on deploy screen instead of waiting for next vehicle event or live-tick heartbeat
// v1.142: abandonment tuning for conquest: grace 2s->30s, radius 5m->100m, spawner radius 25m->50m, respawn 15s->120s
// v1.141: plane air deploy rotX -75 to -45 (less steep pitch)
// v1.140: relocate spawner when transport slot anchor changes between fast mover and heli pad positions
// v1.139: revert team1 fast mover slots 2-4 to original rotY; only slot 1 = 134
// v1.138: team1 fast mover rotY=134 all slots; team2 fast mover revert slot1, slot4 rotY=-90
// v1.137: ground deploy all: use runSequentialSpawns for proper bind/teleport orientation correction
// v1.136: ground deploy all: configure spawner vehicle type from knob selection before forcing spawn
// v1.135: remove stale position debug duplicates from admin-panel/build; guard setPerfDiagEnabled behind FEATURE_PERF_DIAG
// v1.134: restore admin panel; add Ground Deploy All button
// v1.133: remove CompareVehicleName binding guards; fixes Gepard spawn loop (CQ_Bug_43)
// v1.132: fix team2 jet/heli3/transport1 rotY orientations; investigate Gepard binding failure
// v1.131: fix Vector/RHIB missing from fast_mover spawn category; deploy timer now tracks them
// v1.130: fix Cheetah/Gepard label swap in deploy timer UI; add Vector/RHIB to deploy timer labels
// v1.129: add Vector to transport vehicle options; add RHIB constant for future water maps
// v1.128: fix Cheetah/Gepard engine enum swap: labels and default presets now match actual in-game vehicles
// v1.127: fix jet and transport spawn rotations on Firestorm: convert radians to degrees
// v1.126: position debug: remove broken rotZ, replace with Vehicle/Soldier source indicator
// v1.125: Fix position debug vehicle rotation: always use FacingDirection for rotX (pitch) and rotY (yaw) as proven source, GetObjectRotation only for rotZ (roll). GetObjectRotation returns unreliable near-zero floats for many vehicle types causing stale display
// v1.124: Fix position debug vehicle rotation not updating: GetObjectRotation returns zeros for some vehicle types (AH6 confirmed). Now tries GetObjectRotation first, falls back to FacingDirection-derived pitch/yaw if it throws or returns all zeros. Position always displays regardless of rotation source
// v1.123: Fix position debug vehicle rotation: use GetObjectRotation for all 3 axes instead of mixing FacingDirection-derived pitch/yaw with GetObjectRotation roll. Now displays degrees matching authored map config values (X=pitch, Y=yaw, Z=roll). Soldier mode unchanged (FacingDirection is the only source)
// v1.122: Extract position debug overlay from admin-panel into standalone hud/position-debug.ts, gated by FEATURE_POSITION_DEBUG independently of FEATURE_ADMIN_PANEL. Auto-starts on deploy when flag is true, defaulted ON for vehicle spawn position tuning
// v1.121: CQ_Bug_19 hardening: add 1s deploy timer HUD re-assertion to live tick, harden loading gate escape for stuck gates during live deploy, ignore swap-transition flag for warmReady during live match while still respecting hudWarmCompleted for late joiners, add deploy timer update call to COUNTDOWN phase transition
// v1.120: extract loading overlay from join-prompt into always-included loading-overlay.ts; FEATURE_JOIN_PROMPT now controls only future tips
// v1.119: restore loading overlay: set FEATURE_JOIN_PROMPT=true (loading screen is essential UX during warm gate)
// v1.118: fix postbuild dead-code strip: reorder block-strip before inline-replace, fix single-line if handling, fix joinPromptRootName ternary
// v1.117: fix postbuild dead-code strip: two-pass with derived consts, literal false blocks, double-paren fix; guard missed ensureAdminPanelWidgets and joinPromptRootName call sites
// v1.116: postbuild dead-code strip for false feature flags; guard missed call sites
// v1.115: prebuild script auto-syncs feature flag imports from constants
// v1.114: compile-time feature flags: exclude perf-diag, admin-panel, join-prompt from bundle
// v1.113: deploy/undeploy perf: guard help text update during undeploy dialog hide, update analysis doc with test results and optimization summary
// v1.112: deploy/undeploy perf phase 2: defer world icon sync past await, skip HUD restore on undeploy, guard admin panel cleanup
// v1.111: deploy handler perf: dirty-flag debounce for ForAllPlayers broadcasts + per-pid immediate updates + remove redundant broadcast calls
// v1.110: Guard all unprotected UnspawnObject calls with try/catch to suppress CQ_Bug_39 engine errors
// v1.109: Strip pre-seat teleport from vehicle deploy fulfillment to isolate prebuild serialization fix for MP testing
// v1.108: fix: teleport player 15m behind + 10m above vehicle using slot yaw to avoid physics collision
// v1.107: revert: restore map gate on deploy flow tracking; remove settle frame between teleport and seat
// v1.106: fix: teleport player above vehicle before ForcePlayerToSeat to reduce seating failures
// v1.105: fix: remove Operation_Firestorm map gate on vehicle deploy flow tracking — enable on all maps
// v1.104: fix CQ_Bug_40: serialize UI prebuild with global lock, add yield points between families, stagger initial delay per player
// v1.103: move medic/recon choose-only-one groups to top of column; shift smoke/drone to bottom; help text up 15
// v1.102: fix: extract local for tsc narrowing on engineer row FocusIn enable
// v1.101: gadget locker: switch help text from ButtonDown to FocusIn (shows on navigate/hover before press)
// v1.100: gadget locker: swap medic and engineer columns (Assault-Engineer-Medic-Recon)
// v1.099: gadget locker: switch help text to ButtonDown trigger (works on console + PC)
// v1.098: gadget locker: fix button labels gray when cooling (not headers), move help text above close, use FocusIn for console compat
// v1.097: gadget locker: add hover help text, selection SFX, 13 help string keys
// v1.096: gadget locker: gray class headers when all buttons cooling down
// v1.095: gadget locker: flatten armS to per-player, remove IGLA, remove ONLY from headers, equalize column gutters
// v1.094: docs: update codebase reference map with byte sizes, perf diag usage guide, current stats
// v1.093: perf-diag: fix first-window min bug, restore 216px width, shorten player count
// v1.092: perf-diag: avg/max per-player cache stats, wider panel, improved string labels
// v1.091: fix: remove stale UI cache panel references from top-hud-shell
// v1.090: diag: update perf panel string labels for readability
// v1.089: diag: merge UI cache aggregate into perf diag panel; deprecate standalone UI cache panel and admin toggle; readable header format
// v1.088: diag: remove broken gap detection (GetMatchTimeElapsed has 1s granularity); tick rate from game loop is primary spike signal; add persistent min tick rate
// v1.087: diag: move tick measurement from OngoingGlobal (~1Hz) to game-mode loop (~120ms); fix false-positive 1000ms gap
// v1.086: diag: add inter-tick gap detection to perf diagnostic — measures time between OngoingGlobal calls to catch frame stalls that section profiling misses due to frame-clock tied GetMatchTimeElapsed
// v1.085: diag: perf panel layout -- match pos debug width, dynamic height, compact text
// v1.084: diag: perf diagnostic output as persistent HUD panel instead of world log
// v1.083: diag: readable perf diagnostic output with dedicated string keys
// v1.082: diag: add performance diagnostic system with tick rate monitor and section profiler (admin-toggleable)
// v1.081: perf: CQ_Bug_41 phase 4 -- self-terminating gadget menu refresh loop, remove updateArmMenu from ongoingPlayerImpl
// v1.080: perf: CQ_Bug_41 phase 3 -- self-terminating vehicle timer HUD countdown loops, remove all-player per-second poll
// v1.079: perf: CQ_Bug_41 phase 2 -- self-terminating boundary enforcement loops, remove all-player per-second poll
// v1.078: perf: CQ_Bug_41 phase 1 -- increase vehicle spawner poll interval from 1s to 5s
// v1.077: data: sync object 1052 world icon position to match updated spatial coordinates
// v1.076: fix: pre-set vehicle occupancy cache before ForcePlayerToSeat to prevent verification failure regression from CQ_Bug_37/38 guard
// v1.075: fix: CQ_Bug_35 -- skip EnableAllInputRestrictions on undeploy and gate release where player is undeployed
// v1.074: fix: CQ_Bug_37/38 -- vehicle occupancy cache guard prevents engine error log spam during transitions
// v1.073: fix: CQ_Bug_42 -- guard CountOf calls against undefined array args in vehicle helpers and capture-tickets
// v1.072: fix: remove non-ASCII em dash from inline comment causing script boot crash
// v1.071: fix: CQ_Bug_35/36/40 — guard gate loop spam, throttle reassert, eliminate frame budget overflow
// v1.070: fix: gate-guard vehicle timer refresh + invalidate cache on deploy for MP late-join
// v1.069: fix: admin panel backplate height, simplify UI cache toggle label
// v1.068: feat: hide vehicle deploy timer list when admin panel is open
// v1.067: fix: gate loop deploy-race guard — force undeploy if player deployed while gate active
// v1.066: fix: TS7015 errors in bundle — Number() cast for Object.keys indexing on Record<number> maps
// v1.065: optimization: wn() widget name compression, for-in iteration safety, loading gate iteration cap
// v1.064: fix: swap team1Base/team2Base positions — team1 (WEST) is at -761 per Godot; revert anchor ownerTeamIds to original
// v1.063: fix: remove redundant !== 0 check causing TS type error in ownerTeamId filter
// v1.062: fix: correct swapped ownerTeamId assignments — ObjIds 1000-1007 are Team1 (WEST), 1008-1015 are Team2 (EAST)
// v1.061: fix: restrict main base world icons to player's own team HQ via ownerTeamId filter
// v1.060: fix: CQ_Bug_25 — per-player spawned WorldIcon clones with SetWorldIconOwner; abandon AddUIIcon
// v1.059: debug: hide native WorldIcon before AddUIIcon + 10m offset on authored 1008
// v1.058: debug: use authored WorldIcon 1008 from v7 spatial as AddUIIcon parent
// v1.057: debug: spawn WorldIcon at 1008 pos + AddUIIcon on it (all-player Triangle + per-player Flag)
// v1.056: debug: use clock.digit string key pattern for trace HUD (proven working)
// v1.055: debug: fix HUD trace to use registered string keys (genericCounter + STR_UI_READY)
// v1.054: debug: HUD integer trace for AddUIIcon on InteractPoint 1008 — shows step reached (1-4)
// v1.053: debug: move hardcoded AddUIIcon test to deploy handler so messages are visible post-loading-gate
// v1.052: debug: remove try/catch on hardcoded AddUIIcon, add world log messages to trace execution
// v1.051: debug: hardcoded AddUIIcon Triangle on T1 InteractPoint 1008 to prove rendering
// v1.050: fix: CQ_Bug_25 — ensure EnableInteractPoint called on same reference before AddUIIcon per working pattern
// v1.049: fix: CQ_Bug_25 — switch world interactable icons to AddUIIcon on authored InteractPoint anchors; remove dead WorldIcon code
// v1.048: fix: switch AddUIIcon parent from InteractPoint to WorldIcon (WorldIcon has render transform for UI layer attachment)
// v1.047: refactor: switch world interactable icons from spawned WorldIcons to AddUIIcon on authored InteractPoints for per-player visibility
// v1.046: fix: enable spawned WorldIcon image/text (were disabled by default); restore 30s gate floor per design doc
// v1.045: fix: CQ_Bug_25 — restore spawned WorldIcon approach, fix WorldIcon/boolean type mismatch in runtime-types
// v1.044: fix: restore spawned per-player WorldIcon approach (v1.034 pattern) — AddUIIcon path abandoned after 4 failed attempts; remove per-second polling
// v1.043: fix: switch AddUIIcon parent from disabled WorldIcon to InteractPoint; remove per-second icon polling (event-driven only)
// v1.042: fix: world icons not showing — stop re-disabling authored WorldIcon presentation every tick (strips AddUIIcon attachments)
// v1.041: fix: world icons not showing — remove inverted ownerTeamId check; inMainBaseByPid already gates by own-base trigger
// v1.040: fix: destroy combat HUD graph on team swap so prebuild creates fresh widgets; clear engageHiddenUntilDeploy and mark dirty on gate release
// v1.039: fix: clear teamSwapHudResetPendingByPid on gate release so combat HUD (tickets, bars, team names) renders on deploy screen after team swap
// v1.038: fix: world icons use authored parents for AddUIIcon, restore 5s loading gate floor
// v1.037: perf: remove 30s loading gate floor — release immediately when all 8 UI families are stable
// v1.036: ui: hide UI Cache perf panel by default, toggle via admin panel
// v1.035: fix: CQ_Bug_25 — switch world icons to AddUIIcon per-player visibility on spawned anchors
// v1.034: ui: team swap button larger (190x32), bigger text (16px), tighter gap (3px) to team label
// v1.033: fix: rebuild team swap button on gate release so label reflects current team after swap
// v1.032: fix: hide team swap button during countdown phase, restore on cancel
// v1.031: fix: hide team swap button when loading gate begins (covers team swap + join transitions)
// v1.030: ui: team swap button — taller (28px), larger text (14px), pluralize 'Change teams to {TEAM}'
// v1.029: fix: HUD team swap button — dynamic 'Change team to {TEAM}' label, deploy-screen-only visibility with loading gate
// v1.028: fix: team swap button uses static CHANGE TEAMS label (mod.Message does not support nested Message args)
// v1.027: feat: add pre-game HUD team swap button to right of red team name
// v1.026: optimization: remove UI load trace debug system (ui-load-debug.ts, pushUiLoadTraceForPid, 18 call sites across 7 files); reclaims 9,395 bytes of headroom
// v1.025: polish: move team names and tickets up (name 197->193, tickets 221->215)
// v1.024: polish: revert border to original size, pack content tighter inside, tickets up and bigger (54px)
// v1.023: polish: 1px gap between crown and team name in victory dialog
// v1.022: polish: victory dialog - bigger result/crown/name/ticket sizes, tighter crown-to-name spacing, tickets moved up
// v1.021: fix: victory dialog - compute winner from tickets on admin end, red draw color, bigger text, white results border
// v1.020: feat: victory dialog ticket scoreboard with team names, crown, and win/draw result line
// v1.019: fix: include lifecyclePhase in vehicle deploy timer signature so buttons refresh on match start
// v1.018: fix: hide air button pre-game and both buttons during countdown; skip LIVE shrink animation to avoid startMatch stutter
// v1.017: fix: undeploy during countdown with depth-aware widget recreation; dim air button text when disabled; remove force vehicle spawn
// v1.016: feat: phase 7 pre-game start sequence with 20s countdown, vehicle reset, air deploy gating
// v1.015: revert: restore inMainBaseByPid=true on deploy; false default caused immediate boundary kill before area trigger fires
// v1.014: fix: clear inMainBaseByPid on undeploy and before exit handler deploy guard so main-base icons hide reliably when leaving HQ
// v1.013: fix warm-prime flicker: reassert loading overlay and yield one frame before ready dialog hot-prime so overlay is fully rendered before dialog becomes briefly visible
// v1.012: revert isHudWarmReadyForPid to !== false; original design intent is warm-on-unknown-state, not conservative false
// v1.011: cleanup: delete dead HARD_PLAYER_LOCK_AUDIT_MODE branches, HUD projection debug dead code; gate UI load trace behind UI_LOAD_TRACE_ENABLED; fix for...in iteration safety; fix isHudWarmReadyForPid null guard; delete setHudSwapTransitionActiveForPid no-op
// v1.010: fix team-swap overlay gap after mod.SetTeam; add uiLoadHardTimeout world-log string for gate hard-timeout; timeout broadcast now active
// v1.009: re-architect loading gate as unified single-owner state machine for first-join and team-swap; eliminate post-deploy finalize, staged reveal, and join-vs-refresh ownership split; add 30s safety floor and 60s timeout with debug logging
// v1.008: roll back the team-swap loading-gate changes and restore the pre-v1.005 baseline
// v1.007: defer the single team-swap loading overlay show until the old deployed state is gone
// v1.006: show the team-swap loading overlay only once per active loading session
// v1.005: route team swap through the same staged loading-session release so deploy and movement stay blocked until finalize
// v1.004: remove visible post-deploy loading and ready dialog re-show from join finalize and keep the finalize hidden
// v1.003: require deployed ready finalize before movement release so first HQ ready open is pre-paid under the join lock
// v1.002: hand off first join into a restricted post-deploy finalize so movement stays blocked until the real ready prime finishes
// v1.001: prime the actual ready open path under the blocked join gate including UI input mode
// v1.000: front-load ready dialog content refresh into the blocked warm prime so first open is closer to a pure reveal
// v0.999: replace fixed proof lock with a conservative 15 second first-join gate and single release owner
// v0.998: extend fixed first-join hard-lock proof path from 10 seconds to 30 seconds
// v0.997: add a fixed 10 second first-join hard-lock proof path
// v0.996: require multi-frame post-reveal hot-settle before first-join deploy release
// v0.995: stop the player loop from reasserting the join loading overlay during release teardown
// v0.994: add a dedicated first-join deploy lock so only join release can enable deploy
// v0.993: stop undeploy refresh warm from preempting the first-join loading session
// v0.991: stabilize join loading overlay lifecycle and purge duplicate join prompt widgets
// v0.990: refactor first join into a single-stage pre-deploy loading gate with one release owner
// v0.989: remove join-only in-world finalize and lengthen join deploy release settle
// v0.988: arm one-shot first-join post-deploy finalize lock before movement is allowed
// v0.987: move loading-gate audit state onto a persistent on-foot HUD panel
// v0.986: move loading-gate debug projection from world logs onto persistent loading overlay labels
// v0.985: split join loading release into overlay-hide settle and delayed deploy authorization
// v0.984: separate deploy authorization from loading-gate flags so join deploy stays blocked until explicitly authorized
// v0.983: move first-join deploy release ownership out of generic warm controller and back to join lifecycle
// v0.982: add hard audit lock that never releases deploy and forcibly recaptures any deployed player
// v0.981: continuously reassert join deploy block and project first-join load trace via existing debug messages
// v0.980: refactor first-join loading gate into a smaller traced lifecycle and add deploy authority instrumentation
// v0.979: run loading-gate recapture before script deployed-state gate and revert explicit spawn mode change
// v0.978: set conquest spawn mode explicitly to deploy
// v0.977: stage join deploy block earlier and recapture join gate slip-throughs
// v0.976: freeze and immediately undeploy players who slip past the loading gate
// v0.975: make join loading gate hold deploy until overlay clears
// v0.974: keep loading gate active across deploy handoff until post-deploy finalize ends
// v0.973: add post-deploy ui finalize lock to loading gate
// v0.972: strengthen ui loading gate milestones and release ordering
// v0.971: remove redundant menu close work from static ready dialog open path
// v0.970: speed up ready interact arming and reassert loading overlay after team swap undeploy
// v0.968: expand loading overlay to show header title subtitle and custom scripts body
// v0.967: show loading overlay on team swap undeploy and prime ready dialog hidden reveal during load gate
// v0.966: fix loading overlay string key and reassert loading overlay during team swap warm loops
// v0.965: add player ui loading gate for deploy and menu warm release
// v0.964: reduce vehicle warm-path duplicate builds and remove ready-dialog team-swap hidden-cache churn
// v0.963: avoid join reset restoring vehicle HUD while hiding ready dialog
// v0.962: narrow ready dialog join leave churn and clear stale vehicle HUD cache on fresh join
// v0.961: increase UI cache panel text size and spacing
// v0.960: include UI cache instrumentation module in conquest bundle
// v0.959: add UI cache instrumentation panel and admin toggle
// v0.958: invalidate vehicle HUD viewer cache when toggling live deploy menu
// v0.957: always hidden-build live deploy HUD shell before first reveal
// v0.956: stagger deferred menu warm and skip duplicate hidden UI builds
// v0.955: diff-cache gadget locker entry renders
// v0.954: throttle gadget locker refresh and remove static header label rewrites
// v0.953: harden UI text writes against stale or non-text widgets
// v0.952: restore dist type context with triple-slash types reference
// v0.949: emit modlib import with ts-ignore and no ts-nocheck
// v0.947: preserve modlib import comment in dist bundle
// v0.946: preserve top and bottom version lines in dist bundle
// v0.945: replace empty genericCounter placeholders with single-space messages
// v0.944: toggle gadget image widgets explicitly with gadget menu visibility
// v0.943: restore cached gadget menu widget visibility
// v0.942: restore source header license and attribution
// v0.941: put medic smoke in callins without removing gadget two
// v0.940: increase launcher ammo icon size
// v0.939: choose-one group timers and engineer launcher counts
// v0.938: arm root-only show hide
// v0.937: restore specified callin gadget icons
// v0.936: arm cache/global launchers
// v0.935: nudge gadget tile headers up, move weapon icons down, and enlarge launcher ammo icon
// v0.934: fix gadget menu split header string keys and reposition tile headers inside buttons
// v0.933: replace gadget tile multiline headers with explicit per-line widgets
// v0.932: apply larger measured gadget tile header and icon shift based on screenshot sequence
// v0.931: move gadget tile headers and icons further down based on screenshot delta
// v0.930: retune gadget tile header and icon alignment and update assault artillery and ladder cooldowns
// v0.929: stabilize gadget menu tile layout by separating text frames from gadget image placement
// v0.928: strip UTF-8 BOM characters from conquest postbuild bundle output
// v0.927: add medic intercept system gadget tiles and trim bundle header payload
// v0.926: fix gadget menu static timer labels and reparent tile headers to their buttons
// v0.925: nudge gadget menu icons upward within their tiles
// v0.924: tighten gadget menu layout, restore close button, and split assault team cooldown from player lockout
// v0.923: tighten gadget menu layout, add grouped choose-one borders, share assault cooldowns, and add admin reset gadget timers
// v0.922: move gadget menu headers and tiles up, add per-team/player labels, shrink gadget icons and fix close button parenting
// v0.921: fix gadget menu close handling and align multiline tile labels with icon centerline
// v0.920: retune gadget menu layout, remove recon ammo tile, and adjust assault/recon cooldowns
// v0.919: remove assault air strike, add recon class gadget tiles, and compress ammo menu state for headroom
// v0.918: replace assault armor tile with assault callins beacon and ladder
// v0.917: guard GetVehicleFromPlayer behind seat check and remove smoke notify probe
// v0.916: change no launcher label to N/A and harden medic smoke grant verification
// v0.915: use CallIn_Smoke_Screen for medic tile display and grant path
// v0.914: add assault armor tile with per-player per-locker cooldown
// v0.913: fix ammo menu partial-build cache reuse and smoke icon fallback
// v0.912: add team-shared support smoke tile and support class gating for engineer launchers
// v0.911: move launcher ammo badge lower left onto timer line
// v0.910: move launcher ammo count badge further down and left
// v0.909: move gadget icons down again and relocate ammo count badge
// v0.908: move gadget tile icons further down toward visual center
// v0.907: restore launcher ammo tile count overlay and bottom timer
// v0.906: increase gadget icon offset to compensate for top-heavy art
// v0.905: move ammo menu icons down toward button center
// v0.904: ammo tile align to top label center icon bottom status
// v0.902: revert world interactible AddUIIcon attempt and retune ammo tile layout
// v0.901: switch world interactible icons to AddUIIcon per-player visibility
// v0.900: ammo menu layout shift and ammo count overlay pass
// v0.899: rename gadget interact text to GADGETS
// v0.898: Tune the engineer ammo menu layout by enlarging tile icons, moving tile labels and timers inward, adding a visible overlaid launcher-ammo count with shadow, adding the Assault/Medic/Engineer/Recon column headers, and doubling the close-button text size
// v0.897: Remove the deploy-time IGLA launcher probe and simplify the engineer ammo menu into five square right-side tiles with shared launcher cooldown, a temporary IGLA* stinger stand-in, and one sequential launcher-ammo charge button with overlaid count
// v0.896: Tighten conquest to a true Firestorm-only map registry by narrowing MapKey to Operation_Firestorm after archiving the other authored map configs, so runtime map state stays concrete and TypeScript stays clean
// v0.895: Make conquest build Firestorm-only for now by removing non-Firestorm map configs from the runtime registry, defaulting active map state to Operation_Firestorm, and archiving the unused authored map fragments outside src
// v0.894: Add deploy-time launcher enum probe using HasEquipment scan and trim low-risk source comment bulk to keep the bundle under cap
// v0.893: Launcher debug probe: add a deploy-time player-only world-log summary that checks the full verified launcher gadget candidate set with HasEquipment so live loadouts can reveal which BF6 launcher enum corresponds to each spawned launcher
// v0.892: Ammo resupply launcher mapping: swap the IGLA row from Launcher_Long_Range to Launcher_High_Explosive so the temporary launcher set can continue narrowing down a plausible IGLA stand-in without disturbing RPG, Stinger, or AT4
// v0.891: Ammo resupply launcher mapping: swap the IGLA row from Launcher_Auto_Guided to Launcher_Long_Range so the temporary launcher selection set keeps Stinger, AT4, and RPG stable while testing a more plausible distinct IGLA stand-in
// v0.890: Ammo resupply modal refresh and launcher uniqueness: update open ammo menus during OngoingPlayer so cooldowns tick live, map the four launcher rows to distinct verified launcher gadgets for testing, and tune launcher ammo grant toward a single-charge gadget slot flow
// v0.889: Ammo resupply cooldown text: replace the broken generic string countdown path with a numeric MM:SS format so launcher and launcher-ammo cooldowns render reliably on the ammo modal
// v0.888: Ammo resupply UI copy: rename ROCKET AMMO to LAUNCHER AMMO so the field resupply menu matches the intended launcher-only behavior
// v0.887: Ammo resupply modal fix: remove the unused top hero icon, use the left supply-bag gadget image for all rocket-ammo charge buttons, and correct BF6 button-event comparisons so close and launcher button presses execute reliably
// v0.886: Ammo resupply icon evaluation: replace the bottom ammo-charge button fallback icon with three distinct verified gadget-image icons (Class Supply Bag, Misc Supply Pouch, Vehicle Supply Crate) so the field ammo menu can be judged visually without relying on the unverified UI_Gadget_AmmoBox string path
// v0.885: Ammo resupply menu repair: replace invalid raw row labels with real UI string keys, anchor launcher and ammo gadget icons directly in their row positions instead of stacking them under the hero icon, and broaden close-button family matching so the CLOSE control reliably dismisses the modal
// v0.884: Ammo resupply launcher pickup safety: if the player already owns the selected launcher gadget anywhere, do nothing; otherwise replace only GadgetTwo so the menu avoids duplicate launcher insertion without pretending to know exact slot ownership
// v0.883: Ammo resupply interactibles: replace the placeholder shell with a functional center-screen gadget menu using verified gadget-image UI for four launcher rows, three ammo-charge buttons, shared launcher cooldown, per-charge cooldowns, and GadgetTwo replacement for live launcher pickup while keeping the close path stable
// v0.882: Phase 7 ammo modal UI correction: remove the unsupported WorldIconImages preview-gallery path, render a verified in-menu rocket-launcher example with AddUIGadgetImage using Gadgets.Launcher_Unguided_Rocket, harden the ammo modal close-button handler, and trim the dead preview state/helpers.
// v0.881: Phase 7 gadget/ammo anchor sync: update Firestorm gadgetInteractableAnchors for objIds 1050-1057 to the latest authored WorldIcon positions from MP_TWL_Conquest7_FireStorm.spatial.json so the per-player AMMO icons remain aligned with the new Godot placements.
// v0.880: Phase 7 ammo resupply menu shell: add a dedicated cached center-screen gadget/ammo modal for point interactables, wire gadget interaction to open it, show three launcher pickup rows plus shared and ammo cooldown placeholders from per-player per-objId state, and spawn a temporary per-player world-space WorldIconImages preview gallery at the interacted gadget anchor so icon art can be evaluated within the verified BF6 UI limits
// v0.880: Phase 7 ammo-resupply shell: add a dedicated cached center-screen gadget/ammo modal for point interactables, wire gadget interaction to open it, show three launcher pickup rows plus shared/ammo cooldown placeholders from per-player per-objId state, and spawn a temporary per-player world-space WorldIconImages preview gallery at the interacted gadget anchor so icon art can be evaluated with the verified runtime API surface.
// v0.879: Phase 7 gadget/ammo interactable map data: add Firestorm gadget interactable objId 1057 and its explicit authored anchor so it participates in the shared per-player area-trigger-gated AMMO icon path.
// v0.878: Phase 7 world-interactable color solidity tuning: replace the softer main-base DEPLOY and READY icon colors with more saturated dedicated world-icon blue and green values because the verified BF6 world-icon API exposes color but not a separate alpha/opacity setter.
// v0.877: Phase 7 world-interactable color tuning: change main-base DEPLOY assist icons/text to blue, change READY flag icons/text to darker green, and keep gadget/ammo AMMO icons red.
// v0.876: Phase 7 gadget/ammo interactable anchor fix: add explicit gadgetInteractableAnchors map-config support, derive Firestorm gadget icon positions from MP_TWL_Conquest7_FireStorm.spatial.json for objIds 1050-1056, and use those authored anchors for per-player AMMO world-icon placement when runtime WorldIcon position lookup is unreliable.
// v0.875: Phase 7 gadget/ammo interactables: rename flagInteractableObjIds to gadgetInteractableObjIds, add per-player area-trigger-gated AMMO world icons for gadget terminals, keep authored interact points globally available while only icon visibility is gated by the shared-id area trigger, and sync the world-interactable docs to the accepted point/ammo first slice.
// v0.874: Bundle cleanup: remove dormant join-prompt overlay runtime/layout state, strip dead join-prompt prompt plumbing, collapse debug highlighted-world-log gating to shipped behavior, and remove dead ready-dialog roster placeholder support to recover headroom without changing gameplay.
// v0.873: Vehicle HUD passive refresh fix: remove the temporary vehicle-HUD layoutVersion workaround and rebuild config-apply through hidden prebuild plus owner reveal so deployed passive viewers can get the updated vehicle list without a redeploy.
// v0.872: Vehicle HUD follow-up: restore the deployed passive vehicle list to the reveal ownership path when the ready dialog closes for override viewers, nudge the live terminal backplate slightly further left, and force a HUD layout rebuild so the updated live panel geometry is applied.
// v0.871: Vehicle HUD regression fix: drive deploy/live menu rows from the selected spawn-spec slot set so live config changes hide stale unused rows immediately, and anchor the live deploy backplate as a CenterRight sibling behind the row lane instead of a root child so it sits behind the controls in the correct position.
// v0.870: Deploy HUD regression fix: keep the live deploy panel in the same UI depth family as the row widgets so it stays in the correct lane, and refresh the vehicle HUD when the ready dialog closes so the deployed passive list can reappear immediately after config apply.
// v0.869: Deploy HUD fix: version the vehicle HUD layout cache so live deploy panel widgets rebuild after layout changes, restore passive vehicle list visibility after config apply for undeployed/admin/live-terminal viewers, and keep the live panel anchored to the ground-button lane.
// v0.868: Phase 7 cleanup and live deploy HUD correction: move live vehicle panel chrome back into the root-local lane, replace config-apply full vehicle-HUD rebuilds with lightweight refresh invalidation, document the cleanup backlog in the design doc, and remove low-risk dormant debug/dead code while enabling comment stripping for bundle headroom
// v0.867: Vehicle HUD and HQ terminal correction pass: rebuild the passive deploy HUD tree after config changes, move the live terminal backplate and close button onto stable screen-anchored chrome, and switch main-base per-player terminal markers to explicit Firestorm anchor positions with spawned per-player WorldIcons
// v0.866: Vehicle HUD correction pass: restore the live deploy panel to local modal chrome, refresh passive vehicle timers after matchup preset enablement, and attach per-player HQ icons to authored interact points before falling back to authored world-icon anchors
// v0.864: Vehicle HUD and HQ icon follow-up: move the passive deploy-list refresh to run after spawner enablement, push the live terminal panel fill behind the row widgets, and pivot main-base per-player icons to AddUIIcon/RemoveUIIcon on the authored terminal anchor instead of spawned WorldIcons
// v0.863: Vehicle HUD cleanup: preserve passive deploy-list visibility on config apply, retune the live deploy panel to a translucent dark red fill, and harden per-player HQ icon anchors with non-origin authored object fallback while trimming bundle overhead
// v0.862: Vehicle terminal tuning: switch the live deploy backplate to a more transparent dark red blur, force a full deploy-HUD cache rebuild after applied vehicle config changes, and restore authored WorldIcon anchors as the primary per-player HQ icon positions with interact-point fallback
// v0.861: Vehicle terminal follow-up: make the live deploy panel use blur-only ready-dialog-style black chrome, prebuild passive vehicle HUD content after slot-config apply, and simplify HQ runtime icon anchors to authored interact points with stable per-player WorldIcon presentation refresh
// v0.860: Vehicle menu polish: add top breathing room and restore ready-dialog black panel styling, force immediate deploy-list refresh after applying vehicle configuration, and switch HQ terminal icons to stable spawned per-player WorldIcon objects with cleanup/repair lifecycle
// v0.859: Phase 7 deploy terminal follow-up: widen the live vehicle menu root so the backplate gains matching right and bottom overhang, and make per-player HQ terminal icons self-repairing by refreshing the AddUIIcon attachment instead of trusting a one-time visible latch
// v0.858: Phase 7 terminal UI and runtime icons: restore the broader live deploy backplate styling, keep the close button under the deploy column, and rework per-player main-base terminal icons to attach to authored interact points while matching the Firestorm flag and assist icon contract
// v0.857: Phase 7 terminal icon ownership: hide the shared authored main-base WorldIcons, attach per-player runtime READY/DEPLOY icons only while the viewer is deployed inside their own HQ, keep authored interact points as the stable shared anchors, and gate terminal activation by team plus HQ state
// v0.842: Boundary vertical-authority cleanup: remove the temporary script Y-threshold layer for main bases and the ground combat zone, restore Godot-authored trigger geometry as the authoritative vertical boundary for those areas, and keep only the aircraft exemption for the live ground out-of-bounds rule while aligning the Phase 6 docs to that simpler model
// v0.841: Phase 6 protected-zone threshold ownership: apply the authored per-main-base Y threshold to both the enemy main-base core and overlapping buffer path, restore the requested timer split of 10s pre-live own-main-base, 3s enemy protected-zone, and 10s ground combat zone, and sync the Phase 6 prompt/design docs to that boundary contract
// v0.839: Phase 6 main-base threshold ownership: remove pre-live takeoff gating dependence on hudFloorY by adding explicit per-main-base airborne threshold Y fields to MapConfig, author Firestorm team-specific thresholds, validate them with the active map config warnings, and consume the authored values in takeoff-gating while keeping the existing ground combat zone threshold as the separate playable-area Y authority
// v0.838: Boundary timer tuning: reduce the pre-live own-main-base and takeoff-limit kill timer from 10 seconds to 3 seconds and sync the current Phase 6 prompt and design docs to the new countdown
// v0.837: Boundary warning transition hardening: add a short live-boundary popup display delay for fresh enemy-protected-zone and ground-combat-zone violations so manual undeploy during live cannot flash the out-of-bounds warning, while keeping the underlying kill timers unchanged
// v0.836: Boundary prompt layout update: replace the single warning title row with explicit title1 plus title2 rows driven by semicolon-style split copy, keeping the countdown subtitle as the third line and preserving the cached per-player warning prompt family
// v0.835: Boundary protected-zone fix and warning-card polish: treat live enemy territory as the union of the enemy main-base core and enemy buffer trigger ids so overlapping exits cannot clear the violation early, and rebuild the center warning card with much larger mirrored red exclamation icons, doubled text scale, a deeper red tint, and a thin white border
// v0.834: Boundary prompt UI polish: make the center-screen boundary warning exclamation icons much larger, color them red, and mirror them on both the left and right sides of the prompt while leaving the underlying warning logic unchanged
// v0.833: Phase 6 boundary follow-up: add warn-first active-map ObjId validation with player replay for duplicate or invalid boundary-support-capture ids, prototype offender-only boundary alarm playback with a reusable SFX_Alarm runtime handle and per-violation play-once gating, and sync the Phase 6 docs to mark the warning sound as prototyped pending human approval
// v0.832: Boundary prompt icon fix: replace the fragile generic counter icon placeholder with a dedicated boundary warning icon string key so the cached warning prompt renders the intended exclamation mark instead of Unknown String
// v0.831: Boundary naming cleanup: remove phase-based identifiers from the boundary enforcement runtime and rename the pre-live warning delay and related boundary helpers to forward-facing domain names so the code reads in terms of actual behavior instead of milestone labels
// v0.830: Phase 6 pre-live boundary prompt polish: add a short display grace before the Match is not live warning appears so manual undeploy transitions cannot flash the pre-live popup while keeping the forced unready and 10 second pre-live violation timer behavior unchanged
// v0.829: Ready-dialog ready-state cache sync: refresh all built ready-dialog roster and button widgets when config edits force reconfirm, when pre-live main-base or takeoff violations force NOT READY, and when ready/base state changes so cached reopen cannot show stale Not Ready/Ready labels or stale In Main Base status
// v0.828: Phase 6 boundary prompt gating: suppress stale pregame boundary warnings during death and undeploy transitions by requiring the player to still be deployed and alive before showing the cached prompt, and skip pre-live main-base exit enforcement on area-trigger exits from dead players
// v0.827: Phase 5G/5D spawn-authority refactor: remove vehicle type as an authored concern from Firestorm map spawn anchors, make MapConfig spawn arrays anchor-only, and rebuild runtime slot inventory from map anchors plus the default ready-dialog preset package so knob-driven preset selection remains the single authority for what actually spawns
// v0.826: Phase 5D/6 vehicle deploy hardening: prevent direct air or ground deploy from ever seating a player into a mismatched slot vehicle by rejecting wrong-type spawns at bind time, re-forcing the configured spawner type when a mismatched vehicle appears near a slot, and self-healing stale mismatched bound vehicles before direct-spawn fulfillment proceeds
// v0.825: Phase 6 + ready-dialog regression fix: restore immediate NOT READY behavior on pre-live main-base exit and takeoff-limit violation, seed the authored default Conquest preset players and vehicle package from active map config on startup instead of falling back to 1v0, pass reset-to-default through the ready reconfirm gate, and clarify in the Phase 6 docs that the enemy main-base buffer rule currently applies while in vehicles
// v0.824: Phase 6 pre-live timer tuning: raise the pre-live own-main-base and takeoff-limit kill timer from 5 seconds to 10 seconds while leaving the live enemy main-base buffer at 5 seconds and the ground combat zone at 10 seconds, and sync the prompt spec countdown text to the new pre-live duration
// v0.823: Phase 6 boundary enforcement bundle fix: make the enemy-team buffer trigger lookup cast explicit after guarding to satisfy the generated bundle's TeamID narrowing and clear the remaining three bundle type errors
// v0.822: Phase 6 boundary enforcement type fix: narrow enemy main-base buffer trigger lookup to real TeamID values before resolving the buffer trigger so the generated bundle no longer emits the three TeamID union errors in the boundary enforcement path
// v0.821: Phase 6 bundle-checker cleanup: replace boundary warning image widgets with a cached text glyph icon and wrap kill-on-expiry through a defensive helper so the prompt path keeps the same behavior without relying on the bundle checker accepting those specific direct API tokens
// v0.820: Phase 6 baseline boundary enforcement: add cached offender-local boundary prompt UI, map-config-driven enemy main-base buffer and ground combat zone enforcement with kill timers, pre-live own-main-base/takeoff-limit prompt unready behavior without countdown cancel, and a shared aircraft classification helper consumed by both boundary and spawn logic
// v0.819: Phase 6 ObjId rubric sync: align Firestorm and the active design docs to the new object-id allocation scheme with boundary triggers on 500-503 and 666, vehicle-deploy spawn points on 550-551, and the narrowed future world-interactable reservation ranges while leaving historical changelog entries intact
// v0.818: Phase 5 closeout doc cleanup and Phase 6 schema start: mark CQ_Bug_18 resolved, split ready-dialog open latency into its own deferred bug, close out stale Phase 5G planning text, and move current main-base and boundary trigger ownership into MapConfig with Firestorm-authored ids and compatibility fallback getters before later enforcement work
// v0.817: Phase 5G ready-dialog action-row polish: add a static disabled Spectate / Coach button between Ready and Close in the bottom row so the planned slot exists visually without introducing any new interaction behavior yet
// v0.816: Phase 5G players draft-apply fix: make the ready-dialog XvY knob behave like the rest of mode config by editing only the draft players value until Apply Configuration commits it live, while keeping the live HUD, ready gate, and auto-start logic driven by the confirmed setting
// v0.815: Phase 5G ready reconfirm gate: when a pre-live ready-dialog config edit creates unsaved changes, force the editing player back to NOT READY, keep the match from auto-starting on stale ready state, and show the Ready button label in red until that player explicitly presses Ready again
// v0.814: Phase 5G preset selection: expose the authored Conquest 8v8, 10v10, 12v12, and 16v16 presets on the ready-dialog top knob while removing Custom from the manual cycle so it remains a derived-only state when players or vehicle selections diverge from a named preset
// v0.813: Phase 5G players knob range: raise the ready-dialog players-per-side clamp from 8 to 16 so the manual players toggle can reach 16v16 while preserving the existing 0 special-case for solo 1v0 starts
// v0.812: Phase 5G preset authoring cleanup: add shared ready-dialog vehicle constants for the preset package roster and switch Firestorm preset package entries to use them so map-level preset authoring is consistent across jets, helis, ground vehicles, and fast movers without changing spawn behavior
// v0.811: Phase 5G preset authoring cleanup: replace Firestorm inline AH6M vehicle-list casts with the shared VEHICLE_AH6M constant so map preset authoring uses the same obvious vehicle reference pattern as the rest of the ready-dialog vehicle options
// v0.810: Phase 5G preset authoring scaffolding: add explicit Firestorm ready-dialog preset package skeletons for Conquest 8v8, 10v10, 12v12, and 16v16 by copying the current 10v10 players-per-side and per-knob vehicle selections into each map-owned package so they can be curated directly in the map file
// v0.809: Phase 5G preset authoring refactor: move ready-dialog preset package data into MapConfig so Firestorm owns the current 10v10 players-per-side and per-knob vehicle selections while runtime reads presets from ACTIVE_MAP_CONFIG without changing the existing spawn-anchor mapping behavior
// v0.808: Phase 5G preset key cleanup: rename the internal ready-dialog game-mode string ids from the old heli-era names to Conquest-specific preset ids so the backend option keys match the current feature set before the remaining preset package definitions are authored
// v0.807: Phase 5G preset label prep: update the current ready-dialog top-level Conquest preset labels to the final naming scheme and add the 16v16 label string while leaving only the currently-authored runtime presets selectable until the actual player-count and vehicle-package definitions are provided
// v0.805: Phase 5G ready-dialog live-lock polish: make the Ready or Not Ready button use the same disabled gray treatment during live rounds as the locked configuration actions, and refresh that button state across built ready-dialog caches on round phase changes
// v0.804: Ready dialog live-phase latency: stop invalidating the full hidden ready-dialog cache on live, game-over, and fresh-setup transitions and instead refresh the hidden mode-config section in place so live-lock UI updates do not make the next interact pay a full dialog rebuild
// v0.802: Ready dialog cache warm regression: rewarm only deployed players with active interact points after live/fresh/game-over phase invalidation so phase transitions no longer leave the next ready-dialog open paying a cold hidden rebuild on interact
// v0.799: Phase 5G ready-dialog action-row polish: widen the live-unsaved message widget to the right so the current live configuration locked notice stays on one line without changing any saved-applied state or lifecycle behavior
// v0.798: Phase 5G ready-dialog phase-cache fix: invalidate hidden ready-dialog caches on live, game-over, and fresh-setup lifecycle transitions so cached reopen reflects the current round lock state instead of preserving stale pre-live mode-config widgets
// v0.797: Phase 5G ready-dialog live-lock polish: make Reset to Default use the same disabled visual treatment as Apply Configuration during live rounds so both action buttons clearly read as locked while the round is active
// v0.796: Phase 5G ready-dialog live-lock polish: hide all mode-config arrow buttons once the round is live, refresh the mode-config view on live-state transitions, and replace the unsaved-message slot with a concise live configuration locked notice while leaving the underlying apply-reset state model unchanged
// v0.795: Phase 5G ready-dialog action-row polish: remove the unsaved-label prefix styling, match the unsaved-label text size to Apply Configuration, make Reset and Apply use equal widths, and keep the two-button action group centered while leaving the saved-applied state logic unchanged
// v0.794: Phase 5G ready-dialog saved-applied clarity: add a sustainable draft-vs-applied mode-config comparison model with confirmed player-count snapshot, red-green knob value state, unsaved-changes indicator, reset-to-default button, and Apply Configuration enabled-disabled behavior while leaving the stabilized reveal lifecycle unchanged
// v0.793: Ready-dialog warm alignment: explicitly prebuild the hidden ready-dialog cache after first-join HUD warm and rebuild the swapped player's hidden dialog immediately after the team-switch warm controller so first open in those two cases stops paying delayed cache setup while keeping cached reveal and no-spam behavior unchanged
// v0.792: Ready-dialog latency fix: stop invalidating hidden ready-dialog caches on every deploy so first open after redeploy can reuse the existing cached dialog instead of paying a rebuild, while keeping map and join/leave invalidation for the no-spam stale-content fix
// v0.791: Ready-dialog UX correction: restore the intentional deploy-time and triple-tap interact-point paths, remove the extra delayed deploy prewarm, and wait one tick after hidden dialog prebuild before spawning the interact point so dialog open happens against a settled cached tree instead of paying readiness cost on interact
// v0.790: Ready-dialog trigger correction: remove deploy-time ready-dialog interact spawning so the interact point is only created by the triple-tap detector, while keeping the existing no-spam dialog caching and player-local warm behavior intact
// v0.789: CQ_Bug_18 ready-dialog latency tuning: add a delayed per-player hidden ready-dialog prewarm shortly after deploy so the first interact/open after spawn is faster without pushing dialog build work back into immediate HUD startup or global state-change paths
// v0.788: CQ_Bug_18 ready-dialog open UX fix: rebuild invalidated hidden dialog caches before the ready-dialog interact point becomes usable so dialog open stays fast after redeploy without reintroducing startup HUD regressions or SETUITEXTLABEL spam
// v0.787: CQ_Bug_18 ready-dialog startup regression fix: remove global hidden-dialog warm work from deploy, join/leave, and map-change paths, and instead defer per-player hidden ready-dialog warm only after the ready-dialog interact point appears so startup HUD and deploy UI stay responsive
// v0.786: CQ_Bug_18 ready-dialog UX fix: keep pure-reveal cached open, but warm invalidated hidden ready-dialog caches off the open path so first open after deploy, join/leave, or map change stays responsive without reintroducing SETUITEXTLABEL spam
// v0.785: CQ_Bug_18 cache strategy fix: restore pure-reveal cached ready-dialog open, invalidate hidden dialog caches when map or roster state changes, and rebuild those dialogs fresh on next open so first-open content stays current without hidden relabel writes
// v0.784: CQ_Bug_18 ready-dialog regression fix: restore the hidden pre-open refresh for button text, map/team labels, roster, ready toggle, and mode-config values while keeping cached ready-dialog open as a pure reveal path so first open content is current again without reintroducing reveal-time text churn
// v0.783: CQ_Bug_18 open-path revert: move ready-dialog roster/map/ready/mode text population back onto hidden first-build and remove dynamic section refresh from cached open so opening the dialog no longer triggers the old SetUITextLabel burst
// v0.782: CQ_Bug_18 first-open fix: remove the ready-dialog section builders' immediate post-build roster/map/ready text refreshes so first open no longer issues redundant SetUITextLabel writes on newly created widgets before the hidden pre-open refresh owns dynamic content
// v0.781: CQ_Bug_18 ready-dialog fix: stop ready-dialog open from writing through legacy TeamLeft/TeamRight HUD widget names and stop double-labeling newly created ready-dialog text widgets so first open no longer reintroduces SETUITEXTLABEL spam
// v0.780: CQ_Bug_18 restore: make cached ready-dialog open a pure reveal again, restore hidden pre-open mode-config refresh, and stop relabeling the static admin toggle during open so ready-dialog open no longer reintroduces SETUITEXTLABEL spam
// v0.779: CQ_Bug_19 precautionary hardening: keep the core live-state and vehicle poll loops alive through recoverable exceptions, clear stuck vehicle spawn orchestration flags on failure, and clean up leaked capture sound and per-player VO runtime prefabs during player cleanup and full scaffold reset without changing gameplay rules
// v0.778: Ready dialog polish: refresh cached roster, button, map, and mode-config content while the dialog is still hidden before open so first reveal shows current player names and settings immediately without reintroducing reveal-time SETUITEXTLABEL writes
// v0.777: UI cleanup: restore actual player-name messages in ready-dialog roster and vehicle deploy timer labels now that the ready-dialog reveal-path fix removed the underlying SETUITEXTLABEL spam source
// v0.776: CQ_Bug_18 cleanup: remove the temporary ready-dialog roster and mode-config bisect gates now that cached open is a pure visibility flip, restoring live knob and roster updates while keeping the reveal-path fix that stopped SETUITEXTLABEL spam
// v0.775: CQ_Bug_18 reveal-path cleanup: make cached ready-dialog open a pure visibility flip by removing reveal-time section text refreshes and reusing the existing admin-toggle widgets instead of rebuilding or relabeling them on open
// v0.774: CQ_Bug_18 message-shape fix: remove live Player handles from the remaining ready-dialog roster and vehicle deploy timer UI text messages by replacing them with UI-safe plain-string pid labels, while keeping the current open-time bisect gates in place
// v0.773: CQ_Bug_18 bisect: suppress only the ready-dialog post-open roster and mode-config text refresh families while leaving the cached dialog lifecycle and lighter button/map refresh paths intact so the remaining SETUITEXTLABEL spam can be isolated without degrading open responsiveness
// v0.772: CQ_Bug_18 rollback: restore the cached ready-dialog open/close lifecycle after the fresh-build experiment degraded responsiveness, while keeping the stricter stale-widget lookup protections for the continuing SETUITEXTLABEL investigation
// v0.771: CQ_Bug_18 lifecycle reset: stop reusing the hidden ready-dialog tree by removing cached reopen ownership, rebuilding the ready dialog fresh on each open, and destroying the dialog on close so stale widget families cannot survive into later text refresh loops
// v0.770: CQ_Bug_18 structural stale-widget fix: stop UI lookup from falling back to global or dead widget handles after ready-dialog open/rebuild by making safeFind UIRoot-only, making safeSetUITextLabel skip unresolved live widgets instead of writing through stale handles, and aligning the remaining ready/admin builder lookups to the stricter path
// v0.768: CQ_Bug_18 structural UI fix: route all ParseUI usage through a central safeParseUI normalizer that recursively converts Text-node numeric labels to mod.Message and fills nullish textLabel values before widget construction so ready-dialog and HUD build paths stop leaking invalid text inputs into engine SetUITextLabel
// v0.767: CQ_Bug_18 ParseUI label fix: convert the remaining raw string-key textLabel values in clock, branding, ready-line, and victory ParseUI builders to explicit mod.Message inputs so ready-dialog and HUD construction no longer leak numeric labels into SETUITEXTLABEL
// v0.766: CQ_Bug_18 ready-dialog build fix: convert numeric button label keys to explicit mod.Message values inside addCenteredButtonText so ParseUI cannot trip SETUITEXTLABEL while building ready-dialog and admin button text widgets
// v0.765: CQ_Bug_18 stale-widget hardening: make safeSetUITextLabel re-resolve the live widget by name before each label write so cached ready-dialog and HUD handles from reopen/rebuild paths cannot keep tripping SETUITEXTLABEL on stale references
// v0.764: CQ_Bug_18 wrapper hardening: make safeSetUITextLabel skip nullish labels and normalize numeric string keys before calling the engine so ready-dialog refresh helpers cannot trip SETUITEXTLABEL on transient undefined values
// v0.763: CQ_Bug_18 hardening: route the remaining ready-dialog and shared HUD label refresh paths through safe text setters so stale widgets after ready-dialog open or HUD rebuild stop spamming SETUITEXTLABEL and degrading later deploy UI behavior
// v0.762: Phase 5F cleanup: remove the temporary jet probe/admin HUD scaffolding and the old post-spawn aircraft teleport-pitch fallback, keeping only the fresh in-air aircraft birth-spawn production path plus its slot bind/runtime spawner tracking
// v0.759: Phase 5F aircraft air-deploy fix: keep the fresh in-air runtime VehicleSpawner alive on the slot after aircraft spawn instead of unspawning it immediately, so the fresh aircraft is not lost before seat verification completes
// v0.758: Phase 5F aircraft air-deploy patch: replace the old spawn-then-teleport aircraft air path with a fresh one-shot in-air VehicleSpawner birth spawn plus post-spawn seat, skip pre-deploy ground pre-spawn for aircraft, and suppress the slot binder's ground transform correction for that one fresh aircraft bind
// v0.757: Phase 5F transform probe unit correction: switch the working spawn-at-birth X/Z modes from the previous raw pitch value to a dedicated radian pitch value for straight-down spawn testing while leaving the rest of the discrete rotation cycle unchanged
// v0.756: Phase 5F transform probe tuning: reduce the temporary jet pitch test target from +90 to +80 so the working spawn-at-birth X path can be checked at a slightly shallower nose-down angle
// v0.755: Phase 5F transform probe tuning: flip the temporary jet pitch test target from -90 to +90 to test whether the working spawn-at-birth X path uses the opposite sign convention for nose-down aircraft attitude
// v0.754: Phase 5F transform probe tuning: increase the temporary jet pitch test target from -75 to -90 so the spawn and rotation probe modes use a fully nose-down baseline for the next isolation pass
// v0.753: Phase 5F transform probe expansion: restore the temporary fixed-air jet probe to a broader pitch-focused cycle with discrete spawn-at-birth X/Z modes plus SetObjectTransform, RotateObject, MoveObject, and SetObjectTransformOverTime pitch tests so the remaining aircraft pitch paths can be ruled out one by one
// v0.752: Phase 5F transform probe correction: replace the temporary Team 1 jet slot reposition path with a dedicated one-shot vehicle spawner at the exact fixed air test point so the pitch probe spawns once with no teleport in the probe flow
// v0.750: Phase 5F transform probe placement: use the exact hardcoded Team 1 jet air test position provided by design at (-703.347, 182.686, 259.311) with the Team 1 slot 1 base rotation so the temporary pitch probe always runs from that one fixed in-air location
// v0.749: Phase 5F transform probe correction: remove the temporary jet visual probe teleport step entirely so the Team 1 jet pitch test runs only at the spawner's native spawned state with no post-spawn repositioning
// v0.748: Phase 5F transform probe placement: move the temporary jet visual pitch probe off player-relative placement and onto the fixed Team 1 jet ground spawn position with Y raised by fifty so the same aircraft can be inspected from multiple on-foot angles
// v0.747: Phase 5F transform probe reduction: trim the temporary jet visual pitch harness down to only the two raw absolute SetObjectTransform X/Z modes so repeated tests stay focused on the current high-signal pitch-axis check
// v0.746: Phase 5F transform probe expansion: add raw-degree SetObjectTransform, RotateObject, MoveObject, and SetObjectTransformOverTime variants to the temporary cycling jet probe and relabel the existing modes as rad-converted so the admin button can test more aircraft rotation hypotheses without code changes between runs
// v0.745: Phase 5F transform probe expansion: turn the temporary unoccupied jet visual probe into a cycling harness that steps through SetObjectTransform yaw authority, SetObjectTransform X/Z pitch, RotateObject X/Z delta, and MoveObject X/Z delta with explicit per-mode HUD titles and admin button labels
// v0.744: Phase 5F transform probe trigger fix: remove the brittle on-foot vehicle check, fall back to player/interact-point placement data when soldier-facing reads are unavailable from the ready-dialog admin context, and surface a specific placement-resolution failure message
// v0.743: Phase 5F transform probe fix: make the temporary jet visual probe fail visibly via gameplay-targeted messages, prefer empty team jet slots, and allow the probe to force-spawn a team jet instead of silently depending on reservation-only readiness
// v0.742: Phase 5F transform probe: add a temporary admin-triggered unoccupied jet visual transform-authority probe that spawns a team jet visibly in front of an on-foot player, rotates teleport yaw and transform yaw apart, and shows temporary HUD readback for teleport, target, pre, apply, post, settle, and seat snapshots
// v0.741: Phase 5F aircraft pitch probe: move the temporary jet rotation probe from world-log spam to a shell-owned HUD block that shows target, apply, post, settle, and seat rotation snapshots together after seating
// v0.740: Phase 5F aircraft pitch probe: add same-tick and short pre-seat delayed jet rotation readbacks after SetObjectTransform so we can distinguish never-applied pitch from pitch that is flattened within the first simulation steps
// v0.739: Phase 5F aircraft pitch probe: add targeted jet air-deploy readback messages for target rotation plus pre-transform, post-transform, and post-seat vehicle position/rotation so we can observe whether scripted pitch is applied or flattened during the stable air-deploy flow
// v0.738: Phase 5F aircraft pitch prototype: restore the stable pre-seat in-air transform flow and convert transform rotation vectors from authored degrees to radians before SetObjectTransform
// v0.737: Phase 5F aircraft pitch prototype: remove the ineffective pre-seat jet rotation attempt and test one occupied MoveObjectOverTime pitch-roll delta after stable air placement and seating
// v0.736: Phase 5F aircraft pitch prototype: switch the pre-seat jet pitch attempt from instant RotateObject delta to a short SetObjectTransformOverTime at the current in-air position while keeping stable air placement and seating intact
// v0.735: Phase 5F aircraft pitch prototype: restore stable jet air teleport and test pre-seat unoccupied RotateObject pitch-roll delta before seating, while keeping heli air deploy unchanged
// v0.734: Phase 5F aircraft pitch prototype: switch jets from teleport-then-preseat-transform to one direct authored SetObjectTransform(position, rotation) before seating, while leaving heli air deploy on the stable yaw-only teleport path
// v0.733: Phase 5F aircraft pitch prototype: reverse bounded air deploy seat order so aircraft are placed unoccupied in the air first and the player is forced into the seat afterward, with the older post-seat air path only as fallback
// v0.732: Phase 5F error fix: remove right-side vehicle HUD owner-name polling from player vehicle-seat engine queries and route the admin deploy-timer toggle label through the safe text wrapper
// v0.731: Phase 5F debug hardening: stop the position debug panel from falling back into risky player-object sampling while in vehicle and route remaining admin/debug visibility-text writes through safe UI wrappers
// v0.730: Phase 5F debug fix: stop the position-debug panel from polling player vehicle-seat APIs directly and resolve its value widgets fresh each update so stale debug widget handles no longer spam SetUITextLabel or vehicle-seat runtime errors
// v0.729: Phase 5F regression fix: guard vehicle-seat lookups behind deployed-state checks, route debug position value writes through safe label updates, restore stable bounded-air teleport for jets, and test pitch with a zero-translation MoveObject rotation delta after in-air teleport
// v0.728: Phase 5F regression fix: restore admin panel row label creation with a plain match-length label and move jet bounded-air full-rotation staging to the unoccupied pre-seat step so pitch can be tested without occupied-transform regressions
// v0.727: Phase 5F runtime fix: harden transient player-vehicle seat reads, stop building the formatted admin match-length label with zero parameters, and switch the occupied-jet post-teleport pitch experiment from SetObjectTransform to RotateObject pitch/roll delta
// v0.726: Phase 5F transform experiment: keep stable air teleport for position, then apply SetObjectTransform at the jet's current in-air position so occupied aircraft can test full rotPlane pitch/yaw/roll without using transform for relocation
// v0.725: Phase 5F regression fix: roll bounded-air relocation back from SetObjectTransform(CreateTransform(...)) to the prior yaw-only teleport path after occupied-aircraft runtime regressions and script errors
// v0.723: Phase 5F bounded-air transform: switch aircraft box relocation from yaw-only teleport to full SetObjectTransform(CreateTransform(...)) so authored rotPlane/rotHeli X/Y/Z vectors can be honored
// v0.721: Phase 5F polish: collapse bounded-air plane box orientation from randomized cardinal rotPlaneN/E/W/S entries to a single authored rotPlane vector per box
// v0.718: Phase 5F authoring polish: add explicit Operation Firestorm Box 2 placeholders for aircraft and tank bounded spawn volumes so additional floor corners can be authored directly in map config without changing live behavior
// v0.717: Phase 5F polish: support weighted multi-box bounded spawn selection so additional authored aircraft or tank volumes in map config are actually used instead of hard-picking the first entry
// v0.716: Phase 5G polish: nudge the position-debug labels another five units right and add colons to the pos/rot label strings while leaving the value column unchanged
// v0.715: Phase 5G polish: shift position-debug labels right and values left by five units so the coordinate strip reads cleaner without changing the panel container layout
// v0.713: Phase 5G cleanup: extract shared HUD warm and ready-dialog signature state accessors into a dedicated interaction module so actions.ts stays focused on orchestration
// v0.712: Phase 5G cleanup: move ready-dialog admin toggle and panel-build lifecycle into the admin-panel domain so ui-events-ready only routes input
// v0.711: Phase 5G cleanup: move ready-dialog close, destroy, chrome visibility, and admin-reset ownership into a dedicated lifecycle module so actions.ts only keeps warm/reveal logic
// v0.710: Phase 5G cleanup: move ready-dialog hidden-build and show ownership behind builder-owned helpers so prebuild and open no longer duplicate uiBuilt/dialogVisible decisions across interaction code
// v0.709: Phase 5G cleanup: unify ready-dialog cached reopen and first-build paths behind shared section-refresh and final-visibility helpers so the dialog keeps one reveal contract
// v0.708: Phase 5G cleanup: replace repeated raw HUD warm-token guards with centralized helpers and remove the no-op deferred admin prebuild hook from the ready-dialog warm path
// v0.707: Phase 5G cleanup: remove the dead legacy conquest HUD ref bag and delete its last unused ticket-bar helper so active HUD cache shapes stay focused on live ownership
// v0.705: Phase 5G fix: sync the confirmed default vehicle package into startup spawner slots before first enable/reveal so pre-live HUD inventory matches the ready-dialog defaults without requiring Apply Configuration
// v0.704: Phase 5G tuning: make TWL 10v10 default heli slot 2 the AH6M for both teams, move Black Hawks to transport slot 3 defaults, and remove the dead ready-dialog warm-cache helper
// v0.703: Phase 5G cleanup: centralize HUD warm/swap/signature state writes and relabel the leftover mixed HUD ref bag as legacy-only during the active cache-shape cutdown
// v0.702: Phase 5G cleanup: split vehicle HUD ownership into explicit hidden-prepare, hidden-prebuild, reveal-owner, and content-only update paths, and remove stale loading naming from the HUD warm controller
// v0.701: Phase 5G cleanup: split the active top-HUD shell cache type from the broad legacy HUD ref bag and remove the dead hudByPid cache fallback
// v0.700: Phase 5G polish: reveal the right-side vehicle HUD after spawner startup for already-warmed undeployed players so the list appears before first deploy
// v0.699: Phase 5G polish: invalidate the right-side vehicle HUD render cache after applying ready-dialog configuration so AH6M-only heli changes refresh immediately pre-live
// v0.698: Phase 5G polish: refresh the right-side vehicle HUD immediately after applying ready-dialog configuration so pre-live slot changes appear without waiting for respawn
// v0.697: Phase 5G polish: classify AH6M as a tracked attack helicopter so it appears on the right-side vehicle HUD with ground and air deploy actions
// v0.696: Phase 5G cleanup: add AH6M to heli knob options and split non-owner vehicle HUD refresh callsites onto explicit visibility-preserving update helpers
// v0.695: Phase 5G cleanup: add ready-dialog dirty-refresh signatures for roster, mode-config, map, and button sections so reopen and visible refreshes skip unchanged UI writes
// v0.694: Phase 5G cleanup: extract HUD family cleanup helpers in actions.ts and replace repeated ready-dialog, vehicle-HUD, clock, and debug hide/delete lists with family-owned helpers
// v0.692: Phase 5G cutdown: remove dead legacy combat V2 widget writers and delete their unused bleed-pulse/render-burst state
// v0.691: Phase 5G optimization/cutdown: remove dormant loading overlay state, isolate active combat ownership from legacy V2 hide bridges, and split vehicle HUD content refresh from family reveal
// v0.689: Combat HUD scheduler prime: trigger one immediate single-player scheduler frame after arming combat reveal so pre-live combat appears once without duplicate owners
// v0.688: Combat HUD ownership correction: make scheduler the single combat render/reveal owner and arm combat visibility instead of pre-rendering in the reveal path
// v0.687: Combat HUD reveal owner: hide current combat family before hidden reveal render to prevent stale ticket/bar flash
// v0.686: Combat HUD reveal ordering: keep scheduler reveal-disabled until hidden reveal render completes
// v0.685: Combat HUD reveal stabilization: park hidden combat renders offscreen and suppress immediate scheduler repaint after reveal
// v0.684: Combat HUD warm-loop correction: stop rendering combat content during warm polls; only build structure there and render content once at reveal
// v0.683: Combat HUD cleanup: force-hide any stale legacy V2 ticket/flag widgets during combat warm and reveal
// v0.682: Combat HUD reveal refinement: render a fresh hidden frame at reveal time before flipping the combat root visible
// v0.681: Combat HUD atomic reveal: preserve primed hidden frame and reveal root directly instead of visible rerender
// v0.680: Combat HUD reveal ownership: block scheduler render until explicit combat-family reveal owner enables it
// v0.679: HUD reveal correction: keep top-left immediate while rendering combat HUD hidden until root reveal
// v0.678: UI family ownership split: build top-left, vehicle HUD, combat HUD, ready dialog, and admin/debug through separate hidden-build/reveal helpers in the approved order, and turn position debug off by default
// v0.677: Ready dialog ownership fix: prebuild the dialog hidden as the last step of the HUD warm pass and remove the interact-point and scheduled cache ownership of that build
// v0.676: Ready dialog optimization: prebuild the dialog hidden when the interact point is spawned and ensure first interact hidden-builds it before UI input is enabled
// v0.675: Reveal-owner fix: move the vehicle HUD onscreen when the reveal owner shows it, and prewarm the ready dialog earlier so first open avoids the cold build path
// v0.674: Vehicle HUD optimization: skip broadcast refresh work when the rendered slot signature is unchanged so ordinary state sync no longer replays the same visible row updates
// v0.673: UI reveal-owner cleanup: hide top-center/admin counter at birth, remove eager ready-dialog admin toggle reveal, and reveal them only from the top-HUD owner
// v0.672: Vehicle HUD reveal-owner follow-up: preserve current visibility during global refreshes so hidden roots do not reappear during ordinary state updates
// v0.670: Phase 5G architectural correction: document and implement build-refresh-reveal ownership for top HUD, vehicle HUD, and debug UI
// v0.669: UI reveal contract fix: route team swap through one hidden-build/reveal owner and block stale vehicle/debug reveal paths during swap
// v0.668: Swap polish: hide old vehicle/debug HUD immediately on team switch and restore ready-dialog map label alignment
// v0.667: Position debug first-pass fix: build pos/rot widgets hidden via ParseUI and parent them immediately instead of birthing them visibly through AddUIText
// v0.666: Vehicle HUD reveal fix: build deploy timer row widgets hidden, keep warm-cache render hidden, and remove swap-time forced vehicle HUD reveal
// v0.665: Ready dialog fix: replace unsafe roster/text build path, guard roster refresh, and fail-safe dialog open so invisible builds cannot trap the player
// v0.664: Vehicle/debug reveal polish: render vehicle HUD offscreen until rows are fully updated and keep position debug visible through undeploy/team-switch flows
// v0.663: Swap/UI reveal fix: use unified reveal owner after team swap and render vehicle HUD rows in two phases before showing them
// v0.662: Ready dialog roster reveal fix: build roster labels hidden under their containers instead of spawning visible on UIRoot before reparenting
// v0.661: Reveal-owner correction: refresh top HUD hidden before reveal, keep vehicle HUD root hidden until row render completes, prebuild position debug hidden, and remove ready-dialog post-reveal roster refresh
// v0.660: UI reveal polish: restore top-left branding after warm reveal, hide vehicle HUD child widgets until gated show, and refresh ready-dialog roster before reveal
// v0.659: Back out loading overlay/process and keep UI hidden until warm-ready: use warm-ready visibility for top HUD, vehicle HUD, and ready dialog reveal ordering
// v0.658: HUD loading team-swap controller: make swap loading single-owner, suppress undeploy warm races, and keep deploy blocked until the controller releases it
// v0.657: HUD loading controller: hold deploy through swap/loading, remove unconditional release, and keep top/combat/vehicle HUD families dark until final reveal
// v0.656: HUD loading controller: hold team-swap and first-load release until critical top HUD, combat HUD, and vehicle deploy HUD are prebuilt and stable, while reasserting the deploy block throughout the warm window
// v0.655: Team swap loading flow: start the critical HUD warm immediately for already-undeployed swaps instead of waiting on an undeploy callback that never arrives
// v0.654: Team swap loading race: invalidate any in-flight HUD warm token when priming the swap loading overlay so stale releases cannot hide Loading or re-enable deploy
// v0.653: Team swap loading gate: keep redeploy blocked through swap warm and reject any deploy callback that arrives before HUD loading finishes
// v0.652: Ready dialog: rename transport slots 3 and 4 to Heli / Transport 3 and 4
// v0.651: Transport slots 3 and 4: allow both fast movers and transport helis, and route spawn anchors by selected vehicle type
// v0.649: Team swap loading UX: show the loading overlay immediately on swap prime while keeping deploy blocked until the warm gate releases
// v0.648: Team swap loading polish: hide position debug during the loading gate, suppress the pre-warm visible loading prime, and skip join-prompt creation on swap-driven warm so the swap flow stays a single loading phase
// v0.647: Team swap loading gate: engage the HUD loading gate immediately when priming the swap overlay so HUD cannot reappear between the pre-swap prime and the actual warm pass
// v0.646: Ready dialog labels: fix knob-label fallback so valid BF6 string keys no longer resolve to Unknown
// v0.645: HUD loading gating: disable player deploy while loading is active and only re-enable it after release so join and team swap cannot spawn into a partial HUD state
// v0.644: HUD loading policy: show loading only on first join warm and explicit team swap warm, but skip it on ordinary cached undeploy paths
// v0.643: HUD loading polish: restore help text visibility after load and keep top HUD root/clock hidden on first build while the loading gate is active
// v0.642: HUD loading gate: prebuild top/deploy HUD hidden, keep top root hidden during warm, and reveal critical UI atomically after warm completes
// v0.641: Phase 5G polish: prebuild critical HUD behind loading overlay and move loading label onto the proven centered-text path
// v0.640: Phase 5G polish: add per-player HUD loading gate that blocks redeploy and hides combat/deploy UI until critical HUD warm completes
// v0.639: Ready dialog hardening: fall back on a safe label when a knob string key is missing so SetUITextLabel cannot crash the UI refresh loop
// v0.638: Transport column update: make rows 3 and 4 transport-heli slots using heli spawn anchors 3 and 4 with Black Hawk-only options
// v0.637: Fast-mover deploy hardening: wait longer for large transport spawns to bind and fall back to first available seat when Marauders reject seat 0
// v0.636: Deploy HUD polish: restore the original lower anchor line for the expanded vehicle panel and show ground deploy buttons for fast movers
// v0.635: Phase 5G: make 10v10 Conquest the default authoritative spawn package, hide legacy config rows, and wire Firestorm fast-mover defaults
// v0.634: UI optimization pass: share ready/admin primary-click gating, centralize ready-dialog sizing, and collapse deploy HUD action-button helpers
// v0.633: Admin panel input cleanup: scope primary click dedupe to matched admin widgets only
// v0.632: Ready dialog cleanup: remove the dead team-wide vehicle override state and keep only per-slot vehicle selection config
// v0.631: Admin panel input fix: dedupe ButtonDown/ButtonUp so tester actions and position debug toggle only fire once per click
// v0.630: Ready dialog input fix: ignore the matching mouse release after a consumed press while still supporting single-phase button events
// v0.629: Ready dialog cleanup: remove dead legacy matchup widgets and collapse stale refresh wrappers onto the live grid updater
// v0.628: Fix ready dialog schema import so generated Script.ts includes the shared grid helpers
// v0.627: Ready dialog cleanup: centralize grid schema, remove dead legacy knob input branches, and simplify cached button refresh paths
// v0.626: Ready dialog click dedupe: accept ButtonDown or ButtonUp once per widget click so knobs cycle once and ready state stays stable
// v0.625: Ready dialog input stabilization: process ready-dialog/admin actions only on ButtonDown to stop double knob cycles and ready-state flipbacks
// v0.624: Ready dialog follow-up: restore ready-map visibility on reopen and relax knob click gating so top tuning controls cycle again
// v0.623: Ready dialog knob input fix: explicitly enable ButtonUp on cached knob buttons and gate ready-dialog actions on ButtonUp
// v0.622: UI cache follow-up: restore ready-map/admin screen-space placement and prebuild the vehicle deploy HUD hidden before first display
// v0.621: Ready dialog cache hardening: stop warm-cache reveal, keep admin lazy, and remove reopen label recreation
// v0.620: Ready dialog centering follow-up: shift the shared top lane left to match the centered roster plate edges
// v0.620: Ready dialog centering follow-up: shift the shared top lane left to realign the knob grid and apply button with the already-centered roster plate edges
// v0.619: Ready dialog centering follow-up: shift the lower roster plates left by the measured visual offset
// v0.619: Ready dialog centering follow-up: apply a measured left correction to the lower roster plates while keeping the top knob lane centered
// v0.618: Ready dialog centering: derive grid, roster, and apply button from one lane origin
// v0.618: Ready dialog centering pass: derive the apply button, grid, and roster panels from the same lane-left origin instead of mixing TopCenter and TopLeft placement
// v0.617: Ready dialog centering correction: remove the shared inner-lane left bias so the knob grid, apply button, and roster panels resolve to true center
// v0.616: Ready dialog centering pass: shift the shared content lane left so the knob grid, apply button, and roster panels align to the same visual center
// v0.615: Ready dialog row spacing pass: restore tighter knob label/value separation, normalize config arrow glyphs, shrink the players panel, narrow apply button, and widen the roster center gap again
// v0.614: Ready dialog spacing polish: separate knob labels from values, tighten config players stack, narrow apply button, and widen the centered roster gutter
// v0.613: Ready dialog lane alignment: unify knob grid to roster content width, lower knob values, and pull config players support text into the inner panel lane
// v0.612: Ready dialog layout reflow: invalidate stale cached layout, tighten config players row, and nudge knob grid upward for centered retest
// v0.611: Ready dialog polish: recenter top grid and roster panels, lower knob labels into the control lane, color team glyphs, and center lower team labels
// v0.610: Phase_5G_ready-dialog_team-relative_color_and_alignment_polish
// v0.609: Phase_5G_centered_ready-dialog_grid_polish
// v0.608: Phase_5G_ready-dialog_knob_matrix
// v0.607: Phase 5G follow-up: add Firestorm fast-mover spawn placeholders and lock ready-up grid/state-authority layout notes
// v0.606: Phase 5F follow-up: fill Firestorm jet static spawn placeholders from authored screenshot captures
// v0.605: Phase 5F groundwork: add Firestorm jet volume floor/ceiling and cardinal rotation config plus jet spawn placeholders
// v0.603: Phase 5D UI fix: widen deploy HUD root for dual-button layout and refresh Air/Ground button labels every render
// v0.602: Phase 5D/5F follow-up: split ready aircraft deploy into Air Deploy and Ground Deploy button flows
// v0.601: Phase 5F follow-up: refresh Firestorm Team 1 aircraft box corners from updated screenshot captures and flatten floor to max Y
// v0.600: Phase 5F experiment: ground-spawn heli, seat player, then teleport the occupied heli into the bounded air volume
// v0.599: Phase 5F isolation: restore exact helis-only Firestorm heli spawn transforms for static loadout testing
// v0.598: Phase 5F isolation: remap Firestorm heli slots to static ground tank-pad transforms for loadout testing
// v0.597: Phase 5F isolation: disable bounded-air relocation and restore original static aircraft spawn behavior for direct deploy testing
// v0.596: Phase 5F follow-up: use authored heli slot spawns as the fixed ground stage before 1-second air-box lift and player seat
// v0.595: Phase 5F experiment: restore static aircraft spawn, wait 1 second, then lift into the air box before player deploy and seat
// v0.594: Phase 5F experiment: stage aircraft on random ground heli pads before bounded air lift and direct-seat fulfillment
// v0.593: Phase 5F follow-up: add Firestorm Team 2 aircraft box from authored screenshot corners and reduce aircraft volume heights to 100
// v0.591: Phase 5F proof: enable Firestorm Team 1 aircraft volume and randomize aircraft spawn transform inside the authored box
// v0.589: Admin/debug fix: split vehicle rotation into stable facing-driven rotX/rotY plus object-rotation rotZ and move pos labels further left
// v0.588: Admin/debug fix: sample on-foot rotation from object rotation and use direct current vehicle handles for seated transform reads
// v0.587: Admin/debug fix: drive pos/rot sampling from script-owned soldier-vs-vehicle state and retain last-good values across transient read failures
// v0.585: Admin/debug fix: make pos/rot sampling state-driven and resilient so transient on-foot or vehicle read failures no longer kill the loop
// v0.584: Admin/debug follow-up: move the pos row labels further left while leaving the rot row unchanged
// v0.583: Admin/debug fix: use matching position and facing sources on foot and in vehicles so pos and rot update in both states
// v0.582: Admin/debug follow-up: move the pos row labels back left by the same amount and keep the rot row unchanged
// v0.581: Admin/debug follow-up: nudge pos row labels right while leaving the rot row unchanged
// v0.580: Admin/debug fix: restore seated pos updates via vehicle state and keep vehicle rot sampling resilient with fallback
// v0.579: Admin/debug follow-up: use vehicle transform for pos/rot debug while seated and fall back to soldier state on foot
// v0.578: Admin/debug follow-up: nudge the position/rotation numeric value columns right to clear negative-sign overlap with labels
// v0.577: Cleanup: remove dead reservation-era fields/functions after the DEPLOY-button pivot and keep only the live direct-spawn claim helpers
// v0.576: Admin/debug follow-up: center-left align pos/rot labels so they sit on the same vertical line as the numeric values
// v0.575: Admin/debug follow-up: compact the coordinate panel, split labels from values for aligned numeric columns, and color pos labels green with rot labels blue
// v0.574: Admin/debug follow-up: widen coordinate strip to labeled posX/posY/posZ and inferred rotX/rotY/rotZ fields with a two-row black backplate layout
// v0.573: Admin/debug follow-up: port Helis coordinate readout to Conquest with solid black plate, default it on, and switch startup defaults to 1v0 auto-start with 4v4 matchup
// v0.572: Phase 5F infrastructure: add bounded vehicle spawn volume schema, runtime accessors, and Firestorm placeholder map-config entries
// v0.571: Phase 5B UI follow-up: move spawn-timer minute digits right by one more unit
// v0.570: Phase 5B UI follow-up: nudge spawn-timer minute and second digits right while keeping the colon fixed
// v0.569: Phase 5B/5D UI follow-up: tune spawn-timer colon and minute-digit offsets, switch DEPLOY border to a thin outline, and use white base border with black selected border
// v0.568: Phase 5D UI follow-up: align DEPLOY button closer to join-prompt button construction by using a visible native UIButton face with built-in base/focus/pressed states and removing the custom fill stack from the interactive path
// v0.567: Phase 5D UI follow-up: add stable focus-driven DEPLOY button state so controller navigation can drive the same custom visuals and activation path as mouse hover
// v0.566: Phase 5D follow-up: verify configured Firestorm deploy anchors by resolving SpawnPoint objects, clearing UI input before forced deploy, and only accepting the spawn-point path if it actually enters deployed state
// v0.565: Phase 5D infrastructure: add per-team vehicle-deploy spawn point ids to map config and prefer SpawnPlayerFromSpawnPoint for direct vehicle deploys
// v0.562: Phase 5B active-row polish: keep vehicle plate width fixed and display IDLE in the reused owner panel
// v0.561: Phase 5B/5D UI fixes: restore visible vehicle plates, recenter spawn timer glyphs leftward, and hide pending-claim deploy HUD to stop pre-deploy button teleport
// v0.560: Phase 5B timer layout polish: center the colon and equalize MM:SS glyph spacing with explicit 1-unit gaps
// v0.559: Phase 5B UI hardening: stop per-second deploy button widget churn by caching row layout, button visibility, and button visual state
// v0.558: Phase 5B/5D UI/state fix: remove Deploy button blur flicker, right-align rows without empty button lanes, and display current pilot or Idle from live seat state
// v0.557: Phase 5B UI polish: lock Deploy button border to black and keep white text with black drop shadow across all states
// v0.556: Phase 5B UI polish: rename Spawn button to Deploy and use black text with white drop shadow across all button states
// v0.555: Phase 5B UI polish: reduce Spawn button state padding to 1 and use bright-over-dark gradient layering for gray, blue, and green button states
// v0.554: Phase 5B UI polish: convert Spawn button to explicit base/hover/pressed padding model with white border, blur, and gradient states
// v0.553: Phase 5B UI polish: retheme Spawn button states, tighten row spacing, narrow vehicle/status plates, and widen timer digit spacing
// v0.552: Phase 5B/5D UI polish: use script-owned Spawn button fill, clear stale hover state, and move active owner name into the old button lane
// v0.551: Phase 5B UI polish: enlarge Spawn button, tighten row spacing, reduce plate widths, and add explicit white hover state with black border/text
// v0.550: Phase 5B/5D follow-up: move Spawn button left of vehicle name, keep READY visible, and hide active rows while deployed
// v0.549: Phase 5B/5D pivot: replace chopper reservation checkboxes with READY-only direct Spawn buttons and team-wide live timer/status rows
// v0.548: Phase 5C follow-up: replace native checkbox hover visuals with a script-owned white overlay highlight
// v0.547: Phase 5C/5D follow-up: improve checkbox top-edge alignment after hover-fill and immediate auto-resubscribe changes
// v0.546: Phase 5C/5D follow-up: use button hover fill for checkbox highlight and show auto-resubscribe immediately on vehicle destruction
// v0.545: Phase 5C UI follow-up: align checkbox top border flush with the checkbox plate
// v0.544: Phase 5B/5C/5D follow-up: hover uses checkbox backplate highlight and successful spawn arms slot auto-resubscribe on destruction
// v0.543: Phase 5B/5C/5D follow-up: add READY/ACTIVE timer states, team-ready visibility, and cache checkbox border state to reduce 1-second pulse
// v0.542: Phase 5C/5D follow-up: stabilize checkbox hover highlight, persist reservations through spawn, and nudge checkbox top border alignment
// v0.541: Phase 5C follow-up: make vehicle reservation checkbox button visually transparent to stop native pulse
// v0.540: Phase 5C follow-up: remove focus-driven checkbox highlight pulse from vehicle reservation UI
// v0.539: Phase 5C/5D follow-up: suppress startup tracked chopper auto-spawn and make deployed admin timer view read-only
// v0.538: Phase 5D Stage 1: add reserved chopper direct-spawn fulfillment on deploy and suppress auto-spawn for reservation-managed slots
// v0.537: Phase 5C Stage 1 follow-up: persist checkbox highlight state across timer refresh to stop periodic border pulsing
// v0.536: Phase 5C Stage 1 follow-up: persist reservations into round start, reorder deploy rows, and add subscriber-only live timer view with stronger checkbox states
// v0.535: Phase 5C Stage 1: add authoritative vehicle slot reservation buttons, reservation state, and deploy-screen checkbox visuals
// v0.534: Phase 5B Stage 1 follow-up: re-right-align the Firestorm helicopter timer rows, shrink the vehicle box again, and rebalance the timer face around centered digits
// v0.533: Phase 5B Stage 1 follow-up: move the Firestorm helicopter timer rows closer to the right edge, tighten the row gaps, thin the vehicle name box, and shrink the timer face
// v0.532: Phase 5B Stage 1 follow-up: add placeholder player and vehicle boxes, checkbox scaffold, white text styling, and move the Firestorm helicopter timer stack above the minimap
// v0.531: Phase 5B Stage 1 follow-up: right-align Firestorm helicopter timer rows, build the stack upward, and pull the timer block above the minimap
// v0.530: Phase 5B Stage 1: add Firestorm helicopter deploy-screen timer HUD with admin deployed-visibility toggle and reusable timer instances
// v0.529: Phase 5A: add authoritative Firestorm helicopter slot state, availability phases, and matchup-driven enabled count tracking
// v0.528: Phase 4B VO tune: switch enemy capture terminal default from ObjectiveLost to ObjectiveCapturedEnemy after multiplayer validation
// v0.527: Phase 4B VO fix: use per-player VO handles and recent-objective terminal recipient grace to fix contested/lost multiplayer delivery
// v0.526: Phase 4B Stage 3: harden per-flag VO state machine so debounce re-arms only on true state changes and duplicate terminal edges are suppressed
// v0.525: Phase 4B Stage 2: add contested objective VO and enemy terminal variant toggle for ObjectiveLost vs ObjectiveCapturedEnemy
// v0.524: Phase 4B Stage 1: add toggleable objective VO exploration path with recipient-local capturing and terminal flag VO
// v0.523: Phase 5 Stage 1: add authoritative per-slot vehicle respawn timer state and wire existing spawn/respawn flows to that timer owner
// v0.522: Phase 4 Stage 7: decouple capture-sound dispatch from HUD-named gates using shared active-objective occupancy authority
// v0.521: Phase 4 Stage 6: clear per-player capture-sound throttle residue on undeploy and redeploy lifecycle
// v0.520: Phase 4 Stage 5: clear per-player capture-sound throttle residue during team swap lifecycle
// v0.519: Phase 4 Stage 4: clear per-player capture-sound throttle residue on leave and rejoin lifecycle
// v0.518: Phase 4 Stage 3: simplify capture-sound queue to one logical event with recipient-local variant and throttle dispatch
// v0.517: Phase 4 Stage 2: harden capture-sound queue coalescing and add explicit anti-spam diagnostics
// v0.516: Phase 4 Stage 1 follow-up: gate capture-sound recipients by active engaged objective so ticks only play while on the flag
// v0.515: Phase 4 Stage 1 follow-up: remove on-point gate and lower capture-sound producer threshold so capture ticks continue beyond first enter
// v0.514: Phase 4 Stage 1: add conquest capture-sound backbone with queued friendly/enemy tick SFX dispatch
// v0.513: Phase 3C Stage 3: remove dormant legacy combat runtime files and hard-cut active HUD routing to shell plus core only
// v0.512: Phase 3C Stage 2: reroute active combat HUD callers to the dedicated combat dispatcher
// v0.511: Phase 3C Stage 1: extract dedicated top-HUD shell cache and reroute non-combat callers
// v0.510: Tie the final-minute clock color pulse directly to the displayed second for a consistent red alert.
// v0.509: Move the clock plate up slightly and slow the final-minute color pulse to a one-second cadence.
// v0.508: Change the final-minute clock alert to a red-white color pulse and tighten the clock plate width.
// v0.507: Replace final-minute clock flicker with a per-second hide window and narrow the clock plate.
// v0.506: Use authoritative round-clock state for final-minute flash and thin the clock plate further.
// v0.505: Thin the clock plate and move the visible clock container slightly lower.
// v0.504: Increase team-name spacing, lighten team-name shadow rings, and harden final-minute clock flicker visibility.
// v0.503: Keep the clock root visible during final-minute flicker and restore the low-time clock color to team red.
// v0.502: Remove the top-center aux panel, move the clock surface onto its own widget, and fix team-name spacing and shadows.
// v0.501: Refine clock plate, clock shadow/flicker, and aligned ticket team-name shadows
// v0.500: Make clock dark red below 5 minutes and add lightweight final-minute flicker
// v0.499: Align top-left status dock gap with branding left margin
// v0.498: Add player-perspective team names to ticket HUD flanks
// v0.497: Move core engage right counter left by 1 unit
// v0.496: Make the clock plate an explicit owned widget and shrink its final geometry
// v0.495: Tighten clock plate, remove top-row exit flicker, and clear engage state for dead players
// v0.494: Restore root-only branding depth and tighten clock plate geometry
// v0.493: Show popout percent immediately, speed live subtick loop, and lift top-left branding depth
// v0.492: Make flag enter-exit HUD cuts atomic and tighten top HUD containers
// v0.491: Core HUD intermittent mid-round disappear fix: make validation advisory and remove global hide-on-transient core fail-safe
// v0.490: Ready-dialog first-open regression fix: restore deferred warm-cache prebuild on join/deploy to eliminate trickle while keeping startup responsive
// v0.489: Startup latency follow-up: align core legacy suppression comments with one-shot contract
// v0.488: Core HUD startup latency pass: throttle deep validation, make core suppression one-shot only, and make ready-dialog first build reveal atomic
// v0.487: Rollback risky auto dialog warm-cache and reduce core-mode startup/swap destructive HUD purges to cut input/HUD latency
// v0.486: Core HUD perf fix: run legacy suppression one-shot instead of every 0.25s tick; remove extra pre-live HUD tick
// v0.485: Move Ready-dialog warm-cache to join/deploy and keep core HUD refresh active pre-live to remove first-load/team-switch UI latency
// v0.484: Remove lower-left settings summary widget; clear redeploy-delay carryover to reduce startup/team-swap HUD readiness lag
// v0.483: Immediate status-dock refresh on min-player config change and reduce status box width by ~30%
// v0.482: Status line2: show optional '(Z in Server)' when active players exceed configured min total; keep X/Y based on ready/min
// v0.481: Status ready progress now mirrors actual start gate (min-total vs all-active requirement, including team-0 fallback)
// v0.480: Status dock: use configured min-player total for ready denominator and align status text style to upper-left green (keep X/Y yellow)
// v0.479: Status dock phase map: pre-live line1 ready/not-ready + line2 ready count; live/game-over line1 players+mode with line2 LIVE/GAME OVER
// v0.478: Status box live layout: line1 shows players+mode and line2 shows LIVE; keep non-live ready/not-ready flow
// v0.477: Status lane: show 'You are Ready' whenever player is ready pre-live (do not gate on dialog visibility)
// v0.476: Hard-cut status text placement to isolated absolute dock widgets and keep runtime updates label/visibility-only
// v0.475: Fix Portal strict typing: guard status-lane subtree FindUIWidgetWithName calls against undefined root
// v0.474: Restore static top-left status panel lines (LIVE/GAME OVER/NOT READY + ready line) with label-only runtime updates
// v0.473: Docs: update top-left status-lane builder comment to match isolated static test-lane behavior
// v0.472: Hard-cut top-left status lane to isolated static box/text widgets with runtime status writers disabled
// v0.471: Fix status-lane static child placement by removing runtime text transform overrides
// v0.470: Forced static status-lane parent chain normalization (UIRoot->status root->status texts) with fixed build-time anchors and positions
// v0.469: Added explicit status-box proof string and forced centered static status label for ownership verification
// v0.468: Removed all global status-lane fallback lookups; status labels now resolve from static cache-owned lane refs only
// v0.467: Removed remaining runtime legacy status touchpoints; status text updates now target static TwlConquestHudStatusLane widgets only
// v0.466: Moved status-root resolver ownership into hud/status for static status lane and removed clock-module dependency
// v0.465: Rebuilt top-left status lane as static-only TwlConquestHudStatusLane widgets and removed clock status-lane attachment path
// v0.464: Forced static parent ownership and fixed anchor/position normalization for top-left status text widgets at build time
// v0.463: Added status-lane probe offsets: container plus 20 X and status text plus 20 X for ownership validation
// v0.462: Hard-isolated status lane again with fresh TwlConquestHudStatus names and forced hiding of prior status text variants
// v0.461: Locked top-left status text resolution to status container subtree and removed global fallback lookups
// v0.460: Made top-left status lane static-only by removing runtime status text reparent helper path
// v0.459: Hard-cut status lane names to TwlConquestStatus widgets and purge legacy status name collisions
// v0.458: Harden join/leave cleanup for all status text widgets to enforce single static top-left status ownership
// v0.457: Enforce single static top-left status text pair and remove legacy ReadyStatus widget path
// v0.456: Stabilize startup by retiring legacy clock status text creation and keep top-left status ownership static
// v0.455: Static top-left status text parenting/centering, retire legacy status text path, and snap core text-shadow geometry
// v0.454: Force top-left status text ownership/layout, retire legacy ready lane visibility, and realign core bar/chevron/shadow tuning
// v0.453: Fix top-left status text ownership, recenter ticket chevrons, and normalize HUD shadow ring symmetry
// v0.452: Fix top-left status lane parenting, reduce startup HUD churn, and snap core ticket bars to pixel grid
// v0.451: HUD core pass: fix swap reveal delay, restore top-left status lane, tune shadow rings, and restore flag border ownership
// v0.450: Fix bug 4: hide combat HUD until team-switch rebuild completes
// v0.449: bug4 swap gate: keep combat HUD hidden/destroyed while team-swap reset is pending until deploy rebuild release
// v0.448: hud top-row borders: restore visible border alpha and gate border color/visibility to authoritative full ownership state
// v0.447: hud status lane follow-up: enforce reparent after build/refresh and align top-left status panel height with branding
// v0.446: hud polish: pixel-snap ticket bars, top-left status stack relocation, engage/letter shadow parity, and first-boot core HUD fault isolation
// v0.445: hud-core: convert objective and popout letter shadows to symmetric 8-way ring halos
// v0.444: size-cut: removed header game-mode description block and pruned inactive combat-v2 runtime imports to shim
// v0.443: process: enforce 1MiB bundle size cap in verify and document guardrail in AGENTS
// v0.442: bundle-size: remove runtime Changelog import from entrypoint
// v0.441: hud-core: harden shadow-ring array access to tolerate stale entries during hide/render
// v0.440: hud-core: restore differential bleed chevrons, add reusable shadow-ring profiles for chevrons+percents, and nudge engage/percent lane Y
// v0.439: hud-core: make popout/engage first-frame reveals atomic and stabilize chevron visibility/shadow cleanup
// v0.438: hud-core: remove ticket shadows, tune legacy shadow offsets, harden chevrons visibility, and tighten popout/engage spacing
// v0.437: hud-core: lower popout, tighten engage gap, restore chevrons visibility, add combat text drop-shadows
// v0.436: hud-core engage lane: pixel-snap root x to stabilize symmetric count-box gap alignment
// v0.435: hud-core: add percent chip backgrounds and tune ticket/popout/engage vertical alignment
// v0.434: hud visibility: prevent help text from reappearing after team swap in live match
// v0.433: hud-core positioning: move ticket counter row down to bar lane and lower popout lane
// v0.432: hud-core parity: lower stack slightly, compute core leader team for ticket lead indicators, add engage count chip backgrounds, and keep bleed chevrons static-visible
// v0.431: hud-core tickets: hide center slash separator
// v0.430: hud-core positioning: lower full combat stack and normalize ticket counter/slash row alignment
// v0.429: hud-core: lower combat stack below clock via dedicated top-stack offset
// v0.428: hud-core build-pass pulse fix + localized fallback label keys
// v0.427: runtime ticket layout + snapshot fallback + objective label stabilization
// v0.426: fix core ticket bar start-fill ratio and align ticket spacing to configured objective count
// v0.425: rollback recent core hud runtime experiments to isolate startup no-load while keeping HQ fail-open guard
// v0.424: harden startup map detection: fail-open HQ probe to prevent full experience boot abort
// v0.423: stabilize core hud flicker: isolate per-player runtime faults, add capture sample grace, harden flag letter fallback
// v0.422: Core HUD parity/cadence pass: restored legacy ticket spacing model and moved live capture sync to sub-second updates
// v0.421: Core HUD surface visibility fix: apply solid-fill + alpha on ticket bars, flag slots, popout, and engage track
// v0.420: Core HUD root acquisition fix: relax TopHudRoot validation and add fallback binding for hud-core build
// v0.419: HUD core recovery pass: prevent mode-off latch on transient faults and stabilize shared HUD palette constants
// v0.417: HUD core phase-3 pass: ticket boxes+borders+crowns, inline flags, popout, engage panel, and bleed chevrons in isolated render path
// v0.416: Core HUD visibility hardening: make strict ref validation advisory so combat lane still renders after recovery
// v0.415: Core combat HUD visibility fix: use twl.system.slash key and clear hudModeOverride on startup scaffold
// v0.414: HUD core runtime failsafe: isolate startup/live loops from HUD exceptions; start spawners before HUD warmup
// v0.413: Hard-cut HUD core scaffold: TwlConquestHud isolated root chain + early centering probe
// v0.412: CQ_Bug_9 isolate v2 owner: stop legacy combat build in ensureHudForPlayer
// v0.411: CQ_Bug_9 v2 containment: startup hard purge + first-ensure duplicate purge + centered root-chain validation
// v0.410: phase3 hud: isolate v2 combat loop + fail-open optional widgets
// v0.409: v2 owner flow fix: keep non-combat HUD updates active while suppressing legacy combat lanes
// v0.408: enable combat HUD gate for v2-only centering validation pass
// v0.407: combat HUD single-owner cutover: suppress legacy combat render path when v2 owner is active
// v0.406: disable combat HUD feature gate to restore baseline non-combat verification
// v0.405: enable combat HUD feature gate for in-game v2 testing
// v0.404: combat-v2: add ticket bleed-chevron widgets and render counts from bleed differential
// v0.403: combat-v2: add ticket leader border widgets with per-side render + lifecycle cleanup
// v0.402: combat-v2: run main lane render each cadence tick (remove stale dirty gating)
// v0.401: combat-v2: render active popout/engage lanes and add lifecycle hide/destroy coverage
// v0.400: combat v2 flags lane scaffolded (7 centered slots with label/fill render) and lifecycle hide/destroy coverage added
// v0.399: combat v2 tickets lane scaffolded (bars/counters) under deterministic v2 root chain; hidden when combat gate is off
// v0.398: combat v2 now builds/pins deterministic root chain (TopHudRoot->CombatV2->tickets/flags) with explicit hide/destroy lifecycle on swap/cleanup
// v0.397: combat v2 scaffold added (layout/cache/lifecycle/render/scheduler owners) plus join prompt policy-disabled suppression tracking
// v0.396: combat HUD isolation gate; preserve ready/admin/branding/victory paths while combat HUD is disabled
// v0.391: HUD subtree ref-owner enforcement: Conquest cached/build ensure now rebinds tickets/flags/popout/engage refs from pinned centered subtrees only (no global same-name lookup), and live critical checks now validate child-parent ownership for ticket containers/bars and flag slot roots so off-root/top-left handles are hard-rejected and rebuilt
// v0.390: HUD critical-ref geometry gate: live render critical checks now require centered anchor+position for TopHudRoot/ConquestCombatHudRoot/TicketsRoot/FlagsRoot (not just parent-chain), forcing rebuild whenever a top-left root chain appears
// v0.389: HUD root-owner hardening: removed cached name-based combat-root hydration, moved critical/ref validation to cached root-handle identity (`topHudRoot` + `conquestCombatRoot`), and removed ticket-counter hot-path parent rebinding so render updates cannot drift core widgets to top-left frames
// v0.388: HUD rebuild-loop fix: replaced fragile parent-name critical check with direct parent-widget identity validation and enforced layout-revision rebuild from the live render loop so stale cached trees are rebuilt once instead of oscillating/flickering
// v0.387: HUD centering architecture shift: moved Conquest tickets/flags roots to direct UIRoot TopCenter centering (clock-style), removed ConquestCombatHudRoot as active parent authority, and relaxed critical-ref parent validation to shared-parent consistency for deterministic center-frame rendering
// v0.386: HUD centering reliability pass: switched TopHudRoot/ConquestCombatHudRoot creation to ParseUI containers and added one-time per-PID HUD layout revision rebuild so stale cached root trees cannot bypass centered parent-chain normalization
// v0.385: HUD root-chain correction: switched combat HUD authority to TopHudRoot->ConquestCombatHudRoot, removed ConquestHudRoot active path, and aligned critical-ref parent checks to teardown spec
// v0.384: Conquest root enforcement: ensure now rejects stale cached HUD trees not parented under ConquestHudRoot->ConquestCombatHudRoot, hard-purges them, and rebuilds a single deterministic per-PID Conquest HUD tree.
// v0.383: Conquest HUD file split: moved Conquest HUD ensure/build owner from hud/build.ts into ui/conquest/hud-build.ts and switched index wiring; Conquest combat parent chain now uses dedicated ConquestHudRoot.
// v0.382: Conquest HUD root isolation: added dedicated ConquestHudRoot per PID, reparented combat HUD under it (no shared TopHudRoot parent), and updated lifecycle/cleanup/critical-ref parent-chain checks.
// v0.381: HUD lifecycle simplification: removed cached parent-chain validation/recovery path and replaced with hard stale-tree purge + deterministic rebuild when no per-PID HUD cache exists.
// v0.380: HUD teardown pass: centralized conquest lifecycle ownership, removed dead absolute-layout path, pinned tickets/flags roots to centered combat root x=0, and made bleed chevrons ticket-root local.
// v0.379: HUD centering anchor unification: ticket/flag roots now stay TopCenter under ConquestCombatHudRoot and pin to combat-center X, removing TopLeft conversion drift in root placement
// v0.378: HUD parent-chain authority gate: critical-ref validation now requires TopHudRoot -> ConquestCombatHudRoot -> Tickets/Flags chain and forces a clean per-PID rebuild when stale/left-anchored roots are detected
// v0.377: HUD centering simplification: introduced one centered ConquestCombatHudRoot per PID under TopHudRoot and pinned tickets/flags as static local children to eliminate split parent-chain drift on aspect changes
// v0.376: HUD centering fix: root pin path now reparents before setting TopCenter anchor so tickets/flags roots cannot reset to top-left during parent assignment
// v0.375: HUD root simplification: removed lifecycle-version mechanism, collapsed combat roots back under centered TopHudRoot, and stripped per-refresh clock reparent/position rewrites from cached path
// v0.374: HUD legacy-chain removal: removed TopHudRoot legacy Container_Top* reparent path so only explicit centered Conquest combat root chain controls top combat HUD placement
// v0.373: HUD owner-path simplification: removed lifecycle-token gating and made update loop always use ensureHudForPlayer so centered combat base-root parenting is enforced through a single per-PID owner path
// v0.372: HUD lifecycle migration: bumped per-PID lifecycle version to force one-time rebuild into centered ConquestCombatHudRoot base container for all existing players
// v0.371: HUD base-root centering pass: moved combat tickets/flags under single centered ConquestCombatHudRoot and removed magic combat root width by deriving from ticket root geometry
// v0.370: HUD stability pass: set tickets/flags combat roots visible by default and rely on per-element state visibility to prevent native HUD fallback windows while preserving per-PID lifecycle ownership
// v0.369: CQ_Bug_9 lifecycle hardening: added one-time per-PID HUD lifecycle migration token to rebuild stale trees, while keeping runtime HUD updates cache/visibility-driven and root placement deterministic
// v0.368: CQ_Bug_9 architecture pass: removed schema-coupled live HUD bootstrap, added strict per-PID critical-ref ownership validation, and pinned top combat roots to centered TopHudRoot with cached-path layout churn removed
// v0.367: HUD architecture simplification: removed runtime top-combat absolute-layout writer (cached/build ensure path) and moved to static ParseUI creation flow with schema 41 rebuild
// v0.366: HUD lifecycle cleanup: include centered lane roots in join/leave teardown to prevent stale top-lane containers across reconnects/swap churn
// v0.365: HUD centering hardening: added centered lane roots for tickets/flags under TopHudRoot and migrated combat-root normalization to lane-local [0,0] with schema 40 rebuild
// v0.364: HUD centering chain: parent Conquest tickets/flags roots to centered TopHudRoot (clock frame) and schema 39 rebuild to purge stale left-anchored trees
// v0.363: CQ_Bug_9 simplification pass: removed unused live root normalizer and migration probes from capture HUD loop; retained ensureHudForPlayer as single top-combat layout owner with PID root-ownership guard.
// v0.362: CQ_Bug_9 kickoff: added per-player cached-root ownership guard and removed live-tick root normalization/schema probing from conquest HUD render path to enforce single-owner HUD lifecycle.
// v0.361: HUD centering migration: bumped schema to force one-time rebuild after reparent-before-anchor root fix so stale top-lane trees are fully replaced.
// v0.360: HUD centering fix: reparent-before-anchor on top combat root normalization to prevent anchor reset to TopLeft on tickets/flags/engage chain.
// v0.359: HUD centering hard reset: top combat roots now parent directly to UIRoot (TopCenter, X=0) and schema bumped to rebuild stale left-anchored trees.
// v0.358: HUD centering: apply top-root normalization in ensure/build path so tickets/flags/engage do not default left in pre-live phases.
// v0.357: HUD root-missing guardrail: rebuild on any missing top combat root and block fallback child/engage projection to prevent left-edge drift; schema 36
// v0.356: HUD centering authority reset: ticket/flag roots now TopCenter X=0 with capture-normalizer as single runtime writer; removed competing root writes from build/status and forced schema rebuild
// v0.355: HUD centering model shift: tickets/flags roots now TopLeft with explicit centered X under TopHudRoot; schema 34 rebuild for stale-root purge
// v0.354: HUD centering chain: force schema rebuild and normalize tickets/flags top roots under TopHudRoot at X=0 TopCenter
// v0.352: Top HUD centering hardening: explicit centered X projection for tickets/flags roots on top-lane canvas, engage root explicit local centering, and runtime purge of legacy top-core container trees
// v0.351: HUD legacy-root purge: delete all Conquest DebugRoot/triplet leftovers every ensure and force schema rebuild to remove left/top-left stale overlays
// v0.350: HUD centering chain fix: parent tickets/flags/engage to TopHudRoot, remove clock-parent fallback, reset live root X offsets, and force schema rebuild for stale tree cleanup
// v0.349: HUD diagnostics: forced runtime X-shift probe on top combat roots to verify active HUD writer path and isolate non-responsive centering chain
// v0.348: HUD root authority normalization: live update now reapplies centered parent/anchor/position for tickets/flags/engage roots on active refs/name chain to prevent stale root drift
// v0.347: HUD migration chain completion: migration bootstrap now purges top-root/clock duplicates and forces schema rebuild path before HUD ensure to eliminate stale lane transforms
// v0.346: HUD migration dependency hardening: one-time per-player migration token now forces full HUD rebuild on this schema so stale-but-populated trees cannot bypass centering fixes
// v0.345: HUD bootstrap dependency fix: clean-frame cache/schema probe now forces rebuild when HUD cache is missing/stale after hot reload, preventing stale top-lane trees from persisting
// v0.344: HUD centering chain fix: deterministic top-frame/clock schema purge, refs-first root resolution, and runtime stale-lookup hardening for tickets/flags/engage
// v0.343: HUD centering-only correction: reverted top combat roots to TopCenter with zero-X placement (no TopLeft centering math), schema rebuild
// v0.342: HUD first-build alignment fix: removed post-clock realignment path and enforced build order so clock root is ensured before conquest HUD roots are created/positioned
// v0.341: HUD alignment reliability fix: added one-time post-clock lane realignment pass so tickets/flags bind to MatchTimerRoot even when HUD builds before clock root creation
// v0.340: HUD centerline hard-lock: bootstrap now parents tickets/flags to MatchTimerRoot when available (TopHudRoot fallback) so top lanes share the exact clock centerline on all aspects
// v0.339: HUD parent-frame audit fix: unified clock + tickets/flags/engage bootstrap parenting under centered TopHudRoot and schema-rebuilt to eliminate split-frame aspect-ratio drift
// v0.338: HUD centering authority cleanup: removed runtime root normalization path, set tickets/flags/engage roots TopCenter at build/bootstrap only, and bumped HUD schema for clean tree rebuilds
// v0.337: HUD root authority pass: re-center ticket/flag roots each render against clock/top-center parent to eliminate stale parent/anchor drift
// v0.336: HUD centering anchor shift: parent ticket/flag lanes to MatchTimerRoot centerline and keep relative deltas; schema rebuild
// v0.335: HUD centerline rebuild: derive ticket/flag root X from top-center line and preserve B-slot-relative deltas; normalize bootstrap path to parent-only
// v0.334: Center-space HUD fix: unified ticket/flag layout to centered root-local coordinates (TopCenter roots), removed mixed absolute/root sizing in update path
// v0.333: HUD centering fix follow-up: ticket/flag roots now TopLeft under centered TopHudRoot canvas (static placement), schema rebuild
// v0.332: HUD centering fix: removed per-update root normalization, enforced TopCenter on ticket/flag roots, schema bump for one-time rebuild
// v0.331: HUD centering pass: static TopCenter anchors for tickets/flags roots and engage root; removed per-update alignment path
// v0.330: HUD centering hardening: live-name-first widget rebinding, centered root normalization for tickets/flags/engage, stale-cache mitigation
// v0.317: HUD projection finalization: removed temporary absolute-layout toggle branches and normalized TopHudRoot parent/anchor/size each ensure pass to prevent stale-root drift across aspect-ratio/layout iterations
// v0.316: HUD centering correction: restored authoritative absolute layout path and added runtime root-width X compensation offset for conquest combat HUD projection (keeps existing Y geometry/tuning unchanged)
// v0.315: HUD centering fallback: disabled absolute UIRoot projection for conquest combat HUD so tickets/flags/popout/engage remain in native TopCenter root-local layout for better non-16:9 alignment
// v0.314: HUD alignment hardening: parent conquest tickets/flags lanes and bleed-chevron overlays to centered TopHudRoot so top combat HUD stays centered across non-16:9 aspect ratios (Y geometry unchanged)
// v0.313: HUD layout: global +10 Y shift for non-clock HUD groups (tickets/flags/help/ready/upper-left/admin), while match clock position remains unchanged
// v0.312: HUD layout scaling: objective-count-driven outward ticket spacing, flag row centered in middle lane at ticket-bar centerline, and upward stack shift for percent/popout/engage
// v0.295: HUD polish: synchronize popout+engage force-hide timing, shift engage status text up 1px, and tint active top-row muted slot dark blue/red by owner (neutral stays gray)
// v0.294: Bleed differential authority correction: reverted to capture-state owner counts and added pre-event neutralization/recapture edge inference in authoritative owner resolver for missed callback windows
// v0.293: Bleed differential transition fix: ownership counts now use visual-authoritative owner state first (capture fallback) to prevent neutralization/recapture stale chevron/bleed windows
// v0.292: Phase3 HUD polish: add per-player projection snapshots (engaged/popout/engage/top-slot neutralization) and transition counters for swap/render regression triage
// v0.291: HUD polish: force-hide popout/engage now uses name-fallback rebind; top-row cleanup path no longer cache-only
// v0.290: HUD polish: top-row slot cache-rebind hardening and force-hide border suppression to prevent active-lane border persistence
// v0.278: CQ_Bug_3 count-source fix: removed deployed-state filter from `GetPlayersOnPoint` counting so first post-swap engage visibility is not suppressed by transient deployed-map desync
// v0.277: CQ_Bug_3 ordering fix: removed deploy-time engage bind clear and enter-time deployed guard so capture-point enter binds survive swap/deploy event ordering and first post-swap neutralization can render
// v0.276: CQ_Bug_3 first-entry fix: capture-point enter no longer ignores binds during swap-pending window, so first valid post-swap objective entry remains bound and renders once swap gate clears
// v0.275: CQ_Bug_3 first-entry follow-up: on-point soldier counting now resolves team from authoritative live player team (no mismatch-drop), preventing first post-swap engage suppression while capturing
// v0.274: CQ_Bug_3 ownership handoff: engage panel now binds on `OnPlayerEnterCapturePoint`/`OnPlayerExitCapturePoint`; removed `GetPlayersOnPoint` engage binding to avoid stale post-swap panel activation
// v0.273: CQ_Bug_3 simplification pass: removed engage candidate/unsuppress swap-confirm state; engage panel authority is now capture sync `engagedObjIdByPid` + deployed + swap-pending gate only
// v0.272: CQ_Bug_3 capture-sample hardening: engage gate restored short swap suppression and capture sync now rejects team-mismatched `GetPlayersOnPoint` echoes before counting/binding (capture-point logic only; no area-trigger dependency)
// v0.271: CQ_Bug_3 deep pass: removed engage dependence on main-base area-trigger state and moved engage activation to capture-point-only stability filtering (consecutive sync samples after swap)
// v0.270: CQ_Bug_3 spawn-false-positive fix: engage is now gated off in main base (`inMainBaseByPid`) and swap-clear suppression was removed from engage render/bind paths to avoid first-valid-entry suppression after team swap
// v0.269: CQ_Bug_3 state-ownership fix: engage now uses sync-pass on-point snapshot as single source (removed render-time GetPlayersOnPoint re-sample), and swap suppression is applied at bind-time to avoid first-entry misses and swap echo flip-flops
// v0.268: CQ_Bug_3 deadlock fix: replaced swap engage off-point release dependency with deterministic short sync-tick suppression window so engage cannot remain permanently blocked after team swap
// v0.267: CQ_Bug_3/6 targeted fix: restored swap-clear off-point release gate in capture sync (suppress stale post-swap engage echoes) and added first-life bleed-chevron core recovery when bleed is active but chevron refs are unresolved
// v0.266: CQ_Bug_3 ownership refactor: engage visibility now uses one gate (deployed + not swap-pending + on-point active objective); removed main-base/swap-clear suppression path from engage bind sync
// v0.265: CQ_Bug_3/6 hardening: engage now base-gated with in-base binding suppression; deploy now forces immediate clean bleed-chevron projection pass for first-life visibility
// v0.264: CQ_Bug_3 authority simplification: engage is now hard-gated by deployed+out-of-main-base and in-base sync binding suppression, preventing swap-spawn stale neutralizing while allowing first legit post-swap capture
// v0.263: CQ_Bug_3 follow-up: swap engage suppression now blocks stale on-point echoes only during short swap-lock window, then releases immediately so first legitimate post-swap capture shows engage panel
// v0.262: CQ_Bug_3/6 authority pass: swap engage now releases only after sync observes deployed off-point sample; deploy seeds perspective team for first-life chevron/team HUD stability
// v0.261: CQ_Bug_3 root fix pass: removed mixed ownership of engage bindings by making `engagedObjIdByPid` sync-pass authoritative only (event capture ticks no longer bind per-player engage state)
// v0.260: removed temporary startup/main-loop fault wrappers from game-mode start path; retained compact ASCII changelog file and prior v0.258 engage rollback for minimal regression surface
// v0.259: startup resiliency hardening: wrapped mode-start initialization and main loop body with fault-isolation guards so single runtime throws cannot kill full script/UI lifecycle
// v0.258: hotfix rollback of v0.257 engage sample/ref-resolution changes after startup-load regression report; restored prior engage sampling/render paths for stability
// v0.257: CQ_Bug_3 stabilization pass: validate on-point samples against player authoritative team before engage bind, and name-first engage widget resolution
// v0.256: CQ_Bug_3 direct-state engage rule: engage visibility keys only off deployed + engagedObjIdByPid
// v0.255: CQ_Bug_3 simplification follow-up: removed engage swap-lock suppression from engage visibility path
// v0.254: CQ_Bug_3 simplification: removed latch-driven unsuppress dependency from engage view derivation
// v0.253: CQ_Bug_3 gate hardening: require authoritative off-point sample before swap-clear release
// v0.252: CQ_Bug_3 authority fix: moved swap-clear release ownership to live tick and blocked stale bind while clearing
// v0.251: CQ_Bug_3 fix: stop resetting unsuppress confirmation inside force-hide path
// v0.250: CQ_Bug_3/4 follow-up: removed deploy-time teardown from swap path and raised unsuppress confirmation to 2 ticks
// v0.249: CQ_Bug_3 stale-overlay hardening: deploy-after-swap authoritative destroy/rebuild for engage widget de-duplication
// v0.248: CQ_Bug_3 regression correction: removed conflicting swap-clear release path and unified lock behavior
// v0.247: CQ_Bug_3 gate stabilization: strict off-point release plus live-tick processing outside HUD-dirty gate
// v0.246: CQ_Bug_3/6 stale-handle hardening: name-based engage/chevron rebinding and suppression-path hide
// v0.245: CQ_Bug_3/6 follow-up: release on first valid on-point sample and add chevron clean-tick refresh
// v0.244: CQ_Bug_6 first-instance stabilization: chevron core-ref backfill and retry render queue
// v0.243: CQ_Bug_3 correction: require deployed off-point clear after swap before engage can show
// v0.242: CQ_Bug_3 refinement: release swap-clear on first valid sample (off-point or valid on-point)
// v0.241: UI polish: crown shadow vertical rebalance
// v0.240: CQ_Bug_3 hard gate: explicit swap-clear required state
// v0.239: CQ_Bug_3 first-entry polish: first valid on-point tick unsuppresses engage panel
// v0.238: UI polish: stronger top crown shadow silhouette
// v0.237: CQ_Bug_3/4/6 recovery: non-destructive swap projection + engage unsuppress confirmation gating
// v0.236: CQ_Bug_3 pass: deploy-after-swap authoritative teardown/rebuild and hidden-until-render strategy
// v0.235: UI polish: crown shadow +1 halo
// v0.234: UI polish: centered all-sides crown shadow halo
// v0.233: CQ_Bug_3/4/6 hardening: force-hide full V2 set on swap start; release via deploy callback
// v0.232: CQ_Bug_4 stabilization: hidden-root rebuild flow and one authoritative redraw after swap
// v0.231: UI polish: ticket leader crown drop-shadow layers
// v0.230: compile-safe CQ_Bug_3/4 + CQ_Bug_6 pass: cached swap refresh, engage clear before release, chevron restack
// v0.229: CQ_Bug_3/4 + CQ_Bug_6 pass: non-destructive swap refresh, root-last reveal, per-render chevron restack
// v0.228: CQ_Bug_1/2/3/4 hardening: swap gate before ensure/build, pending bind block, neutral fill clamp

// Changelog discipline (required):
// - On every `npm run bumpVersion`, append one concise entry here before testing handoff.
// - Keep newest-first ordering and include bug IDs when applicable.
// - Keep this file compact; deep historical notes belong in design docs, not runtime script.

//#endregion ----------------- Changelog / History --------------------

