// @ts-nocheck
// Module: interaction/hud-warm-state -- per-player HUD warm/reveal state accessors and signature reset helpers

//#region -------------------- HUD Warm State --------------------

const UI_LOAD_TRACE_MAX_ENTRIES = 24;

// Returns the per-player ready-dialog runtime state bag when it exists.
function getReadyDialogStateForPid(pid: number): readyDialogData_t | undefined {
    return State.players.readyDialogData[pid];
}

// Encodes projected loading-trace events as compact numeric IDs so first-join deploy races can be inspected without adding new strings.
function getUiLoadTraceEventDebugCode(eventCode: string): number {
    if (eventCode === "JOIN_BEGIN") return 1;
    if (eventCode === "OVERLAY_ON") return 2;
    if (eventCode.startsWith("LOAD_BEGIN:")) return 3;
    if (eventCode.startsWith("DEPLOY_OFF:")) return 4;
    if (eventCode.startsWith("DEPLOY_ON:")) return 5;
    if (eventCode === "DEPLOY_EVT") return 6;
    if (eventCode === "DEPLOY_EARLY") return 7;
    if (eventCode.startsWith("INPUT_ON:")) return 8;
    if (eventCode.startsWith("INPUT_OFF:")) return 9;
    if (eventCode.startsWith("UNDEPLOY_TRY:")) return 10;
    if (eventCode === "UNDEPLOY_EVT") return 11;
    if (eventCode === "READY_OK") return 12;
    if (eventCode === "READY_TIMEOUT") return 13;
    if (eventCode === "REVEAL_OK") return 14;
    if (eventCode === "GATE_RELEASE") return 15;
    if (eventCode === "JOIN_RELEASE") return 16;
    if (eventCode === "DEPLOY_ACCEPT") return 17;
    if (eventCode === "JOIN_AUTHORIZE") return 18;
    return 0;
}

// Advances the warm token so any in-flight warm/reveal work is invalidated.
function invalidateHudWarmTokenForPid(pid: number): number | undefined {
    const state = getReadyDialogStateForPid(pid);
    if (!state) return undefined;
    state.hudWarmToken = (state.hudWarmToken ?? 0) + 1;
    return state.hudWarmToken;
}

// Returns the current warm token for one player, normalizing missing state to zero for guard checks.
function getHudWarmTokenForPid(pid: number): number {
    return getReadyDialogStateForPid(pid)?.hudWarmToken ?? 0;
}

// Returns true only while the caller still owns the current warm/reveal pass for this player.
function isHudWarmTokenCurrent(pid: number, token: number): boolean {
    return getHudWarmTokenForPid(pid) === token;
}

// Marks whether the player's critical HUD family is considered warm-ready.
function setHudWarmCompletedForPid(pid: number, completed: boolean): void {
    const state = getReadyDialogStateForPid(pid);
    if (!state) return;
    state.hudWarmCompleted = completed;
}

// Marks whether the player's team-swap transition is actively blocking reveal/deploy.
function setHudSwapTransitionActiveForPid(pid: number, active: boolean): void {
    const state = getReadyDialogStateForPid(pid);
    if (!state) return;
    state.hudSwapTransitionActive = active;
}

// Marks whether the combat HUD scheduler is allowed to reveal the combat family.
function setCombatHudRevealAllowedForPid(pid: number, allowed: boolean): void {
    const state = getReadyDialogStateForPid(pid);
    if (!state) return;
    state.combatHudRevealAllowed = allowed;
}

// Marks whether the player's loading gate is actively blocking deploy and production menu use.
function setUiLoadGateActiveForPid(pid: number, active: boolean): void {
    const state = getReadyDialogStateForPid(pid);
    if (!state) return;
    state.uiLoadGateActive = active;
}

// Marks whether the player's loading gate has released gameplay and menu interaction.
function setUiLoadGateReleasedForPid(pid: number, released: boolean): void {
    const state = getReadyDialogStateForPid(pid);
    if (!state) return;
    state.uiLoadGateReleased = released;
}

// Marks whether deploy is explicitly authorized for this player independent of broader loading-gate state.
function setUiLoadDeployAuthorizedForPid(pid: number, authorized: boolean): void {
    const state = getReadyDialogStateForPid(pid);
    if (!state) return;
    state.uiLoadDeployAuthorized = authorized;
}

