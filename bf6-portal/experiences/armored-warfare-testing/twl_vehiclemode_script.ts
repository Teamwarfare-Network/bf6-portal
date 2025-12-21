
// Authored by Polynorblu and UberDuberSoldat

/*
 * 
 * TODO LIST TO FINALIZE MODE:
 * - UNIFY WITH A READY UP DIALOG and then connect to startRound() function
 * - Turn all white text and green box text into debug logging, with a debug log function you can enable/disable
 * - Build player arrays to store things in an organized way for ready up dialogs? Or reuse existing arrays?
 * - Build UI to display in an organized way the ready up states of all players using:
 *      - IsPlayerInOwnMainBase: function so we can track in real time if a player leaves/joins. Routed from same ammo logic area trigger
 *      - Add IsPlayerReady function to track readiness, whether they've readied up. if isInMainBase results false, isPlayerReady should also form to false - and force people to ready up again - we want to facilitate being anywhere in the main base and readying up
 * - Display all player names, and Ready or In Main Base states in a convenient way
 * - Provide a Ready Up button (which turns into a Not Ready button) to facilitate readying or readying down
 * - When all active players are ready - trigger Round Start, which gives a 3, 2 , 1, GO countdown
 * - Ensure and recheck all UI refreshes when player rejoins map
 * - Ensure and recheck all UI refreshes when anyone toggles (or automatically gets toggled) isInMainBase. Any change in these booleans would refresh UI
 * - Ensure main UI comes up on a triple tap interact key
 * - Ensure main UI meshes well with existing BF6 UI/HUD (compass, chat, ammo counts)
 * - Find a way to hide/store Admin/Tester buttons or professionalize them
 *      - Alternatively add a very visible debug log when an admin button is used if it is included in shipping experience codes?
 * - Playtest final product with 1v1, 2v2, 3v3, 4v4 for bullet proofing edge cases 
 * 
 */

// -------------------- Mode Overview (read this first) --------------------
//
// This experience is a round-based, vehicle-only scoring mode:
// - Vehicles become "registered" to a team the first time a player enters them.
// - When a registered vehicle is destroyed during a LIVE round, the opposing team earns +1 Round Kill.
// - A round ends when a team reaches the Round Kill target (e.g. 2 kills for 2v2) or the round clock expires.
// - Entering/Exiting main-base provides a gadget ammo restock so players can rearm/resupply if needed mid match or post match
// - Match record (wins/losses/ties) is tracked across rounds; HUD is a projection of that authoritative state.
// - Round end and Victory end dialogs communicate results in timed windows for clarity
//
// Glossary:
// - "Round Kills": points earned this round (vehicle-destruction points).
// - "Total Kills": lifetime match total (if used/shown); not required for win condition.
// - "Registered vehicle": a vehicle currently stored in the team's registered list (GlobalVariables 0/1).
// - "Last driver": best-effort owner used for messaging only; not authoritative for scoring.
// - "HUD": always-on per-player overlay (cached by pid).
// - "Dialog": modal UI that enables UI input mode (Team Switch / Victory).
//
// -------------------------------------------------------------------------
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
// - Most major variables are at the top, but some core variables to functionality live within functions for good reasons
//
// -------------------------------------------------------------------------

//ignore modlib error: Cannot find module 'modlib'
import * as modlib from "modlib";

//#region Constants (Shared)

// Core gameplay tuning defaults (safe to edit)
const DEFAULT_MAX_ROUNDS = 3;
const DEFAULT_ROUND_KILLS_TARGET = 1;
const ROUND_START_SECONDS = 5 * 60;
const MATCH_END_DELAY_SECONDS = 45;
const ROUND_END_REDEPLOY_DELAY_SECONDS = 10;
const ROUND_CLOCK_DEFAULT_SECONDS = ROUND_START_SECONDS;

// Team identifiers (script uses T1/T2 semantics)
const TEAM_1 = 1;
const TEAM_2 = 2;

// -------------------- Strings.json key policy --------------------
//
// - UI labels (static text) should be shared (e.g., Label_TotalKills) rather than duplicated per team.
// - Per-team differences belong in layout/widget placement, not in duplicated label strings.
// - Dynamic values (numbers) are usually written into value widgets directly; avoid creating many one-off strings.
// - If you must use placeholders, keep formatting consistent across the file.
// - Reminder: UI widget `name:` values are NOT Strings.json keys; they are runtime widget IDs.
//
// ------------------------------------------------------------------

// UI widget ID constants (string names used to find widgets)
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
const UI_TEST_BUTTON_MAX_ROUND_DEC_ID = "UI_TEST_BUTTON_MAX_ROUND_DEC_";
const UI_TEST_BUTTON_MAX_ROUND_INC_ID = "UI_TEST_BUTTON_MAX_ROUND_INC_";
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
const UI_TEST_LABEL_MAX_ROUND_ID = "UI_TEST_LABEL_MAX_ROUND_";
const UI_TEST_LABEL_CUR_ROUND_ID = "UI_TEST_LABEL_CUR_ROUND_";
const UI_TEST_LABEL_CLOCK_TIME_ID = "UI_TEST_LABEL_CLOCK_TIME_";
const UI_TEST_PLUS_TEXT_ID = "UI_TEST_PLUS_TEXT_";
const UI_TEST_MINUS_TEXT_ID = "UI_TEST_MINUS_TEXT_";
const UI_TEST_RESET_TEXT_ID = "UI_TEST_RESET_TEXT_";
const UI_TEST_ROUND_START_TEXT_ID = "UI_TEST_ROUND_START_TEXT_";
const UI_TEST_ROUND_END_TEXT_ID = "UI_TEST_ROUND_END_TEXT_";

// Other shared constants
const CLOCK_POSITION_X = 0;
const CLOCK_POSITION_Y = 53;
const CLOCK_WIDTH = 220;
const CLOCK_HEIGHT = 44;
const ROUND_LIVE_HELP_WIDTH = 300;
const ROUND_LIVE_HELP_HEIGHT = 18;
const CLOCK_FONT_SIZE = 32;
const LOW_TIME_THRESHOLD_SECONDS = 60;
const COLOR_NORMAL = mod.CreateVector(1, 1, 1);
const COLOR_LOW_TIME = mod.CreateVector(1, 131 / 255, 97 / 255);
const BACKGROUND_TIME_LIMIT_RESET_SECONDS = 60 * 60;
const TEAM1_MAIN_BASE_TRIGGER_ID = 501;
const TEAM2_MAIN_BASE_TRIGGER_ID = 500;
const RESTOCK_MAG_AMMO_ENTER = 69;
const RESTOCK_MAG_AMMO_EXIT = 1;

// Main Base Exit/Entry
const STR_ENTERED_MAIN_BASE = "ENTERED_MAIN_BASE";
const STR_EXITED_MAIN_BASE = "EXITED_MAIN_BASE";
const STR_AMMO_RESTOCKED = "AMMO_RESTOCKED";


// Core gameplay tuning defaults (safe to edit)

function getMatchWinsTeam(teamNum: number): number {
    // Debug-only: engine GameModeScore can be transient during reconnects / team swaps.
    return Math.floor(mod.GetGameModeScore(mod.GetTeam(teamNum)));
}

function setMatchWinsTeam(teamNum: number, wins: number): void {
    mod.SetGameModeScore(mod.GetTeam(teamNum), Math.max(0, Math.floor(wins)));
}

// Synchronizes HUD win counters from authoritative match state.
// This should be called after any admin or gameplay mutation of matchWinsT1/T2.

