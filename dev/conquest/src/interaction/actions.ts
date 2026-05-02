// @ts-nocheck


const TEAM_SWAP_PERSPECTIVE_LOCK_SECONDS = 0.6;

function refreshClockForPlayer(eventPlayer: mod.Player, pid: number): void {
    if (!isValidPlayer(eventPlayer)) return;
    const cacheEntry = ensureClockUIAndGetCache(eventPlayer);
    if (!cacheEntry) return;

    const fallbackRemaining = (
        State.round.clock.isPaused || State.round.clock.matchStartElapsedSeconds !== undefined
    )
        ? getRemainingSeconds()
        : getConfiguredMatchLengthSeconds();

    const displayRemaining = Math.max(0, Math.floor(fallbackRemaining));
    const minutes = Math.floor(displayRemaining / 60);
    const seconds = displayRemaining % 60;
    const shouldFlash = displayRemaining > 0 && displayRemaining < CRITICAL_TIME_FLASH_THRESHOLD_SECONDS;
    const clockColorIsLow = shouldFlash
        ? isClockCriticalColorPulseLowAtRemaining(displayRemaining)
        : (displayRemaining < LOW_TIME_THRESHOLD_SECONDS);
    const visible = isHudWarmReadyForPid(pid) && !isHudSwapTransitionActiveForPid(pid);

    setClockVisibilityCached(cacheEntry, visible);
    if (!visible) return;

    setClockColorCached(cacheEntry, clockColorIsLow ? COLOR_LOW_TIME : COLOR_NORMAL);
    if (cacheEntry.lastDisplayedSeconds !== displayRemaining) {
        const digits = {
            mT: Math.floor(minutes / 10),
            mO: minutes % 10,
            sT: Math.floor(seconds / 10),
            sO: seconds % 10,
        };
        if (cacheEntry.minTensShadow) setDigitCached(cacheEntry.minTensShadow, digits.mT);
        setDigitCached(cacheEntry.minTens, digits.mT);
        if (cacheEntry.minOnesShadow) setDigitCached(cacheEntry.minOnesShadow, digits.mO);
        setDigitCached(cacheEntry.minOnes, digits.mO);
        if (cacheEntry.colonShadow) setColonCached(cacheEntry.colonShadow);
        setColonCached(cacheEntry.colon);
        if (cacheEntry.secTensShadow) setDigitCached(cacheEntry.secTensShadow, digits.sT);
        setDigitCached(cacheEntry.secTens, digits.sT);
        if (cacheEntry.secOnesShadow) setDigitCached(cacheEntry.secOnesShadow, digits.sO);
        setDigitCached(cacheEntry.secOnes, digits.sO);
        cacheEntry.lastDisplayedSeconds = displayRemaining;
    }

    updateVictoryDialogForPlayer(eventPlayer, displayRemaining);
}

function refreshCombatHudForPlayer(eventPlayer: mod.Player, pid: number): void {
    if (!isValidPlayer(eventPlayer)) return;
    if (State.conquest.debug.teamSwapHudResetPendingByPid[pid] === true) {
        State.conquest.debug.engageHiddenUntilDeployByPid[pid] = true;
        delete State.conquest.capture.engagedObjIdByPid[pid];
        twlConquestHudHidePlayer(pid);
        return;
    }
    if (!isHudWarmReadyForPid(pid) || isHudSwapTransitionActiveForPid(pid) || !isCombatHudRevealAllowedForPid(pid)) {
        State.conquest.debug.engageHiddenUntilDeployByPid[pid] = true;
        twlConquestHudHideRootOnly(pid);
        return;
    }

    const entry = twlConquestHudEnsurePlayerGraph(eventPlayer);
    if (!entry || !entry.initialized) return;
    const snapshot = twlConquestHudBuildSnapshotForPlayer(eventPlayer);
    twlConquestHudRenderPlayerFrame(pid, eventPlayer, snapshot);
    entry.lastSnapshot = snapshot;
    entry.mainUpdates = entry.mainUpdates + 1;
    entry.lastMainUpdateAtSeconds = Math.floor(mod.GetMatchTimeElapsed());
}

function prebuildTopLeftUiFamilyWhileHidden(eventPlayer: mod.Player, pid: number): void {
    if (!isValidPlayer(eventPlayer)) return;
    try {
        ensureTopHudShellForPlayer(eventPlayer);
    } catch {}
    try {
        refreshClockForPlayer(eventPlayer, pid);
    } catch {}
    try {
        setMatchStateTextForPid(pid);
    } catch {}
    try {
        updateHelpTextVisibilityForPid(pid);
    } catch {}
    renderTopLeftUiFamilyImmediate(eventPlayer, pid);
}

