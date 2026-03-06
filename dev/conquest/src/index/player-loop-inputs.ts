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

    // UI caching warm-up: build the Ready Up dialog once per player so the first real open is snappy.
    // We build and immediately hide; the dialog becomes visible only when the player opens it via the interact point.
    const pid = safeGetPlayerId(eventPlayer);
    if (pid === undefined) return;
    if (State.players.readyDialogData[pid] && !State.players.readyDialogData[pid].uiBuilt) {
        createReadyDialogUI(eventPlayer);
        // Ensure the warm-up build does not count as "open" for refresh logic.
        State.players.readyDialogData[pid].dialogVisible = false;
        hideReadyDialogUI(eventPlayer); // now hides (cached) rather than deleting
        State.players.readyDialogData[pid].uiBuilt = true;
    }

    if (isPlayerDeployed(eventPlayer)) {
        if (InteractMultiClickDetector.checkMultiClick(eventPlayer)) {
            armJoinPromptTripleTapForPid(pid);
            spawnReadyDialogInteractPoint(eventPlayer);
            //mod.DisplayHighlightedWorldLogMessage(mod.Message(mod.stringkeys.twl.notifications.multiclickDetector), mod.GetTeam(eventPlayer));
        }
    }
}

function onPlayerInteractImpl(eventPlayer: mod.Player, eventInteractPoint: mod.InteractPoint) {
    teamSwitchInteractPointActivated(eventPlayer, eventInteractPoint);
}

function onPlayerUIButtonEventImpl(eventPlayer: mod.Player, eventUIWidget: mod.UIWidget, eventUIButtonEvent: mod.UIButtonEvent) {
    if (tryHandleJoinPromptButton(eventPlayer, eventUIWidget, eventUIButtonEvent)) return;
    teamSwitchButtonEvent(eventPlayer, eventUIWidget, eventUIButtonEvent);
}

//#endregion -------------------- Exported Event Handlers - Player Loop + UI Inputs --------------------