function syncWinCountersHudFromGameModeScore(): void {
    // Debug-only: do not use for authoritative state; pulling from engine here can latch transient values.
    const t1Wins = getMatchWinsTeam(TEAM_1);
    const t2Wins = getMatchWinsTeam(TEAM_2);

    matchWinsT1 = t1Wins;
    matchWinsT2 = t2Wins;
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

function endGameModeForTeamNum(teamNum: number): void {
    const winningTeam = mod.GetTeam(teamNum);

    // End the match by team consistently; ending "by player" can yield inconsistent engine finalization
    // when players reconnect or briefly join different teams.
    mod.EndGameMode(winningTeam);
}

//#endregion

//#region -------------------- Shared ID helpers --------------------
function getObjId(obj: any): number {
    return mod.GetObjId(obj);
}

function getTeamNumber(team: mod.Team): number {
    if (mod.Equals(team, mod.GetTeam(TEAM_1))) return TEAM_1;
    if (mod.Equals(team, mod.GetTeam(TEAM_2))) return TEAM_2;
    return 0;
}

function opposingTeam(teamNum: number): number {
    if (teamNum === TEAM_1) return TEAM_2;
    if (teamNum === TEAM_2) return TEAM_1;
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
//#endregion

//#region -------------------- HUD (Static + Counters) --------------------

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

    helpTextContainer?: mod.UIWidget;

    // Optional roots (for cleanup if needed)
    roots: mod.UIWidget[];
};


// -------------------- Authoritative State Map --------------------
//
// Round state (resets at round start):
// - roundCurrent: current round index (1-based display).
// - roundMax: number of rounds in the match.
// - roundKillsT1 / roundKillsT2: points earned this round by each team.
// - roundKillsTarget: points needed to win the round.
// - roundSecondsRemaining: authoritative remaining seconds in the round.
// - isRoundActive: gate that enables scoring; only true while the round is LIVE.
//
// Match state (resets at match start):
// - matchWinsT1/T2, matchLossesT1/T2, matchTiesT1/T2: match record across rounds.
// - isMatchEnded: indicates match is over and victory dialog should be shown.
//
// Vehicle registration (persists across round transitions unless explicitly cleared):
// - regVehiclesTeam1 (GlobalVariable 0): array of vehicles registered to Team 1.
// - regVehiclesTeam2 (GlobalVariable 1): array of vehicles registered to Team 2.
// - vehIds/vehOwners: best-effort 'last driver' mapping used for messages only.
//
// UI caches (per-player, rebuilt as needed):
// - hudByPid[pid]: cached HUD widget references.
// - dialog/widget caches: cached references to modal UI elements (team switch, victory, clock digits).
//
// ------------------------------------------------------------------

const hudByPid: { [pid: number]: HudRefs } = {};

// Round counters (driven by tester buttons / future logic)
let roundCurrent = 1;
let roundMax = DEFAULT_MAX_ROUNDS;

// Match-critical counters are authoritative in script state and are mirrored to engine score only for display.
let matchWinsT1 = 0;
let matchWinsT2 = 0;

let matchLossesT1 = 0;
let matchLossesT2 = 0;
let matchTiesT1 = 0;
let matchTiesT2 = 0;


// Tester-configured round win condition: first team to reach this many round kills wins immediately.
let roundKillsTarget = DEFAULT_ROUND_KILLS_TARGET;

function setCounterText(widget: mod.UIWidget | undefined, value: number): void {
    if (!widget) return;
    mod.SetUITextLabel(widget, mod.Message(mod.stringkeys.GenericCounterText, Math.floor(value)));
}

function setRoundRecordText(widget: mod.UIWidget | undefined, wins: number, losses: number, ties: number): void {
    if (!widget) return;
    mod.SetUITextLabel(widget, mod.Message(mod.stringkeys.RoundRecordText, Math.floor(wins), Math.floor(losses), Math.floor(ties)));
}


function setRoundStateText(widget: mod.UIWidget | undefined): void {
    if (!widget) return;

    if (isMatchEnded) {
        mod.SetUITextLabel(widget, mod.Message(mod.stringkeys.RoundState_GameOver));
        mod.SetUITextColor(widget, mod.CreateVector(1, 1, 0));
        return;
    }

    const isLive = isRoundActive;
    const stateKey = isLive ? mod.stringkeys.RoundState_Live : mod.stringkeys.RoundState_NotReady;

    mod.SetUITextLabel(
        widget,
        mod.Message(mod.stringkeys.RoundState_Format, mod.stringkeys.RoundText, Math.floor(roundCurrent), stateKey)
    );

    // Color: white when LIVE, red when NOT READY
    mod.SetUITextColor(widget, isLive ? mod.CreateVector(1, 1, 1) : mod.CreateVector(1, 0, 0));
}


function setRoundLiveHelpText(root: mod.UIWidget | undefined, text: mod.UIWidget | undefined): void {
    if (!root || !text) return;

    const show = (!isMatchEnded) && (isRoundActive);
    mod.SetUIWidgetVisible(root, show);

    if (!show) return;

    mod.SetUITextLabel(
        text,
        mod.Message(mod.stringkeys.RoundLiveHelp_Format, Math.floor(roundKillsTarget))
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
}


function getElapsedHmsParts(totalSeconds: number): { hours: number; minutes: number; seconds: number } {
    const sec = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const seconds = sec % 60;
    return { hours, minutes, seconds };
}

function computeTeamOutcomeKey(teamNum: number): number {
    if (matchEndWinnerTeamNum === undefined) {
        return mod.stringkeys.VictoryDialog_Draws;
    }
    return matchEndWinnerTeamNum === teamNum ? mod.stringkeys.VictoryDialog_Wins : mod.stringkeys.VictoryDialog_Loses;
}

/**
 * Updates the per-player Victory dialog widgets to match the current match-end state.
 * Notes:
 * - This function only updates UI text/visibility for a single player; it does not decide winners.
 * - Callers are responsible for ensuring the dialog exists (or for creating it before updating).
 * - Be careful about calling this during countdown/async flows; stale state is possible if tokens changed.
 */

function updateVictoryDialogForPlayer(player: mod.Player, remainingSeconds: number): void {
    // Determine the target player id; dialog widgets are keyed per-player.
const pid = mod.GetObjId(player);
    // Look up cached UI references for this player (if missing, this update becomes a no-op).
const refs = hudByPid[pid];
    if (!refs) return;

    if (refs.victoryRoot) {
        // Apply visibility rules for the dialog parts based on match-end state.
mod.SetUIWidgetVisible(refs.victoryRoot, isVictoryDialogActive);
    }

    if (!isVictoryDialogActive) {
        return;
    }
if (refs.victoryRestartText) {
        // Update string-key labels (Strings.json) so the dialog reflects the latest outcome/countdown.
mod.SetUITextLabel(refs.victoryRestartText, mod.Message(mod.stringkeys.VictoryDialog_RestartIn_Format, Math.max(0, Math.floor(remainingSeconds))));
    }
    const parts = getElapsedHmsParts(matchEndElapsedSecondsSnapshot);
    const hours = Math.min(99, Math.max(0, Math.floor(parts.hours)));
    const minutes = Math.min(59, Math.max(0, Math.floor(parts.minutes)));
    const seconds = Math.min(59, Math.max(0, Math.floor(parts.seconds)));

    const hT = Math.floor(hours / 10);
    const hO = hours % 10;
    const mT = Math.floor(minutes / 10);
    const mO = minutes % 10;
    const sT = Math.floor(seconds / 10);
    const sO = seconds % 10;

    if (refs.victoryTimeHoursTens) mod.SetUITextLabel(refs.victoryTimeHoursTens, mod.Message(mod.stringkeys.MatchTimerDigit, hT));
    if (refs.victoryTimeHoursOnes) mod.SetUITextLabel(refs.victoryTimeHoursOnes, mod.Message(mod.stringkeys.MatchTimerDigit, hO));
    if (refs.victoryTimeMinutesTens) mod.SetUITextLabel(refs.victoryTimeMinutesTens, mod.Message(mod.stringkeys.MatchTimerDigit, mT));
    if (refs.victoryTimeMinutesOnes) mod.SetUITextLabel(refs.victoryTimeMinutesOnes, mod.Message(mod.stringkeys.MatchTimerDigit, mO));
    if (refs.victoryTimeSecondsTens) mod.SetUITextLabel(refs.victoryTimeSecondsTens, mod.Message(mod.stringkeys.MatchTimerDigit, sT));
    if (refs.victoryTimeSecondsOnes) mod.SetUITextLabel(refs.victoryTimeSecondsOnes, mod.Message(mod.stringkeys.MatchTimerDigit, sO));

    if (refs.victoryRoundsSummaryText) {
        mod.SetUITextLabel(refs.victoryRoundsSummaryText, mod.Message(mod.stringkeys.VictoryDialog_RoundsSummary_Format, Math.floor(roundCurrent), Math.floor(roundMax)));
    }

    const t1OutcomeKey = computeTeamOutcomeKey(TEAM_1);
    const t2OutcomeKey = computeTeamOutcomeKey(TEAM_2);

    if (refs.victoryLeftOutcomeText) {
        mod.SetUITextLabel(refs.victoryLeftOutcomeText, mod.Message(mod.stringkeys.VictoryDialog_TeamOutcome_Format, mod.stringkeys.TeamLeft_Name, t1OutcomeKey));
    }
    if (refs.victoryRightOutcomeText) {
        mod.SetUITextLabel(refs.victoryRightOutcomeText, mod.Message(mod.stringkeys.VictoryDialog_TeamOutcome_Format, mod.stringkeys.TeamRight_Name, t2OutcomeKey));
    }

    if (refs.victoryLeftRecordText) {
        mod.SetUITextLabel(refs.victoryLeftRecordText, mod.Message(mod.stringkeys.RoundRecordText, Math.floor(matchWinsT1), Math.floor(matchWinsT2), Math.floor(matchTiesT1)));
    }
    if (refs.victoryRightRecordText) {
        mod.SetUITextLabel(refs.victoryRightRecordText, mod.Message(mod.stringkeys.RoundRecordText, Math.floor(matchWinsT2), Math.floor(matchWinsT1), Math.floor(matchTiesT2)));
    }

    if (refs.victoryLeftRoundWinsText) {
        mod.SetUITextLabel(refs.victoryLeftRoundWinsText, mod.Message(mod.stringkeys.VictoryDialog_RoundWins_Format, Math.floor(matchWinsT1)));
    }
    if (refs.victoryRightRoundWinsText) {
        mod.SetUITextLabel(refs.victoryRightRoundWinsText, mod.Message(mod.stringkeys.VictoryDialog_RoundWins_Format, Math.floor(matchWinsT2)));
    }

    const lossesT1 = matchWinsT2;
    const lossesT2 = matchWinsT1;

    if (refs.victoryLeftRoundLossesText) {
        mod.SetUITextLabel(refs.victoryLeftRoundLossesText, mod.Message(mod.stringkeys.VictoryDialog_RoundLosses_Format, Math.floor(lossesT1)));
    }
    if (refs.victoryRightRoundLossesText) {
        mod.SetUITextLabel(refs.victoryRightRoundLossesText, mod.Message(mod.stringkeys.VictoryDialog_RoundLosses_Format, Math.floor(lossesT2)));
    }
    if (refs.victoryLeftRoundTiesText) {
        mod.SetUITextLabel(refs.victoryLeftRoundTiesText, mod.Message(mod.stringkeys.VictoryDialog_RoundTies_Format, Math.floor(matchTiesT1)));
    }
    if (refs.victoryRightRoundTiesText) {
        mod.SetUITextLabel(refs.victoryRightRoundTiesText, mod.Message(mod.stringkeys.VictoryDialog_RoundTies_Format, Math.floor(matchTiesT2)));
    }

    if (refs.victoryLeftTotalKillsText) {
        mod.SetUITextLabel(refs.victoryLeftTotalKillsText, mod.Message(mod.stringkeys.VictoryDialog_TotalKills_Format, Math.floor(totalKillsT1)));
    }
    if (refs.victoryRightTotalKillsText) {
        mod.SetUITextLabel(refs.victoryRightTotalKillsText, mod.Message(mod.stringkeys.VictoryDialog_TotalKills_Format, Math.floor(totalKillsT2)));
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

function setRoundEndDialogVisibleForAllPlayers(visible: boolean): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const pid = mod.GetObjId(p);
        const refs = hudByPid[pid];
        if (!refs) continue;
        if (refs.roundEndRoot) {
            setWidgetVisible(refs.roundEndRoot, visible);
        }
    }
}

function updateRoundEndDialogForAllPlayers(winnerTeamNum: number): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        updateRoundEndDialogForPlayer(p, winnerTeamNum);
    }
}

function updateRoundEndDialogForPlayer(player: mod.Player, winnerTeamNum: number): void {
    const pid = mod.GetObjId(player);
    const refs = hudByPid[pid];
    if (!refs) return;

    // Ensure labels are always authoritative at the time the dialog is shown.
    if (refs.roundEndRoundText) {
        mod.SetUITextLabel(
            refs.roundEndRoundText,
    // RoundEnd_RoundNumber is a dedicated format key ("ROUND {0}") to avoid passing an empty string into RoundState_Format,
    // which Portal renders as <unknown string> when the key cannot be resolved.
            mod.Message(mod.stringkeys.RoundEnd_RoundNumber, roundCurrent)
        );
    }

    if (refs.roundEndOutcomeText) {
        if (winnerTeamNum === TEAM_1) {
            mod.SetUITextLabel(
                refs.roundEndOutcomeText,
                mod.Message(mod.stringkeys.VictoryDialog_TeamOutcome_Format, mod.stringkeys.TeamLeft_Name, mod.stringkeys.VictoryDialog_Wins)
            );
        } else if (winnerTeamNum === TEAM_2) {
            mod.SetUITextLabel(
                refs.roundEndOutcomeText,
                mod.Message(mod.stringkeys.VictoryDialog_TeamOutcome_Format, mod.stringkeys.TeamRight_Name, mod.stringkeys.VictoryDialog_Wins)
            );
        } else {
            setWidgetText(refs.roundEndOutcomeText, mod.stringkeys.RoundEnd_Draw);
        }
    }

    if (refs.roundEndLeftSummaryText) {
        mod.SetUITextLabel(
            refs.roundEndLeftSummaryText,
            mod.Message(
                mod.stringkeys.RoundState_Format,
                roundKillsT1,
                mod.stringkeys.Label_RoundKills,
                mod.stringkeys.TeamLeft_Name
            )
        );
    }
    if (refs.roundEndRightSummaryText) {
        mod.SetUITextLabel(
            refs.roundEndRightSummaryText,
            mod.Message(
                mod.stringkeys.RoundState_Format,
                roundKillsT2,
                mod.stringkeys.Label_RoundKills,
                mod.stringkeys.TeamRight_Name
            )
        );
    }
}


