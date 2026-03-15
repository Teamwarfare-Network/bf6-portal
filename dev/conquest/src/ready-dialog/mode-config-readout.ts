// @ts-nocheck
// Module: ready-dialog/mode-config-readout -- ready dialog map/mode readout label updates

//#region -------------------- Ready Dialog - Map/Mode Config UI Readout --------------------

function updateReadyDialogMapLabelForPid(pid: number): void {
    const valueId = UI_READY_DIALOG_MAP_VALUE_ID + pid;
    const valueWidget = safeFind(valueId);
    if (!valueWidget) return;
    mod.SetUITextLabel(valueWidget, mod.Message(getMapNameKey(ACTIVE_MAP_KEY)));
}

// Refreshes the map label/value pair for all connected players.
function updateReadyDialogMapLabelForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        updateReadyDialogMapLabelForPid(mod.GetObjId(p));
    }
}

function updateReadyDialogGridColumnHeaderForPid(pid: number, columnKey: string, label: mod.Message): void {
    const widget = safeFind(UI_READY_DIALOG_MODE_GRID_COLUMN_HEADER_ID + columnKey + "_" + pid);
    if (!widget) return;
    mod.SetUITextLabel(widget, label);
}

function updateReadyDialogGridKnobLabelForPid(pid: number, knobKey: string, labelKey: number): void {
    const widget = safeFind(UI_READY_DIALOG_MODE_GRID_KNOB_LABEL_ID + knobKey + "_" + pid);
    if (!widget) return;
    mod.SetUITextLabel(widget, mod.Message(labelKey));
}

function updateReadyDialogGridKnobValueForPid(pid: number, knobKey: string, label: mod.Message): void {
    const widget = safeFind(UI_READY_DIALOG_MODE_GRID_KNOB_VALUE_ID + knobKey + "_" + pid);
    if (!widget) return;
    mod.SetUITextLabel(widget, label);
}

function updateReadyDialogGridSupportForPid(pid: number, columnKey: string, label: mod.Message): void {
    const widget = safeFind(UI_READY_DIALOG_MODE_GRID_SUPPORT_ID + columnKey + "_" + pid);
    if (!widget) return;
    mod.SetUITextLabel(widget, label);
}

function setReadyDialogGridColumnHeaderColorForPid(pid: number, columnKey: string, color: mod.Vector): void {
    const widget = safeFind(UI_READY_DIALOG_MODE_GRID_COLUMN_HEADER_ID + columnKey + "_" + pid);
    if (!widget) return;
    mod.SetUITextColor(widget, color);
}

function setReadyDialogGridKnobPanelThemeForPid(
    pid: number,
    knobKey: string,
    color: mod.Vector,
    alpha: number
): void {
    const widget = safeFind(UI_READY_DIALOG_MODE_GRID_KNOB_PANEL_ID + knobKey + "_" + pid);
    if (!widget) return;
    mod.SetUIWidgetBgColor(widget, color);
    mod.SetUIWidgetBgAlpha(widget, alpha);
}

function setReadyDialogGridKnobButtonGlyphColorForPid(pid: number, knobKey: string, color: mod.Vector): void {
    const decLabel = safeFind(UI_READY_DIALOG_MODE_GRID_KNOB_DEC_LABEL_ID + knobKey + "_" + pid);
    const incLabel = safeFind(UI_READY_DIALOG_MODE_GRID_KNOB_INC_LABEL_ID + knobKey + "_" + pid);
    if (decLabel) mod.SetUITextColor(decLabel, color);
    if (incLabel) mod.SetUITextColor(incLabel, color);
}

function getReadyDialogViewerTeamVisuals(pid: number): {
    team1Text: mod.Vector;
    team2Text: mod.Vector;
    team1Bg: mod.Vector;
    team2Bg: mod.Vector;
} {
    const viewer = safeFindPlayer(pid);
    const viewerTeam = safeGetTeamNumberFromPlayer(viewer, TeamID.Team1);
    if (viewerTeam === TeamID.Team2) {
        return {
            team1Text: COLOR_RED,
            team2Text: COLOR_BLUE,
            team1Bg: COLOR_RED_DARK,
            team2Bg: COLOR_BLUE_DARK,
        };
    }
    return {
        team1Text: COLOR_BLUE,
        team2Text: COLOR_RED,
        team1Bg: COLOR_BLUE_DARK,
        team2Bg: COLOR_RED_DARK,
    };
}

