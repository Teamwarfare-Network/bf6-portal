// @ts-nocheck
// Module: strings — Map/matchup helpers and UI widget ID constants

//#region -------------------- Map + Matchup Helpers --------------------

// Returns the Ready-dialog display stringkey for the current map.
function getMapNameKey(mapKey: MapKey): number {
    return MAP_NAME_STRINGKEYS[mapKey] ?? mod.stringkeys.twl.system.unknownPlayer;
}

// v0.731: This is the helis-only experience -- every mode is a heli mode by definition. The
// hardcoded list shape was inherited from Conquest (which shipped both tank and heli modes from a
// shared MapConfig type). Returning true unconditionally fixes three quiet bugs at the same time:
//   - refreshVehicleSpawnSpecsFromModeConfig was falling through to tank specs for any mode not
//     in the hardcoded list (Twl1v1 since it was added, plus all v0.727+ new modes), causing
//     tanks to spawn at heli pads after Confirm.
//   - getOvertimeZoneLettersForGameMode was returning tank zone letters (A-G) for those same
//     modes when it should have returned the heli letters (H).
//   - isHelisOvertimeSingleZoneMode was missing the "H zone visible from round start" pre-active
//     path for those same modes.
// The dead tank fallback in refreshVehicleSpawnSpecsFromModeConfig (and the team{1,2}TankSpawns in
// every MapConfig) become explicitly unreachable -- they remain for reference / future tank-mode
// experimentation, but no current code path reads them.
function isHeliGameMode(_gameModeKey: number): boolean {
    return true;
}

// Builds a basic heli spawn list from tank spawn positions when no map-specific heli list exists yet.
function buildHeliSpawnsFromTankSpawns(spawns: VehicleSpawnSpec[], team: TeamID): VehicleSpawnSpec[] {
    const attackVehicle = team === TeamID.Team1 ? mod.VehicleList.AH64 : mod.VehicleList.Eurocopter;
    const transportVehicle = team === TeamID.Team1 ? mod.VehicleList.UH60 : mod.VehicleList.UH60_Pax;
    return spawns.map((spawn) => ({
        slotNumber: spawn.slotNumber,
        pos: spawn.pos,
        rot: spawn.rot,
        vehicle: spawn.slotNumber === 3 ? transportVehicle : attackVehicle,
    }));
}

function resolveHeliSpawnsForTeam(cfg: MapConfig, team: TeamID): VehicleSpawnSpec[] {
    if (team === TeamID.Team1) {
        if (cfg.team1HeliSpawns && cfg.team1HeliSpawns.length > 0) return cfg.team1HeliSpawns;
        return buildHeliSpawnsFromTankSpawns(cfg.team1TankSpawns, TeamID.Team1);
    }
    if (cfg.team2HeliSpawns && cfg.team2HeliSpawns.length > 0) return cfg.team2HeliSpawns;
    return buildHeliSpawnsFromTankSpawns(cfg.team2TankSpawns, TeamID.Team2);
}

function getReadyDialogVehicleListByIndex(index: number): mod.VehicleList {
    return READY_DIALOG_VEHICLE_LIST[index] ?? READY_DIALOG_VEHICLE_LIST[0];
}

function applyVehicleOverrideToSpawns(spawns: VehicleSpawnSpec[], vehicle: mod.VehicleList): VehicleSpawnSpec[] {
    return spawns.map((spawn) => ({
        slotNumber: spawn.slotNumber,
        pos: spawn.pos,
        rot: spawn.rot,
        vehicle,
    }));
}

// v0.727: per-team independent vehicle override. Each team's heli spawn set is checked separately
// against MAP_DEFAULT -- Little Birds presets (T1=MH6, T2=MH6 PAX) and Helis Only Vanilla (T1=T2=Map
// Default) both flow through here cleanly.
function refreshVehicleSpawnSpecsFromModeConfig(): void {
    const useHelis = isHeliGameMode(State.round.modeConfig.confirmed.gameMode);
    if (useHelis) {
        const baseT1 = resolveHeliSpawnsForTeam(ACTIVE_MAP_CONFIG, TeamID.Team1);
        const baseT2 = resolveHeliSpawnsForTeam(ACTIVE_MAP_CONFIG, TeamID.Team2);
        const t1Idx = State.round.modeConfig.confirmed.vehicleIndexT1;
        const t2Idx = State.round.modeConfig.confirmed.vehicleIndexT2;
        const t1IsMapDefault = t1Idx === READY_DIALOG_VEHICLE_MAP_DEFAULT_INDEX;
        const t2IsMapDefault = t2Idx === READY_DIALOG_VEHICLE_MAP_DEFAULT_INDEX;
        TEAM1_VEHICLE_SPAWN_SPECS = t1IsMapDefault
            ? baseT1
            : applyVehicleOverrideToSpawns(baseT1, getReadyDialogVehicleListByIndex(t1Idx));
        TEAM2_VEHICLE_SPAWN_SPECS = t2IsMapDefault
            ? baseT2
            : applyVehicleOverrideToSpawns(baseT2, getReadyDialogVehicleListByIndex(t2Idx));
        return;
    }
    TEAM1_VEHICLE_SPAWN_SPECS = ACTIVE_MAP_CONFIG.team1TankSpawns;
    TEAM2_VEHICLE_SPAWN_SPECS = ACTIVE_MAP_CONFIG.team2TankSpawns;
}

