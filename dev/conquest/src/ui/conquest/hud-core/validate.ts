// @ts-nocheck
// Module: ui/conquest/hud-core/validate -- strict centered root-chain validation for hard-cut combat HUD

function twlConquestHudWidgetHasParent(
    widget: mod.UIWidget | undefined,
    parent: mod.UIWidget | undefined
): boolean {
    if (!widget || !parent) return false;
    try {
        const actualParent = mod.GetUIWidgetParent(widget);
        return !!actualParent && actualParent === parent;
    } catch {
        return false;
    }
}

function twlConquestHudWidgetHasAnchor(widget: mod.UIWidget | undefined, anchor: mod.UIAnchor): boolean {
    if (!widget) return false;
    try {
        return mod.GetUIWidgetAnchor(widget) === anchor;
    } catch {
        return false;
    }
}

function twlConquestHudWidgetHasPosition(
    widget: mod.UIWidget | undefined,
    x: number,
    y: number,
    tolerance: number = 0.5
): boolean {
    if (!widget) return false;
    try {
        const pos = mod.GetUIWidgetPosition(widget);
        return (mod.AbsoluteValue(mod.XComponentOf(pos) - x) <= tolerance)
            && (mod.AbsoluteValue(mod.YComponentOf(pos) - y) <= tolerance);
    } catch {
        return false;
    }
}

