// @ts-nocheck
// Module: state/ui-helpers -- shared widget builder helpers and ready-dialog label refresh

// Compact widget name factory. Joins prefix, pid, and optional parts with underscores.
function wn(prefix: string, pid: number, ...parts: (number | string)[]): string {
    let name = prefix + "_" + pid;
    for (let i = 0; i < parts.length; i++) {
        name += "_" + parts[i];
    }
    return name;
}

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
        mod.EnableUIButtonEvent(button, mod.UIButtonEvent.ButtonDown, true);
        mod.EnableUIButtonEvent(button, mod.UIButtonEvent.ButtonUp, true);
        mod.SetUIButtonEnabled(button, true);
    }

    return border ?? undefined;
}

// Normalizes all Text-node labels before they reach modlib.ParseUI so build-time
// widget creation cannot leak raw keys or nullish labels into engine SetUITextLabel.
function normalizeParseUITextConfigNode(node: any): any {
    if (!node) return node;
    if (Array.isArray(node)) {
        for (let i = 0; i < node.length; i++) {
            node[i] = normalizeParseUITextConfigNode(node[i]);
        }
        return node;
    }
    if (typeof node !== "object") return node;

    if (node.type === "Text") {
        const label = node.textLabel;
        if (label === undefined || label === null) {
            node.textLabel = mod.Message(mod.stringkeys.twl.hud.readyText);
        } else if (typeof label === "number") {
            node.textLabel = mod.Message(label);
        }
    }

    if (Array.isArray(node.children)) {
        node.children = normalizeParseUITextConfigNode(node.children);
    }

    return node;
}

// One build-boundary wrapper for all ParseUI usage so text widget config is
// normalized consistently before modlib hands it to engine UI calls.
function safeParseUI(config: any): any {
    return modlib.ParseUI(normalizeParseUITextConfigNode(config));
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
        textLabel: typeof label === "number" ? mod.Message(label) : label,
        textColor: READY_DIALOG_BUTTON_TEXT_COLOR_RGB,
        textAlpha: 1,
        textAnchor: mod.UIAnchor.Center,
    };
    if (typeof textSize === "number") {
        config.textSize = textSize;
    }

    safeParseUI(config);

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

function addReadyDialogText(
    widgetId: string,
    posX: number,
    posY: number,
    sizeX: number,
    sizeY: number,
    anchor: mod.UIAnchor,
    textAnchor: mod.UIAnchor,
    label: number | mod.Message,
    player: mod.Player,
    parent: mod.UIWidget,
    textSize?: number,
    visible: boolean = true,
    textColor: mod.Vector = READY_DIALOG_LABEL_TEXT_COLOR
): mod.UIWidget | undefined {
    let widget = safeFind(widgetId);
    const existed = !!widget;
    if (!widget) {
        const config: any = {
            name: widgetId,
            type: "Text",
            playerId: player,
            position: [0, 0],
            size: [sizeX, sizeY],
            anchor,
            visible: false,
            padding: 0,
            bgAlpha: 0,
            bgFill: mod.UIBgFill.None,
            textLabel: typeof label === "number" ? mod.Message(label) : label,
            textColor: [1, 1, 1],
            textAlpha: 1,
            textAnchor,
        };
        if (typeof textSize === "number") {
            config.textSize = textSize;
        }
        const parsed = safeParseUI(config);
        widget = parsed ?? safeFind(widgetId);
    }

    if (!widget) return undefined;

    safeSetUIWidgetParent(widget, parent);
    try {
        mod.SetUIWidgetAnchor(widget, anchor);
    } catch {}
    safeSetUIWidgetPosition(widget, mod.CreateVector(posX, posY, 0));
    safeSetUIWidgetSize(widget, mod.CreateVector(sizeX, sizeY, 0));
    if (existed) {
        safeSetUITextLabel(widget, typeof label === "number" ? mod.Message(label) : label);
    }
    try {
        mod.SetUITextAnchor(widget, textAnchor);
    } catch {}
    if (typeof textSize === "number") {
        try {
            mod.SetUITextSize(widget, textSize);
        } catch {}
    }
    safeSetUIWidgetBgAlpha(widget, 0);
    safeSetUITextColor(widget, textColor);
    safeSetUITextAlpha(widget, 1);
    safeSetUIWidgetVisible(widget, visible);
    return widget;
}

