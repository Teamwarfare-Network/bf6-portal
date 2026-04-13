// @ts-nocheck
// Module: index/capture-vo -- Phase 4B isolated objective VO exploration path

function conquestPhase4BCleanupAllVoiceOverRuntimeHandles(): void {
    const runtimeHandles = State.conquest.vo.runtimeHandleByPid;
    for (const pidKey in runtimeHandles) {
        conquestCaptureSafeUnspawnHandle(runtimeHandles[pidKey]);
    }
    State.conquest.vo.runtimeHandleByPid = {};
    State.conquest.vo.handlesReadyByPid = {};
}

function conquestPhase4BEnsureObjectiveState(objId: number): ConquestObjectiveVoState {
    let state = State.conquest.vo.objectiveStateByObjId[objId];
    if (state) return state;
    state = {
        phase: "IDLE",
        activeTeamId: 0,
        lastAnnouncedOwnerTeam: 0,
        lastChangedAtSeconds: -1,
    };
    State.conquest.vo.objectiveStateByObjId[objId] = state;
    return state;
}

function conquestPhase4BClearNonTerminalThrottleForObjective(objId: number): void {
    const nextThrottleMap: Record<string, number> = {};
    const needle = `:${objId}`;
    for (const key in State.conquest.vo.lastEventAtByThrottleKey) {
        if (!key) continue;
        if (key.endsWith(needle)) continue;
        nextThrottleMap[key] = State.conquest.vo.lastEventAtByThrottleKey[key];
    }
    State.conquest.vo.lastEventAtByThrottleKey = nextThrottleMap;
}

function conquestPhase4BTransitionObjectiveState(
    objId: number,
    nextPhase: ConquestObjectiveVoState["phase"],
    nextActiveTeamId: TeamID | 0,
    nextAnnouncedOwnerTeam: TeamID | 0
): ConquestObjectiveVoState {
    const state = conquestPhase4BEnsureObjectiveState(objId);
    const changed = (
        state.phase !== nextPhase
        || state.activeTeamId !== nextActiveTeamId
        || state.lastAnnouncedOwnerTeam !== nextAnnouncedOwnerTeam
    );
    if (changed) {
        conquestPhase4BClearNonTerminalThrottleForObjective(objId);
    }
    state.phase = nextPhase;
    state.activeTeamId = nextActiveTeamId;
    state.lastAnnouncedOwnerTeam = nextAnnouncedOwnerTeam;
    state.lastChangedAtSeconds = mod.GetMatchTimeElapsed();
    return state;
}

function conquestPhase4BResetQueueAndThrottleState(): void {
    State.conquest.vo.queue = [];
    State.conquest.vo.lastFlushAtSeconds = -1;
    State.conquest.vo.lastEventAtByThrottleKey = {};
    State.conquest.vo.objectiveStateByObjId = {};
    State.conquest.vo.recentActiveObjIdByPid = {};
    State.conquest.vo.recentActiveAtSecondsByPid = {};
}

function conquestPhase4BOnNotLiveReset(): void {
    conquestPhase4BResetQueueAndThrottleState();
}

function conquestPhase4BOnMatchLiveStart(): void {
    conquestPhase4BResetQueueAndThrottleState();
}

function conquestPhase4BOnPlayerLeaveOrResetPid(pid: number): void {
    if (!pid) return;
    State.conquest.vo.lastEventAtByThrottleKey = conquestCaptureFilterThrottleMapByPid(
        State.conquest.vo.lastEventAtByThrottleKey, pid
    );
    conquestCaptureSafeUnspawnHandle(State.conquest.vo.runtimeHandleByPid[pid]);
    delete State.conquest.vo.runtimeHandleByPid[pid];
    delete State.conquest.vo.handlesReadyByPid[pid];
    delete State.conquest.vo.recentActiveObjIdByPid[pid];
    delete State.conquest.vo.recentActiveAtSecondsByPid[pid];
}

