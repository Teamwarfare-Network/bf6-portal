// @ts-nocheck


function buildAdminPanelWidgets(eventPlayer: mod.Player, adminContainer: mod.UIWidget, playerId: number): void {

    const testerBaseX = ADMIN_PANEL_BASE_X;
    const testerBaseY = ADMIN_PANEL_BASE_Y;

    const buttonSizeX = ADMIN_PANEL_BUTTON_SIZE_X;
    const buttonSizeY = ADMIN_PANEL_BUTTON_SIZE_Y;
    const labelSizeX = ADMIN_PANEL_LABEL_SIZE_X;
    const rowSpacingY = ADMIN_PANEL_ROW_SPACING_Y;

    const decOffsetX = 0;
    const labelOffsetX = buttonSizeX + 8;
    const incOffsetX = buttonSizeX + 8 + labelSizeX + 8;

    const headerId = UI_TEST_HEADER_LABEL_ID + playerId;

    safeParseUI({
        name: headerId,
        type: "Text",
        playerId: eventPlayer,
        position: [0, testerBaseY + 2],
        size: [ADMIN_PANEL_CONTENT_WIDTH, 18],
        anchor: mod.UIAnchor.TopCenter,
        visible: true,
        padding: 0,
        bgAlpha: 0,
        bgFill: mod.UIBgFill.None,
        textLabel: msg(mod.stringkeys.twl.adminPanel.tester.header),
        textColor: ADMIN_PANEL_LABEL_TEXT_COLOR_RGB,
        textAlpha: 1,
        textSize: 12,
        textAnchor: mod.UIAnchor.Center,
    });
    const TEST_HEADER = safeFind(headerId);
    applyAdminPanelLabelTextColor(TEST_HEADER);
    if (TEST_HEADER) mod.SetUIWidgetParent(TEST_HEADER, adminContainer);

    const row0Y = testerBaseY + 22;

    addTesterRow(eventPlayer, adminContainer, playerId, testerBaseX, row0Y + (buttonSizeY + rowSpacingY) * 0,
        UI_TEST_BUTTON_CLOCK_TIME_DEC_ID, UI_TEST_BUTTON_CLOCK_TIME_INC_ID, UI_TEST_LABEL_CLOCK_TIME_ID,
        mod.stringkeys.twl.adminPanel.tester.labels.clockTime, buttonSizeX, buttonSizeY, labelSizeX, decOffsetX, labelOffsetX, incOffsetX);

    addTesterRow(
        eventPlayer,
        adminContainer,
        playerId,
        testerBaseX,
        row0Y + (buttonSizeY + rowSpacingY) * 1,
        UI_ADMIN_MATCH_LENGTH_DEC_ID,
        UI_ADMIN_MATCH_LENGTH_INC_ID,
        UI_ADMIN_MATCH_LENGTH_LABEL_ID,
        mod.stringkeys.twl.adminPanel.tester.labels.roundLength,
        buttonSizeX,
        buttonSizeY,
        labelSizeX,
        decOffsetX,
        labelOffsetX,
        incOffsetX
    );

    addTesterResetButton(eventPlayer, adminContainer, playerId, testerBaseX,
        row0Y + (buttonSizeY + rowSpacingY) * 2, (buttonSizeX + 8 + labelSizeX + 8 + buttonSizeX), 36);

    addTesterActionButton(eventPlayer, adminContainer, playerId, testerBaseX,
        row0Y + (buttonSizeY + rowSpacingY) * 3, (buttonSizeX + 8 + labelSizeX + 8 + buttonSizeX), 36,
        UI_TEST_BUTTON_MATCH_START_ID, UI_TEST_MATCH_START_TEXT_ID, mod.stringkeys.twl.adminPanel.tester.buttons.roundStart);

    addTesterActionButton(eventPlayer, adminContainer, playerId, testerBaseX,
        row0Y + (buttonSizeY + rowSpacingY) * 4, (buttonSizeX + 8 + labelSizeX + 8 + buttonSizeX), 36,
        UI_TEST_BUTTON_MATCH_END_ID, UI_TEST_MATCH_END_TEXT_ID, mod.stringkeys.twl.adminPanel.tester.buttons.roundEnd);

    addTesterActionButton(eventPlayer, adminContainer, playerId, testerBaseX,
        row0Y + (buttonSizeY + rowSpacingY) * 5, (buttonSizeX + 8 + labelSizeX + 8 + buttonSizeX), 36,
        UI_TEST_BUTTON_POS_DEBUG_ID, UI_TEST_POS_DEBUG_TEXT_ID, mod.stringkeys.twl.adminPanel.tester.buttons.positionDebug);

    addTesterActionButton(
        eventPlayer,
        adminContainer,
        playerId,
        testerBaseX,
        row0Y + (buttonSizeY + rowSpacingY) * 6,
        (buttonSizeX + 8 + labelSizeX + 8 + buttonSizeX),
        36,
        UI_TEST_BUTTON_DEPLOY_TIMERS_TOGGLE_ID,
        UI_TEST_DEPLOY_TIMERS_TOGGLE_TEXT_ID,
        getVehicleDeployTimerAdminToggleLabelKey(playerId)
    );

    addTesterActionButton(
        eventPlayer,
        adminContainer,
        playerId,
        testerBaseX,
        row0Y + (buttonSizeY + rowSpacingY) * 7,
        (buttonSizeX + 8 + labelSizeX + 8 + buttonSizeX),
        36,
        UI_TEST_BUTTON_RESET_GADGET_TIMERS_ID,
        UI_TEST_RESET_GADGET_TIMERS_TEXT_ID,
        mod.stringkeys.twl.adminPanel.tester.buttons.resetGadgetTimers
    );

    addTesterActionButton(
        eventPlayer,
        adminContainer,
        playerId,
        testerBaseX,
        row0Y + (buttonSizeY + rowSpacingY) * 8,
        (buttonSizeX + 8 + labelSizeX + 8 + buttonSizeX),
        36,
        UI_TEST_BUTTON_PERF_DIAG_TOGGLE_ID,
        UI_TEST_PERF_DIAG_TOGGLE_TEXT_ID,
        mod.stringkeys.twl.adminPanel.tester.buttons.perfDiag
    );

    addTesterActionButton(
        eventPlayer,
        adminContainer,
        playerId,
        testerBaseX,
        row0Y + (buttonSizeY + rowSpacingY) * 9,
        (buttonSizeX + 8 + labelSizeX + 8 + buttonSizeX),
        36,
        UI_TEST_BUTTON_GROUND_DEPLOY_ALL_ID,
        UI_TEST_GROUND_DEPLOY_ALL_TEXT_ID,
        mod.stringkeys.twl.adminPanel.tester.buttons.groundDeployAll
    );

    syncAdminMatchLengthLabelForAllPlayers();
}





