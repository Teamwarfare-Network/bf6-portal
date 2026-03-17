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

// Adds the tester clock reset action button and its centered label.
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

// Adds a full-width tester action button used for start/end/debug controls.
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

// Ensures per-player position debug text widgets exist and returns widget handles.
function ensurePositionDebugWidgets(player: mod.Player): {
    posXLabel: mod.UIWidget; posYLabel: mod.UIWidget; posZLabel: mod.UIWidget;
    posXValue: mod.UIWidget; posYValue: mod.UIWidget; posZValue: mod.UIWidget;
    rotXLabel: mod.UIWidget; rotYLabel: mod.UIWidget; rotZLabel: mod.UIWidget;
    rotXValue: mod.UIWidget; rotYValue: mod.UIWidget; rotZValue: mod.UIWidget;
} | undefined {
    const pid = mod.GetObjId(player);
    const containerId = UI_POS_DEBUG_CONTAINER_ID + pid;
    const posXLabelId = UI_POS_DEBUG_X_ID + pid;
    const posYLabelId = UI_POS_DEBUG_Y_ID + pid;
    const posZLabelId = UI_POS_DEBUG_Z_ID + pid;
    const posXValueId = UI_POS_DEBUG_X_VALUE_ID + pid;
    const posYValueId = UI_POS_DEBUG_Y_VALUE_ID + pid;
    const posZValueId = UI_POS_DEBUG_Z_VALUE_ID + pid;
    const rotXLabelId = UI_POS_DEBUG_ROTX_ID + pid;
    const rotYLabelId = UI_POS_DEBUG_ROTY_ID + pid;
    const rotZLabelId = UI_POS_DEBUG_ROTZ_ID + pid;
    const rotXValueId = UI_POS_DEBUG_ROTX_VALUE_ID + pid;
    const rotYValueId = UI_POS_DEBUG_ROTY_VALUE_ID + pid;
    const rotZValueId = UI_POS_DEBUG_ROTZ_VALUE_ID + pid;

    let container = safeFind(containerId);
    if (!container) {
        mod.AddUIContainer(
            containerId,
            mod.CreateVector(300, 17, 0), // +X to move left, +Y to move down
            mod.CreateVector(216, 32, 0),
            mod.UIAnchor.TopRight,
            mod.GetUIRoot(),
            false,
            0,
            COLOR_DARK_BLACK,
            0.9,
            mod.UIBgFill.Solid,
            mod.UIDepth.AboveGameUI,
            player
        );
        container = mod.FindUIWidgetWithName(containerId, mod.GetUIRoot());
    }
    if (container) {
        mod.SetUIWidgetVisible(container, false);
    }

    const emptyValueMessage = mod.Message(mod.stringkeys.twl.system.genericCounter, "");

    const makeText = (id: string, posX: number, posY: number, width: number, color: mod.Vector, anchor: mod.UIAnchor, label: mod.Message) => {
        let w = safeFind(id);
        if (!w) {
            const parsed = modlib.ParseUI({
                name: id,
                type: "Text",
                playerId: player,
                position: [posX, posY],
                size: [width, 14],
                anchor: mod.UIAnchor.TopLeft,
                visible: false,
                padding: 0,
                bgAlpha: 0,
                bgFill: mod.UIBgFill.None,
                textLabel: label,
                textColor: [1, 1, 1],
                textAlpha: 1,
                textSize: 10,
                textAnchor: anchor,
            });
            w = parsed ?? safeFind(id);
        }
        safeSetUIWidgetBgAlpha(w, 0);
        try {
            if (w) mod.SetUITextSize(w, 10);
        } catch {}
        safeSetUITextColor(w, color);
        try {
            if (w) mod.SetUITextAnchor(w, anchor);
        } catch {}
        safeSetUITextLabel(w, label);
        if (container) safeSetUIWidgetParent(w, container);
        safeSetUIWidgetPosition(w, mod.CreateVector(posX, posY, 0));
        safeSetUIWidgetSize(w, mod.CreateVector(width, 14, 0));
        if (w) mod.SetUIWidgetVisible(w, false);
        return w;
    };

    const normalizeText = (widget: mod.UIWidget | undefined, posX: number, posY: number, width: number, color: mod.Vector, anchor: mod.UIAnchor, label?: mod.Message) => {
        if (!widget) return;
        mod.SetUIWidgetPosition(widget, mod.CreateVector(posX, posY, 0));
        mod.SetUIWidgetSize(widget, mod.CreateVector(width, 14, 0));
        mod.SetUITextSize(widget, 10);
        mod.SetUITextColor(widget, color);
        mod.SetUITextAnchor(widget, anchor);
        if (label) {
            mod.SetUITextLabel(widget, label);
        }
    };

    const LABEL_WIDTH = 28;
    const VALUE_WIDTH = 44;
    const COL_1_X = 0;
    const COL_2_X = 72;
    const COL_3_X = 144;
    const POS_LABEL_OFFSET_X = -4;
    const VALUE_OFFSET_X = 30;
    const ROW_1_Y = 0;
    const ROW_2_Y = 16;

    let posXLabel = safeFind(posXLabelId);
    if (!posXLabel) posXLabel = makeText(posXLabelId, COL_1_X + POS_LABEL_OFFSET_X, ROW_1_Y, LABEL_WIDTH, COLOR_GREEN, mod.UIAnchor.CenterLeft, mod.Message(mod.stringkeys.twl.debug.posX));
    let posYLabel = safeFind(posYLabelId);
    if (!posYLabel) posYLabel = makeText(posYLabelId, COL_2_X + POS_LABEL_OFFSET_X, ROW_1_Y, LABEL_WIDTH, COLOR_GREEN, mod.UIAnchor.CenterLeft, mod.Message(mod.stringkeys.twl.debug.posY));
    let posZLabel = safeFind(posZLabelId);
    if (!posZLabel) posZLabel = makeText(posZLabelId, COL_3_X + POS_LABEL_OFFSET_X, ROW_1_Y, LABEL_WIDTH, COLOR_GREEN, mod.UIAnchor.CenterLeft, mod.Message(mod.stringkeys.twl.debug.posZ));
    let posXValue = safeFind(posXValueId);
    if (!posXValue) posXValue = makeText(posXValueId, COL_1_X + VALUE_OFFSET_X, ROW_1_Y, VALUE_WIDTH, COLOR_WHITE, mod.UIAnchor.CenterRight, emptyValueMessage);
    let posYValue = safeFind(posYValueId);
    if (!posYValue) posYValue = makeText(posYValueId, COL_2_X + VALUE_OFFSET_X, ROW_1_Y, VALUE_WIDTH, COLOR_WHITE, mod.UIAnchor.CenterRight, emptyValueMessage);
    let posZValue = safeFind(posZValueId);
    if (!posZValue) posZValue = makeText(posZValueId, COL_3_X + VALUE_OFFSET_X, ROW_1_Y, VALUE_WIDTH, COLOR_WHITE, mod.UIAnchor.CenterRight, emptyValueMessage);

    let rotXLabel = safeFind(rotXLabelId);
    if (!rotXLabel) rotXLabel = makeText(rotXLabelId, COL_1_X, ROW_2_Y, LABEL_WIDTH, COLOR_BLUE, mod.UIAnchor.CenterLeft, mod.Message(mod.stringkeys.twl.debug.rotX));
    let rotYLabel = safeFind(rotYLabelId);
    if (!rotYLabel) rotYLabel = makeText(rotYLabelId, COL_2_X, ROW_2_Y, LABEL_WIDTH, COLOR_BLUE, mod.UIAnchor.CenterLeft, mod.Message(mod.stringkeys.twl.debug.rotY));
    let rotZLabel = safeFind(rotZLabelId);
    if (!rotZLabel) rotZLabel = makeText(rotZLabelId, COL_3_X, ROW_2_Y, LABEL_WIDTH, COLOR_BLUE, mod.UIAnchor.CenterLeft, mod.Message(mod.stringkeys.twl.debug.rotZ));
    let rotXValue = safeFind(rotXValueId);
    if (!rotXValue) rotXValue = makeText(rotXValueId, COL_1_X + VALUE_OFFSET_X, ROW_2_Y, VALUE_WIDTH, COLOR_WHITE, mod.UIAnchor.CenterRight, emptyValueMessage);
    let rotYValue = safeFind(rotYValueId);
    if (!rotYValue) rotYValue = makeText(rotYValueId, COL_2_X + VALUE_OFFSET_X, ROW_2_Y, VALUE_WIDTH, COLOR_WHITE, mod.UIAnchor.CenterRight, emptyValueMessage);
    let rotZValue = safeFind(rotZValueId);
    if (!rotZValue) rotZValue = makeText(rotZValueId, COL_3_X + VALUE_OFFSET_X, ROW_2_Y, VALUE_WIDTH, COLOR_WHITE, mod.UIAnchor.CenterRight, emptyValueMessage);

    normalizeText(posXLabel, COL_1_X + POS_LABEL_OFFSET_X, ROW_1_Y, LABEL_WIDTH, COLOR_GREEN, mod.UIAnchor.CenterLeft, mod.Message(mod.stringkeys.twl.debug.posX));
    normalizeText(posYLabel, COL_2_X + POS_LABEL_OFFSET_X, ROW_1_Y, LABEL_WIDTH, COLOR_GREEN, mod.UIAnchor.CenterLeft, mod.Message(mod.stringkeys.twl.debug.posY));
    normalizeText(posZLabel, COL_3_X + POS_LABEL_OFFSET_X, ROW_1_Y, LABEL_WIDTH, COLOR_GREEN, mod.UIAnchor.CenterLeft, mod.Message(mod.stringkeys.twl.debug.posZ));
    normalizeText(posXValue, COL_1_X + VALUE_OFFSET_X, ROW_1_Y, VALUE_WIDTH, COLOR_WHITE, mod.UIAnchor.CenterRight);
    normalizeText(posYValue, COL_2_X + VALUE_OFFSET_X, ROW_1_Y, VALUE_WIDTH, COLOR_WHITE, mod.UIAnchor.CenterRight);
    normalizeText(posZValue, COL_3_X + VALUE_OFFSET_X, ROW_1_Y, VALUE_WIDTH, COLOR_WHITE, mod.UIAnchor.CenterRight);
    normalizeText(rotXLabel, COL_1_X, ROW_2_Y, LABEL_WIDTH, COLOR_BLUE, mod.UIAnchor.CenterLeft, mod.Message(mod.stringkeys.twl.debug.rotX));
    normalizeText(rotYLabel, COL_2_X, ROW_2_Y, LABEL_WIDTH, COLOR_BLUE, mod.UIAnchor.CenterLeft, mod.Message(mod.stringkeys.twl.debug.rotY));
    normalizeText(rotZLabel, COL_3_X, ROW_2_Y, LABEL_WIDTH, COLOR_BLUE, mod.UIAnchor.CenterLeft, mod.Message(mod.stringkeys.twl.debug.rotZ));
    normalizeText(rotXValue, COL_1_X + VALUE_OFFSET_X, ROW_2_Y, VALUE_WIDTH, COLOR_WHITE, mod.UIAnchor.CenterRight);
    normalizeText(rotYValue, COL_2_X + VALUE_OFFSET_X, ROW_2_Y, VALUE_WIDTH, COLOR_WHITE, mod.UIAnchor.CenterRight);
    normalizeText(rotZValue, COL_3_X + VALUE_OFFSET_X, ROW_2_Y, VALUE_WIDTH, COLOR_WHITE, mod.UIAnchor.CenterRight);

    if (!posXLabel || !posYLabel || !posZLabel || !posXValue || !posYValue || !posZValue || !rotXLabel || !rotYLabel || !rotZLabel || !rotXValue || !rotYValue || !rotZValue) return undefined;
    return { posXLabel, posYLabel, posZLabel, posXValue, posYValue, posZValue, rotXLabel, rotYLabel, rotZLabel, rotXValue, rotYValue, rotZValue };
}

