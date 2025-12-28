//#region -------------------- Versioning --------------------

// version: 0.152 | Date: 12.28.25 | Time: 11:18 UTC
// name of script: TWL_Tanks_Sandbox_Beta_Script.ts
// name of paired strings file: TWL_Tanks_Sandbox_Beta_Strings.strings.json
// policy: the string hud.branding.title should display this same version at the end of the title
// policy: increment minor version on every change (UTC)
// policy: major versions reserved for milestone feature releases (primary authors only)
// policy: EOF version line must match the header version and timestamp

//#endregion ----------------- Versioning --------------------



//#region -------------------- Authors / Attribution --------------------

// Primary Authors: Polynorblu, UberDuberSoldat, Dox
// Code generation, assistance and support by: ChatGPT (OpenAI, GPT-5.2, GPT-5.2-Codex)
// BF6 Portal Community Tools used/referenced:
//  - Portal Community Discord: https://discord.com/invite/battlefield-portal-community-870246147455877181
//  - TypeScript Project Template for Battlefield 6 Portal Scripting by Mike DeLuca: https://github.com/deluca-mike/bf6-portal-scripting-template
//     - Multi-Click detector by Mike DeLuca: https://github.com/deluca-mike/bf6-portal-utils/tree/master/interact-multi-click-detector
//  - Team Switch UI Template by TheOzzy: https://github.com/The0zzy/BF6-Portal-TeamSwitchUI
//  - BF6 Portal Assistant by Quoeiza: https://chatgpt.com/g/g-68f28580eefc8191b4cf40bbf2305db3-bf6-portal-assistant
//     - GPT Prompt: https://gist.github.com/Quoeiza/8085f142ad8a05ee04b79adcc4ad8fd7
//  - BF6 User Interface Tool builder by EagleNait: https://tools.bfportal.gg/ui-builder/
//  - Custom Conquest Template by andy6170: https://bfportal.gg/experiences/custom-conquest-template/

//#endregion ----------------- Authors / Attribution --------------------



//#region -------------------- Changelog / History --------------------

// v0.152: Forcing supply boxes on every spawn, to ensure no other gadget loophole
// v0.151: Finalized string.json into new format with updated strings policy
// v0.148: Added Changelog / History section to script header
// v0.134: Last working version before enum/interface refactor (see archive\enum_interface_implementation_plan.md)
// v0.129: Release version for Ladder with 7 maps
// v0.059: Last version before switching primarly from GPT-5.2 web client to GPT-5.2-Codex in VS Code

//#endregion ----------------- Changelog / History --------------------



//#region -------------------- Gamemode Description --------------------

// This script implements:
//   - Vehicle scoring + round/match flow (start/end, timers, victory dialog)
//   - Main-base enter/exit tracking (ammo restock + base state)
//   - Triple-tap "Ready Up" dialog (roster, ready states, base gating, auto-start)
//   - Team switching via a single "Swap Teams" button (forces undeploy)
// This experience is a round-based, vehicle-only scoring mode:
// - Vehicles become "registered" to a team the first time a player enters them.
// - When a registered vehicle is destroyed during a LIVE round, the opposing team earns +1 Round Kill.
// - A round ends when a team reaches the Round Kill target (e.g. 2 kills for 2v2) or the round clock expires.
// - Entering/Exiting main-base provides a gadget ammo restock so players can rearm/resupply if needed mid match or post match
// - Match record (wins/losses/ties) is tracked across rounds; HUD is a projection of that authoritative state.
// - Round end and Victory end dialogs communicate results in timed windows for clarity
//
// Glossary (terms):
// - "Round Kills": points earned this round (vehicle-destruction points).
// - "Total Kills": lifetime match total (if used/shown); not required for win condition.
// - "Registered vehicle": a vehicle currently stored in the team's registered list (GlobalVariables 0/1).
// - "Last driver": best-effort owner used for messaging only; not authoritative for scoring.
// - "HUD": always-on per-player overlay (cached by pid).
// - "Dialog": modal UI that enables UI input mode (Team Switch / Victory).
//
// Glossary (script semantics)
// - T1 / T2: The two competing teams in this mode; UI may still use Left/Right for layout only.
// - Match totals: Counters that persist across rounds (e.g., total kills, match wins).
// - Round counters: Counters that reset on round start (e.g., round kills, round clock).
// - Authoritative state: The single source of truth for match-critical counters; HUD is a projection of this state.
//
// Recommendations on tweaking/adjusting/customizing this experience
// - General UI layout tip: Most widgets define an offset via `position: [x, y]`.
// - Change those numbers to nudge that widget relative to its anchor; the perceived direction can vary by anchoring, so verify in-game after edits.

//#endregion -------------------- Gamemode Description --------------------



//#region -------------------- Improvements punchlist --------------------

/*
 * List of improvements (for only humans and not LLMs, CODEX or GPT to design and implement):
 * --- Code Cleanup: Centralize color name constants to be global, not specific to functions, so they're easier to reuse
 * --- Code Cleanup: Gut unused functions / commented out functions from script file (done?)
 * --- Massive refactor - Design and evaluate new method for vehicle registration 
 * ------ Design based on vehicle spawners and pre-defined object IDs from Godot
 * --- Code Cleanup: Address renderReadyDialogForAllVisibleViewers vs refreshReadyDialogForAllVisibleViewers (overlap/duplication?)
 * --- Code Cleanup: We dont need unique functions for single message strings? can we simplify this pattern: NotifyAmmoRestocked(eventPlayer);
 * --- Code Cleanup: There are many various functions which generally do the same thing, can we consider how to unify UI updates/refreshes or use TS template UI library
 * --- Code Cleanup: Embrace TS Template project and break mega file into modular files...
 * --- Code Cleanup: See src\clunkycode.md for various code smells and cleanup opportunities
 * 
 * List of Nice to Haves (for only humans and not LLMs, CODEX or GPT to design and implement):
 * - Identify possibility of code implemented vehicle spawners - will reduce spatial data requirements and increase modularity
 * - Review user disconnecting during round countdown to stop countdown?
 * - Only let round max decrement when round is not live (during live round ends game early?) 
 * - Gameplay: Disable respawn until round is over (or lock player movement when spawning)? (prevents griefing)
 * - Imeplement a user facing toggle for AUTO_START_MIN_ACTIVE_PLAYERS?
 * - Pull "Target Kills" out from Admin panel and unify with min active players? e.g. make a "mode selector": 1v1, 2v2, 4v4?
 * - UI Polish: Bigger Triple Tap Dialog Help Text (readability)
 * - UI Polish: Add "Respawn in 10s..." message synced with clock to appear in place at top in yellow instead of "ready up" dialog, during the window of round ending
 * - UI Polish: Round {0} Starting... message tweak during round start countdown
 * - UI Polish: Display user names on Victory dialog to the left and right for each team 
 * - UI Polish: Restart in Xs still rolls over on top match clock 
 * - UI Polish: Clock digits come in to center
 * - UI Polish: HUD moves down so compass can breathe 
 * - UI Polish: Yellow helper text is bigger and taller and wider and lower
 * - SFX Polish: Add sound effects for ready up, round start countdown, round end display, victory display 
 * - SFX Polish: Add sound effect on vehicle registration 
 * - SFX Polish: Add sound effect on vehicle destruction for scoring 
 * - Moonshot Feature: Dynamic Vehicle selection dialog (choose tanks per player) so a single experience can be 1v1, 2v2, 4v4, etc with a selection
 */

//#endregion ----------------- Improvements punchlist --------------------



//#region -------------------- Modlib import --------------------

// If not using bundled TS project you need to use modlib import
// @ts-ignore - ignores error on Portal webclient with importing modlib
import * as modlib from "modlib";
// TS project comes with local modlib functions, if using that then no need to import modlib
// - There seems to be an error with TS template's project local modlib FilteredArray function (drops all vehicles in vehicle array?!)

//#endregion ----------------- Modlib import --------------------



//#region -------------------- Constant Variables and Types --------------------

// Core gameplay tuning defaults (safe to edit).
// Units: seconds unless otherwise noted.
const DEFAULT_MAX_ROUNDS = 5; // Best-of rounds for a full match.
const DEFAULT_ROUND_KILLS_TARGET = 1; // 1 for 1v1, 2 for 2v2, etc.
const ROUND_START_SECONDS = 5 * 60; // Round clock starting time.
const MATCH_END_DELAY_SECONDS = 45; // Victory dialog duration before match end.
const ROUND_END_REDEPLOY_DELAY_SECONDS = 10; // Redeploy delay between rounds.
const ROUND_CLOCK_DEFAULT_SECONDS = ROUND_START_SECONDS; // Source of truth for clock reset.

// Debug/gameplay message toggles:
// - "Debug" messages are development/diagnostic UX (white log / green box).
// - "Gameplay" messages are player-facing round/mode information.
const ENABLE_GAMEPLAY_MESSAGES = true; // Gameplay-critical messaging (both channels). This should be on at all times
const ENABLE_DEBUG_NOTIFICATION_MESSAGES = false; // Green box notifications. Defaults to false.
const ENABLE_DEBUG_HIGHLIGHTED_MESSAGES = false; // White highlighted world log. Defaults to false.

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

// Vehicle registry storage (GlobalVariables).
// Kept at 0/1 to match legacy versions and simplify external tooling.
const REGISTRY_TEAM1_VAR = 0;
const REGISTRY_TEAM2_VAR = 1;

// Registered vehicle arrays persist across rounds until explicitly cleared.
const regVehiclesTeam1 = mod.GlobalVariable(REGISTRY_TEAM1_VAR);
const regVehiclesTeam2 = mod.GlobalVariable(REGISTRY_TEAM2_VAR);

// Vehicle ownership tracking (best-effort heuristic):
// - vehIds and vehOwners are parallel arrays keyed by vehicle ObjId.
// - getLastDriver may return undefined if no enter event was observed for the vehicle.
// - Do not treat this as authoritative killer attribution; it is used only for informative messaging.
const vehIds: number[] = [];
const vehOwners: mod.Player[] = [];

// Main base triggers + ammo restock tuning.
// Trigger IDs must match the map's spatial data object IDs.
const BACKGROUND_TIME_LIMIT_RESET_SECONDS = 60 * 60; // Extends engine time limit on round start.
const TEAM1_MAIN_BASE_TRIGGER_ID = 501; // Do not change without updating spatial data.
const TEAM2_MAIN_BASE_TRIGGER_ID = 500; // Do not change without updating spatial data.
const RESTOCK_MAG_AMMO_ENTER = 69; // Magazines granted on base entry.
const RESTOCK_MAG_AMMO_EXIT = 1; // Magazines granted on base exit.

// Ready-up auto-start gating:
// Set to 1 for solo debug, 2 for 1v1, 4 for 2v2, etc.
const AUTO_START_MIN_ACTIVE_PLAYERS = 1;

// Pregame countdown tuning (Ready Up -> round start).
// Units: seconds and UI scale units.
const PREGAME_COUNTDOWN_INITIAL_DELAY_SECONDS = 0.5;
const PREGAME_COUNTDOWN_STEP_SECONDS = 1.0;
const PREGAME_COUNTDOWN_START_NUMBER = 10;
const PREGAME_COUNTDOWN_SIZE_DIGIT_START = 620;
const PREGAME_COUNTDOWN_SIZE_DIGIT_END = 360;
const PREGAME_COUNTDOWN_SIZE_GO_START = 650;
const PREGAME_COUNTDOWN_SIZE_GO_END = 420;
const PREGAME_COUNTDOWN_GO_HOLD_SECONDS = 0.75;
const PREGAME_COUNTDOWN_ANIMATION_STEPS = 10;
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
const CLOCK_POSITION_X = 0;
const CLOCK_POSITION_Y = 53;
const CLOCK_WIDTH = 220;
const CLOCK_HEIGHT = 44;
const ROUND_LIVE_HELP_WIDTH = 300;
const ROUND_LIVE_HELP_HEIGHT = 18;
const CLOCK_FONT_SIZE = 32;
const LOW_TIME_THRESHOLD_SECONDS = 60; // Low-time color threshold in seconds.

// HUD status colors (vectors are RGB 0..1).
const COLOR_NORMAL = mod.CreateVector(1, 1, 1);
const COLOR_LOW_TIME = mod.CreateVector(1, 131 / 255, 97 / 255);
const COLOR_READY_GREEN = mod.CreateVector(173 / 255, 253 / 255, 134 / 255); // #ADFD86

// Status / emphasis colors (use constants; do not inline CreateVector() in UI code).
const COLOR_NOT_READY_RED = mod.CreateVector(1, 0, 0);
const COLOR_WARNING_YELLOW = mod.CreateVector(1, 1, 0);

// Victory dialog theme colors (ParseUI expects RGB tuples, not vectors).
const VICTORY_BG_RGB: [number, number, number] = [0.0314, 0.0431, 0.0431];
const VICTORY_TEAM1_BG_RGB: [number, number, number] = [0.1098, 0.2304, 0.25];
const VICTORY_TEAM2_BG_RGB: [number, number, number] = [0.25, 0.1284, 0.0951];
const VICTORY_TEAM1_TEXT_RGB: [number, number, number] = [0.4392, 0.9216, 1];
const VICTORY_TEAM2_TEXT_RGB: [number, number, number] = [1, 0.5137, 0.3804];

// Main base messaging string keys (Strings.json).
const STR_ENTERED_MAIN_BASE = mod.stringkeys.twl.notifications.enteredMainBase;
const STR_EXITED_MAIN_BASE = mod.stringkeys.twl.notifications.exitedMainBase;
const STR_AMMO_RESTOCKED = mod.stringkeys.twl.notifications.ammoRestocked;
const STR_READYUP_RETURN_TO_BASE_NOT_LIVE = mod.stringkeys.twl.notifications.readyupReturnToBaseNotLive;

// "Over the line" global warning (pre-round countdown only).
const OVER_LINE_TITLE_SIZE = 96; // Font size in UI scale units.
const OVER_LINE_SUBTITLE_SIZE = 32;
const OVER_LINE_SUBTITLE_OFFSET_Y = 60; // Vertical offset from title.
const OVER_LINE_MESSAGE_DURATION_SECONDS = 5; // Duration in seconds.

//#endregion ----------------- Constant Variables and Types --------------------



//#region ----------------- String Variables --------------------

// -------------------- Strings.json key policy --------------------
//
// - UI labels (static text) should be shared (e.g., Label_TotalKills) rather than duplicated per team.
// - Per-team differences belong in layout/widget placement, not in duplicated label strings.
// - Dynamic values (numbers) are usually written into value widgets directly; avoid creating many one-off strings.
// - If you must use placeholders, keep formatting consistent across the file.
// - Reminder: UI widget `name:` values are NOT Strings.json keys; they are runtime widget IDs.
//
// Policy compliance checklist:
// - New UI text added? Put it in Strings.json under a shared key (no per-team duplication).
// - Using placeholders? Match existing formatting patterns for that section.
// - Reusing an existing label? Use the existing string key rather than a new alias.
// - Avoid creating string key constants unless reused in multiple places.
//
// ------------------------------------------------------------------

// UI widget ID constants (string prefixes used to find widgets).
// All UI widget IDs are per-player; the viewer's pid is appended at use sites.
const UI_TEAMSWITCH_CONTAINER_BASE_ID = "UI_TEAMSWITCH_CONTAINER_BASE_";
const UI_TEAMSWITCH_BUTTON_TEAM1_ID = "UI_TEAMSWITCH_BUTTON_TEAM1_";
const UI_TEAMSWITCH_BUTTON_TEAM1_LABEL_ID = "UI_TEAMSWITCH_BUTTON_TEAM1_LABEL_";
const UI_TEAMSWITCH_BUTTON_TEAM2_ID = "UI_TEAMSWITCH_BUTTON_TEAM2_";
const UI_TEAMSWITCH_BUTTON_TEAM2_LABEL_ID = "UI_TEAMSWITCH_BUTTON_TEAM2_LABEL_";
const UI_TEAMSWITCH_BUTTON_SPECTATE_ID = "UI_TEAMSWITCH_BUTTON_SPECTATE_";
const UI_TEAMSWITCH_BUTTON_SPECTATE_LABEL_ID = "UI_TEAMSWITCH_BUTTON_SPECTATE_LABEL_";
const UI_TEAMSWITCH_BUTTON_CANCEL_ID = "UI_TEAMSWITCH_BUTTON_CANCEL_";
const UI_TEAMSWITCH_BUTTON_CANCEL_LABEL_ID = "UI_TEAMSWITCH_BUTTON_CANCEL_LABEL_";
const UI_TEAMSWITCH_BUTTON_OPTOUT_ID = "UI_TEAMSWITCH_BUTTON_OPTOUT_";
const UI_TEAMSWITCH_BUTTON_OPTOUT_LABEL_ID = "UI_TEAMSWITCH_BUTTON_OPTOUT_LABEL_";
const UI_TEAMSWITCH_DEBUG_TIMELIMIT_ID = "UI_TEAMSWITCH_DEBUG_TIMELIMIT_";

// Ready Dialog (Roster UI) - Widget ID bases (per-player IDs append viewer playerId).
const UI_READY_DIALOG_HEADER_ID = "UI_READY_DIALOG_HEADER_";
const UI_READY_DIALOG_TEAM1_CONTAINER_ID = "UI_READY_DIALOG_TEAM1_CONTAINER_";
const UI_READY_DIALOG_TEAM2_CONTAINER_ID = "UI_READY_DIALOG_TEAM2_CONTAINER_";
const UI_READY_DIALOG_TEAM1_LABEL_ID = "UI_READY_DIALOG_TEAM1_LABEL_";
const UI_READY_DIALOG_TEAM2_LABEL_ID = "UI_READY_DIALOG_TEAM2_LABEL_";
const UI_READY_DIALOG_T1_ROW_NAME_ID = "UI_READY_DIALOG_T1_ROW_NAME_";
const UI_READY_DIALOG_T1_ROW_READY_ID = "UI_READY_DIALOG_T1_ROW_READY_";
const UI_READY_DIALOG_T1_ROW_BASE_ID = "UI_READY_DIALOG_T1_ROW_BASE_";
const UI_READY_DIALOG_T2_ROW_NAME_ID = "UI_READY_DIALOG_T2_ROW_NAME_";
const UI_READY_DIALOG_T2_ROW_READY_ID = "UI_READY_DIALOG_T2_ROW_READY_";
const UI_READY_DIALOG_T2_ROW_BASE_ID = "UI_READY_DIALOG_T2_ROW_BASE_";
const UI_READY_DIALOG_BUTTON_READY_ID = "UI_READY_DIALOG_BUTTON_READY_";
const UI_READY_DIALOG_BUTTON_READY_LABEL_ID = "UI_READY_DIALOG_BUTTON_READY_LABEL_";
const UI_READY_DIALOG_BUTTON_SWAP_ID = "UI_READY_DIALOG_BUTTON_SWAP_";
const UI_READY_DIALOG_BUTTON_SWAP_LABEL_ID = "UI_READY_DIALOG_BUTTON_SWAP_LABEL_";
const UI_READY_DIALOG_BESTOF_LABEL_ID = "UI_READY_DIALOG_BESTOF_LABEL_";
const UI_READY_DIALOG_BESTOF_DEC_ID = "UI_READY_DIALOG_BESTOF_DEC_";
const UI_READY_DIALOG_BESTOF_DEC_LABEL_ID = "UI_READY_DIALOG_BESTOF_DEC_LABEL_";
const UI_READY_DIALOG_BESTOF_INC_ID = "UI_READY_DIALOG_BESTOF_INC_";
const UI_READY_DIALOG_BESTOF_INC_LABEL_ID = "UI_READY_DIALOG_BESTOF_INC_LABEL_";

// Admin/Tester UI - Widget ID bases (per-player IDs append viewer playerId).
const UI_TEST_HEADER_LABEL_ID = "UI_TEST_HEADER_LABEL_";
const UI_TEST_BUTTON_LEFT_WINS_DEC_ID = "UI_TEST_BUTTON_LEFT_WINS_DEC_";
const UI_TEST_BUTTON_LEFT_WINS_INC_ID = "UI_TEST_BUTTON_LEFT_WINS_INC_";
const UI_TEST_BUTTON_RIGHT_WINS_DEC_ID = "UI_TEST_BUTTON_RIGHT_WINS_DEC_";
const UI_TEST_BUTTON_RIGHT_WINS_INC_ID = "UI_TEST_BUTTON_RIGHT_WINS_INC_";
const UI_TEST_BUTTON_LEFT_KILLS_DEC_ID = "UI_TEST_BUTTON_LEFT_KILLS_DEC_";
const UI_TEST_BUTTON_LEFT_KILLS_INC_ID = "UI_TEST_BUTTON_LEFT_KILLS_INC_";
const UI_TEST_BUTTON_RIGHT_KILLS_DEC_ID = "UI_TEST_BUTTON_RIGHT_KILLS_DEC_";
const UI_TEST_BUTTON_RIGHT_KILLS_INC_ID = "UI_TEST_BUTTON_RIGHT_KILLS_INC_";
const UI_ADMIN_BUTTON_T1_ROUND_KILLS_DEC_ID = "UI_ADMIN_BUTTON_T1_ROUND_KILLS_DEC_";
const UI_ADMIN_BUTTON_T1_ROUND_KILLS_INC_ID = "UI_ADMIN_BUTTON_T1_ROUND_KILLS_INC_";
const UI_ADMIN_BUTTON_T2_ROUND_KILLS_DEC_ID = "UI_ADMIN_BUTTON_T2_ROUND_KILLS_DEC_";
const UI_ADMIN_BUTTON_T2_ROUND_KILLS_INC_ID = "UI_ADMIN_BUTTON_T2_ROUND_KILLS_INC_";
const UI_TEST_BUTTON_ROUND_KILLS_TARGET_DEC_ID = "UI_TEST_BUTTON_ROUND_KILLS_TARGET_DEC_";
const UI_TEST_BUTTON_ROUND_KILLS_TARGET_INC_ID = "UI_TEST_BUTTON_ROUND_KILLS_TARGET_INC_";
const UI_TEST_LABEL_ROUND_KILLS_TARGET_ID = "UI_TEST_LABEL_ROUND_KILLS_TARGET_";
const UI_TEST_VALUE_ROUND_KILLS_TARGET_ID = "UI_TEST_VALUE_ROUND_KILLS_TARGET_";
const UI_TEST_BUTTON_TIES_DEC_ID = "UI_TEST_BUTTON_TIES_DEC_";
const UI_TEST_BUTTON_TIES_INC_ID = "UI_TEST_BUTTON_TIES_INC_";
const UI_TEST_BUTTON_CUR_ROUND_DEC_ID = "UI_TEST_BUTTON_CUR_ROUND_DEC_";
const UI_TEST_BUTTON_CUR_ROUND_INC_ID = "UI_TEST_BUTTON_CUR_ROUND_INC_";
const UI_TEST_BUTTON_CLOCK_TIME_DEC_ID = "UI_TEST_BUTTON_CLOCK_TIME_DEC_";
const UI_TEST_BUTTON_CLOCK_TIME_INC_ID = "UI_TEST_BUTTON_CLOCK_TIME_INC_";
const UI_TEST_BUTTON_CLOCK_RESET_ID = "UI_TEST_BUTTON_CLOCK_RESET_";
const UI_TEST_BUTTON_ROUND_START_ID = "UI_TEST_BUTTON_ROUND_START_";
const UI_TEST_BUTTON_ROUND_END_ID = "UI_TEST_BUTTON_ROUND_END_";
const UI_TEST_LABEL_LEFT_WINS_ID = "UI_TEST_LABEL_LEFT_WINS_";
const UI_TEST_LABEL_RIGHT_WINS_ID = "UI_TEST_LABEL_RIGHT_WINS_";
const UI_TEST_LABEL_LEFT_KILLS_ID = "UI_TEST_LABEL_LEFT_KILLS_";
const UI_TEST_LABEL_RIGHT_KILLS_ID = "UI_TEST_LABEL_RIGHT_KILLS_";
const UI_ADMIN_LABEL_T1_ROUND_KILLS_ID = "UI_ADMIN_LABEL_T1_ROUND_KILLS_";
const UI_ADMIN_LABEL_T2_ROUND_KILLS_ID = "UI_ADMIN_LABEL_T2_ROUND_KILLS_";
const UI_TEST_LABEL_TIES_ID = "UI_TEST_LABEL_TIES_";
const UI_TEST_LABEL_CUR_ROUND_ID = "UI_TEST_LABEL_CUR_ROUND_";
const UI_TEST_LABEL_CLOCK_TIME_ID = "UI_TEST_LABEL_CLOCK_TIME_";
const UI_TEST_PLUS_TEXT_ID = "UI_TEST_PLUS_TEXT_";
const UI_TEST_MINUS_TEXT_ID = "UI_TEST_MINUS_TEXT_";
const UI_TEST_RESET_TEXT_ID = "UI_TEST_RESET_TEXT_";
const UI_TEST_ROUND_START_TEXT_ID = "UI_TEST_ROUND_START_TEXT_";
const UI_TEST_ROUND_END_TEXT_ID = "UI_TEST_ROUND_END_TEXT_";

// Admin Panel (decoupled from main Team Switch dialog)
const UI_ADMIN_PANEL_BUTTON_ID = "UI_ADMIN_PANEL_BUTTON_";
const UI_ADMIN_PANEL_BUTTON_LABEL_ID = "UI_ADMIN_PANEL_BUTTON_LABEL_";
const UI_ADMIN_PANEL_CONTAINER_ID = "UI_ADMIN_PANEL_CONTAINER_";

// "Over the line" messaging strings
const OVER_LINE_TITLE_ID = "OverLine_Title_"; 
const OVER_LINE_SUBTITLE_ID = "OverLine_Subtitle_"; 

//#endregion -------------- String Variables --------------------



//#region -------------------- Core gameplay state helpers --------------------

// Core gameplay helper utilities (state sync + messaging gates).

function getMatchWinsTeam(teamNum: TeamID): number {
    // Debug-only: engine GameModeScore can be transient during reconnects / team swaps.
    return Math.floor(mod.GetGameModeScore(mod.GetTeam(teamNum)));
}

function setMatchWinsTeam(teamNum: TeamID, wins: number): void {
    mod.SetGameModeScore(mod.GetTeam(teamNum), Math.max(0, Math.floor(wins)));
}

function shouldSendMessage(isGameplay: boolean, isHighlighted: boolean): boolean {
    if (isGameplay) return ENABLE_GAMEPLAY_MESSAGES;
    return isHighlighted ? ENABLE_DEBUG_HIGHLIGHTED_MESSAGES : ENABLE_DEBUG_NOTIFICATION_MESSAGES;
}

// Round phase helper for readability (avoids scattered enum comparisons).
function isRoundLive(): boolean {
    return State.round.phase === RoundPhase.Live;
}

function sendNotificationMessage(message: mod.Message, isGameplay: boolean, target?: mod.Player | mod.Team): void {
    if (!shouldSendMessage(isGameplay, false)) return;
    if (target) {
        mod.DisplayNotificationMessage(message, target as mod.Player);
        return;
    }
    mod.DisplayNotificationMessage(message);
}

function sendHighlightedWorldLogMessage(message: mod.Message, isGameplay: boolean, target?: mod.Player | mod.Team): void {
    if (!shouldSendMessage(isGameplay, true)) return;
    if (target) {
        mod.DisplayHighlightedWorldLogMessage(message, target as mod.Player);
        return;
    }
    mod.DisplayHighlightedWorldLogMessage(message);
}

// Synchronizes HUD win counters from authoritative match state.
// This should be called after any admin or gameplay mutation of State.match.winsT1/T2.
function syncWinCountersHudFromGameModeScore(): void {
    // Debug-only: do not use for authoritative state; pulling from engine here can latch transient values.
    const t1Wins = getMatchWinsTeam(TeamID.Team1);
    const t2Wins = getMatchWinsTeam(TeamID.Team2);

    State.match.winsT1 = t1Wins;
    State.match.winsT2 = t2Wins;
    syncRoundRecordHudForAllPlayers();

    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const refs = ensureHudForPlayer(p);
        if (!refs) continue;
        setCounterText(refs.leftWinsText, t1Wins);
        setCounterText(refs.rightWinsText, t2Wins);
    }
}

function endGameModeForTeamNum(teamNum: TeamID | 0): void {
    const winningTeam = mod.GetTeam(teamNum);

    // End the match by team consistently; ending "by player" can yield inconsistent engine finalization
    // when players reconnect or briefly join different teams.
    mod.EndGameMode(winningTeam);
}

//#endregion ----------------- Core gameplay state helpers --------------------



//#region -------------------- Shared ID helpers --------------------

function getObjId(obj: any): number {
    return mod.GetObjId(obj);
}

function getTeamNumber(team: mod.Team): TeamID | 0 {
    if (mod.Equals(team, mod.GetTeam(TeamID.Team1))) return TeamID.Team1;
    if (mod.Equals(team, mod.GetTeam(TeamID.Team2))) return TeamID.Team2;
    return 0;
}

function getTeamNameKey(teamNum: TeamID | 0): number {
    if (teamNum === TeamID.Team1) return mod.stringkeys.twl.teams.leftName;
    if (teamNum === TeamID.Team2) return mod.stringkeys.twl.teams.rightName;
    return mod.stringkeys.twl.system.unknownPlayer;
}

function opposingTeam(teamNum: TeamID | 0): TeamID | 0 {
    if (teamNum === TeamID.Team1) return TeamID.Team2;
    if (teamNum === TeamID.Team2) return TeamID.Team1;
    return 0;
}

function safeFind(name: string): mod.UIWidget | undefined {
    try {
        return mod.FindUIWidgetWithName(name, mod.GetUIRoot()) as mod.UIWidget;
    } catch {
        try {
            return mod.FindUIWidgetWithName(name) as mod.UIWidget;
        } catch {
            return undefined;
        }
    }
}

// Safely resolve a Player by pid (mod.GetObjId(player)). Returns undefined if not found.
function safeFindPlayer(pid: number): mod.Player | undefined {
    try {
        const players = mod.AllPlayers();
        const count = mod.CountOf(players);
        for (let i = 0; i < count; i++) {
            const p = mod.ValueInArray(players, i) as mod.Player;
            if (!p || !mod.IsPlayerValid(p)) continue;
        if (mod.GetObjId(p) === pid) return p;
    }
    return undefined;
    } catch {
        return undefined;
    }
}

//#endregion ----------------- Shared ID helpers --------------------



//#region -------------------- HUD Types + Caches --------------------

// We build HUD per-player (playerId receiver) and suffix names with pid to avoid collisions.
type HudRefs = {
    pid: number;

    // Counter text widgets (we only need to update these)
    roundCurText?: mod.UIWidget;
    roundMaxText?: mod.UIWidget;

    leftWinsText?: mod.UIWidget;
    rightWinsText?: mod.UIWidget;

    leftRecordText?: mod.UIWidget;
    rightRecordText?: mod.UIWidget;

    leftRoundKillsText?: mod.UIWidget;
    rightRoundKillsText?: mod.UIWidget;

    leftKillsText?: mod.UIWidget;
    rightKillsText?: mod.UIWidget;

    // Victory results dialog widgets (shown during match end countdown)
    victoryRoot?: mod.UIWidget;
    victoryRestartText?: mod.UIWidget;
    victoryTimeHoursTens?: mod.UIWidget;
    victoryTimeHoursOnes?: mod.UIWidget;
    victoryTimeMinutesTens?: mod.UIWidget;
    victoryTimeMinutesOnes?: mod.UIWidget;
    victoryTimeSecondsTens?: mod.UIWidget;
    victoryTimeSecondsOnes?: mod.UIWidget;
    victoryRoundsSummaryText?: mod.UIWidget;
    victoryAdminActionsText?: mod.UIWidget;

    victoryLeftOutcomeText?: mod.UIWidget;
    victoryLeftRecordText?: mod.UIWidget;
    victoryLeftRoundWinsText?: mod.UIWidget;
    victoryLeftRoundLossesText?: mod.UIWidget;
    victoryLeftRoundTiesText?: mod.UIWidget;
    victoryLeftTotalKillsText?: mod.UIWidget;

    victoryRightOutcomeText?: mod.UIWidget;
    victoryRightRecordText?: mod.UIWidget;
    victoryRightRoundWinsText?: mod.UIWidget;
    victoryRightRoundLossesText?: mod.UIWidget;
    victoryRightRoundTiesText?: mod.UIWidget;
    victoryRightTotalKillsText?: mod.UIWidget;

    // Round-end dialog widgets (shown during the round-end redeploy window)
    roundEndRoot?: mod.UIWidget;
    roundEndRoundText?: mod.UIWidget;
    roundEndOutcomeText?: mod.UIWidget;
    roundEndLeftSummaryText?: mod.UIWidget;
    roundEndColonText?: mod.UIWidget;
    roundEndRightSummaryText?: mod.UIWidget;

    adminPanelActionCountText?: mod.UIWidget;

    helpTextContainer?: mod.UIWidget;

    // Optional roots (for cleanup if needed)
    roots: mod.UIWidget[];
};

