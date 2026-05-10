# spec_cam_functionality

In-depth analysis of the **Portal Cinematic Toolkit (PCT) v1.01** by NODONE.

Source folder: [reference_nodone_cinematic_camera/](../reference_implementations/reference_nodone_cinematic_camera/)

This is **reference-only**. Nothing here is intended to be copied verbatim into our Conquest codebase — the goal is to understand the techniques and the mod.* API surface area used to drive cinematic cameras, fixed-camera cinematics, free-fly cameras, and player-tracking presets, so we can decide what (if anything) to lift into Conquest.

---

## 1. Executive Summary

PCT is a single-file, ~8,130-line TypeScript module that turns a Battlefield Portal experience into a cinematic camera rig operated by a single privileged "director" player. It exposes three top-level namespaces that must all be present:

- **PCT_ErrorLogger** — broadcasts numbered errors to chat + console with a stack trace.
- **PCT_UI** — a thin OO wrapper over Portal's `mod.AddUIContainer / Text / Button / Image` primitives, giving you `Container`, `Text`, `Button`, `Image` classes with a fluent API and a button-click dispatcher.
- **PCT** — the actual director / camera / path / VFX state machine, plus the public bridge functions the host script forwards Portal events to.

The toolkit drives the camera by **owning a Godot-placed `mod.FixedCamera` object**, calling `mod.SetCameraTypeForPlayer(dir, mod.Cameras.Fixed, fixedCameraId)` to attach the director's view to it, then re-positioning that camera every tick (~33 ms) via `mod.SetObjectTransform(...)`. There is no "real" cinematic API in Portal — the entire effect is a hand-rolled tight loop. Three camera modes are layered on top of that single trick:

| Mode | What it does |
|---|---|
| **Path Camera** | Director places world-icon "path points" via crouch+fire raycast aim; PCT smooths them with quadratic Béziers and dollies the FixedCamera along the curve at a configurable speed, looking ahead by N units, with optional player-target tracking. |
| **Free Camera** | Director's WSAD/sprint inputs drive the FixedCamera while their soldier body stays parked in a hidden "control room" (auto-spawned 50m below the director-spawn point). Includes player-target lock with raycast collision correction (`mod.RayCast` + `OnRayCastHit/Missed`) and a cinematic "zoom-out / zoom-in" transition between distant targets. |
| **Player Preset Camera** | Director gets the Portal Gadget; firing the gadget cycles through ~46 hand-tuned offset/pitch presets (Close Rear, Shoulder, Top-Down, etc.) tracking themselves. |

Other notable features:

- Numeric **passcode-gated director assignment** (`"1234"` by default), implemented as an in-world UI keypad.
- A **single-director invariant** (`Player.assignedDirectorPlayerId` is the canonical source of truth, registry keyed by `mod.GetObjId(player)`).
- **Director invulnerability** via `mod.SetPlayerIncomingDamageFactor(dir, 0)` on assign, restored to 100 on unassign.
- **Per-PID UI** — every `PCT_UI.Container/Text/Button` is created with a `receiver` argument so widgets exist only in the target player's HUD; widget names are uniquified with `parent_rid_segment_counter`.
- **VFX dressing** along the camera path (random C4/artillery/SUV explosions weighted from an inventory) keyed on camera distance moved, gated by a `spawnChance` value the director can tune live.
- **World-icon manager** (`PCT_WIM`) — wraps `mod.SpawnObject(rtc.WorldIcon, ...)` clones because `mod.AddUIIcon` is documented in code comments as bugged (matches our [feedback_adduiicon_broken.md](../../../../.claude/projects/c--Users-Soldat-TypeScriptProjects-twlmain/memory/feedback_adduiicon_broken.md)).
- A **director "control room"** (4 walls + floor + ceiling spawned from FiringRange assets) that hides the director's body during Free Cam, with a sky-spawn fallback if the original spot lands in water.

The main load-bearing trick worth understanding: PCT keeps the director's player object alive and "deployed" the entire time, but it teleports the body into the hidden control room and switches the camera to a Fixed camera that the script moves manually — essentially decoupling camera from soldier without using a true spectator system.

---

## 2. File Map

The repo is flat. Three meaningful files (plus `LICENSE`):

| File | Purpose |
|---|---|
| [README.md](../reference_implementations/reference_nodone_cinematic_camera/README.md) | User-facing install guide. Two integration paths (standalone vs. drop-in), required Portal event hook table, troubleshooting. **The single most useful page for understanding the public contract.** |
| [main_module.ts](../reference_implementations/reference_nodone_cinematic_camera/main_module.ts) | The entire toolkit. ~8.1k LOC, three namespaces (`PCT_ErrorLogger`, `PCT_UI`, `PCT`) plus a private class `PCT_WIM`. |
| [main_strings_module.json](../reference_implementations/reference_nodone_cinematic_camera/main_strings_module.json) | All 113 string keys (`PCT_*`) consumed by `mod.Message(...)` calls. Includes the keypad digits, status labels, ~46 preset names, and notice/tip copy. |