function isTeamSwitchDialogOpenForPid(pid: number): boolean {
    const root = safeFind(UI_TEAMSWITCH_CONTAINER_BASE_ID + pid);
    return root !== undefined;
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
const refs = hudByPid[pid];
    if (!refs) return;

    const show = (!isMatchEnded) && (!isRoundActive) && (isTeamSwitchDialogOpenForPid(pid) === false);
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
    const cached = hudByPid[pid];
    if (cached && cached.leftKillsText && cached.rightKillsText) {
        const helpContainer = safeFind(`Container_HelpText_${pid}`);
        if (helpContainer) {
            mod.SetUIWidgetPosition(helpContainer, mod.CreateVector(-116.5, 75.25, 0));
        }
        return cached;
    }

    const refs: HudRefs = { pid, roots: [] };

    // --- Static HUD: Upper-left small box ---
    {
        const rootName = `Upper_Left_Container_${pid}`;
        const upperLeft = modlib.ParseUI({
            name: rootName,
            type: "Container",
            playerId: player,
            // position: [x, y] offset; direction depends on anchor, so verify visually in-game
            position: [5, 5],
            size: [164.5, 30],
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
                    size: [154.5, 17],
                    anchor: mod.UIAnchor.CenterLeft,
                    visible: true,
                    padding: 0,
                    bgColor: [0.8353, 0.9216, 0.9765],
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.Blur,
                    textLabel: mod.stringkeys.Upper_Left_Text,
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
                    size: [150, 16.5],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgColor: [0.2, 0.2, 0.2],
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.stringkeys.Upper_Left_Text_2,
                    textColor: [0.6784, 0.9922, 0.5255],
                    textAlpha: 1,
                    textSize: 9,
                    textAnchor: mod.UIAnchor.Center,
                },
            ],
        });
        if (upperLeft) refs.roots.push(upperLeft);
    }

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
                    textLabel: mod.stringkeys.RoundText,
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
                            textLabel: mod.stringkeys.HelpText,
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
                    textLabel: mod.stringkeys.Slash,
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
                    textLabel: mod.stringkeys.TeamLeft_Name,
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
                    textLabel: mod.Message(mod.stringkeys.RoundRecordText, 0, 0, 0),
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
                    textLabel: mod.stringkeys.Label_RoundWins,
                    textColor: [1, 1, 1],
                    textAlpha: 1,
                    textSize: 11,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    // Display variable for round kills on Team 1 (left side)
                    name: `TeamLeft_RoundKills_${pid}`,
                    type: "Text",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [26.5, 42.5],
                    size: [63, 14.5],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgColor: [0.2, 0.2, 0.2],
                    bgAlpha: 1,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.stringkeys.Label_RoundKills,
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
                    textLabel: mod.stringkeys.Label_TotalKills,
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
                    textLabel: mod.stringkeys.TeamRight_Name,
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
                    textLabel: mod.Message(mod.stringkeys.RoundRecordText, 0, 0, 0),
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
                    textLabel: mod.stringkeys.Label_RoundWins,
                    textColor: [1, 1, 1],
                    textAlpha: 1,
                    textSize: 11,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    // Display variable for round kills on Team 2 (right side)
                    name: `TeamRight_RoundKills_${pid}`,
                    type: "Text",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [26.5, 42.5],
                    size: [63, 14.5],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgColor: [0.2, 0.2, 0.2],
                    bgAlpha: 1,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.stringkeys.Label_RoundKills,
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
                    textLabel: mod.stringkeys.Label_TotalKills,
                    textColor: [1, 1, 1],
                    textAlpha: 1,
                    textSize: 11,
                    textAnchor: mod.UIAnchor.Center,
                },
            ],
        });
        if (t2Panel) refs.roots.push(t2Panel);
    }

        refs.leftRecordText = safeFind(`TeamLeft_Record_${pid}`);
        refs.rightRecordText = safeFind(`TeamRight_Record_${pid}`);

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
                        textLabel: mod.stringkeys.GenericCounterText,
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

    

    // --- Match-end Victory Results Dialog (center modal) ---
    {
        const bgColorRgb: [number, number, number] = [0.0314, 0.0431, 0.0431];
        const blueBgColor: [number, number, number] = [0.1098, 0.2304, 0.25];
        const redBgColor: [number, number, number] = [0.25, 0.1284, 0.0951];
        const blueTextColor: [number, number, number] = [0.4392, 0.9216, 1];
        const redTextColor: [number, number, number] = [1, 0.5137, 0.3804];

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
            bgColor: [bgColorRgb[0], bgColorRgb[1], bgColorRgb[2]],
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
                    textLabel: mod.Message(mod.stringkeys.RoundEnd_RoundNumber, roundCurrent),
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
                    textLabel: mod.stringkeys.RoundEnd_Draw,
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
                            textLabel: mod.Message(mod.stringkeys.RoundState_Format, 0, mod.stringkeys.Label_RoundKills, mod.stringkeys.TeamLeft_Name),
                            textColor: [blueTextColor[0], blueTextColor[1], blueTextColor[2]],
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
                            textLabel: mod.stringkeys.MatchTimerColon,
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
                            textLabel: mod.Message(mod.stringkeys.RoundState_Format, 0, mod.stringkeys.Label_RoundKills, mod.stringkeys.TeamRight_Name),
                            textColor: [redTextColor[0], redTextColor[1], redTextColor[2]],
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
            bgColor: [bgColorRgb[0], bgColorRgb[1], bgColorRgb[2]],
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
                    textLabel: mod.stringkeys.Upper_Left_Text,
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
                    textLabel: mod.stringkeys.Upper_Left_Text_2,
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
                    textLabel: mod.stringkeys.VictoryDialog_ScreenshotPrompt,
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
                    textLabel: mod.Message(mod.stringkeys.VictoryDialog_RestartIn_Format, MATCH_END_DELAY_SECONDS),
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
                            textLabel: mod.stringkeys.VictoryDialog_TotalMatchTime_Label,
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
                                    textLabel: mod.Message(mod.stringkeys.MatchTimerDigit, 0),
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
                                    textLabel: mod.Message(mod.stringkeys.MatchTimerDigit, 0),
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
                                    textLabel: mod.Message(mod.stringkeys.MatchTimerColon),
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
                                    textLabel: mod.Message(mod.stringkeys.MatchTimerDigit, 0),
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
                                    textLabel: mod.Message(mod.stringkeys.MatchTimerDigit, 0),
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
                                    textLabel: mod.Message(mod.stringkeys.MatchTimerColon),
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
                                    textLabel: mod.Message(mod.stringkeys.MatchTimerDigit, 0),
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
                                    textLabel: mod.Message(mod.stringkeys.MatchTimerDigit, 0),
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
                    textLabel: mod.Message(mod.stringkeys.VictoryDialog_RoundsSummary_Format, 0, 0),
                    textColor: [1, 1, 1],
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
                            bgColor: [blueBgColor[0], blueBgColor[1], blueBgColor[2]],
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
                                    textLabel: mod.Message(mod.stringkeys.VictoryDialog_TeamOutcome_Format, mod.stringkeys.TeamLeft_Name, mod.stringkeys.VictoryDialog_Loses),
                                    textColor: [blueTextColor[0], blueTextColor[1], blueTextColor[2]],
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
                                    textLabel: mod.Message(mod.stringkeys.RoundRecordText, 0, 0, 0),
                                    textColor: [blueTextColor[0], blueTextColor[1], blueTextColor[2]],
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
                                    textLabel: mod.Message(mod.stringkeys.VictoryDialog_RoundWins_Format, 0),
                                    textColor: [blueTextColor[0], blueTextColor[1], blueTextColor[2]],
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
                                    textLabel: mod.Message(mod.stringkeys.VictoryDialog_RoundLosses_Format, 0),
                                    textColor: [blueTextColor[0], blueTextColor[1], blueTextColor[2]],
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
                                    textLabel: mod.Message(mod.stringkeys.VictoryDialog_RoundTies_Format, 0),
                                    textColor: [blueTextColor[0], blueTextColor[1], blueTextColor[2]],
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
                                    textLabel: mod.Message(mod.stringkeys.VictoryDialog_TotalKills_Format, 0),
                                    textColor: [blueTextColor[0], blueTextColor[1], blueTextColor[2]],
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
                            bgColor: [redBgColor[0], redBgColor[1], redBgColor[2]],
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
                                    textLabel: mod.Message(mod.stringkeys.VictoryDialog_TeamOutcome_Format, mod.stringkeys.TeamRight_Name, mod.stringkeys.VictoryDialog_Wins),
                                    textColor: [redTextColor[0], redTextColor[1], redTextColor[2]],
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
                                    textLabel: mod.Message(mod.stringkeys.RoundRecordText, 0, 0, 0),
                                    textColor: [redTextColor[0], redTextColor[1], redTextColor[2]],
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
                                    textLabel: mod.Message(mod.stringkeys.VictoryDialog_RoundWins_Format, 0),
                                    textColor: [redTextColor[0], redTextColor[1], redTextColor[2]],
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
                                    textLabel: mod.Message(mod.stringkeys.VictoryDialog_RoundLosses_Format, 0),
                                    textColor: [redTextColor[0], redTextColor[1], redTextColor[2]],
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
                                    textLabel: mod.Message(mod.stringkeys.VictoryDialog_RoundTies_Format, 0),
                                    textColor: [redTextColor[0], redTextColor[1], redTextColor[2]],
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
                                    textLabel: mod.Message(mod.stringkeys.VictoryDialog_TotalKills_Format, 0),
                                    textColor: [redTextColor[0], redTextColor[1], redTextColor[2]],
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

    refs.helpTextContainer = safeFind(`Container_HelpText_${pid}`);
hudByPid[pid] = refs;

    // Initialize visible numbers immediately
    setCounterText(refs.roundCurText, roundCurrent);
    setCounterText(refs.roundMaxText, roundMax);
    setCounterText(refs.leftWinsText, matchWinsT1);
    setCounterText(refs.rightWinsText, matchWinsT2);

    setCounterText(refs.leftRoundKillsText, roundKillsT1);
    setCounterText(refs.rightRoundKillsText, roundKillsT2);

    // Total kills are tracked separately from GameModeScore (which is used for match wins)
    setCounterText(refs.leftKillsText, totalKillsT1);
    setCounterText(refs.rightKillsText, totalKillsT2);

    updateVictoryDialogForPlayer(player, getRemainingSeconds());

    return refs;
}

function setHudRoundCountersForAllPlayers(cur: number, max: number): void {
    roundCurrent = Math.max(1, Math.floor(cur));
    roundMax = Math.max(1, Math.floor(max));
    if (roundMax < roundCurrent) {
        roundMax = roundCurrent;
    }

    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const refs = ensureHudForPlayer(p);
        if (!refs) continue;
        setCounterText(refs.roundCurText, roundCurrent);
        setCounterText(refs.roundMaxText, roundMax);
    }

    setRoundStateTextForAllPlayers();
}

function setHudWinCountersForAllPlayers(t1Wins: number, t2Wins: number): void {
    const lw = Math.max(0, Math.floor(t1Wins));
    const rw = Math.max(0, Math.floor(t2Wins));

    // Match wins are authoritative in script state; GameModeScore is mirrored for scoreboard display.
    setMatchWinsTeam(TEAM_1, lw);
    setMatchWinsTeam(TEAM_2, rw);

    // Cache locally for immediate UI + logic.
    matchWinsT1 = lw;
    matchWinsT2 = rw;

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
    matchLossesT1 = matchWinsT2;
    matchLossesT2 = matchWinsT1;

    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const refs = ensureHudForPlayer(p);
        if (!refs) continue;
        setRoundRecordText(refs.leftRecordText, matchWinsT1, matchLossesT1, matchTiesT1);
        setRoundRecordText(refs.rightRecordText, matchWinsT2, matchLossesT2, matchTiesT2);
    }
}

//#endregion

//#region -------------------- Vehicle Scoring State (registered vehicles + ownership) --------------------
const regVehiclesTeam1 = mod.GlobalVariable(0);
const regVehiclesTeam2 = mod.GlobalVariable(1);

// Vehicle ownership tracking (best-effort heuristic):
// - vehIds and vehOwners are parallel arrays keyed by vehicle ObjId.
// - getLastDriver may return undefined if no enter event was observed for the vehicle.
// - Do not treat this as authoritative killer attribution; it is used only for informative messaging.
const vehIds: number[] = [];
const vehOwners: mod.Player[] = [];
//#endregion

//#region Legacy UI Cleanup (old score_root_* containers)
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
//#endregion

