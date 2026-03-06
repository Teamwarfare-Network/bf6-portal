// @ts-nocheck
// Module: state — Gameplay helpers, ID helpers, HUD types, GameState interface, and State object

//#region -------------------- Core gameplay state helpers --------------------

// Core gameplay helper utilities (state sync + messaging gates).

function getMatchWinsTeam(teamNum: TeamID): number {
    // Debug-only: engine GameModeScore can be transient during reconnects / team swaps.
    return Math.floor(mod.GetGameModeScore(mod.GetTeam(teamNum)));
}

function setMatchWinsTeam(teamNum: TeamID, wins: number): void {
    mod.SetGameModeScore(mod.GetTeam(teamNum), Math.max(0, Math.floor(wins)));
}

// Central message-gating policy: gameplay vs debug, and highlighted vs notification.
function shouldSendMessage(isGameplay: boolean, isHighlighted: boolean): boolean {
    if (isGameplay) return ENABLE_GAMEPLAY_MESSAGES;
    return isHighlighted ? ENABLE_DEBUG_HIGHLIGHTED_MESSAGES : ENABLE_DEBUG_NOTIFICATION_MESSAGES;
}

function setUIInputModeForPlayer(player: mod.Player, enabled: boolean): void {
    if (!player || !mod.IsPlayerValid(player)) return;
    mod.EnableUIInputMode(enabled, player);
    State.players.uiInputEnabledByPid[mod.GetObjId(player)] = enabled;
}

function noteHighlightedMessageSent(messageKey?: number): void {
    State.debug.highlightedMessageCount = State.debug.highlightedMessageCount + 1;
    State.debug.lastHighlightedMessageAtSeconds = Math.floor(mod.GetMatchTimeElapsed());
    if (messageKey !== undefined) {
        State.debug.lastHighlightedMessageKey = messageKey;
    }
}

// Round phase helper for readability (avoids scattered enum comparisons).
function isRoundLive(): boolean {
    return State.round.phase === RoundPhase.Live;
}

// Returns true if the given team currently has at least one valid player.
function hasPlayersOnTeam(team: mod.Team): boolean {
    if (mod.Equals(team, mod.GetTeam(0))) return false;
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        if (mod.Equals(mod.GetTeam(p), team)) return true;
    }
    return false;
}

// Notification channel wrapper; respects gameplay/debug gates and optional target.
function sendNotificationMessage(message: mod.Message, isGameplay: boolean, target?: mod.Player | mod.Team): void {
    if (!shouldSendMessage(isGameplay, false)) return;
    if (target) {
        // Route to the correct overload; Team cast-as-Player can silently drop messages after team switches.
        if (mod.IsType(target, mod.Types.Team)) {
            const teamTarget = target as mod.Team;
            if (!hasPlayersOnTeam(teamTarget)) return;
            mod.DisplayNotificationMessage(message, teamTarget);
            return;
        }
        if (mod.IsType(target, mod.Types.Player)) {
            const playerTarget = target as mod.Player;
            if (!playerTarget || !mod.IsPlayerValid(playerTarget)) return;
            mod.DisplayNotificationMessage(message, playerTarget);
            return;
        }
        return;
    }
    mod.DisplayNotificationMessage(message);
}

// World-log wrapper; respects gameplay/debug gates and optional target.
function sendHighlightedWorldLogMessage(message: mod.Message, isGameplay: boolean, target?: mod.Player | mod.Team, debugKey?: number): void {
    if (!shouldSendMessage(isGameplay, true)) return;
    noteHighlightedMessageSent(debugKey);
    if (target) {
        // Route to the correct overload; Team cast-as-Player can silently drop messages after team switches.
        if (mod.IsType(target, mod.Types.Team)) {
            const teamTarget = target as mod.Team;
            if (!hasPlayersOnTeam(teamTarget)) return;
            mod.DisplayHighlightedWorldLogMessage(message, teamTarget);
            return;
        }
        if (mod.IsType(target, mod.Types.Player)) {
            const playerTarget = target as mod.Player;
            if (!playerTarget || !mod.IsPlayerValid(playerTarget)) return;
            mod.DisplayHighlightedWorldLogMessage(message, playerTarget);
            return;
        }
        return;
    }
    mod.DisplayHighlightedWorldLogMessage(message);
}


// CP visibility debug helper (highlighted world log).
function logCapturePointVisibilityDebug(messageKey: number): void {
    if (!ENABLE_CP_VIS_DEBUG) return;
    sendHighlightedWorldLogMessage(
        mod.Message(messageKey),
        true,
        undefined,
        messageKey
    );
}

// Synchronizes HUD win counters from authoritative match state.
// This should be called after any admin or gameplay mutation of State.match.winsT1/T2.
function syncWinCountersHudFromGameModeScore(): void {
    // Debug-only: do not use for authoritative state; pulling from engine here can latch transient values.
    const t1Wins = getMatchWinsTeam(TeamID.Team1);
    const t2Wins = getMatchWinsTeam(TeamID.Team2);

    State.match.winsT1 = t1Wins;
    State.match.winsT2 = t2Wins;
    syncRoundRecordHudForAllPlayers();
    setTrendingWinnerCrownForAllPlayers();

    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const refs = ensureHudForPlayer(p);
        if (!refs) continue;
        setCounterText(refs.leftWinsText, t1Wins);
        setCounterText(refs.rightWinsText, t2Wins);
    }
}

function endGameModeForTeamNum(teamNum: TeamID | 0): void {
    const winningTeam = mod.GetTeam(teamNum);

    // End the match by team consistently; ending "by player" can yield inconsistent engine finalization
    // when players reconnect or briefly join different teams.
    mod.EndGameMode(winningTeam);
}

