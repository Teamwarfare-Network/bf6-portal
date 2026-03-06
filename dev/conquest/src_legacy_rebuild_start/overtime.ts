// @ts-nocheck
// Conquest cut: overtime/tie-breaker logic is intentionally disabled.
const OVERTIME_MODE_ENABLED = false;

function isOvertimeModeEnabled(): boolean {
    return OVERTIME_MODE_ENABLED;
}
// Module: overtime — Overtime flag capture system (zones, markers, capture loop, HUD, stages)

//#region -------------------- Overtime Flag Capture - Zone Config + Preview Icon --------------------

// High-level flow:
// - Map config provides candidate zones (AreaTrigger ObjId + Sector Id + WorldIcon ObjId + CapturePoint ObjId).
// - At half-time remaining, pick one random zone and make it visible (locked).
// - At 1:00 remaining, activate capture, start the tick loop, and show HUD.
// - Full capture ends the round immediately; at clock expiry, progress decides unless neutral (0.5).
// Progress model:
// - progress in [0..1]: 0 = Team2 owns, 1 = Team1 owns, 0.5 = neutral start.
// - counts are unique vehicles in zone (not player count).
// - player membership is tracked to drive UI + vehicle seat reconciliation.

function normalizeOvertimeZoneLetter(letter: string): string {
    return letter.trim().toUpperCase();
}

function getOvertimeZoneIndexForLetter(letter: string): number {
    const normalized = normalizeOvertimeZoneLetter(letter);
    return OVERTIME_FLAG_LETTERS.indexOf(normalized);
}

function getOvertimeZoneLettersForGameMode(gameModeKey: number): string[] | undefined {
    const mapping = ACTIVE_MAP_CONFIG.overtimeZoneLettersByMode;
    if (!mapping) return undefined;
    if (isHeliGameMode(gameModeKey)) {
        return (mapping.helis && mapping.helis.length > 0) ? mapping.helis : mapping.tanks;
    }
    return (mapping.tanks && mapping.tanks.length > 0) ? mapping.tanks : mapping.helis;
}

function getConfirmedGameModeKey(): number {
    return State.round.modeConfig.confirmed.gameMode ?? State.round.modeConfig.gameMode;
}

function buildOvertimeZoneCandidatesForGameMode(gameModeKey: number): OvertimeZoneCandidate[] {
    const zones = ACTIVE_OVERTIME_ZONES;
    if (!zones || zones.length === 0) return [];
    const letters = getOvertimeZoneLettersForGameMode(gameModeKey);
    if (!letters || letters.length === 0) {
        return zones.map((zone, index) => ({
            areaTriggerObjId: zone.areaTriggerObjId,
            sectorId: zone.sectorId,
            worldIconObjId: zone.worldIconObjId,
            capturePointObjId: zone.capturePointObjId,
            letterIndex: index,
        }));
    }
    const candidates: OvertimeZoneCandidate[] = [];
    for (const letter of letters) {
        const index = getOvertimeZoneIndexForLetter(letter);
        if (index < 0 || index >= zones.length) continue;
        const zone = zones[index];
        candidates.push({
            areaTriggerObjId: zone.areaTriggerObjId,
            sectorId: zone.sectorId,
            worldIconObjId: zone.worldIconObjId,
            capturePointObjId: zone.capturePointObjId,
            letterIndex: index,
        });
    }
    return candidates;
}

function isHelisOvertimeSingleZoneMode(): boolean {
    const gameModeKey = getConfirmedGameModeKey();
    if (!isHeliGameMode(gameModeKey)) return false;
    const letters = getOvertimeZoneLettersForGameMode(gameModeKey);
    if (!letters || letters.length !== 1) return false;
    return normalizeOvertimeZoneLetter(letters[0]) === "H";
}

function refreshOvertimeZonesFromMapConfig(): void {
    // Sync per-map zone list into state; zone order defines A/B/C... letters.
    if (isOvertimeModeEnabled()) {
        hideAllOvertimeZoneMarkers();
    }
    const gameModeKey = getConfirmedGameModeKey();
    State.flag.candidateZones = buildOvertimeZoneCandidatesForGameMode(gameModeKey);
    State.flag.configValid = validateOvertimeZoneSpecs(State.flag.candidateZones);
    setOvertimeSectorsForSelected(undefined);
    setOvertimeCapturePointsForSelected(undefined);
    configureOvertimeCapturePointTimes();
    if (!isOvertimeModeEnabled()) {
        setOvertimeAllFlagVisibility(true);
    }
}

function validateOvertimeZoneSpecs(zones: OvertimeZoneSpec[]): boolean {
    // Reject empty lists or duplicate ids to avoid randomization ambiguity.
    if (!zones || zones.length === 0) return false;
    const seenTriggers: Record<number, boolean> = {};
    const seenSectors: Record<number, boolean> = {};
    const seenWorldIcons: Record<number, boolean> = {};
    const seenCapturePoints: Record<number, boolean> = {};
    for (let i = 0; i < zones.length; i++) {
        const triggerId = Math.floor(zones[i].areaTriggerObjId);
        const sectorId = Math.floor(zones[i].sectorId);
        const worldIconId = Math.floor(zones[i].worldIconObjId);
        const capturePointId = Math.floor(zones[i].capturePointObjId);
        if (!Number.isFinite(triggerId) || !Number.isFinite(sectorId) || !Number.isFinite(worldIconId) || !Number.isFinite(capturePointId)) return false;
        if (seenTriggers[triggerId] || seenSectors[sectorId] || seenWorldIcons[worldIconId] || seenCapturePoints[capturePointId]) return false;
        seenTriggers[triggerId] = true;
        seenSectors[sectorId] = true;
        seenWorldIcons[worldIconId] = true;
        seenCapturePoints[capturePointId] = true;
    }
    return true;
}

function buildPortalNumberArray(values: number[]): any {
    // mod.RandomValueInArray requires a Portal array, not a JS number[].
    let arr = mod.EmptyArray();
    for (let i = 0; i < values.length; i++) {
        arr = mod.AppendToArray(arr, values[i]);
    }
    return arr;
}

function getOvertimeFlagLetterKeyForIndex(index: number): number {
    if (index < 0 || index >= STR_FLAG_LETTER_KEYS.length) return STR_FLAG_LETTER_UNKNOWN;
    return STR_FLAG_LETTER_KEYS[index];
}

function getOvertimeFlagLetterIndexForCandidate(candidateIndex: number | undefined): number | undefined {
    if (candidateIndex === undefined) return undefined;
    const zone = State.flag.candidateZones[candidateIndex];
    if (!zone) return undefined;
    const letterIndex = (zone as OvertimeZoneCandidate).letterIndex;
    if (letterIndex === undefined || !Number.isFinite(letterIndex)) return candidateIndex;
    return Math.floor(letterIndex);
}

function getOvertimeFlagLetterKeyForCandidateIndex(candidateIndex: number | undefined): number {
    const letterIndex = getOvertimeFlagLetterIndexForCandidate(candidateIndex);
    if (letterIndex === undefined) return STR_FLAG_LETTER_UNKNOWN;
    return getOvertimeFlagLetterKeyForIndex(letterIndex);
}

function getActiveOvertimeFlagLetterKey(): number {
    if (State.flag.selectedZoneLetterKey !== undefined) return State.flag.selectedZoneLetterKey;
    if (State.flag.activeCandidateIndex === undefined) return STR_FLAG_LETTER_UNKNOWN;
    return getOvertimeFlagLetterKeyForCandidateIndex(State.flag.activeCandidateIndex);
}

function getOvertimeFlagLetterTextForIndex(index: number | undefined): string {
    if (index === undefined || index < 0 || index >= STR_FLAG_LETTER_KEYS.length) return "?";
    return String.fromCharCode(65 + index);
}

function getOvertimeFlagLetterTextForCandidateIndex(candidateIndex: number | undefined): string {
    const letterIndex = getOvertimeFlagLetterIndexForCandidate(candidateIndex);
    if (letterIndex === undefined || letterIndex < 0 || letterIndex >= STR_FLAG_LETTER_KEYS.length) return "?";
    return String.fromCharCode(65 + letterIndex);
}

function getActiveOvertimeFlagLetterText(): string {
    if (State.flag.activeCandidateIndex === undefined) return "?";
    return getOvertimeFlagLetterTextForCandidateIndex(State.flag.activeCandidateIndex);
}

function hideOvertimeFlagPreviewIcon(): void {
    const zones = State.flag.candidateZones;
    if (!zones || zones.length === 0) return;
    // Disable all overtime world icons so only the active zone can be shown.
    for (let i = 0; i < zones.length; i++) {
        try {
            const icon = mod.GetWorldIcon(zones[i].worldIconObjId);
            if (!icon) continue;
            mod.EnableWorldIconImage(icon, false);
            mod.EnableWorldIconText(icon, false);
        } catch {
            continue;
        }
    }
}

// TODO(1.0): Unused; remove before final 1.0 release.
function getActiveOvertimeAreaTrigger(): mod.AreaTrigger | undefined {
    if (State.flag.activeAreaTrigger) return State.flag.activeAreaTrigger;
    if (State.flag.activeAreaTriggerId === undefined) return undefined;
    const trigger = mod.GetAreaTrigger(State.flag.activeAreaTriggerId);
    State.flag.activeAreaTrigger = trigger;
    return trigger;
}

function getActiveOvertimeWorldIcon(): mod.WorldIcon | undefined {
    if (State.flag.activeWorldIcon) return State.flag.activeWorldIcon;
    if (State.flag.activeWorldIconId === undefined) return undefined;
    const icon = mod.GetWorldIcon(State.flag.activeWorldIconId);
    State.flag.activeWorldIcon = icon;
    return icon;
}

function showOvertimeFlagPreviewIcon(isLocked: boolean): void {
    const icon = getActiveOvertimeWorldIcon();
    if (!icon) return;

    // Locked preview uses the selected zone letter for clarity.
    const letterKey = getActiveOvertimeFlagLetterKey();
    const labelKey = isLocked ? STR_FLAG_TITLE_LOCKED_FORMAT : STR_FLAG_PREVIEW_ACTIVE;

    // Ensure only the selected zone icon is visible.
    hideOvertimeFlagPreviewIcon();

    // WorldIcon objects are positioned in the spatial data; we only toggle visibility + text.
    try {
        mod.SetWorldIconImage(icon, mod.WorldIconImages.Flag);
        mod.SetWorldIconColor(icon, OVERTIME_FLAG_ICON_COLOR);
        // NOTE: Locked preview uses the same title format as the HUD for consistency.
        const labelMessage = isLocked
            ? mod.Message(labelKey, letterKey, getOvertimeUnlockSeconds())
            : mod.Message(labelKey);
        mod.SetWorldIconText(icon, labelMessage);
        mod.EnableWorldIconImage(icon, true);
        mod.EnableWorldIconText(icon, true);
    } catch {
        return;
    }
}

//#endregion -------------------- Overtime Flag Capture - Zone Config + Preview Icon --------------------



//#region -------------------- Overtime Flag Capture - Marker Visibility + Suppression --------------------

function getOvertimeCapturePointIds(): number[] {
    const zones = State.flag.candidateZones;
    if (!zones || zones.length === 0) return [];
    const ids: number[] = [];
    for (let i = 0; i < zones.length; i++) {
        ids.push(zones[i].capturePointObjId);
    }
    return ids;
}

function getAllOvertimeCapturePointIds(): number[] {
    const zones = ACTIVE_OVERTIME_ZONES;
    if (!zones || zones.length === 0) return [];
    const ids: number[] = [];
    for (let i = 0; i < zones.length; i++) {
        ids.push(zones[i].capturePointObjId);
    }
    return ids;
}

function setOvertimeCapturePointsForAllHidden(): void {
    const ids = getAllOvertimeCapturePointIds();
    if (ids.length === 0) return;
    for (let i = 0; i < ids.length; i++) {
        setOvertimeCapturePointMarkerVisible(ids[i], false);
    }
}

function applyOvertimeCapturePointSuppression(cp: mod.CapturePoint): void {
    // Keep CapturePoints marker-only: no ownership change, no deploy, no progress.
    mod.SetCapturePointCapturingTime(cp, OVERTIME_CAPTURE_TIME_DISABLE_SECONDS);
    mod.SetCapturePointNeutralizationTime(cp, OVERTIME_NEUTRALIZE_TIME_DISABLE_SECONDS);
    mod.SetMaxCaptureMultiplier(cp, OVERTIME_ENGINE_CAPTURE_MAX_MULTIPLIER);
    mod.EnableCapturePointDeploying(cp, false);
}

