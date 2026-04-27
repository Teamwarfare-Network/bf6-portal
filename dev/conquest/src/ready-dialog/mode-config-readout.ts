// @ts-nocheck
// Module: ready-dialog/mode-config-readout -- ready dialog map/mode readout label updates

//#region -------------------- Ready Dialog - Map/Mode Config UI Readout --------------------

// Builds a stable signature for the ready-dialog map readout.
// Map text rarely changes, so this prevents redundant label writes on reopen.
function buildReadyDialogMapSignature(pid: number): string {
    return `${pid}|${ACTIVE_MAP_KEY}`;
}

function updateReadyDialogMapLabelForPid(pid: number): void {
    const state = State.players.readyDialogData[pid];
    if (!state) return;
    const signature = buildReadyDialogMapSignature(pid);
    if (state.lastMapSignature === signature) return;

    const labelWidget = safeFind(UI_READY_DIALOG_MAP_LABEL_ID + pid);
    const valueId = UI_READY_DIALOG_MAP_VALUE_ID + pid;
    const valueWidget = safeFind(valueId);
    if (labelWidget) {
        mod.SetUIWidgetParent(labelWidget, mod.GetUIRoot());
    }
    if (!valueWidget) return;
    mod.SetUIWidgetParent(valueWidget, mod.GetUIRoot());
    safeSetUITextLabel(valueWidget, msg(getMapNameKey(ACTIVE_MAP_KEY)));
    state.lastMapSignature = signature;
}

// Refreshes the map label/value pair for all connected players.
function updateReadyDialogMapLabelForAllPlayers(): void {
    forEachValidPlayer((_player, pid) => updateReadyDialogMapLabelForPid(pid));
}

function updateReadyDialogGridColumnHeaderForPid(pid: number, columnKey: string, label: mod.Message): void {
    const widget = safeFind(UI_READY_DIALOG_MODE_GRID_COLUMN_HEADER_ID + columnKey + "_" + pid);
    if (!widget) return;
    safeSetUITextLabel(widget, label);
}

function updateReadyDialogGridKnobLabelForPid(pid: number, knobKey: string, labelKey: number): void {
    const widget = safeFind(UI_READY_DIALOG_MODE_GRID_KNOB_LABEL_ID + knobKey + "_" + pid);
    if (!widget) return;
    const resolvedLabelKey = labelKey !== undefined && labelKey !== null
        ? labelKey
        : STR_SYS_UNKNOWN_PLAYER;
    safeSetUITextLabel(widget, msg(resolvedLabelKey));
}

function updateReadyDialogGridKnobValueForPid(pid: number, knobKey: string, label: mod.Message): void {
    const widget = safeFind(UI_READY_DIALOG_MODE_GRID_KNOB_VALUE_ID + knobKey + "_" + pid);
    if (!widget) return;
    safeSetUITextLabel(widget, label);
}

function setReadyDialogGridKnobValueColorForPid(pid: number, knobKey: string, color: mod.Vector): void {
    const widget = safeFind(UI_READY_DIALOG_MODE_GRID_KNOB_VALUE_ID + knobKey + "_" + pid);
    if (!widget) return;
    mod.SetUITextColor(widget, color);
}

function updateReadyDialogGridSupportForPid(pid: number, columnKey: string, label: mod.Message): void {
    const widget = safeFind(UI_READY_DIALOG_MODE_GRID_SUPPORT_ID + columnKey + "_" + pid);
    if (!widget) return;
    safeSetUITextLabel(widget, label);
}