function trySamplePositionDebugSnapshot(player: mod.Player, pid: number): {
    pos: mod.Vector;
    rotX: number;
    rotY: number;
    rotZ: number;
} | undefined {
    const sampleSoldierVector = (stateKey: any): mod.Vector | undefined => {
        try {
            return mod.GetSoldierState(player, stateKey) as unknown as mod.Vector;
        } catch {
            return undefined;
        }
    };

    const transformSource = State.players.posDebugTransformSourceByPid[pid] ?? "soldier";
    if (transformSource === "vehicle") {
        try {
            const seatIndex = mod.GetPlayerVehicleSeat(player);
            const vehicle = mod.GetVehicleFromPlayer(player);
            if (vehicle && seatIndex >= 0) {
                const pos = mod.GetVehicleState(vehicle, mod.VehicleStateVector.VehiclePosition);
                const facing = mod.GetVehicleState(vehicle, mod.VehicleStateVector.FacingDirection);
                const facingX = mod.XComponentOf(facing);
                const facingY = mod.YComponentOf(facing);
                const facingZ = mod.ZComponentOf(facing);
                const planarMagnitude = Math.sqrt((facingX * facingX) + (facingZ * facingZ));
                const pitchRad = Math.atan2(facingY, Math.max(0.0001, planarMagnitude));
                const yawRad = Math.atan2(facingX, facingZ);
                let rotZ = 0;
                try {
                    const rot = mod.GetObjectRotation(vehicle);
                    rotZ = mod.ZComponentOf(rot);
                } catch {}
                if (pos) {
                    return {
                        pos,
                        rotX: (pitchRad * 180) / Math.PI,
                        rotY: (yawRad * 180) / Math.PI,
                        rotZ,
                    };
                }
            }
        } catch {
            // Fall through to soldier sampling.
        }
    }

    try {
        const pos = mod.GetObjectPosition(player as any);
        const rot = mod.GetObjectRotation(player as any);
        return {
            pos,
            rotX: mod.XComponentOf(rot),
            rotY: mod.YComponentOf(rot),
            rotZ: mod.ZComponentOf(rot),
        };
    } catch {
        const pos = sampleSoldierVector(mod.SoldierStateVector.GetPosition);
        const facing = sampleSoldierVector(mod.SoldierStateVector.GetFacingDirection);
        if (!pos || !facing) return undefined;
        const facingX = mod.XComponentOf(facing);
        const facingY = mod.YComponentOf(facing);
        const facingZ = mod.ZComponentOf(facing);
        const planarMagnitude = Math.sqrt((facingX * facingX) + (facingZ * facingZ));
        const pitchRad = Math.atan2(facingY, Math.max(0.0001, planarMagnitude));
        const yawRad = Math.atan2(facingX, facingZ);
        return {
            pos,
            rotX: (pitchRad * 180) / Math.PI,
            rotY: (yawRad * 180) / Math.PI,
            rotZ: 0,
        };
    }
}

