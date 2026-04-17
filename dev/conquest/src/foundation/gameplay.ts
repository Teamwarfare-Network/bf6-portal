// @ts-nocheck
// Module: foundation/gameplay -- gameplay constants, enums, and mode config types

//#region -------------------- Constant, Enums and Types --------------------

// Core gameplay tuning defaults (safe to edit).
// Units: seconds unless otherwise noted.
const ROUND_START_SECONDS = 25 * 60; // Initial match clock duration before the live phase starts.
const MATCH_END_DELAY_SECONDS = 45; // Victory dialog duration before match end.
const READY_UP_MESSAGE_COOLDOWN_SECONDS = 2.0; // Throttle ready-up broadcast spam per player.
const ROUND_CLOCK_DEFAULT_SECONDS = ROUND_START_SECONDS; // Source of truth for clock reset.
const ADMIN_MATCH_LENGTH_STEP_SECONDS = 60;
const ADMIN_MATCH_LENGTH_MIN_SECONDS = 60;
const ADMIN_MATCH_LENGTH_MAX_SECONDS = (99 * 60) + 59;
const GAMEMODE_TARGET_SCORE_SAFETY_CAP = 9999; // Prevent engine auto-end from low default targets.

// Debug/gameplay message toggles:
// - "Debug" messages are development/diagnostic UX (white log / green box).
// - "Gameplay" messages are player-facing mode-flow information.
const ENABLE_GAMEPLAY_MESSAGES = true; // Gameplay-critical messaging (both channels). This should be on at all times
const TEAM_ROSTER_MAX_ROWS = 16;

// Team identifiers (script uses T1/T2 semantics).
enum TeamID {
    Team1 = 1,
    Team2 = 2,
}

// Mode phase used by Ready/Live/GameOver UI gating and flow control.
enum MatchPhase {
    NotReady = 0,
    Live = 1,
    GameOver = 2,
}

// Vehicle registry storage (GlobalVariables).
// Kept at 0/1 to match prior versions and simplify external tooling.
const REGISTRY_TEAM1_VAR = 0;
const REGISTRY_TEAM2_VAR = 1;

// Registered vehicle arrays persist across flow transitions until explicitly cleared.
// These live in engine globals (not State) and are used for registration checks.
const regVehiclesTeam1 = mod.GlobalVariable(REGISTRY_TEAM1_VAR);
const regVehiclesTeam2 = mod.GlobalVariable(REGISTRY_TEAM2_VAR);

// Vehicle ownership tracking (best-effort heuristic):
// - vehIds and vehOwners are parallel arrays keyed by vehicle ObjId.
// - Owner lookup may be undefined if no enter event was observed for the vehicle.
// - Do not treat this as authoritative killer attribution; it is used only for informative messaging.
const vehIds: number[] = [];
const vehOwners: mod.Player[] = [];

// Basic Vehicle Spawner constants, can be tuned for balance.
const VEHICLE_SPAWNER_RESPAWN_DELAY_SECONDS = 120;
const VEHICLE_SPAWNER_TIME_UNTIL_ABANDON_SECONDS = 30;
const VEHICLE_SPAWNER_KEEP_ALIVE_ABANDON_RADIUS = 100;
const VEHICLE_SPAWNER_KEEP_ALIVE_SPAWNER_RADIUS = 50;

// Vehicle spawner backend logic. These are quite particular, changing can cause bugs
const VEHICLE_SPAWNER_START_DELAY_SECONDS = 1;
// Startup cleanup radius is intentionally larger than bind radius to catch default spawns
// that appear offset from the configured spawn points (Defense Nexus/Golf Course/Blackwell slot 1).
const VEHICLE_SPAWNER_STARTUP_CLEANUP_RADIUS_METERS = 50.0;
const VEHICLE_SPAWNER_POLL_INTERVAL_SECONDS = 5.0;
const VEHICLE_SPAWNER_BIND_DISTANCE_METERS = 7.0;
const VEHICLE_SPAWNER_BIND_TIMEOUT_SECONDS = 2.0; // This should not be smaller than VEHICLE_SPAWNER_KEEP_ALIVE_SPAWNER_RADIUS
// CQ_Bug_52: watchdog reap threshold. Any slot whose expectingSpawn has been true longer than this
// without the global active tracker still pointing at it is considered latched and reaped.
const VEHICLE_SPAWNER_STUCK_EXPECTING_SPAWN_THRESHOLD_SECONDS = 10.0;