//#endregion ----------------- Core gameplay state helpers --------------------



//#region -------------------- Shared ID helpers --------------------

function getObjId(obj: any): number {
    return mod.GetObjId(obj);
}

function safeGetObjId(obj: any): number | undefined {
    if (!obj) return undefined;
    try {
        return mod.GetObjId(obj);
    } catch {
        return undefined;
    }
}

// Guarded pid resolution for disconnect race windows in hot paths.
function safeGetPlayerId(player: mod.Player | null | undefined): number | undefined {
    if (!player || !mod.IsPlayerValid(player)) return undefined;
    try {
        return mod.GetObjId(player);
    } catch {
        return undefined;
    }
}

function isPidDisconnected(pid: number): boolean {
    return State.players.disconnectedByPid[pid] === true;
}

function getTeamNumber(team: mod.Team): TeamID | 0 {
    if (mod.Equals(team, mod.GetTeam(TeamID.Team1))) return TeamID.Team1;
    if (mod.Equals(team, mod.GetTeam(TeamID.Team2))) return TeamID.Team2;
    return 0;
}

function safeGetTeamNumberFromPlayer(
    player: mod.Player | null | undefined,
    fallback: TeamID | 0 = 0
): TeamID | 0 {
    if (!player || !mod.IsPlayerValid(player)) return fallback;
    try {
        return getTeamNumber(mod.GetTeam(player));
    } catch {
        return fallback;
    }
}

function isPlayerDeployed(player: mod.Player): boolean {
    if (!player || !mod.IsPlayerValid(player)) return false;
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return false;
    return !!State.players.deployedByPid[pid];
}

// Safe GetSoldierState wrappers: avoid engine errors during undeploy/cleanup and keep deploy state in sync.
function safeGetSoldierStateBool(player: mod.Player, stateKey: any, fallback: boolean = false): boolean {
    if (!player || !mod.IsPlayerValid(player)) return fallback;
    if (!isPlayerDeployed(player)) return fallback;
    try {
        return !!mod.GetSoldierState(player, stateKey);
    } catch {
        const pid = safeGetPlayerId(player);
        if (pid !== undefined) {
            State.players.deployedByPid[pid] = false;
        }
        return fallback;
    }
}

function safeGetSoldierStateVector(player: mod.Player, stateKey: any): mod.Vector | undefined {
    if (!player || !mod.IsPlayerValid(player)) return undefined;
    if (!isPlayerDeployed(player)) return undefined;
    try {
        return mod.GetSoldierState(player, stateKey) as unknown as mod.Vector;
    } catch {
        const pid = safeGetPlayerId(player);
        if (pid !== undefined) {
            State.players.deployedByPid[pid] = false;
        }
        return undefined;
    }
}

function getTeamNameKey(teamNum: TeamID | 0): number {
    if (teamNum === TeamID.Team1) return ACTIVE_MAP_CONFIG?.team1Name ?? mod.stringkeys.twl.teams.WEST;
    if (teamNum === TeamID.Team2) return ACTIVE_MAP_CONFIG?.team2Name ?? mod.stringkeys.twl.teams.EAST;
    return mod.stringkeys.twl.system.unknownPlayer;
}

function opposingTeam(teamNum: TeamID | 0): TeamID | 0 {
    if (teamNum === TeamID.Team1) return TeamID.Team2;
    if (teamNum === TeamID.Team2) return TeamID.Team1;
    return 0;
}

function safeFind(name: string): mod.UIWidget | undefined {
    try {
        return mod.FindUIWidgetWithName(name, mod.GetUIRoot()) as mod.UIWidget;
    } catch {
        try {
            return mod.FindUIWidgetWithName(name) as mod.UIWidget;
        } catch {
            return undefined;
        }
    }
}

// Outlined button helper: wraps a solid button inside a thin-outline container.
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

function applyReadyDialogLabelTextColor(widget?: mod.UIWidget): void {
    if (widget) mod.SetUITextColor(widget, READY_DIALOG_LABEL_TEXT_COLOR);
}

function applyAdminPanelLabelTextColor(widget?: mod.UIWidget): void {
    if (widget) mod.SetUITextColor(widget, ADMIN_PANEL_LABEL_TEXT_COLOR);
}

