// @ts-nocheck
// Module: ui/conquest/combat-v2/build -- single build/repair owner for combat HUD v2 roots

// Ensures a combat-v2 container exists, then normalizes parent/anchor/position/size/depth.
function ensureConquestCombatHudV2Container(
    player: mod.Player,
    name: string,
    parent: mod.UIWidget,
    anchor: mod.UIAnchor,
    x: number,
    y: number,
    width: number,
    height: number
): mod.UIWidget | undefined {
    let widget = safeFind(name);
    if (!widget) {
        const parsed = modlib.ParseUI({
            name,
            type: "Container",
            playerId: player,
            position: [x, y],
            size: [width, height],
            anchor,
            visible: false,
            padding: 0,
            bgAlpha: 0,
            bgFill: mod.UIBgFill.None,
        });
        widget = parsed ?? safeFind(name);
    }
    if (!widget) return undefined;
    try {
        mod.SetUIWidgetParent(widget, parent);
        mod.SetUIWidgetAnchor(widget, anchor);
        mod.SetUIWidgetPosition(widget, mod.CreateVector(x, y, 0));
        mod.SetUIWidgetSize(widget, mod.CreateVector(width, height, 0));
        mod.SetUIWidgetDepth(widget, mod.UIDepth.AboveGameUI);
    } catch {
        return undefined;
    }
    return widget;
}

// Ensures a combat-v2 text widget exists, then normalizes parent/position/size/depth/text defaults.
function ensureConquestCombatHudV2TextWidget(
    player: mod.Player,
    name: string,
    parent: mod.UIWidget,
    anchor: mod.UIAnchor,
    x: number,
    y: number,
    width: number,
    height: number,
    textSize: number,
    textLabel: mod.Message,
    textColor: [number, number, number]
): mod.UIWidget | undefined {
    let widget = safeFind(name);
    if (!widget) {
        const parsed = modlib.ParseUI({
            name,
            type: "Text",
            playerId: player,
            position: [x, y],
            size: [width, height],
            anchor,
            visible: false,
            padding: 0,
            bgAlpha: 0,
            bgFill: mod.UIBgFill.None,
            textLabel,
            textColor,
            textAlpha: 1,
            textSize,
            textAnchor: mod.UIAnchor.Center,
        });
        widget = parsed ?? safeFind(name);
    }
    if (!widget) return undefined;
    try {
        mod.SetUIWidgetParent(widget, parent);
        mod.SetUIWidgetAnchor(widget, anchor);
        mod.SetUIWidgetPosition(widget, mod.CreateVector(x, y, 0));
        mod.SetUIWidgetSize(widget, mod.CreateVector(width, height, 0));
        mod.SetUIWidgetDepth(widget, mod.UIDepth.AboveGameUI);
        mod.SetUITextSize(widget, textSize);
    } catch {
        return undefined;
    }
    safeSetUITextLabel(widget, textLabel);
    safeSetUITextColor(widget, mod.CreateVector(textColor[0], textColor[1], textColor[2]));
    safeSetUITextAlpha(widget, 1);
    return widget;
}

