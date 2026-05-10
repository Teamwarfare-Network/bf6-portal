// @ts-nocheck
// Module: ready-dialog/countdown-flow -- countdown execution, cancellation, and live-start sequencing

//#region -------------------- Ready Dialog - Pregame Countdown Flow --------------------

function cancelPregameCountdown(): void {
    if (!State.round.countdown.isActive) return;
    State.round.countdown.token++;
    State.round.countdown.isActive = false;
    State.round.countdown.isRequested = false;
    hidePregameCountdownForAllPlayers();
    // Restore pre-countdown state so players can ready up again.
    State.conquest.lifecyclePhase = "NOT_READY";
    mod.EnableAllPlayerDeploy(true);
    updateHudTeamSwapButtonVisibilityForAllPlayers();
    updateVehicleDeployTimerHudForAllPlayers();
}

// Undeploys all currently deployed players for countdown lockout.
// Spectator exception: the spec stays deployed so their Fixed-camera view of the countdown
// is uninterrupted. The body remains parked in the underground hide room; the subsequent
// EnableAllPlayerDeploy(false) only blocks NEW deploys, not currently-deployed players, so
// the spec is unaffected by the gate.
function undeployAllDeployedPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    const specPid = State.players.spectatorPid;
    for (let i = 0; i < count; i++) {
        const player = mod.ValueInArray(players, i) as mod.Player;
        if (!isValidPlayer(player)) continue;
        if (!isPlayerDeployed(player)) continue;
        if (specPid !== null && safeGetPlayerId(player) === specPid) continue;
        try { mod.UndeployPlayer(player); } catch {}
    }
}

// Starts the pregame countdown: undeploys all, destroys vehicles, disables deploy, then launches async countdown.
function startPregameCountdown(triggerPlayer?: mod.Player, force?: boolean): void {
    if (State.round.countdown.isActive) return;
    if (State.match.isEnded || isMatchLive()) return;
    if (!force && !areAllActivePlayersReady()) return;

    closeReadyDialogForAllPlayers();
    State.conquest.lifecyclePhase = "COUNTDOWN";
    updateVehicleDeployTimerHudForAllPlayers();
    updateHudTeamSwapButtonVisibilityForAllPlayers();
    undeployAllDeployedPlayers();
    mod.EnableAllPlayerDeploy(false);
    invalidateCountdownWidgetCacheForAllPlayers();
    // Sink + damage every pre-countdown vehicle and respawn the live-round fleet DURING the
    // countdown so vehicles are bound and positioned before the "LIVE!" banner fades.
    void resetVehicleSlotsAtCountdownStart();

    State.round.countdown.isActive = true;
    State.round.countdown.isRequested = true;
    State.round.countdown.token++;
    const expectedToken = State.round.countdown.token;

    void runPregameCountdown(expectedToken, triggerPlayer, force === true);
}

// Validates whether countdown execution should continue for the expected token/state.
function isPregameCountdownStillValid(expectedToken: number, force?: boolean, allowRoundActive?: boolean): boolean {
    if (expectedToken !== State.round.countdown.token) return false;
    if (State.match.isEnded) return false;
    if (!allowRoundActive && isMatchLive()) return false;
    // v1.474 (CQ_Bug_115): ready-state no longer cancels the countdown. Once started, only admin
    // reset (token mismatch via cancelPregameCountdown) or match-end can abort. Late-joiners with
    // undefined readyByPid previously cancelled it; the bail paths leak EnableAllPlayerDeploy(false)
    // → all watchers locked out.
    return true;
}

// Returns countdown digit color: red for >10, yellow for 10-1 (green reserved for LIVE).
function getPregameCountdownColor(value: number): mod.Vector {
    return value > 10 ? mod.CreateVector(1, 0, 0) : mod.CreateVector(1, 1, 0);
}

async function animatePregameCountdownSize(
    expectedToken: number,
    force: boolean,
    startSize: number,
    endSize: number,
    allowRoundActive?: boolean
): Promise<boolean> {
    const stepSeconds = PREGAME_COUNTDOWN_STEP_SECONDS / PREGAME_COUNTDOWN_ANIMATION_STEPS;
    for (let i = 1; i <= PREGAME_COUNTDOWN_ANIMATION_STEPS; i++) {
        await mod.Wait(stepSeconds);
        if (!isPregameCountdownStillValid(expectedToken, force, allowRoundActive)) return false;
        const t = i / PREGAME_COUNTDOWN_ANIMATION_STEPS;
        const size = Math.max(1, Math.floor(startSize + (endSize - startSize) * t));
        setPregameCountdownSizeForAllPlayers(size);
    }
    return true;
}

