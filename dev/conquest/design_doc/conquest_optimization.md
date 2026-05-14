## Goals

**Performance (mission critical)** — minimize per-tick work; maximize player FPS; avoid frame-time spikes that breach the Mod Evaluator's per-frame eval budget. **Per-frame budget = 1,000ms hard cap; script terminates with `Mod has been running for X ms this frame which exceeds max evaluation time of 1,000ms` if breached.** v1.491 8–10 player MP crash at 1,716ms — see Tier S in `conquest_optimization_analysis.md`.

**Memory (mission critical)** — operate within the Mod Evaluator's JS heap limit at full player counts; every per-pid allocation has a paired deallocation reachable from `onPlayerLeaveGameImpl`; no monotonic growth across join/leave cycles. v1.406 16-player crash drove waves 1–6 — see Tiers A–F in `conquest_optimization_analysis.md`.

**Design (nice to have)** — code stays clean, readable, intuitive, maintainable. Subordinate to the two above; don't sacrifice memory or performance for elegance.

## Files

**Recurring-work analysis trio (added 2026-05-13)** — parallel coverage of per-tick work from a different lens than the per-frame fan-out + heap-multiplier framework. Cross-references the S1-S10 table in `conquest_optimization_state.md` (see "Per-frame CPU fan-out" section) with parallel R1-R34 risk catalog.

- **`5.12.26_conquest_recurring_work_inventory.md`** — every function that "runs forever" or "runs every tick" itemized with concrete engine-call counts. Section M added 2026-05-13 with src cross-reference findings (capture-sound/VO recipient resolution does AllPlayers per event; pipeline.ts:125 TickContext follow-up; spectator free-cam itemization). Cross-reference table maps R-numbers to S-numbers from the existing Tier S framework.
- **`5.12.26_conquest_recurring_work_inventory_solutions.md`** — 32+ proposed solutions across 14 problem areas, tier-ranked. Section O added 2026-05-13 with O1 sound/VO recipient caching + O2/O3 pipeline TickContext fixes. Revised Tier 1 ranking 2026-05-13: B2 + O1 + D1 + C1 + A1 + B7.
- **`5.12.26_conquest_recurring_work_inventory_implementationplan.md`** — concrete implementation plans for 11 Tier 1+2 solutions across 7 waves (now 9 with W0 telemetry + W8 sound/VO caching + W9 hygiene added 2026-05-13). Each wave has design-alternatives reasoning with explicit ACCEPTED/REJECTED rationale.
- **`5.12.26_conquest_ongoing_player_cost_analysis.md`** — companion to the inventory; OngoingPlayer-specific 7-tier optimization ladder.

**`conquest_optimization_state.md`** — the *facts*:

- **Per-frame CPU fan-out (v1.491 crash hypothesis)** *(added 2026-05-08)* — convergent-scenario analysis + S1–S10 suspect ranking; the per-row evidence backing the Tier S framework in the analysis doc.
- **Long-match accumulation audit** *(added v1.494, 2026-05-09; punchlist closed v1.500)* — confirmed leaks L1–L5 with file:line citations + verified-clean list + demoted-suspects list. **All 5 confirmed leaks now plugged:** L1 dead-code-deleted v1.496; L2 plugged via A13 in v1.500; L3-L5 plugged via A12 in v1.500. v1.498 first attempt broke via single non-ASCII char (em-dash) in inline comment that survived postbuild's comment-strip pass; v1.499 reverted; v1.500 re-shipped clean with pure-ASCII content + new postbuild guardrail. Records audit lessons: (1) "verify reader count before classifying a write site as a leak" (A11 was incorrectly framed; was Tier C dead code); (2) "Portal sandbox rejects non-ASCII bytes silently — no console error" (v1.498 lesson, now guardrailed at postbuild step 11.5).
- **Concurrent timer inventory** *(added v1.497, 2026-05-09)* — every `Timers.setTimeout` / `Clocks.CountDownClock` call site (T1–T11) with peak concurrent count per scenario (Peak A countdown-reset, Peak B LIVE-burst, Peak C mid-LIVE active combat).
- **Compile-Time Feature Flags** — which `FEATURE_*` flags strip which files at build.
- **Project Stats** — version, file counts, bundle bytes, headroom. Currently v1.500 / 926,137 bytes / 11.67% headroom.
- **File Map** — every `.ts` file: lines, bytes, in-bundle status, PPM column.
- **Function Inventory** — every callable with one-line purpose and usage tag.
- **Lifecycle Map** — every per-pid state field with allocator + deallocator + status.
- **Naming Economy** — identifier counts, length distribution, top expensive symbols, anti-pattern symbol list.
- **Code-Comment-Deficiency Hotspots** *(added v1.454 audit, 2026-05-03)* — prioritized list of files / functions / blocks where comments are insufficient to explain intent per AGENTS.md "Function Comment Readability Policy". Severity-tagged (HIGH/MEDIUM/LOW) and category-tagged (NO_PURPOSE_COMMENT / COMPLEX_NO_RATIONALE / EMPTY_CATCH_NO_WHY / etc.). NOT tracked as bugs — code is functionally correct; the deficiency is for human comprehension.
- **How to keep this file accurate** — maintenance rules.

