# Conquest Audit v0.725 | 2026-03-19

Review type: current-branch review of the live `feature/conquest_attempt_b` working tree.

- Repo root: `bf6-portal`
- Mode root: `dev/conquest`
- Primary code surface: `dev/conquest/src`
- HEAD commit: `35f3d24e4272f9b72636bd9d46267bb6fd4423d7`
- Working-tree bundle version: `v0.725`
- Date perspective: `2026-03-19` local review date, with bundle header/footer stamped `03.20.26 | 01:51 UTC`
- Source count reviewed: `114` files under `src`
- Static verification: `cmd /c npx tsc -p "bf6-portal\\dev\\conquest\\tsconfig.json" --noEmit` passed
- Runtime playtest verification: not performed in this pass

## 1. Executive Summary

Overall verdict: the Conquest codebase is functionally credible and structurally far better than a single-file mode script, but it is still carrying three major ownership hotspots that dominate future risk: `index/capture-tickets.ts`, `interaction/actions.ts`, and `vehicles/deploy-timer-ui.ts`.

What is healthy now:

- The codebase follows the locked domain layout from the main design doc well: `config`, `state`, `index`, `interaction`, `vehicles`, `hud`, `ui`, `clock`, and `ready-dialog` are real ownership areas rather than cosmetic folders.
- Runtime state has a real central model in `state/runtime-types.ts` and `state/runtime-state.ts`.
- The ready dialog has been split into coherent files, especially roster, lifecycle, countdown, and mode-config schema ownership.
- The conquest HUD has a dedicated `ui/conquest/hud-core/*` subsystem rather than being fully tangled into the gameplay file.
- The current working tree still type-checks, so the active changes are not obviously breaking the TS surface.

What is still weak:

- `index/capture-tickets.ts` still owns too much: capture ingestion, ticket math, end checks, visual-state projection, top-HUD data shaping, popout/engage logic, and combat-HUD dispatch all live in one file.
- `interaction/actions.ts` is still the cross-system lifecycle orchestrator for HUD warm, reveal, team swap, deploy gating, and deferred UI prebuild. It works, but it is a long-term maintenance choke point.
- `vehicles/deploy-timer-ui.ts` still collapses policy, visibility, render-plan derivation, widget creation, and UI input into one oversized file.
- Manual widget cleanup remains fragmented across join/leave, HUD lifecycle, clock, and interaction code. This is the main UI-fragility theme in the repo.

Current bounded-spawn verdict:

- The weighted spawn-volume work in `vehicles/spawner-bind.ts` is a real improvement. The code no longer hard-picks `volumes[0]`; it now weights authored regions by usable size.
- The current transform contract is inconsistent. Config authoring now stores full `rotPlane` / `rotHeli` vectors, but the active relocation path only uses yaw via `mod.Teleport(..., yawRad)`. That means `X` and `Z` rotation components are currently dead authoring data.
- `config/maps/operation-firestorm.ts` currently defines jet floor/ceiling values in reversed order for the active aircraft boxes. Because the sampler clamps `maxHeight` to at least `minHeight`, that collapses the intended jet height band to a fixed altitude instead of a range.

Design-alignment verdict:

- High-level domain placement is consistent with the locked design document.
- The codebase remains consistent with the accepted "advanced spawn contract deferred" rule. The placeholder spawn-selector seam exists, but the advanced node-based selection system is still not implemented.
- The current bounded-volume work is aligned with accepted Phase 5F direction.
- The future "user-chosen orientation" feature from the design doc is still not implemented; the current rotation authoring is map-authored spawn orientation, not a player-facing orientation system.

## 2. Architecture Map

### Startup / Bootstrap

- Area: startup / bootstrap
- Primary files: `index.ts`, `types.ts`, `state/runtime.ts`, `foundation/*`
- Inputs: module load, BF6 Portal runtime entrypoints
- Outputs: global function availability, event routing, initial subsystem registration
- State owned: none directly; it wires ownership into the rest of the repo
- UI owned: none directly
- Lifecycle entry points: all exported runtime event handlers
- Known coupling points: import-order dependency on global functions instead of explicit imports/exports
- Boundary quality: acceptable
- Main problems: the import-fan-in model keeps the codebase workable in this environment, but it reduces local explicitness and makes ownership tracing depend on conventions
- Recommended correction: keep the current bootstrap shape, but do not let more domain logic drift into `index.ts`

### Runtime State

- Area: runtime state
- Primary files: `state/runtime-types.ts`, `state/runtime-state.ts`, `state/core.ts`, `state/id-helpers.ts`, `state/player-lookup.ts`, `state/lifecycle-guardrails.ts`
- Inputs: gameplay events, UI lifecycle events, map/runtime config updates
- Outputs: authoritative in-memory state used by capture, HUD, vehicles, ready dialog, and admin surfaces
- State owned: round, conquest, match, admin, debug, players, vehicles, HUD cache
- UI owned: cache only, not rendering policy
- Lifecycle entry points: state reset, player lookup, id normalization, cache helpers
- Known coupling points: almost every subsystem touches this layer
- Boundary quality: good
- Main problems: state is broad, and some UI cache structures expose lower-level widget concerns directly
- Recommended correction: keep this as the authority layer; resist moving more rendering logic into it

### Capture / Tickets / Match End