function refreshReadyDialogButtonTextForPid(player: mod.Player, pid: number, baseContainer: mod.UIWidget): void {
    const swapBorder = safeFind(UI_READY_DIALOG_BUTTON_SWAP_ID + pid + "_BORDER");
    addCenteredButtonText(
        UI_READY_DIALOG_BUTTON_SWAP_LABEL_ID + pid,
        READY_DIALOG_MAIN_BUTTON_WIDTH,
        READY_DIALOG_MAIN_BUTTON_HEIGHT,
        mod.stringkeys.twl.readyDialog.buttons.swapTeams,
        player,
        swapBorder ?? baseContainer
    );

    const readyBorder = safeFind(UI_READY_DIALOG_BUTTON_READY_ID + pid + "_BORDER");
    addCenteredButtonText(
        UI_READY_DIALOG_BUTTON_READY_LABEL_ID + pid,
        READY_DIALOG_MAIN_BUTTON_WIDTH,
        READY_DIALOG_MAIN_BUTTON_HEIGHT,
        mod.stringkeys.twl.readyDialog.buttons.ready,
        player,
        readyBorder ?? baseContainer
    );
    updateReadyToggleButtonForViewer(player, pid);

    const autoReadyBorder = safeFind(UI_READY_DIALOG_BUTTON_AUTO_READY_ID + pid + "_BORDER");
    addCenteredButtonText(
        UI_READY_DIALOG_BUTTON_AUTO_READY_LABEL_ID + pid,
        READY_DIALOG_MAIN_BUTTON_WIDTH,
        READY_DIALOG_MAIN_BUTTON_HEIGHT,
        mod.stringkeys.twl.readyDialog.buttons.autoReadyEnable,
        player,
        autoReadyBorder ?? baseContainer
    );
    updateAutoReadyToggleButtonForViewer(player, pid);

    const cancelBorder = safeFind(UI_TEAMSWITCH_BUTTON_CANCEL_ID + pid + "_BORDER");
    addCenteredButtonText(
        UI_TEAMSWITCH_BUTTON_CANCEL_LABEL_ID + pid,
        READY_DIALOG_MAIN_BUTTON_WIDTH,
        READY_DIALOG_MAIN_BUTTON_HEIGHT,
        mod.stringkeys.twl.teamSwitch.buttons.cancel,
        player,
        cancelBorder ?? baseContainer
    );

    const bestOfDecBorder = safeFind(UI_READY_DIALOG_BESTOF_DEC_ID + pid + "_BORDER");
    addCenteredButtonText(
        UI_READY_DIALOG_BESTOF_DEC_LABEL_ID + pid,
        READY_DIALOG_SMALL_BUTTON_WIDTH,
        READY_DIALOG_SMALL_BUTTON_HEIGHT,
        mod.stringkeys.twl.ui.minus,
        player,
        bestOfDecBorder ?? baseContainer,
        14
    );
    const bestOfIncBorder = safeFind(UI_READY_DIALOG_BESTOF_INC_ID + pid + "_BORDER");
    addCenteredButtonText(
        UI_READY_DIALOG_BESTOF_INC_LABEL_ID + pid,
        READY_DIALOG_SMALL_BUTTON_WIDTH,
        READY_DIALOG_SMALL_BUTTON_HEIGHT,
        mod.stringkeys.twl.ui.plus,
        player,
        bestOfIncBorder ?? baseContainer,
        14
    );

    const matchupDecBorder = safeFind(UI_READY_DIALOG_MATCHUP_DEC_ID + pid + "_BORDER");
    addCenteredButtonText(
        UI_READY_DIALOG_MATCHUP_DEC_LABEL_ID + pid,
        READY_DIALOG_SMALL_BUTTON_WIDTH,
        READY_DIALOG_SMALL_BUTTON_HEIGHT,
        mod.stringkeys.twl.ui.minus,
        player,
        matchupDecBorder ?? baseContainer,
        14
    );
    const matchupIncBorder = safeFind(UI_READY_DIALOG_MATCHUP_INC_ID + pid + "_BORDER");
    addCenteredButtonText(
        UI_READY_DIALOG_MATCHUP_INC_LABEL_ID + pid,
        READY_DIALOG_SMALL_BUTTON_WIDTH,
        READY_DIALOG_SMALL_BUTTON_HEIGHT,
        mod.stringkeys.twl.ui.plus,
        player,
        matchupIncBorder ?? baseContainer,
        14
    );

    const minPlayersDecBorder = safeFind(UI_READY_DIALOG_MINPLAYERS_DEC_ID + pid + "_BORDER");
    addCenteredButtonText(
        UI_READY_DIALOG_MINPLAYERS_DEC_LABEL_ID + pid,
        READY_DIALOG_SMALL_BUTTON_WIDTH,
        READY_DIALOG_SMALL_BUTTON_HEIGHT,
        mod.stringkeys.twl.ui.minus,
        player,
        minPlayersDecBorder ?? baseContainer,
        14
    );
    const minPlayersIncBorder = safeFind(UI_READY_DIALOG_MINPLAYERS_INC_ID + pid + "_BORDER");
    addCenteredButtonText(
        UI_READY_DIALOG_MINPLAYERS_INC_LABEL_ID + pid,
        READY_DIALOG_SMALL_BUTTON_WIDTH,
        READY_DIALOG_SMALL_BUTTON_HEIGHT,
        mod.stringkeys.twl.ui.plus,
        player,
        minPlayersIncBorder ?? baseContainer,
        14
    );

    const modeGameDecBorder = safeFind(UI_READY_DIALOG_MODE_GAME_DEC_ID + pid + "_BORDER");
    addCenteredButtonText(
        UI_READY_DIALOG_MODE_GAME_DEC_LABEL_ID + pid,
        READY_DIALOG_SMALL_BUTTON_WIDTH,
        READY_DIALOG_SMALL_BUTTON_HEIGHT,
        mod.stringkeys.twl.ui.left,
        player,
        modeGameDecBorder ?? baseContainer,
        14
    );
    const modeGameIncBorder = safeFind(UI_READY_DIALOG_MODE_GAME_INC_ID + pid + "_BORDER");
    addCenteredButtonText(
        UI_READY_DIALOG_MODE_GAME_INC_LABEL_ID + pid,
        READY_DIALOG_SMALL_BUTTON_WIDTH,
        READY_DIALOG_SMALL_BUTTON_HEIGHT,
        mod.stringkeys.twl.ui.right,
        player,
        modeGameIncBorder ?? baseContainer,
        14
    );

    const modeSettingsDecBorder = safeFind(UI_READY_DIALOG_MODE_SETTINGS_DEC_ID + pid + "_BORDER");
    addCenteredButtonText(
        UI_READY_DIALOG_MODE_SETTINGS_DEC_LABEL_ID + pid,
        READY_DIALOG_SMALL_BUTTON_WIDTH,
        READY_DIALOG_SMALL_BUTTON_HEIGHT,
        mod.stringkeys.twl.ui.left,
        player,
        modeSettingsDecBorder ?? baseContainer,
        14
    );
    const modeSettingsIncBorder = safeFind(UI_READY_DIALOG_MODE_SETTINGS_INC_ID + pid + "_BORDER");
    addCenteredButtonText(
        UI_READY_DIALOG_MODE_SETTINGS_INC_LABEL_ID + pid,
        READY_DIALOG_SMALL_BUTTON_WIDTH,
        READY_DIALOG_SMALL_BUTTON_HEIGHT,
        mod.stringkeys.twl.ui.right,
        player,
        modeSettingsIncBorder ?? baseContainer,
        14
    );

    const vehiclesT1DecBorder = safeFind(UI_READY_DIALOG_MODE_VEHICLES_T1_DEC_ID + pid + "_BORDER");
    addCenteredButtonText(
        UI_READY_DIALOG_MODE_VEHICLES_T1_DEC_LABEL_ID + pid,
        READY_DIALOG_SMALL_BUTTON_WIDTH,
        READY_DIALOG_SMALL_BUTTON_HEIGHT,
        mod.stringkeys.twl.ui.left,
        player,
        vehiclesT1DecBorder ?? baseContainer,
        14
    );
    const vehiclesT1IncBorder = safeFind(UI_READY_DIALOG_MODE_VEHICLES_T1_INC_ID + pid + "_BORDER");
    addCenteredButtonText(
        UI_READY_DIALOG_MODE_VEHICLES_T1_INC_LABEL_ID + pid,
        READY_DIALOG_SMALL_BUTTON_WIDTH,
        READY_DIALOG_SMALL_BUTTON_HEIGHT,
        mod.stringkeys.twl.ui.right,
        player,
        vehiclesT1IncBorder ?? baseContainer,
        14
    );

    const vehiclesT2DecBorder = safeFind(UI_READY_DIALOG_MODE_VEHICLES_T2_DEC_ID + pid + "_BORDER");
    addCenteredButtonText(
        UI_READY_DIALOG_MODE_VEHICLES_T2_DEC_LABEL_ID + pid,
        READY_DIALOG_SMALL_BUTTON_WIDTH,
        READY_DIALOG_SMALL_BUTTON_HEIGHT,
        mod.stringkeys.twl.ui.left,
        player,
        vehiclesT2DecBorder ?? baseContainer,
        14
    );
    const vehiclesT2IncBorder = safeFind(UI_READY_DIALOG_MODE_VEHICLES_T2_INC_ID + pid + "_BORDER");
    addCenteredButtonText(
        UI_READY_DIALOG_MODE_VEHICLES_T2_INC_LABEL_ID + pid,
        READY_DIALOG_SMALL_BUTTON_WIDTH,
        READY_DIALOG_SMALL_BUTTON_HEIGHT,
        mod.stringkeys.twl.ui.right,
        player,
        vehiclesT2IncBorder ?? baseContainer,
        14
    );

    const confirmBorder = safeFind(UI_READY_DIALOG_MODE_CONFIRM_ID + pid + "_BORDER");
    addCenteredButtonText(
        UI_READY_DIALOG_MODE_CONFIRM_LABEL_ID + pid,
        READY_DIALOG_CONFIRM_BUTTON_WIDTH,
        READY_DIALOG_SMALL_BUTTON_HEIGHT,
        mod.stringkeys.twl.readyDialog.confirmSettingsLabel,
        player,
        confirmBorder ?? baseContainer,
        12
    );
    const resetBorder = safeFind(UI_READY_DIALOG_MODE_RESET_ID + pid + "_BORDER");
    addCenteredButtonText(
        UI_READY_DIALOG_MODE_RESET_LABEL_ID + pid,
        READY_DIALOG_RESET_BUTTON_WIDTH,
        READY_DIALOG_SMALL_BUTTON_HEIGHT,
        mod.stringkeys.twl.readyDialog.resetSettingsLabel,
        player,
        resetBorder ?? baseContainer,
        12
    );
}

