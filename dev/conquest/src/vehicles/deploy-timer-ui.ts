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
    safeSetUITextLabel(label, msg(getVehicleDeployTimerAdminToggleLabelKey(pid)));
}

function getVehicleDeployTimerLabelKey(vehicleType: mod.VehicleList): number {
    switch (vehicleType) {
        case mod.VehicleList.AH64:
            return mod.stringkeys.twl.readyDialog.vehicleOptionFalchion;
        case mod.VehicleList.Eurocopter:
            return mod.stringkeys.twl.readyDialog.vehicleOptionPanthera;
        case VEHICLE_AH6M:
            return mod.stringkeys.twl.readyDialog.vehicleShortLittleBird;
        case VEHICLE_AH6M_PAX:
            return mod.stringkeys.twl.readyDialog.vehicleShortLittleBirdPax;
        case mod.VehicleList.UH60:
        case mod.VehicleList.UH60_Pax:
            return mod.stringkeys.twl.readyDialog.vehicleOptionBlackHawk;
        case mod.VehicleList.F16:
            return mod.stringkeys.twl.readyDialog.vehicleShortF16;
        case mod.VehicleList.F22:
            return mod.stringkeys.twl.readyDialog.vehicleShortF22;
        case mod.VehicleList.JAS39:
            return mod.stringkeys.twl.readyDialog.vehicleShortJas39;
        case mod.VehicleList.SU57:
            return mod.stringkeys.twl.readyDialog.vehicleShortSu57;
        case mod.VehicleList.Abrams:
            return mod.stringkeys.twl.readyDialog.vehicleShortAbrams;
        case mod.VehicleList.Leopard:
            return mod.stringkeys.twl.readyDialog.vehicleShortLeopard;
        case mod.VehicleList.M2Bradley:
            return mod.stringkeys.twl.readyDialog.vehicleShortBradley;
        case mod.VehicleList.CV90:
            return mod.stringkeys.twl.readyDialog.vehicleShortCv90;
        case mod.VehicleList.Cheetah:
            return mod.stringkeys.twl.readyDialog.vehicleShortGepard;    // Engine "Cheetah" = actual GE-26 PAX (Gepard)
        case mod.VehicleList.Gepard:
            return mod.stringkeys.twl.readyDialog.vehicleShortCheetah;   // Engine "Gepard" = actual Cheetah 1A2
        case mod.VehicleList.Marauder:
            return mod.stringkeys.twl.readyDialog.vehicleShortMarauder;
        case mod.VehicleList.Marauder_Pax:
            return mod.stringkeys.twl.readyDialog.vehicleShortMarauderPax;
        case mod.VehicleList.Quadbike:
            return mod.stringkeys.twl.readyDialog.vehicleShortQuadbike;
        case VEHICLE_DIRTBIKE:
            return mod.stringkeys.twl.readyDialog.vehicleShortDirtBike;
        case VEHICLE_DIRTBIKE_PAX:
            return mod.stringkeys.twl.readyDialog.vehicleShortDirtBikePax;
        case mod.VehicleList.GolfCart:
            return mod.stringkeys.twl.readyDialog.vehicleShortGolfCart;
        case mod.VehicleList.Flyer60:
            return mod.stringkeys.twl.readyDialog.vehicleShortFlyer60;
        case mod.VehicleList.Vector:
            return mod.stringkeys.twl.readyDialog.vehicleShortVector;
        case mod.VehicleList.RHIB:
            return mod.stringkeys.twl.readyDialog.vehicleShortRhib;
        default:
            return STR_SYS_UNKNOWN_PLAYER;
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

// Returns the widget name for the modal close button used by the live terminal variant.
function getVehicleDeployCloseButtonName(pid: number): string {
    return wn("VehicleDeployTimerCloseButton", pid);
}

// Returns true when the viewer is using the in-world live terminal variant instead of the undeployed deploy screen.
function isVehicleDeployLiveTerminalModeForPid(pid: number): boolean {
    return isVehicleDeployLiveMenuOpenForPid(pid);
}

function isVehicleDeployTimerAdminOverrideEnabledForPid(pid: number): boolean {
    return !!State.players.readyDialogData[pid]?.vehicleTimersVisibleWhileDeployed;
}

function getVehicleDeployVisibleSlotsForPlayer(player: mod.Player): VehicleSpawnerSlot[] {
    const teamId = safeGetTeamNumberFromPlayer(player, 0);
    if (teamId !== TeamID.Team1 && teamId !== TeamID.Team2) return [];
    const selectedSlotNumbers: Record<number, boolean> = {};
    const selectedSpecs = teamId === TeamID.Team1
        ? TEAM1_VEHICLE_SPAWN_SPECS
        : TEAM2_VEHICLE_SPAWN_SPECS;
    for (let i = 0; i < selectedSpecs.length; i++) {
        selectedSlotNumbers[selectedSpecs[i].slotNumber] = true;
    }
    const slots = State.vehicles.slots.filter((slot) =>
        slot.enabled
        && slot.teamId === teamId
        && selectedSlotNumbers[slot.slotNumber] === true
    );
    slots.sort((a, b) => a.slotNumber - b.slotNumber);
    return slots.slice(0, VEHICLE_DEPLOY_TIMER_MAX_ROWS);
}

function getVehicleDeployRenderSlotsForPlayer(player: mod.Player): VehicleSpawnerSlot[] {
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return [];
    const slots = getVehicleDeployVisibleSlotsForPlayer(player);
    if (
        !State.players.deployedByPid[pid]
        || isVehicleDeployTimerAdminOverrideEnabledForPid(pid)
        || isVehicleDeployLiveTerminalModeForPid(pid)
    ) {
        return slots;
    }
    return slots.filter((slot) => slot.vehicleId === -1);
}

function shouldShowVehicleDeployTimersForPid(pid: number): boolean {
    if (isPidDisconnected(pid)) return false;
    const player = safeFindPlayer(pid);
    if (!isValidPlayer(player)) return false;
    return getVehicleDeployVisibleSlotsForPlayer(player).length > 0;
}

type VehicleDeployTimerRenderPlan = {
    slots: VehicleSpawnerSlot[];
    warmReady: boolean;
    shouldShowRows: boolean;
    visible: boolean;
    liveTerminalOpen: boolean;
    signature: string;
};

function buildVehicleDeployTimerRenderPlan(player: mod.Player, pid: number): VehicleDeployTimerRenderPlan {
    const slots = getVehicleDeployRenderSlotsForPlayer(player);
    const liveTerminalOpen = isVehicleDeployLiveTerminalModeForPid(pid);
    // v1.258: direct-spawn claim system removed; Vanilla has no pending claims.
    const hasPendingDirectSpawnClaim = false;
    // Harden: during live match, ignore swap-transition flag (can get stuck), but always respect
    // hudWarmCompleted so late joiners still wait for UI families to build.
    const warmReady = isHudWarmReadyForPid(pid) && (isMatchLive() || !isHudSwapTransitionActiveForPid(pid));
    const shouldShowRows = shouldShowVehicleDeployTimersForPid(pid)
        && slots.length > 0
        && !hasPendingDirectSpawnClaim;
    const adminPanelOpen = State.players.readyDialogData[pid]?.adminPanelVisible === true;
    const visible = shouldShowRows && warmReady && !adminPanelOpen;

    let signature = `${warmReady ? 1 : 0}|${shouldShowRows ? 1 : 0}|${visible ? 1 : 0}|${State.players.deployedByPid[pid] ? 1 : 0}|${hasPendingDirectSpawnClaim ? 1 : 0}|${liveTerminalOpen ? 1 : 0}|${adminPanelOpen ? 1 : 0}|${State.conquest.lifecyclePhase}|${getRoundStartAirDelayRemainingSeconds()}|${isRoundStartAirDeployDelayActive() ? 1 : 0}|${isRoundStartForwardDeployDelayActive() ? 1 : 0}|dm:${State.round.modeConfig.confirmed.vehicleDeployMethod ?? 0}`;
    for (let i = 0; i < slots.length; i++) {
        const slot = slots[i];
        signature += `#${i}:${slot.slotNumber},${slot.vehicleType},${slot.vehicleId},${slot.activeOwnerPid ?? -1},${slot.pendingSpawnOwnerPid ?? -1},${slot.pendingSpawnMode ?? "none"},${getVehicleSlotRespawnRemainingSeconds(slot)},${isVehicleDeploySlotReadyForSpawnButton(slot) ? 1 : 0}`;
    }

    return {
        slots,
        warmReady,
        shouldShowRows,
        visible,
        liveTerminalOpen,
        signature,
    };
}

function isVehicleDeploySlotReadyForSpawnButton(slot: VehicleSpawnerSlot | undefined): boolean {
    if (!slot) return false;
    return slot.enabled
        && slot.deployFlowTracked
        && slot.vehicleId === -1
        && slot.pendingSpawnOwnerPid === undefined
        && !slot.expectingSpawn
        && !slot.respawnRunning
        && getVehicleSlotRespawnRemainingSeconds(slot) <= 0;
}

function doesVehicleTypeSupportAirDeploy(vehicleType: mod.VehicleList): boolean {
    switch (vehicleType) {
        case mod.VehicleList.AH64:
        case mod.VehicleList.Eurocopter:
        case VEHICLE_AH6M:
        case VEHICLE_AH6M_PAX:
        case mod.VehicleList.UH60:
        case mod.VehicleList.UH60_Pax:
        case mod.VehicleList.F16:
        case mod.VehicleList.F22:
        case mod.VehicleList.JAS39:
        case mod.VehicleList.SU57:
            return true;
        default:
            return false;
    }
}

function doesVehicleTypeSupportGroundDeploy(vehicleType: mod.VehicleList): boolean {
    return true;
}

// Forward deploy is available for all non-aircraft ground vehicles (tanks, transports, etc).
function doesVehicleTypeSupportForwardDeploy(vehicleType: mod.VehicleList): boolean {
    return !isAircraftVehicleType(vehicleType);
}

function hasEnabledTankSpawnVolumesForTeam(teamId: TeamID): boolean {
    const volumes = getVehicleSpawnVolumesForTeam(teamId, "tank");
    return volumes.length > 0;
}

function hasEnabledAircraftSpawnVolumesForTeam(teamId: TeamID): boolean {
    const volumes = getVehicleSpawnVolumesForTeam(teamId, "aircraft");
    return volumes.length > 0;
}

function deleteVehicleDeployTimerHudArtifactsForPid(pid: number): void {
    deleteAllReusableTimerWidgetsByName(wn("VehicleDeployTimerHudRoot", pid));
    deleteAllReusableTimerWidgetsByName(wn("VehicleDeployTimerLivePanelBorder", pid));
    deleteAllReusableTimerWidgetsByName(wn("VehicleDeployTimerLivePanelBlur", pid));
    deleteAllReusableTimerWidgetsByName(wn("VehicleDeployTimerLivePanelFill", pid));
    deleteAllReusableTimerWidgetsByName(wn("VehicleDeployTimerCloseButtonBorder", pid));
    deleteAllReusableTimerWidgetsByName(wn("VehicleDeployTimerCloseButtonBlur", pid));
    deleteAllReusableTimerWidgetsByName(wn("VehicleDeployTimerCloseButtonFill", pid));
    deleteAllReusableTimerWidgetsByName(wn("VehicleDeployTimerCloseButtonText", pid));
    deleteAllReusableTimerWidgetsByName(getVehicleDeployCloseButtonName(pid));
    for (let i = 0; i < VEHICLE_DEPLOY_TIMER_MAX_ROWS; i++) {
        deleteAllReusableTimerWidgetsByName(wn("VehicleDeployTimerPlayerPlate", pid, i));
        deleteAllReusableTimerWidgetsByName(wn("VehicleDeployTimerPlayerText", pid, i));
        deleteAllReusableTimerWidgetsByName(wn("VehicleDeployTimerVehiclePlate", pid, i));
        deleteAllReusableTimerWidgetsByName(wn("VehicleDeployTimerVehicleText", pid, i));
        deleteAllReusableTimerWidgetsByName(wn("VehicleDeployTimerSpawnButtonBorder", pid, i));
        deleteAllReusableTimerWidgetsByName(wn("VehicleDeployTimerSpawnButtonBlur", pid, i));
        deleteAllReusableTimerWidgetsByName(wn("VehicleDeployTimerSpawnButtonFill", pid, i));
        deleteAllReusableTimerWidgetsByName(wn("VehicleDeployTimerSpawnButtonText", pid, i));
        deleteAllReusableTimerWidgetsByName(getVehicleDeploySpawnButtonName(pid, i));
        deleteAllReusableTimerWidgetsByName(wn("VehicleDeployTimerGroundButtonBorder", pid, i));
        deleteAllReusableTimerWidgetsByName(wn("VehicleDeployTimerGroundButtonBlur", pid, i));
        deleteAllReusableTimerWidgetsByName(wn("VehicleDeployTimerGroundButtonFill", pid, i));
        deleteAllReusableTimerWidgetsByName(wn("VehicleDeployTimerGroundButtonText", pid, i));
        deleteAllReusableTimerWidgetsByName(getVehicleDeployGroundButtonName(pid, i));
        deleteAllReusableTimerWidgetsByName(wn("VehicleDeployTimerCheckboxPlate", pid, i));
        deleteAllReusableTimerWidgetsByName(wn("VehicleDeployTimerCheckboxHighlight", pid, i));
        deleteAllReusableTimerWidgetsByName(wn("VehicleDeployTimerCheckboxBorderTop", pid, i));
        deleteAllReusableTimerWidgetsByName(wn("VehicleDeployTimerCheckboxBorderBottom", pid, i));
        deleteAllReusableTimerWidgetsByName(wn("VehicleDeployTimerCheckboxBorderLeft", pid, i));
        deleteAllReusableTimerWidgetsByName(wn("VehicleDeployTimerCheckboxBorderRight", pid, i));
        deleteAllReusableTimerWidgetsByName(wn("VehicleDeployTimerCheckboxMark", pid, i));
        purgeReusableTimerInstance(`VehicleDeployTimerSlot${i}`, pid);
    }
}

function getVehicleDeployTimerRowBaseY(index: number): number {
    return VEHICLE_DEPLOY_TIMER_CONTENT_HEIGHT
        - VEHICLE_DEPLOY_TIMER_ROW_HEIGHT
        - ((VEHICLE_DEPLOY_TIMER_ROW_HEIGHT + VEHICLE_DEPLOY_TIMER_ROW_GAP_Y) * index);
}

function setVehicleDeployTimerRootOnscreen(
    cache: VehicleDeployTimerHudCacheEntry | undefined,
    onscreen: boolean
): void {
    if (!cache?.root) return;
    safeSetUIWidgetPosition(
        cache.root,
        mod.CreateVector(
            onscreen ? VEHICLE_DEPLOY_TIMER_ROOT_OFFSET_X : (VEHICLE_DEPLOY_TIMER_ROOT_OFFSET_X + 2000),
            VEHICLE_DEPLOY_TIMER_ROOT_OFFSET_Y,
            0
        )
    );
}

function isVehicleDeployTimerRowCacheUsable(row: VehicleDeployTimerRowCacheEntry | undefined): boolean {
    return !!(
        row
        && row.playerPlate
        && row.playerText
        && row.vehiclePlate
        && row.vehicleText
        && row.spawnButtonBorder
        && row.spawnButtonBlur
        && row.spawnButtonFill
        && row.spawnButton
        && row.spawnButtonText
        && row.groundButtonBorder
        && row.groundButtonBlur
        && row.groundButtonFill
        && row.groundButton
        && row.groundButtonText
        && row.timer?.root
        && row.timer?.plate
        && row.timer?.barBorder
        && row.timer?.barFill
    );
}

function isVehicleDeployTimerHudCacheUsable(cache: VehicleDeployTimerHudCacheEntry | undefined): boolean {
    if (!cache || !safeFind(cache.rootName)) return false;
    if (
        !cache.livePanelBorder
        || !cache.livePanelBlur
        || !cache.livePanelFill
        || !cache.closeButtonBorder
        || !cache.closeButtonBlur
        || !cache.closeButtonFill
        || !cache.closeButton
        || !cache.closeButtonText
    ) {
        return false;
    }
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
    color: mod.Vector,
    depth: mod.UIDepth = mod.UIDepth.AboveGameUI,
    anchor: mod.UIAnchor = mod.UIAnchor.TopLeft
): mod.UIWidget | undefined {
    let widget = safeFind(name);
    if (!widget) {
        const parsed = safeParseUI({
            name,
            type: "Container",
            playerId: player,
            position: [x, y],
            size: [width, height],
            anchor,
            visible: false,
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
        mod.SetUIWidgetAnchor(widget, anchor);
        mod.SetUIWidgetPosition(widget, mod.CreateVector(x, y, 0));
        mod.SetUIWidgetSize(widget, mod.CreateVector(width, height, 0));
        mod.SetUIWidgetBgColor(widget, color);
        mod.SetUIWidgetBgAlpha(widget, alpha);
        mod.SetUIWidgetBgFill(widget, fill);
        mod.SetUIWidgetDepth(widget, depth);
        mod.SetUIWidgetVisible(widget, false);
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
    textSize: number = VEHICLE_DEPLOY_TIMER_INFO_TEXT_SIZE
): mod.UIWidget | undefined {
    let widget = safeFind(name);
    if (!widget) {
        const parsed = safeParseUI({
            name,
            type: "Text",
            playerId: player,
            position: [0, 0],
            size: [width, height],
            anchor: mod.UIAnchor.Center,
            visible: false,
            padding: 0,
            bgAlpha: 0,
            bgFill: mod.UIBgFill.None,
            textLabel: msg(STR_SYS_UNKNOWN_PLAYER),
            textColor: [1, 1, 1],
            textAlpha: 1,
            textSize,
            textAnchor: mod.UIAnchor.Center,
        });
        widget = parsed ?? safeFind(name);
    }
    if (!widget) return undefined;
    try {
        mod.SetUIWidgetParent(widget, parent);
        mod.SetUIWidgetAnchor(widget, mod.UIAnchor.Center);
        mod.SetUIWidgetPosition(widget, mod.CreateVector(0, 0, 0));
        mod.SetUIWidgetSize(widget, mod.CreateVector(width, height, 0));
        mod.SetUITextAnchor(widget, mod.UIAnchor.Center);
        mod.SetUITextSize(widget, textSize);
        mod.SetUIWidgetDepth(widget, mod.UIDepth.AboveGameUI);
        mod.SetUIWidgetVisible(widget, false);
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
    const borderName = wn(stem + "Border", pid, rowIndex);
    const blurName = wn(stem + "Blur", pid, rowIndex);
    const fillName = wn(stem + "Fill", pid, rowIndex);
    const textName = wn(stem + "Text", pid, rowIndex);
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
            mod.SetUIWidgetVisible(button, false);
        } catch {
            button = undefined;
        }
    }

    const text = border
        ? ensureVehicleDeployCenteredText(textName, player, border, width, height, VEHICLE_DEPLOY_TIMER_SPAWN_BUTTON_TEXT_SIZE)
        : undefined;
    safeSetUITextLabel(text, msg(labelKey));
    safeSetUITextColor(text, COLOR_WHITE);
    safeSetUIWidgetVisible(border, false);
    safeSetUIWidgetVisible(blur, false);
    safeSetUIWidgetVisible(fill, false);
    safeSetUIWidgetVisible(button, false);
    safeSetUIWidgetVisible(text, false);

    return { border, blur, fill, button, text };
}

// Builds the dedicated live-terminal backplate as root-local chrome so it tracks the row lane exactly.
function ensureVehicleDeployLivePanelWidgets(
    player: mod.Player,
    parent: mod.UIWidget,
    pid: number
): { border?: mod.UIWidget; blur?: mod.UIWidget; fill?: mod.UIWidget } {
    const border = ensureVehicleDeployInfoPlate(
        wn("VehicleDeployTimerLivePanelBorder", pid),
        player,
        parent,
        VEHICLE_DEPLOY_TIMER_ROOT_OFFSET_X,
        VEHICLE_DEPLOY_TIMER_ROOT_OFFSET_Y,
        VEHICLE_DEPLOY_TIMER_LIVE_PANEL_WIDTH,
        VEHICLE_DEPLOY_TIMER_LIVE_PANEL_HEIGHT,
        mod.UIBgFill.OutlineThin,
        1,
        COLOR_WHITE,
        mod.UIDepth.BelowGameUI,
        mod.UIAnchor.CenterRight
    );

    const blur = border
        ? ensureVehicleDeployInfoPlate(
            wn("VehicleDeployTimerLivePanelBlur", pid),
            player,
            border,
            1,
            1,
            Math.max(1, VEHICLE_DEPLOY_TIMER_LIVE_PANEL_WIDTH - 2),
            Math.max(1, VEHICLE_DEPLOY_TIMER_LIVE_PANEL_HEIGHT - 2),
            mod.UIBgFill.Blur,
            VEHICLE_DEPLOY_TIMER_LIVE_PANEL_BG_ALPHA,
            VEHICLE_DEPLOY_TIMER_LIVE_PANEL_BG_COLOR,
            mod.UIDepth.BelowGameUI
        )
        : undefined;

    const fill = border
        ? ensureVehicleDeployInfoPlate(
            wn("VehicleDeployTimerLivePanelFill", pid),
            player,
            border,
            1,
            1,
            Math.max(1, VEHICLE_DEPLOY_TIMER_LIVE_PANEL_WIDTH - 2),
            Math.max(1, VEHICLE_DEPLOY_TIMER_LIVE_PANEL_HEIGHT - 2),
            mod.UIBgFill.Solid,
            VEHICLE_DEPLOY_TIMER_LIVE_PANEL_BG_ALPHA,
            VEHICLE_DEPLOY_TIMER_LIVE_PANEL_BG_COLOR,
            mod.UIDepth.BelowGameUI
        )
        : undefined;

    safeSetUIWidgetVisible(border, false);
    safeSetUIWidgetVisible(blur, false);
    safeSetUIWidgetVisible(fill, false);
    return { border, blur, fill };
}

// Builds the close button widgets as root-local chrome centered beneath the row lane.
function ensureVehicleDeployCloseButtonWidgets(
    player: mod.Player,
    parent: mod.UIWidget,
    pid: number
): VehicleDeployActionButtonWidgets {
    const borderName = wn("VehicleDeployTimerCloseButtonBorder", pid);
    const blurName = wn("VehicleDeployTimerCloseButtonBlur", pid);
    const fillName = wn("VehicleDeployTimerCloseButtonFill", pid);
    const textName = wn("VehicleDeployTimerCloseButtonText", pid);
    const buttonName = getVehicleDeployCloseButtonName(pid);
    const width = VEHICLE_DEPLOY_TIMER_CLOSE_BUTTON_WIDTH;
    const height = VEHICLE_DEPLOY_TIMER_CLOSE_BUTTON_HEIGHT;
    const buttonPadding = VEHICLE_DEPLOY_TIMER_SPAWN_BUTTON_BORDER_PADDING;
    const buttonInnerWidth = Math.max(1, width - (buttonPadding * 2));
    const buttonInnerHeight = Math.max(1, height - (buttonPadding * 2));

    const border = ensureVehicleDeployInfoPlate(
        borderName,
        player,
        parent,
        VEHICLE_DEPLOY_TIMER_CLOSE_BUTTON_X,
        VEHICLE_DEPLOY_TIMER_CLOSE_BUTTON_Y,
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

    let button = safeFind(buttonName);
    if (!button && border) {
        mod.AddUIButton(
            buttonName,
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
        button = safeFind(buttonName);
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
            mod.SetUIWidgetVisible(button, false);
        } catch {
            button = undefined;
        }
    }

    const text = border
        ? ensureVehicleDeployCenteredText(textName, player, border, width, height, VEHICLE_DEPLOY_TIMER_SPAWN_BUTTON_TEXT_SIZE)
        : undefined;
    safeSetUITextLabel(text, msg(mod.stringkeys.twl.teamSwitch.buttons.cancel));
    safeSetUITextColor(text, COLOR_WHITE);
    safeSetUIWidgetVisible(border, false);
    safeSetUIWidgetVisible(blur, false);
    safeSetUIWidgetVisible(fill, false);
    safeSetUIWidgetVisible(button, false);
    safeSetUIWidgetVisible(text, false);

    return { border, blur, fill, button, text };
}

function getVehicleDeployActionButtonWidgets(
    row: VehicleDeployTimerRowCacheEntry | undefined,
    mode: VehicleDirectSpawnMode
): VehicleDeployActionButtonWidgets {
    if (mode === "air") {
        return {
            border: row?.spawnButtonBorder,
            blur: row?.spawnButtonBlur,
            fill: row?.spawnButtonFill,
            button: row?.spawnButton,
            text: row?.spawnButtonText,
        };
    }
    return {
        border: row?.groundButtonBorder,
        blur: row?.groundButtonBlur,
        fill: row?.groundButtonFill,
        button: row?.groundButton,
        text: row?.groundButtonText,
    };
}

// Applies visibility to the cached live-terminal close button widgets.
function setVehicleDeployCloseButtonVisible(
    cache: VehicleDeployTimerHudCacheEntry | undefined,
    visible: boolean
): void {
    if (!cache) return;
    if (cache.lastCloseButtonVisible === visible) return;
    if (cache.closeButton) {
        mod.SetUIButtonEnabled(cache.closeButton, visible);
    }
    safeSetUIWidgetVisible(cache.closeButtonBorder, visible);
    safeSetUIWidgetVisible(cache.closeButtonBlur, false);
    safeSetUIWidgetVisible(cache.closeButtonFill, false);
    safeSetUIWidgetVisible(cache.closeButton, visible);
    safeSetUIWidgetVisible(cache.closeButtonText, visible);
    cache.lastCloseButtonVisible = visible;
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
    return visualState;
}

// Applies the shared button visual policy to the live-terminal close button.
function applyVehicleDeployCloseButtonVisualState(
    cache: VehicleDeployTimerHudCacheEntry | undefined,
    active: boolean,
    pressed: boolean
): void {
    if (!cache) return;
    cache.lastCloseButtonVisualState = applyVehicleDeployActionButtonVisualState(
        {
            border: cache.closeButtonBorder,
            blur: cache.closeButtonBlur,
            fill: cache.closeButtonFill,
            button: cache.closeButton,
            text: cache.closeButtonText,
        },
        active,
        pressed,
        cache.lastCloseButtonVisualState
    );
}

// Reconfigures the shared deploy HUD root into modal chrome when the live terminal owns the surface.
function applyVehicleDeployLiveTerminalChromeState(
    cache: VehicleDeployTimerHudCacheEntry | undefined,
    visible: boolean
): void {
    if (!cache?.root) return;
    if (cache.lastLiveTerminalChromeVisible !== visible) {
        safeSetUIWidgetVisible(cache.livePanelBorder, visible);
        safeSetUIWidgetVisible(cache.livePanelBlur, visible);
        safeSetUIWidgetVisible(cache.livePanelFill, visible);
        cache.lastLiveTerminalChromeVisible = visible;
    }
    setVehicleDeployCloseButtonVisible(cache, visible);
}

function applyVehicleDeployActionButtonVisualStateForMode(
    row: VehicleDeployTimerRowCacheEntry | undefined,
    mode: VehicleDirectSpawnMode,
    active: boolean,
    pressed: boolean
): void {
    if (!row) return;
    const priorState = mode === "air" ? row.lastSpawnButtonVisualState : row.lastGroundButtonVisualState;
    const nextState = applyVehicleDeployActionButtonVisualState(
        getVehicleDeployActionButtonWidgets(row, mode),
        active,
        pressed,
        priorState
    );
    if (mode === "air") {
        row.lastSpawnButtonVisualState = nextState;
        return;
    }
    row.lastGroundButtonVisualState = nextState;
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
    const airButtonX = leftX;
    const groundButtonX = showSpawnButton
        ? leftX + VEHICLE_DEPLOY_TIMER_SPAWN_BUTTON_WIDTH + VEHICLE_DEPLOY_TIMER_ROW_GAP_X
        : leftX;
    try {
        if (row.playerPlate) {
            mod.SetUIWidgetPosition(row.playerPlate, mod.CreateVector(leftX, mod.YComponentOf(mod.GetUIWidgetPosition(row.playerPlate)), 0));
            mod.SetUIWidgetSize(row.playerPlate, mod.CreateVector(Math.max(1, leftWidth), VEHICLE_DEPLOY_TIMER_INFO_PLATE_HEIGHT, 0));
        }
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
        if (row.groundButtonText) mod.SetUIWidgetSize(row.groundButtonText, mod.CreateVector(VEHICLE_DEPLOY_TIMER_SPAWN_BUTTON_WIDTH, VEHICLE_DEPLOY_TIMER_SPAWN_BUTTON_HEIGHT, 0));
        if (row.vehiclePlate) {
            mod.SetUIWidgetPosition(row.vehiclePlate, mod.CreateVector(vehicleX, mod.YComponentOf(mod.GetUIWidgetPosition(row.vehiclePlate)), 0));
            mod.SetUIWidgetSize(row.vehiclePlate, mod.CreateVector(vehicleWidth, VEHICLE_DEPLOY_TIMER_INFO_PLATE_HEIGHT, 0));
        }
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
    if (!vehicle) return msg(getVehicleDeployIdleLabelKey());
    const ownerPid = slot.activeOwnerPid;
    if (ownerPid !== undefined && !isPidDisconnected(ownerPid)) {
        return getUiSafePlayerPidMessage(ownerPid);
    }
    return msg(getVehicleDeployIdleLabelKey());
}

function setVehicleDeployTimerNameVisible(row: VehicleDeployTimerRowCacheEntry | undefined, visible: boolean): void {
    if (!row) return;
    if (row.lastPlayerNameVisible === visible) return;
    safeSetUIWidgetVisible(row.playerPlate, visible);
    safeSetUIWidgetVisible(row.playerText, visible);
    row.lastPlayerNameVisible = visible;
}

function setVehicleDeployActionButtonVisible(
    row: VehicleDeployTimerRowCacheEntry | undefined,
    mode: VehicleDirectSpawnMode,
    visible: boolean
): void {
    if (!row) return;
    if (mode === "air" && row.lastSpawnButtonVisible === visible) return;
    if (mode === "ground" && row.lastGroundButtonVisible === visible) return;
    const widgets = getVehicleDeployActionButtonWidgets(row, mode);
    if (widgets.button) {
        mod.SetUIButtonEnabled(widgets.button, visible);
    }
    safeSetUIWidgetVisible(widgets.border, visible);
    safeSetUIWidgetVisible(widgets.blur, false);
    safeSetUIWidgetVisible(widgets.fill, false);
    safeSetUIWidgetVisible(widgets.button, visible);
    safeSetUIWidgetVisible(widgets.text, visible);
    if (mode === "air") {
        row.lastSpawnButtonVisible = visible;
        return;
    }
    row.lastGroundButtonVisible = visible;
}

function clearVehicleDeployActionButtonState(
    row: VehicleDeployTimerRowCacheEntry | undefined,
    mode: VehicleDirectSpawnMode
): void {
    if (!row) return;
    if (mode === "air") {
        if (!row.spawnButtonHovered && !row.spawnButtonFocused && !row.spawnButtonPressed) return;
        row.spawnButtonHovered = false;
        row.spawnButtonFocused = false;
        row.spawnButtonPressed = false;
        applyVehicleDeployActionButtonVisualStateForMode(row, mode, false, false);
        return;
    }
    if (!row.groundButtonHovered && !row.groundButtonFocused && !row.groundButtonPressed) return;
    row.groundButtonHovered = false;
    row.groundButtonFocused = false;
    row.groundButtonPressed = false;
    applyVehicleDeployActionButtonVisualStateForMode(row, mode, false, false);
}

function clearVehicleDeployActionButtonStateForAllRows(
    cache: VehicleDeployTimerHudCacheEntry | undefined,
    exceptIndex?: number,
    exceptMode?: VehicleDirectSpawnMode
): void {
    if (!cache) return;
    for (let i = 0; i < cache.rows.length; i++) {
        if (exceptIndex !== undefined && i === exceptIndex) {
            if (exceptMode === "air") {
                clearVehicleDeployActionButtonState(cache.rows[i], "ground");
                continue;
            }
            if (exceptMode === "ground") {
                clearVehicleDeployActionButtonState(cache.rows[i], "air");
                continue;
            }
        }
        clearVehicleDeployActionButtonState(cache.rows[i], "air");
        clearVehicleDeployActionButtonState(cache.rows[i], "ground");
    }
}

// Resets cached hover/focus/pressed state for the live-terminal close button.
function clearVehicleDeployCloseButtonState(cache: VehicleDeployTimerHudCacheEntry | undefined): void {
    if (!cache) return;
    if (!cache.closeButtonHovered && !cache.closeButtonFocused && !cache.closeButtonPressed) return;
    cache.closeButtonHovered = false;
    cache.closeButtonFocused = false;
    cache.closeButtonPressed = false;
    applyVehicleDeployCloseButtonVisualState(cache, false, false);
}

function ensureVehicleDeployTimerHudForPlayer(player: mod.Player): VehicleDeployTimerHudCacheEntry | undefined {
    if (!isValidPlayer(player)) return undefined;
    const pid = mod.GetObjId(player);
    const priorCache = State.hudCache.vehicleDeployTimerCache[pid];
    if (isVehicleDeployTimerHudCacheUsable(priorCache)) {
        return priorCache;
    }
    if (FEATURE_PERF_DIAG) {
        if (priorCache) {
            incrementUiCachePerfCounter(pid, "vehicle", "invalid");
            incrementUiCachePerfCounter(pid, "vehicle", "rebuilt");
        } else {
            incrementUiCachePerfCounter(pid, "vehicle", "built");
        }
    }
    let cache = priorCache;
    const uiRoot = mod.GetUIRoot();

    deleteVehicleDeployTimerHudArtifactsForPid(pid);
    safeParseUI({
        name: wn("VehicleDeployTimerHudRoot", pid),
        type: "Container",
        playerId: player,
        position: [VEHICLE_DEPLOY_TIMER_ROOT_OFFSET_X, VEHICLE_DEPLOY_TIMER_ROOT_OFFSET_Y],
        size: [VEHICLE_DEPLOY_TIMER_ROOT_WIDTH, VEHICLE_DEPLOY_TIMER_ROOT_HEIGHT],
        anchor: mod.UIAnchor.CenterRight,
        visible: false,
        padding: 0,
        bgAlpha: 0,
        bgFill: mod.UIBgFill.None,
    });
    cache = {
        rootName: wn("VehicleDeployTimerHudRoot", pid),
        root: safeFind(wn("VehicleDeployTimerHudRoot", pid)),
        livePanelBorder: priorCache?.livePanelBorder,
        livePanelBlur: priorCache?.livePanelBlur,
        livePanelFill: priorCache?.livePanelFill,
        closeButtonBorder: priorCache?.closeButtonBorder,
        closeButtonBlur: priorCache?.closeButtonBlur,
        closeButtonFill: priorCache?.closeButtonFill,
        closeButton: priorCache?.closeButton,
        closeButtonText: priorCache?.closeButtonText,
        closeButtonHovered: priorCache?.closeButtonHovered ?? false,
        closeButtonFocused: priorCache?.closeButtonFocused ?? false,
        closeButtonPressed: priorCache?.closeButtonPressed ?? false,
        lastCloseButtonVisible: priorCache?.lastCloseButtonVisible,
        lastCloseButtonVisualState: undefined,
        lastLiveTerminalChromeVisible: priorCache?.lastLiveTerminalChromeVisible,
        rows: [],
        lastVisibleState: priorCache?.lastVisibleState,
        lastRenderSignature: priorCache?.lastRenderSignature,
    };
    State.hudCache.vehicleDeployTimerCache[pid] = cache;

    // cache.root already populated at construction (line above); the prior redundant safeFind was removed.
    if (!cache.root) return undefined;

    try {
        mod.SetUIWidgetParent(cache.root, uiRoot);
        mod.SetUIWidgetAnchor(cache.root, mod.UIAnchor.CenterRight);
        mod.SetUIWidgetPosition(cache.root, mod.CreateVector(VEHICLE_DEPLOY_TIMER_ROOT_OFFSET_X, VEHICLE_DEPLOY_TIMER_ROOT_OFFSET_Y, 0));
        mod.SetUIWidgetSize(cache.root, mod.CreateVector(VEHICLE_DEPLOY_TIMER_ROOT_WIDTH, VEHICLE_DEPLOY_TIMER_ROOT_HEIGHT, 0));
        mod.SetUIWidgetBgColor(cache.root, COLOR_DARK_BLACK);
        mod.SetUIWidgetBgAlpha(cache.root, 0);
        mod.SetUIWidgetBgFill(cache.root, mod.UIBgFill.None);
        mod.SetUIWidgetDepth(cache.root, mod.UIDepth.AboveGameUI);
    } catch {
        return undefined;
    }

    const livePanelWidgets = ensureVehicleDeployLivePanelWidgets(player, uiRoot, pid);
    cache.livePanelBorder = livePanelWidgets.border;
    cache.livePanelBlur = livePanelWidgets.blur;
    cache.livePanelFill = livePanelWidgets.fill;

    const closeButtonWidgets = ensureVehicleDeployCloseButtonWidgets(player, cache.root, pid);
    cache.closeButtonBorder = closeButtonWidgets.border;
    cache.closeButtonBlur = closeButtonWidgets.blur;
    cache.closeButtonFill = closeButtonWidgets.fill;
    cache.closeButton = closeButtonWidgets.button;
    cache.closeButtonText = closeButtonWidgets.text;
    applyVehicleDeployCloseButtonVisualState(
        cache,
        (cache.closeButtonHovered === true) || (cache.closeButtonFocused === true),
        cache.closeButtonPressed === true
    );
    setVehicleDeployCloseButtonVisible(cache, false);

    for (let i = 0; i < VEHICLE_DEPLOY_TIMER_MAX_ROWS; i++) {
        const baseY = getVehicleDeployTimerRowBaseY(i);
        const playerPlate = ensureVehicleDeployInfoPlate(
            wn("VehicleDeployTimerPlayerPlate", pid, i),
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
        const playerText = playerPlate
            ? ensureVehicleDeployCenteredText(
                wn("VehicleDeployTimerPlayerText", pid, i),
                player,
                playerPlate,
                VEHICLE_DEPLOY_TIMER_PLAYER_PLATE_WIDTH,
                VEHICLE_DEPLOY_TIMER_INFO_PLATE_HEIGHT
            )
            : undefined;

        const vehiclePlate = ensureVehicleDeployInfoPlate(
            wn("VehicleDeployTimerVehiclePlate", pid, i),
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
        const vehicleText = vehiclePlate
            ? ensureVehicleDeployCenteredText(
                wn("VehicleDeployTimerVehicleText", pid, i),
                player,
                vehiclePlate,
                VEHICLE_DEPLOY_TIMER_VEHICLE_PLATE_WIDTH,
                VEHICLE_DEPLOY_TIMER_INFO_PLATE_HEIGHT
            )
            : undefined;

        const groundButtonWidgets = ensureVehicleDeployActionButtonWidgets(
            player,
            cache.root,
            pid,
            i,
            "ground",
            mod.stringkeys.twl.ui.hqDeploy,
            VEHICLE_DEPLOY_TIMER_GROUND_BUTTON_X,
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
            playerText,
            vehiclePlate,
            vehicleText,
            spawnButtonBorder: spawnButtonWidgets.border,
            spawnButtonBlur: spawnButtonWidgets.blur,
            spawnButtonFill: spawnButtonWidgets.fill,
            spawnButton: spawnButtonWidgets.button,
            spawnButtonText: spawnButtonWidgets.text,
            groundButtonBorder: groundButtonWidgets.border,
            groundButtonBlur: groundButtonWidgets.blur,
            groundButtonFill: groundButtonWidgets.fill,
            groundButton: groundButtonWidgets.button,
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
        applyVehicleDeployActionButtonVisualStateForMode(
            cache.rows[i],
            "air",
            (cache.rows[i].spawnButtonHovered === true) || (cache.rows[i].spawnButtonFocused === true),
            cache.rows[i].spawnButtonPressed === true
        );
        applyVehicleDeployActionButtonVisualStateForMode(
            cache.rows[i],
            "ground",
            (cache.rows[i].groundButtonHovered === true) || (cache.rows[i].groundButtonFocused === true),
            cache.rows[i].groundButtonPressed === true
        );
        setVehicleDeployTimerRowVisible(cache.rows[i], false);
    }

    safeSetUIWidgetVisible(cache.root, false);
    cache.lastVisibleState = false;
    return cache;
}

// Ensures the cached vehicle HUD tree exists and is fully hidden/offscreen before hidden prebuild work.
function prepareVehicleDeployTimerHudForHiddenPrebuild(player: mod.Player): VehicleDeployTimerHudCacheEntry | undefined {
    if (!isValidPlayer(player)) return;
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return;
    const cache = ensureVehicleDeployTimerHudForPlayer(player);
    if (!cache || !cache.root) return;
    safeSetUIWidgetVisible(cache.root, false);
    setVehicleDeployTimerRootOnscreen(cache, false);
    cache.lastVisibleState = false;
    for (let i = 0; i < cache.rows.length; i++) {
        setVehicleDeployTimerRowVisible(cache.rows[i], false);
    }
    return cache;
}

function setVehicleDeployTimerRowVisible(row: VehicleDeployTimerRowCacheEntry | undefined, visible: boolean): void {
    if (!row) return;
    if (row.lastVisibleState === visible) return;
    if (visible) {
        safeSetUIWidgetVisible(row.vehiclePlate, true);
        safeSetUIWidgetVisible(row.vehicleText, true);
    } else {
        safeSetUIWidgetVisible(row.vehiclePlate, false);
        safeSetUIWidgetVisible(row.vehicleText, false);
        safeSetUIWidgetVisible(row.playerPlate, false);
        safeSetUIWidgetVisible(row.playerText, false);
        safeSetUIWidgetVisible(row.spawnButtonBorder, false);
        safeSetUIWidgetVisible(row.spawnButtonBlur, false);
        safeSetUIWidgetVisible(row.spawnButtonFill, false);
        safeSetUIWidgetVisible(row.spawnButton, false);
        safeSetUIWidgetVisible(row.spawnButtonText, false);
        safeSetUIWidgetVisible(row.groundButtonBorder, false);
        safeSetUIWidgetVisible(row.groundButtonBlur, false);
        safeSetUIWidgetVisible(row.groundButtonFill, false);
        safeSetUIWidgetVisible(row.groundButton, false);
        safeSetUIWidgetVisible(row.groundButtonText, false);
        setReusableTimerVisible(row.timer, false);
        row.lastPlayerNameVisible = false;
        row.lastSpawnButtonVisible = false;
        row.lastGroundButtonVisible = false;
    }
    row.lastVisibleState = visible;
}

type VehicleDeployTimerRowVisibilityState = {
    rowVisible: boolean;
    playerNameVisible: boolean;
    spawnButtonVisible: boolean;
    groundButtonVisible: boolean;
    timerVisible: boolean;
};

function buildHiddenVehicleDeployTimerRowVisibilityState(): VehicleDeployTimerRowVisibilityState {
    return {
        rowVisible: false,
        playerNameVisible: false,
        spawnButtonVisible: false,
        groundButtonVisible: false,
        timerVisible: false,
    };
}

function applyVehicleDeployTimerRowVisibilityState(
    row: VehicleDeployTimerRowCacheEntry | undefined,
    visibility: VehicleDeployTimerRowVisibilityState
): void {
    if (!row) return;
    setVehicleDeployTimerRowVisible(row, visibility.rowVisible);
    if (!visibility.rowVisible) return;
    setVehicleDeployTimerNameVisible(row, visibility.playerNameVisible);
    setVehicleDeployActionButtonVisible(row, "air", visibility.spawnButtonVisible);
    setVehicleDeployActionButtonVisible(row, "ground", visibility.groundButtonVisible);
    setReusableTimerVisible(row.timer, visibility.timerVisible);
}

function renderVehicleDeployTimerRow(
    row: VehicleDeployTimerRowCacheEntry | undefined,
    slot: VehicleSpawnerSlot | undefined,
    viewerPid: number,
    applyVisibility: boolean = true
): VehicleDeployTimerRowVisibilityState {
    if (!row) {
        return {
            rowVisible: false,
            playerNameVisible: false,
            spawnButtonVisible: false,
            groundButtonVisible: false,
            timerVisible: false,
        };
    }
    if (!slot) {
        const hiddenState: VehicleDeployTimerRowVisibilityState = {
            rowVisible: false,
            playerNameVisible: false,
            spawnButtonVisible: false,
            groundButtonVisible: false,
            timerVisible: false,
        };
        if (applyVisibility) {
            applyVehicleDeployTimerRowVisibilityState(row, hiddenState);
        }
        return hiddenState;
    }

    const deployed = !!State.players.deployedByPid[viewerPid];
    const liveTerminalOpen = isVehicleDeployLiveTerminalModeForPid(viewerPid);
    const activeOwnerMessage = getVehicleDeployActiveOwnerNameMessage(slot);
    const showPlayerName = slot.vehicleId !== -1;
    const slotReadyForButtons = (!deployed || liveTerminalOpen) && isVehicleDeploySlotReadyForSpawnButton(slot);
    // Air/forward deploy hidden until live; ground (HQ) deploy hidden during countdown; both visible when live.
    const isCountdown = State.conquest.lifecyclePhase === "COUNTDOWN";
    const slotTeamId = slot.teamId;
    const isAirType = doesVehicleTypeSupportAirDeploy(slot.vehicleType);
    const isForwardType = !isAirType && doesVehicleTypeSupportForwardDeploy(slot.vehicleType);
    const airDelayActive = isRoundStartAirDelayActive();
    const airDeployDelayActive = isRoundStartAirDeployDelayActive();
    const forwardDelayActive = isRoundStartForwardDeployDelayActive();
    const confirmedMethod = State.round.modeConfig.confirmed.vehicleDeployMethod ?? VEHICLE_DEPLOY_METHOD_DEFAULT;
    const hqDeployAllowed = confirmedMethod >= VEHICLE_DEPLOY_METHOD_HQ;
    // v1.328 forward-deploy wiring: the HQ_FORWARD enum tier is retained for historical reads,
    // but the orthogonal `forwardDeployEnabled` checkbox is authoritative. Forward deploy is
    // meaningful only in HQ mode; the checkbox is ignored in Vanilla.
    const forwardDeployAllowed = hqDeployAllowed && State.round.modeConfig.confirmed.forwardDeployEnabled === true;
    // v1.329 air-deploy wiring: mirrors the v1.328 forward treatment. The HQ_FORWARD_AIR enum
    // tier is retained for historical reads, but the orthogonal `airDeployEnabled` checkbox
    // is authoritative. Air deploy is meaningful only in HQ mode; the checkbox is ignored in
    // Vanilla. Volume-presence gate keeps the button hidden on maps without aircraft volumes.
    const airDeployAllowed = hqDeployAllowed && State.round.modeConfig.confirmed.airDeployEnabled === true;
    // Spawn button (air/forward): blocked during all applicable round-start delays; gated by deploy method.
    const showSpawnButton = slotReadyForButtons && slot.deployFlowTracked && isMatchLive() && (
        (isAirType && airDeployAllowed && hasEnabledAircraftSpawnVolumesForTeam(slotTeamId) && !airDelayActive && !airDeployDelayActive)
        || (isForwardType && forwardDeployAllowed && hasEnabledTankSpawnVolumesForTeam(slotTeamId) && !forwardDelayActive)
    );
    // Ground/HQ button: aircraft blocked during full airDelay; always blocked during countdown; gated by deploy method.
    const showGroundButton = slotReadyForButtons && slot.deployFlowTracked && hqDeployAllowed
        && doesVehicleTypeSupportGroundDeploy(slot.vehicleType) && !isCountdown
        && !(isAirType && airDelayActive);
    let showTimer = true;
    layoutVehicleDeployRowForState(row, showPlayerName, showSpawnButton, showGroundButton);

    const spawnLabel = isAirType
        ? mod.stringkeys.twl.ui.airDeploy
        : mod.stringkeys.twl.ui.forwardDeploy;
    safeSetUITextLabel(row.vehicleText, msg(getVehicleDeployTimerLabelKey(slot.vehicleType)));
    safeSetUITextColor(row.vehicleText, COLOR_WHITE);
    safeSetUITextLabel(row.spawnButtonText, msg(spawnLabel));
    safeSetUITextLabel(row.groundButtonText, msg(mod.stringkeys.twl.ui.hqDeploy));
    safeSetUITextColor(row.spawnButtonText, COLOR_WHITE);
    safeSetUITextColor(row.groundButtonText, COLOR_WHITE);

    if (showPlayerName && activeOwnerMessage) {
        safeSetUITextLabel(row.playerText, activeOwnerMessage);
        safeSetUITextColor(row.playerText, COLOR_WHITE);
    }

    if (!showSpawnButton) {
        clearVehicleDeployActionButtonState(row, "air");
    }
    if (!showGroundButton) {
        clearVehicleDeployActionButtonState(row, "ground");
    }

    // HQ claim phases: spawn_pending (pendingSpawnOwnerPid set, vehicleId === -1) and
    // seat_pending (pendingSpawnOwnerPid set, vehicleId !== -1). Buttons are already
    // suppressed via isVehicleDeploySlotReadyForSpawnButton; this branch replaces the
    // misleading "READY" fallback with a distinct SPAWNING/DEPLOYING signal in yellow.
    const hqClaimActive = slot.pendingSpawnOwnerPid !== undefined;
    if (slot.vehicleId !== -1 && hqClaimActive) {
        setReusableTimerStatus(row.timer, "deploying", msg(mod.stringkeys.twl.ui.deploying), COLOR_WARNING_YELLOW);
    } else if (slot.vehicleId !== -1) {
        setReusableTimerStatus(row.timer, "active", msg(mod.stringkeys.twl.ui.active), COLOR_LOW_TIME);
    } else if (hqClaimActive) {
        setReusableTimerStatus(row.timer, "spawning", msg(mod.stringkeys.twl.ui.spawning), COLOR_WARNING_YELLOW);
    } else if (showSpawnButton || showGroundButton) {
        setReusableTimerStatus(row.timer, "ready", msg(mod.stringkeys.twl.ui.ready), COLOR_READY_GREEN);
    } else if (isAirType && airDelayActive) {
        // Round-start air delay: show progress bar until aircraft deployment unlocks.
        // Bar fills 0% -> 100% as the delay elapses (Wave 5 v1.439 / L11).
        const airDelayTotal = ACTIVE_MAP_CONFIG.roundStartAirDelay ?? 0;
        const airDelayRemaining = getRoundStartAirDelayRemainingSeconds();
        const airDelayElapsed = airDelayTotal > 0 ? 1 - (airDelayRemaining / airDelayTotal) : 1;
        setReusableTimerProgress(row.timer, airDelayElapsed);
    } else if (getVehicleSlotRespawnRemainingSeconds(slot) <= 0) {
        setReusableTimerStatus(row.timer, "ready", msg(mod.stringkeys.twl.ui.ready), COLOR_READY_GREEN);
    } else {
        // Vehicle respawn cooldown: bar fills 0% -> 100% as the cooldown elapses.
        const respawnTotal = slot.respawnDelaySeconds ?? 0;
        const respawnRemaining = getVehicleSlotRespawnRemainingSeconds(slot);
        const respawnElapsed = respawnTotal > 0 ? 1 - (respawnRemaining / respawnTotal) : 1;
        setReusableTimerProgress(row.timer, respawnElapsed);
    }

    applyVehicleDeployActionButtonVisualStateForMode(row, "air", !!row.spawnButtonHovered || !!row.spawnButtonFocused, !!row.spawnButtonPressed);
    applyVehicleDeployActionButtonVisualStateForMode(row, "ground", !!row.groundButtonHovered || !!row.groundButtonFocused, !!row.groundButtonPressed);
    const visibilityState: VehicleDeployTimerRowVisibilityState = {
        rowVisible: true,
        playerNameVisible: showPlayerName,
        spawnButtonVisible: showSpawnButton,
        groundButtonVisible: showGroundButton,
        timerVisible: showTimer,
    };
    if (applyVisibility) {
        applyVehicleDeployTimerRowVisibilityState(row, visibilityState);
    }
    return visibilityState;
}

function hideVehicleDeployTimerHudFamily(
    cache: VehicleDeployTimerHudCacheEntry | undefined,
    parkOffscreen: boolean
): void {
    if (!cache?.root) return;
    clearVehicleDeployCloseButtonState(cache);
    applyVehicleDeployLiveTerminalChromeState(cache, false);
    if (parkOffscreen) {
        setVehicleDeployTimerRootOnscreen(cache, false);
    }
    safeSetUIWidgetVisible(cache.root, false);
    cache.lastVisibleState = false;
    for (let i = 0; i < cache.rows.length; i++) {
        setVehicleDeployTimerRowVisible(cache.rows[i], false);
    }
}

function applyVehicleDeployTimerRenderPlanContent(
    cache: VehicleDeployTimerHudCacheEntry,
    renderPlan: VehicleDeployTimerRenderPlan,
    viewerPid: number
): boolean {
    if (!renderPlan.shouldShowRows || !renderPlan.warmReady) {
        cache.lastRenderSignature = renderPlan.signature;
        hideVehicleDeployTimerHudFamily(cache, false);
        return false;
    }

    applyVehicleDeployLiveTerminalChromeState(cache, renderPlan.liveTerminalOpen && renderPlan.visible);

    const hiddenState = buildHiddenVehicleDeployTimerRowVisibilityState();
    const rowVisibilityStates: VehicleDeployTimerRowVisibilityState[] = [];
    for (let i = 0; i < VEHICLE_DEPLOY_TIMER_MAX_ROWS; i++) {
        rowVisibilityStates[i] = renderVehicleDeployTimerRow(cache.rows[i], renderPlan.slots[i], viewerPid, false);
    }
    for (let i = 0; i < VEHICLE_DEPLOY_TIMER_MAX_ROWS; i++) {
        applyVehicleDeployTimerRowVisibilityState(cache.rows[i], rowVisibilityStates[i] ?? hiddenState);
    }
    cache.lastRenderSignature = renderPlan.signature;
    return renderPlan.visible;
}

function setVehicleDeployTimerHudFamilyVisible(
    cache: VehicleDeployTimerHudCacheEntry,
    visible: boolean
): void {
    if (!cache.root) return;
    if (!visible) {
        applyVehicleDeployLiveTerminalChromeState(cache, false);
    }
    setVehicleDeployTimerRootOnscreen(cache, visible);
    safeSetUIWidgetVisible(cache.root, visible);
    cache.lastVisibleState = visible;
}

// Restores UI input mode when the vehicle HUD is the active undeployed interaction surface.
function syncVehicleDeployHudViewerInputMode(player: mod.Player, pid: number): void {
    const liveTerminalOpen = isVehicleDeployLiveTerminalModeForPid(pid);
    if (
        (!State.players.deployedByPid[pid] || liveTerminalOpen)
        && !State.players.readyDialogData[pid]?.dialogVisible
        && !State.players.uiInputEnabledByPid[pid]
    ) {
        setUIInputModeForPlayer(player, true);
    }
}

function tryHandleVehicleDeployTimerButtonEvent(
    eventPlayer: mod.Player,
    eventUIWidget: mod.UIWidget,
    eventUIButtonEvent: mod.UIButtonEvent
): boolean {
    if (!isValidPlayer(eventPlayer)) return false;
    const pid = safeGetPlayerId(eventPlayer);
    if (pid === undefined) return false;

    const widgetName = mod.GetUIWidgetName(eventUIWidget);
    const closeButtonName = getVehicleDeployCloseButtonName(pid);
    const cache = State.hudCache.vehicleDeployTimerCache[pid];
    const liveTerminalOpen = isVehicleDeployLiveTerminalModeForPid(pid);
    if (widgetName === closeButtonName) {
        if (!cache) return true;
        if (!liveTerminalOpen) return true;
        if (mod.Equals(eventUIButtonEvent, mod.UIButtonEvent.FocusIn)) {
            cache.closeButtonHovered = false;
            cache.closeButtonFocused = true;
            cache.closeButtonPressed = false;
            applyVehicleDeployCloseButtonVisualState(cache, true, false);
            return true;
        }
        if (mod.Equals(eventUIButtonEvent, mod.UIButtonEvent.FocusOut)) {
            cache.closeButtonFocused = false;
            cache.closeButtonPressed = false;
            applyVehicleDeployCloseButtonVisualState(cache, !!cache.closeButtonHovered, false);
            return true;
        }
        if (mod.Equals(eventUIButtonEvent, mod.UIButtonEvent.HoverIn)) {
            cache.closeButtonHovered = true;
            cache.closeButtonFocused = false;
            cache.closeButtonPressed = false;
            applyVehicleDeployCloseButtonVisualState(cache, true, false);
            return true;
        }
        if (mod.Equals(eventUIButtonEvent, mod.UIButtonEvent.HoverOut)) {
            cache.closeButtonHovered = false;
            cache.closeButtonPressed = false;
            applyVehicleDeployCloseButtonVisualState(cache, !!cache.closeButtonFocused, false);
            return true;
        }
        if (mod.Equals(eventUIButtonEvent, mod.UIButtonEvent.ButtonDown)) {
            cache.closeButtonHovered = cache.closeButtonHovered === true;
            cache.closeButtonFocused = cache.closeButtonFocused === true || !cache.closeButtonHovered;
            cache.closeButtonPressed = true;
            applyVehicleDeployCloseButtonVisualState(cache, true, true);
            return true;
        }
        if (!mod.Equals(eventUIButtonEvent, mod.UIButtonEvent.ButtonUp)) return true;
        cache.closeButtonPressed = false;
        applyVehicleDeployCloseButtonVisualState(cache, !!cache.closeButtonHovered || !!cache.closeButtonFocused, false);
        closeVehicleDeployLiveMenuForPlayer(eventPlayer);
        return true;
    }

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
    if (!isHudWarmReadyForPid(pid)) return true;
    if (!mode) return true;
    const closureMode: VehicleDirectSpawnMode = mode;

    const row = cache?.rows[rowIndex];
    const setVisual = (active: boolean, pressed: boolean): void => {
        applyVehicleDeployActionButtonVisualStateForMode(row, closureMode, active, pressed);
    };
    if (mod.Equals(eventUIButtonEvent, mod.UIButtonEvent.FocusIn)) {
        clearVehicleDeployActionButtonStateForAllRows(cache, rowIndex, mode);
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
        clearVehicleDeployActionButtonStateForAllRows(cache, rowIndex, mode);
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
        clearVehicleDeployActionButtonStateForAllRows(cache, rowIndex, mode);
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
    if (State.players.deployedByPid[pid] && !liveTerminalOpen) return true;
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

    // v1.279 Phase 3 / Phase 6: HQ dispatch wiring. Deploy-menu and live-terminal routes both
    // dispatch through requestHqVehicleSpawn -- the `source` param selects the seat path
    // inside beginHqSeatFlow ("on_foot" triggers undeploy->redeploy; "deploy_menu" deploys
    // directly). Vanilla mode takes the no-op branch (rejection reason "not_hq_mode").
    //
    // v1.328 / v1.329: the "air" button label is shared across Air Deploy (aircraft rows) and
    // Forward Deploy (non-aircraft rows). Route aircraft clicks to requestAirVehicleSpawn
    // (pendingSpawnMode="air", spawner relocates to the pre-sampled sky point) and non-aircraft
    // clicks to requestForwardVehicleSpawn (pendingSpawnMode="forward", relocates to the
    // pre-sampled ground point). The "ground" button (HQ Deploy) always takes the HQ path.
    const source = liveTerminalOpen ? "on_foot" : "deploy_menu";
    if (mode === "air") {
        const visibleSlots = getVehicleDeployVisibleSlotsForPlayer(eventPlayer);
        const targetSlot = visibleSlots[rowIndex];
        const isAircraftRow = targetSlot && doesVehicleTypeSupportAirDeploy(targetSlot.vehicleType);
        const isForwardRow = targetSlot
            && !isAircraftRow
            && doesVehicleTypeSupportForwardDeploy(targetSlot.vehicleType);
        if (isAircraftRow) {
            requestAirVehicleSpawn(eventPlayer, pid, rowIndex, source);
        } else if (isForwardRow) {
            requestForwardVehicleSpawn(eventPlayer, pid, rowIndex, source);
        } else {
            requestHqVehicleSpawn(eventPlayer, pid, rowIndex, source);
        }
    } else {
        requestHqVehicleSpawn(eventPlayer, pid, rowIndex, source);
    }
    updateVehicleDeployTimerHudForPlayer(eventPlayer);
    return true;
}

// Owner-only hidden prebuild path for the vehicle HUD family.
// This always ensures the HUD shell exists while hidden/offscreen so later reveal never pays widget creation.
// If row content is not ready yet, the hidden pass still caches the shell and keeps the family hidden.
function prebuildVehicleDeployTimerHudHiddenForPlayer(player: mod.Player): boolean {
    if (!isValidPlayer(player)) return false;
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return false;

    const cache = prepareVehicleDeployTimerHudForHiddenPrebuild(player);
    if (!cache || !cache.root) return false;

    const renderPlan = buildVehicleDeployTimerRenderPlan(player, pid);
    const visible = applyVehicleDeployTimerRenderPlanContent(cache, renderPlan, pid);
    setVehicleDeployTimerHudFamilyVisible(cache, false);
    return visible;
}

// Owner-only reveal path for the vehicle HUD family.
// Contract: content must already be safe to reveal; this path owns the final visible state.
function revealVehicleDeployTimerHudForPlayer(player: mod.Player): boolean {
    if (!isValidPlayer(player)) return false;
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return false;
    if (FEATURE_PERF_DIAG && !isVehicleDeployTimerHudCacheUsable(State.hudCache.vehicleDeployTimerCache[pid])) {
        incrementUiCachePerfCounter(pid, "vehicle", "cold");
    }

    const cache = ensureVehicleDeployTimerHudForPlayer(player);
    if (!cache || !cache.root) return false;

    if (cache.lastVisibleState !== true) {
        setVehicleDeployTimerHudFamilyVisible(cache, false);
    }

    const renderPlan = buildVehicleDeployTimerRenderPlan(player, pid);
    const visible = applyVehicleDeployTimerRenderPlanContent(cache, renderPlan, pid);
    setVehicleDeployTimerHudFamilyVisible(cache, visible);
    syncVehicleDeployHudViewerInputMode(player, pid);
    return visible;
}

function refreshVehicleDeployTimersForPlayerPreservingVisibility(player: mod.Player): boolean {
    if (!isValidPlayer(player)) return false;
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return false;
    const cache = ensureVehicleDeployTimerHudForPlayer(player);
    if (!cache || !cache.root) return false;
    const renderPlan = buildVehicleDeployTimerRenderPlan(player, pid);
    const currentlyVisible = State.hudCache.vehicleDeployTimerCache[pid]?.lastVisibleState === true;
    const autoOwnsVisibility = (
        !State.players.deployedByPid[pid]
        || isVehicleDeployTimerAdminOverrideEnabledForPid(pid)
        || isVehicleDeployLiveTerminalModeForPid(pid)
        // v1.261: auto-reveal passive HUD for deployed viewers whenever a slot is cooling down.
        // Why: prior gating required currentlyVisible to stay visible; if the HUD was hidden at
        // deploy time, a later destroy→respawn countdown couldn't re-surface it.
        || renderPlan.shouldShowRows
    );
    const nextVisibleState = renderPlan.visible && (currentlyVisible || autoOwnsVisibility);
    if (cache.lastRenderSignature === renderPlan.signature && cache.lastVisibleState === nextVisibleState) {
        syncVehicleDeployHudViewerInputMode(player, pid);
        return nextVisibleState;
    }
    applyVehicleDeployTimerRenderPlanContent(cache, renderPlan, pid);
    setVehicleDeployTimerHudFamilyVisible(cache, nextVisibleState);
    syncVehicleDeployHudViewerInputMode(player, pid);
    return nextVisibleState;
}

// Self-terminating async loop that drives HUD countdown updates for round-start deploy delays.
// Ticks once per second until all three delay windows have expired, then does a final refresh.
async function runRoundStartDelayHudLoop(): Promise<void> {
    const liveAt = State.round.liveStartedAtSeconds;
    if (liveAt === undefined) return;
    const maxDelay = Math.max(
        ACTIVE_MAP_CONFIG.roundStartAirDelay ?? 0,
        ACTIVE_MAP_CONFIG.roundStartAirDeployDelay ?? 0,
        ACTIVE_MAP_CONFIG.roundStartForwardDeployDelay ?? 0
    );
    if (maxDelay <= 0) return;
    while (isMatchLive() && getSecondsSinceLive() < maxDelay) {
        await mod.Wait(1.0);
        if (!isMatchLive()) return;
        updateVehicleDeployTimerHudForViewers();
    }
    // Final refresh to flip buttons from countdown to ready/available.
    updateVehicleDeployTimerHudForAllPlayers();
}

// Public non-owner refresh path for one viewer.
// This preserves current family visibility and avoids using the reveal-capable owner path directly.
function updateVehicleDeployTimerHudForPlayer(player: mod.Player): boolean {
    return refreshVehicleDeployTimersForPlayerPreservingVisibility(player);
}

// Public non-owner refresh path for all viewers.
// Use this for gameplay state changes that should not alter family visibility ownership.
function updateVehicleDeployTimerHudForAllPlayers(): void {
    forEachValidPlayer((player) => refreshVehicleDeployTimersForPlayerPreservingVisibility(player));
}

// Targeted update for players who currently have the deploy timer HUD visible.
// Used by self-terminating cooldown loops to avoid iterating all players via mod.AllPlayers().
function updateVehicleDeployTimerHudForViewers(): void {
    const caches = State.hudCache.vehicleDeployTimerCache;
    for (const pidKey in caches) {
        const cache = caches[pidKey];
        if (!cache || cache.lastVisibleState !== true) continue;
        const pid = Number(pidKey);
        const player = safeFindPlayer(pid);
        if (!isValidPlayer(player)) continue;
        refreshVehicleDeployTimersForPlayerPreservingVisibility(player);
    }
}

// Invalidates cached render signatures so the next refresh repaints visible passive viewers without rebuilding the tree.
function invalidateVehicleDeployTimerHudRenderSignaturesForAllPlayers(): void {
    const caches = State.hudCache.vehicleDeployTimerCache;
    for (const pidKey in caches) {
        const cache = caches[pidKey];
        if (!cache) continue;
        cache.lastRenderSignature = undefined;
    }
}

function invalidateVehicleDeployTimerHudViewerCache(pid: number): void {
    const cache = State.hudCache.vehicleDeployTimerCache[pid];
    if (!cache) return;
    cache.lastRenderSignature = undefined;
    cache.lastVisibleState = undefined;
    cache.lastCloseButtonVisible = undefined;
    cache.lastCloseButtonVisualState = undefined;
    cache.lastLiveTerminalChromeVisible = undefined;
    for (let i = 0; i < cache.rows.length; i++) {
        const row = cache.rows[i];
        if (!row) continue;
        row.lastVisibleState = undefined;
        row.lastPlayerNameVisible = undefined;
        row.lastSpawnButtonVisible = undefined;
        row.lastGroundButtonVisible = undefined;
        row.lastShowPlayerName = undefined;
        row.lastShowSpawnButton = undefined;
        row.lastShowGroundButton = undefined;
        row.lastSpawnButtonVisualState = undefined;
        row.lastGroundButtonVisualState = undefined;
        if (row.timer) {
            row.timer.lastVisibleState = undefined;
            row.timer.lastStatusMode = undefined;
            row.timer.lastDecile = undefined;
        }
    }
}

// Rebuilds vehicle HUD content while hidden, then reveals it only for viewers that currently own that surface.
function prebuildAndRevealVehicleDeployTimerHudForAllPlayers(): void {
    forEachValidPlayer((player, pid) => {
        prebuildVehicleDeployTimerHudHiddenForPlayer(player);

        if (State.players.readyDialogData[pid]?.dialogVisible) return;

        const shouldReveal = (
            !State.players.deployedByPid[pid]
            || isVehicleDeployTimerAdminOverrideEnabledForPid(pid)
            || isVehicleDeployLiveTerminalModeForPid(pid)
        );
        if (!shouldReveal) return;

        revealVehicleDeployTimerHudForPlayer(player);
    });
}


