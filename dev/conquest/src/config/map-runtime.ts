// @ts-nocheck
// Module: config/map-runtime -- map detection/apply and spawn-preset helpers

//#region -------------------- Map + Matchup Helpers --------------------

// Returns the Ready-dialog display stringkey for the current map.
function getMapNameKey(mapKey: MapKey): number {
    return MAP_NAME_STRINGKEYS[mapKey] ?? mod.stringkeys.twl.system.unknownPlayer;
}

// Builds a fallback helicopter spawn list from tank spawn positions when no map-specific heli list exists.
function buildHeliSpawnsFromTankSpawns(spawns: VehicleSpawnSpec[], team: TeamID): VehicleSpawnSpec[] {
    const attackVehicle = team === TeamID.Team1 ? mod.VehicleList.AH64 : mod.VehicleList.Eurocopter;
    const transportVehicle = team === TeamID.Team1 ? mod.VehicleList.UH60 : mod.VehicleList.UH60_Pax;
    return spawns.map((spawn) => ({
        slotNumber: spawn.slotNumber,
        pos: spawn.pos,
        rot: spawn.rot,
        vehicle: spawn.slotNumber === 3 ? transportVehicle : attackVehicle,
    }));
}

// Returns heli spawn specs for one team, falling back to tank-anchor-derived heli spawns when absent.
function resolveHeliSpawnsForTeam(cfg: MapConfig, team: TeamID): VehicleSpawnSpec[] {
    if (team === TeamID.Team1) {
        if (cfg.team1HeliSpawns && cfg.team1HeliSpawns.length > 0) return cfg.team1HeliSpawns;
        return buildHeliSpawnsFromTankSpawns(cfg.team1TankSpawns, TeamID.Team1);
    }
    if (cfg.team2HeliSpawns && cfg.team2HeliSpawns.length > 0) return cfg.team2HeliSpawns;
    return buildHeliSpawnsFromTankSpawns(cfg.team2TankSpawns, TeamID.Team2);
}

function cloneVehicleSpawnSpecs(spawns: VehicleSpawnSpec[] | undefined): VehicleSpawnSpec[] {
    if (!spawns || spawns.length === 0) return [];
    return spawns.map((spawn) => ({
        slotNumber: spawn.slotNumber,
        pos: spawn.pos,
        rot: spawn.rot,
        vehicle: spawn.vehicle,
    }));
}

const VEHICLE_PACKAGE_SLOT_BASE_JET = 1;
const VEHICLE_PACKAGE_SLOT_BASE_HELI = 3;
const VEHICLE_PACKAGE_SLOT_BASE_GROUND = 5;
const VEHICLE_PACKAGE_SLOT_BASE_FAST = 9;

function getReadyDialogVehicleOptionsForKnobKey(knobKey: string): ReadyDialogVehicleOption[] {
    if (knobKey === READY_DIALOG_TEAM1_FAST_KNOB_KEYS[2] || knobKey === READY_DIALOG_TEAM1_FAST_KNOB_KEYS[3]) {
        return READY_DIALOG_TEAM1_TRANSPORT_SLOT_VEHICLE_OPTIONS;
    }
    if (knobKey === READY_DIALOG_TEAM2_FAST_KNOB_KEYS[2] || knobKey === READY_DIALOG_TEAM2_FAST_KNOB_KEYS[3]) {
        return READY_DIALOG_TEAM2_TRANSPORT_SLOT_VEHICLE_OPTIONS;
    }
    if (knobKey.indexOf("Jet") >= 0) return READY_DIALOG_JET_VEHICLE_OPTIONS;
    if (knobKey.indexOf("Heli") >= 0) return READY_DIALOG_HELI_VEHICLE_OPTIONS;
    if (knobKey.indexOf("Ground") >= 0) return READY_DIALOG_GROUND_VEHICLE_OPTIONS;
    if (knobKey.indexOf("Fast") >= 0) return READY_DIALOG_FAST_VEHICLE_OPTIONS;
    return [];
}

function isTransportHeliVehicleType(vehicle: mod.VehicleList | undefined): boolean {
    return vehicle === mod.VehicleList.UH60 || vehicle === mod.VehicleList.UH60_Pax;
}

