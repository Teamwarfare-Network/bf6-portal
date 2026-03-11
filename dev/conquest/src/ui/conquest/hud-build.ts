// @ts-nocheck
// Module: ui/conquest/hud-build -- Conquest HUD ensure/build owner

//#region -------------------- HUD Build/Ensure Function Start --------------------

// HUD lifecycle/teardown helpers are defined in ui/conquest/lifecycle.ts.
const conquestCombatRootInitializedByPid: Record<number, boolean> = {};

// Clears one player's combat-root initialization token so next ensure performs duplicate-root purge.
function resetConquestCombatRootInitializationForPid(pid: number): void {
    delete conquestCombatRootInitializedByPid[pid];
}

// Ensures all persistent HUD widgets exist for a player.
// This function is idempotent and safe to call on join, respawn, or reconnect.
// Widget references created here are reused and updated elsewhere.

function ensureHudForPlayer(player: mod.Player): HudRefs | undefined {
    // Per-player HUD lifecycle:
    // - HUD widgets are created once per player and then only updated (never recreated) during the match.
    // - This function is safe to call repeatedly (join, respawn, reconnect, admin actions).
    // - If a widget is missing, create it and store/find it via the UI root.

    if (!player || !mod.IsPlayerValid(player)) return undefined;

    const pid = getObjId(player);
    // Build-order authority:
    // ensure the clock root exists before conquest lanes so parent selection is correct on first build.
    ensureClockUIAndGetCache(player);
    // Phase 3B anchor package from reference_design_documentation/ui_location_starter.md
    // Uses shared layout constants so cache-path and build-path placement stay in sync.
    const CONQUEST_TICKETS_ROOT_WIDTH = 561.77;
    const CONQUEST_TICKETS_ROOT_HEIGHT = 50;
    // Root-local offsets; global centering is handled by the single combat root below.
    const CONQUEST_TICKETS_ROOT_X = 0;
    const CONQUEST_TICKETS_ROOT_Y = 0;
    // Inward nudge for ticket-side UI cluster (counter boxes + lead borders + crowns).
    // Positive value moves each side toward center by that many units.
    const CONQUEST_TICKETS_SIDE_INNER_NUDGE_X = 2;
    const CONQUEST_TICKETS_TEAM_OUTER_EXPAND = 12;
    const CONQUEST_TICKETS_TEAM_TEXT_LEFT_OFFSET_X = 0;
    const CONQUEST_TICKETS_TEAM_TEXT_RIGHT_OFFSET_X = 0;
    const CONQUEST_FLAGS_MAX_ROWS = 7;
    const CONQUEST_FLAGS_SLOT_STEP_X = 35.0;
    const CONQUEST_FLAGS_ACTIVE_COUNT = Math.max(
        1,
        Math.min(CONQUEST_FLAGS_MAX_ROWS, ACTIVE_CAPTURE_POINT_CONFIGS.length)
    );
    const CONQUEST_FLAGS_FIRST_VISIBLE_SLOT_INDEX = Math.floor(
        (CONQUEST_FLAGS_MAX_ROWS - CONQUEST_FLAGS_ACTIVE_COUNT) / 2
    );
    // Width occupied by the active objective row: slot widths plus lane spacing.
    const CONQUEST_FLAGS_VISIBLE_SPAN_WIDTH = CONQUEST_HUD_FLAG_SLOT_WIDTH
        + ((CONQUEST_FLAGS_ACTIVE_COUNT - 1) * CONQUEST_FLAGS_SLOT_STEP_X);
    // Keep containers at outward-expanded positions; text is nudged inward inside the containers.
    const CONQUEST_TICKETS_TEAM_LEFT_X_BASE = (40 - CONQUEST_TICKETS_TEAM_OUTER_EXPAND) + CONQUEST_TICKETS_SIDE_INNER_NUDGE_X;
    const CONQUEST_TICKETS_TEAM_RIGHT_X_BASE = 461.39 - CONQUEST_TICKETS_SIDE_INNER_NUDGE_X;
    const CONQUEST_TICKETS_ROW_Y = -1;
    const CONQUEST_TICKETS_LEFT_BAR_X_BASE = 103.39;
    const CONQUEST_TICKETS_RIGHT_BAR_X_BASE = 284.90;
    const CONQUEST_TICKETS_BAR_Y = 30.82;
    const CONQUEST_TICKETS_TEAM_WIDTH = 60 + CONQUEST_TICKETS_TEAM_OUTER_EXPAND;
    const CONQUEST_TICKETS_TEAM_HEIGHT = 28;
    const CONQUEST_TICKETS_TEAM_TEXT_SIZE = 26;
    const CONQUEST_TICKETS_TEAM_SHADOW_TEXT_SIZE = CONQUEST_TICKETS_TEAM_TEXT_SIZE + 1;
    const CONQUEST_TICKETS_BG_RGB: [number, number, number] = [0.0314, 0.0431, 0.0431];
    const CONQUEST_TICKETS_BG_ALPHA = 0.75;
    const CONQUEST_FLAGS_ROOT_WIDTH = 238.5;
    const CONQUEST_FLAGS_ROOT_HEIGHT = 46;
    const CONQUEST_FLAGS_ROOT_X = 0;
    const CONQUEST_FLAGS_ROOT_Y = 0;
    // One centered combat root owns all conquest top HUD placement.
    const CONQUEST_COMBAT_ROOT_WIDTH = Math.max(CONQUEST_TICKETS_ROOT_WIDTH, CONQUEST_FLAGS_ROOT_WIDTH);
    const CONQUEST_COMBAT_ROOT_HEIGHT = 180;
    const CONQUEST_COMBAT_ROOT_Y = CONQUEST_HUD_TICKETS_FLAGS_SHIFT_Y;
    const CONQUEST_TICKETS_BASE_CENTER_GAP_X = CONQUEST_TICKETS_RIGHT_BAR_X_BASE
        - (CONQUEST_TICKETS_LEFT_BAR_X_BASE + CONQUEST_HUD_TICKET_BAR_WIDTH);
    // Keep one "between-flag" gap between the center flag lane and each ticket bar.
    // Inter-flag edge gap = slot step - slot width.
    const CONQUEST_FLAGS_TO_TICKET_SIDE_GAP_X = Math.max(
        0,
        CONQUEST_FLAGS_SLOT_STEP_X - CONQUEST_HUD_FLAG_SLOT_WIDTH
    );
    const CONQUEST_TICKETS_TARGET_CENTER_GAP_X = CONQUEST_FLAGS_VISIBLE_SPAN_WIDTH
        + (CONQUEST_FLAGS_TO_TICKET_SIDE_GAP_X * 2);
    // Push both ticket clusters outward so the center lane matches active-flag row footprint.
    const CONQUEST_TICKETS_OUTWARD_SHIFT_X = Math.max(
        0,
        (CONQUEST_TICKETS_TARGET_CENTER_GAP_X - CONQUEST_TICKETS_BASE_CENTER_GAP_X) / 2
    );
    const CONQUEST_TICKETS_TEAM_LEFT_X = CONQUEST_TICKETS_TEAM_LEFT_X_BASE - CONQUEST_TICKETS_OUTWARD_SHIFT_X;
    const CONQUEST_TICKETS_TEAM_RIGHT_X = CONQUEST_TICKETS_TEAM_RIGHT_X_BASE + CONQUEST_TICKETS_OUTWARD_SHIFT_X;
    const CONQUEST_TICKETS_LEFT_BAR_X = CONQUEST_TICKETS_LEFT_BAR_X_BASE - CONQUEST_TICKETS_OUTWARD_SHIFT_X;
    const CONQUEST_TICKETS_RIGHT_BAR_X = CONQUEST_TICKETS_RIGHT_BAR_X_BASE + CONQUEST_TICKETS_OUTWARD_SHIFT_X;
    // Keep absolute layout aliases rooted in centered, root-local coordinates.
    const CONQUEST_TICKETS_TEAM_LEFT_ABS_X = CONQUEST_TICKETS_TEAM_LEFT_X;
    const CONQUEST_TICKETS_TEAM_RIGHT_ABS_X = CONQUEST_TICKETS_TEAM_RIGHT_X;
    const CONQUEST_TICKETS_LEFT_BAR_ABS_X = CONQUEST_TICKETS_LEFT_BAR_X;
    const CONQUEST_TICKETS_RIGHT_BAR_ABS_X = CONQUEST_TICKETS_RIGHT_BAR_X;
    const CONQUEST_TICKETS_BLEED_Y = CONQUEST_TICKETS_BAR_Y
        + Math.floor((CONQUEST_HUD_TICKET_BAR_HEIGHT - CONQUEST_HUD_TICKET_BLEED_CHEVRON_HEIGHT) / 2)
        + CONQUEST_HUD_TICKET_BLEED_CHEVRON_IN_BAR_OFFSET_Y
        - 20;
    const CONQUEST_TICKETS_BLEED_LEFT_X = CONQUEST_TICKETS_LEFT_BAR_X + CONQUEST_HUD_TICKET_BLEED_CHEVRON_OUTER_INSET_X;
    const CONQUEST_TICKETS_BLEED_RIGHT_X = CONQUEST_TICKETS_RIGHT_BAR_X
        + CONQUEST_HUD_TICKET_BAR_WIDTH
        - CONQUEST_HUD_TICKET_BLEED_CHEVRON_OUTER_INSET_X
        - CONQUEST_HUD_TICKET_BLEED_CHEVRON_WIDTH;
    const CONQUEST_TICKETS_TEAM_ABS_Y = CONQUEST_TICKETS_ROW_Y;
    const CONQUEST_TICKETS_BAR_ABS_Y = CONQUEST_TICKETS_BAR_Y;
    const CONQUEST_TICKETS_LEAD_LEFT_BORDER_ABS_X = CONQUEST_TICKETS_TEAM_LEFT_ABS_X - CONQUEST_HUD_TICKET_LEAD_BORDER_GROW;
    const CONQUEST_TICKETS_LEAD_RIGHT_BORDER_ABS_X = CONQUEST_TICKETS_TEAM_RIGHT_ABS_X - CONQUEST_HUD_TICKET_LEAD_BORDER_GROW;
    const CONQUEST_TICKETS_LEAD_BORDER_ABS_Y = CONQUEST_TICKETS_TEAM_ABS_Y - CONQUEST_HUD_TICKET_LEAD_BORDER_GROW;
    const CONQUEST_TICKETS_LEAD_BORDER_WIDTH = CONQUEST_TICKETS_TEAM_WIDTH + (CONQUEST_HUD_TICKET_LEAD_BORDER_GROW * 2);
    const CONQUEST_TICKETS_LEAD_BORDER_HEIGHT = CONQUEST_TICKETS_TEAM_HEIGHT + (CONQUEST_HUD_TICKET_LEAD_BORDER_GROW * 2);
    const CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_OFFSET = 0;
    const CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_GROW = 5;
    const CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_TOP_BIAS = -0.5;
    const CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_CENTER_SHIFT = CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_GROW / 2;
    const CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_SIZE = CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE + CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_GROW;
    const CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_ALPHA = 0.82;
    const CONQUEST_TICKETS_LEAD_LEFT_CROWN_ABS_X = CONQUEST_TICKETS_TEAM_LEFT_ABS_X + ((CONQUEST_TICKETS_TEAM_WIDTH - CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE) / 2);
    const CONQUEST_TICKETS_LEAD_RIGHT_CROWN_ABS_X = CONQUEST_TICKETS_TEAM_RIGHT_ABS_X + ((CONQUEST_TICKETS_TEAM_WIDTH - CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE) / 2);
    const CONQUEST_TICKETS_LEAD_CROWN_ABS_Y = CONQUEST_TICKETS_TEAM_ABS_Y - CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE - CONQUEST_HUD_TICKET_LEAD_CROWN_GAP_Y;
    const CONQUEST_TICKETS_LEAD_LEFT_CROWN_SHADOW_ABS_X = CONQUEST_TICKETS_LEAD_LEFT_CROWN_ABS_X - CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_CENTER_SHIFT + CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_OFFSET;
    const CONQUEST_TICKETS_LEAD_RIGHT_CROWN_SHADOW_ABS_X = CONQUEST_TICKETS_LEAD_RIGHT_CROWN_ABS_X - CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_CENTER_SHIFT + CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_OFFSET;
    const CONQUEST_TICKETS_LEAD_CROWN_SHADOW_ABS_Y = CONQUEST_TICKETS_LEAD_CROWN_ABS_Y - CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_CENTER_SHIFT + CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_OFFSET + CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_TOP_BIAS;
    const CONQUEST_TICKETS_SLASH_ABS_X = Math.floor((CONQUEST_TICKETS_ROOT_WIDTH - 16) / 2);
    const CONQUEST_TICKETS_SLASH_ABS_Y = CONQUEST_TICKETS_ROW_Y;
    const CONQUEST_TICKETS_BAR_CENTER_Y = CONQUEST_TICKETS_BAR_Y + (CONQUEST_HUD_TICKET_BAR_HEIGHT / 2);
    // Align objective slots with ticket-bar centerline for higher top-stack density.
    const CONQUEST_FLAGS_SLOT_ABS_Y = CONQUEST_TICKETS_BAR_CENTER_Y - (CONQUEST_HUD_FLAG_SLOT_HEIGHT / 2);
    const CONQUEST_FLAGS_ACTIVE_CENTER_INDEX = CONQUEST_FLAGS_FIRST_VISIBLE_SLOT_INDEX + ((CONQUEST_FLAGS_ACTIVE_COUNT - 1) / 2);
    const CONQUEST_FLAGS_SLOT0_X =
        ((CONQUEST_FLAGS_ROOT_WIDTH - CONQUEST_HUD_FLAG_SLOT_WIDTH) / 2)
        - (CONQUEST_FLAGS_ACTIVE_CENTER_INDEX * CONQUEST_FLAGS_SLOT_STEP_X);
    const CONQUEST_FLAGS_SLOT_X: number[] = [];
    for (let i = 0; i < CONQUEST_FLAGS_MAX_ROWS; i++) {
        CONQUEST_FLAGS_SLOT_X[i] = CONQUEST_FLAGS_SLOT0_X + (i * CONQUEST_FLAGS_SLOT_STEP_X);
    }
    const CONQUEST_FLAGS_SLOT_ABS_X: number[] = CONQUEST_FLAGS_SLOT_X.slice();
    const CONQUEST_FLAGS_CENTER_ABS_X = CONQUEST_FLAGS_SLOT0_X
        + (CONQUEST_FLAGS_ACTIVE_CENTER_INDEX * CONQUEST_FLAGS_SLOT_STEP_X)
        + (CONQUEST_HUD_FLAG_SLOT_WIDTH / 2);
    const CONQUEST_FLAGS_ACTIVE_POPOUT_ABS_X = CONQUEST_FLAGS_CENTER_ABS_X - (CONQUEST_HUD_FLAG_ACTIVE_POPOUT_ROOT_WIDTH / 2);
    // v0.319 spacing baseline:
    // popout lane sits 22 px above the old percent+gap baseline and engage sits 14 px below popout.
    const CONQUEST_FLAGS_ACTIVE_POPOUT_OFFSET_Y = -22.00;
    const CONQUEST_FLAGS_ACTIVE_POPOUT_ABS_Y = CONQUEST_FLAGS_SLOT_ABS_Y
        + CONQUEST_HUD_FLAG_PERCENT_OFFSET_Y
        + CONQUEST_HUD_FLAG_PERCENT_ROOT_HEIGHT
        + CONQUEST_FLAGS_ACTIVE_POPOUT_OFFSET_Y;
    const CONQUEST_FLAGS_ENGAGE_GAP_Y = 14.00;
    const CONQUEST_FLAGS_ENGAGE_ABS_X = CONQUEST_FLAGS_ACTIVE_POPOUT_ABS_X
        - ((CONQUEST_HUD_FLAG_ENGAGE_ROOT_WIDTH - CONQUEST_HUD_FLAG_ACTIVE_POPOUT_ROOT_WIDTH) / 2);
    const CONQUEST_FLAGS_ENGAGE_ABS_Y = CONQUEST_FLAGS_ACTIVE_POPOUT_ABS_Y
        + CONQUEST_HUD_FLAG_ACTIVE_POPOUT_ROOT_HEIGHT
        + CONQUEST_FLAGS_ENGAGE_GAP_Y;
    const CONQUEST_HELP_CONTAINER_X = -223.60;
    const CONQUEST_HELP_CONTAINER_Y = 81.10;
    const CONQUEST_HELP_CONTAINER_WIDTH = 561.77;
    const CONQUEST_HELP_CONTAINER_HEIGHT = 38.31;
    const CONQUEST_HELP_TEXT_OFFSET_Y = 10;
    const CONQUEST_HELP_TEXT_HEIGHT = 18;
    // "You are Ready" lane: left HUD stack under branding/settings.
    const CONQUEST_READY_CONTAINER_X = -905.00;
    const CONQUEST_READY_CONTAINER_Y = 81.10 + CONQUEST_HUD_NON_CLOCK_SHIFT_Y;
    const CONQUEST_READY_CONTAINER_WIDTH = 200.0;
    const CONQUEST_READY_CONTAINER_HEIGHT = 20.0;
    const CONQUEST_READY_TEXT_OFFSET_Y = 1;
    const CONQUEST_READY_TEXT_HEIGHT = 18;
    const CONQUEST_READY_ABS_X = 5.0;
    const CONQUEST_READY_ABS_Y = 131.0 + CONQUEST_HUD_NON_CLOCK_SHIFT_Y;
    // Returns ticket-root-local X for one bleed chevron index.
    // Index 0 is outermost (closest to the ticket counter), increasing inward toward center.
    const getBleedChevronX = (isLeftSide: boolean, chevronIndex: number): number => {
        if (isLeftSide) {
            return CONQUEST_TICKETS_BLEED_LEFT_X + (chevronIndex * CONQUEST_HUD_TICKET_BLEED_CHEVRON_STEP_X);
        }
        return CONQUEST_TICKETS_BLEED_RIGHT_X - (chevronIndex * CONQUEST_HUD_TICKET_BLEED_CHEVRON_STEP_X);
    };
    // Ensures all foreground and shadow bleed-chevron widgets exist for the active HUD tree.
    // This upgrades legacy HUD trees (3 chevrons, no shadows) in-place to 7 horizontal slots with shadow layers.
    const ensureConquestBleedChevronWidgets = (): void => {
        const createTextWidgetIfMissing = (
            name: string,
            textLabel: mod.Message,
            textColor: [number, number, number]
        ): void => {
            if (safeFind(name)) return;
            modlib.ParseUI({
                name,
                type: "Text",
                playerId: player,
                position: [0, 0],
                size: [CONQUEST_HUD_TICKET_BLEED_CHEVRON_WIDTH, CONQUEST_HUD_TICKET_BLEED_CHEVRON_HEIGHT],
                anchor: mod.UIAnchor.TopLeft,
                visible: false,
                padding: 0,
                bgAlpha: 0,
                bgFill: mod.UIBgFill.None,
                textLabel,
                textColor,
                textAlpha: 1,
                textSize: CONQUEST_HUD_TICKET_BLEED_CHEVRON_TEXT_SIZE,
                textAnchor: mod.UIAnchor.Center,
            });
        };
        for (let chevronIndex = 0; chevronIndex < CONQUEST_HUD_TICKET_BLEED_CHEVRON_COUNT; chevronIndex++) {
            const slot = chevronIndex + 1;
            createTextWidgetIfMissing(
                `ConquestTicketsHudBleedChevronLeft${slot}_${pid}`,
                mod.Message(STR_HUD_CONQUEST_BLEED_CHEVRON_LEFT),
                [
                    CONQUEST_HUD_TICKET_BLEED_CHEVRON_FRIENDLY_RGB[0],
                    CONQUEST_HUD_TICKET_BLEED_CHEVRON_FRIENDLY_RGB[1],
                    CONQUEST_HUD_TICKET_BLEED_CHEVRON_FRIENDLY_RGB[2],
                ]
            );
            createTextWidgetIfMissing(
                `ConquestTicketsHudBleedChevronRight${slot}_${pid}`,
                mod.Message(STR_HUD_CONQUEST_BLEED_CHEVRON_RIGHT),
                [
                    CONQUEST_HUD_TICKET_BLEED_CHEVRON_ENEMY_RGB[0],
                    CONQUEST_HUD_TICKET_BLEED_CHEVRON_ENEMY_RGB[1],
                    CONQUEST_HUD_TICKET_BLEED_CHEVRON_ENEMY_RGB[2],
                ]
            );
            const shadowColor: [number, number, number] = [0, 0, 0];
            createTextWidgetIfMissing(`ConquestTicketsHudBleedChevronLeft${slot}ShadowRight_${pid}`, mod.Message(STR_HUD_CONQUEST_BLEED_CHEVRON_LEFT), shadowColor);
            createTextWidgetIfMissing(`ConquestTicketsHudBleedChevronLeft${slot}ShadowLeft_${pid}`, mod.Message(STR_HUD_CONQUEST_BLEED_CHEVRON_LEFT), shadowColor);
            createTextWidgetIfMissing(`ConquestTicketsHudBleedChevronLeft${slot}ShadowUp_${pid}`, mod.Message(STR_HUD_CONQUEST_BLEED_CHEVRON_LEFT), shadowColor);
            createTextWidgetIfMissing(`ConquestTicketsHudBleedChevronLeft${slot}ShadowDown_${pid}`, mod.Message(STR_HUD_CONQUEST_BLEED_CHEVRON_LEFT), shadowColor);
            createTextWidgetIfMissing(`ConquestTicketsHudBleedChevronLeft${slot}ShadowUpLeft_${pid}`, mod.Message(STR_HUD_CONQUEST_BLEED_CHEVRON_LEFT), shadowColor);
            createTextWidgetIfMissing(`ConquestTicketsHudBleedChevronLeft${slot}ShadowUpRight_${pid}`, mod.Message(STR_HUD_CONQUEST_BLEED_CHEVRON_LEFT), shadowColor);
            createTextWidgetIfMissing(`ConquestTicketsHudBleedChevronLeft${slot}ShadowDownRight_${pid}`, mod.Message(STR_HUD_CONQUEST_BLEED_CHEVRON_LEFT), shadowColor);
            createTextWidgetIfMissing(`ConquestTicketsHudBleedChevronLeft${slot}ShadowDownLeft_${pid}`, mod.Message(STR_HUD_CONQUEST_BLEED_CHEVRON_LEFT), shadowColor);
            createTextWidgetIfMissing(`ConquestTicketsHudBleedChevronRight${slot}ShadowRight_${pid}`, mod.Message(STR_HUD_CONQUEST_BLEED_CHEVRON_RIGHT), shadowColor);
            createTextWidgetIfMissing(`ConquestTicketsHudBleedChevronRight${slot}ShadowLeft_${pid}`, mod.Message(STR_HUD_CONQUEST_BLEED_CHEVRON_RIGHT), shadowColor);
            createTextWidgetIfMissing(`ConquestTicketsHudBleedChevronRight${slot}ShadowUp_${pid}`, mod.Message(STR_HUD_CONQUEST_BLEED_CHEVRON_RIGHT), shadowColor);
            createTextWidgetIfMissing(`ConquestTicketsHudBleedChevronRight${slot}ShadowDown_${pid}`, mod.Message(STR_HUD_CONQUEST_BLEED_CHEVRON_RIGHT), shadowColor);
            createTextWidgetIfMissing(`ConquestTicketsHudBleedChevronRight${slot}ShadowUpLeft_${pid}`, mod.Message(STR_HUD_CONQUEST_BLEED_CHEVRON_RIGHT), shadowColor);
            createTextWidgetIfMissing(`ConquestTicketsHudBleedChevronRight${slot}ShadowUpRight_${pid}`, mod.Message(STR_HUD_CONQUEST_BLEED_CHEVRON_RIGHT), shadowColor);
            createTextWidgetIfMissing(`ConquestTicketsHudBleedChevronRight${slot}ShadowDownRight_${pid}`, mod.Message(STR_HUD_CONQUEST_BLEED_CHEVRON_RIGHT), shadowColor);
            createTextWidgetIfMissing(`ConquestTicketsHudBleedChevronRight${slot}ShadowDownLeft_${pid}`, mod.Message(STR_HUD_CONQUEST_BLEED_CHEVRON_RIGHT), shadowColor);
        }
    };
    // Ensures ticket counter directional shadow widgets exist so counters render an even outline ring.
    const ensureConquestTicketCounterShadowWidgets = (): void => {
        const createTicketShadowWidgetIfMissing = (name: string): void => {
            if (safeFind(name)) return;
            modlib.ParseUI({
                name,
                type: "Text",
                playerId: player,
                position: [0, 0],
                size: [CONQUEST_TICKETS_TEAM_WIDTH, CONQUEST_TICKETS_TEAM_HEIGHT],
                anchor: mod.UIAnchor.TopLeft,
                visible: false,
                padding: 0,
                bgAlpha: 0,
                bgFill: mod.UIBgFill.None,
                textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                textColor: [0, 0, 0],
                textAlpha: CONQUEST_HUD_TICKET_COUNTER_SHADOW_ALPHA,
                textSize: CONQUEST_TICKETS_TEAM_SHADOW_TEXT_SIZE,
                textAnchor: mod.UIAnchor.Center,
            });
        };
        const createTicketCoreOverlayIfMissing = (
            name: string,
            teamColor: [number, number, number]
        ): void => {
            if (safeFind(name)) return;
            modlib.ParseUI({
                name,
                type: "Text",
                playerId: player,
                position: [0, 0],
                size: [CONQUEST_TICKETS_TEAM_WIDTH, CONQUEST_TICKETS_TEAM_HEIGHT],
                anchor: mod.UIAnchor.TopLeft,
                visible: false,
                padding: 0,
                bgAlpha: 0,
                bgFill: mod.UIBgFill.None,
                textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                textColor: teamColor,
                textAlpha: 1,
                textSize: CONQUEST_TICKETS_TEAM_TEXT_SIZE,
                textAnchor: mod.UIAnchor.Center,
            });
        };
        for (let teamIndex = 1; teamIndex <= 2; teamIndex++) {
            const teamPrefix = `ConquestTicketsHudTeam${teamIndex}`;
            for (let layerIndex = 0; layerIndex < CONQUEST_TICKET_COUNTER_SHADOW_RING_LAYERS.length; layerIndex++) {
                const layer = CONQUEST_TICKET_COUNTER_SHADOW_RING_LAYERS[layerIndex];
                createTicketShadowWidgetIfMissing(`${teamPrefix}${layer.suffix}_${pid}`);
            }
        }
        createTicketCoreOverlayIfMissing(
            `ConquestTicketsHudTeam1CoreOverlay_${pid}`,
            [
                CONQUEST_HUD_TEXT_FRIENDLY_RGB[0],
                CONQUEST_HUD_TEXT_FRIENDLY_RGB[1],
                CONQUEST_HUD_TEXT_FRIENDLY_RGB[2],
            ]
        );
        createTicketCoreOverlayIfMissing(
            `ConquestTicketsHudTeam2CoreOverlay_${pid}`,
            [
                CONQUEST_HUD_TEXT_ENEMY_RGB[0],
                CONQUEST_HUD_TEXT_ENEMY_RGB[1],
                CONQUEST_HUD_TEXT_ENEMY_RGB[2],
            ]
        );
    };
    // Hard-purges legacy triplet-row flag widgets left behind by prior HUD layouts.
    // Delete-all is required here because stale duplicates can survive hot-reload churn.
    const purgeLegacyFlagTripletRows = (): void => {
        for (let i = 0; i < CONQUEST_FLAGS_MAX_ROWS; i++) {
            deleteAllHudWidgetsByName(`ConquestFlagFriendly_${pid}_${i}`);
            deleteAllHudWidgetsByName(`ConquestFlagCenter_${pid}_${i}`);
            deleteAllHudWidgetsByName(`ConquestFlagEnemy_${pid}_${i}`);
        }
    };
    // Hard-purges legacy conquest roots from earlier HUD iterations.
    // Keeping these around (even hidden) can leak stale duplicates that render on some aspect/layout chains.
    const purgeLegacyConquestRoots = (): void => {
        deleteAllHudWidgetsByName(`ConquestHudRoot_${pid}`);
        deleteAllHudWidgetsByName(`ConquestTicketsDebugRoot_${pid}`);
        deleteAllHudWidgetsByName(`ConquestFlagsDebugRoot_${pid}`);
    };
    // Hard-purges legacy top-core containers from older HUD trees.
    // These containers historically hosted top-lane variants and can survive as stale duplicates.
    const purgeLegacyTopCoreContainers = (): void => {
        deleteAllHudWidgetsByName(`Container_TopLeft_CoreUI_${pid}`);
        deleteAllHudWidgetsByName(`Container_TopMiddle_CoreUI_${pid}`);
        deleteAllHudWidgetsByName(`Container_TopRight_CoreUI_${pid}`);
    };

    // Ensures ConquestCombatHudRoot exists so tickets/flags always share one centered parent frame.
    const ensureConquestCombatHudRootForPid = (): mod.UIWidget | undefined => {
        const combatRootName = `ConquestCombatHudRoot_${pid}`;
        if (conquestCombatRootInitializedByPid[pid] !== true) {
            deleteAllHudWidgetsByName(combatRootName);
        }
        let combatRoot = safeFind(combatRootName);
        if (!combatRoot) {
            const parsedCombatRoot = modlib.ParseUI({
                name: combatRootName,
                type: "Container",
                playerId: player,
                position: [0, CONQUEST_COMBAT_ROOT_Y],
                size: [CONQUEST_COMBAT_ROOT_WIDTH, CONQUEST_COMBAT_ROOT_HEIGHT],
                anchor: mod.UIAnchor.TopCenter,
                visible: true,
                padding: 0,
                bgAlpha: 0,
                bgFill: mod.UIBgFill.None,
            });
            combatRoot = parsedCombatRoot ?? safeFind(combatRootName);
        }
        if (combatRoot) {
            conquestCombatRootInitializedByPid[pid] = true;
        }
        return combatRoot;
    };

    // Returns true when widget has the expected direct parent handle.
    const widgetHasDirectParent = (widget: mod.UIWidget | undefined, parent: mod.UIWidget | undefined): boolean => {
        if (!widget || !parent) return false;
        try {
            const actualParent = mod.GetUIWidgetParent(widget);
            return !!actualParent && actualParent === parent;
        } catch {
            return false;
        }
    };
    // Returns true when widget has the expected direct parent by widget name.
    const widgetHasParentName = (widget: mod.UIWidget | undefined, parentName: string): boolean => {
        if (!widget) return false;
        try {
            const parent = mod.GetUIWidgetParent(widget);
            return !!parent && mod.GetUIWidgetName(parent) === parentName;
        } catch {
            return false;
        }
    };
    // Returns true when the widget anchor matches the expected value.
    const widgetHasAnchor = (widget: mod.UIWidget | undefined, anchor: mod.UIAnchor): boolean => {
        if (!widget) return false;
        try {
            return mod.GetUIWidgetAnchor(widget) === anchor;
        } catch {
            return false;
        }
    };
    // Returns true when widget XY position is within tolerance of expected local coordinates.
    const widgetHasPositionXY = (
        widget: mod.UIWidget | undefined,
        x: number,
        y: number,
        tolerance: number = 0.5
    ): boolean => {
        if (!widget) return false;
        try {
            const pos = mod.GetUIWidgetPosition(widget);
            return (mod.AbsoluteValue(mod.XComponentOf(pos) - x) <= tolerance)
                && (mod.AbsoluteValue(mod.YComponentOf(pos) - y) <= tolerance);
        } catch {
            return false;
        }
    };

    // Returns true when the current HUD tree already satisfies the teardown root chain contract.
    const hasValidCombatRootChain = (
        refsForPid: HudRefs,
        topHudRoot: mod.UIWidget,
        combatRoot: mod.UIWidget
    ): boolean => {
        const ticketsRoot = refsForPid.conquestTicketsDebugRoot;
        const flagsRoot = refsForPid.conquestFlagsDebugRoot;
        if (!ticketsRoot || !flagsRoot || !combatRoot) return false;
        if (!widgetHasDirectParent(combatRoot, topHudRoot)) return false;
        if (!widgetHasDirectParent(ticketsRoot, combatRoot)) return false;
        if (!widgetHasDirectParent(flagsRoot, combatRoot)) return false;
        if (!widgetHasParentName(combatRoot, `TopHudRoot_${pid}`)) return false;
        if (!widgetHasParentName(ticketsRoot, `ConquestCombatHudRoot_${pid}`)) return false;
        if (!widgetHasParentName(flagsRoot, `ConquestCombatHudRoot_${pid}`)) return false;
        if (!widgetHasAnchor(topHudRoot, mod.UIAnchor.TopCenter)) return false;
        if (!widgetHasPositionXY(topHudRoot, 0, 0)) return false;
        if (!widgetHasAnchor(combatRoot, mod.UIAnchor.TopCenter)) return false;
        if (!widgetHasAnchor(ticketsRoot, mod.UIAnchor.TopCenter)) return false;
        if (!widgetHasAnchor(flagsRoot, mod.UIAnchor.TopCenter)) return false;
        if (!widgetHasPositionXY(combatRoot, 0, CONQUEST_COMBAT_ROOT_Y)) return false;
        if (!widgetHasPositionXY(ticketsRoot, 0, 0)) return false;
        if (!widgetHasPositionXY(flagsRoot, 0, 0)) return false;
        return true;
    };

    // One authoritative root-chain placement pass for conquest top combat HUD.
    // Contract: TopHudRoot -> ConquestCombatHudRoot -> (ConquestTicketsHudRoot + ConquestFlagsHudRoot).
    const pinConquestCombatRootsToTopHudRoot = (refsForPid: HudRefs): boolean => {
        const topHudRoot = ensureTopHudRootForPid(pid, player);
        const combatRoot = refsForPid.conquestCombatRoot;
        const ticketsRoot = refsForPid.conquestTicketsDebugRoot;
        const flagsRoot = refsForPid.conquestFlagsDebugRoot;

        if (!topHudRoot || !combatRoot || !ticketsRoot || !flagsRoot) return false;
        refsForPid.topHudRoot = topHudRoot;
        try {
            mod.SetUIWidgetParent(combatRoot, topHudRoot);
            mod.SetUIWidgetAnchor(combatRoot, mod.UIAnchor.TopCenter);
            mod.SetUIWidgetPosition(combatRoot, mod.CreateVector(0, CONQUEST_COMBAT_ROOT_Y, 0));
            mod.SetUIWidgetSize(combatRoot, mod.CreateVector(CONQUEST_COMBAT_ROOT_WIDTH, CONQUEST_COMBAT_ROOT_HEIGHT, 0));
            mod.SetUIWidgetDepth(combatRoot, mod.UIDepth.AboveGameUI);
        } catch {
            return false;
        }

        const pinChildRoot = (
            root: mod.UIWidget,
            width: number,
            height: number
        ): boolean => {
            try {
                mod.SetUIWidgetParent(root, combatRoot);
                mod.SetUIWidgetAnchor(root, mod.UIAnchor.TopCenter);
                mod.SetUIWidgetPosition(root, mod.CreateVector(0, 0, 0));
                mod.SetUIWidgetSize(root, mod.CreateVector(width, height, 0));
                mod.SetUIWidgetDepth(root, mod.UIDepth.AboveGameUI);
            } catch {
                return false;
            }
            return true;
        };

        if (!pinChildRoot(ticketsRoot, CONQUEST_TICKETS_ROOT_WIDTH, CONQUEST_TICKETS_ROOT_HEIGHT)) return false;
        if (!pinChildRoot(flagsRoot, CONQUEST_FLAGS_ROOT_WIDTH, CONQUEST_FLAGS_ROOT_HEIGHT)) return false;
        return hasValidCombatRootChain(refsForPid, topHudRoot, combatRoot);
    };

    // Resolves one widget name from a specific subtree only.
    // This avoids global same-name collisions selecting off-root stale instances.
    const findWidgetInSubtree = (
        subtreeRoot: mod.UIWidget | undefined,
        name: string
    ): mod.UIWidget | undefined => {
        if (!subtreeRoot) return undefined;
        try {
            return mod.FindUIWidgetWithName(name, subtreeRoot) as mod.UIWidget;
        } catch {
            return undefined;
        }
    };

    // Rebinds all ticket refs from the pinned ticket subtree so render paths never use off-root handles.
    const rebindConquestTicketRefsFromPinnedTree = (refsForPid: HudRefs): boolean => {
        const refsPid = refsForPid.pid;
        const ticketsRoot = refsForPid.conquestTicketsDebugRoot;
        if (!ticketsRoot) return false;

        refsForPid.conquestTicketsTeam1Container = findWidgetInSubtree(ticketsRoot, `ConquestTicketsHudTeam1Container_${refsPid}`);
        refsForPid.conquestTicketsTeam2Container = findWidgetInSubtree(ticketsRoot, `ConquestTicketsHudTeam2Container_${refsPid}`);
        refsForPid.conquestTicketsDebugTeam1Shadow = findWidgetInSubtree(ticketsRoot, `ConquestTicketsHudTeam1Shadow_${refsPid}`);
        refsForPid.conquestTicketsDebugTeam2Shadow = findWidgetInSubtree(ticketsRoot, `ConquestTicketsHudTeam2Shadow_${refsPid}`);
        refsForPid.conquestTicketsDebugTeam1 = findWidgetInSubtree(ticketsRoot, `ConquestTicketsHudTeam1CoreOverlay_${refsPid}`)
            ?? findWidgetInSubtree(ticketsRoot, `ConquestTicketsHudTeam1_${refsPid}`);
        refsForPid.conquestTicketsDebugTeam2 = findWidgetInSubtree(ticketsRoot, `ConquestTicketsHudTeam2CoreOverlay_${refsPid}`)
            ?? findWidgetInSubtree(ticketsRoot, `ConquestTicketsHudTeam2_${refsPid}`);
        refsForPid.conquestTicketsSlash = findWidgetInSubtree(ticketsRoot, `ConquestTicketsHudSlash_${refsPid}`);
        refsForPid.conquestTicketsDebugLeftBarTrack = findWidgetInSubtree(ticketsRoot, `ConquestTicketsHudLeftBarTrack_${refsPid}`);
        refsForPid.conquestTicketsDebugLeftBarFill = findWidgetInSubtree(ticketsRoot, `ConquestTicketsHudLeftBarFill_${refsPid}`);
        refsForPid.conquestTicketsDebugRightBarTrack = findWidgetInSubtree(ticketsRoot, `ConquestTicketsHudRightBarTrack_${refsPid}`);
        refsForPid.conquestTicketsDebugRightBarFill = findWidgetInSubtree(ticketsRoot, `ConquestTicketsHudRightBarFill_${refsPid}`);
        refsForPid.conquestTicketsLeadLeftBorder = findWidgetInSubtree(ticketsRoot, `ConquestTicketsHudLeadBorderLeft_${refsPid}`);
        refsForPid.conquestTicketsLeadRightBorder = findWidgetInSubtree(ticketsRoot, `ConquestTicketsHudLeadBorderRight_${refsPid}`);
        refsForPid.conquestTicketsLeadLeftCrownShadow = findWidgetInSubtree(ticketsRoot, `ConquestTicketsHudLeadCrownLeftShadow_${refsPid}`);
        refsForPid.conquestTicketsLeadRightCrownShadow = findWidgetInSubtree(ticketsRoot, `ConquestTicketsHudLeadCrownRightShadow_${refsPid}`);
        refsForPid.conquestTicketsLeadLeftCrown = findWidgetInSubtree(ticketsRoot, `ConquestTicketsHudLeadCrownLeft_${refsPid}`);
        refsForPid.conquestTicketsLeadRightCrown = findWidgetInSubtree(ticketsRoot, `ConquestTicketsHudLeadCrownRight_${refsPid}`);

        refsForPid.conquestTicketsBleedLeftChevrons = [];
        refsForPid.conquestTicketsBleedRightChevrons = [];
        for (let chevronIndex = 0; chevronIndex < CONQUEST_HUD_TICKET_BLEED_CHEVRON_COUNT; chevronIndex++) {
            const slot = chevronIndex + 1;
            refsForPid.conquestTicketsBleedLeftChevrons[chevronIndex] = findWidgetInSubtree(
                ticketsRoot,
                `ConquestTicketsHudBleedChevronLeft${slot}_${refsPid}`
            );
            refsForPid.conquestTicketsBleedRightChevrons[chevronIndex] = findWidgetInSubtree(
                ticketsRoot,
                `ConquestTicketsHudBleedChevronRight${slot}_${refsPid}`
            );
        }

        return !!(
            refsForPid.conquestTicketsTeam1Container
            && refsForPid.conquestTicketsTeam2Container
            && refsForPid.conquestTicketsDebugTeam1
            && refsForPid.conquestTicketsDebugTeam2
            && refsForPid.conquestTicketsDebugLeftBarTrack
            && refsForPid.conquestTicketsDebugLeftBarFill
            && refsForPid.conquestTicketsDebugRightBarTrack
            && refsForPid.conquestTicketsDebugRightBarFill
        );
    };

    // Rebinds all flag/popout/engage refs from the pinned flags subtree.
    const rebindConquestFlagRefsFromPinnedTree = (refsForPid: HudRefs): boolean => {
        const refsPid = refsForPid.pid;
        const flagsRoot = refsForPid.conquestFlagsDebugRoot;
        if (!flagsRoot) return false;

        refsForPid.conquestFlagsDebugSlotRoots = [];
        refsForPid.conquestFlagsDebugBorderRows = [];
        refsForPid.conquestFlagsDebugFillRows = [];
        refsForPid.conquestFlagsDebugLabelShadowRightRows = [];
        refsForPid.conquestFlagsDebugLabelShadowLeftRows = [];
        refsForPid.conquestFlagsDebugLabelShadowUpRows = [];
        refsForPid.conquestFlagsDebugLabelShadowDownRows = [];
        refsForPid.conquestFlagsDebugLabelShadowUpLeftRows = [];
        refsForPid.conquestFlagsDebugLabelShadowUpRightRows = [];
        refsForPid.conquestFlagsDebugLabelShadowDownRightRows = [];
        refsForPid.conquestFlagsDebugLabelShadowDownLeftRows = [];
        refsForPid.conquestFlagsDebugLabelShadowInnerRows = [];
        refsForPid.conquestFlagsDebugLabelShadowInnerDeepRows = [];
        refsForPid.conquestFlagsDebugLabelRows = [];
        refsForPid.conquestFlagsDebugPercentRoots = [];
        refsForPid.conquestFlagsDebugPercentShadowRightRows = [];
        refsForPid.conquestFlagsDebugPercentShadowLeftRows = [];
        refsForPid.conquestFlagsDebugPercentShadowUpRows = [];
        refsForPid.conquestFlagsDebugPercentShadowDownRows = [];
        refsForPid.conquestFlagsDebugPercentShadowUpLeftRows = [];
        refsForPid.conquestFlagsDebugPercentShadowUpRightRows = [];
        refsForPid.conquestFlagsDebugPercentShadowDownRightRows = [];
        refsForPid.conquestFlagsDebugPercentShadowDownLeftRows = [];
        refsForPid.conquestFlagsDebugPercentShadowInnerRows = [];
        refsForPid.conquestFlagsDebugPercentTextRows = [];
        for (let i = 0; i < CONQUEST_FLAGS_MAX_ROWS; i++) {
            refsForPid.conquestFlagsDebugSlotRoots[i] = findWidgetInSubtree(flagsRoot, `ConquestFlagHudSlot_${refsPid}_${i}`);
            refsForPid.conquestFlagsDebugBorderRows[i] = findWidgetInSubtree(flagsRoot, `ConquestFlagHudBorder_${refsPid}_${i}`);
            refsForPid.conquestFlagsDebugFillRows[i] = findWidgetInSubtree(flagsRoot, `ConquestFlagHudFill_${refsPid}_${i}`);
            refsForPid.conquestFlagsDebugLabelShadowRightRows[i] = findWidgetInSubtree(flagsRoot, `ConquestFlagHudLabelShadowRight_${refsPid}_${i}`);
            refsForPid.conquestFlagsDebugLabelShadowLeftRows[i] = findWidgetInSubtree(flagsRoot, `ConquestFlagHudLabelShadowLeft_${refsPid}_${i}`);
            refsForPid.conquestFlagsDebugLabelShadowUpRows[i] = findWidgetInSubtree(flagsRoot, `ConquestFlagHudLabelShadowUp_${refsPid}_${i}`);
            refsForPid.conquestFlagsDebugLabelShadowDownRows[i] = findWidgetInSubtree(flagsRoot, `ConquestFlagHudLabelShadowDown_${refsPid}_${i}`);
            refsForPid.conquestFlagsDebugLabelShadowUpLeftRows[i] = findWidgetInSubtree(flagsRoot, `ConquestFlagHudLabelShadowUpLeft_${refsPid}_${i}`);
            refsForPid.conquestFlagsDebugLabelShadowUpRightRows[i] = findWidgetInSubtree(flagsRoot, `ConquestFlagHudLabelShadowUpRight_${refsPid}_${i}`);
            refsForPid.conquestFlagsDebugLabelShadowDownRightRows[i] = findWidgetInSubtree(flagsRoot, `ConquestFlagHudLabelShadowDownRight_${refsPid}_${i}`);
            refsForPid.conquestFlagsDebugLabelShadowDownLeftRows[i] = findWidgetInSubtree(flagsRoot, `ConquestFlagHudLabelShadowDownLeft_${refsPid}_${i}`);
            refsForPid.conquestFlagsDebugLabelShadowInnerRows[i] = findWidgetInSubtree(flagsRoot, `ConquestFlagHudLabelShadowInner_${refsPid}_${i}`);
            refsForPid.conquestFlagsDebugLabelShadowInnerDeepRows[i] = findWidgetInSubtree(flagsRoot, `ConquestFlagHudLabelShadowInnerDeep_${refsPid}_${i}`);
            refsForPid.conquestFlagsDebugLabelRows[i] = findWidgetInSubtree(flagsRoot, `ConquestFlagHudLabel_${refsPid}_${i}`);
            refsForPid.conquestFlagsDebugPercentRoots[i] = findWidgetInSubtree(flagsRoot, `ConquestFlagHudPercentRoot_${refsPid}_${i}`);
            refsForPid.conquestFlagsDebugPercentShadowRightRows[i] = findWidgetInSubtree(flagsRoot, `ConquestFlagHudPercentShadowRight_${refsPid}_${i}`);
            refsForPid.conquestFlagsDebugPercentShadowLeftRows[i] = findWidgetInSubtree(flagsRoot, `ConquestFlagHudPercentShadowLeft_${refsPid}_${i}`);
            refsForPid.conquestFlagsDebugPercentShadowUpRows[i] = findWidgetInSubtree(flagsRoot, `ConquestFlagHudPercentShadowUp_${refsPid}_${i}`);
            refsForPid.conquestFlagsDebugPercentShadowDownRows[i] = findWidgetInSubtree(flagsRoot, `ConquestFlagHudPercentShadowDown_${refsPid}_${i}`);
            refsForPid.conquestFlagsDebugPercentShadowUpLeftRows[i] = findWidgetInSubtree(flagsRoot, `ConquestFlagHudPercentShadowUpLeft_${refsPid}_${i}`);
            refsForPid.conquestFlagsDebugPercentShadowUpRightRows[i] = findWidgetInSubtree(flagsRoot, `ConquestFlagHudPercentShadowUpRight_${refsPid}_${i}`);
            refsForPid.conquestFlagsDebugPercentShadowDownRightRows[i] = findWidgetInSubtree(flagsRoot, `ConquestFlagHudPercentShadowDownRight_${refsPid}_${i}`);
            refsForPid.conquestFlagsDebugPercentShadowDownLeftRows[i] = findWidgetInSubtree(flagsRoot, `ConquestFlagHudPercentShadowDownLeft_${refsPid}_${i}`);
            refsForPid.conquestFlagsDebugPercentShadowInnerRows[i] = findWidgetInSubtree(flagsRoot, `ConquestFlagHudPercentShadowInner_${refsPid}_${i}`);
            refsForPid.conquestFlagsDebugPercentTextRows[i] = findWidgetInSubtree(flagsRoot, `ConquestFlagHudPercentText_${refsPid}_${i}`);
        }

        refsForPid.conquestFlagsActivePopoutRoot = findWidgetInSubtree(flagsRoot, `ConquestFlagHudActivePopoutRoot_${refsPid}`);
        refsForPid.conquestFlagsActivePopoutSlot = findWidgetInSubtree(flagsRoot, `ConquestFlagHudActivePopoutSlot_${refsPid}`);
        refsForPid.conquestFlagsActivePopoutBorder = findWidgetInSubtree(flagsRoot, `ConquestFlagHudActivePopoutBorder_${refsPid}`);
        refsForPid.conquestFlagsActivePopoutFill = findWidgetInSubtree(flagsRoot, `ConquestFlagHudActivePopoutFill_${refsPid}`);
        refsForPid.conquestFlagsActivePopoutLabelShadowRight = findWidgetInSubtree(flagsRoot, `ConquestFlagHudActivePopoutLabelShadowRight_${refsPid}`);
        refsForPid.conquestFlagsActivePopoutLabelShadowLeft = findWidgetInSubtree(flagsRoot, `ConquestFlagHudActivePopoutLabelShadowLeft_${refsPid}`);
        refsForPid.conquestFlagsActivePopoutLabelShadowUp = findWidgetInSubtree(flagsRoot, `ConquestFlagHudActivePopoutLabelShadowUp_${refsPid}`);
        refsForPid.conquestFlagsActivePopoutLabelShadowDown = findWidgetInSubtree(flagsRoot, `ConquestFlagHudActivePopoutLabelShadowDown_${refsPid}`);
        refsForPid.conquestFlagsActivePopoutLabelShadowUpLeft = findWidgetInSubtree(flagsRoot, `ConquestFlagHudActivePopoutLabelShadowUpLeft_${refsPid}`);
        refsForPid.conquestFlagsActivePopoutLabelShadowUpRight = findWidgetInSubtree(flagsRoot, `ConquestFlagHudActivePopoutLabelShadowUpRight_${refsPid}`);
        refsForPid.conquestFlagsActivePopoutLabelShadowDownRight = findWidgetInSubtree(flagsRoot, `ConquestFlagHudActivePopoutLabelShadowDownRight_${refsPid}`);
        refsForPid.conquestFlagsActivePopoutLabelShadowDownLeft = findWidgetInSubtree(flagsRoot, `ConquestFlagHudActivePopoutLabelShadowDownLeft_${refsPid}`);
        refsForPid.conquestFlagsActivePopoutLabel = findWidgetInSubtree(flagsRoot, `ConquestFlagHudActivePopoutLabel_${refsPid}`);
        refsForPid.conquestFlagsActivePopoutPercentRoot = findWidgetInSubtree(flagsRoot, `ConquestFlagHudActivePopoutPercentRoot_${refsPid}`);
        refsForPid.conquestFlagsActivePopoutPercentShadowRight = findWidgetInSubtree(flagsRoot, `ConquestFlagHudActivePopoutPercentShadowRight_${refsPid}`);
        refsForPid.conquestFlagsActivePopoutPercentShadowLeft = findWidgetInSubtree(flagsRoot, `ConquestFlagHudActivePopoutPercentShadowLeft_${refsPid}`);
        refsForPid.conquestFlagsActivePopoutPercentShadowUp = findWidgetInSubtree(flagsRoot, `ConquestFlagHudActivePopoutPercentShadowUp_${refsPid}`);
        refsForPid.conquestFlagsActivePopoutPercentShadowDown = findWidgetInSubtree(flagsRoot, `ConquestFlagHudActivePopoutPercentShadowDown_${refsPid}`);
        refsForPid.conquestFlagsActivePopoutPercentShadowUpLeft = findWidgetInSubtree(flagsRoot, `ConquestFlagHudActivePopoutPercentShadowUpLeft_${refsPid}`);
        refsForPid.conquestFlagsActivePopoutPercentShadowUpRight = findWidgetInSubtree(flagsRoot, `ConquestFlagHudActivePopoutPercentShadowUpRight_${refsPid}`);
        refsForPid.conquestFlagsActivePopoutPercentShadowDownRight = findWidgetInSubtree(flagsRoot, `ConquestFlagHudActivePopoutPercentShadowDownRight_${refsPid}`);
        refsForPid.conquestFlagsActivePopoutPercentShadowDownLeft = findWidgetInSubtree(flagsRoot, `ConquestFlagHudActivePopoutPercentShadowDownLeft_${refsPid}`);
        refsForPid.conquestFlagsActivePopoutPercentShadowInner = findWidgetInSubtree(flagsRoot, `ConquestFlagHudActivePopoutPercentShadowInner_${refsPid}`);
        refsForPid.conquestFlagsActivePopoutPercentText = findWidgetInSubtree(flagsRoot, `ConquestFlagHudActivePopoutPercentText_${refsPid}`);

        refsForPid.conquestFlagsEngageRoot = findWidgetInSubtree(flagsRoot, `ConquestFlagHudEngageRoot_${refsPid}`);
        refsForPid.conquestFlagsEngageTrack = findWidgetInSubtree(flagsRoot, `ConquestFlagHudEngageTrack_${refsPid}`);
        refsForPid.conquestFlagsEngageFriendlyFill = findWidgetInSubtree(flagsRoot, `ConquestFlagHudEngageFriendlyFill_${refsPid}`);
        refsForPid.conquestFlagsEngageEnemyFill = findWidgetInSubtree(flagsRoot, `ConquestFlagHudEngageEnemyFill_${refsPid}`);
        refsForPid.conquestFlagsEngageFriendlyCountBg = findWidgetInSubtree(flagsRoot, `ConquestFlagHudEngageFriendlyCountBg_${refsPid}`);
        refsForPid.conquestFlagsEngageEnemyCountBg = findWidgetInSubtree(flagsRoot, `ConquestFlagHudEngageEnemyCountBg_${refsPid}`);
        refsForPid.conquestFlagsEngageFriendlyCountShadow = findWidgetInSubtree(flagsRoot, `ConquestFlagHudEngageFriendlyCountShadow_${refsPid}`);
        refsForPid.conquestFlagsEngageEnemyCountShadow = findWidgetInSubtree(flagsRoot, `ConquestFlagHudEngageEnemyCountShadow_${refsPid}`);
        refsForPid.conquestFlagsEngageFriendlyCount = findWidgetInSubtree(flagsRoot, `ConquestFlagHudEngageFriendlyCount_${refsPid}`);
        refsForPid.conquestFlagsEngageEnemyCount = findWidgetInSubtree(flagsRoot, `ConquestFlagHudEngageEnemyCount_${refsPid}`);
        refsForPid.conquestFlagsEngageStatusShadowRight = findWidgetInSubtree(flagsRoot, `ConquestFlagHudEngageStatusShadowRight_${refsPid}`);
        refsForPid.conquestFlagsEngageStatusShadowLeft = findWidgetInSubtree(flagsRoot, `ConquestFlagHudEngageStatusShadowLeft_${refsPid}`);
        refsForPid.conquestFlagsEngageStatusShadowUp = findWidgetInSubtree(flagsRoot, `ConquestFlagHudEngageStatusShadowUp_${refsPid}`);
        refsForPid.conquestFlagsEngageStatusShadowDown = findWidgetInSubtree(flagsRoot, `ConquestFlagHudEngageStatusShadowDown_${refsPid}`);
        refsForPid.conquestFlagsEngageStatusShadowUpLeft = findWidgetInSubtree(flagsRoot, `ConquestFlagHudEngageStatusShadowUpLeft_${refsPid}`);
        refsForPid.conquestFlagsEngageStatusShadowUpRight = findWidgetInSubtree(flagsRoot, `ConquestFlagHudEngageStatusShadowUpRight_${refsPid}`);
        refsForPid.conquestFlagsEngageStatusShadowDownRight = findWidgetInSubtree(flagsRoot, `ConquestFlagHudEngageStatusShadowDownRight_${refsPid}`);
        refsForPid.conquestFlagsEngageStatusShadowDownLeft = findWidgetInSubtree(flagsRoot, `ConquestFlagHudEngageStatusShadowDownLeft_${refsPid}`);
        refsForPid.conquestFlagsEngageStatus = findWidgetInSubtree(flagsRoot, `ConquestFlagHudEngageStatus_${refsPid}`);

        return !!(
            refsForPid.conquestFlagsDebugSlotRoots[0]
            && refsForPid.conquestFlagsActivePopoutRoot
            && refsForPid.conquestFlagsEngageRoot
            && refsForPid.conquestFlagsEngageTrack
        );
    };

    // Rebinds all critical Conquest HUD refs from centered pinned subtrees.
    const rebindConquestHudRefsFromPinnedTree = (refsForPid: HudRefs): boolean => {
        return rebindConquestTicketRefsFromPinnedTree(refsForPid)
            && rebindConquestFlagRefsFromPinnedTree(refsForPid);
    };

    const purgeLegacyConquestArtifacts = (): void => {
        purgeLegacyConquestRoots();
        purgeLegacyFlagTripletRows();
        purgeLegacyTopCoreContainers();
    };
    const hardResetConquestHudTreeForPid = (): void => {
        destroyConquestHudForPid(pid);
        resetConquestCombatRootInitializationForPid(pid);
        purgeLegacyConquestArtifacts();
    };
    // Returns true when cached root handles are complete for authoritative root-chain pinning.
    const hasCachedCombatRootRefs = (refsForPid: HudRefs): boolean => {
        return !!(
            refsForPid.conquestCombatRoot
            && refsForPid.conquestTicketsDebugRoot
            && refsForPid.conquestFlagsDebugRoot
        );
    };

    const cached = State.hudCache.hudByPid[pid];
    purgeLegacyConquestArtifacts();
    if (cached) {
        if (hasCachedCombatRootRefs(cached) && pinConquestCombatRootsToTopHudRoot(cached)) {
            if (!rebindConquestHudRefsFromPinnedTree(cached)) {
                delete State.hudCache.hudByPid[pid];
            } else {
                State.hudCache.hudByPid[pid] = cached;
                setHudHelpDepthForPid(pid);
                updateSettingsSummaryHudForPid(pid);
                return cached;
            }
        } else {
            delete State.hudCache.hudByPid[pid];
        }
    }

    // Build path: destroy stale/wrong trees and create one deterministic PID-owned tree.
    hardResetConquestHudTreeForPid();

    const refs: HudRefs = { pid, roots: [] };
    refs.conquestCombatRoot = ensureConquestCombatHudRootForPid();

    //#endregion -------------------- HUD Build/Ensure Function Start --------------------



    buildConquestBrandingTopLeftWidgets(player, pid, refs);
    buildConquestTopCenterAuxWidgets(
        player,
        pid,
        refs,
        {
            helpContainerX: CONQUEST_HELP_CONTAINER_X,
            helpContainerY: CONQUEST_HELP_CONTAINER_Y,
            helpContainerWidth: CONQUEST_HELP_CONTAINER_WIDTH,
            helpContainerHeight: CONQUEST_HELP_CONTAINER_HEIGHT,
            helpTextOffsetY: CONQUEST_HELP_TEXT_OFFSET_Y,
            helpTextHeight: CONQUEST_HELP_TEXT_HEIGHT,
            readyContainerX: CONQUEST_READY_CONTAINER_X,
            readyContainerY: CONQUEST_READY_CONTAINER_Y,
            readyContainerWidth: CONQUEST_READY_CONTAINER_WIDTH,
            readyContainerHeight: CONQUEST_READY_CONTAINER_HEIGHT,
            readyTextOffsetY: CONQUEST_READY_TEXT_OFFSET_Y,
            readyTextHeight: CONQUEST_READY_TEXT_HEIGHT,
        }
    );
    buildConquestAdminActionCounterWidget(player, pid, refs);

    {
        const conquestTickets = modlib.ParseUI({
            name: `ConquestTicketsHudRoot_${pid}`,
            type: "Container",
            playerId: player,
            position: [CONQUEST_TICKETS_ROOT_X, CONQUEST_TICKETS_ROOT_Y],
            size: [CONQUEST_TICKETS_ROOT_WIDTH, CONQUEST_TICKETS_ROOT_HEIGHT],
            anchor: mod.UIAnchor.TopCenter,
            visible: false,
            padding: 0,
            bgAlpha: 0,
            bgFill: mod.UIBgFill.None,
            children: [
                {
                    name: `ConquestTicketsHudLeftBarTrack_${pid}`,
                    type: "Container",
                    position: [CONQUEST_TICKETS_LEFT_BAR_X, CONQUEST_TICKETS_BAR_Y],
                    size: [CONQUEST_HUD_TICKET_BAR_WIDTH, CONQUEST_HUD_TICKET_BAR_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgColor: [
                        CONQUEST_HUD_TICKET_BAR_FRIENDLY_TRACK_RGB[0],
                        CONQUEST_HUD_TICKET_BAR_FRIENDLY_TRACK_RGB[1],
                        CONQUEST_HUD_TICKET_BAR_FRIENDLY_TRACK_RGB[2],
                    ],
                    bgAlpha: 0.9,
                    bgFill: mod.UIBgFill.Solid,
                    children: [
                        {
                            name: `ConquestTicketsHudLeftBarFill_${pid}`,
                            type: "Container",
                            position: [0, 0],
                            size: [CONQUEST_HUD_TICKET_BAR_WIDTH, CONQUEST_HUD_TICKET_BAR_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: true,
                            padding: 0,
                            bgColor: [
                                CONQUEST_HUD_TICKET_BAR_FRIENDLY_FILL_RGB[0],
                                CONQUEST_HUD_TICKET_BAR_FRIENDLY_FILL_RGB[1],
                                CONQUEST_HUD_TICKET_BAR_FRIENDLY_FILL_RGB[2],
                            ],
                            bgAlpha: 0.95,
                            bgFill: mod.UIBgFill.Solid,
                        },
                    ],
                },
                {
                    name: `ConquestTicketsHudRightBarTrack_${pid}`,
                    type: "Container",
                    position: [CONQUEST_TICKETS_RIGHT_BAR_X, CONQUEST_TICKETS_BAR_Y],
                    size: [CONQUEST_HUD_TICKET_BAR_WIDTH, CONQUEST_HUD_TICKET_BAR_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgColor: [
                        CONQUEST_HUD_TICKET_BAR_ENEMY_TRACK_RGB[0],
                        CONQUEST_HUD_TICKET_BAR_ENEMY_TRACK_RGB[1],
                        CONQUEST_HUD_TICKET_BAR_ENEMY_TRACK_RGB[2],
                    ],
                    bgAlpha: 0.9,
                    bgFill: mod.UIBgFill.Solid,
                    children: [
                        {
                            name: `ConquestTicketsHudRightBarFill_${pid}`,
                            type: "Container",
                            position: [0, 0],
                            size: [CONQUEST_HUD_TICKET_BAR_WIDTH, CONQUEST_HUD_TICKET_BAR_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: true,
                            padding: 0,
                            bgColor: [
                                CONQUEST_HUD_TICKET_BAR_ENEMY_FILL_RGB[0],
                                CONQUEST_HUD_TICKET_BAR_ENEMY_FILL_RGB[1],
                                CONQUEST_HUD_TICKET_BAR_ENEMY_FILL_RGB[2],
                            ],
                            bgAlpha: 0.95,
                            bgFill: mod.UIBgFill.Solid,
                        },
                    ],
                },
                {
                    // Lead border for the left ticket counter (shown only while this side leads).
                    name: `ConquestTicketsHudLeadBorderLeft_${pid}`,
                    type: "Container",
                    position: [CONQUEST_TICKETS_TEAM_LEFT_X - CONQUEST_HUD_TICKET_LEAD_BORDER_GROW, CONQUEST_TICKETS_ROW_Y - CONQUEST_HUD_TICKET_LEAD_BORDER_GROW],
                    size: [
                        CONQUEST_TICKETS_TEAM_WIDTH + (CONQUEST_HUD_TICKET_LEAD_BORDER_GROW * 2),
                        CONQUEST_TICKETS_TEAM_HEIGHT + (CONQUEST_HUD_TICKET_LEAD_BORDER_GROW * 2),
                    ],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: false,
                    padding: 0,
                    bgColor: [
                        CONQUEST_HUD_TEXT_FRIENDLY_RGB[0],
                        CONQUEST_HUD_TEXT_FRIENDLY_RGB[1],
                        CONQUEST_HUD_TEXT_FRIENDLY_RGB[2],
                    ],
                    bgAlpha: CONQUEST_HUD_TICKET_LEAD_BORDER_ALPHA,
                    bgFill: mod.UIBgFill.OutlineThin,
                },
                {
                    // Lead border for the right ticket counter (shown only while this side leads).
                    name: `ConquestTicketsHudLeadBorderRight_${pid}`,
                    type: "Container",
                    position: [CONQUEST_TICKETS_TEAM_RIGHT_X - CONQUEST_HUD_TICKET_LEAD_BORDER_GROW, CONQUEST_TICKETS_ROW_Y - CONQUEST_HUD_TICKET_LEAD_BORDER_GROW],
                    size: [
                        CONQUEST_TICKETS_TEAM_WIDTH + (CONQUEST_HUD_TICKET_LEAD_BORDER_GROW * 2),
                        CONQUEST_TICKETS_TEAM_HEIGHT + (CONQUEST_HUD_TICKET_LEAD_BORDER_GROW * 2),
                    ],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: false,
                    padding: 0,
                    bgColor: [
                        CONQUEST_HUD_TEXT_ENEMY_RGB[0],
                        CONQUEST_HUD_TEXT_ENEMY_RGB[1],
                        CONQUEST_HUD_TEXT_ENEMY_RGB[2],
                    ],
                    bgAlpha: CONQUEST_HUD_TICKET_LEAD_BORDER_ALPHA,
                    bgFill: mod.UIBgFill.OutlineThin,
                },
                {
                    // Drop shadow for the left lead crown.
                    name: `ConquestTicketsHudLeadCrownLeftShadow_${pid}`,
                    type: "Image",
                    position: [
                        CONQUEST_TICKETS_TEAM_LEFT_X + ((CONQUEST_TICKETS_TEAM_WIDTH - CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE) / 2) - CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_CENTER_SHIFT + CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_OFFSET,
                        -(CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE + CONQUEST_HUD_TICKET_LEAD_CROWN_GAP_Y) - CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_CENTER_SHIFT + CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_OFFSET + CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_TOP_BIAS,
                    ],
                    size: [CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_SIZE, CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_SIZE],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: false,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    imageType: mod.UIImageType.CrownSolid,
                    imageColor: [0, 0, 0],
                    imageAlpha: CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_ALPHA,
                },
                {
                    // Lead crown for the left ticket counter (shown only while this side leads).
                    name: `ConquestTicketsHudLeadCrownLeft_${pid}`,
                    type: "Image",
                    position: [
                        CONQUEST_TICKETS_TEAM_LEFT_X + ((CONQUEST_TICKETS_TEAM_WIDTH - CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE) / 2),
                        -(CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE + CONQUEST_HUD_TICKET_LEAD_CROWN_GAP_Y),
                    ],
                    size: [CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE, CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: false,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    imageType: mod.UIImageType.CrownSolid,
                    imageColor: [
                        CONQUEST_HUD_TICKET_LEAD_CROWN_RGB[0],
                        CONQUEST_HUD_TICKET_LEAD_CROWN_RGB[1],
                        CONQUEST_HUD_TICKET_LEAD_CROWN_RGB[2],
                    ],
                    imageAlpha: 1,
                },
                {
                    // Drop shadow for the right lead crown.
                    name: `ConquestTicketsHudLeadCrownRightShadow_${pid}`,
                    type: "Image",
                    position: [
                        CONQUEST_TICKETS_TEAM_RIGHT_X + ((CONQUEST_TICKETS_TEAM_WIDTH - CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE) / 2) - CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_CENTER_SHIFT + CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_OFFSET,
                        -(CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE + CONQUEST_HUD_TICKET_LEAD_CROWN_GAP_Y) - CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_CENTER_SHIFT + CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_OFFSET + CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_TOP_BIAS,
                    ],
                    size: [CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_SIZE, CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_SIZE],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: false,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    imageType: mod.UIImageType.CrownSolid,
                    imageColor: [0, 0, 0],
                    imageAlpha: CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_ALPHA,
                },
                {
                    // Lead crown for the right ticket counter (shown only while this side leads).
                    name: `ConquestTicketsHudLeadCrownRight_${pid}`,
                    type: "Image",
                    position: [
                        CONQUEST_TICKETS_TEAM_RIGHT_X + ((CONQUEST_TICKETS_TEAM_WIDTH - CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE) / 2),
                        -(CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE + CONQUEST_HUD_TICKET_LEAD_CROWN_GAP_Y),
                    ],
                    size: [CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE, CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: false,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    imageType: mod.UIImageType.CrownSolid,
                    imageColor: [
                        CONQUEST_HUD_TICKET_LEAD_CROWN_RGB[0],
                        CONQUEST_HUD_TICKET_LEAD_CROWN_RGB[1],
                        CONQUEST_HUD_TICKET_LEAD_CROWN_RGB[2],
                    ],
                    imageAlpha: 1,
                },
                {
                    name: `ConquestTicketsHudBleedChevronLeft1_${pid}`,
                    type: "Text",
                    position: [CONQUEST_TICKETS_BLEED_LEFT_X, CONQUEST_TICKETS_BLEED_Y],
                    size: [CONQUEST_HUD_TICKET_BLEED_CHEVRON_WIDTH, CONQUEST_HUD_TICKET_BLEED_CHEVRON_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: false,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(STR_HUD_CONQUEST_BLEED_CHEVRON_LEFT),
                    textColor: [
                        CONQUEST_HUD_TICKET_BLEED_CHEVRON_FRIENDLY_RGB[0],
                        CONQUEST_HUD_TICKET_BLEED_CHEVRON_FRIENDLY_RGB[1],
                        CONQUEST_HUD_TICKET_BLEED_CHEVRON_FRIENDLY_RGB[2],
                    ],
                    textAlpha: 1,
                    textSize: CONQUEST_HUD_TICKET_BLEED_CHEVRON_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    name: `ConquestTicketsHudBleedChevronLeft2_${pid}`,
                    type: "Text",
                    position: [CONQUEST_TICKETS_BLEED_LEFT_X + CONQUEST_HUD_TICKET_BLEED_CHEVRON_STEP_X, CONQUEST_TICKETS_BLEED_Y],
                    size: [CONQUEST_HUD_TICKET_BLEED_CHEVRON_WIDTH, CONQUEST_HUD_TICKET_BLEED_CHEVRON_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: false,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(STR_HUD_CONQUEST_BLEED_CHEVRON_LEFT),
                    textColor: [
                        CONQUEST_HUD_TICKET_BLEED_CHEVRON_FRIENDLY_RGB[0],
                        CONQUEST_HUD_TICKET_BLEED_CHEVRON_FRIENDLY_RGB[1],
                        CONQUEST_HUD_TICKET_BLEED_CHEVRON_FRIENDLY_RGB[2],
                    ],
                    textAlpha: 1,
                    textSize: CONQUEST_HUD_TICKET_BLEED_CHEVRON_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    name: `ConquestTicketsHudBleedChevronLeft3_${pid}`,
                    type: "Text",
                    position: [CONQUEST_TICKETS_BLEED_LEFT_X + (CONQUEST_HUD_TICKET_BLEED_CHEVRON_STEP_X * 2), CONQUEST_TICKETS_BLEED_Y],
                    size: [CONQUEST_HUD_TICKET_BLEED_CHEVRON_WIDTH, CONQUEST_HUD_TICKET_BLEED_CHEVRON_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: false,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(STR_HUD_CONQUEST_BLEED_CHEVRON_LEFT),
                    textColor: [
                        CONQUEST_HUD_TICKET_BLEED_CHEVRON_FRIENDLY_RGB[0],
                        CONQUEST_HUD_TICKET_BLEED_CHEVRON_FRIENDLY_RGB[1],
                        CONQUEST_HUD_TICKET_BLEED_CHEVRON_FRIENDLY_RGB[2],
                    ],
                    textAlpha: 1,
                    textSize: CONQUEST_HUD_TICKET_BLEED_CHEVRON_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    name: `ConquestTicketsHudBleedChevronRight1_${pid}`,
                    type: "Text",
                    position: [CONQUEST_TICKETS_BLEED_RIGHT_X, CONQUEST_TICKETS_BLEED_Y],
                    size: [CONQUEST_HUD_TICKET_BLEED_CHEVRON_WIDTH, CONQUEST_HUD_TICKET_BLEED_CHEVRON_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: false,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(STR_HUD_CONQUEST_BLEED_CHEVRON_RIGHT),
                    textColor: [
                        CONQUEST_HUD_TICKET_BLEED_CHEVRON_ENEMY_RGB[0],
                        CONQUEST_HUD_TICKET_BLEED_CHEVRON_ENEMY_RGB[1],
                        CONQUEST_HUD_TICKET_BLEED_CHEVRON_ENEMY_RGB[2],
                    ],
                    textAlpha: 1,
                    textSize: CONQUEST_HUD_TICKET_BLEED_CHEVRON_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    name: `ConquestTicketsHudBleedChevronRight2_${pid}`,
                    type: "Text",
                    position: [CONQUEST_TICKETS_BLEED_RIGHT_X - CONQUEST_HUD_TICKET_BLEED_CHEVRON_STEP_X, CONQUEST_TICKETS_BLEED_Y],
                    size: [CONQUEST_HUD_TICKET_BLEED_CHEVRON_WIDTH, CONQUEST_HUD_TICKET_BLEED_CHEVRON_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: false,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(STR_HUD_CONQUEST_BLEED_CHEVRON_RIGHT),
                    textColor: [
                        CONQUEST_HUD_TICKET_BLEED_CHEVRON_ENEMY_RGB[0],
                        CONQUEST_HUD_TICKET_BLEED_CHEVRON_ENEMY_RGB[1],
                        CONQUEST_HUD_TICKET_BLEED_CHEVRON_ENEMY_RGB[2],
                    ],
                    textAlpha: 1,
                    textSize: CONQUEST_HUD_TICKET_BLEED_CHEVRON_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    name: `ConquestTicketsHudBleedChevronRight3_${pid}`,
                    type: "Text",
                    position: [CONQUEST_TICKETS_BLEED_RIGHT_X - (CONQUEST_HUD_TICKET_BLEED_CHEVRON_STEP_X * 2), CONQUEST_TICKETS_BLEED_Y],
                    size: [CONQUEST_HUD_TICKET_BLEED_CHEVRON_WIDTH, CONQUEST_HUD_TICKET_BLEED_CHEVRON_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: false,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(STR_HUD_CONQUEST_BLEED_CHEVRON_RIGHT),
                    textColor: [
                        CONQUEST_HUD_TICKET_BLEED_CHEVRON_ENEMY_RGB[0],
                        CONQUEST_HUD_TICKET_BLEED_CHEVRON_ENEMY_RGB[1],
                        CONQUEST_HUD_TICKET_BLEED_CHEVRON_ENEMY_RGB[2],
                    ],
                    textAlpha: 1,
                    textSize: CONQUEST_HUD_TICKET_BLEED_CHEVRON_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    name: `ConquestTicketsHudTeam1Container_${pid}`,
                    type: "Container",
                    position: [CONQUEST_TICKETS_TEAM_LEFT_X, CONQUEST_TICKETS_ROW_Y],
                    size: [CONQUEST_TICKETS_TEAM_WIDTH, CONQUEST_TICKETS_TEAM_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgColor: [
                        CONQUEST_TICKETS_BG_RGB[0],
                        CONQUEST_TICKETS_BG_RGB[1],
                        CONQUEST_TICKETS_BG_RGB[2],
                    ],
                    bgAlpha: CONQUEST_TICKETS_BG_ALPHA,
                    bgFill: mod.UIBgFill.Blur,
                    children: [
                        {
                            name: `ConquestTicketsHudTeam1Shadow_${pid}`,
                            type: "Text",
                            position: [
                                CONQUEST_TICKETS_TEAM_TEXT_LEFT_OFFSET_X + CONQUEST_HUD_TICKET_COUNTER_SHADOW_OFFSET,
                                CONQUEST_HUD_TICKET_COUNTER_SHADOW_OFFSET,
                            ],
                            size: [CONQUEST_TICKETS_TEAM_WIDTH, CONQUEST_TICKETS_TEAM_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: false,
                            padding: 0,
                            bgAlpha: 0,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                            textColor: [0, 0, 0],
                            textAlpha: 1,
                            textSize: CONQUEST_TICKETS_TEAM_SHADOW_TEXT_SIZE,
                            textAnchor: mod.UIAnchor.Center,
                        },
                        {
                            name: `ConquestTicketsHudTeam1_${pid}`,
                            type: "Text",
                            position: [CONQUEST_TICKETS_TEAM_TEXT_LEFT_OFFSET_X, 0],
                            size: [CONQUEST_TICKETS_TEAM_WIDTH, CONQUEST_TICKETS_TEAM_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: true,
                            padding: 0,
                            bgAlpha: 0,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                            textColor: [
                                CONQUEST_HUD_TEXT_FRIENDLY_RGB[0],
                                CONQUEST_HUD_TEXT_FRIENDLY_RGB[1],
                                CONQUEST_HUD_TEXT_FRIENDLY_RGB[2],
                            ],
                            textAlpha: 1,
                            textSize: CONQUEST_TICKETS_TEAM_TEXT_SIZE,
                            textAnchor: mod.UIAnchor.Center,
                        },
                        {
                            name: `ConquestTicketsHudTeam1CoreOverlay_${pid}`,
                            type: "Text",
                            position: [CONQUEST_TICKETS_TEAM_TEXT_LEFT_OFFSET_X, 0],
                            size: [CONQUEST_TICKETS_TEAM_WIDTH, CONQUEST_TICKETS_TEAM_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: true,
                            padding: 0,
                            bgAlpha: 0,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                            textColor: [
                                CONQUEST_HUD_TEXT_FRIENDLY_RGB[0],
                                CONQUEST_HUD_TEXT_FRIENDLY_RGB[1],
                                CONQUEST_HUD_TEXT_FRIENDLY_RGB[2],
                            ],
                            textAlpha: 1,
                            textSize: CONQUEST_TICKETS_TEAM_TEXT_SIZE,
                            textAnchor: mod.UIAnchor.Center,
                        },
                    ],
                },
                {
                    name: `ConquestTicketsHudSlash_${pid}`,
                    type: "Text",
                    position: [272, CONQUEST_TICKETS_ROW_Y],
                    size: [16, 24],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: false,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.stringkeys.twl.system.slash,
                    textColor: [
                        CONQUEST_HUD_TEXT_NEUTRAL_RGB[0],
                        CONQUEST_HUD_TEXT_NEUTRAL_RGB[1],
                        CONQUEST_HUD_TEXT_NEUTRAL_RGB[2],
                    ],
                    textAlpha: 1,
                    textSize: 22,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    name: `ConquestTicketsHudTeam2Container_${pid}`,
                    type: "Container",
                    position: [CONQUEST_TICKETS_TEAM_RIGHT_X, CONQUEST_TICKETS_ROW_Y],
                    size: [CONQUEST_TICKETS_TEAM_WIDTH, CONQUEST_TICKETS_TEAM_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgColor: [
                        CONQUEST_TICKETS_BG_RGB[0],
                        CONQUEST_TICKETS_BG_RGB[1],
                        CONQUEST_TICKETS_BG_RGB[2],
                    ],
                    bgAlpha: CONQUEST_TICKETS_BG_ALPHA,
                    bgFill: mod.UIBgFill.Blur,
                    children: [
                        {
                            name: `ConquestTicketsHudTeam2Shadow_${pid}`,
                            type: "Text",
                            position: [
                                CONQUEST_TICKETS_TEAM_TEXT_RIGHT_OFFSET_X + CONQUEST_HUD_TICKET_COUNTER_SHADOW_OFFSET,
                                CONQUEST_HUD_TICKET_COUNTER_SHADOW_OFFSET,
                            ],
                            size: [CONQUEST_TICKETS_TEAM_WIDTH, CONQUEST_TICKETS_TEAM_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: false,
                            padding: 0,
                            bgAlpha: 0,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                            textColor: [0, 0, 0],
                            textAlpha: 1,
                            textSize: CONQUEST_TICKETS_TEAM_SHADOW_TEXT_SIZE,
                            textAnchor: mod.UIAnchor.Center,
                        },
                        {
                            name: `ConquestTicketsHudTeam2_${pid}`,
                            type: "Text",
                            position: [CONQUEST_TICKETS_TEAM_TEXT_RIGHT_OFFSET_X, 0],
                            size: [CONQUEST_TICKETS_TEAM_WIDTH, CONQUEST_TICKETS_TEAM_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: true,
                            padding: 0,
                            bgAlpha: 0,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                            textColor: [
                                CONQUEST_HUD_TEXT_ENEMY_RGB[0],
                                CONQUEST_HUD_TEXT_ENEMY_RGB[1],
                                CONQUEST_HUD_TEXT_ENEMY_RGB[2],
                            ],
                            textAlpha: 1,
                            textSize: CONQUEST_TICKETS_TEAM_TEXT_SIZE,
                            textAnchor: mod.UIAnchor.Center,
                        },
                        {
                            name: `ConquestTicketsHudTeam2CoreOverlay_${pid}`,
                            type: "Text",
                            position: [CONQUEST_TICKETS_TEAM_TEXT_RIGHT_OFFSET_X, 0],
                            size: [CONQUEST_TICKETS_TEAM_WIDTH, CONQUEST_TICKETS_TEAM_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: true,
                            padding: 0,
                            bgAlpha: 0,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                            textColor: [
                                CONQUEST_HUD_TEXT_ENEMY_RGB[0],
                                CONQUEST_HUD_TEXT_ENEMY_RGB[1],
                                CONQUEST_HUD_TEXT_ENEMY_RGB[2],
                            ],
                            textAlpha: 1,
                            textSize: CONQUEST_TICKETS_TEAM_TEXT_SIZE,
                            textAnchor: mod.UIAnchor.Center,
                        },
                    ],
                },
            ],
        });
        if (conquestTickets) {
            refs.roots.push(conquestTickets);
            refs.conquestTicketsDebugRoot = conquestTickets;
        }
    }
    ensureConquestTicketCounterShadowWidgets();
    ensureConquestBleedChevronWidgets();

    refs.conquestTicketsTeam1Container = safeFind(`ConquestTicketsHudTeam1Container_${pid}`);
    refs.conquestTicketsTeam2Container = safeFind(`ConquestTicketsHudTeam2Container_${pid}`);
    refs.conquestTicketsDebugTeam1Shadow = safeFind(`ConquestTicketsHudTeam1Shadow_${pid}`);
    refs.conquestTicketsDebugTeam2Shadow = safeFind(`ConquestTicketsHudTeam2Shadow_${pid}`);
    refs.conquestTicketsDebugTeam1 = safeFind(`ConquestTicketsHudTeam1CoreOverlay_${pid}`) ?? safeFind(`ConquestTicketsHudTeam1_${pid}`);
    refs.conquestTicketsDebugTeam2 = safeFind(`ConquestTicketsHudTeam2CoreOverlay_${pid}`) ?? safeFind(`ConquestTicketsHudTeam2_${pid}`);
    refs.conquestTicketsSlash = safeFind(`ConquestTicketsHudSlash_${pid}`);
    refs.conquestTicketsDebugLeftBarTrack = safeFind(`ConquestTicketsHudLeftBarTrack_${pid}`);
    refs.conquestTicketsDebugLeftBarFill = safeFind(`ConquestTicketsHudLeftBarFill_${pid}`);
    refs.conquestTicketsDebugRightBarTrack = safeFind(`ConquestTicketsHudRightBarTrack_${pid}`);
    refs.conquestTicketsDebugRightBarFill = safeFind(`ConquestTicketsHudRightBarFill_${pid}`);
    refs.conquestTicketsLeadLeftBorder = safeFind(`ConquestTicketsHudLeadBorderLeft_${pid}`);
    refs.conquestTicketsLeadRightBorder = safeFind(`ConquestTicketsHudLeadBorderRight_${pid}`);
    refs.conquestTicketsLeadLeftCrownShadow = safeFind(`ConquestTicketsHudLeadCrownLeftShadow_${pid}`);
    refs.conquestTicketsLeadRightCrownShadow = safeFind(`ConquestTicketsHudLeadCrownRightShadow_${pid}`);
    refs.conquestTicketsLeadLeftCrown = safeFind(`ConquestTicketsHudLeadCrownLeft_${pid}`);
    refs.conquestTicketsLeadRightCrown = safeFind(`ConquestTicketsHudLeadCrownRight_${pid}`);
    refs.conquestTicketsBleedLeftChevrons = [];
    refs.conquestTicketsBleedRightChevrons = [];
    for (let chevronIndex = 0; chevronIndex < CONQUEST_HUD_TICKET_BLEED_CHEVRON_COUNT; chevronIndex++) {
        refs.conquestTicketsBleedLeftChevrons[chevronIndex] = safeFind(`ConquestTicketsHudBleedChevronLeft${chevronIndex + 1}_${pid}`);
        refs.conquestTicketsBleedRightChevrons[chevronIndex] = safeFind(`ConquestTicketsHudBleedChevronRight${chevronIndex + 1}_${pid}`);
    }
    const conquestTicketsSlash = refs.conquestTicketsSlash;
    if (refs.conquestTicketsDebugRoot) {
        const ticketsRoot = refs.conquestTicketsDebugRoot;
        const setTicketCounterShadowRingLocalLayout = (
            teamPrefix: string,
            parent: mod.UIWidget,
            baseX: number,
            baseY: number
        ): void => {
            for (let layerIndex = 0; layerIndex < CONQUEST_TICKET_COUNTER_SHADOW_RING_LAYERS.length; layerIndex++) {
                const layer = CONQUEST_TICKET_COUNTER_SHADOW_RING_LAYERS[layerIndex];
                const shadow = safeFind(`${teamPrefix}${layer.suffix}_${pid}`);
                if (!shadow) continue;
                mod.SetUIWidgetParent(shadow, parent);
                mod.SetUIWidgetPosition(
                    shadow,
                    mod.CreateVector(baseX + layer.offsetX, baseY + layer.offsetY, 0)
                );
                mod.SetUIWidgetSize(
                    shadow,
                    mod.CreateVector(CONQUEST_TICKETS_TEAM_WIDTH, CONQUEST_TICKETS_TEAM_HEIGHT, 0)
                );
                mod.SetUITextSize(shadow, CONQUEST_TICKETS_TEAM_SHADOW_TEXT_SIZE);
                mod.SetUITextAlpha(shadow, CONQUEST_HUD_TICKET_COUNTER_SHADOW_ALPHA);
            }
        };
        if (refs.conquestTicketsDebugLeftBarTrack) {
            mod.SetUIWidgetParent(refs.conquestTicketsDebugLeftBarTrack, ticketsRoot);
            mod.SetUIWidgetPosition(
                refs.conquestTicketsDebugLeftBarTrack,
                mod.CreateVector(CONQUEST_TICKETS_LEFT_BAR_X, CONQUEST_TICKETS_BAR_Y, 0)
            );
        }
        if (refs.conquestTicketsDebugLeftBarFill && refs.conquestTicketsDebugLeftBarTrack) {
            mod.SetUIWidgetParent(refs.conquestTicketsDebugLeftBarFill, refs.conquestTicketsDebugLeftBarTrack);
            mod.SetUIWidgetPosition(refs.conquestTicketsDebugLeftBarFill, mod.CreateVector(0, 0, 0));
            mod.SetUIWidgetSize(
                refs.conquestTicketsDebugLeftBarFill,
                mod.CreateVector(CONQUEST_HUD_TICKET_BAR_WIDTH, CONQUEST_HUD_TICKET_BAR_HEIGHT, 0)
            );
        }
        if (refs.conquestTicketsDebugRightBarTrack) {
            mod.SetUIWidgetParent(refs.conquestTicketsDebugRightBarTrack, refs.conquestTicketsDebugRoot);
            mod.SetUIWidgetPosition(
                refs.conquestTicketsDebugRightBarTrack,
                mod.CreateVector(CONQUEST_TICKETS_RIGHT_BAR_X, CONQUEST_TICKETS_BAR_Y, 0)
            );
        }
        if (refs.conquestTicketsDebugRightBarFill && refs.conquestTicketsDebugRightBarTrack) {
            mod.SetUIWidgetParent(refs.conquestTicketsDebugRightBarFill, refs.conquestTicketsDebugRightBarTrack);
            mod.SetUIWidgetPosition(refs.conquestTicketsDebugRightBarFill, mod.CreateVector(0, 0, 0));
            mod.SetUIWidgetSize(
                refs.conquestTicketsDebugRightBarFill,
                mod.CreateVector(CONQUEST_HUD_TICKET_BAR_WIDTH, CONQUEST_HUD_TICKET_BAR_HEIGHT, 0)
            );
        }
        if (refs.conquestTicketsDebugTeam1) {
            const team1Container = refs.conquestTicketsTeam1Container;
            mod.SetUIWidgetParent(refs.conquestTicketsDebugTeam1, team1Container ?? refs.conquestTicketsDebugRoot);
            mod.SetUIWidgetPosition(
                refs.conquestTicketsDebugTeam1,
                team1Container
                    ? mod.CreateVector(CONQUEST_TICKETS_TEAM_TEXT_LEFT_OFFSET_X, 0, 0)
                    : mod.CreateVector(CONQUEST_TICKETS_TEAM_LEFT_X, CONQUEST_TICKETS_ROW_Y, 0)
            );
            mod.SetUIWidgetSize(
                refs.conquestTicketsDebugTeam1,
                mod.CreateVector(CONQUEST_TICKETS_TEAM_WIDTH, CONQUEST_TICKETS_TEAM_HEIGHT, 0)
            );
            if (team1Container) {
                mod.SetUIWidgetParent(team1Container, refs.conquestTicketsDebugRoot);
                mod.SetUIWidgetPosition(
                    team1Container,
                    mod.CreateVector(CONQUEST_TICKETS_TEAM_LEFT_X, CONQUEST_TICKETS_ROW_Y, 0)
                );
                mod.SetUIWidgetSize(
                    team1Container,
                    mod.CreateVector(CONQUEST_TICKETS_TEAM_WIDTH, CONQUEST_TICKETS_TEAM_HEIGHT, 0)
                );
            }
        }
        if (refs.conquestTicketsDebugTeam1Shadow) {
            const team1Container = refs.conquestTicketsTeam1Container;
            mod.SetUIWidgetParent(refs.conquestTicketsDebugTeam1Shadow, team1Container ?? refs.conquestTicketsDebugRoot);
            mod.SetUIWidgetPosition(
                refs.conquestTicketsDebugTeam1Shadow,
                team1Container
                    ? mod.CreateVector(
                        CONQUEST_TICKETS_TEAM_TEXT_LEFT_OFFSET_X + CONQUEST_HUD_TICKET_COUNTER_SHADOW_OFFSET,
                        CONQUEST_HUD_TICKET_COUNTER_SHADOW_OFFSET,
                        0
                    )
                    : mod.CreateVector(
                        CONQUEST_TICKETS_TEAM_LEFT_X + CONQUEST_HUD_TICKET_COUNTER_SHADOW_OFFSET,
                        CONQUEST_TICKETS_ROW_Y + CONQUEST_HUD_TICKET_COUNTER_SHADOW_OFFSET,
                        0
                    )
            );
            mod.SetUIWidgetSize(
                refs.conquestTicketsDebugTeam1Shadow,
                mod.CreateVector(CONQUEST_TICKETS_TEAM_WIDTH, CONQUEST_TICKETS_TEAM_HEIGHT, 0)
            );
            mod.SetUITextSize(refs.conquestTicketsDebugTeam1Shadow, CONQUEST_TICKETS_TEAM_SHADOW_TEXT_SIZE);
            if (refs.conquestTicketsDebugTeam1) {
                mod.SetUIWidgetParent(refs.conquestTicketsDebugTeam1, team1Container ?? refs.conquestTicketsDebugRoot);
                mod.SetUIWidgetPosition(
                    refs.conquestTicketsDebugTeam1,
                    team1Container
                        ? mod.CreateVector(CONQUEST_TICKETS_TEAM_TEXT_LEFT_OFFSET_X, 0, 0)
                        : mod.CreateVector(CONQUEST_TICKETS_TEAM_LEFT_X, CONQUEST_TICKETS_ROW_Y, 0)
                );
                mod.SetUIWidgetSize(
                    refs.conquestTicketsDebugTeam1,
                    mod.CreateVector(CONQUEST_TICKETS_TEAM_WIDTH, CONQUEST_TICKETS_TEAM_HEIGHT, 0)
                );
                mod.SetUITextSize(refs.conquestTicketsDebugTeam1, CONQUEST_TICKETS_TEAM_TEXT_SIZE);
            }
        }
        const team1ShadowParent = refs.conquestTicketsTeam1Container ?? refs.conquestTicketsDebugRoot;
        const team1ShadowBaseX = refs.conquestTicketsTeam1Container ? CONQUEST_TICKETS_TEAM_TEXT_LEFT_OFFSET_X : CONQUEST_TICKETS_TEAM_LEFT_X;
        const team1ShadowBaseY = refs.conquestTicketsTeam1Container ? 0 : CONQUEST_TICKETS_ROW_Y;
        setTicketCounterShadowRingLocalLayout(
            "ConquestTicketsHudTeam1",
            team1ShadowParent,
            team1ShadowBaseX,
            team1ShadowBaseY
        );
        if (conquestTicketsSlash) {
            mod.SetUIWidgetParent(conquestTicketsSlash, refs.conquestTicketsDebugRoot);
            mod.SetUIWidgetPosition(conquestTicketsSlash, mod.CreateVector(272, CONQUEST_TICKETS_ROW_Y, 0));
        }
        if (refs.conquestTicketsDebugTeam2) {
            const team2Container = refs.conquestTicketsTeam2Container;
            mod.SetUIWidgetParent(refs.conquestTicketsDebugTeam2, team2Container ?? refs.conquestTicketsDebugRoot);
            mod.SetUIWidgetPosition(
                refs.conquestTicketsDebugTeam2,
                team2Container
                    ? mod.CreateVector(CONQUEST_TICKETS_TEAM_TEXT_RIGHT_OFFSET_X, 0, 0)
                    : mod.CreateVector(CONQUEST_TICKETS_TEAM_RIGHT_X, CONQUEST_TICKETS_ROW_Y, 0)
            );
            mod.SetUIWidgetSize(
                refs.conquestTicketsDebugTeam2,
                mod.CreateVector(CONQUEST_TICKETS_TEAM_WIDTH, CONQUEST_TICKETS_TEAM_HEIGHT, 0)
            );
            if (team2Container) {
                mod.SetUIWidgetParent(team2Container, refs.conquestTicketsDebugRoot);
                mod.SetUIWidgetPosition(
                    team2Container,
                    mod.CreateVector(CONQUEST_TICKETS_TEAM_RIGHT_X, CONQUEST_TICKETS_ROW_Y, 0)
                );
                mod.SetUIWidgetSize(
                    team2Container,
                    mod.CreateVector(CONQUEST_TICKETS_TEAM_WIDTH, CONQUEST_TICKETS_TEAM_HEIGHT, 0)
                );
            }
        }
        if (refs.conquestTicketsDebugTeam2Shadow) {
            const team2Container = refs.conquestTicketsTeam2Container;
            mod.SetUIWidgetParent(refs.conquestTicketsDebugTeam2Shadow, team2Container ?? refs.conquestTicketsDebugRoot);
            mod.SetUIWidgetPosition(
                refs.conquestTicketsDebugTeam2Shadow,
                team2Container
                    ? mod.CreateVector(
                        CONQUEST_TICKETS_TEAM_TEXT_RIGHT_OFFSET_X + CONQUEST_HUD_TICKET_COUNTER_SHADOW_OFFSET,
                        CONQUEST_HUD_TICKET_COUNTER_SHADOW_OFFSET,
                        0
                    )
                    : mod.CreateVector(
                        CONQUEST_TICKETS_TEAM_RIGHT_X + CONQUEST_HUD_TICKET_COUNTER_SHADOW_OFFSET,
                        CONQUEST_TICKETS_ROW_Y + CONQUEST_HUD_TICKET_COUNTER_SHADOW_OFFSET,
                        0
                    )
            );
            mod.SetUIWidgetSize(
                refs.conquestTicketsDebugTeam2Shadow,
                mod.CreateVector(CONQUEST_TICKETS_TEAM_WIDTH, CONQUEST_TICKETS_TEAM_HEIGHT, 0)
            );
            mod.SetUITextSize(refs.conquestTicketsDebugTeam2Shadow, CONQUEST_TICKETS_TEAM_SHADOW_TEXT_SIZE);
            if (refs.conquestTicketsDebugTeam2) {
                mod.SetUIWidgetParent(refs.conquestTicketsDebugTeam2, team2Container ?? refs.conquestTicketsDebugRoot);
                mod.SetUIWidgetPosition(
                    refs.conquestTicketsDebugTeam2,
                    team2Container
                        ? mod.CreateVector(CONQUEST_TICKETS_TEAM_TEXT_RIGHT_OFFSET_X, 0, 0)
                        : mod.CreateVector(CONQUEST_TICKETS_TEAM_RIGHT_X, CONQUEST_TICKETS_ROW_Y, 0)
                );
                mod.SetUIWidgetSize(
                    refs.conquestTicketsDebugTeam2,
                    mod.CreateVector(CONQUEST_TICKETS_TEAM_WIDTH, CONQUEST_TICKETS_TEAM_HEIGHT, 0)
                );
                mod.SetUITextSize(refs.conquestTicketsDebugTeam2, CONQUEST_TICKETS_TEAM_TEXT_SIZE);
            }
        }
        const team2ShadowParent = refs.conquestTicketsTeam2Container ?? refs.conquestTicketsDebugRoot;
        const team2ShadowBaseX = refs.conquestTicketsTeam2Container ? CONQUEST_TICKETS_TEAM_TEXT_RIGHT_OFFSET_X : CONQUEST_TICKETS_TEAM_RIGHT_X;
        const team2ShadowBaseY = refs.conquestTicketsTeam2Container ? 0 : CONQUEST_TICKETS_ROW_Y;
        setTicketCounterShadowRingLocalLayout(
            "ConquestTicketsHudTeam2",
            team2ShadowParent,
            team2ShadowBaseX,
            team2ShadowBaseY
        );
        if (refs.conquestTicketsLeadLeftBorder) {
            mod.SetUIWidgetParent(refs.conquestTicketsLeadLeftBorder, refs.conquestTicketsDebugRoot);
            mod.SetUIWidgetPosition(
                refs.conquestTicketsLeadLeftBorder,
                mod.CreateVector(CONQUEST_TICKETS_TEAM_LEFT_X - CONQUEST_HUD_TICKET_LEAD_BORDER_GROW, CONQUEST_TICKETS_ROW_Y - CONQUEST_HUD_TICKET_LEAD_BORDER_GROW, 0)
            );
            mod.SetUIWidgetSize(
                refs.conquestTicketsLeadLeftBorder,
                mod.CreateVector(CONQUEST_TICKETS_TEAM_WIDTH + (CONQUEST_HUD_TICKET_LEAD_BORDER_GROW * 2), CONQUEST_TICKETS_TEAM_HEIGHT + (CONQUEST_HUD_TICKET_LEAD_BORDER_GROW * 2), 0)
            );
        }
        if (refs.conquestTicketsLeadRightBorder) {
            mod.SetUIWidgetParent(refs.conquestTicketsLeadRightBorder, refs.conquestTicketsDebugRoot);
            mod.SetUIWidgetPosition(
                refs.conquestTicketsLeadRightBorder,
                mod.CreateVector(CONQUEST_TICKETS_TEAM_RIGHT_X - CONQUEST_HUD_TICKET_LEAD_BORDER_GROW, CONQUEST_TICKETS_ROW_Y - CONQUEST_HUD_TICKET_LEAD_BORDER_GROW, 0)
            );
            mod.SetUIWidgetSize(
                refs.conquestTicketsLeadRightBorder,
                mod.CreateVector(CONQUEST_TICKETS_TEAM_WIDTH + (CONQUEST_HUD_TICKET_LEAD_BORDER_GROW * 2), CONQUEST_TICKETS_TEAM_HEIGHT + (CONQUEST_HUD_TICKET_LEAD_BORDER_GROW * 2), 0)
            );
        }
        if (refs.conquestTicketsLeadLeftCrownShadow) {
            mod.SetUIWidgetParent(refs.conquestTicketsLeadLeftCrownShadow, refs.conquestTicketsDebugRoot);
            mod.SetUIWidgetPosition(
                refs.conquestTicketsLeadLeftCrownShadow,
                mod.CreateVector(
                    CONQUEST_TICKETS_TEAM_LEFT_X + ((CONQUEST_TICKETS_TEAM_WIDTH - CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE) / 2) - CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_CENTER_SHIFT + CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_OFFSET,
                    -(CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE + CONQUEST_HUD_TICKET_LEAD_CROWN_GAP_Y) - CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_CENTER_SHIFT + CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_OFFSET + CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_TOP_BIAS,
                    0
                )
            );
            mod.SetUIWidgetSize(
                refs.conquestTicketsLeadLeftCrownShadow,
                mod.CreateVector(CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_SIZE, CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_SIZE, 0)
            );
        }
        if (refs.conquestTicketsLeadRightCrownShadow) {
            mod.SetUIWidgetParent(refs.conquestTicketsLeadRightCrownShadow, refs.conquestTicketsDebugRoot);
            mod.SetUIWidgetPosition(
                refs.conquestTicketsLeadRightCrownShadow,
                mod.CreateVector(
                    CONQUEST_TICKETS_TEAM_RIGHT_X + ((CONQUEST_TICKETS_TEAM_WIDTH - CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE) / 2) - CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_CENTER_SHIFT + CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_OFFSET,
                    -(CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE + CONQUEST_HUD_TICKET_LEAD_CROWN_GAP_Y) - CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_CENTER_SHIFT + CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_OFFSET + CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_TOP_BIAS,
                    0
                )
            );
            mod.SetUIWidgetSize(
                refs.conquestTicketsLeadRightCrownShadow,
                mod.CreateVector(CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_SIZE, CONQUEST_HUD_TICKET_LEAD_CROWN_SHADOW_SIZE, 0)
            );
        }
        if (refs.conquestTicketsLeadLeftCrown) {
            mod.SetUIWidgetParent(refs.conquestTicketsLeadLeftCrown, refs.conquestTicketsDebugRoot);
            mod.SetUIWidgetPosition(
                refs.conquestTicketsLeadLeftCrown,
                mod.CreateVector(
                    CONQUEST_TICKETS_TEAM_LEFT_X + ((CONQUEST_TICKETS_TEAM_WIDTH - CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE) / 2),
                    -(CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE + CONQUEST_HUD_TICKET_LEAD_CROWN_GAP_Y),
                    0
                )
            );
            mod.SetUIWidgetSize(
                refs.conquestTicketsLeadLeftCrown,
                mod.CreateVector(CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE, CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE, 0)
            );
        }
        if (refs.conquestTicketsLeadRightCrown) {
            mod.SetUIWidgetParent(refs.conquestTicketsLeadRightCrown, refs.conquestTicketsDebugRoot);
            mod.SetUIWidgetPosition(
                refs.conquestTicketsLeadRightCrown,
                mod.CreateVector(
                    CONQUEST_TICKETS_TEAM_RIGHT_X + ((CONQUEST_TICKETS_TEAM_WIDTH - CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE) / 2),
                    -(CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE + CONQUEST_HUD_TICKET_LEAD_CROWN_GAP_Y),
                    0
                )
            );
            mod.SetUIWidgetSize(
                refs.conquestTicketsLeadRightCrown,
                mod.CreateVector(CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE, CONQUEST_HUD_TICKET_LEAD_CROWN_SIZE, 0)
            );
        }
        const leftBleedChevrons = refs.conquestTicketsBleedLeftChevrons ?? [];
        const rightBleedChevrons = refs.conquestTicketsBleedRightChevrons ?? [];
        const chevronOverlayParent = refs.conquestTicketsDebugRoot ?? mod.GetUIRoot();
        for (let chevronIndex = 0; chevronIndex < CONQUEST_HUD_TICKET_BLEED_CHEVRON_COUNT; chevronIndex++) {
            // Keep chevrons under the ticket root so they inherit the same centered lane frame.
            const leftParent = chevronOverlayParent;
            const rightParent = chevronOverlayParent;
            const leftX = getBleedChevronX(true, chevronIndex);
            const rightX = getBleedChevronX(false, chevronIndex);
            const leftY = CONQUEST_TICKETS_BLEED_Y;
            const rightY = CONQUEST_TICKETS_BLEED_Y;
            const leftChevron = leftBleedChevrons[chevronIndex];
            if (leftChevron) {
                mod.SetUIWidgetParent(leftChevron, leftParent);
                mod.SetUIWidgetPosition(
                    leftChevron,
                    mod.CreateVector(leftX, leftY, 0)
                );
                mod.SetUIWidgetSize(
                    leftChevron,
                    mod.CreateVector(CONQUEST_HUD_TICKET_BLEED_CHEVRON_WIDTH, CONQUEST_HUD_TICKET_BLEED_CHEVRON_HEIGHT, 0)
                );
            }
            const rightChevron = rightBleedChevrons[chevronIndex];
            if (rightChevron) {
                mod.SetUIWidgetParent(rightChevron, rightParent);
                mod.SetUIWidgetPosition(
                    rightChevron,
                    mod.CreateVector(rightX, rightY, 0)
                );
                mod.SetUIWidgetSize(
                    rightChevron,
                    mod.CreateVector(CONQUEST_HUD_TICKET_BLEED_CHEVRON_WIDTH, CONQUEST_HUD_TICKET_BLEED_CHEVRON_HEIGHT, 0)
                );
            }
            const setBleedShadowLocalLayout = (name: string, x: number, y: number, parent: mod.UIWidget): void => {
                const shadow = safeFind(name);
                if (!shadow) return;
                mod.SetUIWidgetParent(shadow, parent);
                mod.SetUIWidgetPosition(shadow, mod.CreateVector(x, y, 0));
                mod.SetUIWidgetSize(
                    shadow,
                    mod.CreateVector(CONQUEST_HUD_TICKET_BLEED_CHEVRON_WIDTH, CONQUEST_HUD_TICKET_BLEED_CHEVRON_HEIGHT, 0)
                );
            };
            const slot = chevronIndex + 1;
            const d = CONQUEST_HUD_TICKET_BLEED_CHEVRON_SHADOW_OFFSET;
            const dUp = d * 0.5;
            setBleedShadowLocalLayout(`ConquestTicketsHudBleedChevronLeft${slot}ShadowRight_${pid}`, leftX + d, leftY, leftParent);
            setBleedShadowLocalLayout(`ConquestTicketsHudBleedChevronLeft${slot}ShadowLeft_${pid}`, leftX - d, leftY, leftParent);
            setBleedShadowLocalLayout(`ConquestTicketsHudBleedChevronLeft${slot}ShadowUp_${pid}`, leftX, leftY - dUp, leftParent);
            setBleedShadowLocalLayout(`ConquestTicketsHudBleedChevronLeft${slot}ShadowDown_${pid}`, leftX, leftY + d, leftParent);
            setBleedShadowLocalLayout(`ConquestTicketsHudBleedChevronLeft${slot}ShadowUpLeft_${pid}`, leftX - d, leftY - dUp, leftParent);
            setBleedShadowLocalLayout(`ConquestTicketsHudBleedChevronLeft${slot}ShadowUpRight_${pid}`, leftX + d, leftY - dUp, leftParent);
            setBleedShadowLocalLayout(`ConquestTicketsHudBleedChevronLeft${slot}ShadowDownRight_${pid}`, leftX + d, leftY + d, leftParent);
            setBleedShadowLocalLayout(`ConquestTicketsHudBleedChevronLeft${slot}ShadowDownLeft_${pid}`, leftX - d, leftY + d, leftParent);
            setBleedShadowLocalLayout(`ConquestTicketsHudBleedChevronRight${slot}ShadowRight_${pid}`, rightX + d, rightY, rightParent);
            setBleedShadowLocalLayout(`ConquestTicketsHudBleedChevronRight${slot}ShadowLeft_${pid}`, rightX - d, rightY, rightParent);
            setBleedShadowLocalLayout(`ConquestTicketsHudBleedChevronRight${slot}ShadowUp_${pid}`, rightX, rightY - dUp, rightParent);
            setBleedShadowLocalLayout(`ConquestTicketsHudBleedChevronRight${slot}ShadowDown_${pid}`, rightX, rightY + d, rightParent);
            setBleedShadowLocalLayout(`ConquestTicketsHudBleedChevronRight${slot}ShadowUpLeft_${pid}`, rightX - d, rightY - dUp, rightParent);
            setBleedShadowLocalLayout(`ConquestTicketsHudBleedChevronRight${slot}ShadowUpRight_${pid}`, rightX + d, rightY - dUp, rightParent);
            setBleedShadowLocalLayout(`ConquestTicketsHudBleedChevronRight${slot}ShadowDownRight_${pid}`, rightX + d, rightY + d, rightParent);
            setBleedShadowLocalLayout(`ConquestTicketsHudBleedChevronRight${slot}ShadowDownLeft_${pid}`, rightX - d, rightY + d, rightParent);
            // Re-attach core chevrons after shadows so the colored glyph sits above the black drop-shadow ring.
            if (leftChevron) {
                mod.SetUIWidgetParent(leftChevron, leftParent);
                mod.SetUIWidgetPosition(leftChevron, mod.CreateVector(leftX, leftY, 0));
                mod.SetUIWidgetSize(
                    leftChevron,
                    mod.CreateVector(CONQUEST_HUD_TICKET_BLEED_CHEVRON_WIDTH, CONQUEST_HUD_TICKET_BLEED_CHEVRON_HEIGHT, 0)
                );
            }
            if (rightChevron) {
                mod.SetUIWidgetParent(rightChevron, rightParent);
                mod.SetUIWidgetPosition(rightChevron, mod.CreateVector(rightX, rightY, 0));
                mod.SetUIWidgetSize(
                    rightChevron,
                    mod.CreateVector(CONQUEST_HUD_TICKET_BLEED_CHEVRON_WIDTH, CONQUEST_HUD_TICKET_BLEED_CHEVRON_HEIGHT, 0)
                );
            }
        }
    }
    safeSetUIWidgetDepth(refs.conquestTicketsDebugRoot, mod.UIDepth.AboveGameUI);
    safeSetUIWidgetDepth(refs.conquestTicketsDebugLeftBarTrack, mod.UIDepth.AboveGameUI);
    safeSetUIWidgetDepth(refs.conquestTicketsDebugLeftBarFill, mod.UIDepth.AboveGameUI);
    safeSetUIWidgetDepth(refs.conquestTicketsDebugRightBarTrack, mod.UIDepth.AboveGameUI);
    safeSetUIWidgetDepth(refs.conquestTicketsDebugRightBarFill, mod.UIDepth.AboveGameUI);
    safeSetUIWidgetDepth(refs.conquestTicketsTeam1Container, mod.UIDepth.AboveGameUI);
    safeSetUIWidgetDepth(refs.conquestTicketsTeam2Container, mod.UIDepth.AboveGameUI);
    safeSetUIWidgetDepth(refs.conquestTicketsDebugTeam1Shadow, mod.UIDepth.AboveGameUI);
    safeSetUIWidgetDepth(refs.conquestTicketsDebugTeam1, mod.UIDepth.AboveGameUI);
    safeSetUIWidgetDepth(conquestTicketsSlash, mod.UIDepth.AboveGameUI);
    safeSetUIWidgetDepth(refs.conquestTicketsDebugTeam2Shadow, mod.UIDepth.AboveGameUI);
    safeSetUIWidgetDepth(refs.conquestTicketsDebugTeam2, mod.UIDepth.AboveGameUI);
    safeSetUIWidgetDepth(refs.conquestTicketsLeadLeftBorder, mod.UIDepth.AboveGameUI);
    safeSetUIWidgetDepth(refs.conquestTicketsLeadRightBorder, mod.UIDepth.AboveGameUI);
    safeSetUIWidgetDepth(refs.conquestTicketsLeadLeftCrownShadow, mod.UIDepth.AboveGameUI);
    safeSetUIWidgetDepth(refs.conquestTicketsLeadRightCrownShadow, mod.UIDepth.AboveGameUI);
    safeSetUIWidgetDepth(refs.conquestTicketsLeadLeftCrown, mod.UIDepth.AboveGameUI);
    safeSetUIWidgetDepth(refs.conquestTicketsLeadRightCrown, mod.UIDepth.AboveGameUI);
    const leftBleedChevrons = refs.conquestTicketsBleedLeftChevrons ?? [];
    const rightBleedChevrons = refs.conquestTicketsBleedRightChevrons ?? [];
    for (let chevronIndex = 0; chevronIndex < CONQUEST_HUD_TICKET_BLEED_CHEVRON_COUNT; chevronIndex++) {
        safeSetUIWidgetDepth(leftBleedChevrons[chevronIndex], mod.UIDepth.AboveGameUI);
        safeSetUIWidgetDepth(rightBleedChevrons[chevronIndex], mod.UIDepth.AboveGameUI);
        const slot = chevronIndex + 1;
        safeSetUIWidgetDepth(safeFind(`ConquestTicketsHudBleedChevronLeft${slot}ShadowRight_${pid}`), mod.UIDepth.AboveGameUI);
        safeSetUIWidgetDepth(safeFind(`ConquestTicketsHudBleedChevronLeft${slot}ShadowLeft_${pid}`), mod.UIDepth.AboveGameUI);
        safeSetUIWidgetDepth(safeFind(`ConquestTicketsHudBleedChevronLeft${slot}ShadowUp_${pid}`), mod.UIDepth.AboveGameUI);
        safeSetUIWidgetDepth(safeFind(`ConquestTicketsHudBleedChevronLeft${slot}ShadowDown_${pid}`), mod.UIDepth.AboveGameUI);
        safeSetUIWidgetDepth(safeFind(`ConquestTicketsHudBleedChevronLeft${slot}ShadowUpLeft_${pid}`), mod.UIDepth.AboveGameUI);
        safeSetUIWidgetDepth(safeFind(`ConquestTicketsHudBleedChevronLeft${slot}ShadowUpRight_${pid}`), mod.UIDepth.AboveGameUI);
        safeSetUIWidgetDepth(safeFind(`ConquestTicketsHudBleedChevronLeft${slot}ShadowDownRight_${pid}`), mod.UIDepth.AboveGameUI);
        safeSetUIWidgetDepth(safeFind(`ConquestTicketsHudBleedChevronLeft${slot}ShadowDownLeft_${pid}`), mod.UIDepth.AboveGameUI);
        safeSetUIWidgetDepth(safeFind(`ConquestTicketsHudBleedChevronRight${slot}ShadowRight_${pid}`), mod.UIDepth.AboveGameUI);
        safeSetUIWidgetDepth(safeFind(`ConquestTicketsHudBleedChevronRight${slot}ShadowLeft_${pid}`), mod.UIDepth.AboveGameUI);
        safeSetUIWidgetDepth(safeFind(`ConquestTicketsHudBleedChevronRight${slot}ShadowUp_${pid}`), mod.UIDepth.AboveGameUI);
        safeSetUIWidgetDepth(safeFind(`ConquestTicketsHudBleedChevronRight${slot}ShadowDown_${pid}`), mod.UIDepth.AboveGameUI);
        safeSetUIWidgetDepth(safeFind(`ConquestTicketsHudBleedChevronRight${slot}ShadowUpLeft_${pid}`), mod.UIDepth.AboveGameUI);
        safeSetUIWidgetDepth(safeFind(`ConquestTicketsHudBleedChevronRight${slot}ShadowUpRight_${pid}`), mod.UIDepth.AboveGameUI);
        safeSetUIWidgetDepth(safeFind(`ConquestTicketsHudBleedChevronRight${slot}ShadowDownRight_${pid}`), mod.UIDepth.AboveGameUI);
        safeSetUIWidgetDepth(safeFind(`ConquestTicketsHudBleedChevronRight${slot}ShadowDownLeft_${pid}`), mod.UIDepth.AboveGameUI);
    }
    safeSetUIWidgetVisible(refs.conquestTicketsDebugLeftBarTrack, true);
    safeSetUIWidgetVisible(refs.conquestTicketsDebugLeftBarFill, true);
    safeSetUIWidgetVisible(refs.conquestTicketsDebugRightBarTrack, true);
    safeSetUIWidgetVisible(refs.conquestTicketsDebugRightBarFill, true);
    safeSetUIWidgetVisible(refs.conquestTicketsLeadLeftBorder, false);
    safeSetUIWidgetVisible(refs.conquestTicketsLeadRightBorder, false);
    safeSetUIWidgetVisible(refs.conquestTicketsLeadLeftCrownShadow, false);
    safeSetUIWidgetVisible(refs.conquestTicketsLeadRightCrownShadow, false);
    safeSetUIWidgetVisible(refs.conquestTicketsLeadLeftCrown, false);
    safeSetUIWidgetVisible(refs.conquestTicketsLeadRightCrown, false);
    for (let chevronIndex = 0; chevronIndex < CONQUEST_HUD_TICKET_BLEED_CHEVRON_COUNT; chevronIndex++) {
        safeSetUIWidgetVisible(leftBleedChevrons[chevronIndex], false);
        safeSetUIWidgetVisible(rightBleedChevrons[chevronIndex], false);
        const slot = chevronIndex + 1;
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
    safeSetUIWidgetVisible(conquestTicketsSlash, false);

    {
        // Per-flag slot row: boxed letter indicators with in-box progress fill.
        const flagChildren: any[] = [];
        for (let i = 0; i < CONQUEST_FLAGS_MAX_ROWS; i++) {
            const slotX = CONQUEST_FLAGS_SLOT_X[i] ?? (i * 35.0);
            flagChildren.push({
                name: `ConquestFlagHudSlot_${pid}_${i}`,
                type: "Container",
                position: [slotX, 0],
                size: [CONQUEST_HUD_FLAG_SLOT_WIDTH, CONQUEST_HUD_FLAG_SLOT_HEIGHT],
                anchor: mod.UIAnchor.TopLeft,
                visible: false,
                padding: 0,
                bgColor: [
                    CONQUEST_HUD_FLAG_SLOT_TRACK_RGB[0],
                    CONQUEST_HUD_FLAG_SLOT_TRACK_RGB[1],
                    CONQUEST_HUD_FLAG_SLOT_TRACK_RGB[2],
                ],
                bgAlpha: 0.9,
                // Neutral slot background stays visible at all times.
                bgFill: mod.UIBgFill.Solid,
                children: [
                    {
                        name: `ConquestFlagHudFill_${pid}_${i}`,
                        type: "Container",
                        position: [CONQUEST_HUD_FLAG_FILL_INSET_X, CONQUEST_HUD_FLAG_FILL_INSET_Y],
                        size: [CONQUEST_HUD_FLAG_FILL_MAX_WIDTH, CONQUEST_HUD_FLAG_FILL_MAX_HEIGHT],
                        anchor: mod.UIAnchor.TopLeft,
                        visible: false,
                        padding: 0,
                        bgColor: [
                            CONQUEST_HUD_TEXT_FRIENDLY_RGB[0],
                            CONQUEST_HUD_TEXT_FRIENDLY_RGB[1],
                            CONQUEST_HUD_TEXT_FRIENDLY_RGB[2],
                        ],
                        bgAlpha: 0.95,
                        bgFill: mod.UIBgFill.Solid,
                    },
                    {
                        name: `ConquestFlagHudBorder_${pid}_${i}`,
                        type: "Container",
                        position: [0, 0],
                        size: [CONQUEST_HUD_FLAG_SLOT_WIDTH, CONQUEST_HUD_FLAG_SLOT_HEIGHT],
                        anchor: mod.UIAnchor.TopLeft,
                        visible: false,
                        padding: 0,
                        bgColor: [
                            CONQUEST_HUD_TEXT_FRIENDLY_RGB[0],
                            CONQUEST_HUD_TEXT_FRIENDLY_RGB[1],
                            CONQUEST_HUD_TEXT_FRIENDLY_RGB[2],
                        ],
                        bgAlpha: 1,
                        bgFill: mod.UIBgFill.OutlineThin,
                    },
                    {
                        name: `ConquestFlagHudLabelShadowRight_${pid}_${i}`,
                        type: "Text",
                        position: [CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_X + CONQUEST_HUD_FLAG_LABEL_SHADOW_OFFSET, CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_Y],
                        size: [CONQUEST_HUD_FLAG_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_LABEL_WIDGET_HEIGHT],
                        anchor: mod.UIAnchor.TopLeft,
                        visible: true,
                        padding: 0,
                        bgAlpha: 0,
                        bgFill: mod.UIBgFill.None,
                        textLabel: mod.Message(STR_HUD_CONQUEST_FLAG_LETTER_UNKNOWN),
                        textColor: [0, 0, 0],
                        textAlpha: 1,
                        textSize: CONQUEST_HUD_FLAG_LABEL_SHADOW_TEXT_SIZE,
                        textAnchor: mod.UIAnchor.Center,
                    },
                    {
                        name: `ConquestFlagHudLabelShadowLeft_${pid}_${i}`,
                        type: "Text",
                        position: [CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_X - CONQUEST_HUD_FLAG_LABEL_SHADOW_OFFSET, CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_Y],
                        size: [CONQUEST_HUD_FLAG_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_LABEL_WIDGET_HEIGHT],
                        anchor: mod.UIAnchor.TopLeft,
                        visible: true,
                        padding: 0,
                        bgAlpha: 0,
                        bgFill: mod.UIBgFill.None,
                        textLabel: mod.Message(STR_HUD_CONQUEST_FLAG_LETTER_UNKNOWN),
                        textColor: [0, 0, 0],
                        textAlpha: 1,
                        textSize: CONQUEST_HUD_FLAG_LABEL_SHADOW_TEXT_SIZE,
                        textAnchor: mod.UIAnchor.Center,
                    },
                    {
                        name: `ConquestFlagHudLabelShadowUp_${pid}_${i}`,
                        type: "Text",
                        position: [CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_X, CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_Y - CONQUEST_HUD_FLAG_LABEL_SHADOW_OFFSET],
                        size: [CONQUEST_HUD_FLAG_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_LABEL_WIDGET_HEIGHT],
                        anchor: mod.UIAnchor.TopLeft,
                        visible: true,
                        padding: 0,
                        bgAlpha: 0,
                        bgFill: mod.UIBgFill.None,
                        textLabel: mod.Message(STR_HUD_CONQUEST_FLAG_LETTER_UNKNOWN),
                        textColor: [0, 0, 0],
                        textAlpha: 1,
                        textSize: CONQUEST_HUD_FLAG_LABEL_SHADOW_TEXT_SIZE,
                        textAnchor: mod.UIAnchor.Center,
                    },
                    {
                        name: `ConquestFlagHudLabelShadowDown_${pid}_${i}`,
                        type: "Text",
                        position: [CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_X, CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_Y + CONQUEST_HUD_FLAG_LABEL_SHADOW_OFFSET],
                        size: [CONQUEST_HUD_FLAG_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_LABEL_WIDGET_HEIGHT],
                        anchor: mod.UIAnchor.TopLeft,
                        visible: true,
                        padding: 0,
                        bgAlpha: 0,
                        bgFill: mod.UIBgFill.None,
                        textLabel: mod.Message(STR_HUD_CONQUEST_FLAG_LETTER_UNKNOWN),
                        textColor: [0, 0, 0],
                        textAlpha: 1,
                        textSize: CONQUEST_HUD_FLAG_LABEL_SHADOW_TEXT_SIZE,
                        textAnchor: mod.UIAnchor.Center,
                    },
                    {
                        name: `ConquestFlagHudLabelShadowUpLeft_${pid}_${i}`,
                        type: "Text",
                        position: [CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_X - CONQUEST_HUD_FLAG_LABEL_SHADOW_OFFSET, CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_Y - CONQUEST_HUD_FLAG_LABEL_SHADOW_OFFSET],
                        size: [CONQUEST_HUD_FLAG_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_LABEL_WIDGET_HEIGHT],
                        anchor: mod.UIAnchor.TopLeft,
                        visible: true,
                        padding: 0,
                        bgAlpha: 0,
                        bgFill: mod.UIBgFill.None,
                        textLabel: mod.Message(STR_HUD_CONQUEST_FLAG_LETTER_UNKNOWN),
                        textColor: [0, 0, 0],
                        textAlpha: 1,
                        textSize: CONQUEST_HUD_FLAG_LABEL_SHADOW_TEXT_SIZE,
                        textAnchor: mod.UIAnchor.Center,
                    },
                    {
                        name: `ConquestFlagHudLabelShadowUpRight_${pid}_${i}`,
                        type: "Text",
                        position: [CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_X + CONQUEST_HUD_FLAG_LABEL_SHADOW_OFFSET, CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_Y - CONQUEST_HUD_FLAG_LABEL_SHADOW_OFFSET],
                        size: [CONQUEST_HUD_FLAG_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_LABEL_WIDGET_HEIGHT],
                        anchor: mod.UIAnchor.TopLeft,
                        visible: true,
                        padding: 0,
                        bgAlpha: 0,
                        bgFill: mod.UIBgFill.None,
                        textLabel: mod.Message(STR_HUD_CONQUEST_FLAG_LETTER_UNKNOWN),
                        textColor: [0, 0, 0],
                        textAlpha: 1,
                        textSize: CONQUEST_HUD_FLAG_LABEL_SHADOW_TEXT_SIZE,
                        textAnchor: mod.UIAnchor.Center,
                    },
                    {
                        name: `ConquestFlagHudLabelShadowDownRight_${pid}_${i}`,
                        type: "Text",
                        position: [CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_X + CONQUEST_HUD_FLAG_LABEL_SHADOW_OFFSET, CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_Y + CONQUEST_HUD_FLAG_LABEL_SHADOW_OFFSET],
                        size: [CONQUEST_HUD_FLAG_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_LABEL_WIDGET_HEIGHT],
                        anchor: mod.UIAnchor.TopLeft,
                        visible: true,
                        padding: 0,
                        bgAlpha: 0,
                        bgFill: mod.UIBgFill.None,
                        textLabel: mod.Message(STR_HUD_CONQUEST_FLAG_LETTER_UNKNOWN),
                        textColor: [0, 0, 0],
                        textAlpha: 1,
                        textSize: CONQUEST_HUD_FLAG_LABEL_SHADOW_TEXT_SIZE,
                        textAnchor: mod.UIAnchor.Center,
                    },
                    {
                        name: `ConquestFlagHudLabelShadowDownLeft_${pid}_${i}`,
                        type: "Text",
                        position: [CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_X - CONQUEST_HUD_FLAG_LABEL_SHADOW_OFFSET, CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_Y + CONQUEST_HUD_FLAG_LABEL_SHADOW_OFFSET],
                        size: [CONQUEST_HUD_FLAG_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_LABEL_WIDGET_HEIGHT],
                        anchor: mod.UIAnchor.TopLeft,
                        visible: true,
                        padding: 0,
                        bgAlpha: 0,
                        bgFill: mod.UIBgFill.None,
                        textLabel: mod.Message(STR_HUD_CONQUEST_FLAG_LETTER_UNKNOWN),
                        textColor: [0, 0, 0],
                        textAlpha: 1,
                        textSize: CONQUEST_HUD_FLAG_LABEL_SHADOW_TEXT_SIZE,
                        textAnchor: mod.UIAnchor.Center,
                    },
                    {
                        name: `ConquestFlagHudLabelShadowInner_${pid}_${i}`,
                        type: "Text",
                        position: [CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_X, CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_Y],
                        size: [CONQUEST_HUD_FLAG_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_LABEL_WIDGET_HEIGHT],
                        anchor: mod.UIAnchor.TopLeft,
                        visible: false,
                        padding: 0,
                        bgAlpha: 0,
                        bgFill: mod.UIBgFill.None,
                        textLabel: mod.Message(STR_HUD_CONQUEST_FLAG_LETTER_UNKNOWN),
                        textColor: [0, 0, 0],
                        textAlpha: 1,
                        textSize: CONQUEST_HUD_FLAG_LABEL_SHADOW_INNER_TEXT_SIZE,
                        textAnchor: mod.UIAnchor.Center,
                    },
                    {
                        name: `ConquestFlagHudLabelShadowInnerDeep_${pid}_${i}`,
                        type: "Text",
                        position: [CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_X, CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_Y],
                        size: [CONQUEST_HUD_FLAG_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_LABEL_WIDGET_HEIGHT],
                        anchor: mod.UIAnchor.TopLeft,
                        visible: false,
                        padding: 0,
                        bgAlpha: 0,
                        bgFill: mod.UIBgFill.None,
                        textLabel: mod.Message(STR_HUD_CONQUEST_FLAG_LETTER_UNKNOWN),
                        textColor: [0, 0, 0],
                        textAlpha: 1,
                        textSize: CONQUEST_HUD_FLAG_LABEL_SHADOW_INNER_DEEP_TEXT_SIZE,
                        textAnchor: mod.UIAnchor.Center,
                    },
                    {
                        name: `ConquestFlagHudLabel_${pid}_${i}`,
                        type: "Text",
                        position: [CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_X, CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_Y],
                        size: [CONQUEST_HUD_FLAG_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_LABEL_WIDGET_HEIGHT],
                        anchor: mod.UIAnchor.TopLeft,
                        visible: true,
                        padding: 0,
                        bgAlpha: 0,
                        bgFill: mod.UIBgFill.None,
                        textLabel: mod.Message(STR_HUD_CONQUEST_FLAG_LETTER_UNKNOWN),
                        textColor: [
                            CONQUEST_HUD_TEXT_NEUTRAL_RGB[0],
                            CONQUEST_HUD_TEXT_NEUTRAL_RGB[1],
                            CONQUEST_HUD_TEXT_NEUTRAL_RGB[2],
                        ],
                        textAlpha: 1,
                        textSize: CONQUEST_HUD_FLAG_LABEL_TEXT_SIZE,
                        textAnchor: mod.UIAnchor.Center,
                    },
                ],
            });
            flagChildren.push({
                // Capture progress percentage row below each objective box.
                name: `ConquestFlagHudPercentRoot_${pid}_${i}`,
                type: "Container",
                position: [slotX + CONQUEST_HUD_FLAG_PERCENT_OFFSET_X, CONQUEST_HUD_FLAG_PERCENT_OFFSET_Y],
                size: [CONQUEST_HUD_FLAG_PERCENT_ROOT_WIDTH, CONQUEST_HUD_FLAG_PERCENT_ROOT_HEIGHT],
                anchor: mod.UIAnchor.TopLeft,
                visible: false,
                padding: 0,
                bgColor: [
                    CONQUEST_TICKETS_BG_RGB[0],
                    CONQUEST_TICKETS_BG_RGB[1],
                    CONQUEST_TICKETS_BG_RGB[2],
                ],
                bgAlpha: CONQUEST_TICKETS_BG_ALPHA,
                bgFill: mod.UIBgFill.Blur,
                children: [
                    {
                        name: `ConquestFlagHudPercentShadowRight_${pid}_${i}`,
                        type: "Text",
                        position: [CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_X + CONQUEST_HUD_FLAG_PERCENT_SHADOW_OFFSET, CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_Y],
                        size: [CONQUEST_HUD_FLAG_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_PERCENT_WIDGET_HEIGHT],
                        anchor: mod.UIAnchor.TopLeft,
                        visible: false,
                        padding: 0,
                        bgAlpha: 0,
                        bgFill: mod.UIBgFill.None,
                        textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                        textColor: [0, 0, 0],
                        textAlpha: 1,
                        textSize: CONQUEST_HUD_FLAG_PERCENT_SHADOW_TEXT_SIZE,
                        textAnchor: mod.UIAnchor.Center,
                    },
                    {
                        name: `ConquestFlagHudPercentShadowLeft_${pid}_${i}`,
                        type: "Text",
                        position: [CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_X - CONQUEST_HUD_FLAG_PERCENT_SHADOW_OFFSET, CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_Y],
                        size: [CONQUEST_HUD_FLAG_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_PERCENT_WIDGET_HEIGHT],
                        anchor: mod.UIAnchor.TopLeft,
                        visible: false,
                        padding: 0,
                        bgAlpha: 0,
                        bgFill: mod.UIBgFill.None,
                        textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                        textColor: [0, 0, 0],
                        textAlpha: 1,
                        textSize: CONQUEST_HUD_FLAG_PERCENT_SHADOW_TEXT_SIZE,
                        textAnchor: mod.UIAnchor.Center,
                    },
                    {
                        name: `ConquestFlagHudPercentShadowUp_${pid}_${i}`,
                        type: "Text",
                        position: [CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_X, CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_Y - CONQUEST_HUD_FLAG_PERCENT_SHADOW_OFFSET],
                        size: [CONQUEST_HUD_FLAG_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_PERCENT_WIDGET_HEIGHT],
                        anchor: mod.UIAnchor.TopLeft,
                        visible: false,
                        padding: 0,
                        bgAlpha: 0,
                        bgFill: mod.UIBgFill.None,
                        textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                        textColor: [0, 0, 0],
                        textAlpha: 1,
                        textSize: CONQUEST_HUD_FLAG_PERCENT_SHADOW_TEXT_SIZE,
                        textAnchor: mod.UIAnchor.Center,
                    },
                    {
                        name: `ConquestFlagHudPercentShadowDown_${pid}_${i}`,
                        type: "Text",
                        position: [CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_X, CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_Y + CONQUEST_HUD_FLAG_PERCENT_SHADOW_OFFSET],
                        size: [CONQUEST_HUD_FLAG_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_PERCENT_WIDGET_HEIGHT],
                        anchor: mod.UIAnchor.TopLeft,
                        visible: false,
                        padding: 0,
                        bgAlpha: 0,
                        bgFill: mod.UIBgFill.None,
                        textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                        textColor: [0, 0, 0],
                        textAlpha: 1,
                        textSize: CONQUEST_HUD_FLAG_PERCENT_SHADOW_TEXT_SIZE,
                        textAnchor: mod.UIAnchor.Center,
                    },
                    {
                        name: `ConquestFlagHudPercentShadowUpLeft_${pid}_${i}`,
                        type: "Text",
                        position: [CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_X - CONQUEST_HUD_FLAG_PERCENT_SHADOW_OFFSET, CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_Y - CONQUEST_HUD_FLAG_PERCENT_SHADOW_OFFSET],
                        size: [CONQUEST_HUD_FLAG_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_PERCENT_WIDGET_HEIGHT],
                        anchor: mod.UIAnchor.TopLeft,
                        visible: false,
                        padding: 0,
                        bgAlpha: 0,
                        bgFill: mod.UIBgFill.None,
                        textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                        textColor: [0, 0, 0],
                        textAlpha: 1,
                        textSize: CONQUEST_HUD_FLAG_PERCENT_SHADOW_TEXT_SIZE,
                        textAnchor: mod.UIAnchor.Center,
                    },
                    {
                        name: `ConquestFlagHudPercentShadowUpRight_${pid}_${i}`,
                        type: "Text",
                        position: [CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_X + CONQUEST_HUD_FLAG_PERCENT_SHADOW_OFFSET, CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_Y - CONQUEST_HUD_FLAG_PERCENT_SHADOW_OFFSET],
                        size: [CONQUEST_HUD_FLAG_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_PERCENT_WIDGET_HEIGHT],
                        anchor: mod.UIAnchor.TopLeft,
                        visible: false,
                        padding: 0,
                        bgAlpha: 0,
                        bgFill: mod.UIBgFill.None,
                        textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                        textColor: [0, 0, 0],
                        textAlpha: 1,
                        textSize: CONQUEST_HUD_FLAG_PERCENT_SHADOW_TEXT_SIZE,
                        textAnchor: mod.UIAnchor.Center,
                    },
                    {
                        name: `ConquestFlagHudPercentShadowDownRight_${pid}_${i}`,
                        type: "Text",
                        position: [CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_X + CONQUEST_HUD_FLAG_PERCENT_SHADOW_OFFSET, CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_Y + CONQUEST_HUD_FLAG_PERCENT_SHADOW_OFFSET],
                        size: [CONQUEST_HUD_FLAG_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_PERCENT_WIDGET_HEIGHT],
                        anchor: mod.UIAnchor.TopLeft,
                        visible: false,
                        padding: 0,
                        bgAlpha: 0,
                        bgFill: mod.UIBgFill.None,
                        textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                        textColor: [0, 0, 0],
                        textAlpha: 1,
                        textSize: CONQUEST_HUD_FLAG_PERCENT_SHADOW_TEXT_SIZE,
                        textAnchor: mod.UIAnchor.Center,
                    },
                    {
                        name: `ConquestFlagHudPercentShadowDownLeft_${pid}_${i}`,
                        type: "Text",
                        position: [CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_X - CONQUEST_HUD_FLAG_PERCENT_SHADOW_OFFSET, CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_Y + CONQUEST_HUD_FLAG_PERCENT_SHADOW_OFFSET],
                        size: [CONQUEST_HUD_FLAG_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_PERCENT_WIDGET_HEIGHT],
                        anchor: mod.UIAnchor.TopLeft,
                        visible: false,
                        padding: 0,
                        bgAlpha: 0,
                        bgFill: mod.UIBgFill.None,
                        textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                        textColor: [0, 0, 0],
                        textAlpha: 1,
                        textSize: CONQUEST_HUD_FLAG_PERCENT_SHADOW_TEXT_SIZE,
                        textAnchor: mod.UIAnchor.Center,
                    },
                    {
                        name: `ConquestFlagHudPercentShadowInner_${pid}_${i}`,
                        type: "Text",
                        position: [CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_X, CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_Y],
                        size: [CONQUEST_HUD_FLAG_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_PERCENT_WIDGET_HEIGHT],
                        anchor: mod.UIAnchor.TopLeft,
                        visible: false,
                        padding: 0,
                        bgAlpha: 0,
                        bgFill: mod.UIBgFill.None,
                        textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                        textColor: [0, 0, 0],
                        textAlpha: 1,
                        textSize: CONQUEST_HUD_FLAG_PERCENT_SHADOW_INNER_TEXT_SIZE,
                        textAnchor: mod.UIAnchor.Center,
                    },
                    {
                        name: `ConquestFlagHudPercentText_${pid}_${i}`,
                        type: "Text",
                        position: [CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_X, CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_Y],
                        size: [CONQUEST_HUD_FLAG_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_PERCENT_WIDGET_HEIGHT],
                        anchor: mod.UIAnchor.TopLeft,
                        visible: false,
                        padding: 0,
                        bgAlpha: 0,
                        bgFill: mod.UIBgFill.None,
                        textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                        textColor: [
                            CONQUEST_HUD_TEXT_NEUTRAL_RGB[0],
                            CONQUEST_HUD_TEXT_NEUTRAL_RGB[1],
                            CONQUEST_HUD_TEXT_NEUTRAL_RGB[2],
                        ],
                        textAlpha: 1,
                        textSize: CONQUEST_HUD_FLAG_PERCENT_TEXT_SIZE,
                        textAnchor: mod.UIAnchor.Center,
                    },
                ],
            });
        }
        // Active-objective pop-out panel:
        // - enlarged objective letter with in-box capture fill
        // - optional capture-progress percentage row
        flagChildren.push({
            name: `ConquestFlagHudActivePopoutRoot_${pid}`,
            type: "Container",
            position: [0, 0],
            size: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_ROOT_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_ROOT_HEIGHT],
            anchor: mod.UIAnchor.TopCenter,
            visible: false,
            padding: 0,
            bgAlpha: 0,
            bgFill: mod.UIBgFill.None,
            children: [
                {
                    name: `ConquestFlagHudActivePopoutSlot_${pid}`,
                    type: "Container",
                    position: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_SLOT_OFFSET_X, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_SLOT_OFFSET_Y],
                    size: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_SLOT_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_SLOT_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: false,
                    padding: 0,
                    bgColor: [
                        CONQUEST_HUD_FLAG_SLOT_TRACK_RGB[0],
                        CONQUEST_HUD_FLAG_SLOT_TRACK_RGB[1],
                        CONQUEST_HUD_FLAG_SLOT_TRACK_RGB[2],
                    ],
                    bgAlpha: 0.9,
                    bgFill: mod.UIBgFill.Solid,
                    children: [
                        {
                            name: `ConquestFlagHudActivePopoutFill_${pid}`,
                            type: "Container",
                            position: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_FILL_INSET_X, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_FILL_INSET_Y],
                            size: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_FILL_MAX_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_FILL_MAX_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: false,
                            padding: 0,
                            bgColor: [
                                CONQUEST_HUD_TEXT_FRIENDLY_RGB[0],
                                CONQUEST_HUD_TEXT_FRIENDLY_RGB[1],
                                CONQUEST_HUD_TEXT_FRIENDLY_RGB[2],
                            ],
                            bgAlpha: 0.95,
                            bgFill: mod.UIBgFill.Solid,
                        },
                        {
                            name: `ConquestFlagHudActivePopoutBorder_${pid}`,
                            type: "Container",
                            position: [0, 0],
                            size: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_SLOT_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_SLOT_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: false,
                            padding: 0,
                            bgColor: [
                                CONQUEST_HUD_TEXT_FRIENDLY_RGB[0],
                                CONQUEST_HUD_TEXT_FRIENDLY_RGB[1],
                                CONQUEST_HUD_TEXT_FRIENDLY_RGB[2],
                            ],
                            bgAlpha: 1,
                            bgFill: mod.UIBgFill.OutlineThin,
                        },
                        {
                            name: `ConquestFlagHudActivePopoutLabelShadowRight_${pid}`,
                            type: "Text",
                            position: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_OFFSET_X + CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_OFFSET_Y],
                            size: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: false,
                            padding: 0,
                            bgAlpha: 0,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.Message(STR_HUD_CONQUEST_FLAG_LETTER_UNKNOWN),
                            textColor: [0, 0, 0],
                            textAlpha: 1,
                            textSize: CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_TEXT_SIZE,
                            textAnchor: mod.UIAnchor.Center,
                        },
                        {
                            name: `ConquestFlagHudActivePopoutLabelShadowLeft_${pid}`,
                            type: "Text",
                            position: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_OFFSET_X - CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_OFFSET_Y],
                            size: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: false,
                            padding: 0,
                            bgAlpha: 0,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.Message(STR_HUD_CONQUEST_FLAG_LETTER_UNKNOWN),
                            textColor: [0, 0, 0],
                            textAlpha: 1,
                            textSize: CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_TEXT_SIZE,
                            textAnchor: mod.UIAnchor.Center,
                        },
                        {
                            name: `ConquestFlagHudActivePopoutLabelShadowUp_${pid}`,
                            type: "Text",
                            position: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_OFFSET_X, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_OFFSET_Y - CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET],
                            size: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: false,
                            padding: 0,
                            bgAlpha: 0,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.Message(STR_HUD_CONQUEST_FLAG_LETTER_UNKNOWN),
                            textColor: [0, 0, 0],
                            textAlpha: 1,
                            textSize: CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_TEXT_SIZE,
                            textAnchor: mod.UIAnchor.Center,
                        },
                        {
                            name: `ConquestFlagHudActivePopoutLabelShadowDown_${pid}`,
                            type: "Text",
                            position: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_OFFSET_X, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_OFFSET_Y + CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET],
                            size: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: false,
                            padding: 0,
                            bgAlpha: 0,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.Message(STR_HUD_CONQUEST_FLAG_LETTER_UNKNOWN),
                            textColor: [0, 0, 0],
                            textAlpha: 1,
                            textSize: CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_TEXT_SIZE,
                            textAnchor: mod.UIAnchor.Center,
                        },
                        {
                            name: `ConquestFlagHudActivePopoutLabelShadowUpLeft_${pid}`,
                            type: "Text",
                            position: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_OFFSET_X - CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_OFFSET_Y - CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET],
                            size: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: false,
                            padding: 0,
                            bgAlpha: 0,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.Message(STR_HUD_CONQUEST_FLAG_LETTER_UNKNOWN),
                            textColor: [0, 0, 0],
                            textAlpha: 1,
                            textSize: CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_TEXT_SIZE,
                            textAnchor: mod.UIAnchor.Center,
                        },
                        {
                            name: `ConquestFlagHudActivePopoutLabelShadowUpRight_${pid}`,
                            type: "Text",
                            position: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_OFFSET_X + CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_OFFSET_Y - CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET],
                            size: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: false,
                            padding: 0,
                            bgAlpha: 0,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.Message(STR_HUD_CONQUEST_FLAG_LETTER_UNKNOWN),
                            textColor: [0, 0, 0],
                            textAlpha: 1,
                            textSize: CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_TEXT_SIZE,
                            textAnchor: mod.UIAnchor.Center,
                        },
                        {
                            name: `ConquestFlagHudActivePopoutLabelShadowDownRight_${pid}`,
                            type: "Text",
                            position: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_OFFSET_X + CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_OFFSET_Y + CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET],
                            size: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: false,
                            padding: 0,
                            bgAlpha: 0,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.Message(STR_HUD_CONQUEST_FLAG_LETTER_UNKNOWN),
                            textColor: [0, 0, 0],
                            textAlpha: 1,
                            textSize: CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_TEXT_SIZE,
                            textAnchor: mod.UIAnchor.Center,
                        },
                        {
                            name: `ConquestFlagHudActivePopoutLabelShadowDownLeft_${pid}`,
                            type: "Text",
                            position: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_OFFSET_X - CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_OFFSET_Y + CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET],
                            size: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: false,
                            padding: 0,
                            bgAlpha: 0,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.Message(STR_HUD_CONQUEST_FLAG_LETTER_UNKNOWN),
                            textColor: [0, 0, 0],
                            textAlpha: 1,
                            textSize: CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_TEXT_SIZE,
                            textAnchor: mod.UIAnchor.Center,
                        },
                        {
                            name: `ConquestFlagHudActivePopoutLabel_${pid}`,
                            type: "Text",
                            position: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_OFFSET_X, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_OFFSET_Y],
                            size: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_WIDGET_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: false,
                            padding: 0,
                            bgAlpha: 0,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.Message(STR_HUD_CONQUEST_FLAG_LETTER_UNKNOWN),
                            textColor: [
                                CONQUEST_HUD_TEXT_NEUTRAL_RGB[0],
                                CONQUEST_HUD_TEXT_NEUTRAL_RGB[1],
                                CONQUEST_HUD_TEXT_NEUTRAL_RGB[2],
                            ],
                            textAlpha: 1,
                            textSize: CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_TEXT_SIZE,
                            textAnchor: mod.UIAnchor.Center,
                        },
                    ],
                },
                {
                    name: `ConquestFlagHudActivePopoutPercentRoot_${pid}`,
                    type: "Container",
                    position: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_OFFSET_X, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_OFFSET_Y],
                    size: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_ROOT_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_ROOT_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: false,
                    padding: 0,
                    bgColor: [
                        CONQUEST_TICKETS_BG_RGB[0],
                        CONQUEST_TICKETS_BG_RGB[1],
                        CONQUEST_TICKETS_BG_RGB[2],
                    ],
                    bgAlpha: CONQUEST_TICKETS_BG_ALPHA,
                    bgFill: mod.UIBgFill.Blur,
                    children: [
                        {
                            name: `ConquestFlagHudActivePopoutPercentShadowRight_${pid}`,
                            type: "Text",
                            position: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_OFFSET_X + CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_OFFSET_Y],
                            size: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: false,
                            padding: 0,
                            bgAlpha: 0,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                            textColor: [0, 0, 0],
                            textAlpha: 1,
                            textSize: CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_SHADOW_TEXT_SIZE,
                            textAnchor: mod.UIAnchor.Center,
                        },
                        {
                            name: `ConquestFlagHudActivePopoutPercentShadowLeft_${pid}`,
                            type: "Text",
                            position: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_OFFSET_X - CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_OFFSET_Y],
                            size: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: false,
                            padding: 0,
                            bgAlpha: 0,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                            textColor: [0, 0, 0],
                            textAlpha: 1,
                            textSize: CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_SHADOW_TEXT_SIZE,
                            textAnchor: mod.UIAnchor.Center,
                        },
                        {
                            name: `ConquestFlagHudActivePopoutPercentShadowUp_${pid}`,
                            type: "Text",
                            position: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_OFFSET_X, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_OFFSET_Y - CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET],
                            size: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: false,
                            padding: 0,
                            bgAlpha: 0,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                            textColor: [0, 0, 0],
                            textAlpha: 1,
                            textSize: CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_SHADOW_TEXT_SIZE,
                            textAnchor: mod.UIAnchor.Center,
                        },
                        {
                            name: `ConquestFlagHudActivePopoutPercentShadowDown_${pid}`,
                            type: "Text",
                            position: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_OFFSET_X, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_OFFSET_Y + CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET],
                            size: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: false,
                            padding: 0,
                            bgAlpha: 0,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                            textColor: [0, 0, 0],
                            textAlpha: 1,
                            textSize: CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_SHADOW_TEXT_SIZE,
                            textAnchor: mod.UIAnchor.Center,
                        },
                        {
                            name: `ConquestFlagHudActivePopoutPercentShadowUpLeft_${pid}`,
                            type: "Text",
                            position: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_OFFSET_X - CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_OFFSET_Y - CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET],
                            size: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: false,
                            padding: 0,
                            bgAlpha: 0,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                            textColor: [0, 0, 0],
                            textAlpha: 1,
                            textSize: CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_SHADOW_TEXT_SIZE,
                            textAnchor: mod.UIAnchor.Center,
                        },
                        {
                            name: `ConquestFlagHudActivePopoutPercentShadowUpRight_${pid}`,
                            type: "Text",
                            position: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_OFFSET_X + CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_OFFSET_Y - CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET],
                            size: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: false,
                            padding: 0,
                            bgAlpha: 0,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                            textColor: [0, 0, 0],
                            textAlpha: 1,
                            textSize: CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_SHADOW_TEXT_SIZE,
                            textAnchor: mod.UIAnchor.Center,
                        },
                        {
                            name: `ConquestFlagHudActivePopoutPercentShadowDownRight_${pid}`,
                            type: "Text",
                            position: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_OFFSET_X + CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_OFFSET_Y + CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET],
                            size: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: false,
                            padding: 0,
                            bgAlpha: 0,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                            textColor: [0, 0, 0],
                            textAlpha: 1,
                            textSize: CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_SHADOW_TEXT_SIZE,
                            textAnchor: mod.UIAnchor.Center,
                        },
                        {
                            name: `ConquestFlagHudActivePopoutPercentShadowDownLeft_${pid}`,
                            type: "Text",
                            position: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_OFFSET_X - CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_OFFSET_Y + CONQUEST_HUD_FLAG_ACTIVE_POPOUT_LABEL_SHADOW_OFFSET],
                            size: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: false,
                            padding: 0,
                            bgAlpha: 0,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                            textColor: [0, 0, 0],
                            textAlpha: 1,
                            textSize: CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_SHADOW_TEXT_SIZE,
                            textAnchor: mod.UIAnchor.Center,
                        },
                        {
                            name: `ConquestFlagHudActivePopoutPercentShadowInner_${pid}`,
                            type: "Text",
                            position: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_OFFSET_X, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_OFFSET_Y],
                            size: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: false,
                            padding: 0,
                            bgAlpha: 0,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                            textColor: [0, 0, 0],
                            textAlpha: 1,
                            textSize: CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_SHADOW_INNER_TEXT_SIZE,
                            textAnchor: mod.UIAnchor.Center,
                        },
                        {
                            name: `ConquestFlagHudActivePopoutPercentText_${pid}`,
                            type: "Text",
                            position: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_OFFSET_X, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_OFFSET_Y],
                            size: [CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_WIDGET_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: false,
                            padding: 0,
                            bgAlpha: 0,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                            textColor: [
                                CONQUEST_HUD_TEXT_NEUTRAL_RGB[0],
                                CONQUEST_HUD_TEXT_NEUTRAL_RGB[1],
                                CONQUEST_HUD_TEXT_NEUTRAL_RGB[2],
                            ],
                            textAlpha: 1,
                            textSize: CONQUEST_HUD_FLAG_ACTIVE_POPOUT_PERCENT_TEXT_SIZE,
                            textAnchor: mod.UIAnchor.Center,
                        },
                    ],
                },
            ],
        });
        // Active-objective engagement panel:
        // - left/right on-point soldier counts (viewer perspective)
        // - split ratio bar (friendly vs enemy presence)
        // - capture-state status text (Defend/Neutralizing/Contesting/Capturing)
        flagChildren.push({
            name: `ConquestFlagHudEngageRoot_${pid}`,
            type: "Container",
            position: [0, 0],
            size: [CONQUEST_HUD_FLAG_ENGAGE_ROOT_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_ROOT_HEIGHT],
            anchor: mod.UIAnchor.TopCenter,
            visible: false,
            padding: 0,
            bgAlpha: 0,
            bgFill: mod.UIBgFill.None,
            children: [
                {
                    name: `ConquestFlagHudEngageTrack_${pid}`,
                    type: "Container",
                    position: [CONQUEST_HUD_FLAG_ENGAGE_TRACK_X, CONQUEST_HUD_FLAG_ENGAGE_TRACK_Y],
                    size: [CONQUEST_HUD_FLAG_ENGAGE_TRACK_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_TRACK_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgColor: [
                        CONQUEST_HUD_FLAG_ENGAGE_TRACK_RGB[0],
                        CONQUEST_HUD_FLAG_ENGAGE_TRACK_RGB[1],
                        CONQUEST_HUD_FLAG_ENGAGE_TRACK_RGB[2],
                    ],
                    bgAlpha: 0.9,
                    bgFill: mod.UIBgFill.Solid,
                    children: [
                        {
                            name: `ConquestFlagHudEngageFriendlyFill_${pid}`,
                            type: "Container",
                            position: [0, 0],
                            size: [Math.floor(CONQUEST_HUD_FLAG_ENGAGE_TRACK_WIDTH / 2), CONQUEST_HUD_FLAG_ENGAGE_TRACK_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: true,
                            padding: 0,
                            bgColor: [
                                CONQUEST_HUD_TEXT_FRIENDLY_RGB[0],
                                CONQUEST_HUD_TEXT_FRIENDLY_RGB[1],
                                CONQUEST_HUD_TEXT_FRIENDLY_RGB[2],
                            ],
                            bgAlpha: 1,
                            bgFill: mod.UIBgFill.Solid,
                        },
                        {
                            name: `ConquestFlagHudEngageEnemyFill_${pid}`,
                            type: "Container",
                            position: [Math.floor(CONQUEST_HUD_FLAG_ENGAGE_TRACK_WIDTH / 2), 0],
                            size: [CONQUEST_HUD_FLAG_ENGAGE_TRACK_WIDTH - Math.floor(CONQUEST_HUD_FLAG_ENGAGE_TRACK_WIDTH / 2), CONQUEST_HUD_FLAG_ENGAGE_TRACK_HEIGHT],
                            anchor: mod.UIAnchor.TopLeft,
                            visible: true,
                            padding: 0,
                            bgColor: [
                                CONQUEST_HUD_TEXT_ENEMY_RGB[0],
                                CONQUEST_HUD_TEXT_ENEMY_RGB[1],
                                CONQUEST_HUD_TEXT_ENEMY_RGB[2],
                            ],
                            bgAlpha: 1,
                            bgFill: mod.UIBgFill.Solid,
                        },
                    ],
                },
                {
                    name: `ConquestFlagHudEngageFriendlyCountBg_${pid}`,
                    type: "Container",
                    position: [CONQUEST_HUD_FLAG_ENGAGE_FRIENDLY_COUNT_BG_X, CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_Y],
                    size: [CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgColor: [
                        CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_RGB[0],
                        CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_RGB[1],
                        CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_RGB[2],
                    ],
                    bgAlpha: 0.75,
                    bgFill: mod.UIBgFill.Solid,
                },
                {
                    name: `ConquestFlagHudEngageEnemyCountBg_${pid}`,
                    type: "Container",
                    position: [CONQUEST_HUD_FLAG_ENGAGE_ENEMY_COUNT_BG_X, CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_Y],
                    size: [CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgColor: [
                        CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_RGB[0],
                        CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_RGB[1],
                        CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_RGB[2],
                    ],
                    bgAlpha: 0.75,
                    bgFill: mod.UIBgFill.Solid,
                },
                {
                    name: `ConquestFlagHudEngageFriendlyCountShadow_${pid}`,
                    type: "Text",
                    position: [
                        CONQUEST_HUD_FLAG_ENGAGE_COUNT_TEXT_X + CONQUEST_HUD_FLAG_ENGAGE_COUNT_SHADOW_OFFSET,
                        CONQUEST_HUD_FLAG_ENGAGE_COUNT_TEXT_Y + CONQUEST_HUD_FLAG_ENGAGE_COUNT_SHADOW_OFFSET,
                    ],
                    size: [CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                    textColor: [0, 0, 0],
                    textAlpha: 1,
                    textSize: CONQUEST_HUD_FLAG_ENGAGE_COUNT_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    name: `ConquestFlagHudEngageFriendlyCount_${pid}`,
                    type: "Text",
                    position: [CONQUEST_HUD_FLAG_ENGAGE_COUNT_TEXT_X, CONQUEST_HUD_FLAG_ENGAGE_COUNT_TEXT_Y],
                    size: [CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                    textColor: [
                        CONQUEST_HUD_TEXT_FRIENDLY_RGB[0],
                        CONQUEST_HUD_TEXT_FRIENDLY_RGB[1],
                        CONQUEST_HUD_TEXT_FRIENDLY_RGB[2],
                    ],
                    textAlpha: 1,
                    textSize: CONQUEST_HUD_FLAG_ENGAGE_COUNT_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    name: `ConquestFlagHudEngageEnemyCountShadow_${pid}`,
                    type: "Text",
                    position: [
                        CONQUEST_HUD_FLAG_ENGAGE_COUNT_TEXT_X + CONQUEST_HUD_FLAG_ENGAGE_COUNT_SHADOW_OFFSET,
                        CONQUEST_HUD_FLAG_ENGAGE_COUNT_TEXT_Y + CONQUEST_HUD_FLAG_ENGAGE_COUNT_SHADOW_OFFSET,
                    ],
                    size: [CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                    textColor: [0, 0, 0],
                    textAlpha: 1,
                    textSize: CONQUEST_HUD_FLAG_ENGAGE_COUNT_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    name: `ConquestFlagHudEngageEnemyCount_${pid}`,
                    type: "Text",
                    position: [CONQUEST_HUD_FLAG_ENGAGE_COUNT_TEXT_X, CONQUEST_HUD_FLAG_ENGAGE_COUNT_TEXT_Y],
                    size: [CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(mod.stringkeys.twl.system.genericCounter, 0),
                    textColor: [
                        CONQUEST_HUD_TEXT_ENEMY_RGB[0],
                        CONQUEST_HUD_TEXT_ENEMY_RGB[1],
                        CONQUEST_HUD_TEXT_ENEMY_RGB[2],
                    ],
                    textAlpha: 1,
                    textSize: CONQUEST_HUD_FLAG_ENGAGE_COUNT_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    name: `ConquestFlagHudEngageStatusShadowRight_${pid}`,
                    type: "Text",
                    position: [CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_OFFSET, CONQUEST_HUD_FLAG_ENGAGE_STATUS_Y],
                    size: [CONQUEST_HUD_FLAG_ENGAGE_STATUS_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_STATUS_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(STR_HUD_CONQUEST_CAPTURE_STATUS_CONTESTING),
                    textColor: [0, 0, 0],
                    textAlpha: 1,
                    textSize: CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    name: `ConquestFlagHudEngageStatusShadowLeft_${pid}`,
                    type: "Text",
                    position: [-CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_OFFSET, CONQUEST_HUD_FLAG_ENGAGE_STATUS_Y],
                    size: [CONQUEST_HUD_FLAG_ENGAGE_STATUS_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_STATUS_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(STR_HUD_CONQUEST_CAPTURE_STATUS_CONTESTING),
                    textColor: [0, 0, 0],
                    textAlpha: 1,
                    textSize: CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    name: `ConquestFlagHudEngageStatusShadowUp_${pid}`,
                    type: "Text",
                    position: [0, CONQUEST_HUD_FLAG_ENGAGE_STATUS_Y - CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_OFFSET],
                    size: [CONQUEST_HUD_FLAG_ENGAGE_STATUS_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_STATUS_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(STR_HUD_CONQUEST_CAPTURE_STATUS_CONTESTING),
                    textColor: [0, 0, 0],
                    textAlpha: 1,
                    textSize: CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    name: `ConquestFlagHudEngageStatusShadowDown_${pid}`,
                    type: "Text",
                    position: [0, CONQUEST_HUD_FLAG_ENGAGE_STATUS_Y + CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_OFFSET],
                    size: [CONQUEST_HUD_FLAG_ENGAGE_STATUS_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_STATUS_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(STR_HUD_CONQUEST_CAPTURE_STATUS_CONTESTING),
                    textColor: [0, 0, 0],
                    textAlpha: 1,
                    textSize: CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    name: `ConquestFlagHudEngageStatusShadowUpLeft_${pid}`,
                    type: "Text",
                    position: [-CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_OFFSET, CONQUEST_HUD_FLAG_ENGAGE_STATUS_Y - CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_OFFSET],
                    size: [CONQUEST_HUD_FLAG_ENGAGE_STATUS_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_STATUS_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(STR_HUD_CONQUEST_CAPTURE_STATUS_CONTESTING),
                    textColor: [0, 0, 0],
                    textAlpha: 1,
                    textSize: CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    name: `ConquestFlagHudEngageStatusShadowUpRight_${pid}`,
                    type: "Text",
                    position: [CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_OFFSET, CONQUEST_HUD_FLAG_ENGAGE_STATUS_Y - CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_OFFSET],
                    size: [CONQUEST_HUD_FLAG_ENGAGE_STATUS_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_STATUS_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(STR_HUD_CONQUEST_CAPTURE_STATUS_CONTESTING),
                    textColor: [0, 0, 0],
                    textAlpha: 1,
                    textSize: CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    name: `ConquestFlagHudEngageStatusShadowDownRight_${pid}`,
                    type: "Text",
                    position: [CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_OFFSET, CONQUEST_HUD_FLAG_ENGAGE_STATUS_Y + CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_OFFSET],
                    size: [CONQUEST_HUD_FLAG_ENGAGE_STATUS_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_STATUS_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(STR_HUD_CONQUEST_CAPTURE_STATUS_CONTESTING),
                    textColor: [0, 0, 0],
                    textAlpha: 1,
                    textSize: CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    name: `ConquestFlagHudEngageStatusShadowDownLeft_${pid}`,
                    type: "Text",
                    position: [-CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_OFFSET, CONQUEST_HUD_FLAG_ENGAGE_STATUS_Y + CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_OFFSET],
                    size: [CONQUEST_HUD_FLAG_ENGAGE_STATUS_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_STATUS_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(STR_HUD_CONQUEST_CAPTURE_STATUS_CONTESTING),
                    textColor: [0, 0, 0],
                    textAlpha: 1,
                    textSize: CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    name: `ConquestFlagHudEngageStatus_${pid}`,
                    type: "Text",
                    position: [0, CONQUEST_HUD_FLAG_ENGAGE_STATUS_Y],
                    size: [CONQUEST_HUD_FLAG_ENGAGE_STATUS_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_STATUS_HEIGHT],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: mod.Message(STR_HUD_CONQUEST_CAPTURE_STATUS_CONTESTING),
                    textColor: [1, 1, 1],
                    textAlpha: 1,
                    textSize: CONQUEST_HUD_FLAG_ENGAGE_STATUS_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.Center,
                },
            ],
        });
        const conquestFlags = modlib.ParseUI({
            name: `ConquestFlagsHudRoot_${pid}`,
            type: "Container",
            playerId: player,
            position: [CONQUEST_FLAGS_ROOT_X, CONQUEST_FLAGS_ROOT_Y],
            size: [CONQUEST_FLAGS_ROOT_WIDTH, CONQUEST_FLAGS_ROOT_HEIGHT],
            anchor: mod.UIAnchor.TopCenter,
            visible: false,
            padding: 0,
            bgAlpha: 0,
            bgFill: mod.UIBgFill.None,
            children: flagChildren,
        });
        if (conquestFlags) {
            refs.roots.push(conquestFlags);
            refs.conquestFlagsDebugRoot = conquestFlags;
        }
    }

    refs.conquestFlagsDebugSlotRoots = [];
    refs.conquestFlagsDebugBorderRows = [];
    refs.conquestFlagsDebugFillRows = [];
    refs.conquestFlagsDebugLabelShadowRightRows = [];
    refs.conquestFlagsDebugLabelShadowLeftRows = [];
    refs.conquestFlagsDebugLabelShadowUpRows = [];
    refs.conquestFlagsDebugLabelShadowDownRows = [];
    refs.conquestFlagsDebugLabelShadowUpLeftRows = [];
    refs.conquestFlagsDebugLabelShadowUpRightRows = [];
    refs.conquestFlagsDebugLabelShadowDownRightRows = [];
    refs.conquestFlagsDebugLabelShadowDownLeftRows = [];
    refs.conquestFlagsDebugLabelShadowInnerRows = [];
    refs.conquestFlagsDebugLabelShadowInnerDeepRows = [];
    refs.conquestFlagsDebugLabelRows = [];
    refs.conquestFlagsDebugPercentRoots = [];
    refs.conquestFlagsDebugPercentShadowRightRows = [];
    refs.conquestFlagsDebugPercentShadowLeftRows = [];
    refs.conquestFlagsDebugPercentShadowUpRows = [];
    refs.conquestFlagsDebugPercentShadowDownRows = [];
    refs.conquestFlagsDebugPercentShadowUpLeftRows = [];
    refs.conquestFlagsDebugPercentShadowUpRightRows = [];
    refs.conquestFlagsDebugPercentShadowDownRightRows = [];
    refs.conquestFlagsDebugPercentShadowDownLeftRows = [];
    refs.conquestFlagsDebugPercentShadowInnerRows = [];
    refs.conquestFlagsDebugPercentTextRows = [];
    refs.conquestFlagsActivePopoutRoot = safeFind(`ConquestFlagHudActivePopoutRoot_${pid}`);
    refs.conquestFlagsActivePopoutSlot = safeFind(`ConquestFlagHudActivePopoutSlot_${pid}`);
    refs.conquestFlagsActivePopoutBorder = safeFind(`ConquestFlagHudActivePopoutBorder_${pid}`);
    refs.conquestFlagsActivePopoutFill = safeFind(`ConquestFlagHudActivePopoutFill_${pid}`);
    refs.conquestFlagsActivePopoutLabelShadowRight = safeFind(`ConquestFlagHudActivePopoutLabelShadowRight_${pid}`);
    refs.conquestFlagsActivePopoutLabelShadowLeft = safeFind(`ConquestFlagHudActivePopoutLabelShadowLeft_${pid}`);
    refs.conquestFlagsActivePopoutLabelShadowUp = safeFind(`ConquestFlagHudActivePopoutLabelShadowUp_${pid}`);
    refs.conquestFlagsActivePopoutLabelShadowDown = safeFind(`ConquestFlagHudActivePopoutLabelShadowDown_${pid}`);
    refs.conquestFlagsActivePopoutLabelShadowUpLeft = safeFind(`ConquestFlagHudActivePopoutLabelShadowUpLeft_${pid}`);
    refs.conquestFlagsActivePopoutLabelShadowUpRight = safeFind(`ConquestFlagHudActivePopoutLabelShadowUpRight_${pid}`);
    refs.conquestFlagsActivePopoutLabelShadowDownRight = safeFind(`ConquestFlagHudActivePopoutLabelShadowDownRight_${pid}`);
    refs.conquestFlagsActivePopoutLabelShadowDownLeft = safeFind(`ConquestFlagHudActivePopoutLabelShadowDownLeft_${pid}`);
    refs.conquestFlagsActivePopoutLabel = safeFind(`ConquestFlagHudActivePopoutLabel_${pid}`);
    refs.conquestFlagsActivePopoutPercentRoot = safeFind(`ConquestFlagHudActivePopoutPercentRoot_${pid}`);
    refs.conquestFlagsActivePopoutPercentShadowRight = safeFind(`ConquestFlagHudActivePopoutPercentShadowRight_${pid}`);
    refs.conquestFlagsActivePopoutPercentShadowLeft = safeFind(`ConquestFlagHudActivePopoutPercentShadowLeft_${pid}`);
    refs.conquestFlagsActivePopoutPercentShadowUp = safeFind(`ConquestFlagHudActivePopoutPercentShadowUp_${pid}`);
    refs.conquestFlagsActivePopoutPercentShadowDown = safeFind(`ConquestFlagHudActivePopoutPercentShadowDown_${pid}`);
    refs.conquestFlagsActivePopoutPercentShadowUpLeft = safeFind(`ConquestFlagHudActivePopoutPercentShadowUpLeft_${pid}`);
    refs.conquestFlagsActivePopoutPercentShadowUpRight = safeFind(`ConquestFlagHudActivePopoutPercentShadowUpRight_${pid}`);
    refs.conquestFlagsActivePopoutPercentShadowDownRight = safeFind(`ConquestFlagHudActivePopoutPercentShadowDownRight_${pid}`);
    refs.conquestFlagsActivePopoutPercentShadowDownLeft = safeFind(`ConquestFlagHudActivePopoutPercentShadowDownLeft_${pid}`);
    refs.conquestFlagsActivePopoutPercentShadowInner = safeFind(`ConquestFlagHudActivePopoutPercentShadowInner_${pid}`);
    refs.conquestFlagsActivePopoutPercentText = safeFind(`ConquestFlagHudActivePopoutPercentText_${pid}`);
    refs.conquestFlagsEngageRoot = safeFind(`ConquestFlagHudEngageRoot_${pid}`);
    refs.conquestFlagsEngageTrack = safeFind(`ConquestFlagHudEngageTrack_${pid}`);
    refs.conquestFlagsEngageFriendlyFill = safeFind(`ConquestFlagHudEngageFriendlyFill_${pid}`);
    refs.conquestFlagsEngageEnemyFill = safeFind(`ConquestFlagHudEngageEnemyFill_${pid}`);
    refs.conquestFlagsEngageFriendlyCountBg = safeFind(`ConquestFlagHudEngageFriendlyCountBg_${pid}`);
    refs.conquestFlagsEngageEnemyCountBg = safeFind(`ConquestFlagHudEngageEnemyCountBg_${pid}`);
    refs.conquestFlagsEngageFriendlyCountShadow = safeFind(`ConquestFlagHudEngageFriendlyCountShadow_${pid}`);
    refs.conquestFlagsEngageEnemyCountShadow = safeFind(`ConquestFlagHudEngageEnemyCountShadow_${pid}`);
    refs.conquestFlagsEngageFriendlyCount = safeFind(`ConquestFlagHudEngageFriendlyCount_${pid}`);
    refs.conquestFlagsEngageEnemyCount = safeFind(`ConquestFlagHudEngageEnemyCount_${pid}`);
    refs.conquestFlagsEngageStatusShadowRight = safeFind(`ConquestFlagHudEngageStatusShadowRight_${pid}`);
    refs.conquestFlagsEngageStatusShadowLeft = safeFind(`ConquestFlagHudEngageStatusShadowLeft_${pid}`);
    refs.conquestFlagsEngageStatusShadowUp = safeFind(`ConquestFlagHudEngageStatusShadowUp_${pid}`);
    refs.conquestFlagsEngageStatusShadowDown = safeFind(`ConquestFlagHudEngageStatusShadowDown_${pid}`);
    refs.conquestFlagsEngageStatusShadowUpLeft = safeFind(`ConquestFlagHudEngageStatusShadowUpLeft_${pid}`);
    refs.conquestFlagsEngageStatusShadowUpRight = safeFind(`ConquestFlagHudEngageStatusShadowUpRight_${pid}`);
    refs.conquestFlagsEngageStatusShadowDownRight = safeFind(`ConquestFlagHudEngageStatusShadowDownRight_${pid}`);
    refs.conquestFlagsEngageStatusShadowDownLeft = safeFind(`ConquestFlagHudEngageStatusShadowDownLeft_${pid}`);
    refs.conquestFlagsEngageStatus = safeFind(`ConquestFlagHudEngageStatus_${pid}`);
    refs.conquestFlagsDebugFriendlyRows = [];
    refs.conquestFlagsDebugCenterRows = [];
    refs.conquestFlagsDebugEnemyRows = [];
    if (refs.conquestFlagsDebugRoot) {
        for (let i = 0; i < CONQUEST_FLAGS_MAX_ROWS; i++) {
            const slotX = CONQUEST_FLAGS_SLOT_X[i] ?? (i * 35.0);
            const slotRoot = safeFind(`ConquestFlagHudSlot_${pid}_${i}`);
            const border = safeFind(`ConquestFlagHudBorder_${pid}_${i}`);
            const fill = safeFind(`ConquestFlagHudFill_${pid}_${i}`);
            const labelShadowRight = safeFind(`ConquestFlagHudLabelShadowRight_${pid}_${i}`);
            const labelShadowLeft = safeFind(`ConquestFlagHudLabelShadowLeft_${pid}_${i}`);
            const labelShadowUp = safeFind(`ConquestFlagHudLabelShadowUp_${pid}_${i}`);
            const labelShadowDown = safeFind(`ConquestFlagHudLabelShadowDown_${pid}_${i}`);
            const labelShadowUpLeft = safeFind(`ConquestFlagHudLabelShadowUpLeft_${pid}_${i}`);
            const labelShadowUpRight = safeFind(`ConquestFlagHudLabelShadowUpRight_${pid}_${i}`);
            const labelShadowDownRight = safeFind(`ConquestFlagHudLabelShadowDownRight_${pid}_${i}`);
            const labelShadowDownLeft = safeFind(`ConquestFlagHudLabelShadowDownLeft_${pid}_${i}`);
            const labelShadowInner = safeFind(`ConquestFlagHudLabelShadowInner_${pid}_${i}`);
            const labelShadowInnerDeep = safeFind(`ConquestFlagHudLabelShadowInnerDeep_${pid}_${i}`);
            const label = safeFind(`ConquestFlagHudLabel_${pid}_${i}`);
            const percentRoot = safeFind(`ConquestFlagHudPercentRoot_${pid}_${i}`);
            const percentShadowRight = safeFind(`ConquestFlagHudPercentShadowRight_${pid}_${i}`);
            const percentShadowLeft = safeFind(`ConquestFlagHudPercentShadowLeft_${pid}_${i}`);
            const percentShadowUp = safeFind(`ConquestFlagHudPercentShadowUp_${pid}_${i}`);
            const percentShadowDown = safeFind(`ConquestFlagHudPercentShadowDown_${pid}_${i}`);
            const percentShadowUpLeft = safeFind(`ConquestFlagHudPercentShadowUpLeft_${pid}_${i}`);
            const percentShadowUpRight = safeFind(`ConquestFlagHudPercentShadowUpRight_${pid}_${i}`);
            const percentShadowDownRight = safeFind(`ConquestFlagHudPercentShadowDownRight_${pid}_${i}`);
            const percentShadowDownLeft = safeFind(`ConquestFlagHudPercentShadowDownLeft_${pid}_${i}`);
            const percentShadowInner = safeFind(`ConquestFlagHudPercentShadowInner_${pid}_${i}`);
            const percentText = safeFind(`ConquestFlagHudPercentText_${pid}_${i}`);
            refs.conquestFlagsDebugSlotRoots[i] = slotRoot;
            refs.conquestFlagsDebugBorderRows[i] = border;
            refs.conquestFlagsDebugFillRows[i] = fill;
            refs.conquestFlagsDebugLabelShadowRightRows[i] = labelShadowRight;
            refs.conquestFlagsDebugLabelShadowLeftRows[i] = labelShadowLeft;
            refs.conquestFlagsDebugLabelShadowUpRows[i] = labelShadowUp;
            refs.conquestFlagsDebugLabelShadowDownRows[i] = labelShadowDown;
            refs.conquestFlagsDebugLabelShadowUpLeftRows[i] = labelShadowUpLeft;
            refs.conquestFlagsDebugLabelShadowUpRightRows[i] = labelShadowUpRight;
            refs.conquestFlagsDebugLabelShadowDownRightRows[i] = labelShadowDownRight;
            refs.conquestFlagsDebugLabelShadowDownLeftRows[i] = labelShadowDownLeft;
            refs.conquestFlagsDebugLabelShadowInnerRows[i] = labelShadowInner;
            refs.conquestFlagsDebugLabelShadowInnerDeepRows[i] = labelShadowInnerDeep;
            refs.conquestFlagsDebugLabelRows[i] = label;
            refs.conquestFlagsDebugPercentRoots[i] = percentRoot;
            refs.conquestFlagsDebugPercentShadowRightRows[i] = percentShadowRight;
            refs.conquestFlagsDebugPercentShadowLeftRows[i] = percentShadowLeft;
            refs.conquestFlagsDebugPercentShadowUpRows[i] = percentShadowUp;
            refs.conquestFlagsDebugPercentShadowDownRows[i] = percentShadowDown;
            refs.conquestFlagsDebugPercentShadowUpLeftRows[i] = percentShadowUpLeft;
            refs.conquestFlagsDebugPercentShadowUpRightRows[i] = percentShadowUpRight;
            refs.conquestFlagsDebugPercentShadowDownRightRows[i] = percentShadowDownRight;
            refs.conquestFlagsDebugPercentShadowDownLeftRows[i] = percentShadowDownLeft;
            refs.conquestFlagsDebugPercentShadowInnerRows[i] = percentShadowInner;
            refs.conquestFlagsDebugPercentTextRows[i] = percentText;
            if (slotRoot) {
                mod.SetUIWidgetParent(slotRoot, refs.conquestFlagsDebugRoot);
                mod.SetUIWidgetPosition(slotRoot, mod.CreateVector(slotX, 0, 0));
                mod.SetUIWidgetDepth(slotRoot, mod.UIDepth.AboveGameUI);
            }
            if (fill && slotRoot) {
                mod.SetUIWidgetParent(fill, slotRoot);
                mod.SetUIWidgetPosition(fill, mod.CreateVector(CONQUEST_HUD_FLAG_FILL_INSET_X, CONQUEST_HUD_FLAG_FILL_INSET_Y, 0));
                mod.SetUIWidgetDepth(fill, mod.UIDepth.AboveGameUI);
            }
            if (border && slotRoot) {
                mod.SetUIWidgetParent(border, slotRoot);
                mod.SetUIWidgetPosition(border, mod.CreateVector(0, 0, 0));
                mod.SetUIWidgetSize(border, mod.CreateVector(CONQUEST_HUD_FLAG_SLOT_WIDTH, CONQUEST_HUD_FLAG_SLOT_HEIGHT, 0));
                mod.SetUIWidgetDepth(border, mod.UIDepth.AboveGameUI);
            }
            if (labelShadowRight && slotRoot) {
                mod.SetUIWidgetParent(labelShadowRight, slotRoot);
                mod.SetUIWidgetPosition(labelShadowRight, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_X + CONQUEST_HUD_FLAG_LABEL_SHADOW_OFFSET, CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_Y, 0));
                mod.SetUIWidgetSize(labelShadowRight, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_LABEL_WIDGET_HEIGHT, 0));
                mod.SetUIWidgetDepth(labelShadowRight, mod.UIDepth.AboveGameUI);
            }
            if (labelShadowLeft && slotRoot) {
                mod.SetUIWidgetParent(labelShadowLeft, slotRoot);
                mod.SetUIWidgetPosition(labelShadowLeft, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_X - CONQUEST_HUD_FLAG_LABEL_SHADOW_OFFSET, CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_Y, 0));
                mod.SetUIWidgetSize(labelShadowLeft, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_LABEL_WIDGET_HEIGHT, 0));
                mod.SetUIWidgetDepth(labelShadowLeft, mod.UIDepth.AboveGameUI);
            }
            if (labelShadowUp && slotRoot) {
                mod.SetUIWidgetParent(labelShadowUp, slotRoot);
                mod.SetUIWidgetPosition(labelShadowUp, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_X, CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_Y - CONQUEST_HUD_FLAG_LABEL_SHADOW_OFFSET, 0));
                mod.SetUIWidgetSize(labelShadowUp, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_LABEL_WIDGET_HEIGHT, 0));
                mod.SetUIWidgetDepth(labelShadowUp, mod.UIDepth.AboveGameUI);
            }
            if (labelShadowDown && slotRoot) {
                mod.SetUIWidgetParent(labelShadowDown, slotRoot);
                mod.SetUIWidgetPosition(labelShadowDown, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_X, CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_Y + CONQUEST_HUD_FLAG_LABEL_SHADOW_OFFSET, 0));
                mod.SetUIWidgetSize(labelShadowDown, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_LABEL_WIDGET_HEIGHT, 0));
                mod.SetUIWidgetDepth(labelShadowDown, mod.UIDepth.AboveGameUI);
            }
            if (labelShadowUpLeft && slotRoot) {
                mod.SetUIWidgetParent(labelShadowUpLeft, slotRoot);
                mod.SetUIWidgetPosition(labelShadowUpLeft, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_X - CONQUEST_HUD_FLAG_LABEL_SHADOW_OFFSET, CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_Y - CONQUEST_HUD_FLAG_LABEL_SHADOW_OFFSET, 0));
                mod.SetUIWidgetSize(labelShadowUpLeft, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_LABEL_WIDGET_HEIGHT, 0));
                mod.SetUIWidgetDepth(labelShadowUpLeft, mod.UIDepth.AboveGameUI);
            }
            if (labelShadowUpRight && slotRoot) {
                mod.SetUIWidgetParent(labelShadowUpRight, slotRoot);
                mod.SetUIWidgetPosition(labelShadowUpRight, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_X + CONQUEST_HUD_FLAG_LABEL_SHADOW_OFFSET, CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_Y - CONQUEST_HUD_FLAG_LABEL_SHADOW_OFFSET, 0));
                mod.SetUIWidgetSize(labelShadowUpRight, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_LABEL_WIDGET_HEIGHT, 0));
                mod.SetUIWidgetDepth(labelShadowUpRight, mod.UIDepth.AboveGameUI);
            }
            if (labelShadowDownRight && slotRoot) {
                mod.SetUIWidgetParent(labelShadowDownRight, slotRoot);
                mod.SetUIWidgetPosition(labelShadowDownRight, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_X + CONQUEST_HUD_FLAG_LABEL_SHADOW_OFFSET, CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_Y + CONQUEST_HUD_FLAG_LABEL_SHADOW_OFFSET, 0));
                mod.SetUIWidgetSize(labelShadowDownRight, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_LABEL_WIDGET_HEIGHT, 0));
                mod.SetUIWidgetDepth(labelShadowDownRight, mod.UIDepth.AboveGameUI);
            }
            if (labelShadowDownLeft && slotRoot) {
                mod.SetUIWidgetParent(labelShadowDownLeft, slotRoot);
                mod.SetUIWidgetPosition(labelShadowDownLeft, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_X - CONQUEST_HUD_FLAG_LABEL_SHADOW_OFFSET, CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_Y + CONQUEST_HUD_FLAG_LABEL_SHADOW_OFFSET, 0));
                mod.SetUIWidgetSize(labelShadowDownLeft, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_LABEL_WIDGET_HEIGHT, 0));
                mod.SetUIWidgetDepth(labelShadowDownLeft, mod.UIDepth.AboveGameUI);
            }
            if (labelShadowInner && slotRoot) {
                mod.SetUIWidgetParent(labelShadowInner, slotRoot);
                mod.SetUIWidgetPosition(labelShadowInner, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_X, CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_Y, 0));
                mod.SetUIWidgetSize(labelShadowInner, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_LABEL_WIDGET_HEIGHT, 0));
                mod.SetUIWidgetDepth(labelShadowInner, mod.UIDepth.AboveGameUI);
            }
            if (labelShadowInnerDeep && slotRoot) {
                mod.SetUIWidgetParent(labelShadowInnerDeep, slotRoot);
                mod.SetUIWidgetPosition(labelShadowInnerDeep, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_X, CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_Y, 0));
                mod.SetUIWidgetSize(labelShadowInnerDeep, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_LABEL_WIDGET_HEIGHT, 0));
                mod.SetUIWidgetDepth(labelShadowInnerDeep, mod.UIDepth.AboveGameUI);
            }
            if (label && slotRoot) {
                mod.SetUIWidgetParent(label, slotRoot);
                mod.SetUIWidgetPosition(label, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_X, CONQUEST_HUD_FLAG_LABEL_WIDGET_OFFSET_Y, 0));
                mod.SetUIWidgetSize(label, mod.CreateVector(CONQUEST_HUD_FLAG_LABEL_WIDGET_WIDTH, CONQUEST_HUD_FLAG_LABEL_WIDGET_HEIGHT, 0));
                mod.SetUIWidgetDepth(label, mod.UIDepth.AboveGameUI);
            }
            if (percentRoot) {
                mod.SetUIWidgetParent(percentRoot, refs.conquestFlagsDebugRoot);
                mod.SetUIWidgetPosition(percentRoot, mod.CreateVector(slotX + CONQUEST_HUD_FLAG_PERCENT_OFFSET_X, CONQUEST_HUD_FLAG_PERCENT_OFFSET_Y, 0));
                mod.SetUIWidgetSize(percentRoot, mod.CreateVector(CONQUEST_HUD_FLAG_PERCENT_ROOT_WIDTH, CONQUEST_HUD_FLAG_PERCENT_ROOT_HEIGHT, 0));
                mod.SetUIWidgetDepth(percentRoot, mod.UIDepth.AboveGameUI);
            }
            if (percentShadowRight && percentRoot) {
                mod.SetUIWidgetParent(percentShadowRight, percentRoot);
                mod.SetUIWidgetPosition(percentShadowRight, mod.CreateVector(CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_X + CONQUEST_HUD_FLAG_PERCENT_SHADOW_OFFSET, CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_Y, 0));
                mod.SetUIWidgetSize(percentShadowRight, mod.CreateVector(CONQUEST_HUD_FLAG_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_PERCENT_WIDGET_HEIGHT, 0));
                mod.SetUIWidgetDepth(percentShadowRight, mod.UIDepth.AboveGameUI);
            }
            if (percentShadowLeft && percentRoot) {
                mod.SetUIWidgetParent(percentShadowLeft, percentRoot);
                mod.SetUIWidgetPosition(percentShadowLeft, mod.CreateVector(CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_X - CONQUEST_HUD_FLAG_PERCENT_SHADOW_OFFSET, CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_Y, 0));
                mod.SetUIWidgetSize(percentShadowLeft, mod.CreateVector(CONQUEST_HUD_FLAG_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_PERCENT_WIDGET_HEIGHT, 0));
                mod.SetUIWidgetDepth(percentShadowLeft, mod.UIDepth.AboveGameUI);
            }
            if (percentShadowUp && percentRoot) {
                mod.SetUIWidgetParent(percentShadowUp, percentRoot);
                mod.SetUIWidgetPosition(percentShadowUp, mod.CreateVector(CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_X, CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_Y - CONQUEST_HUD_FLAG_PERCENT_SHADOW_OFFSET, 0));
                mod.SetUIWidgetSize(percentShadowUp, mod.CreateVector(CONQUEST_HUD_FLAG_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_PERCENT_WIDGET_HEIGHT, 0));
                mod.SetUIWidgetDepth(percentShadowUp, mod.UIDepth.AboveGameUI);
            }
            if (percentShadowDown && percentRoot) {
                mod.SetUIWidgetParent(percentShadowDown, percentRoot);
                mod.SetUIWidgetPosition(percentShadowDown, mod.CreateVector(CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_X, CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_Y + CONQUEST_HUD_FLAG_PERCENT_SHADOW_OFFSET, 0));
                mod.SetUIWidgetSize(percentShadowDown, mod.CreateVector(CONQUEST_HUD_FLAG_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_PERCENT_WIDGET_HEIGHT, 0));
                mod.SetUIWidgetDepth(percentShadowDown, mod.UIDepth.AboveGameUI);
            }
            if (percentShadowUpLeft && percentRoot) {
                mod.SetUIWidgetParent(percentShadowUpLeft, percentRoot);
                mod.SetUIWidgetPosition(percentShadowUpLeft, mod.CreateVector(CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_X - CONQUEST_HUD_FLAG_PERCENT_SHADOW_OFFSET, CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_Y - CONQUEST_HUD_FLAG_PERCENT_SHADOW_OFFSET, 0));
                mod.SetUIWidgetSize(percentShadowUpLeft, mod.CreateVector(CONQUEST_HUD_FLAG_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_PERCENT_WIDGET_HEIGHT, 0));
                mod.SetUIWidgetDepth(percentShadowUpLeft, mod.UIDepth.AboveGameUI);
            }
            if (percentShadowUpRight && percentRoot) {
                mod.SetUIWidgetParent(percentShadowUpRight, percentRoot);
                mod.SetUIWidgetPosition(percentShadowUpRight, mod.CreateVector(CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_X + CONQUEST_HUD_FLAG_PERCENT_SHADOW_OFFSET, CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_Y - CONQUEST_HUD_FLAG_PERCENT_SHADOW_OFFSET, 0));
                mod.SetUIWidgetSize(percentShadowUpRight, mod.CreateVector(CONQUEST_HUD_FLAG_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_PERCENT_WIDGET_HEIGHT, 0));
                mod.SetUIWidgetDepth(percentShadowUpRight, mod.UIDepth.AboveGameUI);
            }
            if (percentShadowDownRight && percentRoot) {
                mod.SetUIWidgetParent(percentShadowDownRight, percentRoot);
                mod.SetUIWidgetPosition(percentShadowDownRight, mod.CreateVector(CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_X + CONQUEST_HUD_FLAG_PERCENT_SHADOW_OFFSET, CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_Y + CONQUEST_HUD_FLAG_PERCENT_SHADOW_OFFSET, 0));
                mod.SetUIWidgetSize(percentShadowDownRight, mod.CreateVector(CONQUEST_HUD_FLAG_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_PERCENT_WIDGET_HEIGHT, 0));
                mod.SetUIWidgetDepth(percentShadowDownRight, mod.UIDepth.AboveGameUI);
            }
            if (percentShadowDownLeft && percentRoot) {
                mod.SetUIWidgetParent(percentShadowDownLeft, percentRoot);
                mod.SetUIWidgetPosition(percentShadowDownLeft, mod.CreateVector(CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_X - CONQUEST_HUD_FLAG_PERCENT_SHADOW_OFFSET, CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_Y + CONQUEST_HUD_FLAG_PERCENT_SHADOW_OFFSET, 0));
                mod.SetUIWidgetSize(percentShadowDownLeft, mod.CreateVector(CONQUEST_HUD_FLAG_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_PERCENT_WIDGET_HEIGHT, 0));
                mod.SetUIWidgetDepth(percentShadowDownLeft, mod.UIDepth.AboveGameUI);
            }
            if (percentShadowInner && percentRoot) {
                mod.SetUIWidgetParent(percentShadowInner, percentRoot);
                mod.SetUIWidgetPosition(percentShadowInner, mod.CreateVector(CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_X, CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_Y, 0));
                mod.SetUIWidgetSize(percentShadowInner, mod.CreateVector(CONQUEST_HUD_FLAG_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_PERCENT_WIDGET_HEIGHT, 0));
                mod.SetUIWidgetDepth(percentShadowInner, mod.UIDepth.AboveGameUI);
            }
            if (percentText && percentRoot) {
                mod.SetUIWidgetParent(percentText, percentRoot);
                mod.SetUIWidgetPosition(percentText, mod.CreateVector(CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_X, CONQUEST_HUD_FLAG_PERCENT_WIDGET_OFFSET_Y, 0));
                mod.SetUIWidgetSize(percentText, mod.CreateVector(CONQUEST_HUD_FLAG_PERCENT_WIDGET_WIDTH, CONQUEST_HUD_FLAG_PERCENT_WIDGET_HEIGHT, 0));
                mod.SetUIWidgetDepth(percentText, mod.UIDepth.AboveGameUI);
            }
        }

        if (refs.conquestFlagsEngageRoot && refs.conquestFlagsDebugRoot) {
            try {
                mod.SetUIWidgetAnchor(refs.conquestFlagsEngageRoot, mod.UIAnchor.TopLeft);
            } catch {
                // Best-effort anchor normalization only.
            }
            mod.SetUIWidgetParent(refs.conquestFlagsEngageRoot, refs.conquestFlagsDebugRoot);
            mod.SetUIWidgetPosition(
                refs.conquestFlagsEngageRoot,
                mod.CreateVector(CONQUEST_FLAGS_ENGAGE_ABS_X, CONQUEST_FLAGS_ENGAGE_ABS_Y, 0)
            );
            mod.SetUIWidgetSize(
                refs.conquestFlagsEngageRoot,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_ROOT_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_ROOT_HEIGHT, 0)
            );
            mod.SetUIWidgetDepth(refs.conquestFlagsEngageRoot, mod.UIDepth.AboveGameUI);
        }
        if (refs.conquestFlagsEngageTrack && refs.conquestFlagsEngageRoot) {
            mod.SetUIWidgetParent(refs.conquestFlagsEngageTrack, refs.conquestFlagsEngageRoot);
            mod.SetUIWidgetPosition(
                refs.conquestFlagsEngageTrack,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_TRACK_X, CONQUEST_HUD_FLAG_ENGAGE_TRACK_Y, 0)
            );
            mod.SetUIWidgetSize(
                refs.conquestFlagsEngageTrack,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_TRACK_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_TRACK_HEIGHT, 0)
            );
            mod.SetUIWidgetDepth(refs.conquestFlagsEngageTrack, mod.UIDepth.AboveGameUI);
        }
        if (refs.conquestFlagsEngageFriendlyFill && refs.conquestFlagsEngageTrack) {
            mod.SetUIWidgetParent(refs.conquestFlagsEngageFriendlyFill, refs.conquestFlagsEngageTrack);
            mod.SetUIWidgetPosition(refs.conquestFlagsEngageFriendlyFill, mod.CreateVector(0, 0, 0));
            mod.SetUIWidgetSize(
                refs.conquestFlagsEngageFriendlyFill,
                mod.CreateVector(Math.floor(CONQUEST_HUD_FLAG_ENGAGE_TRACK_WIDTH / 2), CONQUEST_HUD_FLAG_ENGAGE_TRACK_HEIGHT, 0)
            );
            mod.SetUIWidgetDepth(refs.conquestFlagsEngageFriendlyFill, mod.UIDepth.AboveGameUI);
        }
        if (refs.conquestFlagsEngageEnemyFill && refs.conquestFlagsEngageTrack) {
            const halfTrack = Math.floor(CONQUEST_HUD_FLAG_ENGAGE_TRACK_WIDTH / 2);
            mod.SetUIWidgetParent(refs.conquestFlagsEngageEnemyFill, refs.conquestFlagsEngageTrack);
            mod.SetUIWidgetPosition(refs.conquestFlagsEngageEnemyFill, mod.CreateVector(halfTrack, 0, 0));
            mod.SetUIWidgetSize(
                refs.conquestFlagsEngageEnemyFill,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_TRACK_WIDTH - halfTrack, CONQUEST_HUD_FLAG_ENGAGE_TRACK_HEIGHT, 0)
            );
            mod.SetUIWidgetDepth(refs.conquestFlagsEngageEnemyFill, mod.UIDepth.AboveGameUI);
        }
        if (refs.conquestFlagsEngageFriendlyCountBg && refs.conquestFlagsEngageRoot) {
            mod.SetUIWidgetParent(refs.conquestFlagsEngageFriendlyCountBg, refs.conquestFlagsEngageRoot);
            mod.SetUIWidgetPosition(
                refs.conquestFlagsEngageFriendlyCountBg,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_FRIENDLY_COUNT_BG_X, CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_Y, 0)
            );
            mod.SetUIWidgetSize(
                refs.conquestFlagsEngageFriendlyCountBg,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_HEIGHT, 0)
            );
            mod.SetUIWidgetDepth(refs.conquestFlagsEngageFriendlyCountBg, mod.UIDepth.AboveGameUI);
        }
        if (refs.conquestFlagsEngageEnemyCountBg && refs.conquestFlagsEngageRoot) {
            mod.SetUIWidgetParent(refs.conquestFlagsEngageEnemyCountBg, refs.conquestFlagsEngageRoot);
            mod.SetUIWidgetPosition(
                refs.conquestFlagsEngageEnemyCountBg,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_ENEMY_COUNT_BG_X, CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_Y, 0)
            );
            mod.SetUIWidgetSize(
                refs.conquestFlagsEngageEnemyCountBg,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_HEIGHT, 0)
            );
            mod.SetUIWidgetDepth(refs.conquestFlagsEngageEnemyCountBg, mod.UIDepth.AboveGameUI);
        }
        if (refs.conquestFlagsEngageFriendlyCount && refs.conquestFlagsEngageFriendlyCountBg) {
            mod.SetUIWidgetParent(refs.conquestFlagsEngageFriendlyCount, refs.conquestFlagsEngageFriendlyCountBg);
            mod.SetUIWidgetPosition(
                refs.conquestFlagsEngageFriendlyCount,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_COUNT_TEXT_X, CONQUEST_HUD_FLAG_ENGAGE_COUNT_TEXT_Y, 0)
            );
            mod.SetUIWidgetSize(
                refs.conquestFlagsEngageFriendlyCount,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_HEIGHT, 0)
            );
            mod.SetUIWidgetDepth(refs.conquestFlagsEngageFriendlyCount, mod.UIDepth.AboveGameUI);
        }
        if (refs.conquestFlagsEngageFriendlyCountShadow && refs.conquestFlagsEngageFriendlyCountBg) {
            mod.SetUIWidgetParent(refs.conquestFlagsEngageFriendlyCountShadow, refs.conquestFlagsEngageFriendlyCountBg);
            mod.SetUIWidgetPosition(
                refs.conquestFlagsEngageFriendlyCountShadow,
                mod.CreateVector(
                    CONQUEST_HUD_FLAG_ENGAGE_COUNT_TEXT_X + CONQUEST_HUD_FLAG_ENGAGE_COUNT_SHADOW_OFFSET,
                    CONQUEST_HUD_FLAG_ENGAGE_COUNT_TEXT_Y + CONQUEST_HUD_FLAG_ENGAGE_COUNT_SHADOW_OFFSET,
                    0
                )
            );
            mod.SetUIWidgetSize(
                refs.conquestFlagsEngageFriendlyCountShadow,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_HEIGHT, 0)
            );
            mod.SetUIWidgetDepth(refs.conquestFlagsEngageFriendlyCountShadow, mod.UIDepth.AboveGameUI);
            if (refs.conquestFlagsEngageFriendlyCount) {
                mod.SetUIWidgetParent(refs.conquestFlagsEngageFriendlyCount, refs.conquestFlagsEngageFriendlyCountBg);
                mod.SetUIWidgetPosition(
                    refs.conquestFlagsEngageFriendlyCount,
                    mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_COUNT_TEXT_X, CONQUEST_HUD_FLAG_ENGAGE_COUNT_TEXT_Y, 0)
                );
                mod.SetUIWidgetSize(
                    refs.conquestFlagsEngageFriendlyCount,
                    mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_HEIGHT, 0)
                );
                mod.SetUIWidgetDepth(refs.conquestFlagsEngageFriendlyCount, mod.UIDepth.AboveGameUI);
            }
        }
        if (refs.conquestFlagsEngageEnemyCount && refs.conquestFlagsEngageEnemyCountBg) {
            mod.SetUIWidgetParent(refs.conquestFlagsEngageEnemyCount, refs.conquestFlagsEngageEnemyCountBg);
            mod.SetUIWidgetPosition(
                refs.conquestFlagsEngageEnemyCount,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_COUNT_TEXT_X, CONQUEST_HUD_FLAG_ENGAGE_COUNT_TEXT_Y, 0)
            );
            mod.SetUIWidgetSize(
                refs.conquestFlagsEngageEnemyCount,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_HEIGHT, 0)
            );
            mod.SetUIWidgetDepth(refs.conquestFlagsEngageEnemyCount, mod.UIDepth.AboveGameUI);
        }
        if (refs.conquestFlagsEngageEnemyCountShadow && refs.conquestFlagsEngageEnemyCountBg) {
            mod.SetUIWidgetParent(refs.conquestFlagsEngageEnemyCountShadow, refs.conquestFlagsEngageEnemyCountBg);
            mod.SetUIWidgetPosition(
                refs.conquestFlagsEngageEnemyCountShadow,
                mod.CreateVector(
                    CONQUEST_HUD_FLAG_ENGAGE_COUNT_TEXT_X + CONQUEST_HUD_FLAG_ENGAGE_COUNT_SHADOW_OFFSET,
                    CONQUEST_HUD_FLAG_ENGAGE_COUNT_TEXT_Y + CONQUEST_HUD_FLAG_ENGAGE_COUNT_SHADOW_OFFSET,
                    0
                )
            );
            mod.SetUIWidgetSize(
                refs.conquestFlagsEngageEnemyCountShadow,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_HEIGHT, 0)
            );
            mod.SetUIWidgetDepth(refs.conquestFlagsEngageEnemyCountShadow, mod.UIDepth.AboveGameUI);
            if (refs.conquestFlagsEngageEnemyCount) {
                mod.SetUIWidgetParent(refs.conquestFlagsEngageEnemyCount, refs.conquestFlagsEngageEnemyCountBg);
                mod.SetUIWidgetPosition(
                    refs.conquestFlagsEngageEnemyCount,
                    mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_COUNT_TEXT_X, CONQUEST_HUD_FLAG_ENGAGE_COUNT_TEXT_Y, 0)
                );
                mod.SetUIWidgetSize(
                    refs.conquestFlagsEngageEnemyCount,
                    mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_COUNT_BG_HEIGHT, 0)
                );
                mod.SetUIWidgetDepth(refs.conquestFlagsEngageEnemyCount, mod.UIDepth.AboveGameUI);
            }
        }
        if (refs.conquestFlagsEngageStatusShadowRight && refs.conquestFlagsEngageRoot) {
            mod.SetUIWidgetParent(refs.conquestFlagsEngageStatusShadowRight, refs.conquestFlagsEngageRoot);
            mod.SetUIWidgetPosition(
                refs.conquestFlagsEngageStatusShadowRight,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_OFFSET, CONQUEST_HUD_FLAG_ENGAGE_STATUS_Y, 0)
            );
            mod.SetUIWidgetSize(
                refs.conquestFlagsEngageStatusShadowRight,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_STATUS_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_STATUS_HEIGHT, 0)
            );
            mod.SetUIWidgetDepth(refs.conquestFlagsEngageStatusShadowRight, mod.UIDepth.AboveGameUI);
        }
        if (refs.conquestFlagsEngageStatusShadowLeft && refs.conquestFlagsEngageRoot) {
            mod.SetUIWidgetParent(refs.conquestFlagsEngageStatusShadowLeft, refs.conquestFlagsEngageRoot);
            mod.SetUIWidgetPosition(
                refs.conquestFlagsEngageStatusShadowLeft,
                mod.CreateVector(-CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_OFFSET, CONQUEST_HUD_FLAG_ENGAGE_STATUS_Y, 0)
            );
            mod.SetUIWidgetSize(
                refs.conquestFlagsEngageStatusShadowLeft,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_STATUS_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_STATUS_HEIGHT, 0)
            );
            mod.SetUIWidgetDepth(refs.conquestFlagsEngageStatusShadowLeft, mod.UIDepth.AboveGameUI);
        }
        if (refs.conquestFlagsEngageStatusShadowUp && refs.conquestFlagsEngageRoot) {
            mod.SetUIWidgetParent(refs.conquestFlagsEngageStatusShadowUp, refs.conquestFlagsEngageRoot);
            mod.SetUIWidgetPosition(
                refs.conquestFlagsEngageStatusShadowUp,
                mod.CreateVector(0, CONQUEST_HUD_FLAG_ENGAGE_STATUS_Y - CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_OFFSET, 0)
            );
            mod.SetUIWidgetSize(
                refs.conquestFlagsEngageStatusShadowUp,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_STATUS_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_STATUS_HEIGHT, 0)
            );
            mod.SetUIWidgetDepth(refs.conquestFlagsEngageStatusShadowUp, mod.UIDepth.AboveGameUI);
        }
        if (refs.conquestFlagsEngageStatusShadowDown && refs.conquestFlagsEngageRoot) {
            mod.SetUIWidgetParent(refs.conquestFlagsEngageStatusShadowDown, refs.conquestFlagsEngageRoot);
            mod.SetUIWidgetPosition(
                refs.conquestFlagsEngageStatusShadowDown,
                mod.CreateVector(0, CONQUEST_HUD_FLAG_ENGAGE_STATUS_Y + CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_OFFSET, 0)
            );
            mod.SetUIWidgetSize(
                refs.conquestFlagsEngageStatusShadowDown,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_STATUS_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_STATUS_HEIGHT, 0)
            );
            mod.SetUIWidgetDepth(refs.conquestFlagsEngageStatusShadowDown, mod.UIDepth.AboveGameUI);
        }
        if (refs.conquestFlagsEngageStatusShadowUpLeft && refs.conquestFlagsEngageRoot) {
            mod.SetUIWidgetParent(refs.conquestFlagsEngageStatusShadowUpLeft, refs.conquestFlagsEngageRoot);
            mod.SetUIWidgetPosition(
                refs.conquestFlagsEngageStatusShadowUpLeft,
                mod.CreateVector(-CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_OFFSET, CONQUEST_HUD_FLAG_ENGAGE_STATUS_Y - CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_OFFSET, 0)
            );
            mod.SetUIWidgetSize(
                refs.conquestFlagsEngageStatusShadowUpLeft,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_STATUS_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_STATUS_HEIGHT, 0)
            );
            mod.SetUIWidgetDepth(refs.conquestFlagsEngageStatusShadowUpLeft, mod.UIDepth.AboveGameUI);
        }
        if (refs.conquestFlagsEngageStatusShadowUpRight && refs.conquestFlagsEngageRoot) {
            mod.SetUIWidgetParent(refs.conquestFlagsEngageStatusShadowUpRight, refs.conquestFlagsEngageRoot);
            mod.SetUIWidgetPosition(
                refs.conquestFlagsEngageStatusShadowUpRight,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_OFFSET, CONQUEST_HUD_FLAG_ENGAGE_STATUS_Y - CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_OFFSET, 0)
            );
            mod.SetUIWidgetSize(
                refs.conquestFlagsEngageStatusShadowUpRight,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_STATUS_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_STATUS_HEIGHT, 0)
            );
            mod.SetUIWidgetDepth(refs.conquestFlagsEngageStatusShadowUpRight, mod.UIDepth.AboveGameUI);
        }
        if (refs.conquestFlagsEngageStatusShadowDownRight && refs.conquestFlagsEngageRoot) {
            mod.SetUIWidgetParent(refs.conquestFlagsEngageStatusShadowDownRight, refs.conquestFlagsEngageRoot);
            mod.SetUIWidgetPosition(
                refs.conquestFlagsEngageStatusShadowDownRight,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_OFFSET, CONQUEST_HUD_FLAG_ENGAGE_STATUS_Y + CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_OFFSET, 0)
            );
            mod.SetUIWidgetSize(
                refs.conquestFlagsEngageStatusShadowDownRight,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_STATUS_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_STATUS_HEIGHT, 0)
            );
            mod.SetUIWidgetDepth(refs.conquestFlagsEngageStatusShadowDownRight, mod.UIDepth.AboveGameUI);
        }
        if (refs.conquestFlagsEngageStatusShadowDownLeft && refs.conquestFlagsEngageRoot) {
            mod.SetUIWidgetParent(refs.conquestFlagsEngageStatusShadowDownLeft, refs.conquestFlagsEngageRoot);
            mod.SetUIWidgetPosition(
                refs.conquestFlagsEngageStatusShadowDownLeft,
                mod.CreateVector(-CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_OFFSET, CONQUEST_HUD_FLAG_ENGAGE_STATUS_Y + CONQUEST_HUD_FLAG_ENGAGE_STATUS_SHADOW_OFFSET, 0)
            );
            mod.SetUIWidgetSize(
                refs.conquestFlagsEngageStatusShadowDownLeft,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_STATUS_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_STATUS_HEIGHT, 0)
            );
            mod.SetUIWidgetDepth(refs.conquestFlagsEngageStatusShadowDownLeft, mod.UIDepth.AboveGameUI);
        }
        if (refs.conquestFlagsEngageStatus && refs.conquestFlagsEngageRoot) {
            mod.SetUIWidgetParent(refs.conquestFlagsEngageStatus, refs.conquestFlagsEngageRoot);
            mod.SetUIWidgetPosition(refs.conquestFlagsEngageStatus, mod.CreateVector(0, CONQUEST_HUD_FLAG_ENGAGE_STATUS_Y, 0));
            mod.SetUIWidgetSize(
                refs.conquestFlagsEngageStatus,
                mod.CreateVector(CONQUEST_HUD_FLAG_ENGAGE_STATUS_WIDTH, CONQUEST_HUD_FLAG_ENGAGE_STATUS_HEIGHT, 0)
            );
            mod.SetUIWidgetDepth(refs.conquestFlagsEngageStatus, mod.UIDepth.AboveGameUI);
        }
    }
    safeSetUIWidgetDepth(refs.conquestFlagsDebugRoot, mod.UIDepth.AboveGameUI);
    purgeLegacyConquestRoots();
    purgeLegacyFlagTripletRows();
    purgeLegacyTopCoreContainers();

    //#endregion ----------------- HUD Build/Ensure - Admin Action Counter --------------------



    //#region -------------------- HUD Build/Ensure - Counter Widgets --------------------

    // West/East score panels and top round X/Y counters intentionally removed for conquest HUD simplification.

    //#endregion ----------------- HUD Build/Ensure - Counter Widgets --------------------



    // Legacy round-end modal was removed; conquest uses the dedicated victory dialog builder below.



    //#region -------------------- HUD Build/Ensure - Victory Dialog --------------------

    buildVictoryDialogWidgets(player, pid, refs);

    //#endregion ----------------- HUD Build/Ensure - Victory Dialog --------------------



    //#region -------------------- HUD Build/Ensure - Cache Init + Defaults --------------------

    refs.helpTextContainer = safeFind(`Container_HelpText_${pid}`);
    refs.readyStatusContainer = safeFind(`Container_ReadyStatus_${pid}`);
    refs.settingsGameModeText = safeFind(`Settings_GameMode_${pid}`);
    refs.settingsAircraftCeilingText = safeFind(`Settings_Ceiling_${pid}`);
    refs.settingsVehiclesT1Text = safeFind(`Settings_VehiclesT1_${pid}`);
    refs.settingsVehiclesT2Text = safeFind(`Settings_VehiclesT2_${pid}`);
    refs.settingsVehiclesMatchupText = safeFind(`Settings_VehiclesMatchup_${pid}`);
    refs.settingsPlayersText = safeFind(`Settings_Players_${pid}`);
    State.conquest.debug.hudGenerationByPid[pid] = (State.conquest.debug.hudGenerationByPid[pid] ?? 0) + 1;

    // Keep only HUD elements used by conquest's simplified center HUD + overlays.
    setAdminPanelActionCountText(refs.adminPanelActionCountText, State.admin.actionCount);

    const pinnedCombatRoots = pinConquestCombatRootsToTopHudRoot(refs);
    if (!pinnedCombatRoots) {
        // Root-chain placement is mandatory for Conquest combat HUD.
        // If pinning fails, tear down immediately so no unpinned top-left roots leak on-screen.
        destroyConquestHudForPid(pid);
        return undefined;
    }
    if (!rebindConquestHudRefsFromPinnedTree(refs)) {
        // Subtree-scoped rebind is mandatory so render refs always belong to pinned centered roots.
        destroyConquestHudForPid(pid);
        return undefined;
    }
    State.hudCache.hudByPid[pid] = refs;
    updateSettingsSummaryHudForPid(pid);
    const readyContainer = safeFind(`Container_ReadyStatus_${pid}`);
    if (readyContainer) {
        try {
            mod.SetUIWidgetAnchor(readyContainer, mod.UIAnchor.TopLeft);
        } catch {
            // Best-effort anchor normalization only.
        }
        mod.SetUIWidgetParent(readyContainer, mod.GetUIRoot());
        mod.SetUIWidgetPosition(readyContainer, mod.CreateVector(CONQUEST_READY_ABS_X, CONQUEST_READY_ABS_Y, 0));
        mod.SetUIWidgetSize(readyContainer, mod.CreateVector(CONQUEST_READY_CONTAINER_WIDTH, CONQUEST_READY_CONTAINER_HEIGHT, 0));
    }
    const readyText = safeFind(`ReadyStatusText_${pid}`);
    if (readyText && readyContainer) {
        mod.SetUIWidgetParent(readyText, readyContainer);
        mod.SetUIWidgetPosition(readyText, mod.CreateVector(0, CONQUEST_READY_TEXT_OFFSET_Y, 0));
        mod.SetUIWidgetSize(readyText, mod.CreateVector(CONQUEST_READY_CONTAINER_WIDTH, CONQUEST_READY_TEXT_HEIGHT, 0));
    }
    setHudHelpDepthForPid(pid);

    updateVictoryDialogForPlayer(player, getRemainingSeconds());

    return refs;
}

//#endregion ----------------- HUD Build/Ensure - Cache Init + Defaults --------------------
