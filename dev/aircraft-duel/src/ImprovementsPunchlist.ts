// @ts-nocheck
// Module: human-only improvement notes and nice-to-haves (source-only)

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