function getReadyDialogVehicleSelectionLabelKey(knobKey: string, selectionIndex: number): number {
    const options = getReadyDialogVehicleOptionsForKnobKey(knobKey);
    if (options.length <= 0) return mod.stringkeys.twl.system.unknownPlayer;
    const clamped = ((selectionIndex % options.length) + options.length) % options.length;
    return options[clamped]?.label ?? mod.stringkeys.twl.system.unknownPlayer;
}

function getReadyDialogVehicleSelectionCount(knobKey: string): number {
    return getReadyDialogVehicleOptionsForKnobKey(knobKey).length;
}

function getReadyDialogVehicleOptionIndexForVehicle(knobKey: string, vehicle: mod.VehicleList | undefined): number {
    const options = getReadyDialogVehicleOptionsForKnobKey(knobKey);
    if (options.length <= 0 || vehicle === undefined) return 0;
    for (let i = 0; i < options.length; i++) {
        if (options[i].vehicle === vehicle) return i;
    }
    return 0;
}

function getReadyDialogSelectedVehicleForKnobKey(knobKey: string, selectionByKey: Record<string, number>): mod.VehicleList | undefined {
    const options = getReadyDialogVehicleOptionsForKnobKey(knobKey);
    if (options.length <= 0) return undefined;
    const currentIndex = selectionByKey[knobKey] ?? 0;
    const clamped = ((currentIndex % options.length) + options.length) % options.length;
    return options[clamped]?.vehicle;
}

function remapVehicleSpawnSpecsForRuntime(
    baseSpawns: VehicleSpawnSpec[] | undefined,
    runtimeStartSlotNumber: number,
    maxCount: number
): VehicleSpawnSpec[] {
    const next = cloneVehicleSpawnSpecs(baseSpawns).slice(0, maxCount);
    for (let i = 0; i < next.length; i++) {
        next[i].slotNumber = runtimeStartSlotNumber + i;
    }
    return next;
}

function buildRuntimeVehicleSlotInventoryForTeam(cfg: MapConfig, team: TeamID): VehicleSpawnSpec[] {
    const heliSpawns = resolveHeliSpawnsForTeam(cfg, team);
    const fastMoverSpawns = team === TeamID.Team1 ? (cfg.team1FastMoverSpawns ?? []) : (cfg.team2FastMoverSpawns ?? []);
    const jets = remapVehicleSpawnSpecsForRuntime(
        team === TeamID.Team1 ? (cfg.team1JetSpawns ?? []) : (cfg.team2JetSpawns ?? []),
        VEHICLE_PACKAGE_SLOT_BASE_JET,
        2
    );
    const helis = remapVehicleSpawnSpecsForRuntime(
        heliSpawns.slice(0, 2),
        VEHICLE_PACKAGE_SLOT_BASE_HELI,
        2
    );
    const ground = remapVehicleSpawnSpecsForRuntime(
        team === TeamID.Team1 ? cfg.team1TankSpawns : cfg.team2TankSpawns,
        VEHICLE_PACKAGE_SLOT_BASE_GROUND,
        4
    );
    const fast = remapVehicleSpawnSpecsForRuntime(
        fastMoverSpawns.slice(0, 2),
        VEHICLE_PACKAGE_SLOT_BASE_FAST,
        2
    );
    const transportHelis = remapVehicleSpawnSpecsForRuntime(
        heliSpawns.slice(2, 4),
        VEHICLE_PACKAGE_SLOT_BASE_FAST + 2,
        2
    );
    return [...jets, ...helis, ...ground, ...fast, ...transportHelis];
}

function buildSelectedVehicleSpawnSpecsFromKnobs(
    baseSpawns: VehicleSpawnSpec[] | undefined,
    knobKeys: readonly string[],
    selectionByKey: Record<string, number>,
    runtimeStartSlotNumber: number
): VehicleSpawnSpec[] {
    const remapped = remapVehicleSpawnSpecsForRuntime(baseSpawns, runtimeStartSlotNumber, knobKeys.length);
    const next: VehicleSpawnSpec[] = [];
    for (let i = 0; i < remapped.length && i < knobKeys.length; i++) {
        const selectedVehicle = getReadyDialogSelectedVehicleForKnobKey(knobKeys[i], selectionByKey);
        if (selectedVehicle === undefined) continue;
        next.push({
            slotNumber: remapped[i].slotNumber,
            pos: remapped[i].pos,
            rot: remapped[i].rot,
            vehicle: selectedVehicle,
        });
    }
    return next;
}

