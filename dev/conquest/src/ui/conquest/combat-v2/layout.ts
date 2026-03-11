// @ts-nocheck
// Module: ui/conquest/combat-v2/layout -- single-source positional constants for combat HUD v2

type ConquestCombatHudV2LayoutSpec = {
    root: {
        width: number;
        height: number;
        x: number;
        y: number;
        anchor: mod.UIAnchor;
    };
    ticketsLane: {
        width: number;
        height: number;
        x: number;
        y: number;
        anchor: mod.UIAnchor;
    };
    flagsLane: {
        width: number;
        height: number;
        x: number;
        y: number;
        anchor: mod.UIAnchor;
    };
};

type ConquestCombatHudV2TicketsLayoutSpec = {
    friendlyText: { x: number; y: number; width: number; height: number; textSize: number; };
    enemyText: { x: number; y: number; width: number; height: number; textSize: number; };
    slashText: { x: number; y: number; width: number; height: number; textSize: number; };
    leftBarTrack: { x: number; y: number; width: number; height: number; };
    rightBarTrack: { x: number; y: number; width: number; height: number; };
    leadBorderLeft: { x: number; y: number; width: number; height: number; };
    leadBorderRight: { x: number; y: number; width: number; height: number; };
    bleedChevron: { count: number; width: number; height: number; textSize: number; y: number; leftStartX: number; rightStartX: number; stepX: number; };
};

type ConquestCombatHudV2FlagsLayoutSpec = {
    slotCount: number;
    slotWidth: number;
    slotHeight: number;
    slotStepX: number;
    slotY: number;
    slotXByIndex: number[];
    fillInsetX: number;
    fillInsetY: number;
    fillMaxWidth: number;
    fillMaxHeight: number;
    labelTextSize: number;
};

type ConquestCombatHudV2ActivePopoutLayoutSpec = {
    root: { x: number; y: number; width: number; height: number; anchor: mod.UIAnchor; };
    slot: { x: number; y: number; width: number; height: number; anchor: mod.UIAnchor; };
    fill: { x: number; y: number; width: number; height: number; anchor: mod.UIAnchor; };
    label: { x: number; y: number; width: number; height: number; textSize: number; anchor: mod.UIAnchor; };
    percent: { x: number; y: number; width: number; height: number; textSize: number; anchor: mod.UIAnchor; };
};

type ConquestCombatHudV2EngageLayoutSpec = {
    root: { x: number; y: number; width: number; height: number; anchor: mod.UIAnchor; };
    track: { x: number; y: number; width: number; height: number; anchor: mod.UIAnchor; };
    friendlyFill: { x: number; y: number; width: number; height: number; anchor: mod.UIAnchor; };
    enemyFill: { x: number; y: number; width: number; height: number; anchor: mod.UIAnchor; };
    friendlyCount: { x: number; y: number; width: number; height: number; textSize: number; anchor: mod.UIAnchor; };
    enemyCount: { x: number; y: number; width: number; height: number; textSize: number; anchor: mod.UIAnchor; };
    status: { x: number; y: number; width: number; height: number; textSize: number; anchor: mod.UIAnchor; };
};

// Authoritative combat HUD placement constants:
// these values are the only valid initial placement source for combat lane roots.
const CONQUEST_COMBAT_HUD_V2_LAYOUT: ConquestCombatHudV2LayoutSpec = {
    root: {
        width: 562,
        height: 180,
        x: 0,
        y: CONQUEST_HUD_TICKETS_FLAGS_SHIFT_Y,
        anchor: mod.UIAnchor.TopCenter,
    },
    ticketsLane: {
        width: 562,
        height: 50,
        x: 0,
        y: 0,
        anchor: mod.UIAnchor.TopCenter,
    },
    flagsLane: {
        width: 239,
        height: 46,
        x: 0,
        y: 0,
        anchor: mod.UIAnchor.TopCenter,
    },
};

// Authoritative element classification registry for combat HUD v2 lanes.
const CONQUEST_COMBAT_HUD_V2_ELEMENT_CLASS_BY_ID: Record<string, ConquestCombatHudV2ElementClass> = {
    combatRoot: "static",
    ticketsRoot: "static",
    flagsRoot: "static",
    activePopoutRoot: "dynamic",
    engageRoot: "dynamic",
};

