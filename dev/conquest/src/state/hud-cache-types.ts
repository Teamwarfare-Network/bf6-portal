// @ts-nocheck
// Module: state/hud-cache-types -- HUD reference/cache type definitions

//#region -------------------- HUD Types + Caches --------------------

// We build HUD per-player (playerId receiver) and suffix names with pid to avoid collisions.
type HudRefs = {
    pid: number;
    // Authoritative centered root chain handles for this player's Conquest top HUD.
    topHudRoot?: mod.UIWidget;
    conquestCombatRoot?: mod.UIWidget;
    upperLeftContainer?: mod.UIWidget;
    upperLeftStatusContainer?: mod.UIWidget;
    upperLeftStatusStateText?: mod.UIWidget;
    upperLeftStatusReadyText?: mod.UIWidget;
    topCenterAuxRoot?: mod.UIWidget;

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
    conquestTicketsTeam1Container?: mod.UIWidget;
    conquestTicketsTeam2Container?: mod.UIWidget;
    conquestTicketsDebugTeam1Shadow?: mod.UIWidget;
    conquestTicketsDebugTeam1?: mod.UIWidget;
    conquestTicketsDebugTeam2Shadow?: mod.UIWidget;
    conquestTicketsDebugTeam2?: mod.UIWidget;
    conquestTicketsSlash?: mod.UIWidget;
    conquestTicketsDebugLeftBarTrack?: mod.UIWidget;
    conquestTicketsDebugLeftBarFill?: mod.UIWidget;
    conquestTicketsDebugRightBarTrack?: mod.UIWidget;
    conquestTicketsDebugRightBarFill?: mod.UIWidget;
    conquestTicketsLeadLeftBorder?: mod.UIWidget;
    conquestTicketsLeadRightBorder?: mod.UIWidget;
    conquestTicketsLeadLeftCrownShadow?: mod.UIWidget;
    conquestTicketsLeadRightCrownShadow?: mod.UIWidget;
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
    conquestFlagsActivePopoutRoot?: mod.UIWidget;
    conquestFlagsActivePopoutSlot?: mod.UIWidget;
    conquestFlagsActivePopoutBorder?: mod.UIWidget;
    conquestFlagsActivePopoutFill?: mod.UIWidget;
    conquestFlagsActivePopoutLabelShadowRight?: mod.UIWidget;
    conquestFlagsActivePopoutLabelShadowLeft?: mod.UIWidget;
    conquestFlagsActivePopoutLabelShadowUp?: mod.UIWidget;
    conquestFlagsActivePopoutLabelShadowDown?: mod.UIWidget;
    conquestFlagsActivePopoutLabelShadowUpLeft?: mod.UIWidget;
    conquestFlagsActivePopoutLabelShadowUpRight?: mod.UIWidget;
    conquestFlagsActivePopoutLabelShadowDownRight?: mod.UIWidget;
    conquestFlagsActivePopoutLabelShadowDownLeft?: mod.UIWidget;
    conquestFlagsActivePopoutLabel?: mod.UIWidget;
    conquestFlagsActivePopoutPercentRoot?: mod.UIWidget;
    conquestFlagsActivePopoutPercentShadowRight?: mod.UIWidget;
    conquestFlagsActivePopoutPercentShadowLeft?: mod.UIWidget;
    conquestFlagsActivePopoutPercentShadowUp?: mod.UIWidget;
    conquestFlagsActivePopoutPercentShadowDown?: mod.UIWidget;
    conquestFlagsActivePopoutPercentShadowUpLeft?: mod.UIWidget;
    conquestFlagsActivePopoutPercentShadowUpRight?: mod.UIWidget;
    conquestFlagsActivePopoutPercentShadowDownRight?: mod.UIWidget;
    conquestFlagsActivePopoutPercentShadowDownLeft?: mod.UIWidget;
    conquestFlagsActivePopoutPercentShadowInner?: mod.UIWidget;
    conquestFlagsActivePopoutPercentText?: mod.UIWidget;
    conquestFlagsEngageRoot?: mod.UIWidget;
    conquestFlagsEngageTrack?: mod.UIWidget;
    conquestFlagsEngageFriendlyFill?: mod.UIWidget;
    conquestFlagsEngageEnemyFill?: mod.UIWidget;
    conquestFlagsEngageFriendlyCountBg?: mod.UIWidget;
    conquestFlagsEngageEnemyCountBg?: mod.UIWidget;
    conquestFlagsEngageFriendlyCountShadow?: mod.UIWidget;
    conquestFlagsEngageEnemyCountShadow?: mod.UIWidget;
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

type ReusableTimerWidgetCacheEntry = {
    rootName: string;
    surfaceName: string;
    root?: mod.UIWidget;
    plate?: mod.UIWidget;
    statusShadow?: mod.UIWidget;
    statusText?: mod.UIWidget;
    minTensShadow?: mod.UIWidget;
    minTens: mod.UIWidget;
    minOnesShadow?: mod.UIWidget;
    minOnes: mod.UIWidget;
    colonShadow?: mod.UIWidget;
    colon: mod.UIWidget;
    secTensShadow?: mod.UIWidget;
    secTens: mod.UIWidget;
    secOnesShadow?: mod.UIWidget;
    secOnes: mod.UIWidget;
    lastDisplayedSeconds?: number;
    lastVisibleState?: boolean;
    lastStatusMode?: "timer" | "ready" | "active";
};

type VehicleDeployTimerRowCacheEntry = {
    playerPlate?: mod.UIWidget;
    playerShadow?: mod.UIWidget;
    playerText?: mod.UIWidget;
    vehiclePlate?: mod.UIWidget;
    vehicleShadow?: mod.UIWidget;
    vehicleText?: mod.UIWidget;
    spawnButtonBorder?: mod.UIWidget;
    spawnButtonBlur?: mod.UIWidget;
    spawnButtonFill?: mod.UIWidget;
    spawnButton?: mod.UIWidget;
    spawnButtonTextShadow?: mod.UIWidget;
    spawnButtonText?: mod.UIWidget;
    groundButtonBorder?: mod.UIWidget;
    groundButtonBlur?: mod.UIWidget;
    groundButtonFill?: mod.UIWidget;
    groundButton?: mod.UIWidget;
    groundButtonTextShadow?: mod.UIWidget;
    groundButtonText?: mod.UIWidget;
    spawnButtonHovered?: boolean;
    spawnButtonFocused?: boolean;
    spawnButtonPressed?: boolean;
    groundButtonHovered?: boolean;
    groundButtonFocused?: boolean;
    groundButtonPressed?: boolean;
    lastVisibleState?: boolean;
    lastPlayerNameVisible?: boolean;
    lastSpawnButtonVisible?: boolean;
    lastGroundButtonVisible?: boolean;
    lastShowPlayerName?: boolean;
    lastShowSpawnButton?: boolean;
    lastShowGroundButton?: boolean;
    lastSpawnButtonVisualState?: "base" | "hover" | "pressed";
    lastGroundButtonVisualState?: "base" | "hover" | "pressed";
    timer: ReusableTimerWidgetCacheEntry;
};

type VehicleDeployTimerHudCacheEntry = {
    rootName: string;
    root?: mod.UIWidget;
    rows: VehicleDeployTimerRowCacheEntry[];
    lastVisibleState?: boolean;
};

//#endregion ----------------- HUD Types + Caches --------------------
