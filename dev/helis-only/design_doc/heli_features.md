## Helis-Only Features, File Map, Function Map, and Performance Stack Rank

*Draft generated 2026-05-25 against Helis-only v0.630. Pending human review.*

This document mirrors the structure of Conquest's `conquest_optimization_state.md` and `conquest_optimization_analysis.md` so the two projects can be reasoned about with the same vocabulary.

---

### 0. Reading guide

- **Section 1** — what the game mode is, at a glance.
- **Section 2** — Project Stats (version, file count, bundle, headroom).
- **Section 3** — Complete src file map.
- **Section 4** — Per-file function inventory.
- **Section 5** — `GameState` shape (single mutable singleton) and module-scope caches.
- **Section 6** — Every exported `On*` event handler.
- **Section 7** — Per-pid allocator ranking (H1–H10), modeled on Conquest's M1–M15.
- **Section 8** — Hot-path stack rank: which subsystems cost what.
- **Section 9** — Compile-time / runtime feature flags.
- **Section 10** — How to keep this file accurate.

---

## 1. Project Description

Helis-only is a round-based vehicle-only PvP game mode for BF6 Portal, originally a tank scoring mode and now a multi-mode mode supporting both tank and helicopter game modes:

- **Helis Only - BF6 Vanilla** — baseline rules, vanilla aircraft ceiling, single-zone overtime.
- **Helis Only - TWL Ladder** — TWL ladder ruleset, custom aircraft ceiling, single-zone overtime.
- **Helis Only - TWL Practice** — practice variant.
- **Helis Only - TWL Custom** — fully tunable.
- A **tanks branch** sharing the same infrastructure (spawn specs, overtime zones A–G).

Used by Teamwarfare.net's "TWL" competitive ladder. Vehicles are the only scoring entity (infantry deaths ignored). A round ends when a team reaches the configured round-kill target, the round clock expires (with optional overtime winner from the half-time-revealed tie-breaker flag), or — in helis single-zone mode — a team fully captures the active overtime zone.

| Dimension | Value |
|---|---|
| Player count target | Configurable 1v1 / 2v2 / 3v3 / 4v4 via `MATCHUP_PRESETS` |
| Map count | 9 (`Blackwell_Fields`, `Defense_Nexus`, `Golf_Course`, `Mirak_Valley`, `Operation_Firestorm`, `Liberation_Peak`, `Manhattan_Bridge`, `Sobek_City`, `Area_22B`) |
| Round flow | `NotReady` → pregame countdown → `Live` → `endRound` cleanup → `NotReady` → repeat (best-of-N) → final round → 45 s `victoryDialog` → `EndGameMode` |
| Win condition | First team to win majority of `MAX_ROUNDS` (default best-of-3) |
| Round end conditions | Round-kill target reached, clock expiry, or full overtime capture |
| Overtime | Half-time-revealed random flag (A–G or H heli-mode) with vehicle-only capture |

---

## 2. Project Stats

| Item | Value |
|---|---|
| Version (per [src/header-file.ts](../src/header-file.ts), [src/footer-file.ts](../src/footer-file.ts), [package.json](../package.json)) | **v0.630** (2026-05-24) |
| Source files in `src/` | 19 (`.ts`) + 1 (`strings.json`) |
| Lines of TypeScript (approx) | ~16,000 |
| Bundle size (latest reported, [src/Changelog.ts](../src/Changelog.ts)) | ~500,000 bytes (down from 708,998 pre-pipeline-port) |
| Bundle headroom under 1 MiB cap | ~548,000 bytes free |
| Build pipeline | `bf6-portal-bundler` → `scripts/postbuild.js` (12-step) → `scripts/verify.js` |
| Non-ASCII guardrail | **Yes** (postbuild step 11.5, ported from Conquest v1.498) |
| Comment-strip postbuild | **Yes** (postbuild steps 9 + 10, ported from Conquest v1.398) |
| Lazy-build framework | **No** (all UI built up-front via `ensureHudForPlayer` + `createTeamSwitchUI`) |
| `FEATURE_*` compile-time flags | **None** (no dead-code elimination flags) |

---

## 3. Complete File Map

Path is relative to `bf6-portal/dev/helis-only/`. Hot-path classification:
- **Yes** = work executed per-tick or per-frame at LIVE rate.
- **Event** = only executed on engine events (deploy, vehicle enter, etc.); cost amortized.
- **No** = construction/configuration only.

| File | Lines | Purpose (1-line) | Hot path? | PPM (per-pid map) | `@ts-nocheck` |
|---|---:|---|---|---|---|
| [src/index.ts](../src/index.ts) | 900 | Entry point + 15 `On*` event handlers + the master 1 s loop | Yes (1 s outer loop) | — | Yes |
| [src/types.ts](../src/types.ts) | 652 | Enums, interfaces, gameplay tuning constants, string-key consts, `regVehiclesTeam1/2` globals | No | — | Yes |
| [src/config.ts](../src/config.ts) | 515 | `MapConfig` table for 9 maps (bases, spawn specs, overtime zones) | No (read on map-apply only) | — | Yes |
| [src/strings.ts](../src/strings.ts) | 337 | Map config apply/detect, heli spawn derivation, widget ID prefix consts | No | — | Yes |
| [src/state.ts](../src/state.ts) | 1,193 | `State: GameState` singleton, ID helpers, HUD type defs, button-construction helpers, `refreshReadyDialogButtonTextForPid` | Indirect (helpers called from hot paths) | — | Yes |
| [src/hud.ts](../src/hud.ts) | 2,878 | `ensureHudForPlayer` (1,812-line mega-builder), top HUD, victory dialog, round-end dialog, help text, counter setters | Yes (per-tick render) | H1: `hudCache.hudByPid`; H2: `hudCache.clockWidgetCache` | Yes |
| [src/vehicles.ts](../src/vehicles.ts) | 639 | Portal array helpers, last-driver cache, vehicle registry, spawner slot system (`forceSpawnWithRetry`, `runSequentialSpawns`, `pollVehicleSpawnerSlots`), kills HUD sync | Yes (spawn/destroy hot, 1 s poll) | — (uses `slots` array, not per-pid) | Yes |
| [src/overtime.ts](../src/overtime.ts) | 2,320 | Overtime zone selection, capture loop (`runOvertimeCaptureLoop` at 0.25 s tick), in-zone HUD, stage transitions (`updateOvertimeStage`), admin tie-breaker | Yes (0.25 s tick when Active) | H3: `flag.uiByPid`; H4: `flag.lastUiSnapshotByPid`; H5: `flag.playersInZoneByPid` | Yes |
| [src/clock.ts](../src/clock.ts) | 421 | Round clock state, digit widget cache build, per-player clock display update, expiry handlers | Yes (1 s tick) | H6: `hudCache.clockWidgetCache` (entry rebuild) | Yes |
| [src/team-switch.ts](../src/team-switch.ts) | 858 | Team-switch `InteractPoint` lifetime, swap action, master button-event router for ready/admin/tester buttons | Event-driven + per-tick velocity check | — (uses `players.teamSwitchData`) | Yes |
| [src/round-flow.ts](../src/round-flow.ts) | 634 | `startRound` / `endRound`, round-end cleanup pipeline (destroy → undeploy → respawn → redeploy → hold), match-end scheduling | Event-driven | — | Yes |
| [src/ready-dialog.ts](../src/ready-dialog.ts) | 4,302 | Ready Dialog builder, Admin Panel builder, Join Prompt sequencing, aircraft ceiling soft-enforcement loop (0.2 s tick), pregame countdown animation | Yes (ceiling loop), Event-heavy (dialog) | H7: `joinPromptShownByPid` etc. (~7 pid maps); H8: `aircraftCeiling.vehicleStates` | Yes |
| [src/utils.ts](../src/utils.ts) | 105 | `InteractMultiClickDetector` (static per-pid triple-tap state), main-base entry/exit helpers, ammo restock | Event-driven | H9: `InteractMultiClickDetector.STATES` (static `Record<number, {…}>`) | Yes |
| [src/header-file.ts](../src/header-file.ts) | 50 | Re-injected at top of bundle by postbuild; version + license + attribution | No | — | Yes |
| [src/footer-file.ts](../src/footer-file.ts) | 7 | EOF version line moved to very end by postbuild | No | — | Yes |
| [src/Changelog.ts](../src/Changelog.ts) | 64 | Comment-only version history | No | — | Yes |
| [src/GamemodeDescription.ts](../src/GamemodeDescription.ts) | 49 | Comment-only mode description + glossary | No | — | Yes |
| [src/ImprovementsPunchlist.ts](../src/ImprovementsPunchlist.ts) | 27 | **Human-curated TODO list (not for LLMs to drive)** | No | — | Yes |
| [src/PortalNamingNotes.ts](../src/PortalNamingNotes.ts) | 67 | Comment-only vehicle/map name reference | No | — | Yes |
| [src/foundation/modlib.ts](../src/foundation/modlib.ts) | 13 | `import * as modlib from "modlib"`; re-inlined by postbuild step 7 | No | — | Yes |

