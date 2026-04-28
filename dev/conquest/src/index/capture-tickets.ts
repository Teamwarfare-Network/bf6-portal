// @ts-nocheck
// Module: index/capture-tickets -- Phase 2A capture routing, ticket bleed, end checks, and temporary debug HUD

// Clamps engine capture-progress reads to a safe [0..1] range.
function clamp01(value: number): number {
    if (value <= 0) return 0;
    if (value >= 1) return 1;
    return value;
}

// Returns true when a player should count toward live capture-point engage state.
// Dead, man-down, undeployed, or invalid soldiers are treated the same as leaving the point.
function shouldCountPlayerAsActiveOnPoint(player: mod.Player | undefined): boolean {
    if (!isValidPlayer(player)) return false;
    if (!isPlayerDeployed(player)) return false;
    if (!safeGetSoldierStateBool(player, mod.SoldierStateBool.IsAlive, false)) return false;
    if (safeGetSoldierStateBool(player, mod.SoldierStateBool.IsDead, false)) return false;
    if (safeGetSoldierStateBool(player, mod.SoldierStateBool.IsManDown, false)) return false;
    return true;
}

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

// Clears engaged-objective ownership for players who are no longer valid active on-point soldiers.
// This keeps popout/engage HUD state aligned with death/undeploy even if engine exit callbacks lag.
function clearInactiveEngagedObjectiveOwners(): void {
    let clearedAny = false;
    const engagedByPid = State.conquest.capture.engagedObjIdByPid;
    for (const pidKey of Object.keys(engagedByPid)) {
        const pid = Number(pidKey);
        if (!pid) continue;
        const engagedObjId = engagedByPid[pid];
        if (engagedObjId === undefined) continue;
        const player = safeFindPlayer(pid);
        if (shouldCountPlayerAsActiveOnPoint(player)) continue;
        delete engagedByPid[pid];
        clearedAny = true;
    }
    if (clearedAny) {
        markHudDirty();
    }
}

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

const CONQUEST_PHASE3_ACTIVE_SLOT_MUTED_LABEL = mod.CreateVector(180 / 255, 188 / 255, 196 / 255);

// Marks conquest HUD projections dirty so the next live tick performs a render pass.
function markHudDirty(): void {
    State.conquest.debug.hudDirty = true;
}

// Returns true when combat HUD projection is enabled in both runtime debug and config gates.
function shouldRunCombatHud(): boolean {
    return State.conquest.debug.hudEnabled && CONQUEST_COMBAT_HUD_ENABLED;
}

// Refreshes top-HUD derived slices for all viewers without touching combat lane refs.
function refreshTopHudDerivedSlicesForAllPlayers(): void {
    forEachValidPlayer((_player, pid) => {
        const topHelpReadyVm = deriveConquestHudHelpReadyViewModel(pid);
        const topStatusVm = deriveConquestHudStatusViewModel(topHelpReadyVm);
        const topClockVm = deriveConquestHudClockViewModel();
        publishTopHudDerivedSlicesForPid(pid, topStatusVm, topHelpReadyVm, topClockVm);
    });
}

