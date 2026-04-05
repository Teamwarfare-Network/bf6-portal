// @ts-nocheck
// Module: interaction/types -- per-player ready-dialog interaction data and config types

//#region -------------------- Ready Dialog Interaction Data + Config --------------------

interface ReadyDialogInteractConfig {
    enableReadyDialog: boolean;
    interactPointMinLifetime: number;
    interactPointMaxLifetime: number;
    velocityThreshold: number;
}

type UiLoadReason = "join" | "team_swap";

// Unified loading gate mode (replaces the old conservative/non-conservative split).
// One gate entry point for both first-join and team-swap; released only after
// all UI families are warm and the floor window has elapsed.

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
    hudWarmToken: number;
    hudWarmCompleted: boolean;
    hudSwapTransitionActive: boolean;
    combatHudRevealAllowed: boolean;
    uiLoadGateActive: boolean;
    uiLoadGateReleased: boolean;
    uiLoadSessionId: number;
    uiLoadReason: UiLoadReason;
    uiLoadOverlayShown: boolean;
    uiCriticalRevealCompleted: boolean;
    uiProductionMenusWarm: boolean;
    uiPostDeployFinalizeActive: boolean;
    uiJoinDeployLockActive: boolean;
    uiSlipUndeployLastAttemptAt: number;
    uiLoadDeployEnabled: boolean;
    uiLoadDeployAuthorized: boolean;
    uiLoadInputRestricted: boolean;
    readyDialogWarmPrimed: boolean;
    readyDialogHotReady: boolean;
    gadgetMenuHotReady: boolean;
    // Unified gate timing: set when beginLoadingGate starts, used by runLoadingGateUntilReady for floor/timeout checks.
    gateStartTime: number;
    safetyFloorTriggered: boolean;
    safetyTimeoutTriggered: boolean;
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