// Safely resolve a Player by pid (mod.GetObjId(player)). Returns undefined if not found.
function safeFindPlayer(pid: number): mod.Player | undefined {
    try {
        const players = mod.AllPlayers();
        const count = mod.CountOf(players);
        for (let i = 0; i < count; i++) {
            const p = mod.ValueInArray(players, i) as mod.Player;
            if (!p || !mod.IsPlayerValid(p)) continue;
        if (mod.GetObjId(p) === pid) return p;
    }
    return undefined;
    } catch {
        return undefined;
    }
}

//#endregion ----------------- Shared ID helpers --------------------



//#region -------------------- HUD Types + Caches --------------------

// We build HUD per-player (playerId receiver) and suffix names with pid to avoid collisions.
type HudRefs = {
    pid: number;

    // Counter text widgets (we only need to update these)
    roundCurText?: mod.UIWidget;
    roundMaxText?: mod.UIWidget;

    leftWinsText?: mod.UIWidget;
    rightWinsText?: mod.UIWidget;

    leftRecordText?: mod.UIWidget;
    rightRecordText?: mod.UIWidget;

    leftRoundKillsText?: mod.UIWidget;
    rightRoundKillsText?: mod.UIWidget;
    leftRoundKillsLabel?: mod.UIWidget;
    rightRoundKillsLabel?: mod.UIWidget;
    leftVehiclesAliveText?: mod.UIWidget;
    rightVehiclesAliveText?: mod.UIWidget;
    leftRoundKillsCrown?: mod.UIWidget;
    rightRoundKillsCrown?: mod.UIWidget;
    leftTrendingWinnerCrown?: mod.UIWidget;
    rightTrendingWinnerCrown?: mod.UIWidget;

    leftKillsText?: mod.UIWidget;
    rightKillsText?: mod.UIWidget;

    settingsGameModeText?: mod.UIWidget;
    settingsAircraftCeilingText?: mod.UIWidget;
    settingsVehiclesT1Text?: mod.UIWidget;
    settingsVehiclesT2Text?: mod.UIWidget;
    settingsVehiclesMatchupText?: mod.UIWidget;
    settingsPlayersText?: mod.UIWidget;

    // Victory results dialog widgets (shown during match end countdown)
    victoryRoot?: mod.UIWidget;
    victoryRestartText?: mod.UIWidget;
    victoryTimeHoursTens?: mod.UIWidget;
    victoryTimeHoursOnes?: mod.UIWidget;
    victoryTimeMinutesTens?: mod.UIWidget;
    victoryTimeMinutesOnes?: mod.UIWidget;
    victoryTimeSecondsTens?: mod.UIWidget;
    victoryTimeSecondsOnes?: mod.UIWidget;
    victoryRoundsSummaryText?: mod.UIWidget;
    victoryAdminActionsText?: mod.UIWidget;

    victoryLeftOutcomeText?: mod.UIWidget;
    victoryLeftRecordText?: mod.UIWidget;
    victoryLeftRoundWinsText?: mod.UIWidget;
    victoryLeftRoundLossesText?: mod.UIWidget;
    victoryLeftRoundTiesText?: mod.UIWidget;
    victoryLeftTotalKillsText?: mod.UIWidget;
    victoryLeftCrown?: mod.UIWidget;
    victoryLeftRosterText?: Array<mod.UIWidget | undefined>;

    victoryRightOutcomeText?: mod.UIWidget;
    victoryRightRecordText?: mod.UIWidget;
    victoryRightRoundWinsText?: mod.UIWidget;
    victoryRightRoundLossesText?: mod.UIWidget;
    victoryRightRoundTiesText?: mod.UIWidget;
    victoryRightTotalKillsText?: mod.UIWidget;
    victoryRightCrown?: mod.UIWidget;
    victoryRightRosterText?: Array<mod.UIWidget | undefined>;
    victoryRosterRow?: mod.UIWidget;
    victoryRosterLeftContainer?: mod.UIWidget;
    victoryRosterRightContainer?: mod.UIWidget;

    // Round-end dialog widgets (shown during the round-end redeploy window)
    roundEndRoot?: mod.UIWidget;
    roundEndRoundText?: mod.UIWidget;
    roundEndOutcomeText?: mod.UIWidget;
    roundEndDetailText?: mod.UIWidget;
    adminPanelActionCountText?: mod.UIWidget;

    helpTextContainer?: mod.UIWidget;
    readyStatusContainer?: mod.UIWidget;

    spawnDisabledLiveText?: mod.UIWidget;

    // Optional roots (for cleanup if needed)
    roots: mod.UIWidget[];
};

