// @ts-nocheck

type TopHudShellRefs = {
    pid: number;
    topHudRoot?: mod.UIWidget;
    conquestCombatRoot?: mod.UIWidget;
    upperLeftContainer?: mod.UIWidget;
    upperLeftStatusContainer?: mod.UIWidget;
    upperLeftStatusStateText?: mod.UIWidget;
    upperLeftStatusReadyText?: mod.UIWidget;
    topCenterAuxRoot?: mod.UIWidget;

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
    victoryResultText?: mod.UIWidget;
    victoryLeftCrown?: mod.UIWidget;
    victoryRightCrown?: mod.UIWidget;
    victoryLeftTeamNameText?: mod.UIWidget;
    victoryRightTeamNameText?: mod.UIWidget;
    victoryLeftTicketText?: mod.UIWidget;
    victoryRightTicketText?: mod.UIWidget;

    adminPanelActionCountText?: mod.UIWidget;
    helpTextContainer?: mod.UIWidget;
    readyStatusContainer?: mod.UIWidget;

    teamSwapBorder?: mod.UIWidget;
    teamSwapLabel?: mod.UIWidget;

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
    lastStatusMode?: "timer" | "ready" | "active" | "spawning" | "deploying";
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
    livePanelBorder?: mod.UIWidget;
    livePanelBlur?: mod.UIWidget;
    livePanelFill?: mod.UIWidget;
    closeButtonBorder?: mod.UIWidget;
    closeButtonBlur?: mod.UIWidget;
    closeButtonFill?: mod.UIWidget;
    closeButton?: mod.UIWidget;
    closeButtonTextShadow?: mod.UIWidget;
    closeButtonText?: mod.UIWidget;
    closeButtonHovered?: boolean;
    closeButtonFocused?: boolean;
    closeButtonPressed?: boolean;
    lastCloseButtonVisible?: boolean;
    lastCloseButtonVisualState?: "base" | "hover" | "pressed";
    lastLiveTerminalChromeVisible?: boolean;
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

type AmmoResupplyMenuActionRowCacheEntry = {
    bb?: mod.UIWidget;
    button?: mod.UIWidget;
    i?: mod.UIWidget;
    sig?: string;
    l1?: mod.UIWidget;
    l2?: mod.UIWidget;
    l3?: mod.UIWidget;
    s?: mod.UIWidget;
    cd?: mod.UIWidget;
    r?: mod.UIWidget;
    cs?: mod.UIWidget;
    ct?: mod.UIWidget;
};

type AmmoResupplyMenuChargeCacheEntry = {
    bb?: mod.UIWidget;
    button?: mod.UIWidget;
    i?: mod.UIWidget;
    sig?: string;
    l1?: mod.UIWidget;
    l2?: mod.UIWidget;
    l3?: mod.UIWidget;
    s?: mod.UIWidget;
    cd?: mod.UIWidget;
    r?: mod.UIWidget;
    cs?: mod.UIWidget;
    ct?: mod.UIWidget;
};

type AmmoResupplyMenuCacheEntry = {
    rootName: string;
    lastRefreshSecond?: number;
    root?: mod.UIWidget;
    borderTop?: mod.UIWidget;
    borderBottom?: mod.UIWidget;
    borderLeft?: mod.UIWidget;
    borderRight?: mod.UIWidget;
    title?: mod.UIWidget;
    h?: Array<mod.UIWidget | undefined>;
    a: AmmoResupplyMenuChargeCacheEntry[];
    rows: AmmoResupplyMenuActionRowCacheEntry[];
    m: AmmoResupplyMenuChargeCacheEntry;
    x: AmmoResupplyMenuChargeCacheEntry[];
    e: AmmoResupplyMenuChargeCacheEntry;
    q: AmmoResupplyMenuChargeCacheEntry[];
    ag?: mod.UIWidget;
    ah?: mod.UIWidget;
    at?: mod.UIWidget;
    mg?: mod.UIWidget;
    mh?: mod.UIWidget;
    mt?: mod.UIWidget;
    eg?: mod.UIWidget;
    eh?: mod.UIWidget;
    et?: mod.UIWidget;
    rg?: mod.UIWidget;
    rh?: mod.UIWidget;
    rt?: mod.UIWidget;
    helpText?: mod.UIWidget;
    gadgetDelayStatus?: mod.UIWidget;
    gadgetDelayStatusSig?: string;
    closeButtonBorder?: mod.UIWidget;
    closeButton?: mod.UIWidget;
    closeButtonText?: mod.UIWidget;
    // Per-class slot-toggle row widgets under each class header. Indices 0..3 match HDR_KEYS.
    st?: Array<{
        prev?: mod.UIWidget;
        prevLabel?: mod.UIWidget;
        label?: mod.UIWidget;
        next?: mod.UIWidget;
        nextLabel?: mod.UIWidget;
    } | undefined>;
};

