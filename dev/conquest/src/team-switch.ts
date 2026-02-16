// @ts-nocheck
// Module: team-switch — Team switch data, interact point, swap actions, UI, tester panel

//#region -------------------- Team Switch Data + Config --------------------

interface TeamSwitchConfig {
    enableTeamSwitch: boolean;
    interactPointMinLifetime: number;
    interactPointMaxLifetime: number;
    velocityThreshold: number;
}

interface teamSwitchData_t {
    interactPoint: mod.InteractPoint | null;
    lastDeployTime: number;
    adminPanelVisible: boolean;
    adminPanelBuilt: boolean;
    lastAdminPanelToggleAt: number;
    dialogVisible: boolean;
    // UI caching: true after the first warm-up build so subsequent opens can be instant.
    uiBuilt: boolean;
    posDebugVisible: boolean;
    posDebugToken: number;
}

// Per-player state lives in State.players:
// - teamSwitchData: dialog + interact-point state per player.
// - readyByPid: READY toggle state for roster + auto-start gating.
// - inMainBaseByPid: main-base presence for pre-round gating + UI.

//#endregion ----------------- Team Switch Data + Config --------------------



//#region -------------------- Team Switch Interact Point --------------------

async function spawnTeamSwitchInteractPoint(eventPlayer: mod.Player) {
    if (!isPlayerDeployed(eventPlayer)) return;
    const playerId = mod.GetObjId(eventPlayer);
    if (!State.players.teamSwitchData[playerId]) initTeamSwitchData(eventPlayer);

    if (
        State.players.teamSwitchData[playerId].interactPoint === null &&
        TEAMSWITCHCONFIG.enableTeamSwitch
    ) {
        let isOnGround = safeGetSoldierStateBool(eventPlayer, mod.SoldierStateBool.IsOnGround);

        while (!isOnGround) {
            await mod.Wait(0.2);
            if (!isPlayerDeployed(eventPlayer)) return;
            isOnGround = safeGetSoldierStateBool(eventPlayer, mod.SoldierStateBool.IsOnGround);
        }

        const playerPosition = safeGetSoldierStateVector(eventPlayer, mod.SoldierStateVector.GetPosition);
        const playerFacingDirection = safeGetSoldierStateVector(eventPlayer, mod.SoldierStateVector.GetFacingDirection);
        if (!playerPosition || !playerFacingDirection) return;

        const interactPointPosition = mod.Add(
            mod.Add(playerPosition, playerFacingDirection),
            mod.CreateVector(0, 1.5, 0)
        );

        const interactPoint: mod.InteractPoint = mod.SpawnObject(
            mod.RuntimeSpawn_Common.InteractPoint,
            interactPointPosition,
            mod.CreateVector(0, 0, 0)
        );

        mod.EnableInteractPoint(interactPoint, true);
        State.players.teamSwitchData[playerId].interactPoint = interactPoint;
        State.players.teamSwitchData[playerId].lastDeployTime = mod.GetMatchTimeElapsed();
    }
}

function teamSwitchInteractPointActivated(eventPlayer: mod.Player, eventInteractPoint: mod.InteractPoint) {
    const playerId = mod.GetObjId(eventPlayer);
    if (!State.players.teamSwitchData[playerId]) initTeamSwitchData(eventPlayer);

    if (State.players.teamSwitchData[playerId].interactPoint != null) {
        const interactPointId = mod.GetObjId(State.players.teamSwitchData[playerId].interactPoint);
        const eventInteractPointId = mod.GetObjId(eventInteractPoint);
        if (interactPointId === eventInteractPointId) {
            setUIInputModeForPlayer(eventPlayer, true);
            createTeamSwitchUI(eventPlayer);
            // Track visibility so roster refreshes can target all viewers with the dialog open.
            State.players.teamSwitchData[playerId].dialogVisible = true;
            if (consumeJoinPromptTripleTapForPid(playerId)) {
                markJoinPromptReadyDialogOpened(playerId);
            }
            updateHelpTextVisibilityForPid(playerId);
            renderReadyDialogForViewer(eventPlayer, playerId);
            // Immediate self-refresh to avoid relying solely on global refresh bookkeeping.

        }
    }
}

