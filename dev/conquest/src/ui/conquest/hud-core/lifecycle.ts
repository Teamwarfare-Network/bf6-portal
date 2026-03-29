// @ts-nocheck
// Module: ui/conquest/hud-core/lifecycle -- hide/destroy/reset ownership for hard-cut combat HUD

function twlConquestHudDeleteAllByName(name: string, maxPasses: number = 128): void {
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

// Hides every widget in one shadow-ring set so layered shadow state cannot leak between visibility transitions.
function twlConquestHudHideShadowRing(ring: Array<mod.UIWidget | undefined> | undefined): void {
    if (!ring) return;
    for (let i = 0; i < ring.length; i++) {
        safeSetUIWidgetVisible(ring[i], false);
    }
}

// Deletes all generated widgets for one shadow-ring profile and base text widget name.
function twlConquestHudDeleteShadowRingByBaseName(
    baseName: string,
    profile: TwlConquestHudShadowLayerProfile[]
): void {
    for (let i = 0; i < profile.length; i++) {
        twlConquestHudDeleteAllByName(twlConquestHudShadowLayerName(baseName, profile[i].suffix));
    }
}

function twlConquestHudSetRootParked(pid: number, parked: boolean): void {
    const entry = twlConquestHudGetEntry(pid);
    const root = entry?.widgets.root;
    if (!root) return;
    safeSetUIWidgetPosition(
        root,
        mod.CreateVector(0, parked ? TWL_CONQUEST_HUD_ROOT_HIDDEN_Y : 0, 0)
    );
}

function twlConquestHudHidePlayer(pid: number): void {
    const entry = twlConquestHudGetEntry(pid);
    if (!entry) return;
    entry.pendingFirstReveal = true;
    twlConquestHudSetRootParked(pid, true);
    safeSetUIWidgetVisible(entry.widgets.ticketBlueBox, false);
    safeSetUIWidgetVisible(entry.widgets.ticketRedBox, false);
    twlConquestHudHideShadowRing(entry.widgets.ticketBlueTeamNameShadowRing ?? []);
    safeSetUIWidgetVisible(entry.widgets.ticketBlueTeamName, false);
    twlConquestHudHideShadowRing(entry.widgets.ticketRedTeamNameShadowRing ?? []);
    safeSetUIWidgetVisible(entry.widgets.ticketRedTeamName, false);
    safeSetUIWidgetVisible(entry.widgets.ticketBlueCount, false);
    safeSetUIWidgetVisible(entry.widgets.ticketRedCount, false);
    safeSetUIWidgetVisible(entry.widgets.ticketSlash, false);
    safeSetUIWidgetVisible(entry.widgets.ticketBlueBarFill, false);
    safeSetUIWidgetVisible(entry.widgets.ticketBlueBarTrack, false);
    safeSetUIWidgetVisible(entry.widgets.ticketRedBarFill, false);
    safeSetUIWidgetVisible(entry.widgets.ticketRedBarTrack, false);
    safeSetUIWidgetVisible(entry.widgets.ticketLeadBorderLeft, false);
    safeSetUIWidgetVisible(entry.widgets.ticketLeadBorderRight, false);
    safeSetUIWidgetVisible(entry.widgets.ticketLeadCrownLeftShadow, false);
    safeSetUIWidgetVisible(entry.widgets.ticketLeadCrownRightShadow, false);
    safeSetUIWidgetVisible(entry.widgets.ticketLeadCrownLeft, false);
    safeSetUIWidgetVisible(entry.widgets.ticketLeadCrownRight, false);
    const leftChevronShadowRings = entry.widgets.ticketBleedLeftChevronShadowRings ?? [];
    const rightChevronShadowRings = entry.widgets.ticketBleedRightChevronShadowRings ?? [];
    for (let i = 0; i < TWL_CONQUEST_HUD_TICKET_BLEED_CHEVRON_COUNT; i++) {
        twlConquestHudHideShadowRing(leftChevronShadowRings[i]);
        twlConquestHudHideShadowRing(rightChevronShadowRings[i]);
        safeSetUIWidgetVisible(entry.widgets.ticketBleedLeftChevrons[i], false);
        safeSetUIWidgetVisible(entry.widgets.ticketBleedRightChevrons[i], false);
    }
    const objectiveLabelShadowRings = entry.widgets.objectiveSlotLabelShadowRings ?? [];
    const objectivePercentShadowRings = entry.widgets.objectiveSlotPercentShadowRings ?? [];
    for (let i = 0; i < TWL_CONQUEST_HUD_OBJECTIVE_SLOT_COUNT; i++) {
        twlConquestHudHideShadowRing(objectiveLabelShadowRings[i]);
        twlConquestHudHideShadowRing(objectivePercentShadowRings[i]);
        safeSetUIWidgetVisible(entry.widgets.objectiveSlotPercents[i], false);
        safeSetUIWidgetVisible(entry.widgets.objectiveSlotLabels[i], false);
        safeSetUIWidgetVisible(entry.widgets.objectiveSlotFills[i], false);
        safeSetUIWidgetVisible(entry.widgets.objectiveSlotBorders[i], false);
        safeSetUIWidgetVisible(entry.widgets.objectiveSlotRoots[i], false);
    }
    twlConquestHudHideShadowRing(entry.widgets.popoutLabelShadowRing ?? []);
    twlConquestHudHideShadowRing(entry.widgets.popoutPercentShadowRing ?? []);
    safeSetUIWidgetVisible(entry.widgets.popoutPercent, false);
    safeSetUIWidgetVisible(entry.widgets.popoutLabel, false);
    safeSetUIWidgetVisible(entry.widgets.popoutFill, false);
    safeSetUIWidgetVisible(entry.widgets.popoutBorder, false);
    safeSetUIWidgetVisible(entry.widgets.popoutSlot, false);
    safeSetUIWidgetVisible(entry.widgets.popoutRoot, false);
    twlConquestHudHideShadowRing(entry.widgets.engageFriendlyCountShadowRing ?? []);
    twlConquestHudHideShadowRing(entry.widgets.engageEnemyCountShadowRing ?? []);
    twlConquestHudHideShadowRing(entry.widgets.engageStatusShadowRing ?? []);
    safeSetUIWidgetVisible(entry.widgets.engageStatus, false);
    safeSetUIWidgetVisible(entry.widgets.engageEnemyCount, false);
    safeSetUIWidgetVisible(entry.widgets.engageFriendlyCount, false);
    safeSetUIWidgetVisible(entry.widgets.engageEnemyFill, false);
    safeSetUIWidgetVisible(entry.widgets.engageFriendlyFill, false);
    safeSetUIWidgetVisible(entry.widgets.engageTrack, false);
    safeSetUIWidgetVisible(entry.widgets.engageRoot, false);
    safeSetUIWidgetVisible(entry.widgets.objectivesLane, false);
    safeSetUIWidgetVisible(entry.widgets.ticketsLane, false);
    safeSetUIWidgetVisible(entry.widgets.combatLane, false);
    safeSetUIWidgetVisible(entry.widgets.root, false);
}

function twlConquestHudHideRootOnly(pid: number): void {
    const entry = twlConquestHudGetEntry(pid);
    if (!entry) return;
    entry.pendingFirstReveal = true;
    twlConquestHudSetRootParked(pid, true);
    safeSetUIWidgetVisible(entry.widgets.objectivesLane, false);
    safeSetUIWidgetVisible(entry.widgets.ticketsLane, false);
    safeSetUIWidgetVisible(entry.widgets.combatLane, false);
    safeSetUIWidgetVisible(entry.widgets.root, false);
}

function twlConquestHudRevealRootOnly(pid: number): void {
    const entry = twlConquestHudGetEntry(pid);
    if (!entry) return;
    entry.pendingFirstReveal = false;
    twlConquestHudSetRootParked(pid, false);
    safeSetUIWidgetVisible(entry.widgets.root, true);
    safeSetUIWidgetVisible(entry.widgets.combatLane, true);
    safeSetUIWidgetVisible(entry.widgets.ticketsLane, true);
    safeSetUIWidgetVisible(entry.widgets.objectivesLane, true);
}

// Hides only the active-objective overlays while keeping the top ticket/objective row intact.
function twlConquestHudHideObjectiveFocusForPid(pid: number): void {
    const entry = twlConquestHudGetEntry(pid);
    if (!entry) return;
    twlConquestHudHideShadowRing(entry.widgets.popoutLabelShadowRing ?? []);
    twlConquestHudHideShadowRing(entry.widgets.popoutPercentShadowRing ?? []);
    safeSetUIWidgetVisible(entry.widgets.popoutPercent, false);
    safeSetUIWidgetVisible(entry.widgets.popoutLabel, false);
    safeSetUIWidgetVisible(entry.widgets.popoutFill, false);
    safeSetUIWidgetVisible(entry.widgets.popoutBorder, false);
    safeSetUIWidgetVisible(entry.widgets.popoutSlot, false);
    safeSetUIWidgetVisible(entry.widgets.popoutRoot, false);
    twlConquestHudHideShadowRing(entry.widgets.engageFriendlyCountShadowRing ?? []);
    twlConquestHudHideShadowRing(entry.widgets.engageEnemyCountShadowRing ?? []);
    twlConquestHudHideShadowRing(entry.widgets.engageStatusShadowRing ?? []);
    safeSetUIWidgetVisible(entry.widgets.engageStatus, false);
    safeSetUIWidgetVisible(entry.widgets.engageEnemyCount, false);
    safeSetUIWidgetVisible(entry.widgets.engageFriendlyCount, false);
    safeSetUIWidgetVisible(entry.widgets.engageEnemyFill, false);
    safeSetUIWidgetVisible(entry.widgets.engageFriendlyFill, false);
    safeSetUIWidgetVisible(entry.widgets.engageTrack, false);
    safeSetUIWidgetVisible(entry.widgets.engageRoot, false);
}

function twlConquestHudHideAllPlayers(): void {
    twlConquestHudForEachEntry((pid) => {
        twlConquestHudHidePlayer(pid);
    });
}

function twlConquestHudDestroyPlayer(pid: number): void {
    twlConquestHudHidePlayer(pid);
    twlConquestHudDeleteAllByName(twlConquestHudTicketBlueBoxName(pid));
    twlConquestHudDeleteAllByName(twlConquestHudTicketRedBoxName(pid));
    twlConquestHudDeleteShadowRingByBaseName(
        twlConquestHudTicketBlueTeamNameName(pid),
        TWL_CONQUEST_HUD_SHADOW_RING_PROFILE_ENGAGE_COUNT
    );
    twlConquestHudDeleteAllByName(twlConquestHudTicketBlueTeamNameName(pid));
    twlConquestHudDeleteShadowRingByBaseName(
        twlConquestHudTicketRedTeamNameName(pid),
        TWL_CONQUEST_HUD_SHADOW_RING_PROFILE_ENGAGE_COUNT
    );
    twlConquestHudDeleteAllByName(twlConquestHudTicketRedTeamNameName(pid));
    twlConquestHudDeleteAllByName(`${twlConquestHudTicketBlueCountName(pid)}_Shadow`);
    twlConquestHudDeleteAllByName(`${twlConquestHudTicketRedCountName(pid)}_Shadow`);
    twlConquestHudDeleteAllByName(twlConquestHudTicketBlueCountName(pid));
    twlConquestHudDeleteAllByName(twlConquestHudTicketRedCountName(pid));
    twlConquestHudDeleteAllByName(twlConquestHudTicketSlashName(pid));
    twlConquestHudDeleteAllByName(twlConquestHudTicketBlueBarFillName(pid));
    twlConquestHudDeleteAllByName(twlConquestHudTicketBlueBarTrackName(pid));
    twlConquestHudDeleteAllByName(twlConquestHudTicketRedBarFillName(pid));
    twlConquestHudDeleteAllByName(twlConquestHudTicketRedBarTrackName(pid));
    twlConquestHudDeleteAllByName(twlConquestHudTicketLeadBorderLeftName(pid));
    twlConquestHudDeleteAllByName(twlConquestHudTicketLeadBorderRightName(pid));
    twlConquestHudDeleteAllByName(twlConquestHudTicketLeadCrownLeftShadowName(pid));
    twlConquestHudDeleteAllByName(twlConquestHudTicketLeadCrownRightShadowName(pid));
    twlConquestHudDeleteAllByName(twlConquestHudTicketLeadCrownLeftName(pid));
    twlConquestHudDeleteAllByName(twlConquestHudTicketLeadCrownRightName(pid));
    for (let i = 0; i < TWL_CONQUEST_HUD_TICKET_BLEED_CHEVRON_COUNT; i++) {
        twlConquestHudDeleteShadowRingByBaseName(
            twlConquestHudTicketBleedChevronLeftName(pid, i),
            TWL_CONQUEST_HUD_SHADOW_RING_PROFILE_CHEVRON
        );
        twlConquestHudDeleteShadowRingByBaseName(
            twlConquestHudTicketBleedChevronRightName(pid, i),
            TWL_CONQUEST_HUD_SHADOW_RING_PROFILE_CHEVRON
        );
        // Clean stale single-shadow names left by earlier hud-core builds.
        twlConquestHudDeleteAllByName(`${twlConquestHudTicketBleedChevronLeftName(pid, i)}_Shadow`);
        twlConquestHudDeleteAllByName(`${twlConquestHudTicketBleedChevronRightName(pid, i)}_Shadow`);
        twlConquestHudDeleteAllByName(twlConquestHudTicketBleedChevronLeftName(pid, i));
        twlConquestHudDeleteAllByName(twlConquestHudTicketBleedChevronRightName(pid, i));
    }
    for (let i = 0; i < TWL_CONQUEST_HUD_OBJECTIVE_SLOT_COUNT; i++) {
        twlConquestHudDeleteShadowRingByBaseName(
            twlConquestHudObjectiveLabelName(pid, i),
            TWL_CONQUEST_HUD_SHADOW_RING_PROFILE_OBJECTIVE_LABEL
        );
        twlConquestHudDeleteShadowRingByBaseName(
            twlConquestHudObjectivePercentName(pid, i),
            TWL_CONQUEST_HUD_SHADOW_RING_PROFILE_PERCENT
        );
        twlConquestHudDeleteAllByName(`${twlConquestHudObjectivePercentName(pid, i)}_Shadow`);
        twlConquestHudDeleteAllByName(twlConquestHudObjectivePercentName(pid, i));
        twlConquestHudDeleteAllByName(`${twlConquestHudObjectiveLabelName(pid, i)}_Shadow`);
        twlConquestHudDeleteAllByName(twlConquestHudObjectiveLabelName(pid, i));
        twlConquestHudDeleteAllByName(twlConquestHudObjectiveFillName(pid, i));
        twlConquestHudDeleteAllByName(twlConquestHudObjectiveBorderName(pid, i));
        twlConquestHudDeleteAllByName(twlConquestHudObjectiveSlotName(pid, i));
    }
    twlConquestHudDeleteShadowRingByBaseName(
        twlConquestHudPopoutLabelName(pid),
        TWL_CONQUEST_HUD_SHADOW_RING_PROFILE_POPOUT_LABEL
    );
    twlConquestHudDeleteShadowRingByBaseName(
        twlConquestHudPopoutPercentName(pid),
        TWL_CONQUEST_HUD_SHADOW_RING_PROFILE_POPOUT_PERCENT
    );
    twlConquestHudDeleteAllByName(`${twlConquestHudPopoutPercentName(pid)}_Shadow`);
    twlConquestHudDeleteAllByName(twlConquestHudPopoutPercentName(pid));
    twlConquestHudDeleteAllByName(`${twlConquestHudPopoutLabelName(pid)}_Shadow`);
    twlConquestHudDeleteAllByName(twlConquestHudPopoutLabelName(pid));
    twlConquestHudDeleteAllByName(twlConquestHudPopoutFillName(pid));
    twlConquestHudDeleteAllByName(twlConquestHudPopoutBorderName(pid));
    twlConquestHudDeleteAllByName(twlConquestHudPopoutSlotName(pid));
    twlConquestHudDeleteAllByName(twlConquestHudPopoutRootName(pid));
    twlConquestHudDeleteShadowRingByBaseName(
        twlConquestHudEngageStatusName(pid),
        TWL_CONQUEST_HUD_SHADOW_RING_PROFILE_ENGAGE_STATUS
    );
    twlConquestHudDeleteAllByName(`${twlConquestHudEngageStatusName(pid)}_Shadow`);
    twlConquestHudDeleteAllByName(twlConquestHudEngageStatusName(pid));
    twlConquestHudDeleteShadowRingByBaseName(
        twlConquestHudEngageEnemyCountName(pid),
        TWL_CONQUEST_HUD_SHADOW_RING_PROFILE_ENGAGE_COUNT
    );
    twlConquestHudDeleteAllByName(`${twlConquestHudEngageEnemyCountName(pid)}_Shadow`);
    twlConquestHudDeleteAllByName(twlConquestHudEngageEnemyCountName(pid));
    twlConquestHudDeleteShadowRingByBaseName(
        twlConquestHudEngageFriendlyCountName(pid),
        TWL_CONQUEST_HUD_SHADOW_RING_PROFILE_ENGAGE_COUNT
    );
    twlConquestHudDeleteAllByName(`${twlConquestHudEngageFriendlyCountName(pid)}_Shadow`);
    twlConquestHudDeleteAllByName(twlConquestHudEngageFriendlyCountName(pid));
    twlConquestHudDeleteAllByName(twlConquestHudEngageEnemyFillName(pid));
    twlConquestHudDeleteAllByName(twlConquestHudEngageFriendlyFillName(pid));
    twlConquestHudDeleteAllByName(twlConquestHudEngageTrackName(pid));
    twlConquestHudDeleteAllByName(twlConquestHudEngageRootName(pid));
    twlConquestHudDeleteAllByName(twlConquestHudObjectivesLaneName(pid));
    twlConquestHudDeleteAllByName(twlConquestHudTicketsLaneName(pid));
    twlConquestHudDeleteAllByName(twlConquestHudCombatLaneName(pid));
    twlConquestHudDeleteAllByName(twlConquestHudRootName(pid));
    twlConquestHudRemoveEntry(pid);
    twlConquestHudResetBootstrapPurge(pid);
}

function twlConquestHudDestroyAllPlayers(): void {
    const pids: number[] = [];
    twlConquestHudForEachEntry((pid) => {
        pids.push(pid);
    });
    for (let i = 0; i < pids.length; i++) {
        twlConquestHudDestroyPlayer(pids[i]);
    }
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const player = mod.ValueInArray(players, i) as mod.Player;
        if (!player || !mod.IsPlayerValid(player)) continue;
        const pid = safeGetPlayerId(player);
        if (pid === undefined) continue;
        twlConquestHudDestroyPlayer(pid);
    }
    twlConquestHudClearAllEntries();
}

