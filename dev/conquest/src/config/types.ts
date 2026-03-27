// @ts-nocheck
// Module: config/types -- map config type definitions

//#region -------------------- Map Config (Constants + Types) --------------------

// Supported maps for this mode; each key must have an entry in MAP_CONFIGS.
type MapKey = "Blackwell_Fields" | "Defense_Nexus" | "Golf_Course" | "Mirak_Valley" | "Operation_Firestorm" | "Liberation_Peak" | "Manhattan_Bridge" | "Sobek_City" | "Area_22B";

// slotNumber defines the explicit spawn priority per team (used for 1v1/2v2/3v3/4v4 enablement).
// Map-authored anchors define slot ownership + transform only; ready-dialog presets are the authoritative vehicle source.
type VehicleSpawnAnchorSpec = { slotNumber: number; pos: mod.Vector; rot: mod.Vector };
type VehicleSpawnSpec = VehicleSpawnAnchorSpec & { vehicle: mod.VehicleList };
type VehicleSpawnVolumeClass = "aircraft" | "tank";
type VehicleSpawnVolumeSpec = {
    label: string;
    enabled?: boolean;
    floorCorners: [mod.Vector, mod.Vector, mod.Vector, mod.Vector];
    heliSpawnCeiling: number;
    jetSpawnFloor: number;
    jetSpawnCeiling: number;
    rotHeli: mod.Vector;
    rotPlane: mod.Vector;
};
type CapturePointConfig = { objId: number; label: string; order: number };
type ReadyDialogPresetPackage = {
    playersPerSide: number;
    vehicleSelectionByKey: Record<string, mod.VehicleList | undefined>;
};

// Per-map runtime configuration: team anchors, labels, and spawn lists used by map-detect/apply logic.
type MapConfig = {
    team1Base: mod.Vector;
    team2Base: mod.Vector;
    team1MainBaseTriggerId?: number;
    team2MainBaseTriggerId?: number;
    team1MainBaseBufferTriggerId?: number;
    team2MainBaseBufferTriggerId?: number;
    groundCombatZoneTriggerId?: number;
    team1VehicleDeploySpawnPointId?: number;
    team2VehicleDeploySpawnPointId?: number;
    team1Name: number;
    team2Name: number;
    aircraftCeiling: number;
    hudMaxY: number; // HUD altitude at the vanilla hard ceiling for this map.
    hudFloorY: number; // World Y where aircraft HUD reads 0 on this map.
    useCustomCeiling: boolean; // When true, Ladder mode applies custom ceiling on this map.
    team1TankSpawns: VehicleSpawnAnchorSpec[];
    team2TankSpawns: VehicleSpawnAnchorSpec[];
    team1AircraftSpawnVolumes?: VehicleSpawnVolumeSpec[]; // Add more authored boxes as additional array entries; runtime selects one weighted by usable spawn space.
    team2AircraftSpawnVolumes?: VehicleSpawnVolumeSpec[]; // Add more authored boxes as additional array entries; runtime selects one weighted by usable spawn space.
    team1TankSpawnVolumes?: VehicleSpawnVolumeSpec[]; // Add more authored boxes as additional array entries; runtime selects one weighted by usable spawn space.
    team2TankSpawnVolumes?: VehicleSpawnVolumeSpec[]; // Add more authored boxes as additional array entries; runtime selects one weighted by usable spawn space.
    capturePoints?: CapturePointConfig[];
    team1HeliSpawns?: VehicleSpawnAnchorSpec[];
    team2HeliSpawns?: VehicleSpawnAnchorSpec[];
    team1JetSpawns?: VehicleSpawnAnchorSpec[];
    team2JetSpawns?: VehicleSpawnAnchorSpec[];
    team1FastMoverSpawns?: VehicleSpawnAnchorSpec[];
    team2FastMoverSpawns?: VehicleSpawnAnchorSpec[];
    readyDialogPresetPackages?: Record<number, ReadyDialogPresetPackage>; // Authored by knob key; runtime still maps knob order onto this map's spawn-anchor order.
    vehicleSpawnYawOffsetDeg: number; // Reserved for future spawn orientation tuning.
};