[src/strings.json](../src/strings.json) — ~360 lines, structured under `twl.*` with sections `hud, roundEnd, roundStart, flagCapture, overtime, overLine, teams, maps, notifications, joinPrompt, readyDialog, adminPanel, teamSwitch, ui, victory, countdown, debug, messages, system`.

---

## 4. Per-File Function Inventory

> Format: `functionName(args)` — one-line purpose. Grouped by `//#region` markers where present.

### [src/index.ts](../src/index.ts) — all `export`s live here

**Game Mode Start**
- `OnGameModeStarted()` — async; map auto-detect from HQ positions, reset state, build per-player HUDs, kick spawner system + aircraft-ceiling loop, enter the 1 s outer loop (clock + overtime stage + takeoff check + auto-ready + kills HUD + victory countdown).

**Player Join + Leave**
- `resetUiForPlayerOnJoin(player)` — delete stale title/subtitle/join-prompt widgets for a pid.
- `OnPlayerJoinGame(eventPlayer)` — async; init `teamSwitchData`, ensure HUD, write counters, second-pass after team-assignment settles, show join prompt if first time.
- `OnPlayerLeaveGame(eventNumber)` — mark disconnected, remove interact point, drop ~14 per-pid state maps, refresh remaining viewers.

**Player Deploy + Undeploy**
- `deferForcedUndeploy(player, reason)` — async helper to undeploy after 0.1 s.
- `OnPlayerDeployed(eventPlayer)` — async; gate by `cleanupActive` / live-respawn-disabled, equip 2× Deployable Vehicle Supply Crate, mark deployed + in main base, spawn team-switch interact point.
- `OnPlayerUndeploy(eventPlayer)` — close dialog, remove interact point, hide overtime HUD, re-show join prompt if applicable.

**Player Loop + UI Inputs**
- `OngoingPlayer(eventPlayer)` — per-player tick: update spawn-disabled warning, check interact-point removal, warmup-build the Ready Dialog once per pid, run triple-tap detector.
- `OnPlayerInteract(eventPlayer, eventInteractPoint)` — open ready dialog.
- `OnPlayerUIButtonEvent(eventPlayer, eventUIWidget, eventUIButtonEvent)` — route to join-prompt then team-switch button router.

**Vehicle Entry + Exit**
- `isVehicleEmptyForEntry(eventVehicle, enteringPlayer)` — true if no other occupied seats.
- `OnPlayerEnterVehicle(eventPlayer, eventVehicle)` — register/transfer vehicle to entering team, broadcast registration message, hand off to overtime occupancy tracking. **Flagged "Known fragility – error prone" in source.**
- `OnPlayerExitVehicle(eventPlayer, eventVehicle)` — forward to overtime exit handler.

**Vehicle Spawn + Destroy**
- `OnVehicleSpawned(eventVehicle)` — async; bind to spawner slot via active-token then position fallback, force-replace any default vehicle type, register to inferred base team, broadcast.
- `OnVehicleDestroyed(eventVehicle)` — async; spawn-camp gating, award round kill to opposing team if LIVE, end round if kill target reached, broadcast.

**Area / Capture Triggers**
- `OngoingCapturePoint(eventCapturePoint)` — keep marker-only suppression applied on the active overtime CP.
- `OnPlayerEnterAreaTrigger(eventPlayer, eventAreaTrigger)` — overtime zone enter; main-base entry sets `inMainBase`, broadcasts, restocks gadget ammo.
- `OnPlayerExitAreaTrigger(eventPlayer, eventAreaTrigger)` — overtime zone exit; main-base exit forces NOT READY pre-live, broadcasts, restocks ammo.

### [src/state.ts](../src/state.ts)

**Core gameplay state helpers**
`getMatchWinsTeam`, `setMatchWinsTeam`, `shouldSendMessage`, `setUIInputModeForPlayer`, `noteHighlightedMessageSent`, `isRoundLive`, `hasPlayersOnTeam`, `sendNotificationMessage`, `sendHighlightedWorldLogMessage`, `logCapturePointVisibilityDebug`, `syncWinCountersHudFromGameModeScore`, `endGameModeForTeamNum`.

**Shared ID helpers**
`getObjId`, `safeGetObjId`, `safeGetPlayerId`, `isPidDisconnected`, `getTeamNumber`, `safeGetTeamNumberFromPlayer`, `isPlayerDeployed`, `safeGetSoldierStateBool` (auto-flips `deployedByPid` on engine error), `safeGetSoldierStateVector`, `getTeamNameKey`, `opposingTeam`, `safeFind`, `safeFindPlayer`.

**UI construction helpers**
`addOutlinedButton`, `addCenteredButtonText`, `addRightAlignedLabel`, `applyReadyDialogLabelTextColor`, `applyAdminPanelLabelTextColor`, `refreshReadyDialogButtonTextForPid` — re-labels all ~20 Ready Dialog buttons (ready, auto-ready, swap, cancel, best-of ±, matchup ±, min-players ±, mode-game ±, mode-settings ±, vehicles T1 ±, vehicles T2 ±, confirm, reset).

Followed by the type declarations `HudRefs`, `OvertimeFlagHudRefs`, `OvertimeFlagGlobalHudRefs`, `OvertimeFlagPlayerZoneState`, `OvertimeFlagUiSnapshot`, `VehicleSpawnerSlot`, `GameState` interface, and the `const State: GameState = {...}` singleton.