- Area: conquest gameplay core
- Primary files: `index/capture-tickets.ts`, `index/area-triggers.ts`, `conquest-flow.ts`, `index/capture-sound.ts`, `index/capture-vo.ts`
- Inputs: capture-point runtime events, live-loop ticks, player presence data
- Outputs: tickets, bleed, end-state latching, capture visual state, sound/VO dispatch, HUD snapshots
- State owned: capture ownership/progress runtime, tickets, bleed, engage state, active popout state
- UI owned: too much indirect ownership via view-model derivation
- Lifecycle entry points: capture-point events, live subtick, end-match path
- Known coupling points: conquest HUD, sound, VO, status text, player reset flows
- Boundary quality: blurred
- Main problems: `capture-tickets.ts` owns both game rules and a large portion of UI projection
- Recommended correction: split authoritative conquest state mutation from HUD snapshot / view-model derivation

### Combat HUD

- Area: combat HUD
- Primary files: `ui/conquest/hud-core/*`, `ui/conquest/top-hud-shell.ts`, `hud/status.ts`, `hud/help-visibility.ts`, `clock/ui.ts`, `ui/dialog/victory*`
- Inputs: conquest gameplay state, per-player perspective, HUD warm state, round clock state
- Outputs: top HUD shell, combat HUD, clock, help text, victory dialog
- State owned: per-player HUD cache, last rendered snapshot
- UI owned: yes
- Lifecycle entry points: HUD ensure/build, render, hide, reveal, team-swap reset, join/leave refresh
- Known coupling points: `index/capture-tickets.ts`, `interaction/actions.ts`, `index/player-join-leave.ts`
- Boundary quality: mixed
- Main problems: the HUD-core folder is well split internally, but the upstream snapshot/view-model ownership still lives too heavily in `capture-tickets.ts`; lifecycle cleanup is still manual and scattered
- Recommended correction: keep HUD-core physical split, but move upstream projection logic out of conquest gameplay core

### Ready Dialog / Pregame

- Area: ready dialog and pregame flow
- Primary files: `ready-dialog/*`, `interaction/ui-events-ready.ts`, `ready-dialog/roster-*`, `ready-dialog/mode-config-*`
- Inputs: interact / click events, team changes, mode-config changes, countdown state
- Outputs: roster UI, ready state, matchup summary, mode-config UI, join prompt, countdown flow
- State owned: ready-dialog player state and mode-config selection state
- UI owned: yes
- Lifecycle entry points: dialog build, roster render, lifecycle open/close/destroy, swap action, countdown start/stop
- Known coupling points: `interaction/actions.ts`, `admin-panel/*`, `config/map-runtime.ts`
- Boundary quality: good
- Main problems: some stale/deferred preset logic remains in `mode-config-presets.ts`; the build stack is still fairly layered and hard to trace without context
- Recommended correction: keep this split; only clean up deferred config branches and naming inconsistencies

### Interaction / HUD Warm / Team Swap

- Area: interaction and per-player lifecycle choreography
- Primary files: `interaction/actions.ts`, `interaction/hud-warm-state.ts`, `interaction/ui-events.ts`, `interaction/ui-primary-click.ts`, `interaction/interact-point.ts`
- Inputs: player clicks, interact events, team swap events, deploy state transitions
- Outputs: UI input enablement, HUD warm/reveal, join prompts, team-swap cleanup, deploy availability
- State owned: warm tokens, reveal gates, swap transition flags
- UI owned: indirect orchestration of multiple UI families
- Lifecycle entry points: click handlers, interact handlers, team-swap controllers, warm polling loop
- Known coupling points: almost every player-visible subsystem
- Boundary quality: blurred
- Main problems: `actions.ts` is too central and too procedural; it polls readiness in loops and knows too much about unrelated UI families
- Recommended correction: split orchestration by UI family and by transition type, with shared lifecycle helpers for cleanup/reveal

### Vehicle Systems / Direct Spawn / Bounded Volumes

- Area: vehicle systems
- Primary files: `vehicles/*`, `config/map-runtime.ts`, `config/maps/operation-firestorm.ts`
- Inputs: spawner events, slot timers, mode-config vehicle selections, deploy requests
- Outputs: slot registration, respawn behavior, deploy-screen timer HUD, direct spawn fulfillment, bounded relocation
- State owned: slot inventory, reservations, timer state, ownership, active bind token
- UI owned: deploy timer HUD
- Lifecycle entry points: spawner bootstrap, spawn sequence, bind path, vehicle events, deploy fulfillment
- Known coupling points: deploy lifecycle, map config, HUD warm, player deploy flow
- Boundary quality: mixed
- Main problems: the vehicle domain is well decomposed overall, but `deploy-timer-ui.ts` remains oversized and the bounded-transform contract is not fully aligned between config and runtime
- Recommended correction: fix current transform/height correctness first, then split the deploy timer HUD file

### Map Runtime / Config

- Area: map config and runtime slot derivation
- Primary files: `config/types.ts`, `config/runtime.ts`, `config/maps.ts`, `config/map-runtime.ts`, `config/maps/*`
- Inputs: detected map, selected mode-config knobs, authored map config
- Outputs: active runtime config, selected spawn pools, spawn-volume lists, team names, map labels
- State owned: active map config and derived runtime spawn lists
- UI owned: indirect map label and mode-config defaults
- Lifecycle entry points: map detection, apply-map-config, mode-config sync, selected-pool refresh
- Known coupling points: ready dialog, vehicles, capture config
- Boundary quality: mixed
- Main problems: `map-runtime.ts` acts as both map-apply layer and runtime spawn-pool builder; it is a valid bridge, but it now spans too many concerns
- Recommended correction: later split into map detection/apply, vehicle pool derivation, and active slot sync

### Admin / Test / Debug

