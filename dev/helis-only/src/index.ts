// @ts-nocheck
import './header-file';
import './types';
import './config';
import './strings';
import './state';
import './lazy-build';
import './hud';
import './hud-dialog-lazy';
import './hud-scoring-lazy';
import './vehicles';
import './overtime';
import './clock';
import './team-switch';
import './round-flow';
import './ready-dialog';
import './utils';

//#region -------------------- Exported Event Handlers - Game Mode Start --------------------

/**
 * Entry point for this experience when the game mode starts.
 *
 * High-level flow:
 * 1) Initialize authoritative match/round state (counters, flags, and timers).
 * 2) Build or repair any global UI/state that should exist before players interact.
 * 3) Ensure every currently-connected player has a HUD and that the HUD reflects the initial state.
 * 4) Arm any recurring processes (clock tick, cleanup passes) that keep state and UI in sync.
 *
 * Important invariants:
 * - Do not award points unless `isRoundLive()` is true.
 * - Round/match counters are authoritative; the HUD is a projection of that state.
 * - Any async work started here must use the guard tokens to prevent overlap if the mode restarts.
 *
 * Why async functions: uses small engine waits (mod.Wait/await) to sequence UI rebuilds/timers safely without blocking the main thread.
 */
export async function OnGameModeStarted(): Promise<void> {
    const detectedMapKey = detectMapKeyFromHqs();
    if (detectedMapKey) {
        applyMapConfig(detectedMapKey);
    }
    State.vehicles.configReady = true;

    mod.SetGameModeTargetScore(GAMEMODE_TARGET_SCORE_SAFETY_CAP);
    mod.SetVariable(regVehiclesTeam1, mod.EmptyArray());
    mod.SetVariable(regVehiclesTeam2, mod.EmptyArray());

    vehIds.length = 0;
    vehOwners.length = 0;
    clearSpawnBaseTeamCache();
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

    await mod.Wait(0.1);
    {
        const players = mod.AllPlayers();
        const count = mod.CountOf(players);
        for (let i = 0; i < count; i++) {
            const p = mod.ValueInArray(players, i) as mod.Player;
            if (!p || !mod.IsPlayerValid(p)) continue;
            ensureEagerHudShellForPlayer(p);
        }
    }

    State.match.isEnded = false;
    State.match.victoryDialogActive = false;
    State.round.phase = RoundPhase.NotReady;
    State.round.current = 1;
    resetOvertimeFlagState();
    State.flag.tieBreakerEnabledThisRound = false;
    setOvertimeAllFlagVisibility(false);

    setMatchWinsTeam(TeamID.Team1, 0);
    setMatchWinsTeam(TeamID.Team2, 0);
    State.scores.t1TotalKills = 0;
    State.scores.t2TotalKills = 0;

    State.match.winnerTeam = undefined;
    State.match.endElapsedSecondsSnapshot = 0;
    State.match.victoryStartElapsedSecondsSnapshot = 0;
    State.admin.actionCount = 0;
    State.admin.tieBreakerOverrideUsed = false;
    State.admin.liveRespawnEnabled = DEFAULT_LIVE_RESPAWN_ENABLED;
    State.admin.ceilingPunishEnabled = DEFAULT_CEILING_PUNISH_ENABLED;
    syncAdminLiveRespawnLabelForAllPlayers();
    syncAdminCeilingPunishLabelForAllPlayers();
    updateSpawnDisabledWarningForAllPlayers();

    State.hudCache.lastHudScoreT1 = undefined;
    State.hudCache.lastHudScoreT2 = undefined;
    setHudRoundCountersForAllPlayers(State.round.current, MAX_ROUNDS);
    setHudWinCountersForAllPlayers(0, 0);
    State.match.tiesT1 = 0;
    State.match.tiesT2 = 0;
    syncRoundRecordHudForAllPlayers();
    syncWinCountersHudFromGameModeScore();
    syncKillsHudFromTrackedTotals(true);
    updateAdminPanelActionCountForAllPlayers();
    setRoundStateTextForAllPlayers();
    updateHelpTextVisibilityForAllPlayers();

    setRoundClockPreview(getConfiguredRoundLengthSeconds());

    void startVehicleSpawnerSystem();
    // H-P1: per-pid altitude warning loop. Iterates only the playerInAircraftByPid cache (5Hz tick).
    void runAircraftWarningLoop();

    // Main tick loop (1Hz). Concurrent tick loops also running in this script:
    //   - runAircraftWarningLoop      5Hz  ready-dialog.ts  altimeter + altitude warning per-pid
    //   - runOvertimeCaptureLoop      4Hz  overtime.ts      only during active overtime (started by overtime activation)
    //   - pollVehicleSpawnerSlots     1Hz  vehicles.ts      respawn tracking + slot/vehicle binding repair
    // Main-base entry/exit is event-driven via OnAreaTriggerEnter/Exit -- not a polling loop.
    //
    // Add work to THIS loop only if it needs the 1Hz cadence. Faster cadence -> add to a
    // dedicated loop (don't speed up this one). Slower cadence -> throttle inside the helper.
    while (true) {
        // v0.712 tick-context AllPlayers cache: fetch ONCE per tick and pass to helpers that
        // would otherwise each call mod.AllPlayers() independently. Was 3 bridge calls/sec
        // (clock + takeoff + autoready); now 1. updateOvertimeStage doesn't take the cache
        // because it doesn't iterate players directly -- delegates to sub-helpers internally.
        const tickPlayers = mod.AllPlayers();
        const tickCount = mod.CountOf(tickPlayers);

        // Push the initial clock display so every HUD shows the same starting time.
        updateAllPlayersClock(tickPlayers, tickCount);
        updateOvertimeStage();
        // F6 (v0.711): hoist the phase gate that both helpers below check internally. Saves 2
        // function-call-and-return cycles/sec post-round-start (their internal short-circuits
        // already returned immediately). Same behavior; just one fewer call frame.
        if (State.round.phase === RoundPhase.NotReady && !State.round.flow.cleanupActive && !State.match.isEnded) {
            checkTakeoffLimitForAllPlayers(tickPlayers, tickCount);
            applyAutoReadyForAllPlayers(tickPlayers, tickCount);
        }
        // syncKillsHudFromTrackedTotals NOT called here (v0.711 Bundle A): every increment site
        // (OnVehicleDestroyed + admin T1/T2 +/- buttons) already calls it with force=true at the
        // mutation site. The polled call was pure redundancy after v0.692's cache check.

        if (State.match.victoryDialogActive) {
            const elapsedSinceVictory = Math.floor(mod.GetMatchTimeElapsed()) - Math.floor(State.match.victoryStartElapsedSecondsSnapshot);
            const remaining = MATCH_END_DELAY_SECONDS - elapsedSinceVictory;
            updateVictoryDialogForAllPlayers(Math.max(0, Math.floor(remaining)));
        }
        await mod.Wait(1.0);
    }
}