### [src/vehicles.ts](../src/vehicles.ts)

**Portal array helpers**: `arrayContainsVehicle`, `arrayRemoveVehicle` (uses `modlib.IsTrueForAny` / `modlib.FilteredArray`).

**Ownership tracking** (parallel `vehIds[] / vehOwners[]`): `getVehicleId`, `getLastDriver`, `setLastDriver`, `popLastDriver`, `clearLastDriverByVehicleObjId`.

**Registration**: `registerVehicleToTeam`, `clearSpawnBaseTeamCache`, `inferBaseTeamFromPosition`.

**Spawner system**: `configureVehicleSpawner`, `findVehicleById`, `addVehicleSpawnerSlot`, `getDesiredSpawnerCountsForPreset`, `setSpawnerSlotEnabled`, `applySpawnerEnablementForMatchup`, `queueSequentialSpawns`, `runSequentialSpawns` (async, token-cancellable), `forceSpawnWithRetry` (async, ≤20 attempts × 0.25 s), `scheduleBlockedSpawnRetry` (async, one-shot delayed), `scheduleRespawn` (async, token-guarded), `pollVehicleSpawnerSlots` (async forever, 1 s tick), `applySpawnYawToVehicle` (async; `mod.Teleport` ×2 to enforce yaw), `bindSpawnedVehicleToSlot`, `findSpawnerSlotByPosition`, `startVehicleSpawnerSystem` (async one-shot bootstrap).

**Kills HUD sync**: `syncKillsHudFromTrackedTotals`, `syncRoundKillsHud`.

### [src/overtime.ts](../src/overtime.ts) (2,320 lines — single largest hot-path module)

**Zone config + preview icon**: `normalizeOvertimeZoneLetter`, `getOvertimeZoneIndexForLetter`, `getOvertimeZoneLettersForGameMode`, `getConfirmedGameModeKey`, `buildOvertimeZoneCandidatesForGameMode`, `isHelisOvertimeSingleZoneMode`, `refreshOvertimeZonesFromMapConfig`, `validateOvertimeZoneSpecs`, `buildPortalNumberArray`, `getOvertimeFlagLetterKeyForIndex`, `getOvertimeFlagLetterKeyForCandidateIndex`, `getActiveOvertimeFlagLetterKey`, `getOvertimeFlagLetterTextFor*`, `hideOvertimeFlagPreviewIcon`, `getActiveOvertimeAreaTrigger` *(`TODO(1.0)` unused)*, `getActiveOvertimeWorldIcon`, `showOvertimeFlagPreviewIcon`.

**Marker visibility + suppression**: `getOvertimeCapturePointIds`, `getAllOvertimeCapturePointIds`, `setOvertimeCapturePointsForAllHidden`, `applyOvertimeCapturePointSuppression`, `setOvertimeCapturePointOwner`, `hardResetOvertimeCapturePoints`, `configureOvertimeCapturePointTimes`, `setOvertimeCapturePointMarkerVisible`, `setOvertimeCapturePointsForSelected`, `setOvertimeCapturePointsForAllVisible`, `setOvertimeSectorsForAllVisible`, `setOvertimeSectorsForAllHidden`, `hideAllOvertimeZoneMarkers`, `setOvertimeAllFlagVisibility`, `getActiveOvertimeCapturePoint`, `isActiveOvertimeCapturePoint`, `setOvertimeSectorsForSelected`.

**Admin tie-breaker + live respawn + round length**: `normalizeTieBreakerModeIndex`, `getTieBreakerModeLabelKey`, `getTieBreakerModeActionKey`, `syncAdminTieBreakerModeLabelForAllPlayers`, `getAdminLiveRespawnLabelKey`, `syncAdminLiveRespawnLabelForAllPlayers`, `clampRoundLengthSeconds`, `getConfiguredRoundLengthSeconds`, `syncAdminRoundLengthLabelForAllPlayers`.

**Selection + overrides**: `isTieBreakerEnabledForRound`, `computeTieBreakerEnabledForRound`, `syncTieBreakerEnabledForCurrentRound`, `resetOvertimeSelectionForOverride`, `selectOvertimeZoneForRound`, `getActiveOvertimeSector` *(`TODO(1.0)` unused)*, `applyAdminTieBreakerOverride`.

**Reset + state**: `resetOvertimeFlagState`, `isRoundKillTargetReached`.

**Vehicle + zone membership tracking**: `incrementOvertimeTeamVehicleCount`, `decrementOvertimeTeamVehicleCount`, `addOvertimeVehicleOccupant`, `removeOvertimeVehicleOccupant`, `syncOvertimePlayerVehicleState`, `handleOvertimePlayerEnterZone`, `handleOvertimePlayerExitZone`, `handleOvertimePlayerLeaveById`, `handleOvertimePlayerEnterVehicle`, `handleOvertimePlayerExitVehicle`, `handleOvertimeVehicleDestroyed`.

**Capture loop + progress**: `stopOvertimeCaptureLoop`, `startOvertimeCaptureLoop`, `runOvertimeCaptureLoop` (async ticker), `pruneOvertimeZoneMembership`, `pruneOvertimeUiCaches`, `getOvertimeCaptureMultiplier`, `updateOvertimeCaptureProgress`, `getOvertimeProgressPercent` *(`TODO(1.0)` unused)*, `getOvertimeDisplayPercents`.

**HUD update + visibility**: `isOvertimeZoneTrackingEnabled`, `shouldDeferDisconnectUiDeletes`, `updateOvertimeHudForAllPlayers`, `updateOvertimeHudForPlayer`, `updateOvertimeGlobalHudForAllPlayers` *(`TODO(1.0)` unused/deprecated)*, `refreshOvertimeUiVisibilityForAllPlayers`, `refreshOvertimeUiVisibilityForPlayer`, `rebuildOvertimeUiForPlayer`, `prewarmOvertimeHudForAllPlayers`, `hideOvertimeUiForAllPlayers`.

**HUD build + cache**: `safeDeleteUiWidget`, `dropOvertimeUiRefsForPlayerId`, `deleteOvertimeUiForPlayerId`, `ensureOvertimeHudForPlayer`, `ensureOvertimeGlobalHudForPlayer` *(`TODO(1.0)` unused/deprecated)*.

**Stage transitions + messaging**: `updateOvertimeStage`, `getOvertimeVisibleSeconds`, `buildRemainingTimeMessage` *(`TODO(1.0)` unused)*, `getOvertimeUnlockSeconds`, `updateOvertimeLockedPreviewIconText`, `updateOvertimeActivePreviewIconText`, `shouldShowOvertimeUnlockMessageForPlayer` *(`TODO(1.0)` unused)*, `enterOvertimeNoticeStage` *(body commented out — "2:30 notice message disabled")*, `enterOvertimeVisibleStageSilent`, `enterOvertimeVisibleStage`, `enterOvertimeActiveStage`, `maybeSendOvertimeUnlockReminder` *(early `return` — disabled)*, `resolveOvertimeWinnerAtClockExpiry`.

### [src/clock.ts](../src/clock.ts)

**Update + state**: `ResetRoundClock` **(exported)**, `setRoundClockPreview`, `getRemainingSeconds`, `adjustRoundClockBySeconds`, `resetRoundClockToDefault`, `getRegisteredVehicleCount`, `updateAllPlayersClock`.

