## Helis-Only vs Conquest — Side-by-Side Comparison

*Draft generated 2026-05-25 against Helis v0.630 and Conquest v1.514. Pending human review.*

This document compares Helis-only and Conquest at the architecture, subsystem, and pattern level. The two projects share a common ancestor — Conquest grew out of the Helis codebase — so this is a "where did the trees diverge" analysis, not a refactor map. Per the project direction confirmed 2026-05-25, **Helis stays distinct as its own game mode**; this document identifies what should and should not be selectively ported.

For per-file detail, see [heli_features.md](./heli_features.md). For risk/bug detail, see [heli_issues_design.md](./heli_issues_design.md). For the concrete action plan, see [heli_improvement_plan.md](./heli_improvement_plan.md).

---

### 0. TL;DR

- **Helis is ~16k LOC across 19 flat files; Conquest is ~?k LOC across 100+ files in deep subfolders.** Helis is the older shape; Conquest is what happens when 6+ waves of optimization carve a monolith into domain modules.
- **Both share the same fundamental mechanics**: round-based competitive PvP, per-pid HUD scoped to player id, vehicle spawner slot system, ready-dialog → countdown → live → cleanup → next round, admin panel, overtime tie-breaker on a single capture zone.
- **Helis is a vehicle-only mode**; Conquest is a multi-class capture-and-tickets mode. The combat-HUD, capture-tickets, and gadget-locker subsystems in Conquest have no Helis equivalent and **should not be ported**.
- **Conquest has paid for 10+ months of MP playtest hardening that Helis has not.** Many of those fixes apply to shared subsystems (vehicle spawner, ready-dialog roster refresh, late-joiner crashes, ASCII guardrails). Some are already ported (postbuild pipeline v0.630). Others are open.
- **The areas most worth porting from Conquest to Helis**: (a) per-pid pid map consolidation pattern (H8 → one struct), (b) tick-context `AllPlayers` cache (Conquest R33/G2/G3), (c) HUD dirty-flag contract (Conquest combat-HUD dirty-gate analog), (d) lazy-build pattern (Conquest Wave 3) if Helis ever pushes player counts higher.
- **The areas where Helis is currently simpler and should stay that way**: no `FEATURE_*` flag machinery, no lazy-build dispatcher, no separate combat-HUD module, no spawn-charge ticket economy.

---

## 1. Project shape comparison

| Dimension | Helis-only v0.630 | Conquest v1.514 | Notes |
|---|---|---|---|
| Files in `src/` | 19 (`.ts`) + 1 `strings.json` | 100+ files in `src/`, structured in ~14 subfolders | Helis is monolithic-flat; Conquest is domain-modular. |
| Lines of TypeScript | ~16,000 | Substantially more (modularization adds wrappers + types) | LOC is similar order of magnitude but Conquest spreads it out. |
| Bundle size | ~500,000 bytes | ~847,560 bytes post-Wave-3 (v1.418) | Helis bundle is ~40% smaller because fewer features. |
| Bundle headroom | ~548,000 bytes | ~200,000 bytes | Helis has materially more headroom. |
| Versioning | `header-file.ts` + `footer-file.ts` + `package.json` + `strings.json` branding (4-file update via `bumpVersion`) | Same 4-file scheme | Pattern shared. |
| Build pipeline | `bf6-portal-bundler` → 12-step `postbuild.js` → `verify.js` | Same | **Helis ported the Conquest pipeline at v0.630.** |
| Postbuild ASCII guardrail | **Yes** (step 11.5) | **Yes** (step 11.5, added v1.498) | Helis ported the guardrail in v0.630. |
| Comment-strip postbuild | **Yes** (steps 9 + 10) | **Yes** | Helis ported in v0.630. Saved ~150 KB. |
| Lazy-build dispatcher | **No** | **Yes** (Wave 3 v1.418) | Helis built every UI surface up-front via `ensureHudForPlayer`. |
| `FEATURE_*` compile-time flags | **None** | `FEATURE_PERF_DIAG`, `FEATURE_LAZY_BUILD`, others | Helis has no flag machinery; the v0.630 dead-code-elim pass had nothing to elide. |
| Per-pid pid maps | ~14 (`State.players.*ByPid`) + 7 join-prompt | Substantially more (Conquest M1–M15 ranks 15 per-pid allocators) | Helis is simpler. |
| Tick-context (`AllPlayers` cache) | **No** | **Yes** ([state/tick-context.ts](../../conquest/src/state/tick-context.ts)) | Worth porting (see Section 4). |
| HUD dirty-flag contract | **No** | **Yes** ([AGENTS.md](../../conquest/AGENTS.md) "Combat HUD Dirty-Flag Contract") | Conquest-grade contract; Helis just renders unconditionally each tick. |
| Reference design docs | **None until this PR** | 40+ in `design_doc/` (waves, plans, audits, issues) | This PR seeds the Helis design_doc folder. |