// Ensures ticket-lane widgets exist under the tickets root and returns their handles.
function ensureConquestCombatHudV2TicketsWidgets(
    player: mod.Player,
    pid: number,
    ticketsRoot: mod.UIWidget
): Partial<ConquestCombatHudV2WidgetRefs> | undefined {
    const leftBarTrack = ensureConquestCombatHudV2Container(
        player,
        conquestCombatHudV2TicketsLeftBarTrackName(pid),
        ticketsRoot,
        mod.UIAnchor.TopLeft,
        CONQUEST_COMBAT_HUD_V2_TICKETS_LAYOUT.leftBarTrack.x,
        CONQUEST_COMBAT_HUD_V2_TICKETS_LAYOUT.leftBarTrack.y,
        CONQUEST_COMBAT_HUD_V2_TICKETS_LAYOUT.leftBarTrack.width,
        CONQUEST_COMBAT_HUD_V2_TICKETS_LAYOUT.leftBarTrack.height
    );
    if (!leftBarTrack) return undefined;

    const leftBarFill = ensureConquestCombatHudV2Container(
        player,
        conquestCombatHudV2TicketsLeftBarFillName(pid),
        leftBarTrack,
        mod.UIAnchor.TopLeft,
        0,
        0,
        CONQUEST_COMBAT_HUD_V2_TICKETS_LAYOUT.leftBarTrack.width,
        CONQUEST_COMBAT_HUD_V2_TICKETS_LAYOUT.leftBarTrack.height
    );
    if (!leftBarFill) return undefined;

    const rightBarTrack = ensureConquestCombatHudV2Container(
        player,
        conquestCombatHudV2TicketsRightBarTrackName(pid),
        ticketsRoot,
        mod.UIAnchor.TopLeft,
        CONQUEST_COMBAT_HUD_V2_TICKETS_LAYOUT.rightBarTrack.x,
        CONQUEST_COMBAT_HUD_V2_TICKETS_LAYOUT.rightBarTrack.y,
        CONQUEST_COMBAT_HUD_V2_TICKETS_LAYOUT.rightBarTrack.width,
        CONQUEST_COMBAT_HUD_V2_TICKETS_LAYOUT.rightBarTrack.height
    );
    if (!rightBarTrack) return undefined;

    const rightBarFill = ensureConquestCombatHudV2Container(
        player,
        conquestCombatHudV2TicketsRightBarFillName(pid),
        rightBarTrack,
        mod.UIAnchor.TopLeft,
        0,
        0,
        CONQUEST_COMBAT_HUD_V2_TICKETS_LAYOUT.rightBarTrack.width,
        CONQUEST_COMBAT_HUD_V2_TICKETS_LAYOUT.rightBarTrack.height
    );
    if (!rightBarFill) return undefined;

    const friendlyText = ensureConquestCombatHudV2TextWidget(
        player,
        conquestCombatHudV2TicketsFriendlyTextName(pid),
        ticketsRoot,
        mod.UIAnchor.TopLeft,
        CONQUEST_COMBAT_HUD_V2_TICKETS_LAYOUT.friendlyText.x,
        CONQUEST_COMBAT_HUD_V2_TICKETS_LAYOUT.friendlyText.y,
        CONQUEST_COMBAT_HUD_V2_TICKETS_LAYOUT.friendlyText.width,
        CONQUEST_COMBAT_HUD_V2_TICKETS_LAYOUT.friendlyText.height,
        CONQUEST_COMBAT_HUD_V2_TICKETS_LAYOUT.friendlyText.textSize,
        mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
        CONQUEST_HUD_TEXT_FRIENDLY_RGB
    );
    if (!friendlyText) return undefined;

    const enemyText = ensureConquestCombatHudV2TextWidget(
        player,
        conquestCombatHudV2TicketsEnemyTextName(pid),
        ticketsRoot,
        mod.UIAnchor.TopLeft,
        CONQUEST_COMBAT_HUD_V2_TICKETS_LAYOUT.enemyText.x,
        CONQUEST_COMBAT_HUD_V2_TICKETS_LAYOUT.enemyText.y,
        CONQUEST_COMBAT_HUD_V2_TICKETS_LAYOUT.enemyText.width,
        CONQUEST_COMBAT_HUD_V2_TICKETS_LAYOUT.enemyText.height,
        CONQUEST_COMBAT_HUD_V2_TICKETS_LAYOUT.enemyText.textSize,
        mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
        CONQUEST_HUD_TEXT_ENEMY_RGB
    );
    if (!enemyText) return undefined;

    const slashText = ensureConquestCombatHudV2TextWidget(
        player,
        conquestCombatHudV2TicketsSlashTextName(pid),
        ticketsRoot,
        mod.UIAnchor.TopLeft,
        CONQUEST_COMBAT_HUD_V2_TICKETS_LAYOUT.slashText.x,
        CONQUEST_COMBAT_HUD_V2_TICKETS_LAYOUT.slashText.y,
        CONQUEST_COMBAT_HUD_V2_TICKETS_LAYOUT.slashText.width,
        CONQUEST_COMBAT_HUD_V2_TICKETS_LAYOUT.slashText.height,
        CONQUEST_COMBAT_HUD_V2_TICKETS_LAYOUT.slashText.textSize,
        mod.Message(mod.stringkeys.twl.hud.clock.slash),
        [1, 1, 1]
    );
    if (!slashText) return undefined;

    let leadBorderLeft = ensureConquestCombatHudV2Container(
        player,
        conquestCombatHudV2TicketsLeadBorderLeftName(pid),
        ticketsRoot,
        mod.UIAnchor.TopLeft,
        CONQUEST_COMBAT_HUD_V2_TICKETS_LAYOUT.leadBorderLeft.x,
        CONQUEST_COMBAT_HUD_V2_TICKETS_LAYOUT.leadBorderLeft.y,
        CONQUEST_COMBAT_HUD_V2_TICKETS_LAYOUT.leadBorderLeft.width,
        CONQUEST_COMBAT_HUD_V2_TICKETS_LAYOUT.leadBorderLeft.height
    );

    let leadBorderRight = ensureConquestCombatHudV2Container(
        player,
        conquestCombatHudV2TicketsLeadBorderRightName(pid),
        ticketsRoot,
        mod.UIAnchor.TopLeft,
        CONQUEST_COMBAT_HUD_V2_TICKETS_LAYOUT.leadBorderRight.x,
        CONQUEST_COMBAT_HUD_V2_TICKETS_LAYOUT.leadBorderRight.y,
        CONQUEST_COMBAT_HUD_V2_TICKETS_LAYOUT.leadBorderRight.width,
        CONQUEST_COMBAT_HUD_V2_TICKETS_LAYOUT.leadBorderRight.height
    );

    if (leadBorderLeft && leadBorderRight) {
        try {
            mod.SetUIWidgetBgFill(leadBorderLeft, mod.UIBgFill.OutlineThin);
            mod.SetUIWidgetBgFill(leadBorderRight, mod.UIBgFill.OutlineThin);
        } catch {
            // Optional surface: keep core tickets lane alive even if border fill setup fails.
            leadBorderLeft = undefined;
            leadBorderRight = undefined;
        }
    } else {
        leadBorderLeft = undefined;
        leadBorderRight = undefined;
    }
    if (leadBorderLeft) {
        safeSetUIWidgetBgAlpha(leadBorderLeft, CONQUEST_HUD_TICKET_LEAD_BORDER_ALPHA);
        safeSetUIWidgetBgColor(
            leadBorderLeft,
            mod.CreateVector(
                CONQUEST_HUD_TEXT_FRIENDLY_RGB[0],
                CONQUEST_HUD_TEXT_FRIENDLY_RGB[1],
                CONQUEST_HUD_TEXT_FRIENDLY_RGB[2]
            )
        );
    }
    if (leadBorderRight) {
        safeSetUIWidgetBgAlpha(leadBorderRight, CONQUEST_HUD_TICKET_LEAD_BORDER_ALPHA);
        safeSetUIWidgetBgColor(
            leadBorderRight,
            mod.CreateVector(
                CONQUEST_HUD_TEXT_ENEMY_RGB[0],
                CONQUEST_HUD_TEXT_ENEMY_RGB[1],
                CONQUEST_HUD_TEXT_ENEMY_RGB[2]
            )
        );
    }

    const bleedLeftChevrons: Array<mod.UIWidget | undefined> = [];
    const bleedRightChevrons: Array<mod.UIWidget | undefined> = [];
    for (let index = 0; index < CONQUEST_COMBAT_HUD_V2_TICKETS_LAYOUT.bleedChevron.count; index++) {
        const leftChevron = ensureConquestCombatHudV2TextWidget(
            player,
            conquestCombatHudV2TicketsBleedChevronLeftName(pid, index),
            ticketsRoot,
            mod.UIAnchor.TopLeft,
            CONQUEST_COMBAT_HUD_V2_TICKETS_LAYOUT.bleedChevron.leftStartX
                + (index * CONQUEST_COMBAT_HUD_V2_TICKETS_LAYOUT.bleedChevron.stepX),
            CONQUEST_COMBAT_HUD_V2_TICKETS_LAYOUT.bleedChevron.y,
            CONQUEST_COMBAT_HUD_V2_TICKETS_LAYOUT.bleedChevron.width,
            CONQUEST_COMBAT_HUD_V2_TICKETS_LAYOUT.bleedChevron.height,
            CONQUEST_COMBAT_HUD_V2_TICKETS_LAYOUT.bleedChevron.textSize,
            mod.Message(STR_HUD_CONQUEST_BLEED_CHEVRON_LEFT),
            CONQUEST_HUD_TICKET_BLEED_CHEVRON_FRIENDLY_RGB
        );
        if (!leftChevron) return undefined;

        const rightChevron = ensureConquestCombatHudV2TextWidget(
            player,
            conquestCombatHudV2TicketsBleedChevronRightName(pid, index),
            ticketsRoot,
            mod.UIAnchor.TopLeft,
            CONQUEST_COMBAT_HUD_V2_TICKETS_LAYOUT.bleedChevron.rightStartX
                - (index * CONQUEST_COMBAT_HUD_V2_TICKETS_LAYOUT.bleedChevron.stepX),
            CONQUEST_COMBAT_HUD_V2_TICKETS_LAYOUT.bleedChevron.y,
            CONQUEST_COMBAT_HUD_V2_TICKETS_LAYOUT.bleedChevron.width,
            CONQUEST_COMBAT_HUD_V2_TICKETS_LAYOUT.bleedChevron.height,
            CONQUEST_COMBAT_HUD_V2_TICKETS_LAYOUT.bleedChevron.textSize,
            mod.Message(STR_HUD_CONQUEST_BLEED_CHEVRON_RIGHT),
            CONQUEST_HUD_TICKET_BLEED_CHEVRON_ENEMY_RGB
        );
        if (!rightChevron) return undefined;

        bleedLeftChevrons[index] = leftChevron;
        bleedRightChevrons[index] = rightChevron;
    }

    safeSetUIWidgetBgColor(
        leftBarTrack,
        mod.CreateVector(
            CONQUEST_HUD_TICKET_BAR_FRIENDLY_TRACK_RGB[0],
            CONQUEST_HUD_TICKET_BAR_FRIENDLY_TRACK_RGB[1],
            CONQUEST_HUD_TICKET_BAR_FRIENDLY_TRACK_RGB[2]
        )
    );
    safeSetUIWidgetBgAlpha(leftBarTrack, 0.9);
    safeSetUIWidgetBgColor(
        leftBarFill,
        mod.CreateVector(
            CONQUEST_HUD_TICKET_BAR_FRIENDLY_FILL_RGB[0],
            CONQUEST_HUD_TICKET_BAR_FRIENDLY_FILL_RGB[1],
            CONQUEST_HUD_TICKET_BAR_FRIENDLY_FILL_RGB[2]
        )
    );
    safeSetUIWidgetBgAlpha(leftBarFill, 0.95);

    safeSetUIWidgetBgColor(
        rightBarTrack,
        mod.CreateVector(
            CONQUEST_HUD_TICKET_BAR_ENEMY_TRACK_RGB[0],
            CONQUEST_HUD_TICKET_BAR_ENEMY_TRACK_RGB[1],
            CONQUEST_HUD_TICKET_BAR_ENEMY_TRACK_RGB[2]
        )
    );
    safeSetUIWidgetBgAlpha(rightBarTrack, 0.9);
    safeSetUIWidgetBgColor(
        rightBarFill,
        mod.CreateVector(
            CONQUEST_HUD_TICKET_BAR_ENEMY_FILL_RGB[0],
            CONQUEST_HUD_TICKET_BAR_ENEMY_FILL_RGB[1],
            CONQUEST_HUD_TICKET_BAR_ENEMY_FILL_RGB[2]
        )
    );
    safeSetUIWidgetBgAlpha(rightBarFill, 0.95);

    return {
        ticketsLeftBarTrack: leftBarTrack,
        ticketsLeftBarFill: leftBarFill,
        ticketsRightBarTrack: rightBarTrack,
        ticketsRightBarFill: rightBarFill,
        ticketsFriendlyText: friendlyText,
        ticketsEnemyText: enemyText,
        ticketsSlashText: slashText,
        ticketsLeadBorderLeft: leadBorderLeft,
        ticketsLeadBorderRight: leadBorderRight,
        ticketsBleedLeftChevrons: bleedLeftChevrons,
        ticketsBleedRightChevrons: bleedRightChevrons,
    };
}

