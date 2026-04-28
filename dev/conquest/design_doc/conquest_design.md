# TWL Conquest Design

The canonical design rulebook for TWL Conquest. Evergreen content only — locked architectural decisions, UI contracts, gameplay rules, and pattern records. New design proposals and architecture decisions land here.

## Status

Implementation through Phase 10 is functionally complete. Active work is **polish + memory/performance optimization** driven by 16-player playtest results. Optimization tracking lives in [`conquest_optimization.md`](./conquest_optimization.md) (reader's guide) and its sister state/analysis docs. Open issues live in [`conquest_issues.md`](./conquest_issues.md).

This doc is the place to add new design proposals, new architecture decisions, and amendments to the locked rules below.

---

## New Designs / Proposed Changes

*(append new design entries here as they arise; resolved entries fold into the locked sections below)*

*None active.*

---

## Locked Architectural Decisions

These rules are baked into the codebase and not up for casual revision. Changes require explicit user approval.

### Code structure

- Conquest is the entire project; there is no separate `src/conquest/` root. Logic lives in existing domains: `src/config`, `src/state`, `src/hud`, `src/vehicles`, `src/index`, `src/interaction`, `src/ui`, `src/clock`, `src/boundary`, `src/ready-dialog`, `src/kpi`, `src/foundation`.
- ObjIds and map-specific wiring belong in `src/config/maps/*`, not scattered in runtime logic.
- Every new function carries a one-line purpose comment describing intent and any non-obvious side effect or constraint. Section header / standalone-line comments are stripped at build by `postbuild.js` — they cost zero bundle bytes.

### State and data flow

- `State` (`src/state/runtime-state.ts`) is the single authoritative store for gameplay-critical data.
- Conquest tickets are authoritative in `State`; any engine score mirroring is one-way write-only projection from state.
- HUD is a view projection of `State`. Mutations go through state, then HUD reads.
- Per-pid state requires a paired `delete` reachable from `onPlayerLeaveGameImpl`. See [`conquest_optimization_state.md`](./conquest_optimization_state.md) "Lifecycle Map".

### Performance / tick policy

- Event-driven first, low-frequency loops second.
- `OngoingPlayer` must remain lightweight — no per-tick `AllPlayers × AllX` scans, no widget lookups in update paths.
- Cache frequently-reused references and ids; the `wn(name, pid)` widget-name factory is canonical.
- Render/update strategy: event edges set dirty flags, render builds a model once per dirty event, applies per player. See "Locked Architectural Patterns" below.

### API discipline

- All `mod.*` and `modlib.*` symbols must validate against `bf6-portal/dev/reference_bf6_core` before use. No invented API calls.
- `mod.Message()` accepts only `string | number | Player` arguments. Player-facing text must use registered string keys from `src/strings.json` via `mod.stringkeys.*` — literal strings produce `"unknown string"` at runtime.
- `mod.AddUIIcon` is non-functional on the current engine build. Use spawned `WorldIcon` clones with `SetWorldIconOwner(icon, player)` instead.
- Player-facing string changes (`src/strings.json`, hardcoded UI/world-log labels) require explicit human approval before edit.

### Per-PID UI scope

Per-player widget caches are required, not optional. Two principles drive this:

1. **Interactivity** — when a player hovers/focuses/clicks a widget, the visual reaction is for that player only. Team- or globally-scoped widgets cause cross-player visual clashes.
2. **Responsivity** — when a player connects (initial join, late join, team swap, reconnect), the UI state must be contextual to *them* — team perspective coloring, cooldowns, button-enable state, engage HUD, boundary prompts.

Reclaim work must trim *inside* the per-PID model (drop redundant fields, consolidate fragmented allocations) — not widen scope to per-team or global. Match clock is a possible narrow exception (purely passive content); everything else is per-PID.

---

## Locked UI/Color Contract

- **Friendly is always left + blue.**
- **Enemy is always right + red.**
- Explicit vanilla-BF6 alignment choice; preserved across all conquest UI to reduce ambiguity.

---

## Locked Architectural Patterns

Conventions used throughout the codebase. New code follows these.

| Pattern | Description |
|---------|-------------|
| **State Projection** | `State` is authoritative; HUD is a view projection updated on mutation. Never read display state from widgets. |
| **Event Queueing** | Sound and VO events queue and flush on fixed cadence with per-recipient throttling (see `index/capture-sound.ts`, `index/capture-vo.ts`). |
| **Safe Accessors** | `safe*()` pattern for guarded engine calls (`safeFind`, `safeGetPlayerId`, `safeSetUITextLabel`, `safeGetSoldierStateBool`, etc.) — every engine call that can fail is wrapped. |
| **Per-Player Maps** | State uses PID-keyed `Record<number, T>` extensively; `delete` on disconnect, paired against `onPlayerLeaveGameImpl`. |
| **Loading Gate** | Unified single-owner state machine for first-join and team-swap with floor + hard-timeout (see `interaction/actions.ts`). All production menu entry points consult the same gate contract. |
| **Widget Caching** | Hot-path widgets cached per-player in `State.hudCache.*`; cold-path uses `safeFind()`. |
| **Warm Token Invalidation** | `hudWarmToken` per player prevents stale async passes from writing to current state. |
| **ForAllPlayers** | ~30 functions iterate `mod.AllPlayers()` with validity checks via `forEachValidPlayer` shared helper. |
| **Dirty-Flag HUD** | Combat HUD render gated on `State.conquest.debug.hudDirty || force`. Every mutation that affects HUD must call `markHudDirty()` in the same function body. See contract enumerated in [AGENTS.md](../AGENTS.md). |
| **Single Owner Authority** | Lifecycle/match-end mutators have one owner function each (`end_CheckAndEndMatch`, `releaseLoadingGate`, etc.); all callers route through that owner with guard-on-already-fired semantics. |
| **PID-suffixed widget names** | All cached widget names carry `_${pid}` via `wn(name, pid)`. Required to avoid namespace collisions in the engine widget registry. |

---

## Locked Vehicle Patterns

### Vanilla spawner architecture

One persistent `VehicleSpawner` per slot, serial `spawnMutex` dispatching via `ForceVehicleSpawnerSpawn`, event-driven bind via `OnVehicleSpawned`, `Clocks.CountDownClock`-driven respawn. See `src/vehicles/vanilla-spawner.ts`. Pre-existing parallel-spawn paths and reservation systems are deleted; do not reintroduce.

### Post-seat vehicle teleport (HQ / Forward / Air Deploy)

All three player-triggered deploy paths share one seat code path: `onHqSeatPendingPlayerDeployed` → `mod.ForcePlayerToSeat(player, vehicle, -1)` inside `OnPlayerDeployed`. The Teleport timing rule:

- **HQ Deploy:** vehicle stays at `slot.spawnPos` (HQ pad) through the `DeployPlayer` chain. No pre-seat or post-seat Teleport needed.
- **Forward Deploy / Air Deploy:** `pendingSpawnMode === "forward" | "air"` early-returns in `doDispatch` (no pre-seat Teleport). Target pos/rot snapshotted in `onHqSeatPendingPlayerDeployed` *before* the success hooks re-seed for the next click. After `mod.ForcePlayerToSeat(...)` completes, `mod.Teleport(vehicle, targetPos, yawRad)` relocates the vehicle (with the seated player aboard).

Validated: `mod.Teleport(vehicle, ...)` carries the seated occupant. No visible pop during the HQ-pad occupancy window because the player is in the deploy UI, not the 3D world.

### Banned vehicle patterns

- **`mod.Teleport(player, ...)` immediately before `ForcePlayerToSeat`** — broken twice in v1.106–v1.108 and v1.151–v1.154. Permanent ban. Memory: `project_teleport_vehicle_spawn_mystery.md`.
- **Pre-seat vehicle Teleport** in `doDispatch` for forward/air paths — drops vehicle loadout. v1.333/v1.334 fix moved both to post-seat.
- **`SetObjectTransform` on a `Vehicle` instance** — no-op on the current engine build. All post-bind vehicle placement goes through `mod.Teleport`.
- **`SetObjectTransform` on a persistent `VehicleSpawner` to relocate at altitude** — does not reliably propagate position. v1.331 probe disproved.

### Engine event reliability — known asymmetric

- `OnPlayerEnterVehicle` drops events under load (CQ_Bug_43, #106). Code that depends on a fresh `seatKind` on entry must include a safety-net engine re-probe.
- `OnPlayerExitVehicle` is reliable. Don't pre-emptively guard the exit side.

### `ForcePlayerToSeat` constraint

`ForcePlayerToSeat` is reliable only inside the `OnPlayerDeployed` event handler. The Phase 6 HQ Deploy "BountyHunter pattern" enforces this: undeploy → redeploy → seat-on-deploy.

---

## CF Design Rules — Gameplay

These are the locked gameplay design decisions. CF = Conquest Function rule. PD = Project Decision.

### Lifecycle and authority

- **CF-69** Lifecycle model: `NOT_READY → PRE_MATCH → LIVE_MATCH → POST_MATCH → RESET`. Implemented directly in authoritative state/enums.
- **CF-70** Match-end authority: only `end_CheckAndEndMatch(...)` may transition to end state. All callers guard with `if (state.matchEnded) return`.
- **CF-88** Admin/test controls route through authoritative gameplay paths. Admin actions are request triggers, not parallel state machines.
- **CF-101 / CF-110** End-latch atomicity: all end paths route through one global latch and one atomic snapshot freeze. After `endLatched = true`: no further ticket drains, spawn-charge deductions, KPI mutations. Read-only UI projection only.
- **CF-95** Post-match snapshot is frozen at the latch moment; render from the snapshot, not live state.
- **CF-7 / CF-60 / CF-75** End priority: tickets first, then clock fallback. Draw only when both teams have tickets > 0 and clock reaches 00:00. If both teams reach 0 in the same evaluation window, draw.

### Tickets and bleed

- **CF-1** Starting tickets: `400` (recently retuned from 350 — see `config/conquest-constants.ts`).
- **CF-2** Bleed: flag-differential only; neutral flags excluded. Initial rate `1 ticket × differential / 3 seconds`, fractional carry. Implemented as `perDiffPerSecond = 1/3`.
- **CF-3** Bleed suspends without a positive differential.
- **CF-4** Infantry ticket loss: 1 ticket on spawn-in (not on death event), exempt for first live spawn after round start.
- **CF-5** Vehicle ticket penalties: none.
- **CF-6** Capture/neutralization direct ticket deltas: none. All ticket impact is indirect via bleed.
- **CF-57 / CF-61** `State` is the source of truth for tickets; engine score is mirrored on every ticket change, write-only.

### Spawn-charge

- **CF-117** Spawn-charge: 1-ticket deduction on a successful live-phase spawn/deploy into world. First live spawn exempt. Transaction-guarded.
- **CF-50 / CF-91** Charged reasons: deploy, forced redeploy, team switch, admin move, reconnect, phase-transition. Not charged during non-live phases.
- **CF-71** Per-player deploy transaction tracking: `deploySeq`, `lastChargedDeploySeq`, `lastChargeTimestamp`, plus duplicate-charge suspicion counter.
- **CF-76 / CF-113** First-live-spawn exemption is round-start-only. Reconnect / team-switch / admin-move / late join do **not** grant a new exemption.
- **CF-99 / CF-107 / CF-108** Identity policy (V1): session-scoped `pid` only. Reconnect = new identity; no continuity. Stable account-level identity is not validated on this engine.
- **vehicle_deploy / team_switch exemption (v1.393):** alive on-foot vehicle deploys (HQ / Forward / Air) and pre-game/live team-swaps do **not** charge a ticket — these are voluntary UX actions, not deaths.

### Capture mechanics

- **CF-9** Engine-configured capture/neutralize timing in V1. Defaults: capture = 20s, neutralize = 20s (Mancours-calibrated v1.392).
- **CF-10 / CF-11** Contested logic is team-count weighted. Multipliers are engine-only (`1.15` to `2.0` cap); script must not apply additional multipliers.
- **CF-51 / CF-58 / CF-89** Capture authority: engine owns ownership/progress/timing/multiplier. Script owns ticket consequences, KPI attribution, UI projection.
- **CF-102** Capture authority matrix (locked):
    - owner: engine
    - progress: engine
    - contested: engine
    - multipliers: engine
    - tickets/bleed: script
    - KPI / UI projection: script
- **CF-105** Locked engine surface: `OngoingCapturePoint`, `OnCapturePointCapturing`, `OnCapturePointCaptured`, `OnCapturePointLost`, `OnPlayerEnterCapturePoint`, `OnPlayerExitCapturePoint`; reads `mod.GetCaptureProgress`, `mod.GetCurrentOwnerTeam`, `mod.GetOwnerProgressTeam`, `mod.GetPreviousOwnerTeam`, `mod.GetPlayersOnPoint`.
- **CF-106** Capture ObjId mapping: runtime objId from event ↔ `capturePoints[].objId` in map config. Unmapped points: safe no-op + admin warning.

### Sound

- **CF-17** Required V1 capture sounds: capturing only.
- **CF-18** Throttle: minimum `1.0s` cooldown per capture-sound event key.
- **CF-19** Sound perspective: per-viewer team perspective always.

### UI

- **CF-13** Color contract: friendly left/blue, enemy right/red (see Locked UI Contract above).
- **CF-15** Capture progress visibility: always visible.
- **CF-16** Post-match mandatory fields: winner + final tickets, elapsed time, admin actions used, total kills/deaths/captures/assists, team averages from scoreboard columns.
- **CF-118** Player-facing string changes require explicit human approval before edit.

### Spawn policy

- **CF-23** Spawn selection: random spawn point selection (V1).
- **CF-24** Squad spawn logic: out of script scope (web config setting).
- **CF-25** Neutral flag cannot be spawned until ownership is acquired.
- **CF-72** Custom spawn fallback chain (when active): `flagSpawnSet → teamSpawnSet → fallbackSpawnSet → deny spawn with debug log`.
- **CF-86** Advanced spawn contract (node-based safety/LOS/cooldown/heatmap) is out of scope until a future post-core phase. See `reference_design_documentation/archive/spawn_system_contract.md`.

### Vehicles

- **CF-21** Vehicle respawn times: per-map config.
- **CF-22** Disabled vehicle slots: hidden in HUD.
- **CF-20** Vehicle timer HUD scope: all vehicle timers in HUD (V2+).

### Map data

- **CF-26** First map target: Operation Firestorm.
- **CF-27 / CF-92** Per-map data contract: placeholders allowed for unresolved fields; explicit replacement markers required. Map schema migrates in-place to conquest schema.
- **PD-03** Local conquest map config is canonical for runtime ObjId/source mapping.
- **CF-28** Required ObjId data groups: capture points, HQ areas, soldier/ground vehicle boundaries, aircraft boundaries, sectors/objectives, world interactables (main base + point).
- **CF-29** Map readiness validation owner: human, using Godot spatial data references.
- **CF-119** Schema ownership: `MapConfig.mainBaseInteractableObjIds[]` and `MapConfig.gadgetInteractableObjIds[]` are canonical explicit per-map lists. Runtime must not infer interactables by scanning ranges alone.
- **CF-120** ObjId allocation contract:
    - main-base interactables start at `1000`, authored as even/odd pairs
    - even objId → ready dialog
    - odd objId → vehicle spawn menu
    - point interactables use `1050–1099`, all map to ammo resupply menu
    - parity/range rules are validator checks; the map-config entry is the source of truth
- **CF-121** Main-base terminal icon ownership: authored `WorldIcon` + `InteractPoint` pairs define the anchor; the visible icon is a per-player runtime spawned `WorldIcon` clone owned by script (since `mod.AddUIIcon` is broken). Shown only while the player is deployed inside their own HQ on the team that owns the terminal. Authored `InteractPoint`s are shared; script gates activation by team/HQ state.
- **CF-80 / CF-85** Map-validator strictness: required-type mismatches and missing required sets emit warnings + safe fallbacks. No automatic match abort. Capability-bounded: validator only checks what is observable in Portal runtime.
- **CF-111** Validator capability matrix: warn-first / non-blocking in V1. Each check classified `runtime-observable` or `human/config`. Missing/unsupported checks logged as unresolved capability, not pass.

### Scoreboard / KPIs

- **CF-37** KPI columns (mandatory): kills, deaths, assists, flag captures, score, KDR.
- **CF-38** Score formula (constant-driven, tunable):
    - `SCORE_KILL = 100`
    - `SCORE_ASSIST = 50`
    - `SCORE_FLAG_CAPTURE = 300`
    - `SCORE_REVIVE = 50`
    - `SCORE_DEATH_PENALTY = 0`
    - `score = kills × KILL + assists × ASSIST + captures × CAPTURE + revives × REVIVE − deaths × DEATH_PENALTY`
- **CF-39 / CF-79 / CF-83** KDR: floor to one decimal place. Deaths = 0 with kills > 0 → display "infinity"; internal sort value is `kills`.
- **CF-40** Sort: score (desc), then KDR (desc), then assists (desc).
- **CF-41** Team averages post-match: average KDR, average flag captures, average score.
- **CF-44** KPI reset boundaries: live-match only. Reset on map/match end or end-scoreboard transition.
- **CF-45 / CF-65 / CF-77 / CF-82** Capture credit: all eligible players on point at cap tick get credit. Eligibility = alive + on capturing team. Vehicle-seat occupants within capture radius are eligible. No anti-farm threshold in V1.
- **CF-46 / CF-64** Assist credit finalized only on permanent death (no credit if target is revived and survives). Pending-death pattern: stage on `OnPlayerDied`, cancel on `OnRevived`, finalize on `OnPlayerUndeploy` / `OnPlayerLeaveGame` while still pending. `OnMandown` is non-authoritative.
- **CF-47** Display precision: 0.1 (tenths) for KDR and team averages.

### Validation and process

- **CF-30 / CF-31** Acceptance: human in-game feature validation per change. Mandatory manual scenarios: join/leave, redeploy, team swap. Map switch is excluded (no map switch flow). Full match not mandatory each change.
- **CF-33** Rollback: git history.
- **CF-36** Requirement change approval: human approves; LLM must request permission on requirement changes; this doc + the optimization docs are the master design source.
- **CF-49** AI/Bots are out of scope for V1. Planned future phase for performance measurement and spawn-balance validation.
- **CF-53 / CF-114** API validity: every required event/function maps to a validated Portal/modlib symbol. `api_checklist.md` (now archived) was the proof ledger; `reference_bf6_core` is the active catalog. No invented API calls.
- **CF-54** UI updates are dirty/signature-driven. Fallback cadence refresh runs only when dirty or stale.
- **CF-78 / CF-84** Soft-shedding allowed in debug/stress mode only (flag HUD interval, scoreboard interval, progress bucket size). Sound queue cadence is never shed — keep deterministic audio dispatch.

---

## Cross-references

- [`conquest_optimization.md`](./conquest_optimization.md) — reader's guide to the optimization docs
- [`conquest_optimization_state.md`](./conquest_optimization_state.md) — file map, function inventory, lifecycle map, naming economy
- [`conquest_optimization_analysis.md`](./conquest_optimization_analysis.md) — M1–M15 ranking, Tier A–F reclaim ladder, no-go list
- [`conquest_issues.md`](./conquest_issues.md) — issue bodies
- [`conquest_issues_summary.md`](./conquest_issues_summary.md) — issue index
- [`universal_enums.md`](./universal_enums.md) — Portal API enum reference

Archived planning docs and historical phase records live in [`../reference_design_documentation/archive/`](../reference_design_documentation/archive/) — historical only, treat as outdated unless explicitly referenced.
