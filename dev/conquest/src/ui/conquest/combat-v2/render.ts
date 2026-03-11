// @ts-nocheck
// Module: ui/conquest/combat-v2/render -- value/visibility-only render owner for combat HUD v2

// Renders combat-v2 ticket lane values, fills, leader indicators, and bleed chevrons for one player entry.
function renderConquestCombatHudV2TicketsForPid(
    pid: number,
    entry: ConquestCombatHudV2PlayerEntry
): void {
    const viewer = safeFindPlayer(pid);
    const viewerTeam = viewer && mod.IsPlayerValid(viewer)
        ? safeGetTeamNumberFromPlayer(viewer, TeamID.Team1)
        : TeamID.Team1;
    const friendlyTeam = viewerTeam === TeamID.Team2 ? TeamID.Team2 : TeamID.Team1;
    const enemyTeam = friendlyTeam === TeamID.Team1 ? TeamID.Team2 : TeamID.Team1;

    const friendlyTickets = friendlyTeam === TeamID.Team1
        ? State.conquest.tickets.team1
        : State.conquest.tickets.team2;
    const enemyTickets = enemyTeam === TeamID.Team1
        ? State.conquest.tickets.team1
        : State.conquest.tickets.team2;

    const total = Math.max(1, friendlyTickets + enemyTickets);
    const friendlyRatio = Math.max(0, Math.min(1, friendlyTickets / total));
    const enemyRatio = Math.max(0, Math.min(1, enemyTickets / total));
    const leftTrackWidth = CONQUEST_COMBAT_HUD_V2_TICKETS_LAYOUT.leftBarTrack.width;
    const rightTrackWidth = CONQUEST_COMBAT_HUD_V2_TICKETS_LAYOUT.rightBarTrack.width;
    const bleedLeftChevrons = entry.widgets.ticketsBleedLeftChevrons ?? [];
    const bleedRightChevrons = entry.widgets.ticketsBleedRightChevrons ?? [];
    const friendlyWidth = Math.max(0, Math.min(leftTrackWidth, Math.floor(leftTrackWidth * friendlyRatio)));
    const enemyWidth = Math.max(0, Math.min(rightTrackWidth, Math.floor(rightTrackWidth * enemyRatio)));

    safeSetUIWidgetVisible(entry.widgets.ticketsLeftBarTrack, true);
    safeSetUIWidgetVisible(entry.widgets.ticketsLeftBarFill, true);
    safeSetUIWidgetVisible(entry.widgets.ticketsRightBarTrack, true);
    safeSetUIWidgetVisible(entry.widgets.ticketsRightBarFill, true);
    safeSetUIWidgetVisible(entry.widgets.ticketsFriendlyText, true);
    safeSetUIWidgetVisible(entry.widgets.ticketsEnemyText, true);
    safeSetUIWidgetVisible(entry.widgets.ticketsSlashText, true);
    safeSetUIWidgetVisible(entry.widgets.ticketsLeadBorderLeft, false);
    safeSetUIWidgetVisible(entry.widgets.ticketsLeadBorderRight, false);
    for (let index = 0; index < CONQUEST_COMBAT_HUD_V2_TICKETS_LAYOUT.bleedChevron.count; index++) {
        safeSetUIWidgetVisible(bleedLeftChevrons[index], false);
        safeSetUIWidgetVisible(bleedRightChevrons[index], false);
    }

    safeSetUIWidgetSize(
        entry.widgets.ticketsLeftBarFill,
        mod.CreateVector(friendlyWidth, CONQUEST_COMBAT_HUD_V2_TICKETS_LAYOUT.leftBarTrack.height, 0)
    );
    safeSetUIWidgetPosition(
        entry.widgets.ticketsRightBarFill,
        mod.CreateVector(rightTrackWidth - enemyWidth, 0, 0)
    );
    safeSetUIWidgetSize(
        entry.widgets.ticketsRightBarFill,
        mod.CreateVector(enemyWidth, CONQUEST_COMBAT_HUD_V2_TICKETS_LAYOUT.rightBarTrack.height, 0)
    );

    safeSetUITextLabel(
        entry.widgets.ticketsFriendlyText,
        mod.Message(mod.stringkeys.twl.system.genericCounter, Math.max(0, Math.floor(friendlyTickets)))
    );
    safeSetUITextLabel(
        entry.widgets.ticketsEnemyText,
        mod.Message(mod.stringkeys.twl.system.genericCounter, Math.max(0, Math.floor(enemyTickets)))
    );
    safeSetUITextColor(entry.widgets.ticketsFriendlyText, COLOR_BLUE);
    safeSetUITextColor(entry.widgets.ticketsEnemyText, COLOR_RED);

    if (friendlyTickets > enemyTickets) {
        safeSetUIWidgetVisible(entry.widgets.ticketsLeadBorderLeft, true);
        safeSetUIWidgetBgColor(
            entry.widgets.ticketsLeadBorderLeft,
            mod.CreateVector(
                CONQUEST_HUD_TEXT_FRIENDLY_RGB[0],
                CONQUEST_HUD_TEXT_FRIENDLY_RGB[1],
                CONQUEST_HUD_TEXT_FRIENDLY_RGB[2]
            )
        );
    } else if (enemyTickets > friendlyTickets) {
        safeSetUIWidgetVisible(entry.widgets.ticketsLeadBorderRight, true);
        safeSetUIWidgetBgColor(
            entry.widgets.ticketsLeadBorderRight,
            mod.CreateVector(
                CONQUEST_HUD_TEXT_ENEMY_RGB[0],
                CONQUEST_HUD_TEXT_ENEMY_RGB[1],
                CONQUEST_HUD_TEXT_ENEMY_RGB[2]
            )
        );
    }

    const bleedCounts = conquestPhase3GetBleedChevronCountsForPerspective(friendlyTeam, enemyTeam);
    const leftCount = Math.max(
        0,
        Math.min(CONQUEST_COMBAT_HUD_V2_TICKETS_LAYOUT.bleedChevron.count, Math.floor(bleedCounts.leftCount))
    );
    const rightCount = Math.max(
        0,
        Math.min(CONQUEST_COMBAT_HUD_V2_TICKETS_LAYOUT.bleedChevron.count, Math.floor(bleedCounts.rightCount))
    );
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
    for (let index = 0; index < CONQUEST_COMBAT_HUD_V2_TICKETS_LAYOUT.bleedChevron.count; index++) {
        const leftChevron = bleedLeftChevrons[index];
        const rightChevron = bleedRightChevrons[index];
        const leftVisible = index < leftCount;
        const rightVisible = index < rightCount;
        safeSetUIWidgetVisible(leftChevron, leftVisible);
        safeSetUIWidgetVisible(rightChevron, rightVisible);
        if (leftVisible) {
            safeSetUITextLabel(leftChevron, mod.Message(STR_HUD_CONQUEST_BLEED_CHEVRON_LEFT));
            safeSetUITextColor(leftChevron, friendlyChevronColor);
        }
        if (rightVisible) {
            safeSetUITextLabel(rightChevron, mod.Message(STR_HUD_CONQUEST_BLEED_CHEVRON_RIGHT));
            safeSetUITextColor(rightChevron, enemyChevronColor);
        }
    }
}