function removeTeamSwitchInteractPoint(eventPlayer: mod.Player | number) {
    let playerId: number;

    if (mod.IsType(eventPlayer, mod.Types.Player)) {
        playerId = mod.GetObjId(eventPlayer as mod.Player);
    } else {
        playerId = eventPlayer as number;
    }

    if (!State.players.teamSwitchData[playerId]) return;

    if (State.players.teamSwitchData[playerId].interactPoint != null) {
        try {
            mod.EnableInteractPoint(State.players.teamSwitchData[playerId].interactPoint as mod.InteractPoint, false);
            mod.UnspawnObject(State.players.teamSwitchData[playerId].interactPoint as mod.InteractPoint);
        } catch {
            // Best-effort cleanup; ignore if already despawned by the engine.
        }
        State.players.teamSwitchData[playerId].interactPoint = null;
    }
}

function isVelocityBeyond(threshold: number, eventPlayer: mod.Player): boolean {
    if (!isPlayerDeployed(eventPlayer)) return false;
    const v = safeGetSoldierStateVector(eventPlayer, mod.SoldierStateVector.GetLinearVelocity);
    if (!v) return false;
    const x = mod.AbsoluteValue(mod.XComponentOf(v));
    const y = mod.AbsoluteValue(mod.YComponentOf(v));
    const z = mod.AbsoluteValue(mod.ZComponentOf(v));
    return x + y + z > threshold;
}

function checkTeamSwitchInteractPointRemoval(eventPlayer: mod.Player) {
    if (!isPlayerDeployed(eventPlayer)) return;
    const isDead = safeGetSoldierStateBool(eventPlayer, mod.SoldierStateBool.IsDead);
    if (TEAMSWITCHCONFIG.enableTeamSwitch && !isDead) {
        const playerId = mod.GetObjId(eventPlayer);
        if (!State.players.teamSwitchData[playerId]) initTeamSwitchData(eventPlayer);

        if (State.players.teamSwitchData[playerId].interactPoint != null) {
            const lifetime = mod.GetMatchTimeElapsed() - State.players.teamSwitchData[playerId].lastDeployTime;

            if (
                isVelocityBeyond(TEAMSWITCHCONFIG.velocityThreshold, eventPlayer) ||
                lifetime > TEAMSWITCHCONFIG.interactPointMaxLifetime
            ) {
                removeTeamSwitchInteractPoint(playerId);
            }
        }
    }
}

function initTeamSwitchData(eventPlayer: mod.Player) {
    const playerId = mod.GetObjId(eventPlayer);
    State.players.teamSwitchData[playerId] = {
        adminPanelVisible: false,
        adminPanelBuilt: false,
        lastAdminPanelToggleAt: 0,
        dialogVisible: false,
        interactPoint: null,
        lastDeployTime: 0,
        uiBuilt: false,
        posDebugVisible: false,
        posDebugToken: 0,
    };
}

//#endregion ----------------- Team Switch Interact Point --------------------



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
    // Legacy team-switch pathway retained for reuse by the Ready Dialog (Swap Teams button: Swap Teams button).
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
    // We reuse the same redeploy window used at round end (ROUND_END_REDEPLOY_DELAY_SECONDS).
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



//#region -------------------- Team Switch UI + Tester Panel (IDs + build helpers) --------------------

