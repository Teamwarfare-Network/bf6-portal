// @ts-nocheck
// Module: interaction/types -- per-player ready-dialog interaction data and config types

//#region -------------------- Ready Dialog Interaction Data + Config --------------------

interface ReadyDialogInteractConfig {
    enableReadyDialog: boolean;
    interactPointMinLifetime: number;
    interactPointMaxLifetime: number;
    velocityThreshold: number;
}

type UiLoadReason = "join" | "team_swap" | "refresh";

// Temporary audit mode requested by the user: no human player should ever be allowed to deploy,
// and any player that still reaches the world must be frozen and pushed back out immediately.
const HARD_PLAYER_LOCK_AUDIT_MODE = false;
// Conservative first-join gate mode:
// keep deploy owned by one join-only release path, hold for a minimum blocked window,
// warm UI in the background, then release or fall back after the hard timeout.
const JOIN_CONSERVATIVE_FIRST_JOIN_GATE_MODE = true;
const JOIN_CONSERVATIVE_FIRST_JOIN_MIN_LOCK_SECONDS = 15;
const JOIN_CONSERVATIVE_FIRST_JOIN_FALLBACK_SECONDS = 30;

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
    uiLoadLastEventDebugCode: number;
    uiLoadTrace: string[];
    readyDialogWarmPrimed: boolean;
    readyDialogHotReady: boolean;
    gadgetMenuHotReady: boolean;
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

