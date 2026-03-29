// @ts-nocheck
// Module: ready-dialog/mode-config-presets -- mode preset application and confirm/setters

//#region -------------------- Ready Dialog - Mode Presets + Confirm --------------------

type ReadyDialogModeConfigDiffState = {
    hasUnsavedChanges: boolean;
    gameModeDirty: boolean;
    playersDirty: boolean;
    vehicleDirtyByKey: Record<string, boolean>;
};

function getReadyDialogConfirmedAutoStartMinActivePlayers(): number {
    return Math.floor(State.round.modeConfig.confirmed.autoStartMinActivePlayers ?? DEFAULT_AUTO_START_MIN_ACTIVE_PLAYERS);
}

function buildReadyDialogModeConfigDiffState(): ReadyDialogModeConfigDiffState {
    const cfg = State.round.modeConfig;
    const vehicleDirtyByKey: Record<string, boolean> = {};
    let hasUnsavedChanges = false;

    const gameModeDirty = cfg.gameMode !== cfg.confirmed.gameMode;
    const playersDirty = Math.floor(cfg.autoStartMinActivePlayers) !== getReadyDialogConfirmedAutoStartMinActivePlayers();

    if (gameModeDirty || playersDirty) {
        hasUnsavedChanges = true;
    }

    for (const knobKey of READY_DIALOG_ALL_VEHICLE_KNOB_KEYS) {
        const dirty = (cfg.vehicleSelectionIndexByKey?.[knobKey] ?? 0) !== (cfg.confirmed.vehicleSelectionIndexByKey?.[knobKey] ?? 0);
        vehicleDirtyByKey[knobKey] = dirty;
        if (dirty) hasUnsavedChanges = true;
    }

    return {
        hasUnsavedChanges,
        gameModeDirty,
        playersDirty,
        vehicleDirtyByKey,
    };
}

function isReadyDialogModeConfigDirtyForKnobKey(
    knobKey: string,
    diff: ReadyDialogModeConfigDiffState = buildReadyDialogModeConfigDiffState()
): boolean {
    if (knobKey === READY_DIALOG_CONFIG_GAME_KNOB_KEY) return diff.gameModeDirty;
    if (knobKey === READY_DIALOG_CONFIG_PLAYERS_KNOB_KEY) return diff.playersDirty;
    return diff.vehicleDirtyByKey[knobKey] === true;
}

function isReadyDialogGameModeVanilla(gameModeKey: number): boolean {
    return gameModeKey === mod.stringkeys.twl.readyDialog.gameModeConquest10v10;
}

function isReadyDialogGameModeCustom(gameModeKey: number): boolean {
    return gameModeKey === READY_DIALOG_GAME_MODE_CUSTOM_KEY;
}

function getReadyDialogPresetPlayersPerSide(gameModeKey: number): number {
    const presetPackage = getReadyDialogPresetPackage(ACTIVE_MAP_CONFIG, gameModeKey);
    if (!presetPackage) return DEFAULT_AUTO_START_MIN_ACTIVE_PLAYERS;
    return Math.floor(presetPackage.playersPerSide ?? DEFAULT_AUTO_START_MIN_ACTIVE_PLAYERS);
}

function shouldApplyCustomCeilingForGameMode(_gameModeKey: number): boolean {
    return false;
}

function shouldApplyCustomCeilingForConfig(_gameModeKey: number, _overrideEnabled: boolean): boolean {
    return false;
}

function requireReadyReconfirmAfterConfigChange(changedBy?: mod.Player): void {
    if (!changedBy) return;
    if (isMatchLive()) return;
    const pid = safeGetPlayerId(changedBy);
    if (pid === undefined) return;
    if (!State.players.readyByPid[pid]) return;
    if (!buildReadyDialogModeConfigDiffState().hasUnsavedChanges) return;

    State.players.readyByPid[pid] = false;
    State.players.readyNeedsReconfirmByPid[pid] = true;

    updateHelpTextVisibilityForPid(pid);
    refreshReadyStatusForAllBuiltReadyDialogs();
    renderReadyDialogForAllVisibleViewers();
    updatePlayersReadyHudTextForAllPlayers();
}

function ensureCustomGameModeForManualChange(): void {
    if (suppressReadyDialogModeAutoSwitch) return;
    if (isReadyDialogGameModeCustom(State.round.modeConfig.gameMode)) return;
    State.round.modeConfig.gameMode = READY_DIALOG_GAME_MODE_CUSTOM_KEY;
    updateReadyDialogModeConfigForAllVisibleViewers();
}