function getReadyDialogModeSettingsValueMessage(cfg: ReadyDialogModeConfig): mod.Message {
    const applyCustomCeiling = shouldApplyCustomCeilingForConfig(cfg.gameMode, cfg.aircraftCeilingOverridePending);
    const ceilingValue = applyCustomCeiling
        ? Math.floor(cfg.aircraftCeiling)
        : STR_READY_DIALOG_AIRCRAFT_CEILING_VANILLA;
    return mod.Message(cfg.gameSettings, ceilingValue);
}

function getReadyDialogMatchupValueMessage(): mod.Message {
    const preset = MATCHUP_PRESETS[State.round.matchupPresetIndex] ?? MATCHUP_PRESETS[0];
    return mod.Message(mod.stringkeys.twl.readyDialog.matchupFormat, preset.leftPlayers, preset.rightPlayers);
}

function getReadyDialogPlayersValueMessage(): mod.Message {
    const counts = getAutoStartMinPlayerCounts();
    return mod.Message(mod.stringkeys.twl.readyDialog.playersFormat, counts.left, counts.right);
}

function getReadyDialogMinPlayersSupportMessage(): mod.Message {
    const counts = getAutoStartMinPlayerCounts();
    return mod.Message(mod.stringkeys.twl.readyDialog.minPlayersToStartFormat, counts.total);
}

