# Plan: Match Clock — Early-Return Gate (Phase A) + Clocks.CountDownClock Migration (Phase B)

**Created:** 2026-04-21 (post-v1.334)
**Supersedes:** The air-deploy/loadout plan that previously lived here (v1.333/v1.334 shipped).

---

## Context

We are 2 days from a 64-player playtest. The Conquest match clock in [src/clock/state.ts](bf6-portal/dev/conquest/src/clock/state.ts) is one of three HIGH-severity per-player hot paths flagged in the optimization pass. Two corrections to the original framing discovered while gathering context:

1. **Cadence is already 1 Hz, not per-subtick.** The caller at [src/index/game-mode.ts:141-159](bf6-portal/dev/conquest/src/index/game-mode.ts#L141-L159) gates `updateAllPlayersClock()` on `nowSecondBoundary !== lastSecondBoundary` (since `shouldClockUseCriticalFlashSubtick()` returns `false`). The real 64-player cost is ~64 unconditional per-player ops/sec, not 256+. H2 severity drops from HIGH to MED, but the fix remains worthwhile.

2. **The unconditional per-player work is mostly idempotent but still allocating/dispatching.** Inside the 1 Hz loop, `ensureClockUIAndGetCache`, `setClockVisibilityCached`, and `updateVictoryDialogForPlayer` run per player even when the displayed second has not changed. Digit writes are already gated by `lastDisplayedSeconds !== displayRemaining` at [src/clock/state.ts:170](bf6-portal/dev/conquest/src/clock/state.ts#L170). Color writes gated by `lastLowTimeState` at line 166.

Intended outcome:
- **Phase A (immediate, ~5 lines):** skip the whole per-player loop when neither `displayRemaining` nor `clockColorIsLow` changed. Captures the 64-player savings without touching the clock's state machine.
- **Phase B (architectural):** migrate the manual time math (`matchStartElapsedSeconds + durationSeconds` / `pausedRemainingSeconds`) to the inlined `Clocks.CountDownClock` from [src/foundation/bf6-utils/clocks.ts](bf6-portal/dev/conquest/src/foundation/bf6-utils/clocks.ts). Drift-corrected ticking, pattern unified with vehicle respawn, `onSecond` drives HUD painting, `onComplete` fires expiry handlers.

---

## Attribution (user requested visibility)

`Clocks` and `Timers` were inlined from Mike DeLuca's `bf6-portal-utils` (MIT © 2026):

- **File:** [src/foundation/bf6-utils/clocks.ts](bf6-portal/dev/conquest/src/foundation/bf6-utils/clocks.ts) — verbatim module copy; ATTRIBUTION header at lines 2-9.
- **Bundled via flat concat:** [src/index.ts:44-47](bf6-portal/dev/conquest/src/index.ts#L44-L47) pulls `logging`, `callback-handler`, `timers`, `clocks`.
- **Header-file credit:** [src/header-file.ts:59-63](bf6-portal/dev/conquest/src/header-file.ts#L59-L63) credits Mike DeLuca, links the upstream repo, documents "Modules used: Logging, CallbackHandler, Timers, Clocks", and notes the migration path to `npm i -D bf6-portal-utils`.
- **Existing production use:** [src/state/runtime-types.ts:57](bf6-portal/dev/conquest/src/state/runtime-types.ts#L57) (`respawnClock?: Clocks.CountDownClock`) and [src/vehicles/vanilla-spawner.ts:439](bf6-portal/dev/conquest/src/vehicles/vanilla-spawner.ts#L439) (vehicle respawn timers).

No attribution changes required by this plan. Header block already covers it.

---

## Phase A — Early-Return Gate (ship first)

### Change

At [src/clock/state.ts:150](bf6-portal/dev/conquest/src/clock/state.ts#L150), **before** `const players = mod.AllPlayers()`, add:

```ts
if (
    State.round.clock.lastDisplayedSeconds === displayRemaining &&
    State.round.clock.lastLowTimeState === clockColorIsLow
) {
    return;
}
```

No other edits. The existing writes to `lastDisplayedSeconds` / `lastLowTimeState` at lines 187-188 remain (they set the baseline on the first tick of each new second; on subsequent identical-second ticks the gate fires).

### Why this is safe (verified by exploration)

- **Digit writes already skipped when second unchanged** ([state.ts:170](bf6-portal/dev/conquest/src/clock/state.ts#L170) gate).
- **`setClockColorCached` already skipped when low-time state unchanged** ([state.ts:166](bf6-portal/dev/conquest/src/clock/state.ts#L166) gate).
- **`ensureClockUIAndGetCache` is first-call-idempotent** — cached refs returned on subsequent calls; no widget creation per tick.
- **`setClockVisibilityCached` short-circuits** when visibility state unchanged.
- **`updateVictoryDialogForPlayer` is safe to gate.** It paints the restart countdown using `State.match.endElapsedSecondsSnapshot` (static) and receives `remainingSeconds` as a param. Only needs to repaint when `remainingSeconds` changes (exactly our gate condition). Dialog-open initial paint goes through [ui/conquest/top-hud-shell.ts:225](bf6-portal/dev/conquest/src/ui/conquest/top-hud-shell.ts#L225), not this loop.
- **Join-time clock paint** already relies on the next second boundary — no regression.
- **Admin adjust paths** all reset `lastDisplayedSeconds = undefined` and `lastLowTimeState = undefined` ([state.ts:101-102](bf6-portal/dev/conquest/src/clock/state.ts#L101-L102); same pattern in `resetMatchClock`/`setMatchClockPreview`), forcing the next call through the full loop. Gate cannot strand admin updates.

### Risks (Phase A)

1. **Soft-edge on color pulse transition** — when the clock ticks `5 → 4`, both `displayRemaining` changes AND `clockColorIsLow` may flip. The `&&` condition correctly fires-through on ANY change. Verified.
2. **New player joins during identical-second repeats** — no regression vs today: current code also requires a next-second boundary to paint a joining player's clock (no join-specific paint call exists per the audit).

### Verification (Phase A)

1. Bump: `npm run bumpVersion -- -c "clock: early-return gate when per-player paint is a no-op; retires 64-player per-second hot path"`
2. Solo test:
   - Start match → clock ticks down visibly.
   - Wait for final minute → color pulses red/white each second.
   - Admin pause → clock freezes, stays visible.
   - Admin +60s / -60s → clock repaints immediately.
   - Match expires → victory dialog opens, restart countdown ticks.
   - Join mid-match → new player sees clock within 1s.
3. Regression: no flicker, no missing-digit paints, no stale low-time color.

### Rollback (Phase A)

Single-commit revert. Removing the 5-line gate restores exact pre-A behavior.

---

## Phase B — Clocks.CountDownClock Migration

**Only ship if Phase A passes clean and time permits before playtest.** Phase A already captures the 64-player savings. Phase B is an architectural win (drift correction, pattern unification) with larger blast radius.

### Approach

The `CountDownClock` instance becomes the authoritative time source. The existing `State.round.clock.*` fields become **shadow fields** kept in sync with the clock so external consumers (which reach around the module) keep working without refactor.

### External reach-around consumers (MUST preserve)

Found via exploration; these read `State.round.clock.*` directly instead of via exported accessors:

| Site | Fields read | Strategy |
|---|---|---|
| [capture-tickets.ts:376-388](bf6-portal/dev/conquest/src/index/capture-tickets.ts#L376-L388) (`deriveConquestHudClockViewModel`) | `durationSeconds`, `matchStartElapsedSeconds`, `pausedRemainingSeconds`, `isPaused` | Keep shadow fields in sync. Zero consumer change. |
| [capture-tickets.ts:1713](bf6-portal/dev/conquest/src/index/capture-tickets.ts#L1713) | `getRemainingSeconds()` | Already via accessor. No change. |
| [interaction/actions.ts:145-148](bf6-portal/dev/conquest/src/interaction/actions.ts#L145-L148) | `isPaused`, `matchStartElapsedSeconds` | Shadow fields sync. No change. |
| [conquest-flow.ts:149](bf6-portal/dev/conquest/src/conquest-flow.ts#L149) | `matchLengthSeconds` | Configured constant; kept as-is (not derived from clock). |
| [admin-panel/events.ts:59](bf6-portal/dev/conquest/src/admin-panel/events.ts#L59) | `isPaused` | Shadow field sync. No change. |
| [ui/conquest/top-hud-shell.ts:225](bf6-portal/dev/conquest/src/ui/conquest/top-hud-shell.ts#L225) | `getRemainingSeconds()` | Via accessor. No change. |

**Decision:** keep shadow fields. Refactoring 4+ external consumers plus testing them is not worth the risk 2 days from playtest. The clock becomes source-of-truth; shadows are one-way sinks updated by the clock's callbacks and mutation wrappers.

### Clocks.CountDownClock gotchas (verified in API audit)

These shape the implementation:

1. **`.addSeconds(n)` SUBTRACTS from remaining.** Inverted semantics — countdown logic, not intuitive. Admin +60s must call `.subtractSeconds(60)` (which adds time). Mitigation: tiny local wrappers `countdownAddRemainingSeconds(n)` / `countdownRemoveRemainingSeconds(n)` inside `clock/state.ts` that hide the inversion.
2. **`.reset()` resets to ZERO, not duration.** Match restart pattern: allocate a fresh instance OR call `.setDuration(matchLength)` + `.reset()` + `.start()`. We allocate fresh on match start for clarity; one allocation per match is negligible.
3. **`.seconds` returns FLOAT.** Must `Math.floor` to match current integer display behavior.
4. **`onComplete` auto-stops the clock.** After expiry the clock will not re-tick without explicit `.reset()`. Admin "add time post-expiry" path must detect this and re-prime.
5. **`.setDuration(n)` does NOT fire callbacks or re-tick.** Any live path that changes duration must also trigger a manual `updateAllPlayersClock()` for immediate paint.
6. **`Timers.setTimeout` drives ticks.** If the callback throws, the timer may not re-schedule. Wrap `onSecond` body in `try/catch`.

### State field strategy

Extend [src/state/runtime-types.ts](bf6-portal/dev/conquest/src/state/runtime-types.ts):

```ts
// In the clock sub-state:
countdown?: Clocks.CountDownClock;   // NEW - authoritative time source
// Existing fields kept as shadows, derived from countdown:
//   durationSeconds              = mirrored via countdown.duration
//   matchStartElapsedSeconds     = set on start, undefined on preview
//   pausedRemainingSeconds       = Math.floor(countdown.seconds) when paused, else undefined
//   isPaused                     = mirrored via countdown.isPaused
//   matchLengthSeconds           = configured (NOT derived)
//   expiryFired                  = kept (used by endMatch() idempotency in conquest-flow.ts:93)
//   expiryHandlers               = kept (registered by conquest-flow.ts:13)
//   lastDisplayedSeconds         = kept (Phase A gate)
//   lastLowTimeState             = kept (Phase A gate)
```

### Function rewrites

All in [src/clock/state.ts](bf6-portal/dev/conquest/src/clock/state.ts). Each keeps its current exported signature; no caller surface changes.

- **`resetMatchClock(seconds)`** — allocate `new Clocks.CountDownClock(clampedSeconds, { onSecond: onClockSecond, onComplete: onClockComplete })`, call `.start()`, write shadows (`durationSeconds`, `matchLengthSeconds`, `matchStartElapsedSeconds = Math.floor(mod.GetMatchTimeElapsed())`, `isPaused = false`, `pausedRemainingSeconds = undefined`, `expiryFired = false`, gate fields undefined).
- **`setMatchClockPreview(seconds)`** — allocate clock but do NOT start (stays paused at construction). Write shadows (`isPaused = true`, `pausedRemainingSeconds = clampedSeconds`, `matchStartElapsedSeconds = undefined`, `expiryFired = false`, gate fields undefined).
- **`getRemainingSeconds()`** — return `countdown ? Math.max(0, Math.floor(countdown.seconds)) : 0`. Preserves integer semantics of current impl.
- **`adjustMatchClockBySeconds(delta)`** — branch:
  - If `countdown.isComplete && delta > 0`: re-prime (`setDuration(delta)` + `.reset()` + `.start()`), clear `expiryFired`.
  - Else if `delta > 0`: `countdownAddRemainingSeconds(delta)` (calls `.subtractSeconds(delta)`). Clear `expiryFired`.
  - Else if `delta < 0`: `countdownRemoveRemainingSeconds(-delta)` (calls `.addSeconds(-delta)`).
  - Update shadow `durationSeconds`; if paused, also update `pausedRemainingSeconds`. Clear `lastDisplayedSeconds` / `lastLowTimeState`.
- **`resetMatchClockToDefault()`** — unchanged body (delegates to `resetMatchClock`).
- **`updateAllPlayersClock()`** — body unchanged EXCEPT: remove the manual expiry-handler trigger at lines 128-132 (moved to `onClockComplete`). Keep the Phase A gate. Keep the per-player loop.

### New internal callbacks

```ts
function onClockSecond(currentSeconds: number): void {
    try {
        if (State.round.clock.isPaused) {
            State.round.clock.pausedRemainingSeconds = Math.max(0, Math.floor(currentSeconds));
        }
        updateAllPlayersClock();
    } catch {}
}

function onClockComplete(): void {
    try {
        if (State.round.clock.expiryFired) return;
        State.round.clock.expiryFired = true;
        for (let i = 0; i < State.round.clock.expiryHandlers.length; i++) {
            try { State.round.clock.expiryHandlers[i](); } catch {}
        }
        updateAllPlayersClock(); // paint final 00:00
    } catch {}
}
```

### Caller changes

- **[src/index/game-mode.ts:141-159](bf6-portal/dev/conquest/src/index/game-mode.ts#L141-L159)** — remove the two `updateAllPlayersClock()` calls (lines 143, 157). `onSecond` drives the paint now. **KEEP** the `nowSecondBoundary !== lastSecondBoundary` gate and `scoreboardSyncTick()` call — scoreboard sync stays on the main tick's 1 Hz gate. The `shouldClockUseCriticalFlashSubtick` branch can stay (still returns `false`; dead branch, leave it to avoid scope creep).
- **[src/admin-panel/events.ts:174-176](bf6-portal/dev/conquest/src/admin-panel/events.ts#L174-L176) and :190-192** — admin match-length adjust calls `setMatchClockPreview()` which allocates a new paused clock; explicit trailing `updateAllPlayersClock()` call stays (paused clock does NOT tick `onSecond`).
- **[src/conquest-flow.ts:52-53](bf6-portal/dev/conquest/src/conquest-flow.ts#L52-L53) and :124-125** — `resetMatchClock()` and `setMatchClockPreview()` now allocate the clock internally. Trailing `updateAllPlayersClock()` calls stay (first paint before the first `onSecond` fires).
- **[src/conquest-flow.ts:93](bf6-portal/dev/conquest/src/conquest-flow.ts#L93)** — `endMatch()` sets `expiryFired = true` AND must now also call `State.round.clock.countdown?.pause()` to stop ticking after match end. **Critical:** otherwise the clock keeps firing `onSecond` post-match into a UI that's tearing down.

### Risks (Phase B)

1. **Shadow-field drift.** If any mutation path forgets to update a shadow field, external readers see stale data. Mitigation: funnel ALL mutations through `resetMatchClock` / `setMatchClockPreview` / `adjustMatchClockBySeconds`. Document this contract at the top of the clock section.
2. **`onSecond` callback death kills the HUD.** If callback throws unhandled, Timers may not re-schedule. Mitigation: try/catch wrapper in `onClockSecond` body.
3. **Post-expiry admin add-time.** Clock auto-stops after `onComplete`. Mitigation: explicit `countdown.isComplete` branch in `adjustMatchClockBySeconds` re-primes with `setDuration + reset + start`.
4. **`endMatch()` forgetting to pause.** Clock keeps ticking and fires `onSecond` into UI already tearing down for restart. Mitigation: explicit `countdown?.pause()` in `endMatch`; verification step specifically checks this.
5. **Inverted addSeconds/subtractSeconds.** Easy to write the wrong one by reflex. Mitigation: local wrappers `countdownAddRemainingSeconds` / `countdownRemoveRemainingSeconds` hide the inversion; comment the inversion at the wrapper definitions.
6. **Match-restart allocation churn.** Allocating a fresh `CountDownClock` on every match start is one allocation per match, negligible.
7. **Game-mode loses clock painter.** If `onSecond` never fires (e.g., clock never started during pregame preview), the HUD never paints. Mitigation: `setMatchClockPreview` and `resetMatchClock` callers already call `updateAllPlayersClock()` explicitly for first paint. Verified.
8. **Timers module internal state.** `Clocks.CountDownClock` depends on `Timers.setTimeout` surviving across the match. If a future refactor of `Timers` changes semantics, the clock breaks silently. Mitigation: Timers/Clocks are vendored (inlined), not npm — we own the version. No action needed.

### Verification (Phase B)

1. Bump: `npm run bumpVersion -- -c "clock: migrate match clock to Clocks.CountDownClock (drift-corrected, onSecond-driven paint, onComplete expiry)"`
2. Solo suite:
   - **Pregame preview** — clock shows configured match length, paused; admin match-length +/- buttons update display.
   - **Match start** — clock starts ticking, paints every second, no jitter, no skipped seconds.
   - **Admin pause / resume** — paused clock stays frozen on current display; resume continues from paused value (no snap to whole second loss).
   - **Admin +60s (live)** — remaining jumps +60s, continues ticking.
   - **Admin -60s (live)** — remaining jumps -60s, continues ticking.
   - **Admin +60s (paused)** — paused display updates, stays paused.
   - **Final minute pulse** — red/white alternates every second (parity).
   - **Expiry** — at 00:00, expiry handler fires exactly once (check log), victory dialog opens, clock shows 00:00.
   - **Admin +60s post-expiry** — clock un-completes, resumes ticking, expiry handler re-arms for next expiry.
   - **endMatch path** — clock stops firing `onSecond` (no ghost HUD updates during restart).
   - **Fresh match setup** — new clock instance, previous one is not referenced (GC-able).
3. 64-player smoke test (if possible pre-playtest): digit paint stays synchronized across all players for a full minute.
4. Regression: tickets-zero end condition (`capture-tickets.ts:1713` via `getRemainingSeconds()`) still triggers correctly when clock is paused/live.
5. Regression: HUD viewmodel (`deriveConquestHudClockViewModel` at `capture-tickets.ts:374-391`) renders identically — spot-check `durationSeconds`, `elapsedSeconds`, `remainingSeconds`, `isPaused`, `isLowTime` field values vs v1.334 baseline.

### Rollback (Phase B)

Single-commit revert. Shadow fields were never removed; manual-math impl returns intact. Phase A gate stays in place as the safety floor.

---

## Critical files

- [src/clock/state.ts](bf6-portal/dev/conquest/src/clock/state.ts) — primary edits (both phases).
- [src/state/runtime-types.ts](bf6-portal/dev/conquest/src/state/runtime-types.ts) — add `countdown?: Clocks.CountDownClock` field (Phase B).
- [src/state/runtime-state.ts](bf6-portal/dev/conquest/src/state/runtime-state.ts) — init `countdown: undefined` (Phase B).
- [src/index/game-mode.ts](bf6-portal/dev/conquest/src/index/game-mode.ts) — remove 2 `updateAllPlayersClock` calls from tick loop (Phase B).
- [src/conquest-flow.ts](bf6-portal/dev/conquest/src/conquest-flow.ts) — add `countdown?.pause()` in `endMatch` (Phase B).
- [src/foundation/bf6-utils/clocks.ts](bf6-portal/dev/conquest/src/foundation/bf6-utils/clocks.ts) — read-only (API reference).
- [src/vehicles/vanilla-spawner.ts:439](bf6-portal/dev/conquest/src/vehicles/vanilla-spawner.ts#L439) — read-only (CountDownClock usage pattern reference).

## Follow-up docs

- Update `design_doc/conquest_optimization_analysis.md` H2 entry with the 1 Hz recalibration + note that Phase A + Phase B supersede the previous H2 recommendation.
- Note in `design_doc/TWL_Conquest_Design.md` that the match clock uses `Clocks.CountDownClock` (appendix entry) after Phase B ships.

## Out of scope

- Refactoring external reach-around reads (capture-tickets viewmodel, interaction/actions, admin-panel isPaused). Shadow fields cover them.
- H1 (boundary enforcement per-player) and H3 (HUD pipeline cache invalidation). Separate plans.
- `CountUpClock` adoption for capture-sound flush throttle, capture-VO cooldown. Listed in `conquest_optimization_analysis.md` as follow-up.
- Phase B is conditional on Phase A passing; do not bundle them in one commit.