// Publishes derived top-HUD slices shared by status/help/clock owners.
function publishTopHudDerivedSlicesForPid(
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
function ensureTopHudDerivedSlicesForPid(pid: number): void {
    const helpReady = deriveConquestHudHelpReadyViewModel(pid);
    const status = deriveConquestHudStatusViewModel(helpReady);
    const clock = deriveConquestHudClockViewModel();
    publishTopHudDerivedSlicesForPid(pid, status, helpReady, clock);
}

// Publishes derived top-HUD view-model slices for status/help/clock owners.
function publishDerivedHudSlicesForPid(pid: number, vm: ConquestHudViewModel): void {
    publishTopHudDerivedSlicesForPid(pid, vm.status, vm.helpReady, vm.clock);
}

// Shared active-objective occupancy gate used by combat HUD and capture-sound dispatch.
// A player counts as an active objective occupant only when deployed, not swap-pending,
// and holding a capture-point-derived objective id for this tick.
function conquestShouldTreatPidAsActiveObjectiveOccupant(pid: number, activeObjId: number | undefined): boolean {
    if (!State.players.deployedByPid[pid]) return false;
    if (State.conquest.debug.teamSwapHudResetPendingByPid[pid] === true) return false;
    if (activeObjId === undefined) return false;
    return true;
}

// Single-owner engage visibility gate for Conquest capture HUD.
// Engage can render only when the player passes the shared active-objective occupancy gate.
function shouldRenderEngageForPid(pid: number, activeObjId: number | undefined): boolean {
    return conquestShouldTreatPidAsActiveObjectiveOccupant(pid, activeObjId);
}

// Returns the engaged objective only when engage/popout/top-slot active state should render.
function getRenderableActiveObjIdForPid(pid: number): number | undefined {
    const engagedObjId = State.conquest.capture.engagedObjIdByPid[pid];
    if (!shouldRenderEngageForPid(pid, engagedObjId)) {
        return undefined;
    }
    return engagedObjId;
}

// Resolves viewer perspective teams for friendly-left/enemy-right HUD rendering.
// If unresolved, render should skip team-colored conquest widgets for this frame.
function getPerspectiveTeams(
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
function getOrderedMappedCaptureStates(): ConquestCapturePointRuntimeState[] {
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
function getTicketBarRatio(currentTickets: number): number {
    const base = Math.max(1, CONQUEST_STARTING_TICKETS);
    return Math.max(0, Math.min(1, currentTickets / base));
}

// Returns the authoritative global ticket leader from script state.
function getTicketLeaderTeam(): TeamID | 0 {
    if (State.conquest.tickets.team1 > State.conquest.tickets.team2) return TeamID.Team1;
    if (State.conquest.tickets.team2 > State.conquest.tickets.team1) return TeamID.Team2;
    return 0;
}

// Computes stacked bleed-chevron counts from ownership differential for one player's team perspective.
// Contract:
// - up to CONQUEST_HUD_TICKET_BLEED_CHEVRON_COUNT chevrons are shown on the losing/bleeding side
// - no chevrons are shown when bleed is disabled, pre-live, or objective control is tied
function getBleedChevronCountsForPerspective(
    friendlyTeam: TeamID,
    enemyTeam: TeamID
): { leftCount: number; rightCount: number } {
    if (!isMatchLive()) return { leftCount: 0, rightCount: 0 };
    if (!State.conquest.bleed.enabled) return { leftCount: 0, rightCount: 0 };

    const ownership = getOwnershipCounts();
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
    const engageDisplay = getFlagEngageDisplayForViewer(pid, friendlyTeam, enemyTeam);
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
        friendlyCountLabel: msg(STR_SYS_COUNTER, engageDisplay.friendlyCount),
        enemyCountLabel: msg(STR_SYS_COUNTER, engageDisplay.enemyCount),
        statusLabel: msg(engageDisplay.statusKey),
        friendlyWidth,
        enemyWidth,
    };
}

// Converts a fill ratio into pixel height while preserving neutral-idle cleanup rules.
function computeFlagFillHeight(
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
function shouldFillFromTopForEnemy(
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
function isFlagFullyOwnedForHud(
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
    const engagedObjId = getRenderableActiveObjIdForPid(pid);
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

    const visibleSlots = getCenteredFlagSlots(mappedCaptureStates.length, clampedSlots);
    const sampleTick = Math.floor(mod.GetMatchTimeElapsed() * 10);
    for (let row = 0; row < mappedCaptureStates.length && row < visibleSlots.length; row++) {
        const slotIndex = visibleSlots[row];
        const cp = mappedCaptureStates[row];
        const labelKey = getFlagLetterStringKey(cp, row);
        const visualState = State.conquest.capture.visualByObjId[cp.objId]
            ?? createDefaultFlagVisualState(sampleTick);
        const visual = getFlagSlotVisual(visualState, friendlyTeam, enemyTeam);
        const percentVisual = getFlagPercentDisplay(visualState, friendlyTeam, enemyTeam);
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
        const fullyOwned = isFlagFullyOwnedForHud(
            cp.ownerTeam,
            cp.ownerProgressTeam,
            cp.progress01,
            !!borderColor
        );
        const borderVisible = fullyOwned;
        const onPointCount = cp.onPointTeam1 + cp.onPointTeam2;
        const forceNeutralIdleEmpty = visualState.phase === "NEUTRAL_IDLE";
        const fillHeight = computeFlagFillHeight(
            CONQUEST_HUD_FLAG_FILL_MAX_HEIGHT,
            visual.fillRatio,
            cp.ownerTeam,
            cp.progress01,
            onPointCount,
            forceNeutralIdleEmpty
        );
        const fillFromTop = shouldFillFromTopForEnemy(visualState, enemyTeam);

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
            labelMessage: msg(labelKey),
            labelColor: visual.labelColor,
            percentVisible: percentVisual.visible && !fullyOwned,
            percentColor: percentVisual.color,
        };
        if (percentVisual.visible && percentVisual.color) {
            const roundedPercent = Math.max(0, Math.min(100, Math.round(percentVisual.value01 * 100)));
            const percentValue = fullyOwned ? 100 : Math.min(99, roundedPercent);
            slotVm.percentMessage = msg(STR_SYSTEM_GENERIC_PERCENT, percentValue);
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
    const engagedObjId = getRenderableActiveObjIdForPid(pid);
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

    const labelKey = getFlagLetterStringKey(activeCapturePoint, activeRow);
    const sampleTick = Math.floor(mod.GetMatchTimeElapsed() * 10);
    const visualState = State.conquest.capture.visualByObjId[activeCapturePoint.objId]
        ?? createDefaultFlagVisualState(sampleTick);
    const visual = getFlagSlotVisual(visualState, friendlyTeam, enemyTeam);
    const percentVisual = getFlagPercentDisplay(visualState, friendlyTeam, enemyTeam);
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
    const fullyOwned = isFlagFullyOwnedForHud(
        activeCapturePoint.ownerTeam,
        activeCapturePoint.ownerProgressTeam,
        activeCapturePoint.progress01,
        !!borderColor
    );
    // Active popout should not materialize its percent late; show 0% immediately until the visual FSM owns a value.
    const popoutPercentVisible = !fullyOwned;
    const popoutPercentColor = percentVisual.color ?? mod.CreateVector(
        CONQUEST_HUD_TEXT_NEUTRAL_RGB[0],
        CONQUEST_HUD_TEXT_NEUTRAL_RGB[1],
        CONQUEST_HUD_TEXT_NEUTRAL_RGB[2]
    );
    const popoutPercentValue01 = percentVisual.visible ? percentVisual.value01 : 0;
    const borderVisible = fullyOwned;
    const onPointCount = activeCapturePoint.onPointTeam1 + activeCapturePoint.onPointTeam2;
    const forceNeutralIdleEmpty = visualState.phase === "NEUTRAL_IDLE";
    const fillHeight = computeFlagFillHeight(
        CONQUEST_HUD_FLAG_ACTIVE_POPOUT_FILL_MAX_HEIGHT,
        visual.fillRatio,
        activeCapturePoint.ownerTeam,
        activeCapturePoint.progress01,
        onPointCount,
        forceNeutralIdleEmpty
    );
    const fillFromTop = shouldFillFromTopForEnemy(visualState, enemyTeam);

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
        labelMessage: msg(labelKey),
        labelColor: visual.labelColor,
        percentVisible: popoutPercentVisible,
        percentColor: popoutPercentColor,
    };
    if (popoutPercentVisible) {
        const roundedPercent = Math.max(0, Math.min(100, Math.round(popoutPercentValue01 * 100)));
        const percentValue = fullyOwned ? 100 : Math.min(99, roundedPercent);
        popoutVm.percentMessage = msg(STR_SYSTEM_GENERIC_PERCENT, percentValue);
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
    const bleedCounts = getBleedChevronCountsForPerspective(
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
            friendlyTicketLabel: msg(STR_SYS_COUNTER, friendlyTickets),
            enemyTicketLabel: msg(STR_SYS_COUNTER, enemyTickets),
            leaderTeam: getTicketLeaderTeam(),
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

// Returns centered slot indices for N visible flags across a fixed slot row.
function getCenteredFlagSlots(flagCount: number, maxSlots: number): number[] {
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
function getFallbackFlagToken(row: number): string {
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
function getFlagLetterStringKey(cp: ConquestCapturePointRuntimeState, row: number): number {
    const raw = (cp.label && cp.label.length > 0 ? cp.label : getFallbackFlagToken(row)).toUpperCase();
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
function createDefaultFlagVisualState(sampleTick: number): ConquestFlagVisualRuntimeState {
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
function ensureFlagVisualState(objId: number, sampleTick: number): ConquestFlagVisualRuntimeState {
    const existing = State.conquest.capture.visualByObjId[objId];
    if (existing) {
        if (existing.suppressOwnerUntilRecaptured === undefined) {
            existing.suppressOwnerUntilRecaptured = false;
        }
        return existing;
    }
    const created = createDefaultFlagVisualState(sampleTick);
    State.conquest.capture.visualByObjId[objId] = created;
    return created;
}

// Normalizes raw capture ownership/progress into a stable visual sample for FSM transitions.
function normalizeVisualSample(
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
function resolveFlagVisualState(
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
function hasVisualStateChanged(
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
function refreshFlagVisualState(cp: ConquestCapturePointRuntimeState): ConquestFlagVisualRuntimeState {
    const sampleTick = Math.floor(mod.GetMatchTimeElapsed() * 10);
    const previousVisual = ensureFlagVisualState(cp.objId, sampleTick);
    const sample = normalizeVisualSample(cp, previousVisual, sampleTick);
    const nextVisual = resolveFlagVisualState(sample, previousVisual);
    State.conquest.capture.visualByObjId[cp.objId] = nextVisual;
    return nextVisual;
}

// Resolves final flag widget colors/fills from script-authoritative visual phase + viewer perspective.
function getFlagSlotVisual(
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
function getFlagPercentDisplay(
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
function getEngageStatusKey(
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
function buildHiddenEngageDisplay(
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
function getFlagEngageDisplayForViewer(
    pid: number,
    friendlyTeam: TeamID,
    enemyTeam: TeamID
): ConquestFlagEngageDisplay {
    const activeObjId = State.conquest.capture.engagedObjIdByPid[pid];
    if (!shouldRenderEngageForPid(pid, activeObjId)) {
        return buildHiddenEngageDisplay();
    }
    const cp = State.conquest.capture.byObjId[activeObjId];
    if (!cp || !cp.mapped) {
        return buildHiddenEngageDisplay();
    }
    const friendlyCount = friendlyTeam === TeamID.Team1
        ? cp.onPointTeam1
        : cp.onPointTeam2;
    const enemyCount = enemyTeam === TeamID.Team1
        ? cp.onPointTeam1
        : cp.onPointTeam2;
    const total = friendlyCount + enemyCount;
    if (total <= 0 || friendlyCount <= 0) {
        return buildHiddenEngageDisplay(friendlyCount, enemyCount);
    }

    const friendlyRatio = Math.max(0, Math.min(1, friendlyCount / total));
    const enemyRatio = Math.max(0, Math.min(1, enemyCount / total));
    const statusKey = getEngageStatusKey(cp.ownerTeam, friendlyTeam, friendlyCount, enemyCount);
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
function getMappedConfigsInOrder(): CapturePointConfig[] {
    const copy = [...ACTIVE_CAPTURE_POINT_CONFIGS];
    copy.sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order;
        return a.objId - b.objId;
    });
    return copy;
}

// Rebuilds authoritative mapped capture index from active map config.
function buildMappedCaptureIndexFromConfig(): void {
    const ordered = getMappedConfigsInOrder();
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
        State.conquest.capture.visualByObjId[cfg.objId] = createDefaultFlagVisualState(sampleTick);
    }
}

// Ensures runtime capture state exists for a capture-point ObjId and tracks unmapped sightings.
function ensureCaptureState(objId: number): ConquestCapturePointRuntimeState {
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
    ensureFlagVisualState(objId, sampleTick);
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
function resetCaptureTimingConfigCache(): void {
    const keys = Object.keys(conquestPhase2ACaptureTimingConfiguredByObjId);
    for (let i = 0; i < keys.length; i++) {
        delete conquestPhase2ACaptureTimingConfiguredByObjId[Number(keys[i])];
    }
}

// Applies engine capture/neutralization timing to one capture point once per ObjId.
function configureCaptureTimingForPoint(capturePoint: mod.CapturePoint | undefined, objIdHint?: number): boolean {
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
function applyCaptureTimingForMappedPoints(): void {
    const ordered = getMappedConfigsInOrder();
    for (let i = 0; i < ordered.length; i++) {
        const objId = ordered[i].objId;
        let capturePoint: mod.CapturePoint | undefined;
        try {
            capturePoint = mod.GetCapturePoint(objId);
        } catch {
            capturePoint = undefined;
        }
        configureCaptureTimingForPoint(capturePoint, objId);
    }
}

// Resets conquest state for live start and seeds mapped capture state for Phase 2A.
function resetLiveState(): void {
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
    State.conquest.endRace.endLatched = false;
    State.conquest.endRace.endReason = undefined;
    State.conquest.endRace.endSnapshot = undefined;
    resetCaptureTimingConfigCache();
    buildMappedCaptureIndexFromConfig();
    applyCaptureTimingForMappedPoints();
    markHudDirty();
    mirrorTicketsToEngineScore();
    updateConquestCombatHudForAllPlayers();
}

// Resets conquest state for non-live phases while preserving config-derived mappings.
function resetNotLiveState(): void {
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
    resetCaptureTimingConfigCache();
    buildMappedCaptureIndexFromConfig();
    applyCaptureTimingForMappedPoints();
    markHudDirty();
    updateConquestCombatHudForAllPlayers();
}

// Mirrors authoritative script tickets into engine score projection.
function mirrorTicketsToEngineScore(): void {
    mod.SetGameModeScore(mod.GetTeam(TeamID.Team1), State.conquest.tickets.team1);
    mod.SetGameModeScore(mod.GetTeam(TeamID.Team2), State.conquest.tickets.team2);
}

// Counts currently owned mapped objectives per team (neutral/unmapped excluded).
function getOwnershipCounts(): { team1Owned: number; team2Owned: number } {
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
function applyTicketDelta(team: TeamID, delta: number): boolean {
    if (delta === 0) return false;
    const prev = team === TeamID.Team1 ? State.conquest.tickets.team1 : State.conquest.tickets.team2;
    const next = Math.max(0, Math.floor(prev + delta));
    if (next === prev) return false;
    if (team === TeamID.Team1) State.conquest.tickets.team1 = next;
    else State.conquest.tickets.team2 = next;
    markHudDirty();
    return true;
}

// Single-latch end transition owner for ticket/clock end reasons.
function tryLatchEnd(reason: "tickets" | "clock", winnerTeam: TeamID | 0): void {
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
function applyBleedTick(): void {
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

    const ownership = getOwnershipCounts();
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

    const changed = applyTicketDelta(losingTeam, -bleedUnits);
    if (changed) {
        mirrorTicketsToEngineScore();
    }
}

// Evaluates ticket-first end condition with clock fallback per CF-07/CF-60.
function checkEndCondition(): void {
    if (!isMatchLive()) return;
    if (State.conquest.endRace.endLatched) return;

    const team1Tickets = State.conquest.tickets.team1;
    const team2Tickets = State.conquest.tickets.team2;

    if (team1Tickets <= 0 || team2Tickets <= 0) {
        if (team1Tickets <= 0 && team2Tickets <= 0) {
            tryLatchEnd("tickets", 0);
            return;
        }
        if (team1Tickets <= 0) {
            tryLatchEnd("tickets", TeamID.Team2);
            return;
        }
        tryLatchEnd("tickets", TeamID.Team1);
        return;
    }

    if (getRemainingSeconds() > 0) return;
    if (team1Tickets === team2Tickets) {
        tryLatchEnd("clock", 0);
        return;
    }
    tryLatchEnd("clock", team1Tickets > team2Tickets ? TeamID.Team1 : TeamID.Team2);
}

// Ingests engine capture-point ownership/progress into authoritative capture runtime state.
// Engage membership is handled by capture-point enter/exit event handlers.
function onCapturePointTick(eventCapturePoint: mod.CapturePoint): void {
    if (!eventCapturePoint) return;
    const objId = safeGetObjId(eventCapturePoint);
    if (objId === undefined) return;
    configureCaptureTimingForPoint(eventCapturePoint, objId);

    const state = ensureCaptureState(objId);
    const prevMapped = state.mapped;
    const prevLabel = state.label;
    const prevOrder = state.order;
    const prevOwnerTeam = state.ownerTeam;
    const prevOwnerProgressTeam = state.ownerProgressTeam;
    const prevProgress01 = state.progress01;
    const prevOnPointTeam1 = state.onPointTeam1;
    const prevOnPointTeam2 = state.onPointTeam2;
    const visualSampleTick = Math.floor(mod.GetMatchTimeElapsed() * 10);
    const prevVisual = { ...ensureFlagVisualState(objId, visualSampleTick) };
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
        progress01 = clamp01(mod.GetCaptureProgress(eventCapturePoint));
    } catch {
        progress01 = 0;
    }

    let onPointTeam1 = 0;
    let onPointTeam2 = 0;
    try {
        const playersOnPoint = mod.GetPlayersOnPoint(eventCapturePoint);
        if (!playersOnPoint) throw new Error("no players array");
        const playerCount = mod.CountOf(playersOnPoint);
        for (let i = 0; i < playerCount; i++) {
            const pointPlayer = mod.ValueInArray(playersOnPoint, i) as mod.Player;
            if (!isValidPlayer(pointPlayer)) continue;
            const pointPid = safeGetPlayerId(pointPlayer);
            // pointPlayer from GetPlayersOnPoint is the live engine reference — no need
            // to re-lookup via safeFindPlayer(pid) + AllPlayers() iteration (BUG-A8 perf fix).
            const countablePlayer = pointPlayer;
            const resolvedPointTeam = safeGetTeamNumberFromPlayer(pointPlayer, 0);
            if (!shouldCountPlayerAsActiveOnPoint(countablePlayer)) continue;
            if (resolvedPointTeam === TeamID.Team1) onPointTeam1 += 1;
            if (resolvedPointTeam === TeamID.Team2) onPointTeam2 += 1;
        }
    } catch {
        onPointTeam1 = 0;
        onPointTeam2 = 0;
    }

    ownerTeam = resolveAuthoritativeOwnerTeam(
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
    const nextVisual = refreshFlagVisualState(state);
    const visualChanged = hasVisualStateChanged(prevVisual, nextVisual);
    if (state.mapped) {
        captureSoundOnCapturePointStateSample(
            objId,
            prevOwnerProgressTeam,
            prevProgress01,
            state.ownerProgressTeam,
            state.progress01
        );
        captureVoOnCapturePointStateSample(
            objId,
            state.ownerProgressTeam,
            state.progress01,
            state.onPointTeam1,
            state.onPointTeam2
        );
    }

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
        markHudDirty();
    }
}

/**
 * Resolves authoritative owner state for one capture point.
 * Priority:
 * 1) Before any edge events are seen, engine owner is accepted.
 * 2) After edge events are seen, owner is event-latched and only changed on explicit neutralization/recapture completion.
 * This prevents stale engine owner echoes from re-enabling owner border after neutralization.
 */
function resolveAuthoritativeOwnerTeam(
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
function onCapturePointLost(eventCapturePoint: mod.CapturePoint): void {
    if (!eventCapturePoint) return;
    const objId = safeGetObjId(eventCapturePoint);
    if (objId === undefined) return;
    configureCaptureTimingForPoint(eventCapturePoint, objId);

    const cp = ensureCaptureState(objId);
    const previousOwnerTeam = cp.ownerTeam;
    cp.ownerLatchedByEvent = true;
    cp.ownerTeam = 0;
    try {
        cp.ownerProgressTeam = getTeamNumber(mod.GetOwnerProgressTeam(eventCapturePoint));
    } catch {
        cp.ownerProgressTeam = 0;
    }
    try {
        cp.progress01 = clamp01(mod.GetCaptureProgress(eventCapturePoint));
    } catch {
        cp.progress01 = 0;
    }
    cp.lastUpdatedAtSeconds = Math.floor(mod.GetMatchTimeElapsed());

    const sampleTick = Math.floor(mod.GetMatchTimeElapsed() * 10);
    const visual = ensureFlagVisualState(objId, sampleTick);
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

    onCapturePointLostVoEdge(objId, previousOwnerTeam, cp.ownerProgressTeam);
    markHudDirty();
    updateConquestCombatHudForAllPlayers(true);
}

/**
 * Handles the engine ownership-acquired edge for a capture point.
 * This confirms recapture and releases neutralization owner-suppression.
 */
function onCapturePointCaptured(eventCapturePoint: mod.CapturePoint): void {
    if (!eventCapturePoint) return;
    const objId = safeGetObjId(eventCapturePoint);
    if (objId === undefined) return;
    configureCaptureTimingForPoint(eventCapturePoint, objId);

    const cp = ensureCaptureState(objId);
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
    const visual = ensureFlagVisualState(objId, sampleTick);
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

    onCapturePointCapturedVoEdge(objId, ownerTeam);
    markHudDirty();
    updateConquestCombatHudForAllPlayers(true);
}

/**
 * Pulls mapped capture-point state from engine each live tick.
 * Why this exists:
 * - OngoingCapturePoint callbacks can miss the exact neutralization-edge sample on some clients.
 * - If that final sample is missed, the previous contested frame can keep an old owner border visible.
 * - Live polling guarantees the visual FSM receives authoritative owner/progress updates at least once per tick.
 */
function syncMappedCapturePointsFromEngine(): void {
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
        onCapturePointTick(cp);
    }
    const nextEngagedByPid = State.conquest.capture.engagedObjIdByPid;

    const previousKeys = Object.keys(previousEngagedByPid);
    const nextKeys = Object.keys(nextEngagedByPid);
    if (previousKeys.length !== nextKeys.length) {
        markHudDirty();
        return;
    }
    for (let i = 0; i < nextKeys.length; i++) {
        const pid = Number(nextKeys[i]);
        if (previousEngagedByPid[pid] !== nextEngagedByPid[pid]) {
            markHudDirty();
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

// Central combat HUD dispatcher.
// In core mode, the new TwlConquestHud pipeline is the only active combat render owner.
// Legacy/off branches remain here temporarily as cleanup-bridge compatibility until deletion phase.
function updateConquestCombatHudForAllPlayers(force?: boolean): void {
    const hudMode = getConquestHudMode();
    // Clock VM + derived top-HUD slices are time-variant; they must refresh every tick
    // regardless of combat-HUD dirtiness so the clock color flip / countdown never freezes.
    refreshTopHudDerivedSlicesForAllPlayers();
    if (hudMode === "off") {
        twlConquestHudHideAllPlayers();
        State.conquest.debug.hudDirty = false;
        return;
    }
    try {
        // Gate the expensive per-player combat-HUD write-through on hudDirty||force.
        // Dirty flag is set by markHudDirty() from every state mutation
        // that affects the combat HUD projection. See AGENTS.md "Combat HUD Dirty-Flag
        // Contract" for the complete list of fields that must mark dirty on mutation.
        const shouldRunFrame = !!force || State.conquest.debug.hudDirty;
        if (shouldRunFrame) {
            twlConquestHudTickFrame(force);
            State.conquest.debug.hudDirty = false;
        }
        // Animation cadence is time-variant (lerps/fades over real time) — never gate.
        twlConquestHudTickAnimation(force);
    } catch {
        // HUD core is optional for gameplay; reset cadence and let next tick recover without global hide flash.
        twlConquestHudResetSchedulerState();
    }
    if (force) {
        State.conquest.debug.hudLastUpdatedAtSeconds = Math.floor(mod.GetMatchTimeElapsed());
    }
}

// Runs sub-second live capture synchronization so dynamic HUD elements do not strobe on second boundaries.
function refreshLiveCaptureStateSubtick(): void {
    clearInactiveEngagedObjectiveOwners();
    // Keep capture-state authoritative even if event-driven capture callbacks miss a transition frame.
    syncMappedCapturePointsFromEngine();
}

// Phase 2A second-boundary tick owner: bleed, end checks, then combat HUD refresh.
function onLiveTick(): void {
    applyBleedTick();
    checkEndCondition();
    updateConquestCombatHudForAllPlayers();
    // Re-assert deploy timer HUD visibility every second so transient suppression self-heals.
    updateVehicleDeployTimerHudForAllPlayers();
}

