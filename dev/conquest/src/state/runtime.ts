// @ts-nocheck
// Module: state/runtime -- GameState type and central State object

//#region -------------------- Game State Definition --------------------

// Overtime compatibility UI widget caches (per-player), retained in shared state shape.
type OvertimeFlagHudRefs = {
    root?: mod.UIWidget;
    title?: mod.UIWidget;
    titleShadow?: mod.UIWidget;
    status?: mod.UIWidget;
    statusShadow?: mod.UIWidget;
    countsLeft?: mod.UIWidget;
    countsRight?: mod.UIWidget;
    countsLeftBorder?: mod.UIWidget;
    countsRightBorder?: mod.UIWidget;
    percentLeftBg?: mod.UIWidget;
    percentRightBg?: mod.UIWidget;
    percentLeft?: mod.UIWidget;
    percentRight?: mod.UIWidget;
    countsLeftCrown?: mod.UIWidget;
    countsRightCrown?: mod.UIWidget;
    barBg?: mod.UIWidget;
    barFillT1?: mod.UIWidget;
    barFillT2?: mod.UIWidget;
    vehicleRequired?: mod.UIWidget;
};

type OvertimeFlagGlobalHudRefs = {
    root?: mod.UIWidget;
    title?: mod.UIWidget;
    barBg?: mod.UIWidget;
    barFillT1?: mod.UIWidget;
    barFillT2?: mod.UIWidget;
};

// Overtime compatibility zone-membership cache (vehicleObjId = 0 when on foot).
type OvertimeFlagPlayerZoneState = {
    playerObjId: number;
    teamId: TeamID | 0;
    vehicleObjId: number;
};

// Overtime compatibility HUD snapshot cache (avoids per-tick UI churn when compatibility hooks are enabled).
type OvertimeFlagUiSnapshot = {
    progressPercent: number;
    leftPercent: number;
    rightPercent: number;
    barFillT1Width: number;
    barFillT2Width: number;
    t1Count: number;
    t2Count: number;
    statusKey: number;
    statusValue: number;
    statusVisible: boolean;
    titleKey: number;
    titleValue: number;
    countsVisible: boolean;
    countsUseX: boolean;
    leftBorderVisible: boolean;
    rightBorderVisible: boolean;
    vehicleRequiredVisible: boolean;
};

type VehicleSpawnerSlot = {
    teamId: TeamID;
    slotNumber: number;
    spawner: mod.VehicleSpawner;
    spawnerObjId: number;
    spawnPos: mod.Vector;
    spawnRot: mod.Vector;
    vehicleType: mod.VehicleList;
    enabled: boolean;
    enableToken: number;
    spawnRequestToken: number;
    spawnRequestAtSeconds: number;
    expectingSpawn: boolean;
    vehicleId: number;
    respawnRunning: boolean;
    spawnRetryScheduled: boolean;
};

