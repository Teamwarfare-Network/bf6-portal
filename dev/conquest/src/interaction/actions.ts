// @ts-nocheck
// Module: interaction/actions -- ready-dialog swap action and HUD refresh

//#region -------------------- Ready Dialog Interaction Actions --------------------

const TEAM_SWAP_PERSPECTIVE_LOCK_SECONDS = 0.6;
type HudLoadingWarmOptions = {
    refreshReadyDialogs?: boolean;
    createJoinPrompt?: boolean;
    joinPromptDelaySeconds?: number;
    showLoadingOverlay?: boolean;
};

const TEAM_SWAP_LOADING_UNDEPLOY_WAIT_SECONDS = 0.05;
const TEAM_SWAP_LOADING_UNDEPLOY_WAIT_ATTEMPTS = 20;
const TEAM_SWAP_LOADING_TEAM_SETTLE_SECONDS = 0.05;
const TEAM_SWAP_LOADING_TEAM_SETTLE_ATTEMPTS = 8;

function isHudLoadingGateActiveForPid(pid: number): boolean {
    return State.players.readyDialogData[pid]?.hudLoadGateActive === true;
}

function isHudWarmReadyForPid(pid: number): boolean {
    return State.players.readyDialogData[pid]?.hudWarmCompleted !== false;
}

function isHudSwapTransitionActiveForPid(pid: number): boolean {
    return State.players.readyDialogData[pid]?.hudSwapTransitionActive === true;
}

function isCombatHudRevealAllowedForPid(pid: number): boolean {
    return State.players.readyDialogData[pid]?.combatHudRevealAllowed === true;
}

function ensureHudLoadingTextWidget(
    name: string,
    player: mod.Player,
    parent: mod.UIWidget,
    textColor: mod.Vector,
    shadow: boolean
): mod.UIWidget | undefined {
    let widget = safeFind(name);
    if (!widget) {
        widget = addCenteredButtonText(
            name,
            HUD_LOADING_TEXT_WIDTH,
            HUD_LOADING_TEXT_HEIGHT,
            mod.Message(mod.stringkeys.twl.ui.loading),
            player,
            parent,
            HUD_LOADING_TEXT_SIZE
        );
    }
    if (!widget) return undefined;
    safeSetUIWidgetParent(widget, parent);
    try {
        mod.SetUIWidgetAnchor(widget, mod.UIAnchor.Center);
        mod.SetUITextAnchor(widget, mod.UIAnchor.Center);
    } catch {
        return widget;
    }
    safeSetUIWidgetPosition(
        widget,
        mod.CreateVector(
            shadow ? HUD_LOADING_TEXT_SHADOW_OFFSET_X : 0,
            shadow ? HUD_LOADING_TEXT_SHADOW_OFFSET_Y : 0,
            0
        )
    );
    safeSetUIWidgetSize(widget, mod.CreateVector(HUD_LOADING_TEXT_WIDTH, HUD_LOADING_TEXT_HEIGHT, 0));
    safeSetUIWidgetDepth(widget, mod.UIDepth.AboveGameUI);
    safeSetUITextLabel(widget, mod.Message(mod.stringkeys.twl.ui.loading));
    safeSetUITextColor(widget, textColor);
    safeSetUITextAlpha(widget, shadow ? 0.48 : 1);
    return widget;
}

