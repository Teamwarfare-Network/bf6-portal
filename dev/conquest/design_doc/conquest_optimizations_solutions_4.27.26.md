# Conquest Optimization — Solutions Snapshot (2026-04-27)

## Razors (principles guiding the design choice)

1. **Multiplier reduction.** Heap pressure is per-player UI × players. Anything that *eliminates*, *defers*, or *de-multiplies* per-player UI attacks the dominant axis.
2. **Interactivity vs passivity.** Per-PID scope is required for interactive content (clicks, hovers, focus) and contextual content (engage state, perspective). Passive team-uniform content (tickets, clocks, vehicle name plates) is not gated by per-PID; it can collapse to per-team or global if the SDK supports it.
3. **Lifetime scope.** Surfaces have validity windows. A UI only needed pre-LIVE is fundamentally different from one persistent through LIVE — the former can be destroyed during the high-pressure window.
4. **Eager vs lazy materialization.** Prebuild-hidden trades CPU spikes for retained heap. Lazy-build trades retained heap for CPU spikes on first interaction. The binding constraint flipped from CPU to memory; lazy is now the right default.
5. **Per-element minimization.** Independent of scope and lifetime, fewer widgets per UI = less retained per instance.

## Problem statement

- Primary problem: **too much UI** — more specifically, **too many polished, reactive, interactive UIs.**
- Direction: drastically simplify the UIs, and/or serve fewer UIs to all players.
- Materialization: do **not** hot-load and warm UIs up front; serve them on demand (lazy) — provided lazy doesn't reintroduce CPU spikes.
- Element budget: each UI should contain fewer elements in general.

## UI bloat ranking (worst → least)

1. Ready Up Dialog
2. Supply Box (Gadget / Ammo Menu)
3. Timer displays anywhere (passive vehicle list, deploy vehicle list, static on-foot vehicle display)
4. Combat HUD

## Solutions to explore (ordered by value/impact)

0. **Lazy-load wherever possible.** Measure first-open and concurrent-open spike impact. Do not front-load unless we have to.
1. **Ready Up Dialog → admin only.** First connecting player is the admin (host); only they get the rich configuration UI.
2. **Simplified ready/team-change UI for non-admin players.** Just ready, not-ready, change teams. Possibly a count (or list, if we can afford it) of players not yet ready.
3. **Admin pass-on capability + disconnect handling.** Account for admin dropping connection; need a deterministic backup path to promote a new admin.
4. **"Configuration UIs concentrate on host" as a design philosophy.** A singular player with a singular copy of expensive UIs doesn't scale per-player — leverage that to keep the rich configuration toys without paying the multiplier.
5. **Simplify timers everywhere except the master clock.** The top clock stays as the canonical reference. Every other countdown becomes a non-digit indicator (color, percentage, bar fill).
6. **Per-class Supply Box.** Four variants, one per class — players see only their own class's gadgets.
7. **Cull small-stuff vehicles from the deploy list.** World-spawn jeeps / dirt bikes / quad bikes etc. as in-world indicators rather than dedicated UI rows.
8. **Cut the on-foot deploy menu.** Force-redeploy the player and reuse the deploy-screen menu instead of maintaining a separate live-terminal UI.
9. **Scope back variable / function names** for length and usage. Clean up the crust on the worst names (phase prefixes, etc.).
10. **Per-team / global scope where the SDK allows.** Wherever a UI surface is non-interactive and team-uniform (or globally uniform), collapse it. SDK validation is the prerequisite.
11. **Remove the loading gate itself.** Once lazy-load is the default and prebuild-hidden goes away, the loading-gate orchestration in `interaction/actions.ts` (`prebuildAllUiFamiliesHidden`, warm/reveal sequencing) loses its purpose. The gate's release-authority can simplify or disappear with it.

## Prioritized action list (ship sequencing)

Cadence: **small batches with a 16-player playtest between waves.** Stack-then-test loses attribution if a wave regresses; one-change-per-test is too slow. Each wave should be a coherent unit that passes/fails together.

### Wave 1 — Zero-design leak fixes (ship immediately)
- **A6** — `destroyArmMenu(pid)` in `onPlayerLeaveGameImpl` (M2 leak). 2 lines.
- **A7** — `delete State.hqDeploy.lastRequestAtSecondsByPid[pid]` in `onPlayerLeaveGameImpl`. 1 line.
- **Effort:** minutes. **Risk:** zero. **Test gate:** standard manual scenarios + 16-player playtest before next wave.