//#endregion ----------------- HUD Types + Caches --------------------



//#region -------------------- Game State Definition --------------------

// GameState centralizes all mutable match/round/UI state so writes are explicit and searchable.
interface GameState {
    round: {
        current: number;
        max: number;
        killsTarget: number;
        phase: RoundPhase;
        clock: {
            durationSeconds: number;
            matchStartElapsedSeconds?: number;
            pausedRemainingSeconds?: number;
            isPaused: boolean;
            lastDisplayedSeconds?: number;
            lastLowTimeState?: boolean;
            expiryFired: boolean;
            expiryHandlers: Array<() => void>;
        };
        flow: {
            roundEndRedeployToken: number;
            clockExpiryBound: boolean;
        };
        countdown: {
            isActive: boolean;
            isRequested: boolean;
            token: number;
            overLineMessageToken: number;
        };
    };
    scores: {
        t1RoundKills: number;
        t2RoundKills: number;
        t1TotalKills: number;
        t2TotalKills: number;
    };
    match: {
        winsT1: number;
        winsT2: number;
        lossesT1: number;
        lossesT2: number;
        tiesT1: number;
        tiesT2: number;
        isEnded: boolean;
        victoryDialogActive: boolean;
        winnerTeam?: TeamID | 0;
        endElapsedSecondsSnapshot: number;
        victoryStartElapsedSecondsSnapshot: number;
        flow: {
            matchEndDelayToken: number;
        };
    };
    admin: {
        actionCount: number;
    };
    players: {
        teamSwitchData: Record<number, teamSwitchData_t>;
        readyByPid: Record<number, boolean>;
        inMainBaseByPid: Record<number, boolean>;
    };
    hudCache: {
        lastHudScoreT1?: number;
        lastHudScoreT2?: number;
        lastHudRoundKillsT1?: number;
        lastHudRoundKillsT2?: number;
        hudByPid: Record<number, HudRefs>;
        clockWidgetCache: Record<number, ClockWidgetCacheEntry>;
        countdownWidgetCache: Record<number, CountdownWidgetCacheEntry>;
        overLineTitleWidgetCache: Record<number, CountdownWidgetCacheEntry>;
        overLineSubtitleWidgetCache: Record<number, CountdownWidgetCacheEntry>;
    };
}

// -------------------- Authoritative State Map --------------------
//
// Round state (resets at round start):
// - State.round.current: current round index (1-based display).
// - State.round.max: number of rounds in the match.
// - State.scores.t1RoundKills / State.scores.t2RoundKills: points earned this round by each team.
// - State.round.killsTarget: points needed to win the round.
// - State.round.phase: RoundPhase.NotReady | RoundPhase.Live | RoundPhase.GameOver.
// - State.round.clock.durationSeconds: authoritative remaining seconds in the round.
//
// Match state (resets at match start):
// - State.match.winsT1/T2, State.match.lossesT1/T2, State.match.tiesT1/T2: match record across rounds.
// - State.match.isEnded: indicates match is over and victory dialog should be shown.
//
// Vehicle registration (persists across round transitions unless explicitly cleared):
// - regVehiclesTeam1 (GlobalVariable 0): array of vehicles registered to Team 1.
// - regVehiclesTeam2 (GlobalVariable 1): array of vehicles registered to Team 2.
// - vehIds/vehOwners: best-effort 'last driver' mapping used for messages only.
//
// UI caches (per-player, rebuilt as needed):
// - State.hudCache.hudByPid[pid]: cached HUD widget references.
// - dialog/widget caches: cached references to modal UI elements (team switch, victory, clock digits).
//
// ------------------------------------------------------------------

// Centralized mutable state for match/round flow and UI caches.
const State: GameState = {
    round: {
        current: 1,
        max: DEFAULT_MAX_ROUNDS,
        killsTarget: DEFAULT_ROUND_KILLS_TARGET,
        phase: RoundPhase.NotReady,
        clock: {
            durationSeconds: ROUND_CLOCK_DEFAULT_SECONDS,
            matchStartElapsedSeconds: undefined,
            pausedRemainingSeconds: undefined,
            isPaused: false,
            lastDisplayedSeconds: undefined,
            lastLowTimeState: undefined,
            expiryFired: false,
            expiryHandlers: [],
        },
        flow: {
            roundEndRedeployToken: 0,
            clockExpiryBound: false,
        },
        countdown: {
            isActive: false,
            isRequested: false,
            token: 0,
            overLineMessageToken: 0,
        },
    },
    scores: {
        t1RoundKills: 0,
        t2RoundKills: 0,
        t1TotalKills: 0,
        t2TotalKills: 0,
    },
    match: {
        winsT1: 0,
        winsT2: 0,
        lossesT1: 0,
        lossesT2: 0,
        tiesT1: 0,
        tiesT2: 0,
        isEnded: false,
        victoryDialogActive: false,
        winnerTeam: undefined,
        endElapsedSecondsSnapshot: 0,
        victoryStartElapsedSecondsSnapshot: 0,
        flow: {
            matchEndDelayToken: 0,
        },
    },
    admin: {
        actionCount: 0,
    },
    players: {
        teamSwitchData: {},
        readyByPid: {},
        inMainBaseByPid: {},
    },
    hudCache: {
        lastHudScoreT1: undefined,
        lastHudScoreT2: undefined,
        lastHudRoundKillsT1: undefined,
        lastHudRoundKillsT2: undefined,
        hudByPid: {},
        clockWidgetCache: {},
        countdownWidgetCache: {},
        overLineTitleWidgetCache: {},
        overLineSubtitleWidgetCache: {},
    },
};

//#endregion ----------------- Game State Definition --------------------



//#region -------------------- HUD Counter Helpers --------------------

function setCounterText(widget: mod.UIWidget | undefined, value: number): void {
    if (!widget) return;
    mod.SetUITextLabel(widget, mod.Message(mod.stringkeys.twl.system.genericCounter, Math.floor(value)));
}

function setRoundRecordText(widget: mod.UIWidget | undefined, wins: number, losses: number, ties: number): void {
    if (!widget) return;
    mod.SetUITextLabel(widget, mod.Message(mod.stringkeys.twl.hud.roundRecordFormat, Math.floor(wins), Math.floor(losses), Math.floor(ties)));
}

function setAdminPanelActionCountText(widget: mod.UIWidget | undefined, value: number): void {
    if (!widget) return;
    mod.SetUITextLabel(widget, mod.Message(mod.stringkeys.twl.adminPanel.actionCountFormat, Math.floor(value)));
}

//#endregion ----------------- HUD Counter Helpers --------------------



//#region -------------------- HUD Round State + Help Text --------------------

function setRoundStateText(widget: mod.UIWidget | undefined): void {
    if (!widget) return;

    if (State.round.phase === RoundPhase.GameOver) {
        mod.SetUITextLabel(widget, mod.Message(mod.stringkeys.twl.hud.roundStateGameOver));
        mod.SetUITextColor(widget, COLOR_WARNING_YELLOW);
        return;
    }

    const isLive = isRoundLive();
    const stateKey = isLive ? mod.stringkeys.twl.hud.roundStateLive : mod.stringkeys.twl.hud.roundStateNotReady;

    mod.SetUITextLabel(
        widget,
        mod.Message(mod.stringkeys.twl.hud.roundStateFormat, mod.stringkeys.twl.hud.roundText, Math.floor(State.round.current), stateKey)
    );

    // Color: white when LIVE, red when NOT READY
    mod.SetUITextColor(widget, isLive ? mod.CreateVector(1, 1, 1) : COLOR_NOT_READY_RED);
}

function setRoundLiveHelpText(root: mod.UIWidget | undefined, text: mod.UIWidget | undefined): void {
    if (!root || !text) return;

    const show = (!State.match.isEnded) && (isRoundLive());
    mod.SetUIWidgetVisible(root, show);

    if (!show) return;

    mod.SetUITextLabel(
        text,
        mod.Message(mod.stringkeys.twl.hud.roundLiveHelpFormat, Math.floor(State.round.killsTarget))
    );
    mod.SetUITextColor(text, mod.CreateVector(1, 1, 1));
}

// UI hardening helpers skip work if a widget is missing (ParseUI and safeFind can yield undefined).
// This prevents runtime issues and also avoids TS errors from passing UIWidget | undefined into mod.* UI calls.
function setWidgetVisible(widget: mod.UIWidget | undefined, visible: boolean): void {
    if (!widget) return;
    mod.SetUIWidgetVisible(widget, visible);
// SetUITextLabel only accepts mod.Message; string inputs are treated as string keys and wrapped with mod.Message(key).
}

function setWidgetText(widget: mod.UIWidget | undefined, label: string | mod.Message): void {
    if (!widget) return;
    if (typeof label === 'string') {
        mod.SetUITextLabel(widget, mod.Message(label));
        return;
    }
    mod.SetUITextLabel(widget, label);
}

/**
 * Sets the shared round state text (e.g., NOT READY / LIVE / GAME OVER) for every player's HUD.
 * This is a broadcast-style UI update:
 * - It does not mutate round state; it reflects whatever authoritative state already exists.
 * - It should be called after any change that affects the round phase so HUDs remain consistent.
 */

function setRoundStateTextForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const cache = ensureClockUIAndGetCache(p);
        if (!cache) continue;
        setRoundStateText(cache.roundStateText);
        setRoundLiveHelpText(cache.roundLiveHelpRoot, cache.roundLiveHelpText);
    }
    // Keep the pre-round ready count line in sync with any round-phase HUD refresh.
    updatePlayersReadyHudTextForAllPlayers();
}

//#endregion ----------------- HUD Round State + Help Text --------------------



//#region -------------------- HUD Ready Count --------------------

/**
 * Updates the yellow HUD line: "X / Y PLAYERS READY" (pre-round only).
 * Visibility rules:
 * - Only shown while preparing for a new round (round NOT live).
 * - Hidden during game-over / victory dialog phases.
 * - Remains visible until the round is actually live (isRoundLive() === true).
 * IMPORTANT: Any code path that changes State.players.readyByPid MUST also refresh:
 *   - updatePlayersReadyHudTextForAllPlayers()
 *   - renderReadyDialogForAllVisibleViewers() (if the dialog can be open)
 * to prevent stale HUD/roster state (e.g., after swap teams or leaving base forces NOT READY).
 */
function updatePlayersReadyHudTextForAllPlayers(): void {
    // Compute counts once, then broadcast the same label to all viewers.
    const active = getActivePlayers();
    const total = active.all.length;

    let readyCount = 0;
    for (let i = 0; i < total; i++) {
        const pid = mod.GetObjId(active.all[i]);
        if (State.players.readyByPid[pid]) readyCount++;
    }

    const shouldShow = !State.match.isEnded && !State.match.victoryDialogActive && !isRoundLive() && total > 0;

    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const cache = ensureClockUIAndGetCache(p);
        if (!cache || !cache.playersReadyText) continue;

        // Toggle visibility first so we can avoid unnecessary label churn when hidden.
        mod.SetUIWidgetVisible(cache.playersReadyText, shouldShow);
        if (!shouldShow) continue;

        mod.SetUITextLabel(
            cache.playersReadyText,
            mod.Message(mod.stringkeys.twl.hud.playersReadyFormat, readyCount, total)
        );
    }
}

//#endregion ----------------- HUD Ready Count --------------------



//#region -------------------- HUD Victory Dialog Updates --------------------

function getElapsedHmsParts(totalSeconds: number): { hours: number; minutes: number; seconds: number } {
    const sec = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const seconds = sec % 60;
    return { hours, minutes, seconds };
}

function computeTeamOutcomeKey(teamNum: TeamID): number {
    if (State.match.winnerTeam === undefined || State.match.winnerTeam === 0) {
        return mod.stringkeys.twl.victory.draws;
    }
    return State.match.winnerTeam === teamNum ? mod.stringkeys.twl.victory.wins : mod.stringkeys.twl.victory.loses;
}

/**
 * Updates the per-player Victory dialog widgets to match the current match-end state.
 * Notes:
 * - This function only updates UI text/visibility for a single player; it does not decide winners.
 * - Callers are responsible for ensuring the dialog exists (or for creating it before updating).
 * - Be careful about calling this during countdown/async flows; stale state is possible if tokens changed.
 */

/**
 * Victory dialog timing:
 * Remaining seconds can wrap at the moment the timer reaches 0 (engine quirk).
 * We clamp out-of-range values to 0 to avoid displaying a huge number at the end.
 */
function updateVictoryDialogForPlayer(player: mod.Player, remainingSeconds: number): void {
    // Per-player update for the match-end victory modal: winner label, scores, and restart/rotate countdown.
    // This is called once per second while the victory dialog is active.
    // Determine the target player id; dialog widgets are keyed per-player.
const pid = mod.GetObjId(player);
    // Look up cached UI references for this player (if missing, this update becomes a no-op).
const refs = State.hudCache.hudByPid[pid];
    if (!refs) return;

    if (refs.victoryRoot) {
        // Apply visibility rules for the dialog parts based on match-end state.
        mod.SetUIWidgetVisible(refs.victoryRoot, State.match.victoryDialogActive);
    }

    if (!State.match.victoryDialogActive) {
        return;
    }
if (refs.victoryRestartText) {
        // Update string-key labels (Strings.json) so the dialog reflects the latest outcome/countdown.
        // Remaining seconds can wrap/roll over on some engine timers at the moment it hits 0.
        // Treat any out-of-range value as 0 to avoid displaying a huge number at the end.
        let displaySeconds = Math.floor(remainingSeconds);
        if (displaySeconds < 0) displaySeconds = 0;
        if (displaySeconds > MATCH_END_DELAY_SECONDS) displaySeconds = 0;
        mod.SetUITextLabel(refs.victoryRestartText, mod.Message(mod.stringkeys.twl.victory.restartInFormat, displaySeconds));
    }
    const parts = getElapsedHmsParts(State.match.endElapsedSecondsSnapshot);
    const hours = Math.min(99, Math.max(0, Math.floor(parts.hours)));
    const minutes = Math.min(59, Math.max(0, Math.floor(parts.minutes)));
    const seconds = Math.min(59, Math.max(0, Math.floor(parts.seconds)));

    const hT = Math.floor(hours / 10);
    const hO = hours % 10;
    const mT = Math.floor(minutes / 10);
    const mO = minutes % 10;
    const sT = Math.floor(seconds / 10);
    const sO = seconds % 10;

    if (refs.victoryTimeHoursTens) mod.SetUITextLabel(refs.victoryTimeHoursTens, mod.Message(mod.stringkeys.twl.hud.clock.digit, hT));
    if (refs.victoryTimeHoursOnes) mod.SetUITextLabel(refs.victoryTimeHoursOnes, mod.Message(mod.stringkeys.twl.hud.clock.digit, hO));
    if (refs.victoryTimeMinutesTens) mod.SetUITextLabel(refs.victoryTimeMinutesTens, mod.Message(mod.stringkeys.twl.hud.clock.digit, mT));
    if (refs.victoryTimeMinutesOnes) mod.SetUITextLabel(refs.victoryTimeMinutesOnes, mod.Message(mod.stringkeys.twl.hud.clock.digit, mO));
    if (refs.victoryTimeSecondsTens) mod.SetUITextLabel(refs.victoryTimeSecondsTens, mod.Message(mod.stringkeys.twl.hud.clock.digit, sT));
    if (refs.victoryTimeSecondsOnes) mod.SetUITextLabel(refs.victoryTimeSecondsOnes, mod.Message(mod.stringkeys.twl.hud.clock.digit, sO));

    if (refs.victoryRoundsSummaryText) {
        mod.SetUITextLabel(refs.victoryRoundsSummaryText, mod.Message(mod.stringkeys.twl.victory.roundsSummaryFormat, Math.floor(State.round.current), Math.floor(State.round.max)));
    }
    if (refs.victoryAdminActionsText) {
        const actionCount = Math.max(0, Math.floor(State.admin.actionCount));
        mod.SetUIWidgetVisible(refs.victoryAdminActionsText, actionCount > 0);
        if (actionCount > 0) {
            mod.SetUITextLabel(
                refs.victoryAdminActionsText,
                mod.Message(mod.stringkeys.twl.adminPanel.actionCountVictoryFormat, actionCount)
            );
        }
    }

    const t1OutcomeKey = computeTeamOutcomeKey(TeamID.Team1);
    const t2OutcomeKey = computeTeamOutcomeKey(TeamID.Team2);

    if (refs.victoryLeftOutcomeText) {
        mod.SetUITextLabel(refs.victoryLeftOutcomeText, mod.Message(mod.stringkeys.twl.victory.teamOutcomeFormat, mod.stringkeys.twl.teams.leftName, t1OutcomeKey));
    }
    if (refs.victoryRightOutcomeText) {
        mod.SetUITextLabel(refs.victoryRightOutcomeText, mod.Message(mod.stringkeys.twl.victory.teamOutcomeFormat, mod.stringkeys.twl.teams.rightName, t2OutcomeKey));
    }

    if (refs.victoryLeftRecordText) {
        mod.SetUITextLabel(refs.victoryLeftRecordText, mod.Message(mod.stringkeys.twl.hud.roundRecordFormat, Math.floor(State.match.winsT1), Math.floor(State.match.winsT2), Math.floor(State.match.tiesT1)));
    }
    if (refs.victoryRightRecordText) {
        mod.SetUITextLabel(refs.victoryRightRecordText, mod.Message(mod.stringkeys.twl.hud.roundRecordFormat, Math.floor(State.match.winsT2), Math.floor(State.match.winsT1), Math.floor(State.match.tiesT2)));
    }

    if (refs.victoryLeftRoundWinsText) {
        mod.SetUITextLabel(refs.victoryLeftRoundWinsText, mod.Message(mod.stringkeys.twl.victory.roundWinsFormat, Math.floor(State.match.winsT1)));
    }
    if (refs.victoryRightRoundWinsText) {
        mod.SetUITextLabel(refs.victoryRightRoundWinsText, mod.Message(mod.stringkeys.twl.victory.roundWinsFormat, Math.floor(State.match.winsT2)));
    }

    const lossesT1 = State.match.lossesT1;
    const lossesT2 = State.match.lossesT2;

    if (refs.victoryLeftRoundLossesText) {
        mod.SetUITextLabel(refs.victoryLeftRoundLossesText, mod.Message(mod.stringkeys.twl.victory.roundLossesFormat, Math.floor(lossesT1)));
    }
    if (refs.victoryRightRoundLossesText) {
        mod.SetUITextLabel(refs.victoryRightRoundLossesText, mod.Message(mod.stringkeys.twl.victory.roundLossesFormat, Math.floor(lossesT2)));
    }
    if (refs.victoryLeftRoundTiesText) {
        mod.SetUITextLabel(refs.victoryLeftRoundTiesText, mod.Message(mod.stringkeys.twl.victory.roundTiesFormat, Math.floor(State.match.tiesT1)));
    }
    if (refs.victoryRightRoundTiesText) {
        mod.SetUITextLabel(refs.victoryRightRoundTiesText, mod.Message(mod.stringkeys.twl.victory.roundTiesFormat, Math.floor(State.match.tiesT2)));
    }

    if (refs.victoryLeftTotalKillsText) {
        mod.SetUITextLabel(refs.victoryLeftTotalKillsText, mod.Message(mod.stringkeys.twl.victory.totalKillsFormat, Math.floor(State.scores.t1TotalKills)));
    }
    if (refs.victoryRightTotalKillsText) {
        mod.SetUITextLabel(refs.victoryRightTotalKillsText, mod.Message(mod.stringkeys.twl.victory.totalKillsFormat, Math.floor(State.scores.t2TotalKills)));
    }
}

function updateVictoryDialogForAllPlayers(remainingSeconds: number): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        updateVictoryDialogForPlayer(p, remainingSeconds);
    }
}

//#endregion ----------------- HUD Victory Dialog Updates --------------------



//#region -------------------- HUD Round-End Dialog Updates --------------------

function setRoundEndDialogVisibleForAllPlayers(visible: boolean): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const pid = mod.GetObjId(p);
        const refs = State.hudCache.hudByPid[pid];
        if (!refs) continue;
        if (refs.roundEndRoot) {
            setWidgetVisible(refs.roundEndRoot, visible);
        }
    }
}

function updateRoundEndDialogForAllPlayers(winnerTeamNum: TeamID | 0): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        updateRoundEndDialogForPlayer(p, winnerTeamNum);
    }
}

function updateRoundEndDialogForPlayer(player: mod.Player, winnerTeamNum: TeamID | 0): void {
    const pid = mod.GetObjId(player);
    const refs = State.hudCache.hudByPid[pid];
    if (!refs) return;

    // Ensure labels are always authoritative at the time the dialog is shown.
    if (refs.roundEndRoundText) {
        mod.SetUITextLabel(
            refs.roundEndRoundText,
            // RoundEnd_RoundNumber is a dedicated format key ("ROUND {0}") to avoid passing an empty string into RoundState_Format,
            // which Portal renders as <unknown string> when the key cannot be resolved.
            mod.Message(mod.stringkeys.twl.roundEnd.roundNumber, State.round.current)
        );
    }

    if (refs.roundEndOutcomeText) {
        if (winnerTeamNum === TeamID.Team1) {
            mod.SetUITextLabel(
                refs.roundEndOutcomeText,
                mod.Message(mod.stringkeys.twl.victory.teamOutcomeFormat, mod.stringkeys.twl.teams.leftName, mod.stringkeys.twl.victory.wins)
            );
        } else if (winnerTeamNum === TeamID.Team2) {
            mod.SetUITextLabel(
                refs.roundEndOutcomeText,
                mod.Message(mod.stringkeys.twl.victory.teamOutcomeFormat, mod.stringkeys.twl.teams.rightName, mod.stringkeys.twl.victory.wins)
            );
        } else {
            setWidgetText(refs.roundEndOutcomeText, mod.stringkeys.twl.roundEnd.draw);
        }
    }

    if (refs.roundEndLeftSummaryText) {
        mod.SetUITextLabel(
            refs.roundEndLeftSummaryText,
            mod.Message(
                mod.stringkeys.twl.hud.roundStateFormat,
                State.scores.t1RoundKills,
                mod.stringkeys.twl.hud.labels.roundKills,
                mod.stringkeys.twl.teams.leftName
            )
        );
    }
    if (refs.roundEndRightSummaryText) {
        mod.SetUITextLabel(
            refs.roundEndRightSummaryText,
            mod.Message(
                mod.stringkeys.twl.hud.roundStateFormat,
                State.scores.t2RoundKills,
                mod.stringkeys.twl.hud.labels.roundKills,
                mod.stringkeys.twl.teams.rightName
            )
        );
    }
}

//#endregion ----------------- HUD Round-End Dialog Updates --------------------



//#region -------------------- HUD Build/Ensure - Dialog Open + Help Text Visibility --------------------

function isTeamSwitchDialogOpenForPid(pid: number): boolean {
    // With UI caching, the dialog root widget may continue to exist while hidden.
    // Use the explicit per-player state flag as the source of truth for "open".
    return !!State.players.teamSwitchData[pid]?.dialogVisible;
}

/**
 * Applies the current 'help text' visibility rules to one specific player id.
 * This is intentionally pid-based (not Player-based) so it can be used during join/leave and UI rebuilds.
 * Keep in mind:
 * - The player may not be present at the time of the call; this function should tolerate missing UI refs.
 * - Visibility rules typically depend on per-player flags (e.g., 'dont show again') and current round state.
 */

function updateHelpTextVisibilityForPid(pid: number): void {
    // Fetch this player's HUD/widget refs; if missing (e.g., during join), bail out safely.
const refs = State.hudCache.hudByPid[pid];
    if (!refs) return;

    const show = (!State.match.isEnded) && (!isRoundLive()) && (!State.players.readyByPid[pid]) && (isTeamSwitchDialogOpenForPid(pid) === false);
    if (refs.helpTextContainer) {
        // Apply the computed visibility to the help text widget.
mod.SetUIWidgetVisible(refs.helpTextContainer, show);
    } else {
        const widget = safeFind(`Container_HelpText_${pid}`);
        if (widget) mod.SetUIWidgetVisible(widget, show);
    }
}

function updateHelpTextVisibilityForPlayer(player: mod.Player): void {
    updateHelpTextVisibilityForPid(mod.GetObjId(player));
}

function updateHelpTextVisibilityForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        updateHelpTextVisibilityForPid(mod.GetObjId(p));
    }
}

//#endregion ----------------- HUD Build/Ensure - Dialog Open + Help Text Visibility --------------------



//#region -------------------- HUD Build/Ensure Function Start --------------------

// Code Cleanup: This is an absurd mega-function - we should refactor and break down
// Ensures all persistent HUD widgets exist for a player.
// This function is idempotent and safe to call on join, respawn, or reconnect.
// Widget references created here are reused and updated elsewhere.