function prebuildVehicleSpawnerUiFamilyWhileHidden(eventPlayer: mod.Player, _pid: number): void {
    if (!isValidPlayer(eventPlayer)) return;
    const pid = safeGetPlayerId(eventPlayer);
    if (pid === undefined) return;
    if (isVehicleDeployTimerHudCacheUsable(State.hudCache.vehicleDeployTimerCache[pid])) return;
    try {
        prebuildVehicleDeployTimerHudHiddenForPlayer(eventPlayer);
    } catch {}
}

function prebuildCombatHudFamilyWhileHidden(eventPlayer: mod.Player, pid: number): void {
    if (!isValidPlayer(eventPlayer)) return;
    try {
        const entry = twlConquestHudEnsurePlayerGraph(eventPlayer);
        if (!entry || !entry.initialized) return;
        twlConquestHudHidePlayer(pid);
    } catch {}
}

function prebuildReadyDialogUiFamilyWhileHidden(eventPlayer: mod.Player, pid: number): void {
    if (!isValidPlayer(eventPlayer)) return;
    try {
        const readyData = getReadyDialogStateForPid(pid);
        if (!readyData || readyData.dialogVisible) return;
        if (!isReadyDialogUiCacheUsableForPid(pid)) {
            ensureReadyDialogUiBuiltHidden(eventPlayer);
        }
    } catch {}
}

function renderTopLeftUiFamilyImmediate(eventPlayer: mod.Player, pid: number): void {
    if (!isValidPlayer(eventPlayer)) return;
    const refs = ensureTopHudShellForPlayer(eventPlayer);
    setMatchStateTextForPid(pid);
    safeSetUIWidgetVisible(refs?.topHudRoot, true);
    safeSetUIWidgetVisible(refs?.upperLeftContainer, true);
    safeSetUIWidgetVisible(refs?.upperLeftStatusContainer, true);
    safeSetUIWidgetVisible(refs?.upperLeftStatusStateText, true);
    safeSetUIWidgetVisible(refs?.upperLeftStatusReadyText, true);
}

function renderTopLeftUiFamilyForReveal(eventPlayer: mod.Player, pid: number): void {
    if (!isValidPlayer(eventPlayer)) return;
    const refs = ensureTopHudShellForPlayer(eventPlayer);
    renderTopLeftUiFamilyImmediate(eventPlayer, pid);
    updateHelpTextVisibilityForPid(pid);
    refreshClockForPlayer(eventPlayer, pid);
    safeSetUIWidgetVisible(refs?.topCenterAuxRoot, true);
}

function renderVehicleSpawnerUiFamilyForReveal(eventPlayer: mod.Player, _pid: number): void {
    if (!isValidPlayer(eventPlayer)) return;
    revealVehicleDeployTimerHudForPlayer(eventPlayer);
}

function armCombatHudFamilyForSchedulerReveal(eventPlayer: mod.Player, pid: number): void {
    if (!isValidPlayer(eventPlayer)) return;
    const entry = twlConquestHudEnsurePlayerGraph(eventPlayer);
    if (!entry || !entry.initialized) return;
    twlConquestHudHidePlayer(pid);
    entry.pendingFirstReveal = true;
    setCombatHudRevealAllowedForPid(pid, true);
}

function renderAdminUiFamilyForReveal(eventPlayer: mod.Player, pid: number): void {
    if (!isValidPlayer(eventPlayer)) return;
    if (FEATURE_ADMIN_PANEL) {
        const refs = ensureTopHudShellForPlayer(eventPlayer);
        safeSetUIWidgetVisible(refs?.adminPanelActionCountText, true);
    }
    // Position debug is independent of admin panel; auto-start on reveal if flag is on.
    if (FEATURE_POSITION_DEBUG) {
        try {
            autoStartPositionDebugOnDeploy(eventPlayer);
        } catch {}
    }
    if (FEATURE_PERF_DIAG) ensurePerfDiagWidgetsForPlayer(eventPlayer);
}

function getPositionDebugWidgetIds(pid: number): string[] {
    return [
        UI_POS_DEBUG_CONTAINER_ID + pid,
        UI_POS_DEBUG_X_ID + pid,
        UI_POS_DEBUG_Y_ID + pid,
        UI_POS_DEBUG_Z_ID + pid,
        UI_POS_DEBUG_X_VALUE_ID + pid,
        UI_POS_DEBUG_Y_VALUE_ID + pid,
        UI_POS_DEBUG_Z_VALUE_ID + pid,
        UI_POS_DEBUG_ROTX_ID + pid,
        UI_POS_DEBUG_ROTY_ID + pid,
        UI_POS_DEBUG_ROTZ_ID + pid,
        UI_POS_DEBUG_ROTX_VALUE_ID + pid,
        UI_POS_DEBUG_ROTY_VALUE_ID + pid,
        UI_POS_DEBUG_ROTZ_VALUE_ID + pid,
    ];
}

function deletePositionDebugWidgetsForPid(pid: number): void {
    for (const widgetId of getPositionDebugWidgetIds(pid)) {
        const widget = safeFind(widgetId);
        if (widget) mod.DeleteUIWidget(widget);
    }
}

