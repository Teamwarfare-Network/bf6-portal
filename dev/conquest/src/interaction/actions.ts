// @ts-nocheck


const TEAM_SWAP_PERSPECTIVE_LOCK_SECONDS = 0.6;

const TEAM_SWAP_HUD_UNDEPLOY_WAIT_SECONDS = 0.05;
const TEAM_SWAP_HUD_UNDEPLOY_WAIT_ATTEMPTS = 20;
const TEAM_SWAP_HUD_TEAM_SETTLE_SECONDS = 0.05;
const TEAM_SWAP_HUD_TEAM_SETTLE_ATTEMPTS = 8;

// Keeps one player on the deploy screen while the current loading session is still blocking release.
function holdPlayerAtDeploy(eventPlayer: mod.Player, pid: number, source: string): void {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    setUIInputModeForPlayer(eventPlayer, false);
    recordUiLoadDeployEnabledForPid(pid, false);
    mod.EnablePlayerDeploy(eventPlayer, false);
    mod.SetRedeployTime(eventPlayer, HUD_WARM_REDEPLOY_BLOCK_SECONDS);
}

// Applies the current deploy-availability decision and records who changed it for the loading-gate audit.
function applyPlayerDeployAvailability(eventPlayer: mod.Player, pid: number, deployEnabled: boolean, source: string): void {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    recordUiLoadDeployEnabledForPid(pid, deployEnabled);
    mod.EnablePlayerDeploy(eventPlayer, deployEnabled);
    mod.SetRedeployTime(eventPlayer, deployEnabled ? 0 : (isHudTransitionBlockingForPid(pid) ? HUD_WARM_REDEPLOY_BLOCK_SECONDS : 0));
}

// Single gate entry for both first-join and team-swap.
// Immediately shows the loading overlay, blocks deploy, and hides all visible UI families before warm begins.
function beginLoadingGate(eventPlayer: mod.Player, pid: number, reason: UiLoadReason): void {
    clearJoinPromptForPlayerId(pid);
    beginUiLoadSessionForPid(pid, reason);
    updateHudTeamSwapButtonVisibilityForPid(pid);
    setGateStartTimeForPid(pid, mod.GetMatchTimeElapsed());
    hideAllUiFamiliesForPlayer(eventPlayer, pid);
    reassertPlayerUiLoadingGateVisuals(eventPlayer, pid);
}

// Reasserts deploy ownership for an unreleased loading session so the gate keeps winning even if the engine or another path nudges deploy state.
function maintainPlayerLoadingGateAuthority(eventPlayer: mod.Player, pid: number): void {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    if (!isUiLoadGateActiveForPid(pid)) return;
    reassertPlayerUiLoadingGateVisuals(eventPlayer, pid);
}

function enforceHudWarmTransitionDeployBlock(eventPlayer: mod.Player): void {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    const pid = safeGetPlayerId(eventPlayer);
    if (pid === undefined) return;
    holdPlayerAtDeploy(eventPlayer, pid, "warm_block");
}

