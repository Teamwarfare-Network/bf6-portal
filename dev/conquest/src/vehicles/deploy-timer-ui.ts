// @ts-nocheck
// Module: vehicles/deploy-timer-ui -- Firestorm helicopter deploy/live timer display with direct spawn buttons

function getVehicleDeployTimerAdminToggleLabelKey(pid: number): number {
    const state = State.players.readyDialogData[pid];
    if (state?.vehicleTimersVisibleWhileDeployed) {
        return mod.stringkeys.twl.adminPanel.tester.buttons.deployTimersVisibleOn;
    }
    return mod.stringkeys.twl.adminPanel.tester.buttons.deployTimersVisibleOff;
}

function syncVehicleDeployTimerAdminToggleLabelForPid(pid: number): void {
    const label = safeFind(UI_TEST_DEPLOY_TIMERS_TOGGLE_TEXT_ID + pid);
    if (!label) return;
    mod.SetUITextLabel(label, mod.Message(getVehicleDeployTimerAdminToggleLabelKey(pid)));
}

function getVehicleDeployTimerLabelKey(vehicleType: mod.VehicleList): number {
    switch (vehicleType) {
        case mod.VehicleList.AH64:
            return mod.stringkeys.twl.readyDialog.vehicleOptionFalchion;
        case mod.VehicleList.Eurocopter:
            return mod.stringkeys.twl.readyDialog.vehicleOptionPanthera;
        case mod.VehicleList.UH60:
        case mod.VehicleList.UH60_Pax:
            return mod.stringkeys.twl.readyDialog.vehicleOptionBlackHawk;
        default:
            return mod.stringkeys.twl.system.unknownPlayer;
    }
}

function getVehicleDeployIdleLabelKey(): number {
    return mod.stringkeys.twl.ui.idle;
}

function getVehicleDeploySpawnButtonName(pid: number, rowIndex: number): string {
    return `${UI_VEHICLE_DEPLOY_TIMER_SPAWN_BUTTON_ID}${pid}_${rowIndex}`;
}

function getVehicleDeployGroundButtonName(pid: number, rowIndex: number): string {
    return `${UI_VEHICLE_DEPLOY_TIMER_GROUND_BUTTON_ID}${pid}_${rowIndex}`;
}

function isVehicleDeployTimerAdminOverrideEnabledForPid(pid: number): boolean {
    return !!State.players.readyDialogData[pid]?.vehicleTimersVisibleWhileDeployed;
}

function getVehicleDeployTrackedSlotsForPlayer(player: mod.Player): VehicleSpawnerSlot[] {
    const teamId = safeGetTeamNumberFromPlayer(player, 0);
    if (teamId !== TeamID.Team1 && teamId !== TeamID.Team2) return [];
    const slots = State.vehicles.slots.filter((slot) =>
        slot.enabled
        && slot.deployFlowTracked
        && slot.teamId === teamId
    );
    slots.sort((a, b) => a.slotNumber - b.slotNumber);
    return slots.slice(0, VEHICLE_DEPLOY_TIMER_MAX_ROWS);
}

function getVehicleDeployRenderSlotsForPlayer(player: mod.Player): VehicleSpawnerSlot[] {
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return [];
    const slots = getVehicleDeployTrackedSlotsForPlayer(player);
    if (!State.players.deployedByPid[pid] || isVehicleDeployTimerAdminOverrideEnabledForPid(pid)) {
        return slots;
    }
    return slots.filter((slot) => slot.vehicleId === -1);
}

function shouldShowVehicleDeployTimersForPid(pid: number): boolean {
    if (isPidDisconnected(pid)) return false;
    const player = safeFindPlayer(pid);
    if (!player || !mod.IsPlayerValid(player)) return false;
    return getVehicleDeployTrackedSlotsForPlayer(player).length > 0;
}

function isVehicleDeploySlotReadyForSpawnButton(slot: VehicleSpawnerSlot | undefined): boolean {
    if (!slot) return false;
    return slot.enabled
        && slot.deployFlowTracked
        && slot.vehicleId === -1
        && slot.pendingSpawnOwnerPid === undefined
        && !slot.expectingSpawn
        && !slot.respawnRunning
        && !slot.spawnRetryScheduled
        && getVehicleSlotRespawnRemainingSeconds(slot) <= 0;
}

function deleteVehicleDeployTimerHudArtifactsForPid(pid: number): void {
    deleteAllReusableTimerWidgetsByName(`VehicleDeployTimerHudRoot_${pid}`);
    for (let i = 0; i < VEHICLE_DEPLOY_TIMER_MAX_ROWS; i++) {
        deleteAllReusableTimerWidgetsByName(`VehicleDeployTimerPlayerPlate_${pid}_${i}`);
        deleteAllReusableTimerWidgetsByName(`VehicleDeployTimerPlayerText_${pid}_${i}`);
        deleteAllReusableTimerWidgetsByName(`VehicleDeployTimerPlayerTextShadow_${pid}_${i}`);
        deleteAllReusableTimerWidgetsByName(`VehicleDeployTimerVehiclePlate_${pid}_${i}`);
        deleteAllReusableTimerWidgetsByName(`VehicleDeployTimerVehicleText_${pid}_${i}`);
        deleteAllReusableTimerWidgetsByName(`VehicleDeployTimerVehicleTextShadow_${pid}_${i}`);
        deleteAllReusableTimerWidgetsByName(`VehicleDeployTimerSpawnButtonBorder_${pid}_${i}`);
        deleteAllReusableTimerWidgetsByName(`VehicleDeployTimerSpawnButtonBlur_${pid}_${i}`);
        deleteAllReusableTimerWidgetsByName(`VehicleDeployTimerSpawnButtonFill_${pid}_${i}`);
        deleteAllReusableTimerWidgetsByName(`VehicleDeployTimerSpawnButtonText_${pid}_${i}`);
        deleteAllReusableTimerWidgetsByName(`VehicleDeployTimerSpawnButtonTextShadow_${pid}_${i}`);
        deleteAllReusableTimerWidgetsByName(getVehicleDeploySpawnButtonName(pid, i));
        deleteAllReusableTimerWidgetsByName(`VehicleDeployTimerGroundButtonBorder_${pid}_${i}`);
        deleteAllReusableTimerWidgetsByName(`VehicleDeployTimerGroundButtonBlur_${pid}_${i}`);
        deleteAllReusableTimerWidgetsByName(`VehicleDeployTimerGroundButtonFill_${pid}_${i}`);
        deleteAllReusableTimerWidgetsByName(`VehicleDeployTimerGroundButtonText_${pid}_${i}`);
        deleteAllReusableTimerWidgetsByName(`VehicleDeployTimerGroundButtonTextShadow_${pid}_${i}`);
        deleteAllReusableTimerWidgetsByName(getVehicleDeployGroundButtonName(pid, i));
        deleteAllReusableTimerWidgetsByName(`VehicleDeployTimerCheckboxPlate_${pid}_${i}`);
        deleteAllReusableTimerWidgetsByName(`VehicleDeployTimerCheckboxHighlight_${pid}_${i}`);
        deleteAllReusableTimerWidgetsByName(`VehicleDeployTimerCheckboxBorderTop_${pid}_${i}`);
        deleteAllReusableTimerWidgetsByName(`VehicleDeployTimerCheckboxBorderBottom_${pid}_${i}`);
        deleteAllReusableTimerWidgetsByName(`VehicleDeployTimerCheckboxBorderLeft_${pid}_${i}`);
        deleteAllReusableTimerWidgetsByName(`VehicleDeployTimerCheckboxBorderRight_${pid}_${i}`);
        deleteAllReusableTimerWidgetsByName(`VehicleDeployTimerCheckboxMarkShadow_${pid}_${i}`);
        deleteAllReusableTimerWidgetsByName(`VehicleDeployTimerCheckboxMark_${pid}_${i}`);
        purgeReusableTimerInstance(`VehicleDeployTimerSlot${i}`, pid);
    }
}

