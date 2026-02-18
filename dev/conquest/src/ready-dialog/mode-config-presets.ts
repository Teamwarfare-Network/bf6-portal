// @ts-nocheck
// Module: ready-dialog/mode-config-presets -- mode preset application and confirm/setters

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
