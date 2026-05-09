// @ts-nocheck
// Module: config/runtime -- active map state, derived spawn specs, and runtime map constants

// Change this MapKey to switch active map configuration for that map, only one map can be active at a time.
let ACTIVE_MAP_KEY: MapKey = "Operation_Firestorm";

// Expected to include team bases + at least one spawn per team, with unique slotNumber values matching per side.
let ACTIVE_MAP_CONFIG = MAP_CONFIGS[ACTIVE_MAP_KEY];
let ACTIVE_CAPTURE_POINT_CONFIGS: CapturePointConfig[] = ACTIVE_MAP_CONFIG.capturePoints ?? [];
const ACTIVE_CAPTURE_POINT_CONFIG_BY_OBJ_ID: Record<number, CapturePointConfig> = {};
let ACTIVE_WORLD_INTERACTABLE_CONFIGS: WorldInteractableConfig[] = [];
const ACTIVE_WORLD_INTERACTABLE_CONFIG_BY_OBJ_ID: Record<number, WorldInteractableConfig> = {};

// Rebuilds the active capture-point config lookup map keyed by ObjId.
function rebuildActiveCapturePointConfigIndex(): void {
    for (const key of Object.keys(ACTIVE_CAPTURE_POINT_CONFIG_BY_OBJ_ID)) {
        delete ACTIVE_CAPTURE_POINT_CONFIG_BY_OBJ_ID[Number(key)];
    }
    for (let i = 0; i < ACTIVE_CAPTURE_POINT_CONFIGS.length; i++) {
        const cp = ACTIVE_CAPTURE_POINT_CONFIGS[i];
        ACTIVE_CAPTURE_POINT_CONFIG_BY_OBJ_ID[cp.objId] = cp;
    }
}

// Returns active capture-point config for one ObjId, if present.
function getActiveCapturePointConfigByObjId(objId: number): CapturePointConfig | undefined {
    return ACTIVE_CAPTURE_POINT_CONFIG_BY_OBJ_ID[objId];
}

// Rebuilds the active world-interactable lookup map keyed by ObjId.
function rebuildActiveWorldInteractableConfigIndex(): void {
    for (const key of Object.keys(ACTIVE_WORLD_INTERACTABLE_CONFIG_BY_OBJ_ID)) {
        delete ACTIVE_WORLD_INTERACTABLE_CONFIG_BY_OBJ_ID[Number(key)];
    }
    for (let i = 0; i < ACTIVE_WORLD_INTERACTABLE_CONFIGS.length; i++) {
        const cfg = ACTIVE_WORLD_INTERACTABLE_CONFIGS[i];
        ACTIVE_WORLD_INTERACTABLE_CONFIG_BY_OBJ_ID[cfg.objId] = cfg;
    }
}

// Replaces the active derived world-interactable config list and refreshes the ObjId lookup.
function syncActiveWorldInteractableConfigs(configs: WorldInteractableConfig[]): void {
    ACTIVE_WORLD_INTERACTABLE_CONFIGS = configs.slice();
    rebuildActiveWorldInteractableConfigIndex();
}

// Returns active world-interactable config for one ObjId, if present.
function getActiveWorldInteractableConfigByObjId(objId: number): WorldInteractableConfig | undefined {
    return ACTIVE_WORLD_INTERACTABLE_CONFIG_BY_OBJ_ID[objId];
}

// Baseline team inference from static main-base anchor coordinates.
let MAIN_BASE_TEAM1_POS = ACTIVE_MAP_CONFIG.team1Base;
let MAIN_BASE_TEAM2_POS = ACTIVE_MAP_CONFIG.team2Base;
let MAIN_BASE_TRIGGER_ID_TEAM1 = ACTIVE_MAP_CONFIG.team1MainBaseTriggerId;
let MAIN_BASE_TRIGGER_ID_TEAM2 = ACTIVE_MAP_CONFIG.team2MainBaseTriggerId;
let MAIN_BASE_BUFFER_TRIGGER_ID_TEAM1 = ACTIVE_MAP_CONFIG.team1MainBaseBufferTriggerId;
let MAIN_BASE_BUFFER_TRIGGER_ID_TEAM2 = ACTIVE_MAP_CONFIG.team2MainBaseBufferTriggerId;
let GROUND_COMBAT_ZONE_TRIGGER_ID = ACTIVE_MAP_CONFIG.groundCombatZoneTriggerId;
let TEAM1_AIRCRAFT_SPAWN_VOLUMES = ACTIVE_MAP_CONFIG.team1AircraftSpawnVolumes ?? [];
let TEAM2_AIRCRAFT_SPAWN_VOLUMES = ACTIVE_MAP_CONFIG.team2AircraftSpawnVolumes ?? [];
let TEAM1_TANK_SPAWN_VOLUMES = ACTIVE_MAP_CONFIG.team1TankSpawnVolumes ?? [];
let TEAM2_TANK_SPAWN_VOLUMES = ACTIVE_MAP_CONFIG.team2TankSpawnVolumes ?? [];
let TEAM1_TANK_SELECTED_SPAWN_SPECS: VehicleSpawnSpec[] = [];
let TEAM2_TANK_SELECTED_SPAWN_SPECS: VehicleSpawnSpec[] = [];
let TEAM1_HELI_SELECTED_SPAWN_SPECS: VehicleSpawnSpec[] = [];
let TEAM2_HELI_SELECTED_SPAWN_SPECS: VehicleSpawnSpec[] = [];
let TEAM1_JET_SELECTED_SPAWN_SPECS: VehicleSpawnSpec[] = [];
let TEAM2_JET_SELECTED_SPAWN_SPECS: VehicleSpawnSpec[] = [];
let TEAM1_FAST_SELECTED_SPAWN_SPECS: VehicleSpawnSpec[] = [];
let TEAM2_FAST_SELECTED_SPAWN_SPECS: VehicleSpawnSpec[] = [];
let TEAM1_VEHICLE_SLOT_INVENTORY_SPECS: VehicleSpawnSpec[] = [];
let TEAM2_VEHICLE_SLOT_INVENTORY_SPECS: VehicleSpawnSpec[] = [];
const MAIN_BASE_BIND_RADIUS_METERS = 150.0;
// Radius (meters) around a team's authored main-base anchor used to decide whether a fresh
// deploy landed "inside the main base" for HQ icon visibility. Calibrated against the
// MP_TWL_Conquest9_FireStorm spatial: max HQ spawn is ~69m from anchor, nearest flag spawn
// is ~169m from anchor, so 100m sits safely between them with headroom on both sides. Tune
// per-map if a future map's HQ spawns spread wider or flags sit closer.
const DEPLOY_MAIN_BASE_RADIUS_METERS = 100.0;

// Vehicle spawner defaults (per-map spawn specs, selected by mode).
let TEAM1_VEHICLE_SPAWN_SPECS: VehicleSpawnSpec[] = [];
let TEAM2_VEHICLE_SPAWN_SPECS: VehicleSpawnSpec[] = [];
let VEHICLE_SPAWN_YAW_OFFSET_DEG = ACTIVE_MAP_CONFIG.vehicleSpawnYawOffsetDeg;
const MAP_DETECT_DISTANCE_METERS = 5.0;

rebuildActiveCapturePointConfigIndex();
rebuildActiveWorldInteractableConfigIndex();