function applyVehicleSpawnSpecsToExistingSlots(): void {
    if (State.vehicles.slots.length === 0) return;
    const team1BySlot: Record<number, VehicleSpawnSpec> = {};
    const team2BySlot: Record<number, VehicleSpawnSpec> = {};
    for (const spec of TEAM1_VEHICLE_SPAWN_SPECS) {
        team1BySlot[spec.slotNumber] = spec;
    }
    for (const spec of TEAM2_VEHICLE_SPAWN_SPECS) {
        team2BySlot[spec.slotNumber] = spec;
    }
    for (const slot of State.vehicles.slots) {
        const spec = slot.teamId === TeamID.Team1 ? team1BySlot[slot.slotNumber] : team2BySlot[slot.slotNumber];
        if (!spec) continue;
        if (slot.vehicleType === spec.vehicle) continue;
        slot.vehicleType = spec.vehicle;
        configureVehicleSpawner(slot.spawner, slot.vehicleType);
    }
}

// Applies the selected map's base anchors, spawn specs, and yaw offsets to the active runtime config.
// Also refreshes the Ready dialog map label so the UI matches the active map.
function applyMapConfig(mapKey: MapKey): void {
    ACTIVE_MAP_KEY = mapKey;
    ACTIVE_MAP_CONFIG = MAP_CONFIGS[ACTIVE_MAP_KEY];
    MAIN_BASE_TEAM1_POS = ACTIVE_MAP_CONFIG.team1Base;
    MAIN_BASE_TEAM2_POS = ACTIVE_MAP_CONFIG.team2Base;
    refreshVehicleSpawnSpecsFromModeConfig();
    VEHICLE_SPAWN_YAW_OFFSET_DEG = ACTIVE_MAP_CONFIG.vehicleSpawnYawOffsetDeg;
    ACTIVE_OVERTIME_ZONES = (ACTIVE_MAP_CONFIG.overtimeZones ?? []).map((zone) => ({
        areaTriggerObjId: zone.areaTriggerObjId,
        sectorId: zone.sectorId,
        worldIconObjId: zone.worldIconObjId,
        capturePointObjId: zone.capturePointObjId,
    }));
    // Keep overtime zones synced with the active map config.
    refreshOvertimeZonesFromMapConfig();
    // Apply the map's default aircraft ceiling, unless a custom override is active.
    syncAircraftCeilingFromMapConfig();
    // Seed the per-map default Vehicle Health Multiplier and align the live + confirmed knob to it.
    // No pending-override flag is needed (vehicle health has no "vanilla" mode).
    const mapDefaultHealth = ACTIVE_MAP_CONFIG.defaultVehicleHealthMultiplier ?? READY_DIALOG_VEHICLE_HEALTH_MULT_DEFAULT;
    State.round.mapDefaultVehicleHealthMultiplier = mapDefaultHealth;
    State.round.modeConfig.vehicleHealthMultiplier = mapDefaultHealth;
    State.round.modeConfig.confirmed.vehicleHealthMultiplier = mapDefaultHealth;
    // v0.725 Soldier HP per-map default; parallel to vehicle health seed above.
    const mapDefaultSoldierHp = ACTIVE_MAP_CONFIG.defaultSoldierHpMultiplier ?? READY_DIALOG_SOLDIER_HP_MULT_DEFAULT;
    State.round.mapDefaultSoldierHpMultiplier = mapDefaultSoldierHp;
    State.round.modeConfig.soldierHpMultiplier = mapDefaultSoldierHp;
    State.round.modeConfig.confirmed.soldierHpMultiplier = mapDefaultSoldierHp;

    updateReadyDialogMapLabelForAllPlayers();
    updateTeamNameWidgetsForAllPlayers();
}

// Best-effort map detection by comparing HQ positions to map base anchors (bidirectional check).
function detectMapKeyFromHqs(): MapKey | undefined {
    const hq1Pos = mod.GetObjectPosition(mod.GetHQ(1));
    const hq2Pos = mod.GetObjectPosition(mod.GetHQ(2));

    const keys = Object.keys(MAP_CONFIGS) as MapKey[];
    for (const key of keys) {
        const cfg = MAP_CONFIGS[key];
        const d11 = mod.DistanceBetween(hq1Pos, cfg.team1Base);
        const d22 = mod.DistanceBetween(hq2Pos, cfg.team2Base);
        if (d11 <= MAP_DETECT_DISTANCE_METERS && d22 <= MAP_DETECT_DISTANCE_METERS) {
            return key;
        }

        const d12 = mod.DistanceBetween(hq1Pos, cfg.team2Base);
        const d21 = mod.DistanceBetween(hq2Pos, cfg.team1Base);
        if (d12 <= MAP_DETECT_DISTANCE_METERS && d21 <= MAP_DETECT_DISTANCE_METERS) {
            return key;
        }
    }

    return undefined;
}

