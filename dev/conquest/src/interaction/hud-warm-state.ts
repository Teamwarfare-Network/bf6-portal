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

// Returns true while deploy/UI should remain blocked for the player's active HUD transition.
function isHudTransitionBlockingForPid(pid: number): boolean {
    return isHudSwapTransitionActiveForPid(pid) || !isHudWarmReadyForPid(pid);
}

// Returns true when the combat HUD scheduler may reveal the combat family for the player.
function isCombatHudRevealAllowedForPid(pid: number): boolean {
    return getReadyDialogStateForPid(pid)?.combatHudRevealAllowed === true;
}

//#endregion ----------------- HUD Warm State --------------------
