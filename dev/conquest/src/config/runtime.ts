// @ts-nocheck
// Module: config/runtime -- active map state, derived spawn specs, and runtime map constants

// Change this MapKey to switch active map configuration for that map, only one map can be active at a time.
let ACTIVE_MAP_KEY: MapKey = "Blackwell_Fields";

// Expected to include team bases + at least one spawn per team, with unique slotNumber values matching per side.
let ACTIVE_MAP_CONFIG = MAP_CONFIGS[ACTIVE_MAP_KEY];

// Baseline team inference from static main-base anchor coordinates.
let MAIN_BASE_TEAM1_POS = ACTIVE_MAP_CONFIG.team1Base;
let MAIN_BASE_TEAM2_POS = ACTIVE_MAP_CONFIG.team2Base;
const MAIN_BASE_BIND_RADIUS_METERS = 150.0;

// Cached per-vehicle spawn inference for later reconciliation on seat entry (best-effort, can go stale).
const vehicleSpawnBaseTeamByObjId: Record<number, TeamID> = {};

// Vehicle spawner defaults (per-map spawn specs, selected by mode).
let TEAM1_VEHICLE_SPAWN_SPECS = ACTIVE_MAP_CONFIG.team1TankSpawns;
let TEAM2_VEHICLE_SPAWN_SPECS = ACTIVE_MAP_CONFIG.team2TankSpawns;
let VEHICLE_SPAWN_YAW_OFFSET_DEG = ACTIVE_MAP_CONFIG.vehicleSpawnYawOffsetDeg;
const MAP_DETECT_DISTANCE_METERS = 5.0;