//#endregion -------------------- Exported Event Handlers - Game Mode Start --------------------



//#region -------------------- Exported Event Handlers - Player Join + Leave --------------------

function resetUiForPlayerOnJoin(player: mod.Player): void {
    if (!player || !mod.IsPlayerValid(player)) return;
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return;

    setUIInputModeForPlayer(player, false);

    const titleShadow = safeFind(BIG_TITLE_SHADOW_WIDGET_ID + pid);
    safeSetUIWidgetVisible(titleShadow, false);
    const title = safeFind(BIG_TITLE_WIDGET_ID + pid);
    safeSetUIWidgetVisible(title, false);
    const subtitleShadow = safeFind(BIG_SUBTITLE_SHADOW_WIDGET_ID + pid);
    safeSetUIWidgetVisible(subtitleShadow, false);
    const subtitle = safeFind(BIG_SUBTITLE_WIDGET_ID + pid);
    safeSetUIWidgetVisible(subtitle, false);

    deleteJoinPromptWidget(joinPromptButtonTextName(pid));
    deleteJoinPromptWidget(joinPromptButtonName(pid));
    deleteJoinPromptWidget(joinPromptButtonBorderName(pid));
    deleteJoinPromptWidget(joinPromptNeverShowButtonTextName(pid));
    deleteJoinPromptWidget(joinPromptNeverShowButtonName(pid));
    deleteJoinPromptWidget(joinPromptNeverShowButtonBorderName(pid));
    deleteJoinPromptWidget(joinPromptBodyName(pid));
    deleteJoinPromptWidget(joinPromptTitleName(pid));
    deleteJoinPromptWidget(joinPromptPanelName(pid));
    deleteJoinPromptWidget(joinPromptRootName(pid));

    deleteTeamSwitchUI(player);
}

export async function OnPlayerJoinGame(eventPlayer: mod.Player) {
    initTeamSwitchData(eventPlayer);
    const joinPid = safeGetPlayerId(eventPlayer);
    if (joinPid !== undefined) {
        delete State.players.disconnectedByPid[joinPid];
        State.players.deployedByPid[joinPid] = false;
        State.players.autoReadyByPid[joinPid] = false;
    }

    await mod.Wait(0.1);
    if (!mod.IsPlayerValid(eventPlayer)) return;

    resetUiForPlayerOnJoin(eventPlayer);

    const refs = ensureEagerHudShellForPlayer(eventPlayer);

    if (refs) {
        setCounterText(refs.leftWinsText, State.match.winsT1);
        setCounterText(refs.rightWinsText, State.match.winsT2);
        setRoundRecordText(refs.leftRecordText, State.match.winsT1, State.match.lossesT1, State.match.tiesT1);
        setRoundRecordText(refs.rightRecordText, State.match.winsT2, State.match.lossesT2, State.match.tiesT2);
        setCounterText(refs.leftRoundKillsText, State.scores.t1RoundKills);
        setCounterText(refs.rightRoundKillsText, State.scores.t2RoundKills);
        setCounterText(refs.leftKillsText, State.scores.t1TotalKills);
        setCounterText(refs.rightKillsText, State.scores.t2TotalKills);
        setCounterText(refs.roundCurText, State.round.current);
        setCounterText(refs.roundMaxText, State.round.max);
    }
    {
        const cache = ensureClockUIAndGetCache(eventPlayer);
        if (cache) setRoundStateText(cache.roundStateText);
        updateHelpTextVisibilityForPlayer(eventPlayer);
    }
    if (joinPid !== undefined) {
        updateTeamNameWidgetsForPid(joinPid);
    }

    await mod.Wait(0.1);
    if (!mod.IsPlayerValid(eventPlayer)) return;
    renderReadyDialogForAllVisibleViewers();
    updatePlayersReadyHudTextForAllPlayers();
    updateHelpTextVisibilityForAllPlayers();
    rebuildOvertimeUiForPlayer(eventPlayer);
    State.round.clock.lastDisplayedSeconds = undefined;
    State.round.clock.lastLowTimeState = undefined;
    updateAllPlayersClock();

    // Join-time prompt is only shown once per player (undeploy prompts can repeat unless suppressed).
    if (!shouldShowJoinPromptForPlayer(eventPlayer)) return;
    const joinPromptPid = safeGetPlayerId(eventPlayer);
    if (joinPromptPid === undefined) return;
    if (State.players.joinPromptShownByPid[joinPromptPid]) return;
    State.players.joinPromptShownByPid[joinPromptPid] = true;

    await mod.Wait(0.2);
    if (!mod.IsPlayerValid(eventPlayer)) return;
    if (!shouldShowJoinPromptForPlayer(eventPlayer)) return;
    createJoinPromptForPlayer(eventPlayer);
}

/**
 * Disconnect handling:
 * - Clears per-player state maps so rejoin starts clean (NOT READY).
 * - Forces UI/HUD refresh for remaining players to drop the departed player immediately.
 */