**UI build + cache**: `ensureClockUIAndGetCache`, `buildDigit`, `buildColon`, `setDigitCached`, `setColonCached`, `setClockColorCached`.

### [src/round-flow.ts](../src/round-flow.ts)

**Broadcast helpers**: `broadcastStringKey`, `broadcastGameplayNotificationKey` *(`TODO(1.0)` unused)*, `broadcastGameplayHighlightedStringKey` *(`TODO(1.0)` unused)*, `broadcastHighlightedStringKey`.

**Round-end cleanup**: `setCleanupState`, `quiesceSpawnerSystemForCleanup`, `resetSpawnerSlotStateForCleanup`, `clearVehicleCachesForCleanup`, `areCleanupSpawnsReady`, `isSpawnerSystemQuiescent`, `waitForCleanupSpawnsOrTimeout`, `scheduleRoundEndCleanup` (async pipeline: lock → quiesce → destroy all vehicles → per-player undeploy → reset slots → apply matchup → wait → deploy twice → hold), `triggerFreshRoundSetup`.

**Match end**: `scheduleFinalRoundVictory`, `scheduleMatchEnd`, `bindRoundClockExpiryToRoundEnd`.

**Round lifecycle**: `startRound`, `endRound`.

### [src/team-switch.ts](../src/team-switch.ts)

**Interact point lifetime**: `spawnTeamSwitchInteractPoint`, `teamSwitchInteractPointActivated`, `removeTeamSwitchInteractPoint`, `isVelocityBeyond`, `checkTeamSwitchInteractPointRemoval`, `initTeamSwitchData`.

**Team-switch action**: `forceUndeployPlayer` (async; double-undeploy with 0.05 s gap), `processTeamSwitch` (SetTeam + SetRedeployTime + UndeployPlayer), `deleteTeamSwitchUI` (hide-not-delete; caching), `closeReadyDialogForAllPlayers`, `hardDeleteTeamSwitchUI`.

**Button router**: `teamSwitchButtonEvent` — one giant switch over **all** Ready/Admin/Tester button IDs: ready, auto-ready, swap, best-of ±, matchup ±, min-players ±, mode-game ±, mode-settings ±, vehicles T1 ±, vehicles T2 ±, confirm, reset, plus admin: wins ±, kills ±, round kills ±, target ±, ties ±, cur round ±, clock-time ±, clock-reset, round-start, round-end, pos-debug toggle, tie-breaker A–G, tie-breaker mode ±, live-respawn toggle, round-length ±.

### [src/ready-dialog.ts](../src/ready-dialog.ts) (4,302 lines — largest file)

**Admin panel build/destroy**: `setAdminPanelChildWidgetsVisible`, `deleteAdminPanelUI`, `ensureAdminPanelWidgets`, `createTeamSwitchUI` (≈1,230 lines — the dialog builder).

**Admin row helpers**: `buildAdminPanelWidgets`, `addTesterRow`, `addTesterRowWithValue`, `addTesterResetButton`, `addTesterActionButton`, `syncRoundKillsTargetTesterValueForAllPlayers`.

**Debug positioning**: `ensurePositionDebugWidgets`, `positionDebugLoop` (async), `setPositionDebugVisibleForPlayer`.

**Ready Dialog roster + render**: `applyReadyDialogRowColors`, `renderReadyDialogForViewer`, `renderReadyDialogForAllVisibleViewers`, `refreshReadyDialogRosterForViewer`, `updateReadyToggleButtonForViewer`, `updateAutoReadyToggleButtonForViewer`, `updateBestOfRoundsLabelForPid`, `updateBestOfRoundsLabelForAllPlayers`, `updateReadyDialogMapLabelForPid`, `updateReadyDialogMapLabelForAllPlayers`, `updateReadyDialogModeConfigForPid`, `updateReadyDialogModeConfigForAllVisibleViewers`.

**Aircraft ceiling**: `getAircraftSoftCeilingWorldY`, `applyCustomAircraftCeilingHardLimiter` *(`TODO(1.0)` unused)*, `getVehicleYawRad`, `isAircraftVehicle`, `updateSoftCeilingForVehicle`, `runAircraftCeilingSoftEnforcementLoop` (async 0.2 s tick), `startAircraftCeilingSoftEnforcementLoop`, `enableCustomAircraftCeiling`, `disableCustomAircraftCeilingAndRestoreDefault`, `syncAircraftCeilingFromMapConfig`.

**Game-mode helpers**: `isReadyDialogGameModeVanilla` / `Ladder` / `Twl1v1` / `Custom` / `TwlPreset`, `getReadyDialogPresetPlayersPerSide`, `shouldApplyCustomCeilingForGameMode` / `Config`, `hasCustomCeilingOverride`, `ensureCustomGameModeForManualChange`, `isReadyDialogModePresetActive`, `applyReadyDialogModePresetForGameMode`, `setReadyDialogGameModeIndex`, `setReadyDialogAircraftCeiling`, `setReadyDialogVehicleIndexT1`, `setReadyDialogVehicleIndexT2`, `resetReadyDialogVehicleOverrides` *(`TODO(1.0)` deprecated)*, `confirmReadyDialogModeConfig`.

**Team / matchup / settings sync**: `updateTeamNameWidgetsForPid` / `ForAllPlayers`, `updateMatchupLabelForPid` / `ForAllPlayers`, `getAutoStartMinPlayerCounts`, `updateMatchupReadoutsForPid` / `ForAllPlayers`, `updateSettingsSummaryHudForPid` / `ForAllPlayers`, `setAutoStartMinActivePlayers`, `applyMatchupPresetInternal`, `applyMatchupPreset`, `refreshReadyDialogForAllVisibleViewers`.

**Join prompt**: 10 widget-name helpers (`joinPromptRootName`, etc.), `deleteJoinPromptWidget`, `isJoinPromptSuppressedForPlayer`, `setJoinPromptSuppressedForPlayer`, `shouldShowJoinPromptForPlayer`, `ensureJoinPromptStateForPid`, `markJoinPromptReadyDialogOpened`, `armJoinPromptTripleTapForPid`, `consumeJoinPromptTripleTapForPid`, `isJoinPromptBodyKeySkipped`, `findNextJoinPromptSequenceIndex`, `getJoinPromptSequenceIndexForPid`, `getJoinPromptBodyKeyForPid`, `getJoinPromptDismissLabelKeyForPid`, `shouldShowJoinPromptNeverShowButtonForPid`, `advanceJoinPromptSequenceOnDismiss`, `createJoinPromptForPlayer` (~200 lines), `canEnableDeployAfterJoinPrompt`, `dismissJoinPromptForPlayer`, `clearJoinPromptForPlayerId`, `tryHandleJoinPromptButton`.

**Ready state + auto-ready**: `resetReadyStateForAllPlayers`, `isPlayerInMainBaseForReady`, `showOverTakeoffMessageForAllPlayers` (async), `checkTakeoffLimitForAllPlayers`, `applyAutoReadyForPid`, `applyAutoReadyForAllPlayers`, `getActivePlayers`, `buildRosterDisplayEntries`, `getRosterDisplayEntries`, `getRosterEntryNameMessage`, `areAllActivePlayersReady`.

