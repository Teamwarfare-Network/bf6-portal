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
    rootName: string;
    roundStateRootName: string;
    roundStateText?: mod.UIWidget;
    playersReadyText?: mod.UIWidget;
    minTens: mod.UIWidget;
    minOnes: mod.UIWidget;
    colon: mod.UIWidget;
    secTens: mod.UIWidget;
    secOnes: mod.UIWidget;
}

function resetMatchClock(seconds: number): void {
    const clampedSeconds = Math.max(0, Math.floor(seconds));
    State.round.clock.durationSeconds = clampedSeconds;
    State.round.clock.matchLengthSeconds = clampedSeconds;
    State.round.clock.matchStartElapsedSeconds = Math.floor(mod.GetMatchTimeElapsed());

    State.round.clock.isPaused = false;
    State.round.clock.pausedRemainingSeconds = undefined;

    State.round.clock.expiryFired = false;
    State.round.clock.lastDisplayedSeconds = undefined;
    State.round.clock.lastLowTimeState = undefined;
}

function setMatchClockPreview(seconds: number): void {
    const clampedSeconds = clampMatchLengthSeconds(seconds);
    State.round.clock.durationSeconds = clampedSeconds;
    State.round.clock.matchLengthSeconds = clampedSeconds;
    State.round.clock.matchStartElapsedSeconds = undefined;
    State.round.clock.isPaused = true;
    State.round.clock.pausedRemainingSeconds = clampedSeconds;
    State.round.clock.expiryFired = false;
    State.round.clock.lastDisplayedSeconds = undefined;
    State.round.clock.lastLowTimeState = undefined;
}

function getRemainingSeconds(): number {
    if (State.round.clock.isPaused) {
        return Math.max(0, State.round.clock.pausedRemainingSeconds !== undefined ? State.round.clock.pausedRemainingSeconds : 0);
    }

    if (State.round.clock.matchStartElapsedSeconds === undefined) return 0;

    const elapsed = Math.floor(mod.GetMatchTimeElapsed()) - State.round.clock.matchStartElapsedSeconds;
    return Math.max(0, State.round.clock.durationSeconds - elapsed);
}

function adjustMatchClockBySeconds(deltaSeconds: number): void {
    const delta = Math.floor(deltaSeconds);

    if (State.round.clock.isPaused) {
        const current = State.round.clock.pausedRemainingSeconds !== undefined ? State.round.clock.pausedRemainingSeconds : 0;
        State.round.clock.pausedRemainingSeconds = Math.max(0, current + delta);
        State.round.clock.durationSeconds = Math.max(0, State.round.clock.durationSeconds + delta);
    } else {
        State.round.clock.durationSeconds = Math.max(0, State.round.clock.durationSeconds + delta);
    }

    if (delta > 0) {
        State.round.clock.expiryFired = false;
    }

    State.round.clock.lastDisplayedSeconds = undefined;
    State.round.clock.lastLowTimeState = undefined;
}

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
    const remaining = isMatchLive() ? getRemainingSeconds() : getConfiguredMatchLengthSeconds();

    if (!State.round.clock.expiryFired && remaining <= 0) {
        State.round.clock.expiryFired = true;
        for (let i = 0; i < State.round.clock.expiryHandlers.length; i++) {
            State.round.clock.expiryHandlers[i]();
        }
    }

    const lowTime = remaining < LOW_TIME_THRESHOLD_SECONDS;

    const minutes = Math.floor(remaining / 60);
    // Read the authoritative remaining seconds for the match clock.
    const seconds = remaining % 60;

    const digits = {
        mT: Math.floor(minutes / 10),
        mO: minutes % 10,
        sT: Math.floor(seconds / 10),
        sO: seconds % 10,
    };

    const players = mod.AllPlayers();
    const count = mod.CountOf(players);

    for (let i = 0; i < count; i++) {
        const player = mod.ValueInArray(players, i) as mod.Player;
        if (!player || !mod.IsPlayerValid(player)) continue;

        // Ensure each player's clock widgets exist and get cached refs for efficient updates.
        const cacheEntry = ensureClockUIAndGetCache(player);
        if (!cacheEntry) continue;

        if (State.round.clock.lastLowTimeState === undefined || lowTime !== State.round.clock.lastLowTimeState) {
            setClockColorCached(cacheEntry, lowTime ? COLOR_LOW_TIME : COLOR_NORMAL);
        }

        if (State.round.clock.lastDisplayedSeconds !== remaining) {
            setDigitCached(cacheEntry.minTens, digits.mT);
            setDigitCached(cacheEntry.minOnes, digits.mO);
            setColonCached(cacheEntry.colon);
            setDigitCached(cacheEntry.secTens, digits.sT);
            setDigitCached(cacheEntry.secOnes, digits.sO);
        }

        updateVictoryDialogForPlayer(player, remaining);

    }

    State.round.clock.lastLowTimeState = lowTime;
    State.round.clock.lastDisplayedSeconds = remaining;
}

//#endregion ----------------- Match Clock - Update + State --------------------
