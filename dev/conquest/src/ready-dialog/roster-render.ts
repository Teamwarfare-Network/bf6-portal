// @ts-nocheck
// Module: ready-dialog/roster-render -- roster rendering and ready toggle labels

//#region -------------------- Ready Dialog - Roster Render + Toggle Labels --------------------

// Roster rendering responsibilities:
// - Resolve active team rosters for the current viewer.
// - Populate per-row name/ready/base labels.
// - Apply row color policy based on ready/base state.
// - Keep refresh behavior centralized for dialog-visible viewers.

// Applies per-row color policy for the Ready dialog:
// - Player name: white by default; green only when BOTH ready AND in main base.
// - READY / IN MAIN BASE: green
// - NOT READY / NOT IN MAIN BASE: red
function applyReadyDialogRowColors(nameWidget: mod.UIWidget | undefined, readyWidget: mod.UIWidget | undefined, baseWidget: mod.UIWidget | undefined, isReady: boolean, isInBase: boolean): void {
    if (readyWidget) mod.SetUITextColor(readyWidget, isReady ? COLOR_READY_GREEN : COLOR_NOT_READY_RED);
    if (baseWidget) mod.SetUITextColor(baseWidget, isInBase ? COLOR_READY_GREEN : COLOR_NOT_READY_RED);
    if (nameWidget) mod.SetUITextColor(nameWidget, (isReady && isInBase) ? COLOR_READY_GREEN : COLOR_NORMAL);
}

function applyReadyDialogViewerTeamColors(viewer: mod.Player, viewerPlayerId: number): void {
    const viewerTeam = safeGetTeamNumberFromPlayer(viewer, TeamID.Team1);
    const team1IsFriendly = viewerTeam !== TeamID.Team2;
    const team1Color = team1IsFriendly ? COLOR_BLUE : COLOR_RED;
    const team2Color = team1IsFriendly ? COLOR_RED : COLOR_BLUE;
    const team1Bg = team1IsFriendly ? COLOR_BLUE_DARK : COLOR_RED_DARK;
    const team2Bg = team1IsFriendly ? COLOR_RED_DARK : COLOR_BLUE_DARK;

    const t1Container = safeFind(UI_READY_DIALOG_TEAM1_CONTAINER_ID + viewerPlayerId);
    const t2Container = safeFind(UI_READY_DIALOG_TEAM2_CONTAINER_ID + viewerPlayerId);
    const t1Label = safeFind(UI_READY_DIALOG_TEAM1_LABEL_ID + viewerPlayerId);
    const t2Label = safeFind(UI_READY_DIALOG_TEAM2_LABEL_ID + viewerPlayerId);

    if (t1Container) {
        mod.SetUIWidgetBgColor(t1Container, team1Bg);
        mod.SetUIWidgetBgAlpha(t1Container, READY_PANEL_BG_ALPHA);
    }
    if (t2Container) {
        mod.SetUIWidgetBgColor(t2Container, team2Bg);
        mod.SetUIWidgetBgAlpha(t2Container, READY_PANEL_BG_ALPHA);
    }
    if (t1Label) mod.SetUITextColor(t1Label, team1Color);
    if (t2Label) mod.SetUITextColor(t2Label, team2Color);
}

// Builds one stable signature for the current roster presentation for a viewer.
// This lets reopen and global refresh paths skip unchanged roster writes entirely.
function buildReadyDialogRosterSignature(viewer: mod.Player, viewerPlayerId: number): string {
    const viewerTeam = safeGetTeamNumberFromPlayer(viewer, TeamID.Team1);
    const roster = getRosterDisplayEntries();
    let signature = `viewerTeam:${viewerTeam}`;

    const appendTeam = (prefix: string, entries: RosterDisplayEntry[]): void => {
        signature += `|${prefix}:`;
        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            if (entry?.player) {
                const pid = mod.GetObjId(entry.player);
                signature += `${pid},${State.players.readyByPid[pid] ? 1 : 0},${isPlayerInMainBaseForReady(pid) ? 1 : 0};`;
            } else {
                signature += `empty;`;
            }
        }
    };

    appendTeam("t1", roster.team1);
    appendTeam("t2", roster.team2);
    signature += `|rows:${roster.maxRows}|viewer:${viewerPlayerId}`;
    return signature;
}

// Renders the entire Ready Up dialog state for a single viewer.
// Centralizing UI updates reduces refresh regressions as the dialog grows in complexity.
function renderReadyDialogForViewer(eventPlayer: mod.Player, viewerPid: number): void {
    refreshReadyDialogRosterForViewer(eventPlayer, viewerPid);
    updateReadyToggleButtonForViewer(eventPlayer, viewerPid);
    updateReadyDialogModeConfigForPid(viewerPid);
}

// Renders the dialog for all players who currently have it open.
/**
 * Broadcast-style refresh for the ready dialog.
 * Call whenever roster membership or per-player display state changes (ready / in-main-base / team).
 */
