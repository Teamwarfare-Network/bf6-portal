// @ts-nocheck
const UI_LOADING_GATE_UNDEPLOY_RETRY_SECONDS = 0.2;

// Recaptures any player who reached world state before the current loading gate released.
function enforceUiLoadingGateWhileDeployed(eventPlayer: mod.Player): boolean {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return false;
    const pid = safeGetPlayerId(eventPlayer);
    if (pid === undefined) return false;
    const state = State.players.readyDialogData[pid];
    if (!state) return false;
    if (!isUiLoadGateActiveForPid(pid)) return false;

    reassertPlayerUiLoadingGateVisuals(eventPlayer, pid);
    setAllInputRestrictionsForPlayer(eventPlayer, true);

    const now = mod.GetMatchTimeElapsed();
    const lastAttemptAt = state.uiSlipUndeployLastAttemptAt ?? -1;
    if (lastAttemptAt < 0 || (now - lastAttemptAt) >= UI_LOADING_GATE_UNDEPLOY_RETRY_SECONDS) {
        state.uiSlipUndeployLastAttemptAt = now;
        try {
            mod.UndeployPlayer(eventPlayer);
        } catch {
        }
    }

    return true;
}

// Reasserts deploy blocking during the active loading session so the join gate keeps ownership even before a slipped deploy reaches recapture.
function maintainUiLoadingGateWhileUnreleased(eventPlayer: mod.Player): void {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    const pid = safeGetPlayerId(eventPlayer);
    if (pid === undefined) return;
    const state = State.players.readyDialogData[pid];
    if (!state) return;
    if (!isUiLoadGateActiveForPid(pid)) return;
    maintainPlayerLoadingGateAuthority(eventPlayer, pid);
}

function ongoingPlayerImpl(eventPlayer: mod.Player): void {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    maintainUiLoadingGateWhileUnreleased(eventPlayer);
    if (enforceUiLoadingGateWhileDeployed(eventPlayer)) return;
    if (!isPlayerDeployed(eventPlayer)) return;
    checkReadyDialogInteractPointRemoval(eventPlayer);
    updateArmMenu(eventPlayer);
    if (InteractMultiClickDetector.checkMultiClick(eventPlayer)) spawnReadyDialogInteractPoint(eventPlayer);
}

function onPlayerInteractImpl(eventPlayer: mod.Player, eventInteractPoint: mod.InteractPoint) {
    if (tryHandleWorldInteractableActivation(eventPlayer, eventInteractPoint)) return;
    teamSwitchInteractPointActivated(eventPlayer, eventInteractPoint);
}

function onPlayerUIButtonEventImpl(eventPlayer: mod.Player, eventUIWidget: mod.UIWidget, eventUIButtonEvent: mod.UIButtonEvent) {
    if (tryHandleJoinPromptButton(eventPlayer, eventUIWidget, eventUIButtonEvent)) return;
    teamSwitchButtonEvent(eventPlayer, eventUIWidget, eventUIButtonEvent);
}