function setOvertimeCapturePointOwner(cp: mod.CapturePoint, teamId: TeamID | 0): void {
    mod.SetCapturePointOwner(cp, mod.GetTeam(teamId));
}

function hardResetOvertimeCapturePoints(ids: number[]): void {
    // Force-clear engine CP state so no progress persists across rounds.
    if (ids.length > 0) {
        logCapturePointVisibilityDebug(STR_DEBUG_CP_VIS_HARD_RESET);
    }
    for (let i = 0; i < ids.length; i++) {
        try {
            const cp = mod.GetCapturePoint(ids[i]);
            if (!cp) continue;
            const spatial = mod.GetSpatialObject(ids[i]);
            if (!spatial) continue;
            mod.EnableGameModeObjective(cp, true);
            applyOvertimeCapturePointSuppression(cp);
            setOvertimeCapturePointOwner(cp, 0);
            mod.EnableGameModeObjective(cp, false);
            mod.EnableSpatialObject(spatial, false);
        } catch {
            continue;
        }
    }
}

function configureOvertimeCapturePointTimes(): void {
    // Re-apply suppression for every candidate so engine capture never advances.
    const ids = getOvertimeCapturePointIds();
    if (ids.length === 0) return;
    for (let i = 0; i < ids.length; i++) {
        try {
            const cp = mod.GetCapturePoint(ids[i]);
            if (!cp) continue;
            applyOvertimeCapturePointSuppression(cp);
            setOvertimeCapturePointOwner(cp, 0);
        } catch {
            continue;
        }
    }
}

function setOvertimeCapturePointMarkerVisible(capturePointObjId: number, visible: boolean): void {
    try {
        const cp = mod.GetCapturePoint(capturePointObjId);
        if (!cp) return;
        const spatial = mod.GetSpatialObject(capturePointObjId);
        if (!spatial) return;
        // Apply CP state before the final enable/disable; setters can re-register the objective.
        applyOvertimeCapturePointSuppression(cp);
        setOvertimeCapturePointOwner(cp, 0);
        // Toggle both objective visibility and the spatial object using the correct runtime handle.
        mod.EnableGameModeObjective(cp, visible);
        mod.EnableSpatialObject(spatial, visible);
    } catch {
        return;
    }
}

function setOvertimeCapturePointsForSelected(selectedId?: number): void {
    // Enable only the selected CapturePoint for minimap/world marker display.
    const ids = getOvertimeCapturePointIds();
    if (ids.length === 0) return;
    for (let i = 0; i < ids.length; i++) {
        const enable = selectedId !== undefined && ids[i] === selectedId;
        setOvertimeCapturePointMarkerVisible(ids[i], enable);
    }
}

function setOvertimeCapturePointsForAllVisible(): void {
    const ids = getOvertimeCapturePointIds();
    if (ids.length === 0) return;
    for (let i = 0; i < ids.length; i++) {
        setOvertimeCapturePointMarkerVisible(ids[i], true);
    }
}

function setOvertimeSectorsForAllVisible(): void {
    const zones = State.flag.candidateZones;
    if (!zones || zones.length === 0) return;
    for (let i = 0; i < zones.length; i++) {
        try {
            const sector = mod.GetSector(zones[i].sectorId);
            if (!sector) continue;
            mod.EnableGameModeObjective(sector, true);
        } catch {
            continue;
        }
    }
}

function setOvertimeSectorsForAllHidden(): void {
    const zones = ACTIVE_OVERTIME_ZONES;
    if (!zones || zones.length === 0) return;
    for (let i = 0; i < zones.length; i++) {
        try {
            const sector = mod.GetSector(zones[i].sectorId);
            if (!sector) continue;
            mod.EnableGameModeObjective(sector, false);
        } catch {
            continue;
        }
    }
}

function hideAllOvertimeZoneMarkers(): void {
    setOvertimeSectorsForAllHidden();
    setOvertimeCapturePointsForAllHidden();
}

function setOvertimeAllFlagVisibility(visible: boolean): void {
    if (!isOvertimeModeEnabled()) {
        setOvertimeSectorsForAllVisible();
        setOvertimeCapturePointsForAllVisible();
        return;
    }
    if (visible) {
        setOvertimeSectorsForAllVisible();
        setOvertimeCapturePointsForAllVisible();
        return;
    }
    hideAllOvertimeZoneMarkers();
}

function getActiveOvertimeCapturePoint(): mod.CapturePoint | undefined {
    if (State.flag.activeCapturePoint) return State.flag.activeCapturePoint;
    if (State.flag.activeCapturePointId === undefined) return undefined;
    const cp = mod.GetCapturePoint(State.flag.activeCapturePointId);
    State.flag.activeCapturePoint = cp;
    return cp;
}

function isActiveOvertimeCapturePoint(cp: mod.CapturePoint): boolean {
    const active = getActiveOvertimeCapturePoint();
    if (!active) return false;
    return mod.Equals(cp, active);
}

function setOvertimeSectorsForSelected(selectedId?: number): void {
    // Sector objectives drive the minimap radius without enabling capture logic.
    const zones = State.flag.candidateZones;
    if (!zones || zones.length === 0) return;
    for (let i = 0; i < zones.length; i++) {
        try {
            const sector = mod.GetSector(zones[i].sectorId);
            if (!sector) continue;
            const enable = selectedId !== undefined && zones[i].sectorId === selectedId;
            mod.EnableGameModeObjective(sector, enable);
        } catch {
            continue;
        }
    }
}

//#endregion -------------------- Overtime Flag Capture - Marker Visibility + Suppression --------------------



//#region -------------------- Admin Panel - Tie-Breaker + Live Respawn + Round Length Helpers --------------------

function normalizeTieBreakerModeIndex(index: number): number {
    const count = ADMIN_TIEBREAKER_MODE_OPTIONS.length;
    if (count <= 0) return 0;
    const normalized = ((Math.floor(index) % count) + count) % count;
    return normalized;
}

function getTieBreakerModeLabelKey(): number {
    const index = normalizeTieBreakerModeIndex(State.admin.tieBreakerModeIndex);
    return ADMIN_TIEBREAKER_MODE_OPTIONS[index];
}

function getTieBreakerModeActionKey(index: number): number {
    const normalized = normalizeTieBreakerModeIndex(index);
    return ADMIN_TIEBREAKER_MODE_ACTION_KEYS[normalized];
}

function syncAdminTieBreakerModeLabelForAllPlayers(): void {
    const labelKey = getTieBreakerModeLabelKey();
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const player = mod.ValueInArray(players, i) as mod.Player;
        if (!player || !mod.IsPlayerValid(player)) continue;
        const pid = safeGetPlayerId(player);
        if (pid === undefined || isPidDisconnected(pid)) continue;
        const label = safeFind(UI_ADMIN_TIEBREAKER_MODE_LABEL_ID + pid);
        if (!label) continue;
        safeSetUITextLabel(label, mod.Message(labelKey));
    }
}

function getAdminLiveRespawnLabelKey(): number {
    return State.admin.liveRespawnEnabled
        ? mod.stringkeys.twl.adminPanel.labels.liveRespawnOn
        : mod.stringkeys.twl.adminPanel.labels.liveRespawnOff;
}

function syncAdminLiveRespawnLabelForAllPlayers(): void {
    const labelKey = getAdminLiveRespawnLabelKey();
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const player = mod.ValueInArray(players, i) as mod.Player;
        if (!player || !mod.IsPlayerValid(player)) continue;
        const pid = safeGetPlayerId(player);
        if (pid === undefined || isPidDisconnected(pid)) continue;
        const label = safeFind(UI_ADMIN_LIVE_RESPAWN_TEXT_ID + pid);
        if (!label) continue;
        safeSetUITextLabel(label, mod.Message(labelKey));
    }
}

function clampRoundLengthSeconds(seconds: number): number {
    return Math.max(ADMIN_ROUND_LENGTH_MIN_SECONDS, Math.min(ADMIN_ROUND_LENGTH_MAX_SECONDS, Math.floor(seconds)));
}

function getConfiguredRoundLengthSeconds(): number {
    return clampRoundLengthSeconds(State.round.clock.roundLengthSeconds ?? ROUND_START_SECONDS);
}

// Mirrors the configured round length (pre-round), not the live countdown.
function syncAdminRoundLengthLabelForAllPlayers(): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    const totalSeconds = getConfiguredRoundLengthSeconds();
    const time = getClockTimeParts(totalSeconds);
    for (let i = 0; i < count; i++) {
        const player = mod.ValueInArray(players, i) as mod.Player;
        if (!player || !mod.IsPlayerValid(player)) continue;
        const pid = safeGetPlayerId(player);
        if (pid === undefined || isPidDisconnected(pid)) continue;
        const label = safeFind(UI_ADMIN_ROUND_LENGTH_LABEL_ID + pid);
        if (!label) continue;
        safeSetUITextLabel(
            label,
            mod.Message(mod.stringkeys.twl.adminPanel.labels.roundLengthFormat, time.minutes, time.secTens, time.secOnes)
        );
    }
}

//#endregion ----------------- Admin Panel - Tie-Breaker + Live Respawn + Round Length Helpers --------------------



//#region -------------------- Overtime Flag Capture - Selection + Overrides --------------------

function isTieBreakerEnabledForRound(): boolean {
    if (!isOvertimeModeEnabled()) return false;
    return State.flag.tieBreakerEnabledThisRound;
}

function computeTieBreakerEnabledForRound(roundNumber: number, maxRounds: number, modeIndex: number): boolean {
    if (!isOvertimeModeEnabled()) return false;
    const normalized = normalizeTieBreakerModeIndex(modeIndex);
    if (normalized === 1) return true; // All Rounds
    if (normalized === 2) return false; // Disabled
    const currentRound = Math.max(1, Math.floor(roundNumber));
    const roundMax = Math.max(1, Math.floor(maxRounds));
    return currentRound >= roundMax; // Last Round Only
}

function syncTieBreakerEnabledForCurrentRound(): void {
    if (!isOvertimeModeEnabled()) {
        State.flag.tieBreakerEnabledThisRound = false;
        return;
    }
    State.flag.tieBreakerEnabledThisRound = computeTieBreakerEnabledForRound(
        State.round.current,
        State.round.max,
        State.admin.tieBreakerModeIndex
    );
}

function resetOvertimeSelectionForOverride(): void {
    // Clears the active overtime selection without touching stage/active flags.
    // Used for admin overrides before the reveal stage.
    hideOvertimeFlagPreviewIcon();
    State.flag.activeAreaTriggerId = undefined;
    State.flag.activeAreaTrigger = undefined;
    State.flag.activeSectorId = undefined;
    State.flag.activeSector = undefined;
    State.flag.activeWorldIconId = undefined;
    State.flag.activeWorldIcon = undefined;
    State.flag.activeCapturePointId = undefined;
    State.flag.activeCapturePoint = undefined;
    State.flag.activeCandidateIndex = undefined;
    State.flag.selectedZoneLetterKey = undefined;
    State.flag.ownerTeam = 0;
    State.flag.progress = 0.5;
    State.flag.t1Count = 0;
    State.flag.t2Count = 0;
    State.flag.playersInZoneByPid = {};
    State.flag.vehicleOccupantsByVid = {};
    State.flag.vehicleTeamByVid = {};
    State.flag.lastUiSnapshotByPid = {};
    State.flag.lastGlobalProgressPercent = -1;
    State.flag.lastMembershipPruneAtSeconds = 0;
}

