// @ts-nocheck
// Module: state/runtime-types -- GameState shape and related runtime type aliases.

//#region -------------------- Game State Type Definitions --------------------

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
        autoStartMinActivePlayers: number;
        matchupPresetIndex: number;
        lastMatchupChangeAtSeconds: number;
        modeConfig: ReadyDialogModeConfig;
        phase: MatchPhase;
        clock: {
            durationSeconds: number;
            matchLengthSeconds: number;
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
            cleanupActive: boolean;
            cleanupAllowDeploy: boolean;
        };
        countdown: {
            isActive: boolean;
            isRequested: boolean;
            token: number;
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
    match: {
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
    };
    debug: {
        highlightedMessageCount: number;
        lastHighlightedMessageAtSeconds: number;
        lastHighlightedMessageKey: number;
    };
    players: {
        // Property name is retained because existing UI/interaction modules still use it.
        readyDialogData: Record<number, readyDialogData_t>;
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
        hudByPid: Record<number, HudRefs>;
        clockWidgetCache: Record<number, ClockWidgetCacheEntry>;
        countdownWidgetCache: Record<number, CountdownWidgetCacheEntry>;
    };
}

//#endregion ----------------- Game State Type Definitions --------------------
