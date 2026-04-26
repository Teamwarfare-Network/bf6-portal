// @ts-nocheck

async function deferForcedUndeploy(player: mod.Player, reason: string): Promise<void> {
    try {
        await mod.Wait(0.1);
        if (!player || !mod.IsPlayerValid(player)) return;
        const pid = safeGetPlayerId(player);
        mod.UndeployPlayer(player);
    } catch {
    }
}

// Handles the "deployed before release" race by freezing the player immediately and forcing them back to deploy.
async function handlePlayerDeployedBeforeRelease(eventPlayer: mod.Player, pid: number): Promise<void> {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    reassertPlayerUiLoadingGateVisuals(eventPlayer, pid);
    setAllInputRestrictionsForPlayer(eventPlayer, true);
    try {
        mod.UndeployPlayer(eventPlayer);
    } catch {
    }
    await deferForcedUndeploy(eventPlayer, "hud_warm_pending");
}

// Reasserts the loading overlay after the deploy-screen transition has taken ownership so team-swap load is actually visible.
async function reassertUiLoadingAfterUndeploy(eventPlayer: mod.Player): Promise<void> {
    await mod.Wait(0);
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    const pid = safeGetPlayerId(eventPlayer);
    if (pid === undefined) return;
    if (!isUiLoadGateActiveForPid(pid)) return;
    reassertPlayerUiLoadingGateVisuals(eventPlayer, pid);
}

async function onPlayerDeployedImpl(eventPlayer: mod.Player) {
    const pid = safeGetPlayerId(eventPlayer);
    if (pid === undefined) return;
    if (!State.players.readyDialogData[pid]) initReadyDialogData(eventPlayer);
    // Unified gate check: if gate is still active (not yet released), recapture.
    // Dual-guard invariant: active || !released covers both pre-release and released-but-not-authorized windows.
    if (isUiLoadGateActiveForPid(pid) || !isUiLoadGateReleasedForPid(pid)) {
        State.players.deployedByPid[pid] = false;
        await handlePlayerDeployedBeforeRelease(eventPlayer, pid);
        return;
    }
    invalidateHudWarmTokenForPid(pid);
    mod.SetRedeployTime(eventPlayer, 0);
    const deployedTeam = safeGetTeamNumberFromPlayer(eventPlayer, 0);
    if (deployedTeam === TeamID.Team1 || deployedTeam === TeamID.Team2) {
        State.conquest.debug.perspectiveTeamByPid[pid] = deployedTeam;
    }
    setUIInputModeForPlayer(eventPlayer, false);
    if (State.round.flow.cleanupActive && !State.round.flow.cleanupAllowDeploy) {
        State.players.deployedByPid[pid] = false;
        conquestPhase2BMarkNextDeployReason(pid, "phase_transition");
        await deferForcedUndeploy(eventPlayer, "cleanup");
        return;
    }

    const wasAlreadyDeployed = !!State.players.deployedByPid[pid];
    conquestPhase2BOnPlayerDeployed(eventPlayer, wasAlreadyDeployed);
    State.players.deployedByPid[pid] = true;
    invalidateVehicleDeployTimerHudViewerCache(pid);
    updateHudTeamSwapButtonVisibilityForPid(pid);
    // posDebugVehicleObjIdByPid cache is owned by OnPlayerEnter/ExitVehicle events
    // (vehicle-events.ts). The deploy-time GetVehicleFromPlayer seed was removed at v1.374
    // because the cache is consumed only by FEATURE_POSITION_DEBUG-gated code (off in
    // production for 80+ versions) and the engine call produced "invalid value" log spam
    // during deploy timing races (#93). Boundary classification is event-driven via seatKind
    // (v1.369) and does not depend on this cache.
    State.conquest.debug.teamSwapHudResetPendingByPid[pid] = false;
    State.players.readyByPid[pid] = false;
    delete State.players.readyNeedsReconfirmByPid[pid];
    // resetPlayerBoundaryStateOnDeploy drops zoneStateByPid + sets inMainBaseByPid=false +
    // stamps deployedAtSecondsByPid for the grace window. The synchronous HQ trigger enter
    // event for HQ-deploy spawns flips the matching flag to true via updateZoneStateOnTriggerTransition.
    resetPlayerBoundaryStateOnDeploy(eventPlayer, pid);
    setMatchStateTextForPid(pid);
    updateHelpTextVisibilityForPid(pid);
    markPregameReadyHudDirty();
    markPregameDialogDirty();
    markPregameHelpDirty();

    if (!State.hudCache.topHudShellByPid[pid]) {
        ensureTopHudShellForPlayer(eventPlayer);
    }
    renderCriticalHudForReveal(eventPlayer, pid);
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    // inMainBaseByPid is owned by updateZoneStateOnTriggerTransition (mirrored from inOwnHQ)
    // and was reset to false by resetPlayerBoundaryStateOnDeploy above. The synchronous HQ
    // trigger enter event for HQ-deploy spawns flips it back to true; non-HQ spawns leave it
    // false. Do not write here -- distance-based classification was the v1.358-v1.359 bug.
    syncWorldInteractableRuntimeIconsForPlayer(eventPlayer);
    refreshWorldInteractableVfx();
    if (!State.players.kpiByPid[pid]) {
        kpiInitWithBaselineForPlayer(eventPlayer, pid);
    }
    updateScoreboardForPlayer(eventPlayer);
    // HQ Deploy seat hook (Phase 4): if a pending HQ claim is seat_pending for this pid,
    // call mod.ForcePlayerToSeat inside the OnPlayerDeployed event chain (BountyHunter
    // context -- the only reliable one for ForcePlayerToSeat on freshly-deployed players).
    try { onHqSeatPendingPlayerDeployed(eventPlayer, pid); } catch {}
    await spawnReadyDialogInteractPoint(eventPlayer);
}