// GameState centralizes all mutable mode/UI state so writes are explicit and searchable.
interface GameState {
    round: {
        current: number;
        max: number;
        killsTarget: number;
        autoStartMinActivePlayers: number;
        matchupPresetIndex: number;
        lastMatchupChangeAtSeconds: number;
        modeConfig: ReadyDialogModeConfig;
        phase: RoundPhase;
        lastWinnerTeam: TeamID | 0;
        lastEndDetailReason: RoundEndDetailReason;
        lastObjectiveProgress: number;
        clock: {
            durationSeconds: number;
            roundLengthSeconds: number;
            matchStartElapsedSeconds?: number;
            pausedRemainingSeconds?: number;
            isPaused: boolean;
            lastDisplayedSeconds?: number;
            lastLowTimeState?: boolean;
            expiryFired: boolean;
            expiryHandlers: Array<() => void>;
        };
        // cleanupActive gates deploy/UI during cleanup windows; cleanupAllowDeploy temporarily overrides.
        flow: {
            roundEndRedeployToken: number;
            clockExpiryBound: boolean;
            cleanupActive: boolean;
            cleanupAllowDeploy: boolean;
            // Locks HUD updates during mode-end teardown windows to avoid unstable UI calls.
            roundEndUiLockdown: boolean;
        };
        countdown: {
            isActive: boolean;
            isRequested: boolean;
            token: number;
            overLineMessageToken: number;
        };
        aircraftCeiling: {
            mapDefaultHudCeiling: number;
            hudMaxY: number;
            hudFloorY: number;
            customEnabled: boolean;
            enforcementToken: number;
            vehicleStates: Record<number, AircraftCeilingVehicleState>;
        };
    };
    // Overtime compatibility capture state (retained; conquest flow does not actively drive this).
    // Progress is 0..1 (0 = Team2 owns, 1 = Team1 owns, 0.5 = neutral).
    // t1Count/t2Count track unique vehicles in the zone (not player count).
    flag: {
        stage: OvertimeStage;
        active: boolean;
        trackingEnabled: boolean;
        unlockReminderSent: boolean;
        configValid: boolean;
        // True only when an admin override actually selected a zone during compatibility flows.
        overrideUsedThisRound: boolean;
        tieBreakerEnabledThisRound: boolean;
        candidateZones: OvertimeZoneCandidate[];
        activeAreaTriggerId?: number;
        activeAreaTrigger?: mod.AreaTrigger;
        activeSectorId?: number;
        activeSector?: mod.Sector;
        activeWorldIconId?: number;
        activeWorldIcon?: mod.WorldIcon;
        activeCapturePointId?: number;
        activeCapturePoint?: mod.CapturePoint;
        activeCandidateIndex?: number;
        // Cached string key for the selected zone letter (A-G).
        selectedZoneLetterKey?: number;
        ownerTeam: TeamID | 0;
        progress: number;
        t1Count: number;
        t2Count: number;
        playersInZoneByPid: Record<number, OvertimeFlagPlayerZoneState>;
        vehicleOccupantsByVid: Record<number, number>;
        vehicleTeamByVid: Record<number, TeamID>;
        lastUiSnapshotByPid: Record<number, OvertimeFlagUiSnapshot>;
        lastGlobalProgressPercent: number;
        lastMembershipPruneAtSeconds: number;
        uiByPid: Record<number, OvertimeFlagHudRefs>;
        globalUiByPid: Record<number, OvertimeFlagGlobalHudRefs>;
        tickToken: number;
        tickActive: boolean;
    };
    scores: {
        t1RoundKills: number;
        t2RoundKills: number;
        t1TotalKills: number;
        t2TotalKills: number;
    };
    match: {
        winsT1: number;
        winsT2: number;
        lossesT1: number;
        lossesT2: number;
        tiesT1: number;
        tiesT2: number;
        isEnded: boolean;
        victoryDialogActive: boolean;
        winnerTeam?: TeamID | 0;
        endElapsedSecondsSnapshot: number;
        victoryStartElapsedSecondsSnapshot: number;
        flow: {
            matchEndDelayToken: number;
        };
    };
    admin: {
        actionCount: number;
        debugLoopActive: boolean;
        tieBreakerOverrideIndex?: number;
        // Match-level flag if any legacy tie-breaker override was used.
        tieBreakerOverrideUsed: boolean;
        tieBreakerModeIndex: number;
    };
    debug: {
        highlightedMessageCount: number;
        lastHighlightedMessageAtSeconds: number;
        lastHighlightedMessageKey: number;
    };
    players: {
        teamSwitchData: Record<number, teamSwitchData_t>;
        readyByPid: Record<number, boolean>;
        readyMessageCooldownByPid: Record<number, number>;
        // Join-time prompt: only once per player, regardless of undeploy repeats.
        joinPromptShownByPid: Record<number, boolean>;
        // "Never Show Again" is stored per map so other maps can still show the prompt.
        joinPromptNeverShowByPidMap: Record<number, Partial<Record<MapKey, boolean>>>;
        // Join prompt sequencing (tips + unlock tracking).
        joinPromptReadyDialogOpenedByPid: Record<number, boolean>;
        joinPromptTipIndexByPid: Record<number, number>;
        joinPromptTipsUnlockedByPid: Record<number, boolean>;
        joinPromptTripleTapArmedByPid: Record<number, boolean>;
        inMainBaseByPid: Record<number, boolean>;
        overTakeoffLimitByPid: Record<number, boolean>;
        deployedByPid: Record<number, boolean>;
        disconnectedByPid: Record<number, boolean>;
        uiInputEnabledByPid: Record<number, boolean>;
    };
    vehicles: {
        slots: VehicleSpawnerSlot[];
        vehicleToSlot: Record<number, number>;
        spawnSequenceToken: number;
        spawnSequenceInProgress: boolean;
        activeSpawnSlotIndex?: number;
        activeSpawnToken?: number;
        activeSpawnRequestedAtSeconds?: number;
        configReady: boolean;
        startupCleanupDone: boolean;
    };
    hudCache: {
        lastHudScoreT1?: number;
        lastHudScoreT2?: number;
        lastHudRoundKillsT1?: number;
        lastHudRoundKillsT2?: number;
        hudByPid: Record<number, HudRefs>;
        clockWidgetCache: Record<number, ClockWidgetCacheEntry>;
        countdownWidgetCache: Record<number, CountdownWidgetCacheEntry>;
        overLineTitleWidgetCache: Record<number, CountdownWidgetCacheEntry>;
        overLineSubtitleWidgetCache: Record<number, CountdownWidgetCacheEntry>;
        overLineTitleShadowWidgetCache: Record<number, CountdownWidgetCacheEntry>;
        overLineSubtitleShadowWidgetCache: Record<number, CountdownWidgetCacheEntry>;
    };
}