export function OnPlayerLeaveGame(eventNumber: number | mod.Player) {
    let pid: number | undefined;
    if (mod.IsType(eventNumber, mod.Types.Player)) {
        pid = safeGetPlayerId(eventNumber as mod.Player);
    } else {
        pid = eventNumber as number;
    }
    if (pid === undefined) return;

    State.players.disconnectedByPid[pid] = true;
    removeTeamSwitchInteractPoint(pid);
    // Cleanup: delete cached UI widgets so we do not leak UI for disconnected players.
    if (!shouldDeferDisconnectUiDeletes()) {
        hardDeleteTeamSwitchUI(pid);
    }
    // On undeploy/death, avoid hard-deleting overtime HUD; hide + drop refs for safe rebuild.
    handleOvertimePlayerLeaveById(pid, false);
    // Remove any persisted per-player state so rejoin starts clean (NOT READY by default).
    delete State.players.readyByPid[pid];
    delete State.players.autoReadyByPid[pid];
    delete State.players.readyMessageCooldownByPid[pid];
    delete State.players.joinPromptShownByPid[pid];
    delete State.players.joinPromptNeverShowByPidMap[pid];
    delete State.players.joinPromptReadyDialogOpenedByPid[pid];
    delete State.players.joinPromptTipIndexByPid[pid];
    delete State.players.joinPromptTipsUnlockedByPid[pid];
    delete State.players.joinPromptTripleTapArmedByPid[pid];
    delete State.players.uiInputEnabledByPid[pid];
    delete State.players.inMainBaseByPid[pid];
    delete State.players.overTakeoffLimitByPid[pid];
    delete State.players.deployedByPid[pid];
    delete State.players.deployedAtSecondsByPid[pid];
    delete State.players.isAliveByPid[pid];
    delete State.players.spawnDisabledWarningVisibleByPid[pid];
    // H-P1: clean per-pid altitude-warning state on disconnect (mirrors the rest of the per-pid map cleanup).
    delete State.players.playerInAircraftByPid[pid];
    delete State.players.altitudeWarningVisibleByPid[pid];
    delete State.players.altitudeWarningStartedAtSecondsByPid[pid];
    delete State.players.ceilingPunishFiredByPid[pid];
    // Also drop dialog-visible tracking if present (viewer is gone).
    delete State.players.teamSwitchData[pid];
    clearJoinPromptForPlayerId(pid);

    // Refresh UI for remaining players so rosters + HUD ready counts immediately reflect the disconnect.
    if (!isRoundLive()) {
        renderReadyDialogForAllVisibleViewers();
        updatePlayersReadyHudTextForAllPlayers();
        updateHelpTextVisibilityForAllPlayers();
    }
}

//#endregion -------------------- Exported Event Handlers - Player Join + Leave --------------------



//#region -------------------- Exported Event Handlers - Player Deploy + Undeploy --------------------

async function deferForcedUndeploy(player: mod.Player, reason: string): Promise<void> {
    // Defer undeploy by a tick to avoid engine instability during deploy transitions.
    // safeUndeployPlayer covers null + IsPlayerValid + isPlayerDeployed + try/catch internally;
    // the outer try/catch is preserved as defense-in-depth around mod.Wait (matches Conquest player-deploy.ts).
    try {
        await mod.Wait(0.1);
        safeUndeployPlayer(player);
    } catch {
        // Intentionally silent to keep unstable transitions from crashing the experience.
    }
}

export async function OnPlayerDeployed(eventPlayer: mod.Player) {
    const pid = safeGetPlayerId(eventPlayer);
    if (pid === undefined) return;
    setUIInputModeForPlayer(eventPlayer, false);
    if (State.round.flow.cleanupActive && !State.round.flow.cleanupAllowDeploy) {
        State.players.deployedByPid[pid] = false;
        await deferForcedUndeploy(eventPlayer, "cleanup");
        return;
    }
    if (isLiveRespawnDisabled() && isRoundLive()) {
        State.players.deployedByPid[pid] = false;
        updateSpawnDisabledWarningForPlayer(eventPlayer);
        await deferForcedUndeploy(eventPlayer, "live_round");
        return;
    }

    State.players.deployedByPid[pid] = true;
    State.players.deployedAtSecondsByPid[pid] = mod.GetMatchTimeElapsed();
    State.players.isAliveByPid[pid] = true;
    State.players.joinPromptTripleTapArmedByPid[pid] = false;
    updateSpawnDisabledWarningForPlayer(eventPlayer);
    try {
        mod.AddEquipment(
            eventPlayer,
            mod.Gadgets.Deployable_Vehicle_Supply_Crate,
            mod.InventorySlots.GadgetOne
        );
    } catch {}
    try {
        mod.AddEquipment(
            eventPlayer,
            mod.Gadgets.Deployable_Vehicle_Supply_Crate,
            mod.InventorySlots.GadgetTwo
        );
    } catch {}
    State.players.readyByPid[pid] = false;
    State.players.inMainBaseByPid[pid] = true;
    delete State.players.overTakeoffLimitByPid[pid];
    updatePlayersReadyHudTextForAllPlayers();
    renderReadyDialogForAllVisibleViewers();
    updateHelpTextVisibilityForAllPlayers();
    ensureEagerHudShellForPlayer(eventPlayer);
    // Phase B: build the top-HUD scoring widgets lazily on first deploy. Deploys are naturally
    // staggered across time, so this avoids the OnPlayerJoinGame dogpile that triggered the
    // 1000ms frame-budget crash.
    triggerLazyBuild('topHud', pid);
    await spawnTeamSwitchInteractPoint(eventPlayer);
}

