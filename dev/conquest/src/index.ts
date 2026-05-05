// @ts-nocheck
import './header-file';
import './types';
import './config/types';
import './config/conquest-constants';
import './config/maps';
import './config/runtime';
import './config/map-runtime';
import './strings/ui-ids';
import './ready-dialog/mode-config-schema';
import './state/core';
import './state/lifecycle-guardrails';
import './state/id-helpers';
import './state/ui-helpers';
import './state/player-lookup';
import './state/tick-context';
import './state/player-iteration';
import './state/hud-cache-types';
import './state/runtime';
import './state/spawn-charge';
import './admin/identity';
import './hud/status';
import './hud/help-visibility';
import './hud/conquest-scaffold';
import './ui/dialog/victory';
import './ui/dialog/victory-build';
import './ui/branding/top-left';
import './ui/ready/ready-line';
// import './ui/admin/action-counter'; // @feature FEATURE_ADMIN_PANEL
// import './hud/ui-cache-perf'; // @feature FEATURE_PERF_DIAG
// import './hud/perf-diag'; // @feature FEATURE_PERF_DIAG
import './ui/conquest/top-hud-shell';
import './ui/conquest/hud-core/types';
import './ui/conquest/hud-core/constants';
import './ui/conquest/hud-core/names';
import './ui/conquest/hud-core/state';
import './ui/conquest/hud-core/lifecycle';
import './ui/conquest/hud-core/build';
import './ui/conquest/hud-core/validate';
import './ui/conquest/hud-core/render';
import './ui/conquest/hud-core/pipeline';
import './ui/conquest/hud-core/toggle';
import './hud/update-helpers';
// import './hud/position-debug'; // @feature FEATURE_POSITION_DEBUG
import './foundation/bf6-utils/logging';
import './foundation/bf6-utils/callback-handler';
import './foundation/bf6-utils/timers';
import './foundation/bf6-utils/clocks';
import './vehicles/array-helpers';
import './vehicles/vehicle-classification';
import './vehicles/ownership';
import './vehicles/registration';
import './vehicles/timers';
import './vehicles/spawn-volume-math';
import './vehicles/forward-spawn-volume';
import './vehicles/air-spawn-volume';
import './vehicles/spawner-budget';
import './vehicles/vanilla-spawner';
import './vehicles/hq-deploy';
import './vehicles/deploy-live-menu';
import './clock/timer-instance';
import './clock/state';
import './clock/ui';
import './vehicles/deploy-timer-ui';
import './boundary/prompt-ui';
import './boundary/enforcement';
import './boundary/live-prebuild-scheduler';
import './interaction/types';
import './interaction/hud-warm-state';
import './interaction/ui-primary-click';
import './interaction/interact-point';
import './interaction/world-interactables';
import './interaction/ammo-resupply-menu';
import './interaction/build-pacer';
import './interaction/lazy-build-registry';
import './interaction/supply-box-warm-scheduler';
import './interaction/actions';
import './interaction/spawn-selector';
import './interaction/ui-events-ready';
// import './admin-panel/events'; // @feature FEATURE_ADMIN_PANEL
import './interaction/ui-events-player-ready-panel';
import './interaction/ui-events';
// import './admin-panel/build'; // @feature FEATURE_ADMIN_PANEL
// import './admin-panel/visibility'; // @feature FEATURE_ADMIN_PANEL
import './ready-dialog/dialog-build-sections';
import './ready-dialog/dialog-build-mode-config';
import './ready-dialog/dialog-build-roster';
import './ready-dialog/lifecycle';
import './ready-dialog/dialog-build';
import './ready-dialog/roster-render';
import './ready-dialog/mode-config-readout';
import './ready-dialog/mode-config-aircraft-ceiling';
import './ready-dialog/mode-config-presets';
import './ready-dialog/matchup-summary';
// import './ready-dialog/join-prompt-ids'; // @feature FEATURE_JOIN_PROMPT
// import './ready-dialog/join-prompt-layout'; // @feature FEATURE_JOIN_PROMPT
// import './ready-dialog/join-prompt-events'; // @feature FEATURE_JOIN_PROMPT
import './ready-dialog/ready-reset';
import './ready-dialog/takeoff-gating';
import './ready-dialog/roster-active';
import './ready-dialog/pregame-ui';
import './ready-dialog/countdown-flow';
import './ready-dialog/auto-start';
import './ready-dialog/swap-action';
import './ready-dialog/player-ready-panel';
import './conquest-flow';
import './index/capture-shared';
import './index/capture-sound';
import './index/capture-vo';
import './index/delay-broadcast';
import './utils/multi-click';
import './utils/main-base';

import './index/game-mode';
import './index/conquest-scaffold';
import './index/capture-tickets';
import './index/player-join-leave';
import './index/player-deploy';
import './index/player-loop-inputs';
import './index/vehicle-events';
import './index/area-triggers';
import './kpi/kpi-state';
import './kpi/scoreboard-tab';
import './index/player-kpi-events';

// Exported entrypoints required by BF6 Portal runtime.
// Forwards game-mode start into the internal startup orchestrator.
export async function OnGameModeStarted(): Promise<void> {
    return onGameModeStartedImpl();
}