function applyPositionDebugSnapshot(
    widgets: {
        posXValue: mod.UIWidget; posYValue: mod.UIWidget; posZValue: mod.UIWidget;
        rotXValue: mod.UIWidget; rotYValue: mod.UIWidget; rotZValue: mod.UIWidget;
    },
    snapshot: { pos: mod.Vector; rotX: number; rotY: number; rotZ: number }
): void {
    const roundTo3 = (value: number) => Math.round(value * 1000) / 1000;
    mod.SetUITextLabel(widgets.posXValue, mod.Message(mod.stringkeys.twl.system.genericCounter, roundTo3(mod.XComponentOf(snapshot.pos))));
    mod.SetUITextLabel(widgets.posYValue, mod.Message(mod.stringkeys.twl.system.genericCounter, roundTo3(mod.YComponentOf(snapshot.pos))));
    mod.SetUITextLabel(widgets.posZValue, mod.Message(mod.stringkeys.twl.system.genericCounter, roundTo3(mod.ZComponentOf(snapshot.pos))));
    mod.SetUITextLabel(widgets.rotXValue, mod.Message(mod.stringkeys.twl.system.genericCounter, roundTo3(snapshot.rotX)));
    mod.SetUITextLabel(widgets.rotYValue, mod.Message(mod.stringkeys.twl.system.genericCounter, roundTo3(snapshot.rotY)));
    mod.SetUITextLabel(widgets.rotZValue, mod.Message(mod.stringkeys.twl.system.genericCounter, roundTo3(snapshot.rotZ)));
}

