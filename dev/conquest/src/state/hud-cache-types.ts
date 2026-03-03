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
    conquestTicketsDebugRoot?: mod.UIWidget;
    conquestTicketsDebugTeam1?: mod.UIWidget;
    conquestTicketsDebugTeam2?: mod.UIWidget;
    conquestTicketsDebugLeftBarTrack?: mod.UIWidget;
    conquestTicketsDebugLeftBarFill?: mod.UIWidget;
    conquestTicketsDebugRightBarTrack?: mod.UIWidget;
    conquestTicketsDebugRightBarFill?: mod.UIWidget;
    conquestTicketsLeadLeftBorder?: mod.UIWidget;
    conquestTicketsLeadRightBorder?: mod.UIWidget;
    conquestTicketsLeadLeftCrown?: mod.UIWidget;
    conquestTicketsLeadRightCrown?: mod.UIWidget;
    conquestTicketsBleedLeftChevrons?: Array<mod.UIWidget | undefined>;
    conquestTicketsBleedRightChevrons?: Array<mod.UIWidget | undefined>;
    conquestFlagsDebugRoot?: mod.UIWidget;
    conquestFlagsDebugSlotRoots?: Array<mod.UIWidget | undefined>;
    conquestFlagsDebugBorderRows?: Array<mod.UIWidget | undefined>;
    conquestFlagsDebugFillRows?: Array<mod.UIWidget | undefined>;
    conquestFlagsDebugLabelShadowRightRows?: Array<mod.UIWidget | undefined>;
    conquestFlagsDebugLabelShadowLeftRows?: Array<mod.UIWidget | undefined>;
    conquestFlagsDebugLabelShadowUpRows?: Array<mod.UIWidget | undefined>;
    conquestFlagsDebugLabelShadowDownRows?: Array<mod.UIWidget | undefined>;
    conquestFlagsDebugLabelShadowUpLeftRows?: Array<mod.UIWidget | undefined>;
    conquestFlagsDebugLabelShadowUpRightRows?: Array<mod.UIWidget | undefined>;
    conquestFlagsDebugLabelShadowDownRightRows?: Array<mod.UIWidget | undefined>;
    conquestFlagsDebugLabelShadowDownLeftRows?: Array<mod.UIWidget | undefined>;
    conquestFlagsDebugLabelShadowInnerRows?: Array<mod.UIWidget | undefined>;
    conquestFlagsDebugLabelShadowInnerDeepRows?: Array<mod.UIWidget | undefined>;
    conquestFlagsDebugLabelRows?: Array<mod.UIWidget | undefined>;
    conquestFlagsDebugPercentRoots?: Array<mod.UIWidget | undefined>;
    conquestFlagsDebugPercentShadowRightRows?: Array<mod.UIWidget | undefined>;
    conquestFlagsDebugPercentShadowLeftRows?: Array<mod.UIWidget | undefined>;
    conquestFlagsDebugPercentShadowUpRows?: Array<mod.UIWidget | undefined>;
    conquestFlagsDebugPercentShadowDownRows?: Array<mod.UIWidget | undefined>;
    conquestFlagsDebugPercentShadowUpLeftRows?: Array<mod.UIWidget | undefined>;
    conquestFlagsDebugPercentShadowUpRightRows?: Array<mod.UIWidget | undefined>;
    conquestFlagsDebugPercentShadowDownRightRows?: Array<mod.UIWidget | undefined>;
    conquestFlagsDebugPercentShadowDownLeftRows?: Array<mod.UIWidget | undefined>;
    conquestFlagsDebugPercentShadowInnerRows?: Array<mod.UIWidget | undefined>;
    conquestFlagsDebugPercentTextRows?: Array<mod.UIWidget | undefined>;
    conquestFlagsEngageRoot?: mod.UIWidget;
    conquestFlagsEngageTrack?: mod.UIWidget;
    conquestFlagsEngageFriendlyFill?: mod.UIWidget;
    conquestFlagsEngageEnemyFill?: mod.UIWidget;
    conquestFlagsEngageFriendlyCountBg?: mod.UIWidget;
    conquestFlagsEngageEnemyCountBg?: mod.UIWidget;
    conquestFlagsEngageFriendlyCount?: mod.UIWidget;
    conquestFlagsEngageEnemyCount?: mod.UIWidget;
    conquestFlagsEngageStatusShadowRight?: mod.UIWidget;
    conquestFlagsEngageStatusShadowLeft?: mod.UIWidget;
    conquestFlagsEngageStatusShadowUp?: mod.UIWidget;
    conquestFlagsEngageStatusShadowDown?: mod.UIWidget;
    conquestFlagsEngageStatusShadowUpLeft?: mod.UIWidget;
    conquestFlagsEngageStatusShadowUpRight?: mod.UIWidget;
    conquestFlagsEngageStatusShadowDownRight?: mod.UIWidget;
    conquestFlagsEngageStatusShadowDownLeft?: mod.UIWidget;
    conquestFlagsEngageStatus?: mod.UIWidget;
    conquestFlagsDebugFriendlyRows?: Array<mod.UIWidget | undefined>;
    conquestFlagsDebugCenterRows?: Array<mod.UIWidget | undefined>;
    conquestFlagsDebugEnemyRows?: Array<mod.UIWidget | undefined>;

    helpTextContainer?: mod.UIWidget;
    readyStatusContainer?: mod.UIWidget;

    // Optional roots (for cleanup if needed)
    roots: mod.UIWidget[];
};

//#endregion ----------------- HUD Types + Caches --------------------