**Pregame countdown + over-the-line message**: 6 ensure-widget helpers (`ensureCountdownUIAndGetWidget`, `ensureOverLineTitleShadowUIAndGetWidget`, etc.), `setPregameCountdownVisualForAllPlayers`, `setPregameCountdownSizeForAllPlayers`, `hidePregameCountdownForAllPlayers`, `cancelPregameCountdown`, `hideBigTitleSubtitleMessageForPlayer`, `showOverLineMessageForAllPlayers` (async), `renderBigTitleSubtitleMessageForAllPlayers`, `hideBigTitleSubtitleMessageForAllPlayers`, `showGlobalTitleSubtitleMessageForAllPlayers` (async), `showDynamicGlobalTitleSubtitleMessageForAllPlayers` (async), `showRoundStartMessageForAllPlayers` (async), `startPregameCountdown`, `isPregameCountdownStillValid`, `getPregameCountdownColor`, `animatePregameCountdownSize` (async), `runPregameCountdown` (async), `tryAutoStartRoundIfAllReady`, `swapPlayerTeam`.

### [src/hud.ts](../src/hud.ts)

**Counter helpers**: `setCounterText`, `setRoundRecordText`, `getTrendingWinnerTeam`, `setTrendingWinnerCrownForRefs`, `setTrendingWinnerCrownForAllPlayers`, `setAdminPanelActionCountText`.

**Round state + help text**: `setRoundStateText`, `setRoundLiveHelpText`, `getRoundKillsLabelRound`, `setRoundKillsLabelTextForRefs`, `getClockTimeParts`.

**Safe-wrappers**: `safeSetUIWidgetVisible`, `safeSetUITextLabel`, `safeSetUITextColor`, `safeSetUIWidgetDepth`, `safeAddUIContainer`, `safeSetUIWidgetSize`, `setWidgetVisible`, `setWidgetText`.

**HUD root + spawn-disabled warning**: `ensureTopHudRootForPid`, `setHudHelpDepthForPid`, `reparentSpawnDisabledLiveTextForPid`, `ensureSpawnDisabledLiveText`, `setSpawnDisabledLiveTextVisibleForPlayer` / `ForAllPlayers`, `isLiveRespawnDisabled`, `updateSpawnDisabledWarningForPlayer` / `ForAllPlayers`.

**Round-state / Ready HUD**: `setRoundStateTextForAllPlayers`, `updatePlayersReadyHudTextForAllPlayers`, `getReadyCountsForMessage`.

**Victory dialog**: `getElapsedHmsParts`, `setVictoryWinnerCrownForRefs`, `updateVictoryDialogRosterSizing`, `computeTeamOutcomeKey`, `updateVictoryDialogForPlayer`, `updateVictoryDialogForAllPlayers`.

**Round-end dialog**: `setRoundWinCrownForRefs` / `ForAllPlayers`, `setRoundEndDialogVisibleForAllPlayers`, `isRoundEndUiLockdownActive`, `isRoundEndDetailDrawReason`, `getRoundEndDetailForViewer`, `updateRoundEndDialogForAllPlayers` / `ForPlayer`.

**Help text visibility**: `isTeamSwitchDialogOpenForPid`, `updateHelpTextVisibilityForPid` / `ForPlayer` / `ForAllPlayers`.

**HUD build (the mega)**: `ensureHudForPlayer(player)` — **lines 936–2,748** (≈1,812 LOC). Builds the top HUD (upper-left brand, settings summary, score banner, win counters, kills, crowns, round counter, victory dialog skeleton, round-end dialog skeleton, spawn-disabled warning, help/ready containers, vehicles-alive text). Idempotent: returns cached `HudRefs` on second call after touching position resets for the help/ready/admin-counter widgets. Source comment: *"Code Cleanup: This is an absurd mega-function — we should refactor and break down."*

**Counter setters + admin actions**: `setHudRoundCountersForAllPlayers`, `setHudWinCountersForAllPlayers`, `syncRoundRecordHudForAllPlayers`, `adjustMatchTiesForBothTeams`, `updateAdminPanelActionCountForAllPlayers`, `handleAdminPanelAction`.

**Legacy cleanup**: `deleteLegacyScoreRootForPlayer`, `deleteLegacyScoreRootsForAllPlayers` *(commented "Is this still needed???")*.

### [src/strings.ts](../src/strings.ts)

`getMapNameKey`, `isHeliGameMode`, `buildHeliSpawnsFromTankSpawns` (auto-derives heli specs from tank specs when a map has no authored heli set: slot 3 = transport, others = attack), `resolveHeliSpawnsForTeam`, `getReadyDialogVehicleListByIndex`, `applyVehicleOverrideToSpawns`, `refreshVehicleSpawnSpecsFromModeConfig`, `applyVehicleSpawnSpecsToExistingSlots`, `applyMapConfig`, `detectMapKeyFromHqs`, `findMatchupPresetIndex`. Bottom half is widget ID prefix constants only.

### [src/utils.ts](../src/utils.ts)

`class InteractMultiClickDetector` — static method `checkMultiClick(player)`; 2,000 ms window, 3 clicks required. State stored in a static `Record<number, {…}>` keyed by pid.
`IsPlayerInOwnMainBase`, `BroadcastMainBaseEvent`, `NotifyAmmoRestocked`, `RestockGadgetAmmo`.

### [src/foundation/modlib.ts](../src/foundation/modlib.ts)

`import * as modlib from "modlib";` — postbuild step 7 re-inlines this stub directly into the bundle body (the bundler truncates the import in its default output).

---

## 5. `GameState` Shape

Single mutable singleton in [src/state.ts](../src/state.ts:1012). All gameplay/UI state lives here; no per-module state outside the singleton except the explicitly-listed module-scope caches at the bottom.

