// @ts-nocheck
// Module: interaction/ui-events -- dispatcher for ready-dialog and admin-panel button handlers

function teamSwitchButtonEvent(
    eventPlayer: mod.Player,
    eventUIWidget: mod.UIWidget,
    eventUIButtonEvent: mod.UIButtonEvent
): void {
    const playerId = mod.GetObjId(eventPlayer);
    const widgetName = mod.GetUIWidgetName(eventUIWidget);

    if (handleArmMenuEvt(eventPlayer, eventUIWidget, eventUIButtonEvent)) return;
    if (tryHandleVehicleDeployTimerButtonEvent(eventPlayer, eventUIWidget, eventUIButtonEvent)) return;
    if (tryHandleReadyDialogButtonEvent(eventPlayer, playerId, widgetName, eventUIButtonEvent)) return;
    if (FEATURE_ADMIN_PANEL && tryHandleAdminTesterButtonEvent(eventPlayer, playerId, widgetName, eventUIButtonEvent)) return;
}

