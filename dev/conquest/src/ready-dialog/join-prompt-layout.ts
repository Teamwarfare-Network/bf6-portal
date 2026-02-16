// @ts-nocheck
// Module: ready-dialog/join-prompt-layout -- join prompt widget composition and layout

//#region -------------------- Join Prompt - Layout --------------------

// Builds the join overlay, blocks deploy, and enables UI input until dismissed.
function createJoinPromptForPlayer(player: mod.Player): void {
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return;
    const uiRoot = mod.GetUIRoot();
    const bodyKey = getJoinPromptBodyKeyForPid(pid);
    const dismissLabelKey = getJoinPromptDismissLabelKeyForPid(pid);
    const showNeverShow = shouldShowJoinPromptNeverShowButtonForPid(pid);

    deleteJoinPromptWidget(joinPromptRootName(pid));
    deleteJoinPromptWidget(joinPromptButtonBorderName(pid));
    deleteJoinPromptWidget(joinPromptNeverShowButtonBorderName(pid));

    mod.EnablePlayerDeploy(player, false);
    setUIInputModeForPlayer(player, true);

    mod.AddUIContainer(
        joinPromptRootName(pid),
        mod.CreateVector(0, 0, 0),
        mod.CreateVector(1920, 1080, 0),
        mod.UIAnchor.Center,
        uiRoot,
        true,
        0,
        mod.CreateVector(0, 0, 0),
        0.55,
        mod.UIBgFill.Solid,
        mod.UIDepth.AboveGameUI,
        player
    );

    const root = safeFind(joinPromptRootName(pid));
    if (root) mod.SetUIWidgetDepth(root, mod.UIDepth.AboveGameUI);

    const joinPromptPanelOffsetY = -54;
    const joinPromptButtonOffsetY = 173;

    mod.AddUIContainer(
        joinPromptPanelName(pid),
        mod.CreateVector(0, joinPromptPanelOffsetY, 0),
        mod.CreateVector(900, 444, 0),
        mod.UIAnchor.Center,
        root ?? uiRoot,
        true,
        0,
        mod.CreateVector(0.08, 0.08, 0.08),
        0.95,
        mod.UIBgFill.Solid,
        mod.UIDepth.AboveGameUI,
        player
    );

    const panel = safeFind(joinPromptPanelName(pid));
    if (panel) mod.SetUIWidgetDepth(panel, mod.UIDepth.AboveGameUI);

    mod.AddUIText(
        joinPromptTitleName(pid),
        mod.CreateVector(0, -192, 0),
        mod.CreateVector(820, 60, 0),
        mod.UIAnchor.Center,
        panel ?? uiRoot,
        true,
        0,
        mod.CreateVector(0, 0, 0),
        0,
        mod.UIBgFill.None,
        mod.Message(STR_JOIN_PROMPT_TITLE),
        42,
        mod.CreateVector(1, 1, 1),
        1,
        mod.UIAnchor.Center,
        mod.UIDepth.AboveGameUI,
        player
    );

    mod.AddUIText(
        joinPromptBodyName(pid),
        mod.CreateVector(0, 0, 0),
        mod.CreateVector(740, 300, 0), // 900-wide panel with 80px side inset on each side
        mod.UIAnchor.Center,
        panel ?? uiRoot,
        true,
        0,
        mod.CreateVector(0, 0, 0),
        0,
        mod.UIBgFill.None,
        mod.Message(bodyKey),
        22,
        mod.CreateVector(1, 1, 1),
        1,
        mod.UIAnchor.TopLeft,
        mod.UIDepth.AboveGameUI,
        player
    );

    const neverShowBorder = addOutlinedButton(
        joinPromptNeverShowButtonName(pid),
        -200,
        joinPromptButtonOffsetY,
        360,
        70,
        mod.UIAnchor.Center,
        panel ?? uiRoot,
        player
    );

    const neverShowButton = safeFind(joinPromptNeverShowButtonName(pid));
    if (neverShowButton) {
        mod.SetUIWidgetDepth(neverShowButton, mod.UIDepth.AboveGameUI);
        mod.SetUIWidgetVisible(neverShowButton, showNeverShow);
        mod.EnableUIButtonEvent(neverShowButton, mod.UIButtonEvent.ButtonUp, showNeverShow);
    }
    const neverShowBorderWidget = safeFind(joinPromptNeverShowButtonBorderName(pid));
    if (neverShowBorderWidget) {
        mod.SetUIWidgetDepth(neverShowBorderWidget, mod.UIDepth.AboveGameUI);
        mod.SetUIWidgetVisible(neverShowBorderWidget, showNeverShow);
    }

    const neverShowTextParent = neverShowBorder ?? panel ?? uiRoot;
    const neverShowText = addCenteredButtonText(
        joinPromptNeverShowButtonTextName(pid),
        360,
        70,
        mod.Message(STR_JOIN_PROMPT_NEVER_SHOW),
        player,
        neverShowTextParent
    );
    if (neverShowText) {
        mod.SetUITextSize(neverShowText, 24);
        mod.SetUITextColor(neverShowText, mod.CreateVector(1, 1, 1));
        mod.SetUIWidgetDepth(neverShowText, mod.UIDepth.AboveGameUI);
        mod.SetUIWidgetParent(neverShowText, neverShowTextParent);
        mod.SetUIWidgetPosition(
            neverShowText,
            neverShowBorder ? mod.CreateVector(0, 0, 0) : mod.CreateVector(-200, joinPromptButtonOffsetY, 0)
        );
        mod.SetUIWidgetVisible(neverShowText, showNeverShow);
    }

    const dismissBorder = addOutlinedButton(
        joinPromptButtonName(pid),
        200,
        joinPromptButtonOffsetY,
        360,
        70,
        mod.UIAnchor.Center,
        panel ?? uiRoot,
        player
    );

    const dismissButton = safeFind(joinPromptButtonName(pid));
    if (dismissButton) {
        mod.SetUIWidgetDepth(dismissButton, mod.UIDepth.AboveGameUI);
        mod.EnableUIButtonEvent(dismissButton, mod.UIButtonEvent.ButtonUp, true);
    }
    const dismissBorderWidget = safeFind(joinPromptButtonBorderName(pid));
    if (dismissBorderWidget) mod.SetUIWidgetDepth(dismissBorderWidget, mod.UIDepth.AboveGameUI);

    const dismissTextParent = dismissBorder ?? panel ?? uiRoot;
    const dismissText = addCenteredButtonText(
        joinPromptButtonTextName(pid),
        360,
        70,
        mod.Message(dismissLabelKey),
        player,
        dismissTextParent
    );
    if (dismissText) {
        mod.SetUITextSize(dismissText, 24);
        mod.SetUITextColor(dismissText, mod.CreateVector(1, 1, 1));
        mod.SetUIWidgetDepth(dismissText, mod.UIDepth.AboveGameUI);
        mod.SetUIWidgetParent(dismissText, dismissTextParent);
        mod.SetUIWidgetPosition(
            dismissText,
            dismissBorder ? mod.CreateVector(0, 0, 0) : mod.CreateVector(200, joinPromptButtonOffsetY, 0)
        );
    }
}

//#endregion ----------------- Join Prompt - Layout --------------------
