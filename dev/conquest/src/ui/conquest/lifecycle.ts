// @ts-nocheck
// Module: ui/conquest/lifecycle -- conquest HUD teardown and duplicate-safe widget deletion

// Deletes all instances of a widget name (defensive against duplicate roots with identical ids).
function deleteAllHudWidgetsByName(name: string, maxPasses: number = 128): void {
    for (let i = 0; i < maxPasses; i++) {
        const widget = safeFind(name);
        if (!widget) return;
        try {
            mod.DeleteUIWidget(widget);
        } catch {
            return;
        }
    }
}

const CONQUEST_TICKET_COUNTER_SHADOW_RING_LAYERS: { suffix: string; offsetX: number; offsetY: number }[] = [
    { suffix: "ShadowRight", offsetX: CONQUEST_HUD_TICKET_COUNTER_SHADOW_RING_OFFSET, offsetY: 0 },
    { suffix: "ShadowLeft", offsetX: -CONQUEST_HUD_TICKET_COUNTER_SHADOW_RING_OFFSET, offsetY: 0 },
    { suffix: "ShadowUp", offsetX: 0, offsetY: -CONQUEST_HUD_TICKET_COUNTER_SHADOW_RING_OFFSET },
    { suffix: "ShadowDown", offsetX: 0, offsetY: CONQUEST_HUD_TICKET_COUNTER_SHADOW_RING_OFFSET },
    {
        suffix: "ShadowUpLeft",
        offsetX: -CONQUEST_HUD_TICKET_COUNTER_SHADOW_RING_OFFSET,
        offsetY: -CONQUEST_HUD_TICKET_COUNTER_SHADOW_RING_OFFSET,
    },
    {
        suffix: "ShadowUpRight",
        offsetX: CONQUEST_HUD_TICKET_COUNTER_SHADOW_RING_OFFSET,
        offsetY: -CONQUEST_HUD_TICKET_COUNTER_SHADOW_RING_OFFSET,
    },
    {
        suffix: "ShadowDownRight",
        offsetX: CONQUEST_HUD_TICKET_COUNTER_SHADOW_RING_OFFSET,
        offsetY: CONQUEST_HUD_TICKET_COUNTER_SHADOW_RING_OFFSET,
    },
    {
        suffix: "ShadowDownLeft",
        offsetX: -CONQUEST_HUD_TICKET_COUNTER_SHADOW_RING_OFFSET,
        offsetY: CONQUEST_HUD_TICKET_COUNTER_SHADOW_RING_OFFSET,
    },
];

