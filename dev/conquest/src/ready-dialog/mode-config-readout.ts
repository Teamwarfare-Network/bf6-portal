// @ts-nocheck
// Module: ready-dialog/mode-config-readout -- ready dialog map/mode readout label updates

//#region -------------------- Ready Dialog - Map/Mode Config UI Readout --------------------

function updateReadyDialogMapLabelForPid(pid: number): void {
    const labelWidget = safeFind(UI_READY_DIALOG_MAP_LABEL_ID + pid);
    const valueId = UI_READY_DIALOG_MAP_VALUE_ID + pid;
    const valueWidget = safeFind(valueId);
    if (labelWidget) {
        mod.SetUIWidgetParent(labelWidget, mod.GetUIRoot());
    }
    if (!valueWidget) return;
    mod.SetUIWidgetParent(valueWidget, mod.GetUIRoot());
    mod.SetUITextLabel(valueWidget, mod.Message(getMapNameKey(ACTIVE_MAP_KEY)));
}

// Refreshes the map label/value pair for all connected players.
function updateReadyDialogMapLabelForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        updateReadyDialogMapLabelForPid(mod.GetObjId(p));
    }
}

function updateReadyDialogGridColumnHeaderForPid(pid: number, columnKey: string, label: mod.Message): void {
    const widget = safeFind(UI_READY_DIALOG_MODE_GRID_COLUMN_HEADER_ID + columnKey + "_" + pid);
    if (!widget) return;
    mod.SetUITextLabel(widget, label);
}

function updateReadyDialogGridKnobLabelForPid(pid: number, knobKey: string, labelKey: number): void {
    const widget = safeFind(UI_READY_DIALOG_MODE_GRID_KNOB_LABEL_ID + knobKey + "_" + pid);
    if (!widget) return;
    const resolvedLabelKey = labelKey !== undefined && labelKey !== null
        ? labelKey
        : mod.stringkeys.twl.system.unknownPlayer;
    mod.SetUITextLabel(widget, mod.Message(resolvedLabelKey));
}

function updateReadyDialogGridKnobValueForPid(pid: number, knobKey: string, label: mod.Message): void {
    const widget = safeFind(UI_READY_DIALOG_MODE_GRID_KNOB_VALUE_ID + knobKey + "_" + pid);
    if (!widget) return;
    mod.SetUITextLabel(widget, label);
}

function updateReadyDialogGridSupportForPid(pid: number, columnKey: string, label: mod.Message): void {
    const widget = safeFind(UI_READY_DIALOG_MODE_GRID_SUPPORT_ID + columnKey + "_" + pid);
    if (!widget) return;
    mod.SetUITextLabel(widget, label);
}

function setReadyDialogGridKnobRowVisibleForPid(pid: number, knobKey: string, visible: boolean): void {
    const widgetIds = [
        UI_READY_DIALOG_MODE_GRID_KNOB_PANEL_ID + knobKey + "_" + pid,
        UI_READY_DIALOG_MODE_GRID_KNOB_LABEL_ID + knobKey + "_" + pid,
        UI_READY_DIALOG_MODE_GRID_KNOB_VALUE_ID + knobKey + "_" + pid,
        UI_READY_DIALOG_MODE_GRID_KNOB_DEC_ID + knobKey + "_" + pid + "_BORDER",
        UI_READY_DIALOG_MODE_GRID_KNOB_DEC_ID + knobKey + "_" + pid,
        UI_READY_DIALOG_MODE_GRID_KNOB_DEC_LABEL_ID + knobKey + "_" + pid,
        UI_READY_DIALOG_MODE_GRID_KNOB_INC_ID + knobKey + "_" + pid + "_BORDER",
        UI_READY_DIALOG_MODE_GRID_KNOB_INC_ID + knobKey + "_" + pid,
        UI_READY_DIALOG_MODE_GRID_KNOB_INC_LABEL_ID + knobKey + "_" + pid,
    ];
    for (const widgetId of widgetIds) {
        const widget = safeFind(widgetId);
        if (!widget) continue;
        mod.SetUIWidgetVisible(widget, visible);
    }
    const decButton = safeFind(UI_READY_DIALOG_MODE_GRID_KNOB_DEC_ID + knobKey + "_" + pid);
    const incButton = safeFind(UI_READY_DIALOG_MODE_GRID_KNOB_INC_ID + knobKey + "_" + pid);
    if (decButton) mod.SetUIButtonEnabled(decButton, visible);
    if (incButton) mod.SetUIButtonEnabled(incButton, visible);
}

function setReadyDialogGridColumnHeaderColorForPid(pid: number, columnKey: string, color: mod.Vector): void {
    const widget = safeFind(UI_READY_DIALOG_MODE_GRID_COLUMN_HEADER_ID + columnKey + "_" + pid);
    if (!widget) return;
    mod.SetUITextColor(widget, color);
}

function setReadyDialogGridKnobPanelThemeForPid(
    pid: number,
    knobKey: string,
    color: mod.Vector,
    alpha: number
): void {
    const widget = safeFind(UI_READY_DIALOG_MODE_GRID_KNOB_PANEL_ID + knobKey + "_" + pid);
    if (!widget) return;
    mod.SetUIWidgetBgColor(widget, color);
    mod.SetUIWidgetBgAlpha(widget, alpha);
}