function addReadyDialogCenteredText(
    labelId: string,
    sizeX: number,
    sizeY: number,
    label: number | mod.Message,
    player: mod.Player,
    parent: mod.UIWidget,
    textSize?: number,
    visible: boolean = true,
    textColor: mod.Vector = COLOR_WHITE
): mod.UIWidget | undefined {
    return addReadyDialogText(
        labelId,
        0,
        0,
        sizeX,
        sizeY,
        mod.UIAnchor.Center,
        mod.UIAnchor.Center,
        label,
        player,
        parent,
        textSize,
        visible,
        textColor
    );
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
    const widget = safeParseUI({
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

// Builds one stable signature for the cached ready-dialog button labels for a viewer.
// Static labels do not need repeated writes; only the ready-toggle state changes dynamically.
function buildReadyDialogButtonSignature(pid: number): string {
    return `${pid}|ready:${State.players.readyByPid[pid] ? 1 : 0}`;
}

// Refreshes cached Ready Dialog button labels for a viewer after UI build/theme refresh.
function refreshReadyDialogButtonTextForPid(player: mod.Player, pid: number, baseContainer: mod.UIWidget): void {
    const state = State.players.readyDialogData[pid];
    if (!state) return;
    const signature = buildReadyDialogButtonSignature(pid);
    if (state.lastButtonSignature === signature) return;

    const refreshButtonTextIfPresent = (
        buttonId: string,
        borderId: string,
        labelId: string,
        sizeX: number,
        sizeY: number,
        label: number | mod.Message,
        textSize?: number
    ): void => {
        const border = safeFind(borderId);
        if (!border) return;
        const button = safeFind(buttonId);
        if (button) {
            mod.EnableUIButtonEvent(button, mod.UIButtonEvent.ButtonDown, true);
            mod.EnableUIButtonEvent(button, mod.UIButtonEvent.ButtonUp, true);
            mod.SetUIButtonEnabled(button, true);
        }
        const existing = safeFind(labelId);
        if (existing) {
            safeSetUITextLabel(existing, typeof label === "number" ? mod.Message(label) : label);
            mod.SetUIWidgetVisible(existing, true);
            if (typeof textSize === "number") {
                mod.SetUITextSize(existing, textSize);
            }
            return;
        }
        addCenteredButtonText(labelId, sizeX, sizeY, label, player, border ?? baseContainer, textSize);
    };

    refreshButtonTextIfPresent(
        UI_READY_DIALOG_BUTTON_SWAP_ID + pid,
        UI_READY_DIALOG_BUTTON_SWAP_ID + pid + "_BORDER",
        UI_READY_DIALOG_BUTTON_SWAP_LABEL_ID + pid,
        READY_DIALOG_MAIN_BUTTON_WIDTH,
        READY_DIALOG_MAIN_BUTTON_HEIGHT,
        mod.stringkeys.twl.readyDialog.buttons.swapTeams
    );

    refreshButtonTextIfPresent(
        UI_READY_DIALOG_BUTTON_READY_ID + pid,
        UI_READY_DIALOG_BUTTON_READY_ID + pid + "_BORDER",
        UI_READY_DIALOG_BUTTON_READY_LABEL_ID + pid,
        READY_DIALOG_MAIN_BUTTON_WIDTH,
        READY_DIALOG_MAIN_BUTTON_HEIGHT,
        mod.stringkeys.twl.readyDialog.buttons.ready
    );
    updateReadyToggleButtonForViewer(player, pid);

    refreshButtonTextIfPresent(
        UI_READY_DIALOG_BUTTON_CANCEL_ID + pid,
        UI_READY_DIALOG_BUTTON_CANCEL_ID + pid + "_BORDER",
        UI_READY_DIALOG_BUTTON_CANCEL_LABEL_ID + pid,
        READY_DIALOG_MAIN_BUTTON_WIDTH,
        READY_DIALOG_MAIN_BUTTON_HEIGHT,
        mod.stringkeys.twl.teamSwitch.buttons.cancel
    );

    for (const knobKey of getReadyDialogModeGridAllKnobKeys()) {
        if (isReadyDialogModeGridPlaceholderKnobKey(knobKey)) continue;
        refreshButtonTextIfPresent(
            UI_READY_DIALOG_MODE_GRID_KNOB_DEC_ID + knobKey + "_" + pid,
            UI_READY_DIALOG_MODE_GRID_KNOB_DEC_ID + knobKey + "_" + pid + "_BORDER",
            UI_READY_DIALOG_MODE_GRID_KNOB_DEC_LABEL_ID + knobKey + "_" + pid,
            READY_DIALOG_SMALL_BUTTON_WIDTH,
            READY_DIALOG_SMALL_BUTTON_HEIGHT,
            mod.stringkeys.twl.ui.left,
            14
        );
        refreshButtonTextIfPresent(
            UI_READY_DIALOG_MODE_GRID_KNOB_INC_ID + knobKey + "_" + pid,
            UI_READY_DIALOG_MODE_GRID_KNOB_INC_ID + knobKey + "_" + pid + "_BORDER",
            UI_READY_DIALOG_MODE_GRID_KNOB_INC_LABEL_ID + knobKey + "_" + pid,
            READY_DIALOG_SMALL_BUTTON_WIDTH,
            READY_DIALOG_SMALL_BUTTON_HEIGHT,
            mod.stringkeys.twl.ui.right,
            14
        );
    }

    refreshButtonTextIfPresent(
        UI_READY_DIALOG_MODE_CONFIRM_ID + pid,
        UI_READY_DIALOG_MODE_CONFIRM_ID + pid + "_BORDER",
        UI_READY_DIALOG_MODE_CONFIRM_LABEL_ID + pid,
        READY_DIALOG_CONFIRM_BUTTON_WIDTH,
        READY_DIALOG_SMALL_BUTTON_HEIGHT,
        mod.stringkeys.twl.readyDialog.confirmSettingsLabel,
        12
    );

    state.lastButtonSignature = signature;
}

// Safely resolve a Player by pid (mod.GetObjId(player)). Returns undefined if not found.


