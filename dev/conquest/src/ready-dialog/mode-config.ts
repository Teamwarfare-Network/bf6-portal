// @ts-nocheck
// Module: ready-dialog/mode-config -- map/mode settings readout, aircraft ceiling, and preset confirmation

//#region -------------------- Ready Dialog - Map/Mode Config UI Readout --------------------

// Updates the Ready Dialog match-length label ("Best of {0} Rounds") for a single viewer.
function updateBestOfRoundsLabelForPid(pid: number): void {
    const labelId = UI_READY_DIALOG_BESTOF_LABEL_ID + pid;
    const labelWidget = safeFind(labelId);
    if (!labelWidget) return;
    mod.SetUITextLabel(labelWidget, mod.Message(mod.stringkeys.twl.readyDialog.bestOfLabel, Math.floor(State.round.max)));
}

function updateBestOfRoundsLabelForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        updateBestOfRoundsLabelForPid(mod.GetObjId(p));
    }
}

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
    for (const pidStr in State.players.teamSwitchData) {
        const pid = Number(pidStr);
        const state = State.players.teamSwitchData[pid];
        if (!state || !state.dialogVisible) continue;
        updateReadyDialogModeConfigForPid(pid);
    }
}

//#endregion ----------------- Ready Dialog - Map/Mode Config UI Readout --------------------



//#region -------------------- Aircraft Ceiling (Hard Enforcement) --------------------

// Engine limiter expects a world-Y scale; convert HUD ceiling using the map's HUD floor/max offsets.
function applyCustomAircraftCeilingHardLimiter(): void {
    const floorY = Math.floor(State.round.aircraftCeiling.hudFloorY);
    const baseHud = Math.max(1, Math.floor(State.round.aircraftCeiling.hudMaxY));
    const targetHud = Math.max(1, Math.floor(State.round.modeConfig.confirmed.aircraftCeiling));
    // Convert HUD ceiling to world Y using the map-specific HUD floor offset.
    const baseWorldY = Math.max(1, floorY + baseHud);
    const targetWorldY = Math.max(1, floorY + targetHud);
    const scale = targetWorldY / baseWorldY;
    mod.SetMaxVehicleHeightLimitScale(scale);
}

function enableCustomAircraftCeiling(): void {
    State.round.aircraftCeiling.customEnabled = true;
    State.round.aircraftCeiling.vehicleStates = {};
}

function disableCustomAircraftCeilingAndRestoreDefault(): void {
    State.round.aircraftCeiling.customEnabled = false;
    State.round.aircraftCeiling.vehicleStates = {};
    State.round.modeConfig.aircraftCeiling = State.round.aircraftCeiling.mapDefaultHudCeiling;
    State.round.modeConfig.gameSettings = mod.stringkeys.twl.readyDialog.modeSettingAircraftCeilingFormat;
    State.round.modeConfig.confirmed.aircraftCeiling = State.round.aircraftCeiling.mapDefaultHudCeiling;
    mod.SetMaxVehicleHeightLimitScale(1.0);
    updateReadyDialogModeConfigForAllVisibleViewers();
}

function syncAircraftCeilingFromMapConfig(): void {
    const mapDefault = Math.max(1, Math.floor(ACTIVE_MAP_CONFIG.aircraftCeiling));
    const mapMaxHud = Math.max(1, Math.floor(ACTIVE_MAP_CONFIG.hudMaxY));
    const floorY = Math.floor(ACTIVE_MAP_CONFIG.hudFloorY);
    State.round.aircraftCeiling.mapDefaultHudCeiling = mapDefault;
    State.round.aircraftCeiling.hudMaxY = mapMaxHud;
    State.round.aircraftCeiling.hudFloorY = floorY;
    State.round.aircraftCeiling.customEnabled = false;
    State.round.aircraftCeiling.vehicleStates = {};
    // Keep the engine ceiling at vanilla scale; soft enforcement is confirm-gated.
    mod.SetMaxVehicleHeightLimitScale(1.0);

    State.round.modeConfig.aircraftCeiling = mapDefault;
    State.round.modeConfig.aircraftCeilingOverridePending = false;
    State.round.modeConfig.gameSettings = mod.stringkeys.twl.readyDialog.modeSettingAircraftCeilingFormat;
    State.round.modeConfig.confirmed.aircraftCeiling = mapDefault;
    State.round.modeConfig.confirmed.aircraftCeilingOverrideEnabled = false;

    updateReadyDialogModeConfigForAllVisibleViewers();
}

