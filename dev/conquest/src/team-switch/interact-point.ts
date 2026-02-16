// @ts-nocheck
// Module: team-switch/interact-point -- deploy interact point lifecycle and spawn/remove logic

//#region -------------------- Team Switch Interact Point --------------------

async function spawnTeamSwitchInteractPoint(eventPlayer: mod.Player) {
    if (!isPlayerDeployed(eventPlayer)) return;
    const playerId = mod.GetObjId(eventPlayer);
    if (!State.players.teamSwitchData[playerId]) initTeamSwitchData(eventPlayer);

    if (
        State.players.teamSwitchData[playerId].interactPoint === null &&
        TEAMSWITCHCONFIG.enableTeamSwitch
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
        State.players.teamSwitchData[playerId].interactPoint = interactPoint;
        State.players.teamSwitchData[playerId].lastDeployTime = mod.GetMatchTimeElapsed();
    }
}

function teamSwitchInteractPointActivated(eventPlayer: mod.Player, eventInteractPoint: mod.InteractPoint) {
    const playerId = mod.GetObjId(eventPlayer);
    if (!State.players.teamSwitchData[playerId]) initTeamSwitchData(eventPlayer);

    if (State.players.teamSwitchData[playerId].interactPoint != null) {
        const interactPointId = mod.GetObjId(State.players.teamSwitchData[playerId].interactPoint);
        const eventInteractPointId = mod.GetObjId(eventInteractPoint);
        if (interactPointId === eventInteractPointId) {
            setUIInputModeForPlayer(eventPlayer, true);
            createTeamSwitchUI(eventPlayer);
            // Track visibility so roster refreshes can target all viewers with the dialog open.
            State.players.teamSwitchData[playerId].dialogVisible = true;
            if (consumeJoinPromptTripleTapForPid(playerId)) {
                markJoinPromptReadyDialogOpened(playerId);
            }
            updateHelpTextVisibilityForPid(playerId);
            renderReadyDialogForViewer(eventPlayer, playerId);
            // Immediate self-refresh to avoid relying solely on global refresh bookkeeping.

        }
    }
}

function removeTeamSwitchInteractPoint(eventPlayer: mod.Player | number) {
    let playerId: number;

    if (mod.IsType(eventPlayer, mod.Types.Player)) {
        playerId = mod.GetObjId(eventPlayer as mod.Player);
    } else {
        playerId = eventPlayer as number;
    }

    if (!State.players.teamSwitchData[playerId]) return;

    if (State.players.teamSwitchData[playerId].interactPoint != null) {
        try {
            mod.EnableInteractPoint(State.players.teamSwitchData[playerId].interactPoint as mod.InteractPoint, false);
            mod.UnspawnObject(State.players.teamSwitchData[playerId].interactPoint as mod.InteractPoint);
        } catch {
            // Best-effort cleanup; ignore if already despawned by the engine.
        }
        State.players.teamSwitchData[playerId].interactPoint = null;
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

function checkTeamSwitchInteractPointRemoval(eventPlayer: mod.Player) {
    if (!isPlayerDeployed(eventPlayer)) return;
    const isDead = safeGetSoldierStateBool(eventPlayer, mod.SoldierStateBool.IsDead);
    if (TEAMSWITCHCONFIG.enableTeamSwitch && !isDead) {
        const playerId = mod.GetObjId(eventPlayer);
        if (!State.players.teamSwitchData[playerId]) initTeamSwitchData(eventPlayer);

        if (State.players.teamSwitchData[playerId].interactPoint != null) {
            const lifetime = mod.GetMatchTimeElapsed() - State.players.teamSwitchData[playerId].lastDeployTime;

            if (
                isVelocityBeyond(TEAMSWITCHCONFIG.velocityThreshold, eventPlayer) ||
                lifetime > TEAMSWITCHCONFIG.interactPointMaxLifetime
            ) {
                removeTeamSwitchInteractPoint(playerId);
            }
        }
    }
}

function initTeamSwitchData(eventPlayer: mod.Player) {
    const playerId = mod.GetObjId(eventPlayer);
    State.players.teamSwitchData[playerId] = {
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

//#endregion ----------------- Team Switch Interact Point --------------------
