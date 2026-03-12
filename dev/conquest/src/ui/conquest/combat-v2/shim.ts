// @ts-nocheck
// Module: ui/conquest/combat-v2/shim -- compatibility no-ops for removed combat-v2 runtime path

// No-op reset for legacy combat-v2 global lifecycle call sites.
function resetAllConquestCombatHudV2(): void {}

// No-op purge for legacy combat-v2 global lifecycle call sites.
function hardPurgeConquestCombatHudV2ForConnectedPlayers(): void {}

// No-op scheduler reset for legacy combat-v2 global lifecycle call sites.
function resetConquestCombatHudV2Scheduler(): void {}

// No-op per-player reset for legacy combat-v2 global lifecycle call sites.
function resetConquestCombatHudV2ForPid(_pid: number): void {}

// No-op swap-pending setter for legacy combat-v2 global lifecycle call sites.
function setConquestCombatHudV2TeamSwapPending(_pid: number, _pending: boolean): void {}

// No-op main-cadence dirty marker for legacy combat-v2 global lifecycle call sites.
function markConquestCombatHudV2DirtyForPid(_pid: number): void {}

// No-op animation-cadence dirty marker for legacy combat-v2 global lifecycle call sites.
function markConquestCombatHudV2AnimationDirtyForPid(_pid: number): void {}

// No-op destroy for legacy combat-v2 global lifecycle call sites.
function destroyConquestCombatHudV2ForPid(_pid: number): void {}

// No-op global hide for legacy combat-v2 global lifecycle call sites.
function hideAllConquestCombatHudV2(): void {}

// No-op main tick for legacy combat-v2 owner call sites.
function conquestCombatHudV2TickMain(_force?: boolean): void {}

// No-op animation tick for legacy combat-v2 owner call sites.
function conquestCombatHudV2TickAnimation(_force?: boolean): void {}