function selectOvertimeZoneForRound(): boolean {
    if (!isOvertimeModeEnabled()) return false;
    // Select once per round; zone order defines A/B/C... letters.
    if (!isTieBreakerEnabledForRound()) return false;
    if (!State.flag.configValid) return false;
    const zones = State.flag.candidateZones;
    if (zones.length === 0) return false;
    const canOverride = State.flag.stage < OvertimeStage.Visible;
    const hasActiveSelection = State.flag.activeAreaTriggerId !== undefined;

    const validIndices: number[] = [];
    for (let i = 0; i < zones.length; i++) {
        const trigger = mod.GetAreaTrigger(zones[i].areaTriggerObjId);
        const sector = mod.GetSector(zones[i].sectorId);
        const icon = mod.GetWorldIcon(zones[i].worldIconObjId);
        const cp = mod.GetCapturePoint(zones[i].capturePointObjId);
        if (!trigger || !sector || !icon || !cp) continue;
        validIndices.push(i);
    }

    if (validIndices.length === 0) {
        // If no valid zones can be resolved, disable overtime for this round.
        State.flag.configValid = false;
        return false;
    }

    let overrideIndex = canOverride ? State.admin.tieBreakerOverrideIndex : undefined;
    if (overrideIndex !== undefined && validIndices.indexOf(overrideIndex) === -1) {
        State.admin.tieBreakerOverrideIndex = undefined;
        overrideIndex = undefined;
    }

    if (hasActiveSelection && overrideIndex === undefined) return true;

    const portalArray = buildPortalNumberArray(validIndices);
    const selectedIndex = overrideIndex !== undefined ? overrideIndex : (mod.RandomValueInArray(portalArray) as number);
    if (selectedIndex === undefined) return false;
    const selectedZone = zones[selectedIndex];

    if (hasActiveSelection && overrideIndex !== undefined && State.flag.activeCandidateIndex !== selectedIndex) {
        resetOvertimeSelectionForOverride();
    }

    State.flag.activeCandidateIndex = selectedIndex;
    State.flag.selectedZoneLetterKey = getOvertimeFlagLetterKeyForCandidateIndex(selectedIndex);
    State.flag.activeAreaTriggerId = selectedZone.areaTriggerObjId;
    State.flag.activeAreaTrigger = mod.GetAreaTrigger(selectedZone.areaTriggerObjId);
    State.flag.activeSectorId = selectedZone.sectorId;
    State.flag.activeSector = mod.GetSector(selectedZone.sectorId);
    State.flag.activeWorldIconId = selectedZone.worldIconObjId;
    State.flag.activeWorldIcon = mod.GetWorldIcon(selectedZone.worldIconObjId);
    State.flag.activeCapturePointId = selectedZone.capturePointObjId;
    State.flag.activeCapturePoint = mod.GetCapturePoint(selectedZone.capturePointObjId);

    if (!State.flag.activeAreaTrigger || !State.flag.activeSector || !State.flag.activeWorldIcon || !State.flag.activeCapturePoint) {
        State.flag.configValid = false;
        return false;
    }

    // Track override usage only when it actually dictates the selection.
    if (overrideIndex !== undefined) {
        State.flag.overrideUsedThisRound = true;
        State.admin.tieBreakerOverrideUsed = true;
    }

    if (overrideIndex !== undefined) {
        State.admin.tieBreakerOverrideIndex = undefined;
    }

    return State.flag.activeAreaTriggerId !== undefined;
}

// TODO(1.0): Unused; remove before final 1.0 release.
function getActiveOvertimeSector(): mod.Sector | undefined {
    if (State.flag.activeSector) return State.flag.activeSector;
    if (State.flag.activeSectorId === undefined) return undefined;
    const sector = mod.GetSector(State.flag.activeSectorId);
    State.flag.activeSector = sector;
    return sector;
}

function applyAdminTieBreakerOverride(selectedIndex: number): void {
    if (!isTieBreakerEnabledForRound()) return;
    if (!State.flag.configValid) return;
    if (State.flag.stage >= OvertimeStage.Visible) return;
    State.admin.tieBreakerOverrideIndex = selectedIndex;
    if (!isRoundLive()) return;
    const selected = selectOvertimeZoneForRound();
    if (selected) {
        State.flag.trackingEnabled = true;
    }
}

//#endregion -------------------- Overtime Flag Capture - Selection + Overrides --------------------



//#region -------------------- Overtime Flag Capture - Reset + State --------------------

function resetOvertimeFlagState(): void {
    // Clears all overtime state and hides UI. Safe to call on round reset/end.
    // Progress resets to neutral (0.5) and vehicle counts are cleared.
    if (isOvertimeModeEnabled()) {
        hideOvertimeFlagPreviewIcon();
    }
    stopOvertimeCaptureLoop();
    State.flag.stage = OvertimeStage.None;
    State.flag.active = false;
    State.flag.trackingEnabled = false;
    State.flag.unlockReminderSent = false;
    State.flag.overrideUsedThisRound = false;
    State.flag.activeAreaTriggerId = undefined;
    State.flag.activeAreaTrigger = undefined;
    State.flag.activeSectorId = undefined;
    State.flag.activeSector = undefined;
    State.flag.activeWorldIconId = undefined;
    State.flag.activeWorldIcon = undefined;
    State.flag.activeCapturePointId = undefined;
    State.flag.activeCapturePoint = undefined;
    State.flag.activeCandidateIndex = undefined;
    State.flag.selectedZoneLetterKey = undefined;
    State.flag.ownerTeam = 0;
    State.flag.progress = 0.5;
    State.flag.t1Count = 0;
    State.flag.t2Count = 0;
    State.flag.playersInZoneByPid = {};
    State.flag.vehicleOccupantsByVid = {};
    State.flag.vehicleTeamByVid = {};
    State.flag.lastUiSnapshotByPid = {};
    State.flag.lastGlobalProgressPercent = -1;
    State.flag.lastMembershipPruneAtSeconds = 0;
    hideOvertimeUiForAllPlayers();
    if (isOvertimeModeEnabled()) {
        logCapturePointVisibilityDebug(STR_DEBUG_CP_VIS_RESET);
        hideAllOvertimeZoneMarkers();
        hardResetOvertimeCapturePoints(getAllOvertimeCapturePointIds());
        configureOvertimeCapturePointTimes();
    } else {
        setOvertimeAllFlagVisibility(true);
    }
}

function isRoundKillTargetReached(): boolean {
    // Used to prevent double-end when capture completes after a kill-target win.
    return State.scores.t1RoundKills >= State.round.killsTarget || State.scores.t2RoundKills >= State.round.killsTarget;
}

//#endregion -------------------- Overtime Flag Capture - Reset + State --------------------



//#region -------------------- Overtime Flag Capture - Vehicle + Zone Membership Tracking --------------------

// Vehicle counts drive capture speed; one vehicle = one capture unit.
function incrementOvertimeTeamVehicleCount(teamId: TeamID | 0): void {
    if (teamId === TeamID.Team1) {
        State.flag.t1Count = Math.max(0, State.flag.t1Count + 1);
        return;
    }
    if (teamId === TeamID.Team2) {
        State.flag.t2Count = Math.max(0, State.flag.t2Count + 1);
    }
}

function decrementOvertimeTeamVehicleCount(teamId: TeamID | 0): void {
    if (teamId === TeamID.Team1) {
        State.flag.t1Count = Math.max(0, State.flag.t1Count - 1);
        return;
    }
    if (teamId === TeamID.Team2) {
        State.flag.t2Count = Math.max(0, State.flag.t2Count - 1);
    }
}

function addOvertimeVehicleOccupant(teamId: TeamID | 0, vehicleObjId: number): void {
    // One vehicle = one capture unit, regardless of how many occupants.
    if (teamId !== TeamID.Team1 && teamId !== TeamID.Team2) return;
    const current = State.flag.vehicleOccupantsByVid[vehicleObjId] ?? 0;
    const priorTeam = State.flag.vehicleTeamByVid[vehicleObjId];
    State.flag.vehicleOccupantsByVid[vehicleObjId] = current + 1;
    if (current === 0) {
        State.flag.vehicleTeamByVid[vehicleObjId] = teamId;
        incrementOvertimeTeamVehicleCount(teamId);
        return;
    }
    if (priorTeam && priorTeam !== teamId) {
        decrementOvertimeTeamVehicleCount(priorTeam);
        incrementOvertimeTeamVehicleCount(teamId);
        State.flag.vehicleTeamByVid[vehicleObjId] = teamId;
    }
}

function removeOvertimeVehicleOccupant(vehicleObjId: number): void {
    // Remove the vehicle from the team set when the last occupant leaves.
    const current = State.flag.vehicleOccupantsByVid[vehicleObjId];
    if (current === undefined) return;
    const next = Math.max(0, current - 1);
    if (next <= 0) {
        delete State.flag.vehicleOccupantsByVid[vehicleObjId];
        const teamId = State.flag.vehicleTeamByVid[vehicleObjId];
        delete State.flag.vehicleTeamByVid[vehicleObjId];
        decrementOvertimeTeamVehicleCount(teamId);
        return;
    }
    State.flag.vehicleOccupantsByVid[vehicleObjId] = next;
}

function syncOvertimePlayerVehicleState(player: mod.Player, entry: OvertimeFlagPlayerZoneState): void {
    if (!player || !mod.IsPlayerValid(player)) return;
    // Keep vehicle membership accurate for in-zone players who enter/exit vehicles.
    // Callers only invoke this for players currently tracked as in-zone.
    const inVehicle = safeGetSoldierStateBool(player, mod.SoldierStateBool.IsInVehicle);
    if (!inVehicle) {
        if (entry.vehicleObjId) {
            removeOvertimeVehicleOccupant(entry.vehicleObjId);
            entry.vehicleObjId = 0;
        }
        return;
    }
    let vehicle: mod.Vehicle | undefined;
    try {
        vehicle = mod.GetVehicleFromPlayer(player);
    } catch {
        vehicle = undefined;
    }
    if (!vehicle) {
        if (entry.vehicleObjId) {
            removeOvertimeVehicleOccupant(entry.vehicleObjId);
            entry.vehicleObjId = 0;
        }
        return;
    }
    const vid = safeGetObjId(vehicle);
    if (vid === undefined) {
        if (entry.vehicleObjId) {
            removeOvertimeVehicleOccupant(entry.vehicleObjId);
            entry.vehicleObjId = 0;
        }
        return;
    }
    if (entry.vehicleObjId && entry.vehicleObjId !== vid) {
        removeOvertimeVehicleOccupant(entry.vehicleObjId);
    }
    if (entry.vehicleObjId !== vid) {
        entry.vehicleObjId = vid;
        addOvertimeVehicleOccupant(entry.teamId, vid);
    }
}

function handleOvertimePlayerEnterZone(eventPlayer: mod.Player): void {
    try {
        if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
        // AreaTrigger enter is soldier-based; we still gate capture by vehicle occupancy.
        // Track on-foot players too so UI can show "vehicle required".
        if (!State.flag.configValid) return;
        if (!isOvertimeZoneTrackingEnabled()) return;
        if (State.flag.activeAreaTriggerId === undefined) return;
        const pid = safeGetPlayerId(eventPlayer);
        if (pid === undefined || isPidDisconnected(pid)) return;
        const teamId = safeGetTeamNumberFromPlayer(eventPlayer);
        const entry = State.flag.playersInZoneByPid[pid] ?? { playerObjId: pid, teamId, vehicleObjId: 0 };
        entry.playerObjId = pid;
        entry.teamId = teamId;
        State.flag.playersInZoneByPid[pid] = entry;
        syncOvertimePlayerVehicleState(eventPlayer, entry);
        refreshOvertimeUiVisibilityForPlayer(eventPlayer);
    } catch {
        return;
    }
}

function handleOvertimePlayerExitZone(eventPlayer: mod.Player): void {
    try {
        if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
        // Drop membership and vehicle counts when leaving the capture zone.
        // Clear snapshots so UI can rebuild cleanly if they re-enter.
        const pid = safeGetPlayerId(eventPlayer);
        if (pid === undefined || isPidDisconnected(pid)) return;
        const entry = State.flag.playersInZoneByPid[pid];
        if (!entry) return;
        if (entry.vehicleObjId) {
            removeOvertimeVehicleOccupant(entry.vehicleObjId);
        }
        delete State.flag.playersInZoneByPid[pid];
        delete State.flag.lastUiSnapshotByPid[pid];
        refreshOvertimeUiVisibilityForPlayer(eventPlayer);
    } catch {
        return;
    }
}

function handleOvertimePlayerLeaveById(playerId: number, allowHardDelete: boolean = true): void {
    // Disconnect cleanup uses player id (eventNumber), not Player object.
    const entry = State.flag.playersInZoneByPid[playerId];
    if (entry?.vehicleObjId) {
        removeOvertimeVehicleOccupant(entry.vehicleObjId);
    }
    delete State.flag.playersInZoneByPid[playerId];
    delete State.flag.lastUiSnapshotByPid[playerId];

    if (!allowHardDelete) {
        // Undeploy/death cleanup: do NOT delete widgets mid-round to avoid engine instability.
        // Hide + drop refs so HUD can be safely rebuilt on next round/reconnect.
        const refs = State.flag.uiByPid[playerId];
        if (refs?.root) setWidgetVisible(refs.root, false);
        const globalRefs = State.flag.globalUiByPid[playerId];
        if (globalRefs?.root) setWidgetVisible(globalRefs.root, false);
        dropOvertimeUiRefsForPlayerId(playerId);
        return;
    }

    if (isPidDisconnected(playerId) && shouldDeferDisconnectUiDeletes()) {
        dropOvertimeUiRefsForPlayerId(playerId);
        return;
    }
    deleteOvertimeUiForPlayerId(playerId);
}