There are no separate util/ui/state files — everything is one file. Configuration lives inside `PCT.Initialize(...)` and the inline literal that builds `_config` at [main_module.ts:1896](../reference_implementations/reference_nodone_cinematic_camera/main_module.ts#L1896).

---

## 3. Top-Level Architecture

```
main_module.ts
├── PCT_ErrorLogger        (lines 13-42)        — async, console + chat broadcast, numbered errors
├── PCT_WIM (private class)(lines 49-278)       — World-icon manager (singleton)
├── PCT_UI                 (lines 285-1390)     — UI primitive wrapper namespace
│   ├── ROOT, UINode, UIElement
│   ├── Container, Text, Button, Image
│   ├── BUTTON_HANDLERS / BUTTON_COOLDOWNS maps
│   └── OnButtonClick      — central click dispatcher
└── PCT                    (lines 1397-8130)    — main toolkit
    ├── Enums + Types      (1402-1683)
    ├── Private state      (1689-1711)
    ├── V3, Vector helpers (1728-1819)
    ├── Public API         (Initialize, IsPlayerDirector)
    ├── CreateConfig + SpawnDirectorControlRoom (1859-2673)
    ├── Player class       (2679-3101)        — registry, soldier-state probes, equipment, aim raycast
    ├── InitializeDirectorChecks               — main per-tick director input loop
    ├── PlayerTracking ns                      — target cycling, follow-pos calc
    ├── Math helpers       (Yaw/Pitch/Lerp/Clamp/Bezier)
    ├── Path ns + helpers                       — point CRUD, smoothing
    ├── FreeCamCollision ns                     — raycast-driven wall correction
    ├── Camera Initialization (StartCamera dispatcher)
    ├── StartFreeCamera     — ~880 LOC, the most complex loop
    ├── StartPathCamera     — dolly-along-curve loop
    ├── StartPlayerPresetCamera — sprint look-ahead, smoothed offset
    ├── VFX ns              — weighted-random spawn loop
    ├── UI helpers (FormatMessageForValue, Sync* functions)
    ├── DirectorCodeEntryUI ns
    ├── DirectorMenuUI ns
    ├── TargetSelectionUI ns
    ├── PathCameraSetupUI ns
    ├── PlayerPresetCameraUI ns
    └── PCT Event Handlers (PCTOn*) — public bridge functions
```

### 3.1 Three-Namespace Decomposition

PCT is structured around the rule "outer wrappers depend only on inner ones":

```
PCT_ErrorLogger  ←  PCT_UI  ←  PCT
                       ↑          ↑
                   PCT_WIM ───────┘
```

`PCT_UI` is intentionally generic and could ship standalone — it has no awareness of cameras, directors, or the toolkit at large.

---

## 4. Function & Class Map

### 4.1 PCT_ErrorLogger

| Member | Role |
|---|---|
| [`New(caller, message, errorNumber)`](../reference_implementations/reference_nodone_cinematic_camera/main_module.ts#L14) | Pulls a stack trace via `new Error().stack`, prints a delimited error block to console, and shows a `mod.DisplayHighlightedWorldLogMessage("PCT_ERROR_OCCURED", n)` 10 times at 0.5s intervals. The repeated broadcast is intentional — it makes errors hard to miss in playtests. |

### 4.2 PCT_WIM (World Icon Manager)

A private singleton that owns a `Map<id, mod.WorldIcon>` and a parallel `Map<id, WorldIconState>` mirror so mutations can re-apply state cheaply.

| Method | Notes |
|---|---|
| `init()` | Lazy singleton getter. |
| `createIcon(id, position, options?)` | If id exists → `deleteIcon` first, then `mod.SpawnObject(rtc.WorldIcon, ...)` and applies all options. Tracks color, text, image, owner (team or player). |
| `setPosition / setText / setIcon / setColor` | Mutates and re-applies via `mod.SetWorldIcon*`. |
| `setTextVisible / setIconVisible / setVisible` | Toggles via `mod.EnableWorldIcon{Image,Text}`. |
| `setTeamReceiver / setPlayerReceiver` | Calls `mod.SetWorldIconOwner` (mutually exclusive). |
| `deleteIcon(id)` | `mod.UnspawnObject` + map cleanup. |
| `getIconExists(id)` | Cheap presence check used to avoid double-creating path-point icons. |

This pattern is the workaround for `mod.AddUIIcon` not rendering — every "world icon" in PCT is a spawned `WorldIcon` clone.

### 4.3 PCT_UI

Generic UI scene-graph wrapper over Portal's `mod.AddUI*` primitives.

| Member | Role |
|---|---|
| `COLORS` | Pre-built `mod.Vector` constants for BLACK/GREY/WHITE/RED/GREEN/BLUE/YELLOW. |
| `Type` enum | Root / Container / Text / Button / Image / Unknown — used for runtime type narrowing in `mountChild`. |
| `BaseParams`, `TextParams`, `ButtonParams`, `ImageParams`, `ContainerParams` | Discriminated-union param types so `Container({ childrenParams: [...] })` is fully type-safe. |
| `BUTTON_HANDLERS`, `BUTTON_COOLDOWNS`, `BUTTON_DISABLE_ON_CLICK` | Module-scope maps keyed by `mod.GetUIWidgetName(widget)`. |
| `createUniqueName` | Names every widget `parent_rXX_segment_N`, where `XX = mod.GetObjId(receiver)`. |
| `UINode`, `UIElement`, `Container`, `Text`, `Button`, `Image` | Class hierarchy. `UIElement` exposes get/set + chainable `setX(...)` for visibility, position, size, anchor, padding, depth, bg color/alpha/fill — all mapped to `mod.GetUIWidget*` / `mod.SetUIWidget*` calls. |
| `Container` | Optionally builds a thin "outline" sibling (a second `OutlineThin`-fill container) that mirrors the parent's geometry, for free outlined panels. `childrenParams` lets you build whole trees declaratively. |
| `Button` | A frame container + a child button widget + an optional `Text` label, all created in one constructor. Also wires the `onClick` handler into `BUTTON_HANDLERS`. |
| `OnButtonClick(player, widget, event)` | Looks up the handler by widget name; if `disabledOnClick` is true, locks the `pid_widgetname` key in `BUTTON_COOLDOWNS` for 200 ms after firing. |

Note: every UI factory accepts an optional `receiver?: mod.Player | mod.Team` arg, and the constructors pass it down so widgets are created with `mod.AddUIContainer(..., receiver)` overloads — yielding **per-PID UI** out of the box. This matches our project's [feedback_per_pid_ui_rule.md](../../../../.claude/projects/c--Users-Soldat-TypeScriptProjects-twlmain/memory/feedback_per_pid_ui_rule.md).

### 4.4 PCT — Core State

Module-level mutable state lives at [main_module.ts:1689-1711](../reference_implementations/reference_nodone_cinematic_camera/main_module.ts#L1689):

| Variable | Purpose |
|---|---|
| `_fixedCameraId`, `_directorPasscode`, `_config` | Initialization-frozen constants. |
| `_cameraObject: mod.FixedCamera`, `_cameraObjectInitialPos: V3` | The Godot-defined cinematic camera object PCT moves around. |
| `_directorControlRoomSpawnPos: V3`, `_directorControlRoomSpawnedObjects[]` | The hidden room used to park the director's body. |
| `_cameraState`, `_pathState`, `_vfxState` | Three state objects mutated every tick. |
| `_directorInteractPoint`, `_freeCamInteractPoint` | The two world-anchored InteractPoints. (Per-director `pathCameraInteractPoint` lives in `Player.directorState`.) |
| `_trackedCamSettingsInfo`, `_trackedPathPointsInfo` | Dashboard data the UI rows display. |

### 4.5 PCT — Player Class

Located at [main_module.ts:2679](../reference_implementations/reference_nodone_cinematic_camera/main_module.ts#L2679). A static-only registry class keyed by `mod.GetObjId(player)`.

Key methods:

- **Identity / lifecycle**: `Get`, `GetOrCreate`, `GetById`, `RemoveById`, `GetId`. The cached `playerObject` is rebound on each `Get*` call because Portal `mod.Player` references can become stale across event boundaries.
- **Director assignment**: `AssignAsDirector` / `UnassignAsDirector` — the only place `assignedDirectorPlayerId` is written. Sets `IncomingDamageFactor` to 0 / 100.
- **Soldier state probes**: `IsAlive`, `IsDead`, `IsManDown`, `IsDeployed`, `IsInWater`, `IsInVehicle`, `IsCrouching`, `IsSprinting`, `IsProne`, `IsFiring`, `IsAiming`, `IsJumping`, `IsInteracting` — each guarded by `IsPlayerValid` + `IsDeployed`. Ultimately wraps `mod.GetSoldierState(player, mod.SoldierStateBool.*)`.
- **State vectors**: `GetPosition`, `GetEyePosition`, `GetFacingDirection`, `GetLinearVelocity` — wraps `mod.GetSoldierState(..., mod.SoldierStateVector.*)`.
- **Equipment**: `RemoveAllEquipment`, `GivePistolSecondary`, `GivePortalGadget`, `RemovePortalGadget` (uses `mod.AddEquipment / RemoveEquipment / ForceSwitchInventory`).
- **`GetAimedPathPoint(player, maxAngleDeg=4, maxDistance=200)`** — the icon-aim hit-test. For each path point, computes the angle between `eyePos→point` and `facing`; picks the highest-dot, then nearest. This is **not** a raycast; it's a cone-narrow "what am I looking at" scan, used to color icons under the crosshair and select them.

### 4.6 PCT — Director Loop

`InitializeDirectorChecks(dirPlayer)` at [main_module.ts:3103](../reference_implementations/reference_nodone_cinematic_camera/main_module.ts#L3103) is the per-director input poll loop, running `await mod.Wait(DT)` (0.033s) until the director leaves or stops being director.

It tracks rising-edge transitions of `isJumping`, `isFiring`, `isCrouching`, `isAiming`, `isProne` against `directorState.actionState`, then dispatches per camera type:

- **Free Cam**: jump → `PlayerTracking.InitNextTarget` (cycles target).
- **Path Cam**:
  - `aim` toggle → flips a `pointCreationDistanceIncreasing` direction; while held, ramps `pointCreationDistance` ±1m/tick clamped to [1, 100], and plays a UI capturing tick sound (`mod.PlaySound(SFX_..._SimpleLoop2D)`).
  - `crouch + fire` → adds a new path point at `eyePos + facing × creationDistance`, or selects/deletes/moves an existing one based on the aimed icon's `selectionType`.
  - `prone + fire` → `StartCamera(dir, points)` to launch the dolly.

### 4.7 PCT — Camera Type Loops

Three async generators, each exits when `_cameraState.isRunning === false`:

#### 4.7.1 `StartPathCamera(dirPlayer, points)` — [main_module.ts:5320](../reference_implementations/reference_nodone_cinematic_camera/main_module.ts#L5320)

1. `BuildSmoothedCameraPath(points)` — for each interior point, samples a quadratic Bézier of `samplesPerCorner=40` between trimmed `prev→curr→next` to round corners (corner radius caps at `_pathState.cornerRadius`, default 80 with input range 0–100).
2. Pre-computes `segmentLengths[]` and `cumulativeDistances[]`.
3. Sets `mod.EnableAllInputRestrictions(dir, true)` then re-enables Interact only.
4. Per tick: advances `traveled += speed × DT`, finds segment, lerps position, picks a "look-ahead" segment `lookAheadDistance` further along, and uses **either the tracked player position or that look-ahead point** as the camera's aim point. Smooths yaw/pitch with `LerpAngleRad(prev, target, 0.15)`.
5. `FinalizeLoopedCameraMove` — at end of curve, restarts the path if `isRunning` still true (loop), or restores `mod.Cameras.FirstPerson` and re-spawns the path control menu.

#### 4.7.2 `StartFreeCamera(dirPlayer)` — [main_module.ts:4428](../reference_implementations/reference_nodone_cinematic_camera/main_module.ts#L4428)

The longest function in the file (~880 lines). Pipeline per tick:

1. **Track or free?** `_cameraState.freeCamIsTracking` toggles based on whether the director's soldier has horizontal velocity. Movement disengages tracking, jumping cycles target.
2. **Target switch transition**: if you cycle to a target >100m away, runs a 3-phase Phase machine: ZoomOut (spike up by `targetSwitchZoomOutHeight=100`), then ZoomIn (descend to follow position), with arrival-distance + arrival-angle thresholds.
3. **Free-move**: WSAD direction read from `playerLinearVelocity`, decomposed against the player's flat facing into forward/strafe amounts, lerped, and used to translate `camPos`.
4. **Tracking**: `PlayerTracking.GetPositionWithSmoothedY` (Y is lerped to dampen terrain jitter). Yaw/Pitch lerped via `LerpAngleRad` with smoothing 0.12.
5. **Focus mode** — if recently engaged (`freeCamIsFocusing` / `freeCamIsInFocus`), pulls the camera into a tight 3m / 0.9m offset, with WSAD generating shoulder lateral offset.
6. **Wall correction** — every 5 ticks, requests `mod.RayCast(dir, rayStart, desiredCamPos)`; the Portal engine fires `OnRayCastHit` / `OnRayCastMissed`, which `FreeCamCollision` records into a per-PID state. The next tick, `CorrectPosition` clamps `camPos` to `hitPoint + normal × 0.35m`. Misses require 3 in a row before clearing the hit (anti-flicker).
7. **Apply** — `SetCameraTransform(_cameraObject, finalPos, pitch, yaw)`.

Restrictions: `mod.EnableInputRestriction` is used to suppress `Prone, CycleFire, CyclePrimary, Reload, Select{Melee/Throwable/Secondary/Primary/OpenGadget/CharacterGadget}, FireWeapon` so the director's body, parked in the control room, cannot trigger weapon SFX or animations.

#### 4.7.3 `StartPlayerPresetCamera(dirPlayer)` — [main_module.ts:5547](../reference_implementations/reference_nodone_cinematic_camera/main_module.ts#L5547)

Tracks the **director themself** with one of 46 hand-tuned presets. Each preset is `{offset: V3, hOffset, vOffset, pitchOffset}` — offset is local-space (right/up/forward), then rotated into world space using the player's flat facing as the forward basis vector. Sprint adds a `sprintLookAhead` lerp of up to 1.2m forward. `mod.EnableInputRestriction(dir, RestrictedInputs.CameraPitch, true)` locks pitch input so the preset's pitch isn't fought.

Preset cycling is hooked to **firing the Portal Gadget** (`PCTOnPortalGadgetFireStart` calls `AdjustCameraPreset(1)`), with the Portal Laser toggle (default T key) used to show/hide the preset UI.

### 4.8 PCT — Path Helpers

Located at [main_module.ts:3713](../reference_implementations/reference_nodone_cinematic_camera/main_module.ts#L3713). Bundle of CRUD functions on `_pathState.points`:

| Function | Notes |
|---|---|
| `AddPoint(dir, pos, iconName)` | Pushes a `PathPoint` with random `uniqueId`, recomputes `orderId`s. |
| `CreatePointIcon(pos)` | Spawns a fresh icon and refreshes labels of all existing points. |
| `ResetPointsOrderIds()` | Re-numbers icons (`PCT_{}` text). |
| `SelectPoint(point)` | Locks state, spawns two satellite "Move" / "Delete" sub-icons above/below the parent. |
| `RemovePoint(dir, uniqueId)` | Deletes icon, splices, re-orders. |
| `MovePoint(dir, {object | uniqueId})` | Async loop that moves the point to wherever the director is aiming each tick, until `_pathState.isMoving` flips off. Spawns a `FX_Gadget_DeployableMortar_Target_Area` continuous VFX at the point ground level for visual feedback. |
| `CalculateLength(points)` | Sum of XZ distances; powers the "Total Path Length" UI row. |

### 4.9 PCT — VFX Namespace

[main_module.ts:5687](../reference_implementations/reference_nodone_cinematic_camera/main_module.ts#L5687).

- `LoopSpawnAroundCamera` — every `vfxConfig.checkInterval` (0.25s), if camera moved more than `minMoveDistance` and `Math.random() < spawnChance`, picks a weighted-random VFX from `_vfxState.inventory`, and spawns it inside a 180° cone in front of the camera at a distance between the entry's `minDistance / maxDistance`.
- `Spawn(vfx, pos, enabled, params?)` — either continuous (lives until manually unspawned) or fire-and-forget with a duration; cleans up via `mod.EnableVFX(false)` then `mod.UnspawnObject` after a 2s grace.
- The vfx Y is forced to the closest path point's `playerPosY` so explosions don't spawn in mid-air.
- Inventory contains 11 weighted entries: C4, ArtilleryStrike, MBTLAW Hit, SUV explosion, Smoke Cluster, etc.

### 4.10 PCT — UI Namespaces

Five UI modules, each `Init / Show / Hide / Refresh / Destroy`:

| Namespace | What it owns |
|---|---|
| **DirectorCodeEntryUI** | The 3×3+1 numeric keypad; on full-passcode entry calls `Player.AssignAsDirector` and `DirectorMenuUI.Init`. |
| **DirectorMenuUI** | Three big buttons: Free Camera / Path Camera / Player Preset Camera — each sets `_cameraState.type`, destroys the other modes' UI, and calls `StartCamera`. |
| **TargetSelectionUI** | Bottom-center HUD strip while in Free Cam: shows the tracked player's name, K/D, position in cycle (`i/N`), and the SPACE-to-cycle hint. |
| **PathCameraSetupUI** | Two left-side panels: "PATH POINTS" (status, distance, count, total length) and "CAMERA & PATH SETTINGS" (8 rows: speed, pitch, corner radius, look-ahead, target type, target, vfx %, with `<` `>` selector buttons + a STOP button). Plus the 700×80 top-center control notice and a "Move Point" tip popup. |
| **PlayerPresetCameraUI** | Single-row "Active Preset" panel + the Portal Gadget reminder notice. |

The "selector button" pattern (`PCT_<` / `PCT_>` adjusting a value by step within `[min,max]`) is reused across both control menus via `AdjustTrackedCamSettingsValue(id, delta)` which switches on the row id and assigns the right state field. Cornerradius changes set `_cameraState.reset = true` so `FinalizeLoopedCameraMove` rebuilds the smoothed path.

### 4.11 PCT — Public Event Bridge

The 11 functions at [main_module.ts:7885-8129](../reference_implementations/reference_nodone_cinematic_camera/main_module.ts#L7885) — these are what the host script forwards Portal events to:

| `PCT.*` function | Forwarded from | What it does |
|---|---|---|
| `Initialize(fixedCameraId, passcode, defaultConfig?)` | `OnGameModeStarted` | Builds config, gets `mod.GetFixedCamera`, spawns the director InteractPoint at the camera's initial position, spawns the control room, builds tracked-info schemas. |
| `IsPlayerDirector(player)` | (utility for host filters) | Lookup. |
| `PCTOnPlayerDeployed(player)` | `OnPlayerDeployed` | If the deployed player is the director, re-anchors the director InteractPoint at their eye position. If they're director and Free Cam is active, teleports them back to the control room after 0.1s. |
| `OnPlayerUndeploy(player)` | `OnPlayerUndeploy` | Currently a no-op (commented `RemoveUIIcon` for the bugged nametag system). |
| `PCTOnPlayerInteract(player, ip)` | `OnPlayerInteract` | Routes by InteractPoint ID: director IP → keypad or menu; per-director path cam IP → toggles control menu visibility; free-cam IP → kills director (which restarts them in the control room). |
| `PCTOnPlayerLeaveGame(pid)` | `OnPlayerLeaveGame` | Tears down all UI for that pid; if they were director: stops camera, unspawns all three IPs, deletes the panel icon, **respawns the original director IP** at `_cameraObjectInitialPos`, then `Player.UnassignAsDirector` + `RemoveById`. |
| `PCTOnPlayerUIButtonEvent(player, w, e)` | `OnPlayerUIButtonEvent` | Forwards to `PCT_UI.OnButtonClick`. |
| `PCTOnRayCastHit/Missed` | `OnRayCastHit/Missed` | Feeds `FreeCamCollision`. |
| `PCTOnPortalGadgetFireStart/Stop` | gadget fire events | Records action state, and in PlayerPreset mode cycles preset on fire-start. |
| `PCTOnPortalGadgetLaserToggle(p, state)` | laser toggle | Shows/hides the PlayerPreset control menu. |
| `PCTOnPortalGadgetAimStart/Stop` | (defined but README says "not yet utilized") | Stores aim flag. |

---

## 5. mod.* API Surface (Catalog)

The script is small in surface area considering its ambition. Grouped by domain:

### 5.1 Camera & Transform
- `mod.GetFixedCamera(id)` — resolve the Godot-placed cinematic camera.
- `mod.SetCameraTypeForPlayer(player, mod.Cameras.Fixed | FirstPerson, [cameraId])` — attach a player's view to / detach from a fixed camera.
- `mod.SetObjectTransform(obj, mod.CreateTransform(pos, rot))` — re-pose the FixedCamera every tick. **Single most important call in the whole toolkit.**
- `mod.GetObjectPosition(obj)` / `mod.GetObjectRotation(obj)` — read current camera state.
- `mod.CreateTransform(pos, rot)`, `mod.CreateVector(x, y, z)` — vector/transform constructors.
- `mod.XComponentOf / YComponentOf / ZComponentOf` — vector destructuring.
- `mod.Cameras.Fixed`, `mod.Cameras.FirstPerson` — enum.

### 5.2 World Objects
- `mod.SpawnObject(rtc, pos, rot[, scale])` — spawns from `mod.RuntimeSpawn_Common` enum. Used for: InteractPoint, WorldIcon, FiringRange_Wall_2048_01, FiringRange_Floor_A, FiringRange_Ceiling_02, ~11 different VFX types, two SFX loop sounds.
- `mod.UnspawnObject(obj)` — cleanup.
- `mod.RuntimeSpawn_Common` enum — sources every spawnable.
- `mod.SpatialObject`, `mod.FixedCamera`, `mod.InteractPoint`, `mod.WorldIcon`, `mod.VFX`, `mod.SFX` — typedef cast targets.

### 5.3 World Icons
- `mod.SetWorldIconPosition / Text / Image / Color / Owner`, `mod.EnableWorldIconText / Image`, `mod.WorldIconImages.SquadPing | FilledPing | Triangle`.

### 5.4 VFX/SFX
- `mod.EnableVFX(vfx, bool)` — turns the spawned effect on/off.
- `mod.MoveVFX(vfx, pos, rot)` — move active VFX. Used on the move-point feedback effect.
- `mod.PlaySound(sfx, volume, player)`, `mod.StopSound(sfx)` — for the path-distance ramp ticks.

### 5.5 Player State
- `mod.IsPlayerValid(player)` — guards every accessor.
- `mod.GetSoldierState(player, mod.SoldierStateBool.*)` — IsAlive, IsDead, IsManDown, IsInWater, IsCrouching, IsSprinting, IsProne, IsFiring, IsZooming, IsJumping, IsInteracting, IsAISoldier.
- `mod.GetSoldierState(player, mod.SoldierStateVector.*)` — GetPosition, EyePosition, GetFacingDirection, GetLinearVelocity.
- `mod.GetPlayerVehicleSeat(player)` — for "in vehicle" check.
- `mod.GetVehicleFromPlayer / GetVehicleState(v, VehicleStateVector.*)` — referenced but commented out (vehicle tracking is currently disabled).
- `mod.GetPlayerKills / GetPlayerDeaths` — for the target-selection K/D readout.
- `mod.GetTeam(player)` — referenced (commented).
- `mod.GetObjId(playerOrObj)` — used everywhere as the canonical key.
- `mod.AllPlayers()` + `mod.CountOf(arr)` + `mod.ValueInArray(arr, i)` — Portal-array iteration pattern.
- `mod.Equals(a, b)` — Portal-object equality.

### 5.6 Player Control
- `mod.SetPlayerIncomingDamageFactor(player, factor)` — director invulnerability.
- `mod.Teleport(player, pos, yaw)` — body parking + WaterCheck recovery.
- `mod.Kill(player)` — exit-free-cam path (kills director so they respawn out of control room).
- `mod.UndeployPlayer(player)` — referenced once (commented out).
- `mod.EnableInputRestriction(player, mod.RestrictedInputs.X, bool)`, `mod.EnableAllInputRestrictions(player, bool)` — gate gamepad/KBM inputs. Restrictions touched: Prone, CameraPitch, CycleFire, CyclePrimary, Reload, Select{Melee, Throwable, Secondary, Primary, OpenGadget, CharacterGadget}, FireWeapon, Interact.

### 5.7 Equipment
- `mod.AddEquipment(player, item, slot)`, `mod.RemoveEquipment(player, slot|item)`, `mod.ForceSwitchInventory(player, slot)`, `mod.SetInventoryMagazineAmmo(player, slot, n)`.
- `mod.InventorySlots.*`, `mod.Weapons.Sidearm_ES_57`, `mod.Gadgets.Misc_PortalGadget`.

### 5.8 Raycasting (the only "real" collision query)
- `mod.RayCast(player, startVec, endVec)` — fire-and-forget; result delivered via `OnRayCastHit(player, point, normal)` / `OnRayCastMissed(player)` events that the host script forwards to `PCTOnRayCast*`.

### 5.9 UI Primitives (wrapped by PCT_UI)
Add: `mod.AddUIContainer / Text / Button / Image` (with optional receiver overload).
Get: `mod.GetUIRoot`, `mod.FindUIWidgetWithName(name)`, `mod.GetUIWidgetName(w)`.
Mutate widget: `mod.SetUIWidget{Visible, Position, Size, Anchor, Padding, Depth, BgColor, BgAlpha, BgFill}` + corresponding Get*.
Mutate text: `mod.SetUITextLabel / Anchor / Color / Alpha`.
Mutate button: `mod.SetUIButton{Enabled, AlphaBase, AlphaDisabled, AlphaFocused, AlphaHover, AlphaPressed, ColorBase, ColorDisabled, ColorFocused, ColorHover, ColorPressed}`.
Mutate image: `mod.SetUIImageType / Color / Alpha`.
Lifecycle: `mod.DeleteUIWidget(w)`, `mod.EnableUIInputMode(bool, player)` — toggles the cursor for the keypad / menu.
Enums: `mod.UIAnchor`, `mod.UIBgFill`, `mod.UIDepth`, `mod.UIImageType`, `mod.UIButtonEvent`.

### 5.10 Messaging
- `mod.Message(key, ...args)` — every visible string goes through the strings.json keys (`PCT_*`).
- `mod.DisplayHighlightedWorldLogMessage(msg)` — used by the error logger and director assignment notifications.

### 5.11 Time
- `mod.Wait(seconds)` — only async pacing primitive. `DT = 0.033`, `SD = 0.1` (settle delay).

### 5.12 Known Bugs Acknowledged in Comments
- `mod.AddUIIcon` — explicitly commented as bugged; PCT instead spawns `WorldIcon` clones via `PCT_WIM`. Matches our project memory.

**The toolkit explicitly avoids**: any team/scoreboard manipulation, vehicle spawning, gadget call-ins, captured-zone logic, scoring, dialog/prompt overlays, server-state APIs. PCT is purely a **camera + UI + soldier-state-input layer**.

---

## 6. Patterns & Methods

### 6.1 Camera-as-Owned-FixedCamera

The toolkit's central trick: there is exactly one `mod.FixedCamera` object, placed in Godot, with its objId injected at init. Every camera mode is a tight `while (...) { await mod.Wait(DT); ... mod.SetObjectTransform(cam, ...); }` loop that re-poses that single object. `mod.SetCameraTypeForPlayer(dir, mod.Cameras.Fixed, fixedCameraId)` just attaches the director's POV to it.

This works because `mod.Wait(DT)` lets the engine render between updates; the camera appears smooth at 30Hz. It has obvious cost — the loop blocks on awaits at every tick — but it's the only option Portal exposes for cinematic camera motion.

### 6.2 Director Body Parking (Free Cam)

The director's player-character is never spectator-mode'd. Instead PCT:
1. Spawns a tiny invisible "control room" — 4 walls + floor + ceiling — at `_cameraObjectInitialPos.y - 50`.
2. `mod.Teleport`s the director's body inside.
3. Disables almost every input restriction (so weapon fire, prone, slot changes don't escape the room).
4. Switches camera to Fixed, disconnecting visual from body.
5. On exit, `mod.Kill(dir)` — the death+respawn naturally pops the director back to a spawn point and PCT's `OnPlayerDeployed` re-pins the director InteractPoint at their new eye position.

Water check fallback: if the room spawned in water (boundary maps), `Player.IsInWater` → re-spawn the room at `+300m altitude` instead.

### 6.3 Action-State Rising-Edge Detection

`PlayerActionStateBool` mirrors `mod.SoldierStateBool` for crouching/firing/aiming/prone/jumping/interacting/etc. The director loop reads the live state with `Player.IsX(player)` and compares against `directorState.actionState.isX` — events fire only on the rising edge. Falling edge resets the flag at the bottom of the loop. This is the standard "edge-trigger from polling" pattern, applied because Portal does not offer reliable per-tick input events.

### 6.4 Quadratic-Bezier Path Smoothing

`BuildSmoothedCameraPath` ([main_module.ts:4005](../reference_implementations/reference_nodone_cinematic_camera/main_module.ts#L4005)): for each interior point `curr`:
- `curveStart = GetPointTowards(curr, prev, min(cornerRadius, distPrev*0.35))`
- `curveEnd = GetPointTowards(curr, next, min(cornerRadius, distNext*0.35))`
- Sample `samplesPerCorner=40` points of `Bezier(curveStart, curr, curveEnd, t)`.

The result is then iterated with arc-length parameterization (`cumulativeDistances[]`) so `traveled += speed × DT` produces uniform motion regardless of corner density.

### 6.5 Look-Ahead Aim

The Path Cam computes a `lookAhead = traveled + lookAheadDistance` distance, advances along the cumulative-distance array to find what segment that lands on, and aims the camera there. Combined with the Yaw/Pitch lerp smoothing (0.15), this produces an anticipatory drone-like feel — the camera turns into corners before reaching them.

### 6.6 Per-Player Raycast State Machine

`FreeCamCollision` ([main_module.ts:4174](../reference_implementations/reference_nodone_cinematic_camera/main_module.ts#L4174)) keeps a `Map<pid, RayState>` because Portal's raycast is async (request/response via separate event). The 3-miss threshold before clearing prevents single-frame misses from popping the camera out of correction. Throttled to every 5 ticks (~166ms).

### 6.7 Per-PID UI With Receiver Threading

Every UI factory takes a `receiver?: mod.Player | mod.Team`; it's threaded through `createUniqueName(parent, receiver, name, fallback) → "{parent}_{rXX}_{seg}_{N}"`. Each director has their own widget tree, named uniquely, lookupable by name via `mod.FindUIWidgetWithName`. This dovetails with our project's per-PID UI rule.

### 6.8 Handler-Map Button Dispatch

Buttons don't store closures — they store `widgetName` strings. `BUTTON_HANDLERS: Map<string, fn>` lives at module scope. `PCT_UI.OnButtonClick` looks up the handler by `mod.GetUIWidgetName(widget)`. Per-(pid, widget) cooldowns prevent double-fire from rapid clicks.

### 6.9 "Sync + Render" UI Pattern

`SyncTrackedCamSettingsInfo()` and `SyncTrackedPathPointsInfo()` copy live state into the dashboard data structs, then `Refresh*Menu()` walks each row and only calls `setMessage` when `lastRenderedValue !== nextValue`. This is a primitive but effective dirty-check that avoids the per-frame Message-allocation cost.

### 6.10 Single-Director Invariant

`Player.assignedDirectorPlayerId: number | null` — exactly one nullable static field. `AssignAsDirector` errors if non-null, `UnassignAsDirector` clears it, `PCTOnPlayerLeaveGame` defensively re-spawns the director InteractPoint and clears the slot. This makes "is there a director?" a single-ID equality check.

### 6.11 String-Centric UI

All visible strings are mod.Message keys looked up against `main_strings_module.json`. Even single literals (`"<"`, `">"`, `"{}"`, digits) are keys. This avoids the "unknown string" failure mode in our [feedback_mod_message_strings.md](../../../../.claude/projects/c--Users-Soldat-TypeScriptProjects-twlmain/memory/feedback_mod_message_strings.md). Numeric formatting is centralized in `FormatMessageForValue` — picks the right localization key based on row id substring (`Deg`, `PERCENT`, `Meters`, `status`, `TargetType`).

### 6.12 Defensive `mod.IsPlayerValid` Everywhere

Almost every public-edge accessor begins with `if (!mod.IsPlayerValid(player)) return ...`. This is necessary because `mod.Player` references can survive disconnects but throw when used. The Player class' `Get`/`GetOrCreate` pattern of "rebind the cached `playerObject` to the latest passed-in reference" is the recommended defense.

---

## 7. Integration Model

PCT is designed as a **drop-in module that extends the host script's exported event hooks** — not as a replacement for them. The README's Required Event Hook Mapping is the contract:

```
OnGameModeStarted        → PCT.Initialize(fixedCameraId, passcode)
OnPlayerDeployed         → PCT.PCTOnPlayerDeployed(player)
OnPlayerInteract         → PCT.PCTOnPlayerInteract(player, ip)
OnPlayerLeaveGame        → PCT.PCTOnPlayerLeaveGame(pid)
OnPlayerUIButtonEvent    → PCT.PCTOnPlayerUIButtonEvent(player, w, e)
OnRayCastHit/Missed      → PCT.PCTOnRayCastHit/Missed(...)
OnPortalGadgetFireStart  → PCT.PCTOnPortalGadgetFireStart(player) [if IsPlayerDirector]
```

Two integration patterns:

- **Standalone**: PCT is the only logic; the host script is just the 11 hook-forwarding stubs.
- **Drop-in**: existing experience keeps its logic; PCT calls go at the **top** of each hook, then the host's own filters/conditions afterward. The README is firm that gating PCT calls behind your conditions (e.g. spectator filters) breaks director state tracking.

The `PCT.IsPlayerDirector(player)` predicate is the host script's escape hatch — once your logic detects the director, you typically `return` early so PCT has exclusive control.

### Initialization Requirements
- Place a **Fixed Camera** in Godot; its objId is what you pass to `PCT.Initialize`.
- That camera's Godot position becomes the spawn point of the director InteractPoint, **and** the anchor for the auto-spawned hidden control room (room is `pos.y - 50` by default, `pos.y + 300` if water-fallback fires).
- Strings file must be merged.

### Failure Modes Documented
- Director InteractPoint never appears → likely Initialize never ran or the FixedCamera id is wrong.
- Buttons do nothing → `OnPlayerUIButtonEvent` not forwarded.
- Camera doesn't move → raycast hooks not connected, director not assigned, or path has < 2 points.
- New director can't be assigned after old one left → `OnPlayerLeaveGame` not forwarded (the director slot stays held).

---

## 8. What's Worth Lifting (Notes for Conquest)

This is reference, not a copy-paste plan, but the parts that could inform our work:

- **`PCT_UI` namespace** — this is a clean, standalone scene-graph wrapper that solves the per-PID widget-naming problem. Our [feedback_per_pid_ui_rule.md](../../../../.claude/projects/c--Users-Soldat-TypeScriptProjects-twlmain/memory/feedback_per_pid_ui_rule.md) rule and our existing UI system likely already handle this, but the `Container({ childrenParams: [...] })` declarative tree pattern is cleaner than imperative AddUIContainer chains.
- **`PCT_WIM` World Icon Manager** — directly addresses our [feedback_adduiicon_broken.md](../../../../.claude/projects/c--Users-Soldat-TypeScriptProjects-twlmain/memory/feedback_adduiicon_broken.md). Its Map-based singleton + state-mirror pattern is sound.
- **`mod.SetCameraTypeForPlayer(p, Fixed, fixedCameraId)` + `SetObjectTransform` per tick** — the only known way to do cinematic camera motion in Portal. If we ever want match intros, victory pans, or capture-point fly-throughs, this is the recipe.
- **Director body parking via hidden room + `mod.Teleport` + Free Cam input restrictions** — useful template for any "spectator" / "admin overhead view" mode without leaving the player class system.
- **3-miss raycast hysteresis** — generally useful for any system where we ask Portal questions through the request/response event split.
- **Action-state rising-edge detection** off `mod.SoldierStateBool` — already a standard pattern in our codebase.
- **The 46-preset list** — even just as a reference catalog of "good camera offsets for tracking a player from third-person", this is empirically tuned data we'd otherwise have to re-derive.

What we should **not** lift:
- The single-director state model (we have multiple roles already; this would conflict with admin/team systems).
- The "block all weapon inputs while in a hidden room" approach is heavyweight; if Conquest ever wanted spectator, a mode restriction would be simpler.
- The `mod.Kill(dir)` exit pathway — fine for a toolkit, surprising in our match flow.
- Hardcoded fixed-camera dependency (Conquest doesn't have a Godot-placed cinematic camera per map).

---

## 9. Open Questions / Caveats

- **Performance under load.** The `StartFreeCamera` loop runs ~30 times/sec and does heavy math + occasional `mod.RayCast`. Single director = fine; multiple concurrent directors would multiply cost. PCT enforces single-director, which sidesteps this.
- **`mod.Wait(DT)` timing accuracy.** PCT comments TICK_SECONDS at 33ms, but the actual scheduling drift on a busy server is unknown. The look-ahead and arc-length scheme is robust to slow ticks (uses `traveled += speed × DT`), so motion stays correct even if frame intervals vary.
- **Path point world icons disappearing.** No code I saw forces re-spawn of icons on round restart / map rotation. PCT seems to assume one continuous game-mode session.
- **Vehicle-tracking is commented out.** The `GetTargetPosition` and `GetFacingDirection` in `PlayerTracking` have commented-out blocks for `mod.GetVehicleState`. If we wanted to track vehicles for Conquest match cameras, that's the seam — but the original author chose not to ship it, possibly because vehicle state vectors don't map cleanly to a "head pos / facing" model.
- **No persistence of paths.** Paths live in memory only; round restarts wipe `_pathState.points`.

---

*Generated from a read-through of [main_module.ts](../reference_implementations/reference_nodone_cinematic_camera/main_module.ts) (8,130 LOC), [README.md](../reference_implementations/reference_nodone_cinematic_camera/README.md), and [main_strings_module.json](../reference_implementations/reference_nodone_cinematic_camera/main_strings_module.json) on 2026-05-08.*