**`conquest_optimization_analysis.md`** — the *reasoning*:

- **TL;DR** — current snapshot in 6 bullets. Currently anchored at v1.497 with three failure-mode regimes documented (heap-OOM v1.406; per-frame CPU v1.491; within-match accumulation, distinct from multi-match drift).
- **Why memory, not bytes** — heap-vs-bundle constraint analysis.
- **Per-player multipliers (M1–M16)** — allocator ranking with scale buckets.
- **One-time overhead (O1–O5)** — non-per-player cost categories.
- **Reclaim ladder (Tiers A–F + Tier S)** — concrete levers, ranked by ROI. Tier S targets the per-frame eval budget (1,000ms hard cap; the v1.491 active blocker); A–F target the runtime heap budget (v1.406 16p crash). S3 SHIPPED v1.497 (vehicle deploy timer broadcast 200ms-coalesce).
- **Why per-PID UI is non-negotiable** — architectural rule.
- **Verified safe operations (no-go list)** — what reclaim must not do.
- **Open questions** — decisions waiting on user input. All 9 prior open questions answered 2026-05-09; current open list is empty pending playtest results.
- **Verification plan** — how to confirm a fix.

## Ratings

### Per-player multipliers — `M1` … `M16`

Allocators that scale with connected player count, ranked by retained heap at 16 players. **`M1` = worst, `M16` = least.** The ID *is* the rank.

Each `Mn` carries a **scale bucket**:

| Bucket | Approx. retained at 16p |
|--------|-------------------------|
| `XL` | >1,500 widget refs / objects |
| `L` | 200–1,500 |
| `M` | 50–200 |
| `S` | 10–50 |
| `XS` | <10, or feature-flagged off |
| `Churn` | per-tick allocations (GC pressure, not retained) |
| `Variable` | hard to estimate (closure capture) |

State doc's File Map cites `Mn` in its PPM column.

### Reclaim ladder — Tier `A` … `F`

Each tier is a category of memory/heap lever, ordered by ROI per effort:

| Tier | Category |
|------|----------|
| `S` | **Per-frame CPU spike reclaim (current active blocker post-v1.491 — 1,716ms-frame crash)** — coalesce N-player broadcasts, throttle forced HUD passes |
| `A` | Per-player widget cache thinning (heap-target — drove waves 1–6 post-v1.406 crash) |
| `B` | Module-level constant inlining (one-time, cumulatively large) |
| `C` | Dead code + dead strings (confirmed-zero readers) |
| `D` | Closure / continuation hygiene |
| `E` | Opportunistic / readability (zero memory impact) |
| `F` | Naming economy |

**Two budgets, two tiers.** Tier S targets the **per-frame eval budget** (1,000ms hard cap, opaque); Tiers A–F target the **runtime heap budget** (16-player crash, opaque). Both are real and mostly independent — a heap fix is not a CPU fix and vice versa. Tier S is the active blocker as of v1.491 — work on Tier S items first until 8–10p MP stability is restored, then resume Tier A.

**Within-match scope clarification (user 2026-05-09).** The script restarts at match end. The v1.491 1716ms breach manifests *within a single match* (20+ minutes). Multi-match restart cadence is NOT a valid mitigation — within-match accumulation must be addressed via either intra-match resets, engine-surface reduction (capture-sound queue, world-log buffer, area-trigger churn, VFX retention), or a Tier S burst whose trigger frequency rises with in-match state.

Within a tier, items are numbered (`A1`, `A2`, …) with heap impact, bundle impact, effort, risk, and approval status per row.

### Function usage tags

Every entry in the Function Inventory ends with one of:

| Tag | Meaning |
|-----|---------|
| `(N)` | Plain integer — static call-site count from `src/`. Higher = wider blast radius. `(0)` = delete candidate. |
| `(XL~N)` | Hot path: runs every game-loop subtick (~8/sec), often per-player. |
| `(L~N)` | Per-second cadence. |
| `(M~N)` | Per common gameplay event (deploy, vehicle entry, capture edge, kill). |
| `(S~N)` | Per rare gameplay event (match start/end, team swap, join, leave). |
| `(XS~N)` | Once or near-once (mode startup, scaffold init). |
| `(engine)` | Portal-fired callback in `src/index.ts`; no script-side callers. |

The `~N` tail is the static call count; the tier prefix tells you the runtime cadence amplifies that count.

### Lifecycle status

Every per-pid state field is marked:

| Status | Meaning |
|--------|---------|
| `✓` | Allocator + deallocator paired; deletion reachable from `onPlayerLeaveGameImpl`. |
| `⚠` | Paired in normal flow with a known edge case (team swap, mid-warm disconnect, deferred path). Verify before shipping new code on top. |
| `❌` | Leak suspect — write sites exist, no `delete` reachable from leave. Fix or document why immortal-by-design. |