function handleOvertimePlayerEnterVehicle(eventPlayer: mod.Player, eventVehicle: mod.Vehicle): void {
    try {
        if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
        // Seat changes inside the zone must update vehicle occupancy.
        // No-op for players not currently tracked as in-zone.
        if (!State.flag.configValid) return;
        const pid = safeGetPlayerId(eventPlayer);
        if (pid === undefined || isPidDisconnected(pid)) return;
        const entry = State.flag.playersInZoneByPid[pid];
        if (!entry) return;
        const teamId = safeGetTeamNumberFromPlayer(eventPlayer);
        entry.teamId = teamId;
        const vid = safeGetObjId(eventVehicle);
        if (vid === undefined) return;
        if (entry.vehicleObjId && entry.vehicleObjId !== vid) {
            removeOvertimeVehicleOccupant(entry.vehicleObjId);
        }
        if (entry.vehicleObjId !== vid) {
            entry.vehicleObjId = vid;
            addOvertimeVehicleOccupant(teamId, vid);
        }
        refreshOvertimeUiVisibilityForPlayer(eventPlayer);
    } catch {
        return;
    }
}

function handleOvertimePlayerExitVehicle(eventPlayer: mod.Player, eventVehicle: mod.Vehicle): void {
    try {
        if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
        // Exiting a vehicle inside the zone removes that vehicle from capture counts.
        // The per-player UI will switch to the "vehicle required" hint.
        const pid = safeGetPlayerId(eventPlayer);
        if (pid === undefined || isPidDisconnected(pid)) return;
        const entry = State.flag.playersInZoneByPid[pid];
        if (!entry) return;
        const vid = safeGetObjId(eventVehicle);
        if (vid === undefined) return;
        if (entry.vehicleObjId === vid) {
            removeOvertimeVehicleOccupant(vid);
            entry.vehicleObjId = 0;
            delete State.flag.lastUiSnapshotByPid[pid];
        }
        refreshOvertimeUiVisibilityForPlayer(eventPlayer);
    } catch {
        return;
    }
}

function handleOvertimeVehicleDestroyed(eventVehicle: mod.Vehicle): void {
    try {
        // Ensure destroyed vehicles are removed from capture counts to avoid ghost capture.
        const vid = safeGetObjId(eventVehicle);
        if (vid === undefined) return;
        if (State.flag.vehicleOccupantsByVid[vid] === undefined) return;
        delete State.flag.vehicleOccupantsByVid[vid];
        const teamId = State.flag.vehicleTeamByVid[vid];
        delete State.flag.vehicleTeamByVid[vid];
        decrementOvertimeTeamVehicleCount(teamId);
        const pids = Object.keys(State.flag.playersInZoneByPid);
        for (let i = 0; i < pids.length; i++) {
            const pid = Number(pids[i]);
            const entry = State.flag.playersInZoneByPid[pid];
            if (entry?.vehicleObjId === vid) {
                entry.vehicleObjId = 0;
                delete State.flag.lastUiSnapshotByPid[pid];
            }
        }
    } catch {
        return;
    }
}

//#endregion -------------------- Overtime Flag Capture - Vehicle + Zone Membership Tracking --------------------



//#region -------------------- Overtime Flag Capture - Capture Loop + Progress --------------------

function stopOvertimeCaptureLoop(): void {
    if (!State.flag.tickActive) return;
    // Invalidate the token so any running loop exits on the next tick.
    State.flag.tickActive = false;
    State.flag.tickToken = (State.flag.tickToken + 1) % 1000000000;
}

function startOvertimeCaptureLoop(): void {
    // Token guards against multiple loops running at once.
    if (State.flag.tickActive) return;
    State.flag.tickActive = true;
    State.flag.tickToken = (State.flag.tickToken + 1) % 1000000000;
    const token = State.flag.tickToken;
    void runOvertimeCaptureLoop(token);
}

async function runOvertimeCaptureLoop(expectedToken: number): Promise<void> {
    // Tick loop: update capture state + HUD, then wait.
    while (State.flag.tickActive && State.flag.tickToken === expectedToken) {
        if (!State.flag.active || !isRoundLive()) {
            stopOvertimeCaptureLoop();
            return;
        }
        if (isRoundEndUiLockdownActive()) {
            // Round-end transition: stop capture ticks before any UI updates.
            stopOvertimeCaptureLoop();
            return;
        }
        try {
            pruneOvertimeZoneMembership();
            pruneOvertimeUiCaches();
            updateOvertimeCaptureProgress();
            updateOvertimeHudForAllPlayers();
        } catch {
            // Defensive: skip a bad tick if a disconnect invalidates state mid-loop.
        }
        await mod.Wait(OVERTIME_TICK_SECONDS);
    }
}

function pruneOvertimeZoneMembership(): void {
    // Round-end teardown: skip overtime membership churn.
    if (isRoundEndUiLockdownActive()) return;
    if (!isOvertimeZoneTrackingEnabled()) return;
    const now = mod.GetMatchTimeElapsed();
    if (now - State.flag.lastMembershipPruneAtSeconds < OVERTIME_MEMBERSHIP_PRUNE_INTERVAL_SECONDS) return;
    State.flag.lastMembershipPruneAtSeconds = now;

    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    const validPlayersByPid: Record<number, mod.Player> = {};
    for (let i = 0; i < count; i++) {
        const player = mod.ValueInArray(players, i) as mod.Player;
        if (!player || !mod.IsPlayerValid(player)) continue;
        const pid = safeGetPlayerId(player);
        if (pid === undefined) continue;
        validPlayersByPid[pid] = player;
    }

    const trackedPids = Object.keys(State.flag.playersInZoneByPid);
    for (let i = 0; i < trackedPids.length; i++) {
        const pid = Number(trackedPids[i]);
        if (isPidDisconnected(pid)) {
            handleOvertimePlayerLeaveById(pid, true);
            continue;
        }
        const player = validPlayersByPid[pid];
        if (!player || !mod.IsPlayerValid(player)) {
            // Best-effort cleanup for missed AreaTrigger exits.
            handleOvertimePlayerLeaveById(pid, false);
            continue;
        }
        if (!isPlayerDeployed(player)) {
            handleOvertimePlayerExitZone(player);
        }
    }
}

function pruneOvertimeUiCaches(): void {
    // Round-end teardown: avoid touching overtime UI caches.
    if (isRoundEndUiLockdownActive()) return;
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    const validPids: Record<number, true> = {};
    for (let i = 0; i < count; i++) {
        const player = mod.ValueInArray(players, i) as mod.Player;
        const pid = safeGetPlayerId(player);
        if (pid === undefined) continue;
        validPids[pid] = true;
    }

    const zonePids = Object.keys(State.flag.uiByPid);
    for (let i = 0; i < zonePids.length; i++) {
        const pid = Number(zonePids[i]);
        if (validPids[pid]) continue;
        const refs = State.flag.uiByPid[pid];
        if (refs?.root) setWidgetVisible(refs.root, false);
        delete State.flag.uiByPid[pid];
        delete State.flag.lastUiSnapshotByPid[pid];
    }

    const globalPids = Object.keys(State.flag.globalUiByPid);
    for (let i = 0; i < globalPids.length; i++) {
        const pid = Number(globalPids[i]);
        if (validPids[pid]) continue;
        const refs = State.flag.globalUiByPid[pid];
        if (refs?.root) setWidgetVisible(refs.root, false);
        delete State.flag.globalUiByPid[pid];
    }
}

function getOvertimeCaptureMultiplier(deltaAbs: number): number {
    if (deltaAbs >= 4) return OVERTIME_CAPTURE_MULTIPLIER_4X;
    if (deltaAbs === 3) return OVERTIME_CAPTURE_MULTIPLIER_3X;
    if (deltaAbs === 2) return OVERTIME_CAPTURE_MULTIPLIER_2X;
    return 1;
}

function updateOvertimeCaptureProgress(): void {
    if (!State.flag.active || !isRoundLive()) return;

    // Progress runs toward the team with vehicle majority; neutral is 0.5.
    // Decay runs only when the zone is empty and progress is not fully owned.
    const t1Count = State.flag.t1Count;
    const t2Count = State.flag.t2Count;
    const delta = t1Count - t2Count;
    if (delta !== 0) {
        // Base step uses 0.5 distance (neutral -> full) and scales by majority.
        const baseStep = (OVERTIME_TICK_SECONDS / OVERTIME_CAPTURE_SECONDS_TO_FULL) * 0.5;
        const scaled = getOvertimeCaptureMultiplier(Math.abs(delta));
        const soloTeam1 = t1Count > 0 && t2Count === 0;
        const soloTeam2 = t2Count > 0 && t1Count === 0;
        const team1CatchingUp = soloTeam1 && State.flag.progress < 0.5;
        const team2CatchingUp = soloTeam2 && State.flag.progress > 0.5;
        const catchupBoost = (team1CatchingUp || team2CatchingUp) ? OVERTIME_NEUTRAL_ACCELERATION_MULTIPLIER : 1;
        const step = baseStep * scaled * catchupBoost;
        State.flag.progress = State.flag.progress + (delta > 0 ? step : -step);
        if (team1CatchingUp && State.flag.progress > 0.5) {
            State.flag.progress = 0.5;
        }
        if (team2CatchingUp && State.flag.progress < 0.5) {
            State.flag.progress = 0.5;
        }
    } else if (t1Count === 0 && t2Count === 0) {
        if (State.flag.progress !== 0 && State.flag.progress !== 1) {
            const decayStep = (OVERTIME_TICK_SECONDS / OVERTIME_DECAY_SECONDS_TO_TARGET) * 0.5;
            const neutralStep = (State.flag.ownerTeam === 0) ? (decayStep * OVERTIME_NEUTRAL_ACCELERATION_MULTIPLIER) : decayStep;
            if (State.flag.ownerTeam === TeamID.Team1) {
                State.flag.progress = Math.min(1, State.flag.progress + decayStep);
            } else if (State.flag.ownerTeam === TeamID.Team2) {
                State.flag.progress = Math.max(0, State.flag.progress - decayStep);
            } else if (State.flag.progress > 0.5) {
                State.flag.progress = Math.max(0.5, State.flag.progress - neutralStep);
            } else if (State.flag.progress < 0.5) {
                State.flag.progress = Math.min(0.5, State.flag.progress + neutralStep);
            }
        }
    }

    State.flag.progress = Math.max(0, Math.min(1, State.flag.progress));

    if (State.flag.progress <= 0) {
        State.flag.progress = 0;
        State.flag.ownerTeam = TeamID.Team2;
        // Full capture ends the round immediately (unless a kill-target already ended it).
        if (isRoundLive() && !isRoundKillTargetReached()) {
            State.flag.active = false;
            stopOvertimeCaptureLoop();
            endRound(undefined, getRemainingSeconds(), TeamID.Team2);
        }
        return;
    }
    if (State.flag.progress >= 1) {
        State.flag.progress = 1;
        State.flag.ownerTeam = TeamID.Team1;
        // Full capture ends the round immediately (unless a kill-target already ended it).
        if (isRoundLive() && !isRoundKillTargetReached()) {
            State.flag.active = false;
            stopOvertimeCaptureLoop();
            endRound(undefined, getRemainingSeconds(), TeamID.Team1);
        }
    }
}

// TODO(1.0): Unused; remove before final 1.0 release.
function getOvertimeProgressPercent(): number {
    // Percent is floored for stable UI updates.
    return Math.max(0, Math.min(100, Math.floor(State.flag.progress * 100)));
}

function getOvertimeDisplayPercents(progress: number): { left: number; right: number } {
    // Biased whole-number rounding so the displayed winner matches the capture winner.
    const clamped = Math.max(0, Math.min(1, progress));
    if (clamped === 0.5) return { left: 50, right: 50 };
    if (clamped > 0.5) {
        const left = Math.min(100, Math.max(0, Math.ceil(clamped * 100)));
        return { left, right: 100 - left };
    }
    const left = Math.min(100, Math.max(0, Math.floor(clamped * 100)));
    return { left, right: 100 - left };
}

//#endregion -------------------- Overtime Flag Capture - Capture Loop + Progress --------------------



//#region -------------------- Overtime Flag Capture - HUD Update + Visibility --------------------

function isOvertimeZoneTrackingEnabled(): boolean {
    return isRoundLive() && State.flag.trackingEnabled && isTieBreakerEnabledForRound();
}

