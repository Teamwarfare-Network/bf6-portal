//#region -------------------- Modlib import --------------------

// If not using bundled TS project you need to use modlib import
// @ts-ignore - ignores error on Portal webclient with importing modlib
import * as modlib from "modlib";
// TS project comes with local modlib functions, if using that then no need to import modlib
// - There seems to be an error with TS template's project local modlib FilteredArray function (drops all vehicles in vehicle array?!)

//#endregion ----------------- Modlib import --------------------



//#region -------------------- Constant, Enums and Types --------------------

// Core gameplay tuning defaults (safe to edit).
// Units: seconds unless otherwise noted.
const DEFAULT_MAX_ROUNDS = 3; // Best-of rounds for a full match.
const MAX_ROUNDS = DEFAULT_MAX_ROUNDS;
const DEFAULT_ROUND_KILLS_TARGET = 1; // 1 for 1v1, 2 for 2v2, etc.
const ROUND_KILLS_TARGET = DEFAULT_ROUND_KILLS_TARGET;
const ROUND_START_SECONDS = 3 * 60; // Round clock starting time.
const MATCH_END_DELAY_SECONDS = 45; // Victory dialog duration before match end.
const ROUND_END_REDEPLOY_DELAY_SECONDS = 10; // Redeploy delay between rounds.
const ROUND_END_CLEANUP_SPAWN_TIMEOUT_SECONDS = 60; // Max wait for cleanup spawns before forcing deploy.
const ROUND_END_POST_DEPLOY_HOLD_SECONDS = 10; // Keep round-end dialog visible after deploy.
const READY_UP_MESSAGE_COOLDOWN_SECONDS = 2.0; // Throttle ready-up broadcast spam per player.
const DEFAULT_LIVE_RESPAWN_ENABLED = true; // Admin-togglable: allow respawn/deploy during live rounds by default.
const SHOW_HELP_TEXT_PROMPT_ON_JOIN = true; // Show the join help prompt overlay on first connect.
const ROUND_CLOCK_DEFAULT_SECONDS = ROUND_START_SECONDS; // Source of truth for clock reset.
const ADMIN_ROUND_LENGTH_STEP_SECONDS = 5;
const ADMIN_ROUND_LENGTH_MIN_SECONDS = 60;
const ADMIN_ROUND_LENGTH_MAX_SECONDS = 10 * 60;
const GAMEMODE_TARGET_SCORE_SAFETY_CAP = 9999; // Prevent engine auto-end from low default targets.

// Debug/gameplay message toggles:
// - "Debug" messages are development/diagnostic UX (white log / green box).
// - "Gameplay" messages are player-facing round/mode information.
const ENABLE_GAMEPLAY_MESSAGES = true; // Gameplay-critical messaging (both channels). This should be on at all times
const ENABLE_DEBUG_NOTIFICATION_MESSAGES = false; // Green box notifications. Defaults to false.
const ENABLE_DEBUG_HIGHLIGHTED_MESSAGES = false; // White highlighted world log. Defaults to false.
const ENABLE_CP_VIS_DEBUG = false; // CP visibility debug logs in highlighted world log.
const SHOW_DEBUG_TIMELIMIT = false; // Show the top-right time limit debug text for map end.
const DEBUG_TEST_NAMES_TEAM_1 = 0; // Display-only roster rows for Team 1 (Ready dialog + Victory dialog).
const DEBUG_TEST_NAMES_TEAM_2 = 0; // Display-only roster rows for Team 2 (Ready dialog + Victory dialog).
const DEBUG_TEST_PLACEHOLDER_NAME_KEY = mod.stringkeys.twl.system.debugPlaceholderName;
const TEAM_ROSTER_MAX_ROWS = 16;

// Overtime flag capture (tiebreaker) tuning.
// - Neutral progress starts at 0.5.
// - Base capture time is neutral -> full (0.5 distance) for 1 vehicle uncontested.
const OVERTIME_TICK_SECONDS = 0.25; // Tick interval for overtime capture loop (0.25s = 4 updates/sec)
const OVERTIME_CAPTURE_SECONDS_TO_FULL = 5;
const OVERTIME_DECAY_SECONDS_TO_TARGET = OVERTIME_CAPTURE_SECONDS_TO_FULL; // Empty-zone drift time toward target (neutral/owned) in seconds.
// Capture speed multipliers for 2/3/4 vehicle majorities.
const OVERTIME_CAPTURE_MULTIPLIER_2X = 1.25;
const OVERTIME_CAPTURE_MULTIPLIER_3X = 1.35;
const OVERTIME_CAPTURE_MULTIPLIER_4X = 1.45;
const OVERTIME_NEUTRAL_ACCELERATION_MULTIPLIER = 2; // Boost factor for empty-zone neutral reset + losing-team pushback to 0.5.
const OVERTIME_STAGE_NOTICE_SECONDS = 2 * 60 + 30; // 2:30
const OVERTIME_STAGE_VISIBLE_SECONDS = Math.floor(ROUND_START_SECONDS / 2); // Legacy default (half of round start); use getOvertimeVisibleSeconds().
const OVERTIME_STAGE_ACTIVE_SECONDS = 1 * 60; // 1:00
const OVERTIME_UNLOCK_REMINDER_SECONDS = 30; // 1:30 reminder while locked.
const OVERTIME_MEMBERSHIP_PRUNE_INTERVAL_SECONDS = 1.0; // Prune missed AreaTrigger exits.
// CapturePoint suppression (marker-only usage; players should never see progress).
const OVERTIME_CAPTURE_TIME_DISABLE_SECONDS = 999999;
const OVERTIME_NEUTRALIZE_TIME_DISABLE_SECONDS = 999999;
const OVERTIME_ENGINE_CAPTURE_MAX_MULTIPLIER = 0; // Engine CP capture multiplier (0 disables engine-driven capture; script owns progress).
const OVERTIME_FLAG_ICON_COLOR = mod.CreateVector(1, 1, 1);

