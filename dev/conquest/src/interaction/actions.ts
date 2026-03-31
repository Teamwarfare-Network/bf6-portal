// @ts-nocheck


const TEAM_SWAP_PERSPECTIVE_LOCK_SECONDS = 0.6;
type HudWarmOptions = {
    refreshReadyDialogs?: boolean;
    loadReason?: UiLoadReason;
    reuseActiveLoadSession?: boolean;
};

const TEAM_SWAP_HUD_UNDEPLOY_WAIT_SECONDS = 0.05;
const TEAM_SWAP_HUD_UNDEPLOY_WAIT_ATTEMPTS = 20;
const TEAM_SWAP_HUD_TEAM_SETTLE_SECONDS = 0.05;
const TEAM_SWAP_HUD_TEAM_SETTLE_ATTEMPTS = 8;

// Keeps one player on the deploy screen while the current loading session is still blocking release.
function holdPlayerAtDeploy(eventPlayer: mod.Player, pid: number, source: string): void {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    setUIInputModeForPlayer(eventPlayer, false);
    recordUiLoadDeployEnabledForPid(pid, false, source);
    mod.EnablePlayerDeploy(eventPlayer, false);
    mod.SetRedeployTime(eventPlayer, HUD_WARM_REDEPLOY_BLOCK_SECONDS);
}

// Applies the current deploy-availability decision and records who changed it for the loading-gate audit.
function applyPlayerDeployAvailability(eventPlayer: mod.Player, pid: number, deployEnabled: boolean, source: string): void {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    recordUiLoadDeployEnabledForPid(pid, deployEnabled, source);
    mod.EnablePlayerDeploy(eventPlayer, deployEnabled);
    mod.SetRedeployTime(eventPlayer, deployEnabled ? 0 : (isHudTransitionBlockingForPid(pid) ? HUD_WARM_REDEPLOY_BLOCK_SECONDS : 0));
}

// Starts the first-join loading session and immediately takes deploy ownership before async warm work begins.
function beginJoinLoadingGate(eventPlayer: mod.Player, pid: number): void {
    clearJoinPromptForPlayerId(pid);
    resetUiLoadTraceForPid(pid);
    beginUiLoadSessionForPid(pid, "join");
    setUiJoinDeployLockActiveForPid(pid, true);
    pushUiLoadTraceForPid(pid, "JOIN_BEGIN");
    reassertPlayerUiLoadingGateVisuals(eventPlayer, pid);
}

// Reasserts deploy ownership for an unreleased loading session so the gate keeps winning even if the engine or another path nudges deploy state.
function maintainPlayerLoadingGateAuthority(eventPlayer: mod.Player, pid: number): void {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    if (!isUiLoadGateActiveForPid(pid)) return;
    reassertPlayerUiLoadingGateVisuals(eventPlayer, pid);
    if (HARD_PLAYER_LOCK_AUDIT_MODE) {
        setAllInputRestrictionsForPlayer(eventPlayer, true, "hard_lock_hold");
    }
}

function enforceHudWarmTransitionDeployBlock(eventPlayer: mod.Player): void {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    const pid = safeGetPlayerId(eventPlayer);
    if (pid === undefined) return;
    holdPlayerAtDeploy(eventPlayer, pid, "warm_block");
}

function canEnablePlayerDeployForPid(pid: number): boolean {
    if (HARD_PLAYER_LOCK_AUDIT_MODE) return false;
    if (!isUiLoadDeployAuthorizedForPid(pid)) return false;
    if (isPidDisconnected(pid)) return false;
    if (State.round.flow.cleanupActive && !State.round.flow.cleanupAllowDeploy) return false;
    if (isHudTransitionBlockingForPid(pid)) return false;
    return true;
}

