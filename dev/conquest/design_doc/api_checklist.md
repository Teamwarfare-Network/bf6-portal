# TWL Conquest API Checklist

Last updated: 2026-03-01  
Scope: Phase 1 baseline + Phase 2A kickoff for `bf6-portal/dev/conquest`  
Source of truth: `bf6-portal/dev/reference_bf6_core`

## Status Legend

- `Confirmed`: symbol verified in `reference_bf6_core` and safe to use.
- `Replaced`: original plan symbol/path replaced with a verified alternative.
- `Deferred`: symbol/path intentionally not active in this phase.

## Primary Core References

- `bf6-portal/dev/reference_bf6_core/00-api-reference-index.md`
- `bf6-portal/dev/reference_bf6_core/mod/00-api-index.md`
- `bf6-portal/dev/reference_bf6_core/modlib/00-api-index.md`
- `bf6-portal/dev/reference_bf6_core/mod/namespaces/EventHandlerSignatures.md`

## Phase 1: Foundation and Wiring

| Requirement             | Symbol                       | Status    | Core reference path                        | Local implementation path         | Notes                                            |
| ----------------------- | ---------------------------- | --------- | ------------------------------------------ | --------------------------------- | ------------------------------------------------ |
| Event entrypoint        | `OnGameModeStarted`          | Confirmed | `mod/namespaces/EventHandlerSignatures.md` | `src/index.ts`                    | Active runtime entrypoint.                       |
| Event entrypoint        | `OnPlayerJoinGame`           | Confirmed | `mod/namespaces/EventHandlerSignatures.md` | `src/index.ts`                    | Active runtime entrypoint.                       |
| Event entrypoint        | `OnPlayerLeaveGame`          | Confirmed | `mod/namespaces/EventHandlerSignatures.md` | `src/index.ts`                    | Active runtime entrypoint.                       |
| Event entrypoint        | `OnPlayerDeployed`           | Confirmed | `mod/namespaces/EventHandlerSignatures.md` | `src/index.ts`                    | Active runtime entrypoint.                       |
| Event entrypoint        | `OnPlayerUndeploy`           | Confirmed | `mod/namespaces/EventHandlerSignatures.md` | `src/index.ts`                    | Active runtime entrypoint.                       |
| Event entrypoint        | `OngoingPlayer`              | Confirmed | `mod/namespaces/EventHandlerSignatures.md` | `src/index.ts`                    | Active runtime entrypoint.                       |
| Event entrypoint        | `OnPlayerInteract`           | Confirmed | `mod/namespaces/EventHandlerSignatures.md` | `src/index.ts`                    | Active runtime entrypoint.                       |
| Event entrypoint        | `OnPlayerUIButtonEvent`      | Confirmed | `mod/namespaces/EventHandlerSignatures.md` | `src/index.ts`                    | Active runtime entrypoint.                       |
| Event entrypoint        | `OnVehicleSpawned`           | Confirmed | `mod/namespaces/EventHandlerSignatures.md` | `src/index.ts`                    | Active runtime entrypoint.                       |
| Event entrypoint        | `OnVehicleDestroyed`         | Confirmed | `mod/namespaces/EventHandlerSignatures.md` | `src/index.ts`                    | Active runtime entrypoint.                       |
| Event entrypoint        | `OngoingCapturePoint`        | Confirmed | `mod/namespaces/EventHandlerSignatures.md` | `src/index.ts`                    | Active capture routing path in Phase 2A kickoff. |
| Event entrypoint        | `OnPlayerEnterAreaTrigger`   | Confirmed | `mod/namespaces/EventHandlerSignatures.md` | `src/index.ts`                    | Active runtime entrypoint.                       |
| Event entrypoint        | `OnPlayerExitAreaTrigger`    | Confirmed | `mod/namespaces/EventHandlerSignatures.md` | `src/index.ts`                    | Active runtime entrypoint.                       |
| Lifecycle/finalization  | `mod.EndGameMode(team)`      | Confirmed | `mod/functions/EndGameMode.md`             | `src/state/core.ts`               | Team overload is the active path.                |
| Lifecycle/deploy gating | `mod.EnableAllPlayerDeploy`  | Confirmed | `mod/functions/EnableAllPlayerDeploy.md`   | `src/conquest-flow.ts`            | Used by start/end flow.                          |
| Startup safety cap      | `mod.SetGameModeTargetScore` | Confirmed | `mod/functions/SetGameModeTargetScore.md`  | `src/index/game-mode.ts`          | Prevents premature engine auto-end.              |
| Runtime clock/time      | `mod.GetMatchTimeElapsed`    | Confirmed | `mod/functions/GetMatchTimeElapsed.md`     | `src/*`                           | Used broadly in flow/HUD/debug timing.           |
| Object identity         | `mod.GetObjId`               | Confirmed | `mod/functions/GetObjId.md`                | `src/state/id-helpers.ts`         | Base identity primitive (`pid`/object id).       |
| Variable storage        | `mod.SetVariable`            | Confirmed | `mod/functions/SetVariable.md`             | `src/index/game-mode.ts`          | Vehicle registry globals init.                   |
| Player iteration        | `mod.AllPlayers`             | Confirmed | `mod/functions/AllPlayers.md`              | `src/*`                           | Broadly used in HUD/flow updates.                |
| Async timing            | `mod.Wait`                   | Confirmed | `mod/functions/Wait.md`                    | `src/*`                           | Used in lifecycle, countdown, vehicle loops.     |
| UI parser helper        | `modlib.ParseUI`             | Confirmed | `modlib/functions/ParseUI.md`              | `src/hud/*`, `src/ready-dialog/*` | Primary UI construction helper.                  |