function ensureHudForPlayer(player: mod.Player): HudRefs | undefined {
    // Per-player HUD lifecycle:
    // - HUD widgets are created once per player and then only updated (never recreated) during the match.
    // - This function is safe to call repeatedly (join, respawn, reconnect, admin actions).
    // - If a widget is missing, create it and store/find it via the UI root.

    if (!player || !mod.IsPlayerValid(player)) return undefined;

    const pid = getObjId(player);

    // If cached and still valid, return it
    const cached = State.hudCache.hudByPid[pid];
    if (cached && cached.leftKillsText && cached.rightKillsText) {
        const helpContainer = safeFind(`Container_HelpText_${pid}`);
        if (helpContainer) {
            mod.SetUIWidgetPosition(helpContainer, mod.CreateVector(-116.5, 75.25, 0));
        }

        return cached;
    }

    const refs: HudRefs = { pid, roots: [] };

    //#endregion -------------------- HUD Build/Ensure Function Start --------------------



    //#region -------------------- HUD Build/Ensure - Upper-Left HUD --------------------

    // --- Static HUD: Upper-left small box ---
    {
        const rootName = `Upper_Left_Container_${pid}`;
        const upperLeft = modlib.ParseUI({
            name: rootName,
            type: "Container",
            playerId: player,
            // position: [x, y] offset; direction depends on anchor, so verify visually in-game
            position: [5, 5],
            size: [200, 30],
            anchor: mod.UIAnchor.TopLeft,
            visible: true,
            padding: 1,
            bgColor: [0.251, 0.0941, 0.0667],
            bgAlpha: 0.45,
            bgFill: mod.UIBgFill.Blur,
            children: [
                {
                    // UI element: Upper_Left_Text_${pid}
                    name: `Upper_Left_Text_${pid}`,
                    type: "Text",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [5, -5.5],
                    size: [200, 17],
                    anchor: mod.UIAnchor.CenterLeft,
                    visible: true,
                    padding: 0,
                    bgColor: [0.8353, 0.9216, 0.9765],
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.Blur,
                    textLabel: mod.stringkeys.twl.hud.branding.title,
                    textColor: [0.6784, 0.9922, 0.5255],
                    textAlpha: 1,
                    textSize: 9,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    // UI element: Upper_Left_Text_2_${pid}
                    name: `Upper_Left_Text_2_${pid}`,
                    type: "Text",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [7.25, 12.5],
                    size: [200, 16.5],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgColor: [0.2, 0.2, 0.2],
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.stringkeys.twl.hud.branding.subtitle,
                    textColor: [0.6784, 0.9922, 0.5255],
                    textAlpha: 1,
                    textSize: 9,
                    textAnchor: mod.UIAnchor.Center,
                },
            ],
        });
        if (upperLeft) refs.roots.push(upperLeft);
    }

    //#endregion ----------------- HUD Build/Ensure - Upper-Left HUD --------------------



    //#region -------------------- HUD Build/Ensure - Top-Center Panels --------------------

    // --- Static HUD: Top-center panels (TeamLeft / Middle / TeamRight) ---
    {
        const mid = modlib.ParseUI({
            // UI element: Container_TopMiddle_CoreUI_${pid}
            name: `Container_TopMiddle_CoreUI_${pid}`,
            type: "Container",
            playerId: player,
            // position: [x, y] offset; direction depends on anchor, so verify visually in-game
            position: [902.75, 44.75],
            size: [114.5, 74],
            anchor: mod.UIAnchor.TopLeft,
            visible: true,
            padding: 0,
            bgColor: [0.0314, 0.0431, 0.0431],
            bgAlpha: 0.5,
            bgFill: mod.UIBgFill.Blur,
            children: [
                {
                    // UI element: RoundText_${pid}
                    name: `RoundText_${pid}`,
                    type: "Text",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [5.5, -3],
                    size: [72.5, 24],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgColor: [0.2, 0.2, 0.2],
                    bgAlpha: 1,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.stringkeys.twl.hud.roundText,
                    textColor: [1, 1, 1],
                    textAlpha: 1,
                    textSize: 16,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    // Help/instructions text shown when enabled for this player
                    name: `Container_HelpText_${pid}`,
                    type: "Container",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [-116.5, 75.25],
                    size: [349, 12.5],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgColor: [1, 0.9882, 0.6118],
                    bgAlpha: 1,
                    bgFill: mod.UIBgFill.Solid,
                    children: [
                        {
                            // Help/instructions text shown when enabled for this player
                            name: `HelpText_${pid}`,
                            type: "Text",
                            // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                            position: [10, 2],
                            size: [330.5, 7.5],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: true,
                            padding: 0,
                            bgColor: [0.2, 0.2, 0.2],
                            bgAlpha: 1,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.stringkeys.twl.hud.helpText,
                            textColor: [0.251, 0.0941, 0.0667],
                            textAlpha: 1,
                            textSize: 9,
                            textAnchor: mod.UIAnchor.Center,
                        },
                    ],
                },
                {
                    // UI element: Slash_${pid}
                    name: `Slash_${pid}`,
                    type: "Text",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [70.5, -3],
                    size: [31, 21],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgColor: [0.2, 0.2, 0.2],
                    bgAlpha: 1,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.stringkeys.twl.system.slash,
                    textColor: [1, 1, 1],
                    textAlpha: 1,
                    textSize: 16,
                    textAnchor: mod.UIAnchor.Center,
                },
            ],
        });
        if (mid) refs.roots.push(mid);

        const t1Panel = modlib.ParseUI({
            // UI element: Container_TopLeft_CoreUI_${pid}
            name: `Container_TopLeft_CoreUI_${pid}`,
            type: "Container",
            playerId: player,
            // position: [x, y] offset; direction depends on anchor, so verify visually in-game
            position: [783.86, 44.75],
            size: [114.5, 74],
            anchor: mod.UIAnchor.TopLeft,
            visible: true,
            padding: 0,
            bgColor: [0.4392, 0.9216, 1],
            bgAlpha: 0.5,
            bgFill: mod.UIBgFill.Blur,
            children: [
                {
                    // Team name label for Team 1 (left side)
                    name: `TeamLeft_Name_${pid}`,
                    type: "Text",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [23.25, -3],
                    size: [68, 24],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgColor: [0.2, 0.2, 0.2],
                    bgAlpha: 1,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.stringkeys.twl.teams.leftName,
                    textColor: [1, 1, 1],
                    textAlpha: 1,
                    textSize: 16,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    // UI element: TeamLeft_Record_${pid}
                    name: `TeamLeft_Record_${pid}`,
                    type: "Text",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [24, 15.5],
                    size: [63, 14.5],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgColor: [0.2, 0.2, 0.2],
                    bgAlpha: 1,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(mod.stringkeys.twl.hud.roundRecordFormat, 0, 0, 0),
                    textColor: [1, 1, 1],
                    textAlpha: 1,
                    textSize: 11,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    // Display variable for round wins on Team 1 (left side)
                    name: `TeamLeft_Wins_${pid}`,
                    type: "Text",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [31, 29],
                    size: [63, 14.5],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgColor: [0.2, 0.2, 0.2],
                    bgAlpha: 1,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.stringkeys.twl.hud.labels.roundWins,
                    textColor: [1, 1, 1],
                    textAlpha: 1,
                    textSize: 11,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    // Display variable for round kills on Team 1 (left side)
                    name: `TeamLeft_RoundKills_${pid}`,
                    type: "Text",
                    // position: [x, y] offset; increase X to move right, increase Y to move down
                    position: [29, 42.5],
                    size: [63, 14.5],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgColor: [0.2, 0.2, 0.2],
                    bgAlpha: 1,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.stringkeys.twl.hud.labels.roundKills,
                    textColor: [1, 1, 1],
                    textAlpha: 1,
                    textSize: 11,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    // Display variable for total kills on Team 1 (left side)
                    name: `TeamLeft_Kills_${pid}`,
                    type: "Text",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [26.5, 56],
                    size: [63, 14.5],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgColor: [0.2, 0.2, 0.2],
                    bgAlpha: 1,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.stringkeys.twl.hud.labels.totalKills,
                    textColor: [1, 1, 1],
                    textAlpha: 1,
                    textSize: 11,
                    textAnchor: mod.UIAnchor.Center,
                },
            ],
        });
        if (t1Panel) refs.roots.push(t1Panel);

        const t2Panel = modlib.ParseUI({
            // UI element: Container_TopRight_CoreUI_${pid}
            name: `Container_TopRight_CoreUI_${pid}`,
            type: "Container",
            playerId: player,
            // position: [x, y] offset; direction depends on anchor, so verify visually in-game
            position: [1021.64, 44.75],
            size: [114.5, 74],
            anchor: mod.UIAnchor.TopLeft,
            visible: true,
            padding: 0,
            bgColor: [1, 0.5137, 0.3804],
            bgAlpha: 0.5,
            bgFill: mod.UIBgFill.Blur,
            children: [
                {
                    // Team name label for Team 2 (right side)
                    name: `TeamRight_Name_${pid}`,
                    type: "Text",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [23.25, -3],
                    size: [68, 24],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgColor: [0.2, 0.2, 0.2],
                    bgAlpha: 1,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.stringkeys.twl.teams.rightName,
                    textColor: [1, 1, 1],
                    textAlpha: 1,
                    textSize: 16,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    // UI element: TeamRight_Record_${pid}
                    name: `TeamRight_Record_${pid}`,
                    type: "Text",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [24, 15.5],
                    size: [63, 14.5],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgColor: [0.2, 0.2, 0.2],
                    bgAlpha: 1,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(mod.stringkeys.twl.hud.roundRecordFormat, 0, 0, 0),
                    textColor: [1, 1, 1],
                    textAlpha: 1,
                    textSize: 11,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    // Display variable for round wins on Team 2 (right side)
                    name: `TeamRight_Wins_${pid}`,
                    type: "Text",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [31, 29],
                    size: [63, 14.5],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgColor: [0.2, 0.2, 0.2],
                    bgAlpha: 1,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.stringkeys.twl.hud.labels.roundWins,
                    textColor: [1, 1, 1],
                    textAlpha: 1,
                    textSize: 11,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    // Display variable for round kills on Team 2 (right side)
                    name: `TeamRight_RoundKills_${pid}`,
                    type: "Text",
                    // position: [x, y] offset; increase X to move right, increase Y to move down
                    position: [30, 42.5],
                    size: [63, 14.5],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgColor: [0.2, 0.2, 0.2],
                    bgAlpha: 1,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.stringkeys.twl.hud.labels.roundKills,
                    textColor: [1, 1, 1],
                    textAlpha: 1,
                    textSize: 11,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    // Display variable for total kills on Team 2 (right side)
                    name: `TeamRight_Kills_${pid}`,
                    type: "Text",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [26.5, 56],
                    size: [63, 14.5],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgColor: [0.2, 0.2, 0.2],
                    bgAlpha: 1,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.stringkeys.twl.hud.labels.totalKills,
                    textColor: [1, 1, 1],
                    textAlpha: 1,
                    textSize: 11,
                    textAnchor: mod.UIAnchor.Center,
                },
            ],
        });
    }

    //#endregion ----------------- HUD Build/Ensure - Top-Center Panels --------------------



    //#region -------------------- HUD Build/Ensure - Admin Action Counter --------------------

    {
        // Admin action audit counter (top-right)
        const auditCounter = modlib.ParseUI({
            name: `AdminPanelActionCount_${pid}`,
            type: "Text",
            playerId: player,
            // position: [x, y] offset; increase X to move right, increase Y to move down
            position: [20, 20],
            size: [60, 12],
            anchor: mod.UIAnchor.TopRight,
            visible: true,
            padding: 0,
            bgAlpha: 0,
            bgFill: mod.UIBgFill.None,
            textLabel: mod.Message(mod.stringkeys.twl.adminPanel.actionCountFormat, 0),
            textColor: [1, 1, 1],
            textAlpha: 1,
            textSize: 10,
            textAnchor: mod.UIAnchor.CenterRight,
        });
        if (auditCounter) refs.roots.push(auditCounter);
    }

    refs.leftRecordText = safeFind(`TeamLeft_Record_${pid}`);
    refs.rightRecordText = safeFind(`TeamRight_Record_${pid}`);
    refs.adminPanelActionCountText = safeFind(`AdminPanelActionCount_${pid}`);

    //#endregion ----------------- HUD Build/Ensure - Admin Action Counter --------------------



    //#region -------------------- HUD Build/Ensure - Counter Widgets --------------------

    // --- Counter widgets (digits) ---
    {
        const mkCounter = (
            containerName: string,
            textName: string,
            pos: [number, number],
            size: [number, number],
            textSize: number
        ) => {
            const root = modlib.ParseUI({
                name: containerName,
                type: "Container",
                playerId: player,
                position: pos,
                size: size,
                anchor: mod.UIAnchor.TopLeft,
                visible: true,
                padding: 0,
                bgColor: [0.2, 0.2, 0.2],
                bgAlpha: 1,
                bgFill: mod.UIBgFill.None,
                children: [
                    {
                        name: textName,
                        type: "Text",
                        // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                        position: [0, 0],
                        size: [size[0], size[1]],
                        anchor: mod.UIAnchor.Center,
                        visible: true,
                        padding: 0,
                        bgColor: [0.2, 0.2, 0.2],
                        bgAlpha: 1,
                        bgFill: mod.UIBgFill.None,
                        textLabel: mod.stringkeys.twl.system.genericCounter,
                        textColor: [1, 1, 1],
                        textAlpha: 1,
                        textSize: textSize,
                        textAnchor: mod.UIAnchor.Center,
                    },
                ],
            });
            if (root) refs.roots.push(root);
            return safeFind(textName);
        };

        refs.roundCurText = mkCounter(`RoundCounterContainer_${pid}`, `RoundCounterText_${pid}`, [973.93, 42.75], [13.95, 18.15], 16);
        refs.roundMaxText = mkCounter(`RoundCounterMaxContainer_${pid}`, `RoundCounterMaxText_${pid}`, [990.03, 42.75], [13.95, 18.15], 16);

        refs.leftWinsText = mkCounter(`TeamLeft_Wins_Counter_${pid}`, `TeamLeft_Wins_CounterText_${pid}`, [803.03, 72.1], [13.95, 18.15], 11);
        refs.rightWinsText = mkCounter(`TeamRight_Wins_Counter_${pid}`, `TeamRight_Wins_CounterText_${pid}`, [1039.76, 72.1], [13.95, 18.15], 11);

        refs.leftRoundKillsText = mkCounter(`TeamLeft_RoundKills_Counter_${pid}`, `TeamLeft_RoundKills_CounterText_${pid}`, [803.03, 85.77], [13.95, 18.15], 11);
        refs.rightRoundKillsText = mkCounter(`TeamRight_RoundKills_Counter_${pid}`, `TeamRight_RoundKills_CounterText_${pid}`, [1039.76, 85.77], [13.95, 18.15], 11);

        refs.leftKillsText = mkCounter(`TeamLeft_Kills_Counter_${pid}`, `TeamLeft_Kills_CounterText_${pid}`, [803.03, 99.44], [13.95, 18.15], 11);
        refs.rightKillsText = mkCounter(`TeamRight_Kills_Counter_${pid}`, `TeamRight_Kills_CounterText_${pid}`, [1039.76, 99.44], [13.95, 18.15], 11);
    }

    //#endregion ----------------- HUD Build/Ensure - Counter Widgets --------------------



    //#region -------------------- HUD Build/Ensure - Round-End Dialog --------------------

    //Code Cleanup: Need to reduce redundant comments, and when manually adjusting position/sizes update directions (e.g. +X is right or left)
    {
        const roundEndModal = modlib.ParseUI({
            // UI element: RoundEndDialogRoot_${pid}
            name: `RoundEndDialogRoot_${pid}`,
            type: "Container",
            playerId: player,
            // position: [x, y] offset; direction depends on anchor, so verify visually in-game
            position: [0, 150],
            size: [360, 112],
            anchor: mod.UIAnchor.TopCenter,
            visible: false,
            padding: 0,
            bgColor: [VICTORY_BG_RGB[0], VICTORY_BG_RGB[1], VICTORY_BG_RGB[2]],
            bgAlpha: 0.95,
            bgFill: mod.UIBgFill.Solid,
            children: [
                {
                    // UI element: RoundEndDialog_Round_${pid}
                    name: `RoundEndDialog_Round_${pid}`,
                    type: "Text",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [0, 14],
                    size: [340, 18],
                    anchor: mod.UIAnchor.TopCenter,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(mod.stringkeys.twl.roundEnd.roundNumber, State.round.current),
                    textColor: [1, 1, 1],
                    textAlpha: 1,
                    textSize: 14,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    // UI element: RoundEndDialog_Outcome_${pid}
                    name: `RoundEndDialog_Outcome_${pid}`,
                    type: "Text",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [0, 40],
                    size: [340, 22],
                    anchor: mod.UIAnchor.TopCenter,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.stringkeys.twl.roundEnd.draw,
                    textColor: [1, 1, 1],
                    textAlpha: 1,
                    textSize: 18,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    // UI element: RoundEndDialog_SummaryRow_${pid}
                    name: `RoundEndDialog_SummaryRow_${pid}`,
                    type: "Container",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [0, 74],
                    size: [340, 18],
                    anchor: mod.UIAnchor.TopCenter,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    children: [
                        {
                            // UI element: RoundEndDialog_LeftSummary_${pid}
                            name: `RoundEndDialog_LeftSummary_${pid}`,
                            type: "Text",
                            // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                            position: [-72, 0],
                            size: [160, 18],
                            anchor: mod.UIAnchor.Center,
                            visible: true,
                            padding: 0,
                            bgAlpha: 0,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.Message(mod.stringkeys.twl.hud.roundStateFormat, 0, mod.stringkeys.twl.hud.labels.roundKills, mod.stringkeys.twl.teams.leftName),
                            textColor: [VICTORY_TEAM1_TEXT_RGB[0], VICTORY_TEAM1_TEXT_RGB[1], VICTORY_TEAM1_TEXT_RGB[2]],
                            textAlpha: 1,
                            textSize: 13,
                            textAnchor: mod.UIAnchor.Center,
                        },
                        {
                            // UI element: RoundEndDialog_Colon_${pid}
                            name: `RoundEndDialog_Colon_${pid}`,
                            type: "Text",
                            // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                            position: [0, 0],
                            size: [20, 18],
                            anchor: mod.UIAnchor.Center,
                            visible: true,
                            padding: 0,
                            bgAlpha: 0,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.stringkeys.twl.hud.clock.colon,
                            textColor: [1, 1, 1],
                            textAlpha: 1,
                            textSize: 12,
                            textAnchor: mod.UIAnchor.Center,
                        },
                        {
                            // UI element: RoundEndDialog_RightSummary_${pid}
                            name: `RoundEndDialog_RightSummary_${pid}`,
                            type: "Text",
                            // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                            position: [72, 0],
                            size: [160, 18],
                            anchor: mod.UIAnchor.Center,
                            visible: true,
                            padding: 0,
                            bgAlpha: 0,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.Message(mod.stringkeys.twl.hud.roundStateFormat, 0, mod.stringkeys.twl.hud.labels.roundKills, mod.stringkeys.twl.teams.rightName),
                            textColor: [VICTORY_TEAM2_TEXT_RGB[0], VICTORY_TEAM2_TEXT_RGB[1], VICTORY_TEAM2_TEXT_RGB[2]],
                            textAlpha: 1,
                            textSize: 13,
                            textAnchor: mod.UIAnchor.Center,
                        },
                    ],
                },
            ],
        });

        refs.roundEndRoot = roundEndModal;
        refs.roundEndRoundText = safeFind(`RoundEndDialog_Round_${pid}`);
        refs.roundEndOutcomeText = safeFind(`RoundEndDialog_Outcome_${pid}`);
        refs.roundEndLeftSummaryText = safeFind(`RoundEndDialog_LeftSummary_${pid}`);
        refs.roundEndColonText = safeFind(`RoundEndDialog_Colon_${pid}`);
        refs.roundEndRightSummaryText = safeFind(`RoundEndDialog_RightSummary_${pid}`);
        if (roundEndModal) refs.roots.push(roundEndModal);
    }

    //#endregion ----------------- HUD Build/Ensure - Round-End Dialog --------------------



    //#region -------------------- HUD Build/Ensure - Victory Dialog --------------------

    {
        const modal = modlib.ParseUI({
                        // UI element: VictoryDialogRoot_${pid}
                        name: `VictoryDialogRoot_${pid}`,
            type: "Container",
            playerId: player,
            // position: [x, y] offset; direction depends on anchor, so verify visually in-game
            position: [0, 30],
            size: [360, 290],
            anchor: mod.UIAnchor.Center,
            visible: false,
            padding: 0,
            bgColor: [VICTORY_BG_RGB[0], VICTORY_BG_RGB[1], VICTORY_BG_RGB[2]],
            bgAlpha: 0.95,
            bgFill: mod.UIBgFill.Solid,
            children: [
                {
            // UI element: VictoryDialog_Header1_${pid}
            name: `VictoryDialog_Header1_${pid}`,
                    type: "Text",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [0, 14],
                    size: [340, 22],
                    anchor: mod.UIAnchor.TopCenter,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.stringkeys.twl.hud.branding.title,
                    textColor: [1, 1, 1],
                    textAlpha: 1,
                    textSize: 18,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    // UI element: VictoryDialog_Header2_${pid}
                    name: `VictoryDialog_Header2_${pid}`,
                    type: "Text",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [0, 36],
                    size: [340, 22],
                    anchor: mod.UIAnchor.TopCenter,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.stringkeys.twl.hud.branding.subtitle,
                    textColor: [1, 1, 1],
                    textAlpha: 1,
                    textSize: 18,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    // UI element: VictoryDialog_Screenshot_${pid}
                    name: `VictoryDialog_Screenshot_${pid}`,
                    type: "Text",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [0, 62],
                    size: [340, 16],
                    anchor: mod.UIAnchor.TopCenter,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.stringkeys.twl.victory.screenshotPrompt,
                    textColor: [1, 1, 0],
                    textAlpha: 1,
                    textSize: 12,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    // UI element: VictoryDialog_Restart_${pid}
                    name: `VictoryDialog_Restart_${pid}`,
                    type: "Text",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [0, 82],
                    size: [340, 16],
                    anchor: mod.UIAnchor.TopCenter,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(mod.stringkeys.twl.victory.restartInFormat, MATCH_END_DELAY_SECONDS),
                    textColor: [1, 1, 1],
                    textAlpha: 1,
                    textSize: 12,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    // UI element: VictoryDialog_TotalTimeRow_${pid}
                    name: `VictoryDialog_TotalTimeRow_${pid}`,
                    type: "Container",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [0, 102],
                    size: [340, 16],
                    anchor: mod.UIAnchor.TopCenter,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    children: [
                        {
                            // UI element: VictoryDialog_TotalTimeLabel_${pid}
                            name: `VictoryDialog_TotalTimeLabel_${pid}`,
                            type: "Text",
                            // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                            position: [-45, 0],
                            size: [130, 16],
                            anchor: mod.UIAnchor.Center,
                            visible: true,
                            padding: 0,
                            bgAlpha: 0,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.stringkeys.twl.victory.totalMatchTimeLabel,
                            textColor: [1, 1, 1],
                            textAlpha: 1,
                            textSize: 12,
                            textAnchor: mod.UIAnchor.Center,
                        },
                        {
                            // UI element: VictoryDialog_TotalTimeDigits_${pid}
                            name: `VictoryDialog_TotalTimeDigits_${pid}`,
                            type: "Container",
                            // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                            position: [55, 0],
                            size: [120, 16],
                            anchor: mod.UIAnchor.Center,
                            visible: true,
                            padding: 0,
                            bgAlpha: 0,
                            bgFill: mod.UIBgFill.None,
                            children: [
                                {
                                    // UI element: VictoryDialog_TimeHT_${pid}
                                    name: `VictoryDialog_TimeHT_${pid}`,
                                    type: "Text",
                                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                                    position: [-45, 0],
                                    size: [10, 16],
                                    anchor: mod.UIAnchor.Center,
                                    visible: true,
                                    padding: 0,
                                    bgAlpha: 0,
                                    bgFill: mod.UIBgFill.None,
                                    textLabel: mod.Message(mod.stringkeys.twl.hud.clock.digit, 0),
                                    textColor: [1, 1, 1],
                                    textAlpha: 1,
                                    textSize: 12,
                                    textAnchor: mod.UIAnchor.Center,
                                },
                                {
                                    // UI element: VictoryDialog_TimeHO_${pid}
                                    name: `VictoryDialog_TimeHO_${pid}`,
                                    type: "Text",
                                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                                    position: [-35, 0],
                                    size: [10, 16],
                                    anchor: mod.UIAnchor.Center,
                                    visible: true,
                                    padding: 0,
                                    bgAlpha: 0,
                                    bgFill: mod.UIBgFill.None,
                                    textLabel: mod.Message(mod.stringkeys.twl.hud.clock.digit, 0),
                                    textColor: [1, 1, 1],
                                    textAlpha: 1,
                                    textSize: 12,
                                    textAnchor: mod.UIAnchor.Center,
                                },
                                {
                                    // UI element: VictoryDialog_TimeC1_${pid}
                                    name: `VictoryDialog_TimeC1_${pid}`,
                                    type: "Text",
                                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                                    position: [-25, 0],
                                    size: [10, 16],
                                    anchor: mod.UIAnchor.Center,
                                    visible: true,
                                    padding: 0,
                                    bgAlpha: 0,
                                    bgFill: mod.UIBgFill.None,
                                    textLabel: mod.Message(mod.stringkeys.twl.hud.clock.colon),
                                    textColor: [1, 1, 1],
                                    textAlpha: 1,
                                    textSize: 12,
                                    textAnchor: mod.UIAnchor.Center,
                                },
                                {
                                    // UI element: VictoryDialog_TimeMT_${pid}
                                    name: `VictoryDialog_TimeMT_${pid}`,
                                    type: "Text",
                                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                                    position: [-15, 0],
                                    size: [10, 16],
                                    anchor: mod.UIAnchor.Center,
                                    visible: true,
                                    padding: 0,
                                    bgAlpha: 0,
                                    bgFill: mod.UIBgFill.None,
                                    textLabel: mod.Message(mod.stringkeys.twl.hud.clock.digit, 0),
                                    textColor: [1, 1, 1],
                                    textAlpha: 1,
                                    textSize: 12,
                                    textAnchor: mod.UIAnchor.Center,
                                },
                                {
                                    // UI element: VictoryDialog_TimeMO_${pid}
                                    name: `VictoryDialog_TimeMO_${pid}`,
                                    type: "Text",
                                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                                    position: [-5, 0],
                                    size: [10, 16],
                                    anchor: mod.UIAnchor.Center,
                                    visible: true,
                                    padding: 0,
                                    bgAlpha: 0,
                                    bgFill: mod.UIBgFill.None,
                                    textLabel: mod.Message(mod.stringkeys.twl.hud.clock.digit, 0),
                                    textColor: [1, 1, 1],
                                    textAlpha: 1,
                                    textSize: 12,
                                    textAnchor: mod.UIAnchor.Center,
                                },
                                {
                                    // UI element: VictoryDialog_TimeC2_${pid}
                                    name: `VictoryDialog_TimeC2_${pid}`,
                                    type: "Text",
                                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                                    position: [5, 0],
                                    size: [10, 16],
                                    anchor: mod.UIAnchor.Center,
                                    visible: true,
                                    padding: 0,
                                    bgAlpha: 0,
                                    bgFill: mod.UIBgFill.None,
                                    textLabel: mod.Message(mod.stringkeys.twl.hud.clock.colon),
                                    textColor: [1, 1, 1],
                                    textAlpha: 1,
                                    textSize: 12,
                                    textAnchor: mod.UIAnchor.Center,
                                },
                                {
                                    // UI element: VictoryDialog_TimeST_${pid}
                                    name: `VictoryDialog_TimeST_${pid}`,
                                    type: "Text",
                                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                                    position: [15, 0],
                                    size: [10, 16],
                                    anchor: mod.UIAnchor.Center,
                                    visible: true,
                                    padding: 0,
                                    bgAlpha: 0,
                                    bgFill: mod.UIBgFill.None,
                                    textLabel: mod.Message(mod.stringkeys.twl.hud.clock.digit, 0),
                                    textColor: [1, 1, 1],
                                    textAlpha: 1,
                                    textSize: 12,
                                    textAnchor: mod.UIAnchor.Center,
                                },
                                {
                                    // UI element: VictoryDialog_TimeSO_${pid}
                                    name: `VictoryDialog_TimeSO_${pid}`,
                                    type: "Text",
                                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                                    position: [25, 0],
                                    size: [10, 16],
                                    anchor: mod.UIAnchor.Center,
                                    visible: true,
                                    padding: 0,
                                    bgAlpha: 0,
                                    bgFill: mod.UIBgFill.None,
                                    textLabel: mod.Message(mod.stringkeys.twl.hud.clock.digit, 0),
                                    textColor: [1, 1, 1],
                                    textAlpha: 1,
                                    textSize: 12,
                                    textAnchor: mod.UIAnchor.Center,
                                },
                            ],
                        },
                    ],
                },
                {
                    // UI element: VictoryDialog_Rounds_${pid}
                    name: `VictoryDialog_Rounds_${pid}`,
                    type: "Text",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [0, 122],
                    size: [340, 16],
                    anchor: mod.UIAnchor.TopCenter,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(mod.stringkeys.twl.victory.roundsSummaryFormat, 0, 0),
                    textColor: [1, 1, 1],
                    textAlpha: 1,
                    textSize: 12,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    // UI element: VictoryDialog_AdminActions_${pid}
                    name: `VictoryDialog_AdminActions_${pid}`,
                    type: "Text",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [0, 138],
                    size: [340, 16],
                    anchor: mod.UIAnchor.TopCenter,
                    visible: false,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(mod.stringkeys.twl.adminPanel.actionCountVictoryFormat, 0),
                    textColor: [1, 1, 0],
                    textAlpha: 1,
                    textSize: 12,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    // UI element: VictoryDialog_TeamsRow_${pid}
                    name: `VictoryDialog_TeamsRow_${pid}`,
                    type: "Container",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [0, 154],
                    size: [340, 70],
                    anchor: mod.UIAnchor.TopCenter,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    children: [
                        {
                            // UI element: VictoryDialog_TeamLeft_${pid}
                            name: `VictoryDialog_TeamLeft_${pid}`,
                            type: "Container",
                            // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                            position: [-85, 0],
                            size: [160, 122],
                            anchor: mod.UIAnchor.TopCenter,
                            visible: true,
                            padding: 0,
                            bgColor: [VICTORY_TEAM1_BG_RGB[0], VICTORY_TEAM1_BG_RGB[1], VICTORY_TEAM1_BG_RGB[2]],
                            bgAlpha: 0.95,
                            bgFill: mod.UIBgFill.Solid,
                            children: [
                                {
                                    // UI element: VictoryDialog_LeftOutcome_${pid}
                                    name: `VictoryDialog_LeftOutcome_${pid}`,
                                    type: "Text",
                                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                                    position: [0, 6],
                                    size: [150, 22],
                                    anchor: mod.UIAnchor.TopCenter,
                                    visible: true,
                                    padding: 0,
                                    bgAlpha: 0,
                                    bgFill: mod.UIBgFill.None,
                                    textLabel: mod.Message(mod.stringkeys.twl.victory.teamOutcomeFormat, mod.stringkeys.twl.teams.leftName, mod.stringkeys.twl.victory.loses),
                                    textColor: [VICTORY_TEAM1_TEXT_RGB[0], VICTORY_TEAM1_TEXT_RGB[1], VICTORY_TEAM1_TEXT_RGB[2]],
                                    textAlpha: 1,
                                    textSize: 18,
                                    textAnchor: mod.UIAnchor.Center,
                                },
                                {
                                    // UI element: VictoryDialog_LeftRecord_${pid}
                                    name: `VictoryDialog_LeftRecord_${pid}`,
                                    type: "Text",
                                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                                    position: [0, 30],
                                    size: [150, 16],
                                    anchor: mod.UIAnchor.TopCenter,
                                    visible: true,
                                    padding: 0,
                                    bgAlpha: 0,
                                    bgFill: mod.UIBgFill.None,
                                    textLabel: mod.Message(mod.stringkeys.twl.hud.roundRecordFormat, 0, 0, 0),
                                    textColor: [VICTORY_TEAM1_TEXT_RGB[0], VICTORY_TEAM1_TEXT_RGB[1], VICTORY_TEAM1_TEXT_RGB[2]],
                                    textAlpha: 1,
                                    textSize: 18,
                                    textAnchor: mod.UIAnchor.Center,
                                },
                                {
                                    // UI element: VictoryDialog_LeftRoundWins_${pid}
                                    name: `VictoryDialog_LeftRoundWins_${pid}`,
                                    type: "Text",
                                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                                    position: [0, 50],
                                    size: [150, 16],
                                    anchor: mod.UIAnchor.TopCenter,
                                    visible: true,
                                    padding: 0,
                                    bgAlpha: 0,
                                    bgFill: mod.UIBgFill.None,
                                    textLabel: mod.Message(mod.stringkeys.twl.victory.roundWinsFormat, 0),
                                    textColor: [VICTORY_TEAM1_TEXT_RGB[0], VICTORY_TEAM1_TEXT_RGB[1], VICTORY_TEAM1_TEXT_RGB[2]],
                                    textAlpha: 1,
                                    textSize: 12,
                                    textAnchor: mod.UIAnchor.Center,
                                },
                                {
                                    // UI element: VictoryDialog_LeftRoundLosses_${pid}
                                    name: `VictoryDialog_LeftRoundLosses_${pid}`,
                                    type: "Text",
                                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                                    position: [0, 68],
                                    size: [150, 16],
                                    anchor: mod.UIAnchor.TopCenter,
                                    visible: true,
                                    padding: 0,
                                    bgAlpha: 0,
                                    bgFill: mod.UIBgFill.None,
                                    textLabel: mod.Message(mod.stringkeys.twl.victory.roundLossesFormat, 0),
                                    textColor: [VICTORY_TEAM1_TEXT_RGB[0], VICTORY_TEAM1_TEXT_RGB[1], VICTORY_TEAM1_TEXT_RGB[2]],
                                    textAlpha: 1,
                                    textSize: 12,
                                    textAnchor: mod.UIAnchor.Center,
                                },
                                {
                                    // UI element: VictoryDialog_LeftRoundTies_${pid}
                                    name: `VictoryDialog_LeftRoundTies_${pid}`,
                                    type: "Text",
                                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                                    position: [0, 86],
                                    size: [150, 16],
                                    anchor: mod.UIAnchor.TopCenter,
                                    visible: true,
                                    padding: 0,
                                    bgAlpha: 0,
                                    bgFill: mod.UIBgFill.None,
                                    textLabel: mod.Message(mod.stringkeys.twl.victory.roundTiesFormat, 0),
                                    textColor: [VICTORY_TEAM1_TEXT_RGB[0], VICTORY_TEAM1_TEXT_RGB[1], VICTORY_TEAM1_TEXT_RGB[2]],
                                    textAlpha: 1,
                                    textSize: 12,
                                    textAnchor: mod.UIAnchor.Center,
                                },
                                {
                                    // UI element: VictoryDialog_LeftTotalKills_${pid}
                                    name: `VictoryDialog_LeftTotalKills_${pid}`,
                                    type: "Text",
                                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                                    position: [0, 104],
                                    size: [150, 16],
                                    anchor: mod.UIAnchor.TopCenter,
                                    visible: true,
                                    padding: 0,
                                    bgAlpha: 0,
                                    bgFill: mod.UIBgFill.None,
                                    textLabel: mod.Message(mod.stringkeys.twl.victory.totalKillsFormat, 0),
                                    textColor: [VICTORY_TEAM1_TEXT_RGB[0], VICTORY_TEAM1_TEXT_RGB[1], VICTORY_TEAM1_TEXT_RGB[2]],
                                    textAlpha: 1,
                                    textSize: 12,
                                    textAnchor: mod.UIAnchor.Center,
                                },
                            ],
                        },
                        {
                            // UI element: VictoryDialog_TeamRight_${pid}
                            name: `VictoryDialog_TeamRight_${pid}`,
                            type: "Container",
                            // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                            position: [85, 0],
                            size: [160, 122],
                            anchor: mod.UIAnchor.TopCenter,
                            visible: true,
                            padding: 0,
                            bgColor: [VICTORY_TEAM2_BG_RGB[0], VICTORY_TEAM2_BG_RGB[1], VICTORY_TEAM2_BG_RGB[2]],
                            bgAlpha: 0.95,
                            bgFill: mod.UIBgFill.Solid,
                            children: [
                                {
                                    // UI element: VictoryDialog_RightOutcome_${pid}
                                    name: `VictoryDialog_RightOutcome_${pid}`,
                                    type: "Text",
                                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                                    position: [0, 6],
                                    size: [150, 22],
                                    anchor: mod.UIAnchor.TopCenter,
                                    visible: true,
                                    padding: 0,
                                    bgAlpha: 0,
                                    bgFill: mod.UIBgFill.None,
                                    textLabel: mod.Message(mod.stringkeys.twl.victory.teamOutcomeFormat, mod.stringkeys.twl.teams.rightName, mod.stringkeys.twl.victory.wins),
                                    textColor: [VICTORY_TEAM2_TEXT_RGB[0], VICTORY_TEAM2_TEXT_RGB[1], VICTORY_TEAM2_TEXT_RGB[2]],
                                    textAlpha: 1,
                                    textSize: 18,
                                    textAnchor: mod.UIAnchor.Center,
                                },
                                {
                                    // UI element: VictoryDialog_RightRecord_${pid}
                                    name: `VictoryDialog_RightRecord_${pid}`,
                                    type: "Text",
                                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                                    position: [0, 30],
                                    size: [150, 16],
                                    anchor: mod.UIAnchor.TopCenter,
                                    visible: true,
                                    padding: 0,
                                    bgAlpha: 0,
                                    bgFill: mod.UIBgFill.None,
                                    textLabel: mod.Message(mod.stringkeys.twl.hud.roundRecordFormat, 0, 0, 0),
                                    textColor: [VICTORY_TEAM2_TEXT_RGB[0], VICTORY_TEAM2_TEXT_RGB[1], VICTORY_TEAM2_TEXT_RGB[2]],
                                    textAlpha: 1,
                                    textSize: 18,
                                    textAnchor: mod.UIAnchor.Center,
                                },
                                {
                                    // UI element: VictoryDialog_RightRoundWins_${pid}
                                    name: `VictoryDialog_RightRoundWins_${pid}`,
                                    type: "Text",
                                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                                    position: [0, 50],
                                    size: [150, 16],
                                    anchor: mod.UIAnchor.TopCenter,
                                    visible: true,
                                    padding: 0,
                                    bgAlpha: 0,
                                    bgFill: mod.UIBgFill.None,
                                    textLabel: mod.Message(mod.stringkeys.twl.victory.roundWinsFormat, 0),
                                    textColor: [VICTORY_TEAM2_TEXT_RGB[0], VICTORY_TEAM2_TEXT_RGB[1], VICTORY_TEAM2_TEXT_RGB[2]],
                                    textAlpha: 1,
                                    textSize: 12,
                                    textAnchor: mod.UIAnchor.Center,
                                },
                                {
                                    // UI element: VictoryDialog_RightRoundLosses_${pid}
                                    name: `VictoryDialog_RightRoundLosses_${pid}`,
                                    type: "Text",
                                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                                    position: [0, 68],
                                    size: [150, 16],
                                    anchor: mod.UIAnchor.TopCenter,
                                    visible: true,
                                    padding: 0,
                                    bgAlpha: 0,
                                    bgFill: mod.UIBgFill.None,
                                    textLabel: mod.Message(mod.stringkeys.twl.victory.roundLossesFormat, 0),
                                    textColor: [VICTORY_TEAM2_TEXT_RGB[0], VICTORY_TEAM2_TEXT_RGB[1], VICTORY_TEAM2_TEXT_RGB[2]],
                                    textAlpha: 1,
                                    textSize: 12,
                                    textAnchor: mod.UIAnchor.Center,
                                },
                                {
                                    // UI element: VictoryDialog_RightRoundTies_${pid}
                                    name: `VictoryDialog_RightRoundTies_${pid}`,
                                    type: "Text",
                                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                                    position: [0, 86],
                                    size: [150, 16],
                                    anchor: mod.UIAnchor.TopCenter,
                                    visible: true,
                                    padding: 0,
                                    bgAlpha: 0,
                                    bgFill: mod.UIBgFill.None,
                                    textLabel: mod.Message(mod.stringkeys.twl.victory.roundTiesFormat, 0),
                                    textColor: [VICTORY_TEAM2_TEXT_RGB[0], VICTORY_TEAM2_TEXT_RGB[1], VICTORY_TEAM2_TEXT_RGB[2]],
                                    textAlpha: 1,
                                    textSize: 12,
                                    textAnchor: mod.UIAnchor.Center,
                                },
                                {
                                    // UI element: VictoryDialog_RightTotalKills_${pid}
                                    name: `VictoryDialog_RightTotalKills_${pid}`,
                                    type: "Text",
                                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                                    position: [0, 104],
                                    size: [150, 16],
                                    anchor: mod.UIAnchor.TopCenter,
                                    visible: true,
                                    padding: 0,
                                    bgAlpha: 0,
                                    bgFill: mod.UIBgFill.None,
                                    textLabel: mod.Message(mod.stringkeys.twl.victory.totalKillsFormat, 0),
                                    textColor: [VICTORY_TEAM2_TEXT_RGB[0], VICTORY_TEAM2_TEXT_RGB[1], VICTORY_TEAM2_TEXT_RGB[2]],
                                    textAlpha: 1,
                                    textSize: 12,
                                    textAnchor: mod.UIAnchor.Center,
                                },
                            ],
                        },
                    ],
                },
            ],
        });

        if (modal) refs.roots.push(modal);

        refs.victoryRoot = safeFind(`VictoryDialogRoot_${pid}`);
        refs.victoryRestartText = safeFind(`VictoryDialog_Restart_${pid}`);

        refs.victoryTimeHoursTens = safeFind(`VictoryDialog_TimeHT_${pid}`);
        refs.victoryTimeHoursOnes = safeFind(`VictoryDialog_TimeHO_${pid}`);
        refs.victoryTimeMinutesTens = safeFind(`VictoryDialog_TimeMT_${pid}`);
        refs.victoryTimeMinutesOnes = safeFind(`VictoryDialog_TimeMO_${pid}`);
        refs.victoryTimeSecondsTens = safeFind(`VictoryDialog_TimeST_${pid}`);
        refs.victoryTimeSecondsOnes = safeFind(`VictoryDialog_TimeSO_${pid}`);

        refs.victoryRoundsSummaryText = safeFind(`VictoryDialog_Rounds_${pid}`);
        refs.victoryAdminActionsText = safeFind(`VictoryDialog_AdminActions_${pid}`);

        refs.victoryLeftOutcomeText = safeFind(`VictoryDialog_LeftOutcome_${pid}`);
        refs.victoryLeftRoundWinsText = safeFind(`VictoryDialog_LeftRoundWins_${pid}`);
        refs.victoryLeftRoundLossesText = safeFind(`VictoryDialog_LeftRoundLosses_${pid}`);
        refs.victoryLeftRoundTiesText = safeFind(`VictoryDialog_LeftRoundTies_${pid}`);
        refs.victoryLeftTotalKillsText = safeFind(`VictoryDialog_LeftTotalKills_${pid}`);

        refs.victoryRightOutcomeText = safeFind(`VictoryDialog_RightOutcome_${pid}`);
        refs.victoryRightRoundWinsText = safeFind(`VictoryDialog_RightRoundWins_${pid}`);
        refs.victoryRightRoundLossesText = safeFind(`VictoryDialog_RightRoundLosses_${pid}`);
        refs.victoryRightRoundTiesText = safeFind(`VictoryDialog_RightRoundTies_${pid}`);
        refs.victoryLeftRecordText = safeFind(`VictoryDialog_LeftRecord_${pid}`);
        refs.victoryRightRecordText = safeFind(`VictoryDialog_RightRecord_${pid}`);
        refs.victoryRightTotalKillsText = safeFind(`VictoryDialog_RightTotalKills_${pid}`);
    }

    //#endregion ----------------- HUD Build/Ensure - Victory Dialog --------------------



    //#region -------------------- HUD Build/Ensure - Cache Init + Defaults --------------------

    refs.helpTextContainer = safeFind(`Container_HelpText_${pid}`);
    State.hudCache.hudByPid[pid] = refs;

    // Initialize visible numbers immediately
    setCounterText(refs.roundCurText, State.round.current);
    setCounterText(refs.roundMaxText, State.round.max);
    setCounterText(refs.leftWinsText, State.match.winsT1);
    setCounterText(refs.rightWinsText, State.match.winsT2);

    setCounterText(refs.leftRoundKillsText, State.scores.t1RoundKills);
    setCounterText(refs.rightRoundKillsText, State.scores.t2RoundKills);

    // Total kills are tracked separately from GameModeScore (which is used for match wins)
    setCounterText(refs.leftKillsText, State.scores.t1TotalKills);
    setCounterText(refs.rightKillsText, State.scores.t2TotalKills);
    setAdminPanelActionCountText(refs.adminPanelActionCountText, State.admin.actionCount);

    updateVictoryDialogForPlayer(player, getRemainingSeconds());

    return refs;
}

