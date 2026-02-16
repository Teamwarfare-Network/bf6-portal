// @ts-nocheck
// Module: ready-dialog/matchup-summary -- team names, matchup readouts, and settings summary HUD

//#region -------------------- Ready Dialog - Team/Matchup Readouts + Summary HUD --------------------

function updateTeamNameWidgetsForPid(pid: number): void {
    const t1NameKey = getTeamNameKey(TeamID.Team1);
    const t2NameKey = getTeamNameKey(TeamID.Team2);

    const hudT1 = safeFind(`TeamLeft_Name_${pid}`);
    const hudT2 = safeFind(`TeamRight_Name_${pid}`);
    if (hudT1) mod.SetUITextLabel(hudT1, mod.Message(t1NameKey));
    if (hudT2) mod.SetUITextLabel(hudT2, mod.Message(t2NameKey));

    const readyT1 = safeFind(UI_READY_DIALOG_TEAM1_LABEL_ID + pid);
    const readyT2 = safeFind(UI_READY_DIALOG_TEAM2_LABEL_ID + pid);
    if (readyT1) mod.SetUITextLabel(readyT1, mod.Message(t1NameKey));
    if (readyT2) mod.SetUITextLabel(readyT2, mod.Message(t2NameKey));

    updateReadyDialogModeConfigForPid(pid);
}

function updateTeamNameWidgetsForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        updateTeamNameWidgetsForPid(mod.GetObjId(p));
    }
    updateSettingsSummaryHudForAllPlayers();
}

function updateMatchupLabelForPid(pid: number): void {
    const labelId = UI_READY_DIALOG_MATCHUP_LABEL_ID + pid;
    const labelWidget = safeFind(labelId);
    if (!labelWidget) return;
    const showLabel = !isRoundLive();
    mod.SetUIWidgetVisible(labelWidget, showLabel);
    if (!showLabel) return;
    const preset = MATCHUP_PRESETS[State.round.matchupPresetIndex];
    mod.SetUITextLabel(
        labelWidget,
        mod.Message(mod.stringkeys.twl.readyDialog.matchupFormat, preset.leftPlayers, preset.rightPlayers)
    );
}

// Refreshes the matchup label (e.g., "1 vs 1") for every active player HUD.
function updateMatchupLabelForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        updateMatchupLabelForPid(mod.GetObjId(p));
    }
}

// Resolves the per-side + total player requirements from the auto-start setting.
// Special case: value 0 represents "1 vs 0" to allow solo starts.
function getAutoStartMinPlayerCounts(): { left: number; right: number; total: number } {
    const perSide = Math.floor(State.round.autoStartMinActivePlayers);
    if (perSide <= 0) {
        return { left: 1, right: 0, total: 1 };
    }
    return { left: perSide, right: perSide, total: perSide * 2 };
}

// Updates per-player Ready Dialog readouts (matchup target value + players-per-side) for a single pid.
function updateMatchupReadoutsForPid(pid: number): void {
    const minPlayersWidget = safeFind(UI_READY_DIALOG_MATCHUP_MINPLAYERS_ID + pid);
    const minPlayersTotalWidget = safeFind(UI_READY_DIALOG_MATCHUP_MINPLAYERS_TOTAL_ID + pid);
    const killsTargetWidget = safeFind(UI_READY_DIALOG_MATCHUP_KILLSTARGET_ID + pid);
    const counts = getAutoStartMinPlayerCounts();
    const showLiveReadouts = !isRoundLive();
    if (minPlayersWidget) {
        mod.SetUIWidgetVisible(minPlayersWidget, showLiveReadouts);
    }
    if (minPlayersTotalWidget) {
        mod.SetUIWidgetVisible(minPlayersTotalWidget, showLiveReadouts);
    }
    if (killsTargetWidget) {
        mod.SetUIWidgetVisible(killsTargetWidget, showLiveReadouts);
    }
    if (!showLiveReadouts) return;
    if (minPlayersWidget) {
        mod.SetUITextLabel(
            minPlayersWidget,
            mod.Message(mod.stringkeys.twl.readyDialog.playersFormat, counts.left, counts.right)
        );
    }
    if (minPlayersTotalWidget) {
        mod.SetUITextLabel(
            minPlayersTotalWidget,
            mod.Message(mod.stringkeys.twl.readyDialog.minPlayersToStartFormat, counts.total)
        );
    }
    if (killsTargetWidget) {
        mod.SetUITextLabel(
            killsTargetWidget,
            mod.Message(mod.stringkeys.twl.readyDialog.targetKillsToWinFormat, Math.floor(State.round.killsTarget))
        );
    }
}

// Refreshes the matchup readouts for all players with a Ready dialog HUD.
function updateMatchupReadoutsForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        updateMatchupReadoutsForPid(mod.GetObjId(p));
    }
    updateSettingsSummaryHudForAllPlayers();
}

