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
| **Lazy-Build Dispatch** | Wave 3 (v1.409–v1.418): UI surfaces build via `triggerLazyBuild(name, pid)` from a per-surface registry (`interaction/lazy-build-registry.ts`) with per-surface in-flight guards, optional mutex serialization, and error tear-down semantics. Replaced the prior monolithic prebuild + loading-gate pattern. |
| **Widget Caching** | Hot-path widgets cached per-player in `State.hudCache.*`; cold-path uses `safeFind()`. |
| **ForAllPlayers** | ~30 functions iterate `mod.AllPlayers()` with validity checks via `forEachValidPlayer` shared helper. |
| **Dirty-Flag HUD** | Combat HUD render gated on `State.conquest.debug.hudDirty || force`. Every mutation that affects HUD must call `markHudDirty()` in the same function body. See contract enumerated in [AGENTS.md](../AGENTS.md). |
| **Single Owner Authority** | Lifecycle/match-end mutators have one owner function each (`end_CheckAndEndMatch`, etc.); all callers route through that owner with guard-on-already-fired semantics. |
| **PID-suffixed widget names** | All cached widget names carry `_${pid}` via `wn(name, pid)`. Required to avoid namespace collisions in the engine widget registry. |
| **Single-Slot Admin + Explicit Claim** | `Admin` namespace owns one slot (`_currentAdminPid`). **No auto-promotion ever** (v1.459) — every match starts vacant; vacated slots (whether from GIVE UP ADMIN or admin disconnect) stay vacant until someone explicitly presses CLAIM ADMIN. While vacant, the Game Admin row reads "No Admin" and any non-admin can press CLAIM ADMIN on their panel. Triple-tap routing branches on `Admin.isAdmin(pid)` at a single chokepoint (`tryOpenReadyDialogForPlayer` in `interaction/interact-point.ts`): admin → existing ready dialog; non-admin → small panel via `triggerLazyBuild('playerReadyPanel', pid)`. State transitions broadcast `refreshAllVisiblePlayerReadyPanels()` so every viewer's Game Admin row + CLAIM ADMIN visibility stays in lock-step. CLAIM ADMIN + GIVE UP ADMIN are both `SetUIButtonEnabled(false)` + greyed when the match is live. **v1.459 strip:** removed Host concept entirely (`_hostFirstPid`, `_hostNameMessage`, `Admin.isHost`, `Admin.getHostFirstPid`, `Admin.getHostNameMessage`, the first-ever-joiner auto-admin branch, the Game Host row on the panel, `gameHostFormat` string). Reason: the engine reports the closest-to-server player as first-loaded on cold start, not the actual server host — Host was never script-authoritative. Plan archive: [`design_doc/5.01.26_conquest_wave_4_plan.md`](./5.01.26_conquest_wave_4_plan.md) (historical; v1.459 supersedes the L17/L18 host-slot rules). |
| **Non-Digital Indicators (master clock excepted)** | Wave 5 (v1.439–v1.441): timers in non-master-clock surfaces render as decile-chunk progress bars instead of digital countdowns. Pattern: replace per-tick `safeSetUITextLabel` digit-string updates with `mod.SetUIWidgetSize` integer-pixel fill updates, gated by a per-decile diff-cache so updates fire ~10 times per countdown regardless of total duration (vs ~30-120 with continuous text). Border widget overlays the existing plate's coords + size for a unified visual; fill insets 1px inside the border, grows left→right TopLeft-anchored. The master clock at top HUD is the only surface explicitly EXEMPT — it stays digital MM:SS as the canonical match-time reference. Other digital countdowns (pregame "3, 2, 1", boundary kill 5s subtitle) also stay digital where the literal number reads better than ambient indication. Status modes ("READY", "ACTIVE", "SPAWNING", "DEPLOYING") stay as text labels alongside the bar via `setReusableTimerStatus`. See [`design_doc/5.02.26_conquest_wave_5_plan.md`](./5.02.26_conquest_wave_5_plan.md) for L1-L14 + decile-chunk implementation pattern. |
| **Staggered lazy-build dispatch on join** | Wave 6 Ship 1d (v1.443): when multiple lazy-build surfaces fire back-to-back in `onPlayerJoinGameImpl`, distribute their build cost across multiple frames using `Timers.setTimeout` instead of letting them all hit one frame. Pattern: order surfaces by their **time-to-first-visibility** for the joining player, fire the first immediately and defer the rest by 50-150ms steps. Concretely: `topHudShell` immediate (clock visible at spawn), `vehicleDeployTimer` at 50ms (deploy menu opens on first death/respawn), `combatHud` at 150ms (not visible until first OnPlayerDeployed). Safe because (a) the deferred surfaces aren't user-visible during the deferred window, and (b) `triggerLazyBuild` already short-circuits on invalid pid via existing `safeFindPlayer`+`isValidPlayer` guard ([lazy-build-registry.ts:236-237](../src/interaction/lazy-build-registry.ts#L236)) — disconnect during the window is a clean no-op. Apply this pattern only when surfaces (a) are not visible/interactive in the deferred window, (b) don't depend on each other's state at construction, and (c) total build cost actually exceeds the engine's per-frame eval budget. Don't pre-emptively stagger small surfaces. |
| **Centralized helper short-circuit for cross-cutting cleanup** | Wave 6 Ship 1c (v1.443): when many independent call sites construct similar widgets via a shared helper (e.g. `twlConquestHudBuildShadowRingProfile` is consumed by every Ensure/Render/Hide/Delete shadow ring loop in the combat HUD), eliminating that whole class of widget is a one-line change at the helper rather than a per-call-site walk. Make the helper return an empty/no-op result; consumers iterate zero times; cache fields hold empty arrays. Pattern requires (a) the helper to be the single source of truth, (b) consumers to handle empty/zero results without erroring, and (c) downstream lifecycle code to tolerate the absent widgets. Verify with typecheck on the cache-shape change (will surface every dead reference). When this property holds, deletions of large widget surfaces become trivial. When it doesn't, refactor to the helper pattern *first*, then delete. |
| **Ready-state auto-unready triggers (locked at 2)** | CQ_Bug_58 (v1.445): a player's pre-game READY state may be auto-cleared by the game ONLY in two cases: **(1) team switch** (player clicks SWAP TEAMS — `swap-action.ts:17`), and **(2) admin config change** (admin modifies match settings → `requireReadyReconfirmAfterConfigChange` clears every other ready player + `forceUnreadyApplierAfterConfirm` clears the admin themselves on APPLY — `mode-config-presets.ts`). Death + respawn does NOT clear ready. Walking out of the main base does NOT clear ready. The bulk match-start fresh-cycle reset (`resetReadyStateForAllPlayers`) and explicit READY/NOT READY button clicks are the orthogonal lifecycle/user paths. Any new gameplay event proposing to auto-clear ready state must justify itself against this lock — the rule exists because incidental clears (especially the death-respawn one) caused player frustration where ready-up felt like a temporary commitment that needed re-confirming after every minor event. Plan archive: `design_doc/5.02.26_conquest_ready_tuning_plan.md`. |
| **Countdown is uncancellable by ready-state** | CQ_Bug_115 (v1.474): once `startPregameCountdown` flips `State.round.countdown.isActive = true` and sets `lifecyclePhase = "COUNTDOWN"`, no ready-state change cancels the countdown. The check `if (!force && !areAllActivePlayersReady()) return false;` was removed from `isPregameCountdownStillValid` ([`src/ready-dialog/countdown-flow.ts:61`](../src/ready-dialog/countdown-flow.ts#L61)). The countdown is now abortable only by (a) **token mismatch** (admin reset via `triggerFreshMatchSetup` → `cancelPregameCountdown` → `token++` — that path does the full cleanup including `mod.EnableAllPlayerDeploy(true)` and `lifecyclePhase = "NOT_READY"`), (b) **match ended** (`State.match.isEnded`), or (c) **match already live** (`isMatchLive()` with `allowRoundActive` not set; defensive). The rule exists because the bail paths in `runPregameCountdown` only clear `isActive` and hide the visual but do NOT restore the deploy gate or phase — ready-state-driven cancellation thus locked all watching players out of deploying. **The "ready" concept stops applying once the countdown has begun.** Late-joiners during the countdown sit on the deploy screen with `mod.EnableAllPlayerDeploy(false)` until the LIVE transition flips it back globally; their default-undefined `readyByPid[joinPid]` no longer matters. Plan archive: [`design_doc/5.07.26_late_join_during_countdown_fix_plan.md`](./5.07.26_late_join_during_countdown_fix_plan.md). |
| **Backplate-behind-text for legibility** | v1.449/v1.450/v1.451: select text widgets in the conquest HUD that lost their 8-layer compass shadow rings (Wave 6 Ship 1c) and don't have an existing dark-backdrop fallback get backed by a `Container` with `mod.UIBgFill.Blur` + `bgColor = TWL_CONQUEST_HUD_COLOR_BOX_BG` + `bgAlpha = TWL_CONQUEST_HUD_TICKET_BOX_ALPHA` (0.75). Same visual style as the tickets-count backplate (`ticketBlueBox` / `ticketRedBox`). **Sizing should be tight** — just barely fit the longest possible label (use dedicated dimension constants per surface; v1.449's generic `TWL_CONQUEST_HUD_TEXT_BOX_PADDING` was tried then dropped because non-load-bearing surfaces with backplates looked out of place). **Z-order rule:** the backplate Container MUST be built BEFORE the text widget (or any sibling that should draw on top of it) — the conquest HUD relies on sequential `twlConquestHudEnsure*` call order for layering, not explicit `SetUIWidgetDepth` calls. **Visibility rule:** the backplate's visibility is toggled in lockstep with the text widget it backs — every show/hide site for the text gets a parallel show/hide site for the box. **Currently applied to: `engageStatusBox` only** (DEFEND/CAPTURING/CONTESTING/NEUTRALIZING text on the engage panel, sized via `ENGAGE_STATUS_BOX_*` constants in `constants.ts` — width 98 to fit "NEUTRALIZING" with thin margin, height 14 to cover only the visible glyph cap-height of the 18px-tall text widget, Y shifted +2 from text Y so the top doesn't touch the engage-track bar above. Centered in the 152-wide engage root). **Sizing lesson learned across v1.449→v1.453:** a Text widget's bounding box is taller than the rendered glyphs because the engine reserves space for descenders and line-height. For all-caps text without descenders (like the 4 status strings), the visible glyphs occupy only ~75% of the widget height. A backplate sized to the WIDGET dimensions will look top-padded and bottom-padded; size to the visible glyph area instead, then shift Y to center on the actual text baseline. v1.449 also added `ticketBlueTeamNameBox` + `ticketRedTeamNameBox` but those were dropped in v1.451 — team names are not load-bearing UI and the backplates looked out of place in top-HUD spacing. **Apply this pattern only when the text is gameplay-meaningful AND the surface has no other dark backdrop AND user feedback confirms the visual fits the layout.** |
| **Engine-log-before-JS-catch precheck** | The engine emits some error logs to the world-log overlay **during** native `mod.*` execution, BEFORE the JS try-catch can absorb the throw. So `try { mod.X(...) } catch {}` prevents JS-side fallout but leaves visible log noise. Known-affected APIs include: `mod.RemoveEquipment` (when the slot is empty — fixed v1.341 by `isSlotEmpty` precheck, see CQ_Bug_RemoveEquipment_JS_Error #84); `mod.GetInventoryAmmo` and `mod.GetInventoryMagazineAmmo` (when the slot is empty or holds a non-ammoable item — fixed v1.447 for non-Engineer supply-box opens by per-class `mod.HasEquipment`-based scoped probes, see CQ_Bug_94); `mod.UnspawnObject` (engine-side warnings — wrapped in try-catch but cosmetically visible, see CQ_Bug_UnspawnObject_Cosmetic_Log #39). **Pattern:** when a `mod.*` call against a player-controlled slot/object can fail with engine-visible "invalid X" log, gate the call behind a precheck that does NOT itself emit the same log. `mod.HasEquipment(player, gadget_id)` and `mod.IsInventorySlotActive(player, slot)` are verified clean (no log noise). The precheck pattern matters under heap pressure too — every engine error log entry allocates against the same JS heap budget that crashed at 16p in #109; cumulative log spam over a long match is a real heap-pressure contributor, not "cosmetic only". |

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

### Per-player engine-deploy block (v1.466 — Bug #113 console seat race fix)

When a player at the deploy screen requests a vehicle through HQ Deploy / Forward Deploy / Air Deploy (deploy_menu source), block the engine's deploy-on-foot action for that specific player only via `mod.EnablePlayerDeploy(player, false)` until the vehicle binds and `beginHqSeatFlow` runs `mod.DeployPlayer(player)` itself. Re-enable on every claim-clear path. **Per-player only — the centralized helper `setVehicleDeployEngineDeployBlockForPid(pid, blocked)` in [`src/vehicles/hq-deploy.ts`](../src/vehicles/hq-deploy.ts) is the single source of truth.** Never use `mod.EnableAllPlayerDeploy` from this code path — that is the global gate owned by countdown-flow.ts and conquest-flow.ts and applies to all players for match-lifecycle reasons.

Why: on console controllers, the same physical button (A on Xbox / X on PlayStation) drives both UI clicks AND the engine's deploy-on-foot action on the deploy screen. Without this block, the engine's deploy completes in the same input frame as the click, depositing the player on foot before the vehicle binds; the seat hook then no-ops because `mod.DeployPlayer` on an already-deployed player is engine-no-op, and the orphan vehicle gets sunk by the 10s claim timeout. Reference: [`5.04.26_conquest_vehicle_deploy_block_engine_deploy_plan.md`](./5.04.26_conquest_vehicle_deploy_block_engine_deploy_plan.md).

Architectural mirror of BillDukes: BillDukes' VehicleDeploy uses `mod.EnablePlayerDeploy(player, true)` + pre-seat teleport (banned in Conquest by the v1.106-v1.108 / v1.151-v1.154 aircraft OOB regression). Conquest now uses the inverse — block deploy until vehicle is ready, then deploy directly into the seat. See `conquest_vehicle_deploy_comparisons.md` §4.5 for the precise comparison.

---

## Locked Spectator Patterns

The spectator camera is a single-slot, pre-LIVE-only **observer mode** for a coach / referee / replay director who wants to watch a match without occupying a player slot, without holding a vehicle, and without firing weapons. Built on a Godot-authored `FixedCamera` (currently Operation Firestorm only; other 8 maps deferred behind graceful-degradation that keeps the SPECTATE button disabled-grey). Source files: [`src/spectator/spectator-action.ts`](../src/spectator/spectator-action.ts), [`src/spectator/coach-button-sync.ts`](../src/spectator/coach-button-sync.ts). Plan archives: [`5.08.26_conquest_spectator_cam_plan.md`](./5.08.26_conquest_spectator_cam_plan.md), [`5.08.26_conquest_spectator_cam_ship2_plan.md`](./5.08.26_conquest_spectator_cam_ship2_plan.md), [`5.08.26_conquest_spectator_cam_ship3_plan.md`](./5.08.26_conquest_spectator_cam_ship3_plan.md), [`5.08.26_conquest_spectator_cam_ship4_plan.md`](./5.08.26_conquest_spectator_cam_ship4_plan.md).

### Single-slot, claim-only, scalar state

`State.players.spectatorPid: number | null` is a single nullable scalar — **NOT** a per-pid map. Only one spectator can hold the slot at any time. **No auto-promotion ever** (mirrors the admin-slot rule); every match starts with `spectatorPid = null` and stays vacant until someone explicitly clicks SPECTATE. Vacated slots (whether from triple-tap exit, disconnect, match-end, or admin reset) stay vacant until someone explicitly re-claims. A vacant slot enables the SPECTATE button on every viewer's panel + dialog; an occupied slot greys it out for everyone (including the spectator themselves, since clicking it would be a no-op anyway).

Because the slot is single-occupancy, the integration uses **module-local state** (`_spectatorHideRoomObjects[]`, `_spectatorHideRoomCenter`, `_spectatorFreeCameraLoopToken`) instead of per-pid records. This is the canonical reason there is **zero new M-tier storage** for the entire feature — the heap cost is bounded by "1 spectator × 6 spatial handles + 1 token int" regardless of player count.

### Mitigation C — body stays deployed; camera swap only

The empirical I-4 finding (v1.476 probe) is that `mod.SetCameraTypeForPlayer(player, Cameras.Fixed, camId)` on an **undeployed** player is a no-op — the cam swap only takes effect once the player is deployed in-world. So the spectator integration uses **Mitigation C**: the player was already deployed when they clicked SPECTATE (triple-tap on the panel is gated on `isPlayerDeployed`, and the pre-live boundary keeps players at HQ pre-match). We do **NOT** undeploy / redeploy on claim — we just swap the camera, then teleport the body into a sealed underground hide-room so it cannot be seen by other players.

Combat HUD persists per user direction so the spectator watches tickets/flags/captures during the match. Boundary skip ([`enforcement.ts:225+`](../src/boundary/enforcement.ts#L225)) keeps the spectator's body out of the boundary classifier's reach. A defensive `OnPlayerDeployed` re-attach hook ([`player-deploy.ts:72+`](../src/index/player-deploy.ts#L72)) handles the unlikely re-deploy case (mirrors the existing `onHqSeatPendingPlayerDeployed` shape).

The `(mod.Cameras as any).Fixed` cast and `(mod as any).GetFixedCamera(camId)` cast pattern resolve gaps in the project's vendored `bf6-portal-mod-types` (the SDK 1.2.3 enum value + function exist at runtime; the type definitions don't). Same pattern used by [`foundation/gameplay.ts:204`](../src/foundation/gameplay.ts#L204) for `VehicleList.AH6M`.

### PCT-pattern sealed underground hide-room

The body is teleported into a 5mm sealed cube at **absolute `Y = -500`** so it is invisible to other players, cannot fall through gravity, and stays out of the playable airspace. The room is constructed from 4 × `FiringRange_Wall_2048_01` + 1 × `FiringRange_Floor_A` + 1 × `FiringRange_Ceiling_02`. Mesh-bound geometry constants (5mm interior, 6.4m wall height, 0.94 / 0.3 wall face offsets, 0.5 wall overlap, floor / ceiling local mesh bounds) are mesh-asset facts, lifted from PCT's `SpawnDirectorControlRoom` ([reference_implementations/reference_nodone_cinematic_camera/main_module.ts:2486](../reference_implementations/reference_nodone_cinematic_camera/main_module.ts#L2486)) per AGENTS.md non-copy policy (methodology adapted, original implementation).

**Why absolute Y (not camera-relative):** PCT uses `camPos.y - 50`, but PCT's cinematic cameras are authored at ground level. Conquest's spectator cameras are authored mid-air for overlook framing (Operation Firestorm cam 667 sits at Y≈246), and `-50` from there still lands in playable airspace where it would block aircraft. Absolute `Y = -500` is below all authored Conquest terrain and 500 units **above** the destroyed-vehicle sink layer at `Y = -1000` ([`vehicles/vanilla-spawner.ts:100`](../src/vehicles/vanilla-spawner.ts#L100)) — geometry can't clash with sunk wrecks either.

X/Z preserved from the FixedCamera's authored position so the room sits far from spawn areas. A water-fallback path was originally written (PCT's pattern) but dropped at v1.483 — water can't reach Y=-500 on any current map.

### Per-tick free-camera control loop

The spectator drives the same Godot-placed `FixedCamera` via a per-tick `mod.SetObjectTransform` write loop running at ~30 Hz. PCT methodology: **"Camera-as-Owned-FixedCamera"** ([`spec_cam_functionality.md`](../reference_implementations/reference_nodone_cinematic_camera/spec_cam_functionality.md) §6.1). Implementation in `runSpectatorFreeCameraLoop`:

- **Forward / strafe:** read `mod.SoldierStateVector.GetLinearVelocity` + `GetFacingDirection`, decompose velocity onto flat-projected facing for forward and `cross(fwd, up)` for strafe. The body is sealed in a 5mm cube but the engine still reports a non-zero velocity for WASD-pressed motion — that's what we read. Multiplied by `FORWARD_GAIN` / `STRAFE_GAIN` (currently 10.0 each).
- **Vertical:** explicit `IsJumping` (+Y) / `IsCrouching` (-Y) reads × `VERTICAL_SPEED` (currently 20.0 units/sec). Independent of horizontal; vertical does NOT get the sprint multiplier (so holding Jump = constant rise rate).
- **Sprint:** `IsSprinting` × `SPRINT_MULTIPLIER` (currently 3.5) on horizontal speed only (final sprint speed = 35).
- **Look:** `targetYaw = atan2(facingX, facingZ)`; `targetPitch = -asin(facingY)` clamped to ±89°. The pitch is **negated** because the engine's `SetObjectTransform` pitch convention is opposite of `asin(facing.y)` — without the negation, mouse-up tilted the camera down.
- **Smoothing:** PCT's empirical lerp factors — 0.12 forward/strafe, 0.18 rotation/vertical. Yaw lerp uses an angle-aware variant (`spectatorFreeCamLerpAngle`) that handles the ±π wrap so spinning across north doesn't unwind through 359° of rotation.

**Token-based cancellation:** module-local `_spectatorFreeCameraLoopToken: number`. The loop captures the token at start; each tick checks `if (_spectatorFreeCameraLoopToken !== token) return`. Cleanup hooks (disconnect / match-end / fresh-setup / triple-tap exit) bump the token to terminate the loop within one tick. No promise-cancellation needed.

**Input-restriction policy:** 12 inputs locked while in spectator mode (`SPECTATOR_LOCKED_INPUTS`): Prone, FireWeapon, Reload, Zoom, CycleFire, CyclePrimary, 6 × Select* (CharacterGadget, OpenGadget, Melee, Primary, Secondary, Throwable). **Movement** (MoveForwardBack, MoveLeftRight), **Sprint**, **Jump**, **Crouch**, and **CameraPitch / CameraYaw** are intentionally NOT locked — they drive the free-camera loop. **Interact** is also intentionally NOT locked (see exit pattern below).

### Triple-tap interact exit

Spectator exits the slot by triple-tapping the interact key (same UX as pre-game ready-up). Reuses the existing `InteractMultiClickDetector` ([utils/multi-click.ts:8-48](../src/utils/multi-click.ts#L8-L48)) — a 2-second window, 3-click threshold, polled per `OngoingPlayer` tick on `mod.SoldierStateBool.IsInteracting` transitions. Routing in `ongoingPlayerImpl` ([player-loop-inputs.ts:3-18](../src/index/player-loop-inputs.ts#L3-L18)) checks `isSpectator(pid)` BEFORE the existing ready-dialog dispatch and early-returns to `exitSpectatorMode` so a sealed-in-cube body cannot also spawn a `ReadyDialogInteractPoint`.

**Why Interact is released from the lock list:** the detector polls the `IsInteracting` SoldierStateBool — that bool is the animation state, and `EnableInputRestriction` may suppress the animation, which would prevent the bool from flipping. Releasing Interact guarantees clean state transitions. **Safe** because the body is in a 5mm sealed cube at Y=-500 with no `InteractPoint` authoring in range — there is nothing for an Interact-press to activate.

**Exit ordering** (`exitSpectatorMode`, mirror of `enterSpectatorMode` in reverse): bump free-cam loop token → despawn hide-room → release input lock → restore `Cameras.FirstPerson` → clear `State.players.spectatorPid` → `mod.UndeployPlayer(player)` (back to deploy screen on foot, fresh class selection) → world-log + `mod.DisplayNotificationMessage` self-confirm → refresh panels + dialog + ready-hud-text. **Idempotent** via the `if (State.players.spectatorPid !== pid) return` guard at the top — match-end + triple-tap + disconnect can race without breaking.

**Reload key as exit trigger was rejected.** No `OnPlayerReload` event exists in SDK 1.2.3. No `IsAttemptingToReload` SoldierStateBool exists. `IsReloading` is the animation state, and with `RestrictedInputs.Reload` locked the animation may not play. The triple-tap path is the only proven mechanism that works with input restrictions active.

### Map authoring requirement + graceful degradation

A map gets a working SPECTATE button only when its `MapConfig.spectatorCameraId` field is authored to a valid Godot `FixedCamera` ObjId. `isSpectatorAvailableForActiveMap()` returns `false` otherwise, which causes `isCoachButtonEnabledForPid` to return false, which renders the SPECTATE button disabled-grey on every viewer's panel + dialog (the existing D3 visual treatment from Wave 4). **No script-side error**, no console.log noise — just a button that's there but not clickable. Currently authored: Operation Firestorm only (cam ObjId 667). Other 8 maps deferred until per-map vantage points are scouted in Godot.

### Lifecycle deallocators (3 cleanup paths)

| Trigger | Function | What it does |
|---|---|---|
| Spectator disconnects | `onSpectatorPlayerLeave(pid)` from `onPlayerLeaveGameImpl` | Clears slot if pid matches, bumps token, despawns hide-room, marks HUD dirty. |
| Match ends | `onSpectatorMatchEnd()` from `endMatch` | Clears slot, bumps token, despawns room, releases input lock, restores `FirstPerson` for victory dialog. |
| Admin reset / fresh setup | `onSpectatorFreshSetup()` from `triggerFreshMatchSetup` | Clears slot, bumps token, despawns room, defensively releases input lock (in case match-end was bypassed). |

Plus the user-driven path: `exitSpectatorMode(player, pid)` from triple-tap. All four are idempotent and null-safe; they can race without leaking state.

### Out of scope (deferred)

- **Player-target tracking** on Jump key (Ship 3b, ~50 LOC) — would lerp camera position toward the picked target's pos.
- **Raycast wall correction** (Ship 3c, ~80 LOC) — would push the camera away from world geometry on collision.
- **Multi-spectator support** — would require pid-indexed state. Single-slot is the canonical model.
- **Mid-match LIVE entry** — claim path is pre-LIVE only by design; observer joining mid-match is not supported.
- **Spectator team-scoreboard hide** — spectator currently shows on the scoreboard with their original team; deferred until MP feedback indicates whether this is confusing.
- **Reload-key shortcut for exit** — deferred until empirical SDK test confirms `IsReloading` flips with Reload restricted.
- **Other 8 maps' Godot FixedCamera authoring** — Firestorm-only at ship.

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