async function runPregameCountdown(expectedToken: number, triggerPlayer?: mod.Player, force?: boolean): Promise<void> {
    await mod.Wait(PREGAME_COUNTDOWN_INITIAL_DELAY_SECONDS);

    if (!isPregameCountdownStillValid(expectedToken, force)) {
        State.round.countdown.isActive = false;
        hidePregameCountdownForAllPlayers();
        return;
    }

    // Staggered delay-info lines: first shows immediately, second at +3s, third & fourth at +6s.
    // Assumes PREGAME_COUNTDOWN_START_NUMBER >= 10 so all four lines get meaningful display time.
    // Lines are gated by confirmed deploy method: line 0 (aircraft HQ) if method >= HQ, line 1 (air deploy) if HQ_FORWARD_AIR, line 2 (forward) if method >= HQ_FORWARD, line 3 (gadgets) only when Supply Boxes is enabled.
    const countdownDeployMethod = State.round.modeConfig.confirmed.vehicleDeployMethod ?? VEHICLE_DEPLOY_METHOD_DEFAULT;
    if (countdownDeployMethod >= VEHICLE_DEPLOY_METHOD_HQ) showPregameCountdownDelayLineForAllPlayers(0);

    for (let value = PREGAME_COUNTDOWN_START_NUMBER; value >= 1; value--) {
        // v1.329: gate on the orthogonal airDeployEnabled checkbox instead of the legacy HQ_FORWARD_AIR enum tier.
        if (value === PREGAME_COUNTDOWN_START_NUMBER - 3 && State.round.modeConfig.confirmed.airDeployEnabled === true) showPregameCountdownDelayLineForAllPlayers(1);
        if (value === PREGAME_COUNTDOWN_START_NUMBER - 6) {
            // v1.328: gate on the orthogonal checkbox instead of the legacy HQ_FORWARD enum tier.
            if (State.round.modeConfig.confirmed.forwardDeployEnabled === true) showPregameCountdownDelayLineForAllPlayers(2);
            if (isSupplyBoxesEnabled()) showPregameCountdownDelayLineForAllPlayers(3);
        }
        if (!isPregameCountdownStillValid(expectedToken, force)) {
            State.round.countdown.isActive = false;
            hidePregameCountdownForAllPlayers();
            return;
        }

        setPregameCountdownVisualForAllPlayers(
            mod.stringkeys.twl.countdown.format,
            value,
            getPregameCountdownColor(value),
            PREGAME_COUNTDOWN_SIZE_DIGIT_START,
            true
        );

        const ok = await animatePregameCountdownSize(
            expectedToken,
            force === true,
            PREGAME_COUNTDOWN_SIZE_DIGIT_START,
            PREGAME_COUNTDOWN_SIZE_DIGIT_END
        );
        if (!ok) {
            State.round.countdown.isActive = false;
            hidePregameCountdownForAllPlayers();
            return;
        }
    }

    if (!isPregameCountdownStillValid(expectedToken, force)) {
        State.round.countdown.isActive = false;
        hidePregameCountdownForAllPlayers();
        return;
    }

    // LIVE! transition: pop-in text, then enable deploy and start match.
    // No shrink animation — startMatch triggers heavy HUD refresh work that causes stutter during animation.
    setPregameCountdownVisualForAllPlayers(
        mod.stringkeys.twl.countdown.live,
        undefined,
        mod.CreateVector(0, 1, 0),
        PREGAME_COUNTDOWN_SIZE_LIVE_START,
        true
    );
    mod.EnableAllPlayerDeploy(true);
    startMatch(triggerPlayer);

    await mod.Wait(PREGAME_COUNTDOWN_LIVE_HOLD_SECONDS);
    if (expectedToken !== State.round.countdown.token) return;

    hidePregameCountdownForAllPlayers();
    State.round.countdown.isActive = false;

    await mod.Wait(1);
}

//#endregion -------------------- Ready Dialog - Pregame Countdown Flow --------------------

