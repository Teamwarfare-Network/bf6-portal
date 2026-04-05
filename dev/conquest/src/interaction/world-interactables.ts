// @ts-nocheck
// Module: interaction/world-interactables -- per-player spawned WorldIcon clones with SetWorldIconOwner visibility

//#region -------------------- World Interactables --------------------

const WORLD_INTERACTABLE_DEPLOY_BLUE = mod.CreateVector(0 / 255, 110 / 255, 255 / 255);
const WORLD_INTERACTABLE_READY_GREEN = mod.CreateVector(0 / 255, 155 / 255, 38 / 255);
const WORLD_INTERACTABLE_ZERO_ROT = mod.CreateVector(0, 0, 0);

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

// Hides the authored WorldIcon's native rendering so only spawned per-player clones are visible.
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

// Enables the authored InteractPoint so players can interact with it.
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

function shouldShowWorldInteractableRuntimeIconForPlayer(player: mod.Player, config: WorldInteractableConfig): boolean {
    if (!player || !mod.IsPlayerValid(player)) return false;
    if (!isPlayerDeployed(player)) return false;

    const pid = safeGetPlayerId(player);
    if (pid === undefined) return false;

    if (config.scope === "point") {
        return isPlayerInsideWorldInteractableArea(pid, config.objId);
    }

    if (config.scope !== "main_base") return false;
    if (State.players.inMainBaseByPid[pid] !== true) return false;

    // Only show icons belonging to the player's own team HQ.
    if (config.ownerTeamId) {
        const playerTeam = safeGetTeamNumberFromPlayer(player);
        if (playerTeam !== config.ownerTeamId) return false;
    }

    return true;
}

function shouldAllowWorldInteractableActivationForPlayer(player: mod.Player, config: WorldInteractableConfig): boolean {
    if (config.action === "open_ammo_resupply_menu") {
        return true;
    }
    return shouldShowWorldInteractableRuntimeIconForPlayer(player, config);
}

// Returns the spawned WorldIcon handle for this player+config, or undefined if none active.
function getWorldInteractableIconHandleForPid(pid: number, objId: number): any {
    return State.players.worldInteractableIconByPidByObjId[pid]?.[objId] ?? undefined;
}

// Stores or clears the spawned WorldIcon handle for this player+config.
function setWorldInteractableIconHandleForPid(pid: number, objId: number, handle: any): void {
    if (handle) {
        if (!State.players.worldInteractableIconByPidByObjId[pid]) {
            State.players.worldInteractableIconByPidByObjId[pid] = {};
        }
        State.players.worldInteractableIconByPidByObjId[pid][objId] = handle;
        return;
    }
    const byObjId = State.players.worldInteractableIconByPidByObjId[pid];
    if (!byObjId) return;
    delete byObjId[objId];
    if (Object.keys(byObjId).length <= 0) {
        delete State.players.worldInteractableIconByPidByObjId[pid];
    }
}

// Resolves the world position for a config's icon. Uses explicit iconAnchorPos if authored, otherwise
// reads the authored WorldIcon's position as a fallback reference.
function resolveWorldInteractableIconPosition(config: WorldInteractableConfig): mod.Vector | undefined {
    if (config.iconAnchorPos) return config.iconAnchorPos;
    return undefined;
}

