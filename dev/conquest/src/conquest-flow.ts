// @ts-nocheck
// Module: conquest-flow -- continuous-live flow orchestration and phase-state helpers.

// Destroys all tracked vehicles in spawner slots using massive damage so the destruction animation plays.
function destroyAllTrackedVehicles(): void {
    if (!State.vehicles?.slots) return;
    for (let i = 0; i < State.vehicles.slots.length; i++) {
        const slot = State.vehicles.slots[i];
        if (!slot.enabled || slot.vehicleId === -1) continue;
        const vehicle = findVehicleById(slot.vehicleId);
        if (vehicle) {
            try { mod.DealDamage(vehicle, 9999); } catch {}
        }
        slot.vehicleId = -1;
    }
}

// Force-spawns all enabled vehicle slots that currently have no live vehicle.
// Uses the same sequential spawn pipeline as the normal deploy flow so that
// each vehicle is bound, token-tracked, and teleported to its correct orientation.
function forceSpawnAllReadyVehicleSlots(): void {
    if (!State.vehicles?.slots) return;
    const indices: number[] = [];
    for (let i = 0; i < State.vehicles.slots.length; i++) {
        const slot = State.vehicles.slots[i];
        if (!slot.enabled || slot.vehicleId !== -1) continue;
        indices.push(i);
    }
    if (indices.length === 0) return;
    State.vehicles.spawnSequenceToken = (State.vehicles.spawnSequenceToken ?? 0) + 1;
    State.vehicles.spawnSequenceInProgress = true;
    void runSequentialSpawns(indices, State.vehicles.spawnSequenceToken);
}

// Binds clock expiry to Conquest end-condition checks for continuous live flow.
function bindClockExpiryForContinuousMode(): void {
    State.round.clock.expiryHandlers = [
        () => {
            conquestPhase2ACheckEndCondition();
        },
    ];
}

// Starts a live Conquest round from pre-live state and refreshes all major HUD/readout lanes.
function startMatch(_triggerPlayer?: mod.Player): void {
    if (State.match.isEnded) return;
    if (isMatchLive()) return;

    bindClockExpiryForContinuousMode();

    State.round.countdown.isRequested = false;
    kpiResetAll();
    kpiSnapshotDeathBaselines();
    lifecycleSetLiveBaseline("pregame-start-match");
    cleanupMainBaseTeamWorldIconsForLiveTransition();
    clearActiveBoundaryViolationsForAllPlayers();
    updateReadyDialogModeConfigForAllHiddenBuiltCaches();
    updateReadyToggleButtonsForAllBuiltReadyDialogs();
    conquestPhase2AResetLiveState();
    conquestPhase2BOnMatchLiveStart();
    conquestPhase4OnMatchLiveStart();
    conquestPhase4BOnMatchLiveStart();

    mod.EnableAllPlayerDeploy(true);

    setMatchStateTextForAllPlayers();
    updateHelpTextVisibilityForAllPlayers();
    updatePlayersReadyHudTextForAllPlayers();
    updateHudTeamSwapButtonVisibilityForAllPlayers();
    updateReadyDialogModeConfigForAllVisibleViewers();
    updateVehicleDeployTimerHudForAllPlayers();
    refreshBoundaryStateForAllPlayers();

    resetMatchClock(getConfiguredMatchLengthSeconds());
    updateAllPlayersClock();

    sendHighlightedWorldLogMessage(
        mod.Message(mod.stringkeys.twl.notifications.roundStarted),
        false,
        undefined,
        mod.stringkeys.twl.notifications.roundStarted
    );
}

// Ends the current round using one authoritative post-match transition and winner snapshot.
function endMatch(_triggerPlayer?: mod.Player, _freezeRemainingSeconds?: number, overrideWinnerTeamNum?: TeamID | 0): void {
    clearAllVehicleReservations();
    // Determine winner: use explicit override if provided, otherwise infer from ticket counts.
    let winner: TeamID | 0;
    if (overrideWinnerTeamNum === TeamID.Team1 || overrideWinnerTeamNum === TeamID.Team2) {
        winner = overrideWinnerTeamNum;
    } else {
        const t1 = State.conquest.tickets.team1;
        const t2 = State.conquest.tickets.team2;
        winner = t1 > t2 ? TeamID.Team1 : t2 > t1 ? TeamID.Team2 : 0;
    }

    if (!State.conquest.endRace.endLatched) {
        State.conquest.lifecyclePhase = "POST_MATCH";
        State.conquest.endRace.endLatched = true;
        State.conquest.endRace.endReason = "admin";
        State.conquest.endRace.endSnapshot = {
            team1Tickets: State.conquest.tickets.team1,
            team2Tickets: State.conquest.tickets.team2,
            elapsedSeconds: Math.floor(mod.GetMatchTimeElapsed()),
            winnerTeam: winner,
        };
    }

    if (!lifecycleTrySetGameOver("pregame-end-match", winner)) return;
    clearActiveBoundaryViolationsForAllPlayers();
    updateReadyDialogModeConfigForAllHiddenBuiltCaches();
    updateReadyToggleButtonsForAllBuiltReadyDialogs();
    State.round.clock.expiryFired = true;

    mod.EnableAllPlayerDeploy(true);

    setMatchStateTextForAllPlayers();
    updateHelpTextVisibilityForAllPlayers();
    updateVictoryDialogForAllPlayers(MATCH_END_DELAY_SECONDS);
    updateReadyDialogModeConfigForAllVisibleViewers();
    updateVehicleDeployTimerHudForAllPlayers();
}

