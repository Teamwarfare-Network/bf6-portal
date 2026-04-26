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
    // CQ_Bug_52: seconds at which expectingSpawn was most recently flipped to true.
    // Used by the watchdog reap in pollVehicleSpawnerSlots to detect latched flags.
    expectingSpawnStartedAtSeconds: number;
    vehicleId: number;
    respawnDelaySeconds: number;
    respawnQueuedAtSeconds: number;
    respawnReadyAtSeconds: number;
    lastSpawnedAtSeconds: number;
    lastDestroyedAtSeconds: number;
    lastMissingAtSeconds: number;
    respawnRunning: boolean;
    spawnCategory: VehicleSlotSpawnCategory;
    deployFlowTracked: boolean;
    availabilityPhase: VehicleSlotAvailabilityPhase;
    pendingSpawnOwnerPid?: number;
    pendingSpawnMode?: VehicleDirectSpawnMode;
    // HQ claim trigger surface: "deploy_menu" (dead, at deploy screen) vs "on_foot"
    // (alive, live-terminal). Drives the beginHqSeatFlow branch selection.
    hqSource?: "deploy_menu" | "on_foot";
    activeOwnerPid?: number;
    // Forward Deploy: pre-sampled random point + rotation inside the team's forward volume.
    // Consumed by the dispatch branch in vanilla-spawner when pendingSpawnMode === "forward"
    // (SetObjectTransform relocates slot.spawner here before ForceVehicleSpawnerSpawn), then
    // re-seeded in onForwardSpawnSuccess so the next forward click is ready.
    nextForwardPos?: mod.Vector;
    nextForwardRot?: mod.Vector;
    // Air Deploy: pre-sampled random sky point + rotation inside the team's aircraft volume.
    // Consumed by the dispatch branch in vanilla-spawner when pendingSpawnMode === "air" and
    // re-seeded in onAirSpawnSuccess. Rotation is rotPlane for jets (may include pitch) or
    // rotHeli for helis; Y is sampled on top of the quad floor per the volume's heli/jet
    // altitude bands.
    nextAirPos?: mod.Vector;
    nextAirRot?: mod.Vector;
    // v1.258 rewrite: Clocks-backed respawn countdown. Active only while counting down;
    // cleared on bind, slot-disable, type-change, or matchup re-apply.
    respawnClock?: Clocks.CountDownClock;
};

type VehicleSlotSpawnCategory =
    | "attack_chopper"
    | "transport_chopper"
    | "jet"
    | "ground_vehicle"
    | "fast_mover"
    | "other";

type VehicleDirectSpawnMode = "air" | "ground" | "forward";

type VehicleSlotAvailabilityPhase =
    | "DISABLED"
    | "EMPTY_ENABLED"
    | "SPAWN_REQUESTED"
    | "ACTIVE"
    | "RESPAWN_PENDING"
    | "RESPAWN_READY";

type ConquestLifecyclePhase = "NOT_READY" | "COUNTDOWN" | "PRE_MATCH" | "LIVE_MATCH" | "POST_MATCH" | "RESET";
type PositionDebugTransformSource = "soldier" | "vehicle";

// Per-player polygon-membership snapshot for the five boundary AreaTriggers used by the
// custom GCZ enforcement. Owned exclusively by updateZoneStateOnTriggerTransition; consumed
// only by getDesiredBoundaryViolationKind. Default-false for every field on a fresh deploy
// so the trigger enter event for whatever zone the player spawns inside flips the matching
// flag to true synchronously. inOwnHQ is mirrored to State.players.inMainBaseByPid for
// downstream consumers (world-interactables, takeoff-gating).
//
// seatKind tracks whether the player is currently on foot, in a ground vehicle, or in an
// aircraft. Owned exclusively by setPlayerSeatKind (called from OnPlayerEnter/ExitVehicle and
// the deploy seed). The boundary classifier reads this directly -- no engine queries at
// classification time -- because per-tick mod.GetVehicleFromPlayer + mod.CompareVehicleName
// chains have documented reliability gaps on this Portal runtime (CQ_Bug_43, Air Deploy
// timing race). Cache once at the event boundary, read everywhere else.
type SeatKind = "on_foot" | "ground_vehicle" | "aircraft";

type PlayerZoneState = {
    inOwnHQ: boolean;
    inOwnBuffer: boolean;
    inGCZ: boolean;
    inEnemyHQ: boolean;
    inEnemyBuffer: boolean;
    seatKind: SeatKind;
};

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

type ConquestSoundEventKey = "capture_tick";

type ConquestQueuedSoundEvent = {
    eventKey: ConquestSoundEventKey;
    objId: number;
    sourceTeamId: TeamID;
    queuedAtSeconds: number;
};

