// @ts-nocheck
// Module: team-switch/actions -- team swap actions and UI teardown

//#region -------------------- Team Switch Actions --------------------

// Handles a player-initiated team switch.
// This function validates the request, updates team membership,
// and triggers any required HUD or state refresh.

// Performs an undeploy with a short delay to ensure the engine has applied a prior SetTeam() before changing deploy state.
// This intentionally does NOT re-deploy the player; the player is expected to choose a spawn point manually.
async function forceUndeployPlayer(eventPlayer: mod.Player): Promise<void> {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    // Undeploy immediately so the player is forced to the deploy screen right away.
    // Then retry once with a short delay for robustness across transient engine timing.
    mod.UndeployPlayer(eventPlayer);
    await mod.Wait(0.05);
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    mod.UndeployPlayer(eventPlayer);
}

function processTeamSwitch(eventPlayer: mod.Player) {
    // Shared team-switch pathway used by the ready-dialog Swap Teams action.
    // Requirements:
    // - Change the player's team assignment (TeamID.Team1 <-> TeamID.Team2)
    // - Force the player back to the deploy screen on the new team (not just update UI/roster state)
    //
    // NOTE: Some engines cache team affiliation on the deployed soldier entity; therefore we:
    // 1) Set the team, then
    // 2) Undeploy the player so they must redeploy on the new team.

    // Close dialog + restore UI input mode before team mutation/undeploy to avoid stale handle issues.
    deleteTeamSwitchUI(eventPlayer);

    const currentTeamNum = getTeamNumber(mod.GetTeam(eventPlayer));
    const newTeamNum = (currentTeamNum === TeamID.Team2) ? TeamID.Team1 : TeamID.Team2;
    mod.SetTeam(eventPlayer, mod.GetTeam(newTeamNum));

    // Force a rapid return to the deploy screen so the player respawns on the new team.
    // Note: do not modify redeploy timers globally; we only force an undeploy so the player can choose spawn manually.
    // Ensure team switching does not grant faster-than-normal respawn timing.
    // Reuse the shared redeploy delay constant for consistent forced-undeploy behavior.
    mod.SetRedeployTime(eventPlayer, ROUND_END_REDEPLOY_DELAY_SECONDS);
    void forceUndeployPlayer(eventPlayer);

    sendHighlightedWorldLogMessage(
        mod.Message(mod.stringkeys.twl.notifications.teamSwitch),
        false,
        mod.GetTeam(eventPlayer),
        mod.stringkeys.twl.notifications.teamSwitch
    );
}

function deleteTeamSwitchUI(eventPlayer: mod.Player | number) {
    // Deletes the Team Switch UI for the given player id and restores normal input.
    // Note: When called with a player id (number) rather than a mod.Player, UI input mode cannot be toggled here.

    let playerId: any = eventPlayer;

    if (mod.IsType(eventPlayer, mod.Types.Player)) {
        setUIInputModeForPlayer(eventPlayer as mod.Player, false);
        playerId = mod.GetObjId(eventPlayer as mod.Player);
    }

    const baseWidget = safeFind(UI_TEAMSWITCH_CONTAINER_BASE_ID + playerId);
    if (baseWidget) mod.SetUIWidgetVisible(baseWidget, false);
    const borderTop = safeFind(UI_TEAMSWITCH_BORDER_TOP_ID + playerId);
    if (borderTop) mod.SetUIWidgetVisible(borderTop, false);
    const borderBottom = safeFind(UI_TEAMSWITCH_BORDER_BOTTOM_ID + playerId);
    if (borderBottom) mod.SetUIWidgetVisible(borderBottom, false);
    const borderLeft = safeFind(UI_TEAMSWITCH_BORDER_LEFT_ID + playerId);
    if (borderLeft) mod.SetUIWidgetVisible(borderLeft, false);
    const borderRight = safeFind(UI_TEAMSWITCH_BORDER_RIGHT_ID + playerId);
    if (borderRight) mod.SetUIWidgetVisible(borderRight, false);
    const debugWidget = safeFind(UI_TEAMSWITCH_DEBUG_TIMELIMIT_ID + playerId);
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

    if (State.players.teamSwitchData[playerId]) {
        State.players.teamSwitchData[playerId].adminPanelVisible = false;
        State.players.teamSwitchData[playerId].adminPanelBuilt = false;
        // Force-hide any stray admin panel children (some engines do not cascade container visibility).
        setAdminPanelChildWidgetsVisible(playerId, false);
        // Delete any previously-built admin container so the panel will rebuild cleanly on demand.
        const existingAdminContainer = safeFind(UI_ADMIN_PANEL_CONTAINER_ID + playerId);
        if (existingAdminContainer) mod.DeleteUIWidget(existingAdminContainer);
    State.players.teamSwitchData[playerId].adminPanelBuilt = false;
        // Dialog is no longer visible; stop participating in global roster refreshes.
        State.players.teamSwitchData[playerId].dialogVisible = false;
    }

    updateHelpTextVisibilityForPid(playerId);
}

function closeReadyDialogForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const pid = mod.GetObjId(p);
        if (State.players.teamSwitchData[pid]?.dialogVisible) {
            deleteTeamSwitchUI(p);
        }
    }
}

// Hard delete used only for cleanup (e.g., player leaves game).
// Normal dialog close should hide widgets to enable UI caching and faster reopen.
function hardDeleteTeamSwitchUI(playerId: number): void {
    const baseWidget = safeFind(UI_TEAMSWITCH_CONTAINER_BASE_ID + playerId);
    if (baseWidget) mod.DeleteUIWidget(baseWidget);
    const borderTop = safeFind(UI_TEAMSWITCH_BORDER_TOP_ID + playerId);
    if (borderTop) mod.DeleteUIWidget(borderTop);
    const borderBottom = safeFind(UI_TEAMSWITCH_BORDER_BOTTOM_ID + playerId);
    if (borderBottom) mod.DeleteUIWidget(borderBottom);
    const borderLeft = safeFind(UI_TEAMSWITCH_BORDER_LEFT_ID + playerId);
    if (borderLeft) mod.DeleteUIWidget(borderLeft);
    const borderRight = safeFind(UI_TEAMSWITCH_BORDER_RIGHT_ID + playerId);
    if (borderRight) mod.DeleteUIWidget(borderRight);
    const debugWidget = safeFind(UI_TEAMSWITCH_DEBUG_TIMELIMIT_ID + playerId);
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

//#endregion ----------------- Team Switch Actions --------------------
