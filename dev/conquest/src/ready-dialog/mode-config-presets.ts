// @ts-nocheck
// Module: ready-dialog/mode-config-presets -- mode preset application and confirm/setters

//#region -------------------- Ready Dialog - Mode Presets + Confirm --------------------

// Seconds the "Cannot apply: N still loading" message remains in the dialog's unsavedLabel
// slot after the late-joiner-warm guard refuses an Apply. After this duration elapses, the
// label reverts to its normal "Unsaved changes!" / live-locked state via a deferred refresh.
const APPLY_BLOCKED_LABEL_DURATION_SECONDS = 5;

type ReadyDialogModeConfigDiffState = {
    hasUnsavedChanges: boolean;
    gameModeDirty: boolean;
    playersDirty: boolean;
    vehicleDeployMethodDirty: boolean;
    // v1.314: individual dirty flags for the new config-column checkboxes. vehicleDeployMethodDirty
    // covers both the Vanilla and HQ checkboxes since they share the same backing field.
    airDeployDirty: boolean;
    forwardDeployDirty: boolean;
    supplyBoxesDirty: boolean;
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
    const vehicleDeployMethodDirty = (cfg.vehicleDeployMethod ?? VEHICLE_DEPLOY_METHOD_DEFAULT) !== (cfg.confirmed.vehicleDeployMethod ?? VEHICLE_DEPLOY_METHOD_DEFAULT);
    const airDeployDirty = (cfg.airDeployEnabled ?? false) !== (cfg.confirmed.airDeployEnabled ?? false);
    const forwardDeployDirty = (cfg.forwardDeployEnabled ?? false) !== (cfg.confirmed.forwardDeployEnabled ?? false);
    const supplyBoxesDirty = (cfg.supplyBoxesEnabled ?? true) !== (cfg.confirmed.supplyBoxesEnabled ?? true);

    if (gameModeDirty || playersDirty || vehicleDeployMethodDirty || airDeployDirty || forwardDeployDirty || supplyBoxesDirty) {
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
        vehicleDeployMethodDirty,
        airDeployDirty,
        forwardDeployDirty,
        supplyBoxesDirty,
        vehicleDirtyByKey,
    };
}