// Returns viewer perspective teams for one player id.
function getConquestCombatHudV2ViewerPerspectiveTeams(pid: number): { friendlyTeam: TeamID; enemyTeam: TeamID } {
    const viewer = safeFindPlayer(pid);
    const viewerTeam = viewer && mod.IsPlayerValid(viewer)
        ? safeGetTeamNumberFromPlayer(viewer, TeamID.Team1)
        : TeamID.Team1;
    const friendlyTeam = viewerTeam === TeamID.Team2 ? TeamID.Team2 : TeamID.Team1;
    const enemyTeam = friendlyTeam === TeamID.Team1 ? TeamID.Team2 : TeamID.Team1;
    return { friendlyTeam, enemyTeam };
}

// Resolves a flag-letter key from mapped config label fallback order.
function getConquestCombatHudV2FlagLetterKey(cp: ConquestCapturePointRuntimeState | undefined, rowIndex: number): number {
    const rawLabel = (cp?.label ?? "").toUpperCase();
    if (rawLabel === "A") return STR_HUD_CONQUEST_FLAG_LETTER_A;
    if (rawLabel === "B") return STR_HUD_CONQUEST_FLAG_LETTER_B;
    if (rawLabel === "C") return STR_HUD_CONQUEST_FLAG_LETTER_C;
    if (rawLabel === "D") return STR_HUD_CONQUEST_FLAG_LETTER_D;
    if (rawLabel === "E") return STR_HUD_CONQUEST_FLAG_LETTER_E;
    if (rawLabel === "F") return STR_HUD_CONQUEST_FLAG_LETTER_F;
    if (rawLabel === "G") return STR_HUD_CONQUEST_FLAG_LETTER_G;
    if (rowIndex === 0) return STR_HUD_CONQUEST_FLAG_LETTER_A;
    if (rowIndex === 1) return STR_HUD_CONQUEST_FLAG_LETTER_B;
    if (rowIndex === 2) return STR_HUD_CONQUEST_FLAG_LETTER_C;
    if (rowIndex === 3) return STR_HUD_CONQUEST_FLAG_LETTER_D;
    if (rowIndex === 4) return STR_HUD_CONQUEST_FLAG_LETTER_E;
    if (rowIndex === 5) return STR_HUD_CONQUEST_FLAG_LETTER_F;
    if (rowIndex === 6) return STR_HUD_CONQUEST_FLAG_LETTER_G;
    return STR_HUD_CONQUEST_FLAG_LETTER_UNKNOWN;
}