function getVehicleDeployTimerRowBaseY(index: number): number {
    return VEHICLE_DEPLOY_TIMER_ROOT_HEIGHT
        - VEHICLE_DEPLOY_TIMER_ROW_HEIGHT
        - ((VEHICLE_DEPLOY_TIMER_ROW_HEIGHT + VEHICLE_DEPLOY_TIMER_ROW_GAP_Y) * index);
}

function isVehicleDeployTimerRowCacheUsable(row: VehicleDeployTimerRowCacheEntry | undefined): boolean {
    return !!(
        row
        && row.playerPlate
        && row.playerShadow
        && row.playerText
        && row.vehiclePlate
        && row.vehicleShadow
        && row.vehicleText
        && row.spawnButtonBorder
        && row.spawnButtonBlur
        && row.spawnButtonFill
        && row.spawnButton
        && row.spawnButtonTextShadow
        && row.spawnButtonText
        && row.groundButtonBorder
        && row.groundButtonBlur
        && row.groundButtonFill
        && row.groundButton
        && row.groundButtonTextShadow
        && row.groundButtonText
        && row.timer?.root
        && row.timer?.plate
        && row.timer?.minTens
        && row.timer?.minOnes
        && row.timer?.colon
        && row.timer?.secTens
        && row.timer?.secOnes
    );
}

function isVehicleDeployTimerHudCacheUsable(cache: VehicleDeployTimerHudCacheEntry | undefined): boolean {
    if (!cache || !safeFind(cache.rootName)) return false;
    if (cache.rows.length < VEHICLE_DEPLOY_TIMER_MAX_ROWS) return false;
    for (let i = 0; i < VEHICLE_DEPLOY_TIMER_MAX_ROWS; i++) {
        if (!isVehicleDeployTimerRowCacheUsable(cache.rows[i])) {
            return false;
        }
    }
    return true;
}

function ensureVehicleDeployInfoPlate(
    name: string,
    player: mod.Player,
    parent: mod.UIWidget,
    x: number,
    y: number,
    width: number,
    height: number,
    fill: mod.UIBgFill,
    alpha: number,
    color: mod.Vector
): mod.UIWidget | undefined {
    let widget = safeFind(name);
    if (!widget) {
        const parsed = modlib.ParseUI({
            name,
            type: "Container",
            playerId: player,
            position: [x, y],
            size: [width, height],
            anchor: mod.UIAnchor.TopLeft,
            visible: true,
            padding: 0,
            bgAlpha: alpha,
            bgColor: [
                mod.XComponentOf(color),
                mod.YComponentOf(color),
                mod.ZComponentOf(color),
            ],
            bgFill: fill,
        });
        widget = parsed ?? safeFind(name);
    }
    if (!widget) return undefined;
    try {
        mod.SetUIWidgetParent(widget, parent);
        mod.SetUIWidgetAnchor(widget, mod.UIAnchor.TopLeft);
        mod.SetUIWidgetPosition(widget, mod.CreateVector(x, y, 0));
        mod.SetUIWidgetSize(widget, mod.CreateVector(width, height, 0));
        mod.SetUIWidgetBgColor(widget, color);
        mod.SetUIWidgetBgAlpha(widget, alpha);
        mod.SetUIWidgetBgFill(widget, fill);
        mod.SetUIWidgetDepth(widget, mod.UIDepth.AboveGameUI);
    } catch {
        return undefined;
    }
    return widget;
}

function ensureVehicleDeployCenteredText(
    name: string,
    player: mod.Player,
    parent: mod.UIWidget,
    width: number,
    height: number,
    shadow: boolean,
    textSize: number = VEHICLE_DEPLOY_TIMER_INFO_TEXT_SIZE
): mod.UIWidget | undefined {
    let widget = safeFind(name);
    if (!widget) {
        const parsed = modlib.ParseUI({
            name,
            type: "Text",
            playerId: player,
            position: [
                shadow ? VEHICLE_DEPLOY_TIMER_INFO_TEXT_SHADOW_OFFSET_X : 0,
                shadow ? VEHICLE_DEPLOY_TIMER_INFO_TEXT_SHADOW_OFFSET_Y : 0,
            ],
            size: [width, height],
            anchor: mod.UIAnchor.Center,
            visible: true,
            padding: 0,
            bgAlpha: 0,
            bgFill: mod.UIBgFill.None,
            textLabel: mod.Message(mod.stringkeys.twl.system.unknownPlayer),
            textColor: shadow ? [0, 0, 0] : [1, 1, 1],
            textAlpha: shadow ? VEHICLE_DEPLOY_TIMER_INFO_TEXT_SHADOW_ALPHA : 1,
            textSize,
            textAnchor: mod.UIAnchor.Center,
        });
        widget = parsed ?? safeFind(name);
    }
    if (!widget) return undefined;
    try {
        mod.SetUIWidgetParent(widget, parent);
        mod.SetUIWidgetAnchor(widget, mod.UIAnchor.Center);
        mod.SetUIWidgetPosition(
            widget,
            mod.CreateVector(
                shadow ? VEHICLE_DEPLOY_TIMER_INFO_TEXT_SHADOW_OFFSET_X : 0,
                shadow ? VEHICLE_DEPLOY_TIMER_INFO_TEXT_SHADOW_OFFSET_Y : 0,
                0
            )
        );
        mod.SetUIWidgetSize(widget, mod.CreateVector(width, height, 0));
        mod.SetUITextAnchor(widget, mod.UIAnchor.Center);
        mod.SetUITextSize(widget, textSize);
        mod.SetUIWidgetDepth(widget, mod.UIDepth.AboveGameUI);
    } catch {
        return undefined;
    }
    return widget;
}

type VehicleDeployActionButtonWidgets = {
    border?: mod.UIWidget;
    blur?: mod.UIWidget;
    fill?: mod.UIWidget;
    button?: mod.UIWidget;
    textShadow?: mod.UIWidget;
    text?: mod.UIWidget;
};