---

## 2. Subsystem-by-subsystem comparison

For each shared subsystem, columns show: what Helis does, what Conquest does, the delta, and whether porting Conquest's version makes sense for Helis.

### 2.1 State management

| Aspect | Helis | Conquest | Port? |
|---|---|---|---|
| Singleton location | `const State: GameState = {...}` in [src/state.ts](../src/state.ts) | Decomposed: [state/core.ts](../../conquest/src/state/core.ts), [state/runtime.ts](../../conquest/src/state/runtime.ts), [state/hud-cache-types.ts](../../conquest/src/state/hud-cache-types.ts), [state/player-iteration.ts](../../conquest/src/state/player-iteration.ts), [state/player-lookup.ts](../../conquest/src/state/player-lookup.ts), [state/tick-context.ts](../../conquest/src/state/tick-context.ts), [state/id-helpers.ts](../../conquest/src/state/id-helpers.ts), [state/lifecycle-guardrails.ts](../../conquest/src/state/lifecycle-guardrails.ts), [state/ui-helpers.ts](../../conquest/src/state/ui-helpers.ts) | **No.** The single-file shape is fine for Helis at current scale. Splitting buys clarity but costs the simplicity that makes Helis approachable. |
| ID helpers (`safeGetPlayerId`, `getObjId`, `isPlayerDeployed`) | In `state.ts` middle | In [state/id-helpers.ts](../../conquest/src/state/id-helpers.ts) | **No** for now. Move them out if/when `state.ts` exceeds ~1,500 lines. |
| Safe SoldierState wrappers | In `state.ts` | In [state/ui-helpers.ts](../../conquest/src/state/ui-helpers.ts) | **No** for now. Same reason. |
| Tick-context (`beginTickContext` / `endTickContext`) | **Missing** | [state/tick-context.ts](../../conquest/src/state/tick-context.ts) — caches `AllPlayers` snapshot per subtick | **YES — port this.** Helis has multiple `forAllPlayers`-style helpers that each call `mod.AllPlayers()` fresh, which is the Conquest R33/G2/G3 antipattern. |
| Lifecycle guardrails | Implicit (`State.round.flow.cleanupActive`, `roundEndUiLockdown`) | Explicit in [state/lifecycle-guardrails.ts](../../conquest/src/state/lifecycle-guardrails.ts) | **No.** Helis's implicit flags are working. |

### 2.2 HUD construction

