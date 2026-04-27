// @ts-nocheck
// Module: clock/state -- clock runtime state, reset, tick update, and duration adjustment

//#region -------------------- Match Clock - Update + State --------------------

// ClockWidgetCacheEntry:
// Caches all UI widget references required to render the match clock for one player.
// This prevents repeated FindUIWidget calls during clock updates (performance critical).
// Lifecycle:
// - Created once per player by ensureClockUIAndGetCache.
// - Reused on every clock tick.
// - Safe to discard if HUD is rebuilt (will be recreated).
interface ClockWidgetCacheEntry {
    root: mod.UIWidget;
    rootName: string;
    surfaceName: string;
    roundStateRootName: string;
    plate: mod.UIWidget;
    minTensShadow?: mod.UIWidget;
    roundStateText?: mod.UIWidget;
    playersReadyText?: mod.UIWidget;
    minTens: mod.UIWidget;
    minOnesShadow?: mod.UIWidget;
    minOnes: mod.UIWidget;
    colonShadow?: mod.UIWidget;
    colon: mod.UIWidget;
    secTensShadow?: mod.UIWidget;
    secTens: mod.UIWidget;
    secOnesShadow?: mod.UIWidget;
    secOnes: mod.UIWidget;
    lastVisibleState?: boolean;
    lastDisplayedSeconds?: number;
}

// Drives HUD repaint from the countdown's drift-corrected integer-second tick.
// Keeps pausedRemainingSeconds shadow in sync for external readers (capture-tickets
// viewmodel, interaction/actions local render path).
function onClockSecond(currentSeconds: number): void {
    try {
        if (State.round.clock.isPaused) {
            State.round.clock.pausedRemainingSeconds = Math.max(0, Math.floor(currentSeconds));
        }
        updateAllPlayersClock();
    } catch {}
}

// Fires registered expiry handlers exactly once when the countdown reaches zero.
// endMatch() sets expiryFired=true directly to prevent re-entry during match end.
function onClockComplete(): void {
    try {
        if (State.round.clock.expiryFired) return;
        State.round.clock.expiryFired = true;
        for (let i = 0; i < State.round.clock.expiryHandlers.length; i++) {
            try { State.round.clock.expiryHandlers[i](); } catch {}
        }
        updateAllPlayersClock();
    } catch {}
}

// Resets live clock runtime to the provided duration and clears pause/expiry markers.
// Allocates a fresh Clocks.CountDownClock and starts it; onSecond drives per-player paint.
function resetMatchClock(seconds: number): void {
    const clampedSeconds = Math.max(0, Math.floor(seconds));

    State.round.clock.countdown = new Clocks.CountDownClock(clampedSeconds, {
        onSecond: onClockSecond,
        onComplete: onClockComplete,
    });
    State.round.clock.countdown.start();

    State.round.clock.durationSeconds = clampedSeconds;
    State.round.clock.matchLengthSeconds = clampedSeconds;
    State.round.clock.matchStartElapsedSeconds = Math.floor(mod.GetMatchTimeElapsed());

    State.round.clock.isPaused = false;
    State.round.clock.pausedRemainingSeconds = undefined;

    State.round.clock.expiryFired = false;
    State.round.clock.lastDisplayedSeconds = undefined;
    State.round.clock.lastLowTimeState = undefined;
}

// Sets a paused pre-live clock preview. Allocates a countdown but does NOT start it;
// isPaused=!isRunning&&!isComplete returns true, and .seconds returns the full duration.
function setMatchClockPreview(seconds: number): void {
    const clampedSeconds = clampMatchLengthSeconds(seconds);

    State.round.clock.countdown = new Clocks.CountDownClock(clampedSeconds, {
        onSecond: onClockSecond,
        onComplete: onClockComplete,
    });

    State.round.clock.durationSeconds = clampedSeconds;
    State.round.clock.matchLengthSeconds = clampedSeconds;
    State.round.clock.matchStartElapsedSeconds = undefined;
    State.round.clock.isPaused = true;
    State.round.clock.pausedRemainingSeconds = clampedSeconds;
    State.round.clock.expiryFired = false;
    State.round.clock.lastDisplayedSeconds = undefined;
    State.round.clock.lastLowTimeState = undefined;
}

// Returns current remaining seconds as integer (floor) from the countdown.
// Falls back to paused shadow for early-boot state where countdown is not yet initialized.
function getRemainingSeconds(): number {
    const countdown = State.round.clock.countdown;
    if (countdown) return Math.max(0, Math.floor(countdown.seconds));

    if (State.round.clock.isPaused) {
        return Math.max(0, State.round.clock.pausedRemainingSeconds !== undefined ? State.round.clock.pausedRemainingSeconds : 0);
    }
    return 0;
}

// Final-minute color pulse is second-boundary based, so sub-second clock updates are unnecessary.
function shouldClockUseCriticalFlashSubtick(): boolean {
    return false;
}

// Alternates between red and white in lockstep with the displayed remaining second.
function isClockCriticalColorPulseLowAtRemaining(remainingSeconds: number): boolean {
    return (Math.floor(remainingSeconds) % 2) === 0;
}

