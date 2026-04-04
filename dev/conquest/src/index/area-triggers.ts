// @ts-nocheck
// Module: index/area-triggers -- capture-point tick suppression and main-base trigger handlers

//#region -------------------- Enter/Exit Triggers --------------------

// CapturePoint tick: Phase 2A reads engine capture ownership/progress and routes to ticket/debug state.
function ongoingCapturePointImpl(eventCapturePoint: mod.CapturePoint): void {
    conquestPhase2AOnCapturePointTick(eventCapturePoint);
}

// CapturePoint lost edge: ownership has dropped to neutral.
function onCapturePointLostImpl(eventCapturePoint: mod.CapturePoint): void {
    conquestPhase2AOnCapturePointLost(eventCapturePoint);
}

// CapturePoint captured edge: a team has fully acquired ownership.
function onCapturePointCapturedImpl(eventCapturePoint: mod.CapturePoint): void {
    conquestPhase2AOnCapturePointCaptured(eventCapturePoint);
}

// Returns true when an objective ObjId is part of the active mapped conquest point set.
function isMappedConquestCapturePointObjId(objId: number): boolean {
    const mapped = State.conquest.capture.mappedObjIdsInOrder;
    for (let i = 0; i < mapped.length; i++) {
        if (mapped[i] === objId) return true;
    }
    return false;
}

// Capture-point enter is authoritative for engage HUD ownership.
function onPlayerEnterCapturePointImpl(eventPlayer: mod.Player, eventCapturePoint: mod.CapturePoint): void {
    try {
        if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
        if (!eventCapturePoint) return;
        const pid = safeGetPlayerId(eventPlayer);
        if (pid === undefined) return;
        const objId = safeGetObjId(eventCapturePoint);
        if (objId === undefined) return;
        if (!isMappedConquestCapturePointObjId(objId)) return;
        State.conquest.capture.engagedObjIdByPid[pid] = objId;
        // Refresh capture-point sample immediately so engage counts + popout/top-row visual state
        // do not wait for the next global live-tick polling pass.
        conquestPhase2AOnCapturePointTick(eventCapturePoint);
        conquestPhase3MarkHudDirty();
        // Enter/exit should feel atomic: apply top row + popout + engage in one immediate pass.
        updateConquestCombatHudForAllPlayers(true);
    } catch {
        return;
    }
}

// Capture-point exit clears engage HUD ownership for the exiting objective.
function onPlayerExitCapturePointImpl(eventPlayer: mod.Player, eventCapturePoint: mod.CapturePoint): void {
    try {
        if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
        const pid = safeGetPlayerId(eventPlayer);
        if (pid === undefined) return;
        const currentObjId = State.conquest.capture.engagedObjIdByPid[pid];
        if (currentObjId === undefined) return;
        const exitingObjId = safeGetObjId(eventCapturePoint);
        if (exitingObjId !== undefined && currentObjId !== exitingObjId) return;
        delete State.conquest.capture.engagedObjIdByPid[pid];
        conquestPhase3MarkHudDirty();
        // Enter/exit should feel atomic: apply top row + popout + engage in one immediate pass.
        updateConquestCombatHudForAllPlayers(true);
    } catch {
        return;
    }
}

// Main-base enter updates per-player base-state used by pre-live UI gating.
function onPlayerEnterAreaTriggerImpl(eventPlayer: mod.Player, eventAreaTrigger: mod.AreaTrigger) {
    try {
        if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;

        if (IsPlayerInOwnMainBase(eventPlayer, eventAreaTrigger)) {
            // track per-player main base state for UI display (authoritative gating comes later).
            const pid = safeGetPlayerId(eventPlayer);
            if (pid !== undefined) {
                State.players.inMainBaseByPid[pid] = true;
            }
            refreshPlayerBoundaryState(eventPlayer);
            refreshReadyStatusForAllBuiltReadyDialogs();
            renderReadyDialogForAllVisibleViewers();
            syncWorldInteractableRuntimeIconsForPlayer(eventPlayer);
        }

        updateWorldInteractableAreaTriggerMembershipForPlayer(eventPlayer, eventAreaTrigger, true);
        onPlayerEnterBoundaryAreaTrigger(eventPlayer, eventAreaTrigger);
    } catch {
        return;
    }
}

// Main-base exit enforces pre-live "not ready" behavior when a player leaves base.
// Main-base flag is cleared unconditionally so undeploy/death inside base cannot leave stale state.
function onPlayerExitAreaTriggerImpl(eventPlayer: mod.Player, eventAreaTrigger: mod.AreaTrigger) {
    try {
        if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;

        // Always clear main-base flag regardless of deploy/alive state so it cannot go stale.
        if (IsPlayerInOwnMainBase(eventPlayer, eventAreaTrigger)) {
            const pid = safeGetPlayerId(eventPlayer);
            if (pid !== undefined) {
                State.players.inMainBaseByPid[pid] = false;
                syncWorldInteractableRuntimeIconsForPlayer(eventPlayer);
            }
        }

        if (!isPlayerDeployed(eventPlayer)) return;
        if (!safeGetSoldierStateBool(eventPlayer, mod.SoldierStateBool.IsAlive, false)) return;

        if (IsPlayerInOwnMainBase(eventPlayer, eventAreaTrigger)) {
            if (!isMatchLive()) {
                const pid = safeGetPlayerId(eventPlayer);
                if (pid !== undefined) {
                    notePreliveMainBaseViolation(eventPlayer, pid);
                }
            }
            refreshPlayerBoundaryState(eventPlayer);
            refreshReadyStatusForAllBuiltReadyDialogs();
            renderReadyDialogForAllVisibleViewers();
        }

        updateWorldInteractableAreaTriggerMembershipForPlayer(eventPlayer, eventAreaTrigger, false);
        onPlayerExitBoundaryAreaTrigger(eventPlayer, eventAreaTrigger);
    } catch {
        return;
    }
}

//#endregion ----------------- Enter/Exit Triggers --------------------

