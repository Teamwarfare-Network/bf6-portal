// @ts-nocheck
// Module: ui/conquest/popout-render -- active objective popout render ownership

// Ensures HUD refs are available for one player id and returns the freshest cache entry.
function conquestPhase3EnsureHudRefsForPid(pid: number): HudRefs | undefined {
    const viewer = safeFindPlayer(pid);
    if (viewer && mod.IsPlayerValid(viewer)) {
        return ensureHudForPlayer(viewer) ?? State.hudCache.hudByPid[pid];
    }
    return State.hudCache.hudByPid[pid];
}

// Renders the active-objective pop-out widgets only.
function renderConquestActiveFlagPopoutForPid(
    refs: HudRefs,
    popout: ConquestHudActiveFlagPopoutViewModel
): void {
    const pid = refs.pid;
    let targetRefs = refs;
    let popoutRoot = targetRefs.conquestFlagsActivePopoutRoot;
    let popoutSlot = targetRefs.conquestFlagsActivePopoutSlot;
    let popoutBorder = targetRefs.conquestFlagsActivePopoutBorder;
    let popoutFill = targetRefs.conquestFlagsActivePopoutFill;
    let popoutLabelShadowRight = targetRefs.conquestFlagsActivePopoutLabelShadowRight;
    let popoutLabelShadowLeft = targetRefs.conquestFlagsActivePopoutLabelShadowLeft;
    let popoutLabelShadowUp = targetRefs.conquestFlagsActivePopoutLabelShadowUp;
    let popoutLabelShadowDown = targetRefs.conquestFlagsActivePopoutLabelShadowDown;
    let popoutLabelShadowUpLeft = targetRefs.conquestFlagsActivePopoutLabelShadowUpLeft;
    let popoutLabelShadowUpRight = targetRefs.conquestFlagsActivePopoutLabelShadowUpRight;
    let popoutLabelShadowDownRight = targetRefs.conquestFlagsActivePopoutLabelShadowDownRight;
    let popoutLabelShadowDownLeft = targetRefs.conquestFlagsActivePopoutLabelShadowDownLeft;
    let popoutLabel = targetRefs.conquestFlagsActivePopoutLabel;
    let popoutPercentRoot = targetRefs.conquestFlagsActivePopoutPercentRoot;
    let popoutPercentShadowRight = targetRefs.conquestFlagsActivePopoutPercentShadowRight;
    let popoutPercentShadowLeft = targetRefs.conquestFlagsActivePopoutPercentShadowLeft;
    let popoutPercentShadowUp = targetRefs.conquestFlagsActivePopoutPercentShadowUp;
    let popoutPercentShadowDown = targetRefs.conquestFlagsActivePopoutPercentShadowDown;
    let popoutPercentShadowUpLeft = targetRefs.conquestFlagsActivePopoutPercentShadowUpLeft;
    let popoutPercentShadowUpRight = targetRefs.conquestFlagsActivePopoutPercentShadowUpRight;
    let popoutPercentShadowDownRight = targetRefs.conquestFlagsActivePopoutPercentShadowDownRight;
    let popoutPercentShadowDownLeft = targetRefs.conquestFlagsActivePopoutPercentShadowDownLeft;
    let popoutPercentShadowInner = targetRefs.conquestFlagsActivePopoutPercentShadowInner;
    let popoutPercentText = targetRefs.conquestFlagsActivePopoutPercentText;

    if (
        !popoutRoot
        || !popoutSlot
        || !popoutBorder
        || !popoutFill
        || !popoutLabelShadowRight
        || !popoutLabelShadowLeft
        || !popoutLabelShadowUp
        || !popoutLabelShadowDown
        || !popoutLabelShadowUpLeft
        || !popoutLabelShadowUpRight
        || !popoutLabelShadowDownRight
        || !popoutLabelShadowDownLeft
        || !popoutLabel
        || !popoutPercentRoot
        || !popoutPercentShadowRight
        || !popoutPercentShadowLeft
        || !popoutPercentShadowUp
        || !popoutPercentShadowDown
        || !popoutPercentShadowUpLeft
        || !popoutPercentShadowUpRight
        || !popoutPercentShadowDownRight
        || !popoutPercentShadowDownLeft
        || !popoutPercentShadowInner
        || !popoutPercentText
    ) {
        const refreshed = conquestPhase3EnsureHudRefsForPid(pid);
        if (refreshed) {
            targetRefs = refreshed;
            popoutRoot = targetRefs.conquestFlagsActivePopoutRoot;
            popoutSlot = targetRefs.conquestFlagsActivePopoutSlot;
            popoutBorder = targetRefs.conquestFlagsActivePopoutBorder;
            popoutFill = targetRefs.conquestFlagsActivePopoutFill;
            popoutLabelShadowRight = targetRefs.conquestFlagsActivePopoutLabelShadowRight;
            popoutLabelShadowLeft = targetRefs.conquestFlagsActivePopoutLabelShadowLeft;
            popoutLabelShadowUp = targetRefs.conquestFlagsActivePopoutLabelShadowUp;
            popoutLabelShadowDown = targetRefs.conquestFlagsActivePopoutLabelShadowDown;
            popoutLabelShadowUpLeft = targetRefs.conquestFlagsActivePopoutLabelShadowUpLeft;
            popoutLabelShadowUpRight = targetRefs.conquestFlagsActivePopoutLabelShadowUpRight;
            popoutLabelShadowDownRight = targetRefs.conquestFlagsActivePopoutLabelShadowDownRight;
            popoutLabelShadowDownLeft = targetRefs.conquestFlagsActivePopoutLabelShadowDownLeft;
            popoutLabel = targetRefs.conquestFlagsActivePopoutLabel;
            popoutPercentRoot = targetRefs.conquestFlagsActivePopoutPercentRoot;
            popoutPercentShadowRight = targetRefs.conquestFlagsActivePopoutPercentShadowRight;
            popoutPercentShadowLeft = targetRefs.conquestFlagsActivePopoutPercentShadowLeft;
            popoutPercentShadowUp = targetRefs.conquestFlagsActivePopoutPercentShadowUp;
            popoutPercentShadowDown = targetRefs.conquestFlagsActivePopoutPercentShadowDown;
            popoutPercentShadowUpLeft = targetRefs.conquestFlagsActivePopoutPercentShadowUpLeft;
            popoutPercentShadowUpRight = targetRefs.conquestFlagsActivePopoutPercentShadowUpRight;
            popoutPercentShadowDownRight = targetRefs.conquestFlagsActivePopoutPercentShadowDownRight;
            popoutPercentShadowDownLeft = targetRefs.conquestFlagsActivePopoutPercentShadowDownLeft;
            popoutPercentShadowInner = targetRefs.conquestFlagsActivePopoutPercentShadowInner;
            popoutPercentText = targetRefs.conquestFlagsActivePopoutPercentText;
        }
    }

    if (
        !popoutRoot
        || !popoutSlot
        || !popoutBorder
        || !popoutFill
        || !popoutLabelShadowRight
        || !popoutLabelShadowLeft
        || !popoutLabelShadowUp
        || !popoutLabelShadowDown
        || !popoutLabelShadowUpLeft
        || !popoutLabelShadowUpRight
        || !popoutLabelShadowDownRight
        || !popoutLabelShadowDownLeft
        || !popoutLabel
        || !popoutPercentRoot
        || !popoutPercentShadowRight
        || !popoutPercentShadowLeft
        || !popoutPercentShadowUp
        || !popoutPercentShadowDown
        || !popoutPercentShadowUpLeft
        || !popoutPercentShadowUpRight
        || !popoutPercentShadowDownRight
        || !popoutPercentShadowDownLeft
        || !popoutPercentShadowInner
        || !popoutPercentText
    ) {
        conquestPhase3MarkHudDirty();
        return;
    }

    const labelGroup: ConquestShadowTextWidgetSet = {
        right: popoutLabelShadowRight,
        left: popoutLabelShadowLeft,
        up: popoutLabelShadowUp,
        down: popoutLabelShadowDown,
        upLeft: popoutLabelShadowUpLeft,
        upRight: popoutLabelShadowUpRight,
        downRight: popoutLabelShadowDownRight,
        downLeft: popoutLabelShadowDownLeft,
        text: popoutLabel,
    };
    const percentGroup: ConquestShadowTextWidgetSet = {
        right: popoutPercentShadowRight,
        left: popoutPercentShadowLeft,
        up: popoutPercentShadowUp,
        down: popoutPercentShadowDown,
        upLeft: popoutPercentShadowUpLeft,
        upRight: popoutPercentShadowUpRight,
        downRight: popoutPercentShadowDownRight,
        downLeft: popoutPercentShadowDownLeft,
        inner: popoutPercentShadowInner,
        text: popoutPercentText,
    };

    safeSetUIWidgetVisible(popoutRoot, popout.visible);
    if (!popout.visible) {
        safeSetUIWidgetVisible(popoutSlot, false);
        safeSetUIWidgetVisible(popoutBorder, false);
        safeSetUIWidgetVisible(popoutFill, false);
        safeSetUIWidgetVisible(popoutPercentRoot, false);
        conquestPhase3SetShadowTextGroupVisible(labelGroup, false);
        conquestPhase3SetShadowTextGroupVisible(percentGroup, false);
        return;
    }

    safeSetUIWidgetVisible(popoutSlot, true);
    safeSetUIWidgetBgColor(
        popoutSlot,
        popout.slotBgColor ?? mod.CreateVector(
            CONQUEST_HUD_FLAG_SLOT_TRACK_RGB[0],
            CONQUEST_HUD_FLAG_SLOT_TRACK_RGB[1],
            CONQUEST_HUD_FLAG_SLOT_TRACK_RGB[2]
        )
    );
    safeSetUIWidgetVisible(popoutBorder, popout.borderVisible && !!popout.borderColor);
    if (popout.borderVisible && popout.borderColor) {
        safeSetUIWidgetBgColor(popoutBorder, popout.borderColor);
    }
    conquestPhase3SetShadowTextGroupVisible(labelGroup, popout.labelVisible);
    if (popout.labelVisible && popout.labelMessage && popout.labelColor) {
        conquestPhase3SetShadowTextGroupLabel(labelGroup, popout.labelMessage);
        conquestPhase3SetShadowTextGroupColors(labelGroup, popout.labelColor);
    }

    if (popout.fillVisible && popout.fillColor) {
        safeSetUIWidgetVisible(popoutFill, true);
        safeSetUIWidgetPosition(
            popoutFill,
            mod.CreateVector(CONQUEST_HUD_FLAG_ACTIVE_POPOUT_FILL_INSET_X, popout.fillY, 0)
        );
        safeSetUIWidgetSize(
            popoutFill,
            mod.CreateVector(CONQUEST_HUD_FLAG_ACTIVE_POPOUT_FILL_MAX_WIDTH, popout.fillHeight, 0)
        );
        safeSetUIWidgetBgColor(popoutFill, popout.fillColor);
    } else {
        safeSetUIWidgetVisible(popoutFill, false);
    }

    safeSetUIWidgetVisible(popoutPercentRoot, popout.percentVisible);
    if (popout.percentVisible && popout.percentMessage && popout.percentColor) {
        conquestPhase3SetShadowTextGroupVisible(percentGroup, true);
        conquestPhase3SetShadowTextGroupLabel(percentGroup, popout.percentMessage);
        conquestPhase3SetShadowTextGroupColors(percentGroup, popout.percentColor);
    } else {
        conquestPhase3SetShadowTextGroupVisible(percentGroup, false);
    }
}
