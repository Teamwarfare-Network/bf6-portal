// @ts-nocheck
// Module: vehicles — Portal array helpers, vehicle ownership, registration, spawner, kills sync

//#region -------------------- Portal Array Helpers (engine arrays) --------------------

function arrayContainsVehicle(arr: any, vehicle: mod.Vehicle): boolean {
    // CQ_Bug_42 port (v1.073): mod.GetVariable(regVehiclesTeam1/2) can return a non-array
    // during transient registry state at game start, firing "Received undefined values"
    // engine errors inside modlib.IsTrueForAny -> mod.CountOf. Guard at the helper level.
    if (!arr) return false;
    return modlib.IsTrueForAny(arr, (el: any) => mod.Equals(el, vehicle));
}

function arrayRemoveVehicle(arr: any, vehicle: mod.Vehicle): any {
    // CQ_Bug_42 port (v1.073): see arrayContainsVehicle. Conservative fallback returns
    // an empty array so the caller's SetVariable still receives a valid value.
    if (!arr) return mod.EmptyArray();
    return modlib.FilteredArray(arr, (el: any) => mod.NotEqualTo(el, vehicle));
}

//#endregion ----------------- Portal Array Helpers (engine arrays) --------------------



//#region -------------------- Vehicle Ownership Tracking (vehIds/vehOwners) --------------------
// Vehicle owner cache lifecycle:
// - setLastDriver on entry, popLastDriver on destruction, clearLastDriverByVehicleObjId on spawn/respawn.

function getVehicleId(v: mod.Vehicle): number { return getObjId(v); }

function getLastDriver(vehicle: mod.Vehicle): mod.Player | undefined {
    const vid = getVehicleId(vehicle);
    // Linear scan of the cached vehicle-id list to find its last known driver.
    for (let i = 0; i < vehIds.length; i++) {
        // Parallel arrays: vehIds[i] maps to vehOwners[i].
        if (vehIds[i] === vid) return vehOwners[i];
    }
    // No cached entry found.
    return undefined;
}

function setLastDriver(vehicle: mod.Vehicle, player: mod.Player): void {
    if (!player || !mod.IsPlayerValid(player)) return;
    const vid = getVehicleId(vehicle);
    // Update existing entry if this vehicle is already tracked.
    for (let i = 0; i < vehIds.length; i++) {
        if (vehIds[i] === vid) {
            vehOwners[i] = player;
            return;
        }
    }
    // First time we see this vehicle: append to the parallel arrays.
    vehIds.push(vid);
    vehOwners.push(player);
}

function popLastDriver(vehicle: mod.Vehicle): mod.Player | undefined {
    const vid = getVehicleId(vehicle);

    for (let i = 0; i < vehIds.length; i++) {
        // Find the vehicle entry, return its owner, then remove it from the cache.
        if (vehIds[i] === vid) {
            const owner = vehOwners[i];

            // Swap-remove to avoid shifting the arrays.
            const lastIdx = vehIds.length - 1;
            vehIds[i] = vehIds[lastIdx];
            vehOwners[i] = vehOwners[lastIdx];
            vehIds.pop();
            vehOwners.pop();

            // Return the removed owner (caller may use for messaging).
            return owner;
        }
    }
    // No cached entry found.
    return undefined;
}

function clearLastDriverByVehicleObjId(vehicleObjId: number): void {
    // Remove the last-driver entry for a specific vehicle ObjId (if it exists).
    for (let i = 0; i < vehIds.length; i++) {
        // Find the matching vehicle id in the parallel arrays.
        if (vehIds[i] === vehicleObjId) {
            // Swap-remove to keep arrays compact without preserving order.
            const lastIdx = vehIds.length - 1;
            vehIds[i] = vehIds[lastIdx];
            vehOwners[i] = vehOwners[lastIdx];
            vehIds.pop();
            vehOwners.pop();
            // Done: there is no longer a cached owner for this vehicle.
            return;
        }
    }
}

//#endregion ----------------- Vehicle Ownership Tracking (vehIds/vehOwners) --------------------



//#region -------------------- Vehicle Registration (team arrays) --------------------

// Registers vehicle ownership to a team for kill attribution.
// IMPORTANT:
// - Vehicle ID and owning team must stay in sync
// - Reassignments must overwrite previous ownership