function buildSelectedTransportSpawnSpecsForTeam(
    cfg: MapConfig,
    team: TeamID,
    selectionByKey: Record<string, number>
): VehicleSpawnSpec[] {
    const fastMoverSpawns = team === TeamID.Team1 ? (cfg.team1FastMoverSpawns ?? []) : (cfg.team2FastMoverSpawns ?? []);
    const heliSpawns = resolveHeliSpawnsForTeam(cfg, team);
    const transportKnobKeys = team === TeamID.Team1
        ? READY_DIALOG_TEAM1_FAST_KNOB_KEYS
        : READY_DIALOG_TEAM2_FAST_KNOB_KEYS;
    const next: VehicleSpawnSpec[] = [];

    for (let i = 0; i < transportKnobKeys.length; i++) {
        const knobKey = transportKnobKeys[i];
        const selectedVehicle = getReadyDialogSelectedVehicleForKnobKey(knobKey, selectionByKey);
        if (selectedVehicle === undefined) continue;

        const runtimeSlotNumber = VEHICLE_PACKAGE_SLOT_BASE_FAST + i;
        const useHeliAnchor = i >= 2 && isTransportHeliVehicleType(selectedVehicle);
        const baseSpawn = useHeliAnchor
            ? heliSpawns[i]
            : fastMoverSpawns[i];
        if (!baseSpawn) continue;

        next.push({
            slotNumber: runtimeSlotNumber,
            pos: baseSpawn.pos,
            rot: baseSpawn.rot,
            vehicle: selectedVehicle,
        });
    }

    return next;
}

