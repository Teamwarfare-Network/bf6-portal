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

function teamSwitchInteractPointActivated(eventPlayer: mod.Player, eventInteractPoint: mod.InteractPoint) {
    const playerId = mod.GetObjId(eventPlayer);
    if (!State.players.readyDialogData[playerId]) initReadyDialogData(eventPlayer);

    if (State.players.readyDialogData[playerId].interactPoint != null) {
        const interactPointId = mod.GetObjId(State.players.readyDialogData[playerId].interactPoint);
        const eventInteractPointId = mod.GetObjId(eventInteractPoint);
        if (interactPointId === eventInteractPointId) {
            setUIInputModeForPlayer(eventPlayer, true);
            createReadyDialogUI(eventPlayer);
            // Track visibility so roster refreshes can target all viewers with the dialog open.
            State.players.readyDialogData[playerId].dialogVisible = true;
            if (consumeJoinPromptTripleTapForPid(playerId)) {
                markJoinPromptReadyDialogOpened(playerId);
            }
            updateHelpTextVisibilityForPid(playerId);
            renderReadyDialogForViewer(eventPlayer, playerId);
            // Immediate self-refresh to avoid relying solely on global refresh bookkeeping.

        }
    }
}

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

function isVelocityBeyond(threshold: number, eventPlayer: mod.Player): boolean {
    if (!isPlayerDeployed(eventPlayer)) return false;
    const v = safeGetSoldierStateVector(eventPlayer, mod.SoldierStateVector.GetLinearVelocity);
    if (!v) return false;
    const x = mod.AbsoluteValue(mod.XComponentOf(v));
    const y = mod.AbsoluteValue(mod.YComponentOf(v));
    const z = mod.AbsoluteValue(mod.ZComponentOf(v));
    return x + y + z > threshold;
}

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
        posDebugVisible: false,
        posDebugToken: 0,
    };
}

//#endregion ----------------- Ready Dialog Interact Point --------------------