function registerVehicleToTeam(vehicle: mod.Vehicle, teamNum: TeamID): void {
    // Ensure the vehicle exists in exactly one registry by removing it from both first.
    mod.SetVariable(regVehiclesTeam1, arrayRemoveVehicle(mod.GetVariable(regVehiclesTeam1), vehicle));
    mod.SetVariable(regVehiclesTeam2, arrayRemoveVehicle(mod.GetVariable(regVehiclesTeam2), vehicle));

    // Append the vehicle to the chosen team's registry array. mod.AppendToArray(undefined, x)
    // can fire "Received undefined values" engine errors during transient registry state
    // (CQ_Bug_42 family). Coerce to empty array before append.
    if (teamNum === TeamID.Team1) {
        const cur = mod.GetVariable(regVehiclesTeam1) ?? mod.EmptyArray();
        mod.SetVariable(regVehiclesTeam1, mod.AppendToArray(cur, vehicle));
    } else if (teamNum === TeamID.Team2) {
        const cur = mod.GetVariable(regVehiclesTeam2) ?? mod.EmptyArray();
        mod.SetVariable(regVehiclesTeam2, mod.AppendToArray(cur, vehicle));
    }
}

function clearSpawnBaseTeamCache(): void {
    for (const k in vehicleSpawnBaseTeamByObjId) delete vehicleSpawnBaseTeamByObjId[k as any];
}

function inferBaseTeamFromPosition(pos: mod.Vector): TeamID | 0 {
    const d1 = mod.DistanceBetween(pos, MAIN_BASE_TEAM1_POS); // Distance from vehicle to Team 1 base anchor.
    const d2 = mod.DistanceBetween(pos, MAIN_BASE_TEAM2_POS); // Distance from vehicle to Team 2 base anchor.
    const best = d1 <= d2 ? TeamID.Team1 : TeamID.Team2; // Pick the nearer base as the inferred team.
    const bestDist = d1 <= d2 ? d1 : d2; // Track the distance to that nearest base.

    if (bestDist > MAIN_BASE_BIND_RADIUS_METERS) { // Outside bind radius: treat as unassigned.
        return 0;
    }

    return best; // Within radius: return the inferred team id.
}

//#endregion ----------------- Vehicle Registration (team arrays) --------------------



//#region -------------------- Vehicle Spawner System --------------------

// Vehicle Spawner System architecture:
// - Slot = (team, slotNumber, spawner, desired vehicle type, live state).
// - Enablement is tied to matchup presets and only applies when the round is NOT live.
// - Spawns are forced sequentially to avoid cross-binding between spawners.
// - Spawn binding is position-based: the first expecting slot within bind distance claims the vehicle.
// - Disabled slots never respawn; existing vehicles are left alone until destroyed.
// - All delayed work is token-gated so stale timers/sequences abort when slots change.

// Each spawner is configured once on creation with its vehicle type and abandonment/respawn parameters.
function configureVehicleSpawner(spawner: mod.VehicleSpawner, vehicleType: mod.VehicleList): void {
    // Spawner settings are tuned for consistent respawn behavior; adjust with caution.
    mod.SetVehicleSpawnerVehicleType(spawner, vehicleType);
    mod.SetVehicleSpawnerAutoSpawn(spawner, false);
    mod.SetVehicleSpawnerRespawnTime(spawner, VEHICLE_SPAWNER_RESPAWN_DELAY_SECONDS);
    mod.SetVehicleSpawnerApplyDamageToAbandonVehicle(spawner, true);
    mod.SetVehicleSpawnerAbandonVehiclesOutOfCombatArea(spawner, true);
    mod.SetVehicleSpawnerTimeUntilAbandon(spawner, VEHICLE_SPAWNER_TIME_UNTIL_ABANDON_SECONDS);
    mod.SetVehicleSpawnerKeepAliveAbandonRadius(spawner, VEHICLE_SPAWNER_KEEP_ALIVE_ABANDON_RADIUS);
    mod.SetVehicleSpawnerKeepAliveSpawnerRadius(spawner, VEHICLE_SPAWNER_KEEP_ALIVE_SPAWNER_RADIUS);
}

// Poll helper: returns undefined if the vehicle no longer exists (destroyed/unspawned/OOB).
function findVehicleById(vehicleId: number): mod.Vehicle | undefined {
    const vehicles = mod.AllVehicles();
    const count = mod.CountOf(vehicles);
    for (let i = 0; i < count; i++) {
        const v = mod.ValueInArray(vehicles, i) as mod.Vehicle;
        if (mod.GetObjId(v) === vehicleId) return v;
    }
    return undefined;
}

