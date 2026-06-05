# Helis-only Source Inventory (v0.630)

Source root: `bf6-portal/dev/helis-only/src/`. Total ~16,000 lines across 19 .ts files plus `strings.json`. All `.ts` files use `// @ts-nocheck` and are concatenated by `bf6-portal-bundler` into `dist/bundle.ts`, then heavily post-processed (see Section 8).

---

# 1. Helis-only Overall Architecture

**What it is.** A round-based, vehicle-only competitive game mode for BF6 Portal, originally a tank scoring mode and now expanded to support both tank and helicopter game modes ("Helis Only - BF6 Vanilla", "Helis Only - TWL Ladder", "Helis Only - TWL Practice", "Helis Only - TWL Custom", plus a tanks branch). It is a versus PvP mode (not training) used by Teamwarfare.net's "TWL" competitive ladder. Vehicles are the only scoring entity (infantry deaths ignored); a round ends when a team reaches the round-kill target or the round clock expires. A tie-breaker overtime objective (random A-G flag) becomes visible at half-time and active in the final minute.

**Player count target.** Configurable 1v1, 2v2, 3v3, 4v4 via matchup presets. `MATCHUP_PRESETS` drives spawner count + per-round kill target. Default is the configured ladder preset (in `config.ts`).

**Map count.** ~16 maps; full list in `MAP_CONFIGS` (`config.ts`). Each map has team1Base/team2Base anchors, tank spawn specs, optional heli spawn specs, overtime zones (A-G), and per-mode overtime letter overrides.

**Round flow.**
1. `OnGameModeStarted` -> map auto-detect via HQ positions -> apply MapConfig -> seed spawners -> enter `NotReady` phase, preview clock paused.
2. Players triple-tap interact to summon `InteractPoint` -> open Ready Dialog.
3. When all active players are READY (or auto-ready triggered), `tryAutoStartRoundIfAllReady` -> `startPregameCountdown` -> `startRound`.
4. `Live` phase: round clock counts down; vehicle destroys award round kills; overtime stage transitions (None -> Notice -> Visible -> Active) gated on remaining seconds.
5. Round end: kill-target reached, clock expiry (with optional overtime winner), or full overtime capture -> `endRound` -> 10s round-end dialog -> `scheduleRoundEndCleanup` (destroy all vehicles, undeploy all players, respawn vehicles, redeploy, hold) -> back to `NotReady` for next round.
6. Match end: when wins majority reached or max rounds played -> `scheduleFinalRoundVictory` -> victory dialog with rosters -> `mod.EndGameMode`.

**Core mechanics.** Rounds; vehicle-only kills; per-team registry; matchup presets; ready-up dialog with auto-ready; main-base ammo restock; team swap (single button); overtime/tie-breaker capture (vehicle-only); admin panel (clock/scores/rounds/overrides); position-debug HUD; soft aircraft ceiling enforcement; takeoff-limit warning; randomized half-time overtime zone with admin A-G override; pregame countdown with "over the line" message.

---

# 2. Complete File Map

| File | Lines | Purpose | Hot path? | @ts-nocheck? |
|------|------:|---------|-----------|--------------|
| [src/index.ts](src/index.ts) | 900 | Entry + all `On*` event handlers + match-start loop | Yes (Ongoing) | Yes |
| [src/types.ts](src/types.ts) | 652 | Enums, interfaces, gameplay constants, string-key consts, regVehicles globals | No | Yes |
| [src/config.ts](src/config.ts) | 515 | MapConfig table + spawn specs + overtime zones per map | No | Yes |
| [src/strings.ts](src/strings.ts) | 337 | Map helpers, heli/tank spawn resolver, UI widget ID prefix consts | No | Yes |
| [src/state.ts](src/state.ts) | 1193 | Core helpers, ID helpers, HUD type defs, GameState interface, `State` singleton, button builders | No (helpers used throughout) | Yes |
| [src/hud.ts](src/hud.ts) | 2878 | Top HUD build, victory dialog, round-end dialog, help text, win/round/kill counters | Yes (per-tick updates) | Yes |
| [src/vehicles.ts](src/vehicles.ts) | 639 | Portal array helpers, last-driver cache, vehicle registry, spawner slot system, kills HUD sync | Yes (spawn/destroy hot) | Yes |
| [src/overtime.ts](src/overtime.ts) | 2320 | Overtime zone selection, capture loop, in-zone HUD, stage transitions, admin tie-breaker | Yes (capture loop tick) | Yes |
| [src/clock.ts](src/clock.ts) | 421 | Round clock state, digit widget cache, per-player clock update, expiry handlers | Yes (1s loop) | Yes |
| [src/team-switch.ts](src/team-switch.ts) | 858 | Team-switch InteractPoint lifecycle, swap action, admin-panel button event router | No | Yes |
| [src/round-flow.ts](src/round-flow.ts) | 634 | `startRound` / `endRound`, round-end cleanup, match-end scheduling, broadcast helpers | No | Yes |
| [src/ready-dialog.ts](src/ready-dialog.ts) | 4302 | Ready dialog UI, admin panel, join prompt sequencing, aircraft ceiling enforcement, pregame countdown | No (but huge) | Yes |
| [src/utils.ts](src/utils.ts) | 105 | InteractMultiClickDetector class + main-base restock helpers | No | Yes |
| [src/header-file.ts](src/header-file.ts) | 50 | Version line + license + attribution (re-injected at top by postbuild) | No | Yes |
| [src/footer-file.ts](src/footer-file.ts) | 7 | EOF version line | No | Yes |
| [src/Changelog.ts](src/Changelog.ts) | 64 | Comment-only version history | No | Yes |
| [src/GamemodeDescription.ts](src/GamemodeDescription.ts) | 49 | Comment-only mode description + glossary | No | Yes |
| [src/ImprovementsPunchlist.ts](src/ImprovementsPunchlist.ts) | 27 | Comment-only TODO list (human-only) | No | Yes |
| [src/PortalNamingNotes.ts](src/PortalNamingNotes.ts) | 67 | Comment-only vehicle/map name reference | No | Yes |
| [src/foundation/modlib.ts](src/foundation/modlib.ts) | 13 | `import * as modlib from "modlib"` (re-inlined by postbuild) | No | Yes |

`src/strings.json` exists (~360 lines). Top-level: all under `twl.*`. Sections: `hud`, `roundEnd`, `roundStart`, `flagCapture`, `overtime`, `overLine`, `teams`, `maps`, `notifications`, `joinPrompt`, `readyDialog`, `adminPanel`, `teamSwitch`, `ui`, `victory`, `countdown`, `debug`, `messages`, `system`.

---

# 3. Per-File Function Inventory

## [src/index.ts](src/index.ts) (entry point - all `export`s here)

Region: Exported Event Handlers - Game Mode Start
- `OnGameModeStarted()` — async; map auto-detect, reset state, build HUDs, start spawner system + ceiling enforcement, run 1s outer loop (clock, overtime stage, takeoff check, auto-ready, kills HUD, victory dialog)

Region: Player Join + Leave
- `resetUiForPlayerOnJoin(player)` — clear stale title/subtitle/join-prompt widgets for a player
- `OnPlayerJoinGame(eventPlayer)` — async; init teamSwitchData, ensure HUD, set counters, second pass after team assignment, show join prompt
- `OnPlayerLeaveGame(eventNumber)` — disconnect cleanup: mark disconnected, remove interact point, drop per-pid state maps, refresh remaining viewers

