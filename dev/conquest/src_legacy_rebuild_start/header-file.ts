// @ts-nocheck
// Module: File header, versioning, license, attribution, changelog, gamemode description, punchlist, naming notes

//#region -------------------- Versioning --------------------

// version: 0.006 | Date: 02.15.26 | Time: 19:54 UTC
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

// v0.004: Removed functions not necessary for conquest, updated versionBump script. Removed auto-ready, spawn disabling, round/wins/kills in HUD
// v0.001: We are rebasing the Conquest versioning, starting with the v.0623 version of Helis code on the new TS project template
// v0.623: We're using TS Template project now, thanks to @Dox and @MikeDeluca

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



