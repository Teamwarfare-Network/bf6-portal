# TWL Conquest Design and Implementation Plan

Last updated: 2026-02-18  
Audience: Future implementers working in `bf6-portal/dev/conquest/src`

## Purpose

This is the master design document for TWL Conquest.  
Workflow for this document:

1. Clarification round (human answers)
2. Reconcile answers into concrete feature/architecture notes
3. Mark open items
4. Start only the phases whose required clarifications are fully resolved
5. Repeat with expert challenge rounds until no open blockers remain

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

## UI/Color Contract (Locked)

- Friendly is always left + blue.
- Enemy is always right + red.
- This is an explicit vanilla-BF6 alignment choice and must be preserved across all conquest UI.

## Feature Inventory

- Capture backbone + ticket model
- Temporary debug HUD for Phase 2 validation
- Flag state/progress UI
- Capture sound layer
- Basic spawn logic (Godot-authored points first)
- Vehicle respawn timers
- Post-match ticket/result screen
- Custom tab scoreboard with soldier-level KPIs:
  - kills, deaths, assists, flag captures, score, KDR
- Future feature phase (not V1):
  - AI/Bot simulation layer for performance measurement and spawn-point balance validation
  - Advanced spawn contract system (node-based safety/LOS/heatmap/cooldown logic), only after all current phases are implemented

## Deferred Spawn Contract (Post-Core Only)

Source:

- `bf6-portal/dev/conquest/reference_design_documentation/archive/spawn_system_contract.md`

Status:

- Contract is accepted as future direction.
- Implementation is explicitly deferred to a final follow-on phase (after Phases 1-9).
- Phase 7 remains basic/random spawn behavior with low overhead.

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

Expected placement (extend existing domains only; no `src/conquest/` root):

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

Current project structure is already conquest-ready:

- authoritative state model in `src/state`
- map-driven config pattern in `src/config`
- per-player HUD lifecycle in `src/hud`
- vehicle lifecycle handlers in `src/vehicles`
- gameplay event routing points in `src/index`

Primary known implementation gap:

- `src/index/area-triggers.ts` capture-point flow is not yet wired for full conquest ownership/ticket behavior.
- current bundle baseline does not yet represent a full conquest ticket/bleed/capture implementation path.

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

These names are planning anchors for implementation/review and can be adjusted during coding.

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

### 5) Vehicle Timers + Basic Spawn

- `vehicleTimer_OnDestroyed(vehicleObjId: number, slotIndex: number)`
- `vehicleTimer_GetRemaining(slotIndex: number)`
- `vehicleTimer_UpdateHudForAllPlayers()`
- `spawnBasic_GetCandidates(teamId: number, context: unknown)`
- `spawnBasic_Select(teamId: number, context: unknown)`
- `spawnBasic_Deploy(player: mod.Player, selectedSpawn: unknown)`
- `spawnBasic_ResolveFallbackChain(teamId: number, objectiveContext: unknown)`
- `spawnAdvanced_EvaluateNodeRisk(nodeId: number, teamId: number)` // reserved for post-core Phase 10

### 6) Map Configuration and Validation

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
- `CF-02` Bleed formula: flag differential only; neutral flags excluded; initial rate `1 ticket * differential / second` (constant-driven).
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

- `CF-09` Capture/neutralize times: use engine defaults in V1.
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
- `CF-95` Post-match freeze point: freeze tickets/KPIs/team-averages at the first successful `end_CheckAndEndMatch(...)` latch (ticket-zero or clock-zero path), then render post-match from frozen snapshot only.

### D) Sound Behavior

- `CF-17` Required V1 capture sounds: capturing only; other sound events deferred to V2+.
- `CF-18` Sound throttle window: minimum `1.0s` cooldown per capture-sound event key (constant-driven default for 30Hz servers).
- `CF-19` Sound perspective: per-viewer team perspective always.

### E) Vehicle Timer/Spawner Policy