function shouldDeferDisconnectUiDeletes(): boolean {
    // Avoid hard UI deletes during active overtime capture to reduce crash risk on disconnects.
    return isRoundLive() && State.flag.stage >= OvertimeStage.Visible;
}

function updateOvertimeHudForAllPlayers(): void {
    if (!isRoundLive()) return;
    // Round-end teardown: stop live HUD updates.
    if (isRoundEndUiLockdownActive()) return;
    if (State.flag.stage < OvertimeStage.Visible) return;
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const player = mod.ValueInArray(players, i) as mod.Player;
        if (!player || !mod.IsPlayerValid(player)) continue;
        const pid = safeGetPlayerId(player);
        if (pid === undefined || isPidDisconnected(pid)) continue;
        try {
            updateOvertimeHudForPlayer(player);
        } catch {
            continue;
        }
    }
}

function updateOvertimeHudForPlayer(player: mod.Player): void {
    if (!player || !mod.IsPlayerValid(player)) return;
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return;
    if (isPidDisconnected(pid)) return;
    // Round-end teardown: skip per-player HUD updates.
    if (isRoundEndUiLockdownActive()) return;
    const entry = State.flag.playersInZoneByPid[pid];
    const inZone = !!entry;
    const refs = State.flag.uiByPid[pid];
    if (!refs || !refs.root) return;

    const stage = State.flag.stage;
    const isActive = stage >= OvertimeStage.Active;
    const letterKey = getActiveOvertimeFlagLetterKey();
    const letterText = getActiveOvertimeFlagLetterText();
    const teamId = entry?.teamId ?? safeGetTeamNumberFromPlayer(player);

    // Title + status routing by stage and zone presence.
    let titleKey = STR_FLAG_TITLE_ACTIVE_FORMAT;
    let titleValue = letterKey;
    let statusKey = STR_FLAG_STATUS_STALLED;
    let statusValue = -1;
    let statusVisible = true;
    let unlockSeconds = -1;

    if (!isActive) {
        titleKey = STR_FLAG_TITLE_LOCKED_FORMAT;
        titleValue = letterKey;
        unlockSeconds = getOvertimeUnlockSeconds();
        if (inZone) {
            statusKey = STR_FLAG_ACTIVATES_IN_FORMAT;
            statusValue = unlockSeconds;
        } else {
            statusVisible = false;
        }
    } else {
        titleKey = STR_FLAG_TITLE_ACTIVE_FORMAT;
        titleValue = letterKey;
        // Active stage: status reflects which team is winning the capture.
        const delta = State.flag.t1Count - State.flag.t2Count;
        if (delta !== 0) {
            if (teamId === TeamID.Team1) {
                statusKey = delta > 0 ? STR_FLAG_STATUS_CAPTURING : STR_FLAG_STATUS_LOSING;
            } else if (teamId === TeamID.Team2) {
                statusKey = delta < 0 ? STR_FLAG_STATUS_CAPTURING : STR_FLAG_STATUS_LOSING;
            }
        } else if (State.flag.t1Count > 0 && State.flag.t2Count > 0) {
            statusKey = STR_FLAG_STATUS_STALLED;
        } else if (State.flag.t1Count === 0 && State.flag.t2Count === 0) {
            const isResetting = Math.abs(State.flag.progress - 0.5) > 0.0001;
            if (isResetting) {
                statusKey = STR_FLAG_STATUS_RESETTING;
            } else {
                statusVisible = false;
            }
        }
    }

    const preActiveInZone = !isActive && stage >= OvertimeStage.Visible && inZone;
    const countsVisible = isActive || preActiveInZone;
    const countsUseX = preActiveInZone;
    const leftBorderVisible = isActive && State.flag.t1Count > 0;
    const rightBorderVisible = isActive && State.flag.t2Count > 0;
    const vehicleRequiredVisible = stage >= OvertimeStage.Visible && inZone && entry?.vehicleObjId === 0;
    const progress = isActive ? State.flag.progress : 0.5;
    const progressPercent = Math.max(0, Math.min(100, Math.floor(progress * 100)));
    const displayPercents = getOvertimeDisplayPercents(progress);
    const leftPercent = Math.min(99, displayPercents.left);
    const rightPercent = Math.min(99, displayPercents.right);
    const t1Width = Math.max(0, Math.min(OVERTIME_BAR_WIDTH, Math.round(OVERTIME_BAR_WIDTH * progress)));
    const t2Width = Math.max(0, OVERTIME_BAR_WIDTH - t1Width);

    // Always refresh the title so locked/active text stays visible even when snapshot gating skips other updates.
    const titleWidget = refs.title ?? safeFind(`OvertimeFlag_Title_${pid}`);
    const titleShadowWidget = refs.titleShadow ?? safeFind(`OvertimeFlag_TitleShadow_${pid}`);
    if (titleWidget || titleShadowWidget) {
        const titleLabel = !isActive
            ? mod.Message(titleKey, letterText, unlockSeconds)
            : mod.Message(titleKey, letterText);
        if (titleWidget) {
            refs.title = titleWidget;
            safeSetUITextLabel(titleWidget, titleLabel);
            setWidgetVisible(titleWidget, true);
        }
        if (titleShadowWidget) {
            refs.titleShadow = titleShadowWidget;
            safeSetUITextLabel(titleShadowWidget, titleLabel);
            setWidgetVisible(titleShadowWidget, true);
        }
    }

    const snapshot = State.flag.lastUiSnapshotByPid[pid];
    // Avoid touching UI if nothing changed since the last tick.
    if (
        snapshot
        && snapshot.progressPercent === progressPercent
        && snapshot.leftPercent === leftPercent
        && snapshot.rightPercent === rightPercent
        && snapshot.barFillT1Width === t1Width
        && snapshot.barFillT2Width === t2Width
        && snapshot.t1Count === State.flag.t1Count
        && snapshot.t2Count === State.flag.t2Count
        && snapshot.statusKey === statusKey
        && snapshot.statusValue === statusValue
        && snapshot.statusVisible === statusVisible
        && snapshot.titleKey === titleKey
        && snapshot.titleValue === titleValue
        && snapshot.countsVisible === countsVisible
        && snapshot.countsUseX === countsUseX
        && snapshot.leftBorderVisible === leftBorderVisible
        && snapshot.rightBorderVisible === rightBorderVisible
        && snapshot.vehicleRequiredVisible === vehicleRequiredVisible
    ) {
        return;
    }

    State.flag.lastUiSnapshotByPid[pid] = {
        progressPercent,
        leftPercent,
        rightPercent,
        barFillT1Width: t1Width,
        barFillT2Width: t2Width,
        t1Count: State.flag.t1Count,
        t2Count: State.flag.t2Count,
        statusKey,
        statusValue,
        statusVisible,
        titleKey,
        titleValue,
        countsVisible,
        countsUseX,
        leftBorderVisible,
        rightBorderVisible,
        vehicleRequiredVisible,
    };

    if (refs.status || refs.statusShadow) {
        if (statusVisible) {
            const statusLabel = statusValue >= 0 ? mod.Message(statusKey, statusValue) : mod.Message(statusKey);
            if (refs.status) {
                safeSetUITextLabel(refs.status, statusLabel);
            }
            if (refs.statusShadow) {
                safeSetUITextLabel(refs.statusShadow, statusLabel);
            }
        }
        if (refs.status) {
            setWidgetVisible(refs.status, statusVisible);
        }
        if (refs.statusShadow) {
            setWidgetVisible(refs.statusShadow, statusVisible);
        }
    }

    if (refs.countsLeft) {
        if (countsVisible) {
            const label = countsUseX
                ? mod.Message(STR_FLAG_COUNTS_LEFT_FORMAT, STR_UI_X)
                : mod.Message(STR_FLAG_COUNTS_LEFT_FORMAT, State.flag.t1Count);
            safeSetUITextLabel(refs.countsLeft, label);
        }
        setWidgetVisible(refs.countsLeft, countsVisible);
    }
    if (refs.countsLeftBorder) {
        setWidgetVisible(refs.countsLeftBorder, leftBorderVisible);
    }
    if (refs.countsRight) {
        if (countsVisible) {
            const label = countsUseX
                ? mod.Message(STR_FLAG_COUNTS_RIGHT_FORMAT, STR_UI_X)
                : mod.Message(STR_FLAG_COUNTS_RIGHT_FORMAT, State.flag.t2Count);
            safeSetUITextLabel(refs.countsRight, label);
        }
        setWidgetVisible(refs.countsRight, countsVisible);
    }
    if (refs.countsRightBorder) {
        setWidgetVisible(refs.countsRightBorder, rightBorderVisible);
    }
    if (refs.percentLeft) {
        if (countsVisible) {
            safeSetUITextLabel(refs.percentLeft, mod.Message(STR_FLAG_PROGRESS_FORMAT, leftPercent));
        }
        setWidgetVisible(refs.percentLeft, countsVisible);
    }
    if (refs.percentLeftBg) {
        setWidgetVisible(refs.percentLeftBg, countsVisible);
    }
    if (refs.percentRight) {
        if (countsVisible) {
            safeSetUITextLabel(refs.percentRight, mod.Message(STR_FLAG_PROGRESS_FORMAT, rightPercent));
        }
        setWidgetVisible(refs.percentRight, countsVisible);
    }
    if (refs.percentRightBg) {
        setWidgetVisible(refs.percentRightBg, countsVisible);
    }

    const progressDelta = progress - 0.5;
    const progressEpsilon = 0.0001;
    const showLeftCrown = countsVisible && progressDelta > progressEpsilon;
    const showRightCrown = countsVisible && progressDelta < -progressEpsilon;
    setWidgetVisible(refs.countsLeftCrown, showLeftCrown);
    setWidgetVisible(refs.countsRightCrown, showRightCrown);

    setWidgetVisible(refs.vehicleRequired, vehicleRequiredVisible);

    // Bar fill is split between the two teams around neutral.
    if (refs.barBg) setWidgetVisible(refs.barBg, true);
    if (refs.barFillT1) setWidgetVisible(refs.barFillT1, true);
    if (refs.barFillT2) setWidgetVisible(refs.barFillT2, true);
    if (refs.barFillT1) safeSetUIWidgetSize(refs.barFillT1, mod.CreateVector(t1Width, OVERTIME_BAR_HEIGHT, 0));
    if (refs.barFillT2) safeSetUIWidgetSize(refs.barFillT2, mod.CreateVector(t2Width, OVERTIME_BAR_HEIGHT, 0));
}

// TODO(1.0): Unused; remove before final 1.0 release.
function updateOvertimeGlobalHudForAllPlayers(force: boolean): void {
    // Deprecated: global HUD replaced by unified in-zone HUD.
    if (!force) return;
    // Round-end teardown: avoid forced HUD refresh.
    if (isRoundEndUiLockdownActive()) return;
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const player = mod.ValueInArray(players, i) as mod.Player;
        if (!player || !mod.IsPlayerValid(player)) continue;
        const pid = safeGetPlayerId(player);
        if (pid === undefined || isPidDisconnected(pid)) continue;
        const refs = State.flag.globalUiByPid[pid];
        if (refs?.root) setWidgetVisible(refs.root, false);
    }
}

function refreshOvertimeUiVisibilityForAllPlayers(): void {
    // Used after stage transitions or global state changes.
    // Round-end teardown: do not toggle overtime HUD visibility.
    if (isRoundEndUiLockdownActive()) return;
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const player = mod.ValueInArray(players, i) as mod.Player;
        if (!player || !mod.IsPlayerValid(player)) continue;
        refreshOvertimeUiVisibilityForPlayer(player);
    }
}

function refreshOvertimeUiVisibilityForPlayer(player: mod.Player): void {
    if (!player || !mod.IsPlayerValid(player)) return;
    // Single HUD for all players once visible; global HUD is deprecated.
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return;
    if (isPidDisconnected(pid)) return;
    // Round-end teardown: skip per-player visibility changes.
    if (isRoundEndUiLockdownActive()) return;
    const isLive = isRoundLive();
    const shouldShow = isLive && State.flag.stage >= OvertimeStage.Visible;
    let refs: OvertimeFlagHudRefs | undefined = State.flag.uiByPid[pid];
    if (!refs && shouldShow) {
        try {
            refs = ensureOvertimeHudForPlayer(player);
        } catch {
            return;
        }
    }
    if (refs?.root) setWidgetVisible(refs.root, shouldShow);
    if (shouldShow && refs?.root) {
        try {
            updateOvertimeHudForPlayer(player);
        } catch {
            return;
        }
    }
    const globalRefs = State.flag.globalUiByPid[pid];
    if (globalRefs?.root) setWidgetVisible(globalRefs.root, false);
}

