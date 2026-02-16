// @ts-nocheck
// Module: ready-dialog/auto-start -- all-ready auto-start gate

//#region -------------------- Ready Dialog - Auto-Start --------------------

// Starts the live phase as soon as all active players are READY.
// Notes:
// - Only triggers when live phase is NOT active and match is NOT ended.
// - Uses the existing startRound() flow; we do not bypass or reimplement startup logic.
function tryAutoStartRoundIfAllReady(triggerPlayer?: mod.Player): void {
    if (State.match.isEnded || isRoundLive()) return;
    if (!areAllActivePlayersReady()) return;
    // All players ready: run the same pregame countdown path used by manual start.
    startPregameCountdown(triggerPlayer);
}

//#endregion -------------------- Ready Dialog - Auto-Start --------------------