// -------------------- Authoritative State Map --------------------
//
// Flow state (resets at mode setup):
// - State.round.current/max/killsTarget: legacy round metadata retained for shared UI/config compatibility.
// - State.round.phase: RoundPhase.NotReady | RoundPhase.Live | RoundPhase.GameOver.
// - State.round.clock.durationSeconds: authoritative remaining seconds in the live-phase timer.
// - State.round.clock.roundLengthSeconds: configured starting duration for each live start.
//
// Match state (resets at match start):
// - State.match.winsT1/T2, State.match.lossesT1/T2, State.match.tiesT1/T2: retained counters for HUD/scoreboard compatibility.
// - State.match.isEnded: indicates match is over and victory dialog should be shown.
//
// Vehicle registration (persists across live-flow transitions unless explicitly cleared):
// - regVehiclesTeam1 (GlobalVariable 0): array of vehicles registered to Team 1.
// - regVehiclesTeam2 (GlobalVariable 1): array of vehicles registered to Team 2.
// - vehIds/vehOwners: best-effort 'last driver' mapping used for messages only.
//
// UI caches (per-player, rebuilt as needed):
// - State.hudCache.hudByPid[pid]: cached HUD widget references.
// - dialog/widget caches: cached references to modal UI elements (team switch, victory, clock digits).
//
// ------------------------------------------------------------------

