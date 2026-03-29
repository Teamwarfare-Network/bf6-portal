// @ts-nocheck


const TEAM_SWAP_PERSPECTIVE_LOCK_SECONDS = 0.6;
type HudWarmOptions = {
    refreshReadyDialogs?: boolean;
};

const TEAM_SWAP_HUD_UNDEPLOY_WAIT_SECONDS = 0.05;
const TEAM_SWAP_HUD_UNDEPLOY_WAIT_ATTEMPTS = 20;
const TEAM_SWAP_HUD_TEAM_SETTLE_SECONDS = 0.05;
const TEAM_SWAP_HUD_TEAM_SETTLE_ATTEMPTS = 8;

function enforceHudWarmTransitionDeployBlock(eventPlayer: mod.Player): void {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    setUIInputModeForPlayer(eventPlayer, false);
    mod.EnablePlayerDeploy(eventPlayer, false);
    mod.SetRedeployTime(eventPlayer, HUD_WARM_REDEPLOY_BLOCK_SECONDS);
}

function canEnablePlayerDeployForPid(pid: number): boolean {
    if (isPidDisconnected(pid)) return false;
    if (State.round.flow.cleanupActive && !State.round.flow.cleanupAllowDeploy) return false;
    if (safeFind(joinPromptRootName(pid))) return false;
    if (isHudSwapTransitionActiveForPid(pid)) return false;
    if (!isHudWarmReadyForPid(pid)) return false;
    return true;
}

function syncPlayerDeployAvailability(eventPlayer: mod.Player): void {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    const pid = safeGetPlayerId(eventPlayer);
    if (pid === undefined) return;
    const canEnableDeploy = canEnablePlayerDeployForPid(pid);
    mod.EnablePlayerDeploy(eventPlayer, canEnableDeploy);
    mod.SetRedeployTime(eventPlayer, canEnableDeploy ? 0 : (isHudTransitionBlockingForPid(pid) ? HUD_WARM_REDEPLOY_BLOCK_SECONDS : 0));
}

function isCriticalTopHudReadyForPid(pid: number): boolean {
    const refs = getTopHudShellRefsForPid(pid);
    const clockCache = State.hudCache.clockWidgetCache[pid];
    return !!(
        refs
        && hasTopLeftHudShellRefs(refs)
        && safeFind(`HelpText_${pid}`)
        && clockCache?.root
        && clockCache?.plate
    );
}

function isCriticalCombatHudReadyForPid(pid: number): boolean {
    const entry = twlConquestHudGetEntry(pid);
    return !!(
        entry
        && entry.initialized
        && entry.widgets.root
        && entry.widgets.combatLane
        && entry.widgets.ticketsLane
        && entry.widgets.objectivesLane
    );
}

function isCriticalVehicleDeployHudReadyForPid(pid: number): boolean {
    if (!shouldShowVehicleDeployTimersForPid(pid)) return true;
    const cache = State.hudCache.vehicleDeployTimerCache[pid];
    if (!cache?.root) return false;
    if (cache.rows.length < VEHICLE_DEPLOY_TIMER_MAX_ROWS) return false;
    for (let i = 0; i < VEHICLE_DEPLOY_TIMER_MAX_ROWS; i++) {
        const row = cache.rows[i];
        if (!row?.vehiclePlate || !row?.vehicleText || !row?.timer?.root || !row?.timer?.plate) {
            return false;
        }
    }
    return true;
}

function isCriticalHudReadyForPlayer(eventPlayer: mod.Player, pid: number): boolean {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return false;
    return isCriticalTopHudReadyForPid(pid)
        && isCriticalCombatHudReadyForPid(pid)
        && isCriticalVehicleDeployHudReadyForPid(pid);
}

function refreshClockForPlayer(eventPlayer: mod.Player, pid: number): void {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
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
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
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
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
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
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    try {
        prebuildVehicleDeployTimerHudHiddenForPlayer(eventPlayer);
    } catch {}
}

function prebuildCombatHudFamilyWhileHidden(eventPlayer: mod.Player, pid: number): void {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    try {
        const entry = twlConquestHudEnsurePlayerGraph(eventPlayer);
        if (!entry || !entry.initialized) return;
        twlConquestHudHidePlayer(pid);
    } catch {}
}