- `CF-20` Vehicle timer HUD scope: all vehicle timers in HUD, targeted for V2+.
- `CF-21` Vehicle respawn times: defined per map config.
- `CF-22` Disabled vehicle slots: hidden.
- `CF-96` Vehicle refactor timing policy: keep current vehicle spawner behavior as baseline through Phases 1-5; refactor to timer-contract structure in Phase 6 unless a blocker bug/perf issue requires earlier minimal intervention.
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
- `CF-63` Spawn-schema readiness gate: `teamSpawnSets`, `flagSpawnSets`, and `fallbackSpawns` are optional before Phase 7 and mandatory at Phase 7 entry.
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
  - checklist location: `bf6-portal/dev/conquest/reference_design_documentation/api_checklist.md`
  - required artifact timing: `api_checklist.md` is mandatory by Phase 1 exit (minimum scaffold + initial statuses)
  - source split: `reference_bf6_core` is the API catalog/source-of-truth for available symbols; `api_checklist.md` is this project's proof ledger for required symbols and status (`Confirmed`/`Replaced`/`Deferred`)
  - Phase 1 artifact format requirements:
    - capture API proof log: `requirement -> verified symbol -> local reference path -> compile/runtime probe result -> fallback/replacement note`
    - lifecycle authority proof: `lifecycle mutator inventory -> owner function -> allowed callers -> guard/latch proof -> blocked legacy path proof`
    - validator capability matrix: `check id -> runtime-observable|human/config -> required symbol(s) -> supported/unverified -> runtime diagnostic behavior`
  - signoff: human owner plus one expert reviewer
- `CF-114` API checklist artifact decision: keep `api_checklist.md` as required project signoff evidence, not as a replacement for API catalog docs.
- `CF-94` API confirmation policy for KPI/capture attribution: unknown attribution APIs are placeholder-approved only until phase entry gates.
  - Required gate: before Phase 4 implementation/signoff, `api_checklist.md` must explicitly mark kill/death/assist/permanent-death/capture event paths as `Confirmed` or `Replaced`.
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
- `PD-05` KPI scope gating decision: KPI scope finalization does not gate Phases 1-3; lock mandatory V1 KPI subset near Phase 4 entry when API confidence is higher.

## Implementation Phases

Phase rule:

- A phase can start only when all mapped clarification IDs are defined, or explicitly marked placeholder-approved by design policy.
- Each phase below includes a Codex execution checklist; treat checklist completion plus verification as the phase-ready signal.

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

- `CF-13`, `CF-26`, `CF-29`, `CF-30`, `CF-31`, `CF-33`, `CF-36`, `CF-52`, `CF-53`, `CF-54`, `CF-57`, `CF-62`, `CF-66`, `CF-69`, `CF-70`, `CF-74`, `CF-78`, `CF-97`, `CF-100`, `CF-103`, `CF-104`, `CF-109`, `CF-111`, `CF-112`, `CF-114`, `CF-115`, `CF-116`, `PD-01`

Godot/map prerequisites:

- baseline map detection anchors

Verification:

- `npm run verify`
- startup smoke in-game with no regressions to existing HUD/clock/vehicle systems
- API checklist sanity pass (all planned calls known/supported or explicitly replaced)
- conquest string sanity pass (best-effort, non-blocking cleanup audit)
- initial stop-the-line evidence capture:
  - capture API proof log
  - lifecycle authority proof
  - validator capability matrix
  - each artifact must follow `CF-62` required format and include local reference paths

Codex To-Do Checklist:

- [ ] Create and populate `reference_design_documentation/api_checklist.md` baseline (`Confirmed`/`Replaced`/`Deferred` statuses).
- [ ] Implement conquest scaffolding in existing domains (`config/state/index/hud/interaction`) without gameplay behavior changes.
- [ ] Implement lifecycle owner guardrails and remove/reroute legacy direct lifecycle mutators (`CF-97`, `CF-109`).
- [ ] Produce Phase 1 evidence artifacts for capture API proof, lifecycle authority proof, and validator capability matrix.
- [ ] Run verification list and record pass/fail notes for Phase 1 signoff.

Phase Changelog:

- `Log policy`: append-only; newest entry first.
- `Current status`: `not_started`
- `Implementation entry format`: `YYYY-MM-DD | summary | files changed | verification`
- `Design modification entry format`: `YYYY-MM-DD | trigger | proposed change | impacted CF/PD/Phase | decision status | required doc updates`
- `Entries`: `None yet`

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

Codex To-Do Checklist:

- [ ] Validate and log required capture owner/progress symbols in `api_checklist.md` before implementation.
- [ ] Wire capture routing from engine events to mapped ObjId config entries with explicit unmapped-point diagnostics.
- [ ] Implement ticket/bleed/end-condition flow with `CF-101`/`CF-110` single-latch contract.
- [ ] Add temporary debug HUD for ownership/progress/ticket parity against authoritative state.
- [ ] Execute race-condition verification (ticket-zero vs clock-zero) and archive evidence for Phase 2 gate.

Phase Changelog:

- `Log policy`: append-only; newest entry first.
- `Current status`: `not_started`
- `Implementation entry format`: `YYYY-MM-DD | summary | files changed | verification`
- `Design modification entry format`: `YYYY-MM-DD | trigger | proposed change | impacted CF/PD/Phase | decision status | required doc updates`
- `Entries`: `None yet`

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

- [ ] Implement spawn-charge reason matrix and per-reason debug counters for all live-phase deploy paths.
- [ ] Implement per-player deploy transaction tracking and duplicate-charge suspicion diagnostics.
- [ ] Enforce `CF-113` exemption behavior (round-start only; no reconnect/team-switch/admin-move refresh).
- [ ] Enforce session-scoped identity policy (`CF-99`, `CF-107`, `CF-108`) and document fairness tradeoff in diagnostics.
- [ ] Run full redeploy/reconnect/admin-move matrix tests and attach invariant proof output.

Phase Changelog:

- `Log policy`: append-only; newest entry first.
- `Current status`: `not_started`
- `Implementation entry format`: `YYYY-MM-DD | summary | files changed | verification`
- `Design modification entry format`: `YYYY-MM-DD | trigger | proposed change | impacted CF/PD/Phase | decision status | required doc updates`
- `Entries`: `None yet`

### Phase 3: Flag UI + Color Contract

Deliverables:

- flag ownership/progress HUD
- enforced left-blue/right-red policy

Mapped clarifications:

- `CF-13`, `CF-14`, `CF-15`

Godot/map prerequisites:

- stable flag-to-ObjId mapping for display ordering

Verification:

- `npm run verify`
- HUD correctness under join/leave/redeploy/team swap scenarios

Codex To-Do Checklist:

- [ ] Implement or update flag HUD build/update paths with event-first dirty rendering.
- [ ] Enforce UI perspective contract everywhere (friendly left/blue, enemy right/red).
- [ ] Bind display ordering to stable flag ObjId mapping from config.
- [ ] Validate HUD behavior across join/leave/redeploy/team-swap transitions.
- [ ] Capture before/after evidence for UI parity and regression checks.

Phase Changelog:

- `Log policy`: append-only; newest entry first.
- `Current status`: `not_started`
- `Implementation entry format`: `YYYY-MM-DD | summary | files changed | verification`
- `Design modification entry format`: `YYYY-MM-DD | trigger | proposed change | impacted CF/PD/Phase | decision status | required doc updates`
- `Entries`: `None yet`

### Phase 4: Custom Tab Scoreboard + KPI Tracking

Deliverables:

- soldier KPI tracking
- custom tab scoreboard rendering and updates
- post-match aggregation hooks

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

Codex To-Do Checklist:

- [ ] Confirm KPI event APIs in `api_checklist.md` as `Confirmed` or `Replaced` before enabling each KPI path.
- [ ] Implement KPI state mutations and derived-score/KDR math according to CF scoreboard rules.
- [ ] Implement scoreboard render/update with dirty/signature discipline (no blind refresh loops).
- [ ] Validate reconnect/redeploy behavior and stat continuity expectations for V1 policy.
- [ ] Run event-to-KPI accuracy tests and log gating results for Phase 4 signoff.

Phase Changelog:

- `Log policy`: append-only; newest entry first.
- `Current status`: `not_started`
- `Implementation entry format`: `YYYY-MM-DD | summary | files changed | verification`
- `Design modification entry format`: `YYYY-MM-DD | trigger | proposed change | impacted CF/PD/Phase | decision status | required doc updates`
- `Entries`: `None yet`

### Phase 5: Capture Sounds

Deliverables:

- V1 capture sound event queue and dispatch

Mapped clarifications:

- `CF-17`, `CF-18`, `CF-19`

Godot/map prerequisites:

- required sound event keys/assets

Verification:

- `npm run verify`
- anti-spam validation under rapid objective transitions

Codex To-Do Checklist:

- [ ] Implement capture sound queue with per-event throttle (`CF-18`) and deterministic flush cadence.
- [ ] Restrict V1 sound scope to required capture events only.
- [ ] Enforce per-viewer team perspective for emitted sound events.
- [ ] Run rapid objective-transition spam tests and confirm throttle behavior.
- [ ] Record debug counters/trace output demonstrating no audio flood regressions.

Phase Changelog:

- `Log policy`: append-only; newest entry first.
- `Current status`: `not_started`
- `Implementation entry format`: `YYYY-MM-DD | summary | files changed | verification`
- `Design modification entry format`: `YYYY-MM-DD | trigger | proposed change | impacted CF/PD/Phase | decision status | required doc updates`
- `Entries`: `None yet`

