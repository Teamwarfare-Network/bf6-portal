# TWL Conquest Optimization Analysis

Last updated: v1.221 (2026-04-13)
Companion to: `TWL_Conquest_Design.md` (see "Codebase Reference Map" section for file/function index)

## Baseline

| Metric | Value |
|--------|-------|
| Bundle size | 1,001,081 bytes |
| Bundle limit | 1,048,576 bytes |
| Headroom | 47,495 bytes (4.53%) |
| v1.221 bundle (after stability/perf pass) | 998,868 bytes (-2,213 bytes net despite adding generation counter, TickContext, and helper infrastructure) |
| v1.221 headroom | 49,708 bytes (4.74%) |
| Source files | 116 .ts |
| `mod.AllPlayers()` calls | 44 across 31 files |
| `safeFind()` calls | ~311 across 33 files |

**Headroom status: healthy.** Recovered from the v1.110 "critically low" 1.0% low-water mark through a combination of the v1.190 audit pass and ongoing telemetry scrubs. No longer a blocker for feature work.

## Size Progression (v1.010 → v1.213)

| Version | Bundle Size | Headroom | Delta | Phase/Feature |
|---------|-------------|----------|-------|---------------|
| v1.010 | 1,025,710 | 22,866 (2.2%) | — | Baseline (Phase 6 complete) |
| v1.064 | 1,024,269 | 24,307 (2.3%) | -1,441 | CQ_Bug_25 world icon fix, AddUIIcon removal |
| v1.103 | 1,037,197 | 11,379 (1.1%) | +12,928 | Phase 10 polish: gadget locker, deploy timer UI, perf diag, admin panel |
| v1.110 | 1,038,559 | 10,017 (1.0%) | +1,362 | CQ_Bug_39 hardening — low-water mark |
| v1.190 | 995,854 | 52,722 (5.03%) | **-42,705** | Audit pass: 3 dev flags→false, 52 stale widget names removed, safeFindPlayer hot-path fix (BUG-A8) |
| v1.207 | 994,811 | 53,765 (5.13%) | -1,043 | Continued cleanup through Phase 9/10 work |
| v1.212 | 1,002,150 | 46,426 (4.43%) | +7,339 | Gadget round-start delay + countdown delay lines + team-kill guard |
| v1.213 | 1,001,081 | 47,495 (4.53%) | -1,069 | FEATURE_WORLD_ICON_DIAG telemetry fully removed |
| v1.221 | 998,868 | 49,708 (4.74%) | -2,213 | Stability/perf pass: loading-gate asserts, deploy-timer safeFind caching, combat HUD generation counter, forEachValidPlayer helper, TickContext AllPlayers cache, dirty-flag HUD gate |

**Key observations:**
- The v1.110→v1.190 audit recovered **~42.7 KB** via compile-flag gating + stale-ref cleanup + safeFindPlayer caching (see `conquest_audit_v1.187_2026-04-12.md`).
- Phase 10 feature additions (gadget delay lines, ammo-locker header, KPI team guard) reclaimed 7.3 KB but stayed comfortably within budget.
- Current ~4.5% headroom is sustainable for feature work; optimization items below are now **optional** rather than blocking.

---

## Category 1: File Size Reduction

| # | Title | Est. Savings | Impact | Effort | Status |
|---|-------|-------------|--------|--------|--------|
| 1 | Gate UI Cache Perf instrumentation behind compile flag | 1,000-2,000 bytes | Medium | Low | **Resolved** (v1.190 — FEATURE_PERF_DIAG=false ships; counters no-op when flag off) |
| 2 | Compress repetitive widget name generation | 2,000-4,000 bytes | Medium | Medium | Open |
| 3 | Deduplicate `*ForAllPlayers` boilerplate patterns | 2,000-3,000 bytes | Medium | Medium | Open (see Category 2, Item 2) |
| 4 | Gate perf diag panel behind compile flag | 3,000-5,000 bytes | High | Low | **Resolved** (v1.190 — FEATURE_PERF_DIAG=false) |
| 5 | Trim Changelog.ts history | — | — | — | **Won't fix / non-issue** — postbuild strips comments; Changelog.ts contributes ~0 bundle bytes. Source weight only. |
| 6 | Audit emitted JSDoc / inline comments for bundle leakage | 500-1,500 bytes | Low-Medium | Low | Open (AGENTS.md §2749) |
| 7 | Scrub remaining temp feature flags | Variable | Low-Medium | Low | `FEATURE_POSITION_DEBUG=false`, `FEATURE_JOIN_PROMPT=false`, `FEATURE_ADMIN_PANEL=true`. Admin panel kept on for live tuning; others already off. |

