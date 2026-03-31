// @ts-nocheck
// Module: ready-dialog/join-prompt-layout -- loading overlay layout for the player UI warm gate

//#region -------------------- Join Prompt - Layout --------------------

const JOIN_PROMPT_PANEL_WIDTH = 520;
const JOIN_PROMPT_PANEL_HEIGHT = 220;
const JOIN_PROMPT_HEADER_OFFSET_Y = -60;
const JOIN_PROMPT_TITLE_OFFSET_Y = -18;
const JOIN_PROMPT_SUBTITLE_OFFSET_Y = 18;
const JOIN_PROMPT_BODY_OFFSET_Y = 60;

// Ensures the loading overlay tree exists for one player so the warm gate can show a stable loading message.
function ensureJoinPromptLoadingOverlayForPlayer(eventPlayer: mod.Player): mod.UIWidget | undefined {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return undefined;
    const pid = safeGetPlayerId(eventPlayer);
    if (pid === undefined) return undefined;

    let root = safeFind(joinPromptRootName(pid)) as mod.UIWidget | undefined;
    if (
        root
        && safeFind(joinPromptPanelName(pid))
        && safeFind(joinPromptTitleName(pid))
        && safeFind(joinPromptSubtitleName(pid))
        && safeFind(joinPromptBodyName(pid))
        && safeFind(joinPromptDetailName(pid))
    ) {
        return root;
    }
    if (root) {
        clearJoinPromptForPlayerId(pid);
        root = undefined;
    }

    mod.AddUIContainer(
        joinPromptRootName(pid),
        mod.CreateVector(0, 0, 0),
        mod.CreateVector(640, 240, 0),
        mod.UIAnchor.Center,
        mod.GetUIRoot(),
        true,
        0,
        COLOR_DARK_BLACK,
        0,
        mod.UIBgFill.None,
        mod.UIDepth.AboveGameUI,
        eventPlayer
    );
    root = safeFind(joinPromptRootName(pid)) as mod.UIWidget | undefined;
    if (!root) return undefined;

    mod.AddUIContainer(
        joinPromptPanelName(pid),
        mod.CreateVector(0, 0, 0),
        mod.CreateVector(JOIN_PROMPT_PANEL_WIDTH, JOIN_PROMPT_PANEL_HEIGHT, 0),
        mod.UIAnchor.Center,
        root,
        true,
        0,
        COLOR_DARK_BLACK,
        0.92,
        mod.UIBgFill.Blur,
        mod.UIDepth.AboveGameUI,
        eventPlayer
    );

    const panel = safeFind(joinPromptPanelName(pid)) as mod.UIWidget | undefined;
    if (!panel) return root;

    addReadyDialogText(
        joinPromptTitleName(pid),
        0,
        JOIN_PROMPT_HEADER_OFFSET_Y,
        JOIN_PROMPT_PANEL_WIDTH - 40,
        34,
        mod.UIAnchor.Center,
        mod.UIAnchor.Center,
        mod.Message(mod.stringkeys.twl.ui.loading),
        eventPlayer,
        panel,
        24,
        true,
        COLOR_WHITE
    );
    addReadyDialogText(
        joinPromptSubtitleName(pid),
        0,
        JOIN_PROMPT_TITLE_OFFSET_Y,
        JOIN_PROMPT_PANEL_WIDTH - 60,
        28,
        mod.UIAnchor.Center,
        mod.UIAnchor.Center,
        mod.Message(mod.stringkeys.twl.hud.branding.title),
        eventPlayer,
        panel,
        18,
        true,
        COLOR_WHITE
    );
    addReadyDialogText(
        joinPromptBodyName(pid),
        0,
        JOIN_PROMPT_SUBTITLE_OFFSET_Y,
        JOIN_PROMPT_PANEL_WIDTH - 60,
        24,
        mod.UIAnchor.Center,
        mod.UIAnchor.Center,
        mod.Message(mod.stringkeys.twl.hud.branding.subtitle),
        eventPlayer,
        panel,
        15,
        true,
        COLOR_WHITE
    );
    addReadyDialogText(
        joinPromptDetailName(pid),
        0,
        JOIN_PROMPT_BODY_OFFSET_Y,
        JOIN_PROMPT_PANEL_WIDTH - 60,
        28,
        mod.UIAnchor.Center,
        mod.UIAnchor.Center,
        mod.Message(mod.stringkeys.twl.ui.customScriptsLoading),
        eventPlayer,
        panel,
        17,
        true,
        COLOR_WHITE
    );

    return root;
}

// Shows the loading overlay for one player while the warm controller blocks deploy and menu interaction.
function showJoinPromptLoadingForPlayer(eventPlayer: mod.Player): void {
    const pid = safeGetPlayerId(eventPlayer);
    if (pid === undefined) return;
    const root = ensureJoinPromptLoadingOverlayForPlayer(eventPlayer);
    if (!root) return;
    safeSetUIWidgetVisible(root, true);
    safeSetUIWidgetVisible(safeFind(joinPromptPanelName(pid)), true);
    safeSetUIWidgetVisible(safeFind(joinPromptTitleName(pid)), true);
    safeSetUIWidgetVisible(safeFind(joinPromptSubtitleName(pid)), true);
    safeSetUIWidgetVisible(safeFind(joinPromptBodyName(pid)), true);
    safeSetUIWidgetVisible(safeFind(joinPromptDetailName(pid)), true);
    safeSetUITextLabel(safeFind(joinPromptBodyName(pid)), mod.Message(mod.stringkeys.twl.hud.branding.subtitle));
    safeSetUITextLabel(safeFind(joinPromptDetailName(pid)), mod.Message(mod.stringkeys.twl.ui.customScriptsLoading));
}

//#endregion ----------------- Join Prompt - Layout --------------------