// Applies an admin delta to clock remaining time.
// CountDownClock.addSeconds(n) increases remaining; subtractSeconds(n) decreases it.
// If the countdown already completed and we're adding time, re-prime via setDuration+reset+start.
function adjustMatchClockBySeconds(deltaSeconds: number): void {
    const delta = Math.floor(deltaSeconds);
    const countdown = State.round.clock.countdown;

    if (countdown) {
        if (countdown.isComplete && delta > 0) {
            countdown.setDuration(delta);
            countdown.reset();
            if (!State.round.clock.isPaused) countdown.start();
            State.round.clock.durationSeconds = delta;
        } else if (delta > 0) {
            countdown.addSeconds(delta);
            State.round.clock.durationSeconds = Math.max(0, State.round.clock.durationSeconds + delta);
        } else if (delta < 0) {
            countdown.subtractSeconds(-delta);
            State.round.clock.durationSeconds = Math.max(0, State.round.clock.durationSeconds + delta);
        }

        if (State.round.clock.isPaused) {
            State.round.clock.pausedRemainingSeconds = Math.max(0, Math.floor(countdown.seconds));
        }
    } else {
        if (State.round.clock.isPaused) {
            const current = State.round.clock.pausedRemainingSeconds !== undefined ? State.round.clock.pausedRemainingSeconds : 0;
            State.round.clock.pausedRemainingSeconds = Math.max(0, current + delta);
        }
        State.round.clock.durationSeconds = Math.max(0, State.round.clock.durationSeconds + delta);
    }

    if (delta > 0) {
        State.round.clock.expiryFired = false;
    }

    State.round.clock.lastDisplayedSeconds = undefined;
    State.round.clock.lastLowTimeState = undefined;
}

// Resets live clock runtime using the current configured match length.
function resetMatchClockToDefault(): void {
    resetMatchClock(getConfiguredMatchLengthSeconds());
}

// Pushes the current match-clock state to all players' HUDs.
// Must be called after any manual admin adjustment or reset of the clock.

/**
 * Refreshes the visible match clock for all players.
 * Expected usage:
 * - Called when the authoritative clock seconds change (tick) or when clock style changes (low time).
 * Performance note:
 * - This should remain a lightweight pass that only updates widgets when the displayed value changes.
 */

function updateAllPlayersClock(): void {
    // Expiry is driven by Clocks.CountDownClock.onComplete (see onClockComplete); no
    // in-loop expiry trigger is needed. Use countdown.seconds if present, else fall
    // back to configured match length for early-boot paints before any reset/preview.
    const countdown = State.round.clock.countdown;
    const fallbackRemaining = countdown
        ? Math.max(0, Math.floor(countdown.seconds))
        : getConfiguredMatchLengthSeconds();

    const fallbackLowTime = fallbackRemaining < LOW_TIME_THRESHOLD_SECONDS;
    const displayRemaining = Math.max(0, Math.floor(fallbackRemaining));
    const minutes = Math.floor(displayRemaining / 60);
    const seconds = displayRemaining % 60;
    const digits = {
        mT: Math.floor(minutes / 10),
        mO: minutes % 10,
        sT: Math.floor(seconds / 10),
        sO: seconds % 10,
    };
    const shouldFlash = displayRemaining > 0 && displayRemaining < CRITICAL_TIME_FLASH_THRESHOLD_SECONDS;
    const clockColorIsLow = shouldFlash
        ? isClockCriticalColorPulseLowAtRemaining(displayRemaining)
        : fallbackLowTime;

    if (
        State.round.clock.lastDisplayedSeconds === displayRemaining &&
        State.round.clock.lastLowTimeState === clockColorIsLow
    ) {
        return;
    }

    const players = mod.AllPlayers();
    const count = mod.CountOf(players);

    for (let i = 0; i < count; i++) {
        const player = mod.ValueInArray(players, i) as mod.Player;
        if (!isValidPlayer(player)) continue;
        const pid = safeGetPlayerId(player);
        if (pid === undefined) continue;
        // Ensure each player's clock widgets exist and get cached refs for efficient updates.
        const cacheEntry = ensureClockUIAndGetCache(player);
        if (!cacheEntry) continue;
        const warmReady = isHudWarmReadyForPid(pid);

        setClockVisibilityCached(cacheEntry, warmReady);
        if (!warmReady) continue;

        if (State.round.clock.lastLowTimeState === undefined || clockColorIsLow !== State.round.clock.lastLowTimeState) {
            setClockColorCached(cacheEntry, clockColorIsLow ? COLOR_LOW_TIME : COLOR_NORMAL);
        }

        if (State.round.clock.lastDisplayedSeconds !== displayRemaining) {
            if (cacheEntry.minTensShadow) setDigitCached(cacheEntry.minTensShadow, digits.mT);
            setDigitCached(cacheEntry.minTens, digits.mT);
            if (cacheEntry.minOnesShadow) setDigitCached(cacheEntry.minOnesShadow, digits.mO);
            setDigitCached(cacheEntry.minOnes, digits.mO);
            if (cacheEntry.colonShadow) setColonCached(cacheEntry.colonShadow);
            setColonCached(cacheEntry.colon);
            if (cacheEntry.secTensShadow) setDigitCached(cacheEntry.secTensShadow, digits.sT);
            setDigitCached(cacheEntry.secTens, digits.sT);
            if (cacheEntry.secOnesShadow) setDigitCached(cacheEntry.secOnesShadow, digits.sO);
            setDigitCached(cacheEntry.secOnes, digits.sO);
        }

        updateVictoryDialogForPlayer(player, displayRemaining);

    }

    State.round.clock.lastLowTimeState = clockColorIsLow;
    State.round.clock.lastDisplayedSeconds = displayRemaining;
}

//#endregion ----------------- Match Clock - Update + State --------------------