export function OnPlayerUndeploy(eventPlayer: mod.Player) {
    // If the player is leaving the deployed state (death / manual undeploy / forced redeploy),
    // the Ready Up dialog should be closed. This prevents interacting with the UI while undeployed.
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    const pid = safeGetPlayerId(eventPlayer);
    if (pid === undefined) return;
    if (isPidDisconnected(pid)) return;
    State.players.deployedByPid[pid] = false;
    State.players.isAliveByPid[pid] = false;
    State.players.joinPromptTripleTapArmedByPid[pid] = false;
    if (State.players.teamSwitchData[pid]?.dialogVisible) {
        deleteTeamSwitchUI(eventPlayer);
    }
    // v0.670: hide altimeter on death / undeploy. The player isn't in an aircraft anymore.
    setAltimeterVisibleForPid(pid, false);
    setAltimeterWarningLabelVisibleForPid(pid, false);
    updateHelpTextVisibilityForPid(pid);

    removeTeamSwitchInteractPoint(pid);
    // On undeploy/death, avoid hard-deleting overtime HUD; hide + drop refs for safe rebuild.
    handleOvertimePlayerLeaveById(pid, false);

    if (shouldShowJoinPromptForPlayer(eventPlayer)) {
        createJoinPromptForPlayer(eventPlayer);
    }
}

//#endregion -------------------- Exported Event Handlers - Player Deploy + Undeploy --------------------



//#region -------------------- Exported Event Handlers - Player Loop + UI Inputs --------------------

// Performance note:
// - OngoingPlayer executes frequently; keep it lightweight!
// - Avoid FindUIWidget calls or per-tick loops over all players/vehicles unless strictly necessary.
// - Prefer "update only when changed" patterns for HUD/clock refreshes.
export function OngoingPlayer(eventPlayer: mod.Player): void {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    updateSpawnDisabledWarningForPlayer(eventPlayer);
    if (isPlayerDeployed(eventPlayer)) {
        checkTeamSwitchInteractPointRemoval(eventPlayer);
    }

    // Fix 5 (v0.692): Ready Dialog warm-up block removed. The previous warm-up built the entire
    // ~600-line widget tree on the first OngoingPlayer tick per player; with concurrent joins
    // that dogpiled (N players * 600 lines in one engine tick) -- same crash signature as the
    // Phase A/B bugs. Conquest hit and resolved the identical pattern in v1.418 Wave 3 by
    // ablation (CQ_Bug_32, CQ_Bug_33 closed by deletion). The Ready Dialog now builds on first
    // triple-tap via createTeamSwitchUI's own idempotent cache check. First triple-tap pays a
    // one-time ~50ms hitch (player-initiated, naturally staggered, cannot dogpile).

    if (isPlayerDeployed(eventPlayer)) {
        // v0.711 seatKind gate: skip the triple-tap polling while the player is in a vehicle.
        // Interact points can't be spawned/activated from a vehicle anyway, and the detector's
        // IsInteracting bridge call is the highest-cost per-tick read in OngoingPlayer. Player
        // detector state is cleared on OnPlayerExitVehicle so the next polling tick re-arms cleanly.
        const inVehicle = safeGetSoldierStateBool(eventPlayer, mod.SoldierStateBool.IsInVehicle, false);
        if (!inVehicle && InteractMultiClickDetector.checkMultiClick(eventPlayer)) {
            const pid = safeGetPlayerId(eventPlayer);
            if (pid === undefined) return;
            armJoinPromptTripleTapForPid(pid);
            spawnTeamSwitchInteractPoint(eventPlayer);
        }
    }
}

export function OnPlayerInteract(eventPlayer: mod.Player, eventInteractPoint: mod.InteractPoint) {
    teamSwitchInteractPointActivated(eventPlayer, eventInteractPoint);
}

export function OnPlayerUIButtonEvent(eventPlayer: mod.Player, eventUIWidget: mod.UIWidget, eventUIButtonEvent: mod.UIButtonEvent) {
    if (tryHandleJoinPromptButton(eventPlayer, eventUIWidget, eventUIButtonEvent)) return;
    teamSwitchButtonEvent(eventPlayer, eventUIWidget, eventUIButtonEvent);
}

//#endregion -------------------- Exported Event Handlers - Player Loop + UI Inputs --------------------



//#region -------------------- Exported Event Handlers - Vehicle Entry + Exit --------------------

// OnPlayerEnterVehicle:
// Registers a vehicle to a team the first time a player enters it.
// This establishes which team will lose a point if the vehicle is later destroyed.
// Also records the entering player as the 'last driver' for messaging purposes.
// Notes:
// - Registration is idempotent; re-entering does not double-register.
// - Last driver is best-effort and not authoritative for scoring.
// Code Cleanup: Known fragility - we need to refactor or identify a different method entirely as OnPlayerEnterVehicle is error prone.
function isVehicleEmptyForEntry(eventVehicle: mod.Vehicle, enteringPlayer: mod.Player): boolean {
    const seatCount = mod.GetVehicleSeatCount(eventVehicle);
    if (seatCount <= 1) return true;
    const enteringSeat = mod.GetPlayerVehicleSeat(enteringPlayer);
    for (let seat = 0; seat < seatCount; seat++) {
        if (seat === enteringSeat) continue;
        if (mod.IsVehicleSeatOccupied(eventVehicle, seat)) {
            return false;
        }
    }
    return true;
}