async function positionDebugLoop(player: mod.Player, expectedToken: number): Promise<void> {
    const pid = mod.GetObjId(player);
    while (true) {
        const state = State.players.readyDialogData[pid];
        if (!state || !state.posDebugVisible || state.posDebugToken !== expectedToken) return;
        if (!mod.IsPlayerValid(player)) return;
        if (!isPlayerDeployed(player)) return;

        const widgets = ensurePositionDebugWidgets(player);
        if (!widgets) {
            await mod.Wait(0.5);
            continue;
        }
        const snapshot = trySamplePositionDebugSnapshot(player, pid);
        if (!snapshot) {
            await mod.Wait(0.5);
            continue;
        }

        applyPositionDebugSnapshot(widgets, snapshot);
        const container = safeFind(UI_POS_DEBUG_CONTAINER_ID + pid);
        if (container) mod.SetUIWidgetVisible(container, true);
        mod.SetUIWidgetVisible(widgets.posXLabel, true);
        mod.SetUIWidgetVisible(widgets.posYLabel, true);
        mod.SetUIWidgetVisible(widgets.posZLabel, true);
        mod.SetUIWidgetVisible(widgets.posXValue, true);
        mod.SetUIWidgetVisible(widgets.posYValue, true);
        mod.SetUIWidgetVisible(widgets.posZValue, true);
        mod.SetUIWidgetVisible(widgets.rotXLabel, true);
        mod.SetUIWidgetVisible(widgets.rotYLabel, true);
        mod.SetUIWidgetVisible(widgets.rotZLabel, true);
        mod.SetUIWidgetVisible(widgets.rotXValue, true);
        mod.SetUIWidgetVisible(widgets.rotYValue, true);
        mod.SetUIWidgetVisible(widgets.rotZValue, true);

        await mod.Wait(0.5);
    }
}