function setReadyDialogGridKnobButtonsVisibleForPid(pid: number, knobKey: string, visible: boolean): void {
    const widgetIds = [
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

function setReadyDialogGridKnobRowVisibleForPid(pid: number, knobKey: string, visible: boolean): void {
    const widgetIds = [
        UI_READY_DIALOG_MODE_GRID_KNOB_PANEL_ID + knobKey + "_" + pid,
        UI_READY_DIALOG_MODE_GRID_KNOB_LABEL_ID + knobKey + "_" + pid,
        UI_READY_DIALOG_MODE_GRID_KNOB_VALUE_ID + knobKey + "_" + pid,
    ];
    for (const widgetId of widgetIds) {
        const widget = safeFind(widgetId);
        if (!widget) continue;
        mod.SetUIWidgetVisible(widget, visible);
    }
    setReadyDialogGridKnobButtonsVisibleForPid(pid, knobKey, visible);
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

function syncReadyDialogModeActionWidgetsForPid(pid: number, diff: ReadyDialogModeConfigDiffState): void {
    const hasUnsavedChanges = diff.hasUnsavedChanges;
    const live = isMatchLive();
    const confirmButton = safeFind(UI_READY_DIALOG_MODE_CONFIRM_ID + pid);
    const confirmBorder = safeFind(UI_READY_DIALOG_MODE_CONFIRM_ID + pid + "_BORDER");
    const confirmLabel = safeFind(UI_READY_DIALOG_MODE_CONFIRM_LABEL_ID + pid);
    const resetButton = safeFind(UI_READY_DIALOG_MODE_RESET_ID + pid);
    const resetBorder = safeFind(UI_READY_DIALOG_MODE_RESET_ID + pid + "_BORDER");
    const resetLabel = safeFind(UI_READY_DIALOG_MODE_RESET_LABEL_ID + pid);
    const unsavedLabel = safeFind(UI_READY_DIALOG_MODE_UNSAVED_LABEL_ID + pid);

    const canApply = !live && hasUnsavedChanges;

    if (confirmButton) {
        mod.SetUIButtonEnabled(confirmButton, canApply);
        mod.SetUIWidgetBgColor(confirmButton, canApply ? COLOR_BUTTON_BASE : COLOR_GRAY_DARK);
        mod.SetUIWidgetBgAlpha(confirmButton, canApply ? BUTTON_OPACITY_BASE : 0.45);
    }
    if (confirmBorder) {
        mod.SetUIWidgetBgColor(confirmBorder, canApply ? COLOR_BUTTON_BORDER : COLOR_GRAY_DARK);
        mod.SetUIWidgetBgAlpha(confirmBorder, canApply ? BUTTON_BORDER_OPACITY : 0.45);
    }
    if (confirmLabel) {
        mod.SetUITextColor(confirmLabel, canApply ? COLOR_WHITE : COLOR_GRAY);
    }

    const canReset = !live;
    if (resetButton) {
        mod.SetUIButtonEnabled(resetButton, canReset);
        mod.SetUIWidgetBgColor(resetButton, canReset ? COLOR_BUTTON_BASE : COLOR_GRAY_DARK);
        mod.SetUIWidgetBgAlpha(resetButton, canReset ? BUTTON_OPACITY_BASE : 0.45);
    }
    if (resetBorder) {
        mod.SetUIWidgetBgColor(resetBorder, canReset ? COLOR_BUTTON_BORDER : COLOR_GRAY_DARK);
        mod.SetUIWidgetBgAlpha(resetBorder, canReset ? BUTTON_BORDER_OPACITY : 0.45);
    }
    if (resetLabel) {
        mod.SetUITextColor(resetLabel, canReset ? COLOR_WHITE : COLOR_GRAY);
    }

    if (unsavedLabel) {
        // Apply-blocked state takes priority over live / unsaved labels (#105). When the
        // late-joiner-warm guard refuses an Apply, applyBlockedAtSeconds is set; the dialog
        // shows "Cannot apply: N still loading" inline for APPLY_BLOCKED_LABEL_DURATION_SECONDS
        // before reverting via the deferred clear in confirmReadyDialogModeConfig.
        const blockedAt = State.round.modeConfig.applyBlockedAtSeconds;
        const blockedCount = State.round.modeConfig.applyBlockedCount ?? 0;
        const blockedActive = blockedAt !== undefined
            && blockedCount > 0
            && (mod.GetMatchTimeElapsed() - blockedAt) < APPLY_BLOCKED_LABEL_DURATION_SECONDS;
        if (blockedActive) {
            mod.SetUIWidgetVisible(unsavedLabel, true);
            safeSetUITextLabel(
                unsavedLabel,
                msg(mod.stringkeys.twl.readyDialog.applyBlockedLoading, blockedCount)
            );
            mod.SetUITextColor(unsavedLabel, COLOR_NOT_READY_RED);
        } else {
            mod.SetUIWidgetVisible(unsavedLabel, live || hasUnsavedChanges);
            safeSetUITextLabel(
                unsavedLabel,
                msg(
                    live
                        ? mod.stringkeys.twl.readyDialog.liveConfigLockedLabel
                        : mod.stringkeys.twl.readyDialog.unsavedChangesLabel
                )
            );
            mod.SetUITextColor(unsavedLabel, COLOR_NOT_READY_RED);
        }
    }
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
    const counts = getReadyDialogDraftAutoStartMinPlayerCounts();
    return msg(mod.stringkeys.twl.readyDialog.playersFormat, counts.left, counts.right);
}

function getReadyDialogMinPlayersSupportMessage(): mod.Message {
    const counts = getReadyDialogDraftAutoStartMinPlayerCounts();
    return msg(mod.stringkeys.twl.readyDialog.minPlayersToStartFormat, counts.total);
}

// Builds one stable signature for the mode-config column/knob readout for a viewer.
// Viewer perspective matters because team colors flip by viewer team.
function buildReadyDialogModeConfigSignature(pid: number): string {
    const cfg = State.round.modeConfig;
    const counts = getReadyDialogDraftAutoStartMinPlayerCounts();
    const viewer = safeFindPlayer(pid);
    const viewerTeam = safeGetTeamNumberFromPlayer(viewer, TeamID.Team1);
    let signature = `${pid}|team:${viewerTeam}|live:${isMatchLive() ? 1 : 0}|mode:${cfg.gameMode}|players:${counts.left},${counts.right},${counts.total}`;
    signature += `|deploy:${cfg.vehicleDeployMethod ?? 0}|confirmedDeploy:${cfg.confirmed.vehicleDeployMethod ?? 0}`;
    signature += `|air:${cfg.airDeployEnabled ? 1 : 0}|confirmedAir:${cfg.confirmed.airDeployEnabled ? 1 : 0}`;
    signature += `|fwd:${cfg.forwardDeployEnabled ? 1 : 0}|confirmedFwd:${cfg.confirmed.forwardDeployEnabled ? 1 : 0}`;
    signature += `|supply:${(cfg.supplyBoxesEnabled ?? true) ? 1 : 0}|confirmedSupply:${(cfg.confirmed.supplyBoxesEnabled ?? true) ? 1 : 0}`;
    signature += `|confirmedMode:${cfg.confirmed.gameMode}|confirmedPlayers:${getReadyDialogConfirmedAutoStartMinActivePlayers()}`;

    for (const knobKey of READY_DIALOG_ALL_VEHICLE_KNOB_KEYS) {
        signature += `|${knobKey}:${cfg.vehicleSelectionIndexByKey?.[knobKey] ?? 0}`;
        signature += `|confirmed_${knobKey}:${cfg.confirmed.vehicleSelectionIndexByKey?.[knobKey] ?? 0}`;
    }

    return signature;
}

// Updates Ready Dialog mode-setting labels/values for a specific viewer pid.
function updateReadyDialogModeConfigForPid(pid: number): void {
    const state = State.players.readyDialogData[pid];
    if (!state) return;
    const signature = buildReadyDialogModeConfigSignature(pid);
    if (state.lastModeConfigSignature === signature) return;

    const cfg = State.round.modeConfig;
    const visuals = getReadyDialogViewerTeamVisuals(pid);
    const columns = getReadyDialogModeGridColumnSpecs();
    const diff = buildReadyDialogModeConfigDiffState();
    const live = isMatchLive();

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
            setReadyDialogGridKnobButtonsVisibleForPid(pid, knob.key, !live);
            if (knob.key === READY_DIALOG_CONFIG_PLAYERS_KNOB_KEY) {
                const playersLabelWidget = safeFind(UI_READY_DIALOG_MODE_GRID_KNOB_LABEL_ID + knob.key + "_" + pid);
                if (playersLabelWidget) {
                    safeSetUITextLabel(playersLabelWidget, msg(STR_SYS_COUNTER, " "));
                    mod.SetUIWidgetVisible(playersLabelWidget, false);
                }
            } else {
                updateReadyDialogGridKnobLabelForPid(pid, knob.key, knob.labelKey);
            }

            if (isConfigColumn) {
                setReadyDialogGridKnobPanelThemeForPid(pid, knob.key, COLOR_GRAY_DARK, 0.40);
                setReadyDialogGridKnobButtonGlyphColorForPid(pid, knob.key, COLOR_WHITE);

                if (knob.key === READY_DIALOG_CONFIG_GAME_KNOB_KEY) {
                    updateReadyDialogGridKnobValueForPid(pid, knob.key, msg(cfg.gameMode));
                    setReadyDialogGridKnobValueColorForPid(
                        pid,
                        knob.key,
                        isReadyDialogModeConfigDirtyForKnobKey(knob.key, diff) ? COLOR_NOT_READY_RED : COLOR_READY_GREEN
                    );
                } else if (knob.key === READY_DIALOG_CONFIG_PLAYERS_KNOB_KEY) {
                    updateReadyDialogGridKnobValueForPid(pid, knob.key, getReadyDialogPlayersValueMessage());
                    setReadyDialogGridKnobValueColorForPid(
                        pid,
                        knob.key,
                        isReadyDialogModeConfigDirtyForKnobKey(knob.key, diff) ? COLOR_NOT_READY_RED : COLOR_READY_GREEN
                    );
                } else {
                    setReadyDialogGridKnobValueColorForPid(pid, knob.key, COLOR_WHITE);
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
                msg(
                    getReadyDialogVehicleSelectionLabelKey(
                        knob.key,
                        State.round.modeConfig.vehicleSelectionIndexByKey?.[knob.key] ?? 0
                    )
                )
            );
            setReadyDialogGridKnobValueColorForPid(
                pid,
                knob.key,
                isReadyDialogModeConfigDirtyForKnobKey(knob.key, diff) ? COLOR_NOT_READY_RED : COLOR_READY_GREEN
            );
        }

        if (column.supportVisible) {
            updateReadyDialogGridSupportForPid(pid, column.key, getReadyDialogMinPlayersSupportMessage());
        }
    }

    updateReadyDialogConfigCheckboxesForPid(pid, diff);
    syncReadyDialogModeActionWidgetsForPid(pid, diff);

    state.lastModeConfigSignature = signature;
}

// v1.314: paint the 5 config-column checkboxes — X glyph when the underlying field is on, blank
// when off, and the label gets the dirty-red tint when live diverges from confirmed. No visual
// distinction between "HQ child active" and "HQ child inactive while Vanilla is on"; per user
// directive, the X is the only cue.
function isReadyDialogConfigCheckboxChecked(checkboxKey: string): boolean {
    const cfg = State.round.modeConfig;
    if (checkboxKey === READY_DIALOG_CONFIG_CHECKBOX_VANILLA_KEY) {
        return (cfg.vehicleDeployMethod ?? VEHICLE_DEPLOY_METHOD_DEFAULT) === VEHICLE_DEPLOY_METHOD_VANILLA;
    }
    if (checkboxKey === READY_DIALOG_CONFIG_CHECKBOX_HQ_KEY) {
        return (cfg.vehicleDeployMethod ?? VEHICLE_DEPLOY_METHOD_DEFAULT) === VEHICLE_DEPLOY_METHOD_HQ;
    }
    if (checkboxKey === READY_DIALOG_CONFIG_CHECKBOX_AIR_KEY) {
        return cfg.airDeployEnabled === true;
    }
    if (checkboxKey === READY_DIALOG_CONFIG_CHECKBOX_FORWARD_KEY) {
        return cfg.forwardDeployEnabled === true;
    }
    if (checkboxKey === READY_DIALOG_CONFIG_CHECKBOX_SUPPLY_BOXES_KEY) {
        return cfg.supplyBoxesEnabled ?? true;
    }
    return false;
}

function updateReadyDialogConfigCheckboxesForPid(pid: number, diff: ReadyDialogModeConfigDiffState): void {
    for (const checkboxKey of READY_DIALOG_CONFIG_CHECKBOX_KEYS) {
        const boxTextWidget = safeFind(UI_READY_DIALOG_CONFIG_CHECKBOX_BOX_TEXT_ID + checkboxKey + "_" + pid);
        const labelWidget = safeFind(UI_READY_DIALOG_CONFIG_CHECKBOX_LABEL_ID + checkboxKey + "_" + pid);
        const checked = isReadyDialogConfigCheckboxChecked(checkboxKey);
        if (boxTextWidget) {
            safeSetUITextLabel(
                boxTextWidget,
                msg(checked ? mod.stringkeys.twl.ui.checkMarkChecked : mod.stringkeys.twl.ui.checkMarkEmpty)
            );
        }
        if (labelWidget) {
            const dirty = isReadyDialogModeConfigDirtyForKnobKey(checkboxKey, diff);
            mod.SetUITextColor(labelWidget, dirty ? COLOR_NOT_READY_RED : COLOR_WHITE);
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

// Refreshes the cached hidden mode-config section for players whose ready dialog already exists
// but is not currently visible, so phase changes do not force a full dialog rebuild on next open.
function updateReadyDialogModeConfigForAllHiddenBuiltCaches(): void {
    for (const pidStr in State.players.readyDialogData) {
        const pid = Number(pidStr);
        if (isPidDisconnected(pid)) continue;
        const state = State.players.readyDialogData[pid];
        if (!state || state.dialogVisible || !state.uiBuilt) continue;
        updateReadyDialogModeConfigForPid(pid);
    }
}

//#endregion ----------------- Ready Dialog - Map/Mode Config UI Readout --------------------


