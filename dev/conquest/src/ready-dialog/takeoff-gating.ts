// @ts-nocheck
// Module: ready-dialog/takeoff-gating -- takeoff altitude gating and warning messaging

//#region -------------------- Ready Dialog - Takeoff Limit Gating --------------------

function isPlayerInMainBaseForReady(pid: number): boolean {
    return (State.players.inMainBaseByPid[pid] !== undefined) ? State.players.inMainBaseByPid[pid] : true;
}

// Legacy takeoff-gating path is intentionally inactive; Godot main-base trigger geometry now owns vertical containment.
function checkTakeoffLimitForAllPlayers(): void {
    return;
}

//#endregion -------------------- Ready Dialog - Takeoff Limit Gating --------------------