//#endregion ----------------- HUD Build/Ensure - Cache Init + Defaults --------------------



//#region -------------------- HUD Update Helpers --------------------

function setHudRoundCountersForAllPlayers(cur: number, max: number): void {
    State.round.current = Math.max(1, Math.floor(cur));
    State.round.max = Math.max(1, Math.floor(max));
    if (State.round.max < State.round.current) {
        State.round.max = State.round.current;
    }

    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const refs = ensureHudForPlayer(p);
        if (!refs) continue;
        setCounterText(refs.roundCurText, State.round.current);
        setCounterText(refs.roundMaxText, State.round.max);
    }

    setRoundStateTextForAllPlayers();
    // Keep Ready Up dialog "Best of" label in sync with State.round.max.
    updateBestOfRoundsLabelForAllPlayers();
}

function setHudWinCountersForAllPlayers(t1Wins: number, t2Wins: number): void {
    const lw = Math.max(0, Math.floor(t1Wins));
    const rw = Math.max(0, Math.floor(t2Wins));

    // Match wins are authoritative in script state; GameModeScore is mirrored for scoreboard display.
    setMatchWinsTeam(TeamID.Team1, lw);
    setMatchWinsTeam(TeamID.Team2, rw);

    // Cache locally for immediate UI + logic.
    State.match.winsT1 = lw;
    State.match.winsT2 = rw;

    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const refs = ensureHudForPlayer(p);
        if (!refs) continue;
        setCounterText(refs.leftWinsText, lw);
        setCounterText(refs.rightWinsText, rw);
    }

    syncRoundRecordHudForAllPlayers();
}

function syncRoundRecordHudForAllPlayers(): void {
    // Losses are derived from the opponent's win count when rounds end with a single winner.
    State.match.lossesT1 = State.match.winsT2;
    State.match.lossesT2 = State.match.winsT1;

    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const refs = ensureHudForPlayer(p);
        if (!refs) continue;
        setRoundRecordText(refs.leftRecordText, State.match.winsT1, State.match.lossesT1, State.match.tiesT1);
        setRoundRecordText(refs.rightRecordText, State.match.winsT2, State.match.lossesT2, State.match.tiesT2);
    }
}

function adjustMatchTiesForBothTeams(delta: number): void {
    const current = Math.min(State.match.tiesT1, State.match.tiesT2);
    const next = Math.max(0, Math.floor(current + delta));
    State.match.tiesT1 = next;
    State.match.tiesT2 = next;
    syncRoundRecordHudForAllPlayers();
}

function updateAdminPanelActionCountForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const refs = ensureHudForPlayer(p);
        if (!refs) continue;
        setAdminPanelActionCountText(refs.adminPanelActionCountText, State.admin.actionCount);
    }
}

function handleAdminPanelAction(eventPlayer: mod.Player, actionKey: number): void {
    State.admin.actionCount = Math.max(0, Math.floor(State.admin.actionCount) + 1);
    updateAdminPanelActionCountForAllPlayers();
    sendHighlightedWorldLogMessage(mod.Message(mod.stringkeys.twl.adminPanel.actionPressed, eventPlayer, actionKey), true);
}

//#endregion ----------------- HUD Update Helpers --------------------



//#region -------------------- Legacy UI Cleanup (old score_root_* containers) --------------------

// Code Cleanup: Is this still needed??? "score_root_ is not referenced anywhere else?
function deleteLegacyScoreRootForPlayer(player: mod.Player): void {
    const name = "score_root_" + getObjId(player);
    try {
        mod.DeleteUIWidget(mod.FindUIWidgetWithName(name));
    } catch { }
}

function deleteLegacyScoreRootsForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);

    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p) continue;
        if (!mod.IsPlayerValid(p)) continue;
        deleteLegacyScoreRootForPlayer(p);
    }
}
//#endregion ----------------- Legacy UI Cleanup (old score_root_* containers) --------------------



//#region -------------------- Portal Array Helpers (engine arrays) --------------------

function arrayContainsVehicle(arr: any, vehicle: mod.Vehicle): boolean {
    return modlib.IsTrueForAny(arr, (el: any) => mod.Equals(el, vehicle));
}

function arrayRemoveVehicle(arr: any, vehicle: mod.Vehicle): any {
    // FilteredArray must remain stable across engine updates; registry correctness depends on it.
    return modlib.FilteredArray(arr, (el: any) => mod.NotEqualTo(el, vehicle));
}

//#endregion ----------------- Portal Array Helpers (engine arrays) --------------------



//#region -------------------- Vehicle Ownership Tracking (vehIds/vehOwners) --------------------

function getVehicleId(v: mod.Vehicle): number { return getObjId(v); }

function getLastDriver(vehicle: mod.Vehicle): mod.Player {
    const vid = getVehicleId(vehicle);
    for (let i = 0; i < vehIds.length; i++) {
        if (vehIds[i] === vid) return vehOwners[i];
    }
    return undefined as any;
}

function setLastDriver(vehicle: mod.Vehicle, player: mod.Player): void {
    const vid = getVehicleId(vehicle);
    for (let i = 0; i < vehIds.length; i++) {
        if (vehIds[i] === vid) {
            vehOwners[i] = player;
            return;
        }
    }
    vehIds.push(vid);
    vehOwners.push(player);
}

function popLastDriver(vehicle: mod.Vehicle): mod.Player {
    const vid = getVehicleId(vehicle);

    for (let i = 0; i < vehIds.length; i++) {
        if (vehIds[i] === vid) {
            const owner = vehOwners[i];

            const lastIdx = vehIds.length - 1;
            vehIds[i] = vehIds[lastIdx];
            vehOwners[i] = vehOwners[lastIdx];
            vehIds.pop();
            vehOwners.pop();

            return owner;
        }
    }
    return undefined as any;
}

//#endregion ----------------- Vehicle Ownership Tracking (vehIds/vehOwners) --------------------



//#region -------------------- Vehicle Registration (team arrays) --------------------

// Registers vehicle ownership to a team for kill attribution.
// IMPORTANT:
// - Vehicle ID and owning team must stay in sync
// - Reassignments must overwrite previous ownership
// Code Cleanup: Known fragility - we need to refactor or identify a different method entirely as OnPlayerEnterVehicle is error prone.

function registerVehicleToTeam(vehicle: mod.Vehicle, teamNum: TeamID): void {
    mod.SetVariable(regVehiclesTeam1, arrayRemoveVehicle(mod.GetVariable(regVehiclesTeam1), vehicle));
    mod.SetVariable(regVehiclesTeam2, arrayRemoveVehicle(mod.GetVariable(regVehiclesTeam2), vehicle));

    if (teamNum === TeamID.Team1) {
        mod.SetVariable(regVehiclesTeam1, mod.AppendToArray(mod.GetVariable(regVehiclesTeam1), vehicle));
    } else if (teamNum === TeamID.Team2) {
        mod.SetVariable(regVehiclesTeam2, mod.AppendToArray(mod.GetVariable(regVehiclesTeam2), vehicle));
    }
}

//#endregion ----------------- Vehicle Registration (team arrays) --------------------



//#region -------------------- Kills HUD Sync (GameModeScore -> HUD) --------------------


function syncKillsHudFromTrackedTotals(_force: boolean): void {
    // Total kills are tracked in script variables; GameModeScore is reserved for match wins.
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const refs = ensureHudForPlayer(p);
        if (!refs) continue;
        setCounterText(refs.leftKillsText, State.scores.t1TotalKills);
        setCounterText(refs.rightKillsText, State.scores.t2TotalKills);
    }
}

// Round kills HUD Sync (RoundKills -> HUD)

function syncRoundKillsHud(force: boolean = false): void {
    if (!force && State.hudCache.lastHudRoundKillsT1 === State.scores.t1RoundKills && State.hudCache.lastHudRoundKillsT2 === State.scores.t2RoundKills) return;

    State.hudCache.lastHudRoundKillsT1 = State.scores.t1RoundKills;
    State.hudCache.lastHudRoundKillsT2 = State.scores.t2RoundKills;

    const players = mod.AllPlayers();
    const count = mod.CountOf(players);

    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i);
        const refs = ensureHudForPlayer(p);
        if (!refs) continue;

        setCounterText(refs.leftRoundKillsText, State.scores.t1RoundKills);
        setCounterText(refs.rightRoundKillsText, State.scores.t2RoundKills);
    }
}

//#endregion ----------------- Kills HUD Sync (GameModeScore -> HUD) --------------------



//#region -------------------- Match Clock (per-player MM:SS) --------------------

// ClockWidgetCacheEntry:
// Caches all UI widget references required to render the round clock for one player.
// This prevents repeated FindUIWidget calls during clock updates (performance critical).
// Lifecycle:
// - Created once per player by ensureClockUIAndGetCache.
// - Reused on every clock tick.
// - Safe to discard if HUD is rebuilt (will be recreated).
interface ClockWidgetCacheEntry {
    rootName: string;
    roundStateRootName: string;
    roundLiveHelpRootName: string;
    roundStateText?: mod.UIWidget;
    playersReadyText?: mod.UIWidget;
    roundLiveHelpRoot?: mod.UIWidget;
    roundLiveHelpText?: mod.UIWidget;
    minTens: mod.UIWidget;
    minOnes: mod.UIWidget;
    colon: mod.UIWidget;
    secTens: mod.UIWidget;
    secOnes: mod.UIWidget;
}


export function ResetRoundClock(seconds: number): void {
    State.round.clock.durationSeconds = Math.max(0, Math.floor(seconds));
    State.round.clock.matchStartElapsedSeconds = Math.floor(mod.GetMatchTimeElapsed());

    State.round.clock.isPaused = false;
    State.round.clock.pausedRemainingSeconds = undefined;

    State.round.clock.expiryFired = false;
    State.round.clock.lastDisplayedSeconds = undefined;
    State.round.clock.lastLowTimeState = undefined;
}

function getRemainingSeconds(): number {
    if (State.round.clock.isPaused) {
        return Math.max(0, State.round.clock.pausedRemainingSeconds !== undefined ? State.round.clock.pausedRemainingSeconds : 0);
    }

    if (State.round.clock.matchStartElapsedSeconds === undefined) return 0;

    const elapsed = Math.floor(mod.GetMatchTimeElapsed()) - State.round.clock.matchStartElapsedSeconds;
    return Math.max(0, State.round.clock.durationSeconds - elapsed);
}

function adjustRoundClockBySeconds(deltaSeconds: number): void {
    const delta = Math.floor(deltaSeconds);

    if (State.round.clock.isPaused) {
        const current = State.round.clock.pausedRemainingSeconds !== undefined ? State.round.clock.pausedRemainingSeconds : 0;
        State.round.clock.pausedRemainingSeconds = Math.max(0, current + delta);
        State.round.clock.durationSeconds = Math.max(0, State.round.clock.durationSeconds + delta);
    } else {
        State.round.clock.durationSeconds = Math.max(0, State.round.clock.durationSeconds + delta);
    }

    if (delta > 0) {
        State.round.clock.expiryFired = false;
    }

    State.round.clock.lastDisplayedSeconds = undefined;
    State.round.clock.lastLowTimeState = undefined;
}

function resetRoundClockToDefault(): void {
    ResetRoundClock(ROUND_START_SECONDS);
}

// Pushes the current round clock state to all players' HUDs.
// Must be called after any manual admin adjustment or reset of the clock.

/**
 * Refreshes the visible round clock for all players.
 * Expected usage:
 * - Called when the authoritative clock seconds change (tick) or when clock style changes (low time).
 * Performance note:
 * - This should remain a lightweight pass that only updates widgets when the displayed value changes.
 */

function updateAllPlayersClock(): void {
    const remaining = getRemainingSeconds();

    if (!State.round.clock.expiryFired && remaining <= 0) {
        State.round.clock.expiryFired = true;
        for (let i = 0; i < State.round.clock.expiryHandlers.length; i++) {
            State.round.clock.expiryHandlers[i]();
        }
    }

    const lowTime = remaining < LOW_TIME_THRESHOLD_SECONDS;

    const minutes = Math.floor(remaining / 60);
    // Read the authoritative remaining seconds for the round clock.
const seconds = remaining % 60;

    const digits = {
        mT: Math.floor(minutes / 10),
        mO: minutes % 10,
        sT: Math.floor(seconds / 10),
        sO: seconds % 10,
    };

    const players = mod.AllPlayers();
    const count = mod.CountOf(players);

    for (let i = 0; i < count; i++) {
        const player = mod.ValueInArray(players, i) as mod.Player;
        if (!player || !mod.IsPlayerValid(player)) continue;

        // Ensure each player's clock widgets exist and get cached refs for efficient updates.
        const cacheEntry = ensureClockUIAndGetCache(player);
        if (!cacheEntry) continue;

        if (State.round.clock.lastLowTimeState === undefined || lowTime !== State.round.clock.lastLowTimeState) {
            setClockColorCached(cacheEntry, lowTime ? COLOR_LOW_TIME : COLOR_NORMAL);
        }

        if (State.round.clock.lastDisplayedSeconds !== remaining) {
            setDigitCached(cacheEntry.minTens, digits.mT);
            setDigitCached(cacheEntry.minOnes, digits.mO);
            setColonCached(cacheEntry.colon);
            setDigitCached(cacheEntry.secTens, digits.sT);
            setDigitCached(cacheEntry.secOnes, digits.sO);
        }

        updateVictoryDialogForPlayer(player, remaining);
    }

    State.round.clock.lastLowTimeState = lowTime;
    State.round.clock.lastDisplayedSeconds = remaining;
}

/**
 * Ensures the clock UI widgets exist for a given player and returns the cached references.
 * Responsibilities:
 * - Create any missing digit/colon widgets (one-time per player).
 * - Return a cache object that the clock update code can use without repeated widget lookups.
 * Non-responsibilities:
 * - Does not start/stop the clock; it only ensures UI exists.
 */

function ensureClockUIAndGetCache(player: mod.Player): ClockWidgetCacheEntry | undefined {
    // Clock widgets are stored per-player; derive pid for cache lookup.
const pid = mod.GetObjId(player);
    const rootName = "MatchTimerRoot_" + pid;
    const roundStateRootName = "RoundStateRoot_" + pid;
    const roundLiveHelpRootName = "RoundLiveHelpRoot_" + pid;

    const cached = State.hudCache.clockWidgetCache[pid];
    if (cached) {
        const probeClock = safeFind(cached.rootName);
        const probeState = safeFind(cached.roundStateRootName);
        const probeHelp = safeFind(cached.roundLiveHelpRootName);
        if (probeClock && probeState && probeHelp) {
            mod.SetUIWidgetPosition(probeHelp, mod.CreateVector(CLOCK_POSITION_X, 120, 0));
            return cached;
        }
    }

    const digitWidth = CLOCK_WIDTH * 0.12;
    const colonWidth = CLOCK_WIDTH * 0.06;

    const xOffsets = {
        minTens: -digitWidth * 1.8,
        minOnes: -digitWidth * 0.8,
        colon: -digitWidth * 0.05,
        secTens: digitWidth * 0.9,
        secOnes: digitWidth * 1.9,
    };

    modlib.ParseUI({
        name: rootName,
        type: "Container",
        playerId: player,
        anchor: mod.UIAnchor.TopCenter,
        // position: [x, y] offset; direction depends on anchor, so verify visually in-game
        position: [CLOCK_POSITION_X, CLOCK_POSITION_Y],
        size: [CLOCK_WIDTH, CLOCK_HEIGHT],
        visible: true,
        bgAlpha: 0,
        children: [
            // Slow path: create digit widgets once per player, then cache refs for future updates.
            buildDigit("MinTens", pid, xOffsets.minTens, digitWidth),
            buildDigit("MinOnes", pid, xOffsets.minOnes, digitWidth),
            buildColon(pid, xOffsets.colon, colonWidth),
            buildDigit("SecTens", pid, xOffsets.secTens, digitWidth),
            buildDigit("SecOnes", pid, xOffsets.secOnes, digitWidth),
        ],
    });

    // Create round-state text under the match clock for this player.
    modlib.ParseUI({
        name: roundStateRootName,
        type: "Container",
        playerId: player,
        anchor: mod.UIAnchor.TopCenter,
        // position: [x, y] offset; direction depends on anchor, so verify visually in-game
        position: [CLOCK_POSITION_X, CLOCK_POSITION_Y + CLOCK_HEIGHT - 10],
        size: [CLOCK_WIDTH, 34],
        visible: true,
        bgAlpha: 0,
        children: [
            {
                name: "RoundStateText_" + pid,
                type: "Text",
                anchor: mod.UIAnchor.TopCenter,
                // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                position: [0, 0],
                size: [CLOCK_WIDTH, 18],
                visible: true,
                padding: 0,
                bgAlpha: 0,
                bgFill: mod.UIBgFill.None,
                textLabel: mod.stringkeys.twl.hud.roundStateNotReady,
                textColor: [1, 1, 1],
                textAlpha: 1,
                textSize: 12,
                textAnchor: mod.UIAnchor.Center,
            },
            {
                name: "PlayersReadyText_" + pid,
                type: "Text",
                anchor: mod.UIAnchor.TopCenter,
                // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                position: [0, 14],
                size: [CLOCK_WIDTH, 18],
                visible: false,
                padding: 0,
                bgAlpha: 0,
                bgFill: mod.UIBgFill.None,
                // Placeholder label; runtime will set full "{X} / {Y} PLAYERS READY" format.
                textLabel: "",
                // Yellow, matching other important HUD callouts.
                textColor: [1, 1, 0],
                textAlpha: 1,
                textSize: 11,
                textAnchor: mod.UIAnchor.Center,
            },
        ],
    });

    // Create round-live help text under the round-state for this player.
    modlib.ParseUI({
        name: roundLiveHelpRootName,
        type: "Container",
        playerId: player,
        anchor: mod.UIAnchor.TopCenter,
        // position: [x, y] offset; direction depends on anchor, so verify visually in-game
        position: [CLOCK_POSITION_X, 120],
        size: [ROUND_LIVE_HELP_WIDTH, ROUND_LIVE_HELP_HEIGHT],
        visible: false,
        bgAlpha: 0,
        children: [
            {
                name: "RoundLiveHelpText_" + pid,
                type: "Text",
                anchor: mod.UIAnchor.TopCenter,
                // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                position: [0, 0],
                size: [ROUND_LIVE_HELP_WIDTH, ROUND_LIVE_HELP_HEIGHT],
                visible: true,
                padding: 0,
                bgAlpha: 0,
                bgFill: mod.UIBgFill.None,
                textLabel: mod.stringkeys.twl.hud.roundLiveHelpFormat,
                textColor: [1, 1, 1],
                textAlpha: 1,
                textSize: 12,
                textAnchor: mod.UIAnchor.Center,
            },
        ],
    });

    const entry: ClockWidgetCacheEntry = {
        rootName: rootName,
        roundStateRootName: roundStateRootName,
        roundLiveHelpRootName: roundLiveHelpRootName,
        minTens: safeFind("MatchTimerMinTens_" + pid) as mod.UIWidget,
        minOnes: safeFind("MatchTimerMinOnes_" + pid) as mod.UIWidget,
        colon: safeFind("MatchTimerColon_" + pid) as mod.UIWidget,
        secTens: safeFind("MatchTimerSecTens_" + pid) as mod.UIWidget,
        secOnes: safeFind("MatchTimerSecOnes_" + pid) as mod.UIWidget,
        roundStateText: safeFind("RoundStateText_" + pid) as mod.UIWidget,
        playersReadyText: safeFind("PlayersReadyText_" + pid) as mod.UIWidget,
        roundLiveHelpRoot: safeFind(roundLiveHelpRootName) as mod.UIWidget,
        roundLiveHelpText: safeFind("RoundLiveHelpText_" + pid) as mod.UIWidget,
    };

    if (
        !entry.minTens ||
        !entry.minOnes ||
        !entry.colon ||
        !entry.secTens ||
        !entry.secOnes ||
        !entry.roundStateText ||
        !entry.playersReadyText ||
        !entry.roundLiveHelpRoot ||
        !entry.roundLiveHelpText
    ) {
        return undefined;
    }

    State.hudCache.clockWidgetCache[pid] = entry;
    setClockColorCached(entry, COLOR_NORMAL);

    return entry;
}

function buildDigit(part: string, pid: number, x: number, width: number) {
    return {
        name: "MatchTimer" + part + "_" + pid,
        type: "Text",
        anchor: mod.UIAnchor.Center,
        // position: [x, y] offset; direction depends on anchor, so verify visually in-game
        position: [x, 0],
        size: [width, CLOCK_HEIGHT],
        visible: true,
        bgAlpha: 0,
        textLabel: mod.stringkeys.twl.hud.clock.digit,
        textSize: CLOCK_FONT_SIZE,
        textAnchor: mod.UIAnchor.Center,
    };
}

function buildColon(pid: number, x: number, width: number) {
    return {
        name: "MatchTimerColon_" + pid,
        type: "Text",
        anchor: mod.UIAnchor.Center,
        // position: [x, y] offset; direction depends on anchor, so verify visually in-game
        position: [x, 0],
        size: [width, CLOCK_HEIGHT],
        visible: true,
        bgAlpha: 0,
        textLabel: mod.stringkeys.twl.hud.clock.colon,
        textSize: CLOCK_FONT_SIZE,
        textAnchor: mod.UIAnchor.Center,
    };
}

function setDigitCached(widget: mod.UIWidget, digit: number): void {
    mod.SetUITextLabel(widget, mod.Message(mod.stringkeys.twl.hud.clock.digit, digit));
}

function setColonCached(widget: mod.UIWidget): void {
    mod.SetUITextLabel(widget, mod.Message(mod.stringkeys.twl.hud.clock.colon));
}

function setClockColorCached(cacheEntry: ClockWidgetCacheEntry, color: any): void {
    mod.SetUITextColor(cacheEntry.minTens, color);
    mod.SetUITextColor(cacheEntry.minOnes, color);
    mod.SetUITextColor(cacheEntry.colon, color);
    mod.SetUITextColor(cacheEntry.secTens, color);
    mod.SetUITextColor(cacheEntry.secOnes, color);
}

//#endregion ----------------- Match Clock (per-player MM:SS) --------------------



//#region -------------------- Team Switch Data + Config --------------------

interface TeamSwitchConfig {
    enableTeamSwitch: boolean;
    interactPointMinLifetime: number;
    interactPointMaxLifetime: number;
    velocityThreshold: number;
}

interface teamSwitchData_t {
    interactPoint: mod.InteractPoint | null;
    lastDeployTime: number;
    dontShowAgain: boolean;
    adminPanelVisible: boolean;
    adminPanelBuilt: boolean;
    lastAdminPanelToggleAt: number;
    dialogVisible: boolean;
    // UI caching: true after the first warm-up build so subsequent opens can be instant.
    uiBuilt: boolean;
}

// Per-player state lives in State.players:
// - teamSwitchData: dialog + interact-point state per player.
// - readyByPid: READY toggle state for roster + auto-start gating.
// - inMainBaseByPid: main-base presence for pre-round gating + UI.

//#endregion ----------------- Team Switch Data + Config --------------------



//#region -------------------- Team Switch Logic (interact point + swap teams) --------------------

async function spawnTeamSwitchInteractPoint(eventPlayer: mod.Player) {
    const playerId = mod.GetObjId(eventPlayer);
    if (!State.players.teamSwitchData[playerId]) initTeamSwitchData(eventPlayer);

    if (
        State.players.teamSwitchData[playerId].interactPoint === null &&
        !State.players.teamSwitchData[playerId].dontShowAgain &&
        TEAMSWITCHCONFIG.enableTeamSwitch
    ) {
        let isOnGround = mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsOnGround);

        while (!isOnGround) {
            await mod.Wait(0.2);
            isOnGround = mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsOnGround);
        }

        const playerPosition = mod.GetSoldierState(eventPlayer, mod.SoldierStateVector.GetPosition);
        const playerFacingDirection = mod.GetSoldierState(eventPlayer, mod.SoldierStateVector.GetFacingDirection);

        const interactPointPosition = mod.Add(
            mod.Add(playerPosition, playerFacingDirection),
            mod.CreateVector(0, 1.5, 0)
        );

        const interactPoint: mod.InteractPoint = mod.SpawnObject(
            mod.RuntimeSpawn_Common.InteractPoint,
            interactPointPosition,
            mod.CreateVector(0, 0, 0)
        );

        mod.EnableInteractPoint(interactPoint, true);
        State.players.teamSwitchData[playerId].interactPoint = interactPoint;
        State.players.teamSwitchData[playerId].lastDeployTime = mod.GetMatchTimeElapsed();
    }
}

function teamSwitchInteractPointActivated(eventPlayer: mod.Player, eventInteractPoint: mod.InteractPoint) {
    const playerId = mod.GetObjId(eventPlayer);
    if (!State.players.teamSwitchData[playerId]) initTeamSwitchData(eventPlayer);

    if (State.players.teamSwitchData[playerId].interactPoint != null) {
        const interactPointId = mod.GetObjId(State.players.teamSwitchData[playerId].interactPoint);
        const eventInteractPointId = mod.GetObjId(eventInteractPoint);
        if (interactPointId === eventInteractPointId) {
            mod.EnableUIInputMode(true, eventPlayer);
            createTeamSwitchUI(eventPlayer);
            // Track visibility so roster refreshes can target all viewers with the dialog open.
            State.players.teamSwitchData[playerId].dialogVisible = true;
            updateHelpTextVisibilityForPid(playerId);
            renderReadyDialogForViewer(eventPlayer, playerId);
            // Immediate self-refresh to avoid relying solely on global refresh bookkeeping.

        }
    }
}

function removeTeamSwitchInteractPoint(eventPlayer: mod.Player | number) {
    let playerId: number;

    if (mod.IsType(eventPlayer, mod.Types.Player)) {
        playerId = mod.GetObjId(eventPlayer as mod.Player);
    } else {
        playerId = eventPlayer as number;
    }

    if (!State.players.teamSwitchData[playerId]) return;

    if (State.players.teamSwitchData[playerId].interactPoint != null) {
        mod.EnableInteractPoint(State.players.teamSwitchData[playerId].interactPoint as mod.InteractPoint, false);
        mod.UnspawnObject(State.players.teamSwitchData[playerId].interactPoint as mod.InteractPoint);
        State.players.teamSwitchData[playerId].interactPoint = null;
    }
}

function isVelocityBeyond(threshold: number, eventPlayer: mod.Player): boolean {
    const v = mod.GetSoldierState(eventPlayer, mod.SoldierStateVector.GetLinearVelocity);
    const x = mod.AbsoluteValue(mod.XComponentOf(v));
    const y = mod.AbsoluteValue(mod.YComponentOf(v));
    const z = mod.AbsoluteValue(mod.ZComponentOf(v));
    return x + y + z > threshold;
}

function checkTeamSwitchInteractPointRemoval(eventPlayer: mod.Player) {
    if (TEAMSWITCHCONFIG.enableTeamSwitch && !mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsDead)) {
        const playerId = mod.GetObjId(eventPlayer);
        if (!State.players.teamSwitchData[playerId]) initTeamSwitchData(eventPlayer);

        if (State.players.teamSwitchData[playerId].interactPoint != null) {
            const lifetime = mod.GetMatchTimeElapsed() - State.players.teamSwitchData[playerId].lastDeployTime;

            if (
                isVelocityBeyond(TEAMSWITCHCONFIG.velocityThreshold, eventPlayer) ||
                lifetime > TEAMSWITCHCONFIG.interactPointMaxLifetime
            ) {
                removeTeamSwitchInteractPoint(playerId);
            }
        }
    }
}