function prebuildReadyDialogUiFamilyWhileHidden(eventPlayer: mod.Player, pid: number): void {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    try {
        const readyData = getReadyDialogStateForPid(pid);
        if (readyData && !readyData.dialogVisible) ensureReadyDialogUiBuiltHidden(eventPlayer);
    } catch {}
}

function prebuildCriticalHudWhileHidden(eventPlayer: mod.Player, pid: number): void {
    prebuildTopLeftUiFamilyWhileHidden(eventPlayer, pid);
    prebuildVehicleSpawnerUiFamilyWhileHidden(eventPlayer, pid);
    prebuildCombatHudFamilyWhileHidden(eventPlayer, pid);
}

function prebuildDeferredUiWhileHidden(eventPlayer: mod.Player, pid: number): void {
    prebuildReadyDialogUiFamilyWhileHidden(eventPlayer, pid);
    prebuildArmMenu(eventPlayer);
}

function renderTopLeftUiFamilyImmediate(eventPlayer: mod.Player, pid: number): void {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    const refs = ensureTopHudShellForPlayer(eventPlayer);
    setMatchStateTextForPid(pid);
    safeSetUIWidgetVisible(refs?.topHudRoot, true);
    safeSetUIWidgetVisible(refs?.upperLeftContainer, true);
    safeSetUIWidgetVisible(refs?.upperLeftStatusContainer, true);
    safeSetUIWidgetVisible(refs?.upperLeftStatusStateText, true);
    safeSetUIWidgetVisible(refs?.upperLeftStatusReadyText, true);
}

function renderTopLeftUiFamilyForReveal(eventPlayer: mod.Player, pid: number): void {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    const refs = ensureTopHudShellForPlayer(eventPlayer);
    renderTopLeftUiFamilyImmediate(eventPlayer, pid);
    updateHelpTextVisibilityForPid(pid);
    refreshClockForPlayer(eventPlayer, pid);
    safeSetUIWidgetVisible(refs?.topCenterAuxRoot, true);
}

function renderVehicleSpawnerUiFamilyForReveal(eventPlayer: mod.Player, _pid: number): void {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    revealVehicleDeployTimerHudForPlayer(eventPlayer);
}

function armCombatHudFamilyForSchedulerReveal(eventPlayer: mod.Player, pid: number): void {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    const entry = twlConquestHudEnsurePlayerGraph(eventPlayer);
    if (!entry || !entry.initialized) return;
    twlConquestHudHidePlayer(pid);
    entry.pendingFirstReveal = true;
    setCombatHudRevealAllowedForPid(pid, true);
}

function renderAdminUiFamilyForReveal(eventPlayer: mod.Player, pid: number): void {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    const refs = ensureTopHudShellForPlayer(eventPlayer);
    safeSetUIWidgetVisible(refs?.adminPanelActionCountText, true);
    try {
        if (State.players.readyDialogData[pid]?.posDebugVisible) {
            setPositionDebugVisibleForPlayer(eventPlayer, true);
        }
    } catch {}
}

