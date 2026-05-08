// @ts-nocheck

function ongoingPlayerImpl(eventPlayer: mod.Player): void {
    if (!isValidPlayer(eventPlayer)) return;
    if (!isPlayerDeployed(eventPlayer)) return;

    // Spectator triple-tap exit. Routes the spectator's triple-tap to exitSpectatorMode
    // and returns early so a sealed-in-cube body cannot also spawn a ReadyDialogInteractPoint.
    const pid = safeGetPlayerId(eventPlayer);
    if (pid !== undefined && isSpectator(pid)) {
        if (InteractMultiClickDetector.checkMultiClick(eventPlayer)) exitSpectatorMode(eventPlayer, pid);
        return;
    }

    checkReadyDialogInteractPointRemoval(eventPlayer);
    if (InteractMultiClickDetector.checkMultiClick(eventPlayer)) spawnReadyDialogInteractPoint(eventPlayer);
}

function onPlayerInteractImpl(eventPlayer: mod.Player, eventInteractPoint: mod.InteractPoint) {
    if (tryHandleWorldInteractableActivation(eventPlayer, eventInteractPoint)) return;
    teamSwitchInteractPointActivated(eventPlayer, eventInteractPoint);
}

function onPlayerUIButtonEventImpl(eventPlayer: mod.Player, eventUIWidget: mod.UIWidget, eventUIButtonEvent: mod.UIButtonEvent) {
    teamSwitchButtonEvent(eventPlayer, eventUIWidget, eventUIButtonEvent);
}