function syncPlayerDeployAvailability(eventPlayer: mod.Player): void {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    const pid = safeGetPlayerId(eventPlayer);
    if (pid === undefined) return;
    const canEnableDeploy = canEnablePlayerDeployForPid(pid);
    applyPlayerDeployAvailability(eventPlayer, pid, canEnableDeploy, "sync");
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
    return isVehicleDeployTimerHudCacheUsable(State.hudCache.vehicleDeployTimerCache[pid]);
}

function isCriticalHudReadyForPlayer(eventPlayer: mod.Player, pid: number): boolean {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return false;
    return isCriticalTopHudReadyForPid(pid)
        && isCriticalCombatHudReadyForPid(pid)
        && isCriticalVehicleDeployHudReadyForPid(pid);
}

// Returns true once the deferred production-menu families required by the pre-deploy gate are built
// and hidden-primed enough to hand off into the deployed finalize without releasing a cold menu path.
function isDeferredProductionUiReadyForPid(pid: number): boolean {
    return isUiProductionMenusWarmForPid(pid)
        && State.players.readyDialogData[pid]?.readyDialogWarmPrimed === true
        && isGadgetMenuHotReadyForPid(pid)
        && isReadyDialogUiCacheUsableForPid(pid)
        && armCacheOk(State.hudCache.ammoResupplyMenuCache[pid]);
}

// Returns true once the player-specific hidden warm prerequisites are complete for the current loading session.
function isPlayerUiPreRevealReadyForPid(eventPlayer: mod.Player, pid: number): boolean {
    return isCriticalHudReadyForPlayer(eventPlayer, pid) && isDeferredProductionUiReadyForPid(pid);
}

// Reasserts the player loading overlay + deploy block together so all gate paths share the same visible/blocking ownership.
function reassertPlayerUiLoadingGateVisuals(eventPlayer: mod.Player, pid: number): void {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    const overlayWasShown = isUiLoadOverlayShownForPid(pid);
    showJoinPromptLoadingForPlayer(eventPlayer);
    setUiLoadOverlayShownForPid(pid, true);
    if (!overlayWasShown) pushUiLoadTraceForPid(pid, "OVERLAY_ON");
    enforceHudWarmTransitionDeployBlock(eventPlayer);
}

// Begins or reuses one loading-gate session for a player so hidden warm, reveal, and release all share the same state bag.
function beginPlayerUiLoadingGate(
    eventPlayer: mod.Player,
    pid: number,
    reason: UiLoadReason,
    reuseActiveSession: boolean = false
): void {
    if (reuseActiveSession !== true || !isUiLoadGateActiveForPid(pid)) {
        if (reason !== "join") resetUiLoadTraceForPid(pid);
        beginUiLoadSessionForPid(pid, reason);
        pushUiLoadTraceForPid(pid, `LOAD_BEGIN:${reason}`);
    }
    reassertPlayerUiLoadingGateVisuals(eventPlayer, pid);
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
    const pid = safeGetPlayerId(eventPlayer);
    if (pid === undefined) return;
    if (isVehicleDeployTimerHudCacheUsable(State.hudCache.vehicleDeployTimerCache[pid])) return;
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
        if (!readyData || readyData.dialogVisible) return;
        if (!isReadyDialogUiCacheUsableForPid(pid)) {
            ensureReadyDialogUiBuiltHidden(eventPlayer);
        }
    } catch {}
}

function prebuildCriticalHudWhileHidden(eventPlayer: mod.Player, pid: number): void {
    prebuildTopLeftUiFamilyWhileHidden(eventPlayer, pid);
    prebuildVehicleSpawnerUiFamilyWhileHidden(eventPlayer, pid);
    prebuildCombatHudFamilyWhileHidden(eventPlayer, pid);
}

function prebuildDeferredUiWhileHidden(eventPlayer: mod.Player, pid: number): void {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    if (!isReadyDialogUiCacheUsableForPid(pid)) {
        prebuildReadyDialogUiFamilyWhileHidden(eventPlayer, pid);
        return;
    }
    try {
        if (!armCacheOk(State.hudCache.ammoResupplyMenuCache[pid])) {
            prebuildArmMenu(eventPlayer);
        }
    } catch {}
}