- Area: admin and test surfaces
- Primary files: `admin-panel/*`, `ui/admin/action-counter.ts`, `hud/update-helpers.ts`
- Inputs: admin clicks and toggles
- Outputs: match start/end requests, clock changes, deploy timer toggles, position debug, admin action counter
- State owned: admin action count, per-player debug visibility
- UI owned: admin panel and top-right action counter
- Lifecycle entry points: admin panel build, visibility changes, event routing
- Known coupling points: ready dialog, clock, match flow, vehicle HUD
- Boundary quality: acceptable to mixed
- Main problems: `admin-panel/build.ts` contains runtime loop behavior in addition to widget construction, so the file name understates its ownership
- Recommended correction: split build from debug/runtime controller behavior

## 3. File Inventory Matrix

This matrix accounts for every active file under `src` exactly once. Status meanings:

- `active`: coherent owner for an active responsibility
- `mixed`: active and useful, but ownership or naming is blurred
- `legacy-shadow`: still present mostly as residue, shim, or stale framing
- `likely dead`: effectively no-op seam or future placeholder with no meaningful current behavior

### Root / Shims / Meta

| File | Primary ownership | Status | Confidence |
| --- | --- | --- | --- |
| `index.ts` | global import fan-in and BF6 runtime event routing | active | high |
| `conquest-flow.ts` | match start/end and round flow helpers | active | high |
| `Changelog.ts` | internal implementation history log | active | high |
| `header-file.ts` | version/header metadata | active | high |
| `footer-file.ts` | footer/version metadata | active | high |
| `strings.json` | string table and localized labels | active | high |
| `types.ts` | top-level foundation import shim | active | high |

### Foundation / Shared Constants

| File | Primary ownership | Status | Confidence |
| --- | --- | --- | --- |
| `foundation/modlib.ts` | shared `modlib` import shim | active | high |
| `foundation/gameplay.ts` | gameplay constants, enums, and shared tunables | active | high |
| `foundation/ui-layout.ts` | UI layout constants and spatial contract | active | high |
| `foundation/string-keys.ts` | string key aliases and shared label handles | active | high |
| `strings/ui-ids.ts` | widget id constants and UI id policy notes | active | high |

### State

| File | Primary ownership | Status | Confidence |
| --- | --- | --- | --- |
| `state/runtime.ts` | runtime declaration shim | active | high |
| `state/runtime-types.ts` | authoritative runtime type contracts | active | high |
| `state/runtime-state.ts` | initial authoritative runtime state shape | active | high |
| `state/core.ts` | core state helpers and cross-cutting state access | active | high |
| `state/id-helpers.ts` | pid/objId normalization and widget lookup helpers | active | high |
| `state/player-lookup.ts` | player/pid lookup utilities | active | high |
| `state/ui-helpers.ts` | widget-safe helper functions and UI mutations | active | medium |
| `state/spawn-charge.ts` | spawn-charge policy state and diagnostics helpers | active | high |
| `state/lifecycle-guardrails.ts` | lifecycle guard tokens and cross-state guardrails | active | high |
| `state/hud-cache-types.ts` | HUD cache type contracts | active | high |

### Config

| File | Primary ownership | Status | Confidence |
| --- | --- | --- | --- |
| `config/types.ts` | map and spawn config schema | active | high |
| `config/runtime.ts` | active config/runtime values | active | high |
| `config/maps.ts` | map-config registry | active | high |
| `config/map-runtime.ts` | map apply logic and runtime spawn-pool derivation | mixed | high |
| `config/conquest-constants.ts` | conquest constants and HUD mode gate | mixed | high |
| `config/maps/blackwell-fields.ts` | authored map data | active | medium |
| `config/maps/defense-nexus.ts` | authored map data | active | medium |
| `config/maps/golf-course.ts` | authored map data | active | medium |
| `config/maps/mirak-valley.ts` | authored map data | active | medium |
| `config/maps/operation-firestorm.ts` | authored Firestorm data and bounded spawn volumes | mixed | high |
| `config/maps/liberation-peak.ts` | authored map data | active | medium |
| `config/maps/manhattan-bridge.ts` | authored map data | active | medium |
| `config/maps/sobek-city.ts` | authored map data | active | medium |
| `config/maps/area-22b.ts` | authored map data | active | medium |

### Index / Gameplay Wiring

| File | Primary ownership | Status | Confidence |
| --- | --- | --- | --- |
| `index/conquest-scaffold.ts` | conquest runtime reset/seed path | mixed | high |
| `index/game-mode.ts` | main live loop and startup sequence | active | high |
| `index/area-triggers.ts` | area-trigger and capture-point event handling | active | high |
| `index/capture-tickets.ts` | capture, tickets, end-state, and HUD projection core | mixed | high |
| `index/capture-sound.ts` | capture SFX queueing and dispatch | active | high |
| `index/capture-vo.ts` | capture VO queueing and dispatch | active | high |
| `index/player-join-leave.ts` | join/leave lifecycle and UI cleanup | mixed | high |
| `index/player-deploy.ts` | deploy/undeploy lifecycle and readiness resets | active | high |
| `index/player-loop-inputs.ts` | per-tick player input sampling | active | high |
| `index/vehicle-events.ts` | spawned/destroyed vehicle event routing | active | high |

### Ready Dialog