// Main base trigger fallback ids.
  // These remain only as compatibility defaults until every map owns its main-base trigger ids in MapConfig.
  const TEAM1_MAIN_BASE_TRIGGER_ID = 501;
  const TEAM2_MAIN_BASE_TRIGGER_ID = 500;
  
  // Ready-up auto-start gating:
// Decoupled from matchup presets; default starts at the solo 1v0 special-case and is user-adjustable in the Ready dialog.
const DEFAULT_AUTO_START_MIN_ACTIVE_PLAYERS = 0;
const AUTO_START_MIN_ACTIVE_PLAYERS_MIN = 0; // 0 maps to the solo "1 vs 0" special-case.
const AUTO_START_MIN_ACTIVE_PLAYERS_MAX = 16;
// Matchup preset default selection now starts at 4v4 vehicle enablement.
const DEFAULT_MATCHUP_PRESET_LEFT_PLAYERS = 4;
const DEFAULT_MATCHUP_PRESET_RIGHT_PLAYERS = 4;
const MATCHUP_CHANGE_COOLDOWN_SECONDS = 1.0;

// HUD/UI palette colors (generally used with 75% opacity).
const COLOR_BLUE = mod.CreateVector(112 / 255, 235 / 255, 255 / 255); // #70EBFF
const COLOR_BLUE_DARK = mod.CreateVector(19 / 255, 47 / 255, 63 / 255); // #132F3F
const COLOR_RED = mod.CreateVector(1, 131 / 255, 97 / 255); // #FF8361
const COLOR_RED_DARK = mod.CreateVector(64 / 255, 24 / 255, 17 / 255); // #401811
const COLOR_GREEN = mod.CreateVector(173 / 255, 253 / 255, 134 / 255); // #ADFD86
const COLOR_GREEN_DARK = mod.CreateVector(71 / 255, 114 / 255, 54 / 255); // #477236
const COLOR_YELLOW = mod.CreateVector(1, 252 / 255, 156 / 255); // #FFFC9C
const COLOR_YELLOW_DARK = mod.CreateVector(113 / 255, 96 / 255, 0); // #716000
const COLOR_WHITE = mod.CreateVector(1, 1, 1); // #FFFFFF
const COLOR_WHITE_LOW = mod.CreateVector(213 / 255, 235 / 255, 249 / 255); // #D5EBF9
const COLOR_GRAY = mod.CreateVector(84 / 255, 94 / 255, 99 / 255); // #545E63
const COLOR_GRAY_DARK = mod.CreateVector(54 / 255, 57 / 255, 60 / 255); // #36393C
const COLOR_DARK_BLACK = mod.CreateVector(8 / 255, 11 / 255, 11 / 255); // #080B0B

// Matchup preset metadata used by Ready Dialog controls/readouts.
type MatchupPreset = {
    leftPlayers: number;
    rightPlayers: number;
};

type ReadyDialogModeConfig = {
    gameModeIndex: number;
    autoStartMinActivePlayers: number;
    aircraftCeiling: number;
    aircraftCeilingOverridePending: boolean;
    vehicleSelectionIndexByKey: Record<string, number>;
    gameMode: number;
    gameSettings: number;
    confirmed: {
        gameMode: number;
        gameSettings: number;
        aircraftCeiling: number;
        aircraftCeilingOverrideEnabled: boolean;
        autoStartMinActivePlayers: number;
        vehicleSelectionIndexByKey: Record<string, number>;
    };
};

