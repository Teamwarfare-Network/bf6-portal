// @ts-nocheck
// Module: index/capture-tickets -- Phase 2A capture routing, ticket bleed, end checks, and temporary debug HUD

// Clamps engine capture-progress reads to a safe [0..1] range.
function conquestPhase2AClamp01(value: number): number {
    if (value <= 0) return 0;
    if (value >= 1) return 1;
    return value;
}

// Temporary diagnostic gate:
// - true: force-hide Conquest V2 ticket/flag roots every HUD refresh to prove ownership.
// - false: normal HUD rendering.
const CONQUEST_PHASE3_UI_OWNERSHIP_PROBE_HIDE_V2 = false;
const CONQUEST_FLAG_PROGRESS_DEADBAND_LOW = 0.01;
const CONQUEST_FLAG_PROGRESS_DEADBAND_HIGH = 0.99;
const CONQUEST_FLAG_PHASE_TRANSITION_LOW = 0.04;
const CONQUEST_FLAG_PHASE_TRANSITION_HIGH = 0.96;
const CONQUEST_FLAG_NEUTRALIZATION_LATCH_TICKS = 2;
const conquestPhase2ACaptureTimingConfiguredByObjId: Record<number, boolean> = {};

type ConquestFlagVisualSample = {
    ownerTeam: TeamID | 0;
    activeTeam: TeamID | 0;
    progress01: number;
    sampleTick: number;
};

type ConquestShadowTextWidgetSet = {
    right?: mod.UIWidget;
    left?: mod.UIWidget;
    up?: mod.UIWidget;
    down?: mod.UIWidget;
    upLeft?: mod.UIWidget;
    upRight?: mod.UIWidget;
    downRight?: mod.UIWidget;
    downLeft?: mod.UIWidget;
    inner?: mod.UIWidget;
    innerDeep?: mod.UIWidget;
    text?: mod.UIWidget;
};

type ConquestFlagPercentDisplay = {
    visible: boolean;
    value01: number;
    color?: mod.Vector;
};

type ConquestFlagEngageDisplay = {
    visible: boolean;
    friendlyCount: number;
    enemyCount: number;
    friendlyRatio: number;
    enemyRatio: number;
    statusKey: number;
};

const CONQUEST_SHADOW_TEXT_COLOR_BLACK = mod.CreateVector(0, 0, 0);

// Applies one visibility value to all widgets in a shadow-text group.
function conquestPhase3SetShadowTextGroupVisible(group: ConquestShadowTextWidgetSet, visible: boolean): void {
    safeSetUIWidgetVisible(group.right, visible);
    safeSetUIWidgetVisible(group.left, visible);
    safeSetUIWidgetVisible(group.up, visible);
    safeSetUIWidgetVisible(group.down, visible);
    safeSetUIWidgetVisible(group.upLeft, visible);
    safeSetUIWidgetVisible(group.upRight, visible);
    safeSetUIWidgetVisible(group.downRight, visible);
    safeSetUIWidgetVisible(group.downLeft, visible);
    safeSetUIWidgetVisible(group.inner, visible);
    safeSetUIWidgetVisible(group.innerDeep, visible);
    safeSetUIWidgetVisible(group.text, visible);
}

// Writes one label message to all layers in a shadow-text group.
function conquestPhase3SetShadowTextGroupLabel(group: ConquestShadowTextWidgetSet, label: mod.Message): void {
    safeSetUITextLabel(group.right, label);
    safeSetUITextLabel(group.left, label);
    safeSetUITextLabel(group.up, label);
    safeSetUITextLabel(group.down, label);
    safeSetUITextLabel(group.upLeft, label);
    safeSetUITextLabel(group.upRight, label);
    safeSetUITextLabel(group.downRight, label);
    safeSetUITextLabel(group.downLeft, label);
    safeSetUITextLabel(group.inner, label);
    safeSetUITextLabel(group.innerDeep, label);
    safeSetUITextLabel(group.text, label);
}

// Colors all shadow layers black and applies the requested foreground color to the top text layer.
function conquestPhase3SetShadowTextGroupColors(group: ConquestShadowTextWidgetSet, foreground: mod.Vector): void {
    safeSetUITextColor(group.right, CONQUEST_SHADOW_TEXT_COLOR_BLACK);
    safeSetUITextColor(group.left, CONQUEST_SHADOW_TEXT_COLOR_BLACK);
    safeSetUITextColor(group.up, CONQUEST_SHADOW_TEXT_COLOR_BLACK);
    safeSetUITextColor(group.down, CONQUEST_SHADOW_TEXT_COLOR_BLACK);
    safeSetUITextColor(group.upLeft, CONQUEST_SHADOW_TEXT_COLOR_BLACK);
    safeSetUITextColor(group.upRight, CONQUEST_SHADOW_TEXT_COLOR_BLACK);
    safeSetUITextColor(group.downRight, CONQUEST_SHADOW_TEXT_COLOR_BLACK);
    safeSetUITextColor(group.downLeft, CONQUEST_SHADOW_TEXT_COLOR_BLACK);
    safeSetUITextColor(group.inner, CONQUEST_SHADOW_TEXT_COLOR_BLACK);
    safeSetUITextColor(group.innerDeep, CONQUEST_SHADOW_TEXT_COLOR_BLACK);
    safeSetUITextColor(group.text, foreground);
}

// Marks conquest HUD projections dirty so the next live tick performs a render pass.
function conquestPhase3MarkHudDirty(): void {
    State.conquest.debug.hudDirty = true;
}

// Strict ownership probe helper: hide all known V2 conquest ticket/flag widgets by refs and direct name lookup.
function conquestPhase3ForceHideAllV2Widgets(pid: number, refs: HudRefs): void {
    safeSetUIWidgetVisible(refs.conquestTicketsDebugRoot, false);
    safeSetUIWidgetVisible(refs.conquestTicketsDebugTeam1, false);
    safeSetUIWidgetVisible(refs.conquestTicketsDebugTeam2, false);
    safeSetUIWidgetVisible(safeFind(`ConquestTicketsHudTeam1Container_${pid}`), false);
    safeSetUIWidgetVisible(safeFind(`ConquestTicketsHudTeam2Container_${pid}`), false);
    safeSetUIWidgetVisible(refs.conquestTicketsDebugLeftBarTrack, false);
    safeSetUIWidgetVisible(refs.conquestTicketsDebugLeftBarFill, false);
    safeSetUIWidgetVisible(refs.conquestTicketsDebugRightBarTrack, false);
    safeSetUIWidgetVisible(refs.conquestTicketsDebugRightBarFill, false);
    safeSetUIWidgetVisible(refs.conquestTicketsLeadLeftBorder, false);
    safeSetUIWidgetVisible(refs.conquestTicketsLeadRightBorder, false);
    safeSetUIWidgetVisible(refs.conquestTicketsLeadLeftCrown, false);
    safeSetUIWidgetVisible(refs.conquestTicketsLeadRightCrown, false);
    const leftBleedChevrons = refs.conquestTicketsBleedLeftChevrons ?? [];
    const rightBleedChevrons = refs.conquestTicketsBleedRightChevrons ?? [];
    for (let chevronIndex = 0; chevronIndex < CONQUEST_HUD_TICKET_BLEED_CHEVRON_COUNT; chevronIndex++) {
        safeSetUIWidgetVisible(leftBleedChevrons[chevronIndex], false);
        safeSetUIWidgetVisible(rightBleedChevrons[chevronIndex], false);
        safeSetUIWidgetVisible(safeFind(`ConquestTicketsHudBleedChevronLeft${chevronIndex + 1}_${pid}`), false);
        safeSetUIWidgetVisible(safeFind(`ConquestTicketsHudBleedChevronRight${chevronIndex + 1}_${pid}`), false);
    }
    safeSetUIWidgetVisible(safeFind(`ConquestTicketsHudLeadBorderLeft_${pid}`), false);
    safeSetUIWidgetVisible(safeFind(`ConquestTicketsHudLeadBorderRight_${pid}`), false);
    safeSetUIWidgetVisible(safeFind(`ConquestTicketsHudLeadCrownLeft_${pid}`), false);
    safeSetUIWidgetVisible(safeFind(`ConquestTicketsHudLeadCrownRight_${pid}`), false);
    safeSetUIWidgetVisible(safeFind(`ConquestTicketsHudSlash_${pid}`), false);

    safeSetUIWidgetVisible(refs.conquestFlagsDebugRoot, false);
    safeSetUIWidgetVisible(refs.conquestFlagsEngageRoot, false);
    safeSetUIWidgetVisible(refs.conquestFlagsEngageTrack, false);
    safeSetUIWidgetVisible(refs.conquestFlagsEngageFriendlyFill, false);
    safeSetUIWidgetVisible(refs.conquestFlagsEngageEnemyFill, false);
    safeSetUIWidgetVisible(refs.conquestFlagsEngageFriendlyCountBg, false);
    safeSetUIWidgetVisible(refs.conquestFlagsEngageEnemyCountBg, false);
    safeSetUIWidgetVisible(refs.conquestFlagsEngageFriendlyCount, false);
    safeSetUIWidgetVisible(refs.conquestFlagsEngageEnemyCount, false);
    safeSetUIWidgetVisible(refs.conquestFlagsEngageStatusShadowRight, false);
    safeSetUIWidgetVisible(refs.conquestFlagsEngageStatusShadowLeft, false);
    safeSetUIWidgetVisible(refs.conquestFlagsEngageStatusShadowUp, false);
    safeSetUIWidgetVisible(refs.conquestFlagsEngageStatusShadowDown, false);
    safeSetUIWidgetVisible(refs.conquestFlagsEngageStatusShadowUpLeft, false);
    safeSetUIWidgetVisible(refs.conquestFlagsEngageStatusShadowUpRight, false);
    safeSetUIWidgetVisible(refs.conquestFlagsEngageStatusShadowDownRight, false);
    safeSetUIWidgetVisible(refs.conquestFlagsEngageStatusShadowDownLeft, false);
    safeSetUIWidgetVisible(refs.conquestFlagsEngageStatus, false);
    safeSetUIWidgetVisible(safeFind(`ConquestFlagHudEngageRoot_${pid}`), false);
    safeSetUIWidgetVisible(safeFind(`ConquestFlagHudEngageTrack_${pid}`), false);
    safeSetUIWidgetVisible(safeFind(`ConquestFlagHudEngageFriendlyFill_${pid}`), false);
    safeSetUIWidgetVisible(safeFind(`ConquestFlagHudEngageEnemyFill_${pid}`), false);
    safeSetUIWidgetVisible(safeFind(`ConquestFlagHudEngageFriendlyCountBg_${pid}`), false);
    safeSetUIWidgetVisible(safeFind(`ConquestFlagHudEngageEnemyCountBg_${pid}`), false);
    safeSetUIWidgetVisible(safeFind(`ConquestFlagHudEngageFriendlyCount_${pid}`), false);
    safeSetUIWidgetVisible(safeFind(`ConquestFlagHudEngageEnemyCount_${pid}`), false);
    safeSetUIWidgetVisible(safeFind(`ConquestFlagHudEngageStatusShadowRight_${pid}`), false);
    safeSetUIWidgetVisible(safeFind(`ConquestFlagHudEngageStatusShadowLeft_${pid}`), false);
    safeSetUIWidgetVisible(safeFind(`ConquestFlagHudEngageStatusShadowUp_${pid}`), false);
    safeSetUIWidgetVisible(safeFind(`ConquestFlagHudEngageStatusShadowDown_${pid}`), false);
    safeSetUIWidgetVisible(safeFind(`ConquestFlagHudEngageStatusShadowUpLeft_${pid}`), false);
    safeSetUIWidgetVisible(safeFind(`ConquestFlagHudEngageStatusShadowUpRight_${pid}`), false);
    safeSetUIWidgetVisible(safeFind(`ConquestFlagHudEngageStatusShadowDownRight_${pid}`), false);
    safeSetUIWidgetVisible(safeFind(`ConquestFlagHudEngageStatusShadowDownLeft_${pid}`), false);
    safeSetUIWidgetVisible(safeFind(`ConquestFlagHudEngageStatus_${pid}`), false);
    const slotRoots = refs.conquestFlagsDebugSlotRoots ?? [];
    const slotBorders = refs.conquestFlagsDebugBorderRows ?? [];
    const slotFills = refs.conquestFlagsDebugFillRows ?? [];
    const slotLabelShadowsRight = refs.conquestFlagsDebugLabelShadowRightRows ?? [];
    const slotLabelShadowsLeft = refs.conquestFlagsDebugLabelShadowLeftRows ?? [];
    const slotLabelShadowsUp = refs.conquestFlagsDebugLabelShadowUpRows ?? [];
    const slotLabelShadowsDown = refs.conquestFlagsDebugLabelShadowDownRows ?? [];
    const slotLabelShadowsUpLeft = refs.conquestFlagsDebugLabelShadowUpLeftRows ?? [];
    const slotLabelShadowsUpRight = refs.conquestFlagsDebugLabelShadowUpRightRows ?? [];
    const slotLabelShadowsDownRight = refs.conquestFlagsDebugLabelShadowDownRightRows ?? [];
    const slotLabelShadowsDownLeft = refs.conquestFlagsDebugLabelShadowDownLeftRows ?? [];
    const slotLabelShadowsInner = refs.conquestFlagsDebugLabelShadowInnerRows ?? [];
    const slotLabelShadowsInnerDeep = refs.conquestFlagsDebugLabelShadowInnerDeepRows ?? [];
    const slotLabels = refs.conquestFlagsDebugLabelRows ?? [];
    const slotPercentRoots = refs.conquestFlagsDebugPercentRoots ?? [];
    const slotPercentShadowsRight = refs.conquestFlagsDebugPercentShadowRightRows ?? [];
    const slotPercentShadowsLeft = refs.conquestFlagsDebugPercentShadowLeftRows ?? [];
    const slotPercentShadowsUp = refs.conquestFlagsDebugPercentShadowUpRows ?? [];
    const slotPercentShadowsDown = refs.conquestFlagsDebugPercentShadowDownRows ?? [];
    const slotPercentShadowsUpLeft = refs.conquestFlagsDebugPercentShadowUpLeftRows ?? [];
    const slotPercentShadowsUpRight = refs.conquestFlagsDebugPercentShadowUpRightRows ?? [];
    const slotPercentShadowsDownRight = refs.conquestFlagsDebugPercentShadowDownRightRows ?? [];
    const slotPercentShadowsDownLeft = refs.conquestFlagsDebugPercentShadowDownLeftRows ?? [];
    const slotPercentShadowsInner = refs.conquestFlagsDebugPercentShadowInnerRows ?? [];
    const slotPercentTexts = refs.conquestFlagsDebugPercentTextRows ?? [];
    const maxSlots = Math.max(
        slotRoots.length,
        slotBorders.length,
        slotFills.length,
        slotLabelShadowsRight.length,
        slotLabelShadowsLeft.length,
        slotLabelShadowsUp.length,
        slotLabelShadowsDown.length,
        slotLabelShadowsUpLeft.length,
        slotLabelShadowsUpRight.length,
        slotLabelShadowsDownRight.length,
        slotLabelShadowsDownLeft.length,
        slotLabelShadowsInner.length,
        slotLabelShadowsInnerDeep.length,
        slotLabels.length,
        slotPercentRoots.length,
        slotPercentShadowsRight.length,
        slotPercentShadowsLeft.length,
        slotPercentShadowsUp.length,
        slotPercentShadowsDown.length,
        slotPercentShadowsUpLeft.length,
        slotPercentShadowsUpRight.length,
        slotPercentShadowsDownRight.length,
        slotPercentShadowsDownLeft.length,
        slotPercentShadowsInner.length,
        slotPercentTexts.length,
        7
    );
    for (let i = 0; i < maxSlots; i++) {
        safeSetUIWidgetVisible(slotRoots[i], false);
        safeSetUIWidgetVisible(slotBorders[i], false);
        safeSetUIWidgetVisible(slotFills[i], false);
        safeSetUIWidgetVisible(slotLabelShadowsRight[i], false);
        safeSetUIWidgetVisible(slotLabelShadowsLeft[i], false);
        safeSetUIWidgetVisible(slotLabelShadowsUp[i], false);
        safeSetUIWidgetVisible(slotLabelShadowsDown[i], false);
        safeSetUIWidgetVisible(slotLabelShadowsUpLeft[i], false);
        safeSetUIWidgetVisible(slotLabelShadowsUpRight[i], false);
        safeSetUIWidgetVisible(slotLabelShadowsDownRight[i], false);
        safeSetUIWidgetVisible(slotLabelShadowsDownLeft[i], false);
        safeSetUIWidgetVisible(slotLabelShadowsInner[i], false);
        safeSetUIWidgetVisible(slotLabelShadowsInnerDeep[i], false);
        safeSetUIWidgetVisible(slotLabels[i], false);
        safeSetUIWidgetVisible(slotPercentRoots[i], false);
        safeSetUIWidgetVisible(slotPercentShadowsRight[i], false);
        safeSetUIWidgetVisible(slotPercentShadowsLeft[i], false);
        safeSetUIWidgetVisible(slotPercentShadowsUp[i], false);
        safeSetUIWidgetVisible(slotPercentShadowsDown[i], false);
        safeSetUIWidgetVisible(slotPercentShadowsUpLeft[i], false);
        safeSetUIWidgetVisible(slotPercentShadowsUpRight[i], false);
        safeSetUIWidgetVisible(slotPercentShadowsDownRight[i], false);
        safeSetUIWidgetVisible(slotPercentShadowsDownLeft[i], false);
        safeSetUIWidgetVisible(slotPercentShadowsInner[i], false);
        safeSetUIWidgetVisible(slotPercentTexts[i], false);
        safeSetUIWidgetVisible(safeFind(`ConquestFlagHudSlot_${pid}_${i}`), false);
        safeSetUIWidgetVisible(safeFind(`ConquestFlagHudBorder_${pid}_${i}`), false);
        safeSetUIWidgetVisible(safeFind(`ConquestFlagHudFill_${pid}_${i}`), false);
        safeSetUIWidgetVisible(safeFind(`ConquestFlagHudLabelShadowRight_${pid}_${i}`), false);
        safeSetUIWidgetVisible(safeFind(`ConquestFlagHudLabelShadowLeft_${pid}_${i}`), false);
        safeSetUIWidgetVisible(safeFind(`ConquestFlagHudLabelShadowUp_${pid}_${i}`), false);
        safeSetUIWidgetVisible(safeFind(`ConquestFlagHudLabelShadowDown_${pid}_${i}`), false);
        safeSetUIWidgetVisible(safeFind(`ConquestFlagHudLabelShadowUpLeft_${pid}_${i}`), false);
        safeSetUIWidgetVisible(safeFind(`ConquestFlagHudLabelShadowUpRight_${pid}_${i}`), false);
        safeSetUIWidgetVisible(safeFind(`ConquestFlagHudLabelShadowDownRight_${pid}_${i}`), false);
        safeSetUIWidgetVisible(safeFind(`ConquestFlagHudLabelShadowDownLeft_${pid}_${i}`), false);
        safeSetUIWidgetVisible(safeFind(`ConquestFlagHudLabelShadowInner_${pid}_${i}`), false);
        safeSetUIWidgetVisible(safeFind(`ConquestFlagHudLabelShadowInnerDeep_${pid}_${i}`), false);
        safeSetUIWidgetVisible(safeFind(`ConquestFlagHudPercentRoot_${pid}_${i}`), false);
        safeSetUIWidgetVisible(safeFind(`ConquestFlagHudPercentShadowRight_${pid}_${i}`), false);
        safeSetUIWidgetVisible(safeFind(`ConquestFlagHudPercentShadowLeft_${pid}_${i}`), false);
        safeSetUIWidgetVisible(safeFind(`ConquestFlagHudPercentShadowUp_${pid}_${i}`), false);
        safeSetUIWidgetVisible(safeFind(`ConquestFlagHudPercentShadowDown_${pid}_${i}`), false);
        safeSetUIWidgetVisible(safeFind(`ConquestFlagHudPercentShadowUpLeft_${pid}_${i}`), false);
        safeSetUIWidgetVisible(safeFind(`ConquestFlagHudPercentShadowUpRight_${pid}_${i}`), false);
        safeSetUIWidgetVisible(safeFind(`ConquestFlagHudPercentShadowDownRight_${pid}_${i}`), false);
        safeSetUIWidgetVisible(safeFind(`ConquestFlagHudPercentShadowDownLeft_${pid}_${i}`), false);
        safeSetUIWidgetVisible(safeFind(`ConquestFlagHudPercentShadowInner_${pid}_${i}`), false);
        safeSetUIWidgetVisible(safeFind(`ConquestFlagHudPercentText_${pid}_${i}`), false);
        // Keep clearing deprecated center shadow in case stale widgets exist from older builds.
        safeSetUIWidgetVisible(safeFind(`ConquestFlagHudLabelShadowCenter_${pid}_${i}`), false);
        // Hide legacy shadow variants from previous iterations to avoid overlap.
        safeSetUIWidgetVisible(safeFind(`ConquestFlagHudLabelShadowOuter_${pid}_${i}`), false);
        safeSetUIWidgetVisible(safeFind(`ConquestFlagHudLabelShadowMid_${pid}_${i}`), false);
        safeSetUIWidgetVisible(safeFind(`ConquestFlagHudLabelShadow_${pid}_${i}`), false);
        safeSetUIWidgetVisible(safeFind(`ConquestFlagHudLabel_${pid}_${i}`), false);
    }
}

