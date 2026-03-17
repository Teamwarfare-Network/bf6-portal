// @ts-nocheck
// Module: ui/admin/action-counter -- top-right admin action counter HUD widget

function buildConquestAdminActionCounterWidget(player: mod.Player, pid: number, refs: HudRefs): void {
    const auditCounter = modlib.ParseUI({
        name: `AdminPanelActionCount_${pid}`,
        type: "Text",
        playerId: player,
        position: [20, 22 + CONQUEST_HUD_NON_CLOCK_SHIFT_Y],
        size: [60, 12],
        anchor: mod.UIAnchor.TopRight,
        visible: false,
        padding: 0,
        bgAlpha: 0,
        bgFill: mod.UIBgFill.None,
        textLabel: mod.Message(mod.stringkeys.twl.adminPanel.actionCountFormat, 0),
        textColor: [1, 1, 1],
        textAlpha: 1,
        textSize: 10,
        textAnchor: mod.UIAnchor.CenterRight,
    });
    if (auditCounter) refs.roots.push(auditCounter);
    refs.adminPanelActionCountText = safeFind(`AdminPanelActionCount_${pid}`);
}