// Update cadences by element class (planning baseline for scheduler ownership).
const CONQUEST_COMBAT_HUD_V2_CADENCE_BY_CLASS: Record<ConquestCombatHudV2ElementClass, ConquestCombatHudV2UpdateCadence> = {
    static: "none",
    dynamic: "main",
    animated: "animation",
};

const CONQUEST_COMBAT_HUD_V2_MAIN_UPDATE_SECONDS = 0.25;
const CONQUEST_COMBAT_HUD_V2_ANIMATION_UPDATE_SECONDS = 0.12;

// Authoritative tickets-lane internal placement constants for combat HUD v2.
const CONQUEST_COMBAT_HUD_V2_TICKETS_LAYOUT: ConquestCombatHudV2TicketsLayoutSpec = {
    friendlyText: { x: 40, y: -1, width: 72, height: 28, textSize: 26 },
    enemyText: { x: 449, y: -1, width: 72, height: 28, textSize: 26 },
    slashText: { x: 272, y: -1, width: 16, height: 28, textSize: 22 },
    leftBarTrack: { x: 103.39, y: 30.82, width: CONQUEST_HUD_TICKET_BAR_WIDTH, height: CONQUEST_HUD_TICKET_BAR_HEIGHT },
    rightBarTrack: { x: 284.90, y: 30.82, width: CONQUEST_HUD_TICKET_BAR_WIDTH, height: CONQUEST_HUD_TICKET_BAR_HEIGHT },
    leadBorderLeft: {
        x: 40 - CONQUEST_HUD_TICKET_LEAD_BORDER_GROW,
        y: -1 - CONQUEST_HUD_TICKET_LEAD_BORDER_GROW,
        width: 72 + (CONQUEST_HUD_TICKET_LEAD_BORDER_GROW * 2),
        height: 28 + (CONQUEST_HUD_TICKET_LEAD_BORDER_GROW * 2),
    },
    leadBorderRight: {
        x: 449 - CONQUEST_HUD_TICKET_LEAD_BORDER_GROW,
        y: -1 - CONQUEST_HUD_TICKET_LEAD_BORDER_GROW,
        width: 72 + (CONQUEST_HUD_TICKET_LEAD_BORDER_GROW * 2),
        height: 28 + (CONQUEST_HUD_TICKET_LEAD_BORDER_GROW * 2),
    },
    bleedChevron: {
        count: CONQUEST_HUD_TICKET_BLEED_CHEVRON_COUNT,
        width: CONQUEST_HUD_TICKET_BLEED_CHEVRON_WIDTH,
        height: CONQUEST_HUD_TICKET_BLEED_CHEVRON_HEIGHT,
        textSize: CONQUEST_HUD_TICKET_BLEED_CHEVRON_TEXT_SIZE,
        y: 30.82
            + Math.floor((CONQUEST_HUD_TICKET_BAR_HEIGHT - CONQUEST_HUD_TICKET_BLEED_CHEVRON_HEIGHT) / 2)
            + CONQUEST_HUD_TICKET_BLEED_CHEVRON_IN_BAR_OFFSET_Y,
        leftStartX: 103.39 + CONQUEST_HUD_TICKET_BLEED_CHEVRON_OUTER_INSET_X,
        rightStartX: 284.90
            + CONQUEST_HUD_TICKET_BAR_WIDTH
            - CONQUEST_HUD_TICKET_BLEED_CHEVRON_OUTER_INSET_X
            - CONQUEST_HUD_TICKET_BLEED_CHEVRON_WIDTH,
        stepX: CONQUEST_HUD_TICKET_BLEED_CHEVRON_STEP_X,
    },
};

// Authoritative flags-lane internal placement constants for combat HUD v2.
const CONQUEST_COMBAT_HUD_V2_FLAGS_LAYOUT: ConquestCombatHudV2FlagsLayoutSpec = (() => {
    const slotCount = 7;
    const slotWidth = CONQUEST_HUD_FLAG_SLOT_WIDTH;
    const slotHeight = CONQUEST_HUD_FLAG_SLOT_HEIGHT;
    const slotStepX = 35;
    const slotY = (
        CONQUEST_COMBAT_HUD_V2_TICKETS_LAYOUT.leftBarTrack.y
        + (CONQUEST_COMBAT_HUD_V2_TICKETS_LAYOUT.leftBarTrack.height / 2)
    ) - (slotHeight / 2);
    const slotXByIndex: number[] = [];
    const centerIndex = (slotCount - 1) / 2;
    const centeredSlotLeftX = (CONQUEST_COMBAT_HUD_V2_LAYOUT.flagsLane.width - slotWidth) / 2;
    for (let i = 0; i < slotCount; i++) {
        const deltaIndex = i - centerIndex;
        slotXByIndex.push(centeredSlotLeftX + (deltaIndex * slotStepX));
    }
    const fillInsetX = CONQUEST_HUD_FLAG_FILL_INSET_X;
    const fillInsetY = CONQUEST_HUD_FLAG_FILL_INSET_Y;
    const fillMaxWidth = slotWidth - (fillInsetX * 2);
    const fillMaxHeight = slotHeight - (fillInsetY * 2);
    const labelTextSize = CONQUEST_HUD_FLAG_LABEL_TEXT_SIZE;
    return {
        slotCount,
        slotWidth,
        slotHeight,
        slotStepX,
        slotY,
        slotXByIndex,
        fillInsetX,
        fillInsetY,
        fillMaxWidth,
        fillMaxHeight,
        labelTextSize,
    };
})();