// Ensures flags-lane widgets exist under the flags root and returns their handle arrays.
function ensureConquestCombatHudV2FlagsWidgets(
    player: mod.Player,
    pid: number,
    flagsRoot: mod.UIWidget
): Partial<ConquestCombatHudV2WidgetRefs> | undefined {
    const slotRoots: Array<mod.UIWidget | undefined> = [];
    const slotFills: Array<mod.UIWidget | undefined> = [];
    const slotLabels: Array<mod.UIWidget | undefined> = [];

    for (let index = 0; index < CONQUEST_COMBAT_HUD_V2_FLAGS_LAYOUT.slotCount; index++) {
        const slotRoot = ensureConquestCombatHudV2Container(
            player,
            conquestCombatHudV2FlagsSlotRootName(pid, index),
            flagsRoot,
            mod.UIAnchor.TopLeft,
            CONQUEST_COMBAT_HUD_V2_FLAGS_LAYOUT.slotXByIndex[index],
            CONQUEST_COMBAT_HUD_V2_FLAGS_LAYOUT.slotY,
            CONQUEST_COMBAT_HUD_V2_FLAGS_LAYOUT.slotWidth,
            CONQUEST_COMBAT_HUD_V2_FLAGS_LAYOUT.slotHeight
        );
        if (!slotRoot) return undefined;

        const slotFill = ensureConquestCombatHudV2Container(
            player,
            conquestCombatHudV2FlagsSlotFillName(pid, index),
            slotRoot,
            mod.UIAnchor.TopLeft,
            CONQUEST_COMBAT_HUD_V2_FLAGS_LAYOUT.fillInsetX,
            CONQUEST_COMBAT_HUD_V2_FLAGS_LAYOUT.fillInsetY,
            CONQUEST_COMBAT_HUD_V2_FLAGS_LAYOUT.fillMaxWidth,
            CONQUEST_COMBAT_HUD_V2_FLAGS_LAYOUT.fillMaxHeight,
        );
        if (!slotFill) return undefined;

        const slotLabel = ensureConquestCombatHudV2TextWidget(
            player,
            conquestCombatHudV2FlagsSlotLabelName(pid, index),
            slotRoot,
            mod.UIAnchor.TopLeft,
            0,
            0,
            CONQUEST_COMBAT_HUD_V2_FLAGS_LAYOUT.slotWidth,
            CONQUEST_COMBAT_HUD_V2_FLAGS_LAYOUT.slotHeight,
            CONQUEST_COMBAT_HUD_V2_FLAGS_LAYOUT.labelTextSize,
            mod.Message(STR_HUD_CONQUEST_FLAG_LETTER_UNKNOWN),
            CONQUEST_HUD_TEXT_NEUTRAL_RGB
        );
        if (!slotLabel) return undefined;

        safeSetUIWidgetBgColor(
            slotRoot,
            mod.CreateVector(
                CONQUEST_HUD_FLAG_SLOT_TRACK_RGB[0],
                CONQUEST_HUD_FLAG_SLOT_TRACK_RGB[1],
                CONQUEST_HUD_FLAG_SLOT_TRACK_RGB[2]
            )
        );
        safeSetUIWidgetBgAlpha(slotRoot, 1);
        safeSetUIWidgetBgColor(
            slotFill,
            mod.CreateVector(
                CONQUEST_HUD_FLAG_SLOT_TRACK_RGB[0],
                CONQUEST_HUD_FLAG_SLOT_TRACK_RGB[1],
                CONQUEST_HUD_FLAG_SLOT_TRACK_RGB[2]
            )
        );
        safeSetUIWidgetBgAlpha(slotFill, 1);

        slotRoots[index] = slotRoot;
        slotFills[index] = slotFill;
        slotLabels[index] = slotLabel;
    }

    return {
        flagsSlotRoots: slotRoots,
        flagsSlotFills: slotFills,
        flagsSlotLabels: slotLabels,
    };
}