// Overtime HUD layout + sizing (placement near round-end dialog).
const OVERTIME_UI_OFFSET_X = 0;
const OVERTIME_UI_OFFSET_Y = 154;
const OVERTIME_UI_WIDTH = 360;
const OVERTIME_UI_HEIGHT = 90;
const OVERTIME_BAR_WIDTH = 260;
const OVERTIME_BAR_HEIGHT = 6;
const OVERTIME_BAR_OFFSET_Y = 42;
const OVERTIME_COUNT_TEXT_WIDTH = 48;
const OVERTIME_COUNT_TEXT_HEIGHT = 20;
const OVERTIME_COUNT_TEXT_SIZE = 18;
const OVERTIME_PERCENT_TEXT_WIDTH = 32;
const OVERTIME_PERCENT_TEXT_HEIGHT = 16;
const OVERTIME_PERCENT_TEXT_SIZE = OVERTIME_COUNT_TEXT_SIZE;
const OVERTIME_COUNT_OFFSET_X = (OVERTIME_BAR_WIDTH / 2) + 27;
const OVERTIME_COUNT_OFFSET_Y = OVERTIME_BAR_OFFSET_Y - 8;
const OVERTIME_PERCENT_GAP = 0;
const OVERTIME_PERCENT_OFFSET_NUDGE = 8;
const OVERTIME_PERCENT_TEXT_NUDGE = 3;
const OVERTIME_PERCENT_OFFSET_X = OVERTIME_COUNT_OFFSET_X
    + (OVERTIME_COUNT_TEXT_WIDTH / 2)
    + OVERTIME_PERCENT_GAP
    + (OVERTIME_PERCENT_TEXT_WIDTH / 2)
    + OVERTIME_PERCENT_OFFSET_NUDGE;
const OVERTIME_PERCENT_OFFSET_Y = OVERTIME_COUNT_OFFSET_Y + 2;
const OVERTIME_COUNT_BG_ALPHA = 0.6;
const OVERTIME_COUNT_BORDER_ALPHA = 1.0;
const OVERTIME_COUNT_BORDER_GROW = 4;
const OVERTIME_COUNT_T1_RGB: [number, number, number] = [112 / 255, 235 / 255, 255 / 255];
const OVERTIME_COUNT_T2_RGB: [number, number, number] = [1, 131 / 255, 97 / 255];
const OVERTIME_COUNT_TEXT_RGB: [number, number, number] = [1, 1, 1];
const OVERTIME_COUNT_CROWN_SIZE = 24;
const OVERTIME_PERCENT_CROWN_OFFSET_Y = OVERTIME_PERCENT_OFFSET_Y - 21;
const OVERTIME_COUNT_CROWN_RGB: [number, number, number] = [1, 1, 1];
const OVERTIME_COUNT_CROWN_ALPHA = 0.8;
const OVERTIME_BAR_BG_ALPHA = 0.6;
const OVERTIME_BAR_FILL_ALPHA = 0.9;
const OVERTIME_GLOBAL_UI_OFFSET_X = 0;
const OVERTIME_GLOBAL_UI_OFFSET_Y = 100;
const OVERTIME_GLOBAL_UI_WIDTH = 260;
const OVERTIME_GLOBAL_UI_HEIGHT = 44;
const OVERTIME_GLOBAL_BAR_WIDTH = 220;
const OVERTIME_GLOBAL_BAR_HEIGHT = 6;
const OVERTIME_GLOBAL_BAR_OFFSET_Y = 22;

// Team identifiers (script uses T1/T2 semantics).
enum TeamID {
    Team1 = 1,
    Team2 = 2,
}

// Round phase for scoring + HUD state.
enum RoundPhase {
    NotReady = 0,
    Live = 1,
    GameOver = 2,
}

// Round-end detail messaging categories for the round-end dialog.
enum RoundEndDetailReason {
    None = 0,
    Elimination = 1,
    ObjectiveCaptured = 2,
    TimeOverObjectiveProgress = 3,
    TimeOverKills = 4,
    TimeOverDrawEvenElims = 5,
    TimeOverDrawNoAction = 6,
}

// Overtime stage is derived from round clock thresholds.
enum OvertimeStage {
    None = 0,
    Notice = 1,
    Visible = 2,
    Active = 3,
}

// Vehicle registry storage (GlobalVariables).
// Kept at 0/1 to match legacy versions and simplify external tooling.
const REGISTRY_TEAM1_VAR = 0;
const REGISTRY_TEAM2_VAR = 1;