// v0.721: Restart-button cleanup. Teleports an empty vehicle to (X, -1000, Z) then deals lethal
// damage 1.5s later so the explosion VFX renders underground. v0.704/v0.705 attempts used slot
// iteration + a 15m radius gate; v0.721 drops both per user direction ("teleport ALL empty
// vehicles regardless of position"). Suspect cause of prior failure: those gates may have
// silently filtered out every vehicle. No spawner-flag manipulation in this version -- if v0.721
// still shows vehicles blowing up at the pad, the next step is investigating the abandonment
// flags (see heli_issues.md H_Bug_4 ranked hypotheses).
async function sinkAndDestroyEmptyVehicle(v: mod.Vehicle): Promise<void> {
    let x = 0;
    let z = 0;
    try {
        const pos = mod.GetObjectPosition(v);
        x = mod.XComponentOf(pos);
        z = mod.ZComponentOf(pos);
    } catch {}
    try { mod.Teleport(v, mod.CreateVector(x, -1000, z), 0); } catch {}
    await mod.Wait(1.5);
    try { mod.DealDamage(v, 9999); } catch {}
}

// Walks every vehicle in the world, sink-and-destroys each one that has no occupant.
// IsVehicleOccupied throws -> default to occupied=true (skip) so we never yank a player.
function sinkAndDestroyAllEmptyVehiclesForRestart(): void {
    const all = mod.AllVehicles();
    const count = mod.CountOf(all);
    for (let i = 0; i < count; i++) {
        const v = mod.ValueInArray(all, i) as mod.Vehicle;
        if (!v) continue;
        let occupied = true;
        try { occupied = mod.IsVehicleOccupied(v); } catch {}
        if (occupied) continue;
        void sinkAndDestroyEmptyVehicle(v);
    }
}

// Creates a spawner object, applies map-specific yaw, configures vehicle type, and registers the slot state.
function addVehicleSpawnerSlot(teamId: TeamID, family: "heli" | "plane", slotNumber: number, spawnPos: mod.Vector, spawnRot: mod.Vector, vehicleType: mod.VehicleList): number {
    const yaw = mod.YComponentOf(spawnRot) + VEHICLE_SPAWN_YAW_OFFSET_DEG;
    const spawnerRot = mod.CreateVector(mod.XComponentOf(spawnRot), yaw, mod.ZComponentOf(spawnRot));
    const spawner = mod.SpawnObject(
        mod.RuntimeSpawn_Common.VehicleSpawner,
        spawnPos,
        spawnerRot
    ) as mod.VehicleSpawner;

    // Disable autos right away to avoid the default vehicle spawning before we configure the spawner.
    mod.SetVehicleSpawnerAutoSpawn(spawner, false);

    configureVehicleSpawner(spawner, vehicleType);

    const slot: VehicleSpawnerSlot = {
        teamId,
        family,
        slotNumber,
        spawner,
        spawnerObjId: getObjId(spawner),
        spawnPos,
        spawnRot: spawnerRot,
        vehicleType,
        anchorVehicle: vehicleType,
        enabled: false,
        enableToken: 0,
        spawnRequestToken: 0,
        spawnRequestAtSeconds: -1,
        expectingSpawn: false,
        vehicleId: -1,
        respawnRunning: false,
        spawnRetryScheduled: false,
    };

    State.vehicles.slots.push(slot);
    return State.vehicles.slots.length - 1;
}

function getDesiredSpawnerCountsForPreset(presetIndex: number): { team1: number; team2: number } {
    const preset = MATCHUP_PRESETS[presetIndex] ?? MATCHUP_PRESETS[0];
    // Rule: 1v0 still spawns 1 vehicle per side (practice + tooling consistency).
    const desiredTeam1 = Math.max(1, Math.floor(preset.leftPlayers));
    const desiredTeam2 = Math.max(1, Math.floor(preset.rightPlayers));
    return { team1: desiredTeam1, team2: desiredTeam2 };
}

// Toggles slot enabled state; bumps token to cancel pending waits.
// Returns true only when enabling a slot that has no tracked vehicle (needs spawn).
function setSpawnerSlotEnabled(slotIndex: number, enabled: boolean): boolean {
    const slot = State.vehicles.slots[slotIndex];
    if (slot.enabled === enabled) return false;
    slot.enabled = enabled;
    slot.enableToken += 1;
    slot.expectingSpawn = false;
    if (!enabled) return false;
    return slot.vehicleId === -1;
}