| File | Primary ownership | Status | Confidence |
| --- | --- | --- | --- |
| `ready-dialog/join-prompt-ids.ts` | join-prompt widget ids | active | medium |
| `ready-dialog/join-prompt-events.ts` | join-prompt interaction routing | active | medium |
| `ready-dialog/dialog-build.ts` | dialog root assembly and build orchestration | active | high |
| `ready-dialog/dialog-build-sections.ts` | dialog section assembly helpers | active | medium |
| `ready-dialog/dialog-build-roster.ts` | roster widget assembly | active | medium |
| `ready-dialog/dialog-build-mode-config.ts` | mode-config widget assembly | active | medium |
| `ready-dialog/countdown-flow.ts` | ready countdown start/stop flow | active | high |
| `ready-dialog/auto-start.ts` | auto-start behavior and ready thresholds | active | medium |
| `ready-dialog/mode-config-presets.ts` | preset application and mode-config defaults | mixed | high |
| `ready-dialog/mode-config-aircraft-ceiling.ts` | aircraft ceiling mode-config helpers | active | medium |
| `ready-dialog/matchup-summary.ts` | matchup summary derivation and labels | active | medium |
| `ready-dialog/lifecycle.ts` | dialog close/destroy/chrome visibility ownership | active | high |
| `ready-dialog/join-prompt-layout.ts` | join-prompt layout constants/build data | active | medium |
| `ready-dialog/mode-config-schema.ts` | knob/column metadata schema | active | high |
| `ready-dialog/mode-config-readout.ts` | mode-config readout formatting | active | medium |
| `ready-dialog/pregame-ui.ts` | pregame UI refresh helpers | active | medium |
| `ready-dialog/ready-reset.ts` | ready-state reset helpers | active | medium |
| `ready-dialog/roster-render.ts` | roster view rendering | active | high |
| `ready-dialog/roster-active.ts` | active-player roster filtering rules | active | high |
| `ready-dialog/swap-action.ts` | team-swap action logic | active | medium |
| `ready-dialog/takeoff-gating.ts` | takeoff gating / flight-related readiness policy | active | medium |

### Interaction

| File | Primary ownership | Status | Confidence |
| --- | --- | --- | --- |
| `interaction/spawn-selector.ts` | deferred custom spawn-selection seam | likely dead | high |
| `interaction/interact-point.ts` | interact-point input gating and helpers | active | medium |
| `interaction/hud-warm-state.ts` | HUD warm tokens and reveal state | active | high |
| `interaction/actions.ts` | cross-system UI and lifecycle orchestration | mixed | high |
| `interaction/ui-events-ready.ts` | ready-dialog button/click routing | active | medium |
| `interaction/types.ts` | interaction type aliases | active | medium |
| `interaction/ui-events.ts` | generic UI event routing | active | medium |
| `interaction/ui-primary-click.ts` | primary click resolution | active | medium |

### Vehicles

| File | Primary ownership | Status | Confidence |
| --- | --- | --- | --- |
| `vehicles/timers.ts` | slot timer state updates and timer policy | active | high |
| `vehicles/spawner-slots.ts` | slot registration, enablement, and spawner config | active | high |
| `vehicles/spawner-sequence.ts` | sequential spawn queue and token-driven sequencing | active | high |
| `vehicles/spawner-bootstrap.ts` | initial spawner bootstrapping | active | medium |
| `vehicles/spawner-bind.ts` | spawn binding and bounded transform resolution | mixed | high |
| `vehicles/reservations.ts` | reservation policy and slot reservation state | active | medium |
| `vehicles/registration.ts` | vehicle-slot registration helpers | active | medium |
| `vehicles/ownership.ts` | owner tracking and vehicle ownership helpers | active | medium |
| `vehicles/deploy-timer-ui.ts` | deploy-screen timer HUD, button logic, and rendering | mixed | high |
| `vehicles/deploy-fulfillment.ts` | direct spawn fulfillment on deploy | active | high |
| `vehicles/array-helpers.ts` | small array utilities for vehicle code | active | medium |

### HUD / UI / Clock / Admin / Utils

| File | Primary ownership | Status | Confidence |
| --- | --- | --- | --- |
| `hud/update-helpers.ts` | admin action count HUD updates | active | high |
| `hud/status.ts` | round-status and ready/player summary text | mixed | high |
| `hud/help-visibility.ts` | help-text visibility policy | active | high |
| `hud/conquest-scaffold.ts` | Phase 1 no-op conquest HUD seam | likely dead | high |
| `ui/ready/ready-line.ts` | ready-line widget helpers | active | medium |
| `ui/conquest/top-hud-shell.ts` | top HUD shell build and references | active | high |
| `ui/conquest/hud-core/validate.ts` | HUD-core validation helpers | active | medium |
| `ui/conquest/hud-core/types.ts` | HUD-core type contracts | active | medium |
| `ui/conquest/hud-core/toggle.ts` | HUD-core visibility toggles | active | medium |
| `ui/conquest/hud-core/state.ts` | HUD-core per-player state/cache helpers | active | medium |
| `ui/conquest/hud-core/render.ts` | combat HUD render owner | active | high |
| `ui/conquest/hud-core/pipeline.ts` | snapshot/render pipeline helpers | active | high |
| `ui/conquest/hud-core/names.ts` | HUD-core widget naming | active | medium |
| `ui/conquest/hud-core/lifecycle.ts` | HUD-core hide/destroy/rebuild lifecycle | mixed | high |
| `ui/conquest/hud-core/constants.ts` | HUD-core constants and layout values | active | high |
| `ui/conquest/hud-core/build.ts` | HUD-core widget graph build owner | active | high |
| `ui/dialog/victory-build.ts` | victory dialog widget build | active | medium |
| `ui/dialog/victory.ts` | victory dialog update/visibility logic | active | medium |
| `ui/admin/action-counter.ts` | top-right admin action counter widget | active | high |
| `ui/branding/top-left.ts` | top-left branding widgets | active | medium |
| `admin-panel/visibility.ts` | admin panel visibility helpers | active | medium |
| `admin-panel/events.ts` | admin panel event routing | active | medium |
| `admin-panel/build.ts` | admin panel build plus position-debug runtime behavior | mixed | high |
| `clock/state.ts` | clock state helpers | active | medium |
| `clock/timer-instance.ts` | match clock runtime control and ticking | active | high |
| `clock/ui.ts` | clock widget build/cache and legacy cleanup | mixed | high |
| `utils/multi-click.ts` | multi-click detection helpers | active | medium |
| `utils/main-base.ts` | main-base helper functions | active | medium |

