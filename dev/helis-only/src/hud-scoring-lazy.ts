// @ts-nocheck
// Module: hud-scoring-lazy -- Top-Center Panels + Counter Widgets + Admin Action Counter widget
// construction, extracted from ensureEagerHudShellForPlayer's body so they no longer run at OnPlayerJoinGame
// time. Built on demand via triggerLazyBuild('topHud', pid) which fires from OnPlayerDeployed.
//
// Why: Phase B of the lazy-load HUD refactor (see design_doc/5.30.26_heli_lazy_load_hud_refactor_plan.md).
// These three blocks are ~670 lines of synchronous ParseUI; deferring them off OnPlayerJoinGame is
// the rest of the concurrent-join frame-budget crash mitigation (CQ_Bug_40 equivalent).
//
// Trigger timing: per-player on first deploy (OnPlayerDeployed). Player deploys are naturally
// staggered across time, so the build cost is spread rather than dogpiled at the join tick.
//
// Idempotency: detected via safeFind for Container_TopMiddle_CoreUI_<pid>. On re-entry the
// function re-binds refs, re-reparents to TopHudRoot, and re-seeds values from State (cheap).
//
// Pre-build update safety: callers that update top-hud values (setHudWinCountersForAllPlayers,
// syncRoundKillsHud, etc.) call setCounterText which no-ops on undefined widget refs. Values stay
// authoritative in State; the widgets are projections of State and get seeded from current State
// when this function runs. A player who joins mid-round still sees correct scoring as soon as
// they deploy + the lazy build fires.

