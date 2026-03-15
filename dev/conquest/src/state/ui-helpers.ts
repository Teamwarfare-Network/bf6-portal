// @ts-nocheck
// Module: state/ui-helpers -- shared widget builder helpers and ready-dialog label refresh

function addOutlinedButton(
    buttonId: string,
    posX: number,
    posY: number,
    sizeX: number,
    sizeY: number,
    anchor: mod.UIAnchor,
    parent: mod.UIWidget,
    player: mod.Player,
    borderPadding: number = BUTTON_BORDER_PADDING
): mod.UIWidget | undefined {
    const borderId = `${buttonId}_BORDER`;
    const borderSizeX = sizeX + (borderPadding * 2);
    const borderSizeY = sizeY + (borderPadding * 2);

    mod.AddUIContainer(
        borderId,
        mod.CreateVector(posX, posY, 0),
        mod.CreateVector(borderSizeX, borderSizeY, 0),
        anchor,
        parent,
        true,
        0,
        COLOR_BUTTON_BORDER,
        BUTTON_BORDER_OPACITY,
        mod.UIBgFill.OutlineThin,
        mod.UIDepth.AboveGameUI,
        player
    );

    const border = mod.FindUIWidgetWithName(borderId, mod.GetUIRoot());
    const buttonParent = border ?? parent;

    mod.AddUIButton(
        buttonId,
        mod.CreateVector(0, 0, 0),
        mod.CreateVector(sizeX, sizeY, 0),
        mod.UIAnchor.Center,
        buttonParent,
        true,
        0,
        COLOR_BUTTON_BASE,
        BUTTON_OPACITY_BASE,
        mod.UIBgFill.Solid,
        true,
        COLOR_BUTTON_BASE,
        BUTTON_OPACITY_BASE,
        COLOR_BUTTON_BASE,
        BUTTON_OPACITY_BASE,
        COLOR_BUTTON_PRESSED,
        BUTTON_OPACITY_PRESSED,
        COLOR_BUTTON_SELECTED,
        BUTTON_OPACITY_SELECTED,
        COLOR_BUTTON_SELECTED,
        BUTTON_OPACITY_SELECTED,
        mod.UIDepth.AboveGameUI,
        player
    );

    const button = mod.FindUIWidgetWithName(buttonId, mod.GetUIRoot());
    if (button && border) {
        mod.SetUIWidgetParent(button, border);
    }

    return border ?? undefined;
}

// Rebuilds centered button text under a known parent, deleting any stale duplicate first.
function addCenteredButtonText(
    labelId: string,
    sizeX: number,
    sizeY: number,
    label: number | mod.Message,
    player: mod.Player,
    parent: mod.UIWidget,
    textSize?: number
): mod.UIWidget | undefined {
    const existing = safeFind(labelId);
    if (existing) mod.DeleteUIWidget(existing);

    const config: any = {
        name: labelId,
        type: "Text",
        playerId: player,
        position: [0, 0],
        size: [sizeX, sizeY],
        anchor: mod.UIAnchor.Center,
        visible: true,
        padding: 0,
        bgAlpha: 0,
        bgFill: mod.UIBgFill.None,
        textLabel: label,
        textColor: READY_DIALOG_BUTTON_TEXT_COLOR_RGB,
        textAlpha: 1,
        textAnchor: mod.UIAnchor.Center,
    };
    if (typeof textSize === "number") {
        config.textSize = textSize;
    }

    modlib.ParseUI(config);

    const widget = safeFind(labelId);
    if (widget) {
        mod.SetUIWidgetParent(widget, parent);
        mod.SetUIWidgetPosition(widget, mod.CreateVector(0, 0, 0));
        if (typeof textSize === "number") {
            mod.SetUITextSize(widget, textSize);
        }
    }
    return widget;
}

// Creates a right-aligned label and applies Ready Dialog text color defaults.
function addRightAlignedLabel(
    labelId: string,
    posX: number,
    posY: number,
    sizeX: number,
    sizeY: number,
    anchor: mod.UIAnchor,
    label: mod.Message,
    player: mod.Player,
    parent: mod.UIWidget,
    textSize: number
): mod.UIWidget | undefined {
    const widget = modlib.ParseUI({
        name: labelId,
        type: "Text",
        playerId: player,
        position: [posX, posY],
        size: [sizeX, sizeY],
        anchor: anchor,
        visible: true,
        padding: 0,
        bgAlpha: 0,
        bgFill: mod.UIBgFill.None,
        textLabel: label,
        textColor: [1, 1, 1],
        textAlpha: 1,
        textSize: textSize,
        textAnchor: mod.UIAnchor.CenterRight,
    });
    if (widget) {
        mod.SetUIWidgetParent(widget, parent);
        applyReadyDialogLabelTextColor(widget);
    }
    return widget;
}