// Authoritative active-popout layout constants for combat HUD v2.
const CONQUEST_COMBAT_HUD_V2_ACTIVE_POPOUT_LAYOUT: ConquestCombatHudV2ActivePopoutLayoutSpec = {
    root: {
        x: (CONQUEST_COMBAT_HUD_V2_LAYOUT.flagsLane.width - CONQUEST_HUD_FLAG_ACTIVE_POPOUT_ROOT_WIDTH) / 2,
        y: 39.62,
        width: CONQUEST_HUD_FLAG_ACTIVE_POPOUT_ROOT_WIDTH,
        height: CONQUEST_HUD_FLAG_ACTIVE_POPOUT_ROOT_HEIGHT,
        anchor: mod.UIAnchor.TopLeft,
    },
    slot: {
        x: CONQUEST_HUD_FLAG_ACTIVE_POPOUT_SLOT_OFFSET_X,
        y: CONQUEST_HUD_FLAG_ACTIVE_POPOUT_SLOT_OFFSET_Y,
        width: CONQUEST_HUD_FLAG_ACTIVE_POPOUT_SLOT_WIDTH,
        height: CONQUEST_HUD_FLAG_ACTIVE_POPOUT_SLOT_HEIGHT,
        anchor: mod.UIAnchor.TopLeft,
    },
    fill: {
        x: CONQUEST_HUD_FLAG_ACTIVE_POPOUT_FILL_INSET_X,
        y: CONQUEST_HUD_FLAG_ACTIVE_POPOUT_FILL_INSET_Y,
        width: CONQUEST_HUD_FLAG_ACTIVE_POPOUT_FILL_MAX_WIDTH,
        height: CONQUEST_HUD_FLAG_ACTIVE_POPOUT_FILL_MAX_HEIGHT,
        anchor: mod.UIAnchor.TopLeft,
    },
    label: {
        x: 0,
        y: 0,
        width: CONQUEST_HUD_FLAG_ACTIVE_POPOUT_SLOT_WIDTH,
        height: CONQUEST_HUD_FLAG_ACTIVE_POPOUT_SLOT_HEIGHT,
        textSize: CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_TEXT_SIZE,
        anchor: mod.UIAnchor.TopLeft,
    },
    percent: {
        x: CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_OFFSET_X,
        y: CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_OFFSET_Y,
        width: CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_ROOT_WIDTH,
        height: CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_ROOT_HEIGHT,
        textSize: CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_TEXT_SIZE,
        anchor: mod.UIAnchor.TopLeft,
    },
};