// Ensures active-popout widgets exist under the flags root and returns their handles.
function ensureConquestCombatHudV2ActivePopoutWidgets(
    player: mod.Player,
    pid: number,
    flagsRoot: mod.UIWidget
): Partial<ConquestCombatHudV2WidgetRefs> | undefined {
    const popoutRoot = ensureConquestCombatHudV2Container(
        player,
        conquestCombatHudV2ActivePopoutRootName(pid),
        flagsRoot,
        CONQUEST_COMBAT_HUD_V2_ACTIVE_POPOUT_LAYOUT.root.anchor,
        CONQUEST_COMBAT_HUD_V2_ACTIVE_POPOUT_LAYOUT.root.x,
        CONQUEST_COMBAT_HUD_V2_ACTIVE_POPOUT_LAYOUT.root.y,
        CONQUEST_COMBAT_HUD_V2_ACTIVE_POPOUT_LAYOUT.root.width,
        CONQUEST_COMBAT_HUD_V2_ACTIVE_POPOUT_LAYOUT.root.height
    );
    if (!popoutRoot) return undefined;

    const popoutSlot = ensureConquestCombatHudV2Container(
        player,
        conquestCombatHudV2ActivePopoutSlotName(pid),
        popoutRoot,
        CONQUEST_COMBAT_HUD_V2_ACTIVE_POPOUT_LAYOUT.slot.anchor,
        CONQUEST_COMBAT_HUD_V2_ACTIVE_POPOUT_LAYOUT.slot.x,
        CONQUEST_COMBAT_HUD_V2_ACTIVE_POPOUT_LAYOUT.slot.y,
        CONQUEST_COMBAT_HUD_V2_ACTIVE_POPOUT_LAYOUT.slot.width,
        CONQUEST_COMBAT_HUD_V2_ACTIVE_POPOUT_LAYOUT.slot.height
    );
    if (!popoutSlot) return undefined;

    const popoutFill = ensureConquestCombatHudV2Container(
        player,
        conquestCombatHudV2ActivePopoutFillName(pid),
        popoutSlot,
        CONQUEST_COMBAT_HUD_V2_ACTIVE_POPOUT_LAYOUT.fill.anchor,
        CONQUEST_COMBAT_HUD_V2_ACTIVE_POPOUT_LAYOUT.fill.x,
        CONQUEST_COMBAT_HUD_V2_ACTIVE_POPOUT_LAYOUT.fill.y,
        CONQUEST_COMBAT_HUD_V2_ACTIVE_POPOUT_LAYOUT.fill.width,
        CONQUEST_COMBAT_HUD_V2_ACTIVE_POPOUT_LAYOUT.fill.height
    );
    if (!popoutFill) return undefined;

    const popoutLabel = ensureConquestCombatHudV2TextWidget(
        player,
        conquestCombatHudV2ActivePopoutLabelName(pid),
        popoutSlot,
        CONQUEST_COMBAT_HUD_V2_ACTIVE_POPOUT_LAYOUT.label.anchor,
        CONQUEST_COMBAT_HUD_V2_ACTIVE_POPOUT_LAYOUT.label.x,
        CONQUEST_COMBAT_HUD_V2_ACTIVE_POPOUT_LAYOUT.label.y,
        CONQUEST_COMBAT_HUD_V2_ACTIVE_POPOUT_LAYOUT.label.width,
        CONQUEST_COMBAT_HUD_V2_ACTIVE_POPOUT_LAYOUT.label.height,
        CONQUEST_COMBAT_HUD_V2_ACTIVE_POPOUT_LAYOUT.label.textSize,
        mod.Message(STR_HUD_CONQUEST_FLAG_LETTER_UNKNOWN),
        CONQUEST_HUD_TEXT_NEUTRAL_RGB
    );
    if (!popoutLabel) return undefined;

    const popoutPercent = ensureConquestCombatHudV2TextWidget(
        player,
        conquestCombatHudV2ActivePopoutPercentName(pid),
        popoutRoot,
        CONQUEST_COMBAT_HUD_V2_ACTIVE_POPOUT_LAYOUT.percent.anchor,
        CONQUEST_COMBAT_HUD_V2_ACTIVE_POPOUT_LAYOUT.percent.x,
        CONQUEST_COMBAT_HUD_V2_ACTIVE_POPOUT_LAYOUT.percent.y,
        CONQUEST_COMBAT_HUD_V2_ACTIVE_POPOUT_LAYOUT.percent.width,
        CONQUEST_COMBAT_HUD_V2_ACTIVE_POPOUT_LAYOUT.percent.height,
        CONQUEST_COMBAT_HUD_V2_ACTIVE_POPOUT_LAYOUT.percent.textSize,
        mod.Message(STR_SYSTEM_GENERIC_PERCENT, 0),
        CONQUEST_HUD_TEXT_NEUTRAL_RGB
    );
    if (!popoutPercent) return undefined;

    safeSetUIWidgetBgColor(
        popoutSlot,
        mod.CreateVector(
            CONQUEST_HUD_FLAG_SLOT_TRACK_RGB[0],
            CONQUEST_HUD_FLAG_SLOT_TRACK_RGB[1],
            CONQUEST_HUD_FLAG_SLOT_TRACK_RGB[2]
        )
    );
    safeSetUIWidgetBgColor(
        popoutFill,
        mod.CreateVector(
            CONQUEST_HUD_FLAG_SLOT_TRACK_RGB[0],
            CONQUEST_HUD_FLAG_SLOT_TRACK_RGB[1],
            CONQUEST_HUD_FLAG_SLOT_TRACK_RGB[2]
        )
    );

    return {
        activePopoutRoot: popoutRoot,
        activePopoutSlot: popoutSlot,
        activePopoutFill: popoutFill,
        activePopoutLabel: popoutLabel,
        activePopoutPercent: popoutPercent,
    };
}