function buildReadyDialogVehicleSelectionIndexByGameMode(_cfg: MapConfig, gameModeKey: number): Record<string, number> {
    const next: Record<string, number> = {};
    for (const knobKey of READY_DIALOG_ALL_VEHICLE_KNOB_KEYS) {
        next[knobKey] = getReadyDialogVehicleOptionIndexForVehicle(knobKey, undefined);
    }

    if (gameModeKey !== mod.stringkeys.twl.readyDialog.gameModeHelisPractice) {
        return next;
    }

    next[READY_DIALOG_TEAM1_JET_KNOB_KEYS[0]] = getReadyDialogVehicleOptionIndexForVehicle(READY_DIALOG_TEAM1_JET_KNOB_KEYS[0], mod.VehicleList.F16);
    next[READY_DIALOG_TEAM1_JET_KNOB_KEYS[1]] = getReadyDialogVehicleOptionIndexForVehicle(READY_DIALOG_TEAM1_JET_KNOB_KEYS[1], undefined);
    next[READY_DIALOG_TEAM2_JET_KNOB_KEYS[0]] = getReadyDialogVehicleOptionIndexForVehicle(READY_DIALOG_TEAM2_JET_KNOB_KEYS[0], mod.VehicleList.JAS39);
    next[READY_DIALOG_TEAM2_JET_KNOB_KEYS[1]] = getReadyDialogVehicleOptionIndexForVehicle(READY_DIALOG_TEAM2_JET_KNOB_KEYS[1], undefined);

    next[READY_DIALOG_TEAM1_HELI_KNOB_KEYS[0]] = getReadyDialogVehicleOptionIndexForVehicle(READY_DIALOG_TEAM1_HELI_KNOB_KEYS[0], mod.VehicleList.AH64);
    next[READY_DIALOG_TEAM1_HELI_KNOB_KEYS[1]] = getReadyDialogVehicleOptionIndexForVehicle(READY_DIALOG_TEAM1_HELI_KNOB_KEYS[1], mod.VehicleList.UH60);
    next[READY_DIALOG_TEAM2_HELI_KNOB_KEYS[0]] = getReadyDialogVehicleOptionIndexForVehicle(READY_DIALOG_TEAM2_HELI_KNOB_KEYS[0], mod.VehicleList.Eurocopter);
    next[READY_DIALOG_TEAM2_HELI_KNOB_KEYS[1]] = getReadyDialogVehicleOptionIndexForVehicle(READY_DIALOG_TEAM2_HELI_KNOB_KEYS[1], mod.VehicleList.UH60_Pax);

    next[READY_DIALOG_TEAM1_GROUND_KNOB_KEYS[0]] = getReadyDialogVehicleOptionIndexForVehicle(READY_DIALOG_TEAM1_GROUND_KNOB_KEYS[0], mod.VehicleList.Abrams);
    next[READY_DIALOG_TEAM1_GROUND_KNOB_KEYS[1]] = getReadyDialogVehicleOptionIndexForVehicle(READY_DIALOG_TEAM1_GROUND_KNOB_KEYS[1], mod.VehicleList.Cheetah);
    next[READY_DIALOG_TEAM1_GROUND_KNOB_KEYS[2]] = getReadyDialogVehicleOptionIndexForVehicle(READY_DIALOG_TEAM1_GROUND_KNOB_KEYS[2], undefined);
    next[READY_DIALOG_TEAM1_GROUND_KNOB_KEYS[3]] = getReadyDialogVehicleOptionIndexForVehicle(READY_DIALOG_TEAM1_GROUND_KNOB_KEYS[3], undefined);
    next[READY_DIALOG_TEAM2_GROUND_KNOB_KEYS[0]] = getReadyDialogVehicleOptionIndexForVehicle(READY_DIALOG_TEAM2_GROUND_KNOB_KEYS[0], mod.VehicleList.Leopard);
    next[READY_DIALOG_TEAM2_GROUND_KNOB_KEYS[1]] = getReadyDialogVehicleOptionIndexForVehicle(READY_DIALOG_TEAM2_GROUND_KNOB_KEYS[1], mod.VehicleList.Gepard);
    next[READY_DIALOG_TEAM2_GROUND_KNOB_KEYS[2]] = getReadyDialogVehicleOptionIndexForVehicle(READY_DIALOG_TEAM2_GROUND_KNOB_KEYS[2], undefined);
    next[READY_DIALOG_TEAM2_GROUND_KNOB_KEYS[3]] = getReadyDialogVehicleOptionIndexForVehicle(READY_DIALOG_TEAM2_GROUND_KNOB_KEYS[3], undefined);

    next[READY_DIALOG_TEAM1_FAST_KNOB_KEYS[0]] = getReadyDialogVehicleOptionIndexForVehicle(READY_DIALOG_TEAM1_FAST_KNOB_KEYS[0], mod.VehicleList.Quadbike);
    next[READY_DIALOG_TEAM1_FAST_KNOB_KEYS[1]] = getReadyDialogVehicleOptionIndexForVehicle(READY_DIALOG_TEAM1_FAST_KNOB_KEYS[1], mod.VehicleList.Quadbike);
    next[READY_DIALOG_TEAM1_FAST_KNOB_KEYS[2]] = getReadyDialogVehicleOptionIndexForVehicle(READY_DIALOG_TEAM1_FAST_KNOB_KEYS[2], undefined);
    next[READY_DIALOG_TEAM1_FAST_KNOB_KEYS[3]] = getReadyDialogVehicleOptionIndexForVehicle(READY_DIALOG_TEAM1_FAST_KNOB_KEYS[3], undefined);
    next[READY_DIALOG_TEAM2_FAST_KNOB_KEYS[0]] = getReadyDialogVehicleOptionIndexForVehicle(READY_DIALOG_TEAM2_FAST_KNOB_KEYS[0], mod.VehicleList.Quadbike);
    next[READY_DIALOG_TEAM2_FAST_KNOB_KEYS[1]] = getReadyDialogVehicleOptionIndexForVehicle(READY_DIALOG_TEAM2_FAST_KNOB_KEYS[1], mod.VehicleList.Quadbike);
    next[READY_DIALOG_TEAM2_FAST_KNOB_KEYS[2]] = getReadyDialogVehicleOptionIndexForVehicle(READY_DIALOG_TEAM2_FAST_KNOB_KEYS[2], undefined);
    next[READY_DIALOG_TEAM2_FAST_KNOB_KEYS[3]] = getReadyDialogVehicleOptionIndexForVehicle(READY_DIALOG_TEAM2_FAST_KNOB_KEYS[3], undefined);
    return next;
}

