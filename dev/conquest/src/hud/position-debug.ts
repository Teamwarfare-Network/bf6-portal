// @ts-nocheck
// Module: hud/position-debug -- on-screen position/rotation debug overlay for vehicle spawn tuning
// Extracted from admin-panel/build.ts to allow use without the admin panel feature.
// Gated by FEATURE_POSITION_DEBUG. When enabled, auto-starts for every player on deploy.

//#region -------------------- Position Debug - Widget Ensure --------------------

// Creates (or reuses) the 11-label debug overlay anchored top-right.
// Row 1: posX / posY / posZ (green labels, white values)
// Row 2: rotX / rotY / source indicator ("Vehicle Pos/Rot" or "Soldier Pos/Rot")
function ensurePositionDebugWidgets(player: mod.Player): {
    posXLabel: mod.UIWidget; posYLabel: mod.UIWidget; posZLabel: mod.UIWidget;
    posXValue: mod.UIWidget; posYValue: mod.UIWidget; posZValue: mod.UIWidget;
    rotXLabel: mod.UIWidget; rotYLabel: mod.UIWidget;
    rotXValue: mod.UIWidget; rotYValue: mod.UIWidget;
    sourceLabel: mod.UIWidget;
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
    const rotXValueId = UI_POS_DEBUG_ROTX_VALUE_ID + pid;
    const rotYValueId = UI_POS_DEBUG_ROTY_VALUE_ID + pid;
    // Repurpose the rotZ label slot for the transform source indicator.
    const sourceLabelId = UI_POS_DEBUG_ROTZ_ID + pid;

    let container = safeFind(containerId);
    if (!container) {
        mod.AddUIContainer(
            containerId,
            mod.CreateVector(300, 17, 0),
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
        container = safeFind(containerId);
    }
    safeSetUIWidgetVisible(container, false);

    const emptyValueMessage = msg(STR_SYS_COUNTER, " ");

    const makeText = (id: string, posX: number, posY: number, width: number, color: mod.Vector, anchor: mod.UIAnchor, label: mod.Message) => {
        let w = safeFind(id);
        if (!w) {
            const parsed = safeParseUI({
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
        safeSetUIWidgetVisible(w, false);
        return w;
    };

    const normalizeText = (widget: mod.UIWidget | undefined, posX: number, posY: number, width: number, color: mod.Vector, anchor: mod.UIAnchor, label?: mod.Message) => {
        if (!widget) return;
        safeSetUIWidgetPosition(widget, mod.CreateVector(posX, posY, 0));
        safeSetUIWidgetSize(widget, mod.CreateVector(width, 14, 0));
        try {
            mod.SetUITextSize(widget, 10);
        } catch {}
        safeSetUITextColor(widget, color);
        try {
            mod.SetUITextAnchor(widget, anchor);
        } catch {}
        if (label) {
            safeSetUITextLabel(widget, label);
        }
    };

    const LABEL_WIDTH = 28;
    const VALUE_WIDTH = 44;
    const COL_1_X = 0;
    const COL_2_X = 72;
    const COL_3_X = 144;
    const LABEL_SHIFT_X = 10;
    const POS_LABEL_OFFSET_X = -4 + LABEL_SHIFT_X;
    const ROT_LABEL_OFFSET_X = LABEL_SHIFT_X;
    const VALUE_OFFSET_X = 30 - 5;
    const ROW_1_Y = 0;
    const ROW_2_Y = 16;
    const SOURCE_WIDTH = 72;

    let posXLabel = safeFind(posXLabelId);
    if (!posXLabel) posXLabel = makeText(posXLabelId, COL_1_X + POS_LABEL_OFFSET_X, ROW_1_Y, LABEL_WIDTH, COLOR_GREEN, mod.UIAnchor.CenterLeft, msg(mod.stringkeys.twl.debug.posX));
    let posYLabel = safeFind(posYLabelId);
    if (!posYLabel) posYLabel = makeText(posYLabelId, COL_2_X + POS_LABEL_OFFSET_X, ROW_1_Y, LABEL_WIDTH, COLOR_GREEN, mod.UIAnchor.CenterLeft, msg(mod.stringkeys.twl.debug.posY));
    let posZLabel = safeFind(posZLabelId);
    if (!posZLabel) posZLabel = makeText(posZLabelId, COL_3_X + POS_LABEL_OFFSET_X, ROW_1_Y, LABEL_WIDTH, COLOR_GREEN, mod.UIAnchor.CenterLeft, msg(mod.stringkeys.twl.debug.posZ));
    let posXValue = safeFind(posXValueId);
    if (!posXValue) posXValue = makeText(posXValueId, COL_1_X + VALUE_OFFSET_X, ROW_1_Y, VALUE_WIDTH, COLOR_WHITE, mod.UIAnchor.CenterRight, emptyValueMessage);
    let posYValue = safeFind(posYValueId);
    if (!posYValue) posYValue = makeText(posYValueId, COL_2_X + VALUE_OFFSET_X, ROW_1_Y, VALUE_WIDTH, COLOR_WHITE, mod.UIAnchor.CenterRight, emptyValueMessage);
    let posZValue = safeFind(posZValueId);
    if (!posZValue) posZValue = makeText(posZValueId, COL_3_X + VALUE_OFFSET_X, ROW_1_Y, VALUE_WIDTH, COLOR_WHITE, mod.UIAnchor.CenterRight, emptyValueMessage);

    let rotXLabel = safeFind(rotXLabelId);
    if (!rotXLabel) rotXLabel = makeText(rotXLabelId, COL_1_X + ROT_LABEL_OFFSET_X, ROW_2_Y, LABEL_WIDTH, COLOR_BLUE, mod.UIAnchor.CenterLeft, msg(mod.stringkeys.twl.debug.rotX));
    let rotYLabel = safeFind(rotYLabelId);
    if (!rotYLabel) rotYLabel = makeText(rotYLabelId, COL_2_X + ROT_LABEL_OFFSET_X, ROW_2_Y, LABEL_WIDTH, COLOR_BLUE, mod.UIAnchor.CenterLeft, msg(mod.stringkeys.twl.debug.rotY));
    let rotXValue = safeFind(rotXValueId);
    if (!rotXValue) rotXValue = makeText(rotXValueId, COL_1_X + VALUE_OFFSET_X, ROW_2_Y, VALUE_WIDTH, COLOR_WHITE, mod.UIAnchor.CenterRight, emptyValueMessage);
    let rotYValue = safeFind(rotYValueId);
    if (!rotYValue) rotYValue = makeText(rotYValueId, COL_2_X + VALUE_OFFSET_X, ROW_2_Y, VALUE_WIDTH, COLOR_WHITE, mod.UIAnchor.CenterRight, emptyValueMessage);

    // Source indicator: uses the full third column width, yellow text, right-aligned.
    const sourceMessage = msg(mod.stringkeys.twl.debug.srcSoldier);
    let sourceLabel = safeFind(sourceLabelId);
    if (!sourceLabel) sourceLabel = makeText(sourceLabelId, COL_3_X, ROW_2_Y, SOURCE_WIDTH, COLOR_YELLOW, mod.UIAnchor.CenterRight, sourceMessage);

    normalizeText(posXLabel, COL_1_X + POS_LABEL_OFFSET_X, ROW_1_Y, LABEL_WIDTH, COLOR_GREEN, mod.UIAnchor.CenterLeft, msg(mod.stringkeys.twl.debug.posX));
    normalizeText(posYLabel, COL_2_X + POS_LABEL_OFFSET_X, ROW_1_Y, LABEL_WIDTH, COLOR_GREEN, mod.UIAnchor.CenterLeft, msg(mod.stringkeys.twl.debug.posY));
    normalizeText(posZLabel, COL_3_X + POS_LABEL_OFFSET_X, ROW_1_Y, LABEL_WIDTH, COLOR_GREEN, mod.UIAnchor.CenterLeft, msg(mod.stringkeys.twl.debug.posZ));
    normalizeText(posXValue, COL_1_X + VALUE_OFFSET_X, ROW_1_Y, VALUE_WIDTH, COLOR_WHITE, mod.UIAnchor.CenterRight);
    normalizeText(posYValue, COL_2_X + VALUE_OFFSET_X, ROW_1_Y, VALUE_WIDTH, COLOR_WHITE, mod.UIAnchor.CenterRight);
    normalizeText(posZValue, COL_3_X + VALUE_OFFSET_X, ROW_1_Y, VALUE_WIDTH, COLOR_WHITE, mod.UIAnchor.CenterRight);
    normalizeText(rotXLabel, COL_1_X + ROT_LABEL_OFFSET_X, ROW_2_Y, LABEL_WIDTH, COLOR_BLUE, mod.UIAnchor.CenterLeft, msg(mod.stringkeys.twl.debug.rotX));
    normalizeText(rotYLabel, COL_2_X + ROT_LABEL_OFFSET_X, ROW_2_Y, LABEL_WIDTH, COLOR_BLUE, mod.UIAnchor.CenterLeft, msg(mod.stringkeys.twl.debug.rotY));
    normalizeText(rotXValue, COL_1_X + VALUE_OFFSET_X, ROW_2_Y, VALUE_WIDTH, COLOR_WHITE, mod.UIAnchor.CenterRight);
    normalizeText(rotYValue, COL_2_X + VALUE_OFFSET_X, ROW_2_Y, VALUE_WIDTH, COLOR_WHITE, mod.UIAnchor.CenterRight);
    normalizeText(sourceLabel, COL_3_X, ROW_2_Y, SOURCE_WIDTH, COLOR_YELLOW, mod.UIAnchor.CenterRight);

    if (!posXLabel || !posYLabel || !posZLabel || !posXValue || !posYValue || !posZValue || !rotXLabel || !rotYLabel || !rotXValue || !rotYValue || !sourceLabel) return undefined;
    return { posXLabel, posYLabel, posZLabel, posXValue, posYValue, posZValue, rotXLabel, rotYLabel, rotXValue, rotYValue, sourceLabel };
}

//#endregion

//#region -------------------- Position Debug - Snapshot --------------------

// Samples position and rotation from soldier or vehicle depending on current transform source.
// rotX = pitch [-90, +90], rotY = yaw [-180, +180]. Both derived from FacingDirection vector.
function trySamplePositionDebugSnapshot(player: mod.Player, pid: number): {
    pos: mod.Vector;
    rotX: number;
    rotY: number;
    isVehicle: boolean;
} | undefined {
    // Route soldier samples through the safe wrapper so pre-deploy / death races don't log engine
    // errors (CQ_Bug_50). The wrapper pre-checks isPlayerDeployed and updates deployedByPid on catch,
    // so the next loop tick exits cleanly instead of re-logging the same error every 0.5s.
    const sampleSoldierVector = (stateKey: any): mod.Vector | undefined => {
        return safeGetSoldierStateVector(player, stateKey);
    };

    const transformSource = State.players.posDebugTransformSourceByPid[pid] ?? "soldier";
    if (transformSource === "vehicle") {
        try {
            const vehicleObjId = State.players.posDebugVehicleObjIdByPid[pid];
            const vehicle = vehicleObjId !== undefined ? findVehicleById(vehicleObjId) : undefined;
            if (!vehicle) return undefined;
            const pos = mod.GetVehicleState(vehicle, mod.VehicleStateVector.VehiclePosition);
            if (!pos) return undefined;

            // rotX (pitch) and rotY (yaw): always derive from FacingDirection vector.
            // This is the proven approach — GetObjectRotation returns unreliable data for many vehicle types.
            const facing = mod.GetVehicleState(vehicle, mod.VehicleStateVector.FacingDirection);
            const facingX = mod.XComponentOf(facing);
            const facingY = mod.YComponentOf(facing);
            const facingZ = mod.ZComponentOf(facing);
            const planarMagnitude = Math.sqrt((facingX * facingX) + (facingZ * facingZ));
            const pitchDeg = (Math.atan2(facingY, Math.max(0.0001, planarMagnitude)) * 180) / Math.PI;
            const yawDeg = (Math.atan2(facingX, facingZ) * 180) / Math.PI;

            return { pos, rotX: pitchDeg, rotY: yawDeg, isVehicle: true };
        } catch {
            return undefined;
        }
    }

    // Soldier mode: derive pitch/yaw from FacingDirection vector (no GetObjectRotation for soldiers).
    // rotX = pitch (positive = looking up), rotY = yaw (heading in degrees).
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
        isVehicle: false,
    };
}

// Writes snapshot values to the value text widgets and updates the source indicator.
function applyPositionDebugSnapshot(
    pid: number,
    snapshot: { pos: mod.Vector; rotX: number; rotY: number; isVehicle: boolean }
): void {
    const roundTo3 = (value: number) => Math.round(value * 1000) / 1000;
    safeSetUITextLabel(safeFind(UI_POS_DEBUG_X_VALUE_ID + pid), msg(STR_SYS_COUNTER, roundTo3(mod.XComponentOf(snapshot.pos))));
    safeSetUITextLabel(safeFind(UI_POS_DEBUG_Y_VALUE_ID + pid), msg(STR_SYS_COUNTER, roundTo3(mod.YComponentOf(snapshot.pos))));
    safeSetUITextLabel(safeFind(UI_POS_DEBUG_Z_VALUE_ID + pid), msg(STR_SYS_COUNTER, roundTo3(mod.ZComponentOf(snapshot.pos))));
    safeSetUITextLabel(safeFind(UI_POS_DEBUG_ROTX_VALUE_ID + pid), msg(STR_SYS_COUNTER, roundTo3(snapshot.rotX)));
    safeSetUITextLabel(safeFind(UI_POS_DEBUG_ROTY_VALUE_ID + pid), msg(STR_SYS_COUNTER, roundTo3(snapshot.rotY)));
    // Source indicator in the rotZ label slot.
    const sourceMessage = snapshot.isVehicle
        ? msg(mod.stringkeys.twl.debug.srcVehicle)
        : msg(mod.stringkeys.twl.debug.srcSoldier);
    safeSetUITextLabel(safeFind(UI_POS_DEBUG_ROTZ_ID + pid), sourceMessage);
}

//#endregion

//#region -------------------- Position Debug - Loop & Lifecycle --------------------

// Async polling loop that updates the overlay every 0.5s while the player is deployed.
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

        applyPositionDebugSnapshot(pid, snapshot);
        const container = safeFind(UI_POS_DEBUG_CONTAINER_ID + pid);
        safeSetUIWidgetVisible(container, true);
        safeSetUIWidgetVisible(widgets.posXLabel, true);
        safeSetUIWidgetVisible(widgets.posYLabel, true);
        safeSetUIWidgetVisible(widgets.posZLabel, true);
        safeSetUIWidgetVisible(widgets.posXValue, true);
        safeSetUIWidgetVisible(widgets.posYValue, true);
        safeSetUIWidgetVisible(widgets.posZValue, true);
        safeSetUIWidgetVisible(widgets.rotXLabel, true);
        safeSetUIWidgetVisible(widgets.rotYLabel, true);
        safeSetUIWidgetVisible(widgets.rotXValue, true);
        safeSetUIWidgetVisible(widgets.rotYValue, true);
        safeSetUIWidgetVisible(widgets.sourceLabel, true);

        await mod.Wait(0.5);
    }
}

// Activates or deactivates the position debug overlay for a player.
function setPositionDebugVisibleForPlayer(player: mod.Player, visible: boolean): void {
    const pid = mod.GetObjId(player);
    const state = State.players.readyDialogData[pid];
    if (!state) return;

    const widgets = ensurePositionDebugWidgets(player);
    if (!widgets) return;

    state.posDebugToken = (state.posDebugToken + 1) % 1000000000;
    const container = safeFind(UI_POS_DEBUG_CONTAINER_ID + pid);
    const applyVisible = (nextVisible: boolean): void => {
        safeSetUIWidgetVisible(container, nextVisible);
        safeSetUIWidgetVisible(widgets.posXLabel, nextVisible);
        safeSetUIWidgetVisible(widgets.posYLabel, nextVisible);
        safeSetUIWidgetVisible(widgets.posZLabel, nextVisible);
        safeSetUIWidgetVisible(widgets.posXValue, nextVisible);
        safeSetUIWidgetVisible(widgets.posYValue, nextVisible);
        safeSetUIWidgetVisible(widgets.posZValue, nextVisible);
        safeSetUIWidgetVisible(widgets.rotXLabel, nextVisible);
        safeSetUIWidgetVisible(widgets.rotYLabel, nextVisible);
        safeSetUIWidgetVisible(widgets.rotXValue, nextVisible);
        safeSetUIWidgetVisible(widgets.rotYValue, nextVisible);
        safeSetUIWidgetVisible(widgets.sourceLabel, nextVisible);
    };

    if (!visible) {
        applyVisible(false);
        return;
    }

    const snapshot = trySamplePositionDebugSnapshot(player, pid);
    if (snapshot) {
        applyPositionDebugSnapshot(pid, snapshot);
        applyVisible(true);
    } else {
        applyVisible(false);
    }
    void positionDebugLoop(player, state.posDebugToken);
}

// v1.492: position-debug auto-start REMOVED per design.
// The overlay is admin-only, manual-toggle only. The admin must explicitly press
// `Toggle Position Debug` in the admin panel to bring it up. This function is kept as a
// no-op so existing reveal-path callers don't break; it has no production effect.
function autoStartPositionDebugOnDeploy(_player: mod.Player): void {
    return;
}

// v1.492: tear down a player's position-debug overlay (loop cancellation + widget hide).
// Called from `Admin.onAdminPidChanged` when the admin slot changes — without this, the
// prior admin's overlay loop keeps polling state at 0.5s cadence even though they no
// longer have admin status. Delegates to setPositionDebugVisibleForPlayer which already
// token-bumps the loop and hides all 11 widgets via its applyVisible(false) path.
function tearDownPositionDebugForPid(pid: number): void {
    if (!FEATURE_POSITION_DEBUG) return;
    const state = State.players.readyDialogData[pid];
    if (!state) return;
    state.posDebugAdminOverride = false; // reset so future re-deploy doesn't preserve the off state in a sticky way
    const player = safeFindPlayer(pid);
    if (!player) {
        // Player object missing (disconnected); just bump the token + clear the flag.
        state.posDebugVisible = false;
        state.posDebugToken = (state.posDebugToken + 1) % 1000000000;
        return;
    }
    setPositionDebugVisibleForPlayer(player, false);
}

//#endregion
