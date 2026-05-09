// @ts-nocheck
// Module: spectator/spectator-action -- Ship 2 single-spectator-slot integration (Mitigation C).
//
// Wires the COACH button on both the Player Ready Panel + the admin's full ready dialog to a
// real claim path:
//   1. Mark the spectator pid in State.players.spectatorPid (single slot, claim-only).
//   2. Set them ready (mirror of handleReadyDialogReadyButtonClick state path).
//   3. Attach the Godot Fixed camera authored at MapConfig.spectatorCameraId.
//   4. Broadcast COACH-button refresh to every viewer's panel + every visible dialog.
//   5. Auto-start the match if the remaining active players are all ready.
//
// Mitigation C — body stays put. The spectator was already deployed when they clicked COACH
// (triple-tap on the panel is gated on isPlayerDeployed; pre-live boundary keeps players at
// their HQ trigger pre-match). We do NOT undeploy / redeploy -- we just swap the camera, which
// works on a deployed player (the "deployed" side of the I-4 finding succeeds). Combat HUD
// PERSISTS so the spectator can watch the match unfold (tickets, flags, capture progress).
//
// Lifecycle cleanup: onSpectatorPlayerLeave (disconnect), onSpectatorMatchEnd (round end),
// onSpectatorFreshSetup (admin reset). All three are idempotent + null-safe.
//
// Camera-API note: mod.Cameras.Fixed is enum value 1 in SDK 1.2.3 but missing from the
// project's vendored bf6-portal-mod-types. Same (mod.Cameras as any).Fixed cast as the
// foundation/gameplay.ts:204 VehicleList.AH6M precedent.
const SPECTATOR_CAMERAS_FIXED = (mod.Cameras as any).Fixed as mod.Cameras;

// Inputs locked while spectating. Ship 3 (free-camera): keep weapon/slot inputs restricted
// so the soldier body parked in the hide room cannot trigger weapon SFX or slot animations,
// but RELEASE movement (MoveForwardBack, MoveLeftRight, Sprint), vertical (Jump, Crouch),
// and look (CameraPitch, CameraYaw -- never locked) so they drive the free-camera loop.
// Ship 4 (exit): RELEASE Interact so the existing InteractMultiClickDetector triple-tap can
// detect the spectator's exit input cleanly. The hide-room cube has no InteractPoints in
// range (5mm interior at Y=-500), so releasing Interact has no spurious-trigger risk.
// Mirrors PCT's StartFreeCamera input-restriction set per spec_cam_functionality.md §4.7.2
// ("EnableInputRestriction is used to suppress Prone, CycleFire, CyclePrimary, Reload,
// Select{Melee,Throwable,Secondary,Primary,OpenGadget,CharacterGadget}, FireWeapon").
const SPECTATOR_LOCKED_INPUTS: mod.RestrictedInputs[] = [
    mod.RestrictedInputs.Prone,
    mod.RestrictedInputs.FireWeapon,
    mod.RestrictedInputs.Reload,
    mod.RestrictedInputs.Zoom,
    mod.RestrictedInputs.CycleFire,
    mod.RestrictedInputs.CyclePrimary,
    mod.RestrictedInputs.SelectCharacterGadget,
    mod.RestrictedInputs.SelectOpenGadget,
    mod.RestrictedInputs.SelectMelee,
    mod.RestrictedInputs.SelectPrimary,
    mod.RestrictedInputs.SelectSecondary,
    mod.RestrictedInputs.SelectThrowable,
];

// Apply or release the spectator-input lock for a player. Idempotent at the engine level
// (re-locking an already-locked input is a no-op). try/catch wraps every call so a single
// engine-side rejection on one input type doesn't block the rest.
function applySpectatorInputLock(player: mod.Player, locked: boolean): void {
    if (!isValidPlayer(player)) return;
    for (let i = 0; i < SPECTATOR_LOCKED_INPUTS.length; i++) {
        try { mod.EnableInputRestriction(player, SPECTATOR_LOCKED_INPUTS[i], locked); } catch {}
    }
}