Region: Player Deploy + Undeploy
- `deferForcedUndeploy(player, reason)` — async helper to undeploy on next tick
- `OnPlayerDeployed(eventPlayer)` — async; restore UI mode, gate by cleanup/liveRespawn, equip Supply Crates x2, set deployed/main-base, spawn team-switch interact point
- `OnPlayerUndeploy(eventPlayer)` — close dialog, remove interact point, hide overtime UI, show join prompt if applicable

Region: Player Loop + UI Inputs
- `OngoingPlayer(eventPlayer)` — per-player tick: spawn-disabled warning, interact-point removal check, warmup-build of Ready Dialog (once), triple-tap detection
- `OnPlayerInteract(eventPlayer, eventInteractPoint)` — open ready dialog via interact point
- `OnPlayerUIButtonEvent(eventPlayer, eventUIWidget, eventUIButtonEvent)` — route to join-prompt handler then team-switch button event

Region: Vehicle Entry + Exit
- `isVehicleEmptyForEntry(eventVehicle, enteringPlayer)` — true if no other occupied seats
- `OnPlayerEnterVehicle(eventPlayer, eventVehicle)` — register vehicle to team, handle theft/transfer, broadcast registration message, sync overtime occupancy. Note has `Code Cleanup: Known fragility` comment
- `OnPlayerExitVehicle(eventPlayer, eventVehicle)` — handleOvertimePlayerExitVehicle

Region: Vehicle Spawn + Destroy
- `OnVehicleSpawned(eventVehicle)` — async; bind to spawner slot, infer base team, force-replace default vehicle type, broadcast spawn
- `OnVehicleDestroyed(eventVehicle)` — async; spawn-camp gating, award round kill to opposing team, end-round trigger, broadcast

Region: Enter/Exit Triggers
- `OngoingCapturePoint(eventCapturePoint)` — keep capture-point suppression applied while in marker-only mode
- `OnPlayerEnterAreaTrigger(eventPlayer, eventAreaTrigger)` — overtime zone enter; main-base restock + flag
- `OnPlayerExitAreaTrigger(eventPlayer, eventAreaTrigger)` — overtime zone exit; main-base un-ready + restock

## [src/state.ts](src/state.ts)

Region: Core gameplay state helpers
- `getMatchWinsTeam(teamNum)` — debug read of engine GameModeScore
- `setMatchWinsTeam(teamNum, wins)` — write engine GameModeScore
- `shouldSendMessage(isGameplay, isHighlighted)` — gateway based on global flags
- `setUIInputModeForPlayer(player, enabled)` — toggle UIInputMode + cache pid flag
- `noteHighlightedMessageSent(messageKey?)` — debug counter bookkeeping
- `isRoundLive()` — `phase === Live`
- `hasPlayersOnTeam(team)` — guard message sends to populated teams
- `sendNotificationMessage(message, isGameplay, target?)` — gated DisplayNotificationMessage
- `sendHighlightedWorldLogMessage(message, isGameplay, target?, debugKey?)` — gated DisplayHighlightedWorldLogMessage
- `logCapturePointVisibilityDebug(messageKey)` — gated by `ENABLE_CP_VIS_DEBUG`
- `syncWinCountersHudFromGameModeScore()` — pull engine -> State.match -> HUD
- `endGameModeForTeamNum(teamNum)` — `mod.EndGameMode(team)`

Region: Shared ID helpers
- `getObjId(obj)` / `safeGetObjId(obj)` / `safeGetPlayerId(player)` / `isPidDisconnected(pid)`
- `getTeamNumber(team)` / `safeGetTeamNumberFromPlayer(player, fallback)`
- `isPlayerDeployed(player)` — reads State.players.deployedByPid
- `safeGetSoldierStateBool(player, stateKey, fallback)` / `safeGetSoldierStateVector(player, stateKey)` — both auto-flip deployedByPid on engine error
- `getTeamNameKey(teamNum)` — pulls from active MapConfig
- `opposingTeam(teamNum)`
- `safeFind(name)` — FindUIWidgetWithName double-try
- `addOutlinedButton(...)` — button with thin-outline container
- `addCenteredButtonText(...)` — text label sized to button
- `addRightAlignedLabel(...)` — modlib.ParseUI label
- `applyReadyDialogLabelTextColor(widget?)` / `applyAdminPanelLabelTextColor(widget?)`
- `refreshReadyDialogButtonTextForPid(player, pid, baseContainer)` — re-label ready/auto-ready/swap/cancel/bestOf/matchup/minPlayers/modeGame/modeSettings/vehiclesT1/vehiclesT2/confirm/reset buttons
- `safeFindPlayer(pid)` — resolve Player from pid

## [src/vehicles.ts](src/vehicles.ts)

Region: Portal Array Helpers
- `arrayContainsVehicle(arr, vehicle)` / `arrayRemoveVehicle(arr, vehicle)`

Region: Vehicle Ownership Tracking
- `getVehicleId(v)` / `getLastDriver(vehicle)` / `setLastDriver(vehicle, player)` / `popLastDriver(vehicle)` / `clearLastDriverByVehicleObjId(vehicleObjId)`

Region: Vehicle Registration
- `registerVehicleToTeam(vehicle, teamNum)` — remove from both, append to chosen
- `clearSpawnBaseTeamCache()` / `inferBaseTeamFromPosition(pos)`

Region: Vehicle Spawner System
- `configureVehicleSpawner(spawner, vehicleType)` — set vehicle, disable auto, set respawn/abandon/keep-alive
- `findVehicleById(vehicleId)` — linear scan of AllVehicles
- `addVehicleSpawnerSlot(teamId, slotNumber, spawnPos, spawnRot, vehicleType)` — spawn `RuntimeSpawn_Common.VehicleSpawner`, push slot record
- `getDesiredSpawnerCountsForPreset(presetIndex)` — derive desired slot counts (min 1 per team)
- `setSpawnerSlotEnabled(slotIndex, enabled)` — flip + bump enableToken
- `applySpawnerEnablementForMatchup(presetIndex, spawnOnEnable)` — sorted-by-slot enablement, queue spawns
- `queueSequentialSpawns(slotIndices)` / `runSequentialSpawns(slotIndices, token)` — async; token-cancellable
- `forceSpawnWithRetry(slotIndex)` — async; up to 20 attempts, 0.25s gap
- `scheduleBlockedSpawnRetry(slotIndex)` — async; one-shot delayed retry
- `scheduleRespawn(slotIndex, lastVehicleId)` — async; respect cleanup/round-live, run only in non-live, token-guarded
- `pollVehicleSpawnerSlots()` — async forever; 1s tick; respawn if vehicle vanished
- `applySpawnYawToVehicle(eventVehicle, slot)` — async; two `mod.Teleport` calls to enforce yaw (vehicle teleport)
- `bindSpawnedVehicleToSlot(eventVehicle, vehiclePos)` — active-spawn token bind then position fallback
- `findSpawnerSlotByPosition(spawnPos)` — first expecting slot within bind distance
- `startVehicleSpawnerSystem()` — async one-shot; spawn slots, startup cleanup of stray vehicles, kick initial spawns, start poll loop