// Starts a new loading session for one player and resets all readiness milestones owned by that session.
function beginUiLoadSessionForPid(pid: number, reason: UiLoadReason): number | undefined {
    const state = getReadyDialogStateForPid(pid);
    if (!state) return undefined;
    state.uiLoadSessionId = (state.uiLoadSessionId ?? 0) + 1;
    state.uiLoadReason = reason;
    state.uiLoadGateActive = true;
    state.uiLoadGateReleased = false;
    state.uiLoadOverlayShown = false;
    state.uiCriticalRevealCompleted = false;
    state.uiProductionMenusWarm = false;
    state.uiPostDeployFinalizeActive = false;
    state.uiJoinDeployLockActive = reason === "join";
    state.uiSlipUndeployLastAttemptAt = -1;
    state.uiLoadDeployEnabled = false;
    state.uiLoadDeployAuthorized = false;
    state.uiLoadInputRestricted = false;
    state.uiLoadLastEventDebugCode = 0;
    state.readyDialogWarmPrimed = false;
    state.readyDialogHotReady = false;
    state.gadgetMenuHotReady = false;
    return state.uiLoadSessionId;
}

// Resets the compact first-join loading trace so the next audit starts from a clean per-player history.
function resetUiLoadTraceForPid(pid: number): void {
    const state = getReadyDialogStateForPid(pid);
    if (!state) return;
    state.uiLoadLastEventDebugCode = 0;
    state.uiLoadTrace = [];
    syncUiLoadDebugPanelForPid(pid);
}

// Appends one compact loading-trace snapshot so first-join deploy races can be inspected without adding player-facing UI strings.
function pushUiLoadTraceForPid(pid: number, eventCode: string): void {
    const state = getReadyDialogStateForPid(pid);
    if (!state) return;

    const trace = state.uiLoadTrace ?? [];
    const reason = state.uiLoadReason ?? "refresh";
    const stamp = Math.floor(mod.GetMatchTimeElapsed() * 100) / 100;
    trace.push(
        `${stamp}|${eventCode}|s${state.uiLoadSessionId}|r${reason}|a${state.uiLoadGateActive ? 1 : 0}|u${state.uiLoadGateReleased ? 1 : 0}|d${state.uiLoadDeployEnabled ? 1 : 0}|z${state.uiLoadDeployAuthorized ? 1 : 0}|o${state.uiLoadOverlayShown ? 1 : 0}|i${state.uiLoadInputRestricted ? 1 : 0}`
    );
    while (trace.length > UI_LOAD_TRACE_MAX_ENTRIES) trace.shift();
    state.uiLoadLastEventDebugCode = getUiLoadTraceEventDebugCode(eventCode);
    state.uiLoadTrace = trace;
    syncUiLoadDebugPanelForPid(pid);
}

// Records one deploy-availability transition for the current loading session so early re-enable paths are visible in traces.
function recordUiLoadDeployEnabledForPid(pid: number, enabled: boolean, source: string): void {
    const state = getReadyDialogStateForPid(pid);
    if (!state) return;
    if (state.uiLoadDeployEnabled === enabled && source !== "join_begin") return;
    state.uiLoadDeployEnabled = enabled;
    pushUiLoadTraceForPid(pid, `${enabled ? "DEPLOY_ON" : "DEPLOY_OFF"}:${source}`);
}

// Returns true only after a specific lifecycle owner has explicitly authorized deploy release for this player.
function isUiLoadDeployAuthorizedForPid(pid: number): boolean {
    return getReadyDialogStateForPid(pid)?.uiLoadDeployAuthorized === true;
}

// Records one input-restriction transition for the current loading session so post-deploy freeze ownership is observable.
function recordUiLoadInputRestrictedForPid(pid: number, restricted: boolean, source: string): void {
    const state = getReadyDialogStateForPid(pid);
    if (!state) return;
    if (state.uiLoadInputRestricted === restricted && source !== "join_begin") return;
    state.uiLoadInputRestricted = restricted;
    pushUiLoadTraceForPid(pid, `${restricted ? "INPUT_ON" : "INPUT_OFF"}:${source}`);
}

// Marks whether the current loading session has successfully shown its overlay.
function setUiLoadOverlayShownForPid(pid: number, shown: boolean): void {
    const state = getReadyDialogStateForPid(pid);
    if (!state) return;
    state.uiLoadOverlayShown = shown;
}

// Marks whether the current loading session has completed the player-visible critical reveal phase.
function setUiCriticalRevealCompletedForPid(pid: number, completed: boolean): void {
    const state = getReadyDialogStateForPid(pid);
    if (!state) return;
    state.uiCriticalRevealCompleted = completed;
}

// Marks whether hidden production-menu warm is complete for the current loading session.
function setUiProductionMenusWarmForPid(pid: number, warm: boolean): void {
    const state = getReadyDialogStateForPid(pid);
    if (!state) return;
    state.uiProductionMenusWarm = warm;
}

// Marks whether the player is still in the post-deploy finalize window where interaction should remain blocked.
function setUiPostDeployFinalizeActiveForPid(pid: number, active: boolean): void {
    const state = getReadyDialogStateForPid(pid);
    if (!state) return;
    state.uiPostDeployFinalizeActive = active;
}

