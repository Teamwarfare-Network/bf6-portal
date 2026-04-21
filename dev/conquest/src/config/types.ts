// @ts-nocheck
// Module: config/types -- map config type definitions

//#region -------------------- Map Config (Constants + Types) --------------------

// Current shipped map registry is Firestorm-only; archived map configs live outside src until they are needed again.
type MapKey = "Operation_Firestorm";

// slotNumber defines the explicit spawn priority per team (used for 1v1/2v2/3v3/4v4 enablement).
// Map-authored anchors define slot ownership + transform only; ready-dialog presets are the authoritative vehicle source.
type VehicleSpawnAnchorSpec = { slotNumber: number; pos: mod.Vector; rot: mod.Vector };
type VehicleSpawnSpec = VehicleSpawnAnchorSpec & { vehicle: mod.VehicleList };
type VehicleSpawnVolumeClass = "aircraft" | "tank";
type VehicleSpawnVolumeSpec = {
    label: string;
    enabled?: boolean;
    floorCorners: [mod.Vector, mod.Vector, mod.Vector, mod.Vector];
    heliSpawnCeiling?: number;
    jetSpawnFloor?: number;
    jetSpawnCeiling?: number;
    rotHeli?: mod.Vector;
    rotPlane?: mod.Vector;
    rotTank?: mod.Vector;
};
type CapturePointConfig = { objId: number; label: string; order: number };
type WorldInteractableScope = "main_base" | "point";
type WorldInteractableAction = "open_ready_dialog" | "open_vehicle_spawn_menu" | "open_ammo_resupply_menu";
type WorldInteractableAnchorConfig = {
    objId: number;
    pos: mod.Vector;
    ownerTeamId: TeamID | 0;
    vfx?: any;
    rot?: mod.Vector;
};
type WorldInteractableConfig = {
    objId: number;
    scope: WorldInteractableScope;
    action: WorldInteractableAction;
    ownerTeamId?: TeamID | 0;
    iconAnchorPos?: mod.Vector;
    vfx?: any;
    vfxRot?: mod.Vector;
};
type ReadyDialogPresetPackage = {
    playersPerSide: number;
    vehicleSelectionByKey: Record<string, mod.VehicleList | undefined>;
    vehicleDeployMethod?: number;
    // v1.314: optional preset seeds for the new config-column checkbox block. When omitted, the
    // preset applies defaults (air/forward off, supplyBoxes on) consistent with a fresh round.
    airDeployEnabled?: boolean;
    forwardDeployEnabled?: boolean;
    supplyBoxesEnabled?: boolean;
};

// Describes one gadget slot in the locker menu (assault items, medic items, recon items).
type GadgetItemConfig = {
    name: string;            // Stable key for widget naming + help text lookup
    labelKey: number;        // mod.stringkeys.twl.ui.* for tile header
    gadget: number;          // mod.Gadgets enum
    slot: number;            // mod.InventorySlots enum (Callins, GadgetTwo, Throwable)
    cooldownSeconds: number;
    teamShared: boolean;     // true = team-scoped cooldown, false = player-scoped
    maxCount: number;        // Pool size per cooldown scope (usually 1)
    iconSize?: number;       // Tile icon size override (default 52)
    iconY?: number;          // Tile icon Y override (default 44)
};

// Describes one engineer launcher row.
type GadgetLockerLauncherConfig = {
    labelKey: number;        // Display name string key
    gadget: number;          // mod.Gadgets launcher enum
    name?: string;           // Stable key for widget/state lookup (falls back to index when omitted)
    pool?: {
        maxCount: number;        // Team/player pool size
        rechargeSeconds: number; // Per-charge drip interval (refills one charge at a time)
        teamShared: boolean;     // true = team-scoped pool; false reserved for per-player pool (not yet wired)
    };
};

// Per-map gadget locker layout. Omit from MapConfig to use defaults.
type GadgetLockerConfig = {
    assault: GadgetItemConfig[];             // Column 0: team-shared gadgets (max ~4)
    launchers: GadgetLockerLauncherConfig[]; // Column 1: launcher selection rows (max ~4)
    launcherCooldownSeconds: number;         // Per-player launcher swap cooldown
    ammoCooldownSeconds: number;             // Per-charge recharge time (default 60)
    ammoMaxCharges: number;                  // Max ammo charges (default 3)
    medicItems: GadgetItemConfig[];          // Column 2: player-scoped items (intercepts); share one cooldown
    medicSmoke: GadgetItemConfig;            // Column 2: team-shared smoke (always 1 item)
    recon: GadgetItemConfig[];               // Column 3: [0] = independent CD, [1+] = shared CD
    reconSharedCooldownSeconds: number;      // Shared cooldown for recon[1..] items
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
    groundCombatZoneCeilingY?: number; // Y ceiling of the GroundCombatVolume polygon (from spatial); used for vehicle-exit boundary recheck.
    team1VehicleDeploySpawnPointId?: number;
    team2VehicleDeploySpawnPointId?: number;
    mainBaseInteractableObjIds?: number[]; // Phase 7 main-base interactables; even ids map to ready dialog, odd ids map to vehicle menu.
    mainBaseInteractableAnchors?: WorldInteractableAnchorConfig[]; // Explicit Phase 7 terminal marker anchors used for per-player runtime icon spawning.
    gadgetInteractableObjIds?: number[]; // Phase 7 gadget/ammo interactables; all ids map to ammo resupply menu.
    gadgetInteractableAnchors?: WorldInteractableAnchorConfig[]; // Explicit Phase 7 point/gadget marker anchors used when authored runtime position lookup is unreliable.
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
    gadgetLockerConfig?: GadgetLockerConfig; // Per-map gadget locker layout override; omit to use defaults.
    roundStartAirDelay?: number; // Seconds after live before ANY aircraft deployment (HQ or air) is allowed.
    roundStartAirDeployDelay?: number; // Seconds after live before the air-deploy button unlocks (aircraft HQ allowed after airDelay).
    roundStartForwardDeployDelay?: number; // Seconds after live before the forward-deploy button unlocks (ground HQ always available).
    roundStartGadgetDelay?: number; // Seconds after live before gadget locker tiles become interactable; tiles are also locked pre-LIVE.
};