// Registered vehicle arrays persist across rounds until explicitly cleared.
// These live in engine globals (not State) and are used for scoring/registration checks.
const regVehiclesTeam1 = mod.GlobalVariable(REGISTRY_TEAM1_VAR);
const regVehiclesTeam2 = mod.GlobalVariable(REGISTRY_TEAM2_VAR);

// Vehicle ownership tracking (best-effort heuristic):
// - vehIds and vehOwners are parallel arrays keyed by vehicle ObjId.
// - getLastDriver may return undefined if no enter event was observed for the vehicle.
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
const VEHICLE_SPAWNER_BIND_TIMEOUT_SECONDS = 2.0;
const VEHICLE_CAMPED_DISTANCE_METERS = 25.0; // This should not be smaller than VEHICLE_SPAWNER_KEEP_ALIVE_SPAWNER_RADIUS

// Main base triggers + ammo restock tuning.
// Trigger IDs must match the map's spatial data object IDs.
const BACKGROUND_TIME_LIMIT_RESET_SECONDS = 60 * 60; // Extends engine time limit on round start.
const TEAM1_MAIN_BASE_TRIGGER_ID = 501; // Do not change without updating spatial data.
const TEAM2_MAIN_BASE_TRIGGER_ID = 500; // Do not change without updating spatial data.
const RESTOCK_MAG_AMMO_ENTER = 69; // Magazines granted on base entry.
const RESTOCK_MAG_AMMO_EXIT = 1; // Magazines granted on base exit.
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

