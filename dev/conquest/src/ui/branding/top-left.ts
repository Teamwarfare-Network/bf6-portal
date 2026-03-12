// @ts-nocheck
// Module: ui/branding/top-left -- static top-left branding and settings summary widgets

// Deletes all widgets by one name so top-left branding roots cannot accumulate duplicate instances across rebuild churn.
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

function buildConquestBrandingTopLeftWidgets(player: mod.Player, pid: number, refs: HudRefs): void {
    const TOP_LEFT_BASE_X = 5;
    const TOP_LEFT_BASE_Y = 5 + TOP_HUD_OFFSET_Y + CONQUEST_HUD_NON_CLOCK_SHIFT_Y;
    const BRANDING_WIDTH = 200;

    // Build-path cleanup: force single-instance naming for branding/status stacks before ParseUI creates fresh roots.
    deleteAllBrandingWidgetsByName(`Upper_Left_Container_${pid}`);
    deleteAllBrandingWidgetsByName(`Upper_Left_Status_${pid}`);
    deleteAllBrandingWidgetsByName(`Upper_Left_Settings_${pid}`);

    const upperLeft = modlib.ParseUI({
        name: `Upper_Left_Container_${pid}`,
        type: "Container",
        playerId: player,
        position: [TOP_LEFT_BASE_X, TOP_LEFT_BASE_Y],
        size: [BRANDING_WIDTH, 30],
        anchor: mod.UIAnchor.TopLeft,
        visible: true,
        padding: 1,
        bgColor: [0.251, 0.0941, 0.0667],
        bgAlpha: 0.5625,
        bgFill: mod.UIBgFill.Blur,
        children: [
            {
                name: `Upper_Left_Text_${pid}`,
                type: "Text",
                position: [5, -5.5],
                size: [200, 17],
                anchor: mod.UIAnchor.CenterLeft,
                visible: true,
                padding: 0,
                bgColor: [0.8353, 0.9216, 0.9765],
                bgAlpha: 0,
                bgFill: mod.UIBgFill.Blur,
                textLabel: mod.stringkeys.twl.hud.branding.title,
                textColor: [0.6784, 0.9922, 0.5255],
                textAlpha: 1,
                textSize: 9,
                textAnchor: mod.UIAnchor.Center,
            },
            {
                name: `Upper_Left_Text_2_${pid}`,
                type: "Text",
                position: [7.25, 12.5],
                size: [200, 16.5],
                anchor: mod.UIAnchor.TopLeft,
                visible: true,
                padding: 0,
                bgColor: [0.2, 0.2, 0.2],
                bgAlpha: 0,
                bgFill: mod.UIBgFill.None,
                textLabel: mod.stringkeys.twl.hud.branding.subtitle,
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
    }

    const statusStack = modlib.ParseUI({
        name: `Upper_Left_Status_${pid}`,
        type: "Container",
        playerId: player,
        position: [TOP_LEFT_BASE_X + BRANDING_WIDTH + 8, TOP_LEFT_BASE_Y],
        size: [206, 30],
        anchor: mod.UIAnchor.TopLeft,
        visible: true,
        padding: 1,
        bgColor: [0.251, 0.0941, 0.0667],
        bgAlpha: 0.5625,
        bgFill: mod.UIBgFill.Blur,
        children: [
            {
                name: `Upper_Left_Status_StateText_${pid}`,
                type: "Text",
                position: [0, 1],
                size: [206, 14],
                anchor: mod.UIAnchor.TopLeft,
                visible: true,
                padding: 0,
                bgAlpha: 0,
                bgFill: mod.UIBgFill.None,
                textLabel: mod.stringkeys.twl.hud.roundStateNotReady,
                textColor: [0.95, 0.95, 0.95],
                textAlpha: 1,
                textSize: 11,
                textAnchor: mod.UIAnchor.Center,
            },
            {
                name: `Upper_Left_Status_ReadyText_${pid}`,
                type: "Text",
                position: [0, 15],
                size: [206, 15],
                anchor: mod.UIAnchor.TopLeft,
                visible: false,
                padding: 0,
                bgAlpha: 0,
                bgFill: mod.UIBgFill.None,
                textLabel: "",
                textColor: [1, 0.9059, 0.3373],
                textAlpha: 1,
                textSize: 11,
                textAnchor: mod.UIAnchor.Center,
            },
        ],
    });
    if (statusStack) {
        refs.roots.push(statusStack);
        refs.upperLeftStatusContainer = statusStack;
        refs.upperLeftStatusStateText = safeFind(`Upper_Left_Status_StateText_${pid}`);
        refs.upperLeftStatusReadyText = safeFind(`Upper_Left_Status_ReadyText_${pid}`);
    }

    const SETTINGS_CONTAINER_X = TOP_LEFT_BASE_X;
    const SETTINGS_CONTAINER_Y = TOP_LEFT_BASE_Y + 30 + 6;
    const SETTINGS_LINE_HEIGHT = 12;
    const SETTINGS_TEXT_WIDTH = BRANDING_WIDTH;
    const SETTINGS_TEXT_SIZE = 9;
    const SETTINGS_TEXT_COLOR: [number, number, number] = [0.6784, 0.9922, 0.5255];

    const settingsSummary = modlib.ParseUI({
        name: `Upper_Left_Settings_${pid}`,
        type: "Container",
        playerId: player,
        position: [SETTINGS_CONTAINER_X, SETTINGS_CONTAINER_Y],
        size: [SETTINGS_TEXT_WIDTH, SETTINGS_LINE_HEIGHT * 6],
        anchor: mod.UIAnchor.TopLeft,
        visible: true,
        padding: 1,
        bgColor: [0.251, 0.0941, 0.0667],
        bgAlpha: 0.5625,
        bgFill: mod.UIBgFill.Blur,
        children: [
            {
                name: `Settings_GameMode_${pid}`,
                type: "Text",
                position: [6, 0],
                size: [SETTINGS_TEXT_WIDTH - 12, 16],
                anchor: mod.UIAnchor.TopLeft,
                visible: true,
                padding: 0,
                bgAlpha: 0,
                bgFill: mod.UIBgFill.None,
                textLabel: mod.Message(STR_HUD_SETTINGS_GAME_MODE_FORMAT, STR_HUD_SETTINGS_GAME_MODE_DEFAULT),
                textColor: SETTINGS_TEXT_COLOR,
                textAlpha: 1,
                textSize: SETTINGS_TEXT_SIZE,
                textAnchor: mod.UIAnchor.TopLeft,
            },
            {
                name: `Settings_Ceiling_${pid}`,
                type: "Text",
                position: [6, SETTINGS_LINE_HEIGHT],
                size: [SETTINGS_TEXT_WIDTH - 12, 16],
                anchor: mod.UIAnchor.TopLeft,
                visible: true,
                padding: 0,
                bgAlpha: 0,
                bgFill: mod.UIBgFill.None,
                textLabel: mod.Message(STR_HUD_SETTINGS_AIRCRAFT_CEILING_FORMAT, STR_READY_DIALOG_AIRCRAFT_CEILING_VANILLA),
                textColor: SETTINGS_TEXT_COLOR,
                textAlpha: 1,
                textSize: SETTINGS_TEXT_SIZE,
                textAnchor: mod.UIAnchor.TopLeft,
            },
            {
                name: `Settings_VehiclesT1_${pid}`,
                type: "Text",
                position: [6, SETTINGS_LINE_HEIGHT * 2],
                size: [SETTINGS_TEXT_WIDTH - 12, 16],
                anchor: mod.UIAnchor.TopLeft,
                visible: true,
                padding: 0,
                bgAlpha: 0,
                bgFill: mod.UIBgFill.None,
                textLabel: mod.Message(
                    STR_HUD_SETTINGS_VEHICLES_TEAM_FORMAT,
                    getTeamNameKey(TeamID.Team1),
                    STR_HUD_SETTINGS_VALUE_DEFAULT
                ),
                textColor: SETTINGS_TEXT_COLOR,
                textAlpha: 1,
                textSize: SETTINGS_TEXT_SIZE,
                textAnchor: mod.UIAnchor.TopLeft,
            },
            {
                name: `Settings_VehiclesT2_${pid}`,
                type: "Text",
                position: [6, SETTINGS_LINE_HEIGHT * 3],
                size: [SETTINGS_TEXT_WIDTH - 12, 16],
                anchor: mod.UIAnchor.TopLeft,
                visible: true,
                padding: 0,
                bgAlpha: 0,
                bgFill: mod.UIBgFill.None,
                textLabel: mod.Message(
                    STR_HUD_SETTINGS_VEHICLES_TEAM_FORMAT,
                    getTeamNameKey(TeamID.Team2),
                    STR_HUD_SETTINGS_VALUE_DEFAULT
                ),
                textColor: SETTINGS_TEXT_COLOR,
                textAlpha: 1,
                textSize: SETTINGS_TEXT_SIZE,
                textAnchor: mod.UIAnchor.TopLeft,
            },
            {
                name: `Settings_VehiclesMatchup_${pid}`,
                type: "Text",
                position: [6, SETTINGS_LINE_HEIGHT * 4],
                size: [SETTINGS_TEXT_WIDTH - 12, 16],
                anchor: mod.UIAnchor.TopLeft,
                visible: true,
                padding: 0,
                bgAlpha: 0,
                bgFill: mod.UIBgFill.None,
                textLabel: mod.Message(STR_HUD_SETTINGS_VEHICLES_MATCHUP_FORMAT, 1, 1),
                textColor: SETTINGS_TEXT_COLOR,
                textAlpha: 1,
                textSize: SETTINGS_TEXT_SIZE,
                textAnchor: mod.UIAnchor.TopLeft,
            },
            {
                name: `Settings_Players_${pid}`,
                type: "Text",
                position: [6, SETTINGS_LINE_HEIGHT * 5],
                size: [SETTINGS_TEXT_WIDTH - 12, 16],
                anchor: mod.UIAnchor.TopLeft,
                visible: true,
                padding: 0,
                bgAlpha: 0,
                bgFill: mod.UIBgFill.None,
                textLabel: mod.Message(STR_HUD_SETTINGS_PLAYERS_FORMAT, 1, 1),
                textColor: SETTINGS_TEXT_COLOR,
                textAlpha: 1,
                textSize: SETTINGS_TEXT_SIZE,
                textAnchor: mod.UIAnchor.TopLeft,
            },
        ],
    });
    if (settingsSummary) refs.roots.push(settingsSummary);
}
