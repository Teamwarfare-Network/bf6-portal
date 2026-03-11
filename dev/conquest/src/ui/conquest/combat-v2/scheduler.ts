// @ts-nocheck
// Module: ui/conquest/combat-v2/scheduler -- cadence owner for combat HUD v2 main/animation updates

const conquestCombatHudV2ScheduleState = {
    lastMainTickAt: -1,
    lastAnimationTickAt: -1,
};

// Ticks combat HUD v2 main cadence and dispatches main render updates when due.
function conquestCombatHudV2TickMain(force?: boolean): void {
    if (!CONQUEST_COMBAT_HUD_ENABLED) return;
    const now = mod.GetMatchTimeElapsed();
    if (!force && conquestCombatHudV2ScheduleState.lastMainTickAt >= 0) {
        const elapsed = now - conquestCombatHudV2ScheduleState.lastMainTickAt;
        if (elapsed < CONQUEST_COMBAT_HUD_V2_MAIN_UPDATE_SECONDS) return;
    }
    conquestCombatHudV2ScheduleState.lastMainTickAt = now;
    renderConquestCombatHudV2ForAllPlayers();
}

// Ticks combat HUD v2 animation cadence and dispatches animation updates when due.
function conquestCombatHudV2TickAnimation(force?: boolean): void {
    if (!CONQUEST_COMBAT_HUD_ENABLED) return;
    const now = mod.GetMatchTimeElapsed();
    if (!force && conquestCombatHudV2ScheduleState.lastAnimationTickAt >= 0) {
        const elapsed = now - conquestCombatHudV2ScheduleState.lastAnimationTickAt;
        if (elapsed < CONQUEST_COMBAT_HUD_V2_ANIMATION_UPDATE_SECONDS) return;
    }
    conquestCombatHudV2ScheduleState.lastAnimationTickAt = now;
    renderConquestCombatHudV2AnimationForAllPlayers();
}

// Resets the combat HUD v2 cadence timers.
function resetConquestCombatHudV2Scheduler(): void {
    conquestCombatHudV2ScheduleState.lastMainTickAt = -1;
    conquestCombatHudV2ScheduleState.lastAnimationTickAt = -1;
}