// Advances deferred production-menu warm while the loading gate is active.
// Important: this only proves hidden pre-deploy warmth; the real deployed Ready-open hot path
// is paid later during post-deploy finalize before movement is released.
async function advanceDeferredProductionUiWarmWhileBlocked(eventPlayer: mod.Player, pid: number): Promise<void> {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;

    prebuildDeferredUiWhileHidden(eventPlayer, pid);

    if (!isReadyDialogUiCacheUsableForPid(pid)) {
        setUiProductionMenusWarmForPid(pid, false);
        return;
    }

    if (!armCacheOk(State.hudCache.ammoResupplyMenuCache[pid])) {
        setUiProductionMenusWarmForPid(pid, false);
        setGadgetMenuHotReadyForPid(pid, false);
        return;
    }

    if (State.players.readyDialogData[pid]?.readyDialogWarmPrimed !== true) {
        await primeReadyDialogRevealWhileBlocked(eventPlayer);
        if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
        reassertPlayerUiLoadingGateVisuals(eventPlayer, pid);
    }

    if (!isGadgetMenuHotReadyForPid(pid) && armCacheOk(State.hudCache.ammoResupplyMenuCache[pid])) {
        setGadgetMenuHotReadyForPid(pid, true);
    }

    setUiProductionMenusWarmForPid(
        pid,
        isReadyDialogUiCacheUsableForPid(pid)
        && armCacheOk(State.hudCache.ammoResupplyMenuCache[pid])
        && State.players.readyDialogData[pid]?.readyDialogWarmPrimed === true
        && isGadgetMenuHotReadyForPid(pid)
    );
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
    syncUiCachePerfPanelForPid(pid);
    setUiCachePerfPanelVisibleForPid(pid, true);
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
    setUiCachePerfPanelVisibleForPid(pid, false);
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

// Resets the per-session warm milestones before a hidden prebuild/reveal pass begins.
function resetPlayerUiWarmMilestonesForPid(pid: number): void {
    setCombatHudRevealAllowedForPid(pid, false);
    setHudWarmCompletedForPid(pid, false);
    setUiCriticalRevealCompletedForPid(pid, false);
    setUiProductionMenusWarmForPid(pid, false);
    setReadyDialogHotReadyForPid(pid, false);
    setGadgetMenuHotReadyForPid(pid, false);
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
        reassertPlayerUiLoadingGateVisuals(eventPlayer, pid);
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
        reassertPlayerUiLoadingGateVisuals(eventPlayer, pid);
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
        loadReason: "team_swap",
        reuseActiveLoadSession: true,
    });

    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    const latestState = State.players.readyDialogData[pid];
    if (!latestState) return;
    const latestToken = getHudWarmTokenForPid(pid);
    if (latestToken !== token + 1 && latestToken !== token) {
        return;
    }
    syncPlayerDeployAvailability(eventPlayer);
}

function hideCriticalHudForWarmTransition(pid: number): void {
    setCombatHudRevealAllowedForPid(pid, false);
    twlConquestHudHideRootOnly(pid);
    hideTopHudFamilyForWarmTransition(pid);
    setPositionDebugWidgetsVisibleForPid(pid, false);
    hideVehicleSpawnerUiFamilyForPid(pid);

    safeSetUIWidgetVisible(safeFind(`Container_HelpText_${pid}`), false);
    safeSetUIWidgetVisible(safeFind(`HelpText_${pid}`), false);
}

// Releases the player loading gate through one idempotent cleanup path for both success and timeout.
function releasePlayerUiLoadingGate(eventPlayer: mod.Player, pid: number, token: number): void {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    if (!isHudWarmTokenCurrent(pid, token)) return;
    pushUiLoadTraceForPid(pid, "GATE_RELEASE");
    setUiLoadGateActiveForPid(pid, false);
    setUiLoadGateReleasedForPid(pid, true);
}