function ensureHudLoadingOverlayForPlayer(player: mod.Player): void {
    if (!player || !mod.IsPlayerValid(player)) return;
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return;

    const rootId = UI_HUD_LOADING_ROOT_ID + pid;
    let root = safeFind(rootId);
    if (!root) {
        mod.AddUIContainer(
            rootId,
            mod.CreateVector(0, 0, 0),
            mod.CreateVector(HUD_LOADING_ROOT_WIDTH, HUD_LOADING_ROOT_HEIGHT, 0),
            mod.UIAnchor.Center,
            mod.GetUIRoot(),
            false,
            0,
            COLOR_DARK_BLACK,
            0,
            mod.UIBgFill.None,
            mod.UIDepth.AboveGameUI,
            player
        );
        root = safeFind(rootId);
    }
    if (!root) return;
    safeSetUIWidgetParent(root, mod.GetUIRoot());
    safeSetUIWidgetPosition(root, mod.CreateVector(0, 0, 0));
    safeSetUIWidgetSize(root, mod.CreateVector(HUD_LOADING_ROOT_WIDTH, HUD_LOADING_ROOT_HEIGHT, 0));
    safeSetUIWidgetDepth(root, mod.UIDepth.AboveGameUI);

    const plateId = UI_HUD_LOADING_PLATE_ID + pid;
    let plate = safeFind(plateId);
    if (!plate) {
        mod.AddUIContainer(
            plateId,
            mod.CreateVector(0, 0, 0),
            mod.CreateVector(HUD_LOADING_PLATE_WIDTH, HUD_LOADING_PLATE_HEIGHT, 0),
            mod.UIAnchor.Center,
            root,
            false,
            0,
            COLOR_DARK_BLACK,
            0.92,
            mod.UIBgFill.Blur,
            mod.UIDepth.AboveGameUI,
            player
        );
        plate = safeFind(plateId);
    }
    if (!plate) return;
    safeSetUIWidgetParent(plate, root);
    safeSetUIWidgetPosition(plate, mod.CreateVector(0, 0, 0));
    safeSetUIWidgetSize(plate, mod.CreateVector(HUD_LOADING_PLATE_WIDTH, HUD_LOADING_PLATE_HEIGHT, 0));
    safeSetUIWidgetBgColor(plate, COLOR_DARK_BLACK);
    safeSetUIWidgetBgAlpha(plate, 0.92);
    safeSetUIWidgetDepth(plate, mod.UIDepth.AboveGameUI);

    ensureHudLoadingTextWidget(UI_HUD_LOADING_TEXT_SHADOW_ID + pid, player, plate, COLOR_DARK_BLACK, true);
    ensureHudLoadingTextWidget(UI_HUD_LOADING_TEXT_ID + pid, player, plate, COLOR_WHITE, false);
    setHudLoadingOverlayVisibleForPid(pid, false);
}

function setHudLoadingOverlayVisibleForPid(pid: number, visible: boolean): void {
    safeSetUIWidgetVisible(safeFind(UI_HUD_LOADING_ROOT_ID + pid), visible);
    safeSetUIWidgetVisible(safeFind(UI_HUD_LOADING_PLATE_ID + pid), visible);
    safeSetUIWidgetVisible(safeFind(UI_HUD_LOADING_TEXT_SHADOW_ID + pid), visible);
    safeSetUIWidgetVisible(safeFind(UI_HUD_LOADING_TEXT_ID + pid), visible);
    if (State.players.readyDialogData[pid]) {
        State.players.readyDialogData[pid].hudLoadingVisible = visible;
    }
}

function enforceHudLoadingDeployBlock(eventPlayer: mod.Player): void {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    setUIInputModeForPlayer(eventPlayer, false);
    mod.EnablePlayerDeploy(eventPlayer, false);
    mod.SetRedeployTime(eventPlayer, HUD_LOADING_REDEPLOY_BLOCK_SECONDS);
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
    mod.SetRedeployTime(
        eventPlayer,
        canEnableDeploy ? 0 : (isHudLoadingGateActiveForPid(pid) ? HUD_LOADING_REDEPLOY_BLOCK_SECONDS : 0)
    );
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

function forceHideLegacyCombatHudWidgetsForPid(pid: number): void {
    try {
        const refs = State.hudCache.hudByPid[pid] ?? ({ pid, roots: [] } as HudRefs);
        conquestPhase3ForceHideAllV2Widgets(refs);
    } catch {}
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
        warmCacheVehicleDeployTimerHudForPlayer(eventPlayer);
        conquestPhase5BRenderVehicleDeployTimersForPlayer(eventPlayer, false);
    } catch {}
}

function prebuildCombatHudFamilyWhileHidden(eventPlayer: mod.Player, pid: number): void {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    try {
        forceHideLegacyCombatHudWidgetsForPid(pid);
        const entry = twlConquestHudEnsurePlayerGraph(eventPlayer);
        if (!entry || !entry.initialized) return;
        twlConquestHudHidePlayer(pid);
    } catch {}
}

function prebuildReadyDialogUiFamilyWhileHidden(eventPlayer: mod.Player, pid: number): void {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    try {
        const readyData = State.players.readyDialogData[pid];
        if (readyData && !readyData.uiBuilt && !readyData.dialogVisible) {
            createReadyDialogUI(eventPlayer, false);
        }
    } catch {}
}