## 4. File-By-File Review

The inventory matrix above is the concise per-file review surface for all 114 files. The expanded review below focuses only on the files and file clusters that materially affect correctness, architectural health, or refactor priority. Files not expanded below are acceptable in their current role and do not currently justify deeper rewrite notes beyond the matrix.

### `index/capture-tickets.ts`

- Current stated responsibility: capture/ticket routing and conquest gameplay core
- Actual owned behavior: capture runtime mutation, ticket bleed, end-latch checks, visual-state derivation, top-HUD data shaping, popout/engage projection, and combat-HUD dispatch
- Correctness verdict: mostly correct, but overloaded
- Ownership fit: blurred
- Key problems:
  - owns both authoritative conquest gameplay state and a large portion of viewer-facing HUD projection
  - size alone makes regression review hard
  - future UI changes and future gameplay-rule changes are forced to land in the same file
- Dead or stale paths: none obvious inside the active core
- Duplication / overlap: overlaps with HUD-core because the HUD-core render path still depends on this file for much of its snapshot/view-model source
- Split / merge / rename recommendation: split into authoritative conquest core plus one or two UI projection files
- Suggested follow-up: extract snapshot/view-model derivation first, not the ticket math
- Risk level: high
- Confidence: high

### `interaction/actions.ts`

- Current stated responsibility: ready-dialog swap action and HUD refresh
- Actual owned behavior: HUD warm, deploy gating, UI-family prebuild/reveal, team-swap choreography, admin reveal, combat HUD arm/reveal, join prompt sequencing
- Correctness verdict: mixed
- Ownership fit: blurred
- Key problems:
  - file name understates the scope
  - polling-based readiness loop is pragmatic, but it centralizes timing risk in one place
  - the file knows too much about unrelated widget families
- Dead or stale paths: none obvious, but several helpers feel like lifecycle infrastructure rather than "actions"
- Duplication / overlap: overlaps with join/leave cleanup, HUD lifecycle, and top-HUD/clock helpers
- Split / merge / rename recommendation: split by transition family: warm/reveal, team swap, and deploy-availability orchestration
- Suggested follow-up: move cleanup/reveal helpers for each UI family closer to the owning subsystem
- Risk level: high
- Confidence: high

### `vehicles/deploy-timer-ui.ts`

- Current stated responsibility: vehicle deploy timer HUD
- Actual owned behavior: slot filtering, row selection, timer rendering, button rendering, visibility policy, player interaction hooks, and deploy-screen HUD orchestration
- Correctness verdict: mixed
- Ownership fit: blurred
- Key problems:
  - too many responsibilities in one file
  - hard to test isolated policy changes without re-reading render and input behavior
  - likely future hotspot for every vehicle HUD expansion
- Dead or stale paths: none obvious; it is very active code
- Duplication / overlap: overlaps with interaction-layer reveal policy and top-HUD lifecycle concerns
- Split / merge / rename recommendation: split into row-model derivation, widget build/render, and button/input policy
- Suggested follow-up: extract pure row-model computation first
- Risk level: high
- Confidence: high

### `vehicles/spawner-bind.ts`

- Current stated responsibility: spawn yaw apply plus slot binding
- Actual owned behavior: vehicle-type-to-volume classification, weighted bounded-volume choice, random point sampling, bounded transform resolution, teleport/yaw application, and slot binding fallback
- Correctness verdict: mixed
- Ownership fit: acceptable
- Key problems:
  - config/runtime transform contract is currently larger than the live engine application path
  - `rotPlane` and `rotHeli` are full vectors, but the active relocation path only applies `Y` as yaw through `mod.Teleport`
  - fallback binding is still distance-based if the active token window is missed
- Positive change:
  - weighted spawn-volume selection is a real improvement over the old "always first volume" behavior
- Split / merge / rename recommendation: keep ownership here, but tighten the transform contract explicitly
- Suggested follow-up: choose one of two honest contracts:
  - restore safe full transform application and keep vector rotation authoring
  - or reduce schema/runtime to yaw-only until full transform is safe again
- Risk level: high
- Confidence: high

### `config/maps/operation-firestorm.ts`

- Current stated responsibility: authored Firestorm map data
- Actual owned behavior: Firestorm team labels, anchors, capture points, deploy point ids, vehicle spawns, and bounded volume authoring
- Correctness verdict: mixed
- Ownership fit: tight
- Key problems:
  - current jet volume authoring sets `jetSpawnFloor` above `jetSpawnCeiling` for the active aircraft boxes
  - because the sampler clamps `maxHeight` to at least `minHeight`, jets spawn at one fixed height rather than across a band
  - aircraft box 2 comments still say "then set true" even though those boxes are already enabled
  - tank box 2 entries remain zero-filled placeholders and are correctly disabled, but they keep the file visually noisy