// Returns centered slot indices for visible flag count.
function getConquestCombatHudV2CenteredFlagSlots(visibleCount: number): number[] {
    const clamped = Math.max(0, Math.min(visibleCount, CONQUEST_COMBAT_HUD_V2_FLAGS_LAYOUT.slotCount));
    const start = Math.floor((CONQUEST_COMBAT_HUD_V2_FLAGS_LAYOUT.slotCount - clamped) / 2);
    const slots: number[] = [];
    for (let i = 0; i < clamped; i++) {
        slots.push(start + i);
    }
    return slots;
}

// Returns the engaged objective id only when player-level render gates allow active objective UI.
function getConquestCombatHudV2RenderableActiveObjIdForPid(pid: number): number | undefined {
    if (!State.players.deployedByPid[pid]) return undefined;
    if (State.conquest.debug.teamSwapHudResetPendingByPid[pid] === true) return undefined;
    return State.conquest.capture.engagedObjIdByPid[pid];
}

// Returns one mapped-row index for an objective id, or -1 when missing.
function getConquestCombatHudV2MappedRowIndex(objId: number): number {
    const mappedObjIds = State.conquest.capture.mappedObjIdsInOrder;
    for (let i = 0; i < mappedObjIds.length; i++) {
        if (mappedObjIds[i] === objId) return i;
    }
    return -1;
}

// Resolves owner-state color for one objective team from viewer perspective.
function getConquestCombatHudV2OwnerColor(
    ownerTeam: TeamID | 0,
    perspective: { friendlyTeam: TeamID; enemyTeam: TeamID; }
): mod.Vector {
    if (ownerTeam === perspective.friendlyTeam) {
        return mod.CreateVector(
            CONQUEST_HUD_FLAG_SLOT_FRIENDLY_FILL_RGB[0],
            CONQUEST_HUD_FLAG_SLOT_FRIENDLY_FILL_RGB[1],
            CONQUEST_HUD_FLAG_SLOT_FRIENDLY_FILL_RGB[2]
        );
    }
    if (ownerTeam === perspective.enemyTeam) {
        return mod.CreateVector(
            CONQUEST_HUD_FLAG_SLOT_ENEMY_FILL_RGB[0],
            CONQUEST_HUD_FLAG_SLOT_ENEMY_FILL_RGB[1],
            CONQUEST_HUD_FLAG_SLOT_ENEMY_FILL_RGB[2]
        );
    }
    return mod.CreateVector(
        CONQUEST_HUD_FLAG_SLOT_TRACK_RGB[0],
        CONQUEST_HUD_FLAG_SLOT_TRACK_RGB[1],
        CONQUEST_HUD_FLAG_SLOT_TRACK_RGB[2]
    );
}

// Resolves progress-state fill color for one objective team from viewer perspective.
function getConquestCombatHudV2ProgressColor(
    progressTeam: TeamID | 0,
    perspective: { friendlyTeam: TeamID; enemyTeam: TeamID; }
): mod.Vector {
    if (progressTeam === perspective.friendlyTeam) {
        return mod.CreateVector(
            CONQUEST_HUD_FLAG_SLOT_FRIENDLY_FILL_RGB[0],
            CONQUEST_HUD_FLAG_SLOT_FRIENDLY_FILL_RGB[1],
            CONQUEST_HUD_FLAG_SLOT_FRIENDLY_FILL_RGB[2]
        );
    }
    if (progressTeam === perspective.enemyTeam) {
        return mod.CreateVector(
            CONQUEST_HUD_FLAG_SLOT_ENEMY_FILL_RGB[0],
            CONQUEST_HUD_FLAG_SLOT_ENEMY_FILL_RGB[1],
            CONQUEST_HUD_FLAG_SLOT_ENEMY_FILL_RGB[2]
        );
    }
    return mod.CreateVector(
        CONQUEST_HUD_FLAG_SLOT_TRACK_RGB[0],
        CONQUEST_HUD_FLAG_SLOT_TRACK_RGB[1],
        CONQUEST_HUD_FLAG_SLOT_TRACK_RGB[2]
    );
}

// Hides active-popout widgets for one player entry.
function hideConquestCombatHudV2ActivePopoutForPid(entry: ConquestCombatHudV2PlayerEntry): void {
    safeSetUIWidgetVisible(entry.widgets.activePopoutPercent, false);
    safeSetUIWidgetVisible(entry.widgets.activePopoutLabel, false);
    safeSetUIWidgetVisible(entry.widgets.activePopoutFill, false);
    safeSetUIWidgetVisible(entry.widgets.activePopoutSlot, false);
    safeSetUIWidgetVisible(entry.widgets.activePopoutRoot, false);
}

