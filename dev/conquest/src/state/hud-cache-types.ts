// @ts-nocheck
// Module: state/hud-cache-types -- HUD reference/cache type definitions

//#region -------------------- HUD Types + Caches --------------------

// Active non-combat top-HUD shell refs owned by the dedicated top-hud-shell path.
// This is the accepted always-visible shell family used by top-left/help/admin/victory code.
type TopHudShellRefs = {
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
    lastRenderSignature?: string;
};

type BoundaryPromptWidgetCacheEntry = {
    rootName: string;
    panelName: string;
    borderName: string;
    title1Name: string;
    title1ShadowName: string;
    title2Name: string;
    title2ShadowName: string;
    subtitleName: string;
    subtitleShadowName: string;
    leftIconName: string;
    leftIconShadowName: string;
    rightIconName: string;
    rightIconShadowName: string;
    root?: mod.UIWidget;
    border?: mod.UIWidget;
    title1?: mod.UIWidget;
    title1Shadow?: mod.UIWidget;
    title2?: mod.UIWidget;
    title2Shadow?: mod.UIWidget;
    subtitle?: mod.UIWidget;
    subtitleShadow?: mod.UIWidget;
    leftIcon?: mod.UIWidget;
    leftIconShadow?: mod.UIWidget;
    rightIcon?: mod.UIWidget;
    rightIconShadow?: mod.UIWidget;
    lastVisibleState?: boolean;
    lastKind?: BoundaryPromptKind;
    lastRemainingSeconds?: number;
};

//#endregion ----------------- HUD Types + Caches --------------------