function conquestPhase4BEnsureVoiceOverRuntimeForPid(pid: number): any {
    if (!State.conquest.vo.enabled) return;
    const existing = State.conquest.vo.runtimeHandleByPid[pid];
    if (conquestCaptureHasValidHandle(existing)) {
        State.conquest.vo.handlesReadyByPid[pid] = true;
        return existing;
    }
    const zero = mod.CreateVector(0, 0, 0);
    try {
        State.conquest.vo.runtimeHandleByPid[pid] = mod.SpawnObject(
            CONQUEST_CAPTURE_VO_RUNTIME_PREFAB,
            zero,
            zero
        );
    } catch {
        State.conquest.vo.runtimeHandleByPid[pid] = undefined;
    }
    const nextHandle = State.conquest.vo.runtimeHandleByPid[pid];
    State.conquest.vo.handlesReadyByPid[pid] = conquestCaptureHasValidHandle(nextHandle);
    return nextHandle;
}

function conquestPhase4BQueueEvent(event: ConquestQueuedVoEvent): void {
    if (!State.conquest.vo.enabled) return;
    for (let i = 0; i < State.conquest.vo.queue.length; i++) {
        const queued = State.conquest.vo.queue[i];
        if (!queued) continue;
        if (queued.eventKey !== event.eventKey) continue;
        if (queued.objId !== event.objId) continue;
        if (queued.sourceTeamId !== event.sourceTeamId) continue;
        return;
    }
    State.conquest.vo.queue.push(event);
}

function conquestPhase4BResolveVoiceOverFlagForObjective(objId: number): any {
    const label = `${State.conquest.capture.byObjId[objId]?.label ?? ""}`.trim().toUpperCase();
    const leading = label.length > 0 ? label.charAt(0) : "";
    switch (leading) {
        case "A": return mod.VoiceOverFlags.Alpha;
        case "B": return mod.VoiceOverFlags.Bravo;
        case "C": return mod.VoiceOverFlags.Charlie;
        case "D": return mod.VoiceOverFlags.Delta;
        case "E": return mod.VoiceOverFlags.Echo;
        case "F": return mod.VoiceOverFlags.Foxtrot;
        case "G": return mod.VoiceOverFlags.Golf;
        default: return undefined;
    }
}

function conquestPhase4BResolveVoiceOverEventForRecipient(event: ConquestQueuedVoEvent, recipient: mod.Player): any {
    switch (event.eventKey) {
        case "objective_capturing":
            return mod.VoiceOverEvents2D.ObjectiveCapturing;
        case "objective_contested":
            return mod.VoiceOverEvents2D.ObjectiveContested;
        case "objective_neutralised":
            return mod.VoiceOverEvents2D.ObjectiveNeutralised;
        case "objective_captured": {
            const viewerTeam = safeGetTeamNumberFromPlayer(recipient, 0);
            return viewerTeam === event.sourceTeamId
                ? mod.VoiceOverEvents2D.ObjectiveCaptured
                : CONQUEST_CAPTURE_VO_ENEMY_TERMINAL_MODE === "captured_enemy"
                    ? mod.VoiceOverEvents2D.ObjectiveCapturedEnemy
                    : mod.VoiceOverEvents2D.ObjectiveLost;
        }
        default:
            return undefined;
    }
}

function conquestPhase4BMarkRecentObjectivePresence(pid: number, objId: number, atSeconds: number): void {
    if (!pid || !objId) return;
    State.conquest.vo.recentActiveObjIdByPid[pid] = objId;
    State.conquest.vo.recentActiveAtSecondsByPid[pid] = atSeconds;
}

function conquestPhase4BRefreshRecentPresence(now: number): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const player = mod.ValueInArray(players, i) as mod.Player;
        if (!player || !mod.IsPlayerValid(player)) continue;
        const pid = safeGetPlayerId(player);
        if (pid === undefined || isPidDisconnected(pid)) continue;
        const engagedObjId = State.conquest.capture.engagedObjIdByPid[pid];
        if (!conquestShouldTreatPidAsActiveObjectiveOccupant(pid, engagedObjId)) continue;
        if (!conquestPhase2AShouldCountPlayerAsActiveOnPoint(player)) continue;
        conquestPhase4BMarkRecentObjectivePresence(pid, engagedObjId, now);
    }
}