// Updates Ready Dialog mode-setting labels/values for a specific viewer pid.
function updateReadyDialogModeConfigForPid(pid: number): void {
    const cfg = State.round.modeConfig;
    const visuals = getReadyDialogViewerTeamVisuals(pid);

    updateReadyDialogGridColumnHeaderForPid(pid, "config", mod.Message(mod.stringkeys.twl.readyDialog.configurationColumnLabel));
    updateReadyDialogGridColumnHeaderForPid(pid, "team2Air", mod.Message(mod.stringkeys.twl.readyDialog.columnAirFormat, getTeamNameKey(TeamID.Team2)));
    updateReadyDialogGridColumnHeaderForPid(pid, "team2Ground", mod.Message(mod.stringkeys.twl.readyDialog.columnGroundFormat, getTeamNameKey(TeamID.Team2)));
    updateReadyDialogGridColumnHeaderForPid(pid, "team2Fast", mod.Message(mod.stringkeys.twl.readyDialog.columnFastFormat, getTeamNameKey(TeamID.Team2)));
    updateReadyDialogGridColumnHeaderForPid(pid, "team1Air", mod.Message(mod.stringkeys.twl.readyDialog.columnAirFormat, getTeamNameKey(TeamID.Team1)));
    updateReadyDialogGridColumnHeaderForPid(pid, "team1Ground", mod.Message(mod.stringkeys.twl.readyDialog.columnGroundFormat, getTeamNameKey(TeamID.Team1)));
    updateReadyDialogGridColumnHeaderForPid(pid, "team1Fast", mod.Message(mod.stringkeys.twl.readyDialog.columnFastFormat, getTeamNameKey(TeamID.Team1)));

    updateReadyDialogGridKnobLabelForPid(pid, READY_DIALOG_CONFIG_GAME_KNOB_KEY, mod.stringkeys.twl.readyDialog.gameModeLabel);
    updateReadyDialogGridKnobLabelForPid(pid, READY_DIALOG_CONFIG_MODE_SETTINGS_KNOB_KEY, mod.stringkeys.twl.readyDialog.modeSettingsLabel);
    updateReadyDialogGridKnobLabelForPid(pid, READY_DIALOG_CONFIG_VEHICLES_KNOB_KEY, mod.stringkeys.twl.readyDialog.vehiclesCountLabel);
    const playersLabelWidget = safeFind(UI_READY_DIALOG_MODE_GRID_KNOB_LABEL_ID + READY_DIALOG_CONFIG_PLAYERS_KNOB_KEY + "_" + pid);
    if (playersLabelWidget) {
        mod.SetUITextLabel(playersLabelWidget, mod.Message(mod.stringkeys.twl.system.genericCounter, ""));
        mod.SetUIWidgetVisible(playersLabelWidget, false);
    }

    updateReadyDialogGridKnobValueForPid(pid, READY_DIALOG_CONFIG_GAME_KNOB_KEY, mod.Message(cfg.gameMode));
    updateReadyDialogGridKnobValueForPid(pid, READY_DIALOG_CONFIG_MODE_SETTINGS_KNOB_KEY, getReadyDialogModeSettingsValueMessage(cfg));
    updateReadyDialogGridKnobValueForPid(pid, READY_DIALOG_CONFIG_VEHICLES_KNOB_KEY, getReadyDialogMatchupValueMessage());
    updateReadyDialogGridKnobValueForPid(pid, READY_DIALOG_CONFIG_PLAYERS_KNOB_KEY, getReadyDialogPlayersValueMessage());
    updateReadyDialogGridSupportForPid(pid, "config", getReadyDialogMinPlayersSupportMessage());

    setReadyDialogGridColumnHeaderColorForPid(pid, "config", COLOR_WHITE);
    setReadyDialogGridColumnHeaderColorForPid(pid, "team1Air", visuals.team1Text);
    setReadyDialogGridColumnHeaderColorForPid(pid, "team1Ground", visuals.team1Text);
    setReadyDialogGridColumnHeaderColorForPid(pid, "team1Fast", visuals.team1Text);
    setReadyDialogGridColumnHeaderColorForPid(pid, "team2Air", visuals.team2Text);
    setReadyDialogGridColumnHeaderColorForPid(pid, "team2Ground", visuals.team2Text);
    setReadyDialogGridColumnHeaderColorForPid(pid, "team2Fast", visuals.team2Text);

    for (const knobKey of [
        READY_DIALOG_CONFIG_GAME_KNOB_KEY,
        READY_DIALOG_CONFIG_MODE_SETTINGS_KNOB_KEY,
        READY_DIALOG_CONFIG_VEHICLES_KNOB_KEY,
        READY_DIALOG_CONFIG_PLAYERS_KNOB_KEY,
    ]) {
        setReadyDialogGridKnobPanelThemeForPid(pid, knobKey, COLOR_GRAY_DARK, 0.40);
        setReadyDialogGridKnobButtonGlyphColorForPid(pid, knobKey, COLOR_WHITE);
    }

    for (const knobKey of [
        ...READY_DIALOG_TEAM1_JET_KNOB_KEYS,
        ...READY_DIALOG_TEAM1_HELI_KNOB_KEYS,
        ...READY_DIALOG_TEAM1_GROUND_KNOB_KEYS,
        ...READY_DIALOG_TEAM1_FAST_KNOB_KEYS,
    ]) {
        setReadyDialogGridKnobPanelThemeForPid(pid, knobKey, visuals.team1Bg, 0.42);
        setReadyDialogGridKnobButtonGlyphColorForPid(pid, knobKey, visuals.team1Text);
    }

    for (const knobKey of [
        ...READY_DIALOG_TEAM2_JET_KNOB_KEYS,
        ...READY_DIALOG_TEAM2_HELI_KNOB_KEYS,
        ...READY_DIALOG_TEAM2_GROUND_KNOB_KEYS,
        ...READY_DIALOG_TEAM2_FAST_KNOB_KEYS,
    ]) {
        setReadyDialogGridKnobPanelThemeForPid(pid, knobKey, visuals.team2Bg, 0.42);
        setReadyDialogGridKnobButtonGlyphColorForPid(pid, knobKey, visuals.team2Text);
    }

    const knobLabelPairs: Array<[string, number]> = [
        [READY_DIALOG_TEAM2_JET_KNOB_KEYS[0], mod.stringkeys.twl.readyDialog.jet1Label],
        [READY_DIALOG_TEAM2_JET_KNOB_KEYS[1], mod.stringkeys.twl.readyDialog.jet2Label],
        [READY_DIALOG_TEAM2_HELI_KNOB_KEYS[0], mod.stringkeys.twl.readyDialog.heli1Label],
        [READY_DIALOG_TEAM2_HELI_KNOB_KEYS[1], mod.stringkeys.twl.readyDialog.heli2Label],
        [READY_DIALOG_TEAM2_GROUND_KNOB_KEYS[0], mod.stringkeys.twl.readyDialog.tank1Label],
        [READY_DIALOG_TEAM2_GROUND_KNOB_KEYS[1], mod.stringkeys.twl.readyDialog.tank2Label],
        [READY_DIALOG_TEAM2_GROUND_KNOB_KEYS[2], mod.stringkeys.twl.readyDialog.tank3Label],
        [READY_DIALOG_TEAM2_GROUND_KNOB_KEYS[3], mod.stringkeys.twl.readyDialog.tank4Label],
        [READY_DIALOG_TEAM2_FAST_KNOB_KEYS[0], mod.stringkeys.twl.readyDialog.transport1Label],
        [READY_DIALOG_TEAM2_FAST_KNOB_KEYS[1], mod.stringkeys.twl.readyDialog.transport2Label],
        [READY_DIALOG_TEAM2_FAST_KNOB_KEYS[2], mod.stringkeys.twl.readyDialog.transport3Label],
        [READY_DIALOG_TEAM2_FAST_KNOB_KEYS[3], mod.stringkeys.twl.readyDialog.transport4Label],
        [READY_DIALOG_TEAM1_JET_KNOB_KEYS[0], mod.stringkeys.twl.readyDialog.jet1Label],
        [READY_DIALOG_TEAM1_JET_KNOB_KEYS[1], mod.stringkeys.twl.readyDialog.jet2Label],
        [READY_DIALOG_TEAM1_HELI_KNOB_KEYS[0], mod.stringkeys.twl.readyDialog.heli1Label],
        [READY_DIALOG_TEAM1_HELI_KNOB_KEYS[1], mod.stringkeys.twl.readyDialog.heli2Label],
        [READY_DIALOG_TEAM1_GROUND_KNOB_KEYS[0], mod.stringkeys.twl.readyDialog.tank1Label],
        [READY_DIALOG_TEAM1_GROUND_KNOB_KEYS[1], mod.stringkeys.twl.readyDialog.tank2Label],
        [READY_DIALOG_TEAM1_GROUND_KNOB_KEYS[2], mod.stringkeys.twl.readyDialog.tank3Label],
        [READY_DIALOG_TEAM1_GROUND_KNOB_KEYS[3], mod.stringkeys.twl.readyDialog.tank4Label],
        [READY_DIALOG_TEAM1_FAST_KNOB_KEYS[0], mod.stringkeys.twl.readyDialog.transport1Label],
        [READY_DIALOG_TEAM1_FAST_KNOB_KEYS[1], mod.stringkeys.twl.readyDialog.transport2Label],
        [READY_DIALOG_TEAM1_FAST_KNOB_KEYS[2], mod.stringkeys.twl.readyDialog.transport3Label],
        [READY_DIALOG_TEAM1_FAST_KNOB_KEYS[3], mod.stringkeys.twl.readyDialog.transport4Label],
    ];

    for (const [knobKey, labelKey] of knobLabelPairs) {
        updateReadyDialogGridKnobLabelForPid(pid, knobKey, labelKey);
        updateReadyDialogGridKnobValueForPid(
            pid,
            knobKey,
            mod.Message(
                getReadyDialogVehicleSelectionLabelKey(
                    knobKey,
                    State.round.modeConfig.vehicleSelectionIndexByKey?.[knobKey] ?? 0
                )
            )
        );
    }
}

// Updates mode-config readouts for players with an actively visible Ready Dialog.
function updateReadyDialogModeConfigForAllVisibleViewers(): void {
    for (const pidStr in State.players.readyDialogData) {
        const pid = Number(pidStr);
        const state = State.players.readyDialogData[pid];
        if (!state || !state.dialogVisible) continue;
        updateReadyDialogModeConfigForPid(pid);
    }
}

//#endregion ----------------- Ready Dialog - Map/Mode Config UI Readout --------------------