- Positive change:
  - multiple aircraft boxes per team now exist and are actually usable under the new weighted selection path
- Split / merge / rename recommendation: keep ownership here; fix authoring correctness and stale comments
- Suggested follow-up: correct the floor/ceiling order first, then clean stale TODO text
- Risk level: high
- Confidence: high

### `config/map-runtime.ts`

- Current stated responsibility: map detection/apply and spawn-preset helpers
- Actual owned behavior: map detection, active map apply, ready-dialog vehicle defaulting, runtime slot inventory building, selected vehicle pool derivation, spawn-volume activation
- Correctness verdict: mostly correct
- Ownership fit: acceptable but broad
- Key problems:
  - it is now both a config-apply layer and a runtime vehicle-pool derivation layer
  - future map-only edits and future slot-derivation edits are forced into the same file
- Dead or stale paths: none obvious
- Duplication / overlap: overlaps conceptually with ready-dialog preset logic and vehicle runtime slot sync
- Split / merge / rename recommendation: later split into map apply/detection, vehicle selection derivation, and active slot sync
- Suggested follow-up: not urgent after current correctness issues, but worth scheduling
- Risk level: medium
- Confidence: high

### `index/player-join-leave.ts`

- Current stated responsibility: join/leave hooks
- Actual owned behavior: player initialization, state cleanup, multiple UI-family hard delete/hide operations, and reset hooks into conquest sound/VO/HUD
- Correctness verdict: mostly correct
- Ownership fit: acceptable, but cleanup-heavy
- Key problems:
  - long hard-coded widget cleanup lists are brittle
  - this file knows the internal widget ids of too many unrelated UI families
- Dead or stale paths: none obvious
- Duplication / overlap: duplicates family cleanup knowledge with `clock/ui.ts`, HUD lifecycle, and interaction warm-reset paths
- Split / merge / rename recommendation: keep join/leave ownership here, but move per-family cleanup into owner modules
- Suggested follow-up: add one cleanup entry point per UI family
- Risk level: medium
- Confidence: high

### `ready-dialog/dialog-build.ts`

- Current stated responsibility: dialog build owner
- Actual owned behavior: dialog root assembly and section coordination
- Correctness verdict: mostly correct
- Ownership fit: tight
- Key problems:
  - still relies on cached shell reuse and hidden-build patterns that are lifecycle-sensitive
  - reading it in isolation still requires chasing multiple build helper files
- Positive note:
  - ownership is clearly better than the old monolithic dialog build pattern
- Suggested follow-up: no urgent split; keep this as the assembly owner
- Risk level: medium
- Confidence: high

### `ready-dialog/lifecycle.ts`

- Current stated responsibility: dialog lifecycle
- Actual owned behavior: close, destroy, chrome visibility, admin reset, and related dialog family visibility logic
- Correctness verdict: mostly correct
- Ownership fit: tight
- Key problems:
  - still carries a lot of widget-family lifecycle detail
  - can be hard to reason about during team swaps and teardown-heavy flows
- Positive note:
  - this file is a good example of ownership extracted out of `actions.ts`
- Suggested follow-up: keep it; only trim redundant visibility helpers over time
- Risk level: medium
- Confidence: high

### `ready-dialog/mode-config-presets.ts`

- Current stated responsibility: preset application rules
- Actual owned behavior: mode-config defaults and preset-driven selection state
- Correctness verdict: mixed
- Ownership fit: acceptable
- Key problems:
  - contains clearly dormant/deferred ceiling-application branches that currently return `false`
  - leaves ambiguity about which ceiling pathways are live versus future
- Dead or stale paths: yes, partial/deferred ceiling policy branches
- Suggested follow-up: either wire the ceiling branch fully or mark it more explicitly as deferred
- Risk level: medium
- Confidence: high

### `ui/conquest/hud-core/render.ts`

- Current stated responsibility: combat HUD render owner
- Actual owned behavior: per-player conquest HUD snapshot build fallback and widget render application
- Correctness verdict: mostly correct
- Ownership fit: acceptable
- Key problems:
  - still depends on `capture-tickets.ts` for too much upstream snapshot/view-model data
  - fallback logic is necessary but increases complexity
- Positive note:
  - render ownership itself is clean and deliberate
- Suggested follow-up: leave render here, but reduce upstream dependency on conquest gameplay file
- Risk level: medium
- Confidence: high

### `ui/conquest/hud-core/lifecycle.ts`

- Current stated responsibility: conquest HUD lifecycle
- Actual owned behavior: hide, destroy, rebuild, and root-chain lifecycle management
- Correctness verdict: mostly correct
- Ownership fit: acceptable
- Key problems:
  - long and manual
  - another locus of widget-family cleanup that contributes to lifecycle fragility
- Suggested follow-up: keep lifecycle ownership here but move toward reusable widget-family cleanup helpers
- Risk level: medium
- Confidence: high

### `admin-panel/build.ts`

- Current stated responsibility: admin panel build
- Actual owned behavior: widget build plus position-debug runtime updates and loop behavior
- Correctness verdict: mostly correct
- Ownership fit: blurred by file naming
- Key problems:
  - file name says "build" but it also owns runtime/debug behavior
  - this makes future debug-panel expansion harder to place cleanly
- Positive note:
  - the recent coordinate-label polish is harmless and isolated
- Suggested follow-up: split into `build` and `position-debug-runtime` or equivalent
- Risk level: medium
- Confidence: high

### `index/conquest-scaffold.ts`

