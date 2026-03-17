// @ts-nocheck
// Module: interaction/interact-point -- deploy interact-point lifecycle and ready-dialog trigger logic

//#region -------------------- Ready Dialog Interact Point --------------------

async function spawnReadyDialogInteractPoint(eventPlayer: mod.Player) {
    if (!isPlayerDeployed(eventPlayer)) return;
    const playerId = mod.GetObjId(eventPlayer);
    if (!State.players.readyDialogData[playerId]) initReadyDialogData(eventPlayer);

    if (
        State.players.readyDialogData[playerId].interactPoint === null &&
        READY_DIALOG_INTERACT_CONFIG.enableReadyDialog
    ) {
        let isOnGround = safeGetSoldierStateBool(eventPlayer, mod.SoldierStateBool.IsOnGround);

        while (!isOnGround) {
            await mod.Wait(0.2);
            if (!isPlayerDeployed(eventPlayer)) return;
            isOnGround = safeGetSoldierStateBool(eventPlayer, mod.SoldierStateBool.IsOnGround);
        }

        const playerPosition = safeGetSoldierStateVector(eventPlayer, mod.SoldierStateVector.GetPosition);
        const playerFacingDirection = safeGetSoldierStateVector(eventPlayer, mod.SoldierStateVector.GetFacingDirection);
        if (!playerPosition || !playerFacingDirection) return;

        const interactPointPosition = mod.Add(
            mod.Add(playerPosition, playerFacingDirection),
            mod.CreateVector(0, 1.5, 0)
        );

        const interactPoint: mod.InteractPoint = mod.SpawnObject(
            mod.RuntimeSpawn_Common.InteractPoint,
            interactPointPosition,
            mod.CreateVector(0, 0, 0)
        );

        mod.EnableInteractPoint(interactPoint, true);
        State.players.readyDialogData[playerId].interactPoint = interactPoint;
        State.players.readyDialogData[playerId].lastDeployTime = mod.GetMatchTimeElapsed();
    }
}

// Handles interact activation for the owning player's ready-dialog interact point.
function teamSwitchInteractPointActivated(eventPlayer: mod.Player, eventInteractPoint: mod.InteractPoint) {
    const playerId = mod.GetObjId(eventPlayer);
    if (!State.players.readyDialogData[playerId]) initReadyDialogData(eventPlayer);

    if (State.players.readyDialogData[playerId].interactPoint != null) {
        const interactPointId = mod.GetObjId(State.players.readyDialogData[playerId].interactPoint);
        const eventInteractPointId = mod.GetObjId(eventInteractPoint);
        if (interactPointId === eventInteractPointId) {
            try {
                if (!State.players.readyDialogData[playerId].uiBuilt) {
                    createReadyDialogUI(eventPlayer, false);
                }
                setUIInputModeForPlayer(eventPlayer, true);
                // Track visibility so roster refreshes can target all viewers with the dialog open.
                State.players.readyDialogData[playerId].dialogVisible = true;
                if (consumeJoinPromptTripleTapForPid(playerId)) {
                    markJoinPromptReadyDialogOpened(playerId);
                }
                updateHelpTextVisibilityForPid(playerId);
                createReadyDialogUI(eventPlayer);
                const dialogRoot = safeFind(UI_READY_DIALOG_CONTAINER_BASE_ID + playerId);
                if (!dialogRoot) {
                    throw new Error(`Ready dialog root missing for pid ${playerId}`);
                }
            } catch {
                State.players.readyDialogData[playerId].dialogVisible = false;
                setUIInputModeForPlayer(eventPlayer, false);
                hideReadyDialogUI(eventPlayer);
                updateHelpTextVisibilityForPid(playerId);
            }
        }
    }
}

// Removes and despawns a player's ready-dialog interact point by player or pid.
function removeReadyDialogInteractPoint(eventPlayer: mod.Player | number) {
    let playerId: number;

    if (mod.IsType(eventPlayer, mod.Types.Player)) {
        playerId = mod.GetObjId(eventPlayer as mod.Player);
    } else {
        playerId = eventPlayer as number;
    }

    if (!State.players.readyDialogData[playerId]) return;

    if (State.players.readyDialogData[playerId].interactPoint != null) {
        try {
            mod.EnableInteractPoint(State.players.readyDialogData[playerId].interactPoint as mod.InteractPoint, false);
            mod.UnspawnObject(State.players.readyDialogData[playerId].interactPoint as mod.InteractPoint);
        } catch {
            // Best-effort cleanup; ignore if already despawned by the engine.
        }
        State.players.readyDialogData[playerId].interactPoint = null;
    }
}

// Returns true when player linear velocity magnitude sum exceeds configured threshold.
function isVelocityBeyond(threshold: number, eventPlayer: mod.Player): boolean {
    if (!isPlayerDeployed(eventPlayer)) return false;
    const v = safeGetSoldierStateVector(eventPlayer, mod.SoldierStateVector.GetLinearVelocity);
    if (!v) return false;
    const x = mod.AbsoluteValue(mod.XComponentOf(v));
    const y = mod.AbsoluteValue(mod.YComponentOf(v));
    const z = mod.AbsoluteValue(mod.ZComponentOf(v));
    return x + y + z > threshold;
}

// Evaluates whether an existing interact point should be removed due to movement or lifetime.
function checkReadyDialogInteractPointRemoval(eventPlayer: mod.Player) {
    if (!isPlayerDeployed(eventPlayer)) return;
    const isDead = safeGetSoldierStateBool(eventPlayer, mod.SoldierStateBool.IsDead);
    if (READY_DIALOG_INTERACT_CONFIG.enableReadyDialog && !isDead) {
        const playerId = mod.GetObjId(eventPlayer);
        if (!State.players.readyDialogData[playerId]) initReadyDialogData(eventPlayer);

        if (State.players.readyDialogData[playerId].interactPoint != null) {
            const lifetime = mod.GetMatchTimeElapsed() - State.players.readyDialogData[playerId].lastDeployTime;

            if (
                isVelocityBeyond(READY_DIALOG_INTERACT_CONFIG.velocityThreshold, eventPlayer) ||
                lifetime > READY_DIALOG_INTERACT_CONFIG.interactPointMaxLifetime
            ) {
                removeReadyDialogInteractPoint(playerId);
            }
        }
    }
}

// Initializes per-player ready-dialog runtime state used by UI/interact workflows.
function initReadyDialogData(eventPlayer: mod.Player) {
    const playerId = mod.GetObjId(eventPlayer);
    State.players.readyDialogData[playerId] = {
        adminPanelVisible: false,
        adminPanelBuilt: false,
        lastAdminPanelToggleAt: 0,
        dialogVisible: false,
        interactPoint: null,
        lastDeployTime: 0,
        uiBuilt: false,
        uiLayoutVersion: 0,
        posDebugVisible: false,
        posDebugToken: 0,
        vehicleTimersVisibleWhileDeployed: false,
        hudLoadingVisible: false,
        hudLoadGateActive: false,
        hudLoadToken: 0,
        hudLoadStartedAtSeconds: 0,
        hudWarmCompleted: false,
        hudForceLoadingOnNextWarm: false,
        hudSwapTransitionActive: false,
        combatHudRevealAllowed: false,
    };
}

//#endregion ----------------- Ready Dialog Interact Point --------------------