// Toggles position-debug visibility for a single player and starts/stops refresh loop.
function setPositionDebugVisibleForPlayer(player: mod.Player, visible: boolean): void {
    const pid = mod.GetObjId(player);
    const state = State.players.readyDialogData[pid];
    if (!state) return;

    const widgets = ensurePositionDebugWidgets(player);
    if (!widgets) return;

    if (visible && (state.hudSwapTransitionActive === true || !isHudWarmReadyForPid(pid))) {
        visible = false;
    }

    state.posDebugToken = (state.posDebugToken + 1) % 1000000000;
    const container = safeFind(UI_POS_DEBUG_CONTAINER_ID + pid);
    const applyVisible = (nextVisible: boolean): void => {
        if (container) mod.SetUIWidgetVisible(container, nextVisible);
        mod.SetUIWidgetVisible(widgets.posXLabel, nextVisible);
        mod.SetUIWidgetVisible(widgets.posYLabel, nextVisible);
        mod.SetUIWidgetVisible(widgets.posZLabel, nextVisible);
        mod.SetUIWidgetVisible(widgets.posXValue, nextVisible);
        mod.SetUIWidgetVisible(widgets.posYValue, nextVisible);
        mod.SetUIWidgetVisible(widgets.posZValue, nextVisible);
        mod.SetUIWidgetVisible(widgets.rotXLabel, nextVisible);
        mod.SetUIWidgetVisible(widgets.rotYLabel, nextVisible);
        mod.SetUIWidgetVisible(widgets.rotZLabel, nextVisible);
        mod.SetUIWidgetVisible(widgets.rotXValue, nextVisible);
        mod.SetUIWidgetVisible(widgets.rotYValue, nextVisible);
        mod.SetUIWidgetVisible(widgets.rotZValue, nextVisible);
    };

    if (!visible) {
        applyVisible(false);
        return;
    }

    const snapshot = trySamplePositionDebugSnapshot(player, pid);
    if (snapshot) {
        applyPositionDebugSnapshot(widgets, snapshot);
        applyVisible(true);
    } else {
        applyVisible(false);
    }
    void positionDebugLoop(player, state.posDebugToken);
}

//#endregion ----------------- Admin Panel UI builder helpers --------------------
