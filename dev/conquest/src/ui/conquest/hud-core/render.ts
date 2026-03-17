// @ts-nocheck
// Module: ui/conquest/hud-core/render -- value/visibility render owner for hard-cut combat HUD

function twlConquestHudClamp01(value: number): number {
    if (value <= 0) return 0;
    if (value >= 1) return 1;
    return value;
}

// Applies one shadow-ring text state in a single pass so layered shadows stay synchronized.
function twlConquestHudRenderShadowRingText(
    ring: Array<mod.UIWidget | undefined> | undefined,
    visible: boolean,
    label: mod.Message
): void {
    if (!ring) return;
    for (let i = 0; i < ring.length; i++) {
        const layer = ring[i];
        safeSetUIWidgetVisible(layer, visible);
        if (!visible) continue;
        safeSetUITextLabel(layer, label);
        safeSetUITextColor(layer, TWL_CONQUEST_HUD_COLOR_SHADOW);
        safeSetUITextAlpha(layer, 1);
    }
}

function twlConquestHudGetFlagLetter(cp: ConquestCapturePointRuntimeState | undefined, row: number): string {
    const raw = (cp?.label ?? "").toUpperCase();
    if (raw === "A" || raw === "B" || raw === "C" || raw === "D" || raw === "E" || raw === "F" || raw === "G") {
        return raw;
    }
    const fallback = ["A", "B", "C", "D", "E", "F", "G"];
    return fallback[row] ?? "?";
}

// Maps fallback objective letters to localized string keys.
function twlConquestHudGetFlagLetterStringKey(letter: string): number {
    if (letter === "A") return STR_HUD_CONQUEST_FLAG_LETTER_A;
    if (letter === "B") return STR_HUD_CONQUEST_FLAG_LETTER_B;
    if (letter === "C") return STR_HUD_CONQUEST_FLAG_LETTER_C;
    if (letter === "D") return STR_HUD_CONQUEST_FLAG_LETTER_D;
    if (letter === "E") return STR_HUD_CONQUEST_FLAG_LETTER_E;
    if (letter === "F") return STR_HUD_CONQUEST_FLAG_LETTER_F;
    if (letter === "G") return STR_HUD_CONQUEST_FLAG_LETTER_G;
    return STR_HUD_CONQUEST_FLAG_LETTER_UNKNOWN;
}

// Resolves one mapped capture row index from objective id for deterministic fallback label selection.
function twlConquestHudGetMappedRowByObjId(objId: number | undefined): number {
    if (objId === undefined) return -1;
    const mappedObjIds = State?.conquest?.capture?.mappedObjIdsInOrder ?? [];
    for (let i = 0; i < mappedObjIds.length; i++) {
        if (mappedObjIds[i] === objId) return i;
    }
    return -1;
}

// Resolves a stable A..G fallback letter for one objective id when derived label messages are transiently unavailable.
function twlConquestHudResolveObjectiveLabelLetter(objId: number | undefined, fallbackRow: number): string {
    if (objId === undefined) return twlConquestHudGetFlagLetter(undefined, fallbackRow);
    const row = twlConquestHudGetMappedRowByObjId(objId);
    const cp = State?.conquest?.capture?.byObjId?.[objId];
    return twlConquestHudGetFlagLetter(cp, row >= 0 ? row : fallbackRow);
}

function twlConquestHudGetPerspectiveTeamsForPlayer(player: mod.Player): { friendlyTeam: TeamID; enemyTeam: TeamID } {
    const team = safeGetTeamNumberFromPlayer(player, TeamID.Team1);
    const friendlyTeam = team === TeamID.Team2 ? TeamID.Team2 : TeamID.Team1;
    const enemyTeam = friendlyTeam === TeamID.Team1 ? TeamID.Team2 : TeamID.Team1;
    return { friendlyTeam, enemyTeam };
}

function twlConquestHudBuildFallbackObjectives(): TwlConquestHudObjectiveSnapshot[] {
    const objectives: TwlConquestHudObjectiveSnapshot[] = [];
    for (let i = 0; i < TWL_CONQUEST_HUD_OBJECTIVE_SLOT_COUNT; i++) {
        objectives.push({
            visible: false,
            label: "?",
            ownerTeam: 0,
            progressTeam: 0,
            progress01: 0,
            borderVisible: false,
            fillVisible: false,
            fillY: TWL_CONQUEST_HUD_OBJECTIVE_FILL_INSET_Y + TWL_CONQUEST_HUD_OBJECTIVE_FILL_HEIGHT,
            fillHeight: 0,
            labelVisible: false,
            percentVisible: false,
        });
    }
    return objectives;
}

