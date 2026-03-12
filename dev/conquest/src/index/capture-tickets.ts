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

type ConquestHudTicketViewModel = {
    friendlyTeam: TeamID;
    enemyTeam: TeamID;
    friendlyTickets: number;
    enemyTickets: number;
    friendlyTicketLabel: mod.Message;
    enemyTicketLabel: mod.Message;
    leaderTeam: TeamID | 0;
    bleedLeftCount: number;
    bleedRightCount: number;
};

type ConquestHudFlagSlotViewModel = {
    visible: boolean;
    objId?: number;
    slotBgColor?: mod.Vector;
    borderVisible: boolean;
    borderColor?: mod.Vector;
    fillVisible: boolean;
    fillColor?: mod.Vector;
    fillY: number;
    fillHeight: number;
    labelVisible: boolean;
    labelMessage?: mod.Message;
    labelColor?: mod.Vector;
    percentVisible: boolean;
    percentMessage?: mod.Message;
    percentColor?: mod.Vector;
};

type ConquestHudActiveFlagPopoutViewModel = {
    visible: boolean;
    objId?: number;
    slotBgColor?: mod.Vector;
    borderVisible: boolean;
    borderColor?: mod.Vector;
    fillVisible: boolean;
    fillColor?: mod.Vector;
    fillY: number;
    fillHeight: number;
    labelVisible: boolean;
    labelMessage?: mod.Message;
    labelColor?: mod.Vector;
    percentVisible: boolean;
    percentMessage?: mod.Message;
    percentColor?: mod.Vector;
};

type ConquestHudFlagsViewModel = {
    slots: ConquestHudFlagSlotViewModel[];
};

type ConquestHudEngageViewModel = {
    visible: boolean;
    friendlyCountLabel?: mod.Message;
    enemyCountLabel?: mod.Message;
    statusLabel?: mod.Message;
    friendlyWidth: number;
    enemyWidth: number;
};

type ConquestHudStatusViewModel = {
    isLive: boolean;
    isGameOver: boolean;
    showRoundStateLine: boolean;
    showPlayersReadyLine: boolean;
};

type ConquestHudHelpReadyViewModel = {
    showHelp: boolean;
    showReady: boolean;
};

type ConquestHudClockViewModel = {
    durationSeconds: number;
    elapsedSeconds: number;
    remainingSeconds: number;
    isPaused: boolean;
    isLowTime: boolean;
};

type ConquestHudViewModel = {
    pid: number;
    perspective: {
        friendlyTeam: TeamID;
        enemyTeam: TeamID;
    };
    tickets: ConquestHudTicketViewModel;
    flags: ConquestHudFlagsViewModel;
    activeFlagPopout: ConquestHudActiveFlagPopoutViewModel;
    engage: ConquestHudEngageViewModel;
    status: ConquestHudStatusViewModel;
    helpReady: ConquestHudHelpReadyViewModel;
    clock: ConquestHudClockViewModel;
};

const CONQUEST_SHADOW_TEXT_COLOR_BLACK = mod.CreateVector(0, 0, 0);
const CONQUEST_BLEED_PULSE_SIDE_NONE = 0;
const CONQUEST_BLEED_PULSE_SIDE_LEFT = 1;
const CONQUEST_BLEED_PULSE_SIDE_RIGHT = 2;
const CONQUEST_BLEED_PULSE_PHASE_IDLE = 0;
const CONQUEST_BLEED_PULSE_PHASE_HIDE = 1;
const CONQUEST_BLEED_PULSE_PHASE_SHOW = 2;
const CONQUEST_BLEED_PULSE_SEQUENCE_CAP_SECONDS = 0.10;
const CONQUEST_BLEED_PULSE_SEQUENCE_MIN_SECONDS = 0.03;
const CONQUEST_BLEED_PULSE_SEQUENCE_FRACTION_OF_BLEED_INTERVAL = 0.30;
const CONQUEST_PHASE3_ACTIVE_SLOT_MUTED_LABEL = mod.CreateVector(180 / 255, 188 / 255, 196 / 255);

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

// Applies one alpha value to shadow layers and keeps core text fully opaque.
function conquestPhase3SetShadowTextGroupAlpha(group: ConquestShadowTextWidgetSet, shadowAlpha: number): void {
    safeSetUITextAlpha(group.right, shadowAlpha);
    safeSetUITextAlpha(group.left, shadowAlpha);
    safeSetUITextAlpha(group.up, shadowAlpha);
    safeSetUITextAlpha(group.down, shadowAlpha);
    safeSetUITextAlpha(group.upLeft, shadowAlpha);
    safeSetUITextAlpha(group.upRight, shadowAlpha);
    safeSetUITextAlpha(group.downRight, shadowAlpha);
    safeSetUITextAlpha(group.downLeft, shadowAlpha);
    safeSetUITextAlpha(group.inner, shadowAlpha);
    safeSetUITextAlpha(group.innerDeep, shadowAlpha);
    safeSetUITextAlpha(group.text, 1);
}

// Reparents all shadow layers first and then reattaches core text so core stays on top.
function conquestPhase3RestackShadowTextGroup(group: ConquestShadowTextWidgetSet, parent: mod.UIWidget | undefined): void {
    if (!parent) return;
    const shadowLayers: (mod.UIWidget | undefined)[] = [
        group.right,
        group.left,
        group.up,
        group.down,
        group.upLeft,
        group.upRight,
        group.downRight,
        group.downLeft,
        group.inner,
        group.innerDeep,
    ];
    for (let i = 0; i < shadowLayers.length; i++) {
        safeSetUIWidgetParent(shadowLayers[i], parent);
    }
    safeSetUIWidgetParent(group.text, parent);
}

// Reparents only the core text as the final operation so it renders above shadow layers.
function conquestPhase3BringShadowTextCoreToFront(
    group: ConquestShadowTextWidgetSet,
    parent: mod.UIWidget | undefined
): void {
    if (!group.text || !parent) return;
    safeSetUIWidgetParent(group.text, parent);
    safeSetUIWidgetVisible(group.text, true);
    safeSetUIWidgetDepth(group.text, mod.UIDepth.AboveGameUI);
}

// Applies one depth level to all layers in a shadow-text group.
function conquestPhase3SetShadowTextGroupDepth(group: ConquestShadowTextWidgetSet, depth: mod.UIDepth): void {
    safeSetUIWidgetDepth(group.right, depth);
    safeSetUIWidgetDepth(group.left, depth);
    safeSetUIWidgetDepth(group.up, depth);
    safeSetUIWidgetDepth(group.down, depth);
    safeSetUIWidgetDepth(group.upLeft, depth);
    safeSetUIWidgetDepth(group.upRight, depth);
    safeSetUIWidgetDepth(group.downRight, depth);
    safeSetUIWidgetDepth(group.downLeft, depth);
    safeSetUIWidgetDepth(group.inner, depth);
    safeSetUIWidgetDepth(group.innerDeep, depth);
    safeSetUIWidgetDepth(group.text, depth);
}

// Resolves one ticket counter foreground + directional shadow widget set.
function conquestPhase3GetTicketCounterShadowGroup(refs: HudRefs, teamSlot: 1 | 2): ConquestShadowTextWidgetSet {
    const prefix = teamSlot === 1 ? "ConquestTicketsHudTeam1" : "ConquestTicketsHudTeam2";
    const pid = refs.pid;
    const overlayName = teamSlot === 1
        ? `ConquestTicketsHudTeam1CoreOverlay_${pid}`
        : `ConquestTicketsHudTeam2CoreOverlay_${pid}`;
    const legacyName = teamSlot === 1
        ? `ConquestTicketsHudTeam1_${pid}`
        : `ConquestTicketsHudTeam2_${pid}`;
    const coreText = teamSlot === 1
        ? (safeFind(overlayName) ?? refs.conquestTicketsDebugTeam1 ?? safeFind(legacyName))
        : (safeFind(overlayName) ?? refs.conquestTicketsDebugTeam2 ?? safeFind(legacyName));
    if (teamSlot === 1) {
        refs.conquestTicketsDebugTeam1 = coreText;
    } else {
        refs.conquestTicketsDebugTeam2 = coreText;
    }
    return {
        right: safeFind(`${prefix}ShadowRight_${pid}`),
        left: safeFind(`${prefix}ShadowLeft_${pid}`),
        up: safeFind(`${prefix}ShadowUp_${pid}`),
        down: safeFind(`${prefix}ShadowDown_${pid}`),
        upLeft: safeFind(`${prefix}ShadowUpLeft_${pid}`),
        upRight: safeFind(`${prefix}ShadowUpRight_${pid}`),
        downRight: safeFind(`${prefix}ShadowDownRight_${pid}`),
        downLeft: safeFind(`${prefix}ShadowDownLeft_${pid}`),
        text: coreText,
    };
}

// Resolves one bleed-chevron foreground+shadow widget set by side/index.
function conquestPhase3GetBleedChevronShadowGroup(
    refs: HudRefs,
    pid: number,
    side: 1 | 2,
    chevronIndex: number
): ConquestShadowTextWidgetSet {
    const sideName = side === CONQUEST_BLEED_PULSE_SIDE_LEFT ? "Left" : "Right";
    const slot = chevronIndex + 1;
    const coreChevron = safeFind(`ConquestTicketsHudBleedChevron${sideName}${slot}_${pid}`);
    if (side === CONQUEST_BLEED_PULSE_SIDE_LEFT) {
        if (!refs.conquestTicketsBleedLeftChevrons) refs.conquestTicketsBleedLeftChevrons = [];
        refs.conquestTicketsBleedLeftChevrons[chevronIndex] = coreChevron;
    } else {
        if (!refs.conquestTicketsBleedRightChevrons) refs.conquestTicketsBleedRightChevrons = [];
        refs.conquestTicketsBleedRightChevrons[chevronIndex] = coreChevron;
    }
    return {
        right: safeFind(`ConquestTicketsHudBleedChevron${sideName}${slot}ShadowRight_${pid}`),
        left: safeFind(`ConquestTicketsHudBleedChevron${sideName}${slot}ShadowLeft_${pid}`),
        up: safeFind(`ConquestTicketsHudBleedChevron${sideName}${slot}ShadowUp_${pid}`),
        down: safeFind(`ConquestTicketsHudBleedChevron${sideName}${slot}ShadowDown_${pid}`),
        upLeft: safeFind(`ConquestTicketsHudBleedChevron${sideName}${slot}ShadowUpLeft_${pid}`),
        upRight: safeFind(`ConquestTicketsHudBleedChevron${sideName}${slot}ShadowUpRight_${pid}`),
        downRight: safeFind(`ConquestTicketsHudBleedChevron${sideName}${slot}ShadowDownRight_${pid}`),
        downLeft: safeFind(`ConquestTicketsHudBleedChevron${sideName}${slot}ShadowDownLeft_${pid}`),
        text: coreChevron,
    };
}

// Clears one player's queued/active bleed-pulse animation state.
function conquestPhase3ResetBleedPulseForPid(pid: number): void {
    State.conquest.debug.bleedPulseQueueLeftByPid[pid] = 0;
    State.conquest.debug.bleedPulseQueueRightByPid[pid] = 0;
    State.conquest.debug.bleedPulseActiveSideByPid[pid] = CONQUEST_BLEED_PULSE_SIDE_NONE;
    State.conquest.debug.bleedPulseStepByPid[pid] = 0;
    State.conquest.debug.bleedPulseLimitByPid[pid] = 0;
    State.conquest.debug.bleedPulsePhaseByPid[pid] = CONQUEST_BLEED_PULSE_PHASE_IDLE;
    State.conquest.debug.bleedPulseNextAtByPid[pid] = 0;
}

// Computes per-slot pulse timing for a rapid inner->outer burst per bleed event.
// The burst is intentionally quick, but still scales down proportionally when bleed intervals become very short.
function conquestPhase3GetBleedPulseTimingSeconds(visibleLimit: number): { offSeconds: number; onSeconds: number } {
    const clampedLimit = Math.max(1, Math.min(CONQUEST_HUD_TICKET_BLEED_CHEVRON_COUNT, visibleLimit));
    const perDiffPerSecond = Math.max(0.001, State.conquest.bleed.perDiffPerSecond);
    const bleedIntervalSeconds = 1 / (perDiffPerSecond * clampedLimit);
    const sequenceSeconds = Math.max(
        CONQUEST_BLEED_PULSE_SEQUENCE_MIN_SECONDS,
        Math.min(
            CONQUEST_BLEED_PULSE_SEQUENCE_CAP_SECONDS,
            bleedIntervalSeconds * CONQUEST_BLEED_PULSE_SEQUENCE_FRACTION_OF_BLEED_INTERVAL
        )
    );
    const slotSeconds = Math.max(0.02, sequenceSeconds / clampedLimit);
    const offSeconds = Math.max(0.008, Math.min(0.02, slotSeconds * 0.35));
    const onSeconds = Math.max(0.012, slotSeconds - offSeconds);
    return { offSeconds, onSeconds };
}

// Starts one bleed pulse for the given side and visible chevron count limit.
function conquestPhase3StartBleedPulseForPid(
    pid: number,
    side: 1 | 2,
    visibleLimit: number,
    now: number
): boolean {
    const clampedLimit = Math.max(0, Math.min(CONQUEST_HUD_TICKET_BLEED_CHEVRON_COUNT, visibleLimit));
    if (clampedLimit <= 0) return false;
    const timing = conquestPhase3GetBleedPulseTimingSeconds(clampedLimit);
    State.conquest.debug.bleedPulseActiveSideByPid[pid] = side;
    State.conquest.debug.bleedPulseStepByPid[pid] = 0;
    State.conquest.debug.bleedPulseLimitByPid[pid] = clampedLimit;
    State.conquest.debug.bleedPulsePhaseByPid[pid] = CONQUEST_BLEED_PULSE_PHASE_HIDE;
    State.conquest.debug.bleedPulseNextAtByPid[pid] = now + timing.offSeconds;
    return true;
}

// Advances one player's queued bleed-pulse animation and returns which slot should be hidden this frame.
function conquestPhase3AdvanceBleedPulseForPid(
    pid: number,
    leftCount: number,
    rightCount: number
): { hideLeftIndex: number; hideRightIndex: number } {
    const now = mod.GetMatchTimeElapsed();
    const queueLeftMap = State.conquest.debug.bleedPulseQueueLeftByPid;
    const queueRightMap = State.conquest.debug.bleedPulseQueueRightByPid;
    let queueLeft = Math.max(0, queueLeftMap[pid] ?? 0);
    let queueRight = Math.max(0, queueRightMap[pid] ?? 0);
    if (leftCount <= 0) queueLeft = 0;
    if (rightCount <= 0) queueRight = 0;
    queueLeftMap[pid] = queueLeft;
    queueRightMap[pid] = queueRight;

    let activeSide = State.conquest.debug.bleedPulseActiveSideByPid[pid] ?? CONQUEST_BLEED_PULSE_SIDE_NONE;
    let phase = State.conquest.debug.bleedPulsePhaseByPid[pid] ?? CONQUEST_BLEED_PULSE_PHASE_IDLE;
    let step = State.conquest.debug.bleedPulseStepByPid[pid] ?? 0;
    let limit = State.conquest.debug.bleedPulseLimitByPid[pid] ?? 0;
    let nextAt = State.conquest.debug.bleedPulseNextAtByPid[pid] ?? 0;

    const tryStartNextPulse = (): boolean => {
        if (queueLeft > 0 && leftCount > 0) {
            return conquestPhase3StartBleedPulseForPid(pid, CONQUEST_BLEED_PULSE_SIDE_LEFT, leftCount, now);
        }
        if (queueRight > 0 && rightCount > 0) {
            return conquestPhase3StartBleedPulseForPid(pid, CONQUEST_BLEED_PULSE_SIDE_RIGHT, rightCount, now);
        }
        return false;
    };

    if (activeSide === CONQUEST_BLEED_PULSE_SIDE_NONE || phase === CONQUEST_BLEED_PULSE_PHASE_IDLE || limit <= 0) {
        const started = tryStartNextPulse();
        if (!started) {
            State.conquest.debug.bleedPulseActiveSideByPid[pid] = CONQUEST_BLEED_PULSE_SIDE_NONE;
            State.conquest.debug.bleedPulsePhaseByPid[pid] = CONQUEST_BLEED_PULSE_PHASE_IDLE;
            State.conquest.debug.bleedPulseStepByPid[pid] = 0;
            State.conquest.debug.bleedPulseLimitByPid[pid] = 0;
            State.conquest.debug.bleedPulseNextAtByPid[pid] = 0;
            return { hideLeftIndex: -1, hideRightIndex: -1 };
        }
        activeSide = State.conquest.debug.bleedPulseActiveSideByPid[pid];
        phase = State.conquest.debug.bleedPulsePhaseByPid[pid];
        step = State.conquest.debug.bleedPulseStepByPid[pid];
        limit = State.conquest.debug.bleedPulseLimitByPid[pid];
        nextAt = State.conquest.debug.bleedPulseNextAtByPid[pid];
    }

    // Drain due animation transitions if this frame arrives after one or more scheduled ticks.
    let guard = 0;
    while (activeSide !== CONQUEST_BLEED_PULSE_SIDE_NONE && now >= nextAt && guard < 32) {
        guard += 1;
        if (phase === CONQUEST_BLEED_PULSE_PHASE_HIDE) {
            const timing = conquestPhase3GetBleedPulseTimingSeconds(limit);
            phase = CONQUEST_BLEED_PULSE_PHASE_SHOW;
            nextAt = now + timing.onSeconds;
            continue;
        }

        step += 1;
        if (step >= limit) {
            if (activeSide === CONQUEST_BLEED_PULSE_SIDE_LEFT) {
                queueLeft = Math.max(0, queueLeft - 1);
            } else if (activeSide === CONQUEST_BLEED_PULSE_SIDE_RIGHT) {
                queueRight = Math.max(0, queueRight - 1);
            }
            queueLeftMap[pid] = queueLeft;
            queueRightMap[pid] = queueRight;
            if (activeSide === CONQUEST_BLEED_PULSE_SIDE_LEFT && queueLeft > 0 && leftCount > 0) {
                conquestPhase3StartBleedPulseForPid(pid, CONQUEST_BLEED_PULSE_SIDE_LEFT, leftCount, now);
            } else if (activeSide === CONQUEST_BLEED_PULSE_SIDE_RIGHT && queueRight > 0 && rightCount > 0) {
                conquestPhase3StartBleedPulseForPid(pid, CONQUEST_BLEED_PULSE_SIDE_RIGHT, rightCount, now);
            } else if (queueLeft > 0 && leftCount > 0) {
                conquestPhase3StartBleedPulseForPid(pid, CONQUEST_BLEED_PULSE_SIDE_LEFT, leftCount, now);
            } else if (queueRight > 0 && rightCount > 0) {
                conquestPhase3StartBleedPulseForPid(pid, CONQUEST_BLEED_PULSE_SIDE_RIGHT, rightCount, now);
            } else {
                activeSide = CONQUEST_BLEED_PULSE_SIDE_NONE;
                phase = CONQUEST_BLEED_PULSE_PHASE_IDLE;
                step = 0;
                limit = 0;
                nextAt = 0;
                break;
            }
            activeSide = State.conquest.debug.bleedPulseActiveSideByPid[pid];
            phase = State.conquest.debug.bleedPulsePhaseByPid[pid];
            step = State.conquest.debug.bleedPulseStepByPid[pid];
            limit = State.conquest.debug.bleedPulseLimitByPid[pid];
            nextAt = State.conquest.debug.bleedPulseNextAtByPid[pid];
            continue;
        }
        const timing = conquestPhase3GetBleedPulseTimingSeconds(limit);
        phase = CONQUEST_BLEED_PULSE_PHASE_HIDE;
        nextAt = now + timing.offSeconds;
    }

    State.conquest.debug.bleedPulseQueueLeftByPid[pid] = queueLeft;
    State.conquest.debug.bleedPulseQueueRightByPid[pid] = queueRight;
    State.conquest.debug.bleedPulseActiveSideByPid[pid] = activeSide;
    State.conquest.debug.bleedPulseStepByPid[pid] = step;
    State.conquest.debug.bleedPulseLimitByPid[pid] = limit;
    State.conquest.debug.bleedPulsePhaseByPid[pid] = phase;
    State.conquest.debug.bleedPulseNextAtByPid[pid] = nextAt;

    if (activeSide === CONQUEST_BLEED_PULSE_SIDE_NONE || phase !== CONQUEST_BLEED_PULSE_PHASE_HIDE) {
        return { hideLeftIndex: -1, hideRightIndex: -1 };
    }
    const slot = Math.max(0, Math.min(CONQUEST_HUD_TICKET_BLEED_CHEVRON_COUNT - 1, (limit - 1) - step));
    if (activeSide === CONQUEST_BLEED_PULSE_SIDE_LEFT && slot < leftCount) {
        return { hideLeftIndex: slot, hideRightIndex: -1 };
    }
    if (activeSide === CONQUEST_BLEED_PULSE_SIDE_RIGHT && slot < rightCount) {
        return { hideLeftIndex: -1, hideRightIndex: slot };
    }
    return { hideLeftIndex: -1, hideRightIndex: -1 };
}