// Finds the preset index matching left/right players + kill target; returns 0 if no exact match.
function findMatchupPresetIndex(leftPlayers: number, rightPlayers: number, roundKillsTarget: number): number {
    for (let i = 0; i < MATCHUP_PRESETS.length; i++) {
        const preset = MATCHUP_PRESETS[i];
        if (
            preset.leftPlayers === leftPlayers &&
            preset.rightPlayers === rightPlayers &&
            preset.roundKillsTarget === roundKillsTarget
        ) {
            return i;
        }
    }
    return 0;
}

//#endregion ----------------- Map + Matchup Helpers --------------------



//#region ----------------- String Variables --------------------

// -------------------- Strings.json key policy --------------------
//
// - UI labels (static text) should be shared (e.g., Label_TotalKills) rather than duplicated per team.
// - Per-team differences belong in layout/widget placement, not in duplicated label strings.
// - Dynamic values (numbers) are usually written into value widgets directly; avoid creating many one-off strings.
// - If you must use placeholders, keep formatting consistent across the file.
// - Reminder: UI widget `name:` values are NOT Strings.json keys; they are runtime widget IDs.
//
// Policy compliance checklist:
// - New UI text added? Put it in Strings.json under a shared key (no per-team duplication).
// - Using placeholders? Match existing formatting patterns for that section.
// - Reusing an existing label? Use the existing string key rather than a new alias.
// - Avoid creating string key constants unless reused in multiple places.
//
// ------------------------------------------------------------------

// UI widget ID constants (string prefixes used to find widgets).
// All UI widget IDs are per-player; the viewer's pid is appended at use sites.
const UI_TEAMSWITCH_CONTAINER_BASE_ID = "UI_TEAMSWITCH_CONTAINER_BASE_";
const UI_TEAMSWITCH_BORDER_TOP_ID = "UI_TEAMSWITCH_BORDER_TOP_";
const UI_TEAMSWITCH_BORDER_BOTTOM_ID = "UI_TEAMSWITCH_BORDER_BOTTOM_";
const UI_TEAMSWITCH_BORDER_LEFT_ID = "UI_TEAMSWITCH_BORDER_LEFT_";
const UI_TEAMSWITCH_BORDER_RIGHT_ID = "UI_TEAMSWITCH_BORDER_RIGHT_";
const UI_TEAMSWITCH_BUTTON_TEAM1_ID = "UI_TEAMSWITCH_BUTTON_TEAM1_";
const UI_TEAMSWITCH_BUTTON_TEAM2_ID = "UI_TEAMSWITCH_BUTTON_TEAM2_";
const UI_TEAMSWITCH_BUTTON_CANCEL_ID = "UI_TEAMSWITCH_BUTTON_CANCEL_";
const UI_TEAMSWITCH_BUTTON_CANCEL_LABEL_ID = "UI_TEAMSWITCH_BUTTON_CANCEL_LABEL_";
const UI_TEAMSWITCH_BUTTON_OPTOUT_ID = "UI_TEAMSWITCH_BUTTON_OPTOUT_";
const UI_TEAMSWITCH_DEBUG_TIMELIMIT_ID = "UI_TEAMSWITCH_DEBUG_TIMELIMIT_";