```
State: GameState
├── round
│   ├── current, max, killsTarget, autoStartMinActivePlayers
│   ├── matchupPresetIndex, lastMatchupChangeAtSeconds
│   ├── modeConfig: ReadyDialogModeConfig
│   │   ├── gameModeIndex, aircraftCeiling, aircraftCeilingOverridePending
│   │   ├── vehicleIndexT1/T2, gameMode, gameSettings, vehiclesT1/T2
│   │   └── confirmed: {...same keys, snapshotted on Confirm}
│   ├── phase: RoundPhase.NotReady|Live|GameOver
│   ├── lastWinnerTeam, lastEndDetailReason, lastObjectiveProgress
│   ├── clock { durationSeconds, roundLengthSeconds, matchStartElapsedSeconds?,
│   │           pausedRemainingSeconds?, isPaused, lastDisplayedSeconds?,
│   │           lastLowTimeState?, expiryFired, expiryHandlers: (()=>void)[] }
│   ├── flow  { roundEndRedeployToken, clockExpiryBound, cleanupActive,
│   │           cleanupAllowDeploy, roundEndDialogVisible, roundEndUiLockdown }
│   ├── countdown { isActive, isRequested, token, overLineMessageToken }
│   └── aircraftCeiling { mapDefaultHudCeiling, hudMaxY, hudFloorY,
│                          customEnabled, enforcementToken,
│                          vehicleStates: Record<number, AircraftCeilingVehicleState> }
│
├── flag (overtime)
│   ├── stage: OvertimeStage.None|Notice|Visible|Active
│   ├── active, trackingEnabled, unlockReminderSent, configValid
│   ├── overrideUsedThisRound, tieBreakerEnabledThisRound
│   ├── candidateZones: OvertimeZoneCandidate[]
│   ├── active{AreaTrigger|Sector|WorldIcon|CapturePoint}Id?, and the obj refs
│   ├── activeCandidateIndex?, selectedZoneLetterKey?
│   ├── ownerTeam, progress, t1Count, t2Count
│   ├── playersInZoneByPid: Record<number, OvertimeFlagPlayerZoneState>
│   ├── vehicleOccupantsByVid: Record<number, number>
│   ├── vehicleTeamByVid: Record<number, TeamID>
│   ├── lastUiSnapshotByPid: Record<number, OvertimeFlagUiSnapshot>
│   ├── lastGlobalProgressPercent, lastMembershipPruneAtSeconds
│   ├── uiByPid, globalUiByPid (per-pid HUD ref caches)
│   └── tickToken, tickActive
│
├── scores { t1RoundKills, t2RoundKills, t1TotalKills, t2TotalKills }
│
├── match  { winsT1/T2, lossesT1/T2, tiesT1/T2, isEnded, victoryDialogActive,
│            winnerTeam?, endElapsedSecondsSnapshot, victoryStartElapsedSecondsSnapshot,
│            flow: { matchEndDelayToken } }
│
├── admin  { actionCount, debugLoopActive, tieBreakerOverrideIndex?,
│            tieBreakerOverrideUsed, tieBreakerModeIndex, liveRespawnEnabled }
│
├── debug  { highlightedMessageCount, lastHighlightedMessageAtSeconds,
│            lastHighlightedMessageKey }
│
├── players
│   ├── teamSwitchData: Record<number, teamSwitchData_t>
│   ├── readyByPid, autoReadyByPid, readyMessageCooldownByPid
│   ├── joinPromptShownByPid, joinPromptNeverShowByPidMap (per-map nested)
│   ├── joinPromptReadyDialogOpenedByPid, joinPromptTipIndexByPid,
│   │   joinPromptTipsUnlockedByPid, joinPromptTripleTapArmedByPid
│   ├── inMainBaseByPid, overTakeoffLimitByPid
│   ├── deployedByPid, disconnectedByPid, uiInputEnabledByPid
│   └── spawnDisabledWarningVisibleByPid
│
├── vehicles { slots: VehicleSpawnerSlot[], vehicleToSlot: Record<number,number>,
│              spawnSequenceToken, spawnSequenceInProgress,
│              activeSpawnSlotIndex?, activeSpawnToken?, activeSpawnRequestedAtSeconds?,
│              configReady, startupCleanupDone }
│
└── hudCache { lastHudScoreT1/T2, lastHudRoundKillsT1/T2,
               hudByPid: Record<number, HudRefs>,
               clockWidgetCache: Record<number, ClockWidgetCacheEntry>,
               countdownWidgetCache, overLineTitleWidgetCache,
               overLineSubtitleWidgetCache,
               overLineTitleShadowWidgetCache, overLineSubtitleShadowWidgetCache }
```

