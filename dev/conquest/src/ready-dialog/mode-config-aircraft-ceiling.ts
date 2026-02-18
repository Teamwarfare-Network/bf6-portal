// @ts-nocheck
// Module: ready-dialog/mode-config-aircraft-ceiling -- map-default and custom aircraft ceiling control

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
