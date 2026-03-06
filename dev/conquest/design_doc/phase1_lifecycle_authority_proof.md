# Phase 1 Lifecycle Authority Proof

Last updated: 2026-03-01  
Requirement format:
`lifecycle mutator inventory -> owner function -> allowed callers -> guard/latch proof -> blocked legacy path proof`

## Lifecycle Mutator Inventory

| Lifecycle mutator inventory                                            | Owner function                                                             | Allowed callers                                                                                       | Guard/latch proof                                                                                                      | Blocked legacy path proof                                                                                    |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Set baseline `NOT_READY` state (`phase`, `isEnded`, victory snapshots) | `lifecycleSetNotReadyBaseline(...)` in `src/state/lifecycle-guardrails.ts` | `onGameModeStartedImpl` (`src/index/game-mode.ts`), `triggerFreshMatchSetup` (`src/conquest-flow.ts`) | Owner function routes all related fields through `applyLegacyLifecycleSnapshot(...)` in one write path.                | Direct assignments in previous callers were removed and replaced with owner function calls.                  |
| Set baseline `LIVE` state (`phase`, `isEnded`, victory snapshots)      | `lifecycleSetLiveBaseline(...)` in `src/state/lifecycle-guardrails.ts`     | `startMatch` (`src/conquest-flow.ts`)                                                                 | Owner function routes all related fields through `applyLegacyLifecycleSnapshot(...)` in one write path.                | No remaining direct `State.round.phase = MatchPhase.Live` outside owner module.                              |
| Set `GAME_OVER` state and freeze snapshots                             | `lifecycleTrySetGameOver(...)` in `src/state/lifecycle-guardrails.ts`      | `endMatch` (`src/conquest-flow.ts`)                                                                   | Explicit early guard `if (State.match.victoryDialogActive) return false;` prevents duplicate lifecycle end transition. | Caller now exits if owner function returns `false`; duplicate end transitions are blocked at owner boundary. |

## Legacy Path Block Proof

Search used after refactor:

```text
rg -n "State\.round\.phase\s*=|State\.match\.isEnded\s*=|State\.match\.victoryDialogActive\s*=|State\.match\.winnerTeam\s*=|State\.match\.endElapsedSecondsSnapshot\s*=|State\.match\.victoryStartElapsedSecondsSnapshot\s*=" bf6-portal/dev/conquest/src
```

Result summary:

- Remaining direct lifecycle writes are centralized in `src/state/lifecycle-guardrails.ts`.
- No direct lifecycle writes remain in `src/index/game-mode.ts` or `src/conquest-flow.ts` caller paths.

## Phase 1 Scope Note

- This is a guardrail scaffold for legacy 3-state flow.
- The full 5-state conquest lifecycle (`NOT_READY -> PRE_MATCH -> LIVE_MATCH -> POST_MATCH -> RESET`) remains a later
  cutover task per design rules.