function initTeamSwitchData(eventPlayer: mod.Player) {
    const playerId = mod.GetObjId(eventPlayer);
    State.players.teamSwitchData[playerId] = {
        dontShowAgain: false,
        adminPanelVisible: false,
        adminPanelBuilt: false,
        lastAdminPanelToggleAt: 0,
        dialogVisible: false,
        interactPoint: null,
        lastDeployTime: 0,
        uiBuilt: false,
    };
}

// Handles a player-initiated team switch.
// This function validates the request, updates team membership,
// and triggers any required HUD or state refresh.

// Performs an undeploy with a short delay to ensure the engine has applied a prior SetTeam() before changing deploy state.
// This intentionally does NOT re-deploy the player; the player is expected to choose a spawn point manually.
async function forceUndeployPlayer(eventPlayer: mod.Player): Promise<void> {
    // Undeploy immediately so the player is forced to the deploy screen right away.
    // Then retry once with a short delay for robustness across transient engine timing.
    mod.UndeployPlayer(eventPlayer);
    await mod.Wait(0.05);
    mod.UndeployPlayer(eventPlayer);
}

function processTeamSwitch(eventPlayer: mod.Player) {
    // Legacy team-switch pathway retained for reuse by the Ready Dialog (Swap Teams button: Swap Teams button).
    // Requirements:
    // - Change the player's team assignment (TeamID.Team1 <-> TeamID.Team2)
    // - Force the player back to the deploy screen on the new team (not just update UI/roster state)
    //
    // NOTE: Some engines cache team affiliation on the deployed soldier entity; therefore we:
    // 1) Set the team, then
    // 2) Undeploy the player so they must redeploy on the new team.

    const currentTeamNum = getTeamNumber(mod.GetTeam(eventPlayer));
    const newTeamNum = (currentTeamNum === TeamID.Team2) ? TeamID.Team1 : TeamID.Team2;
    mod.SetTeam(eventPlayer, mod.GetTeam(newTeamNum));

    // Force a rapid return to the deploy screen so the player respawns on the new team.
    // Note: do not modify redeploy timers globally; we only force an undeploy so the player can choose spawn manually.
    // Ensure team switching does not grant faster-than-normal respawn timing.
    // We reuse the same redeploy window used at round end (ROUND_END_REDEPLOY_DELAY_SECONDS).
    mod.SetRedeployTime(eventPlayer, ROUND_END_REDEPLOY_DELAY_SECONDS);
    void forceUndeployPlayer(eventPlayer);

    sendHighlightedWorldLogMessage(mod.Message(mod.stringkeys.twl.notifications.teamSwitch), false, mod.GetTeam(eventPlayer));
    deleteTeamSwitchUI(eventPlayer);
}

function deleteTeamSwitchUI(eventPlayer: mod.Player | number) {
    // Deletes the Team Switch UI for the given player id and restores normal input.
    // Note: When called with a player id (number) rather than a mod.Player, UI input mode cannot be toggled here.

    let playerId: any = eventPlayer;

    if (mod.IsType(eventPlayer, mod.Types.Player)) {
        mod.EnableUIInputMode(false, eventPlayer as mod.Player);
        playerId = mod.GetObjId(eventPlayer as mod.Player);
    }

    const baseWidget = safeFind(UI_TEAMSWITCH_CONTAINER_BASE_ID + playerId);
    if (baseWidget) mod.SetUIWidgetVisible(baseWidget, false);
    const debugWidget = safeFind(UI_TEAMSWITCH_DEBUG_TIMELIMIT_ID + playerId);
    if (debugWidget) {
        mod.SetUIWidgetVisible(debugWidget, false);
    }

    // Admin panel is not cached: delete container + children + toggle on close to prevent stray widgets.
    deleteAdminPanelUI(playerId, true);
    setAdminPanelChildWidgetsVisible(playerId, false);

    if (State.players.teamSwitchData[playerId]) {
        State.players.teamSwitchData[playerId].adminPanelVisible = false;
        State.players.teamSwitchData[playerId].adminPanelBuilt = false;
        // Force-hide any stray admin panel children (some engines do not cascade container visibility).
        setAdminPanelChildWidgetsVisible(playerId, false);
        // Delete any previously-built admin container so the panel will rebuild cleanly on demand.
        const existingAdminContainer = safeFind(UI_ADMIN_PANEL_CONTAINER_ID + playerId);
        if (existingAdminContainer) mod.DeleteUIWidget(existingAdminContainer);
    State.players.teamSwitchData[playerId].adminPanelBuilt = false;
        // Dialog is no longer visible; stop participating in global roster refreshes.
        State.players.teamSwitchData[playerId].dialogVisible = false;
    }

    updateHelpTextVisibilityForPid(playerId);
}

function closeReadyDialogForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const pid = mod.GetObjId(p);
        if (State.players.teamSwitchData[pid]?.dialogVisible) {
            deleteTeamSwitchUI(p);
        }
    }
}

// Hard delete used only for cleanup (e.g., player leaves game).
// Normal dialog close should hide widgets to enable UI caching and faster reopen.
function hardDeleteTeamSwitchUI(playerId: number): void {
    const baseWidget = safeFind(UI_TEAMSWITCH_CONTAINER_BASE_ID + playerId);
    if (baseWidget) mod.DeleteUIWidget(baseWidget);
    const debugWidget = safeFind(UI_TEAMSWITCH_DEBUG_TIMELIMIT_ID + playerId);
    if (debugWidget) mod.DeleteUIWidget(debugWidget);

    // Admin Panel widgets (toggle button + label + container).
    const adminToggle = safeFind(UI_ADMIN_PANEL_BUTTON_ID + playerId);
    if (adminToggle) mod.DeleteUIWidget(adminToggle);
    const adminToggleLabel = safeFind(UI_ADMIN_PANEL_BUTTON_LABEL_ID + playerId);
    if (adminToggleLabel) mod.DeleteUIWidget(adminToggleLabel);
    const adminContainer = safeFind(UI_ADMIN_PANEL_CONTAINER_ID + playerId);
    if (adminContainer) mod.DeleteUIWidget(adminContainer);
}

//#endregion ----------------- Team Switch Logic (interact point + swap teams) --------------------



//#region -------------------- Round Start/End Flow + State --------------------

// Runs round start/end flow tied to the round clock expiry.
// Victory dialog visibility is intentionally decoupled from State.match.isEnded.
// State.match.isEnded can become true at round end, but the Victory UI should only appear after the 10s round-end window expires.
// State.match.victoryDialogActive gates both visibility and countdown updates so the restart timer always starts at 45s when the dialog appears.

// Async control (round end):
// - State.round.flow.roundEndRedeployToken invalidates any in-flight round-end countdowns when incremented.
// - State.round.flow.clockExpiryBound prevents double-binding the clock-expiry handler.
// Async control (match end):
// - State.match.flow.matchEndDelayToken invalidates any in-flight match-end delays when incremented.


function broadcastStringKey(
    stringKey: number,
    arg0?: string | number | mod.Player,
    arg1?: string | number | mod.Player,
    arg2?: string | number | mod.Player
): void {
    const message = (arg0 === undefined)
        ? mod.Message(stringKey)
        : (arg1 === undefined)
            ? mod.Message(stringKey, arg0)
            : (arg2 === undefined)
                ? mod.Message(stringKey, arg0, arg1)
                : mod.Message(stringKey, arg0, arg1, arg2);
    sendNotificationMessage(message, false);
}

function broadcastHighlightedStringKey(
    stringKey: number,
    arg0?: string | number | mod.Player,
    arg1?: string | number | mod.Player,
    arg2?: string | number | mod.Player
): void {
    const message = (arg0 === undefined)
        ? mod.Message(stringKey)
        : (arg1 === undefined)
            ? mod.Message(stringKey, arg0)
            : (arg2 === undefined)
                ? mod.Message(stringKey, arg0, arg1)
                : mod.Message(stringKey, arg0, arg1, arg2);
    sendHighlightedWorldLogMessage(message, false);
}

// Commented out function:
//function broadcastNotificationMessage(message: mod.Message): void {
//    mod.DisplayNotificationMessage(message);
//}

// Standard round-end flow: after ROUND_END_REDEPLOY_DELAY_SECONDS, hide the round-end dialog and undeploy all players.
// State.round.flow.roundEndRedeployToken cancels older timers if a new round end is triggered before the delay completes.
async function scheduleRoundEndRedeploy(expectedToken: number): Promise<void> {
    await mod.Wait(ROUND_END_REDEPLOY_DELAY_SECONDS);

    if (expectedToken !== State.round.flow.roundEndRedeployToken) {
        return;
    }
    if (isRoundLive()) {
        return;
    }

    // Hide the round-end dialog at the redeploy boundary so it never outlives the round-end window.
    setRoundEndDialogVisibleForAllPlayers(false);

    // Skip redeploy when the match has ended (victory dialog continues through the match-end flow).
    if (State.match.isEnded) {
        return;
// Final-round flow: keep the round-end dialog visible for the normal 10s window, then hide it and show the Victory dialog for MATCH_END_DELAY_SECONDS.
// This uses State.match.flow.matchEndDelayToken as a cancellation token so admin actions or unexpected state changes cannot trigger stale delayed UI.
    }

    mod.UndeployAllPlayers();
}

async function scheduleFinalRoundVictory(expectedToken: number, winningTeamNum: TeamID | 0): Promise<void> {
    await mod.Wait(ROUND_END_REDEPLOY_DELAY_SECONDS);

    if (expectedToken !== State.match.flow.matchEndDelayToken) {
        return;
    }
    if (!State.match.isEnded) {
        return;
    }

    // Hide the round-end dialog when the round-end window expires, even on the final round.
    setRoundEndDialogVisibleForAllPlayers(false);

    // Start the match-end victory flow only after the round-end window completes.
    State.match.victoryStartElapsedSecondsSnapshot = Math.floor(mod.GetMatchTimeElapsed());
    State.match.endElapsedSecondsSnapshot = State.match.victoryStartElapsedSecondsSnapshot;
    State.match.victoryDialogActive = true;
    State.round.clock.isPaused = false;
    State.round.clock.pausedRemainingSeconds = undefined;
    ResetRoundClock(MATCH_END_DELAY_SECONDS);
    updateVictoryDialogForAllPlayers(MATCH_END_DELAY_SECONDS);

    void scheduleMatchEnd(expectedToken, winningTeamNum);
}

async function scheduleMatchEnd(expectedToken: number, winningTeamNum?: TeamID | 0): Promise<void> {
    await mod.Wait(MATCH_END_DELAY_SECONDS);

    if (expectedToken !== State.match.flow.matchEndDelayToken) {
        return;
    }
    if (!State.match.isEnded) {
        return;
    }

    if (winningTeamNum !== undefined && winningTeamNum !== 0) {
        endGameModeForTeamNum(winningTeamNum);
        return;
    }

    mod.EndGameMode(mod.GetTeam(0));
}

function bindRoundClockExpiryToRoundEnd(): void {
    if (State.round.flow.clockExpiryBound) return;
    State.round.flow.clockExpiryBound = true;

    State.round.clock.expiryHandlers.push(() => {
        if (isRoundLive()) {
            endRound();
        }
    });
}

// Starts a new round using the current authoritative configuration.
// Invariants:
// - Resets per-round counters but preserves match-level totals
// - Initializes the round clock from ROUND_START_SECONDS
// - Sets round phase state used by HUD and end conditions

function startRound(_triggerPlayer?: mod.Player): void {
    if (State.match.isEnded) {
    // Steps:
    // 1) Reset round-scoped counters and flags
    // 2) Initialize the round clock from ROUND_START_SECONDS
    // 3) Push HUD/UI updates for the new round state

        return;
    }

    // Defensive cleanup: hide countdown UI if we are not currently running a countdown.
    // This preserves the GO display when startRound is triggered by the countdown itself.
    if (!State.round.countdown.isActive) {
        hidePregameCountdownForAllPlayers();
    }

    State.round.countdown.isRequested = false;
    bindRoundClockExpiryToRoundEnd();
    State.round.phase = RoundPhase.Live; // Enables scoring + LIVE HUD state.
    // Extends the built-in gamemode time limit so the match always has a full hour remaining after each round start.
    const elapsedSeconds = Math.floor(mod.GetMatchTimeElapsed());
    mod.SetGameModeTimeLimit(elapsedSeconds + BACKGROUND_TIME_LIMIT_RESET_SECONDS);
    setRoundStateTextForAllPlayers();
    updateHelpTextVisibilityForAllPlayers();
    setRoundEndDialogVisibleForAllPlayers(false);

    State.scores.t1RoundKills = 0;
    State.scores.t2RoundKills = 0;

    syncRoundKillsHud(true);

    ResetRoundClock(ROUND_START_SECONDS);
    broadcastStringKey(mod.stringkeys.twl.notifications.roundStarted);
}

// Ends the current round and schedules transition to the next state.
// Notes:
// - Round end reason is determined before this call
// - Redeploy delay and next-round scheduling are time-based
// - Match end is handled separately and must not be triggered here

function endRound(_triggerPlayer?: mod.Player, freezeRemainingSeconds?: number): void {
    if (!isRoundLive()) {
    // Steps:
    // 1) Freeze round-live systems (no further scoring)
    // 2) Schedule redeploy / transition using ROUND_END_REDEPLOY_DELAY_SECONDS
    // 3) If match should end, hand off to match-end path (not round path)

        return;
    }
    State.round.phase = RoundPhase.NotReady; // Return to pre-round state; may be overridden to GameOver below.
    // Ready-cycle auto-start / reset:: round ended -> reset all players to NOT READY for the next ready-up cycle.
    resetReadyStateForAllPlayers();

    // Freeze display after ending the round.
    State.round.clock.isPaused = true;
    State.round.clock.pausedRemainingSeconds = Math.max(0, freezeRemainingSeconds !== undefined ? Math.floor(freezeRemainingSeconds) : 0);

    const winnerTeamNum = (State.scores.t1RoundKills > State.scores.t2RoundKills) ? TeamID.Team1 : ((State.scores.t2RoundKills > State.scores.t1RoundKills) ? TeamID.Team2 : 0);
    updateRoundEndDialogForAllPlayers(winnerTeamNum);
    setRoundEndDialogVisibleForAllPlayers(true);

    const t1 = State.scores.t1RoundKills;
    const t2 = State.scores.t2RoundKills;

    if (t1 > t2) {
        const newT1Wins = State.match.winsT1 + 1;
        const newT2Wins = State.match.winsT2;
        setHudWinCountersForAllPlayers(newT1Wins, newT2Wins);
        broadcastStringKey(mod.stringkeys.twl.notifications.roundEndWin, mod.stringkeys.twl.teams.leftName, t1, t2);
        broadcastHighlightedStringKey(mod.stringkeys.twl.notifications.roundWins, newT1Wins, newT2Wins);
    } else if (t2 > t1) {
        const newT1Wins = State.match.winsT1;
        const newT2Wins = State.match.winsT2 + 1;
        setHudWinCountersForAllPlayers(newT1Wins, newT2Wins);
        broadcastStringKey(mod.stringkeys.twl.notifications.roundEndWin, mod.stringkeys.twl.teams.rightName, t2, t1);
        broadcastHighlightedStringKey(mod.stringkeys.twl.notifications.roundWins, newT1Wins, newT2Wins);
    } else {
        State.match.tiesT1 = State.match.tiesT1 + 1;
        State.match.tiesT2 = State.match.tiesT2 + 1;
        syncRoundRecordHudForAllPlayers();
        broadcastStringKey(mod.stringkeys.twl.notifications.roundEndTie, t1, t2);
        broadcastHighlightedStringKey(mod.stringkeys.twl.notifications.roundWins, State.match.winsT1, State.match.winsT2);
    }

    // End match when a team reaches the required majority of wins.
    const winsNeeded = Math.floor(State.round.max / 2) + 1;
    if (State.round.max >= 1) {
        if (State.match.winsT1 >= winsNeeded) {
            State.match.isEnded = true;
            State.round.phase = RoundPhase.GameOver; // Locks HUD to GAME OVER and disables live scoring.
            updateHelpTextVisibilityForAllPlayers();
            setRoundStateTextForAllPlayers();
            State.match.winnerTeam = TeamID.Team1;
            State.match.flow.matchEndDelayToken = (State.match.flow.matchEndDelayToken + 1) % 1000000000;
            const matchEndToken = State.match.flow.matchEndDelayToken;
            void scheduleFinalRoundVictory(matchEndToken, TeamID.Team1);
            return;
        }
        if (State.match.winsT2 >= winsNeeded) {
            State.match.isEnded = true;
            State.round.phase = RoundPhase.GameOver; // Locks HUD to GAME OVER and disables live scoring.
            updateHelpTextVisibilityForAllPlayers();
            setRoundStateTextForAllPlayers();
            State.match.winnerTeam = TeamID.Team2;
            State.match.flow.matchEndDelayToken = (State.match.flow.matchEndDelayToken + 1) % 1000000000;
            const matchEndToken = State.match.flow.matchEndDelayToken;
            void scheduleFinalRoundVictory(matchEndToken, TeamID.Team2);
            return;
        }
    }    
    
    // Ends the match at max rounds by comparing wins; a tie remains a draw.
    // End match when the configured max rounds are completed without a majority winner.
    // Winner is decided by most rounds won; a tie remains a draw.
    if (State.round.max >= 1 && State.round.current >= State.round.max) {
        State.match.isEnded = true;
        State.round.phase = RoundPhase.GameOver; // Locks HUD to GAME OVER and disables live scoring.
        updateHelpTextVisibilityForAllPlayers();
        setRoundStateTextForAllPlayers();

        if (State.match.winsT1 > State.match.winsT2) {
            State.match.winnerTeam = TeamID.Team1;
            State.match.flow.matchEndDelayToken = (State.match.flow.matchEndDelayToken + 1) % 1000000000;
            const matchEndToken = State.match.flow.matchEndDelayToken;
            void scheduleFinalRoundVictory(matchEndToken, TeamID.Team1);
            return;
        }

        if (State.match.winsT2 > State.match.winsT1) {
            State.match.winnerTeam = TeamID.Team2;
            State.match.flow.matchEndDelayToken = (State.match.flow.matchEndDelayToken + 1) % 1000000000;
            const matchEndToken = State.match.flow.matchEndDelayToken;
            void scheduleFinalRoundVictory(matchEndToken, TeamID.Team2);
            return;
        }

        State.match.winnerTeam = undefined;
        State.match.flow.matchEndDelayToken = (State.match.flow.matchEndDelayToken + 1) % 1000000000;
        const matchEndToken = State.match.flow.matchEndDelayToken;
        void scheduleFinalRoundVictory(matchEndToken, 0);
        return;
    }

    State.round.flow.roundEndRedeployToken = (State.round.flow.roundEndRedeployToken + 1) % 1000000000;
    const redeployToken = State.round.flow.roundEndRedeployToken;

    sendHighlightedWorldLogMessage(
        mod.Message(mod.stringkeys.twl.notifications.roundOverRedeploying, ROUND_END_REDEPLOY_DELAY_SECONDS),
        true
    );
    void scheduleRoundEndRedeploy(redeployToken);

    // Prepare next round counters after ending the active round.
    State.round.current = Math.floor(State.round.current) + 1;
    setHudRoundCountersForAllPlayers(State.round.current, State.round.max);
    setRoundStateTextForAllPlayers();
    updateHelpTextVisibilityForAllPlayers();
}

//#endregion ----------------- Round Start/End Flow + State --------------------



//#region -------------------- Team Switch UI + Tester Panel (IDs + build helpers) --------------------

function teamSwitchButtonEvent(
    eventPlayer: mod.Player,
    eventUIWidget: mod.UIWidget,
    eventUIButtonEvent: mod.UIButtonEvent
) {
    // Steps:
    // 1) Identify which button was pressed for this player
    // 2) Mutate authoritative state (match / round counters) if applicable
    // 3) Resync HUD/UI projections so every player sees the new state

    const playerId = mod.GetObjId(eventPlayer);
    const widgetName = mod.GetUIWidgetName(eventUIWidget);

    switch (widgetName) {
        case UI_TEAMSWITCH_BUTTON_TEAM1_ID + playerId:
        case UI_TEAMSWITCH_BUTTON_TEAM2_ID + playerId:
            // Deprecated UI (v0.5): Team 1 / Team 2 buttons removed from the dialog.
            // This handler path is intentionally retained so the UI can be re-enabled later without re-implementing team switch logic.
            processTeamSwitch(eventPlayer);
            break;

        case UI_TEAMSWITCH_BUTTON_CANCEL_ID + playerId:
            deleteTeamSwitchUI(eventPlayer);
            break;

        case UI_READY_DIALOG_BUTTON_READY_ID + playerId: {
            // Pre-round gating:: players may only transition to READY while in their main base when the round is NOT active.
            // Ready-cycle auto-start / reset:: when all active players become READY, auto-start the round via startRound().
            const pid = mod.GetObjId(eventPlayer);
            const currentlyReady = !!State.players.readyByPid[pid];
            const inBase = (State.players.inMainBaseByPid[pid] !== undefined) ? State.players.inMainBaseByPid[pid] : true;

            // Transition rules:
            // - NOT READY -> READY: allowed only if (inBase || isRoundLive()) (Pre-round gating: gating applies only pre-round).
            // - READY -> NOT READY: always allowed.
            if (!currentlyReady) {
                if (!isRoundLive() && !inBase) {
                    // Deny ready-up outside of base pre-round (no messaging in current milestone).
                    break;
                }
                State.players.readyByPid[pid] = true;
                // Keep the HUD "X / Y PLAYERS READY" line in sync on every ready-state change.
                updatePlayersReadyHudTextForAllPlayers();
            } else {
                State.players.readyByPid[pid] = false;
                // Keep the HUD "X / Y PLAYERS READY" line in sync on every ready-state change.
                updatePlayersReadyHudTextForAllPlayers();
            }

            // Refresh self + all visible viewers (centralized render).
            renderReadyDialogForViewer(eventPlayer, playerId);
            // Refresh all visible viewers so everyone sees readiness changes immediately.

            // Also refresh all other viewers who currently have the dialog open.
            renderReadyDialogForAllVisibleViewers();
            updatePlayersReadyHudTextForAllPlayers();

            // Ready-cycle auto-start / reset:: if this interaction resulted in all active players being READY, begin the round.
            tryAutoStartRoundIfAllReady(eventPlayer);
            break;
        }

        case UI_READY_DIALOG_BUTTON_SWAP_ID + playerId: {
            // Swap Teams button:: single-button team toggle.
            swapPlayerTeam(eventPlayer);
            break;
        }

        case UI_READY_DIALOG_BESTOF_DEC_ID + playerId: {
            // Clamp to current round so max rounds never dips below the live round index.
            const prevMax = State.round.max;
            setHudRoundCountersForAllPlayers(State.round.current, Math.max(State.round.current, Math.max(1, State.round.max - 1)));
            if (State.round.max !== prevMax) {
                // Gameplay-gated world log message for best-of changes.
                sendHighlightedWorldLogMessage(
                    mod.Message(mod.stringkeys.twl.readyDialog.bestOfChanged, eventPlayer, Math.floor(State.round.max)),
                    true
                );
            }
            break;
        }
        case UI_READY_DIALOG_BESTOF_INC_ID + playerId: {
            const prevMax = State.round.max;
            setHudRoundCountersForAllPlayers(State.round.current, State.round.max + 1);
            if (State.round.max !== prevMax) {
                // Gameplay-gated world log message for best-of changes.
                sendHighlightedWorldLogMessage(
                    mod.Message(mod.stringkeys.twl.readyDialog.bestOfChanged, eventPlayer, Math.floor(State.round.max)),
                    true
                );
            }
            break;
        }

        case UI_TEAMSWITCH_BUTTON_OPTOUT_ID + playerId:
            // Deprecated UI (v0.5): 'DONT SHOW AGAIN' button removed from the dialog.
            // The opt-out flag and behavior remain to support reintroducing the control in a future version.
            if (!State.players.teamSwitchData[playerId]) initTeamSwitchData(eventPlayer);
            State.players.teamSwitchData[playerId].dontShowAgain = true;
            deleteTeamSwitchUI(eventPlayer);
            break;

        case UI_ADMIN_PANEL_BUTTON_ID + playerId: {
            if (!State.players.teamSwitchData[playerId]) initTeamSwitchData(eventPlayer);
            const now = mod.GetMatchTimeElapsed();
            if (now - State.players.teamSwitchData[playerId].lastAdminPanelToggleAt < ADMIN_PANEL_TOGGLE_COOLDOWN_SECONDS) {
                break;
            }
            State.players.teamSwitchData[playerId].lastAdminPanelToggleAt = now;

            // Toggle admin panel visibility.
            State.players.teamSwitchData[playerId].adminPanelVisible = !State.players.teamSwitchData[playerId].adminPanelVisible;
            if (!State.players.teamSwitchData[playerId].adminPanelVisible) {
                // Close: delete panel contents to avoid "ghost" children on some clients.
                deleteAdminPanelUI(playerId, false);
                State.players.teamSwitchData[playerId].adminPanelBuilt = false;
                break;
            }

            sendHighlightedWorldLogMessage(mod.Message(mod.stringkeys.twl.adminPanel.accessed, eventPlayer), true);

            // Open: rebuild container + widgets fresh each time (low cost; avoids duplicate draw bugs).
            deleteAdminPanelUI(playerId, false); // safety: ensure no stale container/children exist

            mod.AddUIContainer(
                UI_ADMIN_PANEL_CONTAINER_ID + playerId,
                mod.CreateVector(-10, 46, 0),
                mod.CreateVector(330, 580, 0),
                mod.UIAnchor.TopRight,
                mod.GetUIRoot(),
                false,
                10,
                mod.CreateVector(0, 0, 0),
                0.8,
                mod.UIBgFill.Blur,
                mod.UIDepth.AboveGameUI,
                eventPlayer
            );

            const adminContainer = mod.FindUIWidgetWithName(UI_ADMIN_PANEL_CONTAINER_ID + playerId, mod.GetUIRoot());
            buildAdminPanelWidgets(eventPlayer, adminContainer, playerId);
            State.players.teamSwitchData[playerId].adminPanelBuilt = true;
            mod.SetUIWidgetVisible(adminContainer, true);
            setAdminPanelChildWidgetsVisible(playerId, true);
            break;
        }

        //#endregion ----------------- Team Switch UI + Tester Panel (IDs + build helpers) --------------------



        //#region -------------------- Tester Button Events --------------------

        case UI_TEST_BUTTON_LEFT_WINS_DEC_ID + playerId:
            setHudWinCountersForAllPlayers(Math.max(0, State.match.winsT1 - 1), State.match.winsT2);
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.t1WinsDec);
            break;
        case UI_TEST_BUTTON_LEFT_WINS_INC_ID + playerId:
            setHudWinCountersForAllPlayers(State.match.winsT1 + 1, State.match.winsT2);
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.t1WinsInc);
            break;

        case UI_TEST_BUTTON_RIGHT_WINS_DEC_ID + playerId:
            setHudWinCountersForAllPlayers(State.match.winsT1, Math.max(0, State.match.winsT2 - 1));
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.t2WinsDec);
            break;
        case UI_TEST_BUTTON_RIGHT_WINS_INC_ID + playerId:
            setHudWinCountersForAllPlayers(State.match.winsT1, State.match.winsT2 + 1);
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.t2WinsInc);
            break;

        case UI_TEST_BUTTON_LEFT_KILLS_DEC_ID + playerId:
            State.scores.t1TotalKills = Math.max(0, State.scores.t1TotalKills - 1);
            syncKillsHudFromTrackedTotals(true);
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.t1TotalKillsDec);
            break;
        case UI_TEST_BUTTON_LEFT_KILLS_INC_ID + playerId:
            State.scores.t1TotalKills = State.scores.t1TotalKills + 1;
            syncKillsHudFromTrackedTotals(true);
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.t1TotalKillsInc);
            break;

        case UI_TEST_BUTTON_RIGHT_KILLS_DEC_ID + playerId:
            State.scores.t2TotalKills = Math.max(0, State.scores.t2TotalKills - 1);
            syncKillsHudFromTrackedTotals(true);
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.t2TotalKillsDec);
            break;
        case UI_TEST_BUTTON_RIGHT_KILLS_INC_ID + playerId:
            State.scores.t2TotalKills = State.scores.t2TotalKills + 1;
            syncKillsHudFromTrackedTotals(true);
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.t2TotalKillsInc);
            break;

        case UI_ADMIN_BUTTON_T1_ROUND_KILLS_DEC_ID + playerId:
            State.scores.t1RoundKills = Math.max(0, State.scores.t1RoundKills - 1);
            syncRoundKillsHud(true);
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.t1RoundKillsDec);
            break;
        case UI_ADMIN_BUTTON_T1_ROUND_KILLS_INC_ID + playerId:
            State.scores.t1RoundKills = State.scores.t1RoundKills + 1;
            syncRoundKillsHud(true);
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.t1RoundKillsInc);
            break;

        case UI_ADMIN_BUTTON_T2_ROUND_KILLS_DEC_ID + playerId:
            State.scores.t2RoundKills = Math.max(0, State.scores.t2RoundKills - 1);
            syncRoundKillsHud(true);
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.t2RoundKillsDec);
            break;
        case UI_ADMIN_BUTTON_T2_ROUND_KILLS_INC_ID + playerId:
            State.scores.t2RoundKills = State.scores.t2RoundKills + 1;
            syncRoundKillsHud(true);
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.t2RoundKillsInc);
            break;

        case UI_TEST_BUTTON_ROUND_KILLS_TARGET_DEC_ID + playerId:
            State.round.killsTarget = Math.max(1, State.round.killsTarget - 1);
            // Refresh HUD help text ("First to X Kills") immediately when target kills changes in the Admin Panel.
            setRoundStateTextForAllPlayers();
            syncRoundKillsTargetTesterValueForAllPlayers();
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.targetRoundKillsDec);
            break;
        case UI_TEST_BUTTON_ROUND_KILLS_TARGET_INC_ID + playerId:
            // NOTE: Admin-panel target-kills adjustments must refresh the HUD help text immediately.
            State.round.killsTarget = State.round.killsTarget + 1;
            // Refresh HUD help text ("First to X Kills") immediately when target kills changes in the Admin Panel.
            setRoundStateTextForAllPlayers();
            syncRoundKillsTargetTesterValueForAllPlayers();
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.targetRoundKillsInc);
            break;

        case UI_TEST_BUTTON_TIES_DEC_ID + playerId:
            adjustMatchTiesForBothTeams(-1);
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.tiesDec);
            break;
        case UI_TEST_BUTTON_TIES_INC_ID + playerId:
            adjustMatchTiesForBothTeams(1);
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.tiesInc);
            break;

        case UI_TEST_BUTTON_CUR_ROUND_DEC_ID + playerId:
            setHudRoundCountersForAllPlayers(Math.max(0, State.round.current - 1), State.round.max);
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.currentRoundDec);
            break;
        case UI_TEST_BUTTON_CUR_ROUND_INC_ID + playerId:
            setHudRoundCountersForAllPlayers(State.round.current + 1, State.round.max);
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.currentRoundInc);
            break;

        case UI_TEST_BUTTON_CLOCK_TIME_DEC_ID + playerId:
            adjustRoundClockBySeconds(-60);
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.clockTimeDec);
            break;
        case UI_TEST_BUTTON_CLOCK_TIME_INC_ID + playerId:
            if (!State.round.clock.isPaused && getRemainingSeconds() < 0) {
                ResetRoundClock(60);
            } else {
                adjustRoundClockBySeconds(60);
            }
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.clockTimeInc);
            break;

        case UI_TEST_BUTTON_CLOCK_RESET_ID + playerId:
            resetRoundClockToDefault();
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.clockReset);
            break;

        case UI_TEST_BUTTON_ROUND_START_ID + playerId:
            startPregameCountdown(eventPlayer, true); //old: startRound(eventPlayer);
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.roundStart);
            break;
        case UI_TEST_BUTTON_ROUND_END_ID + playerId:
            endRound(eventPlayer);
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.roundEnd);
            break;


        default:
            break;
    }
}

//#endregion ----------------- Tester Button Events --------------------



//#region -------------------- Ready Dialog (Roster UI) -  (layout + population only) --------------------

// Builds the entire Team Switch + Admin Panel dialog.
// Responsibilities:
// - Creates left team, right team, and admin panel UI sections
// - Defines layout constants and row math for the admin panel
// - Wires all admin buttons to authoritative match state mutations
// - Ensures per-player UI roots are created once and reused