// Queues one or more bleed-pulse animations for every player from the team that just lost tickets.
function conquestPhase3QueueBleedPulseForLoss(losingTeam: TeamID, bleedUnits: number): void {
    const pulseCount = Math.max(0, Math.floor(bleedUnits));
    if (pulseCount <= 0) return;
    const players = mod.AllPlayers();
    const playerCount = mod.CountOf(players);
    let queuedAny = false;
    for (let i = 0; i < playerCount; i++) {
        const player = mod.ValueInArray(players, i) as mod.Player;
        if (!player || !mod.IsPlayerValid(player)) continue;
        const pid = safeGetPlayerId(player);
        if (pid === undefined) continue;
        const playerTeam = safeGetTeamNumberFromPlayer(player, 0);
        if (playerTeam === 0) continue;
        if (playerTeam === losingTeam) {
            State.conquest.debug.bleedPulseQueueLeftByPid[pid] = Math.max(
                0,
                (State.conquest.debug.bleedPulseQueueLeftByPid[pid] ?? 0) + pulseCount
            );
            queuedAny = true;
            continue;
        }
        State.conquest.debug.bleedPulseQueueRightByPid[pid] = Math.max(
            0,
            (State.conquest.debug.bleedPulseQueueRightByPid[pid] ?? 0) + pulseCount
        );
        queuedAny = true;
    }
    if (queuedAny) conquestPhase3MarkHudDirty();
}

// Marks conquest HUD projections dirty so the next live tick performs a render pass.
function conquestPhase3MarkHudDirty(): void {
    State.conquest.debug.hudDirty = true;
}

// Returns true when combat HUD projection is enabled in both runtime debug and config gates.
function conquestPhase3ShouldRunCombatHud(): boolean {
    return State.conquest.debug.hudEnabled && CONQUEST_COMBAT_HUD_ENABLED;
}

// Refreshes top-HUD derived slices for all viewers without touching combat lane refs.
function conquestPhase3RefreshTopHudDerivedSlicesForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const player = mod.ValueInArray(players, i) as mod.Player;
        if (!player || !mod.IsPlayerValid(player)) continue;
        const pid = safeGetPlayerId(player);
        if (pid === undefined) continue;
        const topHelpReadyVm = deriveConquestHudHelpReadyViewModel(pid);
        const topStatusVm = deriveConquestHudStatusViewModel(topHelpReadyVm);
        const topClockVm = deriveConquestHudClockViewModel();
        conquestPhase3PublishTopHudDerivedSlicesForPid(pid, topStatusVm, topHelpReadyVm, topClockVm);
    }
}

// Runs the isolated combat-loop owner path.
// v2 and legacy combat lanes are intentionally updated through separate owner branches.
function conquestPhase3RunCombatLoopByOwner(force?: boolean): void {
    if (isConquestCombatRenderOwnerV2()) {
        if (!conquestPhase3ShouldRunCombatHud()) {
            hideAllConquestCombatHudV2();
            return;
        }
        try {
            conquestCombatHudV2TickMain(force);
            conquestCombatHudV2TickAnimation(force);
        } catch {
            // Fail-close combat-v2 projection on runtime fault so gameplay flow continues.
            hideAllConquestCombatHudV2();
        }
        return;
    }
    // Legacy-owner mode keeps v2 hidden.
    hideAllConquestCombatHudV2();
}

// Force-hides combat HUD widgets for all cached players without rebuilding trees.
// This supports staged rebuild work where non-combat UI must remain available.
function conquestPhase3ForceHideCombatHudForAllPlayersFromCache(): void {
    const cachedHudByPid = State.hudCache.hudByPid;
    for (const pidKey in cachedHudByPid) {
        if (!Object.prototype.hasOwnProperty.call(cachedHudByPid, pidKey)) continue;
        const refs = cachedHudByPid[Number(pidKey)];
        if (!refs) continue;
        conquestPhase3ForceHideAllV2Widgets(refs);
        safeSetUIWidgetVisible(refs.conquestCombatRoot, false);
    }
}

// One-shot legacy suppression gate for core HUD mode.
// Running full legacy hide on every 0.25s core tick is expensive and can delay UI/input callbacks.
let conquestPhase3CoreLegacySuppressionArmed = true;

// Applies legacy HUD suppression when core mode starts or when a force refresh explicitly requests it.
function conquestPhase3ApplyCoreLegacySuppression(force?: boolean): void {
    if (!force && !conquestPhase3CoreLegacySuppressionArmed) return;
    hideAllConquestCombatHudV2();
    conquestPhase3ForceHideCombatHudForAllPlayersFromCache();
    conquestPhase3CoreLegacySuppressionArmed = false;
}

// Re-arms core suppression so the next transition back to core mode performs one cleanup pass.
function conquestPhase3ArmCoreLegacySuppression(): void {
    conquestPhase3CoreLegacySuppressionArmed = true;
}

// Publishes derived top-HUD slices shared by status/help/clock owners.
function conquestPhase3PublishTopHudDerivedSlicesForPid(
    pid: number,
    status: ConquestHudStatusViewModel,
    helpReady: ConquestHudHelpReadyViewModel,
    clock: ConquestHudClockViewModel
): void {
    State.conquest.debug.hudStatusVmByPid[pid] = {
        isLive: status.isLive,
        isGameOver: status.isGameOver,
        showRoundStateLine: status.showRoundStateLine,
        showPlayersReadyLine: status.showPlayersReadyLine,
    };
    State.conquest.debug.hudHelpReadyVmByPid[pid] = {
        showHelp: helpReady.showHelp,
        showReady: helpReady.showReady,
    };
    State.conquest.debug.hudClockVmByPid[pid] = {
        remainingSeconds: clock.remainingSeconds,
        isLowTime: clock.isLowTime,
        isPaused: clock.isPaused,
    };
}

// Refreshes derived top-HUD slices for one player.
// This is used by status/help/clock owners when they render outside the conquest HUD tick path.
// Important:
// - Clock remaining seconds are time-variant every second while live.
// - Therefore this function must refresh the derived slices each call, not only initialize once.
function conquestPhase3EnsureTopHudDerivedSlicesForPid(pid: number): void {
    const helpReady = deriveConquestHudHelpReadyViewModel(pid);
    const status = deriveConquestHudStatusViewModel(helpReady);
    const clock = deriveConquestHudClockViewModel();
    conquestPhase3PublishTopHudDerivedSlicesForPid(pid, status, helpReady, clock);
}

// Publishes derived top-HUD view-model slices for status/help/clock owners.
function conquestPhase3PublishDerivedHudSlicesForPid(pid: number, vm: ConquestHudViewModel): void {
    conquestPhase3PublishTopHudDerivedSlicesForPid(pid, vm.status, vm.helpReady, vm.clock);
}

// Publishes one compact HUD projection snapshot for this player to aid transition debugging.
// This is diagnostics-only state and does not own or mutate render/gameplay decisions.
function conquestPhase3PublishHudProjectionDebugSnapshotForPid(
    pid: number,
    vm: ConquestHudViewModel | undefined
): void {
    const debug = State.conquest.debug;
    const engagedObjId = State.conquest.capture.engagedObjIdByPid[pid] ?? 0;
    const popoutVisible = vm?.activeFlagPopout.visible === true;
    const popoutObjId = vm?.activeFlagPopout.objId ?? 0;
    const engageVisible = vm?.engage.visible === true;
    const swapPending = debug.teamSwapHudResetPendingByPid[pid] === true;
    const deployed = State.players.deployedByPid[pid] === true;
    let activeTopSlotNeutralized = false;
    let activeTopSlotBorderVisible = false;
    if (vm && engagedObjId !== 0) {
        const slots = vm.flags.slots;
        for (let i = 0; i < slots.length; i++) {
            const slotVm = slots[i];
            if (!slotVm || slotVm.objId !== engagedObjId) continue;
            activeTopSlotBorderVisible = slotVm.borderVisible === true;
            activeTopSlotNeutralized = slotVm.borderVisible === false
                && slotVm.fillVisible === false
                && slotVm.labelVisible === false
                && slotVm.percentVisible === false;
            break;
        }
    }

    const previousEngagedObjId = debug.hudProjectionEngagedObjIdByPid[pid] ?? 0;
    const previousPopoutVisible = debug.hudProjectionPopoutVisibleByPid[pid] === true;
    const previousPopoutObjId = debug.hudProjectionPopoutObjIdByPid[pid] ?? 0;
    const previousEngageVisible = debug.hudProjectionEngageVisibleByPid[pid] === true;
    const previousActiveTopSlotNeutralized = debug.hudProjectionActiveTopSlotNeutralizedByPid[pid] === true;
    const previousActiveTopSlotBorderVisible = debug.hudProjectionActiveTopSlotBorderVisibleByPid[pid] === true;
    const previousSwapPending = debug.hudProjectionSwapPendingByPid[pid] === true;
    const previousDeployed = debug.hudProjectionDeployedByPid[pid] === true;
    const changed = previousEngagedObjId !== engagedObjId
        || previousPopoutVisible !== popoutVisible
        || previousPopoutObjId !== popoutObjId
        || previousEngageVisible !== engageVisible
        || previousActiveTopSlotNeutralized !== activeTopSlotNeutralized
        || previousActiveTopSlotBorderVisible !== activeTopSlotBorderVisible
        || previousSwapPending !== swapPending
        || previousDeployed !== deployed;
    if (changed) {
        debug.hudProjectionTransitionCountByPid[pid] = (debug.hudProjectionTransitionCountByPid[pid] ?? 0) + 1;
        debug.hudProjectionLastChangedAtByPid[pid] = debug.hudLastUpdatedAtSeconds;
    }

    debug.hudProjectionEngagedObjIdByPid[pid] = engagedObjId;
    debug.hudProjectionPopoutVisibleByPid[pid] = popoutVisible;
    debug.hudProjectionPopoutObjIdByPid[pid] = popoutObjId;
    debug.hudProjectionEngageVisibleByPid[pid] = engageVisible;
    debug.hudProjectionActiveTopSlotNeutralizedByPid[pid] = activeTopSlotNeutralized;
    debug.hudProjectionActiveTopSlotBorderVisibleByPid[pid] = activeTopSlotBorderVisible;
    debug.hudProjectionSwapPendingByPid[pid] = swapPending;
    debug.hudProjectionDeployedByPid[pid] = deployed;
}

// Tracks per-player render bursts and enforces one conquest HUD render pass per short time bucket.
// Returns true when this call should render; returns false for duplicate same-bucket passes.
function conquestPhase3TrackSinglePassRenderForPid(pid: number): boolean {
    const bucket = Math.floor(mod.GetMatchTimeElapsed() * 20);
    const previousBucket = State.conquest.debug.hudRenderBucketByPid[pid];
    if (previousBucket !== bucket) {
        State.conquest.debug.hudRenderBucketByPid[pid] = bucket;
        State.conquest.debug.hudRenderBurstByPid[pid] = 1;
        return true;
    }

    const nextBurst = (State.conquest.debug.hudRenderBurstByPid[pid] ?? 1) + 1;
    State.conquest.debug.hudRenderBurstByPid[pid] = nextBurst;
    if (nextBurst > 1) {
        const duplicateCount = State.conquest.debug.hudRenderDuplicateBurstByPid[pid] ?? 0;
        State.conquest.debug.hudRenderDuplicateBurstByPid[pid] = duplicateCount + 1;
    }
    return false;
}

// Returns true when the minimum conquest HUD refs required for safe render are present.
// If false, caller should rebuild the player's conquest HUD instead of rendering partial state.
function conquestPhase3WidgetBelongsToPid(widget: mod.UIWidget | undefined, pid: number): boolean {
    if (!widget) return false;
    try {
        const widgetName = mod.GetUIWidgetName(widget);
        return widgetName.indexOf(`_${pid}`) !== -1;
    } catch {
        return false;
    }
}

function conquestPhase3GetWidgetName(widget: mod.UIWidget | undefined): string {
    if (!widget) return "";
    try {
        return mod.GetUIWidgetName(widget);
    } catch {
        return "";
    }
}

function conquestPhase3GetWidgetParentName(widget: mod.UIWidget | undefined): string {
    if (!widget) return "";
    try {
        const parent = mod.GetUIWidgetParent(widget);
        return conquestPhase3GetWidgetName(parent);
    } catch {
        return "";
    }
}

// Returns true when the widget's direct parent resolves to the requested widget name.
function conquestPhase3WidgetHasNamedParent(widget: mod.UIWidget | undefined, parentName: string): boolean {
    if (!widget) return false;
    try {
        const parent = mod.GetUIWidgetParent(widget);
        return conquestPhase3GetWidgetName(parent) === parentName;
    } catch {
        return false;
    }
}

// Returns true when the widget's direct parent is exactly the provided parent handle.
function conquestPhase3WidgetHasParentHandle(
    widget: mod.UIWidget | undefined,
    parent: mod.UIWidget | undefined
): boolean {
    if (!widget || !parent) return false;
    try {
        const resolvedParent = mod.GetUIWidgetParent(widget);
        return !!resolvedParent && resolvedParent === parent;
    } catch {
        return false;
    }
}

// Returns true when the widget anchor matches the expected value.
function conquestPhase3WidgetHasAnchor(widget: mod.UIWidget | undefined, anchor: mod.UIAnchor): boolean {
    if (!widget) return false;
    try {
        return mod.GetUIWidgetAnchor(widget) === anchor;
    } catch {
        return false;
    }
}

