// @ts-nocheck
// Module: types â€” File headers, constants, enums, and type aliases

//#region -------------------- Versioning --------------------

// version: 0.625 | Date: 02.15.26 | Time: 00:52 UTC
// version policy header file: src/header-file.ts
// version policy footer file: src/footer-file.ts
// version policy strings file: src/strings.json
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

// v0.623: We're using TS Template project now, thanks to @Dox and @MikeDeluca
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



