// @ts-nocheck
// Module: round-flow — Round start/end flow and state transitions

//#region -------------------- Round Start/End Flow + State --------------------

// Runs round start/end flow tied to the round clock expiry.
// Victory dialog visibility is intentionally decoupled from State.match.isEnded.
// State.match.isEnded can become true at round end, but the Victory UI should only appear after the 10s round-end window expires.
// State.match.victoryDialogActive gates both visibility and countdown updates so the restart timer always starts at 45s when the dialog appears.

// Async control (round end):
// - State.round.flow.roundEndRedeployToken invalidates any in-flight round-end countdowns when incremented.
// - State.round.flow.clockExpiryBound prevents double-binding the clock-expiry handler.
// Async control (match end):
// - State.match.flow.matchEndDelayToken invalidates any in-flight match-end delays when incremented.


function broadcastStringKey(
    stringKey: number,
    arg0?: string | number | mod.Player,
    arg1?: string | number | mod.Player,
    arg2?: string | number | mod.Player
): void {
    const message = (arg0 === undefined)
        ? mod.Message(stringKey)
        : (arg1 === undefined)
            ? mod.Message(stringKey, arg0)
            : (arg2 === undefined)
                ? mod.Message(stringKey, arg0, arg1)
                : mod.Message(stringKey, arg0, arg1, arg2);
    sendNotificationMessage(message, false);
}

// TODO(1.0): Unused; remove before final 1.0 release.
function broadcastGameplayNotificationKey(
    stringKey: number,
    arg0?: string | number | mod.Player,
    arg1?: string | number | mod.Player,
    arg2?: string | number | mod.Player
): void {
    const message = (arg0 === undefined)
        ? mod.Message(stringKey)
        : (arg1 === undefined)
            ? mod.Message(stringKey, arg0)
            : (arg2 === undefined)
                ? mod.Message(stringKey, arg0, arg1)
                : mod.Message(stringKey, arg0, arg1, arg2);
    sendNotificationMessage(message, true);
}

// TODO(1.0): Unused; remove before final 1.0 release.
function broadcastGameplayHighlightedStringKey(
    stringKey: number,
    arg0?: string | number | mod.Player,
    arg1?: string | number | mod.Player,
    arg2?: string | number | mod.Player
): void {
    const message = (arg0 === undefined)
        ? mod.Message(stringKey)
        : (arg1 === undefined)
            ? mod.Message(stringKey, arg0)
            : (arg2 === undefined)
                ? mod.Message(stringKey, arg0, arg1)
                : mod.Message(stringKey, arg0, arg1, arg2);
    sendHighlightedWorldLogMessage(message, true, undefined, stringKey);
}

function broadcastHighlightedStringKey(
    stringKey: number,
    arg0?: string | number | mod.Player,
    arg1?: string | number | mod.Player,
    arg2?: string | number | mod.Player
): void {
    const message = (arg0 === undefined)
        ? mod.Message(stringKey)
        : (arg1 === undefined)
            ? mod.Message(stringKey, arg0)
            : (arg2 === undefined)
                ? mod.Message(stringKey, arg0, arg1)
                : mod.Message(stringKey, arg0, arg1, arg2);
    sendHighlightedWorldLogMessage(message, false, undefined, stringKey);
}

// Commented out function:
//function broadcastNotificationMessage(message: mod.Message): void {
//    mod.DisplayNotificationMessage(message);
//}

type CleanupSpawnWaitResult = "completed" | "timeout" | "aborted";

function setCleanupState(active: boolean, allowDeploy: boolean): void {
    State.round.flow.cleanupActive = active;
    State.round.flow.cleanupAllowDeploy = allowDeploy;
    updateHelpTextVisibilityForAllPlayers();
}