| Aspect | Helis | Conquest | Port? |
|---|---|---|---|
| Main HUD builder | `ensureHudForPlayer` in [src/hud.ts](../src/hud.ts) lines 936–2,748 (**1,812-LOC mega-function** — self-flagged as "absurd" in source comment) | Decomposed across [ui/conquest/hud-core/build.ts](../../conquest/src/ui/conquest/hud-core/build.ts), [hud-core/render.ts](../../conquest/src/ui/conquest/hud-core/render.ts), [hud-core/lifecycle.ts](../../conquest/src/ui/conquest/hud-core/lifecycle.ts), [hud-core/pipeline.ts](../../conquest/src/ui/conquest/hud-core/pipeline.ts), [hud-core/state.ts](../../conquest/src/ui/conquest/hud-core/state.ts), [hud-core/validate.ts](../../conquest/src/ui/conquest/hud-core/validate.ts), [hud-core/names.ts](../../conquest/src/ui/conquest/hud-core/names.ts), [hud-core/constants.ts](../../conquest/src/ui/conquest/hud-core/constants.ts), [hud-core/toggle.ts](../../conquest/src/ui/conquest/hud-core/toggle.ts), [hud-core/types.ts](../../conquest/src/ui/conquest/hud-core/types.ts) | **Partial.** Helis's mega-function is the single worst code-review burden in the project. Splitting it (per [heli_improvement_plan.md](./heli_improvement_plan.md) item C1) does not require copying Conquest's full hud-core directory. Split by lifecycle (build → cache → update) and by sub-panel (upper-left, top-center, victory dialog, round-end dialog), not by Conquest's specific module boundaries. |
| HUD dirty-flag contract | **None** — clock + kills update every 1 s unconditionally | Strict contract in [conquest/AGENTS.md "Combat HUD Dirty-Flag Contract"](../../conquest/AGENTS.md); `markHudDirty()` required at mutation sites | **YES, scoped.** Helis can adopt the dirty-gate pattern for the kills HUD sync and victory dialog updates — both are currently broadcast unconditionally. See improvement plan item B3. |
| Safe-wrappers (`safeSetUITextLabel` etc.) | In `hud.ts` | Distributed | Pattern matches Conquest. |
| Per-pid widget name suffixing | `${name}_${pid}` everywhere | Same | Pattern matches Conquest. |

### 2.3 Vehicle spawner system