// Resolves viewer perspective teams for friendly-left/enemy-right HUD rendering.
function conquestPhase3GetPerspectiveTeams(viewer: mod.Player): { friendlyTeam: TeamID; enemyTeam: TeamID } {
    const pid = safeGetPlayerId(viewer);
    const resolvedTeam = safeGetTeamNumberFromPlayer(viewer, 0);
    const stickyTeam = pid !== undefined ? State.conquest.debug.perspectiveTeamByPid[pid] : undefined;
    const swapPerspectiveLockUntil =
        pid !== undefined ? (State.conquest.debug.teamSwapPerspectiveLockUntilByPid[pid] ?? -1) : -1;
    const swapPerspectiveLockActive =
        pid !== undefined &&
        swapPerspectiveLockUntil >= mod.GetMatchTimeElapsed() &&
        (stickyTeam === TeamID.Team1 || stickyTeam === TeamID.Team2);

    // During swap lock, keep script-authoritative sticky perspective and ignore transient engine team echoes.
    if (
        !swapPerspectiveLockActive &&
        pid !== undefined &&
        (resolvedTeam === TeamID.Team1 || resolvedTeam === TeamID.Team2)
    ) {
        State.conquest.debug.perspectiveTeamByPid[pid] = resolvedTeam;
    }

    const teamNum = swapPerspectiveLockActive
        ? stickyTeam
        : resolvedTeam === TeamID.Team1 || resolvedTeam === TeamID.Team2
          ? resolvedTeam
          : stickyTeam === TeamID.Team1 || stickyTeam === TeamID.Team2
            ? stickyTeam
            : TeamID.Team1;

    if (teamNum === TeamID.Team2) {
        return { friendlyTeam: TeamID.Team2, enemyTeam: TeamID.Team1 };
    }
    return { friendlyTeam: TeamID.Team1, enemyTeam: TeamID.Team2 };
}

// Returns mapped capture states in stable config-driven order for flag HUD rows.
function conquestPhase3GetOrderedMappedCaptureStates(): ConquestCapturePointRuntimeState[] {
    const ordered: ConquestCapturePointRuntimeState[] = [];
    const ids = State.conquest.capture.mappedObjIdsInOrder;
    for (let i = 0; i < ids.length; i++) {
        const cp = State.conquest.capture.byObjId[ids[i]];
        if (!cp || !cp.mapped) continue;
        ordered.push(cp);
    }
    return ordered;
}

// Returns conquest ticket ratio for bar fill with safe [0..1] clamping.
function conquestPhase3GetTicketBarRatio(currentTickets: number): number {
    const base = Math.max(1, CONQUEST_STARTING_TICKETS);
    return Math.max(0, Math.min(1, currentTickets / base));
}

// Applies mirrored ticket-bar fill:
// - Left bar empties from center toward the outside by shrinking its right edge.
// - Right bar empties from center toward the outside by shrinking its left edge.
function conquestPhase3ApplyTicketBarFill(refs: HudRefs, friendlyTickets: number, enemyTickets: number): void {
    const friendlyRatio = conquestPhase3GetTicketBarRatio(friendlyTickets);
    const enemyRatio = conquestPhase3GetTicketBarRatio(enemyTickets);
    const friendlyWidth =
        friendlyTickets <= 0 ? 0 : Math.max(1, Math.floor(CONQUEST_HUD_TICKET_BAR_WIDTH * friendlyRatio));
    const enemyWidth = enemyTickets <= 0 ? 0 : Math.max(1, Math.floor(CONQUEST_HUD_TICKET_BAR_WIDTH * enemyRatio));

    safeSetUIWidgetVisible(refs.conquestTicketsDebugLeftBarTrack, true);
    safeSetUIWidgetVisible(refs.conquestTicketsDebugRightBarTrack, true);
    // Reapply bright team fill colors every update so temporary style overrides cannot darken the active bars.
    safeSetUIWidgetBgColor(refs.conquestTicketsDebugLeftBarFill, COLOR_BLUE);
    safeSetUIWidgetBgColor(refs.conquestTicketsDebugRightBarFill, COLOR_RED);

    safeSetUIWidgetVisible(refs.conquestTicketsDebugLeftBarFill, friendlyWidth > 0);
    safeSetUIWidgetVisible(refs.conquestTicketsDebugRightBarFill, enemyWidth > 0);

    if (friendlyWidth > 0) {
        safeSetUIWidgetPosition(refs.conquestTicketsDebugLeftBarFill, mod.CreateVector(0, 0, 0));
        safeSetUIWidgetSize(
            refs.conquestTicketsDebugLeftBarFill,
            mod.CreateVector(friendlyWidth, CONQUEST_HUD_TICKET_BAR_HEIGHT, 0)
        );
    }
    if (enemyWidth > 0) {
        safeSetUIWidgetPosition(
            refs.conquestTicketsDebugRightBarFill,
            mod.CreateVector(CONQUEST_HUD_TICKET_BAR_WIDTH - enemyWidth, 0, 0)
        );
        safeSetUIWidgetSize(
            refs.conquestTicketsDebugRightBarFill,
            mod.CreateVector(enemyWidth, CONQUEST_HUD_TICKET_BAR_HEIGHT, 0)
        );
    }
}

// Returns the authoritative global ticket leader from script state.
function conquestPhase3GetTicketLeaderTeam(): TeamID | 0 {
    if (State.conquest.tickets.team1 > State.conquest.tickets.team2) return TeamID.Team1;
    if (State.conquest.tickets.team2 > State.conquest.tickets.team1) return TeamID.Team2;
    return 0;
}