function isReadyDialogModePresetActive(gameModeKey: number): boolean {
    if (isReadyDialogGameModeCustom(gameModeKey)) return false;
    if (Math.floor(State.round.modeConfig.autoStartMinActivePlayers) !== getReadyDialogPresetPlayersPerSide(gameModeKey)) return false;
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
    State.round.modeConfig.autoStartMinActivePlayers = getReadyDialogPresetPlayersPerSide(gameModeKey);
    State.round.modeConfig.vehicleSelectionIndexByKey = buildReadyDialogVehicleSelectionIndexByGameMode(ACTIVE_MAP_CONFIG, gameModeKey);
    State.round.modeConfig.aircraftCeiling = State.round.aircraftCeiling.mapDefaultHudCeiling;
    State.round.modeConfig.aircraftCeilingOverridePending = false;
    State.round.modeConfig.gameSettings = mod.stringkeys.twl.system.genericCounter;
    suppressReadyDialogModeAutoSwitch = false;

    updateReadyDialogModeConfigForAllVisibleViewers();
    return true;
}

function resetReadyDialogModeConfigToDefaults(changedBy?: mod.Player): void {
    const defaultGameMode = READY_DIALOG_GAME_MODE_OPTIONS[READY_DIALOG_GAME_MODE_DEFAULT_INDEX];
    suppressReadyDialogModeAutoSwitch = true;
    State.round.modeConfig.gameModeIndex = READY_DIALOG_GAME_MODE_DEFAULT_INDEX;
    State.round.modeConfig.gameMode = defaultGameMode;
    State.round.modeConfig.autoStartMinActivePlayers = getReadyDialogPresetPlayersPerSide(defaultGameMode);
    State.round.modeConfig.vehicleSelectionIndexByKey = buildReadyDialogVehicleSelectionIndexByGameMode(ACTIVE_MAP_CONFIG, defaultGameMode);
    State.round.modeConfig.aircraftCeiling = State.round.aircraftCeiling.mapDefaultHudCeiling;
    State.round.modeConfig.aircraftCeilingOverridePending = false;
    State.round.modeConfig.gameSettings = mod.stringkeys.twl.system.genericCounter;
    suppressReadyDialogModeAutoSwitch = false;

    requireReadyReconfirmAfterConfigChange(changedBy);
    updateReadyDialogModeConfigForAllVisibleViewers();
}

function setReadyDialogGameModeIndex(nextIndex: number, applyPreset: boolean = true, changedBy?: mod.Player): void {
    const count = READY_DIALOG_GAME_MODE_OPTIONS.length;
    if (count <= 0) return;
    const clamped = ((nextIndex % count) + count) % count;
    State.round.modeConfig.gameModeIndex = clamped;
    State.round.modeConfig.gameMode = READY_DIALOG_GAME_MODE_OPTIONS[clamped];
    if (applyPreset) {
        const applied = applyReadyDialogModePresetForGameMode(State.round.modeConfig.gameMode);
        if (applied) {
            requireReadyReconfirmAfterConfigChange(changedBy);
            return;
        }
    }
    requireReadyReconfirmAfterConfigChange(changedBy);
    updateReadyDialogModeConfigForAllVisibleViewers();
}

function setReadyDialogAircraftCeiling(nextValue: number, _changedBy?: mod.Player): void {
    const clamped = Math.max(
        READY_DIALOG_AIRCRAFT_CEILING_MIN,
        Math.min(READY_DIALOG_AIRCRAFT_CEILING_MAX, Math.floor(nextValue))
    );
    State.round.modeConfig.aircraftCeiling = clamped;
}

function setReadyDialogVehicleSelectionIndexByKey(knobKey: string, nextIndex: number, changedBy?: mod.Player): void {
    const count = getReadyDialogVehicleSelectionCount(knobKey);
    if (count <= 0) return;
    ensureCustomGameModeForManualChange();
    if (!State.round.modeConfig.vehicleSelectionIndexByKey) {
        State.round.modeConfig.vehicleSelectionIndexByKey = {};
    }
    const clamped = ((nextIndex % count) + count) % count;
    State.round.modeConfig.vehicleSelectionIndexByKey[knobKey] = clamped;
    requireReadyReconfirmAfterConfigChange(changedBy);
    updateReadyDialogModeConfigForAllVisibleViewers();
}

function confirmReadyDialogModeConfig(changedBy?: mod.Player): void {
    const cfg = State.round.modeConfig;
    const prevGameMode = cfg.confirmed.gameMode;
    const confirmedPlayers = Math.floor(cfg.autoStartMinActivePlayers);

    if (!isReadyDialogGameModeCustom(cfg.gameMode) && !isReadyDialogModePresetActive(cfg.gameMode)) {
        cfg.gameMode = READY_DIALOG_GAME_MODE_CUSTOM_KEY;
    }

    State.round.autoStartMinActivePlayers = confirmedPlayers;
    cfg.autoStartMinActivePlayers = confirmedPlayers;
    cfg.confirmed = {
        gameMode: cfg.gameMode,
        gameSettings: cfg.gameSettings,
        aircraftCeiling: State.round.aircraftCeiling.mapDefaultHudCeiling,
        aircraftCeilingOverrideEnabled: false,
        autoStartMinActivePlayers: confirmedPlayers,
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
    prebuildAndRevealVehicleDeployTimerHudForAllPlayers();
    setMatchStateTextForAllPlayers();
    updatePlayersReadyHudTextForAllPlayers();
}

//#endregion ----------------- Ready Dialog - Mode Presets + Confirm --------------------