//#region Portal Array Helpers (engine arrays)
function arrayContainsVehicle(arr: any, vehicle: mod.Vehicle): boolean {
    return modlib.IsTrueForAny(arr, (el: any) => mod.Equals(el, vehicle));
}

function arrayRemoveVehicle(arr: any, vehicle: mod.Vehicle): any {
    return modlib.FilteredArray(arr, (el: any) => mod.NotEqualTo(el, vehicle));
}
//#endregion

//#region Vehicle Ownership Tracking (vehIds/vehOwners)
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
//#endregion

//#region Vehicle Registration (team arrays)
// Registers vehicle ownership to a team for kill attribution.
// IMPORTANT:
// - Vehicle ID and owning team must stay in sync
// - Reassignments must overwrite previous ownership

function registerVehicleToTeam(vehicle: mod.Vehicle, teamNum: number): void {
    mod.SetVariable(regVehiclesTeam1, arrayRemoveVehicle(mod.GetVariable(regVehiclesTeam1), vehicle));
    mod.SetVariable(regVehiclesTeam2, arrayRemoveVehicle(mod.GetVariable(regVehiclesTeam2), vehicle));

    if (teamNum === TEAM_1) {
        mod.SetVariable(regVehiclesTeam1, mod.AppendToArray(mod.GetVariable(regVehiclesTeam1), vehicle));
    } else if (teamNum === TEAM_2) {
        mod.SetVariable(regVehiclesTeam2, mod.AppendToArray(mod.GetVariable(regVehiclesTeam2), vehicle));
    }
}
//#endregion

//#region Kills HUD Sync (GameModeScore -> HUD)
let lastHudScoreT1: number | undefined;
let lastHudScoreT2: number | undefined;

function syncKillsHudFromTrackedTotals(_force: boolean): void {
    // Total kills are tracked in script variables; GameModeScore is reserved for match wins.
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const refs = ensureHudForPlayer(p);
        if (!refs) continue;
        setCounterText(refs.leftKillsText, totalKillsT1);
        setCounterText(refs.rightKillsText, totalKillsT2);
    }
}


// Round kills HUD Sync (RoundKills -> HUD)
let lastHudRoundKillsT1: number | undefined;
let lastHudRoundKillsT2: number | undefined;

function syncRoundKillsHud(force: boolean = false): void {
    if (!force && lastHudRoundKillsT1 === roundKillsT1 && lastHudRoundKillsT2 === roundKillsT2) return;

    lastHudRoundKillsT1 = roundKillsT1;
    lastHudRoundKillsT2 = roundKillsT2;

    const players = mod.AllPlayers();
    const count = mod.CountOf(players);

    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i);
        const refs = ensureHudForPlayer(p);
        if (!refs) continue;

        setCounterText(refs.leftRoundKillsText, roundKillsT1);
        setCounterText(refs.rightRoundKillsText, roundKillsT2);
    }
}

//#endregion

//#region -------------------- Match Clock (per-player MM:SS) --------------------

let durationSeconds = ROUND_CLOCK_DEFAULT_SECONDS;

let matchStartElapsedSeconds: number | undefined;
let pausedRemainingSeconds: number | undefined;
let isPaused = false;

let lastDisplayedSeconds: number | undefined;
let lastLowTimeState: boolean | undefined;

let expiryFired = false;
const expiryHandlers: Array<() => void> = [];

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
    roundLiveHelpRoot?: mod.UIWidget;
    roundLiveHelpText?: mod.UIWidget;
    minTens: mod.UIWidget;
    minOnes: mod.UIWidget;
    colon: mod.UIWidget;
    secTens: mod.UIWidget;
    secOnes: mod.UIWidget;
}

const clockWidgetCache: { [playerId: number]: ClockWidgetCacheEntry } = {};

export function ResetRoundClock(seconds: number): void {
    durationSeconds = Math.max(0, Math.floor(seconds));
    matchStartElapsedSeconds = Math.floor(mod.GetMatchTimeElapsed());

    isPaused = false;
    pausedRemainingSeconds = undefined;

    expiryFired = false;
    lastDisplayedSeconds = undefined;
    lastLowTimeState = undefined;
}

function getRemainingSeconds(): number {
    if (isPaused) {
        return Math.max(0, pausedRemainingSeconds !== undefined ? pausedRemainingSeconds : 0);
    }

    if (matchStartElapsedSeconds === undefined) return 0;

    const elapsed = Math.floor(mod.GetMatchTimeElapsed()) - matchStartElapsedSeconds;
    return Math.max(0, durationSeconds - elapsed);
}

function adjustRoundClockBySeconds(deltaSeconds: number): void {
    const delta = Math.floor(deltaSeconds);

    if (isPaused) {
        const current = pausedRemainingSeconds !== undefined ? pausedRemainingSeconds : 0;
        pausedRemainingSeconds = Math.max(0, current + delta);
        durationSeconds = Math.max(0, durationSeconds + delta);
    } else {
        durationSeconds = Math.max(0, durationSeconds + delta);
    }

    if (delta > 0) {
        expiryFired = false;
    }

    lastDisplayedSeconds = undefined;
    lastLowTimeState = undefined;
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

    if (!expiryFired && remaining <= 0) {
        expiryFired = true;
        for (let i = 0; i < expiryHandlers.length; i++) {
            expiryHandlers[i]();
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

        if (lastLowTimeState === undefined || lowTime !== lastLowTimeState) {
            setClockColorCached(cacheEntry, lowTime ? COLOR_LOW_TIME : COLOR_NORMAL);
        }

        if (lastDisplayedSeconds !== remaining) {
            setDigitCached(cacheEntry.minTens, digits.mT);
            setDigitCached(cacheEntry.minOnes, digits.mO);
            setColonCached(cacheEntry.colon);
            setDigitCached(cacheEntry.secTens, digits.sT);
            setDigitCached(cacheEntry.secOnes, digits.sO);
        }

        updateVictoryDialogForPlayer(player, remaining);
    }

    lastLowTimeState = lowTime;
    lastDisplayedSeconds = remaining;
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

    const cached = clockWidgetCache[pid];
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
        size: [CLOCK_WIDTH, 18],
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
                textLabel: mod.stringkeys.RoundState_NotReady,
                textColor: [1, 1, 1],
                textAlpha: 1,
                textSize: 12,
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
                textLabel: mod.stringkeys.RoundLiveHelp_Format,
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
        roundLiveHelpRoot: safeFind(roundLiveHelpRootName) as mod.UIWidget,
        roundLiveHelpText: safeFind("RoundLiveHelpText_" + pid) as mod.UIWidget,
    };

    if (!entry.minTens || !entry.minOnes || !entry.colon || !entry.secTens || !entry.secOnes || !entry.roundStateText || !entry.roundLiveHelpRoot || !entry.roundLiveHelpText) {
        return undefined;
    }

    clockWidgetCache[pid] = entry;
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
        textLabel: mod.stringkeys.MatchTimerDigit,
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
        textLabel: mod.stringkeys.MatchTimerColon,
        textSize: CLOCK_FONT_SIZE,
        textAnchor: mod.UIAnchor.Center,
    };
}

function setDigitCached(widget: mod.UIWidget, digit: number): void {
    mod.SetUITextLabel(widget, mod.Message(mod.stringkeys.MatchTimerDigit, digit));
}

function setColonCached(widget: mod.UIWidget): void {
    mod.SetUITextLabel(widget, mod.Message(mod.stringkeys.MatchTimerColon));
}

function setClockColorCached(cacheEntry: ClockWidgetCacheEntry, color: any): void {
    mod.SetUITextColor(cacheEntry.minTens, color);
    mod.SetUITextColor(cacheEntry.minOnes, color);
    mod.SetUITextColor(cacheEntry.colon, color);
    mod.SetUITextColor(cacheEntry.secTens, color);
    mod.SetUITextColor(cacheEntry.secOnes, color);
}
//#endregion

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
}

const TEAMSWITCHCONFIG: TeamSwitchConfig = {
    enableTeamSwitch: true,
    interactPointMinLifetime: 1,
    interactPointMaxLifetime: 3,
    velocityThreshold: 3,
};

const teamSwitchData: { [id: number]: teamSwitchData_t } = {};
//#endregion

//#region Team Switch Logic (interact point + swap teams)
async function spawnTeamSwitchInteractPoint(eventPlayer: mod.Player) {
    const playerId = mod.GetObjId(eventPlayer);
    if (!teamSwitchData[playerId]) initTeamSwitchData(eventPlayer);

    if (
        teamSwitchData[playerId].interactPoint === null &&
        !teamSwitchData[playerId].dontShowAgain &&
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
        teamSwitchData[playerId].interactPoint = interactPoint;
        teamSwitchData[playerId].lastDeployTime = mod.GetMatchTimeElapsed();
    }
}