// Marks whether first join still owns deploy through a dedicated lock that generic warm helpers may not clear.
function setUiJoinDeployLockActiveForPid(pid: number, active: boolean): void {
    const state = getReadyDialogStateForPid(pid);
    if (!state) return;
    state.uiJoinDeployLockActive = active;
}

// Marks whether the ready-dialog first-open path has been primed for the current loading session.
function setReadyDialogHotReadyForPid(pid: number, ready: boolean): void {
    const state = getReadyDialogStateForPid(pid);
    if (!state) return;
    state.readyDialogHotReady = ready;
}

// Marks whether the gadget-menu first-open path has been primed for the current loading session.
function setGadgetMenuHotReadyForPid(pid: number, ready: boolean): void {
    const state = getReadyDialogStateForPid(pid);
    if (!state) return;
    state.gadgetMenuHotReady = ready;
}

// Clears cached ready-dialog section signatures so the next refresh cannot early-out on stale content.
function resetReadyDialogSectionSignaturesForPid(pid: number): void {
    const state = getReadyDialogStateForPid(pid);
    if (!state) return;
    state.lastButtonSignature = "";
    state.lastRosterSignature = "";
    state.lastModeConfigSignature = "";
    state.lastMapSignature = "";
}

// Returns true once the player's critical HUD family has completed its hidden warm build.
function isHudWarmReadyForPid(pid: number): boolean {
    return getReadyDialogStateForPid(pid)?.hudWarmCompleted !== false;
}

// Returns true while the player's team-swap warm/reveal transition is still active.
function isHudSwapTransitionActiveForPid(pid: number): boolean {
    return getReadyDialogStateForPid(pid)?.hudSwapTransitionActive === true;
}

// Returns true while the player's loading gate is still actively blocking release.
function isUiLoadGateActiveForPid(pid: number): boolean {
    return getReadyDialogStateForPid(pid)?.uiLoadGateActive === true;
}

// Returns true after the player's loading gate has released deploy and production menu interaction.
function isUiLoadGateReleasedForPid(pid: number): boolean {
    return getReadyDialogStateForPid(pid)?.uiLoadGateReleased === true;
}

// Returns true after the loading overlay has been shown at least once for the current loading session.
function isUiLoadOverlayShownForPid(pid: number): boolean {
    return getReadyDialogStateForPid(pid)?.uiLoadOverlayShown === true;
}

// Returns true once the player-visible critical reveal phase completed for the current loading session.
function isUiCriticalRevealCompletedForPid(pid: number): boolean {
    return getReadyDialogStateForPid(pid)?.uiCriticalRevealCompleted === true;
}

// Returns true once the hidden production-menu warm milestones completed for the current loading session.
function isUiProductionMenusWarmForPid(pid: number): boolean {
    return getReadyDialogStateForPid(pid)?.uiProductionMenusWarm === true;
}

// Returns true while the deployed player is still in the final interaction-blocked settle window after spawn.
function isUiPostDeployFinalizeActiveForPid(pid: number): boolean {
    return getReadyDialogStateForPid(pid)?.uiPostDeployFinalizeActive === true;
}

// Returns true while first join still owns deploy authority through the explicit join lock.
function isUiJoinDeployLockActiveForPid(pid: number): boolean {
    return getReadyDialogStateForPid(pid)?.uiJoinDeployLockActive === true;
}

// Returns true once the ready-dialog first-open path is considered hot for the current loading session.
function isReadyDialogHotReadyForPid(pid: number): boolean {
    return getReadyDialogStateForPid(pid)?.readyDialogHotReady === true;
}

// Returns true once the gadget-menu first-open path is considered hot for the current loading session.
function isGadgetMenuHotReadyForPid(pid: number): boolean {
    return getReadyDialogStateForPid(pid)?.gadgetMenuHotReady === true;
}

// Returns true while deploy/UI should remain blocked for the player's active HUD or loading transition.
function isHudTransitionBlockingForPid(pid: number): boolean {
    return isHudSwapTransitionActiveForPid(pid)
        || isUiJoinDeployLockActiveForPid(pid)
        || isUiLoadGateActiveForPid(pid)
        || !isUiLoadGateReleasedForPid(pid)
        || !isUiLoadDeployAuthorizedForPid(pid);
}

// Returns true while production interactions should stay blocked, including the brief post-deploy finalize window.
function isUiInteractionBlockedForPid(pid: number): boolean {
    return isHudTransitionBlockingForPid(pid) || isUiPostDeployFinalizeActiveForPid(pid);
}

// Returns true when the combat HUD scheduler may reveal the combat family for the player.
function isCombatHudRevealAllowedForPid(pid: number): boolean {
    return getReadyDialogStateForPid(pid)?.combatHudRevealAllowed === true;
}

//#endregion ----------------- HUD Warm State --------------------