// Stops all spawner activity and invalidates in-flight sequences before cleanup.
function quiesceSpawnerSystemForCleanup(): void {
    State.vehicles.spawnSequenceToken = (State.vehicles.spawnSequenceToken + 1) % 1000000000;
    State.vehicles.spawnSequenceInProgress = false;
    State.vehicles.activeSpawnSlotIndex = undefined;
    State.vehicles.activeSpawnToken = undefined;
    State.vehicles.activeSpawnRequestedAtSeconds = undefined;

    for (let i = 0; i < State.vehicles.slots.length; i++) {
        const slot = State.vehicles.slots[i];
        if (slot.enabled) {
            setSpawnerSlotEnabled(i, false);
        }
        slot.expectingSpawn = false;
        slot.spawnRetryScheduled = false;
        slot.respawnRunning = false;
    }
}

function resetSpawnerSlotStateForCleanup(): void {
    State.vehicles.vehicleToSlot = {};
    for (let i = 0; i < State.vehicles.slots.length; i++) {
        const slot = State.vehicles.slots[i];
        slot.vehicleId = -1;
        slot.expectingSpawn = false;
        slot.spawnRetryScheduled = false;
        slot.respawnRunning = false;
        slot.spawnRequestToken = 0;
        slot.spawnRequestAtSeconds = -1;
    }
}

function clearVehicleCachesForCleanup(): void {
    mod.SetVariable(regVehiclesTeam1, mod.EmptyArray());
    mod.SetVariable(regVehiclesTeam2, mod.EmptyArray());
    vehIds.length = 0;
    vehOwners.length = 0;
    clearSpawnBaseTeamCache();
}

function areCleanupSpawnsReady(): boolean {
    for (let i = 0; i < State.vehicles.slots.length; i++) {
        const slot = State.vehicles.slots[i];
        if (!slot.enabled) continue;
        if (slot.vehicleId === -1) return false;
    }
    return true;
}

// Cleanup gating: "quiescent" means no pending binds/respawns or active spawn sequences.
function isSpawnerSystemQuiescent(): boolean {
    if (State.vehicles.spawnSequenceInProgress) return false;
    if (State.vehicles.activeSpawnSlotIndex !== undefined) return false;
    if (State.vehicles.activeSpawnToken !== undefined) return false;
    if (State.vehicles.activeSpawnRequestedAtSeconds !== undefined) return false;

    for (let i = 0; i < State.vehicles.slots.length; i++) {
        const slot = State.vehicles.slots[i];
        if (slot.expectingSpawn) return false;
        if (slot.respawnRunning) return false;
        if (slot.spawnRetryScheduled) return false;
    }

    return true;
}

// Waits for slot IDs + quiescent spawner state, then stabilizes briefly to avoid late binds.
async function waitForCleanupSpawnsOrTimeout(expectedToken: number): Promise<CleanupSpawnWaitResult> {
    const startElapsed = Math.floor(mod.GetMatchTimeElapsed());
    while (true) {
        if (expectedToken !== State.round.flow.roundEndRedeployToken) return "aborted";
        if (!State.round.flow.cleanupActive) return "aborted";
        if (areCleanupSpawnsReady() && isSpawnerSystemQuiescent()) {
            await mod.Wait(0.5);
            if (areCleanupSpawnsReady() && isSpawnerSystemQuiescent()) return "completed";
        }

        const elapsed = Math.floor(mod.GetMatchTimeElapsed()) - startElapsed;
        if (elapsed >= ROUND_END_CLEANUP_SPAWN_TIMEOUT_SECONDS) return "timeout";

        await mod.Wait(0.5);
    }
}

