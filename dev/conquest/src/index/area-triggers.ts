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
        conquestPhase3MarkHudDirty();
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
        conquestPhase3ForceHideEngageWidgetsForPid(pid);
        conquestPhase3MarkHudDirty();
    } catch {
        return;
    }
}

function onPlayerEnterAreaTriggerImpl(eventPlayer: mod.Player, eventAreaTrigger: mod.AreaTrigger) {
    try {
        if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;

        if (IsPlayerInOwnMainBase(eventPlayer, eventAreaTrigger)) {
            // track per-player main base state for UI display (authoritative gating comes later).
            State.players.inMainBaseByPid[mod.GetObjId(eventPlayer)] = true;
            renderReadyDialogForAllVisibleViewers();
        }
    } catch {
        return;
    }
}

function onPlayerExitAreaTriggerImpl(eventPlayer: mod.Player, eventAreaTrigger: mod.AreaTrigger) {
    try {
        if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;

        if (!isPlayerDeployed(eventPlayer)) return;

        if (IsPlayerInOwnMainBase(eventPlayer, eventAreaTrigger)) {
            State.players.inMainBaseByPid[mod.GetObjId(eventPlayer)] = false;
            // Pre-live gating: if phase is NOT active, leaving main base forces NOT READY.
            if (!isMatchLive()) {
                State.players.readyByPid[mod.GetObjId(eventPlayer)] = false;
                // Keep the HUD "X / Y PLAYERS READY" line in sync when leaving main base forces NOT READY.
                updatePlayersReadyHudTextForAllPlayers();
                updateHelpTextVisibilityForPlayer(eventPlayer);
                if (State.round.countdown.isRequested) {
                    cancelPregameCountdown();
                }
                // Player-only warning: they were ready, but left main base before live started.
                // This is intentionally not broadcast globally; it is actionable guidance for the individual player.
                sendHighlightedWorldLogMessage(
                    mod.Message(STR_READYUP_RETURN_TO_BASE_NOT_LIVE),
                    false,
                    eventPlayer,
                    STR_READYUP_RETURN_TO_BASE_NOT_LIVE
                );
            }
            renderReadyDialogForAllVisibleViewers();
        }
    } catch {
        return;
    }
}

//#endregion ----------------- Enter/Exit Triggers --------------------
