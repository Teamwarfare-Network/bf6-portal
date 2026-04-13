# Plan: Gadget Locker VFX Markers (area-trigger driven)

Shipped in v1.162. Retained for reference and follow-up context.

## Context

World Icon per-player visibility in MP is unreliable, so for the gadget-locker point-scope case the user wants to bolster the visuals with placed VFX instead of fighting the WorldIcon owner-filter path. Per-player filtering is not required for these VFX — when ANY player is inside the area trigger for a gadget locker, the VFX should be visible to everyone; when empty, hidden.

The map author will place two VFX SpatialObjects next to gadget locker 1056 in Godot:
- `10561` → `FX_Gadget_InterativeSpectator_Camera_Light_Green`
- `10562` → `FX_Granite_Strike_Smoke_Marker_Green`

Both share approximately the same location as the existing interact point. This plan wires those placed objects into the conquest runtime so they toggle on/off based on the existing area-trigger occupancy state.

**Key API correction over the cited conversation.** The conversation the user pasted claimed "there is no generic API to enable/disable a SpatialObject." That's out of date — [index.d.ts:949](../node_modules/bf6-portal-mod-types/index.d.ts#L949) exports `EnableSpatialObject(spatialObject: SpatialObject, enable: boolean): void`. We'll use that as the primary toggle mechanism. If runtime testing shows it's a no-op on VFX SpatialObjects (unlikely but possible), the fallback is a teleport-to-hidden-pos pattern — that fallback is **out of scope for this plan** and becomes a follow-up only if the primary path fails in testing.