function syncReadyDialogVehicleSelectionsFromActiveMapConfig(): void {
    const defaults = buildReadyDialogVehicleSelectionIndexByGameMode(ACTIVE_MAP_CONFIG, READY_DIALOG_GAME_MODE_OPTIONS[READY_DIALOG_GAME_MODE_DEFAULT_INDEX]);
    State.round.modeConfig.vehicleSelectionIndexByKey = { ...defaults };
    State.round.modeConfig.confirmed.vehicleSelectionIndexByKey = { ...defaults };
}

function refreshSelectedVehicleSpawnPoolsFromModeConfig(useConfirmed: boolean): void {
    const selectionByKey = useConfirmed
        ? (State.round.modeConfig.confirmed.vehicleSelectionIndexByKey ?? {})
        : (State.round.modeConfig.vehicleSelectionIndexByKey ?? {});

    TEAM1_JET_SELECTED_SPAWN_SPECS = buildSelectedVehicleSpawnSpecsFromKnobs(
        ACTIVE_MAP_CONFIG.team1JetSpawns,
        READY_DIALOG_TEAM1_JET_KNOB_KEYS,
        selectionByKey,
        VEHICLE_PACKAGE_SLOT_BASE_JET
    );
    TEAM2_JET_SELECTED_SPAWN_SPECS = buildSelectedVehicleSpawnSpecsFromKnobs(
        ACTIVE_MAP_CONFIG.team2JetSpawns,
        READY_DIALOG_TEAM2_JET_KNOB_KEYS,
        selectionByKey,
        VEHICLE_PACKAGE_SLOT_BASE_JET
    );
    TEAM1_HELI_SELECTED_SPAWN_SPECS = buildSelectedVehicleSpawnSpecsFromKnobs(
        resolveHeliSpawnsForTeam(ACTIVE_MAP_CONFIG, TeamID.Team1),
        READY_DIALOG_TEAM1_HELI_KNOB_KEYS,
        selectionByKey,
        VEHICLE_PACKAGE_SLOT_BASE_HELI
    );
    TEAM2_HELI_SELECTED_SPAWN_SPECS = buildSelectedVehicleSpawnSpecsFromKnobs(
        resolveHeliSpawnsForTeam(ACTIVE_MAP_CONFIG, TeamID.Team2),
        READY_DIALOG_TEAM2_HELI_KNOB_KEYS,
        selectionByKey,
        VEHICLE_PACKAGE_SLOT_BASE_HELI
    );
    TEAM1_TANK_SELECTED_SPAWN_SPECS = buildSelectedVehicleSpawnSpecsFromKnobs(
        ACTIVE_MAP_CONFIG.team1TankSpawns,
        READY_DIALOG_TEAM1_GROUND_KNOB_KEYS,
        selectionByKey,
        VEHICLE_PACKAGE_SLOT_BASE_GROUND
    );
    TEAM2_TANK_SELECTED_SPAWN_SPECS = buildSelectedVehicleSpawnSpecsFromKnobs(
        ACTIVE_MAP_CONFIG.team2TankSpawns,
        READY_DIALOG_TEAM2_GROUND_KNOB_KEYS,
        selectionByKey,
        VEHICLE_PACKAGE_SLOT_BASE_GROUND
    );
    TEAM1_FAST_SELECTED_SPAWN_SPECS = buildSelectedTransportSpawnSpecsForTeam(
        ACTIVE_MAP_CONFIG,
        TeamID.Team1,
        selectionByKey
    );
    TEAM2_FAST_SELECTED_SPAWN_SPECS = buildSelectedTransportSpawnSpecsForTeam(
        ACTIVE_MAP_CONFIG,
        TeamID.Team2,
        selectionByKey
    );
}

function resolveVehicleSpawnVolumes(volumes: VehicleSpawnVolumeSpec[] | undefined): VehicleSpawnVolumeSpec[] {
    if (!volumes || volumes.length === 0) return [];
    return volumes.filter((volume) => volume.enabled !== false);
}

// Recomputes runtime spawn specs from current mode config and active map settings.
function refreshVehicleSpawnSpecsFromModeConfig(): void {
    refreshSelectedVehicleSpawnPoolsFromModeConfig(true);
    TEAM1_VEHICLE_SPAWN_SPECS = [
        ...TEAM1_JET_SELECTED_SPAWN_SPECS,
        ...TEAM1_HELI_SELECTED_SPAWN_SPECS,
        ...TEAM1_TANK_SELECTED_SPAWN_SPECS,
        ...TEAM1_FAST_SELECTED_SPAWN_SPECS,
    ];
    TEAM2_VEHICLE_SPAWN_SPECS = [
        ...TEAM2_JET_SELECTED_SPAWN_SPECS,
        ...TEAM2_HELI_SELECTED_SPAWN_SPECS,
        ...TEAM2_TANK_SELECTED_SPAWN_SPECS,
        ...TEAM2_FAST_SELECTED_SPAWN_SPECS,
    ];
}