function renderReadyDialogForAllVisibleViewers(): void {
    for (const pidStr in State.players.readyDialogData) {
        const pid = Number(pidStr);
        const state = State.players.readyDialogData[pid];
        if (!state || !state.dialogVisible) continue;
        const viewer = safeFindPlayer(pid);
        if (!viewer) continue;
        renderReadyDialogForViewer(viewer, pid);
    }
}

// Re-renders team roster rows and per-row ready/base labels for a single viewer.
function refreshReadyDialogRosterForViewer(viewer: mod.Player, viewerPlayerId: number): void {
    const state = State.players.readyDialogData[viewerPlayerId];
    if (!state) return;
    const signature = buildReadyDialogRosterSignature(viewer, viewerPlayerId);
    if (state.lastRosterSignature === signature) return;

    applyReadyDialogViewerTeamColors(viewer, viewerPlayerId);

    const roster = getRosterDisplayEntries();
    const t1Players = roster.team1;
    const t2Players = roster.team2;

    const maxRowsPerTeam = TEAM_ROSTER_MAX_ROWS;
    const emptyMsg = mod.Message(mod.stringkeys.twl.system.genericCounter, "");
    for (let row = 0; row < maxRowsPerTeam; row++) {
        const t1NameId = UI_READY_DIALOG_T1_ROW_NAME_ID + viewerPlayerId + "_" + row;
        const t1ReadyId = UI_READY_DIALOG_T1_ROW_READY_ID + viewerPlayerId + "_" + row;
        const t1BaseId = UI_READY_DIALOG_T1_ROW_BASE_ID + viewerPlayerId + "_" + row;

        const t2NameId = UI_READY_DIALOG_T2_ROW_NAME_ID + viewerPlayerId + "_" + row;
        const t2ReadyId = UI_READY_DIALOG_T2_ROW_READY_ID + viewerPlayerId + "_" + row;
        const t2BaseId = UI_READY_DIALOG_T2_ROW_BASE_ID + viewerPlayerId + "_" + row;

        const t1Name = safeFind(t1NameId);
        const t1Ready = safeFind(t1ReadyId);
        const t1Base = safeFind(t1BaseId);

        const t2Name = safeFind(t2NameId);
        const t2Ready = safeFind(t2ReadyId);
        const t2Base = safeFind(t2BaseId);

        const t1Entry = (row < t1Players.length) ? t1Players[row] : undefined;
        const t2Entry = (row < t2Players.length) ? t2Players[row] : undefined;
        const p1 = t1Entry?.player;
        const p2 = t2Entry?.player;

        // Hide unused placeholder rows (prevents 'unknown string' artifacts and reduces visual noise).
        const hasP1 = !!t1Entry;
        const hasP2 = !!t2Entry;
        if (t1Name) mod.SetUIWidgetVisible(t1Name, hasP1);
        if (t1Ready) mod.SetUIWidgetVisible(t1Ready, hasP1);
        if (t1Base) mod.SetUIWidgetVisible(t1Base, hasP1);
        if (t2Name) mod.SetUIWidgetVisible(t2Name, hasP2);
        if (t2Ready) mod.SetUIWidgetVisible(t2Ready, hasP2);
        if (t2Base) mod.SetUIWidgetVisible(t2Base, hasP2);

        safeSetUITextLabel(t1Name, hasP1 ? getRosterEntryNameMessage(t1Entry) : emptyMsg);
        safeSetUITextLabel(
            t1Ready,
            hasP1
                ? (p1
                    ? (State.players.readyByPid[mod.GetObjId(p1)] ? mod.Message(mod.stringkeys.twl.readyDialog.status.ready) : mod.Message(mod.stringkeys.twl.readyDialog.status.notReady))
                    : mod.Message(mod.stringkeys.twl.readyDialog.status.notReady))
                : emptyMsg
        );
        safeSetUITextLabel(
            t1Base,
            hasP1
                ? (p1
                    ? (isPlayerInMainBaseForReady(mod.GetObjId(p1)) ? mod.Message(mod.stringkeys.twl.readyDialog.baseStatus.in) : mod.Message(mod.stringkeys.twl.readyDialog.baseStatus.out))
                    : mod.Message(mod.stringkeys.twl.readyDialog.baseStatus.out))
                : emptyMsg
        );
        if (p1) {
            const p1Id = mod.GetObjId(p1);
            const p1Ready = !!State.players.readyByPid[p1Id];
            const p1InBase = isPlayerInMainBaseForReady(p1Id);
            applyReadyDialogRowColors(t1Name, t1Ready, t1Base, p1Ready, p1InBase);
        } else if (hasP1) {
            applyReadyDialogRowColors(t1Name, t1Ready, t1Base, false, false);
        } else {
            // Empty row: default to white for any placeholder text.
            if (t1Name) mod.SetUITextColor(t1Name, COLOR_NORMAL);
            if (t1Ready) mod.SetUITextColor(t1Ready, COLOR_NORMAL);
            if (t1Base) mod.SetUITextColor(t1Base, COLOR_NORMAL);
        }

        safeSetUITextLabel(t2Name, hasP2 ? getRosterEntryNameMessage(t2Entry) : emptyMsg);
        safeSetUITextLabel(
            t2Ready,
            hasP2
                ? (p2
                    ? (State.players.readyByPid[mod.GetObjId(p2)] ? mod.Message(mod.stringkeys.twl.readyDialog.status.ready) : mod.Message(mod.stringkeys.twl.readyDialog.status.notReady))
                    : mod.Message(mod.stringkeys.twl.readyDialog.status.notReady))
                : emptyMsg
        );
        safeSetUITextLabel(
            t2Base,
            hasP2
                ? (p2
                    ? (isPlayerInMainBaseForReady(mod.GetObjId(p2)) ? mod.Message(mod.stringkeys.twl.readyDialog.baseStatus.in) : mod.Message(mod.stringkeys.twl.readyDialog.baseStatus.out))
                    : mod.Message(mod.stringkeys.twl.readyDialog.baseStatus.out))
                : emptyMsg
        );
        if (p2) {
            const p2Id = mod.GetObjId(p2);
            const p2Ready = !!State.players.readyByPid[p2Id];
            const p2InBase = isPlayerInMainBaseForReady(p2Id);
            applyReadyDialogRowColors(t2Name, t2Ready, t2Base, p2Ready, p2InBase);
        } else if (hasP2) {
            applyReadyDialogRowColors(t2Name, t2Ready, t2Base, false, false);
        } else {
            if (t2Name) mod.SetUITextColor(t2Name, COLOR_NORMAL);
            if (t2Ready) mod.SetUITextColor(t2Ready, COLOR_NORMAL);
            if (t2Base) mod.SetUITextColor(t2Base, COLOR_NORMAL);
        }
    }

    state.lastRosterSignature = signature;
}

