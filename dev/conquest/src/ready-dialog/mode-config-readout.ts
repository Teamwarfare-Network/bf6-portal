// @ts-nocheck
// Module: ready-dialog/mode-config-readout -- ready dialog map/mode readout label updates

//#region -------------------- Ready Dialog - Map/Mode Config UI Readout --------------------

function updateReadyDialogMapLabelForPid(pid: number): void {
    const valueId = UI_READY_DIALOG_MAP_VALUE_ID + pid;
    const valueWidget = safeFind(valueId);
    if (!valueWidget) return;
    mod.SetUITextLabel(valueWidget, mod.Message(getMapNameKey(ACTIVE_MAP_KEY)));
}

function updateReadyDialogMapLabelForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        updateReadyDialogMapLabelForPid(mod.GetObjId(p));
    }
}

function updateReadyDialogModeConfigForPid(pid: number): void {
    const cfg = State.round.modeConfig;

    const gameLabel = safeFind(UI_READY_DIALOG_MODE_GAME_LABEL_ID + pid);
    if (gameLabel) mod.SetUITextLabel(gameLabel, mod.Message(mod.stringkeys.twl.readyDialog.gameModeLabel));
    const gameValue = safeFind(UI_READY_DIALOG_MODE_GAME_VALUE_ID + pid);
    if (gameValue) mod.SetUITextLabel(gameValue, mod.Message(cfg.gameMode));

    const settingsLabel = safeFind(UI_READY_DIALOG_MODE_SETTINGS_LABEL_ID + pid);
    if (settingsLabel) mod.SetUITextLabel(settingsLabel, mod.Message(mod.stringkeys.twl.readyDialog.modeSettingsLabel));
    const settingsValue = safeFind(UI_READY_DIALOG_MODE_SETTINGS_VALUE_ID + pid);
    if (settingsValue) {
        const applyCustomCeiling = shouldApplyCustomCeilingForConfig(cfg.gameMode, cfg.aircraftCeilingOverridePending);
        const ceilingValue = applyCustomCeiling
            ? Math.floor(cfg.aircraftCeiling)
            : STR_READY_DIALOG_AIRCRAFT_CEILING_VANILLA;
        mod.SetUITextLabel(
            settingsValue,
            mod.Message(cfg.gameSettings, ceilingValue)
        );
    }

    const vehiclesT1Label = safeFind(UI_READY_DIALOG_MODE_VEHICLES_T1_LABEL_ID + pid);
    if (vehiclesT1Label) {
        mod.SetUITextLabel(
            vehiclesT1Label,
            mod.Message(mod.stringkeys.twl.readyDialog.vehiclesLabelFormat, getTeamNameKey(TeamID.Team1))
        );
    }
    const vehiclesT1Value = safeFind(UI_READY_DIALOG_MODE_VEHICLES_T1_VALUE_ID + pid);
    if (vehiclesT1Value) mod.SetUITextLabel(vehiclesT1Value, mod.Message(cfg.vehiclesT1));

    const vehiclesT2Label = safeFind(UI_READY_DIALOG_MODE_VEHICLES_T2_LABEL_ID + pid);
    if (vehiclesT2Label) {
        mod.SetUITextLabel(
            vehiclesT2Label,
            mod.Message(mod.stringkeys.twl.readyDialog.vehiclesLabelFormat, getTeamNameKey(TeamID.Team2))
        );
    }
    const vehiclesT2Value = safeFind(UI_READY_DIALOG_MODE_VEHICLES_T2_VALUE_ID + pid);
    if (vehiclesT2Value) mod.SetUITextLabel(vehiclesT2Value, mod.Message(cfg.vehiclesT2));
}

function updateReadyDialogModeConfigForAllVisibleViewers(): void {
    for (const pidStr in State.players.readyDialogData) {
        const pid = Number(pidStr);
        const state = State.players.readyDialogData[pid];
        if (!state || !state.dialogVisible) continue;
        updateReadyDialogModeConfigForPid(pid);
    }
}

//#endregion ----------------- Ready Dialog - Map/Mode Config UI Readout --------------------
