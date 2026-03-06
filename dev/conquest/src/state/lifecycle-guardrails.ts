// @ts-nocheck
// Module: state/lifecycle-guardrails -- centralized legacy lifecycle mutator owner (Phase 1 scaffold)

type LegacyLifecycleMutator = 'game-mode-start' | 'pregame-start-match' | 'pregame-end-match' | 'fresh-setup';

// Applies one authoritative lifecycle snapshot update to all legacy phase/end state fields.
function applyLegacyLifecycleSnapshot(
    phase: MatchPhase,
    isEnded: boolean,
    victoryDialogActive: boolean,
    winnerTeam: TeamID | 0 | undefined,
    endElapsedSecondsSnapshot: number,
    victoryStartElapsedSecondsSnapshot: number
): void {
    State.round.phase = phase;
    State.match.isEnded = isEnded;
    State.match.victoryDialogActive = victoryDialogActive;
    State.match.winnerTeam = winnerTeam;
    State.match.endElapsedSecondsSnapshot = endElapsedSecondsSnapshot;
    State.match.victoryStartElapsedSecondsSnapshot = victoryStartElapsedSecondsSnapshot;
}

// Phase 1 guardrail:
// Keep all legacy lifecycle state writes in one owner module so caller paths are auditable.
function lifecycleSetNotReadyBaseline(_mutatedBy: LegacyLifecycleMutator): void {
    applyLegacyLifecycleSnapshot(MatchPhase.NotReady, false, false, undefined, 0, 0);
}

// Switches lifecycle to live baseline without ending/victory side effects.
function lifecycleSetLiveBaseline(_mutatedBy: LegacyLifecycleMutator): void {
    applyLegacyLifecycleSnapshot(MatchPhase.Live, false, false, undefined, 0, 0);
}

// Attempts one-way transition into game-over state; returns false if already in victory flow.
function lifecycleTrySetGameOver(_mutatedBy: LegacyLifecycleMutator, winnerTeam: TeamID | 0): boolean {
    if (State.match.victoryDialogActive) return false;
    const nowSeconds = Math.floor(mod.GetMatchTimeElapsed());
    applyLegacyLifecycleSnapshot(MatchPhase.GameOver, true, true, winnerTeam, nowSeconds, nowSeconds);
    return true;
}