// Applies matchup -> desired slot counts, in slotNumber order, and queues sequential spawns for new slots.
function applySpawnerEnablementForMatchup(presetIndex: number, spawnOnEnable: boolean): void {
    if (isRoundLive()) return;

    const desired = getDesiredSpawnerCountsForPreset(presetIndex);
    const team1SlotIndices: number[] = [];
    const team2SlotIndices: number[] = [];
    const spawnQueue: number[] = [];

    for (let i = 0; i < State.vehicles.slots.length; i++) {
        const slot = State.vehicles.slots[i];
        // Plane slots are driven by the per-knob selection, not the legacy matchup-count path.
        if (slot.family !== "heli") continue;
        if (slot.teamId === TeamID.Team1) team1SlotIndices.push(i);
        else if (slot.teamId === TeamID.Team2) team2SlotIndices.push(i);
    }

    // Enablement order is driven by slotNumber, not array order.
    team1SlotIndices.sort((a, b) => State.vehicles.slots[a].slotNumber - State.vehicles.slots[b].slotNumber);
    team2SlotIndices.sort((a, b) => State.vehicles.slots[a].slotNumber - State.vehicles.slots[b].slotNumber);

    for (let i = 0; i < team1SlotIndices.length; i++) {
        const slotIndex = team1SlotIndices[i];
        const shouldEnable = i < desired.team1;
        const shouldSpawn = setSpawnerSlotEnabled(slotIndex, shouldEnable);
        if (spawnOnEnable && shouldSpawn) spawnQueue.push(slotIndex);
    }

    for (let i = 0; i < team2SlotIndices.length; i++) {
        const slotIndex = team2SlotIndices[i];
        const shouldEnable = i < desired.team2;
        const shouldSpawn = setSpawnerSlotEnabled(slotIndex, shouldEnable);
        if (spawnOnEnable && shouldSpawn) spawnQueue.push(slotIndex);
    }

    if (spawnOnEnable) {
        // Re-queue any enabled but empty slots to cover rapid preset changes.
        for (let i = 0; i < State.vehicles.slots.length; i++) {
            const slot = State.vehicles.slots[i];
            if (!slot.enabled) continue;
            if (slot.vehicleId !== -1) continue;
            if (slot.expectingSpawn) continue;
            spawnQueue.push(i);
        }
    }

    // Cannot spawn in parallel - spawn sequentially to avoid cross-binding when multiple spawners fire at once.
    if (spawnOnEnable && spawnQueue.length > 0) {
        queueSequentialSpawns(spawnQueue);
    }
}

// Applies the CONFIRMED per-knob vehicle selection to every spawner slot: sets each slot's
// vehicleType + enabled state, and (when spawnOnEnable) queues spawns for newly-enabled slots.
// Replaces applySpawnerEnablementForMatchup as the authoritative enablement path for both families.
// "Off" knobs disable their slot; "Map Default" resolves to the slot's anchorVehicle.
function applyVehicleSelectionToSlots(spawnOnEnable: boolean): void {
    if (isRoundLive()) return;
    if (State.vehicles.slots.length === 0) return;
    const sel = State.round.modeConfig.confirmed.vehicleSelectionIndexByKey || {};
    const spawnQueue: number[] = [];
    for (let i = 0; i < State.vehicles.slots.length; i++) {
        const slot = State.vehicles.slots[i];
        const knobKey = getKnobKeyForSlot(slot);
        const idx = sel[knobKey] !== undefined ? sel[knobKey] : 0;
        const selectedVehicle = getReadyDialogSelectedVehicleForKnob(knobKey, idx, slot.anchorVehicle);
        if (selectedVehicle === undefined) {
            setSpawnerSlotEnabled(i, false);
            continue;
        }
        if (slot.vehicleType !== selectedVehicle) {
            slot.vehicleType = selectedVehicle;
            configureVehicleSpawner(slot.spawner, selectedVehicle);
        }
        const needsSpawn = setSpawnerSlotEnabled(i, true);
        if (spawnOnEnable && needsSpawn) spawnQueue.push(i);
    }
    if (spawnOnEnable) {
        // Re-queue any enabled-but-empty slot (covers rapid re-confirms).
        for (let i = 0; i < State.vehicles.slots.length; i++) {
            const slot = State.vehicles.slots[i];
            if (!slot.enabled) continue;
            if (slot.vehicleId !== -1) continue;
            if (slot.expectingSpawn) continue;
            spawnQueue.push(i);
        }
    }
    if (spawnOnEnable && spawnQueue.length > 0) {
        queueSequentialSpawns(spawnQueue);
    }
}

// Active (non-Off) vehicle count for a team from a given selection map. Iterates the slots that
// actually exist on the map, so plane knobs on a jetless map (no plane slot) correctly count 0.
function getActiveVehicleCountForTeamFromSelection(teamNum: TeamID, sel: Record<string, number>): number {
    let count = 0;
    for (let i = 0; i < State.vehicles.slots.length; i++) {
        const slot = State.vehicles.slots[i];
        if (slot.teamId !== teamNum) continue;
        const knobKey = getKnobKeyForSlot(slot);
        const idx = sel[knobKey] !== undefined ? sel[knobKey] : 0;
        const v = getReadyDialogSelectedVehicleForKnob(knobKey, idx, slot.anchorVehicle);
        if (v !== undefined) count++;
    }
    return count;
}

// Active count from the CONFIRMED selection. Used for the kills target.
function getConfirmedActiveVehicleCountForTeam(teamNum: TeamID): number {
    return getActiveVehicleCountForTeamFromSelection(teamNum, State.round.modeConfig.confirmed.vehicleSelectionIndexByKey || {});
}