**Previously identified items — now resolved:**
- ~~Gate HUD Projection Debug snapshot~~ — Removed entirely
- ~~Gate UI Load Trace debug system~~ — `hud/ui-load-debug.ts` deleted
- ~~Eliminate dead `HARD_PLAYER_LOCK_AUDIT_MODE` branches~~ — Deleted
- ~~`setHudSwapTransitionActiveForPid` no-op~~ — Removed
- ~~UI Cache Perf panel + perf-diag gating~~ — Resolved v1.190 via `FEATURE_PERF_DIAG`
- ~~FEATURE_WORLD_ICON_DIAG telemetry~~ — Entire feature removed v1.213 (1,069 bytes + related state fields + admin widget + stringkey)

### 2. Compress Repetitive Widget Name Generation — still open

**Files (current line counts):** `vehicles/deploy-timer-ui.ts` (2,031 lines), `interaction/ammo-resupply-menu.ts` (2,008 lines), `admin-panel/build.ts` (348 lines), `boundary/prompt-ui.ts` (~480 lines).

Inline template literals for widget names repeat the `prefix_${pid}_${suffix}` pattern hundreds of times. A single factory `wn(prefix, ...parts)` would save 2-4 KB. **Medium effort, no urgency** while headroom is healthy.

### 6. Audit Emitted Comments (AGENTS.md §2749)

Postbuild strips `//` and `/* */` comments, but some comment shapes (JSDoc preceding exported members, or comments within preserved string literals) may still land in the bundle. Worth a one-time audit; likely 500-1,500 bytes.

---

## Category 2: Architecture and Organization

| # | Title | Impact | Effort | Status |
|---|-------|--------|--------|--------|
| 1 | Split `capture-tickets.ts` (2,147 lines) by concern | High | High | Open — largest logic file |
| 2 | Introduce shared `forEachValidPlayer()` abstraction | High | Medium | **Resolved** (v1.217 — `src/state/player-iteration.ts`; 23 `*ForAllPlayers` wrappers converted) |
| 3 | Consolidate `hud-warm-state.ts` 40+ getter/setter pairs | Medium | Medium | Open |
| 4 | Decouple debug/diagnostics state from core runtime | Medium | Medium | Partially resolved (perf-diag gated; WORLD_ICON_DIAG removed; hudDirty + perspective maps still interleaved) |
| 5 | Extract loading gate into self-contained module | Medium | Medium-High | Open |

### Three Mega-Files Still Dominant

The v1.190 audit flagged three files >2K lines apiece; all three remain dominant as of v1.213:

| File | Lines | Notes |
|---|---|---|
| `capture-tickets.ts` | 2,147 | Phase 2A sync + bleed + 7 combat HUD view models + dispatch (see Item 1 split plan) |
| `vehicles/deploy-timer-ui.ts` | 2,031 | Widget construction-heavy; prime target for Category 1 Item 2 |
| `interaction/ammo-resupply-menu.ts` | 2,008 | Grew in v1.211 for gadget-delay status header + tile gate |

A split pass would improve navigability; zero bundle impact (bundler concatenates).

### 2. `forEachValidPlayer()` — resolved v1.217

`src/state/player-iteration.ts` introduces `forEachValidPlayer(cb)`; 23 thin `*ForAllPlayers` wrappers were converted to use it (Category 1 Item 3 deduplication achieved). Per-tick caching is handled by Category 4 Item 1 (`TickContext`, v1.219).

---

## Category 3: Crash Risks

| # | Title | Severity | Effort | Status |
|---|-------|----------|--------|--------|
| 1 | `for...in` with `delete` during iteration | Medium | Low | Partially fixed — remaining ~21 `for...in` sites are read-only per v1.190 audit |
| 2 | Stale widget references after team swap/reconnect | High | Medium | **Resolved** (v1.190 — 52 stale widget-name refs removed; v1.216 — `State.conquest.debug.combatHudGenerationByPid` counter invalidates cached widget refs on every destroy; render path stamps, bails, and recovers on mismatch) |
| 3 | Unbounded loading gate polling loop | — | — | **Resolved** (v1.104) |
| 4 | Inverted null guards in hot-path state accessors (`isHudWarmReadyForPid`) | — | — | **Won't fix — intentional design.** Changelog.ts:189 v1.012 explicitly reverted this: "original design intent is warm-on-unknown-state, not conservative false." Missing state = gate not active, so HUD should render. |
| 5 | Race between async loading gate and synchronous deploy event | Medium-High | Low | **Resolved** (v1.214 — GATE_INV_1/2/3 invariant asserts verify dual-guard holds at runtime; SP-safe, no behavior change) |

### 2. Stale Widget References After Team Swap/Reconnect

Resolved v1.216. v1.190 removed 52 orphaned widget-name strings. v1.216 added `State.conquest.debug.combatHudGenerationByPid`: the counter increments on every widget destroy; the render path stamps the generation at build time and bails (then recovers) on a mismatch, preventing any stale-ref write after a team swap or reconnect.

### 5. Loading Gate / Deploy Event Race