// Round-end cleanup flow: lock -> quiesce -> destroy -> undeploy -> reset -> spawn -> wait/timeout -> deploy -> hold.
// State.round.flow.roundEndRedeployToken cancels older timers if a new round end is triggered before the delay completes.
async function scheduleRoundEndCleanup(expectedToken: number): Promise<void> {
    setCleanupState(true, false);
    mod.EnableAllPlayerDeploy(false);
    // Invariant: cleanupActive blocks deploy/UI until cleanupAllowDeploy flips after spawns are ready.

    await mod.Wait(ROUND_END_REDEPLOY_DELAY_SECONDS);

    if (expectedToken !== State.round.flow.roundEndRedeployToken) {
        return;
    }
    if (isRoundLive()) {
        return;
    }
    if (State.match.isEnded) {
        return;
    }

    quiesceSpawnerSystemForCleanup();

    const vehicles = mod.AllVehicles();
    const vCount = mod.CountOf(vehicles);
    for (let v = 0; v < vCount; v++) {
        const vehicle = mod.ValueInArray(vehicles, v) as mod.Vehicle;
        if (!vehicle) continue;
        try {
            mod.DealDamage(vehicle, 9999);
        } catch {
            // Disconnect-safe: avoid hard crash if vehicle invalidates mid-loop.
        }
    }

    await mod.Wait(3);

    // Per-player undeploy to avoid global redeploy side effects.
    const undeployedPlayers = mod.AllPlayers();
    const undeployCount = mod.CountOf(undeployedPlayers);
    for (let i = 0; i < undeployCount; i++) {
        const player = mod.ValueInArray(undeployedPlayers, i) as mod.Player;
        if (!player || !mod.IsPlayerValid(player)) continue;
        const pid = safeGetPlayerId(player);
        if (pid === undefined || isPidDisconnected(pid)) continue;
        try {
            mod.UndeployPlayer(player);
        } catch {
            continue;
        }
        State.players.deployedByPid[pid] = false;
        try {
            setUIInputModeForPlayer(player, false);
        } catch {
            // Ignore UI failures during cleanup.
        }
    }

    resetSpawnerSlotStateForCleanup();
    clearVehicleCachesForCleanup();

    applySpawnerEnablementForMatchup(State.round.matchupPresetIndex, true);

    const waitResult = await waitForCleanupSpawnsOrTimeout(expectedToken);
    if (waitResult === "timeout") {
        sendHighlightedWorldLogMessage(
            mod.Message(STR_ROUND_CLEANUP_SPAWN_TIMEOUT, ROUND_END_CLEANUP_SPAWN_TIMEOUT_SECONDS),
            true,
            undefined,
            STR_ROUND_CLEANUP_SPAWN_TIMEOUT
        );
    } else if (waitResult === "aborted") {
        return;
    }

    setCleanupState(true, true);
    mod.EnableAllPlayerDeploy(true);
    // Per-player deploy pass, then recheck for stragglers.
    await mod.Wait(0.1);

    let players = mod.AllPlayers();
    let pCount = mod.CountOf(players);
    for (let i = 0; i < pCount; i++) {
        const player = mod.ValueInArray(players, i) as mod.Player;
        if (!player || !mod.IsPlayerValid(player)) continue;
        const pid = safeGetPlayerId(player);
        if (pid === undefined || isPidDisconnected(pid)) continue;
        if (!isPlayerDeployed(player)) {
            try {
                mod.DeployPlayer(player);
            } catch {
                continue;
            }
        }
    }

    await mod.Wait(0.5);

    players = mod.AllPlayers();
    pCount = mod.CountOf(players);
    for (let i = 0; i < pCount; i++) {
        const player = mod.ValueInArray(players, i) as mod.Player;
        if (!player || !mod.IsPlayerValid(player)) continue;
        const pid = safeGetPlayerId(player);
        if (pid === undefined || isPidDisconnected(pid)) continue;
        if (!isPlayerDeployed(player)) {
            try {
                mod.DeployPlayer(player);
            } catch {
                continue;
            }
        }
    }

    await mod.Wait(ROUND_END_POST_DEPLOY_HOLD_SECONDS);

    if (expectedToken !== State.round.flow.roundEndRedeployToken) {
        return;
    }

    setRoundEndDialogVisibleForAllPlayers(false);
    setCleanupState(false, false);
}