// Returns true when widget XY position is within tolerance of expected local coordinates.
function conquestPhase3WidgetHasPositionXY(
    widget: mod.UIWidget | undefined,
    x: number,
    y: number,
    tolerance: number = 1
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

function conquestPhase3HasCriticalHudRefs(refs: HudRefs): boolean {
    const pid = refs.pid;
    if (!conquestPhase3WidgetBelongsToPid(refs.conquestTicketsDebugRoot, pid)) return false;
    if (!conquestPhase3WidgetBelongsToPid(refs.conquestTicketsTeam1Container, pid)) return false;
    if (!conquestPhase3WidgetBelongsToPid(refs.conquestTicketsTeam2Container, pid)) return false;
    if (!conquestPhase3WidgetBelongsToPid(refs.conquestTicketsDebugTeam1, pid)) return false;
    if (!conquestPhase3WidgetBelongsToPid(refs.conquestTicketsDebugTeam2, pid)) return false;
    if (!conquestPhase3WidgetBelongsToPid(refs.conquestTicketsDebugLeftBarTrack, pid)) return false;
    if (!conquestPhase3WidgetBelongsToPid(refs.conquestTicketsDebugLeftBarFill, pid)) return false;
    if (!conquestPhase3WidgetBelongsToPid(refs.conquestTicketsDebugRightBarTrack, pid)) return false;
    if (!conquestPhase3WidgetBelongsToPid(refs.conquestTicketsDebugRightBarFill, pid)) return false;
    if (!conquestPhase3WidgetBelongsToPid(refs.conquestFlagsDebugRoot, pid)) return false;
    if (!conquestPhase3WidgetBelongsToPid(refs.conquestFlagsEngageRoot, pid)) return false;
    if (!conquestPhase3WidgetBelongsToPid(refs.conquestFlagsEngageTrack, pid)) return false;

    // Root-chain authority:
    // TopHudRoot_{pid} -> ConquestCombatHudRoot_{pid} -> tickets/flags roots.
    const combatRootName = `ConquestCombatHudRoot_${pid}`;
    const combatRoot = refs.conquestCombatRoot;
    const topHudRoot = refs.topHudRoot;
    if (!combatRoot || !topHudRoot) return false;
    if (!conquestPhase3WidgetHasParentHandle(combatRoot, topHudRoot)) return false;
    if (!conquestPhase3WidgetHasParentHandle(refs.conquestTicketsDebugRoot, combatRoot)) return false;
    if (!conquestPhase3WidgetHasParentHandle(refs.conquestFlagsDebugRoot, combatRoot)) return false;
    if (!conquestPhase3WidgetHasNamedParent(refs.conquestTicketsDebugRoot, combatRootName)) return false;
    if (!conquestPhase3WidgetHasNamedParent(refs.conquestFlagsDebugRoot, combatRootName)) return false;
    if (!conquestPhase3WidgetHasNamedParent(combatRoot, `TopHudRoot_${pid}`)) return false;
    if (!conquestPhase3WidgetHasAnchor(topHudRoot, mod.UIAnchor.TopCenter)) return false;
    if (!conquestPhase3WidgetHasPositionXY(topHudRoot, 0, 0)) return false;
    if (!conquestPhase3WidgetHasAnchor(combatRoot, mod.UIAnchor.TopCenter)) return false;
    if (!conquestPhase3WidgetHasPositionXY(combatRoot, 0, CONQUEST_HUD_TICKETS_FLAGS_SHIFT_Y)) return false;
    if (!conquestPhase3WidgetHasAnchor(refs.conquestTicketsDebugRoot, mod.UIAnchor.TopCenter)) return false;
    if (!conquestPhase3WidgetHasPositionXY(refs.conquestTicketsDebugRoot, 0, 0)) return false;
    if (!conquestPhase3WidgetHasAnchor(refs.conquestFlagsDebugRoot, mod.UIAnchor.TopCenter)) return false;
    if (!conquestPhase3WidgetHasPositionXY(refs.conquestFlagsDebugRoot, 0, 0)) return false;
    if (!conquestPhase3WidgetHasParentHandle(refs.conquestTicketsTeam1Container, refs.conquestTicketsDebugRoot)) return false;
    if (!conquestPhase3WidgetHasParentHandle(refs.conquestTicketsTeam2Container, refs.conquestTicketsDebugRoot)) return false;
    if (!conquestPhase3WidgetHasParentHandle(refs.conquestTicketsDebugTeam1, refs.conquestTicketsTeam1Container)) return false;
    if (!conquestPhase3WidgetHasParentHandle(refs.conquestTicketsDebugTeam2, refs.conquestTicketsTeam2Container)) return false;
    if (!conquestPhase3WidgetHasParentHandle(refs.conquestTicketsDebugLeftBarTrack, refs.conquestTicketsDebugRoot)) return false;
    if (!conquestPhase3WidgetHasParentHandle(refs.conquestTicketsDebugLeftBarFill, refs.conquestTicketsDebugLeftBarTrack)) return false;
    if (!conquestPhase3WidgetHasParentHandle(refs.conquestTicketsDebugRightBarTrack, refs.conquestTicketsDebugRoot)) return false;
    if (!conquestPhase3WidgetHasParentHandle(refs.conquestTicketsDebugRightBarFill, refs.conquestTicketsDebugRightBarTrack)) return false;
    if (!conquestPhase3WidgetHasParentHandle(refs.conquestFlagsEngageRoot, refs.conquestFlagsDebugRoot)) return false;
    if (!conquestPhase3WidgetHasParentHandle(refs.conquestFlagsEngageTrack, refs.conquestFlagsEngageRoot)) return false;
    if (refs.conquestFlagsActivePopoutRoot && !conquestPhase3WidgetHasParentHandle(refs.conquestFlagsActivePopoutRoot, refs.conquestFlagsDebugRoot)) return false;

    const mappedCount = Math.max(1, Math.min(7, State.conquest.capture.mappedObjIdsInOrder.length));
    const slotRoots = refs.conquestFlagsDebugSlotRoots ?? [];
    const slotFills = refs.conquestFlagsDebugFillRows ?? [];
    const slotLabels = refs.conquestFlagsDebugLabelRows ?? [];
    const slotPercents = refs.conquestFlagsDebugPercentRoots ?? [];
    for (let i = 0; i < mappedCount; i++) {
        if (!conquestPhase3WidgetBelongsToPid(slotRoots[i], pid)) return false;
        if (!conquestPhase3WidgetBelongsToPid(slotFills[i], pid)) return false;
        if (!conquestPhase3WidgetBelongsToPid(slotLabels[i], pid)) return false;
        if (!conquestPhase3WidgetBelongsToPid(slotPercents[i], pid)) return false;
        if (!conquestPhase3WidgetHasParentHandle(slotRoots[i], refs.conquestFlagsDebugRoot)) return false;
        if (!conquestPhase3WidgetHasParentHandle(slotFills[i], slotRoots[i])) return false;
        if (!conquestPhase3WidgetHasParentHandle(slotLabels[i], slotRoots[i])) return false;
        if (!conquestPhase3WidgetHasParentHandle(slotPercents[i], refs.conquestFlagsDebugRoot)) return false;
    }
    return true;
}

// Force-hides active pop-out widgets by cache-or-name resolution and backfills refs.
function conquestPhase3ForceHideActivePopoutWidgetsForPid(pid: number): void {
    const refs = State.hudCache.hudByPid[pid];
    const popoutRoot = refs?.conquestFlagsActivePopoutRoot ?? safeFind(`ConquestFlagHudActivePopoutRoot_${pid}`);
    const popoutSlot = refs?.conquestFlagsActivePopoutSlot ?? safeFind(`ConquestFlagHudActivePopoutSlot_${pid}`);
    const popoutBorder = refs?.conquestFlagsActivePopoutBorder ?? safeFind(`ConquestFlagHudActivePopoutBorder_${pid}`);
    const popoutFill = refs?.conquestFlagsActivePopoutFill ?? safeFind(`ConquestFlagHudActivePopoutFill_${pid}`);
    const popoutLabelShadowRight = refs?.conquestFlagsActivePopoutLabelShadowRight ?? safeFind(`ConquestFlagHudActivePopoutLabelShadowRight_${pid}`);
    const popoutLabelShadowLeft = refs?.conquestFlagsActivePopoutLabelShadowLeft ?? safeFind(`ConquestFlagHudActivePopoutLabelShadowLeft_${pid}`);
    const popoutLabelShadowUp = refs?.conquestFlagsActivePopoutLabelShadowUp ?? safeFind(`ConquestFlagHudActivePopoutLabelShadowUp_${pid}`);
    const popoutLabelShadowDown = refs?.conquestFlagsActivePopoutLabelShadowDown ?? safeFind(`ConquestFlagHudActivePopoutLabelShadowDown_${pid}`);
    const popoutLabelShadowUpLeft = refs?.conquestFlagsActivePopoutLabelShadowUpLeft ?? safeFind(`ConquestFlagHudActivePopoutLabelShadowUpLeft_${pid}`);
    const popoutLabelShadowUpRight = refs?.conquestFlagsActivePopoutLabelShadowUpRight ?? safeFind(`ConquestFlagHudActivePopoutLabelShadowUpRight_${pid}`);
    const popoutLabelShadowDownRight = refs?.conquestFlagsActivePopoutLabelShadowDownRight ?? safeFind(`ConquestFlagHudActivePopoutLabelShadowDownRight_${pid}`);
    const popoutLabelShadowDownLeft = refs?.conquestFlagsActivePopoutLabelShadowDownLeft ?? safeFind(`ConquestFlagHudActivePopoutLabelShadowDownLeft_${pid}`);
    const popoutLabel = refs?.conquestFlagsActivePopoutLabel ?? safeFind(`ConquestFlagHudActivePopoutLabel_${pid}`);
    const popoutPercentRoot = refs?.conquestFlagsActivePopoutPercentRoot ?? safeFind(`ConquestFlagHudActivePopoutPercentRoot_${pid}`);
    const popoutPercentShadowRight = refs?.conquestFlagsActivePopoutPercentShadowRight ?? safeFind(`ConquestFlagHudActivePopoutPercentShadowRight_${pid}`);
    const popoutPercentShadowLeft = refs?.conquestFlagsActivePopoutPercentShadowLeft ?? safeFind(`ConquestFlagHudActivePopoutPercentShadowLeft_${pid}`);
    const popoutPercentShadowUp = refs?.conquestFlagsActivePopoutPercentShadowUp ?? safeFind(`ConquestFlagHudActivePopoutPercentShadowUp_${pid}`);
    const popoutPercentShadowDown = refs?.conquestFlagsActivePopoutPercentShadowDown ?? safeFind(`ConquestFlagHudActivePopoutPercentShadowDown_${pid}`);
    const popoutPercentShadowUpLeft = refs?.conquestFlagsActivePopoutPercentShadowUpLeft ?? safeFind(`ConquestFlagHudActivePopoutPercentShadowUpLeft_${pid}`);
    const popoutPercentShadowUpRight = refs?.conquestFlagsActivePopoutPercentShadowUpRight ?? safeFind(`ConquestFlagHudActivePopoutPercentShadowUpRight_${pid}`);
    const popoutPercentShadowDownRight = refs?.conquestFlagsActivePopoutPercentShadowDownRight ?? safeFind(`ConquestFlagHudActivePopoutPercentShadowDownRight_${pid}`);
    const popoutPercentShadowDownLeft = refs?.conquestFlagsActivePopoutPercentShadowDownLeft ?? safeFind(`ConquestFlagHudActivePopoutPercentShadowDownLeft_${pid}`);
    const popoutPercentShadowInner = refs?.conquestFlagsActivePopoutPercentShadowInner ?? safeFind(`ConquestFlagHudActivePopoutPercentShadowInner_${pid}`);
    const popoutPercentText = refs?.conquestFlagsActivePopoutPercentText ?? safeFind(`ConquestFlagHudActivePopoutPercentText_${pid}`);

    safeSetUIWidgetVisible(popoutRoot, false);
    safeSetUIWidgetVisible(popoutSlot, false);
    safeSetUIWidgetVisible(popoutBorder, false);
    safeSetUIWidgetVisible(popoutFill, false);
    safeSetUIWidgetVisible(popoutLabelShadowRight, false);
    safeSetUIWidgetVisible(popoutLabelShadowLeft, false);
    safeSetUIWidgetVisible(popoutLabelShadowUp, false);
    safeSetUIWidgetVisible(popoutLabelShadowDown, false);
    safeSetUIWidgetVisible(popoutLabelShadowUpLeft, false);
    safeSetUIWidgetVisible(popoutLabelShadowUpRight, false);
    safeSetUIWidgetVisible(popoutLabelShadowDownRight, false);
    safeSetUIWidgetVisible(popoutLabelShadowDownLeft, false);
    safeSetUIWidgetVisible(popoutLabel, false);
    safeSetUIWidgetVisible(popoutPercentRoot, false);
    safeSetUIWidgetVisible(popoutPercentShadowRight, false);
    safeSetUIWidgetVisible(popoutPercentShadowLeft, false);
    safeSetUIWidgetVisible(popoutPercentShadowUp, false);
    safeSetUIWidgetVisible(popoutPercentShadowDown, false);
    safeSetUIWidgetVisible(popoutPercentShadowUpLeft, false);
    safeSetUIWidgetVisible(popoutPercentShadowUpRight, false);
    safeSetUIWidgetVisible(popoutPercentShadowDownRight, false);
    safeSetUIWidgetVisible(popoutPercentShadowDownLeft, false);
    safeSetUIWidgetVisible(popoutPercentShadowInner, false);
    safeSetUIWidgetVisible(popoutPercentText, false);

    if (refs) {
        refs.conquestFlagsActivePopoutRoot = popoutRoot;
        refs.conquestFlagsActivePopoutSlot = popoutSlot;
        refs.conquestFlagsActivePopoutBorder = popoutBorder;
        refs.conquestFlagsActivePopoutFill = popoutFill;
        refs.conquestFlagsActivePopoutLabelShadowRight = popoutLabelShadowRight;
        refs.conquestFlagsActivePopoutLabelShadowLeft = popoutLabelShadowLeft;
        refs.conquestFlagsActivePopoutLabelShadowUp = popoutLabelShadowUp;
        refs.conquestFlagsActivePopoutLabelShadowDown = popoutLabelShadowDown;
        refs.conquestFlagsActivePopoutLabelShadowUpLeft = popoutLabelShadowUpLeft;
        refs.conquestFlagsActivePopoutLabelShadowUpRight = popoutLabelShadowUpRight;
        refs.conquestFlagsActivePopoutLabelShadowDownRight = popoutLabelShadowDownRight;
        refs.conquestFlagsActivePopoutLabelShadowDownLeft = popoutLabelShadowDownLeft;
        refs.conquestFlagsActivePopoutLabel = popoutLabel;
        refs.conquestFlagsActivePopoutPercentRoot = popoutPercentRoot;
        refs.conquestFlagsActivePopoutPercentShadowRight = popoutPercentShadowRight;
        refs.conquestFlagsActivePopoutPercentShadowLeft = popoutPercentShadowLeft;
        refs.conquestFlagsActivePopoutPercentShadowUp = popoutPercentShadowUp;
        refs.conquestFlagsActivePopoutPercentShadowDown = popoutPercentShadowDown;
        refs.conquestFlagsActivePopoutPercentShadowUpLeft = popoutPercentShadowUpLeft;
        refs.conquestFlagsActivePopoutPercentShadowUpRight = popoutPercentShadowUpRight;
        refs.conquestFlagsActivePopoutPercentShadowDownRight = popoutPercentShadowDownRight;
        refs.conquestFlagsActivePopoutPercentShadowDownLeft = popoutPercentShadowDownLeft;
        refs.conquestFlagsActivePopoutPercentShadowInner = popoutPercentShadowInner;
        refs.conquestFlagsActivePopoutPercentText = popoutPercentText;
    }
}

// Strict ownership probe helper: hide all known V2 conquest ticket/flag widgets.
function conquestPhase3ForceHideAllV2Widgets(refs: HudRefs): void {
    const pid = refs.pid;
    safeSetUIWidgetVisible(refs.conquestTicketsDebugRoot, false);
    safeSetUIWidgetVisible(refs.conquestTicketsDebugTeam1Shadow, false);
    safeSetUIWidgetVisible(refs.conquestTicketsDebugTeam2Shadow, false);
    safeSetUIWidgetVisible(refs.conquestTicketsDebugTeam1, false);
    safeSetUIWidgetVisible(refs.conquestTicketsDebugTeam2, false);
    safeSetUIWidgetVisible(refs.conquestTicketsTeam1Container, false);
    safeSetUIWidgetVisible(refs.conquestTicketsTeam2Container, false);
    safeSetUIWidgetVisible(refs.conquestTicketsDebugLeftBarTrack, false);
    safeSetUIWidgetVisible(refs.conquestTicketsDebugLeftBarFill, false);
    safeSetUIWidgetVisible(refs.conquestTicketsDebugRightBarTrack, false);
    safeSetUIWidgetVisible(refs.conquestTicketsDebugRightBarFill, false);
    safeSetUIWidgetVisible(refs.conquestTicketsLeadLeftBorder, false);
    safeSetUIWidgetVisible(refs.conquestTicketsLeadRightBorder, false);
    safeSetUIWidgetVisible(refs.conquestTicketsLeadLeftCrownShadow, false);
    safeSetUIWidgetVisible(refs.conquestTicketsLeadRightCrownShadow, false);
    safeSetUIWidgetVisible(refs.conquestTicketsLeadLeftCrown, false);
    safeSetUIWidgetVisible(refs.conquestTicketsLeadRightCrown, false);
    const leftBleedChevrons = refs.conquestTicketsBleedLeftChevrons ?? [];
    const rightBleedChevrons = refs.conquestTicketsBleedRightChevrons ?? [];
    for (let chevronIndex = 0; chevronIndex < CONQUEST_HUD_TICKET_BLEED_CHEVRON_COUNT; chevronIndex++) {
        const slot = chevronIndex + 1;
        const leftCore = safeFind(`ConquestTicketsHudBleedChevronLeft${slot}_${pid}`) ?? leftBleedChevrons[chevronIndex];
        const rightCore = safeFind(`ConquestTicketsHudBleedChevronRight${slot}_${pid}`) ?? rightBleedChevrons[chevronIndex];
        leftBleedChevrons[chevronIndex] = leftCore;
        rightBleedChevrons[chevronIndex] = rightCore;
        safeSetUIWidgetVisible(leftCore, false);
        safeSetUIWidgetVisible(rightCore, false);
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
    safeSetUIWidgetVisible(refs.conquestTicketsSlash, false);

    safeSetUIWidgetVisible(refs.conquestFlagsDebugRoot, false);
    conquestPhase3ForceHideActivePopoutWidgetsForPid(pid);
    conquestPhase3ForceHideEngageWidgetsForPid(pid);
    const slotRoots = refs.conquestFlagsDebugSlotRoots ?? (refs.conquestFlagsDebugSlotRoots = []);
    const slotBorders = refs.conquestFlagsDebugBorderRows ?? (refs.conquestFlagsDebugBorderRows = []);
    const slotFills = refs.conquestFlagsDebugFillRows ?? (refs.conquestFlagsDebugFillRows = []);
    const slotLabelShadowsRight = refs.conquestFlagsDebugLabelShadowRightRows ?? (refs.conquestFlagsDebugLabelShadowRightRows = []);
    const slotLabelShadowsLeft = refs.conquestFlagsDebugLabelShadowLeftRows ?? (refs.conquestFlagsDebugLabelShadowLeftRows = []);
    const slotLabelShadowsUp = refs.conquestFlagsDebugLabelShadowUpRows ?? (refs.conquestFlagsDebugLabelShadowUpRows = []);
    const slotLabelShadowsDown = refs.conquestFlagsDebugLabelShadowDownRows ?? (refs.conquestFlagsDebugLabelShadowDownRows = []);
    const slotLabelShadowsUpLeft = refs.conquestFlagsDebugLabelShadowUpLeftRows ?? (refs.conquestFlagsDebugLabelShadowUpLeftRows = []);
    const slotLabelShadowsUpRight = refs.conquestFlagsDebugLabelShadowUpRightRows ?? (refs.conquestFlagsDebugLabelShadowUpRightRows = []);
    const slotLabelShadowsDownRight = refs.conquestFlagsDebugLabelShadowDownRightRows ?? (refs.conquestFlagsDebugLabelShadowDownRightRows = []);
    const slotLabelShadowsDownLeft = refs.conquestFlagsDebugLabelShadowDownLeftRows ?? (refs.conquestFlagsDebugLabelShadowDownLeftRows = []);
    const slotLabelShadowsInner = refs.conquestFlagsDebugLabelShadowInnerRows ?? (refs.conquestFlagsDebugLabelShadowInnerRows = []);
    const slotLabelShadowsInnerDeep = refs.conquestFlagsDebugLabelShadowInnerDeepRows ?? (refs.conquestFlagsDebugLabelShadowInnerDeepRows = []);
    const slotLabels = refs.conquestFlagsDebugLabelRows ?? (refs.conquestFlagsDebugLabelRows = []);
    const slotPercentRoots = refs.conquestFlagsDebugPercentRoots ?? (refs.conquestFlagsDebugPercentRoots = []);
    const slotPercentShadowsRight = refs.conquestFlagsDebugPercentShadowRightRows ?? (refs.conquestFlagsDebugPercentShadowRightRows = []);
    const slotPercentShadowsLeft = refs.conquestFlagsDebugPercentShadowLeftRows ?? (refs.conquestFlagsDebugPercentShadowLeftRows = []);
    const slotPercentShadowsUp = refs.conquestFlagsDebugPercentShadowUpRows ?? (refs.conquestFlagsDebugPercentShadowUpRows = []);
    const slotPercentShadowsDown = refs.conquestFlagsDebugPercentShadowDownRows ?? (refs.conquestFlagsDebugPercentShadowDownRows = []);
    const slotPercentShadowsUpLeft = refs.conquestFlagsDebugPercentShadowUpLeftRows ?? (refs.conquestFlagsDebugPercentShadowUpLeftRows = []);
    const slotPercentShadowsUpRight = refs.conquestFlagsDebugPercentShadowUpRightRows ?? (refs.conquestFlagsDebugPercentShadowUpRightRows = []);
    const slotPercentShadowsDownRight = refs.conquestFlagsDebugPercentShadowDownRightRows ?? (refs.conquestFlagsDebugPercentShadowDownRightRows = []);
    const slotPercentShadowsDownLeft = refs.conquestFlagsDebugPercentShadowDownLeftRows ?? (refs.conquestFlagsDebugPercentShadowDownLeftRows = []);
    const slotPercentShadowsInner = refs.conquestFlagsDebugPercentShadowInnerRows ?? (refs.conquestFlagsDebugPercentShadowInnerRows = []);
    const slotPercentTexts = refs.conquestFlagsDebugPercentTextRows ?? (refs.conquestFlagsDebugPercentTextRows = []);
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
        safeSetUIWidgetVisible(conquestPhase3ResolveCachedIndexedWidget(slotRoots, i, `ConquestFlagHudSlot_${pid}_${i}`), false);
        safeSetUIWidgetVisible(conquestPhase3ResolveCachedIndexedWidget(slotBorders, i, `ConquestFlagHudBorder_${pid}_${i}`), false);
        safeSetUIWidgetVisible(conquestPhase3ResolveCachedIndexedWidget(slotFills, i, `ConquestFlagHudFill_${pid}_${i}`), false);
        safeSetUIWidgetVisible(conquestPhase3ResolveCachedIndexedWidget(slotLabelShadowsRight, i, `ConquestFlagHudLabelShadowRight_${pid}_${i}`), false);
        safeSetUIWidgetVisible(conquestPhase3ResolveCachedIndexedWidget(slotLabelShadowsLeft, i, `ConquestFlagHudLabelShadowLeft_${pid}_${i}`), false);
        safeSetUIWidgetVisible(conquestPhase3ResolveCachedIndexedWidget(slotLabelShadowsUp, i, `ConquestFlagHudLabelShadowUp_${pid}_${i}`), false);
        safeSetUIWidgetVisible(conquestPhase3ResolveCachedIndexedWidget(slotLabelShadowsDown, i, `ConquestFlagHudLabelShadowDown_${pid}_${i}`), false);
        safeSetUIWidgetVisible(conquestPhase3ResolveCachedIndexedWidget(slotLabelShadowsUpLeft, i, `ConquestFlagHudLabelShadowUpLeft_${pid}_${i}`), false);
        safeSetUIWidgetVisible(conquestPhase3ResolveCachedIndexedWidget(slotLabelShadowsUpRight, i, `ConquestFlagHudLabelShadowUpRight_${pid}_${i}`), false);
        safeSetUIWidgetVisible(conquestPhase3ResolveCachedIndexedWidget(slotLabelShadowsDownRight, i, `ConquestFlagHudLabelShadowDownRight_${pid}_${i}`), false);
        safeSetUIWidgetVisible(conquestPhase3ResolveCachedIndexedWidget(slotLabelShadowsDownLeft, i, `ConquestFlagHudLabelShadowDownLeft_${pid}_${i}`), false);
        safeSetUIWidgetVisible(conquestPhase3ResolveCachedIndexedWidget(slotLabelShadowsInner, i, `ConquestFlagHudLabelShadowInner_${pid}_${i}`), false);
        safeSetUIWidgetVisible(conquestPhase3ResolveCachedIndexedWidget(slotLabelShadowsInnerDeep, i, `ConquestFlagHudLabelShadowInnerDeep_${pid}_${i}`), false);
        safeSetUIWidgetVisible(conquestPhase3ResolveCachedIndexedWidget(slotLabels, i, `ConquestFlagHudLabel_${pid}_${i}`), false);
        safeSetUIWidgetVisible(conquestPhase3ResolveCachedIndexedWidget(slotPercentRoots, i, `ConquestFlagHudPercentRoot_${pid}_${i}`), false);
        safeSetUIWidgetVisible(conquestPhase3ResolveCachedIndexedWidget(slotPercentShadowsRight, i, `ConquestFlagHudPercentShadowRight_${pid}_${i}`), false);
        safeSetUIWidgetVisible(conquestPhase3ResolveCachedIndexedWidget(slotPercentShadowsLeft, i, `ConquestFlagHudPercentShadowLeft_${pid}_${i}`), false);
        safeSetUIWidgetVisible(conquestPhase3ResolveCachedIndexedWidget(slotPercentShadowsUp, i, `ConquestFlagHudPercentShadowUp_${pid}_${i}`), false);
        safeSetUIWidgetVisible(conquestPhase3ResolveCachedIndexedWidget(slotPercentShadowsDown, i, `ConquestFlagHudPercentShadowDown_${pid}_${i}`), false);
        safeSetUIWidgetVisible(conquestPhase3ResolveCachedIndexedWidget(slotPercentShadowsUpLeft, i, `ConquestFlagHudPercentShadowUpLeft_${pid}_${i}`), false);
        safeSetUIWidgetVisible(conquestPhase3ResolveCachedIndexedWidget(slotPercentShadowsUpRight, i, `ConquestFlagHudPercentShadowUpRight_${pid}_${i}`), false);
        safeSetUIWidgetVisible(conquestPhase3ResolveCachedIndexedWidget(slotPercentShadowsDownRight, i, `ConquestFlagHudPercentShadowDownRight_${pid}_${i}`), false);
        safeSetUIWidgetVisible(conquestPhase3ResolveCachedIndexedWidget(slotPercentShadowsDownLeft, i, `ConquestFlagHudPercentShadowDownLeft_${pid}_${i}`), false);
        safeSetUIWidgetVisible(conquestPhase3ResolveCachedIndexedWidget(slotPercentShadowsInner, i, `ConquestFlagHudPercentShadowInner_${pid}_${i}`), false);
        safeSetUIWidgetVisible(conquestPhase3ResolveCachedIndexedWidget(slotPercentTexts, i, `ConquestFlagHudPercentText_${pid}_${i}`), false);
    }
}

// Force-hides the per-player engage panel widgets by cached refs and id fallback.
// Used by swap/undeploy cleanup paths so stale engage rows cannot survive lifecycle transitions.
const CONQUEST_ENGAGE_WIDGET_NAME_TEMPLATE: readonly string[] = [
    "ConquestFlagHudEngageRoot_{pid}",
    "ConquestFlagHudEngageTrack_{pid}",
    "ConquestFlagHudEngageFriendlyFill_{pid}",
    "ConquestFlagHudEngageEnemyFill_{pid}",
    "ConquestFlagHudEngageFriendlyCountBg_{pid}",
    "ConquestFlagHudEngageEnemyCountBg_{pid}",
    "ConquestFlagHudEngageFriendlyCountShadow_{pid}",
    "ConquestFlagHudEngageEnemyCountShadow_{pid}",
    "ConquestFlagHudEngageFriendlyCount_{pid}",
    "ConquestFlagHudEngageEnemyCount_{pid}",
    "ConquestFlagHudEngageStatusShadowRight_{pid}",
    "ConquestFlagHudEngageStatusShadowLeft_{pid}",
    "ConquestFlagHudEngageStatusShadowUp_{pid}",
    "ConquestFlagHudEngageStatusShadowDown_{pid}",
    "ConquestFlagHudEngageStatusShadowUpLeft_{pid}",
    "ConquestFlagHudEngageStatusShadowUpRight_{pid}",
    "ConquestFlagHudEngageStatusShadowDownRight_{pid}",
    "ConquestFlagHudEngageStatusShadowDownLeft_{pid}",
    "ConquestFlagHudEngageStatus_{pid}",
];

// Deletes every duplicate widget instance that shares the same name.
// This is required because FindUIWidgetWithName can return stale roots after swap churn.
function conquestPhase3DeleteAllWidgetsByName(name: string, maxPasses: number = 128): void {
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

// Clears engage widget refs from per-player HUD cache after purge/delete.
// Keeping stale refs can resurrect old visual state on the next render pass.
function conquestPhase3ClearEngageWidgetRefsForPid(pid: number): void {
    const refs = State.hudCache.hudByPid[pid];
    if (!refs) return;
    refs.conquestFlagsEngageRoot = undefined;
    refs.conquestFlagsEngageTrack = undefined;
    refs.conquestFlagsEngageFriendlyFill = undefined;
    refs.conquestFlagsEngageEnemyFill = undefined;
    refs.conquestFlagsEngageFriendlyCountBg = undefined;
    refs.conquestFlagsEngageEnemyCountBg = undefined;
    refs.conquestFlagsEngageFriendlyCountShadow = undefined;
    refs.conquestFlagsEngageEnemyCountShadow = undefined;
    refs.conquestFlagsEngageFriendlyCount = undefined;
    refs.conquestFlagsEngageEnemyCount = undefined;
    refs.conquestFlagsEngageStatusShadowRight = undefined;
    refs.conquestFlagsEngageStatusShadowLeft = undefined;
    refs.conquestFlagsEngageStatusShadowUp = undefined;
    refs.conquestFlagsEngageStatusShadowDown = undefined;
    refs.conquestFlagsEngageStatusShadowUpLeft = undefined;
    refs.conquestFlagsEngageStatusShadowUpRight = undefined;
    refs.conquestFlagsEngageStatusShadowDownRight = undefined;
    refs.conquestFlagsEngageStatusShadowDownLeft = undefined;
    refs.conquestFlagsEngageStatus = undefined;
}

// Hard-purges engage widgets for one player id.
// Team swap uses this to guarantee stale "Neutralizing/Defending" rows cannot survive hidden in duplicates.
function conquestPhase3PurgeEngageWidgetsForPid(pid: number): void {
    for (let i = 0; i < CONQUEST_ENGAGE_WIDGET_NAME_TEMPLATE.length; i++) {
        const name = CONQUEST_ENGAGE_WIDGET_NAME_TEMPLATE[i].replace("{pid}", `${pid}`);
        conquestPhase3DeleteAllWidgetsByName(name);
    }
    conquestPhase3ClearEngageWidgetRefsForPid(pid);
}

// Force-hides engage widgets for one player without mutating ownership/latch state.
// Used by suppression and lifecycle cleanup paths to prevent stale engage overlays.
function conquestPhase3ForceHideEngageWidgetsForPid(pid: number): void {
    // Do not mutate unsuppress confirmation here.
    // This helper runs every live tick while suppressed; resetting here would prevent
    // multi-tick unsuppress confirmation from ever completing.
    // Swap/undeploy owners explicitly reset confirmation when state transitions occur.
    const refs = State.hudCache.hudByPid[pid];
    // Keep cached refs authoritative; only fallback to global lookup when refs are missing.
    const engageRoot = refs?.conquestFlagsEngageRoot ?? safeFind(`ConquestFlagHudEngageRoot_${pid}`);
    const engageTrack = refs?.conquestFlagsEngageTrack ?? safeFind(`ConquestFlagHudEngageTrack_${pid}`);
    const engageFriendlyFill = refs?.conquestFlagsEngageFriendlyFill ?? safeFind(`ConquestFlagHudEngageFriendlyFill_${pid}`);
    const engageEnemyFill = refs?.conquestFlagsEngageEnemyFill ?? safeFind(`ConquestFlagHudEngageEnemyFill_${pid}`);
    const engageFriendlyCountBg = refs?.conquestFlagsEngageFriendlyCountBg ?? safeFind(`ConquestFlagHudEngageFriendlyCountBg_${pid}`);
    const engageEnemyCountBg = refs?.conquestFlagsEngageEnemyCountBg ?? safeFind(`ConquestFlagHudEngageEnemyCountBg_${pid}`);
    const engageFriendlyCountShadow = refs?.conquestFlagsEngageFriendlyCountShadow ?? safeFind(`ConquestFlagHudEngageFriendlyCountShadow_${pid}`);
    const engageEnemyCountShadow = refs?.conquestFlagsEngageEnemyCountShadow ?? safeFind(`ConquestFlagHudEngageEnemyCountShadow_${pid}`);
    const engageFriendlyCount = refs?.conquestFlagsEngageFriendlyCount ?? safeFind(`ConquestFlagHudEngageFriendlyCount_${pid}`);
    const engageEnemyCount = refs?.conquestFlagsEngageEnemyCount ?? safeFind(`ConquestFlagHudEngageEnemyCount_${pid}`);
    const engageStatusShadowRight = refs?.conquestFlagsEngageStatusShadowRight ?? safeFind(`ConquestFlagHudEngageStatusShadowRight_${pid}`);
    const engageStatusShadowLeft = refs?.conquestFlagsEngageStatusShadowLeft ?? safeFind(`ConquestFlagHudEngageStatusShadowLeft_${pid}`);
    const engageStatusShadowUp = refs?.conquestFlagsEngageStatusShadowUp ?? safeFind(`ConquestFlagHudEngageStatusShadowUp_${pid}`);
    const engageStatusShadowDown = refs?.conquestFlagsEngageStatusShadowDown ?? safeFind(`ConquestFlagHudEngageStatusShadowDown_${pid}`);
    const engageStatusShadowUpLeft = refs?.conquestFlagsEngageStatusShadowUpLeft ?? safeFind(`ConquestFlagHudEngageStatusShadowUpLeft_${pid}`);
    const engageStatusShadowUpRight = refs?.conquestFlagsEngageStatusShadowUpRight ?? safeFind(`ConquestFlagHudEngageStatusShadowUpRight_${pid}`);
    const engageStatusShadowDownRight = refs?.conquestFlagsEngageStatusShadowDownRight ?? safeFind(`ConquestFlagHudEngageStatusShadowDownRight_${pid}`);
    const engageStatusShadowDownLeft = refs?.conquestFlagsEngageStatusShadowDownLeft ?? safeFind(`ConquestFlagHudEngageStatusShadowDownLeft_${pid}`);
    const engageStatus = refs?.conquestFlagsEngageStatus ?? safeFind(`ConquestFlagHudEngageStatus_${pid}`);
    safeSetUIWidgetVisible(engageRoot, false);
    safeSetUIWidgetVisible(engageTrack, false);
    safeSetUIWidgetVisible(engageFriendlyFill, false);
    safeSetUIWidgetVisible(engageEnemyFill, false);
    safeSetUIWidgetVisible(engageFriendlyCountBg, false);
    safeSetUIWidgetVisible(engageEnemyCountBg, false);
    safeSetUIWidgetVisible(engageFriendlyCountShadow, false);
    safeSetUIWidgetVisible(engageEnemyCountShadow, false);
    safeSetUIWidgetVisible(engageFriendlyCount, false);
    safeSetUIWidgetVisible(engageEnemyCount, false);
    safeSetUIWidgetVisible(engageStatusShadowRight, false);
    safeSetUIWidgetVisible(engageStatusShadowLeft, false);
    safeSetUIWidgetVisible(engageStatusShadowUp, false);
    safeSetUIWidgetVisible(engageStatusShadowDown, false);
    safeSetUIWidgetVisible(engageStatusShadowUpLeft, false);
    safeSetUIWidgetVisible(engageStatusShadowUpRight, false);
    safeSetUIWidgetVisible(engageStatusShadowDownRight, false);
    safeSetUIWidgetVisible(engageStatusShadowDownLeft, false);
    safeSetUIWidgetVisible(engageStatus, false);
    if (refs) {
        refs.conquestFlagsEngageRoot = engageRoot;
        refs.conquestFlagsEngageTrack = engageTrack;
        refs.conquestFlagsEngageFriendlyFill = engageFriendlyFill;
        refs.conquestFlagsEngageEnemyFill = engageEnemyFill;
        refs.conquestFlagsEngageFriendlyCountBg = engageFriendlyCountBg;
        refs.conquestFlagsEngageEnemyCountBg = engageEnemyCountBg;
        refs.conquestFlagsEngageFriendlyCountShadow = engageFriendlyCountShadow;
        refs.conquestFlagsEngageEnemyCountShadow = engageEnemyCountShadow;
        refs.conquestFlagsEngageFriendlyCount = engageFriendlyCount;
        refs.conquestFlagsEngageEnemyCount = engageEnemyCount;
        refs.conquestFlagsEngageStatusShadowRight = engageStatusShadowRight;
        refs.conquestFlagsEngageStatusShadowLeft = engageStatusShadowLeft;
        refs.conquestFlagsEngageStatusShadowUp = engageStatusShadowUp;
        refs.conquestFlagsEngageStatusShadowDown = engageStatusShadowDown;
        refs.conquestFlagsEngageStatusShadowUpLeft = engageStatusShadowUpLeft;
        refs.conquestFlagsEngageStatusShadowUpRight = engageStatusShadowUpRight;
        refs.conquestFlagsEngageStatusShadowDownRight = engageStatusShadowDownRight;
        refs.conquestFlagsEngageStatusShadowDownLeft = engageStatusShadowDownLeft;
        refs.conquestFlagsEngageStatus = engageStatus;
    }
}

// Enforces engage suppression every live tick outside the dirty/render gate.
// This prevents stale engage/pop-out widgets from persisting when no normal HUD render occurs.
function conquestPhase3EnforceSuppressedEngageWidgets(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const viewer = mod.ValueInArray(players, i) as mod.Player;
        if (!viewer || !mod.IsPlayerValid(viewer)) continue;
        const pid = safeGetPlayerId(viewer);
        if (pid === undefined) continue;
        const engagedObjId = State.conquest.capture.engagedObjIdByPid[pid];
        if (!conquestPhase3ShouldRenderEngageForPid(pid, engagedObjId)) {
            const hadRenderableOverlay =
                State.conquest.debug.hudProjectionPopoutVisibleByPid[pid] === true
                || State.conquest.debug.hudProjectionEngageVisibleByPid[pid] === true
                || State.conquest.debug.hudProjectionActiveTopSlotNeutralizedByPid[pid] === true;
            conquestPhase3ForceHideActivePopoutWidgetsForPid(pid);
            conquestPhase3ForceHideEngageWidgetsForPid(pid);
            if (hadRenderableOverlay) {
                conquestPhase3MarkHudDirty();
            }
        }
    }
}

// Single-owner engage visibility gate for Conquest capture HUD.
// Engage can render only when the player is deployed, not in swap-reset pending,
// and has a capture-point-derived active objective id for this tick.
function conquestPhase3ShouldRenderEngageForPid(pid: number, activeObjId: number | undefined): boolean {
    if (!State.players.deployedByPid[pid]) return false;
    if (State.conquest.debug.teamSwapHudResetPendingByPid[pid] === true) return false;
    if (activeObjId === undefined) return false;
    return true;
}

// Returns the engaged objective only when engage/popout/top-slot active state should render.
function conquestPhase3GetRenderableActiveObjIdForPid(pid: number): number | undefined {
    const engagedObjId = State.conquest.capture.engagedObjIdByPid[pid];
    if (!conquestPhase3ShouldRenderEngageForPid(pid, engagedObjId)) {
        return undefined;
    }
    return engagedObjId;
}

// Resolves viewer perspective teams for friendly-left/enemy-right HUD rendering.
// If unresolved, render should skip team-colored conquest widgets for this frame.
function conquestPhase3GetPerspectiveTeams(
    viewer: mod.Player
): { friendlyTeam: TeamID; enemyTeam: TeamID; resolved: boolean } {
    const pid = safeGetPlayerId(viewer);
    const resolvedTeam = safeGetTeamNumberFromPlayer(viewer, 0);
    const stickyTeam = pid !== undefined
        ? State.conquest.debug.perspectiveTeamByPid[pid]
        : undefined;
    const swapPerspectiveLockUntil = pid !== undefined
        ? (State.conquest.debug.teamSwapPerspectiveLockUntilByPid[pid] ?? -1)
        : -1;
    const swapPerspectiveLockActive = (
        pid !== undefined
        && swapPerspectiveLockUntil >= mod.GetMatchTimeElapsed()
        && (stickyTeam === TeamID.Team1 || stickyTeam === TeamID.Team2)
    );

    // During swap lock, keep script-authoritative sticky perspective and ignore transient engine team echoes.
    if (
        !swapPerspectiveLockActive
        && pid !== undefined
        && (resolvedTeam === TeamID.Team1 || resolvedTeam === TeamID.Team2)
    ) {
        State.conquest.debug.perspectiveTeamByPid[pid] = resolvedTeam;
    }

    const teamNum: TeamID | 0 = swapPerspectiveLockActive
        ? stickyTeam
        : (resolvedTeam === TeamID.Team1 || resolvedTeam === TeamID.Team2)
        ? resolvedTeam
        : (stickyTeam === TeamID.Team1 || stickyTeam === TeamID.Team2)
            ? stickyTeam
            : 0;

    if (teamNum === 0) {
        return {
            friendlyTeam: TeamID.Team1,
            enemyTeam: TeamID.Team2,
            resolved: false,
        };
    }

    if (teamNum === TeamID.Team2) {
        return { friendlyTeam: TeamID.Team2, enemyTeam: TeamID.Team1, resolved: true };
    }
    return { friendlyTeam: TeamID.Team1, enemyTeam: TeamID.Team2, resolved: true };
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
    const friendlyWidth = friendlyTickets <= 0
        ? 0
        : Math.max(1, Math.floor(CONQUEST_HUD_TICKET_BAR_WIDTH * friendlyRatio));
    const enemyWidth = enemyTickets <= 0
        ? 0
        : Math.max(1, Math.floor(CONQUEST_HUD_TICKET_BAR_WIDTH * enemyRatio));

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
// - up to CONQUEST_HUD_TICKET_BLEED_CHEVRON_COUNT chevrons are shown on the losing/bleeding side
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

// Applies bleed-chevron stack visibility using explicit left/right counts.
function conquestPhase3ApplyTicketBleedIndicatorCounts(
    refs: HudRefs,
    leftCount: number,
    rightCount: number
): void {
    const restackChevronGroup = (group: ConquestShadowTextWidgetSet): void => {
        const shadowWidgets: (mod.UIWidget | undefined)[] = [
            group.right,
            group.left,
            group.up,
            group.down,
            group.upLeft,
            group.upRight,
            group.downRight,
            group.downLeft,
            group.inner,
            group.innerDeep,
        ];
        for (let i = 0; i < shadowWidgets.length; i++) {
            const shadow = shadowWidgets[i];
            if (!shadow) continue;
            safeSetUIWidgetDepth(shadow, mod.UIDepth.AboveGameUI);
        }
        if (group.text) {
            safeSetUIWidgetDepth(group.text, mod.UIDepth.AboveGameUI);
        }
    };
    const pid = refs.pid;
    const clampedLeft = Math.max(0, Math.min(CONQUEST_HUD_TICKET_BLEED_CHEVRON_COUNT, Math.floor(leftCount)));
    const clampedRight = Math.max(0, Math.min(CONQUEST_HUD_TICKET_BLEED_CHEVRON_COUNT, Math.floor(rightCount)));
    // Static-only chevrons:
    // - no pulse sequencing
    // - visibility is strictly driven by current bleed differential count.
    // Also clear any queued pulse state from previous builds so it cannot affect visibility.
    conquestPhase3ResetBleedPulseForPid(pid);
    const friendlyChevronColor = mod.CreateVector(
        CONQUEST_HUD_TICKET_BLEED_CHEVRON_FRIENDLY_RGB[0],
        CONQUEST_HUD_TICKET_BLEED_CHEVRON_FRIENDLY_RGB[1],
        CONQUEST_HUD_TICKET_BLEED_CHEVRON_FRIENDLY_RGB[2]
    );
    const enemyChevronColor = mod.CreateVector(
        CONQUEST_HUD_TICKET_BLEED_CHEVRON_ENEMY_RGB[0],
        CONQUEST_HUD_TICKET_BLEED_CHEVRON_ENEMY_RGB[1],
        CONQUEST_HUD_TICKET_BLEED_CHEVRON_ENEMY_RGB[2]
    );
    for (let chevronIndex = 0; chevronIndex < CONQUEST_HUD_TICKET_BLEED_CHEVRON_COUNT; chevronIndex++) {
        const leftVisible = chevronIndex < clampedLeft;
        const rightVisible = chevronIndex < clampedRight;
        const leftGroup = conquestPhase3GetBleedChevronShadowGroup(
            refs,
            pid,
            CONQUEST_BLEED_PULSE_SIDE_LEFT,
            chevronIndex
        );
        // Reassert shadow/core ordering on every writer pass so chevrons cannot fall behind ticket bars.
        restackChevronGroup(leftGroup);
        conquestPhase3SetShadowTextGroupLabel(leftGroup, mod.Message(STR_HUD_CONQUEST_BLEED_CHEVRON_LEFT));
        conquestPhase3SetShadowTextGroupColors(leftGroup, friendlyChevronColor);
        const leftRenderable = leftVisible && !!leftGroup.text;
        conquestPhase3SetShadowTextGroupVisible(leftGroup, leftRenderable);
        if (leftVisible && !leftGroup.text) {
            // Queue one retry pass so core glyphs can bind without showing shadow-only artifacts.
            conquestPhase3MarkHudDirty();
        }

        const rightGroup = conquestPhase3GetBleedChevronShadowGroup(
            refs,
            pid,
            CONQUEST_BLEED_PULSE_SIDE_RIGHT,
            chevronIndex
        );
        // Reassert shadow/core ordering on every writer pass so chevrons cannot fall behind ticket bars.
        restackChevronGroup(rightGroup);
        conquestPhase3SetShadowTextGroupLabel(rightGroup, mod.Message(STR_HUD_CONQUEST_BLEED_CHEVRON_RIGHT));
        conquestPhase3SetShadowTextGroupColors(rightGroup, enemyChevronColor);
        const rightRenderable = rightVisible && !!rightGroup.text;
        conquestPhase3SetShadowTextGroupVisible(rightGroup, rightRenderable);
        if (rightVisible && !rightGroup.text) {
            // Queue one retry pass so core glyphs can bind without showing shadow-only artifacts.
            conquestPhase3MarkHudDirty();
        }
    }
}

// Returns the maximum number of conquest flag slots from cached refs for this player.
function conquestPhase3GetFlagMaxSlotsFromRefs(refs: HudRefs): number {
    const slotRoots = refs.conquestFlagsDebugSlotRoots ?? [];
    const slotBorders = refs.conquestFlagsDebugBorderRows ?? [];
    const slotFills = refs.conquestFlagsDebugFillRows ?? [];
    const slotLabels = refs.conquestFlagsDebugLabelRows ?? [];
    const slotPercents = refs.conquestFlagsDebugPercentRoots ?? [];
    return Math.max(
        slotRoots.length,
        slotBorders.length,
        slotFills.length,
        slotLabels.length,
        slotPercents.length,
        1
    );
}

// Derives help/ready strip visibility from script-authoritative player + match state.
function deriveConquestHudHelpReadyViewModel(pid: number): ConquestHudHelpReadyViewModel {
    const isDialogOpen = !!State.players.readyDialogData[pid]?.dialogVisible;
    const isReady = !!State.players.readyByPid[pid];
    const isDeployed = !!State.players.deployedByPid[pid];
    const canShow = (!State.match.isEnded)
        && (!State.match.victoryDialogActive)
        && (!State.round.flow.cleanupActive)
        && isDeployed;
    const showHelp = canShow && (!isMatchLive()) && (!isReady) && (!isDialogOpen);
    // Keep ready acknowledgment visible in top-left status lane even while the dialog is open.
    const showReady = canShow && (!isMatchLive()) && isReady;
    return {
        showHelp,
        showReady,
    };
}

// Derives clock state for HUD planning; rendering remains owned by clock/status modules.
function deriveConquestHudClockViewModel(): ConquestHudClockViewModel {
    const durationSeconds = Math.max(0, State.round.clock.durationSeconds);
    const now = mod.GetMatchTimeElapsed();
    const startElapsed = State.round.clock.matchStartElapsedSeconds;
    const elapsedFromStart = startElapsed === undefined ? 0 : Math.max(0, now - startElapsed);
    const pausedRemaining = State.round.clock.pausedRemainingSeconds;
    const remaining = State.round.clock.isPaused && pausedRemaining !== undefined
        ? Math.max(0, pausedRemaining)
        : Math.max(0, durationSeconds - elapsedFromStart);
    return {
        durationSeconds,
        elapsedSeconds: elapsedFromStart,
        remainingSeconds: remaining,
        isPaused: State.round.clock.isPaused,
        isLowTime: remaining < LOW_TIME_THRESHOLD_SECONDS,
    };
}

// Derives round-state line visibility from current match state and help/ready visibility.
function deriveConquestHudStatusViewModel(
    helpReady: ConquestHudHelpReadyViewModel
): ConquestHudStatusViewModel {
    const isLive = isMatchLive();
    const isGameOver = State.round.phase === MatchPhase.GameOver;
    const showRoundStateLine = !helpReady.showHelp && !helpReady.showReady;
    const showPlayersReadyLine = (!State.match.victoryDialogActive)
        && (!isLive)
        && (!helpReady.showHelp)
        && (!helpReady.showReady);
    return {
        isLive,
        isGameOver,
        showRoundStateLine,
        showPlayersReadyLine,
    };
}

// Derives engage-panel labels and fill widths for this viewer.
function deriveConquestHudEngageViewModel(
    pid: number,
    friendlyTeam: TeamID,
    enemyTeam: TeamID
): ConquestHudEngageViewModel {
    const engageDisplay = conquestPhase3GetFlagEngageDisplayForViewer(pid, friendlyTeam, enemyTeam);
    if (!engageDisplay.visible) {
        return {
            visible: false,
            friendlyWidth: 0,
            enemyWidth: 0,
        };
    }

    const fullTrackWidth = Math.max(1, Math.floor(CONQUEST_HUD_FLAG_ENGAGE_TRACK_WIDTH));
    let friendlyWidth = engageDisplay.friendlyCount <= 0
        ? 0
        : Math.max(1, Math.floor(fullTrackWidth * engageDisplay.friendlyRatio));
    if (friendlyWidth > fullTrackWidth) friendlyWidth = fullTrackWidth;
    let enemyWidth = fullTrackWidth - friendlyWidth;
    if (engageDisplay.enemyCount > 0 && enemyWidth <= 0) {
        enemyWidth = 1;
        friendlyWidth = Math.max(0, fullTrackWidth - enemyWidth);
    }

    return {
        visible: true,
        friendlyCountLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, engageDisplay.friendlyCount),
        enemyCountLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, engageDisplay.enemyCount),
        statusLabel: mod.Message(engageDisplay.statusKey),
        friendlyWidth,
        enemyWidth,
    };
}