function addTesterRow(
    eventPlayer: mod.Player,
    containerBase: mod.UIWidget,
    playerId: number,
    baseX: number,
    baseY: number,
    decButtonBaseId: string,
    incButtonBaseId: string,
    labelBaseId: string,
    labelKey: number,
    buttonSizeX: number,
    buttonSizeY: number,
    labelSizeX: number,
    decOffsetX: number,
    labelOffsetX: number,
    incOffsetX: number
): void {
    const decButtonId = decButtonBaseId + playerId;
    const incButtonId = incButtonBaseId + playerId;

    const plusTextId = UI_TEST_PLUS_TEXT_ID + incButtonId;
    const minusTextId = UI_TEST_MINUS_TEXT_ID + decButtonId;

    const labelId = labelBaseId + playerId;

    addOutlinedButton(
        decButtonId,
        baseX + decOffsetX,
        baseY,
        buttonSizeX,
        buttonSizeY,
        mod.UIAnchor.TopLeft,
        containerBase,
        eventPlayer
    );

    const DEC_BORDER = safeFind(decButtonId + "_BORDER");
    const MINUS_TEXT = addCenteredButtonText(
        minusTextId,
        buttonSizeX,
        buttonSizeY,
        msg(mod.stringkeys.twl.ui.minus),
        eventPlayer,
        DEC_BORDER ?? containerBase
    );
    if (MINUS_TEXT) {
        mod.SetUITextSize(MINUS_TEXT, 12);
        mod.SetUITextColor(MINUS_TEXT, ADMIN_PANEL_BUTTON_TEXT_COLOR);
    }

    mod.AddUIText(labelId, mod.CreateVector(baseX + labelOffsetX, baseY + 11, 0), mod.CreateVector(labelSizeX, buttonSizeY - 22, 0),
        mod.UIAnchor.TopLeft, msg(labelKey), eventPlayer);
    const LABEL = safeFind(labelId);
    if (LABEL) {
        mod.SetUITextSize(LABEL, 12);
        mod.SetUIWidgetBgAlpha(LABEL, 0);
        applyAdminPanelLabelTextColor(LABEL);
        mod.SetUIWidgetParent(LABEL, containerBase);
    }

    addOutlinedButton(
        incButtonId,
        baseX + incOffsetX,
        baseY,
        buttonSizeX,
        buttonSizeY,
        mod.UIAnchor.TopLeft,
        containerBase,
        eventPlayer
    );

    const INC_BORDER = safeFind(incButtonId + "_BORDER");
    const PLUS_TEXT = addCenteredButtonText(
        plusTextId,
        buttonSizeX,
        buttonSizeY,
        msg(mod.stringkeys.twl.ui.plus),
        eventPlayer,
        INC_BORDER ?? containerBase
    );
    if (PLUS_TEXT) {
        mod.SetUITextSize(PLUS_TEXT, 12);
        mod.SetUITextColor(PLUS_TEXT, ADMIN_PANEL_BUTTON_TEXT_COLOR);
    }
}

