// @ts-nocheck
// Module: index/capture-sound -- Phase 4 isolated capture-sound backbone and V1 capture-tick dispatch

function cleanupSoundRuntimeHandles(): void {
    conquestCaptureSafeUnspawnHandle(State.conquest.sound.captureTickFriendlyHandle);
    conquestCaptureSafeUnspawnHandle(State.conquest.sound.captureTickEnemyHandle);
    State.conquest.sound.captureTickFriendlyHandle = undefined;
    State.conquest.sound.captureTickEnemyHandle = undefined;
    State.conquest.sound.handlesReady = false;
}

function resetCaptureSoundQueueState(): void {
    State.conquest.sound.queue = [];
    State.conquest.sound.lastFlushAtSeconds = -1;
    State.conquest.sound.lastEventAtByThrottleKey = {};
}

// Clears queued/timing state for any not-live lifecycle transition without throwing away reusable runtime handles.
function captureSoundOnNotLiveReset(): void {
    resetCaptureSoundQueueState();
}

// Live start is the earliest moment a capture sound can be needed; prime handles and clear stale queue state here.
function captureSoundOnMatchLiveStart(): void {
    resetCaptureSoundQueueState();
    primeSoundRuntime();
}

function captureSoundOnPlayerLeaveOrResetPid(pid: number): void {
    if (!pid) return;
    State.conquest.sound.lastEventAtByThrottleKey = conquestCaptureFilterThrottleMapByPid(
        State.conquest.sound.lastEventAtByThrottleKey, pid
    );
}

function primeSoundRuntime(): void {
    if (!State.conquest.sound.enabled) return;
    const zero = VEC_ZERO;

    if (!conquestCaptureHasValidHandle(State.conquest.sound.captureTickFriendlyHandle)) {
        try {
            State.conquest.sound.captureTickFriendlyHandle = mod.SpawnObject(
                CONQUEST_CAPTURE_SOUND_FRIENDLY_PREFAB,
                zero,
                zero
            );
        } catch {
            State.conquest.sound.captureTickFriendlyHandle = undefined;
        }
    }

    if (!conquestCaptureHasValidHandle(State.conquest.sound.captureTickEnemyHandle)) {
        try {
            State.conquest.sound.captureTickEnemyHandle = mod.SpawnObject(
                CONQUEST_CAPTURE_SOUND_ENEMY_PREFAB,
                zero,
                zero
            );
        } catch {
            State.conquest.sound.captureTickEnemyHandle = undefined;
        }
    }

    State.conquest.sound.handlesReady = (
        conquestCaptureHasValidHandle(State.conquest.sound.captureTickFriendlyHandle)
        && conquestCaptureHasValidHandle(State.conquest.sound.captureTickEnemyHandle)
    );
}

function getCaptureSoundThrottleKey(event: ConquestQueuedSoundEvent): string {
    return `${event.eventKey}:${event.objId}:${event.sourceTeamId}`;
}

function getCaptureSoundRecipientThrottleKey(event: ConquestQueuedSoundEvent, pid: number): string {
    return `${event.eventKey}:${pid}:${event.objId}:${event.sourceTeamId}`;
}

function queueCaptureSoundEvent(event: ConquestQueuedSoundEvent): void {
    if (!State.conquest.sound.enabled) return;
    const throttleKey = getCaptureSoundThrottleKey(event);
    for (let i = 0; i < State.conquest.sound.queue.length; i++) {
        const queued = State.conquest.sound.queue[i];
        if (!queued) continue;
        if (getCaptureSoundThrottleKey(queued) !== throttleKey) continue;
        return;
    }
    State.conquest.sound.queue.push(event);
}

// Produces one logical capture-tick event when capture progress is actively moving.
function captureSoundOnCapturePointStateSample(
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
    queueCaptureSoundEvent({
        eventKey: "capture_tick",
        objId,
        sourceTeamId: nextOwnerProgressTeam,
        queuedAtSeconds,
    });
}

function getCaptureSoundRecipientsForEvent(
    event: ConquestQueuedSoundEvent,
    allPlayers?: any,
    allPlayerCount?: number
): mod.Player[] {
    const recipients: mod.Player[] = [];
    const players = allPlayers ?? mod.AllPlayers();
    const count = allPlayerCount ?? mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const player = mod.ValueInArray(players, i) as mod.Player;
        if (!isValidPlayer(player)) continue;
        const pid = safeGetPlayerId(player);
        if (pid === undefined || isPidDisconnected(pid)) continue;
        const engagedObjId = State.conquest.capture.engagedObjIdByPid[pid];
        if (!conquestShouldTreatPidAsActiveObjectiveOccupant(pid, engagedObjId)) continue;
        if (engagedObjId !== event.objId) continue;
        if (!shouldCountPlayerAsActiveOnPoint(player)) continue;
        const viewerTeam = safeGetTeamNumberFromPlayer(player, 0);
        if (viewerTeam !== TeamID.Team1 && viewerTeam !== TeamID.Team2) continue;

        recipients.push(player);
    }
    return recipients;
}

function getCaptureSoundHandleForRecipient(event: ConquestQueuedSoundEvent, recipient: mod.Player): any {
    if (event.eventKey !== "capture_tick") return undefined;
    const viewerTeam = safeGetTeamNumberFromPlayer(recipient, 0);
    const isFriendlyPerspective = viewerTeam === event.sourceTeamId;
    return isFriendlyPerspective
        ? State.conquest.sound.captureTickFriendlyHandle
        : State.conquest.sound.captureTickEnemyHandle;
}

// Flushes queued capture sounds on a fixed cadence and resolves recipients from current team truth.
function flushCaptureSoundQueue(): void {
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
    primeSoundRuntime();

    const queued = State.conquest.sound.queue.splice(0, State.conquest.sound.queue.length);
    const allPlayers = mod.AllPlayers();
    const allPlayerCount = mod.CountOf(allPlayers);

    for (let i = 0; i < queued.length; i++) {
        const event = queued[i];
        if (!event) {
            continue;
        }

        const recipients = getCaptureSoundRecipientsForEvent(event, allPlayers, allPlayerCount);
        if (recipients.length <= 0) {
            continue;
        }

        for (let r = 0; r < recipients.length; r++) {
            const recipient = recipients[r];
            if (!isValidPlayer(recipient)) continue;
            const recipientPid = safeGetPlayerId(recipient);
            if (recipientPid === undefined) continue;
            const throttleKey = getCaptureSoundRecipientThrottleKey(event, recipientPid);
            const lastEventAt = State.conquest.sound.lastEventAtByThrottleKey[throttleKey] ?? -999;
            if ((now - lastEventAt) < CONQUEST_CAPTURE_SOUND_MIN_COOLDOWN_SECONDS) {
                continue;
            }

            const handle = getCaptureSoundHandleForRecipient(event, recipient);
            if (!conquestCaptureHasValidHandle(handle)) {
                continue;
            }

            try {
                mod.PlaySound(handle, CONQUEST_CAPTURE_SOUND_AMPLITUDE, recipient);
            } catch {
                continue;
            }

            State.conquest.sound.lastEventAtByThrottleKey[throttleKey] = now;
        }

    }
}