// Computes stacked bleed-chevron counts from ownership differential for one player's team perspective.
// Contract:
// - up to 3 chevrons are shown on the losing/bleeding side (not the advantaged side)
// - no chevrons are shown when bleed is disabled, pre-live, or objective control is tied
function conquestPhase3GetBleedChevronCountsForPerspective(
    friendlyTeam: TeamID,
    enemyTeam: TeamID
): { leftCount: number; rightCount: number } {
    if (!isMatchLive()) return { leftCount: 0, rightCount: 0 };
    if (!State.conquest.bleed.enabled) return { leftCount: 0, rightCount: 0 };

    const ownership = conquestPhase2AGetOwnershipCounts();
    const diff = ownership.team1Owned - ownership.team2Owned;
    if (diff === 0) return { leftCount: 0, rightCount: 0 };

    const losingTeam = diff > 0 ? TeamID.Team2 : TeamID.Team1;
    const magnitude = Math.max(0, Math.min(CONQUEST_HUD_TICKET_BLEED_CHEVRON_COUNT, Math.abs(diff)));
    if (losingTeam === friendlyTeam) {
        return { leftCount: magnitude, rightCount: 0 };
    }
    if (losingTeam === enemyTeam) {
        return { leftCount: 0, rightCount: magnitude };
    }
    return { leftCount: 0, rightCount: 0 };
}

// Applies bleed-chevron stack visibility using script-authoritative differential state.
function conquestPhase3ApplyTicketBleedIndicators(refs: HudRefs, friendlyTeam: TeamID, enemyTeam: TeamID): void {
    const leftChevrons = refs.conquestTicketsBleedLeftChevrons ?? [];
    const rightChevrons = refs.conquestTicketsBleedRightChevrons ?? [];
    const counts = conquestPhase3GetBleedChevronCountsForPerspective(friendlyTeam, enemyTeam);
    // Chevron stack visibility rules:
    // - 3 visible: keep default top-to-bottom stack (0,1,2)
    // - 2 visible: use contiguous top/mid stack (0,1) for even visual spacing with this glyph/font.
    // - 1 visible: use center slot (1), aligned with ticket text lane.
    const isChevronIndexVisible = (index: number, count: number): boolean => {
        if (count <= 0) return false;
        if (count === 1) return index === 1;
        if (count === 2) return index < 2;
        return index < CONQUEST_HUD_TICKET_BLEED_CHEVRON_COUNT;
    };
    for (let chevronIndex = 0; chevronIndex < CONQUEST_HUD_TICKET_BLEED_CHEVRON_COUNT; chevronIndex++) {
        safeSetUIWidgetVisible(leftChevrons[chevronIndex], isChevronIndexVisible(chevronIndex, counts.leftCount));
        safeSetUIWidgetVisible(rightChevrons[chevronIndex], isChevronIndexVisible(chevronIndex, counts.rightCount));
        safeSetUITextColor(leftChevrons[chevronIndex], COLOR_BLUE);
        safeSetUITextColor(rightChevrons[chevronIndex], COLOR_RED);
    }
}

// Applies winner indicators to ticket counters using script-authoritative leader state.
// - Exactly one side can show crown+border while leading.
// - Ties force-hide both sides.
// - Visibility is written through cached refs only to avoid cross-instance drift.
function conquestPhase3ApplyTicketLeadIndicators(
    refs: HudRefs,
    friendlyTeam: TeamID,
    enemyTeam: TeamID,
    leaderTeam: TeamID | 0
): void {
    const showLeftLead = leaderTeam !== 0 && leaderTeam === friendlyTeam;
    const showRightLead = leaderTeam !== 0 && leaderTeam === enemyTeam;

    safeSetUIWidgetVisible(refs.conquestTicketsLeadLeftBorder, false);
    safeSetUIWidgetVisible(refs.conquestTicketsLeadRightBorder, false);
    safeSetUIWidgetVisible(refs.conquestTicketsLeadLeftCrown, false);
    safeSetUIWidgetVisible(refs.conquestTicketsLeadRightCrown, false);

    if (showLeftLead) {
        safeSetUIWidgetBgColor(refs.conquestTicketsLeadLeftBorder, COLOR_BLUE);
        safeSetUIWidgetVisible(refs.conquestTicketsLeadLeftBorder, true);
        safeSetUIWidgetVisible(refs.conquestTicketsLeadLeftCrown, true);
    } else if (showRightLead) {
        safeSetUIWidgetBgColor(refs.conquestTicketsLeadRightBorder, COLOR_RED);
        safeSetUIWidgetVisible(refs.conquestTicketsLeadRightBorder, true);
        safeSetUIWidgetVisible(refs.conquestTicketsLeadRightCrown, true);
    }
}

// Returns centered slot indices for N visible flags across a fixed slot row.
function conquestPhase3GetCenteredFlagSlots(flagCount: number, maxSlots: number): number[] {
    const clamped = Math.max(0, Math.min(flagCount, maxSlots));
    if (clamped <= 0) return [];
    const start = Math.floor((maxSlots - clamped) / 2);
    const indices: number[] = [];
    for (let i = 0; i < clamped; i++) {
        indices.push(start + i);
    }
    return indices;
}

// Resolves a deterministic fallback letter token when map config labels are missing.
function conquestPhase3GetFallbackFlagToken(row: number): string {
    if (row === 0) return 'A';
    if (row === 1) return 'B';
    if (row === 2) return 'C';
    if (row === 3) return 'D';
    if (row === 4) return 'E';
    if (row === 5) return 'F';
    if (row === 6) return 'G';
    return '?';
}

// Maps capture-point labels to explicit localized string keys (A..G or unknown).
function conquestPhase3GetFlagLetterStringKey(cp: ConquestCapturePointRuntimeState, row: number): number {
    const raw = (cp.label && cp.label.length > 0 ? cp.label : conquestPhase3GetFallbackFlagToken(row)).toUpperCase();
    if (raw === 'A') return STR_HUD_CONQUEST_FLAG_LETTER_A;
    if (raw === 'B') return STR_HUD_CONQUEST_FLAG_LETTER_B;
    if (raw === 'C') return STR_HUD_CONQUEST_FLAG_LETTER_C;
    if (raw === 'D') return STR_HUD_CONQUEST_FLAG_LETTER_D;
    if (raw === 'E') return STR_HUD_CONQUEST_FLAG_LETTER_E;
    if (raw === 'F') return STR_HUD_CONQUEST_FLAG_LETTER_F;
    if (raw === 'G') return STR_HUD_CONQUEST_FLAG_LETTER_G;
    return STR_HUD_CONQUEST_FLAG_LETTER_UNKNOWN;
}

// Hides stale legacy per-flag triplet widgets from earlier HUD layouts.
function conquestPhase3HideLegacyFlagTripletWidgets(pid: number): void {
    const legacyRows = 7;
    for (let i = 0; i < legacyRows; i++) {
        safeSetUIWidgetVisible(safeFind(`ConquestFlagFriendly_${pid}_${i}`), false);
        safeSetUIWidgetVisible(safeFind(`ConquestFlagCenter_${pid}_${i}`), false);
        safeSetUIWidgetVisible(safeFind(`ConquestFlagEnemy_${pid}_${i}`), false);
    }
}

// Hides legacy conquest roots so V2 HUD roots are the only visible ticket/flag layers.
function conquestPhase3HideLegacyConquestRoots(pid: number): void {
    safeSetUIWidgetVisible(safeFind(`ConquestTicketsDebugRoot_${pid}`), false);
    safeSetUIWidgetVisible(safeFind(`ConquestFlagsDebugRoot_${pid}`), false);
}

// Creates the default script-authoritative visual state for one flag.
function conquestPhase3CreateDefaultFlagVisualState(sampleTick: number): ConquestFlagVisualRuntimeState {
    return {
        phase: 'NEUTRAL_IDLE',
        ownerTeam: 0,
        activeTeam: 0,
        progress01: 0,
        ownerRemaining01: 0,
        suppressOwnerUntilRecaptured: false,
        neutralizationLatchUntilTick: -1,
        lastPhase: 'NEUTRAL_IDLE',
        lastPhaseChangeTick: sampleTick,
        sampleTick,
    };
}

// Ensures a visual state record exists for one flag and returns it.
function conquestPhase3EnsureFlagVisualState(objId: number, sampleTick: number): ConquestFlagVisualRuntimeState {
    const existing = State.conquest.capture.visualByObjId[objId];
    if (existing) {
        if (existing.suppressOwnerUntilRecaptured === undefined) {
            existing.suppressOwnerUntilRecaptured = false;
        }
        return existing;
    }
    const created = conquestPhase3CreateDefaultFlagVisualState(sampleTick);
    State.conquest.capture.visualByObjId[objId] = created;
    return created;
}

// Normalizes raw capture ownership/progress into a stable visual sample for FSM transitions.
function conquestPhase3NormalizeVisualSample(
    cp: ConquestCapturePointRuntimeState,
    previousVisual: ConquestFlagVisualRuntimeState,
    sampleTick: number
): ConquestFlagVisualSample {
    const totalOnPoint = cp.onPointTeam1 + cp.onPointTeam2;
    const progressRaw = Math.max(0, Math.min(1, cp.progress01));
    const progress01 =
        progressRaw <= CONQUEST_FLAG_PROGRESS_DEADBAND_LOW
            ? 0
            : progressRaw >= CONQUEST_FLAG_PROGRESS_DEADBAND_HIGH
              ? 1
              : progressRaw;

    if (cp.ownerTeam === 0 && totalOnPoint <= 0 && progress01 <= CONQUEST_FLAG_PHASE_TRANSITION_LOW) {
        // Neutral + uncontested with only residual progress noise should snap fully back to neutral.
        // Keep meaningful neutral progress samples so off-point viewers still receive authoritative updates.
        return {
            ownerTeam: 0,
            activeTeam: 0,
            progress01: 0,
            sampleTick,
        };
    }

    let activeTeam: TeamID | 0 = cp.ownerProgressTeam;
    if (activeTeam === 0 && progress01 > 0) {
        // Preserve prior contest/capture context when engine drops progress team transiently.
        if (
            previousVisual.activeTeam !== 0 &&
            (previousVisual.phase === 'OWNED_CONTESTED_DRAIN' ||
                previousVisual.phase === 'OWNED_CONTESTED_RECOVER' ||
                previousVisual.phase === 'NEUTRAL_CAPTURING' ||
                previousVisual.phase === 'NEUTRALIZED_LATCH')
        ) {
            activeTeam = previousVisual.activeTeam;
        } else if (
            cp.ownerTeam !== 0 &&
            progress01 >= CONQUEST_FLAG_PHASE_TRANSITION_HIGH &&
            previousVisual.phase === 'OWNED_STABLE'
        ) {
            // Stable owned state may report progress team as 0; keep owner affinity only in this case.
            activeTeam = cp.ownerTeam;
        }
    }
    if (cp.ownerTeam === 0 && progress01 === 0) {
        activeTeam = 0;
    }

    let ownerTeam: TeamID | 0 = cp.ownerTeam;
    if (
        ownerTeam !== 0 &&
        previousVisual.phase === 'NEUTRALIZED_LATCH' &&
        progress01 < CONQUEST_FLAG_PHASE_TRANSITION_HIGH
    ) {
        // After neutralization, suppress stale engine owner reads until the next ownership is materially established.
        ownerTeam = 0;
    }
    if (
        ownerTeam !== 0 &&
        activeTeam !== 0 &&
        activeTeam !== ownerTeam &&
        (previousVisual.phase === 'NEUTRAL_IDLE' ||
            previousVisual.phase === 'NEUTRAL_CAPTURING' ||
            previousVisual.phase === 'NEUTRALIZED_LATCH' ||
            (previousVisual.phase === 'OWNED_CONTESTED_DRAIN' &&
                previousVisual.ownerRemaining01 <= CONQUEST_FLAG_PHASE_TRANSITION_LOW))
    ) {
        // Once a point has effectively neutralized, stale engine owner reads must not restore owner-border visuals.
        // Treat subsequent mixed owner/progress ticks as neutral capture flow until ownership is re-established.
        ownerTeam = 0;
    }
    // Hard owner-echo suppression:
    // once neutralization is reached, keep owner off (no border) until a full recapture confirmation is observed.
    if (
        previousVisual.suppressOwnerUntilRecaptured &&
        !(ownerTeam !== 0 && activeTeam === ownerTeam && progress01 >= CONQUEST_FLAG_PHASE_TRANSITION_HIGH)
    ) {
        ownerTeam = 0;
    }

    return {
        ownerTeam,
        activeTeam,
        progress01,
        sampleTick,
    };
}

// Verifies whether a viewer is currently inside the radius of a specific mapped capture point.
function conquestPhase3IsViewerOnCapturePoint(viewer: mod.Player, objId: number): boolean {
    if (!viewer || !mod.IsPlayerValid(viewer) || !isPlayerDeployed(viewer)) return false;
    const viewerPid = safeGetPlayerId(viewer);
    if (viewerPid === undefined) return false;
    try {
        const cp = mod.GetCapturePoint(objId);
        if (!cp) return false;
        const playersOnPoint = mod.GetPlayersOnPoint(cp);
        const playerCount = mod.CountOf(playersOnPoint);
        for (let i = 0; i < playerCount; i++) {
            const pointPlayer = mod.ValueInArray(playersOnPoint, i) as mod.Player;
            if (!pointPlayer || !mod.IsPlayerValid(pointPlayer)) continue;
            if (safeGetPlayerId(pointPlayer) === viewerPid) return true;
        }
    } catch {
        return false;
    }
    return false;
}

