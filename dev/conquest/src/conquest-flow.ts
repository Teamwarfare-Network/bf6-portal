// @ts-nocheck
// Module: conquest-flow -- continuous-live flow + overtime/round-flow compatibility shims.

function bindClockExpiryForContinuousMode(): void {
    State.round.clock.expiryHandlers = [
        () => {
            endRound(undefined, 0, 0);
        },
    ];
}

function startRound(_triggerPlayer?: mod.Player): void {
    if (State.match.isEnded) return;
    if (isRoundLive()) return;

    bindClockExpiryForContinuousMode();

    State.round.countdown.isRequested = false;
    State.round.phase = RoundPhase.Live;
    State.round.flow.roundEndUiLockdown = false;
    State.match.isEnded = false;
    State.match.victoryDialogActive = false;
    State.match.winnerTeam = undefined;
    State.match.victoryStartElapsedSecondsSnapshot = 0;

    mod.EnableAllPlayerDeploy(true);

    setRoundStateTextForAllPlayers();
    updateHelpTextVisibilityForAllPlayers();
    updatePlayersReadyHudTextForAllPlayers();
    updateSettingsSummaryHudForAllPlayers();
    updateMatchupLabelForAllPlayers();
    updateMatchupReadoutsForAllPlayers();

    ResetRoundClock(getConfiguredRoundLengthSeconds());
    updateAllPlayersClock();

    sendHighlightedWorldLogMessage(
        mod.Message(mod.stringkeys.twl.notifications.roundStarted),
        false,
        undefined,
        mod.stringkeys.twl.notifications.roundStarted
    );
}

function endRound(_triggerPlayer?: mod.Player, _freezeRemainingSeconds?: number, overrideWinnerTeamNum?: TeamID | 0): void {
    if (State.match.victoryDialogActive) return;

    const winner = (overrideWinnerTeamNum === TeamID.Team1 || overrideWinnerTeamNum === TeamID.Team2)
        ? overrideWinnerTeamNum
        : 0;

    State.round.phase = RoundPhase.GameOver;
    State.round.flow.roundEndUiLockdown = true;
    State.match.isEnded = true;
    State.match.victoryDialogActive = true;
    State.match.winnerTeam = winner;
    State.match.victoryStartElapsedSecondsSnapshot = Math.floor(mod.GetMatchTimeElapsed());
    State.round.clock.expiryFired = true;

    mod.EnableAllPlayerDeploy(true);

    setRoundStateTextForAllPlayers();
    updateHelpTextVisibilityForAllPlayers();
    updateVictoryDialogForAllPlayers(MATCH_END_DELAY_SECONDS);
    updateSettingsSummaryHudForAllPlayers();
    updateMatchupLabelForAllPlayers();
    updateMatchupReadoutsForAllPlayers();
}

function triggerFreshRoundSetup(_triggerPlayer?: mod.Player): void {
    if (State.match.isEnded) return;
    if (isRoundLive()) return;

    cancelPregameCountdown();
    resetReadyStateForAllPlayers();

    State.round.phase = RoundPhase.NotReady;
    State.round.lastWinnerTeam = 0;
    State.round.lastEndDetailReason = RoundEndDetailReason.None;
    State.round.lastObjectiveProgress = 0.5;
    State.round.flow.roundEndUiLockdown = false;

    State.match.victoryDialogActive = false;
    State.match.winnerTeam = undefined;
    State.match.victoryStartElapsedSecondsSnapshot = 0;

    setRoundClockPreview(getConfiguredRoundLengthSeconds());
    updateAllPlayersClock();
    setRoundStateTextForAllPlayers();
    updateHelpTextVisibilityForAllPlayers();
    updatePlayersReadyHudTextForAllPlayers();
    updateSettingsSummaryHudForAllPlayers();
    updateMatchupLabelForAllPlayers();
    updateMatchupReadoutsForAllPlayers();

    if (State.vehicles && State.vehicles.slots) {
        applySpawnerEnablementForMatchup(State.round.matchupPresetIndex, true);
    }
}

// Compatibility shim: map/config pathways still invoke this hook.
// Conquest cut keeps overtime disabled, so this intentionally no-ops.
function refreshOvertimeZonesFromMapConfig(): void { return; }

function clampRoundLengthSeconds(seconds: number): number {
    return Math.max(
        ADMIN_ROUND_LENGTH_MIN_SECONDS,
        Math.min(ADMIN_ROUND_LENGTH_MAX_SECONDS, Math.floor(seconds))
    );
}

function getConfiguredRoundLengthSeconds(): number {
    return clampRoundLengthSeconds(State.round.clock.roundLengthSeconds ?? ROUND_CLOCK_DEFAULT_SECONDS);
}

function syncAdminRoundLengthLabelForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    const totalSeconds = getConfiguredRoundLengthSeconds();
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
        const widget = safeFind(UI_ADMIN_ROUND_LENGTH_LABEL_ID + pid);
        safeSetUITextLabel(widget, label);
    }
}