// Applies the default Ready Dialog label color when the widget exists.
function applyReadyDialogLabelTextColor(widget?: mod.UIWidget): void {
    if (widget) mod.SetUITextColor(widget, READY_DIALOG_LABEL_TEXT_COLOR);
}

// Applies the default Admin Panel label color when the widget exists.
function applyAdminPanelLabelTextColor(widget?: mod.UIWidget): void {
    if (widget) mod.SetUITextColor(widget, ADMIN_PANEL_LABEL_TEXT_COLOR);
}

// Recreates all Ready Dialog button labels for a viewer after UI build/theme refresh.
function refreshReadyDialogButtonTextForPid(player: mod.Player, pid: number, baseContainer: mod.UIWidget): void {
    const refreshButtonTextIfPresent = (
        borderId: string,
        labelId: string,
        sizeX: number,
        sizeY: number,
        label: number | mod.Message,
        textSize?: number
    ): void => {
        const border = safeFind(borderId);
        if (!border) return;
        addCenteredButtonText(labelId, sizeX, sizeY, label, player, border ?? baseContainer, textSize);
    };

    refreshButtonTextIfPresent(
        UI_READY_DIALOG_BUTTON_SWAP_ID + pid + "_BORDER",
        UI_READY_DIALOG_BUTTON_SWAP_LABEL_ID + pid,
        READY_DIALOG_MAIN_BUTTON_WIDTH,
        READY_DIALOG_MAIN_BUTTON_HEIGHT,
        mod.stringkeys.twl.readyDialog.buttons.swapTeams
    );

    refreshButtonTextIfPresent(
        UI_READY_DIALOG_BUTTON_READY_ID + pid + "_BORDER",
        UI_READY_DIALOG_BUTTON_READY_LABEL_ID + pid,
        READY_DIALOG_MAIN_BUTTON_WIDTH,
        READY_DIALOG_MAIN_BUTTON_HEIGHT,
        mod.stringkeys.twl.readyDialog.buttons.ready
    );
    updateReadyToggleButtonForViewer(player, pid);

    refreshButtonTextIfPresent(
        UI_READY_DIALOG_BUTTON_CANCEL_ID + pid + "_BORDER",
        UI_READY_DIALOG_BUTTON_CANCEL_LABEL_ID + pid,
        READY_DIALOG_MAIN_BUTTON_WIDTH,
        READY_DIALOG_MAIN_BUTTON_HEIGHT,
        mod.stringkeys.twl.teamSwitch.buttons.cancel
    );

    for (const knobKey of [
        READY_DIALOG_CONFIG_GAME_KNOB_KEY,
        READY_DIALOG_CONFIG_MODE_SETTINGS_KNOB_KEY,
        READY_DIALOG_CONFIG_VEHICLES_KNOB_KEY,
        READY_DIALOG_CONFIG_PLAYERS_KNOB_KEY,
        ...READY_DIALOG_ALL_VEHICLE_KNOB_KEYS,
    ]) {
        refreshButtonTextIfPresent(
            UI_READY_DIALOG_MODE_GRID_KNOB_DEC_ID + knobKey + "_" + pid + "_BORDER",
            UI_READY_DIALOG_MODE_GRID_KNOB_DEC_LABEL_ID + knobKey + "_" + pid,
            READY_DIALOG_SMALL_BUTTON_WIDTH,
            READY_DIALOG_SMALL_BUTTON_HEIGHT,
            mod.stringkeys.twl.ui.left,
            14
        );
        refreshButtonTextIfPresent(
            UI_READY_DIALOG_MODE_GRID_KNOB_INC_ID + knobKey + "_" + pid + "_BORDER",
            UI_READY_DIALOG_MODE_GRID_KNOB_INC_LABEL_ID + knobKey + "_" + pid,
            READY_DIALOG_SMALL_BUTTON_WIDTH,
            READY_DIALOG_SMALL_BUTTON_HEIGHT,
            mod.stringkeys.twl.ui.right,
            14
        );
    }

    refreshButtonTextIfPresent(
        UI_READY_DIALOG_MODE_CONFIRM_ID + pid + "_BORDER",
        UI_READY_DIALOG_MODE_CONFIRM_LABEL_ID + pid,
        READY_DIALOG_CONFIRM_BUTTON_WIDTH,
        READY_DIALOG_SMALL_BUTTON_HEIGHT,
        mod.stringkeys.twl.readyDialog.confirmSettingsLabel,
        12
    );
}

// Safely resolve a Player by pid (mod.GetObjId(player)). Returns undefined if not found.
