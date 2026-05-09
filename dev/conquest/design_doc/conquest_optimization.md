## Goals

**Performance (mission critical)** — minimize per-tick work; maximize player FPS; avoid frame-time spikes that breach the Mod Evaluator's per-frame eval budget. **Per-frame budget = 1,000ms hard cap; script terminates with `Mod has been running for X ms this frame which exceeds max evaluation time of 1,000ms` if breached.** v1.491 8–10 player MP crash at 1,716ms — see Tier S in `conquest_optimization_analysis.md`.

**Memory (mission critical)** — operate within the Mod Evaluator's JS heap limit at full player counts; every per-pid allocation has a paired deallocation reachable from `onPlayerLeaveGameImpl`; no monotonic growth across join/leave cycles. v1.406 16-player crash drove waves 1–6 — see Tiers A–F in `conquest_optimization_analysis.md`.

**Design (nice to have)** — code stays clean, readable, intuitive, maintainable. Subordinate to the two above; don't sacrifice memory or performance for elegance.

## Files

**`conquest_optimization_state.md`** — the *facts*:

- **Compile-Time Feature Flags** — which `FEATURE_*` flags strip which files at build.
- **Project Stats** — version, file counts, bundle bytes, headroom.
- **File Map** — every `.ts` file: lines, bytes, in-bundle status, PPM column.
- **Function Inventory** — every callable with one-line purpose and usage tag.
- **Lifecycle Map** — every per-pid state field with allocator + deallocator + status.
- **Naming Economy** — identifier counts, length distribution, top expensive symbols, anti-pattern symbol list.
- **Code-Comment-Deficiency Hotspots** *(added v1.454 audit, 2026-05-03)* — prioritized list of files / functions / blocks where comments are insufficient to explain intent per AGENTS.md "Function Comment Readability Policy". Severity-tagged (HIGH/MEDIUM/LOW) and category-tagged (NO_PURPOSE_COMMENT / COMPLEX_NO_RATIONALE / EMPTY_CATCH_NO_WHY / etc.). NOT tracked as bugs — code is functionally correct; the deficiency is for human comprehension.
- **How to keep this file accurate** — maintenance rules.

**`conquest_optimization_analysis.md`** — the *reasoning*:

- **TL;DR** — current snapshot in 6 bullets.
- **Why memory, not bytes** — heap-vs-bundle constraint analysis.
- **Per-player multipliers (M1–M15)** — allocator ranking with scale buckets.
- **One-time overhead (O1–O5)** — non-per-player cost categories.
- **Reclaim ladder (Tiers A–F)** — concrete levers, ranked by ROI.
- **Why per-PID UI is non-negotiable** — architectural rule.
- **Verified safe operations (no-go list)** — what reclaim must not do.
- **Open questions** — decisions waiting on user input.
- **Verification plan** — how to confirm a fix.

## Ratings

### Per-player multipliers — `M1` … `M15`

Allocators that scale with connected player count, ranked by retained heap at 16 players. **`M1` = worst, `M15` = least.** The ID *is* the rank.

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
