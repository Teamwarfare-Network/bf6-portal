// @ts-nocheck
// Module: interaction/types -- per-player ready-dialog interaction data and config types

//#region -------------------- Ready Dialog Interaction Data + Config --------------------

interface ReadyDialogInteractConfig {
    enableReadyDialog: boolean;
    interactPointMinLifetime: number;
    interactPointMaxLifetime: number;
    velocityThreshold: number;
}

interface readyDialogData_t {
    interactPoint: mod.InteractPoint | null;
    lastDeployTime: number;
    adminPanelVisible: boolean;
    adminPanelBuilt: boolean;
    lastAdminPanelToggleAt: number;
    dialogVisible: boolean;
    // UI caching: true after the first warm-up build so subsequent opens can be instant.
    uiBuilt: boolean;
    uiLayoutVersion: number;
    posDebugVisible: boolean;
    posDebugToken: number;
    vehicleTimersVisibleWhileDeployed: boolean;
    hudLoadingVisible: boolean;
    hudLoadGateActive: boolean;
    hudLoadToken: number;
    hudLoadStartedAtSeconds: number;
    hudWarmCompleted: boolean;
    hudForceLoadingOnNextWarm: boolean;
    hudSwapTransitionActive: boolean;
    combatHudRevealAllowed: boolean;
}

// Per-player state lives in State.players:
// - readyDialogData: dialog + interact-point state per player.
// - readyByPid: READY toggle state for roster + auto-start gating.
// - inMainBaseByPid: main-base presence for pre-live gating + UI.

//#endregion ----------------- Ready Dialog Interaction Data + Config --------------------