//#endregion ----------------- Aircraft Ceiling (Soft Enforcement) --------------------



//#region -------------------- Ready Dialog - Mode Presets + Confirm --------------------

function isReadyDialogGameModeVanilla(gameModeKey: number): boolean {
    return gameModeKey === mod.stringkeys.twl.readyDialog.gameModeHelisPractice;
}

function isReadyDialogGameModeLadder(gameModeKey: number): boolean {
    return gameModeKey === mod.stringkeys.twl.readyDialog.gameModeHelisLadder;
}

function isReadyDialogGameModeTwl1v1(gameModeKey: number): boolean {
    return gameModeKey === mod.stringkeys.twl.readyDialog.gameModeHelisTwl1v1;
}

function isReadyDialogGameModeCustom(gameModeKey: number): boolean {
    return gameModeKey === mod.stringkeys.twl.readyDialog.gameModeHelisCustom;
}

function isReadyDialogGameModeTwlPreset(gameModeKey: number): boolean {
    return isReadyDialogGameModeLadder(gameModeKey) || isReadyDialogGameModeTwl1v1(gameModeKey);
}

function getReadyDialogPresetPlayersPerSide(gameModeKey: number): number {
    if (isReadyDialogGameModeTwl1v1(gameModeKey)) {
        return READY_DIALOG_MODE_PRESET_PLAYERS_PER_SIDE_TWL_1V1;
    }
    if (isReadyDialogGameModeLadder(gameModeKey)) {
        return READY_DIALOG_MODE_PRESET_PLAYERS_PER_SIDE_TWL_2V2;
    }
    return READY_DIALOG_MODE_PRESET_PLAYERS_PER_SIDE_VANILLA;
}

function shouldApplyCustomCeilingForGameMode(gameModeKey: number): boolean {
    if (isReadyDialogGameModeVanilla(gameModeKey)) return false;
    if (isReadyDialogGameModeCustom(gameModeKey)) return true;
    if (isReadyDialogGameModeTwlPreset(gameModeKey)) return !!ACTIVE_MAP_CONFIG.useCustomCeiling;
    return true;
}

// Custom mode always applies the numeric ceiling; Vanilla/Ladder apply only when configured to do so.
function shouldApplyCustomCeilingForConfig(gameModeKey: number, overrideEnabled: boolean): boolean {
    if (isReadyDialogGameModeCustom(gameModeKey)) {
        return overrideEnabled;
    }
    return shouldApplyCustomCeilingForGameMode(gameModeKey);
}

// Forces Custom mode without applying presets or mutating other settings.
function ensureCustomGameModeForManualChange(): void {
    if (suppressReadyDialogModeAutoSwitch) return;
    if (State.round.modeConfig.gameModeIndex === READY_DIALOG_GAME_MODE_CUSTOM_INDEX) return;
    const priorMode = State.round.modeConfig.gameMode;
    const shouldKeepCeilingOverride =
        shouldApplyCustomCeilingForGameMode(priorMode)
        || State.round.modeConfig.aircraftCeilingOverridePending
        || State.round.modeConfig.confirmed.aircraftCeilingOverrideEnabled;
    if (shouldKeepCeilingOverride) {
        State.round.modeConfig.aircraftCeilingOverridePending = true;
    }
    State.round.modeConfig.gameModeIndex = READY_DIALOG_GAME_MODE_CUSTOM_INDEX;
    State.round.modeConfig.gameMode = READY_DIALOG_GAME_MODE_OPTIONS[READY_DIALOG_GAME_MODE_CUSTOM_INDEX];
    updateReadyDialogModeConfigForAllVisibleViewers();
    updateSettingsSummaryHudForAllPlayers();
}

