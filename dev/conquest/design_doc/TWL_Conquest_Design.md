# TWL Conquest Design and Implementation Plan

Last updated: 2026-04-27 (v1.406)
Audience: Implementers and maintainers working in `bf6-portal/dev/conquest/src`

## Current Status

- This is the authoritative master design document for TWL Conquest.
- **Open critical issue (v1.406):** [`CQ_Bug_16Player_Playtest_JS_Memory_Limit` (#109)](./conquest_issues.md#cq_bug_16player_playtest_js_memory_limit-109) — 16-player MP playtest terminated by Mod Evaluator with `Mod has reached its js script memory usage limit`. Functionality is verified-good in low-player-count testing; failure is runtime heap capacity. Reclaim ladder maintained in [`conquest_optimization_analysis.md`](./conquest_optimization_analysis.md). Documentation-only branch in progress; no code changes yet.
- Accepted current implementation baseline (as of v1.406, 2026-04-27):
  - Phase 1: completed
  - Phase 2A: completed
  - Phase 2B: completed (remaining future validation deferred to Phase 10)
  - Phase 3A, 3B, 3C: completed
  - Phase 4, 4B: completed
  - Phase 5A–5G: completed. **The v1.258–v1.259 Vanilla spawner rewrite replaces the Phase 5 deploy-fulfillment / reservations / spawner-sequence modules with one persistent `VehicleSpawner` per slot, a serial `spawnMutex`, event-driven bind via `OnVehicleSpawned`, and `Clocks.CountDownClock` respawn.** All non-Vanilla deploy paths (legacy air-deploy, forward-deploy, HQ-forward, HQ-forward-air) were removed. Remaining polish tracked in Phase 10.
  - Phase 6 (design doc nomenclature): Boundary system completed (functional; remaining tuning in Phase 10).
  - Phase 6 (runtime feature nomenclature — opt-in HQ Deploy mode): completed v1.277–v1.289. `VEHICLE_DEPLOY_METHOD_HQ` selectable from the ready-dialog knob. Player-triggered per-slot spawns with seating via the `OnPlayerDeployed` BountyHunter pattern. On-foot live-terminal seating via undeploy→redeploy (Option C). See `CQ_Feat_Phase6_HQ_Deploy` in `conquest_issues.md` and `src/vehicles/hq-deploy.ts`. **Note:** this runtime-feature label overlaps with the design doc's canonical Phase 6 = Boundary; resolve any ambiguity by context.
  - **Forward Deploy (v1.328, reintroduction):** checkbox-gated sibling of HQ Deploy. Fresh-build against the single-persistent-spawner pattern; no code ported from pre-v1.259. Spawner relocates via `SetObjectTransform` pre-spawn, vehicle Teleports to ground sample post-seat (see **Post-Seat Vehicle Teleport Pattern** below). Volume sampling in `src/vehicles/forward-spawn-volume.ts`.
  - **Air Deploy (v1.329, reintroduction):** aircraft mirror of Forward Deploy. Volume sampling with jet/heli altitude split in `src/vehicles/air-spawn-volume.ts`. Yaw preserved via post-bind `mod.Teleport`; **jet pitch (rotPlane.X) is currently lost** — documented polish item. Sister-spawner plan deferred (v1.331 probe disproved spawner-relocate-at-altitude propagation).
  - **Phase 2a/2b Loadout Fix (v1.333/v1.334):** Forward Deploy and Air Deploy now defer the vehicle `mod.Teleport` until **after** `ForcePlayerToSeat` completes, mirroring HQ Deploy's vehicle-at-pad condition at `DeployPlayer` time. Validated for Forward Deploy at v1.333 playtest (user-confirmed). Air Deploy v1.334 playtest verification pending. See "Post-Seat Vehicle Teleport Pattern" note below the Phase 6 HQ Deploy section.
  - Phase 7: completed (pre-game countdown, staggered delay-line reveals at Y=-420/-380/-340/-300, 4th line for gadget-delay; victory dialog with ticket scoreboard/crown/result line; endMatch winner inference; remaining polish in Phase 10).
  - Phase 8: active — `src/interaction/spawn-selector.ts` + `PlayerSpawner` / `SpawnPlayerFromSpawnPoint` pattern confirmed per memory `project_phase8_spawn_pattern.md`. Authored-spawn + fallback chain work tracked under Phase 8.
  - Phase 9: Custom tab scoreboard + KPI tracking active in `src/kpi/` (kpi-state.ts, scoreboard-tab.ts) with team-equality friendly-fire guard (v1.212, CQ_Bug_56). Score formula CF-38 live.
- Current open Conquest bug status:
  - See `design_doc/conquest_issues.md` for the active issue list.
  - The 2026-04-18 pass marked CQ_Bug_49 / 52 / 53 / 54 / 55 / `ActiveSpawnSingletonMPRace` as **Obsolete (v1.259 rewrite)** — underlying code paths were deleted wholesale.
  - Newly added (v1.289 cycle): `CQ_Refactor_Vanilla_Vehicle_Spawner_Rewrite`, `CQ_Refactor_Vehicle_Destroy_Consolidation`, `CQ_Feat_Phase6_HQ_Deploy`, `CQ_Bug_Abrams_Substitution_Transport_Slot_Regression` (open), `CQ_Polish_Respawn_Redeploy_Timer_Audit` (open, deferred to polish).
  - Newly added (v1.290–v1.334 cycle): `CQ_Feat_Forward_Deploy_Reintroduction` (v1.328, resolved pending MP validation), `CQ_Feat_Air_Deploy_Reintroduction` (v1.329, resolved pending MP validation), `CQ_Bug_Air_Deploy_Jet_Position_Regression` (v1.331, resolved by v1.332 revert), `CQ_Bug_Loadout_Not_Respected` (Forward resolved at v1.333, Air resolved-pending-playtest at v1.334), `CQ_Polish_Jet_Pitch_On_Air_Deploy` (deferred polish), `CQ_Bug_RemoveEquipment_JS_Error` (likely resolved v1.341 precheck gate; pending MP confirm).
  - Newly added (v1.335–v1.375 cycle): boundary architecture stabilized via `CQ_Feat_Custom_GCZ_Restored` (v1.357), `CQ_Feat_Zone_Tracker_Refactor` (v1.360), `CQ_Feat_AreaTrigger_Enable` (v1.367), `CQ_Feat_Event_Driven_Seat_State` (v1.369), `CQ_Feat_Squad_Spawn_Zone_Inheritance` (v1.370). Tier 1+2 cleanup at v1.371–v1.372. Tier 3 audit (`CQ_Audit_Engine_Enable_Calls`, `CQ_Audit_CapturePoint_HotPath_State`) clean. Recent fixes: `CQ_Bug_Launcher_Ammo_Cap_Below_Designed` (#95, v1.373 — uniform 3-rocket cap + "FULL" at-cap label), `CQ_Bug_Launcher_Slot_Identification_Zero_Ammo` (#96, v1.373 — non-destructive +1-ammo probe), `CQ_Bug_GetVehicleFromPlayer_Boundary_ForwardDeploy` (#93, v1.374 — deleted dead cache seed), `CQ_Polish_SupplyBox_DisabledFocused_Indicator` (#97, v1.375 — cool blue-white border ring on disabled-focused tiles). Open: `CQ_Bug_PostSwap_Engage_HUD_FirstEntry` (#3, still reproducing), `CQ_Bug_GetInventoryAmmo_SupplyBox_OpenMenu` (#94, not recently observed — review pending), `CQ_Polish_Respawn_Redeploy_Timer_Audit` (#76, deferred polish).
- Active companion documents:
  - [`design_doc/conquest_optimization.md`](./conquest_optimization.md) — **reader's guide** for the optimization docs; start here
  - [`design_doc/conquest_optimization_state.md`](./conquest_optimization_state.md) — file map (lines, bytes, per-player multipliers, in-bundle status) + per-file function inventory + lifecycle map + naming economy
  - [`design_doc/conquest_optimization_analysis.md`](./conquest_optimization_analysis.md) — memory-focused reclaim ladder + reasoning (re-issued v1.406)
  - [`design_doc/conquest_issues.md`](./conquest_issues.md) — full issue body, history, investigation notes
  - [`design_doc/conquest_issues_summary.md`](./conquest_issues_summary.md) — at-a-glance numeric index of all issues
  - [`design_doc/universal_enums.md`](./universal_enums.md) — Portal API enum reference
- Archived planning documents under [`reference_design_documentation/archive/`](../reference_design_documentation/archive/) are historical reference only. If an archived document conflicts with this file, this file is authoritative.

## Table Of Contents

- [Phase 1: Foundation and Wiring](#phase-1)
- [Current Design Change List](#current-design-change-list)
- [Phase 2A: Capture Backbone + Tickets Core](#phase-2a)
- [Phase 2B: Spawn-Charge Matrix and Diagnostics](#phase-2b)
- [Phase 3A: Flag UI + Color Contract](#phase-3a)
- [Phase 3B: Polished UI Pass](#phase-3b)
- [Phase 3C: HUD Cleanup and Legacy Path Removal](#phase-3c)
- [Phase 4: Capture Sounds](#phase-4)
- [Phase 4B: Voice Over Exploration](#phase-4b)
- [Phase 5: Vehicle Systems (Timers, Queue, Repair)](#phase-5)
- [Phase 5A: Vehicle Spawner timers, game state, and logic](#phase-5a)
- [Phase 5B: Vehicle Spawner HUD / deploy-screen displays](#phase-5b)
- [Phase 5C: Vehicle queue / signup](#phase-5c)
- [Phase 5D: Spawn directly in vehicle](#phase-5d)
- [Phase 5E: Map config / vehicle spawn mapping](#phase-5e)
- [Phase 5F: 3D Bounded Spawn Volumes](#phase-5f)
- [Phase 5G: Polish / tune](#phase-5g)
- [Phase 6: Boundary System](#phase-6)
- [Phase 7: Pre & Post Match Events](#phase-7)
- [Phase 8: Spawn Behavior and Restrictions](#phase-8)
- [Phase 9: Custom Tab Scoreboard + KPI Tracking](#phase-9)
- [Phase 10: Iteration, Playtesting, and Polish](#phase-10)
- [Phase 11: Advanced Features](#phase-11)
- [Phase 12: AI/Bot Simulation and Spawn-Balance Validation](#phase-12)
- [Phase 13: Advanced Spawn Contract Integration](#phase-13)
- [Phase 14: Spawn Design Documentation and Contract Analysis](#phase-14)

## Purpose

This is the master design document for TWL Conquest.

Current workflow for this document:

1. Keep phase scope, architecture rules, and accepted implementation decisions centralized here.
2. Reconcile new human decisions and validated findings into this document before or during implementation.
3. Track unresolved gameplay/HUD defects in `design_doc/conquest_issues.md`.
4. Implement and validate work phase by phase.
5. Record closeout decisions, deferred risks, and carry-forward validation notes here.
6. Move superseded planning documents into archive once their still-true guidance is merged here.

## Current Design Change List

- Design Change:
  - If the game detects a production menu open state, such as:
    - gadget locker
    - ready dialog via world interactable
    - vehicle menu
  - then the triple-tap `E` detector should abandon spawning a separate interact event for that same player/input window.
  - Rationale:
    - avoid overlapping menu-open ownership
    - reduce accidental duplicate interaction paths
    - keep menu entry authority with the currently detected production UI owner
  - Status:
    - accepted design direction
    - implementation pending
- Design Change:
  - Add an explicit loading/warm gate for critical UI/menu families.
  - While that gate is active, the player should not be able to:
    - deploy
    - open production menus
    - bypass entry via alternate interaction paths
  - The gate must be fail-safe:
    - no permanent lockout
    - no indefinite loading if one warm step fails
    - deterministic release behavior for:
      - first join
      - late join
      - late join while match is already live
      - team swap / redeploy warm transitions
  - Rationale:
    - current playtest evidence shows players can still see and feel menu/UI creation during the first-use window
    - functionality and clean lifecycle ownership matter more than exposing interaction early while the system is still warming
  - Implementation direction:
    - extend the existing deploy-block / HUD-warm controller rather than introducing a second parallel loading system
    - define readiness as script-authoritative, not engine-authoritative:
      - global bootstrap ready
      - per-player critical UI families warm and cache-usable
    - critical release families currently include:
      - top HUD shell
      - combat HUD
      - vehicle HUD family
      - ready dialog hidden shell
      - gadget locker hidden shell
    - admin panel remains outside the release requirement because it is lowest-priority and intentionally allowed to stay lazy in worst-case timing
    - one idempotent release path must own:
      - hiding the loading overlay
      - re-enabling deploy / restoring normal interaction
      - clearing any temporary restrictions
      - preventing double-release bugs
  - success criteria must be explicit readiness flags and cache-usable checks, not a blind fixed delay
  - cache-usable hidden UI alone is not a sufficient release signal:
    - the player-visible reveal path must complete
    - the first deliberate menu-open paths must be primed/hot before release
  - deploy lock should be owned primarily by the deploy-availability controller; optional input restriction is only secondary polish for brief post-deploy settle windows
    - one fail-safe timeout path must always release the player even if one warm step misbehaves
    - fallback behavior should degrade gracefully:
      - release the player into gameplay when critical families are ready or timeout is reached
      - keep any still-cold non-critical menu path blocked until it finishes warming
    - all production menu entry points must consult the same loading-state contract:
      - ready dialog
      - gadget locker
      - live deploy menu
      - world-interactable menu paths
      - triple-tap `E`
    - prefer a lightweight persistent loading overlay over transient notification messages so the player sees one stable state instead of trickling menu construction
  - Status:
    - accepted design direction
    - partially implemented
    - active hardening in progress
  - Current hardening direction:
    - treat loading as an explicit per-player session
    - track more than `active/released`
    - minimum state to track:
      - loading session id / reason
      - overlay shown for current session
      - critical HUD reveal complete
      - production-menu hidden warm complete
      - post-deploy finalize active
      - ready-dialog hot-open ready
      - gadget-menu hot-open ready
      - released
    - release order must be:
      - hidden warm complete
      - visible reveal complete
      - deploy release
      - post-deploy finalize
      - then full interaction release
    - this is required because playtests have shown that:
      - a cache can be technically usable
      - while the player still sees popping / delayed first-open behavior
  - Current verified API position:
    - per-player controls:
      - `EnablePlayerDeploy(player, deployAllowed)`
      - `SetRedeployTime(player, redeployTime)`
      - `EnableAllInputRestrictions(player, restricted)`
    - global control:
      - `SetSpawnMode(spawnModes)`
    - current Conquest `src` does not call `SetSpawnMode(...)` / `AutoSpawn`
  - Current verified gap after latest playtests:
    - loading overlay timing is improving
    - but first-join deploy and movement are still not authoritatively blocked in practice
    - this means the remaining problem is not just UI warm ownership
    - it is now a first-join deploy/spawn gate correctness problem
  - Immediate next investigation order:
    - instrument the first-join deploy-release timeline
    - record every place deploy is re-enabled for the player
    - confirm whether `OnPlayerDeployed` can still arrive while the loading gate says unreleased
    - confirm whether the undeploy fallback is losing a race after deployment
  - Anti-drift implementation constraints:
    - first-join deploy authority must be proven before team-swap parity work resumes
    - the next pass should be instrumentation-first, not another speculative behavior change
    - do not reintroduce global spawn-mode changes unless measured evidence proves they are required
    - the first-join loading path should be implemented as a small, commented state machine with four clear ownership functions:
      - `beginJoinLoadingGate(...)`
      - `holdPlayerAtDeploy(...)`
      - `handlePlayerDeployedBeforeRelease(...)`
      - `releaseJoinLoadingGate(...)`
    - first join must remain a single-stage pre-deploy gate
    - first join should prefer a single-stage pre-deploy gate, but if the real first-open cost still only exists after spawn then it may hand off into a short post-deploy finalize under full input restriction
    - generic HUD/menu warm helpers may contribute readiness signals, but they must not authorize join deploy release
    - only `releaseJoinLoadingGate(...)` may flip join deploy authorization to on
    - first join must also own a dedicated deploy-lock latch that is set at join start and cleared only by `releaseJoinLoadingGate(...)`
    - no non-join warm, refresh, undeploy, or finalize path may clear that join deploy-lock latch
    - the debugging trace for first-join must capture:
      - `OnPlayerJoinGame`
      - every deploy enable/disable transition
      - `OnPlayerDeployed`
      - `OnPlayerUndeploy`
      - input restriction on/off
      - forced undeploy attempts
    - the first-join contract is not considered proven until the trace shows:
      - deploy stays disabled until intended release
      - or, if deployment still occurs, the player is immediately frozen and recaptured
      - and no alternate path re-enables deploy early
    - latest confirmed interpretation after `v0.989`:
      - the BF6 deploy APIs are working
      - the remaining leak is script-side early join release ownership
      - fix the release owner, not the API choice
    - latest confirmed interpretation after `v0.993`:
      - undeploy-driven generic refresh warm was still able to preempt the first-join session
      - the next hardened implementation must therefore separate:
        - join deploy-lock ownership
        - generic warm/reveal readiness
    - latest confirmed redesign rule after the `v1.005-v1.008` rollback:
      - loading-overlay lifecycle must have exactly one show owner and one hide owner per session
      - no wait loop, undeploy hook, or recapture helper may call the same overlay show path again once the session is active
      - deploy authority and overlay visibility are related, but they are not the same state and must not share the same helper by default
      - team swap should not be re-added by incrementally extending the failed staged-release attempt; it needs a fresh design pass from the earlier baseline
    - Known polish items after `v1.013` pre-Phase 7 cleanup pass:
      - `CQ_Bug_32`: ready dialog flickers briefly during warm prime on first join
        - root cause: `UI_LOAD_TRACE_ENABLED` gating removed trace overhead that acted as an inadvertent timing buffer between overlay show and warm prime start
        - `v1.013` partially fixes by reasserting overlay + yielding one frame before prime, but flicker not fully eliminated
        - full fix options: build dialog children with `visible: false` during prime, move prime to earlier lifecycle phase, or enforce z-depth ordering overlay > dialog during prime
      - `CQ_Bug_33`: loading overlay briefly disappears during team swap
        - likely same timing root cause as CQ_Bug_32
        - both are deferred polish, not blocking Phase 7

## Notes Before Implementation Phases

These sections define architecture constraints, divergence decisions, and implementation notes used by all phases.

## Architectural Constraints (Locked)

- Entire project is conquest; do not create a separate `src/conquest/` root.
- Use existing domains: `src/config`, `src/state`, `src/hud`, `src/vehicles`, `src/index`, `src/interaction`.
- `State` remains authoritative for gameplay-critical data.
- Conquest tickets are authoritative in `State`; any engine score mirroring is one-way projection only.
- All runtime API calls/events must be validated against available Portal/modlib surfaces before implementation.
- Advanced spawn-contract logic from `spawn_system_contract.md` is explicitly deferred until all current phases are complete and stable.
- Event-driven first, low-frequency loops second.
- Keep hot paths minimal (`OngoingPlayer` must remain lightweight).
- ObjIds and map-specific wiring belong in config, not scattered in runtime logic.
- Readability requirement: every newly added function must include a concise header comment describing purpose and critical maintenance constraints/side effects.

## UI/Color Contract (Locked)

- Friendly is always left + blue.
- Enemy is always right + red.
- This is an explicit vanilla-BF6 alignment choice and must be preserved across all conquest UI.

## Feature Inventory

- Capture backbone + ticket/bleed/end-state model
- Accepted Phase 3 HUD/UI baseline:
  - top-HUD shell
  - core combat HUD
  - ready dialog
  - victory dialog
  - clock/status/branding/admin surfaces
- Capture sound layer
- Vehicle systems:
  - respawn timers
  - queue behavior
  - repair runways/pads
- Boundary system
- Post-match ticket/result screen
- Spawn behavior and restrictions
- Custom tab scoreboard with soldier-level KPIs:
  - kills, deaths, assists, flag captures, score, KDR
- Advanced features phase:
  - spawn aircraft in air
  - spawn vehicles by user chosen orientation
- Future feature phases (not V1 core):
  - AI/Bot simulation layer for performance measurement and spawn-point balance validation
  - Advanced spawn contract system (node-based safety/LOS/heatmap/cooldown logic), only after all current phases are implemented

## Deferred Spawn Contract (Post-Core Only)

Source:

- `bf6-portal/dev/conquest/reference_design_documentation/archive/spawn_system_contract.md`

Status:

- Contract is accepted as future direction.
- Implementation is explicitly deferred to a final follow-on phase (after Phases 1-12).
- Phase 6 is now boundary-only, and Phase 8 remains the basic authored spawn-behavior phase with low overhead.

Contract summary (future implementation target):

- Data model:
  - `Flag` with `nodes[]` and `safeSpawns[]`
  - `Node` with `spawnPoints[]`, bounds/centroid, cooldown/death history
  - `SpawnPoint` as atomic spawn transform
- Runtime levers:
  - flag contested/friendly presence checks
  - node enemy-proximity checks
  - node LOS rejection
  - node cooldown
  - node death heatmap risk
  - safe-spawn fallback path
- Selection methods:
  - best-score
  - weighted-random
  - top-K weighted-random

## Reference Git Sources

- BillDukes Conquest reference:
  - Repo: `https://github.com/muwookie/BillDukes`
  - Local snapshot: `bf6-portal/dev/conquest/reference_implementations/reference_BillDukes/reference_BillDukes` @ `da322747e5758de3d61be30ae51fa80f2a22746f`
- dfk_7677 ConquestSmall reference:
  - Repo: `https://github.com/dfk7677/CQS_comp.git`
  - Local snapshot: `bf6-portal/dev/conquest/reference_implementations/reference_dfk_7677/CQS_comp` @ `444878a24b21fe5b950c2489c57dcb0d68e5422d`

## File Placement Plan

Current rule:

- The live `src` layout is already established and is authoritative.
- This section preserves the original placement intent and domain boundaries without requiring the exact early-planning filenames to exist verbatim today.
- Continue extending existing domains only; do not create a separate `src/conquest/` root.

Original placement intent / domain anchors:

- `src/config/`
  - `conquest-constants.ts`
  - `conquest-map-types.ts`
  - `conquest-map-runtime.ts`
- `src/state/`
  - `conquest-state.ts`
  - `conquest-selectors.ts`
  - `conquest-kpi-state.ts`
- `src/hud/`
  - `flags-build.ts`
  - `flags-update.ts`
  - `conquest-color-policy.ts`
  - `scoreboard-tab-build.ts`
  - `scoreboard-tab-update.ts`
  - `postmatch-build.ts`
  - `postmatch-update.ts`
- `src/vehicles/`
  - `conquest-respawn-timers.ts`
- `src/index/`
  - capture/ticket routing
  - combat/KPI routing
  - post-match transition hooks
- `src/interaction/`
  - deploy/spawn-related conquest hooks where needed

## Baseline Evaluation

Current project structure is conquest-ready and already beyond initial scaffold status:

- authoritative state model in `src/state`
- map-driven config pattern in `src/config`
- per-player shell/HUD lifecycle split across `src/hud`, `src/ui/*`, `src/clock`, and `src/ready-dialog`
- vehicle lifecycle handlers in `src/vehicles`
- gameplay event routing points in `src/index`

Current implementation baseline:

- capture/ticket/bleed/end-condition flow is implemented
- accepted Phase 3 HUD architecture is live:
  - non-combat shell owner
  - core combat HUD owner
- Phase 4 capture SFX layer is implemented and accepted for single-player
- Phase 4B flag VO exploration is implemented and accepted for single-player with multiplayer validation deferred
- Phase 5A timer backbone is partially implemented:
  - authoritative per-slot respawn timer state exists
- Phase 5B Firestorm chopper deploy HUD first pass is implemented:
  - local-team deploy/live spawn timers
  - right-side deploy-screen display
  - current pilot / `IDLE` owner display on active rows
- Phase 5D Firestorm chopper direct deploy first pass is implemented:
  - `READY -> DEPLOY button -> direct seat`
- legacy combat runtime paths have been removed

Primary known implementation gap before the next phase:

- broader multi-class deploy-screen vehicle HUD beyond the current Firestorm chopper slice is still incomplete
- the original checkbox/queue `Phase 5C` concept has been superseded for the current chopper slice by a `READY`-only direct deploy button; broader queue/arbitration design remains unresolved for later vehicle classes
- direct spawn-into-vehicle is working for the current Firestorm tracked chopper slice, but is not yet widened to more vehicle classes
- map-wide vehicle spawn datapoint inventory and config coverage are still incomplete
- broader multiplayer/disconnect/reconnect hardening still remains a carry-forward validation task

## Explicit Divergences From Reference Projects

These are intentional architectural choices for TWL Conquest:

- No separate conquest root:
  - Keep conquest logic distributed across existing domains.
  - Why: this repository is already conquest-focused; split roots add overhead without benefit.
- Fixed vanilla UI perspective:
  - Friendly always left/blue, enemy always right/red.
  - Why: align with player expectation and reduce UI ambiguity.
- Config-first ObjId ownership:
  - ObjIds live in map/config schemas, not ad hoc gameplay handlers.
  - Why: map iteration and validation are safer and faster.
- Event-first + low-tick loops:
  - Use event routing for state changes; use coarse ticks only for projection/housekeeping.
  - Why: predictable script performance in Portal runtime.
- Simple spawn-first policy:
  - V1 uses authored spawn points and simple fallback rules.
  - Why: stabilize conquest core before introducing expensive spawn heuristics.

## Function-Level Implementation Sketch

These names are planning anchors for implementation/review.

- They are not a claim that the current source already uses these exact function names.
- They preserve intended subsystem seams and review vocabulary for future phase work.

### 1) Capture Backbone + Tickets

- `capture_InitFlagsFromMapConfig()`
- `capture_OnCapturePointTick(cp: mod.CapturePoint)`
- `capture_OnCapturePointCaptured(cp: mod.CapturePoint)`
- `tickets_ApplyBleedTick()`
- `tickets_ApplySpawnCost(player: mod.Player)`
- `tickets_ShouldChargeSpawn(player: mod.Player, reason: string)`
- `tickets_CheckEndCondition()`
- `tickets_BeginDeployTransaction(pid: number, reason: string)`
- `end_CheckAndEndMatch(authoritativeReason: string)`

### 2) Flag UI + Color Contract

- `flagsHud_BuildForPlayer(player: mod.Player)`
- `flagsHud_UpdateForPlayer(player: mod.Player)`
- `flagsHud_UpdateForAllPlayers()`
- `flagsHud_MarkDirtyForPlayer(pid: number)`
- `flagsHud_BuildRenderModel()`
- `flagsHud_RenderFromModelForPlayer(pid: number, model: unknown)`
- `hudConquest_ApplyColorPolicy()`

### 3) Custom Tab Scoreboard + KPI Tracking

- `kpi_InitPlayerStats(pid: number)`
- `kpi_OnKill(killerPid: number, victimPid: number)`
- `kpi_OnDeath(victimPid: number)`
- `kpi_OnAssist(pid: number)`
- `kpi_OnCapture(pid: number, flagObjId: number)`
- `kpi_RecalculateDerived(pid: number)`
- `scoreboardTab_BuildForPlayer(player: mod.Player)`
- `scoreboardTab_UpdateForPlayer(player: mod.Player)`
- `scoreboardTab_UpdateForAllPlayers()`

### 4) Capture Sound Layer

- `captureSound_QueueEvent(eventKey: string, flagObjId: number, teamId: number)`
- `captureSound_FlushQueue()`
- `captureSound_ShouldThrottle(key: string, cooldownSeconds: number)`

### 5) Vehicle Systems (Timers, Queue, Repair)

- `vehicleTimer_OnDestroyed(vehicleObjId: number, slotIndex: number)`
- `vehicleTimer_GetRemaining(slotIndex: number)`
- `vehicleTimer_UpdateHudForAllPlayers()`
- `vehicleQueue_RequestSpawn(player: mod.Player, slotIndex: number)`
- `vehicleQueue_ProcessNext(slotIndex: number)`
- `vehicleRepair_OnPadEnter(vehicle: mod.Vehicle, repairAreaObjId: number)`
- `vehicleRepair_OnPadExit(vehicle: mod.Vehicle, repairAreaObjId: number)`
- internal implementation split:
  - `5A`: timer/game-state/logic
  - `5B`: deploy-screen HUD/displays
  - `5C`: queue/signup
  - `5D`: direct spawn-into-vehicle
  - `5E`: map config / spawn mapping
  - `5F`: 3D bounded spawn volumes
  - `5G`: polish/tune, including later base repair

### 6) Boundary System

- Phase 8 now owns the authored/random spawn selection and fallback-chain helpers.
- `boundary_IsOutOfBounds(player: mod.Player, vehicle: mod.Vehicle | undefined)`
- `boundary_ApplyOutOfBoundsKill(player: mod.Player)`
- `spawnAdvanced_EvaluateNodeRisk(nodeId: number, teamId: number)` // reserved for post-core Phase 13

### 7) Map Configuration and Validation

- `conquestConfig_LoadForMap(mapKey: string)`
- `conquestConfig_ValidateMap(mapKey: string)`
- `conquestConfig_GetFlagConfigs(mapKey: string)`
- `conquestConfig_GetBoundaryConfigs(mapKey: string)`
- `conquestConfig_GetSpawnSets(mapKey: string)`
- `conquestConfig_GetWorldInteractables(mapKey: string)`
- `apiAudit_ValidatePhaseSurface(phaseId: number)`
- `conquestConfig_ValidateRuntimeObjectTypes(mapKey: string)`

## Performance and Tick Policy

Target cadence (initial):

- `0.25s`:
  - UI fallback checks only when dirty or stale beyond threshold
- `0.5s`:
  - sound queue flush
- `1.0s`:
  - capture/ticket cadence
  - scoreboard fallback refresh
  - vehicle timer refresh
  - post-match countdown
- `5.0s`:
  - lightweight validation diagnostics (debug mode)

Render/update strategy:

- event edges set dirty flags
- per-player render signatures block duplicate UI writes
- fallback loops run only when dirty or stale, not blindly on cadence
- build render model once per event/tick, then bind per player

Hard constraints:

- avoid hot-loop `AllPlayers x AllFlags` scans
- avoid repeated widget lookup in update paths
- cache frequently reused references/ids
- keep `OngoingPlayer` work minimal and projection-focused
- avoid `0.1s` or higher-frequency loops unless explicitly justified

Player-impact telemetry additions:

- UI staleness seconds (time since last successful conquest HUD update)
- capture churn per minute (ownership/progress transition rate)
- `UI updates/second` counts widget writes, not update passes

## Design Core Rules (CF Decisions)

### A) Core Rules

- `CF-69` Conquest lifecycle model: `NOT_READY -> PRE_MATCH -> LIVE_MATCH -> POST_MATCH -> RESET`.
- `CF-87` Lifecycle implementation directive: implement the 5-state lifecycle directly in authoritative state/enums; do not emulate with temporary flags-only shims.
- `PD-01` Lifecycle cutover decision: use immediate 5-state lifecycle cutover (no staged shadow lifecycle).
- `CF-70` Match-end authority: only `end_CheckAndEndMatch(...)` can call end-state transitions; all callers must guard with `if (state.matchEnded) return`.
- `CF-88` Admin/test controls must route through authoritative gameplay paths. Admin panel actions are request triggers only; they must not maintain separate end/start logic branches.
- `CF-97` Lifecycle authority proof gate: before Phase 2A signoff, document and verify that only conquest lifecycle paths can mutate live/end/reset state (legacy round authority removed or fully isolated).
- `CF-01` Starting tickets: `350`.
- `CF-02` Bleed formula: flag differential only; neutral flags excluded; initial rate `1 ticket * differential / 3 seconds` (constant-driven, implemented as `perDiffPerSecond = 1/3` with fractional carry).
- `CF-03` Bleed suspension: bleed requires positive differential only (no positive differential => no bleed).
- `CF-04` Infantry ticket loss: `1 ticket` on spawn-in (not death event), but not on the first spawn after round start.
- `CF-05` Vehicle ticket penalties: none.
- `CF-06` Capture/neutralization direct ticket deltas: none; only indirect via bleed.
- `CF-07` End priority: evaluate tickets first, then clock fallback. Draw only when both teams have tickets > 0 and clock reaches `00:00`.
- `CF-08` Overtime: not in scope now.
- `CF-117` Spawn-charge definition: `spawn-charge` means ticket deduction on a successful live-phase spawn/deploy into world (not on death event); default deduction is `-1` per qualifying spawn, first live spawn is exempt, and deductions must be transaction-guarded.
- `CF-43` Spawn-cost scope: apply spawn ticket loss to all qualifying spawn events except first live spawn; no stats/ticket tracking before round state is live.
- `CF-50` Spawn-cost safeguards:
  - charge all live-phase spawn/deploy reasons after first live spawn
  - includes normal deploy, forced redeploy, team switch deploy, admin move deploy, reconnect deploy, and phase-transition deploy
  - do not charge during non-live phases
  - maintain backend debug counters for ticket deductions by reason
- `CF-71` Spawn-charge transaction safety:
  - maintain per-player deploy transaction tracking (`deploySeq`, `lastChargedDeploySeq`, `lastChargeTimestamp`)
  - maintain duplicate-charge suspicion counter for diagnostics
- `CF-76` Spawn exemption reset policy: first-live-spawn exemption does not reset for reconnect/team swap/admin move; it resets only on new match/map.
- `CF-113` First-live-spawn exemption ownership: exemption is a round-start moment only; only players present at round start receive it. Reconnect/team-switch/admin-move/late join do not grant a new exemption.
- `CF-59` Spawn-cost reason matrix: same rule as `CF-50`; first live spawn is exempt, all subsequent live-phase deploy reasons charge `-1` ticket.
- `CF-60` End-condition race rule: ticket evaluation runs first; clock acts as fallback. When clock ends with both teams still above `0`, result can be draw.
- `CF-75` End-condition truth-table dual-zero rule: if both teams reach `0` tickets in the same evaluation window, result is draw.
- `CF-101` End-latch atomicity rule: all end paths must route through one global latch and one atomic snapshot freeze; no mutator may continue authoritative writes after latch. End evaluation order remains ticket-zero first, then time-zero fallback.
- `CF-61` Engine score mirroring cadence: mirror engine score on every ticket change.
- `CF-57` Ticket authority model: `State` is source of truth for conquest tickets; if engine score is mirrored, it must be write-only projection from state.
- `CF-90` Runtime state contract baseline (Phase 1 scaffold, constant-driven):
  - `tickets`: `{ team1: number; team2: number }`
  - `bleed`: `{ enabled: boolean; lastTickSeconds: number; perDiffPerSecond: number }`
  - `spawnCharge`: `{ firstLiveSpawnExemptByPid: Record<number, boolean>; deployTxnByPid: Record<number, { deploySeq: number; lastChargedDeploySeq: number; lastChargeAtSeconds: number; lastReason: string }> }`
  - `endRace`: `{ endLatched: boolean; endReason?: "tickets" | "clock" | "admin"; endSnapshot?: { team1Tickets: number; team2Tickets: number; elapsedSeconds: number } }`
  - `overtime`: `{ enabled: false }` for V1
- `CF-91` Spawn-charge rule consolidation: any live-phase deploy/spawn after the first live spawn for that player is chargeable (`-1` ticket), independent of trigger source.
- `CF-99` Spawn-charge identity policy (V1): use session-scoped identity only (`pid`). Reconnect is treated as a new player identity; continuity across reconnect is out of scope unless a future stable identity surface is validated.
- `CF-107` Stable identity decision for V1: use session-scoped player identity (`pid`) only; reconnect is treated as a new player identity.
  - API constraint note: no persistent account-level player identity is currently validated in `reference_bf6_core`; `mod.GetObjId(object)` remains the locked identity key for V1.
- `CF-108` No-stable-ID fallback policy (accepted): reconnecting players do not retain prior match stats/exemption continuity; exploit/fairness risk is accepted for V1 and monitored via spawn-charge diagnostics.
- `CF-109` Legacy lifecycle cutover rule: no legacy lifecycle mutator is sacred; any direct phase mutation outside the conquest lifecycle owner must be disabled or rerouted before Phase 2A signoff.
- `CF-110` Global end-latch contract:
  - owner function: `end_CheckAndEndMatch(...)`
  - freeze moment: first successful latch transition `endLatched = false -> true`
  - freeze payload: final tickets, elapsed time, winner/result reason, KPI aggregates snapshot
  - mutators that must stop after latch: ticket drain/bleed writes, spawn-charge deductions, KPI stat mutation, further match-end branch execution
  - allowed after latch: read-only UI projection from frozen snapshot

### B) Capture Mechanics

- `CF-09` Capture/neutralize times: engine-configured in V1 via capture-point timing APIs (`capture = 10s`, `neutralize = 15s`).
- `CF-10` Contested logic: team-count weighted behavior.
- `CF-11` Capture multipliers: constant-driven ladder (`1.15` to `2.0` cap); assault counts as 2 players via constant.
- `CF-12` Per-flag exceptions: supported via per-flag tuning constants; exception state must be visible in UI.
- `CF-51` Capture implementation mode (V1): mostly-engine capture ownership/progress/timing path; custom script logic applies to ticket model, KPI attribution, and UI projection only (avoid double-multiplier application).
- `CF-58` Capture multiplier enforcement detail: engine-only multiplier ownership in V1; script must not apply additional capture-speed multipliers.
- `CF-89` Phase 2A capture bring-up decision: remove current capture suppression and use engine ownership/progress from day one of Phase 2A; keep script-side logic limited to projection/accounting paths.
  - Phase 2A+ rule: capture-point ongoing handlers must not remain in suppressed/no-op mode.
- `CF-98` Capture API viability gate: before Phase 2A signoff, prove runtime access to engine capture owner/progress and stable mapping from runtime capture point to configured ObjId. If progress read is unavailable, operate owner-only consequences with explicit diagnostics and no synthetic progress math.
- `CF-105` Capture API surface lock (V1 baseline):
  - locked event paths: `OngoingCapturePoint`, `OnCapturePointCapturing`, `OnCapturePointCaptured`, `OnCapturePointLost`, `OnPlayerEnterCapturePoint`, `OnPlayerExitCapturePoint`
  - locked data reads: `mod.GetObjId(object)`, `mod.GetCaptureProgress(capturePoint)`, `mod.GetCurrentOwnerTeam(capturePoint)`, `mod.GetOwnerProgressTeam(capturePoint)`, `mod.GetPreviousOwnerTeam(capturePoint)`, `mod.GetPlayersOnPoint(capturePoint)`
  - data reads must be explicitly confirmed in `api_checklist.md` before behavior depends on them
  - fallback policy: if progress read is unavailable, do not invent script-side progress math; operate owner-only consequences and mark missing-read diagnostics
- `CF-106` Capture ObjId mapping contract:
  - mapping key: runtime object id from capture-point event object
  - config key: `capturePoints[].objId` in map schema
  - placeholder policy: placeholder ObjIds are allowed until human map validation provides replacements
  - failure behavior: safe no-op for ticket/KPI mutation on unmapped points plus explicit debug/admin warning
- `CF-102` Capture authority matrix (locked for V1):
  - owner: engine
  - progress: engine
  - contested state: engine
  - capture multipliers: engine
  - tickets/bleed consequences: script
  - KPI attribution and UI projection: script

### C) UI and Post-Match

- `CF-13` UI color contract: friendly left/blue, enemy right/red (all conquest widgets).
- `CF-14` V1 flag UI element scope: prefer engine-provided capability for V1; custom extensions deferred to V2+.
- `CF-15` Capture progress visibility: always visible in V1 (engine capabilities first).
- `CF-16` Post-match mandatory fields:
  - winner + final tickets
  - elapsed time
  - admin panel actions used
  - total kills/deaths/captures/assists
  - team averages from tab scoreboard columns
- `CF-52` Mode identity and string contract: conquest mode must use conquest-specific strings; round-based duel/life-limited messaging is forbidden in conquest UI text.
- `CF-66` Conquest string migration checklist: maintain a rolling checklist for conquest text groups; complete incrementally as systems are touched:
  - mode title/subtitle
  - mode rules/help text
  - ticket/capture explanatory text
  - end-screen labels (winner/tickets/elapsed/admin actions)
- `CF-93` String migration execution policy: keep as an iterative parallel track; no hard cutoff is required before Phase 2.
- `CF-104` Mode identity gate policy: string identity is not a Phase 2 blocker under current plan; prioritize cleanup as systems are touched/refactored.
- `CF-112` Conquest string pass/fail scope (current policy): no strict phase-entry gate; maintain an explicit rolling audit list of active legacy copy and clean it incrementally.
- `CF-116` String policy precedence decision: `CF-104` + `CF-112` non-blocking policy is authoritative. Conquest string cleanup is iterative and does not block phase entry/signoff.
- `CF-118` String edit authorization gate: any player-facing string change requires explicit human approval before edits are made. Without explicit approval, string changes must be deferred and presented as proposed diffs only.
- `CF-95` Post-match freeze point: freeze tickets/KPIs/team-averages at the first successful `end_CheckAndEndMatch(...)` latch (ticket-zero or clock-zero path), then render post-match from frozen snapshot only.

### D) Sound Behavior

- `CF-17` Required V1 capture sounds: capturing only; other sound events deferred to V2+.
- `CF-18` Sound throttle window: minimum `1.0s` cooldown per capture-sound event key (constant-driven default for 30Hz servers).
- `CF-19` Sound perspective: per-viewer team perspective always.

### E) Vehicle Timer/Spawner Policy

- `CF-20` Vehicle timer HUD scope: all vehicle timers in HUD, targeted for V2+.
- `CF-21` Vehicle respawn times: defined per map config.
- `CF-22` Disabled vehicle slots: hidden.
- `CF-96` Vehicle refactor timing policy: keep current vehicle spawner behavior as baseline through Phases 1-4; refactor to timer-contract structure in Phase 5 unless a blocker bug/perf issue requires earlier minimal intervention.
- `PD-02` V1 onboarding/vehicle scope decision: keep current onboarding UX for V1 and preserve existing vehicle spawn systems as baseline behavior.

### F) Basic Spawn Policy

- `CF-23` V1 spawn selection: random spawn point selection.
- `CF-24` Squad spawn logic: out of script scope (web config setting).
- `CF-25` Spawn restriction: neutral flag cannot be spawned until ownership acquired.
- `CF-72` Spawn fallback chain (when custom spawn selection path is active): `flagSpawnSet -> teamSpawnSet -> fallbackSpawnSet -> deny spawn with debug log`.
- `CF-86` Advanced spawn contract deferment rule:
  - node-based safety/LOS/cooldown/heatmap spawn selection is out of scope until final post-core phase
  - earlier phases may add only interface/config placeholders to preserve forward compatibility

### G) Map/Godot Data Readiness

- `CF-26` First map target: Firestorm first.
- `CF-27` Per-map data contract policy: placeholder-approved for implementation now; unresolved map fields must be explicitly marked for human replacement.
- `CF-92` Map schema migration policy: modify existing `MapConfig` in-place to conquest schema (no parallel long-lived map schema track).
- `PD-03` Map source-of-truth decision: local conquest map config is canonical for runtime ObjId/source mapping; external references inform authoring but do not override config.
- `PD-04` Map schema migration timing decision: migrate to conquest schema now (no deferred dual-track schema plan).
- `CF-48` Firestorm V1 minimum contract: placeholder-backed data contract is allowed for initial enablement, with explicit replacement markers for human follow-up.
- `CF-28` Required ObjId data groups:
  - capture points
  - HQ areas
  - soldier/ground vehicle boundaries
  - aircraft boundaries
  - sectors/objectives
  - world interactables (main base and point)
- `CF-29` Map readiness validation owner/process: human validation using provided Godot spatial data references.
- `CF-63` Spawn-schema readiness gate: `teamSpawnSets`, `flagSpawnSets`, and `fallbackSpawns` are optional before Phase 6 and mandatory at Phase 6 entry.
- `CF-73` Runtime map validation guardrails:
  - configured ObjIds must resolve at runtime
  - expected object types must match usage (capture point/trigger/spawner)
  - spawn sets must not contain duplicate ObjIds
  - when phase requires spawn sets, empty required sets emit warnings and force safe fallback behavior
- `CF-100` Capability-bounded validator rule: map validation must be restricted to checks proven observable in Portal runtime; unsupported type-introspection assumptions are forbidden.
- `CF-119` World-interactable schema ownership: `MapConfig.mainBaseInteractableObjIds[]` and `MapConfig.gadgetInteractableObjIds[]` are the canonical explicit per-map lists for retained world interactables; runtime must not infer interactables by scanning ranges alone.
- `CF-120` World-interactable ObjId allocation contract:
  - main-base interactables start at `1000` and are authored as even/odd pairs
  - even `objId` => ready dialog
  - odd `objId` => vehicle spawn menu
  - point interactables use explicit `1050-1099` objIds and all map to ammo resupply menu
  - parity/range rules are validator checks; the explicit map-config entry remains the source of truth
- `CF-121` Main-base terminal icon ownership contract:
  - authored main-base `WorldIcon` + `InteractPoint` pairs still define the retained terminal anchor/pairing by explicit objId
  - the visible main-base terminal icon is a per-player runtime `AddUIIcon(...)` attachment owned by script, not the shared authored `WorldIcon` image/text
  - runtime main-base terminal icons are shown only while that player is deployed inside their own HQ and on the team that owns the terminal
  - authored `InteractPoint`s remain shared objects; script gates actual activation by team/HQ state
  - point/ammo interactables may adopt a different icon-ownership model later if needed
- `CF-111` Validator capability matrix decision:
  - validator enforcement is warn-first / non-blocking in V1
  - classify each check as `runtime-observable` or `human/config`
  - only runtime-observable checks can emit authoritative runtime diagnostics
  - missing/unsupported checks must be logged explicitly as unresolved capability, not treated as pass
- `CF-80` Runtime map-validator strictness:
  - required-type mismatches or missing required sets emit explicit warnings and feature-level safe fallbacks; no full map hard-block in V1
  - optional placeholder fields are warning-only
- `CF-85` Map-validator failure behavior:
  - fail-safe behavior when validation fails:
    - emit clear admin/debug warning output with failing field(s)/ObjId(s)
    - degrade affected feature paths to safe behavior where possible
  - do not hard abort/end match automatically
- `CF-27` Initial placeholder contract (tunable in config constants/schemas):
  - `mapKey: string`
  - `capturePoints: Array<{ objId: number; label: string; order: number }>`
  - `hqAreas: { team1ObjIds: number[]; team2ObjIds: number[] }`
  - `boundaries: { soldierGroundObjId: number; aircraftObjId: number }`
  - `sectorsObjectives: Array<{ objectiveObjId: number; sectorId?: string }>` (placeholder entries allowed)
  - `vehicleSpawnerSlots: Array<{ slotId: number; spawnerObjId?: number; respawnSeconds?: number }>` (placeholder entries allowed)
  - `teamSpawnSets: { team1: number[]; team2: number[] }`
  - `flagSpawnSets: Array<{ flagObjId: number; team1SpawnObjIds: number[]; team2SpawnObjIds: number[] }>` (placeholder entries allowed)
  - `fallbackSpawns: { team1: number[]; team2: number[] }`
  - `spawnSafetyRadiusMeters?: number` (optional placeholder)
  - unresolved fields must include an explicit placeholder marker constant (example: `PLACEHOLDER_REQUIRED_REPLACEMENT`)

### H) Validation and Signoff

- `CF-30` Acceptance criteria baseline: human in-game feature validation per phase.
- `CF-31` Mandatory manual scenarios each phase:
  - join/leave
  - redeploy
  - team swap
  - map switch excluded (no map switch flow)
  - full match not mandatory each phase
- `CF-33` Rollback/hold policy: use git history/commits for rollback.
- `CF-42` Phase start gate rule: resolve all mapped clarification items before starting a phase, unless an item is explicitly marked as placeholder-approved.
- `CF-103` Phase 2 stop-the-line gate (narrowed): Phase 2 (`2A` + `2B`) cannot be signed off until blocker evidence exists for capture API viability, lifecycle authority isolation, spawn-charge transaction safety, end-latch atomicity, and capability-bounded validator scope.
- `CF-115` Gate timing policy: collect initial blocker evidence during Phase 1, but require full blocker closure at Phase 2 signoff.
- `CF-32` Performance telemetry policy:
  - track script metrics using rolling windows of `10s`, `30s`, and `3m`
  - initial metric set includes loop duration, event queue depth, capture-sound queue depth, updates-per-second, UI staleness seconds, and capture churn per minute
  - placeholder numeric thresholds are approved for implementation and must be constant-driven for tuning:
    - `PERF_LOOP_MS_AVG_MAX_10S = 1.5`
    - `PERF_LOOP_MS_AVG_MAX_30S = 1.0`
    - `PERF_LOOP_MS_AVG_MAX_3M = 0.75`
    - `PERF_EVENT_QUEUE_DEPTH_AVG_MAX_10S = 120`
    - `PERF_EVENT_QUEUE_DEPTH_AVG_MAX_30S = 80`
    - `PERF_EVENT_QUEUE_DEPTH_AVG_MAX_3M = 50`
    - `PERF_SOUND_QUEUE_DEPTH_AVG_MAX_10S = 8`
    - `PERF_SOUND_QUEUE_DEPTH_AVG_MAX_30S = 6`
    - `PERF_SOUND_QUEUE_DEPTH_AVG_MAX_3M = 4`
    - `PERF_UI_UPDATES_PER_SEC_AVG_MAX_10S = 25`
    - `PERF_UI_UPDATES_PER_SEC_AVG_MAX_30S = 18`
    - `PERF_UI_UPDATES_PER_SEC_AVG_MAX_3M = 12`
    - `PERF_UI_STALENESS_SEC_AVG_MAX_10S = 1.0`
    - `PERF_UI_STALENESS_SEC_AVG_MAX_30S = 0.75`
    - `PERF_UI_STALENESS_SEC_AVG_MAX_3M = 0.5`
    - `PERF_CAPTURE_CHURN_PER_MIN_AVG_MAX_10S = 30`
    - `PERF_CAPTURE_CHURN_PER_MIN_AVG_MAX_30S = 24`
    - `PERF_CAPTURE_CHURN_PER_MIN_AVG_MAX_3M = 18`
- `CF-53` API validity gate:
  - each phase must maintain an API surface checklist mapping required events/functions to known Portal/modlib API symbols
  - no pseudo/invented API calls are permitted
  - unknown calls must be replaced or removed before phase signoff
- `CF-62` API checklist ownership:
  - checklist location: `bf6-portal/dev/conquest/design_doc/api_checklist.md`
  - required artifact timing: `api_checklist.md` is mandatory by Phase 1 exit (minimum scaffold + initial statuses)
  - source split: `reference_bf6_core` is the API catalog/source-of-truth for available symbols; `api_checklist.md` is this project's proof ledger for required symbols and status (`Confirmed`/`Replaced`/`Deferred`)
  - Phase 1 artifact format requirements:
    - capture API proof log: `requirement -> verified symbol -> local reference path -> compile/runtime probe result -> fallback/replacement note`
    - lifecycle authority proof: `lifecycle mutator inventory -> owner function -> allowed callers -> guard/latch proof -> blocked legacy path proof`
    - validator capability matrix: `check id -> runtime-observable|human/config -> required symbol(s) -> supported/unverified -> runtime diagnostic behavior`
  - signoff: human owner plus one expert reviewer
- `CF-114` API checklist artifact decision: keep `api_checklist.md` as required project signoff evidence, not as a replacement for API catalog docs.
- `CF-94` API confirmation policy for KPI/capture attribution: unknown attribution APIs are placeholder-approved only until phase entry gates.
  - Required gate: before Phase 9 implementation/signoff, `api_checklist.md` must explicitly mark kill/death/assist/permanent-death/capture event paths as `Confirmed` or `Replaced`.
  - If an API path is not confirmed, related KPI behavior must be downgraded/disabled explicitly (no invented calls).
- `CF-54` UI update discipline:
  - conquest HUD/scoreboard updates are dirty/signature-driven
  - fallback cadence refresh is allowed only when dirty or stale
- `CF-74` Render telemetry semantics:
  - `UI updates/sec` measures widget write operations
  - model-build passes and no-op compares are not counted as writes
- `CF-67` Telemetry threshold action policy (placeholder-approved):
  - default V1 response is `log + debug HUD warning`
  - no automatic rollout block/degrade until tuned
- `CF-78` Performance soft-shedding policy:
  - allow one-step automatic soft shedding only in debug/stress mode (example: UI fallback interval increase)
- `CF-84` Soft-shedding scope (debug/stress mode only):
  - allowed:
    - flag HUD fallback interval
    - scoreboard fallback interval
    - progress bucket size
  - not allowed:
    - sound queue cadence (keep deterministic audio dispatch timing)
- `CF-81` Phase 2 execution policy: split internally into `Phase 2A` (capture/tickets/end-condition) and `Phase 2B` (spawn-charge matrix/diagnostics).

### I) Scope Control

- `CF-34` Forbidden pre-Phase-2 features: no additional forbidden list defined yet; use existing out-of-scope boundaries and add explicit exclusions if new risk appears.
- `CF-35` Blocker risks:
  - script crashes
  - bad performance
  - instability
  - other risks are negotiable by implementation context
- `CF-36` Requirement change approval:
  - human approves
  - LLM must request permission on requirement changes
  - this file is the master design source
- `CF-49` AI/Bot scope policy:
  - AI/Bots are explicitly out of scope for V1 implementation.
  - AI/Bots are a planned future phase for script performance measurement and spawn-balance validation.

### J) Custom Scoreboard Clarifications

- `CF-37` Scoreboard KPI columns (mandatory):
  - kills, deaths, assists, flag captures, score, KDR
- `CF-38` Score formula policy: placeholder constants are approved for implementation now; all weights must stay constant-driven:
  - `SCORE_KILL = 100`
  - `SCORE_ASSIST = 50`
  - `SCORE_FLAG_CAPTURE = 300`
  - `SCORE_REVIVE = 50`
  - `SCORE_DEATH_PENALTY = 0`
  - `score = kills*SCORE_KILL + assists*SCORE_ASSIST + captures*SCORE_FLAG_CAPTURE + revives*SCORE_REVIVE - deaths*SCORE_DEATH_PENALTY`
- `CF-68` Score-weight retune trigger:
  - retune required on first condition met:
    - after `3` live playtests, or
    - if average capture-score contribution exceeds `60%` of total average score, or
    - if average captures per player exceeds `3.0`
- `CF-39` KDR edge-case policy: floor to one decimal place; when deaths are `0`, use `0.1` if kills > 0, else `0`.
- `CF-79` KDR deaths-zero display policy: show `infinity/0` style display for deaths=`0`, while internal sort value remains numeric.
- `CF-83` KDR internal sort value for deaths=`0`: use `kills` as numeric sort value (example: `10 kills / 0 deaths => internal KDR sort value 10`).
- `CF-40` Scoreboard sorting policy: sort by score (desc), then KDR (desc), then assists (desc); match result ties are still allowed draws.
- `CF-41` Team-averages post-match scope: display average KDR, average flag captures, and average score.
- `CF-44` KPI reset boundaries: track only for a live match; reset only on map/match end or end-scoreboard transition.
- `CF-45` Capture KPI attribution: all eligible players on point receive capture credit.
  - commit event: `OnCapturePointCaptured`
  - attribution inputs: `OnPlayerEnterCapturePoint`/`OnPlayerExitCapturePoint` tracking plus `mod.GetPlayersOnPoint(capturePoint)` snapshot at commit
  - team validation at commit: `mod.GetOwnerProgressTeam(capturePoint)` and/or `mod.GetCurrentOwnerTeam(capturePoint)` must match capturing side
- `CF-46` Assist KPI authority: assist credit is finalized only when target dies permanently (no assist credit if target is revived and survives).
- `CF-64` Permanent death contract for assist finalization:
  - stage pending death on `OnPlayerDied`
  - cancel pending death on `OnRevived`
  - finalize assist only on `OnPlayerUndeploy` or `OnPlayerLeaveGame` while death is still pending
  - `OnMandown` is non-authoritative for final assist finalization
  - independent of ticket-charge timing
- `CF-65` Capture-credit anti-farm policy: no extra anti-farm threshold in V1; if player is in capture when it caps, credit is awarded.
- `CF-77` Capture-credit eligibility definition:
  - player must be alive
  - player must be on capturing team at cap tick
- `CF-82` Capture-credit vehicle-seat eligibility:
  - V1 policy: vehicle-seat occupants are eligible for capture credit if within capture radius at cap tick
  - player must still satisfy `CF-77` alive + capturing-team conditions
- `CF-47` Scoreboard/post-match formatting precision: `0.1` (tenths) precision for KDR and team-average displays.
- `PD-05` KPI scope gating decision: KPI scope finalization does not gate Phases 1-3A/3B; lock mandatory V1 KPI subset near Phase 9 entry when API confidence is higher.

## Implementation Phases

Phase rule:

- A phase can start only when all mapped clarification IDs are defined, or explicitly marked placeholder-approved by design policy.
- Each phase below includes a Codex execution checklist; treat checklist completion plus verification as the phase-ready signal.

<a id="phase-1"></a>
### Phase 1: Foundation and Wiring

Deliverables:

- conquest constants/state scaffolding in existing domains
- init/reset/runtime wiring
- lifecycle/end-authority guardrails scaffold
- API surface checklist scaffold (`phase -> required events/functions -> validation status`)
- conquest-mode string identity baseline (no round-based duel copy in conquest UI text)
- reserve spawn selector interface seam (no advanced logic yet)
- no gameplay behavior changes yet

Mapped clarifications:

- `CF-13`, `CF-26`, `CF-29`, `CF-30`, `CF-31`, `CF-33`, `CF-36`, `CF-52`, `CF-53`, `CF-54`, `CF-57`, `CF-62`, `CF-66`, `CF-69`, `CF-70`, `CF-74`, `CF-78`, `CF-97`, `CF-100`, `CF-103`, `CF-104`, `CF-109`, `CF-111`, `CF-112`, `CF-114`, `CF-115`, `CF-116`, `CF-118`, `PD-01`

Godot/map prerequisites:

- baseline map detection anchors

Verification:

- `npm run verify`
- startup smoke in-game with no regressions to existing HUD/clock/vehicle systems
- API checklist sanity pass (all planned calls known/supported or explicitly replaced)
- conquest string sanity pass (best-effort, non-blocking cleanup audit)
- string-authorization audit: each string edit has explicit human approval logged in implementation notes
- initial stop-the-line evidence capture:
  - capture API proof log
  - lifecycle authority proof
  - validator capability matrix
  - each artifact must follow `CF-62` required format and include local reference paths

Codex To-Do Checklist:

- [x] Create and populate `design_doc/api_checklist.md` baseline (`Confirmed`/`Replaced`/`Deferred` statuses).
- [x] Implement conquest scaffolding in existing domains (`config/state/index/hud/interaction`) without gameplay behavior changes.
- [x] Implement lifecycle owner guardrails and remove/reroute legacy direct lifecycle mutators (`CF-97`, `CF-109`).
- [x] Enforce `CF-118`: do not apply string edits without explicit human approval; log approval reference when string edits are authorized.
- [x] Produce Phase 1 evidence artifacts for capture API proof, lifecycle authority proof, and validator capability matrix.
- [x] Run verification list and record pass/fail notes for Phase 1 signoff.

Phase Changelog:

- `Log policy`: append-only; newest entry first.
- `Current status`: `completed`
- `Implementation entry format`: `YYYY-MM-DD | summary | files changed | verification`
- `Design modification entry format`: `YYYY-MM-DD | trigger | proposed change | impacted CF/PD/Phase | decision status | required doc updates`
- `Entries`:
  - `2026-03-01 | Phase 1 verification tracking | Moved Phase 1 evidence artifacts under design_doc for source control tracking and reverted temporary .gitignore changes | Phase 1 | in_progress | design_doc/phase1_verification_notes.md + .gitignore rollback`
  - `2026-03-01 | String-governance request | Added explicit human-approval gate for player-facing string edits | CF-118, Phase 1 | accepted | AGENTS policy + Phase 1 mapped clarifications/verification/checklist updated`
  - `2026-03-01 | Phase 1 kickoff | Added Phase 1 scaffolding + API/evidence artifacts baseline | Phase 1 | in_progress | api_checklist + capture/lifecycle/validator evidence docs`

<a id="phase-2a"></a>
### Phase 2A: Capture Backbone + Tickets Core

Deliverables:

- capture event routing
- ticket state + bleed + win condition
- temporary debug HUD for objective ownership/tickets during bring-up

Mapped clarifications:

- `CF-01` through `CF-12`, `CF-51`, `CF-57`, `CF-58`, `CF-60`, `CF-61`, `CF-75`, `CF-89`, `CF-98`, `CF-101`, `CF-102`, `CF-105`, `CF-106`, `CF-110`

Godot/map prerequisites:

- capture point ObjIds
- objective/sector wiring needed for capture ownership and differential

Verification:

- `npm run verify`
- differential bleed correctness tests
- ticket end-condition correctness tests
- score mirroring correctness checks per ticket change (if enabled)
- temporary debug HUD parity checks versus authoritative state
- capture authority matrix conformance checks (no script-owned capture speed/state math)
- simultaneous ticket-zero + clock-zero race checks with single-branch end latch assertion

Current Verification Limits (as of 2026-03-01):

- multiplayer validation pending (solo/local verification only so far)
- winner/draw outcome is latched in conquest state but not yet explicitly rendered in current victory UI, limiting direct visual result verification

Codex To-Do Checklist:

- [x] Validate and log required capture owner/progress symbols in `api_checklist.md` before implementation.
- [x] Wire capture routing from engine events to mapped ObjId config entries with explicit unmapped-point diagnostics.
- [x] Implement ticket/bleed/end-condition flow with `CF-101`/`CF-110` single-latch contract.
- [x] Add temporary debug HUD for ownership/progress/ticket parity against authoritative state.
- [x] Execute race-condition verification (ticket-zero vs clock-zero) and archive evidence for Phase 2 gate.

Phase Changelog:

- `Log policy`: append-only; newest entry first.
- `Current status`: `completed`
- `Implementation entry format`: `YYYY-MM-DD | summary | files changed | verification`
- `Design modification entry format`: `YYYY-MM-DD | trigger | proposed change | impacted CF/PD/Phase | decision status | required doc updates`
- `Entries`:
  - `2026-03-01 | Verification scope update after solo validation pass | Added explicit Phase 2A verification limits (no multiplayer pass yet; winner/draw not yet explicitly rendered in victory UI) | Phase 2A | accepted | No API/schema change; implementation follow-up tracked in later phases`
  - `2026-03-01 | Phase 2A kickoff implementation | Added capture tick routing, ticket bleed/end-latch flow, engine score mirroring, and temporary numeric debug HUD output | Phase 2A | in_progress | src/index/capture-tickets.ts + area-triggers/game-mode/conquest-flow wiring + HUD/cache updates`

<a id="phase-2b"></a>
### Phase 2B: Spawn-Charge Matrix and Diagnostics

Deliverables:

- spawn-charge reason matrix handling + deduction-reason debug counters
- spawn-charge transaction tracking/duplicate-charge diagnostics
- keep spawn diagnostics schema compatible with future node-level risk telemetry

Mapped clarifications:

- `CF-43`, `CF-50`, `CF-59`, `CF-71`, `CF-76`, `CF-91`, `CF-99`, `CF-101`, `CF-107`, `CF-108`, `CF-113`, `CF-117`

Godot/map prerequisites:

- none additional beyond Phase 2A

Verification:

- `npm run verify`
- redeploy/forced-redeploy/team-switch/admin-move/reconnect charge behavior checks
- duplicate-charge suspicion counter sanity checks
- spawn-charge invariant proof: one successful world spawn -> at most one ticket charge
- reconnect identity continuity checks (or explicit fallback-policy validation)

Codex To-Do Checklist:

- [x] Implement spawn-charge reason matrix and per-reason debug counters for all live-phase deploy paths.
- [x] Implement per-player deploy transaction tracking and duplicate-charge suspicion diagnostics.
- [x] Enforce `CF-113` exemption behavior (round-start only; no reconnect/team-switch/admin-move refresh).
- [x] Enforce session-scoped identity policy (`CF-99`, `CF-107`, `CF-108`) and document fairness tradeoff in diagnostics.
- [x] Run full redeploy/reconnect/admin-move matrix tests and attach invariant proof output.

Phase Changelog:

- `Log policy`: append-only; newest entry first.
- `Current status`: `completed`
- `Implementation entry format`: `YYYY-MM-DD | summary | files changed | verification`
- `Design modification entry format`: `YYYY-MM-DD | trigger | proposed change | impacted CF/PD/Phase | decision status | required doc updates`
- `Entries`:
  - `2026-03-01 | Phase 2B identity fallback hardening | Enforced session-scoped pid reset behavior and added reconnect fairness diagnostics counters to spawn-charge debug snapshots | CF-99, CF-107, CF-108, Phase 2B | accepted | src/state/spawn-charge.ts + src/state/runtime-types.ts + src/state/runtime-state.ts + src/index/conquest-scaffold.ts`
  - `2026-03-01 | Phase 2B kickoff implementation | Added live-phase spawn-charge reason matrix counters, per-player deploy transaction tracking, duplicate-charge suspicion diagnostics, round-start exemption seeding, and reconnect/session cleanup hooks | Phase 2B | in_progress | src/state/spawn-charge.ts + runtime type/state extensions + deploy/join/leave/team-switch/conquest-flow wiring`

<a id="phase-3a"></a>
### Phase 3A: Flag UI + Color Contract (Functional)

Deliverables:

- flag ownership/progress HUD
- enforced left-blue/right-red policy
- functional/readable baseline layout (polish deferred to Phase 3B)

Mapped clarifications:

- `CF-13`, `CF-14`, `CF-15`

Godot/map prerequisites:

- stable flag-to-ObjId mapping for display ordering

Verification:

- `npm run verify`
- HUD correctness under join/leave/redeploy/team swap scenarios

Codex To-Do Checklist:

- [x] Implement or update flag HUD build/update paths with event-first dirty rendering.
- [x] Enforce UI perspective contract everywhere (friendly left/blue, enemy right/red).
- [x] Bind display ordering to stable flag ObjId mapping from config.
- [x] Validate HUD behavior across join/leave/redeploy/team-swap transitions at the accepted current baseline, with broader multiplayer/disconnect validation carried forward under Phase 3 future-validation notes.

Phase Changelog:

- `Log policy`: append-only; newest entry first.
- `Current status`: `completed`
- `Implementation entry format`: `YYYY-MM-DD | summary | files changed | verification`
- `Design modification entry format`: `YYYY-MM-DD | trigger | proposed change | impacted CF/PD/Phase | decision status | required doc updates`
- `Entries`:
  - `2026-03-01 | Phase structure refinement request | Split prior Phase 3 into Phase 3A (functional baseline) and Phase 3B (polish pass: shapes/shading/animations) to isolate completion criteria and reduce UI churn risk | Phase 3A, Phase 3B | accepted | design_doc phase structure + checklists + changelogs updated`
  - `2026-03-01 | Phase 3A HUD tuning + recapture visibility follow-up | Increased conquest ticket/flag HUD size and moved block further down; adjusted friendly/enemy projection logic so contested recaptures visibly update during ownership transitions | Phase 3A, CF-13, CF-14, CF-15 | accepted | src/hud/build.ts + src/index/capture-tickets.ts`
  - `2026-03-01 | Phase 3A kickoff implementation | Added per-flag conquest HUD rows, event-first dirty rendering, per-viewer friendly-left/blue vs enemy-right/red mapping, and stable ObjId row ordering with join/deploy forced refresh hooks | Phase 3A, CF-13, CF-14, CF-15 | in_progress | src/hud/build.ts + src/index/capture-tickets.ts + src/state/hud-cache-types.ts + src/state/runtime-types.ts + src/state/runtime-state.ts + src/index/player-join-leave.ts + src/index/player-deploy.ts`

<a id="phase-3b"></a>
### Phase 3B: Polished UI Pass (Shapes, Shading, Animation)

Deliverables:

- polished conquest HUD visual treatment (shape/backplate pass for tickets + flag rows)
- shading/contrast pass for readability across varied scene lighting
- controlled animation pass for intro/state-change transitions (no perpetual loop spam)
- final overlap-safe alignment with clock/help/ready/victory HUD layers
- stabilized polish baseline that is safe to iterate during ongoing playtests

Implementation slices:

- `3B.1` Static visual polish baseline:
  - finalize ticket/flag container shapes, border styling, fill/alpha treatment, and readability contrast
  - finalize default placement/alignment contract against top HUD anchors
- `3B.2` Motion polish:
  - add bounded entry/update transitions for ticket/flag widgets (fade/slide or equivalent)
  - keep transitions event-driven and rate-limited (no continuous animation loops)
- `3B.3` Integration tune:
  - resolve overlap/depth collisions with clock/help/ready/victory widgets
  - verify readability across map lighting/background variance and adjust shading/layout constants

HUD lifecycle guardrails (sticking/overdraw prevention):

- Parent ownership rule: all conquest HUD children (tickets, bars, flags, borders, crowns) must be attached to conquest-owned roots only; do not parent conquest children directly to global `UIRoot`.
- Rebuild rule: if conquest roots are missing/invalid, clear conquest HUD cache and perform one controlled rebuild pass before normal updates continue.
- Update rule: steady-state update paths mutate existing conquest widgets only; widget creation is restricted to explicit build/rebuild paths.
- Team-switch redraw rule: team swap/join/leave must force one authoritative conquest HUD refresh from state, and must not schedule overlapping rebuild paths in the same window.
- State-authority rule: border/crown/ownership colors and visibility are recomputed from current authoritative conquest state every update; no persistent visual state may exist outside tracked script state.
- Verification rule: any UI move/tune change must include explicit team-switch regression checks for duplicate widgets, upper-left fallback draws, stale crown/border carryover, and color-order mismatches.

Out of scope in Phase 3B:

- scoreboard/KPI feature work (Phase 9)
- capture/ticket gameplay-rule changes
- sound, spawn, or vehicle system behavior changes
- new player-facing copy without explicit human string approval

Mapped clarifications:

- `CF-13`, `CF-14`, `CF-15`

Godot/map prerequisites:

- stable top-HUD anchor/depth layering with clock/help/ready/victory widgets
- per-map readability sanity for the final polished layout
- manual HUD anchor package from human tester:
  - provide target `position`/`anchor`/`depth` for `MatchTimerRoot`, help/ready banners, ticket root, and flag root
  - include one reference screenshot with intended final alignment

Verification:

- `npm run verify`
- visual overlap checks against clock/help/ready/victory in join/leave/redeploy/team-swap flows
- animation behavior checks (state-change cadence, no flicker/no jitter)
- readability checks (contrast/size) on bright and dark map regions
- UI update-rate sanity (no unnecessary refresh spam caused by polish effects)
- singleplayer iteration loop:
  - run one baseline pass, one motion pass, one integration pass, validating each independently before stacking changes

Current Verification Limits (as of 2026-03-01):

- multiplayer validation is still pending; current Phase 3B entry work is singleplayer-first
- polish decisions remain provisional until multiplayer visibility/readability checks are available

Acceptance criteria (Phase 3B functional completion):

- no persistent overlap with clock/help/ready/victory widgets during normal lifecycle transitions
- ticket/flag widgets remain readable under high-contrast and low-contrast scene backgrounds
- animation transitions are event-bounded, smooth, and do not introduce flicker/jitter spam
- polish changes do not regress Phase 3A data correctness (color contract, ordering, update behavior)

<a id="phase-3c"></a>
### Phase 3C: HUD Cleanup and Legacy Path Removal

Purpose:

- Convert the now-accepted Phase 3 combat HUD baseline into a cleanup/hardening pass that removes redundant combat render/build paths and collapses the system to one combat HUD owner.
- Preserve the accepted Phase 3 visual result while reducing maintenance cost, startup complexity, and regression risk from mixed ownership.

Status intent:

- Phase 3 baseline remains accepted.
- Phase 3C is a post-baseline cleanup track, not a redesign pass.
- Phase 3C should not reopen approved HUD look/positioning decisions except where cleanup exposes a correctness issue.

Objective:

- One combat HUD render path.
- One combat HUD build/repair owner.
- No legacy combat widget names or legacy combat render branches active in normal runtime.
- Non-combat surfaces remain separate and stable:
  - clock
  - top-left branding/status
  - top-center help/ready prompts
  - ready dialog
  - admin counter
  - victory dialog

Current code-state at closeout:

- Accepted combat HUD owner is `src/ui/conquest/hud-core/*` under `core` mode.
- Legacy combat runtime files have been removed from active source:
  - `src/ui/conquest/hud-build.ts`
  - `src/ui/conquest/popout-render.ts`
  - `src/ui/conquest/engage-render.ts`
  - `src/ui/conquest/lifecycle.ts`
- Dormant `combat-v2` implementation files and shim have been removed from active source:
  - `src/ui/conquest/combat-v2/*`
- Main combat HUD routing seam is now:
  - `src/index/capture-tickets.ts`
  - specifically `updateConquestCombatHudForAllPlayers(...)`
- Main non-combat shell ensure/build seam is now:
  - `src/ui/conquest/top-hud-shell.ts`
  - specifically `ensureTopHudShellForPlayer(...)`
- Non-combat shell refs are now cached under:
  - `State.hudCache.topHudShellByPid`

Pre-cleanup code-state assessment (historical planning snapshot):

- Accepted combat HUD owner is `src/ui/conquest/hud-core/*` under `core` mode.
- Legacy combat surface still exists in active source:
  - `src/ui/conquest/hud-build.ts`
  - `src/ui/conquest/popout-render.ts`
  - `src/ui/conquest/engage-render.ts`
  - `src/ui/conquest/lifecycle.ts`
- Old `combat-v2` implementation files still exist on disk even though the runtime imports only the compatibility shim:
  - `src/ui/conquest/combat-v2/*`
- Main mixed-owner routing seam still exists in:
  - `src/index/capture-tickets.ts`
  - specifically `updateConquestPhase2ADebugHudForAllPlayers(...)`
- Main mixed build/ensure seam still exists in:
  - `src/ui/conquest/hud-build.ts`
  - specifically `ensureHudForPlayer(...)`
- `HudRefs` still mixes:
  - non-combat shell widgets
  - legacy combat widgets
  - victory/help/admin references

Cleanup estimate (planning-level, not a commit estimate):

- low-risk dead-code cleanup:
  - approximately `2.2k` lines in `src/ui/conquest/combat-v2/*`
  - expected work: remove dead files/calls after confirming no remaining active runtime dependency beyond shim compatibility
- medium-risk active legacy combat cleanup:
  - approximately `4.0k` active lines across:
    - `src/ui/conquest/hud-build.ts`
    - `src/ui/conquest/popout-render.ts`
    - `src/ui/conquest/engage-render.ts`
    - `src/ui/conquest/lifecycle.ts`
  - expected work: bridge remaining required shell/UI ownership away from legacy combat builder, then delete combat-specific legacy branches
- highest-risk seam:
  - `src/index/capture-tickets.ts`
  - reason:
    - it still mixes authoritative conquest state updates with combat HUD routing
    - cleanup must preserve state refresh behavior while removing legacy combat branching

Non-negotiable cleanup target:

- Do not force all UI into one universal render path.
- The target is one combat HUD render path, not one render path for every modal or non-combat UI surface.
- Ready dialog, victory dialog, branding/status, and clock may keep independent ownership as long as ownership is explicit and non-overlapping.

Design principles carried into cleanup:

- Keep `hud-core` as the only combat HUD owner.
- Do not reintroduce legacy combat names or temporary migration names.
- Build/repair ownership and render ownership remain separate.
- Static non-combat shell UI must not depend on legacy combat builders for existence.
- Cleanup must reduce complexity; it must not create a new bridge layer that becomes permanent technical debt.

What must be bridged before old combat code can be removed:

- Extract non-combat shell building out of `ensureHudForPlayer(...)`.
- Split cache ownership so non-combat shell refs are not coupled to legacy combat refs.
- Move any still-needed top-center help/ready shell bootstrapping off the legacy combat builder.
- Preserve current top-left status, clock, victory, and admin behavior without requiring legacy combat graph existence.
- Preserve derived HUD/status refreshes that currently happen before the legacy/core branch split.

Planned end state:

- combat HUD:
  - single owner: `src/ui/conquest/hud-core/*`
  - single runtime mode path: `core`
- non-combat shell:
  - explicit shell ensure/build owner separate from combat HUD
- routing:
  - no `legacy` combat branch in normal runtime
  - no dormant `combat-v2` implementation files
- cache/state:
  - no mixed legacy combat refs inside the main shell cache type

Implementation slices:

- `3C.1` Runtime graph audit and shell extraction:
  - identify every caller that still uses `ensureHudForPlayer(...)`
  - create a dedicated non-combat top-HUD shell ensure/build path
  - move branding/status/help/admin/victory shell ownership there
- `3C.2` Cache and type separation:
  - split `HudRefs`/cache ownership into explicit non-combat shell refs versus combat-core refs
  - remove dependency on legacy combat refs for non-combat behavior
- `3C.3` Combat routing collapse:
  - split state refresh/derived-slice work from combat HUD render dispatch
  - remove legacy combat branch from `updateConquestPhase2ADebugHudForAllPlayers(...)`
  - leave `hud-core` as the only combat render path
- `3C.4` Legacy combat deletion:
  - remove legacy combat render/build/lifecycle files once no active callers remain
  - remove stale purge/hide compatibility paths that only existed to coexist with legacy combat widgets
- `3C.5` Dead-path deletion:
  - remove dormant `combat-v2` implementation files and shim callsites once confirmed unused
  - simplify HUD mode/config contract accordingly

Initial target files:

- highest-priority:
  - `src/index/capture-tickets.ts`
  - `src/ui/conquest/hud-build.ts`
  - `src/state/hud-cache-types.ts`
- likely cleanup/deletion targets:
  - `src/ui/conquest/popout-render.ts`
  - `src/ui/conquest/engage-render.ts`
  - `src/ui/conquest/lifecycle.ts`
  - `src/ui/conquest/combat-v2/*`
- likely consumers needing reroute:
  - `src/index/player-join-leave.ts`
  - `src/index/player-deploy.ts`
  - `src/index/game-mode.ts`
  - `src/interaction/actions.ts`
  - `src/hud/update-helpers.ts`

Risk assessment:

- highest risk:
  - deleting `ensureHudForPlayer(...)` behavior too early and breaking non-combat shell/widget creation
- high risk:
  - removing mixed routing in `capture-tickets.ts` without preserving required derived-slice/status refresh behavior
- medium risk:
  - cache/type split causing missed references during reconnect/deploy/team-swap
- low risk:
  - deletion of dormant `combat-v2` implementation files after callsite confirmation

Explicit anti-goals:

- no visual redesign of the accepted combat HUD
- no new hybrid migration path that becomes permanent
- no broad modal/UI architecture rewrite beyond what is needed to decouple non-combat shell ownership from legacy combat code
- no KPI/sound/spawn scope expansion during this cleanup track

Verification:

- `npm run verify`
- `cmd /c npx tsc --pretty false --noEmit`
- bundle-size verification
- lifecycle matrix for cleanup pass:
  - fresh boot to ready screen
  - ready dialog open/close
  - match start
  - live combat HUD idle
  - enter objective radius
  - leave objective radius
  - capture / neutralize / defend transitions
  - death -> redeploy
  - team swap
  - disconnect -> reconnect
  - game over / victory dialog
  - under-5-minute and under-1-minute clock behavior
  - admin action counter still updating
  - no startup delay / no UI trickle / no duplicate/stale widgets
- multiplayer-focused regression pass after cleanup:
  - two-player ready/live lifecycle
  - contested objective with both teams
  - team swap -> same-objective re-entry (`CQ_Bug_3` watch)
  - reconnect during live match

Acceptance criteria:

- only one combat HUD render/build path remains in normal runtime
- no legacy combat widget names are required for current gameplay HUD behavior
- non-combat shell widgets are bootstrapped without the legacy combat builder
- startup/swap/redeploy responsiveness is not worse than the accepted Phase 3 baseline
- no regression to approved Phase 3 visual output or lifecycle behavior
- code ownership is more obvious after cleanup, not less

Codex To-Do Checklist:

- [x] Map every active caller of `ensureHudForPlayer(...)` and classify whether it needs shell or combat ownership.
- [x] Introduce a dedicated non-combat shell ensure/build path before deleting legacy combat builders.
- [x] Split mixed HUD cache ownership so non-combat shell refs are independent of legacy combat refs.
- [x] Collapse `updateConquestPhase2ADebugHudForAllPlayers(...)` into explicit state-refresh plus core-combat render ownership.
- [x] Remove legacy combat render/build/lifecycle files once no active callers remain.
- [x] Remove dormant `combat-v2` implementation files/shims after final callsite cleanup.
- [x] Run the cleanup lifecycle matrix for the accepted current checkpoint and defer broader multiplayer-focused validation to the existing Phase 3 carry-forward validation block.

Phase 3C Closeout Decision (2026-03-12):

- Status: `completed`
- Acceptance basis:
  - non-combat shell ownership is extracted from the legacy combat builder
  - active combat runtime is reduced to shell + `hud-core` ownership only
  - legacy combat render/build/lifecycle files and dormant `combat-v2` files are removed
  - the accepted current HUD behavior remains functional after cleanup validation
  - bundle size headroom is materially restored after dead-path deletion
- Deferred known issue:
  - `CQ_Bug_3` remains open and is not resolved by Phase 3C cleanup
- Deferred validation note:
  - broader multiplayer-focused regression coverage remains carried forward under the existing Phase 3 future-validation section and does not block Phase 3C closeout
- Forward rule:
  - future HUD/UI work should continue from the shell + `hud-core` architecture only and must not reintroduce legacy combat ownership paths

Phase 3 Closeout Decision (2026-03-12):

- Status: `completed`
- Acceptance basis: current Phase 3 HUD architecture, player-specific perspective mapping, ticket/flag/popout/engage presentation, top-left status integration, team labels, drop-shadow parity baseline, and low-time clock alert behavior are accepted as the Phase 3 milestone baseline.
- Deferred known issue: `CQ_Bug_3` remains open and does not block Phase 3 closeout.
- Deferred bug summary: after a team swap, the first attempt to neutralize the same objective contested in the previous life can still fail to show Engage HUD; neutralizing a different objective works normally.
- Forward fix note: future work should treat team-switch lifecycle as an explicit engage-state cleanup boundary, alongside death/undeploy cleanup, before attempting another targeted fix for `CQ_Bug_3`.

Future Validation Still Required (carry-forward after Phase 3 closeout):

- Phase 3 is accepted as a milestone baseline, but additional multiplayer lifecycle validation is still required before treating the HUD/UI stack as fully hardened.
- Required future validation coverage:
  - true multiplayer sessions with 2+ live players, not just singleplayer/sandbox iteration
  - disconnect/reconnect while pre-live
  - disconnect/reconnect while live
  - death -> undeploy -> redeploy -> objective re-entry
  - team swap -> redeploy -> re-enter the same objective contested in the previous life (`CQ_Bug_3` repro focus)
  - long-running match validation for repeated ready/live/game-over transitions without duplicate/stale HUD state
- Known carry-forward note for `CQ_Bug_3`:
  - current repro suggests stale objective-specific engage state can survive across team-switch/death boundaries
  - future debug pass should instrument team-switch cleanup and objective-specific engage-state release, not just generic deploy timing

Phase 3 HUD/UI Reference Map (accepted baseline):

- Scope note:
  - this map documents the active accepted Phase 3 HUD/UI architecture only
  - shadow-layer widgets follow the same owner/render pass as their source text widgets and are omitted here unless behaviorally important
- Shared top-HUD ownership:
  - `TopHudRoot_{pid}`
  - Parent: global `UIRoot`
  - Purpose: single authoritative top-center ownership root for Phase 3 clock and combat HUD systems
  - Logic connection: ensured/normalized by `ensureTopHudRootForPid` in `src/hud/status.ts`; all core top-HUD builders must attach to this root before rendering
- Top-left branding lane:
  - `Upper_Left_Container_{pid}`
  - Parent: global `UIRoot`
  - Purpose: static branding backplate in the upper-left
  - Logic connection: built by `buildConquestBrandingTopLeftWidgets` in `src/ui/branding/top-left.ts`; no live game-state mutation beyond visibility/depth ownership
  - `Upper_Left_Text_{pid}`, `Upper_Left_Text_2_{pid}`
  - Parent: `Upper_Left_Container_{pid}`
  - Purpose: branding title/subtitle copy
  - Logic connection: static branded text; not tied to conquest runtime state
- Top-left status lane:
  - `TwlConquestStatusDockRoot_{pid}`
  - Parent: global `UIRoot`
  - Purpose: static blur/status backplate to the right of the branding lane
  - Logic connection: built by `buildConquestStaticStatusLaneWidgets` in `src/ui/branding/top-left.ts`
  - `TwlConquestStatusDockState_{pid}`
  - Parent: global `UIRoot` sibling aligned to the status dock by shared static coordinates
  - Purpose: line 1 state text (`NOT READY`, `YOU ARE READY`, or `{left}v{right} {gameMode}`)
  - Logic connection: driven by `getHudVisibilitySnapshotForPid` and the round/ready state update path in `src/hud/status.ts`
  - `TwlConquestStatusDockReady_{pid}`
  - Parent: global `UIRoot` sibling aligned to the status dock by shared static coordinates
  - Purpose: line 2 state text (`X / Y PLAYERS READY`, `LIVE`, `GAME OVER`)
  - Logic connection: driven by the same `src/hud/status.ts` state owner; visibility switches by pre-live/live/game-over state
- Clock lane:
  - `MatchTimerRoot_{pid}`
  - Parent: `TopHudRoot_{pid}`
  - Purpose: digit/colon container for the match timer
  - Logic connection: ensured by `ensureClockUIAndGetCache` in `src/clock/ui.ts`; updated by `updateAllPlayersClock` in `src/clock/state.ts` from authoritative round clock state
  - `MatchTimerSurface_{pid}`
  - Parent: `TopHudRoot_{pid}`
  - Purpose: explicit visible backplate behind the clock digits
  - Logic connection: normalized alongside `MatchTimerRoot_{pid}` so clock geometry stays deterministic
  - `MatchTimerMinTens_{pid}`, `MatchTimerMinOnes_{pid}`, `MatchTimerColon_{pid}`, `MatchTimerSecTens_{pid}`, `MatchTimerSecOnes_{pid}`
  - Parent: `MatchTimerRoot_{pid}`
  - Purpose: rendered `MM:SS` text digits
  - Logic connection: `updateAllPlayersClock` writes displayed digits, low-time color, and final-minute alert behavior directly from `State.round.clock`
- Core combat HUD root graph:
  - `TwlConquestHud_Root_{pid}`
  - Parent: `TopHudRoot_{pid}`
  - Purpose: player-specific hard-cut Phase 3 conquest HUD owner
  - Logic connection: built/repaired by `twlConquestHudEnsurePlayerGraph` in `src/ui/conquest/hud-core/build.ts`; hidden/destroyed/validated only through the core HUD lifecycle modules
  - `TwlConquestHud_CombatLane_{pid}`
  - Parent: `TwlConquestHud_Root_{pid}`
  - Purpose: one shared lane for tickets, objective row, popout, and engage strip
  - Logic connection: render target for the per-player snapshot produced in `src/ui/conquest/hud-core/render.ts`
  - `TwlConquestHud_TicketsLane_{pid}`
  - Parent: `TwlConquestHud_CombatLane_{pid}`
  - Purpose: ticket counters, bars, crowns, bleed chevrons, and ticket lead borders
  - Logic connection: live values come from the conquest HUD snapshot in `twlConquestHudBuildSnapshotForPlayer`; friendly/enemy perspective is player-specific
  - `TwlConquestHud_TicketBlueBox_{pid}`, `TwlConquestHud_TicketRedBox_{pid}`
  - Parent: `TwlConquestHud_TicketsLane_{pid}`
  - Purpose: ticket count backplates
  - Logic connection: count text and lead-border/crown visibility are driven from current ticket totals and lead state
  - `TwlConquestHud_TicketBlueCount_{pid}`, `TwlConquestHud_TicketRedCount_{pid}`
  - Parent: respective ticket box widget
  - Purpose: numeric friendly/enemy ticket totals
  - Logic connection: rendered from current authoritative ticket state
  - `TwlConquestHud_TicketBlueTeamName_{pid}`, `TwlConquestHud_TicketRedTeamName_{pid}`
  - Parent: `TwlConquestHud_Root_{pid}`
  - Purpose: friendly/enemy team names on the outer flanks of the ticket row
  - Logic connection: labels come from existing team-name lookup (`WEST/EAST`, `NORTH/SOUTH`, etc.) and resolve per player perspective
  - `TwlConquestHud_TicketBlueBarTrack_{pid}`, `TwlConquestHud_TicketBlueBarFill_{pid}`, `TwlConquestHud_TicketRedBarTrack_{pid}`, `TwlConquestHud_TicketRedBarFill_{pid}`
  - Parent: tracks under `TwlConquestHud_TicketsLane_{pid}`, fills under their respective track
  - Purpose: ticket ratio bars
  - Logic connection: fill widths update from live ticket totals in the core HUD snapshot/render pass
  - `TwlConquestHud_TicketLeadBorderLeft_{pid}`, `TwlConquestHud_TicketLeadBorderRight_{pid}`, crown widgets, and bleed chevron widgets
  - Parent: `TwlConquestHud_TicketsLane_{pid}`
  - Purpose: show current lead ownership and bleed pressure
  - Logic connection: recomputed every render from authoritative ticket/bleed state; no persistent visual carryover is allowed outside script state
- Objective row:
  - `TwlConquestHud_ObjectivesLane_{pid}`
  - Parent: `TwlConquestHud_CombatLane_{pid}`
  - Purpose: horizontal objective-slot row directly below the ticket bars
  - Logic connection: slot layout is static; slot content is driven from current mapped capture-point state
  - `TwlConquestHud_ObjectiveSlot_{pid}_{slot}`
  - Parent: `TwlConquestHud_ObjectivesLane_{pid}`
  - Purpose: slot backplate for one objective square
  - Logic connection: slot order is stable by mapped objective order, not by transient event order
  - `TwlConquestHud_ObjectiveBorder_{pid}_{slot}`, `TwlConquestHud_ObjectiveFill_{pid}_{slot}`, `TwlConquestHud_ObjectiveLabel_{pid}_{slot}`
  - Parent: `TwlConquestHud_ObjectiveSlot_{pid}_{slot}`
  - Purpose: border ownership color, vertical fill progress, and objective letter
  - Logic connection: color/percent/letter come from current capture-point owner, capture-progress team, and objective metadata in the core HUD snapshot
  - `TwlConquestHud_ObjectivePercent_{pid}_{slot}`
  - Parent: `TwlConquestHud_ObjectivesLane_{pid}`
  - Purpose: percent chip below each objective square
  - Logic connection: shown/hidden from the same objective snapshot; percent updates are player-perspective aware
- Objective popout:
  - `TwlConquestHud_PopoutRoot_{pid}`
  - Parent: `TwlConquestHud_ObjectivesLane_{pid}`
  - Purpose: expanded active-objective box that emerges when the player is inside an objective radius
  - Logic connection: active objective selection comes from the live conquest HUD snapshot and engage/objective tracking state
  - `TwlConquestHud_PopoutSlot_{pid}`, `TwlConquestHud_PopoutBorder_{pid}`, `TwlConquestHud_PopoutFill_{pid}`, `TwlConquestHud_PopoutLabel_{pid}`
  - Parent: popout root / popout slot
  - Purpose: active objective letter, border, fill, and surface treatment
  - Logic connection: mirrors the currently engaged objective state, not a separate gameplay system
  - `TwlConquestHud_PopoutPercent_{pid}`
  - Parent: `TwlConquestHud_PopoutRoot_{pid}`
  - Purpose: active objective percent chip
  - Logic connection: sourced from the same active objective capture progress; Phase 3 fixed the late-show behavior so `0%` can be shown immediately
- Engage HUD:
  - `TwlConquestHud_EngageRoot_{pid}`
  - Parent: `TwlConquestHud_ObjectivesLane_{pid}`
  - Purpose: active soldier-differential strip shown while contesting/neutralizing/defending an objective
  - Logic connection: rendered from the same active objective state machine used by the popout; engages are objective-authoritative, not area-trigger-authoritative
  - `TwlConquestHud_EngageTrack_{pid}`, `TwlConquestHud_EngageFriendlyFill_{pid}`, `TwlConquestHud_EngageEnemyFill_{pid}`
  - Parent: engage root / engage track
  - Purpose: center differential bar with friendly/enemy fill split
  - Logic connection: widths update from current on-point soldier counts
  - `TwlConquestHud_EngageFriendlyCount_{pid}`, `TwlConquestHud_EngageEnemyCount_{pid}`, `TwlConquestHud_EngageStatus_{pid}`
  - Parent: `TwlConquestHud_EngageRoot_{pid}`
  - Purpose: friendly count, enemy count, and action text (`CAPTURING`, `NEUTRALIZING`, `DEFEND`, etc.)
  - Logic connection: counts and action text come from live capture-point ownership/progress state plus alive/on-point soldier filtering
- Ready dialog:
  - `UI_READY_DIALOG_CONTAINER_BASE_{pid}`
  - Parent: global `UIRoot`
  - Purpose: full-screen ready/configuration dialog root
  - Logic connection: built/cached by `createReadyDialogUI` in `src/ready-dialog/dialog-build.ts`; shown from the interact path and reused from cache after first build
  - `UI_READY_DIALOG_BORDER_TOP_{pid}`, `UI_READY_DIALOG_BORDER_BOTTOM_{pid}`, `UI_READY_DIALOG_BORDER_LEFT_{pid}`, `UI_READY_DIALOG_BORDER_RIGHT_{pid}`
  - Parent: `UI_READY_DIALOG_CONTAINER_BASE_{pid}`
  - Purpose: modal border framing
  - Logic connection: purely structural; visibility follows dialog visibility
  - Header/map/mode-config/roster/admin section widgets under the ready dialog root
  - Parent: `UI_READY_DIALOG_CONTAINER_BASE_{pid}`
  - Purpose: expose match settings, ready state, rosters, and admin controls before match start
  - Logic connection: updates/write-backs go through ready dialog render/update helpers and UI event handlers; these mutate authoritative ready/config state rather than storing duplicate UI-local truth
- Admin audit counter:
  - `AdminPanelActionCount_{pid}`
  - Parent: global `UIRoot`
  - Purpose: top-right action counter for admin/debug visibility
  - Logic connection: built by `buildConquestAdminActionCounterWidget` in `src/ui/admin/action-counter.ts`; text updates reflect admin action activity, not combat HUD state
- Victory dialog:
  - `VictoryDialogRoot_{pid}`
  - Parent: global `UIRoot`
  - Purpose: end-of-match modal with branding, screenshot prompt, restart countdown, and total match time
  - Logic connection: built by `buildVictoryDialogWidgets` in `src/ui/dialog/victory-build.ts`; updated by `updateVictoryDialogForPlayer` from round-end countdown state inside the clock update path
- Legacy help/ready prompt lane still present:
  - `Container_HelpText_{pid}`, `HelpText_{pid}`
  - Parent: global `UIRoot`
  - Purpose: pre-live prompt/help flow outside the core combat HUD
  - Logic connection: visibility is still managed from `src/hud/status.ts`, but depth is forced below gameplay so it does not occlude the accepted Phase 3 combat HUD stack

Codex To-Do Checklist:

- [x] Manual input step (human): provide desired HUD anchor package (clock/help/ready/tickets/flags positions + depth expectations) for Phase 3B implementation.
- [x] Complete `3B.1` static visual baseline (shape/backplate + shading constants) and lock initial layout contract.
- [x] Complete `3B.2` motion hooks with bounded/event-driven transitions and refresh-rate guardrails.
- [x] Complete `3B.3` integration tune for depth/overlap/readability across lifecycle transitions.
- [x] Run Phase 3B singleplayer iteration loop (baseline -> motion -> integration) and record pass/fail notes.
- [x] Keep string-governance policy enforced; no player-facing string edits without explicit human approval.
- [x] Document and enforce HUD lifecycle guardrails to prevent team-switch sticking/overdraw artifacts.

Phase Changelog:

- `Log policy`: append-only; newest entry first.
- `Current status`: `completed`
- `Implementation entry format`: `YYYY-MM-DD | summary | files changed | verification`
- `Design modification entry format`: `YYYY-MM-DD | trigger | proposed change | impacted CF/PD/Phase | decision status | required doc updates`
- `Entries`:
  - `2026-03-12 | Phase 3C cleanup closeout decision | Accepted the shell plus hud-core-only cleanup state as complete, with legacy combat/combat-v2 files removed and broader multiplayer validation still carried forward under existing Phase 3 notes | Phase 3C, CQ_Bug_3 | accepted | design_doc Phase 3C checklist + closeout decision`
  - `2026-03-12 | Phase 3C cleanup planning pass | Added a post-baseline HUD cleanup phase focused on collapsing to one combat HUD owner, extracting non-combat shell ownership from legacy combat builders, and deleting redundant legacy/combat-v2 code paths with a dedicated regression matrix | Phase 3C, CQ_Bug_3 | accepted | design_doc Phase 3C section + checklist + risk/test plan`
  - `2026-03-12 | Phase 3 closeout follow-up documentation pass | Added carry-forward multiplayer/lifecycle validation note and a current accepted HUD/UI reference map covering root ownership, key widget families, and game-state owners | Phase 3A, Phase 3B, CQ_Bug_3 | accepted | design_doc future validation note + HUD/UI reference map`
  - `2026-03-12 | Phase 3 milestone closeout decision | Accepted current HUD architecture/polish baseline as Phase 3 complete, with CQ_Bug_3 explicitly deferred to a future focused bug-fix pass | Phase 3A, Phase 3B, CQ_Bug_3 | accepted | design_doc Phase 3 closeout note + issue tracker repro refinement`
  - `2026-03-02 | HUD persistence issue closure rule | Added explicit Phase 3B HUD lifecycle guardrails covering parent ownership, controlled rebuilds, team-switch authoritative refresh, and anti-overdraw verification checks | Phase 3B | accepted | design_doc/Phase 3B guardrail block + checklist updated`
  - `2026-03-01 | Phase 3B anchor-package application | Applied HUD anchor positions from ui_location_starter reference package: tickets flanking clock line and 7-slot horizontal capture-point clusters; retained existing data wiring and color contract | Phase 3B | in_progress | src/hud/build.ts`
  - `2026-03-01 | Phase 3B manual-input gate request | Added explicit human-provided HUD anchor/position package step before further Phase 3B polish movement and animation work | Phase 3B | accepted | design_doc/Phase 3B prerequisites + checklist updated`
  - `2026-03-01 | Phase 3B scope-definition pass | Expanded Phase 3B with implementation slices, out-of-scope boundaries, singleplayer-first verification limits, and explicit acceptance criteria for polish completion | Phase 3B | accepted | design_doc/Phase 3B section updated`

Pre-Phase 4 Source Audit (2026-03-12):

- Current runtime architecture baseline:
  - active non-combat shell ownership is now explicit in `src/ui/conquest/top-hud-shell.ts`
  - active combat HUD ownership is now explicit in `src/ui/conquest/hud-core/*`
  - clock, ready dialog, admin counter, and victory dialog remain separate owners by design
  - legacy combat runtime files and dormant `combat-v2` files have been removed from active source
- Verified current gaps before Phase 4:
  - there is no current Conquest sound/VO layer in active `src`; no active `mod.PlaySound(...)` or `mod.PlayVO(...)` calls exist in the mode
  - `GameState` currently has no dedicated `conquest.sound` state for queue entries, throttle keys, runtime handles, or diagnostics
  - authoritative capture producers currently live in:
    - `src/index/area-triggers.ts`
    - `src/index/capture-tickets.ts`
  - `src/index/capture-tickets.ts` remains the most coupled file in the mode and already owns capture-state sync, derived HUD slices, bleed/end checks, and combat HUD dispatch
  - active source still runs under widespread `@ts-nocheck`; this does not block Phase 4, but it raises the risk of silent shape drift if new sound state is spread across unrelated modules
  - the existing `modlib` unresolved-import warning in `src/foundation/modlib.ts` remains a known non-blocking build warning and should not be expanded by Phase 4
- Phase 4 design implications from current source state:
  - Phase 4 should add a dedicated capture-sound layer with its own small module boundary rather than growing `capture-tickets.ts` into a second HUD-sized monolith
  - sound queue/handle/throttle state should live under `State.conquest` as first-class mode state, not inside `hudCache`, and not only inside `debug` if gameplay-correct cleanup depends on it
  - producer hooks should attach to existing capture authority only; HUD visibility and ready-dialog/UI state must not become sound authority
  - flush/dispatch cadence must be independent from combat HUD render cadence
  - mandatory cleanup boundaries for Phase 4 are:
    - round reset
    - match end
    - player leave
    - undeploy
    - team swap
    - reconnect/rejoin
  - `CQ_Bug_3` is a direct warning that objective-specific stale state can survive swap/death windows; Phase 4 must resolve viewer perspective and recipients at flush time, not at enqueue time, and must not assume `engagedObjIdByPid` alone is sufficient authority for recipient correctness

Archived Document Carry-Forward Truths (validated against current source):

- From `UI_flow_new.md`, `UI_flow_new_v2.md`, and `phase3_hud_polish3_teardown.md`:
  - widget ownership must remain split between:
    - build/repair/destroy ownership
    - render/value-visibility ownership
  - static, dynamic, and animated widgets are separate classes with different placement rules
  - static widget placement belongs to build/rebuild only
  - dynamic/animated placement must have one obvious owner path and must not race multiple functions
  - caches are handle/performance helpers only; they are never placement truth owners
  - `safeFind(...)` is acceptable for bootstrap, recovery, and cleanup, but not as normal hot-path combat ownership authority
  - team-switch lifecycle remains `hide -> clean rebuild -> resume updates`
  - per-player widget naming and per-player cache/state isolation remain mandatory
- From `phase2_hud_architecture.md`, `phase3_hud_design.md`, `phase3_hud_polish.md`, and `phase3_hud_polish2.md`:
  - authoritative gameplay state, derived per-player projection, and widget mutation should remain separate responsibilities
  - render/UI paths should not mutate gameplay state or invent duplicate gameplay truth to mask lifecycle bugs
  - single-writer ownership by widget family remains the correct standard
  - feature work should treat `CQ_Bug_3` as a lifecycle/state-cleanup issue, not as justification to reopen the accepted shell + `hud-core` ownership model
- From `phase1_verification_notes.md`, `phase1_validator_capability_matrix.md`, and `phase1_lifecycle_authority_proof.md`:
  - implementation should keep validating API assumptions against local BF6 references and `design_doc/api_checklist.md` before committing to new runtime symbols
  - mode-truth mutators with gameplay consequences should stay behind explicit owner functions rather than spreading across caller modules
  - the Phase 1 docs are historical evidence artifacts, not active planning documents, but their proof style remains useful for future high-risk phases

Archive Decision (2026-03-12):

- Active design/planning sources of truth moving forward:
  - `design_doc/TWL_Conquest_Design.md`
  - `design_doc/api_checklist.md`
  - `design_doc/conquest_issues.md`
- Supporting evidence artifact retained in root:
  - `design_doc/phase1_capture_api_proof.md`
- The following documents are deprecated as active guidance and should be kept only as archived historical reference after this merge:
  - `design_doc/UI_flow_old.md`
  - `design_doc/UI_flow_new.md`
  - `design_doc/UI_flow_new_v2.md`
  - `design_doc/phase3_hud_polish3_teardown.md`
  - `design_doc/phase3_hud_polish2.md`
  - `design_doc/phase3_hud_polish.md`
  - `design_doc/phase3_hud_design.md`
  - `design_doc/phase2_hud_architecture.md`
  - `design_doc/phase1_verification_notes.md`
  - `design_doc/phase1_validator_capability_matrix.md`
  - `design_doc/phase1_lifecycle_authority_proof.md`
- Archive path:
  - `reference_design_documentation/archive/phase3_phase4_transition_2026-03-12/`
- Archive rule:
  - archived docs remain historical snapshots only
  - if an archived doc conflicts with this master design doc, the master design doc is authoritative

<a id="phase-4"></a>
### Phase 4: Capture Sounds

Deliverables:

- V1 capture sound event queue and dispatch
- reference-derived sound implementation model aligned to current Conquest architecture

Mapped clarifications:

- `CF-17`, `CF-18`, `CF-19`

Godot/map prerequisites:

- required sound event keys/assets

Reference implementation sound map:

- `reference_implementations/reference_BillDukes/reference_BillDukes/ConquestV10/modules/SoundsModule.ts`
  - pattern:
    - dedicated sound module with one-time runtime SFX/VO handle spawning
    - explicit notification entry points for capture-status, capture-tick, capture-complete, player-enter, and player-exit
    - team-targeted and player-targeted dispatch through `PlaySound`/`PlayVO`
    - objective-index local state for cooldowns and neutralize/tick guards
  - reusable ideas:
    - isolate audio ownership in one module
    - spawn/cached handles once, then reuse
    - separate event producers from dispatch helpers
    - target perspective at dispatch time, not asset-definition time
  - reject for current V1:
    - broader scope than `CF-17` (contested, neutralize, capture-complete, enter/exit, round VO)
    - per-objective sound state should plug into our own conquest state instead of a parallel registry
- `reference_implementations/reference_dfk_7677/CQS_comp/mods/ConquestSmall/ConquestSmall5_2.0.ts`
  - pattern:
    - direct sound/VO calls embedded in the monolithic match loop and capture-point handlers
    - pre-spawned loop/tick sounds plus explicit `PlaySound`/`StopSound` on point enter/exit and capture changes
    - global/team VO used for time warnings and match end
  - reusable ideas:
    - immediate on-point perspective routing is simple and readable
    - runtime-spawned sound handles are practical for Portal
  - reject for current V1:
    - loop/stop management tightly coupled to objective handlers
    - sound logic is mixed into UI/capture codepaths instead of being isolated
    - global timer/end-match VO is outside Phase 4 scope
- `reference_implementations/reference_BattleDad/Final (WIP)/domination template script.ts`
  - pattern:
    - sound handles are spawned once and reused
    - tick audio is emitted from progress-delta comparisons in the on-point update path
    - capture-complete sound is dispatched directly to the player
  - reusable ideas:
    - progress-delta gating is a valid way to suppress idle/no-change spam
    - friendly-vs-losing distinction is resolved from the viewer's team perspective
  - reject for current V1:
    - audio is coupled to the per-player UI update path
    - capture-complete/audio flash behaviors exceed current V1 requirement

Phase 4 implementation model (current Conquest):

- Ownership model:
  - keep Phase 4 as a new dedicated capture-sound layer, not mixed into HUD render code
  - event producers must live off the current conquest authority path only:
    - `ongoingCapturePointImpl` -> `conquestPhase2AOnCapturePointTick(...)`
    - `onCapturePointLostImpl` -> `conquestPhase2AOnCapturePointLost(...)`
    - `onCapturePointCapturedImpl` -> `conquestPhase2AOnCapturePointCaptured(...)`
  - player enter/exit capture-point events remain available, but Phase 4 V1 should not require persistent loop sounds or stop-sound cleanup
- V1 scope lock (`CF-17`):
  - V1 emits capturing sounds only
  - defer contested, neutralize, capture-complete, enter/exit, time-warning, and end-of-match VO/SFX to V2+
  - prefer SFX-only for V1 unless asset availability forces a different path
- Queue model:
  - producers enqueue lightweight events instead of calling `PlaySound` inline
  - queue payload should minimally carry:
    - `eventKey`
    - `objId`
    - `sourceTeamId`
    - `queuedAtSeconds`
  - queue dedupe key should be objective-aware and source-team-aware, not global-only
  - dispatch throttle should be recipient-local per player so one player's recent tick does not suppress a different player's valid tick
  - practical default shape:
    - queued event: `capture_tick:{objId}:{teamId}`
    - dispatch throttle: `capture_tick:{pid}:{objId}:{teamId}`
- Dispatch model:
  - flush queue on the existing Phase cadence (`0.5s` design target already defined above)
  - resolve recipients at flush time using current player/team truth so team swaps or redeploys do not play stale-perspective audio
  - dispatch per player with `mod.PlaySound(..., player)` rather than broadcasting global sound and hoping perspective lines up
  - locked rule: capture SFX are recipient-local per player; team perspective only selects the variant for that player and never changes dispatch scope into team-wide or global broadcast
- KPI interaction boundary:
  - do not solve KPI attribution in Phase 4
  - sound events are not authoritative KPI events and must not mutate KPI state directly
  - however, Phase 4 queue payloads and debug counters should preserve enough context to be useful later if Phase 9 wants to correlate capture audio with capture attribution or scoreboard debugging
  - minimum useful shared context to retain in sound diagnostics:
    - `objId`
    - `sourceTeamId`
    - event timestamp / flush timestamp
    - recipient count
    - suppression reason when throttled/dropped
  - if a future shared event envelope is introduced for capture/KPI/audio, conquest gameplay state remains the source of truth and sound remains a consumer, not a producer, of that truth
- State/input model:
  - authoritative inputs come from current conquest capture state and engine reads already used by Phase 2/3:
    - `mod.GetCurrentOwnerTeam(...)`
    - `mod.GetOwnerProgressTeam(...)`
    - `mod.GetCaptureProgress(...)`
    - `mod.GetPlayersOnPoint(...)`
    - `State.conquest.capture.byObjId`
    - `State.conquest.capture.engagedObjIdByPid`
  - do not create a second independent conquest-ownership model just for audio
- Asset/handle model:
  - spawn required runtime SFX handles once at mode start and cache them
  - reuse those handles for all later dispatches
  - if a required handle fails to spawn, degrade to silent no-op and record debug evidence rather than branching into ad-hoc alternative behavior
- Cadence and spam control:
  - capture-sound cadence should be deterministic and independent from HUD render cadence
  - use progress-delta or active-capture gating so unchanged idle points do not emit
  - obey `CF-18` minimum `1.0s` cooldown per event key
  - do not soft-shed sound queue cadence; this is already called out as protected in the performance policy
- Architecture decisions for current Conquest:
  - sound producers should attach to conquest state transitions, not UI transitions
  - audio must not depend on whether popout/engage HUD is currently visible
  - sound queue/throttle state should clear cleanly on round reset, match end, player leave, reconnect reset, team switch, and undeploy
  - team-switch lifecycle must explicitly clear per-player recipient-local audio throttle state before swap rebuild so pre-swap cadence cannot suppress valid post-swap ticks
  - undeploy/death/manual-redeploy lifecycle must explicitly clear per-player recipient-local audio throttle state so a fresh re-entry is not muted by the prior life
  - if Phase 9 later introduces shared capture-event instrumentation, Phase 4 should be able to plug into it without reworking its dispatch ownership
- Anti-patterns to avoid:
  - no direct `PlaySound`/`StopSound` loop management inside HUD/UI render paths
  - no monolithic all-purpose VO/sound block for unrelated round systems in Phase 4
  - no per-player permanent loop sound that requires exit-event correctness to stop
  - no global audio dispatch when the requirement is per-viewer team perspective
  - no KPI counters derived from audio dispatch success/failure

Implementation slices:

- `4.1` Sound backbone:
  - create the dedicated capture-sound state/queue/handle layer
  - initialize/reset cached sound handles and queue state with round lifecycle
- `4.2` V1 capture-tick producers:
  - derive candidate capture-tick events from current authoritative objective state only
  - emit only friendly/enemy capture perspective events required by `CF-17`
- `4.3` Deterministic dispatch + diagnostics:
  - flush queue on fixed cadence
  - apply throttle keys and perspective routing at flush
  - add counters/trace for queue depth, dispatch count, suppressed events, and recipient counts

Verification:

- `npm run verify`
- anti-spam validation under rapid objective transitions
- perspective validation after team swap/redeploy before queue flush
- long-match validation that sound queue resets cleanly across round transitions
- multiplayer contested-objective perspective validation remains deferred and is not a gate for leaving Phase 4

Codex To-Do Checklist:

- [x] Start Phase 4 on a dedicated capture-sound layer; keep it isolated from HUD render ownership.
- [x] Add dedicated `State.conquest.sound` ownership for queue/handle/throttle state; do not hide Phase 4 authority inside `hudCache` or HUD-only debug maps.
- [x] Implement capture sound queue with per-event throttle (`CF-18`) and deterministic flush cadence.
- [x] Restrict V1 sound scope to required capture events only.
- [x] Enforce per-viewer team perspective for emitted sound events.
- [x] Spawn/cache runtime SFX handles once and reuse them for all Phase 4 dispatches.
- [x] Route sound producers from current capture authority only; do not couple them to HUD visibility.
- [x] Keep `capture-tickets.ts` producer hooks narrow and move queue/dispatch logic into dedicated sound modules instead of expanding the existing capture monolith.
- [x] Keep sound diagnostics/event envelopes KPI-friendly without turning Phase 4 into KPI implementation.
- [x] Run rapid objective-transition spam tests and confirm throttle behavior.
- [x] Run team-swap/redeploy perspective tests to ensure no stale queued audio reaches the wrong team in single-player lifecycle testing.
- [x] Record debug counters/trace output demonstrating no audio flood regressions.

Phase 4 Closeout Decision:

- Phase 4 is accepted at the current checkpoint for single-player Conquest.
- Phase 4B multiplayer validation is now complete at the current accepted checkpoint.
- `CQ_Bug_16` remains deferred polish and does not block moving to Phase 5.

Phase Changelog:

- `Log policy`: append-only; newest entry first.
- `Current status`: `completed`
- `Implementation entry format`: `YYYY-MM-DD | summary | files changed | verification`
- `Design modification entry format`: `YYYY-MM-DD | trigger | proposed change | impacted CF/PD/Phase | decision status | required doc updates`
- `Entries`:
  - `2026-03-13 | Phase 4 closeout decision | Accepted Phase 4 for single-player based on current build/test passes, explicitly deferred contested multiplayer sound validation as non-blocking, and advanced the next implementation target to Phase 5 | Phase 4, Phase 4B, Phase 5, CF-17, CF-18, CF-19 | accepted | design_doc Phase 4 verification note + checklist closeout + current status summary`
  - `2026-03-12 | Pre-Phase 4 source audit and archival merge | Reviewed current src architecture before sound work, recorded actual Phase 4 gaps/risks (no active sound layer, no conquest.sound state, capture-tickets monolith pressure, CQ_Bug_3 perspective-cleanup warning), merged still-true HUD architecture principles from deprecated docs into the master plan, and marked the old planning/evidence docs for archive-only status | Phase 4, Phase 3A, Phase 3B, Phase 3C, CQ_Bug_3, CF-17, CF-18, CF-19 | accepted | design_doc Phase 4 preflight audit + archival carry-forward section + archive decision`
  - `2026-03-12 | Phase 4 KPI-boundary note | Added explicit rule that sound events may retain KPI-useful diagnostics/context but must not become KPI authority or mutate KPI state; expanded Phase 4 diagnostics expectations accordingly | Phase 4, Phase 9, CF-17, CF-18, CF-19 | accepted | design_doc Phase 4 KPI interaction boundary + checklist update`
  - `2026-03-12 | Phase 4 kickoff planning pass | Evaluated sound patterns from BillDukes, DFK ConquestSmall, and BattleDad references; locked a Conquest-specific Phase 4 model around a dedicated capture-sound layer, cached runtime SFX handles, objective-aware throttling, and per-viewer dispatch | Phase 4, CF-17, CF-18, CF-19 | accepted | design_doc Phase 4 implementation model + checklist update`

<a id="phase-4b"></a>
### Phase 4B: Voice Over Exploration (Optional / Experimental)

Objective:

- explore whether objective VO improves Conquest readability/feedback without committing the mode to ship VO yet
- keep this as an explicit exploration/test track, not an assumed production requirement
- preserve Phase 4 V1 as `SFX-only` unless explicit later approval changes that decision

Deliverables:

- validated Portal VO controller prototype for Conquest-style objective states
- documented recommendation on whether objective VO should ship, stay optional, or be rejected
- explicit anti-spam/debounce model if VO is retained

Mapped clarifications:

- `CF-17`, `CF-18`, `CF-19`

Godot/map prerequisites:

- verified VO module/runtime object path for Conquest
- confirmed desired flag-letter to VO-flag mapping for the maps we support

Confirmed API facts:

- `mod.PlayVO(...)` is a valid API surface and accepts:
  - `objectId/object`
  - `event: VoiceOverEvents2D`
  - `flag: VoiceOverFlags`
  - optional player/squad/team recipient targeting
- `VoiceOverFlags` confirmed by local BF6 core reference:
  - `Alpha`
  - `Bravo`
  - `Charlie`
  - `Delta`
  - `Echo`
  - `Foxtrot`
  - `Golf`
- objective-related `VoiceOverEvents2D` confirmed by local BF6 core reference:
  - `CheckPointEnemy`
  - `CheckPointEnemyAnother`
  - `CheckPointFriendly`
  - `CheckPointFriendlyAnother`
  - `CheckPointMovingToLastEnemy`
  - `CheckPointMovingToLastFriendly`
  - `ObjectiveCaptured`
  - `ObjectiveCapturedEnemy`
  - `ObjectiveCapturedEnemyGeneric`
  - `ObjectiveCapturedGeneric`
  - `ObjectiveCapturing`
  - `ObjectiveContested`
  - `ObjectiveLocated`
  - `ObjectiveLockdownEnemy`
  - `ObjectiveLockdownFriendly`
  - `ObjectiveLost`
  - `ObjectiveNeutralised`
  - `ObjectiveTerritoryLost`
  - `ObjectiveTerritoryLostGeneric`
  - `ObjectiveTerritoryTaken`
  - `ObjectiveTerritoryTakenGeneric`
  - `SectorTakenAttacker`
  - `SectorTakenDefender`
- a verified runtime-spawn candidate for VO dispatch exists:
  - `mod.RuntimeSpawn_Common.SFX_VOModule_OneShot2D`
- explicit correction:
  - this doc does not assume an unverified symbol like `mod.VO.Common`
  - any VO runtime object must be validated from actual SDK surface or project test before use

Best-fit Conquest VO model (inference, not SDK-guaranteed mapping):

- likely Conquest-style per-state mapping:
  - start capturing target flag -> `ObjectiveCapturing`
  - point becomes contested -> `ObjectiveContested`
  - point becomes neutral -> `ObjectiveNeutralised`
  - your team finishes the capture -> `ObjectiveCaptured` or `ObjectiveCapturedGeneric`
  - enemy takes your flag -> `ObjectiveLost` or `ObjectiveCapturedEnemy`
  - large territory/grouped-area logic -> `ObjectiveTerritoryTaken` / `ObjectiveTerritoryLost`
  - sector-oriented layers -> `SectorTakenAttacker` / `SectorTakenDefender`
- likely flag-letter mapping:
  - `A -> Alpha`
  - `B -> Bravo`
  - `C -> Charlie`
  - `D -> Delta`
  - `E -> Echo`
  - `F -> Foxtrot`
  - `G -> Golf`

Recommended state model for VO sync (inference, recommended design):

- use edge-driven state transitions, not continuous progress polling spam
- keep one last known VO state per objective:
  - `Idle`
  - `Capturing`
  - `Contested`
  - `Neutralised`
  - `Captured`
- keep one last announced owner per objective
- only emit VO when state or announced owner actually changes

Recommended anti-spam policy (inference, recommended design):

- fire `ObjectiveCapturing` once when a point transitions from idle/stable into active capture
- do not replay `ObjectiveCapturing` on every capture-progress tick
- fire `ObjectiveContested` once when the point enters contested
- do not replay `ObjectiveContested` until the point first leaves contested
- fire `ObjectiveNeutralised` once when ownership crosses into neutral
- fire terminal lines such as `ObjectiveCaptured`, `ObjectiveLost`, and `ObjectiveNeutralised` on their actual transition even if short debounce would otherwise suppress them
- safe debounce target for non-terminal VO on the same flag:
  - minimum `3` to `5` seconds between repeats on the same objective

Architecture notes:

- if explored, VO must stay on the same ownership discipline as Phase 4 SFX:
  - producers attach to authoritative capture state transitions only
  - recipient perspective resolves at dispatch time, not enqueue time
  - VO must not be tied to HUD visibility or popout state
- VO exploration should not widen Phase 4 V1 scope by default
- if VO proves noisy, unclear, or operationally brittle, reject it and keep Phase 4 production scope at `SFX-only`

Verification:

- `npm run verify`
- validate that the VO module/runtime object actually works in this Conquest project before broader design conclusions are drawn
- confirm objective-letter mapping reads correctly for supported flags/maps
- confirm edge-triggered VO does not replay continuously while progress rises
- confirm contested/neutralised/captured/lost transitions fire once per actual state edge
- run spam tests under rapid objective transitions and team swaps
- record single-player acceptance/rejection decision after initial playtesting
- run explicit multiplayer contested-objective and opposing-perspective verification before treating Phase 4B VO as fully shippable
- accepted current multiplayer checkpoint:
  - `ObjectiveContested` is working
  - `ObjectiveCaptured` is working
  - enemy terminal VO is currently reliable while the recipient remains on the objective
  - broader recent-leave enemy terminal grace is deferred as polish and does not block leaving Phase 4B

Compact MP QA Script (one session):

- Runtime constants to validate against current implementation:
  - live capture-state sample cadence: `0.12s`
  - VO flush cadence: `0.12s`
  - non-terminal VO debounce per player per objective: `4.0s`
  - capture SFX flush cadence: `0.5s`
  - capture SFX cooldown per player per objective: `1.0s`
- Preconditions:
  - use two human players on opposing teams
  - keep current enemy terminal selector at `ObjectiveCapturedEnemy` unless explicitly running the comparison pass
  - test on an `A/B/C` map first so VO flag mapping is unambiguous
- Checklist:
  - [ ] `1. Solo capture start`: Player A enters an enemy/neutral flag alone; expect one `ObjectiveCapturing` within roughly `0.12s` to `0.24s`, then no repeat while progress keeps rising.
  - [ ] `2. Solo capture restart`: Player A leaves long enough for the point to return to non-capturing state, then re-enters; expect one new `ObjectiveCapturing` only after the true restart.
  - [ ] `3. Contested entry`: Player A begins capture, then Player B enters the same point; expect one `ObjectiveContested` when the point first becomes contested.
  - [ ] `4. Contested persist`: Keep both players on point for at least `5s`; expect no repeated `ObjectiveContested` while the point remains contested.
  - [ ] `5. Contested re-entry`: One player leaves so the point exits contested, then re-enters; expect one new `ObjectiveContested` on the re-entry edge.
  - [ ] `6. Neutralization edge`: Neutralize an owned point; expect one `ObjectiveNeutralised` at the actual neutralization edge even if a non-terminal line fired less than `4s` earlier.
  - [ ] `7. Capture completion perspective`: Complete the capture with both players still valid on the point; expect the capturing-side player to hear `ObjectiveCaptured` and the opposing-side player to hear the configured enemy terminal line (`ObjectiveCapturedEnemy` at the current checkpoint).
  - [ ] `8. Leave-radius gating`: Have one player leave the radius while the other keeps the point changing; expect the player who left to hear no more non-terminal VO or capture SFX after leaving.
  - [ ] `8a. Enemy terminal after leave`: If the losing player leaves shortly before the loss completes, note whether the enemy terminal line still plays. Current accepted checkpoint allows this to fail and tracks it as deferred polish (`CQ_Bug_16`).
  - [ ] `9. Death/redeploy`: Kill one player on the point, redeploy, and return; expect no stale delayed VO from the prior life and one fresh non-terminal line only when the new life truly re-enters state.
  - [ ] `10. Team swap edge`: Swap one playerâ€™s team on/near an active point, redeploy, and re-enter; expect no stale pre-swap VO and correct post-swap perspective when VO resumes.
  - [ ] `11. Spam guard`: Rapidly oscillate entry/exit/contest state for at least `10s`; expect no rapid-fire non-terminal replay faster than the current `4.0s` debounce unless the objective actually left and re-entered a different VO phase.
  - [ ] `12. Optional enemy-terminal comparison`: flip the enemy terminal selector from `ObjectiveLost` to `ObjectiveCapturedEnemy`, rerun capture completion perspective, and decide which enemy-side terminal line reads better in multiplayer.
- Pass criteria:
  - non-terminal lines only fire on state-entry edges
  - terminal lines fire exactly once per real transition
  - recipient-local scope is preserved (no global/team-wide unintended broadcast behavior)
  - leaving, death, redeploy, and swap clear stale perspective/state cleanly

Codex To-Do Checklist:

- [x] Validate the VO runtime object path in-project before assuming VO is a viable Phase 4 extension.
- [x] Prototype objective VO using only verified API calls/symbols.
- [x] Keep VO exploration separate from Phase 4 V1 production SFX implementation.
- [x] Implement edge-triggered VO state tracking if exploration proceeds beyond proof-of-concept.
- [x] Map flag letters to `VoiceOverFlags` only through verified supported values `Alpha`..`Golf`.
- [x] Enforce non-terminal debounce and no-repeat rules so VO cannot spam while capture progress is continuously rising.
- [x] Validate team-perspective correctness after swap/redeploy before any VO is considered shippable.
- [x] Run multiplayer contested-objective and opposing-perspective verification.
- [x] Make an explicit keep/reject decision after initial testing instead of letting VO become accidental scope creep. Current decision: keep flag-capture VO, with enemy terminal recent-leave grace deferred as polish.

Phase 4B Closeout Decision:

- Phase 4B is accepted at the current multiplayer-tested checkpoint.
- `ObjectiveContested` and `ObjectiveCaptured` are considered working.
- Enemy terminal VO is accepted in its current on-objective behavior.
- `CQ_Bug_16` remains deferred polish for later iteration if broader recent-leave terminal grace is still desired.

Phase Changelog:

- `Log policy`: append-only; newest entry first.
- `Current status`: `completed`
- `Implementation entry format`: `YYYY-MM-DD | summary | files changed | verification`
- `Design modification entry format`: `YYYY-MM-DD | trigger | proposed change | impacted CF/PD/Phase | decision status | required doc updates`
- `Entries`:
  - `2026-03-13 | Phase 4B closeout decision | Marked Phase 4B complete after multiplayer validation, accepted current ObjectiveContested / ObjectiveCaptured behavior, accepted current enemy terminal on-objective behavior, and carried recent-leave enemy terminal grace forward only as deferred polish (`CQ_Bug_16`) | Phase 4B, CQ_Bug_16, CF-17, CF-18, CF-19 | accepted | design_doc Phase 4B closeout decision + current status summary`
  - `2026-03-13 | Phase 4B multiplayer validation checkpoint | Confirmed in multiplayer that ObjectiveContested and ObjectiveCaptured are working, accepted the current enemy terminal behavior as reliable while the recipient remains on the objective, and deferred broader recent-leave enemy terminal grace as later polish (`CQ_Bug_16`) | Phase 4B, CQ_Bug_16, CF-17, CF-18, CF-19 | accepted_with_deferred_polish | design_doc Phase 4B verification notes + compact MP QA script + checklist update`
  - `2026-03-13 | Phase 4B Stage 3 | Hardened the objective VO cadence model to match the accepted edge-driven policy: per-flag VO phase now tracks Idle/Capturing/Contested/Neutralised/Captured with last-announced-owner state, non-terminal debounce is re-armed only on real state change, and duplicate terminal edges are suppressed by state/owner latch instead of replaying from raw callbacks | src/state/runtime-types.ts, src/index/capture-vo.ts | npm run build, npm run verify, npx tsc --pretty false --noEmit`
  - `2026-03-13 | Phase 4B Stage 2 | Added edge-driven ObjectiveContested VO and an explicit enemy-terminal variant selector so opposing-side completion can be evaluated as ObjectiveLost or ObjectiveCapturedEnemy during later multiplayer testing; default remains ObjectiveLost until that comparison pass happens | src/config/conquest-constants.ts, src/state/runtime-types.ts, src/index/capture-vo.ts | npm run build, npm run verify, npx tsc --pretty false --noEmit`
  - `2026-03-13 | Phase 4B single-player acceptance decision | Recorded human acceptance of the current flag-capture VO set after single-player testing, kept the VO lane active, and made multiplayer contested/opposing-perspective verification the remaining explicit ship gate | Phase 4B, CF-17, CF-18, CF-19 | accepted_pending_mp_validation | design_doc Phase 4B verification notes + checklist update`
  - `2026-03-13 | Phase 4B Stage 1 | Added a toggleable objective VO exploration lane with a dedicated Conquest VO runtime object, recipient-local dispatch, state-entry ObjectiveCapturing plus terminal ObjectiveNeutralised/ObjectiveCaptured/ObjectiveLost mapping, verified A-G flag-to-NATO mapping, and lifecycle cleanup/reset wiring while keeping the shipped Phase 4 SFX path isolated | src/config/conquest-constants.ts, src/state/runtime-types.ts, src/state/runtime-state.ts, src/index/conquest-scaffold.ts, src/index/capture-vo.ts, src/index/capture-tickets.ts, src/index/game-mode.ts, src/index/player-join-leave.ts, src/index/player-deploy.ts, src/interaction/actions.ts, src/conquest-flow.ts, src/index.ts | npm run build, npm run verify, npx tsc --pretty false --noEmit`
  - `2026-03-13 | Optional VO exploration planning pass | Added an explicit optional Phase 4B exploration track for objective voice-over, separating confirmed PlayVO/VoiceOverFlags/VoiceOverEvents2D API facts from inferred Conquest-style state mapping and anti-spam guidance; locked that Phase 4 V1 production scope remains SFX-only unless later approved | Phase 4B, Phase 4, CF-17, CF-18, CF-19 | accepted | design_doc optional VO exploration section + TOC update`

<a id="phase-5"></a>
### Phase 5: Vehicle Systems (Timers, Queue, Repair)

Deliverables:

- per-slot respawn timer tracking and HUD rendering
- current Firestorm tracked-chopper `READY -> DEPLOY button -> direct seat` flow
- broader vehicle queue behavior and slot arbitration only if that remains needed beyond the current chopper slice
- vehicle repair runway/pad behavior
- knobs for vehicle spawns
- deploy-screen vehicle spawn visualization and authored spawn mapping
- direct spawn-into-vehicle flow explicitly brought forward into this phase as `Phase 5D`
- first implemented display slice is Firestorm tracked choppers; wider tank/jet support remains follow-up work
- current pilot-name / `IDLE` owner display on active deploy-screen rows
- explicit script-authoritative ownership for vehicle existence, pending direct-spawn claim state, active-owner state, and timer state

Mapped clarifications:

- `CF-20`, `CF-21`, `CF-22`

Godot/map prerequisites:

- complete vehicle spawner slot mapping and respawn config per map
- authored/validated repair pads, repair runways, or equivalent repair volumes where required
- complete per-map authored static spawn inventory for every transport vehicle, tank, chopper, and jet before tuning knobs are treated as trustworthy
- authored Godot area triggers for runway/pad repair zones if repair is enabled for the map

Verification:

- `npm run verify`
- destroy-to-respawn timer accuracy checks
- queue sequencing and slot-release checks
- repair runway/pad enter/exit and restore-behavior checks
- vehicle spawn knob/config behavior checks
- deploy-screen vehicle spawn visualization/readability checks with minimal available screen space
- first-pass timer validation limited to tanks, jets, and attack choppers (transports explicitly excluded on first pass)
- direct spawn-into-vehicle flow validation across the supported vehicle classes in this phase
- static spawn authoring/proof pass on every intended map before enabling tuning workflows
- Firestorm tracked-chopper `READY -> DEPLOY` button validation, including first-click-wins arbitration and silent second-click failure
- active-row owner display validation proving the deploy-screen row shows the current pilot or `IDLE` from live seat state
- state-authority validation proving the script, not the UI, owns vehicle inventory, direct-spawn claim state, active-owner state, and timer state

Implementation notes:

- deploy-screen requirement:
  - visualize and map vehicle spawns on the deploy screen
  - decide and document where these widgets live given minimal deploy-screen space
- current first-pass Firestorm chopper interaction requirement:
  - the current tracked-chopper flow uses a `READY`-only `DEPLOY` button, not a checkbox reservation/signup interaction
  - the button is hidden until that exact slot is actually `READY`
  - first click wins on a ready slot
  - a competing second click fails silently
  - while the vehicle is active on the deploy screen, the left owner panel should show the current pilot name, or `IDLE` if seat `0` is empty
  - while deployed/live, the team should still see cooldown/`READY` state for tracked slots, but `ACTIVE` rows remain a deploy-screen concern
- future queue/signup requirement:
  - if broader vehicle classes still need queueing later, keep it script authoritative and per exact slot
  - do not assume the current Firestorm chopper `DEPLOY` button model automatically settles the broader `Phase 5C` design for all future vehicle classes
- repair requirement:
  - runway/chopper-pad repair should use Godot-authored area triggers plus code-side repair handling
- map-config expansion requirement:
  - first pass testing rollout is Firestorm only
  - add a dedicated vehicle-deploy spawn point id per team to map config for any mode path that must bypass manual HQ/flag selection
  - Firestorm first-pass anchors are now:
    - Team 1 vehicle-deploy spawn point id: `551`
    - Team 2 vehicle-deploy spawn point id: `550`
  - standard pattern going forward:
    - every supported map should carry one authored vehicle-deploy `SpawnPoint` id per team in map config
    - those ids should point to real authored `SpawnPoint` objects in the map spatial, not arbitrary world object ids
    - `Phase 5F` bounded vehicle-spawn regions should also live in map config as authored region data, not as ad hoc per-map runtime branches
  - every transport, tank, chopper, and jet spawn per map must eventually be statically identified, tested, and verified by humans before later tuning knobs are trusted
- authoritative state requirement:
  - all vehicle, timer, direct-spawn claim, active-owner, and any future queue behavior must be script authoritative
  - game state should explicitly know:
    - what vehicle spawn slots exist
    - which vehicles currently exist or are pending respawn
    - what timer each tracked vehicle slot is on
    - which player currently owns an in-flight direct-spawn claim for a tracked slot
    - which player is currently piloting/driving the active vehicle when that seat is occupied
  - UI should render from that script state and must not become the source of truth
- timer/start/reset rules:
  - timers start on destruction
  - hard-despawn should also restart the timer if that runtime case exists for the slot
  - pending direct-spawn claims should clear on failed or consumed fulfillment and on normal lifecycle cleanup paths
- direct-spawn fulfillment rules:
  - tracked Firestorm chopper slots should not spawn as idle open-pickup vehicles in this system
  - the current first pass uses a `READY`-only `DEPLOY` button instead of a standing reservation/signup state
  - the vehicle should not actually spawn until the player clicks `DEPLOY`
  - spawn fulfillment should couple the spawn event and the auto-seat event together
  - spawn should target the driver/pilot seat only
  - first-click arbitration should prevent a competing player from stealing the same ready slot after it has already been claimed
  - current first-pass implementation is intentionally limited to the Firestorm tracked chopper slice; later vehicle-class expansion remains a separate decision
- current live-spawn compatibility rule:
  - untracked vehicle classes should remain as they work now until map config and slot ownership are intentionally revised
  - the tracked Firestorm chopper slice is now intentionally button-driven and does not follow the older idle-autospawn behavior
- repair behavior rules:
  - repair applies only to friendly vehicles
  - the vehicle must remain inside the repair area trigger
  - repair is continuous over time, not instant
  - repair cadence/speed should be controlled by a tuning constant
- display preference:
  - if valid vehicle icons exist, prefer icon + label + timer digits + reserving username text
- deploy-screen timer display rules:
  - only the local player's team spawns should be shown
  - the timer display should only be visible while the player is on the deploy screen
  - first placement target is the right side of the screen, starting near vertical center
  - the display should dynamically show only the currently active configured vehicle slots for the mode
  - current first-pass assumption is up to 4 possible chopper slots, but only enabled slots should render
  - add an admin toggle to allow the timer display outside the deploy screen:
    - `Timers Visible Deployed ON`
    - `Timers Visible Deployed OFF`
  - render one timer per vehicle slot
  - reuse the existing match-clock widget/timer functionality where practical by generalizing it into a reusable timer instance instead of inventing a separate timer implementation
- deferred design decisions:
  - exact final deploy-screen placement/layout remains intentionally deferred until after initial `Phase 5B` visual tests
  - the naming ambiguity in `Column 1` (`Fast Mover Group 1/2/3`) remains intentionally deferred for later clarification
- ready-up dialog tuning requirement:
  - expand the tuning model so it controls both what spawns and how long those spawns take
  - preserve the requested column grouping as written below; resolve any naming ambiguity during implementation rather than silently renaming it here
- ready-up dialog knob matrix:
  - `Column 1: Jeeps, ATVs, DirtBikes, Transport Helos`
  - `Transport Spawn Length`
  - `Fast Mover Group 1 Vehicle to spawn`
  - `Fast Mover Group 2 Vehicles to spawn`
  - `Fast Mover Group 3 Vehicles to spawn`
  - `Column 2: MBTs, IFVs, AAVs`
  - `Tank Spawn Length`
  - `Tank 1 Vehicle to spawn`
  - `Tank 2 Vehicle to spawn`
  - `Tank 3 Vehicle to spawn`
  - `Tank 4 Vehicle to spawn`
  - `Column 3: Attack Choppers, Little Birds`
  - `Attack Chopper Spawn Length`
  - `Chopper 1 Vehicle to spawn`
  - `Chopper 2 Vehicle to spawn`
  - `Column 4: Jets and Bombers`
  - `Jet Spawn Length`
  - `Jet 1 Vehicle to spawn`
  - `Jet 2 Vehicle to spawn`
- preset mode requirement after the above works:
  - `TWL Conquest 8v8`
  - `TWL Conquest 10v10`
  - `TWL Conquest 12v12`
  - `TWL Conquest 16v16`
  - when knobs are edited away from a preset baseline, the mode should present as derived-only `TWL Conquest Custom`

Phase 5 execution breakdown:

<a id="phase-5a"></a>
- `Phase 5A: Vehicle Spawner timers, game state, and logic`
  - authoritative vehicle slot state
  - authoritative respawn timers
  - authoritative vehicle existence / pending-respawn state
  - base spawn logic ownership
<a id="phase-5b"></a>
- `Phase 5B: Vehicle Spawner HUD / deploy-screen displays`
  - deploy-screen spawn visualization
  - low-screenspace placement decisions
  - first placement target is right-side, vertical-center anchored
  - current implemented slice is Firestorm tracked choppers first
  - local-team timer/status display is live for that slice
  - active rows on the deploy screen show the current pilot name or `IDLE` in the left owner panel
  - category-driven timer/display behavior while each exact vehicle slot remains individually configurable
  - later widening to tanks/jets remains follow-up work after the current chopper slice is accepted
  - first visible pass should show only the local player's team spawns and only while deploy-screen-visible, unless the admin timer-visibility toggle is enabled
<a id="phase-5c"></a>
- `Phase 5C: Vehicle queue / signup`
  - deferred redesign for the current tracked-chopper slice
  - the earlier checkbox/reservation prototype has been superseded there by the `READY`-only `DEPLOY` button flow in `Phase 5D`
  - if broader vehicle classes still need queueing later, revisit queue behavior and arbitration as a distinct design pass
<a id="phase-5d"></a>
- `Phase 5D: Spawn directly in vehicle`
  - direct spawn-into-vehicle flow is explicitly in Phase 5 scope, not deferred to a later phase
  - current Firestorm tracked-chopper first pass is implemented as `READY -> DEPLOY button -> direct seat`
  - should build on the same authoritative slot/timer/direct-claim state as 5A-5C
  - spawn should target the driver/pilot seat only
  - the player should not need a second manual map-click step once the `DEPLOY` button is used
  - the tracked slot should not spawn until the player commits the deploy
  - current bypass-manual-selection path should prefer `SpawnPlayerFromSpawnPoint(...)` from a per-team authored vehicle-deploy spawn point id when the map config provides one
  - first-pass direct-spawn validation is currently the Firestorm tracked-chopper slice
<a id="phase-5e"></a>
- `Phase 5E: Map config / vehicle spawn mapping`
  - expand map configs with the full vehicle spawn datapoint inventory
  - add per-team vehicle-deploy spawn point ids for direct vehicle deployment without manual HQ/flag selection
  - Firestorm proof values are currently:
    - Team 1: `551`
    - Team 2: `550`
  - current checkpoint decision:
    - accepted for now as a Firestorm-first proof point
    - remaining follow-up is deferred:
      - console-player review
      - hardened multiplayer validation
      - additional polish/re-review before broader map rollout
  - prerequisite: add all intended vehicle spawn datapoints into the map configs
  - until then, implementation/testing may proceed against the currently proven vehicle spawns (tanks and choppers) on Firestorm only
<a id="phase-5f"></a>
- `Phase 5F: 3D Bounded Spawn Volumes`
  - define an authored spawn volume from:
    - `4` floor-corner points in `X/Y/Z`
    - one height value that defines the ceiling above that floor footprint
  - support diagonal/non-axis-aligned regions; these boxes should not assume north/south/east/west alignment
  - first-pass authoring target per map side:
    - `1` aircraft box
    - `1` tank box
  - each authored bounded spawn region should also carry fixed spawn rotation values:
    - `rotX`
    - `rotY`
    - `rotZ`
  - rotation should apply to spawned vehicles regardless of where inside the bounded region the final random point is chosen
  - support script-authoritative spawn resolution anywhere inside that 3D area
  - prove a reusable contract for validating and selecting spawn positions inside the volume
  - BountyHunter reference insight:
    - map-authored spawn regions are a good fit for large maps when they stay data-driven
    - composite authored regions are practical; large spaces like Firestorm do not need to be represented as one giant monolithic region
    - our version should generalize that idea from fixed-altitude drop-in rectangles to full vehicle-capable 3D bounded volumes
  - preserve this as a foundation feature for later advanced spawn and vehicle-placement work
  - prerequisite: map config must be able to carry:
    - 4 floor corners
    - height
    - fixed rotation
    - multiple bounded regions per team/class where needed
  - aircraft birth-rotation lesson from the fixed-air probe (`2026-03-21`):
    - do not assume post-spawn correction is the primary solution for aircraft pitch; the best current result came from birth-time spawner rotation
    - the working temporary probe path is: spawn the aircraft once at the intended air point from a `VehicleSpawner`, with the desired birth rotation already authored, and avoid teleport/reposition correction as the main pitch mechanism
    - in the current probe, the useful aircraft pitch axis is `rotX`
    - in the current probe, spawn-time aircraft pitch behaves like radians rather than raw degrees
    - in the current probe, positive `rotX` produced the usable nose-down direction; negative `rotX` pushed the jet toward the opposite/upward attitude
    - preserve this lesson when promoting the temporary jet probe into the real aircraft `AIR DEPLOY` flow
    - do not treat the current admin/debug transform panel as authoritative for choosing aircraft birth-rotation axis/sign conventions; rely on direct visible spawn tests instead
  - cleanup plan after promoting the aircraft birth-rotation lesson:
    - remove the temporary aircraft probe surfaces from production once the fresh-spawn air-deploy path is stable enough:
      - admin tester button + handler + visibility ownership
      - temporary jet probe HUD block
      - temporary jet visual probe runtime spawner path and mode-cycling state
      - temporary debug/probe strings that only exist to label probe modes or probe readback lines
    - remove stale post-spawn aircraft-pitch experiment code once it is no longer needed for fallback/debug:
      - transform/rotate/move pitch experiment helpers
      - temporary readback helpers that only exist to support the probe HUD
    - keep the new production aircraft air-deploy pieces:
      - fresh in-air aircraft birth-spawn resolution from bounded volumes
      - one-shot suppression of the normal slot bind ground-transform correction for that fresh aircraft bind
      - slot-owned runtime air spawner lifetime tracking for the fresh-air path
    - normalize the final aircraft authoring contract after cleanup:
      - decide whether map-config `rotPlane` / `rotHeli` should remain authored as degrees with runtime normalization, or be converted to the final birth-spawn convention directly
      - remove temporary compatibility bridging once the config contract is locked and existing map data is updated
    - post-cleanup validation must explicitly re-check:
      - jet and heli `AIR DEPLOY`
      - player seating and loadout stability
      - destroy / respawn / redeploy behavior
      - both teams and multiple authored aircraft boxes
<a id="phase-5g"></a>
- `Phase 5G: Polish / tune`
  - current status: accepted complete for Phase 5 closeout
  - remaining UX/validation/future-authoring items are intentionally deferred to later polish, later phases, or tracked bugs; they are no longer blockers for calling Phase 5 done
  - vehicle repair in base is deferred into this later polish/tuning phase, not treated as a standalone implementation phase
  - runway/pad repair behavior
  - prerequisite: implement the required Godot repair-area requirements first
  - accepted Phase 5G closeout summary:
    - ready-dialog knobs, preset packaging, derived-only `Custom`, saved/applied behavior, live-lock visuals, and authoritative spawn-package ownership are implemented and accepted at the current checkpoint
    - the current ready-dialog / vehicle-HUD structural cleanup baseline is accepted; do not casually reopen broad lifecycle or reveal-path churn during Phase 6
    - the current accepted preset naming is:
      - `TWL Conquest 8v8`
      - `TWL Conquest 10v10`
      - `TWL Conquest 12v12`
      - `TWL Conquest 16v16`
      - derived-only `TWL Conquest Custom`
  - accepted carry-forward from Phase 5 into later polish / Phase 10 / bugs:
    - ready-dialog first-open / team-switch / some live-transition latency remains a separate polish bug
    - ready-dialog live roster freshness remains a separate polish bug
    - broader multiplayer validation for deploy HUD stability, timer evidence, and longer-session runtime behavior remains a playtest/polish item
    - position-debug `rotZ` / in-vehicle rotation reliability remains deferred polish
    - runway/pad repair remains deferred polish
    - broader map authoring breadth (for example additional spawn placeholders / volume expansion) remains later rollout work
  - Phase 6 handoff note:
    - Phase 6 is now the next implementation target
    - do not treat any remaining Phase 5 polish/bug item as a blocker unless it breaks current accepted baseline behavior

Codex To-Do Checklist:

Phase 5 is now intentionally closed. Any former open items below are either accepted as complete or explicitly deferred out of Phase 5 so this checklist can serve as a true closeout record.

- [x] Complete `Phase 5A` authoritative vehicle spawner timer, game-state, and logic ownership.
- [x] Implement per-slot vehicle respawn timer state keyed to configured vehicle slot mapping.
- [x] Render timer HUD output from authoritative timer state only.
- [x] Complete the current Firestorm tracked-chopper `Phase 5B` HUD/deploy-screen display slice.
- [x] Defer the broader `Phase 5C` queue/signup decision to later design/polish rather than blocking Phase 5 closeout.
- [x] Defer vehicle repair runway/pad support to later polish/Phase 10.
- [x] Add configurable knobs for vehicle spawns and ensure they are applied from authoritative config/runtime state.
- [x] Visualize/mount vehicle spawns on the deploy screen and lock a workable low-screenspace layout.
- [x] Harden the ready-dialog render/cache path so first open is an atomic reveal of a prebuilt hidden tree instead of a visible incremental build.
- [x] Remove visibility churn from routine UI refresh paths so top HUD, vehicle HUD, ready dialog, and debug all follow the explicit `build -> refresh hidden/content-only -> reveal once` contract.
- [x] Implement the first-pass Firestorm tracked-chopper deploy-screen timers and status panels.
- [x] Show only the local player's team spawns in the deploy-screen timer display.
- [x] Keep the timer display deploy-screen-only by default, with an admin override toggle for visibility outside deploy.
- [x] Reuse/generalize existing clock widget behavior for per-vehicle timer instances instead of building a separate timer implementation from scratch.
- [x] Bring direct spawn-into-vehicle flow into Phase 5 and validate it against the same authoritative slot/timer system.
- [x] Complete the current Firestorm tracked-chopper `Phase 5D` direct spawn-into-vehicle flow.
- [x] Replace the earlier checkbox/reservation prototype in the tracked-chopper slice with a `READY`-only `DEPLOY` button.
- [x] Keep vehicle existence, direct-spawn claim state, active-owner state, and timers script authoritative rather than UI-local.
- [x] Show the current pilot name or `IDLE` on active deploy-screen rows.
- [x] Use first-click-wins arbitration on a ready tracked slot, with competing second clicks failing silently.
- [x] Accept the current Firestorm-first `Phase 5E` map-config / vehicle-deploy-anchor checkpoint as passed for now.
- [x] Defer the broader `Phase 5E` console-player review, hardened multiplayer testing, and final rollout polish to later playtesting/polish.
- [x] Complete `Phase 5F` bounded 3D spawn-volume feature after map-config support for 4 floor corners, height, and fixed rotation exists.
- [x] Defer the remaining position-debug `rotZ` / in-vehicle rotation reliability work to later polish.
- [x] Deprecate the legacy `4v4` forced-heli patch and replace it with a fully authoritative ready-up spawn-package pass.
- [x] Add `No Spawn` to every vehicle knob and use it to disable individual slots cleanly.
- [x] Lock `TWL Conquest 10v10` as the first full default spawn package, including heli, jet, armor, and fast-mover defaults.
- [x] Keep all configured vehicle slots user-controlled to spawn instead of auto-spawning them at match start.
- [x] Add first-pass plane `GROUND DEPLOY` / `AIR DEPLOY` handling and randomize `AIR DEPLOY` plane orientation between `N/E/S/W`.
- [x] Keep fast movers on `GROUND DEPLOY` only.
- [x] Accept the current live preset/deploy-HUD checkpoint for Phase 5 closeout and carry any deeper multiplayer validation/layout tuning into later playtesting.
- [x] Prove a script-authoritative 4-corner-plus-height volume contract that can resolve a spawn anywhere inside the bounded 3D area.
- [x] Defer expanded bounded-volume authoring and repeated safety validation beyond the current accepted checkpoint to later map-authoring/polish.
- [x] Defer broader repeated bounded-volume spawn-position validation to later playtesting/polish.
- [x] Defer full per-map spawn inventory authoring/verification breadth to later map rollout/polish.
- [x] Remove or isolate remaining legacy combat/V2 widget ownership so the active combat HUD has one visible owner only.
- [x] Split the right-side vehicle HUD into explicit build/content/reveal phases and remove routine visibility control from normal refresh helpers.
- [x] Delete dormant loading-overlay/loading-gate infrastructure that is no longer part of the accepted hidden-build/reveal model.
- [x] Simplify warm/reveal state in the interaction layer so only the minimal active ownership flags remain.
- [x] Move long manual HUD hide/delete/reset lists into per-family cleanup helpers.
- [x] Add ready-dialog dirty-refresh/signature rules so cold open/reopen stop doing unnecessary work.
- [x] Split active HUD cache refs from legacy/deprecated refs and remove dead cache shapes as families are simplified.
- [x] Add a sustainable ready-dialog `draft vs applied` saved-state model that drives red/green knob values, unsaved-change messaging, and `Apply Configuration` enabled/disabled behavior.
- [x] Reintroduce `Reset to Default` in the ready dialog and lay out `Reset to Default` and `Apply Configuration` as off-center sibling buttons with a center gutter.
- [x] Add named preset configurations (`TWL Conquest 8v8/10v10/12v12/16v16`) and switch to derived-only `TWL Conquest Custom` labeling when knobs diverge from preset values.
- [x] Defer left-side ready-up header suppression/anchor preservation to later polish.
- [x] Accept the current knob matrix/layout for Phase 5 closeout and revisit expansion only if later authoring proves it necessary.
- [x] Move ready-up vehicle knob values into authoritative game/config state and make the confirm/apply button mutate the actual active spawner selection.
- [x] Defer missing authored map-config spawn placeholders/positions for later map polish and rollout.
- [x] Accept the current disabled-slot hiding and per-map respawn behavior checkpoint for Phase 5, with broader multiplayer validation deferred.
- [x] Accept the current destroy-to-respawn timing checkpoint for Phase 5, with broader multiplayer validation deferred.
- [x] Defer broader queue fairness / slot-release validation to later playtesting if that path is revisited.
- [x] Defer repair runway/pad validation until the feature itself is brought back from deferred polish.
- [x] Accept the current vehicle-spawn knob behavior as functional for Phase 5 closeout, with continued playtest validation deferred.
- [x] Accept the current timer-accuracy checkpoint for Phase 5 closeout, with continued multiplayer evidence gathering deferred to later playtesting.

Phase Changelog:

- `Log policy`: append-only; newest entry first.
- `Current status`: `completed`
- `Implementation entry format`: `YYYY-MM-DD | summary | files changed | verification`
- `Design modification entry format`: `YYYY-MM-DD | trigger | proposed change | impacted CF/PD/Phase | decision status | required doc updates`
- `Entries`:
  - `2026-03-22 | Phase 5 / 5G closeout decision after preset packaging, players draft-apply behavior, and final ready-dialog polish pass | Marked Phase 5G accepted complete and closed Phase 5 as a whole; converted the remaining non-blocking checklist items into explicit accepted deferrals for later polish/playtesting/issues, kept Phase 6 as the next implementation target, and treated the current vehicle/UI stack as the accepted Phase 5 baseline | Phase 5, Phase 5G, Phase 6, Phase 10, CQ_Bug_18, CQ_Bug_19, CQ_Bug_20 | accepted | design_doc current status + Phase 5G note + Phase 5 checklist + Phase 5 changelog`
  - `2026-03-22 | Phase 5G preset-packaging scope lock after saved/applied and live-lock polish | Recorded the current accepted remaining 5G scope: next implementation work is named preset packaging (`TWL 8v8/10v10/12v12/16v16`) with derived-only `Custom`; the current knob list/layout is accepted as-is for now; transport boundary authoring, position-debug reliability, and base repair stay deferred to later polish | Phase 5, Phase 5G | accepted | design_doc Phase 5G remaining-items note + immediate next target + checklist`
  - `2026-03-22 | Phase 5F aircraft probe cleanup planning pass after the birth-spawn breakthrough | Recorded the concrete cleanup plan before resuming broader polish: remove the temporary admin/button/HUD probe surfaces, remove stale post-spawn experiment helpers, keep the new fresh-air production spawn path pieces, and lock a final aircraft rotation authoring contract before deleting the current compatibility bridge | Phase 5, Phase 5F, Phase 5G | accepted_for_cleanup_planning | design_doc Phase 5F cleanup note + Phase 5 changelog`
  - `2026-03-21 | Phase 5F aircraft birth-rotation lesson from the fixed-air jet probe | Recorded the current working aircraft pitch finding so it is not lost during cleanup: the best current result came from birth-time `VehicleSpawner` rotation rather than post-spawn correction; the useful current axis is `rotX`; the current spawn path behaves like radians; and positive `rotX` produced the usable nose-down direction in testing | Phase 5, Phase 5F | accepted_for_design_guidance | design_doc Phase 5F lesson note + Phase 5 changelog`
  - `2026-03-18 | Phase 5 checklist cleanup follow-up | Removed stale duplicate Phase 5 checklist boxes, marked already-landed spawn-package items as complete (`No Spawn`, legacy 4v4 patch removal, plane ground/air deploy, fast-mover ground-only behavior, bounded-volume contract proof), and rewrote the remaining unchecked boxes so they reflect only real open Phase 5 work | Phase 5, Phase 5F, Phase 5G | accepted | design_doc Phase 5 checklist + changelog`
  - `2026-03-18 | Phase 5 closeout doc sync after the accepted 5G cleanup baseline | Marked the broad Phase 5G structural cleanup/cutdown pass as accepted, updated the checklist to reflect the completed UI ownership/cut work, and collapsed the remaining Phase 5 work into the explicit leftover items: 5C queue decision, 5E validation hardening, 5F bounded-volume validation/expansion, and the remaining feature-level 5G items such as saved/applied clarity, base repair, and debug authoring follow-up | Phase 5, Phase 5G, Phase 6 | accepted | design_doc Phase 5G breakdown + immediate next target + Phase 5 checklist + Phase 5 changelog`
  - `2026-03-16 | Phase 5G next-step doc sync after the v0.692 combat/V2 cutdown | Recorded the accepted current cut checkpoint: dead combat/V2 widget writers are removed, the dormant loading-model is no longer part of the active design, and the next slice is now narrower: family cleanup helpers, ready-dialog dirty refresh, HUD cache-shape cleanup, further warm/reveal-state simplification, and final vehicle-HUD public-callsite cleanup before Phase 6 handoff is considered ready | Phase 5, Phase 5G, Phase 6 | accepted | design_doc Phase 5G breakdown + immediate next target + Phase 5 checklist + Phase 5 changelog`
  - `2026-03-16 | Phase 5G optimization/cutdown plan after UI stabilization checkpoint | Recorded that the current codebase is at an acceptable working checkpoint but still too heavy from repeated HUD/UI bug-fix churn; locked the next Phase 5G slice as an architectural simplification pass before Phase 6 handoff: remove duplicate widget owners, cut dormant loading infrastructure, split vehicle HUD refresh from reveal, simplify warm/reveal state, add ready-dialog dirty-refresh rules, and keep the accepted UI family order/topology explicit | Phase 5, Phase 5G, Phase 6 | accepted | design_doc Phase 5G breakdown + immediate next target + Phase 5 checklist + Phase 5 changelog`
  - `2026-03-15 | Phase 5F accepted and Phase 5G polish focus shift | Marked Phase 5F as accepted for now and moved the active implementation focus fully into Phase 5G polish: make ready-up knobs authoritative over real spawned slot inventory, lead with the TWL - 10v10 Conquest package, validate jets/armor/transports through the same live flow, and use the expanded package to test whether the right-side deploy HUD still fits the maximum intended vehicle count cleanly | Phase 5, Phase 5F, Phase 5G | accepted | design_doc Phase 5G breakdown + immediate next target + Phase 5 checklist + Phase 5 changelog`
  - `2026-03-15 | Phase 5 next-target shift after ready-dialog stabilization | Moved the immediate next implementation target from the older generic Phase 5F bounded-volume pointer to a narrower Firestorm-first Phase 5G ready-up spawn-package authority pass: deprecate the legacy 4v4 forced-heli shortcut, make ready-up knob selections authoritative over actual slot inventory, add per-slot No Spawn, lock TWL - 10v10 Conquest as the first default package, and keep vehicles user-controlled to spawn while leaving the remaining Phase 5E/5F follow-up explicit | Phase 5, Phase 5E, Phase 5F, Phase 5G | accepted | design_doc immediate next target + Phase 5 checklist + Phase 5 changelog`
  - `2026-03-15 | Phase 5G ready-up spawn-package merge note | Recorded the deferred polish goal of replacing the legacy `4v4` forced-heli patch with a fully authoritative ready-up spawn-package pass, adding `No Spawn` to every vehicle knob, locking `TWL - 10v10 Conquest` as the first default package, keeping vehicles user-controlled to spawn, and adding first-pass plane/fast-mover deploy-button rules | Phase 5, Phase 5G | accepted_with_deferred_polish | design_doc Phase 5G breakdown + Phase 5 checklist + Phase 5 changelog`
  - `2026-03-15 | Phase 5G deferred debug-authoring note | Recorded that the current position-debug transform panel is good enough for ongoing authoring but still has unresolved `rotZ` and in-vehicle rotation reliability issues, and explicitly deferred that cleanup to the later Phase 5G polish/tuning pass instead of continuing churn now | Phase 5, Phase 5G | accepted_with_deferred_polish | design_doc Phase 5G breakdown + Phase 5 checklist + Phase 5 changelog`
  - `2026-03-14 | Phase 5G ready-up layout clarification follow-up | Locked that Column 1 stays on the far right, Row 6 is a shared support row unless a field explicitly consumes it for two-line treatment, and Row 7 is one centered bottom action button below the full grid; also recorded that spacing must be compressed from the current visual baseline, that ready-up knob values must become authoritative game/config state, and that missing static spawn positions such as Firestorm fast movers must be added to map config before the knob matrix is complete | Phase 5, Phase 5G, CF-20, CF-21, CF-22 | accepted | design_doc Phase 5G breakdown + Phase 5 checklist + Phase 5 changelog`
  - `2026-03-14 | Phase 5G ready-dialog render/cache review | Recorded that the current ready-dialog front end still mixes hidden-cache reuse with visible widget recreation, causing first-open flicker/pop-in risk; locked the later polish goal as a fully prebuilt hidden dialog tree with atomic reveal, no open-time button-label rebuild churn, tighter widget parenting under one root, and a non-eager admin-panel path | Phase 5, Phase 5G, CF-20, CF-21, CF-22 | accepted | design_doc Phase 5G breakdown + Phase 5 checklist + Phase 5 changelog`
  - `2026-03-14 | Phase 5G ready-up knob layout planning pass | Recorded the current accepted front-end direction for the ready-up/admin panel: hide the temporary left-side header strings while preserving their anchors, preserve the current right-side two-column knob pattern as the styling baseline, and expand it later into a standardized 7-column/7-row layout driven by reusable spacing constants and the knob inventory in TWL_Conquest_Knobs.md | Phase 5, Phase 5G, CF-20, CF-21, CF-22 | accepted | design_doc Phase 5G breakdown + Phase 5 checklist + Phase 5 changelog`
  - `2026-03-14 | Phase 5E provisional closeout decision before Phase 5F start | Accepted the current Firestorm-first map-config and vehicle-deploy-anchor checkpoint as passed for now, explicitly deferred console-player review, hardened multiplayer validation, and further polish, and advanced the active implementation target to Phase 5F bounded spawn volumes | Phase 5, Phase 5E, Phase 5F, CF-20, CF-21, CF-22 | accepted | design_doc Phase 5E breakdown + immediate next target + Phase 5 checklist + Phase 5 changelog`
  - `2026-03-14 | Phase 5F bounded-volume contract refinement after BountyHunter reference review | Refined Phase 5F from the older 8-point concept into a map-config-authored 4-corner floor footprint plus height ceiling model, added fixed rotation per bounded region, locked first-pass per-side aircraft/tank boxes, and recorded the BountyHunter insight that composite data-driven spawn regions are a practical fit for large maps while still keeping our implementation fully 3D | Phase 5, Phase 5E, Phase 5F, CF-20, CF-21, CF-22 | accepted | design_doc Phase 5 implementation notes + Phase 5F breakdown + Phase 5 checklist + Phase 5 changelog`
  - `2026-03-14 | Phase 5G structure refinement | Folded vehicle repair in base into the later Phase 5G polish/tuning bucket and removed the separate Phase 5H split so current planning treats base repair as deferred polish rather than a standalone implementation phase | Phase 5, Phase 5G, CF-20, CF-21, CF-22 | accepted | design_doc TOC + Phase 5 outline + Phase 5 breakdown + Phase 5 checklist + Phase 5 changelog`
  - `2026-03-14 | Phase 5 doc sync after Firestorm chopper implementation pass | Updated Phase 5 to reflect the current Firestorm tracked-chopper slice: Phase 5B HUD and Phase 5D direct deploy are implemented as a READY-only DEPLOY-button flow, Phase 5C is deferred/redesigned for broader vehicle classes, and Phase 5E is the next implementation target | Phase 5, Phase 5B, Phase 5C, Phase 5D, Phase 5E, Phase 5G, CF-20, CF-21, CF-22 | accepted | design_doc baseline + Phase 5 implementation notes + Phase 5 breakdown + Phase 5 checklist + Phase 5 changelog`
  - `2026-03-14 | Firestorm vehicle-deploy spawn-point pattern lock | Recorded the authored Firestorm per-team vehicle-deploy spawn point ids (`504` for Team 1, `503` for Team 2) and clarified that future maps should carry the same per-team authored `SpawnPoint` ids in map config for direct vehicle deployment without manual HQ/flag selection | Phase 5, Phase 5D, Phase 5E, CF-20, CF-21, CF-22 | accepted | design_doc Phase 5 implementation notes + Phase 5D/5E breakdown + Phase 5 changelog`
  - `2026-03-13 | Phase 5F/5G ordering change | Swapped Phase 5F and Phase 5G so bounded 3D spawn volumes are implemented before base repair; updated the TOC, Phase 5 outline, checklist, and section ordering for consistency | Phase 5, Phase 5F, Phase 5G, CF-20, CF-21, CF-22 | accepted | design_doc TOC + Phase 5 outline + Phase 5 checklist + Phase 5 section ordering`
  - `2026-03-13 | Phase 5B initial timer-display placement and visibility rules | Locked the first-pass deploy-screen timer display to the local team only, right-side/vertical-center initial placement, deploy-screen-only visibility with an admin override toggle, dynamic rendering of only active slots, and reuse/generalization of the existing clock widget for spawn timers | Phase 5, Phase 5B, CF-20, CF-21, CF-22 | accepted | design_doc Phase 5 implementation notes/checklist/changelog`
  - `2026-03-13 | Phase 5 reservation persistence follow-up | Replaced the temporary persistent-live-reservation model with a first-pass auto-resubscribe return model: successful spawn fulfillment clears the live reservation, but vehicle destruction re-reserves the same slot for that player if nobody else claimed it first; kept a deferred Phase 5G override item for later reservation-consumption tuning | Phase 5, Phase 5C, Phase 5D, Phase 5G, CF-20, CF-21, CF-22 | accepted | design_doc Phase 5 implementation notes/checklist/changelog`
  - `2026-03-13 | Phase 5 reservation timeout clarification | Locked reservations to wait indefinitely with no timeout; they should clear only through explicit lifecycle or replacement rules | Phase 5, Phase 5C, Phase 5D, CF-20, CF-21, CF-22 | accepted | design_doc Phase 5 implementation notes/checklist/changelog`
  - `2026-03-13 | Phase 5 reservation/deploy clarification after follow-up planning answers | Locked that reserved vehicles should not spawn until the reserving player is at the deploy screen and confirms deploy, limited first-pass direct-spawn testing to jets and attack choppers, made new reservations replace old ones, and preserved current live-spawn behavior until map-config-driven slot revision begins | Phase 5, Phase 5B, Phase 5C, Phase 5D, Phase 5E, CF-20, CF-21, CF-22 | accepted | design_doc Phase 5 implementation notes/checklist/changelog`
  - `2026-03-13 | Phase 5 design lock pass after planning questions | Locked reservation scope as per-exact-slot with one reservation max per player and per slot, locked direct spawn fulfillment into the driver/pilot seat, kept reservations through death/undeploy but not disconnect/match transitions/team swap, restricted first-pass map rollout to Firestorm, and recorded deferred decisions for deploy-screen placement and the ambiguous Column 1 naming | Phase 5, Phase 5A, Phase 5B, Phase 5C, Phase 5D, Phase 5E, Phase 5G, CF-20, CF-21, CF-22 | accepted | design_doc Phase 5 implementation notes/checklist/changelog`
  - `2026-03-13 | Phase 5 execution split clarification | Explicitly split Phase 5 into 5A-5G, locked direct spawn-into-vehicle into Phase 5D, and recorded that later polish/base repair work depends on Godot repair requirements while 5E depends on complete map-config vehicle spawn datapoints; noted that testing can continue against current tank/chopper spawns before 5E is complete | Phase 5, CF-20, CF-21, CF-22 | accepted | design_doc Phase 5 deliverables/implementation notes/checklist/changelog`
  - `2026-03-13 | Phase 5 bounded-volume spawn addition | Inserted a new Phase 5F for script-authoritative bounded 3D spawn volumes defined by 8 points in space, and shifted the existing polish/tune work into the later Phase 5G bucket | Phase 5, Phase 5F, Phase 5G, CF-20, CF-21, CF-22 | accepted | design_doc TOC + Phase 5 outline + Phase 5 checklist + Phase 5 section ordering`
  - `2026-03-13 | Phase 5 queue interaction and state-authority clarification | Added requirement to prove the deploy-screen queue signup interaction, with a square checkbox-style reservation button as the preferred first pass, and locked that vehicle existence, queue membership, reservation state, and timers stay script authoritative rather than UI-local | Phase 5, CF-20, CF-21, CF-22 | accepted | design_doc Phase 5 deliverables/verification/implementation notes/checklist`
  - `2026-03-13 | Phase 5 scope expansion request before implementation | Added deploy-screen vehicle spawn visualization, first-pass vehicle timers for tanks/jets/attack choppers, direct spawn-into-vehicle requirement, queue reservation name display, Godot repair-trigger note, full static spawn authoring requirement, expanded ready-up vehicle/timer knob matrix, and preset-vs-custom vehicle mode packaging expectations; explicitly deferred flag-based vehicle spawners to Phase 10 polish | Phase 5, Phase 10, CF-20, CF-21, CF-22 | accepted | design_doc Phase 5 deliverables/prereqs/verification/implementation notes/checklist + Phase 10 deferred note`
  - `2026-03-13 | Phase 5 Stage 1 timer backbone | Added authoritative per-slot respawn timer state and timer-owner helpers, then wired existing spawn/respawn/bind flows to that timer authority without changing current vehicle spawn behavior | src/state/runtime-types.ts, src/vehicles/timers.ts, src/vehicles/spawner-slots.ts, src/vehicles/spawner-sequence.ts, src/vehicles/spawner-bind.ts, src/index/vehicle-events.ts, src/index.ts | pending build/verify in current implementation pass`

<a id="phase-6"></a>
### Phase 6: Boundary System

Deliverables:

- aircraft-vs-vehicle boundary enforcement
- main-base out-of-bounds enforcement
- enemy main-base buffer enforcement with warning timer + kill on expiry
- grounded-player ground-combat-zone enforcement with warning timer + kill on expiry
- map-config migration of boundary area-trigger ids so main base, main-base buffer, and ground combat zone are no longer hardcoded in gameplay constants
- kill-player out-of-bounds behavior
- preserve clean handoff points into later Phase 7 pre/post-match flow and later Phase 8 spawn behavior work

Mapped clarifications:

- `CF-27`, `CF-73`, `CF-80`

Godot/map prerequisites:

- authored boundary volumes/config for aircraft, vehicles, and main bases
- authored area triggers and explicit `MapConfig` ids for:
  - existing main bases
  - new main-base buffers
  - new ground combat zone
- authoring reference:
  - see `src/config/maps/OBJ_ID_RUBRIC.md` for the current Conquest object-id family/range rubric and the current Firestorm occupancy list
- current first-pass trigger ids to record in map config:
  - main-base buffer East: `502`
  - main-base buffer West: `503`
  - ground combat zone: `666` (reserved; **not enforced by script as of v1.351** — see Ground combat zone section below)
- current Firestorm support ids now separate boundary and deploy ownership cleanly:
  - Team 2 vehicle-deploy spawn point: `550`
  - Team 1 vehicle-deploy spawn point: `551`

Boundary / zone contract:

- prompt/UI reference:
  - player-facing Phase 6 warning UX, countdown formatting, icon/SFX expectations, offender-local ownership, and the remaining deferred flow question are defined in `design_doc/phase6_boundary_prompt_spec.md`

- Main base:
  - these already exist and are currently used by the area-trigger enter/exit path
  - current map-config ownership now carries the per-team main-base trigger ids (`500` / `501`) for Firestorm
  - legacy fallback constants still exist only as compatibility defaults until all maps are authored onto the map-config path
- Main-base buffer:
  - this is new and must be added to map config per map
  - the first-pass purpose is enemy-base denial after the match becomes live
  - a player may not enter the enemy team's protected main-base territory while the match is live
    - protected territory is the union of:
      - the enemy main-base core trigger
      - the enemy main-base buffer trigger
    - overlapping exits must not clear the violation until the player has left both
  - on enemy-buffer entry during live play:
    - show a warning prompt telling the player to leave within `3` seconds
    - if the player remains inside after `3` seconds, kill the player
  - exact warning-prompt UI is deferred for later design, but the timer/kill rule is locked here
- Ground combat zones (v1.370 — single-source-of-truth zone + seat tracker):
  - **Live-play safe ground zone for foot + ground vehicles = own HQ UNION own buffer UNION GroundCombatVolume.** HQ and ground polygons do NOT overlap; buffer overlaps with the ground polygon. Aircraft are exempt from the script GCZ entirely.
  - Spatial geometry:
    - `CombatArea.CombatVolume` = `AirCombatVolume` (large air polygon). The engine's vanilla "Leaving Combat Area" grey-zone applies only at the **outer** edge of AirCombatVolume — the aircraft OOB fence.
    - `GroundAreaTrigger` (ObjId `666`) wraps `GroundCombatVolume` (small ground play polygon).
    - Own HQ triggers (Firestorm, after the v1.364 swap to match the spatial): `500` (T1 / West), `501` (T2 / East). Buffer triggers: `502` (T1 / West), `503` (T2 / East). Authoritative source is the map config in `src/config/maps/operation-firestorm.ts`; gameplay reads via `getMainBaseTriggerIdForTeam` / `getMainBaseBufferTriggerIdForTeam` getters.
    - **AreaTriggers must be enabled** at game-mode start via `mod.EnableAreaTrigger(trigger, true)` (CQ_Feat_AreaTrigger_Enable, v1.367). Without this the engine does not deliver enter/exit events. `enableBoundaryAreaTriggers()` in `boundary/enforcement.ts` handles this for all five boundary triggers.
  - **Foot players** outside the safe ground zone → custom "YOU ARE OUT OF BOUNDS; RETURN NOW!" HUD + alarm + 10s kill countdown. Same treatment for foot players above `AIRCRAFT_BAIL_CEILING_Y` (Y=200), since trigger 666 is XZ-clipped.
  - **Non-aircraft vehicle occupants** (tanks, bradleys, CV90, Marauder, jeeps, bikes, quads, IFVs, naval) outside the safe ground zone → same custom OOB.
  - **Aircraft occupants** → exempt from script GCZ via `state.seatKind === "aircraft"`. They operate freely across the full `CombatArea/AirCombatVolume`. The engine grey-zone at that polygon's outer edge is the only OOB they see.
  - **Per-player state — `PlayerZoneState`** at `State.round.boundary.zoneStateByPid[pid]`: five zone booleans (`inOwnHQ`, `inOwnBuffer`, `inGCZ`, `inEnemyHQ`, `inEnemyBuffer`) plus a `seatKind: "on_foot" | "ground_vehicle" | "aircraft"` field. Single writer per slice:
    - Zone booleans owned exclusively by `updateZoneStateOnTriggerTransition` (called from `OnPlayerEnter/ExitAreaTrigger`). `inOwnHQ` is mirrored to legacy `State.players.inMainBaseByPid` for downstream consumers (`world-interactables.ts`, `takeoff-gating.ts`).
    - `seatKind` owned exclusively by `setPlayerSeatKind` (called from `OnPlayerEnterVehicle` / `OnPlayerExitVehicle`, plus the deploy seed). Vehicle classification at the event boundary uses `classifyVehicleSeatKind(vehicle)` — looks up `slot.vehicleType` via `vehicleToSlot` and routes to the pure-JS `isAircraftVehicleType(enum)` switch in `vehicles/vehicle-classification.ts`. **Does NOT use `mod.CompareVehicleName`** (documented unreliable per CQ_Bug_43).
  - **Classifier `getDesiredBoundaryViolationKind` is a pure read** of zone state + seatKind. The only remaining engine call is `safeGetSoldierStateVector` for the on-foot Y-ceiling check.
  - Spawn-time seed (`resetPlayerBoundaryStateOnDeploy` → `seedZoneStateFromSpawnContext`):
    1. **Slot-claim deploy** (HQ / Forward / Air buttons) — read `slot.pendingSpawnMode` + `slot.vehicleType`. Set zones and seatKind directly.
    2. **No slot, on-foot or pax-seat** — one-shot `mod.GetSoldierState(IsInVehicle)` probe → if seated, `classifyVehicleSeatKind`; otherwise `seatKind = "on_foot"`.
    3. **Squad spawn (v1.370)** — find nearest deployed teammate within `SQUAD_SPAWN_PROXIMITY_RADIUS_METERS` (25m) via `tryInheritZonesFromNearbyTeammate`. Copy `inOwnBuffer` / `inGCZ` / `inEnemyHQ` / `inEnemyBuffer` from teammate's cached state. Skip if teammate still in own deploy grace window.
    4. **HQ anchor probe** — `inOwnHQ` is always set by `isPlayerWithinOwnMainBaseAnchorRadius` (independent reliable signal; not inherited from teammate to avoid HQ-edge mismatch).
  - 1.5s grace window via `deployedAtSecondsByPid` covers any settle period after deploy.
  - Deploy scenarios (post-grace):
    - HQ deploy (on foot): inOwnHQ=true → safe (own-HQ short-circuit, even if outside trigger 666).
    - HQ Deploy slot (heli): seatKind=aircraft → exempt regardless of zone.
    - Forward deploy (vehicle): seatKind=ground_vehicle, inOwnBuffer=true and inGCZ=true → safe.
    - Air deploy (in aircraft): seatKind=aircraft → exempt regardless of zone.
    - Squad spawn (foot): inherits zone flags from nearest deployed teammate within 25m.
  - HQ-back-walk: trigger 500/501 exit event sets `inOwnHQ=false`; classifier returns `"ground_combat_zone"` (live) or `"prelive_main_base"` (pre-live) within 1s.
  - Pilot bail outside GCZ: `OnPlayerExitVehicle` fires → `setPlayerSeatKind(player, "on_foot")` → classifier reaches the safe-ground check, returns `"ground_combat_zone"`.
  - Historical context: SDK `Set*AllowedInSurroundingArea` v1.345–v1.356 did not exempt aircraft on this runtime (`design_doc/custom_gcz_restore_plan_2026-04-24.md`). v1.358–v1.359 patches failed because boundary state was scattered (`design_doc/zone_tracker_refactor_plan_2026-04-25.md` — v1.360 refactor). v1.367 enabled the AreaTriggers (`CQ_Feat_AreaTrigger_Enable`). v1.369 cached seatKind at events (`design_doc/event_driven_seat_state_plan_2026-04-25.md`). v1.370 added squad-spawn zone inheritance (`design_doc/squad_spawn_zone_inheritance_plan_2026-04-25.md`).
- Phase-state hooks:
  - before the match is live:
    - players may not leave their own main base
    - detection continues to use the existing own-main-base exit path that is already tracked today
    - on first violation, the offending player should be forced back to `NOT READY`
    - if the player remains outside their main base, the player should die on `10s` expiry
    - main-base vertical containment is authored in Godot and should be tuned there rather than via a separate script Y threshold
    - Phase 6 must hook this rule into the broader pre/post-match flow without breaking the current ready-state reset behavior
  - once the match is live:
    - enemy main-base buffer enforcement becomes active
    - this enemy buffer rule applies to players on foot and players in vehicles; aircraft are not exempt here
    - grounded-player ground-combat-zone enforcement remains active
  - post-match:
    - the transition matrix with Phase 7 must define whether these boundary kills fully disable, remain informational only, or continue until reset completes

Verification:

- `npm run verify`
- aircraft-vs-vehicle boundary behavior checks
- main-base out-of-bounds checks
- pre-live own-main-base leave checks confirming the existing exit detection still works after trigger ids move into map config
- live enemy main-base buffer checks:
  - enter enemy buffer
  - receive `3` second leave warning
  - survive if exiting in time
  - die if staying inside through expiry
- grounded combat-zone checks:
  - on-foot player outside zone receives `10` second return warning
  - ground vehicle occupant outside zone receives the same warning/kill path
  - helicopter/plane occupants are exempt while still airborne/in-aircraft
  - skydiving player is still treated as grounded and receives the same warning/kill path
  - grounded player survives if re-entering in time and dies on expiry if still outside
- collision validation for configured trigger/spawn ids before enabling a map
- kill-player out-of-bounds enforcement checks
- boundary checks across redeploy, undeploy, and team-swap transitions

Codex To-Do Checklist:

- [ ] Implement aircraft-vs-vehicle boundary distinction.
- [x] Implement main-base out-of-bounds enforcement.
- [x] Move main-base trigger ids out of hardcoded gameplay constants and into `MapConfig`, then add `MapConfig` fields for main-base buffers and the ground combat zone.
- [x] Implement enemy main-base buffer enforcement with a `3` second leave warning during live play and kill on expiry.
- [x] Implement grounded-player combat-zone enforcement with a `10` second return warning and kill on expiry.
- [x] Reuse one authoritative aircraft-classification helper for grounded-vs-aircraft boundary logic so Phase 5F aircraft handling and Phase 6 boundary logic cannot drift apart.
- [x] Validate object-id uniqueness/collisions for active-map boundary, support, and capture ids before enabling a map, using warn-first runtime diagnostics.
- [x] Kill players when out-of-bounds according to boundary rules.
- [ ] Decide whether enemy main-base flyovers need a dedicated altitude carveout beyond the authored trigger volumes.
- [ ] Run full boundary tests across team swap/redeploy/undeploy scenarios.

Phase Changelog:

- `Log policy`: append-only; newest entry first.
- `Current status`: `in_progress`
- `Implementation entry format`: `YYYY-MM-DD | summary | files changed | verification`
- `Design modification entry format`: `YYYY-MM-DD | trigger | proposed change | impacted CF/PD/Phase | decision status | required doc updates`
- `Entries`:
  - `2026-03-26 | Boundary vertical-authority simplification cleanup | Removed the temporary script Y-threshold layer for main bases and the ground combat zone, restored Godot-authored trigger geometry as the authoritative vertical boundary for those areas, kept only the aircraft exemption for the live ground out-of-bounds rule, and aligned the Phase 6 docs/checklists to that simpler model | Phase 6, design_doc/phase6_boundary_prompt_spec.md, src/config/types.ts, src/config/runtime.ts, src/config/map-runtime.ts, src/config/maps/operation-firestorm.ts, src/boundary/enforcement.ts, src/ready-dialog/takeoff-gating.ts, src/state/runtime-types.ts, src/state/runtime-state.ts, src/index/player-deploy.ts, src/index/player-join-leave.ts, src/ready-dialog/ready-reset.ts | accepted | Phase 6 boundary contract + prompt spec + checklist cleanup`
  - `2026-03-26 | Phase-scope refinement after boundary-first implementation decision | Narrowed Phase 6 to boundaries-only, set Phase 7 pre/post-match events as the next implementation target once current boundary tuning is accepted, and moved spawn behavior/restriction/fallback work into new Phase 8 | Phase 6, Phase 7, Phase 8, Phase 9, Phase 10, Phase 11, Phase 12, Phase 13, Phase 14 | accepted | current status + TOC + Phase 6/7/8 scopes/checklists`
  - `2026-03-26 | Phase 6 baseline boundary implementation pass | Added the first-pass cached offender-local Phase 6 prompt family and runtime enforcement path: pre-live own-main-base violations now force NOT READY without cancelling the countdown, live enemy main-base buffer warnings kill on `3s` expiry, ground combat-zone warnings kill on `10s` expiry, the shared aircraft-classification helper is now the authoritative boundary/spawn classifier, and later follow-up work added warn-first active-map ObjId validation plus an offender-only `SFX_Alarm` prototype pending human approval | src/config/types.ts, src/config/runtime.ts, src/config/map-runtime.ts, src/config/maps/operation-firestorm.ts, src/vehicles/vehicle-classification.ts, src/vehicles/spawner-bind.ts, src/state/runtime-types.ts, src/state/runtime-state.ts, src/state/hud-cache-types.ts, src/foundation/gameplay.ts, src/foundation/string-keys.ts, src/strings.json, src/boundary/prompt-ui.ts, src/boundary/enforcement.ts, src/index/area-triggers.ts, src/ready-dialog/takeoff-gating.ts, src/index/game-mode.ts, src/index/player-deploy.ts, src/index/player-join-leave.ts, src/interaction/actions.ts, src/conquest-flow.ts, src/index.ts | `npm run verify`, `npx tsc --pretty false --noEmit```
  - `2026-03-22 | Phase ordering swap request | Renumbered Basic Spawn and Boundaries System from Phase 7 to Phase 6 because boundary-zone functionality now gates the later pre/post-match design; historical entries below may still reference the prior numbering | Phase 6, Phase 7 | accepted | TOC + current-status target + Phase 6/7 section order + consistency pass`
  - `2026-03-22 | Phase 6 boundary-zone detail request | Added the concrete Phase 6 zone contract for existing main bases, new main-base buffers, and a new ground combat zone; locked the live enemy-buffer `5s` warning/kill rule, the always-active grounded combat-zone `10s` warning/kill rule, the pre-live own-main-base leave restriction hook, and the requirement to move these trigger ids into map config with explicit collision review for the current Firestorm `503` overlap | Phase 6 | accepted | Phase 6 deliverables + prerequisites + verification + zone contract + checklist + changelog`

<a id="phase-7"></a>
### Phase 7: Pre & Post Match Events

Deliverables:

- final result UI + delayed finalize/end flow
- ready-up dialog cleanup and end-of-round transition cleanup
- redesign join prompt
- optional physical ready-up flow using shared main-base world interactables configured from placed `WorldIcon` + `InteractPoint` pairs
- explicit map-config-driven world-interactable ObjId arrays for retained main-base and point interactables
- retained world-interactable routing contract:
  - main-base interactables start at `1000` and are authored as even/odd pairs
  - even `objId` opens the existing ready-up dialog
  - odd `objId` opens a vehicle spawn menu that reuses the current vehicle deploy HUD shell with teleport-based button fulfillment
  - point interactables use explicit `1050-1099` objIds and route to a new ammo resupply menu for launcher/gadget/ammo changes
  - main-base icon visibility is owned by per-player runtime HQ gating, while authored Godot `WorldIcon` + `InteractPoint` pairs still provide the shared terminal anchors
- defined round-start behavior limitations and accepted constraints
- reset/setup staging flow reintroduced from helis mode so pre-live vehicle config changes can force a clean vehicle spawn state before round start

Implementation sequencing note:

- Core Phase 7 work should start with:
  - end-of-round state machine
  - frozen result snapshot
  - result UI
  - join-prompt redesign
  - reset/setup staging semantics
- Optional world-interactable extensions should not block core Phase 7 progress:
  - physical ready-up terminals
  - world-interactable ready-dialog terminals
  - world-interactable vehicle spawn menu
  - world-interactable ammo resupply menu
- Phase 8 remains the phase that owns broader authored spawn behavior/restriction/fallback work.

Mapped clarifications:

- `CF-16` and scoreboard formatting dependency `CF-41`

Godot/map prerequisites:

- optional camera anchors only if cinematic flow is added
- authored/placed main-base and point `WorldIcon` + `InteractPoint` pairs for every retained world interactable
- explicit `MapConfig.mainBaseInteractableObjIds[]` and `MapConfig.gadgetInteractableObjIds[]` coverage for every retained interactable object id; do not rely on global range scans without a concrete map-config entry
- first-pass authored object requirements remain in Godot:
  - `WorldIcon` and `InteractPoint` placement
  - icon image
  - color
  - visibility ownership
  - visibility range
  - icon alpha/opacity
- main-base authoring rule: start at `1000`, authored as even/odd pairs, with even reserved for ready dialog and odd reserved for vehicle spawn menu
- point authoring rule: use explicit `1050-1099` objIds and route all of them to the ammo resupply menu

Verification:

- `npm run verify`
- final ticket/result accuracy and single end transition check
- ready-up dialog cleanup/regression checks across pre-match, live, and post-match transitions
- redesigned join-prompt behavior/regression checks across initial join, reconnect, and live-state handoff
- map-config world-interactable array validation: unique ids, explicit entries, and even/odd or `1050-1099` rule compliance
- world icon image/color/team-visibility checks across all retained interactables
- visibility range + alpha/opacity validation against authored object settings unless a verified runtime setter is later added
- physical ready-up interactable ownership/availability checks across pre-match, reconnect, and live-state lockout
- `OnPlayerInteract` dispatch checks confirming even main-base ids open ready dialog, odd main-base ids route to vehicle spawn menu, and point ids route to ammo resupply
- vehicle spawn menu checks confirming the reused deploy-HUD shell shows with a dedicated back plate and the button handlers teleport instead of forcing deploy/undeploy
- ammo resupply menu checks confirming the new menu can mutate launcher/gadget presence and ammo counts according to the locked slot rules
- round-start behavior limitation review and documentation pass
- reset/setup staging check confirming grounded stale vehicles do not block newly configured round-start vehicle spawns when the match is made live

Open design questions / locks still needed before implementation:

- end-of-round state machine:
  - define the exact lifecycle phases after live play ends
  - define what locks immediately on end latch versus what may still update during delayed finalize/result display
  - define reconnect/join behavior during each post-match phase
- frozen result snapshot schema:
  - lock the exact snapshot fields captured at the first successful end latch
  - resolve how `CF-16` mandatory post-match fields interact with later scoreboard/KPI work in Phase 9
  - decide whether Phase 7 shows a reduced result surface or carries limited backend aggregation forward before the full scoreboard phase
- result UI composition:
  - lock the exact visible fields, ownership, and timing of the result UI
  - define whether it is an overlay, a replacement screen, or a staged transition off the current victory dialog shell
- join-prompt redesign:
  - define first-join, reconnect, live-round, and post-match behavior
  - define dismissal persistence and whether the prompt remains informational only or becomes action-bearing
- physical ready-up path:
  - keep it in Phase 7 as a complement to the current ready-dialog access path, not an immediate replacement
  - route authored main-base ready-dialog interactables through the existing exported `OnPlayerInteract` entrypoint so ready-dialog ownership remains single-source
- world-interactable object contract:
  - lock final icon art + color vectors so ready-dialog, vehicle-spawn, and ammo-resupply interactables are readable at a glance
  - define whether visibility range + alpha/opacity are script-applied later or treated as authored-only values until a verified runtime setter exists
  - lock the teleport-arrival contract for the reused vehicle spawn menu (`teleport the player` instead of deploy fulfillment)
  - lock the gadget-slot ownership, persistence, cooldown, and reset rules for the ammo resupply menu
- map-config schema lock for world interactables:
  - lock the exact `MapConfig.mainBaseInteractableObjIds[]` / `MapConfig.gadgetInteractableObjIds[]` shape and validator behavior
  - keep the explicit map-config arrays authoritative even when range/parity conventions are also enforced
- round-start behavior limitations:
  - define exactly what can change pre-live, what requires setup/reset, and what is forbidden once the match is live
  - define how config changes interact with already-deployed players, already-spawned vehicles, and pending claims/reservations
- reset/setup staging semantics:
  - lock whether setup/reset is manual, automatic, admin-only, or pre-live only
  - define exactly what gets cleared or rebuilt:
    - stale grounded vehicles
    - active spawned vehicles
    - pending deploy claims
    - reservations
    - timers
    - player deploy state
- pre-match/live/post-match transition matrix:
  - define explicit visibility/input ownership for:
    - ready dialog
    - countdown UI
    - join prompt
    - main-base and point world interactables
    - result UI
    - admin/debug surfaces
  - prevent Phase 7 from reintroducing the ownership ambiguity already cleaned out of Phase 5G

Human-owned design input still needed before full Phase 7 implementation:

- core flow decisions:
  - final end-of-round state machine
  - frozen result snapshot contents
  - result UI composition and timing
  - join-prompt behavior across first join, reconnect, live, and post-match
  - reset/setup semantics and what gets cleared/rebuilt
  - pre-match/live/post-match transition matrix
- optional world-interactable decisions:
  - whether physical ready-up stays in Phase 7 or is deferred
  - final icon art/color language for each interactable family
  - whether world-icon range/alpha stay authored-only or require runtime enforcement later
  - teleport-arrival contract for the world vehicle-spawn menu
  - gadget-slot ownership/persistence/reset rules for the ammo resupply menu

World interactable feature contract:

- Objective:
  - add a reusable map-config-driven world-interactable classification layer built from placed `WorldIcon` + `InteractPoint` pairs keyed by explicit object id arrays
- Current shipped checkpoint:
  - even main-base ids now hide the shared authored `WorldIcon`, show a per-player runtime `READY` icon only while that player is deployed inside their own HQ, keep the authored interact point enabled, and open the existing ready dialog
  - odd main-base ids now hide the shared authored `WorldIcon`, show a per-player runtime `DEPLOY` icon only while that player is deployed inside their own HQ, keep the authored interact point enabled, and open the in-world live deploy menu that reuses the deploy-screen vehicle HUD family
  - point/ammo interactables now hide the shared authored `WorldIcon`, show a per-player runtime red `AMMO` explosion icon only while that deployed player is inside the same-id authored point-local `AreaTrigger`, keep the authored interact point enabled, and open a dedicated center-screen ammo resupply modal when interacted with
  - the current ammo resupply modal uses only verified 2D gadget-image UI paths: a large `AddUIGadgetImage(...)` ammo-drop hero icon, four launcher pickup rows with icon-button + label + right-side status, three ammo-charge icon buttons with per-charge timers, and a centered bottom close button
  - per-player visibility is currently implemented for the icon layer only; authored interact points remain shared and activation is still gated in script by team/HQ state or left globally available where the menu contract is still deferred
  - current accepted regression record for the main-base slice lives in `design_doc/conquest_issues.md` so future HUD/world-terminal regressions can be compared against the resolved fixes before new changes are made
- Locked first-pass direction:
  - `MapConfig.mainBaseInteractableObjIds[]` and `MapConfig.gadgetInteractableObjIds[]` are the authoritative explicit lists for retained interactables on a map; runtime must not discover them by scanning ids alone
  - Phase 7 world interactables are shared authored objects, not per-player runtime-spawned interact points
  - first-pass runtime should derive scope/action from the authored array plus the locked range/parity rubric
  - even and odd main-base terminals keep authored `WorldIcon` + `InteractPoint` pairs with the same numeric id, but the shared authored `WorldIcon` is only an anchor object and script owns the actual visible per-player icon
  - interaction dispatch keys off configured object ids from `mod.GetObjId(eventInteractPoint)` inside the existing `OnPlayerInteract` export
  - main-base routing contract:
    - start at `1000`
    - even `objId` => `open_ready_dialog`
    - odd `objId` => `open_vehicle_spawn_menu`
  - point routing contract:
    - use explicit `1050-1099` objIds
    - all point interactables => `open_ammo_resupply_menu`
  - team visibility, icon art, visibility range, and alpha/opacity stay authored on the placed Godot objects in this first pass unless later schema expansion is needed
  - keep the current ready-dialog open path as fallback while the physical terminal flow is validated
- First-pass required map-config data:
  - `mainBaseInteractableObjIds[]`
  - `gadgetInteractableObjIds[]`
  - `gadgetInteractableAnchors[]` when authored runtime `WorldIcon` position lookup is unreliable and the point/ammo icon layer needs explicit authored placement data
- First-pass authored object requirements:
  - matching `WorldIcon` + `InteractPoint` objects in Godot
  - correct image/color/visibility settings on those placed objects
- Phase-state rules:
  - pre-match/setup: main-base even/odd pairs may be enabled; point ammo interactables may show only their area-trigger-gated icon layer while the ammo menu remains deferred
  - live: main-base ready-dialog and vehicle-spawn interactables are approved for use; point ammo interactables may expose shared interact points while their icon layer remains area-trigger-gated and the ammo resupply menu is still deferred
  - post-match/result display: disable all world interactables unless ownership explicitly returns to setup/reset
- Vehicle spawn menu contract:
  - reuse as much of the current vehicle deploy HUD family as possible:
    - row cache/build/reveal path in `src/vehicles/deploy-timer-ui.ts`
    - tracked slot inventory, row order, labels, timers, and current air/ground action buttons
    - existing hover/focus/pressed visual-state handling and input routing
  - add a dedicated dark/blur back plate behind the reused root so the panel stays readable when opened in-world over live gameplay
  - do not fork a second vehicle-slot/timer UI model if the current deploy HUD widgets can be shown directly with different ownership and action callbacks
  - swap only the button-fulfillment behavior:
    - current deploy path claims a slot and routes through `beginVehicleDirectSpawnDeployForPlayer(...)`
    - world-menu path should route through an already-alive fulfillment handler that claims/spawns/seats directly without going through undeploy/deploy
  - keep the same vehicle list + button layout unless teleport semantics force a clearly different wording pass later
  - current shipped checkpoint for this menu:
    - reuse the current deploy HUD root and row positions for an in-world alive-player variant
    - add a dedicated right-side backplate behind the actionable columns so the live panel stays readable over gameplay without obscuring the full row lane
    - place the dedicated `Close` action below the row stack so it dismisses the live menu without affecting player state
    - keep the current row button order, timer surfaces, and button positioning so the in-world version stays visually aligned with the deploy-screen version
    - keep the same practical vehicle outcome as the deploy screen, with only the final deploy/undeploy step removed because the player is already alive
- Code-budget cleanup backlog:
  - goal:
    - recover durable bundle headroom before additional Phase 7 and Phase 8 features land
  - confirmed non-wins:
    - `src/Changelog.ts` is large in source, but it is not part of the emitted runtime bundle and should not be treated as a bundle-size recovery target
  - safe-delete-now targets:
    - remove permanently-disabled debug/help branches that are hard-gated off in `src/foundation/gameplay.ts`
    - remove dead highlighted-world-log debug counters that are written but not consumed by gameplay or UI
    - remove dead helper functions retained only for possible future admin/test reuse when they have no callers
    - remove dormant ready-dialog debug-timelimit UI scaffolding if that path remains disabled
    - remove roster debug-placeholder scaffolding if placeholder counts remain fixed at zero
  - low-risk cleanup order for the next headroom pass:
    - first: permanently-disabled debug/help branches plus dead debug counters/helpers
    - second: dormant ready-dialog debug-timelimit and roster-placeholder scaffolding
    - third: emitted comment stripping / other no-feature build-output reductions
    - fourth: only if still needed, ship-scope decisions around admin/tester tooling
  - safe-delete-later if tester tooling is no longer required in shipping bundle:
    - admin-panel UI build/event/visibility modules
    - position-debug widget family and its vehicle/soldier transform sampling loop
  - refactor-for-size targets:
    - `src/vehicles/deploy-timer-ui.ts` is the largest active UI owner and should be compacted before additional menu growth
    - prioritize consolidating repeated plate builders, button builders, button visual-state handlers, and row visibility/reset helpers
    - avoid rebuilding the full vehicle HUD tree for content-only refreshes; prefer render-signature invalidation plus in-place refresh
  - gameplay features that should stay intact while cleanup happens:
    - capture sounds remain required V1 scope
    - accepted objective VO lane remains active
    - ready dialog, victory dialog, world interactables, and live deploy menu remain production-owned features
  - build-pipeline recovery target:
    - emitted runtime comments should be stripped so bundle bytes are reserved for gameplay/UI logic rather than source commentary
  - future map-config caution:
    - explicit world-interactable anchor data is acceptable now, but additional maps should use a compact authored schema so Phase 7 icon-anchor data does not bloat linearly per map
- Ammo resupply menu contract:
  - build this as a wholly new menu; it should not reuse the vehicle deploy HUD shell
  - current accepted functional shell:
    - centered square modal
    - centered bottom close button
    - large hero icon rendered through verified `AddUIGadgetImage(...)`
    - four launcher pickup rows: `RPG`, `IGLA`, `Stinger`, `AT4`
    - each launcher row uses an icon button, a text label, and a right-side `READY` or countdown status
    - all four launcher rows share one `180` second cooldown once any launcher is taken
    - three ammo-charge icon buttons sit below the launcher rows
    - each ammo-charge button owns its own `60` second cooldown
    - ammo-charge buttons only attempt to resupply managed rocket-launcher ammo, not general inventory ammo
    - as of v1.304–v1.313 the player picks the target slot via a per-class slot-toggle row under each class header; default is `InventorySlots.GadgetTwo` at round start, preference is stored in `State.players.lockerSlotToggle[pid]` and persists across close/reopen (v1.313). Probe on open derives actual slot contents into `State.players.lockerSlots[pid]` via `probeLauncherSlot` (slot-based `RemoveEquipment` + `HasEquipment` diff, candidates narrowed to the 4 engineer buckets in `ENGINEER_GADGET_CANDIDATES`).
    - temporary icon evaluation should stay on the verified 2D UI paths only; do not rely on unverified string-key icon registries
    - current accepted ammo-button icon path is the verified `AddUIGadgetImage(...)` gadget-image route, using `CallIn_Ammo_Drop` as the safe ammo-box proxy until a better verified 2D icon source is locked
  - initial scope:
    - replenish rocket ammo
    - replenish demolition charge / C4 ammo
    - acquire or replace launcher gadgets such as RPG / Stinger / IGLA labels
    - modify the player gadget slots and gadget ammo counts under one authoritative menu flow
  - authoring note:
    - `WeaponCase_AR_01` and `WeaponCase_Sniper_01` are approved universal world props for this menu family
    - treat both as indestructible and available on all maps
  - locally verified runtime mutation surface that may back this menu:
    - `AddEquipment(...)`
    - `RemoveEquipment(...)`
    - `HasEquipment(...)`
    - `SetInventoryAmmo(...)`
    - `SetInventoryMagazineAmmo(...)`
    - `Resupply(...)`
  - verified 2D UI icon reference:
    - for 2D UI there are 3 separate buckets
    - generic UI images via `AddUIImage(...)`
    - these are the only explicitly listed generic 2D UI icons in `UIImageType`
    - `mod.UIImageType.CrownOutline`
    - `mod.UIImageType.CrownSolid`
    - `mod.UIImageType.None`
    - `mod.UIImageType.QuestionMark`
    - `mod.UIImageType.RifleAmmo`
    - `mod.UIImageType.SelfHeal`
    - `mod.UIImageType.SpawnBeacon`
    - `mod.UIImageType.TEMP_PortalIcon`
    - gadget images via `AddUIGadgetImage(...)`
    - this is where most of the extra 2D menu icons come from; the SDK exposes `AddUIGadgetImage(name, position, size, anchor, gadget: Gadgets, parent, ...)`, so the image list is effectively the `Gadgets` enum rather than a separate icon enum
    - best practical menu-icon set therefore includes gadget-derived images for things like:
    - call-ins:
    - `CallIn_Air_Strike`
    - `CallIn_Ammo_Drop`
    - `CallIn_Anti_Vehicle_Drop`
    - `CallIn_Artillery_Strike`
    - `CallIn_Smoke_Screen`
    - `CallIn_UAV_Overwatch`
    - `CallIn_Weapon_Drop`
    - class gadgets:
    - `Class_Adrenaline_Injector`
    - `Class_Motion_Sensor`
    - `Class_Repair_Tool`
    - `Class_Supply_Bag`
    - deployables:
    - `Deployable_Cover`
    - `Deployable_Deploy_Beacon`
    - `Deployable_EOD_Bot`
    - `Deployable_Grenade_Intercept_System`
    - `Deployable_Missile_Intercept_System`
    - `Deployable_Portable_Mortar`
    - `Deployable_Recon_Drone`
    - `Deployable_Vehicle_Supply_Crate`
    - launchers:
    - `Launcher_Aim_Guided`
    - `Launcher_Air_Defense`
    - `Launcher_Auto_Guided`
    - `Launcher_Breaching_Projectile`
    - `Launcher_High_Explosive`
    - `Launcher_Incendiary_Airburst`
    - `Launcher_Long_Range`
    - `Launcher_Smoke_Grenade`
    - `Launcher_Thermobaric_Grenade`
    - `Launcher_Unguided_Rocket`
    - melee:
    - `Melee_Combat_Knife`
    - `Melee_Hunting_Knife`
    - `Melee_Sledgehammer`
    - misc:
    - `Misc_Acoustic_Sensor_AV_Mine`
    - `Misc_Anti_Personnel_Mine`
    - `Misc_Anti_Vehicle_Mine`
    - `Misc_Assault_Ladder`
    - `Misc_Defibrillator`
    - `Misc_Demolition_Charge`
    - `Misc_Incendiary_Round_Shotgun`
    - `Misc_Laser_Designator`
    - `Misc_Sniper_Decoy`
    - `Misc_Supply_Pouch`
    - `Misc_Tracer_Dart`
    - `Misc_Tripwire_Sensor_AV_Mine`
    - throwables:
    - `Throwable_Anti_Vehicle_Grenade`
    - `Throwable_Flash_Grenade`
    - `Throwable_Fragmentation_Grenade`
    - `Throwable_Incendiary_Grenade`
    - `Throwable_Mini_Frag_Grenade`
    - `Throwable_Proximity_Detector`
    - `Throwable_Smoke_Grenade`
    - `Throwable_Stun_Grenade`
    - `Throwable_Throwing_Knife`
    - weapon images via `AddUIWeaponImage(...)`
    - `AddUIWeaponImage(...)` is locally verified, including overloads with optional `WeaponPackage` and `Player | Team` visibility
    - the usable image list is therefore the `Weapons` enum
    - examples:
    - assault rifles:
    - `AssaultRifle_AK4D`
    - `AssaultRifle_B36A4`
    - `AssaultRifle_KORD_6P67`
    - `AssaultRifle_L85A3`
    - `AssaultRifle_M433`
    - `AssaultRifle_NVO_228E`
    - `AssaultRifle_SOR_556_Mk2`
    - `AssaultRifle_TR_7`
    - carbines:
    - `Carbine_AK_205`
    - `Carbine_GRT_BC`
    - `Carbine_M277`
    - `Carbine_M417_A2`
    - `Carbine_M4A1`
    - `Carbine_QBZ_192`
    - `Carbine_SG_553R`
    - `Carbine_SOR_300SC`
    - DMRs:
    - `DMR_LMR27`
    - `DMR_M39_EMR`
    - `DMR_SVDM`
    - `DMR_SVK_86`
    - LMGs:
    - `LMG_DRS_IAR`
    - `LMG_KTS100_MK8`
    - `LMG_L110`
    - `LMG_M_60`
    - `LMG_M123K`
    - `LMG_M240L`
    - `LMG_M250`
    - `LMG_RPKM`
    - shotguns:
    - `Shotgun__185KS_K`
    - `Shotgun_M1014`
    - `Shotgun_M87A1`
    - sidearms:
    - `Sidearm_ES_57`
    - `Sidearm_GGH_22`
    - `Sidearm_M44`
    - `Sidearm_M45A1`
    - `Sidearm_P18`
    - SMGs:
    - `SMG_KV9`
    - `SMG_PW5A3`
    - `SMG_PW7A2`
    - `SMG_SCW_10`
    - `SMG_SGX`
    - `SMG_SL9`
    - `SMG_UMG_40`
    - `SMG_USG_90`
    - snipers:
    - `Sniper_M2010_ESR`
    - `Sniper_Mini_Scout`
    - `Sniper_PSR`
    - `Sniper_SV_98`
    - best non-handwavy summary:
    - 8 generic `UIImageType` icons
    - all `Gadgets` as gadget-image icons
    - all `Weapons` as weapon-image icons
    - explicitly do not assume arbitrary `UI_Gadget_*`, `UI_Weapon_*`, `UI_Vehicle_*`, or `UI_Icon_*` string keys are valid unless a working key is verified in this project
  - exact mapping of player-facing launcher names (`RPG`, `Stinger`, `IGLA`) onto validated `mod.Gadgets` entries must be locked during implementation
  - exact slot ownership (`GadgetOne`, `GadgetTwo`, `ClassGadget`, `MiscGadget`) and persistence/reset rules must be locked before implementation
  - point/ammo implementation prerequisites still needed:
    - define the actual ammo-crate interaction/menu contract in writing before the actual menu/UI work resumes
    - author custom Godot point-local `AreaTrigger` volumes for those interactables
    - decide whether those point-local trigger ids need explicit `MapConfig` ownership or can remain purely authored/map-side data
    - lock whether point/ammo interact prompts stay always available or later become area-gated alongside the icon layer
  - next optional world-interactable slice:
    - document the ammo-crate menu behavior first
    - author the point-local Godot trigger volumes second
    - only then wire the point interactables live
- Implementation routing notes:
  - load the active interactable ObjId arrays from map config into lookup tables keyed by `objId`
  - derive `scope` / `action` from the source array plus the locked even/odd and `1050-1099` rubric
  - validate unique ids, explicit array coverage, even/odd main-base pair rules, and `1050-1099` point rules before enabling the interactables
  - treat image/color/visibility/range/alpha as authored-object validation concerns in the first pass
  - ready-dialog interactables should call the same local dialog-open path already used by the current interact flow so UI ownership stays single-source
  - vehicle-spawn interactables should route through a menu-open path that reuses the current vehicle deploy HUD and swaps in teleport fulfillment callbacks
  - ammo-resupply interactables should route through a dedicated new menu owner/path rather than piggybacking on ready-dialog or vehicle-HUD ownership
- Reference implementation shape (`mod` API surface in this snippet is locally verified; local Conquest handler names are design placeholders unless they already exist):

```ts
type WorldInteractableAction = 'open_ready_dialog' | 'open_vehicle_spawn_menu' | 'open_ammo_resupply_menu';
type WorldInteractableScope = 'main_base' | 'point';

type WorldInteractableAction = 'open_ready_dialog' | 'open_vehicle_spawn_menu' | 'open_ammo_resupply_menu';

const MAIN_BASE_INTERACTABLE_OBJ_IDS = [1000, 1001, 1002, 1003];
const FLAG_INTERACTABLE_OBJ_IDS = [1050, 1051];

function resolveWorldInteractableAction(objId: number): WorldInteractableAction | undefined {
    if (objId >= 1000 && objId <= 1049) {
        return objId % 2 === 0
            ? 'open_ready_dialog'
            : 'open_vehicle_spawn_menu';
    }

    if (objId >= 1050 && objId <= 1099) {
        return 'open_ammo_resupply_menu';
    }

    return undefined;
}

export function OnPlayerInteract(eventPlayer: mod.Player, eventInteractPoint: mod.InteractPoint): void {
    const objId = mod.GetObjId(eventInteractPoint);
    const action = resolveWorldInteractableAction(objId);
    if (!action) return;

    if (action === 'open_ready_dialog') {
        openReadyDialogFromWorldTerminal(eventPlayer); // local Conquest hook; reuse existing ready-dialog path
        return;
    }

    if (action === 'open_vehicle_spawn_menu') {
        openVehicleSpawnMenu(eventPlayer); // reuse current vehicle deploy HUD shell with teleport-based fulfillment
        return;
    }

    openAmmoResupplyMenu(eventPlayer); // new menu for launcher/gadget/ammo mutation
}
```

Recommended supporting design docs before Phase 7 implementation:

- `phase7_end_flow_and_result_snapshot.md`
- `phase7_round_start_and_setup.md`
- `phase7_join_prompt_redesign.md`
- `phase7_ready_up_transition_matrix.md`
- `phase7_physical_ready_up_decision.md`
- `phase7_world_interactables.md`

Codex To-Do Checklist:

- [ ] Implement post-match result screen fields using frozen end snapshot only.
- [ ] Enforce single end transition path through end latch (no duplicate finalize paths).
- [ ] Clean up the ready-up dialog for pre-match/post-match transition correctness and ownership clarity.
- [ ] Redesign the join prompt and validate its ownership/flow across first join, reconnect, and transition to match-live state.
- [x] Extend `MapConfig` with explicit `mainBaseInteractableObjIds[]` and `gadgetInteractableObjIds[]` arrays.
- [ ] Validate unique world-interactable ids plus the main-base even/odd pair rule and the `1050-1099` point rule before enabling any interactable.
- [x] Route even main-base ids into the existing ready-dialog open path without creating a second UI owner.
- [x] Reuse the current vehicle deploy HUD shell for odd main-base ids, add a clean back plate, and replace deploy/undeploy fulfillment with teleport-based button handlers.
- [x] Show point/ammo interactable runtime icons per-player only while the player is inside the same-id authored point-local `AreaTrigger`.
- [ ] Design and build the new ammo resupply menu for point interactables, including gadget-slot ownership and launcher/ammo mutation rules.
- [x] Apply per-player HQ/team visibility for main-base terminal icons through runtime icon ownership and script gating.
- [ ] Validate interactable state gating across pre-match, reconnect, live lockout, and post-match/result ownership.
- [ ] Determine and document round-start behavior limitations before expanding pre/post-match event flow.
- [ ] Reintroduce the helis-mode reset/setup button for pre-match staging so changed vehicle configurations can clear stale grounded vehicles before live round start.
- [ ] Validate winner/result/ticket/elapsed accuracy against authoritative snapshot.
- [ ] Validate delayed finalize/end flow under normal and edge-case match endings.

Phase Changelog:

- `Log policy`: append-only; newest entry first.
- `Current status`: `not_started`
- `Implementation entry format`: `YYYY-MM-DD | summary | files changed | verification`
- `Design modification entry format`: `YYYY-MM-DD | trigger | proposed change | impacted CF/PD/Phase | decision status | required doc updates`
- `Entries`:
  - `2026-03-28 | Point/ammo interactable icon gating follow-up | Renamed the explicit point interactable list to `MapConfig.gadgetInteractableObjIds[]`, kept the shared authored `InteractPoint` live, and implemented per-player runtime `AMMO` explosion icons that only appear while a deployed player is inside the same-id authored point-local `AreaTrigger`; the actual ammo menu remains deferred | Phase 7, CF-119, CF-120, CF-121 | accepted | current status + world-interactable contract + ammo prerequisites + checklist consistency`
  - `2026-03-28 | Main-base terminal acceptance + regression capture sync | Recorded the accepted current Phase 7 world-terminal checkpoint: even `READY` and odd `DEPLOY` main-base terminals are now functional, per-player icon placement/visibility uses explicit authored anchor data plus own-HQ gating, the live deploy menu reuses the deploy HUD shell, passive deployed vehicle-HUD refresh after config apply is back on hidden-prebuild/reveal ownership, and the next optional world-interactable slice is the point/ammo menu plus custom Godot-authored point-local `AreaTrigger` volumes | Phase 7, CF-119, CF-120, CF-121 | accepted | current status + world-interactable contract + ammo prerequisites + cleanup backlog + checklist + issues tracker consistency`
  - `2026-03-27 | Main-base terminal icon ownership follow-up | Replaced the shared authored main-base world-icon visibility model with per-player runtime `AddUIIcon(...)` ownership anchored to the authored `WorldIcon` + `InteractPoint` pair, restricted icon visibility to players deployed inside their own HQ, and clarified that authored interact points remain shared while script gates activation by team/HQ state | Phase 7, CF-121 | accepted | world-interactable contract + implementation notes + schema constraints + rubric sync`
  - `2026-03-22 | Phase ordering swap request | Renumbered Pre & Post Match Events from Phase 6 to Phase 7 because functional boundary-zone work was promoted ahead of it; historical entries below may still reference the prior numbering | Phase 6, Phase 7 | accepted | TOC + current-status target + Phase 6/7 section order + consistency pass`
  - `2026-03-22 | Vehicle-spawn menu reuse and ammo-menu scope follow-up | Locked the odd main-base vehicle spawn menu to reuse the current vehicle deploy HUD shell with a dedicated back plate and teleport-based button fulfillment instead of deploy/undeploy flow, and defined the point ammo resupply menu as a wholly new UI responsible for launcher/gadget presence and ammo mutation using the locally verified equipment/ammo API surface | Phase 7 | accepted | Phase 7 deliverables + verification + open questions + world-interactable contract + checklist`
  - `2026-03-22 | World-interactable map-config and object-id follow-up | Extended the Phase 7 world-interactable design so every interactable is defined explicitly in map config per object id, locked the main-base even/odd objId routing (`1000+` ready dialog / vehicle spawn menu pairs), moved ammo resupply to explicit `1050+` point interactables, and added per-object team visibility/range/alpha requirements with a note that only team visibility currently has a verified runtime setter in local refs | Phase 7, CF-119, CF-120, CF-121 | accepted | map-schema rules + Phase 7 deliverables/prereqs/verification/open questions/contract/checklist`
  - `2026-03-22 | Phase 7 world-interactable feature design request | Added a concrete Phase 7 main-base world-interactable terminal contract using placed WorldIcon + InteractPoint pairs, locked ready-up as the first retained terminal action, and reserved a second ammo/rockets terminal route as a deferred menu/function hook with shared interaction dispatch/state-gating rules | Phase 7 | accepted | deliverables + prerequisites + verification + open questions + world-interactable contract + supporting docs + checklist`
  - `2026-03-18 | Phase 7 design-lock capture pass | Added the concrete open design questions that still need written decisions before implementation starts: end-flow state machine, frozen result snapshot schema, result UI composition, join-prompt redesign, physical ready-up keep/defer decision, round-start limitation rules, reset/setup semantics, and the pre-match/live/post-match transition matrix | Phase 7 | accepted | Phase 7 verification/open-questions block + top-level current-status sync`
  - `2026-03-18 | Phase ordering update request | Moved Pre & Post Match Events ahead of the spawn/boundaries and scoreboard phases so the large planned flow changes are treated as the next post-Phase-5 system bucket; later reordered behind boundaries as Phase 7 | Phase 6, Phase 7, Phase 9 | accepted | TOC + phase section ordering + downstream phase references updated`
  - `2026-03-18 | Pre-live vehicle-config follow-up request | Reintroduced helis-mode reset/setup button as a Phase 7 pre/post-match staging requirement so stale grounded vehicles can be cleared before live round start after config changes | Phase 7 | accepted | deliverables, verification, and checklist updated`

<a id="phase-8"></a>
### Phase 8: Spawn Behavior and Restrictions

Deliverables:

- script-driven spawner system with absolute certainty that flag deploy uses our authored spawn positions
- 10 authored spawn positions per team per flag, stored in map config (same pattern as vehicle spawner slots)
- random spawn-point selection with full randomization (no weighting, no bias)
- ownership-gated spawning: you own the flag or you don't spawn there (no fallback chain)
- clean extensibility hooks for future logic (Phase 13 advanced contract) without enabling any in this pass
- Godot PlayerSpawner objects authored per flag (script-first control, confirmed approach)
- clear diagnostics for missing/invalid spawn sets per validator policy

Mapped clarifications:

- `CF-23`, `CF-24`, `CF-25`, `CF-63`, `CF-72`, `CF-73`, `CF-80`, `CF-86`

Godot/map prerequisites:

- authored PlayerSpawner objects per flag per team in Godot (10 per team per flag)
- spawn point IDs recorded and mapped to map config
- Phase 6 boundary rules accepted so spawn eligibility is not competing with unstable out-of-bounds logic
- Phase 7 pre/post-match flow accepted enough that spawn eligibility/reset handoff is stable

#### Detailed Design

##### Core Architecture

The spawn system follows the same pattern as the vehicle spawner slot system: map-authored positions stored in `MapConfig`, managed by runtime state, and executed by script-authoritative logic.

**Key principle:** The script must have absolute control over where players spawn when deploying on a flag. The engine's default flag spawn behavior must be overridden or intercepted so that every flag deploy goes through our authored spawn positions.

##### API Foundation

Verified BF6 Portal APIs for spawn control:

| API | Signature | Purpose |
|-----|-----------|---------|
| `SpawnPlayerFromSpawnPoint` | `(player: Player, spawnPointId: number \| SpawnPoint): void` | Force-deploy player at specific spawn point (proven in vehicle direct-spawn) |
| `GetSpawnPoint` | `(number): SpawnPoint` | Resolve SpawnPoint object from Godot ID |
| `EnableCapturePointDeploying` | `(capturePoint: CapturePoint, enableDeploying: boolean): void` | Enable/disable deploying on a specific capture point |
| `EnablePlayerDeploy` | `(player: Player, deployAllowed: boolean): void` | Per-player deploy gate |
| `SetRedeployTime` | `(player: Player, redeployTime: number): void` | Override redeploy timer per player (0-60s). Useful for script-controlled deploy timing on join |
| `OnPlayerDeployed` | event | Fires after player successfully deploys — confirmed correct hook for triggering script-driven spawn relocation |

**Critical finding:** There is no `OnPlayerRequestSpawn` or pre-deploy interception event, and no verified hook for "player selected this flag, now override the exact child spawn choice." The engine fires `OnPlayerDeployed` *after* the player has already spawned. Partial override of the engine's per-flag spawn selection is not reliably achievable.

**Accepted approach: Fully script-driven spawning.**
- Disable engine flag deploying via `EnableCapturePointDeploying(cp, false)` for all conquest flags
- Script owns the entire deploy flow via `SpawnPlayerFromSpawnPoint`
- The engine is no longer deciding spawn locations — the script has full authority

##### Godot Object Roles (Confirmed)

| Godot Object | Role | Use In Phase 8 |
|--------------|------|-----------------|
| `HQ_PlayerSpawner` | Normal BF HQ spawn; tied to team, supports deploy screen HQ flow | **Not used** — main base spawns stay engine-default for now |
| `PlayerSpawner` | Alternate spawn method, no HQ; designed for script-first control | **Primary** — author these around each flag for our spawn positions |
| `SpawnPoint` | Lower-level spawn location used by CapturePoint infantry spawn lists; engine manages these internally | **Not used** — engine picks from these non-randomly; we bypass entirely |

**Key insight:** If you attach normal `SpawnPoint` objects to a flag or HQ, the engine uses its own deploy logic (priority-based, not random). This is why default flag spawning does not feel random. The only way to get true randomness is to bypass the engine's selection entirely and call `SpawnPlayerFromSpawnPoint` directly.

**Godot placement notes:** Most placed objects have an Obj Id assignable in the editor. The blue gizmo arrow in the Godot viewport indicates the front/facing direction of the object — orient PlayerSpawner arrows to control which way the player faces on spawn.

##### Remaining Validation Items

The core approach is confirmed. These items still need test-build validation:

1. **`EnableCapturePointDeploying(cp, false)` behavior on deploy screen:** When disabled, does the flag still appear visually on the deploy screen (just non-clickable)? Or does it disappear? If it disappears, we need an alternative way to present flag deploy options to the player (custom UI or keeping flags "enabled" but intercepting the deploy).

2. **Deploy screen flag click detection with disabled deploy:** If engine flag deploy is disabled, how does the player indicate which flag they want to spawn at? Options:
   - Keep engine flag deploy enabled, let engine spawn at default location, then immediately relocate via `SpawnPlayerFromSpawnPoint` (Approach B — functional but has teleport flash)
   - Build a custom deploy-target UI in the deploy screen (more work but cleanest)
   - Use the existing deploy screen with flags enabled, detect which flag was selected via proximity check in `OnPlayerDeployed`, then relocate

3. **`SpawnPlayerFromSpawnPoint` with standalone `PlayerSpawner`:** Confirm that Godot `PlayerSpawner` objects not parented to any CapturePoint work with `SpawnPlayerFromSpawnPoint(player, spawnerId)`. Already proven for vehicle deploy spawn points — expect identical behavior.

**These items determine the deploy-screen UX, not the core spawn mechanism.** The randomized selection + `SpawnPlayerFromSpawnPoint` path is confirmed regardless.

##### Map Config Extension

Add per-flag player spawn point arrays to `MapConfig`:

```
type FlagSpawnConfig = {
    team1SpawnPointIds: number[];   // up to 10 Godot PlayerSpawner IDs for team 1
    team2SpawnPointIds: number[];   // up to 10 Godot PlayerSpawner IDs for team 2
};
```

Extend `CapturePointConfig`:
```
type CapturePointConfig = {
    objId: number;
    label: string;
    order: number;
    spawns?: FlagSpawnConfig;       // Phase 8 spawn positions
};
```

For Operation Firestorm with 5 flags × 2 teams × 10 spawn points = 100 spawn point IDs. Each ID is a number (~4-8 bytes). Total data cost: ~400-800 bytes in map config.

##### Spawn Selection Logic

Location: `src/interaction/spawn-selector.ts` (replaces Phase 1 scaffold)

```
conquestSelectSpawnPoint(input: ConquestSpawnSelectorInput) -> ConquestSpawnSelectorResult
```

Algorithm:
1. Resolve the requested flag from `input.preferredFlagObjId`
2. Check ownership: if the player's team does not own the flag, return `{ denied: true, reason: "flag_not_owned" }`
3. Look up `capturePointConfig.spawns` for the player's team → get array of spawn point IDs
4. If the array is empty or missing, return `{ denied: true, reason: "no_spawn_points_configured" }`
5. Select a random index: `Math.floor(Math.random() * spawnPointIds.length)`
6. Return `{ denied: false, selectedSpawnObjId: spawnPointIds[randomIndex], reason: "random_selection" }`

**No fallback chain.** If you don't own the flag, the deploy is denied. No cascading to another flag or main base. This keeps the system simple and deterministic.

**No weighting or bias.** All 10 spawn points are equally likely. Future logic (Phase 13) can add distance-from-enemy weighting, LOS checks, or heatmap avoidance — the extensibility hook is the `ConquestSpawnSelectorResult` type which already has `fallbackUsed` and `reason` fields for richer selection metadata.

##### Runtime Flow

**On player join (confirmed pattern):**
1. `OnPlayerJoinGame` fires
2. `EnablePlayerDeploy(player, false)` — gate deploy until script is ready
3. `SetRedeployTime(player, 1)` — fast redeploy for script-controlled flow
4. Initialize per-player spawn state (default selected flag = main base or first owned flag)
5. Brief `Wait(0.25)` to let engine settle
6. `EnablePlayerDeploy(player, true)` — release deploy gate

**On player deploy (clicking a flag):**
1. `OnPlayerDeployed` fires (confirmed: this is the correct hook for post-deploy relocation)
2. Determine which flag the player selected (position proximity check against known flag positions from `CapturePointConfig`)
3. Call `conquestSelectSpawnPoint({ pid, teamId, reason: "deploy", preferredFlagObjId })`
4. If denied: `UndeployPlayer(player)` (send back to deploy screen)
5. If approved: `SpawnPlayerFromSpawnPoint(player, result.selectedSpawnObjId)` — player is teleported to the randomly selected `PlayerSpawner` position

**Pre-game / countdown phase:**
- Deploy is already disabled during countdown (Phase 7)
- Spawn selection is a no-op during `COUNTDOWN` lifecycle phase

**Match end / post-match:**
- Deploy is disabled
- Spawn selection returns denied for all requests

**Confirmed working pattern (from reference implementation):**
- Store arrays of PlayerSpawner Obj IDs per flag per team in config
- Track each player's selected flag in runtime state
- On deploy, look up the flag's spawn IDs for the player's team
- Pick a random index and call `SpawnPlayerFromSpawnPoint(player, spawnId)`
- This pattern is validated and matches our existing design architecture

##### Main Base Spawns

**Low priority for first pass.** Main base spawns currently use the engine's default spawn behavior, which is acceptable for V1. (Note: `team1/2VehicleDeploySpawnPointId` map-config fields and the `getVehicleDeploySpawnPointIdForTeam` getter were dead since v1.152 and removed in v1.363 — the v1.259 Vanilla spawner rewrite no longer uses spawn-point forcing.)

If main base spawn control becomes needed later, the same pattern applies: author PlayerSpawner objects in main base, add IDs to map config, and route through `conquestSelectSpawnPoint` with a `"main_base"` flag type.

##### Byte Budget Estimate

| Component | Est. Bytes |
|-----------|-----------|
| `FlagSpawnConfig` type + `CapturePointConfig` extension | ~30 |
| `conquestSelectSpawnPoint` implementation (replace scaffold) | ~200-300 |
| Map config data (100 spawn point IDs for Firestorm) | ~400-800 |
| Deploy integration in `player-deploy.ts` | ~100-200 |
| Diagnostics for missing spawn sets | ~100-150 |
| **Total** | **~830-1,480** |

At current headroom of 19,316 bytes (1.8%), this is comfortably within budget. However, if investigation reveals that Approach A requires additional deploy-screen management code, the cost could increase by 200-500 bytes.

**Risk note:** If multiple maps are added with per-flag spawn data, the map config data cost scales linearly. 3 maps × 100 IDs × ~6 bytes = ~1,800 bytes of pure data. This is manageable but should be monitored.

##### Deferred Items

- **Phase 13 (Advanced Spawn Contract):** LOS checks, distance-from-enemy weighting, heatmap avoidance, cooldown/safety scoring per spawn point. The `ConquestSpawnSelectorResult` type already accommodates this metadata.
- **CQ_Bug_34 (Vehicle spawner orientation tuning):** Deferred to Phase 10 unless Phase 8 testing reveals rotation issues with player spawns that share the same investigation surface.
- **Main base spawn control:** Not in Phase 8 scope unless engine default behavior proves inadequate during testing.
- **Team-switch buttons on minimap:** Deferred from original Phase 8 scope — can be added in Phase 10 or as a standalone polish item.

Verification:

- `npm run verify`
- Godot PlayerSpawner investigation (test build required before implementation)
- random spawn selection sanity checks (all 10 positions must be reachable)
- ownership-gated spawn restriction checks (denied for unowned/neutral flags)
- no advanced node/LOS/heatmap logic is active in Phase 8
- missing/invalid spawn-set diagnostic checks
- deploy integration correctness across: normal deploy, redeploy after death, team swap, reconnect

Codex To-Do Checklist:

- [ ] Validate deploy-screen UX with `EnableCapturePointDeploying(cp, false)` (test build: do flags still appear?)
- [ ] Extend `CapturePointConfig` with `FlagSpawnConfig` type
- [ ] Author 10 PlayerSpawner positions per team per flag in Godot for Operation Firestorm
- [ ] Record spawn point IDs in Firestorm map config
- [ ] Implement `conquestSelectSpawnPoint` with random selection and ownership gating
- [ ] Integrate spawn selection into deploy flow (`player-deploy.ts` or custom deploy path)
- [ ] Add diagnostics for missing/invalid spawn sets per validator policy
- [ ] Keep advanced node-risk/LOS/heatmap logic disabled in this phase
- [ ] Run spawn restriction tests across deploy/redeploy/team-swap/reconnect scenarios
- [ ] Validate spawn selection across all 5 Firestorm flags with both teams

Phase Changelog:

- `Log policy`: append-only; newest entry first.
- `Current status`: `not_started`
- `Implementation entry format`: `YYYY-MM-DD | summary | files changed | verification`
- `Design modification entry format`: `YYYY-MM-DD | trigger | proposed change | impacted CF/PD/Phase | decision status | required doc updates`
- `Entries`:
  - `2026-04-04 | Spawn pattern validation from reference implementation | Added SetRedeployTime to API table, confirmed OnPlayerDeployed as correct hook for spawn relocation, added join-flow pattern (disable deploy → set redeploy time → wait → enable), added Godot blue gizmo orientation note, added confirmed working pattern section to Runtime Flow | Phase 8 | accepted | Updated API Foundation, Godot Object Roles, Runtime Flow sections`
  - `2026-04-04 | Godot spawner role clarification | Confirmed PlayerSpawner is the correct Godot object for script-first control; SpawnPoint is engine-managed and not random; engine flag deploy logic is priority-based not random. Approach confirmed: disable engine flag deploy + script-driven SpawnPlayerFromSpawnPoint. Remaining validation: deploy-screen UX with EnableCapturePointDeploying(false) | Phase 8 | accepted | Updated investigation section to confirmed findings, added Godot object role table`
  - `2026-04-04 | Phase 8 detailed design pass | Added comprehensive spawn system design with API validation, Godot investigation requirements, map config extension spec, byte budget estimate, and implementation flow. Removed fallback chain (own-or-deny model). Main base spawns deferred. Minimap team-switch buttons deferred to Phase 10 | Phase 8, Phase 10, Phase 13 | accepted | Phase 8 section fully rewritten with detailed design`
  - `2026-03-26 | Dedicated spawn-phase split request | Moved spawn behavior/restriction/fallback work out of Phase 6 and into new Phase 8 after Phase 7 so boundaries can finish first, pre/post-match flow can follow second, and spawn behavior can be implemented as a separate system slice after that | Phase 6, Phase 7, Phase 8, Phase 9, Phase 10, Phase 11, Phase 12, Phase 13, Phase 14 | accepted | current status + TOC + Phase 6/7/8 scopes/checklists`

<a id="phase-9"></a>
### Phase 9: Custom Tab Scoreboard + KPI Tracking

Deliverables:

- soldier KPI tracking
- custom tab scoreboard rendering and updates
- post-match aggregation hooks
- ready-up dialog cleanup follow-up after scoreboard/KPI integration pressure is understood

Mapped clarifications:

- `CF-37`, `CF-38`, `CF-39`, `CF-40`, `CF-41`, `CF-44`, `CF-45`, `CF-46`, `CF-47`, `CF-54`, `CF-64`, `CF-65`, `CF-77`, `CF-79`

Godot/map prerequisites:

- none additional for base KPI tracking
- capture credit path from Phase 2 must be stable

Verification:

- `npm run verify`
- event-to-KPI correctness tests (kill/death/assist/capture/revive)
- scoreboard stability during reconnect/redeploy
- scoreboard update-throttle checks (no blind refresh spam when values unchanged)

Cross-phase note from Phase 4:

- Phase 4 capture-sound events may keep lightweight diagnostic/context fields that are useful for future KPI debugging.
- This does not authorize KPI implementation in Phase 4.
- Phase 9 must still derive KPI truth from authoritative gameplay/capture state and confirmed event APIs, not from sound dispatch logs or audio queue behavior.

Codex To-Do Checklist:

- [ ] Confirm KPI event APIs in `api_checklist.md` as `Confirmed` or `Replaced` before enabling each KPI path.
- [ ] Implement KPI state mutations and derived-score/KDR math according to CF scoreboard rules.
- [ ] Implement scoreboard render/update with dirty/signature discipline (no blind refresh loops).
- [ ] Clean up the ready-up dialog after scoreboard/KPI work clarifies what pre-match and live-state UI responsibilities should remain there.
- [ ] Validate reconnect/redeploy behavior and stat continuity expectations for V1 policy.
- [ ] Run event-to-KPI accuracy tests and log gating results for Phase 9 signoff.

Phase Changelog:

- `Log policy`: append-only; newest entry first.
- `Current status`: `in_progress`
- `Implementation entry format`: `YYYY-MM-DD | summary | files changed | verification`
- `Design modification entry format`: `YYYY-MM-DD | trigger | proposed change | impacted CF/PD/Phase | decision status | required doc updates`
- `Entries`:
  - `2026-04-13 | Phase 9 follow-up: friendly-kill guard on Kills counter | onPlayerEarnedKillImpl now compares killer/victim team via safeGetTeamNumberFromPlayer(..., 0) and skips increment on team match; fails open on unassigned team (0); addresses CQ_Bug_56; src/index/player-kpi-events.ts | v1.212, bundle 1,002,150 bytes, tsc clean`
  - `2026-04-12 | Phase 9 prototype: custom tab scoreboard with KPI tracking | Added kpi/kpi-state.ts, kpi/scoreboard-tab.ts, index/player-kpi-events.ts; wired OnPlayerEarnedKill + OnPlayerEarnedKillAssist exports; capture KPI attribution via GetPlayersOnPoint + GetCurrentOwnerTeam; scoreboard sync in live-tick (1s) + re-assert (60s); KPI reset on startMatch + triggerFreshMatchSetup; state: kpiByPid; strings: twl.scoreboard.col* | v1.178, bundle 1,042,443 bytes, tsc clean`

<a id="phase-10"></a>
### Phase 10: Iteration, Playtesting, and Polish (Open-Ended)

Deliverables:

- open-ended multiplayer playtesting cadence across all implemented core systems
- prioritized polish/iteration pass for UX, readability, flow consistency, and balance tuning
- consolidated defect burn-down for blockers/high-impact regressions before future-phase expansion
- ongoing performance monitoring and regression tracking across implemented systems
- optional ticket-lead messaging polish so players get a clear text callout when one team takes the lead

Mapped clarifications:

- all implemented-phase clarifications under active validation scope (`CF`/`PD` carry-forward)

Godot/map prerequisites:

- testable map/spatial baselines for all intended playtest maps
- access to representative multiplayer test conditions

Verification:

- `npm run verify`
- repeated playtest loops across join/leave/redeploy/team-swap/capture/end-flow scenarios
- regression sweep after each polish batch
- explicit blocker triage and close/retest cycle
- performance monitoring pass for runtime stability, HUD cadence, and any newly introduced hotspots
- ticket-lead messaging readability/timing check so lead-change text does not spam or obscure higher-priority UX signals

Codex To-Do Checklist:

- [ ] Maintain a live prioritized playtest/polish backlog (blockers first, then major UX issues).
- [ ] Execute iterative fix/tune passes with short validation loops after each batch.
- [ ] Re-test previously fixed issues to prevent regressions.
- [ ] Monitor performance during ongoing playtest/polish passes and record any regressions or new hotspots.
- [ ] Keep this phase open-ended until explicit human signoff to proceed.
- [ ] Record accepted tuning/polish decisions in phase changelog entries.
- [ ] Add and tune ticket-lead text messaging so players are notified when a team takes the lead without creating spam during rapid lead swaps.
- [ ] Revisit flag-based vehicle spawners only in polish after the core static spawn inventory, timers, queueing, and preset vehicle packages are proven.
- [ ] Re-add conquest flag ownership borders only after a single script-authoritative visual-state path is verified for neutralize->neutral->recapture transitions in multiplayer (no mixed owner/progress fallbacks in render decisions).
- [ ] Add a focused border reintroduction test pass.
- [ ] Validate neutralization edge (owner drained to neutral) never leaves stale enemy border.
- [ ] Validate neutral capture progression continues without leaving/re-entering radius.
- [ ] Validate recapture completion switches visuals exactly once with no stale overlays.
- [ ] Add sound effects to out-of-bounds alerts (boundary violation warning/countdown).
- [ ] Add music to round start (match-go / LIVE transition).
- [ ] Add a flourish sound on flag capture completion, and accelerate the flag capture tick sounds the closer the capture is to completing.
- [ ] Add KDR (Kill/Death Ratio) column to the tab scoreboard. Formula: `kills / deaths`, floor 0, 1-decimal precision (CF-47). Deaths=0 edge case: display infinity-style, internal sort value = kills (CF-79, CF-83). Deferred from Phase 9 due to 5-column Portal API limit; requires displacing an existing column or reworking layout.
- [ ] Add SPM (Score Per Minute) column to the tab scoreboard. Formula TBD. Deferred from Phase 9 due to 5-column Portal API limit.
- [ ] Re-evaluate scoreboard column layout once KDR and SPM are ready: preferred order is SPM | Score | Captures | KDR | Kills | Deaths (6 columns needed, only 5 available — decide which to drop or combine).

Phase Changelog:

- `Log policy`: append-only; newest entry first.
- `Current status`: `in_progress`
- `Implementation entry format`: `YYYY-MM-DD | summary | files changed | verification`
- `Design modification entry format`: `YYYY-MM-DD | trigger | proposed change | impacted CF/PD/Phase | decision status | required doc updates`
- `Entries`:
  - `2026-04-13 | Remove FEATURE_WORLD_ICON_DIAG telemetry | Dropped flag const + inline guard blocks in world-interactables.ts spawn/cleanup paths, removed syncDiagCounterForAllPlayers() from conquest-flow.ts, removed CQ52_COUNTER admin-panel widget + cq52CounterFormat string + UI_ADMIN_CQ52_COUNTER_ID, removed debug.worldIconDiagP0/P1/P2 state fields; HQ/gadget WorldIcon spawn/render code unchanged; user moved past world-icon debugging to smoke-based signalling | v1.213, bundle 1,001,081 bytes (-1,069), tsc clean`
  - `2026-04-13 | Round-start gadget delay + pregame delay-line polish | Added roundStartGadgetDelay MapConfig (Firestorm=60); 4th staggered pregame countdown line at Y=-300 co-revealed with forward-deploy line at -6s; gadget locker menu opens pre-LIVE/during-delay with preview+stats visible but all tiles forced disabled via gadgetBlocked and a yellow status header (two string variants delayGadgets/delayGadgetsLive); cache-preservation fix in ensureCountdownUIAndGetWidget so delay lines hide with LIVE! text; files: src/config/types.ts + src/config/maps/operation-firestorm.ts + src/state/core.ts + src/state/hud-cache-types.ts + src/ready-dialog/pregame-ui.ts + src/ready-dialog/countdown-flow.ts + src/interaction/ammo-resupply-menu.ts + src/strings.json | v1.208-v1.211, bundle 1,001,946 bytes, tsc clean`
  - `2026-04-12 | Scoreboard column layout deferral | KDR and SPM columns deferred to Phase 10 polish due to Portal 5-column API limit; documented preferred future layout (SPM/Score/Captures/KDR/Kills/Deaths) and noted 6-vs-5 resolution needed | Phase 9, Phase 10, CF-39, CF-79, CF-83 | accepted | Phase 10 checklist updated with 3 new to-dos`
  - `2026-04-04 | Sound/music polish items | Added three audio polish to-dos: boundary alert sounds, round start music, flag capture flourish + accelerating capture tick sounds | Phase 10 | accepted | Phase 10 checklist updated`
  - `2026-03-02 | Repeated neutralization-border regression during Phase 3 implementation/testing | Deferred flag border feature to Phase 10 polish; remove border feature from active implementation until a single authoritative visual-state path is validated | Phase 3B, Phase 10 | accepted | Added Phase 10 to-do + explicit border reintroduction validation criteria`
  - `2026-03-01 | Phase sequence update request | Added open-ended iteration/playtesting/polish phase before bot simulation and bumped downstream phase numbering | Phase 10, Phase 11, Phase 12, Phase 13 | accepted | design_doc phase ordering + numbering updated`

<a id="phase-11"></a>
### Phase 11: Advanced Features

Deliverables:

- spawn aircraft in air
- spawn vehicles by user chosen orientation
- aircraft radar integration/evaluation using [BF6-Air-Radar](https://github.com/Pongstroid/BF6-Air-Radar)

Mapped clarifications:

- future advanced-spawn/vehicle-system clarifications as required

Godot/map prerequisites:

- authored in-air aircraft spawn transforms where required
- authored orientation-aware vehicle spawn transforms or user-facing orientation inputs
- any map/runtime requirements needed by the chosen aircraft radar integration approach

Verification:

- `npm run verify`
- aircraft in-air spawn correctness checks
- vehicle user-chosen orientation correctness checks
- aircraft radar behavior and compatibility checks

Codex To-Do Checklist:

- [ ] Implement spawn-aircraft-in-air feature.
- [ ] Implement vehicle spawn by user-chosen orientation.
- [ ] Evaluate and integrate aircraft radar behavior using `BF6-Air-Radar` as the primary external reference.
- [ ] Validate aircraft in-air spawn safety and map-specific correctness.
- [ ] Validate user-chosen vehicle orientation behaves consistently across supported spawn contexts.
- [ ] Validate aircraft radar behavior against intended Conquest air-play scope and map constraints.

Phase Changelog:

- `Log policy`: append-only; newest entry first.
- `Current status`: `not_started`
- `Implementation entry format`: `YYYY-MM-DD | summary | files changed | verification`
- `Design modification entry format`: `YYYY-MM-DD | trigger | proposed change | impacted CF/PD/Phase | decision status | required doc updates`
- `Entries`:
  - `2026-03-12 | Phase-plan update request | Added Phase 11 Advanced Features for spawning aircraft in air and spawning vehicles by user-chosen orientation; bumped downstream future phases accordingly and updated Phase 5/6 titles/scope | Phase 5, Phase 6, Phase 11, Phase 12, Phase 13, Phase 14 | accepted | design_doc future-phase ordering + deliverables/checklists updated`

<a id="phase-12"></a>
### Phase 12: AI/Bot Simulation and Spawn-Balance Validation (Future)

Deliverables:

- bot-enabled simulation mode for stress testing (non-V1)
- scripted metrics capture focused on spawn-point balance and gameplay pressure
- comparative spawn-balance reports using constant-tunable scoring

Mapped clarifications:

- `CF-49` (future-phase policy anchor)
- `CF-32` (performance telemetry windows/thresholds as measurement base)

Godot/map prerequisites:

- stable spawn-point authoring across tested maps
- optional bot pathing/support data if available

Verification:

- `npm run verify`
- repeatable stress scenario runs with bots enabled
- telemetry trend comparison across spawn-point tuning revisions

Codex To-Do Checklist:

- [ ] Add non-V1 bot simulation harness and scenario presets for repeatable stress runs.
- [ ] Collect telemetry focused on spawn balance and pressure distribution.
- [ ] Implement comparison reports across spawn tuning revisions.
- [ ] Validate runtime stability/perf envelopes under bot load.
- [ ] Document go/no-go criteria for promoting bot findings into spawn tuning changes.

Phase Changelog:

- `Log policy`: append-only; newest entry first.
- `Current status`: `not_started`
- `Implementation entry format`: `YYYY-MM-DD | summary | files changed | verification`
- `Design modification entry format`: `YYYY-MM-DD | trigger | proposed change | impacted CF/PD/Phase | decision status | required doc updates`
- `Entries`: `None yet`

<a id="phase-13"></a>
### Phase 13: Advanced Spawn Contract Integration (Post-Core Only)

Hard gate:

- Phase 13 starts only after Phases 1-11 are implemented, verified, and stable.

Deliverables:

- implement `spawn_system_contract.md` model:
  - `Flag -> nodes[] + safeSpawns[]`
  - `Node -> spawnPoints[] + cooldown/LOS/proximity/death-risk attributes`
  - `SpawnPoint` atomic selection units
- implement runtime levers:
  - contested/friendly presence gating
  - enemy proximity checks
  - LOS rejection
  - node cooldown
  - recent death heatmap penalties
  - safe-spawn fallback
- implement selectable node choice policy:
  - best-score
  - weighted-random
  - top-K weighted-random

Mapped clarifications:

- `CF-86` and future spawn-contract-specific clarifications

Godot/map prerequisites:

- authored node topology per flag
- spawn-point density per node
- safe-spawn fallback sets per flag

Verification:

- `npm run verify`
- spawn safety regression checks under contested pressure
- distribution checks (anti-clumping and cooldown adherence)
- performance checks against `CF-32` telemetry windows/thresholds

Codex To-Do Checklist:

- [ ] Implement `Flag -> Node -> SpawnPoint` data model and authored data loading.
- [ ] Implement runtime levers (contested, proximity, LOS, cooldown, heatmap, safe fallback).
- [ ] Implement configurable node-selection policy (`best-score`, `weighted-random`, `top-K weighted-random`).
- [ ] Preserve no-fail spawn behavior with explicit fallback and rejection diagnostics.
- [ ] Validate safety/distribution/performance outcomes against `CF-32` telemetry windows.

Phase Changelog:

- `Log policy`: append-only; newest entry first.
- `Current status`: `not_started`
- `Implementation entry format`: `YYYY-MM-DD | summary | files changed | verification`
- `Design modification entry format`: `YYYY-MM-DD | trigger | proposed change | impacted CF/PD/Phase | decision status | required doc updates`
- `Entries`: `None yet`

<a id="phase-14"></a>
### Phase 14: Spawn Design Documentation and Contract Analysis (Integrated)

Hard gate:

- Phase 14 starts after Phase 13 implementation baseline is stable.

Purpose:

- Integrate the design intent and system-contract details from both spawn reference documents into this master design.
- Keep this as the canonical spawn-design analysis block for future tuning and implementation reviews.

Integrated sources:

- `bf6-portal/dev/conquest/reference_design_documentation/archive/spawn_design_document_analysis.md`
- `bf6-portal/dev/conquest/reference_design_documentation/archive/spawn_system_contract.md`

#### Intent

- The spawn reference is a contract and decision framework, not direct code.
- It defines reusable data structures and runtime levers for safe, tunable spawn behavior.

#### Mind Map

```text
Spawn System Contract
|- Data Model
|  |- Flag
|  |  |- nodes[]
|  |  |- safeSpawns[] fallback
|  |- Node
|  |  |- spatial area / centroid
|  |  |- spawnPoints[]
|  |  |- lastUsedTime, death history
|  |- SpawnPoint
|     |- atomic transform
|
|- Runtime Safety Levers
|  |- flag contested state
|  |- friendly presence gate
|  |- enemy proximity gate
|  |- LOS rejection
|  |- node cooldown
|  |- recent death heatmap
|  |- safe-spawn fallback
|
|- Authoring/Design Levers
|  |- node density per flag
|  |- spawn density per node
|  |- selection strategy
|     |- best-score
|     |- weighted-random
|     |- top-K weighted-random
```

#### Data Model Contract

Flag:

- Contains `nodes[]`.
- Owns `safeSpawns[]` as last-resort spawn points.
- Carries `nodeCount`, capture state, and ownership state.

Node (for example: building, courtyard, trench line):

- Belongs to a `Flag`.
- Contains `spawnPoints[]`.
- Carries `spawnCount`, spatial bounds/centroid, `lastUsedTime`, and death-history sampling area.

SpawnPoint:

- Atomic spawn transform.
- Belongs to a `Node`.

#### Primary Runtime Levers

1. `isFlagContested(flag, team)`
- Controls whether a flag is under active enemy pressure.
- Affects entire `flag.nodes[]` pool (enable/disable/restrict).
- Output: boolean or severity metric.

2. `doesFlagHaveFriendlies(flag, team)`
- Controls whether friendly presence exists at the flag.
- Affects entire `flag.nodes[]` pool (enable/disable/restrict).
- Output: boolean or presence metric.

3. Enemy proximity radius (`node`, `team`)
- Controls minimum allowed enemy distance from node area.
- Affects node validity; may exclude entire `node.spawnPoints[]`.
- Output: `minEnemyDistance(node)` compared to thresholds.

4. LOS raycast rejection (`node`, `team`)
- Controls whether enemies have line-of-sight to node area.
- Affects node validity; may exclude entire `node.spawnPoints[]`.
- Output: `visibleToEnemy(node)` boolean or risk score.

5. Cooldown per node (`node`)
- Controls node reuse frequency.
- Affects node validity/scoring; may temporarily exclude entire `node.spawnPoints[]`.
- Output: `timeSinceLastUse(node)` versus cooldown threshold.

6. Recent death heatmap (`node`, `team`)
- Controls avoidance of recently lethal areas.
- Affects node score (penalty) or exclusion when risk exceeds limit.
- Output: `deathRisk(node)` from death events over space and time.

7. Safe spawns (`flag`, `team`)
- Controls fallback when no valid nodes remain.
- Affects selection path by switching to `flag.safeSpawns[]` and optionally relaxing node levers.
- Output: `safeSpawnCandidates[]` and chosen fallback `SpawnPoint`.

#### System-Level Design Considerations

Node density per flag (`flag`):

- Controls number/spatial coverage of `nodes[]`.
- Affects likelihood of valid spawn options under pressure.
- Output: authored `nodeCount` and distribution coverage.

SpawnPoint density per node (`node`):

- Controls number/spread of `spawnPoints[]` in each node.
- Affects variation after node selection.
- Output: authored `spawnCount` and internal spacing.

Selection method (`validNodes[]`):

- Controls determinism versus unpredictability.
- Affects chosen `Node` and chosen `SpawnPoint`.
- Output choices:
  - `best-score`
  - `weighted-random`
  - `top-K weighted-random`

#### What This Contract Gives Us

- Clear separation between authored data (`Flag -> Node -> SpawnPoint`), runtime scoring/rejection, and selection strategy.
- A guaranteed fallback path via `safeSpawns[]`.
- A framework that scales from simple rule checks to advanced weighted scoring.

#### What This Contract Does Not Define

- Exact score formula.
- Hard numeric thresholds (distance, LOS sample count, cooldown).
- Event interfaces and update cadence.
- Persistence window model for death heatmaps.

#### Implementation Implications in TWL Conquest

Use this as a subsystem contract, not as a complete algorithm.

Recommended subsystem split:

- `spawn_data.ts`:
  - typed definitions for flags, nodes, points, authored metadata.
- `spawn_risk.ts`:
  - contested, friendly presence, proximity, LOS, death-heat scoring.
- `spawn_selection.ts`:
  - candidate scoring/weighting and fallback behavior.
- `spawn_runtime.ts`:
  - caches, cooldown timers, refresh policy, debug counters.

#### Practical Iteration Notes

- Start with proximity + cooldown + fallback first.
- Add LOS and heatmap only after baseline stability and observability.
- Keep deterministic debug outputs for candidate ranking and rejection reasons.
- Preserve no-fail spawn behavior; unsafe fallback is preferred over null/failed spawn.

#### Reusable Checklist

- Data contract exists for `Flag`, `Node`, `SpawnPoint`.
- Every rejection reason is explicit and traceable.
- Selection method is configurable/swappable.
- Fallback path is always available.
- Scoring remains constant-driven and tunable without refactor.

Deliverables:

- Integrated spawn design analysis baseline in this document.
- Runtime implementation checklist aligned to the contract levers.
- Explicit handoff guidance for future spawn-system tuning passes.

Mapped clarifications:

- `CF-86` plus Phase 12 spawn-contract clarifications.

Godot/map prerequisites:

- Node topology authored per flag.
- SpawnPoint placement density verified per node.
- Safe fallback spawn sets authored for every flag/team path.

Verification:

- `npm run verify`
- spawn candidate/rejection debug trace quality check
- fallback correctness when all primary nodes are invalid
- distribution sanity checks across selection modes
- performance checks against `CF-32` telemetry thresholds

Codex To-Do Checklist:

- [ ] Keep this phase as documentation/analysis integration only (no production spawn algorithm copy-paste).
- [ ] Consolidate spawn contract language into implementation-ready guidance for future phases.
- [ ] Validate checklist coverage for data model, rejection reasons, fallback, and tunable scoring.
- [ ] Ensure Phase 12 implementation learnings are reflected in this analysis section.
- [ ] Record any new clarifications as CF/PD updates before additional spawn-system refactors.

Phase Changelog:

- `Log policy`: append-only; newest entry first.
- `Current status`: `not_started`
- `Implementation entry format`: `YYYY-MM-DD | summary | files changed | verification`
- `Design modification entry format`: `YYYY-MM-DD | trigger | proposed change | impacted CF/PD/Phase | decision status | required doc updates`
- `Entries`: `None yet`

## Testing and Verification

After every code change:

- run `npm run verify`

Required manual checks per phase (minimum):

- join/leave
- redeploy
- team swap
- feature-specific scenario checks from mapped clarifications
- mass redeploy spam scenario (`8-16` players)
- rapid contested objective flip churn
- late join during active capture
- simultaneous ticket-zero and clock-zero end-condition race
- API validity audit for the phase surface (no invented calls)

## Open Punchlist (Blockers + Stop-The-Line Evidence Checklist)

None

## Appendix: Post-Seat Vehicle Teleport Pattern (v1.333 / v1.334)

This section appends a design record for the vehicle-deploy Teleport architecture as it stands at v1.334. It does **not** replace any Phase 5/6 spec — those describe the single-persistent-spawner pattern and the BountyHunter seat contract. This is the Teleport timing refinement layered on top.

### Problem

All three player-triggered deploy paths (HQ, Forward, Air) share one seat code path (`onHqSeatPendingPlayerDeployed` → `mod.ForcePlayerToSeat(player, vehicle, -1)` inside `OnPlayerDeployed`). Pre-v1.333, only HQ Deploy respected the player's vehicle loadout (e.g., TOW on AH-6M). Forward and Air dropped it.

The structural difference: HQ Deploy's vehicle sat at `slot.spawnPos` (the HQ pad) when `DeployPlayer` fired. Forward/Air called `mod.Teleport(vehicle, nextForwardPos | nextAirPos, yawRad)` **pre-seat** in `doDispatch`, between bind and seat. That Teleport inside the bind→DeployPlayer→seat window is what broke loadout application.

The mechanism is empirically indistinguishable from script — position-gate, timing, or engine handle invalidation on Teleport are all plausible (see `design_doc/air_deploy_jet_pitch_investigation_2026-04-20.md`). The fix targets all of them at once.

### Pattern

**Phase 2a (v1.333) — Forward Deploy:** In `doDispatch`, the `pendingSpawnMode === "forward"` branch early-returns (no pre-seat Teleport). Vehicle stays at HQ pad through the 0.5s settle + `DeployPlayer` chain. In `onHqSeatPendingPlayerDeployed`, the forward target is **snapshotted into local refs before** `onForwardSpawnSuccess` re-seeds `nextForwardPos/Rot` for the next click. After `mod.ForcePlayerToSeat(...)` completes, `mod.Teleport(vehicle, forwardTargetPos, fwdYawRad)` relocates the vehicle (with the seated player aboard) to the forward point.

**Phase 2b (v1.334) — Air Deploy:** Identical pattern symmetrical for aircraft. `pendingSpawnMode === "air"` branch early-returns in `doDispatch`. `airTargetPos/Rot` snapshotted in `onHqSeatPendingPlayerDeployed` before `onAirSpawnSuccess` re-seeds. Post-seat Teleport uses `mod.YComponentOf(airTargetRot) + VEHICLE_SPAWN_YAW_OFFSET_DEG`.

### Validated properties (v1.333 playtest)

- **Vehicle loadout applied correctly** on Forward Deploy post-v1.333. User-confirmed 2026-04-20.
- **`mod.Teleport(vehicle, ...)` carries the seated occupant.** This was the plan's primary risk — that the Teleport would strip the player onto the HQ pad on foot while the vehicle alone relocated. Did not manifest. User confirmed: "all seatings always occur in all instances in testing."
- **No visible pop** during the 0.5s HQ-pad occupancy window. The player is in the deploy UI, not the 3D world, during that window — the HQ pad presence is occluded.
- **`onForwardSpawnSuccess` / `onAirSpawnSuccess` must run AFTER the post-seat Teleport** (they restore `slot.spawner` to `slot.spawnPos` and re-seed the next target — the relocate-spawner-to-HQ step reflects final state).

### Remaining risk (v1.334 playtest gate)

Air Deploy Teleport with a seated occupant at altitude (~1000m) has not yet been playtested. The heli case (hover-stable, rotor re-spins on seat) is lower risk; the jet case could produce a momentary stall if the engine reads zero velocity + non-zero altitude as a falling state. If observed, consider `mod.SetLinearVelocity` (if exposed) post-Teleport.

### Banned patterns reaffirmed

- **Never `mod.Teleport(player, ...)` immediately before `ForcePlayerToSeat`.** The pre-seat player-Teleport has broken twice (v1.106–v1.108 and v1.151–v1.154). Memory: `project_teleport_vehicle_spawn_mystery.md`.
- The post-seat **vehicle**-Teleport is a different pattern and is not covered by that ban. v1.333 is the validation.

### Orthogonal open item

Jet pitch (`rotPlane.X = -45°` on Firestorm F-16 spawn) is lost on Air Deploy regardless of Teleport timing — `mod.Teleport` has no pitch/roll signature, and `mod.SetObjectTransform` is a no-op on `Vehicle` objects on the current engine build. The sister-spawner proposal (per-jet-slot sibling `VehicleSpawner` born with pitch) was deferred in v1.332 after the v1.331 probe disproved the weaker form of its core assumption (spawner-relocate-at-altitude does not reliably propagate position). See `CQ_Polish_Jet_Pitch_On_Air_Deploy` in `conquest_issues.md`.

### File map for this pattern

- `src/vehicles/vanilla-spawner.ts` — `doDispatch` early-return branches for `pendingSpawnMode === "forward" | "air"`.
- `src/vehicles/hq-deploy.ts` — `onHqSeatPendingPlayerDeployed` captures targets before success hooks and Teleports post-seat.
- `src/vehicles/forward-spawn-volume.ts` / `src/vehicles/air-spawn-volume.ts` — samplers (re-seeded by the success hooks).
- `src/state/runtime-types.ts` — `VehicleSpawnerSlot.pendingSpawnMode: "ground" | "forward" | "air"`, `nextForwardPos/Rot`, `nextAirPos/Rot`.


