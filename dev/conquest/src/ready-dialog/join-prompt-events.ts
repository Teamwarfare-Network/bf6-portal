// @ts-nocheck
// Module: ready-dialog/join-prompt-events -- join prompt dismiss/clear/button event lifecycle

//#region -------------------- Join Prompt - Lifecycle + Events --------------------

// Respects round/cleanup locks when re-enabling deploy after dismiss.
function canEnableDeployAfterJoinPrompt(): boolean {
    if (State.round.flow.cleanupActive && !State.round.flow.cleanupAllowDeploy) return false;
    return true;
}

// Dismisses the overlay and restores input/deploy based on current locks.
function dismissJoinPromptForPlayer(player: mod.Player): void {
    const pid = mod.GetObjId(player);

    setUIInputModeForPlayer(player, false);
    mod.EnablePlayerDeploy(player, canEnableDeployAfterJoinPrompt());
    deleteJoinPromptWidget(joinPromptButtonTextName(pid));
    deleteJoinPromptWidget(joinPromptButtonName(pid));
    deleteJoinPromptWidget(joinPromptButtonBorderName(pid));
    deleteJoinPromptWidget(joinPromptNeverShowButtonTextName(pid));
    deleteJoinPromptWidget(joinPromptNeverShowButtonName(pid));
    deleteJoinPromptWidget(joinPromptNeverShowButtonBorderName(pid));
    deleteJoinPromptWidget(joinPromptBodyName(pid));
    deleteJoinPromptWidget(joinPromptTitleName(pid));
    deleteJoinPromptWidget(joinPromptPanelName(pid));
    deleteJoinPromptWidget(joinPromptRootName(pid));
}

// Hard cleanup for disconnects (removes any prompt widgets for that pid).
function clearJoinPromptForPlayerId(playerId: number): void {
    deleteJoinPromptWidget(joinPromptButtonTextName(playerId));
    deleteJoinPromptWidget(joinPromptButtonName(playerId));
    deleteJoinPromptWidget(joinPromptButtonBorderName(playerId));
    deleteJoinPromptWidget(joinPromptNeverShowButtonTextName(playerId));
    deleteJoinPromptWidget(joinPromptNeverShowButtonName(playerId));
    deleteJoinPromptWidget(joinPromptNeverShowButtonBorderName(playerId));
    deleteJoinPromptWidget(joinPromptBodyName(playerId));
    deleteJoinPromptWidget(joinPromptTitleName(playerId));
    deleteJoinPromptWidget(joinPromptPanelName(playerId));
    deleteJoinPromptWidget(joinPromptRootName(playerId));
}

// Button handler: dismisses when the OK button (or its children) is clicked.
function tryHandleJoinPromptButton(
    eventPlayer: mod.Player,
    eventUIWidget: mod.UIWidget,
    eventUIButtonEvent: mod.UIButtonEvent
): boolean {
    if (!SHOW_HELP_TEXT_PROMPT_ON_JOIN) return false;
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return false;
    if (!mod.Equals(eventUIButtonEvent, mod.UIButtonEvent.ButtonUp)) return false;

    const pid = mod.GetObjId(eventPlayer);
    const dismissId = joinPromptButtonName(pid);
    const neverShowId = joinPromptNeverShowButtonName(pid);
    let w: mod.UIWidget = eventUIWidget;
    for (let i = 0; i < 8; i++) {
        const name = mod.GetUIWidgetName(w);
        if (name === dismissId) {
            advanceJoinPromptSequenceOnDismiss(pid);
            dismissJoinPromptForPlayer(eventPlayer);
            return true;
        }
        if (name === neverShowId) {
            setJoinPromptSuppressedForPlayer(pid);
            dismissJoinPromptForPlayer(eventPlayer);
            return true;
        }
        const parent = mod.GetUIWidgetParent(w);
        if (!parent) break;
        w = parent;
    }
    return false;
}

//#endregion ----------------- Join Prompt - Lifecycle + Events --------------------