// Authoritative engage-layout constants for combat HUD v2.
const CONQUEST_COMBAT_HUD_V2_ENGAGE_LAYOUT: ConquestCombatHudV2EngageLayoutSpec = {
    root: {
        x: CONQUEST_COMBAT_HUD_V2_ACTIVE_POPOUT_LAYOUT.root.x
            - ((CONQUEST_HUD_FLAG_ENGAGE_ROOT_WIDTH - CONQUEST_HUD_FLAG_ACTIVE_POPOUT_ROOT_WIDTH) / 2),
        y: CONQUEST_COMBAT_HUD_V2_ACTIVE_POPOUT_LAYOUT.root.y + CONQUEST_HUD_FLAG_ACTIVE_POPOUT_ROOT_HEIGHT + 14,
        width: CONQUEST_HUD_FLAG_ENGAGE_ROOT_WIDTH,
        height: CONQUEST_HUD_FLAG_ENGAGE_ROOT_HEIGHT,
        anchor: mod.UIAnchor.TopLeft,
    },
    track: {
        x: CONQUEST_HUD_FLAG_ENGAGE_TRACK_X,
        y: CONQUEST_HUD_FLAG_ENGAGE_TRACK_Y,
        width: CONQUEST_HUD_FLAG_ENGAGE_TRACK_WIDTH,
        height: CONQUEST_HUD_FLAG_ENGAGE_TRACK_HEIGHT,
        anchor: mod.UIAnchor.TopLeft,
    },
    friendlyFill: {
        x: 0,
        y: 0,
        width: Math.floor(CONQUEST_HUD_FLAG_ENGAGE_TRACK_WIDTH / 2),
        height: CONQUEST_HUD_FLAG_ENGAGE_TRACK_HEIGHT,
        anchor: mod.UIAnchor.TopLeft,
    },
    enemyFill: {
        x: Math.floor(CONQUEST_HUD_FLAG_ENGAGE_TRACK_WIDTH / 2),
        y: 0,
        width: CONQUEST_HUD_FLAG_ENGAGE_TRACK_WIDTH - Math.floor(CONQUEST_HUD_FLAG_ENGAGE_TRACK_WIDTH / 2),
        height: CONQUEST_HUD_FLAG_ENGAGE_TRACK_HEIGHT,
        anchor: mod.UIAnchor.TopLeft,
    },
    friendlyCount: {
        x: CONQUEST_HUD_FLAG_ENGAGE_FRIENDLY_COUNT_BG_X,
        y: CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_Y,
        width: CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_WIDTH,
        height: CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_HEIGHT,
        textSize: CONQUEST_HUD_FLAG_ENGAGE_COUNT_TEXT_SIZE,
        anchor: mod.UIAnchor.TopLeft,
    },
    enemyCount: {
        x: CONQUEST_HUD_FLAG_ENGAGE_ENEMY_COUNT_BG_X,
        y: CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_Y,
        width: CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_WIDTH,
        height: CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_HEIGHT,
        textSize: CONQUEST_HUD_FLAG_ENGAGE_COUNT_TEXT_SIZE,
        anchor: mod.UIAnchor.TopLeft,
    },
    status: {
        x: 0,
        y: CONQUEST_HUD_FLAG_ENGAGE_STATUS_Y,
        width: CONQUEST_HUD_FLAG_ENGAGE_STATUS_WIDTH,
        height: CONQUEST_HUD_FLAG_ENGAGE_STATUS_HEIGHT,
        textSize: CONQUEST_HUD_FLAG_ENGAGE_STATUS_TEXT_SIZE,
        anchor: mod.UIAnchor.TopLeft,
    },
};

// Returns the combat root widget name for one player.
function conquestCombatHudV2RootName(pid: number): string {
    return `ConquestCombatHudV2Root_${pid}`;
}

// Returns the tickets-lane root widget name for one player.
function conquestCombatHudV2TicketsRootName(pid: number): string {
    return `ConquestCombatHudV2TicketsRoot_${pid}`;
}

// Returns the flags-lane root widget name for one player.
function conquestCombatHudV2FlagsRootName(pid: number): string {
    return `ConquestCombatHudV2FlagsRoot_${pid}`;
}

// Returns the tickets left-bar track widget name for one player.
function conquestCombatHudV2TicketsLeftBarTrackName(pid: number): string {
    return `ConquestCombatHudV2TicketsLeftBarTrack_${pid}`;
}

// Returns the tickets left-bar fill widget name for one player.
function conquestCombatHudV2TicketsLeftBarFillName(pid: number): string {
    return `ConquestCombatHudV2TicketsLeftBarFill_${pid}`;
}

// Returns the tickets right-bar track widget name for one player.
function conquestCombatHudV2TicketsRightBarTrackName(pid: number): string {
    return `ConquestCombatHudV2TicketsRightBarTrack_${pid}`;
}

// Returns the tickets right-bar fill widget name for one player.
function conquestCombatHudV2TicketsRightBarFillName(pid: number): string {
    return `ConquestCombatHudV2TicketsRightBarFill_${pid}`;
}

// Returns the tickets friendly counter text widget name for one player.
function conquestCombatHudV2TicketsFriendlyTextName(pid: number): string {
    return `ConquestCombatHudV2TicketsFriendlyText_${pid}`;
}