// Releases first join by handing off from the deploy-screen lock into a short post-deploy finalize,
// so the player still cannot move until the real deployed Ready-open prime has completed.
async function releaseJoinLoadingGate(eventPlayer: mod.Player, pid: number, token: number): Promise<void> {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    if (!isHudWarmTokenCurrent(pid, token)) return;
    if (HARD_PLAYER_LOCK_AUDIT_MODE) {
        pushUiLoadTraceForPid(pid, "JOIN_RELEASE_BLOCKED");
        reassertPlayerUiLoadingGateVisuals(eventPlayer, pid);
        setAllInputRestrictionsForPlayer(eventPlayer, true, "hard_lock_release_blocked");
        return;
    }

    setUiPostDeployFinalizeActiveForPid(pid, false);
    // Stop the ongoing player loop from reasserting the overlay while this release path hides and clears it.
    setUiLoadGateActiveForPid(pid, false);
    hideJoinPromptForPlayerId(pid);
    pushUiLoadTraceForPid(pid, "OVERLAY_HIDE_BEGIN:join");
    await mod.Wait(0);
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    if (!isHudWarmTokenCurrent(pid, token)) return;
    hideJoinPromptForPlayerId(pid);
    await mod.Wait(0);
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    if (!isHudWarmTokenCurrent(pid, token)) return;
    clearJoinPromptForPlayerId(pid);
    setUiLoadOverlayShownForPid(pid, false);
    pushUiLoadTraceForPid(pid, "OVERLAY_OFF:join");
    await mod.Wait(HUD_JOIN_DEPLOY_RELEASE_DELAY_SECONDS);
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    if (!isHudWarmTokenCurrent(pid, token)) return;

    setUiPostDeployFinalizeActiveForPid(pid, true);
    setAllInputRestrictionsForPlayer(eventPlayer, true, "join_release_finalize");
    setUiLoadDeployAuthorizedForPid(pid, true);
    setUiJoinDeployLockActiveForPid(pid, false);
    pushUiLoadTraceForPid(pid, "JOIN_AUTHORIZE");
    releasePlayerUiLoadingGate(eventPlayer, pid, token);
    pushUiLoadTraceForPid(pid, "JOIN_RELEASE");
    syncPlayerDeployAvailability(eventPlayer);
}

// Releases non-join warm transitions only after visible reveal has completed so follow-up paths can use the same loading session.
function releaseHudWarmTransitionForPlayer(eventPlayer: mod.Player, token: number): void {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    const pid = safeGetPlayerId(eventPlayer);
    if (pid === undefined) return;
    const state = State.players.readyDialogData[pid];
    if (!state) return;
    if (!isHudWarmTokenCurrent(pid, token)) return;

    setHudSwapTransitionActiveForPid(pid, false);
    setUiLoadDeployAuthorizedForPid(pid, true);
    setUiPostDeployFinalizeActiveForPid(pid, true);
    setAllInputRestrictionsForPlayer(eventPlayer, true, "post_deploy_finalize");
    releasePlayerUiLoadingGate(eventPlayer, pid, token);
    syncPlayerDeployAvailability(eventPlayer);
    void prebuildDeferredUiAfterReveal(eventPlayer, pid, token);
}

// Performs one post-reveal settle pass while the loading gate is still active so release happens after visible UI becomes usable.
async function finalizeUiRevealWhileBlocked(eventPlayer: mod.Player, pid: number, token: number): Promise<boolean> {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return false;
    if (!isHudWarmTokenCurrent(pid, token)) return false;
    pushUiLoadTraceForPid(pid, "REVEAL_BEGIN");
    renderCriticalHudForReveal(eventPlayer, pid);
    await mod.Wait(HUD_WARM_POST_REVEAL_SETTLE_SECONDS);
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return false;
    if (!isHudWarmTokenCurrent(pid, token)) return false;
    setUiCriticalRevealCompletedForPid(pid, true);
    pushUiLoadTraceForPid(pid, "REVEAL_OK");
    return true;
}

