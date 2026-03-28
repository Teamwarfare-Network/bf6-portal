// @ts-nocheck
// Module: vehicles/deploy-live-menu -- alive-player world-terminal ownership for the deploy HUD family

//#region -------------------- Live Deploy Menu State --------------------

// Returns true when this viewer currently owns the in-world live deploy menu surface.
function isVehicleDeployLiveMenuOpenForPid(pid: number | undefined): boolean {
    if (pid === undefined) return false;
    return State.players.liveVehicleDeployMenuVisibleByPid[pid] === true;
}

// Stores the authoritative visibility flag for the in-world live deploy menu surface.
function setVehicleDeployLiveMenuVisibleForPid(pid: number, visible: boolean): void {
    if (visible) {
        State.players.liveVehicleDeployMenuVisibleByPid[pid] = true;
        return;
    }
    delete State.players.liveVehicleDeployMenuVisibleByPid[pid];
}

// Clears live deploy menu ownership for one pid without assuming the player object is still valid.
function resetVehicleDeployLiveMenuStateForPid(pid: number): void {
    if (!Number.isInteger(pid)) return;
    delete State.players.liveVehicleDeployMenuVisibleByPid[pid];
}

// Closes the in-world live deploy menu and restores gameplay input ownership to the world.
function closeVehicleDeployLiveMenuForPlayer(eventPlayer: mod.Player | number): void {
    let pid: number | undefined;
    let player: mod.Player | undefined;

    if (mod.IsType(eventPlayer, mod.Types.Player)) {
        player = eventPlayer as mod.Player;
        pid = safeGetPlayerId(player);
    } else {
        pid = eventPlayer as number;
        player = safeFindPlayer(pid);
    }

    if (pid === undefined) return;
    setVehicleDeployLiveMenuVisibleForPid(pid, false);
    const cache = State.hudCache.vehicleDeployTimerCache[pid];
    if (cache && !isVehicleDeployTimerAdminOverrideEnabledForPid(pid)) {
        hideVehicleDeployTimerHudFamily(cache, false);
    }

    if (player && mod.IsPlayerValid(player)) {
        setUIInputModeForPlayer(player, false);
        updateVehicleDeployTimerHudForPlayer(player);
    } else {
        delete State.players.uiInputEnabledByPid[pid];
    }
}

// Opens the in-world live deploy menu for an already deployed player and reveals the reused deploy HUD family.
function tryOpenVehicleDeployLiveMenuForPlayer(eventPlayer: mod.Player): boolean {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return false;
    const pid = safeGetPlayerId(eventPlayer);
    if (pid === undefined) return false;
    if (!State.players.deployedByPid[pid]) return false;

    if (State.players.readyDialogData[pid]?.dialogVisible) {
        hideReadyDialogUI(eventPlayer);
    }

    setVehicleDeployLiveMenuVisibleForPid(pid, true);
    setUIInputModeForPlayer(eventPlayer, true);
    const revealed = revealVehicleDeployTimerHudForPlayer(eventPlayer);
    if (revealed) {
        return true;
    }

    setVehicleDeployLiveMenuVisibleForPid(pid, false);
    setUIInputModeForPlayer(eventPlayer, false);
    return false;
}

//#endregion ----------------- Live Deploy Menu State --------------------