// Confirmed vehicle composition (jets + choppers) per team -- drives the upper-left settings readout.
function getConfirmedVehicleCompositionForTeam(teamNum: TeamID): { jets: number; choppers: number } {
    const sel = State.round.modeConfig.confirmed.vehicleSelectionIndexByKey || {};
    let jets = 0;
    let choppers = 0;
    for (let i = 0; i < State.vehicles.slots.length; i++) {
        const slot = State.vehicles.slots[i];
        if (slot.teamId !== teamNum) continue;
        const knobKey = getKnobKeyForSlot(slot);
        const idx = sel[knobKey] !== undefined ? sel[knobKey] : 0;
        const v = getReadyDialogSelectedVehicleForKnob(knobKey, idx, slot.anchorVehicle);
        if (v === undefined) continue;
        if (slot.family === "plane") jets++;
        else choppers++;
    }
    return { jets, choppers };
}

function queueSequentialSpawns(slotIndices: number[]): void {
    if (slotIndices.length === 0) return;
    // Token cancels any prior spawn sequence if a new one is queued.
    // Consider hardening: If a spawn sequence stalls, spawnSequenceInProgress can remain true and block matchup changes.
    State.vehicles.spawnSequenceToken += 1;
    const token = State.vehicles.spawnSequenceToken;
    State.vehicles.spawnSequenceInProgress = true;
    void runSequentialSpawns(slotIndices, token);
}

// Spawns each slot one-at-a-time to avoid simultaneous spawn cross-binding.
// Exits early if a new sequence supersedes this one (token mismatch).
async function runSequentialSpawns(slotIndices: number[], token: number): Promise<void> {
    // Consider hardening: Tight maps are vulnerable if a delayed spawn arrives after the token window; fallback binding may mis-bind.
    for (let i = 0; i < slotIndices.length; i++) {
        if (State.vehicles.spawnSequenceToken !== token) return;
        const slotIndex = slotIndices[i];
        const slot = State.vehicles.slots[slotIndex];
        if (!slot || !slot.enabled || slot.vehicleId !== -1) continue;
        await forceSpawnWithRetry(slotIndex);
        await mod.Wait(0.3);
    }

    if (State.vehicles.spawnSequenceToken === token) {
        State.vehicles.spawnSequenceInProgress = false;
    }
}

// Forces a spawn for a slot, polling until a vehicle binds or attempts are exhausted.
// Aborts if slot is disabled or token changes mid-attempt.
async function forceSpawnWithRetry(slotIndex: number): Promise<boolean> {
    const slot = State.vehicles.slots[slotIndex];
    if (!slot.enabled) return false;
    const token = slot.enableToken;
    slot.expectingSpawn = true;
    slot.spawnRequestToken += 1;
    slot.spawnRequestAtSeconds = Math.floor(mod.GetMatchTimeElapsed());
    State.vehicles.activeSpawnSlotIndex = slotIndex;
    State.vehicles.activeSpawnToken = slot.spawnRequestToken;
    State.vehicles.activeSpawnRequestedAtSeconds = slot.spawnRequestAtSeconds;

    // Re-apply config before forcing spawn to avoid the default vehicle type.
    configureVehicleSpawner(slot.spawner, slot.vehicleType);
    await mod.Wait(0);

    for (let attempt = 0; attempt < 20; attempt++) {
        if (!slot.enabled || slot.enableToken !== token) {
            slot.expectingSpawn = false;
            if (State.vehicles.activeSpawnSlotIndex === slotIndex && State.vehicles.activeSpawnToken === slot.spawnRequestToken) {
                State.vehicles.activeSpawnSlotIndex = undefined;
                State.vehicles.activeSpawnToken = undefined;
                State.vehicles.activeSpawnRequestedAtSeconds = undefined;
            }
            return false;
        }
        mod.ForceVehicleSpawnerSpawn(slot.spawner);

        if (!slot.expectingSpawn && slot.vehicleId !== -1) {
            return true;
        }

        await mod.Wait(0.25);
    }

    slot.expectingSpawn = false;
    if (State.vehicles.activeSpawnSlotIndex === slotIndex && State.vehicles.activeSpawnToken === slot.spawnRequestToken) {
        State.vehicles.activeSpawnSlotIndex = undefined;
        State.vehicles.activeSpawnToken = undefined;
        State.vehicles.activeSpawnRequestedAtSeconds = undefined;
    }
    return false;
}