// Applies label + disabled styling for the Ready toggle button based on live-state.
function syncReadyToggleButtonWidgetsForPid(viewerPlayerId: number): void {
    const buttonWidget = safeFind(UI_READY_DIALOG_BUTTON_READY_ID + viewerPlayerId);
    const borderWidget = safeFind(UI_READY_DIALOG_BUTTON_READY_ID + viewerPlayerId + "_BORDER");
    const labelWidget = safeFind(UI_READY_DIALOG_BUTTON_READY_LABEL_ID + viewerPlayerId);
    if (!labelWidget) return;

    const isReady = !!State.players.readyByPid[viewerPlayerId];
    const needsReconfirm = State.players.readyNeedsReconfirmByPid[viewerPlayerId] === true;
    const live = isMatchLive();
    const labelMsg = isReady
        ? mod.Message(mod.stringkeys.twl.readyDialog.buttons.notReady)
        : mod.Message(mod.stringkeys.twl.readyDialog.buttons.ready);

    safeSetUITextLabel(labelWidget, labelMsg);

    if (buttonWidget) {
        mod.SetUIButtonEnabled(buttonWidget, !live);
        mod.SetUIWidgetBgColor(buttonWidget, live ? COLOR_GRAY_DARK : COLOR_BUTTON_BASE);
        mod.SetUIWidgetBgAlpha(buttonWidget, live ? 0.45 : BUTTON_OPACITY_BASE);
    }
    if (borderWidget) {
        mod.SetUIWidgetBgColor(borderWidget, live ? COLOR_GRAY_DARK : COLOR_BUTTON_BORDER);
        mod.SetUIWidgetBgAlpha(borderWidget, live ? 0.45 : BUTTON_BORDER_OPACITY);
    }
    mod.SetUITextColor(labelWidget, live ? COLOR_GRAY : (!isReady && needsReconfirm ? COLOR_NOT_READY_RED : COLOR_WHITE));
}

// Updates the Ready toggle button label for the given viewer based on that viewer's current ready state.
function updateReadyToggleButtonForViewer(viewer: mod.Player, viewerPlayerId: number): void {
    syncReadyToggleButtonWidgetsForPid(viewerPlayerId);
}

// Refreshes the Ready toggle button state for every built ready-dialog cache, visible or hidden.
function updateReadyToggleButtonsForAllBuiltReadyDialogs(): void {
    for (const pidStr in State.players.readyDialogData) {
        const pid = Number(pidStr);
        if (isPidDisconnected(pid)) continue;
        const state = State.players.readyDialogData[pid];
        if (!state || !state.uiBuilt) continue;
        syncReadyToggleButtonWidgetsForPid(pid);
    }
}

// Refreshes cached roster rows and ready-toggle state for every built dialog, including hidden caches.
// This keeps pure-reveal reopen accurate when ready/base state changes while the dialog is closed.
function refreshReadyStatusForAllBuiltReadyDialogs(): void {
    for (const pidStr in State.players.readyDialogData) {
        const pid = Number(pidStr);
        if (isPidDisconnected(pid)) continue;
        const state = State.players.readyDialogData[pid];
        if (!state || !state.uiBuilt) continue;
        const viewer = safeFindPlayer(pid);
        if (!viewer || !mod.IsPlayerValid(viewer)) continue;
        refreshReadyDialogRosterForViewer(viewer, pid);
        syncReadyToggleButtonWidgetsForPid(pid);
    }
}

//#endregion ----------------- Ready Dialog - Roster Render + Toggle Labels --------------------