function conquestPhase4BWasRecentlyActiveOnObjective(pid: number, objId: number, now: number): boolean {
    if (!pid || !objId) return false;
    if ((State.conquest.vo.recentActiveObjIdByPid[pid] ?? 0) !== objId) return false;
    const lastSeenAt = State.conquest.vo.recentActiveAtSecondsByPid[pid] ?? -999;
    return (now - lastSeenAt) <= CONQUEST_CAPTURE_VO_TERMINAL_RECENT_SECONDS;
}

function conquestPhase4BGetRecipientsForEvent(event: ConquestQueuedVoEvent, now: number): mod.Player[] {
    const recipients: mod.Player[] = [];
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const player = mod.ValueInArray(players, i) as mod.Player;
        if (!player || !mod.IsPlayerValid(player)) continue;
        const pid = safeGetPlayerId(player);
        if (pid === undefined || isPidDisconnected(pid)) continue;
        const engagedObjId = State.conquest.capture.engagedObjIdByPid[pid];
        const currentlyActiveOnEventObjective = (
            conquestShouldTreatPidAsActiveObjectiveOccupant(pid, engagedObjId)
            && engagedObjId === event.objId
            && conquestPhase2AShouldCountPlayerAsActiveOnPoint(player)
        );
        if (currentlyActiveOnEventObjective) {
            conquestPhase4BMarkRecentObjectivePresence(pid, event.objId, now);
            recipients.push(player);
            continue;
        }
        if (!event.terminal) continue;
        if (!conquestPhase4BWasRecentlyActiveOnObjective(pid, event.objId, now)) continue;
        recipients.push(player);
    }
    return recipients;
}

function conquestPhase4BGetRecipientThrottleKey(event: ConquestQueuedVoEvent, pid: number): string {
    return `${event.eventKey}:${pid}:${event.objId}`;
}

// Produces non-terminal objective VO only on state-entry edges so rising progress never replays continuously.
function conquestPhase4BOnCapturePointStateSample(
    objId: number,
    nextOwnerProgressTeam: TeamID | 0,
    nextProgress01: number,
    nextOnPointTeam1: number,
    nextOnPointTeam2: number
): void {
    if (!State.conquest.vo.enabled || !isMatchLive()) return;
    const totalOnPoint = nextOnPointTeam1 + nextOnPointTeam2;
    const contested = (
        CONQUEST_CAPTURE_VO_CONTESTED_ENABLED
        && nextOnPointTeam1 > 0
        && nextOnPointTeam2 > 0
        && nextProgress01 > 0
        && nextProgress01 < 1
    );
    const activeCaptureTeam = (
        totalOnPoint > 0
        && nextProgress01 > 0
        && nextProgress01 < 1
        && (nextOwnerProgressTeam === TeamID.Team1 || nextOwnerProgressTeam === TeamID.Team2)
    ) ? nextOwnerProgressTeam : 0;

    const state = conquestPhase4BEnsureObjectiveState(objId);
    const nextPhase = contested ? "CONTESTED" : activeCaptureTeam !== 0 ? "CAPTURING" : "IDLE";
    if (nextPhase === "CONTESTED" && state.phase !== "CONTESTED") {
        conquestPhase4BQueueEvent({
            eventKey: "objective_contested",
            objId,
            sourceTeamId: activeCaptureTeam,
            queuedAtSeconds: mod.GetMatchTimeElapsed(),
            terminal: false,
        });
    } else if (
        nextPhase === "CAPTURING"
        && (state.phase !== "CAPTURING" || state.activeTeamId !== activeCaptureTeam)
    ) {
        conquestPhase4BQueueEvent({
            eventKey: "objective_capturing",
            objId,
            sourceTeamId: activeCaptureTeam,
            queuedAtSeconds: mod.GetMatchTimeElapsed(),
            terminal: false,
        });
    }
    conquestPhase4BTransitionObjectiveState(objId, nextPhase, activeCaptureTeam, state.lastAnnouncedOwnerTeam);
}