export function OnPlayerEnterVehicle(eventPlayer: mod.Player, eventVehicle: mod.Vehicle) {
    if (!mod.IsPlayerValid(eventPlayer)) return;

    const teamNum = getTeamNumber(mod.GetTeam(eventPlayer));
    if (teamNum !== TeamID.Team1 && teamNum !== TeamID.Team2) {
        // Defensive arg wrap: stale-Player race during join/team-assignment can fire
        // "Received undefined values" engine errors (Conquest #94 family).
        const safePlayerName = safePlayerArg(eventPlayer);
        sendHighlightedWorldLogMessage(
            mod.Message(STR_VEHICLE_REG_PENDING_TEAM, safePlayerName),
            true,
            mod.GetTeam(TeamID.Team1),
            STR_VEHICLE_REG_PENDING_TEAM
        );
        sendHighlightedWorldLogMessage(
            mod.Message(STR_VEHICLE_REG_PENDING_TEAM, safePlayerName),
            true,
            mod.GetTeam(TeamID.Team2),
            STR_VEHICLE_REG_PENDING_TEAM
        );
        return;
    }

    const inT1 = arrayContainsVehicle(mod.GetVariable(regVehiclesTeam1), eventVehicle);
    const inT2 = arrayContainsVehicle(mod.GetVariable(regVehiclesTeam2), eventVehicle);
    const wasRegistered = inT1 || inT2;

    // Cached last driver for this vehicle (if any).
    const priorOwner = getLastDriver(eventVehicle); 

    // Only trust the owner if the player is still valid.
    const priorOwnerValid = !!priorOwner && mod.IsPlayerValid(priorOwner); 

    // Same player re-entering their last-driven vehicle.
    const isReturnToSameOwner = priorOwnerValid && (getObjId(priorOwner) === getObjId(eventPlayer)); 

    // Current registry team for this vehicle, if any.
    const registeredTeam = inT1 ? TeamID.Team1 : (inT2 ? TeamID.Team2 : 0); 

    const isEmptyVehicle = isVehicleEmptyForEntry(eventVehicle, eventPlayer);

    // Transfer on empty vehicle entry, missing owner, or cross-team registry mismatch.
    const shouldTransferOwnership = isEmptyVehicle || !priorOwnerValid || (registeredTeam !== 0 && registeredTeam !== teamNum); 

    // Reconcile baseline team for unowned vehicles before applying "enter = claim/steal".
    if (!priorOwnerValid) {
        const vehicleObjId = getObjId(eventVehicle);
        let inferredBaseTeam = vehicleSpawnBaseTeamByObjId[vehicleObjId];
        if (inferredBaseTeam !== TeamID.Team1 && inferredBaseTeam !== TeamID.Team2) {
            inferredBaseTeam = inferBaseTeamFromPosition(mod.GetObjectPosition(eventVehicle)) as TeamID;
        }

        if (inferredBaseTeam === TeamID.Team1 || inferredBaseTeam === TeamID.Team2) {
            const registeredTeam = inT1 ? TeamID.Team1 : (inT2 ? TeamID.Team2 : 0);
            if (registeredTeam !== inferredBaseTeam) {
                registerVehicleToTeam(eventVehicle, inferredBaseTeam);
            }
        }
    }

    if (shouldTransferOwnership) {
        setLastDriver(eventVehicle, eventPlayer);
        registerVehicleToTeam(eventVehicle, teamNum);
    } else if (!wasRegistered) {
        // Safety: ensure membership exists even if the registry desynced.
        registerVehicleToTeam(eventVehicle, teamNum);
    }

    const teamNameKey = getTeamNameKey(teamNum);

    //Send notifications around different vehicle registration events so players can spot known issue with Vehicle Registrations
    // Defensive arg wrap: stale-Player race during vehicle entry can fire "Received
    // undefined values" engine errors when eventPlayer is passed to mod.Message (Conquest #94 family).
    const safePlayerName = safePlayerArg(eventPlayer);
    let messageKey: number = STR_VEHICLE_REG_NO_CHANGE;
    let arg0: any = safePlayerName;
    let arg1: any = teamNameKey;
    if (!wasRegistered) { //New Vehicle
        messageKey = mod.stringkeys.twl.messages.vehicleRegisteredNew;
        arg0 = teamNameKey;
        arg1 = safePlayerName;
    } else if (isReturnToSameOwner) { //Old Vehicle Same Player
        messageKey = (registeredTeam !== 0 && registeredTeam !== teamNum)
            ? STR_VEHICLE_STOLEN_REGISTER
            : mod.stringkeys.twl.messages.vehicleReturned;
        arg0 = safePlayerName;
        arg1 = teamNameKey;
    } else if (shouldTransferOwnership) { //Old Vehicle Different Player
        messageKey = (registeredTeam !== 0 && registeredTeam !== teamNum)
            ? STR_VEHICLE_STOLEN_REGISTER
            : mod.stringkeys.twl.messages.vehicleReRegistered;
        arg0 = teamNameKey;
        arg1 = safePlayerName;
    }

    sendHighlightedWorldLogMessage(
        mod.Message(messageKey, arg0, arg1),
        true,
        mod.GetTeam(TeamID.Team1),
        messageKey
    );
    sendHighlightedWorldLogMessage(
        mod.Message(messageKey, arg0, arg1),
        true,
        mod.GetTeam(TeamID.Team2),
        messageKey
    );

    handleOvertimePlayerEnterVehicle(eventPlayer, eventVehicle);

    // H-P1: maintain the per-pid aircraft-occupancy cache. Only aircraft vehicles count;
    // runAircraftWarningLoop iterates this cache (no AllPlayers / AllVehicles scan).
    const enteringPid = safeGetPlayerId(eventPlayer);
    if (enteringPid !== undefined && isAircraftVehicle(eventVehicle)) {
        State.players.playerInAircraftByPid[enteringPid] = true;
    }
}

export function OnPlayerExitVehicle(eventPlayer: mod.Player, eventVehicle: mod.Vehicle) {
    if (!mod.IsPlayerValid(eventPlayer)) return;
    handleOvertimePlayerExitVehicle(eventPlayer, eventVehicle);

    // H-P1: clear aircraft cache + hide any active warning for this pid. All idempotent.
    // v0.670: also hide altimeter + altimeter warning label here so they vanish the instant
    // the player gets out. The 5Hz runAircraftWarningLoop would catch this on its next tick,
    // but OnPlayerExitVehicle is the engine's reliable exit hook (per project memory) so we
    // belt-and-suspenders the hide immediately.
    const exitingPid = safeGetPlayerId(eventPlayer);
    if (exitingPid !== undefined) {
        delete State.players.playerInAircraftByPid[exitingPid];
        setAltitudeWarningVisibleForPid(exitingPid, false);
        setAltimeterVisibleForPid(exitingPid, false);
        setAltimeterWarningLabelVisibleForPid(exitingPid, false);
    }
    // v0.711 seatKind gate: clear the multi-click detector's per-player state. The gate in
    // OngoingPlayer skipped polling while in vehicle, leaving lastIsInteracting stale; clearing
    // here means the next polling tick starts fresh so the first post-exit triple-tap counts.
    InteractMultiClickDetector.clearState(eventPlayer);
    // v0.713 re-arm: spawnTeamSwitchInteractPoint's v0.713 in-vehicle gate causes the function
    // to early-return when called from OnPlayerDeployed if the player squad-spawned into a
    // chopper. Re-call it on vehicle exit so the interact point appears once the player lands.
    // Idempotent -- internal guard at team-switch.ts:53 (interactPoint === null) makes this a
    // no-op if the interact point already exists for this player.
    void spawnTeamSwitchInteractPoint(eventPlayer);
}