type ReadyDialogVehicleOption = {
    label: number;
    vehicle?: mod.VehicleList;
};

type AircraftCeilingVehicleState = {
    enforcing: boolean;
    lastNudgeAt: number;
};

type BoundaryPromptKind = "prelive_main_base" | "enemy_main_base_buffer" | "ground_combat_zone";

type BoundaryViolationState = {
    kind: BoundaryPromptKind;
    startedAtSeconds: number;
    expiresAtSeconds: number;
    alarmPlayed: boolean;
    enforcementToken: number;
};

// Matchup presets drive slot enablement/readouts; auto-start minimums are independent.
const MATCHUP_PRESETS: MatchupPreset[] = [
    { leftPlayers: 1, rightPlayers: 1 },
    { leftPlayers: 2, rightPlayers: 2 },
    { leftPlayers: 3, rightPlayers: 3 },
    { leftPlayers: 4, rightPlayers: 4 },
];

// Derive the initial preset from default matchup metadata.
const DEFAULT_MATCHUP_PRESET_INDEX = findMatchupPresetIndex(
    DEFAULT_MATCHUP_PRESET_LEFT_PLAYERS,
    DEFAULT_MATCHUP_PRESET_RIGHT_PLAYERS
);

const READY_DIALOG_GAME_MODE_OPTIONS: number[] = [
    mod.stringkeys.twl.readyDialog.gameModeConquest8v8,
    mod.stringkeys.twl.readyDialog.gameModeConquest10v10,
    mod.stringkeys.twl.readyDialog.gameModeConquest12v12,
    mod.stringkeys.twl.readyDialog.gameModeConquest16v16,
];
const READY_DIALOG_GAME_MODE_DEFAULT_INDEX = 1;
const READY_DIALOG_GAME_MODE_CUSTOM_KEY = mod.stringkeys.twl.readyDialog.gameModeConquestCustom;
// Shared vehicle ids for ready-dialog preset authoring and option definitions.
// Keep the one runtime/type workaround here so map config preset packages can stay obvious.
const VEHICLE_F16 = mod.VehicleList.F16;
const VEHICLE_F22 = mod.VehicleList.F22;
const VEHICLE_JAS39 = mod.VehicleList.JAS39;
const VEHICLE_SU57 = mod.VehicleList.SU57;
const VEHICLE_AH64 = mod.VehicleList.AH64;
const VEHICLE_EUROCOPTER = mod.VehicleList.Eurocopter;
const VEHICLE_UH60 = mod.VehicleList.UH60;
const VEHICLE_UH60_PAX = mod.VehicleList.UH60_Pax;
const VEHICLE_ABRAMS = mod.VehicleList.Abrams;
const VEHICLE_LEOPARD = mod.VehicleList.Leopard;
const VEHICLE_M2BRADLEY = mod.VehicleList.M2Bradley;
const VEHICLE_CV90 = mod.VehicleList.CV90;
const VEHICLE_CHEETAH = mod.VehicleList.Cheetah;
const VEHICLE_GEPARD = mod.VehicleList.Gepard;
const VEHICLE_MARAUDER = mod.VehicleList.Marauder;
const VEHICLE_MARAUDER_PAX = mod.VehicleList.Marauder_Pax;
const VEHICLE_QUADBIKE = mod.VehicleList.Quadbike;
const VEHICLE_GOLFCART = mod.VehicleList.GolfCart;
const VEHICLE_FLYER60 = mod.VehicleList.Flyer60;
const VEHICLE_VECTOR = mod.VehicleList.Vector;
const VEHICLE_RHIB = mod.VehicleList.RHIB;
// AH6M / DirtBike entries are present in the runtime SDK (game 1.2.3) but may not be in the installed types package.
const VEHICLE_AH6M = (mod.VehicleList as any).AH6M as mod.VehicleList;
const VEHICLE_AH6M_PAX = (mod.VehicleList as any).AH6M_Pax as mod.VehicleList;
const VEHICLE_DIRTBIKE = (mod.VehicleList as any).DirtBike as mod.VehicleList;
const VEHICLE_DIRTBIKE_PAX = (mod.VehicleList as any).DirtBike_Pax as mod.VehicleList;
// VFX prefab constants — referenced by map config anchor `vfx:` fields. Add new entries here.
const VFX_GREEN_SMOKE  = mod.RuntimeSpawn_Common.FX_Granite_Strike_Smoke_Marker_Green;
const VFX_RED_SMOKE    = mod.RuntimeSpawn_Common.FX_Granite_Strike_Smoke_Marker_Red;
const VFX_VIOLET_SMOKE = mod.RuntimeSpawn_Common.FX_Granite_Strike_Smoke_Marker_Violet;
const VFX_YELLOW_SMOKE = mod.RuntimeSpawn_Common.FX_Granite_Strike_Smoke_Marker_Yellow;
const READY_DIALOG_AIRCRAFT_CEILING_DEFAULT = 550;
const READY_DIALOG_AIRCRAFT_CEILING_MIN = -200;
const READY_DIALOG_AIRCRAFT_CEILING_MAX = 5000;
const READY_DIALOG_AIRCRAFT_CEILING_STEP = 10;
let suppressReadyDialogModeAutoSwitch = false;