### Phase 6: Vehicle Respawn Timers (V2+)

Deliverables:

- per-slot respawn timer tracking and HUD rendering

Mapped clarifications:

- `CF-20`, `CF-21`, `CF-22`

Godot/map prerequisites:

- complete vehicle spawner slot mapping and respawn config per map

Verification:

- `npm run verify`
- destroy-to-respawn timer accuracy checks

Codex To-Do Checklist:

- [ ] Implement per-slot vehicle respawn timer state keyed to configured vehicle slot mapping.
- [ ] Render timer HUD output from authoritative timer state only.
- [ ] Respect disabled slot hiding behavior and per-map respawn values.
- [ ] Validate destroy-to-respawn timings against configured constants.
- [ ] Record timer accuracy evidence across multiple slot types.

Phase Changelog:

- `Log policy`: append-only; newest entry first.
- `Current status`: `not_started`
- `Implementation entry format`: `YYYY-MM-DD | summary | files changed | verification`
- `Design modification entry format`: `YYYY-MM-DD | trigger | proposed change | impacted CF/PD/Phase | decision status | required doc updates`
- `Entries`: `None yet`

### Phase 7: Basic Spawn System

Deliverables:

- random spawn-point selection flow with configured restrictions
- preserve extension seams for advanced spawn contract (no node-risk logic in this phase)

Mapped clarifications:

- `CF-23`, `CF-24`, `CF-25`, `CF-27`, `CF-63`, `CF-72`, `CF-73`, `CF-80`, `CF-86`

Godot/map prerequisites:

- authored spawn-point sets (team, per-flag, fallback as applicable)

Verification:

- `npm run verify`
- spawn validity and restriction checks
- confirm no advanced node/LOS/heatmap logic is active in Phase 7

Codex To-Do Checklist:

- [ ] Implement random spawn selection using configured team/flag/fallback sets.
- [ ] Enforce neutral-flag spawn restriction and explicit fallback chain behavior.
- [ ] Add clear diagnostics for missing/invalid spawn sets per validator policy.
- [ ] Keep advanced node-risk/LOS/heatmap logic disabled in this phase.
- [ ] Run spawn restriction and fallback tests across team swap/redeploy scenarios.

Phase Changelog:

- `Log policy`: append-only; newest entry first.
- `Current status`: `not_started`
- `Implementation entry format`: `YYYY-MM-DD | summary | files changed | verification`
- `Design modification entry format`: `YYYY-MM-DD | trigger | proposed change | impacted CF/PD/Phase | decision status | required doc updates`
- `Entries`: `None yet`

### Phase 8: Post-Match Ticket Screen

Deliverables:

- final result UI + delayed finalize/end flow

Mapped clarifications:

- `CF-16` and scoreboard formatting dependency `CF-41`

Godot/map prerequisites:

- optional camera anchors only if cinematic flow is added

Verification:

- `npm run verify`
- final ticket/result accuracy and single end transition check

Codex To-Do Checklist:

- [ ] Implement post-match result screen fields using frozen end snapshot only.
- [ ] Enforce single end transition path through end latch (no duplicate finalize paths).
- [ ] Validate winner/result/ticket/elapsed accuracy against authoritative snapshot.
- [ ] Validate delayed finalize/end flow under normal and edge-case match endings.
- [ ] Capture signoff evidence showing no post-latch mutation of displayed results.

Phase Changelog:

- `Log policy`: append-only; newest entry first.
- `Current status`: `not_started`
- `Implementation entry format`: `YYYY-MM-DD | summary | files changed | verification`
- `Design modification entry format`: `YYYY-MM-DD | trigger | proposed change | impacted CF/PD/Phase | decision status | required doc updates`
- `Entries`: `None yet`

### Phase 9: AI/Bot Simulation and Spawn-Balance Validation (Future)

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

### Phase 10: Advanced Spawn Contract Integration (Post-Core Only)

Hard gate:

- Phase 10 starts only after Phases 1-9 are implemented, verified, and stable.

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

### Phase 11: Spawn Design Documentation and Contract Analysis (Integrated)

Hard gate:

- Phase 11 starts after Phase 10 implementation baseline is stable.

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

- `CF-86` plus Phase 10 spawn-contract clarifications.

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
- [ ] Ensure Phase 10 implementation learnings are reflected in this analysis section.
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