// Authoritative conquest HUD teardown for one player id.
// All lifecycle callers (swap, leave, rebuild) should route through this to avoid drift.
function destroyConquestHudForPid(pid: number): void {
    State.conquest.debug.hudGenerationByPid[pid] = (State.conquest.debug.hudGenerationByPid[pid] ?? 0) + 1;

    const baseNames = [
        `ConquestHudRoot_${pid}`,
        `ConquestCombatHudRoot_${pid}`,
        `ConquestTicketsHudRoot_${pid}`,
        `ConquestFlagsHudRoot_${pid}`,
        `ConquestTicketsLaneRoot_${pid}`,
        `ConquestFlagsLaneRoot_${pid}`,
        `ConquestTicketsDebugRoot_${pid}`,
        `ConquestFlagsDebugRoot_${pid}`,
        `ConquestTicketsHudTeam1Container_${pid}`,
        `ConquestTicketsHudTeam2Container_${pid}`,
        `ConquestTicketsHudTeam1Shadow_${pid}`,
        `ConquestTicketsHudTeam1_${pid}`,
        `ConquestTicketsHudTeam1CoreOverlay_${pid}`,
        `ConquestTicketsHudTeam2Shadow_${pid}`,
        `ConquestTicketsHudTeam2_${pid}`,
        `ConquestTicketsHudTeam2CoreOverlay_${pid}`,
        `ConquestTicketsHudSlash_${pid}`,
        `ConquestTicketsHudLeftBarTrack_${pid}`,
        `ConquestTicketsHudLeftBarFill_${pid}`,
        `ConquestTicketsHudRightBarTrack_${pid}`,
        `ConquestTicketsHudRightBarFill_${pid}`,
        `ConquestTicketsHudLeadBorderLeft_${pid}`,
        `ConquestTicketsHudLeadBorderRight_${pid}`,
        `ConquestTicketsHudLeadCrownLeftShadow_${pid}`,
        `ConquestTicketsHudLeadCrownRightShadow_${pid}`,
        `ConquestTicketsHudLeadCrownLeft_${pid}`,
        `ConquestTicketsHudLeadCrownRight_${pid}`,
        `ConquestFlagHudActivePopoutRoot_${pid}`,
        `ConquestFlagHudActivePopoutSlot_${pid}`,
        `ConquestFlagHudActivePopoutBorder_${pid}`,
        `ConquestFlagHudActivePopoutFill_${pid}`,
        `ConquestFlagHudActivePopoutLabelShadowRight_${pid}`,
        `ConquestFlagHudActivePopoutLabelShadowLeft_${pid}`,
        `ConquestFlagHudActivePopoutLabelShadowUp_${pid}`,
        `ConquestFlagHudActivePopoutLabelShadowDown_${pid}`,
        `ConquestFlagHudActivePopoutLabelShadowUpLeft_${pid}`,
        `ConquestFlagHudActivePopoutLabelShadowUpRight_${pid}`,
        `ConquestFlagHudActivePopoutLabelShadowDownRight_${pid}`,
        `ConquestFlagHudActivePopoutLabelShadowDownLeft_${pid}`,
        `ConquestFlagHudActivePopoutLabel_${pid}`,
        `ConquestFlagHudActivePopoutPercentRoot_${pid}`,
        `ConquestFlagHudActivePopoutPercentShadowRight_${pid}`,
        `ConquestFlagHudActivePopoutPercentShadowLeft_${pid}`,
        `ConquestFlagHudActivePopoutPercentShadowUp_${pid}`,
        `ConquestFlagHudActivePopoutPercentShadowDown_${pid}`,
        `ConquestFlagHudActivePopoutPercentShadowUpLeft_${pid}`,
        `ConquestFlagHudActivePopoutPercentShadowUpRight_${pid}`,
        `ConquestFlagHudActivePopoutPercentShadowDownRight_${pid}`,
        `ConquestFlagHudActivePopoutPercentShadowDownLeft_${pid}`,
        `ConquestFlagHudActivePopoutPercentShadowInner_${pid}`,
        `ConquestFlagHudActivePopoutPercentText_${pid}`,
        `ConquestFlagHudEngageRoot_${pid}`,
        `ConquestFlagHudEngageTrack_${pid}`,
        `ConquestFlagHudEngageFriendlyFill_${pid}`,
        `ConquestFlagHudEngageEnemyFill_${pid}`,
        `ConquestFlagHudEngageFriendlyCountBg_${pid}`,
        `ConquestFlagHudEngageEnemyCountBg_${pid}`,
        `ConquestFlagHudEngageFriendlyCountShadow_${pid}`,
        `ConquestFlagHudEngageEnemyCountShadow_${pid}`,
        `ConquestFlagHudEngageFriendlyCount_${pid}`,
        `ConquestFlagHudEngageEnemyCount_${pid}`,
        `ConquestFlagHudEngageStatusShadowRight_${pid}`,
        `ConquestFlagHudEngageStatusShadowLeft_${pid}`,
        `ConquestFlagHudEngageStatusShadowUp_${pid}`,
        `ConquestFlagHudEngageStatusShadowDown_${pid}`,
        `ConquestFlagHudEngageStatusShadowUpLeft_${pid}`,
        `ConquestFlagHudEngageStatusShadowUpRight_${pid}`,
        `ConquestFlagHudEngageStatusShadowDownRight_${pid}`,
        `ConquestFlagHudEngageStatusShadowDownLeft_${pid}`,
        `ConquestFlagHudEngageStatus_${pid}`,
    ];
    for (let i = 0; i < baseNames.length; i++) {
        deleteAllHudWidgetsByName(baseNames[i]);
    }
    for (let teamIndex = 1; teamIndex <= 2; teamIndex++) {
        const teamPrefix = `ConquestTicketsHudTeam${teamIndex}`;
        for (let layerIndex = 0; layerIndex < CONQUEST_TICKET_COUNTER_SHADOW_RING_LAYERS.length; layerIndex++) {
            const layer = CONQUEST_TICKET_COUNTER_SHADOW_RING_LAYERS[layerIndex];
            deleteAllHudWidgetsByName(`${teamPrefix}${layer.suffix}_${pid}`);
        }
    }
    // Purges all bleed-chevron widgets, including shadow layers, across rebuilds.
    for (let chevronIndex = 0; chevronIndex < CONQUEST_HUD_TICKET_BLEED_CHEVRON_COUNT; chevronIndex++) {
        const slot = chevronIndex + 1;
        deleteAllHudWidgetsByName(`ConquestTicketsHudBleedChevronLeft${slot}_${pid}`);
        deleteAllHudWidgetsByName(`ConquestTicketsHudBleedChevronRight${slot}_${pid}`);
        deleteAllHudWidgetsByName(`ConquestTicketsHudBleedChevronLeft${slot}ShadowRight_${pid}`);
        deleteAllHudWidgetsByName(`ConquestTicketsHudBleedChevronLeft${slot}ShadowLeft_${pid}`);
        deleteAllHudWidgetsByName(`ConquestTicketsHudBleedChevronLeft${slot}ShadowUp_${pid}`);
        deleteAllHudWidgetsByName(`ConquestTicketsHudBleedChevronLeft${slot}ShadowDown_${pid}`);
        deleteAllHudWidgetsByName(`ConquestTicketsHudBleedChevronLeft${slot}ShadowUpLeft_${pid}`);
        deleteAllHudWidgetsByName(`ConquestTicketsHudBleedChevronLeft${slot}ShadowUpRight_${pid}`);
        deleteAllHudWidgetsByName(`ConquestTicketsHudBleedChevronLeft${slot}ShadowDownRight_${pid}`);
        deleteAllHudWidgetsByName(`ConquestTicketsHudBleedChevronLeft${slot}ShadowDownLeft_${pid}`);
        deleteAllHudWidgetsByName(`ConquestTicketsHudBleedChevronRight${slot}ShadowRight_${pid}`);
        deleteAllHudWidgetsByName(`ConquestTicketsHudBleedChevronRight${slot}ShadowLeft_${pid}`);
        deleteAllHudWidgetsByName(`ConquestTicketsHudBleedChevronRight${slot}ShadowUp_${pid}`);
        deleteAllHudWidgetsByName(`ConquestTicketsHudBleedChevronRight${slot}ShadowDown_${pid}`);
        deleteAllHudWidgetsByName(`ConquestTicketsHudBleedChevronRight${slot}ShadowUpLeft_${pid}`);
        deleteAllHudWidgetsByName(`ConquestTicketsHudBleedChevronRight${slot}ShadowUpRight_${pid}`);
        deleteAllHudWidgetsByName(`ConquestTicketsHudBleedChevronRight${slot}ShadowDownRight_${pid}`);
        deleteAllHudWidgetsByName(`ConquestTicketsHudBleedChevronRight${slot}ShadowDownLeft_${pid}`);
    }
    for (let slot = 0; slot < 7; slot++) {
        deleteAllHudWidgetsByName(`ConquestFlagHudSlot_${pid}_${slot}`);
        deleteAllHudWidgetsByName(`ConquestFlagHudBorder_${pid}_${slot}`);
        deleteAllHudWidgetsByName(`ConquestFlagHudFill_${pid}_${slot}`);
        deleteAllHudWidgetsByName(`ConquestFlagHudLabelShadowRight_${pid}_${slot}`);
        deleteAllHudWidgetsByName(`ConquestFlagHudLabelShadowLeft_${pid}_${slot}`);
        deleteAllHudWidgetsByName(`ConquestFlagHudLabelShadowUp_${pid}_${slot}`);
        deleteAllHudWidgetsByName(`ConquestFlagHudLabelShadowDown_${pid}_${slot}`);
        deleteAllHudWidgetsByName(`ConquestFlagHudLabelShadowUpLeft_${pid}_${slot}`);
        deleteAllHudWidgetsByName(`ConquestFlagHudLabelShadowUpRight_${pid}_${slot}`);
        deleteAllHudWidgetsByName(`ConquestFlagHudLabelShadowDownRight_${pid}_${slot}`);
        deleteAllHudWidgetsByName(`ConquestFlagHudLabelShadowDownLeft_${pid}_${slot}`);
        deleteAllHudWidgetsByName(`ConquestFlagHudLabelShadowInner_${pid}_${slot}`);
        deleteAllHudWidgetsByName(`ConquestFlagHudLabelShadowInnerDeep_${pid}_${slot}`);
        deleteAllHudWidgetsByName(`ConquestFlagHudLabelShadowCenter_${pid}_${slot}`);
        deleteAllHudWidgetsByName(`ConquestFlagHudLabelShadow_${pid}_${slot}`);
        deleteAllHudWidgetsByName(`ConquestFlagHudLabelShadowMid_${pid}_${slot}`);
        deleteAllHudWidgetsByName(`ConquestFlagHudLabelShadowOuter_${pid}_${slot}`);
        deleteAllHudWidgetsByName(`ConquestFlagHudPercentRoot_${pid}_${slot}`);
        deleteAllHudWidgetsByName(`ConquestFlagHudPercentShadowRight_${pid}_${slot}`);
        deleteAllHudWidgetsByName(`ConquestFlagHudPercentShadowLeft_${pid}_${slot}`);
        deleteAllHudWidgetsByName(`ConquestFlagHudPercentShadowUp_${pid}_${slot}`);
        deleteAllHudWidgetsByName(`ConquestFlagHudPercentShadowDown_${pid}_${slot}`);
        deleteAllHudWidgetsByName(`ConquestFlagHudPercentShadowUpLeft_${pid}_${slot}`);
        deleteAllHudWidgetsByName(`ConquestFlagHudPercentShadowUpRight_${pid}_${slot}`);
        deleteAllHudWidgetsByName(`ConquestFlagHudPercentShadowDownRight_${pid}_${slot}`);
        deleteAllHudWidgetsByName(`ConquestFlagHudPercentShadowDownLeft_${pid}_${slot}`);
        deleteAllHudWidgetsByName(`ConquestFlagHudPercentShadowInner_${pid}_${slot}`);
        deleteAllHudWidgetsByName(`ConquestFlagHudPercentText_${pid}_${slot}`);
        deleteAllHudWidgetsByName(`ConquestFlagHudLabel_${pid}_${slot}`);
        // Legacy rows from older layouts.
        deleteAllHudWidgetsByName(`ConquestFlagFriendly_${pid}_${slot}`);
        deleteAllHudWidgetsByName(`ConquestFlagCenter_${pid}_${slot}`);
        deleteAllHudWidgetsByName(`ConquestFlagEnemy_${pid}_${slot}`);
    }
    delete State.hudCache.hudByPid[pid];
    delete State.conquest.debug.hudStatusVmByPid[pid];
    delete State.conquest.debug.hudHelpReadyVmByPid[pid];
    delete State.conquest.debug.hudClockVmByPid[pid];
    delete State.conquest.debug.bleedPulseQueueLeftByPid[pid];
    delete State.conquest.debug.bleedPulseQueueRightByPid[pid];
    delete State.conquest.debug.bleedPulseActiveSideByPid[pid];
    delete State.conquest.debug.bleedPulseStepByPid[pid];
    delete State.conquest.debug.bleedPulseLimitByPid[pid];
    delete State.conquest.debug.bleedPulsePhaseByPid[pid];
    delete State.conquest.debug.bleedPulseNextAtByPid[pid];
}