Region: Kills HUD Sync
- `syncKillsHudFromTrackedTotals(_force)` — total kills text
- `syncRoundKillsHud(force = false)` — round kills text + crowns

## [src/overtime.ts](src/overtime.ts)

Region: Zone Config + Preview Icon
- `normalizeOvertimeZoneLetter(letter)` / `getOvertimeZoneIndexForLetter(letter)` / `getOvertimeZoneLettersForGameMode(gameModeKey)`
- `getConfirmedGameModeKey()` / `buildOvertimeZoneCandidatesForGameMode(gameModeKey)` / `isHelisOvertimeSingleZoneMode()`
- `refreshOvertimeZonesFromMapConfig()` / `validateOvertimeZoneSpecs(zones)` / `buildPortalNumberArray(values)`
- Letter helpers: `getOvertimeFlagLetterKeyForIndex` / `...ForCandidateIndex` / `getActiveOvertimeFlagLetterKey` / `getOvertimeFlagLetterTextFor*`
- `hideOvertimeFlagPreviewIcon()` / `getActiveOvertimeAreaTrigger()` (TODO unused) / `getActiveOvertimeWorldIcon()` / `showOvertimeFlagPreviewIcon(isLocked)`

Region: Marker Visibility + Suppression
- `getOvertimeCapturePointIds()` / `getAllOvertimeCapturePointIds()`
- `setOvertimeCapturePointsForAllHidden()` / `applyOvertimeCapturePointSuppression(cp)` / `setOvertimeCapturePointOwner(cp, teamId)`
- `hardResetOvertimeCapturePoints(ids)` / `configureOvertimeCapturePointTimes()` / `setOvertimeCapturePointMarkerVisible(id, visible)`
- `setOvertimeCapturePointsForSelected(selectedId?)` / `setOvertimeCapturePointsForAllVisible()`
- `setOvertimeSectorsForAllVisible()` / `setOvertimeSectorsForAllHidden()` / `hideAllOvertimeZoneMarkers()` / `setOvertimeAllFlagVisibility(visible)`
- `getActiveOvertimeCapturePoint()` / `isActiveOvertimeCapturePoint(cp)` / `setOvertimeSectorsForSelected(selectedId?)`

Region: Admin Panel Tie-Breaker + Live Respawn + Round Length Helpers
- `normalizeTieBreakerModeIndex(index)` / `getTieBreakerModeLabelKey()` / `getTieBreakerModeActionKey(index)`
- `syncAdminTieBreakerModeLabelForAllPlayers()` / `getAdminLiveRespawnLabelKey()` / `syncAdminLiveRespawnLabelForAllPlayers()`
- `clampRoundLengthSeconds(seconds)` / `getConfiguredRoundLengthSeconds()` / `syncAdminRoundLengthLabelForAllPlayers()`

Region: Selection + Overrides
- `isTieBreakerEnabledForRound()` / `computeTieBreakerEnabledForRound(round, max, modeIndex)` / `syncTieBreakerEnabledForCurrentRound()`
- `resetOvertimeSelectionForOverride()` / `selectOvertimeZoneForRound()` — one-shot selection
- `getActiveOvertimeSector()` (TODO unused) / `applyAdminTieBreakerOverride(selectedIndex)`

Region: Reset + State
- `resetOvertimeFlagState()` — hides UI, clears membership, hard-resets CPs
- `isRoundKillTargetReached()`

Region: Vehicle + Zone Membership Tracking
- `incrementOvertimeTeamVehicleCount(teamId)` / `decrementOvertimeTeamVehicleCount(teamId)`
- `addOvertimeVehicleOccupant(teamId, vid)` / `removeOvertimeVehicleOccupant(vid)`
- `syncOvertimePlayerVehicleState(player, entry)` — refresh which vehicle the in-zone player is in
- `handleOvertimePlayerEnterZone(eventPlayer)` / `handleOvertimePlayerExitZone(eventPlayer)`
- `handleOvertimePlayerLeaveById(playerId, allowHardDelete)` — disconnect/undeploy cleanup
- `handleOvertimePlayerEnterVehicle(eventPlayer, eventVehicle)` / `handleOvertimePlayerExitVehicle(eventPlayer, eventVehicle)`
- `handleOvertimeVehicleDestroyed(eventVehicle)`

Region: Capture Loop + Progress
- `stopOvertimeCaptureLoop()` / `startOvertimeCaptureLoop()` / `runOvertimeCaptureLoop(expectedToken)` — async tick
- `pruneOvertimeZoneMembership()` / `pruneOvertimeUiCaches()`
- `getOvertimeCaptureMultiplier(deltaAbs)` — 1x/2x/3x/4x by majority
- `updateOvertimeCaptureProgress()` — progress math + endRound trigger at 0/1
- `getOvertimeProgressPercent()` (TODO unused) / `getOvertimeDisplayPercents(progress)`

Region: HUD Update + Visibility
- `isOvertimeZoneTrackingEnabled()` / `shouldDeferDisconnectUiDeletes()`
- `updateOvertimeHudForAllPlayers()` / `updateOvertimeHudForPlayer(player)` — title/status/counts/bar
- `updateOvertimeGlobalHudForAllPlayers(force)` (TODO unused/deprecated)
- `refreshOvertimeUiVisibilityForAllPlayers()` / `refreshOvertimeUiVisibilityForPlayer(player)`
- `rebuildOvertimeUiForPlayer(player)` / `prewarmOvertimeHudForAllPlayers()` / `hideOvertimeUiForAllPlayers()`

Region: HUD Build + Cache
- `safeDeleteUiWidget(widget)` / `dropOvertimeUiRefsForPlayerId(pid)` / `deleteOvertimeUiForPlayerId(pid)`
- `ensureOvertimeHudForPlayer(player)` — large `modlib.ParseUI` build for title/counts/percents/crowns/status/bar
- `ensureOvertimeGlobalHudForPlayer(player)` (TODO unused/deprecated)

Region: Stage Transitions + Messaging
- `updateOvertimeStage()` — driven by remaining seconds; helis-single-zone special case
- `getOvertimeVisibleSeconds()` — half of round length
- `buildRemainingTimeMessage(messageKey, remainingSeconds)` (TODO unused)
- `getOvertimeUnlockSeconds(remainingSeconds?)` / `updateOvertimeLockedPreviewIconText(s?)` / `updateOvertimeActivePreviewIconText()`
- `shouldShowOvertimeUnlockMessageForPlayer(player)` (TODO unused)
- `enterOvertimeNoticeStage(s)` — NOTE: disabled (comment says "2:30 notice message disabled")
- `enterOvertimeVisibleStageSilent()` / `enterOvertimeVisibleStage(s)` / `enterOvertimeActiveStage(s)`
- `maybeSendOvertimeUnlockReminder(s)` — Disabled (early `return`); follows dead code path
- `resolveOvertimeWinnerAtClockExpiry()` — progress >/< 0.5 -> Team, else undefined (falls back to kills)

## [src/clock.ts](src/clock.ts)

Region: Match Clock - Update + State
- `ResetRoundClock(seconds)` — **exported**; reset round clock
- `setRoundClockPreview(seconds)` / `getRemainingSeconds()` / `adjustRoundClockBySeconds(deltaSeconds)` / `resetRoundClockToDefault()`
- `getRegisteredVehicleCount(teamNum)` / `updateAllPlayersClock()` — tick fire of expiry handlers + digit + crown updates