function teamSwitchInteractPointActivated(eventPlayer: mod.Player, eventInteractPoint: mod.InteractPoint) {
    const playerId = mod.GetObjId(eventPlayer);
    if (!teamSwitchData[playerId]) initTeamSwitchData(eventPlayer);

    if (teamSwitchData[playerId].interactPoint != null) {
        const interactPointId = mod.GetObjId(teamSwitchData[playerId].interactPoint);
        const eventInteractPointId = mod.GetObjId(eventInteractPoint);
        if (interactPointId === eventInteractPointId) {
            mod.EnableUIInputMode(true, eventPlayer);
            createTeamSwitchUI(eventPlayer);
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

    if (!teamSwitchData[playerId]) return;

    if (teamSwitchData[playerId].interactPoint != null) {
        mod.EnableInteractPoint(teamSwitchData[playerId].interactPoint as mod.InteractPoint, false);
        mod.UnspawnObject(teamSwitchData[playerId].interactPoint as mod.InteractPoint);
        teamSwitchData[playerId].interactPoint = null;
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
        if (!teamSwitchData[playerId]) initTeamSwitchData(eventPlayer);

        if (teamSwitchData[playerId].interactPoint != null) {
            const lifetime = mod.GetMatchTimeElapsed() - teamSwitchData[playerId].lastDeployTime;

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
    teamSwitchData[playerId] = {
        dontShowAgain: false,
        interactPoint: null,
        lastDeployTime: 0,
    };
}

// Handles a player-initiated team switch.
// This function validates the request, updates team membership,
// and triggers any required HUD or state refresh.

function processTeamSwitch(eventPlayer: mod.Player) {
    // Steps:
    // 1) Validate the request (phase, allowed teams, cooldowns)
    // 2) Apply the team assignment change
    // 3) Refresh HUD/UI for the affected player(s)

    mod.SetTeam(
        eventPlayer,
        mod.Equals(mod.GetTeam(eventPlayer), mod.GetTeam(TEAM_2)) ? mod.GetTeam(TEAM_1) : mod.GetTeam(TEAM_2)
    );

    mod.UndeployPlayer(eventPlayer);
    mod.DisplayHighlightedWorldLogMessage(mod.Message(mod.stringkeys.NOTIFICATION_TEAMSWITCH), mod.GetTeam(eventPlayer));
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

    mod.DeleteUIWidget(mod.FindUIWidgetWithName(UI_TEAMSWITCH_CONTAINER_BASE_ID + playerId, mod.GetUIRoot()));
    const debugWidget = safeFind(UI_TEAMSWITCH_DEBUG_TIMELIMIT_ID + playerId);
    if (debugWidget) {
        mod.DeleteUIWidget(debugWidget);
    }

    updateHelpTextVisibilityForPid(playerId);
}
//#endregion


// Runs round start/end flow tied to the round clock expiry.

// Victory dialog visibility is intentionally decoupled from isMatchEnded.
// isMatchEnded can become true at round end, but the Victory UI should only appear after the 10s round-end window expires.
// isVictoryDialogActive gates both visibility and countdown updates so the restart timer always starts at 45s when the dialog appears.

let isRoundActive = false;
let isMatchEnded = false;
let isVictoryDialogActive = false;

// Async control (round end):
// - roundEndRedeployToken invalidates any in-flight 'round end' countdowns when incremented.
// - Any async function that waits must capture the token at start and exit if the token changes.
// - Rationale: prevents overlapping redeploy/countdown flows if multiple end-round triggers fire.
// Async flow guard tokens:
// - Any async countdown or delayed action must capture the current token at start and exit early if the token changes.
// - Only one round-end redeploy countdown and one match-end delay window are intended to be active at a time.
let roundEndRedeployToken = 0;
// Async control (match end):
// - matchEndDelayToken invalidates any in-flight 'match end' delays when incremented.
// - Only one match-end delay should be active at a time; always token-check after waits.
let matchEndDelayToken = 0;
let roundClockExpiryBound = false;
let roundKillsT1 = 0;
let roundKillsT2 = 0;

let totalKillsT1 = 0;
let totalKillsT2 = 0;

// Match-end snapshot values for the victory results dialog
let matchEndWinnerTeamNum: number | undefined = undefined;
let matchEndElapsedSecondsSnapshot: number = 0;
let victoryStartElapsedSecondsSnapshot: number = 0;

function broadcastStringKey(stringKey: number, arg0?: string | number | mod.Player, arg1?: string | number | mod.Player, arg2?: string | number | mod.Player): void {
    if (arg0 === undefined) {
        mod.DisplayNotificationMessage(mod.Message(stringKey));
        return;
    }
    if (arg1 === undefined) {
        mod.DisplayNotificationMessage(mod.Message(stringKey, arg0));
        return;
    }
    if (arg2 === undefined) {
        mod.DisplayNotificationMessage(mod.Message(stringKey, arg0, arg1));
        return;
    }
    mod.DisplayNotificationMessage(mod.Message(stringKey, arg0, arg1, arg2));
}


function broadcastHighlightedStringKey(
    stringKey: number,
    arg0?: string | number | mod.Player,
    arg1?: string | number | mod.Player,
    arg2?: string | number | mod.Player
): void {
    if (arg0 === undefined) {
        mod.DisplayHighlightedWorldLogMessage(mod.Message(stringKey));
        return;
    }
    if (arg1 === undefined) {
        mod.DisplayHighlightedWorldLogMessage(mod.Message(stringKey, arg0));
        return;
    }
    if (arg2 === undefined) {
        mod.DisplayHighlightedWorldLogMessage(mod.Message(stringKey, arg0, arg1));
        return;
    }
    mod.DisplayHighlightedWorldLogMessage(mod.Message(stringKey, arg0, arg1, arg2));
}

//function broadcastNotificationMessage(message: mod.Message): void {
//    mod.DisplayNotificationMessage(message);
//}

// Standard round-end flow: after ROUND_END_REDEPLOY_DELAY_SECONDS, hide the round-end dialog and redeploy all players.
// roundEndRedeployToken cancels older timers if a new round end is triggered before the delay completes.
async function scheduleRoundEndRedeploy(expectedToken: number): Promise<void> {
    await mod.Wait(ROUND_END_REDEPLOY_DELAY_SECONDS);

    if (expectedToken !== roundEndRedeployToken) {
        return;
    }
    if (isRoundActive) {
        return;
    }

    // Hide the round-end dialog at the redeploy boundary so it never outlives the round-end window.
    setRoundEndDialogVisibleForAllPlayers(false);

    // Skip redeploy when the match has ended (victory dialog continues through the match-end flow).
    if (isMatchEnded) {
        return;
// Final-round flow: keep the round-end dialog visible for the normal 10s window, then hide it and show the Victory dialog for MATCH_END_DELAY_SECONDS.
// This uses matchEndDelayToken as a cancellation token so admin actions or unexpected state changes cannot trigger stale delayed UI.
    }

    mod.UndeployAllPlayers();
}


async function scheduleFinalRoundVictory(expectedToken: number, winningTeamNum: number): Promise<void> {
    await mod.Wait(ROUND_END_REDEPLOY_DELAY_SECONDS);

    if (expectedToken !== matchEndDelayToken) {
        return;
    }
    if (!isMatchEnded) {
        return;
    }

    // Hide the round-end dialog when the round-end window expires, even on the final round.
    setRoundEndDialogVisibleForAllPlayers(false);

    // Start the match-end victory flow only after the round-end window completes.
    victoryStartElapsedSecondsSnapshot = Math.floor(mod.GetMatchTimeElapsed());
    matchEndElapsedSecondsSnapshot = victoryStartElapsedSecondsSnapshot;
    isVictoryDialogActive = true;
    isPaused = false;
    pausedRemainingSeconds = undefined;
    ResetRoundClock(MATCH_END_DELAY_SECONDS);
    updateVictoryDialogForAllPlayers(MATCH_END_DELAY_SECONDS);

    void scheduleMatchEnd(expectedToken, winningTeamNum);
}

async function scheduleMatchEnd(expectedToken: number, winningTeamNum?: number): Promise<void> {
    await mod.Wait(MATCH_END_DELAY_SECONDS);

    if (expectedToken !== matchEndDelayToken) {
        return;
    }
    if (!isMatchEnded) {
        return;
    }

    if (winningTeamNum !== undefined && winningTeamNum !== 0) {
        endGameModeForTeamNum(winningTeamNum);
        return;
    }

    mod.EndGameMode(mod.GetTeam(0));
}

function bindRoundClockExpiryToRoundEnd(): void {
    if (roundClockExpiryBound) return;
    roundClockExpiryBound = true;

    expiryHandlers.push(() => {
        if (isRoundActive) {
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
    if (isMatchEnded) {
    // Steps:
    // 1) Reset round-scoped counters and flags
    // 2) Initialize the round clock from ROUND_START_SECONDS
    // 3) Push HUD/UI updates for the new round state

        return;
    }

    bindRoundClockExpiryToRoundEnd();
    isRoundActive = true;
    // Extends the built-in gamemode time limit so the match always has a full hour remaining after each round start.
    const elapsedSeconds = Math.floor(mod.GetMatchTimeElapsed());
    mod.SetGameModeTimeLimit(elapsedSeconds + BACKGROUND_TIME_LIMIT_RESET_SECONDS);
    setRoundStateTextForAllPlayers();
    updateHelpTextVisibilityForAllPlayers();
    setRoundEndDialogVisibleForAllPlayers(false);

    roundKillsT1 = 0;
    roundKillsT2 = 0;

    syncRoundKillsHud(true);

    ResetRoundClock(ROUND_START_SECONDS);
    broadcastStringKey(mod.stringkeys.NOTIFICATION_ROUND_STARTED);
}

// Ends the current round and schedules transition to the next state.
// Notes:
// - Round end reason is determined before this call
// - Redeploy delay and next-round scheduling are time-based
// - Match end is handled separately and must not be triggered here

function endRound(_triggerPlayer?: mod.Player, freezeRemainingSeconds?: number): void {
    if (!isRoundActive) {
    // Steps:
    // 1) Freeze round-live systems (no further scoring)
    // 2) Schedule redeploy / transition using ROUND_END_REDEPLOY_DELAY_SECONDS
    // 3) If match should end, hand off to match-end path (not round path)

        return;
    }
    isRoundActive = false;

    // Freeze display after ending the round.
    isPaused = true;
    pausedRemainingSeconds = Math.max(0, freezeRemainingSeconds !== undefined ? Math.floor(freezeRemainingSeconds) : 0);

    const winnerTeamNum = (roundKillsT1 > roundKillsT2) ? TEAM_1 : ((roundKillsT2 > roundKillsT1) ? TEAM_2 : 0);
    updateRoundEndDialogForAllPlayers(winnerTeamNum);
    setRoundEndDialogVisibleForAllPlayers(true);

    const t1 = roundKillsT1;
    const t2 = roundKillsT2;

    if (t1 > t2) {
        const newT1Wins = matchWinsT1 + 1;
        const newT2Wins = matchWinsT2;
        setHudWinCountersForAllPlayers(newT1Wins, newT2Wins);
        broadcastStringKey(mod.stringkeys.NOTIFICATION_ROUND_END_WIN, mod.stringkeys.TeamLeft_Name, t1, t2);
        broadcastHighlightedStringKey(mod.stringkeys.NOTIFICATION_ROUND_WINS, newT1Wins, newT2Wins);
    } else if (t2 > t1) {
        const newT1Wins = matchWinsT1;
        const newT2Wins = matchWinsT2 + 1;
        setHudWinCountersForAllPlayers(newT1Wins, newT2Wins);
        broadcastStringKey(mod.stringkeys.NOTIFICATION_ROUND_END_WIN, mod.stringkeys.TeamRight_Name, t2, t1);
        broadcastHighlightedStringKey(mod.stringkeys.NOTIFICATION_ROUND_WINS, newT1Wins, newT2Wins);
    } else {
        matchTiesT1 = matchTiesT1 + 1;
        matchTiesT2 = matchTiesT2 + 1;
        syncRoundRecordHudForAllPlayers();
        broadcastStringKey(mod.stringkeys.NOTIFICATION_ROUND_END_TIE, t1, t2);
        broadcastHighlightedStringKey(mod.stringkeys.NOTIFICATION_ROUND_WINS, matchWinsT1, matchWinsT2);
    }

    // End match when a team reaches the required majority of wins.
    const winsNeeded = Math.floor(roundMax / 2) + 1;
    if (roundMax >= 1) {
        if (matchWinsT1 >= winsNeeded) {
            isMatchEnded = true;
            updateHelpTextVisibilityForAllPlayers();
            setRoundStateTextForAllPlayers();
            matchEndWinnerTeamNum = TEAM_1;
            matchEndDelayToken = (matchEndDelayToken + 1) % 1000000000;
            const matchEndToken = matchEndDelayToken;
            void scheduleFinalRoundVictory(matchEndToken, TEAM_1);
            return;
        }
        if (matchWinsT2 >= winsNeeded) {
            isMatchEnded = true;
            updateHelpTextVisibilityForAllPlayers();
            setRoundStateTextForAllPlayers();
            matchEndWinnerTeamNum = TEAM_2;
            matchEndDelayToken = (matchEndDelayToken + 1) % 1000000000;
            const matchEndToken = matchEndDelayToken;
            void scheduleFinalRoundVictory(matchEndToken, TEAM_2);
            return;
        }
    }

    // End match in a draw if the configured max rounds are completed without a majority winner.
    if (roundMax >= 1 && roundCurrent >= roundMax) {
        isMatchEnded = true;
        updateHelpTextVisibilityForAllPlayers();
        setRoundStateTextForAllPlayers();
        matchEndWinnerTeamNum = undefined;
        matchEndDelayToken = (matchEndDelayToken + 1) % 1000000000;
        const matchEndToken = matchEndDelayToken;
        void scheduleFinalRoundVictory(matchEndToken, 0);
        return;
    }
    
    roundEndRedeployToken = (roundEndRedeployToken + 1) % 1000000000;
    const redeployToken = roundEndRedeployToken;

    broadcastHighlightedStringKey(mod.stringkeys.NOTIFICATION_ROUND_OVER_REDEPLOYING, ROUND_END_REDEPLOY_DELAY_SECONDS);
    void scheduleRoundEndRedeploy(redeployToken);

// Prepare next round counters after ending the active round.
    roundCurrent = Math.floor(roundCurrent) + 1;
    setHudRoundCountersForAllPlayers(roundCurrent, roundMax);
    setRoundStateTextForAllPlayers();
    updateHelpTextVisibilityForAllPlayers();
}


//#region Team Switch UI + Tester Panel (IDs + build helpers)

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
            processTeamSwitch(eventPlayer);
            break;

        case UI_TEAMSWITCH_BUTTON_CANCEL_ID + playerId:
            deleteTeamSwitchUI(eventPlayer);
            break;

        case UI_TEAMSWITCH_BUTTON_OPTOUT_ID + playerId:
            if (!teamSwitchData[playerId]) initTeamSwitchData(eventPlayer);
            teamSwitchData[playerId].dontShowAgain = true;
            deleteTeamSwitchUI(eventPlayer);
            break;

        //#region Tester Button Events
        case UI_TEST_BUTTON_LEFT_WINS_DEC_ID + playerId:
            setHudWinCountersForAllPlayers(Math.max(0, matchWinsT1 - 1), matchWinsT2);
            break;
        case UI_TEST_BUTTON_LEFT_WINS_INC_ID + playerId:
            setHudWinCountersForAllPlayers(matchWinsT1 + 1, matchWinsT2);
            break;

        case UI_TEST_BUTTON_RIGHT_WINS_DEC_ID + playerId:
            setHudWinCountersForAllPlayers(matchWinsT1, Math.max(0, matchWinsT2 - 1));
            break;
        case UI_TEST_BUTTON_RIGHT_WINS_INC_ID + playerId:
            setHudWinCountersForAllPlayers(matchWinsT1, matchWinsT2 + 1);
            break;

        case UI_TEST_BUTTON_LEFT_KILLS_DEC_ID + playerId:
            totalKillsT1 = Math.max(0, totalKillsT1 - 1);
            syncKillsHudFromTrackedTotals(true);
            break;
        case UI_TEST_BUTTON_LEFT_KILLS_INC_ID + playerId:
            totalKillsT1 = totalKillsT1 + 1;
            syncKillsHudFromTrackedTotals(true);
            break;

        case UI_TEST_BUTTON_RIGHT_KILLS_DEC_ID + playerId:
            totalKillsT2 = Math.max(0, totalKillsT2 - 1);
            syncKillsHudFromTrackedTotals(true);
            break;
        case UI_TEST_BUTTON_RIGHT_KILLS_INC_ID + playerId:
            totalKillsT2 = totalKillsT2 + 1;
            syncKillsHudFromTrackedTotals(true);
            break;

        case UI_ADMIN_BUTTON_T1_ROUND_KILLS_DEC_ID + playerId:
            roundKillsT1 = Math.max(0, roundKillsT1 - 1);
            syncRoundKillsHud(true);
            break;
        case UI_ADMIN_BUTTON_T1_ROUND_KILLS_INC_ID + playerId:
            roundKillsT1 = roundKillsT1 + 1;
            syncRoundKillsHud(true);
            break;

        case UI_ADMIN_BUTTON_T2_ROUND_KILLS_DEC_ID + playerId:
            roundKillsT2 = Math.max(0, roundKillsT2 - 1);
            syncRoundKillsHud(true);
            break;
        case UI_ADMIN_BUTTON_T2_ROUND_KILLS_INC_ID + playerId:
            roundKillsT2 = roundKillsT2 + 1;
            syncRoundKillsHud(true);
            break;

        case UI_TEST_BUTTON_ROUND_KILLS_TARGET_DEC_ID + playerId:
            roundKillsTarget = Math.max(1, roundKillsTarget - 1);
            syncRoundKillsTargetTesterValueForAllPlayers();
            break;
        case UI_TEST_BUTTON_ROUND_KILLS_TARGET_INC_ID + playerId:
            roundKillsTarget = roundKillsTarget + 1;
            syncRoundKillsTargetTesterValueForAllPlayers();
            break;


        case UI_TEST_BUTTON_MAX_ROUND_DEC_ID + playerId:
            setHudRoundCountersForAllPlayers(roundCurrent, Math.max(roundCurrent, Math.max(1, roundMax - 1)));
            break;
        case UI_TEST_BUTTON_MAX_ROUND_INC_ID + playerId:
            setHudRoundCountersForAllPlayers(roundCurrent, roundMax + 1);
            break;

        case UI_TEST_BUTTON_CUR_ROUND_DEC_ID + playerId:
            setHudRoundCountersForAllPlayers(Math.max(0, roundCurrent - 1), roundMax);
            break;
        case UI_TEST_BUTTON_CUR_ROUND_INC_ID + playerId:
            setHudRoundCountersForAllPlayers(roundCurrent + 1, roundMax);
            break;

        case UI_TEST_BUTTON_CLOCK_TIME_DEC_ID + playerId:
            adjustRoundClockBySeconds(-60);
            break;
        case UI_TEST_BUTTON_CLOCK_TIME_INC_ID + playerId:
            if (!isPaused && getRemainingSeconds() < 0) {
                ResetRoundClock(60);
            } else {
                adjustRoundClockBySeconds(60);
            }
            break;

        case UI_TEST_BUTTON_CLOCK_RESET_ID + playerId:
            resetRoundClockToDefault();
            break;

        case UI_TEST_BUTTON_ROUND_START_ID + playerId:
            startRound(eventPlayer);
            break;
        case UI_TEST_BUTTON_ROUND_END_ID + playerId:
            endRound(eventPlayer);
            break;
        //#endregion

        default:
            break;
    }
}

// Builds the entire Team Switch + Admin Panel dialog.
// Responsibilities:
// - Creates left team, right team, and admin panel UI sections
// - Defines layout constants and row math for the admin panel
// - Wires all admin buttons to authoritative match state mutations
// - Ensures per-player UI roots are created once and reused

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
        mod.CreateVector(0, 0, 0),
        mod.CreateVector(1300, 700, 0),
        mod.UIAnchor.Center,
        mod.GetUIRoot(),
        true,
        10,
        mod.CreateVector(0, 0, 0),
        1,
        mod.UIBgFill.Blur,
        mod.UIDepth.AboveGameUI,
        eventPlayer
    );
    const CONTAINER_BASE = mod.FindUIWidgetWithName(CONTAINER_BASE_ID, mod.GetUIRoot());

    // Shows the current inferred gamemode time limit (seconds) while the team switch dialog is open.
    const debugTimeLimitSeconds = Math.floor(mod.GetMatchTimeElapsed() + mod.GetMatchTimeRemaining());
    const DEBUG_TIMELIMIT_ID = UI_TEAMSWITCH_DEBUG_TIMELIMIT_ID + playerId;
    mod.AddUIText(
        DEBUG_TIMELIMIT_ID,
        mod.CreateVector(-10, 10, 0),
        mod.CreateVector(180, 40, 0),
        mod.UIAnchor.TopRight,
        mod.Message(mod.stringkeys.UI_TEAMSWITCH_DEBUG_TIMELIMIT, debugTimeLimitSeconds),
        eventPlayer
    );
    const DEBUG_TIMELIMIT = mod.FindUIWidgetWithName(DEBUG_TIMELIMIT_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(DEBUG_TIMELIMIT, 0);

    mod.AddUIButton(BUTTON_TEAM1_ID, mod.CreateVector(0, 0, 0), mod.CreateVector(300, 100, 0), mod.UIAnchor.TopLeft, eventPlayer);
    const BUTTON_TEAM1 = mod.FindUIWidgetWithName(BUTTON_TEAM1_ID, mod.GetUIRoot());
    mod.SetUIWidgetParent(BUTTON_TEAM1, CONTAINER_BASE);
    mod.SetUIButtonEnabled(BUTTON_TEAM1, !mod.Equals(mod.GetTeam(eventPlayer), mod.GetTeam(TEAM_1)));

    mod.AddUIText(
        BUTTON_TEAM1_LABEL_ID,
        mod.CreateVector(0, 0, 0),
        mod.CreateVector(300, 100, 0),
        mod.UIAnchor.TopLeft,
        mod.Message(mod.stringkeys.UI_TEAMSWITCH_BUTTON_TEAM1_LABEL),
        eventPlayer
    );
    const BUTTON_TEAM1_LABEL = mod.FindUIWidgetWithName(BUTTON_TEAM1_LABEL_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(BUTTON_TEAM1_LABEL, 0);
    mod.SetUIWidgetParent(BUTTON_TEAM1_LABEL, CONTAINER_BASE);

    mod.AddUIButton(BUTTON_TEAM2_ID, mod.CreateVector(0, 110, 0), mod.CreateVector(300, 100, 0), mod.UIAnchor.TopLeft, eventPlayer);
    const BUTTON_TEAM2 = mod.FindUIWidgetWithName(BUTTON_TEAM2_ID, mod.GetUIRoot());
    mod.SetUIWidgetParent(BUTTON_TEAM2, CONTAINER_BASE);
    mod.SetUIButtonEnabled(BUTTON_TEAM2, !mod.Equals(mod.GetTeam(eventPlayer), mod.GetTeam(TEAM_2)));

    mod.AddUIText(
        BUTTON_TEAM2_LABEL_ID,
        mod.CreateVector(0, 110, 0),
        mod.CreateVector(300, 100, 0),
        mod.UIAnchor.TopLeft,
        mod.Message(mod.stringkeys.UI_TEAMSWITCH_BUTTON_TEAM2_LABEL),
        eventPlayer
    );
    const BUTTON_TEAM2_LABEL = mod.FindUIWidgetWithName(BUTTON_TEAM2_LABEL_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(BUTTON_TEAM2_LABEL, 0);
    mod.SetUIWidgetParent(BUTTON_TEAM2_LABEL, CONTAINER_BASE);

    mod.AddUIButton(BUTTON_SPECTATE_ID, mod.CreateVector(0, 220, 0), mod.CreateVector(300, 100, 0), mod.UIAnchor.TopLeft, eventPlayer);
    const BUTTON_SPECTATE = mod.FindUIWidgetWithName(BUTTON_SPECTATE_ID, mod.GetUIRoot());
    mod.SetUIWidgetParent(BUTTON_SPECTATE, CONTAINER_BASE);
    mod.SetUIButtonEnabled(BUTTON_SPECTATE, false);

    mod.AddUIText(
        BUTTON_SPECTATE_LABEL_ID,
        mod.CreateVector(0, 220, 0),
        mod.CreateVector(300, 100, 0),
        mod.UIAnchor.TopLeft,
        mod.Message(mod.stringkeys.UI_TEAMSWITCH_BUTTON_SPECTATE_LABEL),
        eventPlayer
    );
    const BUTTON_SPECTATE_LABEL = mod.FindUIWidgetWithName(BUTTON_SPECTATE_LABEL_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(BUTTON_SPECTATE_LABEL, 0);
    mod.SetUIWidgetParent(BUTTON_SPECTATE_LABEL, CONTAINER_BASE);

    mod.AddUIButton(BUTTON_CANCEL_ID, mod.CreateVector(0, 0, 0), mod.CreateVector(300, 100, 0), mod.UIAnchor.BottomRight, eventPlayer);
    const BUTTON_CANCEL = mod.FindUIWidgetWithName(BUTTON_CANCEL_ID, mod.GetUIRoot());
    mod.SetUIWidgetParent(BUTTON_CANCEL, CONTAINER_BASE);

    mod.AddUIText(
        BUTTON_CANCEL_LABEL_ID,
        mod.CreateVector(0, 0, 0),
        mod.CreateVector(300, 100, 0),
        mod.UIAnchor.BottomRight,
        mod.Message(mod.stringkeys.UI_TEAMSWITCH_BUTTON_CANCEL_LABEL),
        eventPlayer
    );
    const BUTTON_CANCEL_LABEL = mod.FindUIWidgetWithName(BUTTON_CANCEL_LABEL_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(BUTTON_CANCEL_LABEL, 0);
    mod.SetUIWidgetParent(BUTTON_CANCEL_LABEL, CONTAINER_BASE);

    mod.AddUIButton(BUTTON_OPTOUT_ID, mod.CreateVector(0, 0, 0), mod.CreateVector(300, 100, 0), mod.UIAnchor.BottomCenter, eventPlayer);
    const BUTTON_OPTOUT = mod.FindUIWidgetWithName(BUTTON_OPTOUT_ID, mod.GetUIRoot());
    mod.SetUIWidgetParent(BUTTON_OPTOUT, CONTAINER_BASE);

    mod.AddUIText(
        BUTTON_OPTOUT_LABEL_ID,
        mod.CreateVector(0, 0, 0),
        mod.CreateVector(300, 100, 0),
        mod.UIAnchor.BottomCenter,
        mod.Message(mod.stringkeys.UI_TEAMSWITCH_BUTTON_OPTOUT_LABEL),
        eventPlayer
    );
    const BUTTON_OPTOUT_LABEL = mod.FindUIWidgetWithName(BUTTON_OPTOUT_LABEL_ID, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(BUTTON_OPTOUT_LABEL, 0);
    mod.SetUIWidgetParent(BUTTON_OPTOUT_LABEL, CONTAINER_BASE);

    //#region Tester Panel UI (Right Side)
    // Layout constants: adjust cautiously; verify in-game dialog fit at target resolutions.
    const testerBaseX = 990;
    const testerBaseY = 5;

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
        mod.Message(mod.stringkeys.UI_TESTER_HEADER_LABEL),
        eventPlayer
    );
    const TEST_HEADER = mod.FindUIWidgetWithName(headerId, mod.GetUIRoot());
    mod.SetUITextSize(TEST_HEADER, 12);
    mod.SetUIWidgetBgAlpha(TEST_HEADER, 0);
    mod.SetUIWidgetParent(TEST_HEADER, CONTAINER_BASE);

    const row0Y = testerBaseY + 22;

    addTesterRow(eventPlayer, CONTAINER_BASE, playerId, testerBaseX, row0Y + (buttonSizeY + rowSpacingY) * 0,
        UI_TEST_BUTTON_LEFT_WINS_DEC_ID, UI_TEST_BUTTON_LEFT_WINS_INC_ID, UI_TEST_LABEL_LEFT_WINS_ID,
        mod.stringkeys.UI_TEST_LABEL_LEFT_WINS, buttonSizeX, buttonSizeY, labelSizeX, decOffsetX, labelOffsetX, incOffsetX);

    addTesterRow(eventPlayer, CONTAINER_BASE, playerId, testerBaseX, row0Y + (buttonSizeY + rowSpacingY) * 1,
        UI_TEST_BUTTON_RIGHT_WINS_DEC_ID, UI_TEST_BUTTON_RIGHT_WINS_INC_ID, UI_TEST_LABEL_RIGHT_WINS_ID,
        mod.stringkeys.UI_TEST_LABEL_RIGHT_WINS, buttonSizeX, buttonSizeY, labelSizeX, decOffsetX, labelOffsetX, incOffsetX);

    addTesterRow(eventPlayer, CONTAINER_BASE, playerId, testerBaseX, row0Y + (buttonSizeY + rowSpacingY) * 2,
        UI_TEST_BUTTON_LEFT_KILLS_DEC_ID, UI_TEST_BUTTON_LEFT_KILLS_INC_ID, UI_TEST_LABEL_LEFT_KILLS_ID,
        mod.stringkeys.UI_TEST_LABEL_LEFT_KILLS, buttonSizeX, buttonSizeY, labelSizeX, decOffsetX, labelOffsetX, incOffsetX);

    addTesterRow(eventPlayer, CONTAINER_BASE, playerId, testerBaseX, row0Y + (buttonSizeY + rowSpacingY) * 3,
        UI_TEST_BUTTON_RIGHT_KILLS_DEC_ID, UI_TEST_BUTTON_RIGHT_KILLS_INC_ID, UI_TEST_LABEL_RIGHT_KILLS_ID,
        mod.stringkeys.UI_TEST_LABEL_RIGHT_KILLS, buttonSizeX, buttonSizeY, labelSizeX, decOffsetX, labelOffsetX, incOffsetX);

    addTesterRow(eventPlayer, CONTAINER_BASE, playerId, testerBaseX, row0Y + (buttonSizeY + rowSpacingY) * 4,
        UI_ADMIN_BUTTON_T1_ROUND_KILLS_DEC_ID, UI_ADMIN_BUTTON_T1_ROUND_KILLS_INC_ID, UI_ADMIN_LABEL_T1_ROUND_KILLS_ID,
        mod.stringkeys.UI_ADMIN_LABEL_T1_ROUND_KILLS, buttonSizeX, buttonSizeY, labelSizeX, decOffsetX, labelOffsetX, incOffsetX);

    addTesterRow(eventPlayer, CONTAINER_BASE, playerId, testerBaseX, row0Y + (buttonSizeY + rowSpacingY) * 5,
        UI_ADMIN_BUTTON_T2_ROUND_KILLS_DEC_ID, UI_ADMIN_BUTTON_T2_ROUND_KILLS_INC_ID, UI_ADMIN_LABEL_T2_ROUND_KILLS_ID,
        mod.stringkeys.UI_ADMIN_LABEL_T2_ROUND_KILLS, buttonSizeX, buttonSizeY, labelSizeX, decOffsetX, labelOffsetX, incOffsetX);

    addTesterRowWithValue(eventPlayer, CONTAINER_BASE, playerId, testerBaseX, row0Y + (buttonSizeY + rowSpacingY) * 6,
        UI_TEST_BUTTON_ROUND_KILLS_TARGET_DEC_ID, UI_TEST_BUTTON_ROUND_KILLS_TARGET_INC_ID, UI_TEST_LABEL_ROUND_KILLS_TARGET_ID, UI_TEST_VALUE_ROUND_KILLS_TARGET_ID,
        mod.stringkeys.UI_TEST_LABEL_ROUND_KILLS_TARGET, roundKillsTarget, buttonSizeX, buttonSizeY, labelSizeX, 46, decOffsetX, labelOffsetX, incOffsetX);

    syncRoundKillsTargetTesterValueForAllPlayers();

    addTesterRow(eventPlayer, CONTAINER_BASE, playerId, testerBaseX, row0Y + (buttonSizeY + rowSpacingY) * 7,
        UI_TEST_BUTTON_MAX_ROUND_DEC_ID, UI_TEST_BUTTON_MAX_ROUND_INC_ID, UI_TEST_LABEL_MAX_ROUND_ID,
        mod.stringkeys.UI_TEST_LABEL_MAX_ROUND, buttonSizeX, buttonSizeY, labelSizeX, decOffsetX, labelOffsetX, incOffsetX);

    addTesterRow(eventPlayer, CONTAINER_BASE, playerId, testerBaseX, row0Y + (buttonSizeY + rowSpacingY) * 8,
        UI_TEST_BUTTON_CUR_ROUND_DEC_ID, UI_TEST_BUTTON_CUR_ROUND_INC_ID, UI_TEST_LABEL_CUR_ROUND_ID,
        mod.stringkeys.UI_TEST_LABEL_CUR_ROUND, buttonSizeX, buttonSizeY, labelSizeX, decOffsetX, labelOffsetX, incOffsetX);

    addTesterRow(eventPlayer, CONTAINER_BASE, playerId, testerBaseX, row0Y + (buttonSizeY + rowSpacingY) * 9,
        UI_TEST_BUTTON_CLOCK_TIME_DEC_ID, UI_TEST_BUTTON_CLOCK_TIME_INC_ID, UI_TEST_LABEL_CLOCK_TIME_ID,
        mod.stringkeys.UI_TEST_LABEL_CLOCK_TIME, buttonSizeX, buttonSizeY, labelSizeX, decOffsetX, labelOffsetX, incOffsetX);

    addTesterResetButton(eventPlayer, CONTAINER_BASE, playerId, testerBaseX,
        row0Y + (buttonSizeY + rowSpacingY) * 10, (buttonSizeX + 8 + labelSizeX + 8 + buttonSizeX), 36);


    addTesterActionButton(eventPlayer, CONTAINER_BASE, playerId, testerBaseX,
        row0Y + (buttonSizeY + rowSpacingY) * 11, (buttonSizeX + 8 + labelSizeX + 8 + buttonSizeX), 36,
        UI_TEST_BUTTON_ROUND_START_ID, UI_TEST_ROUND_START_TEXT_ID, mod.stringkeys.UI_TEST_BUTTON_ROUND_START_LABEL);

    addTesterActionButton(eventPlayer, CONTAINER_BASE, playerId, testerBaseX,
        row0Y + (buttonSizeY + rowSpacingY) * 12, (buttonSizeX + 8 + labelSizeX + 8 + buttonSizeX), 36,
        UI_TEST_BUTTON_ROUND_END_ID, UI_TEST_ROUND_END_TEXT_ID, mod.stringkeys.UI_TEST_BUTTON_ROUND_END_LABEL);
    //#endregion

    updateHelpTextVisibilityForPlayer(eventPlayer);
}


//#region Admin Panel UI builder helpers
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
        mod.UIAnchor.TopLeft, mod.Message(mod.stringkeys.UI_TEST_MINUS), eventPlayer);
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
        mod.UIAnchor.TopLeft, mod.Message(mod.stringkeys.UI_TEST_PLUS), eventPlayer);
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
        mod.UIAnchor.TopLeft, mod.Message(mod.stringkeys.GenericCounterText, Math.floor(initialValue)), eventPlayer);
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
        mod.SetUITextLabel(widget, mod.Message(mod.stringkeys.GenericCounterText, Math.floor(roundKillsTarget)));
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
        mod.UIAnchor.TopLeft, mod.Message(mod.stringkeys.UI_TEST_BUTTON_CLOCK_RESET_LABEL), eventPlayer);
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
//#endregion Admin Panel UI builder helpers

//#endregion

//#region MultiClickDetector (triple tap interact)
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
//#endregion

//#region Main Base Restock (area triggers)



function IsPlayerInOwnMainBase(player: mod.Player, areaTrigger: mod.AreaTrigger): boolean {
    const triggerId = mod.GetObjId(areaTrigger);
    const teamId = mod.GetObjId(mod.GetTeam(player));

    return mod.Or(
        mod.And(mod.Equals(triggerId, TEAM1_MAIN_BASE_TRIGGER_ID), mod.Equals(teamId, mod.GetObjId(mod.GetTeam(TEAM_1)))),
        mod.And(mod.Equals(triggerId, TEAM2_MAIN_BASE_TRIGGER_ID), mod.Equals(teamId, mod.GetObjId(mod.GetTeam(TEAM_2))))
    );
}

function BroadcastMainBaseEvent(message: mod.Message): void {
    mod.DisplayHighlightedWorldLogMessage(message);
}

function NotifyAmmoRestocked(player: mod.Player): void {
    mod.DisplayHighlightedWorldLogMessage(mod.Message(STR_AMMO_RESTOCKED), mod.GetTeam(player));
}

function RestockGadgetAmmo(player: mod.Player, magAmmo: number): void {
    mod.SetInventoryMagazineAmmo(player, mod.InventorySlots.GadgetOne, magAmmo);
    mod.SetInventoryMagazineAmmo(player, mod.InventorySlots.GadgetTwo, magAmmo);
}
//#endregion

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
 * - Do not award points unless `isRoundActive` is true.
 * - Round/match counters are authoritative; the HUD is a projection of that state.
 * - Any async work started here must use the guard tokens to prevent overlap if the mode restarts.
 */

//#region -------------------- Exported Event Handlers (single exports) --------------------
// OnGameModeStarted:
// Primary initialization entry point for the experience.
// Responsibilities:
// - Reset authoritative match and round state.
// - Initialize or repair global UI roots.
// - Ensure all currently connected players receive a HUD.
// - Start round clock and propagate initial UI state.
// Important:
// - No scoring should occur before this completes.
// - Async work must respect guard tokens to avoid overlap on restarts.
export async function OnGameModeStarted(): Promise<void> {
    // Vehicle scoring init + legacy cleanup
    // Remove legacy UI roots (if any) before we build fresh HUDs; prevents duplicated overlays across restarts.
    deleteLegacyScoreRootsForAllPlayers();

    // Apply initial engine variables/settings used by the mode (authoritative baseline).
    mod.SetVariable(regVehiclesTeam1, mod.EmptyArray());
    mod.SetVariable(regVehiclesTeam2, mod.EmptyArray());

    vehIds.length = 0;
    vehOwners.length = 0;

    mod.DisplayHighlightedWorldLogMessage(mod.Message(mod.stringkeys.msgInit), mod.GetTeam(TEAM_1));
    mod.DisplayHighlightedWorldLogMessage(mod.Message(mod.stringkeys.msgInit), mod.GetTeam(TEAM_2));

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
    isMatchEnded = false;
    isVictoryDialogActive = false;

    setMatchWinsTeam(TEAM_1, 0);
    setMatchWinsTeam(TEAM_2, 0);
    totalKillsT1 = 0;
    totalKillsT2 = 0;

    matchEndWinnerTeamNum = undefined;
    matchEndElapsedSecondsSnapshot = 0;
    victoryStartElapsedSecondsSnapshot = 0;

    lastHudScoreT1 = undefined;
    lastHudScoreT2 = undefined;
    // Init visible counters
    setHudRoundCountersForAllPlayers(roundCurrent, roundMax);
    setHudWinCountersForAllPlayers(0, 0);
    matchTiesT1 = 0;
    matchTiesT2 = 0;
    syncRoundRecordHudForAllPlayers();
    syncWinCountersHudFromGameModeScore();
    syncKillsHudFromTrackedTotals(true);
    // Broadcast the initial round phase label (e.g., NOT READY) to all HUDs.
    setRoundStateTextForAllPlayers();
    updateHelpTextVisibilityForAllPlayers();

    // Clock init + loop
    ResetRoundClock(0);

    while (true) {
        // Push the initial clock display so every HUD shows the same starting time.
        updateAllPlayersClock();
        syncKillsHudFromTrackedTotals(false);

        if (isVictoryDialogActive) {
            const elapsedSinceVictory = Math.floor(mod.GetMatchTimeElapsed()) - Math.floor(victoryStartElapsedSecondsSnapshot);
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
        setCounterText(refs.leftWinsText, matchWinsT1);
        setCounterText(refs.rightWinsText, matchWinsT2);
        setRoundRecordText(refs.leftRecordText, matchWinsT1, matchLossesT1, matchTiesT1);
        setRoundRecordText(refs.rightRecordText, matchWinsT2, matchLossesT2, matchTiesT2);
        setCounterText(refs.leftRoundKillsText, roundKillsT1);
        setCounterText(refs.rightRoundKillsText, roundKillsT2);
        setCounterText(refs.leftKillsText, totalKillsT1);
        setCounterText(refs.rightKillsText, totalKillsT2);
        setCounterText(refs.roundCurText, roundCurrent);
        setCounterText(refs.roundMaxText, roundMax);
    }
    {
        const cache = ensureClockUIAndGetCache(eventPlayer);
        if (cache) setRoundStateText(cache.roundStateText);
    updateHelpTextVisibilityForPlayer(eventPlayer);
    }
    deleteLegacyScoreRootForPlayer(eventPlayer);
}

export async function OnPlayerDeployed(eventPlayer: mod.Player) {
    ensureHudForPlayer(eventPlayer);
    await spawnTeamSwitchInteractPoint(eventPlayer);
}

export function OnPlayerLeaveGame(eventNumber: number) {
    removeTeamSwitchInteractPoint(eventNumber);
}

export function OnPlayerUndeploy(eventPlayer: mod.Player) {
    removeTeamSwitchInteractPoint(eventPlayer);
}

// Performance note:
// - OngoingPlayer executes frequently; keep it lightweight.
// - Avoid FindUIWidget calls or per-tick loops over all players/vehicles unless strictly necessary.
// - Prefer "update only when changed" patterns for HUD/clock refreshes.
// ------------------------------------------------------------------


export function OngoingPlayer(eventPlayer: mod.Player): void {
    checkTeamSwitchInteractPointRemoval(eventPlayer);

    if (InteractMultiClickDetector.checkMultiClick(eventPlayer)) {
        spawnTeamSwitchInteractPoint(eventPlayer);
        //mod.DisplayHighlightedWorldLogMessage(mod.Message(mod.stringkeys.NOTIFICATION_MULTICLICKDETECTOR), mod.GetTeam(eventPlayer));
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
export function OnPlayerEnterVehicle(eventPlayer: mod.Player, eventVehicle: mod.Vehicle) {
    if (!mod.IsPlayerValid(eventPlayer)) return;

    const teamNum = getTeamNumber(mod.GetTeam(eventPlayer));
    if (teamNum !== TEAM_1 && teamNum !== TEAM_2) return;

    const inT1 = arrayContainsVehicle(mod.GetVariable(regVehiclesTeam1), eventVehicle);
    const inT2 = arrayContainsVehicle(mod.GetVariable(regVehiclesTeam2), eventVehicle);
    const wasRegistered = inT1 || inT2;

    const priorOwner = getLastDriver(eventVehicle);
    const isReturnToSameOwner = priorOwner && (getObjId(priorOwner) === getObjId(eventPlayer));

    setLastDriver(eventVehicle, eventPlayer);
    registerVehicleToTeam(eventVehicle, teamNum);

    if (!wasRegistered) {
        mod.DisplayHighlightedWorldLogMessage(mod.Message(mod.stringkeys.msgVehicleRegisteredNew, teamNum, eventPlayer), mod.GetTeam(TEAM_1));
        mod.DisplayHighlightedWorldLogMessage(mod.Message(mod.stringkeys.msgVehicleRegisteredNew, teamNum, eventPlayer), mod.GetTeam(TEAM_2));
    } else if (isReturnToSameOwner) {
        mod.DisplayHighlightedWorldLogMessage(mod.Message(mod.stringkeys.msgVehicleReturned, eventPlayer, teamNum), mod.GetTeam(TEAM_1));
        mod.DisplayHighlightedWorldLogMessage(mod.Message(mod.stringkeys.msgVehicleReturned, eventPlayer, teamNum), mod.GetTeam(TEAM_2));
    } else {
        mod.DisplayHighlightedWorldLogMessage(mod.Message(mod.stringkeys.msgVehicleReRegistered, teamNum, eventPlayer), mod.GetTeam(TEAM_1));
        mod.DisplayHighlightedWorldLogMessage(mod.Message(mod.stringkeys.msgVehicleReRegistered, teamNum, eventPlayer), mod.GetTeam(TEAM_2));
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

    if (!inT1 && !inT2) return;

    const destroyedTeamNum = inT1 ? TEAM_1 : TEAM_2;
    const scoringTeamNum = opposingTeam(destroyedTeamNum);

    if (isRoundActive) {
        if (scoringTeamNum === TEAM_1) {
            roundKillsT1 = roundKillsT1 + 1;
        } else if (scoringTeamNum === TEAM_2) {
            roundKillsT2 = roundKillsT2 + 1;
        }

        // Update round kills HUD immediately.
        syncRoundKillsHud();

        // End the round immediately if a team reaches the configured round-kills target.
        if (roundKillsT1 >= roundKillsTarget || roundKillsT2 >= roundKillsTarget) {
            endRound(undefined, getRemainingSeconds());
        }

        if (scoringTeamNum === TEAM_1) {
            totalKillsT1 = Math.floor(totalKillsT1) + 1;
        } else if (scoringTeamNum === TEAM_2) {
            totalKillsT2 = Math.floor(totalKillsT2) + 1;
        }

        // Update top HUD kills counters.
        syncKillsHudFromTrackedTotals(false);

        mod.SetVariable(regVehiclesTeam1, arrayRemoveVehicle(mod.GetVariable(regVehiclesTeam1), eventVehicle));
        mod.SetVariable(regVehiclesTeam2, arrayRemoveVehicle(mod.GetVariable(regVehiclesTeam2), eventVehicle));

        const owner = popLastDriver(eventVehicle);

        await mod.Wait(3.0);

        const roundKills = (scoringTeamNum === TEAM_1) ? roundKillsT1 : roundKillsT2;
        const teamNameKey = (scoringTeamNum === TEAM_1) ? mod.stringkeys.TeamLeft_Name : mod.stringkeys.TeamRight_Name;
        const ownerNameOrKey = owner ? owner : mod.stringkeys.UnknownPlayer;

        mod.DisplayHighlightedWorldLogMessage(
            mod.Message(mod.stringkeys.msgPointAwardedWithOwner, teamNameKey, ownerNameOrKey, Math.floor(roundKills)),
            mod.GetTeam(TEAM_1)
        );
        mod.DisplayHighlightedWorldLogMessage(
            mod.Message(mod.stringkeys.msgPointAwardedWithOwner, teamNameKey, ownerNameOrKey, Math.floor(roundKills)),
            mod.GetTeam(TEAM_2)
        );

        return;
    }

    // Round is not live: clean up registration, but do not award points or increment counters.
    mod.SetVariable(regVehiclesTeam1, arrayRemoveVehicle(mod.GetVariable(regVehiclesTeam1), eventVehicle));
    mod.SetVariable(regVehiclesTeam2, arrayRemoveVehicle(mod.GetVariable(regVehiclesTeam2), eventVehicle));

    const owner = popLastDriver(eventVehicle);

    await mod.Wait(3.0);

    const destroyedTeamNameKey = (destroyedTeamNum === TEAM_1) ? mod.stringkeys.TeamLeft_Name : mod.stringkeys.TeamRight_Name;
    const ownerNameOrKey = owner ? owner : mod.stringkeys.UnknownPlayer;

    mod.DisplayHighlightedWorldLogMessage(
        mod.Message(mod.stringkeys.msgVehicleDestroyedNotLive, ownerNameOrKey, destroyedTeamNameKey),
        mod.GetTeam(TEAM_1)
    );
    mod.DisplayHighlightedWorldLogMessage(
        mod.Message(mod.stringkeys.msgVehicleDestroyedNotLive, ownerNameOrKey, destroyedTeamNameKey),
        mod.GetTeam(TEAM_2)
    );
}

export function OnPlayerEnterAreaTrigger(eventPlayer: mod.Player, eventAreaTrigger: mod.AreaTrigger) {
    if (!eventPlayer) return;

    if (IsPlayerInOwnMainBase(eventPlayer, eventAreaTrigger)) {
        BroadcastMainBaseEvent(mod.Message(STR_ENTERED_MAIN_BASE, eventPlayer));
        RestockGadgetAmmo(eventPlayer, RESTOCK_MAG_AMMO_ENTER);
        NotifyAmmoRestocked(eventPlayer);
    }
}

export function OnPlayerExitAreaTrigger(eventPlayer: mod.Player, eventAreaTrigger: mod.AreaTrigger) {
    if (!eventPlayer) return;

    if (!mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsAlive)) return;

    if (IsPlayerInOwnMainBase(eventPlayer, eventAreaTrigger)) {
        BroadcastMainBaseEvent(mod.Message(STR_EXITED_MAIN_BASE, eventPlayer));
        RestockGadgetAmmo(eventPlayer, RESTOCK_MAG_AMMO_EXIT);
        NotifyAmmoRestocked(eventPlayer);
    }
}
//#endregion
