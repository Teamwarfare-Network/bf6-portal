// @ts-nocheck
// Module: compact runtime changelog

//#region -------------------- Changelog / History --------------------

// v0.630: Port conquest's build pipeline passes into helis-only. Added BOM strip, full-line + block-comment strip, indentation strip, blank-line collapse, modlib source inlining (via new src/foundation/modlib.ts), header re-injection from src/header-file.ts, EOF version line restore, and non-ASCII guardrail. Adopted conquest's relaxed verify.js (existence + size + JSON validity) with strict byte-compare opt-in via VERIFY_GROUND_TRUTH=1, plus 1 MB bundle size cap. Dead-code elimination pass intentionally skipped (no FEATURE_* flags in helis source). Bundle dropped from 708,998 -> ~500,000 bytes (~30% reduction). No runtime behavior change. Also split Changelog/History, Gamemode Description, Improvements punchlist, and Portal Naming Notes out of header-file.ts into separate source-only files mirroring conquest's organization. Switched // policy: prefix to // *policy: so postbuild strips them from the bundle.
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