// Body-hide via PCT-pattern sealed mini-room. Methodology mirrored from
// reference_implementations/reference_nodone_cinematic_camera/main_module.ts:2486
// (`SpawnDirectorControlRoom`); per AGENTS.md non-copy policy the implementation below is
// original. The mesh-derived magic numbers (size, wallHeight, wallFaceOffsetX/Z, wallOverlap,
// floor/ceiling local bounds) describe physical properties of the FiringRange_Wall_2048_01
// / FiringRange_Floor_A / FiringRange_Ceiling_02 spatial assets and are re-used as facts.
//
// Layout: tiny sealed cube pinned to absolute Y = -500, X/Z taken from the spec camera so
// the room is far from spawn areas. 500 units below sea level is well underground for every
// authored Conquest map and 500 units ABOVE the destroyed-vehicle sink layer (Y = -1000 in
// vehicles/vanilla-spawner.ts:100), so geometry cannot clash with sunk wrecks. PCT's
// camera-relative -50 offset (which assumed ground-level cinematic cameras) doesn't apply
// here since several Conquest spec cameras are authored high in the sky (e.g. Firestorm
// 667 at Y≈246), where -50 would still land in playable airspace and block aircraft.
// 4 walls + 1 floor + 1 ceiling fully contain the spectator's body. PCT's 5mm interior is
// preserved -- the body sits at the center, fully sealed.
const SPECTATOR_HIDE_ROOM_ABSOLUTE_Y = -500;           // absolute world Y; below all terrain, above the -1000 vehicle sink layer
const SPECTATOR_HIDE_ROOM_INTERIOR_SIZE = 0.005;       // 5mm cube interior
const SPECTATOR_HIDE_ROOM_WALL_HEIGHT = 6.4;           // FiringRange_Wall_2048_01 mesh height
const SPECTATOR_HIDE_ROOM_WALL_FACE_OFFSET_X = 0.94;   // half-offset from wall pivot to its facing edge along X
const SPECTATOR_HIDE_ROOM_WALL_FACE_OFFSET_Z = 0.3;    // half-offset from wall pivot to its facing edge along Z
const SPECTATOR_HIDE_ROOM_WALL_OVERLAP = 0.5;          // extra extension at corners so walls seal flush
// FiringRange_Floor_A mesh local bounds (mesh-coordinate space):
const SPECTATOR_HIDE_ROOM_FLOOR_MIN_X = 0.0;
const SPECTATOR_HIDE_ROOM_FLOOR_MAX_X = 5.0;
const SPECTATOR_HIDE_ROOM_FLOOR_MAX_Y = 0.0;
const SPECTATOR_HIDE_ROOM_FLOOR_MIN_Z = -3.56;
const SPECTATOR_HIDE_ROOM_FLOOR_MAX_Z = 0.0;
// FiringRange_Ceiling_02 mesh local bounds:
const SPECTATOR_HIDE_ROOM_CEIL_MIN_X = -0.01;
const SPECTATOR_HIDE_ROOM_CEIL_MAX_X = 18.01;
const SPECTATOR_HIDE_ROOM_CEIL_MIN_Y = -0.01;
const SPECTATOR_HIDE_ROOM_CEIL_MIN_Z = -0.01;
const SPECTATOR_HIDE_ROOM_CEIL_MAX_Z = 10.25;

// Module-local state. Single-spectator-slot, so module-local is sufficient (no per-pid
// indexing needed). The handles array is the deallocation source of truth -- empty array
// means no room currently spawned, populated array means a room exists and needs cleanup.
let _spectatorHideRoomObjects: mod.SpatialObject[] = [];
let _spectatorHideRoomCenter: { x: number; y: number; z: number } | null = null;

