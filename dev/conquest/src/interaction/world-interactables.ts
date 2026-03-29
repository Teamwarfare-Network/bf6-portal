// @ts-nocheck
// Module: interaction/world-interactables -- authored interact-point routing with explicit per-player runtime world icons

//#region -------------------- World Interactables --------------------

const WORLD_INTERACTABLE_DEPLOY_BLUE = mod.CreateVector(0 / 255, 110 / 255, 255 / 255);
const WORLD_INTERACTABLE_READY_GREEN = mod.CreateVector(0 / 255, 155 / 255, 38 / 255);

function getWorldInteractableRuntimeIconTextKey(config: WorldInteractableConfig): number | undefined {
    switch (config.action) {
        case "open_ready_dialog":
            return STR_UI_READY;
        case "open_vehicle_spawn_menu":
            return STR_UI_SPAWN;
        case "open_ammo_resupply_menu":
            return STR_UI_GADGETS;
        default:
            return undefined;
    }
}

function getWorldInteractableRuntimeIconStyle(
    config: WorldInteractableConfig
): { image: number; color: mod.Vector } {
    if (config.action === "open_ammo_resupply_menu") {
        return {
            image: mod.WorldIconImages.Explosion,
            color: COLOR_NOT_READY_RED,
        };
    }

    if (config.action === "open_vehicle_spawn_menu") {
        return {
            image: mod.WorldIconImages.Assist,
            color: WORLD_INTERACTABLE_DEPLOY_BLUE,
        };
    }

    return {
        image: mod.WorldIconImages.Flag,
        color: WORLD_INTERACTABLE_READY_GREEN,
    };
}

function hideAuthoredWorldInteractableIconPresentation(config: WorldInteractableConfig): void {
    try {
        const worldIcon = mod.GetWorldIcon(config.objId);
        mod.EnableWorldIconImage(worldIcon, false);
        mod.EnableWorldIconText(worldIcon, false);
    } catch {
    }
}

function shouldEnableWorldInteractableAuthoredInteractPoint(config: WorldInteractableConfig): boolean {
    return true;
}

function applyWorldInteractableAuthoredInteractPointState(config: WorldInteractableConfig): void {
    try {
        const interactPoint = mod.GetInteractPoint(config.objId);
        mod.EnableInteractPoint(interactPoint, shouldEnableWorldInteractableAuthoredInteractPoint(config));
    } catch {
    }
}

function isPlayerInsideWorldInteractableArea(pid: number, objId: number): boolean {
    return State.players.worldInteractableAreaByPidByObjId[pid]?.[objId] === true;
}

function setPlayerWorldInteractableAreaMembership(pid: number, objId: number, inside: boolean): void {
    if (inside) {
        if (!State.players.worldInteractableAreaByPidByObjId[pid]) {
            State.players.worldInteractableAreaByPidByObjId[pid] = {};
        }
        State.players.worldInteractableAreaByPidByObjId[pid][objId] = true;
        return;
    }

    const byObjId = State.players.worldInteractableAreaByPidByObjId[pid];
    if (!byObjId) return;
    delete byObjId[objId];
    if (Object.keys(byObjId).length <= 0) {
        delete State.players.worldInteractableAreaByPidByObjId[pid];
    }
}

function resolveWorldInteractableRuntimeIconAnchorPos(config: WorldInteractableConfig): mod.Vector | undefined {
    if (config.iconAnchorPos) return config.iconAnchorPos;
    try {
        return mod.GetObjectPosition(mod.GetWorldIcon(config.objId));
    } catch {
        return undefined;
    }
}

function shouldShowWorldInteractableRuntimeIconForPlayer(player: mod.Player, config: WorldInteractableConfig): boolean {
    if (!player || !mod.IsPlayerValid(player)) return false;
    if (!isPlayerDeployed(player)) return false;

    const pid = safeGetPlayerId(player);
    if (pid === undefined) return false;

    const anchorPos = resolveWorldInteractableRuntimeIconAnchorPos(config);
    if (!anchorPos) return false;

    if (config.scope === "point") {
        return isPlayerInsideWorldInteractableArea(pid, config.objId);
    }

    if (config.scope !== "main_base") return false;
    if (State.players.inMainBaseByPid[pid] !== true) return false;

    const ownerTeamId = config.ownerTeamId;
    if (ownerTeamId !== TeamID.Team1 && ownerTeamId !== TeamID.Team2) return false;
    return safeGetTeamNumberFromPlayer(player, 0) === ownerTeamId;
}

function shouldAllowWorldInteractableActivationForPlayer(player: mod.Player, config: WorldInteractableConfig): boolean {
    if (config.action === "open_ammo_resupply_menu") {
        return true;
    }
    return shouldShowWorldInteractableRuntimeIconForPlayer(player, config);
}

function getWorldInteractableRuntimeIconHandle(pid: number, objId: number): mod.WorldIcon | undefined {
    return State.players.worldInteractableIconByPidByObjId[pid]?.[objId];
}

function isWorldInteractableRuntimeIconHandleUsable(icon: mod.WorldIcon | undefined): boolean {
    if (!icon) return false;
    try {
        return mod.GetObjId(icon) > 0;
    } catch {
        return false;
    }
}

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

