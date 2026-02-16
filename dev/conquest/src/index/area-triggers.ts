// @ts-nocheck
// Module: index/area-triggers -- capture-point tick suppression and main-base trigger handlers

//#region -------------------- Enter/Exit Triggers --------------------

// CapturePoint tick: keep engine capture suppressed while we use CPs as markers only.
function ongoingCapturePointImpl(eventCapturePoint: mod.CapturePoint): void {
    return;
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
            if (!isRoundLive()) {
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
                    mod.Message(STR_READYUP_RETURN_TO_BASE_NOT_LIVE, Math.floor(State.round.current)),
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