// Spawn the sealed mini-room at absolute Y = -500, X/Z taken from the spec camera.
// Idempotent: returns true without re-spawning if the room is already up. Returns false
// on missing camera config or engine-side failure (caller should treat false as "no hide
// available, body stays at HQ").
function spawnSpectatorHideRoom(): boolean {
    if (_spectatorHideRoomObjects.length > 0) return true;
    const camId = ACTIVE_MAP_CONFIG?.spectatorCameraId;
    if (camId === undefined) return false;

    // mod.GetFixedCamera is present in SDK 1.2.3 but missing from the project's vendored
    // bf6-portal-mod-types package. Same gap as the (mod.Cameras as any).Fixed cast above;
    // resolved with the same `(mod as any)` pattern. Engine accepts the call at runtime.
    let cx: number, cz: number;
    try {
        const camera = (mod as any).GetFixedCamera(camId);
        const camPos = mod.GetObjectPosition(camera);
        cx = mod.XComponentOf(camPos);
        cz = mod.ZComponentOf(camPos);
    } catch (e) {
        try { console.log(`[spectator] hide-room cam pos resolve threw: ${String(e)}`); } catch {}
        return false;
    }

    const center = { x: cx, y: SPECTATOR_HIDE_ROOM_ABSOLUTE_Y, z: cz };
    _spectatorHideRoomCenter = center;

    const halfInterior = SPECTATOR_HIDE_ROOM_INTERIOR_SIZE / 2;
    const coverSize = Math.max(
        SPECTATOR_HIDE_ROOM_INTERIOR_SIZE + SPECTATOR_HIDE_ROOM_WALL_FACE_OFFSET_X * 2,
        SPECTATOR_HIDE_ROOM_INTERIOR_SIZE + SPECTATOR_HIDE_ROOM_WALL_FACE_OFFSET_Z * 2,
    );
    const floorScale = Math.max(
        coverSize / (SPECTATOR_HIDE_ROOM_FLOOR_MAX_X - SPECTATOR_HIDE_ROOM_FLOOR_MIN_X),
        coverSize / (SPECTATOR_HIDE_ROOM_FLOOR_MAX_Z - SPECTATOR_HIDE_ROOM_FLOOR_MIN_Z),
    );
    const ceilingScale = Math.max(
        coverSize / (SPECTATOR_HIDE_ROOM_CEIL_MAX_X - SPECTATOR_HIDE_ROOM_CEIL_MIN_X),
        coverSize / (SPECTATOR_HIDE_ROOM_CEIL_MAX_Z - SPECTATOR_HIDE_ROOM_CEIL_MIN_Z),
    );
    const floorCenterLocalX = (SPECTATOR_HIDE_ROOM_FLOOR_MIN_X + SPECTATOR_HIDE_ROOM_FLOOR_MAX_X) / 2;
    const floorCenterLocalZ = (SPECTATOR_HIDE_ROOM_FLOOR_MIN_Z + SPECTATOR_HIDE_ROOM_FLOOR_MAX_Z) / 2;
    const ceilingCenterLocalX = (SPECTATOR_HIDE_ROOM_CEIL_MIN_X + SPECTATOR_HIDE_ROOM_CEIL_MAX_X) / 2;
    const ceilingCenterLocalZ = (SPECTATOR_HIDE_ROOM_CEIL_MIN_Z + SPECTATOR_HIDE_ROOM_CEIL_MAX_Z) / 2;

    const leftX = center.x - halfInterior;
    const rightX = center.x + halfInterior;
    const frontZ = center.z + halfInterior;
    const backZ = center.z - halfInterior;
    const wallY = center.y;

    const wallSpecs: { x: number; y: number; z: number; ry: number }[] = [
        { x: leftX - SPECTATOR_HIDE_ROOM_WALL_OVERLAP, y: wallY, z: frontZ + SPECTATOR_HIDE_ROOM_WALL_FACE_OFFSET_Z, ry: 0 },
        { x: rightX + SPECTATOR_HIDE_ROOM_WALL_OVERLAP, y: wallY, z: backZ - SPECTATOR_HIDE_ROOM_WALL_FACE_OFFSET_Z, ry: Math.PI },
        { x: leftX - SPECTATOR_HIDE_ROOM_WALL_FACE_OFFSET_X, y: wallY, z: frontZ + SPECTATOR_HIDE_ROOM_WALL_OVERLAP, ry: Math.PI / 2 },
        { x: rightX + SPECTATOR_HIDE_ROOM_WALL_FACE_OFFSET_X, y: wallY, z: backZ - SPECTATOR_HIDE_ROOM_WALL_OVERLAP, ry: -Math.PI / 2 },
    ];

    const spawned: mod.SpatialObject[] = [];
    try {
        for (let i = 0; i < wallSpecs.length; i++) {
            const w = wallSpecs[i];
            const wall = mod.SpawnObject(
                mod.RuntimeSpawn_Common.FiringRange_Wall_2048_01,
                mod.CreateVector(w.x, w.y, w.z),
                mod.CreateVector(0, w.ry, 0),
            );
            spawned.push(wall);
        }
        const floor = mod.SpawnObject(
            mod.RuntimeSpawn_Common.FiringRange_Floor_A,
            mod.CreateVector(
                center.x - floorCenterLocalX * floorScale,
                center.y - SPECTATOR_HIDE_ROOM_FLOOR_MAX_Y * floorScale,
                center.z - floorCenterLocalZ * floorScale,
            ),
            mod.CreateVector(0, 0, 0),
            mod.CreateVector(floorScale, floorScale, floorScale),
        );
        spawned.push(floor);
        const ceilingScaleY = ceilingScale + 1;
        const ceiling = mod.SpawnObject(
            mod.RuntimeSpawn_Common.FiringRange_Ceiling_02,
            mod.CreateVector(
                center.x - ceilingCenterLocalX * ceilingScale,
                center.y - SPECTATOR_HIDE_ROOM_CEIL_MIN_Y * ceilingScaleY + SPECTATOR_HIDE_ROOM_WALL_HEIGHT,
                center.z - ceilingCenterLocalZ * ceilingScale,
            ),
            mod.CreateVector(0, 0, 0),
            mod.CreateVector(ceilingScale, ceilingScaleY, ceilingScale),
        );
        spawned.push(ceiling);
    } catch (e) {
        try { console.log(`[spectator] hide-room spawn threw: ${String(e)}`); } catch {}
        // Best-effort partial cleanup: any spawned objects so far must be unspawned to avoid
        // leaking spatial handles. Failing to unspawn here would leave geometry dangling.
        for (let i = 0; i < spawned.length; i++) {
            try { mod.UnspawnObject(spawned[i]); } catch {}
        }
        _spectatorHideRoomCenter = null;
        return false;
    }

    _spectatorHideRoomObjects = spawned;
    return true;
}