// Schedules a delayed retry when spawn is blocked; rechecks slot/token before retry.
async function scheduleBlockedSpawnRetry(slotIndex: number): Promise<void> {
    const slot = State.vehicles.slots[slotIndex];
    if (!slot.enabled) return;
    if (slot.spawnRetryScheduled) return;
    slot.spawnRetryScheduled = true;
    const token = slot.enableToken;

    await mod.Wait(VEHICLE_SPAWNER_RESPAWN_DELAY_SECONDS);
    slot.spawnRetryScheduled = false;

    if (!slot.enabled || slot.enableToken !== token) return;
    if (slot.vehicleId !== -1) return;

    const teamNameKey = getTeamNameKey(slot.teamId);
    sendHighlightedWorldLogMessage(
        mod.Message(STR_VEHICLE_SPAWN_RETRY, teamNameKey, VEHICLE_SPAWNER_RESPAWN_DELAY_SECONDS),
        true,
        undefined,
        STR_VEHICLE_SPAWN_RETRY
    );

    const success = await forceSpawnWithRetry(slotIndex);
    if (!success) {
        void scheduleBlockedSpawnRetry(slotIndex);
    }
}

// Waits the respawn delay, clears old vehicle mapping, then spawns a replacement.
// Token-guarded to prevent respawns after disable/retune.
async function scheduleRespawn(slotIndex: number, lastVehicleId: number): Promise<void> {
    const slot = State.vehicles.slots[slotIndex];
    // Live rounds never respawn tanks; round-end cleanup owns the refill.
    if (isRoundLive()) {
        delete State.vehicles.vehicleToSlot[lastVehicleId];
        if (slot.vehicleId === lastVehicleId) {
            slot.vehicleId = -1;
        }
        return;
    }
    if (!slot.enabled) {
        delete State.vehicles.vehicleToSlot[lastVehicleId];
        if (slot.vehicleId === lastVehicleId) {
            slot.vehicleId = -1;
        }
        return;
    }
    // Guard against overlapping respawn timers for the same slot.
    if (slot.respawnRunning) return;

    slot.respawnRunning = true;
    const token = slot.enableToken;
    await mod.Wait(VEHICLE_SPAWNER_RESPAWN_DELAY_SECONDS);

    if (!slot.enabled || slot.enableToken !== token) {
        slot.respawnRunning = false;
        return;
    }

    delete State.vehicles.vehicleToSlot[lastVehicleId];
    slot.vehicleId = -1;

    const success = await forceSpawnWithRetry(slotIndex);
    if (!success) {
        void scheduleBlockedSpawnRetry(slotIndex);
    }
    slot.respawnRunning = false;
}

// Periodically verifies tracked vehicles still exist; if missing, triggers respawn.
async function pollVehicleSpawnerSlots(): Promise<void> {
    while (true) {
        await mod.Wait(VEHICLE_SPAWNER_POLL_INTERVAL_SECONDS);
        // Pause spawner maintenance during cleanup to avoid late respawns/binds.
        if (State.round.flow.cleanupActive) {
            continue;
        }

        for (let i = 0; i < State.vehicles.slots.length; i++) {
            const slot = State.vehicles.slots[i];
            if (slot.vehicleId === -1) continue;

            const vehicle = findVehicleById(slot.vehicleId);
            if (!vehicle) {
                const oldId = slot.vehicleId;
                slot.vehicleId = -1;
                // Slot tracking is for respawn/binding only; scoring uses the registry arrays.
                // Vehicle missing means destroyed/unspawned; schedule a respawn when not live.
                if (!isRoundLive()) {
                    scheduleRespawn(i, oldId);
                }
                continue;
            }
        }
    }
}

async function applySpawnYawToVehicle(eventVehicle: mod.Vehicle, slot: VehicleSpawnerSlot): Promise<void> {
    // Enforce the desired spawn yaw on the vehicle after it exists (map-specific spawner yaw can drift).
    const pos = slot.spawnPos;
    const yawDeg = mod.YComponentOf(slot.spawnRot);
    const yawRad = yawDeg * Math.PI / 180;
    mod.Teleport(eventVehicle, pos, yawRad);
    await mod.Wait(0);
    mod.Teleport(eventVehicle, pos, yawRad);
}

