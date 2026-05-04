# Conquest vs. Reference Implementations — Vehicle Deploy Comparison

## 1. Context & Scope

This document is a **descriptive, side-by-side comparison** of how three BF6 Portal projects handle vehicle spawning, and (for BillDukes specifically) how the player-spawn UI is wired. It is research material only — no recommendations are made about what Conquest should adopt or change. Implementation choices stay where they are.

The three projects under comparison:

| # | Project | Purpose | Pinned version |
|---|---------|---------|----------------|
| 1 | [reference_BillDukes_VehicleDeploy](../reference_implementations/reference_BillDukes_VehicleDeploy/) | Drop-in vehicle deploy mod (single-file portal script) | `VehicleUIUniversal.portal (3).ts` — bundle generated `2026-05-03T18:26:59.982Z` |
| 2 | [reference_BountyHunter](../reference_implementations/reference_BountyHunter/) | FFA bounty-hunter game mode | commit `18fd7a1` (`v0.12.3`), tracks `master` of `https://github.com/deluca-mike/bf6-bounty-hunter` |
| 3 | [conquest](../) | Our Conquest game mode | this repo, current state (post-v1.252 spawn rewrite) |

API signatures cited below were checked against [reference_sdk_1.2.3/code/types/mod/index.d.ts](../../reference_sdk_1.2.3/code/types/mod/index.d.ts).

Glossary used in tables and prose:

- **HQ pad** — the slot's home transform (`slot.spawnPos` in Conquest); where the spawner lives by default.
- **Forward / Air Deploy** — Conquest-specific spawn modes that relocate the spawner to a sampled point before the spawn fires.
- **Bind** — the `OnVehicleSpawned` event resolving the slot ↔ vehicle ObjId mapping.
- **Sentinel spawner** — BillDukes term for a spawner with a negative ObjId (no probe-discoverable handle).

---

## 2. Project Profiles

### 2.1 BillDukes VehicleDeploy

A **drop-in vehicle UI** for any BF6 Portal experience. Player walks onto deploy screen → sees a horizontal row of vehicle buttons → clicks → script seats them in the chosen vehicle. Self-contained (~190 KB ASCII bundle), zero per-map config, requires no rule blocks. Three iterations of `VehicleUIUniversal.portal` exist in this folder; iteration (3) is canonical and adds Sentinel-Spawn handling for vehicles that have no discoverable spawner. The codebase is one bundled `.ts` file built from `lib/`, `modules/`, and `config/` source folders (see [README.md](../reference_implementations/reference_BillDukes_VehicleDeploy/README.md) for the source layout).

### 2.2 BountyHunter

An **FFA deathmatch with bounties on kill-streak players**, by deluca-mike. The gameplay loop is on-foot infantry combat; vehicles are *ambient world objects* that walk-up players can occupy. There is no player-driven vehicle request flow and no vehicle-selection UI. Vehicle spawning is hard-coded to one map (Eastwood, 22 golf carts) plus a debug-tool button that spawns helis/quadbikes at the admin's foot position. All player-spawn UI is delegated to the `FFASpawnPoints` / `FFADropIns` utility libraries from [bf6-portal-utils](https://github.com/deluca-mike/bf6-portal-utils). Source layout: [src/index.ts](../reference_implementations/reference_BountyHunter/src/index.ts), [src/vehicles.ts](../reference_implementations/reference_BountyHunter/src/vehicles.ts), [src/spawns.ts](../reference_implementations/reference_BountyHunter/src/spawns.ts), [src/bounty-hunter/index.ts](../reference_implementations/reference_BountyHunter/src/bounty-hunter/index.ts).

### 2.3 Conquest

A **full Conquest game mode**: ticket bleed, capture flags, multi-phase round (NOT_READY → READY → PREGAME → LIVE → POSTGAME), per-team vehicle slot inventory, four orthogonal deploy modes (Vanilla / HQ / Forward / Air), per-PID HUD, ready-dialog, admin panel. Vehicle subsystem lives in [src/vehicles/](../src/vehicles/); the deploy HUD families in [src/vehicles/deploy-timer-ui.ts](../src/vehicles/deploy-timer-ui.ts) and [src/vehicles/deploy-live-menu.ts](../src/vehicles/deploy-live-menu.ts). Vanilla and HQ both flow through one mutex-serialized dispatcher in [src/vehicles/vanilla-spawner.ts](../src/vehicles/vanilla-spawner.ts).

---

## 3. Vehicle Spawn Pipeline — 3-way comparison

### 3.1 Spawner setup