//#endregion -------------------- Exported Event Handlers - Vehicle Entry + Exit --------------------



//#region -------------------- Exported Event Handlers - Vehicle Spawn + Destroy --------------------

// OnVehicleSpawned:
// Registers a spawned vehicle to the nearest main base team using its world position.
export async function OnVehicleSpawned(eventVehicle: mod.Vehicle): Promise<void> {
    // Bind vehicle to a spawner slot first; fall back to base inference if not spawned by our spawners.
    const posObject = mod.GetObjectPosition(eventVehicle);
    let slotIndex = -1;
    const activeIndex = State.vehicles.activeSpawnSlotIndex;
    const activeToken = State.vehicles.activeSpawnToken;
    const activeAt = State.vehicles.activeSpawnRequestedAtSeconds;
    if (activeIndex !== undefined && activeToken !== undefined && activeAt !== undefined) {
        const now = Math.floor(mod.GetMatchTimeElapsed());
        const expired = (now - activeAt) > VEHICLE_SPAWNER_BIND_TIMEOUT_SECONDS;
        const activeSlot = State.vehicles.slots[activeIndex];
        if (!expired && activeSlot && activeSlot.expectingSpawn && activeSlot.spawnRequestToken === activeToken) {
            slotIndex = activeIndex;
        }
    }
    if (slotIndex === -1) {
        slotIndex = findSpawnerSlotByPosition(posObject);
    }
    if (slotIndex >= 0) {
        const slot = State.vehicles.slots[slotIndex];
        if (!slot.enabled) {
            mod.UnspawnObject(eventVehicle);
            return;
        }
        if (!slot.expectingSpawn && slot.vehicleId === -1) {
            // Replace the spawner's initial default spawn with a forced spawn using the configured type.
            mod.UnspawnObject(eventVehicle);
            await mod.Wait(0.1); // Give the engine a moment to clear the spawn before forcing again.
            configureVehicleSpawner(slot.spawner, slot.vehicleType);
            const success = await forceSpawnWithRetry(slotIndex);
            if (!success) {
                void scheduleBlockedSpawnRetry(slotIndex);
            }
            return;
        }
    }

    // v0.714: apply HP multiplier + Heal IMMEDIATELY now that the vehicle is known to survive
    // (past the unspawn/replace branches above). Two reasons this moved out of its old location
    // at the bottom of the function:
    //   (1) The old position was AFTER the inferredTeam early-return at the line below "Bail
    //       out if the vehicle didn't spawn near a known team base" -- vehicles that failed team
    //       inference survived but never got SetMaxHealthMultiplier called. They displayed as
    //       "full" health but were at the engine's default max (e.g., 100), not the configured
    //       max (e.g., 130 at TWL 2v2 130%). Apply here so the mult lands on every surviving
    //       vehicle regardless of bind/inference outcome.
    //   (2) Adding Heal after SetMax defeats the engine timing race where SetMax raised the max
    //       but the engine had already set initial current to the OLD default max -- producing
    //       intermittent partial-health spawns at mults > 1.0. Heal clamps current to current
    //       max, so post-Heal the vehicle is always full at the new max.
    // try/catch already wraps for SDK safety per the BillDukes precedent.
    try {
        const mult = State.round.modeConfig.confirmed.vehicleHealthMultiplier ?? 1.0;
        mod.SetVehicleMaxHealthMultiplier(eventVehicle, mult);
        mod.Heal(eventVehicle, 99999);
    } catch (_e) {}

    // Primary path: bind to a spawner slot that is expecting this spawn.
    let inferredTeam = bindSpawnedVehicleToSlot(eventVehicle, posObject);

    if (inferredTeam === 0) {
        // Retry once after a short delay in case the spawn position hasn't settled yet.
        await mod.Wait(0.2);
        const posRetry = mod.GetObjectPosition(eventVehicle);
        inferredTeam = bindSpawnedVehicleToSlot(eventVehicle, posRetry);
    }

    const pos = mod.GetVehicleState(eventVehicle, mod.VehicleStateVector.VehiclePosition);
    const vehicleObjId = getObjId(eventVehicle);

    if (inferredTeam === 0) {
        // Fallback path: assign to the nearest main base if within bind radius.
        inferredTeam = inferBaseTeamFromPosition(pos);

        // If the spawn matched a known spawner but failed to bind, bind the slot explicitly.
        if (slotIndex >= 0) {
            const slot = State.vehicles.slots[slotIndex];
            if (slot && slot.enabled && slot.vehicleId === -1) {
                slot.expectingSpawn = false;
                slot.vehicleId = vehicleObjId;
                slot.respawnRunning = false;
                slot.spawnRetryScheduled = false;
                State.vehicles.vehicleToSlot[vehicleObjId] = slotIndex;
            }
        }
    }

    // Bail out if the vehicle didn't spawn near a known team base.
    // Unassigned spawns are not registered and will not count toward scoring/HUD.
    if (inferredTeam !== TeamID.Team1 && inferredTeam !== TeamID.Team2) {
        return;
    }

    // Cache base-team inference for later reconciliation on enter.
    vehicleSpawnBaseTeamByObjId[vehicleObjId] = inferredTeam; 

    // Reset cached owner so enter events can establish a new owner.
    clearLastDriverByVehicleObjId(vehicleObjId);

    registerVehicleToTeam(eventVehicle, inferredTeam);
    // (HP multiplier + Heal moved earlier in this function -- see v0.714 comment block above
    // for the why. Applied unconditionally to any surviving vehicle, before team inference.)
}

