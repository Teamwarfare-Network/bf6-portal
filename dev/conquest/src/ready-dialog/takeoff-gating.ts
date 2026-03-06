// @ts-nocheck
// Module: ready-dialog/takeoff-gating -- takeoff altitude gating and warning messaging

//#region -------------------- Ready Dialog - Takeoff Limit Gating --------------------

function isPlayerInMainBaseForReady(pid: number): boolean {
    const inBase = (State.players.inMainBaseByPid[pid] !== undefined) ? State.players.inMainBaseByPid[pid] : true;
    if (State.players.overTakeoffLimitByPid[pid]) return false;
    return inBase;
}

function checkTakeoffLimitForAllPlayers(): void {
    if (State.match.isEnded) return;
    if (isMatchLive()) return;

    const floorY = Math.floor(State.round.aircraftCeiling.hudFloorY);
    const limitY = floorY + TAKEOFF_LIMIT_HUD_OFFSET;

    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const pid = safeGetPlayerId(p);
        if (pid === undefined) continue;

        if (!isPlayerDeployed(p)) {
            delete State.players.overTakeoffLimitByPid[pid];
            continue;
        }

        const pos = safeGetSoldierStateVector(p, mod.SoldierStateVector.GetPosition);
        if (!pos) continue;
        const posY = mod.YComponentOf(pos);
        const currentlyOver = !!State.players.overTakeoffLimitByPid[pid];
        const overLimit = posY > limitY;

        if (overLimit && !currentlyOver && isPlayerInMainBaseForReady(pid)) {
            State.players.overTakeoffLimitByPid[pid] = true;
            State.players.readyByPid[pid] = false;
            updatePlayersReadyHudTextForAllPlayers();
            updateHelpTextVisibilityForPid(pid);
            if (State.round.countdown.isRequested) {
                cancelPregameCountdown();
            }
            sendHighlightedWorldLogMessage(
                mod.Message(STR_READYUP_RETURN_TO_BASE_NOT_LIVE),
                false,
                p,
                STR_READYUP_RETURN_TO_BASE_NOT_LIVE
            );
            renderReadyDialogForAllVisibleViewers();
            continue;
        }

        if (!overLimit && currentlyOver) {
            delete State.players.overTakeoffLimitByPid[pid];
            renderReadyDialogForAllVisibleViewers();
        }
    }
}

//#endregion -------------------- Ready Dialog - Takeoff Limit Gating --------------------
