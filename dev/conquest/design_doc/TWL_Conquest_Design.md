# TWL Conquest Design and Implementation Plan

Last updated: 2026-03-12  
Audience: Implementers and maintainers working in `bf6-portal/dev/conquest/src`

## Current Status

- This is the authoritative master design document for TWL Conquest.
- Accepted current implementation baseline:
  - Phase 1: completed
  - Phase 2A: completed
  - Phase 2B: implemented with remaining future validation deferred
  - Phase 3A, 3B, 3C: completed and accepted as the current HUD/UI baseline
- Current next implementation target:
  - Phase 4: Capture Sounds
- Current open Conquest bug status:
  - `CQ_Bug_3` is the only bug intentionally kept open/deferred
- Active companion documents:
  - `design_doc/api_checklist.md`
  - `design_doc/conquest_issues.md`
  - `design_doc/phase1_capture_api_proof.md`
- Archived planning documents are historical reference only. If an archived document conflicts with this file, this file is authoritative.

## Table Of Contents

- [Phase 1: Foundation and Wiring](#phase-1)
- [Phase 2A: Capture Backbone + Tickets Core](#phase-2a)
- [Phase 2B: Spawn-Charge Matrix and Diagnostics](#phase-2b)
- [Phase 3A: Flag UI + Color Contract](#phase-3a)
- [Phase 3B: Polished UI Pass](#phase-3b)
- [Phase 3C: HUD Cleanup and Legacy Path Removal](#phase-3c)
- [Phase 4: Capture Sounds](#phase-4)
- [Phase 5: Vehicle Systems (Timers, Queue, Repair)](#phase-5)
- [Phase 6: Basic Spawn and Boundaries System](#phase-6)
- [Phase 7: Custom Tab Scoreboard + KPI Tracking](#phase-7)
- [Phase 8: Pre & Post Match Events](#phase-8)
- [Phase 9: Iteration, Playtesting, and Polish](#phase-9)
- [Phase 10: Advanced Features](#phase-10)
- [Phase 11: AI/Bot Simulation and Spawn-Balance Validation](#phase-11)
- [Phase 12: Advanced Spawn Contract Integration](#phase-12)
- [Phase 13: Spawn Design Documentation and Contract Analysis](#phase-13)

## Purpose

This is the master design document for TWL Conquest.

Current workflow for this document:

1. Keep phase scope, architecture rules, and accepted implementation decisions centralized here.
2. Reconcile new human decisions and validated findings into this document before or during implementation.
3. Track unresolved gameplay/HUD defects in `design_doc/conquest_issues.md`.
4. Implement and validate work phase by phase.
5. Record closeout decisions, deferred risks, and carry-forward validation notes here.
6. Move superseded planning documents into archive once their still-true guidance is merged here.

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
- Basic spawn and boundaries system
- Post-match ticket/result screen
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
- Implementation is explicitly deferred to a final follow-on phase (after Phases 1-11).
- Phase 6 remains basic spawn/boundary behavior with low overhead.

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
- legacy combat runtime paths have been removed

Primary known implementation gap before the next phase:

- no dedicated Conquest sound layer exists yet
- no dedicated `State.conquest.sound` queue/handle/throttle state exists yet
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

### 6) Basic Spawn and Boundaries System

- `spawnBasic_GetCandidates(teamId: number, context: unknown)`
- `spawnBasic_Select(teamId: number, context: unknown)`
- `spawnBasic_Deploy(player: mod.Player, selectedSpawn: unknown)`
- `spawnBasic_ResolveFallbackChain(teamId: number, objectiveContext: unknown)`
- `boundary_IsOutOfBounds(player: mod.Player, vehicle: mod.Vehicle | undefined)`
- `boundary_ApplyOutOfBoundsKill(player: mod.Player)`
- `spawnAdvanced_EvaluateNodeRisk(nodeId: number, teamId: number)` // reserved for post-core Phase 12

### 7) Map Configuration and Validation

- `conquestConfig_LoadForMap(mapKey: string)`
- `conquestConfig_ValidateMap(mapKey: string)`
- `conquestConfig_GetFlagConfigs(mapKey: string)`
- `conquestConfig_GetBoundaryConfigs(mapKey: string)`
- `conquestConfig_GetSpawnSets(mapKey: string)`
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
- `CF-29` Map readiness validation owner/process: human validation using provided Godot spatial data references.
- `CF-63` Spawn-schema readiness gate: `teamSpawnSets`, `flagSpawnSets`, and `fallbackSpawns` are optional before Phase 6 and mandatory at Phase 6 entry.
- `CF-73` Runtime map validation guardrails:
  - configured ObjIds must resolve at runtime
  - expected object types must match usage (capture point/trigger/spawner)
  - spawn sets must not contain duplicate ObjIds
  - when phase requires spawn sets, empty required sets emit warnings and force safe fallback behavior
- `CF-100` Capability-bounded validator rule: map validation must be restricted to checks proven observable in Portal runtime; unsupported type-introspection assumptions are forbidden.
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
  - Required gate: before Phase 7 implementation/signoff, `api_checklist.md` must explicitly mark kill/death/assist/permanent-death/capture event paths as `Confirmed` or `Replaced`.
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
- `PD-05` KPI scope gating decision: KPI scope finalization does not gate Phases 1-3A/3B; lock mandatory V1 KPI subset near Phase 7 entry when API confidence is higher.

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

- scoreboard/KPI feature work (Phase 7)
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
    - `viewerTargetMode` (`friendlyPerspective` or `enemyPerspective`)
    - `queuedAtSeconds`
  - throttle key should be objective-aware and perspective-aware, not global-only
  - practical default shape:
    - `capture_tick_friendly:{objId}:{teamId}`
    - `capture_tick_enemy:{objId}:{teamId}`
- Dispatch model:
  - flush queue on the existing Phase cadence (`0.5s` design target already defined above)
  - resolve recipients at flush time using current player/team truth so team swaps or redeploys do not play stale-perspective audio
  - dispatch per player with `mod.PlaySound(..., player)` rather than broadcasting global sound and hoping perspective lines up
- KPI interaction boundary:
  - do not solve KPI attribution in Phase 4
  - sound events are not authoritative KPI events and must not mutate KPI state directly
  - however, Phase 4 queue payloads and debug counters should preserve enough context to be useful later if Phase 7 wants to correlate capture audio with capture attribution or scoreboard debugging
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
  - sound queue state should clear cleanly on round reset, match end, and player leave
  - future team-switch cleanup should explicitly protect against stale queued perspective if a player changes team before flush
  - if Phase 7 later introduces shared capture-event instrumentation, Phase 4 should be able to plug into it without reworking its dispatch ownership
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

Codex To-Do Checklist:

- [ ] Start Phase 4 on a dedicated capture-sound layer; keep it isolated from HUD render ownership.
- [ ] Add dedicated `State.conquest.sound` ownership for queue/handle/throttle state; do not hide Phase 4 authority inside `hudCache` or HUD-only debug maps.
- [ ] Implement capture sound queue with per-event throttle (`CF-18`) and deterministic flush cadence.
- [ ] Restrict V1 sound scope to required capture events only.
- [ ] Enforce per-viewer team perspective for emitted sound events.
- [ ] Spawn/cache runtime SFX handles once and reuse them for all Phase 4 dispatches.
- [ ] Route sound producers from current capture authority only; do not couple them to HUD visibility.
- [ ] Keep `capture-tickets.ts` producer hooks narrow and move queue/dispatch logic into dedicated sound modules instead of expanding the existing capture monolith.
- [ ] Keep sound diagnostics/event envelopes KPI-friendly without turning Phase 4 into KPI implementation.
- [ ] Run rapid objective-transition spam tests and confirm throttle behavior.
- [ ] Run team-swap/redeploy perspective tests to ensure no stale queued audio reaches the wrong team.
- [ ] Record debug counters/trace output demonstrating no audio flood regressions.

Phase Changelog:

- `Log policy`: append-only; newest entry first.
- `Current status`: `in_progress`
- `Implementation entry format`: `YYYY-MM-DD | summary | files changed | verification`
- `Design modification entry format`: `YYYY-MM-DD | trigger | proposed change | impacted CF/PD/Phase | decision status | required doc updates`
- `Entries`:
  - `2026-03-12 | Pre-Phase 4 source audit and archival merge | Reviewed current src architecture before sound work, recorded actual Phase 4 gaps/risks (no active sound layer, no conquest.sound state, capture-tickets monolith pressure, CQ_Bug_3 perspective-cleanup warning), merged still-true HUD architecture principles from deprecated docs into the master plan, and marked the old planning/evidence docs for archive-only status | Phase 4, Phase 3A, Phase 3B, Phase 3C, CQ_Bug_3, CF-17, CF-18, CF-19 | accepted | design_doc Phase 4 preflight audit + archival carry-forward section + archive decision`
  - `2026-03-12 | Phase 4 KPI-boundary note | Added explicit rule that sound events may retain KPI-useful diagnostics/context but must not become KPI authority or mutate KPI state; expanded Phase 4 diagnostics expectations accordingly | Phase 4, Phase 7, CF-17, CF-18, CF-19 | accepted | design_doc Phase 4 KPI interaction boundary + checklist update`
  - `2026-03-12 | Phase 4 kickoff planning pass | Evaluated sound patterns from BillDukes, DFK ConquestSmall, and BattleDad references; locked a Conquest-specific Phase 4 model around a dedicated capture-sound layer, cached runtime SFX handles, objective-aware throttling, and per-viewer dispatch | Phase 4, CF-17, CF-18, CF-19 | accepted | design_doc Phase 4 implementation model + checklist update`

<a id="phase-5"></a>
### Phase 5: Vehicle Systems (Timers, Queue, Repair)

Deliverables:

- per-slot respawn timer tracking and HUD rendering
- vehicle spawn queue behavior and slot arbitration
- vehicle repair runway/pad behavior
- knobs for vehicle spawns

Mapped clarifications:

- `CF-20`, `CF-21`, `CF-22`

Godot/map prerequisites:

- complete vehicle spawner slot mapping and respawn config per map
- authored/validated repair pads, repair runways, or equivalent repair volumes where required

Verification:

- `npm run verify`
- destroy-to-respawn timer accuracy checks
- queue sequencing and slot-release checks
- repair runway/pad enter/exit and restore-behavior checks
- vehicle spawn knob/config behavior checks

Codex To-Do Checklist:

- [ ] Implement per-slot vehicle respawn timer state keyed to configured vehicle slot mapping.
- [ ] Render timer HUD output from authoritative timer state only.
- [ ] Implement vehicle spawn queue behavior and queue arbitration for shared vehicle systems.
- [ ] Add vehicle repair runway/pad support.
- [ ] Add configurable knobs for vehicle spawns and ensure they are applied from authoritative config/runtime state.
- [ ] Respect disabled slot hiding behavior and per-map respawn values.
- [ ] Validate destroy-to-respawn timings against configured constants.
- [ ] Validate queue fairness and slot-release behavior.
- [ ] Validate repair runway/pad behavior under normal and edge-case entry/exit scenarios.
- [ ] Validate vehicle spawn knobs across supported slot/spawn scenarios.
- [ ] Record timer accuracy evidence across multiple slot types.

Phase Changelog:

- `Log policy`: append-only; newest entry first.
- `Current status`: `not_started`
- `Implementation entry format`: `YYYY-MM-DD | summary | files changed | verification`
- `Design modification entry format`: `YYYY-MM-DD | trigger | proposed change | impacted CF/PD/Phase | decision status | required doc updates`
- `Entries`: `None yet`

<a id="phase-6"></a>
### Phase 6: Basic Spawn and Boundaries System

Deliverables:

- random spawn-point selection flow with configured restrictions
- aircraft-vs-vehicle boundary enforcement
- main-base out-of-bounds enforcement
- kill-player out-of-bounds behavior
- dedicated team-switch buttons on minimap
- preserve extension seams for advanced spawn contract (no node-risk logic in this phase)

Mapped clarifications:

- `CF-23`, `CF-24`, `CF-25`, `CF-27`, `CF-63`, `CF-72`, `CF-73`, `CF-80`, `CF-86`

Godot/map prerequisites:

- authored spawn-point sets (team, per-flag, fallback as applicable)
- authored boundary volumes/config for aircraft, vehicles, and main bases

Verification:

- `npm run verify`
- spawn validity and restriction checks
- aircraft-vs-vehicle boundary behavior checks
- main-base out-of-bounds checks
- kill-player out-of-bounds enforcement checks
- dedicated minimap team-switch button behavior checks
- confirm no advanced node/LOS/heatmap logic is active in Phase 6

Codex To-Do Checklist:

- [ ] Implement random spawn selection using configured team/flag/fallback sets.
- [ ] Enforce neutral-flag spawn restriction and explicit fallback chain behavior.
- [ ] Implement aircraft-vs-vehicle boundary distinction.
- [ ] Implement main-base out-of-bounds enforcement.
- [ ] Kill players when out-of-bounds according to boundary rules.
- [ ] Add dedicated team-switch buttons on the minimap and validate their team-switch flow ownership.
- [ ] Add clear diagnostics for missing/invalid spawn sets per validator policy.
- [ ] Keep advanced node-risk/LOS/heatmap logic disabled in this phase.
- [ ] Run spawn restriction, fallback, and boundary tests across team swap/redeploy scenarios.

Phase Changelog:

- `Log policy`: append-only; newest entry first.
- `Current status`: `not_started`
- `Implementation entry format`: `YYYY-MM-DD | summary | files changed | verification`
- `Design modification entry format`: `YYYY-MM-DD | trigger | proposed change | impacted CF/PD/Phase | decision status | required doc updates`
- `Entries`: `None yet`

<a id="phase-7"></a>
### Phase 7: Custom Tab Scoreboard + KPI Tracking

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
- Phase 7 must still derive KPI truth from authoritative gameplay/capture state and confirmed event APIs, not from sound dispatch logs or audio queue behavior.

Codex To-Do Checklist:

- [ ] Confirm KPI event APIs in `api_checklist.md` as `Confirmed` or `Replaced` before enabling each KPI path.
- [ ] Implement KPI state mutations and derived-score/KDR math according to CF scoreboard rules.
- [ ] Implement scoreboard render/update with dirty/signature discipline (no blind refresh loops).
- [ ] Clean up the ready-up dialog after scoreboard/KPI work clarifies what pre-match and live-state UI responsibilities should remain there.
- [ ] Validate reconnect/redeploy behavior and stat continuity expectations for V1 policy.
- [ ] Run event-to-KPI accuracy tests and log gating results for Phase 7 signoff.

Phase Changelog:

- `Log policy`: append-only; newest entry first.
- `Current status`: `not_started`
- `Implementation entry format`: `YYYY-MM-DD | summary | files changed | verification`
- `Design modification entry format`: `YYYY-MM-DD | trigger | proposed change | impacted CF/PD/Phase | decision status | required doc updates`
- `Entries`: `None yet`

<a id="phase-8"></a>
### Phase 8: Pre & Post Match Events

Deliverables:

- final result UI + delayed finalize/end flow
- ready-up dialog cleanup and end-of-round transition cleanup
- redesign join prompt
- defined round-start behavior limitations and accepted constraints

Mapped clarifications:

- `CF-16` and scoreboard formatting dependency `CF-41`

Godot/map prerequisites:

- optional camera anchors only if cinematic flow is added

Verification:

- `npm run verify`
- final ticket/result accuracy and single end transition check
- ready-up dialog cleanup/regression checks across pre-match, live, and post-match transitions
- redesigned join-prompt behavior/regression checks across initial join, reconnect, and live-state handoff
- round-start behavior limitation review and documentation pass

Codex To-Do Checklist:

- [ ] Implement post-match result screen fields using frozen end snapshot only.
- [ ] Enforce single end transition path through end latch (no duplicate finalize paths).
- [ ] Clean up the ready-up dialog for pre-match/post-match transition correctness and ownership clarity.
- [ ] Redesign the join prompt and validate its ownership/flow across first join, reconnect, and transition to match-live state.
- [ ] Determine and document round-start behavior limitations before expanding pre/post-match event flow.
- [ ] Validate winner/result/ticket/elapsed accuracy against authoritative snapshot.
- [ ] Validate delayed finalize/end flow under normal and edge-case match endings.

Phase Changelog:

- `Log policy`: append-only; newest entry first.
- `Current status`: `not_started`
- `Implementation entry format`: `YYYY-MM-DD | summary | files changed | verification`
- `Design modification entry format`: `YYYY-MM-DD | trigger | proposed change | impacted CF/PD/Phase | decision status | required doc updates`
- `Entries`: `None yet`

<a id="phase-9"></a>
### Phase 9: Iteration, Playtesting, and Polish (Open-Ended)

Deliverables:

- open-ended multiplayer playtesting cadence across all implemented core systems
- prioritized polish/iteration pass for UX, readability, flow consistency, and balance tuning
- consolidated defect burn-down for blockers/high-impact regressions before future-phase expansion
- ongoing performance monitoring and regression tracking across implemented systems

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

Codex To-Do Checklist:

- [ ] Maintain a live prioritized playtest/polish backlog (blockers first, then major UX issues).
- [ ] Execute iterative fix/tune passes with short validation loops after each batch.
- [ ] Re-test previously fixed issues to prevent regressions.
- [ ] Monitor performance during ongoing playtest/polish passes and record any regressions or new hotspots.
- [ ] Keep this phase open-ended until explicit human signoff to proceed.
- [ ] Record accepted tuning/polish decisions in phase changelog entries.
- [ ] Re-add conquest flag ownership borders only after a single script-authoritative visual-state path is verified for neutralize->neutral->recapture transitions in multiplayer (no mixed owner/progress fallbacks in render decisions).
- [ ] Add a focused border reintroduction test pass.
- [ ] Validate neutralization edge (owner drained to neutral) never leaves stale enemy border.
- [ ] Validate neutral capture progression continues without leaving/re-entering radius.
- [ ] Validate recapture completion switches visuals exactly once with no stale overlays.

Phase Changelog:

- `Log policy`: append-only; newest entry first.
- `Current status`: `in_progress`
- `Implementation entry format`: `YYYY-MM-DD | summary | files changed | verification`
- `Design modification entry format`: `YYYY-MM-DD | trigger | proposed change | impacted CF/PD/Phase | decision status | required doc updates`
- `Entries`:
  - `2026-03-02 | Repeated neutralization-border regression during Phase 3 implementation/testing | Deferred flag border feature to Phase 9 polish; remove border feature from active implementation until a single authoritative visual-state path is validated | Phase 3B, Phase 9 | accepted | Added Phase 9 to-do + explicit border reintroduction validation criteria`
  - `2026-03-01 | Phase sequence update request | Added open-ended iteration/playtesting/polish phase before bot simulation and bumped downstream phase numbering | Phase 9, Phase 10, Phase 11, Phase 12 | accepted | design_doc phase ordering + numbering updated`

<a id="phase-10"></a>
### Phase 10: Advanced Features

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
  - `2026-03-12 | Phase-plan update request | Added Phase 10 Advanced Features for spawning aircraft in air and spawning vehicles by user-chosen orientation; bumped downstream future phases accordingly and updated Phase 5/6 titles/scope | Phase 5, Phase 6, Phase 10, Phase 11, Phase 12, Phase 13 | accepted | design_doc future-phase ordering + deliverables/checklists updated`

<a id="phase-11"></a>
### Phase 11: AI/Bot Simulation and Spawn-Balance Validation (Future)

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

<a id="phase-12"></a>
### Phase 12: Advanced Spawn Contract Integration (Post-Core Only)

Hard gate:

- Phase 12 starts only after Phases 1-11 are implemented, verified, and stable.

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

<a id="phase-13"></a>
### Phase 13: Spawn Design Documentation and Contract Analysis (Integrated)

Hard gate:

- Phase 13 starts after Phase 12 implementation baseline is stable.

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

- `CF-86` plus Phase 11 spawn-contract clarifications.

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
- [ ] Ensure Phase 11 implementation learnings are reflected in this analysis section.
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
