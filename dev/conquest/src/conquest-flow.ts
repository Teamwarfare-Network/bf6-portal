// @ts-nocheck
// Module: conquest-flow -- continuous-live flow orchestration and phase-state helpers.

// Force-spawns all enabled vehicle slots that currently have no live vehicle by
// re-applying matchup enablement; vanilla-spawner's mutex serializes the chain.
function forceSpawnAllReadyVehicleSlots(): void {
    if (!State.vehicles?.slots) return;
    applySpawnerEnablementForMatchup(State.round.matchupPresetIndex, true);
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
    State.round.liveStartedAtSeconds = Math.floor(mod.GetMatchTimeElapsed());
    cleanupMainBaseTeamWorldIconsForLiveTransition();
    refreshDisableOnLiveInteractableStateForLiveTransition();
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
    void runRoundStartDelayHudLoop();
    refreshBoundaryStateForAllPlayers();

    resetMatchClock(getConfiguredMatchLengthSeconds());
    updateAllPlayersClock();

    sendHighlightedWorldLogMessage(
        msg(mod.stringkeys.twl.notifications.roundStarted),
        false,
        undefined,
        mod.stringkeys.twl.notifications.roundStarted
    );
}

// Ends the current round using one authoritative post-match transition and winner snapshot.
function endMatch(_triggerPlayer?: mod.Player, _freezeRemainingSeconds?: number, overrideWinnerTeamNum?: TeamID | 0): void {
    State.round.liveStartedAtSeconds = undefined;
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
    // Stop the countdown so onSecond no longer fires into a tearing-down UI.
    try { State.round.clock.countdown?.pause(); } catch {}

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
    State.round.liveStartedAtSeconds = undefined;
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
    const totalSeconds = getConfiguredMatchLengthSeconds();
    const time = getClockTimeParts(totalSeconds);
    const label = msg(
        mod.stringkeys.twl.adminPanel.labels.roundLengthFormat,
        time.minutes,
        time.secTens,
        time.secOnes
    );
    forEachValidPlayer((_player, pid) => {
        if (isPidDisconnected(pid)) return;
        const widget = safeFind(UI_ADMIN_MATCH_LENGTH_LABEL_ID + pid);
        safeSetUITextLabel(widget, label);
    });
}

