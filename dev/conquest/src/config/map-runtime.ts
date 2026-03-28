// @ts-nocheck
// Module: config/map-runtime -- map detection/apply and spawn-preset helpers

//#region -------------------- Map + Matchup Helpers --------------------

// Returns the Ready-dialog display stringkey for the current map.
function getMapNameKey(mapKey: MapKey): number {
    return MAP_NAME_STRINGKEYS[mapKey] ?? mod.stringkeys.twl.system.unknownPlayer;
}

// Builds a fallback helicopter spawn list from tank spawn positions when no map-specific heli list exists.
function buildHeliSpawnsFromTankSpawns(spawns: VehicleSpawnAnchorSpec[], _team: TeamID): VehicleSpawnAnchorSpec[] {
    return spawns.map((spawn) => ({
        slotNumber: spawn.slotNumber,
        pos: spawn.pos,
        rot: spawn.rot,
    }));
}

// Returns heli spawn specs for one team, falling back to tank-anchor-derived heli spawns when absent.
function resolveHeliSpawnsForTeam(cfg: MapConfig, team: TeamID): VehicleSpawnAnchorSpec[] {
    if (team === TeamID.Team1) {
        if (cfg.team1HeliSpawns && cfg.team1HeliSpawns.length > 0) return cfg.team1HeliSpawns;
        return buildHeliSpawnsFromTankSpawns(cfg.team1TankSpawns, TeamID.Team1);
    }
    if (cfg.team2HeliSpawns && cfg.team2HeliSpawns.length > 0) return cfg.team2HeliSpawns;
    return buildHeliSpawnsFromTankSpawns(cfg.team2TankSpawns, TeamID.Team2);
}