// Manual reset flow (non-live only): run the same cleanup sequence used after round end,
// but without affecting scores or advancing the round counter.
function triggerFreshRoundSetup(triggerPlayer?: mod.Player): void {
    if (State.match.isEnded) return;
    if (isRoundLive()) return;
    if (State.round.flow.cleanupActive) return;

    // Ensure we are in a pre-round state and clear any round-end UI.
    State.round.phase = RoundPhase.NotReady;
    State.round.flow.roundEndUiLockdown = false;
    setRoundEndDialogVisibleForAllPlayers(false);

    // Reset ready state so the next setup requires fresh player confirmation.
    resetReadyStateForAllPlayers();

    // Clear overtime/tie-breaker state; the next round will re-evaluate eligibility.
    resetOvertimeFlagState();
    State.flag.tieBreakerEnabledThisRound = false;
    setOvertimeAllFlagVisibility(false);

    updateHelpTextVisibilityForAllPlayers();
    setRoundStateTextForAllPlayers();

    State.round.flow.roundEndRedeployToken = (State.round.flow.roundEndRedeployToken + 1) % 1000000000;
    const redeployToken = State.round.flow.roundEndRedeployToken;

    sendHighlightedWorldLogMessage(
        mod.Message(mod.stringkeys.twl.notifications.roundOverRedeploying, ROUND_END_REDEPLOY_DELAY_SECONDS),
        true,
        undefined,
        mod.stringkeys.twl.notifications.roundOverRedeploying
    );

    void scheduleRoundEndCleanup(redeployToken);
}

// Final-round flow: keep the round-end dialog visible for the normal 10s window, then hide it and show the Victory dialog for MATCH_END_DELAY_SECONDS.
// This uses State.match.flow.matchEndDelayToken as a cancellation token so admin actions or unexpected state changes cannot trigger stale delayed UI.
async function scheduleFinalRoundVictory(expectedToken: number, winningTeamNum: TeamID | 0): Promise<void> {
    await mod.Wait(ROUND_END_REDEPLOY_DELAY_SECONDS);

    if (expectedToken !== State.match.flow.matchEndDelayToken) {
        return;
    }
    if (!State.match.isEnded) {
        return;
    }

    // Hide the round-end dialog when the round-end window expires, even on the final round.
    setRoundEndDialogVisibleForAllPlayers(false);

    // Final-round exception: re-enable deploy without forcing respawn so Victory dialog is visible.
    if (isLiveRespawnDisabled()) {
        mod.EnableAllPlayerDeploy(true);
    }

    // Start the match-end victory flow only after the round-end window completes.
    State.match.victoryStartElapsedSecondsSnapshot = Math.floor(mod.GetMatchTimeElapsed());
    State.match.endElapsedSecondsSnapshot = State.match.victoryStartElapsedSecondsSnapshot;
    State.match.victoryDialogActive = true;
    State.round.clock.isPaused = false;
    State.round.clock.pausedRemainingSeconds = undefined;
    ResetRoundClock(MATCH_END_DELAY_SECONDS);
    updateVictoryDialogForAllPlayers(MATCH_END_DELAY_SECONDS);

    void scheduleMatchEnd(expectedToken, winningTeamNum);
}

async function scheduleMatchEnd(expectedToken: number, winningTeamNum?: TeamID | 0): Promise<void> {
    await mod.Wait(MATCH_END_DELAY_SECONDS);

    if (expectedToken !== State.match.flow.matchEndDelayToken) {
        return;
    }
    if (!State.match.isEnded) {
        return;
    }

    if (winningTeamNum !== undefined && winningTeamNum !== 0) {
        endGameModeForTeamNum(winningTeamNum);
        return;
    }

    mod.EndGameMode(mod.GetTeam(0));
}

function bindRoundClockExpiryToRoundEnd(): void {
    if (State.round.flow.clockExpiryBound) return;
    State.round.flow.clockExpiryBound = true;

    State.round.clock.expiryHandlers.push(() => {
        if (isRoundLive()) {
            const overtimeWinner = resolveOvertimeWinnerAtClockExpiry();
            // Undefined = neutral progress; endRound will fall back to round kills.
            endRound(undefined, undefined, overtimeWinner);
        }
    });
}