const READY_DIALOG_TEAM1_JET_KNOB_KEYS = ["team1Jet1", "team1Jet2"] as const;
const READY_DIALOG_TEAM2_JET_KNOB_KEYS = ["team2Jet1", "team2Jet2"] as const;
const READY_DIALOG_TEAM1_HELI_KNOB_KEYS = ["team1Heli1", "team1Heli2"] as const;
const READY_DIALOG_TEAM2_HELI_KNOB_KEYS = ["team2Heli1", "team2Heli2"] as const;
const READY_DIALOG_TEAM1_GROUND_KNOB_KEYS = ["team1Ground1", "team1Ground2", "team1Ground3", "team1Ground4"] as const;
const READY_DIALOG_TEAM2_GROUND_KNOB_KEYS = ["team2Ground1", "team2Ground2", "team2Ground3", "team2Ground4"] as const;
const READY_DIALOG_TEAM1_FAST_KNOB_KEYS = ["team1Fast1", "team1Fast2", "team1Fast3", "team1Fast4"] as const;
const READY_DIALOG_TEAM2_FAST_KNOB_KEYS = ["team2Fast1", "team2Fast2", "team2Fast3", "team2Fast4"] as const;
const READY_DIALOG_CONFIG_GAME_KNOB_KEY = "configGameMode";
const READY_DIALOG_CONFIG_MODE_SETTINGS_KNOB_KEY = "configModeSettings";
const READY_DIALOG_CONFIG_VEHICLES_KNOB_KEY = "configVehicles";
const READY_DIALOG_CONFIG_PLAYERS_KNOB_KEY = "configPlayers";
const READY_DIALOG_ALL_VEHICLE_KNOB_KEYS = [
    ...READY_DIALOG_TEAM1_JET_KNOB_KEYS,
    ...READY_DIALOG_TEAM2_JET_KNOB_KEYS,
    ...READY_DIALOG_TEAM1_HELI_KNOB_KEYS,
    ...READY_DIALOG_TEAM2_HELI_KNOB_KEYS,
    ...READY_DIALOG_TEAM1_GROUND_KNOB_KEYS,
    ...READY_DIALOG_TEAM2_GROUND_KNOB_KEYS,
    ...READY_DIALOG_TEAM1_FAST_KNOB_KEYS,
    ...READY_DIALOG_TEAM2_FAST_KNOB_KEYS,
] as const;