// Ensures engage widgets exist under the flags root and returns their handles.
function ensureConquestCombatHudV2EngageWidgets(
    player: mod.Player,
    pid: number,
    flagsRoot: mod.UIWidget
): Partial<ConquestCombatHudV2WidgetRefs> | undefined {
    const engageRoot = ensureConquestCombatHudV2Container(
        player,
        conquestCombatHudV2EngageRootName(pid),
        flagsRoot,
        CONQUEST_COMBAT_HUD_V2_ENGAGE_LAYOUT.root.anchor,
        CONQUEST_COMBAT_HUD_V2_ENGAGE_LAYOUT.root.x,
        CONQUEST_COMBAT_HUD_V2_ENGAGE_LAYOUT.root.y,
        CONQUEST_COMBAT_HUD_V2_ENGAGE_LAYOUT.root.width,
        CONQUEST_COMBAT_HUD_V2_ENGAGE_LAYOUT.root.height
    );
    if (!engageRoot) return undefined;

    const engageTrack = ensureConquestCombatHudV2Container(
        player,
        conquestCombatHudV2EngageTrackName(pid),
        engageRoot,
        CONQUEST_COMBAT_HUD_V2_ENGAGE_LAYOUT.track.anchor,
        CONQUEST_COMBAT_HUD_V2_ENGAGE_LAYOUT.track.x,
        CONQUEST_COMBAT_HUD_V2_ENGAGE_LAYOUT.track.y,
        CONQUEST_COMBAT_HUD_V2_ENGAGE_LAYOUT.track.width,
        CONQUEST_COMBAT_HUD_V2_ENGAGE_LAYOUT.track.height
    );
    if (!engageTrack) return undefined;

    const friendlyFill = ensureConquestCombatHudV2Container(
        player,
        conquestCombatHudV2EngageFriendlyFillName(pid),
        engageTrack,
        CONQUEST_COMBAT_HUD_V2_ENGAGE_LAYOUT.friendlyFill.anchor,
        CONQUEST_COMBAT_HUD_V2_ENGAGE_LAYOUT.friendlyFill.x,
        CONQUEST_COMBAT_HUD_V2_ENGAGE_LAYOUT.friendlyFill.y,
        CONQUEST_COMBAT_HUD_V2_ENGAGE_LAYOUT.friendlyFill.width,
        CONQUEST_COMBAT_HUD_V2_ENGAGE_LAYOUT.friendlyFill.height
    );
    if (!friendlyFill) return undefined;

    const enemyFill = ensureConquestCombatHudV2Container(
        player,
        conquestCombatHudV2EngageEnemyFillName(pid),
        engageTrack,
        CONQUEST_COMBAT_HUD_V2_ENGAGE_LAYOUT.enemyFill.anchor,
        CONQUEST_COMBAT_HUD_V2_ENGAGE_LAYOUT.enemyFill.x,
        CONQUEST_COMBAT_HUD_V2_ENGAGE_LAYOUT.enemyFill.y,
        CONQUEST_COMBAT_HUD_V2_ENGAGE_LAYOUT.enemyFill.width,
        CONQUEST_COMBAT_HUD_V2_ENGAGE_LAYOUT.enemyFill.height
    );
    if (!enemyFill) return undefined;

    const friendlyCount = ensureConquestCombatHudV2TextWidget(
        player,
        conquestCombatHudV2EngageFriendlyCountName(pid),
        engageRoot,
        CONQUEST_COMBAT_HUD_V2_ENGAGE_LAYOUT.friendlyCount.anchor,
        CONQUEST_COMBAT_HUD_V2_ENGAGE_LAYOUT.friendlyCount.x,
        CONQUEST_COMBAT_HUD_V2_ENGAGE_LAYOUT.friendlyCount.y,
        CONQUEST_COMBAT_HUD_V2_ENGAGE_LAYOUT.friendlyCount.width,
        CONQUEST_COMBAT_HUD_V2_ENGAGE_LAYOUT.friendlyCount.height,
        CONQUEST_COMBAT_HUD_V2_ENGAGE_LAYOUT.friendlyCount.textSize,
        mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
        CONQUEST_HUD_TEXT_FRIENDLY_RGB
    );
    if (!friendlyCount) return undefined;

    const enemyCount = ensureConquestCombatHudV2TextWidget(
        player,
        conquestCombatHudV2EngageEnemyCountName(pid),
        engageRoot,
        CONQUEST_COMBAT_HUD_V2_ENGAGE_LAYOUT.enemyCount.anchor,
        CONQUEST_COMBAT_HUD_V2_ENGAGE_LAYOUT.enemyCount.x,
        CONQUEST_COMBAT_HUD_V2_ENGAGE_LAYOUT.enemyCount.y,
        CONQUEST_COMBAT_HUD_V2_ENGAGE_LAYOUT.enemyCount.width,
        CONQUEST_COMBAT_HUD_V2_ENGAGE_LAYOUT.enemyCount.height,
        CONQUEST_COMBAT_HUD_V2_ENGAGE_LAYOUT.enemyCount.textSize,
        mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
        CONQUEST_HUD_TEXT_ENEMY_RGB
    );
    if (!enemyCount) return undefined;

    const engageStatus = ensureConquestCombatHudV2TextWidget(
        player,
        conquestCombatHudV2EngageStatusName(pid),
        engageRoot,
        CONQUEST_COMBAT_HUD_V2_ENGAGE_LAYOUT.status.anchor,
        CONQUEST_COMBAT_HUD_V2_ENGAGE_LAYOUT.status.x,
        CONQUEST_COMBAT_HUD_V2_ENGAGE_LAYOUT.status.y,
        CONQUEST_COMBAT_HUD_V2_ENGAGE_LAYOUT.status.width,
        CONQUEST_COMBAT_HUD_V2_ENGAGE_LAYOUT.status.height,
        CONQUEST_COMBAT_HUD_V2_ENGAGE_LAYOUT.status.textSize,
        mod.Message(STR_HUD_CONQUEST_CAPTURE_STATUS_CONTESTING),
        CONQUEST_HUD_TEXT_NEUTRAL_RGB
    );
    if (!engageStatus) return undefined;

    safeSetUIWidgetBgColor(
        engageTrack,
        mod.CreateVector(
            CONQUEST_HUD_FLAG_ENGAGE_TRACK_RGB[0],
            CONQUEST_HUD_FLAG_ENGAGE_TRACK_RGB[1],
            CONQUEST_HUD_FLAG_ENGAGE_TRACK_RGB[2]
        )
    );
    safeSetUIWidgetBgColor(
        friendlyFill,
        mod.CreateVector(
            CONQUEST_HUD_TICKET_BAR_FRIENDLY_FILL_RGB[0],
            CONQUEST_HUD_TICKET_BAR_FRIENDLY_FILL_RGB[1],
            CONQUEST_HUD_TICKET_BAR_FRIENDLY_FILL_RGB[2]
        )
    );
    safeSetUIWidgetBgColor(
        enemyFill,
        mod.CreateVector(
            CONQUEST_HUD_TICKET_BAR_ENEMY_FILL_RGB[0],
            CONQUEST_HUD_TICKET_BAR_ENEMY_FILL_RGB[1],
            CONQUEST_HUD_TICKET_BAR_ENEMY_FILL_RGB[2]
        )
    );

    return {
        engageRoot,
        engageTrack,
        engageFriendlyFill: friendlyFill,
        engageEnemyFill: enemyFill,
        engageFriendlyCount: friendlyCount,
        engageEnemyCount: enemyCount,
        engageStatus,
    };
}

