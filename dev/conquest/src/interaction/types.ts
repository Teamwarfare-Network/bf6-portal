// @ts-nocheck
// Module: interaction/types -- per-player ready-dialog interaction data and config types

//#region -------------------- Ready Dialog Interaction Data + Config --------------------

interface ReadyDialogInteractConfig {
    enableReadyDialog: boolean;
    interactPointMinLifetime: number;
    interactPointMaxLifetime: number;
    velocityThreshold: number;
}

// Wave 3 Ship 8 (v1.418): the loading-gate machinery was deleted, so all of the legacy gate
// session/timing/restriction fields are gone. What survives: dialog visibility, UI cache state,
// position-debug state, vehicle-timer admin override, combat HUD reveal arming, and section
// signature caches that drive the ready-dialog refresh-while-hidden path.
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
    // Sticks after the admin-panel position-debug toggle is pressed so subsequent reveal
    // paths (respawn, team-swap re-warm, ready-dialog close) stop re-asserting posDebugVisible=true.
    posDebugAdminOverride: boolean;
    vehicleTimersVisibleWhileDeployed: boolean;
    combatHudRevealAllowed: boolean;
    lastButtonSignature: string;
    lastRosterSignature: string;
    lastModeConfigSignature: string;
    lastMapSignature: string;
}

// Per-player state lives in State.players:
// - readyDialogData: dialog + interact-point state per player.
// - readyByPid: READY toggle state for roster + auto-start gating.
// - inMainBaseByPid: main-base presence for pre-live gating + UI.

//#endregion ----------------- Ready Dialog Interaction Data + Config --------------------