// Keeps first join blocked for a few post-reveal polls so hidden menu warm must remain stable after visible reveal before deploy can release.
async function finalizeProductionUiHotReadinessWhileBlocked(
    eventPlayer: mod.Player,
    pid: number,
    token: number
): Promise<boolean> {
    let stablePolls = 0;
    const readyDeadline = mod.GetMatchTimeElapsed() + HUD_WARM_POST_REVEAL_READY_TIMEOUT_SECONDS;
    while (true) {
        if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return false;
        if (!isHudWarmTokenCurrent(pid, token)) return false;

        maintainPlayerLoadingGateAuthority(eventPlayer, pid);
        await advanceDeferredProductionUiWarmWhileBlocked(eventPlayer, pid);
        if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return false;
        if (!isHudWarmTokenCurrent(pid, token)) return false;

        if (isDeferredProductionUiReadyForPid(pid)) stablePolls += 1;
        else stablePolls = 0;

        const timedOut = mod.GetMatchTimeElapsed() >= readyDeadline;
        if (stablePolls >= HUD_WARM_POST_REVEAL_STABLE_POLLS || timedOut) {
            pushUiLoadTraceForPid(pid, timedOut ? "POST_REVEAL_TIMEOUT" : "POST_REVEAL_OK");
            return true;
        }

        await mod.Wait(0);
    }
}

async function prebuildDeferredUiAfterReveal(eventPlayer: mod.Player, pid: number, token: number): Promise<void> {
    await mod.Wait(0);
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    if (!isHudWarmTokenCurrent(pid, token)) return;
    prebuildReadyDialogUiFamilyWhileHidden(eventPlayer, pid);

    await mod.Wait(0);
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    if (!isHudWarmTokenCurrent(pid, token)) return;
    try {
        if (!armCacheOk(State.hudCache.ammoResupplyMenuCache[pid])) {
            prebuildArmMenu(eventPlayer);
        }
    } catch {}
}

// Runs the hidden warm loop until the current session is either stable enough to reveal or times out.
async function warmPlayerUiUntilRevealSettled(
    eventPlayer: mod.Player,
    pid: number,
    token: number,
    refreshReadyDialogs: boolean = false
): Promise<boolean> {
    await mod.Wait(HUD_WARM_PREBUILD_DELAY_SECONDS);
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return false;
    if (!isHudWarmTokenCurrent(pid, token)) return false;

    let readyStablePolls = 0;
    const readyDeadline = mod.GetMatchTimeElapsed() + HUD_FULL_UI_READY_TIMEOUT_SECONDS;
    while (true) {
        if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return false;
        if (!isHudWarmTokenCurrent(pid, token)) return false;

        maintainPlayerLoadingGateAuthority(eventPlayer, pid);
        prebuildCriticalHudWhileHidden(eventPlayer, pid);
        await advanceDeferredProductionUiWarmWhileBlocked(eventPlayer, pid);
        hideCriticalHudForWarmTransition(pid);

        if (isPlayerUiPreRevealReadyForPid(eventPlayer, pid)) readyStablePolls += 1;
        else readyStablePolls = 0;

        const timedOut = mod.GetMatchTimeElapsed() >= readyDeadline;
        if (readyStablePolls >= HUD_WARM_READY_STABLE_POLLS || timedOut) {
            pushUiLoadTraceForPid(pid, timedOut ? "READY_TIMEOUT" : "READY_OK");
            break;
        }

        await mod.Wait(HUD_WARM_READY_POLL_SECONDS);
    }

    if (!isHudWarmTokenCurrent(pid, token)) return false;

    setHudWarmCompletedForPid(pid, true);
    if (refreshReadyDialogs) {
        renderReadyDialogForAllVisibleViewers();
    }
    const revealSettled = await finalizeUiRevealWhileBlocked(eventPlayer, pid, token);
    if (!revealSettled) return false;
    return await finalizeProductionUiHotReadinessWhileBlocked(eventPlayer, pid, token);
}