function cloneVehicleSpawnAnchors(spawns: VehicleSpawnAnchorSpec[] | undefined): VehicleSpawnAnchorSpec[] {
    if (!spawns || spawns.length === 0) return [];
    return spawns.map((spawn) => ({
        slotNumber: spawn.slotNumber,
        pos: spawn.pos,
        rot: spawn.rot,
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

function remapVehicleSpawnAnchorsForRuntime(
    baseSpawns: VehicleSpawnAnchorSpec[] | undefined,
    runtimeStartSlotNumber: number,
    maxCount: number
): VehicleSpawnAnchorSpec[] {
    const next = cloneVehicleSpawnAnchors(baseSpawns).slice(0, maxCount);
    for (let i = 0; i < next.length; i++) {
        next[i].slotNumber = runtimeStartSlotNumber + i;
    }
    return next;
}

function createVehicleSpawnSpec(anchor: VehicleSpawnAnchorSpec, vehicle: mod.VehicleList): VehicleSpawnSpec {
    return {
        slotNumber: anchor.slotNumber,
        pos: anchor.pos,
        rot: anchor.rot,
        vehicle,
    };
}

function getVehicleBootstrapTypeForKnobKey(knobKey: string): mod.VehicleList {
    const options = getReadyDialogVehicleOptionsForKnobKey(knobKey);
    for (let i = 0; i < options.length; i++) {
        if (options[i].vehicle !== undefined) return options[i].vehicle as mod.VehicleList;
    }
    return VEHICLE_ABRAMS;
}

function buildRuntimeVehicleSlotInventorySpecsFromKnobs(
    baseSpawns: VehicleSpawnAnchorSpec[] | undefined,
    knobKeys: readonly string[],
    selectionByKey: Record<string, number>,
    runtimeStartSlotNumber: number
): VehicleSpawnSpec[] {
    const remapped = remapVehicleSpawnAnchorsForRuntime(baseSpawns, runtimeStartSlotNumber, knobKeys.length);
    const next: VehicleSpawnSpec[] = [];
    for (let i = 0; i < remapped.length && i < knobKeys.length; i++) {
        const knobKey = knobKeys[i];
        const selectedVehicle = getReadyDialogSelectedVehicleForKnobKey(knobKey, selectionByKey) ?? getVehicleBootstrapTypeForKnobKey(knobKey);
        next.push(createVehicleSpawnSpec(remapped[i], selectedVehicle));
    }
    return next;
}

function buildRuntimeTransportSlotInventoryForTeam(
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
        const selectedVehicle = getReadyDialogSelectedVehicleForKnobKey(knobKey, selectionByKey) ?? getVehicleBootstrapTypeForKnobKey(knobKey);
        const runtimeSlotNumber = VEHICLE_PACKAGE_SLOT_BASE_FAST + i;
        const useHeliAnchor = i >= 2 && isTransportHeliVehicleType(selectedVehicle);
        const baseSpawn = useHeliAnchor
            ? heliSpawns[i]
            : fastMoverSpawns[i];
        if (!baseSpawn) continue;

        next.push(createVehicleSpawnSpec({
            slotNumber: runtimeSlotNumber,
            pos: baseSpawn.pos,
            rot: baseSpawn.rot,
        }, selectedVehicle));
    }

    return next;
}

function buildRuntimeVehicleSlotInventoryForTeam(cfg: MapConfig, team: TeamID): VehicleSpawnSpec[] {
    const defaultGameMode = READY_DIALOG_GAME_MODE_OPTIONS[READY_DIALOG_GAME_MODE_DEFAULT_INDEX];
    const selectionByKey = buildReadyDialogVehicleSelectionIndexByGameMode(cfg, defaultGameMode);
    const jets = buildRuntimeVehicleSlotInventorySpecsFromKnobs(
        team === TeamID.Team1 ? (cfg.team1JetSpawns ?? []) : (cfg.team2JetSpawns ?? []),
        team === TeamID.Team1 ? READY_DIALOG_TEAM1_JET_KNOB_KEYS : READY_DIALOG_TEAM2_JET_KNOB_KEYS,
        selectionByKey,
        VEHICLE_PACKAGE_SLOT_BASE_JET,
    );
    const helis = buildRuntimeVehicleSlotInventorySpecsFromKnobs(
        resolveHeliSpawnsForTeam(cfg, team).slice(0, 2),
        team === TeamID.Team1 ? READY_DIALOG_TEAM1_HELI_KNOB_KEYS : READY_DIALOG_TEAM2_HELI_KNOB_KEYS,
        selectionByKey,
        VEHICLE_PACKAGE_SLOT_BASE_HELI,
    );
    const ground = buildRuntimeVehicleSlotInventorySpecsFromKnobs(
        team === TeamID.Team1 ? cfg.team1TankSpawns : cfg.team2TankSpawns,
        team === TeamID.Team1 ? READY_DIALOG_TEAM1_GROUND_KNOB_KEYS : READY_DIALOG_TEAM2_GROUND_KNOB_KEYS,
        selectionByKey,
        VEHICLE_PACKAGE_SLOT_BASE_GROUND,
    );
    const fast = buildRuntimeTransportSlotInventoryForTeam(cfg, team, selectionByKey);
    return [...jets, ...helis, ...ground, ...fast];
}

function buildSelectedVehicleSpawnSpecsFromKnobs(
    baseSpawns: VehicleSpawnAnchorSpec[] | undefined,
    knobKeys: readonly string[],
    selectionByKey: Record<string, number>,
    runtimeStartSlotNumber: number
): VehicleSpawnSpec[] {
    const remapped = remapVehicleSpawnAnchorsForRuntime(baseSpawns, runtimeStartSlotNumber, knobKeys.length);
    const next: VehicleSpawnSpec[] = [];
    for (let i = 0; i < remapped.length && i < knobKeys.length; i++) {
        const selectedVehicle = getReadyDialogSelectedVehicleForKnobKey(knobKeys[i], selectionByKey);
        if (selectedVehicle === undefined) continue;
        next.push(createVehicleSpawnSpec(remapped[i], selectedVehicle));
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

function getReadyDialogPresetPackage(cfg: MapConfig, gameModeKey: number): ReadyDialogPresetPackage | undefined {
    return cfg.readyDialogPresetPackages?.[gameModeKey];
}

type MapConfigObjIdValidationEntry = {
    label: string;
    objId?: number;
    required: boolean;
    expectedRangeMin?: number;
    expectedRangeMax?: number;
};

function isValidConfiguredObjId(objId: number | undefined): objId is number {
    return objId !== undefined && Number.isFinite(objId) && objId > 0;
}

function addUniqueValidationWarning(target: string[], warning: string): void {
    for (let i = 0; i < target.length; i++) {
        if (target[i] === warning) return;
    }
    target.push(warning);
}

// Returns true when an ObjId falls within one reserved inclusive range.
function isObjIdWithinInclusiveRange(objId: number, min: number, max: number): boolean {
    return objId >= min && objId <= max;
}

// Derives the Phase 7 main-base interactable action from the locked even/odd rubric.
function classifyMainBaseInteractableActionFromObjId(objId: number): WorldInteractableAction {
    return objId % 2 === 0
        ? "open_ready_dialog"
        : "open_vehicle_spawn_menu";
}

// Builds the active derived world-interactable configs from the authored per-map ObjId arrays.
function buildWorldInteractableConfigsFromMapConfig(cfg: MapConfig): WorldInteractableConfig[] {
    const configs: WorldInteractableConfig[] = [];
    const mainBaseIds = cfg.mainBaseInteractableObjIds ?? [];
    const flagIds = cfg.flagInteractableObjIds ?? [];

    for (let i = 0; i < mainBaseIds.length; i++) {
        const objId = Math.floor(mainBaseIds[i]);
        if (!isValidConfiguredObjId(objId)) continue;
        const action = classifyMainBaseInteractableActionFromObjId(objId);
        configs.push({
            objId,
            scope: "main_base",
            action,
        });
    }

    for (let i = 0; i < flagIds.length; i++) {
        const objId = Math.floor(flagIds[i]);
        if (!isValidConfiguredObjId(objId)) continue;
        configs.push({
            objId,
            scope: "point",
            action: "open_ammo_resupply_menu",
        });
    }

    return configs;
}

function buildMapConfigObjIdValidationEntries(cfg: MapConfig): MapConfigObjIdValidationEntry[] {
    const entries: MapConfigObjIdValidationEntry[] = [
        { label: "team1MainBaseTriggerId", objId: cfg.team1MainBaseTriggerId, required: false },
        { label: "team2MainBaseTriggerId", objId: cfg.team2MainBaseTriggerId, required: false },
        { label: "team1MainBaseBufferTriggerId", objId: cfg.team1MainBaseBufferTriggerId, required: true },
        { label: "team2MainBaseBufferTriggerId", objId: cfg.team2MainBaseBufferTriggerId, required: true },
        { label: "groundCombatZoneTriggerId", objId: cfg.groundCombatZoneTriggerId, required: true },
        { label: "team1VehicleDeploySpawnPointId", objId: cfg.team1VehicleDeploySpawnPointId, required: true },
        { label: "team2VehicleDeploySpawnPointId", objId: cfg.team2VehicleDeploySpawnPointId, required: true },
    ];

    const capturePoints = cfg.capturePoints ?? [];
    for (let i = 0; i < capturePoints.length; i++) {
        entries.push({
            label: `capturePoints[${i}](${capturePoints[i].label})`,
            objId: capturePoints[i].objId,
            required: true,
        });
    }

    const mainBaseIds = cfg.mainBaseInteractableObjIds ?? [];
    for (let i = 0; i < mainBaseIds.length; i++) {
        entries.push({
            label: `mainBaseInteractableObjIds[${i}]`,
            objId: mainBaseIds[i],
            required: false,
            expectedRangeMin: 1000,
            expectedRangeMax: 1049,
        });
    }

    const flagIds = cfg.flagInteractableObjIds ?? [];
    for (let i = 0; i < flagIds.length; i++) {
        entries.push({
            label: `flagInteractableObjIds[${i}]`,
            objId: flagIds[i],
            required: false,
            expectedRangeMin: 1050,
            expectedRangeMax: 1099,
        });
    }

    return entries;
}

function buildMapConfigValidationWarnings(mapKey: MapKey, cfg: MapConfig): string[] {
    const warnings: string[] = [];
    const entries = buildMapConfigObjIdValidationEntries(cfg);
    const labelsByObjId: Record<number, string[]> = {};

    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        if (!isValidConfiguredObjId(entry.objId)) {
            if (entry.required) {
                addUniqueValidationWarning(
                    warnings,
                    `[CONFIG WARNING] ${mapKey}: missing or invalid ${entry.label}; related runtime behavior will be disabled or unreliable.`
                );
            }
            continue;
        }

        const objId = Math.floor(entry.objId);
        if (
            entry.expectedRangeMin !== undefined &&
            entry.expectedRangeMax !== undefined &&
            !isObjIdWithinInclusiveRange(objId, entry.expectedRangeMin, entry.expectedRangeMax)
        ) {
            addUniqueValidationWarning(
                warnings,
                `[CONFIG WARNING] ${mapKey}: ${entry.label}=${objId} is outside reserved range ${entry.expectedRangeMin}-${entry.expectedRangeMax}.`
            );
        }
        if (!labelsByObjId[objId]) {
            labelsByObjId[objId] = [];
        }
        labelsByObjId[objId].push(entry.label);
    }

    for (const objIdKey in labelsByObjId) {
        const labels = labelsByObjId[Number(objIdKey)];
        if (!labels || labels.length <= 1) continue;
        addUniqueValidationWarning(
            warnings,
            `[CONFIG WARNING] ${mapKey}: duplicate ObjId ${objIdKey} is assigned to ${labels.join(", ")}.`
        );
    }

    return warnings;
}

function syncActiveMapValidationWarnings(mapKey: MapKey, cfg: MapConfig): void {
    State.round.boundary.validationWarnings = buildMapConfigValidationWarnings(mapKey, cfg);
}

function replayActiveMapValidationWarningsToPlayer(player: mod.Player): void {
    if (!player || !mod.IsPlayerValid(player)) return;
    const warnings = State.round.boundary.validationWarnings;
    if (!warnings || warnings.length <= 0) return;
    for (let i = 0; i < warnings.length; i++) {
        sendHighlightedWorldLogMessage(
            mod.Message(mod.stringkeys.twl.system.genericCounter, warnings[i]),
            false,
            player,
            mod.stringkeys.twl.system.genericCounter
        );
    }
}

function replayActiveMapValidationWarningsToAllPlayers(): void {
    const warnings = State.round.boundary.validationWarnings;
    if (!warnings || warnings.length <= 0) return;
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const player = mod.ValueInArray(players, i) as mod.Player;
        if (!player || !mod.IsPlayerValid(player)) continue;
        replayActiveMapValidationWarningsToPlayer(player);
    }
}

function buildReadyDialogVehicleSelectionIndexFromPresetPackage(
    presetPackage: ReadyDialogPresetPackage | undefined
): Record<string, number> {
    const next: Record<string, number> = {};
    for (const knobKey of READY_DIALOG_ALL_VEHICLE_KNOB_KEYS) {
        next[knobKey] = getReadyDialogVehicleOptionIndexForVehicle(knobKey, undefined);
    }

    if (!presetPackage) {
        return next;
    }

    for (const knobKey in presetPackage.vehicleSelectionByKey) {
        next[knobKey] = getReadyDialogVehicleOptionIndexForVehicle(
            knobKey,
            presetPackage.vehicleSelectionByKey[knobKey]
        );
    }

    return next;
}

function buildReadyDialogVehicleSelectionIndexByGameMode(_cfg: MapConfig, gameModeKey: number): Record<string, number> {
    return buildReadyDialogVehicleSelectionIndexFromPresetPackage(getReadyDialogPresetPackage(_cfg, gameModeKey));
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
    MAIN_BASE_TRIGGER_ID_TEAM1 = ACTIVE_MAP_CONFIG.team1MainBaseTriggerId;
    MAIN_BASE_TRIGGER_ID_TEAM2 = ACTIVE_MAP_CONFIG.team2MainBaseTriggerId;
    MAIN_BASE_BUFFER_TRIGGER_ID_TEAM1 = ACTIVE_MAP_CONFIG.team1MainBaseBufferTriggerId;
    MAIN_BASE_BUFFER_TRIGGER_ID_TEAM2 = ACTIVE_MAP_CONFIG.team2MainBaseBufferTriggerId;
    GROUND_COMBAT_ZONE_TRIGGER_ID = ACTIVE_MAP_CONFIG.groundCombatZoneTriggerId;
    VEHICLE_DEPLOY_SPAWN_POINT_ID_TEAM1 = ACTIVE_MAP_CONFIG.team1VehicleDeploySpawnPointId;
    VEHICLE_DEPLOY_SPAWN_POINT_ID_TEAM2 = ACTIVE_MAP_CONFIG.team2VehicleDeploySpawnPointId;
    TEAM1_AIRCRAFT_SPAWN_VOLUMES = resolveVehicleSpawnVolumes(ACTIVE_MAP_CONFIG.team1AircraftSpawnVolumes);
    TEAM2_AIRCRAFT_SPAWN_VOLUMES = resolveVehicleSpawnVolumes(ACTIVE_MAP_CONFIG.team2AircraftSpawnVolumes);
    TEAM1_TANK_SPAWN_VOLUMES = resolveVehicleSpawnVolumes(ACTIVE_MAP_CONFIG.team1TankSpawnVolumes);
    TEAM2_TANK_SPAWN_VOLUMES = resolveVehicleSpawnVolumes(ACTIVE_MAP_CONFIG.team2TankSpawnVolumes);
    TEAM1_VEHICLE_SLOT_INVENTORY_SPECS = buildRuntimeVehicleSlotInventoryForTeam(ACTIVE_MAP_CONFIG, TeamID.Team1);
    TEAM2_VEHICLE_SLOT_INVENTORY_SPECS = buildRuntimeVehicleSlotInventoryForTeam(ACTIVE_MAP_CONFIG, TeamID.Team2);
    syncActiveWorldInteractableConfigs(buildWorldInteractableConfigsFromMapConfig(ACTIVE_MAP_CONFIG));
    configureActiveWorldInteractables();
    syncActiveMapValidationWarnings(ACTIVE_MAP_KEY, ACTIVE_MAP_CONFIG);
    const defaultGameMode = READY_DIALOG_GAME_MODE_OPTIONS[READY_DIALOG_GAME_MODE_DEFAULT_INDEX];
    const defaultPlayersPerSide = getReadyDialogPresetPlayersPerSide(defaultGameMode);
    const defaultVehicleSelections = buildReadyDialogVehicleSelectionIndexByGameMode(ACTIVE_MAP_CONFIG, defaultGameMode);
    State.round.autoStartMinActivePlayers = defaultPlayersPerSide;
    State.round.modeConfig.gameModeIndex = READY_DIALOG_GAME_MODE_DEFAULT_INDEX;
    State.round.modeConfig.gameMode = defaultGameMode;
    State.round.modeConfig.autoStartMinActivePlayers = defaultPlayersPerSide;
    State.round.modeConfig.vehicleSelectionIndexByKey = { ...defaultVehicleSelections };
    State.round.modeConfig.confirmed.gameMode = defaultGameMode;
    State.round.modeConfig.confirmed.autoStartMinActivePlayers = defaultPlayersPerSide;
    State.round.modeConfig.confirmed.vehicleSelectionIndexByKey = { ...defaultVehicleSelections };
    refreshSelectedVehicleSpawnPoolsFromModeConfig(true);
    refreshVehicleSpawnSpecsFromModeConfig();
    VEHICLE_SPAWN_YAW_OFFSET_DEG = ACTIVE_MAP_CONFIG.vehicleSpawnYawOffsetDeg;
    // Apply the map's default aircraft ceiling, unless a custom override is active.
    syncAircraftCeilingFromMapConfig();

    invalidateHiddenReadyDialogCacheForAllPlayers();
    updateReadyDialogMapLabelForAllPlayers();
    updateTeamNameWidgetsForAllPlayers();
    replayActiveMapValidationWarningsToAllPlayers();
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

function getMainBaseTriggerIdForTeam(teamId: TeamID): number | undefined {
    const triggerId = teamId === TeamID.Team1
        ? MAIN_BASE_TRIGGER_ID_TEAM1
        : teamId === TeamID.Team2
            ? MAIN_BASE_TRIGGER_ID_TEAM2
            : undefined;
    if (triggerId === undefined) return undefined;
    if (!Number.isFinite(triggerId)) return undefined;
    if (triggerId <= 0) return undefined;
    return Math.floor(triggerId);
}

function getMainBaseBufferTriggerIdForTeam(teamId: TeamID): number | undefined {
    const triggerId = teamId === TeamID.Team1
        ? MAIN_BASE_BUFFER_TRIGGER_ID_TEAM1
        : teamId === TeamID.Team2
            ? MAIN_BASE_BUFFER_TRIGGER_ID_TEAM2
            : undefined;
    if (triggerId === undefined) return undefined;
    if (!Number.isFinite(triggerId)) return undefined;
    if (triggerId <= 0) return undefined;
    return Math.floor(triggerId);
}

function getGroundCombatZoneTriggerId(): number | undefined {
    if (GROUND_COMBAT_ZONE_TRIGGER_ID === undefined) return undefined;
    if (!Number.isFinite(GROUND_COMBAT_ZONE_TRIGGER_ID)) return undefined;
    if (GROUND_COMBAT_ZONE_TRIGGER_ID <= 0) return undefined;
    return Math.floor(GROUND_COMBAT_ZONE_TRIGGER_ID);
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
