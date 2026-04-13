// @ts-nocheck
// Module: interaction/world-interactables -- per-team HQ WorldIcons (pre-game only) and runtime-spawned smoke markers

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

// Hides the authored WorldIcon so only runtime-spawned team icons (and smoke markers) render.
// Gadget interactables rely on this alone — they have no runtime icon at all.
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

// Gate used both for presentation (pre-game HQ icons) and for activation eligibility. Returns true
// only for main-base-scope configs when the player is currently in their own team's main base.
function shouldShowWorldInteractableRuntimeIconForPlayer(player: mod.Player, config: WorldInteractableConfig): boolean {
    if (!player || !mod.IsPlayerValid(player)) return false;
    if (!isPlayerDeployed(player)) return false;

    const pid = safeGetPlayerId(player);
    if (pid === undefined) return false;

    if (config.scope !== "main_base") return false;
    if (State.players.inMainBaseByPid[pid] !== true) return false;

    if (config.ownerTeamId) {
        const playerTeam = safeGetTeamNumberFromPlayer(player);
        if (playerTeam !== config.ownerTeamId) return false;
    }

    return true;
}

// Allows ammo resupply from anywhere the authored InteractPoint radius covers. Main-base activation
// (ready dialog, vehicle spawn menu) still requires the player to be inside their own main base.
function shouldAllowWorldInteractableActivationForPlayer(player: mod.Player, config: WorldInteractableConfig): boolean {
    if (config.action === "open_ammo_resupply_menu") {
        return true;
    }
    return shouldShowWorldInteractableRuntimeIconForPlayer(player, config);
}

// Returns the spawned WorldIcon handle for this team+objId, or undefined if none active.
function getWorldInteractableIconHandleForTeam(teamId: number, objId: number): any {
    return State.conquest.worldInteractableIconByTeamByObjId[teamId]?.[objId] ?? undefined;
}

// Stores or clears the spawned WorldIcon handle for this team+objId.
function setWorldInteractableIconHandleForTeam(teamId: number, objId: number, handle: any): void {
    if (handle) {
        if (!State.conquest.worldInteractableIconByTeamByObjId[teamId]) {
            State.conquest.worldInteractableIconByTeamByObjId[teamId] = {};
        }
        State.conquest.worldInteractableIconByTeamByObjId[teamId][objId] = handle;
        return;
    }
    const byObjId = State.conquest.worldInteractableIconByTeamByObjId[teamId];
    if (!byObjId) return;
    delete byObjId[objId];
    if (Object.keys(byObjId).length <= 0) {
        delete State.conquest.worldInteractableIconByTeamByObjId[teamId];
    }
}

// Resolves the world position for a config's icon from the authored anchor.
function resolveWorldInteractableIconPosition(config: WorldInteractableConfig): mod.Vector | undefined {
    if (config.iconAnchorPos) return config.iconAnchorPos;
    return undefined;
}

// Spawns a single WorldIcon clone owned by the player's team for a main-base config. Cached by
// (team, objId) so multiple teammates hitting the sync path produce at most one clone per team.
// Pre-game only: blocks after the live transition via `isMatchLive()` so HQ icons cannot respawn
// once the round has started.
function ensureMainBaseTeamIconForPlayer(player: mod.Player, config: WorldInteractableConfig): void {
    if (isMatchLive()) return;
    if (!player || !mod.IsPlayerValid(player)) return;
    if (!isPlayerDeployed(player)) return;
    if (!config.ownerTeamId) return;

    const playerTeam = safeGetTeamNumberFromPlayer(player);
    if (playerTeam !== config.ownerTeamId) return;

    if (getWorldInteractableIconHandleForTeam(config.ownerTeamId, config.objId)) return;

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
        mod.SetWorldIconOwner(icon, mod.GetTeam(config.ownerTeamId));
        mod.EnableWorldIconImage(icon, true);
        mod.EnableWorldIconText(icon, true);
        setWorldInteractableIconHandleForTeam(config.ownerTeamId, config.objId, icon);
        if (FEATURE_WORLD_ICON_DIAG) {
            const total = Object.keys(State.conquest.worldInteractableIconByTeamByObjId[config.ownerTeamId] ?? {}).length;
            State.conquest.debug.worldIconDiagP0 = config.ownerTeamId;
            State.conquest.debug.worldIconDiagP1 = config.objId;
            State.conquest.debug.worldIconDiagP2 = total;
            syncDiagCounterForAllPlayers();
        }
    } catch {
    }
}