function setPositionDebugWidgetsVisibleForPid(pid: number, visible: boolean): void {
    for (const widgetId of getPositionDebugWidgetIds(pid)) {
        safeSetUIWidgetVisible(safeFind(widgetId), visible);
    }
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

function setClockWidgetCacheVisible(
    clockCache: ReusableTimerWidgetCacheEntry | undefined,
    visible: boolean
): void {
    if (!clockCache) return;
    safeSetUIWidgetVisible(clockCache.root, visible);
    safeSetUIWidgetVisible(clockCache.plate, visible);
    safeSetUIWidgetVisible(clockCache.minTensShadow, visible);
    safeSetUIWidgetVisible(clockCache.minTens, visible);
    safeSetUIWidgetVisible(clockCache.minOnesShadow, visible);
    safeSetUIWidgetVisible(clockCache.minOnes, visible);
    safeSetUIWidgetVisible(clockCache.colonShadow, visible);
    safeSetUIWidgetVisible(clockCache.colon, visible);
    safeSetUIWidgetVisible(clockCache.secTensShadow, visible);
    safeSetUIWidgetVisible(clockCache.secTens, visible);
    safeSetUIWidgetVisible(clockCache.secOnesShadow, visible);
    safeSetUIWidgetVisible(clockCache.secOnes, visible);
    clockCache.lastVisibleState = visible;
}

function hideVehicleSpawnerUiFamilyForPid(pid: number): void {
    const vehicleCache = State.hudCache.vehicleDeployTimerCache[pid];
    if (!vehicleCache) return;
    hideVehicleDeployTimerHudFamily(vehicleCache, false);
}

function hideTopHudFamilyForWarmTransition(pid: number): void {
    const refs = getTopHudShellRefsForPid(pid);
    safeSetUIWidgetVisible(refs?.topCenterAuxRoot, false);
    safeSetUIWidgetVisible(refs?.helpTextContainer, false);
    safeSetUIWidgetVisible(refs?.adminPanelActionCountText, false);
    safeSetUIWidgetVisible(refs?.victoryRoot, false);

    setClockWidgetCacheVisible(State.hudCache.clockWidgetCache[pid], false);
}

function renderCriticalHudForReveal(eventPlayer: mod.Player, pid: number): void {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    if (isHudSwapTransitionActiveForPid(pid) || !isHudWarmReadyForPid(pid)) {
        hideCriticalHudForWarmTransition(pid);
        return;
    }
    renderTopLeftUiFamilyForReveal(eventPlayer, pid);
    renderVehicleSpawnerUiFamilyForReveal(eventPlayer, pid);
    armCombatHudFamilyForSchedulerReveal(eventPlayer, pid);
    twlConquestHudPrimePlayerFrame(eventPlayer);
    renderAdminUiFamilyForReveal(eventPlayer, pid);
}

async function waitForPlayerToBecomeUndeployedForTeamSwap(
    eventPlayer: mod.Player,
    pid: number,
    token: number
): Promise<boolean> {
    for (let i = 0; i < TEAM_SWAP_HUD_UNDEPLOY_WAIT_ATTEMPTS; i++) {
        if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return false;
        if (!isHudWarmTokenCurrent(pid, token)) return false;
        if (!State.players.deployedByPid[pid]) return true;
        enforceHudWarmTransitionDeployBlock(eventPlayer);
        hideCriticalHudForWarmTransition(pid);
        await mod.Wait(TEAM_SWAP_HUD_UNDEPLOY_WAIT_SECONDS);
    }
    return !State.players.deployedByPid[pid];
}

async function waitForPlayerTeamToSettleForSwap(
    eventPlayer: mod.Player,
    pid: number,
    token: number,
    newTeamNum: TeamID
): Promise<boolean> {
    for (let i = 0; i < TEAM_SWAP_HUD_TEAM_SETTLE_ATTEMPTS; i++) {
        if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return false;
        if (!isHudWarmTokenCurrent(pid, token)) return false;
        if (safeGetTeamNumberFromPlayer(eventPlayer, 0) === newTeamNum) return true;
        enforceHudWarmTransitionDeployBlock(eventPlayer);
        hideCriticalHudForWarmTransition(pid);
        await mod.Wait(TEAM_SWAP_HUD_TEAM_SETTLE_SECONDS);
    }
    return safeGetTeamNumberFromPlayer(eventPlayer, 0) === newTeamNum;
}

async function runTeamSwapHudWarmController(
    eventPlayer: mod.Player,
    pid: number,
    token: number,
    newTeamNum: TeamID,
    waitForUndeploy: boolean
): Promise<void> {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    const state = State.players.readyDialogData[pid];
    if (!state) return;

    if (waitForUndeploy) {
        const undeployed = await waitForPlayerToBecomeUndeployedForTeamSwap(eventPlayer, pid, token);
        if (!undeployed) return;
    }

    const settled = await waitForPlayerTeamToSettleForSwap(eventPlayer, pid, token, newTeamNum);
    if (!settled) return;
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    if (!isHudWarmTokenCurrent(pid, token)) return;

    await warmCriticalHudForPlayer(eventPlayer, {
    });

    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    const latestState = State.players.readyDialogData[pid];
    if (!latestState) return;
    const latestToken = getHudWarmTokenForPid(pid);
    if (latestToken !== token + 1 && latestToken !== token) {
        return;
    }
    invalidateHiddenReadyDialogCacheForPid(pid);
    ensureReadyDialogUiBuiltHidden(eventPlayer);
    syncPlayerDeployAvailability(eventPlayer);
}

function hideCriticalHudForWarmTransition(pid: number): void {
    setCombatHudRevealAllowedForPid(pid, false);
    twlConquestHudHideRootOnly(pid);
    clearJoinPromptForPlayerId(pid);
    hideTopHudFamilyForWarmTransition(pid);
    setPositionDebugWidgetsVisibleForPid(pid, false);
    hideVehicleSpawnerUiFamilyForPid(pid);

    safeSetUIWidgetVisible(safeFind(`Container_HelpText_${pid}`), false);
    safeSetUIWidgetVisible(safeFind(`HelpText_${pid}`), false);
}

function releaseHudWarmTransitionForPlayer(eventPlayer: mod.Player, token: number): void {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    const pid = safeGetPlayerId(eventPlayer);
    if (pid === undefined) return;
    const state = State.players.readyDialogData[pid];
    if (!state) return;
    if (!isHudWarmTokenCurrent(pid, token)) return;

    setHudSwapTransitionActiveForPid(pid, false);

    renderCriticalHudForReveal(eventPlayer, pid);
    syncPlayerDeployAvailability(eventPlayer);
    void prebuildDeferredUiAfterReveal(eventPlayer, pid, token);
}

async function prebuildDeferredUiAfterReveal(eventPlayer: mod.Player, pid: number, token: number): Promise<void> {
    await mod.Wait(0);
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    if (!isHudWarmTokenCurrent(pid, token)) return;
    prebuildDeferredUiWhileHidden(eventPlayer, pid);
}

async function warmCriticalHudForPlayer(
    eventPlayer: mod.Player,
    options?: HudWarmOptions
): Promise<void> {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    const pid = safeGetPlayerId(eventPlayer);
    if (pid === undefined) return;
    if (!State.players.readyDialogData[pid]) initReadyDialogData(eventPlayer);
    const state = State.players.readyDialogData[pid];
    if (!state) return;

    const token = invalidateHudWarmTokenForPid(pid);
    if (token === undefined) return;
    setCombatHudRevealAllowedForPid(pid, false);
    if (state.hudWarmCompleted !== true) {
        setHudWarmCompletedForPid(pid, false);
        hideCriticalHudForWarmTransition(pid);
    }

    await mod.Wait(HUD_WARM_PREBUILD_DELAY_SECONDS);
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    if (!isHudWarmTokenCurrent(pid, token)) return;

    let readyStablePolls = 0;
    const readyDeadline = mod.GetMatchTimeElapsed() + HUD_WARM_READY_TIMEOUT_SECONDS;
    while (true) {
        if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
        if (!isHudWarmTokenCurrent(pid, token)) return;

        prebuildCriticalHudWhileHidden(eventPlayer, pid);
        if (!state.hudWarmCompleted) {
            hideCriticalHudForWarmTransition(pid);
        }

        if (isCriticalHudReadyForPlayer(eventPlayer, pid)) readyStablePolls += 1;
        else readyStablePolls = 0;

        const timedOut = mod.GetMatchTimeElapsed() >= readyDeadline;
        if (readyStablePolls >= HUD_WARM_READY_STABLE_POLLS || timedOut) {
            break;
        }

        await mod.Wait(HUD_WARM_READY_POLL_SECONDS);
    }

    if (!isHudWarmTokenCurrent(pid, token)) return;

    setHudWarmCompletedForPid(pid, true);
    if (options?.refreshReadyDialogs) {
        renderReadyDialogForAllVisibleViewers();
    }
    releaseHudWarmTransitionForPlayer(eventPlayer, token);
}

function cleanupConquestHudForTeamSwap(pid: number): void {
    twlConquestHudHidePlayer(pid);
    delete State.conquest.capture.engagedObjIdByPid[pid];
    conquestPhase4OnPlayerLeaveOrResetPid(pid);
    conquestPhase4BOnPlayerLeaveOrResetPid(pid);
    State.conquest.debug.engageHiddenUntilDeployByPid[pid] = true;
    State.conquest.debug.teamSwapHudResetPendingByPid[pid] = true;
    twlConquestHudHideObjectiveFocusForPid(pid);
}


async function forceUndeployPlayer(
    eventPlayer: mod.Player,
    deployReason: ConquestSpawnChargeReason = "forced_redeploy"
): Promise<void> {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    const pid = safeGetPlayerId(eventPlayer);
    if (pid !== undefined) conquestPhase2BMarkNextDeployReason(pid, deployReason);
    mod.UndeployPlayer(eventPlayer);
    await mod.Wait(0.05);
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    mod.UndeployPlayer(eventPlayer);
}

async function refreshConquestHudAfterTeamSwap(eventPlayer: mod.Player): Promise<void> {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    const pid = safeGetPlayerId(eventPlayer);
    if (pid === undefined) return;

    const nextToken = (State.conquest.debug.teamSwapRefreshTokenByPid[pid] ?? 0) + 1;
    State.conquest.debug.teamSwapRefreshTokenByPid[pid] = nextToken;

    await mod.Wait(0.12);
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    if ((State.conquest.debug.teamSwapRefreshTokenByPid[pid] ?? 0) !== nextToken) return;

    twlConquestHudHidePlayer(pid);
    State.conquest.debug.engageHiddenUntilDeployByPid[pid] = true;
    delete State.conquest.capture.engagedObjIdByPid[pid];
    twlConquestHudHideObjectiveFocusForPid(pid);
    conquestPhase3MarkHudDirty();
}

function processReadyDialogSelection(eventPlayer: mod.Player) {

    hideReadyDialogUI(eventPlayer);

    const pid = safeGetPlayerId(eventPlayer);
    const currentTeamNum = getTeamNumber(mod.GetTeam(eventPlayer));
    const newTeamNum = (currentTeamNum === TeamID.Team2) ? TeamID.Team1 : TeamID.Team2;
    const wasDeployedBeforeSwap = pid !== undefined ? !!State.players.deployedByPid[pid] : false;
    if (pid !== undefined) {
        closeArmMenu(eventPlayer);
        resetArmTimers(pid);
        const readyData = State.players.readyDialogData[pid];
        if (readyData) {
            setHudSwapTransitionActiveForPid(pid, true);
            setHudWarmCompletedForPid(pid, false);
            invalidateHudWarmTokenForPid(pid);
        }
        State.players.deployedByPid[pid] = false;
        resetPlayerBoundaryStateOnUndeployOrReset(pid);
        clearVehicleReservationForPid(pid);
        hideVehicleSpawnerUiFamilyForPid(pid);
        setPositionDebugWidgetsVisibleForPid(pid, false);
        cleanupConquestHudForTeamSwap(pid);
        State.conquest.debug.perspectiveTeamByPid[pid] = newTeamNum;
        State.conquest.debug.teamSwapPerspectiveLockUntilByPid[pid] = mod.GetMatchTimeElapsed() + TEAM_SWAP_PERSPECTIVE_LOCK_SECONDS;
        hideCriticalHudForWarmTransition(pid);
    }
    enforceHudWarmTransitionDeployBlock(eventPlayer);
    mod.SetTeam(eventPlayer, mod.GetTeam(newTeamNum));
    conquestPhase3MarkHudDirty();
    if (pid !== undefined) {
        void refreshConquestHudAfterTeamSwap(eventPlayer);
        void runTeamSwapHudWarmController(
            eventPlayer,
            pid,
            getHudWarmTokenForPid(pid),
            newTeamNum,
            wasDeployedBeforeSwap
        );
    }
    if (wasDeployedBeforeSwap) {
        void forceUndeployPlayer(eventPlayer, "team_switch");
    }

    sendHighlightedWorldLogMessage(
        mod.Message(mod.stringkeys.twl.notifications.teamSwitch),
        false,
        mod.GetTeam(eventPlayer),
        mod.stringkeys.twl.notifications.teamSwitch
    );
}