// Applies updated runtime spawn specs to already-registered spawner slots.
function applyVehicleSpawnSpecsToExistingSlots(): void {
    if (State.vehicles.slots.length === 0) return;
    const team1BySlot: Record<number, VehicleSpawnSpec> = {};
    const team2BySlot: Record<number, VehicleSpawnSpec> = {};
    for (const spec of TEAM1_VEHICLE_SPAWN_SPECS) {
        team1BySlot[spec.slotNumber] = spec;
    }
    for (const spec of TEAM2_VEHICLE_SPAWN_SPECS) {
        team2BySlot[spec.slotNumber] = spec;
    }
    for (const slot of State.vehicles.slots) {
        const spec = slot.teamId === TeamID.Team1 ? team1BySlot[slot.slotNumber] : team2BySlot[slot.slotNumber];
        if (!spec) continue;
        if (slot.vehicleType !== spec.vehicle) {
            const priorVehicleId = slot.vehicleId;
            if (!isMatchLive() && priorVehicleId !== -1) {
                const priorVehicle = findVehicleById(priorVehicleId);
                if (priorVehicle) {
                    mod.UnspawnObject(priorVehicle);
                }
                delete State.vehicles.vehicleToSlot[priorVehicleId];
                slot.vehicleId = -1;
                slot.activeOwnerPid = undefined;
            }
            slot.vehicleType = spec.vehicle;
            configureVehicleSpawner(slot.spawner, slot.vehicleType);
        }
        slot.spawnPos = spec.pos;
        slot.spawnRot = spec.rot;
        refreshVehicleSlotAuthoritativeState(slot);
    }
}

// Applies the selected map's base anchors, spawn specs, and yaw offsets to the active runtime config.
// Also refreshes the Ready dialog map label so the UI matches the active map.
function applyMapConfig(mapKey: MapKey): void {
    ACTIVE_MAP_KEY = mapKey;
    ACTIVE_MAP_CONFIG = MAP_CONFIGS[ACTIVE_MAP_KEY];
    ACTIVE_CAPTURE_POINT_CONFIGS = ACTIVE_MAP_CONFIG.capturePoints ?? [];
    rebuildActiveCapturePointConfigIndex();
    MAIN_BASE_TEAM1_POS = ACTIVE_MAP_CONFIG.team1Base;
    MAIN_BASE_TEAM2_POS = ACTIVE_MAP_CONFIG.team2Base;
    VEHICLE_DEPLOY_SPAWN_POINT_ID_TEAM1 = ACTIVE_MAP_CONFIG.team1VehicleDeploySpawnPointId;
    VEHICLE_DEPLOY_SPAWN_POINT_ID_TEAM2 = ACTIVE_MAP_CONFIG.team2VehicleDeploySpawnPointId;
    TEAM1_AIRCRAFT_SPAWN_VOLUMES = resolveVehicleSpawnVolumes(ACTIVE_MAP_CONFIG.team1AircraftSpawnVolumes);
    TEAM2_AIRCRAFT_SPAWN_VOLUMES = resolveVehicleSpawnVolumes(ACTIVE_MAP_CONFIG.team2AircraftSpawnVolumes);
    TEAM1_TANK_SPAWN_VOLUMES = resolveVehicleSpawnVolumes(ACTIVE_MAP_CONFIG.team1TankSpawnVolumes);
    TEAM2_TANK_SPAWN_VOLUMES = resolveVehicleSpawnVolumes(ACTIVE_MAP_CONFIG.team2TankSpawnVolumes);
    TEAM1_VEHICLE_SLOT_INVENTORY_SPECS = buildRuntimeVehicleSlotInventoryForTeam(ACTIVE_MAP_CONFIG, TeamID.Team1);
    TEAM2_VEHICLE_SLOT_INVENTORY_SPECS = buildRuntimeVehicleSlotInventoryForTeam(ACTIVE_MAP_CONFIG, TeamID.Team2);
    syncReadyDialogVehicleSelectionsFromActiveMapConfig();
    refreshSelectedVehicleSpawnPoolsFromModeConfig(true);
    refreshVehicleSpawnSpecsFromModeConfig();
    VEHICLE_SPAWN_YAW_OFFSET_DEG = ACTIVE_MAP_CONFIG.vehicleSpawnYawOffsetDeg;
    // Apply the map's default aircraft ceiling, unless a custom override is active.
    syncAircraftCeilingFromMapConfig();

    updateReadyDialogMapLabelForAllPlayers();
    updateTeamNameWidgetsForAllPlayers();
}

