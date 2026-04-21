# Ticket Bleed — How It Works and How to Tune It

**Last updated:** 2026-04-19

Short reference for the ticket-bleed system so we can iterate on game feel without re-deriving the math from source each time.

---

## One-sentence summary

While a match is live, once per second the losing team loses `|flagDiff| × perDiffPerSecond` tickets, where `flagDiff` is the signed difference between owned mapped flags. A fractional carry accumulator preserves sub-ticket rates across ticks.

---

## Pipeline

1. **Tick driver** — [game-mode.ts:116-124](bf6-portal/dev/conquest/src/index/game-mode.ts#L116-L124) crosses each integer-second boundary of `mod.GetMatchTimeElapsed()` and calls `conquestPhase2AOnLiveTick()`, which invokes bleed → end-check → HUD refresh.
2. **Ownership count** — [capture-tickets.ts:1610 `conquestPhase2AGetOwnershipCounts()`](bf6-portal/dev/conquest/src/index/capture-tickets.ts#L1610) walks `State.conquest.capture.mappedObjIdsInOrder` and returns `{ team1Owned, team2Owned }`. **Neutral and unmapped flags are excluded.**
3. **Bleed step** — [capture-tickets.ts:1651 `conquestPhase2AApplyBleedTick()`](bf6-portal/dev/conquest/src/index/capture-tickets.ts#L1651):
   - Guards: `isMatchLive()`, not ended, `State.conquest.bleed.enabled`.
   - `elapsed = floor(now) − bleed.lastTickSeconds` (typically `1`; larger if we ever drop a tick).
   - `diff = team1Owned − team2Owned`; if `0`, early return (no bleed on tie).
   - `losingTeam = diff > 0 ? Team2 : Team1`.
   - `rate = |diff| × bleed.perDiffPerSecond × elapsed` → added to the losing team's `carry`.
   - `bleedUnits = floor(carry)`; `carry −= bleedUnits`.
   - `conquestPhase2AApplyTicketDelta(losingTeam, -bleedUnits)` → floors tickets at `0`.
4. **End check** — [capture-tickets.ts:1693 `conquestPhase2ACheckEndCondition()`](bf6-portal/dev/conquest/src/index/capture-tickets.ts#L1693) latches end when either team hits `0`.

HUD chevrons (`CONQUEST_HUD_TICKET_BLEED_CHEVRON_COUNT`) are purely cosmetic — count = `|diff|` capped. They do not affect the math.

---

## Tuning knobs

| Knob | Where | Default | Effect |
|---|---|---|---|
| `CONQUEST_STARTING_TICKETS` | [conquest-constants.ts:11](bf6-portal/dev/conquest/src/config/conquest-constants.ts#L11) | `350` | Initial pool per team. Scales total match length linearly. |
| `CONQUEST_BLEED_PER_DIFF_PER_SECOND` | [conquest-constants.ts:14](bf6-portal/dev/conquest/src/config/conquest-constants.ts#L14) | `1/3` | Tickets/second per 1-flag lead. Seeds `State.conquest.bleed.perDiffPerSecond`. |
| `State.conquest.bleed.perDiffPerSecond` | [runtime-state.ts:93](bf6-portal/dev/conquest/src/state/runtime-state.ts#L93) | seeded from constant | Runtime rate. Change mid-match to hot-swap feel without a rebuild. |
| `State.conquest.bleed.enabled` | [runtime-state.ts:90](bf6-portal/dev/conquest/src/state/runtime-state.ts#L90) | `true` | Master kill-switch. Setting `false` freezes bleed until re-enabled; carries are preserved. |
| `State.conquest.bleed.carryTeam1 / carryTeam2` | [runtime-state.ts:94-95](bf6-portal/dev/conquest/src/state/runtime-state.ts#L94-L95) | `0` | Fractional accumulators. Generally don't touch directly; zero them if you reset the match. |
| Flag count on the map | map config | per-map | `diff` is capped at `mappedFlagCount`. More flags → higher max bleed ceiling at blowout. |

**Kill-switch pattern:** `State.conquest.bleed.enabled = false` pauses bleed without stopping the tick loop. `lastTickSeconds` keeps advancing because the guard is *before* the `elapsed` update — wait, re-check: the guard at [capture-tickets.ts:1654](bf6-portal/dev/conquest/src/index/capture-tickets.ts#L1654) exits *before* updating `lastTickSeconds`, so when re-enabled the first tick will have a large `elapsed`. If that matters, manually reset `State.conquest.bleed.lastTickSeconds = -1` before re-enabling.

---

## Feel at defaults (350 tickets, `perDiffPerSecond = 1/3`)

| Flag diff | Bleed rate | Time to drain 350 tickets |
|---|---|---|
| 1 | ~0.33 / sec = 20 / min | **~17.5 min** |
| 2 | ~0.67 / sec = 40 / min | **~8.75 min** |
| 3 | 1 / sec = 60 / min | **~5.83 min** |
| 4 | ~1.33 / sec = 80 / min | **~4.4 min** |
| 5 (full sweep, 5-flag map) | ~1.67 / sec = 100 / min | **~3.5 min** |

Assumes a static lead for the full duration. Real matches trend shorter because kill-feed tickets also subtract (bleed is additive on top of kill losses).

---

## Non-linear tuning (if we want a retail-Conquest curve)

The current model is **linear** in `|diff|`. Retail Conquest games typically use a sub-linear or stepped curve so a 1-flag lead still meaningfully bleeds the loser while a 4-flag blowout doesn't end games in 90 seconds.

Swap [capture-tickets.ts:1669](bf6-portal/dev/conquest/src/index/capture-tickets.ts#L1669) for a lookup table:

```ts
// Index = |diff|; index 0 unused. Values in tickets/second.
const BLEED_RATE_BY_DIFF: readonly number[] = [0, 0.33, 0.55, 0.75, 0.95, 1.10];
// ...
const absDiff = Math.abs(diff);
const perSecond = BLEED_RATE_BY_DIFF[Math.min(absDiff, BLEED_RATE_BY_DIFF.length - 1)];
const rate = perSecond * elapsed;
```

Design notes for that table:
- Index `1` ≈ current `1/3` so 1-flag pressure is unchanged.
- Diminishing returns past `3` means sweeping the map stops instantly-winning.
- Keep monotonically increasing so a bigger lead always bleeds faster.

Alternative shapes worth trying:
- **Sqrt curve:** `rate = sqrt(|diff|) × perDiffPerSecond` → 1→0.33, 3→0.58, 5→0.75.
- **Min-bleed floor:** add a flat `+0.2` per second whenever `|diff| > 0` so any lead drains the loser.
- **Flag-count normalization:** divide `|diff|` by mapped flag count so 3-of-5 and 3-of-7 feel different.

---

## Related but separate systems

- **Kill-feed ticket loss** — subtract-on-death logic is elsewhere in capture-tickets; unaffected by bleed toggles.
- **Clock end condition** — [capture-tickets.ts:1693](bf6-portal/dev/conquest/src/index/capture-tickets.ts#L1693) also latches on timeout; bleed doesn't interact with the match clock directly.
- **HUD chevrons** — cosmetic only; see [capture-tickets.ts:334](bf6-portal/dev/conquest/src/index/capture-tickets.ts#L334).
- **Ownership diff of `0` = no bleed** — ties freeze ticket pools until a flag flips.

---

## Quick recipes

- **"Matches are too long."** Drop `CONQUEST_STARTING_TICKETS` to `250`, or raise `CONQUEST_BLEED_PER_DIFF_PER_SECOND` to `0.5`.
- **"1-flag leads feel meaningless."** Raise `perDiffPerSecond` to `0.5`, *or* add a min-bleed floor.
- **"Blowouts end too fast."** Switch to the sub-linear `BLEED_RATE_BY_DIFF` table above.
- **"Need to pause bleed for a demo."** `State.conquest.bleed.enabled = false; State.conquest.bleed.lastTickSeconds = -1;` then set back to `true` when ready.