//#endregion ----------------- HUD Types + Caches --------------------



//#region -------------------- Game State Definition --------------------

// Overtime UI widget caches (per-player). These mirror the HUD caching pattern used elsewhere.
type OvertimeFlagHudRefs = {
    root?: mod.UIWidget;
    title?: mod.UIWidget;
    titleShadow?: mod.UIWidget;
    status?: mod.UIWidget;
    statusShadow?: mod.UIWidget;
    countsLeft?: mod.UIWidget;
    countsRight?: mod.UIWidget;
    countsLeftBorder?: mod.UIWidget;
    countsRightBorder?: mod.UIWidget;
    percentLeftBg?: mod.UIWidget;
    percentRightBg?: mod.UIWidget;
    percentLeft?: mod.UIWidget;
    percentRight?: mod.UIWidget;
    countsLeftCrown?: mod.UIWidget;
    countsRightCrown?: mod.UIWidget;
    barBg?: mod.UIWidget;
    barFillT1?: mod.UIWidget;
    barFillT2?: mod.UIWidget;
    vehicleRequired?: mod.UIWidget;
};

type OvertimeFlagGlobalHudRefs = {
    root?: mod.UIWidget;
    title?: mod.UIWidget;
    barBg?: mod.UIWidget;
    barFillT1?: mod.UIWidget;
    barFillT2?: mod.UIWidget;
};

// Tracks zone membership for UI updates + vehicle dedupe (vehicleObjId = 0 when on foot).
type OvertimeFlagPlayerZoneState = {
    playerObjId: number;
    teamId: TeamID | 0;
    vehicleObjId: number;
};

// Last rendered values for in-zone HUD updates (avoid per-tick UI churn).
type OvertimeFlagUiSnapshot = {
    progressPercent: number;
    leftPercent: number;
    rightPercent: number;
    barFillT1Width: number;
    barFillT2Width: number;
    t1Count: number;
    t2Count: number;
    statusKey: number;
    statusValue: number;
    statusVisible: boolean;
    titleKey: number;
    titleValue: number;
    countsVisible: boolean;
    countsUseX: boolean;
    leftBorderVisible: boolean;
    rightBorderVisible: boolean;
    vehicleRequiredVisible: boolean;
};

