# Phase 1 Verification Notes

Last updated: 2026-03-01  
Scope: `Phase 1: Foundation and Wiring`

## Automated Checks

| Check                                  | Command                             | Result                        | Notes                                                                      |
| -------------------------------------- | ----------------------------------- | ----------------------------- | -------------------------------------------------------------------------- | -------------------------------- | ----------------------------------------------- | -------------------------------------------------------------- | ---- | ---------------------------------------------------------------------------- |
| Build output + strings verification    | `npm run verify`                    | Pass                          | `dist/bundle.ts` and `dist/bundle.strings.json` exist; strings JSON valid. |
| TypeScript compile sanity              | `npx tsc --pretty false --noEmit`   | Pass                          | No type errors reported.                                                   |
| Lifecycle mutator centralization audit | `rg -n "State\\.round\\.phase\\s\*= | State\\.match\\.isEnded\\s\*= | State\\.match\\.victoryDialogActive\\s\*=                                  | State\\.match\\.winnerTeam\\s\*= | State\\.match\\.endElapsedSecondsSnapshot\\s\*= | State\\.match\\.victoryStartElapsedSecondsSnapshot\\s\*=" src` | Pass | Runtime lifecycle writes centralized to `src/state/lifecycle-guardrails.ts`. |

## Artifact Sanity

| Artifact                                           | Result  | Notes                                                             |
| -------------------------------------------------- | ------- | ----------------------------------------------------------------- |
| `design_doc/api_checklist.md`                      | Present | Baseline `Confirmed`/`Replaced`/`Deferred` status table included. |
| `design_doc/phase1_capture_api_proof.md`           | Present | Capture API proof rows include symbol and local reference paths.  |
| `design_doc/phase1_lifecycle_authority_proof.md`   | Present | Owner/caller/guard proof documented.                              |
| `design_doc/phase1_validator_capability_matrix.md` | Present | Capability-bounded validator matrix documented.                   |

## Manual/In-Game Checks (Pending Human Run)

| Check                                               | Status  | Notes                                 |
| --------------------------------------------------- | ------- | ------------------------------------- |
| Startup smoke with no HUD/clock/vehicle regressions | Pending | Requires in-game run by human tester. |
| Join/leave/redeploy/team swap behavior sanity       | Pending | Requires in-game run by human tester. |
| Admin start/end flow sanity                         | Pending | Requires in-game run by human tester. |

## String Authorization Audit

- Policy gate is now defined in:
    - `bf6-portal/dev/conquest/AGENTS.md` (`String Change Authorization Policy`)
    - `bf6-portal/dev/conquest/design_doc/TWL_Conquest_Design.md` (`CF-118`)
- For this step, no new string edits were applied.