// Despawn all tracked hide-room spatial handles and clear the center cache. Idempotent --
// no-op when no room is up. Called from every spectator deallocator path.
function despawnSpectatorHideRoom(): void {
    if (_spectatorHideRoomObjects.length === 0) return;
    for (let i = 0; i < _spectatorHideRoomObjects.length; i++) {
        try { mod.UnspawnObject(_spectatorHideRoomObjects[i]); } catch {}
    }
    _spectatorHideRoomObjects = [];
    _spectatorHideRoomCenter = null;
}

// Teleport the spectator's body into the room center. No-op when no room is spawned.
// Yaw 0 -- the body's facing direction is irrelevant since their view is the Fixed camera.
function teleportSpectatorIntoHideRoom(player: mod.Player): void {
    if (!_spectatorHideRoomCenter) return;
    if (!isValidPlayer(player)) return;
    const c = _spectatorHideRoomCenter;
    try {
        mod.Teleport(player, mod.CreateVector(c.x, c.y, c.z), 0);
    } catch (e) {
        try { console.log(`[spectator] hide-room teleport threw: ${String(e)}`); } catch {}
    }
}

// Free-camera control loop (Ship 3). PCT-pattern -- per spec_cam_functionality.md §6.1
// ("Camera-as-Owned-FixedCamera"), animate the same Godot-placed FixedCamera via per-tick
// mod.SetObjectTransform writes while the spectator drives the camera with WASD + look +
// Jump/Crouch (vertical) + Sprint (speed). PCT's StartFreeCamera (~880 LOC at
// reference_implementations/reference_nodone_cinematic_camera/main_module.ts:4428) is the
// methodology reference; the implementation below is original (per AGENTS.md non-copy
// policy). Empirically-tuned smoothing/clamp/sprint constants from PCT are reused as facts
// about good camera feel.
//
// Single-spectator-slot scope means a module-local token + State.players.spectatorPid
// pid-equality check is sufficient for cancellation -- no per-pid record needed.
const SPECTATOR_FREE_CAM_TICK_SECONDS = 0.033;          // ~30 Hz, matches PCT DT
const SPECTATOR_FREE_CAM_FORWARD_GAIN = 10.0;           // multiplier on velocity-decomposed forward delta
const SPECTATOR_FREE_CAM_STRAFE_GAIN = 10.0;            // multiplier on velocity-decomposed strafe delta
const SPECTATOR_FREE_CAM_VERTICAL_SPEED = 20.0;         // units/sec when Jump/Crouch held
const SPECTATOR_FREE_CAM_SPRINT_MULTIPLIER = 3.5;       // applied when IsSprinting (10.0 base * 3.5 = 35 sprint)
const SPECTATOR_FREE_CAM_FORWARD_SMOOTHING = 0.12;      // PCT freeMoveForwardSmoothing
const SPECTATOR_FREE_CAM_STRAFE_SMOOTHING = 0.12;       // PCT freeMoveStrafeSmoothing
const SPECTATOR_FREE_CAM_VERTICAL_SMOOTHING = 0.18;     // matches rotation-feel; vertical input is binary so a stiffer smoothing keeps it from drifting
const SPECTATOR_FREE_CAM_ROTATION_SMOOTHING = 0.18;     // PCT freeMoveRotationSmoothing
const SPECTATOR_FREE_CAM_PITCH_LIMIT_RAD = 89 * (Math.PI / 180); // PCT cachedMinPitch/MaxPitch

// Bumped on every loop start; the running loop tail-checks this against its captured token
// so a stale loop from a prior claim cannot keep running after release.
let _spectatorFreeCameraLoopToken: number = 0;

function spectatorFreeCamLerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

// Lerps yaw across the [-π, π] wrap point. Mirrors PCT's LerpAngleRad shape.
function spectatorFreeCamLerpAngle(a: number, b: number, t: number): number {
    let delta = b - a;
    while (delta > Math.PI) delta -= 2 * Math.PI;
    while (delta < -Math.PI) delta += 2 * Math.PI;
    return a + delta * t;
}

