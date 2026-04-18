# Plan: Legacy Spawner Pathway Cleanup (post-v1.276)

**Original draft:** 2026-04-17 (against v1.265)
**Last audit:** 2026-04-17 (against v1.276)
**Status:** Drafted for future execution — audit-backed, risk-ordered. **Not yet scheduled.**

---

## What changed since the original draft

The original plan opened with a HOT FIX for the Abrams-on-transport-slot-3 regression. **That fix shipped in v1.271**: `relocateSlotSpawner` in [src/config/map-runtime.ts](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/config/map-runtime.ts) is now async and awaits `mod.Wait(2.0)` after `SpawnObject` before calling `configureVehicleSpawner`, closing the fresh-spawner race. The HOT FIX section is deleted from this revision.

Other baseline shifts since v1.265:

- **File moves:** `deploy-timer-ui.ts` moved from `src/hud/` to `src/vehicles/`. `VehicleSpawnerSlot` lives in [src/state/runtime-types.ts](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/state/runtime-types.ts), not a separate `vanilla-spawner-types.ts`. `deploy-live-menu.ts` lives at `src/vehicles/deploy-live-menu.ts`.
- **New destroy wrapper (v1.276):** `sinkAndDestroyVehicle(v)` in [src/vehicles/vanilla-spawner.ts](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/vehicles/vanilla-spawner.ts) is now the single canonical destroy path for tracked vehicles. No cleanup action required — just be aware it exists when reading the spawner flow.
- **Vehicle destroy ordering hardening (v1.275):** `resetVehicleSlotsAtCountdownStart` collects bound vehicles from `vehicleToSlot` before dropping bindings; startup cleanup filters `mod.AllVehicles()` to Abrams only (engine default auto-spawn). These are live behaviors that Tier 1 field removals must not break.

---

## Context

The v1.258–v1.265 vanilla-spawner rewrite landed a serial, event-driven spawn system ([src/vehicles/vanilla-spawner.ts](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/vehicles/vanilla-spawner.ts)) and successfully deleted the old deploy-fulfillment / reservations / spawner-sequence / spawner-bind / spawner-slots / spawner-bootstrap files. However, grep of current source reveals leftover **scaffolding** — slot fields written-but-never-read, State fields initialized but never consulted, no-op helpers still being called, non-Vanilla deploy-method constants still branched on defensively, and a live-deploy-menu path whose `pendingSpawnMode` writer was deleted so the menu now leads to a dead end.

This plan is a cleanup sweep, not a rewrite. Goal: remove dead scaffolding so the next reader sees only the live system, and the bundle drops further. All ordering below is risk-ascending — early tiers are safe byte-shuffles; later tiers require verifying a thing is actually unreachable before removal.

---

## Audit Findings (grep-verified against v1.276)

### Tier 1 — Dead struct/state fields (no logic change)

**[src/state/runtime-types.ts](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/state/runtime-types.ts) — `VehicleSpawnerSlot` fields with writes but no reads:**

`enableToken`, `spawnRequestToken`, `spawnRequestAtSeconds`, `expectingSpawnStartedAtSeconds`, `respawnQueuedAtSeconds`, `respawnReadyAtSeconds`, `lastSpawnedAtSeconds`, `lastDestroyedAtSeconds`, `lastMissingAtSeconds`, `spawnRetryScheduled`, `respawnRunning`, `spawnCategory`, `freshAirRuntimeSpawner`, `suppressNextBindSpawnTransformCorrection`, `availabilityPhase` (type-only).

**Keep (live reads confirmed):** `respawnClock`, `vehicleId`, `enabled`, `vehicleType`, `spawner`, `spawnerObjId`, `spawnPos`, `spawnRot`, `teamId`, `slotNumber`, `activeOwnerPid`, `respawnDelaySeconds`. The remaining four (`expectingSpawn`, `deployFlowTracked`, `pendingSpawnMode`, `pendingSpawnOwnerPid`) are read only by live-menu gating in `deploy-timer-ui.ts` — reclassify under Tier 3 and remove those reads when the menu goes.

**[src/state/runtime-state.ts](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/state/runtime-state.ts) — `State.vehicles` fields initialized but never re-read:**
`spawnSequenceToken`, `spawnSequenceInProgress`, `activeSpawnSlotIndex`, `activeSpawnToken`, `activeSpawnRequestedAtSeconds`.

**Keep:** `startupCleanupDone` (read in `vanilla-spawner.ts` at the pre-live Abrams-cleanup guard).

### Tier 2 — Non-Vanilla deploy-method gating (knob already frozen)

`READY_DIALOG_VEHICLE_DEPLOY_METHOD_OPTIONS` is single-entry (Vanilla only), but downstream still branches on `>= HQ`:

- [src/vehicles/deploy-timer-ui.ts:1514–1516](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/vehicles/deploy-timer-ui.ts#L1514-L1516) — `hqDeployAllowed`, `forwardDeployAllowed`, `airDeployAllowed` computation
- [src/ready-dialog/countdown-flow.ts:99–107](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/ready-dialog/countdown-flow.ts#L99-L107) — delay-line gating (lines 0/1/2/3 based on method)
- [src/ready-dialog/mode-config-presets.ts:25, 106–107](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/ready-dialog/mode-config-presets.ts) — dirty-check + preset-match comparisons
- [src/ready-dialog/mode-config-readout.ts:287–288](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/ready-dialog/mode-config-readout.ts#L287-L288) — label display

With the knob frozen to VANILLA, none of the `>= HQ` branches can ever evaluate true.

### Tier 3 — Live vehicle-deploy menu (interactable + UI chrome)

- `tryOpenVehicleDeployLiveMenuForPlayer` lives in [src/vehicles/deploy-live-menu.ts:58–84](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/vehicles/deploy-live-menu.ts#L58-L84).
- `open_vehicle_spawn_menu` action still defined in [src/config/types.ts](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/config/types.ts) and dispatched from `classifyMainBaseInteractableActionFromObjId` at [src/interaction/world-interactables.ts:275](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/interaction/world-interactables.ts#L275) (ObjId parity).
- `VehicleDirectSpawnMode` type (`"air" | "ground" | "forward"`) remains at [src/state/runtime-types.ts:52](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/state/runtime-types.ts#L52).
- `slot.pendingSpawnMode` and `slot.pendingSpawnOwnerPid` are read in `deploy-timer-ui.ts` (signature hash + spawn-button gate) but their only writer lived in the deleted `deploy-fulfillment.ts` — so the reads always see `undefined` / the slot-init defaults. The menu surface is reachable but every button has no fulfillment path.

Recommendation: **delete the menu** plus the four orphaned slot fields (`expectingSpawn`, `deployFlowTracked`, `pendingSpawnMode`, `pendingSpawnOwnerPid`) and their readers.

### Tier 4 — No-op helpers still called

- `clearAllVehicleReservations()` — [src/vehicles/vanilla-spawner.ts:72–74](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/vehicles/vanilla-spawner.ts#L72-L74), called from `src/conquest-flow.ts` on endMatch
- `clearVehicleReservationForPid()` — [src/vehicles/vanilla-spawner.ts:76–78](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/vehicles/vanilla-spawner.ts#L76-L78), called from `src/interaction/actions.ts:734` and `src/index/player-join-leave.ts:144`
- `refreshVehicleSlotAuthoritativeState()` — empty body at [src/vehicles/timers.ts:18–20](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/vehicles/timers.ts#L18-L20), called from [src/config/map-runtime.ts:618](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/config/map-runtime.ts#L618)

Safe to delete functions + call sites. `conquestSelectSpawnPoint()` is intentionally Phase-1 deferred — **leave alone**.

### Tier 5 — Map-config fields

- `team1AircraftSpawnVolumes`, `team2AircraftSpawnVolumes` — declared at [src/config/types.ts:106–107](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/config/types.ts#L106-L107), resolved at [src/config/map-runtime.ts:641–642](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/config/map-runtime.ts#L641-L642), but **never queried** (forward-air deploy path is gone). Dead.
- `roundStartAirDelay`, `roundStartAirDeployDelay`, `roundStartForwardDeployDelay` — **still live**: read in `src/state/core.ts` (4 sites), `src/ready-dialog/pregame-ui.ts` (3), `src/vehicles/deploy-timer-ui.ts` (3) for countdown delay-line display. Keep.
- `team{1,2}TankSpawnVolumes` — still read by `getVehicleSpawnVolumesForTeam()`. Keep.

---

## Execution Plan (risk-ascending, ship per tier)

Each tier is a separate version bump so we can bisect if something breaks.

### Phase A — Tier 1: dead fields (very safe)

1. Delete the listed fields from `VehicleSpawnerSlot` in [src/state/runtime-types.ts](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/state/runtime-types.ts).
2. Delete the listed fields from `State.vehicles` initialization in [src/state/runtime-state.ts](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/state/runtime-state.ts).
3. Delete write-sites (e.g. `slot.lastSpawnedAtSeconds = …`) — grep localizes these to `src/vehicles/vanilla-spawner.ts` (slot-init at `addVanillaSpawnerSlot`) and any remaining event handlers.
4. Build; expect green (write-only fields, no reader can break).
5. `npm run bumpVersion -- -c "cleanup: prune dead VehicleSpawnerSlot and State.vehicles fields from pre-rewrite era"`.

### Phase B — Tier 4: no-op helpers

1. Delete `clearAllVehicleReservations`, `clearVehicleReservationForPid`, `refreshVehicleSlotAuthoritativeState` bodies **and** their call sites.
2. Grep-verify no remaining references.
3. Build, bump: `"cleanup: remove no-op reservation/authoritative-state helpers"`.

### Phase C — Tier 5: dead map-config fields

1. Remove `team1AircraftSpawnVolumes` / `team2AircraftSpawnVolumes` from `src/config/types.ts`, any map spec that populates them (e.g. `src/config/maps/operation-firestorm.ts`), and the resolution in `src/config/map-runtime.ts:641–642`.
2. Build, bump: `"cleanup: remove unused aircraft spawn-volume map-config fields"`.

### Phase D — Tier 2: collapse deploy-method enum

1. Delete constants `VEHICLE_DEPLOY_METHOD_HQ`, `_HQ_FORWARD`, `_HQ_FORWARD_AIR` from `src/foundation/gameplay.ts` (keep `_VANILLA` and `_DEFAULT` alias, or inline the literal 0).
2. `src/vehicles/deploy-timer-ui.ts:1514–1516`: remove the three `hqDeployAllowed` / `forwardDeployAllowed` / `airDeployAllowed` computations and every downstream branch that consumes them.
3. `src/ready-dialog/countdown-flow.ts:99–107`: the four delay-line shows are gated on `>= HQ`, `=== HQ_FORWARD_AIR`, `>= HQ_FORWARD`, and "always" respectively. With Vanilla-only, **only line 3 (gadgets) ever fires** — verify this matches desired pre-live UX, then remove the other three shows and all gating.
4. `src/ready-dialog/mode-config-presets.ts` / `mode-config-readout.ts`: remove `vehicleDeployMethod` from preset comparison & readout if it's now effectively a constant. Keep field in the config struct for schema stability, or drop cleanly.
5. Build, playtest that countdown still displays the expected delay text.
6. Bump: `"cleanup: collapse deploy-method enum to VANILLA-only; remove non-Vanilla UI guards"`.

### Phase E — Tier 3: delete live-deploy-menu chrome

1. Delete `src/vehicles/deploy-live-menu.ts` entirely.
2. Remove `open_vehicle_spawn_menu` from `src/config/types.ts`, its resolution in `src/config/map-runtime.ts`, and the dispatch in `src/interaction/world-interactables.ts:275`.
3. Remove `VehicleDirectSpawnMode` type from `src/state/runtime-types.ts:52`; remove `slot.pendingSpawnMode`, `slot.pendingSpawnOwnerPid`, `slot.expectingSpawn`, `slot.deployFlowTracked` from the slot struct.
4. Remove the corresponding reads in `src/vehicles/deploy-timer-ui.ts` (signature hash at ~line 166, slot-ready gate at ~lines 182–185, spawn/ground button gates at ~lines 1518, 1523) — with the live menu gone, the "press to deploy" button path should not render at all.
5. Playtest: confirm no mystery interactables appear on main-base objects, and pre-live HUD renders cleanly.
6. Bump: `"cleanup: remove live vehicle-deploy menu + direct-spawn type; Vanilla is the only path"`.

---

## Files Touched Summary

| Phase | Files | Action |
|---|---|---|
| A | `state/runtime-types.ts`, `state/runtime-state.ts`, `vehicles/vanilla-spawner.ts` | Delete dead fields + initializers |
| B | `conquest-flow.ts`, `interaction/actions.ts`, `index/player-join-leave.ts`, `vehicles/timers.ts`, `vehicles/vanilla-spawner.ts`, `config/map-runtime.ts` | Delete no-op helpers + call sites |
| C | `config/types.ts`, `config/maps/operation-firestorm.ts`, `config/map-runtime.ts` | Remove aircraft volume fields |
| D | `foundation/gameplay.ts`, `vehicles/deploy-timer-ui.ts`, `ready-dialog/countdown-flow.ts`, `ready-dialog/mode-config-presets.ts`, `ready-dialog/mode-config-readout.ts` | Collapse deploy-method enum |
| E | `vehicles/deploy-live-menu.ts` (delete), `config/types.ts`, `config/map-runtime.ts`, `interaction/world-interactables.ts`, `state/runtime-types.ts`, `vehicles/deploy-timer-ui.ts` | Delete live-menu chrome |

Each phase: `npm run build` → `cmd /c npx tsc --pretty false --noEmit` → `npm run bumpVersion -- -c "…"`.

---

## Verification per Phase

- **A**: build green; no runtime change expected. Playtest: start round, destroy a helo, confirm respawn HUD still ticks; confirm startup Abrams cleanup and countdown-reset both still fire (they depend on `startupCleanupDone` and `respawnClock`, which we keep).
- **B**: build green; re-run endMatch / player-leave / map-runtime reload. No functional change.
- **C**: build green; round start still works, pre-live delay lines display identically.
- **D**: build green; **manually verify** the countdown delay lines shown in ready-dialog match what Vanilla-only should display (only the "gadgets" line should fire post-cleanup).
- **E**: build green; main-base interactables no longer offer "open vehicle spawn menu"; no pre-live deploy button renders in vehicle HUD; bundle size drops the most on this phase.

---

## Out-of-Scope / Deferred

- `conquestSelectSpawnPoint()` — intentionally Phase-1 deferred; leave.
- `sinkAndDestroyVehicle(v)` wrapper (v1.276) — live and canonical, nothing to clean up.
- Ready-dialog `vehicleDeployMethod` field in the config struct: leave the field (value always 0) for now; removing it touches persistence/preset code. Revisit after Phase D ships cleanly.

---

## Rollback

Each phase is a single version bump. Revert any one phase without touching the others.