// Converts a fill ratio into pixel height while preserving neutral-idle cleanup rules.
function conquestPhase3ComputeFlagFillHeight(
    maxFillHeight: number,
    visualFillRatio: number,
    ownerTeam: TeamID | 0,
    progress01: number,
    onPointCount: number,
    forceNeutralIdleEmpty: boolean
): number {
    const rawFillHeight = visualFillRatio <= 0
        ? 0
        : Math.floor(maxFillHeight * visualFillRatio);
    const minNeutralHideRatio = 2 / Math.max(1, maxFillHeight);
    const unattendedNeutral = ownerTeam === 0 && onPointCount <= 0;
    const nearZeroNeutralResidual = unattendedNeutral && (
        visualFillRatio <= minNeutralHideRatio
        || progress01 <= minNeutralHideRatio
        || rawFillHeight <= 2
    );
    if (forceNeutralIdleEmpty || nearZeroNeutralResidual) return 0;
    if (rawFillHeight <= 0) {
        return onPointCount > 0 && visualFillRatio > 0 ? 1 : 0;
    }
    return rawFillHeight;
}

// Enemy-colored fills animate from the top edge; friendly fills keep bottom-up behavior.
function conquestPhase3ShouldFillFromTopForEnemy(
    visualState: ConquestFlagVisualRuntimeState,
    enemyTeam: TeamID
): boolean {
    if (visualState.phase === "OWNED_STABLE") {
        return visualState.ownerTeam === enemyTeam;
    }
    if (
        visualState.phase === "OWNED_CONTESTED_DRAIN"
        || visualState.phase === "OWNED_CONTESTED_RECOVER"
    ) {
        return visualState.ownerTeam === enemyTeam;
    }
    if (visualState.phase === "NEUTRAL_CAPTURING") {
        return visualState.activeTeam === enemyTeam;
    }
    return false;
}