function spectatorFreeCamClamp(v: number, lo: number, hi: number): number {
    if (v < lo) return lo;
    if (v > hi) return hi;
    return v;
}

// Top-level free-camera loop. Runs at ~30 Hz while the spectator slot is held. Bails on
// any of: token-bump (slot release path), spectator pid mismatch (defensive), invalid
// player handle (disconnect mid-tick).
async function runSpectatorFreeCameraLoop(eventPlayer: mod.Player, pid: number, token: number): Promise<void> {
    const camId = ACTIVE_MAP_CONFIG?.spectatorCameraId;
    if (camId === undefined) return;
    // mod.FixedCamera type is missing from the vendored bf6-portal-mod-types (same gap as
    // (mod as any).GetFixedCamera). Use `any` for the camera handle to bypass the typecheck
    // -- engine accepts the call at runtime.
    let camera: any;
    try {
        camera = (mod as any).GetFixedCamera(camId);
    } catch (e) {
        try { console.log(`[spectator] free-cam GetFixedCamera threw for cam=${camId}: ${String(e)}`); } catch {}
        return;
    }

    // Seed initial pose from the current camera position so the spectator starts on the
    // authored vantage instead of (0,0,0). Yaw/pitch are seeded from the player's first
    // valid facing read inside the loop.
    let camX = mod.XComponentOf(mod.GetObjectPosition(camera));
    let camY = mod.YComponentOf(mod.GetObjectPosition(camera));
    let camZ = mod.ZComponentOf(mod.GetObjectPosition(camera));
    let smoothedYaw: number | null = null;
    let smoothedPitch: number | null = null;
    let smoothedForward = 0;
    let smoothedStrafe = 0;
    let smoothedVertical = 0;

    while (true) {
        await mod.Wait(SPECTATOR_FREE_CAM_TICK_SECONDS);

        // Loop-end gates. Token bump terminates this loop within one tick of any cleanup
        // hook firing (slot release / match-end / fresh-setup). Pid mismatch is a belt-
        // and-braces second guard.
        if (_spectatorFreeCameraLoopToken !== token) return;
        if (State.players.spectatorPid !== pid) return;
        if (!isValidPlayer(eventPlayer)) return;
        if (!isPlayerDeployed(eventPlayer)) continue; // re-deploy churn; OnPlayerDeployed hook handles re-attach

        // Read input vectors. Velocity is the player's WSAD as engine-resolved linear
        // velocity (their body moves inside the sealed hide room; we read what the
        // engine computes for that motion). Facing is mouse-look direction.
        const velocity = safeGetSoldierStateVector(eventPlayer, mod.SoldierStateVector.GetLinearVelocity);
        const facing = safeGetSoldierStateVector(eventPlayer, mod.SoldierStateVector.GetFacingDirection);
        if (!velocity || !facing) continue;

        // Decompose velocity onto flat-facing (forward) and flat-right (strafe). Y is
        // ignored from velocity because vertical comes from explicit Jump/Crouch reads.
        const facingX = mod.XComponentOf(facing);
        const facingZ = mod.ZComponentOf(facing);
        const flatLen = Math.sqrt(facingX * facingX + facingZ * facingZ);
        if (flatLen <= 0.0001) continue; // degenerate facing (looking straight up/down); skip this tick
        const fwdX = facingX / flatLen;
        const fwdZ = facingZ / flatLen;
        // flatRight = cross(fwd, up) where up=(0,1,0). With up.y=1, cross simplifies to (fwd.z, 0, -fwd.x).
        const rightX = fwdZ;
        const rightZ = -fwdX;
        const velX = mod.XComponentOf(velocity);
        const velZ = mod.ZComponentOf(velocity);
        const targetForward = velX * fwdX + velZ * fwdZ;
        const targetStrafe = velX * rightX + velZ * rightZ;

        // Vertical input from Jump (+Y) and Crouch (-Y). Both bools are ORed against
        // each other for the rare case the player presses both -- result is 0.
        const isJumping = safeGetSoldierStateBool(eventPlayer, mod.SoldierStateBool.IsJumping, false);
        const isCrouching = safeGetSoldierStateBool(eventPlayer, mod.SoldierStateBool.IsCrouching, false);
        const targetVertical = (isJumping ? SPECTATOR_FREE_CAM_VERTICAL_SPEED : 0) + (isCrouching ? -SPECTATOR_FREE_CAM_VERTICAL_SPEED : 0);

        // Smooth all three axes.
        smoothedForward = spectatorFreeCamLerp(smoothedForward, targetForward, SPECTATOR_FREE_CAM_FORWARD_SMOOTHING);
        smoothedStrafe = spectatorFreeCamLerp(smoothedStrafe, targetStrafe, SPECTATOR_FREE_CAM_STRAFE_SMOOTHING);
        smoothedVertical = spectatorFreeCamLerp(smoothedVertical, targetVertical, SPECTATOR_FREE_CAM_VERTICAL_SMOOTHING);

        // Sprint multiplies horizontal speed only (vertical is intentionally constant so
        // it matches the player's mental model of holding Jump = constant rise rate).
        const isSprinting = safeGetSoldierStateBool(eventPlayer, mod.SoldierStateBool.IsSprinting, false);
        const horizSpeed = isSprinting ? SPECTATOR_FREE_CAM_SPRINT_MULTIPLIER : 1.0;

        // Apply position deltas. dt is the tick interval -- velocity is units/sec, so
        // dt-scaling produces proper units regardless of tick rate variance.
        const dt = SPECTATOR_FREE_CAM_TICK_SECONDS;
        const fwdDelta = smoothedForward * SPECTATOR_FREE_CAM_FORWARD_GAIN * horizSpeed * dt;
        const strafeDelta = smoothedStrafe * SPECTATOR_FREE_CAM_STRAFE_GAIN * horizSpeed * dt;
        camX += fwdDelta * fwdX + strafeDelta * rightX;
        camZ += fwdDelta * fwdZ + strafeDelta * rightZ;
        camY += smoothedVertical * dt;

        // Compute target yaw/pitch from facing. Pitch is negated so that mouse-up tilts the
        // camera up and mouse-down tilts it down (the engine's SetObjectTransform pitch
        // convention is inverted relative to asin(facing.y)).
        const targetYaw = Math.atan2(facingX, facingZ);
        const targetPitch = spectatorFreeCamClamp(
            -Math.asin(spectatorFreeCamClamp(mod.YComponentOf(facing), -1, 1)),
            -SPECTATOR_FREE_CAM_PITCH_LIMIT_RAD,
            SPECTATOR_FREE_CAM_PITCH_LIMIT_RAD,
        );

        // Smooth rotation. lerpAngle handles the [-π, π] wrap for yaw.
        smoothedYaw = smoothedYaw === null ? targetYaw : spectatorFreeCamLerpAngle(smoothedYaw, targetYaw, SPECTATOR_FREE_CAM_ROTATION_SMOOTHING);
        smoothedPitch = smoothedPitch === null ? targetPitch : spectatorFreeCamLerp(smoothedPitch, targetPitch, SPECTATOR_FREE_CAM_ROTATION_SMOOTHING);

        // Apply the new transform to the camera object. Pitch/Yaw/Roll convention:
        // mod.CreateVector(pitch, yaw, 0) per PCT's SetCameraTransform shape. If the
        // engine wants a different convention we'll see it as wrong-axis rotation in SP
        // smoke and swap.
        try {
            mod.SetObjectTransform(
                camera,
                mod.CreateTransform(
                    mod.CreateVector(camX, camY, camZ),
                    mod.CreateVector(smoothedPitch, smoothedYaw, 0),
                ),
            );
        } catch (e) {
            try { console.log(`[spectator] free-cam transform write threw for pid=${pid}: ${String(e)}`); } catch {}
            return;
        }
    }
}

