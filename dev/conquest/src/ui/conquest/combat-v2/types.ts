// @ts-nocheck
// Module: ui/conquest/combat-v2/types -- ownership, classification, and cache contracts for combat HUD rebuild

type ConquestCombatHudV2ElementClass = "static" | "dynamic" | "animated";
type ConquestCombatHudV2UpdateCadence = "none" | "main" | "animation";

type ConquestCombatHudV2WidgetRefs = {
    topHudRoot?: mod.UIWidget;
    combatRoot?: mod.UIWidget;
    ticketsRoot?: mod.UIWidget;
    ticketsLeftBarTrack?: mod.UIWidget;
    ticketsLeftBarFill?: mod.UIWidget;
    ticketsRightBarTrack?: mod.UIWidget;
    ticketsRightBarFill?: mod.UIWidget;
    ticketsFriendlyText?: mod.UIWidget;
    ticketsEnemyText?: mod.UIWidget;
    ticketsSlashText?: mod.UIWidget;
    ticketsLeadBorderLeft?: mod.UIWidget;
    ticketsLeadBorderRight?: mod.UIWidget;
    ticketsBleedLeftChevrons?: Array<mod.UIWidget | undefined>;
    ticketsBleedRightChevrons?: Array<mod.UIWidget | undefined>;
    flagsRoot?: mod.UIWidget;
    flagsSlotRoots?: Array<mod.UIWidget | undefined>;
    flagsSlotFills?: Array<mod.UIWidget | undefined>;
    flagsSlotLabels?: Array<mod.UIWidget | undefined>;
    activePopoutRoot?: mod.UIWidget;
    activePopoutSlot?: mod.UIWidget;
    activePopoutFill?: mod.UIWidget;
    activePopoutLabel?: mod.UIWidget;
    activePopoutPercent?: mod.UIWidget;
    engageRoot?: mod.UIWidget;
    engageTrack?: mod.UIWidget;
    engageFriendlyFill?: mod.UIWidget;
    engageEnemyFill?: mod.UIWidget;
    engageFriendlyCount?: mod.UIWidget;
    engageEnemyCount?: mod.UIWidget;
    engageStatus?: mod.UIWidget;
};

type ConquestCombatHudV2Telemetry = {
    instanceCount: number;
    mainUpdates: number;
    animationUpdates: number;
    lastMainUpdateAtSeconds: number;
    lastAnimationUpdateAtSeconds: number;
};

type ConquestCombatHudV2PlayerEntry = {
    pid: number;
    initialized: boolean;
    dirty: boolean;
    animationDirty: boolean;
    teamSwapPending: boolean;
    widgets: ConquestCombatHudV2WidgetRefs;
    telemetry: ConquestCombatHudV2Telemetry;
};
