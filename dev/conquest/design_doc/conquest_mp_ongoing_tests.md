# Conquest — Multiplayer Ongoing Test Checklist

**Maintained over time.** New MP-only validation entries get appended as each wave / change ships. The user runs MP playtests opportunistically (not on a fixed cadence); ticks items off in batches when feasible.

**Player count target:** minimum 24, ideal 64. (16-player runs were where the original heap crash surfaced — they are not the validation target.)

**Pass model:** an MP item is checked when the listed pass condition holds during a playtest at or above the minimum player count. If something fails or is inconclusive, append a note next to the item rather than removing it.

**Single-player tests are not tracked here.** SP smoke tests run with every wave and gate the bumpVersion; they do not accumulate. This file is purely the MP backlog.

---

## Wave 1 — A6 + A7 leak fixes (shipped v1.407, 2026-04-27)

- [ ] **Join / Supply-Box-open / leave cycle.** ≥4 players join, each opens the Supply Box once, then disconnects. New players take their slots. Repeat ≥3 cycles. Pass: server still responsive; no script termination during or after the cycles.
- [ ] **HQ Deploy spam + churn.** Players use HQ Deploy multiple times across leave/rejoin cycles. Pass: no script termination; vehicle slots still spawn correctly for new joiners.
- [ ] **Full match start → victory dialog at ≥24 players (ideal 64).** Pass: match starts, plays, ends without `Mod has reached its js script memory usage limit` termination.
- [ ] **If termination still occurs**: capture termination time + connected pid count + match phase. Wave 1 leaks are contributors to the heap pressure tracked in [#109](./conquest_issues.md), not the sole cause; Wave 2+ continues regardless.

## Wave 2 — F1 phase-prefix strip (shipped v1.408, 2026-04-27)

- [ ] **Match completes correctly at 24+ players.** Pass: tickets bleed, captures register, sounds/VO play, victory dialog appears at end. (Catches any cross-file call site missed by rename — would manifest as undefined-function errors at runtime. SP smoke test passed; this is the defense-in-depth check.)
- [ ] **No console errors referencing `conquestPhase*` symbols.** Pass: world log clean during a full match. Any lingering `is not a function` or `undefined` errors mentioning a phase-prefixed name indicates a missed cross-file call site.

---

## How to use this file

- One section per wave or change set, with a heading like `## Wave N — <topic> (shipped v<version>, <date>)`.
- Each item is a single `- [ ]` checkbox with a clear pass condition.
- When all items in a wave's section are checked off, append `**Wave N validated <date>.**` under the heading.
- Do not delete completed items — they stay as a record. Old waves can be collapsed into a `## Validated waves (archive)` section once they've all passed if the file gets long.