// Returns true when the active map authored a spectator FixedCamera ObjId. Used by the
// COACH-button sync (panel + dialog) to gate the enable state. Maps without the field
// retain the original Wave 4 D3 disabled-grey treatment (graceful degradation).
function isSpectatorAvailableForActiveMap(): boolean {
    return ACTIVE_MAP_CONFIG?.spectatorCameraId !== undefined;
}

// True iff this pid currently owns the single spectator slot.
function isSpectator(pid: number): boolean {
    return State.players.spectatorPid === pid;
}

// Slot-occupancy accessor for cross-module reads (boundary skip, syncCoachButtonForPid).
function getSpectatorPid(): number | null {
    return State.players.spectatorPid;
}

// Attach the Godot Fixed camera to a (deployed) spectator. No-ops if the player is not
// deployed -- the camera attach only takes effect on a deployed player per the v1.476 I-4
// finding. The defensive OnPlayerDeployed hook re-runs this on any subsequent deploy event
// so a respawn-while-spectating recovers cleanly. Wrapped in try/catch so an engine-side
// throw (invalid cam id, etc.) is logged via console.log without crashing the click chain.
function attachSpectatorCameraIfDeployed(eventPlayer: mod.Player, pid: number): void {
    if (!isPlayerDeployed(eventPlayer)) return;
    const camId = ACTIVE_MAP_CONFIG?.spectatorCameraId;
    if (camId === undefined) return;
    try {
        mod.SetCameraTypeForPlayer(eventPlayer, SPECTATOR_CAMERAS_FIXED, camId);
    } catch (e) {
        try { console.log(`[spectator] camera attach threw for pid=${pid} cam=${camId}: ${String(e)}`); } catch {}
    }
}

