// @ts-nocheck
// Module: team-switch/ui-events -- dispatcher for ready-dialog and admin/tester button handlers

function teamSwitchButtonEvent(
    eventPlayer: mod.Player,
    eventUIWidget: mod.UIWidget,
    eventUIButtonEvent: mod.UIButtonEvent
): void {
    const playerId = mod.GetObjId(eventPlayer);
    const widgetName = mod.GetUIWidgetName(eventUIWidget);

    if (tryHandleReadyDialogButtonEvent(eventPlayer, playerId, widgetName)) return;
    if (tryHandleAdminTesterButtonEvent(eventPlayer, playerId, widgetName)) return;
}

