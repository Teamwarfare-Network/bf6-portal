// @ts-nocheck
// Module: interaction/hud-warm-state -- per-player HUD warm/reveal state accessors and signature reset helpers

//#region -------------------- HUD Warm State --------------------

// Returns the per-player ready-dialog runtime state bag when it exists.
function getReadyDialogStateForPid(pid: number): readyDialogData_t | undefined {
    return State.players.readyDialogData[pid];
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
    state.readyDialogWarmPrimed = false;
    state.readyDialogHotReady = false;
    state.gadgetMenuHotReady = false;
    state.gateStartTime = 0;
    state.safetyFloorTriggered = false;
    state.safetyTimeoutTriggered = false;
    return state.uiLoadSessionId;
}

// Records one deploy-availability transition for the current loading session.
function recordUiLoadDeployEnabledForPid(pid: number, enabled: boolean): void {
    const state = getReadyDialogStateForPid(pid);
    if (!state) return;
    state.uiLoadDeployEnabled = enabled;
}

// Returns true only after a specific lifecycle owner has explicitly authorized deploy release for this player.
function isUiLoadDeployAuthorizedForPid(pid: number): boolean {
    return getReadyDialogStateForPid(pid)?.uiLoadDeployAuthorized === true;
}

// Records one input-restriction transition for the current loading session.
function recordUiLoadInputRestrictedForPid(pid: number, restricted: boolean): void {
    const state = getReadyDialogStateForPid(pid);
    if (!state) return;
    state.uiLoadInputRestricted = restricted;
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
// Returns true on missing state (no state = no gate active) so HUD rendering is not unnecessarily gated.
function isHudWarmReadyForPid(pid: number): boolean {
    return getReadyDialogStateForPid(pid)?.hudWarmCompleted !== false;
}

// Returns true while a team-swap gate is actively blocking this player.
// In the new design: team-swap state is gate active AND reason is team_swap.
function isHudSwapTransitionActiveForPid(pid: number): boolean {
    const state = getReadyDialogStateForPid(pid);
    return state?.uiLoadGateActive === true && state?.uiLoadReason === "team_swap";
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

// Returns true while deploy/UI should remain blocked for the player's active loading gate.
// In the new unified gate design: blocking iff the gate is active or has not yet released once.
function isHudTransitionBlockingForPid(pid: number): boolean {
    return isUiLoadGateActiveForPid(pid) || !isUiLoadGateReleasedForPid(pid);
}

// Returns true while production interactions (interact points, menus, vehicles) should stay blocked.
// In the new design there is no post-deploy finalize window, so this is equivalent to the gate check.
function isUiInteractionBlockedForPid(pid: number): boolean {
    return isUiLoadGateActiveForPid(pid) || !isUiLoadGateReleasedForPid(pid);
}

// Returns true when the combat HUD scheduler may reveal the combat family for the player.
function isCombatHudRevealAllowedForPid(pid: number): boolean {
    return getReadyDialogStateForPid(pid)?.combatHudRevealAllowed === true;
}

// Records the match elapsed time when a loading gate session begins so the warm loop can compute elapsed time.
function setGateStartTimeForPid(pid: number, time: number): void {
    const state = getReadyDialogStateForPid(pid);
    if (!state) return;
    state.gateStartTime = time;
}

// Returns the match elapsed time at which the current gate session started (0 if not set).
function getGateStartTimeForPid(pid: number): number {
    return getReadyDialogStateForPid(pid)?.gateStartTime ?? 0;
}

// Marks that the safety floor held release beyond the readiness-ready point for this session.
function setSafetyFloorTriggeredForPid(pid: number, triggered: boolean): void {
    const state = getReadyDialogStateForPid(pid);
    if (!state) return;
    state.safetyFloorTriggered = triggered;
}

// Returns true if the safety floor held the gate beyond when UI was already warm this session.
function isSafetyFloorTriggeredForPid(pid: number): boolean {
    return getReadyDialogStateForPid(pid)?.safetyFloorTriggered === true;
}

// Marks that the safety timeout forced release before UI was fully warm this session.
function setSafetyTimeoutTriggeredForPid(pid: number, triggered: boolean): void {
    const state = getReadyDialogStateForPid(pid);
    if (!state) return;
    state.safetyTimeoutTriggered = triggered;
}

// Returns true if the safety timeout force-released the gate this session.
function isSafetyTimeoutTriggeredForPid(pid: number): boolean {
    return getReadyDialogStateForPid(pid)?.safetyTimeoutTriggered === true;
}

//#endregion ----------------- HUD Warm State --------------------