// Populates the roster UI for the given viewer. 
// - Real active player lists + team assignment
// - Default status values (NOT READY / IN MAIN BASE) for all rows
// Later phases will replace defaults with authoritative per-player state + gating + round integration.

// Applies per-row color policy for the Ready dialog:
// - Player name: white by default; green only when BOTH ready AND in main base.
// - READY / IN MAIN BASE: green
// - NOT READY / NOT IN MAIN BASE: red
function applyReadyDialogRowColors(nameWidget: mod.UIWidget | undefined, readyWidget: mod.UIWidget | undefined, baseWidget: mod.UIWidget | undefined, isReady: boolean, isInBase: boolean): void {
    if (readyWidget) mod.SetUITextColor(readyWidget, isReady ? COLOR_READY_GREEN : COLOR_NOT_READY_RED);
    if (baseWidget) mod.SetUITextColor(baseWidget, isInBase ? COLOR_READY_GREEN : COLOR_NOT_READY_RED);
    if (nameWidget) mod.SetUITextColor(nameWidget, (isReady && isInBase) ? COLOR_READY_GREEN : COLOR_NORMAL);
}

// Renders the entire Ready Up dialog state for a single viewer.
// Centralizing UI updates reduces refresh regressions as the dialog grows in complexity.
function renderReadyDialogForViewer(eventPlayer: mod.Player, viewerPid: number): void {
    refreshReadyDialogRosterForViewer(eventPlayer, viewerPid);
    updateReadyToggleButtonForViewer(eventPlayer, viewerPid);

}

// Renders the dialog for all players who currently have it open.
// Code Cleanup: Overlaps with refreshReadyDialogForAllVisibleViewers; consider consolidating to one entrypoint.
/**
 * Broadcast-style refresh for the ready dialog.
 * Call whenever roster membership or per-player display state changes (ready / in-main-base / team).
 */
function renderReadyDialogForAllVisibleViewers(): void {
    for (const pidStr in State.players.teamSwitchData) {
        const pid = Number(pidStr);
        const state = State.players.teamSwitchData[pid];
        if (!state || !state.dialogVisible) continue;
        const viewer = safeFindPlayer(pid);
        if (!viewer) continue;
        renderReadyDialogForViewer(viewer, pid);
    }
}

function refreshReadyDialogRosterForViewer(viewer: mod.Player, viewerPlayerId: number): void {
    const active = getActivePlayers();
    const t1Players: mod.Player[] = active.team1;
    const t2Players: mod.Player[] = active.team2;

    const maxRowsPerTeam = 16;
    const emptyMsg = mod.Message(mod.stringkeys.twl.system.genericCounter, "");
    for (let row = 0; row < maxRowsPerTeam; row++) {
        const t1NameId = UI_READY_DIALOG_T1_ROW_NAME_ID + viewerPlayerId + "_" + row;
        const t1ReadyId = UI_READY_DIALOG_T1_ROW_READY_ID + viewerPlayerId + "_" + row;
        const t1BaseId = UI_READY_DIALOG_T1_ROW_BASE_ID + viewerPlayerId + "_" + row;

        const t2NameId = UI_READY_DIALOG_T2_ROW_NAME_ID + viewerPlayerId + "_" + row;
        const t2ReadyId = UI_READY_DIALOG_T2_ROW_READY_ID + viewerPlayerId + "_" + row;
        const t2BaseId = UI_READY_DIALOG_T2_ROW_BASE_ID + viewerPlayerId + "_" + row;

        const t1Name = mod.FindUIWidgetWithName(t1NameId, mod.GetUIRoot());
        const t1Ready = mod.FindUIWidgetWithName(t1ReadyId, mod.GetUIRoot());
        const t1Base = mod.FindUIWidgetWithName(t1BaseId, mod.GetUIRoot());

        const t2Name = mod.FindUIWidgetWithName(t2NameId, mod.GetUIRoot());
        const t2Ready = mod.FindUIWidgetWithName(t2ReadyId, mod.GetUIRoot());
        const t2Base = mod.FindUIWidgetWithName(t2BaseId, mod.GetUIRoot());

        const p1 = (row < t1Players.length) ? t1Players[row] : undefined;
        const p2 = (row < t2Players.length) ? t2Players[row] : undefined;

        // Hide unused placeholder rows (prevents 'unknown string' artifacts and reduces visual noise).
        const hasP1 = !!p1;
        const hasP2 = !!p2;
        if (t1Name) mod.SetUIWidgetVisible(t1Name, hasP1);
        if (t1Ready) mod.SetUIWidgetVisible(t1Ready, hasP1);
        if (t1Base) mod.SetUIWidgetVisible(t1Base, hasP1);
        if (t2Name) mod.SetUIWidgetVisible(t2Name, hasP2);
        if (t2Ready) mod.SetUIWidgetVisible(t2Ready, hasP2);
        if (t2Base) mod.SetUIWidgetVisible(t2Base, hasP2);

        mod.SetUITextLabel(t1Name, p1 ? mod.Message(mod.stringkeys.twl.readyDialog.playerNameFormat, p1) : emptyMsg);
        mod.SetUITextLabel(t1Ready, p1 ? (State.players.readyByPid[mod.GetObjId(p1)] ? mod.Message(mod.stringkeys.twl.readyDialog.status.ready) : mod.Message(mod.stringkeys.twl.readyDialog.status.notReady)) : emptyMsg);
        mod.SetUITextLabel(t1Base, p1 ? ((State.players.inMainBaseByPid[mod.GetObjId(p1)] !== undefined ? State.players.inMainBaseByPid[mod.GetObjId(p1)] : true) ? mod.Message(mod.stringkeys.twl.readyDialog.baseStatus.in) : mod.Message(mod.stringkeys.twl.readyDialog.baseStatus.out)) : emptyMsg);
        if (p1) {
            const p1Id = mod.GetObjId(p1);
            const p1Ready = !!State.players.readyByPid[p1Id];
            const p1InBase = !!State.players.inMainBaseByPid[p1Id];
            applyReadyDialogRowColors(t1Name, t1Ready, t1Base, p1Ready, p1InBase);
        } else {
            // Empty row: default to white for any placeholder text.
            if (t1Name) mod.SetUITextColor(t1Name, COLOR_NORMAL);
            if (t1Ready) mod.SetUITextColor(t1Ready, COLOR_NORMAL);
            if (t1Base) mod.SetUITextColor(t1Base, COLOR_NORMAL);
        }

        mod.SetUITextLabel(t2Name, p2 ? mod.Message(mod.stringkeys.twl.readyDialog.playerNameFormat, p2) : emptyMsg);
        mod.SetUITextLabel(t2Ready, p2 ? (State.players.readyByPid[mod.GetObjId(p2)] ? mod.Message(mod.stringkeys.twl.readyDialog.status.ready) : mod.Message(mod.stringkeys.twl.readyDialog.status.notReady)) : emptyMsg);
        mod.SetUITextLabel(t2Base, p2 ? ((State.players.inMainBaseByPid[mod.GetObjId(p2)] !== undefined ? State.players.inMainBaseByPid[mod.GetObjId(p2)] : true) ? mod.Message(mod.stringkeys.twl.readyDialog.baseStatus.in) : mod.Message(mod.stringkeys.twl.readyDialog.baseStatus.out)) : emptyMsg);
        if (p2) {
            const p2Id = mod.GetObjId(p2);
            const p2Ready = !!State.players.readyByPid[p2Id];
            const p2InBase = !!State.players.inMainBaseByPid[p2Id];
            applyReadyDialogRowColors(t2Name, t2Ready, t2Base, p2Ready, p2InBase);
        } else {
            if (t2Name) mod.SetUITextColor(t2Name, COLOR_NORMAL);
            if (t2Ready) mod.SetUITextColor(t2Ready, COLOR_NORMAL);
            if (t2Base) mod.SetUITextColor(t2Base, COLOR_NORMAL);
        }
    }
}

// Updates the Ready toggle button label for the given viewer based on that viewer's current ready state.
function updateReadyToggleButtonForViewer(viewer: mod.Player, viewerPlayerId: number): void {
    const btnLabelId = UI_READY_DIALOG_BUTTON_READY_LABEL_ID + viewerPlayerId;
    const labelWidget = mod.FindUIWidgetWithName(btnLabelId, mod.GetUIRoot());
    if (!labelWidget) return;

    const isReady = !!State.players.readyByPid[viewerPlayerId];
    const labelMsg = isReady
        ? mod.Message(mod.stringkeys.twl.readyDialog.buttons.notReady)
        : mod.Message(mod.stringkeys.twl.readyDialog.buttons.ready);

    mod.SetUITextLabel(labelWidget, labelMsg);
}

// Updates the Ready Up dialog "Best of {0} Rounds" label for a single viewer.
function updateBestOfRoundsLabelForPid(pid: number): void {
    const labelId = UI_READY_DIALOG_BESTOF_LABEL_ID + pid;
    const labelWidget = safeFind(labelId);
    if (!labelWidget) return;
    mod.SetUITextLabel(labelWidget, mod.Message(mod.stringkeys.twl.readyDialog.bestOfLabel, Math.floor(State.round.max)));
}

function updateBestOfRoundsLabelForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        updateBestOfRoundsLabelForPid(mod.GetObjId(p));
    }
}

// Refreshes the roster UI for every player who currently has the dialog open.
// Phase 3 uses this to reflect main-base state changes live without requiring users to reopen the dialog.
function refreshReadyDialogForAllVisibleViewers(): void {
    const viewers = mod.AllPlayers();
    const viewerCount = mod.CountOf(viewers);
    for (let i = 0; i < viewerCount; i++) {
        const viewer = mod.ValueInArray(viewers, i) as mod.Player;
        const vid = mod.GetObjId(viewer);
        if (State.players.teamSwitchData[vid] && State.players.teamSwitchData[vid].dialogVisible) {
            refreshReadyDialogRosterForViewer(viewer, vid);
            updateReadyToggleButtonForViewer(viewer, vid);
        }
    }
}

//#endregion ----------------- Ready Dialog (Roster UI) -  (layout + population only) --------------------



//#region -------------------- Ready Dialog (Ready-cycle auto-start / reset:) - All-Ready Auto-Start + Round Reset --------------------

// Resets all players to NOT READY. Called when a round ends (including match-end paths) so the next round requires a fresh ready-up cycle.
function resetReadyStateForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        const pid = mod.GetObjId(p);
        State.players.readyByPid[pid] = false;
        // Keep the HUD "X / Y PLAYERS READY" line in sync on every ready-state change.
        updatePlayersReadyHudTextForAllPlayers();
    }
    // If any dialogs are open, reflect the reset immediately.
    renderReadyDialogForAllVisibleViewers();
    updatePlayersReadyHudTextForAllPlayers();
}

// Returns true when every active player on Team 1/2 is currently READY.

// -----------------------------------------------------------------------------
// Active Player Resolution
// -----------------------------------------------------------------------------
// Single source of truth for who counts as an "active" player across:
//   - roster population (Ready Up UI)
//   - all-ready checks / auto-start gating
//   - any future round gating logic
//
// Definition (low-risk, conservative):
//   - Must be present in mod.AllPlayers() (avoids stale/disconnected pids)
//   - Must be valid (mod.IsPlayerValid)
//   - Must be assigned to TeamID.Team1 or TeamID.Team2 (spectators/neutral excluded)
//
// Note: We intentionally do NOT filter by "deployed" state here. Some APIs expose deployment state,
// but this codebase does not currently have a typed/portable check. Treating undeployed teammates as
// active is safer for readiness gating and avoids edge-case mismatches during team switching.
type ActivePlayers_t = {
    all: mod.Player[];
    team1: mod.Player[];
    team2: mod.Player[];
};

/**
 * Active-player definition (single source of truth).
 * Used by: roster population, all-ready checks, round start gating, and the HUD ready-count line.
 * Notes: excludes undeployed/neutral/stale players by reading current engine team state each call; do not cache long-term.
 */
function getActivePlayers(): ActivePlayers_t {
    const all: mod.Player[] = [];
    const team1: mod.Player[] = [];
    const team2: mod.Player[] = [];

    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const teamNum = getTeamNumber(mod.GetTeam(p));
        if (teamNum !== TeamID.Team1 && teamNum !== TeamID.Team2) continue;

        all.push(p);
        if (teamNum === TeamID.Team1) team1.push(p);
        else team2.push(p);
    }

    // Stable UI ordering: sort by pid (object id).
    // This prevents rows from shuffling across refreshes.
    const byPid = (a: mod.Player, b: mod.Player) => mod.GetObjId(a) - mod.GetObjId(b);
    all.sort(byPid);
    team1.sort(byPid);
    team2.sort(byPid);

    return { all, team1, team2 };
}

function areAllActivePlayersReady(): boolean {
    const active = getActivePlayers();
    const activeCount = active.all.length;
    if (activeCount < AUTO_START_MIN_ACTIVE_PLAYERS) {
        if (activeCount !== 0) return false;

        // Fallback: if no Team 1/2 players are assigned yet (team 0 pre-deploy),
        // allow the ready check to use all valid players.
        const players = mod.AllPlayers();
        const count = mod.CountOf(players);
        let validCount = 0;
        for (let i = 0; i < count; i++) {
            const p = mod.ValueInArray(players, i) as mod.Player;
            if (!p || !mod.IsPlayerValid(p)) continue;
            const pid = mod.GetObjId(p);
            if (!State.players.readyByPid[pid]) return false;
            validCount++;
        }
        return validCount >= AUTO_START_MIN_ACTIVE_PLAYERS;
    }

    for (const p of active.all) {
        const pid = mod.GetObjId(p);
        if (!State.players.readyByPid[pid]) return false;
    }
    return true;
}

// Implements a synchronized pre-round 10-1-GO! countdown that starts the round on GO.
interface CountdownWidgetCacheEntry {
    rootName: string;
    widget?: mod.UIWidget;
}



function ensureCountdownUIAndGetWidget(player: mod.Player): mod.UIWidget | undefined {
    const pid = mod.GetObjId(player);
    const rootName = "PregameCountdownText_" + pid;

    const cached = State.hudCache.countdownWidgetCache[pid];
    if (cached) {
        if (cached.widget) return cached.widget;

        const found = safeFind(cached.rootName);
        if (found) {
            cached.widget = found;
            return found;
        }
    }

    modlib.ParseUI({
        name: rootName,
        type: "Text",
        playerId: player,
        position: [0, 0],
        size: [320, 140],
        anchor: mod.UIAnchor.Center,
        visible: false,
        padding: 0,
        bgColor: [0, 0, 0],
        bgAlpha: 0,
        bgFill: mod.UIBgFill.Solid,
        textLabel: mod.Message(mod.stringkeys.twl.countdown.format, PREGAME_COUNTDOWN_START_NUMBER),
        textColor: [1, 1, 1],
        textAlpha: PREGAME_ALERT_TEXT_ALPHA,
        textSize: PREGAME_COUNTDOWN_SIZE_DIGIT_START,
        textAnchor: mod.UIAnchor.Center,
    });

    const widget = safeFind(rootName);
    State.hudCache.countdownWidgetCache[pid] = { rootName, widget };
    return widget;
}

function setPregameCountdownVisualForAllPlayers(
    labelKey: number,
    labelValue: number | undefined,
    color: mod.Vector,
    size: number,
    visible: boolean
): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        const w = ensureCountdownUIAndGetWidget(p);
        if (!w) continue;

        mod.SetUIWidgetVisible(w, visible);
        if (visible) {
            const message = (labelValue !== undefined)
                ? mod.Message(labelKey, labelValue)
                : mod.Message(labelKey);
            mod.SetUITextLabel(w, message);
            mod.SetUITextColor(w, color);
            mod.SetUITextSize(w, size);
        }
    }
}

function setPregameCountdownSizeForAllPlayers(size: number): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        const w = ensureCountdownUIAndGetWidget(p);
        if (!w) continue;
        mod.SetUITextSize(w, size);
    }
}

function hidePregameCountdownForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        const w = ensureCountdownUIAndGetWidget(p);
        if (!w) continue;
        mod.SetUIWidgetVisible(w, false);
    }
}

function ensureOverLineTitleUIAndGetWidget(player: mod.Player): mod.UIWidget | undefined {
    const pid = mod.GetObjId(player);
    const rootName = OVER_LINE_TITLE_ID + pid;

    const cached = State.hudCache.overLineTitleWidgetCache[pid];
    if (cached) {
        if (cached.widget) return cached.widget;

        const found = safeFind(cached.rootName);
        if (found) {
            cached.widget = found;
            return found;
        }
    }

    modlib.ParseUI({
        name: rootName,
        type: "Text",
        playerId: player,
        position: [0, 0],
        size: [2500, 200],
        anchor: mod.UIAnchor.Center,
        visible: false,
        padding: 0,
        bgColor: [0, 0, 0],
        bgAlpha: 0,
        bgFill: mod.UIBgFill.None,
        textLabel: mod.Message(mod.stringkeys.twl.overLine.title, player),
        textColor: [1, 0, 0],
        textAlpha: PREGAME_ALERT_TEXT_ALPHA,
        textSize: OVER_LINE_TITLE_SIZE,
        textAnchor: mod.UIAnchor.Center,
    });

    const widget = safeFind(rootName);
    State.hudCache.overLineTitleWidgetCache[pid] = { rootName, widget };
    return widget;
}

function ensureOverLineSubtitleUIAndGetWidget(player: mod.Player): mod.UIWidget | undefined {
    const pid = mod.GetObjId(player);
    const rootName = OVER_LINE_SUBTITLE_ID + pid;

    const cached = State.hudCache.overLineSubtitleWidgetCache[pid];
    if (cached) {
        if (cached.widget) return cached.widget;

        const found = safeFind(cached.rootName);
        if (found) {
            cached.widget = found;
            return found;
        }
    }

    modlib.ParseUI({
        name: rootName,
        type: "Text",
        playerId: player,
        position: [0, OVER_LINE_SUBTITLE_OFFSET_Y],
        size: [2500, 80],
        anchor: mod.UIAnchor.Center,
        visible: false,
        padding: 0,
        bgColor: [0, 0, 0],
        bgAlpha: 0,
        bgFill: mod.UIBgFill.None,
        textLabel: mod.Message(mod.stringkeys.twl.overLine.subtitle, player),
        textColor: [1, 1, 0],
        textAlpha: PREGAME_ALERT_TEXT_ALPHA,
        textSize: OVER_LINE_SUBTITLE_SIZE,
        textAnchor: mod.UIAnchor.Center,
    });

    const widget = safeFind(rootName);
    State.hudCache.overLineSubtitleWidgetCache[pid] = { rootName, widget };
    return widget;
}

function cancelPregameCountdown(): void {
    if (!State.round.countdown.isActive) return;
    State.round.countdown.token++;
    State.round.countdown.isActive = false;
    hidePregameCountdownForAllPlayers();
}

function deleteOverLineMessageForPlayer(pid: number): void {
    const title = safeFind(OVER_LINE_TITLE_ID + pid);
    if (title) mod.SetUIWidgetVisible(title, false);

    const subtitle = safeFind(OVER_LINE_SUBTITLE_ID + pid);
    if (subtitle) mod.SetUIWidgetVisible(subtitle, false);
}

async function showOverLineMessageForAllPlayers(offender: mod.Player): Promise<void> {
    State.round.countdown.overLineMessageToken = (State.round.countdown.overLineMessageToken + 1) % 1000000000;
    const expectedToken = State.round.countdown.overLineMessageToken;

    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const pid = mod.GetObjId(p);

        deleteOverLineMessageForPlayer(pid);

        const title = ensureOverLineTitleUIAndGetWidget(p);
        if (title) {
            mod.SetUITextLabel(title, mod.Message(mod.stringkeys.twl.overLine.title, offender));
            mod.SetUITextColor(title, COLOR_NOT_READY_RED);
            mod.SetUITextSize(title, OVER_LINE_TITLE_SIZE);
            mod.SetUIWidgetVisible(title, true);
        }

        const subtitle = ensureOverLineSubtitleUIAndGetWidget(p);
        if (subtitle) {
            mod.SetUITextLabel(subtitle, mod.Message(mod.stringkeys.twl.overLine.subtitle, offender));
            mod.SetUITextColor(subtitle, COLOR_WARNING_YELLOW);
            mod.SetUITextSize(subtitle, OVER_LINE_SUBTITLE_SIZE);
            mod.SetUIWidgetVisible(subtitle, true);
        }
    }

    await mod.Wait(OVER_LINE_MESSAGE_DURATION_SECONDS);
    if (expectedToken !== State.round.countdown.overLineMessageToken) return;

    const remaining = mod.AllPlayers();
    const remainingCount = mod.CountOf(remaining);
    for (let i = 0; i < remainingCount; i++) {
        const p = mod.ValueInArray(remaining, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        deleteOverLineMessageForPlayer(mod.GetObjId(p));
    }
}

function startPregameCountdown(triggerPlayer?: mod.Player, force?: boolean): void {
    if (State.round.countdown.isActive) return;
    if (State.match.isEnded || isRoundLive()) return;
    if (!force && !areAllActivePlayersReady()) return;

    closeReadyDialogForAllPlayers();
    State.round.countdown.isActive = true;
    State.round.countdown.isRequested = true;
    State.round.countdown.token++;
    const expectedToken = State.round.countdown.token;

    void runPregameCountdown(expectedToken, triggerPlayer, force === true);
}

function isPregameCountdownStillValid(expectedToken: number, force?: boolean, allowRoundActive?: boolean): boolean {
    if (expectedToken !== State.round.countdown.token) return false;
    if (State.match.isEnded) return false;
    if (!allowRoundActive && isRoundLive()) return false;
    if (!force && !areAllActivePlayersReady()) return false;
    return true;
}

function getPregameCountdownColor(value: number): mod.Vector {
    return value === 1 ? mod.CreateVector(1, 1, 0) : mod.CreateVector(1, 0, 0);
}

async function animatePregameCountdownSize(
    expectedToken: number,
    force: boolean,
    startSize: number,
    endSize: number,
    allowRoundActive?: boolean
): Promise<boolean> {
    const stepSeconds = PREGAME_COUNTDOWN_STEP_SECONDS / PREGAME_COUNTDOWN_ANIMATION_STEPS;
    for (let i = 1; i <= PREGAME_COUNTDOWN_ANIMATION_STEPS; i++) {
        await mod.Wait(stepSeconds);
        if (!isPregameCountdownStillValid(expectedToken, force, allowRoundActive)) return false;
        const t = i / PREGAME_COUNTDOWN_ANIMATION_STEPS;
        const size = Math.max(1, Math.floor(startSize + (endSize - startSize) * t));
        setPregameCountdownSizeForAllPlayers(size);
    }
    return true;
}

async function runPregameCountdown(expectedToken: number, triggerPlayer?: mod.Player, force?: boolean): Promise<void> {
    await mod.Wait(PREGAME_COUNTDOWN_INITIAL_DELAY_SECONDS);

    if (!isPregameCountdownStillValid(expectedToken, force)) {
        State.round.countdown.isActive = false;
        hidePregameCountdownForAllPlayers();
        return;
    }

    for (let value = PREGAME_COUNTDOWN_START_NUMBER; value >= 1; value--) {
        if (!isPregameCountdownStillValid(expectedToken, force)) {
            State.round.countdown.isActive = false;
            hidePregameCountdownForAllPlayers();
            return;
        }

        setPregameCountdownVisualForAllPlayers(
            mod.stringkeys.twl.countdown.format,
            value,
            getPregameCountdownColor(value),
            PREGAME_COUNTDOWN_SIZE_DIGIT_START,
            true
        );

        const ok = await animatePregameCountdownSize(
            expectedToken,
            force === true,
            PREGAME_COUNTDOWN_SIZE_DIGIT_START,
            PREGAME_COUNTDOWN_SIZE_DIGIT_END
        );
        if (!ok) {
            State.round.countdown.isActive = false;
            hidePregameCountdownForAllPlayers();
            return;
        }
    }

    if (!isPregameCountdownStillValid(expectedToken, force)) {
        State.round.countdown.isActive = false;
        hidePregameCountdownForAllPlayers();
        return;
    }

    setPregameCountdownVisualForAllPlayers(
        mod.stringkeys.twl.countdown.go,
        undefined,
        mod.CreateVector(0, 1, 0),
        PREGAME_COUNTDOWN_SIZE_GO_START,
        true
    );
    startRound(triggerPlayer);

    const ok = await animatePregameCountdownSize(
        expectedToken,
        force === true,
        PREGAME_COUNTDOWN_SIZE_GO_START,
        PREGAME_COUNTDOWN_SIZE_GO_END,
        true
    );
    if (!ok || expectedToken !== State.round.countdown.token) {
        // If the animation aborted, hide immediately to avoid a stuck GO.
        if (expectedToken === State.round.countdown.token) {
            hidePregameCountdownForAllPlayers();
            State.round.countdown.isActive = false;
        }
        return;
    }

    // Keep GO visible for a short hold to finish the visual beat (unpredictable repro issues).
    if (State.match.isEnded) {
        hidePregameCountdownForAllPlayers();
        State.round.countdown.isActive = false;
        return;
    }

    await mod.Wait(PREGAME_COUNTDOWN_GO_HOLD_SECONDS);
    if (expectedToken !== State.round.countdown.token) return;

    hidePregameCountdownForAllPlayers();
    State.round.countdown.isActive = false;
}

// Starts the round as soon as all active players are READY.
// Notes:
// - Only triggers when round is NOT active and match is NOT ended.
// - Uses the existing startRound() flow; we do not bypass or reimplement round init logic.
function tryAutoStartRoundIfAllReady(triggerPlayer?: mod.Player): void {
    if (State.match.isEnded || isRoundLive()) return;
    if (!areAllActivePlayersReady()) return;
    // All players ready: start the round using the existing function.
    startPregameCountdown(triggerPlayer); //old: startRound(triggerPlayer);
}

//#endregion ----------------- Ready Dialog (Ready-cycle auto-start / reset:) - All-Ready Auto-Start + Round Reset --------------------



//#region -------------------- Ready Dialog (Swap Teams button:) - Swap Teams Button (single toggle) --------------------

// Swaps the given player between Team 1 and Team 2. This reuses the existing team-assignment APIs,
// but exposes them as a single toggle button rather than separate Team 1 / Team 2 buttons.
function swapPlayerTeam(eventPlayer: mod.Player): void {
    // Swap Teams button:: single-button team toggle (Team 1 <-> Team 2).
    // IMPORTANT: This must reapply the legacy behavior from the old Team 1 / Team 2 buttons:
    // - Apply the team assignment change
    // - Undeploy (forces redeploy) so the player actually respawns on the new team
    // - Close the dialog and broadcast the team-switch message
    // We achieve that by reusing the retained processTeamSwitch() pathway.
    const pid = mod.GetObjId(eventPlayer);
    // Swapping teams must always force the player back to NOT READY.
    // This prevents a player from carrying READY status across team assignment changes.
    State.players.readyByPid[pid] = false;
    // Keep the HUD "X / Y PLAYERS READY" line in sync on every ready-state change.
    updatePlayersReadyHudTextForAllPlayers();
    updateHelpTextVisibilityForPid(pid);

    processTeamSwitch(eventPlayer);

    // If other viewers have the ready dialog open, refresh their rosters so this player moves columns immediately.
    renderReadyDialogForAllVisibleViewers();
}

//#endregion ----------------- Ready Dialog (Swap Teams button:) - Swap Teams Button (single toggle) --------------------



//#region -------------------- UI - Ready Up Dialog (construction) --------------------

// Ensures the Admin Panel toggle button + container exist for this player and are shown/hidden correctly.
// Required for UI caching: we hide these widgets on dialog close (not delete), so reopen can simply re-show them.

// Some UI implementations do not cascade visibility from a container to its children.
// To avoid "ghost" admin widgets appearing when the panel is hidden, we explicitly toggle all admin/tester widgets.
function setAdminPanelChildWidgetsVisible(playerId: number, visible: boolean): void {
    const ids: string[] = [
        // Admin/tester header + row labels
        UI_TEST_HEADER_LABEL_ID,
        UI_TEST_LABEL_LEFT_WINS_ID,
        UI_TEST_LABEL_RIGHT_WINS_ID,
        UI_TEST_LABEL_LEFT_KILLS_ID,
        UI_TEST_LABEL_RIGHT_KILLS_ID,
        UI_TEST_LABEL_ROUND_KILLS_TARGET_ID,
        UI_TEST_VALUE_ROUND_KILLS_TARGET_ID,
        UI_TEST_LABEL_TIES_ID,
        UI_TEST_LABEL_CUR_ROUND_ID,
        UI_TEST_LABEL_CLOCK_TIME_ID,
        UI_ADMIN_LABEL_T1_ROUND_KILLS_ID,
        UI_ADMIN_LABEL_T2_ROUND_KILLS_ID,

        // Row +/- buttons
        UI_TEST_BUTTON_LEFT_WINS_DEC_ID, UI_TEST_BUTTON_LEFT_WINS_INC_ID,
        UI_TEST_BUTTON_RIGHT_WINS_DEC_ID, UI_TEST_BUTTON_RIGHT_WINS_INC_ID,
        UI_TEST_BUTTON_LEFT_KILLS_DEC_ID, UI_TEST_BUTTON_LEFT_KILLS_INC_ID,
        UI_TEST_BUTTON_RIGHT_KILLS_DEC_ID, UI_TEST_BUTTON_RIGHT_KILLS_INC_ID,
        UI_TEST_BUTTON_ROUND_KILLS_TARGET_DEC_ID, UI_TEST_BUTTON_ROUND_KILLS_TARGET_INC_ID,
        UI_ADMIN_BUTTON_T1_ROUND_KILLS_DEC_ID, UI_ADMIN_BUTTON_T1_ROUND_KILLS_INC_ID,
        UI_ADMIN_BUTTON_T2_ROUND_KILLS_DEC_ID, UI_ADMIN_BUTTON_T2_ROUND_KILLS_INC_ID,
        UI_TEST_BUTTON_TIES_DEC_ID, UI_TEST_BUTTON_TIES_INC_ID,
        UI_TEST_BUTTON_CUR_ROUND_DEC_ID, UI_TEST_BUTTON_CUR_ROUND_INC_ID,
        UI_TEST_BUTTON_CLOCK_TIME_DEC_ID, UI_TEST_BUTTON_CLOCK_TIME_INC_ID,

        // +/- text overlays
        UI_TEST_MINUS_TEXT_ID,
        UI_TEST_PLUS_TEXT_ID,

        // Bottom admin buttons
        UI_TEST_BUTTON_CLOCK_RESET_ID, UI_TEST_RESET_TEXT_ID,
        UI_TEST_BUTTON_ROUND_START_ID, UI_TEST_ROUND_START_TEXT_ID,
        UI_TEST_BUTTON_ROUND_END_ID, UI_TEST_ROUND_END_TEXT_ID,
    ];

    for (const baseId of ids) {
        const w = safeFind(baseId + playerId);
        if (w) mod.SetUIWidgetVisible(w, visible);
    }
}

// Admin Panel lifecycle helper.
// We DO NOT cache the admin panel contents because some engines do not reliably hide container children.
// Instead, we delete the panel container + all children whenever it is closed, and rebuild on-demand.
function deleteAdminPanelUI(playerId: number, deleteToggle: boolean): void {
    // Hide child widgets first (covers any stray children that may have detached from the container).
    setAdminPanelChildWidgetsVisible(playerId, false);

    const adminContainer = safeFind(UI_ADMIN_PANEL_CONTAINER_ID + playerId);
    if (adminContainer) mod.DeleteUIWidget(adminContainer);

    if (deleteToggle) {
        const adminToggle = safeFind(UI_ADMIN_PANEL_BUTTON_ID + playerId);
        if (adminToggle) mod.DeleteUIWidget(adminToggle);
        const adminToggleLabel = safeFind(UI_ADMIN_PANEL_BUTTON_LABEL_ID + playerId);
        if (adminToggleLabel) mod.DeleteUIWidget(adminToggleLabel);
    }
}