type ConquestSoundRuntimeState = {
    enabled: boolean;
    captureTickFriendlyHandle?: any;
    captureTickEnemyHandle?: any;
    handlesReady: boolean;
    queue: ConquestQueuedSoundEvent[];
    lastFlushAtSeconds: number;
    lastEventAtByThrottleKey: Record<string, number>;
};

type ConquestVoEventKey =
    | "objective_capturing"
    | "objective_contested"
    | "objective_neutralised"
    | "objective_captured";

type ConquestQueuedVoEvent = {
    eventKey: ConquestVoEventKey;
    objId: number;
    sourceTeamId: TeamID | 0;
    queuedAtSeconds: number;
    terminal: boolean;
};

type ConquestObjectiveVoState = {
    phase: "IDLE" | "CAPTURING" | "CONTESTED" | "NEUTRALISED" | "CAPTURED";
    activeTeamId: TeamID | 0;
    lastAnnouncedOwnerTeam: TeamID | 0;
    lastChangedAtSeconds: number;
};

type ConquestVoRuntimeState = {
    enabled: boolean;
    runtimeHandleByPid: Record<number, any>;
    handlesReadyByPid: Record<number, boolean>;
    queue: ConquestQueuedVoEvent[];
    lastFlushAtSeconds: number;
    lastEventAtByThrottleKey: Record<string, number>;
    objectiveStateByObjId: Record<number, ConquestObjectiveVoState>;
    recentActiveObjIdByPid: Record<number, number>;
    recentActiveAtSecondsByPid: Record<number, number>;
};

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
    worldInteractableIconByTeamByObjId: Record<number, Record<number, any>>;
    // Runtime-spawned VFX handles keyed by interactable config objId, populated from
    // `spawnWorldInteractableVfxForActiveConfigs` and torn down on map config reset.
    worldInteractableVfxHandleByObjId: Record<number, any>;
    // Cooldown gate for VFX refresh — seconds timestamp of last destroy-and-respawn cycle.
    worldInteractableVfxLastRefreshAtSeconds: number;
    sound: ConquestSoundRuntimeState;
    vo: ConquestVoRuntimeState;
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
        hudModeOverride?: TwlConquestHudMode;
        hudLastUpdatedAtSeconds: number;
        hudDirty: boolean;
        pregameReadyHudDirty: boolean;
        pregameDialogDirty: boolean;
        pregameHelpDirty: boolean;
        ticketLeaderTeam: TeamID | 0;
        hudGenerationByPid: Record<number, number>;
        combatHudGenerationByPid: Record<number, number>;
        teamSwapRefreshTokenByPid: Record<number, number>;
        teamSwapHudResetPendingByPid: Record<number, boolean>;
        perspectiveTeamByPid: Record<number, TeamID | 0>;
        teamSwapPerspectiveLockUntilByPid: Record<number, number>;
        engageHiddenUntilDeployByPid: Record<number, boolean>;
        hudStatusVmByPid: Record<number, {
            isLive: boolean;
            isGameOver: boolean;
            showRoundStateLine: boolean;
            showPlayersReadyLine: boolean;
        }>;
        hudHelpReadyVmByPid: Record<number, {
            showHelp: boolean;
            showReady: boolean;
        }>;
        hudClockVmByPid: Record<number, {
            remainingSeconds: number;
            isLowTime: boolean;
            isPaused: boolean;
        }>;
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
            // Authoritative time source (v1.338+). Shadow fields below stay in sync
            // for external consumers that read State.round.clock.* directly.
            countdown?: Clocks.CountDownClock;
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
        liveStartedAtSeconds: number | undefined;
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
        boundary: {
            // Single source of truth for boundary-trigger polygon membership. See PlayerZoneState.
            zoneStateByPid: Record<number, PlayerZoneState>;
            activeViolationByPid: Record<number, BoundaryViolationState>;
            alarmHandle?: any;
            alarmReady: boolean;
            validationWarnings: string[];
            nextEnforcementToken: number;
        };
        armSfx: {
            handle?: any;
            ready: boolean;
        };
        smk: Record<number, {
            c: number;
            n: number;
        }>;
        asg: Record<number, Array<{ c: number; n: number }>>;
        asgL: Record<number, Array<{ c: number; n: number } | null>>;
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
        perfDiagEnabled: boolean;
        perfDiagTickCount: number;
        perfDiagWindowStart: number;
        perfDiagLastTickRate: number;
        perfDiagLastEmitAt: number;
        perfDiagSpikeTotal: number;
        perfDiagMinTickRate: number;
        perfDiagSectionMax: number[];
        perfDiagSectionHits: number[];
    };
    players: {
        // Property name is retained because existing UI/interaction modules still use it.
        readyDialogData: Record<number, readyDialogData_t>;
        readyByPid: Record<number, boolean>;
        readyNeedsReconfirmByPid: Record<number, boolean>;
        readyMessageCooldownByPid: Record<number, number>;
        inMainBaseByPid: Record<number, boolean>;
        worldInteractableIconByPidByObjId: Record<number, Record<number, any>>;
        armO: Record<number, boolean>;
        armI: Record<number, number>;
        armT: Record<number, number>;
        // Currently-focused tile key per pid in the Supply Box (arm) menu, for the
        // disabled-focused border indicator. Cleared on FocusOut, menu close, and player leave.
        armFocusedTileKeyByPid: Record<number, string>;
        // True while a player's UI warm-prime is in flight (entry to exit of
        // prebuildAllUiFamiliesHidden). Read by confirmReadyDialogModeConfig (Apply Config) to
        // refuse-with-feedback while any warm is mid-flight, preventing the v1.380 hard-crash
        // case where Apply Config's per-player widget rebuild collides with a late-joiner's
        // partially-populated UI cache. Cleared in a finally block (covers throw/early-return)
        // and in the player-leave cleanup path (covers disconnect-during-warm).
        warmPrimeActiveByPid: Record<number, boolean>;
        armG: Record<number, {
            n: number;
            s: number;
        }>;
        armL: Record<number, {
            lN: number;
            aC: number;
            aN: number;
            s: number;
        }>;
        // Per-player authoritative model of both gadget slots. Seeded by a one-time probe when
        // the locker menu opens, then updated deterministically on every grant/replace. Deleted
        // on menu close so the next open re-probes fresh (no drift from respawns / kit pickups).
        lockerSlots: Record<number, {
            g1: {
                kind: "unknown" | "empty" | "launcher" | "gadget";
                gadget?: number;
                source: "probed" | "placed";
            };
            g2: {
                kind: "unknown" | "empty" | "launcher" | "gadget";
                gadget?: number;
                source: "probed" | "placed";
            };
            initializedAt: number;
        }>;
        armS: Record<number, {
            mN: number;
            mS: number;
            rdN: number;
            rgN: number;
            rgS: number;
        }>;
        // Per-player per-class choice of which gadget slot the locker menu should clobber on
        // placement. Initialized to [2,2,2,2] on menu open, cleared on close. Indices match
        // HDR_KEYS order: 0=Assault, 1=Engineer, 2=Medic, 3=Recon.
        lockerSlotToggle: Record<number, {
            slotByClass: [1 | 2, 1 | 2, 1 | 2, 1 | 2];
        }>;
        uiCachePerfByPid: Record<number, {
            vehicle: {
                built: number;
                rebuilt: number;
                cold: number;
                invalid: number;
            };
            ready: {
                built: number;
                rebuilt: number;
                cold: number;
                invalid: number;
            };
            gadget: {
                built: number;
                rebuilt: number;
                cold: number;
                invalid: number;
            };
        }>;
        deployedByPid: Record<number, boolean>;
        // Match-time seconds at which the player most recently transitioned to deployed. Used by
        // the boundary classifier to suppress GCZ violations during a short grace window after
        // deploy, covering the rare case where an expected trigger enter event doesn't fire.
        deployedAtSecondsByPid: Record<number, number>;
        disconnectedByPid: Record<number, boolean>;
        uiInputEnabledByPid: Record<number, boolean>;
        liveVehicleDeployMenuVisibleByPid: Record<number, boolean>;
        posDebugTransformSourceByPid: Record<number, PositionDebugTransformSource>;
        posDebugVehicleObjIdByPid: Record<number, number>;
        kpiByPid: Record<number, {
            kills: number;
            deaths: number;
            assists: number;
            captures: number;
            score: number;
            dirty: boolean;
            deathsBaseline: number;
        }>;
    };
    vehicles: {
        slots: VehicleSpawnerSlot[];
        vehicleToSlot: Record<number, number>;
        desiredEnabledSlotsTeam1: number;
        desiredEnabledSlotsTeam2: number;
        spawnSequenceToken: number;
        spawnSequenceInProgress: boolean;
        activeSpawnSlotIndex?: number;
        activeSpawnToken?: number;
        activeSpawnRequestedAtSeconds?: number;
        configReady: boolean;
        startupCleanupDone: boolean;
    };
    hqDeploy: {
        lastRequestAtSecondsByPid: Record<number, number>;
    };
    hudCache: {
        topHudShellByPid: Record<number, TopHudShellRefs>;
        clockWidgetCache: Record<number, ClockWidgetCacheEntry>;
        countdownWidgetCache: Record<number, CountdownWidgetCacheEntry>;
        vehicleDeployTimerCache: Record<number, VehicleDeployTimerHudCacheEntry>;
        ammoResupplyMenuCache: Record<number, AmmoResupplyMenuCacheEntry>;
        boundaryPromptCache: Record<number, BoundaryPromptWidgetCacheEntry>;
    };
}

//#endregion ----------------- Game State Type Definitions --------------------