function ensureTopHudScoringUiBuiltHidden(player: mod.Player): void {
    if (!player || !mod.IsPlayerValid(player)) return;
    const pid = safeGetPlayerId(player);
    if (pid === undefined || isPidDisconnected(pid)) return;

    const refs = State.hudCache.hudByPid[pid];
    if (!refs) return;

    const alreadyBuilt = safeFind(`Container_TopMiddle_CoreUI_${pid}`);
    if (alreadyBuilt && refs.leftKillsText && refs.rightKillsText) {
        bindTopHudRefsByName(refs, pid);
        ensureTopHudRootForPid(pid, player);
        setHudHelpDepthForPid(pid);
        seedTopHudFromState(refs);
        return;
    }

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
            name: `Container_TopMiddle_CoreUI_${pid}`,
            type: "Container",
            playerId: player,
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
                    name: `RoundText_${pid}`,
                    type: "Text",
                    position: [0.5, -4],
                    size: [72.5, 24],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgColor: [0.2, 0.2, 0.2],
                    bgAlpha: 1,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.stringkeys.twl.hud.roundText,
                    textColor: [1, 1, 1],
                    textAlpha: 1,
                    textSize: 16,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    // Help/instructions text shown when enabled for this player
                    name: `Container_HelpText_${pid}`,
                    type: "Container",
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
                    // Ready status text shown when the player is READY and the round is not live
                    name: `Container_ReadyStatus_${pid}`,
                    type: "Container",
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
                {
                    name: `Slash_${pid}`,
                    type: "Text",
                    position: [71.5 + ROUND_SLASH_OFFSET_X, -2],
                    size: [31, 21],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgColor: [0.2, 0.2, 0.2],
                    bgAlpha: 1,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.stringkeys.twl.system.slash,
                    textColor: [1, 1, 1],
                    textAlpha: 1,
                    textSize: 16,
                    textAnchor: mod.UIAnchor.Center,
                },
            ],
        });
        if (mid) refs.roots.push(mid);

        const t1Panel = modlib.ParseUI({
            name: `Container_TopLeft_CoreUI_${pid}`,
            type: "Container",
            playerId: player,
            position: [LEFT_PANEL_X, TOP_PANEL_Y],
            size: [PANEL_WIDTH, PANEL_HEIGHT],
            anchor: mod.UIAnchor.TopLeft,
            visible: true,
            padding: 0,
            bgColor: [0.4392, 0.9216, 1],
            bgAlpha: 0.75,
            bgFill: mod.UIBgFill.Blur,
            children: [
                {
                    // Trending winner crown (solid) for Team 1
                    name: `TeamLeft_Trending_Crown_${pid}`,
                    type: "Image",
                    position: [TRENDING_CROWN_LEFT_X, TRENDING_CROWN_OFFSET_Y],
                    size: [TRENDING_CROWN_SIZE, TRENDING_CROWN_SIZE],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: false,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    imageType: mod.UIImageType.CrownSolid,
                    imageColor: [1, 252 / 255, 156 / 255],
                    imageAlpha: 1,
                },
                {
                    // Team name label for Team 1 (left side)
                    name: `TeamLeft_Name_${pid}`,
                    type: "Text",
                    position: [23.25, 0],
                    size: [68, 28],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgColor: [0.2, 0.2, 0.2],
                    bgAlpha: 1,
                    bgFill: mod.UIBgFill.None,
                    textLabel: getTeamNameKey(TeamID.Team1),
                    textColor: [1, 1, 1],
                    textAlpha: 1,
                    textSize: 18,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    name: `TeamLeft_Record_${pid}`,
                    type: "Text",
                    position: [2.25, 22],
                    size: [110, 20],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgColor: [0.2, 0.2, 0.2],
                    bgAlpha: 1,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(mod.stringkeys.twl.hud.roundRecordFormat, 0, 0, 0),
                    textColor: [1, 1, 1],
                    textAlpha: 1,
                    textSize: 18,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    // Display variable for round wins on Team 1 (left side)
                    name: `TeamLeft_Wins_${pid}`,
                    type: "Text",
                    position: [31, 45], //26.5, 44
                    size: [72, 16],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgColor: [0.2, 0.2, 0.2],
                    bgAlpha: 1,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.stringkeys.twl.hud.labels.roundWins,
                    textColor: [1, 1, 1],
                    textAlpha: 1,
                    textSize: 12,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    // Display variable for total kills on Team 1 (left side)
                    name: `TeamLeft_Kills_${pid}`,
                    type: "Text",
                    position: [26.5, 59], //26.5, 58
                    size: [72, 16],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgColor: [0.2, 0.2, 0.2],
                    bgAlpha: 1,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.stringkeys.twl.hud.labels.totalKills,
                    textColor: [1, 1, 1],
                    textAlpha: 1,
                    textSize: 12,
                    textAnchor: mod.UIAnchor.Center,
                },
            ],
        });
        if (t1Panel) refs.roots.push(t1Panel);

        const t1RoundKillsPanel = modlib.ParseUI({
            name: `Container_TopLeft_RoundKills_${pid}`,
            type: "Container",
            playerId: player,
            position: [ROUND_KILLS_LEFT_X, TOP_PANEL_Y],
            size: [ROUND_KILLS_PANEL_SIZE, ROUND_KILLS_PANEL_SIZE],
            anchor: mod.UIAnchor.TopLeft,
            visible: true,
            padding: 0,
            bgColor: [0.4392, 0.9216, 1],
            bgAlpha: 0.75,
            bgFill: mod.UIBgFill.Blur,
            children: [
                {
                    // Crown indicator shown for round winner (Team 1)
                    name: `TeamLeft_RoundKills_Crown_${pid}`,
                    type: "Image",
                    position: [0, -35],
                    size: [45, 45],
                    anchor: mod.UIAnchor.TopCenter,
                    visible: false,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    imageType: mod.UIImageType.CrownOutline,
                    imageColor: [1, 1, 1],
                    imageAlpha: 1,
                },
                {
                    // Big round-kills counter for Team 1
                    name: `TeamLeft_RoundKills_CounterText_${pid}`,
                    type: "Text",
                    position: [0, 0],
                    size: [ROUND_KILLS_PANEL_SIZE, 60],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                    textColor: COLOR_BLUE,
                    textAlpha: 1,
                    textSize: 60,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    // Round kills label (bottom of the panel)
                    name: `TeamLeft_RoundKills_${pid}`,
                    type: "Text",
                    position: [0, 53],
                    size: [ROUND_KILLS_PANEL_SIZE, 18],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(mod.stringkeys.twl.hud.labels.roundKillsWithRoundFormat, getRoundKillsLabelRound()),
                    textColor: [1, 1, 1],
                    textAlpha: 1,
                    textSize: 11,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    // Registered vehicles alive (live round only)
                    name: `TeamLeft_RoundKills_VehiclesAlive_${pid}`,
                    type: "Text",
                    position: [0, 76],
                    size: [ROUND_KILLS_PANEL_SIZE, 12],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: false,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(mod.stringkeys.twl.hud.vehiclesAliveFormat, 0),
                    textColor: [1, 1, 1],
                    textAlpha: 1,
                    textSize: 10,
                    textAnchor: mod.UIAnchor.Center,
                },
            ],
        });
        if (t1RoundKillsPanel) refs.roots.push(t1RoundKillsPanel);

        const t2Panel = modlib.ParseUI({
            name: `Container_TopRight_CoreUI_${pid}`,
            type: "Container",
            playerId: player,
            position: [RIGHT_PANEL_X, TOP_PANEL_Y],
            size: [PANEL_WIDTH, PANEL_HEIGHT],
            anchor: mod.UIAnchor.TopLeft,
            visible: true,
            padding: 0,
            bgColor: [1, 0.5137, 0.3804],
            bgAlpha: 0.75,
            bgFill: mod.UIBgFill.Blur,
            children: [
                {
                    // Trending winner crown (solid) for Team 2
                    name: `TeamRight_Trending_Crown_${pid}`,
                    type: "Image",
                    position: [TRENDING_CROWN_RIGHT_X, TRENDING_CROWN_OFFSET_Y],
                    size: [TRENDING_CROWN_SIZE, TRENDING_CROWN_SIZE],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: false,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    imageType: mod.UIImageType.CrownSolid,
                    imageColor: [1, 252 / 255, 156 / 255],
                    imageAlpha: 1,
                },
                {
                    // Team name label for Team 2 (right side)
                    name: `TeamRight_Name_${pid}`,
                    type: "Text",
                    position: [23.25, 0],
                    size: [68, 28],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgColor: [0.2, 0.2, 0.2],
                    bgAlpha: 1,
                    bgFill: mod.UIBgFill.None,
                    textLabel: getTeamNameKey(TeamID.Team2),
                    textColor: [1, 1, 1],
                    textAlpha: 1,
                    textSize: 18,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    name: `TeamRight_Record_${pid}`,
                    type: "Text",
                    position: [2.25, 22],
                    size: [110, 20],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgColor: [0.2, 0.2, 0.2],
                    bgAlpha: 1,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(mod.stringkeys.twl.hud.roundRecordFormat, 0, 0, 0),
                    textColor: [1, 1, 1],
                    textAlpha: 1,
                    textSize: 18,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    // Display variable for round wins on Team 2 (right side)
                    name: `TeamRight_Wins_${pid}`,
                    type: "Text",
                    position: [31, 45], //26.5, 44
                    size: [72, 16],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgColor: [0.2, 0.2, 0.2],
                    bgAlpha: 1,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.stringkeys.twl.hud.labels.roundWins,
                    textColor: [1, 1, 1],
                    textAlpha: 1,
                    textSize: 12,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    // Display variable for total kills on Team 2 (right side)
                    name: `TeamRight_Kills_${pid}`,
                    type: "Text",
                    position: [26.5, 59], //58
                    size: [72, 16],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgColor: [0.2, 0.2, 0.2],
                    bgAlpha: 1,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.stringkeys.twl.hud.labels.totalKills,
                    textColor: [1, 1, 1],
                    textAlpha: 1,
                    textSize: 12,
                    textAnchor: mod.UIAnchor.Center,
                },
            ],
        });

        const t2RoundKillsPanel = modlib.ParseUI({
            name: `Container_TopRight_RoundKills_${pid}`,
            type: "Container",
            playerId: player,
            position: [ROUND_KILLS_RIGHT_X, TOP_PANEL_Y],
            size: [ROUND_KILLS_PANEL_SIZE, ROUND_KILLS_PANEL_SIZE],
            anchor: mod.UIAnchor.TopLeft,
            visible: true,
            padding: 0,
            bgColor: [1, 0.5137, 0.3804],
            bgAlpha: 0.75,
            bgFill: mod.UIBgFill.Blur,
            children: [
                {
                    // Crown indicator shown for round winner (Team 2)
                    name: `TeamRight_RoundKills_Crown_${pid}`,
                    type: "Image",
                    position: [0, -35],
                    size: [45, 45],
                    anchor: mod.UIAnchor.TopCenter,
                    visible: false,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    imageType: mod.UIImageType.CrownOutline,
                    imageColor: [1, 1, 1],
                    imageAlpha: 1,
                },
                {
                    // Big round-kills counter for Team 2
                    name: `TeamRight_RoundKills_CounterText_${pid}`,
                    type: "Text",
                    position: [0, 0],
                    size: [ROUND_KILLS_PANEL_SIZE, 60],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                    textColor: COLOR_RED,
                    textAlpha: 1,
                    textSize: 60,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    // Round kills label (bottom of the panel)
                    name: `TeamRight_RoundKills_${pid}`,
                    type: "Text",
                    position: [0, 53],
                    size: [ROUND_KILLS_PANEL_SIZE, 18],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(mod.stringkeys.twl.hud.labels.roundKillsWithRoundFormat, getRoundKillsLabelRound()),
                    textColor: [1, 1, 1],
                    textAlpha: 1,
                    textSize: 11,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    // Registered vehicles alive (live round only)
                    name: `TeamRight_RoundKills_VehiclesAlive_${pid}`,
                    type: "Text",
                    position: [0, 76],
                    size: [ROUND_KILLS_PANEL_SIZE, 12],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: false,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(mod.stringkeys.twl.hud.vehiclesAliveFormat, 0),
                    textColor: [1, 1, 1],
                    textAlpha: 1,
                    textSize: 10,
                    textAnchor: mod.UIAnchor.Center,
                },
            ],
        });
        if (t2RoundKillsPanel) refs.roots.push(t2RoundKillsPanel);

    }


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

    refs.leftRecordText = safeFind(`TeamLeft_Record_${pid}`);
    refs.rightRecordText = safeFind(`TeamRight_Record_${pid}`);
    refs.leftRoundKillsText = safeFind(`TeamLeft_RoundKills_CounterText_${pid}`);
    refs.rightRoundKillsText = safeFind(`TeamRight_RoundKills_CounterText_${pid}`);
    refs.leftRoundKillsLabel = safeFind(`TeamLeft_RoundKills_${pid}`);
    refs.rightRoundKillsLabel = safeFind(`TeamRight_RoundKills_${pid}`);
    refs.leftVehiclesAliveText = safeFind(`TeamLeft_RoundKills_VehiclesAlive_${pid}`);
    refs.rightVehiclesAliveText = safeFind(`TeamRight_RoundKills_VehiclesAlive_${pid}`);
    refs.leftRoundKillsCrown = safeFind(`TeamLeft_RoundKills_Crown_${pid}`);
    refs.rightRoundKillsCrown = safeFind(`TeamRight_RoundKills_Crown_${pid}`);
    refs.leftTrendingWinnerCrown = safeFind(`TeamLeft_Trending_Crown_${pid}`);
    refs.rightTrendingWinnerCrown = safeFind(`TeamRight_Trending_Crown_${pid}`);
    refs.adminPanelActionCountText = safeFind(`AdminPanelActionCount_${pid}`);


    // --- Counter widgets (digits) ---
    {
        const mkCounter = (
            containerName: string,
            textName: string,
            pos: [number, number],
            size: [number, number],
            textSize: number
        ) => {
            const root = modlib.ParseUI({
                name: containerName,
                type: "Container",
                playerId: player,
                position: pos,
                size: size,
                anchor: mod.UIAnchor.TopLeft,
                visible: true,
                padding: 0,
                bgColor: [0.2, 0.2, 0.2],
                bgAlpha: 1,
                bgFill: mod.UIBgFill.None,
                children: [
                    {
                        name: textName,
                        type: "Text",
                        position: [0, 0],
                        size: [size[0], size[1]],
                        anchor: mod.UIAnchor.Center,
                        visible: true,
                        padding: 0,
                        bgColor: [0.2, 0.2, 0.2],
                        bgAlpha: 1,
                        bgFill: mod.UIBgFill.None,
                        textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                        textColor: [1, 1, 1],
                        textAlpha: 1,
                        textSize: textSize,
                        textAnchor: mod.UIAnchor.Center,
                    },
                ],
            });
            if (root) refs.roots.push(root);
            return safeFind(textName);
        };

        refs.roundCurText = mkCounter(
            `RoundCounterContainer_${pid}`,
            `RoundCounterText_${pid}`,
            [970.93 + ROUND_COUNTER_OFFSET_X, 44.35 + TOP_HUD_OFFSET_Y],
            [13.95, 18.15],
            16
        );
        refs.roundMaxText = mkCounter(
            `RoundCounterMaxContainer_${pid}`,
            `RoundCounterMaxText_${pid}`,
            [993.03 + ROUND_COUNTER_OFFSET_X, 44.35 + TOP_HUD_OFFSET_Y],
            [13.95, 18.15],
            16
        );

        refs.leftWinsText = mkCounter(
            `TeamLeft_Wins_Counter_${pid}`,
            `TeamLeft_Wins_CounterText_${pid}`,
            [803.03, 84.75 + TOP_HUD_OFFSET_Y],
            [20, 24],
            15
        );
        refs.rightWinsText = mkCounter(
            `TeamRight_Wins_Counter_${pid}`,
            `TeamRight_Wins_CounterText_${pid}`,
            [1039.76, 84.75 + TOP_HUD_OFFSET_Y],
            [20, 24],
            15
        );

        refs.leftKillsText = mkCounter(
            `TeamLeft_Kills_Counter_${pid}`,
            `TeamLeft_Kills_CounterText_${pid}`,
            [803.03, 98.75 + TOP_HUD_OFFSET_Y],
            [20, 24],
            15
        );
        refs.rightKillsText = mkCounter(
            `TeamRight_Kills_Counter_${pid}`,
            `TeamRight_Kills_CounterText_${pid}`,
            [1039.76, 98.75 + TOP_HUD_OFFSET_Y],
            [20, 24],
            15
        );
    }


    bindTopHudRefsByName(refs, pid);
    ensureTopHudRootForPid(pid, player);
    setHudHelpDepthForPid(pid);
    seedTopHudFromState(refs);
}