function isReadyDialogModeConfigDirtyForKnobKey(
    knobKey: string,
    diff: ReadyDialogModeConfigDiffState = buildReadyDialogModeConfigDiffState()
): boolean {
    if (knobKey === READY_DIALOG_CONFIG_GAME_KNOB_KEY) return diff.gameModeDirty;
    if (knobKey === READY_DIALOG_CONFIG_PLAYERS_KNOB_KEY) return diff.playersDirty;
    // v1.314: checkbox rows reuse this helper so the readout path can tint dirty labels uniformly.
    if (knobKey === READY_DIALOG_CONFIG_CHECKBOX_VANILLA_KEY) return diff.vehicleDeployMethodDirty;
    if (knobKey === READY_DIALOG_CONFIG_CHECKBOX_HQ_KEY) return diff.vehicleDeployMethodDirty;
    if (knobKey === READY_DIALOG_CONFIG_CHECKBOX_AIR_KEY) return diff.airDeployDirty;
    if (knobKey === READY_DIALOG_CONFIG_CHECKBOX_FORWARD_KEY) return diff.forwardDeployDirty;
    if (knobKey === READY_DIALOG_CONFIG_CHECKBOX_SUPPLY_BOXES_KEY) return diff.supplyBoxesDirty;
    return diff.vehicleDirtyByKey[knobKey] === true;
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
    const presetPackage = getReadyDialogPresetPackage(ACTIVE_MAP_CONFIG, gameModeKey);
    const presetDeployMethod = presetPackage?.vehicleDeployMethod ?? VEHICLE_DEPLOY_METHOD_DEFAULT;
    if ((State.round.modeConfig.vehicleDeployMethod ?? VEHICLE_DEPLOY_METHOD_DEFAULT) !== presetDeployMethod) return false;
    // v1.314: compare new checkbox fields against preset expectation (preset may omit → use default).
    if ((State.round.modeConfig.airDeployEnabled ?? false) !== (presetPackage?.airDeployEnabled ?? false)) return false;
    if ((State.round.modeConfig.forwardDeployEnabled ?? false) !== (presetPackage?.forwardDeployEnabled ?? false)) return false;
    if ((State.round.modeConfig.supplyBoxesEnabled ?? true) !== (presetPackage?.supplyBoxesEnabled ?? true)) return false;
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

    const presetPackage = getReadyDialogPresetPackage(ACTIVE_MAP_CONFIG, gameModeKey);
    suppressReadyDialogModeAutoSwitch = true;
    State.round.modeConfig.autoStartMinActivePlayers = getReadyDialogPresetPlayersPerSide(gameModeKey);
    State.round.modeConfig.vehicleSelectionIndexByKey = buildReadyDialogVehicleSelectionIndexByGameMode(ACTIVE_MAP_CONFIG, gameModeKey);
    State.round.modeConfig.vehicleDeployMethod = presetPackage?.vehicleDeployMethod ?? VEHICLE_DEPLOY_METHOD_DEFAULT;
    // v1.314: apply preset seeds for the new checkbox fields. When the preset omits them, fall
    // back to round-default values so the preset-active check in isReadyDialogModePresetActive
    // stays consistent.
    State.round.modeConfig.airDeployEnabled = presetPackage?.airDeployEnabled ?? false;
    State.round.modeConfig.forwardDeployEnabled = presetPackage?.forwardDeployEnabled ?? false;
    State.round.modeConfig.supplyBoxesEnabled = presetPackage?.supplyBoxesEnabled ?? true;
    State.round.modeConfig.aircraftCeiling = State.round.aircraftCeiling.mapDefaultHudCeiling;
    State.round.modeConfig.aircraftCeilingOverridePending = false;
    State.round.modeConfig.gameSettings = STR_SYS_COUNTER;
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
    State.round.modeConfig.vehicleDeployMethod = VEHICLE_DEPLOY_METHOD_DEFAULT;
    // v1.314: reset the checkbox toggles to their round-start defaults (Vanilla + SupplyBoxes on).
    State.round.modeConfig.airDeployEnabled = false;
    State.round.modeConfig.forwardDeployEnabled = false;
    State.round.modeConfig.supplyBoxesEnabled = true;
    State.round.modeConfig.aircraftCeiling = State.round.aircraftCeiling.mapDefaultHudCeiling;
    State.round.modeConfig.aircraftCeilingOverridePending = false;
    State.round.modeConfig.gameSettings = STR_SYS_COUNTER;
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

// v1.314: toggle the Vanilla Deploy checkbox. Vanilla and HQ are a radio pair backed by
// vehicleDeployMethod; clicking Vanilla always flips the pair. Switching back to Vanilla force-
// clears the HQ-child Air/Forward booleans so the state never reaches an impossible combo
// (Vanilla + Air/Forward). Every mutation routes through ensureCustomGameModeForManualChange so
// presets flip to Custom on manual divergence, and un-readies the clicker via the reconfirm hook.
function toggleReadyDialogVanillaDeployCheckbox(changedBy?: mod.Player): void {
    const cfg = State.round.modeConfig;
    ensureCustomGameModeForManualChange();
    if ((cfg.vehicleDeployMethod ?? VEHICLE_DEPLOY_METHOD_DEFAULT) === VEHICLE_DEPLOY_METHOD_VANILLA) {
        cfg.vehicleDeployMethod = VEHICLE_DEPLOY_METHOD_HQ;
    } else {
        cfg.vehicleDeployMethod = VEHICLE_DEPLOY_METHOD_VANILLA;
        cfg.airDeployEnabled = false;
        cfg.forwardDeployEnabled = false;
    }
    requireReadyReconfirmAfterConfigChange(changedBy);
    updateReadyDialogModeConfigForAllVisibleViewers();
}

// v1.314: toggle the HQ Deploy checkbox — mirror of the Vanilla toggle since the two are a radio
// pair. Returning from HQ to Vanilla clears the HQ-child booleans to preserve the invariant.
function toggleReadyDialogHqDeployCheckbox(changedBy?: mod.Player): void {
    const cfg = State.round.modeConfig;
    ensureCustomGameModeForManualChange();
    if ((cfg.vehicleDeployMethod ?? VEHICLE_DEPLOY_METHOD_DEFAULT) === VEHICLE_DEPLOY_METHOD_HQ) {
        cfg.vehicleDeployMethod = VEHICLE_DEPLOY_METHOD_VANILLA;
        cfg.airDeployEnabled = false;
        cfg.forwardDeployEnabled = false;
    } else {
        cfg.vehicleDeployMethod = VEHICLE_DEPLOY_METHOD_HQ;
    }
    requireReadyReconfirmAfterConfigChange(changedBy);
    updateReadyDialogModeConfigForAllVisibleViewers();
}

// v1.314: toggle the Air Deploy child checkbox. Clicking Air while Vanilla is active auto-switches
// the parent to HQ and enables Air in a single step — the user's explicit flow. When HQ is
// already active, this is a simple boolean flip.
function toggleReadyDialogAirDeployCheckbox(changedBy?: mod.Player): void {
    const cfg = State.round.modeConfig;
    ensureCustomGameModeForManualChange();
    if ((cfg.vehicleDeployMethod ?? VEHICLE_DEPLOY_METHOD_DEFAULT) === VEHICLE_DEPLOY_METHOD_VANILLA) {
        cfg.vehicleDeployMethod = VEHICLE_DEPLOY_METHOD_HQ;
        cfg.airDeployEnabled = true;
    } else {
        cfg.airDeployEnabled = !(cfg.airDeployEnabled ?? false);
    }
    requireReadyReconfirmAfterConfigChange(changedBy);
    updateReadyDialogModeConfigForAllVisibleViewers();
}

// v1.314: toggle the Forward Deploy child checkbox. Same auto-switch semantics as Air Deploy.
function toggleReadyDialogForwardDeployCheckbox(changedBy?: mod.Player): void {
    const cfg = State.round.modeConfig;
    ensureCustomGameModeForManualChange();
    if ((cfg.vehicleDeployMethod ?? VEHICLE_DEPLOY_METHOD_DEFAULT) === VEHICLE_DEPLOY_METHOD_VANILLA) {
        cfg.vehicleDeployMethod = VEHICLE_DEPLOY_METHOD_HQ;
        cfg.forwardDeployEnabled = true;
    } else {
        cfg.forwardDeployEnabled = !(cfg.forwardDeployEnabled ?? false);
    }
    requireReadyReconfirmAfterConfigChange(changedBy);
    updateReadyDialogModeConfigForAllVisibleViewers();
}

// v1.314: toggle the Supply Boxes checkbox. Fully orthogonal to deploy mode. Nothing reads this
// boolean downstream yet; wiring lands in a later change.
function toggleReadyDialogSupplyBoxesCheckbox(changedBy?: mod.Player): void {
    const cfg = State.round.modeConfig;
    ensureCustomGameModeForManualChange();
    cfg.supplyBoxesEnabled = !(cfg.supplyBoxesEnabled ?? true);
    requireReadyReconfirmAfterConfigChange(changedBy);
    updateReadyDialogModeConfigForAllVisibleViewers();
}

function confirmReadyDialogModeConfig(changedBy?: mod.Player): void {
    // Wave 3 Ship 8 (v1.418): Apply-blocked-loading guard removed. The original #105 hard-crash
    // shape no longer exists post-Wave-3 because there is no shared `warmPrimeActiveByPid` flag
    // (deleted with prebuildAllUiFamiliesHidden) and lazy builds are sync-completing per-pid.
    // The lazy-build dispatcher's per-surface in-flight guard serializes per-pid contention.
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
        vehicleDeployMethod: cfg.vehicleDeployMethod ?? VEHICLE_DEPLOY_METHOD_DEFAULT,
        airDeployEnabled: cfg.airDeployEnabled ?? false,
        forwardDeployEnabled: cfg.forwardDeployEnabled ?? false,
        supplyBoxesEnabled: cfg.supplyBoxesEnabled ?? true,
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
    refreshSupplyBoxInteractableStateFromConfirmedConfig();
    forceUnreadyApplierAfterConfirm(changedBy);
}

// Applying a config commit must invalidate the applier's own ready state: if they were ready
// going in, they need to re-ready afterward (e.g. after bringing minActivePlayers down the
// match shouldn't auto-start until they reconfirm). The ready-dialog button tints red when
// !isReady && needsReconfirm, providing the visible "ready again" cue the user expects.
function forceUnreadyApplierAfterConfirm(changedBy?: mod.Player): void {
    if (!changedBy) return;
    if (isMatchLive()) return;
    const pid = safeGetPlayerId(changedBy);
    if (pid === undefined) return;
    if (!State.players.readyByPid[pid]) return;
    State.players.readyByPid[pid] = false;
    State.players.readyNeedsReconfirmByPid[pid] = true;
    updateHelpTextVisibilityForPid(pid);
    refreshReadyStatusForAllBuiltReadyDialogs();
    renderReadyDialogForAllVisibleViewers();
    updatePlayersReadyHudTextForAllPlayers();
}

//#endregion ----------------- Ready Dialog - Mode Presets + Confirm --------------------

