// @ts-nocheck
// Module: ready-dialog/join-prompt-events -- dormant join prompt cleanup helpers

//#region -------------------- Join Prompt - Lifecycle + Events --------------------

// Clears all join-prompt widgets for one player id using the shared widget name helpers.
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

// Button handler is a no-op because the join prompt overlay is intentionally disabled.
function tryHandleJoinPromptButton(
    eventPlayer: mod.Player,
    eventUIWidget: mod.UIWidget,
    eventUIButtonEvent: mod.UIButtonEvent
): boolean {
    return false;
}

//#endregion ----------------- Join Prompt - Lifecycle + Events --------------------