// Ready Dialog (Roster UI) - Widget ID bases (per-player IDs append viewer playerId).
const UI_READY_DIALOG_HEADER_ID = "UI_READY_DIALOG_HEADER_";
const UI_READY_DIALOG_HEADER2_ID = "UI_READY_DIALOG_HEADER2_";
const UI_READY_DIALOG_HEADER3_ID = "UI_READY_DIALOG_HEADER3_";
const UI_READY_DIALOG_HEADER4_ID = "UI_READY_DIALOG_HEADER4_";
const UI_READY_DIALOG_HEADER5_ID = "UI_READY_DIALOG_HEADER5_";
const UI_READY_DIALOG_HEADER6_ID = "UI_READY_DIALOG_HEADER6_";
const UI_READY_DIALOG_TEAM1_CONTAINER_ID = "UI_READY_DIALOG_TEAM1_CONTAINER_";
const UI_READY_DIALOG_TEAM2_CONTAINER_ID = "UI_READY_DIALOG_TEAM2_CONTAINER_";
const UI_READY_DIALOG_TEAM1_LABEL_ID = "UI_READY_DIALOG_TEAM1_LABEL_";
const UI_READY_DIALOG_TEAM2_LABEL_ID = "UI_READY_DIALOG_TEAM2_LABEL_";
const UI_READY_DIALOG_T1_ROW_NAME_ID = "UI_READY_DIALOG_T1_ROW_NAME_";
const UI_READY_DIALOG_T1_ROW_READY_ID = "UI_READY_DIALOG_T1_ROW_READY_";
const UI_READY_DIALOG_T1_ROW_BASE_ID = "UI_READY_DIALOG_T1_ROW_BASE_";
const UI_READY_DIALOG_T2_ROW_NAME_ID = "UI_READY_DIALOG_T2_ROW_NAME_";
const UI_READY_DIALOG_T2_ROW_READY_ID = "UI_READY_DIALOG_T2_ROW_READY_";
const UI_READY_DIALOG_T2_ROW_BASE_ID = "UI_READY_DIALOG_T2_ROW_BASE_";
const UI_READY_DIALOG_BUTTON_READY_ID = "UI_READY_DIALOG_BUTTON_READY_";
const UI_READY_DIALOG_BUTTON_READY_LABEL_ID = "UI_READY_DIALOG_BUTTON_READY_LABEL_";
const UI_READY_DIALOG_BUTTON_AUTO_READY_ID = "UI_READY_DIALOG_BUTTON_AUTO_READY_";
const UI_READY_DIALOG_BUTTON_AUTO_READY_LABEL_ID = "UI_READY_DIALOG_BUTTON_AUTO_READY_LABEL_";
const UI_READY_DIALOG_BUTTON_SWAP_ID = "UI_READY_DIALOG_BUTTON_SWAP_";
const UI_READY_DIALOG_BUTTON_SWAP_LABEL_ID = "UI_READY_DIALOG_BUTTON_SWAP_LABEL_";
const UI_READY_DIALOG_BESTOF_LABEL_ID = "UI_READY_DIALOG_BESTOF_LABEL_";
const UI_READY_DIALOG_BESTOF_DEC_ID = "UI_READY_DIALOG_BESTOF_DEC_";
const UI_READY_DIALOG_BESTOF_DEC_LABEL_ID = "UI_READY_DIALOG_BESTOF_DEC_LABEL_";
const UI_READY_DIALOG_BESTOF_INC_ID = "UI_READY_DIALOG_BESTOF_INC_";
const UI_READY_DIALOG_BESTOF_INC_LABEL_ID = "UI_READY_DIALOG_BESTOF_INC_LABEL_";
const UI_READY_DIALOG_MATCHUP_DEC_ID = "UI_READY_DIALOG_MATCHUP_DEC_";
const UI_READY_DIALOG_MATCHUP_DEC_LABEL_ID = "UI_READY_DIALOG_MATCHUP_DEC_LABEL_";
const UI_READY_DIALOG_MATCHUP_LABEL_ID = "UI_READY_DIALOG_MATCHUP_LABEL_";
const UI_READY_DIALOG_MATCHUP_INC_ID = "UI_READY_DIALOG_MATCHUP_INC_";
const UI_READY_DIALOG_MATCHUP_INC_LABEL_ID = "UI_READY_DIALOG_MATCHUP_INC_LABEL_";
const UI_READY_DIALOG_MINPLAYERS_DEC_ID = "UI_READY_DIALOG_MINPLAYERS_DEC_";
const UI_READY_DIALOG_MINPLAYERS_DEC_LABEL_ID = "UI_READY_DIALOG_MINPLAYERS_DEC_LABEL_";
const UI_READY_DIALOG_MINPLAYERS_INC_ID = "UI_READY_DIALOG_MINPLAYERS_INC_";
const UI_READY_DIALOG_MINPLAYERS_INC_LABEL_ID = "UI_READY_DIALOG_MINPLAYERS_INC_LABEL_";
const UI_READY_DIALOG_MATCHUP_MINPLAYERS_ID = "UI_READY_DIALOG_MATCHUP_MINPLAYERS_";
const UI_READY_DIALOG_MATCHUP_MINPLAYERS_TOTAL_ID = "UI_READY_DIALOG_MATCHUP_MINPLAYERS_TOTAL_";
const UI_READY_DIALOG_MATCHUP_KILLSTARGET_ID = "UI_READY_DIALOG_MATCHUP_KILLSTARGET_";
const UI_READY_DIALOG_MAP_LABEL_ID = "UI_READY_DIALOG_MAP_LABEL_";
const UI_READY_DIALOG_MAP_VALUE_ID = "UI_READY_DIALOG_MAP_VALUE_";
const UI_READY_DIALOG_MODE_GAME_LABEL_ID = "UI_READY_DIALOG_MODE_GAME_LABEL_";
const UI_READY_DIALOG_MODE_GAME_DEC_ID = "UI_READY_DIALOG_MODE_GAME_DEC_";
const UI_READY_DIALOG_MODE_GAME_DEC_LABEL_ID = "UI_READY_DIALOG_MODE_GAME_DEC_LABEL_";
const UI_READY_DIALOG_MODE_GAME_VALUE_ID = "UI_READY_DIALOG_MODE_GAME_VALUE_";
const UI_READY_DIALOG_MODE_GAME_INC_ID = "UI_READY_DIALOG_MODE_GAME_INC_";
const UI_READY_DIALOG_MODE_GAME_INC_LABEL_ID = "UI_READY_DIALOG_MODE_GAME_INC_LABEL_";
const UI_READY_DIALOG_MODE_SETTINGS_LABEL_ID = "UI_READY_DIALOG_MODE_SETTINGS_LABEL_";
const UI_READY_DIALOG_MODE_SETTINGS_DEC_ID = "UI_READY_DIALOG_MODE_SETTINGS_DEC_";
const UI_READY_DIALOG_MODE_SETTINGS_DEC_LABEL_ID = "UI_READY_DIALOG_MODE_SETTINGS_DEC_LABEL_";
const UI_READY_DIALOG_MODE_SETTINGS_VALUE_ID = "UI_READY_DIALOG_MODE_SETTINGS_VALUE_";
const UI_READY_DIALOG_MODE_SETTINGS_INC_ID = "UI_READY_DIALOG_MODE_SETTINGS_INC_";
const UI_READY_DIALOG_MODE_SETTINGS_INC_LABEL_ID = "UI_READY_DIALOG_MODE_SETTINGS_INC_LABEL_";
// Vehicle Health Multiplier knob widgets -- positioned to the LEFT of the Mode Settings row on the same Y.
// Layout (visually left-to-right): [-10] [<] Health:NNN% [>] [+10]   Mode Settings: [<] Aircraft Ceiling [>]
const UI_READY_DIALOG_VEHICLE_HEALTH_DEC10_ID = "UI_READY_DIALOG_VEHICLE_HEALTH_DEC10_";
const UI_READY_DIALOG_VEHICLE_HEALTH_DEC10_LABEL_ID = "UI_READY_DIALOG_VEHICLE_HEALTH_DEC10_LABEL_";
const UI_READY_DIALOG_VEHICLE_HEALTH_DEC_ID = "UI_READY_DIALOG_VEHICLE_HEALTH_DEC_";
const UI_READY_DIALOG_VEHICLE_HEALTH_DEC_LABEL_ID = "UI_READY_DIALOG_VEHICLE_HEALTH_DEC_LABEL_";
const UI_READY_DIALOG_VEHICLE_HEALTH_VALUE_ID = "UI_READY_DIALOG_VEHICLE_HEALTH_VALUE_";
const UI_READY_DIALOG_VEHICLE_HEALTH_INC_ID = "UI_READY_DIALOG_VEHICLE_HEALTH_INC_";
const UI_READY_DIALOG_VEHICLE_HEALTH_INC_LABEL_ID = "UI_READY_DIALOG_VEHICLE_HEALTH_INC_LABEL_";
const UI_READY_DIALOG_VEHICLE_HEALTH_INC10_ID = "UI_READY_DIALOG_VEHICLE_HEALTH_INC10_";
const UI_READY_DIALOG_VEHICLE_HEALTH_INC10_LABEL_ID = "UI_READY_DIALOG_VEHICLE_HEALTH_INC10_LABEL_";
// v0.725 Soldier HP Multiplier widget IDs. Same 5-widget shape as Vehicle HP: [-10] [<] val [>] [+10].
const UI_READY_DIALOG_SOLDIER_HP_DEC10_ID = "UI_READY_DIALOG_SOLDIER_HP_DEC10_";
const UI_READY_DIALOG_SOLDIER_HP_DEC10_LABEL_ID = "UI_READY_DIALOG_SOLDIER_HP_DEC10_LABEL_";
const UI_READY_DIALOG_SOLDIER_HP_DEC_ID = "UI_READY_DIALOG_SOLDIER_HP_DEC_";
const UI_READY_DIALOG_SOLDIER_HP_DEC_LABEL_ID = "UI_READY_DIALOG_SOLDIER_HP_DEC_LABEL_";
const UI_READY_DIALOG_SOLDIER_HP_VALUE_ID = "UI_READY_DIALOG_SOLDIER_HP_VALUE_";
const UI_READY_DIALOG_SOLDIER_HP_INC_ID = "UI_READY_DIALOG_SOLDIER_HP_INC_";
const UI_READY_DIALOG_SOLDIER_HP_INC_LABEL_ID = "UI_READY_DIALOG_SOLDIER_HP_INC_LABEL_";
const UI_READY_DIALOG_SOLDIER_HP_INC10_ID = "UI_READY_DIALOG_SOLDIER_HP_INC10_";
const UI_READY_DIALOG_SOLDIER_HP_INC10_LABEL_ID = "UI_READY_DIALOG_SOLDIER_HP_INC10_LABEL_";
const UI_READY_DIALOG_MODE_VEHICLES_T1_LABEL_ID = "UI_READY_DIALOG_MODE_VEHICLES_T1_LABEL_";
const UI_READY_DIALOG_MODE_VEHICLES_T1_DEC_ID = "UI_READY_DIALOG_MODE_VEHICLES_T1_DEC_";
const UI_READY_DIALOG_MODE_VEHICLES_T1_DEC_LABEL_ID = "UI_READY_DIALOG_MODE_VEHICLES_T1_DEC_LABEL_";
const UI_READY_DIALOG_MODE_VEHICLES_T1_VALUE_ID = "UI_READY_DIALOG_MODE_VEHICLES_T1_VALUE_";
const UI_READY_DIALOG_MODE_VEHICLES_T1_INC_ID = "UI_READY_DIALOG_MODE_VEHICLES_T1_INC_";
const UI_READY_DIALOG_MODE_VEHICLES_T1_INC_LABEL_ID = "UI_READY_DIALOG_MODE_VEHICLES_T1_INC_LABEL_";
const UI_READY_DIALOG_MODE_VEHICLES_T2_LABEL_ID = "UI_READY_DIALOG_MODE_VEHICLES_T2_LABEL_";
const UI_READY_DIALOG_MODE_VEHICLES_T2_DEC_ID = "UI_READY_DIALOG_MODE_VEHICLES_T2_DEC_";
const UI_READY_DIALOG_MODE_VEHICLES_T2_DEC_LABEL_ID = "UI_READY_DIALOG_MODE_VEHICLES_T2_DEC_LABEL_";
const UI_READY_DIALOG_MODE_VEHICLES_T2_VALUE_ID = "UI_READY_DIALOG_MODE_VEHICLES_T2_VALUE_";
const UI_READY_DIALOG_MODE_VEHICLES_T2_INC_ID = "UI_READY_DIALOG_MODE_VEHICLES_T2_INC_";
const UI_READY_DIALOG_MODE_VEHICLES_T2_INC_LABEL_ID = "UI_READY_DIALOG_MODE_VEHICLES_T2_INC_LABEL_";
const UI_READY_DIALOG_MODE_CONFIRM_ID = "UI_READY_DIALOG_MODE_CONFIRM_";
const UI_READY_DIALOG_MODE_CONFIRM_LABEL_ID = "UI_READY_DIALOG_MODE_CONFIRM_LABEL_";
const UI_READY_DIALOG_MODE_RESET_ID = "UI_READY_DIALOG_MODE_RESET_";
const UI_READY_DIALOG_UNSAVED_NOTICE_ID = "UI_READY_DIALOG_UNSAVED_NOTICE_";
const UI_READY_DIALOG_CEILING_LOCK_NOTICE_ID = "UI_READY_DIALOG_CEILING_LOCK_NOTICE_";
// v0.733 Restart-needed notice -- per-pid red text below the Restart button when needsRestartForVehicleChange.
const UI_READY_DIALOG_RESTART_NEEDED_NOTICE_ID = "UI_READY_DIALOG_RESTART_NEEDED_NOTICE_";
const UI_READY_DIALOG_MODE_RESET_LABEL_ID = "UI_READY_DIALOG_MODE_RESET_LABEL_";

