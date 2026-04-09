// @ts-nocheck
// Module: index/game-mode -- mode start loop and top-level initialization

const CONQUEST_LIVE_STATE_SUBTICK_SECONDS = 0.12;

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
    cleanupBoundaryAlarmRuntime();
    const detectedMapKey = detectMapKeyFromHqs();
    if (detectedMapKey) {
        applyMapConfig(detectedMapKey);
    }
    State.vehicles.configReady = true;
    initializeConquestPhase1Scaffold();
    conquestPhase2AResetNotLiveState();
    conquestPhase2BOnNotLiveReset();
    conquestPhase4OnNotLiveReset();
    conquestPhase4BOnNotLiveReset();
    const hudMode = getConquestHudMode();
    // Core/off startup: keep combat HUD ownership inside the TwlConquestHud runtime only.
    twlConquestHudHideAllPlayers();
    twlConquestHudClearAllEntries();
    if (hudMode === "off") {
        twlConquestHudResetSchedulerState();
    }

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

    // Start vehicle spawner backend before any optional HUD-core warmup so gameplay systems can proceed independently.
    void startVehicleSpawnerSystem();
    conquestPhase4PrimeSoundRuntime();

    // Ensure HUD exists for anyone already in-game at start
    await mod.Wait(0.1);
    {
        const players = mod.AllPlayers();
        const count = mod.CountOf(players);
        for (let i = 0; i < count; i++) {
            const p = mod.ValueInArray(players, i) as mod.Player;
            if (!p || !mod.IsPlayerValid(p)) continue;
            // Startup baseline: clear inherited redeploy delay so connected players are not held by stale forced timers.
            mod.SetRedeployTime(p, 0);
            // Build/rebuild the player's HUD (widgets) and immediately reflect current authoritative state.
            ensureTopHudShellForPlayer(p);
        }
    }
    ensureActiveWorldInteractablesReady();

    // Reset HUD state through the lifecycle mutator owner.
    lifecycleSetNotReadyBaseline("game-mode-start");
    State.admin.actionCount = 0;
    if (FEATURE_ADMIN_PANEL) updateAdminPanelActionCountForAllPlayers();
    // Broadcast the initial phase label (e.g., NOT READY) to all HUDs.
    setMatchStateTextForAllPlayers();
    refreshConquestScaffoldHudForAllPlayers();
    updateHelpTextVisibilityForAllPlayers();

    // Clock init + loop (pregame preview, do not count down yet)
    setMatchClockPreview(getConfiguredMatchLengthSeconds());

    // Core game-state mutation remains second-boundary authoritative.
    // Live capture-state and HUD projection refresh run at sub-second cadence to keep fill/percent updates responsive.
    let lastSecondBoundary = -1;
    let lastLiveCoreTickSecond = -1;
    while (true) {
        try {
            const nowElapsed = mod.GetMatchTimeElapsed();
            const nowSecondBoundary = Math.floor(nowElapsed);
            let clockUpdatedThisLoop = false;
            const _pd = FEATURE_PERF_DIAG && State.admin.perfDiagEnabled;
            let _t = 0;

            if (_pd) perfDiagOngoingGlobalTick();

            if (isMatchLive() && !State.match.victoryDialogActive) {
                if (_pd) _t = perfDiagBeginSection();
                conquestPhase2ARefreshLiveCaptureStateSubtick();
                if (_pd) perfDiagEndSection(1, _t);
                if (nowSecondBoundary !== lastLiveCoreTickSecond) {
                    lastLiveCoreTickSecond = nowSecondBoundary;
                    if (_pd) _t = perfDiagBeginSection();
                    conquestPhase2AOnLiveTick();
                    if (_pd) perfDiagEndSection(2, _t);
                } else {
                    if (_pd) _t = perfDiagBeginSection();
                    updateConquestCombatHudForAllPlayers();
                    if (_pd) perfDiagEndSection(3, _t);
                }
                if (_pd) _t = perfDiagBeginSection();
                conquestPhase4FlushCaptureSoundQueue();
                if (_pd) perfDiagEndSection(4, _t);
                if (_pd) _t = perfDiagBeginSection();
                conquestPhase4BFlushCaptureVoiceOverQueue();
                if (_pd) perfDiagEndSection(5, _t);
            } else {
                lastLiveCoreTickSecond = -1;
                flushPregameDirtyFlags();
            }

            if (shouldClockUseCriticalFlashSubtick()) {
                if (_pd) _t = perfDiagBeginSection();
                updateAllPlayersClock();
                if (_pd) perfDiagEndSection(6, _t);
                clockUpdatedThisLoop = true;
            }

            if (nowSecondBoundary !== lastSecondBoundary) {
                lastSecondBoundary = nowSecondBoundary;

                // Push the initial clock display so every HUD shows the same starting time.
                if (!clockUpdatedThisLoop) {
                    if (_pd) _t = perfDiagBeginSection();
                    updateAllPlayersClock();
                    if (_pd) perfDiagEndSection(6, _t);
                }
                if (_pd) _t = perfDiagBeginSection();
                ensureActiveWorldInteractablesReady();
                if (_pd) perfDiagEndSection(7, _t);
                if (_pd) _t = perfDiagBeginSection();
                checkTakeoffLimitForAllPlayers();
                if (_pd) perfDiagEndSection(8, _t);
                if (State.match.isEnded) {
                    clearActiveBoundaryViolationsForAllPlayers();
                }
                if (State.match.victoryDialogActive) {
                    if (_pd) _t = perfDiagBeginSection();
                    const elapsedSinceVictory = nowSecondBoundary - Math.floor(State.match.victoryStartElapsedSecondsSnapshot);
                    const remaining = MATCH_END_DELAY_SECONDS - elapsedSinceVictory;
                    updateVictoryDialogForAllPlayers(Math.max(0, Math.floor(remaining)));
                    if (_pd) perfDiagEndSection(9, _t);
                    if (remaining <= 0) {
                        endGameModeForTeamNum(State.match.winnerTeam ?? 0);
                        return;
                    }
                }
            }
        } catch {
            lastLiveCoreTickSecond = -1;
        }

        await mod.Wait(CONQUEST_LIVE_STATE_SUBTICK_SECONDS);
    }
}

//#endregion -------------------- Exported Event Handlers - Game Mode Start --------------------