function rebuildOvertimeUiForPlayer(player: mod.Player): void {
    if (!player || !mod.IsPlayerValid(player)) return;
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return;

    // Hide any lingering overtime HUD roots and drop cached refs/snapshots.
    const zoneRoot = safeFind(`OvertimeFlagRoot_${pid}`);
    if (zoneRoot) setWidgetVisible(zoneRoot, false);
    const globalRoot = safeFind(`OvertimeGlobalRoot_${pid}`);
    if (globalRoot) setWidgetVisible(globalRoot, false);

    dropOvertimeUiRefsForPlayerId(pid);

    if (!isOvertimeModeEnabled()) return;

    // Rebuild only when the round is in a safe state for overtime UI updates.
    if (isRoundEndUiLockdownActive()) return;
    refreshOvertimeUiVisibilityForPlayer(player);
}

function prewarmOvertimeHudForAllPlayers(): void {
    if (!isOvertimeModeEnabled()) return;
    // Round-end teardown: skip prewarm if teardown is active.
    if (isRoundEndUiLockdownActive()) return;
    if (!isRoundLive()) return;
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const player = mod.ValueInArray(players, i) as mod.Player;
        const pid = safeGetPlayerId(player);
        if (pid === undefined || isPidDisconnected(pid)) continue;
        let refs: OvertimeFlagHudRefs | undefined;
        try {
            refs = ensureOvertimeHudForPlayer(player);
        } catch {
            continue;
        }
        if (refs?.root) setWidgetVisible(refs.root, false);
        const globalRefs = State.flag.globalUiByPid[pid];
        if (globalRefs?.root) setWidgetVisible(globalRefs.root, false);
    }
}

function hideOvertimeUiForAllPlayers(): void {
    // Hide both in-zone and out-of-zone HUD roots.
    // Round-end teardown: avoid touching widget visibility.
    if (isRoundEndUiLockdownActive()) return;
    const zonePids = Object.keys(State.flag.uiByPid);
    for (let i = 0; i < zonePids.length; i++) {
        const pid = Number(zonePids[i]);
        const refs = State.flag.uiByPid[pid];
        if (refs?.root) setWidgetVisible(refs.root, false);
    }
    const globalPids = Object.keys(State.flag.globalUiByPid);
    for (let i = 0; i < globalPids.length; i++) {
        const pid = Number(globalPids[i]);
        const refs = State.flag.globalUiByPid[pid];
        if (refs?.root) setWidgetVisible(refs.root, false);
    }
}

//#endregion -------------------- Overtime Flag Capture - HUD Update + Visibility --------------------



//#region -------------------- Overtime Flag Capture - HUD Build + Cache --------------------

function safeDeleteUiWidget(widget: mod.UIWidget | undefined): void {
    if (!widget) return;
    try {
        mod.DeleteUIWidget(widget);
    } catch {
        return;
    }
}

function dropOvertimeUiRefsForPlayerId(pid: number): void {
    delete State.flag.uiByPid[pid];
    delete State.flag.globalUiByPid[pid];
    delete State.flag.lastUiSnapshotByPid[pid];
}

function deleteOvertimeUiForPlayerId(pid: number): void {
    // Round-end teardown: drop refs without deleting widgets.
    if (isRoundEndUiLockdownActive()) {
        dropOvertimeUiRefsForPlayerId(pid);
        return;
    }
    // Hard delete widgets for disconnect cleanup.
    const refs = State.flag.uiByPid[pid];
    if (refs) {
        safeDeleteUiWidget(refs.root);
        safeDeleteUiWidget(refs.barBg);
        safeDeleteUiWidget(refs.barFillT1);
        safeDeleteUiWidget(refs.barFillT2);
        safeDeleteUiWidget(refs.title);
        safeDeleteUiWidget(refs.titleShadow);
        safeDeleteUiWidget(refs.status);
        safeDeleteUiWidget(refs.countsLeft);
        safeDeleteUiWidget(refs.countsRight);
        safeDeleteUiWidget(refs.countsLeftBorder);
        safeDeleteUiWidget(refs.countsRightBorder);
        safeDeleteUiWidget(refs.percentLeftBg);
        safeDeleteUiWidget(refs.percentRightBg);
        safeDeleteUiWidget(refs.percentLeft);
        safeDeleteUiWidget(refs.percentRight);
        safeDeleteUiWidget(refs.countsLeftCrown);
        safeDeleteUiWidget(refs.countsRightCrown);
        safeDeleteUiWidget(refs.statusShadow);
        safeDeleteUiWidget(refs.vehicleRequired);
    }
    const globalRefs = State.flag.globalUiByPid[pid];
    if (globalRefs) {
        safeDeleteUiWidget(globalRefs.root);
        safeDeleteUiWidget(globalRefs.barBg);
        safeDeleteUiWidget(globalRefs.barFillT1);
        safeDeleteUiWidget(globalRefs.barFillT2);
        safeDeleteUiWidget(globalRefs.title);
    }
    delete State.flag.uiByPid[pid];
    delete State.flag.globalUiByPid[pid];
    delete State.flag.lastUiSnapshotByPid[pid];
}

