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