function addTesterResetButton(
    eventPlayer: mod.Player,
    containerBase: mod.UIWidget,
    playerId: number,
    baseX: number,
    baseY: number,
    width: number,
    height: number
): void {
    const buttonId = UI_TEST_BUTTON_CLOCK_RESET_ID + playerId;
    const labelId = UI_TEST_RESET_TEXT_ID + playerId;

    addOutlinedButton(
        buttonId,
        baseX,
        baseY,
        width,
        height,
        mod.UIAnchor.TopLeft,
        containerBase,
        eventPlayer
    );

    const resetParent = safeFind(buttonId + "_BORDER") ?? containerBase;
    const resetLabel = addCenteredButtonText(
        labelId,
        width,
        height,
        msg(mod.stringkeys.twl.adminPanel.tester.buttons.clockReset),
        eventPlayer,
        resetParent
    );
    if (resetLabel) {
        mod.SetUITextSize(resetLabel, 12);
        mod.SetUITextColor(resetLabel, ADMIN_PANEL_BUTTON_TEXT_COLOR);
    }
}

function addTesterActionButton(
    eventPlayer: mod.Player,
    containerBase: mod.UIWidget,
    playerId: number,
    baseX: number,
    baseY: number,
    width: number,
    height: number,
    buttonBaseId: string,
    labelBaseId: string,
    labelKey: number
): void {
    const buttonId = buttonBaseId + playerId;
    const labelId = labelBaseId + playerId;

    addOutlinedButton(
        buttonId,
        baseX,
        baseY,
        width,
        height,
        mod.UIAnchor.TopLeft,
        containerBase,
        eventPlayer
    );

    const actionParent = safeFind(buttonId + "_BORDER") ?? containerBase;
    const actionLabel = addCenteredButtonText(
        labelId,
        width,
        height,
        msg(labelKey),
        eventPlayer,
        actionParent
    );
    if (actionLabel) {
        mod.SetUITextSize(actionLabel, 12);
        mod.SetUITextColor(actionLabel, ADMIN_PANEL_BUTTON_TEXT_COLOR);
    }
}

// Returns true once the admin panel body has been built at least once for this player.
// Non-admin players are considered warm immediately since they have no admin panel to warm.
// Used by the unified loading gate readiness check.
function isAdminPanelWarmForPid(pid: number): boolean {
    return State.players.readyDialogData[pid]?.adminPanelBuilt === true;
}

// Prebuilds the admin panel hidden for one player so the first open is instant after the loading gate releases.
// Idempotent: does nothing if already built. Must be called while the gate is still active (player is hidden).
function prebuildAdminPanelWhileHidden(eventPlayer: mod.Player, pid: number): void {
    if (!isValidPlayer(eventPlayer)) return;
    const state = State.players.readyDialogData[pid];
    if (!state) return;
    if (state.adminPanelBuilt) return;
    try {
        let adminContainer = safeFind(UI_ADMIN_PANEL_CONTAINER_ID + pid);
        if (!adminContainer) {
            mod.AddUIContainer(
                UI_ADMIN_PANEL_CONTAINER_ID + pid,
                mod.CreateVector(ADMIN_PANEL_OFFSET_X, ADMIN_PANEL_OFFSET_Y, 0),
                mod.CreateVector(
                    ADMIN_PANEL_CONTENT_WIDTH + (ADMIN_PANEL_PADDING * 2),
                    ADMIN_PANEL_HEIGHT + (ADMIN_PANEL_PADDING * 2),
                    0
                ),
                mod.UIAnchor.TopRight,
                mod.GetUIRoot(),
                false,
                10,
                ADMIN_PANEL_BG_COLOR,
                ADMIN_PANEL_BG_ALPHA,
                ADMIN_PANEL_BG_FILL,
                mod.UIDepth.AboveGameUI,
                eventPlayer
            );
            adminContainer = safeFind(UI_ADMIN_PANEL_CONTAINER_ID + pid);
        }
        if (!adminContainer) return;
        buildAdminPanelWidgets(eventPlayer, adminContainer, pid);
        state.adminPanelBuilt = true;
        safeSetUIWidgetVisible(adminContainer, false);
        setAdminPanelChildWidgetsVisible(pid, false);
    } catch {}
}