function conquestPhase4BOnCapturePointLostEdge(
    objId: number,
    previousOwnerTeam: TeamID | 0,
    progressTeam: TeamID | 0
): void {
    if (!State.conquest.vo.enabled || !isMatchLive()) return;
    const sourceTeamId = (
        progressTeam === TeamID.Team1 || progressTeam === TeamID.Team2
    ) ? progressTeam : previousOwnerTeam;
    if (sourceTeamId !== TeamID.Team1 && sourceTeamId !== TeamID.Team2 && previousOwnerTeam === 0) return;
    const state = conquestPhase4BEnsureObjectiveState(objId);
    if (state.phase === "NEUTRALISED" && state.activeTeamId === sourceTeamId && state.lastAnnouncedOwnerTeam === 0) {
        return;
    }
    conquestPhase4BQueueEvent({
        eventKey: "objective_neutralised",
        objId,
        sourceTeamId,
        queuedAtSeconds: mod.GetMatchTimeElapsed(),
        terminal: true,
    });
    conquestPhase4BTransitionObjectiveState(objId, "NEUTRALISED", sourceTeamId, 0);
}

function conquestPhase4BOnCapturePointCapturedEdge(objId: number, ownerTeam: TeamID | 0): void {
    if (!State.conquest.vo.enabled || !isMatchLive()) return;
    if (ownerTeam !== TeamID.Team1 && ownerTeam !== TeamID.Team2) return;
    const state = conquestPhase4BEnsureObjectiveState(objId);
    if (state.phase === "CAPTURED" && state.lastAnnouncedOwnerTeam === ownerTeam) {
        return;
    }
    conquestPhase4BQueueEvent({
        eventKey: "objective_captured",
        objId,
        sourceTeamId: ownerTeam,
        queuedAtSeconds: mod.GetMatchTimeElapsed(),
        terminal: true,
    });
    conquestPhase4BTransitionObjectiveState(objId, "CAPTURED", ownerTeam, ownerTeam);
}

// Flushes queued VO events with player-local dispatch and recipient-local cooldown for non-terminal lines only.
function conquestPhase4BFlushCaptureVoiceOverQueue(): void {
    if (!State.conquest.vo.enabled) return;
    if (!isMatchLive()) return;

    const now = mod.GetMatchTimeElapsed();
    if (
        State.conquest.vo.lastFlushAtSeconds >= 0
        && (now - State.conquest.vo.lastFlushAtSeconds) < CONQUEST_CAPTURE_VO_FLUSH_SECONDS
    ) {
        return;
    }
    State.conquest.vo.lastFlushAtSeconds = now;

    if (State.conquest.vo.queue.length <= 0) return;
    conquestPhase4BRefreshRecentPresence(now);

    const queued = State.conquest.vo.queue.splice(0, State.conquest.vo.queue.length);

    for (let i = 0; i < queued.length; i++) {
        const event = queued[i];
        if (!event) {
            continue;
        }

        const flag = conquestPhase4BResolveVoiceOverFlagForObjective(event.objId);
        if (flag === undefined) {
            continue;
        }

        const recipients = conquestPhase4BGetRecipientsForEvent(event, now);
        if (recipients.length <= 0) {
            continue;
        }

        for (let r = 0; r < recipients.length; r++) {
            const recipient = recipients[r];
            if (!recipient || !mod.IsPlayerValid(recipient)) continue;
            const recipientPid = safeGetPlayerId(recipient);
            if (recipientPid === undefined) continue;
            if (!event.terminal) {
                const throttleKey = conquestPhase4BGetRecipientThrottleKey(event, recipientPid);
                const lastEventAt = State.conquest.vo.lastEventAtByThrottleKey[throttleKey] ?? -999;
                if ((now - lastEventAt) < CONQUEST_CAPTURE_VO_MIN_COOLDOWN_SECONDS) {
                    continue;
                }
                State.conquest.vo.lastEventAtByThrottleKey[throttleKey] = now;
            }

            const voEvent = conquestPhase4BResolveVoiceOverEventForRecipient(event, recipient);
            if (voEvent === undefined) {
                continue;
            }

            const runtimeHandle = conquestPhase4BEnsureVoiceOverRuntimeForPid(recipientPid);
            if (!conquestCaptureHasValidHandle(runtimeHandle)) {
                continue;
            }

            try {
                mod.PlayVO(runtimeHandle, voEvent, flag, recipient);
            } catch {
                continue;
            }

        }
    }
}