// Renders combat-v2 active-objective popout values for one player entry.
function renderConquestCombatHudV2ActivePopoutForPid(
    pid: number,
    entry: ConquestCombatHudV2PlayerEntry
): void {
    const popoutRoot = entry.widgets.activePopoutRoot;
    const popoutSlot = entry.widgets.activePopoutSlot;
    const popoutFill = entry.widgets.activePopoutFill;
    const popoutLabel = entry.widgets.activePopoutLabel;
    const popoutPercent = entry.widgets.activePopoutPercent;
    if (!popoutRoot || !popoutSlot || !popoutFill || !popoutLabel || !popoutPercent) {
        hideConquestCombatHudV2ActivePopoutForPid(entry);
        return;
    }

    const activeObjId = getConquestCombatHudV2RenderableActiveObjIdForPid(pid);
    if (activeObjId === undefined) {
        hideConquestCombatHudV2ActivePopoutForPid(entry);
        return;
    }

    const cp = State.conquest.capture.byObjId[activeObjId];
    if (!cp || !cp.mapped) {
        hideConquestCombatHudV2ActivePopoutForPid(entry);
        return;
    }

    const perspective = getConquestCombatHudV2ViewerPerspectiveTeams(pid);
    const ownerTeam = cp.ownerTeam;
    const progressTeam = cp.ownerProgressTeam !== 0 ? cp.ownerProgressTeam : ownerTeam;
    const progress01Raw = ownerTeam !== 0 && cp.ownerProgressTeam === 0
        ? 1
        : cp.progress01;
    const progress01 = Math.max(0, Math.min(1, progress01Raw));
    const fillHeight = Math.max(
        0,
        Math.min(
            CONQUEST_HUD_FLAG_ACTIVE_POPOUT_FILL_MAX_HEIGHT,
            Math.floor(CONQUEST_HUD_FLAG_ACTIVE_POPOUT_FILL_MAX_HEIGHT * progress01)
        )
    );
    const fillFromTop = progressTeam === perspective.enemyTeam;
    const fillY = fillFromTop
        ? CONQUEST_HUD_FLAG_ACTIVE_POPOUT_FILL_INSET_Y
        : CONQUEST_HUD_FLAG_ACTIVE_POPOUT_FILL_INSET_Y + (CONQUEST_HUD_FLAG_ACTIVE_POPOUT_FILL_MAX_HEIGHT - fillHeight);
    const fillColor = getConquestCombatHudV2ProgressColor(progressTeam, perspective);
    const labelColor = ownerTeam === perspective.friendlyTeam
        ? COLOR_BLUE
        : ownerTeam === perspective.enemyTeam
            ? COLOR_RED
            : COLOR_WHITE;
    const rowIndex = getConquestCombatHudV2MappedRowIndex(activeObjId);
    const labelKey = getConquestCombatHudV2FlagLetterKey(cp, rowIndex >= 0 ? rowIndex : 0);
    const fullyOwned = ownerTeam !== 0 && cp.ownerProgressTeam === 0;
    const percentVisible = !fullyOwned && fillHeight > 0;
    const percentValue = fullyOwned
        ? 100
        : Math.min(99, Math.max(0, Math.round(progress01 * 100)));

    safeSetUIWidgetVisible(popoutRoot, true);
    safeSetUIWidgetVisible(popoutSlot, true);
    safeSetUIWidgetVisible(popoutLabel, true);
    safeSetUIWidgetVisible(popoutFill, fillHeight > 0);
    safeSetUIWidgetVisible(popoutPercent, percentVisible);
    safeSetUIWidgetBgColor(popoutSlot, getConquestCombatHudV2OwnerColor(ownerTeam, perspective));
    safeSetUIWidgetBgColor(popoutFill, fillColor);
    safeSetUIWidgetPosition(popoutFill, mod.CreateVector(CONQUEST_HUD_FLAG_ACTIVE_POPOUT_FILL_INSET_X, fillY, 0));
    safeSetUIWidgetSize(popoutFill, mod.CreateVector(CONQUEST_HUD_FLAG_ACTIVE_POPOUT_FILL_MAX_WIDTH, fillHeight, 0));
    safeSetUITextLabel(popoutLabel, mod.Message(labelKey));
    safeSetUITextColor(popoutLabel, labelColor);
    safeSetUITextLabel(popoutPercent, mod.Message(STR_SYSTEM_GENERIC_PERCENT, percentValue));
    safeSetUITextColor(popoutPercent, labelColor);
}

