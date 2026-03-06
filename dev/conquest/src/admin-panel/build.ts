// @ts-nocheck
// Module: admin-panel/build -- admin panel layout and builder helpers

//#region -------------------- Admin Panel UI (Right Side) --------------------

// Builds the Admin Panel widgets lazily (to avoid a 1-frame flicker on dialog open).
function buildAdminPanelWidgets(eventPlayer: mod.Player, adminContainer: mod.UIWidget, playerId: number): void {

    // Fit at target resolutions.
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

    modlib.ParseUI({
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
        textLabel: mod.Message(mod.stringkeys.twl.adminPanel.tester.header),
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
        mod.stringkeys.twl.adminPanel.labels.roundLengthFormat,
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

    syncAdminMatchLengthLabelForAllPlayers();
}

//#endregion ----------------- Admin Panel UI (Right Side) --------------------



//#region -------------------- Admin Panel UI builder helpers --------------------

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
        mod.Message(mod.stringkeys.twl.ui.minus),
        eventPlayer,
        DEC_BORDER ?? containerBase
    );
    if (MINUS_TEXT) {
        mod.SetUITextSize(MINUS_TEXT, 12);
        mod.SetUITextColor(MINUS_TEXT, ADMIN_PANEL_BUTTON_TEXT_COLOR);
    }

    mod.AddUIText(labelId, mod.CreateVector(baseX + labelOffsetX, baseY + 11, 0), mod.CreateVector(labelSizeX, buttonSizeY - 22, 0),
        mod.UIAnchor.TopLeft, mod.Message(labelKey), eventPlayer);
    mod.SetUITextSize(mod.FindUIWidgetWithName(labelId, mod.GetUIRoot()), 12);
    const LABEL = mod.FindUIWidgetWithName(labelId, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(LABEL, 0);
    applyAdminPanelLabelTextColor(LABEL);
    mod.SetUIWidgetParent(LABEL, containerBase);

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
        mod.Message(mod.stringkeys.twl.ui.plus),
        eventPlayer,
        INC_BORDER ?? containerBase
    );
    if (PLUS_TEXT) {
        mod.SetUITextSize(PLUS_TEXT, 12);
        mod.SetUITextColor(PLUS_TEXT, ADMIN_PANEL_BUTTON_TEXT_COLOR);
    }
}

// Legacy keep: retained intentionally for potential tester/admin value-row UI reuse.
function addTesterRowWithValue(
    eventPlayer: mod.Player,
    containerBase: mod.UIWidget,
    playerId: number,
    baseX: number,
    baseY: number,
    decButtonBaseId: string,
    incButtonBaseId: string,
    labelBaseId: string,
    valueBaseId: string,
    labelKey: number,
    initialValue: number,
    buttonSizeX: number,
    buttonSizeY: number,
    labelSizeX: number,
    valueSizeX: number,
    decOffsetX: number,
    labelOffsetX: number,
    incOffsetX: number
): void {
    addTesterRow(eventPlayer, containerBase, playerId, baseX, baseY,
        decButtonBaseId, incButtonBaseId, labelBaseId, labelKey,
        buttonSizeX, buttonSizeY, labelSizeX, decOffsetX, labelOffsetX, incOffsetX);

    const valueId = valueBaseId + playerId;
    const valueX = baseX + incOffsetX - -3 - valueSizeX;

    mod.AddUIText(valueId, mod.CreateVector(valueX, baseY + 11, 0), mod.CreateVector(valueSizeX, buttonSizeY - 22, 0),
        mod.UIAnchor.TopLeft, mod.Message(mod.stringkeys.twl.system.genericCounter, Math.floor(initialValue)), eventPlayer);
    mod.SetUITextSize(mod.FindUIWidgetWithName(valueId, mod.GetUIRoot()), 12);
    const VALUE_TEXT = mod.FindUIWidgetWithName(valueId, mod.GetUIRoot());
    mod.SetUIWidgetBgAlpha(VALUE_TEXT, 0);
    applyAdminPanelLabelTextColor(VALUE_TEXT);
    mod.SetUIWidgetParent(VALUE_TEXT, containerBase);
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
        mod.Message(mod.stringkeys.twl.adminPanel.tester.buttons.clockReset),
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
        mod.Message(labelKey),
        eventPlayer,
        actionParent
    );
    if (actionLabel) {
        mod.SetUITextSize(actionLabel, 12);
        mod.SetUITextColor(actionLabel, ADMIN_PANEL_BUTTON_TEXT_COLOR);
    }
}