- Current stated responsibility: Phase 1 scaffold
- Actual owned behavior: active conquest runtime reset and seed initialization
- Correctness verdict: mostly correct
- Ownership fit: ownership is real, naming is stale
- Key problems:
  - "scaffold" is no longer the best name for an active runtime reset path
  - the file still carries old phase framing that understates its importance
- Suggested follow-up: rename to reflect active initialization/reset responsibility
- Risk level: low
- Confidence: high

### `hud/conquest-scaffold.ts`

- Current stated responsibility: Phase 1 conquest HUD seam
- Actual owned behavior: no-op
- Correctness verdict: not harmful, but functionally dead
- Ownership fit: wrong for active `src`
- Key problems:
  - it is explicitly inactive by design and returns immediately
  - keeping it in the active runtime surface creates noise during review
- Suggested follow-up: archive or remove unless a near-term reactivation is planned
- Risk level: low
- Confidence: high

### `interaction/spawn-selector.ts`

- Current stated responsibility: future conquest spawn selection policy seam
- Actual owned behavior: hard-deny placeholder result
- Correctness verdict: not harmful, but functionally dead
- Ownership fit: wrong for active `src`
- Key problems:
  - it looks like a real subsystem entry point but is only a placeholder
  - it now reads as if custom spawn selection exists when it does not
- Suggested follow-up: archive/remove, or rename to something explicitly future/deferred
- Risk level: low
- Confidence: high

### `config/conquest-constants.ts`

- Current stated responsibility: conquest constants
- Actual owned behavior: active gameplay and HUD constants plus HUD mode helpers
- Correctness verdict: correct
- Ownership fit: acceptable
- Key problems:
  - the header comment still frames the file as "Phase 1 conquest scaffold constants (no gameplay activation yet)"
  - that comment is stale relative to the live codebase
- Suggested follow-up: update the file comment to describe current ownership honestly
- Risk level: low
- Confidence: high

## 5. Top Risks

### Risk 1

- Risk: `index/capture-tickets.ts` remains the main overloaded convergence point for both conquest authority and conquest HUD projection
- Category: architecture
- Trigger path: any ticket-rule, capture-state, popout, engage, or conquest HUD change
- Why it is plausible: the file already owns too many behaviors and is the largest file in the repo
- Likely visible effect: regressions where gameplay-rule fixes accidentally disturb UI behavior or vice versa
- Severity: high
- Confidence: high
- Recommended next action: extract view-model / snapshot derivation first, leaving authoritative ticket/capture mutation in place

### Risk 2

- Risk: fragmented manual widget cleanup continues to create UI lifecycle fragility
- Category: unstable UI-lifecycle
- Trigger path: join/leave, team swap, undeploy/redeploy, HUD warm reset, cache-miss rebuilds
- Why it is plausible: cleanup is spread across join/leave, HUD lifecycle, clock UI, and interaction warm paths, often by manual widget-name deletion
- Likely visible effect: stuck widgets, stale overlays, overdraw, or inconsistent reveal timing after swaps/redeploys
- Severity: high
- Confidence: high
- Recommended next action: add owner-local cleanup entry points for each UI family and stop deleting unrelated widgets from global lifecycle files

### Risk 3

- Risk: bounded air spawn contract is currently inconsistent between authored config and applied runtime transform
- Category: crash / unstable UI-lifecycle / architecture
- Trigger path: direct vehicle deploy into bounded air, or any future work assuming full `rotPlane` / `rotHeli` vector support
- Why it is plausible: config now stores full vectors, but the active relocation path only teleports with yaw; current Firestorm jet volume values are also inverted for floor/ceiling
- Likely visible effect: jets/helicopters not honoring authored pitch/roll, misleading config authoring, or incorrect air spawn altitude behavior
- Severity: high
- Confidence: high
- Recommended next action: fix Firestorm jet height ordering immediately and then choose an explicit yaw-only or full-transform contract

### Risk 4

- Risk: direct spawn fulfillment and slot binding remain timing-sensitive
- Category: crash / unstable gameplay flow
- Trigger path: direct deploy under spawn pressure, delayed vehicle materialization, occupied seat edge cases, missed active token window
- Why it is plausible: the flow uses several short waits, repeated verification passes, and token-based bind windows
- Likely visible effect: failed direct fulfillments, wrong vehicle binding, undeploy fallback, or reservation confusion
- Severity: medium-high
- Confidence: medium-high
- Recommended next action: keep the current flow, but add focused regression testing around direct deploy and bounded relocation before expanding to more classes/maps

## 6. Cleanup / Reorganization Recommendations

1. Split `index/capture-tickets.ts` into authoritative conquest logic and conquest HUD/view-model projection.
2. Split `vehicles/deploy-timer-ui.ts` into row-model derivation, widget build/render, and button/input policy.
3. Split `admin-panel/build.ts` so runtime/debug loops no longer live in a file named only as a build owner.
4. Add one cleanup entry point per UI family and stop hard-deleting foreign widget ids from join/leave and interaction orchestration files.
5. Normalize the bounded spawn transform contract:
   - either restore safe full transform support and keep vector rotation authoring
   - or reduce the schema/runtime to yaw-only until full transform is safe again
6. Fix stale naming and comments in active files:
   - `index/conquest-scaffold.ts`
   - `config/conquest-constants.ts`
   - stale TODO wording in `config/maps/operation-firestorm.ts`
7. Archive or remove true placeholder seams from the active runtime surface:
   - `hud/conquest-scaffold.ts`
   - `interaction/spawn-selector.ts`