function bindTopHudRefsByName(refs: HudRefs, pid: number): void {
    refs.leftRecordText = safeFind(`TeamLeft_Record_${pid}`);
    refs.rightRecordText = safeFind(`TeamRight_Record_${pid}`);
    refs.leftRoundKillsText = safeFind(`TeamLeft_RoundKills_CounterText_${pid}`);
    refs.rightRoundKillsText = safeFind(`TeamRight_RoundKills_CounterText_${pid}`);
    refs.leftRoundKillsLabel = safeFind(`TeamLeft_RoundKills_${pid}`);
    refs.rightRoundKillsLabel = safeFind(`TeamRight_RoundKills_${pid}`);
    refs.leftVehiclesAliveText = safeFind(`TeamLeft_RoundKills_VehiclesAlive_${pid}`);
    refs.rightVehiclesAliveText = safeFind(`TeamRight_RoundKills_VehiclesAlive_${pid}`);
    refs.leftRoundKillsCrown = safeFind(`TeamLeft_RoundKills_Crown_${pid}`);
    refs.rightRoundKillsCrown = safeFind(`TeamRight_RoundKills_Crown_${pid}`);
    refs.leftTrendingWinnerCrown = safeFind(`TeamLeft_Trending_Crown_${pid}`);
    refs.rightTrendingWinnerCrown = safeFind(`TeamRight_Trending_Crown_${pid}`);
    refs.adminPanelActionCountText = safeFind(`AdminPanelActionCount_${pid}`);

    refs.roundCurText = safeFind(`RoundCounterText_${pid}`);
    refs.roundMaxText = safeFind(`RoundCounterMaxText_${pid}`);
    refs.leftWinsText = safeFind(`TeamLeft_Wins_CounterText_${pid}`);
    refs.rightWinsText = safeFind(`TeamRight_Wins_CounterText_${pid}`);
    refs.leftKillsText = safeFind(`TeamLeft_Kills_CounterText_${pid}`);
    refs.rightKillsText = safeFind(`TeamRight_Kills_CounterText_${pid}`);

    refs.helpTextContainer = safeFind(`Container_HelpText_${pid}`);
    refs.readyStatusContainer = safeFind(`Container_ReadyStatus_${pid}`);
}

function seedTopHudFromState(refs: HudRefs): void {
    setCounterText(refs.roundCurText, State.round.current);
    setCounterText(refs.roundMaxText, State.round.max);
    setCounterText(refs.leftWinsText, State.match.winsT1);
    setCounterText(refs.rightWinsText, State.match.winsT2);
    setRoundRecordText(refs.leftRecordText, State.match.winsT1, State.match.lossesT1, State.match.tiesT1);
    setRoundRecordText(refs.rightRecordText, State.match.winsT2, State.match.lossesT2, State.match.tiesT2);
    setCounterText(refs.leftRoundKillsText, State.scores.t1RoundKills);
    setCounterText(refs.rightRoundKillsText, State.scores.t2RoundKills);
    setRoundKillsLabelTextForRefs(refs);
    setRoundWinCrownForRefs(refs, State.round.lastWinnerTeam, State.round.flow.roundEndDialogVisible);
    setTrendingWinnerCrownForRefs(refs);
    setCounterText(refs.leftKillsText, State.scores.t1TotalKills);
    setCounterText(refs.rightKillsText, State.scores.t2TotalKills);
    setAdminPanelActionCountText(refs.adminPanelActionCountText, State.admin.actionCount);
}
