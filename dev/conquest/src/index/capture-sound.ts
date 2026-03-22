// @ts-nocheck
// Module: index/capture-sound -- Phase 4 isolated capture-sound backbone and V1 capture-tick dispatch

function conquestPhase4HasValidHandle(handle: any): boolean {
    if (handle === undefined || handle === null) return false;
    if (typeof handle === "number") return handle > 0;
    return true;
}

function conquestPhase4SafeUnspawnSoundHandle(handle: any): void {
    if (!conquestPhase4HasValidHandle(handle)) return;
    try {
        mod.UnspawnObject(handle);
    } catch {}
}

function conquestPhase4CleanupSoundRuntimeHandles(): void {
    conquestPhase4SafeUnspawnSoundHandle(State.conquest.sound.captureTickFriendlyHandle);
    conquestPhase4SafeUnspawnSoundHandle(State.conquest.sound.captureTickEnemyHandle);
    State.conquest.sound.captureTickFriendlyHandle = undefined;
    State.conquest.sound.captureTickEnemyHandle = undefined;
    State.conquest.sound.handlesReady = false;
}

function conquestPhase4ResetQueueAndThrottleState(): void {
    State.conquest.sound.queue = [];
    State.conquest.sound.lastFlushAtSeconds = -1;
    State.conquest.sound.lastEventAtByThrottleKey = {};
    State.conquest.sound.debug.lastQueueDepth = 0;
    State.conquest.sound.debug.lastFlushQueuedCount = 0;
    State.conquest.sound.debug.lastFlushDispatchedCount = 0;
    State.conquest.sound.debug.lastFlushSuppressedCount = 0;
    State.conquest.sound.debug.lastFlushDroppedCount = 0;
    State.conquest.sound.debug.lastRecipientCount = 0;
}

// Clears queued/timing state for any not-live lifecycle transition without throwing away reusable runtime handles.
function conquestPhase4OnNotLiveReset(): void {
    conquestPhase4ResetQueueAndThrottleState();
}

// Live start is the earliest moment a capture sound can be needed; prime handles and clear stale queue state here.
function conquestPhase4OnMatchLiveStart(): void {
    conquestPhase4ResetQueueAndThrottleState();
    conquestPhase4PrimeSoundRuntime();
}

function conquestPhase4OnPlayerLeaveOrResetPid(pid: number): void {
    if (!pid) return;
    const nextThrottleMap: Record<string, number> = {};
    const needle = `:${pid}:`;
    for (const key in State.conquest.sound.lastEventAtByThrottleKey) {
        if (!key) continue;
        if (key.indexOf(needle) >= 0) continue;
        nextThrottleMap[key] = State.conquest.sound.lastEventAtByThrottleKey[key];
    }
    State.conquest.sound.lastEventAtByThrottleKey = nextThrottleMap;
    State.conquest.sound.debug.playerCleanupCount += 1;
    State.conquest.sound.debug.lastCleanupPid = pid;
}

function conquestPhase4PrimeSoundRuntime(): void {
    if (!State.conquest.sound.enabled) return;
    const zero = mod.CreateVector(0, 0, 0);

    if (!conquestPhase4HasValidHandle(State.conquest.sound.captureTickFriendlyHandle)) {
        try {
            State.conquest.sound.captureTickFriendlyHandle = mod.SpawnObject(
                CONQUEST_CAPTURE_SOUND_FRIENDLY_PREFAB,
                zero,
                zero
            );
        } catch {
            State.conquest.sound.captureTickFriendlyHandle = undefined;
            State.conquest.sound.debug.spawnFailureCount += 1;
        }
    }

    if (!conquestPhase4HasValidHandle(State.conquest.sound.captureTickEnemyHandle)) {
        try {
            State.conquest.sound.captureTickEnemyHandle = mod.SpawnObject(
                CONQUEST_CAPTURE_SOUND_ENEMY_PREFAB,
                zero,
                zero
            );
        } catch {
            State.conquest.sound.captureTickEnemyHandle = undefined;
            State.conquest.sound.debug.spawnFailureCount += 1;
        }
    }

    State.conquest.sound.handlesReady = (
        conquestPhase4HasValidHandle(State.conquest.sound.captureTickFriendlyHandle)
        && conquestPhase4HasValidHandle(State.conquest.sound.captureTickEnemyHandle)
    );
}