function syncWorldInteractableRuntimeIconForPlayer(player: mod.Player, config: WorldInteractableConfig): void {
    if (config.scope !== "main_base") return;
    ensureMainBaseTeamIconForPlayer(player, config);
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

// Destroys all team HQ WorldIcons at the live transition. Called from `startMatch`. Combined with
// the `isMatchLive()` guard inside `ensureMainBaseTeamIconForPlayer`, this ensures HQ icons exist
// only pre-game and never reappear once the round has started.
function cleanupMainBaseTeamWorldIconsForLiveTransition(): void {
    const iconsByTeam = State.conquest.worldInteractableIconByTeamByObjId;
    const teamKeys = Object.keys(iconsByTeam);
    for (let i = 0; i < teamKeys.length; i++) {
        const teamKey = Number(teamKeys[i]);
        const byObjId = iconsByTeam[teamKey];
        if (!byObjId) continue;
        const objIdKeys = Object.keys(byObjId);
        for (let j = 0; j < objIdKeys.length; j++) {
            const handle = byObjId[Number(objIdKeys[j])];
            if (!handle) continue;
            try {
                mod.UnspawnObject(handle);
            } catch {}
        }
        delete iconsByTeam[teamKey];
    }
    if (FEATURE_WORLD_ICON_DIAG) {
        State.conquest.debug.worldIconDiagP0 = -1;
        State.conquest.debug.worldIconDiagP1 = 0;
        State.conquest.debug.worldIconDiagP2 = 0;
        syncDiagCounterForAllPlayers();
    }
}

// Runtime-spawns a persistent VFX at every active world interactable whose config carries both a
// position and a vfx prefab enum. Cached by interactable objId so a second call is a no-op.
// SpawnObject returns VFX handles in the DISABLED state for FX_ prefabs — EnableVFX(true) is the
// mandatory step to make them render (proven in v1.166 / fx-showcase reference pattern).
function spawnWorldInteractableVfxForActiveConfigs(): void {
    const cache = State.conquest.worldInteractableVfxHandleByObjId;
    for (let i = 0; i < ACTIVE_WORLD_INTERACTABLE_CONFIGS.length; i++) {
        const config = ACTIVE_WORLD_INTERACTABLE_CONFIGS[i];
        if (!config.vfx || !config.iconAnchorPos) continue;
        if (cache[config.objId]) continue;
        try {
            const spawned = mod.SpawnObject(
                config.vfx,
                config.iconAnchorPos,
                config.vfxRot ?? WORLD_INTERACTABLE_ZERO_ROT
            );
            if (mod.IsType(spawned, mod.Types.VFX)) {
                const vfx = spawned as mod.VFX;
                mod.EnableVFX(vfx, true);
                mod.SetVFXScale(vfx, 1);
                cache[config.objId] = vfx;
            }
        } catch {}
    }
}

// Destroys and drops every cached VFX handle. Called from round-reset cleanup and from
// the deploy-triggered refresh cycle so a re-spawn replicates VFX to all connected clients.
function cleanupWorldInteractableVfx(): void {
    const cache = State.conquest.worldInteractableVfxHandleByObjId;
    const keys = Object.keys(cache);
    for (let i = 0; i < keys.length; i++) {
        const key = Number(keys[i]);
        const vfx = cache[key];
        if (vfx) {
            try { mod.UnspawnObject(vfx); } catch {}
        }
        delete cache[key];
    }
}

const WORLD_INTERACTABLE_VFX_REFRESH_COOLDOWN_SECONDS = 2;

// Destroy-and-respawn cycle for world interactable VFX. Ensures late joiners see the effects
// by forcing a fresh SpawnObject replication to all connected clients. Throttled by a cooldown
// so rapid deploys don't spam destroy/spawn cycles.
function refreshWorldInteractableVfx(): void {
    const now = mod.GetMatchTimeElapsed();
    if (now - State.conquest.worldInteractableVfxLastRefreshAtSeconds < WORLD_INTERACTABLE_VFX_REFRESH_COOLDOWN_SECONDS) return;
    State.conquest.worldInteractableVfxLastRefreshAtSeconds = now;
    cleanupWorldInteractableVfx();
    spawnWorldInteractableVfxForActiveConfigs();
}

// Destroys all cached WorldIcon handles owned by one pid.
function cleanupWorldInteractableRuntimeIconsForPid(pid: number): void {
    if (!Number.isInteger(pid)) return;
    const byObjId = State.players.worldInteractableIconByPidByObjId[pid];
    if (byObjId) {
        for (const objIdKey in byObjId) {
            const handle = byObjId[objIdKey];
            if (!handle) continue;
            try {
                mod.UnspawnObject(handle);
            } catch {}
        }
    }
    delete State.players.worldInteractableIconByPidByObjId[pid];
}

// Round-reset teardown: destroys every per-pid and per-team WorldIcon handle, disables every
// cached smoke VFX, and resets the configure-once guard so the next `configureActiveWorldInteractables`
// pass hides authored icons and enables interact points again.
function cleanupActiveWorldInteractableRuntimeIconsForAllPlayers(): void {
    const iconsByPid = State.players.worldInteractableIconByPidByObjId;
    const iconPidKeys = Object.keys(iconsByPid);
    for (let i = 0; i < iconPidKeys.length; i++) {
        const pidKey = Number(iconPidKeys[i]);
        const byObjId = iconsByPid[pidKey];
        if (!byObjId) continue;
        const objIdKeys = Object.keys(byObjId);
        for (let j = 0; j < objIdKeys.length; j++) {
            const handle = byObjId[Number(objIdKeys[j])];
            if (!handle) continue;
            try {
                mod.UnspawnObject(handle);
            } catch {}
        }
        delete iconsByPid[pidKey];
    }

    const iconsByTeam = State.conquest.worldInteractableIconByTeamByObjId;
    const iconTeamKeys = Object.keys(iconsByTeam);
    for (let i = 0; i < iconTeamKeys.length; i++) {
        const teamKey = Number(iconTeamKeys[i]);
        const byObjId = iconsByTeam[teamKey];
        if (!byObjId) continue;
        const objIdKeys = Object.keys(byObjId);
        for (let j = 0; j < objIdKeys.length; j++) {
            const handle = byObjId[Number(objIdKeys[j])];
            if (!handle) continue;
            try {
                mod.UnspawnObject(handle);
            } catch {}
        }
        delete iconsByTeam[teamKey];
    }

    cleanupWorldInteractableVfx();

    worldInteractablePresentationConfigured = false;
}

// Hides native authored WorldIcon rendering and enables the InteractPoint for interaction.
// Gadget interactables have no runtime icon at all — only the hidden authored icon and smoke.
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
// Icon sync is event-driven (deploy, main-base enter/exit); no polling.
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