// Centralized mutable state for mode flow and UI caches.
const State: GameState = {
    round: {
        current: 1,
        max: MAX_ROUNDS,
        killsTarget: ROUND_KILLS_TARGET,
        autoStartMinActivePlayers: DEFAULT_AUTO_START_MIN_ACTIVE_PLAYERS,
        matchupPresetIndex: DEFAULT_MATCHUP_PRESET_INDEX,
        lastMatchupChangeAtSeconds: -999,
        modeConfig: {
            gameModeIndex: READY_DIALOG_GAME_MODE_DEFAULT_INDEX,
            aircraftCeiling: READY_DIALOG_AIRCRAFT_CEILING_DEFAULT,
            aircraftCeilingOverridePending: false,
            vehicleIndexT1: READY_DIALOG_VEHICLE_T1_DEFAULT_INDEX,
            vehicleIndexT2: READY_DIALOG_VEHICLE_T2_DEFAULT_INDEX,
            gameMode: READY_DIALOG_GAME_MODE_OPTIONS[READY_DIALOG_GAME_MODE_DEFAULT_INDEX],
            gameSettings: mod.stringkeys.twl.readyDialog.modeSettingAircraftCeilingFormat,
            vehiclesT1: READY_DIALOG_VEHICLE_OPTIONS[READY_DIALOG_VEHICLE_T1_DEFAULT_INDEX],
            vehiclesT2: READY_DIALOG_VEHICLE_OPTIONS[READY_DIALOG_VEHICLE_T2_DEFAULT_INDEX],
            confirmed: {
                gameMode: READY_DIALOG_GAME_MODE_OPTIONS[READY_DIALOG_GAME_MODE_DEFAULT_INDEX],
                gameSettings: mod.stringkeys.twl.readyDialog.modeSettingAircraftCeilingFormat,
                vehiclesT1: READY_DIALOG_VEHICLE_OPTIONS[READY_DIALOG_VEHICLE_T1_DEFAULT_INDEX],
                vehiclesT2: READY_DIALOG_VEHICLE_OPTIONS[READY_DIALOG_VEHICLE_T2_DEFAULT_INDEX],
                aircraftCeiling: READY_DIALOG_AIRCRAFT_CEILING_DEFAULT,
                aircraftCeilingOverrideEnabled: false,
                vehicleIndexT1: READY_DIALOG_VEHICLE_T1_DEFAULT_INDEX,
                vehicleIndexT2: READY_DIALOG_VEHICLE_T2_DEFAULT_INDEX,
                vehicleOverrideEnabled: false,
            },
        },
        phase: RoundPhase.NotReady,
        lastWinnerTeam: 0,
        lastEndDetailReason: RoundEndDetailReason.None,
        lastObjectiveProgress: 0.5,
        clock: {
            durationSeconds: ROUND_CLOCK_DEFAULT_SECONDS,
            roundLengthSeconds: ROUND_CLOCK_DEFAULT_SECONDS,
            matchStartElapsedSeconds: undefined,
            pausedRemainingSeconds: undefined,
            isPaused: false,
            lastDisplayedSeconds: undefined,
            lastLowTimeState: undefined,
            expiryFired: false,
            expiryHandlers: [],
        },
        flow: {
            roundEndRedeployToken: 0,
            clockExpiryBound: false,
            cleanupActive: false,
            cleanupAllowDeploy: false,
            roundEndUiLockdown: false,
        },
        countdown: {
            isActive: false,
            isRequested: false,
            token: 0,
            overLineMessageToken: 0,
        },
        aircraftCeiling: {
            mapDefaultHudCeiling: READY_DIALOG_AIRCRAFT_CEILING_DEFAULT,
            hudMaxY: READY_DIALOG_AIRCRAFT_CEILING_DEFAULT,
            hudFloorY: 0,
            customEnabled: false,
            enforcementToken: 0,
            vehicleStates: {},
        },
    },
    flag: {
        stage: OvertimeStage.None,
        active: false,
        trackingEnabled: false,
        unlockReminderSent: false,
        configValid: false,
        overrideUsedThisRound: false,
        tieBreakerEnabledThisRound: false,
        candidateZones: [],
        activeAreaTriggerId: undefined,
        activeAreaTrigger: undefined,
        activeSectorId: undefined,
        activeSector: undefined,
        activeWorldIconId: undefined,
        activeWorldIcon: undefined,
        activeCapturePointId: undefined,
        activeCapturePoint: undefined,
        activeCandidateIndex: undefined,
        selectedZoneLetterKey: undefined,
        ownerTeam: 0,
        progress: 0.5,
        t1Count: 0,
        t2Count: 0,
        playersInZoneByPid: {},
        vehicleOccupantsByVid: {},
        vehicleTeamByVid: {},
        lastUiSnapshotByPid: {},
        lastGlobalProgressPercent: -1,
        lastMembershipPruneAtSeconds: 0,
        uiByPid: {},
        globalUiByPid: {},
        tickToken: 0,
        tickActive: false,
    },
    scores: {
        t1RoundKills: 0,
        t2RoundKills: 0,
        t1TotalKills: 0,
        t2TotalKills: 0,
    },
    match: {
        winsT1: 0,
        winsT2: 0,
        lossesT1: 0,
        lossesT2: 0,
        tiesT1: 0,
        tiesT2: 0,
        isEnded: false,
        victoryDialogActive: false,
        winnerTeam: undefined,
        endElapsedSecondsSnapshot: 0,
        victoryStartElapsedSecondsSnapshot: 0,
        flow: {
            matchEndDelayToken: 0,
        },
    },
    admin: {
        actionCount: 0,
        debugLoopActive: false,
        tieBreakerOverrideIndex: undefined,
        tieBreakerOverrideUsed: false,
        tieBreakerModeIndex: ADMIN_TIEBREAKER_MODE_DEFAULT_INDEX,
    },
    debug: {
        highlightedMessageCount: 0,
        lastHighlightedMessageAtSeconds: -1,
        lastHighlightedMessageKey: -1,
    },
    players: {
        teamSwitchData: {},
        readyByPid: {},
        readyMessageCooldownByPid: {},
        joinPromptShownByPid: {},
        joinPromptNeverShowByPidMap: {},
        joinPromptReadyDialogOpenedByPid: {},
        joinPromptTipIndexByPid: {},
        joinPromptTipsUnlockedByPid: {},
        joinPromptTripleTapArmedByPid: {},
        inMainBaseByPid: {},
        overTakeoffLimitByPid: {},
        deployedByPid: {},
        disconnectedByPid: {},
        uiInputEnabledByPid: {},
    },
    vehicles: {
        slots: [],
        vehicleToSlot: {},
        spawnSequenceToken: 0,
        spawnSequenceInProgress: false,
        activeSpawnSlotIndex: undefined,
        activeSpawnToken: undefined,
        activeSpawnRequestedAtSeconds: undefined,
        configReady: false,
        startupCleanupDone: false,
    },
    hudCache: {
        lastHudScoreT1: undefined,
        lastHudScoreT2: undefined,
        lastHudRoundKillsT1: undefined,
        lastHudRoundKillsT2: undefined,
        hudByPid: {},
        clockWidgetCache: {},
        countdownWidgetCache: {},
        overLineTitleWidgetCache: {},
        overLineSubtitleWidgetCache: {},
        overLineTitleShadowWidgetCache: {},
        overLineSubtitleShadowWidgetCache: {},
    },
};

//#endregion ----------------- Game State Definition --------------------
