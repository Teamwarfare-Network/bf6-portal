// @ts-nocheck
// Module: interaction/actions -- ready-dialog swap action and HUD refresh

//#region -------------------- Ready Dialog Interaction Actions --------------------

const TEAM_SWAP_PERSPECTIVE_LOCK_SECONDS = 0.6;
const TEAM_SWAP_FORCE_REDEPLOY_SECONDS = 0;

// Performs the authoritative conquest HUD reset for one player before team-swap redraw.
// Contract: hide -> destroy -> delayed rebuild -> resume updates after deploy release.
function cleanupConquestHudForTeamSwap(pid: number): void {
    // Core-mode swap reset stays non-destructive to avoid long blocking delete passes.
    twlConquestHudHidePlayer(pid);
    delete State.conquest.capture.engagedObjIdByPid[pid];
    State.conquest.debug.engageHiddenUntilDeployByPid[pid] = true;
    State.conquest.debug.teamSwapHudResetPendingByPid[pid] = true;
    delete State.conquest.debug.hudRenderBucketByPid[pid];
    delete State.conquest.debug.hudRenderBurstByPid[pid];
    conquestPhase3ResetBleedPulseForPid(pid);
    // Always force-hide objective overlays explicitly for swap transitions.
    twlConquestHudHideObjectiveFocusForPid(pid);
}

// Handles a player-initiated team swap.
// This function validates the request, updates team membership,
// and triggers any required HUD or state refresh.

// Performs an undeploy with a short delay to ensure the engine has applied a prior SetTeam() before changing deploy state.
// This intentionally does NOT re-deploy the player; the player is expected to choose a spawn point manually.
async function forceUndeployPlayer(
    eventPlayer: mod.Player,
    deployReason: ConquestSpawnChargeReason = "forced_redeploy"
): Promise<void> {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    const pid = safeGetPlayerId(eventPlayer);
    if (pid !== undefined) conquestPhase2BMarkNextDeployReason(pid, deployReason);
    // Undeploy immediately so the player is forced to the deploy screen right away.
    // Then retry once with a short delay for robustness across transient engine timing.
    mod.UndeployPlayer(eventPlayer);
    await mod.Wait(0.05);
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    mod.UndeployPlayer(eventPlayer);
}

// Rebuilds conquest HUD once after team assignment settles.
// Rebuild is delayed to avoid overlapping SetTeam/undeploy timing windows.
async function refreshConquestHudAfterTeamSwap(eventPlayer: mod.Player): Promise<void> {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    const pid = safeGetPlayerId(eventPlayer);
    if (pid === undefined) return;

    const nextToken = (State.conquest.debug.teamSwapRefreshTokenByPid[pid] ?? 0) + 1;
    State.conquest.debug.teamSwapRefreshTokenByPid[pid] = nextToken;

    // Team assignment can settle asynchronously after SetTeam().
    // A single delayed pass prevents "correct frame then overwritten frame" behavior from stacked refreshes.
    await mod.Wait(0.12);
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    if ((State.conquest.debug.teamSwapRefreshTokenByPid[pid] ?? 0) !== nextToken) return;

    // Core mode keeps existing graph and only enforces hidden state until deploy release.
    twlConquestHudHidePlayer(pid);
    // Hard clear engage state before releasing swap-pending gate.
    // This prevents stale Neutralizing/Defending rows from carrying to the new team context.
    State.conquest.debug.engageHiddenUntilDeployByPid[pid] = true;
    delete State.conquest.capture.engagedObjIdByPid[pid];
    twlConquestHudHideObjectiveFocusForPid(pid);
    // Keep swap gate engaged until deploy callback confirms the new team context.
    // onPlayerDeployedImpl is the only owner that releases teamSwapHudResetPendingByPid.
    conquestPhase3MarkHudDirty();
    updateConquestCombatHudForAllPlayers(true);
}

