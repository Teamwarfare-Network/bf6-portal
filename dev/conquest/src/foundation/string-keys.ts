// @ts-nocheck
// Message helper: short alias for mod.Message(keyId, ...args). Bundle-saving wrapper used
// at every player-facing label site. Args (string | number | mod.Player) match Portal's
// documented mod.Message contract; the `as any` cast bypasses TS overload-resolution which
// can't unify the spread-args call with the discrete (keyId), (keyId, arg1), etc. overloads.
// For the special Player-as-name overload (`mod.Message(player)` with no key id), call
// `mod.Message(player)` directly -- msg() is for key-based messages only.
function msg(keyId: number, ...args: any[]): mod.Message {
    return (mod.Message as any)(keyId, ...args);
}

// High-frequency stringkey aliases: each path appears 8-63 times in the bundle. Aliasing
// trims ~15-27 bytes per callsite vs. the long `mod.stringkeys.twl.<path>` form.
const STR_SYS_COUNTER = mod.stringkeys.twl.system.genericCounter;
const STR_HUD_CLOCK_DIGIT = mod.stringkeys.twl.hud.clock.digit;
const STR_SYS_UNKNOWN_PLAYER = mod.stringkeys.twl.system.unknownPlayer;
const STR_RD_VEHICLE_NO_SPAWN = mod.stringkeys.twl.readyDialog.vehicleShortNoSpawn;

