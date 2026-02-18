// @ts-nocheck
// Module: index/game-mode -- mode start loop and top-level initialization

//#region -------------------- Exported Event Handlers - Game Mode Start --------------------

/**
 * Entry point for this experience when the game mode starts.
 *
 * High-level flow:
 * 1) Initialize authoritative mode state (counters, flags, and timers).
 * 2) Build or repair any global UI/state that should exist before players interact.
 * 3) Ensure every currently-connected player has a HUD and that the HUD reflects the initial state.
 * 4) Arm any recurring processes (clock tick, cleanup passes) that keep state and UI in sync.
 *
 * Important invariants:
 * - Runtime phase state is authoritative; the HUD is a projection of that state.
 * - Any async work started here must use the guard tokens to prevent overlap if the mode restarts.
 *
 * Why async functions: uses small engine waits (mod.Wait/await) to sequence UI rebuilds/timers safely without blocking the main thread.
 */
async function onGameModeStartedImpl(): Promise<void> {
    const detectedMapKey = detectMapKeyFromHqs();
    if (detectedMapKey) {
        applyMapConfig(detectedMapKey);
    }
    State.vehicles.configReady = true;

    // Apply initial engine variables/settings used by the mode (authoritative baseline).
    mod.SetGameModeTargetScore(GAMEMODE_TARGET_SCORE_SAFETY_CAP);
    mod.SetVariable(regVehiclesTeam1, mod.EmptyArray());
    mod.SetVariable(regVehiclesTeam2, mod.EmptyArray());

    vehIds.length = 0;
    vehOwners.length = 0;
    clearSpawnBaseTeamCache();

    sendHighlightedWorldLogMessage(
        mod.Message(mod.stringkeys.twl.messages.init),
        false,
        mod.GetTeam(TeamID.Team1),
        mod.stringkeys.twl.messages.init
    );
    sendHighlightedWorldLogMessage(
        mod.Message(mod.stringkeys.twl.messages.init),
        false,
        mod.GetTeam(TeamID.Team2),
        mod.stringkeys.twl.messages.init
    );

    // Ensure HUD exists for anyone already in-game at start
    await mod.Wait(0.1);
    {
        const players = mod.AllPlayers();
        const count = mod.CountOf(players);
        for (let i = 0; i < count; i++) {
            const p = mod.ValueInArray(players, i) as mod.Player;
            if (!p || !mod.IsPlayerValid(p)) continue;
            // Build/rebuild the player's HUD (widgets) and immediately reflect current authoritative state.
            ensureHudForPlayer(p);
        }
    }

    // Reset HUD state
    State.match.isEnded = false;
    State.match.victoryDialogActive = false;
    State.round.phase = MatchPhase.NotReady; // Reset phase state for a new match.

    State.match.winnerTeam = undefined;
    State.match.endElapsedSecondsSnapshot = 0;
    State.match.victoryStartElapsedSecondsSnapshot = 0;
    State.admin.actionCount = 0;
    updateAdminPanelActionCountForAllPlayers();
    // Broadcast the initial phase label (e.g., NOT READY) to all HUDs.
    setMatchStateTextForAllPlayers();
    updateHelpTextVisibilityForAllPlayers();

    // Clock init + loop (pregame preview, do not count down yet)
    setMatchClockPreview(getConfiguredMatchLengthSeconds());

    // Vehicle spawners run on their own loop so they don't block the main clock loop.
    void startVehicleSpawnerSystem();

    while (true) {
        // Push the initial clock display so every HUD shows the same starting time.
        updateAllPlayersClock();
        checkTakeoffLimitForAllPlayers();
        if (State.match.victoryDialogActive) {
            const elapsedSinceVictory = Math.floor(mod.GetMatchTimeElapsed()) - Math.floor(State.match.victoryStartElapsedSecondsSnapshot);
            const remaining = MATCH_END_DELAY_SECONDS - elapsedSinceVictory;
            updateVictoryDialogForAllPlayers(Math.max(0, Math.floor(remaining)));
            if (remaining <= 0) {
                endGameModeForTeamNum(State.match.winnerTeam ?? 0);
                return;
            }
        }
        await mod.Wait(1.0);
    }
}

//#endregion -------------------- Exported Event Handlers - Game Mode Start --------------------