// Handles the Ready Dialog "Swap Teams" action and triggers authoritative swap refresh flow.
function processReadyDialogSelection(eventPlayer: mod.Player) {
    // Shared swap pathway used by the ready-dialog "Swap Teams" action.
    // Requirements:
    // - Change the player's team assignment (TeamID.Team1 <-> TeamID.Team2)
    // - Force the player back to the deploy screen on the new team (not just update UI/roster state)
    //
    // NOTE: Some engines cache team affiliation on the deployed soldier entity; therefore we:
    // 1) Set the team, then
    // 2) Undeploy the player so they must redeploy on the new team.

    // Close dialog + restore UI input mode before team mutation/undeploy to avoid stale handle issues.
    hideReadyDialogUI(eventPlayer);

    const pid = safeGetPlayerId(eventPlayer);
    const currentTeamNum = getTeamNumber(mod.GetTeam(eventPlayer));
    const newTeamNum = (currentTeamNum === TeamID.Team2) ? TeamID.Team1 : TeamID.Team2;
    if (pid !== undefined) {
        // Treat swap as immediately undeployed for HUD authority until the engine undeploy callback lands.
        State.players.deployedByPid[pid] = false;
        // Force one clean conquest HUD reset (destructive) after swap to prevent stale overlays/duplicates.
        cleanupConquestHudForTeamSwap(pid);
        // Pre-seed swap perspective so post-SetTeam transient reads cannot repaint as Team1 fallback.
        State.conquest.debug.perspectiveTeamByPid[pid] = newTeamNum;
        // Hold perspective to the target team briefly so redraw cannot sample stale pre-swap engine team for one frame.
        State.conquest.debug.teamSwapPerspectiveLockUntilByPid[pid] = mod.GetMatchTimeElapsed() + TEAM_SWAP_PERSPECTIVE_LOCK_SECONDS;
    }
    mod.SetTeam(eventPlayer, mod.GetTeam(newTeamNum));
    // Single redraw strategy:
    // - mark dirty now
    // - let the delayed settle pass perform one authoritative rebuild/draw
    // This avoids swap-time duplicate repaint churn.
    conquestPhase3MarkHudDirty();
    void refreshConquestHudAfterTeamSwap(eventPlayer);

    // Force a rapid return to the deploy screen so the player can immediately redeploy on the new team.
    // Keep this path latency-free to avoid long HUD/ready-dialog blackout after a team swap.
    mod.SetRedeployTime(eventPlayer, TEAM_SWAP_FORCE_REDEPLOY_SECONDS);
    void forceUndeployPlayer(eventPlayer, "team_switch");

    sendHighlightedWorldLogMessage(
        mod.Message(mod.stringkeys.twl.notifications.teamSwitch),
        false,
        mod.GetTeam(eventPlayer),
        mod.stringkeys.twl.notifications.teamSwitch
    );
}

// Hides the Ready Dialog (cached widgets) and clears per-player dialog/admin visibility state.
function hideReadyDialogUI(eventPlayer: mod.Player | number) {
    // Deletes/hides the Ready Dialog UI for the given player id and restores normal input.
    // Note: When called with a player id (number) rather than a mod.Player, UI input mode cannot be toggled here.

    let playerId: any = eventPlayer;

    if (mod.IsType(eventPlayer, mod.Types.Player)) {
        setUIInputModeForPlayer(eventPlayer as mod.Player, false);
        playerId = mod.GetObjId(eventPlayer as mod.Player);
    }

    const baseWidget = safeFind(UI_READY_DIALOG_CONTAINER_BASE_ID + playerId);
    if (baseWidget) mod.SetUIWidgetVisible(baseWidget, false);
    const borderTop = safeFind(UI_READY_DIALOG_BORDER_TOP_ID + playerId);
    if (borderTop) mod.SetUIWidgetVisible(borderTop, false);
    const borderBottom = safeFind(UI_READY_DIALOG_BORDER_BOTTOM_ID + playerId);
    if (borderBottom) mod.SetUIWidgetVisible(borderBottom, false);
    const borderLeft = safeFind(UI_READY_DIALOG_BORDER_LEFT_ID + playerId);
    if (borderLeft) mod.SetUIWidgetVisible(borderLeft, false);
    const borderRight = safeFind(UI_READY_DIALOG_BORDER_RIGHT_ID + playerId);
    if (borderRight) mod.SetUIWidgetVisible(borderRight, false);
    const debugWidget = safeFind(UI_READY_DIALOG_DEBUG_TIMELIMIT_ID + playerId);
    if (debugWidget) {
        mod.SetUIWidgetVisible(debugWidget, false);
    }
    const mapLabel = safeFind(UI_READY_DIALOG_MAP_LABEL_ID + playerId);
    if (mapLabel) mod.SetUIWidgetVisible(mapLabel, false);
    const mapValue = safeFind(UI_READY_DIALOG_MAP_VALUE_ID + playerId);
    if (mapValue) mod.SetUIWidgetVisible(mapValue, false);

    // Admin panel is not cached: delete container + children + toggle on close to prevent stray widgets.
    deleteAdminPanelUI(playerId, true);
    setAdminPanelChildWidgetsVisible(playerId, false);

    if (State.players.readyDialogData[playerId]) {
        State.players.readyDialogData[playerId].adminPanelVisible = false;
        State.players.readyDialogData[playerId].adminPanelBuilt = false;
        // Force-hide any stray admin panel children (some engines do not cascade container visibility).
        setAdminPanelChildWidgetsVisible(playerId, false);
        // Delete any previously-built admin container so the panel will rebuild cleanly on demand.
        const existingAdminContainer = safeFind(UI_ADMIN_PANEL_CONTAINER_ID + playerId);
        if (existingAdminContainer) mod.DeleteUIWidget(existingAdminContainer);
        State.players.readyDialogData[playerId].adminPanelBuilt = false;
        // Dialog is no longer visible; stop participating in global roster refreshes.
        State.players.readyDialogData[playerId].dialogVisible = false;
    }

    updateHelpTextVisibilityForPid(playerId);
}