Region: Match Clock - UI Build + Cache Helpers
- `ensureClockUIAndGetCache(player)` — modlib.ParseUI for digit + round-state + round-live-help containers
- `buildDigit(part, pid, x, width)` / `buildColon(pid, x, width)` / `setDigitCached(widget, digit)` / `setColonCached(widget)` / `setClockColorCached(cacheEntry, color)`

## [src/round-flow.ts](src/round-flow.ts)

Region: Round Start/End Flow + State
- `broadcastStringKey(stringKey, arg0?, arg1?, arg2?)` — variadic broadcast wrapper
- `broadcastGameplayNotificationKey(...)` (TODO unused) / `broadcastGameplayHighlightedStringKey(...)` (TODO unused) / `broadcastHighlightedStringKey(...)`
- `setCleanupState(active, allowDeploy)` — flip + refresh help text
- `quiesceSpawnerSystemForCleanup()` — bump spawn tokens, disable slots
- `resetSpawnerSlotStateForCleanup()` / `clearVehicleCachesForCleanup()` / `areCleanupSpawnsReady()` / `isSpawnerSystemQuiescent()`
- `waitForCleanupSpawnsOrTimeout(expectedToken)` — async; 0.5s poll
- `scheduleRoundEndCleanup(expectedToken)` — async; lock -> quiesce -> destroy all vehicles -> per-player undeploy -> reset slots -> apply matchup -> wait -> deploy x2 -> hold
- `triggerFreshRoundSetup(triggerPlayer?)` — manual reset without scoring
- `scheduleFinalRoundVictory(expectedToken, winningTeamNum)` — async; hide round-end dialog -> 45s victory dialog
- `scheduleMatchEnd(expectedToken, winningTeamNum?)` — async; `mod.EndGameMode`
- `bindRoundClockExpiryToRoundEnd()` — push clock-expiry handler
- `startRound(_triggerPlayer?)` — flip phase to Live, reset counters, reset overtime, push HUD
- `endRound(_triggerPlayer?, freezeRemainingSeconds?, overrideWinnerTeamNum?)` — resolve win/tie, schedule cleanup or match-end

## [src/team-switch.ts](src/team-switch.ts)

Region: Team Switch Data + Config (interface defs only)

Region: Team Switch Interact Point
- `spawnTeamSwitchInteractPoint(eventPlayer)` — async; wait for ground then spawn `InteractPoint` 1.5m ahead
- `teamSwitchInteractPointActivated(eventPlayer, eventInteractPoint)` — open dialog, set UI input mode, consume triple-tap
- `removeTeamSwitchInteractPoint(eventPlayer)` — disable + unspawn
- `isVelocityBeyond(threshold, eventPlayer)` / `checkTeamSwitchInteractPointRemoval(eventPlayer)` — lifetime/velocity expiry
- `initTeamSwitchData(eventPlayer)`

Region: Team Switch Actions
- `forceUndeployPlayer(eventPlayer)` — async; double undeploy with 0.05s gap
- `processTeamSwitch(eventPlayer)` — SetTeam to opposite, SetRedeployTime to round-end delay, undeploy
- `deleteTeamSwitchUI(eventPlayer)` — hide-not-delete (caching)
- `closeReadyDialogForAllPlayers()` / `hardDeleteTeamSwitchUI(playerId)` — disconnect cleanup

Region: Team Switch UI + Tester Panel + Button Events
- `teamSwitchButtonEvent(eventPlayer, eventUIWidget, eventUIButtonEvent)` — gigantic switch over all dialog/admin/tester button IDs; calls into ready/auto-ready/swap/best-of/matchup/min-players/mode/vehicles/confirm/reset, plus admin: wins/kills/round-kills/target/ties/cur-round/clock-time/clock-reset/round-start/round-end/pos-debug/tie-breaker A-G/tie-breaker-mode/live-respawn/round-length

## [src/ready-dialog.ts](src/ready-dialog.ts) (largest file; covers Ready Dialog construction, admin panel construction, join prompt, aircraft ceiling, pregame countdown, big-title/subtitle messages)

Region: UI - Ready Up Dialog (construction)
- `setAdminPanelChildWidgetsVisible(playerId, visible)` — bulk toggle 40+ widget visibilities
- `deleteAdminPanelUI(playerId, deleteToggle)` / `ensureAdminPanelWidgets(eventPlayer, playerId)` — toggle button + container
- `createTeamSwitchUI(eventPlayer)` — ~1230-line builder for the full dialog (cached on second open)

Region: Admin Panel Build
- `buildAdminPanelWidgets(eventPlayer, adminContainer, playerId)` — builds all tester rows
- `addTesterRow(...)` / `addTesterRowWithValue(...)` / `addTesterResetButton(...)` / `addTesterActionButton(...)`
- `syncRoundKillsTargetTesterValueForAllPlayers()`

Region: Debug Positioning
- `ensurePositionDebugWidgets(player)` / `positionDebugLoop(player, expectedToken)` async / `setPositionDebugVisibleForPlayer(player, visible)`

Region: Ready Dialog Roster + Render
- `applyReadyDialogRowColors(...)` / `renderReadyDialogForViewer(eventPlayer, viewerPid)` / `renderReadyDialogForAllVisibleViewers()`
- `refreshReadyDialogRosterForViewer(viewer, viewerPlayerId)` — populates name/ready/base cells
- `updateReadyToggleButtonForViewer(viewer, pid)` / `updateAutoReadyToggleButtonForViewer(viewer, pid)`
- `updateBestOfRoundsLabelForPid(pid)` / `updateBestOfRoundsLabelForAllPlayers()`
- `updateReadyDialogMapLabelForPid(pid)` / `updateReadyDialogMapLabelForAllPlayers()`
- `updateReadyDialogModeConfigForPid(pid)` / `updateReadyDialogModeConfigForAllVisibleViewers()`

Region: Aircraft Ceiling
- `getAircraftSoftCeilingWorldY()` / `applyCustomAircraftCeilingHardLimiter()` — `mod.SetMaxAltitude`
- `getVehicleYawRad(vehicle)` / `isAircraftVehicle(vehicle)` / `updateSoftCeilingForVehicle(...)`
- `runAircraftCeilingSoftEnforcementLoop(expectedToken)` async / `startAircraftCeilingSoftEnforcementLoop()`
- `enableCustomAircraftCeiling()` / `disableCustomAircraftCeilingAndRestoreDefault()` / `syncAircraftCeilingFromMapConfig()`

Region: Game Mode Helpers
- `isReadyDialogGameModeVanilla/Ladder/Twl1v1/Custom/TwlPreset(gameModeKey)` / `getReadyDialogPresetPlayersPerSide(gameModeKey)`
- `shouldApplyCustomCeilingForGameMode/Config(...)` / `hasCustomCeilingOverride(ceilingValue)` / `ensureCustomGameModeForManualChange()`
- `isReadyDialogModePresetActive(gameModeKey)` / `applyReadyDialogModePresetForGameMode(gameModeKey)`
- `setReadyDialogGameModeIndex(nextIndex, applyPreset = true)` / `setReadyDialogAircraftCeiling(nextValue, _changedBy?)`
- `setReadyDialogVehicleIndexT1(nextIndex)` / `setReadyDialogVehicleIndexT2(nextIndex)` / `resetReadyDialogVehicleOverrides()` / `confirmReadyDialogModeConfig(changedBy?)`