function ensureVehicleDeployActionButtonWidgets(
    player: mod.Player,
    parent: mod.UIWidget,
    pid: number,
    rowIndex: number,
    kind: VehicleDirectSpawnMode,
    labelKey: number,
    x: number,
    y: number,
    width: number,
    height: number
): VehicleDeployActionButtonWidgets {
    const baseName = kind === "ground"
        ? getVehicleDeployGroundButtonName(pid, rowIndex)
        : getVehicleDeploySpawnButtonName(pid, rowIndex);
    const stem = kind === "ground" ? "VehicleDeployTimerGroundButton" : "VehicleDeployTimerSpawnButton";
    const borderName = `${stem}Border_${pid}_${rowIndex}`;
    const blurName = `${stem}Blur_${pid}_${rowIndex}`;
    const fillName = `${stem}Fill_${pid}_${rowIndex}`;
    const textShadowName = `${stem}TextShadow_${pid}_${rowIndex}`;
    const textName = `${stem}Text_${pid}_${rowIndex}`;
    const buttonPadding = VEHICLE_DEPLOY_TIMER_SPAWN_BUTTON_BORDER_PADDING;
    const buttonInnerWidth = Math.max(1, width - (buttonPadding * 2));
    const buttonInnerHeight = Math.max(1, height - (buttonPadding * 2));

    const border = ensureVehicleDeployInfoPlate(
        borderName,
        player,
        parent,
        x,
        y,
        width,
        height,
        mod.UIBgFill.OutlineThin,
        1,
        COLOR_WHITE
    );

    const blur = border
        ? ensureVehicleDeployInfoPlate(
            blurName,
            player,
            border,
            VEHICLE_DEPLOY_TIMER_SPAWN_BUTTON_PADDING_BASE,
            VEHICLE_DEPLOY_TIMER_SPAWN_BUTTON_PADDING_BASE,
            Math.max(1, width - (VEHICLE_DEPLOY_TIMER_SPAWN_BUTTON_PADDING_BASE * 2)),
            Math.max(1, height - (VEHICLE_DEPLOY_TIMER_SPAWN_BUTTON_PADDING_BASE * 2)),
            mod.UIBgFill.Blur,
            VEHICLE_DEPLOY_TIMER_SPAWN_BUTTON_BLUR_ALPHA,
            COLOR_WHITE
        )
        : undefined;

    const fill = border
        ? ensureVehicleDeployInfoPlate(
            fillName,
            player,
            border,
            VEHICLE_DEPLOY_TIMER_SPAWN_BUTTON_PADDING_BASE,
            VEHICLE_DEPLOY_TIMER_SPAWN_BUTTON_PADDING_BASE,
            Math.max(1, width - (VEHICLE_DEPLOY_TIMER_SPAWN_BUTTON_PADDING_BASE * 2)),
            Math.max(1, height - (VEHICLE_DEPLOY_TIMER_SPAWN_BUTTON_PADDING_BASE * 2)),
            mod.UIBgFill.GradientTop,
            VEHICLE_DEPLOY_TIMER_SPAWN_BUTTON_BG_ALPHA,
            COLOR_GRAY_DARK
        )
        : undefined;

    let button = safeFind(baseName);
    if (!button && border) {
        mod.AddUIButton(
            baseName,
            mod.CreateVector(buttonPadding, buttonPadding, 0),
            mod.CreateVector(buttonInnerWidth, buttonInnerHeight, 0),
            mod.UIAnchor.Center,
            border,
            true,
            0,
            COLOR_GRAY_DARK,
            1,
            mod.UIBgFill.Solid,
            true,
            COLOR_GRAY_DARK,
            1,
            COLOR_GRAY_DARK,
            1,
            COLOR_GREEN,
            1,
            COLOR_BLUE,
            1,
            COLOR_BLUE,
            1,
            mod.UIDepth.AboveGameUI,
            player
        );
        button = safeFind(baseName);
    }

    if (button && border) {
        try {
            mod.SetUIWidgetParent(button, border);
            mod.SetUIWidgetAnchor(button, mod.UIAnchor.TopLeft);
            mod.SetUIWidgetPosition(button, mod.CreateVector(buttonPadding, buttonPadding, 0));
            mod.SetUIWidgetSize(button, mod.CreateVector(buttonInnerWidth, buttonInnerHeight, 0));
            mod.SetUIWidgetDepth(button, mod.UIDepth.AboveGameUI);
            mod.EnableUIButtonEvent(button, mod.UIButtonEvent.HoverIn, true);
            mod.EnableUIButtonEvent(button, mod.UIButtonEvent.HoverOut, true);
            mod.EnableUIButtonEvent(button, mod.UIButtonEvent.FocusIn, true);
            mod.EnableUIButtonEvent(button, mod.UIButtonEvent.FocusOut, true);
            mod.EnableUIButtonEvent(button, mod.UIButtonEvent.ButtonDown, true);
            mod.EnableUIButtonEvent(button, mod.UIButtonEvent.ButtonUp, true);
            mod.SetUIButtonEnabled(button, true);
            mod.SetUIButtonColorBase(button, COLOR_GRAY_DARK);
            mod.SetUIButtonColorHover(button, COLOR_BLUE);
            mod.SetUIButtonColorFocused(button, COLOR_BLUE);
            mod.SetUIButtonColorPressed(button, COLOR_GREEN);
            mod.SetUIButtonColorDisabled(button, COLOR_GRAY_DARK);
            mod.SetUIButtonAlphaBase(button, 1);
            mod.SetUIButtonAlphaHover(button, 1);
            mod.SetUIButtonAlphaFocused(button, 1);
            mod.SetUIButtonAlphaPressed(button, 1);
            mod.SetUIButtonAlphaDisabled(button, 1);
        } catch {
            button = undefined;
        }
    }

    const textShadow = border
        ? ensureVehicleDeployCenteredText(textShadowName, player, border, width, height, true, VEHICLE_DEPLOY_TIMER_SPAWN_BUTTON_TEXT_SIZE)
        : undefined;
    const text = border
        ? ensureVehicleDeployCenteredText(textName, player, border, width, height, false, VEHICLE_DEPLOY_TIMER_SPAWN_BUTTON_TEXT_SIZE)
        : undefined;
    safeSetUITextLabel(textShadow, mod.Message(labelKey));
    safeSetUITextLabel(text, mod.Message(labelKey));
    safeSetUITextColor(text, COLOR_WHITE);
    safeSetUITextColor(textShadow, COLOR_DARK_BLACK);

    return { border, blur, fill, button, textShadow, text };
}

function getVehicleDeployAirButtonWidgets(row: VehicleDeployTimerRowCacheEntry | undefined): VehicleDeployActionButtonWidgets {
    return {
        border: row?.spawnButtonBorder,
        blur: row?.spawnButtonBlur,
        fill: row?.spawnButtonFill,
        button: row?.spawnButton,
        textShadow: row?.spawnButtonTextShadow,
        text: row?.spawnButtonText,
    };
}

function getVehicleDeployGroundButtonWidgets(row: VehicleDeployTimerRowCacheEntry | undefined): VehicleDeployActionButtonWidgets {
    return {
        border: row?.groundButtonBorder,
        blur: row?.groundButtonBlur,
        fill: row?.groundButtonFill,
        button: row?.groundButton,
        textShadow: row?.groundButtonTextShadow,
        text: row?.groundButtonText,
    };
}

function applyVehicleDeployActionButtonVisualState(
    widgets: VehicleDeployActionButtonWidgets,
    active: boolean,
    pressed: boolean,
    priorState?: "base" | "hover" | "pressed"
): "base" | "hover" | "pressed" {
    const visualState = pressed ? "pressed" : active ? "hover" : "base";
    if (priorState === visualState) return visualState;
    safeSetUIWidgetBgColor(widgets.border, active || pressed ? COLOR_DARK_BLACK : COLOR_WHITE);
    safeSetUIWidgetVisible(widgets.blur, false);
    safeSetUIWidgetVisible(widgets.fill, false);
    safeSetUITextColor(widgets.text, COLOR_WHITE);
    safeSetUITextColor(widgets.textShadow, COLOR_DARK_BLACK);
    return visualState;
}

function applyVehicleDeploySpawnButtonVisualState(
    row: VehicleDeployTimerRowCacheEntry | undefined,
    active: boolean,
    pressed: boolean
): void {
    if (!row) return;
    row.lastSpawnButtonVisualState = applyVehicleDeployActionButtonVisualState(
        getVehicleDeployAirButtonWidgets(row),
        active,
        pressed,
        row.lastSpawnButtonVisualState
    );
}

function applyVehicleDeployGroundButtonVisualState(
    row: VehicleDeployTimerRowCacheEntry | undefined,
    active: boolean,
    pressed: boolean
): void {
    if (!row) return;
    row.lastGroundButtonVisualState = applyVehicleDeployActionButtonVisualState(
        getVehicleDeployGroundButtonWidgets(row),
        active,
        pressed,
        row.lastGroundButtonVisualState
    );
}

