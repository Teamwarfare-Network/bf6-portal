// @ts-nocheck
// Module: config/map-runtime -- map detection/apply and spawn-preset helpers

//#region -------------------- Map + Matchup Helpers --------------------

// Returns the Ready-dialog display stringkey for the current map.
function getMapNameKey(mapKey: MapKey): number {
    return MAP_NAME_STRINGKEYS[mapKey] ?? mod.stringkeys.twl.system.unknownPlayer;
}

// Determines whether the current mode selection should use helicopter spawn specs.
function isHeliGameMode(gameModeKey: number): boolean {
    return (
        gameModeKey === mod.stringkeys.twl.readyDialog.gameModeHelisLadder
        || gameModeKey === mod.stringkeys.twl.readyDialog.gameModeHelisPractice
        || gameModeKey === mod.stringkeys.twl.readyDialog.gameModeHelisCustom
    );
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

// Resolves a ready-dialog vehicle override index to a valid VehicleList entry.
function getReadyDialogVehicleListByIndex(index: number): mod.VehicleList {
    return READY_DIALOG_VEHICLE_LIST[index] ?? READY_DIALOG_VEHICLE_LIST[0];
}

// Applies one vehicle override to every spawn spec in the provided list.
function applyVehicleOverrideToSpawns(spawns: VehicleSpawnSpec[], vehicle: mod.VehicleList): VehicleSpawnSpec[] {
    return spawns.map((spawn) => ({
        slotNumber: spawn.slotNumber,
        pos: spawn.pos,
        rot: spawn.rot,
        vehicle,
    }));
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

function getReadyDialogVehicleOptionsForKnobKey(knobKey: string): ReadyDialogVehicleOption[] {
    if (knobKey.indexOf("Jet") >= 0) return READY_DIALOG_JET_VEHICLE_OPTIONS;
    if (knobKey.indexOf("Heli") >= 0) return READY_DIALOG_HELI_VEHICLE_OPTIONS;
    if (knobKey.indexOf("Ground") >= 0) return READY_DIALOG_GROUND_VEHICLE_OPTIONS;
    if (knobKey.indexOf("Fast") >= 0) return READY_DIALOG_FAST_VEHICLE_OPTIONS;
    return [];
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

function buildReadyDialogVehicleSelectionIndexByKeyFromMapConfig(cfg: MapConfig): Record<string, number> {
    const next: Record<string, number> = {};
    const team1Helis = resolveHeliSpawnsForTeam(cfg, TeamID.Team1);
    const team2Helis = resolveHeliSpawnsForTeam(cfg, TeamID.Team2);
    const team1Jets = cfg.team1JetSpawns ?? [];
    const team2Jets = cfg.team2JetSpawns ?? [];
    const team1Ground = cfg.team1TankSpawns ?? [];
    const team2Ground = cfg.team2TankSpawns ?? [];
    const team1Fast = cfg.team1FastMoverSpawns ?? [];
    const team2Fast = cfg.team2FastMoverSpawns ?? [];

    next[READY_DIALOG_TEAM1_JET_KNOB_KEYS[0]] = getReadyDialogVehicleOptionIndexForVehicle(READY_DIALOG_TEAM1_JET_KNOB_KEYS[0], team1Jets[0]?.vehicle);
    next[READY_DIALOG_TEAM1_JET_KNOB_KEYS[1]] = getReadyDialogVehicleOptionIndexForVehicle(READY_DIALOG_TEAM1_JET_KNOB_KEYS[1], team1Jets[1]?.vehicle);
    next[READY_DIALOG_TEAM2_JET_KNOB_KEYS[0]] = getReadyDialogVehicleOptionIndexForVehicle(READY_DIALOG_TEAM2_JET_KNOB_KEYS[0], team2Jets[0]?.vehicle);
    next[READY_DIALOG_TEAM2_JET_KNOB_KEYS[1]] = getReadyDialogVehicleOptionIndexForVehicle(READY_DIALOG_TEAM2_JET_KNOB_KEYS[1], team2Jets[1]?.vehicle);

    next[READY_DIALOG_TEAM1_HELI_KNOB_KEYS[0]] = getReadyDialogVehicleOptionIndexForVehicle(READY_DIALOG_TEAM1_HELI_KNOB_KEYS[0], team1Helis[0]?.vehicle);
    next[READY_DIALOG_TEAM1_HELI_KNOB_KEYS[1]] = getReadyDialogVehicleOptionIndexForVehicle(READY_DIALOG_TEAM1_HELI_KNOB_KEYS[1], team1Helis[1]?.vehicle);
    next[READY_DIALOG_TEAM2_HELI_KNOB_KEYS[0]] = getReadyDialogVehicleOptionIndexForVehicle(READY_DIALOG_TEAM2_HELI_KNOB_KEYS[0], team2Helis[0]?.vehicle);
    next[READY_DIALOG_TEAM2_HELI_KNOB_KEYS[1]] = getReadyDialogVehicleOptionIndexForVehicle(READY_DIALOG_TEAM2_HELI_KNOB_KEYS[1], team2Helis[1]?.vehicle);

    for (let i = 0; i < READY_DIALOG_TEAM1_GROUND_KNOB_KEYS.length; i++) {
        next[READY_DIALOG_TEAM1_GROUND_KNOB_KEYS[i]] = getReadyDialogVehicleOptionIndexForVehicle(READY_DIALOG_TEAM1_GROUND_KNOB_KEYS[i], team1Ground[i]?.vehicle);
        next[READY_DIALOG_TEAM2_GROUND_KNOB_KEYS[i]] = getReadyDialogVehicleOptionIndexForVehicle(READY_DIALOG_TEAM2_GROUND_KNOB_KEYS[i], team2Ground[i]?.vehicle);
        next[READY_DIALOG_TEAM1_FAST_KNOB_KEYS[i]] = getReadyDialogVehicleOptionIndexForVehicle(READY_DIALOG_TEAM1_FAST_KNOB_KEYS[i], team1Fast[i]?.vehicle);
        next[READY_DIALOG_TEAM2_FAST_KNOB_KEYS[i]] = getReadyDialogVehicleOptionIndexForVehicle(READY_DIALOG_TEAM2_FAST_KNOB_KEYS[i], team2Fast[i]?.vehicle);
    }

    return next;
}

function syncReadyDialogVehicleSelectionsFromActiveMapConfig(): void {
    const defaults = buildReadyDialogVehicleSelectionIndexByKeyFromMapConfig(ACTIVE_MAP_CONFIG);
    State.round.modeConfig.vehicleSelectionIndexByKey = { ...defaults };
    State.round.modeConfig.confirmed.vehicleSelectionIndexByKey = { ...defaults };
}

function applyVehicleSelectionOverridesToSpawnSpecs(
    baseSpawns: VehicleSpawnSpec[] | undefined,
    knobKeys: readonly string[],
    selectionByKey: Record<string, number>
): VehicleSpawnSpec[] {
    const next = cloneVehicleSpawnSpecs(baseSpawns);
    for (let i = 0; i < next.length && i < knobKeys.length; i++) {
        const selectedVehicle = getReadyDialogSelectedVehicleForKnobKey(knobKeys[i], selectionByKey);
        if (selectedVehicle !== undefined) next[i].vehicle = selectedVehicle;
    }
    return next;
}

function applyHeliSelectionOverridesToSpawnSpecs(
    baseSpawns: VehicleSpawnSpec[] | undefined,
    knobKeys: readonly [string, string],
    selectionByKey: Record<string, number>
): VehicleSpawnSpec[] {
    const next = cloneVehicleSpawnSpecs(baseSpawns);
    for (let i = 0; i < next.length; i++) {
        const knobKey = (i === 0 || i === 2) ? knobKeys[0] : knobKeys[1];
        const selectedVehicle = getReadyDialogSelectedVehicleForKnobKey(knobKey, selectionByKey);
        if (selectedVehicle !== undefined) next[i].vehicle = selectedVehicle;
    }
    return next;
}

function refreshSelectedVehicleSpawnPoolsFromModeConfig(useConfirmed: boolean): void {
    const selectionByKey = useConfirmed
        ? (State.round.modeConfig.confirmed.vehicleSelectionIndexByKey ?? {})
        : (State.round.modeConfig.vehicleSelectionIndexByKey ?? {});

    TEAM1_TANK_SELECTED_SPAWN_SPECS = applyVehicleSelectionOverridesToSpawnSpecs(ACTIVE_MAP_CONFIG.team1TankSpawns, READY_DIALOG_TEAM1_GROUND_KNOB_KEYS, selectionByKey);
    TEAM2_TANK_SELECTED_SPAWN_SPECS = applyVehicleSelectionOverridesToSpawnSpecs(ACTIVE_MAP_CONFIG.team2TankSpawns, READY_DIALOG_TEAM2_GROUND_KNOB_KEYS, selectionByKey);
    TEAM1_HELI_SELECTED_SPAWN_SPECS = applyHeliSelectionOverridesToSpawnSpecs(resolveHeliSpawnsForTeam(ACTIVE_MAP_CONFIG, TeamID.Team1), READY_DIALOG_TEAM1_HELI_KNOB_KEYS, selectionByKey);
    TEAM2_HELI_SELECTED_SPAWN_SPECS = applyHeliSelectionOverridesToSpawnSpecs(resolveHeliSpawnsForTeam(ACTIVE_MAP_CONFIG, TeamID.Team2), READY_DIALOG_TEAM2_HELI_KNOB_KEYS, selectionByKey);
    TEAM1_JET_SELECTED_SPAWN_SPECS = applyVehicleSelectionOverridesToSpawnSpecs(ACTIVE_MAP_CONFIG.team1JetSpawns, READY_DIALOG_TEAM1_JET_KNOB_KEYS, selectionByKey);
    TEAM2_JET_SELECTED_SPAWN_SPECS = applyVehicleSelectionOverridesToSpawnSpecs(ACTIVE_MAP_CONFIG.team2JetSpawns, READY_DIALOG_TEAM2_JET_KNOB_KEYS, selectionByKey);
    TEAM1_FAST_SELECTED_SPAWN_SPECS = applyVehicleSelectionOverridesToSpawnSpecs(ACTIVE_MAP_CONFIG.team1FastMoverSpawns, READY_DIALOG_TEAM1_FAST_KNOB_KEYS, selectionByKey);
    TEAM2_FAST_SELECTED_SPAWN_SPECS = applyVehicleSelectionOverridesToSpawnSpecs(ACTIVE_MAP_CONFIG.team2FastMoverSpawns, READY_DIALOG_TEAM2_FAST_KNOB_KEYS, selectionByKey);
}

function resolveVehicleSpawnVolumes(volumes: VehicleSpawnVolumeSpec[] | undefined): VehicleSpawnVolumeSpec[] {
    if (!volumes || volumes.length === 0) return [];
    return volumes.filter((volume) => volume.enabled !== false);
}

// Recomputes runtime spawn specs from current mode config and active map settings.
function refreshVehicleSpawnSpecsFromModeConfig(): void {
    refreshSelectedVehicleSpawnPoolsFromModeConfig(true);
    const useHelis = isHeliGameMode(State.round.modeConfig.confirmed.gameMode);
    if (useHelis) {
        const baseT1 = TEAM1_HELI_SELECTED_SPAWN_SPECS.length > 0 ? TEAM1_HELI_SELECTED_SPAWN_SPECS : resolveHeliSpawnsForTeam(ACTIVE_MAP_CONFIG, TeamID.Team1);
        const baseT2 = TEAM2_HELI_SELECTED_SPAWN_SPECS.length > 0 ? TEAM2_HELI_SELECTED_SPAWN_SPECS : resolveHeliSpawnsForTeam(ACTIVE_MAP_CONFIG, TeamID.Team2);
        if (State.round.modeConfig.confirmed.vehicleOverrideEnabled) {
            // Global override: use one selected helicopter for all helicopter spawn slots.
            const overrideVehicle = getReadyDialogVehicleListByIndex(State.round.modeConfig.confirmed.vehicleIndexT1);
            TEAM1_VEHICLE_SPAWN_SPECS = applyVehicleOverrideToSpawns(baseT1, overrideVehicle);
            TEAM2_VEHICLE_SPAWN_SPECS = applyVehicleOverrideToSpawns(baseT2, overrideVehicle);
            return;
        }
        TEAM1_VEHICLE_SPAWN_SPECS = baseT1;
        TEAM2_VEHICLE_SPAWN_SPECS = baseT2;
        return;
    }
    TEAM1_VEHICLE_SPAWN_SPECS = TEAM1_TANK_SELECTED_SPAWN_SPECS;
    TEAM2_VEHICLE_SPAWN_SPECS = TEAM2_TANK_SELECTED_SPAWN_SPECS;
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
        if (slot.vehicleType === spec.vehicle) continue;
        slot.vehicleType = spec.vehicle;
        configureVehicleSpawner(slot.spawner, slot.vehicleType);
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