function conquestPhase4GetThrottleKey(event: ConquestQueuedSoundEvent): string {
    return `${event.eventKey}:${event.objId}:${event.sourceTeamId}`;
}

function conquestPhase4GetRecipientThrottleKey(event: ConquestQueuedSoundEvent, pid: number): string {
    return `${event.eventKey}:${pid}:${event.objId}:${event.sourceTeamId}`;
}

function conquestPhase4QueueEvent(event: ConquestQueuedSoundEvent): void {
    if (!State.conquest.sound.enabled) return;
    const throttleKey = conquestPhase4GetThrottleKey(event);
    for (let i = 0; i < State.conquest.sound.queue.length; i++) {
        const queued = State.conquest.sound.queue[i];
        if (!queued) continue;
        if (conquestPhase4GetThrottleKey(queued) !== throttleKey) continue;
        State.conquest.sound.debug.coalescedCount += 1;
        return;
    }
    State.conquest.sound.queue.push(event);
    State.conquest.sound.debug.queuedCount += 1;
    State.conquest.sound.debug.lastEventObjId = event.objId;
    State.conquest.sound.debug.lastEventSourceTeamId = event.sourceTeamId;
    State.conquest.sound.debug.lastEventQueuedAtSeconds = event.queuedAtSeconds;
    const nextQueueDepth = State.conquest.sound.queue.length;
    State.conquest.sound.debug.lastQueueDepth = nextQueueDepth;
    if (nextQueueDepth > State.conquest.sound.debug.maxQueueDepth) {
        State.conquest.sound.debug.maxQueueDepth = nextQueueDepth;
    }
}

// Produces one logical capture-tick event when capture progress is actively moving.
function conquestPhase4OnCapturePointStateSample(
    objId: number,
    prevOwnerProgressTeam: TeamID | 0,
    prevProgress01: number,
    nextOwnerProgressTeam: TeamID | 0,
    nextProgress01: number
): void {
    if (!State.conquest.sound.enabled || !isMatchLive()) return;
    if (nextOwnerProgressTeam !== TeamID.Team1 && nextOwnerProgressTeam !== TeamID.Team2) return;
    if (nextProgress01 <= 0 || nextProgress01 >= 1) return;

    const progressDelta = Math.abs(nextProgress01 - prevProgress01);
    const activeCaptureStarted = prevOwnerProgressTeam !== nextOwnerProgressTeam;
    const progressMovedEnough = progressDelta >= CONQUEST_CAPTURE_SOUND_PROGRESS_DELTA_MIN;
    if (!activeCaptureStarted && !progressMovedEnough) return;

    const queuedAtSeconds = mod.GetMatchTimeElapsed();
    conquestPhase4QueueEvent({
        eventKey: "capture_tick",
        objId,
        sourceTeamId: nextOwnerProgressTeam,
        queuedAtSeconds,
    });
}

function conquestPhase4GetRecipientsForEvent(event: ConquestQueuedSoundEvent): mod.Player[] {
    const recipients: mod.Player[] = [];
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const player = mod.ValueInArray(players, i) as mod.Player;
        if (!player || !mod.IsPlayerValid(player)) continue;
        const pid = safeGetPlayerId(player);
        if (pid === undefined || isPidDisconnected(pid)) continue;
        const engagedObjId = State.conquest.capture.engagedObjIdByPid[pid];
        if (!conquestShouldTreatPidAsActiveObjectiveOccupant(pid, engagedObjId)) continue;
        if (engagedObjId !== event.objId) continue;
        if (!conquestPhase2AShouldCountPlayerAsActiveOnPoint(player)) continue;
        const viewerTeam = safeGetTeamNumberFromPlayer(player, 0);
        if (viewerTeam !== TeamID.Team1 && viewerTeam !== TeamID.Team2) continue;

        recipients.push(player);
    }
    return recipients;
}