// OnVehicleDestroyed:
// Handles vehicle-destruction scoring logic.
// If the destroyed vehicle is registered to a team AND the round is LIVE:
// - Award +1 Round Kill to the opposing team.
// - Emit informational world log messages.
// If the round is not live:
// - No points are awarded; the vehicle is simply deregistered.
// Important:
// - Infantry deaths are ignored entirely.
// - This function is the ONLY place round vehicle kills are awarded.
export async function OnVehicleDestroyed(eventVehicle: mod.Vehicle) {
    handleOvertimeVehicleDestroyed(eventVehicle);
    const inT1 = arrayContainsVehicle(mod.GetVariable(regVehiclesTeam1), eventVehicle);
    const inT2 = arrayContainsVehicle(mod.GetVariable(regVehiclesTeam2), eventVehicle);

    // Registration is the scoring gate; unregistered vehicles are ignored.
    if (!inT1 && !inT2) {
        return;
    }

    const destroyedTeamNum = inT1 ? TeamID.Team1 : TeamID.Team2;
    const scoringTeamNum = opposingTeam(destroyedTeamNum);

    if (isRoundLive()) {
        const vehicleObjId = getObjId(eventVehicle);
        // NOTE: vehicleToSlot can be cleared by the spawner poll loop (1s tick) before this runs.
        // If that happens, the camped log may be skipped for that destruction.
        const slotIndex = State.vehicles.vehicleToSlot[vehicleObjId];
        let wasSpawnCamped = false;
        if (slotIndex !== undefined) {
            const slot = State.vehicles.slots[slotIndex];
            if (slot) {
                const spawnerPos = slot.spawnPos;
                const deathPos = mod.GetVehicleState(eventVehicle, mod.VehicleStateVector.VehiclePosition);
                const fallbackPos = mod.GetObjectPosition(eventVehicle);
                let resolvedPos = deathPos;
                if (
                    mod.XComponentOf(deathPos) === 0 &&
                    mod.YComponentOf(deathPos) === 0 &&
                    mod.ZComponentOf(deathPos) === 0
                ) {
                    resolvedPos = fallbackPos;
                }
                const d = mod.DistanceBetween(resolvedPos, spawnerPos);
                if (d <= VEHICLE_CAMPED_DISTANCE_METERS) {
                    wasSpawnCamped = true;
                    const teamNameKey = getTeamNameKey(destroyedTeamNum);
                    const x = Math.floor(mod.XComponentOf(resolvedPos));
                    sendHighlightedWorldLogMessage(
                        mod.Message(mod.stringkeys.twl.messages.vehicleCampedInMainBase, teamNameKey, x),
                        true,
                        undefined,
                        mod.stringkeys.twl.messages.vehicleCampedInMainBase
                    );
                }
            }
        }

        if (!wasSpawnCamped) {
            if (scoringTeamNum === TeamID.Team1) {
                State.scores.t1RoundKills = State.scores.t1RoundKills + 1;
            } else if (scoringTeamNum === TeamID.Team2) {
                State.scores.t2RoundKills = State.scores.t2RoundKills + 1;
            }

            // Update round kills HUD immediately.
            syncRoundKillsHud();

            // End the round immediately if a team reaches the configured round-kills target.
            if (State.scores.t1RoundKills >= State.round.killsTarget || State.scores.t2RoundKills >= State.round.killsTarget) {
                endRound(undefined, getRemainingSeconds());
            }

            if (scoringTeamNum === TeamID.Team1) {
                State.scores.t1TotalKills = Math.floor(State.scores.t1TotalKills) + 1;
            } else if (scoringTeamNum === TeamID.Team2) {
                State.scores.t2TotalKills = Math.floor(State.scores.t2TotalKills) + 1;
            }

            // Update top HUD kills counters.
            syncKillsHudFromTrackedTotals(false);
        }

        mod.SetVariable(regVehiclesTeam1, arrayRemoveVehicle(mod.GetVariable(regVehiclesTeam1), eventVehicle));
        mod.SetVariable(regVehiclesTeam2, arrayRemoveVehicle(mod.GetVariable(regVehiclesTeam2), eventVehicle));

        const owner = popLastDriver(eventVehicle);

        // Conquest CQ_Bug_37/38 cache-guard pattern: proactively flip isAliveByPid to false
        // for the vehicle's last driver (likely victim) so per-tick callsites skip
        // safeGetSoldierState* calls before OnPlayerUndeploy fires. Closes the race window
        // for the most common Helis death scenario (vehicle destroyed -> driver dies).
        if (owner && mod.IsPlayerValid(owner)) {
            const ownerPid = safeGetPlayerId(owner);
            if (ownerPid !== undefined) {
                State.players.isAliveByPid[ownerPid] = false;
            }
        }

        // Legacy delay removed; send kill message immediately to avoid deferred crash window.
        // await mod.Wait(3.0);

        if (!wasSpawnCamped) {
            const roundKills = (scoringTeamNum === TeamID.Team1) ? State.scores.t1RoundKills : State.scores.t2RoundKills;
            const teamNameKey = (scoringTeamNum === TeamID.Team1) ? getTeamNameKey(TeamID.Team1) : getTeamNameKey(TeamID.Team2);
            const ownerNameOrKey = owner
                ? (mod.IsPlayerValid(owner) ? owner : mod.stringkeys.twl.system.unknownPlayer)
                : mod.stringkeys.twl.system.unassigned;

            sendHighlightedWorldLogMessage(
                mod.Message(mod.stringkeys.twl.messages.pointAwardedWithOwner, teamNameKey, ownerNameOrKey, Math.floor(roundKills)),
                true,
                mod.GetTeam(TeamID.Team1),
                mod.stringkeys.twl.messages.pointAwardedWithOwner
            );
            sendHighlightedWorldLogMessage(
                mod.Message(mod.stringkeys.twl.messages.pointAwardedWithOwner, teamNameKey, ownerNameOrKey, Math.floor(roundKills)),
                true,
                mod.GetTeam(TeamID.Team2),
                mod.stringkeys.twl.messages.pointAwardedWithOwner
            );
        }

        return;
    }

    // Round is not live: clean up registration, but do not award points or increment counters.
    mod.SetVariable(regVehiclesTeam1, arrayRemoveVehicle(mod.GetVariable(regVehiclesTeam1), eventVehicle));
    mod.SetVariable(regVehiclesTeam2, arrayRemoveVehicle(mod.GetVariable(regVehiclesTeam2), eventVehicle));

    const owner = popLastDriver(eventVehicle);

    // Legacy delay removed; send kill message immediately to avoid deferred crash window.
    // await mod.Wait(3.0);

    const destroyedTeamNameKey = (destroyedTeamNum === TeamID.Team1) ? getTeamNameKey(TeamID.Team1) : getTeamNameKey(TeamID.Team2);
    const ownerNameOrKey = owner
        ? (mod.IsPlayerValid(owner) ? owner : mod.stringkeys.twl.system.unknownPlayer)
        : mod.stringkeys.twl.system.unassigned;

    sendHighlightedWorldLogMessage(
        mod.Message(mod.stringkeys.twl.messages.vehicleDestroyedNotLive, ownerNameOrKey, destroyedTeamNameKey),
        true,
        mod.GetTeam(TeamID.Team1),
        mod.stringkeys.twl.messages.vehicleDestroyedNotLive
    );
    sendHighlightedWorldLogMessage(
        mod.Message(mod.stringkeys.twl.messages.vehicleDestroyedNotLive, ownerNameOrKey, destroyedTeamNameKey),
        true,
        mod.GetTeam(TeamID.Team2),
        mod.stringkeys.twl.messages.vehicleDestroyedNotLive
    );
}