// Resets pre-live systems for a fresh setup pass without entering live state.
function triggerFreshMatchSetup(_triggerPlayer?: mod.Player): void {
    if (State.match.isEnded) return;
    if (isMatchLive()) return;

    cancelPregameCountdown();
    resetReadyStateForAllPlayers();

    lifecycleSetNotReadyBaseline("fresh-setup");
    kpiResetAll();
    kpiSnapshotDeathBaselines();
    clearActiveBoundaryViolationsForAllPlayers();
    updateReadyDialogModeConfigForAllHiddenBuiltCaches();
    updateReadyToggleButtonsForAllBuiltReadyDialogs();
    conquestPhase2AResetNotLiveState();
    conquestPhase2BOnNotLiveReset();
    conquestPhase4OnNotLiveReset();
    conquestPhase4BOnNotLiveReset();

    setMatchClockPreview(getConfiguredMatchLengthSeconds());
    updateAllPlayersClock();
    setMatchStateTextForAllPlayers();
    updateHelpTextVisibilityForAllPlayers();
    updatePlayersReadyHudTextForAllPlayers();
    updateHudTeamSwapButtonVisibilityForAllPlayers();
    updateReadyDialogModeConfigForAllVisibleViewers();

    if (State.vehicles && State.vehicles.slots) {
        applySpawnerEnablementForMatchup(State.round.matchupPresetIndex, true);
    }
    updateVehicleDeployTimerHudForAllPlayers();
    refreshBoundaryStateForAllPlayers();
}

// Clamps configured match length to admin-safe limits.
function clampMatchLengthSeconds(seconds: number): number {
    return Math.max(
        ADMIN_MATCH_LENGTH_MIN_SECONDS,
        Math.min(ADMIN_MATCH_LENGTH_MAX_SECONDS, Math.floor(seconds))
    );
}

// Returns the current configured round length with admin bounds enforced.
function getConfiguredMatchLengthSeconds(): number {
    return clampMatchLengthSeconds(State.round.clock.matchLengthSeconds ?? ROUND_CLOCK_DEFAULT_SECONDS);
}

// Refreshes admin match-length labels for all connected players.
function syncAdminMatchLengthLabelForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    const totalSeconds = getConfiguredMatchLengthSeconds();
    const time = getClockTimeParts(totalSeconds);
    const label = mod.Message(
        mod.stringkeys.twl.adminPanel.labels.roundLengthFormat,
        time.minutes,
        time.secTens,
        time.secOnes
    );

    for (let i = 0; i < count; i++) {
        const player = mod.ValueInArray(players, i) as mod.Player;
        if (!player || !mod.IsPlayerValid(player)) continue;
        const pid = safeGetPlayerId(player);
        if (pid === undefined || isPidDisconnected(pid)) continue;
        const widget = safeFind(UI_ADMIN_MATCH_LENGTH_LABEL_ID + pid);
        safeSetUITextLabel(widget, label);
    }
}

// Persistent diagnostic counter widget in the admin panel. Reads the latest three numbers stored in
// State.conquest.debug.worldIconDiagP0/P1/P2 and pushes them to every viewer's widget. Current use:
// FEATURE_WORLD_ICON_DIAG surfaces (pid, objId, +total/-total) on each World Icon spawn/destroy so
// MP playtests can see per-player counts without transient messages.
function syncDiagCounterForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    const label = mod.Message(
        mod.stringkeys.twl.adminPanel.labels.cq52CounterFormat,
        State.conquest.debug.worldIconDiagP0 || 0,
        State.conquest.debug.worldIconDiagP1 || 0,
        State.conquest.debug.worldIconDiagP2 || 0
    );

    for (let i = 0; i < count; i++) {
        const player = mod.ValueInArray(players, i) as mod.Player;
        if (!player || !mod.IsPlayerValid(player)) continue;
        const pid = safeGetPlayerId(player);
        if (pid === undefined || isPidDisconnected(pid)) continue;
        const widget = safeFind(UI_ADMIN_CQ52_COUNTER_ID + pid);
        safeSetUITextLabel(widget, label);
    }
}

