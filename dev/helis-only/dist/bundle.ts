//#region -------------------- Versioning --------------------

// version: 0.621 | Date: 02.07.26 | Time: 16:52 UTC
// name of script: TWL_Vehicles_Only_Script.ts
// name of paired strings file: TWL_Vehicles_Only_Strings.json
// policy: the string hud.branding.title should display this same version at the end of the title
// policy: increment minor version on every change (UTC)
// policy: major versions reserved for milestone feature releases (primary authors only)
// policy: EOF version line must match the header version and timestamp

//#endregion ----------------- Versioning --------------------



//#region ----------------- License --------------------

// MIT License
// 
// Copyright (c) 2026 teamwarfare.net, uberdubersoldat, polykatana
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

//#endregion ----------------- License --------------------



//#region -------------------- Authors / Attribution --------------------

// Authors: UberDuberSoldat, Polynorblu, Dox
// Code generation, assistance and support by: ChatGPT (OpenAI, GPT-5.2, GPT-5.2-Codex)
//
// This code is sourced controlled here: https://github.com/Teamwarfare-Network/bf6-portal/tree/main
//
// BF6 Portal Community Tools used/referenced:
//  - Portal Community Discord: https://discord.com/invite/battlefield-portal-community-870246147455877181
//  - TypeScript Project Template for Battlefield 6 Portal Scripting by Mike DeLuca: https://github.com/deluca-mike/bf6-portal-scripting-template
//     - Multi-Click detector by Mike DeLuca: https://github.com/deluca-mike/bf6-portal-utils/tree/master/interact-multi-click-detector
//     - Map detector by Mike DeLuca: https://github.com/deluca-mike/bf6-portal-utils/tree/master/map-detector
//  - Team Switch UI Template by TheOzzy: https://github.com/The0zzy/BF6-Portal-TeamSwitchUI
//  - BF6 Portal Assistant by Quoeiza: https://chatgpt.com/g/g-68f28580eefc8191b4cf40bbf2305db3-bf6-portal-assistant
//     - GPT Prompt: https://gist.github.com/Quoeiza/8085f142ad8a05ee04b79adcc4ad8fd7
//  - BF6 User Interface Tool builder by EagleNait: https://tools.bfportal.gg/ui-builder/
//  - Custom Conquest Template by andy6170: https://bfportal.gg/experiences/custom-conquest-template/
//  - Asset Browser by WillToth: https://bf6props.pages.dev/ -- https://github.com/The-Sir-Community/prop_stats/releases/tag/v1.1.2.0

//#endregion ----------------- Authors / Attribution --------------------



//#region -------------------- Changelog / History --------------------

// v0.622: Version bump
// v0.621: Adjusted Aircraft Ceilings for Ladder based on feedback
// v0.620: Helis Alpha Candidate 1.0 release for 2v2 Ladder opening
// v0.616: Fix gamemode settings with some minor UI tweaks
// v0.608: Add helis-only H flag selection + per-mode overtime zones
// v0.592: Add admin tie-breaker mode toggle (last round/all/disabled) along with more game mode controls and customizations
// v0.591: Add takeoff limit gating + overtakeoff messaging (HUD floor + 20)
// v0.577: Add reset button + heli spawn overrides tied to confirm
// v0.568: Aircraft ceiling config per map + custom override controls for game modes
// v0.567: Map configs now support heli spawns and mode-based selection
// v0.544: Playtest ready, Alpha Candidate for 1.0....
// v0.543: Guard join-prompt deletes + defer forced undeploy to avoid deploy lifecycle crashes
// v0.541: Avoid hard-deleting overtime HUD on undeploy; hide + drop refs for safe rebuild
// v0.539: Code cleanup, regions added, 1.0 Alpha Release candidate
// v0.538: UI saftey wrappers, reorganized code, fixed disconnect Bugs, map crash bugs and UI inconsistencies with timing. Alpha candidate for 1.0 release.
// v0.514: UI/UX Polish, capture bar progress % display, tie-breaker tip added
// v0.477: Playtesting version, alpha candidate for 1.0 release
// v0.468: Added Admin function for overriding random tie-breaker flag for testing
// v0.443: Polished Tie-Breaker UI, capture zone rates, messaging and UX of capturing
// v0.457: Half-time flag visibility + capture tuning
// v0.395: Add overtime flag capture tiebreaker (randomized capture point + UI + capture logic)
// v0.359: Require triple-tap to unlock join prompt tips
// v0.358: Add join prompt tips sequence with unlock gating and per-player state
// v0.357: Hide help/ready text while undeployed to avoid respawn overlay & fixed issues smaller aspect ratios or wierd resolutions due to dialog overlap
// v0.346: Added MIT Licence and ensured spawn-disabled warning is shown while undeployed during live rounds for context
// v0.340: Tweak HUD counter sizes, add victory crown + dynamic roster height + debug roster placeholders
// v0.337: Added round-win crown and trending winner crown icons inside top HUD panels
// v0.333: Added rosters to the bottom of the map victory dialog for improved UX / Screenshot auditing
// v0.330: Cleaned up top HUD, made round scores more obvious, refactored some logic around ready status displays
// v0.322: Cleaned up UI spacings, colors, constants, positions and opacity - most things controlled via constants now
// v0.271: Added first-join help prompt overlay, controlled with SHOW_HELP_TEXT_PROMPT_ON_JOIN
// v0.269: Disable respawn during live rounds with DISABLE_RESPAWN_DURING_LIVE_ROUND
// v0.266: Increased triple tap window to 2s, instead of 1s. Clarified string to mention "standing still" while triple tapping.
// v0.263: Fix for ready up roster refreshing when new player joins or old player disconnects
// v0.262: Refactored round end process. Destroy all tanks, force undeploy all players, respawn all tanks, wait, force redeploy players, keep Round End dialog up longer
// v0.259: Release version for Ladder with 8 maps
// v0.258: Added MapConfig settings for Area 22B
// v0.257: Fixed race condition on first tank spawned - need to clear it and spawn correct vehicle to avoid default Abrams spawn
// v0.247: Added team names to MapConfig, fixed backend JS Errors on player being deployed or not (empty string args {} vs {0})
// v0.240: Fixed spawner logic regressions (spawn block and failed to spawn with rapid mode increase)
// v0.238: Submitted for Code Review by Dox & Poly
// v0.233: Code cleanup, reorganization and comment clarity, prepping for 1.0 Release version
// v0.228: Added dynamic binding to modes: 1v1 only spawns 1 tank, 4v4 spawns 4 tanks. Configurable when round is not live.
// v0.224: Added Map Detector logic to auto-detect which MapConfig and spawners to use, then display the Map name on the Ready Up screen
// v0.218: First pass on Spawn points for all 7 maps in Ladder rotation, using Admin Debug Position tool
// v0.217: Added Admin Debug Position button to display X/Y/Z coordinates and Y rotation of player
// v0.205: Added spawn camp scoring protection if a leftover vehicle remains in main base during round setup
// v0.197: Adjusted some HUD/UI positions, added new labels and added "1v1" up to "4v4" matchup configuration buttons to Ready screen
// v0.182: Functional version of Badlands working with respawn logic, orientation and vehicle assignments working
// v0.177: Custom respawn logic implemented with unique data structures per map; custom vehicle and HQ spawn points needed per map 
// v0.152: Forcing supply boxes on every spawn, to ensure no other gadget loophole
// v0.151: Finalized string.json into new format with updated strings policy
// v0.148: Added Changelog / History section to script header and finalized enum/interface refactor bugs
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
//   - Overtime tie-breaker objective capture (randomized flag, staged visibility/activation, capture HUD + resolution)
//
// This experience is a round-based, vehicle-only scoring mode:
// - Vehicles become "registered" to a team when they spawn and/or the first time a player enters them.
// - When a registered vehicle is destroyed during a LIVE round, the opposing team earns +1 Round Kill.
// - A round ends when a team reaches the Round Kill target (e.g. 2 kills for 2v2) or the round clock expires.
// - Tie-breaker objective: a random flag becomes visible at half-time (based on round length) but remains locked.
// - The objective unlocks at 1:00 remaining; capture is vehicle-only and progress is script-driven.
// - Capture speed scales with 2/3/4 vehicle majorities, and neutral reset/pushback accelerates until neutral (0.5).
// - At clock expiry, objective progress decides the winner; exact neutral (0.5) falls back to round kills.
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
// - "Overtime objective": the tie-breaker flag selected from the map's A-G set.
// - "Overtime stage": None -> Visible (locked) -> Active (capturable).
// - "Overtime progress": 0.5 is neutral; >0.5 favors Team 1, <0.5 favors Team 2.
// - "Vehicle majority": unique vehicles in the zone used for capture multipliers.
//
// Glossary (script semantics)
// - T1 / T2: The two competing teams in this mode; UI may still use Left/Right for layout only.
// - Match totals: Counters that persist across rounds (e.g., total kills, match wins).
// - Round counters: Counters that reset on round start (e.g., round kills, round clock).
// - Authoritative state: The single source of truth for match-critical counters; HUD is a projection of this state.
// - Overtime state derives from the round clock (half-time reveal, 1:00 unlock) and drives HUD visibility.
//
// Recommendations on tweaking/adjusting/customizing this experience
// - General UI layout tip: Most widgets define an offset via `position: [x, y]`.
// - Change those numbers to nudge that widget relative to its anchor; the perceived direction can vary by anchoring, so verify in-game after edits.
// - Overtime/tie-breaker tuning lives under OVERTIME_* constants (timing, capture rate, multipliers, UI layout).

//#endregion -------------------- Gamemode Description --------------------



//#region -------------------- Improvements punchlist --------------------

/* 
 *
 * List of improvements (for only humans and not LLMs, CODEX or GPT to design and implement):
 * --- Code Cleanup: Gut unused functions / commented out functions from script file (done?)
 * --- Code Cleanup: Address things like renderReadyDialogForAllVisibleViewers vs refreshReadyDialogForAllVisibleViewers (overlap/duplication?)
 * --- Code Cleanup: The UI patterns are bonkers. We dont need unique functions for single message strings? can we simplify this type of pattern: NotifyAmmoRestocked(eventPlayer);
 * --- Code Cleanup: There are many various functions which generally do the same thing, can we consider how to unify UI updates/refreshes or use TS template UI library (major refactor)
 * --- Code Cleanup: Embrace TS Template project and break mega file into modular files...
 * 
 * List of Nice to Haves (for only humans and not LLMs, CODEX or GPT to design and implement):
 * - UI Polish: Add "Respawn in 10s..." message synced with clock to appear in place at top in yellow instead of "ready up" dialog, during the window of round ending
 * - UI Polish: Restart in Xs still rolls over on top match clock 
 * - SFX Polish: Add sound effects for ready up, round start countdown, round end display, victory display 
 * - SFX Polish: Add sound effect on vehicle registration 
 * - SFX Polish: Add sound effect on vehicle destruction for scoring 
 * - SFX Polish: Add sound effect for capturing flags
 * 
 * List of Spatial Data bugs to address:
 * - Defense Nexus: prevent tanks from getting stuck under semi-trailers (e.g. near north main base)
 * 
 */

//#endregion ----------------- Improvements punchlist --------------------



//#region -------------------- Portal Naming Notes --------------------

/* List of Vehicles in BF6 Portal (for reference):

// Main Battle Tank
mod.VehicleList.Abrams       // Abrams - M1A2 SEPv3 (NATO)
mod.VehicleList.Leopard      // Leopard - Leo A4 (PAX)

// Infantry Fighting Vehicle
mod.VehicleList.M2Bradley    // M2 Bradley - M3A3 Bradley (NATO)
mod.VehicleList.CV90         // CV90 - STRF 09 A4 (PAX)

// Anti Air Vehicle
mod.VehicleList.Cheetah      // Cheetah 1A2 (NATO)
mod.VehicleList.Gepard       // Gepard - GE-26 PAX (PAX)

// Ground Vehicle (transport / light)
mod.VehicleList.Marauder     // Marauder (NATO)
mod.VehicleList.Marauder_Pax // Marauder (PAX)
mod.VehicleList.Quadbike     // Quad Bike
mod.VehicleList.GolfCart     // Golf Cart

// Attack Helicopter
mod.VehicleList.AH64         // AH-64 Apache - M77E Falchion (NATO) 
mod.VehicleList.Eurocopter   // Eurocopter Tiger - Panthera KHT (Pax)

// Transport Helicopter
mod.VehicleList.UH60         // UH-60 Black Hawk (NATO)
mod.VehicleList.UH60_Pax     // UH-60 Black Hawk (PAX)

// Jets - need to sort into PAX/NATO and Fighter / Ground Attack
mod.VehicleList.F16          // F-16 (NATO)
mod.VehicleList.JAS39        // JAS 39 Gripen (PAX)
mod.VehicleList.F22          // F-22 (NATO)
mod.VehicleList.SU57         // SU-57 (PAX)
mod.VehicleList.Flyer60      // Flyer 60?

// Internal / Test
mod.VehicleList.Vector       // Vector (internal or test)

*/

/*
 * Player Facing Map Names = Godot Map Reference Names
 * 
 * BlackwellFields = Badlands
 * DefenseNexus = Granite_TechCampus
 * Downtown = Granite_MainStreet
 * Eastwood = Eastwood
 * EmpireState = Aftermath
 * GolfCourse = Granite_ClubHouse
 * IberianOffensive = Battery
 * LiberationPeak = Capstone
 * ManhattanBridge = Dumbo
 * Marina = Granite_Marina
 * MirakValley = Tungsten
 * NewSobekCity = Outskirts
 * OperationFirestorm = Firestorm
 * PortalSandbox = Sand
 * SaintsQuarter = Limestone
 * SiegeOfCairo = Abbasid
 */

//#endregion -------------------- Portal Naming Notes --------------------



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
const AUTO_READY_CHECK_INTERVAL_SECONDS = 3; // Auto-ready polling cadence (seconds).
let lastAutoReadyCheckAtSeconds = -9999;
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
const STR_HUD_AUTO_READY_TEXT = mod.stringkeys.twl.hud.autoReadyText;
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
const STR_HUD_AUTO_READY_HELP_TEXT = mod.stringkeys.twl.hud.autoReadyHelpText;
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



//#region -------------------- Map Config (Constants + Types) --------------------

// Support maps for this gamemode, should have a listing in MapKey, and a corresponding list of spawners in MapConfig
type MapKey = "Blackwell_Fields" | "Defense_Nexus" | "Golf_Course" | "Mirak_Valley" | "Operation_Firestorm" | "Liberation_Peak" | "Manhattan_Bridge" | "Sobek_City" | "Area_22B";

// slotNumber defines the explicit spawn priority per team (used for 1v1/2v2/3v3/4v4 enablement).
type VehicleSpawnSpec = { slotNumber: number; pos: mod.Vector; rot: mod.Vector; vehicle: mod.VehicleList };

// Overtime zones are custom capture areas anchored by AreaTriggers + Sectors + WorldIcon + CapturePoint objects.
type OvertimeZoneSpec = { areaTriggerObjId: number; sectorId: number; worldIconObjId: number; capturePointObjId: number };
type OvertimeZoneCandidate = OvertimeZoneSpec & { letterIndex: number };
type OvertimeZoneLettersByMode = { tanks?: string[]; helis?: string[] };

// Every map needs a team 1 and team 2 HQ object in the spatial data, so this list of vehicles can spawn and dynamically get referenced on map load
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
    vehicleSpawnYawOffsetDeg: number; //This is not used anymore, but we're keeping it in case its needed in the future
    // Optional per-map overtime zone list (AreaTrigger ObjId + Sector Id + WorldIcon ObjId + CapturePoint ObjId).
    // Empty/undefined disables overtime on that map.
    overtimeZones?: OvertimeZoneSpec[];
    overtimeZoneLettersByMode?: OvertimeZoneLettersByMode;
};

// Change this MapKey to switch active map configuration for that map, only one map can be active at a time! This happens inside getMapNameKey & applyMapConfig
let ACTIVE_MAP_KEY: MapKey = "Blackwell_Fields"; //Need to pick one to be default

// Map-specific bases + spawn slots. Keep slotNumber unique within a team; Slots are parallel, e.g. Slot 2 on Team 1 and Slot 2 on Team 2 - both vehicles spawn in when the 2v2 mode is toggled
const MAP_CONFIGS: Record<MapKey, MapConfig> = {

    //Badlands
    Blackwell_Fields: {             
                                   //posX      posY      posZ 
        team1Base: mod.CreateVector(-151.364,  86.948,  -567.672), team1Name: mod.stringkeys.twl.teams.WEST,
        team2Base: mod.CreateVector( 388.231,  71.652,   136.54),  team2Name: mod.stringkeys.twl.teams.EAST,
        aircraftCeiling: 650,
        hudMaxY: 650,
        hudFloorY: 82,
        useCustomCeiling: false,
        // ObjId pattern per zone: AreaTrigger 200+, Sector 300+, WorldIcon 400+, CapturePoint 600+.
        overtimeZones: [
            { areaTriggerObjId: 200, sectorId: 300, worldIconObjId: 400, capturePointObjId: 600 }, // A
            { areaTriggerObjId: 201, sectorId: 301, worldIconObjId: 401, capturePointObjId: 601 }, // B
            { areaTriggerObjId: 202, sectorId: 302, worldIconObjId: 402, capturePointObjId: 602 }, // C
            { areaTriggerObjId: 203, sectorId: 303, worldIconObjId: 403, capturePointObjId: 603 }, // D
            { areaTriggerObjId: 204, sectorId: 304, worldIconObjId: 404, capturePointObjId: 604 }, // E
            { areaTriggerObjId: 205, sectorId: 305, worldIconObjId: 405, capturePointObjId: 605 }, // F
            { areaTriggerObjId: 206, sectorId: 306, worldIconObjId: 406, capturePointObjId: 606 }, // G
            { areaTriggerObjId: 207, sectorId: 307, worldIconObjId: 407, capturePointObjId: 607 }, // H
        ],
        overtimeZoneLettersByMode: {
            tanks: OVERTIME_TANK_ZONE_LETTERS,
            helis: OVERTIME_HELI_ZONE_LETTERS,
        },
       
        vehicleSpawnYawOffsetDeg: 0,

        team1TankSpawns: [                        //posX      posY      posZ                             posX      posY      posZ
            { slotNumber: 1, pos: mod.CreateVector(-163.285,  86.96,   -570.254), rot: mod.CreateVector( 0.0,      45.0,     0.0),       vehicle: mod.VehicleList.Abrams       },
            { slotNumber: 2, pos: mod.CreateVector(-169.559,  86.915,  -560.168), rot: mod.CreateVector( 0.0,      45.0,     0.0),       vehicle: mod.VehicleList.Abrams       },
            { slotNumber: 3, pos: mod.CreateVector(-178.174,  87.159,  -551.206), rot: mod.CreateVector( 0.0,      45.0,     0.0),       vehicle: mod.VehicleList.Abrams       },
            { slotNumber: 4, pos: mod.CreateVector(-185.833,  87.159,  -540.949), rot: mod.CreateVector( 0.0,      45.0,     0.0),       vehicle: mod.VehicleList.M2Bradley    },
        ],
        team2TankSpawns: [                        //posX      posY      posZ                             posX      posY      posZ
            { slotNumber: 1, pos: mod.CreateVector( 403.575,  71.227,   144.594), rot: mod.CreateVector( 0.0,     -90.0,     0.0),       vehicle: mod.VehicleList.Leopard      },
            { slotNumber: 2, pos: mod.CreateVector( 404.054,  71.227,   131.966), rot: mod.CreateVector( 0.0,     -90.0,     0.0),       vehicle: mod.VehicleList.Leopard      },
            { slotNumber: 3, pos: mod.CreateVector( 403.575,  71.227,   118.571), rot: mod.CreateVector( 0.0,     -90.0,     0.0),       vehicle: mod.VehicleList.Leopard      },
            { slotNumber: 4, pos: mod.CreateVector( 403.274,  71.227,   105.886), rot: mod.CreateVector( 0.0,     -90.0,     0.0),       vehicle: mod.VehicleList.CV90         },
        ],
    },

    //Granite_TechCampus
    Defense_Nexus: {
                                   //posX      posY      posZ 
        team1Base: mod.CreateVector(-151.0862, 133.694,  428.018), team1Name: mod.stringkeys.twl.teams.SOUTH,
        team2Base: mod.CreateVector(-107.727,  139.293,  123.248), team2Name: mod.stringkeys.twl.teams.NORTH,
        aircraftCeiling: 650,
        hudMaxY: 650,
        hudFloorY: 82,
        useCustomCeiling: false,
        // ObjId pattern per zone: AreaTrigger 200+, Sector 300+, WorldIcon 400+, CapturePoint 600+.
        overtimeZones: [
            { areaTriggerObjId: 200, sectorId: 300, worldIconObjId: 400, capturePointObjId: 600 }, // A
            { areaTriggerObjId: 201, sectorId: 301, worldIconObjId: 401, capturePointObjId: 601 }, // B
            { areaTriggerObjId: 202, sectorId: 302, worldIconObjId: 402, capturePointObjId: 602 }, // C
            { areaTriggerObjId: 203, sectorId: 303, worldIconObjId: 403, capturePointObjId: 603 }, // D
            { areaTriggerObjId: 204, sectorId: 304, worldIconObjId: 404, capturePointObjId: 604 }, // E
            { areaTriggerObjId: 205, sectorId: 305, worldIconObjId: 405, capturePointObjId: 605 }, // F
            { areaTriggerObjId: 206, sectorId: 306, worldIconObjId: 406, capturePointObjId: 606 }, // G
            { areaTriggerObjId: 207, sectorId: 307, worldIconObjId: 407, capturePointObjId: 607 }, // H
        ],
        overtimeZoneLettersByMode: {
            tanks: OVERTIME_TANK_ZONE_LETTERS,
            helis: OVERTIME_HELI_ZONE_LETTERS,
        },
    
        vehicleSpawnYawOffsetDeg: 0, 

        team1TankSpawns: [                        //posX      posY      posZ                             rotX      rotY      rotZ
            { slotNumber: 1, pos: mod.CreateVector(-185.503,  136.596,  454.617), rot: mod.CreateVector( 0.0,     -165.834,  0.0),       vehicle: mod.VehicleList.M2Bradley    },
            { slotNumber: 2, pos: mod.CreateVector(-179.109,  136.146,  453.327), rot: mod.CreateVector( 0.0,     -158.526,  0.0),       vehicle: mod.VehicleList.M2Bradley    },
            { slotNumber: 3, pos: mod.CreateVector(-174.172,  135.140,  449.380), rot: mod.CreateVector( 0.0,     -149.256,  0.0),       vehicle: mod.VehicleList.Abrams       },
            { slotNumber: 4, pos: mod.CreateVector(-168.293,  134.067,  442.935), rot: mod.CreateVector( 0.0,     -135.442,  0.0),       vehicle: mod.VehicleList.M2Bradley    },
        ],
        team2TankSpawns: [                        //posX      posY      posZ                             posX      posY      posZ
            { slotNumber: 1, pos: mod.CreateVector(-108.824,  138.815,  112.209), rot: mod.CreateVector( 0.0,     -44.984,   0.0),       vehicle: mod.VehicleList.CV90         },
            { slotNumber: 2, pos: mod.CreateVector(-104.153,  138.530,  115.034), rot: mod.CreateVector( 0.0,     -44.717,   0.0),       vehicle: mod.VehicleList.CV90         },
            { slotNumber: 3, pos: mod.CreateVector(-101.378,  138.544,  119.263), rot: mod.CreateVector( 0.0,     -44.806,   0.0),       vehicle: mod.VehicleList.Leopard      },
            { slotNumber: 4, pos: mod.CreateVector(-116.566,  138.852,  104.175), rot: mod.CreateVector( 0.0,     -44.895,   0.0),       vehicle: mod.VehicleList.CV90         },
        ],
    },

    //Granite_ClubHouse
    Golf_Course: {
                                   //posX     posY      posZ 
        team1Base: mod.CreateVector(-764.508, 146.696, -856.193), team1Name: mod.stringkeys.twl.teams.NORTH,
        team2Base: mod.CreateVector(-724.769, 141.317, -271.653), team2Name: mod.stringkeys.twl.teams.SOUTH,
        aircraftCeiling: 650,
        hudMaxY: 650,
        hudFloorY: 82,
        useCustomCeiling: false,
        // ObjId pattern per zone: AreaTrigger 200+, Sector 300+, WorldIcon 400+, CapturePoint 600+.
        overtimeZones: [
            { areaTriggerObjId: 200, sectorId: 300, worldIconObjId: 400, capturePointObjId: 600 }, // A
            { areaTriggerObjId: 201, sectorId: 301, worldIconObjId: 401, capturePointObjId: 601 }, // B
            { areaTriggerObjId: 202, sectorId: 302, worldIconObjId: 402, capturePointObjId: 602 }, // C
            { areaTriggerObjId: 203, sectorId: 303, worldIconObjId: 403, capturePointObjId: 603 }, // D
            { areaTriggerObjId: 204, sectorId: 304, worldIconObjId: 404, capturePointObjId: 604 }, // E
            { areaTriggerObjId: 205, sectorId: 305, worldIconObjId: 405, capturePointObjId: 605 }, // F
            { areaTriggerObjId: 206, sectorId: 306, worldIconObjId: 406, capturePointObjId: 606 }, // G
            { areaTriggerObjId: 207, sectorId: 307, worldIconObjId: 407, capturePointObjId: 607 }, // H
        ],
        overtimeZoneLettersByMode: {
            tanks: OVERTIME_TANK_ZONE_LETTERS,
            helis: OVERTIME_HELI_ZONE_LETTERS,
        },
        
        vehicleSpawnYawOffsetDeg: 0,

        team1TankSpawns: [                        //posX      posY      posZ                             rotX      rotY      rotZ
            { slotNumber: 1, pos: mod.CreateVector(-765.032,  146.068, -863.307), rot: mod.CreateVector( 0.0,     -21.908,   0.0),       vehicle: mod.VehicleList.M2Bradley    },
            { slotNumber: 2, pos: mod.CreateVector(-758.398,  146.524, -861.890), rot: mod.CreateVector( 0.0,      9.287,    0.0),       vehicle: mod.VehicleList.M2Bradley    },
            { slotNumber: 3, pos: mod.CreateVector(-751.234,  147.373, -859.009), rot: mod.CreateVector( 0.0,      10.000,   0.0),       vehicle: mod.VehicleList.Abrams       },
            { slotNumber: 4, pos: mod.CreateVector(-741.779,  148.919, -856.751), rot: mod.CreateVector( 0.0,      20.000,   0.0),       vehicle: mod.VehicleList.M2Bradley    },
        ],
        team2TankSpawns: [                        //posX      posY      posZ                             posX      posY      posZ
            { slotNumber: 1, pos: mod.CreateVector(-722.800,  140.997, -275.980), rot: mod.CreateVector( 0.0,      138.357,  0.0),       vehicle: mod.VehicleList.CV90         },
            { slotNumber: 2, pos: mod.CreateVector(-716.045,  140.555, -270.219), rot: mod.CreateVector( 0.0,      138.357,  0.0),       vehicle: mod.VehicleList.CV90         },
            { slotNumber: 3, pos: mod.CreateVector(-709.327,  140.680, -264.968), rot: mod.CreateVector( 0.0,      138.179,  0.0),       vehicle: mod.VehicleList.Leopard      },
            { slotNumber: 4, pos: mod.CreateVector(-702.080,  140.625, -259.772), rot: mod.CreateVector( 0.0,      139.248,  0.0),       vehicle: mod.VehicleList.CV90         },
        ],
    },

    //Tungsten
    Mirak_Valley: {
                                   //posX      posY      posZ 
        team1Base: mod.CreateVector(-505.641,  82.571,  -329.034), team1Name: mod.stringkeys.twl.teams.WEST,
        team2Base: mod.CreateVector( 428.32,   85.215,  -619.339), team2Name: mod.stringkeys.twl.teams.EAST,
        aircraftCeiling: 110,
        hudMaxY: 635,
        hudFloorY: 82,
        useCustomCeiling: true,
        // ObjId pattern per zone: AreaTrigger 200+, Sector 300+, WorldIcon 400+, CapturePoint 600+.
        overtimeZones: [
            { areaTriggerObjId: 200, sectorId: 300, worldIconObjId: 400, capturePointObjId: 600 }, // A
            { areaTriggerObjId: 201, sectorId: 301, worldIconObjId: 401, capturePointObjId: 601 }, // B
            { areaTriggerObjId: 202, sectorId: 302, worldIconObjId: 402, capturePointObjId: 602 }, // C
            { areaTriggerObjId: 203, sectorId: 303, worldIconObjId: 403, capturePointObjId: 603 }, // D
            { areaTriggerObjId: 204, sectorId: 304, worldIconObjId: 404, capturePointObjId: 604 }, // E
            { areaTriggerObjId: 205, sectorId: 305, worldIconObjId: 405, capturePointObjId: 605 }, // F
            { areaTriggerObjId: 206, sectorId: 306, worldIconObjId: 406, capturePointObjId: 606 }, // G
            { areaTriggerObjId: 207, sectorId: 307, worldIconObjId: 407, capturePointObjId: 607 }, // H
        ],
        overtimeZoneLettersByMode: {
            tanks: OVERTIME_TANK_ZONE_LETTERS,
            helis: OVERTIME_HELI_ZONE_LETTERS,
        },
       
        vehicleSpawnYawOffsetDeg: 0,

        team1TankSpawns: [                        //posX      posY      posZ                             rotX      rotY      rotZ
            { slotNumber: 1, pos: mod.CreateVector(-497.328,  81.909,  -320.058), rot: mod.CreateVector( 0.0,      90.0,     0.0),       vehicle: mod.VehicleList.Abrams       },
            { slotNumber: 2, pos: mod.CreateVector(-493.699,  82.167,  -330.616), rot: mod.CreateVector( 0.0,      87.0,     0.0),       vehicle: mod.VehicleList.Abrams       },
            { slotNumber: 3, pos: mod.CreateVector(-488.869,  82.556,  -340.723), rot: mod.CreateVector( 0.0,      85.0,     0.0),       vehicle: mod.VehicleList.M2Bradley    },
            { slotNumber: 4, pos: mod.CreateVector(-485.335,  83.244,  -351.327), rot: mod.CreateVector( 0.0,      84.500,   0.0),       vehicle: mod.VehicleList.Abrams       },
        ],
        team2TankSpawns: [                        //posX      posY      posZ                             posX      posY      posZ
            { slotNumber: 1, pos: mod.CreateVector( 423.155,  85.160,  -609.593), rot: mod.CreateVector( 0.0,     -41.212,   0.0),       vehicle: mod.VehicleList.Leopard      },
            { slotNumber: 2, pos: mod.CreateVector( 412.416,  85.442,  -610.044), rot: mod.CreateVector( 0.0,     -45.580,   0.0),       vehicle: mod.VehicleList.Leopard      },
            { slotNumber: 3, pos: mod.CreateVector( 400.396,  85.775,  -610.576), rot: mod.CreateVector( 0.0,     -47.719,   0.0),       vehicle: mod.VehicleList.CV90         },
            { slotNumber: 4, pos: mod.CreateVector( 388.667,  86.085,  -611.596), rot: mod.CreateVector( 0.0,     -44.956,   0.0),       vehicle: mod.VehicleList.Leopard      },
        ],
        team1HeliSpawns: [                        //posX      posY      posZ                             rotX      rotY      rotZ
            { slotNumber: 1, pos: mod.CreateVector(-500.019,  81.257,  -292.899), rot: mod.CreateVector( 0.0,      98.404,   0.0),       vehicle: mod.VehicleList.AH64         },
            { slotNumber: 2, pos: mod.CreateVector(-498.055,  82.222,  -328.527), rot: mod.CreateVector( 0.0,      50.634,   0.0),       vehicle: mod.VehicleList.Eurocopter   },
            { slotNumber: 3, pos: mod.CreateVector(-512.883,  80.713,  -269.728), rot: mod.CreateVector( 0.0,      61.967,   0.0),       vehicle: mod.VehicleList.AH64         },
            { slotNumber: 4, pos: mod.CreateVector(-481.267,  82.761,  -345.178), rot: mod.CreateVector( 0.0,      29.312,   0.0),       vehicle: mod.VehicleList.UH60         },
        ],
        team2HeliSpawns: [                        //posX      posY      posZ                             posX      posY      posZ
            { slotNumber: 1, pos: mod.CreateVector( 454.968,  84.306,  -612.495), rot: mod.CreateVector( 0.0,     -4.780,    0.0),       vehicle: mod.VehicleList.AH64         },
            { slotNumber: 2, pos: mod.CreateVector( 461.746,  83.898,  -585.902), rot: mod.CreateVector( 0.0,     -157.452,  0.0),       vehicle: mod.VehicleList.Eurocopter   },
            { slotNumber: 3, pos: mod.CreateVector( 496.253,  83.173,  -600.711), rot: mod.CreateVector( 0.0,     -90.251,   0.0),       vehicle: mod.VehicleList.AH64         },
            { slotNumber: 4, pos: mod.CreateVector( 427.213,  85.239,  -587.691), rot: mod.CreateVector( 0.0,     -92.212,   0.0),       vehicle: mod.VehicleList.UH60_Pax     },
        ],
    },

    //Firestorm
    Operation_Firestorm: {
                                   //posX      posY      posZ 
        team1Base: mod.CreateVector( 570.692,  110.205, -232.341), team1Name: mod.stringkeys.twl.teams.WEST,
        team2Base: mod.CreateVector(-761.869,  133.091,  223.038), team2Name: mod.stringkeys.twl.teams.EAST,
        aircraftCeiling: 130,
        hudMaxY: 735,
        hudFloorY: 132,
        useCustomCeiling: true,
        // ObjId pattern per zone: AreaTrigger 200+, Sector 300+, WorldIcon 400+, CapturePoint 600+.
        overtimeZones: [
            { areaTriggerObjId: 200, sectorId: 300, worldIconObjId: 400, capturePointObjId: 600 }, // A
            { areaTriggerObjId: 201, sectorId: 301, worldIconObjId: 401, capturePointObjId: 601 }, // B
            { areaTriggerObjId: 202, sectorId: 302, worldIconObjId: 402, capturePointObjId: 602 }, // C
            { areaTriggerObjId: 203, sectorId: 303, worldIconObjId: 403, capturePointObjId: 603 }, // D
            { areaTriggerObjId: 204, sectorId: 304, worldIconObjId: 404, capturePointObjId: 604 }, // E
            { areaTriggerObjId: 205, sectorId: 305, worldIconObjId: 405, capturePointObjId: 605 }, // F
            { areaTriggerObjId: 206, sectorId: 306, worldIconObjId: 406, capturePointObjId: 606 }, // G
            { areaTriggerObjId: 207, sectorId: 307, worldIconObjId: 407, capturePointObjId: 607 }, // H
        ],
        overtimeZoneLettersByMode: {
            tanks: OVERTIME_TANK_ZONE_LETTERS,
            helis: OVERTIME_HELI_ZONE_LETTERS,
        },

        vehicleSpawnYawOffsetDeg: 0,

        team1TankSpawns: [                        //posX      posY      posZ                             rotX      rotY      rotZ
            { slotNumber: 1, pos: mod.CreateVector(-790.837,  132.971,  244.616), rot: mod.CreateVector( 0.0,      143.849,  0.0),       vehicle: mod.VehicleList.Abrams       },
            { slotNumber: 2, pos: mod.CreateVector(-785.022,  132.973,  246.953), rot: mod.CreateVector( 0.0,      140.047,  0.0),       vehicle: mod.VehicleList.Abrams       },
            { slotNumber: 3, pos: mod.CreateVector(-775.140,  132.971,  255.312), rot: mod.CreateVector( 0.0,      143.879,  0.0),       vehicle: mod.VehicleList.M2Bradley    },
            { slotNumber: 4, pos: mod.CreateVector(-770.277,  132.971,  259.296), rot: mod.CreateVector( 0.0,      141.651,  0.0),       vehicle: mod.VehicleList.Abrams       },

        ],
        team2TankSpawns: [                        //posX      posY      posZ                             posX      posY      posZ
            { slotNumber: 1, pos: mod.CreateVector( 601.735,  110.283, -230.246), rot: mod.CreateVector( 0.0,     -119.463,  0.0),       vehicle: mod.VehicleList.Leopard      },
            { slotNumber: 2, pos: mod.CreateVector( 608.379,  110.283, -233.569), rot: mod.CreateVector( 0.0,     -130.425,  0.0),       vehicle: mod.VehicleList.Leopard      },
            { slotNumber: 3, pos: mod.CreateVector( 615.366,  110.283, -243.288), rot: mod.CreateVector( 0.0,     -124.187,  0.0),       vehicle: mod.VehicleList.CV90         },
            { slotNumber: 4, pos: mod.CreateVector( 617.904,  110.297, -249.823), rot: mod.CreateVector( 0.0,     -125.702,  0.0),       vehicle: mod.VehicleList.Leopard      },
        ],
        team1HeliSpawns: [                        //posX      posY      posZ                             rotX      rotY      rotZ
            { slotNumber: 1, pos: mod.CreateVector(-811.597,  132.815,  234.165), rot: mod.CreateVector( 0.0,      105.178,  0.0),       vehicle: mod.VehicleList.AH64         },
            { slotNumber: 2, pos: mod.CreateVector(-767.544,  132.853,  172.755), rot: mod.CreateVector( 0.0,     -167.657,  0.0),       vehicle: mod.VehicleList.Eurocopter   },
            { slotNumber: 3, pos: mod.CreateVector(-782.131,  132.861,  198.011), rot: mod.CreateVector( 0.0,      48.206,   0.0),       vehicle: mod.VehicleList.AH64         },
            { slotNumber: 4, pos: mod.CreateVector(-738.726,  132.861,  209.182), rot: mod.CreateVector( 0.0,      115.606,  0.0),       vehicle: mod.VehicleList.UH60         },

        ],
        team2HeliSpawns: [                        //posX      posY      posZ                             posX      posY      posZ
            { slotNumber: 1, pos: mod.CreateVector( 553.976,  111.283, -256.070), rot: mod.CreateVector( 0.0,     -49.401,   0.0),       vehicle: mod.VehicleList.AH64         },
            { slotNumber: 2, pos: mod.CreateVector( 571.639,  111.174, -202.065), rot: mod.CreateVector( 0.0,     -46.728,   0.0),       vehicle: mod.VehicleList.Eurocopter   },
            { slotNumber: 3, pos: mod.CreateVector( 647.500,  110.562, -276.828), rot: mod.CreateVector( 0.0,     -126.059,  0.0),       vehicle: mod.VehicleList.AH64         },
            { slotNumber: 4, pos: mod.CreateVector( 636.239,  110.580, -258.841), rot: mod.CreateVector( 0.0,     -129.259,  0.0),       vehicle: mod.VehicleList.UH60_Pax     },
        ],
    },

    //Capstone
    Liberation_Peak: {
                                   //posX      posY      posZ 
        team1Base: mod.CreateVector(-323.365,  130.452,  83.211),  team1Name: mod.stringkeys.twl.teams.WEST,
        team2Base: mod.CreateVector( 281.887,  139.095,  464.187), team2Name: mod.stringkeys.twl.teams.EAST,
        aircraftCeiling: 160,
        hudMaxY: 635,
        hudFloorY: 139,
        useCustomCeiling: true,
        // ObjId pattern per zone: AreaTrigger 200+, Sector 300+, WorldIcon 400+, CapturePoint 600+.
        overtimeZones: [
            { areaTriggerObjId: 200, sectorId: 300, worldIconObjId: 400, capturePointObjId: 600 }, // A
            { areaTriggerObjId: 201, sectorId: 301, worldIconObjId: 401, capturePointObjId: 601 }, // B
            { areaTriggerObjId: 202, sectorId: 302, worldIconObjId: 402, capturePointObjId: 602 }, // C
            { areaTriggerObjId: 203, sectorId: 303, worldIconObjId: 403, capturePointObjId: 603 }, // D
            { areaTriggerObjId: 204, sectorId: 304, worldIconObjId: 404, capturePointObjId: 604 }, // E
            { areaTriggerObjId: 205, sectorId: 305, worldIconObjId: 405, capturePointObjId: 605 }, // F
            { areaTriggerObjId: 206, sectorId: 306, worldIconObjId: 406, capturePointObjId: 606 }, // G
            { areaTriggerObjId: 207, sectorId: 307, worldIconObjId: 407, capturePointObjId: 607 }, // H
        ],
        overtimeZoneLettersByMode: {
            tanks: OVERTIME_TANK_ZONE_LETTERS,
            helis: OVERTIME_HELI_ZONE_LETTERS,
        },
        
        vehicleSpawnYawOffsetDeg: 0,

        team1TankSpawns: [                        //posX      posY      posZ                             rotX      rotY      rotZ
            { slotNumber: 1, pos: mod.CreateVector(-313.122,  130.109,  91.317),  rot: mod.CreateVector( 0.0,      67.681,   0.0),       vehicle: mod.VehicleList.Abrams       },
            { slotNumber: 2, pos: mod.CreateVector(-306.857,  129.998,  84.500),  rot: mod.CreateVector( 0.0,      49.321,   0.0),       vehicle: mod.VehicleList.M2Bradley    },
            { slotNumber: 3, pos: mod.CreateVector(-309.858,  130.316,  102.124), rot: mod.CreateVector( 0.0,      61.442,   0.0),       vehicle: mod.VehicleList.Abrams       },
            { slotNumber: 4, pos: mod.CreateVector(-310.865,  130.825,  115.098), rot: mod.CreateVector( 0.0,      83.278,   0.0),       vehicle: mod.VehicleList.M2Bradley    },
        ],
        team2TankSpawns: [                        //posX      posY      posZ                             posX      posY      posZ
            { slotNumber: 1, pos: mod.CreateVector( 277.097,  139.725,  451.027), rot: mod.CreateVector( 0.0,     -157.176,  0.0),       vehicle: mod.VehicleList.Leopard      },
            { slotNumber: 2, pos: mod.CreateVector( 285.464,  139.449,  446.823), rot: mod.CreateVector( 0.0,     -137.924,  0.0),       vehicle: mod.VehicleList.CV90         },
            { slotNumber: 3, pos: mod.CreateVector( 270.023,  139.917,  457.538), rot: mod.CreateVector( 0.0,     -156.819,  0.0),       vehicle: mod.VehicleList.Leopard      },
            { slotNumber: 4, pos: mod.CreateVector( 257.938,  139.403,  459.032), rot: mod.CreateVector( 0.0,      162.094,  0.0),       vehicle: mod.VehicleList.CV90         },
        ],
        team1HeliSpawns: [                        //posX      posY      posZ                             rotX      rotY      rotZ
            { slotNumber: 1, pos: mod.CreateVector(-277.906,  130.461,  95.484),  rot: mod.CreateVector( 0.0,      130.773,  0.0),       vehicle: mod.VehicleList.AH64         },
            { slotNumber: 2, pos: mod.CreateVector(-284.413,  130.632,  85.634),  rot: mod.CreateVector( 0.0,      137.714,  0.0),       vehicle: mod.VehicleList.Eurocopter   },
            { slotNumber: 3, pos: mod.CreateVector(-326.491,  129.927,  82.657),  rot: mod.CreateVector( 0.0,     -23.622,   0.0),       vehicle: mod.VehicleList.AH64         },
            { slotNumber: 4, pos: mod.CreateVector(-348.578,  129.416,  77.118),  rot: mod.CreateVector( 0.0,     -22.475,   0.0),       vehicle: mod.VehicleList.UH60         },
        ],
        team2HeliSpawns: [                        //posX      posY      posZ                             posX      posY      posZ
            { slotNumber: 1, pos: mod.CreateVector( 255.257,  139.435,  459.687), rot: mod.CreateVector( 0.0,     -147.497,  0.0),       vehicle: mod.VehicleList.AH64         },
            { slotNumber: 2, pos: mod.CreateVector( 268.319,  139.781,  452.979), rot: mod.CreateVector( 0.0,     -154.694,  0.0),       vehicle: mod.VehicleList.Eurocopter   },
            { slotNumber: 3, pos: mod.CreateVector( 288.061,  139.34,   447.63),  rot: mod.CreateVector( 0.0,     -152.953,  0.0),       vehicle: mod.VehicleList.AH64         },
            { slotNumber: 4, pos: mod.CreateVector( 315.307,  136.512,  490.611), rot: mod.CreateVector( 0.0,     -144.246,  0.0),       vehicle: mod.VehicleList.UH60_Pax     },
        ],
    },

    //Dumbo
    Manhattan_Bridge: {
                                   //posX      posY      posZ 
        team1Base: mod.CreateVector(-263.312,  52.308,  -460.612), team1Name: mod.stringkeys.twl.teams.WEST,
        team2Base: mod.CreateVector( 176.053,  57.474,  -243.843), team2Name: mod.stringkeys.twl.teams.EAST,
        aircraftCeiling: 190,
        hudMaxY: 180,
        hudFloorY: 57,
        useCustomCeiling: false,
        // ObjId pattern per zone: AreaTrigger 200+, Sector 300+, WorldIcon 400+, CapturePoint 600+.
        overtimeZones: [
            { areaTriggerObjId: 200, sectorId: 300, worldIconObjId: 400, capturePointObjId: 600 }, // A
            { areaTriggerObjId: 201, sectorId: 301, worldIconObjId: 401, capturePointObjId: 601 }, // B
            { areaTriggerObjId: 202, sectorId: 302, worldIconObjId: 402, capturePointObjId: 602 }, // C
            { areaTriggerObjId: 203, sectorId: 303, worldIconObjId: 403, capturePointObjId: 603 }, // D
            { areaTriggerObjId: 204, sectorId: 304, worldIconObjId: 404, capturePointObjId: 604 }, // E
            { areaTriggerObjId: 205, sectorId: 305, worldIconObjId: 405, capturePointObjId: 605 }, // F
            { areaTriggerObjId: 206, sectorId: 306, worldIconObjId: 406, capturePointObjId: 606 }, // G
            { areaTriggerObjId: 207, sectorId: 307, worldIconObjId: 407, capturePointObjId: 607 }, // H
        ],
        overtimeZoneLettersByMode: {
            tanks: OVERTIME_TANK_ZONE_LETTERS,
            helis: OVERTIME_HELI_ZONE_LETTERS,
        },
       
        vehicleSpawnYawOffsetDeg: 0,

        team1TankSpawns: [                        //posX      posY      posZ                             rotX      rotY      rotZ
            { slotNumber: 1, pos: mod.CreateVector(-260.317,  52.079,  -451.475), rot: mod.CreateVector( 0.0,      34.687,   0.0),       vehicle: mod.VehicleList.Abrams       },
            { slotNumber: 2, pos: mod.CreateVector(-270.061,  52.079,  -448.680), rot: mod.CreateVector( 0.0,      52.245,   0.0),       vehicle: mod.VehicleList.M2Bradley    },
            { slotNumber: 3, pos: mod.CreateVector(-281.962,  52.079,  -448.604), rot: mod.CreateVector( 0.0,      52.067,   0.0),       vehicle: mod.VehicleList.Abrams       },
            { slotNumber: 4, pos: mod.CreateVector(-294.428,  52.079,  -448.772), rot: mod.CreateVector( 0.0,      40.659,   0.0),       vehicle: mod.VehicleList.M2Bradley    },
        ],
        team2TankSpawns: [                        //posX      posY      posZ                             posX      posY      posZ
            { slotNumber: 1, pos: mod.CreateVector( 205.271,  57.358,  -239.774), rot: mod.CreateVector( 0.0,     -90.0,     0.0),       vehicle: mod.VehicleList.Leopard      },
            { slotNumber: 2, pos: mod.CreateVector( 205.549,  57.358,  -247.822), rot: mod.CreateVector( 0.0,     -90.0,     0.0),       vehicle: mod.VehicleList.CV90         },
            { slotNumber: 3, pos: mod.CreateVector( 205.294,  57.358,  -251.986), rot: mod.CreateVector( 0.0,     -90.0,     0.0),       vehicle: mod.VehicleList.Leopard      },
            { slotNumber: 4, pos: mod.CreateVector( 202.707,  57.358,  -257.240), rot: mod.CreateVector( 0.0,     -90.0,     0.0),       vehicle: mod.VehicleList.CV90         },
        ],
        team1HeliSpawns: [                        //posX      posY      posZ                             rotX      rotY      rotZ
            { slotNumber: 1, pos: mod.CreateVector(-294.619,  51.391,  -462.816), rot: mod.CreateVector( 0.0,      90.308,   0.0),       vehicle: mod.VehicleList.AH64         },
            { slotNumber: 2, pos: mod.CreateVector(-248.193,  50.765,  -484.679), rot: mod.CreateVector( 0.0,      48.708,   0.0),       vehicle: mod.VehicleList.Eurocopter   },
            { slotNumber: 3, pos: mod.CreateVector(-330.070,  52.162,  -440.936), rot: mod.CreateVector( 0.0,      90.418,   0.0),       vehicle: mod.VehicleList.AH64         },
            { slotNumber: 4, pos: mod.CreateVector(-235.514,  50.891,  -503.161), rot: mod.CreateVector( 0.0,      59.224,   0.0),       vehicle: mod.VehicleList.UH60         },
        ],
        team2HeliSpawns: [                        //posX      posY      posZ                             posX      posY      posZ
            { slotNumber: 1, pos: mod.CreateVector( 182.774,  57.278,  -232.360), rot: mod.CreateVector( 0.0,     -104.021,  0.0),       vehicle: mod.VehicleList.AH64         },
            { slotNumber: 2, pos: mod.CreateVector( 173.916,  57.278,  -214.198), rot: mod.CreateVector( 0.0,     -178.439,  0.0),       vehicle: mod.VehicleList.Eurocopter   },
            { slotNumber: 3, pos: mod.CreateVector( 186.823,  57.278,  -211.892), rot: mod.CreateVector( 0.0,     -178.709,  0.0),       vehicle: mod.VehicleList.AH64         },
            { slotNumber: 4, pos: mod.CreateVector( 179.475,  57.278,  -195.944), rot: mod.CreateVector( 0.0,     -90.0,     0.0),       vehicle: mod.VehicleList.UH60_Pax     },
        ],
    },

    //Sobek City
    Sobek_City: {
                                   //posX      posY      posZ 
        team1Base: mod.CreateVector(-340.465,  92.557,  -110.315), team1Name: mod.stringkeys.twl.teams.WEST,
        team2Base: mod.CreateVector( 200.196,  90.167,   10.717),  team2Name: mod.stringkeys.twl.teams.EAST,
        aircraftCeiling: 150,
        hudMaxY: 270,
        hudFloorY: 91,
        useCustomCeiling: true,
        // ObjId pattern per zone: AreaTrigger 200+, Sector 300+, WorldIcon 400+, CapturePoint 600+.
        overtimeZones: [
            { areaTriggerObjId: 200, sectorId: 300, worldIconObjId: 400, capturePointObjId: 600 }, // A
            { areaTriggerObjId: 201, sectorId: 301, worldIconObjId: 401, capturePointObjId: 601 }, // B
            { areaTriggerObjId: 202, sectorId: 302, worldIconObjId: 402, capturePointObjId: 602 }, // C
            { areaTriggerObjId: 203, sectorId: 303, worldIconObjId: 403, capturePointObjId: 603 }, // D
            { areaTriggerObjId: 204, sectorId: 304, worldIconObjId: 404, capturePointObjId: 604 }, // E
            { areaTriggerObjId: 205, sectorId: 305, worldIconObjId: 405, capturePointObjId: 605 }, // F
            { areaTriggerObjId: 206, sectorId: 306, worldIconObjId: 406, capturePointObjId: 606 }, // G
            { areaTriggerObjId: 207, sectorId: 307, worldIconObjId: 407, capturePointObjId: 607 }, // H
        ],
        overtimeZoneLettersByMode: {
            tanks: OVERTIME_TANK_ZONE_LETTERS,
            helis: OVERTIME_HELI_ZONE_LETTERS,
        },
        
        vehicleSpawnYawOffsetDeg: 0,

        team1TankSpawns: [                        //posX      posY      posZ                             rotX      rotY      rotZ
            { slotNumber: 1, pos: mod.CreateVector(-313.122,  130.109,  91.317),  rot: mod.CreateVector( 0.0,      67.681,   0.0),       vehicle: mod.VehicleList.Abrams       },
            { slotNumber: 2, pos: mod.CreateVector(-306.857,  129.998,  84.500),  rot: mod.CreateVector( 0.0,      49.321,   0.0),       vehicle: mod.VehicleList.M2Bradley    },
            { slotNumber: 3, pos: mod.CreateVector(-309.858,  130.316,  102.124), rot: mod.CreateVector( 0.0,      61.442,   0.0),       vehicle: mod.VehicleList.Abrams       },
            { slotNumber: 4, pos: mod.CreateVector(-310.865,  130.825,  115.098), rot: mod.CreateVector( 0.0,      83.278,   0.0),       vehicle: mod.VehicleList.M2Bradley    },
        ],
        team2TankSpawns: [                        //posX      posY      posZ                             posX      posY      posZ
            { slotNumber: 1, pos: mod.CreateVector( 277.097,  139.725,  451.027), rot: mod.CreateVector( 0.0,     -157.176,  0.0),       vehicle: mod.VehicleList.Leopard      },
            { slotNumber: 2, pos: mod.CreateVector( 285.464,  139.449,  446.823), rot: mod.CreateVector( 0.0,     -137.924,  0.0),       vehicle: mod.VehicleList.CV90         },
            { slotNumber: 3, pos: mod.CreateVector( 270.023,  139.917,  457.538), rot: mod.CreateVector( 0.0,     -156.819,  0.0),       vehicle: mod.VehicleList.Leopard      },
            { slotNumber: 4, pos: mod.CreateVector( 257.938,  139.403,  459.032), rot: mod.CreateVector( 0.0,      162.094,  0.0),       vehicle: mod.VehicleList.CV90         },
        ],
        team1HeliSpawns: [                        //posX      posY      posZ                             rotX      rotY      rotZ
            { slotNumber: 1, pos: mod.CreateVector(-329.600,  91.704,  -102.008), rot: mod.CreateVector( 0.0,      101.481,  0.0),       vehicle: mod.VehicleList.AH64         },
            { slotNumber: 2, pos: mod.CreateVector(-319.809,  91.704,  -86.577),  rot: mod.CreateVector( 0.0,      121.801,  0.0),       vehicle: mod.VehicleList.Eurocopter   },
            { slotNumber: 3, pos: mod.CreateVector(-313.32,   92.297,  -73.7171), rot: mod.CreateVector( 0.0,      113.958,  0.0),       vehicle: mod.VehicleList.AH64         },
            { slotNumber: 4, pos: mod.CreateVector(-352.007,  92.395,  -126.313), rot: mod.CreateVector( 0.0,      23.305,   0.0),       vehicle: mod.VehicleList.UH60         },
        ],
        team2HeliSpawns: [                        //posX      posY      posZ                             posX      posY      posZ
            { slotNumber: 1, pos: mod.CreateVector( 210.864,  90.152,   10.986),  rot: mod.CreateVector( 0.0,     -125.319,  0.0),       vehicle: mod.VehicleList.AH64         },
            { slotNumber: 2, pos: mod.CreateVector( 202.300,  90.151,   23.839),  rot: mod.CreateVector( 0.0,     -129.553,  0.0),       vehicle: mod.VehicleList.Eurocopter   },
            { slotNumber: 3, pos: mod.CreateVector( 225.784,  91.31,    36.228),  rot: mod.CreateVector( 0.0,      140.278,  0.0),       vehicle: mod.VehicleList.AH64         },
            { slotNumber: 4, pos: mod.CreateVector( 232.906,  90.271,  -8.33),    rot: mod.CreateVector( 0.0,     -131.309,  0.0),       vehicle: mod.VehicleList.UH60_Pax     },
        ],
    },
    
    //Granite Military RND Port
    Area_22B: {
                                   //posX      posY      posZ 
        team1Base: mod.CreateVector( 181.327,  173.193, -399.201), team1Name: mod.stringkeys.twl.teams.WEST,
        team2Base: mod.CreateVector( 782.013,  178.028, -508.792), team2Name: mod.stringkeys.twl.teams.EAST,
        aircraftCeiling: 650,
        hudMaxY: 650,
        hudFloorY: 82,
        useCustomCeiling: false,
        // ObjId pattern per zone: AreaTrigger 200+, Sector 300+, WorldIcon 400+, CapturePoint 600+.
        overtimeZones: [
            { areaTriggerObjId: 200, sectorId: 300, worldIconObjId: 400, capturePointObjId: 600 }, // A
            { areaTriggerObjId: 201, sectorId: 301, worldIconObjId: 401, capturePointObjId: 601 }, // B
            { areaTriggerObjId: 202, sectorId: 302, worldIconObjId: 402, capturePointObjId: 602 }, // C
            { areaTriggerObjId: 203, sectorId: 303, worldIconObjId: 403, capturePointObjId: 603 }, // D
            { areaTriggerObjId: 204, sectorId: 304, worldIconObjId: 404, capturePointObjId: 604 }, // E
            { areaTriggerObjId: 205, sectorId: 305, worldIconObjId: 405, capturePointObjId: 605 }, // F
            { areaTriggerObjId: 206, sectorId: 306, worldIconObjId: 406, capturePointObjId: 606 }, // G
            { areaTriggerObjId: 207, sectorId: 307, worldIconObjId: 407, capturePointObjId: 607 }, // H
        ],
        overtimeZoneLettersByMode: {
            tanks: OVERTIME_TANK_ZONE_LETTERS,
            helis: OVERTIME_HELI_ZONE_LETTERS,
        },
       
        vehicleSpawnYawOffsetDeg: 0,

        team1TankSpawns: [                        //posX      posY      posZ                             rotX      rotY      rotZ
            { slotNumber: 1, pos: mod.CreateVector( 203.464,  173.651, -404.496), rot: mod.CreateVector( 0.0,      152.721,  0.0),       vehicle: mod.VehicleList.Abrams       },
            { slotNumber: 2, pos: mod.CreateVector( 198.157,  173.651, -411.804), rot: mod.CreateVector( 0.0,      152.632,  0.0),       vehicle: mod.VehicleList.M2Bradley    },
            { slotNumber: 3, pos: mod.CreateVector( 196.606,  173.521, -426.489), rot: mod.CreateVector( 0.0,      152.899,  0.0),       vehicle: mod.VehicleList.M2Bradley    },
            { slotNumber: 4, pos: mod.CreateVector( 195.018,  173.655, -440.699), rot: mod.CreateVector( 0.0,      152.543,  0.0),       vehicle: mod.VehicleList.Abrams       },
        ],
        team2TankSpawns: [                        //posX      posY      posZ                             posX      posY      posZ
            { slotNumber: 1, pos: mod.CreateVector( 805.706,  177.624, -474.481), rot: mod.CreateVector( 0.0,     -159.419,  0.0),       vehicle: mod.VehicleList.Leopard      },
            { slotNumber: 2, pos: mod.CreateVector( 799.506,  177.669, -490.156), rot: mod.CreateVector( 0.0,     -157.548,  0.0),       vehicle: mod.VehicleList.CV90         },
            { slotNumber: 3, pos: mod.CreateVector( 792.561,  177.628, -506.645), rot: mod.CreateVector( 0.0,     -156.924,  0.0),       vehicle: mod.VehicleList.CV90         },
            { slotNumber: 4, pos: mod.CreateVector( 786.340,  177.605, -520.613), rot: mod.CreateVector( 0.0,     -155.083,  0.0),       vehicle: mod.VehicleList.Leopard      },
        ],
    },
};

// MapKey -> Strings.json key mapping for the Ready dialog map label.
const MAP_NAME_STRINGKEYS: Record<MapKey, number> = {
    Blackwell_Fields: mod.stringkeys.twl.maps.blackwellFields,
    Defense_Nexus: mod.stringkeys.twl.maps.defenseNexus,
    Golf_Course: mod.stringkeys.twl.maps.golfCourse,
    Mirak_Valley: mod.stringkeys.twl.maps.mirakValley,
    Operation_Firestorm: mod.stringkeys.twl.maps.operationFirestorm,
    Liberation_Peak: mod.stringkeys.twl.maps.liberationPeak,
    Manhattan_Bridge: mod.stringkeys.twl.maps.manhattanBridge,
    Sobek_City: mod.stringkeys.twl.maps.sobekCity,
    Area_22B: mod.stringkeys.twl.maps.area22B,
};

// Expected to include team bases + at least one spawn per team, with unique slotNumber values matching per side.
let ACTIVE_MAP_CONFIG = MAP_CONFIGS[ACTIVE_MAP_KEY];
// Active map's curated overtime zones (AreaTrigger ObjId + Sector Id + WorldIcon ObjId + CapturePoint ObjId).
let ACTIVE_OVERTIME_ZONES: OvertimeZoneSpec[] = (ACTIVE_MAP_CONFIG.overtimeZones ?? []).map((zone) => ({
    areaTriggerObjId: zone.areaTriggerObjId,
    sectorId: zone.sectorId,
    worldIconObjId: zone.worldIconObjId,
    capturePointObjId: zone.capturePointObjId,
}));

// Baseline team inference from static main-base anchor coordinates (Option A).
// - Replace these vectors with exact map coordinates through MapConfig; these positions drive fallback team registration.
// - A spawned vehicle is assigned to the nearest base anchor if within MAIN_BASE_BIND_RADIUS_METERS.
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

//#endregion ----------------- Map Config (Constants + Types) --------------------



//#region -------------------- Map + Matchup Helpers --------------------

// Returns the Ready-dialog display stringkey for the current map.
function getMapNameKey(mapKey: MapKey): number {
    return MAP_NAME_STRINGKEYS[mapKey] ?? mod.stringkeys.twl.system.unknownPlayer;
}

// Determines whether the current mode selection should use heli spawns.
function isHeliGameMode(gameModeKey: number): boolean {
    return (
        gameModeKey === mod.stringkeys.twl.readyDialog.gameModeHelisLadder
        || gameModeKey === mod.stringkeys.twl.readyDialog.gameModeHelisPractice
        || gameModeKey === mod.stringkeys.twl.readyDialog.gameModeHelisCustom
    );
}

// Builds a basic heli spawn list from tank spawn positions when no map-specific heli list exists yet.
function buildHeliSpawnsFromTankSpawns(spawns: VehicleSpawnSpec[], team: TeamID): VehicleSpawnSpec[] {
    const attackVehicle = team === TeamID.Team1 ? mod.VehicleList.AH64 : mod.VehicleList.Eurocopter;
    const transportVehicle = team === TeamID.Team1 ? mod.VehicleList.UH60 : mod.VehicleList.UH60_Pax;
    return spawns.map((spawn) => ({
        slotNumber: spawn.slotNumber,
        pos: spawn.pos,
        rot: spawn.rot,
        vehicle: spawn.slotNumber === 3 ? transportVehicle : attackVehicle,
    }));
}

function resolveHeliSpawnsForTeam(cfg: MapConfig, team: TeamID): VehicleSpawnSpec[] {
    if (team === TeamID.Team1) {
        if (cfg.team1HeliSpawns && cfg.team1HeliSpawns.length > 0) return cfg.team1HeliSpawns;
        return buildHeliSpawnsFromTankSpawns(cfg.team1TankSpawns, TeamID.Team1);
    }
    if (cfg.team2HeliSpawns && cfg.team2HeliSpawns.length > 0) return cfg.team2HeliSpawns;
    return buildHeliSpawnsFromTankSpawns(cfg.team2TankSpawns, TeamID.Team2);
}

function getReadyDialogVehicleListByIndex(index: number): mod.VehicleList {
    return READY_DIALOG_VEHICLE_LIST[index] ?? READY_DIALOG_VEHICLE_LIST[0];
}

function applyVehicleOverrideToSpawns(spawns: VehicleSpawnSpec[], vehicle: mod.VehicleList): VehicleSpawnSpec[] {
    return spawns.map((spawn) => ({
        slotNumber: spawn.slotNumber,
        pos: spawn.pos,
        rot: spawn.rot,
        vehicle,
    }));
}

function refreshVehicleSpawnSpecsFromModeConfig(): void {
    const useHelis = isHeliGameMode(State.round.modeConfig.confirmed.gameMode);
    if (useHelis) {
        const baseT1 = resolveHeliSpawnsForTeam(ACTIVE_MAP_CONFIG, TeamID.Team1);
        const baseT2 = resolveHeliSpawnsForTeam(ACTIVE_MAP_CONFIG, TeamID.Team2);
        if (State.round.modeConfig.confirmed.vehicleOverrideEnabled) {
            // Global override: use a single heli selection for all heli spawn slots.
            const overrideVehicle = getReadyDialogVehicleListByIndex(State.round.modeConfig.confirmed.vehicleIndexT1);
            TEAM1_VEHICLE_SPAWN_SPECS = applyVehicleOverrideToSpawns(baseT1, overrideVehicle);
            TEAM2_VEHICLE_SPAWN_SPECS = applyVehicleOverrideToSpawns(baseT2, overrideVehicle);
            return;
        }
        TEAM1_VEHICLE_SPAWN_SPECS = baseT1;
        TEAM2_VEHICLE_SPAWN_SPECS = baseT2;
        return;
    }
    TEAM1_VEHICLE_SPAWN_SPECS = ACTIVE_MAP_CONFIG.team1TankSpawns;
    TEAM2_VEHICLE_SPAWN_SPECS = ACTIVE_MAP_CONFIG.team2TankSpawns;
}

function applyVehicleSpawnSpecsToExistingSlots(): void {
    if (State.vehicles.slots.length === 0) return;
    const team1BySlot: Record<number, VehicleSpawnSpec> = {};
    const team2BySlot: Record<number, VehicleSpawnSpec> = {};
    for (const spec of TEAM1_VEHICLE_SPAWN_SPECS) {
        team1BySlot[spec.slotNumber] = spec;
    }
    for (const spec of TEAM2_VEHICLE_SPAWN_SPECS) {
        team2BySlot[spec.slotNumber] = spec;
    }
    for (const slot of State.vehicles.slots) {
        const spec = slot.teamId === TeamID.Team1 ? team1BySlot[slot.slotNumber] : team2BySlot[slot.slotNumber];
        if (!spec) continue;
        if (slot.vehicleType === spec.vehicle) continue;
        slot.vehicleType = spec.vehicle;
        configureVehicleSpawner(slot.spawner, slot.vehicleType);
    }
}

// Applies the selected map's base anchors, spawn specs, and yaw offsets to the active runtime config.
// Also refreshes the Ready dialog map label so the UI matches the active map.
function applyMapConfig(mapKey: MapKey): void {
    ACTIVE_MAP_KEY = mapKey;
    ACTIVE_MAP_CONFIG = MAP_CONFIGS[ACTIVE_MAP_KEY];
    MAIN_BASE_TEAM1_POS = ACTIVE_MAP_CONFIG.team1Base;
    MAIN_BASE_TEAM2_POS = ACTIVE_MAP_CONFIG.team2Base;
    refreshVehicleSpawnSpecsFromModeConfig();
    VEHICLE_SPAWN_YAW_OFFSET_DEG = ACTIVE_MAP_CONFIG.vehicleSpawnYawOffsetDeg;
    ACTIVE_OVERTIME_ZONES = (ACTIVE_MAP_CONFIG.overtimeZones ?? []).map((zone) => ({
        areaTriggerObjId: zone.areaTriggerObjId,
        sectorId: zone.sectorId,
        worldIconObjId: zone.worldIconObjId,
        capturePointObjId: zone.capturePointObjId,
    }));
    // Keep overtime zones synced with the active map config.
    refreshOvertimeZonesFromMapConfig();
    // Apply the map's default aircraft ceiling, unless a custom override is active.
    syncAircraftCeilingFromMapConfig();

    updateReadyDialogMapLabelForAllPlayers();
    updateTeamNameWidgetsForAllPlayers();
}

// Best-effort map detection by comparing HQ positions to map base anchors (bidirectional check).
function detectMapKeyFromHqs(): MapKey | undefined {
    const hq1Pos = mod.GetObjectPosition(mod.GetHQ(1));
    const hq2Pos = mod.GetObjectPosition(mod.GetHQ(2));

    const keys = Object.keys(MAP_CONFIGS) as MapKey[];
    for (const key of keys) {
        const cfg = MAP_CONFIGS[key];
        const d11 = mod.DistanceBetween(hq1Pos, cfg.team1Base);
        const d22 = mod.DistanceBetween(hq2Pos, cfg.team2Base);
        if (d11 <= MAP_DETECT_DISTANCE_METERS && d22 <= MAP_DETECT_DISTANCE_METERS) {
            return key;
        }

        const d12 = mod.DistanceBetween(hq1Pos, cfg.team2Base);
        const d21 = mod.DistanceBetween(hq2Pos, cfg.team1Base);
        if (d12 <= MAP_DETECT_DISTANCE_METERS && d21 <= MAP_DETECT_DISTANCE_METERS) {
            return key;
        }
    }

    return undefined;
}

// Finds the preset index matching left/right players + kill target; returns 0 if no exact match.
function findMatchupPresetIndex(leftPlayers: number, rightPlayers: number, roundKillsTarget: number): number {
    for (let i = 0; i < MATCHUP_PRESETS.length; i++) {
        const preset = MATCHUP_PRESETS[i];
        if (
            preset.leftPlayers === leftPlayers &&
            preset.rightPlayers === rightPlayers &&
            preset.roundKillsTarget === roundKillsTarget
        ) {
            return i;
        }
    }
    return 0;
}

//#endregion ----------------- Map + Matchup Helpers --------------------



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
const UI_TEAMSWITCH_BORDER_TOP_ID = "UI_TEAMSWITCH_BORDER_TOP_";
const UI_TEAMSWITCH_BORDER_BOTTOM_ID = "UI_TEAMSWITCH_BORDER_BOTTOM_";
const UI_TEAMSWITCH_BORDER_LEFT_ID = "UI_TEAMSWITCH_BORDER_LEFT_";
const UI_TEAMSWITCH_BORDER_RIGHT_ID = "UI_TEAMSWITCH_BORDER_RIGHT_";
const UI_TEAMSWITCH_BUTTON_TEAM1_ID = "UI_TEAMSWITCH_BUTTON_TEAM1_";
const UI_TEAMSWITCH_BUTTON_TEAM2_ID = "UI_TEAMSWITCH_BUTTON_TEAM2_";
const UI_TEAMSWITCH_BUTTON_CANCEL_ID = "UI_TEAMSWITCH_BUTTON_CANCEL_";
const UI_TEAMSWITCH_BUTTON_CANCEL_LABEL_ID = "UI_TEAMSWITCH_BUTTON_CANCEL_LABEL_";
const UI_TEAMSWITCH_BUTTON_OPTOUT_ID = "UI_TEAMSWITCH_BUTTON_OPTOUT_";
const UI_TEAMSWITCH_DEBUG_TIMELIMIT_ID = "UI_TEAMSWITCH_DEBUG_TIMELIMIT_";

// Ready Dialog (Roster UI) - Widget ID bases (per-player IDs append viewer playerId).
const UI_READY_DIALOG_HEADER_ID = "UI_READY_DIALOG_HEADER_";
const UI_READY_DIALOG_HEADER2_ID = "UI_READY_DIALOG_HEADER2_";
const UI_READY_DIALOG_HEADER3_ID = "UI_READY_DIALOG_HEADER3_";
const UI_READY_DIALOG_HEADER4_ID = "UI_READY_DIALOG_HEADER4_";
const UI_READY_DIALOG_HEADER5_ID = "UI_READY_DIALOG_HEADER5_";
const UI_READY_DIALOG_HEADER6_ID = "UI_READY_DIALOG_HEADER6_";
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
const UI_READY_DIALOG_BUTTON_AUTO_READY_ID = "UI_READY_DIALOG_BUTTON_AUTO_READY_";
const UI_READY_DIALOG_BUTTON_AUTO_READY_LABEL_ID = "UI_READY_DIALOG_BUTTON_AUTO_READY_LABEL_";
const UI_READY_DIALOG_BUTTON_SWAP_ID = "UI_READY_DIALOG_BUTTON_SWAP_";
const UI_READY_DIALOG_BUTTON_SWAP_LABEL_ID = "UI_READY_DIALOG_BUTTON_SWAP_LABEL_";
const UI_READY_DIALOG_BESTOF_LABEL_ID = "UI_READY_DIALOG_BESTOF_LABEL_";
const UI_READY_DIALOG_BESTOF_DEC_ID = "UI_READY_DIALOG_BESTOF_DEC_";
const UI_READY_DIALOG_BESTOF_DEC_LABEL_ID = "UI_READY_DIALOG_BESTOF_DEC_LABEL_";
const UI_READY_DIALOG_BESTOF_INC_ID = "UI_READY_DIALOG_BESTOF_INC_";
const UI_READY_DIALOG_BESTOF_INC_LABEL_ID = "UI_READY_DIALOG_BESTOF_INC_LABEL_";
const UI_READY_DIALOG_MATCHUP_DEC_ID = "UI_READY_DIALOG_MATCHUP_DEC_";
const UI_READY_DIALOG_MATCHUP_DEC_LABEL_ID = "UI_READY_DIALOG_MATCHUP_DEC_LABEL_";
const UI_READY_DIALOG_MATCHUP_LABEL_ID = "UI_READY_DIALOG_MATCHUP_LABEL_";
const UI_READY_DIALOG_MATCHUP_INC_ID = "UI_READY_DIALOG_MATCHUP_INC_";
const UI_READY_DIALOG_MATCHUP_INC_LABEL_ID = "UI_READY_DIALOG_MATCHUP_INC_LABEL_";
const UI_READY_DIALOG_MINPLAYERS_DEC_ID = "UI_READY_DIALOG_MINPLAYERS_DEC_";
const UI_READY_DIALOG_MINPLAYERS_DEC_LABEL_ID = "UI_READY_DIALOG_MINPLAYERS_DEC_LABEL_";
const UI_READY_DIALOG_MINPLAYERS_INC_ID = "UI_READY_DIALOG_MINPLAYERS_INC_";
const UI_READY_DIALOG_MINPLAYERS_INC_LABEL_ID = "UI_READY_DIALOG_MINPLAYERS_INC_LABEL_";
const UI_READY_DIALOG_MATCHUP_MINPLAYERS_ID = "UI_READY_DIALOG_MATCHUP_MINPLAYERS_";
const UI_READY_DIALOG_MATCHUP_MINPLAYERS_TOTAL_ID = "UI_READY_DIALOG_MATCHUP_MINPLAYERS_TOTAL_";
const UI_READY_DIALOG_MATCHUP_KILLSTARGET_ID = "UI_READY_DIALOG_MATCHUP_KILLSTARGET_";
const UI_READY_DIALOG_MAP_LABEL_ID = "UI_READY_DIALOG_MAP_LABEL_";
const UI_READY_DIALOG_MAP_VALUE_ID = "UI_READY_DIALOG_MAP_VALUE_";
const UI_READY_DIALOG_MODE_GAME_LABEL_ID = "UI_READY_DIALOG_MODE_GAME_LABEL_";
const UI_READY_DIALOG_MODE_GAME_DEC_ID = "UI_READY_DIALOG_MODE_GAME_DEC_";
const UI_READY_DIALOG_MODE_GAME_DEC_LABEL_ID = "UI_READY_DIALOG_MODE_GAME_DEC_LABEL_";
const UI_READY_DIALOG_MODE_GAME_VALUE_ID = "UI_READY_DIALOG_MODE_GAME_VALUE_";
const UI_READY_DIALOG_MODE_GAME_INC_ID = "UI_READY_DIALOG_MODE_GAME_INC_";
const UI_READY_DIALOG_MODE_GAME_INC_LABEL_ID = "UI_READY_DIALOG_MODE_GAME_INC_LABEL_";
const UI_READY_DIALOG_MODE_SETTINGS_LABEL_ID = "UI_READY_DIALOG_MODE_SETTINGS_LABEL_";
const UI_READY_DIALOG_MODE_SETTINGS_DEC_ID = "UI_READY_DIALOG_MODE_SETTINGS_DEC_";
const UI_READY_DIALOG_MODE_SETTINGS_DEC_LABEL_ID = "UI_READY_DIALOG_MODE_SETTINGS_DEC_LABEL_";
const UI_READY_DIALOG_MODE_SETTINGS_VALUE_ID = "UI_READY_DIALOG_MODE_SETTINGS_VALUE_";
const UI_READY_DIALOG_MODE_SETTINGS_INC_ID = "UI_READY_DIALOG_MODE_SETTINGS_INC_";
const UI_READY_DIALOG_MODE_SETTINGS_INC_LABEL_ID = "UI_READY_DIALOG_MODE_SETTINGS_INC_LABEL_";
const UI_READY_DIALOG_MODE_VEHICLES_T1_LABEL_ID = "UI_READY_DIALOG_MODE_VEHICLES_T1_LABEL_";
const UI_READY_DIALOG_MODE_VEHICLES_T1_DEC_ID = "UI_READY_DIALOG_MODE_VEHICLES_T1_DEC_";
const UI_READY_DIALOG_MODE_VEHICLES_T1_DEC_LABEL_ID = "UI_READY_DIALOG_MODE_VEHICLES_T1_DEC_LABEL_";
const UI_READY_DIALOG_MODE_VEHICLES_T1_VALUE_ID = "UI_READY_DIALOG_MODE_VEHICLES_T1_VALUE_";
const UI_READY_DIALOG_MODE_VEHICLES_T1_INC_ID = "UI_READY_DIALOG_MODE_VEHICLES_T1_INC_";
const UI_READY_DIALOG_MODE_VEHICLES_T1_INC_LABEL_ID = "UI_READY_DIALOG_MODE_VEHICLES_T1_INC_LABEL_";
const UI_READY_DIALOG_MODE_VEHICLES_T2_LABEL_ID = "UI_READY_DIALOG_MODE_VEHICLES_T2_LABEL_";
const UI_READY_DIALOG_MODE_VEHICLES_T2_DEC_ID = "UI_READY_DIALOG_MODE_VEHICLES_T2_DEC_";
const UI_READY_DIALOG_MODE_VEHICLES_T2_DEC_LABEL_ID = "UI_READY_DIALOG_MODE_VEHICLES_T2_DEC_LABEL_";
const UI_READY_DIALOG_MODE_VEHICLES_T2_VALUE_ID = "UI_READY_DIALOG_MODE_VEHICLES_T2_VALUE_";
const UI_READY_DIALOG_MODE_VEHICLES_T2_INC_ID = "UI_READY_DIALOG_MODE_VEHICLES_T2_INC_";
const UI_READY_DIALOG_MODE_VEHICLES_T2_INC_LABEL_ID = "UI_READY_DIALOG_MODE_VEHICLES_T2_INC_LABEL_";
const UI_READY_DIALOG_MODE_CONFIRM_ID = "UI_READY_DIALOG_MODE_CONFIRM_";
const UI_READY_DIALOG_MODE_CONFIRM_LABEL_ID = "UI_READY_DIALOG_MODE_CONFIRM_LABEL_";
const UI_READY_DIALOG_MODE_RESET_ID = "UI_READY_DIALOG_MODE_RESET_";
const UI_READY_DIALOG_MODE_RESET_LABEL_ID = "UI_READY_DIALOG_MODE_RESET_LABEL_";

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
const UI_TEST_BUTTON_POS_DEBUG_ID = "UI_TEST_BUTTON_POS_DEBUG_";
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
const UI_TEST_POS_DEBUG_TEXT_ID = "UI_TEST_POS_DEBUG_TEXT_";
const UI_ADMIN_TIEBREAKER_LABEL_ID = "UI_ADMIN_TIEBREAKER_LABEL_";
const UI_ADMIN_TIEBREAKER_BUTTON_ID = "UI_ADMIN_TIEBREAKER_BUTTON_";
const UI_ADMIN_TIEBREAKER_BUTTON_TEXT_ID = "UI_ADMIN_TIEBREAKER_BUTTON_TEXT_";
const UI_ADMIN_TIEBREAKER_MODE_DEC_ID = "UI_ADMIN_TIEBREAKER_MODE_DEC_";
const UI_ADMIN_TIEBREAKER_MODE_INC_ID = "UI_ADMIN_TIEBREAKER_MODE_INC_";
const UI_ADMIN_TIEBREAKER_MODE_LABEL_ID = "UI_ADMIN_TIEBREAKER_MODE_LABEL_";
const UI_ADMIN_TIEBREAKER_MODE_HEADER_ID = "UI_ADMIN_TIEBREAKER_MODE_HEADER_";
const UI_ADMIN_LIVE_RESPAWN_BUTTON_ID = "UI_ADMIN_LIVE_RESPAWN_BUTTON_";
const UI_ADMIN_LIVE_RESPAWN_TEXT_ID = "UI_ADMIN_LIVE_RESPAWN_TEXT_";
const UI_ADMIN_ROUND_LENGTH_DEC_ID = "UI_ADMIN_ROUND_LENGTH_DEC_";
const UI_ADMIN_ROUND_LENGTH_INC_ID = "UI_ADMIN_ROUND_LENGTH_INC_";
const UI_ADMIN_ROUND_LENGTH_LABEL_ID = "UI_ADMIN_ROUND_LENGTH_LABEL_";

// Debug Positioning UI
const UI_POS_DEBUG_CONTAINER_ID = "UI_POS_DEBUG_CONTAINER_";
const UI_POS_DEBUG_X_ID = "UI_POS_DEBUG_X_";
const UI_POS_DEBUG_Y_ID = "UI_POS_DEBUG_Y_";
const UI_POS_DEBUG_Z_ID = "UI_POS_DEBUG_Z_";
const UI_POS_DEBUG_ROTY_ID = "UI_POS_DEBUG_ROTY_";

// Admin Panel (decoupled from main Team Switch dialog)
const UI_ADMIN_PANEL_BUTTON_ID = "UI_ADMIN_PANEL_BUTTON_";
const UI_ADMIN_PANEL_BUTTON_LABEL_ID = "UI_ADMIN_PANEL_BUTTON_LABEL_";
const UI_ADMIN_PANEL_CONTAINER_ID = "UI_ADMIN_PANEL_CONTAINER_";

// "Over the line" messaging strings
const BIG_TITLE_WIDGET_ID = "BigTitle_";
const BIG_SUBTITLE_WIDGET_ID = "BigSubtitle_";
const BIG_TITLE_SHADOW_WIDGET_ID = "BigTitleShadow_";
const BIG_SUBTITLE_SHADOW_WIDGET_ID = "BigSubtitleShadow_";

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

// Central message-gating policy: gameplay vs debug, and highlighted vs notification.
function shouldSendMessage(isGameplay: boolean, isHighlighted: boolean): boolean {
    if (isGameplay) return ENABLE_GAMEPLAY_MESSAGES;
    return isHighlighted ? ENABLE_DEBUG_HIGHLIGHTED_MESSAGES : ENABLE_DEBUG_NOTIFICATION_MESSAGES;
}

function setUIInputModeForPlayer(player: mod.Player, enabled: boolean): void {
    if (!player || !mod.IsPlayerValid(player)) return;
    mod.EnableUIInputMode(enabled, player);
    State.players.uiInputEnabledByPid[mod.GetObjId(player)] = enabled;
}

function noteHighlightedMessageSent(messageKey?: number): void {
    State.debug.highlightedMessageCount = State.debug.highlightedMessageCount + 1;
    State.debug.lastHighlightedMessageAtSeconds = Math.floor(mod.GetMatchTimeElapsed());
    if (messageKey !== undefined) {
        State.debug.lastHighlightedMessageKey = messageKey;
    }
}

// Round phase helper for readability (avoids scattered enum comparisons).
function isRoundLive(): boolean {
    return State.round.phase === RoundPhase.Live;
}

// Returns true if the given team currently has at least one valid player.
function hasPlayersOnTeam(team: mod.Team): boolean {
    if (mod.Equals(team, mod.GetTeam(0))) return false;
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        if (mod.Equals(mod.GetTeam(p), team)) return true;
    }
    return false;
}

// Notification channel wrapper; respects gameplay/debug gates and optional target.
function sendNotificationMessage(message: mod.Message, isGameplay: boolean, target?: mod.Player | mod.Team): void {
    if (!shouldSendMessage(isGameplay, false)) return;
    if (target) {
        // Route to the correct overload; Team cast-as-Player can silently drop messages after team switches.
        if (mod.IsType(target, mod.Types.Team)) {
            const teamTarget = target as mod.Team;
            if (!hasPlayersOnTeam(teamTarget)) return;
            mod.DisplayNotificationMessage(message, teamTarget);
            return;
        }
        if (mod.IsType(target, mod.Types.Player)) {
            const playerTarget = target as mod.Player;
            if (!playerTarget || !mod.IsPlayerValid(playerTarget)) return;
            mod.DisplayNotificationMessage(message, playerTarget);
            return;
        }
        return;
    }
    mod.DisplayNotificationMessage(message);
}

// World-log wrapper; respects gameplay/debug gates and optional target.
function sendHighlightedWorldLogMessage(message: mod.Message, isGameplay: boolean, target?: mod.Player | mod.Team, debugKey?: number): void {
    if (!shouldSendMessage(isGameplay, true)) return;
    noteHighlightedMessageSent(debugKey);
    if (target) {
        // Route to the correct overload; Team cast-as-Player can silently drop messages after team switches.
        if (mod.IsType(target, mod.Types.Team)) {
            const teamTarget = target as mod.Team;
            if (!hasPlayersOnTeam(teamTarget)) return;
            mod.DisplayHighlightedWorldLogMessage(message, teamTarget);
            return;
        }
        if (mod.IsType(target, mod.Types.Player)) {
            const playerTarget = target as mod.Player;
            if (!playerTarget || !mod.IsPlayerValid(playerTarget)) return;
            mod.DisplayHighlightedWorldLogMessage(message, playerTarget);
            return;
        }
        return;
    }
    mod.DisplayHighlightedWorldLogMessage(message);
}


// CP visibility debug helper (highlighted world log).
function logCapturePointVisibilityDebug(messageKey: number): void {
    if (!ENABLE_CP_VIS_DEBUG) return;
    sendHighlightedWorldLogMessage(
        mod.Message(messageKey),
        true,
        undefined,
        messageKey
    );
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
    setTrendingWinnerCrownForAllPlayers();

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

function safeGetObjId(obj: any): number | undefined {
    if (!obj) return undefined;
    try {
        return mod.GetObjId(obj);
    } catch {
        return undefined;
    }
}

// Guarded pid resolution for disconnect race windows in hot paths.
function safeGetPlayerId(player: mod.Player | null | undefined): number | undefined {
    if (!player || !mod.IsPlayerValid(player)) return undefined;
    try {
        return mod.GetObjId(player);
    } catch {
        return undefined;
    }
}

function isPidDisconnected(pid: number): boolean {
    return State.players.disconnectedByPid[pid] === true;
}

function getTeamNumber(team: mod.Team): TeamID | 0 {
    if (mod.Equals(team, mod.GetTeam(TeamID.Team1))) return TeamID.Team1;
    if (mod.Equals(team, mod.GetTeam(TeamID.Team2))) return TeamID.Team2;
    return 0;
}

function safeGetTeamNumberFromPlayer(
    player: mod.Player | null | undefined,
    fallback: TeamID | 0 = 0
): TeamID | 0 {
    if (!player || !mod.IsPlayerValid(player)) return fallback;
    try {
        return getTeamNumber(mod.GetTeam(player));
    } catch {
        return fallback;
    }
}

function isPlayerDeployed(player: mod.Player): boolean {
    if (!player || !mod.IsPlayerValid(player)) return false;
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return false;
    return !!State.players.deployedByPid[pid];
}

// Safe GetSoldierState wrappers: avoid engine errors during undeploy/cleanup and keep deploy state in sync.
function safeGetSoldierStateBool(player: mod.Player, stateKey: any, fallback: boolean = false): boolean {
    if (!player || !mod.IsPlayerValid(player)) return fallback;
    if (!isPlayerDeployed(player)) return fallback;
    try {
        return !!mod.GetSoldierState(player, stateKey);
    } catch {
        const pid = safeGetPlayerId(player);
        if (pid !== undefined) {
            State.players.deployedByPid[pid] = false;
        }
        return fallback;
    }
}

function safeGetSoldierStateVector(player: mod.Player, stateKey: any): mod.Vector | undefined {
    if (!player || !mod.IsPlayerValid(player)) return undefined;
    if (!isPlayerDeployed(player)) return undefined;
    try {
        return mod.GetSoldierState(player, stateKey) as unknown as mod.Vector;
    } catch {
        const pid = safeGetPlayerId(player);
        if (pid !== undefined) {
            State.players.deployedByPid[pid] = false;
        }
        return undefined;
    }
}

function getTeamNameKey(teamNum: TeamID | 0): number {
    if (teamNum === TeamID.Team1) return ACTIVE_MAP_CONFIG?.team1Name ?? mod.stringkeys.twl.teams.WEST;
    if (teamNum === TeamID.Team2) return ACTIVE_MAP_CONFIG?.team2Name ?? mod.stringkeys.twl.teams.EAST;
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

// Outlined button helper: wraps a solid button inside a thin-outline container.
function addOutlinedButton(
    buttonId: string,
    posX: number,
    posY: number,
    sizeX: number,
    sizeY: number,
    anchor: mod.UIAnchor,
    parent: mod.UIWidget,
    player: mod.Player,
    borderPadding: number = BUTTON_BORDER_PADDING
): mod.UIWidget | undefined {
    const borderId = `${buttonId}_BORDER`;
    const borderSizeX = sizeX + (borderPadding * 2);
    const borderSizeY = sizeY + (borderPadding * 2);

    mod.AddUIContainer(
        borderId,
        mod.CreateVector(posX, posY, 0),
        mod.CreateVector(borderSizeX, borderSizeY, 0),
        anchor,
        parent,
        true,
        0,
        COLOR_BUTTON_BORDER,
        BUTTON_BORDER_OPACITY,
        mod.UIBgFill.OutlineThin,
        mod.UIDepth.AboveGameUI,
        player
    );

    const border = mod.FindUIWidgetWithName(borderId, mod.GetUIRoot());
    const buttonParent = border ?? parent;

    mod.AddUIButton(
        buttonId,
        mod.CreateVector(0, 0, 0),
        mod.CreateVector(sizeX, sizeY, 0),
        mod.UIAnchor.Center,
        buttonParent,
        true,
        0,
        COLOR_BUTTON_BASE,
        BUTTON_OPACITY_BASE,
        mod.UIBgFill.Solid,
        true,
        COLOR_BUTTON_BASE,
        BUTTON_OPACITY_BASE,
        COLOR_BUTTON_BASE,
        BUTTON_OPACITY_BASE,
        COLOR_BUTTON_PRESSED,
        BUTTON_OPACITY_PRESSED,
        COLOR_BUTTON_SELECTED,
        BUTTON_OPACITY_SELECTED,
        COLOR_BUTTON_SELECTED,
        BUTTON_OPACITY_SELECTED,
        mod.UIDepth.AboveGameUI,
        player
    );

    const button = mod.FindUIWidgetWithName(buttonId, mod.GetUIRoot());
    if (button && border) {
        mod.SetUIWidgetParent(button, border);
    }

    return border ?? undefined;
}

function addCenteredButtonText(
    labelId: string,
    sizeX: number,
    sizeY: number,
    label: number | mod.Message,
    player: mod.Player,
    parent: mod.UIWidget,
    textSize?: number
): mod.UIWidget | undefined {
    const existing = safeFind(labelId);
    if (existing) mod.DeleteUIWidget(existing);

    const config: any = {
        name: labelId,
        type: "Text",
        playerId: player,
        position: [0, 0],
        size: [sizeX, sizeY],
        anchor: mod.UIAnchor.Center,
        visible: true,
        padding: 0,
        bgAlpha: 0,
        bgFill: mod.UIBgFill.None,
        textLabel: label,
        textColor: READY_DIALOG_BUTTON_TEXT_COLOR_RGB,
        textAlpha: 1,
        textAnchor: mod.UIAnchor.Center,
    };
    if (typeof textSize === "number") {
        config.textSize = textSize;
    }

    modlib.ParseUI(config);

    const widget = safeFind(labelId);
    if (widget) {
        mod.SetUIWidgetParent(widget, parent);
        mod.SetUIWidgetPosition(widget, mod.CreateVector(0, 0, 0));
        if (typeof textSize === "number") {
            mod.SetUITextSize(widget, textSize);
        }
    }
    return widget;
}

function addRightAlignedLabel(
    labelId: string,
    posX: number,
    posY: number,
    sizeX: number,
    sizeY: number,
    anchor: mod.UIAnchor,
    label: mod.Message,
    player: mod.Player,
    parent: mod.UIWidget,
    textSize: number
): mod.UIWidget | undefined {
    const widget = modlib.ParseUI({
        name: labelId,
        type: "Text",
        playerId: player,
        position: [posX, posY],
        size: [sizeX, sizeY],
        anchor: anchor,
        visible: true,
        padding: 0,
        bgAlpha: 0,
        bgFill: mod.UIBgFill.None,
        textLabel: label,
        textColor: [1, 1, 1],
        textAlpha: 1,
        textSize: textSize,
        textAnchor: mod.UIAnchor.CenterRight,
    });
    if (widget) {
        mod.SetUIWidgetParent(widget, parent);
        applyReadyDialogLabelTextColor(widget);
    }
    return widget;
}

function applyReadyDialogLabelTextColor(widget?: mod.UIWidget): void {
    if (widget) mod.SetUITextColor(widget, READY_DIALOG_LABEL_TEXT_COLOR);
}

function applyAdminPanelLabelTextColor(widget?: mod.UIWidget): void {
    if (widget) mod.SetUITextColor(widget, ADMIN_PANEL_LABEL_TEXT_COLOR);
}

function refreshReadyDialogButtonTextForPid(player: mod.Player, pid: number, baseContainer: mod.UIWidget): void {
    const swapBorder = safeFind(UI_READY_DIALOG_BUTTON_SWAP_ID + pid + "_BORDER");
    addCenteredButtonText(
        UI_READY_DIALOG_BUTTON_SWAP_LABEL_ID + pid,
        READY_DIALOG_MAIN_BUTTON_WIDTH,
        READY_DIALOG_MAIN_BUTTON_HEIGHT,
        mod.stringkeys.twl.readyDialog.buttons.swapTeams,
        player,
        swapBorder ?? baseContainer
    );

    const readyBorder = safeFind(UI_READY_DIALOG_BUTTON_READY_ID + pid + "_BORDER");
    addCenteredButtonText(
        UI_READY_DIALOG_BUTTON_READY_LABEL_ID + pid,
        READY_DIALOG_MAIN_BUTTON_WIDTH,
        READY_DIALOG_MAIN_BUTTON_HEIGHT,
        mod.stringkeys.twl.readyDialog.buttons.ready,
        player,
        readyBorder ?? baseContainer
    );
    updateReadyToggleButtonForViewer(player, pid);

    const autoReadyBorder = safeFind(UI_READY_DIALOG_BUTTON_AUTO_READY_ID + pid + "_BORDER");
    addCenteredButtonText(
        UI_READY_DIALOG_BUTTON_AUTO_READY_LABEL_ID + pid,
        READY_DIALOG_MAIN_BUTTON_WIDTH,
        READY_DIALOG_MAIN_BUTTON_HEIGHT,
        mod.stringkeys.twl.readyDialog.buttons.autoReadyEnable,
        player,
        autoReadyBorder ?? baseContainer
    );
    updateAutoReadyToggleButtonForViewer(player, pid);

    const cancelBorder = safeFind(UI_TEAMSWITCH_BUTTON_CANCEL_ID + pid + "_BORDER");
    addCenteredButtonText(
        UI_TEAMSWITCH_BUTTON_CANCEL_LABEL_ID + pid,
        READY_DIALOG_MAIN_BUTTON_WIDTH,
        READY_DIALOG_MAIN_BUTTON_HEIGHT,
        mod.stringkeys.twl.teamSwitch.buttons.cancel,
        player,
        cancelBorder ?? baseContainer
    );

    const bestOfDecBorder = safeFind(UI_READY_DIALOG_BESTOF_DEC_ID + pid + "_BORDER");
    addCenteredButtonText(
        UI_READY_DIALOG_BESTOF_DEC_LABEL_ID + pid,
        READY_DIALOG_SMALL_BUTTON_WIDTH,
        READY_DIALOG_SMALL_BUTTON_HEIGHT,
        mod.stringkeys.twl.ui.minus,
        player,
        bestOfDecBorder ?? baseContainer,
        14
    );
    const bestOfIncBorder = safeFind(UI_READY_DIALOG_BESTOF_INC_ID + pid + "_BORDER");
    addCenteredButtonText(
        UI_READY_DIALOG_BESTOF_INC_LABEL_ID + pid,
        READY_DIALOG_SMALL_BUTTON_WIDTH,
        READY_DIALOG_SMALL_BUTTON_HEIGHT,
        mod.stringkeys.twl.ui.plus,
        player,
        bestOfIncBorder ?? baseContainer,
        14
    );

    const matchupDecBorder = safeFind(UI_READY_DIALOG_MATCHUP_DEC_ID + pid + "_BORDER");
    addCenteredButtonText(
        UI_READY_DIALOG_MATCHUP_DEC_LABEL_ID + pid,
        READY_DIALOG_SMALL_BUTTON_WIDTH,
        READY_DIALOG_SMALL_BUTTON_HEIGHT,
        mod.stringkeys.twl.ui.minus,
        player,
        matchupDecBorder ?? baseContainer,
        14
    );
    const matchupIncBorder = safeFind(UI_READY_DIALOG_MATCHUP_INC_ID + pid + "_BORDER");
    addCenteredButtonText(
        UI_READY_DIALOG_MATCHUP_INC_LABEL_ID + pid,
        READY_DIALOG_SMALL_BUTTON_WIDTH,
        READY_DIALOG_SMALL_BUTTON_HEIGHT,
        mod.stringkeys.twl.ui.plus,
        player,
        matchupIncBorder ?? baseContainer,
        14
    );

    const minPlayersDecBorder = safeFind(UI_READY_DIALOG_MINPLAYERS_DEC_ID + pid + "_BORDER");
    addCenteredButtonText(
        UI_READY_DIALOG_MINPLAYERS_DEC_LABEL_ID + pid,
        READY_DIALOG_SMALL_BUTTON_WIDTH,
        READY_DIALOG_SMALL_BUTTON_HEIGHT,
        mod.stringkeys.twl.ui.minus,
        player,
        minPlayersDecBorder ?? baseContainer,
        14
    );
    const minPlayersIncBorder = safeFind(UI_READY_DIALOG_MINPLAYERS_INC_ID + pid + "_BORDER");
    addCenteredButtonText(
        UI_READY_DIALOG_MINPLAYERS_INC_LABEL_ID + pid,
        READY_DIALOG_SMALL_BUTTON_WIDTH,
        READY_DIALOG_SMALL_BUTTON_HEIGHT,
        mod.stringkeys.twl.ui.plus,
        player,
        minPlayersIncBorder ?? baseContainer,
        14
    );

    const modeGameDecBorder = safeFind(UI_READY_DIALOG_MODE_GAME_DEC_ID + pid + "_BORDER");
    addCenteredButtonText(
        UI_READY_DIALOG_MODE_GAME_DEC_LABEL_ID + pid,
        READY_DIALOG_SMALL_BUTTON_WIDTH,
        READY_DIALOG_SMALL_BUTTON_HEIGHT,
        mod.stringkeys.twl.ui.left,
        player,
        modeGameDecBorder ?? baseContainer,
        14
    );
    const modeGameIncBorder = safeFind(UI_READY_DIALOG_MODE_GAME_INC_ID + pid + "_BORDER");
    addCenteredButtonText(
        UI_READY_DIALOG_MODE_GAME_INC_LABEL_ID + pid,
        READY_DIALOG_SMALL_BUTTON_WIDTH,
        READY_DIALOG_SMALL_BUTTON_HEIGHT,
        mod.stringkeys.twl.ui.right,
        player,
        modeGameIncBorder ?? baseContainer,
        14
    );

    const modeSettingsDecBorder = safeFind(UI_READY_DIALOG_MODE_SETTINGS_DEC_ID + pid + "_BORDER");
    addCenteredButtonText(
        UI_READY_DIALOG_MODE_SETTINGS_DEC_LABEL_ID + pid,
        READY_DIALOG_SMALL_BUTTON_WIDTH,
        READY_DIALOG_SMALL_BUTTON_HEIGHT,
        mod.stringkeys.twl.ui.left,
        player,
        modeSettingsDecBorder ?? baseContainer,
        14
    );
    const modeSettingsIncBorder = safeFind(UI_READY_DIALOG_MODE_SETTINGS_INC_ID + pid + "_BORDER");
    addCenteredButtonText(
        UI_READY_DIALOG_MODE_SETTINGS_INC_LABEL_ID + pid,
        READY_DIALOG_SMALL_BUTTON_WIDTH,
        READY_DIALOG_SMALL_BUTTON_HEIGHT,
        mod.stringkeys.twl.ui.right,
        player,
        modeSettingsIncBorder ?? baseContainer,
        14
    );

    const vehiclesT1DecBorder = safeFind(UI_READY_DIALOG_MODE_VEHICLES_T1_DEC_ID + pid + "_BORDER");
    addCenteredButtonText(
        UI_READY_DIALOG_MODE_VEHICLES_T1_DEC_LABEL_ID + pid,
        READY_DIALOG_SMALL_BUTTON_WIDTH,
        READY_DIALOG_SMALL_BUTTON_HEIGHT,
        mod.stringkeys.twl.ui.left,
        player,
        vehiclesT1DecBorder ?? baseContainer,
        14
    );
    const vehiclesT1IncBorder = safeFind(UI_READY_DIALOG_MODE_VEHICLES_T1_INC_ID + pid + "_BORDER");
    addCenteredButtonText(
        UI_READY_DIALOG_MODE_VEHICLES_T1_INC_LABEL_ID + pid,
        READY_DIALOG_SMALL_BUTTON_WIDTH,
        READY_DIALOG_SMALL_BUTTON_HEIGHT,
        mod.stringkeys.twl.ui.right,
        player,
        vehiclesT1IncBorder ?? baseContainer,
        14
    );

    const vehiclesT2DecBorder = safeFind(UI_READY_DIALOG_MODE_VEHICLES_T2_DEC_ID + pid + "_BORDER");
    addCenteredButtonText(
        UI_READY_DIALOG_MODE_VEHICLES_T2_DEC_LABEL_ID + pid,
        READY_DIALOG_SMALL_BUTTON_WIDTH,
        READY_DIALOG_SMALL_BUTTON_HEIGHT,
        mod.stringkeys.twl.ui.left,
        player,
        vehiclesT2DecBorder ?? baseContainer,
        14
    );
    const vehiclesT2IncBorder = safeFind(UI_READY_DIALOG_MODE_VEHICLES_T2_INC_ID + pid + "_BORDER");
    addCenteredButtonText(
        UI_READY_DIALOG_MODE_VEHICLES_T2_INC_LABEL_ID + pid,
        READY_DIALOG_SMALL_BUTTON_WIDTH,
        READY_DIALOG_SMALL_BUTTON_HEIGHT,
        mod.stringkeys.twl.ui.right,
        player,
        vehiclesT2IncBorder ?? baseContainer,
        14
    );

    const confirmBorder = safeFind(UI_READY_DIALOG_MODE_CONFIRM_ID + pid + "_BORDER");
    addCenteredButtonText(
        UI_READY_DIALOG_MODE_CONFIRM_LABEL_ID + pid,
        READY_DIALOG_CONFIRM_BUTTON_WIDTH,
        READY_DIALOG_SMALL_BUTTON_HEIGHT,
        mod.stringkeys.twl.readyDialog.confirmSettingsLabel,
        player,
        confirmBorder ?? baseContainer,
        12
    );
    const resetBorder = safeFind(UI_READY_DIALOG_MODE_RESET_ID + pid + "_BORDER");
    addCenteredButtonText(
        UI_READY_DIALOG_MODE_RESET_LABEL_ID + pid,
        READY_DIALOG_RESET_BUTTON_WIDTH,
        READY_DIALOG_SMALL_BUTTON_HEIGHT,
        mod.stringkeys.twl.readyDialog.resetSettingsLabel,
        player,
        resetBorder ?? baseContainer,
        12
    );
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
    leftRoundKillsLabel?: mod.UIWidget;
    rightRoundKillsLabel?: mod.UIWidget;
    leftVehiclesAliveText?: mod.UIWidget;
    rightVehiclesAliveText?: mod.UIWidget;
    leftRoundKillsCrown?: mod.UIWidget;
    rightRoundKillsCrown?: mod.UIWidget;
    leftTrendingWinnerCrown?: mod.UIWidget;
    rightTrendingWinnerCrown?: mod.UIWidget;

    leftKillsText?: mod.UIWidget;
    rightKillsText?: mod.UIWidget;

    settingsGameModeText?: mod.UIWidget;
    settingsAircraftCeilingText?: mod.UIWidget;
    settingsVehiclesT1Text?: mod.UIWidget;
    settingsVehiclesT2Text?: mod.UIWidget;
    settingsVehiclesMatchupText?: mod.UIWidget;
    settingsPlayersText?: mod.UIWidget;

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
    victoryLeftCrown?: mod.UIWidget;
    victoryLeftRosterText?: Array<mod.UIWidget | undefined>;

    victoryRightOutcomeText?: mod.UIWidget;
    victoryRightRecordText?: mod.UIWidget;
    victoryRightRoundWinsText?: mod.UIWidget;
    victoryRightRoundLossesText?: mod.UIWidget;
    victoryRightRoundTiesText?: mod.UIWidget;
    victoryRightTotalKillsText?: mod.UIWidget;
    victoryRightCrown?: mod.UIWidget;
    victoryRightRosterText?: Array<mod.UIWidget | undefined>;
    victoryRosterRow?: mod.UIWidget;
    victoryRosterLeftContainer?: mod.UIWidget;
    victoryRosterRightContainer?: mod.UIWidget;

    // Round-end dialog widgets (shown during the round-end redeploy window)
    roundEndRoot?: mod.UIWidget;
    roundEndRoundText?: mod.UIWidget;
    roundEndOutcomeText?: mod.UIWidget;
    roundEndDetailText?: mod.UIWidget;
    adminPanelActionCountText?: mod.UIWidget;

    helpTextContainer?: mod.UIWidget;
    readyStatusContainer?: mod.UIWidget;

    spawnDisabledLiveText?: mod.UIWidget;

    // Optional roots (for cleanup if needed)
    roots: mod.UIWidget[];
};

//#endregion ----------------- HUD Types + Caches --------------------



//#region -------------------- Game State Definition --------------------

// Overtime UI widget caches (per-player). These mirror the HUD caching pattern used elsewhere.
type OvertimeFlagHudRefs = {
    root?: mod.UIWidget;
    title?: mod.UIWidget;
    titleShadow?: mod.UIWidget;
    status?: mod.UIWidget;
    statusShadow?: mod.UIWidget;
    countsLeft?: mod.UIWidget;
    countsRight?: mod.UIWidget;
    countsLeftBorder?: mod.UIWidget;
    countsRightBorder?: mod.UIWidget;
    percentLeftBg?: mod.UIWidget;
    percentRightBg?: mod.UIWidget;
    percentLeft?: mod.UIWidget;
    percentRight?: mod.UIWidget;
    countsLeftCrown?: mod.UIWidget;
    countsRightCrown?: mod.UIWidget;
    barBg?: mod.UIWidget;
    barFillT1?: mod.UIWidget;
    barFillT2?: mod.UIWidget;
    vehicleRequired?: mod.UIWidget;
};

type OvertimeFlagGlobalHudRefs = {
    root?: mod.UIWidget;
    title?: mod.UIWidget;
    barBg?: mod.UIWidget;
    barFillT1?: mod.UIWidget;
    barFillT2?: mod.UIWidget;
};

// Tracks zone membership for UI updates + vehicle dedupe (vehicleObjId = 0 when on foot).
type OvertimeFlagPlayerZoneState = {
    playerObjId: number;
    teamId: TeamID | 0;
    vehicleObjId: number;
};

// Last rendered values for in-zone HUD updates (avoid per-tick UI churn).
type OvertimeFlagUiSnapshot = {
    progressPercent: number;
    leftPercent: number;
    rightPercent: number;
    barFillT1Width: number;
    barFillT2Width: number;
    t1Count: number;
    t2Count: number;
    statusKey: number;
    statusValue: number;
    statusVisible: boolean;
    titleKey: number;
    titleValue: number;
    countsVisible: boolean;
    countsUseX: boolean;
    leftBorderVisible: boolean;
    rightBorderVisible: boolean;
    vehicleRequiredVisible: boolean;
};

type VehicleSpawnerSlot = {
    teamId: TeamID;
    slotNumber: number;
    spawner: mod.VehicleSpawner;
    spawnerObjId: number;
    spawnPos: mod.Vector;
    spawnRot: mod.Vector;
    vehicleType: mod.VehicleList;
    enabled: boolean;
    enableToken: number;
    spawnRequestToken: number;
    spawnRequestAtSeconds: number;
    expectingSpawn: boolean;
    vehicleId: number;
    respawnRunning: boolean;
    spawnRetryScheduled: boolean;
};

// GameState centralizes all mutable match/round/UI state so writes are explicit and searchable.
interface GameState {
    round: {
        current: number;
        max: number;
        killsTarget: number;
        autoStartMinActivePlayers: number;
        matchupPresetIndex: number;
        lastMatchupChangeAtSeconds: number;
        modeConfig: ReadyDialogModeConfig;
        phase: RoundPhase;
        lastWinnerTeam: TeamID | 0;
        lastEndDetailReason: RoundEndDetailReason;
        lastObjectiveProgress: number;
        clock: {
            durationSeconds: number;
            roundLengthSeconds: number;
            matchStartElapsedSeconds?: number;
            pausedRemainingSeconds?: number;
            isPaused: boolean;
            lastDisplayedSeconds?: number;
            lastLowTimeState?: boolean;
            expiryFired: boolean;
            expiryHandlers: Array<() => void>;
        };
        // cleanupActive gates deploy/UI during round-end reset; cleanupAllowDeploy temporarily overrides.
        flow: {
            roundEndRedeployToken: number;
            clockExpiryBound: boolean;
            cleanupActive: boolean;
            cleanupAllowDeploy: boolean;
            roundEndDialogVisible: boolean;
            // Locks overtime/HUD UI updates once a round ends to avoid UI calls during teardown.
            roundEndUiLockdown: boolean;
        };
        countdown: {
            isActive: boolean;
            isRequested: boolean;
            token: number;
            overLineMessageToken: number;
        };
        aircraftCeiling: {
            mapDefaultHudCeiling: number;
            hudMaxY: number;
            hudFloorY: number;
            customEnabled: boolean;
            enforcementToken: number;
            vehicleStates: Record<number, AircraftCeilingVehicleState>;
        };
    };
    // Overtime flag capture state (reset on round start/end).
    // Progress is 0..1 (0 = Team2 owns, 1 = Team1 owns, 0.5 = neutral).
    // t1Count/t2Count track unique vehicles in the zone (not player count).
    flag: {
        stage: OvertimeStage;
        active: boolean;
        trackingEnabled: boolean;
        unlockReminderSent: boolean;
        configValid: boolean;
        // True only when an admin override actually selects the zone for this round.
        overrideUsedThisRound: boolean;
        tieBreakerEnabledThisRound: boolean;
        candidateZones: OvertimeZoneCandidate[];
        activeAreaTriggerId?: number;
        activeAreaTrigger?: mod.AreaTrigger;
        activeSectorId?: number;
        activeSector?: mod.Sector;
        activeWorldIconId?: number;
        activeWorldIcon?: mod.WorldIcon;
        activeCapturePointId?: number;
        activeCapturePoint?: mod.CapturePoint;
        activeCandidateIndex?: number;
        // Cached string key for the selected zone letter (A-G).
        selectedZoneLetterKey?: number;
        ownerTeam: TeamID | 0;
        progress: number;
        t1Count: number;
        t2Count: number;
        playersInZoneByPid: Record<number, OvertimeFlagPlayerZoneState>;
        vehicleOccupantsByVid: Record<number, number>;
        vehicleTeamByVid: Record<number, TeamID>;
        lastUiSnapshotByPid: Record<number, OvertimeFlagUiSnapshot>;
        lastGlobalProgressPercent: number;
        lastMembershipPruneAtSeconds: number;
        uiByPid: Record<number, OvertimeFlagHudRefs>;
        globalUiByPid: Record<number, OvertimeFlagGlobalHudRefs>;
        tickToken: number;
        tickActive: boolean;
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
        debugLoopActive: boolean;
        tieBreakerOverrideIndex?: number;
        // Match-level flag if any tie-breaker override was used.
        tieBreakerOverrideUsed: boolean;
        tieBreakerModeIndex: number;
        liveRespawnEnabled: boolean;
    };
    debug: {
        highlightedMessageCount: number;
        lastHighlightedMessageAtSeconds: number;
        lastHighlightedMessageKey: number;
    };
    players: {
        teamSwitchData: Record<number, teamSwitchData_t>;
        readyByPid: Record<number, boolean>;
        autoReadyByPid: Record<number, boolean>;
        readyMessageCooldownByPid: Record<number, number>;
        // Join-time prompt: only once per player, regardless of undeploy repeats.
        joinPromptShownByPid: Record<number, boolean>;
        // "Never Show Again" is stored per map so other maps can still show the prompt.
        joinPromptNeverShowByPidMap: Record<number, Partial<Record<MapKey, boolean>>>;
        // Join prompt sequencing (tips + unlock tracking).
        joinPromptReadyDialogOpenedByPid: Record<number, boolean>;
        joinPromptTipIndexByPid: Record<number, number>;
        joinPromptTipsUnlockedByPid: Record<number, boolean>;
        joinPromptTripleTapArmedByPid: Record<number, boolean>;
        inMainBaseByPid: Record<number, boolean>;
        overTakeoffLimitByPid: Record<number, boolean>;
        deployedByPid: Record<number, boolean>;
        disconnectedByPid: Record<number, boolean>;
        uiInputEnabledByPid: Record<number, boolean>;
        spawnDisabledWarningVisibleByPid: Record<number, boolean>;
    };
    vehicles: {
        slots: VehicleSpawnerSlot[];
        vehicleToSlot: Record<number, number>;
        spawnSequenceToken: number;
        spawnSequenceInProgress: boolean;
        activeSpawnSlotIndex?: number;
        activeSpawnToken?: number;
        activeSpawnRequestedAtSeconds?: number;
        configReady: boolean;
        startupCleanupDone: boolean;
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
        overLineTitleShadowWidgetCache: Record<number, CountdownWidgetCacheEntry>;
        overLineSubtitleShadowWidgetCache: Record<number, CountdownWidgetCacheEntry>;
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
// - State.round.clock.roundLengthSeconds: round-start duration used for half-time reveal thresholds.
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
        max: MAX_ROUNDS,
        killsTarget: ROUND_KILLS_TARGET,
        autoStartMinActivePlayers: DEFAULT_AUTO_START_MIN_ACTIVE_PLAYERS,
        matchupPresetIndex: DEFAULT_MATCHUP_PRESET_INDEX,
        lastMatchupChangeAtSeconds: -999,
        modeConfig: {
            gameModeIndex: READY_DIALOG_GAME_MODE_DEFAULT_INDEX,
            aircraftCeiling: READY_DIALOG_AIRCRAFT_CEILING_DEFAULT,
            aircraftCeilingOverridePending: false,
            vehicleIndexT1: READY_DIALOG_VEHICLE_T1_DEFAULT_INDEX,
            vehicleIndexT2: READY_DIALOG_VEHICLE_T2_DEFAULT_INDEX,
            gameMode: READY_DIALOG_GAME_MODE_OPTIONS[READY_DIALOG_GAME_MODE_DEFAULT_INDEX],
            gameSettings: mod.stringkeys.twl.readyDialog.modeSettingAircraftCeilingFormat,
            vehiclesT1: READY_DIALOG_VEHICLE_OPTIONS[READY_DIALOG_VEHICLE_T1_DEFAULT_INDEX],
            vehiclesT2: READY_DIALOG_VEHICLE_OPTIONS[READY_DIALOG_VEHICLE_T2_DEFAULT_INDEX],
            confirmed: {
                gameMode: READY_DIALOG_GAME_MODE_OPTIONS[READY_DIALOG_GAME_MODE_DEFAULT_INDEX],
                gameSettings: mod.stringkeys.twl.readyDialog.modeSettingAircraftCeilingFormat,
                vehiclesT1: READY_DIALOG_VEHICLE_OPTIONS[READY_DIALOG_VEHICLE_T1_DEFAULT_INDEX],
                vehiclesT2: READY_DIALOG_VEHICLE_OPTIONS[READY_DIALOG_VEHICLE_T2_DEFAULT_INDEX],
                aircraftCeiling: READY_DIALOG_AIRCRAFT_CEILING_DEFAULT,
                aircraftCeilingOverrideEnabled: false,
                vehicleIndexT1: READY_DIALOG_VEHICLE_T1_DEFAULT_INDEX,
                vehicleIndexT2: READY_DIALOG_VEHICLE_T2_DEFAULT_INDEX,
                vehicleOverrideEnabled: false,
            },
        },
        phase: RoundPhase.NotReady,
        lastWinnerTeam: 0,
        lastEndDetailReason: RoundEndDetailReason.None,
        lastObjectiveProgress: 0.5,
        clock: {
            durationSeconds: ROUND_CLOCK_DEFAULT_SECONDS,
            roundLengthSeconds: ROUND_CLOCK_DEFAULT_SECONDS,
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
            cleanupActive: false,
            cleanupAllowDeploy: false,
            roundEndDialogVisible: false,
            roundEndUiLockdown: false,
        },
        countdown: {
            isActive: false,
            isRequested: false,
            token: 0,
            overLineMessageToken: 0,
        },
        aircraftCeiling: {
            mapDefaultHudCeiling: READY_DIALOG_AIRCRAFT_CEILING_DEFAULT,
            hudMaxY: READY_DIALOG_AIRCRAFT_CEILING_DEFAULT,
            hudFloorY: 0,
            customEnabled: false,
            enforcementToken: 0,
            vehicleStates: {},
        },
    },
    flag: {
        stage: OvertimeStage.None,
        active: false,
        trackingEnabled: false,
        unlockReminderSent: false,
        configValid: false,
        overrideUsedThisRound: false,
        tieBreakerEnabledThisRound: false,
        candidateZones: [],
        activeAreaTriggerId: undefined,
        activeAreaTrigger: undefined,
        activeSectorId: undefined,
        activeSector: undefined,
        activeWorldIconId: undefined,
        activeWorldIcon: undefined,
        activeCapturePointId: undefined,
        activeCapturePoint: undefined,
        activeCandidateIndex: undefined,
        selectedZoneLetterKey: undefined,
        ownerTeam: 0,
        progress: 0.5,
        t1Count: 0,
        t2Count: 0,
        playersInZoneByPid: {},
        vehicleOccupantsByVid: {},
        vehicleTeamByVid: {},
        lastUiSnapshotByPid: {},
        lastGlobalProgressPercent: -1,
        lastMembershipPruneAtSeconds: 0,
        uiByPid: {},
        globalUiByPid: {},
        tickToken: 0,
        tickActive: false,
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
        debugLoopActive: false,
        tieBreakerOverrideIndex: undefined,
        tieBreakerOverrideUsed: false,
        tieBreakerModeIndex: ADMIN_TIEBREAKER_MODE_DEFAULT_INDEX,
        liveRespawnEnabled: DEFAULT_LIVE_RESPAWN_ENABLED,
    },
    debug: {
        highlightedMessageCount: 0,
        lastHighlightedMessageAtSeconds: -1,
        lastHighlightedMessageKey: -1,
    },
    players: {
        teamSwitchData: {},
        readyByPid: {},
        autoReadyByPid: {},
        readyMessageCooldownByPid: {},
        joinPromptShownByPid: {},
        joinPromptNeverShowByPidMap: {},
        joinPromptReadyDialogOpenedByPid: {},
        joinPromptTipIndexByPid: {},
        joinPromptTipsUnlockedByPid: {},
        joinPromptTripleTapArmedByPid: {},
        inMainBaseByPid: {},
        overTakeoffLimitByPid: {},
        deployedByPid: {},
        disconnectedByPid: {},
        uiInputEnabledByPid: {},
        spawnDisabledWarningVisibleByPid: {},
    },
    vehicles: {
        slots: [],
        vehicleToSlot: {},
        spawnSequenceToken: 0,
        spawnSequenceInProgress: false,
        activeSpawnSlotIndex: undefined,
        activeSpawnToken: undefined,
        activeSpawnRequestedAtSeconds: undefined,
        configReady: false,
        startupCleanupDone: false,
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
        overLineTitleShadowWidgetCache: {},
        overLineSubtitleShadowWidgetCache: {},
    },
};

//#endregion ----------------- Game State Definition --------------------



//#region -------------------- HUD Counter Helpers --------------------

function setCounterText(widget: mod.UIWidget | undefined, value: number): void {
    if (!widget) return;
    safeSetUITextLabel(widget, mod.Message(mod.stringkeys.twl.system.genericCounter, Math.floor(value)));
}

function setRoundRecordText(widget: mod.UIWidget | undefined, wins: number, losses: number, ties: number): void {
    if (!widget) return;
    safeSetUITextLabel(widget, mod.Message(mod.stringkeys.twl.hud.roundRecordFormat, Math.floor(wins), Math.floor(losses), Math.floor(ties)));
}

function getTrendingWinnerTeam(): TeamID | 0 {
    if (State.match.winsT1 > State.match.winsT2) return TeamID.Team1;
    if (State.match.winsT2 > State.match.winsT1) return TeamID.Team2;
    return 0;
}

function setTrendingWinnerCrownForRefs(refs: HudRefs | undefined): void {
    if (!refs) return;
    const winner = getTrendingWinnerTeam();
    const showLeft = winner === TeamID.Team1;
    const showRight = winner === TeamID.Team2;
    safeSetUIWidgetVisible(refs.leftTrendingWinnerCrown, showLeft);
    safeSetUIWidgetVisible(refs.rightTrendingWinnerCrown, showRight);
}

function setTrendingWinnerCrownForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const refs = ensureHudForPlayer(p);
        if (!refs) continue;
        setTrendingWinnerCrownForRefs(refs);
    }
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

function setRoundLiveHelpText(
    root: mod.UIWidget | undefined,
    text: mod.UIWidget | undefined
): void {
    if (!root || !text) return;

    const show = (!State.match.isEnded) && (isRoundLive());
    mod.SetUIWidgetVisible(root, show);

    if (!show) return;

    const label = mod.Message(mod.stringkeys.twl.hud.roundLiveHelpFormat, Math.floor(State.round.killsTarget));
    if (text) {
        mod.SetUITextLabel(text, label);
        mod.SetUITextColor(text, mod.CreateVector(1, 1, 1));
    }
}

function getRoundKillsLabelRound(): number {
    if (State.round.phase === RoundPhase.Live) return Math.max(1, Math.floor(State.round.current));
    if (State.round.phase === RoundPhase.GameOver) return Math.max(1, Math.floor(State.round.current));
    return Math.max(1, Math.floor(State.round.current - 1));
}

function setRoundKillsLabelTextForRefs(refs: HudRefs | undefined): void {
    if (!refs) return;
    const label = mod.Message(mod.stringkeys.twl.hud.labels.roundKillsWithRoundFormat, getRoundKillsLabelRound());
    if (refs.leftRoundKillsLabel) mod.SetUITextLabel(refs.leftRoundKillsLabel, label);
    if (refs.rightRoundKillsLabel) mod.SetUITextLabel(refs.rightRoundKillsLabel, label);
}

function getClockTimeParts(remainingSeconds: number): { minutes: number; secTens: number; secOnes: number } {
    const clamped = Math.max(0, Math.floor(remainingSeconds));
    const minutes = Math.floor(clamped / 60);
    const seconds = clamped % 60;
    const secTens = Math.floor(seconds / 10);
    const secOnes = seconds % 10;
    return {
        minutes,
        secTens,
        secOnes,
    };
}

// UI hardening helpers skip work if a widget is missing (ParseUI and safeFind can yield undefined).
// This prevents runtime issues and also avoids TS errors from passing UIWidget | undefined into mod.* UI calls.
function safeSetUIWidgetVisible(widget: mod.UIWidget | undefined, visible: boolean): void {
    if (!widget) return;
    try {
        mod.SetUIWidgetVisible(widget, visible);
    } catch {
        return;
    }
}

function safeSetUITextLabel(widget: mod.UIWidget | undefined, label: mod.Message): void {
    if (!widget) return;
    try {
        mod.SetUITextLabel(widget, label);
    } catch {
        return;
    }
}

function safeSetUITextColor(widget: mod.UIWidget | undefined, color: mod.Vector): void {
    if (!widget) return;
    try {
        mod.SetUITextColor(widget, color);
    } catch {
        return;
    }
}

function safeSetUIWidgetDepth(widget: mod.UIWidget | undefined, depth: mod.UIDepth): void {
    if (!widget) return;
    try {
        mod.SetUIWidgetDepth(widget, depth);
    } catch {
        return;
    }
}

function safeAddUIContainer(
    name: string,
    position: mod.Vector,
    size: mod.Vector,
    anchor: mod.UIAnchor,
    parent: mod.UIWidget,
    visible: boolean,
    padding: number,
    color: mod.Vector,
    alpha: number,
    fill: mod.UIBgFill,
    depth: mod.UIDepth,
    player: mod.Player
): void {
    try {
        mod.AddUIContainer(
            name,
            position,
            size,
            anchor,
            parent,
            visible,
            padding,
            color,
            alpha,
            fill,
            depth,
            player
        );
    } catch {
        return;
    }
}

function safeSetUIWidgetSize(widget: mod.UIWidget | undefined, size: mod.Vector): void {
    if (!widget) return;
    try {
        mod.SetUIWidgetSize(widget, size);
    } catch {
        return;
    }
}

function setWidgetVisible(widget: mod.UIWidget | undefined, visible: boolean): void {
    if (!widget) return;
    safeSetUIWidgetVisible(widget, visible);
// SetUITextLabel only accepts mod.Message; string inputs are treated as string keys and wrapped with mod.Message(key).
}

function setWidgetText(widget: mod.UIWidget | undefined, label: string | mod.Message): void {
    if (!widget) return;
    if (typeof label === 'string') {
        safeSetUITextLabel(widget, mod.Message(label));
        return;
    }
    safeSetUITextLabel(widget, label);
}

function ensureTopHudRootForPid(pid: number, player?: mod.Player): mod.UIWidget | undefined {
    const rootName = `TopHudRoot_${pid}`;
    let root = safeFind(rootName);
    if (!root && player) {
        mod.AddUIContainer(
            rootName,
            mod.CreateVector(0, 0, 0),
            mod.CreateVector(TOP_HUD_ROOT_WIDTH, TOP_HUD_ROOT_HEIGHT, 0),
            mod.UIAnchor.TopCenter,
            mod.GetUIRoot(),
            true,
            0,
            mod.CreateVector(0, 0, 0),
            0,
            mod.UIBgFill.None,
            mod.UIDepth.AboveGameUI,
            player
        );
        root = safeFind(rootName);
    }

    if (!root) return undefined;
    mod.SetUIWidgetDepth(root, mod.UIDepth.AboveGameUI);

    const reparentIds = [
        "Container_TopMiddle_CoreUI_",
        "Container_TopLeft_CoreUI_",
        "Container_TopRight_CoreUI_",
        "Container_TopLeft_RoundKills_",
        "Container_TopRight_RoundKills_",
        "RoundCounterContainer_",
        "RoundCounterMaxContainer_",
        "TeamLeft_Wins_Counter_",
        "TeamRight_Wins_Counter_",
        "TeamLeft_Kills_Counter_",
        "TeamRight_Kills_Counter_",
    ];

    for (const base of reparentIds) {
        const widget = safeFind(base + pid);
        if (!widget) continue;
        mod.SetUIWidgetParent(widget, root);
        mod.SetUIWidgetDepth(widget, mod.UIDepth.AboveGameUI);
    }

    const topHudDepthIds = [
        "MatchTimerRoot_",
        "RoundStateRoot_",
    ];
    for (const base of topHudDepthIds) {
        const widget = safeFind(base + pid);
        if (widget) mod.SetUIWidgetDepth(widget, mod.UIDepth.AboveGameUI);
    }

    return root;
}

function setHudHelpDepthForPid(pid: number): void {
    const helpIds = [
        `Container_HelpText_${pid}`,
        `HelpText_${pid}`,
        `Container_ReadyStatus_${pid}`,
        `ReadyStatusText_${pid}`,
        `PlayersReadyText_${pid}`,
        `RoundLiveHelpRoot_${pid}`,
        `RoundLiveHelpText_${pid}`,
    ];
    for (const name of helpIds) {
        const widget = safeFind(name);
        if (widget) mod.SetUIWidgetDepth(widget, mod.UIDepth.BelowGameUI);
    }
}

function reparentSpawnDisabledLiveTextForPid(pid: number, parentOverride?: mod.UIWidget): void {
    const widget = safeFind(`SpawnDisabledLiveText_${pid}`);
    if (!widget) return;
    const parent = parentOverride ?? safeFind(joinPromptRootName(pid)) ?? mod.GetUIRoot();
    mod.SetUIWidgetParent(widget, parent);
    mod.SetUIWidgetDepth(widget, mod.UIDepth.AboveGameUI);
}

function ensureSpawnDisabledLiveText(player: mod.Player): mod.UIWidget | undefined {
    const pid = getObjId(player);
    const existing = safeFind(`SpawnDisabledLiveText_${pid}`);
    if (existing) {
        reparentSpawnDisabledLiveTextForPid(pid);
        return existing;
    }
    const spawnDisabledText = modlib.ParseUI({
        name: `SpawnDisabledLiveText_${pid}`,
        type: "Text",
        playerId: player,
        // position: [x, y] offset; direction depends on anchor, so verify visually in-game
        position: [0, SPAWN_DISABLED_TEXT_POS_Y],
        size: [SPAWN_DISABLED_TEXT_WIDTH, SPAWN_DISABLED_TEXT_HEIGHT],
        anchor: mod.UIAnchor.BottomCenter,
        visible: false,
        padding: 0,
        bgColor: [0, 0, 0],
        bgAlpha: 1,
        bgFill: mod.UIBgFill.Solid,
        textLabel: mod.stringkeys.twl.hud.spawnDisabledLive,
        textColor: SPAWN_DISABLED_TEXT_COLOR_RGB,
        textAlpha: 1,
        textSize: SPAWN_DISABLED_TEXT_SIZE,
        textAnchor: mod.UIAnchor.Center,
    });
    if (spawnDisabledText) {
        mod.SetUIWidgetDepth(spawnDisabledText, mod.UIDepth.AboveGameUI);
        reparentSpawnDisabledLiveTextForPid(pid);
    }
    return spawnDisabledText;
}

function setSpawnDisabledLiveTextVisibleForPlayer(player: mod.Player, visible: boolean): void {
    const refs = ensureHudForPlayer(player);
    if (!refs || !refs.spawnDisabledLiveText) return;
    safeSetUIWidgetVisible(refs.spawnDisabledLiveText, visible);
}

function setSpawnDisabledLiveTextVisibleForAllPlayers(visible: boolean): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        setSpawnDisabledLiveTextVisibleForPlayer(p, visible);
    }
}

function isLiveRespawnDisabled(): boolean {
    return !State.admin.liveRespawnEnabled;
}

function updateSpawnDisabledWarningForPlayer(player: mod.Player): void {
    if (!player || !mod.IsPlayerValid(player)) return;
    const pid = getObjId(player);
    const shouldShow = isLiveRespawnDisabled() && isRoundLive() && !isPlayerDeployed(player);
    const lastVisible = State.players.spawnDisabledWarningVisibleByPid[pid] ?? false;
    if (shouldShow === lastVisible) return;
    State.players.spawnDisabledWarningVisibleByPid[pid] = shouldShow;
    const widget = ensureSpawnDisabledLiveText(player);
    safeSetUIWidgetVisible(widget, shouldShow);
}

function updateSpawnDisabledWarningForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        updateSpawnDisabledWarningForPlayer(p);
    }
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
        const refs = ensureHudForPlayer(p);
        if (refs) setRoundKillsLabelTextForRefs(refs);
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
        const pid = safeGetPlayerId(active.all[i]);
        if (pid === undefined) continue;
        if (State.players.readyByPid[pid]) readyCount++;
    }

    const shouldShow = !State.match.isEnded && !State.match.victoryDialogActive;

    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const cache = ensureClockUIAndGetCache(p);
        if (!cache || !cache.playersReadyText) continue;

        // Toggle visibility first so we can avoid unnecessary label churn when hidden.
        safeSetUIWidgetVisible(cache.playersReadyText, shouldShow);
        if (!shouldShow) continue;

        let label: mod.Message;
        if (isRoundLive()) {
            const preset = MATCHUP_PRESETS[State.round.matchupPresetIndex];
            label = mod.Message(mod.stringkeys.twl.readyDialog.matchupFormat, preset.leftPlayers, preset.rightPlayers);
            mod.SetUITextLabel(cache.playersReadyText, label);
            mod.SetUITextColor(cache.playersReadyText, COLOR_NORMAL);
        } else {
            label = mod.Message(mod.stringkeys.twl.hud.playersReadyFormat, readyCount, total);
            mod.SetUITextLabel(cache.playersReadyText, label);
            mod.SetUITextColor(cache.playersReadyText, COLOR_WARNING_YELLOW);
        }
    }
}

// Lightweight helper for ready-up broadcasts (avoids recomputing counts in UI handlers).
function getReadyCountsForMessage(): { readyCount: number; totalCount: number } {
    const active = getActivePlayers();
    const totalCount = active.all.length;
    let readyCount = 0;
    for (let i = 0; i < totalCount; i++) {
        const pid = safeGetPlayerId(active.all[i]);
        if (pid === undefined) continue;
        if (State.players.readyByPid[pid]) readyCount++;
    }
    return { readyCount, totalCount };
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

function setVictoryWinnerCrownForRefs(refs: HudRefs | undefined): void {
    if (!refs) return;
    const winner = getTrendingWinnerTeam();
    const showLeft = winner === TeamID.Team1;
    const showRight = winner === TeamID.Team2;
    safeSetUIWidgetVisible(refs.victoryLeftCrown, showLeft);
    safeSetUIWidgetVisible(refs.victoryRightCrown, showRight);
}

function updateVictoryDialogRosterSizing(refs: HudRefs, rosterRows: number): void {
    const clampedRows = Math.max(1, Math.min(TEAM_ROSTER_MAX_ROWS, Math.floor(rosterRows)));
    const rosterHeight = VICTORY_DIALOG_ROSTER_ROW_PADDING_TOP + (clampedRows * VICTORY_DIALOG_ROSTER_ROW_HEIGHT) + VICTORY_DIALOG_ROSTER_ROW_PADDING_BOTTOM;
    const dialogHeight = VICTORY_DIALOG_ROSTER_ROW_Y + rosterHeight + VICTORY_DIALOG_BOTTOM_PADDING;

    if (refs.victoryRoot) {
        mod.SetUIWidgetSize(refs.victoryRoot, mod.CreateVector(VICTORY_DIALOG_WIDTH, dialogHeight, 0));
    }
    if (refs.victoryRosterRow) {
        mod.SetUIWidgetSize(refs.victoryRosterRow, mod.CreateVector(VICTORY_DIALOG_ROSTER_ROW_WIDTH, rosterHeight, 0));
    }
    if (refs.victoryRosterLeftContainer) {
        mod.SetUIWidgetSize(refs.victoryRosterLeftContainer, mod.CreateVector(VICTORY_DIALOG_ROSTER_CONTAINER_WIDTH, rosterHeight, 0));
    }
    if (refs.victoryRosterRightContainer) {
        mod.SetUIWidgetSize(refs.victoryRosterRightContainer, mod.CreateVector(VICTORY_DIALOG_ROSTER_CONTAINER_WIDTH, rosterHeight, 0));
    }
}

function computeTeamOutcomeKey(teamNum: TeamID): number {
    if (State.match.winnerTeam === undefined || State.match.winnerTeam === 0) {
        return mod.stringkeys.twl.victory.draws;
    }
    return State.match.winnerTeam === teamNum ? mod.stringkeys.twl.victory.wins : mod.stringkeys.twl.victory.loses;
}

/**
 * Updates per-player Victory dialog widgets to reflect current match-end state.
 * Notes:
 * - This only updates UI text/visibility; it does not decide winners.
 * - Caller must ensure the dialog is built before updating.
 * - Remaining seconds can wrap at 0 (engine quirk); we clamp to 0 to avoid huge values.
 */
function updateVictoryDialogForPlayer(player: mod.Player, remainingSeconds: number): void {
    // Per-player update for the match-end victory modal: winner label, scores, and restart/rotate countdown.
    // This is called once per second while the victory dialog is active.
    // Determine the target player id; dialog widgets are keyed per-player.
    if (!player || !mod.IsPlayerValid(player)) return;
    const pid = safeGetPlayerId(player);
    if (pid === undefined || isPidDisconnected(pid)) return;
    // Look up cached UI references for this player (if missing, this update becomes a no-op).
    const refs = State.hudCache.hudByPid[pid];
    if (!refs) return;

    if (refs.victoryRoot) {
        // Apply visibility rules for the dialog parts based on match-end state.
        setWidgetVisible(refs.victoryRoot, State.match.victoryDialogActive);
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
        safeSetUITextLabel(refs.victoryRestartText, mod.Message(mod.stringkeys.twl.victory.restartInFormat, displaySeconds));
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

    if (refs.victoryTimeHoursTens) safeSetUITextLabel(refs.victoryTimeHoursTens, mod.Message(mod.stringkeys.twl.hud.clock.digit, hT));
    if (refs.victoryTimeHoursOnes) safeSetUITextLabel(refs.victoryTimeHoursOnes, mod.Message(mod.stringkeys.twl.hud.clock.digit, hO));
    if (refs.victoryTimeMinutesTens) safeSetUITextLabel(refs.victoryTimeMinutesTens, mod.Message(mod.stringkeys.twl.hud.clock.digit, mT));
    if (refs.victoryTimeMinutesOnes) safeSetUITextLabel(refs.victoryTimeMinutesOnes, mod.Message(mod.stringkeys.twl.hud.clock.digit, mO));
    if (refs.victoryTimeSecondsTens) safeSetUITextLabel(refs.victoryTimeSecondsTens, mod.Message(mod.stringkeys.twl.hud.clock.digit, sT));
    if (refs.victoryTimeSecondsOnes) safeSetUITextLabel(refs.victoryTimeSecondsOnes, mod.Message(mod.stringkeys.twl.hud.clock.digit, sO));

    if (refs.victoryRoundsSummaryText) {
        safeSetUITextLabel(refs.victoryRoundsSummaryText, mod.Message(mod.stringkeys.twl.victory.roundsSummaryFormat, Math.floor(State.round.current), Math.floor(State.round.max)));
    }
    if (refs.victoryAdminActionsText) {
        const actionCount = Math.max(0, Math.floor(State.admin.actionCount));
        setWidgetVisible(refs.victoryAdminActionsText, actionCount > 0);
        if (actionCount > 0) {
            const overrideUsed = State.admin.tieBreakerOverrideUsed; // Highlight if any override was used this match.
            safeSetUITextLabel(
                refs.victoryAdminActionsText,
                mod.Message(
                    overrideUsed
                        ? mod.stringkeys.twl.adminPanel.actionCountVictoryFormatRandomOverride
                        : mod.stringkeys.twl.adminPanel.actionCountVictoryFormat,
                    actionCount
                )
            );
            safeSetUITextColor(refs.victoryAdminActionsText, overrideUsed ? COLOR_RED : COLOR_WARNING_YELLOW);
        }
    }

    const t1OutcomeKey = computeTeamOutcomeKey(TeamID.Team1);
    const t2OutcomeKey = computeTeamOutcomeKey(TeamID.Team2);

    if (refs.victoryLeftOutcomeText) {
        safeSetUITextLabel(refs.victoryLeftOutcomeText, mod.Message(mod.stringkeys.twl.victory.teamOutcomeFormat, getTeamNameKey(TeamID.Team1), t1OutcomeKey));
    }
    if (refs.victoryRightOutcomeText) {
        safeSetUITextLabel(refs.victoryRightOutcomeText, mod.Message(mod.stringkeys.twl.victory.teamOutcomeFormat, getTeamNameKey(TeamID.Team2), t2OutcomeKey));
    }
    setVictoryWinnerCrownForRefs(refs);

    if (refs.victoryLeftRecordText) {
        safeSetUITextLabel(refs.victoryLeftRecordText, mod.Message(mod.stringkeys.twl.hud.roundRecordFormat, Math.floor(State.match.winsT1), Math.floor(State.match.winsT2), Math.floor(State.match.tiesT1)));
    }
    if (refs.victoryRightRecordText) {
        safeSetUITextLabel(refs.victoryRightRecordText, mod.Message(mod.stringkeys.twl.hud.roundRecordFormat, Math.floor(State.match.winsT2), Math.floor(State.match.winsT1), Math.floor(State.match.tiesT2)));
    }

    if (refs.victoryLeftRoundWinsText) {
        safeSetUITextLabel(refs.victoryLeftRoundWinsText, mod.Message(mod.stringkeys.twl.victory.roundWinsFormat, Math.floor(State.match.winsT1)));
    }
    if (refs.victoryRightRoundWinsText) {
        safeSetUITextLabel(refs.victoryRightRoundWinsText, mod.Message(mod.stringkeys.twl.victory.roundWinsFormat, Math.floor(State.match.winsT2)));
    }

    const lossesT1 = State.match.lossesT1;
    const lossesT2 = State.match.lossesT2;

    if (refs.victoryLeftRoundLossesText) {
        safeSetUITextLabel(refs.victoryLeftRoundLossesText, mod.Message(mod.stringkeys.twl.victory.roundLossesFormat, Math.floor(lossesT1)));
    }
    if (refs.victoryRightRoundLossesText) {
        safeSetUITextLabel(refs.victoryRightRoundLossesText, mod.Message(mod.stringkeys.twl.victory.roundLossesFormat, Math.floor(lossesT2)));
    }
    if (refs.victoryLeftRoundTiesText) {
        safeSetUITextLabel(refs.victoryLeftRoundTiesText, mod.Message(mod.stringkeys.twl.victory.roundTiesFormat, Math.floor(State.match.tiesT1)));
    }
    if (refs.victoryRightRoundTiesText) {
        safeSetUITextLabel(refs.victoryRightRoundTiesText, mod.Message(mod.stringkeys.twl.victory.roundTiesFormat, Math.floor(State.match.tiesT2)));
    }

    if (refs.victoryLeftTotalKillsText) {
        safeSetUITextLabel(refs.victoryLeftTotalKillsText, mod.Message(mod.stringkeys.twl.victory.totalKillsFormat, Math.floor(State.scores.t1TotalKills)));
    }
    if (refs.victoryRightTotalKillsText) {
        safeSetUITextLabel(refs.victoryRightTotalKillsText, mod.Message(mod.stringkeys.twl.victory.totalKillsFormat, Math.floor(State.scores.t2TotalKills)));
    }

    if (refs.victoryLeftRosterText || refs.victoryRightRosterText) {
        const roster = getRosterDisplayEntries();
        updateVictoryDialogRosterSizing(refs, roster.maxRows);
        for (let i = 0; i < TEAM_ROSTER_MAX_ROWS; i++) {
            const leftWidget = refs.victoryLeftRosterText?.[i];
            if (leftWidget) {
                const leftEntry = roster.team1[i];
                setWidgetVisible(leftWidget, !!leftEntry);
                if (leftEntry) {
                    safeSetUITextLabel(leftWidget, getRosterEntryNameMessage(leftEntry));
                }
            }

            const rightWidget = refs.victoryRightRosterText?.[i];
            if (rightWidget) {
                const rightEntry = roster.team2[i];
                setWidgetVisible(rightWidget, !!rightEntry);
                if (rightEntry) {
                    safeSetUITextLabel(rightWidget, getRosterEntryNameMessage(rightEntry));
                }
            }
        }
    }
}

function updateVictoryDialogForAllPlayers(remainingSeconds: number): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const pid = safeGetPlayerId(p);
        if (pid === undefined || isPidDisconnected(pid)) continue;
        updateVictoryDialogForPlayer(p, remainingSeconds);
    }
}

//#endregion ----------------- HUD Victory Dialog Updates --------------------



//#region -------------------- HUD Round-End Dialog Updates --------------------

function setRoundWinCrownForRefs(refs: HudRefs | undefined, winnerTeamNum: TeamID | 0, visible: boolean): void {
    if (!refs) return;
    const showLeft = visible && winnerTeamNum === TeamID.Team1;
    const showRight = visible && winnerTeamNum === TeamID.Team2;
    safeSetUIWidgetVisible(refs.leftRoundKillsCrown, showLeft);
    safeSetUIWidgetVisible(refs.rightRoundKillsCrown, showRight);
}

function setRoundWinCrownForAllPlayers(winnerTeamNum: TeamID | 0, visible: boolean): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const pid = safeGetPlayerId(p);
        if (pid === undefined || isPidDisconnected(pid)) continue;
        const refs = State.hudCache.hudByPid[pid];
        if (!refs) continue;
        setRoundWinCrownForRefs(refs, winnerTeamNum, visible);
    }
}

function setRoundEndDialogVisibleForAllPlayers(visible: boolean): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    State.round.flow.roundEndDialogVisible = visible;
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const pid = safeGetPlayerId(p);
        if (pid === undefined || isPidDisconnected(pid)) continue;
        const refs = State.hudCache.hudByPid[pid];
        if (!refs) continue;
        if (refs.roundEndRoot) {
            setWidgetVisible(refs.roundEndRoot, visible);
        }
    }
    setRoundWinCrownForAllPlayers(State.round.lastWinnerTeam, visible);
    updateHelpTextVisibilityForAllPlayers();
}

// Round-end UI lockdown: avoid touching overtime HUD widgets during teardown transitions.
function isRoundEndUiLockdownActive(): boolean {
    return State.round.flow.roundEndUiLockdown
        || State.round.flow.roundEndDialogVisible
        || State.round.flow.cleanupActive;
}

function isRoundEndDetailDrawReason(reason: RoundEndDetailReason): boolean {
    return reason === RoundEndDetailReason.TimeOverDrawEvenElims
        || reason === RoundEndDetailReason.TimeOverDrawNoAction;
}

function getRoundEndDetailForViewer(
    viewerTeamNum: TeamID | 0,
    winnerTeamNum: TeamID | 0
): { key: number; color: mod.Vector; value?: number } | undefined {
    const reason = State.round.lastEndDetailReason;
    if (reason === RoundEndDetailReason.None) return undefined;

    if (isRoundEndDetailDrawReason(reason) || winnerTeamNum === 0) {
        const drawKey = reason === RoundEndDetailReason.TimeOverDrawNoAction
            ? STR_ROUND_END_DETAIL_DRAW_NO_ACTION
            : STR_ROUND_END_DETAIL_DRAW_EVEN_ELIMS;
        return { key: drawKey, color: COLOR_WHITE };
    }

    const isViewerWinner = viewerTeamNum !== 0 && viewerTeamNum === winnerTeamNum;
    let key: number;
    let value: number | undefined;
    switch (reason) {
        case RoundEndDetailReason.Elimination:
            key = isViewerWinner ? STR_ROUND_END_DETAIL_WIN_ELIMINATION : STR_ROUND_END_DETAIL_LOSE_ELIMINATION;
            break;
        case RoundEndDetailReason.ObjectiveCaptured:
            key = isViewerWinner ? STR_ROUND_END_DETAIL_WIN_OBJECTIVE_CAPTURED : STR_ROUND_END_DETAIL_LOSE_OBJECTIVE_CAPTURED;
            break;
        case RoundEndDetailReason.TimeOverObjectiveProgress:
            key = isViewerWinner ? STR_ROUND_END_DETAIL_WIN_OBJECTIVE_PROGRESS : STR_ROUND_END_DETAIL_LOSE_OBJECTIVE_PROGRESS;
            const percents = getOvertimeDisplayPercents(State.round.lastObjectiveProgress);
            value = winnerTeamNum === TeamID.Team1
                ? percents.left
                : (winnerTeamNum === TeamID.Team2 ? percents.right : 50);
            break;
        case RoundEndDetailReason.TimeOverKills:
            key = isViewerWinner ? STR_ROUND_END_DETAIL_WIN_TIME_OVER_KILLS : STR_ROUND_END_DETAIL_LOSE_TIME_OVER_KILLS;
            break;
        default:
            return undefined;
    }

    const teamColor = winnerTeamNum === TeamID.Team1
        ? COLOR_BLUE
        : (winnerTeamNum === TeamID.Team2 ? COLOR_RED : COLOR_WHITE);
    return { key, color: teamColor, value };
}

function updateRoundEndDialogForAllPlayers(winnerTeamNum: TeamID | 0): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const pid = safeGetPlayerId(p);
        if (pid === undefined || isPidDisconnected(pid)) continue;
        updateRoundEndDialogForPlayer(p, winnerTeamNum);
    }
}

function updateRoundEndDialogForPlayer(player: mod.Player, winnerTeamNum: TeamID | 0): void {
    if (!player || !mod.IsPlayerValid(player)) return;
    const pid = safeGetPlayerId(player);
    if (pid === undefined || isPidDisconnected(pid)) return;
    const refs = State.hudCache.hudByPid[pid];
    if (!refs) return;

    // Ensure labels are always authoritative at the time the dialog is shown.
    if (refs.roundEndRoundText) {
        safeSetUITextLabel(
            refs.roundEndRoundText,
            // RoundEnd_RoundNumber is a dedicated format key ("ROUND {0}") to avoid passing an empty string into RoundState_Format,
            // which Portal renders as <unknown string> when the key cannot be resolved.
            mod.Message(mod.stringkeys.twl.roundEnd.roundNumber, State.round.current)
        );
    }

    if (refs.roundEndOutcomeText) {
        if (winnerTeamNum === TeamID.Team1) {
            safeSetUITextLabel(
                refs.roundEndOutcomeText,
                mod.Message(mod.stringkeys.twl.victory.teamOutcomeFormat, getTeamNameKey(TeamID.Team1), mod.stringkeys.twl.victory.wins)
            );
        } else if (winnerTeamNum === TeamID.Team2) {
            safeSetUITextLabel(
                refs.roundEndOutcomeText,
                mod.Message(mod.stringkeys.twl.victory.teamOutcomeFormat, getTeamNameKey(TeamID.Team2), mod.stringkeys.twl.victory.wins)
            );
        } else {
            setWidgetText(refs.roundEndOutcomeText, mod.stringkeys.twl.roundEnd.draw);
        }
    }

    if (refs.roundEndDetailText) {
        const viewerTeamNum = getTeamNumber(mod.GetTeam(player));
        const detail = getRoundEndDetailForViewer(viewerTeamNum, winnerTeamNum);
        if (detail) {
            const label = detail.value !== undefined
                ? mod.Message(detail.key, detail.value)
                : mod.Message(detail.key);
            safeSetUITextLabel(refs.roundEndDetailText, label);
            safeSetUITextColor(refs.roundEndDetailText, detail.color);
            setWidgetVisible(refs.roundEndDetailText, true);
        } else {
            setWidgetVisible(refs.roundEndDetailText, false);
        }
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

    const isDialogOpen = isTeamSwitchDialogOpenForPid(pid);
    const isReady = !!State.players.readyByPid[pid];
    const isDeployed = !!State.players.deployedByPid[pid];
    const canShow = (!State.match.isEnded)
        && (!State.match.victoryDialogActive)
        && (!State.round.flow.roundEndDialogVisible)
        && (!State.round.flow.cleanupActive)
        && (isDeployed);
    const showHelp = canShow && (!isRoundLive()) && (!isReady) && (!isDialogOpen);
    const showReady = canShow && (!isRoundLive()) && (isReady) && (!isDialogOpen);

    const helpContainer = refs.helpTextContainer ?? safeFind(`Container_HelpText_${pid}`);
    if (helpContainer) {
        // Apply the computed visibility to the help text widget.
        safeSetUIWidgetVisible(helpContainer, showHelp);
    }

    const helpText = safeFind(`HelpText_${pid}`);
    if (helpText) {
        const autoReadyHelpActive = !!State.players.autoReadyByPid[pid] && (!isReady);
        const helpLabel = autoReadyHelpActive
            ? mod.Message(STR_HUD_AUTO_READY_HELP_TEXT)
            : mod.Message(mod.stringkeys.twl.hud.helpText);
        mod.SetUITextLabel(helpText, helpLabel);
    }

    const readyContainer = refs.readyStatusContainer ?? safeFind(`Container_ReadyStatus_${pid}`);
    if (readyContainer) {
        safeSetUIWidgetVisible(readyContainer, showReady);
    }

    const readyText = safeFind(`ReadyStatusText_${pid}`);
    if (readyText) {
        const viewer = safeFindPlayer(pid);
        const inVehicle = (viewer && isDeployed)
            ? safeGetSoldierStateBool(viewer, mod.SoldierStateBool.IsInVehicle)
            : false;
        const autoReadyActive = !!State.players.autoReadyByPid[pid]
            && isReady
            && inVehicle
            && isPlayerInMainBaseForReady(pid);
        const readyLabel = autoReadyActive
            ? mod.Message(STR_HUD_AUTO_READY_TEXT)
            : mod.Message(mod.stringkeys.twl.hud.readyText);
        mod.SetUITextLabel(readyText, readyLabel);
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
        cached.spawnDisabledLiveText = ensureSpawnDisabledLiveText(player);
        const helpContainer = safeFind(`Container_HelpText_${pid}`);
        if (helpContainer) {
            mod.SetUIWidgetPosition(helpContainer, mod.CreateVector(-165.5, 75.25, 0)); //-116.5, 75.25, 0
        }
        const readyContainer = safeFind(`Container_ReadyStatus_${pid}`);
        if (readyContainer) {
            mod.SetUIWidgetPosition(readyContainer, mod.CreateVector(-165.5, 75.25, 0));
        }
        const adminActionCounter = safeFind(`AdminPanelActionCount_${pid}`);
        if (adminActionCounter) {
            mod.SetUIWidgetPosition(adminActionCounter, mod.CreateVector(20, 22, 0));
        }
        ensureTopHudRootForPid(pid, player);
        setHudHelpDepthForPid(pid);
        updateSettingsSummaryHudForPid(pid);

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
            position: [5, 5 + TOP_HUD_OFFSET_Y],
            size: [200, 30],
            anchor: mod.UIAnchor.TopLeft,
            visible: true,
            padding: 1,
            bgColor: [0.251, 0.0941, 0.0667],
            bgAlpha: 0.5625,
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

    // --- Static HUD: Upper-left settings summary (below branding) ---
    {
        const SETTINGS_CONTAINER_X = 5;
        const SETTINGS_CONTAINER_Y = 5 + TOP_HUD_OFFSET_Y + 30 + 6;
        const SETTINGS_LINE_HEIGHT = 12;
        const SETTINGS_TEXT_WIDTH = 200;
        const SETTINGS_TEXT_SIZE = 9;
        const SETTINGS_TEXT_COLOR: [number, number, number] = [0.6784, 0.9922, 0.5255];

        const settingsSummary = modlib.ParseUI({
            name: `Upper_Left_Settings_${pid}`,
            type: "Container",
            playerId: player,
            position: [SETTINGS_CONTAINER_X, SETTINGS_CONTAINER_Y],
            size: [SETTINGS_TEXT_WIDTH, SETTINGS_LINE_HEIGHT * 6],
            anchor: mod.UIAnchor.TopLeft,
            visible: true,
            padding: 1,
            bgColor: [0.251, 0.0941, 0.0667],
            bgAlpha: 0.5625,
            bgFill: mod.UIBgFill.Blur,
            children: [
                {
                    name: `Settings_GameMode_${pid}`,
                    type: "Text",
                    position: [6, 0],
                    size: [SETTINGS_TEXT_WIDTH - 12, 16],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(STR_HUD_SETTINGS_GAME_MODE_FORMAT, STR_HUD_SETTINGS_GAME_MODE_DEFAULT),
                    textColor: SETTINGS_TEXT_COLOR,
                    textAlpha: 1,
                    textSize: SETTINGS_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.TopLeft,
                },
                {
                    name: `Settings_Ceiling_${pid}`,
                    type: "Text",
                    position: [6, SETTINGS_LINE_HEIGHT],
                    size: [SETTINGS_TEXT_WIDTH - 12, 16],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(STR_HUD_SETTINGS_AIRCRAFT_CEILING_FORMAT, STR_READY_DIALOG_AIRCRAFT_CEILING_VANILLA),
                    textColor: SETTINGS_TEXT_COLOR,
                    textAlpha: 1,
                    textSize: SETTINGS_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.TopLeft,
                },
                {
                    name: `Settings_VehiclesT1_${pid}`,
                    type: "Text",
                    position: [6, SETTINGS_LINE_HEIGHT * 2],
                    size: [SETTINGS_TEXT_WIDTH - 12, 16],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(
                        STR_HUD_SETTINGS_VEHICLES_TEAM_FORMAT,
                        getTeamNameKey(TeamID.Team1),
                        STR_HUD_SETTINGS_VALUE_DEFAULT
                    ),
                    textColor: SETTINGS_TEXT_COLOR,
                    textAlpha: 1,
                    textSize: SETTINGS_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.TopLeft,
                },
                {
                    name: `Settings_VehiclesT2_${pid}`,
                    type: "Text",
                    position: [6, SETTINGS_LINE_HEIGHT * 3],
                    size: [SETTINGS_TEXT_WIDTH - 12, 16],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(
                        STR_HUD_SETTINGS_VEHICLES_TEAM_FORMAT,
                        getTeamNameKey(TeamID.Team2),
                        STR_HUD_SETTINGS_VALUE_DEFAULT
                    ),
                    textColor: SETTINGS_TEXT_COLOR,
                    textAlpha: 1,
                    textSize: SETTINGS_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.TopLeft,
                },
                {
                    name: `Settings_VehiclesMatchup_${pid}`,
                    type: "Text",
                    position: [6, SETTINGS_LINE_HEIGHT * 4],
                    size: [SETTINGS_TEXT_WIDTH - 12, 16],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(STR_HUD_SETTINGS_VEHICLES_MATCHUP_FORMAT, 1, 1),
                    textColor: SETTINGS_TEXT_COLOR,
                    textAlpha: 1,
                    textSize: SETTINGS_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.TopLeft,
                },
                {
                    name: `Settings_Players_${pid}`,
                    type: "Text",
                    position: [6, SETTINGS_LINE_HEIGHT * 5],
                    size: [SETTINGS_TEXT_WIDTH - 12, 16],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(STR_HUD_SETTINGS_PLAYERS_FORMAT, 1, 1),
                    textColor: SETTINGS_TEXT_COLOR,
                    textAlpha: 1,
                    textSize: SETTINGS_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.TopLeft,
                },
            ],
        });
        if (settingsSummary) refs.roots.push(settingsSummary);
    }

    //#endregion ----------------- HUD Build/Ensure - Upper-Left HUD --------------------



    //#region -------------------- HUD Build/Ensure - Top-Center Panels --------------------

    // --- Static HUD: Top-center panels (TeamLeft / Middle / TeamRight) ---
    {
        const TOP_PANEL_Y = 44.75 + TOP_HUD_OFFSET_Y;
        const PANEL_WIDTH = 114.5;
        const PANEL_HEIGHT = 74;
        const MID_PANEL_X = 902.75;
        const LEFT_PANEL_X = 783.86;
        const RIGHT_PANEL_X = 1021.64;
        const PANEL_GAP = MID_PANEL_X - LEFT_PANEL_X - PANEL_WIDTH;
        const ROUND_KILLS_PANEL_SIZE = PANEL_HEIGHT;
        const ROUND_KILLS_LEFT_X = LEFT_PANEL_X - ROUND_KILLS_PANEL_SIZE - PANEL_GAP;
        const ROUND_KILLS_RIGHT_X = RIGHT_PANEL_X + PANEL_WIDTH + PANEL_GAP;
        const TRENDING_CROWN_SIZE = 18;
        const TRENDING_CROWN_OFFSET_Y = 4;
        const TRENDING_CROWN_LEFT_X = PANEL_WIDTH - TRENDING_CROWN_SIZE - 10;
        const TRENDING_CROWN_RIGHT_X = 10;
        const mid = modlib.ParseUI({
            // UI element: Container_TopMiddle_CoreUI_${pid}
            name: `Container_TopMiddle_CoreUI_${pid}`,
            type: "Container",
            playerId: player,
            // position: [x, y] offset; direction depends on anchor, so verify visually in-game
            position: [MID_PANEL_X, TOP_PANEL_Y],
            size: [PANEL_WIDTH, PANEL_HEIGHT],
            anchor: mod.UIAnchor.TopLeft,
            visible: true,
            padding: 0,
            bgColor: [0.0314, 0.0431, 0.0431],
            bgAlpha: 0.75,
            bgFill: mod.UIBgFill.Blur,
            children: [
                {
                    // UI element: RoundText_${pid}
                    name: `RoundText_${pid}`,
                    type: "Text",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [0.5, -4],
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
                    position: [-165.5, 92], //[-116.5, 92]
                    size: [450, 20],
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
                            position: [0, 2],
                            size: [450, 14],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: true,
                            padding: 0,
                            bgColor: [0.2, 0.2, 0.2],
                            bgAlpha: 1,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.stringkeys.twl.hud.helpText,
                            textColor: [0.251, 0.0941, 0.0667],
                            textAlpha: 1,
                            textSize: 12,
                            textAnchor: mod.UIAnchor.Center,
                        },
                    ],
                },
                {
                    // Ready status text shown when the player is READY and the round is not live
                    name: `Container_ReadyStatus_${pid}`,
                    type: "Container",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [-165.5, 92], //[-116.5, 92]
                    size: [450, 20],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: false,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    children: [
                        {
                            // Ready status text shown when enabled for this player
                            name: `ReadyStatusText_${pid}`,
                            type: "Text",
                            // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                            position: [0, 2],
                            size: [450, 14],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: true,
                            padding: 0,
                            bgAlpha: 0,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.stringkeys.twl.hud.readyText,
                            textColor: [0.6784, 0.9922, 0.5255],
                            textAlpha: 1,
                            textSize: 12,
                            textAnchor: mod.UIAnchor.Center,
                        },
                    ],
                },
                {
                    // UI element: Slash_${pid}
                    name: `Slash_${pid}`,
                    type: "Text",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [71.5 + ROUND_SLASH_OFFSET_X, -2],
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
            position: [LEFT_PANEL_X, TOP_PANEL_Y],
            size: [PANEL_WIDTH, PANEL_HEIGHT],
            anchor: mod.UIAnchor.TopLeft,
            visible: true,
            padding: 0,
            bgColor: [0.4392, 0.9216, 1],
            bgAlpha: 0.75,
            bgFill: mod.UIBgFill.Blur,
            children: [
                {
                    // Trending winner crown (solid) for Team 1
                    name: `TeamLeft_Trending_Crown_${pid}`,
                    type: "Image",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [TRENDING_CROWN_LEFT_X, TRENDING_CROWN_OFFSET_Y],
                    size: [TRENDING_CROWN_SIZE, TRENDING_CROWN_SIZE],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: false,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    imageType: mod.UIImageType.CrownSolid,
                    imageColor: [1, 252 / 255, 156 / 255],
                    imageAlpha: 1,
                },
                {
                    // Team name label for Team 1 (left side)
                    name: `TeamLeft_Name_${pid}`,
                    type: "Text",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [23.25, 0],
                    size: [68, 28],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgColor: [0.2, 0.2, 0.2],
                    bgAlpha: 1,
                    bgFill: mod.UIBgFill.None,
                    textLabel: getTeamNameKey(TeamID.Team1),
                    textColor: [1, 1, 1],
                    textAlpha: 1,
                    textSize: 18,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    // UI element: TeamLeft_Record_${pid}
                    name: `TeamLeft_Record_${pid}`,
                    type: "Text",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [2.25, 22],
                    size: [110, 20],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgColor: [0.2, 0.2, 0.2],
                    bgAlpha: 1,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(mod.stringkeys.twl.hud.roundRecordFormat, 0, 0, 0),
                    textColor: [1, 1, 1],
                    textAlpha: 1,
                    textSize: 18,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    // Display variable for round wins on Team 1 (left side)
                    name: `TeamLeft_Wins_${pid}`,
                    type: "Text",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [31, 45], //26.5, 44
                    size: [72, 16],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgColor: [0.2, 0.2, 0.2],
                    bgAlpha: 1,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.stringkeys.twl.hud.labels.roundWins,
                    textColor: [1, 1, 1],
                    textAlpha: 1,
                    textSize: 12,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    // Display variable for total kills on Team 1 (left side)
                    name: `TeamLeft_Kills_${pid}`,
                    type: "Text",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [26.5, 59], //26.5, 58
                    size: [72, 16],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgColor: [0.2, 0.2, 0.2],
                    bgAlpha: 1,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.stringkeys.twl.hud.labels.totalKills,
                    textColor: [1, 1, 1],
                    textAlpha: 1,
                    textSize: 12,
                    textAnchor: mod.UIAnchor.Center,
                },
            ],
        });
        if (t1Panel) refs.roots.push(t1Panel);

        const t1RoundKillsPanel = modlib.ParseUI({
            // UI element: Container_TopLeft_RoundKills_${pid}
            name: `Container_TopLeft_RoundKills_${pid}`,
            type: "Container",
            playerId: player,
            // position: [x, y] offset; direction depends on anchor, so verify visually in-game
            position: [ROUND_KILLS_LEFT_X, TOP_PANEL_Y],
            size: [ROUND_KILLS_PANEL_SIZE, ROUND_KILLS_PANEL_SIZE],
            anchor: mod.UIAnchor.TopLeft,
            visible: true,
            padding: 0,
            bgColor: [0.4392, 0.9216, 1],
            bgAlpha: 0.75,
            bgFill: mod.UIBgFill.Blur,
            children: [
                {
                    // Crown indicator shown for round winner (Team 1)
                    name: `TeamLeft_RoundKills_Crown_${pid}`,
                    type: "Image",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [0, -35],
                    size: [45, 45],
                    anchor: mod.UIAnchor.TopCenter,
                    visible: false,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    imageType: mod.UIImageType.CrownOutline,
                    imageColor: [1, 1, 1],
                    imageAlpha: 1,
                },
                {
                    // Big round-kills counter for Team 1
                    name: `TeamLeft_RoundKills_CounterText_${pid}`,
                    type: "Text",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [0, 0],
                    size: [ROUND_KILLS_PANEL_SIZE, 60],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                    textColor: COLOR_BLUE,
                    textAlpha: 1,
                    textSize: 60,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    // Round kills label (bottom of the panel)
                    name: `TeamLeft_RoundKills_${pid}`,
                    type: "Text",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [0, 53],
                    size: [ROUND_KILLS_PANEL_SIZE, 18],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(mod.stringkeys.twl.hud.labels.roundKillsWithRoundFormat, getRoundKillsLabelRound()),
                    textColor: [1, 1, 1],
                    textAlpha: 1,
                    textSize: 11,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    // Registered vehicles alive (live round only)
                    name: `TeamLeft_RoundKills_VehiclesAlive_${pid}`,
                    type: "Text",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [0, 76],
                    size: [ROUND_KILLS_PANEL_SIZE, 12],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: false,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(mod.stringkeys.twl.hud.vehiclesAliveFormat, 0),
                    textColor: [1, 1, 1],
                    textAlpha: 1,
                    textSize: 10,
                    textAnchor: mod.UIAnchor.Center,
                },
            ],
        });
        if (t1RoundKillsPanel) refs.roots.push(t1RoundKillsPanel);

        const t2Panel = modlib.ParseUI({
            // UI element: Container_TopRight_CoreUI_${pid}
            name: `Container_TopRight_CoreUI_${pid}`,
            type: "Container",
            playerId: player,
            // position: [x, y] offset; direction depends on anchor, so verify visually in-game
            position: [RIGHT_PANEL_X, TOP_PANEL_Y],
            size: [PANEL_WIDTH, PANEL_HEIGHT],
            anchor: mod.UIAnchor.TopLeft,
            visible: true,
            padding: 0,
            bgColor: [1, 0.5137, 0.3804],
            bgAlpha: 0.75,
            bgFill: mod.UIBgFill.Blur,
            children: [
                {
                    // Trending winner crown (solid) for Team 2
                    name: `TeamRight_Trending_Crown_${pid}`,
                    type: "Image",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [TRENDING_CROWN_RIGHT_X, TRENDING_CROWN_OFFSET_Y],
                    size: [TRENDING_CROWN_SIZE, TRENDING_CROWN_SIZE],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: false,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    imageType: mod.UIImageType.CrownSolid,
                    imageColor: [1, 252 / 255, 156 / 255],
                    imageAlpha: 1,
                },
                {
                    // Team name label for Team 2 (right side)
                    name: `TeamRight_Name_${pid}`,
                    type: "Text",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [23.25, 0],
                    size: [68, 28],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgColor: [0.2, 0.2, 0.2],
                    bgAlpha: 1,
                    bgFill: mod.UIBgFill.None,
                    textLabel: getTeamNameKey(TeamID.Team2),
                    textColor: [1, 1, 1],
                    textAlpha: 1,
                    textSize: 18,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    // UI element: TeamRight_Record_${pid}
                    name: `TeamRight_Record_${pid}`,
                    type: "Text",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [2.25, 22],
                    size: [110, 20],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgColor: [0.2, 0.2, 0.2],
                    bgAlpha: 1,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(mod.stringkeys.twl.hud.roundRecordFormat, 0, 0, 0),
                    textColor: [1, 1, 1],
                    textAlpha: 1,
                    textSize: 18,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    // Display variable for round wins on Team 2 (right side)
                    name: `TeamRight_Wins_${pid}`,
                    type: "Text",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [31, 45], //26.5, 44
                    size: [72, 16],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgColor: [0.2, 0.2, 0.2],
                    bgAlpha: 1,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.stringkeys.twl.hud.labels.roundWins,
                    textColor: [1, 1, 1],
                    textAlpha: 1,
                    textSize: 12,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    // Display variable for total kills on Team 2 (right side)
                    name: `TeamRight_Kills_${pid}`,
                    type: "Text",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [26.5, 59], //58
                    size: [72, 16],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgColor: [0.2, 0.2, 0.2],
                    bgAlpha: 1,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.stringkeys.twl.hud.labels.totalKills,
                    textColor: [1, 1, 1],
                    textAlpha: 1,
                    textSize: 12,
                    textAnchor: mod.UIAnchor.Center,
                },
            ],
        });

        const t2RoundKillsPanel = modlib.ParseUI({
            // UI element: Container_TopRight_RoundKills_${pid}
            name: `Container_TopRight_RoundKills_${pid}`,
            type: "Container",
            playerId: player,
            // position: [x, y] offset; direction depends on anchor, so verify visually in-game
            position: [ROUND_KILLS_RIGHT_X, TOP_PANEL_Y],
            size: [ROUND_KILLS_PANEL_SIZE, ROUND_KILLS_PANEL_SIZE],
            anchor: mod.UIAnchor.TopLeft,
            visible: true,
            padding: 0,
            bgColor: [1, 0.5137, 0.3804],
            bgAlpha: 0.75,
            bgFill: mod.UIBgFill.Blur,
            children: [
                {
                    // Crown indicator shown for round winner (Team 2)
                    name: `TeamRight_RoundKills_Crown_${pid}`,
                    type: "Image",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [0, -35],
                    size: [45, 45],
                    anchor: mod.UIAnchor.TopCenter,
                    visible: false,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    imageType: mod.UIImageType.CrownOutline,
                    imageColor: [1, 1, 1],
                    imageAlpha: 1,
                },
                {
                    // Big round-kills counter for Team 2
                    name: `TeamRight_RoundKills_CounterText_${pid}`,
                    type: "Text",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [0, 0],
                    size: [ROUND_KILLS_PANEL_SIZE, 60],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                    textColor: COLOR_RED,
                    textAlpha: 1,
                    textSize: 60,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    // Round kills label (bottom of the panel)
                    name: `TeamRight_RoundKills_${pid}`,
                    type: "Text",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [0, 53],
                    size: [ROUND_KILLS_PANEL_SIZE, 18],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(mod.stringkeys.twl.hud.labels.roundKillsWithRoundFormat, getRoundKillsLabelRound()),
                    textColor: [1, 1, 1],
                    textAlpha: 1,
                    textSize: 11,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    // Registered vehicles alive (live round only)
                    name: `TeamRight_RoundKills_VehiclesAlive_${pid}`,
                    type: "Text",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [0, 76],
                    size: [ROUND_KILLS_PANEL_SIZE, 12],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: false,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(mod.stringkeys.twl.hud.vehiclesAliveFormat, 0),
                    textColor: [1, 1, 1],
                    textAlpha: 1,
                    textSize: 10,
                    textAnchor: mod.UIAnchor.Center,
                },
            ],
        });
        if (t2RoundKillsPanel) refs.roots.push(t2RoundKillsPanel);

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
            position: [20, 22],
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
    refs.leftRoundKillsText = safeFind(`TeamLeft_RoundKills_CounterText_${pid}`);
    refs.rightRoundKillsText = safeFind(`TeamRight_RoundKills_CounterText_${pid}`);
    refs.leftRoundKillsLabel = safeFind(`TeamLeft_RoundKills_${pid}`);
    refs.rightRoundKillsLabel = safeFind(`TeamRight_RoundKills_${pid}`);
    refs.leftVehiclesAliveText = safeFind(`TeamLeft_RoundKills_VehiclesAlive_${pid}`);
    refs.rightVehiclesAliveText = safeFind(`TeamRight_RoundKills_VehiclesAlive_${pid}`);
    refs.leftRoundKillsCrown = safeFind(`TeamLeft_RoundKills_Crown_${pid}`);
    refs.rightRoundKillsCrown = safeFind(`TeamRight_RoundKills_Crown_${pid}`);
    refs.leftTrendingWinnerCrown = safeFind(`TeamLeft_Trending_Crown_${pid}`);
    refs.rightTrendingWinnerCrown = safeFind(`TeamRight_Trending_Crown_${pid}`);
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
                        textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
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

        refs.roundCurText = mkCounter(
            `RoundCounterContainer_${pid}`,
            `RoundCounterText_${pid}`,
            [970.93 + ROUND_COUNTER_OFFSET_X, 44.35 + TOP_HUD_OFFSET_Y],
            [13.95, 18.15],
            16
        );
        refs.roundMaxText = mkCounter(
            `RoundCounterMaxContainer_${pid}`,
            `RoundCounterMaxText_${pid}`,
            [993.03 + ROUND_COUNTER_OFFSET_X, 44.35 + TOP_HUD_OFFSET_Y],
            [13.95, 18.15],
            16
        );

        refs.leftWinsText = mkCounter(
            `TeamLeft_Wins_Counter_${pid}`,
            `TeamLeft_Wins_CounterText_${pid}`,
            [803.03, 84.75 + TOP_HUD_OFFSET_Y],
            [20, 24],
            15
        );
        refs.rightWinsText = mkCounter(
            `TeamRight_Wins_Counter_${pid}`,
            `TeamRight_Wins_CounterText_${pid}`,
            [1039.76, 84.75 + TOP_HUD_OFFSET_Y],
            [20, 24],
            15
        );

        refs.leftKillsText = mkCounter(
            `TeamLeft_Kills_Counter_${pid}`,
            `TeamLeft_Kills_CounterText_${pid}`,
            [803.03, 98.75 + TOP_HUD_OFFSET_Y],
            [20, 24],
            15
        );
        refs.rightKillsText = mkCounter(
            `TeamRight_Kills_Counter_${pid}`,
            `TeamRight_Kills_CounterText_${pid}`,
            [1039.76, 98.75 + TOP_HUD_OFFSET_Y],
            [20, 24],
            15
        );
    }

    //#endregion ----------------- HUD Build/Ensure - Counter Widgets --------------------



    //#region -------------------- HUD Build/Ensure - Round-End Dialog --------------------

    {
        const spawnDisabledText = ensureSpawnDisabledLiveText(player);
        if (spawnDisabledText) refs.roots.push(spawnDisabledText);
    }

    //Code Cleanup: Need to reduce redundant comments, and when manually adjusting position/sizes update directions (e.g. +X is right or left)
    {
        const roundEndModal = modlib.ParseUI({
            // UI element: RoundEndDialogRoot_${pid}
            name: `RoundEndDialogRoot_${pid}`,
            type: "Container",
            playerId: player,
            // position: [x, y] offset; direction depends on anchor, so verify visually in-game
            position: [0, 150],
            size: [520, 112],
            anchor: mod.UIAnchor.TopCenter,
            visible: false,
            padding: 0,
            bgColor: [VICTORY_BG_RGB[0], VICTORY_BG_RGB[1], VICTORY_BG_RGB[2]],
            bgAlpha: 0.75,
            bgFill: mod.UIBgFill.Solid,
            children: [
                {
                    // UI element: RoundEndDialog_Round_${pid}
                    name: `RoundEndDialog_Round_${pid}`,
                    type: "Text",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [0, 16],
                    size: [340, 24],
                    anchor: mod.UIAnchor.TopCenter,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(mod.stringkeys.twl.roundEnd.roundNumber, State.round.current),
                    textColor: [1, 1, 1],
                    textAlpha: 1,
                    textSize: 20,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    // UI element: RoundEndDialog_Outcome_${pid}
                    name: `RoundEndDialog_Outcome_${pid}`,
                    type: "Text",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [0, 46],
                    size: [340, 30],
                    anchor: mod.UIAnchor.TopCenter,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.stringkeys.twl.roundEnd.draw,
                    textColor: [1, 1, 1],
                    textAlpha: 1,
                    textSize: 26,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    // UI element: RoundEndDialog_Detail_${pid}
                    name: `RoundEndDialog_Detail_${pid}`,
                    type: "Text",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [0, 86],
                    size: [500, 18],
                    anchor: mod.UIAnchor.TopCenter,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.stringkeys.twl.roundEnd.draw,
                    textColor: [1, 1, 1],
                    textAlpha: 1,
                    textSize: 14,
                    textAnchor: mod.UIAnchor.Center,
                },
            ],
        });

        refs.roundEndRoot = roundEndModal;
        refs.roundEndRoundText = safeFind(`RoundEndDialog_Round_${pid}`);
        refs.roundEndOutcomeText = safeFind(`RoundEndDialog_Outcome_${pid}`);
        refs.roundEndDetailText = safeFind(`RoundEndDialog_Detail_${pid}`);
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
            position: [0, 135],
            size: [VICTORY_DIALOG_WIDTH, VICTORY_DIALOG_HEIGHT],
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
                                    textLabel: mod.Message(mod.stringkeys.twl.victory.teamOutcomeFormat, getTeamNameKey(TeamID.Team1), mod.stringkeys.twl.victory.loses),
                                    textColor: [VICTORY_TEAM1_TEXT_RGB[0], VICTORY_TEAM1_TEXT_RGB[1], VICTORY_TEAM1_TEXT_RGB[2]],
                                    textAlpha: 1,
                                    textSize: 18,
                                    textAnchor: mod.UIAnchor.Center,
                                },
                                {
                                    // Winning crown (shown only for the winning team)
                                    name: `VictoryDialog_LeftCrown_${pid}`,
                                    type: "Image",
                                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                                    position: [VICTORY_CROWN_OFFSET_X_LEFT, VICTORY_CROWN_OFFSET_Y],
                                    size: [VICTORY_CROWN_SIZE, VICTORY_CROWN_SIZE],
                                    anchor: mod.UIAnchor.TopCenter,
                                    visible: false,
                                    padding: 0,
                                    bgAlpha: 0,
                                    bgFill: mod.UIBgFill.None,
                                    imageType: mod.UIImageType.CrownSolid,
                                    imageColor: VICTORY_CROWN_COLOR_RGB,
                                    imageAlpha: 1,
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
                                    textLabel: mod.Message(mod.stringkeys.twl.victory.teamOutcomeFormat, getTeamNameKey(TeamID.Team2), mod.stringkeys.twl.victory.wins),
                                    textColor: [VICTORY_TEAM2_TEXT_RGB[0], VICTORY_TEAM2_TEXT_RGB[1], VICTORY_TEAM2_TEXT_RGB[2]],
                                    textAlpha: 1,
                                    textSize: 18,
                                    textAnchor: mod.UIAnchor.Center,
                                },
                                {
                                    // Winning crown (shown only for the winning team)
                                    name: `VictoryDialog_RightCrown_${pid}`,
                                    type: "Image",
                                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                                    position: [VICTORY_CROWN_OFFSET_X_RIGHT, VICTORY_CROWN_OFFSET_Y],
                                    size: [VICTORY_CROWN_SIZE, VICTORY_CROWN_SIZE],
                                    anchor: mod.UIAnchor.TopCenter,
                                    visible: false,
                                    padding: 0,
                                    bgAlpha: 0,
                                    bgFill: mod.UIBgFill.None,
                                    imageType: mod.UIImageType.CrownSolid,
                                    imageColor: VICTORY_CROWN_COLOR_RGB,
                                    imageAlpha: 1,
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
                {
                    // UI element: VictoryDialog_RosterRow_${pid}
                    name: `VictoryDialog_RosterRow_${pid}`,
                    type: "Container",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [0, VICTORY_DIALOG_ROSTER_ROW_Y],
                    size: [VICTORY_DIALOG_ROSTER_ROW_WIDTH, VICTORY_DIALOG_ROSTER_ROW_HEIGHT_MAX],
                    anchor: mod.UIAnchor.TopCenter,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    children: [
                        {
                            // UI element: VictoryDialog_RosterLeft_${pid}
                            name: `VictoryDialog_RosterLeft_${pid}`,
                            type: "Container",
                            // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                            position: [-85, 0],
                            size: [VICTORY_DIALOG_ROSTER_CONTAINER_WIDTH, VICTORY_DIALOG_ROSTER_ROW_HEIGHT_MAX],
                            anchor: mod.UIAnchor.TopCenter,
                            visible: true,
                            padding: 0,
                            bgColor: [VICTORY_TEAM1_BG_RGB[0], VICTORY_TEAM1_BG_RGB[1], VICTORY_TEAM1_BG_RGB[2]],
                            bgAlpha: 0.95,
                            bgFill: mod.UIBgFill.Solid,
                            children: (function () {
                                const rows: any[] = [];
                                for (let i = 0; i < TEAM_ROSTER_MAX_ROWS; i++) {
                                    rows.push({
                                        name: `VictoryDialog_LeftRoster_${pid}_${i}`,
                                        type: "Text",
                                        // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                                        position: [0, VICTORY_DIALOG_ROSTER_ROW_PADDING_TOP + i * VICTORY_DIALOG_ROSTER_ROW_HEIGHT],
                                        size: [VICTORY_DIALOG_ROSTER_CONTAINER_WIDTH, VICTORY_DIALOG_ROSTER_ROW_HEIGHT],
                                        anchor: mod.UIAnchor.TopCenter,
                                        visible: true,
                                        padding: 0,
                                        bgAlpha: 0,
                                        bgFill: mod.UIBgFill.None,
                                        textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, ""),
                                        textColor: [VICTORY_TEAM1_TEXT_RGB[0], VICTORY_TEAM1_TEXT_RGB[1], VICTORY_TEAM1_TEXT_RGB[2]],
                                        textAlpha: 1,
                                        textSize: 11,
                                        textAnchor: mod.UIAnchor.Center,
                                    });
                                }
                                return rows;
                            })(),
                        },
                        {
                            // UI element: VictoryDialog_RosterRight_${pid}
                            name: `VictoryDialog_RosterRight_${pid}`,
                            type: "Container",
                            // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                            position: [85, 0],
                            size: [VICTORY_DIALOG_ROSTER_CONTAINER_WIDTH, VICTORY_DIALOG_ROSTER_ROW_HEIGHT_MAX],
                            anchor: mod.UIAnchor.TopCenter,
                            visible: true,
                            padding: 0,
                            bgColor: [VICTORY_TEAM2_BG_RGB[0], VICTORY_TEAM2_BG_RGB[1], VICTORY_TEAM2_BG_RGB[2]],
                            bgAlpha: 0.95,
                            bgFill: mod.UIBgFill.Solid,
                            children: (function () {
                                const rows: any[] = [];
                                for (let i = 0; i < TEAM_ROSTER_MAX_ROWS; i++) {
                                    rows.push({
                                        name: `VictoryDialog_RightRoster_${pid}_${i}`,
                                        type: "Text",
                                        // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                                        position: [0, VICTORY_DIALOG_ROSTER_ROW_PADDING_TOP + i * VICTORY_DIALOG_ROSTER_ROW_HEIGHT],
                                        size: [VICTORY_DIALOG_ROSTER_CONTAINER_WIDTH, VICTORY_DIALOG_ROSTER_ROW_HEIGHT],
                                        anchor: mod.UIAnchor.TopCenter,
                                        visible: true,
                                        padding: 0,
                                        bgAlpha: 0,
                                        bgFill: mod.UIBgFill.None,
                                        textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, ""),
                                        textColor: [VICTORY_TEAM2_TEXT_RGB[0], VICTORY_TEAM2_TEXT_RGB[1], VICTORY_TEAM2_TEXT_RGB[2]],
                                        textAlpha: 1,
                                        textSize: 11,
                                        textAnchor: mod.UIAnchor.Center,
                                    });
                                }
                                return rows;
                            })(),
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
        refs.victoryLeftCrown = safeFind(`VictoryDialog_LeftCrown_${pid}`);

        refs.victoryRightOutcomeText = safeFind(`VictoryDialog_RightOutcome_${pid}`);
        refs.victoryRightRoundWinsText = safeFind(`VictoryDialog_RightRoundWins_${pid}`);
        refs.victoryRightRoundLossesText = safeFind(`VictoryDialog_RightRoundLosses_${pid}`);
        refs.victoryRightRoundTiesText = safeFind(`VictoryDialog_RightRoundTies_${pid}`);
        refs.victoryLeftRecordText = safeFind(`VictoryDialog_LeftRecord_${pid}`);
        refs.victoryRightRecordText = safeFind(`VictoryDialog_RightRecord_${pid}`);
        refs.victoryRightTotalKillsText = safeFind(`VictoryDialog_RightTotalKills_${pid}`);
        refs.victoryRightCrown = safeFind(`VictoryDialog_RightCrown_${pid}`);
        refs.victoryRosterRow = safeFind(`VictoryDialog_RosterRow_${pid}`);
        refs.victoryRosterLeftContainer = safeFind(`VictoryDialog_RosterLeft_${pid}`);
        refs.victoryRosterRightContainer = safeFind(`VictoryDialog_RosterRight_${pid}`);

        refs.victoryLeftRosterText = [];
        refs.victoryRightRosterText = [];
        for (let i = 0; i < TEAM_ROSTER_MAX_ROWS; i++) {
            refs.victoryLeftRosterText.push(safeFind(`VictoryDialog_LeftRoster_${pid}_${i}`));
            refs.victoryRightRosterText.push(safeFind(`VictoryDialog_RightRoster_${pid}_${i}`));
        }
    }

    //#endregion ----------------- HUD Build/Ensure - Victory Dialog --------------------



    //#region -------------------- HUD Build/Ensure - Cache Init + Defaults --------------------

    refs.helpTextContainer = safeFind(`Container_HelpText_${pid}`);
    refs.readyStatusContainer = safeFind(`Container_ReadyStatus_${pid}`);
    refs.spawnDisabledLiveText = safeFind(`SpawnDisabledLiveText_${pid}`);
    refs.settingsGameModeText = safeFind(`Settings_GameMode_${pid}`);
    refs.settingsAircraftCeilingText = safeFind(`Settings_Ceiling_${pid}`);
    refs.settingsVehiclesT1Text = safeFind(`Settings_VehiclesT1_${pid}`);
    refs.settingsVehiclesT2Text = safeFind(`Settings_VehiclesT2_${pid}`);
    refs.settingsVehiclesMatchupText = safeFind(`Settings_VehiclesMatchup_${pid}`);
    refs.settingsPlayersText = safeFind(`Settings_Players_${pid}`);
    State.hudCache.hudByPid[pid] = refs;

    // Initialize visible numbers immediately
    setCounterText(refs.roundCurText, State.round.current);
    setCounterText(refs.roundMaxText, State.round.max);
    setCounterText(refs.leftWinsText, State.match.winsT1);
    setCounterText(refs.rightWinsText, State.match.winsT2);

    setCounterText(refs.leftRoundKillsText, State.scores.t1RoundKills);
    setCounterText(refs.rightRoundKillsText, State.scores.t2RoundKills);
    setRoundKillsLabelTextForRefs(refs);
    setRoundWinCrownForRefs(refs, State.round.lastWinnerTeam, State.round.flow.roundEndDialogVisible);
    setTrendingWinnerCrownForRefs(refs);

    // Total kills are tracked separately from GameModeScore (which is used for match wins)
    setCounterText(refs.leftKillsText, State.scores.t1TotalKills);
    setCounterText(refs.rightKillsText, State.scores.t2TotalKills);
    setAdminPanelActionCountText(refs.adminPanelActionCountText, State.admin.actionCount);
    updateSettingsSummaryHudForPid(pid);

    ensureTopHudRootForPid(pid, player);
    setHudHelpDepthForPid(pid);

    updateVictoryDialogForPlayer(player, getRemainingSeconds());

    return refs;
}

//#endregion ----------------- HUD Build/Ensure - Cache Init + Defaults --------------------



//#region -------------------- HUD Update Helpers --------------------

function setHudRoundCountersForAllPlayers(cur: number, max: number): void {
    // Sets authoritative round current/max values and syncs HUD + Ready dialog "Best of".
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
    // Updates match win counters in script state and GameModeScore, then refreshes HUD.
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
    setTrendingWinnerCrownForAllPlayers();

    syncRoundRecordHudForAllPlayers();
}

function syncRoundRecordHudForAllPlayers(): void {
    // Derives losses from wins/ties and syncs the Round Record HUD for both teams.
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
    // Applies a delta to match ties for both teams and refreshes the Round Record HUD.
    const current = Math.min(State.match.tiesT1, State.match.tiesT2);
    const next = Math.max(0, Math.floor(current + delta));
    State.match.tiesT1 = next;
    State.match.tiesT2 = next;
    syncRoundRecordHudForAllPlayers();
}

function updateAdminPanelActionCountForAllPlayers(): void {
    // Pushes the admin action count to every player's HUD widget.
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
    // Increments the admin action counter and broadcasts the action to the world log.
    State.admin.actionCount = Math.max(0, Math.floor(State.admin.actionCount) + 1);
    updateAdminPanelActionCountForAllPlayers();
    sendHighlightedWorldLogMessage(
        mod.Message(mod.stringkeys.twl.adminPanel.actionPressed, eventPlayer, actionKey),
        true,
        undefined,
        mod.stringkeys.twl.adminPanel.actionPressed
    );
}

//#endregion ----------------- HUD Update Helpers --------------------



//#region -------------------- Legacy UI Cleanup (old score_root_* containers) --------------------

// Code Cleanup: Is this still needed???
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
// Vehicle owner cache lifecycle:
// - setLastDriver on entry, popLastDriver on destruction, clearLastDriverByVehicleObjId on spawn/respawn.

function getVehicleId(v: mod.Vehicle): number { return getObjId(v); }

function getLastDriver(vehicle: mod.Vehicle): mod.Player | undefined {
    const vid = getVehicleId(vehicle);
    // Linear scan of the cached vehicle-id list to find its last known driver.
    for (let i = 0; i < vehIds.length; i++) {
        // Parallel arrays: vehIds[i] maps to vehOwners[i].
        if (vehIds[i] === vid) return vehOwners[i];
    }
    // No cached entry found.
    return undefined;
}

function setLastDriver(vehicle: mod.Vehicle, player: mod.Player): void {
    if (!player || !mod.IsPlayerValid(player)) return;
    const vid = getVehicleId(vehicle);
    // Update existing entry if this vehicle is already tracked.
    for (let i = 0; i < vehIds.length; i++) {
        if (vehIds[i] === vid) {
            vehOwners[i] = player;
            return;
        }
    }
    // First time we see this vehicle: append to the parallel arrays.
    vehIds.push(vid);
    vehOwners.push(player);
}

function popLastDriver(vehicle: mod.Vehicle): mod.Player | undefined {
    const vid = getVehicleId(vehicle);

    for (let i = 0; i < vehIds.length; i++) {
        // Find the vehicle entry, return its owner, then remove it from the cache.
        if (vehIds[i] === vid) {
            const owner = vehOwners[i];

            // Swap-remove to avoid shifting the arrays.
            const lastIdx = vehIds.length - 1;
            vehIds[i] = vehIds[lastIdx];
            vehOwners[i] = vehOwners[lastIdx];
            vehIds.pop();
            vehOwners.pop();

            // Return the removed owner (caller may use for messaging).
            return owner;
        }
    }
    // No cached entry found.
    return undefined;
}

function clearLastDriverByVehicleObjId(vehicleObjId: number): void {
    // Remove the last-driver entry for a specific vehicle ObjId (if it exists).
    for (let i = 0; i < vehIds.length; i++) {
        // Find the matching vehicle id in the parallel arrays.
        if (vehIds[i] === vehicleObjId) {
            // Swap-remove to keep arrays compact without preserving order.
            const lastIdx = vehIds.length - 1;
            vehIds[i] = vehIds[lastIdx];
            vehOwners[i] = vehOwners[lastIdx];
            vehIds.pop();
            vehOwners.pop();
            // Done: there is no longer a cached owner for this vehicle.
            return;
        }
    }
}

//#endregion ----------------- Vehicle Ownership Tracking (vehIds/vehOwners) --------------------



//#region -------------------- Vehicle Registration (team arrays) --------------------

// Registers vehicle ownership to a team for kill attribution.
// IMPORTANT:
// - Vehicle ID and owning team must stay in sync
// - Reassignments must overwrite previous ownership

function registerVehicleToTeam(vehicle: mod.Vehicle, teamNum: TeamID): void {
    // Ensure the vehicle exists in exactly one registry by removing it from both first.
    mod.SetVariable(regVehiclesTeam1, arrayRemoveVehicle(mod.GetVariable(regVehiclesTeam1), vehicle));
    mod.SetVariable(regVehiclesTeam2, arrayRemoveVehicle(mod.GetVariable(regVehiclesTeam2), vehicle));

    // Append the vehicle to the chosen team's registry array.
    if (teamNum === TeamID.Team1) {
        mod.SetVariable(regVehiclesTeam1, mod.AppendToArray(mod.GetVariable(regVehiclesTeam1), vehicle));
    } else if (teamNum === TeamID.Team2) {
        mod.SetVariable(regVehiclesTeam2, mod.AppendToArray(mod.GetVariable(regVehiclesTeam2), vehicle));
    }
}

function clearSpawnBaseTeamCache(): void {
    for (const k in vehicleSpawnBaseTeamByObjId) delete vehicleSpawnBaseTeamByObjId[k as any];
}

function inferBaseTeamFromPosition(pos: mod.Vector): TeamID | 0 {
    const d1 = mod.DistanceBetween(pos, MAIN_BASE_TEAM1_POS); // Distance from vehicle to Team 1 base anchor.
    const d2 = mod.DistanceBetween(pos, MAIN_BASE_TEAM2_POS); // Distance from vehicle to Team 2 base anchor.
    const best = d1 <= d2 ? TeamID.Team1 : TeamID.Team2; // Pick the nearer base as the inferred team.
    const bestDist = d1 <= d2 ? d1 : d2; // Track the distance to that nearest base.

    if (bestDist > MAIN_BASE_BIND_RADIUS_METERS) { // Outside bind radius: treat as unassigned.
        return 0;
    }

    return best; // Within radius: return the inferred team id.
}

//#endregion ----------------- Vehicle Registration (team arrays) --------------------



//#region -------------------- Vehicle Spawner System --------------------

// Vehicle Spawner System architecture:
// - Slot = (team, slotNumber, spawner, desired vehicle type, live state).
// - Enablement is tied to matchup presets and only applies when the round is NOT live.
// - Spawns are forced sequentially to avoid cross-binding between spawners.
// - Spawn binding is position-based: the first expecting slot within bind distance claims the vehicle.
// - Disabled slots never respawn; existing vehicles are left alone until destroyed.
// - All delayed work is token-gated so stale timers/sequences abort when slots change.

// Each spawner is configured once on creation with its vehicle type and abandonment/respawn parameters.
function configureVehicleSpawner(spawner: mod.VehicleSpawner, vehicleType: mod.VehicleList): void {
    // Spawner settings are tuned for consistent respawn behavior; adjust with caution.
    mod.SetVehicleSpawnerVehicleType(spawner, vehicleType);
    mod.SetVehicleSpawnerAutoSpawn(spawner, false);
    mod.SetVehicleSpawnerRespawnTime(spawner, VEHICLE_SPAWNER_RESPAWN_DELAY_SECONDS);
    mod.SetVehicleSpawnerApplyDamageToAbandonVehicle(spawner, true);
    mod.SetVehicleSpawnerAbandonVehiclesOutOfCombatArea(spawner, true);
    mod.SetVehicleSpawnerTimeUntilAbandon(spawner, VEHICLE_SPAWNER_TIME_UNTIL_ABANDON_SECONDS);
    mod.SetVehicleSpawnerKeepAliveAbandonRadius(spawner, VEHICLE_SPAWNER_KEEP_ALIVE_ABANDON_RADIUS);
    mod.SetVehicleSpawnerKeepAliveSpawnerRadius(spawner, VEHICLE_SPAWNER_KEEP_ALIVE_SPAWNER_RADIUS);
}

// Poll helper: returns undefined if the vehicle no longer exists (destroyed/unspawned/OOB).
function findVehicleById(vehicleId: number): mod.Vehicle | undefined {
    const vehicles = mod.AllVehicles();
    const count = mod.CountOf(vehicles);
    for (let i = 0; i < count; i++) {
        const v = mod.ValueInArray(vehicles, i) as mod.Vehicle;
        if (mod.GetObjId(v) === vehicleId) return v;
    }
    return undefined;
}

// Creates a spawner object, applies map-specific yaw, configures vehicle type, and registers the slot state.
function addVehicleSpawnerSlot(teamId: TeamID, slotNumber: number, spawnPos: mod.Vector, spawnRot: mod.Vector, vehicleType: mod.VehicleList): number {
    const yaw = mod.YComponentOf(spawnRot) + VEHICLE_SPAWN_YAW_OFFSET_DEG;
    const spawnerRot = mod.CreateVector(mod.XComponentOf(spawnRot), yaw, mod.ZComponentOf(spawnRot));
    const spawner = mod.SpawnObject(
        mod.RuntimeSpawn_Common.VehicleSpawner,
        spawnPos,
        spawnerRot
    ) as mod.VehicleSpawner;

    // Disable autos right away to avoid the default vehicle spawning before we configure the spawner.
    mod.SetVehicleSpawnerAutoSpawn(spawner, false);

    configureVehicleSpawner(spawner, vehicleType);

    const slot: VehicleSpawnerSlot = {
        teamId,
        slotNumber,
        spawner,
        spawnerObjId: getObjId(spawner),
        spawnPos,
        spawnRot: spawnerRot,
        vehicleType,
        enabled: false,
        enableToken: 0,
        spawnRequestToken: 0,
        spawnRequestAtSeconds: -1,
        expectingSpawn: false,
        vehicleId: -1,
        respawnRunning: false,
        spawnRetryScheduled: false,
    };

    State.vehicles.slots.push(slot);
    return State.vehicles.slots.length - 1;
}

function getDesiredSpawnerCountsForPreset(presetIndex: number): { team1: number; team2: number } {
    const preset = MATCHUP_PRESETS[presetIndex] ?? MATCHUP_PRESETS[0];
    // Rule: 1v0 still spawns 1 vehicle per side (practice + tooling consistency).
    const desiredTeam1 = Math.max(1, Math.floor(preset.leftPlayers));
    const desiredTeam2 = Math.max(1, Math.floor(preset.rightPlayers));
    return { team1: desiredTeam1, team2: desiredTeam2 };
}

// Toggles slot enabled state; bumps token to cancel pending waits.
// Returns true only when enabling a slot that has no tracked vehicle (needs spawn).
function setSpawnerSlotEnabled(slotIndex: number, enabled: boolean): boolean {
    const slot = State.vehicles.slots[slotIndex];
    if (slot.enabled === enabled) return false;
    slot.enabled = enabled;
    slot.enableToken += 1;
    slot.expectingSpawn = false;
    if (!enabled) return false;
    return slot.vehicleId === -1;
}

// Applies matchup -> desired slot counts, in slotNumber order, and queues sequential spawns for new slots.
function applySpawnerEnablementForMatchup(presetIndex: number, spawnOnEnable: boolean): void {
    if (isRoundLive()) return;

    const desired = getDesiredSpawnerCountsForPreset(presetIndex);
    const team1SlotIndices: number[] = [];
    const team2SlotIndices: number[] = [];
    const spawnQueue: number[] = [];

    for (let i = 0; i < State.vehicles.slots.length; i++) {
        const slot = State.vehicles.slots[i];
        if (slot.teamId === TeamID.Team1) team1SlotIndices.push(i);
        else if (slot.teamId === TeamID.Team2) team2SlotIndices.push(i);
    }

    // Enablement order is driven by slotNumber, not array order.
    team1SlotIndices.sort((a, b) => State.vehicles.slots[a].slotNumber - State.vehicles.slots[b].slotNumber);
    team2SlotIndices.sort((a, b) => State.vehicles.slots[a].slotNumber - State.vehicles.slots[b].slotNumber);

    for (let i = 0; i < team1SlotIndices.length; i++) {
        const slotIndex = team1SlotIndices[i];
        const shouldEnable = i < desired.team1;
        const shouldSpawn = setSpawnerSlotEnabled(slotIndex, shouldEnable);
        if (spawnOnEnable && shouldSpawn) spawnQueue.push(slotIndex);
    }

    for (let i = 0; i < team2SlotIndices.length; i++) {
        const slotIndex = team2SlotIndices[i];
        const shouldEnable = i < desired.team2;
        const shouldSpawn = setSpawnerSlotEnabled(slotIndex, shouldEnable);
        if (spawnOnEnable && shouldSpawn) spawnQueue.push(slotIndex);
    }

    if (spawnOnEnable) {
        // Re-queue any enabled but empty slots to cover rapid preset changes.
        for (let i = 0; i < State.vehicles.slots.length; i++) {
            const slot = State.vehicles.slots[i];
            if (!slot.enabled) continue;
            if (slot.vehicleId !== -1) continue;
            if (slot.expectingSpawn) continue;
            spawnQueue.push(i);
        }
    }

    // Cannot spawn in parallel - spawn sequentially to avoid cross-binding when multiple spawners fire at once.
    if (spawnOnEnable && spawnQueue.length > 0) {
        queueSequentialSpawns(spawnQueue);
    }
}

function queueSequentialSpawns(slotIndices: number[]): void {
    if (slotIndices.length === 0) return;
    // Token cancels any prior spawn sequence if a new one is queued.
    // Consider hardening: If a spawn sequence stalls, spawnSequenceInProgress can remain true and block matchup changes.
    State.vehicles.spawnSequenceToken += 1;
    const token = State.vehicles.spawnSequenceToken;
    State.vehicles.spawnSequenceInProgress = true;
    void runSequentialSpawns(slotIndices, token);
}

// Spawns each slot one-at-a-time to avoid simultaneous spawn cross-binding.
// Exits early if a new sequence supersedes this one (token mismatch).
async function runSequentialSpawns(slotIndices: number[], token: number): Promise<void> {
    // Consider hardening: Tight maps are vulnerable if a delayed spawn arrives after the token window; fallback binding may mis-bind.
    for (let i = 0; i < slotIndices.length; i++) {
        if (State.vehicles.spawnSequenceToken !== token) return;
        const slotIndex = slotIndices[i];
        const slot = State.vehicles.slots[slotIndex];
        if (!slot || !slot.enabled || slot.vehicleId !== -1) continue;
        await forceSpawnWithRetry(slotIndex);
        await mod.Wait(0.3);
    }

    if (State.vehicles.spawnSequenceToken === token) {
        State.vehicles.spawnSequenceInProgress = false;
    }
}

// Forces a spawn for a slot, polling until a vehicle binds or attempts are exhausted.
// Aborts if slot is disabled or token changes mid-attempt.
async function forceSpawnWithRetry(slotIndex: number): Promise<boolean> {
    const slot = State.vehicles.slots[slotIndex];
    if (!slot.enabled) return false;
    const token = slot.enableToken;
    slot.expectingSpawn = true;
    slot.spawnRequestToken += 1;
    slot.spawnRequestAtSeconds = Math.floor(mod.GetMatchTimeElapsed());
    State.vehicles.activeSpawnSlotIndex = slotIndex;
    State.vehicles.activeSpawnToken = slot.spawnRequestToken;
    State.vehicles.activeSpawnRequestedAtSeconds = slot.spawnRequestAtSeconds;

    // Re-apply config before forcing spawn to avoid the default vehicle type.
    configureVehicleSpawner(slot.spawner, slot.vehicleType);
    await mod.Wait(0);

    for (let attempt = 0; attempt < 20; attempt++) {
        if (!slot.enabled || slot.enableToken !== token) {
            slot.expectingSpawn = false;
            if (State.vehicles.activeSpawnSlotIndex === slotIndex && State.vehicles.activeSpawnToken === slot.spawnRequestToken) {
                State.vehicles.activeSpawnSlotIndex = undefined;
                State.vehicles.activeSpawnToken = undefined;
                State.vehicles.activeSpawnRequestedAtSeconds = undefined;
            }
            return false;
        }
        mod.ForceVehicleSpawnerSpawn(slot.spawner);

        if (!slot.expectingSpawn && slot.vehicleId !== -1) {
            return true;
        }

        await mod.Wait(0.25);
    }

    slot.expectingSpawn = false;
    if (State.vehicles.activeSpawnSlotIndex === slotIndex && State.vehicles.activeSpawnToken === slot.spawnRequestToken) {
        State.vehicles.activeSpawnSlotIndex = undefined;
        State.vehicles.activeSpawnToken = undefined;
        State.vehicles.activeSpawnRequestedAtSeconds = undefined;
    }
    return false;
}

// Schedules a delayed retry when spawn is blocked; rechecks slot/token before retry.
async function scheduleBlockedSpawnRetry(slotIndex: number): Promise<void> {
    const slot = State.vehicles.slots[slotIndex];
    if (!slot.enabled) return;
    if (slot.spawnRetryScheduled) return;
    slot.spawnRetryScheduled = true;
    const token = slot.enableToken;

    await mod.Wait(VEHICLE_SPAWNER_RESPAWN_DELAY_SECONDS);
    slot.spawnRetryScheduled = false;

    if (!slot.enabled || slot.enableToken !== token) return;
    if (slot.vehicleId !== -1) return;

    const teamNameKey = getTeamNameKey(slot.teamId);
    sendHighlightedWorldLogMessage(
        mod.Message(STR_VEHICLE_SPAWN_RETRY, teamNameKey, VEHICLE_SPAWNER_RESPAWN_DELAY_SECONDS),
        true,
        undefined,
        STR_VEHICLE_SPAWN_RETRY
    );

    const success = await forceSpawnWithRetry(slotIndex);
    if (!success) {
        void scheduleBlockedSpawnRetry(slotIndex);
    }
}

// Waits the respawn delay, clears old vehicle mapping, then spawns a replacement.
// Token-guarded to prevent respawns after disable/retune.
async function scheduleRespawn(slotIndex: number, lastVehicleId: number): Promise<void> {
    const slot = State.vehicles.slots[slotIndex];
    // Live rounds never respawn tanks; round-end cleanup owns the refill.
    if (isRoundLive()) {
        delete State.vehicles.vehicleToSlot[lastVehicleId];
        if (slot.vehicleId === lastVehicleId) {
            slot.vehicleId = -1;
        }
        return;
    }
    if (!slot.enabled) {
        delete State.vehicles.vehicleToSlot[lastVehicleId];
        if (slot.vehicleId === lastVehicleId) {
            slot.vehicleId = -1;
        }
        return;
    }
    // Guard against overlapping respawn timers for the same slot.
    if (slot.respawnRunning) return;

    slot.respawnRunning = true;
    const token = slot.enableToken;
    await mod.Wait(VEHICLE_SPAWNER_RESPAWN_DELAY_SECONDS);

    if (!slot.enabled || slot.enableToken !== token) {
        slot.respawnRunning = false;
        return;
    }

    delete State.vehicles.vehicleToSlot[lastVehicleId];
    slot.vehicleId = -1;

    const success = await forceSpawnWithRetry(slotIndex);
    if (!success) {
        void scheduleBlockedSpawnRetry(slotIndex);
    }
    slot.respawnRunning = false;
}

// Periodically verifies tracked vehicles still exist; if missing, triggers respawn.
async function pollVehicleSpawnerSlots(): Promise<void> {
    while (true) {
        await mod.Wait(VEHICLE_SPAWNER_POLL_INTERVAL_SECONDS);
        // Pause spawner maintenance during cleanup to avoid late respawns/binds.
        if (State.round.flow.cleanupActive) {
            continue;
        }

        for (let i = 0; i < State.vehicles.slots.length; i++) {
            const slot = State.vehicles.slots[i];
            if (slot.vehicleId === -1) continue;

            const vehicle = findVehicleById(slot.vehicleId);
            if (!vehicle) {
                const oldId = slot.vehicleId;
                slot.vehicleId = -1;
                // Slot tracking is for respawn/binding only; scoring uses the registry arrays.
                // Vehicle missing means destroyed/unspawned; schedule a respawn when not live.
                if (!isRoundLive()) {
                    scheduleRespawn(i, oldId);
                }
                continue;
            }
        }
    }
}

async function applySpawnYawToVehicle(eventVehicle: mod.Vehicle, slot: VehicleSpawnerSlot): Promise<void> {
    // Enforce the desired spawn yaw on the vehicle after it exists (map-specific spawner yaw can drift).
    const pos = slot.spawnPos;
    const yawDeg = mod.YComponentOf(slot.spawnRot);
    const yawRad = yawDeg * Math.PI / 180;
    mod.Teleport(eventVehicle, pos, yawRad);
    await mod.Wait(0);
    mod.Teleport(eventVehicle, pos, yawRad);
}

// Binding uses object position (not vehicle state) because it is stable at spawn time.
// Fallback binding can mis-assign on tight maps if a spawn arrives outside the token window.
function bindSpawnedVehicleToSlot(eventVehicle: mod.Vehicle, vehiclePos: mod.Vector): TeamID | 0 {
    const vehicleObjId = getObjId(eventVehicle);

    const activeIndex = State.vehicles.activeSpawnSlotIndex;
    const activeToken = State.vehicles.activeSpawnToken;
    const activeAt = State.vehicles.activeSpawnRequestedAtSeconds;
    if (activeIndex !== undefined && activeToken !== undefined && activeAt !== undefined) {
        const now = Math.floor(mod.GetMatchTimeElapsed());
        const expired = (now - activeAt) > VEHICLE_SPAWNER_BIND_TIMEOUT_SECONDS;
        if (!expired) {
            const activeSlot = State.vehicles.slots[activeIndex];
            if (activeSlot && activeSlot.enabled && activeSlot.expectingSpawn && activeSlot.spawnRequestToken === activeToken) {
                activeSlot.expectingSpawn = false;
                activeSlot.vehicleId = vehicleObjId;
                activeSlot.respawnRunning = false;
                activeSlot.spawnRetryScheduled = false;
                State.vehicles.vehicleToSlot[vehicleObjId] = activeIndex;
                State.vehicles.activeSpawnSlotIndex = undefined;
                State.vehicles.activeSpawnToken = undefined;
                State.vehicles.activeSpawnRequestedAtSeconds = undefined;
                void applySpawnYawToVehicle(eventVehicle, activeSlot);
                return activeSlot.teamId;
            }
        } else {
            State.vehicles.activeSpawnSlotIndex = undefined;
            State.vehicles.activeSpawnToken = undefined;
            State.vehicles.activeSpawnRequestedAtSeconds = undefined;
        }
    }

    for (let i = 0; i < State.vehicles.slots.length; i++) {
        const slot = State.vehicles.slots[i];
        if (!slot.expectingSpawn) continue;

        const spawnerPos = mod.GetObjectPosition(slot.spawner);
        const d = mod.DistanceBetween(vehiclePos, spawnerPos);
        if (d <= VEHICLE_SPAWNER_BIND_DISTANCE_METERS) {
            slot.expectingSpawn = false;
            slot.vehicleId = vehicleObjId;
            slot.respawnRunning = false;
            slot.spawnRetryScheduled = false;
            State.vehicles.vehicleToSlot[vehicleObjId] = i;
            if (State.vehicles.activeSpawnSlotIndex === i && State.vehicles.activeSpawnToken === slot.spawnRequestToken) {
                State.vehicles.activeSpawnSlotIndex = undefined;
                State.vehicles.activeSpawnToken = undefined;
                State.vehicles.activeSpawnRequestedAtSeconds = undefined;
            }
            void applySpawnYawToVehicle(eventVehicle, slot);
            return slot.teamId;
        }
    }

    return 0;
}

// Locates the first "expectingSpawn" slot within bind distance of the vehicle position.
function findSpawnerSlotByPosition(spawnPos: mod.Vector): number {
    for (let i = 0; i < State.vehicles.slots.length; i++) {
        const slot = State.vehicles.slots[i];
        const spawnerPos = mod.GetObjectPosition(slot.spawner);
        if (mod.DistanceBetween(spawnPos, spawnerPos) <= VEHICLE_SPAWNER_BIND_DISTANCE_METERS) {
            return i;
        }
    }
    return -1;
}

// Bootstraps spawners + slots, applies current matchup enablement, and starts the polling loop.
async function startVehicleSpawnerSystem(): Promise<void> {
    // WARNING: This should run once per match; duplicate runs can create extra spawners/slots.
    // Ensure map config is applied before any spawners are created or forced to spawn.
    while (!State.vehicles.configReady) {
        await mod.Wait(0.1);
    }
    await mod.Wait(VEHICLE_SPAWNER_START_DELAY_SECONDS);

    State.vehicles.slots.length = 0;
    State.vehicles.vehicleToSlot = {};
    State.vehicles.spawnSequenceInProgress = false;

    const team1Specs = [...TEAM1_VEHICLE_SPAWN_SPECS].sort((a, b) => a.slotNumber - b.slotNumber);
    const team2Specs = [...TEAM2_VEHICLE_SPAWN_SPECS].sort((a, b) => a.slotNumber - b.slotNumber);

    for (const spec of team1Specs) {
        addVehicleSpawnerSlot(TeamID.Team1, spec.slotNumber, spec.pos, spec.rot, spec.vehicle);
    }
    for (const spec of team2Specs) {
        addVehicleSpawnerSlot(TeamID.Team2, spec.slotNumber, spec.pos, spec.rot, spec.vehicle);
    }

    // One-time cleanup: remove any default vehicles sitting on or near spawn pads before first forced spawns.
    // This prevents a default Abrams from persisting if it spawned before our spawners were configured.
    // Keep this one-shot and pre-round to avoid deleting player vehicles later in the match.
    // Consider Hardening with a second cleanup pass before first forced spawns if default spawns reappear after cleanup
    if (!isRoundLive() && !State.vehicles.startupCleanupDone) {
        const vehicles = mod.AllVehicles();
        const vCount = mod.CountOf(vehicles);
        for (let v = 0; v < vCount; v++) {
            const vehicle = mod.ValueInArray(vehicles, v) as mod.Vehicle;
            if (!vehicle) continue;
            const pos = mod.GetObjectPosition(vehicle);
            let nearSpawn = false;
            for (let i = 0; i < State.vehicles.slots.length; i++) {
                const slot = State.vehicles.slots[i];
                if (mod.DistanceBetween(pos, slot.spawnPos) <= VEHICLE_SPAWNER_STARTUP_CLEANUP_RADIUS_METERS) {
                    nearSpawn = true;
                    break;
                }
            }
            if (nearSpawn) {
                mod.UnspawnObject(vehicle);
            }
        }
        State.vehicles.startupCleanupDone = true;
    }


    // Extra short wait reduces the chance of a default spawn appearing after cleanup.
    await mod.Wait(0.1);
    // Apply enablement before spawning so only the desired slots can spawn.
    applySpawnerEnablementForMatchup(State.round.matchupPresetIndex, false);

    // Kick initial spawns so each slot has a vehicle bound before the poll loop starts.
    for (let i = 0; i < State.vehicles.slots.length; i++) {
        if (!State.vehicles.slots[i].enabled) continue;
        const success = await forceSpawnWithRetry(i);
        if (!success) {
            void scheduleBlockedSpawnRetry(i);
        }
        await mod.Wait(0.5);
    }

    // Long-running poll loop to detect missing vehicles and respawn.
    void pollVehicleSpawnerSlots();
}

//#endregion ----------------- Vehicle Spawner System --------------------



//#region -------------------- Kills HUD Sync (GameModeScore -> HUD) --------------------

function syncKillsHudFromTrackedTotals(_force: boolean): void {
    // Total kills are tracked in script variables; GameModeScore is reserved for match wins.
    // Avoid HUD creation/reposition here; only update cached refs to prevent kill-time crashes.
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const pid = getObjId(p);
        const refs = State.hudCache.hudByPid[pid];
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
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const pid = getObjId(p);
        const refs = State.hudCache.hudByPid[pid];
        if (!refs) continue;

        setCounterText(refs.leftRoundKillsText, State.scores.t1RoundKills);
        setCounterText(refs.rightRoundKillsText, State.scores.t2RoundKills);
    }
}

//#endregion ----------------- Kills HUD Sync (GameModeScore -> HUD) --------------------



//#region -------------------- Overtime Flag Capture - Zone Config + Preview Icon --------------------

// High-level flow:
// - Map config provides candidate zones (AreaTrigger ObjId + Sector Id + WorldIcon ObjId + CapturePoint ObjId).
// - At half-time remaining, pick one random zone and make it visible (locked).
// - At 1:00 remaining, activate capture, start the tick loop, and show HUD.
// - Full capture ends the round immediately; at clock expiry, progress decides unless neutral (0.5).
// Progress model:
// - progress in [0..1]: 0 = Team2 owns, 1 = Team1 owns, 0.5 = neutral start.
// - counts are unique vehicles in zone (not player count).
// - player membership is tracked to drive UI + vehicle seat reconciliation.

function normalizeOvertimeZoneLetter(letter: string): string {
    return letter.trim().toUpperCase();
}

function getOvertimeZoneIndexForLetter(letter: string): number {
    const normalized = normalizeOvertimeZoneLetter(letter);
    return OVERTIME_FLAG_LETTERS.indexOf(normalized);
}

function getOvertimeZoneLettersForGameMode(gameModeKey: number): string[] | undefined {
    const mapping = ACTIVE_MAP_CONFIG.overtimeZoneLettersByMode;
    if (!mapping) return undefined;
    if (isHeliGameMode(gameModeKey)) {
        return (mapping.helis && mapping.helis.length > 0) ? mapping.helis : mapping.tanks;
    }
    return (mapping.tanks && mapping.tanks.length > 0) ? mapping.tanks : mapping.helis;
}

function getConfirmedGameModeKey(): number {
    return State.round.modeConfig.confirmed.gameMode ?? State.round.modeConfig.gameMode;
}

function buildOvertimeZoneCandidatesForGameMode(gameModeKey: number): OvertimeZoneCandidate[] {
    const zones = ACTIVE_OVERTIME_ZONES;
    if (!zones || zones.length === 0) return [];
    const letters = getOvertimeZoneLettersForGameMode(gameModeKey);
    if (!letters || letters.length === 0) {
        return zones.map((zone, index) => ({
            areaTriggerObjId: zone.areaTriggerObjId,
            sectorId: zone.sectorId,
            worldIconObjId: zone.worldIconObjId,
            capturePointObjId: zone.capturePointObjId,
            letterIndex: index,
        }));
    }
    const candidates: OvertimeZoneCandidate[] = [];
    for (const letter of letters) {
        const index = getOvertimeZoneIndexForLetter(letter);
        if (index < 0 || index >= zones.length) continue;
        const zone = zones[index];
        candidates.push({
            areaTriggerObjId: zone.areaTriggerObjId,
            sectorId: zone.sectorId,
            worldIconObjId: zone.worldIconObjId,
            capturePointObjId: zone.capturePointObjId,
            letterIndex: index,
        });
    }
    return candidates;
}

function isHelisOvertimeSingleZoneMode(): boolean {
    const gameModeKey = getConfirmedGameModeKey();
    if (!isHeliGameMode(gameModeKey)) return false;
    const letters = getOvertimeZoneLettersForGameMode(gameModeKey);
    if (!letters || letters.length !== 1) return false;
    return normalizeOvertimeZoneLetter(letters[0]) === "H";
}

function refreshOvertimeZonesFromMapConfig(): void {
    // Sync per-map zone list into state; zone order defines A/B/C... letters.
    hideAllOvertimeZoneMarkers();
    const gameModeKey = getConfirmedGameModeKey();
    State.flag.candidateZones = buildOvertimeZoneCandidatesForGameMode(gameModeKey);
    State.flag.configValid = validateOvertimeZoneSpecs(State.flag.candidateZones);
    setOvertimeSectorsForSelected(undefined);
    setOvertimeCapturePointsForSelected(undefined);
    configureOvertimeCapturePointTimes();
}

function validateOvertimeZoneSpecs(zones: OvertimeZoneSpec[]): boolean {
    // Reject empty lists or duplicate ids to avoid randomization ambiguity.
    if (!zones || zones.length === 0) return false;
    const seenTriggers: Record<number, boolean> = {};
    const seenSectors: Record<number, boolean> = {};
    const seenWorldIcons: Record<number, boolean> = {};
    const seenCapturePoints: Record<number, boolean> = {};
    for (let i = 0; i < zones.length; i++) {
        const triggerId = Math.floor(zones[i].areaTriggerObjId);
        const sectorId = Math.floor(zones[i].sectorId);
        const worldIconId = Math.floor(zones[i].worldIconObjId);
        const capturePointId = Math.floor(zones[i].capturePointObjId);
        if (!Number.isFinite(triggerId) || !Number.isFinite(sectorId) || !Number.isFinite(worldIconId) || !Number.isFinite(capturePointId)) return false;
        if (seenTriggers[triggerId] || seenSectors[sectorId] || seenWorldIcons[worldIconId] || seenCapturePoints[capturePointId]) return false;
        seenTriggers[triggerId] = true;
        seenSectors[sectorId] = true;
        seenWorldIcons[worldIconId] = true;
        seenCapturePoints[capturePointId] = true;
    }
    return true;
}

function buildPortalNumberArray(values: number[]): any {
    // mod.RandomValueInArray requires a Portal array, not a JS number[].
    let arr = mod.EmptyArray();
    for (let i = 0; i < values.length; i++) {
        arr = mod.AppendToArray(arr, values[i]);
    }
    return arr;
}

function getOvertimeFlagLetterKeyForIndex(index: number): number {
    if (index < 0 || index >= STR_FLAG_LETTER_KEYS.length) return STR_FLAG_LETTER_UNKNOWN;
    return STR_FLAG_LETTER_KEYS[index];
}

function getOvertimeFlagLetterIndexForCandidate(candidateIndex: number | undefined): number | undefined {
    if (candidateIndex === undefined) return undefined;
    const zone = State.flag.candidateZones[candidateIndex];
    if (!zone) return undefined;
    const letterIndex = (zone as OvertimeZoneCandidate).letterIndex;
    if (letterIndex === undefined || !Number.isFinite(letterIndex)) return candidateIndex;
    return Math.floor(letterIndex);
}

function getOvertimeFlagLetterKeyForCandidateIndex(candidateIndex: number | undefined): number {
    const letterIndex = getOvertimeFlagLetterIndexForCandidate(candidateIndex);
    if (letterIndex === undefined) return STR_FLAG_LETTER_UNKNOWN;
    return getOvertimeFlagLetterKeyForIndex(letterIndex);
}

function getActiveOvertimeFlagLetterKey(): number {
    if (State.flag.selectedZoneLetterKey !== undefined) return State.flag.selectedZoneLetterKey;
    if (State.flag.activeCandidateIndex === undefined) return STR_FLAG_LETTER_UNKNOWN;
    return getOvertimeFlagLetterKeyForCandidateIndex(State.flag.activeCandidateIndex);
}

function getOvertimeFlagLetterTextForIndex(index: number | undefined): string {
    if (index === undefined || index < 0 || index >= STR_FLAG_LETTER_KEYS.length) return "?";
    return String.fromCharCode(65 + index);
}

function getOvertimeFlagLetterTextForCandidateIndex(candidateIndex: number | undefined): string {
    const letterIndex = getOvertimeFlagLetterIndexForCandidate(candidateIndex);
    if (letterIndex === undefined || letterIndex < 0 || letterIndex >= STR_FLAG_LETTER_KEYS.length) return "?";
    return String.fromCharCode(65 + letterIndex);
}

function getActiveOvertimeFlagLetterText(): string {
    if (State.flag.activeCandidateIndex === undefined) return "?";
    return getOvertimeFlagLetterTextForCandidateIndex(State.flag.activeCandidateIndex);
}

function hideOvertimeFlagPreviewIcon(): void {
    const zones = State.flag.candidateZones;
    if (!zones || zones.length === 0) return;
    // Disable all overtime world icons so only the active zone can be shown.
    for (let i = 0; i < zones.length; i++) {
        try {
            const icon = mod.GetWorldIcon(zones[i].worldIconObjId);
            if (!icon) continue;
            mod.EnableWorldIconImage(icon, false);
            mod.EnableWorldIconText(icon, false);
        } catch {
            continue;
        }
    }
}

// TODO(1.0): Unused; remove before final 1.0 release.
function getActiveOvertimeAreaTrigger(): mod.AreaTrigger | undefined {
    if (State.flag.activeAreaTrigger) return State.flag.activeAreaTrigger;
    if (State.flag.activeAreaTriggerId === undefined) return undefined;
    const trigger = mod.GetAreaTrigger(State.flag.activeAreaTriggerId);
    State.flag.activeAreaTrigger = trigger;
    return trigger;
}

function getActiveOvertimeWorldIcon(): mod.WorldIcon | undefined {
    if (State.flag.activeWorldIcon) return State.flag.activeWorldIcon;
    if (State.flag.activeWorldIconId === undefined) return undefined;
    const icon = mod.GetWorldIcon(State.flag.activeWorldIconId);
    State.flag.activeWorldIcon = icon;
    return icon;
}

function showOvertimeFlagPreviewIcon(isLocked: boolean): void {
    const icon = getActiveOvertimeWorldIcon();
    if (!icon) return;

    // Locked preview uses the selected zone letter for clarity.
    const letterKey = getActiveOvertimeFlagLetterKey();
    const labelKey = isLocked ? STR_FLAG_TITLE_LOCKED_FORMAT : STR_FLAG_PREVIEW_ACTIVE;

    // Ensure only the selected zone icon is visible.
    hideOvertimeFlagPreviewIcon();

    // WorldIcon objects are positioned in the spatial data; we only toggle visibility + text.
    try {
        mod.SetWorldIconImage(icon, mod.WorldIconImages.Flag);
        mod.SetWorldIconColor(icon, OVERTIME_FLAG_ICON_COLOR);
        // NOTE: Locked preview uses the same title format as the HUD for consistency.
        const labelMessage = isLocked
            ? mod.Message(labelKey, letterKey, getOvertimeUnlockSeconds())
            : mod.Message(labelKey);
        mod.SetWorldIconText(icon, labelMessage);
        mod.EnableWorldIconImage(icon, true);
        mod.EnableWorldIconText(icon, true);
    } catch {
        return;
    }
}

//#endregion -------------------- Overtime Flag Capture - Zone Config + Preview Icon --------------------



//#region -------------------- Overtime Flag Capture - Marker Visibility + Suppression --------------------

function getOvertimeCapturePointIds(): number[] {
    const zones = State.flag.candidateZones;
    if (!zones || zones.length === 0) return [];
    const ids: number[] = [];
    for (let i = 0; i < zones.length; i++) {
        ids.push(zones[i].capturePointObjId);
    }
    return ids;
}

function getAllOvertimeCapturePointIds(): number[] {
    const zones = ACTIVE_OVERTIME_ZONES;
    if (!zones || zones.length === 0) return [];
    const ids: number[] = [];
    for (let i = 0; i < zones.length; i++) {
        ids.push(zones[i].capturePointObjId);
    }
    return ids;
}

function setOvertimeCapturePointsForAllHidden(): void {
    const ids = getAllOvertimeCapturePointIds();
    if (ids.length === 0) return;
    for (let i = 0; i < ids.length; i++) {
        setOvertimeCapturePointMarkerVisible(ids[i], false);
    }
}

function applyOvertimeCapturePointSuppression(cp: mod.CapturePoint): void {
    // Keep CapturePoints marker-only: no ownership change, no deploy, no progress.
    mod.SetCapturePointCapturingTime(cp, OVERTIME_CAPTURE_TIME_DISABLE_SECONDS);
    mod.SetCapturePointNeutralizationTime(cp, OVERTIME_NEUTRALIZE_TIME_DISABLE_SECONDS);
    mod.SetMaxCaptureMultiplier(cp, OVERTIME_ENGINE_CAPTURE_MAX_MULTIPLIER);
    mod.EnableCapturePointDeploying(cp, false);
}

function setOvertimeCapturePointOwner(cp: mod.CapturePoint, teamId: TeamID | 0): void {
    mod.SetCapturePointOwner(cp, mod.GetTeam(teamId));
}

function hardResetOvertimeCapturePoints(ids: number[]): void {
    // Force-clear engine CP state so no progress persists across rounds.
    if (ids.length > 0) {
        logCapturePointVisibilityDebug(STR_DEBUG_CP_VIS_HARD_RESET);
    }
    for (let i = 0; i < ids.length; i++) {
        try {
            const cp = mod.GetCapturePoint(ids[i]);
            if (!cp) continue;
            const spatial = mod.GetSpatialObject(ids[i]);
            if (!spatial) continue;
            mod.EnableGameModeObjective(cp, true);
            applyOvertimeCapturePointSuppression(cp);
            setOvertimeCapturePointOwner(cp, 0);
            mod.EnableGameModeObjective(cp, false);
            mod.EnableSpatialObject(spatial, false);
        } catch {
            continue;
        }
    }
}

function configureOvertimeCapturePointTimes(): void {
    // Re-apply suppression for every candidate so engine capture never advances.
    const ids = getOvertimeCapturePointIds();
    if (ids.length === 0) return;
    for (let i = 0; i < ids.length; i++) {
        try {
            const cp = mod.GetCapturePoint(ids[i]);
            if (!cp) continue;
            applyOvertimeCapturePointSuppression(cp);
            setOvertimeCapturePointOwner(cp, 0);
        } catch {
            continue;
        }
    }
}

function setOvertimeCapturePointMarkerVisible(capturePointObjId: number, visible: boolean): void {
    try {
        const cp = mod.GetCapturePoint(capturePointObjId);
        if (!cp) return;
        const spatial = mod.GetSpatialObject(capturePointObjId);
        if (!spatial) return;
        // Apply CP state before the final enable/disable; setters can re-register the objective.
        applyOvertimeCapturePointSuppression(cp);
        setOvertimeCapturePointOwner(cp, 0);
        // Toggle both objective visibility and the spatial object using the correct runtime handle.
        mod.EnableGameModeObjective(cp, visible);
        mod.EnableSpatialObject(spatial, visible);
    } catch {
        return;
    }
}

function setOvertimeCapturePointsForSelected(selectedId?: number): void {
    // Enable only the selected CapturePoint for minimap/world marker display.
    const ids = getOvertimeCapturePointIds();
    if (ids.length === 0) return;
    for (let i = 0; i < ids.length; i++) {
        const enable = selectedId !== undefined && ids[i] === selectedId;
        setOvertimeCapturePointMarkerVisible(ids[i], enable);
    }
}

function setOvertimeCapturePointsForAllVisible(): void {
    const ids = getOvertimeCapturePointIds();
    if (ids.length === 0) return;
    for (let i = 0; i < ids.length; i++) {
        setOvertimeCapturePointMarkerVisible(ids[i], true);
    }
}

function setOvertimeSectorsForAllVisible(): void {
    const zones = State.flag.candidateZones;
    if (!zones || zones.length === 0) return;
    for (let i = 0; i < zones.length; i++) {
        try {
            const sector = mod.GetSector(zones[i].sectorId);
            if (!sector) continue;
            mod.EnableGameModeObjective(sector, true);
        } catch {
            continue;
        }
    }
}

function setOvertimeSectorsForAllHidden(): void {
    const zones = ACTIVE_OVERTIME_ZONES;
    if (!zones || zones.length === 0) return;
    for (let i = 0; i < zones.length; i++) {
        try {
            const sector = mod.GetSector(zones[i].sectorId);
            if (!sector) continue;
            mod.EnableGameModeObjective(sector, false);
        } catch {
            continue;
        }
    }
}

function hideAllOvertimeZoneMarkers(): void {
    setOvertimeSectorsForAllHidden();
    setOvertimeCapturePointsForAllHidden();
}

function setOvertimeAllFlagVisibility(visible: boolean): void {
    if (visible) {
        setOvertimeSectorsForAllVisible();
        setOvertimeCapturePointsForAllVisible();
        return;
    }
    hideAllOvertimeZoneMarkers();
}

function getActiveOvertimeCapturePoint(): mod.CapturePoint | undefined {
    if (State.flag.activeCapturePoint) return State.flag.activeCapturePoint;
    if (State.flag.activeCapturePointId === undefined) return undefined;
    const cp = mod.GetCapturePoint(State.flag.activeCapturePointId);
    State.flag.activeCapturePoint = cp;
    return cp;
}

function isActiveOvertimeCapturePoint(cp: mod.CapturePoint): boolean {
    const active = getActiveOvertimeCapturePoint();
    if (!active) return false;
    return mod.Equals(cp, active);
}

function setOvertimeSectorsForSelected(selectedId?: number): void {
    // Sector objectives drive the minimap radius without enabling capture logic.
    const zones = State.flag.candidateZones;
    if (!zones || zones.length === 0) return;
    for (let i = 0; i < zones.length; i++) {
        try {
            const sector = mod.GetSector(zones[i].sectorId);
            if (!sector) continue;
            const enable = selectedId !== undefined && zones[i].sectorId === selectedId;
            mod.EnableGameModeObjective(sector, enable);
        } catch {
            continue;
        }
    }
}

//#endregion -------------------- Overtime Flag Capture - Marker Visibility + Suppression --------------------



//#region -------------------- Admin Panel - Tie-Breaker + Live Respawn + Round Length Helpers --------------------

function normalizeTieBreakerModeIndex(index: number): number {
    const count = ADMIN_TIEBREAKER_MODE_OPTIONS.length;
    if (count <= 0) return 0;
    const normalized = ((Math.floor(index) % count) + count) % count;
    return normalized;
}

function getTieBreakerModeLabelKey(): number {
    const index = normalizeTieBreakerModeIndex(State.admin.tieBreakerModeIndex);
    return ADMIN_TIEBREAKER_MODE_OPTIONS[index];
}

function getTieBreakerModeActionKey(index: number): number {
    const normalized = normalizeTieBreakerModeIndex(index);
    return ADMIN_TIEBREAKER_MODE_ACTION_KEYS[normalized];
}

function syncAdminTieBreakerModeLabelForAllPlayers(): void {
    const labelKey = getTieBreakerModeLabelKey();
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const player = mod.ValueInArray(players, i) as mod.Player;
        if (!player || !mod.IsPlayerValid(player)) continue;
        const pid = safeGetPlayerId(player);
        if (pid === undefined || isPidDisconnected(pid)) continue;
        const label = safeFind(UI_ADMIN_TIEBREAKER_MODE_LABEL_ID + pid);
        if (!label) continue;
        safeSetUITextLabel(label, mod.Message(labelKey));
    }
}

function getAdminLiveRespawnLabelKey(): number {
    return State.admin.liveRespawnEnabled
        ? mod.stringkeys.twl.adminPanel.labels.liveRespawnOn
        : mod.stringkeys.twl.adminPanel.labels.liveRespawnOff;
}

function syncAdminLiveRespawnLabelForAllPlayers(): void {
    const labelKey = getAdminLiveRespawnLabelKey();
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const player = mod.ValueInArray(players, i) as mod.Player;
        if (!player || !mod.IsPlayerValid(player)) continue;
        const pid = safeGetPlayerId(player);
        if (pid === undefined || isPidDisconnected(pid)) continue;
        const label = safeFind(UI_ADMIN_LIVE_RESPAWN_TEXT_ID + pid);
        if (!label) continue;
        safeSetUITextLabel(label, mod.Message(labelKey));
    }
}

function clampRoundLengthSeconds(seconds: number): number {
    return Math.max(ADMIN_ROUND_LENGTH_MIN_SECONDS, Math.min(ADMIN_ROUND_LENGTH_MAX_SECONDS, Math.floor(seconds)));
}

function getConfiguredRoundLengthSeconds(): number {
    return clampRoundLengthSeconds(State.round.clock.roundLengthSeconds ?? ROUND_START_SECONDS);
}

// Mirrors the configured round length (pre-round), not the live countdown.
function syncAdminRoundLengthLabelForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    const totalSeconds = getConfiguredRoundLengthSeconds();
    const time = getClockTimeParts(totalSeconds);
    for (let i = 0; i < count; i++) {
        const player = mod.ValueInArray(players, i) as mod.Player;
        if (!player || !mod.IsPlayerValid(player)) continue;
        const pid = safeGetPlayerId(player);
        if (pid === undefined || isPidDisconnected(pid)) continue;
        const label = safeFind(UI_ADMIN_ROUND_LENGTH_LABEL_ID + pid);
        if (!label) continue;
        safeSetUITextLabel(
            label,
            mod.Message(mod.stringkeys.twl.adminPanel.labels.roundLengthFormat, time.minutes, time.secTens, time.secOnes)
        );
    }
}

//#endregion ----------------- Admin Panel - Tie-Breaker + Live Respawn + Round Length Helpers --------------------



//#region -------------------- Overtime Flag Capture - Selection + Overrides --------------------

function isTieBreakerEnabledForRound(): boolean {
    return State.flag.tieBreakerEnabledThisRound;
}

function computeTieBreakerEnabledForRound(roundNumber: number, maxRounds: number, modeIndex: number): boolean {
    const normalized = normalizeTieBreakerModeIndex(modeIndex);
    if (normalized === 1) return true; // All Rounds
    if (normalized === 2) return false; // Disabled
    const currentRound = Math.max(1, Math.floor(roundNumber));
    const roundMax = Math.max(1, Math.floor(maxRounds));
    return currentRound >= roundMax; // Last Round Only
}

function syncTieBreakerEnabledForCurrentRound(): void {
    State.flag.tieBreakerEnabledThisRound = computeTieBreakerEnabledForRound(
        State.round.current,
        State.round.max,
        State.admin.tieBreakerModeIndex
    );
}

function resetOvertimeSelectionForOverride(): void {
    // Clears the active overtime selection without touching stage/active flags.
    // Used for admin overrides before the reveal stage.
    hideOvertimeFlagPreviewIcon();
    State.flag.activeAreaTriggerId = undefined;
    State.flag.activeAreaTrigger = undefined;
    State.flag.activeSectorId = undefined;
    State.flag.activeSector = undefined;
    State.flag.activeWorldIconId = undefined;
    State.flag.activeWorldIcon = undefined;
    State.flag.activeCapturePointId = undefined;
    State.flag.activeCapturePoint = undefined;
    State.flag.activeCandidateIndex = undefined;
    State.flag.selectedZoneLetterKey = undefined;
    State.flag.ownerTeam = 0;
    State.flag.progress = 0.5;
    State.flag.t1Count = 0;
    State.flag.t2Count = 0;
    State.flag.playersInZoneByPid = {};
    State.flag.vehicleOccupantsByVid = {};
    State.flag.vehicleTeamByVid = {};
    State.flag.lastUiSnapshotByPid = {};
    State.flag.lastGlobalProgressPercent = -1;
    State.flag.lastMembershipPruneAtSeconds = 0;
}

function selectOvertimeZoneForRound(): boolean {
    // Select once per round; zone order defines A/B/C... letters.
    if (!isTieBreakerEnabledForRound()) return false;
    if (!State.flag.configValid) return false;
    const zones = State.flag.candidateZones;
    if (zones.length === 0) return false;
    const canOverride = State.flag.stage < OvertimeStage.Visible;
    const hasActiveSelection = State.flag.activeAreaTriggerId !== undefined;

    const validIndices: number[] = [];
    for (let i = 0; i < zones.length; i++) {
        const trigger = mod.GetAreaTrigger(zones[i].areaTriggerObjId);
        const sector = mod.GetSector(zones[i].sectorId);
        const icon = mod.GetWorldIcon(zones[i].worldIconObjId);
        const cp = mod.GetCapturePoint(zones[i].capturePointObjId);
        if (!trigger || !sector || !icon || !cp) continue;
        validIndices.push(i);
    }

    if (validIndices.length === 0) {
        // If no valid zones can be resolved, disable overtime for this round.
        State.flag.configValid = false;
        return false;
    }

    let overrideIndex = canOverride ? State.admin.tieBreakerOverrideIndex : undefined;
    if (overrideIndex !== undefined && validIndices.indexOf(overrideIndex) === -1) {
        State.admin.tieBreakerOverrideIndex = undefined;
        overrideIndex = undefined;
    }

    if (hasActiveSelection && overrideIndex === undefined) return true;

    const portalArray = buildPortalNumberArray(validIndices);
    const selectedIndex = overrideIndex !== undefined ? overrideIndex : (mod.RandomValueInArray(portalArray) as number);
    if (selectedIndex === undefined) return false;
    const selectedZone = zones[selectedIndex];

    if (hasActiveSelection && overrideIndex !== undefined && State.flag.activeCandidateIndex !== selectedIndex) {
        resetOvertimeSelectionForOverride();
    }

    State.flag.activeCandidateIndex = selectedIndex;
    State.flag.selectedZoneLetterKey = getOvertimeFlagLetterKeyForCandidateIndex(selectedIndex);
    State.flag.activeAreaTriggerId = selectedZone.areaTriggerObjId;
    State.flag.activeAreaTrigger = mod.GetAreaTrigger(selectedZone.areaTriggerObjId);
    State.flag.activeSectorId = selectedZone.sectorId;
    State.flag.activeSector = mod.GetSector(selectedZone.sectorId);
    State.flag.activeWorldIconId = selectedZone.worldIconObjId;
    State.flag.activeWorldIcon = mod.GetWorldIcon(selectedZone.worldIconObjId);
    State.flag.activeCapturePointId = selectedZone.capturePointObjId;
    State.flag.activeCapturePoint = mod.GetCapturePoint(selectedZone.capturePointObjId);

    if (!State.flag.activeAreaTrigger || !State.flag.activeSector || !State.flag.activeWorldIcon || !State.flag.activeCapturePoint) {
        State.flag.configValid = false;
        return false;
    }

    // Track override usage only when it actually dictates the selection.
    if (overrideIndex !== undefined) {
        State.flag.overrideUsedThisRound = true;
        State.admin.tieBreakerOverrideUsed = true;
    }

    if (overrideIndex !== undefined) {
        State.admin.tieBreakerOverrideIndex = undefined;
    }

    return State.flag.activeAreaTriggerId !== undefined;
}

// TODO(1.0): Unused; remove before final 1.0 release.
function getActiveOvertimeSector(): mod.Sector | undefined {
    if (State.flag.activeSector) return State.flag.activeSector;
    if (State.flag.activeSectorId === undefined) return undefined;
    const sector = mod.GetSector(State.flag.activeSectorId);
    State.flag.activeSector = sector;
    return sector;
}

function applyAdminTieBreakerOverride(selectedIndex: number): void {
    if (!isTieBreakerEnabledForRound()) return;
    if (!State.flag.configValid) return;
    if (State.flag.stage >= OvertimeStage.Visible) return;
    State.admin.tieBreakerOverrideIndex = selectedIndex;
    if (!isRoundLive()) return;
    const selected = selectOvertimeZoneForRound();
    if (selected) {
        State.flag.trackingEnabled = true;
    }
}

//#endregion -------------------- Overtime Flag Capture - Selection + Overrides --------------------



//#region -------------------- Overtime Flag Capture - Reset + State --------------------

function resetOvertimeFlagState(): void {
    // Clears all overtime state and hides UI. Safe to call on round reset/end.
    // Progress resets to neutral (0.5) and vehicle counts are cleared.
    hideOvertimeFlagPreviewIcon();
    stopOvertimeCaptureLoop();
    State.flag.stage = OvertimeStage.None;
    State.flag.active = false;
    State.flag.trackingEnabled = false;
    State.flag.unlockReminderSent = false;
    State.flag.overrideUsedThisRound = false;
    State.flag.activeAreaTriggerId = undefined;
    State.flag.activeAreaTrigger = undefined;
    State.flag.activeSectorId = undefined;
    State.flag.activeSector = undefined;
    State.flag.activeWorldIconId = undefined;
    State.flag.activeWorldIcon = undefined;
    State.flag.activeCapturePointId = undefined;
    State.flag.activeCapturePoint = undefined;
    State.flag.activeCandidateIndex = undefined;
    State.flag.selectedZoneLetterKey = undefined;
    State.flag.ownerTeam = 0;
    State.flag.progress = 0.5;
    State.flag.t1Count = 0;
    State.flag.t2Count = 0;
    State.flag.playersInZoneByPid = {};
    State.flag.vehicleOccupantsByVid = {};
    State.flag.vehicleTeamByVid = {};
    State.flag.lastUiSnapshotByPid = {};
    State.flag.lastGlobalProgressPercent = -1;
    State.flag.lastMembershipPruneAtSeconds = 0;
    hideOvertimeUiForAllPlayers();
    logCapturePointVisibilityDebug(STR_DEBUG_CP_VIS_RESET);
    hideAllOvertimeZoneMarkers();
    hardResetOvertimeCapturePoints(getAllOvertimeCapturePointIds());
    configureOvertimeCapturePointTimes();
}

function isRoundKillTargetReached(): boolean {
    // Used to prevent double-end when capture completes after a kill-target win.
    return State.scores.t1RoundKills >= State.round.killsTarget || State.scores.t2RoundKills >= State.round.killsTarget;
}

//#endregion -------------------- Overtime Flag Capture - Reset + State --------------------



//#region -------------------- Overtime Flag Capture - Vehicle + Zone Membership Tracking --------------------

// Vehicle counts drive capture speed; one vehicle = one capture unit.
function incrementOvertimeTeamVehicleCount(teamId: TeamID | 0): void {
    if (teamId === TeamID.Team1) {
        State.flag.t1Count = Math.max(0, State.flag.t1Count + 1);
        return;
    }
    if (teamId === TeamID.Team2) {
        State.flag.t2Count = Math.max(0, State.flag.t2Count + 1);
    }
}

function decrementOvertimeTeamVehicleCount(teamId: TeamID | 0): void {
    if (teamId === TeamID.Team1) {
        State.flag.t1Count = Math.max(0, State.flag.t1Count - 1);
        return;
    }
    if (teamId === TeamID.Team2) {
        State.flag.t2Count = Math.max(0, State.flag.t2Count - 1);
    }
}

function addOvertimeVehicleOccupant(teamId: TeamID | 0, vehicleObjId: number): void {
    // One vehicle = one capture unit, regardless of how many occupants.
    if (teamId !== TeamID.Team1 && teamId !== TeamID.Team2) return;
    const current = State.flag.vehicleOccupantsByVid[vehicleObjId] ?? 0;
    const priorTeam = State.flag.vehicleTeamByVid[vehicleObjId];
    State.flag.vehicleOccupantsByVid[vehicleObjId] = current + 1;
    if (current === 0) {
        State.flag.vehicleTeamByVid[vehicleObjId] = teamId;
        incrementOvertimeTeamVehicleCount(teamId);
        return;
    }
    if (priorTeam && priorTeam !== teamId) {
        decrementOvertimeTeamVehicleCount(priorTeam);
        incrementOvertimeTeamVehicleCount(teamId);
        State.flag.vehicleTeamByVid[vehicleObjId] = teamId;
    }
}

function removeOvertimeVehicleOccupant(vehicleObjId: number): void {
    // Remove the vehicle from the team set when the last occupant leaves.
    const current = State.flag.vehicleOccupantsByVid[vehicleObjId];
    if (current === undefined) return;
    const next = Math.max(0, current - 1);
    if (next <= 0) {
        delete State.flag.vehicleOccupantsByVid[vehicleObjId];
        const teamId = State.flag.vehicleTeamByVid[vehicleObjId];
        delete State.flag.vehicleTeamByVid[vehicleObjId];
        decrementOvertimeTeamVehicleCount(teamId);
        return;
    }
    State.flag.vehicleOccupantsByVid[vehicleObjId] = next;
}

function syncOvertimePlayerVehicleState(player: mod.Player, entry: OvertimeFlagPlayerZoneState): void {
    if (!player || !mod.IsPlayerValid(player)) return;
    // Keep vehicle membership accurate for in-zone players who enter/exit vehicles.
    // Callers only invoke this for players currently tracked as in-zone.
    const inVehicle = safeGetSoldierStateBool(player, mod.SoldierStateBool.IsInVehicle);
    if (!inVehicle) {
        if (entry.vehicleObjId) {
            removeOvertimeVehicleOccupant(entry.vehicleObjId);
            entry.vehicleObjId = 0;
        }
        return;
    }
    let vehicle: mod.Vehicle | undefined;
    try {
        vehicle = mod.GetVehicleFromPlayer(player);
    } catch {
        vehicle = undefined;
    }
    if (!vehicle) {
        if (entry.vehicleObjId) {
            removeOvertimeVehicleOccupant(entry.vehicleObjId);
            entry.vehicleObjId = 0;
        }
        return;
    }
    const vid = safeGetObjId(vehicle);
    if (vid === undefined) {
        if (entry.vehicleObjId) {
            removeOvertimeVehicleOccupant(entry.vehicleObjId);
            entry.vehicleObjId = 0;
        }
        return;
    }
    if (entry.vehicleObjId && entry.vehicleObjId !== vid) {
        removeOvertimeVehicleOccupant(entry.vehicleObjId);
    }
    if (entry.vehicleObjId !== vid) {
        entry.vehicleObjId = vid;
        addOvertimeVehicleOccupant(entry.teamId, vid);
    }
}

function handleOvertimePlayerEnterZone(eventPlayer: mod.Player): void {
    try {
        if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
        // AreaTrigger enter is soldier-based; we still gate capture by vehicle occupancy.
        // Track on-foot players too so UI can show "vehicle required".
        if (!State.flag.configValid) return;
        if (!isOvertimeZoneTrackingEnabled()) return;
        if (State.flag.activeAreaTriggerId === undefined) return;
        const pid = safeGetPlayerId(eventPlayer);
        if (pid === undefined || isPidDisconnected(pid)) return;
        const teamId = safeGetTeamNumberFromPlayer(eventPlayer);
        const entry = State.flag.playersInZoneByPid[pid] ?? { playerObjId: pid, teamId, vehicleObjId: 0 };
        entry.playerObjId = pid;
        entry.teamId = teamId;
        State.flag.playersInZoneByPid[pid] = entry;
        syncOvertimePlayerVehicleState(eventPlayer, entry);
        refreshOvertimeUiVisibilityForPlayer(eventPlayer);
    } catch {
        return;
    }
}

function handleOvertimePlayerExitZone(eventPlayer: mod.Player): void {
    try {
        if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
        // Drop membership and vehicle counts when leaving the capture zone.
        // Clear snapshots so UI can rebuild cleanly if they re-enter.
        const pid = safeGetPlayerId(eventPlayer);
        if (pid === undefined || isPidDisconnected(pid)) return;
        const entry = State.flag.playersInZoneByPid[pid];
        if (!entry) return;
        if (entry.vehicleObjId) {
            removeOvertimeVehicleOccupant(entry.vehicleObjId);
        }
        delete State.flag.playersInZoneByPid[pid];
        delete State.flag.lastUiSnapshotByPid[pid];
        refreshOvertimeUiVisibilityForPlayer(eventPlayer);
    } catch {
        return;
    }
}

function handleOvertimePlayerLeaveById(playerId: number, allowHardDelete: boolean = true): void {
    // Disconnect cleanup uses player id (eventNumber), not Player object.
    const entry = State.flag.playersInZoneByPid[playerId];
    if (entry?.vehicleObjId) {
        removeOvertimeVehicleOccupant(entry.vehicleObjId);
    }
    delete State.flag.playersInZoneByPid[playerId];
    delete State.flag.lastUiSnapshotByPid[playerId];

    if (!allowHardDelete) {
        // Undeploy/death cleanup: do NOT delete widgets mid-round to avoid engine instability.
        // Hide + drop refs so HUD can be safely rebuilt on next round/reconnect.
        const refs = State.flag.uiByPid[playerId];
        if (refs?.root) setWidgetVisible(refs.root, false);
        const globalRefs = State.flag.globalUiByPid[playerId];
        if (globalRefs?.root) setWidgetVisible(globalRefs.root, false);
        dropOvertimeUiRefsForPlayerId(playerId);
        return;
    }

    if (isPidDisconnected(playerId) && shouldDeferDisconnectUiDeletes()) {
        dropOvertimeUiRefsForPlayerId(playerId);
        return;
    }
    deleteOvertimeUiForPlayerId(playerId);
}

function handleOvertimePlayerEnterVehicle(eventPlayer: mod.Player, eventVehicle: mod.Vehicle): void {
    try {
        if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
        // Seat changes inside the zone must update vehicle occupancy.
        // No-op for players not currently tracked as in-zone.
        if (!State.flag.configValid) return;
        const pid = safeGetPlayerId(eventPlayer);
        if (pid === undefined || isPidDisconnected(pid)) return;
        const entry = State.flag.playersInZoneByPid[pid];
        if (!entry) return;
        const teamId = safeGetTeamNumberFromPlayer(eventPlayer);
        entry.teamId = teamId;
        const vid = safeGetObjId(eventVehicle);
        if (vid === undefined) return;
        if (entry.vehicleObjId && entry.vehicleObjId !== vid) {
            removeOvertimeVehicleOccupant(entry.vehicleObjId);
        }
        if (entry.vehicleObjId !== vid) {
            entry.vehicleObjId = vid;
            addOvertimeVehicleOccupant(teamId, vid);
        }
        refreshOvertimeUiVisibilityForPlayer(eventPlayer);
    } catch {
        return;
    }
}

function handleOvertimePlayerExitVehicle(eventPlayer: mod.Player, eventVehicle: mod.Vehicle): void {
    try {
        if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
        // Exiting a vehicle inside the zone removes that vehicle from capture counts.
        // The per-player UI will switch to the "vehicle required" hint.
        const pid = safeGetPlayerId(eventPlayer);
        if (pid === undefined || isPidDisconnected(pid)) return;
        const entry = State.flag.playersInZoneByPid[pid];
        if (!entry) return;
        const vid = safeGetObjId(eventVehicle);
        if (vid === undefined) return;
        if (entry.vehicleObjId === vid) {
            removeOvertimeVehicleOccupant(vid);
            entry.vehicleObjId = 0;
            delete State.flag.lastUiSnapshotByPid[pid];
        }
        refreshOvertimeUiVisibilityForPlayer(eventPlayer);
    } catch {
        return;
    }
}

function handleOvertimeVehicleDestroyed(eventVehicle: mod.Vehicle): void {
    try {
        // Ensure destroyed vehicles are removed from capture counts to avoid ghost capture.
        const vid = safeGetObjId(eventVehicle);
        if (vid === undefined) return;
        if (State.flag.vehicleOccupantsByVid[vid] === undefined) return;
        delete State.flag.vehicleOccupantsByVid[vid];
        const teamId = State.flag.vehicleTeamByVid[vid];
        delete State.flag.vehicleTeamByVid[vid];
        decrementOvertimeTeamVehicleCount(teamId);
        const pids = Object.keys(State.flag.playersInZoneByPid);
        for (let i = 0; i < pids.length; i++) {
            const pid = Number(pids[i]);
            const entry = State.flag.playersInZoneByPid[pid];
            if (entry?.vehicleObjId === vid) {
                entry.vehicleObjId = 0;
                delete State.flag.lastUiSnapshotByPid[pid];
            }
        }
    } catch {
        return;
    }
}

//#endregion -------------------- Overtime Flag Capture - Vehicle + Zone Membership Tracking --------------------



//#region -------------------- Overtime Flag Capture - Capture Loop + Progress --------------------

function stopOvertimeCaptureLoop(): void {
    if (!State.flag.tickActive) return;
    // Invalidate the token so any running loop exits on the next tick.
    State.flag.tickActive = false;
    State.flag.tickToken = (State.flag.tickToken + 1) % 1000000000;
}

function startOvertimeCaptureLoop(): void {
    // Token guards against multiple loops running at once.
    if (State.flag.tickActive) return;
    State.flag.tickActive = true;
    State.flag.tickToken = (State.flag.tickToken + 1) % 1000000000;
    const token = State.flag.tickToken;
    void runOvertimeCaptureLoop(token);
}

async function runOvertimeCaptureLoop(expectedToken: number): Promise<void> {
    // Tick loop: update capture state + HUD, then wait.
    while (State.flag.tickActive && State.flag.tickToken === expectedToken) {
        if (!State.flag.active || !isRoundLive()) {
            stopOvertimeCaptureLoop();
            return;
        }
        if (isRoundEndUiLockdownActive()) {
            // Round-end transition: stop capture ticks before any UI updates.
            stopOvertimeCaptureLoop();
            return;
        }
        try {
            pruneOvertimeZoneMembership();
            pruneOvertimeUiCaches();
            updateOvertimeCaptureProgress();
            updateOvertimeHudForAllPlayers();
        } catch {
            // Defensive: skip a bad tick if a disconnect invalidates state mid-loop.
        }
        await mod.Wait(OVERTIME_TICK_SECONDS);
    }
}

function pruneOvertimeZoneMembership(): void {
    // Round-end teardown: skip overtime membership churn.
    if (isRoundEndUiLockdownActive()) return;
    if (!isOvertimeZoneTrackingEnabled()) return;
    const now = mod.GetMatchTimeElapsed();
    if (now - State.flag.lastMembershipPruneAtSeconds < OVERTIME_MEMBERSHIP_PRUNE_INTERVAL_SECONDS) return;
    State.flag.lastMembershipPruneAtSeconds = now;

    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    const validPlayersByPid: Record<number, mod.Player> = {};
    for (let i = 0; i < count; i++) {
        const player = mod.ValueInArray(players, i) as mod.Player;
        if (!player || !mod.IsPlayerValid(player)) continue;
        const pid = safeGetPlayerId(player);
        if (pid === undefined) continue;
        validPlayersByPid[pid] = player;
    }

    const trackedPids = Object.keys(State.flag.playersInZoneByPid);
    for (let i = 0; i < trackedPids.length; i++) {
        const pid = Number(trackedPids[i]);
        if (isPidDisconnected(pid)) {
            handleOvertimePlayerLeaveById(pid, true);
            continue;
        }
        const player = validPlayersByPid[pid];
        if (!player || !mod.IsPlayerValid(player)) {
            // Best-effort cleanup for missed AreaTrigger exits.
            handleOvertimePlayerLeaveById(pid, false);
            continue;
        }
        if (!isPlayerDeployed(player)) {
            handleOvertimePlayerExitZone(player);
        }
    }
}

function pruneOvertimeUiCaches(): void {
    // Round-end teardown: avoid touching overtime UI caches.
    if (isRoundEndUiLockdownActive()) return;
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    const validPids: Record<number, true> = {};
    for (let i = 0; i < count; i++) {
        const player = mod.ValueInArray(players, i) as mod.Player;
        const pid = safeGetPlayerId(player);
        if (pid === undefined) continue;
        validPids[pid] = true;
    }

    const zonePids = Object.keys(State.flag.uiByPid);
    for (let i = 0; i < zonePids.length; i++) {
        const pid = Number(zonePids[i]);
        if (validPids[pid]) continue;
        const refs = State.flag.uiByPid[pid];
        if (refs?.root) setWidgetVisible(refs.root, false);
        delete State.flag.uiByPid[pid];
        delete State.flag.lastUiSnapshotByPid[pid];
    }

    const globalPids = Object.keys(State.flag.globalUiByPid);
    for (let i = 0; i < globalPids.length; i++) {
        const pid = Number(globalPids[i]);
        if (validPids[pid]) continue;
        const refs = State.flag.globalUiByPid[pid];
        if (refs?.root) setWidgetVisible(refs.root, false);
        delete State.flag.globalUiByPid[pid];
    }
}

function getOvertimeCaptureMultiplier(deltaAbs: number): number {
    if (deltaAbs >= 4) return OVERTIME_CAPTURE_MULTIPLIER_4X;
    if (deltaAbs === 3) return OVERTIME_CAPTURE_MULTIPLIER_3X;
    if (deltaAbs === 2) return OVERTIME_CAPTURE_MULTIPLIER_2X;
    return 1;
}

function updateOvertimeCaptureProgress(): void {
    if (!State.flag.active || !isRoundLive()) return;

    // Progress runs toward the team with vehicle majority; neutral is 0.5.
    // Decay runs only when the zone is empty and progress is not fully owned.
    const t1Count = State.flag.t1Count;
    const t2Count = State.flag.t2Count;
    const delta = t1Count - t2Count;
    if (delta !== 0) {
        // Base step uses 0.5 distance (neutral -> full) and scales by majority.
        const baseStep = (OVERTIME_TICK_SECONDS / OVERTIME_CAPTURE_SECONDS_TO_FULL) * 0.5;
        const scaled = getOvertimeCaptureMultiplier(Math.abs(delta));
        const soloTeam1 = t1Count > 0 && t2Count === 0;
        const soloTeam2 = t2Count > 0 && t1Count === 0;
        const team1CatchingUp = soloTeam1 && State.flag.progress < 0.5;
        const team2CatchingUp = soloTeam2 && State.flag.progress > 0.5;
        const catchupBoost = (team1CatchingUp || team2CatchingUp) ? OVERTIME_NEUTRAL_ACCELERATION_MULTIPLIER : 1;
        const step = baseStep * scaled * catchupBoost;
        State.flag.progress = State.flag.progress + (delta > 0 ? step : -step);
        if (team1CatchingUp && State.flag.progress > 0.5) {
            State.flag.progress = 0.5;
        }
        if (team2CatchingUp && State.flag.progress < 0.5) {
            State.flag.progress = 0.5;
        }
    } else if (t1Count === 0 && t2Count === 0) {
        if (State.flag.progress !== 0 && State.flag.progress !== 1) {
            const decayStep = (OVERTIME_TICK_SECONDS / OVERTIME_DECAY_SECONDS_TO_TARGET) * 0.5;
            const neutralStep = (State.flag.ownerTeam === 0) ? (decayStep * OVERTIME_NEUTRAL_ACCELERATION_MULTIPLIER) : decayStep;
            if (State.flag.ownerTeam === TeamID.Team1) {
                State.flag.progress = Math.min(1, State.flag.progress + decayStep);
            } else if (State.flag.ownerTeam === TeamID.Team2) {
                State.flag.progress = Math.max(0, State.flag.progress - decayStep);
            } else if (State.flag.progress > 0.5) {
                State.flag.progress = Math.max(0.5, State.flag.progress - neutralStep);
            } else if (State.flag.progress < 0.5) {
                State.flag.progress = Math.min(0.5, State.flag.progress + neutralStep);
            }
        }
    }

    State.flag.progress = Math.max(0, Math.min(1, State.flag.progress));

    if (State.flag.progress <= 0) {
        State.flag.progress = 0;
        State.flag.ownerTeam = TeamID.Team2;
        // Full capture ends the round immediately (unless a kill-target already ended it).
        if (isRoundLive() && !isRoundKillTargetReached()) {
            State.flag.active = false;
            stopOvertimeCaptureLoop();
            endRound(undefined, getRemainingSeconds(), TeamID.Team2);
        }
        return;
    }
    if (State.flag.progress >= 1) {
        State.flag.progress = 1;
        State.flag.ownerTeam = TeamID.Team1;
        // Full capture ends the round immediately (unless a kill-target already ended it).
        if (isRoundLive() && !isRoundKillTargetReached()) {
            State.flag.active = false;
            stopOvertimeCaptureLoop();
            endRound(undefined, getRemainingSeconds(), TeamID.Team1);
        }
    }
}

// TODO(1.0): Unused; remove before final 1.0 release.
function getOvertimeProgressPercent(): number {
    // Percent is floored for stable UI updates.
    return Math.max(0, Math.min(100, Math.floor(State.flag.progress * 100)));
}

function getOvertimeDisplayPercents(progress: number): { left: number; right: number } {
    // Biased whole-number rounding so the displayed winner matches the capture winner.
    const clamped = Math.max(0, Math.min(1, progress));
    if (clamped === 0.5) return { left: 50, right: 50 };
    if (clamped > 0.5) {
        const left = Math.min(100, Math.max(0, Math.ceil(clamped * 100)));
        return { left, right: 100 - left };
    }
    const left = Math.min(100, Math.max(0, Math.floor(clamped * 100)));
    return { left, right: 100 - left };
}

//#endregion -------------------- Overtime Flag Capture - Capture Loop + Progress --------------------



//#region -------------------- Overtime Flag Capture - HUD Update + Visibility --------------------

function isOvertimeZoneTrackingEnabled(): boolean {
    return isRoundLive() && State.flag.trackingEnabled && isTieBreakerEnabledForRound();
}

function shouldDeferDisconnectUiDeletes(): boolean {
    // Avoid hard UI deletes during active overtime capture to reduce crash risk on disconnects.
    return isRoundLive() && State.flag.stage >= OvertimeStage.Visible;
}

function updateOvertimeHudForAllPlayers(): void {
    if (!isRoundLive()) return;
    // Round-end teardown: stop live HUD updates.
    if (isRoundEndUiLockdownActive()) return;
    if (State.flag.stage < OvertimeStage.Visible) return;
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const player = mod.ValueInArray(players, i) as mod.Player;
        if (!player || !mod.IsPlayerValid(player)) continue;
        const pid = safeGetPlayerId(player);
        if (pid === undefined || isPidDisconnected(pid)) continue;
        try {
            updateOvertimeHudForPlayer(player);
        } catch {
            continue;
        }
    }
}

function updateOvertimeHudForPlayer(player: mod.Player): void {
    if (!player || !mod.IsPlayerValid(player)) return;
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return;
    if (isPidDisconnected(pid)) return;
    // Round-end teardown: skip per-player HUD updates.
    if (isRoundEndUiLockdownActive()) return;
    const entry = State.flag.playersInZoneByPid[pid];
    const inZone = !!entry;
    const refs = State.flag.uiByPid[pid];
    if (!refs || !refs.root) return;

    const stage = State.flag.stage;
    const isActive = stage >= OvertimeStage.Active;
    const letterKey = getActiveOvertimeFlagLetterKey();
    const letterText = getActiveOvertimeFlagLetterText();
    const teamId = entry?.teamId ?? safeGetTeamNumberFromPlayer(player);

    // Title + status routing by stage and zone presence.
    let titleKey = STR_FLAG_TITLE_ACTIVE_FORMAT;
    let titleValue = letterKey;
    let statusKey = STR_FLAG_STATUS_STALLED;
    let statusValue = -1;
    let statusVisible = true;
    let unlockSeconds = -1;

    if (!isActive) {
        titleKey = STR_FLAG_TITLE_LOCKED_FORMAT;
        titleValue = letterKey;
        unlockSeconds = getOvertimeUnlockSeconds();
        if (inZone) {
            statusKey = STR_FLAG_ACTIVATES_IN_FORMAT;
            statusValue = unlockSeconds;
        } else {
            statusVisible = false;
        }
    } else {
        titleKey = STR_FLAG_TITLE_ACTIVE_FORMAT;
        titleValue = letterKey;
        // Active stage: status reflects which team is winning the capture.
        const delta = State.flag.t1Count - State.flag.t2Count;
        if (delta !== 0) {
            if (teamId === TeamID.Team1) {
                statusKey = delta > 0 ? STR_FLAG_STATUS_CAPTURING : STR_FLAG_STATUS_LOSING;
            } else if (teamId === TeamID.Team2) {
                statusKey = delta < 0 ? STR_FLAG_STATUS_CAPTURING : STR_FLAG_STATUS_LOSING;
            }
        } else if (State.flag.t1Count > 0 && State.flag.t2Count > 0) {
            statusKey = STR_FLAG_STATUS_STALLED;
        } else if (State.flag.t1Count === 0 && State.flag.t2Count === 0) {
            const isResetting = Math.abs(State.flag.progress - 0.5) > 0.0001;
            if (isResetting) {
                statusKey = STR_FLAG_STATUS_RESETTING;
            } else {
                statusVisible = false;
            }
        }
    }

    const preActiveInZone = !isActive && stage >= OvertimeStage.Visible && inZone;
    const countsVisible = isActive || preActiveInZone;
    const countsUseX = preActiveInZone;
    const leftBorderVisible = isActive && State.flag.t1Count > 0;
    const rightBorderVisible = isActive && State.flag.t2Count > 0;
    const vehicleRequiredVisible = stage >= OvertimeStage.Visible && inZone && entry?.vehicleObjId === 0;
    const progress = isActive ? State.flag.progress : 0.5;
    const progressPercent = Math.max(0, Math.min(100, Math.floor(progress * 100)));
    const displayPercents = getOvertimeDisplayPercents(progress);
    const leftPercent = Math.min(99, displayPercents.left);
    const rightPercent = Math.min(99, displayPercents.right);
    const t1Width = Math.max(0, Math.min(OVERTIME_BAR_WIDTH, Math.round(OVERTIME_BAR_WIDTH * progress)));
    const t2Width = Math.max(0, OVERTIME_BAR_WIDTH - t1Width);

    // Always refresh the title so locked/active text stays visible even when snapshot gating skips other updates.
    const titleWidget = refs.title ?? safeFind(`OvertimeFlag_Title_${pid}`);
    const titleShadowWidget = refs.titleShadow ?? safeFind(`OvertimeFlag_TitleShadow_${pid}`);
    if (titleWidget || titleShadowWidget) {
        const titleLabel = !isActive
            ? mod.Message(titleKey, letterText, unlockSeconds)
            : mod.Message(titleKey, letterText);
        if (titleWidget) {
            refs.title = titleWidget;
            safeSetUITextLabel(titleWidget, titleLabel);
            setWidgetVisible(titleWidget, true);
        }
        if (titleShadowWidget) {
            refs.titleShadow = titleShadowWidget;
            safeSetUITextLabel(titleShadowWidget, titleLabel);
            setWidgetVisible(titleShadowWidget, true);
        }
    }

    const snapshot = State.flag.lastUiSnapshotByPid[pid];
    // Avoid touching UI if nothing changed since the last tick.
    if (
        snapshot
        && snapshot.progressPercent === progressPercent
        && snapshot.leftPercent === leftPercent
        && snapshot.rightPercent === rightPercent
        && snapshot.barFillT1Width === t1Width
        && snapshot.barFillT2Width === t2Width
        && snapshot.t1Count === State.flag.t1Count
        && snapshot.t2Count === State.flag.t2Count
        && snapshot.statusKey === statusKey
        && snapshot.statusValue === statusValue
        && snapshot.statusVisible === statusVisible
        && snapshot.titleKey === titleKey
        && snapshot.titleValue === titleValue
        && snapshot.countsVisible === countsVisible
        && snapshot.countsUseX === countsUseX
        && snapshot.leftBorderVisible === leftBorderVisible
        && snapshot.rightBorderVisible === rightBorderVisible
        && snapshot.vehicleRequiredVisible === vehicleRequiredVisible
    ) {
        return;
    }

    State.flag.lastUiSnapshotByPid[pid] = {
        progressPercent,
        leftPercent,
        rightPercent,
        barFillT1Width: t1Width,
        barFillT2Width: t2Width,
        t1Count: State.flag.t1Count,
        t2Count: State.flag.t2Count,
        statusKey,
        statusValue,
        statusVisible,
        titleKey,
        titleValue,
        countsVisible,
        countsUseX,
        leftBorderVisible,
        rightBorderVisible,
        vehicleRequiredVisible,
    };

    if (refs.status || refs.statusShadow) {
        if (statusVisible) {
            const statusLabel = statusValue >= 0 ? mod.Message(statusKey, statusValue) : mod.Message(statusKey);
            if (refs.status) {
                safeSetUITextLabel(refs.status, statusLabel);
            }
            if (refs.statusShadow) {
                safeSetUITextLabel(refs.statusShadow, statusLabel);
            }
        }
        if (refs.status) {
            setWidgetVisible(refs.status, statusVisible);
        }
        if (refs.statusShadow) {
            setWidgetVisible(refs.statusShadow, statusVisible);
        }
    }

    if (refs.countsLeft) {
        if (countsVisible) {
            const label = countsUseX
                ? mod.Message(STR_FLAG_COUNTS_LEFT_FORMAT, STR_UI_X)
                : mod.Message(STR_FLAG_COUNTS_LEFT_FORMAT, State.flag.t1Count);
            safeSetUITextLabel(refs.countsLeft, label);
        }
        setWidgetVisible(refs.countsLeft, countsVisible);
    }
    if (refs.countsLeftBorder) {
        setWidgetVisible(refs.countsLeftBorder, leftBorderVisible);
    }
    if (refs.countsRight) {
        if (countsVisible) {
            const label = countsUseX
                ? mod.Message(STR_FLAG_COUNTS_RIGHT_FORMAT, STR_UI_X)
                : mod.Message(STR_FLAG_COUNTS_RIGHT_FORMAT, State.flag.t2Count);
            safeSetUITextLabel(refs.countsRight, label);
        }
        setWidgetVisible(refs.countsRight, countsVisible);
    }
    if (refs.countsRightBorder) {
        setWidgetVisible(refs.countsRightBorder, rightBorderVisible);
    }
    if (refs.percentLeft) {
        if (countsVisible) {
            safeSetUITextLabel(refs.percentLeft, mod.Message(STR_FLAG_PROGRESS_FORMAT, leftPercent));
        }
        setWidgetVisible(refs.percentLeft, countsVisible);
    }
    if (refs.percentLeftBg) {
        setWidgetVisible(refs.percentLeftBg, countsVisible);
    }
    if (refs.percentRight) {
        if (countsVisible) {
            safeSetUITextLabel(refs.percentRight, mod.Message(STR_FLAG_PROGRESS_FORMAT, rightPercent));
        }
        setWidgetVisible(refs.percentRight, countsVisible);
    }
    if (refs.percentRightBg) {
        setWidgetVisible(refs.percentRightBg, countsVisible);
    }

    const progressDelta = progress - 0.5;
    const progressEpsilon = 0.0001;
    const showLeftCrown = countsVisible && progressDelta > progressEpsilon;
    const showRightCrown = countsVisible && progressDelta < -progressEpsilon;
    setWidgetVisible(refs.countsLeftCrown, showLeftCrown);
    setWidgetVisible(refs.countsRightCrown, showRightCrown);

    setWidgetVisible(refs.vehicleRequired, vehicleRequiredVisible);

    // Bar fill is split between the two teams around neutral.
    if (refs.barBg) setWidgetVisible(refs.barBg, true);
    if (refs.barFillT1) setWidgetVisible(refs.barFillT1, true);
    if (refs.barFillT2) setWidgetVisible(refs.barFillT2, true);
    if (refs.barFillT1) safeSetUIWidgetSize(refs.barFillT1, mod.CreateVector(t1Width, OVERTIME_BAR_HEIGHT, 0));
    if (refs.barFillT2) safeSetUIWidgetSize(refs.barFillT2, mod.CreateVector(t2Width, OVERTIME_BAR_HEIGHT, 0));
}

// TODO(1.0): Unused; remove before final 1.0 release.
function updateOvertimeGlobalHudForAllPlayers(force: boolean): void {
    // Deprecated: global HUD replaced by unified in-zone HUD.
    if (!force) return;
    // Round-end teardown: avoid forced HUD refresh.
    if (isRoundEndUiLockdownActive()) return;
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const player = mod.ValueInArray(players, i) as mod.Player;
        if (!player || !mod.IsPlayerValid(player)) continue;
        const pid = safeGetPlayerId(player);
        if (pid === undefined || isPidDisconnected(pid)) continue;
        const refs = State.flag.globalUiByPid[pid];
        if (refs?.root) setWidgetVisible(refs.root, false);
    }
}

function refreshOvertimeUiVisibilityForAllPlayers(): void {
    // Used after stage transitions or global state changes.
    // Round-end teardown: do not toggle overtime HUD visibility.
    if (isRoundEndUiLockdownActive()) return;
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const player = mod.ValueInArray(players, i) as mod.Player;
        if (!player || !mod.IsPlayerValid(player)) continue;
        refreshOvertimeUiVisibilityForPlayer(player);
    }
}

function refreshOvertimeUiVisibilityForPlayer(player: mod.Player): void {
    if (!player || !mod.IsPlayerValid(player)) return;
    // Single HUD for all players once visible; global HUD is deprecated.
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return;
    if (isPidDisconnected(pid)) return;
    // Round-end teardown: skip per-player visibility changes.
    if (isRoundEndUiLockdownActive()) return;
    const isLive = isRoundLive();
    const shouldShow = isLive && State.flag.stage >= OvertimeStage.Visible;
    let refs: OvertimeFlagHudRefs | undefined = State.flag.uiByPid[pid];
    if (!refs && shouldShow) {
        try {
            refs = ensureOvertimeHudForPlayer(player);
        } catch {
            return;
        }
    }
    if (refs?.root) setWidgetVisible(refs.root, shouldShow);
    if (shouldShow && refs?.root) {
        try {
            updateOvertimeHudForPlayer(player);
        } catch {
            return;
        }
    }
    const globalRefs = State.flag.globalUiByPid[pid];
    if (globalRefs?.root) setWidgetVisible(globalRefs.root, false);
}

function rebuildOvertimeUiForPlayer(player: mod.Player): void {
    if (!player || !mod.IsPlayerValid(player)) return;
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return;

    // Hide any lingering overtime HUD roots and drop cached refs/snapshots.
    const zoneRoot = safeFind(`OvertimeFlagRoot_${pid}`);
    if (zoneRoot) setWidgetVisible(zoneRoot, false);
    const globalRoot = safeFind(`OvertimeGlobalRoot_${pid}`);
    if (globalRoot) setWidgetVisible(globalRoot, false);

    dropOvertimeUiRefsForPlayerId(pid);

    // Rebuild only when the round is in a safe state for overtime UI updates.
    if (isRoundEndUiLockdownActive()) return;
    refreshOvertimeUiVisibilityForPlayer(player);
}

function prewarmOvertimeHudForAllPlayers(): void {
    // Round-end teardown: skip prewarm if teardown is active.
    if (isRoundEndUiLockdownActive()) return;
    if (!isRoundLive()) return;
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const player = mod.ValueInArray(players, i) as mod.Player;
        const pid = safeGetPlayerId(player);
        if (pid === undefined || isPidDisconnected(pid)) continue;
        let refs: OvertimeFlagHudRefs | undefined;
        try {
            refs = ensureOvertimeHudForPlayer(player);
        } catch {
            continue;
        }
        if (refs?.root) setWidgetVisible(refs.root, false);
        const globalRefs = State.flag.globalUiByPid[pid];
        if (globalRefs?.root) setWidgetVisible(globalRefs.root, false);
    }
}

function hideOvertimeUiForAllPlayers(): void {
    // Hide both in-zone and out-of-zone HUD roots.
    // Round-end teardown: avoid touching widget visibility.
    if (isRoundEndUiLockdownActive()) return;
    const zonePids = Object.keys(State.flag.uiByPid);
    for (let i = 0; i < zonePids.length; i++) {
        const pid = Number(zonePids[i]);
        const refs = State.flag.uiByPid[pid];
        if (refs?.root) setWidgetVisible(refs.root, false);
    }
    const globalPids = Object.keys(State.flag.globalUiByPid);
    for (let i = 0; i < globalPids.length; i++) {
        const pid = Number(globalPids[i]);
        const refs = State.flag.globalUiByPid[pid];
        if (refs?.root) setWidgetVisible(refs.root, false);
    }
}

//#endregion -------------------- Overtime Flag Capture - HUD Update + Visibility --------------------



//#region -------------------- Overtime Flag Capture - HUD Build + Cache --------------------

function safeDeleteUiWidget(widget: mod.UIWidget | undefined): void {
    if (!widget) return;
    try {
        mod.DeleteUIWidget(widget);
    } catch {
        return;
    }
}

function dropOvertimeUiRefsForPlayerId(pid: number): void {
    delete State.flag.uiByPid[pid];
    delete State.flag.globalUiByPid[pid];
    delete State.flag.lastUiSnapshotByPid[pid];
}

function deleteOvertimeUiForPlayerId(pid: number): void {
    // Round-end teardown: drop refs without deleting widgets.
    if (isRoundEndUiLockdownActive()) {
        dropOvertimeUiRefsForPlayerId(pid);
        return;
    }
    // Hard delete widgets for disconnect cleanup.
    const refs = State.flag.uiByPid[pid];
    if (refs) {
        safeDeleteUiWidget(refs.root);
        safeDeleteUiWidget(refs.barBg);
        safeDeleteUiWidget(refs.barFillT1);
        safeDeleteUiWidget(refs.barFillT2);
        safeDeleteUiWidget(refs.title);
        safeDeleteUiWidget(refs.titleShadow);
        safeDeleteUiWidget(refs.status);
        safeDeleteUiWidget(refs.countsLeft);
        safeDeleteUiWidget(refs.countsRight);
        safeDeleteUiWidget(refs.countsLeftBorder);
        safeDeleteUiWidget(refs.countsRightBorder);
        safeDeleteUiWidget(refs.percentLeftBg);
        safeDeleteUiWidget(refs.percentRightBg);
        safeDeleteUiWidget(refs.percentLeft);
        safeDeleteUiWidget(refs.percentRight);
        safeDeleteUiWidget(refs.countsLeftCrown);
        safeDeleteUiWidget(refs.countsRightCrown);
        safeDeleteUiWidget(refs.statusShadow);
        safeDeleteUiWidget(refs.vehicleRequired);
    }
    const globalRefs = State.flag.globalUiByPid[pid];
    if (globalRefs) {
        safeDeleteUiWidget(globalRefs.root);
        safeDeleteUiWidget(globalRefs.barBg);
        safeDeleteUiWidget(globalRefs.barFillT1);
        safeDeleteUiWidget(globalRefs.barFillT2);
        safeDeleteUiWidget(globalRefs.title);
    }
    delete State.flag.uiByPid[pid];
    delete State.flag.globalUiByPid[pid];
    delete State.flag.lastUiSnapshotByPid[pid];
}

function ensureOvertimeHudForPlayer(player: mod.Player): OvertimeFlagHudRefs | undefined {
    // In-zone HUD: status, counts, and capture bar.
    // Text widgets are built via modlib.ParseUI; the bar uses AddUIContainer for dynamic width updates.
    if (!player || !mod.IsPlayerValid(player)) return undefined;
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return undefined;
    if (isPidDisconnected(pid)) return undefined;
    const rootName = `OvertimeFlagRoot_${pid}`;
    const cached = State.flag.uiByPid[pid];
    const existingRoot = safeFind(rootName);
    if (cached && cached.root && existingRoot) return cached;
    if (existingRoot) {
        // Rehydrate refs if widgets already exist (e.g., reconnect or cached UI remnants).
        const refs: OvertimeFlagHudRefs = {
            root: existingRoot,
            title: safeFind(`OvertimeFlag_Title_${pid}`),
            titleShadow: safeFind(`OvertimeFlag_TitleShadow_${pid}`),
            countsLeft: safeFind(`OvertimeFlag_CountsLeft_${pid}`),
            countsRight: safeFind(`OvertimeFlag_CountsRight_${pid}`),
            countsLeftBorder: safeFind(`OvertimeFlag_CountsLeft_Border_${pid}`),
            countsRightBorder: safeFind(`OvertimeFlag_CountsRight_Border_${pid}`),
            percentLeftBg: safeFind(`OvertimeFlag_PercentLeft_${pid}`),
            percentRightBg: safeFind(`OvertimeFlag_PercentRight_${pid}`),
            percentLeft: safeFind(`OvertimeFlag_PercentLeft_Text_${pid}`),
            percentRight: safeFind(`OvertimeFlag_PercentRight_Text_${pid}`),
            countsLeftCrown: safeFind(`OvertimeFlag_CountsLeft_Crown_${pid}`),
            countsRightCrown: safeFind(`OvertimeFlag_CountsRight_Crown_${pid}`),
            status: safeFind(`OvertimeFlag_Status_${pid}`),
            statusShadow: safeFind(`OvertimeFlag_StatusShadow_${pid}`),
            vehicleRequired: safeFind(`OvertimeFlag_VehicleRequired_${pid}`),
            barBg: safeFind(`OvertimeFlag_BarBg_${pid}`),
            barFillT1: safeFind(`OvertimeFlag_BarFillT1_${pid}`),
            barFillT2: safeFind(`OvertimeFlag_BarFillT2_${pid}`),
        };
        State.flag.uiByPid[pid] = refs;
        return refs;
    }

    try {
        modlib.ParseUI({
            name: rootName,
            type: "Container",
            playerId: player,
            anchor: mod.UIAnchor.TopCenter,
            position: [OVERTIME_UI_OFFSET_X, OVERTIME_UI_OFFSET_Y],
            size: [OVERTIME_UI_WIDTH, OVERTIME_UI_HEIGHT],
            visible: false,
            padding: 0,
            bgAlpha: 0,
            bgFill: mod.UIBgFill.None,
            children: [
                {
                    name: `OvertimeFlag_TitleShadow_${pid}`,
                    type: "Text",
                    position: [HUD_TEXT_SHADOW_OFFSET_X, 18 + HUD_TEXT_SHADOW_OFFSET_Y],
                    size: [OVERTIME_UI_WIDTH, 18],
                    anchor: mod.UIAnchor.TopCenter,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: STR_FLAG_TITLE,
                    textColor: [0, 0, 0],
                    textAlpha: 1,
                    textSize: 16,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    name: `OvertimeFlag_Title_${pid}`,
                    type: "Text",
                    position: [0, 18],
                    size: [OVERTIME_UI_WIDTH, 18],
                    anchor: mod.UIAnchor.TopCenter,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: STR_FLAG_TITLE,
                    textColor: [1, 1, 1],
                    textAlpha: 1,
                    textSize: 16,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    name: `OvertimeFlag_CountsLeft_${pid}`,
                    type: "Text",
                    position: [-OVERTIME_COUNT_OFFSET_X, OVERTIME_COUNT_OFFSET_Y],
                    size: [OVERTIME_COUNT_TEXT_WIDTH, OVERTIME_COUNT_TEXT_HEIGHT],
                    anchor: mod.UIAnchor.TopCenter,
                    visible: true,
                    padding: 0,
                    bgColor: OVERTIME_COUNT_T1_RGB,
                    bgAlpha: OVERTIME_COUNT_BG_ALPHA,
                    bgFill: mod.UIBgFill.Blur,
                    textLabel: mod.Message(STR_FLAG_COUNTS_LEFT_FORMAT, 0),
                    textColor: OVERTIME_COUNT_TEXT_RGB,
                    textAlpha: 1,
                    textSize: OVERTIME_COUNT_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    name: `OvertimeFlag_CountsRight_${pid}`,
                    type: "Text",
                    position: [OVERTIME_COUNT_OFFSET_X, OVERTIME_COUNT_OFFSET_Y],
                    size: [OVERTIME_COUNT_TEXT_WIDTH, OVERTIME_COUNT_TEXT_HEIGHT],
                    anchor: mod.UIAnchor.TopCenter,
                    visible: true,
                    padding: 0,
                    bgColor: OVERTIME_COUNT_T2_RGB,
                    bgAlpha: OVERTIME_COUNT_BG_ALPHA,
                    bgFill: mod.UIBgFill.Blur,
                    textLabel: mod.Message(STR_FLAG_COUNTS_RIGHT_FORMAT, 0),
                    textColor: OVERTIME_COUNT_TEXT_RGB,
                    textAlpha: 1,
                    textSize: OVERTIME_COUNT_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    name: `OvertimeFlag_PercentLeft_${pid}`,
                    type: "Container",
                    position: [-OVERTIME_PERCENT_OFFSET_X, OVERTIME_PERCENT_OFFSET_Y],
                    size: [OVERTIME_PERCENT_TEXT_WIDTH, OVERTIME_PERCENT_TEXT_HEIGHT],
                    anchor: mod.UIAnchor.TopCenter,
                    visible: true,
                    padding: 0,
                    bgColor: OVERTIME_COUNT_T1_RGB,
                    bgAlpha: OVERTIME_COUNT_BG_ALPHA,
                    bgFill: mod.UIBgFill.Blur,
                    children: [
                        {
                            name: `OvertimeFlag_PercentLeft_Text_${pid}`,
                            type: "Text",
                            position: [-OVERTIME_PERCENT_TEXT_NUDGE, 0],
                            size: [OVERTIME_PERCENT_TEXT_WIDTH, OVERTIME_PERCENT_TEXT_HEIGHT],
                            anchor: mod.UIAnchor.Center,
                            visible: true,
                            padding: 0,
                            bgAlpha: 0,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.Message(STR_FLAG_PROGRESS_FORMAT, 50),
                            textColor: OVERTIME_COUNT_TEXT_RGB,
                            textAlpha: 1,
                            textSize: OVERTIME_PERCENT_TEXT_SIZE,
                            textAnchor: mod.UIAnchor.CenterRight,
                        },
                    ],
                },
                {
                    name: `OvertimeFlag_PercentRight_${pid}`,
                    type: "Container",
                    position: [OVERTIME_PERCENT_OFFSET_X, OVERTIME_PERCENT_OFFSET_Y],
                    size: [OVERTIME_PERCENT_TEXT_WIDTH, OVERTIME_PERCENT_TEXT_HEIGHT],
                    anchor: mod.UIAnchor.TopCenter,
                    visible: true,
                    padding: 0,
                    bgColor: OVERTIME_COUNT_T2_RGB,
                    bgAlpha: OVERTIME_COUNT_BG_ALPHA,
                    bgFill: mod.UIBgFill.Blur,
                    children: [
                        {
                            name: `OvertimeFlag_PercentRight_Text_${pid}`,
                            type: "Text",
                            position: [OVERTIME_PERCENT_TEXT_NUDGE, 0],
                            size: [OVERTIME_PERCENT_TEXT_WIDTH, OVERTIME_PERCENT_TEXT_HEIGHT],
                            anchor: mod.UIAnchor.Center,
                            visible: true,
                            padding: 0,
                            bgAlpha: 0,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.Message(STR_FLAG_PROGRESS_FORMAT, 50),
                            textColor: OVERTIME_COUNT_TEXT_RGB,
                            textAlpha: 1,
                            textSize: OVERTIME_PERCENT_TEXT_SIZE,
                            textAnchor: mod.UIAnchor.CenterLeft,
                        },
                    ],
                },
                {
                    name: `OvertimeFlag_CountsLeft_Crown_${pid}`,
                    type: "Image",
                    position: [-OVERTIME_PERCENT_OFFSET_X, OVERTIME_PERCENT_CROWN_OFFSET_Y],
                    size: [OVERTIME_COUNT_CROWN_SIZE, OVERTIME_COUNT_CROWN_SIZE],
                    anchor: mod.UIAnchor.TopCenter,
                    visible: false,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    imageType: mod.UIImageType.CrownSolid,
                    imageColor: OVERTIME_COUNT_CROWN_RGB,
                    imageAlpha: OVERTIME_COUNT_CROWN_ALPHA,
                },
                {
                    name: `OvertimeFlag_CountsRight_Crown_${pid}`,
                    type: "Image",
                    position: [OVERTIME_PERCENT_OFFSET_X, OVERTIME_PERCENT_CROWN_OFFSET_Y],
                    size: [OVERTIME_COUNT_CROWN_SIZE, OVERTIME_COUNT_CROWN_SIZE],
                    anchor: mod.UIAnchor.TopCenter,
                    visible: false,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    imageType: mod.UIImageType.CrownSolid,
                    imageColor: OVERTIME_COUNT_CROWN_RGB,
                    imageAlpha: OVERTIME_COUNT_CROWN_ALPHA,
                },
                {
                    name: `OvertimeFlag_StatusShadow_${pid}`,
                    type: "Text",
                    position: [HUD_TEXT_SHADOW_OFFSET_X, 54 + HUD_TEXT_SHADOW_OFFSET_Y],
                    size: [OVERTIME_UI_WIDTH, 16],
                    anchor: mod.UIAnchor.TopCenter,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: STR_FLAG_STATUS_STALLED,
                    textColor: [0, 0, 0],
                    textAlpha: 1,
                    textSize: 14,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    name: `OvertimeFlag_Status_${pid}`,
                    type: "Text",
                    position: [0, 54],
                    size: [OVERTIME_UI_WIDTH, 16],
                    anchor: mod.UIAnchor.TopCenter,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: STR_FLAG_STATUS_STALLED,
                    textColor: [1, 1, 1],
                    textAlpha: 1,
                    textSize: 14,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    name: `OvertimeFlag_VehicleRequired_${pid}`,
                    type: "Text",
                    position: [0, 70],
                    size: [OVERTIME_UI_WIDTH, 14],
                    anchor: mod.UIAnchor.TopCenter,
                    visible: false,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: STR_FLAG_VEHICLE_REQUIRED,
                    textColor: [1, 1, 1],
                    textAlpha: 1,
                    textSize: 12,
                    textAnchor: mod.UIAnchor.Center,
                },
            ],
        });
    } catch {
        return undefined;
    }

    const root = safeFind(rootName);
    if (!root) return undefined;
    safeSetUIWidgetDepth(root, mod.UIDepth.AboveGameUI);

    const countsLeft = safeFind(`OvertimeFlag_CountsLeft_${pid}`);
    const countsRight = safeFind(`OvertimeFlag_CountsRight_${pid}`);

    const countsLeftBorderId = `OvertimeFlag_CountsLeft_Border_${pid}`;
    safeAddUIContainer(
        countsLeftBorderId,
        mod.CreateVector(-OVERTIME_COUNT_OFFSET_X, OVERTIME_COUNT_OFFSET_Y - OVERTIME_COUNT_BORDER_GROW, 0),
        mod.CreateVector(
            OVERTIME_COUNT_TEXT_WIDTH + (OVERTIME_COUNT_BORDER_GROW * 2),
            OVERTIME_COUNT_TEXT_HEIGHT + (OVERTIME_COUNT_BORDER_GROW * 2),
            0
        ),
        mod.UIAnchor.TopCenter,
        root,
        true,
        0,
        COLOR_BLUE,
        OVERTIME_COUNT_BORDER_ALPHA,
        mod.UIBgFill.OutlineThin,
        mod.UIDepth.AboveGameUI,
        player
    );
    const countsLeftBorder = safeFind(countsLeftBorderId);

    const countsRightBorderId = `OvertimeFlag_CountsRight_Border_${pid}`;
    safeAddUIContainer(
        countsRightBorderId,
        mod.CreateVector(OVERTIME_COUNT_OFFSET_X, OVERTIME_COUNT_OFFSET_Y - OVERTIME_COUNT_BORDER_GROW, 0),
        mod.CreateVector(
            OVERTIME_COUNT_TEXT_WIDTH + (OVERTIME_COUNT_BORDER_GROW * 2),
            OVERTIME_COUNT_TEXT_HEIGHT + (OVERTIME_COUNT_BORDER_GROW * 2),
            0
        ),
        mod.UIAnchor.TopCenter,
        root,
        true,
        0,
        COLOR_RED,
        OVERTIME_COUNT_BORDER_ALPHA,
        mod.UIBgFill.OutlineThin,
        mod.UIDepth.AboveGameUI,
        player
    );
    const countsRightBorder = safeFind(countsRightBorderId);

    const barBgId = `OvertimeFlag_BarBg_${pid}`;
    safeAddUIContainer(
        barBgId,
        mod.CreateVector(0, OVERTIME_BAR_OFFSET_Y, 0),
        mod.CreateVector(OVERTIME_BAR_WIDTH, OVERTIME_BAR_HEIGHT, 0),
        mod.UIAnchor.TopCenter,
        root,
        true,
        0,
        COLOR_BLUE_DARK,
        OVERTIME_BAR_BG_ALPHA,
        mod.UIBgFill.Solid,
        mod.UIDepth.AboveGameUI,
        player
    );
    const barBg = safeFind(barBgId);
    if (barBg) {
        const fillT1Id = `OvertimeFlag_BarFillT1_${pid}`;
        safeAddUIContainer(
            fillT1Id,
            mod.CreateVector(0, 0, 0),
            mod.CreateVector(OVERTIME_BAR_WIDTH, OVERTIME_BAR_HEIGHT, 0),
            mod.UIAnchor.TopLeft,
            barBg,
            true,
            0,
            COLOR_BLUE,
            OVERTIME_BAR_FILL_ALPHA,
            mod.UIBgFill.Solid,
            mod.UIDepth.AboveGameUI,
            player
        );

        const fillT2Id = `OvertimeFlag_BarFillT2_${pid}`;
        safeAddUIContainer(
            fillT2Id,
            mod.CreateVector(0, 0, 0),
            mod.CreateVector(OVERTIME_BAR_WIDTH, OVERTIME_BAR_HEIGHT, 0),
            mod.UIAnchor.TopRight,
            barBg,
            true,
            0,
            COLOR_RED,
            OVERTIME_BAR_FILL_ALPHA,
            mod.UIBgFill.Solid,
            mod.UIDepth.AboveGameUI,
            player
        );
    }

    const refs: OvertimeFlagHudRefs = {
        root,
        title: safeFind(`OvertimeFlag_Title_${pid}`),
        titleShadow: safeFind(`OvertimeFlag_TitleShadow_${pid}`),
        countsLeft,
        countsRight,
        countsLeftBorder,
        countsRightBorder,
        percentLeftBg: safeFind(`OvertimeFlag_PercentLeft_${pid}`),
        percentRightBg: safeFind(`OvertimeFlag_PercentRight_${pid}`),
        percentLeft: safeFind(`OvertimeFlag_PercentLeft_Text_${pid}`),
        percentRight: safeFind(`OvertimeFlag_PercentRight_Text_${pid}`),
        countsLeftCrown: safeFind(`OvertimeFlag_CountsLeft_Crown_${pid}`),
        countsRightCrown: safeFind(`OvertimeFlag_CountsRight_Crown_${pid}`),
        status: safeFind(`OvertimeFlag_Status_${pid}`),
        statusShadow: safeFind(`OvertimeFlag_StatusShadow_${pid}`),
        vehicleRequired: safeFind(`OvertimeFlag_VehicleRequired_${pid}`),
        barBg: barBg,
        barFillT1: safeFind(`OvertimeFlag_BarFillT1_${pid}`),
        barFillT2: safeFind(`OvertimeFlag_BarFillT2_${pid}`),
    };
    State.flag.uiByPid[pid] = refs;
    return refs;
}

// TODO(1.0): Unused; remove before final 1.0 release.
function ensureOvertimeGlobalHudForPlayer(player: mod.Player): OvertimeFlagGlobalHudRefs | undefined {
    // Global HUD: compact label + progress bar for out-of-zone players.
    // This stays lightweight so it can be shown to all out-of-zone players.
    if (!player || !mod.IsPlayerValid(player)) return undefined;
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return undefined;
    if (isPidDisconnected(pid)) return undefined;
    const rootName = `OvertimeGlobalRoot_${pid}`;
    const cached = State.flag.globalUiByPid[pid];
    if (cached && cached.root && safeFind(rootName)) return cached;

    try {
        modlib.ParseUI({
            name: rootName,
            type: "Container",
            playerId: player,
            anchor: mod.UIAnchor.TopCenter,
            position: [OVERTIME_GLOBAL_UI_OFFSET_X, OVERTIME_GLOBAL_UI_OFFSET_Y],
            size: [OVERTIME_GLOBAL_UI_WIDTH, OVERTIME_GLOBAL_UI_HEIGHT],
            visible: false,
            padding: 0,
            bgAlpha: 0,
            bgFill: mod.UIBgFill.None,
            children: [
                {
                    name: `OvertimeGlobal_Title_${pid}`,
                    type: "Text",
                    position: [0, 4],
                    size: [OVERTIME_GLOBAL_UI_WIDTH, 16],
                    anchor: mod.UIAnchor.TopCenter,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: STR_FLAG_TITLE,
                    textColor: [1, 1, 1],
                    textAlpha: 1,
                    textSize: 14,
                    textAnchor: mod.UIAnchor.Center,
                },
            ],
        });
    } catch {
        return undefined;
    }

    const root = safeFind(rootName);
    if (!root) return undefined;
    safeSetUIWidgetDepth(root, mod.UIDepth.AboveGameUI);

    const barBgId = `OvertimeGlobal_BarBg_${pid}`;
    safeAddUIContainer(
        barBgId,
        mod.CreateVector(0, OVERTIME_GLOBAL_BAR_OFFSET_Y, 0),
        mod.CreateVector(OVERTIME_GLOBAL_BAR_WIDTH, OVERTIME_GLOBAL_BAR_HEIGHT, 0),
        mod.UIAnchor.TopCenter,
        root,
        true,
        0,
        COLOR_BLUE_DARK,
        OVERTIME_BAR_BG_ALPHA,
        mod.UIBgFill.Solid,
        mod.UIDepth.AboveGameUI,
        player
    );
    const barBg = safeFind(barBgId);
    if (barBg) {
        const fillT1Id = `OvertimeGlobal_BarFillT1_${pid}`;
        safeAddUIContainer(
            fillT1Id,
            mod.CreateVector(0, 0, 0),
            mod.CreateVector(OVERTIME_GLOBAL_BAR_WIDTH, OVERTIME_GLOBAL_BAR_HEIGHT, 0),
            mod.UIAnchor.TopLeft,
            barBg,
            true,
            0,
            COLOR_BLUE,
            OVERTIME_BAR_FILL_ALPHA,
            mod.UIBgFill.Solid,
            mod.UIDepth.AboveGameUI,
            player
        );

        const fillT2Id = `OvertimeGlobal_BarFillT2_${pid}`;
        safeAddUIContainer(
            fillT2Id,
            mod.CreateVector(0, 0, 0),
            mod.CreateVector(OVERTIME_GLOBAL_BAR_WIDTH, OVERTIME_GLOBAL_BAR_HEIGHT, 0),
            mod.UIAnchor.TopRight,
            barBg,
            true,
            0,
            COLOR_RED,
            OVERTIME_BAR_FILL_ALPHA,
            mod.UIBgFill.Solid,
            mod.UIDepth.AboveGameUI,
            player
        );
    }

    const refs: OvertimeFlagGlobalHudRefs = {
        root,
        title: safeFind(`OvertimeGlobal_Title_${pid}`),
        barBg: barBg,
        barFillT1: safeFind(`OvertimeGlobal_BarFillT1_${pid}`),
        barFillT2: safeFind(`OvertimeGlobal_BarFillT2_${pid}`),
    };
    State.flag.globalUiByPid[pid] = refs;
    return refs;
}

//#endregion -------------------- Overtime Flag Capture - HUD Build + Cache --------------------



//#region -------------------- Overtime Flag Capture - Stage Transitions + Messaging --------------------

function updateOvertimeStage(): void {
    // Stage transitions are driven by the round clock.
    // Checks run from latest to earliest to tolerate admin time jumps.
    const helisSingleZone = isHelisOvertimeSingleZoneMode();
    const previewEnabled = computeTieBreakerEnabledForRound(
        State.round.current,
        State.round.max,
        State.admin.tieBreakerModeIndex
    );

    if (!isRoundLive()) {
        State.flag.tieBreakerEnabledThisRound = previewEnabled;
    }

    const tieBreakerEnabled = isRoundLive() ? isTieBreakerEnabledForRound() : previewEnabled;
    if (!tieBreakerEnabled) {
        if (State.flag.stage !== OvertimeStage.None) {
            resetOvertimeFlagState();
        }
        setOvertimeAllFlagVisibility(false);
        return;
    }
    if (!isRoundLive()) {
        if (!State.flag.configValid) return;
        if (helisSingleZone) {
            if (State.flag.stage < OvertimeStage.Visible) {
                if (!selectOvertimeZoneForRound()) return;
                State.flag.stage = OvertimeStage.Visible;
                State.flag.active = false;
                setOvertimeSectorsForSelected(State.flag.activeSectorId);
                setOvertimeCapturePointsForSelected(State.flag.activeCapturePointId);
                showOvertimeFlagPreviewIcon(true);
                refreshOvertimeUiVisibilityForAllPlayers();
                updateOvertimeHudForAllPlayers();
            }
        } else {
            // Pregame state: show all flag markers for planning (visibility only).
            setOvertimeAllFlagVisibility(true);
        }
        return;
    }

    if (!State.flag.configValid) return;

    const remaining = getRemainingSeconds();
    const visibleThreshold = getOvertimeVisibleSeconds();

    if (helisSingleZone) {
        if (State.flag.stage < OvertimeStage.Visible) {
            enterOvertimeVisibleStageSilent();
        }
        if (remaining <= OVERTIME_STAGE_ACTIVE_SECONDS) {
            if (State.flag.stage < OvertimeStage.Active) {
                enterOvertimeActiveStage(remaining);
            }
            updateOvertimeActivePreviewIconText();
        } else {
            updateOvertimeLockedPreviewIconText(remaining);
            maybeSendOvertimeUnlockReminder(remaining);
            updateOvertimeHudForAllPlayers();
        }
        return;
    }

    if (remaining <= OVERTIME_STAGE_ACTIVE_SECONDS) {
        if (State.flag.stage < OvertimeStage.Visible) {
            enterOvertimeVisibleStage(remaining);
        }
        if (State.flag.stage < OvertimeStage.Active) {
            enterOvertimeActiveStage(remaining);
        }
        updateOvertimeActivePreviewIconText();
        return;
    }
    if (remaining <= visibleThreshold) {
        if (State.flag.stage < OvertimeStage.Visible) {
            enterOvertimeVisibleStage(remaining);
        }
        updateOvertimeLockedPreviewIconText(remaining);
        maybeSendOvertimeUnlockReminder(remaining);
        // Keep locked-stage countdown text in sync while visible but inactive.
        updateOvertimeHudForAllPlayers();
        return;
    }
    if (remaining <= OVERTIME_STAGE_NOTICE_SECONDS) {
        if (State.flag.stage < OvertimeStage.Notice) {
            enterOvertimeNoticeStage(remaining);
        }
    }

}

function getOvertimeVisibleSeconds(): number {
    const roundLength = State.round.clock.roundLengthSeconds;
    const duration = (roundLength !== undefined && roundLength > 0)
        ? roundLength
        : (State.round.clock.durationSeconds ?? ROUND_START_SECONDS);
    return Math.max(0, Math.floor(duration / 2));
}

// TODO(1.0): Unused; remove before final 1.0 release.
function buildRemainingTimeMessage(messageKey: number, remainingSeconds: number): mod.Message {
    const time = getClockTimeParts(remainingSeconds);
    return mod.Message(messageKey, time.minutes, time.secTens, time.secOnes);
}

function getOvertimeUnlockSeconds(remainingSeconds?: number): number {
    const remaining = remainingSeconds !== undefined ? remainingSeconds : getRemainingSeconds();
    return Math.max(0, Math.floor(remaining - OVERTIME_STAGE_ACTIVE_SECONDS));
}

function updateOvertimeLockedPreviewIconText(remainingSeconds?: number): void {
    if (State.flag.stage < OvertimeStage.Visible || State.flag.stage >= OvertimeStage.Active) return;
    const icon = getActiveOvertimeWorldIcon();
    if (!icon) return;
    const letterKey = getActiveOvertimeFlagLetterKey();
    const unlockSeconds = getOvertimeUnlockSeconds(remainingSeconds);
    try {
        mod.SetWorldIconText(icon, mod.Message(STR_FLAG_TITLE_LOCKED_FORMAT, letterKey, unlockSeconds));
    } catch {
        return;
    }
}

function updateOvertimeActivePreviewIconText(): void {
    if (State.flag.stage < OvertimeStage.Active) return;
    const icon = getActiveOvertimeWorldIcon();
    if (!icon) return;
    try {
        mod.SetWorldIconText(icon, mod.Message(STR_FLAG_PREVIEW_ACTIVE));
    } catch {
        return;
    }
}

// TODO(1.0): Unused; remove before final 1.0 release.
function shouldShowOvertimeUnlockMessageForPlayer(player: mod.Player): boolean {
    const pid = safeGetPlayerId(player);
    if (pid === undefined || isPidDisconnected(pid)) return false;
    return State.flag.playersInZoneByPid[pid] === undefined;
}

function enterOvertimeNoticeStage(remainingSeconds: number): void {
    State.flag.stage = OvertimeStage.Notice;
    // NOTE: 2:30 notice message disabled (visibility now handled at half time).
    // void showDynamicGlobalTitleSubtitleMessageForAllPlayers(
    //     undefined,
    //     (remaining) => buildRemainingTimeMessage(STR_OVERTIME_SUB_NOTICE, remaining),
    //     COLOR_WHITE,
    //     COLOR_WHITE,
    //     BIG_MESSAGE_DURATION_SECONDS,
    //     1,
    //     SMALL_MESSAGE_LAYOUT
    // );
}

function enterOvertimeVisibleStageSilent(): void {
    if (!selectOvertimeZoneForRound()) return;
    State.flag.stage = OvertimeStage.Visible;
    State.flag.active = false;
    // Locked stage: use sector radius + preview icon; tracking stays on but capture remains inactive.
    setOvertimeSectorsForSelected(State.flag.activeSectorId);
    setOvertimeCapturePointsForSelected(State.flag.activeCapturePointId);
    showOvertimeFlagPreviewIcon(true);
    refreshOvertimeUiVisibilityForAllPlayers();
    updateOvertimeHudForAllPlayers();
}

function enterOvertimeVisibleStage(remainingSeconds: number): void {
    if (!selectOvertimeZoneForRound()) return;
    State.flag.stage = OvertimeStage.Visible;
    State.flag.active = false;
    // Locked stage: use sector radius + preview icon; tracking stays on but capture remains inactive.
    setOvertimeSectorsForSelected(State.flag.activeSectorId);
    setOvertimeCapturePointsForSelected(State.flag.activeCapturePointId);
    showOvertimeFlagPreviewIcon(true);
    refreshOvertimeUiVisibilityForAllPlayers();
    updateOvertimeHudForAllPlayers();
    const letterKey = getActiveOvertimeFlagLetterKey();
    const overrideUsed = State.flag.overrideUsedThisRound; // Admin override uses the red callout + text.
    void showGlobalTitleSubtitleMessageForAllPlayers(
        mod.Message(overrideUsed ? STR_OVERTIME_TITLE_VISIBLE_ADMIN : STR_OVERTIME_TITLE_VISIBLE, letterKey),
        undefined,
        overrideUsed ? COLOR_RED : COLOR_WHITE,
        overrideUsed ? COLOR_RED : COLOR_WHITE,
        BIG_MESSAGE_DURATION_SECONDS,
        SMALL_MESSAGE_LAYOUT
    );
}

function enterOvertimeActiveStage(remainingSeconds: number): void {
    if (!selectOvertimeZoneForRound()) return;
    State.flag.stage = OvertimeStage.Active;
    State.flag.active = true;
    // Active stage: capture logic + HUD enabled (AreaTrigger events are authoritative).
    setOvertimeSectorsForSelected(State.flag.activeSectorId);
    setOvertimeCapturePointsForSelected(State.flag.activeCapturePointId);
    showOvertimeFlagPreviewIcon(false);
    // Failsafe: refresh world-icon text on activation.
    updateOvertimeActivePreviewIconText();
    const letterKey = getActiveOvertimeFlagLetterKey();
    void showGlobalTitleSubtitleMessageForAllPlayers(
        mod.Message(STR_OVERTIME_SUB_UNLOCKS_NOW, letterKey),
        undefined,
        COLOR_WHITE,
        COLOR_WHITE,
        BIG_MESSAGE_DURATION_SECONDS,
        SMALL_MESSAGE_LAYOUT
    );
    startOvertimeCaptureLoop();
    refreshOvertimeUiVisibilityForAllPlayers();
}

function maybeSendOvertimeUnlockReminder(remainingSeconds: number): void {
    // Disabled: unlock reminder subtitle messages are currently hidden.
    return;
    if (State.flag.unlockReminderSent) return;
    const threshold = OVERTIME_STAGE_ACTIVE_SECONDS + OVERTIME_UNLOCK_REMINDER_SECONDS;
    if (remainingSeconds <= threshold) {
        State.flag.unlockReminderSent = true;
        const letterKey = getActiveOvertimeFlagLetterKey();
        void showDynamicGlobalTitleSubtitleMessageForAllPlayers(
            undefined,
            (remaining) => {
                const unlockSeconds = Math.max(0, Math.floor(remaining - OVERTIME_STAGE_ACTIVE_SECONDS));
                return mod.Message(STR_OVERTIME_SUB_UNLOCKS_IN, letterKey, unlockSeconds);
            },
            COLOR_WHITE,
            COLOR_WHITE,
            BIG_MESSAGE_DURATION_SECONDS,
            1,
            SMALL_MESSAGE_LAYOUT,
            shouldShowOvertimeUnlockMessageForPlayer
        );
    }
}

function resolveOvertimeWinnerAtClockExpiry(): TeamID | 0 | undefined {
    // At expiry, capture progress decides unless exactly neutral (0.5), which falls back to kills.
    if (!State.flag.configValid) return undefined;
    if (State.flag.progress > 0.5) return TeamID.Team1;
    if (State.flag.progress < 0.5) return TeamID.Team2;
    return undefined;
}

//#endregion -------------------- Overtime Flag Capture - Stage Transitions + Messaging --------------------



//#region -------------------- Match Clock - Update + State --------------------

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
    const clampedSeconds = Math.max(0, Math.floor(seconds));
    State.round.clock.durationSeconds = clampedSeconds;
    State.round.clock.roundLengthSeconds = clampedSeconds;
    State.round.clock.matchStartElapsedSeconds = Math.floor(mod.GetMatchTimeElapsed());

    State.round.clock.isPaused = false;
    State.round.clock.pausedRemainingSeconds = undefined;

    State.round.clock.expiryFired = false;
    State.round.clock.lastDisplayedSeconds = undefined;
    State.round.clock.lastLowTimeState = undefined;
}

function setRoundClockPreview(seconds: number): void {
    const clampedSeconds = clampRoundLengthSeconds(seconds);
    State.round.clock.durationSeconds = clampedSeconds;
    State.round.clock.roundLengthSeconds = clampedSeconds;
    State.round.clock.matchStartElapsedSeconds = undefined;
    State.round.clock.isPaused = true;
    State.round.clock.pausedRemainingSeconds = clampedSeconds;
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
    ResetRoundClock(getConfiguredRoundLengthSeconds());
}

// NOTE: This counts registered/scoring vehicles, not every spawned vehicle in the world.
function getRegisteredVehicleCount(teamNum: TeamID): number {
    const arr = teamNum === TeamID.Team1
        ? mod.GetVariable(regVehiclesTeam1)
        : mod.GetVariable(regVehiclesTeam2);
    return Math.max(0, Math.floor(mod.CountOf(arr)));
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
    const remaining = isRoundLive() ? getRemainingSeconds() : getConfiguredRoundLengthSeconds();

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

    const showVehiclesAlive = isRoundLive() && !State.round.flow.cleanupActive && !State.match.isEnded;
    const vehiclesAliveT1 = showVehiclesAlive ? getRegisteredVehicleCount(TeamID.Team1) : 0;
    const vehiclesAliveT2 = showVehiclesAlive ? getRegisteredVehicleCount(TeamID.Team2) : 0;

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

        const pid = mod.GetObjId(player);
        const refs = State.hudCache.hudByPid[pid] ?? ensureHudForPlayer(player);
        if (refs?.leftVehiclesAliveText) {
            mod.SetUIWidgetVisible(refs.leftVehiclesAliveText, showVehiclesAlive);
            if (showVehiclesAlive) {
                mod.SetUITextLabel(
                    refs.leftVehiclesAliveText,
                    mod.Message(mod.stringkeys.twl.hud.vehiclesAliveFormat, vehiclesAliveT1)
                );
            }
        }
        if (refs?.rightVehiclesAliveText) {
            mod.SetUIWidgetVisible(refs.rightVehiclesAliveText, showVehiclesAlive);
            if (showVehiclesAlive) {
                mod.SetUITextLabel(
                    refs.rightVehiclesAliveText,
                    mod.Message(mod.stringkeys.twl.hud.vehiclesAliveFormat, vehiclesAliveT2)
                );
            }
        }
    }

    State.round.clock.lastLowTimeState = lowTime;
    State.round.clock.lastDisplayedSeconds = remaining;
}

//#endregion ----------------- Match Clock - Update + State --------------------



//#region -------------------- Match Clock - UI Build + Cache Helpers --------------------



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
            mod.SetUIWidgetPosition(probeHelp, mod.CreateVector(CLOCK_POSITION_X, CLOCK_POSITION_Y + ROUND_LIVE_HELP_OFFSET_Y, 0));
            ensureTopHudRootForPid(pid, player);
            setHudHelpDepthForPid(pid);
            return cached;
        }
    }

    const digitWidth = CLOCK_WIDTH * 0.12;
    const colonWidth = CLOCK_WIDTH * 0.06;

    const xOffsets = {
        minTens: -digitWidth * 1.8 + 14, 
        minOnes: -digitWidth * 0.8 + 8, 
        colon: -digitWidth * 0.05,
        secTens: digitWidth * 0.9 - 10, 
        secOnes: digitWidth * 1.9 - 16, 
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
        position: [CLOCK_POSITION_X, CLOCK_POSITION_Y + ROUND_LIVE_HELP_OFFSET_Y],
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
                textLabel: mod.Message(mod.stringkeys.twl.hud.roundLiveHelpFormat, 0),
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
    ensureTopHudRootForPid(pid, player);
    setHudHelpDepthForPid(pid);

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
        textLabel: mod.Message(mod.stringkeys.twl.hud.clock.digit, 0),
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

//#endregion ----------------- Match Clock - UI Build + Cache Helpers --------------------



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
    posDebugVisible: boolean;
    posDebugToken: number;
}

// Per-player state lives in State.players:
// - teamSwitchData: dialog + interact-point state per player.
// - readyByPid: READY toggle state for roster + auto-start gating.
// - autoReadyByPid: per-player auto-ready toggle (vehicle + main base).
// - inMainBaseByPid: main-base presence for pre-round gating + UI.

//#endregion ----------------- Team Switch Data + Config --------------------



//#region -------------------- Team Switch Interact Point --------------------

async function spawnTeamSwitchInteractPoint(eventPlayer: mod.Player) {
    if (!isPlayerDeployed(eventPlayer)) return;
    const playerId = mod.GetObjId(eventPlayer);
    if (!State.players.teamSwitchData[playerId]) initTeamSwitchData(eventPlayer);

    if (
        State.players.teamSwitchData[playerId].interactPoint === null &&
        !State.players.teamSwitchData[playerId].dontShowAgain &&
        TEAMSWITCHCONFIG.enableTeamSwitch
    ) {
        let isOnGround = safeGetSoldierStateBool(eventPlayer, mod.SoldierStateBool.IsOnGround);

        while (!isOnGround) {
            await mod.Wait(0.2);
            if (!isPlayerDeployed(eventPlayer)) return;
            isOnGround = safeGetSoldierStateBool(eventPlayer, mod.SoldierStateBool.IsOnGround);
        }

        const playerPosition = safeGetSoldierStateVector(eventPlayer, mod.SoldierStateVector.GetPosition);
        const playerFacingDirection = safeGetSoldierStateVector(eventPlayer, mod.SoldierStateVector.GetFacingDirection);
        if (!playerPosition || !playerFacingDirection) return;

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
            setUIInputModeForPlayer(eventPlayer, true);
            createTeamSwitchUI(eventPlayer);
            // Track visibility so roster refreshes can target all viewers with the dialog open.
            State.players.teamSwitchData[playerId].dialogVisible = true;
            if (consumeJoinPromptTripleTapForPid(playerId)) {
                markJoinPromptReadyDialogOpened(playerId);
            }
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
        try {
            mod.EnableInteractPoint(State.players.teamSwitchData[playerId].interactPoint as mod.InteractPoint, false);
            mod.UnspawnObject(State.players.teamSwitchData[playerId].interactPoint as mod.InteractPoint);
        } catch {
            // Best-effort cleanup; ignore if already despawned by the engine.
        }
        State.players.teamSwitchData[playerId].interactPoint = null;
    }
}

function isVelocityBeyond(threshold: number, eventPlayer: mod.Player): boolean {
    if (!isPlayerDeployed(eventPlayer)) return false;
    const v = safeGetSoldierStateVector(eventPlayer, mod.SoldierStateVector.GetLinearVelocity);
    if (!v) return false;
    const x = mod.AbsoluteValue(mod.XComponentOf(v));
    const y = mod.AbsoluteValue(mod.YComponentOf(v));
    const z = mod.AbsoluteValue(mod.ZComponentOf(v));
    return x + y + z > threshold;
}

function checkTeamSwitchInteractPointRemoval(eventPlayer: mod.Player) {
    if (!isPlayerDeployed(eventPlayer)) return;
    const isDead = safeGetSoldierStateBool(eventPlayer, mod.SoldierStateBool.IsDead);
    if (TEAMSWITCHCONFIG.enableTeamSwitch && !isDead) {
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
        posDebugVisible: false,
        posDebugToken: 0,
    };
}

//#endregion ----------------- Team Switch Interact Point --------------------



//#region -------------------- Team Switch Actions --------------------

// Handles a player-initiated team switch.
// This function validates the request, updates team membership,
// and triggers any required HUD or state refresh.

// Performs an undeploy with a short delay to ensure the engine has applied a prior SetTeam() before changing deploy state.
// This intentionally does NOT re-deploy the player; the player is expected to choose a spawn point manually.
async function forceUndeployPlayer(eventPlayer: mod.Player): Promise<void> {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    // Undeploy immediately so the player is forced to the deploy screen right away.
    // Then retry once with a short delay for robustness across transient engine timing.
    mod.UndeployPlayer(eventPlayer);
    await mod.Wait(0.05);
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
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

    // Close dialog + restore UI input mode before team mutation/undeploy to avoid stale handle issues.
    deleteTeamSwitchUI(eventPlayer);

    const currentTeamNum = getTeamNumber(mod.GetTeam(eventPlayer));
    const newTeamNum = (currentTeamNum === TeamID.Team2) ? TeamID.Team1 : TeamID.Team2;
    mod.SetTeam(eventPlayer, mod.GetTeam(newTeamNum));

    // Force a rapid return to the deploy screen so the player respawns on the new team.
    // Note: do not modify redeploy timers globally; we only force an undeploy so the player can choose spawn manually.
    // Ensure team switching does not grant faster-than-normal respawn timing.
    // We reuse the same redeploy window used at round end (ROUND_END_REDEPLOY_DELAY_SECONDS).
    mod.SetRedeployTime(eventPlayer, ROUND_END_REDEPLOY_DELAY_SECONDS);
    void forceUndeployPlayer(eventPlayer);

    sendHighlightedWorldLogMessage(
        mod.Message(mod.stringkeys.twl.notifications.teamSwitch),
        false,
        mod.GetTeam(eventPlayer),
        mod.stringkeys.twl.notifications.teamSwitch
    );
}

function deleteTeamSwitchUI(eventPlayer: mod.Player | number) {
    // Deletes the Team Switch UI for the given player id and restores normal input.
    // Note: When called with a player id (number) rather than a mod.Player, UI input mode cannot be toggled here.

    let playerId: any = eventPlayer;

    if (mod.IsType(eventPlayer, mod.Types.Player)) {
        setUIInputModeForPlayer(eventPlayer as mod.Player, false);
        playerId = mod.GetObjId(eventPlayer as mod.Player);
    }

    const baseWidget = safeFind(UI_TEAMSWITCH_CONTAINER_BASE_ID + playerId);
    if (baseWidget) mod.SetUIWidgetVisible(baseWidget, false);
    const borderTop = safeFind(UI_TEAMSWITCH_BORDER_TOP_ID + playerId);
    if (borderTop) mod.SetUIWidgetVisible(borderTop, false);
    const borderBottom = safeFind(UI_TEAMSWITCH_BORDER_BOTTOM_ID + playerId);
    if (borderBottom) mod.SetUIWidgetVisible(borderBottom, false);
    const borderLeft = safeFind(UI_TEAMSWITCH_BORDER_LEFT_ID + playerId);
    if (borderLeft) mod.SetUIWidgetVisible(borderLeft, false);
    const borderRight = safeFind(UI_TEAMSWITCH_BORDER_RIGHT_ID + playerId);
    if (borderRight) mod.SetUIWidgetVisible(borderRight, false);
    const debugWidget = safeFind(UI_TEAMSWITCH_DEBUG_TIMELIMIT_ID + playerId);
    if (debugWidget) {
        mod.SetUIWidgetVisible(debugWidget, false);
    }
    const mapLabel = safeFind(UI_READY_DIALOG_MAP_LABEL_ID + playerId);
    if (mapLabel) mod.SetUIWidgetVisible(mapLabel, false);
    const mapValue = safeFind(UI_READY_DIALOG_MAP_VALUE_ID + playerId);
    if (mapValue) mod.SetUIWidgetVisible(mapValue, false);

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
    const borderTop = safeFind(UI_TEAMSWITCH_BORDER_TOP_ID + playerId);
    if (borderTop) mod.DeleteUIWidget(borderTop);
    const borderBottom = safeFind(UI_TEAMSWITCH_BORDER_BOTTOM_ID + playerId);
    if (borderBottom) mod.DeleteUIWidget(borderBottom);
    const borderLeft = safeFind(UI_TEAMSWITCH_BORDER_LEFT_ID + playerId);
    if (borderLeft) mod.DeleteUIWidget(borderLeft);
    const borderRight = safeFind(UI_TEAMSWITCH_BORDER_RIGHT_ID + playerId);
    if (borderRight) mod.DeleteUIWidget(borderRight);
    const debugWidget = safeFind(UI_TEAMSWITCH_DEBUG_TIMELIMIT_ID + playerId);
    if (debugWidget) mod.DeleteUIWidget(debugWidget);
    const mapLabel = safeFind(UI_READY_DIALOG_MAP_LABEL_ID + playerId);
    if (mapLabel) mod.DeleteUIWidget(mapLabel);
    const mapValue = safeFind(UI_READY_DIALOG_MAP_VALUE_ID + playerId);
    if (mapValue) mod.DeleteUIWidget(mapValue);

    // Admin Panel widgets (toggle button + label + container).
    const adminToggle = safeFind(UI_ADMIN_PANEL_BUTTON_ID + playerId);
    if (adminToggle) mod.DeleteUIWidget(adminToggle);
    const adminToggleLabel = safeFind(UI_ADMIN_PANEL_BUTTON_LABEL_ID + playerId);
    if (adminToggleLabel) mod.DeleteUIWidget(adminToggleLabel);
    const adminToggleBorder = safeFind(UI_ADMIN_PANEL_BUTTON_ID + playerId + "_BORDER");
    if (adminToggleBorder) mod.DeleteUIWidget(adminToggleBorder);
    const adminContainer = safeFind(UI_ADMIN_PANEL_CONTAINER_ID + playerId);
    if (adminContainer) mod.DeleteUIWidget(adminContainer);

    const posContainer = safeFind(UI_POS_DEBUG_CONTAINER_ID + playerId);
    if (posContainer) mod.DeleteUIWidget(posContainer);
    const posX = safeFind(UI_POS_DEBUG_X_ID + playerId);
    if (posX) mod.DeleteUIWidget(posX);
    const posY = safeFind(UI_POS_DEBUG_Y_ID + playerId);
    if (posY) mod.DeleteUIWidget(posY);
    const posZ = safeFind(UI_POS_DEBUG_Z_ID + playerId);
    if (posZ) mod.DeleteUIWidget(posZ);
    const rotY = safeFind(UI_POS_DEBUG_ROTY_ID + playerId);
    if (rotY) mod.DeleteUIWidget(rotY);
}

//#endregion ----------------- Team Switch Actions --------------------



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
            // Manual ready disables auto-ready to enforce a single ready method at a time.
            if (State.players.autoReadyByPid[pid]) {
                State.players.autoReadyByPid[pid] = false;
                updateAutoReadyToggleButtonForViewer(eventPlayer, pid);
            }
            const currentlyReady = !!State.players.readyByPid[pid];
            const inBase = isPlayerInMainBaseForReady(pid);
            const nowSeconds = Math.floor(mod.GetMatchTimeElapsed());

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

                // Throttle ready-up broadcasts per player to prevent spam.
                const lastReadyAt = State.players.readyMessageCooldownByPid[pid] ?? -9999;
                if (nowSeconds - lastReadyAt >= READY_UP_MESSAGE_COOLDOWN_SECONDS) {
                    State.players.readyMessageCooldownByPid[pid] = nowSeconds;
                    const counts = getReadyCountsForMessage();
                    sendHighlightedWorldLogMessage(
                        mod.Message(STR_PLAYER_READIED_UP, eventPlayer, counts.readyCount, counts.totalCount),
                        true,
                        undefined,
                        STR_PLAYER_READIED_UP
                    );
                }
            } else {
                State.players.readyByPid[pid] = false;
                // Keep the HUD "X / Y PLAYERS READY" line in sync on every ready-state change.
                updatePlayersReadyHudTextForAllPlayers();
            }

            updateHelpTextVisibilityForPid(pid);

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

        case UI_READY_DIALOG_BUTTON_AUTO_READY_ID + playerId: {
            const pid = mod.GetObjId(eventPlayer);
            const nextAutoReady = !State.players.autoReadyByPid[pid];
            State.players.autoReadyByPid[pid] = nextAutoReady;
            updateAutoReadyToggleButtonForViewer(eventPlayer, pid);
            updateHelpTextVisibilityForPid(pid);

            if (nextAutoReady) {
                // Auto-ready mode always starts from NOT READY.
                if (State.players.readyByPid[pid]) {
                    State.players.readyByPid[pid] = false;
                    updateReadyToggleButtonForViewer(eventPlayer, pid);
                    updatePlayersReadyHudTextForAllPlayers();
                }
            }

            const changed = applyAutoReadyForPid(eventPlayer, pid);
            if (changed) {
                updatePlayersReadyHudTextForAllPlayers();
                renderReadyDialogForAllVisibleViewers();
                tryAutoStartRoundIfAllReady(eventPlayer);
            } else {
                renderReadyDialogForViewer(eventPlayer, playerId);
            }
            break;
        }

        case UI_READY_DIALOG_BUTTON_SWAP_ID + playerId: {
            // Swap Teams button:: single-button team toggle.
            swapPlayerTeam(eventPlayer);
            break;
        }

        case UI_READY_DIALOG_BESTOF_DEC_ID + playerId: {
            // Clamp to current round so max rounds never dips below the live round index.
            ensureCustomGameModeForManualChange();
            const prevMax = State.round.max;
            setHudRoundCountersForAllPlayers(State.round.current, Math.max(State.round.current, Math.max(1, State.round.max - 1)));
            if (State.round.max !== prevMax) {
                // Gameplay-gated world log message for best-of changes.
                sendHighlightedWorldLogMessage(
                    mod.Message(mod.stringkeys.twl.readyDialog.bestOfChanged, eventPlayer, Math.floor(State.round.max)),
                    true,
                    undefined,
                    mod.stringkeys.twl.readyDialog.bestOfChanged
                );
            }
            break;
        }
        case UI_READY_DIALOG_BESTOF_INC_ID + playerId: {
            ensureCustomGameModeForManualChange();
            const prevMax = State.round.max;
            setHudRoundCountersForAllPlayers(State.round.current, State.round.max + 1);
            if (State.round.max !== prevMax) {
                // Gameplay-gated world log message for best-of changes.
                sendHighlightedWorldLogMessage(
                    mod.Message(mod.stringkeys.twl.readyDialog.bestOfChanged, eventPlayer, Math.floor(State.round.max)),
                    true,
                    undefined,
                    mod.stringkeys.twl.readyDialog.bestOfChanged
                );
            }
            break;
        }
        case UI_READY_DIALOG_MATCHUP_DEC_ID + playerId: {
            if (isRoundLive()) break;
            const next = Math.max(0, State.round.matchupPresetIndex - 1);
            applyMatchupPreset(next, eventPlayer);
            break;
        }
        case UI_READY_DIALOG_MATCHUP_INC_ID + playerId: {
            if (isRoundLive()) break;
            const next = Math.min(MATCHUP_PRESETS.length - 1, State.round.matchupPresetIndex + 1);
            applyMatchupPreset(next, eventPlayer);
            break;
        }
        case UI_READY_DIALOG_MINPLAYERS_DEC_ID + playerId: {
            if (isRoundLive()) break;
            setAutoStartMinActivePlayers(State.round.autoStartMinActivePlayers - 1, eventPlayer);
            break;
        }
        case UI_READY_DIALOG_MINPLAYERS_INC_ID + playerId: {
            if (isRoundLive()) break;
            setAutoStartMinActivePlayers(State.round.autoStartMinActivePlayers + 1, eventPlayer);
            break;
        }
        case UI_READY_DIALOG_MODE_GAME_DEC_ID + playerId: {
            if (isRoundLive()) break;
            setReadyDialogGameModeIndex(State.round.modeConfig.gameModeIndex - 1);
            break;
        }
        case UI_READY_DIALOG_MODE_GAME_INC_ID + playerId: {
            if (isRoundLive()) break;
            setReadyDialogGameModeIndex(State.round.modeConfig.gameModeIndex + 1);
            break;
        }
        case UI_READY_DIALOG_MODE_SETTINGS_DEC_ID + playerId: {
            if (isRoundLive()) break;
            setReadyDialogAircraftCeiling(
                State.round.modeConfig.aircraftCeiling - READY_DIALOG_AIRCRAFT_CEILING_STEP,
                eventPlayer
            );
            break;
        }
        case UI_READY_DIALOG_MODE_SETTINGS_INC_ID + playerId: {
            if (isRoundLive()) break;
            setReadyDialogAircraftCeiling(
                State.round.modeConfig.aircraftCeiling + READY_DIALOG_AIRCRAFT_CEILING_STEP,
                eventPlayer
            );
            break;
        }
        case UI_READY_DIALOG_MODE_VEHICLES_T1_DEC_ID + playerId: {
            if (isRoundLive()) break;
            setReadyDialogVehicleIndexT1(State.round.modeConfig.vehicleIndexT1 - 1);
            break;
        }
        case UI_READY_DIALOG_MODE_VEHICLES_T1_INC_ID + playerId: {
            if (isRoundLive()) break;
            setReadyDialogVehicleIndexT1(State.round.modeConfig.vehicleIndexT1 + 1);
            break;
        }
        case UI_READY_DIALOG_MODE_VEHICLES_T2_DEC_ID + playerId: {
            if (isRoundLive()) break;
            setReadyDialogVehicleIndexT2(State.round.modeConfig.vehicleIndexT2 - 1);
            break;
        }
        case UI_READY_DIALOG_MODE_VEHICLES_T2_INC_ID + playerId: {
            if (isRoundLive()) break;
            setReadyDialogVehicleIndexT2(State.round.modeConfig.vehicleIndexT2 + 1);
            break;
        }
        case UI_READY_DIALOG_MODE_CONFIRM_ID + playerId: {
            if (isRoundLive()) break;
            confirmReadyDialogModeConfig(eventPlayer);
            updateReadyDialogModeConfigForAllVisibleViewers();
            break;
        }
        case UI_READY_DIALOG_MODE_RESET_ID + playerId: {
            if (isRoundLive()) break;
            triggerFreshRoundSetup(eventPlayer);
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

            sendHighlightedWorldLogMessage(
                mod.Message(mod.stringkeys.twl.adminPanel.accessed, eventPlayer),
                true,
                undefined,
                mod.stringkeys.twl.adminPanel.accessed
            );

            // Open: rebuild container + widgets fresh each time (low cost; avoids duplicate draw bugs).
            deleteAdminPanelUI(playerId, false); // safety: ensure no stale container/children exist

            mod.AddUIContainer(
                UI_ADMIN_PANEL_CONTAINER_ID + playerId,
                mod.CreateVector(ADMIN_PANEL_OFFSET_X, ADMIN_PANEL_OFFSET_Y, 0),
                mod.CreateVector(ADMIN_PANEL_CONTENT_WIDTH + (ADMIN_PANEL_PADDING * 2), ADMIN_PANEL_HEIGHT + (ADMIN_PANEL_PADDING * 2), 0),
                mod.UIAnchor.TopRight,
                mod.GetUIRoot(),
                false,
                10,
                ADMIN_PANEL_BG_COLOR,
                ADMIN_PANEL_BG_ALPHA,
                ADMIN_PANEL_BG_FILL,
                mod.UIDepth.AboveGameUI,
                eventPlayer
            );

            const adminContainer = mod.FindUIWidgetWithName(UI_ADMIN_PANEL_CONTAINER_ID + playerId, mod.GetUIRoot());
            if (!adminContainer) {
                break;
            }
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
            updateOvertimeStage();
            if (isRoundLive()) {
                refreshOvertimeUiVisibilityForAllPlayers();
            }
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.clockTimeDec);
            break;
        case UI_TEST_BUTTON_CLOCK_TIME_INC_ID + playerId:
            if (!State.round.clock.isPaused && getRemainingSeconds() < 0) {
                ResetRoundClock(60);
            } else {
                adjustRoundClockBySeconds(60);
            }
            updateOvertimeStage();
            if (isRoundLive()) {
                refreshOvertimeUiVisibilityForAllPlayers();
            }
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.clockTimeInc);
            break;

        case UI_TEST_BUTTON_CLOCK_RESET_ID + playerId:
            if (isRoundLive()) {
                resetRoundClockToDefault();
            } else {
                setRoundClockPreview(getConfiguredRoundLengthSeconds());
            }
            updateOvertimeStage();
            if (isRoundLive()) {
                refreshOvertimeUiVisibilityForAllPlayers();
            }
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

        case UI_TEST_BUTTON_POS_DEBUG_ID + playerId: {
            if (!State.players.teamSwitchData[playerId]) initTeamSwitchData(eventPlayer);
            const state = State.players.teamSwitchData[playerId];
            state.posDebugVisible = !state.posDebugVisible;
            setPositionDebugVisibleForPlayer(eventPlayer, state.posDebugVisible);
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.positionDebug);
            break;
        }

        case UI_ADMIN_TIEBREAKER_BUTTON_ID + "A_" + playerId:
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.tieBreakerOverrideA);
            applyAdminTieBreakerOverride(0);
            break;
        case UI_ADMIN_TIEBREAKER_BUTTON_ID + "B_" + playerId:
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.tieBreakerOverrideB);
            applyAdminTieBreakerOverride(1);
            break;
        case UI_ADMIN_TIEBREAKER_BUTTON_ID + "C_" + playerId:
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.tieBreakerOverrideC);
            applyAdminTieBreakerOverride(2);
            break;
        case UI_ADMIN_TIEBREAKER_BUTTON_ID + "D_" + playerId:
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.tieBreakerOverrideD);
            applyAdminTieBreakerOverride(3);
            break;
        case UI_ADMIN_TIEBREAKER_BUTTON_ID + "E_" + playerId:
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.tieBreakerOverrideE);
            applyAdminTieBreakerOverride(4);
            break;
        case UI_ADMIN_TIEBREAKER_BUTTON_ID + "F_" + playerId:
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.tieBreakerOverrideF);
            applyAdminTieBreakerOverride(5);
            break;
        case UI_ADMIN_TIEBREAKER_BUTTON_ID + "G_" + playerId:
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.tieBreakerOverrideG);
            applyAdminTieBreakerOverride(6);
            break;

        case UI_ADMIN_TIEBREAKER_MODE_DEC_ID + playerId:
            if (isRoundLive()) break;
            State.admin.tieBreakerModeIndex = normalizeTieBreakerModeIndex(State.admin.tieBreakerModeIndex - 1);
            syncAdminTieBreakerModeLabelForAllPlayers();
            handleAdminPanelAction(eventPlayer, getTieBreakerModeActionKey(State.admin.tieBreakerModeIndex));
            break;
        case UI_ADMIN_TIEBREAKER_MODE_INC_ID + playerId:
            if (isRoundLive()) break;
            State.admin.tieBreakerModeIndex = normalizeTieBreakerModeIndex(State.admin.tieBreakerModeIndex + 1);
            syncAdminTieBreakerModeLabelForAllPlayers();
            handleAdminPanelAction(eventPlayer, getTieBreakerModeActionKey(State.admin.tieBreakerModeIndex));
            break;

        case UI_ADMIN_LIVE_RESPAWN_BUTTON_ID + playerId: {
            State.admin.liveRespawnEnabled = !State.admin.liveRespawnEnabled;
            syncAdminLiveRespawnLabelForAllPlayers();
            updateSpawnDisabledWarningForAllPlayers();
            handleAdminPanelAction(
                eventPlayer,
                State.admin.liveRespawnEnabled
                    ? mod.stringkeys.twl.adminPanel.actions.liveRespawnOn
                    : mod.stringkeys.twl.adminPanel.actions.liveRespawnOff
            );
            break;
        }

        case UI_ADMIN_ROUND_LENGTH_DEC_ID + playerId: {
            if (isRoundLive()) break;
            const next = clampRoundLengthSeconds(getConfiguredRoundLengthSeconds() - ADMIN_ROUND_LENGTH_STEP_SECONDS);
            setRoundClockPreview(next);
            updateAllPlayersClock();
            updateOvertimeStage();
            syncAdminRoundLengthLabelForAllPlayers();
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.roundLengthDec);
            break;
        }
        case UI_ADMIN_ROUND_LENGTH_INC_ID + playerId: {
            if (isRoundLive()) break;
            const next = clampRoundLengthSeconds(getConfiguredRoundLengthSeconds() + ADMIN_ROUND_LENGTH_STEP_SECONDS);
            setRoundClockPreview(next);
            updateAllPlayersClock();
            updateOvertimeStage();
            syncAdminRoundLengthLabelForAllPlayers();
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.roundLengthInc);
            break;
        }

        default:
            break;
    }
}

//#endregion ----------------- Tester Button Events --------------------



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

// TODO(1.0): Unused; remove before final 1.0 release.
function broadcastGameplayNotificationKey(
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
    sendNotificationMessage(message, true);
}

// TODO(1.0): Unused; remove before final 1.0 release.
function broadcastGameplayHighlightedStringKey(
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
    sendHighlightedWorldLogMessage(message, true, undefined, stringKey);
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
    sendHighlightedWorldLogMessage(message, false, undefined, stringKey);
}

// Commented out function:
//function broadcastNotificationMessage(message: mod.Message): void {
//    mod.DisplayNotificationMessage(message);
//}

type CleanupSpawnWaitResult = "completed" | "timeout" | "aborted";

function setCleanupState(active: boolean, allowDeploy: boolean): void {
    State.round.flow.cleanupActive = active;
    State.round.flow.cleanupAllowDeploy = allowDeploy;
    updateHelpTextVisibilityForAllPlayers();
}

// Stops all spawner activity and invalidates in-flight sequences before cleanup.
function quiesceSpawnerSystemForCleanup(): void {
    State.vehicles.spawnSequenceToken = (State.vehicles.spawnSequenceToken + 1) % 1000000000;
    State.vehicles.spawnSequenceInProgress = false;
    State.vehicles.activeSpawnSlotIndex = undefined;
    State.vehicles.activeSpawnToken = undefined;
    State.vehicles.activeSpawnRequestedAtSeconds = undefined;

    for (let i = 0; i < State.vehicles.slots.length; i++) {
        const slot = State.vehicles.slots[i];
        if (slot.enabled) {
            setSpawnerSlotEnabled(i, false);
        }
        slot.expectingSpawn = false;
        slot.spawnRetryScheduled = false;
        slot.respawnRunning = false;
    }
}

function resetSpawnerSlotStateForCleanup(): void {
    State.vehicles.vehicleToSlot = {};
    for (let i = 0; i < State.vehicles.slots.length; i++) {
        const slot = State.vehicles.slots[i];
        slot.vehicleId = -1;
        slot.expectingSpawn = false;
        slot.spawnRetryScheduled = false;
        slot.respawnRunning = false;
        slot.spawnRequestToken = 0;
        slot.spawnRequestAtSeconds = -1;
    }
}

function clearVehicleCachesForCleanup(): void {
    mod.SetVariable(regVehiclesTeam1, mod.EmptyArray());
    mod.SetVariable(regVehiclesTeam2, mod.EmptyArray());
    vehIds.length = 0;
    vehOwners.length = 0;
    clearSpawnBaseTeamCache();
}

function areCleanupSpawnsReady(): boolean {
    for (let i = 0; i < State.vehicles.slots.length; i++) {
        const slot = State.vehicles.slots[i];
        if (!slot.enabled) continue;
        if (slot.vehicleId === -1) return false;
    }
    return true;
}

// Cleanup gating: "quiescent" means no pending binds/respawns or active spawn sequences.
function isSpawnerSystemQuiescent(): boolean {
    if (State.vehicles.spawnSequenceInProgress) return false;
    if (State.vehicles.activeSpawnSlotIndex !== undefined) return false;
    if (State.vehicles.activeSpawnToken !== undefined) return false;
    if (State.vehicles.activeSpawnRequestedAtSeconds !== undefined) return false;

    for (let i = 0; i < State.vehicles.slots.length; i++) {
        const slot = State.vehicles.slots[i];
        if (slot.expectingSpawn) return false;
        if (slot.respawnRunning) return false;
        if (slot.spawnRetryScheduled) return false;
    }

    return true;
}

// Waits for slot IDs + quiescent spawner state, then stabilizes briefly to avoid late binds.
async function waitForCleanupSpawnsOrTimeout(expectedToken: number): Promise<CleanupSpawnWaitResult> {
    const startElapsed = Math.floor(mod.GetMatchTimeElapsed());
    while (true) {
        if (expectedToken !== State.round.flow.roundEndRedeployToken) return "aborted";
        if (!State.round.flow.cleanupActive) return "aborted";
        if (areCleanupSpawnsReady() && isSpawnerSystemQuiescent()) {
            await mod.Wait(0.5);
            if (areCleanupSpawnsReady() && isSpawnerSystemQuiescent()) return "completed";
        }

        const elapsed = Math.floor(mod.GetMatchTimeElapsed()) - startElapsed;
        if (elapsed >= ROUND_END_CLEANUP_SPAWN_TIMEOUT_SECONDS) return "timeout";

        await mod.Wait(0.5);
    }
}

// Round-end cleanup flow: lock -> quiesce -> destroy -> undeploy -> reset -> spawn -> wait/timeout -> deploy -> hold.
// State.round.flow.roundEndRedeployToken cancels older timers if a new round end is triggered before the delay completes.
async function scheduleRoundEndCleanup(expectedToken: number): Promise<void> {
    setCleanupState(true, false);
    mod.EnableAllPlayerDeploy(false);
    // Invariant: cleanupActive blocks deploy/UI until cleanupAllowDeploy flips after spawns are ready.

    await mod.Wait(ROUND_END_REDEPLOY_DELAY_SECONDS);

    if (expectedToken !== State.round.flow.roundEndRedeployToken) {
        return;
    }
    if (isRoundLive()) {
        return;
    }
    if (State.match.isEnded) {
        return;
    }

    quiesceSpawnerSystemForCleanup();

    const vehicles = mod.AllVehicles();
    const vCount = mod.CountOf(vehicles);
    for (let v = 0; v < vCount; v++) {
        const vehicle = mod.ValueInArray(vehicles, v) as mod.Vehicle;
        if (!vehicle) continue;
        try {
            mod.DealDamage(vehicle, 9999);
        } catch {
            // Disconnect-safe: avoid hard crash if vehicle invalidates mid-loop.
        }
    }

    await mod.Wait(3);

    // Per-player undeploy to avoid global redeploy side effects.
    const undeployedPlayers = mod.AllPlayers();
    const undeployCount = mod.CountOf(undeployedPlayers);
    for (let i = 0; i < undeployCount; i++) {
        const player = mod.ValueInArray(undeployedPlayers, i) as mod.Player;
        if (!player || !mod.IsPlayerValid(player)) continue;
        const pid = safeGetPlayerId(player);
        if (pid === undefined || isPidDisconnected(pid)) continue;
        try {
            mod.UndeployPlayer(player);
        } catch {
            continue;
        }
        State.players.deployedByPid[pid] = false;
        try {
            setUIInputModeForPlayer(player, false);
        } catch {
            // Ignore UI failures during cleanup.
        }
    }

    resetSpawnerSlotStateForCleanup();
    clearVehicleCachesForCleanup();

    applySpawnerEnablementForMatchup(State.round.matchupPresetIndex, true);

    const waitResult = await waitForCleanupSpawnsOrTimeout(expectedToken);
    if (waitResult === "timeout") {
        sendHighlightedWorldLogMessage(
            mod.Message(STR_ROUND_CLEANUP_SPAWN_TIMEOUT, ROUND_END_CLEANUP_SPAWN_TIMEOUT_SECONDS),
            true,
            undefined,
            STR_ROUND_CLEANUP_SPAWN_TIMEOUT
        );
    } else if (waitResult === "aborted") {
        return;
    }

    setCleanupState(true, true);
    mod.EnableAllPlayerDeploy(true);
    // Per-player deploy pass, then recheck for stragglers.
    await mod.Wait(0.1);

    let players = mod.AllPlayers();
    let pCount = mod.CountOf(players);
    for (let i = 0; i < pCount; i++) {
        const player = mod.ValueInArray(players, i) as mod.Player;
        if (!player || !mod.IsPlayerValid(player)) continue;
        const pid = safeGetPlayerId(player);
        if (pid === undefined || isPidDisconnected(pid)) continue;
        if (!isPlayerDeployed(player)) {
            try {
                mod.DeployPlayer(player);
            } catch {
                continue;
            }
        }
    }

    await mod.Wait(0.5);

    players = mod.AllPlayers();
    pCount = mod.CountOf(players);
    for (let i = 0; i < pCount; i++) {
        const player = mod.ValueInArray(players, i) as mod.Player;
        if (!player || !mod.IsPlayerValid(player)) continue;
        const pid = safeGetPlayerId(player);
        if (pid === undefined || isPidDisconnected(pid)) continue;
        if (!isPlayerDeployed(player)) {
            try {
                mod.DeployPlayer(player);
            } catch {
                continue;
            }
        }
    }

    await mod.Wait(ROUND_END_POST_DEPLOY_HOLD_SECONDS);

    if (expectedToken !== State.round.flow.roundEndRedeployToken) {
        return;
    }

    setRoundEndDialogVisibleForAllPlayers(false);
    setCleanupState(false, false);
}

// Manual reset flow (non-live only): run the same cleanup sequence used after round end,
// but without affecting scores or advancing the round counter.
function triggerFreshRoundSetup(triggerPlayer?: mod.Player): void {
    if (State.match.isEnded) return;
    if (isRoundLive()) return;
    if (State.round.flow.cleanupActive) return;

    // Ensure we are in a pre-round state and clear any round-end UI.
    State.round.phase = RoundPhase.NotReady;
    State.round.flow.roundEndUiLockdown = false;
    setRoundEndDialogVisibleForAllPlayers(false);

    // Reset ready state so the next setup requires fresh player confirmation.
    resetReadyStateForAllPlayers();

    // Clear overtime/tie-breaker state; the next round will re-evaluate eligibility.
    resetOvertimeFlagState();
    State.flag.tieBreakerEnabledThisRound = false;
    setOvertimeAllFlagVisibility(false);

    updateHelpTextVisibilityForAllPlayers();
    setRoundStateTextForAllPlayers();

    State.round.flow.roundEndRedeployToken = (State.round.flow.roundEndRedeployToken + 1) % 1000000000;
    const redeployToken = State.round.flow.roundEndRedeployToken;

    sendHighlightedWorldLogMessage(
        mod.Message(mod.stringkeys.twl.notifications.roundOverRedeploying, ROUND_END_REDEPLOY_DELAY_SECONDS),
        true,
        undefined,
        mod.stringkeys.twl.notifications.roundOverRedeploying
    );

    void scheduleRoundEndCleanup(redeployToken);
}

// Final-round flow: keep the round-end dialog visible for the normal 10s window, then hide it and show the Victory dialog for MATCH_END_DELAY_SECONDS.
// This uses State.match.flow.matchEndDelayToken as a cancellation token so admin actions or unexpected state changes cannot trigger stale delayed UI.
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

    // Final-round exception: re-enable deploy without forcing respawn so Victory dialog is visible.
    if (isLiveRespawnDisabled()) {
        mod.EnableAllPlayerDeploy(true);
    }

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
            const overtimeWinner = resolveOvertimeWinnerAtClockExpiry();
            // Undefined = neutral progress; endRound will fall back to round kills.
            endRound(undefined, undefined, overtimeWinner);
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
    // Optional respawn lock: disable deploy during LIVE rounds when test toggle is on.
    if (isLiveRespawnDisabled()) {
        mod.EnableAllPlayerDeploy(false);
    }
    setSpawnDisabledLiveTextVisibleForAllPlayers(false);
    // Extends the built-in gamemode time limit so the match always has a full hour remaining after each round start.
    const elapsedSeconds = Math.floor(mod.GetMatchTimeElapsed());
    mod.SetGameModeTimeLimit(elapsedSeconds + BACKGROUND_TIME_LIMIT_RESET_SECONDS);
    setRoundStateTextForAllPlayers();
    updateHelpTextVisibilityForAllPlayers();
    setRoundEndDialogVisibleForAllPlayers(false);
    // Round start: release round-end UI lockdown so overtime HUD can prewarm.
    State.round.flow.roundEndUiLockdown = false;
    State.round.lastWinnerTeam = 0;
    State.round.lastEndDetailReason = RoundEndDetailReason.None;

    State.scores.t1RoundKills = 0;
    State.scores.t2RoundKills = 0;

    syncRoundKillsHud(true);
    refreshOvertimeZonesFromMapConfig();
    resetOvertimeFlagState();
    // Round start: decide if tie-breaker is enabled for this round before any flag setup.
    syncTieBreakerEnabledForCurrentRound();
    const helisSingleZone = isHelisOvertimeSingleZoneMode();
    if (isTieBreakerEnabledForRound()) {
        // Round start: preselect the overtime zone so we can track occupancy before activation.
        State.flag.trackingEnabled = selectOvertimeZoneForRound();
        prewarmOvertimeHudForAllPlayers();
        if (helisSingleZone) {
            enterOvertimeVisibleStageSilent();
        } else {
            // Round start: hide all flag markers until the half-time reveal.
            setOvertimeAllFlagVisibility(false);
        }
    } else {
        State.flag.trackingEnabled = false;
        setOvertimeAllFlagVisibility(false);
    }

    ResetRoundClock(getConfiguredRoundLengthSeconds());
    broadcastStringKey(mod.stringkeys.twl.notifications.roundStarted);
}

// Ends the current round and schedules transition to the next state.
// Notes:
// - Round end reason is determined before this call
// - Redeploy delay and next-round scheduling are time-based
// - Match end is handled separately and must not be triggered here

function endRound(_triggerPlayer?: mod.Player, freezeRemainingSeconds?: number, overrideWinnerTeamNum?: TeamID | 0): void {
    if (!isRoundLive()) {
    // Steps:
    // 1) Freeze round-live systems (no further scoring)
    // 2) Schedule redeploy / transition using ROUND_END_REDEPLOY_DELAY_SECONDS
    // 3) If match should end, hand off to match-end path (not round path)

        return;
    }
    const timeExpired = State.round.clock.expiryFired;
    const t1 = State.scores.t1RoundKills;
    const t2 = State.scores.t2RoundKills;
    const overtimeProgress = State.flag.progress;
    const overtimeConfigValid = State.flag.configValid;
    const progressNeutral = !overtimeConfigValid || Math.abs(overtimeProgress - 0.5) <= 0.0001;
    const progressFull = overtimeConfigValid && (overtimeProgress <= 0.0001 || overtimeProgress >= 0.9999);
    const killTargetReached = isRoundKillTargetReached();
    let endDetailReason = RoundEndDetailReason.None;

    if (killTargetReached) {
        endDetailReason = RoundEndDetailReason.Elimination;
    } else if (!timeExpired && progressFull) {
        endDetailReason = RoundEndDetailReason.ObjectiveCaptured;
    } else if (timeExpired && !progressNeutral) {
        endDetailReason = RoundEndDetailReason.TimeOverObjectiveProgress;
    } else if (timeExpired && t1 === t2) {
        endDetailReason = (t1 === 0)
            ? RoundEndDetailReason.TimeOverDrawNoAction
            : RoundEndDetailReason.TimeOverDrawEvenElims;
    } else if (timeExpired) {
        endDetailReason = RoundEndDetailReason.TimeOverKills;
    } else {
        endDetailReason = RoundEndDetailReason.Elimination;
    }
    State.round.lastEndDetailReason = endDetailReason;
    State.round.lastObjectiveProgress = overtimeProgress;

    State.round.phase = RoundPhase.NotReady; // Return to pre-round state; may be overridden to GameOver below.
    setSpawnDisabledLiveTextVisibleForAllPlayers(false);
    // Ready-cycle auto-start / reset:: round ended -> reset all players to NOT READY for the next ready-up cycle.
    resetReadyStateForAllPlayers();

    // Freeze display after ending the round.
    State.round.clock.isPaused = true;
    State.round.clock.pausedRemainingSeconds = Math.max(0, freezeRemainingSeconds !== undefined ? Math.floor(freezeRemainingSeconds) : 0);

    resetOvertimeFlagState();
    // Round end: hide tie-breaker markers until the next round decides eligibility.
    State.flag.tieBreakerEnabledThisRound = false;
    setOvertimeAllFlagVisibility(false);

    const winnerTeamNum = (overrideWinnerTeamNum !== undefined)
        ? overrideWinnerTeamNum
        : (t1 > t2 ? TeamID.Team1 : ((t2 > t1) ? TeamID.Team2 : 0));
    State.round.lastWinnerTeam = winnerTeamNum;
    updateRoundEndDialogForAllPlayers(winnerTeamNum);
    setRoundEndDialogVisibleForAllPlayers(true);
    // Lock overtime UI updates once the round-end dialog is shown.
    State.round.flow.roundEndUiLockdown = true;

    if (winnerTeamNum === TeamID.Team1) {
        const newT1Wins = State.match.winsT1 + 1;
        const newT2Wins = State.match.winsT2;
        setHudWinCountersForAllPlayers(newT1Wins, newT2Wins);
        broadcastStringKey(mod.stringkeys.twl.notifications.roundEndWin, getTeamNameKey(TeamID.Team1), t1, t2);
        broadcastHighlightedStringKey(mod.stringkeys.twl.notifications.roundWins, newT1Wins, newT2Wins);
    } else if (winnerTeamNum === TeamID.Team2) {
        const newT1Wins = State.match.winsT1;
        const newT2Wins = State.match.winsT2 + 1;
        setHudWinCountersForAllPlayers(newT1Wins, newT2Wins);
        broadcastStringKey(mod.stringkeys.twl.notifications.roundEndWin, getTeamNameKey(TeamID.Team2), t2, t1);
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
        true,
        undefined,
        mod.stringkeys.twl.notifications.roundOverRedeploying
    );
    void scheduleRoundEndCleanup(redeployToken);

    // Prepare next round counters after ending the active round.
    State.round.current = Math.floor(State.round.current) + 1;
    setHudRoundCountersForAllPlayers(State.round.current, State.round.max);
    setRoundStateTextForAllPlayers();
    updateHelpTextVisibilityForAllPlayers();
}

//#endregion ----------------- Round Start/End Flow + State --------------------



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
        UI_ADMIN_TIEBREAKER_LABEL_ID,
        UI_ADMIN_TIEBREAKER_MODE_HEADER_ID,
        UI_ADMIN_TIEBREAKER_MODE_LABEL_ID,
        UI_ADMIN_LIVE_RESPAWN_TEXT_ID,

        // Row +/- buttons
        UI_TEST_BUTTON_LEFT_WINS_DEC_ID, UI_TEST_BUTTON_LEFT_WINS_INC_ID,
        UI_TEST_BUTTON_RIGHT_WINS_DEC_ID, UI_TEST_BUTTON_RIGHT_WINS_INC_ID,
        UI_TEST_BUTTON_LEFT_KILLS_DEC_ID, UI_TEST_BUTTON_LEFT_KILLS_INC_ID,
        UI_TEST_BUTTON_RIGHT_KILLS_DEC_ID, UI_TEST_BUTTON_RIGHT_KILLS_INC_ID,
        UI_TEST_BUTTON_ROUND_KILLS_TARGET_DEC_ID, UI_TEST_BUTTON_ROUND_KILLS_TARGET_INC_ID,
        UI_ADMIN_BUTTON_T1_ROUND_KILLS_DEC_ID, UI_ADMIN_BUTTON_T1_ROUND_KILLS_INC_ID,
        UI_ADMIN_BUTTON_T2_ROUND_KILLS_DEC_ID, UI_ADMIN_BUTTON_T2_ROUND_KILLS_INC_ID,
        UI_ADMIN_TIEBREAKER_MODE_DEC_ID, UI_ADMIN_TIEBREAKER_MODE_INC_ID,
        UI_ADMIN_LIVE_RESPAWN_BUTTON_ID,
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
        UI_TEST_BUTTON_POS_DEBUG_ID, UI_TEST_POS_DEBUG_TEXT_ID,
    ];

    for (const baseId of ids) {
        const w = safeFind(baseId + playerId);
        if (w) mod.SetUIWidgetVisible(w, visible);
        const border = safeFind(baseId + playerId + "_BORDER");
        if (border) mod.SetUIWidgetVisible(border, visible);
    }

    for (const letter of ADMIN_TIEBREAKER_OVERRIDE_LETTERS) {
        const buttonBaseId = UI_ADMIN_TIEBREAKER_BUTTON_ID + letter + "_";
        const textBaseId = UI_ADMIN_TIEBREAKER_BUTTON_TEXT_ID + letter + "_";
        const button = safeFind(buttonBaseId + playerId);
        if (button) mod.SetUIWidgetVisible(button, visible);
        const border = safeFind(buttonBaseId + playerId + "_BORDER");
        if (border) mod.SetUIWidgetVisible(border, visible);
        const text = safeFind(textBaseId + playerId);
        if (text) mod.SetUIWidgetVisible(text, visible);
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
        const adminToggleBorder = safeFind(UI_ADMIN_PANEL_BUTTON_ID + playerId + "_BORDER");
        if (adminToggleBorder) mod.DeleteUIWidget(adminToggleBorder);
    }
}

function ensureAdminPanelWidgets(eventPlayer: mod.Player, playerId: number): void {
    const ADMIN_TOGGLE_BUTTON_ID = UI_ADMIN_PANEL_BUTTON_ID + playerId;
    const ADMIN_TOGGLE_LABEL_ID = UI_ADMIN_PANEL_BUTTON_LABEL_ID + playerId;
    const ADMIN_CONTAINER_ID = UI_ADMIN_PANEL_CONTAINER_ID + playerId;

    // Create toggle button if missing.
    let toggleBtn = safeFind(ADMIN_TOGGLE_BUTTON_ID);
    if (!toggleBtn) {
        const toggleBorder = addOutlinedButton(
            ADMIN_TOGGLE_BUTTON_ID,
            ADMIN_PANEL_TOGGLE_OFFSET_X,
            ADMIN_PANEL_TOGGLE_OFFSET_Y,
            ADMIN_PANEL_TOGGLE_WIDTH,
            ADMIN_PANEL_TOGGLE_HEIGHT,
            mod.UIAnchor.TopRight,
            mod.GetUIRoot(),
            eventPlayer
        );
        toggleBtn = mod.FindUIWidgetWithName(ADMIN_TOGGLE_BUTTON_ID, mod.GetUIRoot());
    }

    // Recreate label to guarantee correct anchor/parenting with outlined border.
    const existingToggleLabel = safeFind(ADMIN_TOGGLE_LABEL_ID);
    if (existingToggleLabel) mod.DeleteUIWidget(existingToggleLabel);
    const adminToggleBorder = safeFind(ADMIN_TOGGLE_BUTTON_ID + "_BORDER");
    const toggleLabel = addCenteredButtonText(
        ADMIN_TOGGLE_LABEL_ID,
        ADMIN_PANEL_TOGGLE_WIDTH,
        ADMIN_PANEL_TOGGLE_HEIGHT,
        mod.Message(mod.stringkeys.twl.adminPanel.buttons.panel),
        eventPlayer,
        adminToggleBorder ?? mod.GetUIRoot()
    );
    if (toggleLabel) {
        mod.SetUITextSize(toggleLabel, 12);
        mod.SetUITextColor(toggleLabel, ADMIN_PANEL_BUTTON_TEXT_COLOR);
        mod.SetUIWidgetDepth(toggleLabel, mod.UIDepth.AboveGameUI);
    }

    // Create admin container if missing.
    let adminContainer = safeFind(ADMIN_CONTAINER_ID);
    if (!adminContainer) {
        mod.AddUIContainer(
            ADMIN_CONTAINER_ID,
            mod.CreateVector(ADMIN_PANEL_OFFSET_X, ADMIN_PANEL_OFFSET_Y, 0),
            mod.CreateVector(ADMIN_PANEL_CONTENT_WIDTH + (ADMIN_PANEL_PADDING * 2), ADMIN_PANEL_HEIGHT + (ADMIN_PANEL_PADDING * 2), 0),
            mod.UIAnchor.TopRight,
            mod.GetUIRoot(),
            false,
            10,
            ADMIN_PANEL_BG_COLOR,
            ADMIN_PANEL_BG_ALPHA,
            ADMIN_PANEL_BG_FILL,
            mod.UIDepth.AboveGameUI,
            eventPlayer
        );
        adminContainer = mod.FindUIWidgetWithName(ADMIN_CONTAINER_ID, mod.GetUIRoot());
    }

    // Admin toggle button should exist only while the Ready Up dialog is open.
    // When caching is enabled, we hide/show rather than recreate.
    if (toggleBtn) mod.SetUIWidgetVisible(toggleBtn, true);
    if (toggleLabel) mod.SetUIWidgetVisible(toggleLabel, true);
    const toggleBorder = safeFind(ADMIN_TOGGLE_BUTTON_ID + "_BORDER");
    if (toggleBorder) mod.SetUIWidgetVisible(toggleBorder, true);

    // Default closed on first build; preserve state on reopen.
    if (!State.players.teamSwitchData[playerId]) initTeamSwitchData(eventPlayer);
    if (!State.players.teamSwitchData[playerId].adminPanelBuilt) {
        State.players.teamSwitchData[playerId].adminPanelVisible = false;
        if (adminContainer) mod.SetUIWidgetVisible(adminContainer, false);
        setAdminPanelChildWidgetsVisible(playerId, false);
    } else {
        const visible = State.players.teamSwitchData[playerId].adminPanelVisible;
        if (adminContainer) mod.SetUIWidgetVisible(adminContainer, visible);
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
        const existingBorderTop = safeFind(UI_TEAMSWITCH_BORDER_TOP_ID + playerId);
        if (existingBorderTop) mod.SetUIWidgetVisible(existingBorderTop, true);
        const existingBorderBottom = safeFind(UI_TEAMSWITCH_BORDER_BOTTOM_ID + playerId);
        if (existingBorderBottom) mod.SetUIWidgetVisible(existingBorderBottom, true);
        const existingBorderLeft = safeFind(UI_TEAMSWITCH_BORDER_LEFT_ID + playerId);
        if (existingBorderLeft) mod.SetUIWidgetVisible(existingBorderLeft, true);
        const existingBorderRight = safeFind(UI_TEAMSWITCH_BORDER_RIGHT_ID + playerId);
        if (existingBorderRight) mod.SetUIWidgetVisible(existingBorderRight, true);
        const existingDebug = safeFind(UI_TEAMSWITCH_DEBUG_TIMELIMIT_ID + playerId);
        if (existingDebug) mod.SetUIWidgetVisible(existingDebug, SHOW_DEBUG_TIMELIMIT);
        refreshReadyDialogButtonTextForPid(eventPlayer, playerId, existingBase as mod.UIWidget);
        const existingMapLabel = safeFind(UI_READY_DIALOG_MAP_LABEL_ID + playerId);
        if (existingMapLabel) mod.SetUIWidgetVisible(existingMapLabel, true);
        const existingMapValue = safeFind(UI_READY_DIALOG_MAP_VALUE_ID + playerId);
        if (existingMapValue) mod.SetUIWidgetVisible(existingMapValue, true);
        updateReadyDialogModeConfigForPid(playerId);
        ensureAdminPanelWidgets(eventPlayer, playerId);
        return;
    }

    const CONTAINER_BASE_ID = UI_TEAMSWITCH_CONTAINER_BASE_ID + playerId;
    const BORDER_TOP_ID = UI_TEAMSWITCH_BORDER_TOP_ID + playerId;
    const BORDER_BOTTOM_ID = UI_TEAMSWITCH_BORDER_BOTTOM_ID + playerId;
    const BORDER_LEFT_ID = UI_TEAMSWITCH_BORDER_LEFT_ID + playerId;
    const BORDER_RIGHT_ID = UI_TEAMSWITCH_BORDER_RIGHT_ID + playerId;
    const CONTAINER_BORDER_PADDING = 1;
    const CONTAINER_BORDER_THICKNESS = 2;
    const CONTAINER_BORDER_OVERLAP = 2;
    const CONTAINER_WIDTH = 1300;
    const CONTAINER_HEIGHT = 700;
    const READY_ROSTER_PANEL_WIDTH = 580;
    const READY_ROSTER_PANEL_HEIGHT = 440;
    const READY_ROSTER_PANEL_GAP = 40;
    const READY_ROSTER_PANEL_MARGIN = 40;
    const READY_ROSTER_PANEL_Y = 175;

    //const BUTTON_TEAM1_ID = UI_TEAMSWITCH_BUTTON_TEAM1_ID + playerId; //old button/dead
    //const BUTTON_TEAM1_LABEL_ID = UI_TEAMSWITCH_BUTTON_TEAM1_LABEL_ID + playerId; //old button/dead

    //const BUTTON_TEAM2_ID = UI_TEAMSWITCH_BUTTON_TEAM2_ID + playerId; //old button/dead
    //const BUTTON_TEAM2_LABEL_ID = UI_TEAMSWITCH_BUTTON_TEAM2_LABEL_ID + playerId; //old button/dead

    //const BUTTON_SPECTATE_ID = UI_TEAMSWITCH_BUTTON_SPECTATE_ID + playerId; //old button/dead
    //const BUTTON_SPECTATE_LABEL_ID = UI_TEAMSWITCH_BUTTON_SPECTATE_LABEL_ID + playerId; //old button/dead

    const BUTTON_CANCEL_ID = UI_TEAMSWITCH_BUTTON_CANCEL_ID + playerId;
    const BUTTON_CANCEL_LABEL_ID = UI_TEAMSWITCH_BUTTON_CANCEL_LABEL_ID + playerId;

    //const BUTTON_OPTOUT_ID = UI_TEAMSWITCH_BUTTON_OPTOUT_ID + playerId; //old button/dead
    //const BUTTON_OPTOUT_LABEL_ID = UI_TEAMSWITCH_BUTTON_OPTOUT_LABEL_ID + playerId; //old button/dead

    mod.AddUIContainer(
        CONTAINER_BASE_ID,
        mod.CreateVector(0, 0, 0),
        mod.CreateVector(CONTAINER_WIDTH, CONTAINER_HEIGHT, 0),
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

    const borderHalfWidth = (CONTAINER_WIDTH / 2) + CONTAINER_BORDER_PADDING + (CONTAINER_BORDER_THICKNESS / 2);
    const borderHalfHeight = (CONTAINER_HEIGHT / 2) + CONTAINER_BORDER_PADDING + (CONTAINER_BORDER_THICKNESS / 2);
    const borderLineWidth = CONTAINER_WIDTH + (CONTAINER_BORDER_PADDING * 2) + (CONTAINER_BORDER_OVERLAP * 2);
    const borderLineHeight = CONTAINER_HEIGHT + (CONTAINER_BORDER_PADDING * 2) + (CONTAINER_BORDER_OVERLAP * 2);

    // Top border line
    mod.AddUIContainer(
        BORDER_TOP_ID,
        mod.CreateVector(0, -borderHalfHeight, 0),
        mod.CreateVector(borderLineWidth, CONTAINER_BORDER_THICKNESS, 0),
        mod.UIAnchor.Center,
        CONTAINER_BASE,
        true,
        0,
        READY_DIALOG_BORDER_COLOR,
        1,
        mod.UIBgFill.Solid,
        mod.UIDepth.AboveGameUI,
        eventPlayer
    );

    // Bottom border line
    mod.AddUIContainer(
        BORDER_BOTTOM_ID,
        mod.CreateVector(0, borderHalfHeight, 0),
        mod.CreateVector(borderLineWidth, CONTAINER_BORDER_THICKNESS, 0),
        mod.UIAnchor.Center,
        CONTAINER_BASE,
        true,
        0,
        READY_DIALOG_BORDER_COLOR,
        1,
        mod.UIBgFill.Solid,
        mod.UIDepth.AboveGameUI,
        eventPlayer
    );

    // Left border line
    mod.AddUIContainer(
        BORDER_LEFT_ID,
        mod.CreateVector(-borderHalfWidth, 0, 0),
        mod.CreateVector(CONTAINER_BORDER_THICKNESS, borderLineHeight, 0),
        mod.UIAnchor.Center,
        CONTAINER_BASE,
        true,
        0,
        READY_DIALOG_BORDER_COLOR,
        1,
        mod.UIBgFill.Solid,
        mod.UIDepth.AboveGameUI,
        eventPlayer
    );

    // Right border line
    mod.AddUIContainer(
        BORDER_RIGHT_ID,
        mod.CreateVector(borderHalfWidth, 0, 0),
        mod.CreateVector(CONTAINER_BORDER_THICKNESS, borderLineHeight, 0),
        mod.UIAnchor.Center,
        CONTAINER_BASE,
        true,
        0,
        READY_DIALOG_BORDER_COLOR,
        1,
        mod.UIBgFill.Solid,
        mod.UIDepth.AboveGameUI,
        eventPlayer
    );

    //#endregion -------------------- UI - Ready Up Dialog (construction) --------------------



    //#region -------------------- Ready Dialog (Roster UI) -  (header + team rosters) --------------------

    // Header rows (string-backed for easy iteration).
    const READY_HEADER_ID = UI_READY_DIALOG_HEADER_ID + playerId;
    const READY_HEADER2_ID = UI_READY_DIALOG_HEADER2_ID + playerId;
    const READY_HEADER3_ID = UI_READY_DIALOG_HEADER3_ID + playerId;
    const READY_HEADER4_ID = UI_READY_DIALOG_HEADER4_ID + playerId;
    const READY_HEADER5_ID = UI_READY_DIALOG_HEADER5_ID + playerId;
    const READY_HEADER6_ID = UI_READY_DIALOG_HEADER6_ID + playerId;

    mod.AddUIText(
        READY_HEADER_ID,
        //If Anchored at TopLeft, X is left offset - increase to move right, Y is down offset - increase to move down
        mod.CreateVector(-11, -5, 0),
        mod.CreateVector(900, 22, 0),
        mod.UIAnchor.TopLeft,
        mod.Message(mod.stringkeys.twl.readyDialog.header),
        eventPlayer
    );
    const READY_HEADER = mod.FindUIWidgetWithName(READY_HEADER_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(READY_HEADER, 0);
    mod.SetUITextSize(READY_HEADER, 20);
    applyReadyDialogLabelTextColor(READY_HEADER);
    mod.SetUIWidgetParent(READY_HEADER, CONTAINER_BASE);

    mod.AddUIText(
        READY_HEADER2_ID,
        mod.CreateVector(-11, 19, 0),
        mod.CreateVector(900, 20, 0),
        mod.UIAnchor.TopLeft,
        mod.Message(mod.stringkeys.twl.readyDialog.header2),
        eventPlayer
    );
    const READY_HEADER2 = mod.FindUIWidgetWithName(READY_HEADER2_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(READY_HEADER2, 0);
    mod.SetUITextSize(READY_HEADER2, 16);
    applyReadyDialogLabelTextColor(READY_HEADER2);
    mod.SetUIWidgetParent(READY_HEADER2, CONTAINER_BASE);

    mod.AddUIText(
        READY_HEADER3_ID,
        mod.CreateVector(-11, 39, 0),
        mod.CreateVector(900, 20, 0),
        mod.UIAnchor.TopLeft,
        mod.Message(mod.stringkeys.twl.readyDialog.header3),
        eventPlayer
    );
    const READY_HEADER3 = mod.FindUIWidgetWithName(READY_HEADER3_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(READY_HEADER3, 0);
    mod.SetUITextSize(READY_HEADER3, 16);
    applyReadyDialogLabelTextColor(READY_HEADER3);
    mod.SetUIWidgetParent(READY_HEADER3, CONTAINER_BASE);

    // Header 4 preserves the same vertical spacing as header 2 -> header 3.
    mod.AddUIText(
        READY_HEADER4_ID,
        mod.CreateVector(-11, 59, 0),
        mod.CreateVector(900, 20, 0),
        mod.UIAnchor.TopLeft,
        mod.Message(mod.stringkeys.twl.readyDialog.header4, Math.floor(VEHICLE_SPAWNER_KEEP_ALIVE_ABANDON_RADIUS)),
        eventPlayer
    );
    const READY_HEADER4 = mod.FindUIWidgetWithName(READY_HEADER4_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(READY_HEADER4, 0);
    mod.SetUITextSize(READY_HEADER4, 16);
    applyReadyDialogLabelTextColor(READY_HEADER4);
    mod.SetUIWidgetParent(READY_HEADER4, CONTAINER_BASE);

    mod.AddUIText(
        READY_HEADER5_ID,
        mod.CreateVector(-11, 79, 0),
        mod.CreateVector(900, 20, 0),
        mod.UIAnchor.TopLeft,
        mod.Message(mod.stringkeys.twl.readyDialog.header5),
        eventPlayer
    );
    const READY_HEADER5 = mod.FindUIWidgetWithName(READY_HEADER5_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(READY_HEADER5, 0);
    mod.SetUITextSize(READY_HEADER5, 16);
    applyReadyDialogLabelTextColor(READY_HEADER5);
    mod.SetUIWidgetParent(READY_HEADER5, CONTAINER_BASE);

    mod.AddUIText(
        READY_HEADER6_ID,
        mod.CreateVector(-11, 99, 0),
        mod.CreateVector(900, 20, 0),
        mod.UIAnchor.TopLeft,
        mod.Message(mod.stringkeys.twl.readyDialog.header6),
        eventPlayer
    );
    const READY_HEADER6 = mod.FindUIWidgetWithName(READY_HEADER6_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(READY_HEADER6, 0);
    mod.SetUITextSize(READY_HEADER6, 16);
    applyReadyDialogLabelTextColor(READY_HEADER6);
    mod.SetUIWidgetParent(READY_HEADER6, CONTAINER_BASE);

    const READY_MAP_LABEL_ID = UI_READY_DIALOG_MAP_LABEL_ID + playerId;
    const READY_MAP_VALUE_ID = UI_READY_DIALOG_MAP_VALUE_ID + playerId;
    const mapLabelX = ADMIN_PANEL_OFFSET_X + ADMIN_PANEL_TOGGLE_WIDTH + 70;
    const mapValueX = ADMIN_PANEL_OFFSET_X + ADMIN_PANEL_TOGGLE_WIDTH - 63; //-X moves right
    const mapLabelY = ADMIN_PANEL_OFFSET_Y;
    const mapLabelSizeX = 60;
    const mapValueSizeX = 170;

    mod.AddUIText(
        READY_MAP_LABEL_ID,
        mod.CreateVector(mapLabelX, mapLabelY, 0),
        mod.CreateVector(mapLabelSizeX, 20, 0),
        mod.UIAnchor.TopRight,
        mod.Message(mod.stringkeys.twl.readyDialog.mapLabel),
        eventPlayer
    );
    const READY_MAP_LABEL = mod.FindUIWidgetWithName(READY_MAP_LABEL_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(READY_MAP_LABEL, 0);
    mod.SetUITextSize(READY_MAP_LABEL, 12);
    applyReadyDialogLabelTextColor(READY_MAP_LABEL);
    mod.SetUIWidgetParent(READY_MAP_LABEL, mod.GetUIRoot());

    mod.AddUIText(
        READY_MAP_VALUE_ID,
        mod.CreateVector(mapValueX, mapLabelY, 0),
        mod.CreateVector(mapValueSizeX, 20, 0),
        mod.UIAnchor.TopRight,
        mod.Message(getMapNameKey(ACTIVE_MAP_KEY)),
        eventPlayer
    );
    const READY_MAP_VALUE = mod.FindUIWidgetWithName(READY_MAP_VALUE_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(READY_MAP_VALUE, 0);
    mod.SetUITextSize(READY_MAP_VALUE, 12);
    applyReadyDialogLabelTextColor(READY_MAP_VALUE);
    mod.SetUIWidgetParent(READY_MAP_VALUE, mod.GetUIRoot());
    updateReadyDialogMapLabelForPid(playerId);

    // Best-of rounds control (top-right): minus button, dynamic label, plus button.
    const BESTOF_DEC_ID = UI_READY_DIALOG_BESTOF_DEC_ID + playerId;
    const BESTOF_DEC_LABEL_ID = UI_READY_DIALOG_BESTOF_DEC_LABEL_ID + playerId;
    const BESTOF_LABEL_ID = UI_READY_DIALOG_BESTOF_LABEL_ID + playerId;
    const BESTOF_INC_ID = UI_READY_DIALOG_BESTOF_INC_ID + playerId;
    const BESTOF_INC_LABEL_ID = UI_READY_DIALOG_BESTOF_INC_LABEL_ID + playerId;

    const bestOfY = -3;
    const bestOfButtonSizeX = READY_DIALOG_SMALL_BUTTON_WIDTH;
    const bestOfButtonSizeY = READY_DIALOG_SMALL_BUTTON_HEIGHT;
    const bestOfLabelSizeX = 170;
    const bestOfLabelSizeY = 24;
    const leftSectionGapX = READY_DIALOG_SMALL_BUTTON_WIDTH + 12;
    const leftSectionButtonSpread = 18;
    const leftSectionShiftX = 128 + leftSectionGapX + leftSectionButtonSpread;
    const leftSectionLeftButtonX = 125 + leftSectionShiftX + leftSectionButtonSpread;
    const leftSectionRightButtonX = -3 + leftSectionShiftX - leftSectionButtonSpread;
    const leftSectionValueX = -58 + leftSectionShiftX;
    const leftSectionLabelGap = 4;
    const leftSectionLabelX = leftSectionLeftButtonX + bestOfButtonSizeX + leftSectionLabelGap;
    const leftSectionLabelWidth = 110;
    const leftSectionValueWidth = 200;
    const leftSectionRowGap = bestOfButtonSizeY + 6;
    const rightSectionRightButtonX = -3;
    const confirmButtonWidth = READY_DIALOG_CONFIRM_BUTTON_WIDTH;
    const resetButtonWidth = READY_DIALOG_RESET_BUTTON_WIDTH;
    const resetButtonX = rightSectionRightButtonX + READY_DIALOG_RESET_BUTTON_OFFSET_X;
    const confirmButtonX = resetButtonX + resetButtonWidth + READY_DIALOG_CONFIRM_BUTTON_GAP;

    const GAME_MODE_LABEL_ID = UI_READY_DIALOG_MODE_GAME_LABEL_ID + playerId;
    const GAME_MODE_DEC_ID = UI_READY_DIALOG_MODE_GAME_DEC_ID + playerId;
    const GAME_MODE_DEC_LABEL_ID = UI_READY_DIALOG_MODE_GAME_DEC_LABEL_ID + playerId;
    const GAME_MODE_VALUE_ID = UI_READY_DIALOG_MODE_GAME_VALUE_ID + playerId;
    const GAME_MODE_INC_ID = UI_READY_DIALOG_MODE_GAME_INC_ID + playerId;
    const GAME_MODE_INC_LABEL_ID = UI_READY_DIALOG_MODE_GAME_INC_LABEL_ID + playerId;

    const MODE_SETTINGS_LABEL_ID = UI_READY_DIALOG_MODE_SETTINGS_LABEL_ID + playerId;
    const MODE_SETTINGS_DEC_ID = UI_READY_DIALOG_MODE_SETTINGS_DEC_ID + playerId;
    const MODE_SETTINGS_DEC_LABEL_ID = UI_READY_DIALOG_MODE_SETTINGS_DEC_LABEL_ID + playerId;
    const MODE_SETTINGS_VALUE_ID = UI_READY_DIALOG_MODE_SETTINGS_VALUE_ID + playerId;
    const MODE_SETTINGS_INC_ID = UI_READY_DIALOG_MODE_SETTINGS_INC_ID + playerId;
    const MODE_SETTINGS_INC_LABEL_ID = UI_READY_DIALOG_MODE_SETTINGS_INC_LABEL_ID + playerId;

    const VEHICLES_T1_LABEL_ID = UI_READY_DIALOG_MODE_VEHICLES_T1_LABEL_ID + playerId;
    const VEHICLES_T1_DEC_ID = UI_READY_DIALOG_MODE_VEHICLES_T1_DEC_ID + playerId;
    const VEHICLES_T1_DEC_LABEL_ID = UI_READY_DIALOG_MODE_VEHICLES_T1_DEC_LABEL_ID + playerId;
    const VEHICLES_T1_VALUE_ID = UI_READY_DIALOG_MODE_VEHICLES_T1_VALUE_ID + playerId;
    const VEHICLES_T1_INC_ID = UI_READY_DIALOG_MODE_VEHICLES_T1_INC_ID + playerId;
    const VEHICLES_T1_INC_LABEL_ID = UI_READY_DIALOG_MODE_VEHICLES_T1_INC_LABEL_ID + playerId;

    const VEHICLES_T2_LABEL_ID = UI_READY_DIALOG_MODE_VEHICLES_T2_LABEL_ID + playerId;
    const VEHICLES_T2_DEC_ID = UI_READY_DIALOG_MODE_VEHICLES_T2_DEC_ID + playerId;
    const VEHICLES_T2_DEC_LABEL_ID = UI_READY_DIALOG_MODE_VEHICLES_T2_DEC_LABEL_ID + playerId;
    const VEHICLES_T2_VALUE_ID = UI_READY_DIALOG_MODE_VEHICLES_T2_VALUE_ID + playerId;
    const VEHICLES_T2_INC_ID = UI_READY_DIALOG_MODE_VEHICLES_T2_INC_ID + playerId;
    const VEHICLES_T2_INC_LABEL_ID = UI_READY_DIALOG_MODE_VEHICLES_T2_INC_LABEL_ID + playerId;

    const MODE_CONFIRM_ID = UI_READY_DIALOG_MODE_CONFIRM_ID + playerId;
    const MODE_CONFIRM_LABEL_ID = UI_READY_DIALOG_MODE_CONFIRM_LABEL_ID + playerId;
    const MODE_RESET_ID = UI_READY_DIALOG_MODE_RESET_ID + playerId;
    const MODE_RESET_LABEL_ID = UI_READY_DIALOG_MODE_RESET_LABEL_ID + playerId;

    const gameModeY = bestOfY;
    const modeSettingsY = gameModeY + leftSectionRowGap;
    const vehiclesT1Y = modeSettingsY + leftSectionRowGap;
    const vehiclesT2Y = vehiclesT1Y + leftSectionRowGap;
    const confirmY = vehiclesT2Y + leftSectionRowGap + 4;

    addRightAlignedLabel(
        GAME_MODE_LABEL_ID,
        leftSectionLabelX,
        gameModeY,
        leftSectionLabelWidth,
        bestOfLabelSizeY,
        mod.UIAnchor.TopRight,
        mod.Message(mod.stringkeys.twl.readyDialog.gameModeLabel),
        eventPlayer,
        CONTAINER_BASE,
        12
    );

    const gameModeDecBorder = addOutlinedButton(
        GAME_MODE_DEC_ID,
        leftSectionLeftButtonX,
        gameModeY,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        CONTAINER_BASE,
        eventPlayer
    );
    const GAME_MODE_DEC_LABEL = addCenteredButtonText(
        GAME_MODE_DEC_LABEL_ID,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.ui.left),
        eventPlayer,
        gameModeDecBorder ?? CONTAINER_BASE
    );
    if (GAME_MODE_DEC_LABEL) {
        mod.SetUITextSize(GAME_MODE_DEC_LABEL, 14);
    }

    mod.AddUIText(
        GAME_MODE_VALUE_ID,
        mod.CreateVector(leftSectionValueX, gameModeY, 0),
        mod.CreateVector(leftSectionValueWidth, bestOfLabelSizeY, 0),
        mod.UIAnchor.TopRight,
        mod.Message(State.round.modeConfig.gameMode),
        eventPlayer
    );
    const GAME_MODE_VALUE = mod.FindUIWidgetWithName(GAME_MODE_VALUE_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(GAME_MODE_VALUE, 0);
    mod.SetUITextSize(GAME_MODE_VALUE, 12);
    applyReadyDialogLabelTextColor(GAME_MODE_VALUE);
    mod.SetUIWidgetParent(GAME_MODE_VALUE, CONTAINER_BASE);

    const gameModeIncBorder = addOutlinedButton(
        GAME_MODE_INC_ID,
        leftSectionRightButtonX,
        gameModeY,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        CONTAINER_BASE,
        eventPlayer
    );
    const GAME_MODE_INC_LABEL = addCenteredButtonText(
        GAME_MODE_INC_LABEL_ID,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.ui.right),
        eventPlayer,
        gameModeIncBorder ?? CONTAINER_BASE
    );
    if (GAME_MODE_INC_LABEL) {
        mod.SetUITextSize(GAME_MODE_INC_LABEL, 14);
    }

    addRightAlignedLabel(
        MODE_SETTINGS_LABEL_ID,
        leftSectionLabelX,
        modeSettingsY,
        leftSectionLabelWidth,
        bestOfLabelSizeY,
        mod.UIAnchor.TopRight,
        mod.Message(mod.stringkeys.twl.readyDialog.modeSettingsLabel),
        eventPlayer,
        CONTAINER_BASE,
        12
    );

    const modeSettingsDecBorder = addOutlinedButton(
        MODE_SETTINGS_DEC_ID,
        leftSectionLeftButtonX,
        modeSettingsY,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        CONTAINER_BASE,
        eventPlayer
    );
    const MODE_SETTINGS_DEC_LABEL = addCenteredButtonText(
        MODE_SETTINGS_DEC_LABEL_ID,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.ui.left),
        eventPlayer,
        modeSettingsDecBorder ?? CONTAINER_BASE
    );
    if (MODE_SETTINGS_DEC_LABEL) {
        mod.SetUITextSize(MODE_SETTINGS_DEC_LABEL, 14);
    }

    mod.AddUIText(
        MODE_SETTINGS_VALUE_ID,
        mod.CreateVector(leftSectionValueX, modeSettingsY, 0),
        mod.CreateVector(leftSectionValueWidth, bestOfLabelSizeY, 0),
        mod.UIAnchor.TopRight,
        mod.Message(mod.stringkeys.twl.readyDialog.modeSettingAircraftCeilingFormat, Math.floor(State.round.modeConfig.aircraftCeiling)),
        eventPlayer
    );
    const MODE_SETTINGS_VALUE = mod.FindUIWidgetWithName(MODE_SETTINGS_VALUE_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(MODE_SETTINGS_VALUE, 0);
    mod.SetUITextSize(MODE_SETTINGS_VALUE, 12);
    applyReadyDialogLabelTextColor(MODE_SETTINGS_VALUE);
    mod.SetUIWidgetParent(MODE_SETTINGS_VALUE, CONTAINER_BASE);

    const modeSettingsIncBorder = addOutlinedButton(
        MODE_SETTINGS_INC_ID,
        leftSectionRightButtonX,
        modeSettingsY,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        CONTAINER_BASE,
        eventPlayer
    );
    const MODE_SETTINGS_INC_LABEL = addCenteredButtonText(
        MODE_SETTINGS_INC_LABEL_ID,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.ui.right),
        eventPlayer,
        modeSettingsIncBorder ?? CONTAINER_BASE
    );
    if (MODE_SETTINGS_INC_LABEL) {
        mod.SetUITextSize(MODE_SETTINGS_INC_LABEL, 14);
    }

    addRightAlignedLabel(
        VEHICLES_T1_LABEL_ID,
        leftSectionLabelX,
        vehiclesT1Y,
        leftSectionLabelWidth,
        bestOfLabelSizeY,
        mod.UIAnchor.TopRight,
        mod.Message(mod.stringkeys.twl.readyDialog.vehiclesLabelFormat, getTeamNameKey(TeamID.Team1)),
        eventPlayer,
        CONTAINER_BASE,
        12
    );

    const vehiclesT1DecBorder = addOutlinedButton(
        VEHICLES_T1_DEC_ID,
        leftSectionLeftButtonX,
        vehiclesT1Y,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        CONTAINER_BASE,
        eventPlayer
    );
    const VEHICLES_T1_DEC_LABEL = addCenteredButtonText(
        VEHICLES_T1_DEC_LABEL_ID,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.ui.left),
        eventPlayer,
        vehiclesT1DecBorder ?? CONTAINER_BASE
    );
    if (VEHICLES_T1_DEC_LABEL) {
        mod.SetUITextSize(VEHICLES_T1_DEC_LABEL, 14);
    }

    mod.AddUIText(
        VEHICLES_T1_VALUE_ID,
        mod.CreateVector(leftSectionValueX, vehiclesT1Y, 0),
        mod.CreateVector(leftSectionValueWidth, bestOfLabelSizeY, 0),
        mod.UIAnchor.TopRight,
        mod.Message(State.round.modeConfig.vehiclesT1),
        eventPlayer
    );
    const VEHICLES_T1_VALUE = mod.FindUIWidgetWithName(VEHICLES_T1_VALUE_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(VEHICLES_T1_VALUE, 0);
    mod.SetUITextSize(VEHICLES_T1_VALUE, 12);
    applyReadyDialogLabelTextColor(VEHICLES_T1_VALUE);
    mod.SetUIWidgetParent(VEHICLES_T1_VALUE, CONTAINER_BASE);

    const vehiclesT1IncBorder = addOutlinedButton(
        VEHICLES_T1_INC_ID,
        leftSectionRightButtonX,
        vehiclesT1Y,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        CONTAINER_BASE,
        eventPlayer
    );
    const VEHICLES_T1_INC_LABEL = addCenteredButtonText(
        VEHICLES_T1_INC_LABEL_ID,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.ui.right),
        eventPlayer,
        vehiclesT1IncBorder ?? CONTAINER_BASE
    );
    if (VEHICLES_T1_INC_LABEL) {
        mod.SetUITextSize(VEHICLES_T1_INC_LABEL, 14);
    }

    addRightAlignedLabel(
        VEHICLES_T2_LABEL_ID,
        leftSectionLabelX,
        vehiclesT2Y,
        leftSectionLabelWidth,
        bestOfLabelSizeY,
        mod.UIAnchor.TopRight,
        mod.Message(mod.stringkeys.twl.readyDialog.vehiclesLabelFormat, getTeamNameKey(TeamID.Team2)),
        eventPlayer,
        CONTAINER_BASE,
        12
    );

    const vehiclesT2DecBorder = addOutlinedButton(
        VEHICLES_T2_DEC_ID,
        leftSectionLeftButtonX,
        vehiclesT2Y,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        CONTAINER_BASE,
        eventPlayer
    );
    const VEHICLES_T2_DEC_LABEL = addCenteredButtonText(
        VEHICLES_T2_DEC_LABEL_ID,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.ui.left),
        eventPlayer,
        vehiclesT2DecBorder ?? CONTAINER_BASE
    );
    if (VEHICLES_T2_DEC_LABEL) {
        mod.SetUITextSize(VEHICLES_T2_DEC_LABEL, 14);
    }

    mod.AddUIText(
        VEHICLES_T2_VALUE_ID,
        mod.CreateVector(leftSectionValueX, vehiclesT2Y, 0),
        mod.CreateVector(leftSectionValueWidth, bestOfLabelSizeY, 0),
        mod.UIAnchor.TopRight,
        mod.Message(State.round.modeConfig.vehiclesT2),
        eventPlayer
    );
    const VEHICLES_T2_VALUE = mod.FindUIWidgetWithName(VEHICLES_T2_VALUE_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(VEHICLES_T2_VALUE, 0);
    mod.SetUITextSize(VEHICLES_T2_VALUE, 12);
    applyReadyDialogLabelTextColor(VEHICLES_T2_VALUE);
    mod.SetUIWidgetParent(VEHICLES_T2_VALUE, CONTAINER_BASE);

    const vehiclesT2IncBorder = addOutlinedButton(
        VEHICLES_T2_INC_ID,
        leftSectionRightButtonX,
        vehiclesT2Y,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        CONTAINER_BASE,
        eventPlayer
    );
    const VEHICLES_T2_INC_LABEL = addCenteredButtonText(
        VEHICLES_T2_INC_LABEL_ID,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.ui.right),
        eventPlayer,
        vehiclesT2IncBorder ?? CONTAINER_BASE
    );
    if (VEHICLES_T2_INC_LABEL) {
        mod.SetUITextSize(VEHICLES_T2_INC_LABEL, 14);
    }

    const confirmBorder = addOutlinedButton(
        MODE_CONFIRM_ID,
        confirmButtonX,
        confirmY,
        confirmButtonWidth,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        CONTAINER_BASE,
        eventPlayer
    );
    const MODE_CONFIRM_LABEL = addCenteredButtonText(
        MODE_CONFIRM_LABEL_ID,
        confirmButtonWidth,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.readyDialog.confirmSettingsLabel),
        eventPlayer,
        confirmBorder ?? CONTAINER_BASE
    );
    if (MODE_CONFIRM_LABEL) {
        mod.SetUITextSize(MODE_CONFIRM_LABEL, 12);
    }

    const resetBorder = addOutlinedButton(
        MODE_RESET_ID,
        resetButtonX,
        confirmY,
        resetButtonWidth,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        CONTAINER_BASE,
        eventPlayer
    );
    const MODE_RESET_LABEL = addCenteredButtonText(
        MODE_RESET_LABEL_ID,
        resetButtonWidth,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.readyDialog.resetSettingsLabel),
        eventPlayer,
        resetBorder ?? CONTAINER_BASE
    );
    if (MODE_RESET_LABEL) {
        mod.SetUITextSize(MODE_RESET_LABEL, 12);
    }

    // Best-of: minus button (left of label)
    const bestOfDecBorder = addOutlinedButton(
        BESTOF_DEC_ID,
        125,
        bestOfY,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        CONTAINER_BASE,
        eventPlayer
    );

    // Best-of: minus label (left of label)
    const BESTOF_DEC_LABEL = addCenteredButtonText(
        BESTOF_DEC_LABEL_ID,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.ui.minus),
        eventPlayer,
        bestOfDecBorder ?? CONTAINER_BASE
    );
    if (BESTOF_DEC_LABEL) {
        mod.SetUITextSize(BESTOF_DEC_LABEL, 14);
    }

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
    applyReadyDialogLabelTextColor(BESTOF_LABEL);
    mod.SetUIWidgetParent(BESTOF_LABEL, CONTAINER_BASE);

    // Best-of: plus button (right of label)
    const bestOfIncBorder = addOutlinedButton(
        BESTOF_INC_ID,
        -3,
        bestOfY,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        CONTAINER_BASE,
        eventPlayer
    );

    // Best-of: plus label (right of label)
    const BESTOF_INC_LABEL = addCenteredButtonText(
        BESTOF_INC_LABEL_ID,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.ui.plus),
        eventPlayer,
        bestOfIncBorder ?? CONTAINER_BASE
    );
    if (BESTOF_INC_LABEL) {
        mod.SetUITextSize(BESTOF_INC_LABEL, 14);
    }
    updateBestOfRoundsLabelForPid(playerId);

    // Matchup preset control (below Best-of): minus button, dynamic label, plus button.
    const MATCHUP_DEC_ID = UI_READY_DIALOG_MATCHUP_DEC_ID + playerId;
    const MATCHUP_DEC_LABEL_ID = UI_READY_DIALOG_MATCHUP_DEC_LABEL_ID + playerId;
    const MATCHUP_LABEL_ID = UI_READY_DIALOG_MATCHUP_LABEL_ID + playerId;
    const MATCHUP_INC_ID = UI_READY_DIALOG_MATCHUP_INC_ID + playerId;
    const MATCHUP_INC_LABEL_ID = UI_READY_DIALOG_MATCHUP_INC_LABEL_ID + playerId;
    const MATCHUP_MINPLAYERS_ID = UI_READY_DIALOG_MATCHUP_MINPLAYERS_ID + playerId;
    const MATCHUP_MINPLAYERS_TOTAL_ID = UI_READY_DIALOG_MATCHUP_MINPLAYERS_TOTAL_ID + playerId;
    const MATCHUP_KILLSTARGET_ID = UI_READY_DIALOG_MATCHUP_KILLSTARGET_ID + playerId;

    const matchupY = bestOfY + bestOfButtonSizeY + 4;
    const matchupLabelSizeX = bestOfLabelSizeX + 30;
    const matchupLabelOffsetX = -72;

    // Matchup: minus button (left of label)
    const matchupDecBorder = addOutlinedButton(
        MATCHUP_DEC_ID,
        125,
        matchupY,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        CONTAINER_BASE,
        eventPlayer
    );

    // Matchup: minus label
    const MATCHUP_DEC_LABEL = addCenteredButtonText(
        MATCHUP_DEC_LABEL_ID,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.ui.minus),
        eventPlayer,
        matchupDecBorder ?? CONTAINER_BASE
    );
    if (MATCHUP_DEC_LABEL) {
        mod.SetUITextSize(MATCHUP_DEC_LABEL, 14);
    }

    // Matchup: dynamic label
    mod.AddUIText(
        MATCHUP_LABEL_ID,
        mod.CreateVector(matchupLabelOffsetX, matchupY, 0),
        mod.CreateVector(matchupLabelSizeX, bestOfLabelSizeY, 0),
        mod.UIAnchor.TopRight,
        mod.Message(mod.stringkeys.twl.readyDialog.matchupFormat, 1, 0),
        eventPlayer
    );
    const MATCHUP_LABEL = mod.FindUIWidgetWithName(MATCHUP_LABEL_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(MATCHUP_LABEL, 0);
    mod.SetUITextSize(MATCHUP_LABEL, 14);
    applyReadyDialogLabelTextColor(MATCHUP_LABEL);
    mod.SetUIWidgetParent(MATCHUP_LABEL, CONTAINER_BASE);

    // Matchup: plus button (right of label)
    const matchupIncBorder = addOutlinedButton(
        MATCHUP_INC_ID,
        -3,
        matchupY,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        CONTAINER_BASE,
        eventPlayer
    );

    // Matchup: plus label (right of label)
    const MATCHUP_INC_LABEL = addCenteredButtonText(
        MATCHUP_INC_LABEL_ID,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.ui.plus),
        eventPlayer,
        matchupIncBorder ?? CONTAINER_BASE
    );
    if (MATCHUP_INC_LABEL) {
        mod.SetUITextSize(MATCHUP_INC_LABEL, 14);
    }

    // Matchup readouts (below matchup buttons)
    mod.AddUIText(
        MATCHUP_KILLSTARGET_ID,
        mod.CreateVector(-42 - (bestOfLabelSizeX + 80) / 4, matchupY + bestOfButtonSizeY - 1, 0),
        mod.CreateVector(bestOfLabelSizeX + 80, 16, 0),
        mod.UIAnchor.TopRight,
        mod.Message(mod.stringkeys.twl.readyDialog.targetKillsToWinFormat, State.round.killsTarget),
        eventPlayer
    );
    const MATCHUP_KILLSTARGET = mod.FindUIWidgetWithName(MATCHUP_KILLSTARGET_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(MATCHUP_KILLSTARGET, 0);
    mod.SetUITextSize(MATCHUP_KILLSTARGET, 12);
    applyReadyDialogLabelTextColor(MATCHUP_KILLSTARGET);
    mod.SetUIWidgetParent(MATCHUP_KILLSTARGET, CONTAINER_BASE);

    const PLAYERS_DEC_ID = UI_READY_DIALOG_MINPLAYERS_DEC_ID + playerId;
    const PLAYERS_DEC_LABEL_ID = UI_READY_DIALOG_MINPLAYERS_DEC_LABEL_ID + playerId;
    const PLAYERS_INC_ID = UI_READY_DIALOG_MINPLAYERS_INC_ID + playerId;
    const PLAYERS_INC_LABEL_ID = UI_READY_DIALOG_MINPLAYERS_INC_LABEL_ID + playerId;
    const playersY = matchupY + bestOfButtonSizeY + 20;
    const playersLabelSizeX = bestOfLabelSizeX + 30;
    const playersLabelOffsetX = -72;
    const playersLabelOffsetY = 4;

    const playersDecBorder = addOutlinedButton(
        PLAYERS_DEC_ID,
        125,
        playersY,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        CONTAINER_BASE,
        eventPlayer
    );

    const PLAYERS_DEC_LABEL = addCenteredButtonText(
        PLAYERS_DEC_LABEL_ID,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.ui.minus),
        eventPlayer,
        playersDecBorder ?? CONTAINER_BASE
    );
    if (PLAYERS_DEC_LABEL) {
        mod.SetUITextSize(PLAYERS_DEC_LABEL, 14);
    }

    const autoStartCounts = getAutoStartMinPlayerCounts();
    mod.AddUIText(
        MATCHUP_MINPLAYERS_ID,
        mod.CreateVector(playersLabelOffsetX, playersY + playersLabelOffsetY, 0),
        mod.CreateVector(playersLabelSizeX, 16, 0),
        mod.UIAnchor.TopRight,
        mod.Message(mod.stringkeys.twl.readyDialog.playersFormat, autoStartCounts.left, autoStartCounts.right),
        eventPlayer
    );
    const MATCHUP_MINPLAYERS = mod.FindUIWidgetWithName(MATCHUP_MINPLAYERS_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(MATCHUP_MINPLAYERS, 0);
    mod.SetUITextSize(MATCHUP_MINPLAYERS, 14);
    applyReadyDialogLabelTextColor(MATCHUP_MINPLAYERS);
    mod.SetUIWidgetParent(MATCHUP_MINPLAYERS, CONTAINER_BASE);

    const playersTotalY = playersY + bestOfButtonSizeY - 1;
    mod.AddUIText(
        MATCHUP_MINPLAYERS_TOTAL_ID,
        mod.CreateVector(-42 - (bestOfLabelSizeX + 80) / 4, playersTotalY, 0),
        mod.CreateVector(bestOfLabelSizeX + 80, 16, 0),
        mod.UIAnchor.TopRight,
        mod.Message(mod.stringkeys.twl.readyDialog.minPlayersToStartFormat, autoStartCounts.total),
        eventPlayer
    );
    const MATCHUP_MINPLAYERS_TOTAL = mod.FindUIWidgetWithName(MATCHUP_MINPLAYERS_TOTAL_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(MATCHUP_MINPLAYERS_TOTAL, 0);
    mod.SetUITextSize(MATCHUP_MINPLAYERS_TOTAL, 12);
    applyReadyDialogLabelTextColor(MATCHUP_MINPLAYERS_TOTAL);
    mod.SetUIWidgetParent(MATCHUP_MINPLAYERS_TOTAL, CONTAINER_BASE);

    const playersIncBorder = addOutlinedButton(
        PLAYERS_INC_ID,
        -3,
        playersY,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.UIAnchor.TopRight,
        CONTAINER_BASE,
        eventPlayer
    );

    const PLAYERS_INC_LABEL = addCenteredButtonText(
        PLAYERS_INC_LABEL_ID,
        bestOfButtonSizeX,
        bestOfButtonSizeY,
        mod.Message(mod.stringkeys.twl.ui.plus),
        eventPlayer,
        playersIncBorder ?? CONTAINER_BASE
    );
    if (PLAYERS_INC_LABEL) {
        mod.SetUITextSize(PLAYERS_INC_LABEL, 14);
    }

    updateMatchupLabelForPid(playerId);
    updateMatchupReadoutsForPid(playerId);
    updateReadyDialogModeConfigForPid(playerId);

    // Left and right roster containers (children are parented to these containers).
    const T1_CONTAINER_ID = UI_READY_DIALOG_TEAM1_CONTAINER_ID + playerId;
    const T2_CONTAINER_ID = UI_READY_DIALOG_TEAM2_CONTAINER_ID + playerId;

    mod.AddUIContainer(
        T1_CONTAINER_ID,
        mod.CreateVector(READY_ROSTER_PANEL_MARGIN, READY_ROSTER_PANEL_Y, 0),
        mod.CreateVector(READY_ROSTER_PANEL_WIDTH, READY_ROSTER_PANEL_HEIGHT, 0),
        mod.UIAnchor.TopLeft,
        CONTAINER_BASE,
        true,
        1,
        READY_PANEL_T1_BG_COLOR,
        READY_PANEL_BG_ALPHA,
        mod.UIBgFill.Solid,
        mod.UIDepth.AboveGameUI,
        eventPlayer
    );
    mod.AddUIContainer(
        T2_CONTAINER_ID,
        mod.CreateVector(READY_ROSTER_PANEL_MARGIN + READY_ROSTER_PANEL_WIDTH + READY_ROSTER_PANEL_GAP, READY_ROSTER_PANEL_Y, 0),
        mod.CreateVector(READY_ROSTER_PANEL_WIDTH, READY_ROSTER_PANEL_HEIGHT, 0),
        mod.UIAnchor.TopLeft,
        CONTAINER_BASE,
        true,
        1,
        READY_PANEL_T2_BG_COLOR,
        READY_PANEL_BG_ALPHA,
        mod.UIBgFill.Solid,
        mod.UIDepth.AboveGameUI,
        eventPlayer
    );

    const T1_CONTAINER = mod.FindUIWidgetWithName(T1_CONTAINER_ID, mod.GetUIRoot());
    const T2_CONTAINER = mod.FindUIWidgetWithName(T2_CONTAINER_ID, mod.GetUIRoot());

    // Team labels reuse existing team-name strings.
    const teamLabelY = 0;
    const teamLabelHeight = 24;
    const teamLabelWidth = READY_ROSTER_PANEL_WIDTH;
    const T1_LABEL_ID = UI_READY_DIALOG_TEAM1_LABEL_ID + playerId;
    const T2_LABEL_ID = UI_READY_DIALOG_TEAM2_LABEL_ID + playerId;
    mod.AddUIText(
        T1_LABEL_ID,
        mod.CreateVector(0, teamLabelY, 0),
        mod.CreateVector(teamLabelWidth, teamLabelHeight, 0),
        mod.UIAnchor.TopCenter,
        mod.Message(getTeamNameKey(TeamID.Team1)),
        eventPlayer
    );
    const T1_LABEL = mod.FindUIWidgetWithName(T1_LABEL_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(T1_LABEL, 0);
    mod.SetUITextSize(T1_LABEL, 20);
    mod.SetUIWidgetParent(T1_LABEL, T1_CONTAINER);

    mod.AddUIText(
        T2_LABEL_ID,
        mod.CreateVector(0, teamLabelY, 0),
        mod.CreateVector(teamLabelWidth, teamLabelHeight, 0),
        mod.UIAnchor.TopCenter,
        mod.Message(getTeamNameKey(TeamID.Team2)),
        eventPlayer
    );
    const T2_LABEL = mod.FindUIWidgetWithName(T2_LABEL_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(T2_LABEL, 0);
    mod.SetUITextSize(T2_LABEL, 20);
    mod.SetUIWidgetParent(T2_LABEL, T2_CONTAINER);

    // Fixed rows: up to 16 players per team (32 max). If we ever want to go above 16 per team, we should introduce a Next Page or Previous Page button? Slider?
    const rowStartY = teamLabelY + teamLabelHeight;
    const rowH = 26;
    const colNameX = 10;
    const colReadyX = 280;
    const colBaseX = 420;
    const colNameW = 260;
    const colStatusW = 140;

    for (let row = 0; row < TEAM_ROSTER_MAX_ROWS; row++) {
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

    

    //#region -------------------- Ready Dialog - Swap Teams Button --------------------

    // Bottom-left toggle: swaps the player's current team (Team 1 <-> Team 2).
    const SWAP_BUTTON_ID = UI_READY_DIALOG_BUTTON_SWAP_ID + playerId;
    const SWAP_BUTTON_LABEL_ID = UI_READY_DIALOG_BUTTON_SWAP_LABEL_ID + playerId;

    const SWAP_BORDER = addOutlinedButton(
        SWAP_BUTTON_ID,
        0,
        0,
        READY_DIALOG_MAIN_BUTTON_WIDTH,
        READY_DIALOG_MAIN_BUTTON_HEIGHT,
        mod.UIAnchor.BottomLeft,
        CONTAINER_BASE,
        eventPlayer
    );

    const SWAP_BUTTON_LABEL = addCenteredButtonText(
        SWAP_BUTTON_LABEL_ID,
        READY_DIALOG_MAIN_BUTTON_WIDTH,
        READY_DIALOG_MAIN_BUTTON_HEIGHT,
        mod.Message(mod.stringkeys.twl.readyDialog.buttons.swapTeams),
        eventPlayer,
        SWAP_BORDER ?? CONTAINER_BASE
    );

    //#endregion ----------------- Ready Dialog - Swap Teams Button --------------------



    //#region -------------------- Ready Dialog  - Ready Toggle Button --------------------

    // Bottom-center toggle: starts as "Ready" (pressing it sets READY), then flips to "Not Ready".
    const READY_BUTTON_ID = UI_READY_DIALOG_BUTTON_READY_ID + playerId;
    const READY_BUTTON_LABEL_ID = UI_READY_DIALOG_BUTTON_READY_LABEL_ID + playerId;
    const READY_BUTTON_BORDER = addOutlinedButton(
        READY_BUTTON_ID,
        READY_DIALOG_READY_BUTTON_OFFSET_X,
        0,
        READY_DIALOG_MAIN_BUTTON_WIDTH,
        READY_DIALOG_MAIN_BUTTON_HEIGHT,
        mod.UIAnchor.BottomCenter,
        CONTAINER_BASE,
        eventPlayer
    );

    const READY_BUTTON_LABEL = addCenteredButtonText(
        READY_BUTTON_LABEL_ID,
        READY_DIALOG_MAIN_BUTTON_WIDTH,
        READY_DIALOG_MAIN_BUTTON_HEIGHT,
        mod.Message(mod.stringkeys.twl.readyDialog.buttons.ready),
        eventPlayer,
        READY_BUTTON_BORDER ?? CONTAINER_BASE
    );

    // Ensure the label matches the current stored state for this viewer (default is NOT READY).
    updateReadyToggleButtonForViewer(eventPlayer, playerId);

    // Bottom-center right: Auto-Ready toggle (Enable/Disable).
    const AUTO_READY_BUTTON_ID = UI_READY_DIALOG_BUTTON_AUTO_READY_ID + playerId;
    const AUTO_READY_BUTTON_LABEL_ID = UI_READY_DIALOG_BUTTON_AUTO_READY_LABEL_ID + playerId;
    const AUTO_READY_BUTTON_BORDER = addOutlinedButton(
        AUTO_READY_BUTTON_ID,
        READY_DIALOG_AUTO_READY_BUTTON_OFFSET_X,
        0,
        READY_DIALOG_MAIN_BUTTON_WIDTH,
        READY_DIALOG_MAIN_BUTTON_HEIGHT,
        mod.UIAnchor.BottomCenter,
        CONTAINER_BASE,
        eventPlayer
    );

    addCenteredButtonText(
        AUTO_READY_BUTTON_LABEL_ID,
        READY_DIALOG_MAIN_BUTTON_WIDTH,
        READY_DIALOG_MAIN_BUTTON_HEIGHT,
        mod.Message(mod.stringkeys.twl.readyDialog.buttons.autoReadyEnable),
        eventPlayer,
        AUTO_READY_BUTTON_BORDER ?? CONTAINER_BASE
    );
    updateAutoReadyToggleButtonForViewer(eventPlayer, playerId);

    //#endregion ----------------- Ready Dialog  - Ready Toggle Button --------------------



    //#region -------------------- Debug Info - Time Limit Seconds --------------------

    const DEBUG_TIMELIMIT_ID = UI_TEAMSWITCH_DEBUG_TIMELIMIT_ID + playerId;
    if (SHOW_DEBUG_TIMELIMIT) {

    // Shows the current inferred gamemode time limit (seconds) while the team switch dialog is open.
    const debugTimeLimitSeconds = Math.floor(mod.GetMatchTimeElapsed() + mod.GetMatchTimeRemaining());
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
    applyReadyDialogLabelTextColor(DEBUG_TIMELIMIT);


    } else {
        const existingDebug = safeFind(DEBUG_TIMELIMIT_ID);
        if (existingDebug) mod.SetUIWidgetVisible(existingDebug, false);
    }

    //#endregion -------------------- Debug Info - Time Limit Seconds --------------------


    
    //#region -------------------- Admin Panel Toggle Button (Top-Right, only while Ready Up dialog is open) --------------------

    // UI caching note: these widgets are created once and then hidden/shown on open/close.
    ensureAdminPanelWidgets(eventPlayer, playerId);

    //#endregion ----------------- Admin Panel Toggle Button (Top-Right, only while Ready Up dialog is open) --------------------



    //#region -------------------- Dialog Buttons (Left Side) - Cancel --------------------

    // Cancel remains a core function so players can dismiss the dialog and regain control.
    // (Team switching / spectate / opt-out buttons are intentionally not exposed in v0.5+; see Deprecated UI block below.)
    const BUTTON_CANCEL_BORDER = addOutlinedButton(
        BUTTON_CANCEL_ID,
        0,
        0,
        READY_DIALOG_MAIN_BUTTON_WIDTH,
        READY_DIALOG_MAIN_BUTTON_HEIGHT,
        mod.UIAnchor.BottomRight,
        CONTAINER_BASE,
        eventPlayer
    );

    const BUTTON_CANCEL_LABEL = addCenteredButtonText(
        BUTTON_CANCEL_LABEL_ID,
        READY_DIALOG_MAIN_BUTTON_WIDTH,
        READY_DIALOG_MAIN_BUTTON_HEIGHT,
        mod.Message(mod.stringkeys.twl.teamSwitch.buttons.cancel),
        eventPlayer,
        BUTTON_CANCEL_BORDER ?? CONTAINER_BASE
    );

    // Layout constants: adjust cautiously; verify in-game dialog Admin panel widgets are built lazily on first open (see buildAdminPanelWidgets) to prevent a one-tick render flicker.
    updateHelpTextVisibilityForPlayer(eventPlayer);
}

//#endregion ----------------- Dialog Buttons (Left Side) - Cancel --------------------



//#region -------------------- Admin Panel UI (Right Side) --------------------

// Builds the Admin Panel widgets lazily (to avoid a 1-frame flicker on dialog open).
function buildAdminPanelWidgets(eventPlayer: mod.Player, adminContainer: mod.UIWidget, playerId: number): void {

    // Fit at target resolutions.
    const testerBaseX = ADMIN_PANEL_BASE_X;
    const testerBaseY = ADMIN_PANEL_BASE_Y;

    const buttonSizeX = ADMIN_PANEL_BUTTON_SIZE_X;
    const buttonSizeY = ADMIN_PANEL_BUTTON_SIZE_Y;
    const labelSizeX = ADMIN_PANEL_LABEL_SIZE_X;
    const rowSpacingY = ADMIN_PANEL_ROW_SPACING_Y;

    const decOffsetX = 0;
    const labelOffsetX = buttonSizeX + 8;
    const incOffsetX = buttonSizeX + 8 + labelSizeX + 8;

    const headerId = UI_TEST_HEADER_LABEL_ID + playerId;

    modlib.ParseUI({
        name: headerId,
        type: "Text",
        playerId: eventPlayer,
        position: [0, testerBaseY + 2],
        size: [ADMIN_PANEL_CONTENT_WIDTH, 18],
        anchor: mod.UIAnchor.TopCenter,
        visible: true,
        padding: 0,
        bgAlpha: 0,
        bgFill: mod.UIBgFill.None,
        textLabel: mod.Message(mod.stringkeys.twl.adminPanel.tester.header),
        textColor: ADMIN_PANEL_LABEL_TEXT_COLOR_RGB,
        textAlpha: 1,
        textSize: 12,
        textAnchor: mod.UIAnchor.Center,
    });
    const TEST_HEADER = safeFind(headerId);
    applyAdminPanelLabelTextColor(TEST_HEADER);
    if (TEST_HEADER) mod.SetUIWidgetParent(TEST_HEADER, adminContainer);

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
        mod.stringkeys.twl.adminPanel.tester.labels.roundKillsTarget, State.round.killsTarget, buttonSizeX, buttonSizeY, labelSizeX, ADMIN_PANEL_VALUE_SIZE_X, decOffsetX, labelOffsetX, incOffsetX);

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

    addTesterActionButton(eventPlayer, adminContainer, playerId, testerBaseX,
        row0Y + (buttonSizeY + rowSpacingY) * 13, (buttonSizeX + 8 + labelSizeX + 8 + buttonSizeX), 36,
        UI_TEST_BUTTON_POS_DEBUG_ID, UI_TEST_POS_DEBUG_TEXT_ID, mod.stringkeys.twl.adminPanel.tester.buttons.positionDebug);

    const overrideLabelId = UI_ADMIN_TIEBREAKER_LABEL_ID + playerId;
    const overrideLabelY = row0Y + (buttonSizeY + rowSpacingY) * 14 + 2;
    modlib.ParseUI({
        name: overrideLabelId,
        type: "Text",
        playerId: eventPlayer,
        position: [0, overrideLabelY],
        size: [ADMIN_PANEL_CONTENT_WIDTH, ADMIN_PANEL_TIEBREAKER_LABEL_HEIGHT],
        anchor: mod.UIAnchor.TopCenter,
        visible: true,
        padding: 0,
        bgAlpha: 0,
        bgFill: mod.UIBgFill.None,
        textLabel: mod.Message(mod.stringkeys.twl.adminPanel.labels.tieBreakerOverride),
        textColor: ADMIN_PANEL_LABEL_TEXT_COLOR_RGB,
        textAlpha: 1,
        textSize: 12,
        textAnchor: mod.UIAnchor.Center,
    });
    const OVERRIDE_LABEL = safeFind(overrideLabelId);
    applyAdminPanelLabelTextColor(OVERRIDE_LABEL);
    if (OVERRIDE_LABEL) mod.SetUIWidgetParent(OVERRIDE_LABEL, adminContainer);

    const overrideButtonsY = overrideLabelY + ADMIN_PANEL_TIEBREAKER_LABEL_HEIGHT + 4;
    const overrideButtonSize = ADMIN_PANEL_TIEBREAKER_BUTTON_SIZE;
    const overrideSpacing = ADMIN_PANEL_TIEBREAKER_BUTTON_SPACING;
    const overrideButtonsWidth = (overrideButtonSize * ADMIN_TIEBREAKER_OVERRIDE_LETTERS.length)
        + (overrideSpacing * (ADMIN_TIEBREAKER_OVERRIDE_LETTERS.length - 1));
    const overrideBaseX = Math.floor((ADMIN_PANEL_CONTENT_WIDTH - overrideButtonsWidth) / 2);

    for (let i = 0; i < ADMIN_TIEBREAKER_OVERRIDE_LETTERS.length; i++) {
        const letter = ADMIN_TIEBREAKER_OVERRIDE_LETTERS[i];
        const buttonId = UI_ADMIN_TIEBREAKER_BUTTON_ID + letter + "_" + playerId;
        const textId = UI_ADMIN_TIEBREAKER_BUTTON_TEXT_ID + letter + "_" + playerId;
        const buttonX = overrideBaseX + (overrideButtonSize + overrideSpacing) * i;

        addOutlinedButton(
            buttonId,
            buttonX,
            overrideButtonsY,
            overrideButtonSize,
            overrideButtonSize,
            mod.UIAnchor.TopLeft,
            adminContainer,
            eventPlayer
        );

        const BUTTON_BORDER = safeFind(buttonId + "_BORDER");
        const BUTTON_TEXT = addCenteredButtonText(
            textId,
            overrideButtonSize,
            overrideButtonSize,
            mod.Message(getOvertimeFlagLetterKeyForIndex(i)),
            eventPlayer,
            BUTTON_BORDER ?? adminContainer
        );
        if (BUTTON_TEXT) {
            mod.SetUITextSize(BUTTON_TEXT, 12);
            mod.SetUITextColor(BUTTON_TEXT, ADMIN_PANEL_BUTTON_TEXT_COLOR);
        }
    }

    const tieBreakerModeRowY = overrideButtonsY + overrideButtonSize + rowSpacingY;
    addTesterRow(
        eventPlayer,
        adminContainer,
        playerId,
        testerBaseX,
        tieBreakerModeRowY,
        UI_ADMIN_TIEBREAKER_MODE_DEC_ID,
        UI_ADMIN_TIEBREAKER_MODE_INC_ID,
        UI_ADMIN_TIEBREAKER_MODE_LABEL_ID,
        getTieBreakerModeLabelKey(),
        buttonSizeX,
        buttonSizeY,
        labelSizeX,
        decOffsetX,
        labelOffsetX,
        incOffsetX
    );

    const tieBreakerHeaderId = UI_ADMIN_TIEBREAKER_MODE_HEADER_ID + playerId;
    const tieBreakerHeaderY = tieBreakerModeRowY + 2;
    const tieBreakerLabelHeight = 12;
    mod.AddUIText(
        tieBreakerHeaderId,
        mod.CreateVector(testerBaseX + labelOffsetX, tieBreakerHeaderY, 0),
        mod.CreateVector(labelSizeX, tieBreakerLabelHeight, 0),
        mod.UIAnchor.TopLeft,
        mod.Message(mod.stringkeys.twl.adminPanel.labels.tieBreakerSettingHeader),
        eventPlayer
    );
    const tieBreakerHeaderLabel = mod.FindUIWidgetWithName(tieBreakerHeaderId, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(tieBreakerHeaderLabel, 0);
    applyAdminPanelLabelTextColor(tieBreakerHeaderLabel);
    mod.SetUITextSize(tieBreakerHeaderLabel, 11);
    mod.SetUIWidgetParent(tieBreakerHeaderLabel, adminContainer);

    const tieBreakerModeLabel = safeFind(UI_ADMIN_TIEBREAKER_MODE_LABEL_ID + playerId);
    if (tieBreakerModeLabel) {
        const tieBreakerModeLabelY = tieBreakerModeRowY + buttonSizeY - 14;
        mod.SetUIWidgetPosition(tieBreakerModeLabel, mod.CreateVector(testerBaseX + labelOffsetX, tieBreakerModeLabelY, 0));
        safeSetUIWidgetSize(tieBreakerModeLabel, mod.CreateVector(labelSizeX, tieBreakerLabelHeight, 0));
        mod.SetUITextSize(tieBreakerModeLabel, 11);
    }

    const liveRespawnRowY = tieBreakerModeRowY + (buttonSizeY + rowSpacingY);
    addTesterActionButton(
        eventPlayer,
        adminContainer,
        playerId,
        testerBaseX,
        liveRespawnRowY,
        (buttonSizeX + 8 + labelSizeX + 8 + buttonSizeX),
        buttonSizeY,
        UI_ADMIN_LIVE_RESPAWN_BUTTON_ID,
        UI_ADMIN_LIVE_RESPAWN_TEXT_ID,
        getAdminLiveRespawnLabelKey()
    );

    const roundLengthRowY = liveRespawnRowY + (buttonSizeY + rowSpacingY);
    addTesterRow(
        eventPlayer,
        adminContainer,
        playerId,
        testerBaseX,
        roundLengthRowY,
        UI_ADMIN_ROUND_LENGTH_DEC_ID,
        UI_ADMIN_ROUND_LENGTH_INC_ID,
        UI_ADMIN_ROUND_LENGTH_LABEL_ID,
        mod.stringkeys.twl.adminPanel.labels.roundLengthFormat,
        buttonSizeX,
        buttonSizeY,
        labelSizeX,
        decOffsetX,
        labelOffsetX,
        incOffsetX
    );

    syncAdminTieBreakerModeLabelForAllPlayers();
    syncAdminLiveRespawnLabelForAllPlayers();
    syncAdminRoundLengthLabelForAllPlayers();
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

    addOutlinedButton(
        decButtonId,
        baseX + decOffsetX,
        baseY,
        buttonSizeX,
        buttonSizeY,
        mod.UIAnchor.TopLeft,
        containerBase,
        eventPlayer
    );

    const DEC_BORDER = safeFind(decButtonId + "_BORDER");
    const MINUS_TEXT = addCenteredButtonText(
        minusTextId,
        buttonSizeX,
        buttonSizeY,
        mod.Message(mod.stringkeys.twl.ui.minus),
        eventPlayer,
        DEC_BORDER ?? containerBase
    );
    if (MINUS_TEXT) {
        mod.SetUITextSize(MINUS_TEXT, 12);
        mod.SetUITextColor(MINUS_TEXT, ADMIN_PANEL_BUTTON_TEXT_COLOR);
    }

    mod.AddUIText(labelId, mod.CreateVector(baseX + labelOffsetX, baseY + 11, 0), mod.CreateVector(labelSizeX, buttonSizeY - 22, 0),
        mod.UIAnchor.TopLeft, mod.Message(labelKey), eventPlayer);
    mod.SetUITextSize(mod.FindUIWidgetWithName(labelId, mod.GetUIRoot()), 12);
    const LABEL = mod.FindUIWidgetWithName(labelId, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(LABEL, 0);
    applyAdminPanelLabelTextColor(LABEL);
    mod.SetUIWidgetParent(LABEL, containerBase);

    addOutlinedButton(
        incButtonId,
        baseX + incOffsetX,
        baseY,
        buttonSizeX,
        buttonSizeY,
        mod.UIAnchor.TopLeft,
        containerBase,
        eventPlayer
    );

    const INC_BORDER = safeFind(incButtonId + "_BORDER");
    const PLUS_TEXT = addCenteredButtonText(
        plusTextId,
        buttonSizeX,
        buttonSizeY,
        mod.Message(mod.stringkeys.twl.ui.plus),
        eventPlayer,
        INC_BORDER ?? containerBase
    );
    if (PLUS_TEXT) {
        mod.SetUITextSize(PLUS_TEXT, 12);
        mod.SetUITextColor(PLUS_TEXT, ADMIN_PANEL_BUTTON_TEXT_COLOR);
    }
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
    const valueX = baseX + incOffsetX - -3 - valueSizeX;

    mod.AddUIText(valueId, mod.CreateVector(valueX, baseY + 11, 0), mod.CreateVector(valueSizeX, buttonSizeY - 22, 0),
        mod.UIAnchor.TopLeft, mod.Message(mod.stringkeys.twl.system.genericCounter, Math.floor(initialValue)), eventPlayer);
    mod.SetUITextSize(mod.FindUIWidgetWithName(valueId, mod.GetUIRoot()), 12);
    const VALUE_TEXT = mod.FindUIWidgetWithName(valueId, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(VALUE_TEXT, 0);
    applyAdminPanelLabelTextColor(VALUE_TEXT);
    mod.SetUIWidgetParent(VALUE_TEXT, containerBase);
}

function syncRoundKillsTargetTesterValueForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);

    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const pid = getObjId(p);
        const widget = mod.FindUIWidgetWithName(UI_TEST_VALUE_ROUND_KILLS_TARGET_ID + pid, mod.GetUIRoot());
        if (!widget) continue;
        mod.SetUITextLabel(widget, mod.Message(mod.stringkeys.twl.system.genericCounter, Math.floor(State.round.killsTarget)));
    }
    updateMatchupReadoutsForAllPlayers();
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

    addOutlinedButton(
        buttonId,
        baseX,
        baseY,
        width,
        height,
        mod.UIAnchor.TopLeft,
        containerBase,
        eventPlayer
    );

    const resetParent = safeFind(buttonId + "_BORDER") ?? containerBase;
    const resetLabel = addCenteredButtonText(
        labelId,
        width,
        height,
        mod.Message(mod.stringkeys.twl.adminPanel.tester.buttons.clockReset),
        eventPlayer,
        resetParent
    );
    if (resetLabel) {
        mod.SetUITextSize(resetLabel, 12);
        mod.SetUITextColor(resetLabel, ADMIN_PANEL_BUTTON_TEXT_COLOR);
    }
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

    addOutlinedButton(
        buttonId,
        baseX,
        baseY,
        width,
        height,
        mod.UIAnchor.TopLeft,
        containerBase,
        eventPlayer
    );

    const actionParent = safeFind(buttonId + "_BORDER") ?? containerBase;
    const actionLabel = addCenteredButtonText(
        labelId,
        width,
        height,
        mod.Message(labelKey),
        eventPlayer,
        actionParent
    );
    if (actionLabel) {
        mod.SetUITextSize(actionLabel, 12);
        mod.SetUITextColor(actionLabel, ADMIN_PANEL_BUTTON_TEXT_COLOR);
    }
}

function ensurePositionDebugWidgets(player: mod.Player): { x: mod.UIWidget; y: mod.UIWidget; z: mod.UIWidget; rotY: mod.UIWidget } | undefined {
    const pid = mod.GetObjId(player);
    const containerId = UI_POS_DEBUG_CONTAINER_ID + pid;
    const xId = UI_POS_DEBUG_X_ID + pid;
    const yId = UI_POS_DEBUG_Y_ID + pid;
    const zId = UI_POS_DEBUG_Z_ID + pid;
    const rotYId = UI_POS_DEBUG_ROTY_ID + pid;

    let container = safeFind(containerId);
    if (!container) {
        mod.AddUIContainer(
            containerId,
            mod.CreateVector(300, 17, 0), // +X to move left, +Y to move down
            mod.CreateVector(200, 18, 0),
            mod.UIAnchor.TopRight,
            mod.GetUIRoot(),
            false,
            0,
            mod.CreateVector(0, 0, 0),
            0,
            mod.UIBgFill.None,
            mod.UIDepth.AboveGameUI,
            player
        );
        container = mod.FindUIWidgetWithName(containerId, mod.GetUIRoot());
    }
    if (container) {
        mod.SetUIWidgetVisible(container, true);
    }

    const makeText = (id: string, posX: number) => {
        mod.AddUIText(
            id,
            mod.CreateVector(posX, 0, 0),
            mod.CreateVector(80, 18, 0),
            mod.UIAnchor.TopLeft,
            mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
            player
        );
        const w = mod.FindUIWidgetWithName(id, mod.GetUIRoot());
        mod.SetUIWidgetBgAlpha(w, 0);
        mod.SetUITextSize(w, 10);
        mod.SetUITextColor(w, mod.CreateVector(1, 1, 1));
        if (container) mod.SetUIWidgetParent(w, container);
        return w;
    };

    // 0, 50, 90, 140 are spacing values for the 4 text widgets
    let x = safeFind(xId);
    if (!x) x = makeText(xId, 0);
    let y = safeFind(yId);
    if (!y) y = makeText(yId, 50);
    let z = safeFind(zId);
    if (!z) z = makeText(zId, 90);
    let rotY = safeFind(rotYId);
    if (!rotY) rotY = makeText(rotYId, 140);

    if (!x || !y || !z || !rotY) return undefined;
    return { x, y, z, rotY };
}

async function positionDebugLoop(player: mod.Player, expectedToken: number): Promise<void> {
    const pid = mod.GetObjId(player);
    while (true) {
        const state = State.players.teamSwitchData[pid];
        if (!state || !state.posDebugVisible || state.posDebugToken !== expectedToken) return;
        if (!mod.IsPlayerValid(player)) return;
        if (!isPlayerDeployed(player)) return;

        const widgets = ensurePositionDebugWidgets(player);
        if (!widgets) return;

        const pos = safeGetSoldierStateVector(player, mod.SoldierStateVector.GetPosition);
        const facing = safeGetSoldierStateVector(player, mod.SoldierStateVector.GetFacingDirection);
        if (!pos || !facing) return;

        const roundTo3 = (value: number) => Math.round(value * 1000) / 1000;
        const yawRad = Math.atan2(mod.XComponentOf(facing), mod.ZComponentOf(facing));
        const yawDeg = (yawRad * 180) / Math.PI;

        mod.SetUITextLabel(widgets.x, mod.Message(mod.stringkeys.twl.system.genericCounter, roundTo3(mod.XComponentOf(pos))));
        mod.SetUITextLabel(widgets.y, mod.Message(mod.stringkeys.twl.system.genericCounter, roundTo3(mod.YComponentOf(pos))));
        mod.SetUITextLabel(widgets.z, mod.Message(mod.stringkeys.twl.system.genericCounter, roundTo3(mod.ZComponentOf(pos))));
        mod.SetUITextLabel(widgets.rotY, mod.Message(mod.stringkeys.twl.system.genericCounter, roundTo3(yawDeg)));

        await mod.Wait(2.0);
    }
}

function setPositionDebugVisibleForPlayer(player: mod.Player, visible: boolean): void {
    const pid = mod.GetObjId(player);
    const state = State.players.teamSwitchData[pid];
    if (!state) return;

    const widgets = ensurePositionDebugWidgets(player);
    if (!widgets) return;

    const container = safeFind(UI_POS_DEBUG_CONTAINER_ID + pid);
    if (container) mod.SetUIWidgetVisible(container, visible);

    mod.SetUIWidgetVisible(widgets.x, visible);
    mod.SetUIWidgetVisible(widgets.y, visible);
    mod.SetUIWidgetVisible(widgets.z, visible);
    mod.SetUIWidgetVisible(widgets.rotY, visible);

    state.posDebugToken = (state.posDebugToken + 1) % 1000000000;
    if (visible) {
        void positionDebugLoop(player, state.posDebugToken);
    }
}

//#endregion ----------------- Admin Panel UI builder helpers --------------------



//#region -------------------- Ready Dialog - Roster Render + Toggle Labels --------------------

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
    updateAutoReadyToggleButtonForViewer(eventPlayer, viewerPid);

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
    const roster = getRosterDisplayEntries();
    const t1Players = roster.team1;
    const t2Players = roster.team2;

    const maxRowsPerTeam = TEAM_ROSTER_MAX_ROWS;
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

        const t1Entry = (row < t1Players.length) ? t1Players[row] : undefined;
        const t2Entry = (row < t2Players.length) ? t2Players[row] : undefined;
        const p1 = t1Entry?.player;
        const p2 = t2Entry?.player;

        // Hide unused placeholder rows (prevents 'unknown string' artifacts and reduces visual noise).
        const hasP1 = !!t1Entry;
        const hasP2 = !!t2Entry;
        if (t1Name) mod.SetUIWidgetVisible(t1Name, hasP1);
        if (t1Ready) mod.SetUIWidgetVisible(t1Ready, hasP1);
        if (t1Base) mod.SetUIWidgetVisible(t1Base, hasP1);
        if (t2Name) mod.SetUIWidgetVisible(t2Name, hasP2);
        if (t2Ready) mod.SetUIWidgetVisible(t2Ready, hasP2);
        if (t2Base) mod.SetUIWidgetVisible(t2Base, hasP2);

        mod.SetUITextLabel(t1Name, hasP1 ? getRosterEntryNameMessage(t1Entry) : emptyMsg);
        mod.SetUITextLabel(
            t1Ready,
            hasP1
                ? (p1
                    ? (State.players.readyByPid[mod.GetObjId(p1)] ? mod.Message(mod.stringkeys.twl.readyDialog.status.ready) : mod.Message(mod.stringkeys.twl.readyDialog.status.notReady))
                    : mod.Message(mod.stringkeys.twl.readyDialog.status.notReady))
                : emptyMsg
        );
        mod.SetUITextLabel(
            t1Base,
            hasP1
                ? (p1
                    ? (isPlayerInMainBaseForReady(mod.GetObjId(p1)) ? mod.Message(mod.stringkeys.twl.readyDialog.baseStatus.in) : mod.Message(mod.stringkeys.twl.readyDialog.baseStatus.out))
                    : mod.Message(mod.stringkeys.twl.readyDialog.baseStatus.out))
                : emptyMsg
        );
        if (p1) {
            const p1Id = mod.GetObjId(p1);
            const p1Ready = !!State.players.readyByPid[p1Id];
            const p1InBase = isPlayerInMainBaseForReady(p1Id);
            applyReadyDialogRowColors(t1Name, t1Ready, t1Base, p1Ready, p1InBase);
        } else if (hasP1) {
            applyReadyDialogRowColors(t1Name, t1Ready, t1Base, false, false);
        } else {
            // Empty row: default to white for any placeholder text.
            if (t1Name) mod.SetUITextColor(t1Name, COLOR_NORMAL);
            if (t1Ready) mod.SetUITextColor(t1Ready, COLOR_NORMAL);
            if (t1Base) mod.SetUITextColor(t1Base, COLOR_NORMAL);
        }

        mod.SetUITextLabel(t2Name, hasP2 ? getRosterEntryNameMessage(t2Entry) : emptyMsg);
        mod.SetUITextLabel(
            t2Ready,
            hasP2
                ? (p2
                    ? (State.players.readyByPid[mod.GetObjId(p2)] ? mod.Message(mod.stringkeys.twl.readyDialog.status.ready) : mod.Message(mod.stringkeys.twl.readyDialog.status.notReady))
                    : mod.Message(mod.stringkeys.twl.readyDialog.status.notReady))
                : emptyMsg
        );
        mod.SetUITextLabel(
            t2Base,
            hasP2
                ? (p2
                    ? (isPlayerInMainBaseForReady(mod.GetObjId(p2)) ? mod.Message(mod.stringkeys.twl.readyDialog.baseStatus.in) : mod.Message(mod.stringkeys.twl.readyDialog.baseStatus.out))
                    : mod.Message(mod.stringkeys.twl.readyDialog.baseStatus.out))
                : emptyMsg
        );
        if (p2) {
            const p2Id = mod.GetObjId(p2);
            const p2Ready = !!State.players.readyByPid[p2Id];
            const p2InBase = isPlayerInMainBaseForReady(p2Id);
            applyReadyDialogRowColors(t2Name, t2Ready, t2Base, p2Ready, p2InBase);
        } else if (hasP2) {
            applyReadyDialogRowColors(t2Name, t2Ready, t2Base, false, false);
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

// Updates the Auto-Ready toggle button label for the given viewer based on that viewer's current auto-ready state.
function updateAutoReadyToggleButtonForViewer(viewer: mod.Player, viewerPlayerId: number): void {
    const btnLabelId = UI_READY_DIALOG_BUTTON_AUTO_READY_LABEL_ID + viewerPlayerId;
    const labelWidget = mod.FindUIWidgetWithName(btnLabelId, mod.GetUIRoot());
    if (!labelWidget) return;

    const isAutoReady = !!State.players.autoReadyByPid[viewerPlayerId];
    const labelMsg = isAutoReady
        ? mod.Message(mod.stringkeys.twl.readyDialog.buttons.autoReadyDisable)
        : mod.Message(mod.stringkeys.twl.readyDialog.buttons.autoReadyEnable);

    mod.SetUITextLabel(labelWidget, labelMsg);
}

//#endregion ----------------- Ready Dialog - Roster Render + Toggle Labels --------------------



//#region -------------------- Ready Dialog - Map/Mode Config UI Readout --------------------

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

function updateReadyDialogMapLabelForPid(pid: number): void {
    const valueId = UI_READY_DIALOG_MAP_VALUE_ID + pid;
    const valueWidget = safeFind(valueId);
    if (!valueWidget) return;
    mod.SetUITextLabel(valueWidget, mod.Message(getMapNameKey(ACTIVE_MAP_KEY)));
}

function updateReadyDialogMapLabelForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        updateReadyDialogMapLabelForPid(mod.GetObjId(p));
    }
}

function updateReadyDialogModeConfigForPid(pid: number): void {
    const cfg = State.round.modeConfig;

    const gameLabel = safeFind(UI_READY_DIALOG_MODE_GAME_LABEL_ID + pid);
    if (gameLabel) mod.SetUITextLabel(gameLabel, mod.Message(mod.stringkeys.twl.readyDialog.gameModeLabel));
    const gameValue = safeFind(UI_READY_DIALOG_MODE_GAME_VALUE_ID + pid);
    if (gameValue) mod.SetUITextLabel(gameValue, mod.Message(cfg.gameMode));

    const settingsLabel = safeFind(UI_READY_DIALOG_MODE_SETTINGS_LABEL_ID + pid);
    if (settingsLabel) mod.SetUITextLabel(settingsLabel, mod.Message(mod.stringkeys.twl.readyDialog.modeSettingsLabel));
    const settingsValue = safeFind(UI_READY_DIALOG_MODE_SETTINGS_VALUE_ID + pid);
    if (settingsValue) {
        const applyCustomCeiling = shouldApplyCustomCeilingForConfig(cfg.gameMode, cfg.aircraftCeilingOverridePending);
        const ceilingValue = applyCustomCeiling
            ? Math.floor(cfg.aircraftCeiling)
            : STR_READY_DIALOG_AIRCRAFT_CEILING_VANILLA;
        mod.SetUITextLabel(
            settingsValue,
            mod.Message(cfg.gameSettings, ceilingValue)
        );
    }

    const vehiclesT1Label = safeFind(UI_READY_DIALOG_MODE_VEHICLES_T1_LABEL_ID + pid);
    if (vehiclesT1Label) {
        mod.SetUITextLabel(
            vehiclesT1Label,
            mod.Message(mod.stringkeys.twl.readyDialog.vehiclesLabelFormat, getTeamNameKey(TeamID.Team1))
        );
    }
    const vehiclesT1Value = safeFind(UI_READY_DIALOG_MODE_VEHICLES_T1_VALUE_ID + pid);
    if (vehiclesT1Value) mod.SetUITextLabel(vehiclesT1Value, mod.Message(cfg.vehiclesT1));

    const vehiclesT2Label = safeFind(UI_READY_DIALOG_MODE_VEHICLES_T2_LABEL_ID + pid);
    if (vehiclesT2Label) {
        mod.SetUITextLabel(
            vehiclesT2Label,
            mod.Message(mod.stringkeys.twl.readyDialog.vehiclesLabelFormat, getTeamNameKey(TeamID.Team2))
        );
    }
    const vehiclesT2Value = safeFind(UI_READY_DIALOG_MODE_VEHICLES_T2_VALUE_ID + pid);
    if (vehiclesT2Value) mod.SetUITextLabel(vehiclesT2Value, mod.Message(cfg.vehiclesT2));
}

function updateReadyDialogModeConfigForAllVisibleViewers(): void {
    for (const pidStr in State.players.teamSwitchData) {
        const pid = Number(pidStr);
        const state = State.players.teamSwitchData[pid];
        if (!state || !state.dialogVisible) continue;
        updateReadyDialogModeConfigForPid(pid);
    }
}

//#endregion ----------------- Ready Dialog - Map/Mode Config UI Readout --------------------



//#region -------------------- Aircraft Ceiling (Soft Enforcement) --------------------

// TODO(1.0): Unused; remove before final 1.0 release.
// Converts the HUD ceiling to world Y using the per-map HUD floor offset.
function getAircraftSoftCeilingWorldY(): number {
    const floorY = Math.floor(State.round.aircraftCeiling.hudFloorY);
    const hudCeiling = Math.floor(State.round.modeConfig.confirmed.aircraftCeiling);
    return floorY + hudCeiling;
}

// Engine limiter expects a world-Y scale; convert HUD ceiling using the map's HUD floor/max offsets.
function applyCustomAircraftCeilingHardLimiter(): void {
    const floorY = Math.floor(State.round.aircraftCeiling.hudFloorY);
    const baseHud = Math.max(1, Math.floor(State.round.aircraftCeiling.hudMaxY));
    const targetHud = Math.max(1, Math.floor(State.round.modeConfig.confirmed.aircraftCeiling));
    // Convert HUD ceiling to world Y using the map-specific HUD floor offset.
    const baseWorldY = Math.max(1, floorY + baseHud);
    const targetWorldY = Math.max(1, floorY + targetHud);
    const scale = targetWorldY / baseWorldY;
    mod.SetMaxVehicleHeightLimitScale(scale);
}

// TODO(1.0): Unused; remove before final 1.0 release.
function getVehicleYawRad(vehicle: mod.Vehicle): number {
    const facing = mod.GetVehicleState(vehicle, mod.VehicleStateVector.FacingDirection);
    const x = mod.XComponentOf(facing);
    const z = mod.ZComponentOf(facing);
    if (x === 0 && z === 0) return 0;
    return Math.atan2(x, z);
}

// TODO(1.0): Unused; remove before final 1.0 release.
function isAircraftVehicle(vehicle: mod.Vehicle): boolean {
    // Jets
    if (mod.CompareVehicleName(vehicle, mod.VehicleList.F16)) return true;
    if (mod.CompareVehicleName(vehicle, mod.VehicleList.F22)) return true;
    if (mod.CompareVehicleName(vehicle, mod.VehicleList.JAS39)) return true;
    if (mod.CompareVehicleName(vehicle, mod.VehicleList.SU57)) return true;
    // Helis + transports
    if (mod.CompareVehicleName(vehicle, mod.VehicleList.AH64)) return true;
    if (mod.CompareVehicleName(vehicle, mod.VehicleList.Eurocopter)) return true;
    if (mod.CompareVehicleName(vehicle, mod.VehicleList.UH60)) return true;
    if (mod.CompareVehicleName(vehicle, mod.VehicleList.UH60_Pax)) return true;
    if (mod.CompareVehicleName(vehicle, mod.VehicleList.Cheetah)) return true;
    if (mod.CompareVehicleName(vehicle, mod.VehicleList.Flyer60)) return true;
    return false;
}

// TODO(1.0): Unused; remove before final 1.0 release.
function updateSoftCeilingForVehicle(
    vehicle: mod.Vehicle,
    state: AircraftCeilingVehicleState,
    nowSeconds: number,
    softY: number,
    hardY: number
): void {
    const pos = mod.GetVehicleState(vehicle, mod.VehicleStateVector.VehiclePosition);
    const posY = mod.YComponentOf(pos);
    const vel = mod.GetVehicleState(vehicle, mod.VehicleStateVector.LinearVelocity);
    const velY = mod.YComponentOf(vel);

    const enterY = softY + AIRCRAFT_SOFT_CEILING_ENTER_BUFFER;
    const exitY = softY - AIRCRAFT_SOFT_CEILING_EXIT_BUFFER;

    if (!state.enforcing && posY > enterY && velY > 0) {
        state.enforcing = true;
    }
    if (state.enforcing && posY < exitY) {
        state.enforcing = false;
        return;
    }
    if (!state.enforcing || posY <= softY) {
        return;
    }
    if (nowSeconds - state.lastNudgeAt < AIRCRAFT_SOFT_CEILING_NUDGE_INTERVAL_SECONDS) {
        return;
    }

    const dtSeconds = Math.max(AIRCRAFT_SOFT_CEILING_NUDGE_INTERVAL_SECONDS, nowSeconds - state.lastNudgeAt);
    const upwardVel = Math.max(0, velY);
    let step =
        upwardVel * dtSeconds * AIRCRAFT_SOFT_CEILING_VELOCITY_SCALE;
    step = Math.max(AIRCRAFT_SOFT_CEILING_NUDGE_MIN_STEP, Math.min(AIRCRAFT_SOFT_CEILING_NUDGE_MAX_STEP, step));
    if (posY > hardY) {
        // If someone gets far above the soft ceiling, increase the nudge to avoid a slow climb.
        step = Math.min(AIRCRAFT_SOFT_CEILING_NUDGE_MAX_STEP, step * AIRCRAFT_SOFT_CEILING_HARD_STEP_MULTIPLIER);
    }
    const targetY = Math.max(softY, posY - step);
    const newPos = mod.CreateVector(mod.XComponentOf(pos), targetY, mod.ZComponentOf(pos));
    const yawRad = getVehicleYawRad(vehicle);
    mod.Teleport(vehicle, newPos, yawRad);
    state.lastNudgeAt = nowSeconds;
}

// TODO(1.0): Unused; remove before final 1.0 release.
async function runAircraftCeilingSoftEnforcementLoop(expectedToken: number): Promise<void> {
    while (State.round.aircraftCeiling.enforcementToken === expectedToken) {
        if (!State.round.aircraftCeiling.customEnabled || AIRCRAFT_CEILING_ENFORCEMENT_MODE !== "soft") {
            await mod.Wait(AIRCRAFT_SOFT_CEILING_TICK_SECONDS);
            continue;
        }

        const softY = getAircraftSoftCeilingWorldY();
        if (softY <= 0) {
            await mod.Wait(AIRCRAFT_SOFT_CEILING_TICK_SECONDS);
            continue;
        }
        const hardY = softY + AIRCRAFT_SOFT_CEILING_HARD_BUFFER;
        const nowSeconds = mod.GetMatchTimeElapsed();

        const vehicles = mod.AllVehicles();
        const count = mod.CountOf(vehicles);
        const seen: Record<number, boolean> = {};
        for (let i = 0; i < count; i++) {
            const vehicle = mod.ValueInArray(vehicles, i) as mod.Vehicle;
            if (!vehicle || !isAircraftVehicle(vehicle)) continue;
            const vehicleId = getVehicleId(vehicle);
            seen[vehicleId] = true;
            const state =
                State.round.aircraftCeiling.vehicleStates[vehicleId] ??
                (State.round.aircraftCeiling.vehicleStates[vehicleId] = { enforcing: false, lastNudgeAt: -999 });
            updateSoftCeilingForVehicle(vehicle, state, nowSeconds, softY, hardY);
        }

        for (const idStr in State.round.aircraftCeiling.vehicleStates) {
            const id = Number(idStr);
            if (!seen[id]) {
                delete State.round.aircraftCeiling.vehicleStates[id];
            }
        }

        await mod.Wait(AIRCRAFT_SOFT_CEILING_TICK_SECONDS);
    }
}

// TODO(1.0): Unused; remove before final 1.0 release.
function startAircraftCeilingSoftEnforcementLoop(): void {
    State.round.aircraftCeiling.enforcementToken += 1;
    void runAircraftCeilingSoftEnforcementLoop(State.round.aircraftCeiling.enforcementToken);
}

function enableCustomAircraftCeiling(): void {
    State.round.aircraftCeiling.customEnabled = true;
    State.round.aircraftCeiling.vehicleStates = {};
}

function disableCustomAircraftCeilingAndRestoreDefault(): void {
    State.round.aircraftCeiling.customEnabled = false;
    State.round.aircraftCeiling.vehicleStates = {};
    State.round.modeConfig.aircraftCeiling = State.round.aircraftCeiling.mapDefaultHudCeiling;
    State.round.modeConfig.gameSettings = mod.stringkeys.twl.readyDialog.modeSettingAircraftCeilingFormat;
    State.round.modeConfig.confirmed.aircraftCeiling = State.round.aircraftCeiling.mapDefaultHudCeiling;
    mod.SetMaxVehicleHeightLimitScale(1.0);
    updateReadyDialogModeConfigForAllVisibleViewers();
}

function syncAircraftCeilingFromMapConfig(): void {
    const mapDefault = Math.max(1, Math.floor(ACTIVE_MAP_CONFIG.aircraftCeiling));
    const mapMaxHud = Math.max(1, Math.floor(ACTIVE_MAP_CONFIG.hudMaxY));
    const floorY = Math.floor(ACTIVE_MAP_CONFIG.hudFloorY);
    State.round.aircraftCeiling.mapDefaultHudCeiling = mapDefault;
    State.round.aircraftCeiling.hudMaxY = mapMaxHud;
    State.round.aircraftCeiling.hudFloorY = floorY;
    State.round.aircraftCeiling.customEnabled = false;
    State.round.aircraftCeiling.vehicleStates = {};
    // Keep the engine ceiling at vanilla scale; soft enforcement is confirm-gated.
    mod.SetMaxVehicleHeightLimitScale(1.0);

    State.round.modeConfig.aircraftCeiling = mapDefault;
    State.round.modeConfig.aircraftCeilingOverridePending = false;
    State.round.modeConfig.gameSettings = mod.stringkeys.twl.readyDialog.modeSettingAircraftCeilingFormat;
    State.round.modeConfig.confirmed.aircraftCeiling = mapDefault;
    State.round.modeConfig.confirmed.aircraftCeilingOverrideEnabled = false;

    updateReadyDialogModeConfigForAllVisibleViewers();
}

//#endregion ----------------- Aircraft Ceiling (Soft Enforcement) --------------------



//#region -------------------- Ready Dialog - Mode Presets + Confirm --------------------

function isReadyDialogGameModeVanilla(gameModeKey: number): boolean {
    return gameModeKey === mod.stringkeys.twl.readyDialog.gameModeHelisPractice;
}

function isReadyDialogGameModeLadder(gameModeKey: number): boolean {
    return gameModeKey === mod.stringkeys.twl.readyDialog.gameModeHelisLadder;
}

function isReadyDialogGameModeTwl1v1(gameModeKey: number): boolean {
    return gameModeKey === mod.stringkeys.twl.readyDialog.gameModeHelisTwl1v1;
}

function isReadyDialogGameModeCustom(gameModeKey: number): boolean {
    return gameModeKey === mod.stringkeys.twl.readyDialog.gameModeHelisCustom;
}

function isReadyDialogGameModeTwlPreset(gameModeKey: number): boolean {
    return isReadyDialogGameModeLadder(gameModeKey) || isReadyDialogGameModeTwl1v1(gameModeKey);
}

function getReadyDialogPresetPlayersPerSide(gameModeKey: number): number {
    if (isReadyDialogGameModeTwl1v1(gameModeKey)) {
        return READY_DIALOG_MODE_PRESET_PLAYERS_PER_SIDE_TWL_1V1;
    }
    if (isReadyDialogGameModeLadder(gameModeKey)) {
        return READY_DIALOG_MODE_PRESET_PLAYERS_PER_SIDE_TWL_2V2;
    }
    return READY_DIALOG_MODE_PRESET_PLAYERS_PER_SIDE_VANILLA;
}

function shouldApplyCustomCeilingForGameMode(gameModeKey: number): boolean {
    if (isReadyDialogGameModeVanilla(gameModeKey)) return false;
    if (isReadyDialogGameModeCustom(gameModeKey)) return true;
    if (isReadyDialogGameModeTwlPreset(gameModeKey)) return !!ACTIVE_MAP_CONFIG.useCustomCeiling;
    return true;
}

function hasCustomCeilingOverride(ceilingValue: number): boolean {
    return Math.floor(ceilingValue) !== Math.floor(State.round.aircraftCeiling.mapDefaultHudCeiling);
}

// Custom mode always applies the numeric ceiling; Vanilla/Ladder apply only when configured to do so.
function shouldApplyCustomCeilingForConfig(gameModeKey: number, overrideEnabled: boolean): boolean {
    if (isReadyDialogGameModeCustom(gameModeKey)) {
        return overrideEnabled;
    }
    return shouldApplyCustomCeilingForGameMode(gameModeKey);
}

// Forces Custom mode without applying presets or mutating other settings.
function ensureCustomGameModeForManualChange(): void {
    if (suppressReadyDialogModeAutoSwitch) return;
    if (State.round.modeConfig.gameModeIndex === READY_DIALOG_GAME_MODE_CUSTOM_INDEX) return;
    const priorMode = State.round.modeConfig.gameMode;
    const shouldKeepCeilingOverride =
        shouldApplyCustomCeilingForGameMode(priorMode)
        || State.round.modeConfig.aircraftCeilingOverridePending
        || State.round.modeConfig.confirmed.aircraftCeilingOverrideEnabled;
    if (shouldKeepCeilingOverride) {
        State.round.modeConfig.aircraftCeilingOverridePending = true;
    }
    State.round.modeConfig.gameModeIndex = READY_DIALOG_GAME_MODE_CUSTOM_INDEX;
    State.round.modeConfig.gameMode = READY_DIALOG_GAME_MODE_OPTIONS[READY_DIALOG_GAME_MODE_CUSTOM_INDEX];
    updateReadyDialogModeConfigForAllVisibleViewers();
    updateSettingsSummaryHudForAllPlayers();
}

// True only when all preset values match the selected mode (best-of, matchup, players, vehicles, ceiling).
function isReadyDialogModePresetActive(gameModeKey: number): boolean {
    if (isReadyDialogGameModeCustom(gameModeKey)) return false;
    const expectedBestOf = isReadyDialogGameModeTwlPreset(gameModeKey)
        ? READY_DIALOG_MODE_PRESET_BEST_OF_LADDER
        : READY_DIALOG_MODE_PRESET_BEST_OF_VANILLA;
    if (Math.floor(State.round.max) !== expectedBestOf) return false;
    if (State.round.matchupPresetIndex !== READY_DIALOG_MODE_PRESET_MATCHUP_INDEX) return false;
    if (State.round.autoStartMinActivePlayers !== getReadyDialogPresetPlayersPerSide(gameModeKey)) return false;
    if (State.round.modeConfig.vehicleIndexT1 !== READY_DIALOG_MODE_PRESET_VEHICLE_INDEX) return false;
    if (State.round.modeConfig.vehicleIndexT2 !== READY_DIALOG_MODE_PRESET_VEHICLE_INDEX) return false;
    if (Math.floor(State.round.modeConfig.aircraftCeiling) !== Math.floor(State.round.aircraftCeiling.mapDefaultHudCeiling)) return false;
    return true;
}

// Applies the full mode preset (the only place we intentionally sync multiple settings at once).
function applyReadyDialogModePresetForGameMode(gameModeKey: number): boolean {
    if (isReadyDialogGameModeCustom(gameModeKey)) return false;

    suppressReadyDialogModeAutoSwitch = true;
    const bestOfRounds = isReadyDialogGameModeTwlPreset(gameModeKey)
        ? READY_DIALOG_MODE_PRESET_BEST_OF_LADDER
        : READY_DIALOG_MODE_PRESET_BEST_OF_VANILLA;

    setHudRoundCountersForAllPlayers(State.round.current, bestOfRounds);
    applyMatchupPresetInternal(READY_DIALOG_MODE_PRESET_MATCHUP_INDEX, undefined, false, true);

    State.round.autoStartMinActivePlayers = getReadyDialogPresetPlayersPerSide(gameModeKey);
    updateMatchupReadoutsForAllPlayers();

    State.round.modeConfig.vehicleIndexT1 = READY_DIALOG_MODE_PRESET_VEHICLE_INDEX;
    State.round.modeConfig.vehicleIndexT2 = READY_DIALOG_MODE_PRESET_VEHICLE_INDEX;
    State.round.modeConfig.vehiclesT1 = READY_DIALOG_VEHICLE_OPTIONS[READY_DIALOG_MODE_PRESET_VEHICLE_INDEX];
    State.round.modeConfig.vehiclesT2 = READY_DIALOG_VEHICLE_OPTIONS[READY_DIALOG_MODE_PRESET_VEHICLE_INDEX];

    State.round.modeConfig.aircraftCeiling = State.round.aircraftCeiling.mapDefaultHudCeiling;
    State.round.modeConfig.aircraftCeilingOverridePending = false;
    State.round.modeConfig.gameSettings = mod.stringkeys.twl.readyDialog.modeSettingAircraftCeilingFormat;

    suppressReadyDialogModeAutoSwitch = false;

    updateReadyDialogModeConfigForAllVisibleViewers();
    updateSettingsSummaryHudForAllPlayers();
    return true;
}

function setReadyDialogGameModeIndex(nextIndex: number, applyPreset: boolean = true): void {
    const count = READY_DIALOG_GAME_MODE_OPTIONS.length;
    if (count <= 0) return;
    const clamped = ((nextIndex % count) + count) % count;
    State.round.modeConfig.gameModeIndex = clamped;
    State.round.modeConfig.gameMode = READY_DIALOG_GAME_MODE_OPTIONS[clamped];
    if (applyPreset) {
        const applied = applyReadyDialogModePresetForGameMode(State.round.modeConfig.gameMode);
        if (applied) return;
    }
    updateReadyDialogModeConfigForAllVisibleViewers();
    updateSettingsSummaryHudForAllPlayers();
}

function setReadyDialogAircraftCeiling(nextValue: number, _changedBy?: mod.Player): void {
    ensureCustomGameModeForManualChange();
    const clamped = Math.max(
        READY_DIALOG_AIRCRAFT_CEILING_MIN,
        Math.min(READY_DIALOG_AIRCRAFT_CEILING_MAX, Math.floor(nextValue))
    );
    State.round.modeConfig.aircraftCeiling = clamped;
    State.round.modeConfig.aircraftCeilingOverridePending = true;
    State.round.modeConfig.gameSettings = mod.stringkeys.twl.readyDialog.modeSettingAircraftCeilingFormat;
    updateReadyDialogModeConfigForAllVisibleViewers();
}

function setReadyDialogVehicleIndexT1(nextIndex: number): void {
    const count = READY_DIALOG_VEHICLE_OPTIONS.length;
    if (count <= 0) return;
    ensureCustomGameModeForManualChange();
    const clamped = ((nextIndex % count) + count) % count;
    State.round.modeConfig.vehicleIndexT1 = clamped;
    State.round.modeConfig.vehiclesT1 = READY_DIALOG_VEHICLE_OPTIONS[clamped];
    updateReadyDialogModeConfigForAllVisibleViewers();
}

function setReadyDialogVehicleIndexT2(nextIndex: number): void {
    const count = READY_DIALOG_VEHICLE_OPTIONS.length;
    if (count <= 0) return;
    ensureCustomGameModeForManualChange();
    const clamped = ((nextIndex % count) + count) % count;
    State.round.modeConfig.vehicleIndexT2 = clamped;
    State.round.modeConfig.vehiclesT2 = READY_DIALOG_VEHICLE_OPTIONS[clamped];
    updateReadyDialogModeConfigForAllVisibleViewers();
}

// TODO(1.0): Deprecated by "Fresh Respawn Setup" button; remove before final 1.0 release.
function resetReadyDialogVehicleOverrides(): void {
    State.round.modeConfig.vehicleIndexT1 = READY_DIALOG_VEHICLE_T1_DEFAULT_INDEX;
    State.round.modeConfig.vehicleIndexT2 = READY_DIALOG_VEHICLE_T2_DEFAULT_INDEX;
    State.round.modeConfig.vehiclesT1 = READY_DIALOG_VEHICLE_OPTIONS[READY_DIALOG_VEHICLE_T1_DEFAULT_INDEX];
    State.round.modeConfig.vehiclesT2 = READY_DIALOG_VEHICLE_OPTIONS[READY_DIALOG_VEHICLE_T2_DEFAULT_INDEX];
    State.round.modeConfig.confirmed.vehicleIndexT1 = READY_DIALOG_VEHICLE_T1_DEFAULT_INDEX;
    State.round.modeConfig.confirmed.vehicleIndexT2 = READY_DIALOG_VEHICLE_T2_DEFAULT_INDEX;
    State.round.modeConfig.confirmed.vehiclesT1 = READY_DIALOG_VEHICLE_OPTIONS[READY_DIALOG_VEHICLE_T1_DEFAULT_INDEX];
    State.round.modeConfig.confirmed.vehiclesT2 = READY_DIALOG_VEHICLE_OPTIONS[READY_DIALOG_VEHICLE_T2_DEFAULT_INDEX];
    State.round.modeConfig.confirmed.vehicleOverrideEnabled = false;
    refreshVehicleSpawnSpecsFromModeConfig();
    applyVehicleSpawnSpecsToExistingSlots();
    updateReadyDialogModeConfigForAllVisibleViewers();
    updateSettingsSummaryHudForAllPlayers();
}

function confirmReadyDialogModeConfig(changedBy?: mod.Player): void {
    const cfg = State.round.modeConfig;
    const prevConfirmed = cfg.confirmed.aircraftCeiling;
    const prevGameMode = cfg.confirmed.gameMode;
    // Confirm is authoritative: it can force Custom if settings diverge from presets
    // and it is the only place we apply ceiling + vehicle overrides.
    if (!isReadyDialogGameModeCustom(cfg.gameMode) && !isReadyDialogModePresetActive(cfg.gameMode)) {
        cfg.gameModeIndex = READY_DIALOG_GAME_MODE_CUSTOM_INDEX;
        cfg.gameMode = READY_DIALOG_GAME_MODE_OPTIONS[READY_DIALOG_GAME_MODE_CUSTOM_INDEX];
    }
    const nextCeilingOverrideEnabled =
        cfg.confirmed.aircraftCeilingOverrideEnabled || cfg.aircraftCeilingOverridePending;
    const applyCustomCeiling = shouldApplyCustomCeilingForConfig(cfg.gameMode, nextCeilingOverrideEnabled);
    const isMapDefaultVehicle = cfg.vehicleIndexT1 === READY_DIALOG_VEHICLE_MAP_DEFAULT_INDEX;
    // Keep the selected heli override consistent across teams when confirming.
    cfg.vehicleIndexT2 = cfg.vehicleIndexT1;
    cfg.vehiclesT2 = cfg.vehiclesT1;
    cfg.confirmed = {
        gameMode: cfg.gameMode,
        gameSettings: cfg.gameSettings,
        vehiclesT1: cfg.vehiclesT1,
        vehiclesT2: cfg.vehiclesT1,
        aircraftCeiling: cfg.aircraftCeiling,
        aircraftCeilingOverrideEnabled: nextCeilingOverrideEnabled,
        vehicleIndexT1: cfg.vehicleIndexT1,
        vehicleIndexT2: cfg.vehicleIndexT1,
        vehicleOverrideEnabled: !isMapDefaultVehicle,
    };
    refreshOvertimeZonesFromMapConfig();
    // Apply custom ceiling only after the user confirms settings; enforcement runs while enabled.
    if (!applyCustomCeiling) {
        disableCustomAircraftCeilingAndRestoreDefault();
    } else {
        enableCustomAircraftCeiling();
        if (AIRCRAFT_CEILING_ENFORCEMENT_MODE === "hard") {
            applyCustomAircraftCeilingHardLimiter();
        }
    }
    if (changedBy && cfg.confirmed.aircraftCeiling !== prevConfirmed) {
        sendHighlightedWorldLogMessage(
            mod.Message(STR_READY_DIALOG_AIRCRAFT_CEILING_CHANGED, changedBy, Math.floor(cfg.confirmed.aircraftCeiling)),
            true,
            undefined,
            STR_READY_DIALOG_AIRCRAFT_CEILING_CHANGED
        );
    }
    if (changedBy && cfg.confirmed.gameMode !== prevGameMode) {
        sendHighlightedWorldLogMessage(
            mod.Message(STR_READY_DIALOG_GAME_MODE_CHANGED, changedBy, cfg.confirmed.gameMode),
            true,
            undefined,
            STR_READY_DIALOG_GAME_MODE_CHANGED
        );
    }
    refreshVehicleSpawnSpecsFromModeConfig();
    applyVehicleSpawnSpecsToExistingSlots();
    updateSettingsSummaryHudForAllPlayers();
}

//#endregion ----------------- Ready Dialog - Mode Presets + Confirm --------------------



//#region -------------------- Ready Dialog - Team/Matchup Readouts + Summary HUD --------------------

function updateTeamNameWidgetsForPid(pid: number): void {
    const t1NameKey = getTeamNameKey(TeamID.Team1);
    const t2NameKey = getTeamNameKey(TeamID.Team2);

    const hudT1 = safeFind(`TeamLeft_Name_${pid}`);
    const hudT2 = safeFind(`TeamRight_Name_${pid}`);
    if (hudT1) mod.SetUITextLabel(hudT1, mod.Message(t1NameKey));
    if (hudT2) mod.SetUITextLabel(hudT2, mod.Message(t2NameKey));

    const readyT1 = safeFind(UI_READY_DIALOG_TEAM1_LABEL_ID + pid);
    const readyT2 = safeFind(UI_READY_DIALOG_TEAM2_LABEL_ID + pid);
    if (readyT1) mod.SetUITextLabel(readyT1, mod.Message(t1NameKey));
    if (readyT2) mod.SetUITextLabel(readyT2, mod.Message(t2NameKey));

    updateReadyDialogModeConfigForPid(pid);
}

function updateTeamNameWidgetsForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        updateTeamNameWidgetsForPid(mod.GetObjId(p));
    }
    updateSettingsSummaryHudForAllPlayers();
}

function updateMatchupLabelForPid(pid: number): void {
    const labelId = UI_READY_DIALOG_MATCHUP_LABEL_ID + pid;
    const labelWidget = safeFind(labelId);
    if (!labelWidget) return;
    const preset = MATCHUP_PRESETS[State.round.matchupPresetIndex];
    mod.SetUITextLabel(
        labelWidget,
        mod.Message(mod.stringkeys.twl.readyDialog.matchupFormat, preset.leftPlayers, preset.rightPlayers)
    );
}

// Refreshes the matchup label (e.g., "1 vs 1") for every active player HUD.
function updateMatchupLabelForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        updateMatchupLabelForPid(mod.GetObjId(p));
    }
}

// Resolves the per-side + total player requirements from the auto-start setting.
// Special case: value 0 represents "1 vs 0" to allow solo starts.
function getAutoStartMinPlayerCounts(): { left: number; right: number; total: number } {
    const perSide = Math.floor(State.round.autoStartMinActivePlayers);
    if (perSide <= 0) {
        return { left: 1, right: 0, total: 1 };
    }
    return { left: perSide, right: perSide, total: perSide * 2 };
}

// Updates per-player Ready dialog readouts (target kills + players-per-side) for a single pid.
function updateMatchupReadoutsForPid(pid: number): void {
    const minPlayersWidget = safeFind(UI_READY_DIALOG_MATCHUP_MINPLAYERS_ID + pid);
    const minPlayersTotalWidget = safeFind(UI_READY_DIALOG_MATCHUP_MINPLAYERS_TOTAL_ID + pid);
    const killsTargetWidget = safeFind(UI_READY_DIALOG_MATCHUP_KILLSTARGET_ID + pid);
    const counts = getAutoStartMinPlayerCounts();
    if (minPlayersWidget) {
        mod.SetUITextLabel(
            minPlayersWidget,
            mod.Message(mod.stringkeys.twl.readyDialog.playersFormat, counts.left, counts.right)
        );
    }
    if (minPlayersTotalWidget) {
        mod.SetUITextLabel(
            minPlayersTotalWidget,
            mod.Message(mod.stringkeys.twl.readyDialog.minPlayersToStartFormat, counts.total)
        );
    }
    if (killsTargetWidget) {
        mod.SetUITextLabel(
            killsTargetWidget,
            mod.Message(mod.stringkeys.twl.readyDialog.targetKillsToWinFormat, Math.floor(State.round.killsTarget))
        );
    }
}

// Refreshes the matchup readouts for all players with a Ready dialog HUD.
function updateMatchupReadoutsForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        updateMatchupReadoutsForPid(mod.GetObjId(p));
    }
    updateSettingsSummaryHudForAllPlayers();
}

// Uses confirmed mode settings only (pending Ready dialog tweaks are not shown here).
function updateSettingsSummaryHudForPid(pid: number): void {
    const refs = State.hudCache.hudByPid[pid];
    if (!refs) return;

    const cfg = State.round.modeConfig;
    const gameModeValue = cfg.confirmed.gameMode;
    const applyCustomCeiling = shouldApplyCustomCeilingForConfig(gameModeValue, cfg.confirmed.aircraftCeilingOverrideEnabled);
    const ceilingValue = applyCustomCeiling
        ? Math.floor(cfg.confirmed.aircraftCeiling)
        : STR_READY_DIALOG_AIRCRAFT_CEILING_VANILLA;
    const vehiclesT1Value = cfg.confirmed.vehiclesT1;
    const vehiclesT2Value = cfg.confirmed.vehiclesT2;

    const preset = MATCHUP_PRESETS[State.round.matchupPresetIndex] ?? MATCHUP_PRESETS[0];
    const vehiclesLeft = preset?.leftPlayers ?? 1;
    const vehiclesRight = preset?.rightPlayers ?? 1;
    const autoStartCounts = getAutoStartMinPlayerCounts();

    if (refs.settingsGameModeText) {
        mod.SetUITextLabel(refs.settingsGameModeText, mod.Message(STR_HUD_SETTINGS_GAME_MODE_FORMAT, gameModeValue));
    }
    if (refs.settingsAircraftCeilingText) {
        mod.SetUITextLabel(refs.settingsAircraftCeilingText, mod.Message(STR_HUD_SETTINGS_AIRCRAFT_CEILING_FORMAT, ceilingValue));
    }
    if (refs.settingsVehiclesT1Text) {
        mod.SetUITextLabel(
            refs.settingsVehiclesT1Text,
            mod.Message(STR_HUD_SETTINGS_VEHICLES_TEAM_FORMAT, getTeamNameKey(TeamID.Team1), vehiclesT1Value)
        );
    }
    if (refs.settingsVehiclesT2Text) {
        mod.SetUITextLabel(
            refs.settingsVehiclesT2Text,
            mod.Message(STR_HUD_SETTINGS_VEHICLES_TEAM_FORMAT, getTeamNameKey(TeamID.Team2), vehiclesT2Value)
        );
    }
    if (refs.settingsVehiclesMatchupText) {
        mod.SetUITextLabel(refs.settingsVehiclesMatchupText, mod.Message(STR_HUD_SETTINGS_VEHICLES_MATCHUP_FORMAT, vehiclesLeft, vehiclesRight));
    }
    if (refs.settingsPlayersText) {
        mod.SetUITextLabel(refs.settingsPlayersText, mod.Message(STR_HUD_SETTINGS_PLAYERS_FORMAT, autoStartCounts.left, autoStartCounts.right));
    }
}

function updateSettingsSummaryHudForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        updateSettingsSummaryHudForPid(mod.GetObjId(p));
    }
}

function setAutoStartMinActivePlayers(value: number, eventPlayer?: mod.Player): void {
    const clamped = Math.max(AUTO_START_MIN_ACTIVE_PLAYERS_MIN, Math.min(AUTO_START_MIN_ACTIVE_PLAYERS_MAX, Math.floor(value)));
    if (clamped === State.round.autoStartMinActivePlayers) return;
    ensureCustomGameModeForManualChange();
    State.round.autoStartMinActivePlayers = clamped;
    updateMatchupReadoutsForAllPlayers();
    if (eventPlayer) {
        const counts = getAutoStartMinPlayerCounts();
        sendHighlightedWorldLogMessage(
            mod.Message(STR_READY_DIALOG_PLAYERS_CHANGED, eventPlayer, counts.left, counts.right),
            true,
            undefined,
            STR_READY_DIALOG_PLAYERS_CHANGED
        );
        tryAutoStartRoundIfAllReady(eventPlayer);
    }
}

// Applies the selected matchup preset, updates UI/state, and re-enables spawners (not-live only).
function applyMatchupPresetInternal(
    index: number,
    eventPlayer?: mod.Player,
    announce: boolean = true,
    bypassCooldown: boolean = false
): void {
    const clamped = Math.max(0, Math.min(MATCHUP_PRESETS.length - 1, Math.floor(index)));
    if (clamped === State.round.matchupPresetIndex) return;
    if (State.vehicles.spawnSequenceInProgress) return;
    const now = Math.floor(mod.GetMatchTimeElapsed());
    if (!bypassCooldown && now - State.round.lastMatchupChangeAtSeconds < MATCHUP_CHANGE_COOLDOWN_SECONDS) return;
    if (announce) {
        ensureCustomGameModeForManualChange();
    }
    const preset = MATCHUP_PRESETS[clamped];
    State.round.matchupPresetIndex = clamped;
    State.round.lastMatchupChangeAtSeconds = now;
    State.round.killsTarget = preset.roundKillsTarget;

    updateMatchupLabelForAllPlayers();
    updateMatchupReadoutsForAllPlayers();
    setRoundStateTextForAllPlayers();
    syncRoundKillsTargetTesterValueForAllPlayers();

    if (announce && eventPlayer) {
        sendHighlightedWorldLogMessage(
            mod.Message(STR_READY_DIALOG_MATCHUP_CHANGED, eventPlayer, preset.leftPlayers, preset.rightPlayers),
            true,
            undefined,
            STR_READY_DIALOG_MATCHUP_CHANGED
        );
    }

    applySpawnerEnablementForMatchup(clamped, true);

    // If the new minimum is satisfied, auto-start when all active players are ready.
    if (announce && eventPlayer) {
        tryAutoStartRoundIfAllReady(eventPlayer);
    }
}

// Applies the selected matchup preset, updates UI/state, and re-enables spawners (not-live only).
function applyMatchupPreset(index: number, eventPlayer: mod.Player): void {
    applyMatchupPresetInternal(index, eventPlayer, true, false);
}

/* Dead function - commenting out for now to ensure we can kill it
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
*/

//#endregion ----------------- Ready Dialog - Team/Matchup Readouts + Summary HUD --------------------



//#region -------------------- Join Prompt - IDs + Gating --------------------

function joinPromptRootName(pid: number): string { return "join_prompt_root_" + pid; }
function joinPromptPanelName(pid: number): string { return "join_prompt_panel_" + pid; }
function joinPromptTitleName(pid: number): string { return "join_prompt_title_" + pid; }
function joinPromptBodyName(pid: number): string { return "join_prompt_body_" + pid; }
function joinPromptButtonName(pid: number): string { return "join_prompt_dismiss_" + pid; }
function joinPromptButtonBorderName(pid: number): string { return joinPromptButtonName(pid) + "_BORDER"; }
function joinPromptButtonTextName(pid: number): string { return "join_prompt_dismiss_text_" + pid; }
function joinPromptNeverShowButtonName(pid: number): string { return "join_prompt_never_show_" + pid; }
function joinPromptNeverShowButtonBorderName(pid: number): string { return joinPromptNeverShowButtonName(pid) + "_BORDER"; }
function joinPromptNeverShowButtonTextName(pid: number): string { return "join_prompt_never_show_text_" + pid; }

function deleteJoinPromptWidget(name: string): void {
    const w = safeFind(name);
    if (!w) return;
    // Best-effort delete: widget may already be gone during undeploy/reconnect churn.
    try {
        mod.DeleteUIWidget(w);
    } catch {
        // Intentionally silent to avoid engine-side crashes on invalid handles.
    }
}

function isJoinPromptSuppressedForPlayer(pid: number): boolean {
    return !!State.players.joinPromptNeverShowByPidMap[pid]?.[ACTIVE_MAP_KEY];
}

// Persist "Never Show Again" per-map so other maps can still show the prompt
function setJoinPromptSuppressedForPlayer(pid: number): void {
    if (!State.players.joinPromptNeverShowByPidMap[pid]) {
        State.players.joinPromptNeverShowByPidMap[pid] = {};
    }
    State.players.joinPromptNeverShowByPidMap[pid][ACTIVE_MAP_KEY] = true;
}

// Lightweight gating used for both join-time and undeploy prompts (join-time "only once" is tracked separately).
function shouldShowJoinPromptForPlayer(player: mod.Player): boolean {
    if (!SHOW_HELP_TEXT_PROMPT_ON_JOIN) return false;
    if (!player || !mod.IsPlayerValid(player)) return false;
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return false;
    if (isJoinPromptSuppressedForPlayer(pid)) return false;
    if (safeFind(joinPromptRootName(pid))) return false;
    return true;
}

// Join prompt sequencing helpers:
// These keep the prompt flow deterministic and low-risk by only adjusting
// in-memory per-player state and selecting string keys accordingly.
function ensureJoinPromptStateForPid(pid: number): void {
    if (State.players.joinPromptReadyDialogOpenedByPid[pid] === undefined) {
        State.players.joinPromptReadyDialogOpenedByPid[pid] = false;
    }
    if (State.players.joinPromptTipIndexByPid[pid] === undefined) {
        State.players.joinPromptTipIndexByPid[pid] = 0;
    }
    if (State.players.joinPromptTipsUnlockedByPid[pid] === undefined) {
        State.players.joinPromptTipsUnlockedByPid[pid] = false;
    }
}

// Marks that the player successfully opened the Ready Up dialog (true unlock event).
// Ensures the next prompt shows mandatory2 before tips begin.
function markJoinPromptReadyDialogOpened(pid: number): void {
    ensureJoinPromptStateForPid(pid);
    if (State.players.joinPromptReadyDialogOpenedByPid[pid]) return;
    State.players.joinPromptReadyDialogOpenedByPid[pid] = true;
    if ((State.players.joinPromptTipIndexByPid[pid] ?? 0) < 1) {
        State.players.joinPromptTipIndexByPid[pid] = 1;
    }
}

// Arms a one-shot flag when a player triggers the triple-tap detector.
// This lets us require the multi-click path before unlocking join prompt tips.
function armJoinPromptTripleTapForPid(pid: number): void {
    State.players.joinPromptTripleTapArmedByPid[pid] = true;
}

function consumeJoinPromptTripleTapForPid(pid: number): boolean {
    if (!State.players.joinPromptTripleTapArmedByPid[pid]) return false;
    State.players.joinPromptTripleTapArmedByPid[pid] = false;
    return true;
}

function isJoinPromptBodyKeySkipped(key: number): boolean {
    return JOIN_PROMPT_BODY_SEQUENCE_SKIP_KEYS.indexOf(key) !== -1;
}

function findNextJoinPromptSequenceIndex(startIndex: number): number {
    const max = JOIN_PROMPT_BODY_SEQUENCE_KEYS.length;
    if (max <= 0) return 0;
    for (let offset = 0; offset < max; offset++) {
        const idx = (startIndex + offset) % max;
        const key = JOIN_PROMPT_BODY_SEQUENCE_KEYS[idx];
        if (!isJoinPromptBodyKeySkipped(key)) return idx;
    }
    return 0;
}

// Returns the clamped sequence index for this player.
function getJoinPromptSequenceIndexForPid(pid: number): number {
    ensureJoinPromptStateForPid(pid);
    const raw = Math.floor(State.players.joinPromptTipIndexByPid[pid] ?? 0);
    const max = JOIN_PROMPT_BODY_SEQUENCE_KEYS.length;
    const clamped = (raw >= 0 && raw < max) ? raw : 0;
    const resolved = findNextJoinPromptSequenceIndex(clamped);
    State.players.joinPromptTipIndexByPid[pid] = resolved;
    return resolved;
}

// Selects the body key for the prompt based on unlock + sequence state.
function getJoinPromptBodyKeyForPid(pid: number): number {
    ensureJoinPromptStateForPid(pid);
    if (!State.players.joinPromptReadyDialogOpenedByPid[pid]) {
        return STR_JOIN_PROMPT_BODY_MANDATORY1;
    }
    const index = getJoinPromptSequenceIndexForPid(pid);
    if (index >= 2) {
        State.players.joinPromptTipsUnlockedByPid[pid] = true;
    }
    return JOIN_PROMPT_BODY_SEQUENCE_KEYS[index];
}

// Chooses the dismiss label based on whether tips are unlocked.
function getJoinPromptDismissLabelKeyForPid(pid: number): number {
    ensureJoinPromptStateForPid(pid);
    return State.players.joinPromptTipsUnlockedByPid[pid]
        ? STR_JOIN_PROMPT_DISMISS_SHOW_MORE_TIPS
        : STR_JOIN_PROMPT_DISMISS;
}

// Never Show Again is only available after tips are unlocked.
function shouldShowJoinPromptNeverShowButtonForPid(pid: number): boolean {
    ensureJoinPromptStateForPid(pid);
    return State.players.joinPromptReadyDialogOpenedByPid[pid] && State.players.joinPromptTipsUnlockedByPid[pid];
}

// Advances the sequence only after the player has unlocked tips.
function advanceJoinPromptSequenceOnDismiss(pid: number): void {
    ensureJoinPromptStateForPid(pid);
    if (!State.players.joinPromptReadyDialogOpenedByPid[pid]) {
        State.players.joinPromptTipIndexByPid[pid] = 0;
        return;
    }
    const current = getJoinPromptSequenceIndexForPid(pid);
    const next = findNextJoinPromptSequenceIndex(current + 1);
    State.players.joinPromptTipIndexByPid[pid] = next;
    if (next >= 2) {
        State.players.joinPromptTipsUnlockedByPid[pid] = true;
    }
}

//#endregion ----------------- Join Prompt - IDs + Gating --------------------



//#region -------------------- Join Prompt - Layout --------------------

// Builds the join overlay, blocks deploy, and enables UI input until dismissed.
function createJoinPromptForPlayer(player: mod.Player): void {
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return;
    const uiRoot = mod.GetUIRoot();
    const bodyKey = getJoinPromptBodyKeyForPid(pid);
    const dismissLabelKey = getJoinPromptDismissLabelKeyForPid(pid);
    const showNeverShow = shouldShowJoinPromptNeverShowButtonForPid(pid);

    deleteJoinPromptWidget(joinPromptRootName(pid));
    deleteJoinPromptWidget(joinPromptButtonBorderName(pid));
    deleteJoinPromptWidget(joinPromptNeverShowButtonBorderName(pid));

    mod.EnablePlayerDeploy(player, false);
    setUIInputModeForPlayer(player, true);

    mod.AddUIContainer(
        joinPromptRootName(pid),
        mod.CreateVector(0, 0, 0),
        mod.CreateVector(1920, 1080, 0),
        mod.UIAnchor.Center,
        uiRoot,
        true,
        0,
        mod.CreateVector(0, 0, 0),
        0.55,
        mod.UIBgFill.Solid,
        mod.UIDepth.AboveGameUI,
        player
    );

    const root = safeFind(joinPromptRootName(pid));
    if (root) mod.SetUIWidgetDepth(root, mod.UIDepth.AboveGameUI);
    if (root) reparentSpawnDisabledLiveTextForPid(pid, root);

    const joinPromptPanelOffsetY = -54;
    const joinPromptButtonOffsetY = 173;

    mod.AddUIContainer(
        joinPromptPanelName(pid),
        mod.CreateVector(0, joinPromptPanelOffsetY, 0),
        mod.CreateVector(900, 444, 0),
        mod.UIAnchor.Center,
        root ?? uiRoot,
        true,
        0,
        mod.CreateVector(0.08, 0.08, 0.08),
        0.95,
        mod.UIBgFill.Solid,
        mod.UIDepth.AboveGameUI,
        player
    );

    const panel = safeFind(joinPromptPanelName(pid));
    if (panel) mod.SetUIWidgetDepth(panel, mod.UIDepth.AboveGameUI);

    mod.AddUIText(
        joinPromptTitleName(pid),
        mod.CreateVector(0, -192, 0),
        mod.CreateVector(820, 60, 0),
        mod.UIAnchor.Center,
        panel ?? uiRoot,
        true,
        0,
        mod.CreateVector(0, 0, 0),
        0,
        mod.UIBgFill.None,
        mod.Message(STR_JOIN_PROMPT_TITLE),
        42,
        mod.CreateVector(1, 1, 1),
        1,
        mod.UIAnchor.Center,
        mod.UIDepth.AboveGameUI,
        player
    );

    mod.AddUIText(
        joinPromptBodyName(pid),
        mod.CreateVector(0, 0, 0),
        mod.CreateVector(740, 300, 0), // 900-wide panel with 80px side inset on each side
        mod.UIAnchor.Center,
        panel ?? uiRoot,
        true,
        0,
        mod.CreateVector(0, 0, 0),
        0,
        mod.UIBgFill.None,
        mod.Message(bodyKey),
        22,
        mod.CreateVector(1, 1, 1),
        1,
        mod.UIAnchor.TopLeft,
        mod.UIDepth.AboveGameUI,
        player
    );

    const neverShowBorder = addOutlinedButton(
        joinPromptNeverShowButtonName(pid),
        -200,
        joinPromptButtonOffsetY,
        360,
        70,
        mod.UIAnchor.Center,
        panel ?? uiRoot,
        player
    );

    const neverShowButton = safeFind(joinPromptNeverShowButtonName(pid));
    if (neverShowButton) {
        mod.SetUIWidgetDepth(neverShowButton, mod.UIDepth.AboveGameUI);
        mod.SetUIWidgetVisible(neverShowButton, showNeverShow);
        mod.EnableUIButtonEvent(neverShowButton, mod.UIButtonEvent.ButtonUp, showNeverShow);
    }
    const neverShowBorderWidget = safeFind(joinPromptNeverShowButtonBorderName(pid));
    if (neverShowBorderWidget) {
        mod.SetUIWidgetDepth(neverShowBorderWidget, mod.UIDepth.AboveGameUI);
        mod.SetUIWidgetVisible(neverShowBorderWidget, showNeverShow);
    }

    const neverShowTextParent = neverShowBorder ?? panel ?? uiRoot;
    const neverShowText = addCenteredButtonText(
        joinPromptNeverShowButtonTextName(pid),
        360,
        70,
        mod.Message(STR_JOIN_PROMPT_NEVER_SHOW),
        player,
        neverShowTextParent
    );
    if (neverShowText) {
        mod.SetUITextSize(neverShowText, 24);
        mod.SetUITextColor(neverShowText, mod.CreateVector(1, 1, 1));
        mod.SetUIWidgetDepth(neverShowText, mod.UIDepth.AboveGameUI);
        mod.SetUIWidgetParent(neverShowText, neverShowTextParent);
        mod.SetUIWidgetPosition(
            neverShowText,
            neverShowBorder ? mod.CreateVector(0, 0, 0) : mod.CreateVector(-200, joinPromptButtonOffsetY, 0)
        );
        mod.SetUIWidgetVisible(neverShowText, showNeverShow);
    }

    const dismissBorder = addOutlinedButton(
        joinPromptButtonName(pid),
        200,
        joinPromptButtonOffsetY,
        360,
        70,
        mod.UIAnchor.Center,
        panel ?? uiRoot,
        player
    );

    const dismissButton = safeFind(joinPromptButtonName(pid));
    if (dismissButton) {
        mod.SetUIWidgetDepth(dismissButton, mod.UIDepth.AboveGameUI);
        mod.EnableUIButtonEvent(dismissButton, mod.UIButtonEvent.ButtonUp, true);
    }
    const dismissBorderWidget = safeFind(joinPromptButtonBorderName(pid));
    if (dismissBorderWidget) mod.SetUIWidgetDepth(dismissBorderWidget, mod.UIDepth.AboveGameUI);

    const dismissTextParent = dismissBorder ?? panel ?? uiRoot;
    const dismissText = addCenteredButtonText(
        joinPromptButtonTextName(pid),
        360,
        70,
        mod.Message(dismissLabelKey),
        player,
        dismissTextParent
    );
    if (dismissText) {
        mod.SetUITextSize(dismissText, 24);
        mod.SetUITextColor(dismissText, mod.CreateVector(1, 1, 1));
        mod.SetUIWidgetDepth(dismissText, mod.UIDepth.AboveGameUI);
        mod.SetUIWidgetParent(dismissText, dismissTextParent);
        mod.SetUIWidgetPosition(
            dismissText,
            dismissBorder ? mod.CreateVector(0, 0, 0) : mod.CreateVector(200, joinPromptButtonOffsetY, 0)
        );
    }
}

//#endregion ----------------- Join Prompt - Layout --------------------



//#region -------------------- Join Prompt - Lifecycle + Events --------------------

// Respects round/cleanup locks when re-enabling deploy after dismiss.
function canEnableDeployAfterJoinPrompt(): boolean {
    if (State.round.flow.cleanupActive && !State.round.flow.cleanupAllowDeploy) return false;
    if (isLiveRespawnDisabled() && isRoundLive()) return false;
    return true;
}

// Dismisses the overlay and restores input/deploy based on current locks.
function dismissJoinPromptForPlayer(player: mod.Player): void {
    const pid = mod.GetObjId(player);

    setUIInputModeForPlayer(player, false);
    mod.EnablePlayerDeploy(player, canEnableDeployAfterJoinPrompt());
    reparentSpawnDisabledLiveTextForPid(pid, mod.GetUIRoot());

    deleteJoinPromptWidget(joinPromptButtonTextName(pid));
    deleteJoinPromptWidget(joinPromptButtonName(pid));
    deleteJoinPromptWidget(joinPromptButtonBorderName(pid));
    deleteJoinPromptWidget(joinPromptNeverShowButtonTextName(pid));
    deleteJoinPromptWidget(joinPromptNeverShowButtonName(pid));
    deleteJoinPromptWidget(joinPromptNeverShowButtonBorderName(pid));
    deleteJoinPromptWidget(joinPromptBodyName(pid));
    deleteJoinPromptWidget(joinPromptTitleName(pid));
    deleteJoinPromptWidget(joinPromptPanelName(pid));
    deleteJoinPromptWidget(joinPromptRootName(pid));
}

// Hard cleanup for disconnects (removes any prompt widgets for that pid).
function clearJoinPromptForPlayerId(playerId: number): void {
    reparentSpawnDisabledLiveTextForPid(playerId, mod.GetUIRoot());
    deleteJoinPromptWidget(joinPromptButtonTextName(playerId));
    deleteJoinPromptWidget(joinPromptButtonName(playerId));
    deleteJoinPromptWidget(joinPromptButtonBorderName(playerId));
    deleteJoinPromptWidget(joinPromptNeverShowButtonTextName(playerId));
    deleteJoinPromptWidget(joinPromptNeverShowButtonName(playerId));
    deleteJoinPromptWidget(joinPromptNeverShowButtonBorderName(playerId));
    deleteJoinPromptWidget(joinPromptBodyName(playerId));
    deleteJoinPromptWidget(joinPromptTitleName(playerId));
    deleteJoinPromptWidget(joinPromptPanelName(playerId));
    deleteJoinPromptWidget(joinPromptRootName(playerId));
}

// Button handler: dismisses when the OK button (or its children) is clicked.
function tryHandleJoinPromptButton(
    eventPlayer: mod.Player,
    eventUIWidget: mod.UIWidget,
    eventUIButtonEvent: mod.UIButtonEvent
): boolean {
    if (!SHOW_HELP_TEXT_PROMPT_ON_JOIN) return false;
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return false;
    if (!mod.Equals(eventUIButtonEvent, mod.UIButtonEvent.ButtonUp)) return false;

    const pid = mod.GetObjId(eventPlayer);
    const dismissId = joinPromptButtonName(pid);
    const neverShowId = joinPromptNeverShowButtonName(pid);
    let w: mod.UIWidget = eventUIWidget;
    for (let i = 0; i < 8; i++) {
        const name = mod.GetUIWidgetName(w);
        if (name === dismissId) {
            advanceJoinPromptSequenceOnDismiss(pid);
            dismissJoinPromptForPlayer(eventPlayer);
            return true;
        }
        if (name === neverShowId) {
            setJoinPromptSuppressedForPlayer(pid);
            dismissJoinPromptForPlayer(eventPlayer);
            return true;
        }
        const parent = mod.GetUIWidgetParent(w);
        if (!parent) break;
        w = parent;
    }
    return false;
}

//#endregion ----------------- Join Prompt - Lifecycle + Events --------------------



//#region -------------------- Ready Dialog - Ready State Reset --------------------

// Resets all players to NOT READY. Called when a round ends (including match-end paths) so the next round requires a fresh ready-up cycle.
function resetReadyStateForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const pid = mod.GetObjId(p);
        State.players.readyByPid[pid] = false;
        delete State.players.overTakeoffLimitByPid[pid];
        // Keep the HUD "X / Y PLAYERS READY" line in sync on every ready-state change.
        updatePlayersReadyHudTextForAllPlayers();
    }
    // If any dialogs are open, reflect the reset immediately.
    renderReadyDialogForAllVisibleViewers();
    updatePlayersReadyHudTextForAllPlayers();
}

//#endregion -------------------- Ready Dialog - Ready State Reset --------------------



//#region -------------------- Ready Dialog - Takeoff Limit Gating --------------------

function isPlayerInMainBaseForReady(pid: number): boolean {
    const inBase = (State.players.inMainBaseByPid[pid] !== undefined) ? State.players.inMainBaseByPid[pid] : true;
    if (State.players.overTakeoffLimitByPid[pid]) return false;
    return inBase;
}

async function showOverTakeoffMessageForAllPlayers(offender: mod.Player): Promise<void> {
    const offenderToken = (offender && mod.IsPlayerValid(offender))
        ? offender
        : mod.stringkeys.twl.system.unknownPlayer;
    await showGlobalTitleSubtitleMessageForAllPlayers(
        mod.Message(STR_OVERLINE_TAKEOFF_TITLE, offenderToken),
        mod.Message(STR_OVERLINE_TAKEOFF_SUBTITLE, offenderToken),
        COLOR_NOT_READY_RED,
        COLOR_WARNING_YELLOW
    );
}

function checkTakeoffLimitForAllPlayers(): void {
    if (State.match.isEnded) return;
    if (isRoundLive()) return;

    const floorY = Math.floor(State.round.aircraftCeiling.hudFloorY);
    const limitY = floorY + TAKEOFF_LIMIT_HUD_OFFSET;

    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const pid = safeGetPlayerId(p);
        if (pid === undefined) continue;

        if (!isPlayerDeployed(p)) {
            delete State.players.overTakeoffLimitByPid[pid];
            continue;
        }

        const pos = safeGetSoldierStateVector(p, mod.SoldierStateVector.GetPosition);
        if (!pos) continue;
        const posY = mod.YComponentOf(pos);
        const currentlyOver = !!State.players.overTakeoffLimitByPid[pid];
        const overLimit = posY > limitY;

        if (overLimit && !currentlyOver && isPlayerInMainBaseForReady(pid)) {
            State.players.overTakeoffLimitByPid[pid] = true;
            State.players.readyByPid[pid] = false;
            updatePlayersReadyHudTextForAllPlayers();
            updateHelpTextVisibilityForPid(pid);
            if (State.round.countdown.isRequested) {
                cancelPregameCountdown();
                void showOverTakeoffMessageForAllPlayers(p);
            }
            sendHighlightedWorldLogMessage(
                mod.Message(STR_READYUP_RETURN_TO_BASE_NOT_LIVE, Math.floor(State.round.current)),
                false,
                p,
                STR_READYUP_RETURN_TO_BASE_NOT_LIVE
            );
            renderReadyDialogForAllVisibleViewers();
            continue;
        }

        if (!overLimit && currentlyOver) {
            delete State.players.overTakeoffLimitByPid[pid];
            renderReadyDialogForAllVisibleViewers();
        }
    }
}

//#endregion -------------------- Ready Dialog - Takeoff Limit Gating --------------------


//#region -------------------- Ready Dialog - Auto-Ready --------------------

// Applies auto-ready rules for a single player. Returns true if ready state changed.
function applyAutoReadyForPid(player: mod.Player, pid: number): boolean {
    if (!player || !mod.IsPlayerValid(player)) return false;
    if (!State.players.autoReadyByPid[pid]) return false;
    if (State.match.isEnded || isRoundLive()) return false;

    const inVehicle = isPlayerDeployed(player)
        ? safeGetSoldierStateBool(player, mod.SoldierStateBool.IsInVehicle)
        : false;
    const inBase = isPlayerInMainBaseForReady(pid);
    const shouldBeReady = !!inVehicle && inBase;
    const currentlyReady = !!State.players.readyByPid[pid];

    if (shouldBeReady === currentlyReady) return false;

    State.players.readyByPid[pid] = shouldBeReady;
    updateHelpTextVisibilityForPid(pid);

    if (shouldBeReady) {
        sendHighlightedWorldLogMessage(
            mod.Message(STR_PLAYER_AUTO_READIED_UP, player),
            true,
            undefined,
            STR_PLAYER_AUTO_READIED_UP
        );
    }
    return true;
}

// Applies auto-ready rules for all players who have auto-ready enabled.
function applyAutoReadyForAllPlayers(): void {
    if (State.match.isEnded || isRoundLive()) return;

    const nowSeconds = Math.floor(mod.GetMatchTimeElapsed());
    if (nowSeconds - lastAutoReadyCheckAtSeconds < AUTO_READY_CHECK_INTERVAL_SECONDS) return;
    lastAutoReadyCheckAtSeconds = nowSeconds;

    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    let anyChanged = false;

    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const pid = safeGetPlayerId(p);
        if (pid === undefined) continue;
        if (!State.players.autoReadyByPid[pid]) continue;
        if (applyAutoReadyForPid(p, pid)) anyChanged = true;
    }

    if (!anyChanged) return;

    updatePlayersReadyHudTextForAllPlayers();
    renderReadyDialogForAllVisibleViewers();
    tryAutoStartRoundIfAllReady();
}

//#endregion -------------------- Ready Dialog - Auto-Ready --------------------



//#region -------------------- Ready Dialog - Active Player Resolution + Roster --------------------

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

type RosterDisplayEntry = {
    player?: mod.Player;
    nameKey?: number;
};

type RosterDisplay_t = {
    team1: RosterDisplayEntry[];
    team2: RosterDisplayEntry[];
    maxRows: number;
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
    const pidByPlayer = new Map<mod.Player, number>();

    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        let pid: number;
        try {
            pid = mod.GetObjId(p);
        } catch {
            continue;
        }
        const teamNum = getTeamNumber(mod.GetTeam(p));
        // Only Team 1/2 are considered active for rosters/ready gating.
        if (teamNum !== TeamID.Team1 && teamNum !== TeamID.Team2) continue;

        pidByPlayer.set(p, pid);
        all.push(p);
        if (teamNum === TeamID.Team1) team1.push(p);
        else team2.push(p);
    }

    // Stable UI ordering: sort by pid (object id).
    // This prevents rows from shuffling across refreshes.
    const byPidCached = (a: mod.Player, b: mod.Player) => (pidByPlayer.get(a) ?? 0) - (pidByPlayer.get(b) ?? 0);
    all.sort(byPidCached);
    team1.sort(byPidCached);
    team2.sort(byPidCached);

    return { all, team1, team2 };
}

function buildRosterDisplayEntries(players: mod.Player[], debugCount: number): RosterDisplayEntry[] {
    const entries: RosterDisplayEntry[] = [];
    for (const p of players) entries.push({ player: p });

    const extraCount = Math.max(0, Math.floor(debugCount));
    for (let i = 0; i < extraCount; i++) {
        entries.push({ nameKey: DEBUG_TEST_PLACEHOLDER_NAME_KEY });
    }
    return entries;
}

function getRosterDisplayEntries(): RosterDisplay_t {
    const active = getActivePlayers();
    const team1 = buildRosterDisplayEntries(active.team1, DEBUG_TEST_NAMES_TEAM_1);
    const team2 = buildRosterDisplayEntries(active.team2, DEBUG_TEST_NAMES_TEAM_2);
    return { team1, team2, maxRows: Math.max(team1.length, team2.length) };
}

function getRosterEntryNameMessage(entry: RosterDisplayEntry | undefined): mod.Message {
    if (!entry) return mod.Message(mod.stringkeys.twl.system.genericCounter, "");
    if (entry.player) return mod.Message(mod.stringkeys.twl.readyDialog.playerNameFormat, entry.player);
    if (entry.nameKey) return mod.Message(entry.nameKey);
    return mod.Message(mod.stringkeys.twl.system.genericCounter, "");
}

function areAllActivePlayersReady(): boolean {
    const active = getActivePlayers();
    const activeCount = active.all.length;
    const requiredTotalPlayers = getAutoStartMinPlayerCounts().total;
    if (activeCount < requiredTotalPlayers) {
        if (activeCount !== 0) return false;

        // Fallback: if no Team 1/2 players are assigned yet (team 0 pre-deploy),
        // allow the ready check to use all valid players.
        const players = mod.AllPlayers();
        const count = mod.CountOf(players);
        let validCount = 0;
        for (let i = 0; i < count; i++) {
            const p = mod.ValueInArray(players, i) as mod.Player;
            if (!p || !mod.IsPlayerValid(p)) continue;
            const pid = safeGetPlayerId(p);
            if (pid === undefined) continue;
            if (!State.players.readyByPid[pid]) return false;
            validCount++;
        }
        return validCount >= requiredTotalPlayers;
    }

    for (const p of active.all) {
        const pid = safeGetPlayerId(p);
        if (pid === undefined) continue;
        if (!State.players.readyByPid[pid]) return false;
    }
    return true;
}

//#endregion -------------------- Ready Dialog - Active Player Resolution + Roster --------------------



//#region -------------------- Ready Dialog - Pregame Countdown UI --------------------

// Implements a synchronized pre-round 10-1-GO! countdown that starts the round on GO.
interface CountdownWidgetCacheEntry {
    rootName: string;
    widget?: mod.UIWidget;
}

function ensureCountdownUIAndGetWidget(player: mod.Player): mod.UIWidget | undefined {
    if (!player || !mod.IsPlayerValid(player)) return undefined;
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
        if (!p || !mod.IsPlayerValid(p)) continue;
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
        if (!p || !mod.IsPlayerValid(p)) continue;
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
        if (!p || !mod.IsPlayerValid(p)) continue;
        const w = ensureCountdownUIAndGetWidget(p);
        if (!w) continue;
        mod.SetUIWidgetVisible(w, false);
    }
}

//#endregion -------------------- Ready Dialog - Pregame Countdown UI --------------------



//#region -------------------- Ready Dialog - OverLine UI Widgets + Big Messages --------------------

function ensureOverLineTitleShadowUIAndGetWidget(player: mod.Player): mod.UIWidget | undefined {
    if (!player || !mod.IsPlayerValid(player)) return undefined;
    const pid = mod.GetObjId(player);
    const rootName = BIG_TITLE_SHADOW_WIDGET_ID + pid;

    const cached = State.hudCache.overLineTitleShadowWidgetCache[pid];
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
        position: [HUD_TEXT_SHADOW_OFFSET_X, BIG_TITLE_OFFSET_Y + HUD_TEXT_SHADOW_OFFSET_Y],
        size: [BIG_TITLE_BG_WIDTH, BIG_TITLE_BG_HEIGHT],
        anchor: mod.UIAnchor.TopCenter,
        visible: false,
        padding: 0,
        bgAlpha: 0,
        bgFill: mod.UIBgFill.None,
        textLabel: mod.Message(mod.stringkeys.twl.overLine.title, player),
        textColor: [0, 0, 0],
        textAlpha: PREGAME_ALERT_TEXT_ALPHA,
        textSize: BIG_TITLE_SIZE,
        textAnchor: mod.UIAnchor.Center,
    });

    const widget = safeFind(rootName);
    State.hudCache.overLineTitleShadowWidgetCache[pid] = { rootName, widget };
    return widget;
}

function ensureOverLineSubtitleShadowUIAndGetWidget(player: mod.Player): mod.UIWidget | undefined {
    if (!player || !mod.IsPlayerValid(player)) return undefined;
    const pid = mod.GetObjId(player);
    const rootName = BIG_SUBTITLE_SHADOW_WIDGET_ID + pid;

    const cached = State.hudCache.overLineSubtitleShadowWidgetCache[pid];
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
        position: [HUD_TEXT_SHADOW_OFFSET_X, BIG_SUBTITLE_OFFSET_Y + HUD_TEXT_SHADOW_OFFSET_Y],
        size: [BIG_SUBTITLE_BG_WIDTH, BIG_SUBTITLE_BG_HEIGHT],
        anchor: mod.UIAnchor.TopCenter,
        visible: false,
        padding: 0,
        bgAlpha: 0,
        bgFill: mod.UIBgFill.None,
        textLabel: mod.Message(mod.stringkeys.twl.overLine.subtitle, player),
        textColor: [0, 0, 0],
        textAlpha: PREGAME_ALERT_TEXT_ALPHA,
        textSize: BIG_SUBTITLE_SIZE,
        textAnchor: mod.UIAnchor.Center,
    });

    const widget = safeFind(rootName);
    State.hudCache.overLineSubtitleShadowWidgetCache[pid] = { rootName, widget };
    return widget;
}

function ensureOverLineTitleUIAndGetWidget(player: mod.Player): mod.UIWidget | undefined {
    if (!player || !mod.IsPlayerValid(player)) return undefined;
    const pid = mod.GetObjId(player);
    const rootName = BIG_TITLE_WIDGET_ID + pid;

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
        position: [0, BIG_TITLE_OFFSET_Y],
        size: [BIG_TITLE_BG_WIDTH, BIG_TITLE_BG_HEIGHT],
        anchor: mod.UIAnchor.TopCenter,
        visible: false,
        padding: 0,
        bgColor: COLOR_GRAY_DARK,
        bgAlpha: 0,
        bgFill: mod.UIBgFill.Blur,
        textLabel: mod.Message(mod.stringkeys.twl.overLine.title, player),
        textColor: [1, 0, 0],
        textAlpha: PREGAME_ALERT_TEXT_ALPHA,
        textSize: BIG_TITLE_SIZE,
        textAnchor: mod.UIAnchor.Center,
    });

    const widget = safeFind(rootName);
    State.hudCache.overLineTitleWidgetCache[pid] = { rootName, widget };
    return widget;
}

function ensureOverLineSubtitleUIAndGetWidget(player: mod.Player): mod.UIWidget | undefined {
    if (!player || !mod.IsPlayerValid(player)) return undefined;
    const pid = mod.GetObjId(player);
    const rootName = BIG_SUBTITLE_WIDGET_ID + pid;

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
        position: [0, BIG_SUBTITLE_OFFSET_Y],
        size: [BIG_SUBTITLE_BG_WIDTH, BIG_SUBTITLE_BG_HEIGHT],
        anchor: mod.UIAnchor.TopCenter,
        visible: false,
        padding: 0,
        bgColor: COLOR_GRAY_DARK,
        bgAlpha: 0,
        bgFill: mod.UIBgFill.Blur,
        textLabel: mod.Message(mod.stringkeys.twl.overLine.subtitle, player),
        textColor: [1, 1, 0],
        textAlpha: PREGAME_ALERT_TEXT_ALPHA,
        textSize: BIG_SUBTITLE_SIZE,
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

function hideBigTitleSubtitleMessageForPlayer(pid: number): void {
    const titleShadow = safeFind(BIG_TITLE_SHADOW_WIDGET_ID + pid);
    if (titleShadow) mod.SetUIWidgetVisible(titleShadow, false);

    const title = safeFind(BIG_TITLE_WIDGET_ID + pid);
    if (title) mod.SetUIWidgetVisible(title, false);

    const subtitleShadow = safeFind(BIG_SUBTITLE_SHADOW_WIDGET_ID + pid);
    if (subtitleShadow) mod.SetUIWidgetVisible(subtitleShadow, false);

    const subtitle = safeFind(BIG_SUBTITLE_WIDGET_ID + pid);
    if (subtitle) mod.SetUIWidgetVisible(subtitle, false);
}

async function showOverLineMessageForAllPlayers(offender: mod.Player): Promise<void> {
    const offenderToken = (offender && mod.IsPlayerValid(offender))
        ? offender
        : mod.stringkeys.twl.system.unknownPlayer;
    await showGlobalTitleSubtitleMessageForAllPlayers(
        mod.Message(mod.stringkeys.twl.overLine.title, offenderToken),
        mod.Message(mod.stringkeys.twl.overLine.subtitle, offenderToken),
        COLOR_NOT_READY_RED,
        COLOR_WARNING_YELLOW
    );
}

type BigMessageBuilder = (remainingSeconds: number) => mod.Message | undefined;
type BigMessagePlayerFilter = (player: mod.Player) => boolean;

function renderBigTitleSubtitleMessageForAllPlayers(
    title: mod.Message | undefined,
    subtitle: mod.Message | undefined,
    titleColor: mod.Vector,
    subtitleColor: mod.Vector,
    layout: GlobalMessageLayout,
    playerFilter?: BigMessagePlayerFilter
): void {
    const titleBgAlpha = layout.useBackground ? BIG_MESSAGE_BG_ALPHA : 0;
    const subtitleBgAlpha = (layout.subtitleUseBackground ?? layout.useBackground) ? BIG_MESSAGE_BG_ALPHA : 0;
    const titleBgHeight = layout.titleBgHeight ?? BIG_TITLE_BG_HEIGHT;
    const titleOffsetY = layout.titleOffsetY + (BIG_TITLE_BG_HEIGHT - titleBgHeight) / 2;

    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        if (playerFilter && !playerFilter(p)) {
            hideBigTitleSubtitleMessageForPlayer(getObjId(p));
            continue;
        }

        const titleShadowWidget = ensureOverLineTitleShadowUIAndGetWidget(p);
        if (titleShadowWidget) {
            if (title !== undefined) {
                mod.SetUITextLabel(titleShadowWidget, title);
                mod.SetUITextColor(titleShadowWidget, mod.CreateVector(0, 0, 0));
                mod.SetUITextSize(titleShadowWidget, layout.titleSize);
                mod.SetUIWidgetSize(titleShadowWidget, mod.CreateVector(BIG_TITLE_BG_WIDTH, titleBgHeight, 0));
                mod.SetUIWidgetPosition(
                    titleShadowWidget,
                    mod.CreateVector(HUD_TEXT_SHADOW_OFFSET_X, titleOffsetY + HUD_TEXT_SHADOW_OFFSET_Y, 0)
                );
                mod.SetUIWidgetVisible(titleShadowWidget, true);
            } else {
                mod.SetUIWidgetVisible(titleShadowWidget, false);
            }
        }

        const titleWidget = ensureOverLineTitleUIAndGetWidget(p);
        if (titleWidget) {
            if (title !== undefined) {
                mod.SetUITextLabel(titleWidget, title);
                mod.SetUITextColor(titleWidget, titleColor);
                mod.SetUITextSize(titleWidget, layout.titleSize);
                mod.SetUIWidgetSize(titleWidget, mod.CreateVector(BIG_TITLE_BG_WIDTH, titleBgHeight, 0));
                mod.SetUIWidgetPosition(titleWidget, mod.CreateVector(0, titleOffsetY, 0));
                mod.SetUIWidgetBgAlpha(titleWidget, titleBgAlpha);
                mod.SetUIWidgetVisible(titleWidget, true);
            } else {
                mod.SetUIWidgetVisible(titleWidget, false);
            }
        }

        const subtitleShadowWidget = ensureOverLineSubtitleShadowUIAndGetWidget(p);
        if (subtitleShadowWidget) {
            if (subtitle !== undefined) {
                mod.SetUITextLabel(subtitleShadowWidget, subtitle);
                mod.SetUITextColor(subtitleShadowWidget, mod.CreateVector(0, 0, 0));
                mod.SetUITextSize(subtitleShadowWidget, layout.subtitleSize);
                mod.SetUIWidgetPosition(
                    subtitleShadowWidget,
                    mod.CreateVector(HUD_TEXT_SHADOW_OFFSET_X, layout.subtitleOffsetY + HUD_TEXT_SHADOW_OFFSET_Y, 0)
                );
                mod.SetUIWidgetVisible(subtitleShadowWidget, true);
            } else {
                mod.SetUIWidgetVisible(subtitleShadowWidget, false);
            }
        }

        const subtitleWidget = ensureOverLineSubtitleUIAndGetWidget(p);
        if (subtitleWidget) {
            if (subtitle !== undefined) {
                mod.SetUITextLabel(subtitleWidget, subtitle);
                mod.SetUITextColor(subtitleWidget, subtitleColor);
                mod.SetUITextSize(subtitleWidget, layout.subtitleSize);
                mod.SetUIWidgetPosition(subtitleWidget, mod.CreateVector(0, layout.subtitleOffsetY, 0));
                mod.SetUIWidgetBgAlpha(subtitleWidget, subtitleBgAlpha);
                mod.SetUIWidgetVisible(subtitleWidget, true);
            } else {
                mod.SetUIWidgetVisible(subtitleWidget, false);
            }
        }
    }
}

function hideBigTitleSubtitleMessageForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        hideBigTitleSubtitleMessageForPlayer(mod.GetObjId(p));
    }
}

async function showGlobalTitleSubtitleMessageForAllPlayers(
    title: mod.Message | undefined,
    subtitle: mod.Message | undefined,
    titleColor: mod.Vector,
    subtitleColor: mod.Vector,
    durationSeconds: number = BIG_MESSAGE_DURATION_SECONDS,
    layout: GlobalMessageLayout = BIG_MESSAGE_LAYOUT,
    playerFilter?: BigMessagePlayerFilter
): Promise<void> {
    State.round.countdown.overLineMessageToken = (State.round.countdown.overLineMessageToken + 1) % 1000000000;
    const expectedToken = State.round.countdown.overLineMessageToken;

    renderBigTitleSubtitleMessageForAllPlayers(title, subtitle, titleColor, subtitleColor, layout, playerFilter);

    await mod.Wait(durationSeconds);
    if (expectedToken !== State.round.countdown.overLineMessageToken) return;
    hideBigTitleSubtitleMessageForAllPlayers();
}

async function showDynamicGlobalTitleSubtitleMessageForAllPlayers(
    titleBuilder: BigMessageBuilder | undefined,
    subtitleBuilder: BigMessageBuilder | undefined,
    titleColor: mod.Vector,
    subtitleColor: mod.Vector,
    durationSeconds: number = BIG_MESSAGE_DURATION_SECONDS,
    refreshIntervalSeconds: number = 1,
    layout: GlobalMessageLayout = BIG_MESSAGE_LAYOUT,
    playerFilter?: BigMessagePlayerFilter
): Promise<void> {
    State.round.countdown.overLineMessageToken = (State.round.countdown.overLineMessageToken + 1) % 1000000000;
    const expectedToken = State.round.countdown.overLineMessageToken;
    const endAtSeconds = mod.GetMatchTimeElapsed() + Math.max(0, durationSeconds);
    let lastRemainingSeconds = -1;

    while (true) {
        if (expectedToken !== State.round.countdown.overLineMessageToken) return;

        const remainingSeconds = Math.floor(getRemainingSeconds());
        if (remainingSeconds !== lastRemainingSeconds) {
            lastRemainingSeconds = remainingSeconds;
            const title = titleBuilder ? titleBuilder(remainingSeconds) : undefined;
            const subtitle = subtitleBuilder ? subtitleBuilder(remainingSeconds) : undefined;
            if (title || subtitle) {
                renderBigTitleSubtitleMessageForAllPlayers(title, subtitle, titleColor, subtitleColor, layout, playerFilter);
            }
        }

        const remainingDuration = endAtSeconds - mod.GetMatchTimeElapsed();
        if (remainingDuration <= 0) break;
        await mod.Wait(Math.min(refreshIntervalSeconds, remainingDuration));
    }

    if (expectedToken !== State.round.countdown.overLineMessageToken) return;
    hideBigTitleSubtitleMessageForAllPlayers();
}

async function showRoundStartMessageForAllPlayers(durationSeconds?: number): Promise<void> {
    await showGlobalTitleSubtitleMessageForAllPlayers(
        mod.Message(STR_ROUND_START_TITLE),
        mod.Message(STR_ROUND_START_SUBTITLE),
        COLOR_WHITE,
        COLOR_WHITE,
        durationSeconds
    );
}

//#endregion -------------------- Ready Dialog - OverLine UI Widgets + Big Messages --------------------



//#region -------------------- Ready Dialog - Pregame Countdown Flow --------------------

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

        if (value === 4) {
            // Start the round-start messaging so it ends with the GO! hide.
            const remainingSeconds = ((value + 1) * PREGAME_COUNTDOWN_STEP_SECONDS) + PREGAME_COUNTDOWN_GO_HOLD_SECONDS;
            void showRoundStartMessageForAllPlayers(remainingSeconds);
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

    await mod.Wait(1);
}

//#endregion -------------------- Ready Dialog - Pregame Countdown Flow --------------------



//#region -------------------- Ready Dialog - Auto-Start --------------------

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

//#endregion -------------------- Ready Dialog - Auto-Start --------------------



//#region -------------------- Ready Dialog - Swap Teams Button (single toggle) --------------------

// Swaps the given player between Team 1 and Team 2. This reuses the existing team-assignment APIs,
// but exposes them as a single toggle button rather than separate Team 1 / Team 2 buttons.
function swapPlayerTeam(eventPlayer: mod.Player): void {
    // Swap Teams button:: single-button team toggle (Team 1 <-> Team 2).
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

//#endregion ----------------- Ready Dialog - Swap Teams Button (single toggle) --------------------



//#region -------------------- MultiClickDetector (triple tap interact) --------------------

//Code Cleanup: Refactor this reference and use TS Template as a tool import during bundling a new distribution instead
class InteractMultiClickDetector {
    private static readonly STATES: Record<number, { lastIsInteracting: boolean; clickCount: number; sequenceStartTime: number }> = {};
    private static readonly WINDOW_MS = 2_000; //Needs to be tuned to facilitate clunky console controls
    private static readonly REQUIRED_CLICKS = 3;

    public static checkMultiClick(player: mod.Player): boolean {
        const playerId = mod.GetObjId(player);
        const isInteracting = safeGetSoldierStateBool(player, mod.SoldierStateBool.IsInteracting);

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
    if (!player || !mod.IsPlayerValid(player)) return false;
    const triggerId = mod.GetObjId(areaTrigger);
    const teamId = mod.GetObjId(mod.GetTeam(player));

    return mod.Or(
        mod.And(mod.Equals(triggerId, TEAM1_MAIN_BASE_TRIGGER_ID), mod.Equals(teamId, mod.GetObjId(mod.GetTeam(TeamID.Team1)))),
        mod.And(mod.Equals(triggerId, TEAM2_MAIN_BASE_TRIGGER_ID), mod.Equals(teamId, mod.GetObjId(mod.GetTeam(TeamID.Team2))))
    );
}

function BroadcastMainBaseEvent(
    messageKey: number,
    arg0?: string | number | mod.Player,
    arg1?: string | number | mod.Player
): void {
    const sanitizeArg = (value?: string | number | mod.Player): string | number | mod.Player | undefined => {
        if (value === undefined) return undefined;
        if (mod.IsType(value, mod.Types.Player)) {
            const player = value as mod.Player;
            if (!player || !mod.IsPlayerValid(player)) return mod.stringkeys.twl.system.unknownPlayer;
        }
        return value;
    };

    const safeArg0 = sanitizeArg(arg0);
    const safeArg1 = sanitizeArg(arg1);
    const message = (safeArg0 === undefined)
        ? mod.Message(messageKey)
        : (safeArg1 === undefined)
            ? mod.Message(messageKey, safeArg0)
            : mod.Message(messageKey, safeArg0, safeArg1);
    sendHighlightedWorldLogMessage(message, false, undefined, messageKey);
}

function NotifyAmmoRestocked(player: mod.Player): void {
    sendHighlightedWorldLogMessage(
        mod.Message(STR_AMMO_RESTOCKED),
        true,
        player,
        STR_AMMO_RESTOCKED
    );
}

function RestockGadgetAmmo(player: mod.Player, magAmmo: number): void {
    if (!isPlayerDeployed(player)) return;
    mod.SetInventoryMagazineAmmo(player, mod.InventorySlots.GadgetOne, magAmmo);
    mod.SetInventoryMagazineAmmo(player, mod.InventorySlots.GadgetTwo, magAmmo);
}

//#endregion ----------------- Main Base Restock (area triggers) --------------------



//#region -------------------- Exported Event Handlers - Game Mode Start --------------------

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
    const detectedMapKey = detectMapKeyFromHqs();
    if (detectedMapKey) {
        applyMapConfig(detectedMapKey);
    }
    State.vehicles.configReady = true;

    // Vehicle scoring init + legacy cleanup
    // Remove legacy UI roots (if any) before we build fresh HUDs; prevents duplicated overlays across restarts.
    deleteLegacyScoreRootsForAllPlayers();

    // Apply initial engine variables/settings used by the mode (authoritative baseline).
    mod.SetGameModeTargetScore(GAMEMODE_TARGET_SCORE_SAFETY_CAP);
    mod.SetVariable(regVehiclesTeam1, mod.EmptyArray());
    mod.SetVariable(regVehiclesTeam2, mod.EmptyArray());

    vehIds.length = 0;
    vehOwners.length = 0;
    clearSpawnBaseTeamCache();
    clearSpawnBaseTeamCache();

    sendHighlightedWorldLogMessage(
        mod.Message(mod.stringkeys.twl.messages.init),
        false,
        mod.GetTeam(TeamID.Team1),
        mod.stringkeys.twl.messages.init
    );
    sendHighlightedWorldLogMessage(
        mod.Message(mod.stringkeys.twl.messages.init),
        false,
        mod.GetTeam(TeamID.Team2),
        mod.stringkeys.twl.messages.init
    );

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
    State.round.current = 1;
    resetOvertimeFlagState();
    // Pregame: tie-breaker eligibility is decided at round start.
    State.flag.tieBreakerEnabledThisRound = false;
    setOvertimeAllFlagVisibility(false);

    setMatchWinsTeam(TeamID.Team1, 0);
    setMatchWinsTeam(TeamID.Team2, 0);
    State.scores.t1TotalKills = 0;
    State.scores.t2TotalKills = 0;

    State.match.winnerTeam = undefined;
    State.match.endElapsedSecondsSnapshot = 0;
    State.match.victoryStartElapsedSecondsSnapshot = 0;
    State.admin.actionCount = 0;
    State.admin.tieBreakerOverrideUsed = false;
    State.admin.liveRespawnEnabled = DEFAULT_LIVE_RESPAWN_ENABLED;
    syncAdminLiveRespawnLabelForAllPlayers();
    updateSpawnDisabledWarningForAllPlayers();

    State.hudCache.lastHudScoreT1 = undefined;
    State.hudCache.lastHudScoreT2 = undefined;
    // Init visible counters
    setHudRoundCountersForAllPlayers(State.round.current, MAX_ROUNDS);
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

    // Clock init + loop (pregame preview, do not count down yet)
    setRoundClockPreview(getConfiguredRoundLengthSeconds());

    // Vehicle spawners run on their own loop so they don't block the main clock loop.
    void startVehicleSpawnerSystem();
    // Soft aircraft ceiling enforcement runs on its own loop and only activates after confirm.
    startAircraftCeilingSoftEnforcementLoop();

    while (true) {
        // Push the initial clock display so every HUD shows the same starting time.
        updateAllPlayersClock();
        updateOvertimeStage();
        checkTakeoffLimitForAllPlayers();
        applyAutoReadyForAllPlayers();
        syncKillsHudFromTrackedTotals(false);

        if (State.match.victoryDialogActive) {
            const elapsedSinceVictory = Math.floor(mod.GetMatchTimeElapsed()) - Math.floor(State.match.victoryStartElapsedSecondsSnapshot);
            const remaining = MATCH_END_DELAY_SECONDS - elapsedSinceVictory;
            updateVictoryDialogForAllPlayers(Math.max(0, Math.floor(remaining)));
        }
        await mod.Wait(1.0);
    }
}

//#endregion -------------------- Exported Event Handlers - Game Mode Start --------------------



//#region -------------------- Exported Event Handlers - Player Join + Leave --------------------

function resetUiForPlayerOnJoin(player: mod.Player): void {
    if (!player || !mod.IsPlayerValid(player)) return;
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return;

    setUIInputModeForPlayer(player, false);

    const titleShadow = safeFind(BIG_TITLE_SHADOW_WIDGET_ID + pid);
    safeSetUIWidgetVisible(titleShadow, false);
    const title = safeFind(BIG_TITLE_WIDGET_ID + pid);
    safeSetUIWidgetVisible(title, false);
    const subtitleShadow = safeFind(BIG_SUBTITLE_SHADOW_WIDGET_ID + pid);
    safeSetUIWidgetVisible(subtitleShadow, false);
    const subtitle = safeFind(BIG_SUBTITLE_WIDGET_ID + pid);
    safeSetUIWidgetVisible(subtitle, false);

    deleteJoinPromptWidget(joinPromptButtonTextName(pid));
    deleteJoinPromptWidget(joinPromptButtonName(pid));
    deleteJoinPromptWidget(joinPromptButtonBorderName(pid));
    deleteJoinPromptWidget(joinPromptNeverShowButtonTextName(pid));
    deleteJoinPromptWidget(joinPromptNeverShowButtonName(pid));
    deleteJoinPromptWidget(joinPromptNeverShowButtonBorderName(pid));
    deleteJoinPromptWidget(joinPromptBodyName(pid));
    deleteJoinPromptWidget(joinPromptTitleName(pid));
    deleteJoinPromptWidget(joinPromptPanelName(pid));
    deleteJoinPromptWidget(joinPromptRootName(pid));

    deleteTeamSwitchUI(player);
}

export async function OnPlayerJoinGame(eventPlayer: mod.Player) {
    initTeamSwitchData(eventPlayer);
    const joinPid = safeGetPlayerId(eventPlayer);
    if (joinPid !== undefined) {
        delete State.players.disconnectedByPid[joinPid];
        State.players.deployedByPid[joinPid] = false;
        State.players.autoReadyByPid[joinPid] = false;
    }

    await mod.Wait(0.1);
    if (!mod.IsPlayerValid(eventPlayer)) return;

    resetUiForPlayerOnJoin(eventPlayer);

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
    if (joinPid !== undefined) {
        updateTeamNameWidgetsForPid(joinPid);
    }

    // Second join-time refresh after team assignment settles to avoid stale Ready dialog rosters.
    await mod.Wait(0.1);
    if (!mod.IsPlayerValid(eventPlayer)) return;
    renderReadyDialogForAllVisibleViewers();
    updatePlayersReadyHudTextForAllPlayers();
    updateHelpTextVisibilityForAllPlayers();
    rebuildOvertimeUiForPlayer(eventPlayer);
    // Ensure the round clock digits refresh for reconnecting players.
    State.round.clock.lastDisplayedSeconds = undefined;
    State.round.clock.lastLowTimeState = undefined;
    updateAllPlayersClock();

    // Join-time prompt is only shown once per player (undeploy prompts can repeat unless suppressed).
    if (!shouldShowJoinPromptForPlayer(eventPlayer)) return;
    const joinPromptPid = safeGetPlayerId(eventPlayer);
    if (joinPromptPid === undefined) return;
    if (State.players.joinPromptShownByPid[joinPromptPid]) return;
    State.players.joinPromptShownByPid[joinPromptPid] = true;

    await mod.Wait(0.2);
    if (!mod.IsPlayerValid(eventPlayer)) return;
    if (!shouldShowJoinPromptForPlayer(eventPlayer)) return;
    createJoinPromptForPlayer(eventPlayer);
}

/**
 * Disconnect handling:
 * - Clears per-player state maps so rejoin starts clean (NOT READY).
 * - Forces UI/HUD refresh for remaining players to drop the departed player immediately.
 */
export function OnPlayerLeaveGame(eventNumber: number | mod.Player) {
    let pid: number | undefined;
    if (mod.IsType(eventNumber, mod.Types.Player)) {
        pid = safeGetPlayerId(eventNumber as mod.Player);
    } else {
        pid = eventNumber as number;
    }
    if (pid === undefined) return;

    State.players.disconnectedByPid[pid] = true;
    removeTeamSwitchInteractPoint(pid);
    // Cleanup: delete cached UI widgets so we do not leak UI for disconnected players.
    if (!shouldDeferDisconnectUiDeletes()) {
        hardDeleteTeamSwitchUI(pid);
    }
    // On undeploy/death, avoid hard-deleting overtime HUD; hide + drop refs for safe rebuild.
    handleOvertimePlayerLeaveById(pid, false);
    // Remove any persisted per-player state so rejoin starts clean (NOT READY by default).
    delete State.players.readyByPid[pid];
    delete State.players.autoReadyByPid[pid];
    delete State.players.readyMessageCooldownByPid[pid];
    delete State.players.joinPromptShownByPid[pid];
    delete State.players.joinPromptNeverShowByPidMap[pid];
    delete State.players.joinPromptReadyDialogOpenedByPid[pid];
    delete State.players.joinPromptTipIndexByPid[pid];
    delete State.players.joinPromptTipsUnlockedByPid[pid];
    delete State.players.joinPromptTripleTapArmedByPid[pid];
    delete State.players.uiInputEnabledByPid[pid];
    delete State.players.inMainBaseByPid[pid];
    delete State.players.overTakeoffLimitByPid[pid];
    delete State.players.deployedByPid[pid];
    delete State.players.spawnDisabledWarningVisibleByPid[pid];
    // Also drop dialog-visible tracking if present (viewer is gone).
    delete State.players.teamSwitchData[pid];
    clearJoinPromptForPlayerId(pid);

    // Refresh UI for remaining players so rosters + HUD ready counts immediately reflect the disconnect.
    if (!isRoundLive()) {
        renderReadyDialogForAllVisibleViewers();
        updatePlayersReadyHudTextForAllPlayers();
        updateHelpTextVisibilityForAllPlayers();
    }
}

//#endregion -------------------- Exported Event Handlers - Player Join + Leave --------------------



//#region -------------------- Exported Event Handlers - Player Deploy + Undeploy --------------------

async function deferForcedUndeploy(player: mod.Player, reason: string): Promise<void> {
    // Defer undeploy by a tick to avoid engine instability during deploy transitions.
    try {
        await mod.Wait(0.1);
        if (!player || !mod.IsPlayerValid(player)) return;
        mod.UndeployPlayer(player);
    } catch {
        // Intentionally silent to keep unstable transitions from crashing the experience.
    }
}

export async function OnPlayerDeployed(eventPlayer: mod.Player) {
    const pid = safeGetPlayerId(eventPlayer);
    if (pid === undefined) return;
    // Safety: always restore UI input mode on deploy to avoid stuck UI suppressing messages.
    setUIInputModeForPlayer(eventPlayer, false);
    if (State.round.flow.cleanupActive && !State.round.flow.cleanupAllowDeploy) {
        State.players.deployedByPid[pid] = false;
        await deferForcedUndeploy(eventPlayer, "cleanup");
        return;
    }
    if (isLiveRespawnDisabled() && isRoundLive()) {
        State.players.deployedByPid[pid] = false;
        updateSpawnDisabledWarningForPlayer(eventPlayer);
        await deferForcedUndeploy(eventPlayer, "live_round");
        return;
    }

    State.players.deployedByPid[pid] = true;
    State.players.joinPromptTripleTapArmedByPid[pid] = false;
    updateSpawnDisabledWarningForPlayer(eventPlayer);
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
    State.players.readyByPid[pid] = false;
    // Design assumption: players spawn in their main base; update immediately for roster display.
    State.players.inMainBaseByPid[pid] = true;
    delete State.players.overTakeoffLimitByPid[pid];
    updatePlayersReadyHudTextForAllPlayers();
    renderReadyDialogForAllVisibleViewers();
    updateHelpTextVisibilityForAllPlayers();

    ensureHudForPlayer(eventPlayer);
    await spawnTeamSwitchInteractPoint(eventPlayer);
}

export function OnPlayerUndeploy(eventPlayer: mod.Player) {
    // If the player is leaving the deployed state (death / manual undeploy / forced redeploy),
    // the Ready Up dialog should be closed. This prevents interacting with the UI while undeployed.
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    const pid = safeGetPlayerId(eventPlayer);
    if (pid === undefined) return;
    if (isPidDisconnected(pid)) return;
    State.players.deployedByPid[pid] = false;
    State.players.joinPromptTripleTapArmedByPid[pid] = false;
    if (State.players.teamSwitchData[pid]?.dialogVisible) {
        deleteTeamSwitchUI(eventPlayer);
    }
    updateHelpTextVisibilityForPid(pid);

    removeTeamSwitchInteractPoint(pid);
    // On undeploy/death, avoid hard-deleting overtime HUD; hide + drop refs for safe rebuild.
    handleOvertimePlayerLeaveById(pid, false);

    if (shouldShowJoinPromptForPlayer(eventPlayer)) {
        createJoinPromptForPlayer(eventPlayer);
    }
}

//#endregion -------------------- Exported Event Handlers - Player Deploy + Undeploy --------------------



//#region -------------------- Exported Event Handlers - Player Loop + UI Inputs --------------------

// Performance note:
// - OngoingPlayer executes frequently; keep it lightweight!
// - Avoid FindUIWidget calls or per-tick loops over all players/vehicles unless strictly necessary.
// - Prefer "update only when changed" patterns for HUD/clock refreshes.
export function OngoingPlayer(eventPlayer: mod.Player): void {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    updateSpawnDisabledWarningForPlayer(eventPlayer);
    if (isPlayerDeployed(eventPlayer)) {
        checkTeamSwitchInteractPointRemoval(eventPlayer);
    }

    // UI caching warm-up: build the Ready Up dialog once per player so the first real open is snappy.
    // We build and immediately hide; the dialog becomes visible only when the player opens it via the interact point.
    const pid = safeGetPlayerId(eventPlayer);
    if (pid === undefined) return;
    if (State.players.teamSwitchData[pid] && !State.players.teamSwitchData[pid].uiBuilt) {
        createTeamSwitchUI(eventPlayer);
        // Ensure the warm-up build does not count as "open" for refresh logic.
        State.players.teamSwitchData[pid].dialogVisible = false;
        deleteTeamSwitchUI(eventPlayer); // now hides (cached) rather than deleting
        State.players.teamSwitchData[pid].uiBuilt = true;
    }

    if (isPlayerDeployed(eventPlayer)) {
        if (InteractMultiClickDetector.checkMultiClick(eventPlayer)) {
            armJoinPromptTripleTapForPid(pid);
            spawnTeamSwitchInteractPoint(eventPlayer);
            //mod.DisplayHighlightedWorldLogMessage(mod.Message(mod.stringkeys.twl.notifications.multiclickDetector), mod.GetTeam(eventPlayer));
        }
    }
}

export function OnPlayerInteract(eventPlayer: mod.Player, eventInteractPoint: mod.InteractPoint) {
    teamSwitchInteractPointActivated(eventPlayer, eventInteractPoint);
}

export function OnPlayerUIButtonEvent(eventPlayer: mod.Player, eventUIWidget: mod.UIWidget, eventUIButtonEvent: mod.UIButtonEvent) {
    if (tryHandleJoinPromptButton(eventPlayer, eventUIWidget, eventUIButtonEvent)) return;
    teamSwitchButtonEvent(eventPlayer, eventUIWidget, eventUIButtonEvent);
}

//#endregion -------------------- Exported Event Handlers - Player Loop + UI Inputs --------------------



//#region -------------------- Exported Event Handlers - Vehicle Entry + Exit --------------------

// OnPlayerEnterVehicle:
// Registers a vehicle to a team the first time a player enters it.
// This establishes which team will lose a point if the vehicle is later destroyed.
// Also records the entering player as the 'last driver' for messaging purposes.
// Notes:
// - Registration is idempotent; re-entering does not double-register.
// - Last driver is best-effort and not authoritative for scoring.
// Code Cleanup: Known fragility - we need to refactor or identify a different method entirely as OnPlayerEnterVehicle is error prone.
function isVehicleEmptyForEntry(eventVehicle: mod.Vehicle, enteringPlayer: mod.Player): boolean {
    const seatCount = mod.GetVehicleSeatCount(eventVehicle);
    if (seatCount <= 1) return true;
    const enteringSeat = mod.GetPlayerVehicleSeat(enteringPlayer);
    for (let seat = 0; seat < seatCount; seat++) {
        if (seat === enteringSeat) continue;
        if (mod.IsVehicleSeatOccupied(eventVehicle, seat)) {
            return false;
        }
    }
    return true;
}

export function OnPlayerEnterVehicle(eventPlayer: mod.Player, eventVehicle: mod.Vehicle) {
    if (!mod.IsPlayerValid(eventPlayer)) return;

    const teamNum = getTeamNumber(mod.GetTeam(eventPlayer));
    if (teamNum !== TeamID.Team1 && teamNum !== TeamID.Team2) {
        sendHighlightedWorldLogMessage(
            mod.Message(STR_VEHICLE_REG_PENDING_TEAM, eventPlayer),
            true,
            mod.GetTeam(TeamID.Team1),
            STR_VEHICLE_REG_PENDING_TEAM
        );
        sendHighlightedWorldLogMessage(
            mod.Message(STR_VEHICLE_REG_PENDING_TEAM, eventPlayer),
            true,
            mod.GetTeam(TeamID.Team2),
            STR_VEHICLE_REG_PENDING_TEAM
        );
        return;
    }

    const inT1 = arrayContainsVehicle(mod.GetVariable(regVehiclesTeam1), eventVehicle);
    const inT2 = arrayContainsVehicle(mod.GetVariable(regVehiclesTeam2), eventVehicle);
    const wasRegistered = inT1 || inT2;

    // Cached last driver for this vehicle (if any).
    const priorOwner = getLastDriver(eventVehicle); 

    // Only trust the owner if the player is still valid.
    const priorOwnerValid = !!priorOwner && mod.IsPlayerValid(priorOwner); 

    // Same player re-entering their last-driven vehicle.
    const isReturnToSameOwner = priorOwnerValid && (getObjId(priorOwner) === getObjId(eventPlayer)); 

    // Current registry team for this vehicle, if any.
    const registeredTeam = inT1 ? TeamID.Team1 : (inT2 ? TeamID.Team2 : 0); 

    const isEmptyVehicle = isVehicleEmptyForEntry(eventVehicle, eventPlayer);

    // Transfer on empty vehicle entry, missing owner, or cross-team registry mismatch.
    const shouldTransferOwnership = isEmptyVehicle || !priorOwnerValid || (registeredTeam !== 0 && registeredTeam !== teamNum); 

    // Reconcile baseline team for unowned vehicles before applying "enter = claim/steal".
    if (!priorOwnerValid) {
        const vehicleObjId = getObjId(eventVehicle);
        let inferredBaseTeam = vehicleSpawnBaseTeamByObjId[vehicleObjId];
        if (inferredBaseTeam !== TeamID.Team1 && inferredBaseTeam !== TeamID.Team2) {
            inferredBaseTeam = inferBaseTeamFromPosition(mod.GetObjectPosition(eventVehicle)) as TeamID;
        }

        if (inferredBaseTeam === TeamID.Team1 || inferredBaseTeam === TeamID.Team2) {
            const registeredTeam = inT1 ? TeamID.Team1 : (inT2 ? TeamID.Team2 : 0);
            if (registeredTeam !== inferredBaseTeam) {
                registerVehicleToTeam(eventVehicle, inferredBaseTeam);
            }
        }
    }

    if (shouldTransferOwnership) {
        setLastDriver(eventVehicle, eventPlayer);
        registerVehicleToTeam(eventVehicle, teamNum);
    } else if (!wasRegistered) {
        // Safety: ensure membership exists even if the registry desynced.
        registerVehicleToTeam(eventVehicle, teamNum);
    }

    const teamNameKey = getTeamNameKey(teamNum);

    //Send notifications around different vehicle registration events so players can spot known issue with Vehicle Registrations
    let messageKey: number = STR_VEHICLE_REG_NO_CHANGE;
    let arg0: any = eventPlayer;
    let arg1: any = teamNameKey;
    if (!wasRegistered) { //New Vehicle
        messageKey = mod.stringkeys.twl.messages.vehicleRegisteredNew;
        arg0 = teamNameKey;
        arg1 = eventPlayer;
    } else if (isReturnToSameOwner) { //Old Vehicle Same Player
        messageKey = (registeredTeam !== 0 && registeredTeam !== teamNum)
            ? STR_VEHICLE_STOLEN_REGISTER
            : mod.stringkeys.twl.messages.vehicleReturned;
        arg0 = eventPlayer;
        arg1 = teamNameKey;
    } else if (shouldTransferOwnership) { //Old Vehicle Different Player
        messageKey = (registeredTeam !== 0 && registeredTeam !== teamNum)
            ? STR_VEHICLE_STOLEN_REGISTER
            : mod.stringkeys.twl.messages.vehicleReRegistered;
        arg0 = teamNameKey;
        arg1 = eventPlayer;
    }

    sendHighlightedWorldLogMessage(
        mod.Message(messageKey, arg0, arg1),
        true,
        mod.GetTeam(TeamID.Team1),
        messageKey
    );
    sendHighlightedWorldLogMessage(
        mod.Message(messageKey, arg0, arg1),
        true,
        mod.GetTeam(TeamID.Team2),
        messageKey
    );

    handleOvertimePlayerEnterVehicle(eventPlayer, eventVehicle);
}

export function OnPlayerExitVehicle(eventPlayer: mod.Player, eventVehicle: mod.Vehicle) {
    if (!mod.IsPlayerValid(eventPlayer)) return;
    handleOvertimePlayerExitVehicle(eventPlayer, eventVehicle);
}

//#endregion -------------------- Exported Event Handlers - Vehicle Entry + Exit --------------------



//#region -------------------- Exported Event Handlers - Vehicle Spawn + Destroy --------------------

// OnVehicleSpawned:
// Registers a spawned vehicle to the nearest main base team using its world position.
export async function OnVehicleSpawned(eventVehicle: mod.Vehicle): Promise<void> {
    // Bind vehicle to a spawner slot first; fall back to base inference if not spawned by our spawners.
    const posObject = mod.GetObjectPosition(eventVehicle);
    let slotIndex = -1;
    const activeIndex = State.vehicles.activeSpawnSlotIndex;
    const activeToken = State.vehicles.activeSpawnToken;
    const activeAt = State.vehicles.activeSpawnRequestedAtSeconds;
    if (activeIndex !== undefined && activeToken !== undefined && activeAt !== undefined) {
        const now = Math.floor(mod.GetMatchTimeElapsed());
        const expired = (now - activeAt) > VEHICLE_SPAWNER_BIND_TIMEOUT_SECONDS;
        const activeSlot = State.vehicles.slots[activeIndex];
        if (!expired && activeSlot && activeSlot.expectingSpawn && activeSlot.spawnRequestToken === activeToken) {
            slotIndex = activeIndex;
        }
    }
    if (slotIndex === -1) {
        slotIndex = findSpawnerSlotByPosition(posObject);
    }
    if (slotIndex >= 0) {
        const slot = State.vehicles.slots[slotIndex];
        if (!slot.enabled) {
            mod.UnspawnObject(eventVehicle);
            return;
        }
        if (!slot.expectingSpawn && slot.vehicleId === -1) {
            // Replace the spawner's initial default spawn with a forced spawn using the configured type.
            mod.UnspawnObject(eventVehicle);
            await mod.Wait(0.1); // Give the engine a moment to clear the spawn before forcing again.
            configureVehicleSpawner(slot.spawner, slot.vehicleType);
            const success = await forceSpawnWithRetry(slotIndex);
            if (!success) {
                void scheduleBlockedSpawnRetry(slotIndex);
            }
            return;
        }
    }
    
    // Primary path: bind to a spawner slot that is expecting this spawn.
    let inferredTeam = bindSpawnedVehicleToSlot(eventVehicle, posObject);

    if (inferredTeam === 0) {
        // Retry once after a short delay in case the spawn position hasn't settled yet.
        await mod.Wait(0.2);
        const posRetry = mod.GetObjectPosition(eventVehicle);
        inferredTeam = bindSpawnedVehicleToSlot(eventVehicle, posRetry);
    }

    const pos = mod.GetVehicleState(eventVehicle, mod.VehicleStateVector.VehiclePosition);
    const vehicleObjId = getObjId(eventVehicle);

    if (inferredTeam === 0) {
        // Fallback path: assign to the nearest main base if within bind radius.
        inferredTeam = inferBaseTeamFromPosition(pos);

        // If the spawn matched a known spawner but failed to bind, bind the slot explicitly.
        if (slotIndex >= 0) {
            const slot = State.vehicles.slots[slotIndex];
            if (slot && slot.enabled && slot.vehicleId === -1) {
                slot.expectingSpawn = false;
                slot.vehicleId = vehicleObjId;
                slot.respawnRunning = false;
                slot.spawnRetryScheduled = false;
                State.vehicles.vehicleToSlot[vehicleObjId] = slotIndex;
            }
        }
    }

    // Bail out if the vehicle didn't spawn near a known team base.
    // Unassigned spawns are not registered and will not count toward scoring/HUD.
    if (inferredTeam !== TeamID.Team1 && inferredTeam !== TeamID.Team2) {
        return;
    }

    // Cache base-team inference for later reconciliation on enter.
    vehicleSpawnBaseTeamByObjId[vehicleObjId] = inferredTeam; 

    // Reset cached owner so enter events can establish a new owner.
    clearLastDriverByVehicleObjId(vehicleObjId); 

    // Spawn-time registration is authoritative only after a slot binds (before any player enters).
    registerVehicleToTeam(eventVehicle, inferredTeam);

    const teamNameKey = getTeamNameKey(inferredTeam);
    const x = Math.floor(mod.XComponentOf(pos));
    const z = Math.floor(mod.ZComponentOf(pos));
    sendHighlightedWorldLogMessage(
        mod.Message(mod.stringkeys.twl.messages.vehicleSpawned, teamNameKey, x, z),
        true,
        undefined,
        mod.stringkeys.twl.messages.vehicleSpawned
    );
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
    handleOvertimeVehicleDestroyed(eventVehicle);
    const inT1 = arrayContainsVehicle(mod.GetVariable(regVehiclesTeam1), eventVehicle);
    const inT2 = arrayContainsVehicle(mod.GetVariable(regVehiclesTeam2), eventVehicle);

    // Registration is the scoring gate; unregistered vehicles are ignored.
    if (!inT1 && !inT2) {
        return;
    }

    const destroyedTeamNum = inT1 ? TeamID.Team1 : TeamID.Team2;
    const scoringTeamNum = opposingTeam(destroyedTeamNum);

    if (isRoundLive()) {
        const vehicleObjId = getObjId(eventVehicle);
        // NOTE: vehicleToSlot can be cleared by the spawner poll loop (1s tick) before this runs.
        // If that happens, the camped log may be skipped for that destruction.
        const slotIndex = State.vehicles.vehicleToSlot[vehicleObjId];
        let wasSpawnCamped = false;
        if (slotIndex !== undefined) {
            const slot = State.vehicles.slots[slotIndex];
            if (slot) {
                const spawnerPos = slot.spawnPos;
                const deathPos = mod.GetVehicleState(eventVehicle, mod.VehicleStateVector.VehiclePosition);
                const fallbackPos = mod.GetObjectPosition(eventVehicle);
                let resolvedPos = deathPos;
                if (
                    mod.XComponentOf(deathPos) === 0 &&
                    mod.YComponentOf(deathPos) === 0 &&
                    mod.ZComponentOf(deathPos) === 0
                ) {
                    resolvedPos = fallbackPos;
                }
                const d = mod.DistanceBetween(resolvedPos, spawnerPos);
                if (d <= VEHICLE_CAMPED_DISTANCE_METERS) {
                    wasSpawnCamped = true;
                    const teamNameKey = getTeamNameKey(destroyedTeamNum);
                    const x = Math.floor(mod.XComponentOf(resolvedPos));
                    sendHighlightedWorldLogMessage(
                        mod.Message(mod.stringkeys.twl.messages.vehicleCampedInMainBase, teamNameKey, x),
                        true,
                        undefined,
                        mod.stringkeys.twl.messages.vehicleCampedInMainBase
                    );
                }
            }
        }

        if (!wasSpawnCamped) {
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
        }

        mod.SetVariable(regVehiclesTeam1, arrayRemoveVehicle(mod.GetVariable(regVehiclesTeam1), eventVehicle));
        mod.SetVariable(regVehiclesTeam2, arrayRemoveVehicle(mod.GetVariable(regVehiclesTeam2), eventVehicle));

        const owner = popLastDriver(eventVehicle);

        // Legacy delay removed; send kill message immediately to avoid deferred crash window.
        // await mod.Wait(3.0);

        if (!wasSpawnCamped) {
            const roundKills = (scoringTeamNum === TeamID.Team1) ? State.scores.t1RoundKills : State.scores.t2RoundKills;
            const teamNameKey = (scoringTeamNum === TeamID.Team1) ? getTeamNameKey(TeamID.Team1) : getTeamNameKey(TeamID.Team2);
            const ownerNameOrKey = owner
                ? (mod.IsPlayerValid(owner) ? owner : mod.stringkeys.twl.system.unknownPlayer)
                : mod.stringkeys.twl.system.unassigned;

            sendHighlightedWorldLogMessage(
                mod.Message(mod.stringkeys.twl.messages.pointAwardedWithOwner, teamNameKey, ownerNameOrKey, Math.floor(roundKills)),
                true,
                mod.GetTeam(TeamID.Team1),
                mod.stringkeys.twl.messages.pointAwardedWithOwner
            );
            sendHighlightedWorldLogMessage(
                mod.Message(mod.stringkeys.twl.messages.pointAwardedWithOwner, teamNameKey, ownerNameOrKey, Math.floor(roundKills)),
                true,
                mod.GetTeam(TeamID.Team2),
                mod.stringkeys.twl.messages.pointAwardedWithOwner
            );
        }

        return;
    }

    // Round is not live: clean up registration, but do not award points or increment counters.
    mod.SetVariable(regVehiclesTeam1, arrayRemoveVehicle(mod.GetVariable(regVehiclesTeam1), eventVehicle));
    mod.SetVariable(regVehiclesTeam2, arrayRemoveVehicle(mod.GetVariable(regVehiclesTeam2), eventVehicle));

    const owner = popLastDriver(eventVehicle);

    // Legacy delay removed; send kill message immediately to avoid deferred crash window.
    // await mod.Wait(3.0);

    const destroyedTeamNameKey = (destroyedTeamNum === TeamID.Team1) ? getTeamNameKey(TeamID.Team1) : getTeamNameKey(TeamID.Team2);
    const ownerNameOrKey = owner
        ? (mod.IsPlayerValid(owner) ? owner : mod.stringkeys.twl.system.unknownPlayer)
        : mod.stringkeys.twl.system.unassigned;

    sendHighlightedWorldLogMessage(
        mod.Message(mod.stringkeys.twl.messages.vehicleDestroyedNotLive, ownerNameOrKey, destroyedTeamNameKey),
        true,
        mod.GetTeam(TeamID.Team1),
        mod.stringkeys.twl.messages.vehicleDestroyedNotLive
    );
    sendHighlightedWorldLogMessage(
        mod.Message(mod.stringkeys.twl.messages.vehicleDestroyedNotLive, ownerNameOrKey, destroyedTeamNameKey),
        true,
        mod.GetTeam(TeamID.Team2),
        mod.stringkeys.twl.messages.vehicleDestroyedNotLive
    );
}

//#endregion -------------------- Exported Event Handlers - Vehicle Spawn + Destroy --------------------



//#region -------------------- Enter/Exit Triggers --------------------

// CapturePoint tick: keep engine capture suppressed while we use CPs as markers only.
export function OngoingCapturePoint(eventCapturePoint: mod.CapturePoint): void {
    try {
        if (!eventCapturePoint) return;
        if (!State.flag.configValid) return;
        if (State.flag.stage < OvertimeStage.Visible) return;
        if (!isActiveOvertimeCapturePoint(eventCapturePoint)) return;
        applyOvertimeCapturePointSuppression(eventCapturePoint);
        setOvertimeCapturePointOwner(eventCapturePoint, 0);
    } catch {
        return;
    }
}

export function OnPlayerEnterAreaTrigger(eventPlayer: mod.Player, eventAreaTrigger: mod.AreaTrigger) {
    try {
        if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;

        const triggerId = safeGetObjId(eventAreaTrigger);
        if (triggerId === undefined) return;
        if (State.flag.activeAreaTriggerId !== undefined && triggerId === State.flag.activeAreaTriggerId) {
            // Overtime zones are AreaTrigger-driven; tracking is enabled from round start.
            if (mod.IsPlayerValid(eventPlayer)) {
                handleOvertimePlayerEnterZone(eventPlayer);
            }
        }

        if (IsPlayerInOwnMainBase(eventPlayer, eventAreaTrigger)) {
            // track per-player main base state for UI display (authoritative gating comes later).
            State.players.inMainBaseByPid[mod.GetObjId(eventPlayer)] = true;
            renderReadyDialogForAllVisibleViewers();
            BroadcastMainBaseEvent(STR_ENTERED_MAIN_BASE, eventPlayer);
            RestockGadgetAmmo(eventPlayer, RESTOCK_MAG_AMMO_ENTER);
            NotifyAmmoRestocked(eventPlayer);
        }
    } catch {
        return;
    }
}

export function OnPlayerExitAreaTrigger(eventPlayer: mod.Player, eventAreaTrigger: mod.AreaTrigger) {
    try {
        if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;

        const triggerId = safeGetObjId(eventAreaTrigger);
        if (triggerId === undefined) return;
        if (State.flag.activeAreaTriggerId !== undefined && triggerId === State.flag.activeAreaTriggerId) {
            // Overtime zones are AreaTrigger-driven; tracking is enabled from round start.
            if (mod.IsPlayerValid(eventPlayer)) {
                handleOvertimePlayerExitZone(eventPlayer);
            }
        }

        if (!isPlayerDeployed(eventPlayer)) return;

        if (IsPlayerInOwnMainBase(eventPlayer, eventAreaTrigger)) {
            State.players.inMainBaseByPid[mod.GetObjId(eventPlayer)] = false;
            // Pre-round gating:: if the round is NOT active, leaving the main base forces the player back to NOT READY.
            if (!isRoundLive()) {
                State.players.readyByPid[mod.GetObjId(eventPlayer)] = false;
                // Keep the HUD "X / Y PLAYERS READY" line in sync when leaving main base forces NOT READY.
                updatePlayersReadyHudTextForAllPlayers();
                updateHelpTextVisibilityForPlayer(eventPlayer);
                if (State.round.countdown.isRequested) {
                    cancelPregameCountdown();
                    void showOverLineMessageForAllPlayers(eventPlayer);
                }
                // Player-only warning: they were ready, but left main base before the round went live.
                // This is intentionally not broadcast globally; it is actionable guidance for the individual player.
                sendHighlightedWorldLogMessage(
                    mod.Message(STR_READYUP_RETURN_TO_BASE_NOT_LIVE, Math.floor(State.round.current)),
                    false,
                    eventPlayer,
                    STR_READYUP_RETURN_TO_BASE_NOT_LIVE
                );
            }
            renderReadyDialogForAllVisibleViewers();
            BroadcastMainBaseEvent(STR_EXITED_MAIN_BASE, eventPlayer);
            RestockGadgetAmmo(eventPlayer, RESTOCK_MAG_AMMO_EXIT);
            NotifyAmmoRestocked(eventPlayer);
        }
    } catch {
        return;
    }
}

//#endregion ----------------- Enter/Exit Triggers --------------------



//#region -------------------- EOF Metadata --------------------

// EOF version: 0.621 | Date: 02.07.26 | Time: 16:52 UTC

//#endregion -------------------- EOF Metadata --------------------