//#endregion -------------------- Exported Event Handlers - Vehicle Spawn + Destroy --------------------



//#region -------------------- Enter/Exit Triggers --------------------

// CapturePoint tick: keep engine capture suppressed while we use CPs as markers only.
export function OngoingCapturePoint(eventCapturePoint: mod.CapturePoint): void {
    try {
        if (!eventCapturePoint) return;
        if (!State.flag.configValid) return;
        if (State.flag.stage < OvertimeStage.Visible) return;
        if (!isActiveOvertimeCapturePoint(eventCapturePoint)) return;
        applyOvertimeCapturePointSuppression(eventCapturePoint);
        setOvertimeCapturePointOwner(eventCapturePoint, 0);
    } catch {
        return;
    }
}

export function OnPlayerEnterAreaTrigger(eventPlayer: mod.Player, eventAreaTrigger: mod.AreaTrigger) {
    try {
        if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;

        const triggerId = safeGetObjId(eventAreaTrigger);
        if (triggerId === undefined) return;
        if (State.flag.activeAreaTriggerId !== undefined && triggerId === State.flag.activeAreaTriggerId) {
            // Overtime zones are AreaTrigger-driven; tracking is enabled from round start.
            if (mod.IsPlayerValid(eventPlayer)) {
                handleOvertimePlayerEnterZone(eventPlayer);
            }
        }

        if (IsPlayerInOwnMainBase(eventPlayer, eventAreaTrigger)) {
            // track per-player main base state for UI display (authoritative gating comes later).
            State.players.inMainBaseByPid[mod.GetObjId(eventPlayer)] = true;
            renderReadyDialogForAllVisibleViewers();
            BroadcastMainBaseEvent(STR_ENTERED_MAIN_BASE, eventPlayer);
            RestockGadgetAmmo(eventPlayer, RESTOCK_MAG_AMMO_ENTER);
            NotifyAmmoRestocked(eventPlayer);
        }
    } catch {
        return;
    }
}

export function OnPlayerExitAreaTrigger(eventPlayer: mod.Player, eventAreaTrigger: mod.AreaTrigger) {
    try {
        if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;

        const triggerId = safeGetObjId(eventAreaTrigger);
        if (triggerId === undefined) return;
        if (State.flag.activeAreaTriggerId !== undefined && triggerId === State.flag.activeAreaTriggerId) {
            // Overtime zones are AreaTrigger-driven; tracking is enabled from round start.
            if (mod.IsPlayerValid(eventPlayer)) {
                handleOvertimePlayerExitZone(eventPlayer);
            }
        }

        if (!isPlayerDeployed(eventPlayer)) return;

        if (IsPlayerInOwnMainBase(eventPlayer, eventAreaTrigger)) {
            State.players.inMainBaseByPid[mod.GetObjId(eventPlayer)] = false;
            // Pre-round gating:: if the round is NOT active, leaving the main base forces the player back to NOT READY.
            if (!isRoundLive()) {
                State.players.readyByPid[mod.GetObjId(eventPlayer)] = false;
                // Keep the HUD "X / Y PLAYERS READY" line in sync when leaving main base forces NOT READY.
                updatePlayersReadyHudTextForAllPlayers();
                updateHelpTextVisibilityForPlayer(eventPlayer);
                if (State.round.countdown.isRequested) {
                    cancelPregameCountdown();
                    void showOverLineMessageForAllPlayers(eventPlayer);
                }
                // Player-only warning: they were ready, but left main base before the round went live.
                // This is intentionally not broadcast globally; it is actionable guidance for the individual player.
                sendHighlightedWorldLogMessage(
                    mod.Message(STR_READYUP_RETURN_TO_BASE_NOT_LIVE, Math.floor(State.round.current)),
                    false,
                    eventPlayer,
                    STR_READYUP_RETURN_TO_BASE_NOT_LIVE
                );
            }
            renderReadyDialogForAllVisibleViewers();
            BroadcastMainBaseEvent(STR_EXITED_MAIN_BASE, eventPlayer);
            RestockGadgetAmmo(eventPlayer, RESTOCK_MAG_AMMO_EXIT);
            NotifyAmmoRestocked(eventPlayer);
        }
    } catch {
        return;
    }
}

//#endregion ----------------- Enter/Exit Triggers --------------------