function twlConquestHudBuildSnapshotForPlayer(player: mod.Player): TwlConquestHudSnapshot {
    const perspective = twlConquestHudGetPerspectiveTeamsForPlayer(player);
    const pid = safeGetPlayerId(player) ?? 0;

    try {
        const mappedCaptureStates = conquestPhase3GetOrderedMappedCaptureStates();
        const hudVm = deriveHudViewModelForPlayer(
            pid,
            perspective,
            mappedCaptureStates,
            TWL_CONQUEST_HUD_OBJECTIVE_SLOT_COUNT
        );

        const objectives: TwlConquestHudObjectiveSnapshot[] = [];
        for (let i = 0; i < TWL_CONQUEST_HUD_OBJECTIVE_SLOT_COUNT; i++) {
            const slotVm = hudVm.flags.slots[i] ?? {
                visible: false,
                borderVisible: false,
                fillVisible: false,
                fillY: TWL_CONQUEST_HUD_OBJECTIVE_FILL_INSET_Y + TWL_CONQUEST_HUD_OBJECTIVE_FILL_HEIGHT,
                fillHeight: 0,
                labelVisible: false,
                percentVisible: false,
            };
            const fallbackLabel = twlConquestHudResolveObjectiveLabelLetter(slotVm.objId, i);
            objectives.push({
                visible: slotVm.visible === true,
                objId: slotVm.objId,
                label: fallbackLabel,
                ownerTeam: 0,
                progressTeam: 0,
                progress01: 0,
                slotBgColor: slotVm.slotBgColor,
                borderVisible: slotVm.borderVisible === true,
                borderColor: slotVm.borderColor,
                fillVisible: slotVm.fillVisible === true,
                fillColor: slotVm.fillColor,
                fillY: slotVm.fillY,
                fillHeight: slotVm.fillHeight,
                labelVisible: slotVm.labelVisible === true,
                labelMessage: slotVm.labelMessage,
                labelColor: slotVm.labelColor,
                percentVisible: slotVm.percentVisible === true,
                percentMessage: slotVm.percentMessage,
                percentColor: slotVm.percentColor,
            });
        }

        const friendlyTicketRatio = twlConquestHudClamp01(hudVm.tickets.friendlyTickets / Math.max(1, CONQUEST_STARTING_TICKETS));
        const enemyTicketRatio = twlConquestHudClamp01(hudVm.tickets.enemyTickets / Math.max(1, CONQUEST_STARTING_TICKETS));

        return {
            pid,
            friendlyTeam: perspective.friendlyTeam,
            enemyTeam: perspective.enemyTeam,
            friendlyTickets: hudVm.tickets.friendlyTickets,
            enemyTickets: hudVm.tickets.enemyTickets,
            friendlyRatio: friendlyTicketRatio,
            enemyRatio: enemyTicketRatio,
            leaderTeam: hudVm.tickets.leaderTeam,
            bleedLeftCount: hudVm.tickets.bleedLeftCount,
            bleedRightCount: hudVm.tickets.bleedRightCount,
            objectives,
            popout: {
                visible: hudVm.activeFlagPopout.visible === true,
                objId: hudVm.activeFlagPopout.objId,
                slotBgColor: hudVm.activeFlagPopout.slotBgColor,
                borderVisible: hudVm.activeFlagPopout.borderVisible === true,
                borderColor: hudVm.activeFlagPopout.borderColor,
                fillVisible: hudVm.activeFlagPopout.fillVisible === true,
                fillColor: hudVm.activeFlagPopout.fillColor,
                fillY: hudVm.activeFlagPopout.fillY,
                fillHeight: hudVm.activeFlagPopout.fillHeight,
                labelVisible: hudVm.activeFlagPopout.labelVisible === true,
                labelMessage: hudVm.activeFlagPopout.labelMessage,
                labelColor: hudVm.activeFlagPopout.labelColor,
                percentVisible: hudVm.activeFlagPopout.percentVisible === true,
                percentMessage: hudVm.activeFlagPopout.percentMessage,
                percentColor: hudVm.activeFlagPopout.percentColor,
            },
            engage: {
                visible: hudVm.engage.visible === true,
                friendlyCountLabel: hudVm.engage.friendlyCountLabel,
                enemyCountLabel: hudVm.engage.enemyCountLabel,
                statusLabel: hudVm.engage.statusLabel,
                friendlyWidth: hudVm.engage.friendlyWidth,
                enemyWidth: hudVm.engage.enemyWidth,
            },
        };
    } catch {
        const previousSnapshot = twlConquestHudGetEntry(pid)?.lastSnapshot;
        if (previousSnapshot) {
            return {
                ...previousSnapshot,
                pid,
                friendlyTeam: perspective.friendlyTeam,
                enemyTeam: perspective.enemyTeam,
            };
        }
        const friendlyTickets = perspective.friendlyTeam === TeamID.Team1
            ? State.conquest.tickets.team1
            : State.conquest.tickets.team2;
        const enemyTickets = perspective.enemyTeam === TeamID.Team1
            ? State.conquest.tickets.team1
            : State.conquest.tickets.team2;
        const friendlyTicketRatio = twlConquestHudClamp01(friendlyTickets / Math.max(1, CONQUEST_STARTING_TICKETS));
        const enemyTicketRatio = twlConquestHudClamp01(enemyTickets / Math.max(1, CONQUEST_STARTING_TICKETS));
        const objectives = twlConquestHudBuildFallbackObjectives();
        const mappedObjIds = State.conquest.capture.mappedObjIdsInOrder;
        const visibleCount = Math.max(0, Math.min(TWL_CONQUEST_HUD_OBJECTIVE_SLOT_COUNT, mappedObjIds.length));
        const firstSlot = Math.floor((TWL_CONQUEST_HUD_OBJECTIVE_SLOT_COUNT - visibleCount) / 2);
        for (let i = 0; i < visibleCount; i++) {
            const objId = mappedObjIds[i];
            const cp = State.conquest.capture.byObjId[objId];
            if (!cp) continue;
            const progress01 = cp.ownerTeam !== 0 && cp.ownerProgressTeam === 0
                ? 1
                : twlConquestHudClamp01(cp.progress01 ?? 0);
            const slotIndex = firstSlot + i;
            objectives[slotIndex] = {
                visible: true,
                objId,
                label: twlConquestHudGetFlagLetter(cp, i),
                ownerTeam: cp.ownerTeam,
                progressTeam: cp.ownerProgressTeam !== 0 ? cp.ownerProgressTeam : cp.ownerTeam,
                progress01,
                borderVisible: false,
                fillVisible: progress01 > 0,
                fillY: TWL_CONQUEST_HUD_OBJECTIVE_FILL_INSET_Y + (TWL_CONQUEST_HUD_OBJECTIVE_FILL_HEIGHT - Math.floor(TWL_CONQUEST_HUD_OBJECTIVE_FILL_HEIGHT * progress01)),
                fillHeight: Math.floor(TWL_CONQUEST_HUD_OBJECTIVE_FILL_HEIGHT * progress01),
                labelVisible: true,
                percentVisible: false,
            };
        }
        return {
            pid,
            friendlyTeam: perspective.friendlyTeam,
            enemyTeam: perspective.enemyTeam,
            friendlyTickets,
            enemyTickets,
            friendlyRatio: friendlyTicketRatio,
            enemyRatio: enemyTicketRatio,
            leaderTeam: State.conquest.debug.ticketLeaderTeam ?? 0,
            bleedLeftCount: 0,
            bleedRightCount: 0,
            objectives,
            popout: {
                visible: false,
                borderVisible: false,
                fillVisible: false,
                fillY: TWL_CONQUEST_HUD_POPOUT_FILL_Y + TWL_CONQUEST_HUD_POPOUT_FILL_HEIGHT,
                fillHeight: 0,
                labelVisible: false,
                percentVisible: false,
            },
            engage: {
                visible: false,
                friendlyWidth: 0,
                enemyWidth: 0,
            },
        };
    }
}