// Binding uses object position (not vehicle state) because it is stable at spawn time.
// Fallback binding can mis-assign on tight maps if a spawn arrives outside the token window.
function bindSpawnedVehicleToSlot(eventVehicle: mod.Vehicle, vehiclePos: mod.Vector): TeamID | 0 {
    const vehicleObjId = getObjId(eventVehicle);

    const activeIndex = State.vehicles.activeSpawnSlotIndex;
    const activeToken = State.vehicles.activeSpawnToken;
    const activeAt = State.vehicles.activeSpawnRequestedAtSeconds;
    if (activeIndex !== undefined && activeToken !== undefined && activeAt !== undefined) {
        const now = Math.floor(mod.GetMatchTimeElapsed());
        const expired = (now - activeAt) > VEHICLE_SPAWNER_BIND_TIMEOUT_SECONDS;
        if (!expired) {
            const activeSlot = State.vehicles.slots[activeIndex];
            if (activeSlot && activeSlot.enabled && activeSlot.expectingSpawn && activeSlot.spawnRequestToken === activeToken) {
                activeSlot.expectingSpawn = false;
                activeSlot.vehicleId = vehicleObjId;
                activeSlot.respawnRunning = false;
                activeSlot.spawnRetryScheduled = false;
                State.vehicles.vehicleToSlot[vehicleObjId] = activeIndex;
                State.vehicles.activeSpawnSlotIndex = undefined;
                State.vehicles.activeSpawnToken = undefined;
                State.vehicles.activeSpawnRequestedAtSeconds = undefined;
                void applySpawnYawToVehicle(eventVehicle, activeSlot);
                return activeSlot.teamId;
            }
        } else {
            State.vehicles.activeSpawnSlotIndex = undefined;
            State.vehicles.activeSpawnToken = undefined;
            State.vehicles.activeSpawnRequestedAtSeconds = undefined;
        }
    }

    for (let i = 0; i < State.vehicles.slots.length; i++) {
        const slot = State.vehicles.slots[i];
        if (!slot.expectingSpawn) continue;

        const spawnerPos = mod.GetObjectPosition(slot.spawner);
        const d = mod.DistanceBetween(vehiclePos, spawnerPos);
        if (d <= VEHICLE_SPAWNER_BIND_DISTANCE_METERS) {
            slot.expectingSpawn = false;
            slot.vehicleId = vehicleObjId;
            slot.respawnRunning = false;
            slot.spawnRetryScheduled = false;
            State.vehicles.vehicleToSlot[vehicleObjId] = i;
            if (State.vehicles.activeSpawnSlotIndex === i && State.vehicles.activeSpawnToken === slot.spawnRequestToken) {
                State.vehicles.activeSpawnSlotIndex = undefined;
                State.vehicles.activeSpawnToken = undefined;
                State.vehicles.activeSpawnRequestedAtSeconds = undefined;
            }
            void applySpawnYawToVehicle(eventVehicle, slot);
            return slot.teamId;
        }
    }

    return 0;
}

// Locates the first "expectingSpawn" slot within bind distance of the vehicle position.
function findSpawnerSlotByPosition(spawnPos: mod.Vector): number {
    for (let i = 0; i < State.vehicles.slots.length; i++) {
        const slot = State.vehicles.slots[i];
        const spawnerPos = mod.GetObjectPosition(slot.spawner);
        if (mod.DistanceBetween(spawnPos, spawnerPos) <= VEHICLE_SPAWNER_BIND_DISTANCE_METERS) {
            return i;
        }
    }
    return -1;
}

