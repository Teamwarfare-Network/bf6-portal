# Bleed Rate Mancours Calibration — Plan

**Created:** 2026-04-26
**Issue:** [`CQ_Tweak_Bleed_Rate_Mancours_Calibration`](./conquest_issues.md#103) (#103)
**Status:** Analysis only — no code changes proposed for execution yet.
**Source reference:** [`reference_design_documentation/testing_images/imagebleedrates.png`](../reference_design_documentation/testing_images/imagebleedrates.png)

Companion to: [`bleed_tuning.md`](./bleed_tuning.md) (canonical bleed-system reference).

---

## Reference image transcription

The screenshot shows a Portal `SetVariable Global Variable …` block list. These are the Mancours-style reference values:

| Variable | Value |
|---|---|
| `TimeLimit` | **1500** (seconds = 25 minutes) |
| `StartingScore` | **450** (tickets per team) |
| `LowTicketMusic` | **30** (low-ticket music threshold; UX cue, not bleed math) |
| `LoserOnlyTicketBleed` | **true** (only the team behind in flags bleeds) |
| `TotalControlTicketBleed` | **true** (special-case multiplier when one team owns all flags) |
| `TotalControlBonus` | **5** (bonus value applied during total control) |
| `TicketBleedSpeed` | **3** (base bleed pace) |
| `PlayerDeathsBleed` | **true** (kill-feed deaths also subtract tickets — separate from flag bleed) |
| `FlagCaptureTime` | **20** (seconds to capture an unowned flag) |
| `FlagNeutralTime` | **20** (seconds to neutralize an enemy-held flag) |

---

## How bleed currently works in this codebase

(Verified at v1.390 — see [`bleed_tuning.md`](./bleed_tuning.md) for the full pipeline.)

**Constants** ([config/conquest-constants.ts](../src/config/conquest-constants.ts)):
- `CONQUEST_STARTING_TICKETS = 350`
- `CONQUEST_BLEED_PER_DIFF_PER_SECOND = 1/3` (≈ 0.333 tickets/sec per 1-flag lead)
- `CONQUEST_CAPTURE_TIME_SECONDS = 10`
- `CONQUEST_NEUTRALIZATION_TIME_SECONDS = 15`

**Match length default** ([foundation/gameplay.ts:8](../src/foundation/gameplay.ts#L8)):
- `ROUND_START_SECONDS = 25 * 60 = 1500` seconds

**Bleed math** ([capture-tickets.ts:1651 `conquestPhase2AApplyBleedTick`](../src/index/capture-tickets.ts#L1651)):
1. Once per integer-second boundary while live.
2. `diff = team1Owned − team2Owned` (neutral / unmapped flags excluded).
3. If `diff === 0` → no bleed (ties freeze).
4. `losingTeam = diff > 0 ? Team2 : Team1`.
5. `rate = |diff| × perDiffPerSecond × elapsed` → added to losing team's `carry` accumulator.
6. `bleedUnits = floor(carry)` → applied to losing team via `conquestPhase2AApplyTicketDelta(team, -bleedUnits)`.
7. Tickets floor at 0; end check latches when either team hits 0.

**Behavioral properties:**
- **Linear** in `|diff|` (no curve, no ceiling beyond `mappedFlagCount`).
- **Loser-only** by construction (only `losingTeam` accumulates bleed).
- **No total-control multiplier** — sweeping all flags just gives `|diff| = mappedFlagCount` linearly.
- **Kill-feed deaths** subtract tickets independently elsewhere in `capture-tickets.ts` (matches Mancours `PlayerDeathsBleed: true`).
- **HUD chevrons** are cosmetic; do not affect math.

---

## Direct comparison: Mancours vs current

| Aspect | Mancours | Ours (v1.390) | Match? |
|---|---|---|---|
| Match time limit | `TimeLimit: 1500s` (25 min) | `ROUND_START_SECONDS: 1500s` (25 min) | ✅ identical |
| Starting tickets | `StartingScore: 450` | `CONQUEST_STARTING_TICKETS: 350` | ❌ ours is 22% lower |
| Capture time | `FlagCaptureTime: 20s` | `CONQUEST_CAPTURE_TIME_SECONDS: 10` | ❌ **ours is 2× faster** |
| Neutralize time | `FlagNeutralTime: 20s` | `CONQUEST_NEUTRALIZATION_TIME_SECONDS: 15` | ❌ ours is 25% faster |
| Loser-only bleed | `LoserOnlyTicketBleed: true` | implicit (only `losingTeam` carry accumulates) | ✅ behaves the same |
| Player deaths bleed | `PlayerDeathsBleed: true` | yes — separate kill-feed ticket loss | ✅ behaves the same |
| Base bleed pace | `TicketBleedSpeed: 3` | `perDiffPerSecond: 1/3` | ⚠️ **see "TicketBleedSpeed interpretation" below** |
| Total-control bonus | `TotalControlTicketBleed: true` + `TotalControlBonus: 5` | none — pure linear `|diff|` | ❌ **behavioral gap — no special multiplier when one team owns all flags** |
| Low-ticket music cue | `LowTicketMusic: 30` | none | ❌ no equivalent (UX-only, optional) |

---

## TicketBleedSpeed interpretation (the ambiguous one)

`TicketBleedSpeed: 3` could mean any of:

**Hypothesis A — "3 seconds per ticket subtracted at base rate" (interval framing):**
- Implies base rate = 1 ticket / 3 sec = **0.333/sec at 1-flag lead**
- This **exactly matches our `perDiffPerSecond = 1/3`.**
- Refractor 2 / Frostbite community configs typically use seconds-per-ticket framing, supporting this reading.
- **Most likely interpretation given everything else lines up.**

**Hypothesis B — "3 tickets per second per 1-flag lead" (rate framing):**
- Base bleed = 3/sec at 1-flag → 9× faster than ours.
- Doesn't fit: 450 tickets at 3/sec ≈ 150s match. Implausibly short for a 25-minute clock.

**Hypothesis C — "TicketBleedSpeed is a multiplier on a hidden base rate":**
- Without the engine source we can't validate.

**Recommended reading:** Hypothesis A. Rates align at 1-flag lead → adopt our existing `1/3` value as Mancours-equivalent base.

---

## TotalControlBonus interpretation (the second ambiguous one)

`TotalControlBonus: 5` activates when one team owns all flags (`TotalControlTicketBleed: true`). The bonus number's units are unclear:

**Hypothesis A — "+5 multiplier on bleed rate during total control":**
- At 5-flag full sweep: linear bleed = `5 × 1/3 = 1.67/sec`. With ×5 multiplier → 8.33/sec. Drains 450 tickets in **54 seconds.** Brutally fast — probably too aggressive.

**Hypothesis B — "+5 ticks/second additional flat bleed during total control":**
- At 5-flag full sweep: linear `5 × 1/3 = 1.67/sec` + flat 5 = 6.67/sec. Drains 450 in **67 seconds.** Still very fast.

**Hypothesis C — "+5 seconds shaved off the bleed interval":**
- Doesn't really make sense given a 3-second base interval.

**Hypothesis D — "5× compounding multiplier" (×5 of normal, applied at total control only):**
- Same as Hypothesis A.

**Recommended interpretation for our model:** treat as a **2–3× multiplier when `|diff| === mappedFlagCount`**. Mancours' 5× is too aggressive for our 350-ticket starting pool; a 2× multiplier on a 5-flag sweep gives `5 × 1/3 × 2 = 3.33/sec` → 350 tickets in **105s = ~1.75 min.** Still meaningful sweep penalty without being instant.

---

## Proposed calibration table (analysis only — not executed)

Three options, ordered by deviation from current behavior:

### Option A — minimal change (capture/neutralize times only)
- `CONQUEST_CAPTURE_TIME_SECONDS: 10 → 20`
- `CONQUEST_NEUTRALIZATION_TIME_SECONDS: 15 → 20`
- Everything else unchanged.

**Rationale:** Slow captures favor coordinated team play and prolong contested moments. The 2× capture time is the most clearly mismatched value relative to Mancours. Bleed and ticket pool stay at current tuning since matches haven't been reported as feeling too long or too short.

**Expected feel:** Captures take twice as long. Flag flips become more committal. Match pacing slightly slower overall. Bleed math unchanged.

**Risk:** None — pure constant edits, no new behavior.

### Option B — match Mancours starting pool + capture times
- `CONQUEST_STARTING_TICKETS: 350 → 450`
- `CONQUEST_CAPTURE_TIME_SECONDS: 10 → 20`
- `CONQUEST_NEUTRALIZATION_TIME_SECONDS: 15 → 20`
- `CONQUEST_BLEED_PER_DIFF_PER_SECOND: 1/3` (unchanged — TicketBleedSpeed Hypothesis A)
- No total-control bonus.

**Expected feel:** Matches significantly longer. At 1-flag lead, time-to-drain goes from ~17.5 min to ~22.5 min — but the 25-minute match clock is the real ceiling. Most matches will end on clock rather than tickets.

**Risk:** Matches may end on clock-timeout more often than ticket-zero, which can feel anticlimactic. Mitigation: the kill-feed bleed (`PlayerDeathsBleed`) keeps tickets ticking even when flags are even.

### Option C — full Mancours calibration including total-control multiplier
- All of Option B, plus:
- New `CONQUEST_BLEED_TOTAL_CONTROL_MULTIPLIER: 2` (or `3`, see "TotalControlBonus interpretation" above) — applied when `|diff| === mappedFlagCount`.

**Implementation sketch** (analysis only — DO NOT execute as part of this plan):
At [capture-tickets.ts:1670](../src/index/capture-tickets.ts#L1670), where `rate` is computed:
```ts
const ownership = conquestPhase2AGetOwnershipCounts();
const diff = ownership.team1Owned - ownership.team2Owned;
const absDiff = Math.abs(diff);
const mappedCount = State.conquest.capture.mappedObjIdsInOrder.length;
const isTotalControl = mappedCount > 0 && absDiff === mappedCount;
const totalControlMult = isTotalControl ? CONQUEST_BLEED_TOTAL_CONTROL_MULTIPLIER : 1;
const rate = absDiff * State.conquest.bleed.perDiffPerSecond * totalControlMult * elapsed;
```

**Expected feel:** Slow base game (bigger pool, slower captures) but a full sweep punishes the loser hard — preserves the "you swept the map, you should win quickly" pacing while making a 1-flag lead grind.

**Risk:** New code branch in the bleed hot path. Easy to test in isolation but introduces a tuning knob the team has to remember.

---

## Recommended sequence

1. **First playtest pass:** Option A (capture/neutralize times only). Smallest possible change, easiest to A/B against current. Tests whether 20-sec captures feel meaningful before touching ticket math.
2. **If matches feel too short or 1-flag leads feel meaningless:** move to Option B (raise starting tickets to 450).
3. **If full sweeps feel anticlimactic at Option B (loser bleeds out too slowly when behind 5–0):** add total-control multiplier (Option C). Start at 2× and tune up if needed; **do not start at Mancours's 5×** — too aggressive for our pool sizes.

---

## Already-documented alternatives in `bleed_tuning.md`

The "Non-linear tuning" section of [`bleed_tuning.md`](./bleed_tuning.md#non-linear-tuning-if-we-want-a-retail-conquest-curve) already proposes:

```ts
const BLEED_RATE_BY_DIFF: readonly number[] = [0, 0.33, 0.55, 0.75, 0.95, 1.10];
```

This is **a different lever from total-control multiplier.** It compresses the curve as `|diff|` grows so blowouts don't end games in 90 seconds. Could be combined with Option B as a fourth option:

### Option D — sub-linear bleed curve (alternative to Option C)
- Option B base values.
- Replace linear `|diff| × rate` with the lookup table from `bleed_tuning.md`.
- No total-control multiplier (the table itself encodes the diminishing returns).

**Trade-off vs Option C:**
- Option C rewards sweeps with a bonus (faster bleed at total control).
- Option D punishes sweeps with diminishing returns (slower bleed past `|diff| = 3`).
- Mancours `TotalControlTicketBleed: true` clearly aligns with Option C philosophy. Option D would be "softer Conquest" — not a Mancours match.

---

## What this plan does NOT address

- **`LowTicketMusic: 30`** — UX music cue at 30 tickets remaining. Not implemented in our mode. Out of scope; if added, would need a new sound prefab + threshold check in the bleed loop or end-check.
- **`TimeLimit: 1500`** — already matches our `ROUND_START_SECONDS`. No change.
- **`PlayerDeathsBleed`** — separate kill-feed system; this plan does not analyze its current behavior.
- **Match-length knob in admin panel** — clamped to `[60, 99×60+59]`; admin can already override clock without touching this plan.
- **HUD chevrons** — cosmetic, capped at 7. Don't affect math; no change needed.

---

## Open questions for user before implementation

1. **Confirm TicketBleedSpeed interpretation** (Hypothesis A — seconds per ticket). If Mancours actually means something different we'd need source.
2. **Confirm TotalControlBonus interpretation** (multiplier vs flat addition). 2× vs 5× changes feel dramatically; recommend starting at 2× regardless.
3. **Pick starting option** (A / B / C / D). Recommendation: **Option A first** for low-risk validation, then escalate if needed.
4. **Map flag count assumption** — are all configured maps 5-flag? If some have 6 or 7, the linear math at full sweep already produces faster bleed even without the multiplier. Verify before applying total-control logic.

---

## File touch points (when implementation is approved)

If proceeding with Option A:
- [`src/config/conquest-constants.ts:17-18`](../src/config/conquest-constants.ts#L17-L18) — change two integer constants.

If proceeding with Option B:
- [`src/config/conquest-constants.ts:16-18`](../src/config/conquest-constants.ts#L16-L18) — change three integer constants.

If proceeding with Option C:
- All of Option B, plus:
- New constant `CONQUEST_BLEED_TOTAL_CONTROL_MULTIPLIER` in `conquest-constants.ts`.
- Patch `conquestPhase2AApplyBleedTick` at [capture-tickets.ts:1670](../src/index/capture-tickets.ts#L1670) to multiply rate when `|diff| === mappedFlagCount`.
- Bundle delta estimate: ~80 bytes for the new constant + multiplier branch.

If proceeding with Option D:
- All of Option B, plus:
- New `BLEED_RATE_BY_DIFF` array constant.
- Replace `rate` computation at [capture-tickets.ts:1670](../src/index/capture-tickets.ts#L1670) with table lookup.
- Bundle delta estimate: ~150 bytes for table + lookup logic.

---

## Verification plan (when implementation lands)

Match-feel cannot be validated in isolation; requires live MP playtest. Suggested protocol:

1. Ship the chosen option as v1.X.Y with `// v1.X.Y: bleed calibration option [A/B/C/D]` changelog entry.
2. Run a 5–10 minute playtest match with at least 4 players.
3. Subjective ratings: pace (too slow / right / too fast), 1-flag lead pressure (meaningless / right / overwhelming), full-sweep punishment (none / appropriate / instant-win).
4. Iterate constants without rebuild via the runtime hot-swap path documented in [`bleed_tuning.md`](./bleed_tuning.md#tuning-knobs) (`State.conquest.bleed.perDiffPerSecond`).
5. Lock in chosen values; mark `CQ_Tweak_Bleed_Rate_Mancours_Calibration` (#103) as Resolved with the option letter.