type VehicleSpawnerSlot = {
    teamId: TeamID;
    slotNumber: number;
    spawner: mod.VehicleSpawner;
    spawnerObjId: number;
    spawnPos: mod.Vector;
    spawnRot: mod.Vector;
    vehicleType: mod.VehicleList;
    enabled: boolean;
    enableToken: number;
    spawnRequestToken: number;
    spawnRequestAtSeconds: number;
    expectingSpawn: boolean;
    vehicleId: number;
    respawnRunning: boolean;
    spawnRetryScheduled: boolean;
};

// GameState centralizes all mutable match/round/UI state so writes are explicit and searchable.
interface GameState {
    round: {
        current: number;
        max: number;
        killsTarget: number;
        autoStartMinActivePlayers: number;
        matchupPresetIndex: number;
        lastMatchupChangeAtSeconds: number;
        modeConfig: ReadyDialogModeConfig;
        phase: RoundPhase;
        lastWinnerTeam: TeamID | 0;
        lastEndDetailReason: RoundEndDetailReason;
        lastObjectiveProgress: number;
        clock: {
            durationSeconds: number;
            roundLengthSeconds: number;
            matchStartElapsedSeconds?: number;
            pausedRemainingSeconds?: number;
            isPaused: boolean;
            lastDisplayedSeconds?: number;
            lastLowTimeState?: boolean;
            expiryFired: boolean;
            expiryHandlers: Array<() => void>;
        };
        // cleanupActive gates deploy/UI during round-end reset; cleanupAllowDeploy temporarily overrides.
        flow: {
            roundEndRedeployToken: number;
            clockExpiryBound: boolean;
            cleanupActive: boolean;
            cleanupAllowDeploy: boolean;
            roundEndDialogVisible: boolean;
            // Locks overtime/HUD UI updates once a round ends to avoid UI calls during teardown.
            roundEndUiLockdown: boolean;
        };
        countdown: {
            isActive: boolean;
            isRequested: boolean;
            token: number;
            overLineMessageToken: number;
        };
        aircraftCeiling: {
            mapDefaultHudCeiling: number;
            hudMaxY: number;
            hudFloorY: number;
            customEnabled: boolean;
            enforcementToken: number;
            vehicleStates: Record<number, AircraftCeilingVehicleState>;
        };
    };
    // Overtime flag capture state (reset on round start/end).
    // Progress is 0..1 (0 = Team2 owns, 1 = Team1 owns, 0.5 = neutral).
    // t1Count/t2Count track unique vehicles in the zone (not player count).
    flag: {
        stage: OvertimeStage;
        active: boolean;
        trackingEnabled: boolean;
        unlockReminderSent: boolean;
        configValid: boolean;
        // True only when an admin override actually selects the zone for this round.
        overrideUsedThisRound: boolean;
        tieBreakerEnabledThisRound: boolean;
        candidateZones: OvertimeZoneCandidate[];
        activeAreaTriggerId?: number;
        activeAreaTrigger?: mod.AreaTrigger;
        activeSectorId?: number;
        activeSector?: mod.Sector;
        activeWorldIconId?: number;
        activeWorldIcon?: mod.WorldIcon;
        activeCapturePointId?: number;
        activeCapturePoint?: mod.CapturePoint;
        activeCandidateIndex?: number;
        // Cached string key for the selected zone letter (A-G).
        selectedZoneLetterKey?: number;
        ownerTeam: TeamID | 0;
        progress: number;
        t1Count: number;
        t2Count: number;
        playersInZoneByPid: Record<number, OvertimeFlagPlayerZoneState>;
        vehicleOccupantsByVid: Record<number, number>;
        vehicleTeamByVid: Record<number, TeamID>;
        lastUiSnapshotByPid: Record<number, OvertimeFlagUiSnapshot>;
        lastGlobalProgressPercent: number;
        lastMembershipPruneAtSeconds: number;
        uiByPid: Record<number, OvertimeFlagHudRefs>;
        globalUiByPid: Record<number, OvertimeFlagGlobalHudRefs>;
        tickToken: number;
        tickActive: boolean;
    };
    scores: {
        t1RoundKills: number;
        t2RoundKills: number;
        t1TotalKills: number;
        t2TotalKills: number;
    };
    match: {
        winsT1: number;
        winsT2: number;
        lossesT1: number;
        lossesT2: number;
        tiesT1: number;
        tiesT2: number;
        isEnded: boolean;
        victoryDialogActive: boolean;
        winnerTeam?: TeamID | 0;
        endElapsedSecondsSnapshot: number;
        victoryStartElapsedSecondsSnapshot: number;
        flow: {
            matchEndDelayToken: number;
        };
    };
    admin: {
        actionCount: number;
        debugLoopActive: boolean;
        tieBreakerOverrideIndex?: number;
        // Match-level flag if any tie-breaker override was used.
        tieBreakerOverrideUsed: boolean;
        tieBreakerModeIndex: number;
        liveRespawnEnabled: boolean;
    };
    debug: {
        highlightedMessageCount: number;
        lastHighlightedMessageAtSeconds: number;
        lastHighlightedMessageKey: number;
    };
    players: {
        teamSwitchData: Record<number, teamSwitchData_t>;
        readyByPid: Record<number, boolean>;
        autoReadyByPid: Record<number, boolean>;
        readyMessageCooldownByPid: Record<number, number>;
        // Join-time prompt: only once per player, regardless of undeploy repeats.
        joinPromptShownByPid: Record<number, boolean>;
        // "Never Show Again" is stored per map so other maps can still show the prompt.
        joinPromptNeverShowByPidMap: Record<number, Partial<Record<MapKey, boolean>>>;
        // Join prompt sequencing (tips + unlock tracking).
        joinPromptReadyDialogOpenedByPid: Record<number, boolean>;
        joinPromptTipIndexByPid: Record<number, number>;
        joinPromptTipsUnlockedByPid: Record<number, boolean>;
        joinPromptTripleTapArmedByPid: Record<number, boolean>;
        inMainBaseByPid: Record<number, boolean>;
        overTakeoffLimitByPid: Record<number, boolean>;
        deployedByPid: Record<number, boolean>;
        disconnectedByPid: Record<number, boolean>;
        uiInputEnabledByPid: Record<number, boolean>;
        spawnDisabledWarningVisibleByPid: Record<number, boolean>;
    };
    vehicles: {
        slots: VehicleSpawnerSlot[];
        vehicleToSlot: Record<number, number>;
        spawnSequenceToken: number;
        spawnSequenceInProgress: boolean;
        activeSpawnSlotIndex?: number;
        activeSpawnToken?: number;
        activeSpawnRequestedAtSeconds?: number;
        configReady: boolean;
        startupCleanupDone: boolean;
    };
    hudCache: {
        lastHudScoreT1?: number;
        lastHudScoreT2?: number;
        lastHudRoundKillsT1?: number;
        lastHudRoundKillsT2?: number;
        hudByPid: Record<number, HudRefs>;
        clockWidgetCache: Record<number, ClockWidgetCacheEntry>;
        countdownWidgetCache: Record<number, CountdownWidgetCacheEntry>;
        overLineTitleWidgetCache: Record<number, CountdownWidgetCacheEntry>;
        overLineSubtitleWidgetCache: Record<number, CountdownWidgetCacheEntry>;
        overLineTitleShadowWidgetCache: Record<number, CountdownWidgetCacheEntry>;
        overLineSubtitleShadowWidgetCache: Record<number, CountdownWidgetCacheEntry>;
    };
}

