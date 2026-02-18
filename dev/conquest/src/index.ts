// @ts-nocheck
import './header-file';
import './Changelog';
import './types';
import './config/types';
import './config/maps';
import './config/runtime';
import './config/map-runtime';
import './strings/ui-ids';
import './state/core';
import './state/id-helpers';
import './state/ui-helpers';
import './state/player-lookup';
import './state/hud-cache-types';
import './state/runtime';
import './hud/status';
import './hud/victory';
import './hud/help-visibility';
import './hud/build-victory-dialog';
import './hud/build';
import './hud/update-helpers';
import './vehicles/array-helpers';
import './vehicles/ownership';
import './vehicles/registration';
import './vehicles/spawner-slots';
import './vehicles/spawner-sequence';
import './vehicles/spawner-bind';
import './vehicles/spawner-bootstrap';
import './clock/state';
import './clock/ui';
import './interaction/types';
import './interaction/interact-point';
import './interaction/actions';
import './interaction/ui-events-ready';
import './admin-panel/events';
import './interaction/ui-events';
import './admin-panel/build';
import './admin-panel/visibility';
import './ready-dialog/dialog-build-sections';
import './ready-dialog/dialog-build-mode-config';
import './ready-dialog/dialog-build-roster';
import './ready-dialog/dialog-build';
import './ready-dialog/roster-render';
import './ready-dialog/mode-config-readout';
import './ready-dialog/mode-config-aircraft-ceiling';
import './ready-dialog/mode-config-presets';
import './ready-dialog/matchup-summary';
import './ready-dialog/join-prompt-ids';
import './ready-dialog/join-prompt-layout';
import './ready-dialog/join-prompt-events';
import './ready-dialog/ready-reset';
import './ready-dialog/takeoff-gating';
import './ready-dialog/roster-active';
import './ready-dialog/pregame-ui';
import './ready-dialog/countdown-flow';
import './ready-dialog/auto-start';
import './ready-dialog/swap-action';
import './conquest-flow';
import './utils/multi-click';
import './utils/main-base';

import './index/game-mode';
import './index/player-join-leave';
import './index/player-deploy';
import './index/player-loop-inputs';
import './index/vehicle-events';
import './index/area-triggers';

// Exported entrypoints required by BF6 Portal runtime.
export async function OnGameModeStarted(): Promise<void> {
    return onGameModeStartedImpl();
}

export async function OnPlayerJoinGame(eventPlayer: mod.Player): Promise<void> {
    return onPlayerJoinGameImpl(eventPlayer);
}

export function OnPlayerLeaveGame(eventNumber: number | mod.Player): void {
    onPlayerLeaveGameImpl(eventNumber);
}

export async function OnPlayerDeployed(eventPlayer: mod.Player): Promise<void> {
    return onPlayerDeployedImpl(eventPlayer);
}

export function OnPlayerUndeploy(eventPlayer: mod.Player): void {
    onPlayerUndeployImpl(eventPlayer);
}

export function OngoingPlayer(eventPlayer: mod.Player): void {
    ongoingPlayerImpl(eventPlayer);
}

export function OnPlayerInteract(eventPlayer: mod.Player, eventInteractPoint: mod.InteractPoint): void {
    onPlayerInteractImpl(eventPlayer, eventInteractPoint);
}

export function OnPlayerUIButtonEvent(
    eventPlayer: mod.Player,
    eventUIWidget: mod.UIWidget,
    eventUIButtonEvent: mod.UIButtonEvent
): void {
    onPlayerUIButtonEventImpl(eventPlayer, eventUIWidget, eventUIButtonEvent);
}

export function OnPlayerEnterVehicle(eventPlayer: mod.Player, eventVehicle: mod.Vehicle): void {
    onPlayerEnterVehicleImpl(eventPlayer, eventVehicle);
}

export function OnPlayerExitVehicle(eventPlayer: mod.Player, eventVehicle: mod.Vehicle): void {
    onPlayerExitVehicleImpl(eventPlayer, eventVehicle);
}

export async function OnVehicleSpawned(eventVehicle: mod.Vehicle): Promise<void> {
    return onVehicleSpawnedImpl(eventVehicle);
}

export async function OnVehicleDestroyed(eventVehicle: mod.Vehicle): Promise<void> {
    return onVehicleDestroyedImpl(eventVehicle);
}

export function OngoingCapturePoint(eventCapturePoint: mod.CapturePoint): void {
    ongoingCapturePointImpl(eventCapturePoint);
}

export function OnPlayerEnterAreaTrigger(eventPlayer: mod.Player, eventAreaTrigger: mod.AreaTrigger): void {
    onPlayerEnterAreaTriggerImpl(eventPlayer, eventAreaTrigger);
}

export function OnPlayerExitAreaTrigger(eventPlayer: mod.Player, eventAreaTrigger: mod.AreaTrigger): void {
    onPlayerExitAreaTriggerImpl(eventPlayer, eventAreaTrigger);
}
