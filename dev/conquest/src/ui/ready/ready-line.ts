// @ts-nocheck
// Module: ui/ready/ready-line -- top-center help and ready status containers

type ConquestTopCenterAuxLayout = {
    helpContainerX: number;
    helpContainerY: number;
    helpContainerWidth: number;
    helpContainerHeight: number;
    helpTextOffsetY: number;
    helpTextHeight: number;
    readyContainerX: number;
    readyContainerY: number;
    readyContainerWidth: number;
    readyContainerHeight: number;
    readyTextOffsetY: number;
    readyTextHeight: number;
};

function buildConquestTopCenterAuxWidgets(
    player: mod.Player,
    pid: number,
    refs: HudRefs,
    layout: ConquestTopCenterAuxLayout
): void {
    const TOP_PANEL_Y = 47.73;
    const PANEL_WIDTH = 99.01;
    const PANEL_HEIGHT = 28.11;

    const mid = modlib.ParseUI({
        name: `ConquestTopCenterAuxRoot_${pid}`,
        type: "Container",
        playerId: player,
        position: [0, TOP_PANEL_Y],
        size: [PANEL_WIDTH, PANEL_HEIGHT],
        anchor: mod.UIAnchor.TopCenter,
        visible: true,
        padding: 0,
        bgColor: [0.0314, 0.0431, 0.0431],
        bgAlpha: 0.75,
        bgFill: mod.UIBgFill.Blur,
        children: [
            {
                name: `Container_HelpText_${pid}`,
                type: "Container",
                position: [layout.helpContainerX, layout.helpContainerY],
                size: [layout.helpContainerWidth, layout.helpContainerHeight],
                anchor: mod.UIAnchor.TopLeft,
                visible: true,
                padding: 0,
                bgColor: [1, 0.9882, 0.6118],
                bgAlpha: 1,
                bgFill: mod.UIBgFill.Solid,
                children: [
                    {
                        name: `HelpText_${pid}`,
                        type: "Text",
                        position: [0, layout.helpTextOffsetY],
                        size: [layout.helpContainerWidth, layout.helpTextHeight],
                        anchor: mod.UIAnchor.TopLeft,
                        visible: true,
                        padding: 0,
                        bgColor: [0.2, 0.2, 0.2],
                        bgAlpha: 1,
                        bgFill: mod.UIBgFill.None,
                        textLabel: mod.stringkeys.twl.hud.helpText,
                        textColor: [0.251, 0.0941, 0.0667],
                        textAlpha: 1,
                        textSize: 12,
                        textAnchor: mod.UIAnchor.Center,
                    },
                ],
            },
            {
                name: `Container_ReadyStatus_${pid}`,
                type: "Container",
                position: [layout.readyContainerX, layout.readyContainerY],
                size: [layout.readyContainerWidth, layout.readyContainerHeight],
                anchor: mod.UIAnchor.TopLeft,
                visible: false,
                padding: 0,
                bgAlpha: 0,
                bgFill: mod.UIBgFill.None,
                children: [
                    {
                        name: `ReadyStatusText_${pid}`,
                        type: "Text",
                        position: [0, layout.readyTextOffsetY],
                        size: [layout.readyContainerWidth, layout.readyTextHeight],
                        anchor: mod.UIAnchor.TopLeft,
                        visible: true,
                        padding: 0,
                        bgAlpha: 0,
                        bgFill: mod.UIBgFill.None,
                        textLabel: mod.stringkeys.twl.hud.readyText,
                        textColor: [0.6784, 0.9922, 0.5255],
                        textAlpha: 1,
                        textSize: 12,
                        textAnchor: mod.UIAnchor.Center,
                    },
                ],
            },
        ],
    });
    if (mid) refs.roots.push(mid);
}