function layoutVehicleDeployRowForState(
    row: VehicleDeployTimerRowCacheEntry | undefined,
    showPlayerName: boolean,
    showSpawnButton: boolean,
    showGroundButton: boolean
): void {
    if (!row) return;
    if (
        row.lastShowPlayerName === showPlayerName
        && row.lastShowSpawnButton === showSpawnButton
        && row.lastShowGroundButton === showGroundButton
    ) {
        return;
    }
    const timerX = VEHICLE_DEPLOY_TIMER_TIMER_X;
    const timerWidth = VEHICLE_DEPLOY_TIMER_WIDTH;
    const vehicleWidth = VEHICLE_DEPLOY_TIMER_VEHICLE_PLATE_WIDTH;
    const vehicleX = timerX - VEHICLE_DEPLOY_TIMER_ROW_GAP_X - vehicleWidth;
    const totalButtonWidth = (
        (showGroundButton ? VEHICLE_DEPLOY_TIMER_SPAWN_BUTTON_WIDTH : 0)
        + (showSpawnButton ? VEHICLE_DEPLOY_TIMER_SPAWN_BUTTON_WIDTH : 0)
        + (showGroundButton && showSpawnButton ? VEHICLE_DEPLOY_TIMER_ROW_GAP_X : 0)
    );
    const leftWidth = showPlayerName
        ? 96
        : totalButtonWidth > 0
            ? totalButtonWidth
            : 0;
    const leftX = vehicleX - (leftWidth > 0 ? (VEHICLE_DEPLOY_TIMER_ROW_GAP_X + leftWidth) : 0);
    const groundButtonX = leftX;
    const airButtonX = showGroundButton
        ? leftX + VEHICLE_DEPLOY_TIMER_SPAWN_BUTTON_WIDTH + VEHICLE_DEPLOY_TIMER_ROW_GAP_X
        : leftX;
    try {
        if (row.playerPlate) {
            mod.SetUIWidgetPosition(row.playerPlate, mod.CreateVector(leftX, mod.YComponentOf(mod.GetUIWidgetPosition(row.playerPlate)), 0));
            mod.SetUIWidgetSize(row.playerPlate, mod.CreateVector(Math.max(1, leftWidth), VEHICLE_DEPLOY_TIMER_INFO_PLATE_HEIGHT, 0));
        }
        if (row.playerShadow) mod.SetUIWidgetSize(row.playerShadow, mod.CreateVector(Math.max(1, leftWidth), VEHICLE_DEPLOY_TIMER_INFO_PLATE_HEIGHT, 0));
        if (row.playerText) mod.SetUIWidgetSize(row.playerText, mod.CreateVector(Math.max(1, leftWidth), VEHICLE_DEPLOY_TIMER_INFO_PLATE_HEIGHT, 0));
        if (row.spawnButtonBorder) {
            mod.SetUIWidgetPosition(row.spawnButtonBorder, mod.CreateVector(airButtonX, mod.YComponentOf(mod.GetUIWidgetPosition(row.spawnButtonBorder)), 0));
            mod.SetUIWidgetSize(row.spawnButtonBorder, mod.CreateVector(VEHICLE_DEPLOY_TIMER_SPAWN_BUTTON_WIDTH, VEHICLE_DEPLOY_TIMER_SPAWN_BUTTON_HEIGHT, 0));
        }
        if (row.spawnButton) {
            const buttonPadding = VEHICLE_DEPLOY_TIMER_SPAWN_BUTTON_BORDER_PADDING;
            mod.SetUIWidgetPosition(row.spawnButton, mod.CreateVector(buttonPadding, buttonPadding, 0));
            mod.SetUIWidgetSize(
                row.spawnButton,
                mod.CreateVector(
                    Math.max(1, VEHICLE_DEPLOY_TIMER_SPAWN_BUTTON_WIDTH - (buttonPadding * 2)),
                    Math.max(1, VEHICLE_DEPLOY_TIMER_SPAWN_BUTTON_HEIGHT - (buttonPadding * 2)),
                    0
                )
            );
        }
        if (row.spawnButtonTextShadow) mod.SetUIWidgetSize(row.spawnButtonTextShadow, mod.CreateVector(VEHICLE_DEPLOY_TIMER_SPAWN_BUTTON_WIDTH, VEHICLE_DEPLOY_TIMER_SPAWN_BUTTON_HEIGHT, 0));
        if (row.spawnButtonText) mod.SetUIWidgetSize(row.spawnButtonText, mod.CreateVector(VEHICLE_DEPLOY_TIMER_SPAWN_BUTTON_WIDTH, VEHICLE_DEPLOY_TIMER_SPAWN_BUTTON_HEIGHT, 0));
        if (row.groundButtonBorder) {
            mod.SetUIWidgetPosition(row.groundButtonBorder, mod.CreateVector(groundButtonX, mod.YComponentOf(mod.GetUIWidgetPosition(row.groundButtonBorder)), 0));
            mod.SetUIWidgetSize(row.groundButtonBorder, mod.CreateVector(VEHICLE_DEPLOY_TIMER_SPAWN_BUTTON_WIDTH, VEHICLE_DEPLOY_TIMER_SPAWN_BUTTON_HEIGHT, 0));
        }
        if (row.groundButton) {
            const buttonPadding = VEHICLE_DEPLOY_TIMER_SPAWN_BUTTON_BORDER_PADDING;
            mod.SetUIWidgetPosition(row.groundButton, mod.CreateVector(buttonPadding, buttonPadding, 0));
            mod.SetUIWidgetSize(
                row.groundButton,
                mod.CreateVector(
                    Math.max(1, VEHICLE_DEPLOY_TIMER_SPAWN_BUTTON_WIDTH - (buttonPadding * 2)),
                    Math.max(1, VEHICLE_DEPLOY_TIMER_SPAWN_BUTTON_HEIGHT - (buttonPadding * 2)),
                    0
                )
            );
        }
        if (row.groundButtonTextShadow) mod.SetUIWidgetSize(row.groundButtonTextShadow, mod.CreateVector(VEHICLE_DEPLOY_TIMER_SPAWN_BUTTON_WIDTH, VEHICLE_DEPLOY_TIMER_SPAWN_BUTTON_HEIGHT, 0));
        if (row.groundButtonText) mod.SetUIWidgetSize(row.groundButtonText, mod.CreateVector(VEHICLE_DEPLOY_TIMER_SPAWN_BUTTON_WIDTH, VEHICLE_DEPLOY_TIMER_SPAWN_BUTTON_HEIGHT, 0));
        if (row.vehiclePlate) {
            mod.SetUIWidgetPosition(row.vehiclePlate, mod.CreateVector(vehicleX, mod.YComponentOf(mod.GetUIWidgetPosition(row.vehiclePlate)), 0));
            mod.SetUIWidgetSize(row.vehiclePlate, mod.CreateVector(vehicleWidth, VEHICLE_DEPLOY_TIMER_INFO_PLATE_HEIGHT, 0));
        }
        if (row.vehicleShadow) mod.SetUIWidgetSize(row.vehicleShadow, mod.CreateVector(vehicleWidth, VEHICLE_DEPLOY_TIMER_INFO_PLATE_HEIGHT, 0));
        if (row.vehicleText) mod.SetUIWidgetSize(row.vehicleText, mod.CreateVector(vehicleWidth, VEHICLE_DEPLOY_TIMER_INFO_PLATE_HEIGHT, 0));
        if (row.timer?.root) {
            mod.SetUIWidgetPosition(row.timer.root, mod.CreateVector(timerX, mod.YComponentOf(mod.GetUIWidgetPosition(row.timer.root)), 0));
            mod.SetUIWidgetSize(row.timer.root, mod.CreateVector(timerWidth, VEHICLE_DEPLOY_TIMER_HEIGHT, 0));
        }
        if (row.timer?.plate) {
            mod.SetUIWidgetPosition(row.timer.plate, mod.CreateVector(timerX, mod.YComponentOf(mod.GetUIWidgetPosition(row.timer.plate)), 0));
            mod.SetUIWidgetSize(row.timer.plate, mod.CreateVector(VEHICLE_DEPLOY_TIMER_PLATE_WIDTH, VEHICLE_DEPLOY_TIMER_PLATE_HEIGHT, 0));
        }
    } catch {
        return;
    }
    row.lastShowPlayerName = showPlayerName;
    row.lastShowSpawnButton = showSpawnButton;
    row.lastShowGroundButton = showGroundButton;
}