### Wave 2 — Mechanical bundle/perf cleanup
- **F1** — strip `conquestPhase[2A|2B|3|4|4B]` prefix from 114 symbols. ~4 hours mechanical.
- **Effort:** half-day. **Risk:** low (pure rename). **Test gate:** typecheck pass + brief in-game smoke test.

### Wave 3 — Lazy-load pivot + loading-gate removal
- **#0 + #11 paired.** Needs a written design (plan-mode) covering hitch mitigation: per-build yield points, concurrent-open serialization, late-joiner cold-open acceptance.
- **Effort:** multi-day, biggest single design surface so far. **Risk:** medium-high (regresses CQ_Bug_30 / CQ_Bug_40 family if hitch mitigation is incomplete). **Test gate:** 16-player playtest + concurrent-join scenario.

### Wave 4 — Admin model
- **#1** — Ready Dialog → admin only.
- **#2** — Simplified non-admin ready/team-change UI.
- **#3** — Admin promote-list state + disconnect auto-promote.
- **#4** — Codify "configuration UIs concentrate on host" as a design philosophy entry in `conquest_design.md`.
- **Effort:** multi-day, biggest single per-player-multiplier collapse. **Risk:** medium (gameplay UX change; admin-handoff state machine has edge cases). **Test gate:** 16-player playtest with explicit join/leave/promote/disconnect scenarios.

### Wave 5 — Per-element simplifications
- **#5** — Timers everywhere except master clock → color/percentage indicators.
- **#6** — Per-class Supply Box (4 variants, show only player's class).
- **#7** — Cull small-stuff vehicles from deploy list; world-spawn as indicators.
- **#8** — Cut on-foot deploy menu; force-redeploy through deploy menu.
- Each is independent; can ship sub-wave-by-sub-wave.
- **Effort:** 1–2 days each. **Risk:** low-medium (mechanical UI reduction; UX trade-offs). **Test gate:** per sub-wave playtest.

### Wave 6 — Diff-cache trim
- **Tier A2** — drop `last*` mirror fields from `VehicleDeployTimerRowCacheEntry`, `BoundaryPromptWidgetCacheEntry`, `VehicleDeployTimerHudCacheEntry`. Benefits Combat HUD baseline (M3) which is otherwise stuck.
- **Effort:** half-day per cache. **Risk:** medium (diff caches exist to suppress redundant `mod.SetUI*` writes; removing may re-introduce CPU cost). **Test gate:** measure visible HUD update rate on a 16-player playtest before approving permanent removal.

### Cherry-picks — opportunistic, no architectural commitment
Patterns from `bf6-portal-utils/ui` to adopt as code in the relevant area gets touched. Each is a standalone retrofit; pick up the ones that fit the wave you're working in.
- **`UI.COLORS` palette** — replace scattered `mod.CreateVector(r, g, b)` calls with named palette constants. Bundle-byte and readability win. Fits naturally during Wave 2 (renames touch many files).
- **Deleted-element protection** — add a `_deleted` flag to cache structures; short-circuit setters on deleted entries. Eliminates a stale-ref bug class. Fits Wave 3 (cache lifecycles change there).
- **Receiver inheritance helper** — adopt the `getReceiver()` pattern (~10 lines) so per-pid/per-team/global scope is a uniform helper. Fits Wave 4 if any non-admin UI gets a different scope.
- **`uiInputModeWhenVisible` reference-counted manager** — request-counted enable/disable for `mod.EnableUIInputMode`. Fits Wave 3 (lazy menus).

### Backlog (revisit when prerequisites change)
- **#10** — Per-team / global scope. Gated by SDK validation; suspected unavailable. Revisit if a future SDK update changes the answer.
- **`bf6-portal-utils/ui` wholesale adoption** — v2 / post-stabilization refactor. Revisit once 64-player capacity is achieved and the optimization arc is closed.

### Always-on (ride alongside any wave)
- Doc maintenance via `bumpVersion` post-bump checklist (state file + analysis file refresh).
- Lifecycle Map status update for any new per-pid state field (must ship with paired `delete`).
- Issue tracker hygiene — close out resolved items, log new findings as they surface.