// Resolves the next flag visual phase from normalized sample + previous phase state.
function conquestPhase3ResolveFlagVisualState(
    sample: ConquestFlagVisualSample,
    previousVisual: ConquestFlagVisualRuntimeState
): ConquestFlagVisualRuntimeState {
    let phase: ConquestFlagVisualPhase = previousVisual.phase;
    let ownerRemaining01 = previousVisual.ownerRemaining01;
    let neutralizationLatchUntilTick = previousVisual.neutralizationLatchUntilTick;
    let suppressOwnerUntilRecaptured = previousVisual.suppressOwnerUntilRecaptured;
    const neutralWrapDetected =
        sample.ownerTeam !== 0 &&
        sample.activeTeam !== 0 &&
        sample.activeTeam !== sample.ownerTeam &&
        sample.progress01 <= CONQUEST_FLAG_PHASE_TRANSITION_LOW &&
        (previousVisual.phase === 'NEUTRALIZED_LATCH' ||
            (previousVisual.phase === 'OWNED_CONTESTED_DRAIN' &&
                previousVisual.ownerRemaining01 <= CONQUEST_FLAG_PHASE_TRANSITION_LOW) ||
            (previousVisual.lastPhase === 'OWNED_CONTESTED_DRAIN' &&
                previousVisual.ownerRemaining01 <= CONQUEST_FLAG_PHASE_TRANSITION_LOW));

    if (sample.sampleTick <= neutralizationLatchUntilTick) {
        phase = 'NEUTRALIZED_LATCH';
        ownerRemaining01 = 0;
        suppressOwnerUntilRecaptured = true;
    } else if (neutralWrapDetected) {
        // Some capture flows wrap progress after neutralization while owner still echoes previous team.
        // Treat this as neutral capturing and keep owner visuals suppressed until full recapture confirmation.
        phase = 'NEUTRAL_CAPTURING';
        ownerRemaining01 = 0;
        suppressOwnerUntilRecaptured = true;
        neutralizationLatchUntilTick = -1;
    } else if (sample.ownerTeam !== 0 && sample.progress01 === 0) {
        // Owner-lag guard: if owner is still reported but progress is neutral, force neutralized visuals.
        phase = 'NEUTRALIZED_LATCH';
        ownerRemaining01 = 0;
        neutralizationLatchUntilTick = sample.sampleTick + CONQUEST_FLAG_NEUTRALIZATION_LATCH_TICKS;
        suppressOwnerUntilRecaptured = true;
    } else if (
        sample.ownerTeam !== 0 &&
        sample.activeTeam === 0 &&
        sample.progress01 <= CONQUEST_FLAG_PHASE_TRANSITION_LOW &&
        (previousVisual.phase === 'OWNED_CONTESTED_DRAIN' ||
            previousVisual.lastPhase === 'OWNED_CONTESTED_DRAIN' ||
            previousVisual.phase === 'NEUTRALIZED_LATCH')
    ) {
        // Neutralization completion fallback:
        // when owner/progress signals stall around zero after drain, keep neutral visuals with no border.
        phase = 'NEUTRALIZED_LATCH';
        ownerRemaining01 = 0;
        neutralizationLatchUntilTick = sample.sampleTick + CONQUEST_FLAG_NEUTRALIZATION_LATCH_TICKS;
        suppressOwnerUntilRecaptured = true;
    } else if (
        sample.ownerTeam !== 0 &&
        sample.activeTeam === 0 &&
        sample.progress01 >= CONQUEST_FLAG_PHASE_TRANSITION_HIGH &&
        (previousVisual.phase === 'OWNED_CONTESTED_DRAIN' ||
            previousVisual.lastPhase === 'OWNED_CONTESTED_DRAIN' ||
            previousVisual.phase === 'NEUTRALIZED_LATCH')
    ) {
        // Neutralization high-edge fallback:
        // prevent one-frame snap back to owner visuals when progress reports high before owner clears.
        phase = 'NEUTRALIZED_LATCH';
        ownerRemaining01 = 0;
        neutralizationLatchUntilTick = sample.sampleTick + CONQUEST_FLAG_NEUTRALIZATION_LATCH_TICKS;
        suppressOwnerUntilRecaptured = true;
    } else if (sample.ownerTeam === 0 && sample.progress01 === 0) {
        phase = 'NEUTRAL_IDLE';
        ownerRemaining01 = 0;
    } else if (sample.ownerTeam === 0 && sample.progress01 > 0 && sample.activeTeam !== 0) {
        phase = 'NEUTRAL_CAPTURING';
        ownerRemaining01 = 0;
    } else if (
        sample.ownerTeam !== 0 &&
        sample.activeTeam === 0 &&
        sample.progress01 > CONQUEST_FLAG_PHASE_TRANSITION_LOW &&
        sample.progress01 < CONQUEST_FLAG_PHASE_TRANSITION_HIGH
    ) {
        // Engine sometimes drops progress-team to 0 mid-contest.
        // Preserve prior drain/recover intent rather than snapping to neutral/owned visuals.
        if (previousVisual.phase === 'OWNED_CONTESTED_DRAIN' || previousVisual.lastPhase === 'OWNED_CONTESTED_DRAIN') {
            phase = 'OWNED_CONTESTED_DRAIN';
            ownerRemaining01 = Math.max(0, Math.min(1, 1 - sample.progress01));
        } else {
            phase = 'OWNED_CONTESTED_RECOVER';
            ownerRemaining01 = sample.progress01;
        }
    } else if (sample.ownerTeam !== 0 && sample.activeTeam !== 0 && sample.activeTeam !== sample.ownerTeam) {
        ownerRemaining01 = Math.max(0, Math.min(1, 1 - sample.progress01));
        if (ownerRemaining01 <= CONQUEST_FLAG_PHASE_TRANSITION_LOW) {
            phase = 'NEUTRALIZED_LATCH';
            ownerRemaining01 = 0;
            neutralizationLatchUntilTick = sample.sampleTick + CONQUEST_FLAG_NEUTRALIZATION_LATCH_TICKS;
            suppressOwnerUntilRecaptured = true;
        } else {
            phase = 'OWNED_CONTESTED_DRAIN';
        }
    } else if (
        sample.ownerTeam !== 0 &&
        sample.activeTeam === sample.ownerTeam &&
        sample.progress01 <= CONQUEST_FLAG_PHASE_TRANSITION_LOW &&
        (previousVisual.phase === 'OWNED_CONTESTED_DRAIN' ||
            previousVisual.lastPhase === 'OWNED_CONTESTED_DRAIN' ||
            previousVisual.phase === 'NEUTRALIZED_LATCH')
    ) {
        // Stale owner echo guard:
        // after a drain reaches neutral edge, engine can briefly report owner+ownerProgress with near-zero progress.
        // Keep neutralized state (no border) until ownership is truly re-established.
        phase = 'NEUTRALIZED_LATCH';
        ownerRemaining01 = 0;
        neutralizationLatchUntilTick = sample.sampleTick + CONQUEST_FLAG_NEUTRALIZATION_LATCH_TICKS;
        suppressOwnerUntilRecaptured = true;
    } else if (
        sample.ownerTeam !== 0 &&
        sample.activeTeam === sample.ownerTeam &&
        sample.progress01 < CONQUEST_FLAG_PHASE_TRANSITION_HIGH
    ) {
        phase = 'OWNED_CONTESTED_RECOVER';
        ownerRemaining01 = sample.progress01;
    } else if (
        (previousVisual.phase === 'NEUTRALIZED_LATCH' ||
            (previousVisual.phase === 'OWNED_CONTESTED_DRAIN' &&
                previousVisual.ownerRemaining01 <= CONQUEST_FLAG_PHASE_TRANSITION_LOW)) &&
        sample.ownerTeam !== 0 &&
        sample.progress01 >= CONQUEST_FLAG_PHASE_TRANSITION_HIGH &&
        (sample.activeTeam === 0 || sample.activeTeam === sample.ownerTeam)
    ) {
        // Neutralization-edge guard:
        // if ownership lags by a tick after near-complete drain, keep neutralized visuals
        // instead of momentarily restoring full owner visuals.
        phase = 'NEUTRALIZED_LATCH';
        ownerRemaining01 = 0;
        neutralizationLatchUntilTick = sample.sampleTick + CONQUEST_FLAG_NEUTRALIZATION_LATCH_TICKS;
        suppressOwnerUntilRecaptured = true;
    } else if (
        sample.ownerTeam !== 0 &&
        sample.activeTeam === sample.ownerTeam &&
        sample.progress01 >= CONQUEST_FLAG_PHASE_TRANSITION_HIGH
    ) {
        phase = 'OWNED_STABLE';
        ownerRemaining01 = 1;
        suppressOwnerUntilRecaptured = false;
    } else {
        phase = 'NEUTRAL_IDLE';
        ownerRemaining01 = 0;
    }

    const phaseChanged = phase !== previousVisual.phase;
    const clampedOwnerRemaining01 = Math.max(0, Math.min(1, ownerRemaining01));
    return {
        phase,
        ownerTeam: sample.ownerTeam,
        activeTeam: sample.activeTeam,
        progress01: sample.progress01,
        ownerRemaining01: clampedOwnerRemaining01,
        suppressOwnerUntilRecaptured,
        neutralizationLatchUntilTick,
        lastPhase: phaseChanged ? previousVisual.phase : previousVisual.lastPhase,
        lastPhaseChangeTick: phaseChanged ? sample.sampleTick : previousVisual.lastPhaseChangeTick,
        sampleTick: sample.sampleTick,
    };
}

// Compares two visual state snapshots and returns true when any render-relevant field differs.
function conquestPhase3HasVisualStateChanged(
    previousVisual: ConquestFlagVisualRuntimeState,
    nextVisual: ConquestFlagVisualRuntimeState
): boolean {
    return (
        previousVisual.phase !== nextVisual.phase ||
        previousVisual.ownerTeam !== nextVisual.ownerTeam ||
        previousVisual.activeTeam !== nextVisual.activeTeam ||
        Math.abs(previousVisual.progress01 - nextVisual.progress01) >= 0.001 ||
        Math.abs(previousVisual.ownerRemaining01 - nextVisual.ownerRemaining01) >= 0.001 ||
        previousVisual.suppressOwnerUntilRecaptured !== nextVisual.suppressOwnerUntilRecaptured ||
        previousVisual.neutralizationLatchUntilTick !== nextVisual.neutralizationLatchUntilTick
    );
}

// Refreshes and stores script-authoritative visual state for one flag from current capture state.
function conquestPhase3RefreshFlagVisualState(cp: ConquestCapturePointRuntimeState): ConquestFlagVisualRuntimeState {
    const sampleTick = Math.floor(mod.GetMatchTimeElapsed() * 10);
    const previousVisual = conquestPhase3EnsureFlagVisualState(cp.objId, sampleTick);
    const sample = conquestPhase3NormalizeVisualSample(cp, previousVisual, sampleTick);
    const nextVisual = conquestPhase3ResolveFlagVisualState(sample, previousVisual);
    State.conquest.capture.visualByObjId[cp.objId] = nextVisual;
    return nextVisual;
}

// Resolves final flag widget colors/fills from script-authoritative visual phase + viewer perspective.
function conquestPhase3GetFlagSlotVisual(
    visualState: ConquestFlagVisualRuntimeState,
    friendlyTeam: TeamID,
    enemyTeam: TeamID
): {
    slotBgColor: mod.Vector;
    fillColor?: mod.Vector;
    fillRatio: number;
    labelColor: mod.Vector;
} {
    const neutralBg = mod.CreateVector(
        CONQUEST_HUD_FLAG_SLOT_TRACK_RGB[0],
        CONQUEST_HUD_FLAG_SLOT_TRACK_RGB[1],
        CONQUEST_HUD_FLAG_SLOT_TRACK_RGB[2]
    );
    const contestBg = mod.CreateVector(
        CONQUEST_HUD_FLAG_SLOT_CONTEST_BG_RGB[0],
        CONQUEST_HUD_FLAG_SLOT_CONTEST_BG_RGB[1],
        CONQUEST_HUD_FLAG_SLOT_CONTEST_BG_RGB[2]
    );
    const labelOwned = mod.CreateVector(
        CONQUEST_HUD_FLAG_LABEL_OWNED_RGB[0],
        CONQUEST_HUD_FLAG_LABEL_OWNED_RGB[1],
        CONQUEST_HUD_FLAG_LABEL_OWNED_RGB[2]
    );
    const labelNeutral = mod.CreateVector(
        CONQUEST_HUD_FLAG_LABEL_NEUTRAL_RGB[0],
        CONQUEST_HUD_FLAG_LABEL_NEUTRAL_RGB[1],
        CONQUEST_HUD_FLAG_LABEL_NEUTRAL_RGB[2]
    );

    const getTeamBrightColor = (team: TeamID | 0): mod.Vector | undefined => {
        if (team === friendlyTeam) {
            return mod.CreateVector(
                CONQUEST_HUD_TEXT_FRIENDLY_RGB[0],
                CONQUEST_HUD_TEXT_FRIENDLY_RGB[1],
                CONQUEST_HUD_TEXT_FRIENDLY_RGB[2]
            );
        }
        if (team === enemyTeam) {
            return mod.CreateVector(
                CONQUEST_HUD_TEXT_ENEMY_RGB[0],
                CONQUEST_HUD_TEXT_ENEMY_RGB[1],
                CONQUEST_HUD_TEXT_ENEMY_RGB[2]
            );
        }
        return undefined;
    };
    const getTeamDarkColor = (team: TeamID | 0): mod.Vector | undefined => {
        if (team === friendlyTeam) {
            return mod.CreateVector(
                CONQUEST_HUD_FLAG_SLOT_FRIENDLY_FILL_RGB[0],
                CONQUEST_HUD_FLAG_SLOT_FRIENDLY_FILL_RGB[1],
                CONQUEST_HUD_FLAG_SLOT_FRIENDLY_FILL_RGB[2]
            );
        }
        if (team === enemyTeam) {
            return mod.CreateVector(
                CONQUEST_HUD_FLAG_SLOT_ENEMY_FILL_RGB[0],
                CONQUEST_HUD_FLAG_SLOT_ENEMY_FILL_RGB[1],
                CONQUEST_HUD_FLAG_SLOT_ENEMY_FILL_RGB[2]
            );
        }
        return undefined;
    };

    const ownerBright = getTeamBrightColor(visualState.ownerTeam);
    const ownerDark = getTeamDarkColor(visualState.ownerTeam);
    const activeBright = getTeamBrightColor(visualState.activeTeam);

    if (
        visualState.phase === 'NEUTRALIZED_LATCH' ||
        (visualState.activeTeam === 0 && visualState.progress01 <= CONQUEST_FLAG_PHASE_TRANSITION_LOW)
    ) {
        return {
            slotBgColor: neutralBg,
            fillRatio: 0,
            labelColor: labelNeutral,
        };
    }

    if (visualState.phase === 'OWNED_STABLE' && ownerBright && ownerDark) {
        return {
            slotBgColor: ownerDark,
            fillColor: ownerDark,
            fillRatio: 1,
            // Owned: center letter takes owning team bright color.
            labelColor: ownerBright,
        };
    }

    if (visualState.phase === 'OWNED_CONTESTED_DRAIN' && ownerBright) {
        return {
            slotBgColor: contestBg,
            fillColor: ownerBright,
            fillRatio: Math.max(0, Math.min(1, visualState.ownerRemaining01)),
            // Contested: center letter is white.
            labelColor: labelOwned,
        };
    }

    if (visualState.phase === 'OWNED_CONTESTED_RECOVER' && ownerBright) {
        return {
            slotBgColor: contestBg,
            fillColor: ownerBright,
            fillRatio: Math.max(0, Math.min(1, visualState.progress01)),
            // Contested: center letter is white.
            labelColor: labelOwned,
        };
    }

    if (visualState.phase === 'NEUTRAL_CAPTURING' && activeBright) {
        return {
            slotBgColor: neutralBg,
            fillColor: activeBright,
            fillRatio: Math.max(0, Math.min(1, visualState.progress01)),
            labelColor: labelNeutral,
        };
    }

    return {
        slotBgColor: neutralBg,
        fillRatio: 0,
        labelColor: labelNeutral,
    };
}

