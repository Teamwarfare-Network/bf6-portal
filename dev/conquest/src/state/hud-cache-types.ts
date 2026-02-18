// @ts-nocheck
// Module: state/hud-cache-types -- HUD reference/cache type definitions

//#region -------------------- HUD Types + Caches --------------------

// We build HUD per-player (playerId receiver) and suffix names with pid to avoid collisions.
type HudRefs = {
    pid: number;

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
    victoryAdminActionsText?: mod.UIWidget;
    victoryLeftRosterText?: Array<mod.UIWidget | undefined>;
    victoryRightRosterText?: Array<mod.UIWidget | undefined>;
    victoryRosterRow?: mod.UIWidget;
    victoryRosterLeftContainer?: mod.UIWidget;
    victoryRosterRightContainer?: mod.UIWidget;

    adminPanelActionCountText?: mod.UIWidget;

    helpTextContainer?: mod.UIWidget;
    readyStatusContainer?: mod.UIWidget;

    // Optional roots (for cleanup if needed)
    roots: mod.UIWidget[];
};

//#endregion ----------------- HUD Types + Caches --------------------