function ensureOvertimeHudForPlayer(player: mod.Player): OvertimeFlagHudRefs | undefined {
    // In-zone HUD: status, counts, and capture bar.
    // Text widgets are built via modlib.ParseUI; the bar uses AddUIContainer for dynamic width updates.
    if (!player || !mod.IsPlayerValid(player)) return undefined;
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return undefined;
    if (isPidDisconnected(pid)) return undefined;
    const rootName = `OvertimeFlagRoot_${pid}`;
    const cached = State.flag.uiByPid[pid];
    const existingRoot = safeFind(rootName);
    if (cached && cached.root && existingRoot) return cached;
    if (existingRoot) {
        // Rehydrate refs if widgets already exist (e.g., reconnect or cached UI remnants).
        const refs: OvertimeFlagHudRefs = {
            root: existingRoot,
            title: safeFind(`OvertimeFlag_Title_${pid}`),
            titleShadow: safeFind(`OvertimeFlag_TitleShadow_${pid}`),
            countsLeft: safeFind(`OvertimeFlag_CountsLeft_${pid}`),
            countsRight: safeFind(`OvertimeFlag_CountsRight_${pid}`),
            countsLeftBorder: safeFind(`OvertimeFlag_CountsLeft_Border_${pid}`),
            countsRightBorder: safeFind(`OvertimeFlag_CountsRight_Border_${pid}`),
            percentLeftBg: safeFind(`OvertimeFlag_PercentLeft_${pid}`),
            percentRightBg: safeFind(`OvertimeFlag_PercentRight_${pid}`),
            percentLeft: safeFind(`OvertimeFlag_PercentLeft_Text_${pid}`),
            percentRight: safeFind(`OvertimeFlag_PercentRight_Text_${pid}`),
            countsLeftCrown: safeFind(`OvertimeFlag_CountsLeft_Crown_${pid}`),
            countsRightCrown: safeFind(`OvertimeFlag_CountsRight_Crown_${pid}`),
            status: safeFind(`OvertimeFlag_Status_${pid}`),
            statusShadow: safeFind(`OvertimeFlag_StatusShadow_${pid}`),
            vehicleRequired: safeFind(`OvertimeFlag_VehicleRequired_${pid}`),
            barBg: safeFind(`OvertimeFlag_BarBg_${pid}`),
            barFillT1: safeFind(`OvertimeFlag_BarFillT1_${pid}`),
            barFillT2: safeFind(`OvertimeFlag_BarFillT2_${pid}`),
        };
        State.flag.uiByPid[pid] = refs;
        return refs;
    }

    try {
        modlib.ParseUI({
            name: rootName,
            type: "Container",
            playerId: player,
            anchor: mod.UIAnchor.TopCenter,
            position: [OVERTIME_UI_OFFSET_X, OVERTIME_UI_OFFSET_Y],
            size: [OVERTIME_UI_WIDTH, OVERTIME_UI_HEIGHT],
            visible: false,
            padding: 0,
            bgAlpha: 0,
            bgFill: mod.UIBgFill.None,
            children: [
                {
                    name: `OvertimeFlag_TitleShadow_${pid}`,
                    type: "Text",
                    position: [HUD_TEXT_SHADOW_OFFSET_X, 18 + HUD_TEXT_SHADOW_OFFSET_Y],
                    size: [OVERTIME_UI_WIDTH, 18],
                    anchor: mod.UIAnchor.TopCenter,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: STR_FLAG_TITLE,
                    textColor: [0, 0, 0],
                    textAlpha: 1,
                    textSize: 16,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    name: `OvertimeFlag_Title_${pid}`,
                    type: "Text",
                    position: [0, 18],
                    size: [OVERTIME_UI_WIDTH, 18],
                    anchor: mod.UIAnchor.TopCenter,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: STR_FLAG_TITLE,
                    textColor: [1, 1, 1],
                    textAlpha: 1,
                    textSize: 16,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    name: `OvertimeFlag_CountsLeft_${pid}`,
                    type: "Text",
                    position: [-OVERTIME_COUNT_OFFSET_X, OVERTIME_COUNT_OFFSET_Y],
                    size: [OVERTIME_COUNT_TEXT_WIDTH, OVERTIME_COUNT_TEXT_HEIGHT],
                    anchor: mod.UIAnchor.TopCenter,
                    visible: true,
                    padding: 0,
                    bgColor: OVERTIME_COUNT_T1_RGB,
                    bgAlpha: OVERTIME_COUNT_BG_ALPHA,
                    bgFill: mod.UIBgFill.Blur,
                    textLabel: mod.Message(STR_FLAG_COUNTS_LEFT_FORMAT, 0),
                    textColor: OVERTIME_COUNT_TEXT_RGB,
                    textAlpha: 1,
                    textSize: OVERTIME_COUNT_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    name: `OvertimeFlag_CountsRight_${pid}`,
                    type: "Text",
                    position: [OVERTIME_COUNT_OFFSET_X, OVERTIME_COUNT_OFFSET_Y],
                    size: [OVERTIME_COUNT_TEXT_WIDTH, OVERTIME_COUNT_TEXT_HEIGHT],
                    anchor: mod.UIAnchor.TopCenter,
                    visible: true,
                    padding: 0,
                    bgColor: OVERTIME_COUNT_T2_RGB,
                    bgAlpha: OVERTIME_COUNT_BG_ALPHA,
                    bgFill: mod.UIBgFill.Blur,
                    textLabel: mod.Message(STR_FLAG_COUNTS_RIGHT_FORMAT, 0),
                    textColor: OVERTIME_COUNT_TEXT_RGB,
                    textAlpha: 1,
                    textSize: OVERTIME_COUNT_TEXT_SIZE,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    name: `OvertimeFlag_PercentLeft_${pid}`,
                    type: "Container",
                    position: [-OVERTIME_PERCENT_OFFSET_X, OVERTIME_PERCENT_OFFSET_Y],
                    size: [OVERTIME_PERCENT_TEXT_WIDTH, OVERTIME_PERCENT_TEXT_HEIGHT],
                    anchor: mod.UIAnchor.TopCenter,
                    visible: true,
                    padding: 0,
                    bgColor: OVERTIME_COUNT_T1_RGB,
                    bgAlpha: OVERTIME_COUNT_BG_ALPHA,
                    bgFill: mod.UIBgFill.Blur,
                    children: [
                        {
                            name: `OvertimeFlag_PercentLeft_Text_${pid}`,
                            type: "Text",
                            position: [-OVERTIME_PERCENT_TEXT_NUDGE, 0],
                            size: [OVERTIME_PERCENT_TEXT_WIDTH, OVERTIME_PERCENT_TEXT_HEIGHT],
                            anchor: mod.UIAnchor.Center,
                            visible: true,
                            padding: 0,
                            bgAlpha: 0,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.Message(STR_FLAG_PROGRESS_FORMAT, 50),
                            textColor: OVERTIME_COUNT_TEXT_RGB,
                            textAlpha: 1,
                            textSize: OVERTIME_PERCENT_TEXT_SIZE,
                            textAnchor: mod.UIAnchor.CenterRight,
                        },
                    ],
                },
                {
                    name: `OvertimeFlag_PercentRight_${pid}`,
                    type: "Container",
                    position: [OVERTIME_PERCENT_OFFSET_X, OVERTIME_PERCENT_OFFSET_Y],
                    size: [OVERTIME_PERCENT_TEXT_WIDTH, OVERTIME_PERCENT_TEXT_HEIGHT],
                    anchor: mod.UIAnchor.TopCenter,
                    visible: true,
                    padding: 0,
                    bgColor: OVERTIME_COUNT_T2_RGB,
                    bgAlpha: OVERTIME_COUNT_BG_ALPHA,
                    bgFill: mod.UIBgFill.Blur,
                    children: [
                        {
                            name: `OvertimeFlag_PercentRight_Text_${pid}`,
                            type: "Text",
                            position: [OVERTIME_PERCENT_TEXT_NUDGE, 0],
                            size: [OVERTIME_PERCENT_TEXT_WIDTH, OVERTIME_PERCENT_TEXT_HEIGHT],
                            anchor: mod.UIAnchor.Center,
                            visible: true,
                            padding: 0,
                            bgAlpha: 0,
                            bgFill: mod.UIBgFill.None,
                            textLabel: mod.Message(STR_FLAG_PROGRESS_FORMAT, 50),
                            textColor: OVERTIME_COUNT_TEXT_RGB,
                            textAlpha: 1,
                            textSize: OVERTIME_PERCENT_TEXT_SIZE,
                            textAnchor: mod.UIAnchor.CenterLeft,
                        },
                    ],
                },
                {
                    name: `OvertimeFlag_CountsLeft_Crown_${pid}`,
                    type: "Image",
                    position: [-OVERTIME_PERCENT_OFFSET_X, OVERTIME_PERCENT_CROWN_OFFSET_Y],
                    size: [OVERTIME_COUNT_CROWN_SIZE, OVERTIME_COUNT_CROWN_SIZE],
                    anchor: mod.UIAnchor.TopCenter,
                    visible: false,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    imageType: mod.UIImageType.CrownSolid,
                    imageColor: OVERTIME_COUNT_CROWN_RGB,
                    imageAlpha: OVERTIME_COUNT_CROWN_ALPHA,
                },
                {
                    name: `OvertimeFlag_CountsRight_Crown_${pid}`,
                    type: "Image",
                    position: [OVERTIME_PERCENT_OFFSET_X, OVERTIME_PERCENT_CROWN_OFFSET_Y],
                    size: [OVERTIME_COUNT_CROWN_SIZE, OVERTIME_COUNT_CROWN_SIZE],
                    anchor: mod.UIAnchor.TopCenter,
                    visible: false,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    imageType: mod.UIImageType.CrownSolid,
                    imageColor: OVERTIME_COUNT_CROWN_RGB,
                    imageAlpha: OVERTIME_COUNT_CROWN_ALPHA,
                },
                {
                    name: `OvertimeFlag_StatusShadow_${pid}`,
                    type: "Text",
                    position: [HUD_TEXT_SHADOW_OFFSET_X, 54 + HUD_TEXT_SHADOW_OFFSET_Y],
                    size: [OVERTIME_UI_WIDTH, 16],
                    anchor: mod.UIAnchor.TopCenter,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: STR_FLAG_STATUS_STALLED,
                    textColor: [0, 0, 0],
                    textAlpha: 1,
                    textSize: 14,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    name: `OvertimeFlag_Status_${pid}`,
                    type: "Text",
                    position: [0, 54],
                    size: [OVERTIME_UI_WIDTH, 16],
                    anchor: mod.UIAnchor.TopCenter,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: STR_FLAG_STATUS_STALLED,
                    textColor: [1, 1, 1],
                    textAlpha: 1,
                    textSize: 14,
                    textAnchor: mod.UIAnchor.Center,
                },
                {
                    name: `OvertimeFlag_VehicleRequired_${pid}`,
                    type: "Text",
                    position: [0, 70],
                    size: [OVERTIME_UI_WIDTH, 14],
                    anchor: mod.UIAnchor.TopCenter,
                    visible: false,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: STR_FLAG_VEHICLE_REQUIRED,
                    textColor: [1, 1, 1],
                    textAlpha: 1,
                    textSize: 12,
                    textAnchor: mod.UIAnchor.Center,
                },
            ],
        });
    } catch {
        return undefined;
    }

    const root = safeFind(rootName);
    if (!root) return undefined;
    safeSetUIWidgetDepth(root, mod.UIDepth.AboveGameUI);

    const countsLeft = safeFind(`OvertimeFlag_CountsLeft_${pid}`);
    const countsRight = safeFind(`OvertimeFlag_CountsRight_${pid}`);

    const countsLeftBorderId = `OvertimeFlag_CountsLeft_Border_${pid}`;
    safeAddUIContainer(
        countsLeftBorderId,
        mod.CreateVector(-OVERTIME_COUNT_OFFSET_X, OVERTIME_COUNT_OFFSET_Y - OVERTIME_COUNT_BORDER_GROW, 0),
        mod.CreateVector(
            OVERTIME_COUNT_TEXT_WIDTH + (OVERTIME_COUNT_BORDER_GROW * 2),
            OVERTIME_COUNT_TEXT_HEIGHT + (OVERTIME_COUNT_BORDER_GROW * 2),
            0
        ),
        mod.UIAnchor.TopCenter,
        root,
        true,
        0,
        COLOR_BLUE,
        OVERTIME_COUNT_BORDER_ALPHA,
        mod.UIBgFill.OutlineThin,
        mod.UIDepth.AboveGameUI,
        player
    );
    const countsLeftBorder = safeFind(countsLeftBorderId);

    const countsRightBorderId = `OvertimeFlag_CountsRight_Border_${pid}`;
    safeAddUIContainer(
        countsRightBorderId,
        mod.CreateVector(OVERTIME_COUNT_OFFSET_X, OVERTIME_COUNT_OFFSET_Y - OVERTIME_COUNT_BORDER_GROW, 0),
        mod.CreateVector(
            OVERTIME_COUNT_TEXT_WIDTH + (OVERTIME_COUNT_BORDER_GROW * 2),
            OVERTIME_COUNT_TEXT_HEIGHT + (OVERTIME_COUNT_BORDER_GROW * 2),
            0
        ),
        mod.UIAnchor.TopCenter,
        root,
        true,
        0,
        COLOR_RED,
        OVERTIME_COUNT_BORDER_ALPHA,
        mod.UIBgFill.OutlineThin,
        mod.UIDepth.AboveGameUI,
        player
    );
    const countsRightBorder = safeFind(countsRightBorderId);

    const barBgId = `OvertimeFlag_BarBg_${pid}`;
    safeAddUIContainer(
        barBgId,
        mod.CreateVector(0, OVERTIME_BAR_OFFSET_Y, 0),
        mod.CreateVector(OVERTIME_BAR_WIDTH, OVERTIME_BAR_HEIGHT, 0),
        mod.UIAnchor.TopCenter,
        root,
        true,
        0,
        COLOR_BLUE_DARK,
        OVERTIME_BAR_BG_ALPHA,
        mod.UIBgFill.Solid,
        mod.UIDepth.AboveGameUI,
        player
    );
    const barBg = safeFind(barBgId);
    if (barBg) {
        const fillT1Id = `OvertimeFlag_BarFillT1_${pid}`;
        safeAddUIContainer(
            fillT1Id,
            mod.CreateVector(0, 0, 0),
            mod.CreateVector(OVERTIME_BAR_WIDTH, OVERTIME_BAR_HEIGHT, 0),
            mod.UIAnchor.TopLeft,
            barBg,
            true,
            0,
            COLOR_BLUE,
            OVERTIME_BAR_FILL_ALPHA,
            mod.UIBgFill.Solid,
            mod.UIDepth.AboveGameUI,
            player
        );

        const fillT2Id = `OvertimeFlag_BarFillT2_${pid}`;
        safeAddUIContainer(
            fillT2Id,
            mod.CreateVector(0, 0, 0),
            mod.CreateVector(OVERTIME_BAR_WIDTH, OVERTIME_BAR_HEIGHT, 0),
            mod.UIAnchor.TopRight,
            barBg,
            true,
            0,
            COLOR_RED,
            OVERTIME_BAR_FILL_ALPHA,
            mod.UIBgFill.Solid,
            mod.UIDepth.AboveGameUI,
            player
        );
    }

    const refs: OvertimeFlagHudRefs = {
        root,
        title: safeFind(`OvertimeFlag_Title_${pid}`),
        titleShadow: safeFind(`OvertimeFlag_TitleShadow_${pid}`),
        countsLeft,
        countsRight,
        countsLeftBorder,
        countsRightBorder,
        percentLeftBg: safeFind(`OvertimeFlag_PercentLeft_${pid}`),
        percentRightBg: safeFind(`OvertimeFlag_PercentRight_${pid}`),
        percentLeft: safeFind(`OvertimeFlag_PercentLeft_Text_${pid}`),
        percentRight: safeFind(`OvertimeFlag_PercentRight_Text_${pid}`),
        countsLeftCrown: safeFind(`OvertimeFlag_CountsLeft_Crown_${pid}`),
        countsRightCrown: safeFind(`OvertimeFlag_CountsRight_Crown_${pid}`),
        status: safeFind(`OvertimeFlag_Status_${pid}`),
        statusShadow: safeFind(`OvertimeFlag_StatusShadow_${pid}`),
        vehicleRequired: safeFind(`OvertimeFlag_VehicleRequired_${pid}`),
        barBg: barBg,
        barFillT1: safeFind(`OvertimeFlag_BarFillT1_${pid}`),
        barFillT2: safeFind(`OvertimeFlag_BarFillT2_${pid}`),
    };
    State.flag.uiByPid[pid] = refs;
    return refs;
}

// TODO(1.0): Unused; remove before final 1.0 release.
function ensureOvertimeGlobalHudForPlayer(player: mod.Player): OvertimeFlagGlobalHudRefs | undefined {
    // Global HUD: compact label + progress bar for out-of-zone players.
    // This stays lightweight so it can be shown to all out-of-zone players.
    if (!player || !mod.IsPlayerValid(player)) return undefined;
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return undefined;
    if (isPidDisconnected(pid)) return undefined;
    const rootName = `OvertimeGlobalRoot_${pid}`;
    const cached = State.flag.globalUiByPid[pid];
    if (cached && cached.root && safeFind(rootName)) return cached;

    try {
        modlib.ParseUI({
            name: rootName,
            type: "Container",
            playerId: player,
            anchor: mod.UIAnchor.TopCenter,
            position: [OVERTIME_GLOBAL_UI_OFFSET_X, OVERTIME_GLOBAL_UI_OFFSET_Y],
            size: [OVERTIME_GLOBAL_UI_WIDTH, OVERTIME_GLOBAL_UI_HEIGHT],
            visible: false,
            padding: 0,
            bgAlpha: 0,
            bgFill: mod.UIBgFill.None,
            children: [
                {
                    name: `OvertimeGlobal_Title_${pid}`,
                    type: "Text",
                    position: [0, 4],
                    size: [OVERTIME_GLOBAL_UI_WIDTH, 16],
                    anchor: mod.UIAnchor.TopCenter,
                    visible: true,
                    padding: 0,
                    bgAlpha: 0,
                    bgFill: mod.UIBgFill.None,
                    textLabel: STR_FLAG_TITLE,
                    textColor: [1, 1, 1],
                    textAlpha: 1,
                    textSize: 14,
                    textAnchor: mod.UIAnchor.Center,
                },
            ],
        });
    } catch {
        return undefined;
    }

    const root = safeFind(rootName);
    if (!root) return undefined;
    safeSetUIWidgetDepth(root, mod.UIDepth.AboveGameUI);

    const barBgId = `OvertimeGlobal_BarBg_${pid}`;
    safeAddUIContainer(
        barBgId,
        mod.CreateVector(0, OVERTIME_GLOBAL_BAR_OFFSET_Y, 0),
        mod.CreateVector(OVERTIME_GLOBAL_BAR_WIDTH, OVERTIME_GLOBAL_BAR_HEIGHT, 0),
        mod.UIAnchor.TopCenter,
        root,
        true,
        0,
        COLOR_BLUE_DARK,
        OVERTIME_BAR_BG_ALPHA,
        mod.UIBgFill.Solid,
        mod.UIDepth.AboveGameUI,
        player
    );
    const barBg = safeFind(barBgId);
    if (barBg) {
        const fillT1Id = `OvertimeGlobal_BarFillT1_${pid}`;
        safeAddUIContainer(
            fillT1Id,
            mod.CreateVector(0, 0, 0),
            mod.CreateVector(OVERTIME_GLOBAL_BAR_WIDTH, OVERTIME_GLOBAL_BAR_HEIGHT, 0),
            mod.UIAnchor.TopLeft,
            barBg,
            true,
            0,
            COLOR_BLUE,
            OVERTIME_BAR_FILL_ALPHA,
            mod.UIBgFill.Solid,
            mod.UIDepth.AboveGameUI,
            player
        );

        const fillT2Id = `OvertimeGlobal_BarFillT2_${pid}`;
        safeAddUIContainer(
            fillT2Id,
            mod.CreateVector(0, 0, 0),
            mod.CreateVector(OVERTIME_GLOBAL_BAR_WIDTH, OVERTIME_GLOBAL_BAR_HEIGHT, 0),
            mod.UIAnchor.TopRight,
            barBg,
            true,
            0,
            COLOR_RED,
            OVERTIME_BAR_FILL_ALPHA,
            mod.UIBgFill.Solid,
            mod.UIDepth.AboveGameUI,
            player
        );
    }

    const refs: OvertimeFlagGlobalHudRefs = {
        root,
        title: safeFind(`OvertimeGlobal_Title_${pid}`),
        barBg: barBg,
        barFillT1: safeFind(`OvertimeGlobal_BarFillT1_${pid}`),
        barFillT2: safeFind(`OvertimeGlobal_BarFillT2_${pid}`),
    };
    State.flag.globalUiByPid[pid] = refs;
    return refs;
}