// Border/percent ownership contract:
// - fully owned => show border, hide percent
// - not fully owned => no border, percent may show
// Ownership authority is game-state based (ownerTeam + ownerProgressTeam), not visual-state phase.
function conquestPhase3IsFlagFullyOwnedForHud(
    ownerTeam: TeamID | 0,
    ownerProgressTeam: TeamID | 0,
    progress01: number,
    hasBorderColor: boolean
): boolean {
    const ownerProgressSettled = ownerProgressTeam === 0 || ownerProgressTeam === ownerTeam;
    return hasBorderColor
        && ownerTeam !== 0
        && ownerProgressSettled
        && progress01 >= CONQUEST_FLAG_PROGRESS_DEADBAND_HIGH;
}

// Derives per-slot flag visuals/labels/percent widgets from script-authoritative state.
function deriveConquestHudFlagsViewModel(
    pid: number,
    mappedCaptureStates: ConquestCapturePointRuntimeState[],
    friendlyTeam: TeamID,
    enemyTeam: TeamID,
    maxSlots: number
): ConquestHudFlagsViewModel {
    const clampedSlots = Math.max(1, maxSlots);
    const engagedObjId = conquestPhase3GetRenderableActiveObjIdForPid(pid);
    const slots: ConquestHudFlagSlotViewModel[] = [];
    for (let i = 0; i < clampedSlots; i++) {
        slots.push({
            visible: false,
            borderVisible: false,
            fillVisible: false,
            fillY: CONQUEST_HUD_FLAG_FILL_INSET_Y + CONQUEST_HUD_FLAG_FILL_MAX_HEIGHT,
            fillHeight: 0,
            labelVisible: false,
            percentVisible: false,
        });
    }

    const visibleSlots = conquestPhase3GetCenteredFlagSlots(mappedCaptureStates.length, clampedSlots);
    const sampleTick = Math.floor(mod.GetMatchTimeElapsed() * 10);
    for (let row = 0; row < mappedCaptureStates.length && row < visibleSlots.length; row++) {
        const slotIndex = visibleSlots[row];
        const cp = mappedCaptureStates[row];
        const labelKey = conquestPhase3GetFlagLetterStringKey(cp, row);
        const visualState = State.conquest.capture.visualByObjId[cp.objId]
            ?? conquestPhase3CreateDefaultFlagVisualState(sampleTick);
        const visual = conquestPhase3GetFlagSlotVisual(visualState, friendlyTeam, enemyTeam);
        const percentVisual = conquestPhase3GetFlagPercentDisplay(visualState, friendlyTeam, enemyTeam);
        const borderColor = cp.ownerTeam === friendlyTeam
            ? mod.CreateVector(
                CONQUEST_HUD_TEXT_FRIENDLY_RGB[0],
                CONQUEST_HUD_TEXT_FRIENDLY_RGB[1],
                CONQUEST_HUD_TEXT_FRIENDLY_RGB[2]
            )
            : cp.ownerTeam === enemyTeam
                ? mod.CreateVector(
                    CONQUEST_HUD_TEXT_ENEMY_RGB[0],
                    CONQUEST_HUD_TEXT_ENEMY_RGB[1],
                CONQUEST_HUD_TEXT_ENEMY_RGB[2]
            )
                : undefined;
        const fullyOwned = conquestPhase3IsFlagFullyOwnedForHud(
            cp.ownerTeam,
            cp.ownerProgressTeam,
            cp.progress01,
            !!borderColor
        );
        const borderVisible = fullyOwned;
        const onPointCount = cp.onPointTeam1 + cp.onPointTeam2;
        const forceNeutralIdleEmpty = visualState.phase === "NEUTRAL_IDLE";
        const fillHeight = conquestPhase3ComputeFlagFillHeight(
            CONQUEST_HUD_FLAG_FILL_MAX_HEIGHT,
            visual.fillRatio,
            cp.ownerTeam,
            cp.progress01,
            onPointCount,
            forceNeutralIdleEmpty
        );
        const fillFromTop = conquestPhase3ShouldFillFromTopForEnemy(visualState, enemyTeam);

        const slotVm: ConquestHudFlagSlotViewModel = {
            visible: true,
            objId: cp.objId,
            slotBgColor: visual.slotBgColor,
            borderVisible,
            borderColor,
            fillVisible: fillHeight > 0 && !!visual.fillColor,
            fillColor: visual.fillColor,
            fillY: fillFromTop
                ? CONQUEST_HUD_FLAG_FILL_INSET_Y
                : CONQUEST_HUD_FLAG_FILL_INSET_Y + (CONQUEST_HUD_FLAG_FILL_MAX_HEIGHT - fillHeight),
            fillHeight,
            labelVisible: true,
            labelMessage: mod.Message(labelKey),
            labelColor: visual.labelColor,
            percentVisible: percentVisual.visible && !fullyOwned,
            percentColor: percentVisual.color,
        };
        if (percentVisual.visible && percentVisual.color) {
            const roundedPercent = Math.max(0, Math.min(100, Math.round(percentVisual.value01 * 100)));
            const percentValue = fullyOwned ? 100 : Math.min(99, roundedPercent);
            slotVm.percentMessage = mod.Message(STR_SYSTEM_GENERIC_PERCENT, percentValue);
        }
        if (engagedObjId && cp.objId === engagedObjId) {
            slotVm.slotBgColor = visualState.ownerTeam === friendlyTeam
                ? mod.CreateVector(
                    CONQUEST_HUD_FLAG_SLOT_FRIENDLY_FILL_RGB[0],
                    CONQUEST_HUD_FLAG_SLOT_FRIENDLY_FILL_RGB[1],
                    CONQUEST_HUD_FLAG_SLOT_FRIENDLY_FILL_RGB[2]
                )
                : visualState.ownerTeam === enemyTeam
                    ? mod.CreateVector(
                        CONQUEST_HUD_FLAG_SLOT_ENEMY_FILL_RGB[0],
                        CONQUEST_HUD_FLAG_SLOT_ENEMY_FILL_RGB[1],
                        CONQUEST_HUD_FLAG_SLOT_ENEMY_FILL_RGB[2]
                    )
                    : mod.CreateVector(
                        CONQUEST_HUD_FLAG_SLOT_TRACK_RGB[0],
                        CONQUEST_HUD_FLAG_SLOT_TRACK_RGB[1],
                        CONQUEST_HUD_FLAG_SLOT_TRACK_RGB[2]
                    );
            slotVm.borderVisible = false;
            slotVm.fillVisible = false;
            slotVm.fillHeight = 0;
            slotVm.labelVisible = false;
            slotVm.percentVisible = false;
            slotVm.labelColor = CONQUEST_PHASE3_ACTIVE_SLOT_MUTED_LABEL;
        }
        slots[slotIndex] = slotVm;
    }

    return { slots };
}

// Derives active-objective pop-out from the same per-objective visuals used by slot rendering.
function deriveConquestHudActiveFlagPopoutViewModel(
    pid: number,
    mappedCaptureStates: ConquestCapturePointRuntimeState[],
    friendlyTeam: TeamID,
    enemyTeam: TeamID
): ConquestHudActiveFlagPopoutViewModel {
    const engagedObjId = conquestPhase3GetRenderableActiveObjIdForPid(pid);
    const hidden: ConquestHudActiveFlagPopoutViewModel = {
        visible: false,
        objId: engagedObjId,
        borderVisible: false,
        fillVisible: false,
        fillY: CONQUEST_HUD_FLAG_ACTIVE_POPOUT_FILL_INSET_Y + CONQUEST_HUD_FLAG_ACTIVE_POPOUT_FILL_MAX_HEIGHT,
        fillHeight: 0,
        labelVisible: false,
        percentVisible: false,
    };
    if (!engagedObjId) return hidden;

    let activeCapturePoint: ConquestCapturePointRuntimeState | undefined;
    let activeRow = 0;
    for (let i = 0; i < mappedCaptureStates.length; i++) {
        const cp = mappedCaptureStates[i];
        if (cp.objId === engagedObjId) {
            activeCapturePoint = cp;
            activeRow = i;
            break;
        }
    }
    if (!activeCapturePoint) return hidden;

    const labelKey = conquestPhase3GetFlagLetterStringKey(activeCapturePoint, activeRow);
    const sampleTick = Math.floor(mod.GetMatchTimeElapsed() * 10);
    const visualState = State.conquest.capture.visualByObjId[activeCapturePoint.objId]
        ?? conquestPhase3CreateDefaultFlagVisualState(sampleTick);
    const visual = conquestPhase3GetFlagSlotVisual(visualState, friendlyTeam, enemyTeam);
    const percentVisual = conquestPhase3GetFlagPercentDisplay(visualState, friendlyTeam, enemyTeam);
    const borderColor = activeCapturePoint.ownerTeam === friendlyTeam
        ? mod.CreateVector(
            CONQUEST_HUD_TEXT_FRIENDLY_RGB[0],
            CONQUEST_HUD_TEXT_FRIENDLY_RGB[1],
            CONQUEST_HUD_TEXT_FRIENDLY_RGB[2]
        )
        : activeCapturePoint.ownerTeam === enemyTeam
            ? mod.CreateVector(
                CONQUEST_HUD_TEXT_ENEMY_RGB[0],
                CONQUEST_HUD_TEXT_ENEMY_RGB[1],
            CONQUEST_HUD_TEXT_ENEMY_RGB[2]
        )
            : undefined;
    const fullyOwned = conquestPhase3IsFlagFullyOwnedForHud(
        activeCapturePoint.ownerTeam,
        activeCapturePoint.ownerProgressTeam,
        activeCapturePoint.progress01,
        !!borderColor
    );
    const borderVisible = fullyOwned;
    const onPointCount = activeCapturePoint.onPointTeam1 + activeCapturePoint.onPointTeam2;
    const forceNeutralIdleEmpty = visualState.phase === "NEUTRAL_IDLE";
    const fillHeight = conquestPhase3ComputeFlagFillHeight(
        CONQUEST_HUD_FLAG_ACTIVE_POPOUT_FILL_MAX_HEIGHT,
        visual.fillRatio,
        activeCapturePoint.ownerTeam,
        activeCapturePoint.progress01,
        onPointCount,
        forceNeutralIdleEmpty
    );
    const fillFromTop = conquestPhase3ShouldFillFromTopForEnemy(visualState, enemyTeam);

    const popoutVm: ConquestHudActiveFlagPopoutViewModel = {
        visible: true,
        objId: engagedObjId,
        slotBgColor: visual.slotBgColor,
        borderVisible,
        borderColor,
        fillVisible: fillHeight > 0 && !!visual.fillColor,
        fillColor: visual.fillColor,
        fillY: fillFromTop
            ? CONQUEST_HUD_FLAG_ACTIVE_POPOUT_FILL_INSET_Y
            : CONQUEST_HUD_FLAG_ACTIVE_POPOUT_FILL_INSET_Y + (CONQUEST_HUD_FLAG_ACTIVE_POPOUT_FILL_MAX_HEIGHT - fillHeight),
        fillHeight,
        labelVisible: true,
        labelMessage: mod.Message(labelKey),
        labelColor: visual.labelColor,
        percentVisible: percentVisual.visible && !fullyOwned,
        percentColor: percentVisual.color,
    };
    if (percentVisual.visible && percentVisual.color) {
        const roundedPercent = Math.max(0, Math.min(100, Math.round(percentVisual.value01 * 100)));
        const percentValue = fullyOwned ? 100 : Math.min(99, roundedPercent);
        popoutVm.percentMessage = mod.Message(STR_SYSTEM_GENERIC_PERCENT, percentValue);
    }
    return popoutVm;
}