| Aspect | BillDukes | BountyHunter | Conquest |
|---|---|---|---|
| Spawner origin | Pre-placed in spatial; auto-discovered by ID probe over a configurable range | Runtime-created via `mod.SpawnObject(mod.RuntimeSpawn_Common.VehicleSpawner, ...)` at fixed positions | Pre-placed in spatial via `src/config/maps/*` slot inventory; up to 40 `mod.VehicleSpawner` objects configured at bootstrap |
| Discovery / registration | Probes spawner IDs (default ~200..2100) at game start; force-spawns to read `mod.GetVehicleClass`, then despawns if not yet claimed | None — positions hardcoded in [vehicles.ts:37-60](../reference_implementations/reference_BountyHunter/src/vehicles.ts#L37) (`EASTWOOD_VEHICLE_SPAWNS`) | Map config registry (`TEAM1_VEHICLE_SLOT_INVENTORY_SPECS` / `TEAM2_VEHICLE_SLOT_INVENTORY_SPECS`), iterated once at bootstrap |
| Vehicle type assignment | Inferred post-spawn via `mod.GetVehicleClass()` and `mod.CompareVehicleName()` | `mod.SetVehicleSpawnerVehicleType(spawner, mod.VehicleList.GolfCart)` directly | `mod.SetVehicleSpawnerVehicleType()` per slot from confirmed mode-config (8-setter `configureVehicleSpawner` block) |
| Auto-spawn flag | Spawners left in their map-default state | `SetVehicleSpawnerAutoSpawn(true)` + `SetVehicleSpawnerRespawnTime(spawner, 10)` | `AutoSpawn=false`, `RespawnTime=0` — respawn driven by `Clocks.CountDownClock` |
| Setup timing | At `OnGameModeStarted`, all probes run synchronously | 2-second `setTimeout` between `SpawnObject` and the three setter calls (see [vehicles.ts:31](../reference_implementations/reference_BountyHunter/src/vehicles.ts#L31)) | 2-second `await mod.Wait(2.0)` between `addVanillaSpawnerSlot` and the per-slot setter loop ([vanilla-spawner.ts:151](../src/vehicles/vanilla-spawner.ts#L151)) |

The 2-second engine-init grace period is a load-bearing pattern in both BountyHunter and Conquest. Conquest's [vanilla-spawner.ts:149-151](../src/vehicles/vanilla-spawner.ts#L149-L151) calls it out:

```ts
// Load-bearing: engine needs ~2s after SpawnObject before SetVehicleSpawner* calls apply.
// BountyHunter-validated; removing this causes aircraft slots to spawn default Abrams.
await mod.Wait(2.0);
```

BillDukes does not need an equivalent because it consumes spawners that were placed in the spatial editor — the engine has already initialized them.

### 3.2 Terminal spawn call

Each project has exactly one Portal API that ultimately produces a vehicle in the world.

**BillDukes** — `mod.ForceVehicleSpawnerSpawn(spawner)` inside the click handler's "no_vehicle" branch ([VehicleUIUniversal.portal (3).ts:3212](../reference_implementations/reference_BillDukes_VehicleDeploy/VehicleUIUniversal.portal%20(3).ts#L3212)):

```ts
const spawner = getVehicleSpawnerById(spawnerId);
if (!spawner) { clickToast(player, `bail: spawner ${spawnerId} not found`); return; }
mod.ForceVehicleSpawnerSpawn(spawner);
// ... immediately:
mod.EnablePlayerDeploy(player, true); mod.SetRedeployTime(player, 0); mod.DeployPlayer(player);
waitForSpawnedVehicleThenDeploy(player, playerId, matchTypes, new Set(), spawnerId, vehicleLabel, gen, teamId, 0);
```

**BountyHunter** — `mod.SpawnObject(mod.RuntimeSpawn_Common.VehicleSpawner, ...)` once per location at gamemode init ([vehicles.ts:13-17](../reference_implementations/reference_BountyHunter/src/vehicles.ts#L13-L17)):

```ts
const spawner = mod.SpawnObject(
    mod.RuntimeSpawn_Common.VehicleSpawner,
    position,
    Vectors.getRotationVector(orientation)
) as mod.VehicleSpawner;
```

After this, the spawner's `AutoSpawn=true` + `RespawnTime=10` configuration drives all subsequent vehicle creation. There is no further explicit spawn call — vehicles regenerate on their own.

**Conquest** — `mod.ForceVehicleSpawnerSpawn(slot.spawner)` inside the mutex-serialized `forceSpawnAndAwaitBind` ([vanilla-spawner.ts:338](../src/vehicles/vanilla-spawner.ts#L338)):

```ts
try { mod.ForceVehicleSpawnerSpawn(slot.spawner); } catch {}

const timeoutPromise = new Promise<number>((resolve) => {
    try { Timers.setTimeout(() => resolve(-1), 3000); } catch { resolve(-1); }
});

let result: number;
try { result = await Promise.race([bindPromise, timeoutPromise]); }
catch { result = -1; }
```

All Conquest spawn pathways (round-start fleet, post-destroy respawn, HQ deploy click, Forward/Air request) funnel through this one function.

The shape difference at this layer: BillDukes calls `ForceVehicleSpawnerSpawn` *only* on demand for its no-vehicle branch (otherwise it claims an existing live vehicle); BountyHunter never calls `ForceVehicleSpawnerSpawn` at all and relies purely on `AutoSpawn`; Conquest funnels every spawn through `ForceVehicleSpawnerSpawn` (`AutoSpawn` is permanently disabled).

### 3.3 Concurrency / serialization model

| Concern | BillDukes | BountyHunter | Conquest |
|---|---|---|---|
| Multiple players clicking same vehicle | `pendingSpawnRequestsByPlayerId` + `assignedSpawnedVehicleIdByPlayerId` per-pid maps; 12s reservation map (`reservedVehicleIds`) | Not applicable — players walk to vehicles, no contention | `slot.pendingSpawnOwnerPid` (one pid per slot); `findSlotForHqClaim` enforces "one in-flight claim per pid" |
| Same player double-clicking | `BUTTON_DEBOUNCE_SECONDS = 1.0`; pending-spawn check ([VehicleUIUniversal.portal (3).ts:3082](../reference_implementations/reference_BillDukes_VehicleDeploy/VehicleUIUniversal.portal%20(3).ts#L3082)); `playerSeatGeneration` counter invalidates stale callbacks | N/A | Per-pid `HQ_DEPLOY_REQUEST_COOLDOWN_SECONDS = 5.0` ([hq-deploy.ts:23](../src/vehicles/hq-deploy.ts#L23)) |
| Cross-slot serialization | None at slot level; clicks proceed in parallel | N/A (no clicks) | Single-mutex Promise chain. Every dispatch is `.then`-chained — simultaneous OnVehicleDestroyed + HQ click cannot race ([vanilla-spawner.ts:15-23](../src/vehicles/vanilla-spawner.ts#L15-L23)) |
| Bind ↔ click linkage | `currentSpawnResolve` not used; relies on `waitForSpawnedVehicleThenDeploy` polling `assignedSpawnedVehicleIdByPlayerId` (set by `OnVehicleSpawned`) | N/A | `currentlyExpectingSlotIndex` global is set by `forceSpawnAndAwaitBind` and read by `bindSpawnedVehicleToExpectingSlot` on the `OnVehicleSpawned` event |

The mutex ([vanilla-spawner.ts:15-23](../src/vehicles/vanilla-spawner.ts#L15-L23)):

```ts
let spawnMutex: Promise<void> = Promise.resolve();

function enqueueDispatch(slotIndex: number): void {
    spawnMutex = spawnMutex
        .then(() => doDispatch(State.vehicles.slots[slotIndex], slotIndex))
        .catch(() => { /* swallow: next dispatch must still run */ });
}
```

BillDukes' fallback is a 100ms-poll retry loop in `waitForSpawnedVehicleThenDeploy` ([VehicleUIUniversal.portal (3).ts:3377](../reference_implementations/reference_BillDukes_VehicleDeploy/VehicleUIUniversal.portal%20(3).ts#L3377)) — it is content for spawns to interleave; correctness comes from the post-spawn matching logic (vehicle type + team + reservation set) rather than from serialization.

### 3.4 Player → vehicle entry pattern

This is the largest single difference between the three projects.

| Aspect | BillDukes | BountyHunter | Conquest |
|---|---|---|---|
| Pre-seat teleport (player) | **Yes** for ground vehicles — `mod.Teleport(player, vehiclePos, 0)` immediately before `ForcePlayerToSeat` ([VehicleUIUniversal.portal (3).ts:3795-3799](../reference_implementations/reference_BillDukes_VehicleDeploy/VehicleUIUniversal.portal%20(3).ts#L3795-L3799)). Skipped for air vehicles. | N/A — player walks to the vehicle | **Banned**. A pre-seat `mod.Teleport(player, ...)` regressed the project in v1.106-v1.108 and v1.151-v1.154 (engine OOB latch on aircraft). Note in [hq-deploy.ts:19](../src/vehicles/hq-deploy.ts#L19) and [hq-deploy.ts:336-337](../src/vehicles/hq-deploy.ts#L336-L337) explicitly forbids it. |
| `ForcePlayerToSeat` | `mod.ForcePlayerToSeat(player, vehicle, 0)` (pilot seat hardcoded for first claim; spare-seat for follow-on riders) | N/A | `mod.ForcePlayerToSeat(player, vehicle, -1)` — `-1` = first available seat ([hq-deploy.ts:370](../src/vehicles/hq-deploy.ts#L370)). Only invoked from inside `onPlayerDeployedImpl` (BountyHunter-derived rule, see §6) |
| Deploy ordering | `EnablePlayerDeploy` → `SetRedeployTime(0)` → `DeployPlayer` → `Teleport` → `ForcePlayerToSeat` → 250ms verify ([VehicleUIUniversal.portal (3).ts:3366-3375](../reference_implementations/reference_BillDukes_VehicleDeploy/VehicleUIUniversal.portal%20(3).ts#L3366-L3375)) | `FFASpawnPoints.Soldier.startDelayForPrompt(player)` only ([index.ts:197](../reference_implementations/reference_BountyHunter/src/index.ts#L197)) — utility owns deploy mechanics | **Dead path**: `DeployPlayer` → OnPlayerDeployed → `ForcePlayerToSeat`. **Alive path** (live terminal): `UndeployPlayer` → wait for `deployedByPid[pid]=false` → `DeployPlayer` → OnPlayerDeployed → `ForcePlayerToSeat` ([hq-deploy.ts:289-330](../src/vehicles/hq-deploy.ts#L289-L330)) |
| Post-seat teleport | None | None | Forward/Air only: after seat completes, `mod.Teleport(vehicle, target, yawRad)` relocates *vehicle + seated player* to the forward / air point ([hq-deploy.ts:376-385](../src/vehicles/hq-deploy.ts#L376-L385)) |
| Verify / retry | 250ms post-seat verify; up to 4 retries × 100ms re-attempting `ForcePlayerToSeat` ([VehicleUIUniversal.portal (3).ts:3802-3835](../reference_implementations/reference_BillDukes_VehicleDeploy/VehicleUIUniversal.portal%20(3).ts#L3802-L3835)). Screen effect overlay (`mod.ScreenEffects.Stealth`) hides the transition. | None | Undeploy retry loop up to 1.5s × 100ms (`for (let i = 0; i < 15; i++)`) ([hq-deploy.ts:303-308](../src/vehicles/hq-deploy.ts#L303-L308)); deploy retry up to 3× × 0.4s for the on-foot path ([hq-deploy.ts:321-329](../src/vehicles/hq-deploy.ts#L321-L329)). No `ForcePlayerToSeat` retry — single attempt. |
| Failure fallback | Toast notification "Failed to enter X" + UI back to deploy screen | N/A | Player lands on foot at the pad (or wherever `DeployPlayer` placed them); they can manually press E to enter |

Conquest's seat call ([hq-deploy.ts:338-370](../src/vehicles/hq-deploy.ts#L338-L370)):

```ts
function onHqSeatPendingPlayerDeployed(player: mod.Player, pid: number): void {
    const slot = findSlotForHqClaim(pid);
    if (!slot) return;
    if (slot.vehicleId === -1) return;
    const vehicle = findVehicleById(slot.vehicleId);
    // ... clear claim regardless of outcome ...
    if (!vehicle) { /* no-op */ return; }
    try { mod.ForcePlayerToSeat(player, vehicle, -1); } catch {}
    // post-seat teleport for forward/air follows
}
```

BillDukes' equivalent ([VehicleUIUniversal.portal (3).ts:3793-3801](../reference_implementations/reference_BillDukes_VehicleDeploy/VehicleUIUniversal.portal%20(3).ts#L3793-L3801)):

```ts
let screenEffectOn = false;
try { mod.EnableScreenEffect(player, SEAT_TRANSITION_SCREEN_EFFECT, true); screenEffectOn = true; } catch (_e) {}
if (!isAirVehicleType(vehicle)) {
    try {
        const vPos = getVehiclePosition(vehicle);
        if (vPos) mod.Teleport(player, vPos, 0);
    } catch (_e) {}
}
try { mod.ForcePlayerToSeat(player, vehicle, targetSeat); } catch (_e) {}
mod.Wait(0.25).then(() => { /* verify + retry */ });
```

The pre-seat `mod.Teleport(player, vPos, 0)` line at [3798](../reference_implementations/reference_BillDukes_VehicleDeploy/VehicleUIUniversal.portal%20(3).ts#L3798) is exactly the construct Conquest's hq-deploy module forbids. BillDukes scopes it to ground vehicles only (`!isAirVehicleType(vehicle)`); Conquest's past regressions specifically involved aircraft. Per Conquest's memory entry "Pre-seat player teleport is banned" the construct broke twice and is not in current Conquest code; BillDukes guards against the same failure case via the air-type skip.

### 3.5 Spawn type taxonomy

| Project | Modes | Distinguished by |
|---|---|---|
| BillDukes | One mode (vehicle-claim or force-spawn-then-claim). Iteration (3) adds a "Sentinel" path for vehicles spawned outside the discoverable spawner pool. | `availability` enum: `'empty' \| 'has_seats' \| 'full' \| 'cooldown' \| 'no_vehicle'`. Sentinel triggered when `spawnerId < 0` ([VehicleUIUniversal.portal (3).ts:3120-3123](../reference_implementations/reference_BillDukes_VehicleDeploy/VehicleUIUniversal.portal%20(3).ts#L3120-L3123)) |
| BountyHunter | One mode (passive auto-respawn) | N/A — single uniform pattern |
| Conquest | Four modes: Vanilla (auto fleet), HQ Deploy (player-driven from pad), Forward Deploy (relocate spawner to ground forward point), Air Deploy (relocate spawner to sky point) | `slot.pendingSpawnMode: "ground" \| "forward" \| "air"` set by the request function; consumed by `doDispatch` to choose the relocate-or-not branch ([vanilla-spawner.ts:297-305](../src/vehicles/vanilla-spawner.ts#L297-L305) and [322-336](../src/vehicles/vanilla-spawner.ts#L322-L336)) |

Conquest's Forward and Air modes share the same `enqueueDispatch` channel as Vanilla and HQ; the only branch is whether `slot.spawner` is relocated to the sampled point before `ForceVehicleSpawnerSpawn` and (correspondingly) whether the post-seat hook teleports the vehicle back. The spawner is restored to HQ via `onForwardSpawnSuccess` / `onAirSpawnSuccess` only after seat completes ([hq-deploy.ts:399-423](../src/vehicles/hq-deploy.ts#L399-L423)).

---

## 4. UI for spawning

The user prompt specifically called out BillDukes as the focus for player-spawn UI mechanics. This section covers each project's UI surface for vehicle / player spawning.

### 4.1 BillDukes — auto-discovering button strip

**UI primitives** (custom ParseUI wrappers from the bundle's `lib/ui-v8.ts`):
- `UI.UITextButton` — one per discovered vehicle type for the player's faction
- `UI.UIContainer` — single panel that holds the row of buttons

**UI tree shape** (from [VehicleUIUniversal.portal (3).ts:3000-3066](../reference_implementations/reference_BillDukes_VehicleDeploy/VehicleUIUniversal.portal%20(3).ts#L3000-L3066)):

```
UIContainer (panel)
├── anchor: mod.UIAnchor.TopCenter
├── x: UI_PANEL_X = 0
├── y: UI_PANEL_Y = 170    // moved down to clear ticket bar + A-E flag row
├── depth: mod.UIDepth.AboveGameUI
├── receiver: <one player>
└── children: [
        UITextButton  (BUTTON_SIZE = 50, BUTTON_GAP = 6, anchored TopCenter)
        UITextButton
        UITextButton
        ...
    ]
```

The strip is **per-player** but **structurally per-faction** — every player on Team 1 receives the same set of buttons, just with their own UIWidget instances. Width is computed from button count: `numButtons * (BUTTON_SIZE + BUTTON_GAP) - BUTTON_GAP`.

**Button states** (3-state, from the bundle's `ButtonVisualState` setter pattern):
- BLUE (`baseColor: (0.0, 0.4, 0.9)`) — vehicle is empty, claim is available
- GREEN (`pressedColor: (0.3, 1.0, 0.5)`) — your reservation is active
- BLACK — full / cooldown / spawner offline

A 1 Hz tick (`tickVehicleUI` at [VehicleUIUniversal.portal (3).ts:4142](../reference_implementations/reference_BillDukes_VehicleDeploy/VehicleUIUniversal.portal%20(3).ts#L4142)) re-evaluates each button's state by scanning `mod.AllVehicles()`, checking occupancy, and consulting the `reservedVehicleIds` and `jetCooldownByPlayerId` maps.

**Visibility** (`showPlayerUI` / `hidePlayerUI` at [3838-3850](../reference_implementations/reference_BillDukes_VehicleDeploy/VehicleUIUniversal.portal%20(3).ts#L3838-L3850)):

```ts
function showPlayerUI(player: mod.Player): void {
    const pid = mod.GetObjId(player);
    if (!isPlayerOnDeployScreen(player)) { playerUIVisible.delete(pid); return; }
    const panel = playerPanels.get(pid);
    if (!panel) return;
    try { panel.show(); playerUIVisible.add(pid); } catch (_e) { destroyStalePanel(pid); }
}

function hidePlayerUI(player: mod.Player): void {
    const pid = mod.GetObjId(player);
    const panel = playerPanels.get(pid);
    if (panel) panel.hide();
    playerUIVisible.delete(pid);
}
```

The strip is shown only while the player is on the deploy screen (`isPlayerOnDeployScreen(player)`) and hidden during the seat transition (`hidePlayerUI` called from `beginDeployFlow`).

**Click → spawn pipeline**:

```
button.onClick (UI event)
  → handleVehicleClick(player, teamId, spawnerId, vehicleType, matchTypes, vehicleLabel)
       ├── early bails: pending spawn / debounce / wrong team / jet cooldown / not on deploy screen
       ├── if spawnerId < 0  → handleSentinelClick (Sentinel branch, iteration 3 only)
       ├── if availability === 'no_vehicle':
       │      ├── scan AllVehicles for unoccupied matching type
       │      │     → if found: reserveVehicleForHuman + deployAndSeatPlayer
       │      └── else: ForceVehicleSpawnerSpawn + DeployPlayer + waitForSpawnedVehicleThenDeploy
       ├── if availability === 'has_seats':
       │      └── deployAndSeatPlayer with spareSeat
       ├── if availability === 'empty':
       │      └── reserveVehicleForHuman + deployAndSeatPlayer with seat 0
       └── else: showPlayerUI (strip stays visible)
```

The early-bail block at [VehicleUIUniversal.portal (3).ts:3068-3101](../reference_implementations/reference_BillDukes_VehicleDeploy/VehicleUIUniversal.portal%20(3).ts#L3068-L3101) is unusually defensive — every check toasts the player with a `[VUI]` diagnostic ("bail: debounce", "bail: wrong team", etc.). This is enabled by `CLICK_DIAGNOSTICS = true`.

**Iteration (2) → (3) diff (Sentinel Spawn)**: Iteration (2) does not contain `handleSentinelClick`. Iteration (3) introduces it ([3867](../reference_implementations/reference_BillDukes_VehicleDeploy/VehicleUIUniversal.portal%20(3).ts#L3867)) plus the negative-spawnerId routing at [3120-3123](../reference_implementations/reference_BillDukes_VehicleDeploy/VehicleUIUniversal.portal%20(3).ts#L3120-L3123) and the **phantom spawner filter** in `buildVehicleDefsFromDiscovery`. The filter ([2672-2681](../reference_implementations/reference_BillDukes_VehicleDeploy/VehicleUIUniversal.portal%20(3).ts#L2672-L2681)) walks the live vehicle set, marks which discovered spawner types actually exist on map, and drops "phantom hints" (spawners whose probe registered but whose vehicles never appear). The Sentinel handler itself ([3867-3921](../reference_implementations/reference_BillDukes_VehicleDeploy/VehicleUIUniversal.portal%20(3).ts#L3867-L3921)) walks `mod.AllVehicles()`, picks the first unoccupied match for the requested type and team, and seats the player into it without going through any spawner — useful for vehicles dropped mid-match by rule blocks or other scripts.

### 4.2 BountyHunter — no vehicle UI; player-spawn delegated

There is **no vehicle-selection UI** in BountyHunter. Vehicles are walk-up ambient.

The player-spawn UI is delegated to the `FFASpawnPoints` / `FFADropIns` utility libraries via [src/index.ts:185-200](../reference_implementations/reference_BountyHunter/src/index.ts#L185-L200):

```ts
function createSpawningSoldier(player: mod.Player): boolean {
    if (!spawnType) return false;
    if (spawnType === 'default') return true;

    const playerId = mod.GetObjId(player);
    const soldier =
        spawnType === 'spawnPoints'
            ? new FFASpawnPoints.Soldier(player, DEBUGGING && playerId === 0)
            : new FFADropIns.Soldier(player, DEBUGGING && playerId === 0);

    soldier.startDelayForPrompt();
    return true;
}
```

The `Soldier(player)` constructor + `.startDelayForPrompt()` call is the entire player-spawn flow. The utility owns the prompt UI, spawn-point selection, drop-in sequencing, and respawn delay. BountyHunter only chooses *which* utility to use based on the detected map (`MapDetector.currentMap()` in [spawns.ts](../reference_implementations/reference_BountyHunter/src/spawns.ts)).

A retry-loop wraps this because the utility is not always immediately ready ([src/index.ts:202-212](../reference_implementations/reference_BountyHunter/src/index.ts#L202-L212)):

```ts
function handlePlayerJoinedGame(player: mod.Player): void {
    new BountyHunter(player);

    const tryCreateSpawningSoldier = () => {
        if (!createSpawningSoldier(player)) return;
        Timers.clearInterval(interval);
    };

    const interval = Timers.setInterval(tryCreateSpawningSoldier, 1_000, true);
}
```

The interval fires every 1s until `createSpawningSoldier` returns `true`, at which point it self-cancels.

The **on-respawn** path is similar — `Events.OnPlayerUndeploy` calls `FFASpawnPoints.Soldier.startDelayForPrompt(player)` ([src/index.ts:214-222](../reference_implementations/reference_BountyHunter/src/index.ts#L214-L222)). No custom prompt; no custom flow.

### 4.3 Conquest — per-PID HUD with vehicle row table

**Two surfaces, one render plan.**

The deploy-screen HUD ([src/vehicles/deploy-timer-ui.ts](../src/vehicles/deploy-timer-ui.ts)) is a per-player modal panel. The live-terminal menu ([src/vehicles/deploy-live-menu.ts](../src/vehicles/deploy-live-menu.ts)) is a wrapper that opens the same HUD family while the player is alive. Both produce the same visual: rows for each of the player's team's vehicle slots, each row showing slot status, a spawn button, and ground/forward/air toggle buttons.

**Render plan** ([deploy-timer-ui.ts:140-177](../src/vehicles/deploy-timer-ui.ts#L140-L177)):

```ts
type VehicleDeployTimerRenderPlan = {
    slots: VehicleSpawnerSlot[];
    warmReady: boolean;
    shouldShowRows: boolean;
    visible: boolean;
    liveTerminalOpen: boolean;
    signature: string;
};

function buildVehicleDeployTimerRenderPlan(player: mod.Player, pid: number): VehicleDeployTimerRenderPlan {
    const slots = getVehicleDeployRenderSlotsForPlayer(player);
    // ... build dirty-flag signature from slot state ...
}
```

The **slot filter rule** differs by player state ([deploy-timer-ui.ts:119-131](../src/vehicles/deploy-timer-ui.ts#L119-L131)):

- Undeployed (deploy screen): all enabled team slots (capped at `VEHICLE_DEPLOY_TIMER_MAX_ROWS`)
- Deployed + live terminal open: all enabled team slots
- Deployed + live terminal closed + admin override off: only slots with `vehicleId === -1` (empty pads)

**UI tree shape** (per-PID; widget names suffixed with `(pid, rowIndex)` via the `wn()` factory):

```
VehicleDeployTimerHudRoot                          (pid)
├── VehicleDeployTimerLivePanelBorder/Blur/Fill    (pid)
├── VehicleDeployTimerCloseButton{Border,Blur,Fill,Text,TextShadow}  (pid)
└── for each row 0..MAX_ROWS-1:
    ├── VehicleDeployTimerPlayerPlate              (pid, rowIndex)
    ├── VehicleDeployTimerPlayerText/Shadow        (pid, rowIndex)
    ├── VehicleDeployTimerVehiclePlate             (pid, rowIndex)
    ├── VehicleDeployTimerVehicleText/Shadow       (pid, rowIndex)
    ├── VehicleDeployTimerSpawnButton{Border,Blur,Fill,Text,TextShadow}  (pid, rowIndex)
    ├── VehicleDeployTimerGroundButton{...}        (pid, rowIndex)
    └── VehicleDeployTimerAirButton{...}           (pid, rowIndex)   ← also serves as Forward
```

Each row is ~17 widgets (deduplicated from the `deleteVehicleDeployTimerHudArtifactsForPid` audit at [deploy-timer-ui.ts:227-249](../src/vehicles/deploy-timer-ui.ts#L227-L249)). All widget names are pid-scoped per the project's locked "Per-PID UI scope" rule (see [conquest_design.md](./conquest_design.md)).

**Click → spawn pipeline** ([deploy-timer-ui.ts:1847-1876](../src/vehicles/deploy-timer-ui.ts#L1847-L1876)):

```ts
const source = liveTerminalOpen ? "on_foot" : "deploy_menu";
if (mode === "air") {
    const visibleSlots = getVehicleDeployVisibleSlotsForPlayer(eventPlayer);
    const targetSlot = visibleSlots[rowIndex];
    const isAircraftRow = targetSlot && doesVehicleTypeSupportAirDeploy(targetSlot.vehicleType);
    const isForwardRow = targetSlot
        && !isAircraftRow
        && doesVehicleTypeSupportForwardDeploy(targetSlot.vehicleType);
    if (isAircraftRow) {
        requestAirVehicleSpawn(eventPlayer, pid, rowIndex, source);
    } else if (isForwardRow) {
        requestForwardVehicleSpawn(eventPlayer, pid, rowIndex, source);
    } else {
        requestHqVehicleSpawn(eventPlayer, pid, rowIndex, source);
    }
} else {
    requestHqVehicleSpawn(eventPlayer, pid, rowIndex, source);
}
```

The "air" button label is shared between Air Deploy (aircraft rows) and Forward Deploy (non-aircraft rows); the row's vehicle type decides which request function fires.

**Live terminal flow** ([deploy-live-menu.ts:58-83](../src/vehicles/deploy-live-menu.ts#L58-L83)):

```ts
function tryOpenVehicleDeployLiveMenuForPlayer(eventPlayer: mod.Player): boolean {
    if (!isValidPlayer(eventPlayer)) return false;
    const pid = safeGetPlayerId(eventPlayer);
    if (pid === undefined) return false;
    if (!State.players.deployedByPid[pid]) return false;
    // close overlapping menus, set UI input mode, reveal HUD family
    setVehicleDeployLiveMenuVisibleForPid(pid, true);
    invalidateVehicleDeployTimerHudViewerCache(pid);
    setUIInputModeForPlayer(eventPlayer, true);
    const revealed = revealVehicleDeployTimerHudForPlayer(eventPlayer);
    // ...
}
```

The live menu reuses the deploy-screen HUD family rather than building a separate widget tree.

### 4.4 UI tree shape — side-by-side

```
BillDukes                       BountyHunter                Conquest
─────────                       ────────────                ────────

UIContainer (per-player)        (none in BountyHunter       VehicleDeployTimerHudRoot (per-pid)
  TopCenter (0, 170)             — vehicle UI absent;        ├── Live panel border/blur/fill
  AboveGameUI                    spawn UI delegated          ├── Close button {5 sub-widgets}
  └── [B] [B] [B] [B] [B]        to FFASpawnPoints           └── for each row 0..3:
       ↑ one button per          / FFADropIns utility           ├── Player plate + text {3}
       discovered vehicle        — see §4.2)                    ├── Vehicle plate + text {3}
       3-state coloring                                         ├── Spawn button {5}
       50×50 px, 6 px gap                                       ├── Ground button {5}
                                                                └── Air/Forward button {5}
```

Approximate widget count per player (vehicle-deploy surface only):
- BillDukes: 1 container + N buttons (N = team's discovered vehicles, ~3–10)
- BountyHunter: 0
- Conquest: ~10 root widgets + ~17 widgets × 4 rows ≈ 78 widgets per player

---

## 5. Portal API surface comparison

API rows are grouped by purpose. "Where" cells link to the file that calls the API. "—" means not used in that project.

| API | BillDukes | BountyHunter | Conquest |
|---|---|---|---|
| `mod.SpawnObject(VehicleSpawner, pos, rot)` | — | [vehicles.ts:13](../reference_implementations/reference_BountyHunter/src/vehicles.ts#L13) | — (Conquest spawners are pre-placed in spatial; not runtime-spawned) |
| `mod.ForceVehicleSpawnerSpawn(spawner)` | [(3).ts:3212, 3448, 3581](../reference_implementations/reference_BillDukes_VehicleDeploy/VehicleUIUniversal.portal%20(3).ts#L3212) | — | [vanilla-spawner.ts:338](../src/vehicles/vanilla-spawner.ts#L338) |
| `mod.SetVehicleSpawnerVehicleType(s, t)` | [(3).ts:3447](../reference_implementations/reference_BillDukes_VehicleDeploy/VehicleUIUniversal.portal%20(3).ts#L3447) (alternate-spawner fallback) | [vehicles.ts:20](../reference_implementations/reference_BountyHunter/src/vehicles.ts#L20) | [vanilla-spawner.ts:41](../src/vehicles/vanilla-spawner.ts#L41) |
| `mod.SetVehicleSpawnerAutoSpawn(s, b)` | (left at map default) | `true` ([vehicles.ts:21](../reference_implementations/reference_BountyHunter/src/vehicles.ts#L21)) | `false` ([vanilla-spawner.ts:42](../src/vehicles/vanilla-spawner.ts#L42)) |
| `mod.SetVehicleSpawnerRespawnTime(s, t)` | (left at map default) | `10` seconds ([vehicles.ts:22](../reference_implementations/reference_BountyHunter/src/vehicles.ts#L22)) | `0` ([vanilla-spawner.ts:43](../src/vehicles/vanilla-spawner.ts#L43)) — Conquest manages respawn via `Clocks.CountDownClock` |
| `mod.SetVehicleSpawnerKeepAliveAbandonRadius` etc. | — | enumerated as TODO comments ([vehicles.ts:24-28](../reference_implementations/reference_BountyHunter/src/vehicles.ts#L24-L28)) | applied via `configureVehicleSpawner` ([vanilla-spawner.ts:44-48](../src/vehicles/vanilla-spawner.ts#L44-L48)) |
| `mod.SetObjectTransform(spawner, ...)` | — | — | [vanilla-spawner.ts:324, 332](../src/vehicles/vanilla-spawner.ts#L324) (Forward/Air relocate) and [hq-deploy.ts:402, 417](../src/vehicles/hq-deploy.ts#L402) (restore to HQ) |
| `mod.DeployPlayer(player)` | [(3).ts:3203, 3217, 3368](../reference_implementations/reference_BillDukes_VehicleDeploy/VehicleUIUniversal.portal%20(3).ts#L3368) | (called inside FFASpawnPoints utility, not directly) | [hq-deploy.ts:320, 327](../src/vehicles/hq-deploy.ts#L320) |
| `mod.UndeployPlayer(player)` | — | — | [hq-deploy.ts:299, 307](../src/vehicles/hq-deploy.ts#L299) (alive-path redeploy) |
| `mod.EnablePlayerDeploy(player, b)` | [(3).ts:3203, 3217, 3368](../reference_implementations/reference_BillDukes_VehicleDeploy/VehicleUIUniversal.portal%20(3).ts#L3368) | — | (used elsewhere in conquest player-deploy module) |
| `mod.SetRedeployTime(player, n)` | [(3).ts:3203, 3217, 3368](../reference_implementations/reference_BillDukes_VehicleDeploy/VehicleUIUniversal.portal%20(3).ts#L3368) — set to 0 each deploy | — | [hq-deploy.ts:298, 319, 326](../src/vehicles/hq-deploy.ts#L298) — set to 0 to bypass post-undeploy countdown |
| `mod.ForcePlayerToSeat(player, vehicle, seat)` | [(3).ts:1658, 3801](../reference_implementations/reference_BillDukes_VehicleDeploy/VehicleUIUniversal.portal%20(3).ts#L3801) — seat 0 (pilot) for first claim | — | [hq-deploy.ts:370](../src/vehicles/hq-deploy.ts#L370) — seat `-1` (any open) |
| `mod.ForcePlayerExitVehicle` | [(3).ts:3783, 3822](../reference_implementations/reference_BillDukes_VehicleDeploy/VehicleUIUniversal.portal%20(3).ts#L3822) — eject AI from claimed pilot/passenger seats | — | (used elsewhere) |
| `mod.Teleport(player, pos, yaw)` | [(3).ts:3798](../reference_implementations/reference_BillDukes_VehicleDeploy/VehicleUIUniversal.portal%20(3).ts#L3798) — pre-seat, ground only | — | **Banned pre-seat**; allowed elsewhere |
| `mod.Teleport(vehicle, pos, yaw)` | — | — | [vanilla-spawner.ts:308](../src/vehicles/vanilla-spawner.ts#L308) (apply yaw post-bind); [hq-deploy.ts:379, 384](../src/vehicles/hq-deploy.ts#L379) (post-seat Forward/Air relocate); [vanilla-spawner.ts:100](../src/vehicles/vanilla-spawner.ts#L100) (`sinkAndDestroyVehicle`) |
| `mod.IsVehicleOccupied(vehicle)` | [(3).ts:2719, 3136](../reference_implementations/reference_BillDukes_VehicleDeploy/VehicleUIUniversal.portal%20(3).ts#L3136) | — | (used in occupancy probes elsewhere in vehicles/) |
| `mod.IsVehicleSeatOccupied(vehicle, seat)` | [(3).ts:3780](../reference_implementations/reference_BillDukes_VehicleDeploy/VehicleUIUniversal.portal%20(3).ts#L3780) | — | (used in occupancy probes elsewhere) |
| `mod.GetVehicleSeatCount(vehicle)` | [(3).ts:3819](../reference_implementations/reference_BillDukes_VehicleDeploy/VehicleUIUniversal.portal%20(3).ts#L3819) | — | (used elsewhere) |
| `mod.AllVehicles()` / `CountOf` / `ValueInArray` | extensively in tick / discovery / claim scans | — | [vanilla-spawner.ts:53-58](../src/vehicles/vanilla-spawner.ts#L53-L58) (`findVehicleById` scan) and elsewhere |
| `mod.GetObjId(v / player)` | extensively | [index.ts:30, 101, 190](../reference_implementations/reference_BountyHunter/src/index.ts#L190) | extensively |
| `mod.GetVehicleClass(vehicle)` | discovery probe (auto-discovery module) | — | (not the primary classifier — Conquest uses `mod.CompareVehicleName`) |
| `mod.CompareVehicleName(v, type)` | [(3).ts:2663, 3142](../reference_implementations/reference_BillDukes_VehicleDeploy/VehicleUIUniversal.portal%20(3).ts#L3142) and elsewhere | — | extensive in [vehicle-classification.ts](../src/vehicles/vehicle-classification.ts) |
| `mod.SetVehicleMaxHealthMultiplier` | [(3).ts:3813-3816](../reference_implementations/reference_BillDukes_VehicleDeploy/VehicleUIUniversal.portal%20(3).ts#L3813-L3816) — tank 0.5x, IFV 0.6x, AA 0.7x, Marauder 0.6x post-claim | — | — |
| `mod.EnableScreenEffect(player, ...)` | [(3).ts:3794, 3805, 3830](../reference_implementations/reference_BillDukes_VehicleDeploy/VehicleUIUniversal.portal%20(3).ts#L3794) — Stealth overlay during seat transition | — | (used in other UX hooks; not in seat path) |
| `mod.DisplayCustomNotificationMessage` | extensive (`clickToast`, jet cooldown, failure toasts) | — | (used in other modules) |
| `mod.GetMatchTimeElapsed()` | extensive (cooldown computation) | — | extensive (cooldown computation) |
| `Events.OnVehicleSpawned` (via `OnVehicleSpawned`) | yes — `assignedSpawnedVehicleIdByPlayerId` writer | — (auto-spawn via `AutoSpawn=true`) | yes — `bindSpawnedVehicleToExpectingSlot` ([vanilla-spawner.ts:363](../src/vehicles/vanilla-spawner.ts#L363)) |
| `Events.OnVehicleDestroyed` | yes — clears reservation, starts cooldown | — (engine handles via `RespawnTime=10`) | yes — drives respawn `Clocks.CountDownClock` |
| `Events.OnPlayerEnterVehicle` | yes — mark occupied | — | yes |
| `Events.OnPlayerExitVehicle` | yes — clear reservation if owner | — | yes |
| `Events.OnPlayerDeployed` | yes — hide UI for live players | yes — `BountyHunter.handleDeployed` (UI restore) | yes — seat-pending hook fires here ([hq-deploy.ts:338](../src/vehicles/hq-deploy.ts#L338)) |
| `Events.OnPlayerUndeploy` | yes — re-show UI | yes — re-prompt for spawn ([index.ts:214](../reference_implementations/reference_BountyHunter/src/index.ts#L214)) | yes — close live menu, clear ownership |
| `Events.OnPlayerDied` | yes — show UI | — (handled inside FFA utility) | (not directly tied to vehicle UI) |

SDK signatures cross-checked:
- `ForceVehicleSpawnerSpawn(vehicleSpawner: VehicleSpawner): void` — [reference_sdk_1.2.3/code/types/mod/index.d.ts:27484](../../reference_sdk_1.2.3/code/types/mod/index.d.ts#L27484)
- `ForcePlayerToSeat(player: Player, vehicle: Vehicle, seatNumber: number): void` — `seatNumber === -1` means first available seat ([index.d.ts:27549-27550](../../reference_sdk_1.2.3/code/types/mod/index.d.ts#L27549-L27550))
- `SetVehicleSpawnerAutoSpawn(s, b)` — [index.d.ts:27514](../../reference_sdk_1.2.3/code/types/mod/index.d.ts#L27514)
- `SetVehicleSpawnerRespawnTime(s, t)` — [index.d.ts:27529](../../reference_sdk_1.2.3/code/types/mod/index.d.ts#L27529)
- `SetVehicleSpawnerVehicleType(s, t)` — [index.d.ts:27535](../../reference_sdk_1.2.3/code/types/mod/index.d.ts#L27535)
- `DeployPlayer(player)` — [index.d.ts:26587](../../reference_sdk_1.2.3/code/types/mod/index.d.ts#L26587)
- `UndeployPlayer(player)` — [index.d.ts:26403](../../reference_sdk_1.2.3/code/types/mod/index.d.ts#L26403)
- `EnablePlayerDeploy(player, b)` — [index.d.ts:26394](../../reference_sdk_1.2.3/code/types/mod/index.d.ts#L26394)

---

## 6. Pattern differences (descriptive, no recommendations)

### Discovery vs. configuration

BillDukes auto-discovers spawners by probing ObjId range 200..2100 at game start, calling `ForceVehicleSpawnerSpawn` to read `mod.GetVehicleClass`, then despawning unclaimed probes. BountyHunter hardcodes 22 positions in [vehicles.ts](../reference_implementations/reference_BountyHunter/src/vehicles.ts) and uses `mod.SpawnObject` to create spawners at runtime. Conquest registers slots via map config (`TEAM*_VEHICLE_SLOT_INVENTORY_SPECS`) read by `addVanillaSpawnerSlot` against pre-placed spatial spawners. The three fall on a spectrum: BillDukes discovers what the map gives it; BountyHunter and Conquest each control where their spawners live, but Conquest does so per-map while BountyHunter does so per-mode.

### Pre-seat vs. post-seat teleport

BillDukes teleports the player to the vehicle position immediately before `ForcePlayerToSeat` (ground vehicles only — air vehicles skip this). Conquest never teleports the player before seating; instead, when Forward or Air mode requires the vehicle to end up at a non-HQ point, the *vehicle* is teleported (carrying the seated player) after `ForcePlayerToSeat` completes. The pre-seat construct broke Conquest twice (v1.106-v1.108 and v1.151-v1.154) on aircraft and is now a memory-tracked ban. BillDukes' air-skip preempts the same failure surface.

### Mutex vs. per-player suppress vs. no contention

Conquest serializes every spawn through one `spawnMutex` Promise chain ([vanilla-spawner.ts:15-23](../src/vehicles/vanilla-spawner.ts#L15-L23)) — two clicks on different slots run sequentially. BillDukes uses per-player suppress flags (`suppressUIUntilByPlayerId`, `pendingSpawnRequestsByPlayerId`) and a 12-second vehicle reservation map (`reservedVehicleIds`) to keep two players from claiming the same vehicle; clicks on different vehicles can proceed in parallel. BountyHunter has no contention to manage — vehicles are walk-up.

### UI scope

BillDukes' panel is per-player (each player gets their own `playerPanels.set(playerId, panel)`) but the *structure* is uniform per faction (Team 1 buttons differ from Team 2 buttons; within a team all players see the same buttons). Conquest's HUD is per-PID *both* in instance and in content — every widget name is suffixed with `(pid, rowIndex)` and per-row content can differ per player (occupancy, cooldown, button state). BountyHunter has no per-player vehicle UI; it instantiates a `BountyHunter`-class per player but that's a state holder, not a vehicle widget.

### Reservation system

BillDukes keeps a `reservedVehicleIds: Map<number, {playerId, expiresAt}>` with `RESERVATION_DURATION = 12.0` seconds, plus `JET_COOLDOWN_SECONDS = 30.0` and a separate jet-claim duration. A vehicle is reserved at click time and naturally expires; if the player enters the vehicle, the reservation effectively becomes permanent until `OnPlayerExitVehicle`. Conquest does not reserve at all — the slot's `pendingSpawnOwnerPid` is the only ownership marker, and it is cleared on bind+seat (success) or on `scheduleHqClaimTimeout` (10-second timeout). Vehicle-level ownership in Conquest comes from `slot.activeOwnerPid` derived from `OnPlayerEnterVehicle`. BountyHunter has no reservation concept.

### Force-spawner-relocate trick

Conquest's Forward and Air modes call `mod.SetObjectTransform(slot.spawner, ...)` to move the *spawner* to the sampled point before `ForceVehicleSpawnerSpawn`, then restore the spawner to its HQ pad in the post-seat hook (`onForwardSpawnSuccess` / `onAirSpawnSuccess`). This avoids creating extra spawner objects ([vanilla-spawner.ts:322-336](../src/vehicles/vanilla-spawner.ts#L322-L336)). The restore is deliberately ordered after seat completes — earlier ordering caused the engine to snap the freshly-spawned vehicle back toward the spawner's transform mid-bind. BillDukes does not relocate spawners. BountyHunter does not relocate spawners.

### Verify-and-retry depth

BillDukes retries `ForcePlayerToSeat` up to 4 times with 100ms gaps after a 250ms verify wait, using `safeGetSoldierStateBool(player, IsInVehicle)` to confirm. Conquest does not retry the seat call — a single attempt; if it fails, the player lands on foot at the pad. Conquest *does* retry the deploy and undeploy phases (undeploy: 15× × 100ms; deploy: 3× × 400ms on the on-foot path), which precede the seat call. The retry layers attack different failure modes: BillDukes retries the seat itself; Conquest retries the predecessor events that gate the seat.

### Engine-event reliability assumption

Conquest's hq-deploy module relies on a documented project memory (`OnPlayerEnterVehicle` drops events; `OnPlayerExitVehicle` is reliable) — the seat-flow does not require `OnPlayerEnterVehicle` to confirm seating. BillDukes treats `OnPlayerEnterVehicle` as authoritative for marking vehicles occupied (`vehicleUI_OnPlayerEnterVehicle` per the README's public API). BountyHunter does not subscribe to either event.

---

## 7. End-to-end timelines

### 7.1 BillDukes — player joins → in vehicle

```
T+0   OnGameModeStarted
        ↓
        AutoDiscovery_Init         (probe spawner IDs 200..2100)
        initVehicleSpawnUI         (build panels per future player on first deploy-screen tick)
        start tick loop            (1 Hz)

T+x   player joins                 (no explicit subscriber; UI panel created on first deploy-screen tick)

T+y   player on deploy screen
        ↓
        showPlayerUI(player)       → row of buttons appears

T+y+n player clicks button
        ↓
        handleVehicleClick
          if existing unoccupied vehicle → reserve → deployAndSeatPlayer
            DeployPlayer
            ↓ (engine fires OnPlayerDeployed; BillDukes uses its own waitForAliveAndSeat loop)
            mod.Teleport(player, vehiclePos, 0)    (ground only)
            mod.ForcePlayerToSeat(player, vehicle, 0)
            mod.Wait(0.25); verify IsInVehicle
              ↳ if not in vehicle: retry up to 4× × 100ms
              ↳ if in vehicle: clear suppress; apply HP multipliers; eject AI
        ↓
        player is in vehicle (UI hidden since OnPlayerDeployed re-fires for live players)
```

### 7.2 BountyHunter — player joins → in vehicle (walk-up)

```
T+0   OnGameModeStarted
        ↓
        BountyHunter.initialize
        FFASpawnPoints.initialize (or FFADropIns.initialize)
        spawnVehicleSpawners(adminLogger)   → 22 SpawnObject calls if Eastwood; 2s setTimeout config; vehicles auto-respawn

T+x   OnPlayerJoinGame fires → handlePlayerJoinedGame
        ↓
        new BountyHunter(player)
        Timers.setInterval(tryCreateSpawningSoldier, 1000)
          ↳ each tick: createSpawningSoldier → new FFASpawnPoints.Soldier(player) → soldier.startDelayForPrompt()
          ↳ once successful, clearInterval

T+x+n FFASpawnPoints utility owns prompt UI; player picks spawn; deploys to ground

T+x+m player walks to a parked golf cart
        ↓
        engine fires OnPlayerEnterVehicle
        BountyHunter has no subscriber; vehicle is just used
```

### 7.3 Conquest — player joins → in vehicle (HQ Deploy mode)

```
T+0   OnGameModeStarted
        ↓
        startVanillaVehicleSpawnerSystem
          await State.vehicles.configReady (ready-dialog confirms mode)
          addVanillaSpawnerSlot × N  (one per slot in config)
          await mod.Wait(2.0)        (engine init grace)
          configureVehicleSpawner per slot (8 setters + 100ms yield)
          if !isMatchLive: pre-live Abrams cleanup (sinkAndDestroyVehicle)

T+x   player joins → ready-dialog flow
        ready check passes for all → startPregameCountdown
        → resetVehicleSlotsAtCountdownStart (sink old; if Vanilla mode: enqueueDispatch fleet)

T+x+n LIVE banner; player still on deploy screen
        ↓
        (if HQ mode) deploy-timer-ui shows row table
        player clicks "Spawn" on a row
        ↓
        onUIVehicleDeployClick → requestHqVehicleSpawn
          validate cooldown / claim / slot state
          slot.pendingSpawnOwnerPid = pid
          slot.pendingSpawnMode = "ground"
          enqueueDispatch(slotIndex)
            ↓ (mutex chain)
            doDispatch → forceSpawnAndAwaitBind
              mod.ForceVehicleSpawnerSpawn(slot.spawner)
              Promise.race(bindPromise, 3000ms timeout)
            ↓ OnVehicleSpawned fires
            bindSpawnedVehicleToExpectingSlot
              slot.vehicleId = bound id
              registerVehicleToTeam
              onHqVehicleSpawnedForClaim → beginHqSeatFlow

T+x+n+1
        beginHqSeatFlow
          await mod.Wait(0.5)        (settle)
          mod.DeployPlayer(player)
          ↓ OnPlayerDeployed fires
          onHqSeatPendingPlayerDeployed
            mod.ForcePlayerToSeat(player, vehicle, -1)
        ↓
        player is in vehicle; HUD redraws (slot row now hidden because vehicleId !== -1)
```

For Forward / Air, an additional pre-spawn `mod.SetObjectTransform(spawner, fwdPos)` and post-seat `mod.Teleport(vehicle, fwdPos, yaw)` bracket the sequence; the spawner is then restored to HQ via `onForwardSpawnSuccess` / `onAirSpawnSuccess`.

For the **alive on-foot** path (live terminal, `source === "on_foot"`), `beginHqSeatFlow` inserts an `mod.UndeployPlayer` + 15× × 100ms wait before the `mod.DeployPlayer` call so OnPlayerDeployed actually fires from a redeploy.

---

## 8. Quirks inventory (per project)

### 8.1 BillDukes

- **Phantom spawner filter** (iteration 3 only): `buildVehicleDefsFromDiscovery` walks live vehicles and drops discovered spawners whose vehicle types never appear on the map. Logged as `(dropped N phantom hints)` ([VehicleUIUniversal.portal (3).ts:2672-2692](../reference_implementations/reference_BillDukes_VehicleDeploy/VehicleUIUniversal.portal%20(3).ts#L2672-L2692)).
- **50m distance check**: when claiming an "untracked" vehicle (one not bound to a known spawner), BillDukes compares the spawner's position to the vehicle's position; if `distSq > 50*50` the candidate is rejected ([3162-3168](../reference_implementations/reference_BillDukes_VehicleDeploy/VehicleUIUniversal.portal%20(3).ts#L3162-L3168)).
- **AI ejection**: after successful pilot claim, walks all seats and `ForcePlayerExitVehicle` on AI occupants ([3819-3824](../reference_implementations/reference_BillDukes_VehicleDeploy/VehicleUIUniversal.portal%20(3).ts#L3819-L3824)).
- **Stealth screen effect during transition**: `mod.EnableScreenEffect(player, mod.ScreenEffects.Stealth, true)` covers the teleport-and-seat visual flash; turned off after seat verify ([3794, 3805, 3830](../reference_implementations/reference_BillDukes_VehicleDeploy/VehicleUIUniversal.portal%20(3).ts#L3794)).
- **Player seat generation counter**: `playerSeatGeneration` increments per click; stale callbacks check `isCurrentSeatGeneration(playerId, seatGen)` and abort if the player has clicked again since ([3267-3273](../reference_implementations/reference_BillDukes_VehicleDeploy/VehicleUIUniversal.portal%20(3).ts#L3267-L3273)).
- **Alternate-spawner fallback**: if the chosen spawner doesn't produce a vehicle within timeout, walks `AutoDiscovery_GetAlternateSpawners(spawnerId, teamId)` and retries on each ([3437-3454](../reference_implementations/reference_BillDukes_VehicleDeploy/VehicleUIUniversal.portal%20(3).ts#L3437-L3454)).
- **Defensive try/catch around all mod.*** — every engine call has a `try { ... } catch (_e) {}` wrapper.
- **Faction-fallback team detection**: `handleSentinelClick` first reads `mod.GetVehicleTeam(v)`; if that returns no team, falls back to comparing vehicle name against per-team faction lists ([3899-3906](../reference_implementations/reference_BillDukes_VehicleDeploy/VehicleUIUniversal.portal%20(3).ts#L3899-L3906)).

### 8.2 BountyHunter

- **Retry-loop on FFA utility readiness**: `createSpawningSoldier` returns `false` until `spawnType` is set; `setInterval(..., 1000)` retries every second until success then self-clears ([index.ts:202-212](../reference_implementations/reference_BountyHunter/src/index.ts#L202-L212)).
- **Multi-listener pattern** on `Events.OnPlayerJoinGame`: one subscriber for the admin debug tool, one for spawn/BountyHunter setup ([index.ts:225, 233](../reference_implementations/reference_BountyHunter/src/index.ts#L225)). Both fire independently.
- **2-second engine init delay** between `SpawnObject(VehicleSpawner)` and the setter triplet: `Timers.setTimeout(setupVehicleSpawner, 2_000)` ([vehicles.ts:31](../reference_implementations/reference_BountyHunter/src/vehicles.ts#L31)). Same window Conquest documents at [vanilla-spawner.ts:149-151](../src/vehicles/vanilla-spawner.ts#L149-L151).
- **TODO comment on admin error**: an unidentified setter call inside `BountyHunter.handleDeployed` produces an admin error but the kill-loadout still applies ([bounty-hunter/index.ts:478](../reference_implementations/reference_BountyHunter/src/bounty-hunter/index.ts#L478)).
- **Sounds API rename in v0.12.3**: `Sounds.play2D` → `Sounds.Sound2D.play` (commit `18fd7a1`).
- **Spawn type toggling via map detector**: `getSpawnDataAndInitializeOptions` returns either `spawnData` (point-based) or `dropInData` (volume-based) per detected map; new `Complex3` drop-in map added in v0.12.3.

### 8.3 Conquest

- **Pre-seat player teleport ban** ([hq-deploy.ts:19](../src/vehicles/hq-deploy.ts#L19), [hq-deploy.ts:336-337](../src/vehicles/hq-deploy.ts#L336-L337)). Memory entry: broke v1.106-v1.108 and v1.151-v1.154; not in current code.
- **GetObjectPosition zero-vector fallback in `sinkAndDestroyVehicle`** ([vanilla-spawner.ts:85-102](../src/vehicles/vanilla-spawner.ts#L85-L102)): callers with a slot context must pass `slot.spawnPos` because `GetObjectPosition` returns bad X/Z at the Vanilla→HQ countdown reset. Memory entry "GetObjectPosition unreliable on destroy".
- **CQ_Bug_43 (Cheetah/Gepard enum swap)** in [vehicle-classification.ts](../src/vehicles/vehicle-classification.ts) — `mod.CompareVehicleName` returns false for these two, so AA classification has to enumerate the swap.
- **CQ_Bug_49 (Abrams aircraft-slot pollution)**: the engine auto-spawns Abrams from new VehicleSpawner objects during the 2-second init window before `AutoSpawn=false` applies. Pre-live cleanup filters to Abrams only so map emplacements / pre-placed vehicles survive ([vanilla-spawner.ts:163-170](../src/vehicles/vanilla-spawner.ts#L163-L170)).
- **Mutex catch swallows errors** ([vanilla-spawner.ts:22](../src/vehicles/vanilla-spawner.ts#L22)): the `.catch()` is load-bearing — without it, one failed dispatch poisons the chain and blocks every subsequent slot (observed in v1.259).
- **`currentlyExpectingSlotIndex` race protection**: cleared on every exit of `forceSpawnAndAwaitBind` so a delayed `OnVehicleSpawned` arriving after timeout sees `-1` and is dropped ([vanilla-spawner.ts:350](../src/vehicles/vanilla-spawner.ts#L350)).
- **HQ claim timeout** of 10s ([hq-deploy.ts:30](../src/vehicles/hq-deploy.ts#L30)) — covers spawn_pending and seat_pending; on expiry destroys the orphan vehicle and clears the slot.
- **`UndeployPlayer` retry loop** (15× × 100ms) ([hq-deploy.ts:303-308](../src/vehicles/hq-deploy.ts#L303-L308)): mirrors a similar pattern in `player-deploy.ts`'s `deferForcedUndeploy`. Single `UndeployPlayer` calls are sometimes swallowed by the engine.
- **Forward/Air post-seat ordering** ([hq-deploy.ts:392-398](../src/vehicles/hq-deploy.ts#L392-L398)): the spawner is restored to the HQ pad **after** `ForcePlayerToSeat`, not before — observed pre-v1.259 that mid-bind relocation could cause the engine to snap the freshly-spawned vehicle back toward the spawner transform.
- **Per-PID UI scope is non-negotiable** (project rule, [conquest_design.md](./conquest_design.md)): widgets are pid-suffixed by the `wn(name, pid, ...)` factory; broader scoping is not used.
- **Aircraft enum gating for Air Deploy**: `doesVehicleTypeSupportAirDeploy` enumerates exactly AH64, Eurocopter, AH6M, AH6M_Pax, UH60, UH60_Pax, F16, F22, JAS39, SU57 ([deploy-timer-ui.ts:190-206](../src/vehicles/deploy-timer-ui.ts#L190-L206)). Forward Deploy is the complement (`!isAircraftVehicleType`).

---

## 9. Source pointers

### BillDukes
- [README.md](../reference_implementations/reference_BillDukes_VehicleDeploy/README.md) — public API and integration notes
- [VehicleUIUniversal.portal (3).ts](../reference_implementations/reference_BillDukes_VehicleDeploy/VehicleUIUniversal.portal%20(3).ts) — canonical bundle (4378 lines)
- [VehicleUIUniversal.portal (2).ts](../reference_implementations/reference_BillDukes_VehicleDeploy/VehicleUIUniversal.portal%20(2).ts) — pre-Sentinel iteration (4283 lines, no `handleSentinelClick`)

### BountyHunter (commit `18fd7a1`, v0.12.3)
- [src/index.ts](../reference_implementations/reference_BountyHunter/src/index.ts) — entry point, event hookup, `createSpawningSoldier`
- [src/vehicles.ts](../reference_implementations/reference_BountyHunter/src/vehicles.ts) — `createVehicleSpawner` + `EASTWOOD_VEHICLE_SPAWNS` + `spawnVehicleSpawners`
- [src/spawns.ts](../reference_implementations/reference_BountyHunter/src/spawns.ts) — per-map `getSpawnDataAndInitializeOptions`
- [src/bounty-hunter/index.ts](../reference_implementations/reference_BountyHunter/src/bounty-hunter/index.ts) — game-mode logic, kill streaks, big-bounties UI

### Conquest
- [src/vehicles/vanilla-spawner.ts](../src/vehicles/vanilla-spawner.ts) — mutex, `enqueueDispatch`, `doDispatch`, `forceSpawnAndAwaitBind`, `bindSpawnedVehicleToExpectingSlot`, `sinkAndDestroyVehicle`, bootstrap
- [src/vehicles/hq-deploy.ts](../src/vehicles/hq-deploy.ts) — `requestHqVehicleSpawn`, `requestForwardVehicleSpawn`, `requestAirVehicleSpawn`, `beginHqSeatFlow`, `onHqSeatPendingPlayerDeployed`, `onForwardSpawnSuccess`, `onAirSpawnSuccess`
- [src/vehicles/deploy-timer-ui.ts](../src/vehicles/deploy-timer-ui.ts) — render plan, click router, per-PID widget tree
- [src/vehicles/deploy-live-menu.ts](../src/vehicles/deploy-live-menu.ts) — alive-state world terminal wrapper
- [src/vehicles/registration.ts](../src/vehicles/registration.ts) — slot/team ownership registration
- [src/vehicles/forward-spawn-volume.ts](../src/vehicles/forward-spawn-volume.ts) — forward point sampling (`seedNextForwardTransformForSlot`)
- [src/vehicles/air-spawn-volume.ts](../src/vehicles/air-spawn-volume.ts) — air point sampling (`seedNextAirTransformForSlot`)
- [src/vehicles/vehicle-classification.ts](../src/vehicles/vehicle-classification.ts) — type predicates incl. CQ_Bug_43
- [src/vehicles/timers.ts](../src/vehicles/timers.ts) — `Clocks.CountDownClock` integration for respawn

### SDK reference
- [reference_sdk_1.2.3/code/types/mod/index.d.ts](../../reference_sdk_1.2.3/code/types/mod/index.d.ts) — Portal API signatures (line refs in §5)

### Project memory cross-references
- "Pre-seat player teleport is banned" — applies to §3.4 and §6
- "ForcePlayerToSeat unreliable" — applies to §3.4 and §8.3
- "GetObjectPosition unreliable on destroy" — applies to §8.3
- "Engine event reliability asymmetric" (`OnPlayerEnterVehicle` drops; `OnPlayerExitVehicle` reliable) — applies to §6
- "Per-PID UI scope is non-negotiable" — applies to §4.3
- "mod.AddUIIcon is non-functional" — does not apply here; none of the three projects use `AddUIIcon` for vehicle UI