// Spawns a per-player WorldIcon clone at the config position, configures its style, and restricts
// visibility to the given player via SetWorldIconOwner. Spawned icons start disabled — image and text
// are explicitly enabled after configuration.
function showWorldInteractableRuntimeIconForPlayer(player: mod.Player, config: WorldInteractableConfig): void {
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return;
    if (getWorldInteractableIconHandleForPid(pid, config.objId)) return;

    const textKey = getWorldInteractableRuntimeIconTextKey(config);
    if (textKey === undefined) return;
    const style = getWorldInteractableRuntimeIconStyle(config);
    const pos = resolveWorldInteractableIconPosition(config);
    if (!pos) return;

    try {
        const icon = mod.SpawnObject(mod.RuntimeSpawn_Common.WorldIcon, pos, WORLD_INTERACTABLE_ZERO_ROT);
        mod.SetWorldIconImage(icon, style.image);
        mod.SetWorldIconColor(icon, style.color);
        mod.SetWorldIconText(icon, mod.Message(textKey));
        mod.SetWorldIconOwner(icon, player);
        mod.EnableWorldIconImage(icon, true);
        mod.EnableWorldIconText(icon, true);
        setWorldInteractableIconHandleForPid(pid, config.objId, icon);
    } catch {
        setWorldInteractableIconHandleForPid(pid, config.objId, undefined);
    }
}

// Destroys the per-player spawned WorldIcon clone for this player+config.
function hideWorldInteractableRuntimeIconForPlayer(player: mod.Player, config: WorldInteractableConfig): void {
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return;
    const handle = getWorldInteractableIconHandleForPid(pid, config.objId);
    if (!handle) return;

    try {
        mod.UnspawnObject(handle);
    } catch {}
    setWorldInteractableIconHandleForPid(pid, config.objId, undefined);
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

// Destroys all spawned WorldIcon clones for one player and clears associated state.
function cleanupWorldInteractableRuntimeIconsForPid(pid: number): void {
    if (!Number.isInteger(pid)) return;
    const byObjId = State.players.worldInteractableIconByPidByObjId[pid];
    if (!byObjId) {
        delete State.players.worldInteractableAreaByPidByObjId[pid];
        return;
    }

    for (const objIdKey in byObjId) {
        const handle = byObjId[objIdKey];
        if (!handle) continue;
        try {
            mod.UnspawnObject(handle);
        } catch {}
    }

    delete State.players.worldInteractableIconByPidByObjId[pid];
    delete State.players.worldInteractableAreaByPidByObjId[pid];
}

// Destroys all spawned WorldIcon clones for all players and resets presentation guard.
function cleanupActiveWorldInteractableRuntimeIconsForAllPlayers(): void {
    const iconsByPid = State.players.worldInteractableIconByPidByObjId;
    for (const pidKey in iconsByPid) {
        const byObjId = iconsByPid[pidKey];
        if (!byObjId) continue;
        for (const objIdKey in byObjId) {
            const handle = byObjId[objIdKey];
            if (!handle) continue;
            try {
                mod.UnspawnObject(handle);
            } catch {}
        }
        delete iconsByPid[pidKey];
    }
    const areasByPid = State.players.worldInteractableAreaByPidByObjId;
    for (const pidKey in areasByPid) {
        delete areasByPid[pidKey];
    }
    worldInteractablePresentationConfigured = false;
}

// Hides native authored WorldIcon rendering and enables the InteractPoint for interaction.
function configureWorldInteractablePresentation(config: WorldInteractableConfig): void {
    hideAuthoredWorldInteractableIconPresentation(config);
    applyWorldInteractableAuthoredInteractPointState(config);
}

let worldInteractablePresentationConfigured = false;

// Configures authored object presentation once (hides native WorldIcons, enables InteractPoints).
function configureActiveWorldInteractables(): void {
    for (let i = 0; i < ACTIVE_WORLD_INTERACTABLE_CONFIGS.length; i++) {
        configureWorldInteractablePresentation(ACTIVE_WORLD_INTERACTABLE_CONFIGS[i]);
    }
    worldInteractablePresentationConfigured = true;
}

// Retries presentation configuration if authored objects were not queryable at init.
// Icon sync is event-driven (deploy, enter/exit area triggers); no polling.
function ensureActiveWorldInteractablesReady(): void {
    if (worldInteractablePresentationConfigured) return;
    configureActiveWorldInteractables();
}

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

    if (config.action === "open_ammo_resupply_menu") {
        return openArmMenu(eventPlayer, config.objId);
    }

    return false;
}

//#endregion ----------------- World Interactables --------------------

