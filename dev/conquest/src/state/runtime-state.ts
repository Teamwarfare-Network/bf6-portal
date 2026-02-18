// @ts-nocheck
// Module: state/runtime-state -- authoritative mutable mode state singleton.

// -------------------- Authoritative State Map --------------------
//
// Flow state (resets at mode setup):
// - State.round.phase: MatchPhase.NotReady | MatchPhase.Live | MatchPhase.GameOver.
// - State.round.clock.durationSeconds: authoritative remaining seconds in the live-phase timer.
// - State.round.clock.matchLengthSeconds: configured starting duration for each live start.
//
// Match state (resets at match start):
// - State.match.isEnded: indicates match is over and victory dialog should be shown.
//
// Vehicle registration (persists across live-flow transitions unless explicitly cleared):
// - regVehiclesTeam1 (GlobalVariable 0): array of vehicles registered to Team 1.
// - regVehiclesTeam2 (GlobalVariable 1): array of vehicles registered to Team 2.
// - vehIds/vehOwners: best-effort 'last driver' mapping used for messages only.
//
// UI caches (per-player, rebuilt as needed):
// - State.hudCache.hudByPid[pid]: cached HUD widget references.
// - dialog/widget caches: cached references to modal UI elements (ready dialog, victory, clock digits).
//
// ------------------------------------------------------------------

// Centralized mutable state for mode flow and UI caches.
const State: GameState = {
    round: {
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
        phase: MatchPhase.NotReady,
        clock: {
            durationSeconds: ROUND_CLOCK_DEFAULT_SECONDS,
            matchLengthSeconds: ROUND_CLOCK_DEFAULT_SECONDS,
            matchStartElapsedSeconds: undefined,
            pausedRemainingSeconds: undefined,
            isPaused: false,
            lastDisplayedSeconds: undefined,
            lastLowTimeState: undefined,
            expiryFired: false,
            expiryHandlers: [],
        },
        flow: {
            cleanupActive: false,
            cleanupAllowDeploy: false,
        },
        countdown: {
            isActive: false,
            isRequested: false,
            token: 0,
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
    match: {
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
    },
    debug: {
        highlightedMessageCount: 0,
        lastHighlightedMessageAtSeconds: -1,
        lastHighlightedMessageKey: -1,
    },
    players: {
        readyDialogData: {},
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
        hudByPid: {},
        clockWidgetCache: {},
        countdownWidgetCache: {},
    },
};
