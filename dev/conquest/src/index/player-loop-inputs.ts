// @ts-nocheck

function ongoingPlayerImpl(eventPlayer: mod.Player): void {
    if (!isValidPlayer(eventPlayer)) return;
    if (!isPlayerDeployed(eventPlayer)) return;
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