function ensurePositionDebugWidgets(player: mod.Player): { x: mod.UIWidget; y: mod.UIWidget; z: mod.UIWidget; rotY: mod.UIWidget } | undefined {
    const pid = mod.GetObjId(player);
    const containerId = UI_POS_DEBUG_CONTAINER_ID + pid;
    const xId = UI_POS_DEBUG_X_ID + pid;
    const yId = UI_POS_DEBUG_Y_ID + pid;
    const zId = UI_POS_DEBUG_Z_ID + pid;
    const rotYId = UI_POS_DEBUG_ROTY_ID + pid;

    let container = safeFind(containerId);
    if (!container) {
        mod.AddUIContainer(
            containerId,
            mod.CreateVector(300, 17, 0), // +X to move left, +Y to move down
            mod.CreateVector(360, 30, 0),
            mod.UIAnchor.TopRight,
            mod.GetUIRoot(),
            false,
            0,
            mod.CreateVector(0, 0, 0),
            0,
            mod.UIBgFill.None,
            mod.UIDepth.AboveGameUI,
            player
        );
        container = mod.FindUIWidgetWithName(containerId, mod.GetUIRoot());
    }
    if (container) {
        mod.SetUIWidgetVisible(container, true);
    }

    const makeText = (id: string, posY: number) => {
        mod.AddUIText(
            id,
            mod.CreateVector(0, posY, 0),
            mod.CreateVector(360, 14, 0),
            mod.UIAnchor.TopLeft,
            mod.Message(mod.stringkeys.twl.system.genericCounter, ""),
            player
        );
        const w = mod.FindUIWidgetWithName(id, mod.GetUIRoot());
        mod.SetUIWidgetBgAlpha(w, 0);
        mod.SetUITextSize(w, 10);
        mod.SetUITextColor(w, mod.CreateVector(1, 1, 1));
        if (container) mod.SetUIWidgetParent(w, container);
        return w;
    };

    // X/Y hold formatted debug strings; Z/RotY stay hidden as layout placeholders.
    let x = safeFind(xId);
    if (!x) x = makeText(xId, 0);
    let y = safeFind(yId);
    if (!y) y = makeText(yId, 14);
    let z = safeFind(zId);
    if (!z) z = makeText(zId, 0);
    let rotY = safeFind(rotYId);
    if (!rotY) rotY = makeText(rotYId, 14);

    if (!x || !y || !z || !rotY) return undefined;
    return { x, y, z, rotY };
}

async function positionDebugLoop(player: mod.Player, expectedToken: number): Promise<void> {
    const pid = mod.GetObjId(player);
    while (true) {
        const state = State.players.readyDialogData[pid];
        if (!state || !state.posDebugVisible || state.posDebugToken !== expectedToken) return;
        if (!mod.IsPlayerValid(player)) return;
        if (!isPlayerDeployed(player)) return;

        const widgets = ensurePositionDebugWidgets(player);
        if (!widgets) return;

        const pos = safeGetSoldierStateVector(player, mod.SoldierStateVector.GetPosition);
        const facing = safeGetSoldierStateVector(player, mod.SoldierStateVector.GetFacingDirection);
        if (!pos || !facing) return;

        const roundTo3 = (value: number) => Math.round(value * 1000) / 1000;
        mod.SetUITextLabel(
            widgets.x,
            mod.Message(
                mod.stringkeys.twl.debug.adminPos,
                roundTo3(mod.XComponentOf(pos)),
                roundTo3(mod.YComponentOf(pos)),
                roundTo3(mod.ZComponentOf(pos))
            )
        );
        mod.SetUITextLabel(
            widgets.y,
            mod.Message(
                mod.stringkeys.twl.debug.adminFacing,
                roundTo3(mod.XComponentOf(facing)),
                roundTo3(mod.YComponentOf(facing)),
                roundTo3(mod.ZComponentOf(facing))
            )
        );
        mod.SetUITextLabel(widgets.z, mod.Message(mod.stringkeys.twl.system.genericCounter, ""));
        mod.SetUITextLabel(widgets.rotY, mod.Message(mod.stringkeys.twl.system.genericCounter, ""));

        await mod.Wait(2.0);
    }
}

function setPositionDebugVisibleForPlayer(player: mod.Player, visible: boolean): void {
    const pid = mod.GetObjId(player);
    const state = State.players.readyDialogData[pid];
    if (!state) return;

    const widgets = ensurePositionDebugWidgets(player);
    if (!widgets) return;

    const container = safeFind(UI_POS_DEBUG_CONTAINER_ID + pid);
    if (container) mod.SetUIWidgetVisible(container, visible);

    mod.SetUIWidgetVisible(widgets.x, visible);
    mod.SetUIWidgetVisible(widgets.y, visible);
    mod.SetUIWidgetVisible(widgets.z, false);
    mod.SetUIWidgetVisible(widgets.rotY, false);

    state.posDebugToken = (state.posDebugToken + 1) % 1000000000;
    if (visible) {
        void positionDebugLoop(player, state.posDebugToken);
    }
}

//#endregion ----------------- Admin Panel UI builder helpers --------------------
