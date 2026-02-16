// @ts-nocheck
// Module: config/types -- map config type definitions

//#region -------------------- Map Config (Constants + Types) --------------------

// Supported maps for this mode; each key must have an entry in MAP_CONFIGS.
type MapKey = "Blackwell_Fields" | "Defense_Nexus" | "Golf_Course" | "Mirak_Valley" | "Operation_Firestorm" | "Liberation_Peak" | "Manhattan_Bridge" | "Sobek_City" | "Area_22B";

// slotNumber defines the explicit spawn priority per team (used for 1v1/2v2/3v3/4v4 enablement).
type VehicleSpawnSpec = { slotNumber: number; pos: mod.Vector; rot: mod.Vector; vehicle: mod.VehicleList };

// Overtime compatibility zone descriptors (kept for schema compatibility).
type OvertimeZoneSpec = { areaTriggerObjId: number; sectorId: number; worldIconObjId: number; capturePointObjId: number };
type OvertimeZoneCandidate = OvertimeZoneSpec & { letterIndex: number };
type OvertimeZoneLettersByMode = { tanks?: string[]; helis?: string[] };

// Per-map runtime configuration: team anchors, labels, and spawn lists used by map-detect/apply logic.
type MapConfig = {
    team1Base: mod.Vector;
    team2Base: mod.Vector;
    team1Name: number;
    team2Name: number;
    aircraftCeiling: number;
    hudMaxY: number; // HUD altitude at the vanilla hard ceiling for this map.
    hudFloorY: number; // World Y where aircraft HUD reads 0 on this map.
    useCustomCeiling: boolean; // When true, Ladder mode applies custom ceiling on this map.
    team1TankSpawns: VehicleSpawnSpec[];
    team2TankSpawns: VehicleSpawnSpec[];
    team1HeliSpawns?: VehicleSpawnSpec[];
    team2HeliSpawns?: VehicleSpawnSpec[];
    vehicleSpawnYawOffsetDeg: number; // Reserved for future spawn orientation tuning.
    // Optional legacy overtime zone list (kept to preserve schema compatibility).
    // Empty/undefined means there is no legacy zone metadata for this map.
    overtimeZones?: OvertimeZoneSpec[];
    overtimeZoneLettersByMode?: OvertimeZoneLettersByMode;
};