| Aspect | Helis | Conquest | Port? |
|---|---|---|---|
| Spawner slot model | `VehicleSpawnerSlot[]` in `State.vehicles.slots` | Same — Conquest forked this from Helis. | Same shape. |
| `forceSpawnWithRetry` (≤20 attempts × 0.25 s) | [src/vehicles.ts:307](../src/vehicles.ts#L307) | Equivalent in [vehicles/vanilla-spawner.ts](../../conquest/src/vehicles/vanilla-spawner.ts) | Same. |
| `pollVehicleSpawnerSlots` 1 s tick | [src/vehicles.ts:420](../src/vehicles.ts#L420) | [vehicles/vanilla-spawner.ts](../../conquest/src/vehicles/vanilla-spawner.ts) | Same. |
| Sequential spawn token cancellation | [src/vehicles.ts:281](../src/vehicles.ts#L281) | Same | Same. |
| `applySpawnYawToVehicle` two-`mod.Teleport` pattern | [src/vehicles.ts:447](../src/vehicles.ts#L447) — vehicle teleport at spawn time only | Same pattern; vehicle-only teleport is safe per ban list | Both projects use this pattern; **not** the banned "player teleport + ForcePlayerToSeat" pattern. |
| Spawn-camp distance check | `VEHICLE_CAMPED_DISTANCE_METERS = 25.0` in [src/types.ts:180](../src/types.ts#L180); `OnVehicleDestroyed` checks before awarding kill | Equivalent in Conquest | Same. |
| Forward Deploy / Air Deploy | **Not present** (helis is "deploy from main base only") | [vehicles/forward-spawn-volume.ts](../../conquest/src/vehicles/forward-spawn-volume.ts), [vehicles/air-spawn-volume.ts](../../conquest/src/vehicles/air-spawn-volume.ts) | **No.** By design — Helis is base-only. |
| HQ Deploy (player-triggered per-slot) | **Not present** | [vehicles/hq-deploy.ts](../../conquest/src/vehicles/hq-deploy.ts) — added in Conquest Phase 6 (v1.289) | **No** unless gameplay calls for it. |
| `sinkAndDestroyVehicle` (sink to y=−1000 + DealDamage) | **Not present**; Helis uses `mod.UnspawnObject` directly | [vehicles/](../../conquest/src/vehicles/) — added v1.262 to avoid late-respawn-during-cleanup races | **Consider** — Helis's round-end cleanup destroys all vehicles synchronously via `UnspawnObject`. Conquest replaced this because `UnspawnObject` raced with engine cleanup during round transitions. Worth investigating whether Helis hits the same race. See [heli_issues_design.md](./heli_issues_design.md) item I3. |

### 2.4 Ready Dialog + countdown + auto-ready

| Aspect | Helis | Conquest | Port? |
|---|---|---|---|
| Dialog builder | `createTeamSwitchUI` in [src/ready-dialog.ts](../src/ready-dialog.ts) (~1,230 LOC) | Decomposed across [ready-dialog/dialog-build-roster.ts](../../conquest/src/ready-dialog/dialog-build-roster.ts), [ready-dialog/dialog-build-mode-config.ts](../../conquest/src/ready-dialog/dialog-build-mode-config.ts), [ready-dialog/lifecycle.ts](../../conquest/src/ready-dialog/lifecycle.ts), [ready-dialog/countdown-flow.ts](../../conquest/src/ready-dialog/countdown-flow.ts), [ready-dialog/auto-start.ts](../../conquest/src/ready-dialog/auto-start.ts), [ready-dialog/matchup-summary.ts](../../conquest/src/ready-dialog/matchup-summary.ts), [ready-dialog/mode-config-*.ts](../../conquest/src/ready-dialog/), [ready-dialog/player-ready-panel.ts](../../conquest/src/ready-dialog/player-ready-panel.ts), [ready-dialog/pregame-ui.ts](../../conquest/src/ready-dialog/pregame-ui.ts), [ready-dialog/ready-reset.ts](../../conquest/src/ready-dialog/ready-reset.ts), [ready-dialog/roster-active.ts](../../conquest/src/ready-dialog/roster-active.ts), [ready-dialog/roster-render.ts](../../conquest/src/ready-dialog/roster-render.ts), [ready-dialog/swap-action.ts](../../conquest/src/ready-dialog/swap-action.ts), [ready-dialog/takeoff-gating.ts](../../conquest/src/ready-dialog/takeoff-gating.ts), [ready-dialog/loading-overlay.ts](../../conquest/src/ready-dialog/loading-overlay.ts) (deleted in Wave 3 Ship 8) | **Partial.** Helis's `ready-dialog.ts` is 4,302 lines — the single largest file in the project. Splitting it by purpose (build, roster render, countdown, auto-ready, join prompt, ceiling) without forcing Conquest's exact module boundaries is the right shape. See improvement plan C2. |
| Auto-ready (triple-tap interact + ready button) | [src/ready-dialog.ts](../src/ready-dialog.ts) `applyAutoReadyForAllPlayers` | [ready-dialog/auto-start.ts](../../conquest/src/ready-dialog/auto-start.ts) | Same pattern. |
| Ready persistence through death/HQ exit | Currently: deploy clears `readyByPid` to false ([src/index.ts:345](../src/index.ts#L345)); HQ exit clears it pre-live ([src/index.ts:872-880](../src/index.ts#L872)) | **Fixed in Conquest v1.445 (#58)** — both auto-clears removed; only SWAP TEAMS + admin config change clear ready state | **YES — port this fix.** Helis has the bug Conquest #58 documented. See [heli_issues_design.md](./heli_issues_design.md) item B1. |
| Late-join during countdown crash | Status unknown — no defense in place | Defended in Conquest [5.07.26_late_join_during_countdown_fix_plan.md](../../conquest/design_doc/5.07.26_late_join_during_countdown_fix_plan.md) | **Investigate.** If Helis ever shipped to a 6+ player MP playtest, this would have surfaced. |
| Loading overlay | **Not present** — Helis never had one | Existed in Conquest, deleted in Wave 3 Ship 8 (v1.418) | **No port needed.** Helis is already free of this complexity. |
| `applyMatchupPreset` enables/disables spawner slots | [src/vehicles.ts:228](../src/vehicles.ts#L228) | Same in Conquest | Same. |

### 2.5 Overtime / capture flag tiebreaker

| Aspect | Helis | Conquest | Port? |
|---|---|---|---|
| Single-zone tie-breaker | Yes — random A–G (or H heli) revealed at half-time, vehicle-only capture, last 60 s active | **Different model** — Conquest has multi-flag (5–6) capture-and-tickets as the **primary** gameplay loop | Helis's single-zone overtime is **a different feature** from Conquest's capture loop. Don't try to port Conquest's tickets/bleed system into Helis. |
| Engine CapturePoint suppression (marker-only) | [src/overtime.ts](../src/overtime.ts) `applyOvertimeCapturePointSuppression` — sets capture time to `999999` so engine never captures | Conquest uses engine capture as authoritative | Helis approach is correct for its model. |
| Capture loop tick (`OVERTIME_TICK_SECONDS = 0.25`) | [src/overtime.ts](../src/overtime.ts) `runOvertimeCaptureLoop` | No analog — Conquest's per-subtick `refreshLiveCaptureStateSubtick` is the analog and runs at ~8 Hz | Helis's 4 Hz tick is reasonable for a single zone. |
| Capture multiplier (1×/2×/3×/4× by vehicle count majority) | `OVERTIME_CAPTURE_MULTIPLIER_2X/3X/4X` constants in [src/types.ts:57](../src/types.ts#L57) | Different — Conquest uses player count and a different formula | Helis-specific design; keep. |
| Engagement HUD (in-zone count + percent + crowns) | Per-pid via `State.flag.uiByPid` + diff cache `lastUiSnapshotByPid` | Per-pid via separate combat-HUD module | Helis pattern is sound. |

### 2.6 Aircraft ceiling enforcement

| Aspect | Helis | Conquest | Port? |
|---|---|---|---|
| Hard limiter (`mod.SetMaxAltitude`) | [src/ready-dialog.ts](../src/ready-dialog.ts) `applyCustomAircraftCeilingHardLimiter` *(marked `TODO(1.0)` unused)* | N/A — Conquest has no aircraft ceiling system | **Helis-specific.** Conquest has no equivalent because Conquest gameplay is map-bounds-based, not altitude-bounded. |
| Soft enforcement loop (0.2 s tick, scripted nudges) | `runAircraftCeilingSoftEnforcementLoop` | N/A | Helis-specific. |
| Per-vehicle state cache (`vehicleStates: Record<vid, AircraftCeilingVehicleState>`) | Yes | N/A | Helis-specific. |

### 2.7 Join Prompt sequencing

| Aspect | Helis | Conquest | Port? |
|---|---|---|---|
| Multi-tip prompt with "Never Show Again" per-map | `JOIN_PROMPT_BODY_SEQUENCE_KEYS` (20 tips, some skipped) in [src/types.ts:504](../src/types.ts#L504); state spread across 7 per-pid maps | Conquest has its own tip system; structure varies | **No.** Helis's join-prompt system is mode-specific (TWL ladder onboarding) and already mature. Consolidating the 7 per-pid maps into one struct (H8 in features doc) is a Helis-internal refactor, not a Conquest port. |

### 2.8 Admin Panel

| Aspect | Helis | Conquest | Port? |
|---|---|---|---|
| Toggle button + collapsible container | [src/ready-dialog.ts](../src/ready-dialog.ts) `ensureAdminPanelWidgets` | [ui/admin/action-counter.ts](../../conquest/src/ui/admin/action-counter.ts) + others | Similar pattern. |
| Action counter visible on Victory dialog | Yes (`State.admin.actionCount`) | Yes | Same. |
| Tester rows (`addTesterRow`, `addTesterActionButton`) | In `ready-dialog.ts` | In `ui/admin/` | Similar. |
| Diagnostic toggles (perf-diag, etc.) | None | `FEATURE_PERF_DIAG`-gated | **No.** Helis has no diagnostic surface to gate. |
| `mod.AddUIIcon` for world icons | Not used | **Banned** ([conquest/AGENTS.md](../../conquest/AGENTS.md) and memory `feedback_adduiicon_broken`) | **Helis already clean** — confirmed no `mod.AddUIIcon` usage. |

### 2.9 String key system

| Aspect | Helis | Conquest | Port? |
|---|---|---|---|
| `strings.json` structure | Single tree under `twl.*` | Same root `twl.*` | Both inherited from common ancestor. |
| `mod.Message(stringkey, ...args)` | Used everywhere; **no raw-string `mod.Message("literal")` calls** | Same rule, enforced in [conquest/AGENTS.md](../../conquest/AGENTS.md) | **Helis already compliant.** |
| String change authorization policy | **No explicit policy yet** | Strict policy in [conquest/AGENTS.md](../../conquest/AGENTS.md) — string edits require explicit human approval | **YES — port the policy** into the new Helis AGENTS.md draft. |

### 2.10 Build pipeline / postbuild

Already covered in Section 1 — Helis ported the entire Conquest pipeline at v0.630. The only difference is Helis's postbuild has no `*policy` keyword registered (Conquest registers it for `header-file.ts`).

---

## 3. Patterns Conquest evolved that are worth porting

Ordered by estimated value-to-Helis (highest first). Each one cross-references the improvement plan item where it is sized and scheduled.

### 3.1 Per-pid pid map consolidation (H8 cluster)

**What Conquest did**: Conquest's join-prompt and similar per-pid state clusters were folded into single `Record<number, {…}>` structs after the Wave 3 audit revealed each separate `Record<number, T>` allocates its own hashmap header (small constant cost, but ~10 of them × 64 pids = 640 small object headers).

**Helis has the bug**: 7 separate `joinPrompt*ByPid` maps + ~14 `players.*ByPid` maps. None of them are colocated.

**Effort to port**: Small. Define `type PerPidPlayerState = {…}` and replace ~21 individual maps with one map keyed by pid → struct.

**Value**: Heap footprint reduction (modest in absolute terms, but compounds at higher player counts); also dramatically improves readability — currently `delete State.players.x[pid]; delete State.players.y[pid]; …` is repeated 14 times in `OnPlayerLeaveGame`.

→ See improvement plan item **A1**.

### 3.2 Tick-context `AllPlayers` cache

**What Conquest did**: [state/tick-context.ts](../../conquest/src/state/tick-context.ts) caches the `mod.AllPlayers()` + `mod.CountOf()` result for the lifetime of a subtick. Wrapping event handlers with `beginTickContext / endTickContext` makes the cache available there too. Conquest item G2+G3 (in the recurring-work solutions catalog).

**Helis has the antipattern**: every `ForAllPlayers` helper in Helis calls `mod.AllPlayers()` + `mod.CountOf()` fresh. The 1 s master loop alone calls them ~5 times.

**Effort to port**: Small. One new file `src/tick-context.ts`, ~30 LOC; modify `forAllPlayers`-style helpers to check the context first.

**Value**: At N=24 in a busy frame, reduces `mod.AllPlayers()` engine call count meaningfully. Easy win.

→ See improvement plan item **B2**.

### 3.3 HUD dirty-flag contract

**What Conquest did**: A formal contract documented in [conquest/AGENTS.md](../../conquest/AGENTS.md) "Combat HUD Dirty-Flag Contract" — every mutation to one of a listed set of state fields must call `markHudDirty()` in the same function body, or PR review rejects the change. The render loop short-circuits when nothing is dirty.

**Helis has the antipattern**: The 1 s master loop unconditionally calls `updateAllPlayersClock`, `updateOvertimeStage`, `checkTakeoffLimitForAllPlayers`, `applyAutoReadyForAllPlayers`, `syncKillsHudFromTrackedTotals` every second. Most of those produce identical output most of the time.

**Effort to port**: Medium. The contract itself is a few hundred bytes of documentation. The instrumentation is a `hudDirty` flag plus `markHudDirty()` calls at every mutation site — there are ~30 such sites in Helis. The render-gate change is small (one `if` in each `*ForAllPlayers` helper).

**Value**: At N=24, eliminates ~80% of the no-op `SetUITextLabel` engine calls in the master loop. Modest peak-frame impact, real steady-state impact.

→ See improvement plan item **B3**.

### 3.4 Lazy-build dispatcher (Conquest Wave 3)

**What Conquest did**: Replaced eager `prebuildAllUiFamiliesHidden` with a lazy-build registry ([interaction/lazy-build-registry.ts](../../conquest/src/interaction/lazy-build-registry.ts)) that builds each UI surface only on first use. Was the centerpiece of Wave 3 (v1.409–v1.419), reduced per-pid heap by far more than the bundle delta.

**Helis state**: Eager — every player gets the full 50–70-widget HUD built on join via `ensureHudForPlayer`. Same for the Ready Dialog (`createTeamSwitchUI` builds the whole modal even if the player never opens it).

**Effort to port**: **Large.** Conquest's lazy-build framework is the single largest piece of infrastructure that exists in Conquest and not in Helis. Porting it without porting the supporting `forEachValidPlayer` / `tick-context` framework would be churn.

**Value at current Helis player counts (≤8)**: **Low.** Helis has never hit a heap ceiling like Conquest's 16-player crash (#109).

**Recommendation**: **Defer.** If Helis ever targets 16+ players, revisit. For now, the per-pid heap footprint (H1 mega-HUD = ~70 widgets × ≤8 players = ≤560 widgets) is well within budget.

→ See improvement plan item **D2** (deferred).

### 3.5 `forEachValidPlayer` helper

**What Conquest did**: [Conquest v1.217 #64](../../conquest/design_doc/conquest_issues_summary.md) — converted 23 `*ForAllPlayers` wrapper functions into calls to a single `forEachValidPlayer(callback)` helper. Combined with tick-context (3.2), this is the standard pattern in Conquest now.

**Helis state**: 30+ `*ForAllPlayers` functions across `hud.ts`, `ready-dialog.ts`, `overtime.ts`, each with the identical 7-line `mod.AllPlayers / CountOf / for / ValueInArray / IsPlayerValid / call` block.

**Effort to port**: Small. Define the helper; replace call sites mechanically.

**Value**: Code clarity. Modest perf impact unless paired with tick-context (3.2).

→ See improvement plan item **B2** (paired with tick-context).

### 3.6 `sinkAndDestroyVehicle` (sink + DealDamage)

**What Conquest did**: Conquest v1.262 + v1.265 + v1.285 — round-end vehicle cleanup moved from `UnspawnObject` to a 3-step "sink to y=-1000 → wait → DealDamage → wait → spawner re-init" pipeline. Fixed late-respawn races during round transitions.

**Helis state**: [src/round-flow.ts](../src/round-flow.ts) `scheduleRoundEndCleanup` uses synchronous `UnspawnObject` on all vehicles. Unknown if Helis hits the same race; no documented bug in `ImprovementsPunchlist`.

**Effort to port**: Medium. Touches the round-end cleanup pipeline.

**Value**: Unknown without playtest evidence. **Low priority** until/unless a round-transition vehicle bug is reported.

→ See improvement plan item **I3** (deferred until evidence).

### 3.7 Position-based spawner binding hardening

**What Conquest did**: Conquest's vehicle spawner has been hardened across 5+ waves with extensive "active-spawn token" + position fallback logic. The Helis spawner inherits the same shape but is missing some of the more recent guards (e.g., the "stalled-spawn-sequence releases `spawnSequenceInProgress`" hardening flagged in [src/vehicles.ts:280](../src/vehicles.ts#L280) "Consider hardening" comment).

**Effort to port**: Small. The Helis source already calls out the hardening sites as `Consider hardening:` comments.

**Value**: Medium. These are race conditions that would surface in higher player counts or rapid matchup changes.

→ See improvement plan item **B4**.

---

## 4. Patterns where Helis is simpler and should stay that way

Listed so the temptation to over-port is named explicitly.

| Pattern in Conquest | Why Helis doesn't need it |
|---|---|
| Combat HUD module (engage, tickets, flag-fill geometry) | Helis has no per-flag engagement HUD — the kills counter + overtime HUD are sufficient. |
| Tickets / bleed system | Helis is kills-based, not tickets-based. |
| Spawn-charge ticket economy | Same — no tickets to charge. |
| Multi-flag capture infrastructure | Helis has one overtime zone, not 5–6 simultaneous captures. |
| Gadget locker (4 classes × multi-item probe-and-replace) | Helis equips 2× Deployable Vehicle Supply Crate on every deploy; no class selection. |
| Forward Deploy / Air Deploy / HQ Deploy methods | Helis is base-only by design. |
| Boundary enforcement subsystem ([boundary/enforcement.ts](../../conquest/src/boundary/enforcement.ts)) + GCZ/OOB classifier | Helis uses aircraft-ceiling enforcement instead; ground OOB is not a Helis design concern. |
| Spectator subsystem + Cameras.Fixed swap | Helis has no dedicated spectator role. |
| `FEATURE_PERF_DIAG` flag gating | Nothing in Helis is currently behind a perf-diag flag. |
| 40+ design-doc plans, waves, ships | Helis is too small to need that. The 4 docs in this PR + a few plan-mode artifacts going forward will suffice. |

---

## 5. Things in Helis that Conquest does NOT have (intentional Helis-only)

| Helis feature | Conquest equivalent? | Comment |
|---|---|---|
| Aircraft ceiling system (hard + soft) | None | Mode-specific to helicopter gameplay. |
| Vehicle-only kill scoring (infantry ignored) | None | Mode-specific. |
| Heli spawn auto-derivation from tank specs | None | `buildHeliSpawnsFromTankSpawns` in [src/strings.ts](../src/strings.ts) — useful pattern for map authoring. |
| Per-mode overtime zone letter override (`overtimeZoneLettersByMode: {tanks, helis}`) | None | Lets the same map serve both tank and heli modes with different active flag letters. |
| Triple-tap interact to summon team-switch InteractPoint | Different (Conquest uses dedicated buttons) | Helis-specific UX. |
| `MATCHUP_PRESETS` driving spawner slot count + kill target | Similar but slightly different shape | Both have it; Helis's is simpler. |
| Game-mode preset switching at runtime (Vanilla / Ladder / TWL 1v1 / Custom) | None | Helis-specific. |
| 9 maps × overtime zones authored in spatial data | Conquest is currently 1 active map (Operation Firestorm) | Helis has more map coverage. |

---

## 6. Cross-reference table

For each Conquest design-doc that informed this comparison, the column "Helis equivalent?" says whether the issue/pattern is relevant to Helis at all.

| Conquest doc | Topic | Helis equivalent / relevance |
|---|---|---|
| [conquest_design.md](../../conquest/design_doc/conquest_design.md) | Conquest requirements | N/A — Helis has its own design. |
| [conquest_issues_summary.md](../../conquest/design_doc/conquest_issues_summary.md) | 113 numbered issues with status | ~6 are directly applicable to Helis; see [heli_issues_design.md](./heli_issues_design.md). |
| [conquest_bans.md](../../conquest/design_doc/conquest_bans.md) | Weapon/gadget ban list for TWL | N/A — Helis is vehicle-only. |
| [conquest_optimization.md](../../conquest/design_doc/conquest_optimization.md) | Optimization roadmap | Patterns relevant to Helis (tick-context, dirty-flag, per-pid consolidation) covered in this doc and the improvement plan. |
| [conquest_optimization_analysis.md](../../conquest/design_doc/conquest_optimization_analysis.md) | M1–M15 per-pid heap analysis | Helis equivalent is H1–H10 in [heli_features.md](./heli_features.md) Section 7. |
| [conquest_optimization_state.md](../../conquest/design_doc/conquest_optimization_state.md) | Conquest file map + function inventory | Helis equivalent is [heli_features.md](./heli_features.md) Sections 3 + 4. |
| [conquest_mp_ongoing_tests.md](../../conquest/design_doc/conquest_mp_ongoing_tests.md) | MP playtest test inventory | Helis has no equivalent — Helis has not been MP-stress-tested. |
| [5.12.26_conquest_recurring_work_inventory.md](../../conquest/design_doc/5.12.26_conquest_recurring_work_inventory.md) | Per-tick work inventory | Helis equivalent: [heli_features.md](./heli_features.md) Section 8 (P1–P10). |
| [5.12.26_conquest_recurring_work_inventory_solutions.md](../../conquest/design_doc/5.12.26_conquest_recurring_work_inventory_solutions.md) | Solutions catalog | Selected items (A1, B1, G1, G2/G3, J1/J2) inform the Helis improvement plan. |
| [conquest/AGENTS.md](../../conquest/AGENTS.md) | Agent guardrails (bans, policies, protocols) | Major portions worth porting to Helis AGENTS.md draft — see the draft for what was selectively copied. |
| [conquest/CLAUDE.md](../../conquest/CLAUDE.md) | Project entry point for agents | Helis CLAUDE.md draft mirrors the shape. |
