// @ts-nocheck
// Module: index/player-kpi-events -- KPI event handler implementations for kills, assists, and capture attribution.
// Wired from exported event handlers in index.ts. Capture attribution is called from area-triggers.ts.

//#region -------------------- KPI Event Handlers --------------------

// Records a kill for the killer. Called from OnPlayerEarnedKill export.
// Self-kills (same killer and victim) are excluded — only enemy kills count.
function onPlayerEarnedKillImpl(
    eventPlayer: mod.Player,
    eventOtherPlayer: mod.Player,
    _eventDeathType: mod.DeathType,
    _eventWeaponUnlock: mod.WeaponUnlock
): void {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    if (!eventOtherPlayer || !mod.IsPlayerValid(eventOtherPlayer)) return;
    if (mod.Equals(eventPlayer, eventOtherPlayer)) return;
    const pid = safeGetPlayerId(eventPlayer);
    if (pid === undefined) return;
    kpiInitForPid(pid);
    kpiRecordKill(pid);
}

// Records an assist for the assisting player. Called from OnPlayerEarnedKillAssist export.
function onPlayerEarnedKillAssistImpl(
    eventPlayer: mod.Player,
    _eventOtherPlayer: mod.Player
): void {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    const pid = safeGetPlayerId(eventPlayer);
    if (pid === undefined) return;
    kpiInitForPid(pid);
    kpiRecordAssist(pid);
}

// Awards capture credit to all eligible players on the point at capture completion.
// Attribution rules (CF-45, CF-77): player must be alive and on the capturing team at cap tick.
// Uses mod.GetPlayersOnPoint snapshot at the moment OnCapturePointCaptured fires.
function onCapturePointCapturedKpiImpl(eventCapturePoint: mod.CapturePoint): void {
    if (!eventCapturePoint) return;
    try {
        const capturingTeamHandle = mod.GetCurrentOwnerTeam(eventCapturePoint);
        const capturingTeamNum = getTeamNumber(capturingTeamHandle);
        if (capturingTeamNum === 0) return;
        const playersOnPoint = mod.GetPlayersOnPoint(eventCapturePoint);
        const count = mod.CountOf(playersOnPoint);
        for (let i = 0; i < count; i++) {
            const player = mod.ValueInArray(playersOnPoint, i) as mod.Player;
            if (!player || !mod.IsPlayerValid(player)) continue;
            const pid = safeGetPlayerId(player);
            if (pid === undefined) continue;
            // CF-77: must be on the capturing team
            const playerTeamNum = safeGetTeamNumberFromPlayer(player, 0);
            if (playerTeamNum !== capturingTeamNum) continue;
            kpiInitForPid(pid);
            kpiRecordCapture(pid);
        }
    } catch {
    }
}

//#endregion -------------------- KPI Event Handlers --------------------