const STR_READYUP_RETURN_TO_BASE_NOT_LIVE = mod.stringkeys.twl.notifications.readyupReturnToBaseNotLive;
const STR_PLAYER_READIED_UP = mod.stringkeys.twl.notifications.playerReadiedUp;
const STR_BOUNDARY_WARNING_ICON = mod.stringkeys.twl.boundary.warningIcon;
const STR_BOUNDARY_PRELIVE_MAIN_BASE_TITLE_1 = mod.stringkeys.twl.boundary.preLiveMainBaseTitle1;
const STR_BOUNDARY_PRELIVE_MAIN_BASE_TITLE_2 = mod.stringkeys.twl.boundary.preLiveMainBaseTitle2;
const STR_BOUNDARY_ENEMY_MAIN_BASE_BUFFER_TITLE_1 = mod.stringkeys.twl.boundary.enemyMainBaseBufferTitle1;
const STR_BOUNDARY_ENEMY_MAIN_BASE_BUFFER_TITLE_2 = mod.stringkeys.twl.boundary.enemyMainBaseBufferTitle2;
const STR_BOUNDARY_GROUND_COMBAT_ZONE_TITLE_1 = mod.stringkeys.twl.boundary.groundCombatZoneTitle1;
const STR_BOUNDARY_GROUND_COMBAT_ZONE_TITLE_2 = mod.stringkeys.twl.boundary.groundCombatZoneTitle2;
const STR_BOUNDARY_COUNTDOWN_SUBTITLE_FORMAT = mod.stringkeys.twl.boundary.countdownSubtitleFormat;
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
const STR_HUD_CONQUEST_BLEED_STARTED = mod.stringkeys.twl.hud.conquest.bleedStarted;
const STR_HUD_CONQUEST_BLEED_STOPPED = mod.stringkeys.twl.hud.conquest.bleedStopped;
const STR_HUD_CONQUEST_BLEED_CHEVRON_LEFT = mod.stringkeys.twl.hud.conquest.bleedChevronLeft;
const STR_HUD_CONQUEST_BLEED_CHEVRON_RIGHT = mod.stringkeys.twl.hud.conquest.bleedChevronRight;
const STR_HUD_CONQUEST_FLAG_LETTER_A = mod.stringkeys.twl.hud.conquest.flagLetters.A;
const STR_HUD_CONQUEST_FLAG_LETTER_B = mod.stringkeys.twl.hud.conquest.flagLetters.B;
const STR_HUD_CONQUEST_FLAG_LETTER_C = mod.stringkeys.twl.hud.conquest.flagLetters.C;
const STR_HUD_CONQUEST_FLAG_LETTER_D = mod.stringkeys.twl.hud.conquest.flagLetters.D;
const STR_HUD_CONQUEST_FLAG_LETTER_E = mod.stringkeys.twl.hud.conquest.flagLetters.E;
const STR_HUD_CONQUEST_FLAG_LETTER_F = mod.stringkeys.twl.hud.conquest.flagLetters.F;
const STR_HUD_CONQUEST_FLAG_LETTER_G = mod.stringkeys.twl.hud.conquest.flagLetters.G;
const STR_HUD_CONQUEST_FLAG_LETTER_UNKNOWN = mod.stringkeys.twl.hud.conquest.flagLetters.unknown;
const STR_HUD_CONQUEST_CAPTURE_STATUS_DEFEND = mod.stringkeys.twl.hud.conquest.captureStatus.defend;
const STR_HUD_CONQUEST_CAPTURE_STATUS_NEUTRALIZING = mod.stringkeys.twl.hud.conquest.captureStatus.neutralizing;
const STR_HUD_CONQUEST_CAPTURE_STATUS_CONTESTING = mod.stringkeys.twl.hud.conquest.captureStatus.contesting;
const STR_HUD_CONQUEST_CAPTURE_STATUS_CAPTURING = mod.stringkeys.twl.hud.conquest.captureStatus.capturing;
const STR_SYSTEM_GENERIC_PERCENT = mod.stringkeys.twl.system.genericPercent;
const STR_UI_GADGET_SLOT_LABEL = mod.stringkeys.twl.ui.gadgetSlotLabel;
const STR_UI_LAUNCHER_IN_SLOT = mod.stringkeys.twl.ui.launcherInSlot;
const STR_UI_ASSAULT = mod.stringkeys.twl.ui.assault;
const STR_UI_ENGINEER = mod.stringkeys.twl.ui.engineer;
const STR_UI_GADGETS = mod.stringkeys.twl.ui.gadgets;
const STR_UI_ARTILLERY_STRIKE = mod.stringkeys.twl.ui.artilleryStrike;
const STR_UI_MEDIC = mod.stringkeys.twl.ui.medic;
const STR_UI_LAUNCHER_AMMO = mod.stringkeys.twl.ui.rocketAmmo;
const STR_UI_RECON = mod.stringkeys.twl.ui.recon;
const STR_UI_DRONE = mod.stringkeys.twl.ui.drone;
const STR_UI_C4 = mod.stringkeys.twl.ui.c4;
const STR_UI_ANTI_VEHICLE_GRENADE = mod.stringkeys.twl.ui.antiVehicleGrenade;
const STR_UI_RPG = mod.stringkeys.twl.ui.rpg;
const STR_UI_IGLA_MARKED = mod.stringkeys.twl.ui.iglaMarked;
const STR_UI_STINGER = mod.stringkeys.twl.ui.stinger;
const STR_UI_AT4 = mod.stringkeys.twl.ui.at4;
const STR_UI_SMOKE_SCREEN = mod.stringkeys.twl.ui.smokeScreen;
const STR_UI_GRENADE_INTERCEPT = mod.stringkeys.twl.ui.grenadeIntercept;
const STR_UI_MISSILE_INTERCEPT = mod.stringkeys.twl.ui.missileIntercept;
const STR_UI_SPAWN_BEACON = mod.stringkeys.twl.ui.spawnBeacon;
const STR_UI_ASSAULT_LADDER = mod.stringkeys.twl.ui.assaultLadder;
const STR_UI_NO_LAUNCHER = mod.stringkeys.twl.ui.noLauncher;
const STR_UI_ONE_PER_TEAM = mod.stringkeys.twl.ui.onePerTeam;
const STR_UI_ONE_PER_PLAYER = mod.stringkeys.twl.ui.onePerPlayer;
const STR_UI_N_PER_TEAM = mod.stringkeys.twl.ui.nPerTeam;
const STR_UI_CHOOSE_ONLY_ONE = mod.stringkeys.twl.ui.chooseOnlyOne;
const STR_UI_LINE_SMOKE = mod.stringkeys.twl.ui.lineSmoke;
const STR_UI_LINE_ARTILLERY = mod.stringkeys.twl.ui.lineArtillery;
const STR_UI_LINE_CALL_IN = mod.stringkeys.twl.ui.lineCallIn;
const STR_UI_LINE_SPAWN = mod.stringkeys.twl.ui.lineSpawn;
const STR_UI_LINE_BEACON = mod.stringkeys.twl.ui.lineBeacon;
const STR_UI_LINE_ASSAULT = mod.stringkeys.twl.ui.lineAssault;
const STR_UI_LINE_LADDER = mod.stringkeys.twl.ui.lineLadder;
const STR_UI_LINE_ANTI_VEHICLE = mod.stringkeys.twl.ui.lineAntiVehicle;
const STR_UI_LINE_GRENADE = mod.stringkeys.twl.ui.lineGrenade;
const STR_UI_LINE_LAUNCHER = mod.stringkeys.twl.ui.lineLauncher;
const STR_UI_LINE_AMMO = mod.stringkeys.twl.ui.lineAmmo;
const STR_UI_LINE_INTERCEPT = mod.stringkeys.twl.ui.lineIntercept;
const STR_UI_LINE_MISSILE = mod.stringkeys.twl.ui.lineMissile;
const STR_UI_SPAWN = mod.stringkeys.twl.ui.spawn;
const STR_UI_READY = mod.stringkeys.twl.ui.ready;
const STR_UI_WAIT = mod.stringkeys.twl.ui.wait;
const STR_UI_LAUNCHER_AT_CAP = mod.stringkeys.twl.ui.atCap;
const STR_UI_HELP_EMPTY = mod.stringkeys.twl.ui.helpEmpty;
const STR_UI_HELP_ARTILLERY_STRIKE = mod.stringkeys.twl.ui.helpArtilleryStrike;
const STR_UI_HELP_SPAWN_BEACON = mod.stringkeys.twl.ui.helpSpawnBeacon;
const STR_UI_HELP_ASSAULT_LADDER = mod.stringkeys.twl.ui.helpAssaultLadder;
const STR_UI_HELP_SMOKE_SCREEN = mod.stringkeys.twl.ui.helpSmokeScreen;
const STR_UI_HELP_GRENADE_INTERCEPT = mod.stringkeys.twl.ui.helpGrenadeIntercept;
const STR_UI_HELP_MISSILE_INTERCEPT = mod.stringkeys.twl.ui.helpMissileIntercept;
const STR_UI_HELP_RPG = mod.stringkeys.twl.ui.helpRpg;
const STR_UI_HELP_AT4 = mod.stringkeys.twl.ui.helpAt4;
const STR_UI_HELP_STINGER = mod.stringkeys.twl.ui.helpStinger;
const STR_UI_HELP_LAUNCHER_AMMO = mod.stringkeys.twl.ui.helpLauncherAmmo;
const STR_UI_HELP_DRONE = mod.stringkeys.twl.ui.helpDrone;
const STR_UI_HELP_C4 = mod.stringkeys.twl.ui.helpC4;
const STR_UI_HELP_ANTI_VEHICLE_GRENADE = mod.stringkeys.twl.ui.helpAntiVehicleGrenade;

