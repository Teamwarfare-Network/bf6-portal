// @ts-nocheck
// Module: ready-dialog/mode-config-presets -- mode preset application and confirm/setters

//#region -------------------- Ready Dialog - Mode Presets + Confirm --------------------

function isReadyDialogGameModeVanilla(gameModeKey: number): boolean {
    return gameModeKey === mod.stringkeys.twl.readyDialog.gameModeHelisPractice;
}

function isReadyDialogGameModeCustom(gameModeKey: number): boolean {
    return gameModeKey === mod.stringkeys.twl.readyDialog.gameModeHelisCustom;
}

function getReadyDialogPresetPlayersPerSide(_gameModeKey: number): number {
    return DEFAULT_AUTO_START_MIN_ACTIVE_PLAYERS;
}

function shouldApplyCustomCeilingForGameMode(_gameModeKey: number): boolean {
    return false;
}

function shouldApplyCustomCeilingForConfig(_gameModeKey: number, _overrideEnabled: boolean): boolean {
    return false;
}

function ensureCustomGameModeForManualChange(): void {
    if (suppressReadyDialogModeAutoSwitch) return;
    if (State.round.modeConfig.gameModeIndex === READY_DIALOG_GAME_MODE_CUSTOM_INDEX) return;
    State.round.modeConfig.gameModeIndex = READY_DIALOG_GAME_MODE_CUSTOM_INDEX;
    State.round.modeConfig.gameMode = READY_DIALOG_GAME_MODE_OPTIONS[READY_DIALOG_GAME_MODE_CUSTOM_INDEX];
    updateReadyDialogModeConfigForAllVisibleViewers();
}

function isReadyDialogModePresetActive(gameModeKey: number): boolean {
    if (isReadyDialogGameModeCustom(gameModeKey)) return false;
    if (State.round.autoStartMinActivePlayers !== getReadyDialogPresetPlayersPerSide(gameModeKey)) return false;
    const defaultVehicleSelections = buildReadyDialogVehicleSelectionIndexByGameMode(ACTIVE_MAP_CONFIG, gameModeKey);
    for (const knobKey of READY_DIALOG_ALL_VEHICLE_KNOB_KEYS) {
        if ((State.round.modeConfig.vehicleSelectionIndexByKey?.[knobKey] ?? 0) !== (defaultVehicleSelections[knobKey] ?? 0)) {
            return false;
        }
    }
    return true;
}

function applyReadyDialogModePresetForGameMode(gameModeKey: number): boolean {
    if (isReadyDialogGameModeCustom(gameModeKey)) return false;

    suppressReadyDialogModeAutoSwitch = true;
    State.round.autoStartMinActivePlayers = getReadyDialogPresetPlayersPerSide(gameModeKey);
    State.round.modeConfig.vehicleSelectionIndexByKey = buildReadyDialogVehicleSelectionIndexByGameMode(ACTIVE_MAP_CONFIG, gameModeKey);
    State.round.modeConfig.aircraftCeiling = State.round.aircraftCeiling.mapDefaultHudCeiling;
    State.round.modeConfig.aircraftCeilingOverridePending = false;
    State.round.modeConfig.gameSettings = mod.stringkeys.twl.system.genericCounter;
    suppressReadyDialogModeAutoSwitch = false;

    updateReadyDialogModeConfigForAllVisibleViewers();
    setMatchStateTextForAllPlayers();
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
}

function setReadyDialogAircraftCeiling(nextValue: number, _changedBy?: mod.Player): void {
    const clamped = Math.max(
        READY_DIALOG_AIRCRAFT_CEILING_MIN,
        Math.min(READY_DIALOG_AIRCRAFT_CEILING_MAX, Math.floor(nextValue))
    );
    State.round.modeConfig.aircraftCeiling = clamped;
}

function setReadyDialogVehicleSelectionIndexByKey(knobKey: string, nextIndex: number): void {
    const count = getReadyDialogVehicleSelectionCount(knobKey);
    if (count <= 0) return;
    ensureCustomGameModeForManualChange();
    if (!State.round.modeConfig.vehicleSelectionIndexByKey) {
        State.round.modeConfig.vehicleSelectionIndexByKey = {};
    }
    const clamped = ((nextIndex % count) + count) % count;
    State.round.modeConfig.vehicleSelectionIndexByKey[knobKey] = clamped;
    updateReadyDialogModeConfigForAllVisibleViewers();
}

function confirmReadyDialogModeConfig(changedBy?: mod.Player): void {
    const cfg = State.round.modeConfig;
    const prevGameMode = cfg.confirmed.gameMode;

    if (!isReadyDialogGameModeCustom(cfg.gameMode) && !isReadyDialogModePresetActive(cfg.gameMode)) {
        cfg.gameModeIndex = READY_DIALOG_GAME_MODE_CUSTOM_INDEX;
        cfg.gameMode = READY_DIALOG_GAME_MODE_OPTIONS[READY_DIALOG_GAME_MODE_CUSTOM_INDEX];
    }

    cfg.confirmed = {
        gameMode: cfg.gameMode,
        gameSettings: cfg.gameSettings,
        aircraftCeiling: State.round.aircraftCeiling.mapDefaultHudCeiling,
        aircraftCeilingOverrideEnabled: false,
        vehicleSelectionIndexByKey: { ...(cfg.vehicleSelectionIndexByKey ?? {}) },
    };

    disableCustomAircraftCeilingAndRestoreDefault();

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
    applySpawnerEnablementForMatchup(State.round.matchupPresetIndex, true);
    invalidateVehicleDeployTimerHudRenderSignaturesForAllPlayers();
    updateVehicleDeployTimerHudForAllPlayers();
}

//#endregion ----------------- Ready Dialog - Mode Presets + Confirm --------------------