// Cleans up deployed state. If a loading gate is active, reasserts overlay + deploy block without starting new warm.
function onPlayerUndeployImpl(eventPlayer: mod.Player) {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    const pid = safeGetPlayerId(eventPlayer);
    if (pid === undefined) return;
    if (isPidDisconnected(pid)) return;
    // Clear script-side restriction tracking without calling engine — player is already undeployed
    // and the engine rejects EnableAllInputRestrictions on undeployed players (CQ_Bug_35).
    recordUiLoadInputRestrictedForPid(pid, false);
    State.players.deployedByPid[pid] = false;
    // Clear vehicle slot ownership — OnPlayerExitVehicle does not fire on undeploy/death.
    for (let i = 0; i < State.vehicles.slots.length; i++) {
        if (State.vehicles.slots[i].activeOwnerPid === pid) {
            State.vehicles.slots[i].activeOwnerPid = undefined;
            updateVehicleDeployTimerHudForAllPlayers();
            break;
        }
    }
    updateHudTeamSwapButtonVisibilityForPid(pid);
    State.players.inMainBaseByPid[pid] = false;
    State.players.posDebugTransformSourceByPid[pid] = "soldier";
    delete State.players.posDebugVehicleObjIdByPid[pid];
    State.conquest.debug.engageHiddenUntilDeployByPid[pid] = true;
    delete State.conquest.capture.engagedObjIdByPid[pid];
    resetPlayerBoundaryStateOnUndeployOrReset(pid);
    conquestPhase4OnPlayerLeaveOrResetPid(pid);
    conquestPhase4BOnPlayerLeaveOrResetPid(pid);
    twlConquestHudHideObjectiveFocusForPid(pid);
    conquestPhase3MarkHudDirty();
    cleanupWorldInteractableRuntimeIconsForPid(pid);
    if (State.players.readyDialogData[pid]?.dialogVisible) {
        hideReadyDialogUI(eventPlayer);
    }
    closeArmMenu(eventPlayer);
    closeVehicleDeployLiveMenuForPlayer(eventPlayer);
    removeReadyDialogInteractPoint(pid);

    // If any loading gate is active (join or team_swap), reassert overlay + deploy block.
    // The running gate loop owns warm — do not start a new warm pass here.
    if (isUiLoadGateActiveForPid(pid)) {
        reassertPlayerUiLoadingGateVisuals(eventPlayer, pid);
        void reassertUiLoadingAfterUndeploy(eventPlayer);
        return;
    }

    // CQ_Bug_44: proactively refresh the deploy timer HUD on undeploy so the Ground/Air
    // deploy rows appear immediately on the deploy screen. Without this, the HUD cache is
    // still in its "alive + hidden" state and only heals on the next discrete vehicle event
    // (respawn timer, etc) or the 1s live-tick re-assertion (which is live-only).
    updateVehicleDeployTimerHudForPlayer(eventPlayer);
}