// Resolves percentage text visibility/value/color from the same script-authoritative flag visual state.
function conquestPhase3GetFlagPercentDisplay(
    visualState: ConquestFlagVisualRuntimeState,
    friendlyTeam: TeamID,
    enemyTeam: TeamID
): ConquestFlagPercentDisplay {
    const getTeamBrightColor = (team: TeamID | 0): mod.Vector | undefined => {
        if (team === friendlyTeam) {
            return mod.CreateVector(
                CONQUEST_HUD_TEXT_FRIENDLY_RGB[0],
                CONQUEST_HUD_TEXT_FRIENDLY_RGB[1],
                CONQUEST_HUD_TEXT_FRIENDLY_RGB[2]
            );
        }
        if (team === enemyTeam) {
            return mod.CreateVector(
                CONQUEST_HUD_TEXT_ENEMY_RGB[0],
                CONQUEST_HUD_TEXT_ENEMY_RGB[1],
                CONQUEST_HUD_TEXT_ENEMY_RGB[2]
            );
        }
        return undefined;
    };

    const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));
    const neutralWhite = mod.CreateVector(
        CONQUEST_HUD_TEXT_NEUTRAL_RGB[0],
        CONQUEST_HUD_TEXT_NEUTRAL_RGB[1],
        CONQUEST_HUD_TEXT_NEUTRAL_RGB[2]
    );
    const ownerBright = getTeamBrightColor(visualState.ownerTeam);
    const activeBright = getTeamBrightColor(visualState.activeTeam);

    if (visualState.phase === 'OWNED_CONTESTED_DRAIN') {
        return {
            visible: true,
            value01: clamp01(visualState.ownerRemaining01),
            color: ownerBright ?? neutralWhite,
        };
    }

    if (visualState.phase === 'OWNED_CONTESTED_RECOVER') {
        return {
            visible: true,
            value01: clamp01(visualState.progress01),
            color: ownerBright ?? neutralWhite,
        };
    }

    if (visualState.phase === 'NEUTRAL_CAPTURING') {
        return {
            visible: true,
            value01: clamp01(visualState.progress01),
            color: activeBright ?? neutralWhite,
        };
    }
    if (visualState.phase === 'NEUTRALIZED_LATCH' && visualState.progress01 > 0) {
        return {
            visible: true,
            value01: clamp01(visualState.progress01),
            color: neutralWhite,
        };
    }

    return {
        visible: false,
        value01: 0,
    };
}

// Resolves engagement status text for the viewer from owner + on-point differential.
function conquestPhase3GetEngageStatusKey(
    ownerTeam: TeamID | 0,
    friendlyTeam: TeamID,
    friendlyCount: number,
    enemyCount: number
): number {
    const friendlyAdvantage = friendlyCount > enemyCount;
    if (ownerTeam === friendlyTeam && friendlyAdvantage) {
        return STR_HUD_CONQUEST_CAPTURE_STATUS_DEFEND;
    }
    if (friendlyAdvantage) {
        if (ownerTeam !== 0 && ownerTeam !== friendlyTeam) {
            return STR_HUD_CONQUEST_CAPTURE_STATUS_NEUTRALIZING;
        }
        return STR_HUD_CONQUEST_CAPTURE_STATUS_CAPTURING;
    }
    return STR_HUD_CONQUEST_CAPTURE_STATUS_CONTESTING;
}

// Builds script-authoritative engagement panel data for one viewer.
function conquestPhase3GetFlagEngageDisplayForViewer(
    viewer: mod.Player,
    pid: number,
    friendlyTeam: TeamID,
    enemyTeam: TeamID
): ConquestFlagEngageDisplay {
    if (!State.players.deployedByPid[pid]) {
        return {
            visible: false,
            friendlyCount: 0,
            enemyCount: 0,
            friendlyRatio: 0,
            enemyRatio: 0,
            statusKey: STR_HUD_CONQUEST_CAPTURE_STATUS_CONTESTING,
        };
    }
    const swapPerspectiveLockUntil = State.conquest.debug.teamSwapPerspectiveLockUntilByPid[pid] ?? -1;
    if (swapPerspectiveLockUntil >= mod.GetMatchTimeElapsed()) {
        return {
            visible: false,
            friendlyCount: 0,
            enemyCount: 0,
            friendlyRatio: 0,
            enemyRatio: 0,
            statusKey: STR_HUD_CONQUEST_CAPTURE_STATUS_CONTESTING,
        };
    }
    const activeObjId = State.conquest.capture.engagedObjIdByPid[pid];
    if (activeObjId === undefined) {
        return {
            visible: false,
            friendlyCount: 0,
            enemyCount: 0,
            friendlyRatio: 0,
            enemyRatio: 0,
            statusKey: STR_HUD_CONQUEST_CAPTURE_STATUS_CONTESTING,
        };
    }
    if (!conquestPhase3IsViewerOnCapturePoint(viewer, activeObjId)) {
        return {
            visible: false,
            friendlyCount: 0,
            enemyCount: 0,
            friendlyRatio: 0,
            enemyRatio: 0,
            statusKey: STR_HUD_CONQUEST_CAPTURE_STATUS_CONTESTING,
        };
    }

    const cp = State.conquest.capture.byObjId[activeObjId];
    if (!cp || !cp.mapped) {
        return {
            visible: false,
            friendlyCount: 0,
            enemyCount: 0,
            friendlyRatio: 0,
            enemyRatio: 0,
            statusKey: STR_HUD_CONQUEST_CAPTURE_STATUS_CONTESTING,
        };
    }

    const friendlyCount = friendlyTeam === TeamID.Team1 ? cp.onPointTeam1 : cp.onPointTeam2;
    const enemyCount = enemyTeam === TeamID.Team1 ? cp.onPointTeam1 : cp.onPointTeam2;
    const total = friendlyCount + enemyCount;
    if (total <= 0 || friendlyCount <= 0) {
        return {
            visible: false,
            friendlyCount,
            enemyCount,
            friendlyRatio: 0,
            enemyRatio: 0,
            statusKey: STR_HUD_CONQUEST_CAPTURE_STATUS_CONTESTING,
        };
    }

    const friendlyRatio = Math.max(0, Math.min(1, friendlyCount / total));
    const enemyRatio = Math.max(0, Math.min(1, enemyCount / total));
    const statusKey = conquestPhase3GetEngageStatusKey(cp.ownerTeam, friendlyTeam, friendlyCount, enemyCount);
    return {
        visible: true,
        friendlyCount,
        enemyCount,
        friendlyRatio,
        enemyRatio,
        statusKey,
    };
}

// Returns mapped capture configs in deterministic display/evaluation order.
function conquestPhase2AGetMappedConfigsInOrder(): CapturePointConfig[] {
    const copy = [...ACTIVE_CAPTURE_POINT_CONFIGS];
    copy.sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order;
        return a.objId - b.objId;
    });
    return copy;
}

// Rebuilds authoritative mapped capture index from active map config.
function conquestPhase2ABuildMappedCaptureIndexFromConfig(): void {
    const ordered = conquestPhase2AGetMappedConfigsInOrder();
    State.conquest.capture.mappedObjIdsInOrder = [];
    for (let i = 0; i < ordered.length; i++) {
        const cfg = ordered[i];
        State.conquest.capture.mappedObjIdsInOrder.push(cfg.objId);
        State.conquest.capture.byObjId[cfg.objId] = {
            objId: cfg.objId,
            label: cfg.label,
            order: cfg.order,
            mapped: true,
            ownerLatchedByEvent: false,
            ownerTeam: 0,
            ownerProgressTeam: 0,
            progress01: 0,
            onPointTeam1: 0,
            onPointTeam2: 0,
            lastUpdatedAtSeconds: -1,
        };
        const sampleTick = Math.floor(mod.GetMatchTimeElapsed() * 10);
        State.conquest.capture.visualByObjId[cfg.objId] = conquestPhase3CreateDefaultFlagVisualState(sampleTick);
    }
}

// Ensures runtime capture state exists for a capture-point ObjId and tracks unmapped sightings.
function conquestPhase2AEnsureCaptureState(objId: number): ConquestCapturePointRuntimeState {
    const existing = State.conquest.capture.byObjId[objId];
    if (existing) return existing;
    const cfg = getActiveCapturePointConfigByObjId(objId);
    const next: ConquestCapturePointRuntimeState = {
        objId,
        label: cfg?.label ?? '',
        order: cfg?.order ?? 9999,
        mapped: !!cfg,
        ownerLatchedByEvent: false,
        ownerTeam: 0,
        ownerProgressTeam: 0,
        progress01: 0,
        onPointTeam1: 0,
        onPointTeam2: 0,
        lastUpdatedAtSeconds: -1,
    };
    State.conquest.capture.byObjId[objId] = next;
    const sampleTick = Math.floor(mod.GetMatchTimeElapsed() * 10);
    conquestPhase3EnsureFlagVisualState(objId, sampleTick);
    if (!cfg) {
        State.conquest.capture.unmappedSeenCount += 1;
        State.conquest.capture.lastUnmappedObjId = objId;
    } else if (State.conquest.capture.mappedObjIdsInOrder.indexOf(objId) === -1) {
        State.conquest.capture.mappedObjIdsInOrder.push(objId);
        State.conquest.capture.mappedObjIdsInOrder.sort((a, b) => {
            const ac = State.conquest.capture.byObjId[a];
            const bc = State.conquest.capture.byObjId[b];
            if ((ac?.order ?? 9999) !== (bc?.order ?? 9999)) return (ac?.order ?? 9999) - (bc?.order ?? 9999);
            return a - b;
        });
    }
    return next;
}

// Clears capture-timing application cache so the current map's capture points are reconfigured deterministically.
function conquestPhase2AResetCaptureTimingConfigCache(): void {
    const keys = Object.keys(conquestPhase2ACaptureTimingConfiguredByObjId);
    for (let i = 0; i < keys.length; i++) {
        delete conquestPhase2ACaptureTimingConfiguredByObjId[Number(keys[i])];
    }
}

// Applies engine capture/neutralization timing to one capture point once per ObjId.
function conquestPhase2AConfigureCaptureTimingForPoint(
    capturePoint: mod.CapturePoint | undefined,
    objIdHint?: number
): boolean {
    if (!capturePoint) return false;
    const objId = objIdHint ?? safeGetObjId(capturePoint);
    if (objId === undefined) return false;
    if (conquestPhase2ACaptureTimingConfiguredByObjId[objId]) return true;
    try {
        mod.SetCapturePointCapturingTime(capturePoint, CONQUEST_CAPTURE_TIME_SECONDS);
        mod.SetCapturePointNeutralizationTime(capturePoint, CONQUEST_NEUTRALIZATION_TIME_SECONDS);
        conquestPhase2ACaptureTimingConfiguredByObjId[objId] = true;
        return true;
    } catch {
        return false;
    }
}

// Best-effort pass to apply configured capture timings to all mapped points for the active map.
function conquestPhase2AApplyCaptureTimingForMappedPoints(): void {
    const ordered = conquestPhase2AGetMappedConfigsInOrder();
    for (let i = 0; i < ordered.length; i++) {
        const objId = ordered[i].objId;
        let capturePoint: mod.CapturePoint | undefined;
        try {
            capturePoint = mod.GetCapturePoint(objId);
        } catch {
            capturePoint = undefined;
        }
        conquestPhase2AConfigureCaptureTimingForPoint(capturePoint, objId);
    }
}

// Resets conquest state for live start and seeds mapped capture state for Phase 2A.
function conquestPhase2AResetLiveState(): void {
    State.conquest.lifecyclePhase = 'LIVE_MATCH';
    State.conquest.tickets.team1 = CONQUEST_STARTING_TICKETS;
    State.conquest.tickets.team2 = CONQUEST_STARTING_TICKETS;
    State.conquest.bleed.lastTickSeconds = Math.floor(mod.GetMatchTimeElapsed());
    State.conquest.bleed.carryTeam1 = 0;
    State.conquest.bleed.carryTeam2 = 0;
    State.conquest.capture.byObjId = {};
    State.conquest.capture.mappedObjIdsInOrder = [];
    State.conquest.capture.lastUnmappedObjId = undefined;
    State.conquest.capture.unmappedSeenCount = 0;
    State.conquest.capture.visualByObjId = {};
    State.conquest.capture.engagedObjIdByPid = {};
    State.conquest.endRace.endLatched = false;
    State.conquest.endRace.endReason = undefined;
    State.conquest.endRace.endSnapshot = undefined;
    conquestPhase2AResetCaptureTimingConfigCache();
    conquestPhase2ABuildMappedCaptureIndexFromConfig();
    conquestPhase2AApplyCaptureTimingForMappedPoints();
    conquestPhase3MarkHudDirty();
    conquestPhase2AMirrorTicketsToEngineScore();
    updateConquestPhase2ADebugHudForAllPlayers(true);
}