// Bootstraps spawners + slots, applies current matchup enablement, and starts the polling loop.
async function startVehicleSpawnerSystem(): Promise<void> {
    // WARNING: This should run once per match; duplicate runs can create extra spawners/slots.
    // Ensure map config is applied before any spawners are created or forced to spawn.
    while (!State.vehicles.configReady) {
        await mod.Wait(0.1);
    }
    await mod.Wait(VEHICLE_SPAWNER_START_DELAY_SECONDS);

    State.vehicles.slots.length = 0;
    State.vehicles.vehicleToSlot = {};
    State.vehicles.spawnSequenceInProgress = false;

    const team1Specs = [...TEAM1_VEHICLE_SPAWN_SPECS].sort((a, b) => a.slotNumber - b.slotNumber);
    const team2Specs = [...TEAM2_VEHICLE_SPAWN_SPECS].sort((a, b) => a.slotNumber - b.slotNumber);

    for (const spec of team1Specs) {
        addVehicleSpawnerSlot(TeamID.Team1, "heli", spec.slotNumber, spec.pos, spec.rot, spec.vehicle);
    }
    for (const spec of team2Specs) {
        addVehicleSpawnerSlot(TeamID.Team2, "heli", spec.slotNumber, spec.pos, spec.rot, spec.vehicle);
    }

    // Plane (jet) slots. Created disabled; the per-knob selection enables them on Confirm. Empty on
    // jetless maps (resolvePlaneSpawnsForTeam returns []), so no plane slots exist there at all.
    const team1PlaneSpecs = [...resolvePlaneSpawnsForTeam(ACTIVE_MAP_CONFIG, TeamID.Team1)].sort((a, b) => a.slotNumber - b.slotNumber);
    const team2PlaneSpecs = [...resolvePlaneSpawnsForTeam(ACTIVE_MAP_CONFIG, TeamID.Team2)].sort((a, b) => a.slotNumber - b.slotNumber);
    for (const spec of team1PlaneSpecs) {
        addVehicleSpawnerSlot(TeamID.Team1, "plane", spec.slotNumber, spec.pos, spec.rot, spec.vehicle);
    }
    for (const spec of team2PlaneSpecs) {
        addVehicleSpawnerSlot(TeamID.Team2, "plane", spec.slotNumber, spec.pos, spec.rot, spec.vehicle);
    }

    // One-time cleanup: remove any default vehicles sitting on or near spawn pads before first forced spawns.
    // This prevents a default Abrams from persisting if it spawned before our spawners were configured.
    // Keep this one-shot and pre-round to avoid deleting player vehicles later in the match.
    // Consider Hardening with a second cleanup pass before first forced spawns if default spawns reappear after cleanup
    if (!isRoundLive() && !State.vehicles.startupCleanupDone) {
        const vehicles = mod.AllVehicles();
        const vCount = mod.CountOf(vehicles);
        for (let v = 0; v < vCount; v++) {
            const vehicle = mod.ValueInArray(vehicles, v) as mod.Vehicle;
            if (!vehicle) continue;
            const pos = mod.GetObjectPosition(vehicle);
            let nearSpawn = false;
            for (let i = 0; i < State.vehicles.slots.length; i++) {
                const slot = State.vehicles.slots[i];
                if (mod.DistanceBetween(pos, slot.spawnPos) <= VEHICLE_SPAWNER_STARTUP_CLEANUP_RADIUS_METERS) {
                    nearSpawn = true;
                    break;
                }
            }
            if (nearSpawn) {
                mod.UnspawnObject(vehicle);
            }
        }
        State.vehicles.startupCleanupDone = true;
    }


    // Extra short wait reduces the chance of a default spawn appearing after cleanup.
    await mod.Wait(0.1);
    // Apply per-knob selection (vehicle type + enabled) before spawning so only selected slots spawn.
    applyVehicleSelectionToSlots(false);

    // Kick initial spawns so each slot has a vehicle bound before the poll loop starts.
    for (let i = 0; i < State.vehicles.slots.length; i++) {
        if (!State.vehicles.slots[i].enabled) continue;
        const success = await forceSpawnWithRetry(i);
        if (!success) {
            void scheduleBlockedSpawnRetry(i);
        }
        await mod.Wait(0.5);
    }

    // Long-running poll loop to detect missing vehicles and respawn.
    void pollVehicleSpawnerSlots();
}

//#endregion ----------------- Vehicle Spawner System --------------------



//#region -------------------- Kills HUD Sync (GameModeScore -> HUD) --------------------

function syncKillsHudFromTrackedTotals(force: boolean): void {
    // Total kills are tracked in script variables; GameModeScore is reserved for match wins.
    // Pre-build update safety: setCounterText defensive-no-ops on undefined refs, so calling
    // this before ensureTopHudScoringUiBuiltHidden has fired (e.g. pre-deploy player) is safe.
    // Values stay authoritative in State; widgets are projections seeded by seedTopHudFromState.
    if (!force
        && State.hudCache.lastHudScoreT1 === State.scores.t1TotalKills
        && State.hudCache.lastHudScoreT2 === State.scores.t2TotalKills) {
        return;
    }
    State.hudCache.lastHudScoreT1 = State.scores.t1TotalKills;
    State.hudCache.lastHudScoreT2 = State.scores.t2TotalKills;

    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const pid = getObjId(p);
        const refs = State.hudCache.hudByPid[pid];
        if (!refs) continue;
        setCounterText(refs.leftKillsText, State.scores.t1TotalKills);
        setCounterText(refs.rightKillsText, State.scores.t2TotalKills);
    }
}

// Round kills HUD Sync (RoundKills -> HUD)
function syncRoundKillsHud(force: boolean = false): void {
    if (!force && State.hudCache.lastHudRoundKillsT1 === State.scores.t1RoundKills && State.hudCache.lastHudRoundKillsT2 === State.scores.t2RoundKills) return;

    State.hudCache.lastHudRoundKillsT1 = State.scores.t1RoundKills;
    State.hudCache.lastHudRoundKillsT2 = State.scores.t2RoundKills;

    const players = mod.AllPlayers();
    const count = mod.CountOf(players);

    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const pid = getObjId(p);
        const refs = State.hudCache.hudByPid[pid];
        if (!refs) continue;

        setCounterText(refs.leftRoundKillsText, State.scores.t1RoundKills);
        setCounterText(refs.rightRoundKillsText, State.scores.t2RoundKills);
    }
}

//#endregion ----------------- Kills HUD Sync (GameModeScore -> HUD) --------------------