// Top-level claim handler invoked from both click routers (panel + admin dialog) after they
// close their respective UI surface + restore cursor. Order matters: state writes first so
// the broadcast refresh sees the new slot owner; camera attach next so the spectator's view
// swaps before the broadcast latency window; world-log + broadcast + auto-start last.
//
// Re-claim with the same pid is a no-op (defensive against a double-click race past the
// debounce window). Pre-LIVE entry attaches at HQ (the original Mitigation C path); LIVE
// entry attaches mid-match -- the player gets ejected from any vehicle they're in (so the
// vehicle isn't stranded) before the hide-room teleport. Spawn-charge on the post-exit
// redeploy follows CF-117 -- exiting spectator during LIVE costs 1 ticket on the next
// deploy, treated as a normal alive-on-foot deploy charge.
function enterSpectatorMode(eventPlayer: mod.Player, pid: number): void {
    if (!isSpectatorAvailableForActiveMap()) return;
    const current = State.players.spectatorPid;
    if (current !== null && current !== pid) return; // slot taken by another pid

    State.players.spectatorPid = pid;
    State.players.readyByPid[pid] = true;
    delete State.players.readyNeedsReconfirmByPid[pid];
    markHudDirty();

    attachSpectatorCameraIfDeployed(eventPlayer, pid);
    applySpectatorInputLock(eventPlayer, true);
    // Eject from any vehicle BEFORE teleporting the body into the hide-room. Without this,
    // a mid-LIVE click while the player is in a tank/heli would teleport the soldier into
    // the underground cube but leave the vehicle stranded mid-map (or worse, drag the
    // vehicle to Y=-500). ForcePlayerExitVehicle is a no-op when the player is on foot.
    try {
        if (safeGetSoldierStateBool(eventPlayer, mod.SoldierStateBool.IsInVehicle, false)) {
            mod.ForcePlayerExitVehicle(eventPlayer);
        }
    } catch (e) {
        try { console.log(`[spectator] vehicle-eject threw for pid=${pid}: ${String(e)}`); } catch {}
    }
    if (spawnSpectatorHideRoom()) {
        teleportSpectatorIntoHideRoom(eventPlayer);
    }
    // Start the free-cam control loop. Token bump first so any prior loop bails on its
    // next tick (defense against a fast re-claim race).
    _spectatorFreeCameraLoopToken += 1;
    void runSpectatorFreeCameraLoop(eventPlayer, pid, _spectatorFreeCameraLoopToken);

    sendHighlightedWorldLogMessage(
        mod.Message(STR_PLAYER_SPECTATING, eventPlayer),
        true,
        undefined,
        STR_PLAYER_SPECTATING
    );
    // Self-confirmation surface: the world-log broadcast above covers other players, but
    // per AGENTS.md memory the world log is transient + the Fixed-camera HUD layer may
    // suppress it for the spectator. DisplayNotificationMessage targets a single player
    // and is on a different rendering surface, so the spectator gets a reliable claim
    // confirmation regardless of whether the world-log line reaches their view.
    try { mod.DisplayNotificationMessage(mod.Message(STR_PLAYER_SPECTATING, eventPlayer), eventPlayer); } catch {}

    refreshAllVisiblePlayerReadyPanels();
    renderReadyDialogForAllVisibleViewers();
    updatePlayersReadyHudTextForAllPlayers();
    // Hide the vehicle deploy timer HUD on this tick rather than waiting for the next
    // passive refresh. The render plan's signature includes spectator state so the diff
    // cache will invalidate; this just triggers the apply.
    try { updateVehicleDeployTimerHudForPlayer(eventPlayer); } catch {}
    // Immediate help/ready strip refresh -- without this, the yellow help text waits for
    // the next HUD render tick to disappear (visible flicker on claim).
    try { updateHelpTextVisibilityForPid(pid); } catch {}

    tryAutoStartMatchIfAllReady(eventPlayer);
}

