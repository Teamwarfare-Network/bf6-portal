// @ts-nocheck
// Module: changelog and reference notes moved from header-file.ts

//#region -------------------- Changelog / History --------------------

// v0.028: Ready for commit for conquest baseline
// v0.023: Complete modularization and itemization of baseline functionality - testing pass for git commit
// v0.004: Removed functions not necessary for conquest, updated versionBump script. Removed auto-ready, spawn disabling, round/wins/kills in HUD
// v0.001: We are rebasing the Conquest versioning, starting with the v.0623 version of Helis code on the new TS project template
// v0.623: We're using TS Template project now, thanks to @Dox and @MikeDeluca

//#endregion ----------------- Changelog / History --------------------



//#region -------------------- Improvements punchlist --------------------

/*
 *
 * List of improvements (for only humans and not LLMs, CODEX or GPT to design and implement):
 * --- Code Cleanup: Continue tightening module boundaries as gameplay/UI responsibilities evolve
 * --- Code Cleanup: Consolidate overlapping ready-dialog refresh entry points where behavior is equivalent
 * --- Code Cleanup: Standardize UI helper patterns to reduce repetitive button/label creation code
 * --- Code Cleanup: Audit duplicate update calls in UI event handlers and collapse where safe
 *
 * List of Nice to Haves (for only humans and not LLMs, CODEX or GPT to design and implement):
 * - UI Polish: Add "Respawn in 10s..." message synced with clock to appear in place at top in yellow instead of "ready up" dialog, during the window of round ending
 * - UI Polish: Restart in Xs still rolls over on top match clock
 * - SFX Polish: Add sound effects for ready up, round start countdown, round end display, victory display
 * - SFX Polish: Add sound effects for admin actions (clock adjust/reset/start/end)
 * - SFX Polish: Add sound effect for team swap action
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
