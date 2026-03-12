// @ts-nocheck
// Module: ui/conquest/hud-core/pipeline -- top-down runtime pipeline for hard-cut combat HUD

function twlConquestHudBootRuntime(): void {
    twlConquestHudDestroyAllPlayers();
    twlConquestHudResetSchedulerState();
}

function twlConquestHudRecoverEntry(pid: number): void {
    twlConquestHudDestroyPlayer(pid);
}

// Soft-fail HUD core runtime when any uncaught HUD exception occurs so gameplay loops keep running.
// Keep mode selection unchanged so core can recover on the next tick.
function twlConquestHudFailSafeOff(): void {
    twlConquestHudHideAllPlayers();
    twlConquestHudResetSchedulerState();
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
            // Bug 4 guard:
            // while swap-reset is pending, keep this player's core combat HUD fully hidden.
            // Deploy callback is the only owner that clears the pending gate/reveal.
            if (State.conquest.debug.teamSwapHudResetPendingByPid[pid] === true) {
                State.conquest.debug.engageHiddenUntilDeployByPid[pid] = true;
                delete State.conquest.capture.engagedObjIdByPid[pid];
                // Build/repair hidden graph while pending so post-deploy reveal can appear in one pass.
                // Do not repeatedly destroy every tick; that causes avoidable rebuild churn and delayed return.
                const pendingEntry = twlConquestHudEnsurePlayerGraph(player);
                if (pendingEntry && pendingEntry.initialized) {
                    twlConquestHudHidePlayer(pid);
                }
                continue;
            }
            // Isolate per-player HUD faults so one bad player state cannot hide every HUD for one frame.
            try {
                const expectedLayoutFlagCount = twlConquestHudGetLayoutFlagCount();
                const existingEntry = twlConquestHudGetEntry(pid);
                if (
                    existingEntry
                    && existingEntry.initialized
                    && existingEntry.layoutFlagCount !== expectedLayoutFlagCount
                ) {
                    twlConquestHudRecoverEntry(pid);
                }

                let entry = twlConquestHudEnsurePlayerGraph(player);
                if (!entry) continue;
                // Validation is advisory for runtime continuity:
                // if strict checks fail, attempt one recovery on cold entries, then fail-open render so combat HUD never disappears silently.
                let validationOk = twlConquestHudValidateCriticalRefs(entry);
                if (!validationOk && entry.mainUpdates <= 0) {
                    twlConquestHudRecoverEntry(pid);
                    entry = twlConquestHudEnsurePlayerGraph(player);
                    validationOk = !!entry && twlConquestHudValidateCriticalRefs(entry);
                }
                if (!entry || !entry.initialized) continue;

                const snapshot = twlConquestHudBuildSnapshotForPlayer(player);
                twlConquestHudRenderPlayerFrame(pid, player, snapshot);
                entry.lastSnapshot = snapshot;
                entry.mainUpdates = entry.mainUpdates + 1;
                entry.lastMainUpdateAtSeconds = Math.floor(now);
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