// Derives a script-authoritative conquest HUD view model for one player.
function deriveHudViewModelForPlayer(
    pid: number,
    perspective: { friendlyTeam: TeamID; enemyTeam: TeamID },
    mappedCaptureStates: ConquestCapturePointRuntimeState[],
    maxFlagSlots: number
): ConquestHudViewModel {
    const friendlyTickets = perspective.friendlyTeam === TeamID.Team1
        ? State.conquest.tickets.team1
        : State.conquest.tickets.team2;
    const enemyTickets = perspective.enemyTeam === TeamID.Team1
        ? State.conquest.tickets.team1
        : State.conquest.tickets.team2;
    const bleedCounts = conquestPhase3GetBleedChevronCountsForPerspective(
        perspective.friendlyTeam,
        perspective.enemyTeam
    );
    const helpReady = deriveConquestHudHelpReadyViewModel(pid);
    const status = deriveConquestHudStatusViewModel(helpReady);
    const clock = deriveConquestHudClockViewModel();
    const flags = deriveConquestHudFlagsViewModel(
        pid,
        mappedCaptureStates,
        perspective.friendlyTeam,
        perspective.enemyTeam,
        maxFlagSlots
    );
    const activeFlagPopout = deriveConquestHudActiveFlagPopoutViewModel(
        pid,
        mappedCaptureStates,
        perspective.friendlyTeam,
        perspective.enemyTeam
    );
    const engage = deriveConquestHudEngageViewModel(
        pid,
        perspective.friendlyTeam,
        perspective.enemyTeam
    );

    return {
        pid,
        perspective: {
            friendlyTeam: perspective.friendlyTeam,
            enemyTeam: perspective.enemyTeam,
        },
        tickets: {
            friendlyTeam: perspective.friendlyTeam,
            enemyTeam: perspective.enemyTeam,
            friendlyTickets,
            enemyTickets,
            friendlyTicketLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, friendlyTickets),
            enemyTicketLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, enemyTickets),
            leaderTeam: conquestPhase3GetTicketLeaderTeam(),
            bleedLeftCount: bleedCounts.leftCount,
            bleedRightCount: bleedCounts.rightCount,
        },
        flags,
        activeFlagPopout,
        engage,
        status,
        helpReady,
        clock,
    };
}

// Renders top-level conquest roots only.
function renderConquestRootsForPid(refs: HudRefs): void {
    safeSetUIWidgetVisible(refs.conquestTicketsDebugRoot, true);
    safeSetUIWidgetVisible(refs.conquestFlagsDebugRoot, true);
}

// Renders ticket number containers/text only.
function renderConquestTicketCountersForPid(refs: HudRefs, tickets: ConquestHudTicketViewModel): void {
    const pid = refs.pid;
    const hasTicketCounterCoreRefs = (r: HudRefs | undefined): boolean => {
        if (!r) return false;
        return !!(
            r.conquestTicketsDebugRoot
            && r.conquestTicketsTeam1Container
            && r.conquestTicketsTeam2Container
            && r.conquestTicketsDebugTeam1
            && r.conquestTicketsDebugTeam2
        );
    };
    let targetRefs = refs;
    if (!hasTicketCounterCoreRefs(targetRefs)) {
        const viewer = safeFindPlayer(pid);
        if (viewer && mod.IsPlayerValid(viewer)) {
            ensureHudForPlayer(viewer);
        }
        targetRefs = State.hudCache.hudByPid[pid] ?? targetRefs;
    }
    if (!hasTicketCounterCoreRefs(targetRefs)) {
        conquestPhase3MarkHudDirty();
        return;
    }

    const team1Container = targetRefs.conquestTicketsTeam1Container;
    const team2Container = targetRefs.conquestTicketsTeam2Container;
    const coreTeam1 = targetRefs.conquestTicketsDebugTeam1;
    const coreTeam2 = targetRefs.conquestTicketsDebugTeam2;

    // Ticket counters are intentionally shadowless; hide all legacy + ring shadow layers.
    safeSetUIWidgetVisible(targetRefs.conquestTicketsDebugTeam1Shadow, false);
    safeSetUIWidgetVisible(targetRefs.conquestTicketsDebugTeam2Shadow, false);
    const counterShadowSuffixes = [
        "ShadowRight",
        "ShadowLeft",
        "ShadowUp",
        "ShadowDown",
        "ShadowUpLeft",
        "ShadowUpRight",
        "ShadowDownRight",
        "ShadowDownLeft",
    ];
    for (let i = 0; i < counterShadowSuffixes.length; i++) {
        const suffix = counterShadowSuffixes[i];
        safeSetUIWidgetVisible(safeFind(`ConquestTicketsHudTeam1${suffix}_${pid}`), false);
        safeSetUIWidgetVisible(safeFind(`ConquestTicketsHudTeam2${suffix}_${pid}`), false);
    }

    // Keep legacy base counters hidden when the overlay counters are active.
    const legacyCoreTeam1 = safeFind(`ConquestTicketsHudTeam1_${pid}`);
    const legacyCoreTeam2 = safeFind(`ConquestTicketsHudTeam2_${pid}`);
    if (coreTeam1 && coreTeam1 !== legacyCoreTeam1) {
        safeSetUIWidgetVisible(legacyCoreTeam1, false);
    }
    if (coreTeam2 && coreTeam2 !== legacyCoreTeam2) {
        safeSetUIWidgetVisible(legacyCoreTeam2, false);
    }

    safeSetUIWidgetVisible(team1Container, true);
    safeSetUIWidgetVisible(team2Container, true);

    safeSetUIWidgetVisible(coreTeam1, true);
    safeSetUIWidgetVisible(coreTeam2, true);
    safeSetUITextLabel(coreTeam1, tickets.friendlyTicketLabel);
    safeSetUITextLabel(coreTeam2, tickets.enemyTicketLabel);
    safeSetUITextColor(coreTeam1, COLOR_BLUE);
    safeSetUITextColor(coreTeam2, COLOR_RED);
    safeSetUITextAlpha(coreTeam1, 1);
    safeSetUITextAlpha(coreTeam2, 1);
    safeSetUIWidgetDepth(coreTeam1, mod.UIDepth.AboveGameUI);
    safeSetUIWidgetDepth(coreTeam2, mod.UIDepth.AboveGameUI);
}

// Renders ticket bar tracks/fills only.
function renderConquestTicketBarsForPid(refs: HudRefs, tickets: ConquestHudTicketViewModel): void {
    conquestPhase3ApplyTicketBarFill(refs, tickets.friendlyTickets, tickets.enemyTickets);
}

// Renders ticket lead crown/border only.
function renderConquestTicketLeaderForPid(refs: HudRefs, tickets: ConquestHudTicketViewModel): void {
    conquestPhase3ApplyTicketLeadIndicators(
        refs,
        tickets.friendlyTeam,
        tickets.enemyTeam,
        tickets.leaderTeam
    );
}

// Backfills bleed-chevron core glyph refs from widget names and reports readiness.
// This protects first-load renders where ParseUI widgets exist but refs are still undefined in cache.
function conquestPhase3BackfillBleedChevronCoreRefs(refs: HudRefs): boolean {
    if (!refs.conquestTicketsBleedLeftChevrons) refs.conquestTicketsBleedLeftChevrons = [];
    if (!refs.conquestTicketsBleedRightChevrons) refs.conquestTicketsBleedRightChevrons = [];
    let allFound = true;
    for (let chevronIndex = 0; chevronIndex < CONQUEST_HUD_TICKET_BLEED_CHEVRON_COUNT; chevronIndex++) {
        const slot = chevronIndex + 1;
        // Always resolve by name each pass; cached handles can be stale after rebuild/swap churn.
        const leftChevron = safeFind(`ConquestTicketsHudBleedChevronLeft${slot}_${refs.pid}`);
        const rightChevron = safeFind(`ConquestTicketsHudBleedChevronRight${slot}_${refs.pid}`);
        refs.conquestTicketsBleedLeftChevrons[chevronIndex] = leftChevron;
        refs.conquestTicketsBleedRightChevrons[chevronIndex] = rightChevron;
        if (!leftChevron || !rightChevron) {
            allFound = false;
        }
    }
    return allFound;
}

// Renders ticket bleed chevrons only.
function renderConquestTicketBleedForPid(refs: HudRefs, tickets: ConquestHudTicketViewModel): void {
    const bleedExpected = tickets.bleedLeftCount > 0 || tickets.bleedRightCount > 0;
    let targetRefs = refs;
    let chevronsReady = conquestPhase3BackfillBleedChevronCoreRefs(targetRefs);
    if (!chevronsReady && bleedExpected) {
        const viewer = safeFindPlayer(refs.pid);
        if (viewer && mod.IsPlayerValid(viewer)) {
            // First-life hardening:
            // if bleed is active but core chevrons are unresolved, force one HUD ensure pass
            // so chevrons do not wait for a later team-swap rebuild to appear.
            ensureHudForPlayer(viewer);
            targetRefs = State.hudCache.hudByPid[refs.pid] ?? targetRefs;
            chevronsReady = conquestPhase3BackfillBleedChevronCoreRefs(targetRefs);
        }
    }
    if (!chevronsReady && bleedExpected) {
        // Teardown contract: render paths must not hard-destroy/rebuild HUD trees.
        // Queue a retry and let authoritative lifecycle owners handle rebuild decisions.
        conquestPhase3MarkHudDirty();
    }
    conquestPhase3ApplyTicketBleedIndicatorCounts(
        targetRefs,
        tickets.bleedLeftCount,
        tickets.bleedRightCount
    );
}

