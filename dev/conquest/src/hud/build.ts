// @ts-nocheck
// Module: hud/build -- HUD root ensure/build and per-player cache init

//#region -------------------- HUD Build/Ensure Function Start --------------------

// Ensures all persistent HUD widgets exist for a player.
// This function is idempotent and safe to call on join, respawn, or reconnect.
// Widget references created here are reused and updated elsewhere.

function ensureHudForPlayer(player: mod.Player): HudRefs | undefined {
    // Per-player HUD lifecycle:
    // - HUD widgets are created once per player and then only updated (never recreated) during the match.
    // - This function is safe to call repeatedly (join, respawn, reconnect, admin actions).
    // - If a widget is missing, create it and store/find it via the UI root.

    if (!player || !mod.IsPlayerValid(player)) return undefined;

    const pid = getObjId(player);

    // If cached and still valid, return it
    const cached = State.hudCache.hudByPid[pid];
    if (cached && (safeFind(`Container_HelpText_${pid}`) || safeFind(`Container_ReadyStatus_${pid}`))) {
        const helpContainer = safeFind(`Container_HelpText_${pid}`);
        if (helpContainer) {
            mod.SetUIWidgetPosition(helpContainer, mod.CreateVector(-165.5, 75.25, 0)); //-116.5, 75.25, 0
        }
        const readyContainer = safeFind(`Container_ReadyStatus_${pid}`);
        if (readyContainer) {
            mod.SetUIWidgetPosition(readyContainer, mod.CreateVector(-165.5, 75.25, 0));
        }
        const adminActionCounter = safeFind(`AdminPanelActionCount_${pid}`);
        if (adminActionCounter) {
            mod.SetUIWidgetPosition(adminActionCounter, mod.CreateVector(20, 22, 0));
        }
        ensureTopHudRootForPid(pid, player);
        setHudHelpDepthForPid(pid);
        updateSettingsSummaryHudForPid(pid);

        return cached;
    }

    const refs: HudRefs = { pid, roots: [] };

    //#endregion -------------------- HUD Build/Ensure Function Start --------------------



    //#region -------------------- HUD Build/Ensure - Upper-Left HUD --------------------

    // --- Static HUD: Upper-left small box ---
    {
        const rootName = `Upper_Left_Container_${pid}`;
        const upperLeft = modlib.ParseUI({
            name: rootName,
            type: "Container",
            playerId: player,
            // position: [x, y] offset; direction depends on anchor, so verify visually in-game
            position: [5, 5 + TOP_HUD_OFFSET_Y],
            size: [200, 30],
            anchor: mod.UIAnchor.TopLeft,
            visible: true,
            padding: 1,
            bgColor: [0.251, 0.0941, 0.0667],
            bgAlpha: 0.5625,
            bgFill: mod.UIBgFill.Blur,
            children: [
                {
                    // UI element: Upper_Left_Text_${pid}
                    name: `Upper_Left_Text_${pid}`,
                    type: "Text",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
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
                    // UI element: Upper_Left_Text_2_${pid}
                    name: `Upper_Left_Text_2_${pid}`,
                    type: "Text",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
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
        if (upperLeft) refs.roots.push(upperLeft);
    }

    // --- Static HUD: Upper-left settings summary (below branding) ---
    {
        const SETTINGS_CONTAINER_X = 5;
        const SETTINGS_CONTAINER_Y = 5 + TOP_HUD_OFFSET_Y + 30 + 6;
        const SETTINGS_LINE_HEIGHT = 12;
        const SETTINGS_TEXT_WIDTH = 200;
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

    //#endregion ----------------- HUD Build/Ensure - Upper-Left HUD --------------------



    //#region -------------------- HUD Build/Ensure - Top-Center Panels --------------------

    // --- Static HUD: Top-center panels (TeamLeft / Middle / TeamRight) ---
    {
        const TOP_PANEL_Y = 44.75 + TOP_HUD_OFFSET_Y;
        const PANEL_WIDTH = 114.5;
        const PANEL_HEIGHT = 74;
        const MID_PANEL_X = 902.75;
        const LEFT_PANEL_X = 783.86;
        const RIGHT_PANEL_X = 1021.64;
        const PANEL_GAP = MID_PANEL_X - LEFT_PANEL_X - PANEL_WIDTH;
        const ROUND_KILLS_PANEL_SIZE = PANEL_HEIGHT;
        const ROUND_KILLS_LEFT_X = LEFT_PANEL_X - ROUND_KILLS_PANEL_SIZE - PANEL_GAP;
        const ROUND_KILLS_RIGHT_X = RIGHT_PANEL_X + PANEL_WIDTH + PANEL_GAP;
        const TRENDING_CROWN_SIZE = 18;
        const TRENDING_CROWN_OFFSET_Y = 4;
        const TRENDING_CROWN_LEFT_X = PANEL_WIDTH - TRENDING_CROWN_SIZE - 10;
        const TRENDING_CROWN_RIGHT_X = 10;
        const mid = modlib.ParseUI({
            // UI element: Container_TopMiddle_CoreUI_${pid}
            name: `Container_TopMiddle_CoreUI_${pid}`,
            type: "Container",
            playerId: player,
            // position: [x, y] offset; direction depends on anchor, so verify visually in-game
            position: [MID_PANEL_X, TOP_PANEL_Y],
            size: [PANEL_WIDTH, PANEL_HEIGHT],
            anchor: mod.UIAnchor.TopLeft,
            visible: true,
            padding: 0,
            bgColor: [0.0314, 0.0431, 0.0431],
            bgAlpha: 0.75,
            bgFill: mod.UIBgFill.Blur,
            children: [
                {
                    // Help/instructions text shown when enabled for this player
                    name: `Container_HelpText_${pid}`,
                    type: "Container",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [-165.5, 92], //[-116.5, 92]
                    size: [450, 20],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgColor: [1, 0.9882, 0.6118],
                    bgAlpha: 1,
                    bgFill: mod.UIBgFill.Solid,
                    children: [
                        {
                            // Help/instructions text shown when enabled for this player
                            name: `HelpText_${pid}`,
                            type: "Text",
                            // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                            position: [0, 2],
                            size: [450, 14],
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
                    // Ready status text shown when the player is READY and the match is not live.
                    name: `Container_ReadyStatus_${pid}`,
                    type: "Container",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [-165.5, 92], //[-116.5, 92]
                    size: [450, 20],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: false,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    children: [
                        {
                            // Ready status text shown when enabled for this player
                            name: `ReadyStatusText_${pid}`,
                            type: "Text",
                            // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                            position: [0, 2],
                            size: [450, 14],
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

    //#endregion ----------------- HUD Build/Ensure - Top-Center Panels --------------------



    //#region -------------------- HUD Build/Ensure - Admin Action Counter --------------------

    {
        // Admin action audit counter (top-right)
        const auditCounter = modlib.ParseUI({
            name: `AdminPanelActionCount_${pid}`,
            type: "Text",
            playerId: player,
            // position: [x, y] offset; increase X to move right, increase Y to move down
            position: [20, 22],
            size: [60, 12],
            anchor: mod.UIAnchor.TopRight,
            visible: true,
            padding: 0,
            bgAlpha: 0,
            bgFill: mod.UIBgFill.None,
            textLabel: mod.Message(mod.stringkeys.twl.adminPanel.actionCountFormat, 0),
            textColor: [1, 1, 1],
            textAlpha: 1,
            textSize: 10,
            textAnchor: mod.UIAnchor.CenterRight,
        });
        if (auditCounter) refs.roots.push(auditCounter);
    }

    refs.adminPanelActionCountText = safeFind(`AdminPanelActionCount_${pid}`);

    //#endregion ----------------- HUD Build/Ensure - Admin Action Counter --------------------



    //#region -------------------- HUD Build/Ensure - Counter Widgets --------------------

    // West/East score panels and top round X/Y counters intentionally removed for conquest HUD simplification.

    //#endregion ----------------- HUD Build/Ensure - Counter Widgets --------------------



    // Legacy round-end modal was removed; conquest uses the dedicated victory dialog builder below.



    //#region -------------------- HUD Build/Ensure - Victory Dialog --------------------

    buildVictoryDialogWidgets(player, pid, refs);

    //#endregion ----------------- HUD Build/Ensure - Victory Dialog --------------------



    //#region -------------------- HUD Build/Ensure - Cache Init + Defaults --------------------

    refs.helpTextContainer = safeFind(`Container_HelpText_${pid}`);
    refs.readyStatusContainer = safeFind(`Container_ReadyStatus_${pid}`);
    refs.settingsGameModeText = safeFind(`Settings_GameMode_${pid}`);
    refs.settingsAircraftCeilingText = safeFind(`Settings_Ceiling_${pid}`);
    refs.settingsVehiclesT1Text = safeFind(`Settings_VehiclesT1_${pid}`);
    refs.settingsVehiclesT2Text = safeFind(`Settings_VehiclesT2_${pid}`);
    refs.settingsVehiclesMatchupText = safeFind(`Settings_VehiclesMatchup_${pid}`);
    refs.settingsPlayersText = safeFind(`Settings_Players_${pid}`);
    State.hudCache.hudByPid[pid] = refs;

    // Keep only HUD elements used by conquest's simplified center HUD + overlays.
    setAdminPanelActionCountText(refs.adminPanelActionCountText, State.admin.actionCount);
    updateSettingsSummaryHudForPid(pid);

    ensureTopHudRootForPid(pid, player);
    setHudHelpDepthForPid(pid);

    updateVictoryDialogForPlayer(player, getRemainingSeconds());

    return refs;
}

//#endregion ----------------- HUD Build/Ensure - Cache Init + Defaults --------------------