function getVehicleDeployActiveOwnerNameMessage(slot: VehicleSpawnerSlot): mod.Message | undefined {
    if (slot.vehicleId === -1) return undefined;
    const vehicle = findVehicleById(slot.vehicleId);
    if (!vehicle) return mod.Message(getVehicleDeployIdleLabelKey());
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const player = mod.ValueInArray(players, i) as mod.Player;
        if (!player || !mod.IsPlayerValid(player)) continue;
        const pid = safeGetPlayerId(player);
        if (pid === undefined || isPidDisconnected(pid)) continue;
        const playerVehicle = mod.GetVehicleFromPlayer(player);
        if (!playerVehicle || !mod.Equals(playerVehicle, vehicle)) continue;
        if (mod.GetPlayerVehicleSeat(player) !== 0) continue;
        return mod.Message(mod.stringkeys.twl.readyDialog.playerNameFormat, player);
    }
    return mod.Message(getVehicleDeployIdleLabelKey());
}

function setVehicleDeployTimerNameVisible(row: VehicleDeployTimerRowCacheEntry | undefined, visible: boolean): void {
    if (!row) return;
    if (row.lastPlayerNameVisible === visible) return;
    safeSetUIWidgetVisible(row.playerPlate, visible);
    safeSetUIWidgetVisible(row.playerShadow, visible);
    safeSetUIWidgetVisible(row.playerText, visible);
    row.lastPlayerNameVisible = visible;
}

function setVehicleDeploySpawnButtonVisible(row: VehicleDeployTimerRowCacheEntry | undefined, visible: boolean): void {
    if (!row) return;
    if (row.lastSpawnButtonVisible === visible) return;
    if (row.spawnButton) {
        mod.SetUIButtonEnabled(row.spawnButton, visible);
    }
    safeSetUIWidgetVisible(row.spawnButtonBorder, visible);
    safeSetUIWidgetVisible(row.spawnButtonBlur, false);
    safeSetUIWidgetVisible(row.spawnButtonFill, false);
    safeSetUIWidgetVisible(row.spawnButton, visible);
    safeSetUIWidgetVisible(row.spawnButtonTextShadow, visible);
    safeSetUIWidgetVisible(row.spawnButtonText, visible);
    row.lastSpawnButtonVisible = visible;
}

function setVehicleDeployGroundButtonVisible(row: VehicleDeployTimerRowCacheEntry | undefined, visible: boolean): void {
    if (!row) return;
    if (row.lastGroundButtonVisible === visible) return;
    if (row.groundButton) {
        mod.SetUIButtonEnabled(row.groundButton, visible);
    }
    safeSetUIWidgetVisible(row.groundButtonBorder, visible);
    safeSetUIWidgetVisible(row.groundButtonBlur, false);
    safeSetUIWidgetVisible(row.groundButtonFill, false);
    safeSetUIWidgetVisible(row.groundButton, visible);
    safeSetUIWidgetVisible(row.groundButtonTextShadow, visible);
    safeSetUIWidgetVisible(row.groundButtonText, visible);
    row.lastGroundButtonVisible = visible;
}

function clearVehicleDeploySpawnButtonState(row: VehicleDeployTimerRowCacheEntry | undefined): void {
    if (!row) return;
    if (!row.spawnButtonHovered && !row.spawnButtonFocused && !row.spawnButtonPressed) return;
    row.spawnButtonHovered = false;
    row.spawnButtonFocused = false;
    row.spawnButtonPressed = false;
    applyVehicleDeploySpawnButtonVisualState(row, false, false);
}

function clearVehicleDeployGroundButtonState(row: VehicleDeployTimerRowCacheEntry | undefined): void {
    if (!row) return;
    if (!row.groundButtonHovered && !row.groundButtonFocused && !row.groundButtonPressed) return;
    row.groundButtonHovered = false;
    row.groundButtonFocused = false;
    row.groundButtonPressed = false;
    applyVehicleDeployGroundButtonVisualState(row, false, false);
}

function clearVehicleDeploySpawnButtonStateForAllRows(
    cache: VehicleDeployTimerHudCacheEntry | undefined,
    exceptIndex?: number,
    exceptMode?: VehicleDirectSpawnMode
): void {
    if (!cache) return;
    for (let i = 0; i < cache.rows.length; i++) {
        if (exceptIndex !== undefined && i === exceptIndex) {
            if (exceptMode === "air") {
                clearVehicleDeployGroundButtonState(cache.rows[i]);
                continue;
            }
            if (exceptMode === "ground") {
                clearVehicleDeploySpawnButtonState(cache.rows[i]);
                continue;
            }
        }
        clearVehicleDeploySpawnButtonState(cache.rows[i]);
        clearVehicleDeployGroundButtonState(cache.rows[i]);
    }
}

