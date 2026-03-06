// @ts-nocheck
// Module: foundation/gameplay -- gameplay constants, enums, and mode config types

//#region -------------------- Constant, Enums and Types --------------------

// Core gameplay tuning defaults (safe to edit).
// Units: seconds unless otherwise noted.
const ROUND_START_SECONDS = 25 * 60; // Initial match clock duration before the live phase starts.
const MATCH_END_DELAY_SECONDS = 45; // Victory dialog duration before match end.
const ROUND_END_REDEPLOY_DELAY_SECONDS = 10; // Redeploy delay used by forced undeploy flows (ready-dialog swap/admin transitions).
const READY_UP_MESSAGE_COOLDOWN_SECONDS = 2.0; // Throttle ready-up broadcast spam per player.
const SHOW_HELP_TEXT_PROMPT_ON_JOIN = true; // Show the join help prompt overlay on first connect.
const ROUND_CLOCK_DEFAULT_SECONDS = ROUND_START_SECONDS; // Source of truth for clock reset.
const ADMIN_MATCH_LENGTH_STEP_SECONDS = 60;
const ADMIN_MATCH_LENGTH_MIN_SECONDS = 60;
const ADMIN_MATCH_LENGTH_MAX_SECONDS = (99 * 60) + 59;
const GAMEMODE_TARGET_SCORE_SAFETY_CAP = 9999; // Prevent engine auto-end from low default targets.

// Debug/gameplay message toggles:
// - "Debug" messages are development/diagnostic UX (white log / green box).
// - "Gameplay" messages are player-facing mode-flow information.
const ENABLE_GAMEPLAY_MESSAGES = true; // Gameplay-critical messaging (both channels). This should be on at all times
const ENABLE_DEBUG_NOTIFICATION_MESSAGES = false; // Green box notifications. Defaults to false.
const ENABLE_DEBUG_HIGHLIGHTED_MESSAGES = false; // CP visibility debug logs in highlighted world log.
const SHOW_DEBUG_TIMELIMIT = false; // Show the top-right time limit debug text for map end.
const DEBUG_TEST_NAMES_TEAM_1 = 0; // Display-only roster rows for Team 1 (Ready dialog + Victory dialog).
const DEBUG_TEST_NAMES_TEAM_2 = 0; // Display-only roster rows for Team 2 (Ready dialog + Victory dialog).
const DEBUG_TEST_PLACEHOLDER_NAME_KEY = mod.stringkeys.twl.system.debugPlaceholderName;
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
const VEHICLE_SPAWNER_RESPAWN_DELAY_SECONDS = 15;
const VEHICLE_SPAWNER_TIME_UNTIL_ABANDON_SECONDS = 2;
const VEHICLE_SPAWNER_KEEP_ALIVE_ABANDON_RADIUS = 5;
const VEHICLE_SPAWNER_KEEP_ALIVE_SPAWNER_RADIUS = 25;

// Vehicle spawner backend logic. These are quite particular, changing can cause bugs
const VEHICLE_SPAWNER_START_DELAY_SECONDS = 1;
// Startup cleanup radius is intentionally larger than bind radius to catch default spawns
// that appear offset from the configured spawn points (Defense Nexus/Golf Course/Blackwell slot 1).
const VEHICLE_SPAWNER_STARTUP_CLEANUP_RADIUS_METERS = 50.0;
const VEHICLE_SPAWNER_POLL_INTERVAL_SECONDS = 1.0;
const VEHICLE_SPAWNER_BIND_DISTANCE_METERS = 7.0;
const VEHICLE_SPAWNER_BIND_TIMEOUT_SECONDS = 2.0; // This should not be smaller than VEHICLE_SPAWNER_KEEP_ALIVE_SPAWNER_RADIUS

// Main base trigger tuning.
// Trigger IDs must match the map's spatial data object IDs.
const TEAM1_MAIN_BASE_TRIGGER_ID = 501; // Do not change without updating spatial data.
const TEAM2_MAIN_BASE_TRIGGER_ID = 500; // Do not change without updating spatial data.
const TAKEOFF_LIMIT_HUD_OFFSET = 20; // Y offset above HUD floor that triggers takeoff-limit warning (world Y).