// Ensures one player's combat-v2 root chain is present and normalized under TopHudRoot.
function ensureConquestCombatHudV2RootChainForPlayer(
    player: mod.Player,
    pid: number
): ConquestCombatHudV2WidgetRefs | undefined {
    const topHudRoot = ensureTopHudRootForPid(pid, player);
    if (!topHudRoot) return undefined;

    const combatRoot = ensureConquestCombatHudV2Container(
        player,
        conquestCombatHudV2RootName(pid),
        topHudRoot,
        CONQUEST_COMBAT_HUD_V2_LAYOUT.root.anchor,
        CONQUEST_COMBAT_HUD_V2_LAYOUT.root.x,
        CONQUEST_COMBAT_HUD_V2_LAYOUT.root.y,
        CONQUEST_COMBAT_HUD_V2_LAYOUT.root.width,
        CONQUEST_COMBAT_HUD_V2_LAYOUT.root.height
    );
    if (!combatRoot) return undefined;

    const ticketsRoot = ensureConquestCombatHudV2Container(
        player,
        conquestCombatHudV2TicketsRootName(pid),
        combatRoot,
        CONQUEST_COMBAT_HUD_V2_LAYOUT.ticketsLane.anchor,
        CONQUEST_COMBAT_HUD_V2_LAYOUT.ticketsLane.x,
        CONQUEST_COMBAT_HUD_V2_LAYOUT.ticketsLane.y,
        CONQUEST_COMBAT_HUD_V2_LAYOUT.ticketsLane.width,
        CONQUEST_COMBAT_HUD_V2_LAYOUT.ticketsLane.height
    );
    if (!ticketsRoot) return undefined;

    const flagsRoot = ensureConquestCombatHudV2Container(
        player,
        conquestCombatHudV2FlagsRootName(pid),
        combatRoot,
        CONQUEST_COMBAT_HUD_V2_LAYOUT.flagsLane.anchor,
        CONQUEST_COMBAT_HUD_V2_LAYOUT.flagsLane.x,
        CONQUEST_COMBAT_HUD_V2_LAYOUT.flagsLane.y,
        CONQUEST_COMBAT_HUD_V2_LAYOUT.flagsLane.width,
        CONQUEST_COMBAT_HUD_V2_LAYOUT.flagsLane.height
    );
    if (!flagsRoot) return undefined;

    const ticketsWidgets = ensureConquestCombatHudV2TicketsWidgets(player, pid, ticketsRoot);
    if (!ticketsWidgets) return undefined;
    const flagsWidgets = ensureConquestCombatHudV2FlagsWidgets(player, pid, flagsRoot);
    if (!flagsWidgets) return undefined;
    const popoutWidgets = ensureConquestCombatHudV2ActivePopoutWidgets(player, pid, flagsRoot);
    const engageWidgets = ensureConquestCombatHudV2EngageWidgets(player, pid, flagsRoot);

    return {
        topHudRoot,
        combatRoot,
        ticketsRoot,
        ticketsLeftBarTrack: ticketsWidgets.ticketsLeftBarTrack,
        ticketsLeftBarFill: ticketsWidgets.ticketsLeftBarFill,
        ticketsRightBarTrack: ticketsWidgets.ticketsRightBarTrack,
        ticketsRightBarFill: ticketsWidgets.ticketsRightBarFill,
        ticketsFriendlyText: ticketsWidgets.ticketsFriendlyText,
        ticketsEnemyText: ticketsWidgets.ticketsEnemyText,
        ticketsSlashText: ticketsWidgets.ticketsSlashText,
        ticketsLeadBorderLeft: ticketsWidgets.ticketsLeadBorderLeft,
        ticketsLeadBorderRight: ticketsWidgets.ticketsLeadBorderRight,
        ticketsBleedLeftChevrons: ticketsWidgets.ticketsBleedLeftChevrons,
        ticketsBleedRightChevrons: ticketsWidgets.ticketsBleedRightChevrons,
        flagsRoot,
        flagsSlotRoots: flagsWidgets.flagsSlotRoots,
        flagsSlotFills: flagsWidgets.flagsSlotFills,
        flagsSlotLabels: flagsWidgets.flagsSlotLabels,
        activePopoutRoot: popoutWidgets?.activePopoutRoot,
        activePopoutSlot: popoutWidgets?.activePopoutSlot,
        activePopoutFill: popoutWidgets?.activePopoutFill,
        activePopoutLabel: popoutWidgets?.activePopoutLabel,
        activePopoutPercent: popoutWidgets?.activePopoutPercent,
        engageRoot: engageWidgets?.engageRoot,
        engageTrack: engageWidgets?.engageTrack,
        engageFriendlyFill: engageWidgets?.engageFriendlyFill,
        engageEnemyFill: engageWidgets?.engageEnemyFill,
        engageFriendlyCount: engageWidgets?.engageFriendlyCount,
        engageEnemyCount: engageWidgets?.engageEnemyCount,
        engageStatus: engageWidgets?.engageStatus,
    };
}

