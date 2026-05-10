// @ts-nocheck

function ongoingPlayerImpl(eventPlayer: mod.Player): void {
    if (!isValidPlayer(eventPlayer)) return;
    if (!isPlayerDeployed(eventPlayer)) return;

    // Spectator triple-tap exit. Routes the spectator's triple-tap to exitSpectatorMode
    // and returns early so a sealed-in-cube body cannot also spawn a ReadyDialogInteractPoint.
    // Disabled while the pregame countdown is running: an accidental triple-tap during the
    // 10-second countdown should not yank the spec out and miss the LIVE transition. The
    // detector still ticks so the click-counter state stays in sync with the spec's actual
    // presses; only the exit dispatch is gated.
    const pid = safeGetPlayerId(eventPlayer);
    if (pid !== undefined && isSpectator(pid)) {
        const tripleTap = InteractMultiClickDetector.checkMultiClick(eventPlayer);
        if (tripleTap && !State.round.countdown.isActive) exitSpectatorMode(eventPlayer, pid);
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
