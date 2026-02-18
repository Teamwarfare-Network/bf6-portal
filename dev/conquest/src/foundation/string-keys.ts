// @ts-nocheck
// Module: foundation/string-keys -- shared string key aliases and global message layouts

// Main base messaging string keys (Strings.json).
const STR_READYUP_RETURN_TO_BASE_NOT_LIVE = mod.stringkeys.twl.notifications.readyupReturnToBaseNotLive;
const STR_PLAYER_READIED_UP = mod.stringkeys.twl.notifications.playerReadiedUp;
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
const STR_VEHICLE_SPAWN_RETRY = mod.stringkeys.twl.messages.vehicleSpawnRetry;
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