// User-driven exit (Ship 4). Called from ongoingPlayerImpl when the spectator triple-taps
// interact (the same pattern the pre-game ready-up flow uses; the InteractMultiClickDetector
// state-bool poll is agnostic to EnableInputRestriction, but Ship 4 also released Interact
// from SPECTATOR_LOCKED_INPUTS so the bool transitions cleanly).
//
// Order: cancel loop -> despawn geometry -> release input lock -> restore camera -> clear
// slot -> UndeployPlayer (back to deploy screen) -> world-log + self-confirm -> refresh.
// Idempotent via the slot-equality guard at top.
function exitSpectatorMode(eventPlayer: mod.Player, pid: number): void {
    if (State.players.spectatorPid !== pid) return;

    _spectatorFreeCameraLoopToken += 1;
    despawnSpectatorHideRoom();
    applySpectatorInputLock(eventPlayer, false);
    try {
        mod.SetCameraTypeForPlayer(eventPlayer, mod.Cameras.FirstPerson);
    } catch (e) {
        try { console.log(`[spectator] exit camera reset threw for pid=${pid}: ${String(e)}`); } catch {}
    }

    State.players.spectatorPid = null;
    markHudDirty();

    // Send the body back to the deploy screen so they re-enter the match on foot. They
    // are still flagged ready (readyByPid[pid] === true from the original claim); leave
    // that intact -- they remain a participant, just no longer the spectator slot owner.
    try { mod.UndeployPlayer(eventPlayer); } catch (e) {
        try { console.log(`[spectator] exit UndeployPlayer threw for pid=${pid}: ${String(e)}`); } catch {}
    }

    sendHighlightedWorldLogMessage(
        mod.Message(STR_PLAYER_STOPPED_SPECTATING, eventPlayer),
        true,
        undefined,
        STR_PLAYER_STOPPED_SPECTATING
    );
    try { mod.DisplayNotificationMessage(mod.Message(STR_PLAYER_STOPPED_SPECTATING, eventPlayer), eventPlayer); } catch {}

    refreshAllVisiblePlayerReadyPanels();
    renderReadyDialogForAllVisibleViewers();
    updatePlayersReadyHudTextForAllPlayers();
    // Re-show the vehicle deploy timer HUD on this tick. The render plan's signature now
    // sees isSpectator===false; this just triggers the apply.
    try { updateVehicleDeployTimerHudForPlayer(eventPlayer); } catch {}
    // Immediate help/ready strip refresh -- the spec-pid gate cleared, but readyByPid
    // stays true on exit so the strip will likely remain hidden either way. This call
    // ensures the row's visibility lands on the same tick as the slot transition.
    try { updateHelpTextVisibilityForPid(pid); } catch {}
}

// Disconnect cleanup. Called from onPlayerLeaveGameImpl. Clears the slot if pid matches,
// despawns the hide room, and broadcasts a refresh so other viewers' COACH buttons
// re-enable. Idempotent: safe to call when the leaver is not the current spectator.
function onSpectatorPlayerLeave(pid: number): void {
    if (State.players.spectatorPid !== pid) return;
    State.players.spectatorPid = null;
    _spectatorFreeCameraLoopToken += 1; // cancel free-cam loop within one tick
    despawnSpectatorHideRoom();
    markHudDirty();
    // The leave path already triggers panel + dialog refreshes downstream; we only need
    // to ensure those see the cleared slot. The State write above is sufficient.
}

// Match-end cleanup. Called from endMatch (conquest-flow.ts). Clears the slot + despawns
// the hide room + releases the input lock + restores the spectator's camera type so the
// victory dialog renders correctly on a normal first-person backdrop with control.
// Order: state-clear, then room despawn (geometry first), then input release, then camera
// reset. The body is teleported back to a normal spawn by the engine on the next deploy
// or victory-screen transition; we don't need to teleport explicitly here.
function onSpectatorMatchEnd(): void {
    const pid = State.players.spectatorPid;
    if (pid === null) return;
    State.players.spectatorPid = null;
    _spectatorFreeCameraLoopToken += 1; // cancel free-cam loop within one tick
    despawnSpectatorHideRoom();
    markHudDirty();
    const player = safeFindPlayer(pid);
    if (!player) return;
    applySpectatorInputLock(player, false);
    try {
        mod.SetCameraTypeForPlayer(player, mod.Cameras.FirstPerson);
    } catch (e) {
        try { console.log(`[spectator] match-end camera reset threw for pid=${pid}: ${String(e)}`); } catch {}
    }
}

// Fresh-setup cleanup. Called from triggerFreshMatchSetup (conquest-flow.ts). Clears the
// slot + despawns the hide room + defensively releases the input lock (in case match-end
// was bypassed and we reached fresh-setup with the spectator still locked). Camera reset
// is not needed here because match-end already cleared it; fresh setup is a no-live-yet
// state.
function onSpectatorFreshSetup(): void {
    const pid = State.players.spectatorPid;
    if (pid === null) return;
    State.players.spectatorPid = null;
    _spectatorFreeCameraLoopToken += 1; // cancel free-cam loop within one tick
    despawnSpectatorHideRoom();
    markHudDirty();
    const player = safeFindPlayer(pid);
    if (player) applySpectatorInputLock(player, false);
}