// Continues the already-started first-join loading session so deploy release cannot drift into generic warm helpers.
async function runJoinLoadingGateUntilReady(eventPlayer: mod.Player, pid: number): Promise<void> {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    const token = invalidateHudWarmTokenForPid(pid);
    if (token === undefined) return;

    resetPlayerUiWarmMilestonesForPid(pid);
    hideCriticalHudForWarmTransition(pid);

    const revealSettled = await warmPlayerUiUntilRevealSettled(eventPlayer, pid, token, true);
    if (!revealSettled) return;

    pushUiLoadTraceForPid(pid, "JOIN_WARM_DONE");
    refreshBuiltReadyDialogCachesForAllPlayers();
    replayActiveMapValidationWarningsToPlayer(eventPlayer);
    await releaseJoinLoadingGate(eventPlayer, pid, token);
}

// Conservative first-join gate:
// 1) keep deploy hard-blocked through one join-owned path
// 2) warm the UI in the background
// 3) never release before the minimum blocked window
// 4) still fail safe through the existing warm timeout / release path
async function runJoinLoadingGateWithConservativeRelease(eventPlayer: mod.Player, pid: number): Promise<void> {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    const token = invalidateHudWarmTokenForPid(pid);
    if (token === undefined) return;

    resetPlayerUiWarmMilestonesForPid(pid);
    hideCriticalHudForWarmTransition(pid);
    setAllInputRestrictionsForPlayer(eventPlayer, true, "join_conservative_lock");
    pushUiLoadTraceForPid(pid, "JOIN_CONSERVATIVE_LOCK_BEGIN");
    const minimumReleaseAt = mod.GetMatchTimeElapsed() + JOIN_CONSERVATIVE_FIRST_JOIN_MIN_LOCK_SECONDS;

    const revealSettled = await warmPlayerUiUntilRevealSettled(eventPlayer, pid, token, true);
    if (!revealSettled) return;

    pushUiLoadTraceForPid(pid, "JOIN_WARM_DONE");
    refreshBuiltReadyDialogCachesForAllPlayers();
    replayActiveMapValidationWarningsToPlayer(eventPlayer);

    const remainingMinimumLock = minimumReleaseAt - mod.GetMatchTimeElapsed();
    if (remainingMinimumLock > 0) {
        await mod.Wait(remainingMinimumLock);
    }
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    if (!isHudWarmTokenCurrent(pid, token)) return;
    pushUiLoadTraceForPid(pid, "JOIN_CONSERVATIVE_LOCK_END");
    await releaseJoinLoadingGate(eventPlayer, pid, token);
}

// Runs the shared non-join warm controller and must never preempt an active first-join loading session.
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
    if (state.uiLoadReason === "join" && isUiLoadGateActiveForPid(pid) && options?.loadReason !== "join") {
        reassertPlayerUiLoadingGateVisuals(eventPlayer, pid);
        return;
    }

    const token = invalidateHudWarmTokenForPid(pid);
    if (token === undefined) return;
    beginPlayerUiLoadingGate(
        eventPlayer,
        pid,
        options?.loadReason ?? "refresh",
        options?.reuseActiveLoadSession === true
    );
    resetPlayerUiWarmMilestonesForPid(pid);
    hideCriticalHudForWarmTransition(pid);

    const revealSettled = await warmPlayerUiUntilRevealSettled(
        eventPlayer,
        pid,
        token,
        options?.refreshReadyDialogs === true
    );
    if (!revealSettled) return;
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
        beginPlayerUiLoadingGate(eventPlayer, pid, "team_swap");
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