// Ready-up auto-start gating:
// Decoupled from matchup presets; defaults to 1v1 and is user-adjustable in the Ready dialog.
const DEFAULT_AUTO_START_MIN_ACTIVE_PLAYERS = 2;
const AUTO_START_MIN_ACTIVE_PLAYERS_MIN = 0; // 0 maps to the solo "1 vs 0" special-case.
const AUTO_START_MIN_ACTIVE_PLAYERS_MAX = 8;
// Matchup preset default selection remains 1v1.
const DEFAULT_MATCHUP_PRESET_LEFT_PLAYERS = 1;
const DEFAULT_MATCHUP_PRESET_RIGHT_PLAYERS = 1;
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
    aircraftCeiling: number;
    aircraftCeilingOverridePending: boolean;
    vehicleIndexT1: number;
    vehicleIndexT2: number;
    gameMode: number;
    gameSettings: number;
    vehiclesT1: number;
    vehiclesT2: number;
    confirmed: {
        gameMode: number;
        gameSettings: number;
        vehiclesT1: number;
        vehiclesT2: number;
        aircraftCeiling: number;
        aircraftCeilingOverrideEnabled: boolean;
        vehicleIndexT1: number;
        vehicleIndexT2: number;
        vehicleOverrideEnabled: boolean;
    };
};

type AircraftCeilingVehicleState = {
    enforcing: boolean;
    lastNudgeAt: number;
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
    mod.stringkeys.twl.readyDialog.gameModeHelisPractice,
    mod.stringkeys.twl.readyDialog.gameModeHelisLadder,
    mod.stringkeys.twl.readyDialog.gameModeHelisTwl1v1,
    mod.stringkeys.twl.readyDialog.gameModeHelisCustom,
];
const READY_DIALOG_VEHICLE_OPTIONS: number[] = [
    mod.stringkeys.twl.readyDialog.vehicleOptionFalchion,
    mod.stringkeys.twl.readyDialog.vehicleOptionPanthera,
    mod.stringkeys.twl.readyDialog.vehicleOptionBlackHawk,
    mod.stringkeys.twl.readyDialog.vehicleOptionMapDefault,
];
const READY_DIALOG_VEHICLE_LIST: mod.VehicleList[] = [
    mod.VehicleList.AH64,
    mod.VehicleList.Eurocopter,
    mod.VehicleList.UH60,
    mod.VehicleList.AH64,
];
const READY_DIALOG_VEHICLE_MAP_DEFAULT_INDEX = READY_DIALOG_VEHICLE_OPTIONS.length - 1;
const READY_DIALOG_GAME_MODE_DEFAULT_INDEX = 0;
const READY_DIALOG_GAME_MODE_LADDER_INDEX = 1;
const READY_DIALOG_GAME_MODE_TWL_1V1_INDEX = 2;
const READY_DIALOG_GAME_MODE_CUSTOM_INDEX = 3;
const READY_DIALOG_VEHICLE_T1_DEFAULT_INDEX = 0;
const READY_DIALOG_VEHICLE_T2_DEFAULT_INDEX = 0;
const READY_DIALOG_AIRCRAFT_CEILING_DEFAULT = 550;
const READY_DIALOG_AIRCRAFT_CEILING_MIN = -200;
const READY_DIALOG_AIRCRAFT_CEILING_MAX = 5000;
const READY_DIALOG_AIRCRAFT_CEILING_STEP = 10;
const READY_DIALOG_MODE_PRESET_MATCHUP_INDEX = 0;
const READY_DIALOG_MODE_PRESET_PLAYERS_PER_SIDE_VANILLA = 2;
const READY_DIALOG_MODE_PRESET_PLAYERS_PER_SIDE_TWL_2V2 = 2;
const READY_DIALOG_MODE_PRESET_PLAYERS_PER_SIDE_TWL_1V1 = 1;
const READY_DIALOG_MODE_PRESET_VEHICLE_INDEX = 0;
let suppressReadyDialogModeAutoSwitch = false;

// Pregame countdown tuning (Ready Up -> live phase start).
// Units: seconds and UI scale units.
const PREGAME_COUNTDOWN_INITIAL_DELAY_SECONDS = 0.5;
const PREGAME_COUNTDOWN_STEP_SECONDS = 1.0;
const PREGAME_COUNTDOWN_START_NUMBER = 5;
const PREGAME_COUNTDOWN_SIZE_DIGIT_START = 620;
const PREGAME_COUNTDOWN_SIZE_DIGIT_END = 360;
const PREGAME_COUNTDOWN_SIZE_GO_START = 650;
const PREGAME_COUNTDOWN_SIZE_GO_END = 420;
const PREGAME_COUNTDOWN_GO_HOLD_SECONDS = 0.75;
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