8. Later, split `config/map-runtime.ts` into a narrower map-apply layer and a narrower vehicle-selection/runtime-derivation layer.

## 7. Optional Code-Size Reduction Opportunities

Intentionally excluded for this run. The priority here is ownership clarity and correctness, not raw line-count reduction.

## 8. Prioritized Follow-Up Plan

### P0: Correctness Fixes

1. Fix Firestorm jet bounded-volume floor/ceiling ordering so jets spawn across the intended band rather than at one fixed height.
2. Decide the bounded transform contract:
   - if yaw-only is the stable path, stop pretending full vector rotation is live
   - if full vector rotation is required, restore it only after the occupied-aircraft regression is understood
3. Clean stale comments and enabled/TODO mismatches in `config/maps/operation-firestorm.ts`.

### P1: Structural Risk Reduction

1. Extract conquest HUD snapshot/view-model derivation out of `index/capture-tickets.ts`.
2. Split `vehicles/deploy-timer-ui.ts`.
3. Move UI-family cleanup ownership back into the subsystem files that create those widgets.
4. Split runtime/debug behavior out of `admin-panel/build.ts`.

### P2: Maintenance Cleanup

1. Rename `index/conquest-scaffold.ts` to reflect active initialization/reset ownership.
2. Remove or archive no-op placeholder seams from active `src`.
3. Split `config/map-runtime.ts` when the current P0/P1 work settles.
4. Consider later constant-bank splits for `foundation/gameplay.ts` and `foundation/ui-layout.ts` only if ownership clarity improves, not just for size.

## 9. Human Test Plan

### One-Human Checklist

1. Launch the mode on Firestorm and confirm map detection picks the correct team names, capture points, and map label.
2. Open the ready dialog and verify roster render, matchup summary, and mode-config columns populate without duplicate or stale widgets.
3. Toggle admin panel visibility and verify the panel opens/closes without leaving orphan widgets behind.
4. Toggle position debug and verify the adjusted label spacing renders cleanly.
5. Ready up, start the match, and verify HUD warm completes before deploy becomes available.
6. Confirm the top HUD, clock, help text, and combat HUD all reveal in the expected order.
7. Capture a flag solo and verify ticket changes, flag visual changes, capture sound, and VO behavior all remain synchronized.
8. Force a team swap and confirm combat HUD, help text, ready dialog state, and deploy availability recover without stale overlays.
9. Open the deploy screen and verify vehicle timer rows only show active slots and correct local-team information.
10. Reserve and deploy into an aircraft and verify direct spawn fulfillment still succeeds.
11. Repeat the aircraft deploy path multiple times and confirm bounded-air relocation remains stable.
12. Verify aircraft box selection is not obviously hard-stuck to one authored region.
13. Specifically validate jet spawn altitude on Firestorm and confirm whether the current band behavior matches expectation; this should currently expose the floor/ceiling issue if left unfixed.
14. Confirm that the user-facing branding string shows `v0.725`.
15. End the match through normal or admin flow and verify victory dialog, clock, and HUD teardown stay coherent.

### Two-Human / Multiplayer Checklist

1. Join with two players on opposite teams and verify both players receive correct team-perspective combat HUD colors.
2. Have both players enter and leave the same capture point repeatedly to validate contested and recapture transitions.
3. Validate that capture sounds and VO do not over-fire or get stuck under repeated progress churn.
4. Perform late join while the match is live and confirm join prompt, HUD warm, and deploy availability behave correctly.
5. Have one player reserve a vehicle, then die/undeploy/redeploy, and confirm reservation and direct-spawn behavior remain sane.
6. Have both players compete for the same vehicle timing window and verify reservation replacement and fulfillment rules behave as expected.
7. Trigger team swap for one player while the other remains live; verify no stale enemy/friendly perspective remains on either client.
8. Validate that direct aircraft deployment with an occupied or recently spawned vehicle does not silently break the binding path.
9. Repeatedly destroy and respawn vehicles while both players are live to stress timer HUD updates and slot binding.
10. Validate join/leave cleanup by having one player disconnect and reconnect during active play.
11. Verify capture HUD rows and active popout stay consistent when objective ownership flips during reconnect or redeploy churn.
12. Verify admin action counter increments for both viewers and does not leave desynced labels.
13. Stress rapid deploy / undeploy cycles to look for widget duplication, stale visibility, or blocked deploy state.
14. Validate that per-player perspective lock and engage HUD reset behavior recover after team swap and redeploy.
15. If the bounded-air transform contract is changed later, rerun all aircraft tests with occupied seats, direct spawn, and team-swap edge cases before widening map coverage.

## 10. Open Questions / Assumptions

1. This audit is anchored to the live working tree at bundle version `v0.725`, not to a newly committed hash. `HEAD` remains `35f3d24e4272f9b72636bd9d46267bb6fd4423d7`, but local Conquest edits beyond `HEAD` are part of this review.
2. Design-doc alignment claims are high-confidence at the domain and phase-policy level, but this pass did not do a line-by-line reconciliation against every checklist item in `TWL_Conquest_Design.md`.
3. The strongest correctness findings in this audit are based on direct source tracing:
   - bounded spawn rotation vectors are broader than the active yaw-only teleport path
   - Firestorm jet volume floor/ceiling values are currently inverted for the live aircraft boxes
4. No runtime playtest was executed during this pass, so multiplayer and engine-behavior conclusions remain source-based unless already encoded by comments/changelog entries.
5. Lower-confidence matrix entries are mostly small leaf modules that were reviewed by role, naming, and local call surface rather than by extended behavioral tracing.