function renderCriticalHudForReveal(eventPlayer: mod.Player, pid: number): void {
    if (!isValidPlayer(eventPlayer)) return;
    renderTopLeftUiFamilyForReveal(eventPlayer, pid);
    renderVehicleSpawnerUiFamilyForReveal(eventPlayer, pid);
    armCombatHudFamilyForSchedulerReveal(eventPlayer, pid);
    twlConquestHudPrimePlayerFrame(eventPlayer);
    renderAdminUiFamilyForReveal(eventPlayer, pid);
}

function cleanupConquestHudForTeamSwap(pid: number): void {
    // Destroy (not just hide) the combat HUD entry so the next deploy creates a fresh widget
    // graph for the new team context. Hide-only left stale widget handles that could silently
    // fail visibility calls.
    twlConquestHudDestroyPlayer(pid);
    delete State.conquest.capture.engagedObjIdByPid[pid];
    captureSoundOnPlayerLeaveOrResetPid(pid);
    captureVoOnPlayerLeaveOrResetPid(pid);
    State.conquest.debug.engageHiddenUntilDeployByPid[pid] = true;
    State.conquest.debug.teamSwapHudResetPendingByPid[pid] = true;
    twlConquestHudHideObjectiveFocusForPid(pid);
}


async function forceUndeployPlayer(
    eventPlayer: mod.Player,
    deployReason: ConquestSpawnChargeReason = "forced_redeploy"
): Promise<void> {
    if (!isValidPlayer(eventPlayer)) return;
    const pid = safeGetPlayerId(eventPlayer);
    if (pid !== undefined) markNextDeployReason(pid, deployReason);
    mod.UndeployPlayer(eventPlayer);
    await mod.Wait(0.05);
    if (!isValidPlayer(eventPlayer)) return;
    mod.UndeployPlayer(eventPlayer);
}

async function refreshConquestHudAfterTeamSwap(eventPlayer: mod.Player): Promise<void> {
    if (!isValidPlayer(eventPlayer)) return;
    const pid = safeGetPlayerId(eventPlayer);
    if (pid === undefined) return;

    const nextToken = (State.conquest.debug.teamSwapRefreshTokenByPid[pid] ?? 0) + 1;
    State.conquest.debug.teamSwapRefreshTokenByPid[pid] = nextToken;

    await mod.Wait(0.12);
    if (!isValidPlayer(eventPlayer)) return;
    if ((State.conquest.debug.teamSwapRefreshTokenByPid[pid] ?? 0) !== nextToken) return;

    twlConquestHudHidePlayer(pid);
    State.conquest.debug.engageHiddenUntilDeployByPid[pid] = true;
    delete State.conquest.capture.engagedObjIdByPid[pid];
    twlConquestHudHideObjectiveFocusForPid(pid);
    markHudDirty();
}

// Wave 3 Ship 8 (v1.418): team-swap no longer routes through the loading gate. Player snaps to
// the deploy screen with the new team perspective immediately. Combat HUD rebuilds on the next
// deploy via the existing armCombatHudFamilyForSchedulerReveal in renderCriticalHudForReveal.
function processReadyDialogSelection(eventPlayer: mod.Player) {

    hideReadyDialogUI(eventPlayer);

    const pid = safeGetPlayerId(eventPlayer);
    const currentTeamNum = getTeamNumber(mod.GetTeam(eventPlayer));
    const newTeamNum = (currentTeamNum === TeamID.Team2) ? TeamID.Team1 : TeamID.Team2;
    const wasDeployedBeforeSwap = pid !== undefined ? !!State.players.deployedByPid[pid] : false;
    if (pid !== undefined) {
        closeArmMenu(eventPlayer);
        resetArmTimers(pid);
        State.players.deployedByPid[pid] = false;
        resetPlayerBoundaryStateOnUndeployOrReset(pid);
        clearVehicleReservationForPid(pid);
        cleanupConquestHudForTeamSwap(pid);
        State.conquest.debug.perspectiveTeamByPid[pid] = newTeamNum;
        State.conquest.debug.teamSwapPerspectiveLockUntilByPid[pid] = mod.GetMatchTimeElapsed() + TEAM_SWAP_PERSPECTIVE_LOCK_SECONDS;
    }
    mod.SetTeam(eventPlayer, mod.GetTeam(newTeamNum));
    markHudDirty();
    if (pid !== undefined) {
        void refreshConquestHudAfterTeamSwap(eventPlayer);
    }
    if (wasDeployedBeforeSwap) {
        void forceUndeployPlayer(eventPlayer, "team_switch");
    }

    sendHighlightedWorldLogMessage(
        msg(mod.stringkeys.twl.notifications.teamSwitch),
        false,
        mod.GetTeam(eventPlayer),
        mod.stringkeys.twl.notifications.teamSwitch
    );
}