function setReadyDialogGridKnobButtonGlyphColorForPid(pid: number, knobKey: string, color: mod.Vector): void {
    const decLabel = safeFind(UI_READY_DIALOG_MODE_GRID_KNOB_DEC_LABEL_ID + knobKey + "_" + pid);
    const incLabel = safeFind(UI_READY_DIALOG_MODE_GRID_KNOB_INC_LABEL_ID + knobKey + "_" + pid);
    if (decLabel) mod.SetUITextColor(decLabel, color);
    if (incLabel) mod.SetUITextColor(incLabel, color);
}

function getReadyDialogViewerTeamVisuals(pid: number): {
    team1Text: mod.Vector;
    team2Text: mod.Vector;
    team1Bg: mod.Vector;
    team2Bg: mod.Vector;
} {
    const viewer = safeFindPlayer(pid);
    const viewerTeam = safeGetTeamNumberFromPlayer(viewer, TeamID.Team1);
    if (viewerTeam === TeamID.Team2) {
        return {
            team1Text: COLOR_RED,
            team2Text: COLOR_BLUE,
            team1Bg: COLOR_RED_DARK,
            team2Bg: COLOR_BLUE_DARK,
        };
    }
    return {
        team1Text: COLOR_BLUE,
        team2Text: COLOR_RED,
        team1Bg: COLOR_BLUE_DARK,
        team2Bg: COLOR_RED_DARK,
    };
}

function getReadyDialogPlayersValueMessage(): mod.Message {
    const counts = getAutoStartMinPlayerCounts();
    return mod.Message(mod.stringkeys.twl.readyDialog.playersFormat, counts.left, counts.right);
}

function getReadyDialogMinPlayersSupportMessage(): mod.Message {
    const counts = getAutoStartMinPlayerCounts();
    return mod.Message(mod.stringkeys.twl.readyDialog.minPlayersToStartFormat, counts.total);
}

// Updates Ready Dialog mode-setting labels/values for a specific viewer pid.
function updateReadyDialogModeConfigForPid(pid: number): void {
    const cfg = State.round.modeConfig;
    const visuals = getReadyDialogViewerTeamVisuals(pid);
    const columns = getReadyDialogModeGridColumnSpecs();

    for (const column of columns) {
        updateReadyDialogGridColumnHeaderForPid(pid, column.key, getReadyDialogModeGridColumnHeaderMessage(column));

        const isConfigColumn = column.key === "config";
        const headerColor = isConfigColumn
            ? COLOR_WHITE
            : column.teamId === TeamID.Team1
                ? visuals.team1Text
                : visuals.team2Text;
        setReadyDialogGridColumnHeaderColorForPid(pid, column.key, headerColor);

        for (const knob of column.knobSpecs) {
            if (isReadyDialogModeGridPlaceholderKnobKey(knob.key)) {
                setReadyDialogGridKnobRowVisibleForPid(pid, knob.key, false);
                continue;
            }
            setReadyDialogGridKnobRowVisibleForPid(pid, knob.key, true);
            if (knob.key === READY_DIALOG_CONFIG_PLAYERS_KNOB_KEY) {
                const playersLabelWidget = safeFind(UI_READY_DIALOG_MODE_GRID_KNOB_LABEL_ID + knob.key + "_" + pid);
                if (playersLabelWidget) {
                    mod.SetUITextLabel(playersLabelWidget, mod.Message(mod.stringkeys.twl.system.genericCounter, ""));
                    mod.SetUIWidgetVisible(playersLabelWidget, false);
                }
            } else {
                updateReadyDialogGridKnobLabelForPid(pid, knob.key, knob.labelKey);
            }

            if (isConfigColumn) {
                setReadyDialogGridKnobPanelThemeForPid(pid, knob.key, COLOR_GRAY_DARK, 0.40);
                setReadyDialogGridKnobButtonGlyphColorForPid(pid, knob.key, COLOR_WHITE);

                if (knob.key === READY_DIALOG_CONFIG_GAME_KNOB_KEY) {
                    updateReadyDialogGridKnobValueForPid(pid, knob.key, mod.Message(cfg.gameMode));
                } else if (knob.key === READY_DIALOG_CONFIG_PLAYERS_KNOB_KEY) {
                    updateReadyDialogGridKnobValueForPid(pid, knob.key, getReadyDialogPlayersValueMessage());
                }
                continue;
            }

            const panelColor = column.teamId === TeamID.Team1 ? visuals.team1Bg : visuals.team2Bg;
            const glyphColor = column.teamId === TeamID.Team1 ? visuals.team1Text : visuals.team2Text;
            setReadyDialogGridKnobPanelThemeForPid(pid, knob.key, panelColor, 0.42);
            setReadyDialogGridKnobButtonGlyphColorForPid(pid, knob.key, glyphColor);
            updateReadyDialogGridKnobValueForPid(
                pid,
                knob.key,
                mod.Message(
                    getReadyDialogVehicleSelectionLabelKey(
                        knob.key,
                        State.round.modeConfig.vehicleSelectionIndexByKey?.[knob.key] ?? 0
                    )
                )
            );
        }

        if (column.supportVisible) {
            updateReadyDialogGridSupportForPid(pid, column.key, getReadyDialogMinPlayersSupportMessage());
        }
    }
}

// Updates mode-config readouts for players with an actively visible Ready Dialog.
function updateReadyDialogModeConfigForAllVisibleViewers(): void {
    for (const pidStr in State.players.readyDialogData) {
        const pid = Number(pidStr);
        const state = State.players.readyDialogData[pid];
        if (!state || !state.dialogVisible) continue;
        updateReadyDialogModeConfigForPid(pid);
    }
}

//#endregion ----------------- Ready Dialog - Map/Mode Config UI Readout --------------------