**Module-scope mutable state** (deliberately outside `State`):
- `regVehiclesTeam1`, `regVehiclesTeam2` — `mod.GlobalVariable(0/1)` engine arrays of registered vehicles. Persist across rounds until explicitly cleared.
- `vehIds: number[]`, `vehOwners: mod.Player[]` — parallel last-driver cache. Cleared on vehicle destroy/respawn.
- `vehicleSpawnBaseTeamByObjId: Record<number, TeamID>` — cached inferred base team per spawned vehicle.
- `ACTIVE_MAP_KEY`, `ACTIVE_MAP_CONFIG`, `MAIN_BASE_TEAM1_POS`, `MAIN_BASE_TEAM2_POS`, `VEHICLE_SPAWN_YAW_OFFSET_DEG`, `ACTIVE_OVERTIME_ZONES`, `TEAM1_VEHICLE_SPAWN_SPECS`, `TEAM2_VEHICLE_SPAWN_SPECS` — mutated by `applyMapConfig` / `refreshVehicleSpawnSpecsFromModeConfig`.
- `InteractMultiClickDetector.STATES: Record<number, {lastIsInteracting, clickCount, sequenceStartTime}>` — static per-player triple-tap state in [src/utils.ts](../src/utils.ts).
- `lastAutoReadyCheckAtSeconds: number` ([src/types.ts:28](../src/types.ts#L28)).
- `suppressReadyDialogModeAutoSwitch: boolean` ([src/types.ts:302](../src/types.ts#L302)).

---

## 6. Exported Event Handlers (entry surface)

All 15 are exported from [src/index.ts](../src/index.ts):

| Handler | Engine trigger | Effect (short) |
|---|---|---|
| `OnGameModeStarted()` | Match start | Map detect, reset, spawner system, 1 s outer loop |
| `OnPlayerJoinGame(player)` | Player connects | Per-pid state init, HUD build, counters, join prompt |
| `OnPlayerLeaveGame(num\|player)` | Player disconnects | Mark disconnected, drop ~14 pid maps, refresh viewers |
| `OnPlayerDeployed(player)` | Player deploys | Gate by cleanup/respawn, equip 2× Supply Crate, spawn interact point |
| `OnPlayerUndeploy(player)` | Player undeploys | Close dialog, remove interact point, hide overtime HUD, maybe show join prompt |
| `OngoingPlayer(player)` | Per-player tick (cadence TBD; assumed 8 Hz from Conquest analog) | Spawn-disabled warning, warmup-build of dialog, triple-tap detect |
| `OnPlayerInteract(player, ip)` | Interact with InteractPoint | Open Ready Dialog |
| `OnPlayerUIButtonEvent(player, w, ev)` | UI button click | Join-prompt router then team-switch button router |
| `OnPlayerEnterVehicle(player, veh)` | Vehicle entry | Register/transfer team ownership, broadcast, overtime occupancy sync |
| `OnPlayerExitVehicle(player, veh)` | Vehicle exit | Overtime occupancy sync only |
| `OnVehicleSpawned(veh)` | Vehicle spawn | Bind to spawner slot, force-replace default, register to inferred base |
| `OnVehicleDestroyed(veh)` | Vehicle destroyed | Award round kill if LIVE, end-round trigger, broadcast |
| `OngoingCapturePoint(cp)` | Per-CP tick | Re-apply marker-only suppression on active overtime CP |
| `OnPlayerEnterAreaTrigger(player, trg)` | Enter trigger | Overtime zone enter + main-base entry handling |
| `OnPlayerExitAreaTrigger(player, trg)` | Exit trigger | Overtime zone exit + main-base exit handling (force NOT READY pre-live) |

---

## 7. Per-Pid Allocator Ranking (H1–H10)

Modeled on Conquest's M1–M15. Each entry is a per-player map or per-player cached object — these scale linearly with player count and are the primary heap pressure source at higher player counts. Ranked by estimated peak heap impact (H1 = worst).

| # | Name | File | What it holds | Per-pid object size estimate | Notes |
|---|---|---|---|---|---|
| **H1** | `State.hudCache.hudByPid[pid]` | [src/state.ts](../src/state.ts) | `HudRefs` — ~50–70 `mod.UIWidget` references per pid (top HUD, victory dialog, round-end dialog, settings, crowns, kills, wins, records, spawn-disabled, help, ready container, vehicles-alive, roster row caches, victory roster widget arrays of up to `TEAM_ROSTER_MAX_ROWS=16` widgets per side) | **Largest single per-pid object** — built by the 1,812-line `ensureHudForPlayer` and never torn down for valid pids | The dominant contributor in Helis-only. Analogous to Conquest M1+M3 combined (no separate combat HUD module). |
| **H2** | `State.flag.uiByPid[pid]` | [src/state.ts](../src/state.ts) | `OvertimeFlagHudRefs` — ~18 widget refs (title, status, counts, percents, crowns, bar fill T1/T2, vehicle-required indicator, etc.) | Built lazily by `ensureOvertimeHudForPlayer` on first overtime visibility | Per-pid because each player sees their own crown/percent/status state per overtime zone. |
| **H3** | `State.flag.lastUiSnapshotByPid[pid]` | [src/state.ts](../src/state.ts) | `OvertimeFlagUiSnapshot` — ~18 numeric/boolean fields used as a diff cache to avoid redundant `SetUIText*` calls | Small object, but written every overtime capture-loop tick (0.25 s) per pid | Diff gate to skip widget writes when nothing changed. |
| **H4** | `State.flag.playersInZoneByPid[pid]` | [src/state.ts](../src/state.ts) | `OvertimeFlagPlayerZoneState` — `{playerObjId, teamId, vehicleObjId}` | Tiny; only present while pid is in the active overtime zone | Pruned every 1 s by `pruneOvertimeZoneMembership`. |
| **H5** | `State.hudCache.clockWidgetCache[pid]` | [src/state.ts](../src/state.ts) | `ClockWidgetCacheEntry` — digit widget refs (minute, colon, sec tens, sec ones), round-state text, round-live help root/text, players-ready text | Built lazily by `ensureClockUIAndGetCache` | Updated every 1 s by `updateAllPlayersClock`. |
| **H6** | `State.hudCache.countdownWidgetCache[pid]` + the 4 `overLine*WidgetCache` siblings | [src/state.ts](../src/state.ts) | 5 separate per-pid caches for pregame countdown digit + over-the-line title/subtitle/title-shadow/subtitle-shadow widgets | Tiny but **5 maps**; could be consolidated into one struct | Only populated during the pregame countdown + over-line events; cleared aggressively by `cancelPregameCountdown`. |
| **H7** | `State.players.teamSwitchData[pid]` | [src/state.ts](../src/state.ts) | `teamSwitchData_t` — UI lifetime tokens, `dialogVisible` flag, `uiBuilt` flag, interact point ref | Small object, durable | Drives all the per-pid `_BORDER` widgets created by `createTeamSwitchUI`. |
| **H8** | Join-prompt cluster (7 pid maps) | [src/state.ts](../src/state.ts) | `joinPromptShownByPid`, `joinPromptNeverShowByPidMap` (nested per-map), `joinPromptReadyDialogOpenedByPid`, `joinPromptTipIndexByPid`, `joinPromptTipsUnlockedByPid`, `joinPromptTripleTapArmedByPid`, plus the in-flight per-pid widget refs created by `createJoinPromptForPlayer` | Many small maps; widget refs (~10) only while prompt visible | Could be consolidated into one per-pid struct; currently 7 separate `Record<number, T>` allocations. |
| **H9** | `State.round.aircraftCeiling.vehicleStates[vid]` | [src/state.ts](../src/state.ts) | `AircraftCeilingVehicleState` — `{enforcing, lastNudgeAt}` | Tiny, keyed by **vehicle objId** (not pid) — capped at concurrent aircraft count | Set/cleared by `updateSoftCeilingForVehicle` at 0.2 s tick. |
| **H10** | `InteractMultiClickDetector.STATES[pid]` | [src/utils.ts](../src/utils.ts) | `{lastIsInteracting, clickCount, sequenceStartTime}` static per-pid triple-tap state | Tiny | Never cleared on disconnect — **potential leak** (see [heli_issues_design.md](./heli_issues_design.md)). |

**Aggregate footprint estimate**: at N players, total per-pid heap ≈ N × (sum of H1..H10 individual sizes) ≈ N × ~120 widget refs + per-pid small objects. At N=12, ~1,440 widget refs + ~120 small objects. At N=24, ~2,880 widget refs. This is materially smaller than Conquest's per-pid footprint (Conquest's combat HUD + capture engagement adds ~80 more refs per pid), which is why Helis has not hit the 16-player heap ceiling that Conquest hit (and remediated in Wave 3).

---

## 8. Hot-Path Stack Rank (P1–P10)

This is a static-analysis-derived ranking, modeled on Conquest's "recurring work inventory." It is not yet validated by playtest telemetry. Per-tick cadence assumptions are noted; **adding a one-shot cadence-verification probe is the first prerequisite for any optimization work** (see Conquest's D5 / M1 patterns).

| # | Hot path | File:line | Cadence (assumed) | Cost shape | Why it's #N |
|---|---|---|---|---|---|
| **P1** | `runOvertimeCaptureLoop` async tick | [src/overtime.ts](../src/overtime.ts) (`OVERTIME_TICK_SECONDS = 0.25`) | **4 Hz when Active**, **0 Hz when None** | Per-tick: `updateOvertimeCaptureProgress` (math) + `updateOvertimeHudForAllPlayers` (per-pid `mod.SetUIText*` writes for in-zone HUD) | 4× the cadence of the master loop; only runs the last 60 s of the round (`OVERTIME_STAGE_ACTIVE_SECONDS = 60`) — but during that window it dominates the budget. |
| **P2** | `OngoingPlayer(player)` per-pid tick | [src/index.ts:390](../src/index.ts#L390) | **Unknown** — likely engine-driven 8 Hz per the Conquest analog | Per-pid: `updateSpawnDisabledWarningForPlayer`, `checkTeamSwitchInteractPointRemoval`, `InteractMultiClickDetector.checkMultiClick` (3 `mod.GetSoldierState`-equivalent reads per pid per tick) | Multiplied by player count. At N=24, 8 Hz × 24 = 192 `OngoingPlayer` invocations/sec. The triple-tap detector is the main cost (per Conquest's R25). |
| **P3** | `OnGameModeStarted` master 1 s loop | [src/index.ts:128](../src/index.ts#L128) | **1 Hz** | Per-iteration: `updateAllPlayersClock` (per-pid digit writes), `updateOvertimeStage`, `checkTakeoffLimitForAllPlayers` (per-pid soldier-state read), `applyAutoReadyForAllPlayers` (per-pid ready check), `syncKillsHudFromTrackedTotals` (per-pid text writes), optional victory-dialog update | 1 Hz × ~5 N-player broadcasts. At N=24, ~120 per-pid widget passes/sec. Hardest hit during victory-dialog active. |
| **P4** | `pollVehicleSpawnerSlots` async tick | [src/vehicles.ts:420](../src/vehicles.ts#L420) (`VEHICLE_SPAWNER_POLL_INTERVAL_SECONDS = 1.0`) | **1 Hz** | Iterates `State.vehicles.slots[]` (≤8 entries); for each, `findVehicleById(slot.vehicleId)` does linear scan of `mod.AllVehicles()` → ~8 × N_vehicles engine calls/sec | Bounded by vehicle count (≤8 slots × ~16 live vehicles). Not the hottest path but does the most `mod.AllVehicles()` work. |
| **P5** | `runAircraftCeilingSoftEnforcementLoop` async tick | [src/ready-dialog.ts](../src/ready-dialog.ts) (`AIRCRAFT_SOFT_CEILING_TICK_SECONDS = 0.2`) | **5 Hz when custom ceiling enabled** | Iterates `mod.AllVehicles()`, for each aircraft reads vehicle state, conditionally `mod.Teleport(vehicle, ...)` and `mod.GetVehicleState(...)` | Only runs when `useCustomCeiling=true` on the active map (Mirak Valley, Operation Firestorm, Liberation Peak, Sobek City). Latent off elsewhere. |
| **P6** | `OnPlayerEnterVehicle` event handler | [src/index.ts:454](../src/index.ts#L454) | **Event-driven** (≤1 per cluster of vehicle entries) | Heavy: `arrayContainsVehicle` × 2 (T1, T2), `getObjId`, `inferBaseTeamFromPosition`, `registerVehicleToTeam`, 2× `sendHighlightedWorldLogMessage`, `handleOvertimePlayerEnterVehicle` | Marked "Known fragility – error prone" in source. Engine drops events under load (per Conquest memory `project_engine_event_reliability_asymmetric`). |
| **P7** | `OnVehicleSpawned` event handler | [src/index.ts:572](../src/index.ts#L572) | **Event-driven** (≤8 spawns at round start, then 0 until destruction) | Heavy: binds to slot via token + position fallback, force-`UnspawnObject` on default spawn, re-`forceSpawnWithRetry`, registers to team, broadcasts | Burst at round start + cleanup; idle otherwise. |
| **P8** | `updatePlayersReadyHudTextForAllPlayers` | [src/hud.ts:411](../src/hud.ts#L411) | **Pre-LIVE only** (during NotReady) | Per-pid: `getActivePlayers` (build active list), then per-pid `safeSetUIWidgetVisible` + `mod.SetUITextLabel` + `mod.SetUITextColor` | Triggered by every ready toggle, team swap, main-base exit, deploy event during NotReady. Cost ≈ O(N²) on bursty ready storms. |
| **P9** | `renderReadyDialogForAllVisibleViewers` | [src/ready-dialog.ts](../src/ready-dialog.ts) | **Pre-LIVE only**, on every roster change | Per-viewer iterate `refreshReadyDialogRosterForViewer` → per-pid row text writes (`TEAM_ROSTER_MAX_ROWS = 16` per side) | Heaviest during pre-game UI churn (cancel/reconfirm). |
| **P10** | `updateOvertimeHudForAllPlayers` | [src/overtime.ts](../src/overtime.ts) | **From inside P1** (4 Hz when Active) | Per-pid: build snapshot, diff against `lastUiSnapshotByPid`, conditional `SetUIText*` writes; bar fill widths, percent text, count text, crowns, vehicle-required indicator | Conquest pattern: signature-diff gate already implemented, which is good. Cost only paid on changed snapshots. |

**Key architectural observations**:
1. Helis has **no equivalent of Conquest's `refreshLiveCaptureStateSubtick`** (Conquest's #1 hot path) — because capture is only relevant during the last 60 s of each round and only on one CP at a time.
2. Helis has **no equivalent of Conquest's `updateConquestCombatHudForAllPlayers`** force-broadcast burst (Conquest's #1 spike risk) — because there is no per-flag engage HUD that fires force broadcasts on enter/exit.
3. Helis **does not yet have a tick-context / `AllPlayers` cache** (Conquest's R33/G2/G3 pattern). Every `forAllPlayers` helper calls `mod.AllPlayers()` + `mod.CountOf()` fresh.
4. Helis **does not yet have a HUD dirty-flag contract** (Conquest's combat-HUD-dirty / `markHudDirty` pattern). The 1 s master loop unconditionally calls `updateAllPlayersClock`, `syncKillsHudFromTrackedTotals`, etc.

---

## 9. Compile-Time / Runtime Feature Flags

There are **no `FEATURE_*` compile-time flags** in Helis-only as of v0.630. (Conquest uses `FEATURE_PERF_DIAG`, `FEATURE_LAZY_BUILD`, etc.; Helis intentionally skipped the dead-code elimination machinery during the v0.630 pipeline port because there was nothing flagged.)

**Runtime gameplay/debug toggles** ([src/types.ts](../src/types.ts) constants, evaluated at module load — not flippable without a redeploy):

| Flag | Default | Effect |
|---|---|---|
| `ENABLE_GAMEPLAY_MESSAGES` | `true` | Player-facing world-log/notification messages (must stay on). |
| `ENABLE_DEBUG_NOTIFICATION_MESSAGES` | `false` | Green-box dev notifications. |
| `ENABLE_DEBUG_HIGHLIGHTED_MESSAGES` | `false` | White-box highlighted-log dev messages. |
| `ENABLE_CP_VIS_DEBUG` | `false` | Capture-point visibility debug logs. |
| `SHOW_DEBUG_TIMELIMIT` | `false` | Top-right debug time-limit text. |
| `SHOW_HELP_TEXT_PROMPT_ON_JOIN` | `true` | Show join help prompt on first connect. |
| `DEFAULT_LIVE_RESPAWN_ENABLED` | `true` | Admin-togglable live respawn allowed during rounds. |
| `DEBUG_TEST_NAMES_TEAM_1`, `DEBUG_TEST_NAMES_TEAM_2` | `0` | Synthetic roster row count for UI testing (T1, T2 each). |
| `AIRCRAFT_CEILING_ENFORCEMENT_MODE` | `"hard"` | Hard = engine `SetMaxAltitude`; Soft = scripted nudge loop. |

Runtime admin toggles (`State.admin.*` mutated by Admin Panel buttons): `liveRespawnEnabled`, `debugLoopActive`, `tieBreakerOverrideIndex`, `tieBreakerModeIndex` (0=LastRoundOnly, 1=AllRounds, 2=Disabled).

---

## 10. How to keep this file accurate

After every `npm run bumpVersion`, update:

1. **Project Stats row** (Section 2) — version, bundle size, headroom.
2. **File map row(s)** (Section 3) — for any `.ts` file with ≥5% line/byte change.
3. **Function inventory** (Section 4) — add/remove rows for any added/removed top-level function.
4. **State shape** (Section 5) — if `GameState` adds/removes a top-level key or a per-pid map.
5. **H ranking** (Section 7) — if a per-pid allocator is added or removed; re-rank by estimated heap impact.
6. **Hot-path P ranking** (Section 8) — if a new loop is added or a loop's cadence changes.
7. **Feature flag table** (Section 9) — if a runtime toggle is added.

When a new playtest produces frame-time telemetry, replace the "assumed cadence" notes in Section 8 with measured values and re-rank if material.