function conquestPhase4GetHandleForRecipient(event: ConquestQueuedSoundEvent, recipient: mod.Player): any {
    if (event.eventKey !== "capture_tick") return undefined;
    const viewerTeam = safeGetTeamNumberFromPlayer(recipient, 0);
    const isFriendlyPerspective = viewerTeam === event.sourceTeamId;
    return isFriendlyPerspective
        ? State.conquest.sound.captureTickFriendlyHandle
        : State.conquest.sound.captureTickEnemyHandle;
}

// Flushes queued capture sounds on a fixed cadence and resolves recipients from current team truth.
function conquestPhase4FlushCaptureSoundQueue(): void {
    if (!State.conquest.sound.enabled) return;
    if (!isMatchLive()) return;

    const now = mod.GetMatchTimeElapsed();
    if (
        State.conquest.sound.lastFlushAtSeconds >= 0
        && (now - State.conquest.sound.lastFlushAtSeconds) < CONQUEST_CAPTURE_SOUND_FLUSH_SECONDS
    ) {
        return;
    }
    State.conquest.sound.lastFlushAtSeconds = now;

    if (State.conquest.sound.queue.length <= 0) return;
    conquestPhase4PrimeSoundRuntime();

    const queued = State.conquest.sound.queue.splice(0, State.conquest.sound.queue.length);
    State.conquest.sound.debug.lastQueueDepth = queued.length;
    State.conquest.sound.debug.lastFlushQueuedCount = queued.length;
    State.conquest.sound.debug.lastFlushDispatchedCount = 0;
    State.conquest.sound.debug.lastFlushSuppressedCount = 0;
    State.conquest.sound.debug.lastFlushDroppedCount = 0;
    State.conquest.sound.debug.lastRecipientCount = 0;

    for (let i = 0; i < queued.length; i++) {
        const event = queued[i];
        if (!event) {
            State.conquest.sound.debug.droppedInvalidEventCount += 1;
            State.conquest.sound.debug.lastFlushDroppedCount += 1;
            continue;
        }

        const recipients = conquestPhase4GetRecipientsForEvent(event);
        if (recipients.length <= 0) {
            State.conquest.sound.debug.droppedNoRecipientCount += 1;
            State.conquest.sound.debug.lastFlushDroppedCount += 1;
            continue;
        }

        for (let r = 0; r < recipients.length; r++) {
            const recipient = recipients[r];
            if (!recipient || !mod.IsPlayerValid(recipient)) continue;
            const recipientPid = safeGetPlayerId(recipient);
            if (recipientPid === undefined) continue;
            const throttleKey = conquestPhase4GetRecipientThrottleKey(event, recipientPid);
            const lastEventAt = State.conquest.sound.lastEventAtByThrottleKey[throttleKey] ?? -999;
            if ((now - lastEventAt) < CONQUEST_CAPTURE_SOUND_MIN_COOLDOWN_SECONDS) {
                State.conquest.sound.debug.suppressedCount += 1;
                State.conquest.sound.debug.suppressedThrottleCount += 1;
                State.conquest.sound.debug.lastFlushSuppressedCount += 1;
                continue;
            }

            const handle = conquestPhase4GetHandleForRecipient(event, recipient);
            if (!conquestPhase4HasValidHandle(handle)) {
                State.conquest.sound.debug.droppedNoHandleCount += 1;
                State.conquest.sound.debug.lastFlushDroppedCount += 1;
                continue;
            }

            try {
                mod.PlaySound(handle, CONQUEST_CAPTURE_SOUND_AMPLITUDE, recipient);
            } catch {
                continue;
            }

            State.conquest.sound.lastEventAtByThrottleKey[throttleKey] = now;
            State.conquest.sound.debug.dispatchedCount += 1;
            const viewerTeam = safeGetTeamNumberFromPlayer(recipient, 0);
            if (viewerTeam === event.sourceTeamId) {
                State.conquest.sound.debug.dispatchedFriendlyCount += 1;
            } else {
                State.conquest.sound.debug.dispatchedEnemyCount += 1;
            }
            State.conquest.sound.debug.lastDispatchedAtSeconds = now;
            State.conquest.sound.debug.lastFlushDispatchedCount += 1;
            State.conquest.sound.debug.lastRecipientCount += 1;
        }

    }
}
