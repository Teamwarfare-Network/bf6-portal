// @ts-nocheck
// Module: ready-dialog/countdown-flow -- countdown execution, cancellation, and live-start sequencing

//#region -------------------- Ready Dialog - Pregame Countdown Flow --------------------

function startPregameCountdown(triggerPlayer?: mod.Player, force?: boolean): void {
    if (State.round.countdown.isActive) return;
    if (State.match.isEnded || isRoundLive()) return;
    if (!force && !areAllActivePlayersReady()) return;

    closeReadyDialogForAllPlayers();
    State.round.countdown.isActive = true;
    State.round.countdown.isRequested = true;
    State.round.countdown.token++;
    const expectedToken = State.round.countdown.token;

    void runPregameCountdown(expectedToken, triggerPlayer, force === true);
}

function isPregameCountdownStillValid(expectedToken: number, force?: boolean, allowRoundActive?: boolean): boolean {
    if (expectedToken !== State.round.countdown.token) return false;
    if (State.match.isEnded) return false;
    if (!allowRoundActive && isRoundLive()) return false;
    if (!force && !areAllActivePlayersReady()) return false;
    return true;
}

function getPregameCountdownColor(value: number): mod.Vector {
    return value === 1 ? mod.CreateVector(1, 1, 0) : mod.CreateVector(1, 0, 0);
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

    for (let value = PREGAME_COUNTDOWN_START_NUMBER; value >= 1; value--) {
        if (!isPregameCountdownStillValid(expectedToken, force)) {
            State.round.countdown.isActive = false;
            hidePregameCountdownForAllPlayers();
            return;
        }

        if (value === 4) {
            // Start the round-start messaging so it ends with the GO hide.
            const remainingSeconds = ((value + 1) * PREGAME_COUNTDOWN_STEP_SECONDS) + PREGAME_COUNTDOWN_GO_HOLD_SECONDS;
            void showRoundStartMessageForAllPlayers(remainingSeconds);
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

    setPregameCountdownVisualForAllPlayers(
        mod.stringkeys.twl.countdown.go,
        undefined,
        mod.CreateVector(0, 1, 0),
        PREGAME_COUNTDOWN_SIZE_GO_START,
        true
    );
    startRound(triggerPlayer);

    const ok = await animatePregameCountdownSize(
        expectedToken,
        force === true,
        PREGAME_COUNTDOWN_SIZE_GO_START,
        PREGAME_COUNTDOWN_SIZE_GO_END,
        true
    );
    if (!ok || expectedToken !== State.round.countdown.token) {
        // If the animation aborted, hide immediately to avoid a stuck GO.
        if (expectedToken === State.round.countdown.token) {
            hidePregameCountdownForAllPlayers();
            State.round.countdown.isActive = false;
        }
        return;
    }

    // Keep GO visible for a short hold to finish the visual beat (unpredictable repro issues).
    if (State.match.isEnded) {
        hidePregameCountdownForAllPlayers();
        State.round.countdown.isActive = false;
        return;
    }

    await mod.Wait(PREGAME_COUNTDOWN_GO_HOLD_SECONDS);
    if (expectedToken !== State.round.countdown.token) return;

    hidePregameCountdownForAllPlayers();
    State.round.countdown.isActive = false;

    await mod.Wait(1);
}

//#endregion -------------------- Ready Dialog - Pregame Countdown Flow --------------------