const READY_DIALOG_JET_VEHICLE_OPTIONS: ReadyDialogVehicleOption[] = [
    { label: mod.stringkeys.twl.readyDialog.vehicleShortNoSpawn, vehicle: undefined },
    { label: mod.stringkeys.twl.readyDialog.vehicleShortF16, vehicle: VEHICLE_F16 },
    { label: mod.stringkeys.twl.readyDialog.vehicleShortF22, vehicle: VEHICLE_F22 },
    { label: mod.stringkeys.twl.readyDialog.vehicleShortJas39, vehicle: VEHICLE_JAS39 },
    { label: mod.stringkeys.twl.readyDialog.vehicleShortSu57, vehicle: VEHICLE_SU57 },
];

const READY_DIALOG_HELI_VEHICLE_OPTIONS: ReadyDialogVehicleOption[] = [
    { label: mod.stringkeys.twl.readyDialog.vehicleShortNoSpawn, vehicle: undefined },
    { label: mod.stringkeys.twl.readyDialog.vehicleShortApache, vehicle: VEHICLE_AH64 },
    { label: mod.stringkeys.twl.readyDialog.vehicleShortEuro, vehicle: VEHICLE_EUROCOPTER },
    { label: mod.stringkeys.twl.readyDialog.vehicleShortLittleBird, vehicle: VEHICLE_AH6M },
    { label: mod.stringkeys.twl.readyDialog.vehicleShortLittleBirdPax, vehicle: VEHICLE_AH6M_PAX },
    { label: mod.stringkeys.twl.readyDialog.vehicleShortBlackHawk, vehicle: VEHICLE_UH60 },
    { label: mod.stringkeys.twl.readyDialog.vehicleShortBlackHawkPax, vehicle: VEHICLE_UH60_PAX },
];

const READY_DIALOG_GROUND_VEHICLE_OPTIONS: ReadyDialogVehicleOption[] = [
    { label: mod.stringkeys.twl.readyDialog.vehicleShortNoSpawn, vehicle: undefined },
    { label: mod.stringkeys.twl.readyDialog.vehicleShortAbrams, vehicle: VEHICLE_ABRAMS },
    { label: mod.stringkeys.twl.readyDialog.vehicleShortLeopard, vehicle: VEHICLE_LEOPARD },
    { label: mod.stringkeys.twl.readyDialog.vehicleShortBradley, vehicle: VEHICLE_M2BRADLEY },
    { label: mod.stringkeys.twl.readyDialog.vehicleShortCv90, vehicle: VEHICLE_CV90 },
    { label: mod.stringkeys.twl.readyDialog.vehicleShortCheetah, vehicle: VEHICLE_GEPARD },   // Engine enum "Gepard" actually spawns the Cheetah 1A2
    { label: mod.stringkeys.twl.readyDialog.vehicleShortGepard, vehicle: VEHICLE_CHEETAH },  // Engine enum "Cheetah" actually spawns the GE-26 PAX (Gepard)
];

const READY_DIALOG_FAST_VEHICLE_OPTIONS: ReadyDialogVehicleOption[] = [
    { label: mod.stringkeys.twl.readyDialog.vehicleShortNoSpawn, vehicle: undefined },
    { label: mod.stringkeys.twl.readyDialog.vehicleShortMarauder, vehicle: VEHICLE_MARAUDER },
    { label: mod.stringkeys.twl.readyDialog.vehicleShortMarauderPax, vehicle: VEHICLE_MARAUDER_PAX },
    { label: mod.stringkeys.twl.readyDialog.vehicleShortQuadbike, vehicle: VEHICLE_QUADBIKE },
    { label: mod.stringkeys.twl.readyDialog.vehicleShortDirtBike, vehicle: VEHICLE_DIRTBIKE },
    { label: mod.stringkeys.twl.readyDialog.vehicleShortDirtBikePax, vehicle: VEHICLE_DIRTBIKE_PAX },
    { label: mod.stringkeys.twl.readyDialog.vehicleShortGolfCart, vehicle: VEHICLE_GOLFCART },
    { label: mod.stringkeys.twl.readyDialog.vehicleShortFlyer60, vehicle: VEHICLE_FLYER60 },
    { label: mod.stringkeys.twl.readyDialog.vehicleShortVector, vehicle: VEHICLE_VECTOR },
];

