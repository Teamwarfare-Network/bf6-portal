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
    posDebugVisible: boolean;
    posDebugToken: number;
}

// Per-player state lives in State.players:
// - readyDialogData: dialog + interact-point state per player.
// - readyByPid: READY toggle state for roster + auto-start gating.
// - inMainBaseByPid: main-base presence for pre-live gating + UI.

//#endregion ----------------- Ready Dialog Interaction Data + Config --------------------