function prebuildAdminUiFamilyWhileHidden(_eventPlayer: mod.Player, _pid: number): void {
    // Admin panel contents remain lazy-built; the top-right admin counter is constructed with the top-left shell.
}

function prebuildCriticalHudWhileHidden(eventPlayer: mod.Player, pid: number): void {
    prebuildTopLeftUiFamilyWhileHidden(eventPlayer, pid);
    prebuildVehicleSpawnerUiFamilyWhileHidden(eventPlayer, pid);
    prebuildCombatHudFamilyWhileHidden(eventPlayer, pid);
}

function prebuildDeferredUiWhileHidden(eventPlayer: mod.Player, pid: number): void {
    prebuildReadyDialogUiFamilyWhileHidden(eventPlayer, pid);
    prebuildAdminUiFamilyWhileHidden(eventPlayer, pid);
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

function renderVehicleSpawnerUiFamilyForReveal(eventPlayer: mod.Player, pid: number): void {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    const revealVehicleHud = conquestPhase5BRenderVehicleDeployTimersForPlayer(eventPlayer, false);
    const vehicleCache = State.hudCache.vehicleDeployTimerCache[pid];
    setVehicleDeployTimerRootOnscreen(vehicleCache, revealVehicleHud);
    safeSetUIWidgetVisible(vehicleCache?.root, revealVehicleHud);
    if (vehicleCache) vehicleCache.lastVisibleState = revealVehicleHud;
}

function armCombatHudFamilyForSchedulerReveal(eventPlayer: mod.Player, pid: number): void {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    forceHideLegacyCombatHudWidgetsForPid(pid);
    const entry = twlConquestHudEnsurePlayerGraph(eventPlayer);
    if (!entry || !entry.initialized) return;
    twlConquestHudHidePlayer(pid);
    entry.pendingFirstReveal = true;
    if (State.players.readyDialogData[pid]) {
        State.players.readyDialogData[pid].combatHudRevealAllowed = true;
    }
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
    const widgetIds = [
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
    for (const widgetId of widgetIds) {
        safeSetUIWidgetVisible(safeFind(widgetId), visible);
    }
}

function hideTopHudFamilyForLoadingGate(pid: number): void {
    const refs = getTopHudShellRefsForPid(pid);
    safeSetUIWidgetVisible(refs?.topCenterAuxRoot, false);
    safeSetUIWidgetVisible(refs?.helpTextContainer, false);
    safeSetUIWidgetVisible(refs?.adminPanelActionCountText, false);
    safeSetUIWidgetVisible(refs?.victoryRoot, false);

    const clockCache = State.hudCache.clockWidgetCache[pid];
    if (clockCache) {
        safeSetUIWidgetVisible(clockCache.root, false);
        safeSetUIWidgetVisible(clockCache.plate, false);
        safeSetUIWidgetVisible(clockCache.minTensShadow, false);
        safeSetUIWidgetVisible(clockCache.minTens, false);
        safeSetUIWidgetVisible(clockCache.minOnesShadow, false);
        safeSetUIWidgetVisible(clockCache.minOnes, false);
        safeSetUIWidgetVisible(clockCache.colonShadow, false);
        safeSetUIWidgetVisible(clockCache.colon, false);
        safeSetUIWidgetVisible(clockCache.secTensShadow, false);
        safeSetUIWidgetVisible(clockCache.secTens, false);
        safeSetUIWidgetVisible(clockCache.secOnesShadow, false);
        safeSetUIWidgetVisible(clockCache.secOnes, false);
        clockCache.lastVisibleState = false;
    }
}

function renderCriticalHudForReveal(eventPlayer: mod.Player, pid: number): void {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    if (isHudSwapTransitionActiveForPid(pid) || !isHudWarmReadyForPid(pid)) {
        hideCriticalHudForLoadingGate(pid);
        return;
    }
    renderTopLeftUiFamilyForReveal(eventPlayer, pid);
    renderVehicleSpawnerUiFamilyForReveal(eventPlayer, pid);
    armCombatHudFamilyForSchedulerReveal(eventPlayer, pid);
    twlConquestHudPrimePlayerFrame(eventPlayer);
    renderAdminUiFamilyForReveal(eventPlayer, pid);
}

function primeHudLoadingOverlayForPlayer(eventPlayer: mod.Player): void {
    // Loading overlay removed. Keep function as a no-op to avoid wider call-site churn.
    return;
}

async function waitForPlayerToBecomeUndeployedForTeamSwap(
    eventPlayer: mod.Player,
    pid: number,
    token: number
): Promise<boolean> {
    for (let i = 0; i < TEAM_SWAP_LOADING_UNDEPLOY_WAIT_ATTEMPTS; i++) {
        if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return false;
        if ((State.players.readyDialogData[pid]?.hudLoadToken ?? 0) !== token) return false;
        if (!State.players.deployedByPid[pid]) return true;
        enforceHudLoadingDeployBlock(eventPlayer);
        setHudLoadingOverlayVisibleForPid(pid, true);
        hideCriticalHudForLoadingGate(pid);
        await mod.Wait(TEAM_SWAP_LOADING_UNDEPLOY_WAIT_SECONDS);
    }
    return !State.players.deployedByPid[pid];
}

async function waitForPlayerTeamToSettleForSwap(
    eventPlayer: mod.Player,
    pid: number,
    token: number,
    newTeamNum: TeamID
): Promise<boolean> {
    for (let i = 0; i < TEAM_SWAP_LOADING_TEAM_SETTLE_ATTEMPTS; i++) {
        if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return false;
        if ((State.players.readyDialogData[pid]?.hudLoadToken ?? 0) !== token) return false;
        if (safeGetTeamNumberFromPlayer(eventPlayer, 0) === newTeamNum) return true;
        enforceHudLoadingDeployBlock(eventPlayer);
        setHudLoadingOverlayVisibleForPid(pid, true);
        hideCriticalHudForLoadingGate(pid);
        await mod.Wait(TEAM_SWAP_LOADING_TEAM_SETTLE_SECONDS);
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
    if ((State.players.readyDialogData[pid]?.hudLoadToken ?? 0) !== token) return;

    await warmCriticalHudForPlayer(eventPlayer, {
        createJoinPrompt: false,
        joinPromptDelaySeconds: 0,
        showLoadingOverlay: true,
    });

    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    const latestState = State.players.readyDialogData[pid];
    if (!latestState) return;
    if ((latestState.hudLoadToken ?? 0) !== token + 1 && (latestState.hudLoadToken ?? 0) !== token) {
        // warmCriticalHudForPlayer owns the next token; any other change invalidates this swap controller.
        return;
    }
    syncPlayerDeployAvailability(eventPlayer);
}

function hideCriticalHudForLoadingGate(pid: number, preserveVehicleRows: boolean = false): void {
    if (State.players.readyDialogData[pid]) {
        State.players.readyDialogData[pid].combatHudRevealAllowed = false;
    }
    forceHideLegacyCombatHudWidgetsForPid(pid);
    twlConquestHudHideRootOnly(pid);
    clearJoinPromptForPlayerId(pid);
    hideTopHudFamilyForLoadingGate(pid);
    setPositionDebugWidgetsVisibleForPid(pid, false);

    const vehicleCache = State.hudCache.vehicleDeployTimerCache[pid];
    if (vehicleCache?.root) {
        safeSetUIWidgetVisible(vehicleCache.root, false);
        vehicleCache.lastVisibleState = false;
    }
    if (vehicleCache?.rows) {
        for (let i = 0; i < vehicleCache.rows.length; i++) {
            setVehicleDeployTimerRowVisible(vehicleCache.rows[i], false);
        }
    }

    safeSetUIWidgetVisible(safeFind(`Container_HelpText_${pid}`), false);
    safeSetUIWidgetVisible(safeFind(`HelpText_${pid}`), false);
}

function releaseHudLoadingGateForPlayer(eventPlayer: mod.Player, token: number): void {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    const pid = safeGetPlayerId(eventPlayer);
    if (pid === undefined) return;
    const state = State.players.readyDialogData[pid];
    if (!state) return;
    if ((state.hudLoadToken ?? 0) !== token) return;

    state.hudLoadGateActive = false;
    state.hudLoadStartedAtSeconds = 0;
    state.hudLoadingVisible = false;
    state.hudSwapTransitionActive = false;

    renderCriticalHudForReveal(eventPlayer, pid);
    syncPlayerDeployAvailability(eventPlayer);
    void prebuildDeferredUiAfterReveal(eventPlayer, pid, token);
}

async function prebuildDeferredUiAfterReveal(eventPlayer: mod.Player, pid: number, token: number): Promise<void> {
    await mod.Wait(0);
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    if ((State.players.readyDialogData[pid]?.hudLoadToken ?? 0) !== token) return;
    prebuildDeferredUiWhileHidden(eventPlayer, pid);
}

async function warmCriticalHudForPlayer(
    eventPlayer: mod.Player,
    options?: HudLoadingWarmOptions
): Promise<void> {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    const pid = safeGetPlayerId(eventPlayer);
    if (pid === undefined) return;
    if (!State.players.readyDialogData[pid]) initReadyDialogData(eventPlayer);
    const state = State.players.readyDialogData[pid];
    if (!state) return;

    const token = (state.hudLoadToken ?? 0) + 1;
    state.hudLoadToken = token;
    state.hudForceLoadingOnNextWarm = false;
    state.hudLoadGateActive = state.hudSwapTransitionActive === true;
    state.combatHudRevealAllowed = false;
    state.hudLoadingVisible = false;
    state.hudLoadStartedAtSeconds = 0;
    setHudLoadingOverlayVisibleForPid(pid, false);
    if (state.hudWarmCompleted !== true) {
        state.hudWarmCompleted = false;
        hideCriticalHudForLoadingGate(pid);
    }

    await mod.Wait(HUD_LOADING_OVERLAY_PREWARM_DELAY_SECONDS);
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    if ((State.players.readyDialogData[pid]?.hudLoadToken ?? 0) !== token) return;

    let readyStablePolls = 0;
    const readyDeadline = mod.GetMatchTimeElapsed() + HUD_LOADING_READY_TIMEOUT_SECONDS;
    while (true) {
        if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
        if ((State.players.readyDialogData[pid]?.hudLoadToken ?? 0) !== token) return;

        prebuildCriticalHudWhileHidden(eventPlayer, pid);
        if (!state.hudWarmCompleted) {
            hideCriticalHudForLoadingGate(pid, true);
        }

        if (isCriticalHudReadyForPlayer(eventPlayer, pid)) readyStablePolls += 1;
        else readyStablePolls = 0;

        const timedOut = mod.GetMatchTimeElapsed() >= readyDeadline;
        if (readyStablePolls >= HUD_LOADING_READY_STABLE_POLLS || timedOut) {
            break;
        }

        await mod.Wait(HUD_LOADING_READY_POLL_SECONDS);
    }

    if ((State.players.readyDialogData[pid]?.hudLoadToken ?? 0) !== token) return;

    state.hudWarmCompleted = true;
    if (options?.refreshReadyDialogs) {
        renderReadyDialogForAllVisibleViewers();
    }
    releaseHudLoadingGateForPlayer(eventPlayer, token);

    if (
        options?.createJoinPrompt
        && !State.players.deployedByPid[pid]
        && shouldShowJoinPromptForPlayer(eventPlayer)
    ) {
        const delaySeconds = options.joinPromptDelaySeconds ?? 0;
        if (delaySeconds > 0) {
            await mod.Wait(delaySeconds);
            if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
            if ((State.players.readyDialogData[pid]?.hudLoadToken ?? 0) !== token) return;
            if (State.players.deployedByPid[pid]) return;
        }
        createJoinPromptForPlayer(eventPlayer);
    }
}

// Performs the authoritative conquest HUD reset for one player before team-swap redraw.
// Contract: hide -> destroy -> delayed rebuild -> resume updates after deploy release.
function cleanupConquestHudForTeamSwap(pid: number): void {
    // Core-mode swap reset stays non-destructive to avoid long blocking delete passes.
    twlConquestHudHidePlayer(pid);
    delete State.conquest.capture.engagedObjIdByPid[pid];
    conquestPhase4OnPlayerLeaveOrResetPid(pid);
    conquestPhase4BOnPlayerLeaveOrResetPid(pid);
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
    const wasDeployedBeforeSwap = pid !== undefined ? !!State.players.deployedByPid[pid] : false;
    if (pid !== undefined) {
        const readyData = State.players.readyDialogData[pid];
        if (readyData) {
            readyData.hudSwapTransitionActive = true;
            readyData.hudWarmCompleted = false;
            readyData.hudLoadGateActive = true;
            readyData.hudLoadToken = (readyData.hudLoadToken ?? 0) + 1;
        }
        // Treat swap as immediately undeployed for HUD authority until the engine undeploy callback lands.
        State.players.deployedByPid[pid] = false;
        clearVehicleReservationForPid(pid);
        const vehicleCache = State.hudCache.vehicleDeployTimerCache[pid];
        if (vehicleCache?.root) {
            setVehicleDeployTimerRootOnscreen(vehicleCache, false);
            safeSetUIWidgetVisible(vehicleCache.root, false);
            vehicleCache.lastVisibleState = false;
            for (let i = 0; i < vehicleCache.rows.length; i++) {
                setVehicleDeployTimerRowVisible(vehicleCache.rows[i], false);
            }
        }
        setPositionDebugWidgetsVisibleForPid(pid, false);
        // Force one clean conquest HUD reset (destructive) after swap to prevent stale overlays/duplicates.
        cleanupConquestHudForTeamSwap(pid);
        // Pre-seed swap perspective so post-SetTeam transient reads cannot repaint as Team1 fallback.
        State.conquest.debug.perspectiveTeamByPid[pid] = newTeamNum;
        // Hold perspective to the target team briefly so redraw cannot sample stale pre-swap engine team for one frame.
        State.conquest.debug.teamSwapPerspectiveLockUntilByPid[pid] = mod.GetMatchTimeElapsed() + TEAM_SWAP_PERSPECTIVE_LOCK_SECONDS;
        hideCriticalHudForLoadingGate(pid);
    }
    enforceHudLoadingDeployBlock(eventPlayer);
    mod.SetTeam(eventPlayer, mod.GetTeam(newTeamNum));
    // Single redraw strategy:
    // - mark dirty now
    // - let the delayed settle pass perform one authoritative rebuild/draw
    // This avoids swap-time duplicate repaint churn.
    conquestPhase3MarkHudDirty();
    if (pid !== undefined) {
        void refreshConquestHudAfterTeamSwap(eventPlayer);
        void runTeamSwapHudWarmController(
            eventPlayer,
            pid,
            State.players.readyDialogData[pid]?.hudLoadToken ?? 0,
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

    // Admin panel contents stay lazy-built and are deleted on close; the toggle stays cached with the dialog.
    deleteAdminPanelUI(playerId, false);
    setAdminPanelChildWidgetsVisible(playerId, false);
    const adminToggle = safeFind(UI_ADMIN_PANEL_BUTTON_ID + playerId);
    if (adminToggle) mod.SetUIWidgetVisible(adminToggle, false);
    const adminToggleLabel = safeFind(UI_ADMIN_PANEL_BUTTON_LABEL_ID + playerId);
    if (adminToggleLabel) mod.SetUIWidgetVisible(adminToggleLabel, false);
    const adminToggleBorder = safeFind(UI_ADMIN_PANEL_BUTTON_ID + playerId + "_BORDER");
    if (adminToggleBorder) mod.SetUIWidgetVisible(adminToggleBorder, false);

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
    const posXValue = safeFind(UI_POS_DEBUG_X_VALUE_ID + playerId);
    if (posXValue) mod.DeleteUIWidget(posXValue);
    const posYValue = safeFind(UI_POS_DEBUG_Y_VALUE_ID + playerId);
    if (posYValue) mod.DeleteUIWidget(posYValue);
    const posZValue = safeFind(UI_POS_DEBUG_Z_VALUE_ID + playerId);
    if (posZValue) mod.DeleteUIWidget(posZValue);
    const rotX = safeFind(UI_POS_DEBUG_ROTX_ID + playerId);
    if (rotX) mod.DeleteUIWidget(rotX);
    const rotY = safeFind(UI_POS_DEBUG_ROTY_ID + playerId);
    if (rotY) mod.DeleteUIWidget(rotY);
    const rotZ = safeFind(UI_POS_DEBUG_ROTZ_ID + playerId);
    if (rotZ) mod.DeleteUIWidget(rotZ);
    const rotXValue = safeFind(UI_POS_DEBUG_ROTX_VALUE_ID + playerId);
    if (rotXValue) mod.DeleteUIWidget(rotXValue);
    const rotYValue = safeFind(UI_POS_DEBUG_ROTY_VALUE_ID + playerId);
    if (rotYValue) mod.DeleteUIWidget(rotYValue);
    const rotZValue = safeFind(UI_POS_DEBUG_ROTZ_VALUE_ID + playerId);
    if (rotZValue) mod.DeleteUIWidget(rotZValue);
}

//#endregion ----------------- Ready Dialog Interaction Actions --------------------