function getVehicleDeploySpawnPointIdForTeam(teamId: TeamID): number | undefined {
    const spawnPointId = teamId === TeamID.Team1
        ? VEHICLE_DEPLOY_SPAWN_POINT_ID_TEAM1
        : teamId === TeamID.Team2
            ? VEHICLE_DEPLOY_SPAWN_POINT_ID_TEAM2
            : undefined;
    if (spawnPointId === undefined) return undefined;
    if (!Number.isFinite(spawnPointId)) return undefined;
    if (spawnPointId <= 0) return undefined;
    return Math.floor(spawnPointId);
}

function getVehicleSpawnVolumesForTeam(teamId: TeamID, volumeClass: VehicleSpawnVolumeClass): VehicleSpawnVolumeSpec[] {
    if (volumeClass === "aircraft") {
        return teamId === TeamID.Team1
            ? TEAM1_AIRCRAFT_SPAWN_VOLUMES
            : teamId === TeamID.Team2
                ? TEAM2_AIRCRAFT_SPAWN_VOLUMES
                : [];
    }
    return teamId === TeamID.Team1
        ? TEAM1_TANK_SPAWN_VOLUMES
        : teamId === TeamID.Team2
            ? TEAM2_TANK_SPAWN_VOLUMES
            : [];
}

// Best-effort map detection by comparing HQ positions to map base anchors (bidirectional check).
function detectMapKeyFromHqs(): MapKey | undefined {
    let hq1Pos: mod.Vector;
    let hq2Pos: mod.Vector;
    try {
        const hq1 = mod.GetHQ(1);
        const hq2 = mod.GetHQ(2);
        hq1Pos = mod.GetObjectPosition(hq1);
        hq2Pos = mod.GetObjectPosition(hq2);
    } catch {
        // Startup hardening: if HQ objects are not queryable yet, skip map detection for this pass.
        return undefined;
    }

    const keys = Object.keys(MAP_CONFIGS) as MapKey[];
    for (const key of keys) {
        const cfg = MAP_CONFIGS[key];
        let d11 = Number.POSITIVE_INFINITY;
        let d22 = Number.POSITIVE_INFINITY;
        let d12 = Number.POSITIVE_INFINITY;
        let d21 = Number.POSITIVE_INFINITY;
        try {
            d11 = mod.DistanceBetween(hq1Pos, cfg.team1Base);
            d22 = mod.DistanceBetween(hq2Pos, cfg.team2Base);
            d12 = mod.DistanceBetween(hq1Pos, cfg.team2Base);
            d21 = mod.DistanceBetween(hq2Pos, cfg.team1Base);
        } catch {
            // Skip this map config when distance checks cannot be evaluated safely.
            continue;
        }
        if (d11 <= MAP_DETECT_DISTANCE_METERS && d22 <= MAP_DETECT_DISTANCE_METERS) {
            return key;
        }

        if (d12 <= MAP_DETECT_DISTANCE_METERS && d21 <= MAP_DETECT_DISTANCE_METERS) {
            return key;
        }
    }

    return undefined;
}

// Finds the preset index matching left/right players; returns 0 if no exact match.
function findMatchupPresetIndex(leftPlayers: number, rightPlayers: number): number {
    for (let i = 0; i < MATCHUP_PRESETS.length; i++) {
        const preset = MATCHUP_PRESETS[i];
        if (
            preset.leftPlayers === leftPlayers &&
            preset.rightPlayers === rightPlayers
        ) {
            return i;
        }
    }
    return 0;
}

//#endregion ----------------- Map + Matchup Helpers --------------------
