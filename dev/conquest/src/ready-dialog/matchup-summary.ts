// @ts-nocheck
// Module: ready-dialog/matchup-summary -- team names and matchup/min-player readouts

//#region -------------------- Ready Dialog - Team/Matchup Readouts --------------------

function updateTeamNameWidgetsForPid(pid: number): void {
    const t1NameKey = getTeamNameKey(TeamID.Team1);
    const t2NameKey = getTeamNameKey(TeamID.Team2);

    const hudT1 = safeFind(`TeamLeft_Name_${pid}`);
    const hudT2 = safeFind(`TeamRight_Name_${pid}`);
    safeSetUITextLabel(hudT1, mod.Message(t1NameKey));
    safeSetUITextLabel(hudT2, mod.Message(t2NameKey));

    const readyT1 = safeFind(UI_READY_DIALOG_TEAM1_LABEL_ID + pid);
    const readyT2 = safeFind(UI_READY_DIALOG_TEAM2_LABEL_ID + pid);
    safeSetUITextLabel(readyT1, mod.Message(t1NameKey));
    safeSetUITextLabel(readyT2, mod.Message(t2NameKey));

    updateReadyDialogModeConfigForPid(pid);
}

// Refreshes team-name labels for every connected player.
function updateTeamNameWidgetsForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        updateTeamNameWidgetsForPid(mod.GetObjId(p));
    }
}

// Refreshes ready-dialog matchup/config readouts for all visible viewers.
function updateMatchupLabelForAllPlayers(): void {
    updateReadyDialogModeConfigForAllVisibleViewers();
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

// Refreshes ready-dialog player/min-player readouts for all visible viewers.
function updateMatchupReadoutsForAllPlayers(): void {
    updateReadyDialogModeConfigForAllVisibleViewers();
}

// Sets minimum active players-per-side with clamping, UI refresh, and optional announce/start check.
function setAutoStartMinActivePlayers(value: number, eventPlayer?: mod.Player): void {
    const clamped = Math.max(AUTO_START_MIN_ACTIVE_PLAYERS_MIN, Math.min(AUTO_START_MIN_ACTIVE_PLAYERS_MAX, Math.floor(value)));
    if (clamped === State.round.autoStartMinActivePlayers) return;
    ensureCustomGameModeForManualChange();
    State.round.autoStartMinActivePlayers = clamped;
    updateReadyDialogModeConfigForAllVisibleViewers();
    // Keep top-left status dock ready counts in immediate sync with min-player configuration changes.
    setMatchStateTextForAllPlayers();
    if (eventPlayer) {
        const counts = getAutoStartMinPlayerCounts();
        sendHighlightedWorldLogMessage(
            mod.Message(STR_READY_DIALOG_PLAYERS_CHANGED, eventPlayer, counts.left, counts.right),
            true,
            undefined,
            STR_READY_DIALOG_PLAYERS_CHANGED
        );
        tryAutoStartMatchIfAllReady(eventPlayer);
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

    updateMatchupLabelForAllPlayers();
    updateReadyDialogModeConfigForAllVisibleViewers();
    setMatchStateTextForAllPlayers();

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
        tryAutoStartMatchIfAllReady(eventPlayer);
    }
}

// Applies the selected matchup preset, updates UI/state, and re-enables spawners (not-live only).
function applyMatchupPreset(index: number, eventPlayer: mod.Player): void {
    applyMatchupPresetInternal(index, eventPlayer, true, false);
}

//#endregion ----------------- Ready Dialog - Team/Matchup Readouts --------------------
