// @ts-nocheck
// Module: conquest-flow -- continuous-live flow orchestration and phase-state helpers.

function bindClockExpiryForContinuousMode(): void {
    State.round.clock.expiryHandlers = [
        () => {
            endMatch(undefined, 0, 0);
        },
    ];
}

function startMatch(_triggerPlayer?: mod.Player): void {
    if (State.match.isEnded) return;
    if (isMatchLive()) return;

    bindClockExpiryForContinuousMode();

    State.round.countdown.isRequested = false;
    State.round.phase = MatchPhase.Live;
    State.match.isEnded = false;
    State.match.victoryDialogActive = false;
    State.match.winnerTeam = undefined;
    State.match.endElapsedSecondsSnapshot = 0;
    State.match.victoryStartElapsedSecondsSnapshot = 0;

    mod.EnableAllPlayerDeploy(true);

    setMatchStateTextForAllPlayers();
    updateHelpTextVisibilityForAllPlayers();
    updatePlayersReadyHudTextForAllPlayers();
    updateSettingsSummaryHudForAllPlayers();
    updateMatchupLabelForAllPlayers();
    updateMatchupReadoutsForAllPlayers();

    resetMatchClock(getConfiguredMatchLengthSeconds());
    updateAllPlayersClock();

    sendHighlightedWorldLogMessage(
        mod.Message(mod.stringkeys.twl.notifications.roundStarted),
        false,
        undefined,
        mod.stringkeys.twl.notifications.roundStarted
    );
}

function endMatch(_triggerPlayer?: mod.Player, _freezeRemainingSeconds?: number, overrideWinnerTeamNum?: TeamID | 0): void {
    if (State.match.victoryDialogActive) return;

    const winner = (overrideWinnerTeamNum === TeamID.Team1 || overrideWinnerTeamNum === TeamID.Team2)
        ? overrideWinnerTeamNum
        : 0;

    State.round.phase = MatchPhase.GameOver;
    State.match.isEnded = true;
    State.match.victoryDialogActive = true;
    State.match.winnerTeam = winner;
    State.match.endElapsedSecondsSnapshot = Math.floor(mod.GetMatchTimeElapsed());
    State.match.victoryStartElapsedSecondsSnapshot = Math.floor(mod.GetMatchTimeElapsed());
    State.round.clock.expiryFired = true;

    mod.EnableAllPlayerDeploy(true);

    setMatchStateTextForAllPlayers();
    updateHelpTextVisibilityForAllPlayers();
    updateVictoryDialogForAllPlayers(MATCH_END_DELAY_SECONDS);
    updateSettingsSummaryHudForAllPlayers();
    updateMatchupLabelForAllPlayers();
    updateMatchupReadoutsForAllPlayers();
}

function triggerFreshMatchSetup(_triggerPlayer?: mod.Player): void {
    if (State.match.isEnded) return;
    if (isMatchLive()) return;

    cancelPregameCountdown();
    resetReadyStateForAllPlayers();

    State.round.phase = MatchPhase.NotReady;

    State.match.victoryDialogActive = false;
    State.match.winnerTeam = undefined;
    State.match.endElapsedSecondsSnapshot = 0;
    State.match.victoryStartElapsedSecondsSnapshot = 0;

    setMatchClockPreview(getConfiguredMatchLengthSeconds());
    updateAllPlayersClock();
    setMatchStateTextForAllPlayers();
    updateHelpTextVisibilityForAllPlayers();
    updatePlayersReadyHudTextForAllPlayers();
    updateSettingsSummaryHudForAllPlayers();
    updateMatchupLabelForAllPlayers();
    updateMatchupReadoutsForAllPlayers();

    if (State.vehicles && State.vehicles.slots) {
        applySpawnerEnablementForMatchup(State.round.matchupPresetIndex, true);
    }
}

function clampMatchLengthSeconds(seconds: number): number {
    return Math.max(
        ADMIN_MATCH_LENGTH_MIN_SECONDS,
        Math.min(ADMIN_MATCH_LENGTH_MAX_SECONDS, Math.floor(seconds))
    );
}

function getConfiguredMatchLengthSeconds(): number {
    return clampMatchLengthSeconds(State.round.clock.matchLengthSeconds ?? ROUND_CLOCK_DEFAULT_SECONDS);
}

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