Resolved v1.214. GATE_INV_1/2/3 invariant asserts were added (SP-safe, no behavior change) to verify at runtime that the dual-guard invariant holds across the loading-gate and deploy-event coordination. The v1.104 serialization lock remains the enforcement mechanism; the asserts catch any future regression.

---

## Category 4: Performance Overhead

| # | Title | Per-Tick Savings | Impact | Effort | Status |
|---|-------|-----------------|--------|--------|--------|
| 1 | Cache `mod.AllPlayers()` once per tick | 5-7 engine calls/tick | High | Medium | **Resolved** (v1.219 — `TickContext` in `src/state/tick-context.ts`; `beginTickContext()`/`endTickContext()` wraps the main game-mode subtick body; `forEachValidPlayer` consults ambient ctx so per-subtick callers share one snapshot; event handlers fall back to a fresh call) |
| 2 | Gate combat HUD render behind dirty flag | Skip 70-80% of renders | High | Medium | **Resolved** (v1.221 — `twlConquestHudTickFrame` gated on `hudDirty \|\| force`; derived top-HUD slices stay unconditional; AGENTS.md "Combat HUD Dirty-Flag Contract" lists 9 state fields that must call `conquestPhase3MarkHudDirty()` on mutation) |
| 3 | Replace string signatures with generation counters | Eliminate per-player alloc | Medium | Medium | Open |
| 4 | Cache widget refs in hot render paths | Eliminate ~200 safeFind calls | Medium | Medium | **Resolved** (v1.215 — cached loading-overlay exists flag + removed redundant safeFind in `deploy-timer-ui.ts` hot path) |
| 5 | Skip boundary checks for unmoving/undeployed players | Skip 60-80% of checks | Medium | Medium | **Resolved** — `boundary/enforcement.ts:119` has `if (!isPlayerDeployed(player)) return undefined;` guard. Position-delta skip for deployed players still open. |

### 1. Cache `mod.AllPlayers()` Per Tick — resolved v1.219

`src/state/tick-context.ts` introduces `TickContext`; `beginTickContext()`/`endTickContext()` wrap the main game-mode subtick body in `src/index/game-mode.ts`. `forEachValidPlayer` consults the ambient context so all per-subtick callers share one `mod.AllPlayers()` snapshot. Event handlers and one-shot lifecycle transitions fall back to a fresh call. (`mod.Array` is not generic, so the `players` field is typed `any` — addressed in the v1.220 type-fix follow-up.)

### 2. Dirty-Flag Combat HUD Render — resolved v1.221

`twlConquestHudTickFrame` is now gated on `State.conquest.debug.hudDirty || force`. Derived top-HUD slices (clock VM) and `twlConquestHudTickAnimation` remain unconditional (time-variant). AGENTS.md gained a "Combat HUD Dirty-Flag Contract" section listing 9 state fields that must call `conquestPhase3MarkHudDirty()` on mutation.

### 4. safeFind Caching — resolved v1.215

v1.190 fixed the `safeFindPlayer` hot-path (BUG-A8 at `capture-tickets.ts:1783`). v1.215 extended caching to the `deploy-timer-ui.ts` hot path: loading-overlay exists flag is now cached and a redundant `safeFind` call on each timer tick was removed.

---

## Implementation Priority (revised)

Headroom at 4.74% is healthy — optimization is **no longer blocking feature work**. Priorities are now driven by stability and perf, not bundle size.

### v1.214–v1.221 Stability/Perf Pass — all targeted items resolved

The pass closed every item that was in the Stability and Performance tiers:

- **Category 3 Item 5** — Loading-gate/deploy race: invariant asserts (v1.214).
- **Category 4 Item 4** — deploy-timer safeFind hot-path caching (v1.215).
- **Category 3 Item 2** — Combat HUD generation counter closes stale-ref risk (v1.216).
- **Category 2 Item 2 + Category 1 Item 3** — `forEachValidPlayer` helper + 23 wrapper dedupes (v1.217).
- **Category 4 Item 1** — `TickContext` gives per-subtick `mod.AllPlayers()` snapshot (v1.219).
- **Category 4 Item 2** — dirty-flag gate on `twlConquestHudTickFrame` + AGENTS.md contract (v1.221).

Net bundle delta: -2,213 bytes (1,001,081 → 998,868).

### Navigability (opportunistic)

6. **Category 2 Item 1** — Split `capture-tickets.ts` (2,147 lines) into 4 files.
7. **Category 2 Item 5** — Extract loading gate module.

### Bundle (only if a large feature needs room)

8. **Category 1 Item 2** — Widget-name factory (~2-4 KB).
9. **Category 1 Item 6** — Emitted-comment audit per AGENTS.md §2749 (~0.5-1.5 KB).

### Cleanup (post-MP validation)

10. Temp flag scrub — `FEATURE_ADMIN_PANEL` is currently `true` for live tuning. Once admin-panel needs settle, flip to false for another few KB.
11. Validate + close the "Likely resolved" cohort of `CQ_Bug_*` issues during MP playtest, then remove associated guards/comments.
