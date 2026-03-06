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

type ConquestLifecyclePhase = "NOT_READY" | "PRE_MATCH" | "LIVE_MATCH" | "POST_MATCH" | "RESET";

type ConquestCapturePointRuntimeState = {
    objId: number;
    label: string;
    order: number;
    mapped: boolean;
    // Authoritative owner latch after capture/loss edges; prevents stale engine echoes from reverting state.
    ownerLatchedByEvent: boolean;
    ownerTeam: TeamID | 0;
    ownerProgressTeam: TeamID | 0;
    progress01: number;
    onPointTeam1: number;
    onPointTeam2: number;
    lastUpdatedAtSeconds: number;
};

type ConquestFlagVisualPhase =
    | "NEUTRAL_IDLE"
    | "NEUTRAL_CAPTURING"
    | "OWNED_STABLE"
    | "OWNED_CONTESTED_DRAIN"
    | "OWNED_CONTESTED_RECOVER"
    | "NEUTRALIZED_LATCH";

type ConquestFlagVisualRuntimeState = {
    phase: ConquestFlagVisualPhase;
    ownerTeam: TeamID | 0;
    activeTeam: TeamID | 0;
    progress01: number;
    ownerRemaining01: number;
    // Holds owner visuals off after a neutralization edge until a new full ownership confirmation arrives.
    suppressOwnerUntilRecaptured: boolean;
    neutralizationLatchUntilTick: number;
    lastPhase: ConquestFlagVisualPhase;
    lastPhaseChangeTick: number;
    sampleTick: number;
};

type ConquestSpawnChargeReason =
    | "deploy"
    | "forced_redeploy"
    | "team_switch"
    | "admin_move"
    | "phase_transition"
    | "reconnect";

type ConquestSpawnChargeTxnState = {
    deploySeq: number;
    lastChargedDeploySeq: number;
    lastChargeAtSeconds: number;
    lastReason: ConquestSpawnChargeReason | "none";
};

type ConquestSpawnChargeReasonCounters = Record<ConquestSpawnChargeReason, number>;

type ConquestRuntimeScaffold = {
    lifecyclePhase: ConquestLifecyclePhase;
    tickets: {
        team1: number;
        team2: number;
    };
    bleed: {
        enabled: boolean;
        lastTickSeconds: number;
        perDiffPerSecond: number;
        carryTeam1: number;
        carryTeam2: number;
    };
    capture: {
        byObjId: Record<number, ConquestCapturePointRuntimeState>;
        mappedObjIdsInOrder: number[];
        lastUnmappedObjId?: number;
        unmappedSeenCount: number;
        visualByObjId: Record<number, ConquestFlagVisualRuntimeState>;
        engagedObjIdByPid: Record<number, number>;
    };
    spawnCharge: {
        enabled: boolean;
        chargePerDeploy: number;
        firstLiveSpawnExemptByPid: Record<number, boolean>;
        deployTxnByPid: Record<number, ConquestSpawnChargeTxnState>;
        pendingReasonByPid: Record<number, ConquestSpawnChargeReason>;
        deployCountByReason: ConquestSpawnChargeReasonCounters;
        chargedCountByReason: ConquestSpawnChargeReasonCounters;
        duplicateChargeSuspicionCount: number;
        sessionIdentityResetCount: number;
        reconnectContinuityDropCount: number;
        lastDebugEmitAtSeconds: number;
    };
    endRace: {
        endLatched: boolean;
        endReason?: "tickets" | "clock" | "admin";
        endSnapshot?: {
            team1Tickets: number;
            team2Tickets: number;
            elapsedSeconds: number;
            winnerTeam: TeamID | 0;
        };
    };
    debug: {
        hudEnabled: boolean;
        hudLastUpdatedAtSeconds: number;
        hudDirty: boolean;
        ticketLeaderTeam: TeamID | 0;
        teamSwapRefreshTokenByPid: Record<number, number>;
        perspectiveTeamByPid: Record<number, TeamID | 0>;
        teamSwapPerspectiveLockUntilByPid: Record<number, number>;
    };
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
    conquest: ConquestRuntimeScaffold;
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