// Starts a new round using the current authoritative configuration.
// Invariants:
// - Resets per-round counters but preserves match-level totals
// - Initializes the round clock from ROUND_START_SECONDS
// - Sets round phase state used by HUD and end conditions

function startRound(_triggerPlayer?: mod.Player): void {
    if (State.match.isEnded) {
    // Steps:
    // 1) Reset round-scoped counters and flags
    // 2) Initialize the round clock from ROUND_START_SECONDS
    // 3) Push HUD/UI updates for the new round state

        return;
    }

    // Defensive cleanup: hide countdown UI if we are not currently running a countdown.
    // This preserves the GO display when startRound is triggered by the countdown itself.
    if (!State.round.countdown.isActive) {
        hidePregameCountdownForAllPlayers();
    }

    State.round.countdown.isRequested = false;
    bindRoundClockExpiryToRoundEnd();
    State.round.phase = RoundPhase.Live; // Enables scoring + LIVE HUD state.
    // Optional respawn lock: disable deploy during LIVE rounds when test toggle is on.
    if (isLiveRespawnDisabled()) {
        mod.EnableAllPlayerDeploy(false);
    }
    setSpawnDisabledLiveTextVisibleForAllPlayers(false);
    // Extends the built-in gamemode time limit so the match always has a full hour remaining after each round start.
    const elapsedSeconds = Math.floor(mod.GetMatchTimeElapsed());
    mod.SetGameModeTimeLimit(elapsedSeconds + BACKGROUND_TIME_LIMIT_RESET_SECONDS);
    setRoundStateTextForAllPlayers();
    updateHelpTextVisibilityForAllPlayers();
    setRoundEndDialogVisibleForAllPlayers(false);
    // Round start: release round-end UI lockdown so overtime HUD can prewarm.
    State.round.flow.roundEndUiLockdown = false;
    State.round.lastWinnerTeam = 0;
    State.round.lastEndDetailReason = RoundEndDetailReason.None;

    State.scores.t1RoundKills = 0;
    State.scores.t2RoundKills = 0;

    syncRoundKillsHud(true);
    refreshOvertimeZonesFromMapConfig();
    resetOvertimeFlagState();
    // Round start: decide if tie-breaker is enabled for this round before any flag setup.
    syncTieBreakerEnabledForCurrentRound();
    const helisSingleZone = isHelisOvertimeSingleZoneMode();
    if (isTieBreakerEnabledForRound()) {
        // Round start: preselect the overtime zone so we can track occupancy before activation.
        State.flag.trackingEnabled = selectOvertimeZoneForRound();
        prewarmOvertimeHudForAllPlayers();
        if (helisSingleZone) {
            enterOvertimeVisibleStageSilent();
        } else {
            // Round start: hide all flag markers until the half-time reveal.
            setOvertimeAllFlagVisibility(false);
        }
    } else {
        State.flag.trackingEnabled = false;
        setOvertimeAllFlagVisibility(false);
    }

    ResetRoundClock(getConfiguredRoundLengthSeconds());
    broadcastStringKey(mod.stringkeys.twl.notifications.roundStarted);
}

// Ends the current round and schedules transition to the next state.
// Notes:
// - Round end reason is determined before this call
// - Redeploy delay and next-round scheduling are time-based
// - Match end is handled separately and must not be triggered here