// Refreshes bleed chevrons on non-dirty ticks so first-life indicators do not depend on unrelated HUD writes.
function conquestPhase3RefreshTicketBleedWhenHudClean(): void {
    if (!conquestPhase3ShouldRunCombatHud()) return;
    if (!isMatchLive()) return;
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const viewer = mod.ValueInArray(players, i) as mod.Player;
        if (!viewer || !mod.IsPlayerValid(viewer)) continue;
        const pid = safeGetPlayerId(viewer);
        if (pid === undefined) continue;
        if (State.conquest.debug.teamSwapHudResetPendingByPid[pid] === true) continue;
        const refs = State.hudCache.hudByPid[pid];
        if (!refs) continue;
        const perspective = conquestPhase3GetPerspectiveTeams(viewer);
        if (!perspective.resolved) continue;
        const bleedCounts = conquestPhase3GetBleedChevronCountsForPerspective(
            perspective.friendlyTeam,
            perspective.enemyTeam
        );
        const bleedExpected = bleedCounts.leftCount > 0 || bleedCounts.rightCount > 0;
        let targetRefs = refs;
        let chevronsReady = conquestPhase3BackfillBleedChevronCoreRefs(targetRefs);
        if (!chevronsReady && bleedExpected) {
            ensureHudForPlayer(viewer);
            targetRefs = State.hudCache.hudByPid[pid] ?? targetRefs;
            chevronsReady = conquestPhase3BackfillBleedChevronCoreRefs(targetRefs);
        }
        if (!chevronsReady && bleedExpected) {
            conquestPhase3MarkHudDirty();
        }
        conquestPhase3ApplyTicketBleedIndicatorCounts(
            targetRefs,
            bleedCounts.leftCount,
            bleedCounts.rightCount
        );
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
    safeSetUIWidgetVisible(refs.conquestTicketsLeadLeftCrownShadow, false);
    safeSetUIWidgetVisible(refs.conquestTicketsLeadRightCrownShadow, false);
    safeSetUIWidgetVisible(refs.conquestTicketsLeadLeftCrown, false);
    safeSetUIWidgetVisible(refs.conquestTicketsLeadRightCrown, false);

    if (showLeftLead) {
        safeSetUIWidgetBgColor(refs.conquestTicketsLeadLeftBorder, COLOR_BLUE);
        safeSetUIWidgetVisible(refs.conquestTicketsLeadLeftBorder, true);
        safeSetUIWidgetVisible(refs.conquestTicketsLeadLeftCrownShadow, true);
        safeSetUIWidgetVisible(refs.conquestTicketsLeadLeftCrown, true);
    } else if (showRightLead) {
        safeSetUIWidgetBgColor(refs.conquestTicketsLeadRightBorder, COLOR_RED);
        safeSetUIWidgetVisible(refs.conquestTicketsLeadRightBorder, true);
        safeSetUIWidgetVisible(refs.conquestTicketsLeadRightCrownShadow, true);
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
    if (row === 0) return "A";
    if (row === 1) return "B";
    if (row === 2) return "C";
    if (row === 3) return "D";
    if (row === 4) return "E";
    if (row === 5) return "F";
    if (row === 6) return "G";
    return "?";
}

// Maps capture-point labels to explicit localized string keys (A..G or unknown).
function conquestPhase3GetFlagLetterStringKey(cp: ConquestCapturePointRuntimeState, row: number): number {
    const raw = (cp.label && cp.label.length > 0 ? cp.label : conquestPhase3GetFallbackFlagToken(row)).toUpperCase();
    if (raw === "A") return STR_HUD_CONQUEST_FLAG_LETTER_A;
    if (raw === "B") return STR_HUD_CONQUEST_FLAG_LETTER_B;
    if (raw === "C") return STR_HUD_CONQUEST_FLAG_LETTER_C;
    if (raw === "D") return STR_HUD_CONQUEST_FLAG_LETTER_D;
    if (raw === "E") return STR_HUD_CONQUEST_FLAG_LETTER_E;
    if (raw === "F") return STR_HUD_CONQUEST_FLAG_LETTER_F;
    if (raw === "G") return STR_HUD_CONQUEST_FLAG_LETTER_G;
    return STR_HUD_CONQUEST_FLAG_LETTER_UNKNOWN;
}

// Creates the default script-authoritative visual state for one flag.
function conquestPhase3CreateDefaultFlagVisualState(sampleTick: number): ConquestFlagVisualRuntimeState {
    return {
        phase: "NEUTRAL_IDLE",
        ownerTeam: 0,
        activeTeam: 0,
        progress01: 0,
        ownerRemaining01: 0,
        suppressOwnerUntilRecaptured: false,
        neutralizationLatchUntilTick: -1,
        lastPhase: "NEUTRAL_IDLE",
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
    const progress01 = progressRaw <= CONQUEST_FLAG_PROGRESS_DEADBAND_LOW
        ? 0
        : (progressRaw >= CONQUEST_FLAG_PROGRESS_DEADBAND_HIGH ? 1 : progressRaw);

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
            previousVisual.activeTeam !== 0
            && (
                previousVisual.phase === "OWNED_CONTESTED_DRAIN"
                || previousVisual.phase === "OWNED_CONTESTED_RECOVER"
                || previousVisual.phase === "NEUTRAL_CAPTURING"
                || previousVisual.phase === "NEUTRALIZED_LATCH"
            )
        ) {
            activeTeam = previousVisual.activeTeam;
        } else if (
            cp.ownerTeam !== 0
            && progress01 >= CONQUEST_FLAG_PHASE_TRANSITION_HIGH
            && previousVisual.phase === "OWNED_STABLE"
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
        ownerTeam !== 0
        && previousVisual.phase === "NEUTRALIZED_LATCH"
        && progress01 < CONQUEST_FLAG_PHASE_TRANSITION_HIGH
    ) {
        // After neutralization, suppress stale engine owner reads until the next ownership is materially established.
        ownerTeam = 0;
    }
    if (
        ownerTeam !== 0
        && activeTeam !== 0
        && activeTeam !== ownerTeam
        && (
            previousVisual.phase === "NEUTRAL_IDLE"
            || previousVisual.phase === "NEUTRAL_CAPTURING"
            || previousVisual.phase === "NEUTRALIZED_LATCH"
            || (
                previousVisual.phase === "OWNED_CONTESTED_DRAIN"
                && previousVisual.ownerRemaining01 <= CONQUEST_FLAG_PHASE_TRANSITION_LOW
            )
        )
    ) {
        // Once a point has effectively neutralized, stale engine owner reads must not restore owner-border visuals.
        // Treat subsequent mixed owner/progress ticks as neutral capture flow until ownership is re-established.
        ownerTeam = 0;
    }
    // Hard owner-echo suppression:
    // once neutralization is reached, keep owner off (no border) until a full recapture confirmation is observed.
    if (
        previousVisual.suppressOwnerUntilRecaptured
        && !(
            ownerTeam !== 0
            && activeTeam === ownerTeam
            && progress01 >= CONQUEST_FLAG_PHASE_TRANSITION_HIGH
        )
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

// Resolves the next flag visual phase from normalized sample + previous phase state.
function conquestPhase3ResolveFlagVisualState(
    sample: ConquestFlagVisualSample,
    previousVisual: ConquestFlagVisualRuntimeState
): ConquestFlagVisualRuntimeState {
    let phase: ConquestFlagVisualPhase = previousVisual.phase;
    let ownerRemaining01 = previousVisual.ownerRemaining01;
    let neutralizationLatchUntilTick = previousVisual.neutralizationLatchUntilTick;
    let suppressOwnerUntilRecaptured = previousVisual.suppressOwnerUntilRecaptured;
    const neutralWrapDetected = (
        sample.ownerTeam !== 0
        && sample.activeTeam !== 0
        && sample.activeTeam !== sample.ownerTeam
        && sample.progress01 <= CONQUEST_FLAG_PHASE_TRANSITION_LOW
        && (
            previousVisual.phase === "NEUTRALIZED_LATCH"
            || (
                previousVisual.phase === "OWNED_CONTESTED_DRAIN"
                && previousVisual.ownerRemaining01 <= CONQUEST_FLAG_PHASE_TRANSITION_LOW
            )
            || (
                previousVisual.lastPhase === "OWNED_CONTESTED_DRAIN"
                && previousVisual.ownerRemaining01 <= CONQUEST_FLAG_PHASE_TRANSITION_LOW
            )
        )
    );

    if (sample.sampleTick <= neutralizationLatchUntilTick) {
        phase = "NEUTRALIZED_LATCH";
        ownerRemaining01 = 0;
        suppressOwnerUntilRecaptured = true;
    } else if (neutralWrapDetected) {
        // Some capture flows wrap progress after neutralization while owner still echoes previous team.
        // Treat this as neutral capturing and keep owner visuals suppressed until full recapture confirmation.
        phase = "NEUTRAL_CAPTURING";
        ownerRemaining01 = 0;
        suppressOwnerUntilRecaptured = true;
        neutralizationLatchUntilTick = -1;
    } else if (sample.ownerTeam !== 0 && sample.progress01 === 0) {
        // Owner-lag guard: if owner is still reported but progress is neutral, force neutralized visuals.
        phase = "NEUTRALIZED_LATCH";
        ownerRemaining01 = 0;
        neutralizationLatchUntilTick = sample.sampleTick + CONQUEST_FLAG_NEUTRALIZATION_LATCH_TICKS;
        suppressOwnerUntilRecaptured = true;
    } else if (
        sample.ownerTeam !== 0
        && sample.activeTeam === 0
        && sample.progress01 <= CONQUEST_FLAG_PHASE_TRANSITION_LOW
        && (
            previousVisual.phase === "OWNED_CONTESTED_DRAIN"
            || previousVisual.lastPhase === "OWNED_CONTESTED_DRAIN"
            || previousVisual.phase === "NEUTRALIZED_LATCH"
        )
    ) {
        // Neutralization completion fallback:
        // when owner/progress signals stall around zero after drain, keep neutral visuals with no border.
        phase = "NEUTRALIZED_LATCH";
        ownerRemaining01 = 0;
        neutralizationLatchUntilTick = sample.sampleTick + CONQUEST_FLAG_NEUTRALIZATION_LATCH_TICKS;
        suppressOwnerUntilRecaptured = true;
    } else if (
        sample.ownerTeam !== 0
        && sample.activeTeam === 0
        && sample.progress01 >= CONQUEST_FLAG_PHASE_TRANSITION_HIGH
        && (
            previousVisual.phase === "OWNED_CONTESTED_DRAIN"
            || previousVisual.lastPhase === "OWNED_CONTESTED_DRAIN"
            || previousVisual.phase === "NEUTRALIZED_LATCH"
        )
    ) {
        // Neutralization high-edge fallback:
        // prevent one-frame snap back to owner visuals when progress reports high before owner clears.
        phase = "NEUTRALIZED_LATCH";
        ownerRemaining01 = 0;
        neutralizationLatchUntilTick = sample.sampleTick + CONQUEST_FLAG_NEUTRALIZATION_LATCH_TICKS;
        suppressOwnerUntilRecaptured = true;
    } else if (sample.ownerTeam === 0 && sample.progress01 === 0) {
        phase = "NEUTRAL_IDLE";
        ownerRemaining01 = 0;
    } else if (sample.ownerTeam === 0 && sample.progress01 > 0 && sample.activeTeam !== 0) {
        phase = "NEUTRAL_CAPTURING";
        ownerRemaining01 = 0;
    } else if (
        sample.ownerTeam !== 0
        && sample.activeTeam === 0
        && sample.progress01 > CONQUEST_FLAG_PHASE_TRANSITION_LOW
        && sample.progress01 < CONQUEST_FLAG_PHASE_TRANSITION_HIGH
    ) {
        // Engine sometimes drops progress-team to 0 mid-contest.
        // Preserve prior drain/recover intent rather than snapping to neutral/owned visuals.
        if (
            previousVisual.phase === "OWNED_CONTESTED_DRAIN"
            || previousVisual.lastPhase === "OWNED_CONTESTED_DRAIN"
        ) {
            phase = "OWNED_CONTESTED_DRAIN";
            ownerRemaining01 = Math.max(0, Math.min(1, 1 - sample.progress01));
        } else {
            phase = "OWNED_CONTESTED_RECOVER";
            ownerRemaining01 = sample.progress01;
        }
    } else if (sample.ownerTeam !== 0 && sample.activeTeam !== 0 && sample.activeTeam !== sample.ownerTeam) {
        ownerRemaining01 = Math.max(0, Math.min(1, 1 - sample.progress01));
        if (ownerRemaining01 <= CONQUEST_FLAG_PHASE_TRANSITION_LOW) {
            phase = "NEUTRALIZED_LATCH";
            ownerRemaining01 = 0;
            neutralizationLatchUntilTick = sample.sampleTick + CONQUEST_FLAG_NEUTRALIZATION_LATCH_TICKS;
            suppressOwnerUntilRecaptured = true;
        } else {
            phase = "OWNED_CONTESTED_DRAIN";
        }
    } else if (
        sample.ownerTeam !== 0
        && sample.activeTeam === sample.ownerTeam
        && sample.progress01 <= CONQUEST_FLAG_PHASE_TRANSITION_LOW
        && (
            previousVisual.phase === "OWNED_CONTESTED_DRAIN"
            || previousVisual.lastPhase === "OWNED_CONTESTED_DRAIN"
            || previousVisual.phase === "NEUTRALIZED_LATCH"
        )
    ) {
        // Stale owner echo guard:
        // after a drain reaches neutral edge, engine can briefly report owner+ownerProgress with near-zero progress.
        // Keep neutralized state (no border) until ownership is truly re-established.
        phase = "NEUTRALIZED_LATCH";
        ownerRemaining01 = 0;
        neutralizationLatchUntilTick = sample.sampleTick + CONQUEST_FLAG_NEUTRALIZATION_LATCH_TICKS;
        suppressOwnerUntilRecaptured = true;
    } else if (
        sample.ownerTeam !== 0
        && sample.activeTeam === sample.ownerTeam
        && sample.progress01 < CONQUEST_FLAG_PHASE_TRANSITION_HIGH
    ) {
        phase = "OWNED_CONTESTED_RECOVER";
        ownerRemaining01 = sample.progress01;
    } else if (
        (
            previousVisual.phase === "NEUTRALIZED_LATCH"
            || (
                previousVisual.phase === "OWNED_CONTESTED_DRAIN"
                && previousVisual.ownerRemaining01 <= CONQUEST_FLAG_PHASE_TRANSITION_LOW
            )
        )
        && sample.ownerTeam !== 0
        && sample.progress01 >= CONQUEST_FLAG_PHASE_TRANSITION_HIGH
        && (sample.activeTeam === 0 || sample.activeTeam === sample.ownerTeam)
    ) {
        // Neutralization-edge guard:
        // if ownership lags by a tick after near-complete drain, keep neutralized visuals
        // instead of momentarily restoring full owner visuals.
        phase = "NEUTRALIZED_LATCH";
        ownerRemaining01 = 0;
        neutralizationLatchUntilTick = sample.sampleTick + CONQUEST_FLAG_NEUTRALIZATION_LATCH_TICKS;
        suppressOwnerUntilRecaptured = true;
    } else if (
        sample.ownerTeam !== 0
        && sample.activeTeam === sample.ownerTeam
        && sample.progress01 >= CONQUEST_FLAG_PHASE_TRANSITION_HIGH
    ) {
        phase = "OWNED_STABLE";
        ownerRemaining01 = 1;
        suppressOwnerUntilRecaptured = false;
    } else {
        phase = "NEUTRAL_IDLE";
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
        previousVisual.phase !== nextVisual.phase
        || previousVisual.ownerTeam !== nextVisual.ownerTeam
        || previousVisual.activeTeam !== nextVisual.activeTeam
        || Math.abs(previousVisual.progress01 - nextVisual.progress01) >= 0.001
        || Math.abs(previousVisual.ownerRemaining01 - nextVisual.ownerRemaining01) >= 0.001
        || previousVisual.suppressOwnerUntilRecaptured !== nextVisual.suppressOwnerUntilRecaptured
        || previousVisual.neutralizationLatchUntilTick !== nextVisual.neutralizationLatchUntilTick
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
        visualState.phase === "NEUTRALIZED_LATCH"
        || (
            visualState.activeTeam === 0
            && visualState.progress01 <= CONQUEST_FLAG_PHASE_TRANSITION_LOW
        )
    ) {
        return {
            slotBgColor: neutralBg,
            fillRatio: 0,
            labelColor: labelNeutral,
        };
    }

    if (visualState.phase === "OWNED_STABLE" && ownerBright && ownerDark) {
        return {
            slotBgColor: ownerDark,
            fillColor: ownerDark,
            fillRatio: 1,
            // Owned: center letter takes owning team bright color.
            labelColor: ownerBright,
        };
    }

    if (visualState.phase === "OWNED_CONTESTED_DRAIN" && ownerBright) {
        return {
            slotBgColor: contestBg,
            fillColor: ownerBright,
            fillRatio: Math.max(0, Math.min(1, visualState.ownerRemaining01)),
            // Contested: center letter is white.
            labelColor: labelOwned,
        };
    }

    if (visualState.phase === "OWNED_CONTESTED_RECOVER" && ownerBright) {
        return {
            slotBgColor: contestBg,
            fillColor: ownerBright,
            fillRatio: Math.max(0, Math.min(1, visualState.progress01)),
            // Contested: center letter is white.
            labelColor: labelOwned,
        };
    }

    if (visualState.phase === "NEUTRAL_CAPTURING" && activeBright) {
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

    if (visualState.phase === "OWNED_CONTESTED_DRAIN") {
        return {
            visible: true,
            value01: clamp01(visualState.ownerRemaining01),
            color: ownerBright ?? neutralWhite,
        };
    }

    if (visualState.phase === "OWNED_CONTESTED_RECOVER") {
        return {
            visible: true,
            value01: clamp01(visualState.progress01),
            color: ownerBright ?? neutralWhite,
        };
    }

    if (visualState.phase === "NEUTRAL_CAPTURING") {
        return {
            visible: true,
            value01: clamp01(visualState.progress01),
            color: activeBright ?? neutralWhite,
        };
    }
    if (visualState.phase === "NEUTRALIZED_LATCH" && visualState.progress01 > 0) {
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

// Builds a hidden engage panel payload with optional last-known counts.
// This keeps hidden-return branches consistent and prevents subtle field drift.
function conquestPhase3BuildHiddenEngageDisplay(
    friendlyCount: number = 0,
    enemyCount: number = 0
): ConquestFlagEngageDisplay {
    return {
        visible: false,
        friendlyCount,
        enemyCount,
        friendlyRatio: 0,
        enemyRatio: 0,
        statusKey: STR_HUD_CONQUEST_CAPTURE_STATUS_CONTESTING,
    };
}

// Builds script-authoritative engagement panel data for one viewer.
function conquestPhase3GetFlagEngageDisplayForViewer(
    pid: number,
    friendlyTeam: TeamID,
    enemyTeam: TeamID
): ConquestFlagEngageDisplay {
    const activeObjId = State.conquest.capture.engagedObjIdByPid[pid];
    if (!conquestPhase3ShouldRenderEngageForPid(pid, activeObjId)) {
        return conquestPhase3BuildHiddenEngageDisplay();
    }
    const cp = State.conquest.capture.byObjId[activeObjId];
    if (!cp || !cp.mapped) {
        return conquestPhase3BuildHiddenEngageDisplay();
    }
    const friendlyCount = friendlyTeam === TeamID.Team1
        ? cp.onPointTeam1
        : cp.onPointTeam2;
    const enemyCount = enemyTeam === TeamID.Team1
        ? cp.onPointTeam1
        : cp.onPointTeam2;
    const total = friendlyCount + enemyCount;
    if (total <= 0 || friendlyCount <= 0) {
        return conquestPhase3BuildHiddenEngageDisplay(friendlyCount, enemyCount);
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
        label: cfg?.label ?? "",
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
function conquestPhase2AConfigureCaptureTimingForPoint(capturePoint: mod.CapturePoint | undefined, objIdHint?: number): boolean {
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
    State.conquest.lifecyclePhase = "LIVE_MATCH";
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
    State.conquest.debug.bleedPulseQueueLeftByPid = {};
    State.conquest.debug.bleedPulseQueueRightByPid = {};
    State.conquest.debug.bleedPulseActiveSideByPid = {};
    State.conquest.debug.bleedPulseStepByPid = {};
    State.conquest.debug.bleedPulseLimitByPid = {};
    State.conquest.debug.bleedPulsePhaseByPid = {};
    State.conquest.debug.bleedPulseNextAtByPid = {};
    State.conquest.debug.hudProjectionEngagedObjIdByPid = {};
    State.conquest.debug.hudProjectionPopoutVisibleByPid = {};
    State.conquest.debug.hudProjectionPopoutObjIdByPid = {};
    State.conquest.debug.hudProjectionEngageVisibleByPid = {};
    State.conquest.debug.hudProjectionActiveTopSlotNeutralizedByPid = {};
    State.conquest.debug.hudProjectionActiveTopSlotBorderVisibleByPid = {};
    State.conquest.debug.hudProjectionSwapPendingByPid = {};
    State.conquest.debug.hudProjectionDeployedByPid = {};
    State.conquest.debug.hudProjectionTransitionCountByPid = {};
    State.conquest.debug.hudProjectionLastChangedAtByPid = {};
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
    State.conquest.lifecyclePhase = "NOT_READY";
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
    State.conquest.debug.bleedPulseQueueLeftByPid = {};
    State.conquest.debug.bleedPulseQueueRightByPid = {};
    State.conquest.debug.bleedPulseActiveSideByPid = {};
    State.conquest.debug.bleedPulseStepByPid = {};
    State.conquest.debug.bleedPulseLimitByPid = {};
    State.conquest.debug.bleedPulsePhaseByPid = {};
    State.conquest.debug.bleedPulseNextAtByPid = {};
    State.conquest.debug.hudProjectionEngagedObjIdByPid = {};
    State.conquest.debug.hudProjectionPopoutVisibleByPid = {};
    State.conquest.debug.hudProjectionPopoutObjIdByPid = {};
    State.conquest.debug.hudProjectionEngageVisibleByPid = {};
    State.conquest.debug.hudProjectionActiveTopSlotNeutralizedByPid = {};
    State.conquest.debug.hudProjectionActiveTopSlotBorderVisibleByPid = {};
    State.conquest.debug.hudProjectionSwapPendingByPid = {};
    State.conquest.debug.hudProjectionDeployedByPid = {};
    State.conquest.debug.hudProjectionTransitionCountByPid = {};
    State.conquest.debug.hudProjectionLastChangedAtByPid = {};
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
function conquestPhase2ATryLatchEnd(reason: "tickets" | "clock", winnerTeam: TeamID | 0): void {
    if (State.conquest.endRace.endLatched) return;
    State.conquest.lifecyclePhase = "POST_MATCH";
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
    const carry = losingTeam === TeamID.Team1
        ? State.conquest.bleed.carryTeam1
        : State.conquest.bleed.carryTeam2;
    const bleedUnits = Math.max(0, Math.floor(carry));
    if (bleedUnits <= 0) return;
    if (losingTeam === TeamID.Team1) {
        State.conquest.bleed.carryTeam1 = Math.max(0, State.conquest.bleed.carryTeam1 - bleedUnits);
    } else {
        State.conquest.bleed.carryTeam2 = Math.max(0, State.conquest.bleed.carryTeam2 - bleedUnits);
    }

    const changed = conquestPhase2AApplyTicketDelta(losingTeam, -bleedUnits);
    if (changed) {
        conquestPhase2AMirrorTicketsToEngineScore();
    }
}

// Evaluates ticket-first end condition with clock fallback per CF-07/CF-60.
function conquestPhase2ACheckEndCondition(): void {
    if (!isMatchLive()) return;
    if (State.conquest.endRace.endLatched) return;

    const team1Tickets = State.conquest.tickets.team1;
    const team2Tickets = State.conquest.tickets.team2;

    if (team1Tickets <= 0 || team2Tickets <= 0) {
        if (team1Tickets <= 0 && team2Tickets <= 0) {
            conquestPhase2ATryLatchEnd("tickets", 0);
            return;
        }
        if (team1Tickets <= 0) {
            conquestPhase2ATryLatchEnd("tickets", TeamID.Team2);
            return;
        }
        conquestPhase2ATryLatchEnd("tickets", TeamID.Team1);
        return;
    }

    if (getRemainingSeconds() > 0) return;
    if (team1Tickets === team2Tickets) {
        conquestPhase2ATryLatchEnd("clock", 0);
        return;
    }
    conquestPhase2ATryLatchEnd("clock", team1Tickets > team2Tickets ? TeamID.Team1 : TeamID.Team2);
}

// Ingests engine capture-point ownership/progress into authoritative capture runtime state.
// Engage membership is handled by capture-point enter/exit event handlers.
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
            const pointTeam = safeGetTeamNumberFromPlayer(pointPlayer, 0);
            let resolvedPointTeam = pointTeam;
            if (pointPid !== undefined) {
                const livePlayer = safeFindPlayer(pointPid);
                const liveTeam = livePlayer && mod.IsPlayerValid(livePlayer)
                    ? safeGetTeamNumberFromPlayer(livePlayer, 0)
                    : 0;
                // Count on-point players by authoritative live team when available.
                // This avoids first-post-swap engage suppression caused by transient team mismatch
                // between on-point sample snapshots and live player team state.
                if (liveTeam !== 0) {
                    resolvedPointTeam = liveTeam;
                }
            }
            if (resolvedPointTeam === TeamID.Team1) onPointTeam1 += 1;
            if (resolvedPointTeam === TeamID.Team2) onPointTeam2 += 1;
        }
    } catch {
        onPointTeam1 = 0;
        onPointTeam2 = 0;
    }

    ownerTeam = conquestPhase2AResolveAuthoritativeOwnerTeam(
        state,
        ownerTeam,
        ownerProgressTeam,
        progress01
    );

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
        state.mapped !== prevMapped
        || state.label !== prevLabel
        || state.order !== prevOrder
        || state.ownerTeam !== prevOwnerTeam
        || state.ownerProgressTeam !== prevOwnerProgressTeam
        || Math.abs(state.progress01 - prevProgress01) >= 0.001
        || state.onPointTeam1 !== prevOnPointTeam1
        || state.onPointTeam2 !== prevOnPointTeam2
        || visualChanged;
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
        // Pre-event fallback authority:
        // when edge callbacks are missed, infer strong neutralization/recapture edges from live samples
        // so owner state (and therefore bleed differential) cannot remain stale until a later callback.
        const opposingPreEvent = (
            engineOwnerTeam !== 0
            && ownerProgressTeam !== 0
            && ownerProgressTeam !== engineOwnerTeam
        ) ? ownerProgressTeam : 0;
        const neutralizationPreEvent = (
            engineOwnerTeam !== 0
            && opposingPreEvent !== 0
            && (
                progress01 >= CONQUEST_FLAG_PHASE_TRANSITION_HIGH
                || progress01 <= CONQUEST_FLAG_PHASE_TRANSITION_LOW
            )
        );
        if (neutralizationPreEvent) {
            state.ownerLatchedByEvent = true;
            state.ownerTeam = 0;
            return 0;
        }

        const recapturePreEvent = (
            engineOwnerTeam === 0
            && ownerProgressTeam !== 0
            && progress01 >= CONQUEST_FLAG_PHASE_TRANSITION_HIGH
        );
        if (recapturePreEvent) {
            state.ownerLatchedByEvent = true;
            state.ownerTeam = ownerProgressTeam;
            return ownerProgressTeam;
        }

        return engineOwnerTeam;
    }

    // Neutralization fallback:
    // if the engine drops ownerProgressTeam to 0 at the neutralization edge,
    // use last known opposing progress-team so ownership can still clear to neutral.
    const opposingProgressTeam = (
        ownerProgressTeam !== 0 && ownerProgressTeam !== state.ownerTeam
    )
        ? ownerProgressTeam
        : (
            state.ownerProgressTeam !== 0 && state.ownerProgressTeam !== state.ownerTeam
        )
            ? state.ownerProgressTeam
            : 0;

    const neutralizationComplete = (
        state.ownerTeam !== 0
        && opposingProgressTeam !== 0
        && progress01 >= CONQUEST_FLAG_PHASE_TRANSITION_HIGH
    );
    if (neutralizationComplete) {
        state.ownerTeam = 0;
        return 0;
    }

    // Wrapped-neutralization fallback:
    // if owner was being drained and progress has wrapped back near zero while the opposing team is still active,
    // the neutralization edge likely occurred between samples; clear owner immediately to prevent stale owner borders.
    const opposingProgressForWrap = (
        ownerProgressTeam !== 0 && ownerProgressTeam !== state.ownerTeam
    )
        ? ownerProgressTeam
        : (
            state.ownerProgressTeam !== 0 && state.ownerProgressTeam !== state.ownerTeam
        )
            ? state.ownerProgressTeam
            : 0;
    const neutralizationWrapped = (
        state.ownerTeam !== 0
        && opposingProgressForWrap !== 0
        && progress01 <= CONQUEST_FLAG_PHASE_TRANSITION_LOW
    );
    if (neutralizationWrapped) {
        state.ownerTeam = 0;
        return 0;
    }

    // Recapture fallback:
    // if progress-team is transiently 0 near full capture, use the last known non-zero progress-team.
    const captureProgressTeam = ownerProgressTeam !== 0
        ? ownerProgressTeam
        : state.ownerProgressTeam;
    const recaptureComplete = (
        state.ownerTeam === 0
        && captureProgressTeam !== 0
        && progress01 >= CONQUEST_FLAG_PHASE_TRANSITION_HIGH
    );
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
    visual.phase = "NEUTRALIZED_LATCH";
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
    visual.phase = ownerTeam === 0 ? "NEUTRAL_IDLE" : "OWNED_STABLE";
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
    const previousEngagedByPid = { ...State.conquest.capture.engagedObjIdByPid };
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

// Resolves one cached widget ref by index and backfills the cache via safeFind when needed.
function conquestPhase3ResolveCachedIndexedWidget(
    cache: Array<mod.UIWidget | undefined>,
    index: number,
    widgetName: string
): mod.UIWidget | undefined {
    const cached = cache[index];
    if (cached) return cached;
    const resolved = safeFind(widgetName);
    if (resolved) cache[index] = resolved;
    return resolved;
}

// Renders conquest flag slot background/fill/label/percent widgets only.
function renderConquestFlagSlotsForPid(
    refs: HudRefs,
    flags: ConquestHudFlagsViewModel
): void {
    const pid = refs.pid;
    const activeObjId = conquestPhase3GetRenderableActiveObjIdForPid(pid);
    const slotRoots = refs.conquestFlagsDebugSlotRoots ?? (refs.conquestFlagsDebugSlotRoots = []);
    const slotBorders = refs.conquestFlagsDebugBorderRows ?? (refs.conquestFlagsDebugBorderRows = []);
    const slotFills = refs.conquestFlagsDebugFillRows ?? (refs.conquestFlagsDebugFillRows = []);
    const slotLabelShadowsRight = refs.conquestFlagsDebugLabelShadowRightRows ?? (refs.conquestFlagsDebugLabelShadowRightRows = []);
    const slotLabelShadowsLeft = refs.conquestFlagsDebugLabelShadowLeftRows ?? (refs.conquestFlagsDebugLabelShadowLeftRows = []);
    const slotLabelShadowsUp = refs.conquestFlagsDebugLabelShadowUpRows ?? (refs.conquestFlagsDebugLabelShadowUpRows = []);
    const slotLabelShadowsDown = refs.conquestFlagsDebugLabelShadowDownRows ?? (refs.conquestFlagsDebugLabelShadowDownRows = []);
    const slotLabelShadowsUpLeft = refs.conquestFlagsDebugLabelShadowUpLeftRows ?? (refs.conquestFlagsDebugLabelShadowUpLeftRows = []);
    const slotLabelShadowsUpRight = refs.conquestFlagsDebugLabelShadowUpRightRows ?? (refs.conquestFlagsDebugLabelShadowUpRightRows = []);
    const slotLabelShadowsDownRight = refs.conquestFlagsDebugLabelShadowDownRightRows ?? (refs.conquestFlagsDebugLabelShadowDownRightRows = []);
    const slotLabelShadowsDownLeft = refs.conquestFlagsDebugLabelShadowDownLeftRows ?? (refs.conquestFlagsDebugLabelShadowDownLeftRows = []);
    const slotLabelShadowsInner = refs.conquestFlagsDebugLabelShadowInnerRows ?? (refs.conquestFlagsDebugLabelShadowInnerRows = []);
    const slotLabelShadowsInnerDeep = refs.conquestFlagsDebugLabelShadowInnerDeepRows ?? (refs.conquestFlagsDebugLabelShadowInnerDeepRows = []);
    const slotLabels = refs.conquestFlagsDebugLabelRows ?? (refs.conquestFlagsDebugLabelRows = []);
    const slotPercentRoots = refs.conquestFlagsDebugPercentRoots ?? (refs.conquestFlagsDebugPercentRoots = []);
    const slotPercentShadowsRight = refs.conquestFlagsDebugPercentShadowRightRows ?? (refs.conquestFlagsDebugPercentShadowRightRows = []);
    const slotPercentShadowsLeft = refs.conquestFlagsDebugPercentShadowLeftRows ?? (refs.conquestFlagsDebugPercentShadowLeftRows = []);
    const slotPercentShadowsUp = refs.conquestFlagsDebugPercentShadowUpRows ?? (refs.conquestFlagsDebugPercentShadowUpRows = []);
    const slotPercentShadowsDown = refs.conquestFlagsDebugPercentShadowDownRows ?? (refs.conquestFlagsDebugPercentShadowDownRows = []);
    const slotPercentShadowsUpLeft = refs.conquestFlagsDebugPercentShadowUpLeftRows ?? (refs.conquestFlagsDebugPercentShadowUpLeftRows = []);
    const slotPercentShadowsUpRight = refs.conquestFlagsDebugPercentShadowUpRightRows ?? (refs.conquestFlagsDebugPercentShadowUpRightRows = []);
    const slotPercentShadowsDownRight = refs.conquestFlagsDebugPercentShadowDownRightRows ?? (refs.conquestFlagsDebugPercentShadowDownRightRows = []);
    const slotPercentShadowsDownLeft = refs.conquestFlagsDebugPercentShadowDownLeftRows ?? (refs.conquestFlagsDebugPercentShadowDownLeftRows = []);
    const slotPercentShadowsInner = refs.conquestFlagsDebugPercentShadowInnerRows ?? (refs.conquestFlagsDebugPercentShadowInnerRows = []);
    const slotPercentTexts = refs.conquestFlagsDebugPercentTextRows ?? (refs.conquestFlagsDebugPercentTextRows = []);
    const maxSlotsFromRefs = Math.max(
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
    const maxSlots = Math.max(maxSlotsFromRefs, flags.slots.length);

    for (let slot = 0; slot < maxSlots; slot++) {
        const slotVm = flags.slots[slot] ?? {
            visible: false,
            borderVisible: false,
            fillVisible: false,
            fillY: 0,
            fillHeight: 0,
            labelVisible: false,
            percentVisible: false,
        };
        const slotRoot = conquestPhase3ResolveCachedIndexedWidget(slotRoots, slot, `ConquestFlagHudSlot_${pid}_${slot}`);
        const slotBorder = conquestPhase3ResolveCachedIndexedWidget(slotBorders, slot, `ConquestFlagHudBorder_${pid}_${slot}`);
        const slotFill = conquestPhase3ResolveCachedIndexedWidget(slotFills, slot, `ConquestFlagHudFill_${pid}_${slot}`);
        const slotLabelShadowRight = conquestPhase3ResolveCachedIndexedWidget(slotLabelShadowsRight, slot, `ConquestFlagHudLabelShadowRight_${pid}_${slot}`);
        const slotLabelShadowLeft = conquestPhase3ResolveCachedIndexedWidget(slotLabelShadowsLeft, slot, `ConquestFlagHudLabelShadowLeft_${pid}_${slot}`);
        const slotLabelShadowUp = conquestPhase3ResolveCachedIndexedWidget(slotLabelShadowsUp, slot, `ConquestFlagHudLabelShadowUp_${pid}_${slot}`);
        const slotLabelShadowDown = conquestPhase3ResolveCachedIndexedWidget(slotLabelShadowsDown, slot, `ConquestFlagHudLabelShadowDown_${pid}_${slot}`);
        const slotLabelShadowUpLeft = conquestPhase3ResolveCachedIndexedWidget(slotLabelShadowsUpLeft, slot, `ConquestFlagHudLabelShadowUpLeft_${pid}_${slot}`);
        const slotLabelShadowUpRight = conquestPhase3ResolveCachedIndexedWidget(slotLabelShadowsUpRight, slot, `ConquestFlagHudLabelShadowUpRight_${pid}_${slot}`);
        const slotLabelShadowDownRight = conquestPhase3ResolveCachedIndexedWidget(slotLabelShadowsDownRight, slot, `ConquestFlagHudLabelShadowDownRight_${pid}_${slot}`);
        const slotLabelShadowDownLeft = conquestPhase3ResolveCachedIndexedWidget(slotLabelShadowsDownLeft, slot, `ConquestFlagHudLabelShadowDownLeft_${pid}_${slot}`);
        const slotLabelShadowInner = conquestPhase3ResolveCachedIndexedWidget(slotLabelShadowsInner, slot, `ConquestFlagHudLabelShadowInner_${pid}_${slot}`);
        const slotLabelShadowInnerDeep = conquestPhase3ResolveCachedIndexedWidget(slotLabelShadowsInnerDeep, slot, `ConquestFlagHudLabelShadowInnerDeep_${pid}_${slot}`);
        const slotLabel = conquestPhase3ResolveCachedIndexedWidget(slotLabels, slot, `ConquestFlagHudLabel_${pid}_${slot}`);
        const slotPercentRoot = conquestPhase3ResolveCachedIndexedWidget(slotPercentRoots, slot, `ConquestFlagHudPercentRoot_${pid}_${slot}`);
        const slotPercentShadowRight = conquestPhase3ResolveCachedIndexedWidget(slotPercentShadowsRight, slot, `ConquestFlagHudPercentShadowRight_${pid}_${slot}`);
        const slotPercentShadowLeft = conquestPhase3ResolveCachedIndexedWidget(slotPercentShadowsLeft, slot, `ConquestFlagHudPercentShadowLeft_${pid}_${slot}`);
        const slotPercentShadowUp = conquestPhase3ResolveCachedIndexedWidget(slotPercentShadowsUp, slot, `ConquestFlagHudPercentShadowUp_${pid}_${slot}`);
        const slotPercentShadowDown = conquestPhase3ResolveCachedIndexedWidget(slotPercentShadowsDown, slot, `ConquestFlagHudPercentShadowDown_${pid}_${slot}`);
        const slotPercentShadowUpLeft = conquestPhase3ResolveCachedIndexedWidget(slotPercentShadowsUpLeft, slot, `ConquestFlagHudPercentShadowUpLeft_${pid}_${slot}`);
        const slotPercentShadowUpRight = conquestPhase3ResolveCachedIndexedWidget(slotPercentShadowsUpRight, slot, `ConquestFlagHudPercentShadowUpRight_${pid}_${slot}`);
        const slotPercentShadowDownRight = conquestPhase3ResolveCachedIndexedWidget(slotPercentShadowsDownRight, slot, `ConquestFlagHudPercentShadowDownRight_${pid}_${slot}`);
        const slotPercentShadowDownLeft = conquestPhase3ResolveCachedIndexedWidget(slotPercentShadowsDownLeft, slot, `ConquestFlagHudPercentShadowDownLeft_${pid}_${slot}`);
        const slotPercentShadowInner = conquestPhase3ResolveCachedIndexedWidget(slotPercentShadowsInner, slot, `ConquestFlagHudPercentShadowInner_${pid}_${slot}`);
        const slotPercentText = conquestPhase3ResolveCachedIndexedWidget(slotPercentTexts, slot, `ConquestFlagHudPercentText_${pid}_${slot}`);
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
        // Objective letters use only the even 8-direction ring; centered inner layers are disabled.
        safeSetUIWidgetVisible(slotLabelShadowInner, false);
        safeSetUIWidgetVisible(slotLabelShadowInnerDeep, false);
        if (!slotVm.visible) {
            safeSetUIWidgetVisible(slotRoot, false);
            safeSetUIWidgetVisible(slotBorder, false);
            safeSetUIWidgetVisible(slotFill, false);
            safeSetUIWidgetVisible(slotPercentRoot, false);
            conquestPhase3SetShadowTextGroupVisible(slotLabelGroup, false);
            conquestPhase3SetShadowTextGroupVisible(slotPercentGroup, false);
            continue;
        }

        safeSetUIWidgetVisible(slotRoot, true);
        conquestPhase3SetShadowTextGroupVisible(slotLabelGroup, slotVm.labelVisible);
        if (slotVm.labelVisible && slotVm.labelMessage && slotVm.labelColor) {
            conquestPhase3SetShadowTextGroupLabel(slotLabelGroup, slotVm.labelMessage);
            conquestPhase3SetShadowTextGroupColors(slotLabelGroup, slotVm.labelColor);
        }
        safeSetUIWidgetVisible(slotPercentRoot, slotVm.percentVisible);
        if (slotVm.percentVisible && slotVm.percentMessage && slotVm.percentColor) {
            conquestPhase3SetShadowTextGroupVisible(slotPercentGroup, true);
            conquestPhase3SetShadowTextGroupLabel(slotPercentGroup, slotVm.percentMessage);
            conquestPhase3SetShadowTextGroupColors(slotPercentGroup, slotVm.percentColor);
        } else {
            conquestPhase3SetShadowTextGroupVisible(slotPercentGroup, false);
        }
        const slotBgColor = slotVm.slotBgColor ?? mod.CreateVector(
            CONQUEST_HUD_FLAG_SLOT_TRACK_RGB[0],
            CONQUEST_HUD_FLAG_SLOT_TRACK_RGB[1],
            CONQUEST_HUD_FLAG_SLOT_TRACK_RGB[2]
        );
        safeSetUIWidgetBgColor(slotRoot, slotBgColor);
        const suppressActiveBorder = !!activeObjId && slotVm.objId === activeObjId;
        safeSetUIWidgetVisible(slotBorder, slotVm.borderVisible && !!slotVm.borderColor && !suppressActiveBorder);
        if (slotVm.borderVisible && slotVm.borderColor && !suppressActiveBorder) {
            safeSetUIWidgetBgColor(slotBorder, slotVm.borderColor);
        }

        if (slotVm.fillVisible && slotVm.fillColor) {
            safeSetUIWidgetVisible(slotFill, true);
            safeSetUIWidgetPosition(
                slotFill,
                mod.CreateVector(CONQUEST_HUD_FLAG_FILL_INSET_X, slotVm.fillY, 0)
            );
            safeSetUIWidgetSize(
                slotFill,
                mod.CreateVector(CONQUEST_HUD_FLAG_FILL_MAX_WIDTH, slotVm.fillHeight, 0)
            );
            safeSetUIWidgetBgColor(slotFill, slotVm.fillColor);
        } else {
            safeSetUIWidgetVisible(slotFill, false);
        }
    }
}

// Updates per-player conquest ticket/flag HUD from authoritative state using viewer perspective colors.
function updateConquestPhase2ADebugHudForAllPlayers(force?: boolean): void {
    const hudMode = getConquestHudMode();
    conquestPhase3RefreshTopHudDerivedSlicesForAllPlayers();
    if (hudMode === "core") {
        try {
            // Hard-cut mode: new TwlConquestHud pipeline is the only combat HUD owner.
            twlConquestHudTickFrame(force);
            twlConquestHudTickAnimation(force);
            conquestPhase3ApplyCoreLegacySuppression(force);
        } catch {
            // HUD core is optional for gameplay; keep mode alive and allow core to self-recover on next tick.
            twlConquestHudHideAllPlayers();
            conquestPhase3ApplyCoreLegacySuppression(force);
        }
        if (force) {
            State.conquest.debug.hudLastUpdatedAtSeconds = Math.floor(mod.GetMatchTimeElapsed());
        }
        State.conquest.debug.hudDirty = false;
        return;
    }
    if (hudMode === "off") {
        conquestPhase3ArmCoreLegacySuppression();
        twlConquestHudHideAllPlayers();
        hideAllConquestCombatHudV2();
        conquestPhase3ForceHideCombatHudForAllPlayersFromCache();
        State.conquest.debug.hudDirty = false;
        return;
    }

    conquestPhase3ArmCoreLegacySuppression();
    const useCombatV2Owner = isConquestCombatRenderOwnerV2();
    conquestPhase3RunCombatLoopByOwner(force);
    if (useCombatV2Owner) {
        if (force) {
            State.conquest.debug.hudLastUpdatedAtSeconds = Math.floor(mod.GetMatchTimeElapsed());
        }
        State.conquest.debug.hudDirty = false;
        return;
    }
    if (!conquestPhase3ShouldRunCombatHud()) {
        conquestPhase3ForceHideCombatHudForAllPlayersFromCache();
        State.conquest.debug.hudDirty = false;
        return;
    }
    if (!force && !State.conquest.debug.hudDirty) {
        conquestPhase3RefreshTicketBleedWhenHudClean();
        return;
    }

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
        const pid = safeGetPlayerId(p);
        if (pid === undefined) continue;
        if (!force && !conquestPhase3TrackSinglePassRenderForPid(pid)) continue;
        const swapResetPending = State.conquest.debug.teamSwapHudResetPendingByPid[pid] === true;
        if (swapResetPending) {
            // Hard swap gate:
            // keep full custom combat HUD hidden while pending, then rebuild/reveal after deploy release.
            State.conquest.debug.engageHiddenUntilDeployByPid[pid] = true;
            delete State.conquest.capture.engagedObjIdByPid[pid];
        }

        const perspective = conquestPhase3GetPerspectiveTeams(p);
        let refs: HudRefs | undefined = State.hudCache.hudByPid[pid];
        const needsHudBootstrap = !refs;
        if (needsHudBootstrap) {
            // Single-owner lifecycle: ensureHudForPlayer() owns per-PID build/rebuild.
            refs = ensureHudForPlayer(p);
        }
        if (!refs) {
            conquestPhase3PublishHudProjectionDebugSnapshotForPid(pid, undefined);
            continue;
        }
        if (!conquestPhase3HasCriticalHudRefs(refs)) {
            destroyConquestHudForPid(refs.pid);
            refs = ensureHudForPlayer(p);
            if (!refs || !conquestPhase3HasCriticalHudRefs(refs)) {
                conquestPhase3PublishHudProjectionDebugSnapshotForPid(pid, undefined);
                continue;
            }
        }
        if (swapResetPending) {
            conquestPhase3ForceHideAllV2Widgets(refs);
            conquestPhase3PublishHudProjectionDebugSnapshotForPid(pid, undefined);
            continue;
        }
        if (!perspective.resolved) {
            // Keep custom HUD visible with fallback team orientation while perspective resolves.
            // This avoids full custom HUD drops that expose native top HUD lanes.
        }
        const maxFlagSlots = conquestPhase3GetFlagMaxSlotsFromRefs(refs);
        const hudVm = deriveHudViewModelForPlayer(pid, perspective, mappedCaptureStates, maxFlagSlots);
        conquestPhase3PublishDerivedHudSlicesForPid(pid, hudVm);
        conquestPhase3PublishHudProjectionDebugSnapshotForPid(pid, hudVm);
        if (CONQUEST_PHASE3_UI_OWNERSHIP_PROBE_HIDE_V2) {
            conquestPhase3ForceHideAllV2Widgets(refs);
            continue;
        }
        renderConquestTicketCountersForPid(refs, hudVm.tickets);
        renderConquestTicketBarsForPid(refs, hudVm.tickets);
        renderConquestTicketLeaderForPid(refs, hudVm.tickets);
        renderConquestTicketBleedForPid(refs, hudVm.tickets);
        renderConquestFlagSlotsForPid(
            refs,
            hudVm.flags
        );
        renderConquestActiveFlagPopoutForPid(
            refs,
            hudVm.activeFlagPopout
        );
        renderConquestEngageForPid(
            refs,
            hudVm.engage
        );
        // Show roots last so all child updates are already committed before reveal.
        // This reduces swap-time incremental construction visibility.
        renderConquestRootsForPid(refs);
    }
}

// Runs sub-second live capture synchronization so dynamic HUD elements do not strobe on second boundaries.
function conquestPhase2ARefreshLiveCaptureStateSubtick(): void {
    // Keep capture-state authoritative even if event-driven capture callbacks miss a transition frame.
    conquestPhase2ASyncMappedCapturePointsFromEngine();
    // Run suppression outside the regular dirty-render gate so stale engage rows never linger.
    if (getConquestHudMode() === "legacy" && !isConquestCombatRenderOwnerV2()) {
        conquestPhase3EnforceSuppressedEngageWidgets();
    }
}

// Phase 2A second-boundary tick owner: bleed, end checks, then debug projection refresh.
function conquestPhase2AOnLiveTick(): void {
    conquestPhase2AApplyBleedTick();
    conquestPhase2ACheckEndCondition();
    updateConquestPhase2ADebugHudForAllPlayers();
}
