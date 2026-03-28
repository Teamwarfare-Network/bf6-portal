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

        // Keep dialog open responsive: if the hidden cache was invalidated, rebuild it here
        // before the interact point becomes usable rather than during the user's open action.
        warmHiddenReadyDialogCacheForPid(playerId);
        await mod.Wait(0);

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

// Opens the ready dialog through the single shared UI path and restores local input state on failure.
function tryOpenReadyDialogForPlayer(eventPlayer: mod.Player): boolean {
    const playerId = mod.GetObjId(eventPlayer);
    try {
        closeVehicleDeployLiveMenuForPlayer(playerId);
        setUIInputModeForPlayer(eventPlayer, true);
        if (consumeJoinPromptTripleTapForPid(playerId)) {
            markJoinPromptReadyDialogOpened(playerId);
        }
        updateHelpTextVisibilityForPid(playerId);
        const dialogRoot = showReadyDialogUI(eventPlayer);
        if (!dialogRoot) {
            throw new Error(`Ready dialog root missing for pid ${playerId}`);
        }
        return true;
    } catch {
        State.players.readyDialogData[playerId].dialogVisible = false;
        setUIInputModeForPlayer(eventPlayer, false);
        hideReadyDialogUI(eventPlayer);
        updateHelpTextVisibilityForPid(playerId);
        return false;
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
            tryOpenReadyDialogForPlayer(eventPlayer);
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
        hudWarmToken: 0,
        hudWarmCompleted: false,
        hudSwapTransitionActive: false,
        combatHudRevealAllowed: false,
        lastButtonSignature: "",
        lastRosterSignature: "",
        lastModeConfigSignature: "",
        lastMapSignature: "",
    };
}

//#endregion ----------------- Ready Dialog Interact Point --------------------