function ensureAdminPanelWidgets(eventPlayer: mod.Player, playerId: number): void {
    const ADMIN_TOGGLE_BUTTON_ID = UI_ADMIN_PANEL_BUTTON_ID + playerId;
    const ADMIN_TOGGLE_LABEL_ID = UI_ADMIN_PANEL_BUTTON_LABEL_ID + playerId;
    const ADMIN_CONTAINER_ID = UI_ADMIN_PANEL_CONTAINER_ID + playerId;

    // Create toggle button if missing.
    let toggleBtn = safeFind(ADMIN_TOGGLE_BUTTON_ID);
    if (!toggleBtn) {
        mod.AddUIButton(
            ADMIN_TOGGLE_BUTTON_ID,
            mod.CreateVector(-10, 10, 0),
            mod.CreateVector(120, 32, 0),
            mod.UIAnchor.TopRight,
            eventPlayer
        );
        toggleBtn = mod.FindUIWidgetWithName(ADMIN_TOGGLE_BUTTON_ID, mod.GetUIRoot());
        mod.SetUIButtonAlphaBase(toggleBtn, 0.3);
    }

    // Create label if missing (some UI systems create this implicitly; keep safeFind anyway).
    let toggleLabel = safeFind(ADMIN_TOGGLE_LABEL_ID);
    if (!toggleLabel) {
        mod.AddUIText(
            ADMIN_TOGGLE_LABEL_ID,
            mod.CreateVector(-10, 10, 0),
            mod.CreateVector(120, 32, 0),
            mod.UIAnchor.TopRight,
            mod.Message(mod.stringkeys.twl.adminPanel.buttons.panel),
            eventPlayer
        );
        toggleLabel = mod.FindUIWidgetWithName(ADMIN_TOGGLE_LABEL_ID, mod.GetUIRoot());
        mod.SetUIWidgetBgAlpha(toggleLabel, 0);
        mod.SetUITextSize(toggleLabel, 12);
        mod.SetUITextColor(toggleLabel, mod.CreateVector(1, 1, 1));
    }

    // Create admin container if missing.
    let adminContainer = safeFind(ADMIN_CONTAINER_ID);
    if (!adminContainer) {
        mod.AddUIContainer(
            ADMIN_CONTAINER_ID,
            mod.CreateVector(-10, 46, 0),
            mod.CreateVector(330, 580, 0),
            mod.UIAnchor.TopRight,
            mod.GetUIRoot(),
            false,
            10,
            mod.CreateVector(0, 0, 0),
            0.8,
            mod.UIBgFill.Blur,
            mod.UIDepth.AboveGameUI,
            eventPlayer
        );
        adminContainer = mod.FindUIWidgetWithName(ADMIN_CONTAINER_ID, mod.GetUIRoot());
    }

    // Admin toggle button should exist only while the Ready Up dialog is open.
    // When caching is enabled, we hide/show rather than recreate.
    mod.SetUIWidgetVisible(toggleBtn, true);
    mod.SetUIWidgetVisible(toggleLabel, true);

    // Default closed on first build; preserve state on reopen.
    if (!State.players.teamSwitchData[playerId]) initTeamSwitchData(eventPlayer);
    if (!State.players.teamSwitchData[playerId].adminPanelBuilt) {
        State.players.teamSwitchData[playerId].adminPanelVisible = false;
        mod.SetUIWidgetVisible(adminContainer, false);
        setAdminPanelChildWidgetsVisible(playerId, false);
    } else {
        const visible = State.players.teamSwitchData[playerId].adminPanelVisible;
        mod.SetUIWidgetVisible(adminContainer, visible);
        setAdminPanelChildWidgetsVisible(playerId, visible);
    }
}