// True only when all preset values match the selected mode (match length, matchup, players, vehicles, ceiling).
function isReadyDialogModePresetActive(gameModeKey: number): boolean {
    if (isReadyDialogGameModeCustom(gameModeKey)) return false;
    const expectedBestOf = isReadyDialogGameModeTwlPreset(gameModeKey)
        ? READY_DIALOG_MODE_PRESET_BEST_OF_LADDER
        : READY_DIALOG_MODE_PRESET_BEST_OF_VANILLA;
    if (Math.floor(State.round.max) !== expectedBestOf) return false;
    if (State.round.matchupPresetIndex !== READY_DIALOG_MODE_PRESET_MATCHUP_INDEX) return false;
    if (State.round.autoStartMinActivePlayers !== getReadyDialogPresetPlayersPerSide(gameModeKey)) return false;
    if (State.round.modeConfig.vehicleIndexT1 !== READY_DIALOG_MODE_PRESET_VEHICLE_INDEX) return false;
    if (State.round.modeConfig.vehicleIndexT2 !== READY_DIALOG_MODE_PRESET_VEHICLE_INDEX) return false;
    if (Math.floor(State.round.modeConfig.aircraftCeiling) !== Math.floor(State.round.aircraftCeiling.mapDefaultHudCeiling)) return false;
    return true;
}

// Applies the full mode preset (the only place we intentionally sync multiple settings at once).
function applyReadyDialogModePresetForGameMode(gameModeKey: number): boolean {
    if (isReadyDialogGameModeCustom(gameModeKey)) return false;

    suppressReadyDialogModeAutoSwitch = true;
    const bestOfRounds = isReadyDialogGameModeTwlPreset(gameModeKey)
        ? READY_DIALOG_MODE_PRESET_BEST_OF_LADDER
        : READY_DIALOG_MODE_PRESET_BEST_OF_VANILLA;

    setHudRoundCountersForAllPlayers(State.round.current, bestOfRounds);
    applyMatchupPresetInternal(READY_DIALOG_MODE_PRESET_MATCHUP_INDEX, undefined, false, true);

    State.round.autoStartMinActivePlayers = getReadyDialogPresetPlayersPerSide(gameModeKey);
    updateMatchupReadoutsForAllPlayers();

    State.round.modeConfig.vehicleIndexT1 = READY_DIALOG_MODE_PRESET_VEHICLE_INDEX;
    State.round.modeConfig.vehicleIndexT2 = READY_DIALOG_MODE_PRESET_VEHICLE_INDEX;
    State.round.modeConfig.vehiclesT1 = READY_DIALOG_VEHICLE_OPTIONS[READY_DIALOG_MODE_PRESET_VEHICLE_INDEX];
    State.round.modeConfig.vehiclesT2 = READY_DIALOG_VEHICLE_OPTIONS[READY_DIALOG_MODE_PRESET_VEHICLE_INDEX];

    State.round.modeConfig.aircraftCeiling = State.round.aircraftCeiling.mapDefaultHudCeiling;
    State.round.modeConfig.aircraftCeilingOverridePending = false;
    State.round.modeConfig.gameSettings = mod.stringkeys.twl.readyDialog.modeSettingAircraftCeilingFormat;

    suppressReadyDialogModeAutoSwitch = false;

    updateReadyDialogModeConfigForAllVisibleViewers();
    updateSettingsSummaryHudForAllPlayers();
    return true;
}

function setReadyDialogGameModeIndex(nextIndex: number, applyPreset: boolean = true): void {
    const count = READY_DIALOG_GAME_MODE_OPTIONS.length;
    if (count <= 0) return;
    const clamped = ((nextIndex % count) + count) % count;
    State.round.modeConfig.gameModeIndex = clamped;
    State.round.modeConfig.gameMode = READY_DIALOG_GAME_MODE_OPTIONS[clamped];
    if (applyPreset) {
        const applied = applyReadyDialogModePresetForGameMode(State.round.modeConfig.gameMode);
        if (applied) return;
    }
    updateReadyDialogModeConfigForAllVisibleViewers();
    updateSettingsSummaryHudForAllPlayers();
}

function setReadyDialogAircraftCeiling(nextValue: number, _changedBy?: mod.Player): void {
    ensureCustomGameModeForManualChange();
    const clamped = Math.max(
        READY_DIALOG_AIRCRAFT_CEILING_MIN,
        Math.min(READY_DIALOG_AIRCRAFT_CEILING_MAX, Math.floor(nextValue))
    );
    State.round.modeConfig.aircraftCeiling = clamped;
    State.round.modeConfig.aircraftCeilingOverridePending = true;
    State.round.modeConfig.gameSettings = mod.stringkeys.twl.readyDialog.modeSettingAircraftCeilingFormat;
    updateReadyDialogModeConfigForAllVisibleViewers();
}