// Resets conquest state for non-live phases while preserving config-derived mappings.
function conquestPhase2AResetNotLiveState(): void {
    State.conquest.lifecyclePhase = 'NOT_READY';
    State.conquest.bleed.lastTickSeconds = -1;
    State.conquest.bleed.carryTeam1 = 0;
    State.conquest.bleed.carryTeam2 = 0;
    State.conquest.endRace.endLatched = false;
    State.conquest.endRace.endReason = undefined;
    State.conquest.endRace.endSnapshot = undefined;
    State.conquest.capture.byObjId = {};
    State.conquest.capture.mappedObjIdsInOrder = [];
    State.conquest.capture.lastUnmappedObjId = undefined;
    State.conquest.capture.unmappedSeenCount = 0;
    State.conquest.capture.visualByObjId = {};
    State.conquest.capture.engagedObjIdByPid = {};
    conquestPhase2AResetCaptureTimingConfigCache();
    conquestPhase2ABuildMappedCaptureIndexFromConfig();
    conquestPhase2AApplyCaptureTimingForMappedPoints();
    conquestPhase3MarkHudDirty();
    updateConquestPhase2ADebugHudForAllPlayers(true);
}

// Mirrors authoritative script tickets into engine score projection.
function conquestPhase2AMirrorTicketsToEngineScore(): void {
    mod.SetGameModeScore(mod.GetTeam(TeamID.Team1), State.conquest.tickets.team1);
    mod.SetGameModeScore(mod.GetTeam(TeamID.Team2), State.conquest.tickets.team2);
}

// Counts currently owned mapped objectives per team (neutral/unmapped excluded).
function conquestPhase2AGetOwnershipCounts(): { team1Owned: number; team2Owned: number } {
    let team1Owned = 0;
    let team2Owned = 0;
    const ids = State.conquest.capture.mappedObjIdsInOrder;
    for (let i = 0; i < ids.length; i++) {
        const cp = State.conquest.capture.byObjId[ids[i]];
        if (!cp || !cp.mapped) continue;
        if (cp.ownerTeam === TeamID.Team1) team1Owned += 1;
        if (cp.ownerTeam === TeamID.Team2) team2Owned += 1;
    }
    return { team1Owned, team2Owned };
}

// Applies signed ticket delta to one team with floor-at-zero safety.
function conquestPhase2AApplyTicketDelta(team: TeamID, delta: number): boolean {
    if (delta === 0) return false;
    const prev = team === TeamID.Team1 ? State.conquest.tickets.team1 : State.conquest.tickets.team2;
    const next = Math.max(0, Math.floor(prev + delta));
    if (next === prev) return false;
    if (team === TeamID.Team1) State.conquest.tickets.team1 = next;
    else State.conquest.tickets.team2 = next;
    conquestPhase3MarkHudDirty();
    return true;
}

// Single-latch end transition owner for ticket/clock end reasons.
function conquestPhase2ATryLatchEnd(reason: 'tickets' | 'clock', winnerTeam: TeamID | 0): void {
    if (State.conquest.endRace.endLatched) return;
    State.conquest.lifecyclePhase = 'POST_MATCH';
    State.conquest.endRace.endLatched = true;
    State.conquest.endRace.endReason = reason;
    State.conquest.endRace.endSnapshot = {
        team1Tickets: State.conquest.tickets.team1,
        team2Tickets: State.conquest.tickets.team2,
        elapsedSeconds: Math.floor(mod.GetMatchTimeElapsed()),
        winnerTeam,
    };
    endMatch(undefined, 0, winnerTeam);
}

// Applies one bleed step from ownership differential and mirrors any ticket changes.
function conquestPhase2AApplyBleedTick(): void {
    if (!isMatchLive()) return;
    if (State.conquest.endRace.endLatched) return;
    if (!State.conquest.bleed.enabled) return;
    const now = Math.floor(mod.GetMatchTimeElapsed());
    if (State.conquest.bleed.lastTickSeconds < 0) {
        State.conquest.bleed.lastTickSeconds = now;
        return;
    }
    const elapsed = now - State.conquest.bleed.lastTickSeconds;
    if (elapsed <= 0) return;
    State.conquest.bleed.lastTickSeconds = now;

    const ownership = conquestPhase2AGetOwnershipCounts();
    const diff = ownership.team1Owned - ownership.team2Owned;
    if (diff === 0) return;

    const losingTeam = diff > 0 ? TeamID.Team2 : TeamID.Team1;
    const rate = Math.abs(diff) * State.conquest.bleed.perDiffPerSecond * elapsed;
    if (losingTeam === TeamID.Team1) {
        State.conquest.bleed.carryTeam1 += rate;
    } else {
        State.conquest.bleed.carryTeam2 += rate;
    }
    const carry = losingTeam === TeamID.Team1 ? State.conquest.bleed.carryTeam1 : State.conquest.bleed.carryTeam2;
    const bleedUnits = Math.max(0, Math.floor(carry));
    if (bleedUnits <= 0) return;
    if (losingTeam === TeamID.Team1) {
        State.conquest.bleed.carryTeam1 = Math.max(0, State.conquest.bleed.carryTeam1 - bleedUnits);
    } else {
        State.conquest.bleed.carryTeam2 = Math.max(0, State.conquest.bleed.carryTeam2 - bleedUnits);
    }

    const changed = conquestPhase2AApplyTicketDelta(losingTeam, -bleedUnits);
    if (changed) conquestPhase2AMirrorTicketsToEngineScore();
}

// Evaluates ticket-first end condition with clock fallback per CF-07/CF-60.
function conquestPhase2ACheckEndCondition(): void {
    if (!isMatchLive()) return;
    if (State.conquest.endRace.endLatched) return;

    const team1Tickets = State.conquest.tickets.team1;
    const team2Tickets = State.conquest.tickets.team2;

    if (team1Tickets <= 0 || team2Tickets <= 0) {
        if (team1Tickets <= 0 && team2Tickets <= 0) {
            conquestPhase2ATryLatchEnd('tickets', 0);
            return;
        }
        if (team1Tickets <= 0) {
            conquestPhase2ATryLatchEnd('tickets', TeamID.Team2);
            return;
        }
        conquestPhase2ATryLatchEnd('tickets', TeamID.Team1);
        return;
    }

    if (getRemainingSeconds() > 0) return;
    if (team1Tickets === team2Tickets) {
        conquestPhase2ATryLatchEnd('clock', 0);
        return;
    }
    conquestPhase2ATryLatchEnd('clock', team1Tickets > team2Tickets ? TeamID.Team1 : TeamID.Team2);
}

// Ingests engine capture-point ownership/progress into authoritative capture runtime state.
function conquestPhase2AOnCapturePointTick(eventCapturePoint: mod.CapturePoint): void {
    if (!eventCapturePoint) return;
    const objId = safeGetObjId(eventCapturePoint);
    if (objId === undefined) return;
    conquestPhase2AConfigureCaptureTimingForPoint(eventCapturePoint, objId);

    const state = conquestPhase2AEnsureCaptureState(objId);
    const prevMapped = state.mapped;
    const prevLabel = state.label;
    const prevOrder = state.order;
    const prevOwnerTeam = state.ownerTeam;
    const prevOwnerProgressTeam = state.ownerProgressTeam;
    const prevProgress01 = state.progress01;
    const prevOnPointTeam1 = state.onPointTeam1;
    const prevOnPointTeam2 = state.onPointTeam2;
    const visualSampleTick = Math.floor(mod.GetMatchTimeElapsed() * 10);
    const prevVisual = { ...conquestPhase3EnsureFlagVisualState(objId, visualSampleTick) };
    const cfg = getActiveCapturePointConfigByObjId(objId);
    if (cfg) {
        state.mapped = true;
        state.label = cfg.label;
        state.order = cfg.order;
    }

    let ownerTeam: TeamID | 0 = 0;
    let ownerProgressTeam: TeamID | 0 = 0;
    let progress01 = 0;
    try {
        ownerTeam = getTeamNumber(mod.GetCurrentOwnerTeam(eventCapturePoint));
    } catch {
        ownerTeam = 0;
    }
    try {
        ownerProgressTeam = getTeamNumber(mod.GetOwnerProgressTeam(eventCapturePoint));
    } catch {
        ownerProgressTeam = 0;
    }
    try {
        progress01 = conquestPhase2AClamp01(mod.GetCaptureProgress(eventCapturePoint));
    } catch {
        progress01 = 0;
    }

    let onPointTeam1 = 0;
    let onPointTeam2 = 0;
    try {
        const playersOnPoint = mod.GetPlayersOnPoint(eventCapturePoint);
        const playerCount = mod.CountOf(playersOnPoint);
        for (let i = 0; i < playerCount; i++) {
            const pointPlayer = mod.ValueInArray(playersOnPoint, i) as mod.Player;
            if (!pointPlayer || !mod.IsPlayerValid(pointPlayer)) continue;
            const pointPid = safeGetPlayerId(pointPlayer);
            if (pointPid !== undefined && !State.players.deployedByPid[pointPid]) continue;
            const pointTeam = safeGetTeamNumberFromPlayer(pointPlayer, 0);
            if (pointTeam === TeamID.Team1) onPointTeam1 += 1;
            if (pointTeam === TeamID.Team2) onPointTeam2 += 1;
            if (pointPid === undefined) continue;
            if (State.conquest.capture.engagedObjIdByPid[pointPid] === undefined) {
                State.conquest.capture.engagedObjIdByPid[pointPid] = objId;
            }
        }
    } catch {
        onPointTeam1 = 0;
        onPointTeam2 = 0;
    }

    ownerTeam = conquestPhase2AResolveAuthoritativeOwnerTeam(state, ownerTeam, ownerProgressTeam, progress01);

    // Keep ownerProgressTeam as raw engine signal at ingestion.
    // Visual stabilization belongs in the visual FSM, not in capture-state mutation.
    // Rewriting progress-team here can mask neutralization and hold stale owner-border state.
    if (!hasOwnerTeamForProgressReset(ownerTeam, progress01)) {
        ownerProgressTeam = 0;
    }

    state.ownerTeam = ownerTeam;
    state.ownerProgressTeam = ownerProgressTeam;
    state.progress01 = progress01;
    state.onPointTeam1 = onPointTeam1;
    state.onPointTeam2 = onPointTeam2;
    state.lastUpdatedAtSeconds = Math.floor(mod.GetMatchTimeElapsed());
    const nextVisual = conquestPhase3RefreshFlagVisualState(state);
    const visualChanged = conquestPhase3HasVisualStateChanged(prevVisual, nextVisual);

    const changed =
        state.mapped !== prevMapped ||
        state.label !== prevLabel ||
        state.order !== prevOrder ||
        state.ownerTeam !== prevOwnerTeam ||
        state.ownerProgressTeam !== prevOwnerProgressTeam ||
        Math.abs(state.progress01 - prevProgress01) >= 0.001 ||
        state.onPointTeam1 !== prevOnPointTeam1 ||
        state.onPointTeam2 !== prevOnPointTeam2 ||
        visualChanged;
    if (changed) {
        conquestPhase3MarkHudDirty();
    }
}

/**
 * Resolves authoritative owner state for one capture point.
 * Priority:
 * 1) Before any edge events are seen, engine owner is accepted.
 * 2) After edge events are seen, owner is event-latched and only changed on explicit neutralization/recapture completion.
 * This prevents stale engine owner echoes from re-enabling owner border after neutralization.
 */
function conquestPhase2AResolveAuthoritativeOwnerTeam(
    state: ConquestCapturePointRuntimeState,
    engineOwnerTeam: TeamID | 0,
    ownerProgressTeam: TeamID | 0,
    progress01: number
): TeamID | 0 {
    if (!state.ownerLatchedByEvent) {
        return engineOwnerTeam;
    }

    // Neutralization fallback:
    // if the engine drops ownerProgressTeam to 0 at the neutralization edge,
    // use last known opposing progress-team so ownership can still clear to neutral.
    const opposingProgressTeam =
        ownerProgressTeam !== 0 && ownerProgressTeam !== state.ownerTeam
            ? ownerProgressTeam
            : state.ownerProgressTeam !== 0 && state.ownerProgressTeam !== state.ownerTeam
              ? state.ownerProgressTeam
              : 0;

    const neutralizationComplete =
        state.ownerTeam !== 0 && opposingProgressTeam !== 0 && progress01 >= CONQUEST_FLAG_PHASE_TRANSITION_HIGH;
    if (neutralizationComplete) {
        state.ownerTeam = 0;
        return 0;
    }

    // Wrapped-neutralization fallback:
    // if owner was being drained and progress has wrapped back near zero while the opposing team is still active,
    // the neutralization edge likely occurred between samples; clear owner immediately to prevent stale owner borders.
    const opposingProgressForWrap =
        ownerProgressTeam !== 0 && ownerProgressTeam !== state.ownerTeam
            ? ownerProgressTeam
            : state.ownerProgressTeam !== 0 && state.ownerProgressTeam !== state.ownerTeam
              ? state.ownerProgressTeam
              : 0;
    const neutralizationWrapped =
        state.ownerTeam !== 0 && opposingProgressForWrap !== 0 && progress01 <= CONQUEST_FLAG_PHASE_TRANSITION_LOW;
    if (neutralizationWrapped) {
        state.ownerTeam = 0;
        return 0;
    }

    // Recapture fallback:
    // if progress-team is transiently 0 near full capture, use the last known non-zero progress-team.
    const captureProgressTeam = ownerProgressTeam !== 0 ? ownerProgressTeam : state.ownerProgressTeam;
    const recaptureComplete =
        state.ownerTeam === 0 && captureProgressTeam !== 0 && progress01 >= CONQUEST_FLAG_PHASE_TRANSITION_HIGH;
    if (recaptureComplete) {
        state.ownerTeam = captureProgressTeam;
        return captureProgressTeam;
    }

    return state.ownerTeam;
}