function createTeamSwitchUI(eventPlayer: mod.Player) {
    // Steps:
    // 1) Ensure per-player dialog root exists
    // 2) Build left team panel widgets
    // 3) Build right team panel widgets
    // 4) Build admin panel widgets + bind button IDs
    // 5) Finalize visibility / default states

    // UI layout maps (per panel):
    // - Left panel: Team 1 roster / interaction surface (layout-driven).
    // - Right panel: Team 2 roster / interaction surface (layout-driven).
    // - Admin panel: Tunable controls that mutate authoritative state; rows are placed via row0Y + N * (buttonSizeY + rowSpacingY).
    // Layout rule: if a label wraps or overlaps, adjust labelSizeX or text size before touching row math.

    const playerId = mod.GetObjId(eventPlayer);
    // UI caching (opt #1): if this player already built the dialog once, just show it again.
    // This avoids recreating ~100 widgets on every open and makes dialog open near-instant after first build.
    const existingBase = safeFind(UI_TEAMSWITCH_CONTAINER_BASE_ID + playerId);
    if (existingBase) {
        mod.SetUIWidgetVisible(existingBase, true);
        const existingDebug = safeFind(UI_TEAMSWITCH_DEBUG_TIMELIMIT_ID + playerId);
        if (existingDebug) mod.SetUIWidgetVisible(existingDebug, true);
        ensureAdminPanelWidgets(eventPlayer, playerId);
        return;
    }

    const CONTAINER_BASE_ID = UI_TEAMSWITCH_CONTAINER_BASE_ID + playerId;

    const BUTTON_TEAM1_ID = UI_TEAMSWITCH_BUTTON_TEAM1_ID + playerId;
    const BUTTON_TEAM1_LABEL_ID = UI_TEAMSWITCH_BUTTON_TEAM1_LABEL_ID + playerId;

    const BUTTON_TEAM2_ID = UI_TEAMSWITCH_BUTTON_TEAM2_ID + playerId;
    const BUTTON_TEAM2_LABEL_ID = UI_TEAMSWITCH_BUTTON_TEAM2_LABEL_ID + playerId;

    const BUTTON_SPECTATE_ID = UI_TEAMSWITCH_BUTTON_SPECTATE_ID + playerId;
    const BUTTON_SPECTATE_LABEL_ID = UI_TEAMSWITCH_BUTTON_SPECTATE_LABEL_ID + playerId;

    const BUTTON_CANCEL_ID = UI_TEAMSWITCH_BUTTON_CANCEL_ID + playerId;
    const BUTTON_CANCEL_LABEL_ID = UI_TEAMSWITCH_BUTTON_CANCEL_LABEL_ID + playerId;

    const BUTTON_OPTOUT_ID = UI_TEAMSWITCH_BUTTON_OPTOUT_ID + playerId;
    const BUTTON_OPTOUT_LABEL_ID = UI_TEAMSWITCH_BUTTON_OPTOUT_LABEL_ID + playerId;

    mod.AddUIContainer(
        CONTAINER_BASE_ID,
        mod.CreateVector(-10, 0, 0),
        mod.CreateVector(1300, 700, 0),
        mod.UIAnchor.Center,
        mod.GetUIRoot(),
        true,
        10,
        mod.CreateVector(0, 0, 0),
        0.995,
        mod.UIBgFill.Blur,
        mod.UIDepth.AboveGameUI,
        eventPlayer
    );
    const CONTAINER_BASE = mod.FindUIWidgetWithName(CONTAINER_BASE_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(CONTAINER_BASE, 0.995); // Force darker overlay (some clients render blur lighter)

    //#endregion -------------------- UI - Ready Up Dialog (construction) --------------------



    //#region -------------------- Ready Dialog (Roster UI) -  (header + team rosters) --------------------

    // Header row (string-backed for easy iteration).
    const READY_HEADER_ID = UI_READY_DIALOG_HEADER_ID + playerId;
    mod.AddUIText(
        READY_HEADER_ID,
        //If Anchored at TopCenter, X is center offset - increase to move right, Y is down offset - increase to move down
        mod.CreateVector(-150, -15, 0),
        mod.CreateVector(900, 50, 0), //size
        mod.UIAnchor.TopCenter,
        mod.Message(mod.stringkeys.twl.readyDialog.header),
        eventPlayer
    );
    const READY_HEADER = mod.FindUIWidgetWithName(READY_HEADER_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(READY_HEADER, 0);
    mod.SetUITextSize(READY_HEADER, 22);
    mod.SetUIWidgetParent(READY_HEADER, CONTAINER_BASE);

    // Best-of rounds control (top-right): minus button, dynamic label, plus button.
    const BESTOF_DEC_ID = UI_READY_DIALOG_BESTOF_DEC_ID + playerId;
    const BESTOF_DEC_LABEL_ID = UI_READY_DIALOG_BESTOF_DEC_LABEL_ID + playerId;
    const BESTOF_LABEL_ID = UI_READY_DIALOG_BESTOF_LABEL_ID + playerId;
    const BESTOF_INC_ID = UI_READY_DIALOG_BESTOF_INC_ID + playerId;
    const BESTOF_INC_LABEL_ID = UI_READY_DIALOG_BESTOF_INC_LABEL_ID + playerId;

    const bestOfY = -3;
    const bestOfButtonSizeX = 26;
    const bestOfButtonSizeY = 24;
    const bestOfLabelSizeX = 170;
    const bestOfLabelSizeY = 24;

    // Best-of: minus button (left of label)
    mod.AddUIButton(
        BESTOF_DEC_ID,
        mod.CreateVector(125, bestOfY, 0),
        mod.CreateVector(bestOfButtonSizeX, bestOfButtonSizeY, 0),
        mod.UIAnchor.TopRight,
        eventPlayer
    );
    const BESTOF_DEC = mod.FindUIWidgetWithName(BESTOF_DEC_ID, mod.GetUIRoot());
    mod.SetUIWidgetParent(BESTOF_DEC, CONTAINER_BASE);

    // Best-of: minus label (left of label)
    mod.AddUIText(
        BESTOF_DEC_LABEL_ID,
        mod.CreateVector(125, bestOfY, 0),
        mod.CreateVector(bestOfButtonSizeX, bestOfButtonSizeY, 0),
        mod.UIAnchor.TopRight,
        mod.Message(mod.stringkeys.twl.ui.minus),
        eventPlayer
    );
    const BESTOF_DEC_LABEL = mod.FindUIWidgetWithName(BESTOF_DEC_LABEL_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(BESTOF_DEC_LABEL, 0);
    mod.SetUITextSize(BESTOF_DEC_LABEL, 14);
    mod.SetUIWidgetParent(BESTOF_DEC_LABEL, CONTAINER_BASE);

    // Best-of: dynamic label
    mod.AddUIText(
        BESTOF_LABEL_ID,
        mod.CreateVector(-42, bestOfY, 0),
        mod.CreateVector(bestOfLabelSizeX, bestOfLabelSizeY, 0),
        mod.UIAnchor.TopRight,
        mod.Message(mod.stringkeys.twl.readyDialog.bestOfLabel, State.round.max),
        eventPlayer
    );
    const BESTOF_LABEL = mod.FindUIWidgetWithName(BESTOF_LABEL_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(BESTOF_LABEL, 0);
    mod.SetUITextSize(BESTOF_LABEL, 14);
    mod.SetUIWidgetParent(BESTOF_LABEL, CONTAINER_BASE);

    // Best-of: plus button (right of label)
    mod.AddUIButton(
        BESTOF_INC_ID,
        mod.CreateVector(-3, bestOfY, 0),
        mod.CreateVector(bestOfButtonSizeX, bestOfButtonSizeY, 0),
        mod.UIAnchor.TopRight,
        eventPlayer
    );
    const BESTOF_INC = mod.FindUIWidgetWithName(BESTOF_INC_ID, mod.GetUIRoot());
    mod.SetUIWidgetParent(BESTOF_INC, CONTAINER_BASE);

    // Best-of: plus label (right of label)
    mod.AddUIText(
        BESTOF_INC_LABEL_ID,
        mod.CreateVector(-3, bestOfY, 0),
        mod.CreateVector(bestOfButtonSizeX, bestOfButtonSizeY, 0),
        mod.UIAnchor.TopRight,
        mod.Message(mod.stringkeys.twl.ui.plus),
        eventPlayer
    );
    const BESTOF_INC_LABEL = mod.FindUIWidgetWithName(BESTOF_INC_LABEL_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(BESTOF_INC_LABEL, 0);
    mod.SetUITextSize(BESTOF_INC_LABEL, 14);
    mod.SetUIWidgetParent(BESTOF_INC_LABEL, CONTAINER_BASE);
    updateBestOfRoundsLabelForPid(playerId);

    // Left and right roster containers (children are parented to these containers).
    const T1_CONTAINER_ID = UI_READY_DIALOG_TEAM1_CONTAINER_ID + playerId;
    const T2_CONTAINER_ID = UI_READY_DIALOG_TEAM2_CONTAINER_ID + playerId;

    mod.AddUIContainer(
        T1_CONTAINER_ID,
        mod.CreateVector(50, 90, 0),
        mod.CreateVector(580, 440, 0),
        mod.UIAnchor.TopLeft,
        CONTAINER_BASE,
        true,
        1,
        mod.CreateVector(0.10, 0.25, 0.70),
        0.20,
        mod.UIBgFill.Solid,
        mod.UIDepth.AboveGameUI,
        eventPlayer
    );
    mod.AddUIContainer(
        T2_CONTAINER_ID,
        mod.CreateVector(670, 90, 0),
        mod.CreateVector(580, 440, 0),
        mod.UIAnchor.TopLeft,
        CONTAINER_BASE,
        true,
        1,
        mod.CreateVector(0.70, 0.15, 0.15),
        0.20,
        mod.UIBgFill.Solid,
        mod.UIDepth.AboveGameUI,
        eventPlayer
    );

    const T1_CONTAINER = mod.FindUIWidgetWithName(T1_CONTAINER_ID, mod.GetUIRoot());
    const T2_CONTAINER = mod.FindUIWidgetWithName(T2_CONTAINER_ID, mod.GetUIRoot());

    // Team labels reuse existing team-name strings.
    const T1_LABEL_ID = UI_READY_DIALOG_TEAM1_LABEL_ID + playerId;
    const T2_LABEL_ID = UI_READY_DIALOG_TEAM2_LABEL_ID + playerId;
    mod.AddUIText(
        T1_LABEL_ID,
        mod.CreateVector(10, 10, 0),
        mod.CreateVector(560, 28, 0),
        mod.UIAnchor.TopLeft,
        mod.Message(mod.stringkeys.twl.teams.leftName),
        eventPlayer
    );
    const T1_LABEL = mod.FindUIWidgetWithName(T1_LABEL_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(T1_LABEL, 0);
    mod.SetUITextSize(T1_LABEL, 16);
    mod.SetUIWidgetParent(T1_LABEL, T1_CONTAINER);

    mod.AddUIText(
        T2_LABEL_ID,
        mod.CreateVector(10, 10, 0),
        mod.CreateVector(560, 28, 0),
        mod.UIAnchor.TopLeft,
        mod.Message(mod.stringkeys.twl.teams.rightName),
        eventPlayer
    );
    const T2_LABEL = mod.FindUIWidgetWithName(T2_LABEL_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(T2_LABEL, 0);
    mod.SetUITextSize(T2_LABEL, 16);
    mod.SetUIWidgetParent(T2_LABEL, T2_CONTAINER);

    // Fixed rows: up to 16 players per team (32 max).
    const rowStartY = 50;
    const rowH = 26;
    const colNameX = 10;
    const colReadyX = 280;
    const colBaseX = 420;
    const colNameW = 260;
    const colStatusW = 140;

    for (let row = 0; row < 16; row++) {
        const y = rowStartY + (row * rowH);

        const t1NameId = UI_READY_DIALOG_T1_ROW_NAME_ID + playerId + "_" + row;
        const t1ReadyId = UI_READY_DIALOG_T1_ROW_READY_ID + playerId + "_" + row;
        const t1BaseId = UI_READY_DIALOG_T1_ROW_BASE_ID + playerId + "_" + row;

        mod.AddUIText(t1NameId, mod.CreateVector(colNameX, y, 0), mod.CreateVector(colNameW, rowH, 0), mod.UIAnchor.TopLeft, mod.Message(mod.stringkeys.twl.system.genericCounter, ""), eventPlayer);
        const T1_NAME = mod.FindUIWidgetWithName(t1NameId, mod.GetUIRoot());
        mod.SetUIWidgetBgAlpha(T1_NAME, 0);
        mod.SetUITextSize(T1_NAME, 14);
        mod.SetUIWidgetParent(T1_NAME, T1_CONTAINER);

        mod.AddUIText(t1ReadyId, mod.CreateVector(colReadyX, y, 0), mod.CreateVector(colStatusW, rowH, 0), mod.UIAnchor.TopLeft, mod.Message(mod.stringkeys.twl.system.genericCounter, ""), eventPlayer);
        const T1_READY = mod.FindUIWidgetWithName(t1ReadyId, mod.GetUIRoot());
        mod.SetUIWidgetBgAlpha(T1_READY, 0);
        mod.SetUITextSize(T1_READY, 14);
        mod.SetUIWidgetParent(T1_READY, T1_CONTAINER);

        mod.AddUIText(t1BaseId, mod.CreateVector(colBaseX, y, 0), mod.CreateVector(colStatusW, rowH, 0), mod.UIAnchor.TopLeft, mod.Message(mod.stringkeys.twl.system.genericCounter, ""), eventPlayer);
        const T1_BASE = mod.FindUIWidgetWithName(t1BaseId, mod.GetUIRoot());
        mod.SetUIWidgetBgAlpha(T1_BASE, 0);
        mod.SetUITextSize(T1_BASE, 14);
        mod.SetUIWidgetParent(T1_BASE, T1_CONTAINER);

        const t2NameId = UI_READY_DIALOG_T2_ROW_NAME_ID + playerId + "_" + row;
        const t2ReadyId = UI_READY_DIALOG_T2_ROW_READY_ID + playerId + "_" + row;
        const t2BaseId = UI_READY_DIALOG_T2_ROW_BASE_ID + playerId + "_" + row;

        mod.AddUIText(t2NameId, mod.CreateVector(colNameX, y, 0), mod.CreateVector(colNameW, rowH, 0), mod.UIAnchor.TopLeft, mod.Message(mod.stringkeys.twl.system.genericCounter, ""), eventPlayer);
        const T2_NAME = mod.FindUIWidgetWithName(t2NameId, mod.GetUIRoot());
        mod.SetUIWidgetBgAlpha(T2_NAME, 0);
        mod.SetUITextSize(T2_NAME, 14);
        mod.SetUIWidgetParent(T2_NAME, T2_CONTAINER);

        mod.AddUIText(t2ReadyId, mod.CreateVector(colReadyX, y, 0), mod.CreateVector(colStatusW, rowH, 0), mod.UIAnchor.TopLeft, mod.Message(mod.stringkeys.twl.system.genericCounter, ""), eventPlayer);
        const T2_READY = mod.FindUIWidgetWithName(t2ReadyId, mod.GetUIRoot());
        mod.SetUIWidgetBgAlpha(T2_READY, 0);
        mod.SetUITextSize(T2_READY, 14);
        mod.SetUIWidgetParent(T2_READY, T2_CONTAINER);

        mod.AddUIText(t2BaseId, mod.CreateVector(colBaseX, y, 0), mod.CreateVector(colStatusW, rowH, 0), mod.UIAnchor.TopLeft, mod.Message(mod.stringkeys.twl.system.genericCounter, ""), eventPlayer);
        const T2_BASE = mod.FindUIWidgetWithName(t2BaseId, mod.GetUIRoot());
        mod.SetUIWidgetBgAlpha(T2_BASE, 0);
        mod.SetUITextSize(T2_BASE, 14);
        mod.SetUIWidgetParent(T2_BASE, T2_CONTAINER);
    }

    // Populate rows for this viewer .
    refreshReadyDialogRosterForViewer(eventPlayer, playerId);

    //#endregion ----------------- Ready Dialog (Roster UI) -  (header + team rosters) --------------------

    

    //#region -------------------- Ready Dialog (Swap Teams button:) - Swap Teams Button --------------------

    // Bottom-left toggle: swaps the player's current team (Team 1 <-> Team 2).
    const SWAP_BUTTON_ID = UI_READY_DIALOG_BUTTON_SWAP_ID + playerId;
    const SWAP_BUTTON_LABEL_ID = UI_READY_DIALOG_BUTTON_SWAP_LABEL_ID + playerId;

    mod.AddUIButton(
        SWAP_BUTTON_ID,
        mod.CreateVector(0, 0, 0),
        mod.CreateVector(300, 100, 0),
        mod.UIAnchor.BottomLeft,
        eventPlayer
    );
    const SWAP_BUTTON = mod.FindUIWidgetWithName(SWAP_BUTTON_ID, mod.GetUIRoot());
    mod.SetUIWidgetParent(SWAP_BUTTON, CONTAINER_BASE);

    mod.AddUIText(
        SWAP_BUTTON_LABEL_ID,
        mod.CreateVector(0, 0, 0),
        mod.CreateVector(300, 100, 0),
        mod.UIAnchor.BottomLeft,
        mod.Message(mod.stringkeys.twl.readyDialog.buttons.swapTeams),
        eventPlayer
    );
    const SWAP_BUTTON_LABEL = mod.FindUIWidgetWithName(SWAP_BUTTON_LABEL_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(SWAP_BUTTON_LABEL, 0);
    mod.SetUIWidgetParent(SWAP_BUTTON_LABEL, CONTAINER_BASE);

    //#endregion ----------------- Ready Dialog (Swap Teams button:) - Swap Teams Button --------------------



    //#region -------------------- Ready Dialog  - Ready Toggle Button --------------------

    // Bottom-center toggle: starts as "Ready" (pressing it sets READY), then flips to "Not Ready".
    const READY_BUTTON_ID = UI_READY_DIALOG_BUTTON_READY_ID + playerId;
    const READY_BUTTON_LABEL_ID = UI_READY_DIALOG_BUTTON_READY_LABEL_ID + playerId;

    mod.AddUIButton(
        READY_BUTTON_ID,
        mod.CreateVector(0, 0, 0),
        mod.CreateVector(300, 100, 0),
        mod.UIAnchor.BottomCenter,
        eventPlayer
    );
    const READY_BUTTON = mod.FindUIWidgetWithName(READY_BUTTON_ID, mod.GetUIRoot());
    mod.SetUIWidgetParent(READY_BUTTON, CONTAINER_BASE);

    mod.AddUIText(
        READY_BUTTON_LABEL_ID,
        mod.CreateVector(0, 0, 0),
        mod.CreateVector(300, 100, 0),
        mod.UIAnchor.BottomCenter,
        mod.Message(mod.stringkeys.twl.readyDialog.buttons.ready),
        eventPlayer
    );
    const READY_BUTTON_LABEL = mod.FindUIWidgetWithName(READY_BUTTON_LABEL_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(READY_BUTTON_LABEL, 0);
    mod.SetUIWidgetParent(READY_BUTTON_LABEL, CONTAINER_BASE);

    // Ensure the label matches the current stored state for this viewer (default is NOT READY).
    updateReadyToggleButtonForViewer(eventPlayer, playerId);

    //#endregion ----------------- Ready Dialog  - Ready Toggle Button --------------------



    //#region -------------------- Debug Info - Time Limit Seconds --------------------

    // Shows the current inferred gamemode time limit (seconds) while the team switch dialog is open.
    const debugTimeLimitSeconds = Math.floor(mod.GetMatchTimeElapsed() + mod.GetMatchTimeRemaining());
    const DEBUG_TIMELIMIT_ID = UI_TEAMSWITCH_DEBUG_TIMELIMIT_ID + playerId;
    mod.AddUIText(
        DEBUG_TIMELIMIT_ID,
        mod.CreateVector(-320, -160, 0),  //mod.CreateVector(-220, 10, 0),
        mod.CreateVector(80, 28, 0),    //mod.CreateVector(80, 28, 0),
        mod.UIAnchor.TopRight,
        mod.Message(mod.stringkeys.twl.teamSwitch.debugTimeLimit, debugTimeLimitSeconds),
        eventPlayer
    );
    const DEBUG_TIMELIMIT = mod.FindUIWidgetWithName(DEBUG_TIMELIMIT_ID, mod.GetUIRoot());
    // Parent to the Team Switch container so the text is always drawn above the dialog background.
    mod.SetUIWidgetParent(DEBUG_TIMELIMIT, CONTAINER_BASE);
    mod.SetUIWidgetBgAlpha(DEBUG_TIMELIMIT, 0);
    mod.SetUITextSize(DEBUG_TIMELIMIT, 12);

    //#endregion -------------------- Debug Info - Time Limit Seconds --------------------


    
    //#region -------------------- Admin Panel Toggle Button (Top-Right, only while Ready Up dialog is open) --------------------

    // UI caching note: these widgets are created once and then hidden/shown on open/close.
    ensureAdminPanelWidgets(eventPlayer, playerId);

    //#endregion ----------------- Admin Panel Toggle Button (Top-Right, only while Ready Up dialog is open) --------------------



    //#region -------------------- Dialog Buttons (Left Side) - Cancel --------------------

    // Cancel remains a core function so players can dismiss the dialog and regain control.
    // (Team switching / spectate / opt-out buttons are intentionally not exposed in v0.5+; see Deprecated UI block below.)
    mod.AddUIButton(
        BUTTON_CANCEL_ID,
        mod.CreateVector(0, 0, 0),
        mod.CreateVector(300, 100, 0),
        mod.UIAnchor.BottomRight,
        eventPlayer
    );
    const BUTTON_CANCEL = mod.FindUIWidgetWithName(BUTTON_CANCEL_ID, mod.GetUIRoot());
    mod.SetUIWidgetParent(BUTTON_CANCEL, CONTAINER_BASE);

    mod.AddUIText(
        BUTTON_CANCEL_LABEL_ID,
        mod.CreateVector(0, 0, 0),
        mod.CreateVector(300, 100, 0),
        mod.UIAnchor.BottomRight,
        mod.Message(mod.stringkeys.twl.teamSwitch.buttons.cancel),
        eventPlayer
    );
    const BUTTON_CANCEL_LABEL = mod.FindUIWidgetWithName(BUTTON_CANCEL_LABEL_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(BUTTON_CANCEL_LABEL, 0);
    mod.SetUIWidgetParent(BUTTON_CANCEL_LABEL, CONTAINER_BASE);

    // Layout constants: adjust cautiously; verify in-game dialog Admin panel widgets are built lazily on first open (see buildAdminPanelWidgets) to prevent a one-tick render flicker.
    updateHelpTextVisibilityForPlayer(eventPlayer);
}

//#endregion ----------------- Dialog Buttons (Left Side) - Cancel --------------------



//#region -------------------- Admin Panel UI (Right Side) --------------------

// Builds the Admin Panel widgets lazily (to avoid a 1-frame flicker on dialog open).
function buildAdminPanelWidgets(eventPlayer: mod.Player, adminContainer: mod.UIWidget, playerId: number): void {

    // Fit at target resolutions.
    const testerBaseX = 10;
    const testerBaseY = 10;

    const buttonSizeX = 48;
    const buttonSizeY = 34;
    const labelSizeX = 175;
    const rowSpacingY = 4;

    const decOffsetX = 0;
    const labelOffsetX = buttonSizeX + 8;
    const incOffsetX = buttonSizeX + 8 + labelSizeX + 8;

    const headerId = UI_TEST_HEADER_LABEL_ID + playerId;

    mod.AddUIText(
        headerId,
        mod.CreateVector(testerBaseX, testerBaseY + 2, 0),
        mod.CreateVector(220, 18, 0),
        mod.UIAnchor.TopLeft,
        mod.Message(mod.stringkeys.twl.adminPanel.tester.header),
        eventPlayer
    );
    const TEST_HEADER = mod.FindUIWidgetWithName(headerId, mod.GetUIRoot());
    mod.SetUITextSize(TEST_HEADER, 12);
    mod.SetUIWidgetBgAlpha(TEST_HEADER, 0);
    mod.SetUIWidgetParent(TEST_HEADER, adminContainer);

    const row0Y = testerBaseY + 22;

    addTesterRow(eventPlayer, adminContainer, playerId, testerBaseX, row0Y + (buttonSizeY + rowSpacingY) * 0,
        UI_TEST_BUTTON_LEFT_WINS_DEC_ID, UI_TEST_BUTTON_LEFT_WINS_INC_ID, UI_TEST_LABEL_LEFT_WINS_ID,
        mod.stringkeys.twl.adminPanel.tester.labels.leftWins, buttonSizeX, buttonSizeY, labelSizeX, decOffsetX, labelOffsetX, incOffsetX);

    addTesterRow(eventPlayer, adminContainer, playerId, testerBaseX, row0Y + (buttonSizeY + rowSpacingY) * 1,
        UI_TEST_BUTTON_RIGHT_WINS_DEC_ID, UI_TEST_BUTTON_RIGHT_WINS_INC_ID, UI_TEST_LABEL_RIGHT_WINS_ID,
        mod.stringkeys.twl.adminPanel.tester.labels.rightWins, buttonSizeX, buttonSizeY, labelSizeX, decOffsetX, labelOffsetX, incOffsetX);

    addTesterRow(eventPlayer, adminContainer, playerId, testerBaseX, row0Y + (buttonSizeY + rowSpacingY) * 2,
        UI_TEST_BUTTON_LEFT_KILLS_DEC_ID, UI_TEST_BUTTON_LEFT_KILLS_INC_ID, UI_TEST_LABEL_LEFT_KILLS_ID,
        mod.stringkeys.twl.adminPanel.tester.labels.leftKills, buttonSizeX, buttonSizeY, labelSizeX, decOffsetX, labelOffsetX, incOffsetX);

    addTesterRow(eventPlayer, adminContainer, playerId, testerBaseX, row0Y + (buttonSizeY + rowSpacingY) * 3,
        UI_TEST_BUTTON_RIGHT_KILLS_DEC_ID, UI_TEST_BUTTON_RIGHT_KILLS_INC_ID, UI_TEST_LABEL_RIGHT_KILLS_ID,
        mod.stringkeys.twl.adminPanel.tester.labels.rightKills, buttonSizeX, buttonSizeY, labelSizeX, decOffsetX, labelOffsetX, incOffsetX);

    addTesterRow(eventPlayer, adminContainer, playerId, testerBaseX, row0Y + (buttonSizeY + rowSpacingY) * 4,
        UI_ADMIN_BUTTON_T1_ROUND_KILLS_DEC_ID, UI_ADMIN_BUTTON_T1_ROUND_KILLS_INC_ID, UI_ADMIN_LABEL_T1_ROUND_KILLS_ID,
        mod.stringkeys.twl.adminPanel.labels.t1RoundKills, buttonSizeX, buttonSizeY, labelSizeX, decOffsetX, labelOffsetX, incOffsetX);

    addTesterRow(eventPlayer, adminContainer, playerId, testerBaseX, row0Y + (buttonSizeY + rowSpacingY) * 5,
        UI_ADMIN_BUTTON_T2_ROUND_KILLS_DEC_ID, UI_ADMIN_BUTTON_T2_ROUND_KILLS_INC_ID, UI_ADMIN_LABEL_T2_ROUND_KILLS_ID,
        mod.stringkeys.twl.adminPanel.labels.t2RoundKills, buttonSizeX, buttonSizeY, labelSizeX, decOffsetX, labelOffsetX, incOffsetX);

    addTesterRowWithValue(eventPlayer, adminContainer, playerId, testerBaseX, row0Y + (buttonSizeY + rowSpacingY) * 6,
        UI_TEST_BUTTON_ROUND_KILLS_TARGET_DEC_ID, UI_TEST_BUTTON_ROUND_KILLS_TARGET_INC_ID, UI_TEST_LABEL_ROUND_KILLS_TARGET_ID, UI_TEST_VALUE_ROUND_KILLS_TARGET_ID,
        mod.stringkeys.twl.adminPanel.tester.labels.roundKillsTarget, State.round.killsTarget, buttonSizeX, buttonSizeY, labelSizeX, 46, decOffsetX, labelOffsetX, incOffsetX);

    syncRoundKillsTargetTesterValueForAllPlayers();

    addTesterRow(eventPlayer, adminContainer, playerId, testerBaseX, row0Y + (buttonSizeY + rowSpacingY) * 7,
        UI_TEST_BUTTON_TIES_DEC_ID, UI_TEST_BUTTON_TIES_INC_ID, UI_TEST_LABEL_TIES_ID,
        mod.stringkeys.twl.adminPanel.tester.labels.ties, buttonSizeX, buttonSizeY, labelSizeX, decOffsetX, labelOffsetX, incOffsetX);

    addTesterRow(eventPlayer, adminContainer, playerId, testerBaseX, row0Y + (buttonSizeY + rowSpacingY) * 8,
        UI_TEST_BUTTON_CUR_ROUND_DEC_ID, UI_TEST_BUTTON_CUR_ROUND_INC_ID, UI_TEST_LABEL_CUR_ROUND_ID,
        mod.stringkeys.twl.adminPanel.tester.labels.currentRound, buttonSizeX, buttonSizeY, labelSizeX, decOffsetX, labelOffsetX, incOffsetX);

    addTesterRow(eventPlayer, adminContainer, playerId, testerBaseX, row0Y + (buttonSizeY + rowSpacingY) * 9,
        UI_TEST_BUTTON_CLOCK_TIME_DEC_ID, UI_TEST_BUTTON_CLOCK_TIME_INC_ID, UI_TEST_LABEL_CLOCK_TIME_ID,
        mod.stringkeys.twl.adminPanel.tester.labels.clockTime, buttonSizeX, buttonSizeY, labelSizeX, decOffsetX, labelOffsetX, incOffsetX);

    addTesterResetButton(eventPlayer, adminContainer, playerId, testerBaseX,
        row0Y + (buttonSizeY + rowSpacingY) * 10, (buttonSizeX + 8 + labelSizeX + 8 + buttonSizeX), 36);

    addTesterActionButton(eventPlayer, adminContainer, playerId, testerBaseX,
        row0Y + (buttonSizeY + rowSpacingY) * 11, (buttonSizeX + 8 + labelSizeX + 8 + buttonSizeX), 36,
        UI_TEST_BUTTON_ROUND_START_ID, UI_TEST_ROUND_START_TEXT_ID, mod.stringkeys.twl.adminPanel.tester.buttons.roundStart);

    addTesterActionButton(eventPlayer, adminContainer, playerId, testerBaseX,
        row0Y + (buttonSizeY + rowSpacingY) * 12, (buttonSizeX + 8 + labelSizeX + 8 + buttonSizeX), 36,
        UI_TEST_BUTTON_ROUND_END_ID, UI_TEST_ROUND_END_TEXT_ID, mod.stringkeys.twl.adminPanel.tester.buttons.roundEnd);
}

//#endregion ----------------- Admin Panel UI (Right Side) --------------------



//#region -------------------- Admin Panel UI builder helpers --------------------

function addTesterRow(
    eventPlayer: mod.Player,
    containerBase: mod.UIWidget,
    playerId: number,
    baseX: number,
    baseY: number,
    decButtonBaseId: string,
    incButtonBaseId: string,
    labelBaseId: string,
    labelKey: number,
    buttonSizeX: number,
    buttonSizeY: number,
    labelSizeX: number,
    decOffsetX: number,
    labelOffsetX: number,
    incOffsetX: number
): void {
    // Steps:
    // 1) Ensure per-player dialog root exists
    // 2) Build left team panel widgets
    // 3) Build right team panel widgets
    // 4) Build admin panel widgets + bind button IDs
    // 5) Finalize visibility / default states

    const decButtonId = decButtonBaseId + playerId;
    const incButtonId = incButtonBaseId + playerId;

    const plusTextId = UI_TEST_PLUS_TEXT_ID + incButtonId;
    const minusTextId = UI_TEST_MINUS_TEXT_ID + decButtonId;

    const labelId = labelBaseId + playerId;

    mod.AddUIButton(decButtonId, mod.CreateVector(baseX + decOffsetX, baseY, 0), mod.CreateVector(buttonSizeX, buttonSizeY, 0),
        mod.UIAnchor.TopLeft, eventPlayer);
    const DEC_BUTTON = mod.FindUIWidgetWithName(decButtonId, mod.GetUIRoot());
    mod.SetUIWidgetParent(DEC_BUTTON, containerBase);

    mod.AddUIText(minusTextId, mod.CreateVector(baseX + decOffsetX, baseY + 11, 0), mod.CreateVector(buttonSizeX, buttonSizeY - 22, 0),
        mod.UIAnchor.TopLeft, mod.Message(mod.stringkeys.twl.ui.minus), eventPlayer);
    mod.SetUITextSize(mod.FindUIWidgetWithName(minusTextId, mod.GetUIRoot()), 12);
    const MINUS_TEXT = mod.FindUIWidgetWithName(minusTextId, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(MINUS_TEXT, 0);
    mod.SetUIWidgetParent(MINUS_TEXT, containerBase);

    mod.AddUIText(labelId, mod.CreateVector(baseX + labelOffsetX, baseY + 11, 0), mod.CreateVector(labelSizeX, buttonSizeY - 22, 0),
        mod.UIAnchor.TopLeft, mod.Message(labelKey), eventPlayer);
    mod.SetUITextSize(mod.FindUIWidgetWithName(labelId, mod.GetUIRoot()), 12);
    const LABEL = mod.FindUIWidgetWithName(labelId, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(LABEL, 0);
    mod.SetUIWidgetParent(LABEL, containerBase);

    mod.AddUIButton(incButtonId, mod.CreateVector(baseX + incOffsetX, baseY, 0), mod.CreateVector(buttonSizeX, buttonSizeY, 0),
        mod.UIAnchor.TopLeft, eventPlayer);
    const INC_BUTTON = mod.FindUIWidgetWithName(incButtonId, mod.GetUIRoot());
    mod.SetUIWidgetParent(INC_BUTTON, containerBase);

    mod.AddUIText(plusTextId, mod.CreateVector(baseX + incOffsetX, baseY + 11, 0), mod.CreateVector(buttonSizeX, buttonSizeY - 22, 0),
        mod.UIAnchor.TopLeft, mod.Message(mod.stringkeys.twl.ui.plus), eventPlayer);
    mod.SetUITextSize(mod.FindUIWidgetWithName(plusTextId, mod.GetUIRoot()), 12);
    const PLUS_TEXT = mod.FindUIWidgetWithName(plusTextId, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(PLUS_TEXT, 0);
    mod.SetUIWidgetParent(PLUS_TEXT, containerBase);
}

function addTesterRowWithValue(
    eventPlayer: mod.Player,
    containerBase: mod.UIWidget,
    playerId: number,
    baseX: number,
    baseY: number,
    decButtonBaseId: string,
    incButtonBaseId: string,
    labelBaseId: string,
    valueBaseId: string,
    labelKey: number,
    initialValue: number,
    buttonSizeX: number,
    buttonSizeY: number,
    labelSizeX: number,
    valueSizeX: number,
    decOffsetX: number,
    labelOffsetX: number,
    incOffsetX: number
): void {
    addTesterRow(eventPlayer, containerBase, playerId, baseX, baseY,
        decButtonBaseId, incButtonBaseId, labelBaseId, labelKey,
        buttonSizeX, buttonSizeY, labelSizeX, decOffsetX, labelOffsetX, incOffsetX);

    const valueId = valueBaseId + playerId;
    const valueX = baseX + incOffsetX - 16 - valueSizeX;

    mod.AddUIText(valueId, mod.CreateVector(valueX, baseY + 11, 0), mod.CreateVector(valueSizeX, buttonSizeY - 22, 0),
        mod.UIAnchor.TopLeft, mod.Message(mod.stringkeys.twl.system.genericCounter, Math.floor(initialValue)), eventPlayer);
    mod.SetUITextSize(mod.FindUIWidgetWithName(valueId, mod.GetUIRoot()), 12);
    const VALUE_TEXT = mod.FindUIWidgetWithName(valueId, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(VALUE_TEXT, 0);
    mod.SetUIWidgetParent(VALUE_TEXT, containerBase);
}

function syncRoundKillsTargetTesterValueForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);

    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i);
        const pid = getObjId(p);
        const widget = mod.FindUIWidgetWithName(UI_TEST_VALUE_ROUND_KILLS_TARGET_ID + pid, mod.GetUIRoot());
        if (!widget) continue;
        mod.SetUITextLabel(widget, mod.Message(mod.stringkeys.twl.system.genericCounter, Math.floor(State.round.killsTarget)));
    }
}

function addTesterResetButton(
    eventPlayer: mod.Player,
    containerBase: mod.UIWidget,
    playerId: number,
    baseX: number,
    baseY: number,
    width: number,
    height: number
): void {
    const buttonId = UI_TEST_BUTTON_CLOCK_RESET_ID + playerId;
    const labelId = UI_TEST_RESET_TEXT_ID + playerId;

    mod.AddUIButton(buttonId, mod.CreateVector(baseX, baseY, 0), mod.CreateVector(width, height, 0), mod.UIAnchor.TopLeft, eventPlayer);
    const RESET_BUTTON = mod.FindUIWidgetWithName(buttonId, mod.GetUIRoot());
    mod.SetUIWidgetParent(RESET_BUTTON, containerBase);

    mod.AddUIText(labelId, mod.CreateVector(baseX, baseY + 11, 0), mod.CreateVector(width, height - 22, 0),
        mod.UIAnchor.TopLeft, mod.Message(mod.stringkeys.twl.adminPanel.tester.buttons.clockReset), eventPlayer);
    const RESET_LABEL = mod.FindUIWidgetWithName(labelId, mod.GetUIRoot());
    mod.SetUITextSize(RESET_LABEL, 12);
    mod.SetUIWidgetBgAlpha(RESET_LABEL, 0);
    mod.SetUIWidgetParent(RESET_LABEL, containerBase);
}

function addTesterActionButton(
    eventPlayer: mod.Player,
    containerBase: mod.UIWidget,
    playerId: number,
    baseX: number,
    baseY: number,
    width: number,
    height: number,
    buttonBaseId: string,
    labelBaseId: string,
    labelKey: number
): void {
    const buttonId = buttonBaseId + playerId;
    const labelId = labelBaseId + playerId;

    mod.AddUIButton(buttonId, mod.CreateVector(baseX, baseY, 0), mod.CreateVector(width, height, 0),
    mod.UIAnchor.TopLeft, eventPlayer);
    const ACTION_BUTTON = mod.FindUIWidgetWithName(buttonId, mod.GetUIRoot());
    mod.SetUIWidgetParent(ACTION_BUTTON, containerBase);

    mod.AddUIText(labelId, mod.CreateVector(baseX, baseY + 11, 0), mod.CreateVector(width, height - 22, 0),
    mod.UIAnchor.TopLeft, mod.Message(labelKey), eventPlayer);
    mod.SetUITextSize(mod.FindUIWidgetWithName(labelId, mod.GetUIRoot()), 12);
    const ACTION_LABEL = mod.FindUIWidgetWithName(labelId, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(ACTION_LABEL, 0);
    mod.SetUIWidgetParent(ACTION_LABEL, containerBase);
}
//#endregion ----------------- Admin Panel UI builder helpers --------------------



//#region -------------------- MultiClickDetector (triple tap interact) --------------------

//Code Cleanup: Refactor this reference and use TS Template as a tool import instead
class InteractMultiClickDetector {
    private static readonly STATES: Record<number, { lastIsInteracting: boolean; clickCount: number; sequenceStartTime: number }> = {};
    private static readonly WINDOW_MS = 1_000;
    private static readonly REQUIRED_CLICKS = 3;

    public static checkMultiClick(player: mod.Player): boolean {
        const playerId = mod.GetObjId(player);
        const isInteracting = mod.GetSoldierState(player, mod.SoldierStateBool.IsInteracting);

        let state = this.STATES[playerId];
        if (!state) {
            this.STATES[playerId] = state = {
                lastIsInteracting: isInteracting,
                clickCount: 0,
                sequenceStartTime: 0,
            };
        }

        if (isInteracting === state.lastIsInteracting) return false;
        state.lastIsInteracting = isInteracting;

        if (!isInteracting) return false;

        const now = Date.now();

        if (state.clickCount > 0 && now - state.sequenceStartTime > this.WINDOW_MS) {
            state.clickCount = 0;
        }

        if (state.clickCount === 0) {
            state.sequenceStartTime = now;
            state.clickCount = 1;
            return false;
        }

        if (++state.clickCount !== this.REQUIRED_CLICKS) return false;

        state.clickCount = 0;
        return true;
    }
}

//#endregion ----------------- MultiClickDetector (triple tap interact) --------------------



//#region -------------------- Main Base Restock (area triggers) --------------------

function IsPlayerInOwnMainBase(player: mod.Player, areaTrigger: mod.AreaTrigger): boolean {
    const triggerId = mod.GetObjId(areaTrigger);
    const teamId = mod.GetObjId(mod.GetTeam(player));

    return mod.Or(
        mod.And(mod.Equals(triggerId, TEAM1_MAIN_BASE_TRIGGER_ID), mod.Equals(teamId, mod.GetObjId(mod.GetTeam(TeamID.Team1)))),
        mod.And(mod.Equals(triggerId, TEAM2_MAIN_BASE_TRIGGER_ID), mod.Equals(teamId, mod.GetObjId(mod.GetTeam(TeamID.Team2))))
    );
}

function BroadcastMainBaseEvent(message: mod.Message): void {
    sendHighlightedWorldLogMessage(message, false);
}

function NotifyAmmoRestocked(player: mod.Player): void {
    sendHighlightedWorldLogMessage(mod.Message(STR_AMMO_RESTOCKED), true, mod.GetTeam(player));
}

function RestockGadgetAmmo(player: mod.Player, magAmmo: number): void {
    mod.SetInventoryMagazineAmmo(player, mod.InventorySlots.GadgetOne, magAmmo);
    mod.SetInventoryMagazineAmmo(player, mod.InventorySlots.GadgetTwo, magAmmo);
}

//#endregion ----------------- Main Base Restock (area triggers) --------------------



//#region -------------------- Exported Event Handlers (single exports) --------------------

/**
 * Entry point for this experience when the game mode starts.
 *
 * High-level flow:
 * 1) Initialize authoritative match/round state (counters, flags, and timers).
 * 2) Build or repair any global UI/state that should exist before players interact.
 * 3) Ensure every currently-connected player has a HUD and that the HUD reflects the initial state.
 * 4) Arm any recurring processes (clock tick, cleanup passes) that keep state and UI in sync.
 *
 * Important invariants:
 * - Do not award points unless `isRoundLive()` is true.
 * - Round/match counters are authoritative; the HUD is a projection of that state.
 * - Any async work started here must use the guard tokens to prevent overlap if the mode restarts.
 *
 * Why async functions: uses small engine waits (mod.Wait/await) to sequence UI rebuilds/timers safely without blocking the main thread.
 */
export async function OnGameModeStarted(): Promise<void> {
    // Vehicle scoring init + legacy cleanup
    // Remove legacy UI roots (if any) before we build fresh HUDs; prevents duplicated overlays across restarts.
    deleteLegacyScoreRootsForAllPlayers();

    // Apply initial engine variables/settings used by the mode (authoritative baseline).
    mod.SetVariable(regVehiclesTeam1, mod.EmptyArray());
    mod.SetVariable(regVehiclesTeam2, mod.EmptyArray());

    vehIds.length = 0;
    vehOwners.length = 0;

    sendHighlightedWorldLogMessage(mod.Message(mod.stringkeys.twl.messages.init), false, mod.GetTeam(TeamID.Team1));
    sendHighlightedWorldLogMessage(mod.Message(mod.stringkeys.twl.messages.init), false, mod.GetTeam(TeamID.Team2));

    // Ensure HUD exists for anyone already in-game at start
    await mod.Wait(0.1);
    {
        const players = mod.AllPlayers();
        const count = mod.CountOf(players);
        for (let i = 0; i < count; i++) {
            const p = mod.ValueInArray(players, i) as mod.Player;
            if (!p || !mod.IsPlayerValid(p)) continue;
            // Build/rebuild the player's HUD (widgets) and immediately reflect current authoritative state.
            ensureHudForPlayer(p);
        }
    }

    // Reset HUD state
    State.match.isEnded = false;
    State.match.victoryDialogActive = false;
    State.round.phase = RoundPhase.NotReady; // Reset round phase for a new match.

    setMatchWinsTeam(TeamID.Team1, 0);
    setMatchWinsTeam(TeamID.Team2, 0);
    State.scores.t1TotalKills = 0;
    State.scores.t2TotalKills = 0;

    State.match.winnerTeam = undefined;
    State.match.endElapsedSecondsSnapshot = 0;
    State.match.victoryStartElapsedSecondsSnapshot = 0;
    State.admin.actionCount = 0;

    State.hudCache.lastHudScoreT1 = undefined;
    State.hudCache.lastHudScoreT2 = undefined;
    // Init visible counters
    setHudRoundCountersForAllPlayers(State.round.current, State.round.max);
    setHudWinCountersForAllPlayers(0, 0);
    State.match.tiesT1 = 0;
    State.match.tiesT2 = 0;
    syncRoundRecordHudForAllPlayers();
    syncWinCountersHudFromGameModeScore();
    syncKillsHudFromTrackedTotals(true);
    updateAdminPanelActionCountForAllPlayers();
    // Broadcast the initial round phase label (e.g., NOT READY) to all HUDs.
    setRoundStateTextForAllPlayers();
    updateHelpTextVisibilityForAllPlayers();

    // Clock init + loop
    ResetRoundClock(0);

    while (true) {
        // Push the initial clock display so every HUD shows the same starting time.
        updateAllPlayersClock();
        syncKillsHudFromTrackedTotals(false);

        if (State.match.victoryDialogActive) {
            const elapsedSinceVictory = Math.floor(mod.GetMatchTimeElapsed()) - Math.floor(State.match.victoryStartElapsedSecondsSnapshot);
            const remaining = MATCH_END_DELAY_SECONDS - elapsedSinceVictory;
            updateVictoryDialogForAllPlayers(Math.max(0, Math.floor(remaining)));
        }
        await mod.Wait(1.0);
    }
}

export async function OnPlayerJoinGame(eventPlayer: mod.Player) {
    initTeamSwitchData(eventPlayer);

    await mod.Wait(0.1);
    if (!mod.IsPlayerValid(eventPlayer)) return;

    const refs = ensureHudForPlayer(eventPlayer);

    // Join-time HUD initialization uses script-authoritative counters; do not pull from engine scores here.
    if (refs) {
        setCounterText(refs.leftWinsText, State.match.winsT1);
        setCounterText(refs.rightWinsText, State.match.winsT2);
        setRoundRecordText(refs.leftRecordText, State.match.winsT1, State.match.lossesT1, State.match.tiesT1);
        setRoundRecordText(refs.rightRecordText, State.match.winsT2, State.match.lossesT2, State.match.tiesT2);
        setCounterText(refs.leftRoundKillsText, State.scores.t1RoundKills);
        setCounterText(refs.rightRoundKillsText, State.scores.t2RoundKills);
        setCounterText(refs.leftKillsText, State.scores.t1TotalKills);
        setCounterText(refs.rightKillsText, State.scores.t2TotalKills);
        setCounterText(refs.roundCurText, State.round.current);
        setCounterText(refs.roundMaxText, State.round.max);
    }
    {
        const cache = ensureClockUIAndGetCache(eventPlayer);
        if (cache) setRoundStateText(cache.roundStateText);
    updateHelpTextVisibilityForPlayer(eventPlayer);
    }
    deleteLegacyScoreRootForPlayer(eventPlayer);
}

export async function OnPlayerDeployed(eventPlayer: mod.Player) {
    //Remove existing gadgets and give deployable vehicle supply crates
    mod.RemoveEquipment(eventPlayer, mod.InventorySlots.GadgetOne);
    mod.RemoveEquipment(eventPlayer, mod.InventorySlots.GadgetTwo);
    mod.AddEquipment(
        eventPlayer,
        mod.Gadgets.Deployable_Vehicle_Supply_Crate,
        mod.InventorySlots.GadgetOne
    );
    mod.AddEquipment(
        eventPlayer,
        mod.Gadgets.Deployable_Vehicle_Supply_Crate,
        mod.InventorySlots.GadgetTwo
    );
    // Rejoin / spawn behavior: players always start NOT READY for the next round gating.
    const pid = mod.GetObjId(eventPlayer);
    State.players.readyByPid[pid] = false;
    // Design assumption: players spawn in their main base; update immediately for roster display.
    State.players.inMainBaseByPid[pid] = true;
    updatePlayersReadyHudTextForAllPlayers();
    renderReadyDialogForAllVisibleViewers();
    updateHelpTextVisibilityForAllPlayers();

    ensureHudForPlayer(eventPlayer);
    await spawnTeamSwitchInteractPoint(eventPlayer);
}

/**
 * Disconnect handling:
 * - Clears per-player state maps so rejoin starts clean (NOT READY).
 * - Forces UI/HUD refresh for remaining players to drop the departed player immediately.
 */
export function OnPlayerLeaveGame(eventNumber: number) {
    removeTeamSwitchInteractPoint(eventNumber);
    // Cleanup: delete cached UI widgets so we do not leak UI for disconnected players.
    hardDeleteTeamSwitchUI(eventNumber);
    // Remove any persisted per-player state so rejoin starts clean (NOT READY by default).
    delete State.players.readyByPid[eventNumber];
    delete State.players.inMainBaseByPid[eventNumber];
    // Also drop dialog-visible tracking if present (viewer is gone).
    delete State.players.teamSwitchData[eventNumber];

    // Refresh UI for remaining players so rosters + HUD ready counts immediately reflect the disconnect.
    renderReadyDialogForAllVisibleViewers();
    updatePlayersReadyHudTextForAllPlayers();
    updateHelpTextVisibilityForAllPlayers();
}

export function OnPlayerUndeploy(eventPlayer: mod.Player) {
    // If the player is leaving the deployed state (death / manual undeploy / forced redeploy),
    // the Ready Up dialog should be closed. This prevents interacting with the UI while undeployed.
    const pid = mod.GetObjId(eventPlayer);
    if (State.players.teamSwitchData[pid]?.dialogVisible) {
        deleteTeamSwitchUI(eventPlayer);
    }

    removeTeamSwitchInteractPoint(eventPlayer);
}

// Performance note:
// - OngoingPlayer executes frequently; keep it lightweight.
// - Avoid FindUIWidget calls or per-tick loops over all players/vehicles unless strictly necessary.
// - Prefer "update only when changed" patterns for HUD/clock refreshes.
// ------------------------------------------------------------------

export function OngoingPlayer(eventPlayer: mod.Player): void {
    checkTeamSwitchInteractPointRemoval(eventPlayer);

    // UI caching warm-up: build the Ready Up dialog once per player so the first real open is snappy.
    // We build and immediately hide; the dialog becomes visible only when the player opens it via the interact point.
    const pid = mod.GetObjId(eventPlayer);
    if (State.players.teamSwitchData[pid] && !State.players.teamSwitchData[pid].uiBuilt) {
        createTeamSwitchUI(eventPlayer);
        // Ensure the warm-up build does not count as "open" for refresh logic.
        State.players.teamSwitchData[pid].dialogVisible = false;
        deleteTeamSwitchUI(eventPlayer); // now hides (cached) rather than deleting
        State.players.teamSwitchData[pid].uiBuilt = true;
    }

    if (InteractMultiClickDetector.checkMultiClick(eventPlayer)) {
        spawnTeamSwitchInteractPoint(eventPlayer);
        //mod.DisplayHighlightedWorldLogMessage(mod.Message(mod.stringkeys.twl.notifications.multiclickDetector), mod.GetTeam(eventPlayer));
    }
}

export function OnPlayerInteract(eventPlayer: mod.Player, eventInteractPoint: mod.InteractPoint) {
    teamSwitchInteractPointActivated(eventPlayer, eventInteractPoint);
}

export function OnPlayerUIButtonEvent(eventPlayer: mod.Player, eventUIWidget: mod.UIWidget, eventUIButtonEvent: mod.UIButtonEvent) {
    teamSwitchButtonEvent(eventPlayer, eventUIWidget, eventUIButtonEvent);
}

// OnPlayerEnterVehicle:
// Registers a vehicle to a team the first time a player enters it.
// This establishes which team will lose a point if the vehicle is later destroyed.
// Also records the entering player as the 'last driver' for messaging purposes.
// Notes:
// - Registration is idempotent; re-entering does not double-register.
// - Last driver is best-effort and not authoritative for scoring.
// Code Cleanup: Known fragility - we need to refactor or identify a different method entirely as OnPlayerEnterVehicle is error prone.
export function OnPlayerEnterVehicle(eventPlayer: mod.Player, eventVehicle: mod.Vehicle) {
    if (!mod.IsPlayerValid(eventPlayer)) return;

    const teamNum = getTeamNumber(mod.GetTeam(eventPlayer));
    if (teamNum !== TeamID.Team1 && teamNum !== TeamID.Team2) return;

    const inT1 = arrayContainsVehicle(mod.GetVariable(regVehiclesTeam1), eventVehicle);
    const inT2 = arrayContainsVehicle(mod.GetVariable(regVehiclesTeam2), eventVehicle);
    const wasRegistered = inT1 || inT2;

    const priorOwner = getLastDriver(eventVehicle);
    const isReturnToSameOwner = priorOwner && (getObjId(priorOwner) === getObjId(eventPlayer));

    setLastDriver(eventVehicle, eventPlayer);
    registerVehicleToTeam(eventVehicle, teamNum);

    const teamNameKey = getTeamNameKey(teamNum);

    //Send notifications around different vehicle registration events so players can spot known issue with OnPlayerEnterVehicle
    if (!wasRegistered) { //Old Vehicle Different Player
        sendHighlightedWorldLogMessage(
            mod.Message(mod.stringkeys.twl.messages.vehicleRegisteredNew, teamNameKey, eventPlayer), 
            true,
            mod.GetTeam(TeamID.Team1)
        );
        sendHighlightedWorldLogMessage(
            mod.Message(mod.stringkeys.twl.messages.vehicleRegisteredNew, teamNameKey, eventPlayer), 
            true,
            mod.GetTeam(TeamID.Team2)
        );
    } else if (isReturnToSameOwner) { //Old Vehicle Same Player
        sendHighlightedWorldLogMessage(
            mod.Message(mod.stringkeys.twl.messages.vehicleReturned, eventPlayer, teamNameKey), 
            true,
            mod.GetTeam(TeamID.Team1)
        );
        sendHighlightedWorldLogMessage(
            mod.Message(mod.stringkeys.twl.messages.vehicleReturned, eventPlayer, teamNameKey), 
            true,
            mod.GetTeam(TeamID.Team2)
        );
    } else { //New Vehicle
        sendHighlightedWorldLogMessage(
            mod.Message(mod.stringkeys.twl.messages.vehicleReRegistered, teamNameKey, eventPlayer), 
            true,
            mod.GetTeam(TeamID.Team1)
        );
        sendHighlightedWorldLogMessage(
            mod.Message(mod.stringkeys.twl.messages.vehicleReRegistered, teamNameKey, eventPlayer), 
            true,
            mod.GetTeam(TeamID.Team2)
        );
    }
}

// OnVehicleDestroyed:
// Handles vehicle-destruction scoring logic.
// If the destroyed vehicle is registered to a team AND the round is LIVE:
// - Award +1 Round Kill to the opposing team.
// - Emit informational world log messages.
// If the round is not live:
// - No points are awarded; the vehicle is simply deregistered.
// Important:
// - Infantry deaths are ignored entirely.
// - This function is the ONLY place round vehicle kills are awarded.
export async function OnVehicleDestroyed(eventVehicle: mod.Vehicle) {
    const inT1 = arrayContainsVehicle(mod.GetVariable(regVehiclesTeam1), eventVehicle);
    const inT2 = arrayContainsVehicle(mod.GetVariable(regVehiclesTeam2), eventVehicle);

    if (!inT1 && !inT2) {
        return;
    }

    const destroyedTeamNum = inT1 ? TeamID.Team1 : TeamID.Team2;
    const scoringTeamNum = opposingTeam(destroyedTeamNum);

    if (isRoundLive()) {
        if (scoringTeamNum === TeamID.Team1) {
            State.scores.t1RoundKills = State.scores.t1RoundKills + 1;
        } else if (scoringTeamNum === TeamID.Team2) {
            State.scores.t2RoundKills = State.scores.t2RoundKills + 1;
        }

        // Update round kills HUD immediately.
        syncRoundKillsHud();

        // End the round immediately if a team reaches the configured round-kills target.
        if (State.scores.t1RoundKills >= State.round.killsTarget || State.scores.t2RoundKills >= State.round.killsTarget) {
            endRound(undefined, getRemainingSeconds());
        }

        if (scoringTeamNum === TeamID.Team1) {
            State.scores.t1TotalKills = Math.floor(State.scores.t1TotalKills) + 1;
        } else if (scoringTeamNum === TeamID.Team2) {
            State.scores.t2TotalKills = Math.floor(State.scores.t2TotalKills) + 1;
        }

        // Update top HUD kills counters.
        syncKillsHudFromTrackedTotals(false);

        mod.SetVariable(regVehiclesTeam1, arrayRemoveVehicle(mod.GetVariable(regVehiclesTeam1), eventVehicle));
        mod.SetVariable(regVehiclesTeam2, arrayRemoveVehicle(mod.GetVariable(regVehiclesTeam2), eventVehicle));

        const owner = popLastDriver(eventVehicle);

        await mod.Wait(3.0);

        const roundKills = (scoringTeamNum === TeamID.Team1) ? State.scores.t1RoundKills : State.scores.t2RoundKills;
        const teamNameKey = (scoringTeamNum === TeamID.Team1) ? mod.stringkeys.twl.teams.leftName : mod.stringkeys.twl.teams.rightName;
        const ownerNameOrKey = owner ? owner : mod.stringkeys.twl.system.unknownPlayer;

        sendHighlightedWorldLogMessage(
            mod.Message(mod.stringkeys.twl.messages.pointAwardedWithOwner, teamNameKey, ownerNameOrKey, Math.floor(roundKills)),
            true,
            mod.GetTeam(TeamID.Team1)
        );
        sendHighlightedWorldLogMessage(
            mod.Message(mod.stringkeys.twl.messages.pointAwardedWithOwner, teamNameKey, ownerNameOrKey, Math.floor(roundKills)),
            true,
            mod.GetTeam(TeamID.Team2)
        );

        return;
    }

    // Round is not live: clean up registration, but do not award points or increment counters.
    mod.SetVariable(regVehiclesTeam1, arrayRemoveVehicle(mod.GetVariable(regVehiclesTeam1), eventVehicle));
    mod.SetVariable(regVehiclesTeam2, arrayRemoveVehicle(mod.GetVariable(regVehiclesTeam2), eventVehicle));

    const owner = popLastDriver(eventVehicle);

    await mod.Wait(3.0);

    const destroyedTeamNameKey = (destroyedTeamNum === TeamID.Team1) ? mod.stringkeys.twl.teams.leftName : mod.stringkeys.twl.teams.rightName;
    const ownerNameOrKey = owner ? owner : mod.stringkeys.twl.system.unknownPlayer;

    sendHighlightedWorldLogMessage(
        mod.Message(mod.stringkeys.twl.messages.vehicleDestroyedNotLive, ownerNameOrKey, destroyedTeamNameKey),
        true,
        mod.GetTeam(TeamID.Team1)
    );
    sendHighlightedWorldLogMessage(
        mod.Message(mod.stringkeys.twl.messages.vehicleDestroyedNotLive, ownerNameOrKey, destroyedTeamNameKey),
        true,
        mod.GetTeam(TeamID.Team2)
    );
}

//#endregion ----------------- Exported Event Handlers (single exports) --------------------



//#region -------------------- Main Base - Enter/Exit Triggers --------------------

export function OnPlayerEnterAreaTrigger(eventPlayer: mod.Player, eventAreaTrigger: mod.AreaTrigger) {
    if (!eventPlayer) return;

    if (IsPlayerInOwnMainBase(eventPlayer, eventAreaTrigger)) {
        // track per-player main base state for UI display (authoritative gating comes later).
        State.players.inMainBaseByPid[mod.GetObjId(eventPlayer)] = true;
        renderReadyDialogForAllVisibleViewers();
        BroadcastMainBaseEvent(mod.Message(STR_ENTERED_MAIN_BASE, eventPlayer));
        RestockGadgetAmmo(eventPlayer, RESTOCK_MAG_AMMO_ENTER);
        NotifyAmmoRestocked(eventPlayer);
    }
}

export function OnPlayerExitAreaTrigger(eventPlayer: mod.Player, eventAreaTrigger: mod.AreaTrigger) {
    if (!eventPlayer) return;

    if (!mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsAlive)) return;

    if (IsPlayerInOwnMainBase(eventPlayer, eventAreaTrigger)) {
        State.players.inMainBaseByPid[mod.GetObjId(eventPlayer)] = false;
        // Pre-round gating:: if the round is NOT active, leaving the main base forces the player back to NOT READY.
        if (!isRoundLive()) {
            State.players.readyByPid[mod.GetObjId(eventPlayer)] = false;
            // Keep the HUD "X / Y PLAYERS READY" line in sync when leaving main base forces NOT READY.
            updatePlayersReadyHudTextForAllPlayers();
            if (State.round.countdown.isRequested) {
                cancelPregameCountdown();
                void showOverLineMessageForAllPlayers(eventPlayer);
            }
            // Player-only warning: they were ready, but left main base before the round went live.
            // This is intentionally not broadcast globally; it is actionable guidance for the individual player.
            sendHighlightedWorldLogMessage(mod.Message(STR_READYUP_RETURN_TO_BASE_NOT_LIVE, Math.floor(State.round.current)), false, eventPlayer);
        }
        renderReadyDialogForAllVisibleViewers();
        BroadcastMainBaseEvent(mod.Message(STR_EXITED_MAIN_BASE, eventPlayer));
        RestockGadgetAmmo(eventPlayer, RESTOCK_MAG_AMMO_EXIT);
        NotifyAmmoRestocked(eventPlayer);
    }
}

//#endregion ----------------- Main Base - Enter/Exit Triggers --------------------

// EOF version: 0.152 | Date: 12.28.25 | Time: 11:18 UTC