function ensureVehicleDeployTimerHudForPlayer(player: mod.Player): VehicleDeployTimerHudCacheEntry | undefined {
    if (!player || !mod.IsPlayerValid(player)) return undefined;
    const pid = mod.GetObjId(player);
    const priorCache = State.hudCache.vehicleDeployTimerCache[pid];
    if (isVehicleDeployTimerHudCacheUsable(priorCache)) {
        return priorCache;
    }
    let cache = priorCache;
    const uiRoot = mod.GetUIRoot();

    deleteVehicleDeployTimerHudArtifactsForPid(pid);
    modlib.ParseUI({
        name: `VehicleDeployTimerHudRoot_${pid}`,
        type: "Container",
        playerId: player,
        position: [VEHICLE_DEPLOY_TIMER_ROOT_OFFSET_X, VEHICLE_DEPLOY_TIMER_ROOT_OFFSET_Y],
        size: [VEHICLE_DEPLOY_TIMER_ROOT_WIDTH, VEHICLE_DEPLOY_TIMER_ROOT_HEIGHT],
        anchor: mod.UIAnchor.CenterRight,
        visible: true,
        padding: 0,
        bgAlpha: 0,
        bgFill: mod.UIBgFill.None,
    });
    cache = {
        rootName: `VehicleDeployTimerHudRoot_${pid}`,
        root: safeFind(`VehicleDeployTimerHudRoot_${pid}`),
        rows: [],
        lastVisibleState: priorCache?.lastVisibleState,
    };
    State.hudCache.vehicleDeployTimerCache[pid] = cache;

    cache.root = safeFind(cache.rootName) as mod.UIWidget;
    if (!cache.root) return undefined;

    try {
        mod.SetUIWidgetParent(cache.root, uiRoot);
        mod.SetUIWidgetAnchor(cache.root, mod.UIAnchor.CenterRight);
        mod.SetUIWidgetPosition(cache.root, mod.CreateVector(VEHICLE_DEPLOY_TIMER_ROOT_OFFSET_X, VEHICLE_DEPLOY_TIMER_ROOT_OFFSET_Y, 0));
        mod.SetUIWidgetSize(cache.root, mod.CreateVector(VEHICLE_DEPLOY_TIMER_ROOT_WIDTH, VEHICLE_DEPLOY_TIMER_ROOT_HEIGHT, 0));
        mod.SetUIWidgetDepth(cache.root, mod.UIDepth.AboveGameUI);
    } catch {
        return undefined;
    }

    for (let i = 0; i < VEHICLE_DEPLOY_TIMER_MAX_ROWS; i++) {
        const baseY = getVehicleDeployTimerRowBaseY(i);
        const playerPlate = ensureVehicleDeployInfoPlate(
            `VehicleDeployTimerPlayerPlate_${pid}_${i}`,
            player,
            cache.root,
            VEHICLE_DEPLOY_TIMER_PLAYER_PLATE_X,
            baseY,
            VEHICLE_DEPLOY_TIMER_PLAYER_PLATE_WIDTH,
            VEHICLE_DEPLOY_TIMER_INFO_PLATE_HEIGHT,
            mod.UIBgFill.Blur,
            CLOCK_PLATE_ALPHA,
            COLOR_GRAY_DARK
        );
        const playerShadow = playerPlate
            ? ensureVehicleDeployCenteredText(
                `VehicleDeployTimerPlayerTextShadow_${pid}_${i}`,
                player,
                playerPlate,
                VEHICLE_DEPLOY_TIMER_PLAYER_PLATE_WIDTH,
                VEHICLE_DEPLOY_TIMER_INFO_PLATE_HEIGHT,
                true
            )
            : undefined;
        const playerText = playerPlate
            ? ensureVehicleDeployCenteredText(
                `VehicleDeployTimerPlayerText_${pid}_${i}`,
                player,
                playerPlate,
                VEHICLE_DEPLOY_TIMER_PLAYER_PLATE_WIDTH,
                VEHICLE_DEPLOY_TIMER_INFO_PLATE_HEIGHT,
                false
            )
            : undefined;

        const vehiclePlate = ensureVehicleDeployInfoPlate(
            `VehicleDeployTimerVehiclePlate_${pid}_${i}`,
            player,
            cache.root,
            VEHICLE_DEPLOY_TIMER_VEHICLE_PLATE_X,
            baseY,
            VEHICLE_DEPLOY_TIMER_VEHICLE_PLATE_WIDTH,
            VEHICLE_DEPLOY_TIMER_INFO_PLATE_HEIGHT,
            mod.UIBgFill.Blur,
            CLOCK_PLATE_ALPHA,
            COLOR_GRAY_DARK
        );
        const vehicleShadow = vehiclePlate
            ? ensureVehicleDeployCenteredText(
                `VehicleDeployTimerVehicleTextShadow_${pid}_${i}`,
                player,
                vehiclePlate,
                VEHICLE_DEPLOY_TIMER_VEHICLE_PLATE_WIDTH,
                VEHICLE_DEPLOY_TIMER_INFO_PLATE_HEIGHT,
                true
            )
            : undefined;
        const vehicleText = vehiclePlate
            ? ensureVehicleDeployCenteredText(
                `VehicleDeployTimerVehicleText_${pid}_${i}`,
                player,
                vehiclePlate,
                VEHICLE_DEPLOY_TIMER_VEHICLE_PLATE_WIDTH,
                VEHICLE_DEPLOY_TIMER_INFO_PLATE_HEIGHT,
                false
            )
            : undefined;

        const groundButtonWidgets = ensureVehicleDeployActionButtonWidgets(
            player,
            cache.root,
            pid,
            i,
            "ground",
            mod.stringkeys.twl.ui.groundDeploy,
            VEHICLE_DEPLOY_TIMER_SPAWN_BUTTON_X - VEHICLE_DEPLOY_TIMER_ROW_GAP_X - VEHICLE_DEPLOY_TIMER_SPAWN_BUTTON_WIDTH,
            baseY + VEHICLE_DEPLOY_TIMER_SPAWN_BUTTON_OFFSET_Y,
            VEHICLE_DEPLOY_TIMER_SPAWN_BUTTON_WIDTH,
            VEHICLE_DEPLOY_TIMER_SPAWN_BUTTON_HEIGHT
        );

        const spawnButtonWidgets = ensureVehicleDeployActionButtonWidgets(
            player,
            cache.root,
            pid,
            i,
            "air",
            mod.stringkeys.twl.ui.airDeploy,
            VEHICLE_DEPLOY_TIMER_SPAWN_BUTTON_X,
            baseY + VEHICLE_DEPLOY_TIMER_SPAWN_BUTTON_OFFSET_Y,
            VEHICLE_DEPLOY_TIMER_SPAWN_BUTTON_WIDTH,
            VEHICLE_DEPLOY_TIMER_SPAWN_BUTTON_HEIGHT
        );

        const timer = ensureReusableTimerInstance(
            player,
            `VehicleDeployTimerSlot${i}`,
            cache.root,
            {
                anchor: mod.UIAnchor.TopLeft,
                positionX: VEHICLE_DEPLOY_TIMER_TIMER_X,
                positionY: baseY,
                width: VEHICLE_DEPLOY_TIMER_WIDTH,
                height: VEHICLE_DEPLOY_TIMER_HEIGHT,
                plateWidth: VEHICLE_DEPLOY_TIMER_PLATE_WIDTH,
                plateHeight: VEHICLE_DEPLOY_TIMER_PLATE_HEIGHT,
                plateOffsetY: VEHICLE_DEPLOY_TIMER_PLATE_OFFSET_Y,
                plateAlpha: CLOCK_PLATE_ALPHA,
                plateColor: COLOR_GRAY_DARK,
                fontSize: VEHICLE_DEPLOY_TIMER_FONT_SIZE,
                textOffsetY: VEHICLE_DEPLOY_TIMER_TEXT_OFFSET_Y,
                textShadowOffsetX: VEHICLE_DEPLOY_TIMER_TEXT_SHADOW_OFFSET_X,
                textShadowOffsetY: VEHICLE_DEPLOY_TIMER_TEXT_SHADOW_OFFSET_Y,
                textShadowAlpha: VEHICLE_DEPLOY_TIMER_TEXT_SHADOW_ALPHA,
                digitLayoutWidth: VEHICLE_DEPLOY_TIMER_DIGIT_LAYOUT_WIDTH,
                digitInnerOffsetMult: VEHICLE_DEPLOY_TIMER_DIGIT_INNER_OFFSET_MULT,
                digitOuterOffsetMult: VEHICLE_DEPLOY_TIMER_DIGIT_OUTER_OFFSET_MULT,
                colonOffsetX: VEHICLE_DEPLOY_TIMER_COLON_OFFSET_X,
                colonOffsetY: VEHICLE_DEPLOY_TIMER_COLON_OFFSET_Y,
                minuteDigitOffsetX: VEHICLE_DEPLOY_TIMER_MINUTE_DIGIT_OFFSET_X,
                secondDigitOffsetX: VEHICLE_DEPLOY_TIMER_SECOND_DIGIT_OFFSET_X,
            },
            cache.rows[i]?.timer
        );
        if (!timer) continue;

        cache.rows[i] = {
            playerPlate,
            playerShadow,
            playerText,
            vehiclePlate,
            vehicleShadow,
            vehicleText,
            spawnButtonBorder: spawnButtonWidgets.border,
            spawnButtonBlur: spawnButtonWidgets.blur,
            spawnButtonFill: spawnButtonWidgets.fill,
            spawnButton: spawnButtonWidgets.button,
            spawnButtonTextShadow: spawnButtonWidgets.textShadow,
            spawnButtonText: spawnButtonWidgets.text,
            groundButtonBorder: groundButtonWidgets.border,
            groundButtonBlur: groundButtonWidgets.blur,
            groundButtonFill: groundButtonWidgets.fill,
            groundButton: groundButtonWidgets.button,
            groundButtonTextShadow: groundButtonWidgets.textShadow,
            groundButtonText: groundButtonWidgets.text,
            spawnButtonHovered: priorCache?.rows[i]?.spawnButtonHovered ?? false,
            spawnButtonFocused: priorCache?.rows[i]?.spawnButtonFocused ?? false,
            spawnButtonPressed: priorCache?.rows[i]?.spawnButtonPressed ?? false,
            groundButtonHovered: priorCache?.rows[i]?.groundButtonHovered ?? false,
            groundButtonFocused: priorCache?.rows[i]?.groundButtonFocused ?? false,
            groundButtonPressed: priorCache?.rows[i]?.groundButtonPressed ?? false,
            lastVisibleState: priorCache?.rows[i]?.lastVisibleState,
            lastPlayerNameVisible: priorCache?.rows[i]?.lastPlayerNameVisible,
            lastSpawnButtonVisible: priorCache?.rows[i]?.lastSpawnButtonVisible,
            lastGroundButtonVisible: priorCache?.rows[i]?.lastGroundButtonVisible,
            lastShowPlayerName: priorCache?.rows[i]?.lastShowPlayerName,
            lastShowSpawnButton: priorCache?.rows[i]?.lastShowSpawnButton,
            lastShowGroundButton: priorCache?.rows[i]?.lastShowGroundButton,
            lastSpawnButtonVisualState: undefined,
            lastGroundButtonVisualState: undefined,
            timer,
        };
        applyVehicleDeploySpawnButtonVisualState(
            cache.rows[i],
            (cache.rows[i].spawnButtonHovered === true) || (cache.rows[i].spawnButtonFocused === true),
            cache.rows[i].spawnButtonPressed === true
        );
        applyVehicleDeployGroundButtonVisualState(
            cache.rows[i],
            (cache.rows[i].groundButtonHovered === true) || (cache.rows[i].groundButtonFocused === true),
            cache.rows[i].groundButtonPressed === true
        );
    }

    return cache;
}

