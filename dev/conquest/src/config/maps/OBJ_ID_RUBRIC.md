## Flat ObjId List

- `500`: Team 2 main-base trigger
- `501`: Team 1 main-base trigger
- `502`: Team 2 main-base buffer trigger
- `503`: Team 1 main-base buffer trigger
- `550`: Team 2 vehicle-deploy spawn point
- `551`: Team 1 vehicle-deploy spawn point
- `600`: capture point `A`
- `601`: capture point `B`
- `602`: capture point `C`
- `603-606`: Reserved for capture points `D` to `G`
- `666`: ground combat zone trigger
- `1000-1049`: reserved for main-base world interactables
- `1050-1099`: reserved for capture point world interactables

# Conquest ObjId Rubric

Purpose:
- Keep authored map object ids predictable.
- Keep active Conquest ownership separate from deprecated helis-only conventions.
- Make collisions obvious before they reach runtime.

## Current Conquest Rubric

- `500-549`: boundary trigger ids
  - Use for main-base triggers, main-base-buffer triggers, and ground-combat-zone triggers.
  - These ids should be authored in `MapConfig`, not hardcoded in gameplay handlers.

- `550-599`: direct vehicle-deploy `SpawnPoint` ids
  - Use for authored per-team vehicle-deploy spawn points only.
  - Keep these separate from the `500-549` boundary-trigger family.

- `600-699`: Conquest capture-point ids
  - Use for objective/capture-point objects only.
  - Keep these reserved for capture ownership, row ordering, HUD mapping, sound/VO mapping, and ticket logic.

- `1000-1049`: reserved for Phase 7 main-base world interactables
  - Even `objId`: ready-dialog terminal
  - Odd `objId`: vehicle-spawn terminal
  - Active runtime ownership.

- `1050-1099`: reserved for Phase 7 capture-point world interactables
  - Capture-point/ammo-resupply interactables
  - Placeholder/runtime-disabled until the ammo menu and point-local trigger rules are defined.

## Phase 7 World-Interactable Quick Map

- `1000-1049`
  - scope: `main_base`
  - even `objId`: hide the shared authored `WorldIcon`, show a per-player runtime `READY` icon only while that player is deployed inside their own HQ, enable the authored interact point with the same numeric id, and route interaction to `open_ready_dialog`
  - odd `objId`: hide the shared authored `WorldIcon`, show a per-player runtime `DEPLOY` icon only while that player is deployed inside their own HQ, enable the authored interact point with the same numeric id, and route interaction to `open_vehicle_spawn_menu`
  - default phase intent: enabled in pre-match and live, disabled during post-match unless setup/reset reclaims ownership
  - team assignment and exact `WorldIcon`/`InteractPoint` pairing are not implied by the range; they must come from explicit map config plus authored terminal placement

- `1050-1099`
  - scope: `point`
  - all `objId`s: show a point/ammo terminal and route interaction to `open_ammo_resupply_menu`
  - default phase intent: placeholder or disabled until the ammo-resupply menu is designed; later can be enabled by explicit phase-state rules
  - ownership/visibility, icon art, color, range, alpha, and exact world-icon/interact-point pairing are not implied by the range; they must come from explicit map config

- Range/parity tells you only the family and default action.
- Exact behavior still needs explicit per-object map-config authoring; runtime should not infer the full contract from the numeric id alone.

## Deprecated Legacy Ranges

- Old helis-only overtime-zone conventions do not need to be preserved for Conquest authoring:
  - `200+`: overtime `AreaTrigger`
  - `300+`: overtime `Sector`
  - `400+`: overtime `WorldIcon`
- These are historical only and should not constrain new Conquest map id allocation.

## Current Firestorm Occupancy

- `500`: Team 2 main-base trigger
- `501`: Team 1 main-base trigger
- `502`: Team 2 / East main-base buffer trigger
- `503`: Team 1 / West main-base buffer trigger
- `550`: Team 2 vehicle-deploy spawn point
- `551`: Team 1 vehicle-deploy spawn point
- `600`: capture point `A`
- `601`: capture point `B`
- `602`: capture point `C`
- `666`: ground combat zone trigger

## Firestorm Layout Note

- Firestorm now separates boundary triggers and vehicle-deploy spawn points cleanly:
  - `500-503` and `666` for boundary ownership
  - `550-551` for vehicle-deploy spawn points

## Authoring Rules

- One authored object id should map to one logical gameplay job on a map.
- The accepted Phase 7 exception is a terminal pair:
  - one authored `WorldIcon`
  - one authored `InteractPoint`
  - same numeric `objId`
  - one logical terminal job
- If an id is used for a trigger, do not reuse it for a spawn point, interactable, or capture point.
- Boundary-trigger ids belong in the `500-549` family.
- Vehicle-deploy spawn-point ids belong in the `550-599` family.
- Capture points stay in the `600-699` family.
- Future world interactables should use the reserved `1000-1049` / `1050-1099` ranges instead of mixing into active boundary/capture families.
