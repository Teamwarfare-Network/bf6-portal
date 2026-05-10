// @ts-nocheck
// Module: ui/conquest/hud-core/state -- runtime cache/scheduler state for hard-cut combat HUD

const twlConquestHudEntriesByPid: Record<number, TwlConquestHudPlayerEntry> = {};
const twlConquestHudBootstrapPurgeDoneByPid: Record<number, boolean> = {};

const twlConquestHudScheduleState = {
    lastMainTickAt: -1,
    lastAnimationTickAt: -1,
};

function twlConquestHudEnsureEntry(pid: number): TwlConquestHudPlayerEntry {
    let entry = twlConquestHudEntriesByPid[pid];
    if (!entry) {
        entry = {
            pid,
            initialized: false,
            widgets: {
                ticketBleedLeftChevronShadowRings: [],
                ticketBleedRightChevronShadowRings: [],
                ticketBleedLeftChevrons: [],
                ticketBleedRightChevrons: [],
                ticketBlueTeamNameShadowRing: [],
                ticketRedTeamNameShadowRing: [],
                objectiveSlotRoots: [],
                objectiveSlotBorders: [],
                objectiveSlotFills: [],
                objectiveSlotLabelShadowRings: [],
                objectiveSlotLabels: [],
                objectiveSlotPercentShadowRings: [],
                objectiveSlotPercents: [],
                popoutLabelShadowRing: [],
                popoutPercentShadowRing: [],
                engageFriendlyCountShadowRing: [],
                engageEnemyCountShadowRing: [],
                engageStatusShadowRing: [],
            },
            layoutFlagCount: 0,
            buildGeneration: 0,
            generationStamp: 0,
            mainUpdates: 0,
            animationUpdates: 0,
            lastMainUpdateAtSeconds: -1,
            lastAnimationUpdateAtSeconds: -1,
            pendingFirstReveal: true,
        };
        twlConquestHudEntriesByPid[pid] = entry;
    }
    return entry;
}

function twlConquestHudGetEntry(pid: number): TwlConquestHudPlayerEntry | undefined {
    return twlConquestHudEntriesByPid[pid];
}

function twlConquestHudRemoveEntry(pid: number): void {
    delete twlConquestHudEntriesByPid[pid];
}

function twlConquestHudForEachEntry(visitor: (pid: number, entry: TwlConquestHudPlayerEntry) => void): void {
    for (const pidKey in twlConquestHudEntriesByPid) {
        if (!Object.prototype.hasOwnProperty.call(twlConquestHudEntriesByPid, pidKey)) continue;
        const pid = Number(pidKey);
        const entry = twlConquestHudEntriesByPid[pid];
        if (!entry) continue;
        visitor(pid, entry);
    }
}

function twlConquestHudResetSchedulerState(): void {
    twlConquestHudScheduleState.lastMainTickAt = -1;
    twlConquestHudScheduleState.lastAnimationTickAt = -1;
}

function twlConquestHudHasBootstrapPurgeDone(pid: number): boolean {
    return twlConquestHudBootstrapPurgeDoneByPid[pid] === true;
}

function twlConquestHudMarkBootstrapPurgeDone(pid: number): void {
    twlConquestHudBootstrapPurgeDoneByPid[pid] = true;
}

function twlConquestHudResetBootstrapPurge(pid: number): void {
    delete twlConquestHudBootstrapPurgeDoneByPid[pid];
}

function twlConquestHudClearAllEntries(): void {
    const entryKeys = Object.keys(twlConquestHudEntriesByPid);
    for (let i = 0; i < entryKeys.length; i++) {
        delete twlConquestHudEntriesByPid[Number(entryKeys[i])];
    }
    const purgeKeys = Object.keys(twlConquestHudBootstrapPurgeDoneByPid);
    for (let i = 0; i < purgeKeys.length; i++) {
        delete twlConquestHudBootstrapPurgeDoneByPid[Number(purgeKeys[i])];
    }
    twlConquestHudResetSchedulerState();
}

