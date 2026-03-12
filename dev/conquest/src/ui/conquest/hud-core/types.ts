// @ts-nocheck
// Module: ui/conquest/hud-core/types -- hard-cut combat HUD contracts (no legacy combat name reuse)

type TwlConquestHudMode = "off" | "legacy" | "core";

type TwlConquestHudObjectiveSnapshot = {
    visible: boolean;
    objId?: number;
    label: string;
    ownerTeam: TeamID | 0;
    progressTeam: TeamID | 0;
    progress01: number;
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

type TwlConquestHudPopoutSnapshot = {
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

type TwlConquestHudEngageSnapshot = {
    visible: boolean;
    friendlyCountLabel?: mod.Message;
    enemyCountLabel?: mod.Message;
    statusLabel?: mod.Message;
    friendlyWidth: number;
    enemyWidth: number;
};

type TwlConquestHudSnapshot = {
    pid: number;
    friendlyTeam: TeamID;
    enemyTeam: TeamID;
    friendlyTickets: number;
    enemyTickets: number;
    friendlyRatio: number;
    enemyRatio: number;
    leaderTeam: TeamID | 0;
    bleedLeftCount: number;
    bleedRightCount: number;
    objectives: TwlConquestHudObjectiveSnapshot[];
    popout: TwlConquestHudPopoutSnapshot;
    engage: TwlConquestHudEngageSnapshot;
};

type TwlConquestHudWidgetRefs = {
    root?: mod.UIWidget;
    combatLane?: mod.UIWidget;
    ticketsLane?: mod.UIWidget;
    objectivesLane?: mod.UIWidget;
    ticketBlueBox?: mod.UIWidget;
    ticketRedBox?: mod.UIWidget;
    ticketBlueCount?: mod.UIWidget;
    ticketRedCount?: mod.UIWidget;
    ticketSlash?: mod.UIWidget;
    ticketBlueBarTrack?: mod.UIWidget;
    ticketBlueBarFill?: mod.UIWidget;
    ticketRedBarTrack?: mod.UIWidget;
    ticketRedBarFill?: mod.UIWidget;
    ticketLeadBorderLeft?: mod.UIWidget;
    ticketLeadBorderRight?: mod.UIWidget;
    ticketLeadCrownLeftShadow?: mod.UIWidget;
    ticketLeadCrownRightShadow?: mod.UIWidget;
    ticketLeadCrownLeft?: mod.UIWidget;
    ticketLeadCrownRight?: mod.UIWidget;
    ticketBleedLeftChevronShadowRings: Array<Array<mod.UIWidget | undefined>>;
    ticketBleedRightChevronShadowRings: Array<Array<mod.UIWidget | undefined>>;
    ticketBleedLeftChevrons: Array<mod.UIWidget | undefined>;
    ticketBleedRightChevrons: Array<mod.UIWidget | undefined>;
    objectiveSlotRoots: Array<mod.UIWidget | undefined>;
    objectiveSlotBorders: Array<mod.UIWidget | undefined>;
    objectiveSlotFills: Array<mod.UIWidget | undefined>;
    objectiveSlotLabelShadowRings: Array<Array<mod.UIWidget | undefined>>;
    objectiveSlotLabels: Array<mod.UIWidget | undefined>;
    objectiveSlotPercentShadowRings: Array<Array<mod.UIWidget | undefined>>;
    objectiveSlotPercents: Array<mod.UIWidget | undefined>;
    popoutRoot?: mod.UIWidget;
    popoutSlot?: mod.UIWidget;
    popoutBorder?: mod.UIWidget;
    popoutFill?: mod.UIWidget;
    popoutLabelShadowRing: Array<mod.UIWidget | undefined>;
    popoutLabel?: mod.UIWidget;
    popoutPercentShadowRing: Array<mod.UIWidget | undefined>;
    popoutPercent?: mod.UIWidget;
    engageRoot?: mod.UIWidget;
    engageTrack?: mod.UIWidget;
    engageFriendlyFill?: mod.UIWidget;
    engageEnemyFill?: mod.UIWidget;
    engageFriendlyCountShadowRing: Array<mod.UIWidget | undefined>;
    engageEnemyCountShadowRing: Array<mod.UIWidget | undefined>;
    engageFriendlyCount?: mod.UIWidget;
    engageEnemyCount?: mod.UIWidget;
    engageStatusShadowRing: Array<mod.UIWidget | undefined>;
    engageStatus?: mod.UIWidget;
};

type TwlConquestHudPlayerEntry = {
    pid: number;
    initialized: boolean;
    widgets: TwlConquestHudWidgetRefs;
    layoutFlagCount: number;
    buildGeneration: number;
    mainUpdates: number;
    animationUpdates: number;
    lastMainUpdateAtSeconds: number;
    lastAnimationUpdateAtSeconds: number;
    lastSnapshot?: TwlConquestHudSnapshot;
};
