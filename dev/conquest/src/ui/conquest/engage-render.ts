// @ts-nocheck
// Module: ui/conquest/engage-render -- active objective engage panel render ownership

// Renders conquest engage status widgets only.
function renderConquestEngageForPid(
    refs: HudRefs,
    engage: ConquestHudEngageViewModel
): void {
    const pid = refs.pid;
    let targetRefs = refs;
    let engageRoot = targetRefs.conquestFlagsEngageRoot;
    let engageTrack = targetRefs.conquestFlagsEngageTrack;
    let engageFriendlyFill = targetRefs.conquestFlagsEngageFriendlyFill;
    let engageEnemyFill = targetRefs.conquestFlagsEngageEnemyFill;
    let engageFriendlyCountBg = targetRefs.conquestFlagsEngageFriendlyCountBg;
    let engageEnemyCountBg = targetRefs.conquestFlagsEngageEnemyCountBg;
    let engageFriendlyCountShadow = targetRefs.conquestFlagsEngageFriendlyCountShadow;
    let engageEnemyCountShadow = targetRefs.conquestFlagsEngageEnemyCountShadow;
    let engageFriendlyCount = targetRefs.conquestFlagsEngageFriendlyCount;
    let engageEnemyCount = targetRefs.conquestFlagsEngageEnemyCount;
    let engageStatusShadowRight = targetRefs.conquestFlagsEngageStatusShadowRight;
    let engageStatusShadowLeft = targetRefs.conquestFlagsEngageStatusShadowLeft;
    let engageStatusShadowUp = targetRefs.conquestFlagsEngageStatusShadowUp;
    let engageStatusShadowDown = targetRefs.conquestFlagsEngageStatusShadowDown;
    let engageStatusShadowUpLeft = targetRefs.conquestFlagsEngageStatusShadowUpLeft;
    let engageStatusShadowUpRight = targetRefs.conquestFlagsEngageStatusShadowUpRight;
    let engageStatusShadowDownRight = targetRefs.conquestFlagsEngageStatusShadowDownRight;
    let engageStatusShadowDownLeft = targetRefs.conquestFlagsEngageStatusShadowDownLeft;
    let engageStatus = targetRefs.conquestFlagsEngageStatus;

    if (
        !engageRoot
        || !engageTrack
        || !engageFriendlyFill
        || !engageEnemyFill
        || !engageFriendlyCountBg
        || !engageEnemyCountBg
        || !engageFriendlyCountShadow
        || !engageEnemyCountShadow
        || !engageFriendlyCount
        || !engageEnemyCount
        || !engageStatusShadowRight
        || !engageStatusShadowLeft
        || !engageStatusShadowUp
        || !engageStatusShadowDown
        || !engageStatusShadowUpLeft
        || !engageStatusShadowUpRight
        || !engageStatusShadowDownRight
        || !engageStatusShadowDownLeft
        || !engageStatus
    ) {
        const refreshed = conquestPhase3EnsureHudRefsForPid(pid);
        if (refreshed) {
            targetRefs = refreshed;
            engageRoot = targetRefs.conquestFlagsEngageRoot;
            engageTrack = targetRefs.conquestFlagsEngageTrack;
            engageFriendlyFill = targetRefs.conquestFlagsEngageFriendlyFill;
            engageEnemyFill = targetRefs.conquestFlagsEngageEnemyFill;
            engageFriendlyCountBg = targetRefs.conquestFlagsEngageFriendlyCountBg;
            engageEnemyCountBg = targetRefs.conquestFlagsEngageEnemyCountBg;
            engageFriendlyCountShadow = targetRefs.conquestFlagsEngageFriendlyCountShadow;
            engageEnemyCountShadow = targetRefs.conquestFlagsEngageEnemyCountShadow;
            engageFriendlyCount = targetRefs.conquestFlagsEngageFriendlyCount;
            engageEnemyCount = targetRefs.conquestFlagsEngageEnemyCount;
            engageStatusShadowRight = targetRefs.conquestFlagsEngageStatusShadowRight;
            engageStatusShadowLeft = targetRefs.conquestFlagsEngageStatusShadowLeft;
            engageStatusShadowUp = targetRefs.conquestFlagsEngageStatusShadowUp;
            engageStatusShadowDown = targetRefs.conquestFlagsEngageStatusShadowDown;
            engageStatusShadowUpLeft = targetRefs.conquestFlagsEngageStatusShadowUpLeft;
            engageStatusShadowUpRight = targetRefs.conquestFlagsEngageStatusShadowUpRight;
            engageStatusShadowDownRight = targetRefs.conquestFlagsEngageStatusShadowDownRight;
            engageStatusShadowDownLeft = targetRefs.conquestFlagsEngageStatusShadowDownLeft;
            engageStatus = targetRefs.conquestFlagsEngageStatus;
        }
    }

    if (
        !engageRoot
        || !engageTrack
        || !engageFriendlyFill
        || !engageEnemyFill
        || !engageFriendlyCountBg
        || !engageEnemyCountBg
        || !engageFriendlyCountShadow
        || !engageEnemyCountShadow
        || !engageFriendlyCount
        || !engageEnemyCount
        || !engageStatusShadowRight
        || !engageStatusShadowLeft
        || !engageStatusShadowUp
        || !engageStatusShadowDown
        || !engageStatusShadowUpLeft
        || !engageStatusShadowUpRight
        || !engageStatusShadowDownRight
        || !engageStatusShadowDownLeft
        || !engageStatus
    ) {
        conquestPhase3MarkHudDirty();
        return;
    }

    const engageStatusGroup: ConquestShadowTextWidgetSet = {
        right: engageStatusShadowRight,
        left: engageStatusShadowLeft,
        up: engageStatusShadowUp,
        down: engageStatusShadowDown,
        upLeft: engageStatusShadowUpLeft,
        upRight: engageStatusShadowUpRight,
        downRight: engageStatusShadowDownRight,
        downLeft: engageStatusShadowDownLeft,
        text: engageStatus,
    };
    safeSetUIWidgetVisible(engageRoot, engage.visible);
    if (!engage.visible) {
        safeSetUIWidgetVisible(engageTrack, false);
        safeSetUIWidgetVisible(engageFriendlyFill, false);
        safeSetUIWidgetVisible(engageEnemyFill, false);
        safeSetUIWidgetVisible(engageFriendlyCountBg, false);
        safeSetUIWidgetVisible(engageEnemyCountBg, false);
        safeSetUIWidgetVisible(engageFriendlyCountShadow, false);
        safeSetUIWidgetVisible(engageEnemyCountShadow, false);
        safeSetUIWidgetVisible(engageFriendlyCount, false);
        safeSetUIWidgetVisible(engageEnemyCount, false);
        conquestPhase3SetShadowTextGroupVisible(engageStatusGroup, false);
        return;
    }

    safeSetUIWidgetVisible(engageTrack, true);
    safeSetUIWidgetVisible(engageFriendlyCountBg, true);
    safeSetUIWidgetVisible(engageEnemyCountBg, true);
    safeSetUIWidgetVisible(engageFriendlyCountShadow, true);
    safeSetUIWidgetVisible(engageEnemyCountShadow, true);
    safeSetUIWidgetVisible(engageFriendlyCount, true);
    safeSetUIWidgetVisible(engageEnemyCount, true);
    conquestPhase3SetShadowTextGroupVisible(engageStatusGroup, true);

    const friendlyCountLabel = engage.friendlyCountLabel ?? mod.Message(mod.stringkeys.twl.system.genericCounter, 0);
    const enemyCountLabel = engage.enemyCountLabel ?? mod.Message(mod.stringkeys.twl.system.genericCounter, 0);
    const statusLabel = engage.statusLabel ?? mod.Message(STR_HUD_CONQUEST_CAPTURE_STATUS_CONTESTING);
    safeSetUITextLabel(
        engageFriendlyCountShadow,
        friendlyCountLabel
    );
    safeSetUITextLabel(
        engageEnemyCountShadow,
        enemyCountLabel
    );
    safeSetUITextLabel(
        engageFriendlyCount,
        friendlyCountLabel
    );
    safeSetUITextLabel(
        engageEnemyCount,
        enemyCountLabel
    );
    conquestPhase3SetShadowTextGroupLabel(engageStatusGroup, statusLabel);
    conquestPhase3SetShadowTextGroupColors(engageStatusGroup, COLOR_WHITE);
    safeSetUITextColor(engageFriendlyCountShadow, CONQUEST_SHADOW_TEXT_COLOR_BLACK);
    safeSetUITextColor(engageEnemyCountShadow, CONQUEST_SHADOW_TEXT_COLOR_BLACK);
    safeSetUITextColor(engageFriendlyCount, COLOR_BLUE);
    safeSetUITextColor(engageEnemyCount, COLOR_RED);
    safeSetUIWidgetBgColor(engageTrack, COLOR_GRAY_DARK);
    // Final core-on-top pass (depth + visibility only; parent ownership is build-time only).
    safeSetUIWidgetDepth(engageFriendlyCountShadow, mod.UIDepth.AboveGameUI);
    safeSetUIWidgetDepth(engageEnemyCountShadow, mod.UIDepth.AboveGameUI);
    safeSetUIWidgetDepth(engageFriendlyCount, mod.UIDepth.AboveGameUI);
    safeSetUIWidgetDepth(engageEnemyCount, mod.UIDepth.AboveGameUI);
    safeSetUIWidgetVisible(engageFriendlyCount, true);
    safeSetUIWidgetVisible(engageEnemyCount, true);

    const friendlyWidth = engage.friendlyWidth;
    const enemyWidth = engage.enemyWidth;

    safeSetUIWidgetVisible(engageFriendlyFill, friendlyWidth > 0);
    safeSetUIWidgetVisible(engageEnemyFill, enemyWidth > 0);
    if (friendlyWidth > 0) {
        safeSetUIWidgetPosition(engageFriendlyFill, mod.CreateVector(0, 0, 0));
        safeSetUIWidgetSize(
            engageFriendlyFill,
            mod.CreateVector(friendlyWidth, CONQUEST_HUD_FLAG_ENGAGE_TRACK_HEIGHT, 0)
        );
        safeSetUIWidgetBgColor(engageFriendlyFill, COLOR_BLUE);
    }
    if (enemyWidth > 0) {
        safeSetUIWidgetPosition(engageEnemyFill, mod.CreateVector(friendlyWidth, 0, 0));
        safeSetUIWidgetSize(
            engageEnemyFill,
            mod.CreateVector(enemyWidth, CONQUEST_HUD_FLAG_ENGAGE_TRACK_HEIGHT, 0)
        );
        safeSetUIWidgetBgColor(engageEnemyFill, COLOR_RED);
    }
}