// Uses confirmed mode settings only (pending Ready dialog tweaks are not shown here).
function updateSettingsSummaryHudForPid(pid: number): void {
    const refs = State.hudCache.hudByPid[pid];
    if (!refs) return;

    const cfg = State.round.modeConfig;
    const gameModeValue = cfg.confirmed.gameMode;
    const applyCustomCeiling = shouldApplyCustomCeilingForConfig(gameModeValue, cfg.confirmed.aircraftCeilingOverrideEnabled);
    const ceilingValue = applyCustomCeiling
        ? Math.floor(cfg.confirmed.aircraftCeiling)
        : STR_READY_DIALOG_AIRCRAFT_CEILING_VANILLA;
    const vehiclesT1Value = cfg.confirmed.vehiclesT1;
    const vehiclesT2Value = cfg.confirmed.vehiclesT2;

    const preset = MATCHUP_PRESETS[State.round.matchupPresetIndex] ?? MATCHUP_PRESETS[0];
    const vehiclesLeft = preset?.leftPlayers ?? 1;
    const vehiclesRight = preset?.rightPlayers ?? 1;
    const autoStartCounts = getAutoStartMinPlayerCounts();

    if (refs.settingsGameModeText) {
        mod.SetUITextLabel(refs.settingsGameModeText, mod.Message(STR_HUD_SETTINGS_GAME_MODE_FORMAT, gameModeValue));
    }
    if (refs.settingsAircraftCeilingText) {
        mod.SetUITextLabel(refs.settingsAircraftCeilingText, mod.Message(STR_HUD_SETTINGS_AIRCRAFT_CEILING_FORMAT, ceilingValue));
    }
    if (refs.settingsVehiclesT1Text) {
        mod.SetUITextLabel(
            refs.settingsVehiclesT1Text,
            mod.Message(STR_HUD_SETTINGS_VEHICLES_TEAM_FORMAT, getTeamNameKey(TeamID.Team1), vehiclesT1Value)
        );
    }
    if (refs.settingsVehiclesT2Text) {
        mod.SetUITextLabel(
            refs.settingsVehiclesT2Text,
            mod.Message(STR_HUD_SETTINGS_VEHICLES_TEAM_FORMAT, getTeamNameKey(TeamID.Team2), vehiclesT2Value)
        );
    }
    if (refs.settingsVehiclesMatchupText) {
        const showMatchupText = !isRoundLive();
        mod.SetUIWidgetVisible(refs.settingsVehiclesMatchupText, showMatchupText);
        if (showMatchupText) {
            mod.SetUITextLabel(refs.settingsVehiclesMatchupText, mod.Message(STR_HUD_SETTINGS_VEHICLES_MATCHUP_FORMAT, vehiclesLeft, vehiclesRight));
        }
    }
    if (refs.settingsPlayersText) {
        mod.SetUITextLabel(refs.settingsPlayersText, mod.Message(STR_HUD_SETTINGS_PLAYERS_FORMAT, autoStartCounts.left, autoStartCounts.right));
    }
}

function updateSettingsSummaryHudForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        updateSettingsSummaryHudForPid(mod.GetObjId(p));
    }
}

function setAutoStartMinActivePlayers(value: number, eventPlayer?: mod.Player): void {
    const clamped = Math.max(AUTO_START_MIN_ACTIVE_PLAYERS_MIN, Math.min(AUTO_START_MIN_ACTIVE_PLAYERS_MAX, Math.floor(value)));
    if (clamped === State.round.autoStartMinActivePlayers) return;
    ensureCustomGameModeForManualChange();
    State.round.autoStartMinActivePlayers = clamped;
    updateMatchupReadoutsForAllPlayers();
    if (eventPlayer) {
        const counts = getAutoStartMinPlayerCounts();
        sendHighlightedWorldLogMessage(
            mod.Message(STR_READY_DIALOG_PLAYERS_CHANGED, eventPlayer, counts.left, counts.right),
            true,
            undefined,
            STR_READY_DIALOG_PLAYERS_CHANGED
        );
        tryAutoStartRoundIfAllReady(eventPlayer);
    }
}

// Applies the selected matchup preset, updates UI/state, and re-enables spawners (not-live only).
function applyMatchupPresetInternal(
    index: number,
    eventPlayer?: mod.Player,
    announce: boolean = true,
    bypassCooldown: boolean = false
): void {
    const clamped = Math.max(0, Math.min(MATCHUP_PRESETS.length - 1, Math.floor(index)));
    if (clamped === State.round.matchupPresetIndex) return;
    if (State.vehicles.spawnSequenceInProgress) return;
    const now = Math.floor(mod.GetMatchTimeElapsed());
    if (!bypassCooldown && now - State.round.lastMatchupChangeAtSeconds < MATCHUP_CHANGE_COOLDOWN_SECONDS) return;
    if (announce) {
        ensureCustomGameModeForManualChange();
    }
    const preset = MATCHUP_PRESETS[clamped];
    State.round.matchupPresetIndex = clamped;
    State.round.lastMatchupChangeAtSeconds = now;
    State.round.killsTarget = preset.roundKillsTarget;

    updateMatchupLabelForAllPlayers();
    updateMatchupReadoutsForAllPlayers();
    setRoundStateTextForAllPlayers();

    if (announce && eventPlayer) {
        sendHighlightedWorldLogMessage(
            mod.Message(STR_READY_DIALOG_MATCHUP_CHANGED, eventPlayer, preset.leftPlayers, preset.rightPlayers),
            true,
            undefined,
            STR_READY_DIALOG_MATCHUP_CHANGED
        );
    }

    applySpawnerEnablementForMatchup(clamped, true);

    // If the new minimum is satisfied, auto-start when all active players are ready.
    if (announce && eventPlayer) {
        tryAutoStartRoundIfAllReady(eventPlayer);
    }
}

// Applies the selected matchup preset, updates UI/state, and re-enables spawners (not-live only).
function applyMatchupPreset(index: number, eventPlayer: mod.Player): void {
    applyMatchupPresetInternal(index, eventPlayer, true, false);
}

//#endregion ----------------- Ready Dialog - Team/Matchup Readouts + Summary HUD --------------------