function canEnablePlayerDeployForPid(pid: number): boolean {
    if (isPidDisconnected(pid)) return false;
    if (State.round.flow.cleanupActive && !State.round.flow.cleanupAllowDeploy) return false;
    if (isUiLoadGateActiveForPid(pid)) return false;
    if (!isUiLoadGateReleasedForPid(pid)) return false;
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

// Unified readiness gate: all six UI families must be warm and cache-usable before the gate releases.
// This replaces the old staged critical-first / deferred-second check.
function isAllUiFamiliesReadyForRelease(eventPlayer: mod.Player, pid: number): boolean {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return false;
    return isCriticalTopHudReadyForPid(pid)
        && isCriticalCombatHudReadyForPid(pid)
        && isCriticalVehicleDeployHudReadyForPid(pid)
        && isReadyDialogUiCacheUsableForPid(pid)
        && isReadyDialogHotReadyForPid(pid)
        && armCacheOk(State.hudCache.ammoResupplyMenuCache[pid])
        && isGadgetMenuHotReadyForPid(pid)
        && isAdminPanelWarmForPid(pid);
}

// Reasserts the player loading overlay + deploy block together so all gate paths share the same visible/blocking ownership.
function reassertPlayerUiLoadingGateVisuals(eventPlayer: mod.Player, pid: number): void {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    const overlayWasShown = isUiLoadOverlayShownForPid(pid);
    showJoinPromptLoadingForPlayer(eventPlayer);
    setUiLoadOverlayShownForPid(pid, true);
    enforceHudWarmTransitionDeployBlock(eventPlayer);
}

// Hides all currently visible UI families before a gate warm pass begins.
// Called at the start of every gate session so no partial UI is visible during warm.
function hideAllUiFamiliesForPlayer(eventPlayer: mod.Player, pid: number): void {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    hideCriticalHudForWarmTransition(pid);
    if (State.players.readyDialogData[pid]?.dialogVisible) {
        hideReadyDialogUI(eventPlayer);
    }
    closeArmMenu(eventPlayer);
    closeVehicleDeployLiveMenuForPlayer(eventPlayer);
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

// Consolidated hidden prebuild for all six UI families. Called at gate start and on each poll retry.
// Each family is best-effort; failures are swallowed so one cold family does not block others.
async function prebuildAllUiFamiliesHidden(eventPlayer: mod.Player, pid: number): Promise<void> {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    // Critical families (synchronous)
    prebuildTopLeftUiFamilyWhileHidden(eventPlayer, pid);
    prebuildVehicleSpawnerUiFamilyWhileHidden(eventPlayer, pid);
    prebuildCombatHudFamilyWhileHidden(eventPlayer, pid);
    // Production menus (may involve async priming)
    prebuildReadyDialogUiFamilyWhileHidden(eventPlayer, pid);
    try {
        if (!armCacheOk(State.hudCache.ammoResupplyMenuCache[pid])) {
            prebuildArmMenu(eventPlayer);
        }
    } catch {}
    // Ready dialog hot-prime: show/hide pass so first open is pure reveal not a cold build.
    // The prime makes the dialog briefly visible behind the loading overlay. Reassert the overlay
    // and yield one frame before starting so the overlay is fully rendered and occludes the prime.
    if (isReadyDialogUiCacheUsableForPid(pid)
        && State.players.readyDialogData[pid]?.readyDialogWarmPrimed !== true) {
        reassertPlayerUiLoadingGateVisuals(eventPlayer, pid);
        await mod.Wait(0);
        if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
        if (!isUiLoadGateActiveForPid(pid)) return;
        await primeReadyDialogRevealWhileBlocked(eventPlayer);
        if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
        reassertPlayerUiLoadingGateVisuals(eventPlayer, pid);
    }
    if (isReadyDialogUiCacheUsableForPid(pid)
        && State.players.readyDialogData[pid]?.readyDialogWarmPrimed === true) {
        setReadyDialogHotReadyForPid(pid, true);
    }
    if (armCacheOk(State.hudCache.ammoResupplyMenuCache[pid])) {
        setGadgetMenuHotReadyForPid(pid, true);
    }
    // Admin panel (hidden prebuild for all players)
    prebuildAdminPanelWhileHidden(eventPlayer, pid);
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

// Runs the team-swap loading gate: waits for undeploy + team settle, then delegates to runLoadingGateUntilReady.
async function runTeamSwapLoadingGate(
    eventPlayer: mod.Player,
    pid: number,
    newTeamNum: TeamID,
    waitForUndeploy: boolean
): Promise<void> {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    const token = getHudWarmTokenForPid(pid);

    if (waitForUndeploy) {
        const undeployed = await waitForPlayerToBecomeUndeployedForTeamSwap(eventPlayer, pid, token);
        if (!undeployed) return;
    }

    const settled = await waitForPlayerTeamToSettleForSwap(eventPlayer, pid, token, newTeamNum);
    if (!settled) return;
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    if (!isHudWarmTokenCurrent(pid, token)) return;

    await runLoadingGateUntilReady(eventPlayer, pid);
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

// Reveals all critical UI families atomically once the gate releases.
// Called only from releaseLoadingGate to ensure one reveal owner.
// Production menus (ready dialog, gadget) are intentionally left hidden — player opens them.
function revealAllUiFamilies(eventPlayer: mod.Player, pid: number): void {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    renderTopLeftUiFamilyForReveal(eventPlayer, pid);
    renderVehicleSpawnerUiFamilyForReveal(eventPlayer, pid);
    armCombatHudFamilyForSchedulerReveal(eventPlayer, pid);
    twlConquestHudPrimePlayerFrame(eventPlayer);
    renderAdminUiFamilyForReveal(eventPlayer, pid);
}

// Single release owner for the unified loading gate.
// Idempotent: guarded by token and gate-active check.
// Reveals all UI, hides overlay, enables deploy. No post-deploy finalize window.
async function releaseLoadingGate(eventPlayer: mod.Player, pid: number, token: number): Promise<void> {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    if (!isHudWarmTokenCurrent(pid, token)) return;
    if (!isUiLoadGateActiveForPid(pid)) return;
    // Mark gate inactive before reveal so the ongoing loop stops reasserting the overlay.
    setUiLoadGateActiveForPid(pid, false);
    setUiLoadGateReleasedForPid(pid, true);
    // Rebuild team swap button so the label reflects the player's current team.
    const gateRefs = State.hudCache.topHudShellByPid[pid];
    if (gateRefs) buildHudTeamSwapButton(eventPlayer, pid, gateRefs);
    updateHudTeamSwapButtonVisibilityForPid(pid);
    // Clear the team-swap HUD reset flag so the combat HUD (tickets, bars, team names)
    // is no longer force-hidden by the scheduler pipeline on the deploy screen.
    State.conquest.debug.teamSwapHudResetPendingByPid[pid] = false;
    delete State.conquest.debug.engageHiddenUntilDeployByPid[pid];
    // Reveal all families at once.
    revealAllUiFamilies(eventPlayer, pid);
    conquestPhase3MarkHudDirty();
    // Hide and clear the loading overlay.
    hideJoinPromptForPlayerId(pid);
    await mod.Wait(0);
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    clearJoinPromptForPlayerId(pid);
    setUiLoadOverlayShownForPid(pid, false);
    // Clear any residual input restrictions applied during the gate.
    setAllInputRestrictionsForPlayer(eventPlayer, false);
    // Enable deploy.
    applyPlayerDeployAvailability(eventPlayer, pid, true, "gate_release");
}

// Main unified loading gate loop for both first-join and team-swap.
// Polls until all UI families are warm and stable, then enforces a minimum floor before releasing.
// A 60s hard timeout force-releases even if not all families are warm.
async function runLoadingGateUntilReady(eventPlayer: mod.Player, pid: number): Promise<void> {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    const token = invalidateHudWarmTokenForPid(pid);
    if (token === undefined) return;

    // Reset all warm milestones before the new warm pass.
    setCombatHudRevealAllowedForPid(pid, false);
    setHudWarmCompletedForPid(pid, false);
    setReadyDialogHotReadyForPid(pid, false);
    setGadgetMenuHotReadyForPid(pid, false);

    // Initial prebuild attempt (non-awaited — quick synchronous pass).
    await mod.Wait(HUD_WARM_PREBUILD_DELAY_SECONDS);
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    if (!isHudWarmTokenCurrent(pid, token)) return;

    await prebuildAllUiFamiliesHidden(eventPlayer, pid);
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    if (!isHudWarmTokenCurrent(pid, token)) return;

    let stableCount = 0;
    while (true) {
        if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
        if (!isHudWarmTokenCurrent(pid, token)) return;

        maintainPlayerLoadingGateAuthority(eventPlayer, pid);

        const elapsed = mod.GetMatchTimeElapsed() - getGateStartTimeForPid(pid);

        // Hard timeout: force-release if max wait exceeded, even if UI not fully warm.
        if (elapsed >= GATE_TIMEOUT_SECONDS) {
            setSafetyTimeoutTriggeredForPid(pid, true);
            sendHighlightedWorldLogMessage(
                mod.Message(mod.stringkeys.twl.system.uiLoadHardTimeout, Math.floor(elapsed), pid),
                true
            );
            setHudWarmCompletedForPid(pid, true);
            await releaseLoadingGate(eventPlayer, pid, token);
            return;
        }

        // Poll readiness and retry prebuild on any cold family.
        if (isAllUiFamiliesReadyForRelease(eventPlayer, pid)) {
            stableCount++;
        } else {
            stableCount = 0;
            await prebuildAllUiFamiliesHidden(eventPlayer, pid);
            if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
            if (!isHudWarmTokenCurrent(pid, token)) return;
            await mod.Wait(HUD_WARM_READY_POLL_SECONDS);
            continue;
        }

        // Stable for required polls — enforce minimum floor then release.
        if (stableCount >= HUD_WARM_READY_STABLE_POLLS) {
            if (elapsed < GATE_FLOOR_SECONDS) {
                // Floor still holding — keep polling.
            } else {
                setHudWarmCompletedForPid(pid, true);
                refreshBuiltReadyDialogCachesForAllPlayers();
                replayActiveMapValidationWarningsToPlayer(eventPlayer);
                renderReadyDialogForAllVisibleViewers();
                await releaseLoadingGate(eventPlayer, pid, token);
                return;
            }
        }

        await mod.Wait(HUD_WARM_READY_POLL_SECONDS);
    }
}

function cleanupConquestHudForTeamSwap(pid: number): void {
    // Destroy (not just hide) the combat HUD entry so the prebuild phase during the
    // loading gate creates a completely fresh widget graph for the new team context.
    // Hide-only left stale widget handles that could silently fail visibility calls.
    twlConquestHudDestroyPlayer(pid);
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
        // Unified loading gate: one entry point for team swap.
        beginLoadingGate(eventPlayer, pid, "team_swap");
        State.players.deployedByPid[pid] = false;
        resetPlayerBoundaryStateOnUndeployOrReset(pid);
        clearVehicleReservationForPid(pid);
        cleanupConquestHudForTeamSwap(pid);
        State.conquest.debug.perspectiveTeamByPid[pid] = newTeamNum;
        State.conquest.debug.teamSwapPerspectiveLockUntilByPid[pid] = mod.GetMatchTimeElapsed() + TEAM_SWAP_PERSPECTIVE_LOCK_SECONDS;
    }
    enforceHudWarmTransitionDeployBlock(eventPlayer);
    mod.SetTeam(eventPlayer, mod.GetTeam(newTeamNum));
    conquestPhase3MarkHudDirty();
    // Reassert overlay immediately after mod.SetTeam — the engine-side team assignment
    // can briefly flash native UI state, so re-pin the overlay in the same synchronous pass.
    if (pid !== undefined) reassertPlayerUiLoadingGateVisuals(eventPlayer, pid);
    if (pid !== undefined) {
        void refreshConquestHudAfterTeamSwap(eventPlayer);
        void runTeamSwapLoadingGate(eventPlayer, pid, newTeamNum, wasDeployedBeforeSwap);
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