function endRound(_triggerPlayer?: mod.Player, freezeRemainingSeconds?: number, overrideWinnerTeamNum?: TeamID | 0): void {
    if (!isRoundLive()) {
    // Steps:
    // 1) Freeze round-live systems (no further scoring)
    // 2) Schedule redeploy / transition using ROUND_END_REDEPLOY_DELAY_SECONDS
    // 3) If match should end, hand off to match-end path (not round path)

        return;
    }
    const timeExpired = State.round.clock.expiryFired;
    const t1 = State.scores.t1RoundKills;
    const t2 = State.scores.t2RoundKills;
    const overtimeProgress = State.flag.progress;
    const overtimeConfigValid = State.flag.configValid;
    const progressNeutral = !overtimeConfigValid || Math.abs(overtimeProgress - 0.5) <= 0.0001;
    const progressFull = overtimeConfigValid && (overtimeProgress <= 0.0001 || overtimeProgress >= 0.9999);
    const killTargetReached = isRoundKillTargetReached();
    let endDetailReason = RoundEndDetailReason.None;

    if (killTargetReached) {
        endDetailReason = RoundEndDetailReason.Elimination;
    } else if (!timeExpired && progressFull) {
        endDetailReason = RoundEndDetailReason.ObjectiveCaptured;
    } else if (timeExpired && !progressNeutral) {
        endDetailReason = RoundEndDetailReason.TimeOverObjectiveProgress;
    } else if (timeExpired && t1 === t2) {
        endDetailReason = (t1 === 0)
            ? RoundEndDetailReason.TimeOverDrawNoAction
            : RoundEndDetailReason.TimeOverDrawEvenElims;
    } else if (timeExpired) {
        endDetailReason = RoundEndDetailReason.TimeOverKills;
    } else {
        endDetailReason = RoundEndDetailReason.Elimination;
    }
    State.round.lastEndDetailReason = endDetailReason;
    State.round.lastObjectiveProgress = overtimeProgress;

    State.round.phase = RoundPhase.NotReady; // Return to pre-round state; may be overridden to GameOver below.
    setSpawnDisabledLiveTextVisibleForAllPlayers(false);
    // Ready-cycle auto-start / reset:: round ended -> reset all players to NOT READY for the next ready-up cycle.
    resetReadyStateForAllPlayers();

    // Freeze display after ending the round.
    State.round.clock.isPaused = true;
    State.round.clock.pausedRemainingSeconds = Math.max(0, freezeRemainingSeconds !== undefined ? Math.floor(freezeRemainingSeconds) : 0);

    resetOvertimeFlagState();
    // Round end: hide tie-breaker markers until the next round decides eligibility.
    State.flag.tieBreakerEnabledThisRound = false;
    setOvertimeAllFlagVisibility(false);

    const winnerTeamNum = (overrideWinnerTeamNum !== undefined)
        ? overrideWinnerTeamNum
        : (t1 > t2 ? TeamID.Team1 : ((t2 > t1) ? TeamID.Team2 : 0));
    State.round.lastWinnerTeam = winnerTeamNum;
    updateRoundEndDialogForAllPlayers(winnerTeamNum);
    setRoundEndDialogVisibleForAllPlayers(true);
    // Lock overtime UI updates once the round-end dialog is shown.
    State.round.flow.roundEndUiLockdown = true;

    if (winnerTeamNum === TeamID.Team1) {
        const newT1Wins = State.match.winsT1 + 1;
        const newT2Wins = State.match.winsT2;
        setHudWinCountersForAllPlayers(newT1Wins, newT2Wins);
        broadcastStringKey(mod.stringkeys.twl.notifications.roundEndWin, getTeamNameKey(TeamID.Team1), t1, t2);
        broadcastHighlightedStringKey(mod.stringkeys.twl.notifications.roundWins, newT1Wins, newT2Wins);
    } else if (winnerTeamNum === TeamID.Team2) {
        const newT1Wins = State.match.winsT1;
        const newT2Wins = State.match.winsT2 + 1;
        setHudWinCountersForAllPlayers(newT1Wins, newT2Wins);
        broadcastStringKey(mod.stringkeys.twl.notifications.roundEndWin, getTeamNameKey(TeamID.Team2), t2, t1);
        broadcastHighlightedStringKey(mod.stringkeys.twl.notifications.roundWins, newT1Wins, newT2Wins);
    } else {
        State.match.tiesT1 = State.match.tiesT1 + 1;
        State.match.tiesT2 = State.match.tiesT2 + 1;
        syncRoundRecordHudForAllPlayers();
        broadcastStringKey(mod.stringkeys.twl.notifications.roundEndTie, t1, t2);
        broadcastHighlightedStringKey(mod.stringkeys.twl.notifications.roundWins, State.match.winsT1, State.match.winsT2);
    }

    // End match when a team reaches the required majority of wins.
    const winsNeeded = Math.floor(State.round.max / 2) + 1;
    if (State.round.max >= 1) {
        if (State.match.winsT1 >= winsNeeded) {
            State.match.isEnded = true;
            State.round.phase = RoundPhase.GameOver; // Locks HUD to GAME OVER and disables live scoring.
            updateHelpTextVisibilityForAllPlayers();
            setRoundStateTextForAllPlayers();
            State.match.winnerTeam = TeamID.Team1;
            State.match.flow.matchEndDelayToken = (State.match.flow.matchEndDelayToken + 1) % 1000000000;
            const matchEndToken = State.match.flow.matchEndDelayToken;
            void scheduleFinalRoundVictory(matchEndToken, TeamID.Team1);
            return;
        }
        if (State.match.winsT2 >= winsNeeded) {
            State.match.isEnded = true;
            State.round.phase = RoundPhase.GameOver; // Locks HUD to GAME OVER and disables live scoring.
            updateHelpTextVisibilityForAllPlayers();
            setRoundStateTextForAllPlayers();
            State.match.winnerTeam = TeamID.Team2;
            State.match.flow.matchEndDelayToken = (State.match.flow.matchEndDelayToken + 1) % 1000000000;
            const matchEndToken = State.match.flow.matchEndDelayToken;
            void scheduleFinalRoundVictory(matchEndToken, TeamID.Team2);
            return;
        }
    }    
    
    // Ends the match at max rounds by comparing wins; a tie remains a draw.
    // End match when the configured max rounds are completed without a majority winner.
    // Winner is decided by most rounds won; a tie remains a draw.
    if (State.round.max >= 1 && State.round.current >= State.round.max) {
        State.match.isEnded = true;
        State.round.phase = RoundPhase.GameOver; // Locks HUD to GAME OVER and disables live scoring.
        updateHelpTextVisibilityForAllPlayers();
        setRoundStateTextForAllPlayers();

        if (State.match.winsT1 > State.match.winsT2) {
            State.match.winnerTeam = TeamID.Team1;
            State.match.flow.matchEndDelayToken = (State.match.flow.matchEndDelayToken + 1) % 1000000000;
            const matchEndToken = State.match.flow.matchEndDelayToken;
            void scheduleFinalRoundVictory(matchEndToken, TeamID.Team1);
            return;
        }

        if (State.match.winsT2 > State.match.winsT1) {
            State.match.winnerTeam = TeamID.Team2;
            State.match.flow.matchEndDelayToken = (State.match.flow.matchEndDelayToken + 1) % 1000000000;
            const matchEndToken = State.match.flow.matchEndDelayToken;
            void scheduleFinalRoundVictory(matchEndToken, TeamID.Team2);
            return;
        }

        State.match.winnerTeam = undefined;
        State.match.flow.matchEndDelayToken = (State.match.flow.matchEndDelayToken + 1) % 1000000000;
        const matchEndToken = State.match.flow.matchEndDelayToken;
        void scheduleFinalRoundVictory(matchEndToken, 0);
        return;
    }

    State.round.flow.roundEndRedeployToken = (State.round.flow.roundEndRedeployToken + 1) % 1000000000;
    const redeployToken = State.round.flow.roundEndRedeployToken;

    sendHighlightedWorldLogMessage(
        mod.Message(mod.stringkeys.twl.notifications.roundOverRedeploying, ROUND_END_REDEPLOY_DELAY_SECONDS),
        true,
        undefined,
        mod.stringkeys.twl.notifications.roundOverRedeploying
    );
    void scheduleRoundEndCleanup(redeployToken);

    // Prepare next round counters after ending the active round.
    State.round.current = Math.floor(State.round.current) + 1;
    setHudRoundCountersForAllPlayers(State.round.current, State.round.max);
    setRoundStateTextForAllPlayers();
    updateHelpTextVisibilityForAllPlayers();
}

//#endregion ----------------- Round Start/End Flow + State --------------------
