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

- `1000-1049`: reserved for future Phase 7 main-base world interactables
  - Even `objId`: ready-dialog terminal
  - Odd `objId`: vehicle-spawn terminal
  - Not active runtime ownership yet.

- `1050-1099`: reserved for future Phase 7 capture-point world interactables
  - Capture-point/ammo-resupply interactables
  - Not active runtime ownership yet.

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

- One authored object id should have one job on a map.
- If an id is used for a trigger, do not reuse it for a spawn point, interactable, or capture point.
- Boundary-trigger ids belong in the `500-549` family.
- Vehicle-deploy spawn-point ids belong in the `550-599` family.
- Capture points stay in the `600-699` family.
- Future world interactables should use the reserved `1000-1049` / `1050-1099` ranges instead of mixing into active boundary/capture families.
