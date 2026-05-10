// @ts-nocheck
// Module: ui/branding/top-left -- static top-left branding and status widgets

const TOP_LEFT_BASE_X = 5;
const TOP_LEFT_BASE_Y_OFFSET = 5;
const TOP_LEFT_BRANDING_WIDTH = 200;
const TOP_LEFT_STATUS_WIDTH = 134;
const TOP_LEFT_STATUS_HEIGHT = 30;
const TOP_LEFT_STATUS_GAP_X = TOP_LEFT_BASE_X;
const TOP_LEFT_STATUS_LINE_ONE_Y = 1;
const TOP_LEFT_STATUS_LINE_TWO_Y = 15;

// Deletes all widgets by one name so top-left roots cannot accumulate duplicate instances across rebuild churn.
function deleteAllBrandingWidgetsByName(name: string, maxPasses: number = 96): void {
    for (let i = 0; i < maxPasses; i++) {
        const widget = safeFind(name);
        if (!widget) return;
        try {
            mod.DeleteUIWidget(widget);
        } catch {
            return;
        }
    }
}

// Forces the branding root above the spawn-screen HUD layer without mutating child text widgets directly.
// The text widgets are authored as children of the box, so root depth is the only layering change needed.
function applyTopLeftBrandingDepthForPid(pid: number, root: mod.UIWidget | undefined): void {
    if (!root) return;
    try {
        mod.SetUIWidgetDepth(root, mod.UIDepth.AboveGameUI);
    } catch {
        // Keep branding build resilient if one depth write fails on a client/runtime variant.
        return;
    }
}

// Builds only the static branding panel in the top-left lane.
function buildConquestBrandingTopLeftWidgets(player: mod.Player, pid: number, refs: TopHudShellRefs): void {
    const topLeftBaseY = TOP_LEFT_BASE_Y_OFFSET + TOP_HUD_OFFSET_Y + CONQUEST_HUD_NON_CLOCK_SHIFT_Y;

    // Build-path cleanup for branding only (plus legacy settings root removal).
    deleteAllBrandingWidgetsByName(wn("Upper_Left_Container", pid));
    deleteAllBrandingWidgetsByName(wn("Upper_Left_Settings", pid));

    const upperLeft = safeParseUI({
        name: wn("Upper_Left_Container", pid),
        type: "Container",
        playerId: player,
        position: [TOP_LEFT_BASE_X, topLeftBaseY],
        size: [TOP_LEFT_BRANDING_WIDTH, 30],
        anchor: mod.UIAnchor.TopLeft,
        visible: false,
        padding: 1,
        bgColor: [0.251, 0.0941, 0.0667],
        bgAlpha: 0.5625,
        bgFill: mod.UIBgFill.Blur,
        children: [
            {
                name: wn("Upper_Left_Text", pid),
                type: "Text",
                position: [5, -5.5],
                size: [200, 17],
                anchor: mod.UIAnchor.CenterLeft,
                visible: true,
                padding: 0,
                bgColor: [0.8353, 0.9216, 0.9765],
                bgAlpha: 0,
                bgFill: mod.UIBgFill.Blur,
                textLabel: msg(mod.stringkeys.twl.hud.branding.title),
                textColor: [0.6784, 0.9922, 0.5255],
                textAlpha: 1,
                textSize: 9,
                textAnchor: mod.UIAnchor.Center,
            },
            {
                name: wn("Upper_Left_Text_2", pid),
                type: "Text",
                position: [7.25, 12.5],
                size: [200, 16.5],
                anchor: mod.UIAnchor.TopLeft,
                visible: true,
                padding: 0,
                bgColor: [0.2, 0.2, 0.2],
                bgAlpha: 0,
                bgFill: mod.UIBgFill.None,
                textLabel: msg(mod.stringkeys.twl.hud.branding.subtitle),
                textColor: [0.6784, 0.9922, 0.5255],
                textAlpha: 1,
                textSize: 9,
                textAnchor: mod.UIAnchor.Center,
            },
        ],
    });
    if (upperLeft) {
        refs.roots.push(upperLeft);
        refs.upperLeftContainer = upperLeft;
        applyTopLeftBrandingDepthForPid(pid, upperLeft);
    }
}