// -------------------- Authoritative State Map --------------------
//
// Round state (resets at round start):
// - State.round.current: current round index (1-based display).
// - State.round.max: number of rounds in the match.
// - State.scores.t1RoundKills / State.scores.t2RoundKills: points earned this round by each team.
// - State.round.killsTarget: points needed to win the round.
// - State.round.phase: RoundPhase.NotReady | RoundPhase.Live | RoundPhase.GameOver.
// - State.round.clock.durationSeconds: authoritative remaining seconds in the round.
// - State.round.clock.roundLengthSeconds: round-start duration used for half-time reveal thresholds.
//
// Match state (resets at match start):
// - State.match.winsT1/T2, State.match.lossesT1/T2, State.match.tiesT1/T2: match record across rounds.
// - State.match.isEnded: indicates match is over and victory dialog should be shown.
//
// Vehicle registration (persists across round transitions unless explicitly cleared):
// - regVehiclesTeam1 (GlobalVariable 0): array of vehicles registered to Team 1.
// - regVehiclesTeam2 (GlobalVariable 1): array of vehicles registered to Team 2.
// - vehIds/vehOwners: best-effort 'last driver' mapping used for messages only.
//
// UI caches (per-player, rebuilt as needed):
// - State.hudCache.hudByPid[pid]: cached HUD widget references.
// - dialog/widget caches: cached references to modal UI elements (team switch, victory, clock digits).
//
// ------------------------------------------------------------------