// Ensures one player's combat HUD v2 cache entry exists and is initialized.
// This is the single build/repair owner for the combat-v2 static root chain.
function ensureConquestCombatHudV2ForPlayer(player: mod.Player): ConquestCombatHudV2PlayerEntry | undefined {
    if (!CONQUEST_COMBAT_HUD_ENABLED) return undefined;
    if (!player || !mod.IsPlayerValid(player)) return undefined;
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return undefined;

    // First ensure per PID runs a full name purge so stale duplicate trees from crash/reload cannot be rebound.
    if (!hasConquestCombatHudV2InitialPurgeCompleted(pid)) {
        destroyConquestCombatHudV2ForPid(pid);
        markConquestCombatHudV2InitialPurgeCompleted(pid);
    }

    const entry = ensureConquestCombatHudV2Entry(pid);
    const rootChain = ensureConquestCombatHudV2RootChainForPlayer(player, pid);
    if (!rootChain) return undefined;

    entry.widgets.topHudRoot = rootChain.topHudRoot;
    entry.widgets.combatRoot = rootChain.combatRoot;
    entry.widgets.ticketsRoot = rootChain.ticketsRoot;
    entry.widgets.ticketsLeftBarTrack = rootChain.ticketsLeftBarTrack;
    entry.widgets.ticketsLeftBarFill = rootChain.ticketsLeftBarFill;
    entry.widgets.ticketsRightBarTrack = rootChain.ticketsRightBarTrack;
    entry.widgets.ticketsRightBarFill = rootChain.ticketsRightBarFill;
    entry.widgets.ticketsFriendlyText = rootChain.ticketsFriendlyText;
    entry.widgets.ticketsEnemyText = rootChain.ticketsEnemyText;
    entry.widgets.ticketsSlashText = rootChain.ticketsSlashText;
    entry.widgets.ticketsLeadBorderLeft = rootChain.ticketsLeadBorderLeft;
    entry.widgets.ticketsLeadBorderRight = rootChain.ticketsLeadBorderRight;
    entry.widgets.ticketsBleedLeftChevrons = rootChain.ticketsBleedLeftChevrons;
    entry.widgets.ticketsBleedRightChevrons = rootChain.ticketsBleedRightChevrons;
    entry.widgets.flagsRoot = rootChain.flagsRoot;
    entry.widgets.flagsSlotRoots = rootChain.flagsSlotRoots;
    entry.widgets.flagsSlotFills = rootChain.flagsSlotFills;
    entry.widgets.flagsSlotLabels = rootChain.flagsSlotLabels;
    entry.widgets.activePopoutRoot = rootChain.activePopoutRoot;
    entry.widgets.activePopoutSlot = rootChain.activePopoutSlot;
    entry.widgets.activePopoutFill = rootChain.activePopoutFill;
    entry.widgets.activePopoutLabel = rootChain.activePopoutLabel;
    entry.widgets.activePopoutPercent = rootChain.activePopoutPercent;
    entry.widgets.engageRoot = rootChain.engageRoot;
    entry.widgets.engageTrack = rootChain.engageTrack;
    entry.widgets.engageFriendlyFill = rootChain.engageFriendlyFill;
    entry.widgets.engageEnemyFill = rootChain.engageEnemyFill;
    entry.widgets.engageFriendlyCount = rootChain.engageFriendlyCount;
    entry.widgets.engageEnemyCount = rootChain.engageEnemyCount;
    entry.widgets.engageStatus = rootChain.engageStatus;

    if (!entry.initialized) {
        entry.initialized = true;
        entry.telemetry.instanceCount = 59;
        entry.dirty = true;
        entry.animationDirty = true;
    }
    return entry;
}