Region: Team / Matchup / Settings Sync
- `updateTeamNameWidgetsForPid/ForAllPlayers()` / `updateMatchupLabelForPid/ForAllPlayers()`
- `getAutoStartMinPlayerCounts()` / `updateMatchupReadoutsForPid/ForAllPlayers()`
- `updateSettingsSummaryHudForPid/ForAllPlayers()` / `setAutoStartMinActivePlayers(value, eventPlayer?)`
- `applyMatchupPresetInternal(...)` / `applyMatchupPreset(index, eventPlayer)` / `refreshReadyDialogForAllVisibleViewers()`

Region: Join Prompt
- Name helpers: `joinPromptRootName/PanelName/TitleName/BodyName/ButtonName/ButtonBorderName/ButtonTextName/NeverShowButtonName/NeverShowButtonBorderName/NeverShowButtonTextName(pid)`
- `deleteJoinPromptWidget(name)` / `isJoinPromptSuppressedForPlayer(pid)` / `setJoinPromptSuppressedForPlayer(pid)`
- `shouldShowJoinPromptForPlayer(player)` / `ensureJoinPromptStateForPid(pid)` / `markJoinPromptReadyDialogOpened(pid)`
- `armJoinPromptTripleTapForPid(pid)` / `consumeJoinPromptTripleTapForPid(pid)`
- `isJoinPromptBodyKeySkipped(key)` / `findNextJoinPromptSequenceIndex(startIndex)` / `getJoinPromptSequenceIndexForPid(pid)`
- `getJoinPromptBodyKeyForPid(pid)` / `getJoinPromptDismissLabelKeyForPid(pid)` / `shouldShowJoinPromptNeverShowButtonForPid(pid)`
- `advanceJoinPromptSequenceOnDismiss(pid)` / `createJoinPromptForPlayer(player)` — ~200-line UI build
- `canEnableDeployAfterJoinPrompt()` / `dismissJoinPromptForPlayer(player)` / `clearJoinPromptForPlayerId(playerId)`
- `tryHandleJoinPromptButton(eventPlayer, eventUIWidget, eventUIButtonEvent)`

Region: Ready State + Auto-Ready
- `resetReadyStateForAllPlayers()` / `isPlayerInMainBaseForReady(pid)`
- `showOverTakeoffMessageForAllPlayers(offender)` async / `checkTakeoffLimitForAllPlayers()`
- `applyAutoReadyForPid(player, pid)` / `applyAutoReadyForAllPlayers()`
- `getActivePlayers()` / `buildRosterDisplayEntries(players, debugCount)` / `getRosterDisplayEntries()` / `getRosterEntryNameMessage(entry?)`
- `areAllActivePlayersReady()`

Region: Pregame Countdown + Over-the-Line Message
- `ensureCountdownUIAndGetWidget(player)` / `setPregameCountdownVisualForAllPlayers(...)` / `setPregameCountdownSizeForAllPlayers(size)` / `hidePregameCountdownForAllPlayers()`
- `ensureOverLineTitleShadowUIAndGetWidget(player)` / `ensureOverLineSubtitleShadowUIAndGetWidget(player)` / `ensureOverLineTitleUIAndGetWidget(player)` / `ensureOverLineSubtitleUIAndGetWidget(player)`
- `cancelPregameCountdown()` / `hideBigTitleSubtitleMessageForPlayer(pid)` / `showOverLineMessageForAllPlayers(offender)` async
- `renderBigTitleSubtitleMessageForAllPlayers(...)` / `hideBigTitleSubtitleMessageForAllPlayers()`
- `showGlobalTitleSubtitleMessageForAllPlayers(...)` async / `showDynamicGlobalTitleSubtitleMessageForAllPlayers(...)` async
- `showRoundStartMessageForAllPlayers(durationSeconds?)` async
- `startPregameCountdown(triggerPlayer?, force?)` / `isPregameCountdownStillValid(...)` / `getPregameCountdownColor(value)`
- `animatePregameCountdownSize(...)` async / `runPregameCountdown(expectedToken, triggerPlayer?, force?)` async
- `tryAutoStartRoundIfAllReady(triggerPlayer?)` / `swapPlayerTeam(eventPlayer)`

## [src/hud.ts](src/hud.ts)

Helpers (top of file): `setCounterText`, `setRoundRecordText`, `getTrendingWinnerTeam`, `setTrendingWinnerCrownForRefs`, `setTrendingWinnerCrownForAllPlayers`, `setAdminPanelActionCountText`, `setRoundStateText`, `setRoundLiveHelpText`, `getRoundKillsLabelRound`, `setRoundKillsLabelTextForRefs`, `getClockTimeParts`

Safe-wrap helpers: `safeSetUIWidgetVisible`, `safeSetUITextLabel`, `safeSetUITextColor`, `safeSetUIWidgetDepth`, `safeAddUIContainer`, `safeSetUIWidgetSize`, `setWidgetVisible`, `setWidgetText`

HUD root / spawn-disabled warning: `ensureTopHudRootForPid`, `setHudHelpDepthForPid`, `reparentSpawnDisabledLiveTextForPid`, `ensureSpawnDisabledLiveText`, `setSpawnDisabledLiveTextVisibleForPlayer/ForAllPlayers`, `isLiveRespawnDisabled`, `updateSpawnDisabledWarningForPlayer/ForAllPlayers`

Round state / ready HUD: `setRoundStateTextForAllPlayers`, `updatePlayersReadyHudTextForAllPlayers`, `getReadyCountsForMessage`

Victory dialog: `getElapsedHmsParts`, `setVictoryWinnerCrownForRefs`, `updateVictoryDialogRosterSizing`, `computeTeamOutcomeKey`, `updateVictoryDialogForPlayer`, `updateVictoryDialogForAllPlayers`

Round-win crown + round-end dialog: `setRoundWinCrownForRefs/ForAllPlayers`, `setRoundEndDialogVisibleForAllPlayers`, `isRoundEndUiLockdownActive`, `isRoundEndDetailDrawReason`, `getRoundEndDetailForViewer`, `updateRoundEndDialogForAllPlayers/ForPlayer`

Help text: `isTeamSwitchDialogOpenForPid`, `updateHelpTextVisibilityForPid/ForPlayer/ForAllPlayers`

`ensureHudForPlayer(player)` — line 936, runs to line 2748, the mega-function that builds the top HUD (left panel, right panel, score banner, kills, win counters, crowns, victory dialog, round-end dialog, settings summary, spawn-disabled warning, help/ready containers, vehicles-alive text, etc). Comment in file: `Code Cleanup: This is an absurd mega-function - we should refactor and break down`.

Counter setters: `setHudRoundCountersForAllPlayers`, `setHudWinCountersForAllPlayers`, `syncRoundRecordHudForAllPlayers`, `adjustMatchTiesForBothTeams`, `updateAdminPanelActionCountForAllPlayers`, `handleAdminPanelAction`

Legacy cleanup: `deleteLegacyScoreRootForPlayer`, `deleteLegacyScoreRootsForAllPlayers`

## [src/strings.ts](src/strings.ts)