function teamSwitchButtonEvent(
    eventPlayer: mod.Player,
    eventUIWidget: mod.UIWidget,
    eventUIButtonEvent: mod.UIButtonEvent
) {
    // Steps:
    // 1) Identify which button was pressed for this player
    // 2) Mutate authoritative state (match / round counters) if applicable
    // 3) Resync HUD/UI projections so every player sees the new state

    const playerId = mod.GetObjId(eventPlayer);
    const widgetName = mod.GetUIWidgetName(eventUIWidget);

    switch (widgetName) {
        case UI_TEAMSWITCH_BUTTON_CANCEL_ID + playerId:
            deleteTeamSwitchUI(eventPlayer);
            break;

        case UI_READY_DIALOG_BUTTON_READY_ID + playerId: {
            // Pre-round gating:: players may only transition to READY while in their main base when the round is NOT active.
            // Ready-cycle auto-start / reset:: when all active players become READY, auto-start the round via startRound().
            const pid = mod.GetObjId(eventPlayer);
            const currentlyReady = !!State.players.readyByPid[pid];
            const inBase = isPlayerInMainBaseForReady(pid);
            const nowSeconds = Math.floor(mod.GetMatchTimeElapsed());

            // Transition rules:
            // - NOT READY -> READY: allowed only if (inBase || isRoundLive()) (Pre-round gating: gating applies only pre-round).
            // - READY -> NOT READY: always allowed.
            if (!currentlyReady) {
                if (!isRoundLive() && !inBase) {
                    // Deny ready-up outside of base pre-round (no messaging in current milestone).
                    break;
                }
                State.players.readyByPid[pid] = true;

                // Keep the HUD "X / Y PLAYERS READY" line in sync on every ready-state change.
                updatePlayersReadyHudTextForAllPlayers();

                // Throttle ready-up broadcasts per player to prevent spam.
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
                // Keep the HUD "X / Y PLAYERS READY" line in sync on every ready-state change.
                updatePlayersReadyHudTextForAllPlayers();
            }

            updateHelpTextVisibilityForPid(pid);

            // Refresh self + all visible viewers (centralized render).
            renderReadyDialogForViewer(eventPlayer, playerId);
            // Refresh all visible viewers so everyone sees readiness changes immediately.

            // Also refresh all other viewers who currently have the dialog open.
            renderReadyDialogForAllVisibleViewers();
            updatePlayersReadyHudTextForAllPlayers();

            // Ready-cycle auto-start / reset:: if this interaction resulted in all active players being READY, begin the round.
            tryAutoStartRoundIfAllReady(eventPlayer);
            break;
        }

        case UI_READY_DIALOG_BUTTON_SWAP_ID + playerId: {
            // Swap Teams button:: single-button team toggle.
            swapPlayerTeam(eventPlayer);
            break;
        }

        case UI_READY_DIALOG_BESTOF_DEC_ID + playerId: {
            // Clamp to current round so max rounds never dips below the live round index.
            ensureCustomGameModeForManualChange();
            const prevMax = State.round.max;
            setHudRoundCountersForAllPlayers(State.round.current, Math.max(State.round.current, Math.max(1, State.round.max - 1)));
            if (State.round.max !== prevMax) {
                // Gameplay-gated world log message for best-of changes.
                sendHighlightedWorldLogMessage(
                    mod.Message(mod.stringkeys.twl.readyDialog.bestOfChanged, eventPlayer, Math.floor(State.round.max)),
                    true,
                    undefined,
                    mod.stringkeys.twl.readyDialog.bestOfChanged
                );
            }
            break;
        }
        case UI_READY_DIALOG_BESTOF_INC_ID + playerId: {
            ensureCustomGameModeForManualChange();
            const prevMax = State.round.max;
            setHudRoundCountersForAllPlayers(State.round.current, State.round.max + 1);
            if (State.round.max !== prevMax) {
                // Gameplay-gated world log message for best-of changes.
                sendHighlightedWorldLogMessage(
                    mod.Message(mod.stringkeys.twl.readyDialog.bestOfChanged, eventPlayer, Math.floor(State.round.max)),
                    true,
                    undefined,
                    mod.stringkeys.twl.readyDialog.bestOfChanged
                );
            }
            break;
        }
        case UI_READY_DIALOG_MATCHUP_DEC_ID + playerId: {
            if (isRoundLive()) break;
            const next = Math.max(0, State.round.matchupPresetIndex - 1);
            applyMatchupPreset(next, eventPlayer);
            break;
        }
        case UI_READY_DIALOG_MATCHUP_INC_ID + playerId: {
            if (isRoundLive()) break;
            const next = Math.min(MATCHUP_PRESETS.length - 1, State.round.matchupPresetIndex + 1);
            applyMatchupPreset(next, eventPlayer);
            break;
        }
        case UI_READY_DIALOG_MINPLAYERS_DEC_ID + playerId: {
            if (isRoundLive()) break;
            setAutoStartMinActivePlayers(State.round.autoStartMinActivePlayers - 1, eventPlayer);
            break;
        }
        case UI_READY_DIALOG_MINPLAYERS_INC_ID + playerId: {
            if (isRoundLive()) break;
            setAutoStartMinActivePlayers(State.round.autoStartMinActivePlayers + 1, eventPlayer);
            break;
        }
        case UI_READY_DIALOG_MODE_GAME_DEC_ID + playerId: {
            if (isRoundLive()) break;
            setReadyDialogGameModeIndex(State.round.modeConfig.gameModeIndex - 1);
            break;
        }
        case UI_READY_DIALOG_MODE_GAME_INC_ID + playerId: {
            if (isRoundLive()) break;
            setReadyDialogGameModeIndex(State.round.modeConfig.gameModeIndex + 1);
            break;
        }
        case UI_READY_DIALOG_MODE_SETTINGS_DEC_ID + playerId: {
            if (isRoundLive()) break;
            setReadyDialogAircraftCeiling(
                State.round.modeConfig.aircraftCeiling - READY_DIALOG_AIRCRAFT_CEILING_STEP,
                eventPlayer
            );
            break;
        }
        case UI_READY_DIALOG_MODE_SETTINGS_INC_ID + playerId: {
            if (isRoundLive()) break;
            setReadyDialogAircraftCeiling(
                State.round.modeConfig.aircraftCeiling + READY_DIALOG_AIRCRAFT_CEILING_STEP,
                eventPlayer
            );
            break;
        }
        case UI_READY_DIALOG_MODE_VEHICLES_T1_DEC_ID + playerId: {
            if (isRoundLive()) break;
            setReadyDialogVehicleIndexT1(State.round.modeConfig.vehicleIndexT1 - 1);
            break;
        }
        case UI_READY_DIALOG_MODE_VEHICLES_T1_INC_ID + playerId: {
            if (isRoundLive()) break;
            setReadyDialogVehicleIndexT1(State.round.modeConfig.vehicleIndexT1 + 1);
            break;
        }
        case UI_READY_DIALOG_MODE_VEHICLES_T2_DEC_ID + playerId: {
            if (isRoundLive()) break;
            setReadyDialogVehicleIndexT2(State.round.modeConfig.vehicleIndexT2 - 1);
            break;
        }
        case UI_READY_DIALOG_MODE_VEHICLES_T2_INC_ID + playerId: {
            if (isRoundLive()) break;
            setReadyDialogVehicleIndexT2(State.round.modeConfig.vehicleIndexT2 + 1);
            break;
        }
        case UI_READY_DIALOG_MODE_CONFIRM_ID + playerId: {
            if (isRoundLive()) break;
            confirmReadyDialogModeConfig(eventPlayer);
            updateReadyDialogModeConfigForAllVisibleViewers();
            break;
        }
        case UI_READY_DIALOG_MODE_RESET_ID + playerId: {
            if (isRoundLive()) break;
            triggerFreshRoundSetup(eventPlayer);
            break;
        }

        case UI_ADMIN_PANEL_BUTTON_ID + playerId: {
            if (!State.players.teamSwitchData[playerId]) initTeamSwitchData(eventPlayer);
            const now = mod.GetMatchTimeElapsed();
            if (now - State.players.teamSwitchData[playerId].lastAdminPanelToggleAt < ADMIN_PANEL_TOGGLE_COOLDOWN_SECONDS) {
                break;
            }
            State.players.teamSwitchData[playerId].lastAdminPanelToggleAt = now;

            // Toggle admin panel visibility.
            State.players.teamSwitchData[playerId].adminPanelVisible = !State.players.teamSwitchData[playerId].adminPanelVisible;
            if (!State.players.teamSwitchData[playerId].adminPanelVisible) {
                // Close: delete panel contents to avoid "ghost" children on some clients.
                deleteAdminPanelUI(playerId, false);
                State.players.teamSwitchData[playerId].adminPanelBuilt = false;
                break;
            }

            sendHighlightedWorldLogMessage(
                mod.Message(mod.stringkeys.twl.adminPanel.accessed, eventPlayer),
                true,
                undefined,
                mod.stringkeys.twl.adminPanel.accessed
            );

            // Open: rebuild container + widgets fresh each time (low cost; avoids duplicate draw bugs).
            deleteAdminPanelUI(playerId, false); // safety: ensure no stale container/children exist

            mod.AddUIContainer(
                UI_ADMIN_PANEL_CONTAINER_ID + playerId,
                mod.CreateVector(ADMIN_PANEL_OFFSET_X, ADMIN_PANEL_OFFSET_Y, 0),
                mod.CreateVector(ADMIN_PANEL_CONTENT_WIDTH + (ADMIN_PANEL_PADDING * 2), ADMIN_PANEL_HEIGHT + (ADMIN_PANEL_PADDING * 2), 0),
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
                break;
            }
            buildAdminPanelWidgets(eventPlayer, adminContainer, playerId);
            State.players.teamSwitchData[playerId].adminPanelBuilt = true;
            mod.SetUIWidgetVisible(adminContainer, true);
            setAdminPanelChildWidgetsVisible(playerId, true);
            break;
        }

        //#endregion ----------------- Team Switch UI + Tester Panel (IDs + build helpers) --------------------



        //#region -------------------- Tester Button Events --------------------

        // Conquest cut: only clock/start/end controls remain active in the admin panel.

        case UI_TEST_BUTTON_CLOCK_TIME_DEC_ID + playerId:
            adjustRoundClockBySeconds(-60);
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.clockTimeDec);
            break;
        case UI_TEST_BUTTON_CLOCK_TIME_INC_ID + playerId:
            if (!State.round.clock.isPaused && getRemainingSeconds() < 0) {
                ResetRoundClock(60);
            } else {
                adjustRoundClockBySeconds(60);
            }
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.clockTimeInc);
            break;

        case UI_TEST_BUTTON_CLOCK_RESET_ID + playerId:
            if (isRoundLive()) {
                resetRoundClockToDefault();
            } else {
                setRoundClockPreview(getConfiguredRoundLengthSeconds());
            }
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.clockReset);
            break;

        case UI_TEST_BUTTON_ROUND_START_ID + playerId:
            startPregameCountdown(eventPlayer, true); //old: startRound(eventPlayer);
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.roundStart);
            break;
        case UI_TEST_BUTTON_ROUND_END_ID + playerId:
            endRound(eventPlayer);
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.roundEnd);
            break;

        case UI_TEST_BUTTON_POS_DEBUG_ID + playerId: {
            if (!State.players.teamSwitchData[playerId]) initTeamSwitchData(eventPlayer);
            const state = State.players.teamSwitchData[playerId];
            state.posDebugVisible = !state.posDebugVisible;
            setPositionDebugVisibleForPlayer(eventPlayer, state.posDebugVisible);
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.positionDebug);
            break;
        }

        case UI_ADMIN_ROUND_LENGTH_DEC_ID + playerId: {
            if (isRoundLive()) break;
            const next = clampRoundLengthSeconds(getConfiguredRoundLengthSeconds() - ADMIN_ROUND_LENGTH_STEP_SECONDS);
            setRoundClockPreview(next);
            updateAllPlayersClock();
            syncAdminRoundLengthLabelForAllPlayers();
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.roundLengthDec);
            break;
        }
        case UI_ADMIN_ROUND_LENGTH_INC_ID + playerId: {
            if (isRoundLive()) break;
            const next = clampRoundLengthSeconds(getConfiguredRoundLengthSeconds() + ADMIN_ROUND_LENGTH_STEP_SECONDS);
            setRoundClockPreview(next);
            updateAllPlayersClock();
            syncAdminRoundLengthLabelForAllPlayers();
            handleAdminPanelAction(eventPlayer, mod.stringkeys.twl.adminPanel.actions.roundLengthInc);
            break;
        }

        default:
            break;
    }
}

//#endregion ----------------- Tester Button Events --------------------