// Admin/Tester UI - Widget ID bases (per-player IDs append viewer playerId).
const UI_TEST_HEADER_LABEL_ID = "UI_TEST_HEADER_LABEL_";
const UI_TEST_BUTTON_LEFT_WINS_DEC_ID = "UI_TEST_BUTTON_LEFT_WINS_DEC_";
const UI_TEST_BUTTON_LEFT_WINS_INC_ID = "UI_TEST_BUTTON_LEFT_WINS_INC_";
const UI_TEST_BUTTON_RIGHT_WINS_DEC_ID = "UI_TEST_BUTTON_RIGHT_WINS_DEC_";
const UI_TEST_BUTTON_RIGHT_WINS_INC_ID = "UI_TEST_BUTTON_RIGHT_WINS_INC_";
const UI_TEST_BUTTON_LEFT_KILLS_DEC_ID = "UI_TEST_BUTTON_LEFT_KILLS_DEC_";
const UI_TEST_BUTTON_LEFT_KILLS_INC_ID = "UI_TEST_BUTTON_LEFT_KILLS_INC_";
const UI_TEST_BUTTON_RIGHT_KILLS_DEC_ID = "UI_TEST_BUTTON_RIGHT_KILLS_DEC_";
const UI_TEST_BUTTON_RIGHT_KILLS_INC_ID = "UI_TEST_BUTTON_RIGHT_KILLS_INC_";
const UI_ADMIN_BUTTON_T1_ROUND_KILLS_DEC_ID = "UI_ADMIN_BUTTON_T1_ROUND_KILLS_DEC_";
const UI_ADMIN_BUTTON_T1_ROUND_KILLS_INC_ID = "UI_ADMIN_BUTTON_T1_ROUND_KILLS_INC_";
const UI_ADMIN_BUTTON_T2_ROUND_KILLS_DEC_ID = "UI_ADMIN_BUTTON_T2_ROUND_KILLS_DEC_";
const UI_ADMIN_BUTTON_T2_ROUND_KILLS_INC_ID = "UI_ADMIN_BUTTON_T2_ROUND_KILLS_INC_";
const UI_TEST_BUTTON_ROUND_KILLS_TARGET_DEC_ID = "UI_TEST_BUTTON_ROUND_KILLS_TARGET_DEC_";
const UI_TEST_BUTTON_ROUND_KILLS_TARGET_INC_ID = "UI_TEST_BUTTON_ROUND_KILLS_TARGET_INC_";
const UI_TEST_LABEL_ROUND_KILLS_TARGET_ID = "UI_TEST_LABEL_ROUND_KILLS_TARGET_";
const UI_TEST_VALUE_ROUND_KILLS_TARGET_ID = "UI_TEST_VALUE_ROUND_KILLS_TARGET_";
const UI_TEST_BUTTON_TIES_DEC_ID = "UI_TEST_BUTTON_TIES_DEC_";
const UI_TEST_BUTTON_TIES_INC_ID = "UI_TEST_BUTTON_TIES_INC_";
const UI_TEST_BUTTON_CUR_ROUND_DEC_ID = "UI_TEST_BUTTON_CUR_ROUND_DEC_";
const UI_TEST_BUTTON_CUR_ROUND_INC_ID = "UI_TEST_BUTTON_CUR_ROUND_INC_";
const UI_TEST_BUTTON_CLOCK_TIME_DEC_ID = "UI_TEST_BUTTON_CLOCK_TIME_DEC_";
const UI_TEST_BUTTON_CLOCK_TIME_INC_ID = "UI_TEST_BUTTON_CLOCK_TIME_INC_";
const UI_TEST_BUTTON_CLOCK_RESET_ID = "UI_TEST_BUTTON_CLOCK_RESET_";
const UI_TEST_BUTTON_ROUND_START_ID = "UI_TEST_BUTTON_ROUND_START_";
const UI_TEST_BUTTON_ROUND_END_ID = "UI_TEST_BUTTON_ROUND_END_";
const UI_TEST_BUTTON_POS_DEBUG_ID = "UI_TEST_BUTTON_POS_DEBUG_";
const UI_TEST_LABEL_LEFT_WINS_ID = "UI_TEST_LABEL_LEFT_WINS_";
const UI_TEST_LABEL_RIGHT_WINS_ID = "UI_TEST_LABEL_RIGHT_WINS_";
const UI_TEST_LABEL_LEFT_KILLS_ID = "UI_TEST_LABEL_LEFT_KILLS_";
const UI_TEST_LABEL_RIGHT_KILLS_ID = "UI_TEST_LABEL_RIGHT_KILLS_";
const UI_ADMIN_LABEL_T1_ROUND_KILLS_ID = "UI_ADMIN_LABEL_T1_ROUND_KILLS_";
const UI_ADMIN_LABEL_T2_ROUND_KILLS_ID = "UI_ADMIN_LABEL_T2_ROUND_KILLS_";
const UI_TEST_LABEL_TIES_ID = "UI_TEST_LABEL_TIES_";
const UI_TEST_LABEL_CUR_ROUND_ID = "UI_TEST_LABEL_CUR_ROUND_";
const UI_TEST_LABEL_CLOCK_TIME_ID = "UI_TEST_LABEL_CLOCK_TIME_";
const UI_TEST_PLUS_TEXT_ID = "UI_TEST_PLUS_TEXT_";
const UI_TEST_MINUS_TEXT_ID = "UI_TEST_MINUS_TEXT_";
const UI_TEST_RESET_TEXT_ID = "UI_TEST_RESET_TEXT_";
const UI_TEST_ROUND_START_TEXT_ID = "UI_TEST_ROUND_START_TEXT_";
const UI_TEST_ROUND_END_TEXT_ID = "UI_TEST_ROUND_END_TEXT_";
const UI_TEST_POS_DEBUG_TEXT_ID = "UI_TEST_POS_DEBUG_TEXT_";
const UI_ADMIN_TIEBREAKER_LABEL_ID = "UI_ADMIN_TIEBREAKER_LABEL_";
const UI_ADMIN_TIEBREAKER_BUTTON_ID = "UI_ADMIN_TIEBREAKER_BUTTON_";
const UI_ADMIN_TIEBREAKER_BUTTON_TEXT_ID = "UI_ADMIN_TIEBREAKER_BUTTON_TEXT_";
const UI_ADMIN_TIEBREAKER_MODE_DEC_ID = "UI_ADMIN_TIEBREAKER_MODE_DEC_";
const UI_ADMIN_TIEBREAKER_MODE_INC_ID = "UI_ADMIN_TIEBREAKER_MODE_INC_";
const UI_ADMIN_TIEBREAKER_MODE_LABEL_ID = "UI_ADMIN_TIEBREAKER_MODE_LABEL_";
const UI_ADMIN_TIEBREAKER_MODE_HEADER_ID = "UI_ADMIN_TIEBREAKER_MODE_HEADER_";
const UI_ADMIN_LIVE_RESPAWN_BUTTON_ID = "UI_ADMIN_LIVE_RESPAWN_BUTTON_";
const UI_ADMIN_LIVE_RESPAWN_TEXT_ID = "UI_ADMIN_LIVE_RESPAWN_TEXT_";
const UI_ADMIN_CEILING_PUNISH_BUTTON_ID = "UI_ADMIN_CEILING_PUNISH_BUTTON_";
const UI_ADMIN_CEILING_PUNISH_TEXT_ID = "UI_ADMIN_CEILING_PUNISH_TEXT_";
const UI_ADMIN_ROUND_LENGTH_DEC_ID = "UI_ADMIN_ROUND_LENGTH_DEC_";
const UI_ADMIN_ROUND_LENGTH_INC_ID = "UI_ADMIN_ROUND_LENGTH_INC_";
const UI_ADMIN_ROUND_LENGTH_LABEL_ID = "UI_ADMIN_ROUND_LENGTH_LABEL_";
// H-P1: Admin Panel "Hard Buffer" knob for the aircraft hard-ceiling offset (gap between black
// screen threshold and engine pushback). Static label + separate value widget.
const UI_ADMIN_AIRCRAFT_BUFFER_DEC_ID = "UI_ADMIN_AIRCRAFT_BUFFER_DEC_";
const UI_ADMIN_AIRCRAFT_BUFFER_INC_ID = "UI_ADMIN_AIRCRAFT_BUFFER_INC_";
const UI_ADMIN_AIRCRAFT_BUFFER_LABEL_ID = "UI_ADMIN_AIRCRAFT_BUFFER_LABEL_";
const UI_ADMIN_AIRCRAFT_BUFFER_VALUE_ID = "UI_ADMIN_AIRCRAFT_BUFFER_VALUE_";
// v0.666: Admin Panel "Warn Buffer" knob -- gap between the soft warning (yellow altimeter +
// "ALTITUDE WARNING" label) and the black-screen dialog. Same pattern as Hard Buffer row.
const UI_ADMIN_AIRCRAFT_WARN_BUFFER_DEC_ID = "UI_ADMIN_AIRCRAFT_WARN_BUFFER_DEC_";
const UI_ADMIN_AIRCRAFT_WARN_BUFFER_INC_ID = "UI_ADMIN_AIRCRAFT_WARN_BUFFER_INC_";
const UI_ADMIN_AIRCRAFT_WARN_BUFFER_LABEL_ID = "UI_ADMIN_AIRCRAFT_WARN_BUFFER_LABEL_";
const UI_ADMIN_AIRCRAFT_WARN_BUFFER_VALUE_ID = "UI_ADMIN_AIRCRAFT_WARN_BUFFER_VALUE_";
// v0.674: per-pid altimeter widget IDs. EAGER-built in ensureHudForPlayer using the EXACT
// same pattern as Upper_Left_Container_ (TopLeft anchor, visible:true, visible-bg root) -- the
// lazy-built v0.666-v0.673 approach never positioned where requested because of some
// interaction between lazy build + invisible root + position constants that I couldn't pin
// down across 8 attempts. Renamed to "Altimeter_v674_*" so any persisted widget tree from
// v0.666-v0.673 is orphaned and ignored by safeFind.
const UI_ALTIMETER_ROOT_ID = "Altimeter_v674_Root_";
const UI_ALTIMETER_CARD_ID = "Altimeter_v674_Card_";
const UI_ALTIMETER_TEXT_ID = "Altimeter_v674_Text_";
const UI_ALTIMETER_WARNING_LABEL_ID = "Altimeter_v674_WarningLabel_";