- `getMapNameKey(mapKey)` / `isHeliGameMode(gameModeKey)` — TWL_Ladder/Practice/Custom share the heli check
- `buildHeliSpawnsFromTankSpawns(spawns, team)` — auto-derives heli specs from tank specs (slot 3 = transport, else attack)
- `resolveHeliSpawnsForTeam(cfg, team)` / `getReadyDialogVehicleListByIndex(index)` / `applyVehicleOverrideToSpawns(spawns, vehicle)`
- `refreshVehicleSpawnSpecsFromModeConfig()` / `applyVehicleSpawnSpecsToExistingSlots()` — re-tags existing slot vehicleType
- `applyMapConfig(mapKey)` — set ACTIVE_MAP_*, ceiling, overtime zones, refresh UI
- `detectMapKeyFromHqs()` — bidirectional distance check
- `findMatchupPresetIndex(leftPlayers, rightPlayers, roundKillsTarget)`

Bottom half is widget ID prefix constants only (no functions).

## [src/team-switch.ts](src/team-switch.ts) - already covered above

## [src/utils.ts](src/utils.ts)
- `class InteractMultiClickDetector` — static `checkMultiClick(player)`; 2000ms window, 3 clicks
- `IsPlayerInOwnMainBase(player, areaTrigger)` / `BroadcastMainBaseEvent(messageKey, arg0?, arg1?)` / `NotifyAmmoRestocked(player)` / `RestockGadgetAmmo(player, magAmmo)`

## [src/foundation/modlib.ts](src/foundation/modlib.ts)
- `import * as modlib from "modlib"` — postbuild re-inlines this file

---

# 4. State Shape

```
const State: GameState = {
  round: {
    current: number, max: number, killsTarget: number,
    autoStartMinActivePlayers: number, matchupPresetIndex: number,
    lastMatchupChangeAtSeconds: number,
    modeConfig: ReadyDialogModeConfig {  // see types.ts
      gameModeIndex, aircraftCeiling, aircraftCeilingOverridePending,
      vehicleIndexT1, vehicleIndexT2, gameMode, gameSettings,
      vehiclesT1, vehiclesT2,
      confirmed: { gameMode, gameSettings, vehiclesT1/T2,
        aircraftCeiling, aircraftCeilingOverrideEnabled,
        vehicleIndexT1/T2, vehicleOverrideEnabled }
    },
    phase: RoundPhase {NotReady|Live|GameOver},
    lastWinnerTeam: TeamID|0,
    lastEndDetailReason: RoundEndDetailReason,
    lastObjectiveProgress: number,
    clock: { durationSeconds, roundLengthSeconds,
      matchStartElapsedSeconds?, pausedRemainingSeconds?, isPaused,
      lastDisplayedSeconds?, lastLowTimeState?, expiryFired,
      expiryHandlers: Array<() => void> },
    flow: { roundEndRedeployToken, clockExpiryBound, cleanupActive,
      cleanupAllowDeploy, roundEndDialogVisible, roundEndUiLockdown },
    countdown: { isActive, isRequested, token, overLineMessageToken },
    aircraftCeiling: { mapDefaultHudCeiling, hudMaxY, hudFloorY,
      customEnabled, enforcementToken,
      vehicleStates: Record<number, AircraftCeilingVehicleState> }
  },
  flag: {  // overtime
    stage: OvertimeStage {None|Notice|Visible|Active},
    active, trackingEnabled, unlockReminderSent, configValid,
    overrideUsedThisRound, tieBreakerEnabledThisRound,
    candidateZones: OvertimeZoneCandidate[],
    activeAreaTriggerId?, activeAreaTrigger?, activeSectorId?, activeSector?,
    activeWorldIconId?, activeWorldIcon?, activeCapturePointId?, activeCapturePoint?,
    activeCandidateIndex?, selectedZoneLetterKey?,
    ownerTeam: TeamID|0, progress: number, t1Count, t2Count,
    playersInZoneByPid: Record<number, OvertimeFlagPlayerZoneState>,
    vehicleOccupantsByVid: Record<number, number>,
    vehicleTeamByVid: Record<number, TeamID>,
    lastUiSnapshotByPid: Record<number, OvertimeFlagUiSnapshot>,
    lastGlobalProgressPercent, lastMembershipPruneAtSeconds,
    uiByPid: Record<number, OvertimeFlagHudRefs>,
    globalUiByPid: Record<number, OvertimeFlagGlobalHudRefs>,
    tickToken, tickActive
  },
  scores: { t1RoundKills, t2RoundKills, t1TotalKills, t2TotalKills },
  match: { winsT1, winsT2, lossesT1, lossesT2, tiesT1, tiesT2,
    isEnded, victoryDialogActive, winnerTeam?,
    endElapsedSecondsSnapshot, victoryStartElapsedSecondsSnapshot,
    flow: { matchEndDelayToken } },
  admin: { actionCount, debugLoopActive, tieBreakerOverrideIndex?,
    tieBreakerOverrideUsed, tieBreakerModeIndex, liveRespawnEnabled },
  debug: { highlightedMessageCount, lastHighlightedMessageAtSeconds,
    lastHighlightedMessageKey },
  players: {
    teamSwitchData: Record<number, teamSwitchData_t>,
    readyByPid, autoReadyByPid, readyMessageCooldownByPid,
    joinPromptShownByPid, joinPromptNeverShowByPidMap (per-map),
    joinPromptReadyDialogOpenedByPid, joinPromptTipIndexByPid,
    joinPromptTipsUnlockedByPid, joinPromptTripleTapArmedByPid,
    inMainBaseByPid, overTakeoffLimitByPid, deployedByPid,
    disconnectedByPid, uiInputEnabledByPid, spawnDisabledWarningVisibleByPid
  },
  vehicles: {
    slots: VehicleSpawnerSlot[],
    vehicleToSlot: Record<number, number>,
    spawnSequenceToken, spawnSequenceInProgress,
    activeSpawnSlotIndex?, activeSpawnToken?, activeSpawnRequestedAtSeconds?,
    configReady, startupCleanupDone
  },
  hudCache: {
    lastHudScoreT1/T2, lastHudRoundKillsT1/T2,
    hudByPid: Record<number, HudRefs>,
    clockWidgetCache: Record<number, ClockWidgetCacheEntry>,
    countdownWidgetCache: Record<number, CountdownWidgetCacheEntry>,
    overLineTitleWidgetCache/SubtitleWidgetCache/TitleShadowWidgetCache/SubtitleShadowWidgetCache
  }
};
```

**Other top-level module state caches** (file-scope `let`/`const`):
- `regVehiclesTeam1` / `regVehiclesTeam2` — global engine variables (`mod.GetVariable` / `SetVariable`) holding Portal arrays of registered vehicles
- `vehIds: number[]` / `vehOwners: mod.Player[]` — parallel-array last-driver cache (`types.ts`)
- `vehicleSpawnBaseTeamByObjId: Record<number, TeamID>` — cached inferred base team per spawned vehicle
- `ACTIVE_MAP_KEY: MapKey`, `ACTIVE_MAP_CONFIG: MapConfig`, `MAIN_BASE_TEAM1_POS`, `MAIN_BASE_TEAM2_POS`, `VEHICLE_SPAWN_YAW_OFFSET_DEG`, `ACTIVE_OVERTIME_ZONES`, `TEAM1_VEHICLE_SPAWN_SPECS`, `TEAM2_VEHICLE_SPAWN_SPECS` — mutated by `applyMapConfig` / `refreshVehicleSpawnSpecsFromModeConfig`
- `InteractMultiClickDetector.STATES: Record<number, {lastIsInteracting, clickCount, sequenceStartTime}>` — static per-player triple-tap state in `utils.ts`

