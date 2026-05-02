// @ts-nocheck

async function deferForcedUndeploy(player: mod.Player, reason: string): Promise<void> {
    try {
        await mod.Wait(0.1);
        if (!isValidPlayer(player)) return;
        const pid = safeGetPlayerId(player);
        mod.UndeployPlayer(player);
    } catch {
    }
}

async function onPlayerDeployedImpl(eventPlayer: mod.Player) {
    const pid = safeGetPlayerId(eventPlayer);
    if (pid === undefined) return;
    if (!State.players.readyDialogData[pid]) initReadyDialogData(eventPlayer);
    mod.SetRedeployTime(eventPlayer, 0);
    const deployedTeam = safeGetTeamNumberFromPlayer(eventPlayer, 0);
    if (deployedTeam === TeamID.Team1 || deployedTeam === TeamID.Team2) {
        State.conquest.debug.perspectiveTeamByPid[pid] = deployedTeam;
    }
    setUIInputModeForPlayer(eventPlayer, false);
    if (State.round.flow.cleanupActive && !State.round.flow.cleanupAllowDeploy) {
        State.players.deployedByPid[pid] = false;
        markNextDeployReason(pid, "phase_transition");
        await deferForcedUndeploy(eventPlayer, "cleanup");
        return;
    }

    const wasAlreadyDeployed = !!State.players.deployedByPid[pid];
    onPlayerDeployedSpawnCharge(eventPlayer, wasAlreadyDeployed);
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
    if (!isValidPlayer(eventPlayer)) return;
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

// Cleans up deployed state.
function onPlayerUndeployImpl(eventPlayer: mod.Player) {
    if (!isValidPlayer(eventPlayer)) return;
    const pid = safeGetPlayerId(eventPlayer);
    if (pid === undefined) return;
    if (isPidDisconnected(pid)) return;
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
    captureSoundOnPlayerLeaveOrResetPid(pid);
    captureVoOnPlayerLeaveOrResetPid(pid);
    twlConquestHudHideObjectiveFocusForPid(pid);
    markHudDirty();
    cleanupWorldInteractableRuntimeIconsForPid(pid);
    if (State.players.readyDialogData[pid]?.dialogVisible) {
        hideReadyDialogUI(eventPlayer);
    }
    closeArmMenu(eventPlayer);
    closeVehicleDeployLiveMenuForPlayer(eventPlayer);
    removeReadyDialogInteractPoint(pid);

    // CQ_Bug_44: proactively refresh the deploy timer HUD on undeploy so the Ground/Air
    // deploy rows appear immediately on the deploy screen. Without this, the HUD cache is
    // still in its "alive + hidden" state and only heals on the next discrete vehicle event
    // (respawn timer, etc) or the 1s live-tick re-assertion (which is live-only).
    updateVehicleDeployTimerHudForPlayer(eventPlayer);
}