function twlConquestHudGetColorForTeam(
    team: TeamID | 0,
    perspective: { friendlyTeam: TeamID; enemyTeam: TeamID }
): mod.Vector {
    if (team === perspective.friendlyTeam) return TWL_CONQUEST_HUD_COLOR_BLUE;
    if (team === perspective.enemyTeam) return TWL_CONQUEST_HUD_COLOR_RED;
    return TWL_CONQUEST_HUD_COLOR_WHITE;
}

function twlConquestHudRenderPlayerFrame(
    pid: number,
    player: mod.Player,
    snapshot: TwlConquestHudSnapshot,
    revealRoot: boolean = true
): void {
    const entry = twlConquestHudGetEntry(pid);
    if (!entry || !entry.initialized) return;
    const widgets = entry.widgets;
    const perspective = { friendlyTeam: snapshot.friendlyTeam, enemyTeam: snapshot.enemyTeam };
    const previousSnapshot = entry.lastSnapshot;
    safeSetUIWidgetVisible(widgets.ticketBlueBox, true);
    safeSetUIWidgetVisible(widgets.ticketRedBox, true);
    twlConquestHudRenderShadowRingText(
        widgets.ticketBlueTeamNameShadowRing,
        true,
        mod.Message(getTeamNameKey(snapshot.friendlyTeam))
    );
    safeSetUIWidgetVisible(widgets.ticketBlueTeamName, true);
    twlConquestHudRenderShadowRingText(
        widgets.ticketRedTeamNameShadowRing,
        true,
        mod.Message(getTeamNameKey(snapshot.enemyTeam))
    );
    safeSetUIWidgetVisible(widgets.ticketRedTeamName, true);
    safeSetUIWidgetVisible(widgets.ticketBlueCount, true);
    safeSetUIWidgetVisible(widgets.ticketRedCount, true);
    safeSetUIWidgetVisible(widgets.ticketSlash, false);
    safeSetUIWidgetVisible(widgets.ticketBlueBarTrack, true);
    safeSetUIWidgetVisible(widgets.ticketBlueBarFill, true);
    safeSetUIWidgetVisible(widgets.ticketRedBarTrack, true);
    safeSetUIWidgetVisible(widgets.ticketRedBarFill, true);

    safeSetUITextLabel(
        widgets.ticketBlueCount,
        mod.Message(mod.stringkeys.twl.system.genericCounter, Math.max(0, Math.floor(snapshot.friendlyTickets)))
    );
    safeSetUITextLabel(
        widgets.ticketRedCount,
        mod.Message(mod.stringkeys.twl.system.genericCounter, Math.max(0, Math.floor(snapshot.enemyTickets)))
    );
    const friendlyTeamName = mod.Message(getTeamNameKey(snapshot.friendlyTeam));
    const enemyTeamName = mod.Message(getTeamNameKey(snapshot.enemyTeam));
    safeSetUITextLabel(widgets.ticketBlueTeamName, friendlyTeamName);
    safeSetUITextLabel(widgets.ticketRedTeamName, enemyTeamName);
    safeSetUITextColor(widgets.ticketBlueTeamName, TWL_CONQUEST_HUD_COLOR_BLUE);
    safeSetUITextColor(widgets.ticketRedTeamName, TWL_CONQUEST_HUD_COLOR_RED);
    safeSetUITextColor(widgets.ticketBlueCount, TWL_CONQUEST_HUD_COLOR_BLUE);
    safeSetUITextColor(widgets.ticketRedCount, TWL_CONQUEST_HUD_COLOR_RED);

    const blueFillWidth = Math.max(0, Math.min(
        TWL_CONQUEST_HUD_TICKET_BAR_WIDTH,
        Math.floor(TWL_CONQUEST_HUD_TICKET_BAR_WIDTH * snapshot.friendlyRatio)
    ));
    const redFillWidth = Math.max(0, Math.min(
        TWL_CONQUEST_HUD_TICKET_BAR_WIDTH,
        Math.floor(TWL_CONQUEST_HUD_TICKET_BAR_WIDTH * snapshot.enemyRatio)
    ));
    safeSetUIWidgetSize(
        widgets.ticketBlueBarFill,
        mod.CreateVector(blueFillWidth, TWL_CONQUEST_HUD_TICKET_BAR_HEIGHT, 0)
    );
    // Reassert left-fill origin each frame so track/fill alignment remains stable after swap rebuilds.
    safeSetUIWidgetPosition(
        widgets.ticketBlueBarFill,
        mod.CreateVector(0, 0, 0)
    );
    safeSetUIWidgetPosition(
        widgets.ticketRedBarFill,
        mod.CreateVector(TWL_CONQUEST_HUD_TICKET_BAR_WIDTH - redFillWidth, 0, 0)
    );
    safeSetUIWidgetSize(
        widgets.ticketRedBarFill,
        mod.CreateVector(redFillWidth, TWL_CONQUEST_HUD_TICKET_BAR_HEIGHT, 0)
    );

    const leftLeader = snapshot.leaderTeam !== 0 && snapshot.leaderTeam === snapshot.friendlyTeam;
    const rightLeader = snapshot.leaderTeam !== 0 && snapshot.leaderTeam === snapshot.enemyTeam;
    safeSetUIWidgetVisible(widgets.ticketLeadBorderLeft, leftLeader);
    safeSetUIWidgetVisible(widgets.ticketLeadCrownLeftShadow, leftLeader);
    safeSetUIWidgetVisible(widgets.ticketLeadCrownLeft, leftLeader);
    safeSetUIWidgetVisible(widgets.ticketLeadBorderRight, rightLeader);
    safeSetUIWidgetVisible(widgets.ticketLeadCrownRightShadow, rightLeader);
    safeSetUIWidgetVisible(widgets.ticketLeadCrownRight, rightLeader);

    const leftBleedVisible = TWL_CONQUEST_HUD_TICKET_BLEED_ALWAYS_VISIBLE
        ? TWL_CONQUEST_HUD_TICKET_BLEED_CHEVRON_COUNT
        : Math.max(0, Math.min(TWL_CONQUEST_HUD_TICKET_BLEED_CHEVRON_COUNT, Math.floor(snapshot.bleedLeftCount)));
    const rightBleedVisible = TWL_CONQUEST_HUD_TICKET_BLEED_ALWAYS_VISIBLE
        ? TWL_CONQUEST_HUD_TICKET_BLEED_CHEVRON_COUNT
        : Math.max(0, Math.min(TWL_CONQUEST_HUD_TICKET_BLEED_CHEVRON_COUNT, Math.floor(snapshot.bleedRightCount)));
    const hideLeftIndex = -1;
    const hideRightIndex = -1;
    const leftChevronShadowRings = widgets.ticketBleedLeftChevronShadowRings ?? [];
    const rightChevronShadowRings = widgets.ticketBleedRightChevronShadowRings ?? [];
    for (let i = 0; i < TWL_CONQUEST_HUD_TICKET_BLEED_CHEVRON_COUNT; i++) {
        const leftChevronShadowRing = leftChevronShadowRings[i];
        const rightChevronShadowRing = rightChevronShadowRings[i];
        const leftChevron = widgets.ticketBleedLeftChevrons[i];
        const rightChevron = widgets.ticketBleedRightChevrons[i];
        const leftVisible = i < leftBleedVisible && i !== hideLeftIndex;
        const rightVisible = i < rightBleedVisible && i !== hideRightIndex;
        twlConquestHudRenderShadowRingText(
            leftChevronShadowRing,
            leftVisible,
            mod.Message(STR_HUD_CONQUEST_BLEED_CHEVRON_LEFT)
        );
        twlConquestHudRenderShadowRingText(
            rightChevronShadowRing,
            rightVisible,
            mod.Message(STR_HUD_CONQUEST_BLEED_CHEVRON_RIGHT)
        );
        safeSetUIWidgetVisible(leftChevron, leftVisible);
        safeSetUIWidgetVisible(rightChevron, rightVisible);
        if (leftVisible) {
            safeSetUITextLabel(leftChevron, mod.Message(STR_HUD_CONQUEST_BLEED_CHEVRON_LEFT));
            safeSetUITextColor(leftChevron, TWL_CONQUEST_HUD_COLOR_BLEED_CHEVRON_BLUE);
            safeSetUITextAlpha(leftChevron, 1);
        }
        if (rightVisible) {
            safeSetUITextLabel(rightChevron, mod.Message(STR_HUD_CONQUEST_BLEED_CHEVRON_RIGHT));
            safeSetUITextColor(rightChevron, TWL_CONQUEST_HUD_COLOR_BLEED_CHEVRON_RED);
            safeSetUITextAlpha(rightChevron, 1);
        }
    }

    const objectivePercentShadowRings = widgets.objectiveSlotPercentShadowRings ?? [];
    for (let i = 0; i < TWL_CONQUEST_HUD_OBJECTIVE_SLOT_COUNT; i++) {
        const objective = snapshot.objectives[i];
        const slotRoot = widgets.objectiveSlotRoots[i];
        const slotBorder = widgets.objectiveSlotBorders[i];
        const slotFill = widgets.objectiveSlotFills[i];
        const slotLabelShadowRing = widgets.objectiveSlotLabelShadowRings[i];
        const slotLabel = widgets.objectiveSlotLabels[i];
        const slotPercentShadowRing = objectivePercentShadowRings[i];
        const slotPercent = widgets.objectiveSlotPercents[i];
        if (!objective || objective.visible !== true) {
            safeSetUIWidgetVisible(slotRoot, false);
            safeSetUIWidgetVisible(slotBorder, false);
            safeSetUIWidgetVisible(slotFill, false);
            twlConquestHudRenderShadowRingText(
                slotLabelShadowRing,
                false,
                mod.Message(STR_HUD_CONQUEST_FLAG_LETTER_UNKNOWN)
            );
            safeSetUIWidgetVisible(slotLabel, false);
            twlConquestHudRenderShadowRingText(
                slotPercentShadowRing,
                false,
                mod.Message(STR_SYSTEM_GENERIC_PERCENT, 0)
            );
            safeSetUIWidgetVisible(slotPercent, false);
            continue;
        }

        safeSetUIWidgetVisible(slotRoot, true);
        safeSetUIWidgetBgColor(slotRoot, objective.slotBgColor ?? TWL_CONQUEST_HUD_COLOR_TRACK);
        safeSetUIWidgetVisible(slotBorder, objective.borderVisible === true && !!objective.borderColor);
        if (objective.borderVisible && objective.borderColor) {
            safeSetUIWidgetBgColor(slotBorder, objective.borderColor);
            safeSetUIWidgetBgAlpha(slotBorder, TWL_CONQUEST_HUD_OBJECTIVE_BORDER_ALPHA);
        }

        const fillHeight = Math.max(0, Math.min(TWL_CONQUEST_HUD_OBJECTIVE_FILL_HEIGHT, Math.floor(objective.fillHeight)));
        if (objective.fillVisible && objective.fillColor && fillHeight > 0) {
            safeSetUIWidgetVisible(slotFill, true);
            safeSetUIWidgetPosition(
                slotFill,
                mod.CreateVector(TWL_CONQUEST_HUD_OBJECTIVE_FILL_INSET_X, objective.fillY, 0)
            );
            safeSetUIWidgetSize(
                slotFill,
                mod.CreateVector(TWL_CONQUEST_HUD_OBJECTIVE_FILL_WIDTH, fillHeight, 0)
            );
            safeSetUIWidgetBgColor(slotFill, objective.fillColor);
        } else {
            safeSetUIWidgetVisible(slotFill, false);
        }

        safeSetUIWidgetVisible(slotLabel, objective.labelVisible === true);
        if (objective.labelVisible) {
            const fallbackLabelKey = twlConquestHudGetFlagLetterStringKey(objective.label);
            const labelMessage = objective.labelMessage ?? mod.Message(fallbackLabelKey);
            twlConquestHudRenderShadowRingText(
                slotLabelShadowRing,
                true,
                labelMessage
            );
            safeSetUITextLabel(slotLabel, labelMessage);
            safeSetUITextColor(slotLabel, objective.labelColor ?? twlConquestHudGetColorForTeam(objective.ownerTeam, perspective));
        } else {
            twlConquestHudRenderShadowRingText(
                slotLabelShadowRing,
                false,
                mod.Message(STR_HUD_CONQUEST_FLAG_LETTER_UNKNOWN)
            );
        }

        safeSetUIWidgetVisible(slotPercent, objective.percentVisible === true);
        if (objective.percentVisible) {
            const percentMessage = objective.percentMessage ?? mod.Message(STR_SYSTEM_GENERIC_PERCENT, Math.max(0, Math.min(100, Math.round(objective.progress01 * 100))));
            twlConquestHudRenderShadowRingText(
                slotPercentShadowRing,
                true,
                percentMessage
            );
            safeSetUITextLabel(
                slotPercent,
                percentMessage
            );
            safeSetUITextColor(slotPercent, objective.percentColor ?? TWL_CONQUEST_HUD_COLOR_WHITE);
        } else {
            twlConquestHudRenderShadowRingText(
                slotPercentShadowRing,
                false,
                mod.Message(STR_SYSTEM_GENERIC_PERCENT, 0)
            );
        }
    }

    const popout = snapshot.popout;
    const popoutEnteringVisible = popout.visible === true && previousSnapshot?.popout?.visible !== true;
    if (!popout.visible) {
        safeSetUIWidgetVisible(widgets.popoutPercent, false);
        twlConquestHudRenderShadowRingText(
            widgets.popoutPercentShadowRing,
            false,
            mod.Message(STR_SYSTEM_GENERIC_PERCENT, 0)
        );
        safeSetUIWidgetVisible(widgets.popoutLabel, false);
        twlConquestHudRenderShadowRingText(
            widgets.popoutLabelShadowRing,
            false,
            mod.Message(STR_HUD_CONQUEST_FLAG_LETTER_UNKNOWN)
        );
        safeSetUIWidgetVisible(widgets.popoutFill, false);
        safeSetUIWidgetVisible(widgets.popoutBorder, false);
        safeSetUIWidgetVisible(widgets.popoutSlot, false);
        safeSetUIWidgetVisible(widgets.popoutRoot, false);
    } else {
        // Keep root hidden during first visible-frame child updates so the popout lane appears atomically.
        safeSetUIWidgetVisible(widgets.popoutRoot, !popoutEnteringVisible);
        safeSetUIWidgetVisible(widgets.popoutSlot, true);
        safeSetUIWidgetBgColor(widgets.popoutSlot, popout.slotBgColor ?? TWL_CONQUEST_HUD_COLOR_TRACK);

        safeSetUIWidgetVisible(widgets.popoutBorder, popout.borderVisible === true && !!popout.borderColor);
        if (popout.borderVisible && popout.borderColor) {
            safeSetUIWidgetBgColor(widgets.popoutBorder, popout.borderColor);
            safeSetUIWidgetBgAlpha(widgets.popoutBorder, TWL_CONQUEST_HUD_POPOUT_BORDER_ALPHA);
        }

        const popoutFillHeight = Math.max(0, Math.min(TWL_CONQUEST_HUD_POPOUT_FILL_HEIGHT, Math.floor(popout.fillHeight)));
        if (popout.fillVisible && popout.fillColor && popoutFillHeight > 0) {
            safeSetUIWidgetVisible(widgets.popoutFill, true);
            safeSetUIWidgetPosition(
                widgets.popoutFill,
                mod.CreateVector(TWL_CONQUEST_HUD_POPOUT_FILL_X, popout.fillY, 0)
            );
            safeSetUIWidgetSize(
                widgets.popoutFill,
                mod.CreateVector(TWL_CONQUEST_HUD_POPOUT_FILL_WIDTH, popoutFillHeight, 0)
            );
            safeSetUIWidgetBgColor(widgets.popoutFill, popout.fillColor);
        } else {
            safeSetUIWidgetVisible(widgets.popoutFill, false);
        }

        safeSetUIWidgetVisible(widgets.popoutLabel, popout.labelVisible === true);
        if (popout.labelVisible) {
            const fallbackPopoutLabel = twlConquestHudResolveObjectiveLabelLetter(popout.objId, 0);
            const fallbackPopoutLabelKey = twlConquestHudGetFlagLetterStringKey(fallbackPopoutLabel);
            const labelMessage = popout.labelMessage ?? mod.Message(fallbackPopoutLabelKey);
            twlConquestHudRenderShadowRingText(
                widgets.popoutLabelShadowRing,
                true,
                labelMessage
            );
            safeSetUITextLabel(widgets.popoutLabel, labelMessage);
            safeSetUITextColor(widgets.popoutLabel, popout.labelColor ?? TWL_CONQUEST_HUD_COLOR_WHITE);
        } else {
            twlConquestHudRenderShadowRingText(
                widgets.popoutLabelShadowRing,
                false,
                mod.Message(STR_HUD_CONQUEST_FLAG_LETTER_UNKNOWN)
            );
        }

        safeSetUIWidgetVisible(widgets.popoutPercent, popout.percentVisible === true);
        if (popout.percentVisible) {
            const percentMessage = popout.percentMessage ?? mod.Message(STR_SYSTEM_GENERIC_PERCENT, 0);
            twlConquestHudRenderShadowRingText(
                widgets.popoutPercentShadowRing,
                true,
                percentMessage
            );
            safeSetUITextLabel(
                widgets.popoutPercent,
                percentMessage
            );
            safeSetUITextColor(widgets.popoutPercent, popout.percentColor ?? TWL_CONQUEST_HUD_COLOR_WHITE);
        } else {
            twlConquestHudRenderShadowRingText(
                widgets.popoutPercentShadowRing,
                false,
                mod.Message(STR_SYSTEM_GENERIC_PERCENT, 0)
            );
        }
        // Reveal root last for one-pass popout lane appearance.
        safeSetUIWidgetVisible(widgets.popoutRoot, true);
    }

    const engage = snapshot.engage;
    const engageEnteringVisible = engage.visible === true && previousSnapshot?.engage?.visible !== true;
    if (!engage.visible) {
        twlConquestHudRenderShadowRingText(
            widgets.engageFriendlyCountShadowRing,
            false,
            mod.Message(mod.stringkeys.twl.system.genericCounter, 0)
        );
        twlConquestHudRenderShadowRingText(
            widgets.engageEnemyCountShadowRing,
            false,
            mod.Message(mod.stringkeys.twl.system.genericCounter, 0)
        );
        twlConquestHudRenderShadowRingText(
            widgets.engageStatusShadowRing,
            false,
            mod.Message(STR_HUD_CONQUEST_CAPTURE_STATUS_DEFEND)
        );
        safeSetUIWidgetVisible(widgets.engageStatus, false);
        safeSetUIWidgetVisible(widgets.engageEnemyCount, false);
        safeSetUIWidgetVisible(widgets.engageFriendlyCount, false);
        safeSetUIWidgetVisible(widgets.engageEnemyFill, false);
        safeSetUIWidgetVisible(widgets.engageFriendlyFill, false);
        safeSetUIWidgetVisible(widgets.engageTrack, false);
        safeSetUIWidgetVisible(widgets.engageRoot, false);
    } else {
        // Keep root hidden during first visible-frame child updates so the engage lane appears atomically.
        safeSetUIWidgetVisible(widgets.engageRoot, !engageEnteringVisible);
        safeSetUIWidgetVisible(widgets.engageTrack, true);
        safeSetUIWidgetVisible(widgets.engageFriendlyFill, true);
        safeSetUIWidgetVisible(widgets.engageEnemyFill, true);
        safeSetUIWidgetVisible(widgets.engageFriendlyCount, true);
        safeSetUIWidgetVisible(widgets.engageEnemyCount, true);
        safeSetUIWidgetVisible(widgets.engageStatus, true);

        const friendlyWidth = Math.max(0, Math.min(TWL_CONQUEST_HUD_ENGAGE_TRACK_WIDTH, Math.floor(engage.friendlyWidth)));
        const enemyWidth = Math.max(0, Math.min(TWL_CONQUEST_HUD_ENGAGE_TRACK_WIDTH - friendlyWidth, Math.floor(engage.enemyWidth)));
        safeSetUIWidgetSize(
            widgets.engageFriendlyFill,
            mod.CreateVector(friendlyWidth, TWL_CONQUEST_HUD_ENGAGE_TRACK_HEIGHT, 0)
        );
        safeSetUIWidgetPosition(
            widgets.engageEnemyFill,
            mod.CreateVector(friendlyWidth, 0, 0)
        );
        safeSetUIWidgetSize(
            widgets.engageEnemyFill,
            mod.CreateVector(enemyWidth, TWL_CONQUEST_HUD_ENGAGE_TRACK_HEIGHT, 0)
        );

        const friendlyCountLabel = engage.friendlyCountLabel ?? mod.Message(mod.stringkeys.twl.system.genericCounter, 0);
        const enemyCountLabel = engage.enemyCountLabel ?? mod.Message(mod.stringkeys.twl.system.genericCounter, 0);
        const statusLabel = engage.statusLabel ?? mod.Message(STR_HUD_CONQUEST_CAPTURE_STATUS_DEFEND);
        twlConquestHudRenderShadowRingText(
            widgets.engageFriendlyCountShadowRing,
            true,
            friendlyCountLabel
        );
        safeSetUITextLabel(widgets.engageFriendlyCount, friendlyCountLabel);
        twlConquestHudRenderShadowRingText(
            widgets.engageEnemyCountShadowRing,
            true,
            enemyCountLabel
        );
        safeSetUITextLabel(widgets.engageEnemyCount, enemyCountLabel);
        twlConquestHudRenderShadowRingText(
            widgets.engageStatusShadowRing,
            true,
            statusLabel
        );
        safeSetUITextLabel(widgets.engageStatus, statusLabel);
        safeSetUITextColor(widgets.engageFriendlyCount, TWL_CONQUEST_HUD_COLOR_BLUE);
        safeSetUITextColor(widgets.engageEnemyCount, TWL_CONQUEST_HUD_COLOR_RED);
        safeSetUITextColor(widgets.engageStatus, TWL_CONQUEST_HUD_COLOR_WHITE);
        // Reveal root last for one-pass engage lane appearance.
        safeSetUIWidgetVisible(widgets.engageRoot, true);
    }

    if (revealRoot) {
        safeSetUIWidgetVisible(widgets.root, true);
        safeSetUIWidgetVisible(widgets.combatLane, true);
        safeSetUIWidgetVisible(widgets.ticketsLane, true);
        safeSetUIWidgetVisible(widgets.objectivesLane, true);
    } else {
        safeSetUIWidgetVisible(widgets.objectivesLane, false);
        safeSetUIWidgetVisible(widgets.ticketsLane, false);
        safeSetUIWidgetVisible(widgets.combatLane, false);
        safeSetUIWidgetVisible(widgets.root, false);
    }
}
