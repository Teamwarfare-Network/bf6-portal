// @ts-nocheck
// Module: interaction/ui-events-ready -- ready-dialog and admin-panel toggle button handlers

// Handles ready-dialog actions and admin panel open/close.
// Returns true when the widget name is recognized (even if the action is gated/no-op).
function tryHandleReadyDialogButtonEvent(
    eventPlayer: mod.Player,
    playerId: number,
    widgetName: string
): boolean {
    switch (widgetName) {
        case UI_READY_DIALOG_BUTTON_CANCEL_ID + playerId:
            hideReadyDialogUI(eventPlayer);
            return true;

        case UI_READY_DIALOG_BUTTON_READY_ID + playerId: {
            const pid = mod.GetObjId(eventPlayer);
            const currentlyReady = !!State.players.readyByPid[pid];
            const inBase = isPlayerInMainBaseForReady(pid);
            const nowSeconds = Math.floor(mod.GetMatchTimeElapsed());

            // Pre-live gating: players can only set READY while in main base.
            if (!currentlyReady) {
                if (!isMatchLive() && !inBase) {
                    return true;
                }
                State.players.readyByPid[pid] = true;
                updatePlayersReadyHudTextForAllPlayers();

                const lastReadyAt = State.players.readyMessageCooldownByPid[pid] ?? -9999;
                if (nowSeconds - lastReadyAt >= READY_UP_MESSAGE_COOLDOWN_SECONDS) {
                    State.players.readyMessageCooldownByPid[pid] = nowSeconds;
                    const counts = getReadyCountsForMessage();
                    sendHighlightedWorldLogMessage(
                        mod.Message(STR_PLAYER_READIED_UP, eventPlayer, counts.readyCount, counts.totalCount),
                        true,
                        undefined,
                        STR_PLAYER_READIED_UP
                    );
                }
            } else {
                State.players.readyByPid[pid] = false;
                updatePlayersReadyHudTextForAllPlayers();
            }

            updateHelpTextVisibilityForPid(pid);
            renderReadyDialogForViewer(eventPlayer, playerId);
            renderReadyDialogForAllVisibleViewers();
            updatePlayersReadyHudTextForAllPlayers();
            tryAutoStartMatchIfAllReady(eventPlayer);
            return true;
        }

        case UI_READY_DIALOG_BUTTON_SWAP_ID + playerId:
            swapPlayerTeam(eventPlayer);
            return true;

        case UI_READY_DIALOG_MATCHUP_DEC_ID + playerId:
            if (isMatchLive()) return true;
            applyMatchupPreset(Math.max(0, State.round.matchupPresetIndex - 1), eventPlayer);
            return true;

        case UI_READY_DIALOG_MATCHUP_INC_ID + playerId:
            if (isMatchLive()) return true;
            applyMatchupPreset(Math.min(MATCHUP_PRESETS.length - 1, State.round.matchupPresetIndex + 1), eventPlayer);
            return true;

        case UI_READY_DIALOG_MINPLAYERS_DEC_ID + playerId:
            if (isMatchLive()) return true;
            setAutoStartMinActivePlayers(State.round.autoStartMinActivePlayers - 1, eventPlayer);
            return true;

        case UI_READY_DIALOG_MINPLAYERS_INC_ID + playerId:
            if (isMatchLive()) return true;
            setAutoStartMinActivePlayers(State.round.autoStartMinActivePlayers + 1, eventPlayer);
            return true;

        case UI_READY_DIALOG_MODE_GAME_DEC_ID + playerId:
            if (isMatchLive()) return true;
            setReadyDialogGameModeIndex(State.round.modeConfig.gameModeIndex - 1);
            return true;

        case UI_READY_DIALOG_MODE_GAME_INC_ID + playerId:
            if (isMatchLive()) return true;
            setReadyDialogGameModeIndex(State.round.modeConfig.gameModeIndex + 1);
            return true;

        case UI_READY_DIALOG_MODE_SETTINGS_DEC_ID + playerId:
            if (isMatchLive()) return true;
            setReadyDialogAircraftCeiling(
                State.round.modeConfig.aircraftCeiling - READY_DIALOG_AIRCRAFT_CEILING_STEP,
                eventPlayer
            );
            return true;

        case UI_READY_DIALOG_MODE_SETTINGS_INC_ID + playerId:
            if (isMatchLive()) return true;
            setReadyDialogAircraftCeiling(
                State.round.modeConfig.aircraftCeiling + READY_DIALOG_AIRCRAFT_CEILING_STEP,
                eventPlayer
            );
            return true;

        case UI_READY_DIALOG_MODE_VEHICLES_T1_DEC_ID + playerId:
            if (isMatchLive()) return true;
            setReadyDialogVehicleIndexT1(State.round.modeConfig.vehicleIndexT1 - 1);
            return true;

        case UI_READY_DIALOG_MODE_VEHICLES_T1_INC_ID + playerId:
            if (isMatchLive()) return true;
            setReadyDialogVehicleIndexT1(State.round.modeConfig.vehicleIndexT1 + 1);
            return true;

        case UI_READY_DIALOG_MODE_VEHICLES_T2_DEC_ID + playerId:
            if (isMatchLive()) return true;
            setReadyDialogVehicleIndexT2(State.round.modeConfig.vehicleIndexT2 - 1);
            return true;

        case UI_READY_DIALOG_MODE_VEHICLES_T2_INC_ID + playerId:
            if (isMatchLive()) return true;
            setReadyDialogVehicleIndexT2(State.round.modeConfig.vehicleIndexT2 + 1);
            return true;

        case UI_READY_DIALOG_MODE_CONFIRM_ID + playerId:
            if (isMatchLive()) return true;
            confirmReadyDialogModeConfig(eventPlayer);
            updateReadyDialogModeConfigForAllVisibleViewers();
            return true;

        case UI_READY_DIALOG_MODE_RESET_ID + playerId:
            if (isMatchLive()) return true;
            triggerFreshMatchSetup(eventPlayer);
            return true;

        case UI_ADMIN_PANEL_BUTTON_ID + playerId: {
            if (!State.players.readyDialogData[playerId]) initReadyDialogData(eventPlayer);
            const now = mod.GetMatchTimeElapsed();
            if (now - State.players.readyDialogData[playerId].lastAdminPanelToggleAt < ADMIN_PANEL_TOGGLE_COOLDOWN_SECONDS) {
                return true;
            }
            State.players.readyDialogData[playerId].lastAdminPanelToggleAt = now;

            State.players.readyDialogData[playerId].adminPanelVisible = !State.players.readyDialogData[playerId].adminPanelVisible;
            if (!State.players.readyDialogData[playerId].adminPanelVisible) {
                deleteAdminPanelUI(playerId, false);
                State.players.readyDialogData[playerId].adminPanelBuilt = false;
                return true;
            }

            sendHighlightedWorldLogMessage(
                mod.Message(mod.stringkeys.twl.adminPanel.accessed, eventPlayer),
                true,
                undefined,
                mod.stringkeys.twl.adminPanel.accessed
            );

            deleteAdminPanelUI(playerId, false);
            mod.AddUIContainer(
                UI_ADMIN_PANEL_CONTAINER_ID + playerId,
                mod.CreateVector(ADMIN_PANEL_OFFSET_X, ADMIN_PANEL_OFFSET_Y, 0),
                mod.CreateVector(
                    ADMIN_PANEL_CONTENT_WIDTH + (ADMIN_PANEL_PADDING * 2),
                    ADMIN_PANEL_HEIGHT + (ADMIN_PANEL_PADDING * 2),
                    0
                ),
                mod.UIAnchor.TopRight,
                mod.GetUIRoot(),
                false,
                10,
                ADMIN_PANEL_BG_COLOR,
                ADMIN_PANEL_BG_ALPHA,
                ADMIN_PANEL_BG_FILL,
                mod.UIDepth.AboveGameUI,
                eventPlayer
            );

            const adminContainer = mod.FindUIWidgetWithName(UI_ADMIN_PANEL_CONTAINER_ID + playerId, mod.GetUIRoot());
            if (!adminContainer) {
                return true;
            }
            buildAdminPanelWidgets(eventPlayer, adminContainer, playerId);
            State.players.readyDialogData[playerId].adminPanelBuilt = true;
            mod.SetUIWidgetVisible(adminContainer, true);
            setAdminPanelChildWidgetsVisible(playerId, true);
            return true;
        }
    }

    return false;
}
