// @ts-nocheck
// Module: interaction/world-interactables -- authored interact-point routing with explicit per-player runtime world icons

//#region -------------------- World Interactables --------------------

// Resolves the runtime terminal label string key for the supported main-base actions.
function getWorldInteractableRuntimeIconTextKey(config: WorldInteractableConfig): number | undefined {
    switch (config.action) {
        case "open_ready_dialog":
            return STR_UI_READY;
        case "open_vehicle_spawn_menu":
            return STR_UI_SPAWN;
        default:
            return undefined;
    }
}

// Resolves the runtime icon image/color pair for the supported main-base terminal actions.
function getWorldInteractableRuntimeIconStyle(
    config: WorldInteractableConfig
): { image: number; color: mod.Vector } {
    if (config.action === "open_vehicle_spawn_menu") {
        return {
            image: mod.WorldIconImages.Assist,
            color: COLOR_NOT_READY_RED,
        };
    }

    return {
        image: mod.WorldIconImages.Flag,
        color: COLOR_READY_GREEN,
    };
}

// Hides the authored shared WorldIcon so only the per-player runtime marker remains visible.
function hideAuthoredWorldInteractableIconPresentation(config: WorldInteractableConfig): void {
    if (config.scope !== "main_base") return;

    try {
        const worldIcon = mod.GetWorldIcon(config.objId);
        mod.EnableWorldIconImage(worldIcon, false);
        mod.EnableWorldIconText(worldIcon, false);
    } catch {
        // Keep this best-effort so missing authored objects do not break map apply.
    }
}

// Returns true when the authored interact point should stay globally enabled for this terminal type.
function shouldEnableWorldInteractableAuthoredInteractPoint(config: WorldInteractableConfig): boolean {
    return config.action === "open_ready_dialog" || config.action === "open_vehicle_spawn_menu";
}

// Applies the authoritative enabled state to an authored interact point so menus stay reachable while icons stay player-scoped.
function applyWorldInteractableAuthoredInteractPointState(config: WorldInteractableConfig): void {
    try {
        const interactPoint = mod.GetInteractPoint(config.objId);
        mod.EnableInteractPoint(interactPoint, shouldEnableWorldInteractableAuthoredInteractPoint(config));
    } catch {
        // Keep this best-effort so missing authored objects do not break map apply.
    }
}

// Returns true when the player should currently see this terminal's runtime icon.
function shouldShowWorldInteractableRuntimeIconForPlayer(player: mod.Player, config: WorldInteractableConfig): boolean {
    if (!player || !mod.IsPlayerValid(player)) return false;
    if (config.scope !== "main_base") return false;
    if (!isPlayerDeployed(player)) return false;
    if (!config.iconAnchorPos) return false;

    const pid = safeGetPlayerId(player);
    if (pid === undefined) return false;
    if (State.players.inMainBaseByPid[pid] !== true) return false;

    const ownerTeamId = config.ownerTeamId;
    if (ownerTeamId !== TeamID.Team1 && ownerTeamId !== TeamID.Team2) return false;
    return safeGetTeamNumberFromPlayer(player, 0) === ownerTeamId;
}

// Returns true when this player should be allowed to activate the authored terminal right now.
function shouldAllowWorldInteractableActivationForPlayer(player: mod.Player, config: WorldInteractableConfig): boolean {
    return shouldShowWorldInteractableRuntimeIconForPlayer(player, config);
}

// Returns the currently spawned per-player runtime world icon handle for one terminal, if any.
function getWorldInteractableRuntimeIconHandle(pid: number, objId: number): mod.WorldIcon | undefined {
    return State.players.worldInteractableIconByPidByObjId[pid]?.[objId];
}

// Returns true when a cached runtime world icon handle still appears usable.
function isWorldInteractableRuntimeIconHandleUsable(icon: mod.WorldIcon | undefined): boolean {
    if (!icon) return false;
    try {
        return mod.GetObjId(icon) > 0;
    } catch {
        return false;
    }
}

// Stores or clears one per-player runtime world icon handle for a terminal ObjId.
function setWorldInteractableRuntimeIconHandle(
    pid: number,
    objId: number,
    icon: mod.WorldIcon | undefined
): void {
    if (icon) {
        if (!State.players.worldInteractableIconByPidByObjId[pid]) {
            State.players.worldInteractableIconByPidByObjId[pid] = {};
        }
        State.players.worldInteractableIconByPidByObjId[pid][objId] = icon;
        return;
    }

    const byObjId = State.players.worldInteractableIconByPidByObjId[pid];
    if (!byObjId) return;
    delete byObjId[objId];
    if (Object.keys(byObjId).length <= 0) {
        delete State.players.worldInteractableIconByPidByObjId[pid];
    }
}

// Spawns one per-player terminal marker at the explicit authored anchor position from map config.
function showWorldInteractableRuntimeIconForPlayer(player: mod.Player, config: WorldInteractableConfig): void {
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return;
    if (!config.iconAnchorPos) return;

    const priorIcon = getWorldInteractableRuntimeIconHandle(pid, config.objId);
    if (isWorldInteractableRuntimeIconHandleUsable(priorIcon)) return;
    if (priorIcon) {
        setWorldInteractableRuntimeIconHandle(pid, config.objId, undefined);
    }

    const textKey = getWorldInteractableRuntimeIconTextKey(config);
    if (textKey === undefined) return;
    const style = getWorldInteractableRuntimeIconStyle(config);

    try {
        const worldIcon = mod.SpawnObject(
            mod.RuntimeSpawn_Common.WorldIcon,
            config.iconAnchorPos,
            mod.CreateVector(0, 0, 0),
            mod.CreateVector(1, 1, 1)
        ) as mod.WorldIcon;
        mod.SetWorldIconPosition(worldIcon, config.iconAnchorPos);
        mod.SetWorldIconOwner(worldIcon, player);
        mod.SetWorldIconColor(worldIcon, style.color);
        mod.SetWorldIconImage(worldIcon, style.image);
        mod.SetWorldIconText(worldIcon, mod.Message(textKey));
        mod.EnableWorldIconImage(worldIcon, true);
        mod.EnableWorldIconText(worldIcon, true);
        setWorldInteractableRuntimeIconHandle(pid, config.objId, worldIcon);
    } catch {
        setWorldInteractableRuntimeIconHandle(pid, config.objId, undefined);
    }
}