//#endregion -------------------- Overtime Flag Capture - HUD Build + Cache --------------------



//#region -------------------- Overtime Flag Capture - Stage Transitions + Messaging --------------------

function updateOvertimeStage(): void {
    if (!isOvertimeModeEnabled()) {
        State.flag.tieBreakerEnabledThisRound = false;
        State.flag.trackingEnabled = false;
        State.flag.active = false;
        if (State.flag.stage !== OvertimeStage.None) {
            resetOvertimeFlagState();
        }
        setOvertimeAllFlagVisibility(true);
        return;
    }
    // Stage transitions are driven by the round clock.
    // Checks run from latest to earliest to tolerate admin time jumps.
    const helisSingleZone = isHelisOvertimeSingleZoneMode();
    const previewEnabled = computeTieBreakerEnabledForRound(
        State.round.current,
        State.round.max,
        State.admin.tieBreakerModeIndex
    );

    if (!isRoundLive()) {
        State.flag.tieBreakerEnabledThisRound = previewEnabled;
    }

    const tieBreakerEnabled = isRoundLive() ? isTieBreakerEnabledForRound() : previewEnabled;
    if (!tieBreakerEnabled) {
        if (State.flag.stage !== OvertimeStage.None) {
            resetOvertimeFlagState();
        }
        setOvertimeAllFlagVisibility(false);
        return;
    }
    if (!isRoundLive()) {
        if (!State.flag.configValid) return;
        if (helisSingleZone) {
            if (State.flag.stage < OvertimeStage.Visible) {
                if (!selectOvertimeZoneForRound()) return;
                State.flag.stage = OvertimeStage.Visible;
                State.flag.active = false;
                setOvertimeSectorsForSelected(State.flag.activeSectorId);
                setOvertimeCapturePointsForSelected(State.flag.activeCapturePointId);
                showOvertimeFlagPreviewIcon(true);
                refreshOvertimeUiVisibilityForAllPlayers();
                updateOvertimeHudForAllPlayers();
            }
        } else {
            // Pregame state: show all flag markers for planning (visibility only).
            setOvertimeAllFlagVisibility(true);
        }
        return;
    }

    if (!State.flag.configValid) return;

    const remaining = getRemainingSeconds();
    const visibleThreshold = getOvertimeVisibleSeconds();

    if (helisSingleZone) {
        if (State.flag.stage < OvertimeStage.Visible) {
            enterOvertimeVisibleStageSilent();
        }
        if (remaining <= OVERTIME_STAGE_ACTIVE_SECONDS) {
            if (State.flag.stage < OvertimeStage.Active) {
                enterOvertimeActiveStage(remaining);
            }
            updateOvertimeActivePreviewIconText();
        } else {
            updateOvertimeLockedPreviewIconText(remaining);
            maybeSendOvertimeUnlockReminder(remaining);
            updateOvertimeHudForAllPlayers();
        }
        return;
    }

    if (remaining <= OVERTIME_STAGE_ACTIVE_SECONDS) {
        if (State.flag.stage < OvertimeStage.Visible) {
            enterOvertimeVisibleStage(remaining);
        }
        if (State.flag.stage < OvertimeStage.Active) {
            enterOvertimeActiveStage(remaining);
        }
        updateOvertimeActivePreviewIconText();
        return;
    }
    if (remaining <= visibleThreshold) {
        if (State.flag.stage < OvertimeStage.Visible) {
            enterOvertimeVisibleStage(remaining);
        }
        updateOvertimeLockedPreviewIconText(remaining);
        maybeSendOvertimeUnlockReminder(remaining);
        // Keep locked-stage countdown text in sync while visible but inactive.
        updateOvertimeHudForAllPlayers();
        return;
    }
    if (remaining <= OVERTIME_STAGE_NOTICE_SECONDS) {
        if (State.flag.stage < OvertimeStage.Notice) {
            enterOvertimeNoticeStage(remaining);
        }
    }

}

function getOvertimeVisibleSeconds(): number {
    const roundLength = State.round.clock.roundLengthSeconds;
    const duration = (roundLength !== undefined && roundLength > 0)
        ? roundLength
        : (State.round.clock.durationSeconds ?? ROUND_START_SECONDS);
    return Math.max(0, Math.floor(duration / 2));
}

// TODO(1.0): Unused; remove before final 1.0 release.
function buildRemainingTimeMessage(messageKey: number, remainingSeconds: number): mod.Message {
    const time = getClockTimeParts(remainingSeconds);
    return mod.Message(messageKey, time.minutes, time.secTens, time.secOnes);
}

function getOvertimeUnlockSeconds(remainingSeconds?: number): number {
    const remaining = remainingSeconds !== undefined ? remainingSeconds : getRemainingSeconds();
    return Math.max(0, Math.floor(remaining - OVERTIME_STAGE_ACTIVE_SECONDS));
}

function updateOvertimeLockedPreviewIconText(remainingSeconds?: number): void {
    if (State.flag.stage < OvertimeStage.Visible || State.flag.stage >= OvertimeStage.Active) return;
    const icon = getActiveOvertimeWorldIcon();
    if (!icon) return;
    const letterKey = getActiveOvertimeFlagLetterKey();
    const unlockSeconds = getOvertimeUnlockSeconds(remainingSeconds);
    try {
        mod.SetWorldIconText(icon, mod.Message(STR_FLAG_TITLE_LOCKED_FORMAT, letterKey, unlockSeconds));
    } catch {
        return;
    }
}

function updateOvertimeActivePreviewIconText(): void {
    if (State.flag.stage < OvertimeStage.Active) return;
    const icon = getActiveOvertimeWorldIcon();
    if (!icon) return;
    try {
        mod.SetWorldIconText(icon, mod.Message(STR_FLAG_PREVIEW_ACTIVE));
    } catch {
        return;
    }
}

// TODO(1.0): Unused; remove before final 1.0 release.
function shouldShowOvertimeUnlockMessageForPlayer(player: mod.Player): boolean {
    const pid = safeGetPlayerId(player);
    if (pid === undefined || isPidDisconnected(pid)) return false;
    return State.flag.playersInZoneByPid[pid] === undefined;
}

function enterOvertimeNoticeStage(remainingSeconds: number): void {
    State.flag.stage = OvertimeStage.Notice;
    // NOTE: 2:30 notice message disabled (visibility now handled at half time).
    // void showDynamicGlobalTitleSubtitleMessageForAllPlayers(
    //     undefined,
    //     (remaining) => buildRemainingTimeMessage(STR_OVERTIME_SUB_NOTICE, remaining),
    //     COLOR_WHITE,
    //     COLOR_WHITE,
    //     BIG_MESSAGE_DURATION_SECONDS,
    //     1,
    //     SMALL_MESSAGE_LAYOUT
    // );
}

function enterOvertimeVisibleStageSilent(): void {
    if (!selectOvertimeZoneForRound()) return;
    State.flag.stage = OvertimeStage.Visible;
    State.flag.active = false;
    // Locked stage: use sector radius + preview icon; tracking stays on but capture remains inactive.
    setOvertimeSectorsForSelected(State.flag.activeSectorId);
    setOvertimeCapturePointsForSelected(State.flag.activeCapturePointId);
    showOvertimeFlagPreviewIcon(true);
    refreshOvertimeUiVisibilityForAllPlayers();
    updateOvertimeHudForAllPlayers();
}

function enterOvertimeVisibleStage(remainingSeconds: number): void {
    if (!selectOvertimeZoneForRound()) return;
    State.flag.stage = OvertimeStage.Visible;
    State.flag.active = false;
    // Locked stage: use sector radius + preview icon; tracking stays on but capture remains inactive.
    setOvertimeSectorsForSelected(State.flag.activeSectorId);
    setOvertimeCapturePointsForSelected(State.flag.activeCapturePointId);
    showOvertimeFlagPreviewIcon(true);
    refreshOvertimeUiVisibilityForAllPlayers();
    updateOvertimeHudForAllPlayers();
    const letterKey = getActiveOvertimeFlagLetterKey();
    const overrideUsed = State.flag.overrideUsedThisRound; // Admin override uses the red callout + text.
    void showGlobalTitleSubtitleMessageForAllPlayers(
        mod.Message(overrideUsed ? STR_OVERTIME_TITLE_VISIBLE_ADMIN : STR_OVERTIME_TITLE_VISIBLE, letterKey),
        undefined,
        overrideUsed ? COLOR_RED : COLOR_WHITE,
        overrideUsed ? COLOR_RED : COLOR_WHITE,
        BIG_MESSAGE_DURATION_SECONDS,
        SMALL_MESSAGE_LAYOUT
    );
}

function enterOvertimeActiveStage(remainingSeconds: number): void {
    if (!selectOvertimeZoneForRound()) return;
    State.flag.stage = OvertimeStage.Active;
    State.flag.active = true;
    // Active stage: capture logic + HUD enabled (AreaTrigger events are authoritative).
    setOvertimeSectorsForSelected(State.flag.activeSectorId);
    setOvertimeCapturePointsForSelected(State.flag.activeCapturePointId);
    showOvertimeFlagPreviewIcon(false);
    // Failsafe: refresh world-icon text on activation.
    updateOvertimeActivePreviewIconText();
    const letterKey = getActiveOvertimeFlagLetterKey();
    void showGlobalTitleSubtitleMessageForAllPlayers(
        mod.Message(STR_OVERTIME_SUB_UNLOCKS_NOW, letterKey),
        undefined,
        COLOR_WHITE,
        COLOR_WHITE,
        BIG_MESSAGE_DURATION_SECONDS,
        SMALL_MESSAGE_LAYOUT
    );
    startOvertimeCaptureLoop();
    refreshOvertimeUiVisibilityForAllPlayers();
}

function maybeSendOvertimeUnlockReminder(remainingSeconds: number): void {
    // Disabled: unlock reminder subtitle messages are currently hidden.
    return;
    if (State.flag.unlockReminderSent) return;
    const threshold = OVERTIME_STAGE_ACTIVE_SECONDS + OVERTIME_UNLOCK_REMINDER_SECONDS;
    if (remainingSeconds <= threshold) {
        State.flag.unlockReminderSent = true;
        const letterKey = getActiveOvertimeFlagLetterKey();
        void showDynamicGlobalTitleSubtitleMessageForAllPlayers(
            undefined,
            (remaining) => {
                const unlockSeconds = Math.max(0, Math.floor(remaining - OVERTIME_STAGE_ACTIVE_SECONDS));
                return mod.Message(STR_OVERTIME_SUB_UNLOCKS_IN, letterKey, unlockSeconds);
            },
            COLOR_WHITE,
            COLOR_WHITE,
            BIG_MESSAGE_DURATION_SECONDS,
            1,
            SMALL_MESSAGE_LAYOUT,
            shouldShowOvertimeUnlockMessageForPlayer
        );
    }
}

function resolveOvertimeWinnerAtClockExpiry(): TeamID | 0 | undefined {
    if (!isOvertimeModeEnabled()) return undefined;
    // At expiry, capture progress decides unless exactly neutral (0.5), which falls back to kills.
    if (!State.flag.configValid) return undefined;
    if (State.flag.progress > 0.5) return TeamID.Team1;
    if (State.flag.progress < 0.5) return TeamID.Team2;
    return undefined;
}

//#endregion -------------------- Overtime Flag Capture - Stage Transitions + Messaging --------------------
