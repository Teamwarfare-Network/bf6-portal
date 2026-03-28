// @ts-nocheck
// Module: index/player-loop-inputs -- per-tick player loop and input event routing

//#region -------------------- Exported Event Handlers - Player Loop + UI Inputs --------------------

// Performance note:
// - OngoingPlayer executes frequently; keep it lightweight!
// - Avoid FindUIWidget calls or per-tick loops over all players/vehicles unless strictly necessary.
// - Prefer "update only when changed" patterns for HUD/clock refreshes.
function ongoingPlayerImpl(eventPlayer: mod.Player): void {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    if (isPlayerDeployed(eventPlayer)) {
        checkReadyDialogInteractPointRemoval(eventPlayer);
    }

    const pid = safeGetPlayerId(eventPlayer);
    if (pid === undefined) return;

    if (isPlayerDeployed(eventPlayer)) {
        if (InteractMultiClickDetector.checkMultiClick(eventPlayer)) {
            armJoinPromptTripleTapForPid(pid);
            spawnReadyDialogInteractPoint(eventPlayer);
            //mod.DisplayHighlightedWorldLogMessage(mod.Message(mod.stringkeys.twl.notifications.multiclickDetector), mod.GetTeam(eventPlayer));
        }
    }
}

// Routes interact-point activation events into Ready Dialog interaction handler.
function onPlayerInteractImpl(eventPlayer: mod.Player, eventInteractPoint: mod.InteractPoint) {
    if (tryHandleWorldInteractableActivation(eventPlayer, eventInteractPoint)) return;
    teamSwitchInteractPointActivated(eventPlayer, eventInteractPoint);
}

// Routes UI button events through join prompt first, then Ready Dialog action handling.
function onPlayerUIButtonEventImpl(eventPlayer: mod.Player, eventUIWidget: mod.UIWidget, eventUIButtonEvent: mod.UIButtonEvent) {
    if (tryHandleJoinPromptButton(eventPlayer, eventUIWidget, eventUIButtonEvent)) return;
    teamSwitchButtonEvent(eventPlayer, eventUIWidget, eventUIButtonEvent);
}

//#endregion -------------------- Exported Event Handlers - Player Loop + UI Inputs --------------------