// Used for Mode selection, e.g. 1v1 driving 1 player per side to ready up and 1 kill to win a round.
type MatchupPreset = {
    leftPlayers: number;
    rightPlayers: number;
    roundKillsTarget: number;
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

// Matchup presets drive round kill targets and slot enablement; auto-start minimums are independent.
const MATCHUP_PRESETS: MatchupPreset[] = [
    { leftPlayers: 1, rightPlayers: 1, roundKillsTarget: 1 },
    { leftPlayers: 2, rightPlayers: 2, roundKillsTarget: 2 },
    { leftPlayers: 3, rightPlayers: 3, roundKillsTarget: 3 },
    { leftPlayers: 4, rightPlayers: 4, roundKillsTarget: 4 },
];

// Derive the initial preset from the default matchup + kill-target values.
const DEFAULT_MATCHUP_PRESET_INDEX = findMatchupPresetIndex(
    DEFAULT_MATCHUP_PRESET_LEFT_PLAYERS,
    DEFAULT_MATCHUP_PRESET_RIGHT_PLAYERS,
    ROUND_KILLS_TARGET
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
const READY_DIALOG_MODE_PRESET_BEST_OF_VANILLA = 3;
const READY_DIALOG_MODE_PRESET_BEST_OF_LADDER = 11;
const READY_DIALOG_MODE_PRESET_MATCHUP_INDEX = 0;
const READY_DIALOG_MODE_PRESET_PLAYERS_PER_SIDE_VANILLA = 2;
const READY_DIALOG_MODE_PRESET_PLAYERS_PER_SIDE_TWL_2V2 = 2;
const READY_DIALOG_MODE_PRESET_PLAYERS_PER_SIDE_TWL_1V1 = 1;
const READY_DIALOG_MODE_PRESET_VEHICLE_INDEX = 0;
let suppressReadyDialogModeAutoSwitch = false;
// Aircraft ceiling enforcement mode (hard = engine limiter only, soft = scripted nudges).
const AIRCRAFT_CEILING_ENFORCEMENT_MODE: "hard" | "soft" = "hard";
// Soft ceiling enforcement: keep the engine's hard limiter above gameplay to avoid sticky flight.
const AIRCRAFT_SOFT_CEILING_HARD_BUFFER = 100; // Adjustable buffer above the soft ceiling (world Y units).
const AIRCRAFT_SOFT_CEILING_ENTER_BUFFER = 10; // Start enforcing once above soft+buffer.
const AIRCRAFT_SOFT_CEILING_EXIT_BUFFER = 20; // Stop enforcing once below soft-buffer.
const AIRCRAFT_SOFT_CEILING_NUDGE_MIN_STEP = 0.3; // Minimum downward nudge step while enforcing.
const AIRCRAFT_SOFT_CEILING_NUDGE_MAX_STEP = 6.0; // Maximum downward nudge step while enforcing.
const AIRCRAFT_SOFT_CEILING_NUDGE_INTERVAL_SECONDS = 0.15; // Minimum time between nudges.
const AIRCRAFT_SOFT_CEILING_VELOCITY_SCALE = 1.1; // Scale upward velocity to counter climb without a hard cap.
const AIRCRAFT_SOFT_CEILING_HARD_STEP_MULTIPLIER = 2.0; // Extra push if far above soft+buffer.
const AIRCRAFT_SOFT_CEILING_TICK_SECONDS = 0.2; // Loop cadence for soft ceiling enforcement.

// Pregame countdown tuning (Ready Up -> round start).
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

// Team switch behavior configuration (safe to tweak).
// - enableTeamSwitch: master toggle for the interact-based team switch dialog.
// - interactPointMinLifetime/MaxLifetime: lifetime window before auto-despawn.
// - velocityThreshold: remove interact point while player is moving.
const TEAMSWITCHCONFIG: TeamSwitchConfig = {
    enableTeamSwitch: true,
    interactPointMinLifetime: 1,
    interactPointMaxLifetime: 3,
    velocityThreshold: 3,
};

// Admin panel toggle debounce (seconds). Prevents double-toggle from press/release events.
const ADMIN_PANEL_TOGGLE_COOLDOWN_SECONDS = 0.2;

// Clock + HUD layout constants (pixels unless noted).
const TOP_HUD_OFFSET_Y = 10;
const CLOCK_POSITION_X = 0;
const CLOCK_POSITION_Y = 53 + TOP_HUD_OFFSET_Y;
const CLOCK_WIDTH = 220;
const CLOCK_HEIGHT = 44;
const ROUND_LIVE_HELP_OFFSET_Y = 67;
const ROUND_COUNTER_OFFSET_X = -6;
const ROUND_SLASH_OFFSET_X = -6;
const TOP_HUD_ROOT_WIDTH = 1920;
const TOP_HUD_ROOT_HEIGHT = 260;
const ROUND_LIVE_HELP_WIDTH = 300;
const ROUND_LIVE_HELP_HEIGHT = 18;
const CLOCK_FONT_SIZE = 32;
const LOW_TIME_THRESHOLD_SECONDS = 60; // Low-time color threshold in seconds.
// HUD text drop shadow offset (pixels): negative X moves left, negative Y moves up.
// Shared shadow offsets for stacked HUD text layers.
const HUD_TEXT_SHADOW_OFFSET_X = -1;
const HUD_TEXT_SHADOW_OFFSET_Y = -1;

// HUD status colors (vectors are RGB 0..1).
const COLOR_NORMAL = mod.CreateVector(1, 1, 1);
const COLOR_LOW_TIME = mod.CreateVector(1, 131 / 255, 97 / 255);
const COLOR_READY_GREEN = mod.CreateVector(173 / 255, 253 / 255, 134 / 255); // #ADFD86

// Status / emphasis colors (use constants; do not inline CreateVector() in UI code).
const COLOR_NOT_READY_RED = mod.CreateVector(1, 0, 0);
const COLOR_WARNING_YELLOW = mod.CreateVector(1, 1, 0);

// Buttons look and feel (base / selected / pressed / border).
const COLOR_BUTTON_BASE = COLOR_GRAY;
const BUTTON_OPACITY_BASE = 0.75;
const COLOR_BUTTON_SELECTED = COLOR_BLUE;
const BUTTON_OPACITY_SELECTED = 0.75;
const COLOR_BUTTON_PRESSED = COLOR_WHITE;
const BUTTON_OPACITY_PRESSED = 0.75;
const COLOR_BUTTON_BORDER = COLOR_GRAY;
const BUTTON_BORDER_OPACITY = 0.50;
const BUTTON_BORDER_PADDING = 0;

// Ready Dialog
const READY_DIALOG_SMALL_BUTTON_WIDTH = 26;
const READY_DIALOG_SMALL_BUTTON_HEIGHT = 24;
const READY_DIALOG_MAIN_BUTTON_WIDTH = 300;
const READY_DIALOG_MAIN_BUTTON_HEIGHT = 45;
// Split bottom-center buttons: Ready (left of center) + Auto-Ready (right of center).
const READY_DIALOG_READY_BUTTON_OFFSET_X = -(Math.floor(READY_DIALOG_MAIN_BUTTON_WIDTH / 2) + 10);
const READY_DIALOG_AUTO_READY_BUTTON_OFFSET_X = Math.floor(READY_DIALOG_MAIN_BUTTON_WIDTH / 2) + 10;
const READY_DIALOG_CONFIRM_BUTTON_GAP = 8;
const READY_DIALOG_CONFIRM_BUTTON_WIDTH = READY_DIALOG_MAIN_BUTTON_WIDTH - 40;
const READY_DIALOG_RESET_BUTTON_WIDTH = Math.floor((READY_DIALOG_MAIN_BUTTON_WIDTH - 40) / 2);
const READY_DIALOG_RESET_BUTTON_OFFSET_X = 0;
const READY_PANEL_T1_BG_COLOR = mod.CreateVector(0.10, 0.25, 0.70);
const READY_PANEL_T2_BG_COLOR = mod.CreateVector(0.70, 0.15, 0.15);
const READY_PANEL_BG_ALPHA = 0.20;
const READY_DIALOG_BUTTON_TEXT_COLOR_RGB: [number, number, number] = [1, 1, 1];
const READY_DIALOG_LABEL_TEXT_COLOR = COLOR_WHITE;
const READY_DIALOG_BORDER_COLOR = COLOR_GRAY;

// Admin Panel
const ADMIN_PANEL_HEIGHT = 694;
const ADMIN_PANEL_PADDING = 5;
const ADMIN_PANEL_BASE_X = -5;
const ADMIN_PANEL_BASE_Y = 15;
const ADMIN_PANEL_OFFSET_X = 10;
const ADMIN_PANEL_OFFSET_Y = 15;
const ADMIN_PANEL_TOGGLE_OFFSET_X = 10;
const ADMIN_PANEL_TOGGLE_OFFSET_Y = 15;
const ADMIN_PANEL_TOGGLE_WIDTH = 120;
const ADMIN_PANEL_TOGGLE_HEIGHT = 24;
const ADMIN_PANEL_BUTTON_SIZE_X = 48;
const ADMIN_PANEL_BUTTON_SIZE_Y = 30;
const ADMIN_PANEL_LABEL_SIZE_X = 130;
const ADMIN_PANEL_CONTENT_WIDTH = (ADMIN_PANEL_BUTTON_SIZE_X * 2) + ADMIN_PANEL_LABEL_SIZE_X + 16;
const ADMIN_PANEL_ROW_SPACING_Y = 4;
const ADMIN_PANEL_VALUE_SIZE_X = 46;
const ADMIN_PANEL_TIEBREAKER_LABEL_HEIGHT = 16;
const ADMIN_PANEL_TIEBREAKER_BUTTON_SIZE = 26;
const ADMIN_PANEL_TIEBREAKER_BUTTON_SPACING = 4;
const ADMIN_PANEL_BG_COLOR = COLOR_DARK_BLACK;
const ADMIN_PANEL_BG_ALPHA = 1.0;
const ADMIN_PANEL_BG_FILL = mod.UIBgFill.Blur;
const ADMIN_PANEL_LABEL_TEXT_COLOR_RGB: [number, number, number] = [1, 1, 1];
const ADMIN_PANEL_BUTTON_TEXT_COLOR = COLOR_WHITE;
const ADMIN_PANEL_LABEL_TEXT_COLOR = COLOR_WHITE;
const ADMIN_TIEBREAKER_OVERRIDE_LETTERS = ["A", "B", "C", "D", "E", "F", "G"];
const OVERTIME_FLAG_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const OVERTIME_TANK_ZONE_LETTERS = ["A", "B", "C", "D", "E", "F", "G"];
const OVERTIME_HELI_ZONE_LETTERS = ["H"];
const ADMIN_TIEBREAKER_MODE_OPTIONS = [
    mod.stringkeys.twl.adminPanel.labels.tieBreakerModeLastRoundOnly,
    mod.stringkeys.twl.adminPanel.labels.tieBreakerModeAllRounds,
    mod.stringkeys.twl.adminPanel.labels.tieBreakerModeDisabled,
];
const ADMIN_TIEBREAKER_MODE_ACTION_KEYS = [
    mod.stringkeys.twl.adminPanel.actions.tieBreakerModeLastRoundOnly,
    mod.stringkeys.twl.adminPanel.actions.tieBreakerModeAllRounds,
    mod.stringkeys.twl.adminPanel.actions.tieBreakerModeDisabled,
];
const ADMIN_TIEBREAKER_MODE_DEFAULT_INDEX = 0;

// Victory dialog theme colors (ParseUI expects RGB tuples, not vectors).
const VICTORY_BG_RGB: [number, number, number] = [0.0314, 0.0431, 0.0431];
const VICTORY_TEAM1_BG_RGB: [number, number, number] = [0.1098, 0.2304, 0.25];
const VICTORY_TEAM2_BG_RGB: [number, number, number] = [0.25, 0.1284, 0.0951];
const VICTORY_TEAM1_TEXT_RGB: [number, number, number] = [0.4392, 0.9216, 1];
const VICTORY_TEAM2_TEXT_RGB: [number, number, number] = [1, 0.5137, 0.3804];
const VICTORY_DIALOG_WIDTH = 360;
const VICTORY_DIALOG_HEIGHT = 500;
const VICTORY_DIALOG_ROSTER_ROW_Y = 282;
const VICTORY_DIALOG_ROSTER_ROW_WIDTH = 340;
const VICTORY_DIALOG_ROSTER_ROW_HEIGHT_MAX = 200;
const VICTORY_DIALOG_ROSTER_CONTAINER_WIDTH = 160;
const VICTORY_DIALOG_ROSTER_ROW_HEIGHT = 12;
const VICTORY_DIALOG_ROSTER_ROW_PADDING_TOP = 4;
const VICTORY_DIALOG_ROSTER_ROW_PADDING_BOTTOM = 4;
const VICTORY_DIALOG_BOTTOM_PADDING = 18;
const VICTORY_CROWN_SIZE = 16;
const VICTORY_CROWN_OFFSET_X_LEFT = 58;
const VICTORY_CROWN_OFFSET_X_RIGHT = -58;
const VICTORY_CROWN_OFFSET_Y = 8;
const VICTORY_CROWN_COLOR_RGB: [number, number, number] = [1, 252 / 255, 156 / 255];
const SPAWN_DISABLED_TEXT_WIDTH = 640;
const SPAWN_DISABLED_TEXT_HEIGHT = 36;
const SPAWN_DISABLED_TEXT_POS_Y = 336;
const SPAWN_DISABLED_TEXT_SIZE = 26;
const SPAWN_DISABLED_TEXT_COLOR_RGB: [number, number, number] = [1, 0.1, 0.1];

// Main base messaging string keys (Strings.json).
const STR_ENTERED_MAIN_BASE = mod.stringkeys.twl.notifications.enteredMainBase;
const STR_EXITED_MAIN_BASE = mod.stringkeys.twl.notifications.exitedMainBase;
const STR_AMMO_RESTOCKED = mod.stringkeys.twl.notifications.ammoRestocked;
const STR_READYUP_RETURN_TO_BASE_NOT_LIVE = mod.stringkeys.twl.notifications.readyupReturnToBaseNotLive;
const STR_PLAYER_READIED_UP = mod.stringkeys.twl.notifications.playerReadiedUp;
const STR_PLAYER_AUTO_READIED_UP = mod.stringkeys.twl.notifications.autoReadiedUp;
const STR_JOIN_PROMPT_TITLE = mod.stringkeys.twl.joinPrompt.title;
const STR_JOIN_PROMPT_DISMISS = mod.stringkeys.twl.joinPrompt.dismiss;
const STR_JOIN_PROMPT_DISMISS_SHOW_MORE_TIPS = mod.stringkeys.twl.joinPrompt.dismissShowMoreTips;
const STR_JOIN_PROMPT_NEVER_SHOW = mod.stringkeys.twl.joinPrompt.neverShowAgain;
const STR_JOIN_PROMPT_BODY_MANDATORY1 = mod.stringkeys.twl.joinPrompt.body.mandatory1;
const STR_JOIN_PROMPT_BODY_MANDATORY2 = mod.stringkeys.twl.joinPrompt.body.mandatory2;
const STR_JOIN_PROMPT_BODY_TIP3 = mod.stringkeys.twl.joinPrompt.body.tip3;
const STR_JOIN_PROMPT_BODY_TIP4 = mod.stringkeys.twl.joinPrompt.body.tip4;
const STR_JOIN_PROMPT_BODY_TIP5 = mod.stringkeys.twl.joinPrompt.body.tip5;
const STR_JOIN_PROMPT_BODY_TIP6 = mod.stringkeys.twl.joinPrompt.body.tip6;
const STR_JOIN_PROMPT_BODY_TIP7 = mod.stringkeys.twl.joinPrompt.body.tip7;
const STR_JOIN_PROMPT_BODY_TIP8 = mod.stringkeys.twl.joinPrompt.body.tip8;
const STR_JOIN_PROMPT_BODY_TIP9 = mod.stringkeys.twl.joinPrompt.body.tip9;
const STR_JOIN_PROMPT_BODY_TIP10 = mod.stringkeys.twl.joinPrompt.body.tip10;
const STR_JOIN_PROMPT_BODY_TIP11 = mod.stringkeys.twl.joinPrompt.body.tip11;
const STR_JOIN_PROMPT_BODY_TIP12 = mod.stringkeys.twl.joinPrompt.body.tip12;
const STR_JOIN_PROMPT_BODY_TIP13 = mod.stringkeys.twl.joinPrompt.body.tip13;
const STR_JOIN_PROMPT_BODY_TIP14 = mod.stringkeys.twl.joinPrompt.body.tip14;
const STR_JOIN_PROMPT_BODY_TIP15 = mod.stringkeys.twl.joinPrompt.body.tip15;
const STR_JOIN_PROMPT_BODY_TIP16 = mod.stringkeys.twl.joinPrompt.body.tip16;
const STR_JOIN_PROMPT_BODY_TIP17 = mod.stringkeys.twl.joinPrompt.body.tip17;
const STR_JOIN_PROMPT_BODY_TIP18 = mod.stringkeys.twl.joinPrompt.body.tip18;
const STR_JOIN_PROMPT_BODY_TIP19 = mod.stringkeys.twl.joinPrompt.body.tip19;
const STR_JOIN_PROMPT_BODY_TIP20 = mod.stringkeys.twl.joinPrompt.body.tip20;
const JOIN_PROMPT_BODY_SEQUENCE_KEYS: number[] = [
    STR_JOIN_PROMPT_BODY_MANDATORY1,
    STR_JOIN_PROMPT_BODY_MANDATORY2,
    STR_JOIN_PROMPT_BODY_TIP3,
    STR_JOIN_PROMPT_BODY_TIP4,
    STR_JOIN_PROMPT_BODY_TIP5,
    STR_JOIN_PROMPT_BODY_TIP6,
    STR_JOIN_PROMPT_BODY_TIP7,
    STR_JOIN_PROMPT_BODY_TIP8,
    STR_JOIN_PROMPT_BODY_TIP9,
    STR_JOIN_PROMPT_BODY_TIP10,
    STR_JOIN_PROMPT_BODY_TIP11,
    STR_JOIN_PROMPT_BODY_TIP12,
    STR_JOIN_PROMPT_BODY_TIP13,
    STR_JOIN_PROMPT_BODY_TIP14,
    STR_JOIN_PROMPT_BODY_TIP15,
    STR_JOIN_PROMPT_BODY_TIP16,
    STR_JOIN_PROMPT_BODY_TIP17,
    STR_JOIN_PROMPT_BODY_TIP18,
    STR_JOIN_PROMPT_BODY_TIP19,
    STR_JOIN_PROMPT_BODY_TIP20,
];

// Add any body keys to skip (e.g., tips with empty strings).
const JOIN_PROMPT_BODY_SEQUENCE_SKIP_KEYS: number[] = [
    STR_JOIN_PROMPT_BODY_TIP14,
    STR_JOIN_PROMPT_BODY_TIP15,
    STR_JOIN_PROMPT_BODY_TIP16,
    STR_JOIN_PROMPT_BODY_TIP17,
    STR_JOIN_PROMPT_BODY_TIP18,
    STR_JOIN_PROMPT_BODY_TIP19,
    STR_JOIN_PROMPT_BODY_TIP20,
];

// Vehicle registration messaging strings
const STR_ROUND_CLEANUP_SPAWN_TIMEOUT = mod.stringkeys.twl.notifications.roundCleanupSpawnTimeout;
const STR_VEHICLE_SPAWN_RETRY = mod.stringkeys.twl.messages.vehicleSpawnRetry;
const STR_VEHICLE_STOLEN_REGISTER = mod.stringkeys.twl.messages.vehicleStolenRegister;
const STR_VEHICLE_REG_NO_CHANGE = mod.stringkeys.twl.messages.vehicleRegistrationNoChange;
const STR_VEHICLE_REG_PENDING_TEAM = mod.stringkeys.twl.messages.vehicleRegistrationPendingTeam;
const STR_READY_DIALOG_MATCHUP_CHANGED = mod.stringkeys.twl.readyDialog.matchupChanged;
const STR_READY_DIALOG_PLAYERS_CHANGED = mod.stringkeys.twl.readyDialog.playersChanged;
const STR_READY_DIALOG_GAME_MODE_CHANGED = mod.stringkeys.twl.readyDialog.gameModeChanged;
const STR_READY_DIALOG_AIRCRAFT_CEILING_CHANGED = mod.stringkeys.twl.readyDialog.aircraftCeilingChanged;
const STR_READY_DIALOG_AIRCRAFT_CEILING_VANILLA = mod.stringkeys.twl.readyDialog.aircraftCeilingVanilla;
const STR_HUD_SETTINGS_GAME_MODE_FORMAT = mod.stringkeys.twl.hud.settings.gameModeFormat;
const STR_HUD_SETTINGS_AIRCRAFT_CEILING_FORMAT = mod.stringkeys.twl.hud.settings.aircraftCeilingFormat;
const STR_HUD_SETTINGS_VEHICLES_TEAM_FORMAT = mod.stringkeys.twl.hud.settings.vehiclesTeamFormat;
const STR_HUD_SETTINGS_VEHICLES_MATCHUP_FORMAT = mod.stringkeys.twl.hud.settings.vehiclesMatchupFormat;
const STR_HUD_SETTINGS_PLAYERS_FORMAT = mod.stringkeys.twl.hud.settings.playersFormat;
const STR_HUD_SETTINGS_GAME_MODE_DEFAULT = mod.stringkeys.twl.hud.settings.gameModeDefault;
const STR_HUD_SETTINGS_VALUE_DEFAULT = mod.stringkeys.twl.hud.settings.valueDefault;
const STR_HUD_SETTINGS_VALUE_MAP_DEFAULT = mod.stringkeys.twl.hud.settings.valueMapDefault;
const STR_UI_X = mod.stringkeys.twl.ui.x;
const STR_OVERLINE_TAKEOFF_TITLE = mod.stringkeys.twl.overLine.takeoffTitle;
const STR_OVERLINE_TAKEOFF_SUBTITLE = mod.stringkeys.twl.overLine.takeoffSubtitle;

// Overtime announcements + flag capture UI strings
const STR_OVERTIME_SUB_NOTICE = mod.stringkeys.twl.overtime.subtitle.notice;
const STR_OVERTIME_TITLE_VISIBLE = mod.stringkeys.twl.overtime.title.visible;
const STR_OVERTIME_TITLE_VISIBLE_ADMIN = mod.stringkeys.twl.overtime.title.visibleAdmin;
const STR_OVERTIME_SUB_UNLOCKS_IN = mod.stringkeys.twl.overtime.subtitle.unlocksIn;
const STR_OVERTIME_SUB_UNLOCKS_NOW = mod.stringkeys.twl.overtime.subtitle.unlocksNow;
const STR_FLAG_TITLE = mod.stringkeys.twl.flagCapture.title;
const STR_FLAG_TITLE_LOCKED_FORMAT = mod.stringkeys.twl.flagCapture.lockedTitleFormat;
const STR_FLAG_TITLE_ACTIVE_FORMAT = mod.stringkeys.twl.flagCapture.activeTitleFormat;
const STR_FLAG_ACTIVATES_IN_FORMAT = mod.stringkeys.twl.flagCapture.activatesInFormat;
const STR_FLAG_STATUS_CAPTURING = mod.stringkeys.twl.flagCapture.status.capturing;
const STR_FLAG_STATUS_LOSING = mod.stringkeys.twl.flagCapture.status.losing;
const STR_FLAG_STATUS_STALLED = mod.stringkeys.twl.flagCapture.status.stalled;
const STR_FLAG_STATUS_RESETTING = mod.stringkeys.twl.flagCapture.status.resetting;
const STR_FLAG_COUNTS_LEFT_FORMAT = mod.stringkeys.twl.flagCapture.counts.leftFormat;
const STR_FLAG_COUNTS_RIGHT_FORMAT = mod.stringkeys.twl.flagCapture.counts.rightFormat;
const STR_FLAG_PROGRESS_FORMAT = mod.stringkeys.twl.flagCapture.progress.format;
const STR_FLAG_VEHICLE_REQUIRED = mod.stringkeys.twl.flagCapture.vehicleRequired;
const STR_FLAG_PREVIEW_ACTIVE = mod.stringkeys.twl.flagCapture.previewActiveFormat;
// WorldIcon text placeholders must be string keys, not raw letters.
const STR_FLAG_LETTER_UNKNOWN = mod.stringkeys.twl.flagCapture.letters.unknown;
const STR_FLAG_LETTER_KEYS: number[] = [
    mod.stringkeys.twl.flagCapture.letters.A,
    mod.stringkeys.twl.flagCapture.letters.B,
    mod.stringkeys.twl.flagCapture.letters.C,
    mod.stringkeys.twl.flagCapture.letters.D,
    mod.stringkeys.twl.flagCapture.letters.E,
    mod.stringkeys.twl.flagCapture.letters.F,
    mod.stringkeys.twl.flagCapture.letters.G,
    mod.stringkeys.twl.flagCapture.letters.H,
];
const STR_DEBUG_CP_VIS_RESET = mod.stringkeys.twl.debug.cpVisReset;
const STR_DEBUG_CP_VIS_HARD_RESET = mod.stringkeys.twl.debug.cpVisHardReset;
const STR_ROUND_START_TITLE = mod.stringkeys.twl.roundStart.title;
const STR_ROUND_START_SUBTITLE = mod.stringkeys.twl.roundStart.subtitle;
const STR_ROUND_END_DETAIL_WIN_ELIMINATION = mod.stringkeys.twl.roundEnd.detail.winElimination;
const STR_ROUND_END_DETAIL_LOSE_ELIMINATION = mod.stringkeys.twl.roundEnd.detail.loseElimination;
const STR_ROUND_END_DETAIL_WIN_OBJECTIVE_CAPTURED = mod.stringkeys.twl.roundEnd.detail.winObjectiveCaptured;
const STR_ROUND_END_DETAIL_LOSE_OBJECTIVE_CAPTURED = mod.stringkeys.twl.roundEnd.detail.loseObjectiveCaptured;
const STR_ROUND_END_DETAIL_WIN_OBJECTIVE_PROGRESS = mod.stringkeys.twl.roundEnd.detail.winObjectiveProgress;
const STR_ROUND_END_DETAIL_LOSE_OBJECTIVE_PROGRESS = mod.stringkeys.twl.roundEnd.detail.loseObjectiveProgress;
const STR_ROUND_END_DETAIL_WIN_TIME_OVER_KILLS = mod.stringkeys.twl.roundEnd.detail.winTimeOverKills;
const STR_ROUND_END_DETAIL_LOSE_TIME_OVER_KILLS = mod.stringkeys.twl.roundEnd.detail.loseTimeOverKills;
const STR_ROUND_END_DETAIL_DRAW_EVEN_ELIMS = mod.stringkeys.twl.roundEnd.detail.drawEvenElims;
const STR_ROUND_END_DETAIL_DRAW_NO_ACTION = mod.stringkeys.twl.roundEnd.detail.drawNoAction;

// Shared global message layout (OverLine + round start + overtime announcements).
const BIG_TITLE_SIZE = 96; // Font size in UI scale units.
const BIG_SUBTITLE_SIZE = 28;
const BIG_TITLE_OFFSET_Y = 160; // Position below top HUD.
const BIG_SUBTITLE_OFFSET_Y = 300; // Subtitle position
const BIG_MESSAGE_BG_ALPHA = 0.6;
const BIG_TITLE_BG_WIDTH = 2500;
const BIG_TITLE_BG_HEIGHT = 140;
const BIG_SUBTITLE_BG_WIDTH = 2500;
const BIG_SUBTITLE_BG_HEIGHT = 80;
const SMALL_TITLE_BG_HEIGHT = 40;
const SMALL_TITLE_SIZE = 28; // ~1/4 of big title size.
const SMALL_SUBTITLE_SIZE = 15; // ~1/4 of big subtitle size.
const SMALL_TITLE_OFFSET_Y = 210;
const SMALL_SUBTITLE_OFFSET_Y = 260;
const BIG_MESSAGE_DURATION_SECONDS = 5.5; // Duration in seconds.

type GlobalMessageLayout = {
    titleSize: number;
    subtitleSize: number;
    titleOffsetY: number;
    subtitleOffsetY: number;
    titleBgHeight?: number;
    useBackground?: boolean;
    subtitleUseBackground?: boolean;
};

const BIG_MESSAGE_LAYOUT: GlobalMessageLayout = {
    titleSize: BIG_TITLE_SIZE,
    subtitleSize: BIG_SUBTITLE_SIZE,
    titleOffsetY: BIG_TITLE_OFFSET_Y,
    subtitleOffsetY: BIG_SUBTITLE_OFFSET_Y,
    useBackground: true,
};

const SMALL_MESSAGE_LAYOUT: GlobalMessageLayout = {
    titleSize: SMALL_TITLE_SIZE,
    subtitleSize: SMALL_SUBTITLE_SIZE,
    titleOffsetY: SMALL_TITLE_OFFSET_Y,
    subtitleOffsetY: SMALL_SUBTITLE_OFFSET_Y,
    titleBgHeight: SMALL_TITLE_BG_HEIGHT,
    useBackground: true,
    subtitleUseBackground: true,
};

//#endregion ----------------- Constants, Enums and Types --------------------
