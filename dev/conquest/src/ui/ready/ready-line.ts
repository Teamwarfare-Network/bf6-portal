// @ts-nocheck
// Module: ui/ready/ready-line -- top-center help and ready status containers

type ConquestTopCenterAuxLayout = {
    helpContainerX: number;
    helpContainerY: number;
    helpContainerWidth: number;
    helpContainerHeight: number;
    helpText3OffsetY: number;
    helpText3Height: number;
    helpTextOffsetY: number;
    helpTextHeight: number;
    helpText2OffsetY: number;
    helpText2Height: number;
    readyContainerX: number;
    readyContainerY: number;
    readyContainerWidth: number;
    readyContainerHeight: number;
    readyTextOffsetY: number;
    readyTextHeight: number;
};

// Deletes all widgets by one name so top-center helper containers stay single-instance across rebuild retries.
function deleteAllTopCenterAuxWidgetsByName(name: string, maxPasses: number = 96): void {
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

function buildConquestTopCenterAuxWidgets(
    player: mod.Player,
    pid: number,
    refs: TopHudShellRefs,
    layout: ConquestTopCenterAuxLayout
): void {
    const TOP_PANEL_Y = 47.73;
    const PANEL_WIDTH = 99.01;
    const PANEL_HEIGHT = 28.11;

    // Build-path cleanup: ensure stale aux roots from failed/partial rebuilds cannot shadow the active widgets.
    deleteAllTopCenterAuxWidgetsByName(wn("ConquestTopCenterAuxRoot", pid));
    deleteAllTopCenterAuxWidgetsByName(wn("Container_HelpText", pid));
    deleteAllTopCenterAuxWidgetsByName(wn("HelpText3", pid));
    deleteAllTopCenterAuxWidgetsByName(wn("HelpText", pid));
    deleteAllTopCenterAuxWidgetsByName(wn("HelpText2", pid));
    deleteAllTopCenterAuxWidgetsByName(wn("Container_ReadyStatus", pid));
    deleteAllTopCenterAuxWidgetsByName(wn("ReadyStatusText", pid));

    const mid = safeParseUI({
        name: wn("ConquestTopCenterAuxRoot", pid),
        type: "Container",
        playerId: player,
        position: [0, TOP_PANEL_Y],
        size: [PANEL_WIDTH, PANEL_HEIGHT],
        anchor: mod.UIAnchor.TopCenter,
        visible: false,
        padding: 0,
        bgAlpha: 0,
        bgFill: mod.UIBgFill.None,
        children: [
            {
                name: wn("Container_HelpText", pid),
                type: "Container",
                position: [layout.helpContainerX, layout.helpContainerY],
                size: [layout.helpContainerWidth, layout.helpContainerHeight],
                anchor: mod.UIAnchor.TopLeft,
                // Start hidden; authoritative visibility is applied by hud/help-visibility.ts.
                visible: false,
                padding: 0,
                bgColor: [1, 0.9882, 0.6118],
                bgAlpha: 1,
                bgFill: mod.UIBgFill.Solid,
                children: [
                    {
                        name: wn("HelpText3", pid),
                        type: "Text",
                        position: [0, layout.helpText3OffsetY],
                        size: [layout.helpContainerWidth, layout.helpText3Height],
                        anchor: mod.UIAnchor.TopLeft,
                        visible: true,
                        padding: 0,
                        bgColor: [0.2, 0.2, 0.2],
                        bgAlpha: 1,
                        bgFill: mod.UIBgFill.None,
                        textLabel: msg(mod.stringkeys.twl.hud.helpText3),
                        textColor: [0.251, 0.0941, 0.0667],
                        textAlpha: 1,
                        textSize: 12,
                        textAnchor: mod.UIAnchor.Center,
                    },
                    {
                        name: wn("HelpText", pid),
                        type: "Text",
                        position: [0, layout.helpTextOffsetY],
                        size: [layout.helpContainerWidth, layout.helpTextHeight],
                        anchor: mod.UIAnchor.TopLeft,
                        visible: true,
                        padding: 0,
                        bgColor: [0.2, 0.2, 0.2],
                        bgAlpha: 1,
                        bgFill: mod.UIBgFill.None,
                        textLabel: msg(mod.stringkeys.twl.hud.helpText),
                        textColor: [0.251, 0.0941, 0.0667],
                        textAlpha: 1,
                        textSize: 12,
                        textAnchor: mod.UIAnchor.Center,
                    },
                    {
                        name: wn("HelpText2", pid),
                        type: "Text",
                        position: [0, layout.helpText2OffsetY],
                        size: [layout.helpContainerWidth, layout.helpText2Height],
                        anchor: mod.UIAnchor.TopLeft,
                        visible: true,
                        padding: 0,
                        bgColor: [0.2, 0.2, 0.2],
                        bgAlpha: 1,
                        bgFill: mod.UIBgFill.None,
                        textLabel: msg(mod.stringkeys.twl.hud.helpText2),
                        textColor: [0.251, 0.0941, 0.0667],
                        textAlpha: 1,
                        textSize: 12,
                        textAnchor: mod.UIAnchor.Center,
                    },
                ],
            },
        ],
    });
    if (mid) {
        refs.roots.push(mid);
        refs.topCenterAuxRoot = mid;
    }
}