/**
 * Handles the engine neutralization edge for a capture point.
 * This is the authoritative moment ownership is lost; force neutralized visuals immediately.
 */
function conquestPhase2AOnCapturePointLost(eventCapturePoint: mod.CapturePoint): void {
    if (!eventCapturePoint) return;
    const objId = safeGetObjId(eventCapturePoint);
    if (objId === undefined) return;
    conquestPhase2AConfigureCaptureTimingForPoint(eventCapturePoint, objId);

    const cp = conquestPhase2AEnsureCaptureState(objId);
    cp.ownerLatchedByEvent = true;
    cp.ownerTeam = 0;
    try {
        cp.ownerProgressTeam = getTeamNumber(mod.GetOwnerProgressTeam(eventCapturePoint));
    } catch {
        cp.ownerProgressTeam = 0;
    }
    try {
        cp.progress01 = conquestPhase2AClamp01(mod.GetCaptureProgress(eventCapturePoint));
    } catch {
        cp.progress01 = 0;
    }
    cp.lastUpdatedAtSeconds = Math.floor(mod.GetMatchTimeElapsed());

    const sampleTick = Math.floor(mod.GetMatchTimeElapsed() * 10);
    const visual = conquestPhase3EnsureFlagVisualState(objId, sampleTick);
    visual.phase = 'NEUTRALIZED_LATCH';
    visual.ownerTeam = 0;
    visual.activeTeam = cp.ownerProgressTeam;
    visual.progress01 = cp.progress01;
    visual.ownerRemaining01 = 0;
    visual.suppressOwnerUntilRecaptured = true;
    visual.neutralizationLatchUntilTick = sampleTick + CONQUEST_FLAG_NEUTRALIZATION_LATCH_TICKS;
    visual.lastPhase = visual.phase;
    visual.lastPhaseChangeTick = sampleTick;
    visual.sampleTick = sampleTick;
    State.conquest.capture.visualByObjId[objId] = visual;

    conquestPhase3MarkHudDirty();
    updateConquestPhase2ADebugHudForAllPlayers(true);
}

/**
 * Handles the engine ownership-acquired edge for a capture point.
 * This confirms recapture and releases neutralization owner-suppression.
 */
function conquestPhase2AOnCapturePointCaptured(eventCapturePoint: mod.CapturePoint): void {
    if (!eventCapturePoint) return;
    const objId = safeGetObjId(eventCapturePoint);
    if (objId === undefined) return;
    conquestPhase2AConfigureCaptureTimingForPoint(eventCapturePoint, objId);

    const cp = conquestPhase2AEnsureCaptureState(objId);
    let ownerTeam: TeamID | 0 = 0;
    try {
        ownerTeam = getTeamNumber(mod.GetCurrentOwnerTeam(eventCapturePoint));
    } catch {
        ownerTeam = 0;
    }
    if (ownerTeam === 0) {
        try {
            ownerTeam = getTeamNumber(mod.GetOwnerProgressTeam(eventCapturePoint));
        } catch {
            ownerTeam = 0;
        }
    }

    cp.ownerLatchedByEvent = true;
    cp.ownerTeam = ownerTeam;
    cp.ownerProgressTeam = ownerTeam;
    cp.progress01 = ownerTeam === 0 ? 0 : 1;
    cp.lastUpdatedAtSeconds = Math.floor(mod.GetMatchTimeElapsed());

    const sampleTick = Math.floor(mod.GetMatchTimeElapsed() * 10);
    const visual = conquestPhase3EnsureFlagVisualState(objId, sampleTick);
    visual.phase = ownerTeam === 0 ? 'NEUTRAL_IDLE' : 'OWNED_STABLE';
    visual.ownerTeam = ownerTeam;
    visual.activeTeam = ownerTeam;
    visual.progress01 = ownerTeam === 0 ? 0 : 1;
    visual.ownerRemaining01 = ownerTeam === 0 ? 0 : 1;
    visual.suppressOwnerUntilRecaptured = false;
    visual.neutralizationLatchUntilTick = -1;
    visual.lastPhase = visual.phase;
    visual.lastPhaseChangeTick = sampleTick;
    visual.sampleTick = sampleTick;
    State.conquest.capture.visualByObjId[objId] = visual;

    conquestPhase3MarkHudDirty();
    updateConquestPhase2ADebugHudForAllPlayers(true);
}

/**
 * Pulls mapped capture-point state from engine each live tick.
 * Why this exists:
 * - OngoingCapturePoint callbacks can miss the exact neutralization-edge sample on some clients.
 * - If that final sample is missed, the previous contested frame can keep an old owner border visible.
 * - Live polling guarantees the visual FSM receives authoritative owner/progress updates at least once per tick.
 */
function conquestPhase2ASyncMappedCapturePointsFromEngine(): void {
    const mappedObjIds = State.conquest.capture.mappedObjIdsInOrder;
    const previousEngagedByPid = State.conquest.capture.engagedObjIdByPid;
    State.conquest.capture.engagedObjIdByPid = {};
    for (let i = 0; i < mappedObjIds.length; i++) {
        const objId = mappedObjIds[i];
        const cachedState = State.conquest.capture.byObjId[objId];
        if (cachedState) {
            cachedState.onPointTeam1 = 0;
            cachedState.onPointTeam2 = 0;
        }
        let cp: mod.CapturePoint | undefined;
        try {
            cp = mod.GetCapturePoint(objId);
        } catch {
            cp = undefined;
        }
        if (!cp) continue;
        conquestPhase2AOnCapturePointTick(cp);
    }

    const nextEngagedByPid = State.conquest.capture.engagedObjIdByPid;
    const previousKeys = Object.keys(previousEngagedByPid);
    const nextKeys = Object.keys(nextEngagedByPid);
    if (previousKeys.length !== nextKeys.length) {
        conquestPhase3MarkHudDirty();
        return;
    }
    for (let i = 0; i < nextKeys.length; i++) {
        const pid = Number(nextKeys[i]);
        if (previousEngagedByPid[pid] !== nextEngagedByPid[pid]) {
            conquestPhase3MarkHudDirty();
            return;
        }
    }
}

// Returns true while a capture point should preserve progress-team affinity.
// Used to clear stale progress-team state only when the point is truly neutral/idle.
function hasOwnerTeamForProgressReset(ownerTeam: TeamID | 0, progress01: number): boolean {
    if (ownerTeam !== 0) return true;
    return progress01 > 0.001;
}

