// @ts-nocheck
// Module: interaction/hud-warm-state -- per-player ready-dialog state accessor + combat-HUD reveal flag
//
// Wave 3 Ship 8 (v1.418): the loading-gate machinery was deleted. Most of the legacy accessors
// in this file are gone. What survives:
//   - getReadyDialogStateForPid: shared state-bag accessor used across ready-dialog + lazy-build paths
//   - isHudWarmReadyForPid / isHudSwapTransitionActiveForPid: legacy readers kept as constants so
//     existing visibility checks across clock/help/vehicles/HUD pipeline keep working without rewrites
//   - setCombatHudRevealAllowedForPid / isCombatHudRevealAllowedForPid: combat HUD's reveal-on-deploy gate
//   - resetReadyDialogSectionSignaturesForPid: invalidates cached section signatures on cache rebuild

//#region -------------------- HUD Warm State --------------------

// Returns the per-player ready-dialog runtime state bag when it exists.
function getReadyDialogStateForPid(pid: number): readyDialogData_t | undefined {
    return State.players.readyDialogData[pid];
}

// Marks whether the combat HUD scheduler is allowed to reveal the combat family.
function setCombatHudRevealAllowedForPid(pid: number, allowed: boolean): void {
    const state = getReadyDialogStateForPid(pid);
    if (!state) return;
    state.combatHudRevealAllowed = allowed;
}

// Returns true when the combat HUD scheduler may reveal the combat family for the player.
function isCombatHudRevealAllowedForPid(pid: number): boolean {
    return getReadyDialogStateForPid(pid)?.combatHudRevealAllowed === true;
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

// Wave 3 Ship 8 (v1.418): always returns true. With the loading gate deleted, every UI surface
// builds via lazy-build dispatcher triggers that complete in the same JS execution slice, so
// "warm-ready" is the steady state. Kept as a function so existing callers across clock, help,
// vehicles, and HUD pipeline continue compiling without rewrite.
function isHudWarmReadyForPid(pid: number): boolean {
    return true;
}

// Wave 3 Ship 8 (v1.418): always returns false. Team-swap no longer routes through a gated swap
// transition; players snap directly to deploy screen with the new team perspective.
function isHudSwapTransitionActiveForPid(pid: number): boolean {
    return false;
}

//#endregion ----------------- HUD Warm State --------------------
