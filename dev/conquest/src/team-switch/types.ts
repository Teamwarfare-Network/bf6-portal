// @ts-nocheck
// Module: team-switch/types -- per-player team switch data and config types

//#region -------------------- Team Switch Data + Config --------------------

interface TeamSwitchConfig {
    enableTeamSwitch: boolean;
    interactPointMinLifetime: number;
    interactPointMaxLifetime: number;
    velocityThreshold: number;
}

interface teamSwitchData_t {
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
// - teamSwitchData: dialog + interact-point state per player.
// - readyByPid: READY toggle state for roster + auto-start gating.
// - inMainBaseByPid: main-base presence for pre-live gating + UI.

//#endregion ----------------- Team Switch Data + Config --------------------