function showWorldInteractableRuntimeIconForPlayer(player: mod.Player, config: WorldInteractableConfig): void {
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return;
    const anchorPos = resolveWorldInteractableRuntimeIconAnchorPos(config);
    if (!anchorPos) return;

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
            anchorPos,
            mod.CreateVector(0, 0, 0),
            mod.CreateVector(1, 1, 1)
        ) as mod.WorldIcon;
        mod.SetWorldIconPosition(worldIcon, anchorPos);
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

function hideWorldInteractableRuntimeIconForPlayer(player: mod.Player, config: WorldInteractableConfig): void {
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return;
    const icon = getWorldInteractableRuntimeIconHandle(pid, config.objId);
    if (!icon) return;

    try {
        mod.UnspawnObject(icon);
    } catch {
    }

    setWorldInteractableRuntimeIconHandle(pid, config.objId, undefined);
}

function updateWorldInteractableAreaTriggerMembershipForPlayer(
    player: mod.Player,
    areaTrigger: mod.AreaTrigger,
    inside: boolean
): boolean {
    if (!player || !mod.IsPlayerValid(player) || !areaTrigger) return false;
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return false;

    const config = getActiveWorldInteractableConfigByObjId(mod.GetObjId(areaTrigger));
    if (!config || config.scope !== "point") return false;

    setPlayerWorldInteractableAreaMembership(pid, config.objId, inside);
    syncWorldInteractableRuntimeIconForPlayer(player, config);
    return true;
}

function syncWorldInteractableRuntimeIconForPlayer(player: mod.Player, config: WorldInteractableConfig): void {
    if (shouldShowWorldInteractableRuntimeIconForPlayer(player, config)) {
        showWorldInteractableRuntimeIconForPlayer(player, config);
        return;
    }

    hideWorldInteractableRuntimeIconForPlayer(player, config);
}

function syncWorldInteractableRuntimeIconsForPlayer(player: mod.Player): void {
    if (!player || !mod.IsPlayerValid(player)) return;
    for (let i = 0; i < ACTIVE_WORLD_INTERACTABLE_CONFIGS.length; i++) {
        syncWorldInteractableRuntimeIconForPlayer(player, ACTIVE_WORLD_INTERACTABLE_CONFIGS[i]);
    }
}

function syncWorldInteractableRuntimeIconsForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const player = mod.ValueInArray(players, i) as mod.Player;
        if (!player || !mod.IsPlayerValid(player)) continue;
        syncWorldInteractableRuntimeIconsForPlayer(player);
    }
}

function cleanupWorldInteractableRuntimeIconsForPid(pid: number): void {
    if (!Number.isInteger(pid)) return;
    const byObjId = State.players.worldInteractableIconByPidByObjId[pid];
    if (!byObjId) {
        delete State.players.worldInteractableAreaByPidByObjId[pid];
        return;
    }

    for (const objIdKey in byObjId) {
        const icon = byObjId[objIdKey];
        if (!icon) continue;
        try {
            mod.UnspawnObject(icon);
        } catch {
        }
    }

    delete State.players.worldInteractableIconByPidByObjId[pid];
    delete State.players.worldInteractableAreaByPidByObjId[pid];
}

function cleanupActiveWorldInteractableRuntimeIconsForAllPlayers(): void {
    const iconsByPid = State.players.worldInteractableIconByPidByObjId;
    for (const pidKey in iconsByPid) {
        cleanupWorldInteractableRuntimeIconsForPid(Number(pidKey));
    }
}

function configureWorldInteractablePresentation(config: WorldInteractableConfig): void {
    hideAuthoredWorldInteractableIconPresentation(config);
    applyWorldInteractableAuthoredInteractPointState(config);
}

function configureActiveWorldInteractables(): void {
    for (let i = 0; i < ACTIVE_WORLD_INTERACTABLE_CONFIGS.length; i++) {
        configureWorldInteractablePresentation(ACTIVE_WORLD_INTERACTABLE_CONFIGS[i]);
    }
}

function ensureActiveWorldInteractablesReady(): void {
    for (let i = 0; i < ACTIVE_WORLD_INTERACTABLE_CONFIGS.length; i++) {
        configureWorldInteractablePresentation(ACTIVE_WORLD_INTERACTABLE_CONFIGS[i]);
    }
    syncWorldInteractableRuntimeIconsForAllPlayers();
}

function tryHandleWorldInteractableActivation(eventPlayer: mod.Player, eventInteractPoint: mod.InteractPoint): boolean {
    const config = getActiveWorldInteractableConfigByObjId(mod.GetObjId(eventInteractPoint));
    if (!config) return false;
    if (!shouldAllowWorldInteractableActivationForPlayer(eventPlayer, config)) return false;

    if (config.action === "open_ready_dialog") {
        closeArmMenu(eventPlayer);
        return tryOpenReadyDialogForPlayer(eventPlayer);
    }

    if (config.action === "open_vehicle_spawn_menu") {
        closeArmMenu(eventPlayer);
        return tryOpenVehicleDeployLiveMenuForPlayer(eventPlayer);
    }

    if (config.action === "open_ammo_resupply_menu") {
        return openArmMenu(eventPlayer, config.objId);
    }

    return false;
}

//#endregion ----------------- World Interactables --------------------