// Returns engage-panel status key from owner + on-point differential.
function getConquestCombatHudV2EngageStatusKey(
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

// Hides engage-panel widgets for one player entry.
function hideConquestCombatHudV2EngageForPid(entry: ConquestCombatHudV2PlayerEntry): void {
    safeSetUIWidgetVisible(entry.widgets.engageStatus, false);
    safeSetUIWidgetVisible(entry.widgets.engageEnemyCount, false);
    safeSetUIWidgetVisible(entry.widgets.engageFriendlyCount, false);
    safeSetUIWidgetVisible(entry.widgets.engageEnemyFill, false);
    safeSetUIWidgetVisible(entry.widgets.engageFriendlyFill, false);
    safeSetUIWidgetVisible(entry.widgets.engageTrack, false);
    safeSetUIWidgetVisible(entry.widgets.engageRoot, false);
}

// Renders combat-v2 active-objective engage values for one player entry.
function renderConquestCombatHudV2EngageForPid(
    pid: number,
    entry: ConquestCombatHudV2PlayerEntry
): void {
    const engageRoot = entry.widgets.engageRoot;
    const engageTrack = entry.widgets.engageTrack;
    const friendlyFill = entry.widgets.engageFriendlyFill;
    const enemyFill = entry.widgets.engageEnemyFill;
    const friendlyCountText = entry.widgets.engageFriendlyCount;
    const enemyCountText = entry.widgets.engageEnemyCount;
    const statusText = entry.widgets.engageStatus;
    if (
        !engageRoot
        || !engageTrack
        || !friendlyFill
        || !enemyFill
        || !friendlyCountText
        || !enemyCountText
        || !statusText
    ) {
        hideConquestCombatHudV2EngageForPid(entry);
        return;
    }

    const activeObjId = getConquestCombatHudV2RenderableActiveObjIdForPid(pid);
    if (activeObjId === undefined) {
        hideConquestCombatHudV2EngageForPid(entry);
        return;
    }

    const cp = State.conquest.capture.byObjId[activeObjId];
    if (!cp || !cp.mapped) {
        hideConquestCombatHudV2EngageForPid(entry);
        return;
    }

    const perspective = getConquestCombatHudV2ViewerPerspectiveTeams(pid);
    const friendlyCount = perspective.friendlyTeam === TeamID.Team1
        ? cp.onPointTeam1
        : cp.onPointTeam2;
    const enemyCount = perspective.enemyTeam === TeamID.Team1
        ? cp.onPointTeam1
        : cp.onPointTeam2;
    const total = friendlyCount + enemyCount;
    if (friendlyCount <= 0 || total <= 0) {
        hideConquestCombatHudV2EngageForPid(entry);
        return;
    }

    const fullTrackWidth = Math.max(1, Math.floor(CONQUEST_COMBAT_HUD_V2_ENGAGE_LAYOUT.track.width));
    const friendlyRatio = Math.max(0, Math.min(1, friendlyCount / Math.max(1, total)));
    let friendlyWidth = friendlyCount <= 0
        ? 0
        : Math.max(1, Math.floor(fullTrackWidth * friendlyRatio));
    if (friendlyWidth > fullTrackWidth) friendlyWidth = fullTrackWidth;
    let enemyWidth = fullTrackWidth - friendlyWidth;
    if (enemyCount > 0 && enemyWidth <= 0) {
        enemyWidth = 1;
        friendlyWidth = Math.max(0, fullTrackWidth - 1);
    }

    safeSetUIWidgetVisible(engageRoot, true);
    safeSetUIWidgetVisible(engageTrack, true);
    safeSetUIWidgetVisible(friendlyCountText, true);
    safeSetUIWidgetVisible(enemyCountText, true);
    safeSetUIWidgetVisible(statusText, true);
    safeSetUIWidgetVisible(friendlyFill, friendlyWidth > 0);
    safeSetUIWidgetVisible(enemyFill, enemyWidth > 0);
    safeSetUIWidgetBgColor(
        engageTrack,
        mod.CreateVector(
            CONQUEST_HUD_FLAG_ENGAGE_TRACK_RGB[0],
            CONQUEST_HUD_FLAG_ENGAGE_TRACK_RGB[1],
            CONQUEST_HUD_FLAG_ENGAGE_TRACK_RGB[2]
        )
    );
    safeSetUITextLabel(friendlyCountText, mod.Message(mod.stringkeys.twl.system.genericCounter, friendlyCount));
    safeSetUITextLabel(enemyCountText, mod.Message(mod.stringkeys.twl.system.genericCounter, enemyCount));
    safeSetUITextColor(friendlyCountText, COLOR_BLUE);
    safeSetUITextColor(enemyCountText, COLOR_RED);
    safeSetUITextLabel(
        statusText,
        mod.Message(getConquestCombatHudV2EngageStatusKey(cp.ownerTeam, perspective.friendlyTeam, friendlyCount, enemyCount))
    );
    safeSetUITextColor(statusText, COLOR_WHITE);

    if (friendlyWidth > 0) {
        safeSetUIWidgetPosition(friendlyFill, mod.CreateVector(0, 0, 0));
        safeSetUIWidgetSize(friendlyFill, mod.CreateVector(friendlyWidth, CONQUEST_COMBAT_HUD_V2_ENGAGE_LAYOUT.track.height, 0));
        safeSetUIWidgetBgColor(
            friendlyFill,
            mod.CreateVector(
                CONQUEST_HUD_TICKET_BAR_FRIENDLY_FILL_RGB[0],
                CONQUEST_HUD_TICKET_BAR_FRIENDLY_FILL_RGB[1],
                CONQUEST_HUD_TICKET_BAR_FRIENDLY_FILL_RGB[2]
            )
        );
    }
    if (enemyWidth > 0) {
        safeSetUIWidgetPosition(enemyFill, mod.CreateVector(friendlyWidth, 0, 0));
        safeSetUIWidgetSize(enemyFill, mod.CreateVector(enemyWidth, CONQUEST_COMBAT_HUD_V2_ENGAGE_LAYOUT.track.height, 0));
        safeSetUIWidgetBgColor(
            enemyFill,
            mod.CreateVector(
                CONQUEST_HUD_TICKET_BAR_ENEMY_FILL_RGB[0],
                CONQUEST_HUD_TICKET_BAR_ENEMY_FILL_RGB[1],
                CONQUEST_HUD_TICKET_BAR_ENEMY_FILL_RGB[2]
            )
        );
    }
}

// Renders combat-v2 flag lane values (slot colors, labels, and basic fill projection) for one player entry.
function renderConquestCombatHudV2FlagsForPid(
    pid: number,
    entry: ConquestCombatHudV2PlayerEntry
): void {
    const slotRoots = entry.widgets.flagsSlotRoots ?? [];
    const slotFills = entry.widgets.flagsSlotFills ?? [];
    const slotLabels = entry.widgets.flagsSlotLabels ?? [];
    const maxSlots = CONQUEST_COMBAT_HUD_V2_FLAGS_LAYOUT.slotCount;
    for (let slot = 0; slot < maxSlots; slot++) {
        safeSetUIWidgetVisible(slotRoots[slot], false);
        safeSetUIWidgetVisible(slotFills[slot], false);
        safeSetUIWidgetVisible(slotLabels[slot], false);
    }

    const mappedObjIds = State.conquest.capture.mappedObjIdsInOrder;
    const visibleCount = Math.max(0, Math.min(mappedObjIds.length, maxSlots));
    const centeredSlots = getConquestCombatHudV2CenteredFlagSlots(visibleCount);
    const perspective = getConquestCombatHudV2ViewerPerspectiveTeams(pid);
    const activeObjId = getConquestCombatHudV2RenderableActiveObjIdForPid(pid);

    for (let row = 0; row < visibleCount; row++) {
        const slotIndex = centeredSlots[row];
        const slotRoot = slotRoots[slotIndex];
        const slotFill = slotFills[slotIndex];
        const slotLabel = slotLabels[slotIndex];
        const cp = State.conquest.capture.byObjId[mappedObjIds[row]];
        if (!slotRoot || !slotFill || !slotLabel || !cp) continue;

        const ownerTeam = cp.ownerTeam;
        const progressTeam = cp.ownerProgressTeam !== 0 ? cp.ownerProgressTeam : ownerTeam;
        const progress01Raw = (ownerTeam !== 0 && cp.ownerProgressTeam === 0) ? 1 : cp.progress01;
        const progress01 = Math.max(0, Math.min(1, progress01Raw));
        const fillHeight = Math.floor(CONQUEST_COMBAT_HUD_V2_FLAGS_LAYOUT.fillMaxHeight * progress01);
        const fillColor = progressTeam === perspective.friendlyTeam
            ? mod.CreateVector(
                CONQUEST_HUD_FLAG_SLOT_FRIENDLY_FILL_RGB[0],
                CONQUEST_HUD_FLAG_SLOT_FRIENDLY_FILL_RGB[1],
                CONQUEST_HUD_FLAG_SLOT_FRIENDLY_FILL_RGB[2]
            )
            : progressTeam === perspective.enemyTeam
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
        const labelColor = ownerTeam === perspective.friendlyTeam
            ? COLOR_BLUE
            : ownerTeam === perspective.enemyTeam
                ? COLOR_RED
                : COLOR_WHITE;
        const fillY = CONQUEST_COMBAT_HUD_V2_FLAGS_LAYOUT.fillInsetY
            + (CONQUEST_COMBAT_HUD_V2_FLAGS_LAYOUT.fillMaxHeight - fillHeight);

        safeSetUIWidgetVisible(slotRoot, true);
        safeSetUIWidgetVisible(slotLabel, true);
        safeSetUIWidgetVisible(slotFill, fillHeight > 0);
        safeSetUIWidgetBgColor(
            slotRoot,
            mod.CreateVector(
                CONQUEST_HUD_FLAG_SLOT_TRACK_RGB[0],
                CONQUEST_HUD_FLAG_SLOT_TRACK_RGB[1],
                CONQUEST_HUD_FLAG_SLOT_TRACK_RGB[2]
            )
        );
        safeSetUIWidgetBgColor(slotFill, fillColor);
        safeSetUIWidgetPosition(
            slotFill,
            mod.CreateVector(CONQUEST_COMBAT_HUD_V2_FLAGS_LAYOUT.fillInsetX, fillY, 0)
        );
        safeSetUIWidgetSize(
            slotFill,
            mod.CreateVector(CONQUEST_COMBAT_HUD_V2_FLAGS_LAYOUT.fillMaxWidth, fillHeight, 0)
        );
        safeSetUITextLabel(slotLabel, mod.Message(getConquestCombatHudV2FlagLetterKey(cp, row)));
        safeSetUITextColor(slotLabel, labelColor);

        if (activeObjId !== undefined && cp.objId === activeObjId) {
            safeSetUIWidgetVisible(slotFill, false);
            safeSetUIWidgetVisible(slotLabel, false);
            safeSetUIWidgetBgColor(slotRoot, getConquestCombatHudV2OwnerColor(ownerTeam, perspective));
        }
    }
}

// Runs one combat HUD v2 main render pass for a player entry.
function renderConquestCombatHudV2ForPid(pid: number, nowSeconds: number): void {
    const entry = getConquestCombatHudV2Entry(pid);
    if (!entry) return;
    if (entry.teamSwapPending) {
        hideConquestCombatHudV2ForPid(pid);
        return;
    }

    // Static lane ownership for v2 root chain:
    // render writes visibility only; build/repair owns parent/anchor/position.
    safeSetUIWidgetVisible(entry.widgets.combatRoot, true);
    safeSetUIWidgetVisible(entry.widgets.ticketsRoot, true);
    safeSetUIWidgetVisible(entry.widgets.flagsRoot, true);
    renderConquestCombatHudV2TicketsForPid(pid, entry);
    renderConquestCombatHudV2FlagsForPid(pid, entry);
    renderConquestCombatHudV2ActivePopoutForPid(pid, entry);
    renderConquestCombatHudV2EngageForPid(pid, entry);

    entry.dirty = false;
    entry.telemetry.mainUpdates = entry.telemetry.mainUpdates + 1;
    entry.telemetry.lastMainUpdateAtSeconds = nowSeconds;
}

// Runs one combat HUD v2 animation render pass for a player entry.
function renderConquestCombatHudV2AnimationForPid(pid: number, nowSeconds: number): void {
    const entry = getConquestCombatHudV2Entry(pid);
    if (!entry) return;
    if (entry.teamSwapPending) return;
    if (!entry.animationDirty) return;

    // No animated elements are active in this slice; keep telemetry path explicit.
    entry.animationDirty = false;
    entry.telemetry.animationUpdates = entry.telemetry.animationUpdates + 1;
    entry.telemetry.lastAnimationUpdateAtSeconds = nowSeconds;
}

// Returns true when a widget has the expected direct parent handle.
function conquestCombatHudV2WidgetHasParentHandle(
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

// Returns true when widget anchor matches the expected value.
function conquestCombatHudV2WidgetHasAnchor(
    widget: mod.UIWidget | undefined,
    anchor: mod.UIAnchor
): boolean {
    if (!widget) return false;
    try {
        return mod.GetUIWidgetAnchor(widget) === anchor;
    } catch {
        return false;
    }
}

// Returns true when widget XY position is within tolerance of expected local coordinates.
function conquestCombatHudV2WidgetHasPositionXY(
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

// Returns true when core v2 refs are present and rooted under the centered parent-chain contract.
function hasConquestCombatHudV2CriticalRefs(entry: ConquestCombatHudV2PlayerEntry): boolean {
    const topHudRoot = entry.widgets.topHudRoot;
    const combatRoot = entry.widgets.combatRoot;
    const ticketsRoot = entry.widgets.ticketsRoot;
    const flagsRoot = entry.widgets.flagsRoot;
    const ticketsLeftBarTrack = entry.widgets.ticketsLeftBarTrack;
    const ticketsLeftBarFill = entry.widgets.ticketsLeftBarFill;
    const ticketsRightBarTrack = entry.widgets.ticketsRightBarTrack;
    const ticketsRightBarFill = entry.widgets.ticketsRightBarFill;
    const ticketsFriendlyText = entry.widgets.ticketsFriendlyText;
    const ticketsEnemyText = entry.widgets.ticketsEnemyText;
    const ticketsSlashText = entry.widgets.ticketsSlashText;

    if (
        !topHudRoot
        || !combatRoot
        || !ticketsRoot
        || !flagsRoot
        || !ticketsLeftBarTrack
        || !ticketsLeftBarFill
        || !ticketsRightBarTrack
        || !ticketsRightBarFill
        || !ticketsFriendlyText
        || !ticketsEnemyText
        || !ticketsSlashText
    ) {
        return false;
    }

    const uiRoot = mod.GetUIRoot();
    if (!conquestCombatHudV2WidgetHasParentHandle(topHudRoot, uiRoot)) return false;
    if (!conquestCombatHudV2WidgetHasAnchor(topHudRoot, mod.UIAnchor.TopCenter)) return false;
    if (!conquestCombatHudV2WidgetHasPositionXY(topHudRoot, 0, 0)) return false;

    if (!conquestCombatHudV2WidgetHasParentHandle(combatRoot, topHudRoot)) return false;
    if (!conquestCombatHudV2WidgetHasAnchor(combatRoot, CONQUEST_COMBAT_HUD_V2_LAYOUT.root.anchor)) return false;
    if (!conquestCombatHudV2WidgetHasPositionXY(combatRoot, CONQUEST_COMBAT_HUD_V2_LAYOUT.root.x, CONQUEST_COMBAT_HUD_V2_LAYOUT.root.y)) return false;

    if (!conquestCombatHudV2WidgetHasParentHandle(ticketsRoot, combatRoot)) return false;
    if (!conquestCombatHudV2WidgetHasAnchor(ticketsRoot, CONQUEST_COMBAT_HUD_V2_LAYOUT.ticketsLane.anchor)) return false;
    if (!conquestCombatHudV2WidgetHasPositionXY(ticketsRoot, CONQUEST_COMBAT_HUD_V2_LAYOUT.ticketsLane.x, CONQUEST_COMBAT_HUD_V2_LAYOUT.ticketsLane.y)) return false;

    if (!conquestCombatHudV2WidgetHasParentHandle(flagsRoot, combatRoot)) return false;
    if (!conquestCombatHudV2WidgetHasAnchor(flagsRoot, CONQUEST_COMBAT_HUD_V2_LAYOUT.flagsLane.anchor)) return false;
    if (!conquestCombatHudV2WidgetHasPositionXY(flagsRoot, CONQUEST_COMBAT_HUD_V2_LAYOUT.flagsLane.x, CONQUEST_COMBAT_HUD_V2_LAYOUT.flagsLane.y)) return false;

    if (!conquestCombatHudV2WidgetHasParentHandle(ticketsLeftBarTrack, ticketsRoot)) return false;
    if (!conquestCombatHudV2WidgetHasParentHandle(ticketsLeftBarFill, ticketsLeftBarTrack)) return false;
    if (!conquestCombatHudV2WidgetHasParentHandle(ticketsRightBarTrack, ticketsRoot)) return false;
    if (!conquestCombatHudV2WidgetHasParentHandle(ticketsRightBarFill, ticketsRightBarTrack)) return false;
    if (!conquestCombatHudV2WidgetHasParentHandle(ticketsFriendlyText, ticketsRoot)) return false;
    if (!conquestCombatHudV2WidgetHasParentHandle(ticketsEnemyText, ticketsRoot)) return false;
    if (!conquestCombatHudV2WidgetHasParentHandle(ticketsSlashText, ticketsRoot)) return false;

    return true;
}

// Runs the combat HUD v2 main render pass for all valid players.
function renderConquestCombatHudV2ForAllPlayers(): void {
    if (!CONQUEST_COMBAT_HUD_ENABLED) return;
    const nowSeconds = Math.floor(mod.GetMatchTimeElapsed());
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const player = mod.ValueInArray(players, i) as mod.Player;
        if (!player || !mod.IsPlayerValid(player)) continue;
        const pid = safeGetPlayerId(player);
        if (pid === undefined) continue;
        let entry = getConquestCombatHudV2Entry(pid);
        if (!entry || !entry.initialized || !hasConquestCombatHudV2CriticalRefs(entry)) {
            entry = ensureConquestCombatHudV2ForPlayer(player);
        }
        if (!entry || !entry.initialized || !hasConquestCombatHudV2CriticalRefs(entry)) continue;
        renderConquestCombatHudV2ForPid(pid, nowSeconds);
    }
}

// Runs the combat HUD v2 animation render pass for all initialized player entries.
function renderConquestCombatHudV2AnimationForAllPlayers(): void {
    if (!CONQUEST_COMBAT_HUD_ENABLED) return;
    const nowSeconds = Math.floor(mod.GetMatchTimeElapsed());
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const player = mod.ValueInArray(players, i) as mod.Player;
        if (!player || !mod.IsPlayerValid(player)) continue;
        const pid = safeGetPlayerId(player);
        if (pid === undefined) continue;
        renderConquestCombatHudV2AnimationForPid(pid, nowSeconds);
    }
}
