// @ts-nocheck
// Module: config/runtime -- active map state, derived spawn specs, and runtime map constants

// Change this MapKey to switch active map configuration for that map, only one map can be active at a time.
let ACTIVE_MAP_KEY: MapKey = "Blackwell_Fields";

// Expected to include team bases + at least one spawn per team, with unique slotNumber values matching per side.
let ACTIVE_MAP_CONFIG = MAP_CONFIGS[ACTIVE_MAP_KEY];
let ACTIVE_CAPTURE_POINT_CONFIGS: CapturePointConfig[] = ACTIVE_MAP_CONFIG.capturePoints ?? [];
const ACTIVE_CAPTURE_POINT_CONFIG_BY_OBJ_ID: Record<number, CapturePointConfig> = {};

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

// Baseline team inference from static main-base anchor coordinates.
let MAIN_BASE_TEAM1_POS = ACTIVE_MAP_CONFIG.team1Base;
let MAIN_BASE_TEAM2_POS = ACTIVE_MAP_CONFIG.team2Base;
let VEHICLE_DEPLOY_SPAWN_POINT_ID_TEAM1 = ACTIVE_MAP_CONFIG.team1VehicleDeploySpawnPointId;
let VEHICLE_DEPLOY_SPAWN_POINT_ID_TEAM2 = ACTIVE_MAP_CONFIG.team2VehicleDeploySpawnPointId;
let TEAM1_AIRCRAFT_SPAWN_VOLUMES = ACTIVE_MAP_CONFIG.team1AircraftSpawnVolumes ?? [];
let TEAM2_AIRCRAFT_SPAWN_VOLUMES = ACTIVE_MAP_CONFIG.team2AircraftSpawnVolumes ?? [];
let TEAM1_TANK_SPAWN_VOLUMES = ACTIVE_MAP_CONFIG.team1TankSpawnVolumes ?? [];
let TEAM2_TANK_SPAWN_VOLUMES = ACTIVE_MAP_CONFIG.team2TankSpawnVolumes ?? [];
const MAIN_BASE_BIND_RADIUS_METERS = 150.0;

// Cached per-vehicle spawn inference for later reconciliation on seat entry (best-effort, can go stale).
const vehicleSpawnBaseTeamByObjId: Record<number, TeamID> = {};

// Vehicle spawner defaults (per-map spawn specs, selected by mode).
let TEAM1_VEHICLE_SPAWN_SPECS = ACTIVE_MAP_CONFIG.team1TankSpawns;
let TEAM2_VEHICLE_SPAWN_SPECS = ACTIVE_MAP_CONFIG.team2TankSpawns;
let VEHICLE_SPAWN_YAW_OFFSET_DEG = ACTIVE_MAP_CONFIG.vehicleSpawnYawOffsetDeg;
const MAP_DETECT_DISTANCE_METERS = 5.0;

rebuildActiveCapturePointConfigIndex();