---

# 5. Event Handler Inventory (entry points)

All in [src/index.ts](src/index.ts):

| Handler | Trigger | What it does (in ~10 words) |
|---------|---------|----------------------------|
| `OnGameModeStarted()` | Engine: gamemode start | Map detect, reset state, spawner system, 1s ticker loop |
| `OnPlayerJoinGame(eventPlayer)` | Engine: player connects | Init per-pid state, build HUD, populate counters, show join prompt |
| `OnPlayerLeaveGame(eventNumber)` | Engine: player disconnects | Mark disconnected, drop UI widgets, refresh remaining viewers |
| `OnPlayerDeployed(eventPlayer)` | Engine: player deploys | Gate by cleanup/liveRespawn, equip Supply Crate x2, spawn interact point |
| `OnPlayerUndeploy(eventPlayer)` | Engine: player undeploys | Close dialog, remove interact point, hide overtime UI, maybe show join prompt |
| `OngoingPlayer(eventPlayer)` | Engine: per-player tick | Spawn-disabled warning, dialog warmup build, triple-tap detection |
| `OnPlayerInteract(eventPlayer, eventInteractPoint)` | Engine: interact with `InteractPoint` | Open ready dialog |
| `OnPlayerUIButtonEvent(...)` | Engine: UI button click | Route to join-prompt then team-switch button event router |
| `OnPlayerEnterVehicle(...)` | Engine: vehicle entry | Register/transfer vehicle to entering team, broadcast, sync overtime |
| `OnPlayerExitVehicle(...)` | Engine: vehicle exit | Update overtime vehicle occupancy |
| `OnVehicleSpawned(eventVehicle)` | Engine: vehicle spawn | Bind to spawner slot, force-replace default vehicle, register to base team |
| `OnVehicleDestroyed(eventVehicle)` | Engine: vehicle destroyed | Award round kill to opposing team (if live + not spawn-camp), end round if target |
| `OngoingCapturePoint(eventCapturePoint)` | Engine: per-capture-point tick | Re-apply suppression on active overtime CP |
| `OnPlayerEnterAreaTrigger(eventPlayer, eventAreaTrigger)` | Engine: enter area trigger | Overtime zone enter; main-base entry sets flag + ammo restock |
| `OnPlayerExitAreaTrigger(eventPlayer, eventAreaTrigger)` | Engine: exit area trigger | Overtime zone exit; main-base exit forces NOT READY + ammo restock |

---

# 6. Improvements / TODOs Lifted From The Code

## Full contents of [src/ImprovementsPunchlist.ts](src/ImprovementsPunchlist.ts)

> List of improvements (for only humans and not LLMs, CODEX or GPT to design and implement):
> - Code Cleanup: Gut unused functions / commented out functions from script file (done?)
> - Code Cleanup: Address things like renderReadyDialogForAllVisibleViewers vs refreshReadyDialogForAllVisibleViewers (overlap/duplication?)
> - Code Cleanup: The UI patterns are bonkers. We dont need unique functions for single message strings? can we simplify this type of pattern: NotifyAmmoRestocked(eventPlayer);
> - Code Cleanup: There are many various functions which generally do the same thing, can we consider how to unify UI updates/refreshes or use TS template UI library (major refactor)
>
> List of Nice to Haves (for only humans and not LLMs, CODEX or GPT to design and implement):
> - UI Polish: Add "Respawn in 10s..." message synced with clock to appear in place at top in yellow instead of "ready up" dialog, during the window of round ending
> - UI Polish: Restart in Xs still rolls over on top match clock
> - SFX Polish: Add sound effects for ready up, round start countdown, round end display, victory display
> - SFX Polish: Add sound effect on vehicle registration
> - SFX Polish: Add sound effect on vehicle destruction for scoring
> - SFX Polish: Add sound effect for capturing flags
>
> List of Spatial Data bugs to address:
> - Defense Nexus: prevent tanks from getting stuck under semi-trailers (e.g. near north main base)

## TODO / FIXME / Cleanup grep results (deduplicated, source-of-truth)

### `TODO(1.0): Unused; remove before final 1.0 release.` — 10 occurrences
- [src/round-flow.ts:34](src/round-flow.ts) `broadcastGameplayNotificationKey`
- [src/round-flow.ts:51](src/round-flow.ts) `broadcastGameplayHighlightedStringKey`
- [src/overtime.ts:175](src/overtime.ts) `getActiveOvertimeAreaTrigger`
- [src/overtime.ts:621](src/overtime.ts) `getActiveOvertimeSector`
- [src/overtime.ts:1124](src/overtime.ts) `getOvertimeProgressPercent`
- [src/overtime.ts:1392](src/overtime.ts) `updateOvertimeGlobalHudForAllPlayers`
- [src/overtime.ts:1957](src/overtime.ts) `ensureOvertimeGlobalHudForPlayer`
- [src/overtime.ts:2175](src/overtime.ts) `buildRemainingTimeMessage`
- [src/overtime.ts:2210](src/overtime.ts) `shouldShowOvertimeUnlockMessageForPlayer`
- [src/ready-dialog.ts:2269/2289/2298/2315/2361](src/ready-dialog.ts) `applyCustomAircraftCeilingHardLimiter` and three following helpers; also `mod.Teleport` cleanup helper
- [src/ready-dialog.ts:2609](src/ready-dialog.ts) `resetReadyDialogVehicleOverrides` — also tagged "Deprecated by Fresh Respawn Setup button"

### `Code Cleanup:` — comments
- [src/hud.ts:931](src/hud.ts) — "This is an absurd mega-function - we should refactor and break down" (the `ensureHudForPlayer` body)
- [src/hud.ts:1868](src/hud.ts) — "Need to reduce redundant comments, and when manually adjusting position/sizes update directions"
- [src/hud.ts:2859](src/hud.ts) — "Is this still needed???" (legacy score root cleanup)
- [src/index.ts:440](src/index.ts) — "Known fragility - we need to refactor or identify a different method entirely as OnPlayerEnterVehicle is error prone"
- [src/utils.ts:6](src/utils.ts) — "Refactor this reference and use TS Template as a tool import during bundling"
- [src/ready-dialog.ts:2024](src/ready-dialog.ts) — "Overlaps with refreshReadyDialogForAllVisibleViewers; consider consolidating to one entrypoint"

### `Consider hardening:` — comments
- [src/vehicles.ts:280](src/vehicles.ts) — "If a spawn sequence stalls, spawnSequenceInProgress can remain true and block matchup changes"
- [src/vehicles.ts:290](src/vehicles.ts) — "Tight maps are vulnerable if a delayed spawn arrives after the token window; fallback binding may mis-bind"
- [src/vehicles.ts:552](src/vehicles.ts) — "Consider Hardening with a second cleanup pass before first forced spawns if default spawns reappear after cleanup"

### `WARNING:` — comments
- [src/vehicles.ts:528](src/vehicles.ts) — "This should run once per match; duplicate runs can create extra spawners/slots" (in `startVehicleSpawnerSystem`)