// Debug Positioning UI
const UI_POS_DEBUG_CONTAINER_ID = "UI_POS_DEBUG_CONTAINER_";
const UI_POS_DEBUG_X_ID = "UI_POS_DEBUG_X_";
const UI_POS_DEBUG_Y_ID = "UI_POS_DEBUG_Y_";
const UI_POS_DEBUG_Z_ID = "UI_POS_DEBUG_Z_";
const UI_POS_DEBUG_ROTY_ID = "UI_POS_DEBUG_ROTY_";

// Admin Panel (decoupled from main Team Switch dialog)
const UI_ADMIN_PANEL_BUTTON_ID = "UI_ADMIN_PANEL_BUTTON_";
const UI_ADMIN_PANEL_BUTTON_LABEL_ID = "UI_ADMIN_PANEL_BUTTON_LABEL_";
const UI_ADMIN_PANEL_CONTAINER_ID = "UI_ADMIN_PANEL_CONTAINER_";

// "Over the line" messaging strings
const BIG_TITLE_WIDGET_ID = "BigTitle_";
const BIG_SUBTITLE_WIDGET_ID = "BigSubtitle_";
const BIG_TITLE_SHADOW_WIDGET_ID = "BigTitleShadow_";
const BIG_SUBTITLE_SHADOW_WIDGET_ID = "BigSubtitleShadow_";

//#endregion -------------- String Variables --------------------