// Updates per-player conquest ticket/flag HUD from authoritative state using viewer perspective colors.
function updateConquestPhase2ADebugHudForAllPlayers(force?: boolean): void {
    if (!State.conquest.debug.hudEnabled) return;
    if (!force && !State.conquest.debug.hudDirty) return;

    const now = Math.floor(mod.GetMatchTimeElapsed());
    State.conquest.debug.hudLastUpdatedAtSeconds = now;
    State.conquest.debug.hudDirty = false;

    const mappedCaptureStates = conquestPhase3GetOrderedMappedCaptureStates();
    // Persist leader team in runtime state so crown/border visibility remains script authoritative.
    State.conquest.debug.ticketLeaderTeam = conquestPhase3GetTicketLeaderTeam();

    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;

        const perspective = conquestPhase3GetPerspectiveTeams(p);
        const friendlyTickets =
            perspective.friendlyTeam === TeamID.Team1 ? State.conquest.tickets.team1 : State.conquest.tickets.team2;
        const enemyTickets =
            perspective.enemyTeam === TeamID.Team1 ? State.conquest.tickets.team1 : State.conquest.tickets.team2;

        const friendlyTicketLabel = mod.Message(mod.stringkeys.twl.system.genericCounter, friendlyTickets);
        const enemyTicketLabel = mod.Message(mod.stringkeys.twl.system.genericCounter, enemyTickets);

        const refs = ensureHudForPlayer(p);
        if (!refs) continue;
        conquestPhase3HideLegacyConquestRoots(refs.pid);
        conquestPhase3HideLegacyFlagTripletWidgets(refs.pid);

        if (CONQUEST_PHASE3_UI_OWNERSHIP_PROBE_HIDE_V2) {
            conquestPhase3ForceHideAllV2Widgets(refs.pid, refs);
            continue;
        }

        if (refs.conquestTicketsDebugRoot) {
            safeSetUIWidgetVisible(refs.conquestTicketsDebugRoot, true);
        }
        safeSetUIWidgetVisible(safeFind(`ConquestTicketsHudTeam1Container_${refs.pid}`), true);
        safeSetUIWidgetVisible(safeFind(`ConquestTicketsHudTeam2Container_${refs.pid}`), true);
        safeSetUIWidgetVisible(refs.conquestTicketsDebugTeam1, true);
        safeSetUIWidgetVisible(refs.conquestTicketsDebugTeam2, true);
        safeSetUITextLabel(refs.conquestTicketsDebugTeam1, friendlyTicketLabel);
        safeSetUITextLabel(refs.conquestTicketsDebugTeam2, enemyTicketLabel);
        safeSetUITextColor(refs.conquestTicketsDebugTeam1, COLOR_BLUE);
        safeSetUITextColor(refs.conquestTicketsDebugTeam2, COLOR_RED);
        conquestPhase3ApplyTicketBarFill(refs, friendlyTickets, enemyTickets);
        conquestPhase3ApplyTicketLeadIndicators(
            refs,
            perspective.friendlyTeam,
            perspective.enemyTeam,
            State.conquest.debug.ticketLeaderTeam
        );
        conquestPhase3ApplyTicketBleedIndicators(refs, perspective.friendlyTeam, perspective.enemyTeam);

        if (refs.conquestFlagsDebugRoot) {
            safeSetUIWidgetVisible(refs.conquestFlagsDebugRoot, true);
        }
        const slotRoots = refs.conquestFlagsDebugSlotRoots ?? [];
        const slotBorders = refs.conquestFlagsDebugBorderRows ?? [];
        const slotFills = refs.conquestFlagsDebugFillRows ?? [];
        const slotLabelShadowsRight = refs.conquestFlagsDebugLabelShadowRightRows ?? [];
        const slotLabelShadowsLeft = refs.conquestFlagsDebugLabelShadowLeftRows ?? [];
        const slotLabelShadowsUp = refs.conquestFlagsDebugLabelShadowUpRows ?? [];
        const slotLabelShadowsDown = refs.conquestFlagsDebugLabelShadowDownRows ?? [];
        const slotLabelShadowsUpLeft = refs.conquestFlagsDebugLabelShadowUpLeftRows ?? [];
        const slotLabelShadowsUpRight = refs.conquestFlagsDebugLabelShadowUpRightRows ?? [];
        const slotLabelShadowsDownRight = refs.conquestFlagsDebugLabelShadowDownRightRows ?? [];
        const slotLabelShadowsDownLeft = refs.conquestFlagsDebugLabelShadowDownLeftRows ?? [];
        const slotLabelShadowsInner = refs.conquestFlagsDebugLabelShadowInnerRows ?? [];
        const slotLabelShadowsInnerDeep = refs.conquestFlagsDebugLabelShadowInnerDeepRows ?? [];
        const slotLabels = refs.conquestFlagsDebugLabelRows ?? [];
        const slotPercentRoots = refs.conquestFlagsDebugPercentRoots ?? [];
        const slotPercentShadowsRight = refs.conquestFlagsDebugPercentShadowRightRows ?? [];
        const slotPercentShadowsLeft = refs.conquestFlagsDebugPercentShadowLeftRows ?? [];
        const slotPercentShadowsUp = refs.conquestFlagsDebugPercentShadowUpRows ?? [];
        const slotPercentShadowsDown = refs.conquestFlagsDebugPercentShadowDownRows ?? [];
        const slotPercentShadowsUpLeft = refs.conquestFlagsDebugPercentShadowUpLeftRows ?? [];
        const slotPercentShadowsUpRight = refs.conquestFlagsDebugPercentShadowUpRightRows ?? [];
        const slotPercentShadowsDownRight = refs.conquestFlagsDebugPercentShadowDownRightRows ?? [];
        const slotPercentShadowsDownLeft = refs.conquestFlagsDebugPercentShadowDownLeftRows ?? [];
        const slotPercentShadowsInner = refs.conquestFlagsDebugPercentShadowInnerRows ?? [];
        const slotPercentTexts = refs.conquestFlagsDebugPercentTextRows ?? [];
        const engageRoot = refs.conquestFlagsEngageRoot;
        const engageTrack = refs.conquestFlagsEngageTrack;
        const engageFriendlyFill = refs.conquestFlagsEngageFriendlyFill;
        const engageEnemyFill = refs.conquestFlagsEngageEnemyFill;
        const engageFriendlyCountBg = refs.conquestFlagsEngageFriendlyCountBg;
        const engageEnemyCountBg = refs.conquestFlagsEngageEnemyCountBg;
        const engageFriendlyCount = refs.conquestFlagsEngageFriendlyCount;
        const engageEnemyCount = refs.conquestFlagsEngageEnemyCount;
        const engageStatusShadowRight = refs.conquestFlagsEngageStatusShadowRight;
        const engageStatusShadowLeft = refs.conquestFlagsEngageStatusShadowLeft;
        const engageStatusShadowUp = refs.conquestFlagsEngageStatusShadowUp;
        const engageStatusShadowDown = refs.conquestFlagsEngageStatusShadowDown;
        const engageStatusShadowUpLeft = refs.conquestFlagsEngageStatusShadowUpLeft;
        const engageStatusShadowUpRight = refs.conquestFlagsEngageStatusShadowUpRight;
        const engageStatusShadowDownRight = refs.conquestFlagsEngageStatusShadowDownRight;
        const engageStatusShadowDownLeft = refs.conquestFlagsEngageStatusShadowDownLeft;
        const engageStatus = refs.conquestFlagsEngageStatus;
        const engageStatusGroup: ConquestShadowTextWidgetSet = {
            right: engageStatusShadowRight,
            left: engageStatusShadowLeft,
            up: engageStatusShadowUp,
            down: engageStatusShadowDown,
            upLeft: engageStatusShadowUpLeft,
            upRight: engageStatusShadowUpRight,
            downRight: engageStatusShadowDownRight,
            downLeft: engageStatusShadowDownLeft,
            text: engageStatus,
        };
        const maxSlots = Math.max(
            slotRoots.length,
            slotBorders.length,
            slotFills.length,
            slotLabelShadowsRight.length,
            slotLabelShadowsLeft.length,
            slotLabelShadowsUp.length,
            slotLabelShadowsDown.length,
            slotLabelShadowsUpLeft.length,
            slotLabelShadowsUpRight.length,
            slotLabelShadowsDownRight.length,
            slotLabelShadowsDownLeft.length,
            slotLabelShadowsInner.length,
            slotLabelShadowsInnerDeep.length,
            slotLabels.length,
            slotPercentRoots.length,
            slotPercentShadowsRight.length,
            slotPercentShadowsLeft.length,
            slotPercentShadowsUp.length,
            slotPercentShadowsDown.length,
            slotPercentShadowsUpLeft.length,
            slotPercentShadowsUpRight.length,
            slotPercentShadowsDownRight.length,
            slotPercentShadowsDownLeft.length,
            slotPercentShadowsInner.length,
            slotPercentTexts.length
        );
        const visibleSlots = conquestPhase3GetCenteredFlagSlots(mappedCaptureStates.length, maxSlots);
        const slotToRowIndex: number[] = [];
        for (let slot = 0; slot < maxSlots; slot++) slotToRowIndex[slot] = -1;
        for (let row = 0; row < mappedCaptureStates.length && row < visibleSlots.length; row++) {
            slotToRowIndex[visibleSlots[row]] = row;
        }

        for (let slot = 0; slot < maxSlots; slot++) {
            const row = slotToRowIndex[slot];
            const slotRoot = slotRoots[slot];
            const slotBorder = slotBorders[slot];
            const slotFill = slotFills[slot];
            const slotLabelShadowRight = slotLabelShadowsRight[slot];
            const slotLabelShadowLeft = slotLabelShadowsLeft[slot];
            const slotLabelShadowUp = slotLabelShadowsUp[slot];
            const slotLabelShadowDown = slotLabelShadowsDown[slot];
            const slotLabelShadowUpLeft = slotLabelShadowsUpLeft[slot];
            const slotLabelShadowUpRight = slotLabelShadowsUpRight[slot];
            const slotLabelShadowDownRight = slotLabelShadowsDownRight[slot];
            const slotLabelShadowDownLeft = slotLabelShadowsDownLeft[slot];
            const slotLabelShadowInner = slotLabelShadowsInner[slot];
            const slotLabelShadowInnerDeep = slotLabelShadowsInnerDeep[slot];
            const slotLabel = slotLabels[slot];
            const slotPercentRoot = slotPercentRoots[slot];
            const slotPercentShadowRight = slotPercentShadowsRight[slot];
            const slotPercentShadowLeft = slotPercentShadowsLeft[slot];
            const slotPercentShadowUp = slotPercentShadowsUp[slot];
            const slotPercentShadowDown = slotPercentShadowsDown[slot];
            const slotPercentShadowUpLeft = slotPercentShadowsUpLeft[slot];
            const slotPercentShadowUpRight = slotPercentShadowsUpRight[slot];
            const slotPercentShadowDownRight = slotPercentShadowsDownRight[slot];
            const slotPercentShadowDownLeft = slotPercentShadowsDownLeft[slot];
            const slotPercentShadowInner = slotPercentShadowsInner[slot];
            const slotPercentText = slotPercentTexts[slot];
            const slotLabelGroup: ConquestShadowTextWidgetSet = {
                right: slotLabelShadowRight,
                left: slotLabelShadowLeft,
                up: slotLabelShadowUp,
                down: slotLabelShadowDown,
                upLeft: slotLabelShadowUpLeft,
                upRight: slotLabelShadowUpRight,
                downRight: slotLabelShadowDownRight,
                downLeft: slotLabelShadowDownLeft,
                text: slotLabel,
            };
            const slotPercentGroup: ConquestShadowTextWidgetSet = {
                right: slotPercentShadowRight,
                left: slotPercentShadowLeft,
                up: slotPercentShadowUp,
                down: slotPercentShadowDown,
                upLeft: slotPercentShadowUpLeft,
                upRight: slotPercentShadowUpRight,
                downRight: slotPercentShadowDownRight,
                downLeft: slotPercentShadowDownLeft,
                inner: slotPercentShadowInner,
                text: slotPercentText,
            };
            // Ensure legacy shadow variants from previous iterations never contribute to outline bias.
            safeSetUIWidgetVisible(safeFind(`ConquestFlagHudLabelShadow_${refs.pid}_${slot}`), false);
            safeSetUIWidgetVisible(safeFind(`ConquestFlagHudLabelShadowMid_${refs.pid}_${slot}`), false);
            safeSetUIWidgetVisible(safeFind(`ConquestFlagHudLabelShadowOuter_${refs.pid}_${slot}`), false);
            // Objective letters use only the even 8-direction ring; centered inner layers are disabled.
            safeSetUIWidgetVisible(slotLabelShadowInner, false);
            safeSetUIWidgetVisible(slotLabelShadowInnerDeep, false);
            if (row < 0) {
                safeSetUIWidgetVisible(slotRoot, false);
                safeSetUIWidgetVisible(slotBorder, false);
                safeSetUIWidgetVisible(slotFill, false);
                safeSetUIWidgetVisible(slotPercentRoot, false);
                conquestPhase3SetShadowTextGroupVisible(slotLabelGroup, false);
                conquestPhase3SetShadowTextGroupVisible(slotPercentGroup, false);
                continue;
            }

            const cp = mappedCaptureStates[row];
            const labelKey = conquestPhase3GetFlagLetterStringKey(cp, row);
            const visualState =
                State.conquest.capture.visualByObjId[cp.objId] ?? conquestPhase3RefreshFlagVisualState(cp);
            const visual = conquestPhase3GetFlagSlotVisual(
                visualState,
                perspective.friendlyTeam,
                perspective.enemyTeam
            );
            const percentVisual = conquestPhase3GetFlagPercentDisplay(
                visualState,
                perspective.friendlyTeam,
                perspective.enemyTeam
            );
            const onPointCount = cp.onPointTeam1 + cp.onPointTeam2;
            const rawFillHeight =
                visual.fillRatio <= 0 ? 0 : Math.floor(CONQUEST_HUD_FLAG_FILL_MAX_HEIGHT * visual.fillRatio);
            const unattendedNeutralResidual = cp.ownerTeam === 0 && onPointCount <= 0 && rawFillHeight <= 1;
            const fillHeight =
                rawFillHeight <= 0
                    ? // Only force a 1px minimum while the point is actively contested/captured.
                      onPointCount > 0 && visual.fillRatio > 0
                        ? 1
                        : 0
                    : unattendedNeutralResidual
                      ? 0
                      : rawFillHeight;

            safeSetUIWidgetVisible(slotRoot, true);
            conquestPhase3SetShadowTextGroupVisible(slotLabelGroup, true);
            conquestPhase3SetShadowTextGroupLabel(slotLabelGroup, mod.Message(labelKey));
            conquestPhase3SetShadowTextGroupColors(slotLabelGroup, visual.labelColor);
            safeSetUIWidgetVisible(slotPercentRoot, percentVisual.visible);
            if (percentVisual.visible && percentVisual.color) {
                const percentValue = Math.max(0, Math.min(100, Math.round(percentVisual.value01 * 100)));
                const percentLabel = mod.Message(STR_SYSTEM_GENERIC_PERCENT, percentValue);
                conquestPhase3SetShadowTextGroupVisible(slotPercentGroup, true);
                conquestPhase3SetShadowTextGroupLabel(slotPercentGroup, percentLabel);
                conquestPhase3SetShadowTextGroupColors(slotPercentGroup, percentVisual.color);
            } else {
                conquestPhase3SetShadowTextGroupVisible(slotPercentGroup, false);
            }
            safeSetUIWidgetBgColor(slotRoot, visual.slotBgColor);
            // Borders are disabled for conquest objective flags.
            safeSetUIWidgetVisible(slotBorder, false);
            safeSetUIWidgetVisible(safeFind(`ConquestFlagHudBorder_${refs.pid}_${slot}`), false);

            if (fillHeight > 0 && visual.fillColor) {
                safeSetUIWidgetVisible(slotFill, true);
                const fillY = CONQUEST_HUD_FLAG_FILL_INSET_Y + (CONQUEST_HUD_FLAG_FILL_MAX_HEIGHT - fillHeight);
                safeSetUIWidgetPosition(slotFill, mod.CreateVector(CONQUEST_HUD_FLAG_FILL_INSET_X, fillY, 0));
                safeSetUIWidgetSize(slotFill, mod.CreateVector(CONQUEST_HUD_FLAG_FILL_MAX_WIDTH, fillHeight, 0));
                safeSetUIWidgetBgColor(slotFill, visual.fillColor);
            } else {
                safeSetUIWidgetVisible(slotFill, false);
            }
        }

        const engageDisplay = conquestPhase3GetFlagEngageDisplayForViewer(
            p,
            refs.pid,
            perspective.friendlyTeam,
            perspective.enemyTeam
        );
        safeSetUIWidgetVisible(engageRoot, engageDisplay.visible);
        if (!engageDisplay.visible) {
            delete State.conquest.capture.engagedObjIdByPid[refs.pid];
            safeSetUIWidgetVisible(engageTrack, false);
            safeSetUIWidgetVisible(engageFriendlyFill, false);
            safeSetUIWidgetVisible(engageEnemyFill, false);
            safeSetUIWidgetVisible(engageFriendlyCountBg, false);
            safeSetUIWidgetVisible(engageEnemyCountBg, false);
            safeSetUIWidgetVisible(engageFriendlyCount, false);
            safeSetUIWidgetVisible(engageEnemyCount, false);
            conquestPhase3SetShadowTextGroupVisible(engageStatusGroup, false);
            continue;
        }

        safeSetUIWidgetVisible(engageTrack, true);
        safeSetUIWidgetVisible(engageFriendlyCountBg, true);
        safeSetUIWidgetVisible(engageEnemyCountBg, true);
        safeSetUIWidgetVisible(engageFriendlyCount, true);
        safeSetUIWidgetVisible(engageEnemyCount, true);
        conquestPhase3SetShadowTextGroupVisible(engageStatusGroup, true);

        safeSetUITextLabel(
            engageFriendlyCount,
            mod.Message(mod.stringkeys.twl.system.genericCounter, engageDisplay.friendlyCount)
        );
        safeSetUITextLabel(
            engageEnemyCount,
            mod.Message(mod.stringkeys.twl.system.genericCounter, engageDisplay.enemyCount)
        );
        conquestPhase3SetShadowTextGroupLabel(engageStatusGroup, mod.Message(engageDisplay.statusKey));
        conquestPhase3SetShadowTextGroupColors(engageStatusGroup, COLOR_WHITE);
        safeSetUITextColor(engageFriendlyCount, COLOR_BLUE);
        safeSetUITextColor(engageEnemyCount, COLOR_RED);
        safeSetUIWidgetBgColor(engageTrack, COLOR_GRAY_DARK);

        const fullTrackWidth = Math.max(1, Math.floor(CONQUEST_HUD_FLAG_ENGAGE_TRACK_WIDTH));
        let friendlyWidth =
            engageDisplay.friendlyCount <= 0
                ? 0
                : Math.max(1, Math.floor(fullTrackWidth * engageDisplay.friendlyRatio));
        if (friendlyWidth > fullTrackWidth) friendlyWidth = fullTrackWidth;
        let enemyWidth = fullTrackWidth - friendlyWidth;
        if (engageDisplay.enemyCount > 0 && enemyWidth <= 0) {
            enemyWidth = 1;
            friendlyWidth = Math.max(0, fullTrackWidth - enemyWidth);
        }

        safeSetUIWidgetVisible(engageFriendlyFill, friendlyWidth > 0);
        safeSetUIWidgetVisible(engageEnemyFill, enemyWidth > 0);
        if (friendlyWidth > 0) {
            safeSetUIWidgetPosition(engageFriendlyFill, mod.CreateVector(0, 0, 0));
            safeSetUIWidgetSize(
                engageFriendlyFill,
                mod.CreateVector(friendlyWidth, CONQUEST_HUD_FLAG_ENGAGE_TRACK_HEIGHT, 0)
            );
            safeSetUIWidgetBgColor(engageFriendlyFill, COLOR_BLUE);
        }
        if (enemyWidth > 0) {
            safeSetUIWidgetPosition(engageEnemyFill, mod.CreateVector(friendlyWidth, 0, 0));
            safeSetUIWidgetSize(
                engageEnemyFill,
                mod.CreateVector(enemyWidth, CONQUEST_HUD_FLAG_ENGAGE_TRACK_HEIGHT, 0)
            );
            safeSetUIWidgetBgColor(engageEnemyFill, COLOR_RED);
        }
    }
}

// Phase 2A live tick owner: bleed, end checks, then debug projection refresh.
function conquestPhase2AOnLiveTick(): void {
    // Keep capture-state authoritative even if event-driven capture callbacks miss a transition frame.
    conquestPhase2ASyncMappedCapturePointsFromEngine();
    conquestPhase2AApplyBleedTick();
    conquestPhase2ACheckEndCondition();
    updateConquestPhase2ADebugHudForAllPlayers();
}
