// @ts-nocheck
// Module: ready-dialog/join-prompt-events -- loading overlay cleanup helpers

//#region -------------------- Join Prompt - Lifecycle + Events --------------------

// Clears all join-prompt widgets for one player id using the shared widget name helpers.
function clearJoinPromptForPlayerId(playerId: number): void {
    for (const widgetName of getJoinPromptWidgetNames(playerId)) {
        for (let i = 0; i < 16; i++) {
            const widget = safeFind(widgetName);
            if (!widget) break;
            try {
                mod.DeleteUIWidget(widget);
            } catch {
                break;
            }
        }
    }
}

// Button handler is a no-op because the loading overlay is informational only.
function tryHandleJoinPromptButton(
    eventPlayer: mod.Player,
    eventUIWidget: mod.UIWidget,
    eventUIButtonEvent: mod.UIButtonEvent
): boolean {
    return false;
}

//#endregion ----------------- Join Prompt - Lifecycle + Events --------------------