// Closes Ready Dialog UI for every viewer that currently has the dialog open.
function closeReadyDialogForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const pid = mod.GetObjId(p);
        if (State.players.readyDialogData[pid]?.dialogVisible) {
            hideReadyDialogUI(p);
        }
    }
}

// Hard delete used only for cleanup (e.g., player leaves game).
// Normal dialog close should hide widgets to enable UI caching and faster reopen.
function destroyReadyDialogUI(playerId: number): void {
    const baseWidget = safeFind(UI_READY_DIALOG_CONTAINER_BASE_ID + playerId);
    if (baseWidget) mod.DeleteUIWidget(baseWidget);
    const borderTop = safeFind(UI_READY_DIALOG_BORDER_TOP_ID + playerId);
    if (borderTop) mod.DeleteUIWidget(borderTop);
    const borderBottom = safeFind(UI_READY_DIALOG_BORDER_BOTTOM_ID + playerId);
    if (borderBottom) mod.DeleteUIWidget(borderBottom);
    const borderLeft = safeFind(UI_READY_DIALOG_BORDER_LEFT_ID + playerId);
    if (borderLeft) mod.DeleteUIWidget(borderLeft);
    const borderRight = safeFind(UI_READY_DIALOG_BORDER_RIGHT_ID + playerId);
    if (borderRight) mod.DeleteUIWidget(borderRight);
    const debugWidget = safeFind(UI_READY_DIALOG_DEBUG_TIMELIMIT_ID + playerId);
    if (debugWidget) mod.DeleteUIWidget(debugWidget);
    const mapLabel = safeFind(UI_READY_DIALOG_MAP_LABEL_ID + playerId);
    if (mapLabel) mod.DeleteUIWidget(mapLabel);
    const mapValue = safeFind(UI_READY_DIALOG_MAP_VALUE_ID + playerId);
    if (mapValue) mod.DeleteUIWidget(mapValue);

    // Admin Panel widgets (toggle button + label + container).
    const adminToggle = safeFind(UI_ADMIN_PANEL_BUTTON_ID + playerId);
    if (adminToggle) mod.DeleteUIWidget(adminToggle);
    const adminToggleLabel = safeFind(UI_ADMIN_PANEL_BUTTON_LABEL_ID + playerId);
    if (adminToggleLabel) mod.DeleteUIWidget(adminToggleLabel);
    const adminToggleBorder = safeFind(UI_ADMIN_PANEL_BUTTON_ID + playerId + "_BORDER");
    if (adminToggleBorder) mod.DeleteUIWidget(adminToggleBorder);
    const adminContainer = safeFind(UI_ADMIN_PANEL_CONTAINER_ID + playerId);
    if (adminContainer) mod.DeleteUIWidget(adminContainer);

    const posContainer = safeFind(UI_POS_DEBUG_CONTAINER_ID + playerId);
    if (posContainer) mod.DeleteUIWidget(posContainer);
    const posX = safeFind(UI_POS_DEBUG_X_ID + playerId);
    if (posX) mod.DeleteUIWidget(posX);
    const posY = safeFind(UI_POS_DEBUG_Y_ID + playerId);
    if (posY) mod.DeleteUIWidget(posY);
    const posZ = safeFind(UI_POS_DEBUG_Z_ID + playerId);
    if (posZ) mod.DeleteUIWidget(posZ);
    const rotY = safeFind(UI_POS_DEBUG_ROTY_ID + playerId);
    if (rotY) mod.DeleteUIWidget(rotY);
}

//#endregion ----------------- Ready Dialog Interaction Actions --------------------
