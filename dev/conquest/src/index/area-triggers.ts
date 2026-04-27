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

// CapturePoint captured edge: a team has fully acquired ownership. Awards KPI capture credit.
function onCapturePointCapturedImpl(eventCapturePoint: mod.CapturePoint): void {
    conquestPhase2AOnCapturePointCaptured(eventCapturePoint);
    onCapturePointCapturedKpiImpl(eventCapturePoint);
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
        if (!isValidPlayer(eventPlayer)) return;
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
        if (!isValidPlayer(eventPlayer)) return;
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

// Routes every area-trigger enter to the boundary single-update path. The own-HQ branch
// fires UI-side refreshes (ready dialog, world interactable icons) when applicable; all
// boundary-flag writes are owned by updateZoneStateOnTriggerTransition (called via
// onPlayerEnterBoundaryAreaTrigger below) so this handler never touches inMainBaseByPid.
function onPlayerEnterAreaTriggerImpl(eventPlayer: mod.Player, eventAreaTrigger: mod.AreaTrigger) {
    try {
        if (!isValidPlayer(eventPlayer)) return;

        onPlayerEnterBoundaryAreaTrigger(eventPlayer, eventAreaTrigger);

        if (IsPlayerInOwnMainBase(eventPlayer, eventAreaTrigger)) {
            refreshReadyStatusForAllBuiltReadyDialogs();
            renderReadyDialogForAllVisibleViewers();
            syncWorldInteractableRuntimeIconsForPlayer(eventPlayer);
        }
    } catch {
        return;
    }
}

// Routes every area-trigger exit to the boundary single-update path, then handles the pre-live
// own-HQ violation side-effects (notePreliveMainBaseViolation + ready-dialog refresh) for the
// own-HQ trigger only. Boundary-flag writes are owned by updateZoneStateOnTriggerTransition.
function onPlayerExitAreaTriggerImpl(eventPlayer: mod.Player, eventAreaTrigger: mod.AreaTrigger) {
    try {
        if (!isValidPlayer(eventPlayer)) return;

        onPlayerExitBoundaryAreaTrigger(eventPlayer, eventAreaTrigger);

        if (IsPlayerInOwnMainBase(eventPlayer, eventAreaTrigger)) {
            syncWorldInteractableRuntimeIconsForPlayer(eventPlayer);
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
            refreshReadyStatusForAllBuiltReadyDialogs();
            renderReadyDialogForAllVisibleViewers();
        }
    } catch {
        return;
    }
}

//#endregion ----------------- Enter/Exit Triggers --------------------