// Removes the per-player runtime world icon when the player leaves eligibility.
function hideWorldInteractableRuntimeIconForPlayer(player: mod.Player, config: WorldInteractableConfig): void {
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return;
    const icon = getWorldInteractableRuntimeIconHandle(pid, config.objId);
    if (!icon) return;

    try {
        mod.UnspawnObject(icon);
    } catch {
        // Best-effort cleanup; always clear script state even if the engine already removed the icon.
    }

    setWorldInteractableRuntimeIconHandle(pid, config.objId, undefined);
}

// Reconciles one terminal's per-player runtime icon against the player's current HQ/team eligibility.
function syncWorldInteractableRuntimeIconForPlayer(player: mod.Player, config: WorldInteractableConfig): void {
    if (shouldShowWorldInteractableRuntimeIconForPlayer(player, config)) {
        showWorldInteractableRuntimeIconForPlayer(player, config);
        return;
    }

    hideWorldInteractableRuntimeIconForPlayer(player, config);
}

// Reconciles all terminal runtime icons for one player so HQ enter/exit and team changes take effect immediately.
function syncWorldInteractableRuntimeIconsForPlayer(player: mod.Player): void {
    if (!player || !mod.IsPlayerValid(player)) return;
    for (let i = 0; i < ACTIVE_WORLD_INTERACTABLE_CONFIGS.length; i++) {
        syncWorldInteractableRuntimeIconForPlayer(player, ACTIVE_WORLD_INTERACTABLE_CONFIGS[i]);
    }
}

// Reconciles all active terminal runtime icons for every connected player as a periodic repair pass.
function syncWorldInteractableRuntimeIconsForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const player = mod.ValueInArray(players, i) as mod.Player;
        if (!player || !mod.IsPlayerValid(player)) continue;
        syncWorldInteractableRuntimeIconsForPlayer(player);
    }
}

// Removes all currently spawned runtime terminal icons for one pid and clears the cached handles.
function cleanupWorldInteractableRuntimeIconsForPid(pid: number): void {
    if (!Number.isInteger(pid)) return;
    const byObjId = State.players.worldInteractableIconByPidByObjId[pid];
    if (!byObjId) return;

    for (const objIdKey in byObjId) {
        const icon = byObjId[objIdKey];
        if (!icon) continue;
        try {
            mod.UnspawnObject(icon);
        } catch {
            // Best-effort cleanup; disconnect/reset should always clear cached icon handles.
        }
    }

    delete State.players.worldInteractableIconByPidByObjId[pid];
}

// Removes all currently spawned runtime terminal icons before active map/world-terminal ownership changes.
function cleanupActiveWorldInteractableRuntimeIconsForAllPlayers(): void {
    const iconsByPid = State.players.worldInteractableIconByPidByObjId;
    for (const pidKey in iconsByPid) {
        cleanupWorldInteractableRuntimeIconsForPid(Number(pidKey));
    }
}

// Applies the current authored/shared terminal setup for one config.
function configureWorldInteractablePresentation(config: WorldInteractableConfig): void {
    hideAuthoredWorldInteractableIconPresentation(config);
    applyWorldInteractableAuthoredInteractPointState(config);
}

// Applies the active authored/shared terminal setup to every configured world interactable on the map.
function configureActiveWorldInteractables(): void {
    for (let i = 0; i < ACTIVE_WORLD_INTERACTABLE_CONFIGS.length; i++) {
        configureWorldInteractablePresentation(ACTIVE_WORLD_INTERACTABLE_CONFIGS[i]);
    }
}

// Re-applies authored/shared terminal setup and repairs per-player runtime icon visibility after startup settles.
function ensureActiveWorldInteractablesReady(): void {
    for (let i = 0; i < ACTIVE_WORLD_INTERACTABLE_CONFIGS.length; i++) {
        configureWorldInteractablePresentation(ACTIVE_WORLD_INTERACTABLE_CONFIGS[i]);
    }
    syncWorldInteractableRuntimeIconsForAllPlayers();
}

// Routes one authored world interactable activation into its implemented menu owner after HQ/team gating.
function tryHandleWorldInteractableActivation(eventPlayer: mod.Player, eventInteractPoint: mod.InteractPoint): boolean {
    const config = getActiveWorldInteractableConfigByObjId(mod.GetObjId(eventInteractPoint));
    if (!config) return false;
    if (!shouldAllowWorldInteractableActivationForPlayer(eventPlayer, config)) return false;

    if (config.action === "open_ready_dialog") {
        return tryOpenReadyDialogForPlayer(eventPlayer);
    }

    if (config.action === "open_vehicle_spawn_menu") {
        return tryOpenVehicleDeployLiveMenuForPlayer(eventPlayer);
    }

    return false;
}

//#endregion ----------------- World Interactables --------------------