// Forwards player-join lifecycle into Conquest join handling.
// Outer try/catch: an unhandled rejection here can kill the script context and
// trigger an engine-side server abort (suspected v1.469 late-join crash signature).
// Swallow + console-log so the next repro yields a grep-able line, not a silent crash.
export async function OnPlayerJoinGame(eventPlayer: mod.Player): Promise<void> {
    try {
        await onPlayerJoinGameImpl(eventPlayer);
    } catch (err) {
        try { console.log(`[OnPlayerJoinGame] ${(err as any)?.message ?? String(err)}`); } catch {}
    }
}

// Forwards player-leave lifecycle into cleanup and state teardown handling.
export function OnPlayerLeaveGame(eventNumber: number | mod.Player): void {
    onPlayerLeaveGameImpl(eventNumber);
}

// Forwards deploy lifecycle into deploy-state and HUD refresh handling.
export async function OnPlayerDeployed(eventPlayer: mod.Player): Promise<void> {
    return onPlayerDeployedImpl(eventPlayer);
}

// Forwards undeploy lifecycle into deploy-state/HUD suppression handling.
export function OnPlayerUndeploy(eventPlayer: mod.Player): void {
    onPlayerUndeployImpl(eventPlayer);
}

// Forwards per-player ongoing tick processing.
export function OngoingPlayer(eventPlayer: mod.Player): void {
    ongoingPlayerImpl(eventPlayer);
}

// Reserved. Engine calls OngoingGlobal at ~1Hz (too slow for perf diag).
// Tick measurement moved to game-mode loop (~120ms cadence) in v1.087.
export function OngoingGlobal(): void {
}

// Forwards world-interact input events.
export function OnPlayerInteract(eventPlayer: mod.Player, eventInteractPoint: mod.InteractPoint): void {
    onPlayerInteractImpl(eventPlayer, eventInteractPoint);
}

// Forwards UI button events used by ready/admin panels.
export function OnPlayerUIButtonEvent(
    eventPlayer: mod.Player,
    eventUIWidget: mod.UIWidget,
    eventUIButtonEvent: mod.UIButtonEvent
): void {
    onPlayerUIButtonEventImpl(eventPlayer, eventUIWidget, eventUIButtonEvent);
}

// Forwards player-enter-vehicle events for seat ownership and flow updates.
export function OnPlayerEnterVehicle(eventPlayer: mod.Player, eventVehicle: mod.Vehicle): void {
    onPlayerEnterVehicleImpl(eventPlayer, eventVehicle);
}

// Forwards player-exit-vehicle events for seat ownership cleanup.
export function OnPlayerExitVehicle(eventPlayer: mod.Player, eventVehicle: mod.Vehicle): void {
    onPlayerExitVehicleImpl(eventPlayer, eventVehicle);
}

// Forwards vehicle-spawn lifecycle into registration/slot binding.
export async function OnVehicleSpawned(eventVehicle: mod.Vehicle): Promise<void> {
    return onVehicleSpawnedImpl(eventVehicle);
}

// Forwards vehicle-destroyed lifecycle into slot cleanup/respawn sequencing.
export async function OnVehicleDestroyed(eventVehicle: mod.Vehicle): Promise<void> {
    return onVehicleDestroyedImpl(eventVehicle);
}

// Forwards capture-point ongoing ticks into authoritative capture-state sync.
export function OngoingCapturePoint(eventCapturePoint: mod.CapturePoint): void {
    ongoingCapturePointImpl(eventCapturePoint);
}

// Forwards neutralization edge callback for owner-latch updates.
export function OnCapturePointLost(eventCapturePoint: mod.CapturePoint): void {
    onCapturePointLostImpl(eventCapturePoint);
}

// Forwards capture-complete edge callback for owner-latch updates.
export function OnCapturePointCaptured(eventCapturePoint: mod.CapturePoint): void {
    onCapturePointCapturedImpl(eventCapturePoint);
}

// Forwards objective-enter callback for engaged objective ownership.
export function OnPlayerEnterCapturePoint(eventPlayer: mod.Player, eventCapturePoint: mod.CapturePoint): void {
    onPlayerEnterCapturePointImpl(eventPlayer, eventCapturePoint);
}

// Forwards objective-exit callback for engaged objective cleanup.
export function OnPlayerExitCapturePoint(eventPlayer: mod.Player, eventCapturePoint: mod.CapturePoint): void {
    onPlayerExitCapturePointImpl(eventPlayer, eventCapturePoint);
}

// Forwards area-trigger enter callback for main-base gating state.
export function OnPlayerEnterAreaTrigger(eventPlayer: mod.Player, eventAreaTrigger: mod.AreaTrigger): void {
    onPlayerEnterAreaTriggerImpl(eventPlayer, eventAreaTrigger);
}

// Forwards area-trigger exit callback for main-base/ready enforcement.
export function OnPlayerExitAreaTrigger(eventPlayer: mod.Player, eventAreaTrigger: mod.AreaTrigger): void {
    onPlayerExitAreaTriggerImpl(eventPlayer, eventAreaTrigger);
}

// Forwards kill-credit events into KPI tracking.
export function OnPlayerEarnedKill(
    eventPlayer: mod.Player,
    eventOtherPlayer: mod.Player,
    eventDeathType: mod.DeathType,
    eventWeaponUnlock: mod.WeaponUnlock
): void {
    onPlayerEarnedKillImpl(eventPlayer, eventOtherPlayer, eventDeathType, eventWeaponUnlock);
}

// Forwards kill-assist events into KPI tracking.
export function OnPlayerEarnedKillAssist(eventPlayer: mod.Player, eventOtherPlayer: mod.Player): void {
    onPlayerEarnedKillAssistImpl(eventPlayer, eventOtherPlayer);
}