// Centralized mutable state for match/round flow and UI caches.
const State: GameState = {
    round: {
        current: 1,
        max: MAX_ROUNDS,
        killsTarget: ROUND_KILLS_TARGET,
        autoStartMinActivePlayers: DEFAULT_AUTO_START_MIN_ACTIVE_PLAYERS,
        matchupPresetIndex: DEFAULT_MATCHUP_PRESET_INDEX,
        lastMatchupChangeAtSeconds: -999,
        modeConfig: {
            gameModeIndex: READY_DIALOG_GAME_MODE_DEFAULT_INDEX,
            aircraftCeiling: READY_DIALOG_AIRCRAFT_CEILING_DEFAULT,
            aircraftCeilingOverridePending: false,
            vehicleIndexT1: READY_DIALOG_VEHICLE_T1_DEFAULT_INDEX,
            vehicleIndexT2: READY_DIALOG_VEHICLE_T2_DEFAULT_INDEX,
            gameMode: READY_DIALOG_GAME_MODE_OPTIONS[READY_DIALOG_GAME_MODE_DEFAULT_INDEX],
            gameSettings: mod.stringkeys.twl.readyDialog.modeSettingAircraftCeilingFormat,
            vehiclesT1: READY_DIALOG_VEHICLE_OPTIONS[READY_DIALOG_VEHICLE_T1_DEFAULT_INDEX],
            vehiclesT2: READY_DIALOG_VEHICLE_OPTIONS[READY_DIALOG_VEHICLE_T2_DEFAULT_INDEX],
            confirmed: {
                gameMode: READY_DIALOG_GAME_MODE_OPTIONS[READY_DIALOG_GAME_MODE_DEFAULT_INDEX],
                gameSettings: mod.stringkeys.twl.readyDialog.modeSettingAircraftCeilingFormat,
                vehiclesT1: READY_DIALOG_VEHICLE_OPTIONS[READY_DIALOG_VEHICLE_T1_DEFAULT_INDEX],
                vehiclesT2: READY_DIALOG_VEHICLE_OPTIONS[READY_DIALOG_VEHICLE_T2_DEFAULT_INDEX],
                aircraftCeiling: READY_DIALOG_AIRCRAFT_CEILING_DEFAULT,
                aircraftCeilingOverrideEnabled: false,
                vehicleIndexT1: READY_DIALOG_VEHICLE_T1_DEFAULT_INDEX,
                vehicleIndexT2: READY_DIALOG_VEHICLE_T2_DEFAULT_INDEX,
                vehicleOverrideEnabled: false,
            },
        },
        phase: RoundPhase.NotReady,
        lastWinnerTeam: 0,
        lastEndDetailReason: RoundEndDetailReason.None,
        lastObjectiveProgress: 0.5,
        clock: {
            durationSeconds: ROUND_CLOCK_DEFAULT_SECONDS,
            roundLengthSeconds: ROUND_CLOCK_DEFAULT_SECONDS,
            matchStartElapsedSeconds: undefined,
            pausedRemainingSeconds: undefined,
            isPaused: false,
            lastDisplayedSeconds: undefined,
            lastLowTimeState: undefined,
            expiryFired: false,
            expiryHandlers: [],
        },
        flow: {
            roundEndRedeployToken: 0,
            clockExpiryBound: false,
            cleanupActive: false,
            cleanupAllowDeploy: false,
            roundEndDialogVisible: false,
            roundEndUiLockdown: false,
        },
        countdown: {
            isActive: false,
            isRequested: false,
            token: 0,
            overLineMessageToken: 0,
        },
        aircraftCeiling: {
            mapDefaultHudCeiling: READY_DIALOG_AIRCRAFT_CEILING_DEFAULT,
            hudMaxY: READY_DIALOG_AIRCRAFT_CEILING_DEFAULT,
            hudFloorY: 0,
            customEnabled: false,
            enforcementToken: 0,
            vehicleStates: {},
        },
    },
    flag: {
        stage: OvertimeStage.None,
        active: false,
        trackingEnabled: false,
        unlockReminderSent: false,
        configValid: false,
        overrideUsedThisRound: false,
        tieBreakerEnabledThisRound: false,
        candidateZones: [],
        activeAreaTriggerId: undefined,
        activeAreaTrigger: undefined,
        activeSectorId: undefined,
        activeSector: undefined,
        activeWorldIconId: undefined,
        activeWorldIcon: undefined,
        activeCapturePointId: undefined,
        activeCapturePoint: undefined,
        activeCandidateIndex: undefined,
        selectedZoneLetterKey: undefined,
        ownerTeam: 0,
        progress: 0.5,
        t1Count: 0,
        t2Count: 0,
        playersInZoneByPid: {},
        vehicleOccupantsByVid: {},
        vehicleTeamByVid: {},
        lastUiSnapshotByPid: {},
        lastGlobalProgressPercent: -1,
        lastMembershipPruneAtSeconds: 0,
        uiByPid: {},
        globalUiByPid: {},
        tickToken: 0,
        tickActive: false,
    },
    scores: {
        t1RoundKills: 0,
        t2RoundKills: 0,
        t1TotalKills: 0,
        t2TotalKills: 0,
    },
    match: {
        winsT1: 0,
        winsT2: 0,
        lossesT1: 0,
        lossesT2: 0,
        tiesT1: 0,
        tiesT2: 0,
        isEnded: false,
        victoryDialogActive: false,
        winnerTeam: undefined,
        endElapsedSecondsSnapshot: 0,
        victoryStartElapsedSecondsSnapshot: 0,
        flow: {
            matchEndDelayToken: 0,
        },
    },
    admin: {
        actionCount: 0,
        debugLoopActive: false,
        tieBreakerOverrideIndex: undefined,
        tieBreakerOverrideUsed: false,
        tieBreakerModeIndex: ADMIN_TIEBREAKER_MODE_DEFAULT_INDEX,
        liveRespawnEnabled: DEFAULT_LIVE_RESPAWN_ENABLED,
    },
    debug: {
        highlightedMessageCount: 0,
        lastHighlightedMessageAtSeconds: -1,
        lastHighlightedMessageKey: -1,
    },
    players: {
        teamSwitchData: {},
        readyByPid: {},
        autoReadyByPid: {},
        readyMessageCooldownByPid: {},
        joinPromptShownByPid: {},
        joinPromptNeverShowByPidMap: {},
        joinPromptReadyDialogOpenedByPid: {},
        joinPromptTipIndexByPid: {},
        joinPromptTipsUnlockedByPid: {},
        joinPromptTripleTapArmedByPid: {},
        inMainBaseByPid: {},
        overTakeoffLimitByPid: {},
        deployedByPid: {},
        disconnectedByPid: {},
        uiInputEnabledByPid: {},
        spawnDisabledWarningVisibleByPid: {},
    },
    vehicles: {
        slots: [],
        vehicleToSlot: {},
        spawnSequenceToken: 0,
        spawnSequenceInProgress: false,
        activeSpawnSlotIndex: undefined,
        activeSpawnToken: undefined,
        activeSpawnRequestedAtSeconds: undefined,
        configReady: false,
        startupCleanupDone: false,
    },
    hudCache: {
        lastHudScoreT1: undefined,
        lastHudScoreT2: undefined,
        lastHudRoundKillsT1: undefined,
        lastHudRoundKillsT2: undefined,
        hudByPid: {},
        clockWidgetCache: {},
        countdownWidgetCache: {},
        overLineTitleWidgetCache: {},
        overLineSubtitleWidgetCache: {},
        overLineTitleShadowWidgetCache: {},
        overLineSubtitleShadowWidgetCache: {},
    },
};

//#endregion ----------------- Game State Definition --------------------