### `Bug:` / "bug" mentions
- [src/team-switch.ts:594](src/team-switch.ts) — "rebuild container + widgets fresh each time (low cost; avoids duplicate draw bugs)"
- [src/types.ts:172](src/types.ts) — "Vehicle spawner backend logic. These are quite particular, changing can cause bugs"
- [src/Changelog.ts:21](src/Changelog.ts) — `v0.538: ... fixed disconnect Bugs, map crash bugs and UI inconsistencies`
- [src/Changelog.ts:51-52](src/Changelog.ts) — historical mentions
- [src/Changelog.ts:59](src/Changelog.ts) — `v0.148: enum/interface refactor bugs`

### Other relevant inline notes
- [src/overtime.ts:175](src/overtime.ts) — `getActiveOvertimeAreaTrigger` marked unused
- [src/overtime.ts:2289-2310](src/overtime.ts) — `maybeSendOvertimeUnlockReminder` is intentionally disabled (early `return` before any logic runs)
- [src/overtime.ts:2219-2228](src/overtime.ts) — `enterOvertimeNoticeStage` body commented out: "2:30 notice message disabled (visibility now handled at half time)"
- [src/team-switch.ts:350-353](src/team-switch.ts) — "Deprecated UI (v0.5): Team 1 / Team 2 buttons removed from the dialog. This handler path is intentionally retained..."
- [src/team-switch.ts:562-564](src/team-switch.ts) — "Deprecated UI (v0.5): 'DONT SHOW AGAIN' button removed from the dialog"

---

# 7. Banned / Risky Patterns Found

| Pattern | Found? | Location(s) |
|---------|--------|-------------|
| `mod.AddUIIcon` | **No** | (none) |
| `mod.ForcePlayerToSeat` | **No** | (none) |
| `FEATURE_PERF_DIAG` | **No** | (none) |
| `console.log` | **No** | (none) |
| Raw string literal in `mod.Message("literal")` | **No raw strings found**; every `mod.Message` call uses a `STR_*` const or `mod.stringkeys.twl.*` key | — |

## `mod.Teleport` usage (3 sites, all vehicle-only, none in player-deploy context)

| Location | Context | Risk assessment |
|----------|---------|-----------------|
| [src/vehicles.ts:452-454](src/vehicles.ts) | `applySpawnYawToVehicle` — vehicle teleported twice (0-tick gap) to enforce spawn yaw. Called from `bindSpawnedVehicleToSlot` immediately after spawn. | Vehicle teleport at spawn time only; not the banned "player teleport before ForcePlayerToSeat" pattern. |
| [src/ready-dialog.ts:2357](src/ready-dialog.ts) | `updateSoftCeilingForVehicle` — vehicle teleported back down when over the soft aircraft ceiling. | Vehicle (not player), ceiling enforcement, not deploy-related. |

No `mod.Teleport(player, ...) + mod.ForcePlayerToSeat(...)` pattern exists. Safe.

## Non-ASCII characters in `src/*.ts`

Found in many files: em-dash (U+2014) inside `// Module: ...` and `// Module Name — description` header comments. Examples in [src/clock.ts:2](src/clock.ts), [src/config.ts:2](src/config.ts), [src/hud.ts:2](src/hud.ts), [src/overtime.ts:2](src/overtime.ts), [src/round-flow.ts:2](src/round-flow.ts), [src/state.ts:2](src/state.ts), [src/ready-dialog.ts:2](src/ready-dialog.ts), [src/strings.ts:2](src/strings.ts), [src/team-switch.ts:2](src/team-switch.ts), [src/utils.ts:2](src/utils.ts), [src/vehicles.ts:2](src/vehicles.ts), [src/foundation/modlib.ts:2](src/foundation/modlib.ts).

**Safe by construction**: the postbuild step 4 strips every `// Module: ...` line before the postbuild step 11.5 non-ASCII guardrail runs. Headers and footers are then re-injected from `header-file.ts` / `footer-file.ts`, both of which are ASCII-only.

---

# 8. Versioning / Build Setup

## Current version
- **v0.630** (May 24, 2026, 23:55 UTC) per `header-file.ts:4` and `footer-file.ts:5`
- `package.json:3` `"version": "0.630.0"`
- `strings.json` branding title: `"teamwarfare . net | TWL Vehicles (v0.630)"`

## Build pipeline (`npm run build`)
1. `bf6-portal-bundler --entrypoint ./src/index.ts --outDir ./dist` — concatenates all imported `.ts` files into `dist/bundle.ts` and emits `dist/bundle.strings.json`
2. `node scripts/postbuild.js` — extensive cleanup pass (see below)
3. `node scripts/verify.js` — non-strict by default

## [scripts/postbuild.js](scripts/postbuild.js) — 12-step post-process
1. Normalize CRLF -> LF; strip BOM
2. Strip every `// @ts-nocheck` line
3. Strip `// --- BUNDLED TYPESCRIPT OUTPUT ---` header
4. Strip every `// --- SOURCE: src/*.ts ---` marker
5. Strip every `// Module: ...` marker (this is where non-ASCII em-dashes live)
6. Trim leading blank lines; collapse 5+ newlines to 4; single trailing newline
7. Re-inline `src/foundation/modlib.ts` after `Portal Naming Notes` region (bundler truncates this section, so the postbuild inserts the source directly)
8. Move EOF metadata footer to the very end
9. **Strip every full-line `//` comment from the bundle body** (preserves `@ts-nocheck`/`@ts-ignore`/`@ts-expect-error`)
10. **Strip standalone `/* ... */` block comments** (line-start to line-end only)
11. **Strip leading whitespace (indentation) from every line** — reclaims ~150 KB
12. Collapse consecutive blank lines
13. Re-inject `src/header-file.ts` at top (strips `@ts-nocheck`, `Module:`, and `*policy` lines — note the asterisk prefix is intentional so the strip-comment pass at step 10 doesn't clobber it before re-injection)
14. **Non-ASCII guardrail** — `process.exit(1)` with descriptive error if any non-ASCII byte survives the strip passes. Per repo memory note, v1.498 of Conquest broke via an em-dash in an inline comment after a `delete` statement that survived the comment strip; helis-only adopted the same guardrail in v0.630.
15. Replace `dist/bundle.strings.json` with the source `src/strings.json` (preserves original formatting)

## [scripts/verify.js](scripts/verify.js)
- Default: existence + JSON validity + 1 MB size cap
- Strict mode (`VERIFY_GROUND_TRUTH=1`): byte-compare against `experiences/TWL Helis Only v0.621/logic_scripts/*` (legacy ground truth)
- Disabled by default; helis-only postbuild intentionally diverges from experience-file template

## [scripts/bump-version.js](scripts/bump-version.js)
- Reads header + footer version regex; mismatch -> error
- Accepts optional CLI arg `X.NNN` (must keep same decimal width); else auto-increments minor
- UTC stamp + 4-file update: `header-file.ts`, `footer-file.ts`, `strings.json` branding title, (package.json is NOT auto-updated)

## [scripts/update.js](scripts/update.js)
- `npx npm-check-updates -u --target minor` then `npm install`

## Other notes
- Comment-strip postbuild: **Yes** (step 9 + 10)
- Non-ASCII guardrail: **Yes** (step 11.5 in postbuild)
- Bundle size dropped from 708,998 to ~500,000 bytes (~30% reduction) when conquest's build pipeline was ported in v0.630
- v0.630 changelog note: dead-code elimination pass intentionally skipped (no FEATURE_* flags in helis source)
