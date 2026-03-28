// @ts-nocheck
// Module: interaction/world-interactables -- authored world terminal routing and presentation

//#region -------------------- World Interactables --------------------

// Resolves the authored world-icon text label for the currently supported interactable actions.
function getWorldInteractableIconTextKey(config: WorldInteractableConfig): number | undefined {
    switch (config.action) {
        case "open_ready_dialog":
            return STR_UI_READY;
        case "open_vehicle_spawn_menu":
            return STR_UI_SPAWN;
        default:
            return undefined;
    }
}

// Enables the authored world-icon presentation without overriding Godot-authored art settings.
function enableWorldInteractableIconPresentation(config: WorldInteractableConfig): void {
    try {
        const worldIcon = mod.GetWorldIcon(config.objId);
        const textKey = getWorldInteractableIconTextKey(config);
        mod.EnableWorldIconImage(worldIcon, true);
        if (textKey !== undefined) {
            mod.SetWorldIconText(worldIcon, mod.Message(textKey));
            mod.EnableWorldIconText(worldIcon, true);
        }
    } catch {
        // Keep this best-effort so missing authored objects do not break map apply.
    }
}

// Applies the authoritative enabled state to an authored interact point so unfinished terminals stay non-interactive.
function applyWorldInteractableAuthoredInteractPointState(config: WorldInteractableConfig): void {
    try {
        const interactPoint = mod.GetInteractPoint(config.objId);
        mod.EnableInteractPoint(
            interactPoint,
            config.action === "open_ready_dialog" || config.action === "open_vehicle_spawn_menu"
        );
    } catch {
        // Keep this best-effort so missing authored objects do not break map apply.
    }
}

// Applies first-pass authored icon presentation and authored interact-point enablement for one world interactable.
function configureWorldInteractablePresentation(config: WorldInteractableConfig): void {
    enableWorldInteractableIconPresentation(config);
    applyWorldInteractableAuthoredInteractPointState(config);
}

// Applies the active presentation contract to all authored world interactables on the current map.
function configureActiveWorldInteractables(): void {
    for (let i = 0; i < ACTIVE_WORLD_INTERACTABLE_CONFIGS.length; i++) {
        configureWorldInteractablePresentation(ACTIVE_WORLD_INTERACTABLE_CONFIGS[i]);
    }
}

// Re-applies authored world-terminal presentation and enable state after startup settles.
function ensureActiveWorldInteractablesReady(): void {
    for (let i = 0; i < ACTIVE_WORLD_INTERACTABLE_CONFIGS.length; i++) {
        const config = ACTIVE_WORLD_INTERACTABLE_CONFIGS[i];
        enableWorldInteractableIconPresentation(config);
        applyWorldInteractableAuthoredInteractPointState(config);
    }
}

// Routes one authored world interactable activation into its implemented menu owner.
function tryHandleWorldInteractableActivation(eventPlayer: mod.Player, eventInteractPoint: mod.InteractPoint): boolean {
    const config = getActiveWorldInteractableConfigByObjId(mod.GetObjId(eventInteractPoint));
    if (!config) return false;

    if (config.action === "open_ready_dialog") {
        return tryOpenReadyDialogForPlayer(eventPlayer);
    }

    if (config.action === "open_vehicle_spawn_menu") {
        return tryOpenVehicleDeployLiveMenuForPlayer(eventPlayer);
    }

    return false;
}

//#endregion ----------------- World Interactables --------------------