// Returns the tickets enemy counter text widget name for one player.
function conquestCombatHudV2TicketsEnemyTextName(pid: number): string {
    return `ConquestCombatHudV2TicketsEnemyText_${pid}`;
}

// Returns the tickets slash divider text widget name for one player.
function conquestCombatHudV2TicketsSlashTextName(pid: number): string {
    return `ConquestCombatHudV2TicketsSlashText_${pid}`;
}

// Returns the tickets lead-border-left widget name for one player.
function conquestCombatHudV2TicketsLeadBorderLeftName(pid: number): string {
    return `ConquestCombatHudV2TicketsLeadBorderLeft_${pid}`;
}

// Returns the tickets lead-border-right widget name for one player.
function conquestCombatHudV2TicketsLeadBorderRightName(pid: number): string {
    return `ConquestCombatHudV2TicketsLeadBorderRight_${pid}`;
}

// Returns the tickets bleed-chevron-left widget name for one player/index.
function conquestCombatHudV2TicketsBleedChevronLeftName(pid: number, index: number): string {
    return `ConquestCombatHudV2TicketsBleedChevronLeft_${pid}_${index}`;
}

// Returns the tickets bleed-chevron-right widget name for one player/index.
function conquestCombatHudV2TicketsBleedChevronRightName(pid: number, index: number): string {
    return `ConquestCombatHudV2TicketsBleedChevronRight_${pid}_${index}`;
}

// Returns the flags slot-root widget name for one player/index.
function conquestCombatHudV2FlagsSlotRootName(pid: number, index: number): string {
    return `ConquestCombatHudV2FlagSlot_${pid}_${index}`;
}

// Returns the flags slot-fill widget name for one player/index.
function conquestCombatHudV2FlagsSlotFillName(pid: number, index: number): string {
    return `ConquestCombatHudV2FlagFill_${pid}_${index}`;
}

// Returns the flags slot-label widget name for one player/index.
function conquestCombatHudV2FlagsSlotLabelName(pid: number, index: number): string {
    return `ConquestCombatHudV2FlagLabel_${pid}_${index}`;
}

// Returns the active-popout root widget name for one player.
function conquestCombatHudV2ActivePopoutRootName(pid: number): string {
    return `ConquestCombatHudV2ActivePopoutRoot_${pid}`;
}

// Returns the active-popout slot widget name for one player.
function conquestCombatHudV2ActivePopoutSlotName(pid: number): string {
    return `ConquestCombatHudV2ActivePopoutSlot_${pid}`;
}

// Returns the active-popout fill widget name for one player.
function conquestCombatHudV2ActivePopoutFillName(pid: number): string {
    return `ConquestCombatHudV2ActivePopoutFill_${pid}`;
}

// Returns the active-popout label widget name for one player.
function conquestCombatHudV2ActivePopoutLabelName(pid: number): string {
    return `ConquestCombatHudV2ActivePopoutLabel_${pid}`;
}

// Returns the active-popout percent widget name for one player.
function conquestCombatHudV2ActivePopoutPercentName(pid: number): string {
    return `ConquestCombatHudV2ActivePopoutPercent_${pid}`;
}

// Returns the engage root widget name for one player.
function conquestCombatHudV2EngageRootName(pid: number): string {
    return `ConquestCombatHudV2EngageRoot_${pid}`;
}

// Returns the engage track widget name for one player.
function conquestCombatHudV2EngageTrackName(pid: number): string {
    return `ConquestCombatHudV2EngageTrack_${pid}`;
}

// Returns the engage friendly fill widget name for one player.
function conquestCombatHudV2EngageFriendlyFillName(pid: number): string {
    return `ConquestCombatHudV2EngageFriendlyFill_${pid}`;
}

// Returns the engage enemy fill widget name for one player.
function conquestCombatHudV2EngageEnemyFillName(pid: number): string {
    return `ConquestCombatHudV2EngageEnemyFill_${pid}`;
}

// Returns the engage friendly count widget name for one player.
function conquestCombatHudV2EngageFriendlyCountName(pid: number): string {
    return `ConquestCombatHudV2EngageFriendlyCount_${pid}`;
}

// Returns the engage enemy count widget name for one player.
function conquestCombatHudV2EngageEnemyCountName(pid: number): string {
    return `ConquestCombatHudV2EngageEnemyCount_${pid}`;
}

// Returns the engage status widget name for one player.
function conquestCombatHudV2EngageStatusName(pid: number): string {
    return `ConquestCombatHudV2EngageStatus_${pid}`;
}