## Phase 2A Surface (Pre-validated in Phase 1)

| Requirement        | Symbol                                 | Status    | Core reference path                        | Activation phase | Notes                                                                             |
| ------------------ | -------------------------------------- | --------- | ------------------------------------------ | ---------------- | --------------------------------------------------------------------------------- |
| Capture event path | `OnCapturePointCapturing`              | Confirmed | `mod/namespaces/EventHandlerSignatures.md` | Phase 2A         | Not wired in current baseline.                                                    |
| Capture event path | `OnCapturePointCaptured`               | Confirmed | `mod/namespaces/EventHandlerSignatures.md` | Phase 2A         | Not wired in current baseline.                                                    |
| Capture event path | `OnCapturePointLost`                   | Confirmed | `mod/namespaces/EventHandlerSignatures.md` | Phase 2A         | Not wired in current baseline.                                                    |
| Capture event path | `OnPlayerEnterCapturePoint`            | Confirmed | `mod/namespaces/EventHandlerSignatures.md` | Phase 2A         | Not wired in current baseline.                                                    |
| Capture event path | `OnPlayerExitCapturePoint`             | Confirmed | `mod/namespaces/EventHandlerSignatures.md` | Phase 2A         | Not wired in current baseline.                                                    |
| Capture data read  | `mod.GetCaptureProgress`               | Confirmed | `mod/functions/GetCaptureProgress.md`      | Phase 2A         | Owner/progress parity checks.                                                     |
| Capture data read  | `mod.GetCurrentOwnerTeam`              | Confirmed | `mod/functions/GetCurrentOwnerTeam.md`     | Phase 2A         | Ownership projection path.                                                        |
| Capture data read  | `mod.GetOwnerProgressTeam`             | Confirmed | `mod/functions/GetOwnerProgressTeam.md`    | Phase 2A         | Owner-progress team read.                                                         |
| Capture data read  | `mod.GetPreviousOwnerTeam`             | Confirmed | `mod/functions/GetPreviousOwnerTeam.md`    | Phase 2A         | Transition accounting.                                                            |
| Capture data read  | `mod.GetPlayersOnPoint`                | Confirmed | `mod/functions/GetPlayersOnPoint.md`       | Phase 2A         | Capture-credit eligibility support.                                               |
| Score mirroring    | `mod.SetGameModeScore(team, newScore)` | Confirmed | `mod/functions/SetGameModeScore.md`        | Phase 2A         | Ticket authority remains in `State`; engine score receives write-only projection. |

## Phase 4 KPI Surface (Gate Placeholder)

| Requirement                         | Symbol                          | Status   | Core reference path                                         | Activation phase | Notes                                                                      |
| ----------------------------------- | ------------------------------- | -------- | ----------------------------------------------------------- | ---------------- | -------------------------------------------------------------------------- |
| Kill/death/assist event attribution | `TBD (no symbol committed yet)` | Deferred | `mod/namespaces/EventHandlerSignatures.md` (to be narrowed) | Phase 4          | Must be resolved to `Confirmed` or `Replaced` before Phase 4 signoff.      |
| Permanent death decision path       | `TBD (no symbol committed yet)` | Deferred | `mod/functions` / `mod/namespaces` (to be narrowed)         | Phase 4          | Must map to a verified API path before enabling assist finalization logic. |

## Phase 1 Notes

- No invented API symbols are introduced in this artifact.
- Capture symbols required by Phase 2A are already verified in core references.
- KPI-specific attribution symbols remain intentionally deferred until Phase 4 gate work.
- Event signature detail gap: `EventHandlerSignatures.md` confirms capture-event names, but per-event local signature
  files are not present in this core snapshot.