// Builds one static top-left status lane using fixed absolute placement for box + state/ready text lines.
function buildConquestStaticStatusLaneWidgets(player: mod.Player, pid: number, refs: TopHudShellRefs): void {
    const topLeftBaseY = TOP_LEFT_BASE_Y_OFFSET + TOP_HUD_OFFSET_Y + CONQUEST_HUD_NON_CLOCK_SHIFT_Y;
    const statusRootName = wn("TwlConquestStatusDockRoot", pid);
    const statusPrimaryTextName = wn("TwlConquestStatusDockState", pid);
    const statusSecondaryTextName = wn("TwlConquestStatusDockReady", pid);

    // Hard-cut cleanup: remove all current + prior status lane names before creating one authoritative static lane.
    deleteAllBrandingWidgetsByName(statusRootName);
    deleteAllBrandingWidgetsByName(statusPrimaryTextName);
    deleteAllBrandingWidgetsByName(statusSecondaryTextName);
    deleteAllBrandingWidgetsByName(wn("TwlConquestHudStatusPanelRoot", pid));
    deleteAllBrandingWidgetsByName(wn("TwlConquestHudStatusPanelStateText", pid));
    deleteAllBrandingWidgetsByName(wn("TwlConquestHudStatusPanelReadyText", pid));
    deleteAllBrandingWidgetsByName(wn("TwlConquestStatusStaticBox", pid));
    deleteAllBrandingWidgetsByName(wn("TwlConquestStatusStaticText", pid));
    deleteAllBrandingWidgetsByName(wn("TwlConquestHudStatusLaneRoot", pid));
    deleteAllBrandingWidgetsByName(wn("TwlConquestHudStatusLanePrimaryText", pid));
    deleteAllBrandingWidgetsByName(wn("TwlConquestHudStatusLaneSecondaryText", pid));
    deleteAllBrandingWidgetsByName(wn("TwlConquestHudStatusContainer", pid));
    deleteAllBrandingWidgetsByName(wn("TwlConquestHudStatusStateText", pid));
    deleteAllBrandingWidgetsByName(wn("TwlConquestHudStatusReadyText", pid));
    deleteAllBrandingWidgetsByName(wn("TwlConquestStatusPanel", pid));
    deleteAllBrandingWidgetsByName(wn("TwlConquestStatusStateLine", pid));
    deleteAllBrandingWidgetsByName(wn("TwlConquestStatusReadyLine", pid));
    deleteAllBrandingWidgetsByName(wn("Upper_Left_Status", pid));
    deleteAllBrandingWidgetsByName(wn("Upper_Left_Status_StateText", pid));
    deleteAllBrandingWidgetsByName(wn("Upper_Left_Status_ReadyText", pid));
    deleteAllBrandingWidgetsByName(wn("RoundStateRoot", pid));
    deleteAllBrandingWidgetsByName(wn("RoundStateText", pid));
    deleteAllBrandingWidgetsByName(wn("PlayersReadyText", pid));
    deleteAllBrandingWidgetsByName(wn("Container_ReadyStatus", pid));
    deleteAllBrandingWidgetsByName(wn("ReadyStatusText", pid));

    const statusX = TOP_LEFT_BASE_X + TOP_LEFT_BRANDING_WIDTH + TOP_LEFT_STATUS_GAP_X;
    const statusY = topLeftBaseY;
    const statusLane = safeParseUI({
        name: statusRootName,
        type: "Container",
        playerId: player,
        position: [statusX, statusY],
        size: [TOP_LEFT_STATUS_WIDTH, TOP_LEFT_STATUS_HEIGHT],
        anchor: mod.UIAnchor.TopLeft,
        visible: false,
        padding: 1,
        bgColor: [0.251, 0.0941, 0.0667],
        bgAlpha: 0.5625,
        bgFill: mod.UIBgFill.Blur,
    });
    const statusPrimaryText = safeParseUI({
        name: statusPrimaryTextName,
        type: "Text",
        playerId: player,
        position: [statusX, statusY + TOP_LEFT_STATUS_LINE_ONE_Y],
        size: [TOP_LEFT_STATUS_WIDTH, 15],
        anchor: mod.UIAnchor.TopLeft,
        visible: false,
        padding: 0,
        bgAlpha: 0,
        bgFill: mod.UIBgFill.None,
        textLabel: msg(mod.stringkeys.twl.hud.roundStateNotReady),
        textColor: [0.6784, 0.9922, 0.5255],
        textAlpha: 1,
        textSize: 9,
        textAnchor: mod.UIAnchor.Center,
    });
    const statusSecondaryText = safeParseUI({
        name: statusSecondaryTextName,
        type: "Text",
        playerId: player,
        position: [statusX, statusY + TOP_LEFT_STATUS_LINE_TWO_Y],
        size: [TOP_LEFT_STATUS_WIDTH, 15],
        anchor: mod.UIAnchor.TopLeft,
        visible: false,
        padding: 0,
        bgAlpha: 0,
        bgFill: mod.UIBgFill.None,
        textLabel: msg(mod.stringkeys.twl.hud.playersReadyFormat, 0, 0),
        textColor: [1, 0.9059, 0.3373],
        textAlpha: 1,
        textSize: 9,
        textAnchor: mod.UIAnchor.Center,
    });

    if (statusLane) {
        refs.roots.push(statusLane);
        try {
            mod.SetUIWidgetDepth(statusLane, mod.UIDepth.AboveGameUI);
        } catch {
            // Keep HUD build resilient if one static layout write fails.
        }
    }
    if (statusPrimaryText) {
        refs.roots.push(statusPrimaryText);
        try {
            mod.SetUIWidgetDepth(statusPrimaryText, mod.UIDepth.AboveGameUI);
            mod.SetUIWidgetVisible(statusPrimaryText, false);
        } catch {
            // Keep HUD build resilient if one static layout write fails.
        }
    }
    if (statusSecondaryText) {
        refs.roots.push(statusSecondaryText);
        try {
            mod.SetUIWidgetDepth(statusSecondaryText, mod.UIDepth.AboveGameUI);
            mod.SetUIWidgetVisible(statusSecondaryText, false);
        } catch {
            // Keep HUD build resilient if one static layout write fails.
        }
    }
    refs.upperLeftStatusContainer = statusLane;
    refs.upperLeftStatusStateText = statusPrimaryText;
    refs.upperLeftStatusReadyText = statusSecondaryText;
}


