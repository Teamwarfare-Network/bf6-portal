// @ts-nocheck
// Module: hud/combat-hud-coalesce -- 50ms debounce for forced combat HUD broadcasts
//
// Mirrors the v1.497 S3 vehicle deploy timer coalesce pattern (deploy-timer-ui.ts:27-59).
// Collapses bursts of force=true combat HUD broadcast requests within a 50ms window into a
// single unforced drain. The unforced drain still respects the 200ms main throttle
// (TWL_CONQUEST_HUD_MAIN_UPDATE_SECONDS) so at most one render occurs per 200ms regardless
// of event density.
//
// The 50ms window is deliberately shorter than the combat HUD throttle (200ms) so the
// coalesce does not become the bottleneck. The first request within an idle window schedules
// a drain via Timers.setTimeout; subsequent requests within the same 50ms window are O(1)
// flag-flips. At drain time the flag is consumed and updateConquestCombatHudForAllPlayers()
// runs once (no force -- lets the 200ms main throttle gate the actual render).

let combatHudCoalesceDirty = false;
let combatHudCoalesceTimerId: number | undefined = undefined;
const COMBAT_HUD_COALESCE_MS = 50;

function clearCombatHudCoalesceTimer(): void {
    if (combatHudCoalesceTimerId !== undefined) {
        try { Timers.clearTimeout(combatHudCoalesceTimerId); } catch {}
        combatHudCoalesceTimerId = undefined;
    }
    combatHudCoalesceDirty = false;
}

function scheduleCombatHudCoalesceDrain(): void {
    combatHudCoalesceDirty = true;
    if (combatHudCoalesceTimerId !== undefined) return;
    combatHudCoalesceTimerId = Timers.setTimeout(() => {
        combatHudCoalesceTimerId = undefined;
        if (!combatHudCoalesceDirty) return;
        combatHudCoalesceDirty = false;
        updateConquestCombatHudForAllPlayers();
    }, COMBAT_HUD_COALESCE_MS);
}