const READY_DIALOG_TEAM1_TRANSPORT_SLOT_VEHICLE_OPTIONS: ReadyDialogVehicleOption[] = [
    { label: mod.stringkeys.twl.readyDialog.vehicleShortNoSpawn, vehicle: undefined },
    { label: mod.stringkeys.twl.readyDialog.vehicleShortMarauder, vehicle: VEHICLE_MARAUDER },
    { label: mod.stringkeys.twl.readyDialog.vehicleShortQuadbike, vehicle: VEHICLE_QUADBIKE },
    { label: mod.stringkeys.twl.readyDialog.vehicleShortGolfCart, vehicle: VEHICLE_GOLFCART },
    { label: mod.stringkeys.twl.readyDialog.vehicleShortFlyer60, vehicle: VEHICLE_FLYER60 },
    { label: mod.stringkeys.twl.readyDialog.vehicleShortBlackHawk, vehicle: VEHICLE_UH60 },
];

const READY_DIALOG_TEAM2_TRANSPORT_SLOT_VEHICLE_OPTIONS: ReadyDialogVehicleOption[] = [
    { label: mod.stringkeys.twl.readyDialog.vehicleShortNoSpawn, vehicle: undefined },
    { label: mod.stringkeys.twl.readyDialog.vehicleShortMarauderPax, vehicle: VEHICLE_MARAUDER_PAX },
    { label: mod.stringkeys.twl.readyDialog.vehicleShortQuadbike, vehicle: VEHICLE_QUADBIKE },
    { label: mod.stringkeys.twl.readyDialog.vehicleShortGolfCart, vehicle: VEHICLE_GOLFCART },
    { label: mod.stringkeys.twl.readyDialog.vehicleShortFlyer60, vehicle: VEHICLE_FLYER60 },
    { label: mod.stringkeys.twl.readyDialog.vehicleShortBlackHawkPax, vehicle: VEHICLE_UH60_PAX },
];

// Pregame countdown tuning (Ready Up -> live phase start).
// Units: seconds and UI scale units.
const PREGAME_COUNTDOWN_INITIAL_DELAY_SECONDS = 0.5;
const PREGAME_COUNTDOWN_STEP_SECONDS = 1.0;
// Expected minimum: 10 seconds. The staggered delay-info lines (immediate, +3s, +6s) assume at
// least ~10s of countdown runway so all three lines are visible for a meaningful window before LIVE.
const PREGAME_COUNTDOWN_START_NUMBER = 20;
const PREGAME_COUNTDOWN_SIZE_DIGIT_START = 620;
const PREGAME_COUNTDOWN_SIZE_DIGIT_END = 360;
const PREGAME_COUNTDOWN_SIZE_LIVE_START = 650;
const PREGAME_COUNTDOWN_SIZE_LIVE_END = 420;
const PREGAME_COUNTDOWN_LIVE_HOLD_SECONDS = 1.0;
const PREGAME_COUNTDOWN_ANIMATION_STEPS = 30;
const PREGAME_ALERT_TEXT_ALPHA = 0.85; // UI text alpha (0..1).

// Ready-dialog interaction behavior configuration (safe to tweak).
// - enableReadyDialog: master toggle for the interact-based Ready Dialog trigger.
// - interactPointMinLifetime/MaxLifetime: lifetime window before auto-despawn.
// - velocityThreshold: remove interact point while player is moving.
const READY_DIALOG_INTERACT_CONFIG: ReadyDialogInteractConfig = {
    enableReadyDialog: true,
    interactPointMinLifetime: 1,
    interactPointMaxLifetime: 3,
    velocityThreshold: 3,
};

// Admin panel toggle debounce (seconds). Prevents double-toggle from press/release events.
const ADMIN_PANEL_TOGGLE_COOLDOWN_SECONDS = 0.2;