function setReadyDialogVehicleIndexT1(nextIndex: number): void {
    const count = READY_DIALOG_VEHICLE_OPTIONS.length;
    if (count <= 0) return;
    ensureCustomGameModeForManualChange();
    const clamped = ((nextIndex % count) + count) % count;
    State.round.modeConfig.vehicleIndexT1 = clamped;
    State.round.modeConfig.vehiclesT1 = READY_DIALOG_VEHICLE_OPTIONS[clamped];
    updateReadyDialogModeConfigForAllVisibleViewers();
}

function setReadyDialogVehicleIndexT2(nextIndex: number): void {
    const count = READY_DIALOG_VEHICLE_OPTIONS.length;
    if (count <= 0) return;
    ensureCustomGameModeForManualChange();
    const clamped = ((nextIndex % count) + count) % count;
    State.round.modeConfig.vehicleIndexT2 = clamped;
    State.round.modeConfig.vehiclesT2 = READY_DIALOG_VEHICLE_OPTIONS[clamped];
    updateReadyDialogModeConfigForAllVisibleViewers();
}

function confirmReadyDialogModeConfig(changedBy?: mod.Player): void {
    const cfg = State.round.modeConfig;
    const prevConfirmed = cfg.confirmed.aircraftCeiling;
    const prevGameMode = cfg.confirmed.gameMode;
    // Confirm is authoritative: it can force Custom if settings diverge from presets
    // and it is the only place we apply ceiling + vehicle overrides.
    if (!isReadyDialogGameModeCustom(cfg.gameMode) && !isReadyDialogModePresetActive(cfg.gameMode)) {
        cfg.gameModeIndex = READY_DIALOG_GAME_MODE_CUSTOM_INDEX;
        cfg.gameMode = READY_DIALOG_GAME_MODE_OPTIONS[READY_DIALOG_GAME_MODE_CUSTOM_INDEX];
    }
    const nextCeilingOverrideEnabled =
        cfg.confirmed.aircraftCeilingOverrideEnabled || cfg.aircraftCeilingOverridePending;
    const applyCustomCeiling = shouldApplyCustomCeilingForConfig(cfg.gameMode, nextCeilingOverrideEnabled);
    const isMapDefaultVehicle = cfg.vehicleIndexT1 === READY_DIALOG_VEHICLE_MAP_DEFAULT_INDEX;
    // Keep the selected heli override consistent across teams when confirming.
    cfg.vehicleIndexT2 = cfg.vehicleIndexT1;
    cfg.vehiclesT2 = cfg.vehiclesT1;
    cfg.confirmed = {
        gameMode: cfg.gameMode,
        gameSettings: cfg.gameSettings,
        vehiclesT1: cfg.vehiclesT1,
        vehiclesT2: cfg.vehiclesT1,
        aircraftCeiling: cfg.aircraftCeiling,
        aircraftCeilingOverrideEnabled: nextCeilingOverrideEnabled,
        vehicleIndexT1: cfg.vehicleIndexT1,
        vehicleIndexT2: cfg.vehicleIndexT1,
        vehicleOverrideEnabled: !isMapDefaultVehicle,
    };
    refreshOvertimeZonesFromMapConfig();
    // Apply custom ceiling only after the user confirms settings; enforcement runs while enabled.
    if (!applyCustomCeiling) {
        disableCustomAircraftCeilingAndRestoreDefault();
    } else {
        enableCustomAircraftCeiling();
        applyCustomAircraftCeilingHardLimiter();
    }
    if (changedBy && cfg.confirmed.aircraftCeiling !== prevConfirmed) {
        sendHighlightedWorldLogMessage(
            mod.Message(STR_READY_DIALOG_AIRCRAFT_CEILING_CHANGED, changedBy, Math.floor(cfg.confirmed.aircraftCeiling)),
            true,
            undefined,
            STR_READY_DIALOG_AIRCRAFT_CEILING_CHANGED
        );
    }
    if (changedBy && cfg.confirmed.gameMode !== prevGameMode) {
        sendHighlightedWorldLogMessage(
            mod.Message(STR_READY_DIALOG_GAME_MODE_CHANGED, changedBy, cfg.confirmed.gameMode),
            true,
            undefined,
            STR_READY_DIALOG_GAME_MODE_CHANGED
        );
    }
    refreshVehicleSpawnSpecsFromModeConfig();
    applyVehicleSpawnSpecsToExistingSlots();
    updateSettingsSummaryHudForAllPlayers();
}

//#endregion ----------------- Ready Dialog - Mode Presets + Confirm --------------------
