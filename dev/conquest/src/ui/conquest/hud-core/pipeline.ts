// @ts-nocheck
// Module: ui/conquest/hud-core/pipeline -- top-down runtime pipeline for hard-cut combat HUD

// Deep parent/anchor validation is expensive; sample periodically instead of every frame.
const TWL_CONQUEST_HUD_RUNTIME_VALIDATION_INTERVAL_UPDATES = 40;

function twlConquestHudBootRuntime(): void {
    twlConquestHudDestroyAllPlayers();
    twlConquestHudResetSchedulerState();
}

function twlConquestHudRecoverEntry(pid: number): void {
    twlConquestHudDestroyPlayer(pid);
}

// Soft-fail HUD core runtime when any uncaught HUD exception occurs so gameplay loops keep running.
// Keep existing HUD visible on transient faults; do not globally hide combat lane.
// A scheduler reset is enough to allow next-tick recovery without visible blackout.
function twlConquestHudFailSafeOff(): void {
    twlConquestHudResetSchedulerState();
}

function twlConquestHudProcessPlayerFrame(
    player: mod.Player,
    now: number
): boolean {
    if (!player || !mod.IsPlayerValid(player)) return false;
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return false;

    // Bug 4 guard:
    // while swap-reset is pending, keep this player's core combat HUD fully hidden.
    // Deploy callback is the only owner that clears the pending gate/reveal.
    if (State.conquest.debug.teamSwapHudResetPendingByPid[pid] === true) {
        State.conquest.debug.engageHiddenUntilDeployByPid[pid] = true;
        delete State.conquest.capture.engagedObjIdByPid[pid];
        // Keep swap-pending path non-building to avoid churn while team context is in transition.
        twlConquestHudHidePlayer(pid);
        return true;
    }

    const warmReady = isHudWarmReadyForPid(pid);
    const combatRevealAllowed = isCombatHudRevealAllowedForPid(pid);
    if (!warmReady || !combatRevealAllowed) {
        State.conquest.debug.engageHiddenUntilDeployByPid[pid] = true;
    }

    const expectedLayoutFlagCount = twlConquestHudGetLayoutFlagCount();
    const existingEntry = twlConquestHudGetEntry(pid);
    if (
        existingEntry
        && existingEntry.initialized
        && existingEntry.layoutFlagCount !== expectedLayoutFlagCount
    ) {
        twlConquestHudRecoverEntry(pid);
    }

    const entry = twlConquestHudEnsurePlayerGraph(player);
    if (!entry || !entry.initialized) return true;
    if (!warmReady || !combatRevealAllowed) {
        twlConquestHudHideRootOnly(pid);
        return true;
    }
    if (
        entry.mainUpdates > 0
        && (entry.mainUpdates % TWL_CONQUEST_HUD_RUNTIME_VALIDATION_INTERVAL_UPDATES) === 0
    ) {
        // Validation is advisory here: do not destroy/rebuild on transient parent-handle readback drift.
        twlConquestHudValidateCriticalRefs(entry);
    }

    const snapshot = twlConquestHudBuildSnapshotForPlayer(player);
    if (entry.pendingFirstReveal) {
        twlConquestHudHidePlayer(pid);
        twlConquestHudRenderPlayerFrame(pid, player, snapshot, false);
        entry.lastSnapshot = snapshot;
        entry.mainUpdates = entry.mainUpdates + 1;
        entry.lastMainUpdateAtSeconds = Math.floor(now);
        twlConquestHudRevealRootOnly(pid);
        return true;
    }

    twlConquestHudRenderPlayerFrame(pid, player, snapshot);
    entry.lastSnapshot = snapshot;
    entry.mainUpdates = entry.mainUpdates + 1;
    entry.lastMainUpdateAtSeconds = Math.floor(now);
    return true;
}

function twlConquestHudPrimePlayerFrame(player: mod.Player): void {
    try {
        if (!player || !mod.IsPlayerValid(player)) return;
        const now = mod.GetMatchTimeElapsed();
        const didProcess = twlConquestHudProcessPlayerFrame(player, now);
        if (!didProcess) return;
        twlConquestHudScheduleState.lastMainTickAt = now;
    } catch {
        twlConquestHudFailSafeOff();
    }
}

function twlConquestHudTickFrame(force?: boolean): void {
    try {
        if (!CONQUEST_COMBAT_HUD_ENABLED) {
            twlConquestHudHideAllPlayers();
            return;
        }
        if (getConquestHudMode() !== "core") {
            twlConquestHudHideAllPlayers();
            return;
        }

        const now = mod.GetMatchTimeElapsed();
        if (!force && twlConquestHudScheduleState.lastMainTickAt >= 0) {
            const elapsed = now - twlConquestHudScheduleState.lastMainTickAt;
            if (elapsed < TWL_CONQUEST_HUD_MAIN_UPDATE_SECONDS) return;
        }
        twlConquestHudScheduleState.lastMainTickAt = now;

        const seenByPid: Record<number, boolean> = {};
        const players = mod.AllPlayers();
        const count = mod.CountOf(players);
        for (let i = 0; i < count; i++) {
            const player = mod.ValueInArray(players, i) as mod.Player;
            if (!player || !mod.IsPlayerValid(player)) continue;
            const pid = safeGetPlayerId(player);
            if (pid === undefined) continue;
            seenByPid[pid] = true;
            // Isolate per-player HUD faults so one bad player state cannot hide every HUD for one frame.
            try {
                twlConquestHudProcessPlayerFrame(player, now);
            } catch {
                twlConquestHudRecoverEntry(pid);
                continue;
            }
        }

        const stalePids: number[] = [];
        twlConquestHudForEachEntry((pid) => {
            if (seenByPid[pid] === true) return;
            stalePids.push(pid);
        });
        for (let i = 0; i < stalePids.length; i++) {
            twlConquestHudDestroyPlayer(stalePids[i]);
        }
    } catch {
        twlConquestHudFailSafeOff();
    }
}

function twlConquestHudTickAnimation(force?: boolean): void {
    try {
        if (getConquestHudMode() !== "core") return;
        const now = mod.GetMatchTimeElapsed();
        if (!force && twlConquestHudScheduleState.lastAnimationTickAt >= 0) {
            const elapsed = now - twlConquestHudScheduleState.lastAnimationTickAt;
            if (elapsed < TWL_CONQUEST_HUD_ANIMATION_UPDATE_SECONDS) return;
        }
        twlConquestHudScheduleState.lastAnimationTickAt = now;
        twlConquestHudForEachEntry((_, entry) => {
            entry.animationUpdates = entry.animationUpdates + 1;
            entry.lastAnimationUpdateAtSeconds = Math.floor(now);
        });
    } catch {
        twlConquestHudFailSafeOff();
    }
}

