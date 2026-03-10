// @ts-nocheck
// Module: hud/build -- HUD root ensure/build and per-player cache init

//#region -------------------- HUD Build/Ensure Function Start --------------------

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
// All lifecycle callers (swap, leave, schema-reset) should route through this to avoid drift.
function destroyConquestHudForPid(pid: number): void {
    State.conquest.debug.hudGenerationByPid[pid] = (State.conquest.debug.hudGenerationByPid[pid] ?? 0) + 1;

    const baseNames = [
        `ConquestTicketsHudRoot_${pid}`,
        `ConquestFlagsHudRoot_${pid}`,
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
    // Purges all bleed-chevron widgets, including shadow layers, across schema changes.
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

// Ensures all persistent HUD widgets exist for a player.
// This function is idempotent and safe to call on join, respawn, or reconnect.
// Widget references created here are reused and updated elsewhere.

function ensureHudForPlayer(player: mod.Player): HudRefs | undefined {
    // Per-player HUD lifecycle:
    // - HUD widgets are created once per player and then only updated (never recreated) during the match.
    // - This function is safe to call repeatedly (join, respawn, reconnect, admin actions).
    // - If a widget is missing, create it and store/find it via the UI root.

    if (!player || !mod.IsPlayerValid(player)) return undefined;

    const pid = getObjId(player);
    // Phase 3B anchor package from reference_design_documentation/ui_location_starter.md
    const CONQUEST_TICKETS_ROOT_X = 0;
    const CONQUEST_TICKETS_ROOT_Y = 0;
    const CONQUEST_TICKETS_ROOT_WIDTH = 561.77;
    const CONQUEST_TICKETS_ROOT_HEIGHT = 50;
    // Inward nudge for ticket-side UI cluster (counter boxes + lead borders + crowns).
    // Positive value moves each side toward center by that many units.
    const CONQUEST_TICKETS_SIDE_INNER_NUDGE_X = 2;
    const CONQUEST_TICKETS_TEAM_OUTER_EXPAND = 12;
    const CONQUEST_TICKETS_TEAM_TEXT_LEFT_OFFSET_X = 0;
    const CONQUEST_TICKETS_TEAM_TEXT_RIGHT_OFFSET_X = 0;
    // Keep containers at outward-expanded positions; text is nudged inward inside the containers.
    const CONQUEST_TICKETS_TEAM_LEFT_X = (40 - CONQUEST_TICKETS_TEAM_OUTER_EXPAND) + CONQUEST_TICKETS_SIDE_INNER_NUDGE_X;
    const CONQUEST_TICKETS_TEAM_RIGHT_X = 461.39 - CONQUEST_TICKETS_SIDE_INNER_NUDGE_X;
    const CONQUEST_TICKETS_ROW_Y = -1;
    const CONQUEST_TICKETS_LEFT_BAR_X = 103.39;
    const CONQUEST_TICKETS_RIGHT_BAR_X = 284.90;
    const CONQUEST_TICKETS_BAR_Y = 30.82;
    const CONQUEST_TICKETS_TEAM_WIDTH = 60 + CONQUEST_TICKETS_TEAM_OUTER_EXPAND;
    const CONQUEST_TICKETS_TEAM_HEIGHT = 28;
    const CONQUEST_TICKETS_TEAM_TEXT_SIZE = 26;
    const CONQUEST_TICKETS_TEAM_SHADOW_TEXT_SIZE = CONQUEST_TICKETS_TEAM_TEXT_SIZE + 1;
    const CONQUEST_TICKETS_BG_RGB: [number, number, number] = [0.0314, 0.0431, 0.0431];
    const CONQUEST_TICKETS_BG_ALPHA = 0.75;
    const CONQUEST_FLAGS_ROOT_X = 0;
    const CONQUEST_FLAGS_ROOT_Y = 0;
    const CONQUEST_FLAGS_ROOT_WIDTH = 238.5;
    const CONQUEST_FLAGS_ROOT_HEIGHT = 46;
    const CONQUEST_TICKETS_TEAM_LEFT_ABS_X = (719.15 - CONQUEST_TICKETS_TEAM_OUTER_EXPAND) + CONQUEST_TICKETS_SIDE_INNER_NUDGE_X;
    const CONQUEST_TICKETS_TEAM_RIGHT_ABS_X = 1140.54 - CONQUEST_TICKETS_SIDE_INNER_NUDGE_X;
    const CONQUEST_TICKETS_TEAM_ABS_Y = 68.85;
    const CONQUEST_TICKETS_BLEED_Y = CONQUEST_TICKETS_BAR_Y
        + Math.floor((CONQUEST_HUD_TICKET_BAR_HEIGHT - CONQUEST_HUD_TICKET_BLEED_CHEVRON_HEIGHT) / 2)
        + CONQUEST_HUD_TICKET_BLEED_CHEVRON_IN_BAR_OFFSET_Y;
    const CONQUEST_TICKETS_BLEED_LEFT_X = CONQUEST_TICKETS_LEFT_BAR_X + CONQUEST_HUD_TICKET_BLEED_CHEVRON_OUTER_INSET_X;
    const CONQUEST_TICKETS_BLEED_RIGHT_X = CONQUEST_TICKETS_RIGHT_BAR_X
        + CONQUEST_HUD_TICKET_BAR_WIDTH
        - CONQUEST_HUD_TICKET_BLEED_CHEVRON_OUTER_INSET_X
        - CONQUEST_HUD_TICKET_BLEED_CHEVRON_WIDTH;
    const CONQUEST_TICKETS_LEFT_BAR_ABS_X = 782.54;
    const CONQUEST_TICKETS_RIGHT_BAR_ABS_X = 964.05;
    const CONQUEST_TICKETS_BAR_ABS_Y = 78.55;
    const CONQUEST_TICKETS_BLEED_ABS_Y = CONQUEST_TICKETS_BAR_ABS_Y
        + Math.floor((CONQUEST_HUD_TICKET_BAR_HEIGHT - CONQUEST_HUD_TICKET_BLEED_CHEVRON_HEIGHT) / 2)
        + CONQUEST_HUD_TICKET_BLEED_CHEVRON_IN_BAR_OFFSET_Y;
    const CONQUEST_TICKETS_BLEED_LEFT_ABS_X = CONQUEST_TICKETS_LEFT_BAR_ABS_X + CONQUEST_HUD_TICKET_BLEED_CHEVRON_OUTER_INSET_X;
    const CONQUEST_TICKETS_BLEED_RIGHT_ABS_X = CONQUEST_TICKETS_RIGHT_BAR_ABS_X
        + CONQUEST_HUD_TICKET_BAR_WIDTH
        - CONQUEST_HUD_TICKET_BLEED_CHEVRON_OUTER_INSET_X
        - CONQUEST_HUD_TICKET_BLEED_CHEVRON_WIDTH;
    const CONQUEST_TICKETS_LEAD_LEFT_BORDER_ABS_X = CONQUEST_TICKETS_TEAM_LEFT_ABS_X - CONQUEST_HUD_TICKET_LEAD_BORDER_GROW;
    const CONQUEST_TICKETS_LEAD_RIGHT_BORDER_ABS_X = CONQUEST_TICKETS_TEAM_RIGHT_ABS_X - CONQUEST_HUD_TICKET_LEAD_BORDER_GROW;
    const CONQUEST_TICKETS_LEAD_BORDER_ABS_Y = CONQUEST_TICKETS_TEAM_ABS_Y - CONQUEST_HUD_TICKET_LEAD_BORDER_GROW;
    const CONQUEST_TICKETS_LEAD_BORDER_WIDTH = CONQUEST_TICKETS_TEAM_WIDTH + (CONQUEST_HUD_TICKET_LEAD_BORDER_GROW * 2);
    const CONQUEST_TICKETS_LEAD_BORDER_HEIGHT = CONQUEST_TICKETS_TEAM_HEIGHT + (CONQUEST_HUD_TICKET_LEAD_BORDER_GROW * 2);
    const CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_OFFSET = 0;
    const CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_GROW = 5;
    const CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_TOP_BIAS = -0.5;
    const CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_CENTER_SHIFT = CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_GROW / 2;
    const CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_SIZE = CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE + CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_GROW;
    const CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_ALPHA = 0.82;
    const CONQUEST_TICKETS_LEAD_LEFT_CROWN_ABS_X = CONQUEST_TICKETS_TEAM_LEFT_ABS_X + ((CONQUEST_TICKETS_TEAM_WIDTH - CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE) / 2);
    const CONQUEST_TICKETS_LEAD_RIGHT_CROWN_ABS_X = CONQUEST_TICKETS_TEAM_RIGHT_ABS_X + ((CONQUEST_TICKETS_TEAM_WIDTH - CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE) / 2);
    const CONQUEST_TICKETS_LEAD_CROWN_ABS_Y = CONQUEST_TICKETS_TEAM_ABS_Y - CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE - CONQUEST_HUD_TICKET_LEAD_CROWN_GAP_Y;
    const CONQUEST_TICKETS_LEAD_LEFT_CROWN_SHADOW_ABS_X = CONQUEST_TICKETS_LEAD_LEFT_CROWN_ABS_X - CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_CENTER_SHIFT + CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_OFFSET;
    const CONQUEST_TICKETS_LEAD_RIGHT_CROWN_SHADOW_ABS_X = CONQUEST_TICKETS_LEAD_RIGHT_CROWN_ABS_X - CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_CENTER_SHIFT + CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_OFFSET;
    const CONQUEST_TICKETS_LEAD_CROWN_SHADOW_ABS_Y = CONQUEST_TICKETS_LEAD_CROWN_ABS_Y - CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_CENTER_SHIFT + CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_OFFSET + CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_TOP_BIAS;
    const CONQUEST_TICKETS_SLASH_ABS_X = 952.0;
    const CONQUEST_TICKETS_SLASH_ABS_Y = 46.73;
    const CONQUEST_FLAGS_SLOT_ABS_Y = 91.86;
    const CONQUEST_FLAGS_SLOT_ABS_X: number[] = [
        840.50, // Capture Point 1
        875.50, // Capture Point 2
        910.50, // Capture Point 3
        945.50, // Capture Point 4
        980.50, // Capture Point 5
        1015.50, // Capture Point 6
        1050.50, // Capture Point 7
    ];
    const CONQUEST_FLAGS_ACTIVE_POPOUT_ABS_X = 928.00;
    const CONQUEST_FLAGS_ACTIVE_POPOUT_GAP_Y = 4.00;
    const CONQUEST_FLAGS_ACTIVE_POPOUT_NUDGE_UP_Y = 6.00;
    const CONQUEST_FLAGS_ACTIVE_POPOUT_ABS_Y = CONQUEST_FLAGS_SLOT_ABS_Y
        + CONQUEST_HUD_FLAG_PERCENT_OFFSET_Y
        + CONQUEST_HUD_FLAG_PERCENT_ROOT_HEIGHT
        + CONQUEST_FLAGS_ACTIVE_POPOUT_GAP_Y
        - CONQUEST_FLAGS_ACTIVE_POPOUT_NUDGE_UP_Y;
    const CONQUEST_FLAGS_ENGAGE_GAP_Y = 4.00;
    const CONQUEST_FLAGS_ENGAGE_NUDGE_UP_Y = 10.00;
    const CONQUEST_FLAGS_ENGAGE_ABS_X = CONQUEST_FLAGS_ACTIVE_POPOUT_ABS_X
        - ((CONQUEST_HUD_FLAG_ENGAGE_ROOT_WIDTH - CONQUEST_HUD_FLAG_ACTIVE_POPOUT_ROOT_WIDTH) / 2);
    const CONQUEST_FLAGS_ENGAGE_ABS_Y = CONQUEST_FLAGS_ACTIVE_POPOUT_ABS_Y
        + CONQUEST_HUD_FLAG_ACTIVE_POPOUT_ROOT_HEIGHT
        + CONQUEST_FLAGS_ENGAGE_GAP_Y
        - CONQUEST_FLAGS_ENGAGE_NUDGE_UP_Y;
    const CONQUEST_HELP_CONTAINER_X = -223.60;
    const CONQUEST_HELP_CONTAINER_Y = 81.10;
    const CONQUEST_HELP_CONTAINER_WIDTH = 561.77;
    const CONQUEST_HELP_CONTAINER_HEIGHT = 38.31;
    const CONQUEST_HELP_TEXT_OFFSET_Y = 10;
    const CONQUEST_HELP_TEXT_HEIGHT = 18;
    // "You are Ready" lane: left HUD stack under branding/settings.
    const CONQUEST_READY_CONTAINER_X = -905.00;
    const CONQUEST_READY_CONTAINER_Y = 81.10;
    const CONQUEST_READY_CONTAINER_WIDTH = 200.0;
    const CONQUEST_READY_CONTAINER_HEIGHT = 20.0;
    const CONQUEST_READY_TEXT_OFFSET_Y = 1;
    const CONQUEST_READY_TEXT_HEIGHT = 18;
    const CONQUEST_READY_ABS_X = 5.0;
    const CONQUEST_READY_ABS_Y = 131.0;
    const CONQUEST_FLAGS_MAX_ROWS = 7;
    const CONQUEST_FLAGS_SLOT_X: number[] = [
        0,      // Capture Point 1 (x=840.51, w=29)
        35.00,  // Capture Point 2 (x=875.50, w=29)
        70.00,  // Capture Point 3 (x=910.50, w=29)
        105.00, // Capture Point 4 (x=945.50, w=29)
        140.00, // Capture Point 5 (x=980.50, w=29)
        175.00, // Capture Point 6 (x=1015.50, w=29)
        210.00, // Capture Point 7 (x=1050.50, w=29)
    ];
    // Returns ticket-root-local X for one bleed chevron index.
    // Index 0 is outermost (closest to the ticket counter), increasing inward toward center.
    const getBleedChevronX = (isLeftSide: boolean, chevronIndex: number): number => {
        if (isLeftSide) {
            return CONQUEST_TICKETS_BLEED_LEFT_X + (chevronIndex * CONQUEST_HUD_TICKET_BLEED_CHEVRON_STEP_X);
        }
        return CONQUEST_TICKETS_BLEED_RIGHT_X - (chevronIndex * CONQUEST_HUD_TICKET_BLEED_CHEVRON_STEP_X);
    };
    // Returns bar-track-local X for one bleed chevron index.
    const getBleedChevronTrackX = (isLeftSide: boolean, chevronIndex: number): number => {
        if (isLeftSide) {
            return CONQUEST_HUD_TICKET_BLEED_CHEVRON_OUTER_INSET_X + (chevronIndex * CONQUEST_HUD_TICKET_BLEED_CHEVRON_STEP_X);
        }
        return CONQUEST_HUD_TICKET_BAR_WIDTH
            - CONQUEST_HUD_TICKET_BLEED_CHEVRON_OUTER_INSET_X
            - CONQUEST_HUD_TICKET_BLEED_CHEVRON_WIDTH
            - (chevronIndex * CONQUEST_HUD_TICKET_BLEED_CHEVRON_STEP_X);
    };
    // Returns absolute/root-local X for one bleed chevron index.
    const getBleedChevronAbsX = (isLeftSide: boolean, chevronIndex: number): number => {
        if (isLeftSide) {
            return CONQUEST_TICKETS_BLEED_LEFT_ABS_X + (chevronIndex * CONQUEST_HUD_TICKET_BLEED_CHEVRON_STEP_X);
        }
        return CONQUEST_TICKETS_BLEED_RIGHT_ABS_X - (chevronIndex * CONQUEST_HUD_TICKET_BLEED_CHEVRON_STEP_X);
    };
    // Ensures all foreground and shadow bleed-chevron widgets exist for the active schema.
    // This upgrades legacy HUD trees (3 chevrons, no shadows) in-place to 7 horizontal slots with shadow layers.
    const ensureConquestBleedChevronWidgets = (): void => {
        const createTextWidgetIfMissing = (
            name: string,
            textLabel: mod.Message,
            textColor: [number, number, number]
        ): void => {
            if (safeFind(name)) return;
            modlib.ParseUI({
                name,
                type: "Text",
                playerId: player,
                position: [0, 0],
                size: [CONQUEST_HUD_TICKET_BLEED_CHEVRON_WIDTH, CONQUEST_HUD_TICKET_BLEED_CHEVRON_HEIGHT],
                anchor: mod.UIAnchor.TopLeft,
                visible: false,
                padding: 0,
                bgAlpha: 0,
                bgFill: mod.UIBgFill.None,
                textLabel,
                textColor,
                textAlpha: 1,
                textSize: CONQUEST_HUD_TICKET_BLEED_CHEVRON_TEXT_SIZE,
                textAnchor: mod.UIAnchor.Center,
            });
        };
        for (let chevronIndex = 0; chevronIndex < CONQUEST_HUD_TICKET_BLEED_CHEVRON_COUNT; chevronIndex++) {
            const slot = chevronIndex + 1;
            createTextWidgetIfMissing(
                `ConquestTicketsHudBleedChevronLeft${slot}_${pid}`,
                mod.Message(STR_HUD_CONQUEST_BLEED_CHEVRON_LEFT),
                [
                    CONQUEST_HUD_TICKET_BLEED_CHEVRON_FRIENDLY_RGB[0],
                    CONQUEST_HUD_TICKET_BLEED_CHEVRON_FRIENDLY_RGB[1],
                    CONQUEST_HUD_TICKET_BLEED_CHEVRON_FRIENDLY_RGB[2],
                ]
            );
            createTextWidgetIfMissing(
                `ConquestTicketsHudBleedChevronRight${slot}_${pid}`,
                mod.Message(STR_HUD_CONQUEST_BLEED_CHEVRON_RIGHT),
                [
                    CONQUEST_HUD_TICKET_BLEED_CHEVRON_ENEMY_RGB[0],
                    CONQUEST_HUD_TICKET_BLEED_CHEVRON_ENEMY_RGB[1],
                    CONQUEST_HUD_TICKET_BLEED_CHEVRON_ENEMY_RGB[2],
                ]
            );
            const shadowColor: [number, number, number] = [0, 0, 0];
            createTextWidgetIfMissing(`ConquestTicketsHudBleedChevronLeft${slot}ShadowRight_${pid}`, mod.Message(STR_HUD_CONQUEST_BLEED_CHEVRON_LEFT), shadowColor);
            createTextWidgetIfMissing(`ConquestTicketsHudBleedChevronLeft${slot}ShadowLeft_${pid}`, mod.Message(STR_HUD_CONQUEST_BLEED_CHEVRON_LEFT), shadowColor);
            createTextWidgetIfMissing(`ConquestTicketsHudBleedChevronLeft${slot}ShadowUp_${pid}`, mod.Message(STR_HUD_CONQUEST_BLEED_CHEVRON_LEFT), shadowColor);
            createTextWidgetIfMissing(`ConquestTicketsHudBleedChevronLeft${slot}ShadowDown_${pid}`, mod.Message(STR_HUD_CONQUEST_BLEED_CHEVRON_LEFT), shadowColor);
            createTextWidgetIfMissing(`ConquestTicketsHudBleedChevronLeft${slot}ShadowUpLeft_${pid}`, mod.Message(STR_HUD_CONQUEST_BLEED_CHEVRON_LEFT), shadowColor);
            createTextWidgetIfMissing(`ConquestTicketsHudBleedChevronLeft${slot}ShadowUpRight_${pid}`, mod.Message(STR_HUD_CONQUEST_BLEED_CHEVRON_LEFT), shadowColor);
            createTextWidgetIfMissing(`ConquestTicketsHudBleedChevronLeft${slot}ShadowDownRight_${pid}`, mod.Message(STR_HUD_CONQUEST_BLEED_CHEVRON_LEFT), shadowColor);
            createTextWidgetIfMissing(`ConquestTicketsHudBleedChevronLeft${slot}ShadowDownLeft_${pid}`, mod.Message(STR_HUD_CONQUEST_BLEED_CHEVRON_LEFT), shadowColor);
            createTextWidgetIfMissing(`ConquestTicketsHudBleedChevronRight${slot}ShadowRight_${pid}`, mod.Message(STR_HUD_CONQUEST_BLEED_CHEVRON_RIGHT), shadowColor);
            createTextWidgetIfMissing(`ConquestTicketsHudBleedChevronRight${slot}ShadowLeft_${pid}`, mod.Message(STR_HUD_CONQUEST_BLEED_CHEVRON_RIGHT), shadowColor);
            createTextWidgetIfMissing(`ConquestTicketsHudBleedChevronRight${slot}ShadowUp_${pid}`, mod.Message(STR_HUD_CONQUEST_BLEED_CHEVRON_RIGHT), shadowColor);
            createTextWidgetIfMissing(`ConquestTicketsHudBleedChevronRight${slot}ShadowDown_${pid}`, mod.Message(STR_HUD_CONQUEST_BLEED_CHEVRON_RIGHT), shadowColor);
            createTextWidgetIfMissing(`ConquestTicketsHudBleedChevronRight${slot}ShadowUpLeft_${pid}`, mod.Message(STR_HUD_CONQUEST_BLEED_CHEVRON_RIGHT), shadowColor);
            createTextWidgetIfMissing(`ConquestTicketsHudBleedChevronRight${slot}ShadowUpRight_${pid}`, mod.Message(STR_HUD_CONQUEST_BLEED_CHEVRON_RIGHT), shadowColor);
            createTextWidgetIfMissing(`ConquestTicketsHudBleedChevronRight${slot}ShadowDownRight_${pid}`, mod.Message(STR_HUD_CONQUEST_BLEED_CHEVRON_RIGHT), shadowColor);
            createTextWidgetIfMissing(`ConquestTicketsHudBleedChevronRight${slot}ShadowDownLeft_${pid}`, mod.Message(STR_HUD_CONQUEST_BLEED_CHEVRON_RIGHT), shadowColor);
        }
    };
    // Ensures ticket counter directional shadow widgets exist so counters render an even outline ring.
    const ensureConquestTicketCounterShadowWidgets = (): void => {
        const createTicketShadowWidgetIfMissing = (name: string): void => {
            if (safeFind(name)) return;
            modlib.ParseUI({
                name,
                type: "Text",
                playerId: player,
                position: [0, 0],
                size: [CONQUEST_TICKETS_TEAM_WIDTH, CONQUEST_TICKETS_TEAM_HEIGHT],
                anchor: mod.UIAnchor.TopLeft,
                visible: false,
                padding: 0,
                bgAlpha: 0,
                bgFill: mod.UIBgFill.None,
                textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                textColor: [0, 0, 0],
                textAlpha: CONQUEST_HUD_TICKET_COUNTER_SHADOW_ALPHA,
                textSize: CONQUEST_TICKETS_TEAM_SHADOW_TEXT_SIZE,
                textAnchor: mod.UIAnchor.Center,
            });
        };
        const createTicketCoreOverlayIfMissing = (
            name: string,
            teamColor: [number, number, number]
        ): void => {
            if (safeFind(name)) return;
            modlib.ParseUI({
                name,
                type: "Text",
                playerId: player,
                position: [0, 0],
                size: [CONQUEST_TICKETS_TEAM_WIDTH, CONQUEST_TICKETS_TEAM_HEIGHT],
                anchor: mod.UIAnchor.TopLeft,
                visible: false,
                padding: 0,
                bgAlpha: 0,
                bgFill: mod.UIBgFill.None,
                textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                textColor: teamColor,
                textAlpha: 1,
                textSize: CONQUEST_TICKETS_TEAM_TEXT_SIZE,
                textAnchor: mod.UIAnchor.Center,
            });
        };
        for (let teamIndex = 1; teamIndex <= 2; teamIndex++) {
            const teamPrefix = `ConquestTicketsHudTeam${teamIndex}`;
            for (let layerIndex = 0; layerIndex < CONQUEST_TICKET_COUNTER_SHADOW_RING_LAYERS.length; layerIndex++) {
                const layer = CONQUEST_TICKET_COUNTER_SHADOW_RING_LAYERS[layerIndex];
                createTicketShadowWidgetIfMissing(`${teamPrefix}${layer.suffix}_${pid}`);
            }
        }
        createTicketCoreOverlayIfMissing(
            `ConquestTicketsHudTeam1CoreOverlay_${pid}`,
            [
                CONQUEST_HUD_TEXT_FRIENDLY_RGB[0],
                CONQUEST_HUD_TEXT_FRIENDLY_RGB[1],
                CONQUEST_HUD_TEXT_FRIENDLY_RGB[2],
            ]
        );
        createTicketCoreOverlayIfMissing(
            `ConquestTicketsHudTeam2CoreOverlay_${pid}`,
            [
                CONQUEST_HUD_TEXT_ENEMY_RGB[0],
                CONQUEST_HUD_TEXT_ENEMY_RGB[1],
                CONQUEST_HUD_TEXT_ENEMY_RGB[2],
            ]
        );
    };
    // Hides legacy triplet-row flag widgets left behind by prior HUD layouts.
    const hideLegacyFlagTripletRows = (): void => {
        for (let i = 0; i < CONQUEST_FLAGS_MAX_ROWS; i++) {
            safeSetUIWidgetVisible(safeFind(`ConquestFlagFriendly_${pid}_${i}`), false);
            safeSetUIWidgetVisible(safeFind(`ConquestFlagCenter_${pid}_${i}`), false);
            safeSetUIWidgetVisible(safeFind(`ConquestFlagEnemy_${pid}_${i}`), false);
        }
    };
    // Hides legacy conquest roots from earlier HUD iterations so only V2 roots are visible.
    const hideLegacyConquestRoots = (): void => {
        safeSetUIWidgetVisible(safeFind(`ConquestTicketsDebugRoot_${pid}`), false);
        safeSetUIWidgetVisible(safeFind(`ConquestFlagsDebugRoot_${pid}`), false);
    };

    // Applies absolute top-left layout per widget under UIRoot.
    // This bypasses root/container frame ambiguity so ticket/flag widgets match ui_location_starter coordinates exactly.
    const applyConquestAbsoluteLayout = (refsForPid?: HudRefs, resetDynamicFillGeometry: boolean = false): void => {
        const uiRoot = mod.GetUIRoot();
        const ticketsRoot = safeFind(`ConquestTicketsHudRoot_${pid}`);
        if (ticketsRoot) {
            try {
                mod.SetUIWidgetAnchor(ticketsRoot, mod.UIAnchor.TopLeft);
            } catch {
                // Best-effort anchor normalization only.
            }
            mod.SetUIWidgetParent(ticketsRoot, uiRoot);
            mod.SetUIWidgetPosition(ticketsRoot, mod.CreateVector(CONQUEST_TICKETS_ROOT_X, CONQUEST_TICKETS_ROOT_Y, 0));
            mod.SetUIWidgetSize(ticketsRoot, mod.CreateVector(TOP_HUD_ROOT_WIDTH, TOP_HUD_ROOT_HEIGHT, 0));
        }
        const flagsRoot = safeFind(`ConquestFlagsHudRoot_${pid}`);
        if (flagsRoot) {
            try {
                mod.SetUIWidgetAnchor(flagsRoot, mod.UIAnchor.TopLeft);
            } catch {
                // Best-effort anchor normalization only.
            }
            mod.SetUIWidgetParent(flagsRoot, uiRoot);
            mod.SetUIWidgetPosition(flagsRoot, mod.CreateVector(CONQUEST_FLAGS_ROOT_X, CONQUEST_FLAGS_ROOT_Y, 0));
            mod.SetUIWidgetSize(flagsRoot, mod.CreateVector(TOP_HUD_ROOT_WIDTH, TOP_HUD_ROOT_HEIGHT, 0));
        }
        const ticketsParent = ticketsRoot ?? uiRoot;
        const flagsParent = flagsRoot ?? uiRoot;
        const setTicketCounterShadowRingAbsoluteLayout = (
            teamPrefix: string,
            parent: mod.UIWidget,
            baseX: number,
            baseY: number
        ): void => {
            for (let layerIndex = 0; layerIndex < CONQUEST_TICKET_COUNTER_SHADOW_RING_LAYERS.length; layerIndex++) {
                const layer = CONQUEST_TICKET_COUNTER_SHADOW_RING_LAYERS[layerIndex];
                const shadow = safeFind(`${teamPrefix}${layer.suffix}_${pid}`);
                if (!shadow) continue;
                try {
                    mod.SetUIWidgetAnchor(shadow, mod.UIAnchor.TopLeft);
                } catch {
                    // Best-effort anchor normalization only.
                }
                mod.SetUIWidgetParent(shadow, parent);
                mod.SetUIWidgetPosition(
                    shadow,
                    mod.CreateVector(baseX + layer.offsetX, baseY + layer.offsetY, 0)
                );
                mod.SetUIWidgetSize(
                    shadow,
                    mod.CreateVector(CONQUEST_TICKETS_TEAM_WIDTH, CONQUEST_TICKETS_TEAM_HEIGHT, 0)
                );
                mod.SetUITextSize(shadow, CONQUEST_TICKETS_TEAM_SHADOW_TEXT_SIZE);
                mod.SetUITextAlpha(shadow, CONQUEST_HUD_TICKET_COUNTER_SHADOW_ALPHA);
            }
        };

        const ticketT1Container = refsForPid?.conquestTicketsTeam1Container
            ?? safeFind(`ConquestTicketsHudTeam1Container_${pid}`);
        if (ticketT1Container) {
            try {
                mod.SetUIWidgetAnchor(ticketT1Container, mod.UIAnchor.TopLeft);
            } catch {
                // Best-effort anchor normalization only.
            }
            mod.SetUIWidgetParent(ticketT1Container, ticketsParent);
            mod.SetUIWidgetPosition(ticketT1Container, mod.CreateVector(CONQUEST_TICKETS_TEAM_LEFT_ABS_X, CONQUEST_TICKETS_TEAM_ABS_Y, 0));
            mod.SetUIWidgetSize(ticketT1Container, mod.CreateVector(CONQUEST_TICKETS_TEAM_WIDTH, CONQUEST_TICKETS_TEAM_HEIGHT, 0));
        }
        const ticketT1 = refsForPid?.conquestTicketsDebugTeam1 ?? safeFind(`ConquestTicketsHudTeam1_${pid}`);
        const ticketT1Shadow = refsForPid?.conquestTicketsDebugTeam1Shadow ?? safeFind(`ConquestTicketsHudTeam1Shadow_${pid}`);
        if (ticketT1) {
            try {
                mod.SetUIWidgetAnchor(ticketT1, mod.UIAnchor.TopLeft);
            } catch {
                // Best-effort anchor normalization only.
            }
            mod.SetUIWidgetParent(ticketT1, ticketT1Container ?? ticketsParent);
            mod.SetUIWidgetPosition(
                ticketT1,
                ticketT1Container
                    ? mod.CreateVector(CONQUEST_TICKETS_TEAM_TEXT_LEFT_OFFSET_X, 0, 0)
                    : mod.CreateVector(CONQUEST_TICKETS_TEAM_LEFT_ABS_X, CONQUEST_TICKETS_TEAM_ABS_Y, 0)
            );
            mod.SetUIWidgetSize(ticketT1, mod.CreateVector(CONQUEST_TICKETS_TEAM_WIDTH, CONQUEST_TICKETS_TEAM_HEIGHT, 0));
        }
        if (ticketT1Shadow) {
            try {
                mod.SetUIWidgetAnchor(ticketT1Shadow, mod.UIAnchor.TopLeft);
            } catch {
                // Best-effort anchor normalization only.
            }
            mod.SetUIWidgetParent(ticketT1Shadow, ticketT1Container ?? ticketsParent);
            mod.SetUIWidgetPosition(
                ticketT1Shadow,
                ticketT1Container
                    ? mod.CreateVector(
                        CONQUEST_TICKETS_TEAM_TEXT_LEFT_OFFSET_X + CONQUEST_HUD_TICKET_COUNTER_SHADOW_OFFSET,
                        CONQUEST_HUD_TICKET_COUNTER_SHADOW_OFFSET,
                        0
                    )
                    : mod.CreateVector(
                        CONQUEST_TICKETS_TEAM_LEFT_ABS_X + CONQUEST_HUD_TICKET_COUNTER_SHADOW_OFFSET,
                        CONQUEST_TICKETS_TEAM_ABS_Y + CONQUEST_HUD_TICKET_COUNTER_SHADOW_OFFSET,
                        0
                    )
            );
            mod.SetUIWidgetSize(ticketT1Shadow, mod.CreateVector(CONQUEST_TICKETS_TEAM_WIDTH, CONQUEST_TICKETS_TEAM_HEIGHT, 0));
            mod.SetUITextSize(ticketT1Shadow, CONQUEST_TICKETS_TEAM_SHADOW_TEXT_SIZE);
            if (ticketT1) {
                mod.SetUIWidgetParent(ticketT1, ticketT1Container ?? ticketsParent);
                mod.SetUIWidgetPosition(
                    ticketT1,
                    ticketT1Container
                        ? mod.CreateVector(CONQUEST_TICKETS_TEAM_TEXT_LEFT_OFFSET_X, 0, 0)
                        : mod.CreateVector(CONQUEST_TICKETS_TEAM_LEFT_ABS_X, CONQUEST_TICKETS_TEAM_ABS_Y, 0)
                );
                mod.SetUIWidgetSize(ticketT1, mod.CreateVector(CONQUEST_TICKETS_TEAM_WIDTH, CONQUEST_TICKETS_TEAM_HEIGHT, 0));
                mod.SetUITextSize(ticketT1, CONQUEST_TICKETS_TEAM_TEXT_SIZE);
            }
        }
        const ticketT1ShadowParent = ticketT1Container ?? ticketsParent;
        const ticketT1ShadowBaseX = ticketT1Container ? CONQUEST_TICKETS_TEAM_TEXT_LEFT_OFFSET_X : CONQUEST_TICKETS_TEAM_LEFT_ABS_X;
        const ticketT1ShadowBaseY = ticketT1Container ? 0 : CONQUEST_TICKETS_TEAM_ABS_Y;
        setTicketCounterShadowRingAbsoluteLayout(
            "ConquestTicketsHudTeam1",
            ticketT1ShadowParent,
            ticketT1ShadowBaseX,
            ticketT1ShadowBaseY
        );
        const ticketT2Container = refsForPid?.conquestTicketsTeam2Container
            ?? safeFind(`ConquestTicketsHudTeam2Container_${pid}`);
        if (ticketT2Container) {
            try {
                mod.SetUIWidgetAnchor(ticketT2Container, mod.UIAnchor.TopLeft);
            } catch {
                // Best-effort anchor normalization only.
            }
            mod.SetUIWidgetParent(ticketT2Container, ticketsParent);
            mod.SetUIWidgetPosition(ticketT2Container, mod.CreateVector(CONQUEST_TICKETS_TEAM_RIGHT_ABS_X, CONQUEST_TICKETS_TEAM_ABS_Y, 0));
            mod.SetUIWidgetSize(ticketT2Container, mod.CreateVector(CONQUEST_TICKETS_TEAM_WIDTH, CONQUEST_TICKETS_TEAM_HEIGHT, 0));
        }
        const ticketT2 = refsForPid?.conquestTicketsDebugTeam2 ?? safeFind(`ConquestTicketsHudTeam2_${pid}`);
        const ticketT2Shadow = refsForPid?.conquestTicketsDebugTeam2Shadow ?? safeFind(`ConquestTicketsHudTeam2Shadow_${pid}`);
        if (ticketT2) {
            try {
                mod.SetUIWidgetAnchor(ticketT2, mod.UIAnchor.TopLeft);
            } catch {
                // Best-effort anchor normalization only.
            }
            mod.SetUIWidgetParent(ticketT2, ticketT2Container ?? ticketsParent);
            mod.SetUIWidgetPosition(
                ticketT2,
                ticketT2Container
                    ? mod.CreateVector(CONQUEST_TICKETS_TEAM_TEXT_RIGHT_OFFSET_X, 0, 0)
                    : mod.CreateVector(CONQUEST_TICKETS_TEAM_RIGHT_ABS_X, CONQUEST_TICKETS_TEAM_ABS_Y, 0)
            );
            mod.SetUIWidgetSize(ticketT2, mod.CreateVector(CONQUEST_TICKETS_TEAM_WIDTH, CONQUEST_TICKETS_TEAM_HEIGHT, 0));
        }
        if (ticketT2Shadow) {
            try {
                mod.SetUIWidgetAnchor(ticketT2Shadow, mod.UIAnchor.TopLeft);
            } catch {
                // Best-effort anchor normalization only.
            }
            mod.SetUIWidgetParent(ticketT2Shadow, ticketT2Container ?? ticketsParent);
            mod.SetUIWidgetPosition(
                ticketT2Shadow,
                ticketT2Container
                    ? mod.CreateVector(
                        CONQUEST_TICKETS_TEAM_TEXT_RIGHT_OFFSET_X + CONQUEST_HUD_TICKET_COUNTER_SHADOW_OFFSET,
                        CONQUEST_HUD_TICKET_COUNTER_SHADOW_OFFSET,
                        0
                    )
                    : mod.CreateVector(
                        CONQUEST_TICKETS_TEAM_RIGHT_ABS_X + CONQUEST_HUD_TICKET_COUNTER_SHADOW_OFFSET,
                        CONQUEST_TICKETS_TEAM_ABS_Y + CONQUEST_HUD_TICKET_COUNTER_SHADOW_OFFSET,
                        0
                    )
            );
            mod.SetUIWidgetSize(ticketT2Shadow, mod.CreateVector(CONQUEST_TICKETS_TEAM_WIDTH, CONQUEST_TICKETS_TEAM_HEIGHT, 0));
            mod.SetUITextSize(ticketT2Shadow, CONQUEST_TICKETS_TEAM_SHADOW_TEXT_SIZE);
            if (ticketT2) {
                mod.SetUIWidgetParent(ticketT2, ticketT2Container ?? ticketsParent);
                mod.SetUIWidgetPosition(
                    ticketT2,
                    ticketT2Container
                        ? mod.CreateVector(CONQUEST_TICKETS_TEAM_TEXT_RIGHT_OFFSET_X, 0, 0)
                        : mod.CreateVector(CONQUEST_TICKETS_TEAM_RIGHT_ABS_X, CONQUEST_TICKETS_TEAM_ABS_Y, 0)
                );
                mod.SetUIWidgetSize(ticketT2, mod.CreateVector(CONQUEST_TICKETS_TEAM_WIDTH, CONQUEST_TICKETS_TEAM_HEIGHT, 0));
                mod.SetUITextSize(ticketT2, CONQUEST_TICKETS_TEAM_TEXT_SIZE);
            }
        }
        const ticketT2ShadowParent = ticketT2Container ?? ticketsParent;
        const ticketT2ShadowBaseX = ticketT2Container ? CONQUEST_TICKETS_TEAM_TEXT_RIGHT_OFFSET_X : CONQUEST_TICKETS_TEAM_RIGHT_ABS_X;
        const ticketT2ShadowBaseY = ticketT2Container ? 0 : CONQUEST_TICKETS_TEAM_ABS_Y;
        setTicketCounterShadowRingAbsoluteLayout(
            "ConquestTicketsHudTeam2",
            ticketT2ShadowParent,
            ticketT2ShadowBaseX,
            ticketT2ShadowBaseY
        );

        const leadLeftBorder = refsForPid?.conquestTicketsLeadLeftBorder ?? safeFind(`ConquestTicketsHudLeadBorderLeft_${pid}`);
        if (leadLeftBorder) {
            try {
                mod.SetUIWidgetAnchor(leadLeftBorder, mod.UIAnchor.TopLeft);
            } catch {
                // Best-effort anchor normalization only.
            }
            mod.SetUIWidgetParent(leadLeftBorder, ticketsParent);
            mod.SetUIWidgetPosition(leadLeftBorder, mod.CreateVector(CONQUEST_TICKETS_LEAD_LEFT_BORDER_ABS_X, CONQUEST_TICKETS_LEAD_BORDER_ABS_Y, 0));
            mod.SetUIWidgetSize(leadLeftBorder, mod.CreateVector(CONQUEST_TICKETS_LEAD_BORDER_WIDTH, CONQUEST_TICKETS_LEAD_BORDER_HEIGHT, 0));
        }
        const leadRightBorder = refsForPid?.conquestTicketsLeadRightBorder ?? safeFind(`ConquestTicketsHudLeadBorderRight_${pid}`);
        if (leadRightBorder) {
            try {
                mod.SetUIWidgetAnchor(leadRightBorder, mod.UIAnchor.TopLeft);
            } catch {
                // Best-effort anchor normalization only.
            }
            mod.SetUIWidgetParent(leadRightBorder, ticketsParent);
            mod.SetUIWidgetPosition(leadRightBorder, mod.CreateVector(CONQUEST_TICKETS_LEAD_RIGHT_BORDER_ABS_X, CONQUEST_TICKETS_LEAD_BORDER_ABS_Y, 0));
            mod.SetUIWidgetSize(leadRightBorder, mod.CreateVector(CONQUEST_TICKETS_LEAD_BORDER_WIDTH, CONQUEST_TICKETS_LEAD_BORDER_HEIGHT, 0));
        }

        const leadLeftCrownShadow = refsForPid?.conquestTicketsLeadLeftCrownShadow ?? safeFind(`ConquestTicketsHudLeadCrownLeftShadow_${pid}`);
        if (leadLeftCrownShadow) {
            try {
                mod.SetUIWidgetAnchor(leadLeftCrownShadow, mod.UIAnchor.TopLeft);
            } catch {
                // Best-effort anchor normalization only.
            }
            mod.SetUIWidgetParent(leadLeftCrownShadow, ticketsParent);
            mod.SetUIWidgetPosition(leadLeftCrownShadow, mod.CreateVector(CONQUEST_TICKETS_LEAD_LEFT_CROWN_SHADOW_ABS_X, CONQUEST_TICKETS_LEAD_CROWN_SHADOW_ABS_Y, 0));
            mod.SetUIWidgetSize(leadLeftCrownShadow, mod.CreateVector(CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_SIZE, CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_SIZE, 0));
        }
        const leadRightCrownShadow = refsForPid?.conquestTicketsLeadRightCrownShadow ?? safeFind(`ConquestTicketsHudLeadCrownRightShadow_${pid}`);
        if (leadRightCrownShadow) {
            try {
                mod.SetUIWidgetAnchor(leadRightCrownShadow, mod.UIAnchor.TopLeft);
            } catch {
                // Best-effort anchor normalization only.
            }
            mod.SetUIWidgetParent(leadRightCrownShadow, ticketsParent);
            mod.SetUIWidgetPosition(leadRightCrownShadow, mod.CreateVector(CONQUEST_TICKETS_LEAD_RIGHT_CROWN_SHADOW_ABS_X, CONQUEST_TICKETS_LEAD_CROWN_SHADOW_ABS_Y, 0));
            mod.SetUIWidgetSize(leadRightCrownShadow, mod.CreateVector(CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_SIZE, CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_SIZE, 0));
        }

        const leadLeftCrown = refsForPid?.conquestTicketsLeadLeftCrown ?? safeFind(`ConquestTicketsHudLeadCrownLeft_${pid}`);
        if (leadLeftCrown) {
            try {
                mod.SetUIWidgetAnchor(leadLeftCrown, mod.UIAnchor.TopLeft);
            } catch {
                // Best-effort anchor normalization only.
            }
            mod.SetUIWidgetParent(leadLeftCrown, ticketsParent);
            mod.SetUIWidgetPosition(leadLeftCrown, mod.CreateVector(CONQUEST_TICKETS_LEAD_LEFT_CROWN_ABS_X, CONQUEST_TICKETS_LEAD_CROWN_ABS_Y, 0));
            mod.SetUIWidgetSize(leadLeftCrown, mod.CreateVector(CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE, CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE, 0));
        }
        const leadRightCrown = refsForPid?.conquestTicketsLeadRightCrown ?? safeFind(`ConquestTicketsHudLeadCrownRight_${pid}`);
        if (leadRightCrown) {
            try {
                mod.SetUIWidgetAnchor(leadRightCrown, mod.UIAnchor.TopLeft);
            } catch {
                // Best-effort anchor normalization only.
            }
            mod.SetUIWidgetParent(leadRightCrown, ticketsParent);
            mod.SetUIWidgetPosition(leadRightCrown, mod.CreateVector(CONQUEST_TICKETS_LEAD_RIGHT_CROWN_ABS_X, CONQUEST_TICKETS_LEAD_CROWN_ABS_Y, 0));
            mod.SetUIWidgetSize(leadRightCrown, mod.CreateVector(CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE, CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE, 0));
        }

        const leftBleedChevrons = refsForPid?.conquestTicketsBleedLeftChevrons ?? [];
        const rightBleedChevrons = refsForPid?.conquestTicketsBleedRightChevrons ?? [];
        const chevronOverlayParent = uiRoot;
        for (let chevronIndex = 0; chevronIndex < CONQUEST_HUD_TICKET_BLEED_CHEVRON_COUNT; chevronIndex++) {
            // Keep chevrons under UIRoot overlay so ticket bar/fill layering cannot occlude the glyphs.
            const leftParent = chevronOverlayParent;
            const rightParent = chevronOverlayParent;
            const leftX = getBleedChevronAbsX(true, chevronIndex);
            const rightX = getBleedChevronAbsX(false, chevronIndex);
            const leftY = CONQUEST_TICKETS_BLEED_ABS_Y;
            const rightY = CONQUEST_TICKETS_BLEED_ABS_Y;
            const leftChevron = leftBleedChevrons[chevronIndex] ?? safeFind(`ConquestTicketsHudBleedChevronLeft${chevronIndex + 1}_${pid}`);
            if (leftChevron) {
                try {
                    mod.SetUIWidgetAnchor(leftChevron, mod.UIAnchor.TopLeft);
                } catch {
                    // Best-effort anchor normalization only.
                }
                mod.SetUIWidgetParent(leftChevron, leftParent);
                mod.SetUIWidgetPosition(leftChevron, mod.CreateVector(leftX, leftY, 0));
                mod.SetUIWidgetSize(
                    leftChevron,
                    mod.CreateVector(CONQUEST_HUD_TICKET_BLEED_CHEVRON_WIDTH, CONQUEST_HUD_TICKET_BLEED_CHEVRON_HEIGHT, 0)
                );
            }

            const rightChevron = rightBleedChevrons[chevronIndex] ?? safeFind(`ConquestTicketsHudBleedChevronRight${chevronIndex + 1}_${pid}`);
            if (rightChevron) {
                try {
                    mod.SetUIWidgetAnchor(rightChevron, mod.UIAnchor.TopLeft);
                } catch {
                    // Best-effort anchor normalization only.
                }
                mod.SetUIWidgetParent(rightChevron, rightParent);
                mod.SetUIWidgetPosition(rightChevron, mod.CreateVector(rightX, rightY, 0));
                mod.SetUIWidgetSize(
                    rightChevron,
                    mod.CreateVector(CONQUEST_HUD_TICKET_BLEED_CHEVRON_WIDTH, CONQUEST_HUD_TICKET_BLEED_CHEVRON_HEIGHT, 0)
                );
            }
            const setBleedShadowAbsoluteLayout = (name: string, x: number, y: number, parent: mod.UIWidget): void => {
                const shadow = safeFind(name);
                if (!shadow) return;
                try {
                    mod.SetUIWidgetAnchor(shadow, mod.UIAnchor.TopLeft);
                } catch {
                    // Best-effort anchor normalization only.
                }
                mod.SetUIWidgetParent(shadow, parent);
                mod.SetUIWidgetPosition(shadow, mod.CreateVector(x, y, 0));
                mod.SetUIWidgetSize(
                    shadow,
                    mod.CreateVector(CONQUEST_HUD_TICKET_BLEED_CHEVRON_WIDTH, CONQUEST_HUD_TICKET_BLEED_CHEVRON_HEIGHT, 0)
                );
            };
            const slot = chevronIndex + 1;
            const d = CONQUEST_HUD_TICKET_BLEED_CHEVRON_SHADOW_OFFSET;
            const dUp = d * 0.5;
            setBleedShadowAbsoluteLayout(`ConquestTicketsHudBleedChevronLeft${slot}ShadowRight_${pid}`, leftX + d, leftY, leftParent);
            setBleedShadowAbsoluteLayout(`ConquestTicketsHudBleedChevronLeft${slot}ShadowLeft_${pid}`, leftX - d, leftY, leftParent);
            setBleedShadowAbsoluteLayout(`ConquestTicketsHudBleedChevronLeft${slot}ShadowUp_${pid}`, leftX, leftY - dUp, leftParent);
            setBleedShadowAbsoluteLayout(`ConquestTicketsHudBleedChevronLeft${slot}ShadowDown_${pid}`, leftX, leftY + d, leftParent);
            setBleedShadowAbsoluteLayout(`ConquestTicketsHudBleedChevronLeft${slot}ShadowUpLeft_${pid}`, leftX - d, leftY - dUp, leftParent);
            setBleedShadowAbsoluteLayout(`ConquestTicketsHudBleedChevronLeft${slot}ShadowUpRight_${pid}`, leftX + d, leftY - dUp, leftParent);
            setBleedShadowAbsoluteLayout(`ConquestTicketsHudBleedChevronLeft${slot}ShadowDownRight_${pid}`, leftX + d, leftY + d, leftParent);
            setBleedShadowAbsoluteLayout(`ConquestTicketsHudBleedChevronLeft${slot}ShadowDownLeft_${pid}`, leftX - d, leftY + d, leftParent);
            setBleedShadowAbsoluteLayout(`ConquestTicketsHudBleedChevronRight${slot}ShadowRight_${pid}`, rightX + d, rightY, rightParent);
            setBleedShadowAbsoluteLayout(`ConquestTicketsHudBleedChevronRight${slot}ShadowLeft_${pid}`, rightX - d, rightY, rightParent);
            setBleedShadowAbsoluteLayout(`ConquestTicketsHudBleedChevronRight${slot}ShadowUp_${pid}`, rightX, rightY - dUp, rightParent);
            setBleedShadowAbsoluteLayout(`ConquestTicketsHudBleedChevronRight${slot}ShadowDown_${pid}`, rightX, rightY + d, rightParent);
            setBleedShadowAbsoluteLayout(`ConquestTicketsHudBleedChevronRight${slot}ShadowUpLeft_${pid}`, rightX - d, rightY - dUp, rightParent);
            setBleedShadowAbsoluteLayout(`ConquestTicketsHudBleedChevronRight${slot}ShadowUpRight_${pid}`, rightX + d, rightY - dUp, rightParent);
            setBleedShadowAbsoluteLayout(`ConquestTicketsHudBleedChevronRight${slot}ShadowDownRight_${pid}`, rightX + d, rightY + d, rightParent);
            setBleedShadowAbsoluteLayout(`ConquestTicketsHudBleedChevronRight${slot}ShadowDownLeft_${pid}`, rightX - d, rightY + d, rightParent);
            // Re-attach core chevrons after shadows so the colored glyph sits above the black drop-shadow ring.
            if (leftChevron) {
                mod.SetUIWidgetParent(leftChevron, leftParent);
                mod.SetUIWidgetPosition(leftChevron, mod.CreateVector(leftX, leftY, 0));
                mod.SetUIWidgetSize(
                    leftChevron,
                    mod.CreateVector(CONQUEST_HUD_TICKET_BLEED_CHEVRON_WIDTH, CONQUEST_HUD_TICKET_BLEED_CHEVRON_HEIGHT, 0)
                );
            }
            if (rightChevron) {
                mod.SetUIWidgetParent(rightChevron, rightParent);
                mod.SetUIWidgetPosition(rightChevron, mod.CreateVector(rightX, rightY, 0));
                mod.SetUIWidgetSize(
                    rightChevron,
                    mod.CreateVector(CONQUEST_HUD_TICKET_BLEED_CHEVRON_WIDTH, CONQUEST_HUD_TICKET_BLEED_CHEVRON_HEIGHT, 0)
                );
            }
        }

        const ticketSlash = refsForPid?.conquestTicketsSlash ?? safeFind(`ConquestTicketsHudSlash_${pid}`);
        if (ticketSlash) {
            try {
                mod.SetUIWidgetAnchor(ticketSlash, mod.UIAnchor.TopLeft);
            } catch {
                // Best-effort anchor normalization only.
            }
            mod.SetUIWidgetParent(ticketSlash, ticketsParent);
            mod.SetUIWidgetPosition(ticketSlash, mod.CreateVector(CONQUEST_TICKETS_SLASH_ABS_X, CONQUEST_TICKETS_SLASH_ABS_Y, 0));
            mod.SetUIWidgetVisible(ticketSlash, false);
        }

        const leftTrack = refsForPid?.conquestTicketsDebugLeftBarTrack ?? safeFind(`ConquestTicketsHudLeftBarTrack_${pid}`);
        const leftFill = refsForPid?.conquestTicketsDebugLeftBarFill ?? safeFind(`ConquestTicketsHudLeftBarFill_${pid}`);
        if (leftTrack) {
            try {
                mod.SetUIWidgetAnchor(leftTrack, mod.UIAnchor.TopLeft);
            } catch {
                // Best-effort anchor normalization only.
            }
            mod.SetUIWidgetParent(leftTrack, ticketsParent);
            mod.SetUIWidgetPosition(leftTrack, mod.CreateVector(CONQUEST_TICKETS_LEFT_BAR_ABS_X, CONQUEST_TICKETS_BAR_ABS_Y, 0));
            mod.SetUIWidgetSize(leftTrack, mod.CreateVector(CONQUEST_HUD_TICKET_BAR_WIDTH, CONQUEST_HUD_TICKET_BAR_HEIGHT, 0));
        }
        if (leftFill && leftTrack) {
            mod.SetUIWidgetParent(leftFill, leftTrack);
            mod.SetUIWidgetPosition(leftFill, mod.CreateVector(0, 0, 0));
            if (resetDynamicFillGeometry) {
                mod.SetUIWidgetSize(leftFill, mod.CreateVector(CONQUEST_HUD_TICKET_BAR_WIDTH, CONQUEST_HUD_TICKET_BAR_HEIGHT, 0));
            }
        }

        const rightTrack = refsForPid?.conquestTicketsDebugRightBarTrack ?? safeFind(`ConquestTicketsHudRightBarTrack_${pid}`);
        const rightFill = refsForPid?.conquestTicketsDebugRightBarFill ?? safeFind(`ConquestTicketsHudRightBarFill_${pid}`);
        if (rightTrack) {
            try {
                mod.SetUIWidgetAnchor(rightTrack, mod.UIAnchor.TopLeft);
            } catch {
                // Best-effort anchor normalization only.
            }
            mod.SetUIWidgetParent(rightTrack, ticketsParent);
            mod.SetUIWidgetPosition(rightTrack, mod.CreateVector(CONQUEST_TICKETS_RIGHT_BAR_ABS_X, CONQUEST_TICKETS_BAR_ABS_Y, 0));
            mod.SetUIWidgetSize(rightTrack, mod.CreateVector(CONQUEST_HUD_TICKET_BAR_WIDTH, CONQUEST_HUD_TICKET_BAR_HEIGHT, 0));
        }
        if (rightFill && rightTrack) {
            mod.SetUIWidgetParent(rightFill, rightTrack);
            mod.SetUIWidgetPosition(rightFill, mod.CreateVector(0, 0, 0));
            if (resetDynamicFillGeometry) {
                mod.SetUIWidgetSize(rightFill, mod.CreateVector(CONQUEST_HUD_TICKET_BAR_WIDTH, CONQUEST_HUD_TICKET_BAR_HEIGHT, 0));
            }
        }
        // Final ordering pass for bleed chevrons in absolute layout:
        // 1) bar track/fill (already parented above)
        // 2) chevron shadows
        // 3) chevron colored core (top-most)
        const leftBleedChevronsFinal = refsForPid?.conquestTicketsBleedLeftChevrons ?? [];
        const rightBleedChevronsFinal = refsForPid?.conquestTicketsBleedRightChevrons ?? [];
        const chevronOverlayParentFinal = uiRoot;
        for (let chevronIndex = 0; chevronIndex < CONQUEST_HUD_TICKET_BLEED_CHEVRON_COUNT; chevronIndex++) {
            const leftParent = chevronOverlayParentFinal;
            const rightParent = chevronOverlayParentFinal;
            const leftX = getBleedChevronAbsX(true, chevronIndex);
            const rightX = getBleedChevronAbsX(false, chevronIndex);
            const leftY = CONQUEST_TICKETS_BLEED_ABS_Y;
            const rightY = CONQUEST_TICKETS_BLEED_ABS_Y;
            const slot = chevronIndex + 1;
            const d = CONQUEST_HUD_TICKET_BLEED_CHEVRON_SHADOW_OFFSET;
            const dUp = d * 0.5;
            const setBleedShadowAbsoluteFinal = (name: string, x: number, y: number, parent: mod.UIWidget): void => {
                const shadow = safeFind(name);
                if (!shadow) return;
                mod.SetUIWidgetParent(shadow, parent);
                mod.SetUIWidgetPosition(shadow, mod.CreateVector(x, y, 0));
                mod.SetUIWidgetSize(
                    shadow,
                    mod.CreateVector(CONQUEST_HUD_TICKET_BLEED_CHEVRON_WIDTH, CONQUEST_HUD_TICKET_BLEED_CHEVRON_HEIGHT, 0)
                );
            };
            setBleedShadowAbsoluteFinal(`ConquestTicketsHudBleedChevronLeft${slot}ShadowRight_${pid}`, leftX + d, leftY, leftParent);
            setBleedShadowAbsoluteFinal(`ConquestTicketsHudBleedChevronLeft${slot}ShadowLeft_${pid}`, leftX - d, leftY, leftParent);
            setBleedShadowAbsoluteFinal(`ConquestTicketsHudBleedChevronLeft${slot}ShadowUp_${pid}`, leftX, leftY - dUp, leftParent);
            setBleedShadowAbsoluteFinal(`ConquestTicketsHudBleedChevronLeft${slot}ShadowDown_${pid}`, leftX, leftY + d, leftParent);
            setBleedShadowAbsoluteFinal(`ConquestTicketsHudBleedChevronLeft${slot}ShadowUpLeft_${pid}`, leftX - d, leftY - dUp, leftParent);
            setBleedShadowAbsoluteFinal(`ConquestTicketsHudBleedChevronLeft${slot}ShadowUpRight_${pid}`, leftX + d, leftY - dUp, leftParent);
            setBleedShadowAbsoluteFinal(`ConquestTicketsHudBleedChevronLeft${slot}ShadowDownRight_${pid}`, leftX + d, leftY + d, leftParent);
            setBleedShadowAbsoluteFinal(`ConquestTicketsHudBleedChevronLeft${slot}ShadowDownLeft_${pid}`, leftX - d, leftY + d, leftParent);
            setBleedShadowAbsoluteFinal(`ConquestTicketsHudBleedChevronRight${slot}ShadowRight_${pid}`, rightX + d, rightY, rightParent);
            setBleedShadowAbsoluteFinal(`ConquestTicketsHudBleedChevronRight${slot}ShadowLeft_${pid}`, rightX - d, rightY, rightParent);
            setBleedShadowAbsoluteFinal(`ConquestTicketsHudBleedChevronRight${slot}ShadowUp_${pid}`, rightX, rightY - dUp, rightParent);
            setBleedShadowAbsoluteFinal(`ConquestTicketsHudBleedChevronRight${slot}ShadowDown_${pid}`, rightX, rightY + d, rightParent);
            setBleedShadowAbsoluteFinal(`ConquestTicketsHudBleedChevronRight${slot}ShadowUpLeft_${pid}`, rightX - d, rightY - dUp, rightParent);
            setBleedShadowAbsoluteFinal(`ConquestTicketsHudBleedChevronRight${slot}ShadowUpRight_${pid}`, rightX + d, rightY - dUp, rightParent);
            setBleedShadowAbsoluteFinal(`ConquestTicketsHudBleedChevronRight${slot}ShadowDownRight_${pid}`, rightX + d, rightY + d, rightParent);
            setBleedShadowAbsoluteFinal(`ConquestTicketsHudBleedChevronRight${slot}ShadowDownLeft_${pid}`, rightX - d, rightY + d, rightParent);

            const leftChevron = leftBleedChevronsFinal[chevronIndex] ?? safeFind(`ConquestTicketsHudBleedChevronLeft${slot}_${pid}`);
            if (leftChevron) {
                mod.SetUIWidgetParent(leftChevron, leftParent);
                mod.SetUIWidgetPosition(leftChevron, mod.CreateVector(leftX, leftY, 0));
                mod.SetUIWidgetSize(
                    leftChevron,
                    mod.CreateVector(CONQUEST_HUD_TICKET_BLEED_CHEVRON_WIDTH, CONQUEST_HUD_TICKET_BLEED_CHEVRON_HEIGHT, 0)
                );
            }
            const rightChevron = rightBleedChevronsFinal[chevronIndex] ?? safeFind(`ConquestTicketsHudBleedChevronRight${slot}_${pid}`);
            if (rightChevron) {
                mod.SetUIWidgetParent(rightChevron, rightParent);
                mod.SetUIWidgetPosition(rightChevron, mod.CreateVector(rightX, rightY, 0));
                mod.SetUIWidgetSize(
                    rightChevron,
                    mod.CreateVector(CONQUEST_HUD_TICKET_BLEED_CHEVRON_WIDTH, CONQUEST_HUD_TICKET_BLEED_CHEVRON_HEIGHT, 0)
                );
            }
        }

        const slotRoots = refsForPid?.conquestFlagsDebugSlotRoots ?? [];
        const slotBorders = refsForPid?.conquestFlagsDebugBorderRows ?? [];
        const slotFills = refsForPid?.conquestFlagsDebugFillRows ?? [];
        const slotLabelShadowsRight = refsForPid?.conquestFlagsDebugLabelShadowRightRows ?? [];
        const slotLabelShadowsLeft = refsForPid?.conquestFlagsDebugLabelShadowLeftRows ?? [];
        const slotLabelShadowsUp = refsForPid?.conquestFlagsDebugLabelShadowUpRows ?? [];
        const slotLabelShadowsDown = refsForPid?.conquestFlagsDebugLabelShadowDownRows ?? [];
        const slotLabelShadowsUpLeft = refsForPid?.conquestFlagsDebugLabelShadowUpLeftRows ?? [];
        const slotLabelShadowsUpRight = refsForPid?.conquestFlagsDebugLabelShadowUpRightRows ?? [];
        const slotLabelShadowsDownRight = refsForPid?.conquestFlagsDebugLabelShadowDownRightRows ?? [];
        const slotLabelShadowsDownLeft = refsForPid?.conquestFlagsDebugLabelShadowDownLeftRows ?? [];
        const slotLabelShadowsInner = refsForPid?.conquestFlagsDebugLabelShadowInnerRows ?? [];
        const slotLabelShadowsInnerDeep = refsForPid?.conquestFlagsDebugLabelShadowInnerDeepRows ?? [];
        const slotLabels = refsForPid?.conquestFlagsDebugLabelRows ?? [];
        const slotPercentRoots = refsForPid?.conquestFlagsDebugPercentRoots ?? [];
        const slotPercentShadowsRight = refsForPid?.conquestFlagsDebugPercentShadowRightRows ?? [];
        const slotPercentShadowsLeft = refsForPid?.conquestFlagsDebugPercentShadowLeftRows ?? [];
        const slotPercentShadowsUp = refsForPid?.conquestFlagsDebugPercentShadowUpRows ?? [];
        const slotPercentShadowsDown = refsForPid?.conquestFlagsDebugPercentShadowDownRows ?? [];
        const slotPercentShadowsUpLeft = refsForPid?.conquestFlagsDebugPercentShadowUpLeftRows ?? [];
        const slotPercentShadowsUpRight = refsForPid?.conquestFlagsDebugPercentShadowUpRightRows ?? [];
        const slotPercentShadowsDownRight = refsForPid?.conquestFlagsDebugPercentShadowDownRightRows ?? [];
        const slotPercentShadowsDownLeft = refsForPid?.conquestFlagsDebugPercentShadowDownLeftRows ?? [];
        const slotPercentShadowsInner = refsForPid?.conquestFlagsDebugPercentShadowInnerRows ?? [];
        const slotPercentTexts = refsForPid?.conquestFlagsDebugPercentTextRows ?? [];
        for (let i = 0; i < CONQUEST_FLAGS_MAX_ROWS; i++) {
            const slot = slotRoots[i] ?? safeFind(`ConquestFlagHudSlot_${pid}_${i}`);
            const border = slotBorders[i] ?? safeFind(`ConquestFlagHudBorder_${pid}_${i}`);
            const fill = slotFills[i] ?? safeFind(`ConquestFlagHudFill_${pid}_${i}`);
            const labelShadowRight = slotLabelShadowsRight[i] ?? safeFind(`ConquestFlagHudLabelShadowRight_${pid}_${i}`);
            const labelShadowLeft = slotLabelShadowsLeft[i] ?? safeFind(`ConquestFlagHudLabelShadowLeft_${pid}_${i}`);
            const labelShadowUp = slotLabelShadowsUp[i] ?? safeFind(`ConquestFlagHudLabelShadowUp_${pid}_${i}`);
            const labelShadowDown = slotLabelShadowsDown[i] ?? safeFind(`ConquestFlagHudLabelShadowDown_${pid}_${i}`);
            const labelShadowUpLeft = slotLabelShadowsUpLeft[i] ?? safeFind(`ConquestFlagHudLabelShadowUpLeft_${pid}_${i}`);
            const labelShadowUpRight = slotLabelShadowsUpRight[i] ?? safeFind(`ConquestFlagHudLabelShadowUpRight_${pid}_${i}`);
            const labelShadowDownRight = slotLabelShadowsDownRight[i] ?? safeFind(`ConquestFlagHudLabelShadowDownRight_${pid}_${i}`);
            const labelShadowDownLeft = slotLabelShadowsDownLeft[i] ?? safeFind(`ConquestFlagHudLabelShadowDownLeft_${pid}_${i}`);
            const labelShadowInner = slotLabelShadowsInner[i] ?? safeFind(`ConquestFlagHudLabelShadowInner_${pid}_${i}`);
            const labelShadowInnerDeep = slotLabelShadowsInnerDeep[i] ?? safeFind(`ConquestFlagHudLabelShadowInnerDeep_${pid}_${i}`);
            const label = slotLabels[i] ?? safeFind(`ConquestFlagHudLabel_${pid}_${i}`);
            const percentRoot = slotPercentRoots[i] ?? safeFind(`ConquestFlagHudPercentRoot_${pid}_${i}`);
            const percentShadowRight = slotPercentShadowsRight[i] ?? safeFind(`ConquestFlagHudPercentShadowRight_${pid}_${i}`);
            const percentShadowLeft = slotPercentShadowsLeft[i] ?? safeFind(`ConquestFlagHudPercentShadowLeft_${pid}_${i}`);
            const percentShadowUp = slotPercentShadowsUp[i] ?? safeFind(`ConquestFlagHudPercentShadowUp_${pid}_${i}`);
            const percentShadowDown = slotPercentShadowsDown[i] ?? safeFind(`ConquestFlagHudPercentShadowDown_${pid}_${i}`);
            const percentShadowUpLeft = slotPercentShadowsUpLeft[i] ?? safeFind(`ConquestFlagHudPercentShadowUpLeft_${pid}_${i}`);
            const percentShadowUpRight = slotPercentShadowsUpRight[i] ?? safeFind(`ConquestFlagHudPercentShadowUpRight_${pid}_${i}`);
            const percentShadowDownRight = slotPercentShadowsDownRight[i] ?? safeFind(`ConquestFlagHudPercentShadowDownRight_${pid}_${i}`);
            const percentShadowDownLeft = slotPercentShadowsDownLeft[i] ?? safeFind(`ConquestFlagHudPercentShadowDownLeft_${pid}_${i}`);
            const percentShadowInner = slotPercentShadowsInner[i] ?? safeFind(`ConquestFlagHudPercentShadowInner_${pid}_${i}`);
            const percentText = slotPercentTexts[i] ?? safeFind(`ConquestFlagHudPercentText_${pid}_${i}`);
            const slotAbsX = CONQUEST_FLAGS_SLOT_ABS_X[i] ?? (840.50 + (i * 35.0));
            if (slot) {
                try {
                    mod.SetUIWidgetAnchor(slot, mod.UIAnchor.TopLeft);
                } catch {
                    // Best-effort anchor normalization only.
                }
                mod.SetUIWidgetParent(slot, flagsParent);
                mod.SetUIWidgetPosition(slot, mod.CreateVector(slotAbsX, CONQUEST_FLAGS_SLOT_ABS_Y, 0));
                mod.SetUIWidgetSize(slot, mod.CreateVector(CONQUEST_HUD_FLAG_SLOT_WIDTH, CONQUEST_HUD_FLAG_SLOT_HEIGHT, 0));
            }
            if (fill && slot) {
                mod.SetUIWidgetParent(fill, slot);
                if (resetDynamicFillGeometry) {
                    mod.SetUIWidgetPosition(fill, mod.CreateVector(CONQUEST_HUD_FLAG_FILL_INSET_X, CONQUEST_HUD_FLAG_FILL_INSET_Y, 0));
                    mod.SetUIWidgetSize(fill, mod.CreateVector(CONQUEST_HUD_FLAG_FILL_MAX_WIDTH, CONQUEST_HUD_FLAG_FILL_MAX_HEIGHT, 0));
                }
            }
            if (border && slot) {
                mod.SetUIWidgetParent(border, slot);
                mod.SetUIWidgetPosition(border, mod.CreateVector(0, 0, 0));
                mod.SetUIWidgetSize(border, mod.CreateVector(CONQUEST_HUD_FLAG_SLOT_WIDTH, CONQUEST_HUD_FLAG_SLOT_HEIGHT, 0));
            }
            if (labelShadowRight && slot) {
                mod.SetUIWidgetParent(labelShadowRight, slot);
                mod.SetUIWidgetPosition(labelShadowRight, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_X + CONQUEST_HUD_FLAG_LABEL_SHADOW_OFFSET, CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_Y, 0));
                mod.SetUIWidgetSize(labelShadowRight, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_LABEL_WIDGET_HEIGHT, 0));
            }
            if (labelShadowLeft && slot) {
                mod.SetUIWidgetParent(labelShadowLeft, slot);
                mod.SetUIWidgetPosition(labelShadowLeft, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_X - CONQUEST_HUD_FLAG_LABEL_SHADOW_OFFSET, CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_Y, 0));
                mod.SetUIWidgetSize(labelShadowLeft, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_LABEL_WIDGET_HEIGHT, 0));
            }
            if (labelShadowUp && slot) {
                mod.SetUIWidgetParent(labelShadowUp, slot);
                mod.SetUIWidgetPosition(labelShadowUp, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_X, CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_Y - CONQUEST_HUD_FLAG_LABEL_SHADOW_OFFSET, 0));
                mod.SetUIWidgetSize(labelShadowUp, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_LABEL_WIDGET_HEIGHT, 0));
            }
            if (labelShadowDown && slot) {
                mod.SetUIWidgetParent(labelShadowDown, slot);
                mod.SetUIWidgetPosition(labelShadowDown, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_X, CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_Y + CONQUEST_HUD_FLAG_LABEL_SHADOW_OFFSET, 0));
                mod.SetUIWidgetSize(labelShadowDown, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_LABEL_WIDGET_HEIGHT, 0));
            }
            if (labelShadowUpLeft && slot) {
                mod.SetUIWidgetParent(labelShadowUpLeft, slot);
                mod.SetUIWidgetPosition(labelShadowUpLeft, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_X - CONQUEST_HUD_FLAG_LABEL_SHADOW_OFFSET, CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_Y - CONQUEST_HUD_FLAG_LABEL_SHADOW_OFFSET, 0));
                mod.SetUIWidgetSize(labelShadowUpLeft, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_LABEL_WIDGET_HEIGHT, 0));
            }
            if (labelShadowUpRight && slot) {
                mod.SetUIWidgetParent(labelShadowUpRight, slot);
                mod.SetUIWidgetPosition(labelShadowUpRight, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_X + CONQUEST_HUD_FLAG_LABEL_SHADOW_OFFSET, CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_Y - CONQUEST_HUD_FLAG_LABEL_SHADOW_OFFSET, 0));
                mod.SetUIWidgetSize(labelShadowUpRight, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_LABEL_WIDGET_HEIGHT, 0));
            }
            if (labelShadowDownRight && slot) {
                mod.SetUIWidgetParent(labelShadowDownRight, slot);
                mod.SetUIWidgetPosition(labelShadowDownRight, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_X + CONQUEST_HUD_FLAG_LABEL_SHADOW_OFFSET, CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_Y + CONQUEST_HUD_FLAG_LABEL_SHADOW_OFFSET, 0));
                mod.SetUIWidgetSize(labelShadowDownRight, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_LABEL_WIDGET_HEIGHT, 0));
            }
            if (labelShadowDownLeft && slot) {
                mod.SetUIWidgetParent(labelShadowDownLeft, slot);
                mod.SetUIWidgetPosition(labelShadowDownLeft, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_X - CONQUEST_HUD_FLAG_LABEL_SHADOW_OFFSET, CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_Y + CONQUEST_HUD_FLAG_LABEL_SHADOW_OFFSET, 0));
                mod.SetUIWidgetSize(labelShadowDownLeft, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_LABEL_WIDGET_HEIGHT, 0));
            }
            if (labelShadowInner && slot) {
                mod.SetUIWidgetParent(labelShadowInner, slot);
                mod.SetUIWidgetPosition(labelShadowInner, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_X, CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_Y, 0));
                mod.SetUIWidgetSize(labelShadowInner, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_LABEL_WIDGET_HEIGHT, 0));
            }
            if (labelShadowInnerDeep && slot) {
                mod.SetUIWidgetParent(labelShadowInnerDeep, slot);
                mod.SetUIWidgetPosition(labelShadowInnerDeep, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_X, CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_Y, 0));
                mod.SetUIWidgetSize(labelShadowInnerDeep, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_LABEL_WIDGET_HEIGHT, 0));
            }
            if (label && slot) {
                mod.SetUIWidgetParent(label, slot);
                mod.SetUIWidgetPosition(label, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_X, CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_Y, 0));
                mod.SetUIWidgetSize(label, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_LABEL_WIDGET_HEIGHT, 0));
            }
            if (percentRoot) {
                try {
                    mod.SetUIWidgetAnchor(percentRoot, mod.UIAnchor.TopLeft);
                } catch {
                    // Best-effort anchor normalization only.
                }
                mod.SetUIWidgetParent(percentRoot, flagsParent);
                mod.SetUIWidgetPosition(percentRoot, mod.CreateVector(slotAbsX + CONQUEST_HUD_FLAG_PERCENT_OFFSET_X, CONQUEST_FLAGS_SLOT_ABS_Y + CONQUEST_HUD_FLAG_PERCENT_OFFSET_Y, 0));
                mod.SetUIWidgetSize(percentRoot, mod.CreateVector(CONQUEST_HUD_FLAG_PERCENT_ROOT_WIDTH, CONQUEST_HUD_FLAG_PERCENT_ROOT_HEIGHT, 0));
            }
            if (percentShadowRight && percentRoot) {
                mod.SetUIWidgetParent(percentShadowRight, percentRoot);
                mod.SetUIWidgetPosition(percentShadowRight, mod.CreateVector(CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_X + CONQUEST_HUD_FLAG_PERCENT_SHADOW_OFFSET, CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_Y, 0));
                mod.SetUIWidgetSize(percentShadowRight, mod.CreateVector(CONQUEST_HUD_FLAG_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_PERCENT_WIDGET_HEIGHT, 0));
            }
            if (percentShadowLeft && percentRoot) {
                mod.SetUIWidgetParent(percentShadowLeft, percentRoot);
                mod.SetUIWidgetPosition(percentShadowLeft, mod.CreateVector(CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_X - CONQUEST_HUD_FLAG_PERCENT_SHADOW_OFFSET, CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_Y, 0));
                mod.SetUIWidgetSize(percentShadowLeft, mod.CreateVector(CONQUEST_HUD_FLAG_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_PERCENT_WIDGET_HEIGHT, 0));
            }
            if (percentShadowUp && percentRoot) {
                mod.SetUIWidgetParent(percentShadowUp, percentRoot);
                mod.SetUIWidgetPosition(percentShadowUp, mod.CreateVector(CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_X, CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_Y - CONQUEST_HUD_FLAG_PERCENT_SHADOW_OFFSET, 0));
                mod.SetUIWidgetSize(percentShadowUp, mod.CreateVector(CONQUEST_HUD_FLAG_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_PERCENT_WIDGET_HEIGHT, 0));
            }
            if (percentShadowDown && percentRoot) {
                mod.SetUIWidgetParent(percentShadowDown, percentRoot);
                mod.SetUIWidgetPosition(percentShadowDown, mod.CreateVector(CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_X, CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_Y + CONQUEST_HUD_FLAG_PERCENT_SHADOW_OFFSET, 0));
                mod.SetUIWidgetSize(percentShadowDown, mod.CreateVector(CONQUEST_HUD_FLAG_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_PERCENT_WIDGET_HEIGHT, 0));
            }
            if (percentShadowUpLeft && percentRoot) {
                mod.SetUIWidgetParent(percentShadowUpLeft, percentRoot);
                mod.SetUIWidgetPosition(percentShadowUpLeft, mod.CreateVector(CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_X - CONQUEST_HUD_FLAG_PERCENT_SHADOW_OFFSET, CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_Y - CONQUEST_HUD_FLAG_PERCENT_SHADOW_OFFSET, 0));
                mod.SetUIWidgetSize(percentShadowUpLeft, mod.CreateVector(CONQUEST_HUD_FLAG_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_PERCENT_WIDGET_HEIGHT, 0));
            }
            if (percentShadowUpRight && percentRoot) {
                mod.SetUIWidgetParent(percentShadowUpRight, percentRoot);
                mod.SetUIWidgetPosition(percentShadowUpRight, mod.CreateVector(CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_X + CONQUEST_HUD_FLAG_PERCENT_SHADOW_OFFSET, CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_Y - CONQUEST_HUD_FLAG_PERCENT_SHADOW_OFFSET, 0));
                mod.SetUIWidgetSize(percentShadowUpRight, mod.CreateVector(CONQUEST_HUD_FLAG_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_PERCENT_WIDGET_HEIGHT, 0));
            }
            if (percentShadowDownRight && percentRoot) {
                mod.SetUIWidgetParent(percentShadowDownRight, percentRoot);
                mod.SetUIWidgetPosition(percentShadowDownRight, mod.CreateVector(CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_X + CONQUEST_HUD_FLAG_PERCENT_SHADOW_OFFSET, CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_Y + CONQUEST_HUD_FLAG_PERCENT_SHADOW_OFFSET, 0));
                mod.SetUIWidgetSize(percentShadowDownRight, mod.CreateVector(CONQUEST_HUD_FLAG_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_PERCENT_WIDGET_HEIGHT, 0));
            }
            if (percentShadowDownLeft && percentRoot) {
                mod.SetUIWidgetParent(percentShadowDownLeft, percentRoot);
                mod.SetUIWidgetPosition(percentShadowDownLeft, mod.CreateVector(CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_X - CONQUEST_HUD_FLAG_PERCENT_SHADOW_OFFSET, CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_Y + CONQUEST_HUD_FLAG_PERCENT_SHADOW_OFFSET, 0));
                mod.SetUIWidgetSize(percentShadowDownLeft, mod.CreateVector(CONQUEST_HUD_FLAG_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_PERCENT_WIDGET_HEIGHT, 0));
            }
            if (percentShadowInner && percentRoot) {
                mod.SetUIWidgetParent(percentShadowInner, percentRoot);
                mod.SetUIWidgetPosition(percentShadowInner, mod.CreateVector(CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_X, CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_Y, 0));
                mod.SetUIWidgetSize(percentShadowInner, mod.CreateVector(CONQUEST_HUD_FLAG_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_PERCENT_WIDGET_HEIGHT, 0));
            }
            if (percentText && percentRoot) {
                mod.SetUIWidgetParent(percentText, percentRoot);
                mod.SetUIWidgetPosition(percentText, mod.CreateVector(CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_X, CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_Y, 0));
                mod.SetUIWidgetSize(percentText, mod.CreateVector(CONQUEST_HUD_FLAG_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_PERCENT_WIDGET_HEIGHT, 0));
            }
        }

        const activePopoutRoot = refsForPid?.conquestFlagsActivePopoutRoot ?? safeFind(`ConquestFlagHudActivePopoutRoot_${pid}`);
        const activePopoutSlot = refsForPid?.conquestFlagsActivePopoutSlot ?? safeFind(`ConquestFlagHudActivePopoutSlot_${pid}`);
        const activePopoutBorder = refsForPid?.conquestFlagsActivePopoutBorder ?? safeFind(`ConquestFlagHudActivePopoutBorder_${pid}`);
        const activePopoutFill = refsForPid?.conquestFlagsActivePopoutFill ?? safeFind(`ConquestFlagHudActivePopoutFill_${pid}`);
        const activePopoutLabelShadowRight = refsForPid?.conquestFlagsActivePopoutLabelShadowRight ?? safeFind(`ConquestFlagHudActivePopoutLabelShadowRight_${pid}`);
        const activePopoutLabelShadowLeft = refsForPid?.conquestFlagsActivePopoutLabelShadowLeft ?? safeFind(`ConquestFlagHudActivePopoutLabelShadowLeft_${pid}`);
        const activePopoutLabelShadowUp = refsForPid?.conquestFlagsActivePopoutLabelShadowUp ?? safeFind(`ConquestFlagHudActivePopoutLabelShadowUp_${pid}`);
        const activePopoutLabelShadowDown = refsForPid?.conquestFlagsActivePopoutLabelShadowDown ?? safeFind(`ConquestFlagHudActivePopoutLabelShadowDown_${pid}`);
        const activePopoutLabelShadowUpLeft = refsForPid?.conquestFlagsActivePopoutLabelShadowUpLeft ?? safeFind(`ConquestFlagHudActivePopoutLabelShadowUpLeft_${pid}`);
        const activePopoutLabelShadowUpRight = refsForPid?.conquestFlagsActivePopoutLabelShadowUpRight ?? safeFind(`ConquestFlagHudActivePopoutLabelShadowUpRight_${pid}`);
        const activePopoutLabelShadowDownRight = refsForPid?.conquestFlagsActivePopoutLabelShadowDownRight ?? safeFind(`ConquestFlagHudActivePopoutLabelShadowDownRight_${pid}`);
        const activePopoutLabelShadowDownLeft = refsForPid?.conquestFlagsActivePopoutLabelShadowDownLeft ?? safeFind(`ConquestFlagHudActivePopoutLabelShadowDownLeft_${pid}`);
        const activePopoutLabel = refsForPid?.conquestFlagsActivePopoutLabel ?? safeFind(`ConquestFlagHudActivePopoutLabel_${pid}`);
        const activePopoutPercentRoot = refsForPid?.conquestFlagsActivePopoutPercentRoot ?? safeFind(`ConquestFlagHudActivePopoutPercentRoot_${pid}`);
        const activePopoutPercentShadowRight = refsForPid?.conquestFlagsActivePopoutPercentShadowRight ?? safeFind(`ConquestFlagHudActivePopoutPercentShadowRight_${pid}`);
        const activePopoutPercentShadowLeft = refsForPid?.conquestFlagsActivePopoutPercentShadowLeft ?? safeFind(`ConquestFlagHudActivePopoutPercentShadowLeft_${pid}`);
        const activePopoutPercentShadowUp = refsForPid?.conquestFlagsActivePopoutPercentShadowUp ?? safeFind(`ConquestFlagHudActivePopoutPercentShadowUp_${pid}`);
        const activePopoutPercentShadowDown = refsForPid?.conquestFlagsActivePopoutPercentShadowDown ?? safeFind(`ConquestFlagHudActivePopoutPercentShadowDown_${pid}`);
        const activePopoutPercentShadowUpLeft = refsForPid?.conquestFlagsActivePopoutPercentShadowUpLeft ?? safeFind(`ConquestFlagHudActivePopoutPercentShadowUpLeft_${pid}`);
        const activePopoutPercentShadowUpRight = refsForPid?.conquestFlagsActivePopoutPercentShadowUpRight ?? safeFind(`ConquestFlagHudActivePopoutPercentShadowUpRight_${pid}`);
        const activePopoutPercentShadowDownRight = refsForPid?.conquestFlagsActivePopoutPercentShadowDownRight ?? safeFind(`ConquestFlagHudActivePopoutPercentShadowDownRight_${pid}`);
        const activePopoutPercentShadowDownLeft = refsForPid?.conquestFlagsActivePopoutPercentShadowDownLeft ?? safeFind(`ConquestFlagHudActivePopoutPercentShadowDownLeft_${pid}`);
        const activePopoutPercentShadowInner = refsForPid?.conquestFlagsActivePopoutPercentShadowInner ?? safeFind(`ConquestFlagHudActivePopoutPercentShadowInner_${pid}`);
        const activePopoutPercentText = refsForPid?.conquestFlagsActivePopoutPercentText ?? safeFind(`ConquestFlagHudActivePopoutPercentText_${pid}`);

        if (activePopoutRoot) {
            try {
                mod.SetUIWidgetAnchor(activePopoutRoot, mod.UIAnchor.TopLeft);
            } catch {
                // Best-effort anchor normalization only.
            }
            mod.SetUIWidgetParent(activePopoutRoot, flagsParent);
            mod.SetUIWidgetPosition(activePopoutRoot, mod.CreateVector(CONQUEST_FLAGS_ACTIVE_POPOUT_ABS_X, CONQUEST_FLAGS_ACTIVE_POPOUT_ABS_Y, 0));
            mod.SetUIWidgetSize(
                activePopoutRoot,
                mod.CreateVector(CONQUEST_HUD_FLAG_ACTIVE_POPOUT_ROOT_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_ROOT_HEIGHT, 0)
            );
        }
        if (activePopoutSlot && activePopoutRoot) {
            mod.SetUIWidgetParent(activePopoutSlot, activePopoutRoot);
            mod.SetUIWidgetPosition(
                activePopoutSlot,
                mod.CreateVector(CONQUEST_HUD_FLAG_ACTIVE_POPOUT_SLOT_OFFSET_X, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_SLOT_OFFSET_Y, 0)
            );
            mod.SetUIWidgetSize(
                activePopoutSlot,
                mod.CreateVector(CONQUEST_HUD_FLAG_ACTIVE_POPOUT_SLOT_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_SLOT_HEIGHT, 0)
            );
        }
        if (activePopoutBorder && activePopoutSlot) {
            mod.SetUIWidgetParent(activePopoutBorder, activePopoutSlot);
            mod.SetUIWidgetPosition(activePopoutBorder, mod.CreateVector(0, 0, 0));
            mod.SetUIWidgetSize(
                activePopoutBorder,
                mod.CreateVector(CONQUEST_HUD_FLAG_ACTIVE_POPOUT_SLOT_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_SLOT_HEIGHT, 0)
            );
        }
        if (activePopoutFill && activePopoutSlot) {
            mod.SetUIWidgetParent(activePopoutFill, activePopoutSlot);
            mod.SetUIWidgetPosition(
                activePopoutFill,
                mod.CreateVector(CONQUEST_HUD_FLAG_ACTIVE_POPOUT_FILL_INSET_X, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_FILL_INSET_Y, 0)
            );
            if (resetDynamicFillGeometry) {
                mod.SetUIWidgetSize(
                    activePopoutFill,
                    mod.CreateVector(
                        CONQUEST_HUD_FLAG_ACTIVE_POPOUT_FILL_MAX_WIDTH,
                        CONQUEST_HUD_FLAG_ACTIVE_POPOUT_FILL_MAX_HEIGHT,
                        0
                    )
                );
            }
        }
        if (activePopoutLabelShadowRight && activePopoutSlot) {
            mod.SetUIWidgetParent(activePopoutLabelShadowRight, activePopoutSlot);
            mod.SetUIWidgetPosition(
                activePopoutLabelShadowRight,
                mod.CreateVector(
                    CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_OFFSET_X + CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET,
                    CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_OFFSET_Y,
                    0
                )
            );
            mod.SetUIWidgetSize(
                activePopoutLabelShadowRight,
                mod.CreateVector(CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_HEIGHT, 0)
            );
        }
        if (activePopoutLabelShadowLeft && activePopoutSlot) {
            mod.SetUIWidgetParent(activePopoutLabelShadowLeft, activePopoutSlot);
            mod.SetUIWidgetPosition(
                activePopoutLabelShadowLeft,
                mod.CreateVector(
                    CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_OFFSET_X - CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET,
                    CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_OFFSET_Y,
                    0
                )
            );
            mod.SetUIWidgetSize(
                activePopoutLabelShadowLeft,
                mod.CreateVector(CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_HEIGHT, 0)
            );
        }
        if (activePopoutLabelShadowUp && activePopoutSlot) {
            mod.SetUIWidgetParent(activePopoutLabelShadowUp, activePopoutSlot);
            mod.SetUIWidgetPosition(
                activePopoutLabelShadowUp,
                mod.CreateVector(
                    CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_OFFSET_X,
                    CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_OFFSET_Y - CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET,
                    0
                )
            );
            mod.SetUIWidgetSize(
                activePopoutLabelShadowUp,
                mod.CreateVector(CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_HEIGHT, 0)
            );
        }
        if (activePopoutLabelShadowDown && activePopoutSlot) {
            mod.SetUIWidgetParent(activePopoutLabelShadowDown, activePopoutSlot);
            mod.SetUIWidgetPosition(
                activePopoutLabelShadowDown,
                mod.CreateVector(
                    CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_OFFSET_X,
                    CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_OFFSET_Y + CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET,
                    0
                )
            );
            mod.SetUIWidgetSize(
                activePopoutLabelShadowDown,
                mod.CreateVector(CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_HEIGHT, 0)
            );
        }
        if (activePopoutLabelShadowUpLeft && activePopoutSlot) {
            mod.SetUIWidgetParent(activePopoutLabelShadowUpLeft, activePopoutSlot);
            mod.SetUIWidgetPosition(
                activePopoutLabelShadowUpLeft,
                mod.CreateVector(
                    CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_OFFSET_X - CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET,
                    CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_OFFSET_Y - CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET,
                    0
                )
            );
            mod.SetUIWidgetSize(
                activePopoutLabelShadowUpLeft,
                mod.CreateVector(CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_HEIGHT, 0)
            );
        }
        if (activePopoutLabelShadowUpRight && activePopoutSlot) {
            mod.SetUIWidgetParent(activePopoutLabelShadowUpRight, activePopoutSlot);
            mod.SetUIWidgetPosition(
                activePopoutLabelShadowUpRight,
                mod.CreateVector(
                    CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_OFFSET_X + CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET,
                    CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_OFFSET_Y - CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET,
                    0
                )
            );
            mod.SetUIWidgetSize(
                activePopoutLabelShadowUpRight,
                mod.CreateVector(CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_HEIGHT, 0)
            );
        }
        if (activePopoutLabelShadowDownRight && activePopoutSlot) {
            mod.SetUIWidgetParent(activePopoutLabelShadowDownRight, activePopoutSlot);
            mod.SetUIWidgetPosition(
                activePopoutLabelShadowDownRight,
                mod.CreateVector(
                    CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_OFFSET_X + CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET,
                    CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_OFFSET_Y + CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET,
                    0
                )
            );
            mod.SetUIWidgetSize(
                activePopoutLabelShadowDownRight,
                mod.CreateVector(CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_HEIGHT, 0)
            );
        }
        if (activePopoutLabelShadowDownLeft && activePopoutSlot) {
            mod.SetUIWidgetParent(activePopoutLabelShadowDownLeft, activePopoutSlot);
            mod.SetUIWidgetPosition(
                activePopoutLabelShadowDownLeft,
                mod.CreateVector(
                    CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_OFFSET_X - CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET,
                    CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_OFFSET_Y + CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET,
                    0
                )
            );
            mod.SetUIWidgetSize(
                activePopoutLabelShadowDownLeft,
                mod.CreateVector(CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_HEIGHT, 0)
            );
        }
        if (activePopoutLabel && activePopoutSlot) {
            mod.SetUIWidgetParent(activePopoutLabel, activePopoutSlot);
            mod.SetUIWidgetPosition(
                activePopoutLabel,
                mod.CreateVector(CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_OFFSET_X, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_OFFSET_Y, 0)
            );
            mod.SetUIWidgetSize(
                activePopoutLabel,
                mod.CreateVector(CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_HEIGHT, 0)
            );
        }
        if (activePopoutPercentRoot && activePopoutRoot) {
            mod.SetUIWidgetParent(activePopoutPercentRoot, activePopoutRoot);
            mod.SetUIWidgetPosition(
                activePopoutPercentRoot,
                mod.CreateVector(CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_OFFSET_X, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_OFFSET_Y, 0)
            );
            mod.SetUIWidgetSize(
                activePopoutPercentRoot,
                mod.CreateVector(CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_ROOT_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_ROOT_HEIGHT, 0)
            );
        }
        if (activePopoutPercentShadowRight && activePopoutPercentRoot) {
            mod.SetUIWidgetParent(activePopoutPercentShadowRight, activePopoutPercentRoot);
            mod.SetUIWidgetPosition(
                activePopoutPercentShadowRight,
                mod.CreateVector(
                    CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_OFFSET_X + CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET,
                    CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_OFFSET_Y,
                    0
                )
            );
            mod.SetUIWidgetSize(
                activePopoutPercentShadowRight,
                mod.CreateVector(CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_HEIGHT, 0)
            );
        }
        if (activePopoutPercentShadowLeft && activePopoutPercentRoot) {
            mod.SetUIWidgetParent(activePopoutPercentShadowLeft, activePopoutPercentRoot);
            mod.SetUIWidgetPosition(
                activePopoutPercentShadowLeft,
                mod.CreateVector(
                    CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_OFFSET_X - CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET,
                    CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_OFFSET_Y,
                    0
                )
            );
            mod.SetUIWidgetSize(
                activePopoutPercentShadowLeft,
                mod.CreateVector(CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_HEIGHT, 0)
            );
        }
        if (activePopoutPercentShadowUp && activePopoutPercentRoot) {
            mod.SetUIWidgetParent(activePopoutPercentShadowUp, activePopoutPercentRoot);
            mod.SetUIWidgetPosition(
                activePopoutPercentShadowUp,
                mod.CreateVector(
                    CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_OFFSET_X,
                    CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_OFFSET_Y - CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET,
                    0
                )
            );
            mod.SetUIWidgetSize(
                activePopoutPercentShadowUp,
                mod.CreateVector(CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_HEIGHT, 0)
            );
        }
        if (activePopoutPercentShadowDown && activePopoutPercentRoot) {
            mod.SetUIWidgetParent(activePopoutPercentShadowDown, activePopoutPercentRoot);
            mod.SetUIWidgetPosition(
                activePopoutPercentShadowDown,
                mod.CreateVector(
                    CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_OFFSET_X,
                    CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_OFFSET_Y + CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET,
                    0
                )
            );
            mod.SetUIWidgetSize(
                activePopoutPercentShadowDown,
                mod.CreateVector(CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_HEIGHT, 0)
            );
        }
        if (activePopoutPercentShadowUpLeft && activePopoutPercentRoot) {
            mod.SetUIWidgetParent(activePopoutPercentShadowUpLeft, activePopoutPercentRoot);
            mod.SetUIWidgetPosition(
                activePopoutPercentShadowUpLeft,
                mod.CreateVector(
                    CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_OFFSET_X - CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET,
                    CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_OFFSET_Y - CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET,
                    0
                )
            );
            mod.SetUIWidgetSize(
                activePopoutPercentShadowUpLeft,
                mod.CreateVector(CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_HEIGHT, 0)
            );
        }
        if (activePopoutPercentShadowUpRight && activePopoutPercentRoot) {
            mod.SetUIWidgetParent(activePopoutPercentShadowUpRight, activePopoutPercentRoot);
            mod.SetUIWidgetPosition(
                activePopoutPercentShadowUpRight,
                mod.CreateVector(
                    CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_OFFSET_X + CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET,
                    CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_OFFSET_Y - CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET,
                    0
                )
            );
            mod.SetUIWidgetSize(
                activePopoutPercentShadowUpRight,
                mod.CreateVector(CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_HEIGHT, 0)
            );
        }
        if (activePopoutPercentShadowDownRight && activePopoutPercentRoot) {
            mod.SetUIWidgetParent(activePopoutPercentShadowDownRight, activePopoutPercentRoot);
            mod.SetUIWidgetPosition(
                activePopoutPercentShadowDownRight,
                mod.CreateVector(
                    CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_OFFSET_X + CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET,
                    CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_OFFSET_Y + CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET,
                    0
                )
            );
            mod.SetUIWidgetSize(
                activePopoutPercentShadowDownRight,
                mod.CreateVector(CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_HEIGHT, 0)
            );
        }
        if (activePopoutPercentShadowDownLeft && activePopoutPercentRoot) {
            mod.SetUIWidgetParent(activePopoutPercentShadowDownLeft, activePopoutPercentRoot);
            mod.SetUIWidgetPosition(
                activePopoutPercentShadowDownLeft,
                mod.CreateVector(
                    CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_OFFSET_X - CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET,
                    CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_OFFSET_Y + CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET,
                    0
                )
            );
            mod.SetUIWidgetSize(
                activePopoutPercentShadowDownLeft,
                mod.CreateVector(CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_HEIGHT, 0)
            );
        }
        if (activePopoutPercentShadowInner && activePopoutPercentRoot) {
            mod.SetUIWidgetParent(activePopoutPercentShadowInner, activePopoutPercentRoot);
            mod.SetUIWidgetPosition(
                activePopoutPercentShadowInner,
                mod.CreateVector(CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_OFFSET_X, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_OFFSET_Y, 0)
            );
            mod.SetUIWidgetSize(
                activePopoutPercentShadowInner,
                mod.CreateVector(CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_HEIGHT, 0)
            );
        }
        if (activePopoutPercentText && activePopoutPercentRoot) {
            mod.SetUIWidgetParent(activePopoutPercentText, activePopoutPercentRoot);
            mod.SetUIWidgetPosition(
                activePopoutPercentText,
                mod.CreateVector(CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_OFFSET_X, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_OFFSET_Y, 0)
            );
            mod.SetUIWidgetSize(
                activePopoutPercentText,
                mod.CreateVector(CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_HEIGHT, 0)
            );
        }

        const engageRoot = refsForPid?.conquestFlagsEngageRoot ?? safeFind(`ConquestFlagHudEngageRoot_${pid}`);
        const engageTrack = refsForPid?.conquestFlagsEngageTrack ?? safeFind(`ConquestFlagHudEngageTrack_${pid}`);
        const engageFriendlyFill = refsForPid?.conquestFlagsEngageFriendlyFill ?? safeFind(`ConquestFlagHudEngageFriendlyFill_${pid}`);
        const engageEnemyFill = refsForPid?.conquestFlagsEngageEnemyFill ?? safeFind(`ConquestFlagHudEngageEnemyFill_${pid}`);
        const engageFriendlyCountBg = refsForPid?.conquestFlagsEngageFriendlyCountBg ?? safeFind(`ConquestFlagHudEngageFriendlyCountBg_${pid}`);
        const engageEnemyCountBg = refsForPid?.conquestFlagsEngageEnemyCountBg ?? safeFind(`ConquestFlagHudEngageEnemyCountBg_${pid}`);
        const engageFriendlyCountShadow = refsForPid?.conquestFlagsEngageFriendlyCountShadow ?? safeFind(`ConquestFlagHudEngageFriendlyCountShadow_${pid}`);
        const engageEnemyCountShadow = refsForPid?.conquestFlagsEngageEnemyCountShadow ?? safeFind(`ConquestFlagHudEngageEnemyCountShadow_${pid}`);
        const engageFriendlyCount = refsForPid?.conquestFlagsEngageFriendlyCount ?? safeFind(`ConquestFlagHudEngageFriendlyCount_${pid}`);
        const engageEnemyCount = refsForPid?.conquestFlagsEngageEnemyCount ?? safeFind(`ConquestFlagHudEngageEnemyCount_${pid}`);
        const engageStatusShadowRight = refsForPid?.conquestFlagsEngageStatusShadowRight ?? safeFind(`ConquestFlagHudEngageStatusShadowRight_${pid}`);
        const engageStatusShadowLeft = refsForPid?.conquestFlagsEngageStatusShadowLeft ?? safeFind(`ConquestFlagHudEngageStatusShadowLeft_${pid}`);
        const engageStatusShadowUp = refsForPid?.conquestFlagsEngageStatusShadowUp ?? safeFind(`ConquestFlagHudEngageStatusShadowUp_${pid}`);
        const engageStatusShadowDown = refsForPid?.conquestFlagsEngageStatusShadowDown ?? safeFind(`ConquestFlagHudEngageStatusShadowDown_${pid}`);
        const engageStatusShadowUpLeft = refsForPid?.conquestFlagsEngageStatusShadowUpLeft ?? safeFind(`ConquestFlagHudEngageStatusShadowUpLeft_${pid}`);
        const engageStatusShadowUpRight = refsForPid?.conquestFlagsEngageStatusShadowUpRight ?? safeFind(`ConquestFlagHudEngageStatusShadowUpRight_${pid}`);
        const engageStatusShadowDownRight = refsForPid?.conquestFlagsEngageStatusShadowDownRight ?? safeFind(`ConquestFlagHudEngageStatusShadowDownRight_${pid}`);
        const engageStatusShadowDownLeft = refsForPid?.conquestFlagsEngageStatusShadowDownLeft ?? safeFind(`ConquestFlagHudEngageStatusShadowDownLeft_${pid}`);
        const engageStatus = refsForPid?.conquestFlagsEngageStatus ?? safeFind(`ConquestFlagHudEngageStatus_${pid}`);
        if (engageRoot) {
            try {
                mod.SetUIWidgetAnchor(engageRoot, mod.UIAnchor.TopLeft);
            } catch {
                // Best-effort anchor normalization only.
            }
            mod.SetUIWidgetParent(engageRoot, flagsParent);
            mod.SetUIWidgetPosition(engageRoot, mod.CreateVector(CONQUEST_FLAGS_ENGAGE_ABS_X, CONQUEST_FLAGS_ENGAGE_ABS_Y, 0));
            mod.SetUIWidgetSize(engageRoot, mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_ROOT_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_ROOT_HEIGHT, 0));
        }
        if (engageTrack && engageRoot) {
            mod.SetUIWidgetParent(engageTrack, engageRoot);
            mod.SetUIWidgetPosition(
                engageTrack,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_TRACK_X, CONQUEST_HUD_FLAG_ENGAGE_TRACK_Y, 0)
            );
            mod.SetUIWidgetSize(
                engageTrack,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_TRACK_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_TRACK_HEIGHT, 0)
            );
        }
        if (engageFriendlyFill && engageTrack) {
            mod.SetUIWidgetParent(engageFriendlyFill, engageTrack);
            mod.SetUIWidgetPosition(engageFriendlyFill, mod.CreateVector(0, 0, 0));
            if (resetDynamicFillGeometry) {
                mod.SetUIWidgetSize(
                    engageFriendlyFill,
                    mod.CreateVector(Math.floor(CONQUEST_HUD_FLAG_ENGAGE_TRACK_WIDTH / 2), CONQUEST_HUD_FLAG_ENGAGE_TRACK_HEIGHT, 0)
                );
            }
        }
        if (engageEnemyFill && engageTrack) {
            mod.SetUIWidgetParent(engageEnemyFill, engageTrack);
            if (resetDynamicFillGeometry) {
                const halfTrack = Math.floor(CONQUEST_HUD_FLAG_ENGAGE_TRACK_WIDTH / 2);
                mod.SetUIWidgetPosition(engageEnemyFill, mod.CreateVector(halfTrack, 0, 0));
                mod.SetUIWidgetSize(
                    engageEnemyFill,
                    mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_TRACK_WIDTH - halfTrack, CONQUEST_HUD_FLAG_ENGAGE_TRACK_HEIGHT, 0)
                );
            }
        }
        if (engageFriendlyCountBg && engageRoot) {
            mod.SetUIWidgetParent(engageFriendlyCountBg, engageRoot);
            mod.SetUIWidgetPosition(
                engageFriendlyCountBg,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_FRIENDLY_COUNT_BG_X, CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_Y, 0)
            );
            mod.SetUIWidgetSize(
                engageFriendlyCountBg,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_HEIGHT, 0)
            );
        }
        if (engageEnemyCountBg && engageRoot) {
            mod.SetUIWidgetParent(engageEnemyCountBg, engageRoot);
            mod.SetUIWidgetPosition(
                engageEnemyCountBg,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_ENEMY_COUNT_BG_X, CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_Y, 0)
            );
            mod.SetUIWidgetSize(
                engageEnemyCountBg,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_HEIGHT, 0)
            );
        }
        if (engageFriendlyCount && engageFriendlyCountBg) {
            mod.SetUIWidgetParent(engageFriendlyCount, engageFriendlyCountBg);
            mod.SetUIWidgetPosition(
                engageFriendlyCount,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_COUNT_TEXT_X, CONQUEST_HUD_FLAG_ENGAGE_COUNT_TEXT_Y, 0)
            );
            mod.SetUIWidgetSize(
                engageFriendlyCount,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_HEIGHT, 0)
            );
        }
        if (engageFriendlyCountShadow && engageFriendlyCountBg) {
            mod.SetUIWidgetParent(engageFriendlyCountShadow, engageFriendlyCountBg);
            mod.SetUIWidgetPosition(
                engageFriendlyCountShadow,
                mod.CreateVector(
                    CONQUEST_HUD_FLAG_ENGAGE_COUNT_TEXT_X + CONQUEST_HUD_FLAG_ENGAGE_COUNT_SHADOW_OFFSET,
                    CONQUEST_HUD_FLAG_ENGAGE_COUNT_TEXT_Y + CONQUEST_HUD_FLAG_ENGAGE_COUNT_SHADOW_OFFSET,
                    0
                )
            );
            mod.SetUIWidgetSize(
                engageFriendlyCountShadow,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_HEIGHT, 0)
            );
            if (engageFriendlyCount) {
                mod.SetUIWidgetParent(engageFriendlyCount, engageFriendlyCountBg);
                mod.SetUIWidgetPosition(
                    engageFriendlyCount,
                    mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_COUNT_TEXT_X, CONQUEST_HUD_FLAG_ENGAGE_COUNT_TEXT_Y, 0)
                );
                mod.SetUIWidgetSize(
                    engageFriendlyCount,
                    mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_HEIGHT, 0)
                );
            }
        }
        if (engageEnemyCount && engageEnemyCountBg) {
            mod.SetUIWidgetParent(engageEnemyCount, engageEnemyCountBg);
            mod.SetUIWidgetPosition(
                engageEnemyCount,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_COUNT_TEXT_X, CONQUEST_HUD_FLAG_ENGAGE_COUNT_TEXT_Y, 0)
            );
            mod.SetUIWidgetSize(
                engageEnemyCount,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_HEIGHT, 0)
            );
        }
        if (engageEnemyCountShadow && engageEnemyCountBg) {
            mod.SetUIWidgetParent(engageEnemyCountShadow, engageEnemyCountBg);
            mod.SetUIWidgetPosition(
                engageEnemyCountShadow,
                mod.CreateVector(
                    CONQUEST_HUD_FLAG_ENGAGE_COUNT_TEXT_X + CONQUEST_HUD_FLAG_ENGAGE_COUNT_SHADOW_OFFSET,
                    CONQUEST_HUD_FLAG_ENGAGE_COUNT_TEXT_Y + CONQUEST_HUD_FLAG_ENGAGE_COUNT_SHADOW_OFFSET,
                    0
                )
            );
            mod.SetUIWidgetSize(
                engageEnemyCountShadow,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_HEIGHT, 0)
            );
            if (engageEnemyCount) {
                mod.SetUIWidgetParent(engageEnemyCount, engageEnemyCountBg);
                mod.SetUIWidgetPosition(
                    engageEnemyCount,
                    mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_COUNT_TEXT_X, CONQUEST_HUD_FLAG_ENGAGE_COUNT_TEXT_Y, 0)
                );
                mod.SetUIWidgetSize(
                    engageEnemyCount,
                    mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_HEIGHT, 0)
                );
            }
        }
        if (engageStatusShadowRight && engageRoot) {
            mod.SetUIWidgetParent(engageStatusShadowRight, engageRoot);
            mod.SetUIWidgetPosition(
                engageStatusShadowRight,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_OFFSET, CONQUEST_HUD_FLAG_ENGAGE_STATUS_Y, 0)
            );
            mod.SetUIWidgetSize(
                engageStatusShadowRight,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_STATUS_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_STATUS_HEIGHT, 0)
            );
        }
        if (engageStatusShadowLeft && engageRoot) {
            mod.SetUIWidgetParent(engageStatusShadowLeft, engageRoot);
            mod.SetUIWidgetPosition(
                engageStatusShadowLeft,
                mod.CreateVector(-CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_OFFSET, CONQUEST_HUD_FLAG_ENGAGE_STATUS_Y, 0)
            );
            mod.SetUIWidgetSize(
                engageStatusShadowLeft,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_STATUS_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_STATUS_HEIGHT, 0)
            );
        }
        if (engageStatusShadowUp && engageRoot) {
            mod.SetUIWidgetParent(engageStatusShadowUp, engageRoot);
            mod.SetUIWidgetPosition(
                engageStatusShadowUp,
                mod.CreateVector(0, CONQUEST_HUD_FLAG_ENGAGE_STATUS_Y - CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_OFFSET, 0)
            );
            mod.SetUIWidgetSize(
                engageStatusShadowUp,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_STATUS_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_STATUS_HEIGHT, 0)
            );
        }
        if (engageStatusShadowDown && engageRoot) {
            mod.SetUIWidgetParent(engageStatusShadowDown, engageRoot);
            mod.SetUIWidgetPosition(
                engageStatusShadowDown,
                mod.CreateVector(0, CONQUEST_HUD_FLAG_ENGAGE_STATUS_Y + CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_OFFSET, 0)
            );
            mod.SetUIWidgetSize(
                engageStatusShadowDown,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_STATUS_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_STATUS_HEIGHT, 0)
            );
        }
        if (engageStatusShadowUpLeft && engageRoot) {
            mod.SetUIWidgetParent(engageStatusShadowUpLeft, engageRoot);
            mod.SetUIWidgetPosition(
                engageStatusShadowUpLeft,
                mod.CreateVector(-CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_OFFSET, CONQUEST_HUD_FLAG_ENGAGE_STATUS_Y - CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_OFFSET, 0)
            );
            mod.SetUIWidgetSize(
                engageStatusShadowUpLeft,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_STATUS_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_STATUS_HEIGHT, 0)
            );
        }
        if (engageStatusShadowUpRight && engageRoot) {
            mod.SetUIWidgetParent(engageStatusShadowUpRight, engageRoot);
            mod.SetUIWidgetPosition(
                engageStatusShadowUpRight,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_OFFSET, CONQUEST_HUD_FLAG_ENGAGE_STATUS_Y - CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_OFFSET, 0)
            );
            mod.SetUIWidgetSize(
                engageStatusShadowUpRight,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_STATUS_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_STATUS_HEIGHT, 0)
            );
        }
        if (engageStatusShadowDownRight && engageRoot) {
            mod.SetUIWidgetParent(engageStatusShadowDownRight, engageRoot);
            mod.SetUIWidgetPosition(
                engageStatusShadowDownRight,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_OFFSET, CONQUEST_HUD_FLAG_ENGAGE_STATUS_Y + CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_OFFSET, 0)
            );
            mod.SetUIWidgetSize(
                engageStatusShadowDownRight,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_STATUS_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_STATUS_HEIGHT, 0)
            );
        }
        if (engageStatusShadowDownLeft && engageRoot) {
            mod.SetUIWidgetParent(engageStatusShadowDownLeft, engageRoot);
            mod.SetUIWidgetPosition(
                engageStatusShadowDownLeft,
                mod.CreateVector(-CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_OFFSET, CONQUEST_HUD_FLAG_ENGAGE_STATUS_Y + CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_OFFSET, 0)
            );
            mod.SetUIWidgetSize(
                engageStatusShadowDownLeft,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_STATUS_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_STATUS_HEIGHT, 0)
            );
        }
        if (engageStatus && engageRoot) {
            mod.SetUIWidgetParent(engageStatus, engageRoot);
            mod.SetUIWidgetPosition(engageStatus, mod.CreateVector(0, CONQUEST_HUD_FLAG_ENGAGE_STATUS_Y, 0));
            mod.SetUIWidgetSize(
                engageStatus,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_STATUS_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_STATUS_HEIGHT, 0)
            );
        }
    };

    hideLegacyConquestRoots();
    hideLegacyFlagTripletRows();

    // If no cache entry exists yet (for example after script reload), delete stale top HUD roots.
    // This prevents old child widgets from previous layout iterations from persisting across script reloads.
    const hasCachedHudRefs = Object.prototype.hasOwnProperty.call(State.hudCache.hudByPid, pid);
    let cached: HudRefs | undefined = hasCachedHudRefs ? State.hudCache.hudByPid[pid] : undefined;
    const CONQUEST_HUD_SCHEMA_VERSION = 8;
    const conquestHudSchemaByPid = ((State.conquest.debug as any).hudSchemaVersionByPid ??= {}) as Record<number, number>;
    if (conquestHudSchemaByPid[pid] !== CONQUEST_HUD_SCHEMA_VERSION) {
        // Force one clean rebuild when HUD schema changes to purge stale duplicate widgets.
        delete State.hudCache.hudByPid[pid];
        cached = undefined;
        conquestHudSchemaByPid[pid] = CONQUEST_HUD_SCHEMA_VERSION;
    }
    if (!cached) {
        // Root widgets may exist in duplicate instances after hot reload/swap churn.
        // Always delete all instances by name before rebuilding to avoid stacked ticket texts.
        deleteAllHudWidgetsByName(`Container_TopLeft_CoreUI_${pid}`);
        deleteAllHudWidgetsByName(`Container_TopMiddle_CoreUI_${pid}`);
        deleteAllHudWidgetsByName(`Container_TopRight_CoreUI_${pid}`);
        destroyConquestHudForPid(pid);
    }

    // If cached, reuse that HUD instance to avoid duplicate ParseUI trees with the same widget names.
    if (cached) {
        // Recover missing root refs from existing widgets if needed.
        cached.conquestTicketsDebugRoot = cached.conquestTicketsDebugRoot ?? safeFind(`ConquestTicketsHudRoot_${pid}`);
        cached.conquestFlagsDebugRoot = cached.conquestFlagsDebugRoot ?? safeFind(`ConquestFlagsHudRoot_${pid}`);
        // If both roots are truly gone, clear cache so we can rebuild once.
        if (!cached.conquestTicketsDebugRoot && !cached.conquestFlagsDebugRoot) {
            delete State.hudCache.hudByPid[pid];
            return ensureHudForPlayer(player);
        }

        hideLegacyConquestRoots();
        hideLegacyFlagTripletRows();
        ensureTopHudRootForPid(pid, player);
        ensureConquestBleedChevronWidgets();
        const helpContainer = safeFind(`Container_HelpText_${pid}`);
        if (helpContainer) {
            mod.SetUIWidgetPosition(helpContainer, mod.CreateVector(CONQUEST_HELP_CONTAINER_X, CONQUEST_HELP_CONTAINER_Y, 0));
            mod.SetUIWidgetSize(helpContainer, mod.CreateVector(CONQUEST_HELP_CONTAINER_WIDTH, CONQUEST_HELP_CONTAINER_HEIGHT, 0));
        }
        const helpText = safeFind(`HelpText_${pid}`);
        if (helpText) {
            mod.SetUIWidgetPosition(helpText, mod.CreateVector(0, CONQUEST_HELP_TEXT_OFFSET_Y, 0));
            mod.SetUIWidgetSize(helpText, mod.CreateVector(CONQUEST_HELP_CONTAINER_WIDTH, CONQUEST_HELP_TEXT_HEIGHT, 0));
        }
        const readyContainer = safeFind(`Container_ReadyStatus_${pid}`);
        if (readyContainer) {
            const topHudRoot = mod.GetUIRoot();
            try {
                mod.SetUIWidgetAnchor(readyContainer, mod.UIAnchor.TopLeft);
            } catch {
                // Best-effort anchor normalization only.
            }
            mod.SetUIWidgetParent(readyContainer, topHudRoot);
            mod.SetUIWidgetPosition(readyContainer, mod.CreateVector(CONQUEST_READY_ABS_X, CONQUEST_READY_ABS_Y, 0));
            mod.SetUIWidgetSize(readyContainer, mod.CreateVector(CONQUEST_READY_CONTAINER_WIDTH, CONQUEST_READY_CONTAINER_HEIGHT, 0));
        }
        const readyText = safeFind(`ReadyStatusText_${pid}`);
        if (readyText && readyContainer) {
            mod.SetUIWidgetParent(readyText, readyContainer);
            mod.SetUIWidgetPosition(readyText, mod.CreateVector(0, CONQUEST_READY_TEXT_OFFSET_Y, 0));
            mod.SetUIWidgetSize(readyText, mod.CreateVector(CONQUEST_READY_CONTAINER_WIDTH, CONQUEST_READY_TEXT_HEIGHT, 0));
        }
        const adminActionCounter = safeFind(`AdminPanelActionCount_${pid}`);
        if (adminActionCounter) {
            mod.SetUIWidgetPosition(adminActionCounter, mod.CreateVector(20, 22, 0));
        }
        // Cached HUD path: avoid legacy root-local layout writes.
        // Mixed frame writes (root-local then absolute) can cause one-frame flicker.
        const conquestTicketsRoot = cached.conquestTicketsDebugRoot ?? safeFind(`ConquestTicketsHudRoot_${pid}`);
        if (conquestTicketsRoot) {
            mod.SetUIWidgetDepth(conquestTicketsRoot, mod.UIDepth.AboveGameUI);
        }
        const conquestFlagsRoot = cached.conquestFlagsDebugRoot ?? safeFind(`ConquestFlagsHudRoot_${pid}`);
        if (conquestFlagsRoot) {
            mod.SetUIWidgetDepth(conquestFlagsRoot, mod.UIDepth.AboveGameUI);
        }
        setHudHelpDepthForPid(pid);
        updateSettingsSummaryHudForPid(pid);
        // Keep cached refs stable once established.
        // Re-binding from global name lookups each tick can target stale duplicates and cause color/overlay drift.
        cached.conquestTicketsTeam1Container = cached.conquestTicketsTeam1Container ?? safeFind(`ConquestTicketsHudTeam1Container_${pid}`);
        cached.conquestTicketsTeam2Container = cached.conquestTicketsTeam2Container ?? safeFind(`ConquestTicketsHudTeam2Container_${pid}`);
        cached.conquestTicketsDebugTeam1Shadow = cached.conquestTicketsDebugTeam1Shadow ?? safeFind(`ConquestTicketsHudTeam1Shadow_${pid}`);
        cached.conquestTicketsDebugTeam2Shadow = cached.conquestTicketsDebugTeam2Shadow ?? safeFind(`ConquestTicketsHudTeam2Shadow_${pid}`);
        cached.conquestTicketsDebugLeftBarTrack = cached.conquestTicketsDebugLeftBarTrack ?? safeFind(`ConquestTicketsHudLeftBarTrack_${pid}`);
        cached.conquestTicketsDebugLeftBarFill = cached.conquestTicketsDebugLeftBarFill ?? safeFind(`ConquestTicketsHudLeftBarFill_${pid}`);
        cached.conquestTicketsDebugRightBarTrack = cached.conquestTicketsDebugRightBarTrack ?? safeFind(`ConquestTicketsHudRightBarTrack_${pid}`);
        cached.conquestTicketsDebugRightBarFill = cached.conquestTicketsDebugRightBarFill ?? safeFind(`ConquestTicketsHudRightBarFill_${pid}`);
        cached.conquestTicketsSlash = cached.conquestTicketsSlash ?? safeFind(`ConquestTicketsHudSlash_${pid}`);
        cached.conquestTicketsLeadLeftBorder = cached.conquestTicketsLeadLeftBorder ?? safeFind(`ConquestTicketsHudLeadBorderLeft_${pid}`);
        cached.conquestTicketsLeadRightBorder = cached.conquestTicketsLeadRightBorder ?? safeFind(`ConquestTicketsHudLeadBorderRight_${pid}`);
        cached.conquestTicketsLeadLeftCrownShadow = cached.conquestTicketsLeadLeftCrownShadow ?? safeFind(`ConquestTicketsHudLeadCrownLeftShadow_${pid}`);
        cached.conquestTicketsLeadRightCrownShadow = cached.conquestTicketsLeadRightCrownShadow ?? safeFind(`ConquestTicketsHudLeadCrownRightShadow_${pid}`);
        cached.conquestTicketsLeadLeftCrown = cached.conquestTicketsLeadLeftCrown ?? safeFind(`ConquestTicketsHudLeadCrownLeft_${pid}`);
        cached.conquestTicketsLeadRightCrown = cached.conquestTicketsLeadRightCrown ?? safeFind(`ConquestTicketsHudLeadCrownRight_${pid}`);
        if (!cached.conquestTicketsBleedLeftChevrons) cached.conquestTicketsBleedLeftChevrons = [];
        if (!cached.conquestTicketsBleedRightChevrons) cached.conquestTicketsBleedRightChevrons = [];
        for (let chevronIndex = 0; chevronIndex < CONQUEST_HUD_TICKET_BLEED_CHEVRON_COUNT; chevronIndex++) {
            cached.conquestTicketsBleedLeftChevrons[chevronIndex] = cached.conquestTicketsBleedLeftChevrons[chevronIndex]
                ?? safeFind(`ConquestTicketsHudBleedChevronLeft${chevronIndex + 1}_${pid}`);
            cached.conquestTicketsBleedRightChevrons[chevronIndex] = cached.conquestTicketsBleedRightChevrons[chevronIndex]
                ?? safeFind(`ConquestTicketsHudBleedChevronRight${chevronIndex + 1}_${pid}`);
        }
        cached.conquestFlagsActivePopoutRoot = cached.conquestFlagsActivePopoutRoot ?? safeFind(`ConquestFlagHudActivePopoutRoot_${pid}`);
        cached.conquestFlagsActivePopoutSlot = cached.conquestFlagsActivePopoutSlot ?? safeFind(`ConquestFlagHudActivePopoutSlot_${pid}`);
        cached.conquestFlagsActivePopoutBorder = cached.conquestFlagsActivePopoutBorder ?? safeFind(`ConquestFlagHudActivePopoutBorder_${pid}`);
        cached.conquestFlagsActivePopoutFill = cached.conquestFlagsActivePopoutFill ?? safeFind(`ConquestFlagHudActivePopoutFill_${pid}`);
        cached.conquestFlagsActivePopoutLabelShadowRight = cached.conquestFlagsActivePopoutLabelShadowRight ?? safeFind(`ConquestFlagHudActivePopoutLabelShadowRight_${pid}`);
        cached.conquestFlagsActivePopoutLabelShadowLeft = cached.conquestFlagsActivePopoutLabelShadowLeft ?? safeFind(`ConquestFlagHudActivePopoutLabelShadowLeft_${pid}`);
        cached.conquestFlagsActivePopoutLabelShadowUp = cached.conquestFlagsActivePopoutLabelShadowUp ?? safeFind(`ConquestFlagHudActivePopoutLabelShadowUp_${pid}`);
        cached.conquestFlagsActivePopoutLabelShadowDown = cached.conquestFlagsActivePopoutLabelShadowDown ?? safeFind(`ConquestFlagHudActivePopoutLabelShadowDown_${pid}`);
        cached.conquestFlagsActivePopoutLabelShadowUpLeft = cached.conquestFlagsActivePopoutLabelShadowUpLeft ?? safeFind(`ConquestFlagHudActivePopoutLabelShadowUpLeft_${pid}`);
        cached.conquestFlagsActivePopoutLabelShadowUpRight = cached.conquestFlagsActivePopoutLabelShadowUpRight ?? safeFind(`ConquestFlagHudActivePopoutLabelShadowUpRight_${pid}`);
        cached.conquestFlagsActivePopoutLabelShadowDownRight = cached.conquestFlagsActivePopoutLabelShadowDownRight ?? safeFind(`ConquestFlagHudActivePopoutLabelShadowDownRight_${pid}`);
        cached.conquestFlagsActivePopoutLabelShadowDownLeft = cached.conquestFlagsActivePopoutLabelShadowDownLeft ?? safeFind(`ConquestFlagHudActivePopoutLabelShadowDownLeft_${pid}`);
        cached.conquestFlagsActivePopoutLabel = cached.conquestFlagsActivePopoutLabel ?? safeFind(`ConquestFlagHudActivePopoutLabel_${pid}`);
        cached.conquestFlagsActivePopoutPercentRoot = cached.conquestFlagsActivePopoutPercentRoot ?? safeFind(`ConquestFlagHudActivePopoutPercentRoot_${pid}`);
        cached.conquestFlagsActivePopoutPercentShadowRight = cached.conquestFlagsActivePopoutPercentShadowRight ?? safeFind(`ConquestFlagHudActivePopoutPercentShadowRight_${pid}`);
        cached.conquestFlagsActivePopoutPercentShadowLeft = cached.conquestFlagsActivePopoutPercentShadowLeft ?? safeFind(`ConquestFlagHudActivePopoutPercentShadowLeft_${pid}`);
        cached.conquestFlagsActivePopoutPercentShadowUp = cached.conquestFlagsActivePopoutPercentShadowUp ?? safeFind(`ConquestFlagHudActivePopoutPercentShadowUp_${pid}`);
        cached.conquestFlagsActivePopoutPercentShadowDown = cached.conquestFlagsActivePopoutPercentShadowDown ?? safeFind(`ConquestFlagHudActivePopoutPercentShadowDown_${pid}`);
        cached.conquestFlagsActivePopoutPercentShadowUpLeft = cached.conquestFlagsActivePopoutPercentShadowUpLeft ?? safeFind(`ConquestFlagHudActivePopoutPercentShadowUpLeft_${pid}`);
        cached.conquestFlagsActivePopoutPercentShadowUpRight = cached.conquestFlagsActivePopoutPercentShadowUpRight ?? safeFind(`ConquestFlagHudActivePopoutPercentShadowUpRight_${pid}`);
        cached.conquestFlagsActivePopoutPercentShadowDownRight = cached.conquestFlagsActivePopoutPercentShadowDownRight ?? safeFind(`ConquestFlagHudActivePopoutPercentShadowDownRight_${pid}`);
        cached.conquestFlagsActivePopoutPercentShadowDownLeft = cached.conquestFlagsActivePopoutPercentShadowDownLeft ?? safeFind(`ConquestFlagHudActivePopoutPercentShadowDownLeft_${pid}`);
        cached.conquestFlagsActivePopoutPercentShadowInner = cached.conquestFlagsActivePopoutPercentShadowInner ?? safeFind(`ConquestFlagHudActivePopoutPercentShadowInner_${pid}`);
        cached.conquestFlagsActivePopoutPercentText = cached.conquestFlagsActivePopoutPercentText ?? safeFind(`ConquestFlagHudActivePopoutPercentText_${pid}`);
        cached.conquestFlagsEngageRoot = cached.conquestFlagsEngageRoot ?? safeFind(`ConquestFlagHudEngageRoot_${pid}`);
        cached.conquestFlagsEngageTrack = cached.conquestFlagsEngageTrack ?? safeFind(`ConquestFlagHudEngageTrack_${pid}`);
        cached.conquestFlagsEngageFriendlyFill = cached.conquestFlagsEngageFriendlyFill ?? safeFind(`ConquestFlagHudEngageFriendlyFill_${pid}`);
        cached.conquestFlagsEngageEnemyFill = cached.conquestFlagsEngageEnemyFill ?? safeFind(`ConquestFlagHudEngageEnemyFill_${pid}`);
        cached.conquestFlagsEngageFriendlyCountBg = cached.conquestFlagsEngageFriendlyCountBg ?? safeFind(`ConquestFlagHudEngageFriendlyCountBg_${pid}`);
        cached.conquestFlagsEngageEnemyCountBg = cached.conquestFlagsEngageEnemyCountBg ?? safeFind(`ConquestFlagHudEngageEnemyCountBg_${pid}`);
        cached.conquestFlagsEngageFriendlyCountShadow = cached.conquestFlagsEngageFriendlyCountShadow ?? safeFind(`ConquestFlagHudEngageFriendlyCountShadow_${pid}`);
        cached.conquestFlagsEngageEnemyCountShadow = cached.conquestFlagsEngageEnemyCountShadow ?? safeFind(`ConquestFlagHudEngageEnemyCountShadow_${pid}`);
        cached.conquestFlagsEngageFriendlyCount = cached.conquestFlagsEngageFriendlyCount ?? safeFind(`ConquestFlagHudEngageFriendlyCount_${pid}`);
        cached.conquestFlagsEngageEnemyCount = cached.conquestFlagsEngageEnemyCount ?? safeFind(`ConquestFlagHudEngageEnemyCount_${pid}`);
        cached.conquestFlagsEngageStatusShadowRight = cached.conquestFlagsEngageStatusShadowRight ?? safeFind(`ConquestFlagHudEngageStatusShadowRight_${pid}`);
        cached.conquestFlagsEngageStatusShadowLeft = cached.conquestFlagsEngageStatusShadowLeft ?? safeFind(`ConquestFlagHudEngageStatusShadowLeft_${pid}`);
        cached.conquestFlagsEngageStatusShadowUp = cached.conquestFlagsEngageStatusShadowUp ?? safeFind(`ConquestFlagHudEngageStatusShadowUp_${pid}`);
        cached.conquestFlagsEngageStatusShadowDown = cached.conquestFlagsEngageStatusShadowDown ?? safeFind(`ConquestFlagHudEngageStatusShadowDown_${pid}`);
        cached.conquestFlagsEngageStatusShadowUpLeft = cached.conquestFlagsEngageStatusShadowUpLeft ?? safeFind(`ConquestFlagHudEngageStatusShadowUpLeft_${pid}`);
        cached.conquestFlagsEngageStatusShadowUpRight = cached.conquestFlagsEngageStatusShadowUpRight ?? safeFind(`ConquestFlagHudEngageStatusShadowUpRight_${pid}`);
        cached.conquestFlagsEngageStatusShadowDownRight = cached.conquestFlagsEngageStatusShadowDownRight ?? safeFind(`ConquestFlagHudEngageStatusShadowDownRight_${pid}`);
        cached.conquestFlagsEngageStatusShadowDownLeft = cached.conquestFlagsEngageStatusShadowDownLeft ?? safeFind(`ConquestFlagHudEngageStatusShadowDownLeft_${pid}`);
        cached.conquestFlagsEngageStatus = cached.conquestFlagsEngageStatus ?? safeFind(`ConquestFlagHudEngageStatus_${pid}`);
        if (!cached.conquestFlagsDebugSlotRoots) cached.conquestFlagsDebugSlotRoots = [];
        if (!cached.conquestFlagsDebugBorderRows) cached.conquestFlagsDebugBorderRows = [];
        if (!cached.conquestFlagsDebugFillRows) cached.conquestFlagsDebugFillRows = [];
        if (!cached.conquestFlagsDebugLabelShadowRightRows) cached.conquestFlagsDebugLabelShadowRightRows = [];
        if (!cached.conquestFlagsDebugLabelShadowLeftRows) cached.conquestFlagsDebugLabelShadowLeftRows = [];
        if (!cached.conquestFlagsDebugLabelShadowUpRows) cached.conquestFlagsDebugLabelShadowUpRows = [];
        if (!cached.conquestFlagsDebugLabelShadowDownRows) cached.conquestFlagsDebugLabelShadowDownRows = [];
        if (!cached.conquestFlagsDebugLabelShadowUpLeftRows) cached.conquestFlagsDebugLabelShadowUpLeftRows = [];
        if (!cached.conquestFlagsDebugLabelShadowUpRightRows) cached.conquestFlagsDebugLabelShadowUpRightRows = [];
        if (!cached.conquestFlagsDebugLabelShadowDownRightRows) cached.conquestFlagsDebugLabelShadowDownRightRows = [];
        if (!cached.conquestFlagsDebugLabelShadowDownLeftRows) cached.conquestFlagsDebugLabelShadowDownLeftRows = [];
        if (!cached.conquestFlagsDebugLabelShadowInnerRows) cached.conquestFlagsDebugLabelShadowInnerRows = [];
        if (!cached.conquestFlagsDebugLabelShadowInnerDeepRows) cached.conquestFlagsDebugLabelShadowInnerDeepRows = [];
        if (!cached.conquestFlagsDebugLabelRows) cached.conquestFlagsDebugLabelRows = [];
        if (!cached.conquestFlagsDebugPercentRoots) cached.conquestFlagsDebugPercentRoots = [];
        if (!cached.conquestFlagsDebugPercentShadowRightRows) cached.conquestFlagsDebugPercentShadowRightRows = [];
        if (!cached.conquestFlagsDebugPercentShadowLeftRows) cached.conquestFlagsDebugPercentShadowLeftRows = [];
        if (!cached.conquestFlagsDebugPercentShadowUpRows) cached.conquestFlagsDebugPercentShadowUpRows = [];
        if (!cached.conquestFlagsDebugPercentShadowDownRows) cached.conquestFlagsDebugPercentShadowDownRows = [];
        if (!cached.conquestFlagsDebugPercentShadowUpLeftRows) cached.conquestFlagsDebugPercentShadowUpLeftRows = [];
        if (!cached.conquestFlagsDebugPercentShadowUpRightRows) cached.conquestFlagsDebugPercentShadowUpRightRows = [];
        if (!cached.conquestFlagsDebugPercentShadowDownRightRows) cached.conquestFlagsDebugPercentShadowDownRightRows = [];
        if (!cached.conquestFlagsDebugPercentShadowDownLeftRows) cached.conquestFlagsDebugPercentShadowDownLeftRows = [];
        if (!cached.conquestFlagsDebugPercentShadowInnerRows) cached.conquestFlagsDebugPercentShadowInnerRows = [];
        if (!cached.conquestFlagsDebugPercentTextRows) cached.conquestFlagsDebugPercentTextRows = [];
        for (let i = 0; i < CONQUEST_FLAGS_MAX_ROWS; i++) {
            cached.conquestFlagsDebugSlotRoots[i] = cached.conquestFlagsDebugSlotRoots[i] ?? safeFind(`ConquestFlagHudSlot_${pid}_${i}`);
            cached.conquestFlagsDebugBorderRows[i] = cached.conquestFlagsDebugBorderRows[i] ?? safeFind(`ConquestFlagHudBorder_${pid}_${i}`);
            cached.conquestFlagsDebugFillRows[i] = cached.conquestFlagsDebugFillRows[i] ?? safeFind(`ConquestFlagHudFill_${pid}_${i}`);
            cached.conquestFlagsDebugLabelShadowRightRows[i] = cached.conquestFlagsDebugLabelShadowRightRows[i] ?? safeFind(`ConquestFlagHudLabelShadowRight_${pid}_${i}`);
            cached.conquestFlagsDebugLabelShadowLeftRows[i] = cached.conquestFlagsDebugLabelShadowLeftRows[i] ?? safeFind(`ConquestFlagHudLabelShadowLeft_${pid}_${i}`);
            cached.conquestFlagsDebugLabelShadowUpRows[i] = cached.conquestFlagsDebugLabelShadowUpRows[i] ?? safeFind(`ConquestFlagHudLabelShadowUp_${pid}_${i}`);
            cached.conquestFlagsDebugLabelShadowDownRows[i] = cached.conquestFlagsDebugLabelShadowDownRows[i] ?? safeFind(`ConquestFlagHudLabelShadowDown_${pid}_${i}`);
            cached.conquestFlagsDebugLabelShadowUpLeftRows[i] = cached.conquestFlagsDebugLabelShadowUpLeftRows[i] ?? safeFind(`ConquestFlagHudLabelShadowUpLeft_${pid}_${i}`);
            cached.conquestFlagsDebugLabelShadowUpRightRows[i] = cached.conquestFlagsDebugLabelShadowUpRightRows[i] ?? safeFind(`ConquestFlagHudLabelShadowUpRight_${pid}_${i}`);
            cached.conquestFlagsDebugLabelShadowDownRightRows[i] = cached.conquestFlagsDebugLabelShadowDownRightRows[i] ?? safeFind(`ConquestFlagHudLabelShadowDownRight_${pid}_${i}`);
            cached.conquestFlagsDebugLabelShadowDownLeftRows[i] = cached.conquestFlagsDebugLabelShadowDownLeftRows[i] ?? safeFind(`ConquestFlagHudLabelShadowDownLeft_${pid}_${i}`);
            cached.conquestFlagsDebugLabelShadowInnerRows[i] = cached.conquestFlagsDebugLabelShadowInnerRows[i] ?? safeFind(`ConquestFlagHudLabelShadowInner_${pid}_${i}`);
            cached.conquestFlagsDebugLabelShadowInnerDeepRows[i] = cached.conquestFlagsDebugLabelShadowInnerDeepRows[i] ?? safeFind(`ConquestFlagHudLabelShadowInnerDeep_${pid}_${i}`);
            cached.conquestFlagsDebugLabelRows[i] = cached.conquestFlagsDebugLabelRows[i] ?? safeFind(`ConquestFlagHudLabel_${pid}_${i}`);
            cached.conquestFlagsDebugPercentRoots[i] = cached.conquestFlagsDebugPercentRoots[i] ?? safeFind(`ConquestFlagHudPercentRoot_${pid}_${i}`);
            cached.conquestFlagsDebugPercentShadowRightRows[i] = cached.conquestFlagsDebugPercentShadowRightRows[i] ?? safeFind(`ConquestFlagHudPercentShadowRight_${pid}_${i}`);
            cached.conquestFlagsDebugPercentShadowLeftRows[i] = cached.conquestFlagsDebugPercentShadowLeftRows[i] ?? safeFind(`ConquestFlagHudPercentShadowLeft_${pid}_${i}`);
            cached.conquestFlagsDebugPercentShadowUpRows[i] = cached.conquestFlagsDebugPercentShadowUpRows[i] ?? safeFind(`ConquestFlagHudPercentShadowUp_${pid}_${i}`);
            cached.conquestFlagsDebugPercentShadowDownRows[i] = cached.conquestFlagsDebugPercentShadowDownRows[i] ?? safeFind(`ConquestFlagHudPercentShadowDown_${pid}_${i}`);
            cached.conquestFlagsDebugPercentShadowUpLeftRows[i] = cached.conquestFlagsDebugPercentShadowUpLeftRows[i] ?? safeFind(`ConquestFlagHudPercentShadowUpLeft_${pid}_${i}`);
            cached.conquestFlagsDebugPercentShadowUpRightRows[i] = cached.conquestFlagsDebugPercentShadowUpRightRows[i] ?? safeFind(`ConquestFlagHudPercentShadowUpRight_${pid}_${i}`);
            cached.conquestFlagsDebugPercentShadowDownRightRows[i] = cached.conquestFlagsDebugPercentShadowDownRightRows[i] ?? safeFind(`ConquestFlagHudPercentShadowDownRight_${pid}_${i}`);
            cached.conquestFlagsDebugPercentShadowDownLeftRows[i] = cached.conquestFlagsDebugPercentShadowDownLeftRows[i] ?? safeFind(`ConquestFlagHudPercentShadowDownLeft_${pid}_${i}`);
            cached.conquestFlagsDebugPercentShadowInnerRows[i] = cached.conquestFlagsDebugPercentShadowInnerRows[i] ?? safeFind(`ConquestFlagHudPercentShadowInner_${pid}_${i}`);
            cached.conquestFlagsDebugPercentTextRows[i] = cached.conquestFlagsDebugPercentTextRows[i] ?? safeFind(`ConquestFlagHudPercentText_${pid}_${i}`);
        }
        applyConquestAbsoluteLayout(cached, false);

        return cached;
    }

    const refs: HudRefs = { pid, roots: [] };

    //#endregion -------------------- HUD Build/Ensure Function Start --------------------



    //#region -------------------- HUD Build/Ensure - Upper-Left HUD --------------------

    // --- Static HUD: Upper-left small box ---
    {
        const rootName = `Upper_Left_Container_${pid}`;
        const upperLeft = modlib.ParseUI({
            name: rootName,
            type: "Container",
            playerId: player,
            // position: [x, y] offset; direction depends on anchor, so verify visually in-game
            position: [5, 5 + TOP_HUD_OFFSET_Y],
            size: [200, 30],
            anchor: mod.UIAnchor.TopLeft,
            visible: true,
            padding: 1,
            bgColor: [0.251, 0.0941, 0.0667],
            bgAlpha: 0.5625,
            bgFill: mod.UIBgFill.Blur,
            children: [
                {
                    // UI element: Upper_Left_Text_${pid}
                    name: `Upper_Left_Text_${pid}`,
                    type: "Text",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [5, -5.5],
                    size: [200, 17],
                    anchor: mod.UIAnchor.CenterLeft,
                    visible: true,
                    padding: 0,
                    bgColor: [0.8353, 0.9216, 0.9765],
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.Blur,
                    textLabel: mod.stringkeys.twl.hud.branding.title,
                    textColor: [0.6784, 0.9922, 0.5255],
                    textAlpha: 1,
                    textSize: 9,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    // UI element: Upper_Left_Text_2_${pid}
                    name: `Upper_Left_Text_2_${pid}`,
                    type: "Text",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [7.25, 12.5],
                    size: [200, 16.5],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgColor: [0.2, 0.2, 0.2],
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.stringkeys.twl.hud.branding.subtitle,
                    textColor: [0.6784, 0.9922, 0.5255],
                    textAlpha: 1,
                    textSize: 9,
                    textAnchor: mod.UIAnchor.Center,
                },
            ],
        });
        if (upperLeft) refs.roots.push(upperLeft);
    }

    // --- Static HUD: Upper-left settings summary (below branding) ---
    {
        const SETTINGS_CONTAINER_X = 5;
        const SETTINGS_CONTAINER_Y = 5 + TOP_HUD_OFFSET_Y + 30 + 6;
        const SETTINGS_LINE_HEIGHT = 12;
        const SETTINGS_TEXT_WIDTH = 200;
        const SETTINGS_TEXT_SIZE = 9;
        const SETTINGS_TEXT_COLOR: [number, number, number] = [0.6784, 0.9922, 0.5255];

        const settingsSummary = modlib.ParseUI({
            name: `Upper_Left_Settings_${pid}`,
            type: "Container",
            playerId: player,
            position: [SETTINGS_CONTAINER_X, SETTINGS_CONTAINER_Y],
            size: [SETTINGS_TEXT_WIDTH, SETTINGS_LINE_HEIGHT * 6],
            anchor: mod.UIAnchor.TopLeft,
            visible: true,
            padding: 1,
            bgColor: [0.251, 0.0941, 0.0667],
            bgAlpha: 0.5625,
            bgFill: mod.UIBgFill.Blur,
            children: [
                {
                    name: `Settings_GameMode_${pid}`,
                    type: "Text",
                    position: [6, 0],
                    size: [SETTINGS_TEXT_WIDTH - 12, 16],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(STR_HUD_SETTINGS_GAME_MODE_FORMAT, STR_HUD_SETTINGS_GAME_MODE_DEFAULT),
                    textColor: SETTINGS_TEXT_COLOR,
                    textAlpha: 1,
                    textSize: SETTINGS_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.TopLeft,
                },
                {
                    name: `Settings_Ceiling_${pid}`,
                    type: "Text",
                    position: [6, SETTINGS_LINE_HEIGHT],
                    size: [SETTINGS_TEXT_WIDTH - 12, 16],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(STR_HUD_SETTINGS_AIRCRAFT_CEILING_FORMAT, STR_READY_DIALOG_AIRCRAFT_CEILING_VANILLA),
                    textColor: SETTINGS_TEXT_COLOR,
                    textAlpha: 1,
                    textSize: SETTINGS_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.TopLeft,
                },
                {
                    name: `Settings_VehiclesT1_${pid}`,
                    type: "Text",
                    position: [6, SETTINGS_LINE_HEIGHT * 2],
                    size: [SETTINGS_TEXT_WIDTH - 12, 16],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(
                        STR_HUD_SETTINGS_VEHICLES_TEAM_FORMAT,
                        getTeamNameKey(TeamID.Team1),
                        STR_HUD_SETTINGS_VALUE_DEFAULT
                    ),
                    textColor: SETTINGS_TEXT_COLOR,
                    textAlpha: 1,
                    textSize: SETTINGS_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.TopLeft,
                },
                {
                    name: `Settings_VehiclesT2_${pid}`,
                    type: "Text",
                    position: [6, SETTINGS_LINE_HEIGHT * 3],
                    size: [SETTINGS_TEXT_WIDTH - 12, 16],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(
                        STR_HUD_SETTINGS_VEHICLES_TEAM_FORMAT,
                        getTeamNameKey(TeamID.Team2),
                        STR_HUD_SETTINGS_VALUE_DEFAULT
                    ),
                    textColor: SETTINGS_TEXT_COLOR,
                    textAlpha: 1,
                    textSize: SETTINGS_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.TopLeft,
                },
                {
                    name: `Settings_VehiclesMatchup_${pid}`,
                    type: "Text",
                    position: [6, SETTINGS_LINE_HEIGHT * 4],
                    size: [SETTINGS_TEXT_WIDTH - 12, 16],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(STR_HUD_SETTINGS_VEHICLES_MATCHUP_FORMAT, 1, 1),
                    textColor: SETTINGS_TEXT_COLOR,
                    textAlpha: 1,
                    textSize: SETTINGS_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.TopLeft,
                },
                {
                    name: `Settings_Players_${pid}`,
                    type: "Text",
                    position: [6, SETTINGS_LINE_HEIGHT * 5],
                    size: [SETTINGS_TEXT_WIDTH - 12, 16],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(STR_HUD_SETTINGS_PLAYERS_FORMAT, 1, 1),
                    textColor: SETTINGS_TEXT_COLOR,
                    textAlpha: 1,
                    textSize: SETTINGS_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.TopLeft,
                },
            ],
        });
        if (settingsSummary) refs.roots.push(settingsSummary);
    }

    //#endregion ----------------- HUD Build/Ensure - Upper-Left HUD --------------------



    //#region -------------------- HUD Build/Ensure - Top-Center Panels --------------------

    // --- Static HUD: Top-center panels (TeamLeft / Middle / TeamRight) ---
    {
        const TOP_PANEL_Y = 47.73;
        const PANEL_WIDTH = 99.01;
        const PANEL_HEIGHT = 28.11;
        const MID_PANEL_X = 910;
        const LEFT_PANEL_X = 783.86;
        const RIGHT_PANEL_X = 1021.64;
        const PANEL_GAP = MID_PANEL_X - LEFT_PANEL_X - PANEL_WIDTH;
        const ROUND_KILLS_PANEL_SIZE = PANEL_HEIGHT;
        const ROUND_KILLS_LEFT_X = LEFT_PANEL_X - ROUND_KILLS_PANEL_SIZE - PANEL_GAP;
        const ROUND_KILLS_RIGHT_X = RIGHT_PANEL_X + PANEL_WIDTH + PANEL_GAP;
        const TRENDING_CROWN_SIZE = 18;
        const TRENDING_CROWN_OFFSET_Y = 4;
        const TRENDING_CROWN_LEFT_X = PANEL_WIDTH - TRENDING_CROWN_SIZE - 10;
        const TRENDING_CROWN_RIGHT_X = 10;
        const mid = modlib.ParseUI({
            // UI element: Container_TopMiddle_CoreUI_${pid}
            name: `Container_TopMiddle_CoreUI_${pid}`,
            type: "Container",
            playerId: player,
            // position: [x, y] offset; direction depends on anchor, so verify visually in-game
            position: [MID_PANEL_X, TOP_PANEL_Y],
            size: [PANEL_WIDTH, PANEL_HEIGHT],
            anchor: mod.UIAnchor.TopLeft,
            visible: true,
            padding: 0,
            bgColor: [0.0314, 0.0431, 0.0431],
            bgAlpha: 0.75,
            bgFill: mod.UIBgFill.Blur,
            children: [
                {
                    // Help/instructions text shown when enabled for this player
                    name: `Container_HelpText_${pid}`,
                    type: "Container",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [CONQUEST_HELP_CONTAINER_X, CONQUEST_HELP_CONTAINER_Y],
                    size: [CONQUEST_HELP_CONTAINER_WIDTH, CONQUEST_HELP_CONTAINER_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgColor: [1, 0.9882, 0.6118],
                    bgAlpha: 1,
                    bgFill: mod.UIBgFill.Solid,
                    children: [
                        {
                            // Help/instructions text shown when enabled for this player
                            name: `HelpText_${pid}`,
                            type: "Text",
                            // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                            position: [0, CONQUEST_HELP_TEXT_OFFSET_Y],
                            size: [CONQUEST_HELP_CONTAINER_WIDTH, CONQUEST_HELP_TEXT_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: true,
                            padding: 0,
                            bgColor: [0.2, 0.2, 0.2],
                            bgAlpha: 1,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.stringkeys.twl.hud.helpText,
                            textColor: [0.251, 0.0941, 0.0667],
                            textAlpha: 1,
                            textSize: 12,
                            textAnchor: mod.UIAnchor.Center,
                        },
                    ],
                },
                {
                    // Ready status text shown when the player is READY and the match is not live.
                    name: `Container_ReadyStatus_${pid}`,
                    type: "Container",
                    // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                    position: [CONQUEST_READY_CONTAINER_X, CONQUEST_READY_CONTAINER_Y],
                    size: [CONQUEST_READY_CONTAINER_WIDTH, CONQUEST_READY_CONTAINER_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: false,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    children: [
                        {
                            // Ready status text shown when enabled for this player
                            name: `ReadyStatusText_${pid}`,
                            type: "Text",
                            // position: [x, y] offset; direction depends on anchor, so verify visually in-game
                            position: [0, CONQUEST_READY_TEXT_OFFSET_Y],
                            size: [CONQUEST_READY_CONTAINER_WIDTH, CONQUEST_READY_TEXT_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: true,
                            padding: 0,
                            bgAlpha: 0,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.stringkeys.twl.hud.readyText,
                            textColor: [0.6784, 0.9922, 0.5255],
                            textAlpha: 1,
                            textSize: 12,
                            textAnchor: mod.UIAnchor.Center,
                        },
                    ],
                },
            ],
        });
        if (mid) refs.roots.push(mid);
    }

    //#endregion ----------------- HUD Build/Ensure - Top-Center Panels --------------------



    //#region -------------------- HUD Build/Ensure - Admin Action Counter --------------------

    {
        // Admin action audit counter (top-right)
        const auditCounter = modlib.ParseUI({
            name: `AdminPanelActionCount_${pid}`,
            type: "Text",
            playerId: player,
            // position: [x, y] offset; increase X to move right, increase Y to move down
            position: [20, 22],
            size: [60, 12],
            anchor: mod.UIAnchor.TopRight,
            visible: true,
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
    }

    refs.adminPanelActionCountText = safeFind(`AdminPanelActionCount_${pid}`);

    {
        const conquestTickets = modlib.ParseUI({
            name: `ConquestTicketsHudRoot_${pid}`,
            type: "Container",
            playerId: player,
            position: [CONQUEST_TICKETS_ROOT_X, CONQUEST_TICKETS_ROOT_Y],
            size: [CONQUEST_TICKETS_ROOT_WIDTH, CONQUEST_TICKETS_ROOT_HEIGHT],
            anchor: mod.UIAnchor.TopCenter,
            // Start hidden so swap-time rebuilds cannot show incremental construction frames.
            visible: false,
            padding: 0,
            bgAlpha: 0,
            bgFill: mod.UIBgFill.None,
            children: [
                {
                    name: `ConquestTicketsHudLeftBarTrack_${pid}`,
                    type: "Container",
                    position: [CONQUEST_TICKETS_LEFT_BAR_X, CONQUEST_TICKETS_BAR_Y],
                    size: [CONQUEST_HUD_TICKET_BAR_WIDTH, CONQUEST_HUD_TICKET_BAR_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgColor: [
                        CONQUEST_HUD_TICKET_BAR_FRIENDLY_TRACK_RGB[0],
                        CONQUEST_HUD_TICKET_BAR_FRIENDLY_TRACK_RGB[1],
                        CONQUEST_HUD_TICKET_BAR_FRIENDLY_TRACK_RGB[2],
                    ],
                    bgAlpha: 0.9,
                    bgFill: mod.UIBgFill.Solid,
                    children: [
                        {
                            name: `ConquestTicketsHudLeftBarFill_${pid}`,
                            type: "Container",
                            position: [0, 0],
                            size: [CONQUEST_HUD_TICKET_BAR_WIDTH, CONQUEST_HUD_TICKET_BAR_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: true,
                            padding: 0,
                            bgColor: [
                                CONQUEST_HUD_TICKET_BAR_FRIENDLY_FILL_RGB[0],
                                CONQUEST_HUD_TICKET_BAR_FRIENDLY_FILL_RGB[1],
                                CONQUEST_HUD_TICKET_BAR_FRIENDLY_FILL_RGB[2],
                            ],
                            bgAlpha: 0.95,
                            bgFill: mod.UIBgFill.Solid,
                        },
                    ],
                },
                {
                    name: `ConquestTicketsHudRightBarTrack_${pid}`,
                    type: "Container",
                    position: [CONQUEST_TICKETS_RIGHT_BAR_X, CONQUEST_TICKETS_BAR_Y],
                    size: [CONQUEST_HUD_TICKET_BAR_WIDTH, CONQUEST_HUD_TICKET_BAR_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgColor: [
                        CONQUEST_HUD_TICKET_BAR_ENEMY_TRACK_RGB[0],
                        CONQUEST_HUD_TICKET_BAR_ENEMY_TRACK_RGB[1],
                        CONQUEST_HUD_TICKET_BAR_ENEMY_TRACK_RGB[2],
                    ],
                    bgAlpha: 0.9,
                    bgFill: mod.UIBgFill.Solid,
                    children: [
                        {
                            name: `ConquestTicketsHudRightBarFill_${pid}`,
                            type: "Container",
                            position: [0, 0],
                            size: [CONQUEST_HUD_TICKET_BAR_WIDTH, CONQUEST_HUD_TICKET_BAR_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: true,
                            padding: 0,
                            bgColor: [
                                CONQUEST_HUD_TICKET_BAR_ENEMY_FILL_RGB[0],
                                CONQUEST_HUD_TICKET_BAR_ENEMY_FILL_RGB[1],
                                CONQUEST_HUD_TICKET_BAR_ENEMY_FILL_RGB[2],
                            ],
                            bgAlpha: 0.95,
                            bgFill: mod.UIBgFill.Solid,
                        },
                    ],
                },
                {
                    // Lead border for the left ticket counter (shown only while this side leads).
                    name: `ConquestTicketsHudLeadBorderLeft_${pid}`,
                    type: "Container",
                    position: [CONQUEST_TICKETS_TEAM_LEFT_X - CONQUEST_HUD_TICKET_LEAD_BORDER_GROW, CONQUEST_TICKETS_ROW_Y - CONQUEST_HUD_TICKET_LEAD_BORDER_GROW],
                    size: [
                        CONQUEST_TICKETS_TEAM_WIDTH + (CONQUEST_HUD_TICKET_LEAD_BORDER_GROW * 2),
                        CONQUEST_TICKETS_TEAM_HEIGHT + (CONQUEST_HUD_TICKET_LEAD_BORDER_GROW * 2),
                    ],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: false,
                    padding: 0,
                    bgColor: [
                        CONQUEST_HUD_TEXT_FRIENDLY_RGB[0],
                        CONQUEST_HUD_TEXT_FRIENDLY_RGB[1],
                        CONQUEST_HUD_TEXT_FRIENDLY_RGB[2],
                    ],
                    bgAlpha: CONQUEST_HUD_TICKET_LEAD_BORDER_ALPHA,
                    bgFill: mod.UIBgFill.OutlineThin,
                },
                {
                    // Lead border for the right ticket counter (shown only while this side leads).
                    name: `ConquestTicketsHudLeadBorderRight_${pid}`,
                    type: "Container",
                    position: [CONQUEST_TICKETS_TEAM_RIGHT_X - CONQUEST_HUD_TICKET_LEAD_BORDER_GROW, CONQUEST_TICKETS_ROW_Y - CONQUEST_HUD_TICKET_LEAD_BORDER_GROW],
                    size: [
                        CONQUEST_TICKETS_TEAM_WIDTH + (CONQUEST_HUD_TICKET_LEAD_BORDER_GROW * 2),
                        CONQUEST_TICKETS_TEAM_HEIGHT + (CONQUEST_HUD_TICKET_LEAD_BORDER_GROW * 2),
                    ],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: false,
                    padding: 0,
                    bgColor: [
                        CONQUEST_HUD_TEXT_ENEMY_RGB[0],
                        CONQUEST_HUD_TEXT_ENEMY_RGB[1],
                        CONQUEST_HUD_TEXT_ENEMY_RGB[2],
                    ],
                    bgAlpha: CONQUEST_HUD_TICKET_LEAD_BORDER_ALPHA,
                    bgFill: mod.UIBgFill.OutlineThin,
                },
                {
                    // Drop shadow for the left lead crown.
                    name: `ConquestTicketsHudLeadCrownLeftShadow_${pid}`,
                    type: "Image",
                    position: [
                        CONQUEST_TICKETS_TEAM_LEFT_X + ((CONQUEST_TICKETS_TEAM_WIDTH - CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE) / 2) - CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_CENTER_SHIFT + CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_OFFSET,
                        -(CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE + CONQUEST_HUD_TICKET_LEAD_CROWN_GAP_Y) - CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_CENTER_SHIFT + CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_OFFSET + CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_TOP_BIAS,
                    ],
                    size: [CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_SIZE, CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_SIZE],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: false,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    imageType: mod.UIImageType.CrownSolid,
                    imageColor: [0, 0, 0],
                    imageAlpha: CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_ALPHA,
                },
                {
                    // Lead crown for the left ticket counter (shown only while this side leads).
                    name: `ConquestTicketsHudLeadCrownLeft_${pid}`,
                    type: "Image",
                    position: [
                        CONQUEST_TICKETS_TEAM_LEFT_X + ((CONQUEST_TICKETS_TEAM_WIDTH - CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE) / 2),
                        -(CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE + CONQUEST_HUD_TICKET_LEAD_CROWN_GAP_Y),
                    ],
                    size: [CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE, CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: false,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    imageType: mod.UIImageType.CrownSolid,
                    imageColor: [
                        CONQUEST_HUD_TICKET_LEAD_CROWN_RGB[0],
                        CONQUEST_HUD_TICKET_LEAD_CROWN_RGB[1],
                        CONQUEST_HUD_TICKET_LEAD_CROWN_RGB[2],
                    ],
                    imageAlpha: 1,
                },
                {
                    // Drop shadow for the right lead crown.
                    name: `ConquestTicketsHudLeadCrownRightShadow_${pid}`,
                    type: "Image",
                    position: [
                        CONQUEST_TICKETS_TEAM_RIGHT_X + ((CONQUEST_TICKETS_TEAM_WIDTH - CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE) / 2) - CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_CENTER_SHIFT + CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_OFFSET,
                        -(CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE + CONQUEST_HUD_TICKET_LEAD_CROWN_GAP_Y) - CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_CENTER_SHIFT + CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_OFFSET + CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_TOP_BIAS,
                    ],
                    size: [CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_SIZE, CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_SIZE],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: false,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    imageType: mod.UIImageType.CrownSolid,
                    imageColor: [0, 0, 0],
                    imageAlpha: CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_ALPHA,
                },
                {
                    // Lead crown for the right ticket counter (shown only while this side leads).
                    name: `ConquestTicketsHudLeadCrownRight_${pid}`,
                    type: "Image",
                    position: [
                        CONQUEST_TICKETS_TEAM_RIGHT_X + ((CONQUEST_TICKETS_TEAM_WIDTH - CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE) / 2),
                        -(CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE + CONQUEST_HUD_TICKET_LEAD_CROWN_GAP_Y),
                    ],
                    size: [CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE, CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: false,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    imageType: mod.UIImageType.CrownSolid,
                    imageColor: [
                        CONQUEST_HUD_TICKET_LEAD_CROWN_RGB[0],
                        CONQUEST_HUD_TICKET_LEAD_CROWN_RGB[1],
                        CONQUEST_HUD_TICKET_LEAD_CROWN_RGB[2],
                    ],
                    imageAlpha: 1,
                },
                {
                    name: `ConquestTicketsHudBleedChevronLeft1_${pid}`,
                    type: "Text",
                    position: [CONQUEST_TICKETS_BLEED_LEFT_X, CONQUEST_TICKETS_BLEED_Y],
                    size: [CONQUEST_HUD_TICKET_BLEED_CHEVRON_WIDTH, CONQUEST_HUD_TICKET_BLEED_CHEVRON_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: false,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(STR_HUD_CONQUEST_BLEED_CHEVRON_LEFT),
                    textColor: [
                        CONQUEST_HUD_TICKET_BLEED_CHEVRON_FRIENDLY_RGB[0],
                        CONQUEST_HUD_TICKET_BLEED_CHEVRON_FRIENDLY_RGB[1],
                        CONQUEST_HUD_TICKET_BLEED_CHEVRON_FRIENDLY_RGB[2],
                    ],
                    textAlpha: 1,
                    textSize: CONQUEST_HUD_TICKET_BLEED_CHEVRON_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    name: `ConquestTicketsHudBleedChevronLeft2_${pid}`,
                    type: "Text",
                    position: [CONQUEST_TICKETS_BLEED_LEFT_X + CONQUEST_HUD_TICKET_BLEED_CHEVRON_STEP_X, CONQUEST_TICKETS_BLEED_Y],
                    size: [CONQUEST_HUD_TICKET_BLEED_CHEVRON_WIDTH, CONQUEST_HUD_TICKET_BLEED_CHEVRON_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: false,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(STR_HUD_CONQUEST_BLEED_CHEVRON_LEFT),
                    textColor: [
                        CONQUEST_HUD_TICKET_BLEED_CHEVRON_FRIENDLY_RGB[0],
                        CONQUEST_HUD_TICKET_BLEED_CHEVRON_FRIENDLY_RGB[1],
                        CONQUEST_HUD_TICKET_BLEED_CHEVRON_FRIENDLY_RGB[2],
                    ],
                    textAlpha: 1,
                    textSize: CONQUEST_HUD_TICKET_BLEED_CHEVRON_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    name: `ConquestTicketsHudBleedChevronLeft3_${pid}`,
                    type: "Text",
                    position: [CONQUEST_TICKETS_BLEED_LEFT_X + (CONQUEST_HUD_TICKET_BLEED_CHEVRON_STEP_X * 2), CONQUEST_TICKETS_BLEED_Y],
                    size: [CONQUEST_HUD_TICKET_BLEED_CHEVRON_WIDTH, CONQUEST_HUD_TICKET_BLEED_CHEVRON_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: false,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(STR_HUD_CONQUEST_BLEED_CHEVRON_LEFT),
                    textColor: [
                        CONQUEST_HUD_TICKET_BLEED_CHEVRON_FRIENDLY_RGB[0],
                        CONQUEST_HUD_TICKET_BLEED_CHEVRON_FRIENDLY_RGB[1],
                        CONQUEST_HUD_TICKET_BLEED_CHEVRON_FRIENDLY_RGB[2],
                    ],
                    textAlpha: 1,
                    textSize: CONQUEST_HUD_TICKET_BLEED_CHEVRON_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    name: `ConquestTicketsHudBleedChevronRight1_${pid}`,
                    type: "Text",
                    position: [CONQUEST_TICKETS_BLEED_RIGHT_X, CONQUEST_TICKETS_BLEED_Y],
                    size: [CONQUEST_HUD_TICKET_BLEED_CHEVRON_WIDTH, CONQUEST_HUD_TICKET_BLEED_CHEVRON_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: false,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(STR_HUD_CONQUEST_BLEED_CHEVRON_RIGHT),
                    textColor: [
                        CONQUEST_HUD_TICKET_BLEED_CHEVRON_ENEMY_RGB[0],
                        CONQUEST_HUD_TICKET_BLEED_CHEVRON_ENEMY_RGB[1],
                        CONQUEST_HUD_TICKET_BLEED_CHEVRON_ENEMY_RGB[2],
                    ],
                    textAlpha: 1,
                    textSize: CONQUEST_HUD_TICKET_BLEED_CHEVRON_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    name: `ConquestTicketsHudBleedChevronRight2_${pid}`,
                    type: "Text",
                    position: [CONQUEST_TICKETS_BLEED_RIGHT_X - CONQUEST_HUD_TICKET_BLEED_CHEVRON_STEP_X, CONQUEST_TICKETS_BLEED_Y],
                    size: [CONQUEST_HUD_TICKET_BLEED_CHEVRON_WIDTH, CONQUEST_HUD_TICKET_BLEED_CHEVRON_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: false,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(STR_HUD_CONQUEST_BLEED_CHEVRON_RIGHT),
                    textColor: [
                        CONQUEST_HUD_TICKET_BLEED_CHEVRON_ENEMY_RGB[0],
                        CONQUEST_HUD_TICKET_BLEED_CHEVRON_ENEMY_RGB[1],
                        CONQUEST_HUD_TICKET_BLEED_CHEVRON_ENEMY_RGB[2],
                    ],
                    textAlpha: 1,
                    textSize: CONQUEST_HUD_TICKET_BLEED_CHEVRON_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    name: `ConquestTicketsHudBleedChevronRight3_${pid}`,
                    type: "Text",
                    position: [CONQUEST_TICKETS_BLEED_RIGHT_X - (CONQUEST_HUD_TICKET_BLEED_CHEVRON_STEP_X * 2), CONQUEST_TICKETS_BLEED_Y],
                    size: [CONQUEST_HUD_TICKET_BLEED_CHEVRON_WIDTH, CONQUEST_HUD_TICKET_BLEED_CHEVRON_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: false,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(STR_HUD_CONQUEST_BLEED_CHEVRON_RIGHT),
                    textColor: [
                        CONQUEST_HUD_TICKET_BLEED_CHEVRON_ENEMY_RGB[0],
                        CONQUEST_HUD_TICKET_BLEED_CHEVRON_ENEMY_RGB[1],
                        CONQUEST_HUD_TICKET_BLEED_CHEVRON_ENEMY_RGB[2],
                    ],
                    textAlpha: 1,
                    textSize: CONQUEST_HUD_TICKET_BLEED_CHEVRON_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    name: `ConquestTicketsHudTeam1Container_${pid}`,
                    type: "Container",
                    position: [CONQUEST_TICKETS_TEAM_LEFT_X, CONQUEST_TICKETS_ROW_Y],
                    size: [CONQUEST_TICKETS_TEAM_WIDTH, CONQUEST_TICKETS_TEAM_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgColor: [
                        CONQUEST_TICKETS_BG_RGB[0],
                        CONQUEST_TICKETS_BG_RGB[1],
                        CONQUEST_TICKETS_BG_RGB[2],
                    ],
                    bgAlpha: CONQUEST_TICKETS_BG_ALPHA,
                    bgFill: mod.UIBgFill.Blur,
                    children: [
                        {
                            name: `ConquestTicketsHudTeam1Shadow_${pid}`,
                            type: "Text",
                            position: [
                                CONQUEST_TICKETS_TEAM_TEXT_LEFT_OFFSET_X + CONQUEST_HUD_TICKET_COUNTER_SHADOW_OFFSET,
                                CONQUEST_HUD_TICKET_COUNTER_SHADOW_OFFSET,
                            ],
                            size: [CONQUEST_TICKETS_TEAM_WIDTH, CONQUEST_TICKETS_TEAM_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: false,
                            padding: 0,
                            bgAlpha: 0,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                            textColor: [0, 0, 0],
                            textAlpha: 1,
                            textSize: CONQUEST_TICKETS_TEAM_SHADOW_TEXT_SIZE,
                            textAnchor: mod.UIAnchor.Center,
                        },
                        {
                            name: `ConquestTicketsHudTeam1_${pid}`,
                            type: "Text",
                            position: [CONQUEST_TICKETS_TEAM_TEXT_LEFT_OFFSET_X, 0],
                            size: [CONQUEST_TICKETS_TEAM_WIDTH, CONQUEST_TICKETS_TEAM_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: true,
                            padding: 0,
                            bgAlpha: 0,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                            textColor: [
                                CONQUEST_HUD_TEXT_FRIENDLY_RGB[0],
                                CONQUEST_HUD_TEXT_FRIENDLY_RGB[1],
                                CONQUEST_HUD_TEXT_FRIENDLY_RGB[2],
                            ],
                            textAlpha: 1,
                            textSize: CONQUEST_TICKETS_TEAM_TEXT_SIZE,
                            textAnchor: mod.UIAnchor.Center,
                        },
                        {
                            name: `ConquestTicketsHudTeam1CoreOverlay_${pid}`,
                            type: "Text",
                            position: [CONQUEST_TICKETS_TEAM_TEXT_LEFT_OFFSET_X, 0],
                            size: [CONQUEST_TICKETS_TEAM_WIDTH, CONQUEST_TICKETS_TEAM_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: true,
                            padding: 0,
                            bgAlpha: 0,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                            textColor: [
                                CONQUEST_HUD_TEXT_FRIENDLY_RGB[0],
                                CONQUEST_HUD_TEXT_FRIENDLY_RGB[1],
                                CONQUEST_HUD_TEXT_FRIENDLY_RGB[2],
                            ],
                            textAlpha: 1,
                            textSize: CONQUEST_TICKETS_TEAM_TEXT_SIZE,
                            textAnchor: mod.UIAnchor.Center,
                        },
                    ],
                },
                {
                    name: `ConquestTicketsHudSlash_${pid}`,
                    type: "Text",
                    position: [272, CONQUEST_TICKETS_ROW_Y],
                    size: [16, 24],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: false,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.stringkeys.twl.system.slash,
                    textColor: [
                        CONQUEST_HUD_TEXT_NEUTRAL_RGB[0],
                        CONQUEST_HUD_TEXT_NEUTRAL_RGB[1],
                        CONQUEST_HUD_TEXT_NEUTRAL_RGB[2],
                    ],
                    textAlpha: 1,
                    textSize: 22,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    name: `ConquestTicketsHudTeam2Container_${pid}`,
                    type: "Container",
                    position: [CONQUEST_TICKETS_TEAM_RIGHT_X, CONQUEST_TICKETS_ROW_Y],
                    size: [CONQUEST_TICKETS_TEAM_WIDTH, CONQUEST_TICKETS_TEAM_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgColor: [
                        CONQUEST_TICKETS_BG_RGB[0],
                        CONQUEST_TICKETS_BG_RGB[1],
                        CONQUEST_TICKETS_BG_RGB[2],
                    ],
                    bgAlpha: CONQUEST_TICKETS_BG_ALPHA,
                    bgFill: mod.UIBgFill.Blur,
                    children: [
                        {
                            name: `ConquestTicketsHudTeam2Shadow_${pid}`,
                            type: "Text",
                            position: [
                                CONQUEST_TICKETS_TEAM_TEXT_RIGHT_OFFSET_X + CONQUEST_HUD_TICKET_COUNTER_SHADOW_OFFSET,
                                CONQUEST_HUD_TICKET_COUNTER_SHADOW_OFFSET,
                            ],
                            size: [CONQUEST_TICKETS_TEAM_WIDTH, CONQUEST_TICKETS_TEAM_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: false,
                            padding: 0,
                            bgAlpha: 0,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                            textColor: [0, 0, 0],
                            textAlpha: 1,
                            textSize: CONQUEST_TICKETS_TEAM_SHADOW_TEXT_SIZE,
                            textAnchor: mod.UIAnchor.Center,
                        },
                        {
                            name: `ConquestTicketsHudTeam2_${pid}`,
                            type: "Text",
                            position: [CONQUEST_TICKETS_TEAM_TEXT_RIGHT_OFFSET_X, 0],
                            size: [CONQUEST_TICKETS_TEAM_WIDTH, CONQUEST_TICKETS_TEAM_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: true,
                            padding: 0,
                            bgAlpha: 0,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                            textColor: [
                                CONQUEST_HUD_TEXT_ENEMY_RGB[0],
                                CONQUEST_HUD_TEXT_ENEMY_RGB[1],
                                CONQUEST_HUD_TEXT_ENEMY_RGB[2],
                            ],
                            textAlpha: 1,
                            textSize: CONQUEST_TICKETS_TEAM_TEXT_SIZE,
                            textAnchor: mod.UIAnchor.Center,
                        },
                        {
                            name: `ConquestTicketsHudTeam2CoreOverlay_${pid}`,
                            type: "Text",
                            position: [CONQUEST_TICKETS_TEAM_TEXT_RIGHT_OFFSET_X, 0],
                            size: [CONQUEST_TICKETS_TEAM_WIDTH, CONQUEST_TICKETS_TEAM_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: true,
                            padding: 0,
                            bgAlpha: 0,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                            textColor: [
                                CONQUEST_HUD_TEXT_ENEMY_RGB[0],
                                CONQUEST_HUD_TEXT_ENEMY_RGB[1],
                                CONQUEST_HUD_TEXT_ENEMY_RGB[2],
                            ],
                            textAlpha: 1,
                            textSize: CONQUEST_TICKETS_TEAM_TEXT_SIZE,
                            textAnchor: mod.UIAnchor.Center,
                        },
                    ],
                },
            ],
        });
        if (conquestTickets) refs.roots.push(conquestTickets);
    }
    ensureConquestTicketCounterShadowWidgets();
    ensureConquestBleedChevronWidgets();

    refs.conquestTicketsDebugRoot = safeFind(`ConquestTicketsHudRoot_${pid}`);
    refs.conquestTicketsTeam1Container = safeFind(`ConquestTicketsHudTeam1Container_${pid}`);
    refs.conquestTicketsTeam2Container = safeFind(`ConquestTicketsHudTeam2Container_${pid}`);
    refs.conquestTicketsDebugTeam1Shadow = safeFind(`ConquestTicketsHudTeam1Shadow_${pid}`);
    refs.conquestTicketsDebugTeam2Shadow = safeFind(`ConquestTicketsHudTeam2Shadow_${pid}`);
    refs.conquestTicketsDebugTeam1 = safeFind(`ConquestTicketsHudTeam1CoreOverlay_${pid}`) ?? safeFind(`ConquestTicketsHudTeam1_${pid}`);
    refs.conquestTicketsDebugTeam2 = safeFind(`ConquestTicketsHudTeam2CoreOverlay_${pid}`) ?? safeFind(`ConquestTicketsHudTeam2_${pid}`);
    refs.conquestTicketsSlash = safeFind(`ConquestTicketsHudSlash_${pid}`);
    refs.conquestTicketsDebugLeftBarTrack = safeFind(`ConquestTicketsHudLeftBarTrack_${pid}`);
    refs.conquestTicketsDebugLeftBarFill = safeFind(`ConquestTicketsHudLeftBarFill_${pid}`);
    refs.conquestTicketsDebugRightBarTrack = safeFind(`ConquestTicketsHudRightBarTrack_${pid}`);
    refs.conquestTicketsDebugRightBarFill = safeFind(`ConquestTicketsHudRightBarFill_${pid}`);
    refs.conquestTicketsLeadLeftBorder = safeFind(`ConquestTicketsHudLeadBorderLeft_${pid}`);
    refs.conquestTicketsLeadRightBorder = safeFind(`ConquestTicketsHudLeadBorderRight_${pid}`);
    refs.conquestTicketsLeadLeftCrownShadow = safeFind(`ConquestTicketsHudLeadCrownLeftShadow_${pid}`);
    refs.conquestTicketsLeadRightCrownShadow = safeFind(`ConquestTicketsHudLeadCrownRightShadow_${pid}`);
    refs.conquestTicketsLeadLeftCrown = safeFind(`ConquestTicketsHudLeadCrownLeft_${pid}`);
    refs.conquestTicketsLeadRightCrown = safeFind(`ConquestTicketsHudLeadCrownRight_${pid}`);
    refs.conquestTicketsBleedLeftChevrons = [];
    refs.conquestTicketsBleedRightChevrons = [];
    for (let chevronIndex = 0; chevronIndex < CONQUEST_HUD_TICKET_BLEED_CHEVRON_COUNT; chevronIndex++) {
        refs.conquestTicketsBleedLeftChevrons[chevronIndex] = safeFind(`ConquestTicketsHudBleedChevronLeft${chevronIndex + 1}_${pid}`);
        refs.conquestTicketsBleedRightChevrons[chevronIndex] = safeFind(`ConquestTicketsHudBleedChevronRight${chevronIndex + 1}_${pid}`);
    }
    const conquestTicketsSlash = refs.conquestTicketsSlash;
    if (refs.conquestTicketsDebugRoot) {
        const ticketsRoot = refs.conquestTicketsDebugRoot;
        const setTicketCounterShadowRingLocalLayout = (
            teamPrefix: string,
            parent: mod.UIWidget,
            baseX: number,
            baseY: number
        ): void => {
            for (let layerIndex = 0; layerIndex < CONQUEST_TICKET_COUNTER_SHADOW_RING_LAYERS.length; layerIndex++) {
                const layer = CONQUEST_TICKET_COUNTER_SHADOW_RING_LAYERS[layerIndex];
                const shadow = safeFind(`${teamPrefix}${layer.suffix}_${pid}`);
                if (!shadow) continue;
                mod.SetUIWidgetParent(shadow, parent);
                mod.SetUIWidgetPosition(
                    shadow,
                    mod.CreateVector(baseX + layer.offsetX, baseY + layer.offsetY, 0)
                );
                mod.SetUIWidgetSize(
                    shadow,
                    mod.CreateVector(CONQUEST_TICKETS_TEAM_WIDTH, CONQUEST_TICKETS_TEAM_HEIGHT, 0)
                );
                mod.SetUITextSize(shadow, CONQUEST_TICKETS_TEAM_SHADOW_TEXT_SIZE);
                mod.SetUITextAlpha(shadow, CONQUEST_HUD_TICKET_COUNTER_SHADOW_ALPHA);
            }
        };
        if (refs.conquestTicketsDebugLeftBarTrack) {
            mod.SetUIWidgetParent(refs.conquestTicketsDebugLeftBarTrack, ticketsRoot);
            mod.SetUIWidgetPosition(
                refs.conquestTicketsDebugLeftBarTrack,
                mod.CreateVector(CONQUEST_TICKETS_LEFT_BAR_X, CONQUEST_TICKETS_BAR_Y, 0)
            );
        }
        if (refs.conquestTicketsDebugLeftBarFill && refs.conquestTicketsDebugLeftBarTrack) {
            mod.SetUIWidgetParent(refs.conquestTicketsDebugLeftBarFill, refs.conquestTicketsDebugLeftBarTrack);
            mod.SetUIWidgetPosition(refs.conquestTicketsDebugLeftBarFill, mod.CreateVector(0, 0, 0));
            mod.SetUIWidgetSize(
                refs.conquestTicketsDebugLeftBarFill,
                mod.CreateVector(CONQUEST_HUD_TICKET_BAR_WIDTH, CONQUEST_HUD_TICKET_BAR_HEIGHT, 0)
            );
        }
        if (refs.conquestTicketsDebugRightBarTrack) {
            mod.SetUIWidgetParent(refs.conquestTicketsDebugRightBarTrack, refs.conquestTicketsDebugRoot);
            mod.SetUIWidgetPosition(
                refs.conquestTicketsDebugRightBarTrack,
                mod.CreateVector(CONQUEST_TICKETS_RIGHT_BAR_X, CONQUEST_TICKETS_BAR_Y, 0)
            );
        }
        if (refs.conquestTicketsDebugRightBarFill && refs.conquestTicketsDebugRightBarTrack) {
            mod.SetUIWidgetParent(refs.conquestTicketsDebugRightBarFill, refs.conquestTicketsDebugRightBarTrack);
            mod.SetUIWidgetPosition(refs.conquestTicketsDebugRightBarFill, mod.CreateVector(0, 0, 0));
            mod.SetUIWidgetSize(
                refs.conquestTicketsDebugRightBarFill,
                mod.CreateVector(CONQUEST_HUD_TICKET_BAR_WIDTH, CONQUEST_HUD_TICKET_BAR_HEIGHT, 0)
            );
        }
        if (refs.conquestTicketsDebugTeam1) {
            const team1Container = refs.conquestTicketsTeam1Container;
            mod.SetUIWidgetParent(refs.conquestTicketsDebugTeam1, team1Container ?? refs.conquestTicketsDebugRoot);
            mod.SetUIWidgetPosition(
                refs.conquestTicketsDebugTeam1,
                team1Container
                    ? mod.CreateVector(CONQUEST_TICKETS_TEAM_TEXT_LEFT_OFFSET_X, 0, 0)
                    : mod.CreateVector(CONQUEST_TICKETS_TEAM_LEFT_X, CONQUEST_TICKETS_ROW_Y, 0)
            );
            mod.SetUIWidgetSize(
                refs.conquestTicketsDebugTeam1,
                mod.CreateVector(CONQUEST_TICKETS_TEAM_WIDTH, CONQUEST_TICKETS_TEAM_HEIGHT, 0)
            );
            if (team1Container) {
                mod.SetUIWidgetParent(team1Container, refs.conquestTicketsDebugRoot);
                mod.SetUIWidgetPosition(
                    team1Container,
                    mod.CreateVector(CONQUEST_TICKETS_TEAM_LEFT_X, CONQUEST_TICKETS_ROW_Y, 0)
                );
                mod.SetUIWidgetSize(
                    team1Container,
                    mod.CreateVector(CONQUEST_TICKETS_TEAM_WIDTH, CONQUEST_TICKETS_TEAM_HEIGHT, 0)
                );
            }
        }
        if (refs.conquestTicketsDebugTeam1Shadow) {
            const team1Container = refs.conquestTicketsTeam1Container;
            mod.SetUIWidgetParent(refs.conquestTicketsDebugTeam1Shadow, team1Container ?? refs.conquestTicketsDebugRoot);
            mod.SetUIWidgetPosition(
                refs.conquestTicketsDebugTeam1Shadow,
                team1Container
                    ? mod.CreateVector(
                        CONQUEST_TICKETS_TEAM_TEXT_LEFT_OFFSET_X + CONQUEST_HUD_TICKET_COUNTER_SHADOW_OFFSET,
                        CONQUEST_HUD_TICKET_COUNTER_SHADOW_OFFSET,
                        0
                    )
                    : mod.CreateVector(
                        CONQUEST_TICKETS_TEAM_LEFT_X + CONQUEST_HUD_TICKET_COUNTER_SHADOW_OFFSET,
                        CONQUEST_TICKETS_ROW_Y + CONQUEST_HUD_TICKET_COUNTER_SHADOW_OFFSET,
                        0
                    )
            );
            mod.SetUIWidgetSize(
                refs.conquestTicketsDebugTeam1Shadow,
                mod.CreateVector(CONQUEST_TICKETS_TEAM_WIDTH, CONQUEST_TICKETS_TEAM_HEIGHT, 0)
            );
            mod.SetUITextSize(refs.conquestTicketsDebugTeam1Shadow, CONQUEST_TICKETS_TEAM_SHADOW_TEXT_SIZE);
            if (refs.conquestTicketsDebugTeam1) {
                mod.SetUIWidgetParent(refs.conquestTicketsDebugTeam1, team1Container ?? refs.conquestTicketsDebugRoot);
                mod.SetUIWidgetPosition(
                    refs.conquestTicketsDebugTeam1,
                    team1Container
                        ? mod.CreateVector(CONQUEST_TICKETS_TEAM_TEXT_LEFT_OFFSET_X, 0, 0)
                        : mod.CreateVector(CONQUEST_TICKETS_TEAM_LEFT_X, CONQUEST_TICKETS_ROW_Y, 0)
                );
                mod.SetUIWidgetSize(
                    refs.conquestTicketsDebugTeam1,
                    mod.CreateVector(CONQUEST_TICKETS_TEAM_WIDTH, CONQUEST_TICKETS_TEAM_HEIGHT, 0)
                );
                mod.SetUITextSize(refs.conquestTicketsDebugTeam1, CONQUEST_TICKETS_TEAM_TEXT_SIZE);
            }
        }
        const team1ShadowParent = refs.conquestTicketsTeam1Container ?? refs.conquestTicketsDebugRoot;
        const team1ShadowBaseX = refs.conquestTicketsTeam1Container ? CONQUEST_TICKETS_TEAM_TEXT_LEFT_OFFSET_X : CONQUEST_TICKETS_TEAM_LEFT_X;
        const team1ShadowBaseY = refs.conquestTicketsTeam1Container ? 0 : CONQUEST_TICKETS_ROW_Y;
        setTicketCounterShadowRingLocalLayout(
            "ConquestTicketsHudTeam1",
            team1ShadowParent,
            team1ShadowBaseX,
            team1ShadowBaseY
        );
        if (conquestTicketsSlash) {
            mod.SetUIWidgetParent(conquestTicketsSlash, refs.conquestTicketsDebugRoot);
            mod.SetUIWidgetPosition(conquestTicketsSlash, mod.CreateVector(272, CONQUEST_TICKETS_ROW_Y, 0));
        }
        if (refs.conquestTicketsDebugTeam2) {
            const team2Container = refs.conquestTicketsTeam2Container;
            mod.SetUIWidgetParent(refs.conquestTicketsDebugTeam2, team2Container ?? refs.conquestTicketsDebugRoot);
            mod.SetUIWidgetPosition(
                refs.conquestTicketsDebugTeam2,
                team2Container
                    ? mod.CreateVector(CONQUEST_TICKETS_TEAM_TEXT_RIGHT_OFFSET_X, 0, 0)
                    : mod.CreateVector(CONQUEST_TICKETS_TEAM_RIGHT_X, CONQUEST_TICKETS_ROW_Y, 0)
            );
            mod.SetUIWidgetSize(
                refs.conquestTicketsDebugTeam2,
                mod.CreateVector(CONQUEST_TICKETS_TEAM_WIDTH, CONQUEST_TICKETS_TEAM_HEIGHT, 0)
            );
            if (team2Container) {
                mod.SetUIWidgetParent(team2Container, refs.conquestTicketsDebugRoot);
                mod.SetUIWidgetPosition(
                    team2Container,
                    mod.CreateVector(CONQUEST_TICKETS_TEAM_RIGHT_X, CONQUEST_TICKETS_ROW_Y, 0)
                );
                mod.SetUIWidgetSize(
                    team2Container,
                    mod.CreateVector(CONQUEST_TICKETS_TEAM_WIDTH, CONQUEST_TICKETS_TEAM_HEIGHT, 0)
                );
            }
        }
        if (refs.conquestTicketsDebugTeam2Shadow) {
            const team2Container = refs.conquestTicketsTeam2Container;
            mod.SetUIWidgetParent(refs.conquestTicketsDebugTeam2Shadow, team2Container ?? refs.conquestTicketsDebugRoot);
            mod.SetUIWidgetPosition(
                refs.conquestTicketsDebugTeam2Shadow,
                team2Container
                    ? mod.CreateVector(
                        CONQUEST_TICKETS_TEAM_TEXT_RIGHT_OFFSET_X + CONQUEST_HUD_TICKET_COUNTER_SHADOW_OFFSET,
                        CONQUEST_HUD_TICKET_COUNTER_SHADOW_OFFSET,
                        0
                    )
                    : mod.CreateVector(
                        CONQUEST_TICKETS_TEAM_RIGHT_X + CONQUEST_HUD_TICKET_COUNTER_SHADOW_OFFSET,
                        CONQUEST_TICKETS_ROW_Y + CONQUEST_HUD_TICKET_COUNTER_SHADOW_OFFSET,
                        0
                    )
            );
            mod.SetUIWidgetSize(
                refs.conquestTicketsDebugTeam2Shadow,
                mod.CreateVector(CONQUEST_TICKETS_TEAM_WIDTH, CONQUEST_TICKETS_TEAM_HEIGHT, 0)
            );
            mod.SetUITextSize(refs.conquestTicketsDebugTeam2Shadow, CONQUEST_TICKETS_TEAM_SHADOW_TEXT_SIZE);
            if (refs.conquestTicketsDebugTeam2) {
                mod.SetUIWidgetParent(refs.conquestTicketsDebugTeam2, team2Container ?? refs.conquestTicketsDebugRoot);
                mod.SetUIWidgetPosition(
                    refs.conquestTicketsDebugTeam2,
                    team2Container
                        ? mod.CreateVector(CONQUEST_TICKETS_TEAM_TEXT_RIGHT_OFFSET_X, 0, 0)
                        : mod.CreateVector(CONQUEST_TICKETS_TEAM_RIGHT_X, CONQUEST_TICKETS_ROW_Y, 0)
                );
                mod.SetUIWidgetSize(
                    refs.conquestTicketsDebugTeam2,
                    mod.CreateVector(CONQUEST_TICKETS_TEAM_WIDTH, CONQUEST_TICKETS_TEAM_HEIGHT, 0)
                );
                mod.SetUITextSize(refs.conquestTicketsDebugTeam2, CONQUEST_TICKETS_TEAM_TEXT_SIZE);
            }
        }
        const team2ShadowParent = refs.conquestTicketsTeam2Container ?? refs.conquestTicketsDebugRoot;
        const team2ShadowBaseX = refs.conquestTicketsTeam2Container ? CONQUEST_TICKETS_TEAM_TEXT_RIGHT_OFFSET_X : CONQUEST_TICKETS_TEAM_RIGHT_X;
        const team2ShadowBaseY = refs.conquestTicketsTeam2Container ? 0 : CONQUEST_TICKETS_ROW_Y;
        setTicketCounterShadowRingLocalLayout(
            "ConquestTicketsHudTeam2",
            team2ShadowParent,
            team2ShadowBaseX,
            team2ShadowBaseY
        );
        if (refs.conquestTicketsLeadLeftBorder) {
            mod.SetUIWidgetParent(refs.conquestTicketsLeadLeftBorder, refs.conquestTicketsDebugRoot);
            mod.SetUIWidgetPosition(
                refs.conquestTicketsLeadLeftBorder,
                mod.CreateVector(CONQUEST_TICKETS_TEAM_LEFT_X - CONQUEST_HUD_TICKET_LEAD_BORDER_GROW, CONQUEST_TICKETS_ROW_Y - CONQUEST_HUD_TICKET_LEAD_BORDER_GROW, 0)
            );
            mod.SetUIWidgetSize(
                refs.conquestTicketsLeadLeftBorder,
                mod.CreateVector(CONQUEST_TICKETS_TEAM_WIDTH + (CONQUEST_HUD_TICKET_LEAD_BORDER_GROW * 2), CONQUEST_TICKETS_TEAM_HEIGHT + (CONQUEST_HUD_TICKET_LEAD_BORDER_GROW * 2), 0)
            );
        }
        if (refs.conquestTicketsLeadRightBorder) {
            mod.SetUIWidgetParent(refs.conquestTicketsLeadRightBorder, refs.conquestTicketsDebugRoot);
            mod.SetUIWidgetPosition(
                refs.conquestTicketsLeadRightBorder,
                mod.CreateVector(CONQUEST_TICKETS_TEAM_RIGHT_X - CONQUEST_HUD_TICKET_LEAD_BORDER_GROW, CONQUEST_TICKETS_ROW_Y - CONQUEST_HUD_TICKET_LEAD_BORDER_GROW, 0)
            );
            mod.SetUIWidgetSize(
                refs.conquestTicketsLeadRightBorder,
                mod.CreateVector(CONQUEST_TICKETS_TEAM_WIDTH + (CONQUEST_HUD_TICKET_LEAD_BORDER_GROW * 2), CONQUEST_TICKETS_TEAM_HEIGHT + (CONQUEST_HUD_TICKET_LEAD_BORDER_GROW * 2), 0)
            );
        }
        if (refs.conquestTicketsLeadLeftCrownShadow) {
            mod.SetUIWidgetParent(refs.conquestTicketsLeadLeftCrownShadow, refs.conquestTicketsDebugRoot);
            mod.SetUIWidgetPosition(
                refs.conquestTicketsLeadLeftCrownShadow,
                mod.CreateVector(
                    CONQUEST_TICKETS_TEAM_LEFT_X + ((CONQUEST_TICKETS_TEAM_WIDTH - CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE) / 2) - CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_CENTER_SHIFT + CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_OFFSET,
                    -(CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE + CONQUEST_HUD_TICKET_LEAD_CROWN_GAP_Y) - CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_CENTER_SHIFT + CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_OFFSET + CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_TOP_BIAS,
                    0
                )
            );
            mod.SetUIWidgetSize(
                refs.conquestTicketsLeadLeftCrownShadow,
                mod.CreateVector(CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_SIZE, CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_SIZE, 0)
            );
        }
        if (refs.conquestTicketsLeadRightCrownShadow) {
            mod.SetUIWidgetParent(refs.conquestTicketsLeadRightCrownShadow, refs.conquestTicketsDebugRoot);
            mod.SetUIWidgetPosition(
                refs.conquestTicketsLeadRightCrownShadow,
                mod.CreateVector(
                    CONQUEST_TICKETS_TEAM_RIGHT_X + ((CONQUEST_TICKETS_TEAM_WIDTH - CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE) / 2) - CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_CENTER_SHIFT + CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_OFFSET,
                    -(CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE + CONQUEST_HUD_TICKET_LEAD_CROWN_GAP_Y) - CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_CENTER_SHIFT + CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_OFFSET + CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_TOP_BIAS,
                    0
                )
            );
            mod.SetUIWidgetSize(
                refs.conquestTicketsLeadRightCrownShadow,
                mod.CreateVector(CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_SIZE, CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_SIZE, 0)
            );
        }
        if (refs.conquestTicketsLeadLeftCrown) {
            mod.SetUIWidgetParent(refs.conquestTicketsLeadLeftCrown, refs.conquestTicketsDebugRoot);
            mod.SetUIWidgetPosition(
                refs.conquestTicketsLeadLeftCrown,
                mod.CreateVector(
                    CONQUEST_TICKETS_TEAM_LEFT_X + ((CONQUEST_TICKETS_TEAM_WIDTH - CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE) / 2),
                    -(CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE + CONQUEST_HUD_TICKET_LEAD_CROWN_GAP_Y),
                    0
                )
            );
            mod.SetUIWidgetSize(
                refs.conquestTicketsLeadLeftCrown,
                mod.CreateVector(CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE, CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE, 0)
            );
        }
        if (refs.conquestTicketsLeadRightCrown) {
            mod.SetUIWidgetParent(refs.conquestTicketsLeadRightCrown, refs.conquestTicketsDebugRoot);
            mod.SetUIWidgetPosition(
                refs.conquestTicketsLeadRightCrown,
                mod.CreateVector(
                    CONQUEST_TICKETS_TEAM_RIGHT_X + ((CONQUEST_TICKETS_TEAM_WIDTH - CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE) / 2),
                    -(CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE + CONQUEST_HUD_TICKET_LEAD_CROWN_GAP_Y),
                    0
                )
            );
            mod.SetUIWidgetSize(
                refs.conquestTicketsLeadRightCrown,
                mod.CreateVector(CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE, CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE, 0)
            );
        }
        const leftBleedChevrons = refs.conquestTicketsBleedLeftChevrons ?? [];
        const rightBleedChevrons = refs.conquestTicketsBleedRightChevrons ?? [];
        const chevronOverlayParent = mod.GetUIRoot();
        for (let chevronIndex = 0; chevronIndex < CONQUEST_HUD_TICKET_BLEED_CHEVRON_COUNT; chevronIndex++) {
            // Keep chevrons under UIRoot overlay so ticket bar/fill layering cannot occlude the glyphs.
            const leftParent = chevronOverlayParent;
            const rightParent = chevronOverlayParent;
            const leftX = getBleedChevronAbsX(true, chevronIndex);
            const rightX = getBleedChevronAbsX(false, chevronIndex);
            const leftY = CONQUEST_TICKETS_BLEED_ABS_Y;
            const rightY = CONQUEST_TICKETS_BLEED_ABS_Y;
            const leftChevron = leftBleedChevrons[chevronIndex];
            if (leftChevron) {
                mod.SetUIWidgetParent(leftChevron, leftParent);
                mod.SetUIWidgetPosition(
                    leftChevron,
                    mod.CreateVector(leftX, leftY, 0)
                );
                mod.SetUIWidgetSize(
                    leftChevron,
                    mod.CreateVector(CONQUEST_HUD_TICKET_BLEED_CHEVRON_WIDTH, CONQUEST_HUD_TICKET_BLEED_CHEVRON_HEIGHT, 0)
                );
            }
            const rightChevron = rightBleedChevrons[chevronIndex];
            if (rightChevron) {
                mod.SetUIWidgetParent(rightChevron, rightParent);
                mod.SetUIWidgetPosition(
                    rightChevron,
                    mod.CreateVector(rightX, rightY, 0)
                );
                mod.SetUIWidgetSize(
                    rightChevron,
                    mod.CreateVector(CONQUEST_HUD_TICKET_BLEED_CHEVRON_WIDTH, CONQUEST_HUD_TICKET_BLEED_CHEVRON_HEIGHT, 0)
                );
            }
            const setBleedShadowLocalLayout = (name: string, x: number, y: number, parent: mod.UIWidget): void => {
                const shadow = safeFind(name);
                if (!shadow) return;
                mod.SetUIWidgetParent(shadow, parent);
                mod.SetUIWidgetPosition(shadow, mod.CreateVector(x, y, 0));
                mod.SetUIWidgetSize(
                    shadow,
                    mod.CreateVector(CONQUEST_HUD_TICKET_BLEED_CHEVRON_WIDTH, CONQUEST_HUD_TICKET_BLEED_CHEVRON_HEIGHT, 0)
                );
            };
            const slot = chevronIndex + 1;
            const d = CONQUEST_HUD_TICKET_BLEED_CHEVRON_SHADOW_OFFSET;
            const dUp = d * 0.5;
            setBleedShadowLocalLayout(`ConquestTicketsHudBleedChevronLeft${slot}ShadowRight_${pid}`, leftX + d, leftY, leftParent);
            setBleedShadowLocalLayout(`ConquestTicketsHudBleedChevronLeft${slot}ShadowLeft_${pid}`, leftX - d, leftY, leftParent);
            setBleedShadowLocalLayout(`ConquestTicketsHudBleedChevronLeft${slot}ShadowUp_${pid}`, leftX, leftY - dUp, leftParent);
            setBleedShadowLocalLayout(`ConquestTicketsHudBleedChevronLeft${slot}ShadowDown_${pid}`, leftX, leftY + d, leftParent);
            setBleedShadowLocalLayout(`ConquestTicketsHudBleedChevronLeft${slot}ShadowUpLeft_${pid}`, leftX - d, leftY - dUp, leftParent);
            setBleedShadowLocalLayout(`ConquestTicketsHudBleedChevronLeft${slot}ShadowUpRight_${pid}`, leftX + d, leftY - dUp, leftParent);
            setBleedShadowLocalLayout(`ConquestTicketsHudBleedChevronLeft${slot}ShadowDownRight_${pid}`, leftX + d, leftY + d, leftParent);
            setBleedShadowLocalLayout(`ConquestTicketsHudBleedChevronLeft${slot}ShadowDownLeft_${pid}`, leftX - d, leftY + d, leftParent);
            setBleedShadowLocalLayout(`ConquestTicketsHudBleedChevronRight${slot}ShadowRight_${pid}`, rightX + d, rightY, rightParent);
            setBleedShadowLocalLayout(`ConquestTicketsHudBleedChevronRight${slot}ShadowLeft_${pid}`, rightX - d, rightY, rightParent);
            setBleedShadowLocalLayout(`ConquestTicketsHudBleedChevronRight${slot}ShadowUp_${pid}`, rightX, rightY - dUp, rightParent);
            setBleedShadowLocalLayout(`ConquestTicketsHudBleedChevronRight${slot}ShadowDown_${pid}`, rightX, rightY + d, rightParent);
            setBleedShadowLocalLayout(`ConquestTicketsHudBleedChevronRight${slot}ShadowUpLeft_${pid}`, rightX - d, rightY - dUp, rightParent);
            setBleedShadowLocalLayout(`ConquestTicketsHudBleedChevronRight${slot}ShadowUpRight_${pid}`, rightX + d, rightY - dUp, rightParent);
            setBleedShadowLocalLayout(`ConquestTicketsHudBleedChevronRight${slot}ShadowDownRight_${pid}`, rightX + d, rightY + d, rightParent);
            setBleedShadowLocalLayout(`ConquestTicketsHudBleedChevronRight${slot}ShadowDownLeft_${pid}`, rightX - d, rightY + d, rightParent);
            // Re-attach core chevrons after shadows so the colored glyph sits above the black drop-shadow ring.
            if (leftChevron) {
                mod.SetUIWidgetParent(leftChevron, leftParent);
                mod.SetUIWidgetPosition(leftChevron, mod.CreateVector(leftX, leftY, 0));
                mod.SetUIWidgetSize(
                    leftChevron,
                    mod.CreateVector(CONQUEST_HUD_TICKET_BLEED_CHEVRON_WIDTH, CONQUEST_HUD_TICKET_BLEED_CHEVRON_HEIGHT, 0)
                );
            }
            if (rightChevron) {
                mod.SetUIWidgetParent(rightChevron, rightParent);
                mod.SetUIWidgetPosition(rightChevron, mod.CreateVector(rightX, rightY, 0));
                mod.SetUIWidgetSize(
                    rightChevron,
                    mod.CreateVector(CONQUEST_HUD_TICKET_BLEED_CHEVRON_WIDTH, CONQUEST_HUD_TICKET_BLEED_CHEVRON_HEIGHT, 0)
                );
            }
        }
    }
    safeSetUIWidgetDepth(refs.conquestTicketsDebugRoot, mod.UIDepth.AboveGameUI);
    safeSetUIWidgetDepth(refs.conquestTicketsDebugLeftBarTrack, mod.UIDepth.AboveGameUI);
    safeSetUIWidgetDepth(refs.conquestTicketsDebugLeftBarFill, mod.UIDepth.AboveGameUI);
    safeSetUIWidgetDepth(refs.conquestTicketsDebugRightBarTrack, mod.UIDepth.AboveGameUI);
    safeSetUIWidgetDepth(refs.conquestTicketsDebugRightBarFill, mod.UIDepth.AboveGameUI);
    safeSetUIWidgetDepth(refs.conquestTicketsTeam1Container, mod.UIDepth.AboveGameUI);
    safeSetUIWidgetDepth(refs.conquestTicketsTeam2Container, mod.UIDepth.AboveGameUI);
    safeSetUIWidgetDepth(refs.conquestTicketsDebugTeam1Shadow, mod.UIDepth.AboveGameUI);
    safeSetUIWidgetDepth(refs.conquestTicketsDebugTeam1, mod.UIDepth.AboveGameUI);
    safeSetUIWidgetDepth(conquestTicketsSlash, mod.UIDepth.AboveGameUI);
    safeSetUIWidgetDepth(refs.conquestTicketsDebugTeam2Shadow, mod.UIDepth.AboveGameUI);
    safeSetUIWidgetDepth(refs.conquestTicketsDebugTeam2, mod.UIDepth.AboveGameUI);
    safeSetUIWidgetDepth(refs.conquestTicketsLeadLeftBorder, mod.UIDepth.AboveGameUI);
    safeSetUIWidgetDepth(refs.conquestTicketsLeadRightBorder, mod.UIDepth.AboveGameUI);
    safeSetUIWidgetDepth(refs.conquestTicketsLeadLeftCrownShadow, mod.UIDepth.AboveGameUI);
    safeSetUIWidgetDepth(refs.conquestTicketsLeadRightCrownShadow, mod.UIDepth.AboveGameUI);
    safeSetUIWidgetDepth(refs.conquestTicketsLeadLeftCrown, mod.UIDepth.AboveGameUI);
    safeSetUIWidgetDepth(refs.conquestTicketsLeadRightCrown, mod.UIDepth.AboveGameUI);
    const leftBleedChevrons = refs.conquestTicketsBleedLeftChevrons ?? [];
    const rightBleedChevrons = refs.conquestTicketsBleedRightChevrons ?? [];
    for (let chevronIndex = 0; chevronIndex < CONQUEST_HUD_TICKET_BLEED_CHEVRON_COUNT; chevronIndex++) {
        safeSetUIWidgetDepth(leftBleedChevrons[chevronIndex], mod.UIDepth.AboveGameUI);
        safeSetUIWidgetDepth(rightBleedChevrons[chevronIndex], mod.UIDepth.AboveGameUI);
        const slot = chevronIndex + 1;
        safeSetUIWidgetDepth(safeFind(`ConquestTicketsHudBleedChevronLeft${slot}ShadowRight_${pid}`), mod.UIDepth.AboveGameUI);
        safeSetUIWidgetDepth(safeFind(`ConquestTicketsHudBleedChevronLeft${slot}ShadowLeft_${pid}`), mod.UIDepth.AboveGameUI);
        safeSetUIWidgetDepth(safeFind(`ConquestTicketsHudBleedChevronLeft${slot}ShadowUp_${pid}`), mod.UIDepth.AboveGameUI);
        safeSetUIWidgetDepth(safeFind(`ConquestTicketsHudBleedChevronLeft${slot}ShadowDown_${pid}`), mod.UIDepth.AboveGameUI);
        safeSetUIWidgetDepth(safeFind(`ConquestTicketsHudBleedChevronLeft${slot}ShadowUpLeft_${pid}`), mod.UIDepth.AboveGameUI);
        safeSetUIWidgetDepth(safeFind(`ConquestTicketsHudBleedChevronLeft${slot}ShadowUpRight_${pid}`), mod.UIDepth.AboveGameUI);
        safeSetUIWidgetDepth(safeFind(`ConquestTicketsHudBleedChevronLeft${slot}ShadowDownRight_${pid}`), mod.UIDepth.AboveGameUI);
        safeSetUIWidgetDepth(safeFind(`ConquestTicketsHudBleedChevronLeft${slot}ShadowDownLeft_${pid}`), mod.UIDepth.AboveGameUI);
        safeSetUIWidgetDepth(safeFind(`ConquestTicketsHudBleedChevronRight${slot}ShadowRight_${pid}`), mod.UIDepth.AboveGameUI);
        safeSetUIWidgetDepth(safeFind(`ConquestTicketsHudBleedChevronRight${slot}ShadowLeft_${pid}`), mod.UIDepth.AboveGameUI);
        safeSetUIWidgetDepth(safeFind(`ConquestTicketsHudBleedChevronRight${slot}ShadowUp_${pid}`), mod.UIDepth.AboveGameUI);
        safeSetUIWidgetDepth(safeFind(`ConquestTicketsHudBleedChevronRight${slot}ShadowDown_${pid}`), mod.UIDepth.AboveGameUI);
        safeSetUIWidgetDepth(safeFind(`ConquestTicketsHudBleedChevronRight${slot}ShadowUpLeft_${pid}`), mod.UIDepth.AboveGameUI);
        safeSetUIWidgetDepth(safeFind(`ConquestTicketsHudBleedChevronRight${slot}ShadowUpRight_${pid}`), mod.UIDepth.AboveGameUI);
        safeSetUIWidgetDepth(safeFind(`ConquestTicketsHudBleedChevronRight${slot}ShadowDownRight_${pid}`), mod.UIDepth.AboveGameUI);
        safeSetUIWidgetDepth(safeFind(`ConquestTicketsHudBleedChevronRight${slot}ShadowDownLeft_${pid}`), mod.UIDepth.AboveGameUI);
    }
    safeSetUIWidgetVisible(refs.conquestTicketsDebugLeftBarTrack, true);
    safeSetUIWidgetVisible(refs.conquestTicketsDebugLeftBarFill, true);
    safeSetUIWidgetVisible(refs.conquestTicketsDebugRightBarTrack, true);
    safeSetUIWidgetVisible(refs.conquestTicketsDebugRightBarFill, true);
    safeSetUIWidgetVisible(refs.conquestTicketsLeadLeftBorder, false);
    safeSetUIWidgetVisible(refs.conquestTicketsLeadRightBorder, false);
    safeSetUIWidgetVisible(refs.conquestTicketsLeadLeftCrownShadow, false);
    safeSetUIWidgetVisible(refs.conquestTicketsLeadRightCrownShadow, false);
    safeSetUIWidgetVisible(refs.conquestTicketsLeadLeftCrown, false);
    safeSetUIWidgetVisible(refs.conquestTicketsLeadRightCrown, false);
    for (let chevronIndex = 0; chevronIndex < CONQUEST_HUD_TICKET_BLEED_CHEVRON_COUNT; chevronIndex++) {
        safeSetUIWidgetVisible(leftBleedChevrons[chevronIndex], false);
        safeSetUIWidgetVisible(rightBleedChevrons[chevronIndex], false);
        const slot = chevronIndex + 1;
        safeSetUIWidgetVisible(safeFind(`ConquestTicketsHudBleedChevronLeft${slot}ShadowRight_${pid}`), false);
        safeSetUIWidgetVisible(safeFind(`ConquestTicketsHudBleedChevronLeft${slot}ShadowLeft_${pid}`), false);
        safeSetUIWidgetVisible(safeFind(`ConquestTicketsHudBleedChevronLeft${slot}ShadowUp_${pid}`), false);
        safeSetUIWidgetVisible(safeFind(`ConquestTicketsHudBleedChevronLeft${slot}ShadowDown_${pid}`), false);
        safeSetUIWidgetVisible(safeFind(`ConquestTicketsHudBleedChevronLeft${slot}ShadowUpLeft_${pid}`), false);
        safeSetUIWidgetVisible(safeFind(`ConquestTicketsHudBleedChevronLeft${slot}ShadowUpRight_${pid}`), false);
        safeSetUIWidgetVisible(safeFind(`ConquestTicketsHudBleedChevronLeft${slot}ShadowDownRight_${pid}`), false);
        safeSetUIWidgetVisible(safeFind(`ConquestTicketsHudBleedChevronLeft${slot}ShadowDownLeft_${pid}`), false);
        safeSetUIWidgetVisible(safeFind(`ConquestTicketsHudBleedChevronRight${slot}ShadowRight_${pid}`), false);
        safeSetUIWidgetVisible(safeFind(`ConquestTicketsHudBleedChevronRight${slot}ShadowLeft_${pid}`), false);
        safeSetUIWidgetVisible(safeFind(`ConquestTicketsHudBleedChevronRight${slot}ShadowUp_${pid}`), false);
        safeSetUIWidgetVisible(safeFind(`ConquestTicketsHudBleedChevronRight${slot}ShadowDown_${pid}`), false);
        safeSetUIWidgetVisible(safeFind(`ConquestTicketsHudBleedChevronRight${slot}ShadowUpLeft_${pid}`), false);
        safeSetUIWidgetVisible(safeFind(`ConquestTicketsHudBleedChevronRight${slot}ShadowUpRight_${pid}`), false);
        safeSetUIWidgetVisible(safeFind(`ConquestTicketsHudBleedChevronRight${slot}ShadowDownRight_${pid}`), false);
        safeSetUIWidgetVisible(safeFind(`ConquestTicketsHudBleedChevronRight${slot}ShadowDownLeft_${pid}`), false);
    }
    safeSetUIWidgetVisible(conquestTicketsSlash, false);

    {
        // Per-flag slot row: boxed letter indicators with in-box progress fill.
        const flagChildren: any[] = [];
        for (let i = 0; i < CONQUEST_FLAGS_MAX_ROWS; i++) {
            const slotX = CONQUEST_FLAGS_SLOT_X[i] ?? (i * 35.0);
            flagChildren.push({
                name: `ConquestFlagHudSlot_${pid}_${i}`,
                type: "Container",
                position: [slotX, 0],
                size: [CONQUEST_HUD_FLAG_SLOT_WIDTH, CONQUEST_HUD_FLAG_SLOT_HEIGHT],
                anchor: mod.UIAnchor.TopLeft,
                visible: false,
                padding: 0,
                bgColor: [
                    CONQUEST_HUD_FLAG_SLOT_TRACK_RGB[0],
                    CONQUEST_HUD_FLAG_SLOT_TRACK_RGB[1],
                    CONQUEST_HUD_FLAG_SLOT_TRACK_RGB[2],
                ],
                bgAlpha: 0.9,
                // Neutral slot background stays visible at all times.
                bgFill: mod.UIBgFill.Solid,
                children: [
                    {
                        name: `ConquestFlagHudFill_${pid}_${i}`,
                        type: "Container",
                        position: [CONQUEST_HUD_FLAG_FILL_INSET_X, CONQUEST_HUD_FLAG_FILL_INSET_Y],
                        size: [CONQUEST_HUD_FLAG_FILL_MAX_WIDTH, CONQUEST_HUD_FLAG_FILL_MAX_HEIGHT],
                        anchor: mod.UIAnchor.TopLeft,
                        visible: false,
                        padding: 0,
                        bgColor: [
                            CONQUEST_HUD_TEXT_FRIENDLY_RGB[0],
                            CONQUEST_HUD_TEXT_FRIENDLY_RGB[1],
                            CONQUEST_HUD_TEXT_FRIENDLY_RGB[2],
                        ],
                        bgAlpha: 0.95,
                        bgFill: mod.UIBgFill.Solid,
                    },
                    {
                        name: `ConquestFlagHudBorder_${pid}_${i}`,
                        type: "Container",
                        position: [0, 0],
                        size: [CONQUEST_HUD_FLAG_SLOT_WIDTH, CONQUEST_HUD_FLAG_SLOT_HEIGHT],
                        anchor: mod.UIAnchor.TopLeft,
                        visible: false,
                        padding: 0,
                        bgColor: [
                            CONQUEST_HUD_TEXT_FRIENDLY_RGB[0],
                            CONQUEST_HUD_TEXT_FRIENDLY_RGB[1],
                            CONQUEST_HUD_TEXT_FRIENDLY_RGB[2],
                        ],
                        bgAlpha: 1,
                        bgFill: mod.UIBgFill.OutlineThin,
                    },
                    {
                        name: `ConquestFlagHudLabelShadowRight_${pid}_${i}`,
                        type: "Text",
                        position: [CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_X + CONQUEST_HUD_FLAG_LABEL_SHADOW_OFFSET, CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_Y],
                        size: [CONQUEST_HUD_FLAG_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_LABEL_WIDGET_HEIGHT],
                        anchor: mod.UIAnchor.TopLeft,
                        visible: true,
                        padding: 0,
                        bgAlpha: 0,
                        bgFill: mod.UIBgFill.None,
                        textLabel: mod.Message(STR_HUD_CONQUEST_FLAG_LETTER_UNKNOWN),
                        textColor: [0, 0, 0],
                        textAlpha: 1,
                        textSize: CONQUEST_HUD_FLAG_LABEL_SHADOW_TEXT_SIZE,
                        textAnchor: mod.UIAnchor.Center,
                    },
                    {
                        name: `ConquestFlagHudLabelShadowLeft_${pid}_${i}`,
                        type: "Text",
                        position: [CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_X - CONQUEST_HUD_FLAG_LABEL_SHADOW_OFFSET, CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_Y],
                        size: [CONQUEST_HUD_FLAG_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_LABEL_WIDGET_HEIGHT],
                        anchor: mod.UIAnchor.TopLeft,
                        visible: true,
                        padding: 0,
                        bgAlpha: 0,
                        bgFill: mod.UIBgFill.None,
                        textLabel: mod.Message(STR_HUD_CONQUEST_FLAG_LETTER_UNKNOWN),
                        textColor: [0, 0, 0],
                        textAlpha: 1,
                        textSize: CONQUEST_HUD_FLAG_LABEL_SHADOW_TEXT_SIZE,
                        textAnchor: mod.UIAnchor.Center,
                    },
                    {
                        name: `ConquestFlagHudLabelShadowUp_${pid}_${i}`,
                        type: "Text",
                        position: [CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_X, CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_Y - CONQUEST_HUD_FLAG_LABEL_SHADOW_OFFSET],
                        size: [CONQUEST_HUD_FLAG_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_LABEL_WIDGET_HEIGHT],
                        anchor: mod.UIAnchor.TopLeft,
                        visible: true,
                        padding: 0,
                        bgAlpha: 0,
                        bgFill: mod.UIBgFill.None,
                        textLabel: mod.Message(STR_HUD_CONQUEST_FLAG_LETTER_UNKNOWN),
                        textColor: [0, 0, 0],
                        textAlpha: 1,
                        textSize: CONQUEST_HUD_FLAG_LABEL_SHADOW_TEXT_SIZE,
                        textAnchor: mod.UIAnchor.Center,
                    },
                    {
                        name: `ConquestFlagHudLabelShadowDown_${pid}_${i}`,
                        type: "Text",
                        position: [CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_X, CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_Y + CONQUEST_HUD_FLAG_LABEL_SHADOW_OFFSET],
                        size: [CONQUEST_HUD_FLAG_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_LABEL_WIDGET_HEIGHT],
                        anchor: mod.UIAnchor.TopLeft,
                        visible: true,
                        padding: 0,
                        bgAlpha: 0,
                        bgFill: mod.UIBgFill.None,
                        textLabel: mod.Message(STR_HUD_CONQUEST_FLAG_LETTER_UNKNOWN),
                        textColor: [0, 0, 0],
                        textAlpha: 1,
                        textSize: CONQUEST_HUD_FLAG_LABEL_SHADOW_TEXT_SIZE,
                        textAnchor: mod.UIAnchor.Center,
                    },
                    {
                        name: `ConquestFlagHudLabelShadowUpLeft_${pid}_${i}`,
                        type: "Text",
                        position: [CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_X - CONQUEST_HUD_FLAG_LABEL_SHADOW_OFFSET, CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_Y - CONQUEST_HUD_FLAG_LABEL_SHADOW_OFFSET],
                        size: [CONQUEST_HUD_FLAG_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_LABEL_WIDGET_HEIGHT],
                        anchor: mod.UIAnchor.TopLeft,
                        visible: true,
                        padding: 0,
                        bgAlpha: 0,
                        bgFill: mod.UIBgFill.None,
                        textLabel: mod.Message(STR_HUD_CONQUEST_FLAG_LETTER_UNKNOWN),
                        textColor: [0, 0, 0],
                        textAlpha: 1,
                        textSize: CONQUEST_HUD_FLAG_LABEL_SHADOW_TEXT_SIZE,
                        textAnchor: mod.UIAnchor.Center,
                    },
                    {
                        name: `ConquestFlagHudLabelShadowUpRight_${pid}_${i}`,
                        type: "Text",
                        position: [CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_X + CONQUEST_HUD_FLAG_LABEL_SHADOW_OFFSET, CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_Y - CONQUEST_HUD_FLAG_LABEL_SHADOW_OFFSET],
                        size: [CONQUEST_HUD_FLAG_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_LABEL_WIDGET_HEIGHT],
                        anchor: mod.UIAnchor.TopLeft,
                        visible: true,
                        padding: 0,
                        bgAlpha: 0,
                        bgFill: mod.UIBgFill.None,
                        textLabel: mod.Message(STR_HUD_CONQUEST_FLAG_LETTER_UNKNOWN),
                        textColor: [0, 0, 0],
                        textAlpha: 1,
                        textSize: CONQUEST_HUD_FLAG_LABEL_SHADOW_TEXT_SIZE,
                        textAnchor: mod.UIAnchor.Center,
                    },
                    {
                        name: `ConquestFlagHudLabelShadowDownRight_${pid}_${i}`,
                        type: "Text",
                        position: [CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_X + CONQUEST_HUD_FLAG_LABEL_SHADOW_OFFSET, CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_Y + CONQUEST_HUD_FLAG_LABEL_SHADOW_OFFSET],
                        size: [CONQUEST_HUD_FLAG_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_LABEL_WIDGET_HEIGHT],
                        anchor: mod.UIAnchor.TopLeft,
                        visible: true,
                        padding: 0,
                        bgAlpha: 0,
                        bgFill: mod.UIBgFill.None,
                        textLabel: mod.Message(STR_HUD_CONQUEST_FLAG_LETTER_UNKNOWN),
                        textColor: [0, 0, 0],
                        textAlpha: 1,
                        textSize: CONQUEST_HUD_FLAG_LABEL_SHADOW_TEXT_SIZE,
                        textAnchor: mod.UIAnchor.Center,
                    },
                    {
                        name: `ConquestFlagHudLabelShadowDownLeft_${pid}_${i}`,
                        type: "Text",
                        position: [CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_X - CONQUEST_HUD_FLAG_LABEL_SHADOW_OFFSET, CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_Y + CONQUEST_HUD_FLAG_LABEL_SHADOW_OFFSET],
                        size: [CONQUEST_HUD_FLAG_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_LABEL_WIDGET_HEIGHT],
                        anchor: mod.UIAnchor.TopLeft,
                        visible: true,
                        padding: 0,
                        bgAlpha: 0,
                        bgFill: mod.UIBgFill.None,
                        textLabel: mod.Message(STR_HUD_CONQUEST_FLAG_LETTER_UNKNOWN),
                        textColor: [0, 0, 0],
                        textAlpha: 1,
                        textSize: CONQUEST_HUD_FLAG_LABEL_SHADOW_TEXT_SIZE,
                        textAnchor: mod.UIAnchor.Center,
                    },
                    {
                        name: `ConquestFlagHudLabelShadowInner_${pid}_${i}`,
                        type: "Text",
                        position: [CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_X, CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_Y],
                        size: [CONQUEST_HUD_FLAG_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_LABEL_WIDGET_HEIGHT],
                        anchor: mod.UIAnchor.TopLeft,
                        visible: false,
                        padding: 0,
                        bgAlpha: 0,
                        bgFill: mod.UIBgFill.None,
                        textLabel: mod.Message(STR_HUD_CONQUEST_FLAG_LETTER_UNKNOWN),
                        textColor: [0, 0, 0],
                        textAlpha: 1,
                        textSize: CONQUEST_HUD_FLAG_LABEL_SHADOW_INNER_TEXT_SIZE,
                        textAnchor: mod.UIAnchor.Center,
                    },
                    {
                        name: `ConquestFlagHudLabelShadowInnerDeep_${pid}_${i}`,
                        type: "Text",
                        position: [CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_X, CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_Y],
                        size: [CONQUEST_HUD_FLAG_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_LABEL_WIDGET_HEIGHT],
                        anchor: mod.UIAnchor.TopLeft,
                        visible: false,
                        padding: 0,
                        bgAlpha: 0,
                        bgFill: mod.UIBgFill.None,
                        textLabel: mod.Message(STR_HUD_CONQUEST_FLAG_LETTER_UNKNOWN),
                        textColor: [0, 0, 0],
                        textAlpha: 1,
                        textSize: CONQUEST_HUD_FLAG_LABEL_SHADOW_INNER_DEEP_TEXT_SIZE,
                        textAnchor: mod.UIAnchor.Center,
                    },
                    {
                        name: `ConquestFlagHudLabel_${pid}_${i}`,
                        type: "Text",
                        position: [CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_X, CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_Y],
                        size: [CONQUEST_HUD_FLAG_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_LABEL_WIDGET_HEIGHT],
                        anchor: mod.UIAnchor.TopLeft,
                        visible: true,
                        padding: 0,
                        bgAlpha: 0,
                        bgFill: mod.UIBgFill.None,
                        textLabel: mod.Message(STR_HUD_CONQUEST_FLAG_LETTER_UNKNOWN),
                        textColor: [
                            CONQUEST_HUD_TEXT_NEUTRAL_RGB[0],
                            CONQUEST_HUD_TEXT_NEUTRAL_RGB[1],
                            CONQUEST_HUD_TEXT_NEUTRAL_RGB[2],
                        ],
                        textAlpha: 1,
                        textSize: CONQUEST_HUD_FLAG_LABEL_TEXT_SIZE,
                        textAnchor: mod.UIAnchor.Center,
                    },
                ],
            });
            flagChildren.push({
                // Capture progress percentage row below each objective box.
                name: `ConquestFlagHudPercentRoot_${pid}_${i}`,
                type: "Container",
                position: [slotX + CONQUEST_HUD_FLAG_PERCENT_OFFSET_X, CONQUEST_HUD_FLAG_PERCENT_OFFSET_Y],
                size: [CONQUEST_HUD_FLAG_PERCENT_ROOT_WIDTH, CONQUEST_HUD_FLAG_PERCENT_ROOT_HEIGHT],
                anchor: mod.UIAnchor.TopLeft,
                visible: false,
                padding: 0,
                bgColor: [
                    CONQUEST_TICKETS_BG_RGB[0],
                    CONQUEST_TICKETS_BG_RGB[1],
                    CONQUEST_TICKETS_BG_RGB[2],
                ],
                bgAlpha: CONQUEST_TICKETS_BG_ALPHA,
                bgFill: mod.UIBgFill.Blur,
                children: [
                    {
                        name: `ConquestFlagHudPercentShadowRight_${pid}_${i}`,
                        type: "Text",
                        position: [CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_X + CONQUEST_HUD_FLAG_PERCENT_SHADOW_OFFSET, CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_Y],
                        size: [CONQUEST_HUD_FLAG_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_PERCENT_WIDGET_HEIGHT],
                        anchor: mod.UIAnchor.TopLeft,
                        visible: false,
                        padding: 0,
                        bgAlpha: 0,
                        bgFill: mod.UIBgFill.None,
                        textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                        textColor: [0, 0, 0],
                        textAlpha: 1,
                        textSize: CONQUEST_HUD_FLAG_PERCENT_SHADOW_TEXT_SIZE,
                        textAnchor: mod.UIAnchor.Center,
                    },
                    {
                        name: `ConquestFlagHudPercentShadowLeft_${pid}_${i}`,
                        type: "Text",
                        position: [CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_X - CONQUEST_HUD_FLAG_PERCENT_SHADOW_OFFSET, CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_Y],
                        size: [CONQUEST_HUD_FLAG_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_PERCENT_WIDGET_HEIGHT],
                        anchor: mod.UIAnchor.TopLeft,
                        visible: false,
                        padding: 0,
                        bgAlpha: 0,
                        bgFill: mod.UIBgFill.None,
                        textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                        textColor: [0, 0, 0],
                        textAlpha: 1,
                        textSize: CONQUEST_HUD_FLAG_PERCENT_SHADOW_TEXT_SIZE,
                        textAnchor: mod.UIAnchor.Center,
                    },
                    {
                        name: `ConquestFlagHudPercentShadowUp_${pid}_${i}`,
                        type: "Text",
                        position: [CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_X, CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_Y - CONQUEST_HUD_FLAG_PERCENT_SHADOW_OFFSET],
                        size: [CONQUEST_HUD_FLAG_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_PERCENT_WIDGET_HEIGHT],
                        anchor: mod.UIAnchor.TopLeft,
                        visible: false,
                        padding: 0,
                        bgAlpha: 0,
                        bgFill: mod.UIBgFill.None,
                        textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                        textColor: [0, 0, 0],
                        textAlpha: 1,
                        textSize: CONQUEST_HUD_FLAG_PERCENT_SHADOW_TEXT_SIZE,
                        textAnchor: mod.UIAnchor.Center,
                    },
                    {
                        name: `ConquestFlagHudPercentShadowDown_${pid}_${i}`,
                        type: "Text",
                        position: [CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_X, CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_Y + CONQUEST_HUD_FLAG_PERCENT_SHADOW_OFFSET],
                        size: [CONQUEST_HUD_FLAG_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_PERCENT_WIDGET_HEIGHT],
                        anchor: mod.UIAnchor.TopLeft,
                        visible: false,
                        padding: 0,
                        bgAlpha: 0,
                        bgFill: mod.UIBgFill.None,
                        textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                        textColor: [0, 0, 0],
                        textAlpha: 1,
                        textSize: CONQUEST_HUD_FLAG_PERCENT_SHADOW_TEXT_SIZE,
                        textAnchor: mod.UIAnchor.Center,
                    },
                    {
                        name: `ConquestFlagHudPercentShadowUpLeft_${pid}_${i}`,
                        type: "Text",
                        position: [CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_X - CONQUEST_HUD_FLAG_PERCENT_SHADOW_OFFSET, CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_Y - CONQUEST_HUD_FLAG_PERCENT_SHADOW_OFFSET],
                        size: [CONQUEST_HUD_FLAG_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_PERCENT_WIDGET_HEIGHT],
                        anchor: mod.UIAnchor.TopLeft,
                        visible: false,
                        padding: 0,
                        bgAlpha: 0,
                        bgFill: mod.UIBgFill.None,
                        textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                        textColor: [0, 0, 0],
                        textAlpha: 1,
                        textSize: CONQUEST_HUD_FLAG_PERCENT_SHADOW_TEXT_SIZE,
                        textAnchor: mod.UIAnchor.Center,
                    },
                    {
                        name: `ConquestFlagHudPercentShadowUpRight_${pid}_${i}`,
                        type: "Text",
                        position: [CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_X + CONQUEST_HUD_FLAG_PERCENT_SHADOW_OFFSET, CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_Y - CONQUEST_HUD_FLAG_PERCENT_SHADOW_OFFSET],
                        size: [CONQUEST_HUD_FLAG_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_PERCENT_WIDGET_HEIGHT],
                        anchor: mod.UIAnchor.TopLeft,
                        visible: false,
                        padding: 0,
                        bgAlpha: 0,
                        bgFill: mod.UIBgFill.None,
                        textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                        textColor: [0, 0, 0],
                        textAlpha: 1,
                        textSize: CONQUEST_HUD_FLAG_PERCENT_SHADOW_TEXT_SIZE,
                        textAnchor: mod.UIAnchor.Center,
                    },
                    {
                        name: `ConquestFlagHudPercentShadowDownRight_${pid}_${i}`,
                        type: "Text",
                        position: [CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_X + CONQUEST_HUD_FLAG_PERCENT_SHADOW_OFFSET, CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_Y + CONQUEST_HUD_FLAG_PERCENT_SHADOW_OFFSET],
                        size: [CONQUEST_HUD_FLAG_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_PERCENT_WIDGET_HEIGHT],
                        anchor: mod.UIAnchor.TopLeft,
                        visible: false,
                        padding: 0,
                        bgAlpha: 0,
                        bgFill: mod.UIBgFill.None,
                        textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                        textColor: [0, 0, 0],
                        textAlpha: 1,
                        textSize: CONQUEST_HUD_FLAG_PERCENT_SHADOW_TEXT_SIZE,
                        textAnchor: mod.UIAnchor.Center,
                    },
                    {
                        name: `ConquestFlagHudPercentShadowDownLeft_${pid}_${i}`,
                        type: "Text",
                        position: [CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_X - CONQUEST_HUD_FLAG_PERCENT_SHADOW_OFFSET, CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_Y + CONQUEST_HUD_FLAG_PERCENT_SHADOW_OFFSET],
                        size: [CONQUEST_HUD_FLAG_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_PERCENT_WIDGET_HEIGHT],
                        anchor: mod.UIAnchor.TopLeft,
                        visible: false,
                        padding: 0,
                        bgAlpha: 0,
                        bgFill: mod.UIBgFill.None,
                        textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                        textColor: [0, 0, 0],
                        textAlpha: 1,
                        textSize: CONQUEST_HUD_FLAG_PERCENT_SHADOW_TEXT_SIZE,
                        textAnchor: mod.UIAnchor.Center,
                    },
                    {
                        name: `ConquestFlagHudPercentShadowInner_${pid}_${i}`,
                        type: "Text",
                        position: [CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_X, CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_Y],
                        size: [CONQUEST_HUD_FLAG_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_PERCENT_WIDGET_HEIGHT],
                        anchor: mod.UIAnchor.TopLeft,
                        visible: false,
                        padding: 0,
                        bgAlpha: 0,
                        bgFill: mod.UIBgFill.None,
                        textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                        textColor: [0, 0, 0],
                        textAlpha: 1,
                        textSize: CONQUEST_HUD_FLAG_PERCENT_SHADOW_INNER_TEXT_SIZE,
                        textAnchor: mod.UIAnchor.Center,
                    },
                    {
                        name: `ConquestFlagHudPercentText_${pid}_${i}`,
                        type: "Text",
                        position: [CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_X, CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_Y],
                        size: [CONQUEST_HUD_FLAG_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_PERCENT_WIDGET_HEIGHT],
                        anchor: mod.UIAnchor.TopLeft,
                        visible: false,
                        padding: 0,
                        bgAlpha: 0,
                        bgFill: mod.UIBgFill.None,
                        textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                        textColor: [
                            CONQUEST_HUD_TEXT_NEUTRAL_RGB[0],
                            CONQUEST_HUD_TEXT_NEUTRAL_RGB[1],
                            CONQUEST_HUD_TEXT_NEUTRAL_RGB[2],
                        ],
                        textAlpha: 1,
                        textSize: CONQUEST_HUD_FLAG_PERCENT_TEXT_SIZE,
                        textAnchor: mod.UIAnchor.Center,
                    },
                ],
            });
        }
        // Active-objective pop-out panel:
        // - enlarged objective letter with in-box capture fill
        // - optional capture-progress percentage row
        flagChildren.push({
            name: `ConquestFlagHudActivePopoutRoot_${pid}`,
            type: "Container",
            position: [0, 0],
            size: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_ROOT_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_ROOT_HEIGHT],
            anchor: mod.UIAnchor.TopLeft,
            visible: false,
            padding: 0,
            bgAlpha: 0,
            bgFill: mod.UIBgFill.None,
            children: [
                {
                    name: `ConquestFlagHudActivePopoutSlot_${pid}`,
                    type: "Container",
                    position: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_SLOT_OFFSET_X, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_SLOT_OFFSET_Y],
                    size: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_SLOT_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_SLOT_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: false,
                    padding: 0,
                    bgColor: [
                        CONQUEST_HUD_FLAG_SLOT_TRACK_RGB[0],
                        CONQUEST_HUD_FLAG_SLOT_TRACK_RGB[1],
                        CONQUEST_HUD_FLAG_SLOT_TRACK_RGB[2],
                    ],
                    bgAlpha: 0.9,
                    bgFill: mod.UIBgFill.Solid,
                    children: [
                        {
                            name: `ConquestFlagHudActivePopoutFill_${pid}`,
                            type: "Container",
                            position: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_FILL_INSET_X, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_FILL_INSET_Y],
                            size: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_FILL_MAX_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_FILL_MAX_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: false,
                            padding: 0,
                            bgColor: [
                                CONQUEST_HUD_TEXT_FRIENDLY_RGB[0],
                                CONQUEST_HUD_TEXT_FRIENDLY_RGB[1],
                                CONQUEST_HUD_TEXT_FRIENDLY_RGB[2],
                            ],
                            bgAlpha: 0.95,
                            bgFill: mod.UIBgFill.Solid,
                        },
                        {
                            name: `ConquestFlagHudActivePopoutBorder_${pid}`,
                            type: "Container",
                            position: [0, 0],
                            size: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_SLOT_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_SLOT_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: false,
                            padding: 0,
                            bgColor: [
                                CONQUEST_HUD_TEXT_FRIENDLY_RGB[0],
                                CONQUEST_HUD_TEXT_FRIENDLY_RGB[1],
                                CONQUEST_HUD_TEXT_FRIENDLY_RGB[2],
                            ],
                            bgAlpha: 1,
                            bgFill: mod.UIBgFill.OutlineThin,
                        },
                        {
                            name: `ConquestFlagHudActivePopoutLabelShadowRight_${pid}`,
                            type: "Text",
                            position: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_OFFSET_X + CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_OFFSET_Y],
                            size: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: false,
                            padding: 0,
                            bgAlpha: 0,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.Message(STR_HUD_CONQUEST_FLAG_LETTER_UNKNOWN),
                            textColor: [0, 0, 0],
                            textAlpha: 1,
                            textSize: CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_TEXT_SIZE,
                            textAnchor: mod.UIAnchor.Center,
                        },
                        {
                            name: `ConquestFlagHudActivePopoutLabelShadowLeft_${pid}`,
                            type: "Text",
                            position: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_OFFSET_X - CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_OFFSET_Y],
                            size: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: false,
                            padding: 0,
                            bgAlpha: 0,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.Message(STR_HUD_CONQUEST_FLAG_LETTER_UNKNOWN),
                            textColor: [0, 0, 0],
                            textAlpha: 1,
                            textSize: CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_TEXT_SIZE,
                            textAnchor: mod.UIAnchor.Center,
                        },
                        {
                            name: `ConquestFlagHudActivePopoutLabelShadowUp_${pid}`,
                            type: "Text",
                            position: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_OFFSET_X, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_OFFSET_Y - CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET],
                            size: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: false,
                            padding: 0,
                            bgAlpha: 0,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.Message(STR_HUD_CONQUEST_FLAG_LETTER_UNKNOWN),
                            textColor: [0, 0, 0],
                            textAlpha: 1,
                            textSize: CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_TEXT_SIZE,
                            textAnchor: mod.UIAnchor.Center,
                        },
                        {
                            name: `ConquestFlagHudActivePopoutLabelShadowDown_${pid}`,
                            type: "Text",
                            position: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_OFFSET_X, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_OFFSET_Y + CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET],
                            size: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: false,
                            padding: 0,
                            bgAlpha: 0,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.Message(STR_HUD_CONQUEST_FLAG_LETTER_UNKNOWN),
                            textColor: [0, 0, 0],
                            textAlpha: 1,
                            textSize: CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_TEXT_SIZE,
                            textAnchor: mod.UIAnchor.Center,
                        },
                        {
                            name: `ConquestFlagHudActivePopoutLabelShadowUpLeft_${pid}`,
                            type: "Text",
                            position: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_OFFSET_X - CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_OFFSET_Y - CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET],
                            size: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: false,
                            padding: 0,
                            bgAlpha: 0,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.Message(STR_HUD_CONQUEST_FLAG_LETTER_UNKNOWN),
                            textColor: [0, 0, 0],
                            textAlpha: 1,
                            textSize: CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_TEXT_SIZE,
                            textAnchor: mod.UIAnchor.Center,
                        },
                        {
                            name: `ConquestFlagHudActivePopoutLabelShadowUpRight_${pid}`,
                            type: "Text",
                            position: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_OFFSET_X + CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_OFFSET_Y - CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET],
                            size: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: false,
                            padding: 0,
                            bgAlpha: 0,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.Message(STR_HUD_CONQUEST_FLAG_LETTER_UNKNOWN),
                            textColor: [0, 0, 0],
                            textAlpha: 1,
                            textSize: CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_TEXT_SIZE,
                            textAnchor: mod.UIAnchor.Center,
                        },
                        {
                            name: `ConquestFlagHudActivePopoutLabelShadowDownRight_${pid}`,
                            type: "Text",
                            position: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_OFFSET_X + CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_OFFSET_Y + CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET],
                            size: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: false,
                            padding: 0,
                            bgAlpha: 0,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.Message(STR_HUD_CONQUEST_FLAG_LETTER_UNKNOWN),
                            textColor: [0, 0, 0],
                            textAlpha: 1,
                            textSize: CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_TEXT_SIZE,
                            textAnchor: mod.UIAnchor.Center,
                        },
                        {
                            name: `ConquestFlagHudActivePopoutLabelShadowDownLeft_${pid}`,
                            type: "Text",
                            position: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_OFFSET_X - CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_OFFSET_Y + CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET],
                            size: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: false,
                            padding: 0,
                            bgAlpha: 0,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.Message(STR_HUD_CONQUEST_FLAG_LETTER_UNKNOWN),
                            textColor: [0, 0, 0],
                            textAlpha: 1,
                            textSize: CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_TEXT_SIZE,
                            textAnchor: mod.UIAnchor.Center,
                        },
                        {
                            name: `ConquestFlagHudActivePopoutLabel_${pid}`,
                            type: "Text",
                            position: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_OFFSET_X, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_OFFSET_Y],
                            size: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: false,
                            padding: 0,
                            bgAlpha: 0,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.Message(STR_HUD_CONQUEST_FLAG_LETTER_UNKNOWN),
                            textColor: [
                                CONQUEST_HUD_TEXT_NEUTRAL_RGB[0],
                                CONQUEST_HUD_TEXT_NEUTRAL_RGB[1],
                                CONQUEST_HUD_TEXT_NEUTRAL_RGB[2],
                            ],
                            textAlpha: 1,
                            textSize: CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_TEXT_SIZE,
                            textAnchor: mod.UIAnchor.Center,
                        },
                    ],
                },
                {
                    name: `ConquestFlagHudActivePopoutPercentRoot_${pid}`,
                    type: "Container",
                    position: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_OFFSET_X, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_OFFSET_Y],
                    size: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_ROOT_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_ROOT_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: false,
                    padding: 0,
                    bgColor: [
                        CONQUEST_TICKETS_BG_RGB[0],
                        CONQUEST_TICKETS_BG_RGB[1],
                        CONQUEST_TICKETS_BG_RGB[2],
                    ],
                    bgAlpha: CONQUEST_TICKETS_BG_ALPHA,
                    bgFill: mod.UIBgFill.Blur,
                    children: [
                        {
                            name: `ConquestFlagHudActivePopoutPercentShadowRight_${pid}`,
                            type: "Text",
                            position: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_OFFSET_X + CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_OFFSET_Y],
                            size: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: false,
                            padding: 0,
                            bgAlpha: 0,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                            textColor: [0, 0, 0],
                            textAlpha: 1,
                            textSize: CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_SHADOW_TEXT_SIZE,
                            textAnchor: mod.UIAnchor.Center,
                        },
                        {
                            name: `ConquestFlagHudActivePopoutPercentShadowLeft_${pid}`,
                            type: "Text",
                            position: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_OFFSET_X - CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_OFFSET_Y],
                            size: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: false,
                            padding: 0,
                            bgAlpha: 0,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                            textColor: [0, 0, 0],
                            textAlpha: 1,
                            textSize: CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_SHADOW_TEXT_SIZE,
                            textAnchor: mod.UIAnchor.Center,
                        },
                        {
                            name: `ConquestFlagHudActivePopoutPercentShadowUp_${pid}`,
                            type: "Text",
                            position: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_OFFSET_X, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_OFFSET_Y - CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET],
                            size: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: false,
                            padding: 0,
                            bgAlpha: 0,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                            textColor: [0, 0, 0],
                            textAlpha: 1,
                            textSize: CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_SHADOW_TEXT_SIZE,
                            textAnchor: mod.UIAnchor.Center,
                        },
                        {
                            name: `ConquestFlagHudActivePopoutPercentShadowDown_${pid}`,
                            type: "Text",
                            position: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_OFFSET_X, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_OFFSET_Y + CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET],
                            size: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: false,
                            padding: 0,
                            bgAlpha: 0,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                            textColor: [0, 0, 0],
                            textAlpha: 1,
                            textSize: CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_SHADOW_TEXT_SIZE,
                            textAnchor: mod.UIAnchor.Center,
                        },
                        {
                            name: `ConquestFlagHudActivePopoutPercentShadowUpLeft_${pid}`,
                            type: "Text",
                            position: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_OFFSET_X - CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_OFFSET_Y - CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET],
                            size: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: false,
                            padding: 0,
                            bgAlpha: 0,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                            textColor: [0, 0, 0],
                            textAlpha: 1,
                            textSize: CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_SHADOW_TEXT_SIZE,
                            textAnchor: mod.UIAnchor.Center,
                        },
                        {
                            name: `ConquestFlagHudActivePopoutPercentShadowUpRight_${pid}`,
                            type: "Text",
                            position: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_OFFSET_X + CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_OFFSET_Y - CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET],
                            size: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: false,
                            padding: 0,
                            bgAlpha: 0,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                            textColor: [0, 0, 0],
                            textAlpha: 1,
                            textSize: CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_SHADOW_TEXT_SIZE,
                            textAnchor: mod.UIAnchor.Center,
                        },
                        {
                            name: `ConquestFlagHudActivePopoutPercentShadowDownRight_${pid}`,
                            type: "Text",
                            position: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_OFFSET_X + CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_OFFSET_Y + CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET],
                            size: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: false,
                            padding: 0,
                            bgAlpha: 0,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                            textColor: [0, 0, 0],
                            textAlpha: 1,
                            textSize: CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_SHADOW_TEXT_SIZE,
                            textAnchor: mod.UIAnchor.Center,
                        },
                        {
                            name: `ConquestFlagHudActivePopoutPercentShadowDownLeft_${pid}`,
                            type: "Text",
                            position: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_OFFSET_X - CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_OFFSET_Y + CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET],
                            size: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: false,
                            padding: 0,
                            bgAlpha: 0,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                            textColor: [0, 0, 0],
                            textAlpha: 1,
                            textSize: CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_SHADOW_TEXT_SIZE,
                            textAnchor: mod.UIAnchor.Center,
                        },
                        {
                            name: `ConquestFlagHudActivePopoutPercentShadowInner_${pid}`,
                            type: "Text",
                            position: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_OFFSET_X, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_OFFSET_Y],
                            size: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: false,
                            padding: 0,
                            bgAlpha: 0,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                            textColor: [0, 0, 0],
                            textAlpha: 1,
                            textSize: CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_SHADOW_INNER_TEXT_SIZE,
                            textAnchor: mod.UIAnchor.Center,
                        },
                        {
                            name: `ConquestFlagHudActivePopoutPercentText_${pid}`,
                            type: "Text",
                            position: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_OFFSET_X, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_OFFSET_Y],
                            size: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: false,
                            padding: 0,
                            bgAlpha: 0,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                            textColor: [
                                CONQUEST_HUD_TEXT_NEUTRAL_RGB[0],
                                CONQUEST_HUD_TEXT_NEUTRAL_RGB[1],
                                CONQUEST_HUD_TEXT_NEUTRAL_RGB[2],
                            ],
                            textAlpha: 1,
                            textSize: CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_TEXT_SIZE,
                            textAnchor: mod.UIAnchor.Center,
                        },
                    ],
                },
            ],
        });
        // Active-objective engagement panel:
        // - left/right on-point soldier counts (viewer perspective)
        // - split ratio bar (friendly vs enemy presence)
        // - capture-state status text (Defend/Neutralizing/Contesting/Capturing)
        flagChildren.push({
            name: `ConquestFlagHudEngageRoot_${pid}`,
            type: "Container",
            position: [0, 0],
            size: [CONQUEST_HUD_FLAG_ENGAGE_ROOT_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_ROOT_HEIGHT],
            anchor: mod.UIAnchor.TopLeft,
            visible: false,
            padding: 0,
            bgAlpha: 0,
            bgFill: mod.UIBgFill.None,
            children: [
                {
                    name: `ConquestFlagHudEngageTrack_${pid}`,
                    type: "Container",
                    position: [CONQUEST_HUD_FLAG_ENGAGE_TRACK_X, CONQUEST_HUD_FLAG_ENGAGE_TRACK_Y],
                    size: [CONQUEST_HUD_FLAG_ENGAGE_TRACK_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_TRACK_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgColor: [
                        CONQUEST_HUD_FLAG_ENGAGE_TRACK_RGB[0],
                        CONQUEST_HUD_FLAG_ENGAGE_TRACK_RGB[1],
                        CONQUEST_HUD_FLAG_ENGAGE_TRACK_RGB[2],
                    ],
                    bgAlpha: 0.9,
                    bgFill: mod.UIBgFill.Solid,
                    children: [
                        {
                            name: `ConquestFlagHudEngageFriendlyFill_${pid}`,
                            type: "Container",
                            position: [0, 0],
                            size: [Math.floor(CONQUEST_HUD_FLAG_ENGAGE_TRACK_WIDTH / 2), CONQUEST_HUD_FLAG_ENGAGE_TRACK_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: true,
                            padding: 0,
                            bgColor: [
                                CONQUEST_HUD_TEXT_FRIENDLY_RGB[0],
                                CONQUEST_HUD_TEXT_FRIENDLY_RGB[1],
                                CONQUEST_HUD_TEXT_FRIENDLY_RGB[2],
                            ],
                            bgAlpha: 1,
                            bgFill: mod.UIBgFill.Solid,
                        },
                        {
                            name: `ConquestFlagHudEngageEnemyFill_${pid}`,
                            type: "Container",
                            position: [Math.floor(CONQUEST_HUD_FLAG_ENGAGE_TRACK_WIDTH / 2), 0],
                            size: [CONQUEST_HUD_FLAG_ENGAGE_TRACK_WIDTH - Math.floor(CONQUEST_HUD_FLAG_ENGAGE_TRACK_WIDTH / 2), CONQUEST_HUD_FLAG_ENGAGE_TRACK_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: true,
                            padding: 0,
                            bgColor: [
                                CONQUEST_HUD_TEXT_ENEMY_RGB[0],
                                CONQUEST_HUD_TEXT_ENEMY_RGB[1],
                                CONQUEST_HUD_TEXT_ENEMY_RGB[2],
                            ],
                            bgAlpha: 1,
                            bgFill: mod.UIBgFill.Solid,
                        },
                    ],
                },
                {
                    name: `ConquestFlagHudEngageFriendlyCountBg_${pid}`,
                    type: "Container",
                    position: [CONQUEST_HUD_FLAG_ENGAGE_FRIENDLY_COUNT_BG_X, CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_Y],
                    size: [CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgColor: [
                        CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_RGB[0],
                        CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_RGB[1],
                        CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_RGB[2],
                    ],
                    bgAlpha: 0.75,
                    bgFill: mod.UIBgFill.Solid,
                },
                {
                    name: `ConquestFlagHudEngageEnemyCountBg_${pid}`,
                    type: "Container",
                    position: [CONQUEST_HUD_FLAG_ENGAGE_ENEMY_COUNT_BG_X, CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_Y],
                    size: [CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgColor: [
                        CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_RGB[0],
                        CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_RGB[1],
                        CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_RGB[2],
                    ],
                    bgAlpha: 0.75,
                    bgFill: mod.UIBgFill.Solid,
                },
                {
                    name: `ConquestFlagHudEngageFriendlyCountShadow_${pid}`,
                    type: "Text",
                    position: [
                        CONQUEST_HUD_FLAG_ENGAGE_COUNT_TEXT_X + CONQUEST_HUD_FLAG_ENGAGE_COUNT_SHADOW_OFFSET,
                        CONQUEST_HUD_FLAG_ENGAGE_COUNT_TEXT_Y + CONQUEST_HUD_FLAG_ENGAGE_COUNT_SHADOW_OFFSET,
                    ],
                    size: [CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                    textColor: [0, 0, 0],
                    textAlpha: 1,
                    textSize: CONQUEST_HUD_FLAG_ENGAGE_COUNT_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    name: `ConquestFlagHudEngageFriendlyCount_${pid}`,
                    type: "Text",
                    position: [CONQUEST_HUD_FLAG_ENGAGE_COUNT_TEXT_X, CONQUEST_HUD_FLAG_ENGAGE_COUNT_TEXT_Y],
                    size: [CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                    textColor: [
                        CONQUEST_HUD_TEXT_FRIENDLY_RGB[0],
                        CONQUEST_HUD_TEXT_FRIENDLY_RGB[1],
                        CONQUEST_HUD_TEXT_FRIENDLY_RGB[2],
                    ],
                    textAlpha: 1,
                    textSize: CONQUEST_HUD_FLAG_ENGAGE_COUNT_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    name: `ConquestFlagHudEngageEnemyCountShadow_${pid}`,
                    type: "Text",
                    position: [
                        CONQUEST_HUD_FLAG_ENGAGE_COUNT_TEXT_X + CONQUEST_HUD_FLAG_ENGAGE_COUNT_SHADOW_OFFSET,
                        CONQUEST_HUD_FLAG_ENGAGE_COUNT_TEXT_Y + CONQUEST_HUD_FLAG_ENGAGE_COUNT_SHADOW_OFFSET,
                    ],
                    size: [CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                    textColor: [0, 0, 0],
                    textAlpha: 1,
                    textSize: CONQUEST_HUD_FLAG_ENGAGE_COUNT_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    name: `ConquestFlagHudEngageEnemyCount_${pid}`,
                    type: "Text",
                    position: [CONQUEST_HUD_FLAG_ENGAGE_COUNT_TEXT_X, CONQUEST_HUD_FLAG_ENGAGE_COUNT_TEXT_Y],
                    size: [CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                    textColor: [
                        CONQUEST_HUD_TEXT_ENEMY_RGB[0],
                        CONQUEST_HUD_TEXT_ENEMY_RGB[1],
                        CONQUEST_HUD_TEXT_ENEMY_RGB[2],
                    ],
                    textAlpha: 1,
                    textSize: CONQUEST_HUD_FLAG_ENGAGE_COUNT_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    name: `ConquestFlagHudEngageStatusShadowRight_${pid}`,
                    type: "Text",
                    position: [CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_OFFSET, CONQUEST_HUD_FLAG_ENGAGE_STATUS_Y],
                    size: [CONQUEST_HUD_FLAG_ENGAGE_STATUS_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_STATUS_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(STR_HUD_CONQUEST_CAPTURE_STATUS_CONTESTING),
                    textColor: [0, 0, 0],
                    textAlpha: 1,
                    textSize: CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    name: `ConquestFlagHudEngageStatusShadowLeft_${pid}`,
                    type: "Text",
                    position: [-CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_OFFSET, CONQUEST_HUD_FLAG_ENGAGE_STATUS_Y],
                    size: [CONQUEST_HUD_FLAG_ENGAGE_STATUS_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_STATUS_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(STR_HUD_CONQUEST_CAPTURE_STATUS_CONTESTING),
                    textColor: [0, 0, 0],
                    textAlpha: 1,
                    textSize: CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    name: `ConquestFlagHudEngageStatusShadowUp_${pid}`,
                    type: "Text",
                    position: [0, CONQUEST_HUD_FLAG_ENGAGE_STATUS_Y - CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_OFFSET],
                    size: [CONQUEST_HUD_FLAG_ENGAGE_STATUS_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_STATUS_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(STR_HUD_CONQUEST_CAPTURE_STATUS_CONTESTING),
                    textColor: [0, 0, 0],
                    textAlpha: 1,
                    textSize: CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    name: `ConquestFlagHudEngageStatusShadowDown_${pid}`,
                    type: "Text",
                    position: [0, CONQUEST_HUD_FLAG_ENGAGE_STATUS_Y + CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_OFFSET],
                    size: [CONQUEST_HUD_FLAG_ENGAGE_STATUS_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_STATUS_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(STR_HUD_CONQUEST_CAPTURE_STATUS_CONTESTING),
                    textColor: [0, 0, 0],
                    textAlpha: 1,
                    textSize: CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    name: `ConquestFlagHudEngageStatusShadowUpLeft_${pid}`,
                    type: "Text",
                    position: [-CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_OFFSET, CONQUEST_HUD_FLAG_ENGAGE_STATUS_Y - CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_OFFSET],
                    size: [CONQUEST_HUD_FLAG_ENGAGE_STATUS_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_STATUS_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(STR_HUD_CONQUEST_CAPTURE_STATUS_CONTESTING),
                    textColor: [0, 0, 0],
                    textAlpha: 1,
                    textSize: CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    name: `ConquestFlagHudEngageStatusShadowUpRight_${pid}`,
                    type: "Text",
                    position: [CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_OFFSET, CONQUEST_HUD_FLAG_ENGAGE_STATUS_Y - CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_OFFSET],
                    size: [CONQUEST_HUD_FLAG_ENGAGE_STATUS_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_STATUS_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(STR_HUD_CONQUEST_CAPTURE_STATUS_CONTESTING),
                    textColor: [0, 0, 0],
                    textAlpha: 1,
                    textSize: CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    name: `ConquestFlagHudEngageStatusShadowDownRight_${pid}`,
                    type: "Text",
                    position: [CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_OFFSET, CONQUEST_HUD_FLAG_ENGAGE_STATUS_Y + CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_OFFSET],
                    size: [CONQUEST_HUD_FLAG_ENGAGE_STATUS_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_STATUS_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(STR_HUD_CONQUEST_CAPTURE_STATUS_CONTESTING),
                    textColor: [0, 0, 0],
                    textAlpha: 1,
                    textSize: CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    name: `ConquestFlagHudEngageStatusShadowDownLeft_${pid}`,
                    type: "Text",
                    position: [-CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_OFFSET, CONQUEST_HUD_FLAG_ENGAGE_STATUS_Y + CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_OFFSET],
                    size: [CONQUEST_HUD_FLAG_ENGAGE_STATUS_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_STATUS_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(STR_HUD_CONQUEST_CAPTURE_STATUS_CONTESTING),
                    textColor: [0, 0, 0],
                    textAlpha: 1,
                    textSize: CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    name: `ConquestFlagHudEngageStatus_${pid}`,
                    type: "Text",
                    position: [0, CONQUEST_HUD_FLAG_ENGAGE_STATUS_Y],
                    size: [CONQUEST_HUD_FLAG_ENGAGE_STATUS_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_STATUS_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(STR_HUD_CONQUEST_CAPTURE_STATUS_CONTESTING),
                    textColor: [1, 1, 1],
                    textAlpha: 1,
                    textSize: CONQUEST_HUD_FLAG_ENGAGE_STATUS_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.Center,
                },
            ],
        });
        const conquestFlags = modlib.ParseUI({
            name: `ConquestFlagsHudRoot_${pid}`,
            type: "Container",
            playerId: player,
            position: [CONQUEST_FLAGS_ROOT_X, CONQUEST_FLAGS_ROOT_Y],
            size: [CONQUEST_FLAGS_ROOT_WIDTH, CONQUEST_FLAGS_ROOT_HEIGHT],
            anchor: mod.UIAnchor.TopCenter,
            // Start hidden so swap-time rebuilds cannot show incremental construction frames.
            visible: false,
            padding: 0,
            bgAlpha: 0,
            bgFill: mod.UIBgFill.None,
            children: flagChildren,
        });
        if (conquestFlags) refs.roots.push(conquestFlags);
    }

    refs.conquestFlagsDebugRoot = safeFind(`ConquestFlagsHudRoot_${pid}`);
    refs.conquestFlagsDebugSlotRoots = [];
    refs.conquestFlagsDebugBorderRows = [];
    refs.conquestFlagsDebugFillRows = [];
    refs.conquestFlagsDebugLabelShadowRightRows = [];
    refs.conquestFlagsDebugLabelShadowLeftRows = [];
    refs.conquestFlagsDebugLabelShadowUpRows = [];
    refs.conquestFlagsDebugLabelShadowDownRows = [];
    refs.conquestFlagsDebugLabelShadowUpLeftRows = [];
    refs.conquestFlagsDebugLabelShadowUpRightRows = [];
    refs.conquestFlagsDebugLabelShadowDownRightRows = [];
    refs.conquestFlagsDebugLabelShadowDownLeftRows = [];
    refs.conquestFlagsDebugLabelShadowInnerRows = [];
    refs.conquestFlagsDebugLabelShadowInnerDeepRows = [];
    refs.conquestFlagsDebugLabelRows = [];
    refs.conquestFlagsDebugPercentRoots = [];
    refs.conquestFlagsDebugPercentShadowRightRows = [];
    refs.conquestFlagsDebugPercentShadowLeftRows = [];
    refs.conquestFlagsDebugPercentShadowUpRows = [];
    refs.conquestFlagsDebugPercentShadowDownRows = [];
    refs.conquestFlagsDebugPercentShadowUpLeftRows = [];
    refs.conquestFlagsDebugPercentShadowUpRightRows = [];
    refs.conquestFlagsDebugPercentShadowDownRightRows = [];
    refs.conquestFlagsDebugPercentShadowDownLeftRows = [];
    refs.conquestFlagsDebugPercentShadowInnerRows = [];
    refs.conquestFlagsDebugPercentTextRows = [];
    refs.conquestFlagsActivePopoutRoot = safeFind(`ConquestFlagHudActivePopoutRoot_${pid}`);
    refs.conquestFlagsActivePopoutSlot = safeFind(`ConquestFlagHudActivePopoutSlot_${pid}`);
    refs.conquestFlagsActivePopoutBorder = safeFind(`ConquestFlagHudActivePopoutBorder_${pid}`);
    refs.conquestFlagsActivePopoutFill = safeFind(`ConquestFlagHudActivePopoutFill_${pid}`);
    refs.conquestFlagsActivePopoutLabelShadowRight = safeFind(`ConquestFlagHudActivePopoutLabelShadowRight_${pid}`);
    refs.conquestFlagsActivePopoutLabelShadowLeft = safeFind(`ConquestFlagHudActivePopoutLabelShadowLeft_${pid}`);
    refs.conquestFlagsActivePopoutLabelShadowUp = safeFind(`ConquestFlagHudActivePopoutLabelShadowUp_${pid}`);
    refs.conquestFlagsActivePopoutLabelShadowDown = safeFind(`ConquestFlagHudActivePopoutLabelShadowDown_${pid}`);
    refs.conquestFlagsActivePopoutLabelShadowUpLeft = safeFind(`ConquestFlagHudActivePopoutLabelShadowUpLeft_${pid}`);
    refs.conquestFlagsActivePopoutLabelShadowUpRight = safeFind(`ConquestFlagHudActivePopoutLabelShadowUpRight_${pid}`);
    refs.conquestFlagsActivePopoutLabelShadowDownRight = safeFind(`ConquestFlagHudActivePopoutLabelShadowDownRight_${pid}`);
    refs.conquestFlagsActivePopoutLabelShadowDownLeft = safeFind(`ConquestFlagHudActivePopoutLabelShadowDownLeft_${pid}`);
    refs.conquestFlagsActivePopoutLabel = safeFind(`ConquestFlagHudActivePopoutLabel_${pid}`);
    refs.conquestFlagsActivePopoutPercentRoot = safeFind(`ConquestFlagHudActivePopoutPercentRoot_${pid}`);
    refs.conquestFlagsActivePopoutPercentShadowRight = safeFind(`ConquestFlagHudActivePopoutPercentShadowRight_${pid}`);
    refs.conquestFlagsActivePopoutPercentShadowLeft = safeFind(`ConquestFlagHudActivePopoutPercentShadowLeft_${pid}`);
    refs.conquestFlagsActivePopoutPercentShadowUp = safeFind(`ConquestFlagHudActivePopoutPercentShadowUp_${pid}`);
    refs.conquestFlagsActivePopoutPercentShadowDown = safeFind(`ConquestFlagHudActivePopoutPercentShadowDown_${pid}`);
    refs.conquestFlagsActivePopoutPercentShadowUpLeft = safeFind(`ConquestFlagHudActivePopoutPercentShadowUpLeft_${pid}`);
    refs.conquestFlagsActivePopoutPercentShadowUpRight = safeFind(`ConquestFlagHudActivePopoutPercentShadowUpRight_${pid}`);
    refs.conquestFlagsActivePopoutPercentShadowDownRight = safeFind(`ConquestFlagHudActivePopoutPercentShadowDownRight_${pid}`);
    refs.conquestFlagsActivePopoutPercentShadowDownLeft = safeFind(`ConquestFlagHudActivePopoutPercentShadowDownLeft_${pid}`);
    refs.conquestFlagsActivePopoutPercentShadowInner = safeFind(`ConquestFlagHudActivePopoutPercentShadowInner_${pid}`);
    refs.conquestFlagsActivePopoutPercentText = safeFind(`ConquestFlagHudActivePopoutPercentText_${pid}`);
    refs.conquestFlagsEngageRoot = safeFind(`ConquestFlagHudEngageRoot_${pid}`);
    refs.conquestFlagsEngageTrack = safeFind(`ConquestFlagHudEngageTrack_${pid}`);
    refs.conquestFlagsEngageFriendlyFill = safeFind(`ConquestFlagHudEngageFriendlyFill_${pid}`);
    refs.conquestFlagsEngageEnemyFill = safeFind(`ConquestFlagHudEngageEnemyFill_${pid}`);
    refs.conquestFlagsEngageFriendlyCountBg = safeFind(`ConquestFlagHudEngageFriendlyCountBg_${pid}`);
    refs.conquestFlagsEngageEnemyCountBg = safeFind(`ConquestFlagHudEngageEnemyCountBg_${pid}`);
    refs.conquestFlagsEngageFriendlyCountShadow = safeFind(`ConquestFlagHudEngageFriendlyCountShadow_${pid}`);
    refs.conquestFlagsEngageEnemyCountShadow = safeFind(`ConquestFlagHudEngageEnemyCountShadow_${pid}`);
    refs.conquestFlagsEngageFriendlyCount = safeFind(`ConquestFlagHudEngageFriendlyCount_${pid}`);
    refs.conquestFlagsEngageEnemyCount = safeFind(`ConquestFlagHudEngageEnemyCount_${pid}`);
    refs.conquestFlagsEngageStatusShadowRight = safeFind(`ConquestFlagHudEngageStatusShadowRight_${pid}`);
    refs.conquestFlagsEngageStatusShadowLeft = safeFind(`ConquestFlagHudEngageStatusShadowLeft_${pid}`);
    refs.conquestFlagsEngageStatusShadowUp = safeFind(`ConquestFlagHudEngageStatusShadowUp_${pid}`);
    refs.conquestFlagsEngageStatusShadowDown = safeFind(`ConquestFlagHudEngageStatusShadowDown_${pid}`);
    refs.conquestFlagsEngageStatusShadowUpLeft = safeFind(`ConquestFlagHudEngageStatusShadowUpLeft_${pid}`);
    refs.conquestFlagsEngageStatusShadowUpRight = safeFind(`ConquestFlagHudEngageStatusShadowUpRight_${pid}`);
    refs.conquestFlagsEngageStatusShadowDownRight = safeFind(`ConquestFlagHudEngageStatusShadowDownRight_${pid}`);
    refs.conquestFlagsEngageStatusShadowDownLeft = safeFind(`ConquestFlagHudEngageStatusShadowDownLeft_${pid}`);
    refs.conquestFlagsEngageStatus = safeFind(`ConquestFlagHudEngageStatus_${pid}`);
    refs.conquestFlagsDebugFriendlyRows = [];
    refs.conquestFlagsDebugCenterRows = [];
    refs.conquestFlagsDebugEnemyRows = [];
    if (refs.conquestFlagsDebugRoot) {
        for (let i = 0; i < CONQUEST_FLAGS_MAX_ROWS; i++) {
            const slotX = CONQUEST_FLAGS_SLOT_X[i] ?? (i * 35.0);
            const slotRoot = safeFind(`ConquestFlagHudSlot_${pid}_${i}`);
            const border = safeFind(`ConquestFlagHudBorder_${pid}_${i}`);
            const fill = safeFind(`ConquestFlagHudFill_${pid}_${i}`);
            const labelShadowRight = safeFind(`ConquestFlagHudLabelShadowRight_${pid}_${i}`);
            const labelShadowLeft = safeFind(`ConquestFlagHudLabelShadowLeft_${pid}_${i}`);
            const labelShadowUp = safeFind(`ConquestFlagHudLabelShadowUp_${pid}_${i}`);
            const labelShadowDown = safeFind(`ConquestFlagHudLabelShadowDown_${pid}_${i}`);
            const labelShadowUpLeft = safeFind(`ConquestFlagHudLabelShadowUpLeft_${pid}_${i}`);
            const labelShadowUpRight = safeFind(`ConquestFlagHudLabelShadowUpRight_${pid}_${i}`);
            const labelShadowDownRight = safeFind(`ConquestFlagHudLabelShadowDownRight_${pid}_${i}`);
            const labelShadowDownLeft = safeFind(`ConquestFlagHudLabelShadowDownLeft_${pid}_${i}`);
            const labelShadowInner = safeFind(`ConquestFlagHudLabelShadowInner_${pid}_${i}`);
            const labelShadowInnerDeep = safeFind(`ConquestFlagHudLabelShadowInnerDeep_${pid}_${i}`);
            const label = safeFind(`ConquestFlagHudLabel_${pid}_${i}`);
            const percentRoot = safeFind(`ConquestFlagHudPercentRoot_${pid}_${i}`);
            const percentShadowRight = safeFind(`ConquestFlagHudPercentShadowRight_${pid}_${i}`);
            const percentShadowLeft = safeFind(`ConquestFlagHudPercentShadowLeft_${pid}_${i}`);
            const percentShadowUp = safeFind(`ConquestFlagHudPercentShadowUp_${pid}_${i}`);
            const percentShadowDown = safeFind(`ConquestFlagHudPercentShadowDown_${pid}_${i}`);
            const percentShadowUpLeft = safeFind(`ConquestFlagHudPercentShadowUpLeft_${pid}_${i}`);
            const percentShadowUpRight = safeFind(`ConquestFlagHudPercentShadowUpRight_${pid}_${i}`);
            const percentShadowDownRight = safeFind(`ConquestFlagHudPercentShadowDownRight_${pid}_${i}`);
            const percentShadowDownLeft = safeFind(`ConquestFlagHudPercentShadowDownLeft_${pid}_${i}`);
            const percentShadowInner = safeFind(`ConquestFlagHudPercentShadowInner_${pid}_${i}`);
            const percentText = safeFind(`ConquestFlagHudPercentText_${pid}_${i}`);
            refs.conquestFlagsDebugSlotRoots[i] = slotRoot;
            refs.conquestFlagsDebugBorderRows[i] = border;
            refs.conquestFlagsDebugFillRows[i] = fill;
            refs.conquestFlagsDebugLabelShadowRightRows[i] = labelShadowRight;
            refs.conquestFlagsDebugLabelShadowLeftRows[i] = labelShadowLeft;
            refs.conquestFlagsDebugLabelShadowUpRows[i] = labelShadowUp;
            refs.conquestFlagsDebugLabelShadowDownRows[i] = labelShadowDown;
            refs.conquestFlagsDebugLabelShadowUpLeftRows[i] = labelShadowUpLeft;
            refs.conquestFlagsDebugLabelShadowUpRightRows[i] = labelShadowUpRight;
            refs.conquestFlagsDebugLabelShadowDownRightRows[i] = labelShadowDownRight;
            refs.conquestFlagsDebugLabelShadowDownLeftRows[i] = labelShadowDownLeft;
            refs.conquestFlagsDebugLabelShadowInnerRows[i] = labelShadowInner;
            refs.conquestFlagsDebugLabelShadowInnerDeepRows[i] = labelShadowInnerDeep;
            refs.conquestFlagsDebugLabelRows[i] = label;
            refs.conquestFlagsDebugPercentRoots[i] = percentRoot;
            refs.conquestFlagsDebugPercentShadowRightRows[i] = percentShadowRight;
            refs.conquestFlagsDebugPercentShadowLeftRows[i] = percentShadowLeft;
            refs.conquestFlagsDebugPercentShadowUpRows[i] = percentShadowUp;
            refs.conquestFlagsDebugPercentShadowDownRows[i] = percentShadowDown;
            refs.conquestFlagsDebugPercentShadowUpLeftRows[i] = percentShadowUpLeft;
            refs.conquestFlagsDebugPercentShadowUpRightRows[i] = percentShadowUpRight;
            refs.conquestFlagsDebugPercentShadowDownRightRows[i] = percentShadowDownRight;
            refs.conquestFlagsDebugPercentShadowDownLeftRows[i] = percentShadowDownLeft;
            refs.conquestFlagsDebugPercentShadowInnerRows[i] = percentShadowInner;
            refs.conquestFlagsDebugPercentTextRows[i] = percentText;
            if (slotRoot) {
                mod.SetUIWidgetParent(slotRoot, refs.conquestFlagsDebugRoot);
                mod.SetUIWidgetPosition(slotRoot, mod.CreateVector(slotX, 0, 0));
                mod.SetUIWidgetDepth(slotRoot, mod.UIDepth.AboveGameUI);
            }
            if (fill && slotRoot) {
                mod.SetUIWidgetParent(fill, slotRoot);
                mod.SetUIWidgetPosition(fill, mod.CreateVector(CONQUEST_HUD_FLAG_FILL_INSET_X, CONQUEST_HUD_FLAG_FILL_INSET_Y, 0));
                mod.SetUIWidgetDepth(fill, mod.UIDepth.AboveGameUI);
            }
            if (border && slotRoot) {
                mod.SetUIWidgetParent(border, slotRoot);
                mod.SetUIWidgetPosition(border, mod.CreateVector(0, 0, 0));
                mod.SetUIWidgetSize(border, mod.CreateVector(CONQUEST_HUD_FLAG_SLOT_WIDTH, CONQUEST_HUD_FLAG_SLOT_HEIGHT, 0));
                mod.SetUIWidgetDepth(border, mod.UIDepth.AboveGameUI);
            }
            if (labelShadowRight && slotRoot) {
                mod.SetUIWidgetParent(labelShadowRight, slotRoot);
                mod.SetUIWidgetPosition(labelShadowRight, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_X + CONQUEST_HUD_FLAG_LABEL_SHADOW_OFFSET, CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_Y, 0));
                mod.SetUIWidgetSize(labelShadowRight, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_LABEL_WIDGET_HEIGHT, 0));
                mod.SetUIWidgetDepth(labelShadowRight, mod.UIDepth.AboveGameUI);
            }
            if (labelShadowLeft && slotRoot) {
                mod.SetUIWidgetParent(labelShadowLeft, slotRoot);
                mod.SetUIWidgetPosition(labelShadowLeft, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_X - CONQUEST_HUD_FLAG_LABEL_SHADOW_OFFSET, CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_Y, 0));
                mod.SetUIWidgetSize(labelShadowLeft, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_LABEL_WIDGET_HEIGHT, 0));
                mod.SetUIWidgetDepth(labelShadowLeft, mod.UIDepth.AboveGameUI);
            }
            if (labelShadowUp && slotRoot) {
                mod.SetUIWidgetParent(labelShadowUp, slotRoot);
                mod.SetUIWidgetPosition(labelShadowUp, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_X, CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_Y - CONQUEST_HUD_FLAG_LABEL_SHADOW_OFFSET, 0));
                mod.SetUIWidgetSize(labelShadowUp, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_LABEL_WIDGET_HEIGHT, 0));
                mod.SetUIWidgetDepth(labelShadowUp, mod.UIDepth.AboveGameUI);
            }
            if (labelShadowDown && slotRoot) {
                mod.SetUIWidgetParent(labelShadowDown, slotRoot);
                mod.SetUIWidgetPosition(labelShadowDown, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_X, CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_Y + CONQUEST_HUD_FLAG_LABEL_SHADOW_OFFSET, 0));
                mod.SetUIWidgetSize(labelShadowDown, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_LABEL_WIDGET_HEIGHT, 0));
                mod.SetUIWidgetDepth(labelShadowDown, mod.UIDepth.AboveGameUI);
            }
            if (labelShadowUpLeft && slotRoot) {
                mod.SetUIWidgetParent(labelShadowUpLeft, slotRoot);
                mod.SetUIWidgetPosition(labelShadowUpLeft, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_X - CONQUEST_HUD_FLAG_LABEL_SHADOW_OFFSET, CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_Y - CONQUEST_HUD_FLAG_LABEL_SHADOW_OFFSET, 0));
                mod.SetUIWidgetSize(labelShadowUpLeft, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_LABEL_WIDGET_HEIGHT, 0));
                mod.SetUIWidgetDepth(labelShadowUpLeft, mod.UIDepth.AboveGameUI);
            }
            if (labelShadowUpRight && slotRoot) {
                mod.SetUIWidgetParent(labelShadowUpRight, slotRoot);
                mod.SetUIWidgetPosition(labelShadowUpRight, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_X + CONQUEST_HUD_FLAG_LABEL_SHADOW_OFFSET, CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_Y - CONQUEST_HUD_FLAG_LABEL_SHADOW_OFFSET, 0));
                mod.SetUIWidgetSize(labelShadowUpRight, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_LABEL_WIDGET_HEIGHT, 0));
                mod.SetUIWidgetDepth(labelShadowUpRight, mod.UIDepth.AboveGameUI);
            }
            if (labelShadowDownRight && slotRoot) {
                mod.SetUIWidgetParent(labelShadowDownRight, slotRoot);
                mod.SetUIWidgetPosition(labelShadowDownRight, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_X + CONQUEST_HUD_FLAG_LABEL_SHADOW_OFFSET, CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_Y + CONQUEST_HUD_FLAG_LABEL_SHADOW_OFFSET, 0));
                mod.SetUIWidgetSize(labelShadowDownRight, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_LABEL_WIDGET_HEIGHT, 0));
                mod.SetUIWidgetDepth(labelShadowDownRight, mod.UIDepth.AboveGameUI);
            }
            if (labelShadowDownLeft && slotRoot) {
                mod.SetUIWidgetParent(labelShadowDownLeft, slotRoot);
                mod.SetUIWidgetPosition(labelShadowDownLeft, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_X - CONQUEST_HUD_FLAG_LABEL_SHADOW_OFFSET, CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_Y + CONQUEST_HUD_FLAG_LABEL_SHADOW_OFFSET, 0));
                mod.SetUIWidgetSize(labelShadowDownLeft, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_LABEL_WIDGET_HEIGHT, 0));
                mod.SetUIWidgetDepth(labelShadowDownLeft, mod.UIDepth.AboveGameUI);
            }
            if (labelShadowInner && slotRoot) {
                mod.SetUIWidgetParent(labelShadowInner, slotRoot);
                mod.SetUIWidgetPosition(labelShadowInner, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_X, CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_Y, 0));
                mod.SetUIWidgetSize(labelShadowInner, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_LABEL_WIDGET_HEIGHT, 0));
                mod.SetUIWidgetDepth(labelShadowInner, mod.UIDepth.AboveGameUI);
            }
            if (labelShadowInnerDeep && slotRoot) {
                mod.SetUIWidgetParent(labelShadowInnerDeep, slotRoot);
                mod.SetUIWidgetPosition(labelShadowInnerDeep, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_X, CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_Y, 0));
                mod.SetUIWidgetSize(labelShadowInnerDeep, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_LABEL_WIDGET_HEIGHT, 0));
                mod.SetUIWidgetDepth(labelShadowInnerDeep, mod.UIDepth.AboveGameUI);
            }
            if (label && slotRoot) {
                mod.SetUIWidgetParent(label, slotRoot);
                mod.SetUIWidgetPosition(label, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_X, CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_Y, 0));
                mod.SetUIWidgetSize(label, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_LABEL_WIDGET_HEIGHT, 0));
                mod.SetUIWidgetDepth(label, mod.UIDepth.AboveGameUI);
            }
            if (percentRoot) {
                mod.SetUIWidgetParent(percentRoot, refs.conquestFlagsDebugRoot);
                mod.SetUIWidgetPosition(percentRoot, mod.CreateVector(slotX + CONQUEST_HUD_FLAG_PERCENT_OFFSET_X, CONQUEST_HUD_FLAG_PERCENT_OFFSET_Y, 0));
                mod.SetUIWidgetSize(percentRoot, mod.CreateVector(CONQUEST_HUD_FLAG_PERCENT_ROOT_WIDTH, CONQUEST_HUD_FLAG_PERCENT_ROOT_HEIGHT, 0));
                mod.SetUIWidgetDepth(percentRoot, mod.UIDepth.AboveGameUI);
            }
            if (percentShadowRight && percentRoot) {
                mod.SetUIWidgetParent(percentShadowRight, percentRoot);
                mod.SetUIWidgetPosition(percentShadowRight, mod.CreateVector(CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_X + CONQUEST_HUD_FLAG_PERCENT_SHADOW_OFFSET, CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_Y, 0));
                mod.SetUIWidgetSize(percentShadowRight, mod.CreateVector(CONQUEST_HUD_FLAG_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_PERCENT_WIDGET_HEIGHT, 0));
                mod.SetUIWidgetDepth(percentShadowRight, mod.UIDepth.AboveGameUI);
            }
            if (percentShadowLeft && percentRoot) {
                mod.SetUIWidgetParent(percentShadowLeft, percentRoot);
                mod.SetUIWidgetPosition(percentShadowLeft, mod.CreateVector(CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_X - CONQUEST_HUD_FLAG_PERCENT_SHADOW_OFFSET, CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_Y, 0));
                mod.SetUIWidgetSize(percentShadowLeft, mod.CreateVector(CONQUEST_HUD_FLAG_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_PERCENT_WIDGET_HEIGHT, 0));
                mod.SetUIWidgetDepth(percentShadowLeft, mod.UIDepth.AboveGameUI);
            }
            if (percentShadowUp && percentRoot) {
                mod.SetUIWidgetParent(percentShadowUp, percentRoot);
                mod.SetUIWidgetPosition(percentShadowUp, mod.CreateVector(CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_X, CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_Y - CONQUEST_HUD_FLAG_PERCENT_SHADOW_OFFSET, 0));
                mod.SetUIWidgetSize(percentShadowUp, mod.CreateVector(CONQUEST_HUD_FLAG_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_PERCENT_WIDGET_HEIGHT, 0));
                mod.SetUIWidgetDepth(percentShadowUp, mod.UIDepth.AboveGameUI);
            }
            if (percentShadowDown && percentRoot) {
                mod.SetUIWidgetParent(percentShadowDown, percentRoot);
                mod.SetUIWidgetPosition(percentShadowDown, mod.CreateVector(CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_X, CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_Y + CONQUEST_HUD_FLAG_PERCENT_SHADOW_OFFSET, 0));
                mod.SetUIWidgetSize(percentShadowDown, mod.CreateVector(CONQUEST_HUD_FLAG_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_PERCENT_WIDGET_HEIGHT, 0));
                mod.SetUIWidgetDepth(percentShadowDown, mod.UIDepth.AboveGameUI);
            }
            if (percentShadowUpLeft && percentRoot) {
                mod.SetUIWidgetParent(percentShadowUpLeft, percentRoot);
                mod.SetUIWidgetPosition(percentShadowUpLeft, mod.CreateVector(CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_X - CONQUEST_HUD_FLAG_PERCENT_SHADOW_OFFSET, CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_Y - CONQUEST_HUD_FLAG_PERCENT_SHADOW_OFFSET, 0));
                mod.SetUIWidgetSize(percentShadowUpLeft, mod.CreateVector(CONQUEST_HUD_FLAG_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_PERCENT_WIDGET_HEIGHT, 0));
                mod.SetUIWidgetDepth(percentShadowUpLeft, mod.UIDepth.AboveGameUI);
            }
            if (percentShadowUpRight && percentRoot) {
                mod.SetUIWidgetParent(percentShadowUpRight, percentRoot);
                mod.SetUIWidgetPosition(percentShadowUpRight, mod.CreateVector(CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_X + CONQUEST_HUD_FLAG_PERCENT_SHADOW_OFFSET, CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_Y - CONQUEST_HUD_FLAG_PERCENT_SHADOW_OFFSET, 0));
                mod.SetUIWidgetSize(percentShadowUpRight, mod.CreateVector(CONQUEST_HUD_FLAG_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_PERCENT_WIDGET_HEIGHT, 0));
                mod.SetUIWidgetDepth(percentShadowUpRight, mod.UIDepth.AboveGameUI);
            }
            if (percentShadowDownRight && percentRoot) {
                mod.SetUIWidgetParent(percentShadowDownRight, percentRoot);
                mod.SetUIWidgetPosition(percentShadowDownRight, mod.CreateVector(CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_X + CONQUEST_HUD_FLAG_PERCENT_SHADOW_OFFSET, CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_Y + CONQUEST_HUD_FLAG_PERCENT_SHADOW_OFFSET, 0));
                mod.SetUIWidgetSize(percentShadowDownRight, mod.CreateVector(CONQUEST_HUD_FLAG_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_PERCENT_WIDGET_HEIGHT, 0));
                mod.SetUIWidgetDepth(percentShadowDownRight, mod.UIDepth.AboveGameUI);
            }
            if (percentShadowDownLeft && percentRoot) {
                mod.SetUIWidgetParent(percentShadowDownLeft, percentRoot);
                mod.SetUIWidgetPosition(percentShadowDownLeft, mod.CreateVector(CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_X - CONQUEST_HUD_FLAG_PERCENT_SHADOW_OFFSET, CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_Y + CONQUEST_HUD_FLAG_PERCENT_SHADOW_OFFSET, 0));
                mod.SetUIWidgetSize(percentShadowDownLeft, mod.CreateVector(CONQUEST_HUD_FLAG_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_PERCENT_WIDGET_HEIGHT, 0));
                mod.SetUIWidgetDepth(percentShadowDownLeft, mod.UIDepth.AboveGameUI);
            }
            if (percentShadowInner && percentRoot) {
                mod.SetUIWidgetParent(percentShadowInner, percentRoot);
                mod.SetUIWidgetPosition(percentShadowInner, mod.CreateVector(CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_X, CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_Y, 0));
                mod.SetUIWidgetSize(percentShadowInner, mod.CreateVector(CONQUEST_HUD_FLAG_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_PERCENT_WIDGET_HEIGHT, 0));
                mod.SetUIWidgetDepth(percentShadowInner, mod.UIDepth.AboveGameUI);
            }
            if (percentText && percentRoot) {
                mod.SetUIWidgetParent(percentText, percentRoot);
                mod.SetUIWidgetPosition(percentText, mod.CreateVector(CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_X, CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_Y, 0));
                mod.SetUIWidgetSize(percentText, mod.CreateVector(CONQUEST_HUD_FLAG_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_PERCENT_WIDGET_HEIGHT, 0));
                mod.SetUIWidgetDepth(percentText, mod.UIDepth.AboveGameUI);
            }
        }

        if (refs.conquestFlagsEngageRoot) {
            mod.SetUIWidgetParent(refs.conquestFlagsEngageRoot, refs.conquestFlagsDebugRoot);
            mod.SetUIWidgetPosition(
                refs.conquestFlagsEngageRoot,
                mod.CreateVector(CONQUEST_FLAGS_ENGAGE_ABS_X, CONQUEST_FLAGS_ENGAGE_ABS_Y, 0)
            );
            mod.SetUIWidgetSize(
                refs.conquestFlagsEngageRoot,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_ROOT_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_ROOT_HEIGHT, 0)
            );
            mod.SetUIWidgetDepth(refs.conquestFlagsEngageRoot, mod.UIDepth.AboveGameUI);
        }
        if (refs.conquestFlagsEngageTrack && refs.conquestFlagsEngageRoot) {
            mod.SetUIWidgetParent(refs.conquestFlagsEngageTrack, refs.conquestFlagsEngageRoot);
            mod.SetUIWidgetPosition(
                refs.conquestFlagsEngageTrack,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_TRACK_X, CONQUEST_HUD_FLAG_ENGAGE_TRACK_Y, 0)
            );
            mod.SetUIWidgetSize(
                refs.conquestFlagsEngageTrack,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_TRACK_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_TRACK_HEIGHT, 0)
            );
            mod.SetUIWidgetDepth(refs.conquestFlagsEngageTrack, mod.UIDepth.AboveGameUI);
        }
        if (refs.conquestFlagsEngageFriendlyFill && refs.conquestFlagsEngageTrack) {
            mod.SetUIWidgetParent(refs.conquestFlagsEngageFriendlyFill, refs.conquestFlagsEngageTrack);
            mod.SetUIWidgetPosition(refs.conquestFlagsEngageFriendlyFill, mod.CreateVector(0, 0, 0));
            mod.SetUIWidgetSize(
                refs.conquestFlagsEngageFriendlyFill,
                mod.CreateVector(Math.floor(CONQUEST_HUD_FLAG_ENGAGE_TRACK_WIDTH / 2), CONQUEST_HUD_FLAG_ENGAGE_TRACK_HEIGHT, 0)
            );
            mod.SetUIWidgetDepth(refs.conquestFlagsEngageFriendlyFill, mod.UIDepth.AboveGameUI);
        }
        if (refs.conquestFlagsEngageEnemyFill && refs.conquestFlagsEngageTrack) {
            const halfTrack = Math.floor(CONQUEST_HUD_FLAG_ENGAGE_TRACK_WIDTH / 2);
            mod.SetUIWidgetParent(refs.conquestFlagsEngageEnemyFill, refs.conquestFlagsEngageTrack);
            mod.SetUIWidgetPosition(refs.conquestFlagsEngageEnemyFill, mod.CreateVector(halfTrack, 0, 0));
            mod.SetUIWidgetSize(
                refs.conquestFlagsEngageEnemyFill,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_TRACK_WIDTH - halfTrack, CONQUEST_HUD_FLAG_ENGAGE_TRACK_HEIGHT, 0)
            );
            mod.SetUIWidgetDepth(refs.conquestFlagsEngageEnemyFill, mod.UIDepth.AboveGameUI);
        }
        if (refs.conquestFlagsEngageFriendlyCountBg && refs.conquestFlagsEngageRoot) {
            mod.SetUIWidgetParent(refs.conquestFlagsEngageFriendlyCountBg, refs.conquestFlagsEngageRoot);
            mod.SetUIWidgetPosition(
                refs.conquestFlagsEngageFriendlyCountBg,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_FRIENDLY_COUNT_BG_X, CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_Y, 0)
            );
            mod.SetUIWidgetSize(
                refs.conquestFlagsEngageFriendlyCountBg,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_HEIGHT, 0)
            );
            mod.SetUIWidgetDepth(refs.conquestFlagsEngageFriendlyCountBg, mod.UIDepth.AboveGameUI);
        }
        if (refs.conquestFlagsEngageEnemyCountBg && refs.conquestFlagsEngageRoot) {
            mod.SetUIWidgetParent(refs.conquestFlagsEngageEnemyCountBg, refs.conquestFlagsEngageRoot);
            mod.SetUIWidgetPosition(
                refs.conquestFlagsEngageEnemyCountBg,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_ENEMY_COUNT_BG_X, CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_Y, 0)
            );
            mod.SetUIWidgetSize(
                refs.conquestFlagsEngageEnemyCountBg,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_HEIGHT, 0)
            );
            mod.SetUIWidgetDepth(refs.conquestFlagsEngageEnemyCountBg, mod.UIDepth.AboveGameUI);
        }
        if (refs.conquestFlagsEngageFriendlyCount && refs.conquestFlagsEngageFriendlyCountBg) {
            mod.SetUIWidgetParent(refs.conquestFlagsEngageFriendlyCount, refs.conquestFlagsEngageFriendlyCountBg);
            mod.SetUIWidgetPosition(
                refs.conquestFlagsEngageFriendlyCount,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_COUNT_TEXT_X, CONQUEST_HUD_FLAG_ENGAGE_COUNT_TEXT_Y, 0)
            );
            mod.SetUIWidgetSize(
                refs.conquestFlagsEngageFriendlyCount,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_HEIGHT, 0)
            );
            mod.SetUIWidgetDepth(refs.conquestFlagsEngageFriendlyCount, mod.UIDepth.AboveGameUI);
        }
        if (refs.conquestFlagsEngageFriendlyCountShadow && refs.conquestFlagsEngageFriendlyCountBg) {
            mod.SetUIWidgetParent(refs.conquestFlagsEngageFriendlyCountShadow, refs.conquestFlagsEngageFriendlyCountBg);
            mod.SetUIWidgetPosition(
                refs.conquestFlagsEngageFriendlyCountShadow,
                mod.CreateVector(
                    CONQUEST_HUD_FLAG_ENGAGE_COUNT_TEXT_X + CONQUEST_HUD_FLAG_ENGAGE_COUNT_SHADOW_OFFSET,
                    CONQUEST_HUD_FLAG_ENGAGE_COUNT_TEXT_Y + CONQUEST_HUD_FLAG_ENGAGE_COUNT_SHADOW_OFFSET,
                    0
                )
            );
            mod.SetUIWidgetSize(
                refs.conquestFlagsEngageFriendlyCountShadow,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_HEIGHT, 0)
            );
            mod.SetUIWidgetDepth(refs.conquestFlagsEngageFriendlyCountShadow, mod.UIDepth.AboveGameUI);
            if (refs.conquestFlagsEngageFriendlyCount) {
                mod.SetUIWidgetParent(refs.conquestFlagsEngageFriendlyCount, refs.conquestFlagsEngageFriendlyCountBg);
                mod.SetUIWidgetPosition(
                    refs.conquestFlagsEngageFriendlyCount,
                    mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_COUNT_TEXT_X, CONQUEST_HUD_FLAG_ENGAGE_COUNT_TEXT_Y, 0)
                );
                mod.SetUIWidgetSize(
                    refs.conquestFlagsEngageFriendlyCount,
                    mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_HEIGHT, 0)
                );
                mod.SetUIWidgetDepth(refs.conquestFlagsEngageFriendlyCount, mod.UIDepth.AboveGameUI);
            }
        }
        if (refs.conquestFlagsEngageEnemyCount && refs.conquestFlagsEngageEnemyCountBg) {
            mod.SetUIWidgetParent(refs.conquestFlagsEngageEnemyCount, refs.conquestFlagsEngageEnemyCountBg);
            mod.SetUIWidgetPosition(
                refs.conquestFlagsEngageEnemyCount,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_COUNT_TEXT_X, CONQUEST_HUD_FLAG_ENGAGE_COUNT_TEXT_Y, 0)
            );
            mod.SetUIWidgetSize(
                refs.conquestFlagsEngageEnemyCount,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_HEIGHT, 0)
            );
            mod.SetUIWidgetDepth(refs.conquestFlagsEngageEnemyCount, mod.UIDepth.AboveGameUI);
        }
        if (refs.conquestFlagsEngageEnemyCountShadow && refs.conquestFlagsEngageEnemyCountBg) {
            mod.SetUIWidgetParent(refs.conquestFlagsEngageEnemyCountShadow, refs.conquestFlagsEngageEnemyCountBg);
            mod.SetUIWidgetPosition(
                refs.conquestFlagsEngageEnemyCountShadow,
                mod.CreateVector(
                    CONQUEST_HUD_FLAG_ENGAGE_COUNT_TEXT_X + CONQUEST_HUD_FLAG_ENGAGE_COUNT_SHADOW_OFFSET,
                    CONQUEST_HUD_FLAG_ENGAGE_COUNT_TEXT_Y + CONQUEST_HUD_FLAG_ENGAGE_COUNT_SHADOW_OFFSET,
                    0
                )
            );
            mod.SetUIWidgetSize(
                refs.conquestFlagsEngageEnemyCountShadow,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_HEIGHT, 0)
            );
            mod.SetUIWidgetDepth(refs.conquestFlagsEngageEnemyCountShadow, mod.UIDepth.AboveGameUI);
            if (refs.conquestFlagsEngageEnemyCount) {
                mod.SetUIWidgetParent(refs.conquestFlagsEngageEnemyCount, refs.conquestFlagsEngageEnemyCountBg);
                mod.SetUIWidgetPosition(
                    refs.conquestFlagsEngageEnemyCount,
                    mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_COUNT_TEXT_X, CONQUEST_HUD_FLAG_ENGAGE_COUNT_TEXT_Y, 0)
                );
                mod.SetUIWidgetSize(
                    refs.conquestFlagsEngageEnemyCount,
                    mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_HEIGHT, 0)
                );
                mod.SetUIWidgetDepth(refs.conquestFlagsEngageEnemyCount, mod.UIDepth.AboveGameUI);
            }
        }
        if (refs.conquestFlagsEngageStatusShadowRight && refs.conquestFlagsEngageRoot) {
            mod.SetUIWidgetParent(refs.conquestFlagsEngageStatusShadowRight, refs.conquestFlagsEngageRoot);
            mod.SetUIWidgetPosition(
                refs.conquestFlagsEngageStatusShadowRight,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_OFFSET, CONQUEST_HUD_FLAG_ENGAGE_STATUS_Y, 0)
            );
            mod.SetUIWidgetSize(
                refs.conquestFlagsEngageStatusShadowRight,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_STATUS_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_STATUS_HEIGHT, 0)
            );
            mod.SetUIWidgetDepth(refs.conquestFlagsEngageStatusShadowRight, mod.UIDepth.AboveGameUI);
        }
        if (refs.conquestFlagsEngageStatusShadowLeft && refs.conquestFlagsEngageRoot) {
            mod.SetUIWidgetParent(refs.conquestFlagsEngageStatusShadowLeft, refs.conquestFlagsEngageRoot);
            mod.SetUIWidgetPosition(
                refs.conquestFlagsEngageStatusShadowLeft,
                mod.CreateVector(-CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_OFFSET, CONQUEST_HUD_FLAG_ENGAGE_STATUS_Y, 0)
            );
            mod.SetUIWidgetSize(
                refs.conquestFlagsEngageStatusShadowLeft,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_STATUS_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_STATUS_HEIGHT, 0)
            );
            mod.SetUIWidgetDepth(refs.conquestFlagsEngageStatusShadowLeft, mod.UIDepth.AboveGameUI);
        }
        if (refs.conquestFlagsEngageStatusShadowUp && refs.conquestFlagsEngageRoot) {
            mod.SetUIWidgetParent(refs.conquestFlagsEngageStatusShadowUp, refs.conquestFlagsEngageRoot);
            mod.SetUIWidgetPosition(
                refs.conquestFlagsEngageStatusShadowUp,
                mod.CreateVector(0, CONQUEST_HUD_FLAG_ENGAGE_STATUS_Y - CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_OFFSET, 0)
            );
            mod.SetUIWidgetSize(
                refs.conquestFlagsEngageStatusShadowUp,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_STATUS_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_STATUS_HEIGHT, 0)
            );
            mod.SetUIWidgetDepth(refs.conquestFlagsEngageStatusShadowUp, mod.UIDepth.AboveGameUI);
        }
        if (refs.conquestFlagsEngageStatusShadowDown && refs.conquestFlagsEngageRoot) {
            mod.SetUIWidgetParent(refs.conquestFlagsEngageStatusShadowDown, refs.conquestFlagsEngageRoot);
            mod.SetUIWidgetPosition(
                refs.conquestFlagsEngageStatusShadowDown,
                mod.CreateVector(0, CONQUEST_HUD_FLAG_ENGAGE_STATUS_Y + CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_OFFSET, 0)
            );
            mod.SetUIWidgetSize(
                refs.conquestFlagsEngageStatusShadowDown,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_STATUS_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_STATUS_HEIGHT, 0)
            );
            mod.SetUIWidgetDepth(refs.conquestFlagsEngageStatusShadowDown, mod.UIDepth.AboveGameUI);
        }
        if (refs.conquestFlagsEngageStatusShadowUpLeft && refs.conquestFlagsEngageRoot) {
            mod.SetUIWidgetParent(refs.conquestFlagsEngageStatusShadowUpLeft, refs.conquestFlagsEngageRoot);
            mod.SetUIWidgetPosition(
                refs.conquestFlagsEngageStatusShadowUpLeft,
                mod.CreateVector(-CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_OFFSET, CONQUEST_HUD_FLAG_ENGAGE_STATUS_Y - CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_OFFSET, 0)
            );
            mod.SetUIWidgetSize(
                refs.conquestFlagsEngageStatusShadowUpLeft,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_STATUS_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_STATUS_HEIGHT, 0)
            );
            mod.SetUIWidgetDepth(refs.conquestFlagsEngageStatusShadowUpLeft, mod.UIDepth.AboveGameUI);
        }
        if (refs.conquestFlagsEngageStatusShadowUpRight && refs.conquestFlagsEngageRoot) {
            mod.SetUIWidgetParent(refs.conquestFlagsEngageStatusShadowUpRight, refs.conquestFlagsEngageRoot);
            mod.SetUIWidgetPosition(
                refs.conquestFlagsEngageStatusShadowUpRight,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_OFFSET, CONQUEST_HUD_FLAG_ENGAGE_STATUS_Y - CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_OFFSET, 0)
            );
            mod.SetUIWidgetSize(
                refs.conquestFlagsEngageStatusShadowUpRight,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_STATUS_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_STATUS_HEIGHT, 0)
            );
            mod.SetUIWidgetDepth(refs.conquestFlagsEngageStatusShadowUpRight, mod.UIDepth.AboveGameUI);
        }
        if (refs.conquestFlagsEngageStatusShadowDownRight && refs.conquestFlagsEngageRoot) {
            mod.SetUIWidgetParent(refs.conquestFlagsEngageStatusShadowDownRight, refs.conquestFlagsEngageRoot);
            mod.SetUIWidgetPosition(
                refs.conquestFlagsEngageStatusShadowDownRight,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_OFFSET, CONQUEST_HUD_FLAG_ENGAGE_STATUS_Y + CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_OFFSET, 0)
            );
            mod.SetUIWidgetSize(
                refs.conquestFlagsEngageStatusShadowDownRight,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_STATUS_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_STATUS_HEIGHT, 0)
            );
            mod.SetUIWidgetDepth(refs.conquestFlagsEngageStatusShadowDownRight, mod.UIDepth.AboveGameUI);
        }
        if (refs.conquestFlagsEngageStatusShadowDownLeft && refs.conquestFlagsEngageRoot) {
            mod.SetUIWidgetParent(refs.conquestFlagsEngageStatusShadowDownLeft, refs.conquestFlagsEngageRoot);
            mod.SetUIWidgetPosition(
                refs.conquestFlagsEngageStatusShadowDownLeft,
                mod.CreateVector(-CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_OFFSET, CONQUEST_HUD_FLAG_ENGAGE_STATUS_Y + CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_OFFSET, 0)
            );
            mod.SetUIWidgetSize(
                refs.conquestFlagsEngageStatusShadowDownLeft,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_STATUS_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_STATUS_HEIGHT, 0)
            );
            mod.SetUIWidgetDepth(refs.conquestFlagsEngageStatusShadowDownLeft, mod.UIDepth.AboveGameUI);
        }
        if (refs.conquestFlagsEngageStatus && refs.conquestFlagsEngageRoot) {
            mod.SetUIWidgetParent(refs.conquestFlagsEngageStatus, refs.conquestFlagsEngageRoot);
            mod.SetUIWidgetPosition(refs.conquestFlagsEngageStatus, mod.CreateVector(0, CONQUEST_HUD_FLAG_ENGAGE_STATUS_Y, 0));
            mod.SetUIWidgetSize(
                refs.conquestFlagsEngageStatus,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_STATUS_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_STATUS_HEIGHT, 0)
            );
            mod.SetUIWidgetDepth(refs.conquestFlagsEngageStatus, mod.UIDepth.AboveGameUI);
        }
    }
    safeSetUIWidgetDepth(refs.conquestFlagsDebugRoot, mod.UIDepth.AboveGameUI);
    hideLegacyConquestRoots();
    hideLegacyFlagTripletRows();

    //#endregion ----------------- HUD Build/Ensure - Admin Action Counter --------------------



    //#region -------------------- HUD Build/Ensure - Counter Widgets --------------------

    // West/East score panels and top round X/Y counters intentionally removed for conquest HUD simplification.

    //#endregion ----------------- HUD Build/Ensure - Counter Widgets --------------------



    // Legacy round-end modal was removed; conquest uses the dedicated victory dialog builder below.



    //#region -------------------- HUD Build/Ensure - Victory Dialog --------------------

    buildVictoryDialogWidgets(player, pid, refs);

    //#endregion ----------------- HUD Build/Ensure - Victory Dialog --------------------



    //#region -------------------- HUD Build/Ensure - Cache Init + Defaults --------------------

    refs.helpTextContainer = safeFind(`Container_HelpText_${pid}`);
    refs.readyStatusContainer = safeFind(`Container_ReadyStatus_${pid}`);
    refs.settingsGameModeText = safeFind(`Settings_GameMode_${pid}`);
    refs.settingsAircraftCeilingText = safeFind(`Settings_Ceiling_${pid}`);
    refs.settingsVehiclesT1Text = safeFind(`Settings_VehiclesT1_${pid}`);
    refs.settingsVehiclesT2Text = safeFind(`Settings_VehiclesT2_${pid}`);
    refs.settingsVehiclesMatchupText = safeFind(`Settings_VehiclesMatchup_${pid}`);
    refs.settingsPlayersText = safeFind(`Settings_Players_${pid}`);
    State.conquest.debug.hudGenerationByPid[pid] = (State.conquest.debug.hudGenerationByPid[pid] ?? 0) + 1;
    State.hudCache.hudByPid[pid] = refs;

    // Keep only HUD elements used by conquest's simplified center HUD + overlays.
    setAdminPanelActionCountText(refs.adminPanelActionCountText, State.admin.actionCount);
    updateSettingsSummaryHudForPid(pid);

    ensureTopHudRootForPid(pid, player);
    applyConquestAbsoluteLayout(refs, true);
    const readyContainer = safeFind(`Container_ReadyStatus_${pid}`);
    if (readyContainer) {
        try {
            mod.SetUIWidgetAnchor(readyContainer, mod.UIAnchor.TopLeft);
        } catch {
            // Best-effort anchor normalization only.
        }
        mod.SetUIWidgetParent(readyContainer, mod.GetUIRoot());
        mod.SetUIWidgetPosition(readyContainer, mod.CreateVector(CONQUEST_READY_ABS_X, CONQUEST_READY_ABS_Y, 0));
        mod.SetUIWidgetSize(readyContainer, mod.CreateVector(CONQUEST_READY_CONTAINER_WIDTH, CONQUEST_READY_CONTAINER_HEIGHT, 0));
    }
    const readyText = safeFind(`ReadyStatusText_${pid}`);
    if (readyText && readyContainer) {
        mod.SetUIWidgetParent(readyText, readyContainer);
        mod.SetUIWidgetPosition(readyText, mod.CreateVector(0, CONQUEST_READY_TEXT_OFFSET_Y, 0));
        mod.SetUIWidgetSize(readyText, mod.CreateVector(CONQUEST_READY_CONTAINER_WIDTH, CONQUEST_READY_TEXT_HEIGHT, 0));
    }
    setHudHelpDepthForPid(pid);

    updateVictoryDialogForPlayer(player, getRemainingSeconds());

    return refs;
}

//#endregion ----------------- HUD Build/Ensure - Cache Init + Defaults --------------------