function setVehicleDeployTimerRowVisible(row: VehicleDeployTimerRowCacheEntry | undefined, visible: boolean): void {
    if (!row) return;
    if (row.lastVisibleState === visible) return;
    if (visible) {
        safeSetUIWidgetVisible(row.vehiclePlate, true);
        safeSetUIWidgetVisible(row.vehicleShadow, true);
        safeSetUIWidgetVisible(row.vehicleText, true);
    } else {
        safeSetUIWidgetVisible(row.vehiclePlate, false);
        safeSetUIWidgetVisible(row.vehicleShadow, false);
        safeSetUIWidgetVisible(row.vehicleText, false);
        safeSetUIWidgetVisible(row.playerPlate, false);
        safeSetUIWidgetVisible(row.playerShadow, false);
        safeSetUIWidgetVisible(row.playerText, false);
        safeSetUIWidgetVisible(row.spawnButtonBorder, false);
        safeSetUIWidgetVisible(row.spawnButtonBlur, false);
        safeSetUIWidgetVisible(row.spawnButtonFill, false);
        safeSetUIWidgetVisible(row.spawnButton, false);
        safeSetUIWidgetVisible(row.spawnButtonTextShadow, false);
        safeSetUIWidgetVisible(row.spawnButtonText, false);
        safeSetUIWidgetVisible(row.groundButtonBorder, false);
        safeSetUIWidgetVisible(row.groundButtonBlur, false);
        safeSetUIWidgetVisible(row.groundButtonFill, false);
        safeSetUIWidgetVisible(row.groundButton, false);
        safeSetUIWidgetVisible(row.groundButtonTextShadow, false);
        safeSetUIWidgetVisible(row.groundButtonText, false);
        setReusableTimerVisible(row.timer, false);
        row.lastPlayerNameVisible = false;
        row.lastSpawnButtonVisible = false;
        row.lastGroundButtonVisible = false;
    }
    row.lastVisibleState = visible;
}

function renderVehicleDeployTimerRow(
    row: VehicleDeployTimerRowCacheEntry | undefined,
    slot: VehicleSpawnerSlot | undefined,
    viewerPid: number
): void {
    if (!row) return;
    if (!slot) {
        setVehicleDeployTimerRowVisible(row, false);
        return;
    }
    setVehicleDeployTimerRowVisible(row, true);

    const deployed = !!State.players.deployedByPid[viewerPid];
    const activeOwnerMessage = getVehicleDeployActiveOwnerNameMessage(slot);
    const showPlayerName = slot.vehicleId !== -1;
    const showSpawnButton = !deployed && isVehicleDeploySlotReadyForSpawnButton(slot);
    const showGroundButton = showSpawnButton;
    layoutVehicleDeployRowForState(row, showPlayerName, showSpawnButton, showGroundButton);

    safeSetUITextLabel(row.vehicleShadow, mod.Message(getVehicleDeployTimerLabelKey(slot.vehicleType)));
    safeSetUITextLabel(row.vehicleText, mod.Message(getVehicleDeployTimerLabelKey(slot.vehicleType)));
    safeSetUITextColor(row.vehicleText, COLOR_WHITE);
    safeSetUITextLabel(row.spawnButtonTextShadow, mod.Message(mod.stringkeys.twl.ui.airDeploy));
    safeSetUITextLabel(row.spawnButtonText, mod.Message(mod.stringkeys.twl.ui.airDeploy));
    safeSetUITextLabel(row.groundButtonTextShadow, mod.Message(mod.stringkeys.twl.ui.groundDeploy));
    safeSetUITextLabel(row.groundButtonText, mod.Message(mod.stringkeys.twl.ui.groundDeploy));
    safeSetUITextColor(row.spawnButtonText, COLOR_WHITE);
    safeSetUITextColor(row.spawnButtonTextShadow, COLOR_DARK_BLACK);
    safeSetUITextColor(row.groundButtonText, COLOR_WHITE);
    safeSetUITextColor(row.groundButtonTextShadow, COLOR_DARK_BLACK);

    if (showPlayerName && activeOwnerMessage) {
        safeSetUITextLabel(row.playerShadow, activeOwnerMessage);
        safeSetUITextLabel(row.playerText, activeOwnerMessage);
        safeSetUITextColor(row.playerText, COLOR_WHITE);
    }
    setVehicleDeployTimerNameVisible(row, showPlayerName);

    if (!showSpawnButton) {
        clearVehicleDeploySpawnButtonState(row);
    }
    if (!showGroundButton) {
        clearVehicleDeployGroundButtonState(row);
    }

    if (slot.vehicleId !== -1) {
        setReusableTimerStatus(row.timer, "active", mod.Message(mod.stringkeys.twl.ui.active), COLOR_LOW_TIME);
        setReusableTimerVisible(row.timer, true);
        setVehicleDeploySpawnButtonVisible(row, false);
        setVehicleDeployGroundButtonVisible(row, false);
    } else if (showSpawnButton) {
        setReusableTimerStatus(row.timer, "ready", mod.Message(mod.stringkeys.twl.ui.ready), COLOR_READY_GREEN);
        setReusableTimerVisible(row.timer, true);
        setVehicleDeploySpawnButtonVisible(row, true);
        setVehicleDeployGroundButtonVisible(row, true);
    } else if (getVehicleSlotRespawnRemainingSeconds(slot) <= 0) {
        setReusableTimerStatus(row.timer, "ready", mod.Message(mod.stringkeys.twl.ui.ready), COLOR_READY_GREEN);
        setReusableTimerVisible(row.timer, true);
        setVehicleDeploySpawnButtonVisible(row, false);
        setVehicleDeployGroundButtonVisible(row, false);
    } else {
        setReusableTimerColor(row.timer, COLOR_WHITE);
        setReusableTimerSeconds(row.timer, getVehicleSlotRespawnRemainingSeconds(slot));
        setReusableTimerVisible(row.timer, true);
        setVehicleDeploySpawnButtonVisible(row, false);
        setVehicleDeployGroundButtonVisible(row, false);
    }

    applyVehicleDeploySpawnButtonVisualState(
        row,
        !!row.spawnButtonHovered || !!row.spawnButtonFocused,
        !!row.spawnButtonPressed
    );
    applyVehicleDeployGroundButtonVisualState(
        row,
        !!row.groundButtonHovered || !!row.groundButtonFocused,
        !!row.groundButtonPressed
    );
}