**Why this approach beats runtime `SpawnObject`:** both VFX *are* in `mod.RuntimeSpawn_Common` ([common.d.ts:255](../node_modules/bf6-portal-mod-types/runtime-spawn-enums/common.d.ts#L255), [:321](../node_modules/bf6-portal-mod-types/runtime-spawn-enums/common.d.ts#L321)), so runtime spawning is a possible alternate. But the user wants to author position and orientation in Godot for visual fidelity, so placed SpatialObjects win. Runtime-spawn path is only a fallback if `EnableSpatialObject` turns out to be broken AND `SetObjectTransform` teleporting doesn't work either — again, out of scope for this plan.

## Current architecture (relevant pieces)

- **Gadget locker 1056 config.** [operation-firestorm.ts:46](../src/config/maps/operation-firestorm.ts#L46) — `{ objId: 1056, ownerTeamId: 0, pos: CreateVector(-729.66, 134.095, 202.982) }` inside `gadgetInteractableAnchors`. Built at runtime into a `WorldInteractableConfig` via [map-runtime.ts:buildWorldInteractableConfigsFromMapConfig](../src/config/map-runtime.ts#L279).
- **Area-trigger events.** [area-triggers.ts:72-130](../src/index/area-triggers.ts#L72) — `onPlayerEnterAreaTriggerImpl` and `onPlayerExitAreaTriggerImpl` fire per player, per trigger. They call `updateWorldInteractableAreaTriggerMembershipForPlayer` for point-scope configs.
- **Per-pid membership state.** [world-interactables.ts:73-88](../src/interaction/world-interactables.ts#L73) — `setPlayerWorldInteractableAreaMembership` writes `State.players.worldInteractableAreaByPidByObjId[pid][objId] = true|false`. This is the existing per-player occupancy source of truth; no trigger-wide counter exists yet.
- **Authored-owner precedent.** [world-interactables.ts:164-179](../src/interaction/world-interactables.ts#L164) — `resolveAuthoredWorldInteractablePointOwnerPlayer` already scans `worldInteractableAreaByPidByObjId` to answer "is anyone inside objId X." We'll reuse that scan pattern for the occupancy check.
- **Configure-once lifecycle.** [world-interactables.ts:configureWorldInteractablePresentation](../src/interaction/world-interactables.ts#L295) runs once per round via `configureActiveWorldInteractables` — hides authored WorldIcons, enables InteractPoints. This is the right place to resolve VFX handles and disable them initially.
- **Round-reset cleanup.** [map-runtime.ts:635](../src/config/map-runtime.ts#L635) — `cleanupActiveWorldInteractableRuntimeIconsForAllPlayers()` runs in `applyMapConfig` before config rebuild. That's the canonical place to hook VFX teardown.
- **Membership update wire-in.** [world-interactables.ts:334-349](../src/interaction/world-interactables.ts#L334) — `updateWorldInteractableAreaTriggerMembershipForPlayer` already early-returns for non-point configs and already calls the icon sync after updating membership. Adding a VFX sync call here means every enter/exit naturally drives the toggle.

## Design

### 1. Config plumbing

- **[src/config/types.ts](../src/config/types.ts)** — Add `vfxObjIds?: number[]` to both `WorldInteractableAnchorConfig` and `WorldInteractableConfig`. Optional field; absent means "no VFX markers for this interactable."
- **[src/config/maps/operation-firestorm.ts:46](../src/config/maps/operation-firestorm.ts#L46)** — Extend the 1056 anchor entry to include `vfxObjIds: [10561, 10562]`. Other gadget lockers (1050-1055, 1057) get no change — the sync no-ops without the field.
- **[src/config/map-runtime.ts:311-321](../src/config/map-runtime.ts#L311)** — In `buildWorldInteractableConfigsFromMapConfig`'s gadget loop, pass `anchor?.vfxObjIds` through onto the emitted config.

### 2. State extension

- **[src/state/runtime-types.ts:219](../src/state/runtime-types.ts#L219)** — Add `worldInteractableVfxHandleByObjId: Record<number, any>` to `ConquestRuntimeScaffold` (sibling of `worldInteractableIconByTeamByObjId`).
- **[src/state/runtime-state.ts:73](../src/state/runtime-state.ts#L73)** — Init `worldInteractableVfxHandleByObjId: {}` in the `conquest` block.

The cache stores one handle per VFX objId (not per interactable). A single authored VFX can only exist once in the map, so keying by its own objId is the right granularity.

### 3. Feature flag

- **[src/config/conquest-constants.ts](../src/config/conquest-constants.ts)** — Add `const FEATURE_WI_VFX_MARKERS = true;` alongside the existing `FEATURE_WI_AUTHORED_POINT_OWNER`. Defaults on. Guards every new call site so we can flip it off without re-authoring if runtime behavior is bad.

### 4. Helpers and sync function (all in [src/interaction/world-interactables.ts](../src/interaction/world-interactables.ts))

- **`isWorldInteractableAreaOccupied(objId: number): boolean`** — Walks `Object.keys(State.players.worldInteractableAreaByPidByObjId)` and returns `true` on the first pid whose `[objId]` is `true`. Short-circuits; no counter. Mirrors the scan pattern in `resolveAuthoredWorldInteractablePointOwnerPlayer` at line 164.
- **`resolveWorldInteractableVfxHandlesForConfig(config: WorldInteractableConfig): void`** — Called once per configured interactable from `configureWorldInteractablePresentation`. For each objId in `config.vfxObjIds`, if not already cached: `try { handle = mod.GetSpatialObject(objId); cache[objId] = handle; mod.EnableSpatialObject(handle, false); } catch {}`. The initial disable seeds the "hidden until someone enters" state. Try/catch tolerates late-loaded authored objects, matching how `hideAuthoredWorldInteractableIconPresentation` handles that at line 47.
- **`syncWorldInteractableRuntimeVfxForConfig(config: WorldInteractableConfig): void`** — The main toggle. Early-returns if `!FEATURE_WI_VFX_MARKERS`, `config.scope !== "point"`, or `!config.vfxObjIds?.length`. Computes `const occupied = isWorldInteractableAreaOccupied(config.objId)`. For each vfxObjId, looks up the cached handle (lazy-resolve via `GetSpatialObject` if missing, store), calls `mod.EnableSpatialObject(handle, occupied)` inside try/catch. That's the entire runtime cost: one lookup + one API call per VFX per enter/exit transition.

### 5. Wire-in

- **[world-interactables.ts:configureWorldInteractablePresentation](../src/interaction/world-interactables.ts#L295)** — After the existing `hideAuthoredWorldInteractableIconPresentation(config)` and `applyWorldInteractableAuthoredInteractPointState(config)` calls, add `if (FEATURE_WI_VFX_MARKERS) resolveWorldInteractableVfxHandlesForConfig(config);`. Runs once per config per round (or retries on the 1s tick guard if authored objects weren't ready at first run).
- **[world-interactables.ts:updateWorldInteractableAreaTriggerMembershipForPlayer](../src/interaction/world-interactables.ts#L338)** — Inside the function, right after the existing `syncWorldInteractableRuntimeIconForPlayer(player, config)` call, add `if (FEATURE_WI_VFX_MARKERS) syncWorldInteractableRuntimeVfxForConfig(config);`. Fires on every enter/exit for a point-scope area trigger. Trigger-wide (not per-player), so one call per transition regardless of which player crossed.
- **[world-interactables.ts:cleanupWorldInteractableRuntimeIconsForPid](../src/interaction/world-interactables.ts#L387)** — After the existing authored-owner reconcile loop (at the bottom of the function, inside the `FEATURE_WI_AUTHORED_POINT_OWNER` guard), add a sibling `FEATURE_WI_VFX_MARKERS` guard that loops `ACTIVE_WORLD_INTERACTABLE_CONFIGS` and calls `syncWorldInteractableRuntimeVfxForConfig(cfg)` for each point-scope config. When a player leaves/disconnects/dies mid-zone, their membership entry has just been cleared — we reconcile the VFX to match the remaining occupancy. Cheap: one sync per config, each config sync is a short scan.

### 6. Cleanup on round reset

- **[world-interactables.ts:cleanupActiveWorldInteractableRuntimeIconsForAllPlayers](../src/interaction/world-interactables.ts#L417)** — At the end (just before `worldInteractablePresentationConfigured = false`), iterate `State.conquest.worldInteractableVfxHandleByObjId`, call `mod.EnableSpatialObject(handle, false)` on each (try/catch), and delete the entry. **Do NOT call `UnspawnObject`** — these are authored, not spawned; unspawning would destroy the authored map object permanently for the session. Clearing the cache forces fresh `GetSpatialObject` resolution on the next round's `configureWorldInteractablePresentation`, which handles re-authored objects correctly if the map reloads.

### 7. Bundle + version

- Run `npm run bumpVersion -- -c "Gadget locker VFX markers: placed SpatialObjects at 10561/10562 toggle on area-trigger occupancy for objId 1056. EnableSpatialObject-driven, config-threaded via vfxObjIds, FEATURE_WI_VFX_MARKERS flag."` per AGENTS.md workflow.
- Update the Project Stats table in [design_doc/TWL_Conquest_Design.md:3742](TWL_Conquest_Design.md#L3742) with the new version and bundle size after the build passes.

## Files to modify

| File | Change |
|---|---|
| [src/config/types.ts](../src/config/types.ts) | Add `vfxObjIds?: number[]` to `WorldInteractableAnchorConfig` and `WorldInteractableConfig` |
| [src/config/maps/operation-firestorm.ts](../src/config/maps/operation-firestorm.ts) | Add `vfxObjIds: [10561, 10562]` to the 1056 gadget locker anchor entry |
| [src/config/map-runtime.ts](../src/config/map-runtime.ts) | Thread `anchor?.vfxObjIds` through `buildWorldInteractableConfigsFromMapConfig` gadget loop |
| [src/config/conquest-constants.ts](../src/config/conquest-constants.ts) | Add `const FEATURE_WI_VFX_MARKERS = true;` |
| [src/state/runtime-types.ts](../src/state/runtime-types.ts) | Add `worldInteractableVfxHandleByObjId` to `ConquestRuntimeScaffold` |
| [src/state/runtime-state.ts](../src/state/runtime-state.ts) | Init `worldInteractableVfxHandleByObjId: {}` |
| [src/interaction/world-interactables.ts](../src/interaction/world-interactables.ts) | Add occupancy helper, handle resolver, sync function, wire into configure/membership/cleanup |
| [src/Changelog.ts](../src/Changelog.ts) | Version entry (written by bumpVersion) |
| [design_doc/TWL_Conquest_Design.md](TWL_Conquest_Design.md) | Update Project Stats table after build |

## Critical files to read before editing

- [src/interaction/world-interactables.ts:47-54](../src/interaction/world-interactables.ts#L47) — `hideAuthoredWorldInteractableIconPresentation` — try/catch pattern for late-authored objects, to mirror in the VFX resolver
- [src/interaction/world-interactables.ts:164-179](../src/interaction/world-interactables.ts#L164) — `resolveAuthoredWorldInteractablePointOwnerPlayer` — scan pattern for occupancy derivation
- [src/interaction/world-interactables.ts:295-298](../src/interaction/world-interactables.ts#L295) — `configureWorldInteractablePresentation` — the hook point for initial handle resolution
- [src/interaction/world-interactables.ts:338-349](../src/interaction/world-interactables.ts#L338) — `updateWorldInteractableAreaTriggerMembershipForPlayer` — the hook point for enter/exit sync
- [src/interaction/world-interactables.ts:387-414](../src/interaction/world-interactables.ts#L387) — `cleanupWorldInteractableRuntimeIconsForPid` — the hook point for mid-round pid cleanup reconcile
- [src/interaction/world-interactables.ts:417-458](../src/interaction/world-interactables.ts#L417) — `cleanupActiveWorldInteractableRuntimeIconsForAllPlayers` — the hook point for round-reset teardown
- [src/config/map-runtime.ts:279-324](../src/config/map-runtime.ts#L279) — `buildWorldInteractableConfigsFromMapConfig` — the config builder
- [AGENTS.md:99-122](../AGENTS.md#L99) — bump/build workflow + bundle size policy

## Verification

### Pre-authoring validation (SP, without VFX placed)

1. Build passes at current bundle size without errors. `vfxObjIds` absent from 1056's config still yields no-op.
2. Entering/exiting gadget locker 1056 continues to work exactly as before (icon sync path is untouched). No console errors.

### Once VFX are authored at 10561 + 10562 (SP)

1. **Map load.** On first tick after `configureActiveWorldInteractables` runs, both VFX should be disabled (invisible) even though they're placed in the world. Confirms the initial `EnableSpatialObject(..., false)` seed works.
2. **Enter area.** Walk the player into the area trigger for 1056. Both VFX become visible immediately on the enter event. No delay, no polling.
3. **Exit area.** Walk out. Both VFX become invisible immediately on the exit event.
4. **Re-enter.** Walk back in. Both VFX reappear. Confirms cache hit on subsequent enters.
5. **Death / undeploy inside zone.** Kill the player while inside the zone. The pid cleanup reconcile should re-evaluate occupancy (empty → hide). Redeploy and re-enter; VFX should reappear.
6. **Other gadget lockers unaffected.** Walk into 1050, 1051, etc. — no VFX behavior, no errors.
7. **Round reset.** End match, start new match. Confirm VFX are disabled again on fresh configure and respond to enter/exit correctly.

### MP validation (2-player test)

1. **Both players enter simultaneously.** Both players walk into 1056. VFX visible to both.
2. **One exits, other stays.** Player A exits, Player B stays. VFX must remain visible (other player still occupying). This is the critical test — it validates that the occupancy scan correctly sees remaining pids after the exit handler clears only the exiting pid's entry.
3. **Second exits.** Player B exits. VFX disappear.
4. **One player dies inside, other stays outside.** VFX should disappear the instant the pid cleanup reconcile fires.
5. **One player dies inside, other stays inside.** VFX stay visible — the remaining player still holds occupancy.

### Bundle size

- Under 1 MiB (current headroom ~10 KB). Changes are small: new state field, three new functions, three new call sites, one feature flag. Expected budget impact < 1 KB.

## Guardrails

- **`EnableSpatialObject` is the primary mechanism.** The plan does not include a teleport-to-hidden-pos fallback. If the primary API is a no-op on VFX SpatialObjects, the plan ships with VFX stuck on, the user sees that in SP test #1 immediately, and we cut a follow-up plan for the fallback. This keeps the change small and doesn't bake in a speculative workaround.
- **Unspawn is NOT called on authored VFX.** `UnspawnObject` on an authored map object has undefined semantics and would permanently remove it for the session. Cleanup uses `EnableSpatialObject(false)` only.
- **Feature flag defaults on.** `FEATURE_WI_VFX_MARKERS = true` in the shipped build. Can be flipped off without re-authoring to isolate regressions.
- **Config-driven, additive.** Other gadget lockers without `vfxObjIds` are unchanged. No existing behavior is modified.
- **Event-driven, not polling.** Uses the existing `onPlayerEnterAreaTriggerImpl` / `onPlayerExitAreaTriggerImpl` dispatch. No new tick loops, no new timers.
- **Try/catch tolerant on authored-object resolution.** Mirrors the existing `hideAuthoredWorldInteractableIconPresentation` pattern so a late-loaded authored object is handled by the 1s tick retry guard at [game-mode.ts:153](../src/index/game-mode.ts#L153), not by custom retry logic.
- **Git discipline.** One version bump entry, single focused commit.