function twlConquestHudValidateCriticalRefs(entry: TwlConquestHudPlayerEntry): boolean {
    if (!entry || !entry.initialized) return false;
    const root = entry.widgets.root;
    const combatLane = entry.widgets.combatLane;
    const ticketsLane = entry.widgets.ticketsLane;
    const objectivesLane = entry.widgets.objectivesLane;
    const blueBox = entry.widgets.ticketBlueBox;
    const redBox = entry.widgets.ticketRedBox;
    const blueTeamNameShadow = entry.widgets.ticketBlueTeamNameShadowRing;
    const blueTeamName = entry.widgets.ticketBlueTeamName;
    const redTeamNameShadow = entry.widgets.ticketRedTeamNameShadowRing;
    const redTeamName = entry.widgets.ticketRedTeamName;
    const blueCount = entry.widgets.ticketBlueCount;
    const redCount = entry.widgets.ticketRedCount;
    const slash = entry.widgets.ticketSlash;
    const blueTrack = entry.widgets.ticketBlueBarTrack;
    const blueFill = entry.widgets.ticketBlueBarFill;
    const redTrack = entry.widgets.ticketRedBarTrack;
    const redFill = entry.widgets.ticketRedBarFill;

    if (
        !root
        || !combatLane
        || !ticketsLane
        || !objectivesLane
        || !blueBox
        || !redBox
        || !blueTeamNameShadow
        || !blueTeamName
        || !redTeamNameShadow
        || !redTeamName
        || !blueCount
        || !redCount
        || !slash
        || !blueTrack
        || !blueFill
        || !redTrack
        || !redFill
    ) return false;

    const topHudRoot = ensureTopHudRootForPid(entry.pid);
    if (!topHudRoot) return false;
    if (!twlConquestHudWidgetHasParent(root, topHudRoot)) return false;
    if (!twlConquestHudWidgetHasAnchor(root, mod.UIAnchor.TopCenter)) return false;
    if (!twlConquestHudWidgetHasPosition(root, 0, 0)) return false;

    if (!twlConquestHudWidgetHasParent(combatLane, root)) return false;
    if (!twlConquestHudWidgetHasAnchor(combatLane, mod.UIAnchor.TopCenter)) return false;
    if (!twlConquestHudWidgetHasPosition(combatLane, TWL_CONQUEST_HUD_COMBAT_X, TWL_CONQUEST_HUD_COMBAT_Y)) return false;

    if (!twlConquestHudWidgetHasParent(ticketsLane, combatLane)) return false;
    if (!twlConquestHudWidgetHasAnchor(ticketsLane, mod.UIAnchor.TopCenter)) return false;
    if (!twlConquestHudWidgetHasPosition(ticketsLane, TWL_CONQUEST_HUD_TICKETS_X, TWL_CONQUEST_HUD_TICKETS_Y)) return false;

    if (!twlConquestHudWidgetHasParent(objectivesLane, combatLane)) return false;
    if (!twlConquestHudWidgetHasAnchor(objectivesLane, mod.UIAnchor.TopCenter)) return false;
    if (!twlConquestHudWidgetHasPosition(objectivesLane, TWL_CONQUEST_HUD_OBJECTIVES_X, TWL_CONQUEST_HUD_OBJECTIVES_Y)) return false;

    if (!twlConquestHudWidgetHasParent(blueBox, ticketsLane)) return false;
    if (!twlConquestHudWidgetHasParent(redBox, ticketsLane)) return false;
    const blueTeamShadowFirst = blueTeamNameShadow[0];
    const redTeamShadowFirst = redTeamNameShadow[0];
    if (!blueTeamShadowFirst || !redTeamShadowFirst) return false;
    if (!twlConquestHudWidgetHasParent(blueTeamShadowFirst, root)) return false;
    if (!twlConquestHudWidgetHasParent(blueTeamName, root)) return false;
    if (!twlConquestHudWidgetHasParent(redTeamShadowFirst, root)) return false;
    if (!twlConquestHudWidgetHasParent(redTeamName, root)) return false;
    if (!twlConquestHudWidgetHasParent(blueCount, blueBox)) return false;
    if (!twlConquestHudWidgetHasParent(redCount, redBox)) return false;
    if (!twlConquestHudWidgetHasParent(slash, ticketsLane)) return false;
    if (!twlConquestHudWidgetHasParent(blueTrack, ticketsLane)) return false;
    if (!twlConquestHudWidgetHasParent(blueFill, blueTrack)) return false;
    if (!twlConquestHudWidgetHasParent(redTrack, ticketsLane)) return false;
    if (!twlConquestHudWidgetHasParent(redFill, redTrack)) return false;
    const ticketLayout = twlConquestHudBuildTicketLayout();
    if (!twlConquestHudWidgetHasPosition(blueBox, ticketLayout.blueCountX, TWL_CONQUEST_HUD_TICKET_BLUE_COUNT_Y)) return false;
    if (!twlConquestHudWidgetHasPosition(redBox, ticketLayout.redCountX, TWL_CONQUEST_HUD_TICKET_RED_COUNT_Y)) return false;
    if (!twlConquestHudWidgetHasPosition(blueTeamName, twlConquestHudGetTicketBlueTeamLabelRootX(ticketLayout), TWL_CONQUEST_HUD_TICKET_TEAM_LABEL_ROOT_Y)) return false;
    if (!twlConquestHudWidgetHasPosition(redTeamName, twlConquestHudGetTicketRedTeamLabelRootX(ticketLayout), TWL_CONQUEST_HUD_TICKET_TEAM_LABEL_ROOT_Y)) return false;
    if (!twlConquestHudWidgetHasPosition(blueTrack, ticketLayout.blueBarX, TWL_CONQUEST_HUD_TICKET_BLUE_BAR_Y)) return false;
    if (!twlConquestHudWidgetHasPosition(redTrack, ticketLayout.redBarX, TWL_CONQUEST_HUD_TICKET_RED_BAR_Y)) return false;

    for (let i = 0; i < TWL_CONQUEST_HUD_OBJECTIVE_SLOT_COUNT; i++) {
        const slotRoot = entry.widgets.objectiveSlotRoots[i];
        const slotBorder = entry.widgets.objectiveSlotBorders[i];
        const slotFill = entry.widgets.objectiveSlotFills[i];
        const slotLabel = entry.widgets.objectiveSlotLabels[i];
        const slotPercent = entry.widgets.objectiveSlotPercents[i];
        if (!slotRoot || !slotBorder || !slotFill || !slotLabel || !slotPercent) return false;
        if (!twlConquestHudWidgetHasParent(slotRoot, objectivesLane)) return false;
        if (!twlConquestHudWidgetHasParent(slotBorder, slotRoot)) return false;
        if (!twlConquestHudWidgetHasParent(slotFill, slotRoot)) return false;
        if (!twlConquestHudWidgetHasParent(slotLabel, slotRoot)) return false;
        if (!twlConquestHudWidgetHasParent(slotPercent, objectivesLane)) return false;
        if (!twlConquestHudWidgetHasPosition(slotRoot, TWL_CONQUEST_HUD_OBJECTIVE_SLOT_X_BY_INDEX[i], TWL_CONQUEST_HUD_OBJECTIVE_SLOT_Y)) return false;
    }

    if (!twlConquestHudWidgetHasParent(entry.widgets.popoutRoot, objectivesLane)) return false;
    if (!twlConquestHudWidgetHasParent(entry.widgets.popoutSlot, entry.widgets.popoutRoot)) return false;
    if (!twlConquestHudWidgetHasParent(entry.widgets.popoutBorder, entry.widgets.popoutSlot)) return false;
    if (!twlConquestHudWidgetHasParent(entry.widgets.popoutFill, entry.widgets.popoutSlot)) return false;
    if (!twlConquestHudWidgetHasParent(entry.widgets.popoutLabel, entry.widgets.popoutSlot)) return false;
    if (!twlConquestHudWidgetHasParent(entry.widgets.popoutPercent, entry.widgets.popoutRoot)) return false;

    if (!twlConquestHudWidgetHasParent(entry.widgets.engageRoot, objectivesLane)) return false;
    if (!twlConquestHudWidgetHasParent(entry.widgets.engageTrack, entry.widgets.engageRoot)) return false;
    if (!twlConquestHudWidgetHasParent(entry.widgets.engageFriendlyFill, entry.widgets.engageTrack)) return false;
    if (!twlConquestHudWidgetHasParent(entry.widgets.engageEnemyFill, entry.widgets.engageTrack)) return false;
    if (!twlConquestHudWidgetHasParent(entry.widgets.engageFriendlyCount, entry.widgets.engageRoot)) return false;
    if (!twlConquestHudWidgetHasParent(entry.widgets.engageEnemyCount, entry.widgets.engageRoot)) return false;
    if (!twlConquestHudWidgetHasParent(entry.widgets.engageStatus, entry.widgets.engageRoot)) return false;

    return true;
}