function tryHandleVehicleDeployTimerButtonEvent(
    eventPlayer: mod.Player,
    eventUIWidget: mod.UIWidget,
    eventUIButtonEvent: mod.UIButtonEvent
): boolean {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return false;
    const pid = safeGetPlayerId(eventPlayer);
    if (pid === undefined) return false;

    const widgetName = mod.GetUIWidgetName(eventUIWidget);
    const airPrefix = `${UI_VEHICLE_DEPLOY_TIMER_SPAWN_BUTTON_ID}${pid}_`;
    const groundPrefix = `${UI_VEHICLE_DEPLOY_TIMER_GROUND_BUTTON_ID}${pid}_`;
    let mode: VehicleDirectSpawnMode | undefined = undefined;
    let rowIndexToken = "";
    if (widgetName.startsWith(airPrefix)) {
        mode = "air";
        rowIndexToken = widgetName.slice(airPrefix.length);
    } else if (widgetName.startsWith(groundPrefix)) {
        mode = "ground";
        rowIndexToken = widgetName.slice(groundPrefix.length);
    } else {
        return false;
    }

    const rowIndex = Number(rowIndexToken);
    if (!Number.isInteger(rowIndex) || rowIndex < 0 || rowIndex >= VEHICLE_DEPLOY_TIMER_MAX_ROWS) return true;

    const cache = State.hudCache.vehicleDeployTimerCache[pid];
    const row = cache?.rows[rowIndex];
    const setVisual = (active: boolean, pressed: boolean): void => {
        if (mode === "ground") {
            applyVehicleDeployGroundButtonVisualState(row, active, pressed);
        } else {
            applyVehicleDeploySpawnButtonVisualState(row, active, pressed);
        }
    };
    if (mod.Equals(eventUIButtonEvent, mod.UIButtonEvent.FocusIn)) {
        clearVehicleDeploySpawnButtonStateForAllRows(cache, rowIndex, mode);
        if (row) {
            if (mode === "ground") {
                row.groundButtonHovered = false;
                row.groundButtonFocused = true;
                row.groundButtonPressed = false;
            } else {
                row.spawnButtonHovered = false;
                row.spawnButtonFocused = true;
                row.spawnButtonPressed = false;
            }
            setVisual(true, false);
        }
        return true;
    }
    if (mod.Equals(eventUIButtonEvent, mod.UIButtonEvent.FocusOut)) {
        if (row) {
            if (mode === "ground") {
                row.groundButtonFocused = false;
                row.groundButtonPressed = false;
                setVisual(!!row.groundButtonHovered, false);
            } else {
                row.spawnButtonFocused = false;
                row.spawnButtonPressed = false;
                setVisual(!!row.spawnButtonHovered, false);
            }
        }
        return true;
    }
    if (mod.Equals(eventUIButtonEvent, mod.UIButtonEvent.HoverIn)) {
        clearVehicleDeploySpawnButtonStateForAllRows(cache, rowIndex, mode);
        if (row) {
            if (mode === "ground") {
                row.groundButtonHovered = true;
                row.groundButtonFocused = false;
                row.groundButtonPressed = false;
            } else {
                row.spawnButtonHovered = true;
                row.spawnButtonFocused = false;
                row.spawnButtonPressed = false;
            }
            setVisual(true, false);
        }
        return true;
    }
    if (mod.Equals(eventUIButtonEvent, mod.UIButtonEvent.HoverOut)) {
        if (row) {
            if (mode === "ground") {
                row.groundButtonHovered = false;
                row.groundButtonPressed = false;
                setVisual(!!row.groundButtonFocused, false);
            } else {
                row.spawnButtonHovered = false;
                row.spawnButtonPressed = false;
                setVisual(!!row.spawnButtonFocused, false);
            }
        }
        return true;
    }
    if (mod.Equals(eventUIButtonEvent, mod.UIButtonEvent.ButtonDown)) {
        clearVehicleDeploySpawnButtonStateForAllRows(cache, rowIndex, mode);
        if (row) {
            if (mode === "ground") {
                row.groundButtonHovered = row.groundButtonHovered === true;
                row.groundButtonFocused = row.groundButtonFocused === true || !row.groundButtonHovered;
                row.groundButtonPressed = true;
            } else {
                row.spawnButtonHovered = row.spawnButtonHovered === true;
                row.spawnButtonFocused = row.spawnButtonFocused === true || !row.spawnButtonHovered;
                row.spawnButtonPressed = true;
            }
            setVisual(true, true);
        }
        return true;
    }
    if (!mod.Equals(eventUIButtonEvent, mod.UIButtonEvent.ButtonUp)) return true;
    if (State.players.deployedByPid[pid]) return true;
    if (row) {
        if (mode === "ground") {
            const keepActive = !!row.groundButtonHovered || !!row.groundButtonFocused;
            row.groundButtonPressed = false;
            setVisual(keepActive, false);
        } else {
            const keepActive = !!row.spawnButtonHovered || !!row.spawnButtonFocused;
            row.spawnButtonPressed = false;
            setVisual(keepActive, false);
        }
    }

    const slots = getVehicleDeployTrackedSlotsForPlayer(eventPlayer);
    const slot = slots[rowIndex];
    if (!slot) return true;

    const claimed = tryClaimVehicleDirectSpawnForPlayer(eventPlayer, slot, mode);
    if (!claimed) {
        conquestPhase5BRenderVehicleDeployTimersForPlayer(eventPlayer);
        return true;
    }

    conquestPhase5BRenderVehicleDeployTimersForAllPlayers();
    void beginVehicleDirectSpawnDeployForPlayer(eventPlayer);
    return true;
}

function conquestPhase5BRenderVehicleDeployTimersForPlayer(player: mod.Player): void {
    if (!player || !mod.IsPlayerValid(player)) return;
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return;

    const cache = ensureVehicleDeployTimerHudForPlayer(player);
    if (!cache || !cache.root) return;

    const slots = getVehicleDeployRenderSlotsForPlayer(player);
    const hasPendingDirectSpawnClaim = !State.players.deployedByPid[pid] && !!findVehicleSlotByPendingSpawnOwnerPid(pid);
    const visible = shouldShowVehicleDeployTimersForPid(pid) && slots.length > 0 && !hasPendingDirectSpawnClaim;
    if (cache.lastVisibleState !== visible) {
        safeSetUIWidgetVisible(cache.root, visible);
        cache.lastVisibleState = visible;
    }
    if (!visible) {
        for (let i = 0; i < cache.rows.length; i++) {
            setVehicleDeployTimerRowVisible(cache.rows[i], false);
        }
        return;
    }

    if (
        !State.players.deployedByPid[pid]
        && !State.players.readyDialogData[pid]?.dialogVisible
        && !safeFind(joinPromptRootName(pid))
        && !State.players.uiInputEnabledByPid[pid]
    ) {
        setUIInputModeForPlayer(player, true);
    }

    for (let i = 0; i < VEHICLE_DEPLOY_TIMER_MAX_ROWS; i++) {
        renderVehicleDeployTimerRow(cache.rows[i], slots[i], pid);
    }
}

function conquestPhase5BRenderVehicleDeployTimersForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const player = mod.ValueInArray(players, i) as mod.Player;
        if (!player || !mod.IsPlayerValid(player)) continue;
        conquestPhase5BRenderVehicleDeployTimersForPlayer(player);
    }
}
