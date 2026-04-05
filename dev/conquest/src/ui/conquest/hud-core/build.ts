// @ts-nocheck
// Module: ui/conquest/hud-core/build -- build/repair owner for hard-cut combat HUD root graph

function twlConquestHudEnsureContainer(
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
        const parsed = safeParseUI({
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

// Applies solid background fill/alpha so surface widgets render consistently across runtimes.
function twlConquestHudApplySolidSurfaceStyle(widget: mod.UIWidget | undefined, alpha: number): void {
    if (!widget) return;
    try {
        mod.SetUIWidgetBgFill(widget, mod.UIBgFill.Solid);
    } catch {
        // Keep HUD alive if fill mode is unavailable.
    }
    safeSetUIWidgetBgAlpha(widget, alpha);
}

function twlConquestHudEnsureText(
    player: mod.Player,
    name: string,
    parent: mod.UIWidget,
    anchor: mod.UIAnchor,
    x: number,
    y: number,
    width: number,
    height: number,
    textSize: number,
    label: mod.Message,
    colorRgb: [number, number, number],
    colorVector: mod.Vector,
    textAnchor: mod.UIAnchor = mod.UIAnchor.Center
): mod.UIWidget | undefined {
    let widget = safeFind(name);
    let created = false;
    if (!widget) {
        const parsed = safeParseUI({
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
            textLabel: label,
            textColor: colorRgb,
            textAlpha: 1,
            textSize,
            textAnchor,
        });
        widget = parsed ?? safeFind(name);
        created = true;
    }
    if (!widget) return undefined;
    try {
        mod.SetUIWidgetParent(widget, parent);
        mod.SetUIWidgetAnchor(widget, anchor);
        mod.SetUIWidgetPosition(widget, mod.CreateVector(x, y, 0));
        mod.SetUIWidgetSize(widget, mod.CreateVector(width, height, 0));
        mod.SetUIWidgetDepth(widget, mod.UIDepth.AboveGameUI);
        mod.SetUITextSize(widget, textSize);
        mod.SetUITextAnchor(widget, textAnchor);
    } catch {
        return undefined;
    }
    // Build pass owns structure; render pass owns live text/value/color updates.
    // Write defaults only on first creation to avoid value flicker from repeated ensure passes.
    if (created) {
        safeSetUITextLabel(widget, label);
        safeSetUITextColor(widget, colorVector);
    }
    return widget;
}

// Ensures one reusable shadow-ring widget set for a text element using the provided profile offsets.
function twlConquestHudEnsureShadowRingText(
    player: mod.Player,
    baseName: string,
    parent: mod.UIWidget,
    anchor: mod.UIAnchor,
    baseX: number,
    baseY: number,
    width: number,
    height: number,
    textSize: number,
    label: mod.Message,
    profile: TwlConquestHudShadowLayerProfile[],
    textAnchor: mod.UIAnchor = mod.UIAnchor.Center
): Array<mod.UIWidget | undefined> | undefined {
    const layers: Array<mod.UIWidget | undefined> = [];
    for (let i = 0; i < profile.length; i++) {
        const layer = profile[i];
        const widget = twlConquestHudEnsureText(
            player,
            twlConquestHudShadowLayerName(baseName, layer.suffix),
            parent,
            anchor,
            baseX + layer.x,
            baseY + layer.y,
            width,
            height,
            textSize,
            label,
            [0, 0, 0],
            TWL_CONQUEST_HUD_COLOR_SHADOW,
            textAnchor
        );
        if (!widget) return undefined;
        layers[i] = widget;
    }
    return layers;
}

// Ensures an image widget exists for crown indicators and normalizes core transform/depth attributes.
function twlConquestHudEnsureImage(
    player: mod.Player,
    name: string,
    parent: mod.UIWidget,
    anchor: mod.UIAnchor,
    x: number,
    y: number,
    width: number,
    height: number,
    imageType: mod.UIImageType,
    imageColor: [number, number, number],
    imageAlpha: number
): mod.UIWidget | undefined {
    let widget = safeFind(name);
    if (!widget) {
        const parsed = safeParseUI({
            name,
            type: "Image",
            playerId: player,
            position: [x, y],
            size: [width, height],
            anchor,
            visible: false,
            padding: 0,
            bgAlpha: 0,
            bgFill: mod.UIBgFill.None,
            imageType,
            imageColor,
            imageAlpha,
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

function twlConquestHudEnsurePlayerGraph(player: mod.Player): TwlConquestHudPlayerEntry | undefined {
    if (!player || !mod.IsPlayerValid(player)) return undefined;
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return undefined;

    if (!twlConquestHudHasBootstrapPurgeDone(pid)) {
        // Keep first-build non-destructive in core mode; full purge passes are expensive and can delay initial UI responsiveness.
        twlConquestHudMarkBootstrapPurgeDone(pid);
    }

    const entry = twlConquestHudEnsureEntry(pid);
    const ticketLayout = twlConquestHudBuildTicketLayout();
    if (
        entry.initialized
        && entry.layoutFlagCount === ticketLayout.layoutFlagCount
    ) {
        return entry;
    }
    const topHudRoot = ensureTopHudRootForPid(pid, player) ?? safeFind(wn("TopHudRoot", pid));
    if (!topHudRoot) return undefined;
    const root = twlConquestHudEnsureContainer(
        player,
        twlConquestHudRootName(pid),
        topHudRoot,
        mod.UIAnchor.TopCenter,
        0,
        0,
        TWL_CONQUEST_HUD_ROOT_WIDTH,
        TWL_CONQUEST_HUD_ROOT_HEIGHT
    );
    if (!root) return undefined;

    const combatLane = twlConquestHudEnsureContainer(
        player,
        twlConquestHudCombatLaneName(pid),
        root,
        mod.UIAnchor.TopCenter,
        TWL_CONQUEST_HUD_COMBAT_X,
        TWL_CONQUEST_HUD_COMBAT_Y,
        TWL_CONQUEST_HUD_COMBAT_WIDTH,
        TWL_CONQUEST_HUD_COMBAT_HEIGHT
    );
    if (!combatLane) return undefined;

    const ticketsLane = twlConquestHudEnsureContainer(
        player,
        twlConquestHudTicketsLaneName(pid),
        combatLane,
        mod.UIAnchor.TopCenter,
        TWL_CONQUEST_HUD_TICKETS_X,
        TWL_CONQUEST_HUD_TICKETS_Y,
        TWL_CONQUEST_HUD_TICKETS_WIDTH,
        TWL_CONQUEST_HUD_TICKETS_HEIGHT
    );
    if (!ticketsLane) return undefined;

    const ticketBlueBox = twlConquestHudEnsureContainer(
        player,
        twlConquestHudTicketBlueBoxName(pid),
        ticketsLane,
        mod.UIAnchor.TopLeft,
        ticketLayout.blueCountX,
        TWL_CONQUEST_HUD_TICKET_BLUE_COUNT_Y,
        TWL_CONQUEST_HUD_TICKET_BOX_WIDTH,
        TWL_CONQUEST_HUD_TICKET_BOX_HEIGHT
    );
    if (!ticketBlueBox) return undefined;

    const ticketRedBox = twlConquestHudEnsureContainer(
        player,
        twlConquestHudTicketRedBoxName(pid),
        ticketsLane,
        mod.UIAnchor.TopLeft,
        ticketLayout.redCountX,
        TWL_CONQUEST_HUD_TICKET_RED_COUNT_Y,
        TWL_CONQUEST_HUD_TICKET_BOX_WIDTH,
        TWL_CONQUEST_HUD_TICKET_BOX_HEIGHT
    );
    if (!ticketRedBox) return undefined;

    try {
        mod.SetUIWidgetBgFill(ticketBlueBox, mod.UIBgFill.Blur);
        mod.SetUIWidgetBgFill(ticketRedBox, mod.UIBgFill.Blur);
    } catch {
        // Keep lane alive even if bg-fill API fails on this client/runtime.
    }
    safeSetUIWidgetBgColor(ticketBlueBox, TWL_CONQUEST_HUD_COLOR_BOX_BG);
    safeSetUIWidgetBgColor(ticketRedBox, TWL_CONQUEST_HUD_COLOR_BOX_BG);
    safeSetUIWidgetBgAlpha(ticketBlueBox, TWL_CONQUEST_HUD_TICKET_BOX_ALPHA);
    safeSetUIWidgetBgAlpha(ticketRedBox, TWL_CONQUEST_HUD_TICKET_BOX_ALPHA);

    const objectivesLane = twlConquestHudEnsureContainer(
        player,
        twlConquestHudObjectivesLaneName(pid),
        combatLane,
        mod.UIAnchor.TopCenter,
        TWL_CONQUEST_HUD_OBJECTIVES_X,
        TWL_CONQUEST_HUD_OBJECTIVES_Y,
        TWL_CONQUEST_HUD_OBJECTIVES_WIDTH,
        TWL_CONQUEST_HUD_OBJECTIVES_HEIGHT
    );
    if (!objectivesLane) return undefined;

    const ticketBlueCount = twlConquestHudEnsureText(
        player,
        twlConquestHudTicketBlueCountName(pid),
        ticketBlueBox,
        mod.UIAnchor.TopLeft,
        0,
        0,
        TWL_CONQUEST_HUD_TICKET_COUNT_WIDTH,
        TWL_CONQUEST_HUD_TICKET_COUNT_HEIGHT,
        TWL_CONQUEST_HUD_TICKET_COUNT_TEXT_SIZE,
        mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
        CONQUEST_HUD_TEXT_FRIENDLY_RGB,
        TWL_CONQUEST_HUD_COLOR_BLUE
    );
    if (!ticketBlueCount) return undefined;

    const ticketRedCount = twlConquestHudEnsureText(
        player,
        twlConquestHudTicketRedCountName(pid),
        ticketRedBox,
        mod.UIAnchor.TopLeft,
        0,
        0,
        TWL_CONQUEST_HUD_TICKET_COUNT_WIDTH,
        TWL_CONQUEST_HUD_TICKET_COUNT_HEIGHT,
        TWL_CONQUEST_HUD_TICKET_COUNT_TEXT_SIZE,
        mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
        CONQUEST_HUD_TEXT_ENEMY_RGB,
        TWL_CONQUEST_HUD_COLOR_RED
    );
    if (!ticketRedCount) return undefined;

    const ticketBlueTeamNameShadowRing = twlConquestHudEnsureShadowRingText(
        player,
        twlConquestHudTicketBlueTeamNameName(pid),
        root,
        mod.UIAnchor.TopCenter,
        twlConquestHudGetTicketBlueTeamLabelRootX(ticketLayout),
        TWL_CONQUEST_HUD_TICKET_TEAM_LABEL_ROOT_Y,
        TWL_CONQUEST_HUD_TICKET_TEAM_LABEL_WIDTH,
        TWL_CONQUEST_HUD_TICKET_TEAM_LABEL_HEIGHT,
        TWL_CONQUEST_HUD_TICKET_TEAM_LABEL_TEXT_SIZE,
        mod.Message(getTeamNameKey(TeamID.Team1)),
        TWL_CONQUEST_HUD_SHADOW_RING_PROFILE_TEAM_LABEL,
        mod.UIAnchor.CenterRight
    );
    if (!ticketBlueTeamNameShadowRing) return undefined;

    const ticketBlueTeamLabel = twlConquestHudEnsureText(
        player,
        twlConquestHudTicketBlueTeamNameName(pid),
        root,
        mod.UIAnchor.TopCenter,
        twlConquestHudGetTicketBlueTeamLabelRootX(ticketLayout),
        TWL_CONQUEST_HUD_TICKET_TEAM_LABEL_ROOT_Y,
        TWL_CONQUEST_HUD_TICKET_TEAM_LABEL_WIDTH,
        TWL_CONQUEST_HUD_TICKET_TEAM_LABEL_HEIGHT,
        TWL_CONQUEST_HUD_TICKET_TEAM_LABEL_TEXT_SIZE,
        mod.Message(getTeamNameKey(TeamID.Team1)),
        CONQUEST_HUD_TEXT_FRIENDLY_RGB,
        TWL_CONQUEST_HUD_COLOR_BLUE,
        mod.UIAnchor.CenterRight
    );
    if (!ticketBlueTeamLabel) return undefined;

    const ticketRedTeamNameShadowRing = twlConquestHudEnsureShadowRingText(
        player,
        twlConquestHudTicketRedTeamNameName(pid),
        root,
        mod.UIAnchor.TopCenter,
        twlConquestHudGetTicketRedTeamLabelRootX(ticketLayout),
        TWL_CONQUEST_HUD_TICKET_TEAM_LABEL_ROOT_Y,
        TWL_CONQUEST_HUD_TICKET_TEAM_LABEL_WIDTH,
        TWL_CONQUEST_HUD_TICKET_TEAM_LABEL_HEIGHT,
        TWL_CONQUEST_HUD_TICKET_TEAM_LABEL_TEXT_SIZE,
        mod.Message(getTeamNameKey(TeamID.Team2)),
        TWL_CONQUEST_HUD_SHADOW_RING_PROFILE_TEAM_LABEL,
        mod.UIAnchor.CenterLeft
    );
    if (!ticketRedTeamNameShadowRing) return undefined;

    const ticketRedTeamLabel = twlConquestHudEnsureText(
        player,
        twlConquestHudTicketRedTeamNameName(pid),
        root,
        mod.UIAnchor.TopCenter,
        twlConquestHudGetTicketRedTeamLabelRootX(ticketLayout),
        TWL_CONQUEST_HUD_TICKET_TEAM_LABEL_ROOT_Y,
        TWL_CONQUEST_HUD_TICKET_TEAM_LABEL_WIDTH,
        TWL_CONQUEST_HUD_TICKET_TEAM_LABEL_HEIGHT,
        TWL_CONQUEST_HUD_TICKET_TEAM_LABEL_TEXT_SIZE,
        mod.Message(getTeamNameKey(TeamID.Team2)),
        CONQUEST_HUD_TEXT_ENEMY_RGB,
        TWL_CONQUEST_HUD_COLOR_RED,
        mod.UIAnchor.CenterLeft
    );
    if (!ticketRedTeamLabel) return undefined;

    const ticketSlash = twlConquestHudEnsureText(
        player,
        twlConquestHudTicketSlashName(pid),
        ticketsLane,
        mod.UIAnchor.TopLeft,
        TWL_CONQUEST_HUD_TICKET_SLASH_X,
        TWL_CONQUEST_HUD_TICKET_SLASH_Y,
        TWL_CONQUEST_HUD_TICKET_SLASH_WIDTH,
        TWL_CONQUEST_HUD_TICKET_SLASH_HEIGHT,
        TWL_CONQUEST_HUD_TICKET_SLASH_TEXT_SIZE,
        mod.Message(mod.stringkeys.twl.system.slash),
        CONQUEST_HUD_TEXT_NEUTRAL_RGB,
        TWL_CONQUEST_HUD_COLOR_WHITE
    );
    if (!ticketSlash) return undefined;

    const ticketBlueBarTrack = twlConquestHudEnsureContainer(
        player,
        twlConquestHudTicketBlueBarTrackName(pid),
        ticketsLane,
        mod.UIAnchor.TopLeft,
        ticketLayout.blueBarX,
        TWL_CONQUEST_HUD_TICKET_BLUE_BAR_Y,
        TWL_CONQUEST_HUD_TICKET_BAR_WIDTH,
        TWL_CONQUEST_HUD_TICKET_BAR_HEIGHT
    );
    if (!ticketBlueBarTrack) return undefined;
    const ticketBlueBarFill = twlConquestHudEnsureContainer(
        player,
        twlConquestHudTicketBlueBarFillName(pid),
        ticketBlueBarTrack,
        mod.UIAnchor.TopLeft,
        0,
        0,
        TWL_CONQUEST_HUD_TICKET_BAR_WIDTH,
        TWL_CONQUEST_HUD_TICKET_BAR_HEIGHT
    );
    if (!ticketBlueBarFill) return undefined;

    const ticketRedBarTrack = twlConquestHudEnsureContainer(
        player,
        twlConquestHudTicketRedBarTrackName(pid),
        ticketsLane,
        mod.UIAnchor.TopLeft,
        ticketLayout.redBarX,
        TWL_CONQUEST_HUD_TICKET_RED_BAR_Y,
        TWL_CONQUEST_HUD_TICKET_BAR_WIDTH,
        TWL_CONQUEST_HUD_TICKET_BAR_HEIGHT
    );
    if (!ticketRedBarTrack) return undefined;
    const ticketRedBarFill = twlConquestHudEnsureContainer(
        player,
        twlConquestHudTicketRedBarFillName(pid),
        ticketRedBarTrack,
        mod.UIAnchor.TopLeft,
        0,
        0,
        TWL_CONQUEST_HUD_TICKET_BAR_WIDTH,
        TWL_CONQUEST_HUD_TICKET_BAR_HEIGHT
    );
    if (!ticketRedBarFill) return undefined;

    const ticketLeadBorderLeft = twlConquestHudEnsureContainer(
        player,
        twlConquestHudTicketLeadBorderLeftName(pid),
        ticketsLane,
        mod.UIAnchor.TopLeft,
        ticketLayout.blueCountX - TWL_CONQUEST_HUD_TICKET_LEAD_BORDER_GROW,
        TWL_CONQUEST_HUD_TICKET_BLUE_COUNT_Y - TWL_CONQUEST_HUD_TICKET_LEAD_BORDER_GROW,
        TWL_CONQUEST_HUD_TICKET_BOX_WIDTH + (TWL_CONQUEST_HUD_TICKET_LEAD_BORDER_GROW * 2),
        TWL_CONQUEST_HUD_TICKET_BOX_HEIGHT + (TWL_CONQUEST_HUD_TICKET_LEAD_BORDER_GROW * 2)
    );
    if (!ticketLeadBorderLeft) return undefined;

    const ticketLeadBorderRight = twlConquestHudEnsureContainer(
        player,
        twlConquestHudTicketLeadBorderRightName(pid),
        ticketsLane,
        mod.UIAnchor.TopLeft,
        ticketLayout.redCountX - TWL_CONQUEST_HUD_TICKET_LEAD_BORDER_GROW,
        TWL_CONQUEST_HUD_TICKET_RED_COUNT_Y - TWL_CONQUEST_HUD_TICKET_LEAD_BORDER_GROW,
        TWL_CONQUEST_HUD_TICKET_BOX_WIDTH + (TWL_CONQUEST_HUD_TICKET_LEAD_BORDER_GROW * 2),
        TWL_CONQUEST_HUD_TICKET_BOX_HEIGHT + (TWL_CONQUEST_HUD_TICKET_LEAD_BORDER_GROW * 2)
    );
    if (!ticketLeadBorderRight) return undefined;

    try {
        mod.SetUIWidgetBgFill(ticketLeadBorderLeft, mod.UIBgFill.OutlineThin);
        mod.SetUIWidgetBgFill(ticketLeadBorderRight, mod.UIBgFill.OutlineThin);
    } catch {
        // Optional polish surface; keep HUD alive if outline fill cannot be set.
    }
    safeSetUIWidgetBgAlpha(ticketLeadBorderLeft, TWL_CONQUEST_HUD_TICKET_LEAD_BORDER_ALPHA);
    safeSetUIWidgetBgAlpha(ticketLeadBorderRight, TWL_CONQUEST_HUD_TICKET_LEAD_BORDER_ALPHA);
    safeSetUIWidgetBgColor(ticketLeadBorderLeft, TWL_CONQUEST_HUD_COLOR_BLUE);
    safeSetUIWidgetBgColor(ticketLeadBorderRight, TWL_CONQUEST_HUD_COLOR_RED);

    const ticketLeadCrownLeftShadow = twlConquestHudEnsureImage(
        player,
        twlConquestHudTicketLeadCrownLeftShadowName(pid),
        ticketsLane,
        mod.UIAnchor.TopLeft,
        ticketLayout.leadLeftCrownShadowX,
        TWL_CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_Y,
        TWL_CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_SIZE,
        TWL_CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_SIZE,
        mod.UIImageType.CrownSolid,
        CONQUEST_HUD_FLAG_LABEL_ACTIVE_RGB,
        TWL_CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_ALPHA
    );
    if (!ticketLeadCrownLeftShadow) return undefined;

    const ticketLeadCrownRightShadow = twlConquestHudEnsureImage(
        player,
        twlConquestHudTicketLeadCrownRightShadowName(pid),
        ticketsLane,
        mod.UIAnchor.TopLeft,
        ticketLayout.leadRightCrownShadowX,
        TWL_CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_Y,
        TWL_CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_SIZE,
        TWL_CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_SIZE,
        mod.UIImageType.CrownSolid,
        CONQUEST_HUD_FLAG_LABEL_ACTIVE_RGB,
        TWL_CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_ALPHA
    );
    if (!ticketLeadCrownRightShadow) return undefined;

    const ticketLeadCrownLeft = twlConquestHudEnsureImage(
        player,
        twlConquestHudTicketLeadCrownLeftName(pid),
        ticketsLane,
        mod.UIAnchor.TopLeft,
        ticketLayout.leadLeftCrownX,
        TWL_CONQUEST_HUD_TICKET_LEAD_CROWN_Y,
        TWL_CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE,
        TWL_CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE,
        mod.UIImageType.CrownSolid,
        CONQUEST_HUD_TICKET_LEAD_CROWN_RGB,
        1
    );
    if (!ticketLeadCrownLeft) return undefined;

    const ticketLeadCrownRight = twlConquestHudEnsureImage(
        player,
        twlConquestHudTicketLeadCrownRightName(pid),
        ticketsLane,
        mod.UIAnchor.TopLeft,
        ticketLayout.leadRightCrownX,
        TWL_CONQUEST_HUD_TICKET_LEAD_CROWN_Y,
        TWL_CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE,
        TWL_CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE,
        mod.UIImageType.CrownSolid,
        CONQUEST_HUD_TICKET_LEAD_CROWN_RGB,
        1
    );
    if (!ticketLeadCrownRight) return undefined;

    const ticketBleedLeftChevronShadowRings: Array<Array<mod.UIWidget | undefined>> = [];
    const ticketBleedRightChevronShadowRings: Array<Array<mod.UIWidget | undefined>> = [];
    const ticketBleedLeftChevrons: Array<mod.UIWidget | undefined> = [];
    const ticketBleedRightChevrons: Array<mod.UIWidget | undefined> = [];
    for (let i = 0; i < TWL_CONQUEST_HUD_TICKET_BLEED_CHEVRON_COUNT; i++) {
        const leftChevronShadowRing = twlConquestHudEnsureShadowRingText(
            player,
            twlConquestHudTicketBleedChevronLeftName(pid, i),
            ticketsLane,
            mod.UIAnchor.TopLeft,
            ticketLayout.bleedLeftStartX + (i * TWL_CONQUEST_HUD_TICKET_BLEED_STEP_X),
            TWL_CONQUEST_HUD_TICKET_BLEED_CHEVRON_Y,
            TWL_CONQUEST_HUD_TICKET_BLEED_CHEVRON_WIDTH,
            TWL_CONQUEST_HUD_TICKET_BLEED_CHEVRON_HEIGHT,
            TWL_CONQUEST_HUD_TICKET_BLEED_CHEVRON_TEXT_SIZE,
            mod.Message(STR_HUD_CONQUEST_BLEED_CHEVRON_LEFT),
            TWL_CONQUEST_HUD_SHADOW_RING_PROFILE_CHEVRON
        );
        if (!leftChevronShadowRing) return undefined;
        const leftChevron = twlConquestHudEnsureText(
            player,
            twlConquestHudTicketBleedChevronLeftName(pid, i),
            ticketsLane,
            mod.UIAnchor.TopLeft,
            ticketLayout.bleedLeftStartX + (i * TWL_CONQUEST_HUD_TICKET_BLEED_STEP_X),
            TWL_CONQUEST_HUD_TICKET_BLEED_CHEVRON_Y,
            TWL_CONQUEST_HUD_TICKET_BLEED_CHEVRON_WIDTH,
            TWL_CONQUEST_HUD_TICKET_BLEED_CHEVRON_HEIGHT,
            TWL_CONQUEST_HUD_TICKET_BLEED_CHEVRON_TEXT_SIZE,
            mod.Message(STR_HUD_CONQUEST_BLEED_CHEVRON_LEFT),
            CONQUEST_HUD_TICKET_BLEED_CHEVRON_FRIENDLY_RGB,
            TWL_CONQUEST_HUD_COLOR_BLUE
        );
        if (!leftChevron) return undefined;
        ticketBleedLeftChevronShadowRings[i] = leftChevronShadowRing;
        ticketBleedLeftChevrons[i] = leftChevron;

        const rightChevronShadowRing = twlConquestHudEnsureShadowRingText(
            player,
            twlConquestHudTicketBleedChevronRightName(pid, i),
            ticketsLane,
            mod.UIAnchor.TopLeft,
            ticketLayout.bleedRightStartX - (i * TWL_CONQUEST_HUD_TICKET_BLEED_STEP_X),
            TWL_CONQUEST_HUD_TICKET_BLEED_CHEVRON_Y,
            TWL_CONQUEST_HUD_TICKET_BLEED_CHEVRON_WIDTH,
            TWL_CONQUEST_HUD_TICKET_BLEED_CHEVRON_HEIGHT,
            TWL_CONQUEST_HUD_TICKET_BLEED_CHEVRON_TEXT_SIZE,
            mod.Message(STR_HUD_CONQUEST_BLEED_CHEVRON_RIGHT),
            TWL_CONQUEST_HUD_SHADOW_RING_PROFILE_CHEVRON
        );
        if (!rightChevronShadowRing) return undefined;
        const rightChevron = twlConquestHudEnsureText(
            player,
            twlConquestHudTicketBleedChevronRightName(pid, i),
            ticketsLane,
            mod.UIAnchor.TopLeft,
            ticketLayout.bleedRightStartX - (i * TWL_CONQUEST_HUD_TICKET_BLEED_STEP_X),
            TWL_CONQUEST_HUD_TICKET_BLEED_CHEVRON_Y,
            TWL_CONQUEST_HUD_TICKET_BLEED_CHEVRON_WIDTH,
            TWL_CONQUEST_HUD_TICKET_BLEED_CHEVRON_HEIGHT,
            TWL_CONQUEST_HUD_TICKET_BLEED_CHEVRON_TEXT_SIZE,
            mod.Message(STR_HUD_CONQUEST_BLEED_CHEVRON_RIGHT),
            CONQUEST_HUD_TICKET_BLEED_CHEVRON_ENEMY_RGB,
            TWL_CONQUEST_HUD_COLOR_RED
        );
        if (!rightChevron) return undefined;
        ticketBleedRightChevronShadowRings[i] = rightChevronShadowRing;
        ticketBleedRightChevrons[i] = rightChevron;
    }

    safeSetUIWidgetBgColor(ticketBlueBarTrack, TWL_CONQUEST_HUD_COLOR_TICKET_BAR_BLUE_TRACK);
    safeSetUIWidgetBgAlpha(ticketBlueBarTrack, TWL_CONQUEST_HUD_TICKET_BAR_TRACK_ALPHA);
    safeSetUIWidgetBgColor(ticketBlueBarFill, TWL_CONQUEST_HUD_COLOR_TICKET_BAR_BLUE_FILL);
    safeSetUIWidgetBgAlpha(ticketBlueBarFill, TWL_CONQUEST_HUD_TICKET_BAR_FILL_ALPHA);
    safeSetUIWidgetBgColor(ticketRedBarTrack, TWL_CONQUEST_HUD_COLOR_TICKET_BAR_RED_TRACK);
    safeSetUIWidgetBgAlpha(ticketRedBarTrack, TWL_CONQUEST_HUD_TICKET_BAR_TRACK_ALPHA);
    safeSetUIWidgetBgColor(ticketRedBarFill, TWL_CONQUEST_HUD_COLOR_TICKET_BAR_RED_FILL);
    safeSetUIWidgetBgAlpha(ticketRedBarFill, TWL_CONQUEST_HUD_TICKET_BAR_FILL_ALPHA);
    twlConquestHudApplySolidSurfaceStyle(ticketBlueBarTrack, TWL_CONQUEST_HUD_TICKET_BAR_TRACK_ALPHA);
    twlConquestHudApplySolidSurfaceStyle(ticketBlueBarFill, TWL_CONQUEST_HUD_TICKET_BAR_FILL_ALPHA);
    twlConquestHudApplySolidSurfaceStyle(ticketRedBarTrack, TWL_CONQUEST_HUD_TICKET_BAR_TRACK_ALPHA);
    twlConquestHudApplySolidSurfaceStyle(ticketRedBarFill, TWL_CONQUEST_HUD_TICKET_BAR_FILL_ALPHA);

    const objectiveSlotRoots: Array<mod.UIWidget | undefined> = [];
    const objectiveSlotBorders: Array<mod.UIWidget | undefined> = [];
    const objectiveSlotFills: Array<mod.UIWidget | undefined> = [];
    const objectiveSlotLabelShadowRings: Array<Array<mod.UIWidget | undefined>> = [];
    const objectiveSlotLabels: Array<mod.UIWidget | undefined> = [];
    const objectiveSlotPercentShadowRings: Array<Array<mod.UIWidget | undefined>> = [];
    const objectiveSlotPercents: Array<mod.UIWidget | undefined> = [];
    for (let i = 0; i < TWL_CONQUEST_HUD_OBJECTIVE_SLOT_COUNT; i++) {
        const slotRoot = twlConquestHudEnsureContainer(
            player,
            twlConquestHudObjectiveSlotName(pid, i),
            objectivesLane,
            mod.UIAnchor.TopLeft,
            TWL_CONQUEST_HUD_OBJECTIVE_SLOT_X_BY_INDEX[i],
            TWL_CONQUEST_HUD_OBJECTIVE_SLOT_Y,
            TWL_CONQUEST_HUD_OBJECTIVE_SLOT_WIDTH,
            TWL_CONQUEST_HUD_OBJECTIVE_SLOT_HEIGHT
        );
        if (!slotRoot) return undefined;
        twlConquestHudApplySolidSurfaceStyle(slotRoot, TWL_CONQUEST_HUD_OBJECTIVE_SLOT_ALPHA);
        safeSetUIWidgetBgColor(slotRoot, TWL_CONQUEST_HUD_COLOR_TRACK);

        const slotBorder = twlConquestHudEnsureContainer(
            player,
            twlConquestHudObjectiveBorderName(pid, i),
            slotRoot,
            mod.UIAnchor.TopLeft,
            0,
            0,
            TWL_CONQUEST_HUD_OBJECTIVE_SLOT_WIDTH,
            TWL_CONQUEST_HUD_OBJECTIVE_SLOT_HEIGHT
        );
        if (!slotBorder) return undefined;
        try {
            mod.SetUIWidgetBgFill(slotBorder, mod.UIBgFill.OutlineThin);
        } catch {
            // Optional border style; keep layout intact without the fill mode.
        }
        safeSetUIWidgetBgAlpha(slotBorder, TWL_CONQUEST_HUD_OBJECTIVE_BORDER_ALPHA);

        const slotFill = twlConquestHudEnsureContainer(
            player,
            twlConquestHudObjectiveFillName(pid, i),
            slotRoot,
            mod.UIAnchor.TopLeft,
            TWL_CONQUEST_HUD_OBJECTIVE_FILL_INSET_X,
            TWL_CONQUEST_HUD_OBJECTIVE_FILL_INSET_Y,
            TWL_CONQUEST_HUD_OBJECTIVE_FILL_WIDTH,
            TWL_CONQUEST_HUD_OBJECTIVE_FILL_HEIGHT
        );
        if (!slotFill) return undefined;
        twlConquestHudApplySolidSurfaceStyle(slotFill, TWL_CONQUEST_HUD_OBJECTIVE_FILL_ALPHA);
        const slotLabelShadowRing = twlConquestHudEnsureShadowRingText(
            player,
            twlConquestHudObjectiveLabelName(pid, i),
            slotRoot,
            mod.UIAnchor.TopLeft,
            0,
            0,
            TWL_CONQUEST_HUD_OBJECTIVE_SLOT_WIDTH,
            TWL_CONQUEST_HUD_OBJECTIVE_SLOT_HEIGHT,
            TWL_CONQUEST_HUD_OBJECTIVE_LABEL_TEXT_SIZE,
            mod.Message(STR_HUD_CONQUEST_FLAG_LETTER_UNKNOWN),
            TWL_CONQUEST_HUD_SHADOW_RING_PROFILE_OBJECTIVE_LABEL
        );
        if (!slotLabelShadowRing) return undefined;
        const slotLabel = twlConquestHudEnsureText(
            player,
            twlConquestHudObjectiveLabelName(pid, i),
            slotRoot,
            mod.UIAnchor.TopLeft,
            0,
            0,
            TWL_CONQUEST_HUD_OBJECTIVE_SLOT_WIDTH,
            TWL_CONQUEST_HUD_OBJECTIVE_SLOT_HEIGHT,
            TWL_CONQUEST_HUD_OBJECTIVE_LABEL_TEXT_SIZE,
            mod.Message("?"),
            CONQUEST_HUD_TEXT_NEUTRAL_RGB,
            TWL_CONQUEST_HUD_COLOR_WHITE
        );
        if (!slotLabel) return undefined;
        try {
            mod.SetUIWidgetParent(slotLabel, slotRoot);
        } catch {
            return undefined;
        }

        const slotPercentShadowRing = twlConquestHudEnsureShadowRingText(
            player,
            twlConquestHudObjectivePercentName(pid, i),
            objectivesLane,
            mod.UIAnchor.TopLeft,
            TWL_CONQUEST_HUD_OBJECTIVE_SLOT_X_BY_INDEX[i],
            TWL_CONQUEST_HUD_OBJECTIVE_SLOT_Y + TWL_CONQUEST_HUD_OBJECTIVE_PERCENT_Y,
            TWL_CONQUEST_HUD_OBJECTIVE_PERCENT_WIDTH,
            TWL_CONQUEST_HUD_OBJECTIVE_PERCENT_HEIGHT,
            TWL_CONQUEST_HUD_OBJECTIVE_PERCENT_TEXT_SIZE,
            mod.Message(STR_SYSTEM_GENERIC_PERCENT, 0),
            TWL_CONQUEST_HUD_SHADOW_RING_PROFILE_PERCENT
        );
        if (!slotPercentShadowRing) return undefined;
        const slotPercent = twlConquestHudEnsureText(
            player,
            twlConquestHudObjectivePercentName(pid, i),
            objectivesLane,
            mod.UIAnchor.TopLeft,
            TWL_CONQUEST_HUD_OBJECTIVE_SLOT_X_BY_INDEX[i],
            TWL_CONQUEST_HUD_OBJECTIVE_SLOT_Y + TWL_CONQUEST_HUD_OBJECTIVE_PERCENT_Y,
            TWL_CONQUEST_HUD_OBJECTIVE_PERCENT_WIDTH,
            TWL_CONQUEST_HUD_OBJECTIVE_PERCENT_HEIGHT,
            TWL_CONQUEST_HUD_OBJECTIVE_PERCENT_TEXT_SIZE,
            mod.Message(STR_SYSTEM_GENERIC_PERCENT, 0),
            CONQUEST_HUD_TEXT_NEUTRAL_RGB,
            TWL_CONQUEST_HUD_COLOR_WHITE
        );
        if (!slotPercent) return undefined;
        try {
            mod.SetUIWidgetBgFill(slotPercent, mod.UIBgFill.Blur);
        } catch {
            // Optional percent-chip blur; keep HUD alive if fill mode is unavailable.
        }
        safeSetUIWidgetBgColor(slotPercent, TWL_CONQUEST_HUD_COLOR_BOX_BG);
        safeSetUIWidgetBgAlpha(slotPercent, TWL_CONQUEST_HUD_PERCENT_BG_ALPHA);

        objectiveSlotRoots[i] = slotRoot;
        objectiveSlotBorders[i] = slotBorder;
        objectiveSlotFills[i] = slotFill;
        objectiveSlotLabelShadowRings[i] = slotLabelShadowRing;
        objectiveSlotLabels[i] = slotLabel;
        objectiveSlotPercentShadowRings[i] = slotPercentShadowRing;
        objectiveSlotPercents[i] = slotPercent;
    }

    const popoutRoot = twlConquestHudEnsureContainer(
        player,
        twlConquestHudPopoutRootName(pid),
        objectivesLane,
        mod.UIAnchor.TopLeft,
        TWL_CONQUEST_HUD_POPOUT_ROOT_X,
        TWL_CONQUEST_HUD_POPOUT_ROOT_Y,
        TWL_CONQUEST_HUD_POPOUT_ROOT_WIDTH,
        TWL_CONQUEST_HUD_POPOUT_ROOT_HEIGHT
    );
    if (!popoutRoot) return undefined;

    const popoutSlot = twlConquestHudEnsureContainer(
        player,
        twlConquestHudPopoutSlotName(pid),
        popoutRoot,
        mod.UIAnchor.TopLeft,
        TWL_CONQUEST_HUD_POPOUT_SLOT_X,
        TWL_CONQUEST_HUD_POPOUT_SLOT_Y,
        TWL_CONQUEST_HUD_POPOUT_SLOT_WIDTH,
        TWL_CONQUEST_HUD_POPOUT_SLOT_HEIGHT
    );
    if (!popoutSlot) return undefined;
    twlConquestHudApplySolidSurfaceStyle(popoutSlot, TWL_CONQUEST_HUD_POPOUT_SLOT_ALPHA);

    const popoutBorder = twlConquestHudEnsureContainer(
        player,
        twlConquestHudPopoutBorderName(pid),
        popoutSlot,
        mod.UIAnchor.TopLeft,
        0,
        0,
        TWL_CONQUEST_HUD_POPOUT_SLOT_WIDTH,
        TWL_CONQUEST_HUD_POPOUT_SLOT_HEIGHT
    );
    if (!popoutBorder) return undefined;
    try {
        mod.SetUIWidgetBgFill(popoutBorder, mod.UIBgFill.OutlineThin);
    } catch {
        // Optional border fill.
    }
    safeSetUIWidgetBgAlpha(popoutBorder, TWL_CONQUEST_HUD_POPOUT_BORDER_ALPHA);

    const popoutFill = twlConquestHudEnsureContainer(
        player,
        twlConquestHudPopoutFillName(pid),
        popoutSlot,
        mod.UIAnchor.TopLeft,
        TWL_CONQUEST_HUD_POPOUT_FILL_X,
        TWL_CONQUEST_HUD_POPOUT_FILL_Y,
        TWL_CONQUEST_HUD_POPOUT_FILL_WIDTH,
        TWL_CONQUEST_HUD_POPOUT_FILL_HEIGHT
    );
    if (!popoutFill) return undefined;
    twlConquestHudApplySolidSurfaceStyle(popoutFill, TWL_CONQUEST_HUD_POPOUT_FILL_ALPHA);

    const popoutLabelShadowRing = twlConquestHudEnsureShadowRingText(
        player,
        twlConquestHudPopoutLabelName(pid),
        popoutSlot,
        mod.UIAnchor.TopLeft,
        0,
        0,
        TWL_CONQUEST_HUD_POPOUT_SLOT_WIDTH,
        TWL_CONQUEST_HUD_POPOUT_SLOT_HEIGHT,
        TWL_CONQUEST_HUD_POPOUT_LABEL_TEXT_SIZE,
        mod.Message(STR_HUD_CONQUEST_FLAG_LETTER_UNKNOWN),
        TWL_CONQUEST_HUD_SHADOW_RING_PROFILE_POPOUT_LABEL
    );
    if (!popoutLabelShadowRing) return undefined;
    const popoutLabel = twlConquestHudEnsureText(
        player,
        twlConquestHudPopoutLabelName(pid),
        popoutSlot,
        mod.UIAnchor.TopLeft,
        0,
        0,
        TWL_CONQUEST_HUD_POPOUT_SLOT_WIDTH,
        TWL_CONQUEST_HUD_POPOUT_SLOT_HEIGHT,
        TWL_CONQUEST_HUD_POPOUT_LABEL_TEXT_SIZE,
        mod.Message(STR_HUD_CONQUEST_FLAG_LETTER_UNKNOWN),
        CONQUEST_HUD_TEXT_NEUTRAL_RGB,
        TWL_CONQUEST_HUD_COLOR_WHITE
    );
    if (!popoutLabel) return undefined;

    const popoutPercentShadowRing = twlConquestHudEnsureShadowRingText(
        player,
        twlConquestHudPopoutPercentName(pid),
        popoutRoot,
        mod.UIAnchor.TopLeft,
        TWL_CONQUEST_HUD_POPOUT_PERCENT_X,
        TWL_CONQUEST_HUD_POPOUT_PERCENT_Y,
        TWL_CONQUEST_HUD_POPOUT_PERCENT_WIDTH,
        TWL_CONQUEST_HUD_POPOUT_PERCENT_HEIGHT,
        TWL_CONQUEST_HUD_POPOUT_PERCENT_TEXT_SIZE,
        mod.Message(STR_SYSTEM_GENERIC_PERCENT, 0),
        TWL_CONQUEST_HUD_SHADOW_RING_PROFILE_POPOUT_PERCENT
    );
    if (!popoutPercentShadowRing) return undefined;
    const popoutPercent = twlConquestHudEnsureText(
        player,
        twlConquestHudPopoutPercentName(pid),
        popoutRoot,
        mod.UIAnchor.TopLeft,
        TWL_CONQUEST_HUD_POPOUT_PERCENT_X,
        TWL_CONQUEST_HUD_POPOUT_PERCENT_Y,
        TWL_CONQUEST_HUD_POPOUT_PERCENT_WIDTH,
        TWL_CONQUEST_HUD_POPOUT_PERCENT_HEIGHT,
        TWL_CONQUEST_HUD_POPOUT_PERCENT_TEXT_SIZE,
        mod.Message(STR_SYSTEM_GENERIC_PERCENT, 0),
        CONQUEST_HUD_TEXT_NEUTRAL_RGB,
        TWL_CONQUEST_HUD_COLOR_WHITE
    );
    if (!popoutPercent) return undefined;
    try {
        mod.SetUIWidgetBgFill(popoutPercent, mod.UIBgFill.Blur);
    } catch {
        // Optional percent-chip blur; keep HUD alive if fill mode is unavailable.
    }
    safeSetUIWidgetBgColor(popoutPercent, TWL_CONQUEST_HUD_COLOR_BOX_BG);
    safeSetUIWidgetBgAlpha(popoutPercent, TWL_CONQUEST_HUD_PERCENT_BG_ALPHA);

    safeSetUIWidgetBgColor(popoutSlot, TWL_CONQUEST_HUD_COLOR_TRACK);
    safeSetUIWidgetBgColor(popoutFill, TWL_CONQUEST_HUD_COLOR_TRACK);

    const engageRoot = twlConquestHudEnsureContainer(
        player,
        twlConquestHudEngageRootName(pid),
        objectivesLane,
        mod.UIAnchor.TopLeft,
        TWL_CONQUEST_HUD_ENGAGE_ROOT_X,
        TWL_CONQUEST_HUD_ENGAGE_ROOT_Y,
        TWL_CONQUEST_HUD_ENGAGE_ROOT_WIDTH,
        TWL_CONQUEST_HUD_ENGAGE_ROOT_HEIGHT
    );
    if (!engageRoot) return undefined;

    const engageTrack = twlConquestHudEnsureContainer(
        player,
        twlConquestHudEngageTrackName(pid),
        engageRoot,
        mod.UIAnchor.TopLeft,
        TWL_CONQUEST_HUD_ENGAGE_TRACK_X,
        TWL_CONQUEST_HUD_ENGAGE_TRACK_Y,
        TWL_CONQUEST_HUD_ENGAGE_TRACK_WIDTH,
        TWL_CONQUEST_HUD_ENGAGE_TRACK_HEIGHT
    );
    if (!engageTrack) return undefined;
    twlConquestHudApplySolidSurfaceStyle(engageTrack, TWL_CONQUEST_HUD_ENGAGE_TRACK_ALPHA);

    const engageFriendlyFill = twlConquestHudEnsureContainer(
        player,
        twlConquestHudEngageFriendlyFillName(pid),
        engageTrack,
        mod.UIAnchor.TopLeft,
        0,
        0,
        Math.floor(TWL_CONQUEST_HUD_ENGAGE_TRACK_WIDTH / 2),
        TWL_CONQUEST_HUD_ENGAGE_TRACK_HEIGHT
    );
    if (!engageFriendlyFill) return undefined;
    twlConquestHudApplySolidSurfaceStyle(engageFriendlyFill, TWL_CONQUEST_HUD_ENGAGE_FILL_ALPHA);

    const engageEnemyFill = twlConquestHudEnsureContainer(
        player,
        twlConquestHudEngageEnemyFillName(pid),
        engageTrack,
        mod.UIAnchor.TopLeft,
        Math.floor(TWL_CONQUEST_HUD_ENGAGE_TRACK_WIDTH / 2),
        0,
        TWL_CONQUEST_HUD_ENGAGE_TRACK_WIDTH - Math.floor(TWL_CONQUEST_HUD_ENGAGE_TRACK_WIDTH / 2),
        TWL_CONQUEST_HUD_ENGAGE_TRACK_HEIGHT
    );
    if (!engageEnemyFill) return undefined;
    twlConquestHudApplySolidSurfaceStyle(engageEnemyFill, TWL_CONQUEST_HUD_ENGAGE_FILL_ALPHA);

    const engageFriendlyCountShadowRing = twlConquestHudEnsureShadowRingText(
        player,
        twlConquestHudEngageFriendlyCountName(pid),
        engageRoot,
        mod.UIAnchor.TopLeft,
        TWL_CONQUEST_HUD_ENGAGE_FRIENDLY_COUNT_X,
        TWL_CONQUEST_HUD_ENGAGE_COUNT_Y,
        TWL_CONQUEST_HUD_ENGAGE_COUNT_WIDTH,
        TWL_CONQUEST_HUD_ENGAGE_COUNT_HEIGHT,
        TWL_CONQUEST_HUD_ENGAGE_COUNT_TEXT_SIZE,
        mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
        TWL_CONQUEST_HUD_SHADOW_RING_PROFILE_ENGAGE_COUNT
    );
    if (!engageFriendlyCountShadowRing) return undefined;
    const engageFriendlyCount = twlConquestHudEnsureText(
        player,
        twlConquestHudEngageFriendlyCountName(pid),
        engageRoot,
        mod.UIAnchor.TopLeft,
        TWL_CONQUEST_HUD_ENGAGE_FRIENDLY_COUNT_X,
        TWL_CONQUEST_HUD_ENGAGE_COUNT_Y,
        TWL_CONQUEST_HUD_ENGAGE_COUNT_WIDTH,
        TWL_CONQUEST_HUD_ENGAGE_COUNT_HEIGHT,
        TWL_CONQUEST_HUD_ENGAGE_COUNT_TEXT_SIZE,
        mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
        CONQUEST_HUD_TEXT_FRIENDLY_RGB,
        TWL_CONQUEST_HUD_COLOR_BLUE
    );
    if (!engageFriendlyCount) return undefined;
    try {
        mod.SetUIWidgetBgFill(engageFriendlyCount, mod.UIBgFill.Solid);
    } catch {
        // Optional count-chip fill; keep engage lane alive if fill mode is unavailable.
    }
    safeSetUIWidgetBgColor(engageFriendlyCount, TWL_CONQUEST_HUD_COLOR_BOX_BG);
    safeSetUIWidgetBgAlpha(engageFriendlyCount, TWL_CONQUEST_HUD_ENGAGE_COUNT_BG_ALPHA);

    const engageEnemyCountShadowRing = twlConquestHudEnsureShadowRingText(
        player,
        twlConquestHudEngageEnemyCountName(pid),
        engageRoot,
        mod.UIAnchor.TopLeft,
        TWL_CONQUEST_HUD_ENGAGE_ENEMY_COUNT_X,
        TWL_CONQUEST_HUD_ENGAGE_COUNT_Y,
        TWL_CONQUEST_HUD_ENGAGE_COUNT_WIDTH,
        TWL_CONQUEST_HUD_ENGAGE_COUNT_HEIGHT,
        TWL_CONQUEST_HUD_ENGAGE_COUNT_TEXT_SIZE,
        mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
        TWL_CONQUEST_HUD_SHADOW_RING_PROFILE_ENGAGE_COUNT
    );
    if (!engageEnemyCountShadowRing) return undefined;
    const engageEnemyCount = twlConquestHudEnsureText(
        player,
        twlConquestHudEngageEnemyCountName(pid),
        engageRoot,
        mod.UIAnchor.TopLeft,
        TWL_CONQUEST_HUD_ENGAGE_ENEMY_COUNT_X,
        TWL_CONQUEST_HUD_ENGAGE_COUNT_Y,
        TWL_CONQUEST_HUD_ENGAGE_COUNT_WIDTH,
        TWL_CONQUEST_HUD_ENGAGE_COUNT_HEIGHT,
        TWL_CONQUEST_HUD_ENGAGE_COUNT_TEXT_SIZE,
        mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
        CONQUEST_HUD_TEXT_ENEMY_RGB,
        TWL_CONQUEST_HUD_COLOR_RED
    );
    if (!engageEnemyCount) return undefined;
    try {
        mod.SetUIWidgetBgFill(engageEnemyCount, mod.UIBgFill.Solid);
    } catch {
        // Optional count-chip fill; keep engage lane alive if fill mode is unavailable.
    }
    safeSetUIWidgetBgColor(engageEnemyCount, TWL_CONQUEST_HUD_COLOR_BOX_BG);
    safeSetUIWidgetBgAlpha(engageEnemyCount, TWL_CONQUEST_HUD_ENGAGE_COUNT_BG_ALPHA);

    const engageStatusShadowRing = twlConquestHudEnsureShadowRingText(
        player,
        twlConquestHudEngageStatusName(pid),
        engageRoot,
        mod.UIAnchor.TopLeft,
        0,
        TWL_CONQUEST_HUD_ENGAGE_STATUS_Y,
        TWL_CONQUEST_HUD_ENGAGE_STATUS_WIDTH,
        TWL_CONQUEST_HUD_ENGAGE_STATUS_HEIGHT,
        TWL_CONQUEST_HUD_ENGAGE_STATUS_TEXT_SIZE,
        mod.Message(STR_HUD_CONQUEST_CAPTURE_STATUS_DEFEND),
        TWL_CONQUEST_HUD_SHADOW_RING_PROFILE_ENGAGE_STATUS
    );
    if (!engageStatusShadowRing) return undefined;
    const engageStatus = twlConquestHudEnsureText(
        player,
        twlConquestHudEngageStatusName(pid),
        engageRoot,
        mod.UIAnchor.TopLeft,
        0,
        TWL_CONQUEST_HUD_ENGAGE_STATUS_Y,
        TWL_CONQUEST_HUD_ENGAGE_STATUS_WIDTH,
        TWL_CONQUEST_HUD_ENGAGE_STATUS_HEIGHT,
        TWL_CONQUEST_HUD_ENGAGE_STATUS_TEXT_SIZE,
        mod.Message(STR_HUD_CONQUEST_CAPTURE_STATUS_DEFEND),
        CONQUEST_HUD_TEXT_NEUTRAL_RGB,
        TWL_CONQUEST_HUD_COLOR_WHITE
    );
    if (!engageStatus) return undefined;

    safeSetUIWidgetBgColor(engageTrack, TWL_CONQUEST_HUD_COLOR_ENGAGE_TRACK);
    safeSetUIWidgetBgColor(engageFriendlyFill, TWL_CONQUEST_HUD_COLOR_BLUE);
    safeSetUIWidgetBgColor(engageEnemyFill, TWL_CONQUEST_HUD_COLOR_RED);

    entry.widgets.root = root;
    entry.widgets.combatLane = combatLane;
    entry.widgets.ticketsLane = ticketsLane;
    entry.widgets.objectivesLane = objectivesLane;
    entry.widgets.ticketBlueBox = ticketBlueBox;
    entry.widgets.ticketRedBox = ticketRedBox;
    entry.widgets.ticketBlueTeamNameShadowRing = ticketBlueTeamNameShadowRing;
    entry.widgets.ticketBlueTeamName = ticketBlueTeamLabel;
    entry.widgets.ticketRedTeamNameShadowRing = ticketRedTeamNameShadowRing;
    entry.widgets.ticketRedTeamName = ticketRedTeamLabel;
    entry.widgets.ticketBlueCount = ticketBlueCount;
    entry.widgets.ticketRedCount = ticketRedCount;
    entry.widgets.ticketSlash = ticketSlash;
    entry.widgets.ticketBlueBarTrack = ticketBlueBarTrack;
    entry.widgets.ticketBlueBarFill = ticketBlueBarFill;
    entry.widgets.ticketRedBarTrack = ticketRedBarTrack;
    entry.widgets.ticketRedBarFill = ticketRedBarFill;
    entry.widgets.ticketLeadBorderLeft = ticketLeadBorderLeft;
    entry.widgets.ticketLeadBorderRight = ticketLeadBorderRight;
    entry.widgets.ticketLeadCrownLeftShadow = ticketLeadCrownLeftShadow;
    entry.widgets.ticketLeadCrownRightShadow = ticketLeadCrownRightShadow;
    entry.widgets.ticketLeadCrownLeft = ticketLeadCrownLeft;
    entry.widgets.ticketLeadCrownRight = ticketLeadCrownRight;
    entry.widgets.ticketBleedLeftChevronShadowRings = ticketBleedLeftChevronShadowRings;
    entry.widgets.ticketBleedRightChevronShadowRings = ticketBleedRightChevronShadowRings;
    entry.widgets.ticketBleedLeftChevrons = ticketBleedLeftChevrons;
    entry.widgets.ticketBleedRightChevrons = ticketBleedRightChevrons;
    entry.widgets.objectiveSlotRoots = objectiveSlotRoots;
    entry.widgets.objectiveSlotBorders = objectiveSlotBorders;
    entry.widgets.objectiveSlotFills = objectiveSlotFills;
    entry.widgets.objectiveSlotLabelShadowRings = objectiveSlotLabelShadowRings;
    entry.widgets.objectiveSlotLabels = objectiveSlotLabels;
    entry.widgets.objectiveSlotPercentShadowRings = objectiveSlotPercentShadowRings;
    entry.widgets.objectiveSlotPercents = objectiveSlotPercents;
    entry.widgets.popoutRoot = popoutRoot;
    entry.widgets.popoutSlot = popoutSlot;
    entry.widgets.popoutBorder = popoutBorder;
    entry.widgets.popoutFill = popoutFill;
    entry.widgets.popoutLabelShadowRing = popoutLabelShadowRing;
    entry.widgets.popoutLabel = popoutLabel;
    entry.widgets.popoutPercentShadowRing = popoutPercentShadowRing;
    entry.widgets.popoutPercent = popoutPercent;
    entry.widgets.engageRoot = engageRoot;
    entry.widgets.engageTrack = engageTrack;
    entry.widgets.engageFriendlyFill = engageFriendlyFill;
    entry.widgets.engageEnemyFill = engageEnemyFill;
    entry.widgets.engageFriendlyCountShadowRing = engageFriendlyCountShadowRing;
    entry.widgets.engageEnemyCountShadowRing = engageEnemyCountShadowRing;
    entry.widgets.engageFriendlyCount = engageFriendlyCount;
    entry.widgets.engageEnemyCount = engageEnemyCount;
    entry.widgets.engageStatusShadowRing = engageStatusShadowRing;
    entry.widgets.engageStatus = engageStatus;
    entry.layoutFlagCount = ticketLayout.layoutFlagCount;
    entry.initialized = true;
    entry.buildGeneration = entry.buildGeneration + 1;
    return entry;
}


