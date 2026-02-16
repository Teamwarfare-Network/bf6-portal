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

// Renders the entire Ready Up dialog state for a single viewer.
// Centralizing UI updates reduces refresh regressions as the dialog grows in complexity.
function renderReadyDialogForViewer(eventPlayer: mod.Player, viewerPid: number): void {
    refreshReadyDialogRosterForViewer(eventPlayer, viewerPid);
    updateReadyToggleButtonForViewer(eventPlayer, viewerPid);

}

// Renders the dialog for all players who currently have it open.
/**
 * Broadcast-style refresh for the ready dialog.
 * Call whenever roster membership or per-player display state changes (ready / in-main-base / team).
 */
function renderReadyDialogForAllVisibleViewers(): void {
    for (const pidStr in State.players.teamSwitchData) {
        const pid = Number(pidStr);
        const state = State.players.teamSwitchData[pid];
        if (!state || !state.dialogVisible) continue;
        const viewer = safeFindPlayer(pid);
        if (!viewer) continue;
        renderReadyDialogForViewer(viewer, pid);
    }
}

function refreshReadyDialogRosterForViewer(viewer: mod.Player, viewerPlayerId: number): void {
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

        const t1Name = mod.FindUIWidgetWithName(t1NameId, mod.GetUIRoot());
        const t1Ready = mod.FindUIWidgetWithName(t1ReadyId, mod.GetUIRoot());
        const t1Base = mod.FindUIWidgetWithName(t1BaseId, mod.GetUIRoot());

        const t2Name = mod.FindUIWidgetWithName(t2NameId, mod.GetUIRoot());
        const t2Ready = mod.FindUIWidgetWithName(t2ReadyId, mod.GetUIRoot());
        const t2Base = mod.FindUIWidgetWithName(t2BaseId, mod.GetUIRoot());

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

        mod.SetUITextLabel(t1Name, hasP1 ? getRosterEntryNameMessage(t1Entry) : emptyMsg);
        mod.SetUITextLabel(
            t1Ready,
            hasP1
                ? (p1
                    ? (State.players.readyByPid[mod.GetObjId(p1)] ? mod.Message(mod.stringkeys.twl.readyDialog.status.ready) : mod.Message(mod.stringkeys.twl.readyDialog.status.notReady))
                    : mod.Message(mod.stringkeys.twl.readyDialog.status.notReady))
                : emptyMsg
        );
        mod.SetUITextLabel(
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

        mod.SetUITextLabel(t2Name, hasP2 ? getRosterEntryNameMessage(t2Entry) : emptyMsg);
        mod.SetUITextLabel(
            t2Ready,
            hasP2
                ? (p2
                    ? (State.players.readyByPid[mod.GetObjId(p2)] ? mod.Message(mod.stringkeys.twl.readyDialog.status.ready) : mod.Message(mod.stringkeys.twl.readyDialog.status.notReady))
                    : mod.Message(mod.stringkeys.twl.readyDialog.status.notReady))
                : emptyMsg
        );
        mod.SetUITextLabel(
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
}

// Updates the Ready toggle button label for the given viewer based on that viewer's current ready state.
function updateReadyToggleButtonForViewer(viewer: mod.Player, viewerPlayerId: number): void {
    const btnLabelId = UI_READY_DIALOG_BUTTON_READY_LABEL_ID + viewerPlayerId;
    const labelWidget = mod.FindUIWidgetWithName(btnLabelId, mod.GetUIRoot());
    if (!labelWidget) return;

    const isReady = !!State.players.readyByPid[viewerPlayerId];
    const labelMsg = isReady
        ? mod.Message(mod.stringkeys.twl.readyDialog.buttons.notReady)
        : mod.Message(mod.stringkeys.twl.readyDialog.buttons.ready);

    mod.SetUITextLabel(labelWidget, labelMsg);
}

//#endregion ----------------- Ready Dialog - Roster Render + Toggle Labels --------------------
