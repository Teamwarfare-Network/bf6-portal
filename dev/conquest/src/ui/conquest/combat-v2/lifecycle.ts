// @ts-nocheck
// Module: ui/conquest/combat-v2/lifecycle -- lifecycle state transitions for combat HUD v2

// Deletes all duplicate widgets for one name (defensive cleanup during swaps/rejoins).
function deleteAllConquestCombatHudV2WidgetsByName(name: string, maxPasses: number = 64): void {
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

// Hides combat-v2 root chain widgets for one player.
function hideConquestCombatHudV2ForPid(pid: number): void {
    const entry = getConquestCombatHudV2Entry(pid);
    const leftBarTrack = entry?.widgets.ticketsLeftBarTrack ?? safeFind(conquestCombatHudV2TicketsLeftBarTrackName(pid));
    const leftBarFill = entry?.widgets.ticketsLeftBarFill ?? safeFind(conquestCombatHudV2TicketsLeftBarFillName(pid));
    const rightBarTrack = entry?.widgets.ticketsRightBarTrack ?? safeFind(conquestCombatHudV2TicketsRightBarTrackName(pid));
    const rightBarFill = entry?.widgets.ticketsRightBarFill ?? safeFind(conquestCombatHudV2TicketsRightBarFillName(pid));
    const friendlyText = entry?.widgets.ticketsFriendlyText ?? safeFind(conquestCombatHudV2TicketsFriendlyTextName(pid));
    const enemyText = entry?.widgets.ticketsEnemyText ?? safeFind(conquestCombatHudV2TicketsEnemyTextName(pid));
    const slashText = entry?.widgets.ticketsSlashText ?? safeFind(conquestCombatHudV2TicketsSlashTextName(pid));
    const leadBorderLeft = entry?.widgets.ticketsLeadBorderLeft ?? safeFind(conquestCombatHudV2TicketsLeadBorderLeftName(pid));
    const leadBorderRight = entry?.widgets.ticketsLeadBorderRight ?? safeFind(conquestCombatHudV2TicketsLeadBorderRightName(pid));
    const bleedLeftChevrons = entry?.widgets.ticketsBleedLeftChevrons ?? [];
    const bleedRightChevrons = entry?.widgets.ticketsBleedRightChevrons ?? [];
    const flagsSlotRoots = entry?.widgets.flagsSlotRoots ?? [];
    const flagsSlotFills = entry?.widgets.flagsSlotFills ?? [];
    const flagsSlotLabels = entry?.widgets.flagsSlotLabels ?? [];
    const activePopoutRoot = entry?.widgets.activePopoutRoot ?? safeFind(conquestCombatHudV2ActivePopoutRootName(pid));
    const activePopoutSlot = entry?.widgets.activePopoutSlot ?? safeFind(conquestCombatHudV2ActivePopoutSlotName(pid));
    const activePopoutFill = entry?.widgets.activePopoutFill ?? safeFind(conquestCombatHudV2ActivePopoutFillName(pid));
    const activePopoutLabel = entry?.widgets.activePopoutLabel ?? safeFind(conquestCombatHudV2ActivePopoutLabelName(pid));
    const activePopoutPercent = entry?.widgets.activePopoutPercent ?? safeFind(conquestCombatHudV2ActivePopoutPercentName(pid));
    const engageRoot = entry?.widgets.engageRoot ?? safeFind(conquestCombatHudV2EngageRootName(pid));
    const engageTrack = entry?.widgets.engageTrack ?? safeFind(conquestCombatHudV2EngageTrackName(pid));
    const engageFriendlyFill = entry?.widgets.engageFriendlyFill ?? safeFind(conquestCombatHudV2EngageFriendlyFillName(pid));
    const engageEnemyFill = entry?.widgets.engageEnemyFill ?? safeFind(conquestCombatHudV2EngageEnemyFillName(pid));
    const engageFriendlyCount = entry?.widgets.engageFriendlyCount ?? safeFind(conquestCombatHudV2EngageFriendlyCountName(pid));
    const engageEnemyCount = entry?.widgets.engageEnemyCount ?? safeFind(conquestCombatHudV2EngageEnemyCountName(pid));
    const engageStatus = entry?.widgets.engageStatus ?? safeFind(conquestCombatHudV2EngageStatusName(pid));
    const combatRoot = entry?.widgets.combatRoot ?? safeFind(conquestCombatHudV2RootName(pid));
    const ticketsRoot = entry?.widgets.ticketsRoot ?? safeFind(conquestCombatHudV2TicketsRootName(pid));
    const flagsRoot = entry?.widgets.flagsRoot ?? safeFind(conquestCombatHudV2FlagsRootName(pid));
    safeSetUIWidgetVisible(activePopoutPercent, false);
    safeSetUIWidgetVisible(activePopoutLabel, false);
    safeSetUIWidgetVisible(activePopoutFill, false);
    safeSetUIWidgetVisible(activePopoutSlot, false);
    safeSetUIWidgetVisible(activePopoutRoot, false);
    safeSetUIWidgetVisible(engageStatus, false);
    safeSetUIWidgetVisible(engageEnemyCount, false);
    safeSetUIWidgetVisible(engageFriendlyCount, false);
    safeSetUIWidgetVisible(engageEnemyFill, false);
    safeSetUIWidgetVisible(engageFriendlyFill, false);
    safeSetUIWidgetVisible(engageTrack, false);
    safeSetUIWidgetVisible(engageRoot, false);
    safeSetUIWidgetVisible(slashText, false);
    safeSetUIWidgetVisible(enemyText, false);
    safeSetUIWidgetVisible(friendlyText, false);
    safeSetUIWidgetVisible(rightBarFill, false);
    safeSetUIWidgetVisible(rightBarTrack, false);
    safeSetUIWidgetVisible(leftBarFill, false);
    safeSetUIWidgetVisible(leftBarTrack, false);
    safeSetUIWidgetVisible(leadBorderLeft, false);
    safeSetUIWidgetVisible(leadBorderRight, false);
    for (let index = 0; index < CONQUEST_COMBAT_HUD_V2_TICKETS_LAYOUT.bleedChevron.count; index++) {
        safeSetUIWidgetVisible(
            bleedLeftChevrons[index] ?? safeFind(conquestCombatHudV2TicketsBleedChevronLeftName(pid, index)),
            false
        );
        safeSetUIWidgetVisible(
            bleedRightChevrons[index] ?? safeFind(conquestCombatHudV2TicketsBleedChevronRightName(pid, index)),
            false
        );
    }
    for (let index = 0; index < CONQUEST_COMBAT_HUD_V2_FLAGS_LAYOUT.slotCount; index++) {
        safeSetUIWidgetVisible(
            flagsSlotRoots[index] ?? safeFind(conquestCombatHudV2FlagsSlotRootName(pid, index)),
            false
        );
        safeSetUIWidgetVisible(
            flagsSlotFills[index] ?? safeFind(conquestCombatHudV2FlagsSlotFillName(pid, index)),
            false
        );
        safeSetUIWidgetVisible(
            flagsSlotLabels[index] ?? safeFind(conquestCombatHudV2FlagsSlotLabelName(pid, index)),
            false
        );
    }
    safeSetUIWidgetVisible(flagsRoot, false);
    safeSetUIWidgetVisible(ticketsRoot, false);
    safeSetUIWidgetVisible(combatRoot, false);
}

// Hides combat-v2 root chain widgets for all cached players.
function hideAllConquestCombatHudV2(): void {
    forEachConquestCombatHudV2Entry((pid) => {
        hideConquestCombatHudV2ForPid(pid);
    });
}

// Destroys combat-v2 root chain widgets and clears cache for one player.
function destroyConquestCombatHudV2ForPid(pid: number): void {
    hideConquestCombatHudV2ForPid(pid);
    deleteAllConquestCombatHudV2WidgetsByName(conquestCombatHudV2TicketsSlashTextName(pid));
    deleteAllConquestCombatHudV2WidgetsByName(conquestCombatHudV2TicketsEnemyTextName(pid));
    deleteAllConquestCombatHudV2WidgetsByName(conquestCombatHudV2TicketsFriendlyTextName(pid));
    deleteAllConquestCombatHudV2WidgetsByName(conquestCombatHudV2TicketsRightBarFillName(pid));
    deleteAllConquestCombatHudV2WidgetsByName(conquestCombatHudV2TicketsRightBarTrackName(pid));
    deleteAllConquestCombatHudV2WidgetsByName(conquestCombatHudV2TicketsLeftBarFillName(pid));
    deleteAllConquestCombatHudV2WidgetsByName(conquestCombatHudV2TicketsLeftBarTrackName(pid));
    deleteAllConquestCombatHudV2WidgetsByName(conquestCombatHudV2TicketsLeadBorderLeftName(pid));
    deleteAllConquestCombatHudV2WidgetsByName(conquestCombatHudV2TicketsLeadBorderRightName(pid));
    for (let index = 0; index < CONQUEST_COMBAT_HUD_V2_TICKETS_LAYOUT.bleedChevron.count; index++) {
        deleteAllConquestCombatHudV2WidgetsByName(conquestCombatHudV2TicketsBleedChevronLeftName(pid, index));
        deleteAllConquestCombatHudV2WidgetsByName(conquestCombatHudV2TicketsBleedChevronRightName(pid, index));
    }
    for (let index = 0; index < CONQUEST_COMBAT_HUD_V2_FLAGS_LAYOUT.slotCount; index++) {
        deleteAllConquestCombatHudV2WidgetsByName(conquestCombatHudV2FlagsSlotLabelName(pid, index));
        deleteAllConquestCombatHudV2WidgetsByName(conquestCombatHudV2FlagsSlotFillName(pid, index));
        deleteAllConquestCombatHudV2WidgetsByName(conquestCombatHudV2FlagsSlotRootName(pid, index));
    }
    deleteAllConquestCombatHudV2WidgetsByName(conquestCombatHudV2ActivePopoutPercentName(pid));
    deleteAllConquestCombatHudV2WidgetsByName(conquestCombatHudV2ActivePopoutLabelName(pid));
    deleteAllConquestCombatHudV2WidgetsByName(conquestCombatHudV2ActivePopoutFillName(pid));
    deleteAllConquestCombatHudV2WidgetsByName(conquestCombatHudV2ActivePopoutSlotName(pid));
    deleteAllConquestCombatHudV2WidgetsByName(conquestCombatHudV2ActivePopoutRootName(pid));
    deleteAllConquestCombatHudV2WidgetsByName(conquestCombatHudV2EngageStatusName(pid));
    deleteAllConquestCombatHudV2WidgetsByName(conquestCombatHudV2EngageEnemyCountName(pid));
    deleteAllConquestCombatHudV2WidgetsByName(conquestCombatHudV2EngageFriendlyCountName(pid));
    deleteAllConquestCombatHudV2WidgetsByName(conquestCombatHudV2EngageEnemyFillName(pid));
    deleteAllConquestCombatHudV2WidgetsByName(conquestCombatHudV2EngageFriendlyFillName(pid));
    deleteAllConquestCombatHudV2WidgetsByName(conquestCombatHudV2EngageTrackName(pid));
    deleteAllConquestCombatHudV2WidgetsByName(conquestCombatHudV2EngageRootName(pid));
    deleteAllConquestCombatHudV2WidgetsByName(conquestCombatHudV2FlagsRootName(pid));
    deleteAllConquestCombatHudV2WidgetsByName(conquestCombatHudV2TicketsRootName(pid));
    deleteAllConquestCombatHudV2WidgetsByName(conquestCombatHudV2RootName(pid));
    clearConquestCombatHudV2Entry(pid);
    resetConquestCombatHudV2InitialPurgeCompleted(pid);
}

// Marks one player's combat HUD v2 entry dirty for a full main-render refresh.
function markConquestCombatHudV2DirtyForPid(pid: number): void {
    const entry = ensureConquestCombatHudV2Entry(pid);
    entry.dirty = true;
}

// Marks one player's combat HUD v2 animation lane dirty for animation cadence updates.
function markConquestCombatHudV2AnimationDirtyForPid(pid: number): void {
    const entry = ensureConquestCombatHudV2Entry(pid);
    entry.animationDirty = true;
}

// Marks team-swap pending state so combat HUD v2 can enforce hide->rebuild->resume ordering.
function setConquestCombatHudV2TeamSwapPending(pid: number, pending: boolean): void {
    const entry = ensureConquestCombatHudV2Entry(pid);
    entry.teamSwapPending = pending;
    if (pending) {
        hideConquestCombatHudV2ForPid(pid);
        entry.dirty = true;
        entry.animationDirty = true;
    }
}

// Resets one player's combat HUD v2 entry and deletes cached widget refs.
function resetConquestCombatHudV2ForPid(pid: number): void {
    destroyConquestCombatHudV2ForPid(pid);
}

// Resets all players' combat HUD v2 cache entries.
function resetAllConquestCombatHudV2(): void {
    forEachConquestCombatHudV2Entry((pid) => {
        destroyConquestCombatHudV2ForPid(pid);
    });
    clearAllConquestCombatHudV2Entries();
}

// Hard-purges combat-v2 widget names for all connected players.
// This is used at startup to remove stale UI survivors even when cache entries are empty.
function hardPurgeConquestCombatHudV2ForConnectedPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const player = mod.ValueInArray(players, i) as mod.Player;
        if (!player || !mod.IsPlayerValid(player)) continue;
        const pid = safeGetPlayerId(player);
        if (pid === undefined) continue;
        destroyConquestCombatHudV2ForPid(pid);
    }
}
