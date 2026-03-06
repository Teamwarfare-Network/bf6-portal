// @ts-nocheck
// Module: utils/multi-click -- interact triple-tap detector

//#region -------------------- MultiClickDetector (triple tap interact) --------------------

// Local triple-tap detector used by OngoingPlayer to open the ready dialog interact point.
// Keep local (instead of external dependency) to preserve deterministic bundle behavior.
class InteractMultiClickDetector {
    private static readonly STATES: Record<number, { lastIsInteracting: boolean; clickCount: number; sequenceStartTime: number }> = {};
    private static readonly WINDOW_MS = 2_000; // Tuned to allow slower input cadence on controller.
    private static readonly REQUIRED_CLICKS = 3;

    public static checkMultiClick(player: mod.Player): boolean {
        const playerId = mod.GetObjId(player);
        const isInteracting = safeGetSoldierStateBool(player, mod.SoldierStateBool.IsInteracting);

        let state = this.STATES[playerId];
        if (!state) {
            this.STATES[playerId] = state = {
                lastIsInteracting: isInteracting,
                clickCount: 0,
                sequenceStartTime: 0,
            };
        }

        if (isInteracting === state.lastIsInteracting) return false;
        state.lastIsInteracting = isInteracting;

        if (!isInteracting) return false;

        const now = Date.now();

        if (state.clickCount > 0 && now - state.sequenceStartTime > this.WINDOW_MS) {
            state.clickCount = 0;
        }

        if (state.clickCount === 0) {
            state.sequenceStartTime = now;
            state.clickCount = 1;
            return false;
        }

        if (++state.clickCount !== this.REQUIRED_CLICKS) return false;

        state.clickCount = 0;
        return true;
    }
}

//#endregion ----------------- MultiClickDetector (triple tap interact) --------------------
