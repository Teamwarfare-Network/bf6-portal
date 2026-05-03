# TWL Conquest Optimization Analysis

Last updated: v1.453 (2026-05-03) — v1.453 further tightened engage-status backplate height 18→14 (covers only visible glyph cap-height; 18px widget bounding box had ~4px of padding the backplate didn't need to back) and shifted Y +2 so top no longer touches the engage-track bar above. v1.452 had set width 98 (NEUTRALIZING fits with thin margin), height 18 (full text bounding box). v1.451 dropped team-name backplates entirely (looked weird in top-HUD spacing per SP feedback). Net +1 widget/pid in M3 vs pre-v1.449 (~92 → ~93) — only `engageStatusBox` remains. v1.449 originally shipped 3 backplates (team names + engage status) at +3 widgets/pid; v1.450 was first dimension polish; v1.451 reduced scope to engage-only. Reuses tickets-box visual style (Blur fill, dark color, 0.75 alpha). Recovers legibility lost when Wave 6 Ship 1c eliminated the 8-layer compass shadow rings. v1.447 + v1.448 shipped CQ_Bug_94 in two passes: v1.447 fixed the menu-OPEN path (per-class HasEquipment probes for Assault/Medic/Recon; +2,614 bundle bytes), v1.448 followed up to fix the menu-PLACEMENT path (dropped `isSlotEmpty` precheck from non-Engineer give helpers; was the remaining `GetInventoryAmmo` source; −362 bundle bytes). Combined: non-Engineer classes emit ZERO `GetInventoryAmmo` engine error log entries on either menu-open OR placement; Engineer untouched throughout. Heap-pressure contributor against #109 budget eliminated; no PPM impact. v1.445 shipped CQ_Bug_58 (ready-state auto-unready triggers locked at 2; deleted 3 lines + 1 function — no PPM impact, slight bundle shrink). v1.446 shipped CQ_Tweak_WAIT_Label (added 1 widget per timer row to M1 — see M1 row update below). Wave 6 Ship 0+1c+1d shipped at v1.443+v1.444 (combat HUD compass shadow rings eliminated, ~280 widgets/pid reclaim, ~75% of M3 cache). M1 + M3 rows + ladder Tier A entries updated below to reflect current state. Originally re-issued at v1.406 under a **runtime JS heap** lens after the 16-player MP playtest crashed at script load with `Mod has reached its js script memory usage limit. It has been terminated` (issue [#109](./conquest_issues.md#cq_bug_16player_playtest_js_memory_limit-109)). The reclaim ladder below ranks levers by **expected runtime memory reduction**, not by emitted bundle bytes.

Companion docs:
- [`conquest_optimization_state.md`](./conquest_optimization_state.md) — sister log file. File map (lines, bytes, per-player multipliers, in-bundle status) + per-file function inventory. The *facts*; this doc holds the *reasoning*.
- [`conquest_design.md`](./conquest_design.md) — locked design rules (architecture, UI contract, CF gameplay rules, vehicle patterns) + new-design space.
- [`conquest_issues.md`](./conquest_issues.md) — full issue bodies.
- [`conquest_issues_summary.md`](./conquest_issues_summary.md) — issue index.

---

## TL;DR (v1.406)

1. **Failure mode shifted.** The 1 MiB upload cap is no longer the binding constraint. Bundle is **872,014 bytes** at v1.406 (~17% headroom under the cap, after v1.397 whitespace strip + v1.398 block-comment strip + v1.399–v1.402 helper extraction reclaimed ~163 KB). The new constraint is the **Mod Evaluator runtime JS memory ceiling**, hit at 16 concurrent players. Memory-pressure work supersedes the prior bundle-byte-pressure work.
2. **No engine telemetry exists for the heap budget.** Verified against [`reference_sdk_1.2.3/code/types/mod/index.d.ts`](../../reference_sdk_1.2.3/code/types/mod/index.d.ts): no `mod.GetScriptMemory*`, `mod.GetHeapSize`, or comparable surface. The budget is observed only at termination. Reclaim has to be measured by **inference + cumulative reduction**, not by direct readings.
3. **Per-player multipliers dominate.** Module-level constants are paid once; per-player widget caches, view-model objects, and PID-keyed records pay N times. Fifteen of the largest known allocators scale with player count. The ladder targets those first.
4. **Functionality is locked.** The user's directive: no UI look change, no feature behavior change. Reclaim is restricted to (a) dead-code removal, (b) inlining of variables that exist purely for naming with no runtime dynamism, (c) helper extraction that *reduces* identifier count, (d) cache/state thinning where the field is write-only or holds a redundant duplicate.
5. **All design changes require user approval.** This document inventories candidates and ranks them. Any item the user does not pre-authorize stays in "proposed" status until they sign off.

**Playtest-blocking items:** [#109](./conquest_issues.md#cq_bug_16player_playtest_js_memory_limit-109).

---

## Why memory, not bytes (the regime change)

The previous baseline of this document was written when `dist/bundle.ts` sat 13–25 KB below the 1 MiB upload cap and every feature add risked failing the upload check in `scripts/verify.js`. v1.397's whitespace strip and v1.398's block-comment strip moved that cliff far enough away that the upload cap is no longer where the project hits a wall.

The 16-player playtest (v1.406) crashed differently: not at upload, but at script execution. The Mod Evaluator terminated the script while running with the message about JS memory limits. That distinguishes two budgets:

- **Upload byte cap** — `1,048,576` bytes against `dist/bundle.ts`. Enforced at submit time. Linear in bundle bytes, not in player count.
- **Runtime heap cap** — opaque, enforced at execution. Grows with both retained module-level state AND per-player allocations. Crosses the threshold at the player-count where the per-player factor compounds enough.

Bundle bytes correlate weakly with heap. A single 200-byte `Record<number, T>` declaration creates ~zero heap before any pids exist; once 16 players join and each one materializes the lazy entry, that record holds 16 pid keys × N fields × heap-aligned object overhead. The byte-count pass missed this entirely.

This is why reclaim that previously felt minor (-700 bytes) is suddenly load-bearing if it's *per-player*: removing 11 dead `VehicleSpawnerSlot` fields × 16 slots is 176 small allocations the engine doesn't have to track.

---

## Inventory of per-player multipliers

The following structures all scale with connected player count. Each row is a candidate target for the reclaim ladder.

**Ranking convention.** `M1` is the **worst** allocator — largest expected heap retention at 16 players. `M15` is the **least** impactful. The numeric ID *is* the rank. The `Scale` column is the comparable bucket so two allocators with the same scale are roughly equal in impact.

**Scale buckets** (per allocator, totaled across 16 players):

| Bucket | Approx. size | Meaning |
|--------|--------------|---------|
| **XL** | >1,500 widget refs / objects retained | Dominant heap contributor at 16p |
| **L** | 200–1,500 retained | Heavy multiplier; first-tier reclaim target |
| **M** | 50–200 retained | Material at scale; plausible reclaim target |
| **S** | 10–50 retained | Small but still per-pid |
| **XS** | <10 retained, OR feature-flagged off currently | Negligible at present player counts |
| **Churn** | Per-tick allocations, GC pressure | Not retained but produces heap churn that the runtime tracks |
| **Variable** | Hard to estimate statically | Closure capture, depends on scope |

The IDs are referenced from the `PPM` column of the file map in [`conquest_optimization_state.md`](./conquest_optimization_state.md) — change one, update both.

| Rank ID | Scale | Allocator | Source | Per-player heap (est.) | Total at 16 players | Notes |
|:-------:|:-----:|-----------|--------|-----------------------|---------------------|-------|
| **M1** | **XL** | `State.hudCache.vehicleDeployTimerCache[pid]` | [state/hud-cache-types.ts:104](../src/state/hud-cache-types.ts#L104) | 1 root + close-button (4 widgets) + N rows × ~25 widget refs. With ~6–10 typical rows: **~150–250 widget refs**. **v1.446: +1 widget per row (`barText` for the WAIT label) → ~156–260 widget refs/pid; ~+10–16 widget refs/pid net.** | **~2,496–4,160 widget refs** at 16p (was ~2,400–4,000 pre-v1.446) | `VehicleDeployTimerRowCacheEntry` per row carries `lastShowSpawnButton`, `lastShowGroundButton`, `lastSpawnButtonVisualState`, etc. — diff-cache fields that are flag-state mirrors, not authoritative state. v1.446 added `barText` widget on every reusable timer instance via `buildReusableTimerBarText` — small per-row cost, enabled the "WAIT" label UX. |
| **M2** | **XL** | `State.hudCache.ammoResupplyMenuCache[pid]` | [state/hud-cache-types.ts:188](../src/state/hud-cache-types.ts#L188) | Header cluster + `a`/`x`/`q`/`rows`/`m`/`e` arrays of `AmmoResupplyMenuChargeCacheEntry` (each ~12 widget refs) + per-class slot-toggle row × 4 classes. **~100–180 widget refs** | **~1,600–2,900 refs** | Wave 3 Ship 3 (v1.411): built first-interact-only via `triggerLazyBuild('supplyBox', pid)` in `openArmMenu`. Ship 3.5 (v1.412) adds an opportunistic 2s/pid LIVE-phase warm stagger; pids that never visit the crate never build. |
| **M3** | **L** | Combat HUD entry graph (`twlConquestHudEnsurePlayerGraph`) | [ui/conquest/hud-core/build.ts:198](../src/ui/conquest/hud-core/build.ts#L198) | **Post-v1.451:** ~93 widgets/pid (Wave 6 Ship 1c brought it to ~92; v1.449 added +3 backplates; v1.451 removed 2 of those — net +1 vs pre-v1.449). Tickets (4) + tickets bg (2) + team labels (2) + objective slots (7 × 5 base widgets, no shadow rings) + chevrons (14 base, no shadow rings) + popout panel (~6) + engage panel (~7) + **engage-status backplate (1 — NEW v1.449, retained v1.451)** + crown shadows (2 image widgets, NOT in ring system) + containers/frames (~16) + 7 view-model snapshots. | **~1,488 refs** at 16p (was ~1,472 pre-v1.449; was ~5,952 pre-Wave-6). | Wave 6 Ship 1c (v1.443) eliminated the 8-layer compass shadow rings via empty-profile in `twlConquestHudBuildShadowRingProfile`. Crown image shadows (2 widgets/pid) preserved; chevron icon widgets preserved. Wave 6 chevron-color polish (v1.444) inverts left/right chevron colors for contrast post-shadow-removal. **v1.449 (HUD backplates)**: +3 widgets/pid (`ticketBlueTeamNameBox`, `ticketRedTeamNameBox`, `engageStatusBox`). **v1.450**: dimension polish (team-name height matches tickets; engage box switched to dedicated tight constants). **v1.451**: team-name backplates removed entirely (looked weird in top HUD spacing per SP feedback) — only `engageStatusBox` remains. Engage box width tightened 110→90. **Re-ranking note:** post-v1.451 M3 (~1,488) still slots between M2 (~1,600-2,900, latent) and M4 (~912). Once M2 settles to its lazy-built steady state, M3 may genuinely be the smallest L-tier allocator. Re-confirm with MP playtest signal. |
| **M4** | **L** | `State.hudCache.topHudShellByPid[pid]` ([TopHudShellRefs](../src/state/hud-cache-types.ts#L3)) | [state/hud-cache-types.ts:3](../src/state/hud-cache-types.ts#L3) | ~25 named widget refs + `victoryLeftRosterText`/`victoryRightRosterText` arrays (sized to roster len) + `roots` array | ~400 base + 16 × 16 × 2 = **~912 refs at full lobby** | The two roster arrays alone are 512 widget refs at full lobby |
| **M5** | **M** | `State.hudCache.clockWidgetCache[pid]` + `countdownWidgetCache[pid]` | [foundation/ui-layout.ts](../src/foundation/ui-layout.ts) drives schema | `ReusableTimerWidgetCacheEntry`-shaped, ~14 widget refs + 3 diff cache fields × 2 caches | **~480 refs** (~30 × 16) | Two parallel caches per pid for the same MM:SS shape — consolidation candidate |
| **M6** | **M** | `State.hudCache.boundaryPromptCache[pid]` | [state/hud-cache-types.ts:127](../src/state/hud-cache-types.ts#L127) | 12 widget refs + 12 matched name strings + 3 `last*` diff-cache fields | **~432 entries** (~27 × 16) | Each entry stores both `rootName`/`panelName`/`*Name` strings AND the resolved `mod.UIWidget` ref — duplicate state |
| **M7** | **M** | 11 PID-keyed records in `State.players.*` (`deployedByPid`, `deployedAtSecondsByPid`, `disconnectedByPid`, `uiInputEnabledByPid`, `liveVehicleDeployMenuVisibleByPid`, `posDebugTransformSourceByPid`, `posDebugVehicleObjIdByPid`, `inMainBaseByPid`, `readyByPid`, `readyNeedsReconfirmByPid`, `readyMessageCooldownByPid`) | [state/runtime-types.ts:380-465](../src/state/runtime-types.ts#L380) | 11 PID-keyed records | **~176 entries** (11 × 16) | Was 12 pre-v1.418; `warmPrimeActiveByPid` deleted in Wave 3 Ship 8. `posDebug*` records are unused when `FEATURE_POSITION_DEBUG = false`; their type lives even though writes are stripped |
| **M8** | **M** | `State.players.worldInteractableIconByPidByObjId[pid]` | [state/runtime-types.ts:387](../src/state/runtime-types.ts#L387) | Per-pid `Record<number, any>` of WorldIcon refs (one per active interactable) | **~128 icon refs** (~8 × 16) | Keep — load-bearing per-player visibility |
| **M9** | **S** | 7 PID-keyed records in `State.conquest.debug.*` (`hudGenerationByPid`, `combatHudGenerationByPid`, `teamSwapRefreshTokenByPid`, `teamSwapHudResetPendingByPid`, `perspectiveTeamByPid`, `teamSwapPerspectiveLockUntilByPid`, `engageHiddenUntilDeployByPid`) | [state/runtime-types.ts:270-276](../src/state/runtime-types.ts#L270) | 7 PID-keyed records, mostly numeric scalars | **~112 entries** (7 × 16) | Several may be consolidatable into one struct per pid (`hudPerPid[pid]`) |
| **M10** | **S** | `State.players.armS[pid]` / `armG[pid]` / `armL[pid]` / `armO[pid]` / `armI[pid]` / `armT[pid]` / `armFocusedTileKeyByPid[pid]` | [state/runtime-types.ts:387](../src/state/runtime-types.ts#L387) | 7 small per-pid structs for the resupply menu | **~112 small allocs** (7 × 16) | Fragmented; consolidating to one `armState[pid]` reduces alloc count by 6× |
| **M11** | **Churn** | `State.conquest.debug.hud{Status,HelpReady,Clock}VmByPid[pid]` | [state/runtime-types.ts:277-291](../src/state/runtime-types.ts#L277) | Three view-model objects per pid; rebuilt every dirty tick | **~48 short-lived allocs per dirty render** (3 × 16) | Each tick spawns new VM objects without reusing the prior ones — heap churn driver, not retention |
| **M12** | **S** | `State.players.kpiByPid[pid]` | [state/runtime-types.ts:470](../src/state/runtime-types.ts#L470) | 7-field score object | **~112 numeric fields** (7 × 16) | Live state — keep |
| **M13** | **XS** | `State.players.uiCachePerfByPid[pid]` | [state/runtime-types.ts:440](../src/state/runtime-types.ts#L440) | 3 sub-objects (`vehicle`/`ready`/`gadget`) × 4 numeric counters each | **0 currently** (only populated when `FEATURE_PERF_DIAG = true`); ~192 fields when on | Currently dead at runtime — type+init still live; Tier A5 strips |
| **M14** | **XS** | `State.players.lockerSlots[pid]` + `lockerSlotToggle[pid]` | [state/runtime-types.ts:414](../src/state/runtime-types.ts#L414) | `{ g1, g2, initializedAt }` + `{ slotByClass: [1,1,1,1] }` | **~32 entries** (2 × 16) | Drops on menu close per design (correct) — keep |
| **M15** | **Variable** | Closures retained by `Timers.setTimeout` / `mod.Wait` continuations | scattered across `actions.ts`, `vanilla-spawner.ts`, `hq-deploy.ts`, `ammo-resupply-menu.ts`, `deploy-timer-ui.ts` | Each pending continuation captures its enclosing function scope; material at scale | Variable; **a deploy-timer 1 Hz loop per visible viewer × 16 players × N slots is tens of pending continuations** | Hard to inventory statically; needs per-site audit for closure-captured locals that could be passed as arguments instead |

**Reading the table:** if the 16-player crash is dominated by retained heap, focus reclaim on **M1–M4** first (XL+L). If it's dominated by churn or GC pressure, **M11** matters more than its position suggests. If it's dominated by closure pinning, **M15** is the wildcard. The 16-player playtest can't distinguish these without telemetry the SDK doesn't expose, so the ladder ships top-down.

---

## Inventory of one-time (non-per-player) overhead

These are paid once but are still resident heap that the runtime tracks:

| # | Source | Quantity | Reclaim feasibility |
|---|--------|----------|---------------------|
| O1 | Module-level `const` declarations in bundle | **3,231** | High — many are layout constants whose value is set once and never reassigned. They could be *inlined* at use sites, removing the binding from the heap. |
| O2 | Module-level `let` declarations in bundle | **171** | Mixed — some are real mutable singletons (`ACTIVE_GADGET_CONFIG`, `suppressReadyDialogModeAutoSwitch`); others may be inlinable |
| O3 | `bundle.strings.json` keys | 22,082 bytes resident | Medium — ~8.8 KB are dead (Cat 8 below). Strings live separately from script heap but still occupy runtime memory |
| O4 | `enum`s (`TeamID`, `MatchPhase`, lifecycle phases) | 5–10 enum tables | Low — enums are small and structurally needed |
| O5 | Compile-time-stripped feature code (`FEATURE_PERF_DIAG`, `FEATURE_ADMIN_PANEL`, `FEATURE_POSITION_DEBUG`, `FEATURE_JOIN_PROMPT` all false) | None at runtime — verified via `prebuild.js` + `postbuild.js` strip | N/A — already gone |

---

## The reclaim ladder (ranked by player-count multiplier)

Each tier estimates **runtime heap reduction** and **expected effort**. The user must approve each before any code change. These are documentation entries until then.

### Tier A — Per-player widget cache thinning (HIGHEST ROI per player)

| # | Lever | Target file(s) | Mechanism | Heap impact (16p) | Bundle impact | Risk | Approval status |
|---|-------|----------------|-----------|-------------------|---------------|------|-----------------|
| A1 | Remove 11 write-only `VehicleSpawnerSlot` fields (Cat 7 carry-over; not a per-pid `Mn` — slot-keyed not pid-keyed) | [state/runtime-types.ts:15-32](../src/state/runtime-types.ts#L15), [vehicles/vanilla-spawner.ts:233-250](../src/vehicles/vanilla-spawner.ts#L233) | Drop fields whose reads = 0 across `src/`. Keep `vehicleId`, `*Pos`/`*Rot`, `pendingSpawnMode`, `respawnClock` (verified read). | 11 fields × 16 vehicle slots = **176 fewer field allocations** + ~700 bundle bytes | −700 bytes | **Zero** — reads = 0 verified | Pending |
| A2 | Drop diff-cache `last*` mirror fields where the source is already authoritative (targets **M1**, **M5**, **M6**) | `VehicleDeployTimerRowCacheEntry` (`lastShowPlayerName`, `lastShowSpawnButton`, `lastShowGroundButton`, `lastSpawnButtonVisualState`, `lastGroundButtonVisualState`, `lastVisibleState`, `lastPlayerNameVisible`, `lastSpawnButtonVisible`, `lastGroundButtonVisible`); `BoundaryPromptWidgetCacheEntry` (`lastVisibleState`, `lastKind`, `lastRemainingSeconds`); `VehicleDeployTimerHudCacheEntry` (`lastVisibleState`, `lastRenderSignature`, `lastCloseButtonVisualState`, `lastLiveTerminalChromeVisible`, `lastCloseButtonVisible`) | Replace each `if (cache.lastX !== newX)` check with one of: (a) shared `lastRenderSignature` string check, (b) write-through where engine accepts redundant writes cheaply, (c) read-back from widget if API allows | Hard to estimate — at minimum **~10–15 numeric/string fields × N rows × 16 pids**, possibly hundreds | −300–600 bytes | **Medium** — diff caches were added to suppress redundant `mod.SetUI*` calls; some are perf-load-bearing. Each removal needs profiling justification | **Needs user discussion** — the user explicitly mentioned UI variables existing without runtime dynamism. These are the most likely targets but each removal needs to be benchmarked for engine-call overhead it re-introduces |
| A3 | Consolidate `armG`/`armL`/`armS`/`armO`/`armI`/`armT`/`armFocusedTileKeyByPid` into one `armState[pid]` (targets **M10**) | [state/runtime-state.ts:213-220](../src/state/runtime-state.ts#L213), [interaction/ammo-resupply-menu.ts:187-258](../src/interaction/ammo-resupply-menu.ts#L187) | One per-pid object instead of seven; same fields under one parent | Saves 6 × 16 = **96 small allocations** + 6 record headers. Same field count overall but one parent allocation per pid instead of 7 | Slight increase (+200 bytes for the type + accessor refactor) | Low — mechanical refactor | Pending |
| A4 | Strip `posDebugTransformSourceByPid` + `posDebugVehicleObjIdByPid` from production bundle (subset of **M7**) | [state/runtime-types.ts:468-469](../src/state/runtime-types.ts#L468) | Both unused when `FEATURE_POSITION_DEBUG = false` (current). Type and init still live | 2 records × 16 = **32 entries** at lobby fill | −small | Zero — gated feature is off, has been for 80+ versions | Pending |
| A5 | Drop `uiCachePerfByPid` from production scope when `FEATURE_PERF_DIAG = false` (targets **M13**) | [state/runtime-types.ts:440-459](../src/state/runtime-types.ts#L440), [state/runtime-state.ts:223](../src/state/runtime-state.ts#L223) | Same shape: type + init resident but never written | 1 record × 12 fields × 16 = **192 fields** when populated | −small | Zero — the `mod.AllPlayers` perf counter increment sites are already feature-flag-gated and stripped | Pending |
| **A6** | **Plug `ammoResupplyMenuCache[pid]` leak on player disconnect (Lifecycle Map finding — targets M2)** | [index/player-join-leave.ts:138](../src/index/player-join-leave.ts#L138) | `destroyArmMenu(pid)` added after `resetArmState(pid)` in `onPlayerLeaveGameImpl`. | Per leak: 100–180 widget refs. Cumulative: was unbounded. | ~0 (one extra function call) | **Zero** | **Resolved (v1.407, pending MP confirm — see [`conquest_mp_ongoing_tests.md`](./conquest_mp_ongoing_tests.md) Wave 1)** |
| **A7** | **Plug `hqDeploy.lastRequestAtSecondsByPid` leak on player disconnect (Lifecycle Map finding)** | [state/runtime-types.ts:494](../src/state/runtime-types.ts#L494), [index/player-join-leave.ts:158](../src/index/player-join-leave.ts#L158) | `delete State.hqDeploy.lastRequestAtSecondsByPid[pid];` added in `onPlayerLeaveGameImpl`'s per-pid delete cluster. | Per leak: 1 number per pid. Cumulative: was unbounded. | ~0 | **Zero** | **Resolved (v1.407, pending MP confirm — see [`conquest_mp_ongoing_tests.md`](./conquest_mp_ongoing_tests.md) Wave 1)** |
| **A8** | **Eliminate combat HUD 8-layer compass shadow rings (targets M3) — Wave 6 Ship 1c** | [ui/conquest/hud-core/constants.ts:256](../src/ui/conquest/hud-core/constants.ts#L256) (single-source change), cascading through [build.ts](../src/ui/conquest/hud-core/build.ts), [render.ts](../src/ui/conquest/hud-core/render.ts), [lifecycle.ts](../src/ui/conquest/hud-core/lifecycle.ts) | `twlConquestHudBuildShadowRingProfile` returns `[]`; every `Ensure`/`Render`/`Hide`/`Delete` consumer iterates the profile so empty-profile cascades to zero work without touching call sites. | **~280 widgets/pid reclaimed (~75% of M3 cache)**. Combat HUD widget count drops from ~372 to ~92/pid. At 16p: ~4,480 widget refs reclaimed. | −566 bytes (v1.442 → v1.443) | **Low** — visual regression on bright maps (text loses dark halo). Mitigation: chevron color inversion (v1.444) restores contrast on the most-affected surface; per-surface single-offset shadow restore from [`reference_implementations/reference_conquest_attempt_d/`](../reference_implementations/reference_conquest_attempt_d/) is the rollback path. | **SHIPPED v1.443; MP playtest validation pending — see [`conquest_mp_ongoing_tests.md`](./conquest_mp_ongoing_tests.md) Wave 6** |
| **A9** | **`maxPasses` 128/64 → 4 in pid-namespaced `safeFind` retry loops — Wave 6 Ship 0** | [ui/conquest/hud-core/lifecycle.ts:4](../src/ui/conquest/hud-core/lifecycle.ts#L4) (DOMINANT contributor — ~5,120 ops on disconnect pre-Wave-6), [index/player-join-leave.ts:19,39](../src/index/player-join-leave.ts#L19), [clock/timer-instance.ts:67](../src/clock/timer-instance.ts#L67) | Pid-namespaced widget IDs via `wn()` only produce duplicates if a prior cleanup was interrupted mid-loop. 4 passes is 4× tolerance for that edge case while cutting ~95% of `safeFind` ops on the dominant common path. | **No heap reclaim** (CPU-only). ~70% of disconnect-spike CPU reclaim. | ~0 | **Zero** — orphans are visibly observable; bump to 8 if SP/MP surfaces them. | **SHIPPED v1.443; MP playtest validation pending** |
| **A10** | **Stagger 3 join lazy-build triggers across 3 frames — Wave 6 Ship 1d** | [index/player-join-leave.ts:121-130](../src/index/player-join-leave.ts#L121) | `topHudShell` immediate, `vehicleDeployTimer` at `Timers.setTimeout(50ms)`, `combatHud` at `Timers.setTimeout(150ms)`. Distributes join cost across 3 frames at zero perceived UX cost (combat HUD not visible until first OnPlayerDeployed). | **No heap reclaim** (CPU-only — distributes the join hitch). | ~0 | **Low** — pid-validity race during deferred window mitigated by existing `triggerLazyBuild` guard at [lazy-build-registry.ts:236-237](../src/interaction/lazy-build-registry.ts#L236). | **SHIPPED v1.443; MP playtest validation pending** |

### Tier B — Module-level constant inlining (one-time but cumulatively large)

| # | Lever | Target | Mechanism | Heap impact | Bundle impact | Risk | Approval status |
|---|-------|--------|-----------|-----------|---------------|------|-----------------|
| B1 | Inline non-tunable layout constants — single-use UI pixel offsets that are never recomputed | `foundation/ui-layout.ts` (~308 const), `ui/conquest/hud-core/constants.ts` (~158 const), `interaction/ammo-resupply-menu.ts` (~67 const) | For each constant: if used at exactly one call site AND value never changes AND it's not a "tuning knob" name, inline the value at the call site. **Keep** any constant that (a) is used in 2+ places, (b) is named something a future maintainer would tune, or (c) represents a semantic meaning (`LOW_TIME_THRESHOLD_SECONDS`) | Removes module-level binding from each — at scale, hundreds of binding entries | Bundle bytes neutral or slightly + (loses the const name, gains the literal copy at each site) | **Medium-High** — inlining can hurt readability. Must keep "tuning intent" constants | **Critical user-discussion item** — user said: "A variable should exist because it needs to be modifiable due to some dynamic run time event, or some forward facing variable for tuning. Examples of this include accounting for a resolution change, or a movement in space." This tier directly applies. **Recommendation:** run a per-file pass and present a ~50-line "candidate for inlining" diff before any change |
| B2 | Collapse adjacent shadow-color triplets — `*_RGB: [number, number, number]` arrays + `mod.CreateVector(...)` derivatives | `foundation/ui-layout.ts` (~30 such pairs), `ui/conquest/hud-core/constants.ts` (similar) | Where both the `_RGB` tuple AND the `mod.CreateVector(...)` derivative are kept, drop whichever isn't read. Many sites only consume the `mod.CreateVector` form | Removes 30+ array literals × small | −small | Low — read-pattern audit suffices | Pending |
| B3 | Single-letter alias-of-alias (e.g. `const AX = -264; const EX = -88;` in [ammo-resupply-menu.ts:11-14](../src/interaction/ammo-resupply-menu.ts#L11)) | Various mega-files | Where a single-letter local already exists for the same value as a longer-named export, keep one | Removes duplicate bindings | −small | Low | Pending |

### Tier C — Dead code (confirmed-zero readers)

| # | Lever | Target | Mechanism | Heap impact | Bundle impact | Risk | Approval status |
|---|-------|--------|-----------|-----------|---------------|------|-----------------|
| C1 | Strings.json: 28 dead `joinPrompt.*` keys | `src/strings.json` | Delete keys; `FEATURE_JOIN_PROMPT = false` strips TS code but not strings — Cat 8.1 carry-over | ~5.2 KB strings.json reduction + matching runtime lookup table shrink | 0 (different cap) | Zero (gated feature off) | **User approval required** (string change policy in [AGENTS.md:75](../AGENTS.md#string-change-authorization-policy)) |
| C2 | Strings.json: ~30 other dead keys (Cat 8.2–8.7 carry-over) | `src/strings.json` | Categorized in prior analysis: 7 unused map names, 5 UI cache, 8 unused team-name combos (verify dropdown first), 7 readyDialog labels, 10 boundary/debug strings, 4 misc UI | ~3.5 KB strings.json reduction | 0 | Low (Cat 8.4 needs UI verification) | **User approval required** |
| C3 | Module-level `const` declarations whose values are referenced only inside their declaring file but never used | Suspected in `ui/conquest/hud-core/constants.ts` (158 consts; many may be retained from earlier HUD redesigns) | Per-file pass: for each const, grep for its name across `src/`. Zero hits = candidate for delete | Variable; needs per-file audit | Variable | Low (per-symbol grep verification) | Pending audit |
| C4 | `for...in` with `delete` in mega-files (Cat 5 item 1 carry-over) | Various | Each pass creates an iterator object. Replace with `for (const pid of Object.keys(record))` + filter pattern. (Already partially done; recheck remaining sites) | Iterator allocation reduction per call | 0 | Low | Pending |

### Tier D — Closure / continuation hygiene

| # | Lever | Target | Mechanism | Heap impact | Bundle impact | Risk | Approval status |
|---|-------|--------|-----------|-----------|---------------|------|-----------------|
| D1 | Audit `Timers.setTimeout` closure capture | Multiple files (`actions.ts`, `vanilla-spawner.ts`, `hq-deploy.ts`, etc.) | For each `Timers.setTimeout(() => {...})`, check what locals are captured. If the body needs only `pid`/`token`, bind those by extracting a named function and passing args explicitly. Captured locals like full `player` objects, large arrays, or VM snapshots can pin entire scopes | Variable; sites with heavy locals can release entire frames | −0 to small | Medium — refactor changes the readability of inline timer setup | Pending |
| D2 | `mod.Wait()` inside event handlers — same shape | gadget cooldown loops, supply-box warm scheduler, boundary live-prebuild scheduler | Same audit | Same shape | Same | Same | Pending (Wave 3 Ship 8 deleted the largest offender, `runLoadingGateUntilReady`) |
| D3 | Avoid `mod.AllPlayers()` materialization where iteration is short | `forEachValidPlayer` is the sanctioned wrapper. Verify all callers route through it | Already mostly done (`CQ_Refactor_forEachValidPlayer_Helper` #64) | Each `mod.AllPlayers()` allocates a Portal Array | 0 | Zero | Pending audit |

### Tier E — Opportunistic / readability (zero memory impact, zero functional change)

| # | Lever | Target | Notes |
|---|-------|--------|-------|
| E1 | Mega-file split — `capture-tickets.ts` (2,150 lines), `deploy-timer-ui.ts` (2,059 lines), `ammo-resupply-menu.ts` (2,769 lines) | 0 bundle, 0 heap. Pure readability/maintenance. Defer until reclaim ships. | |
| E2 | One-liner comment audit — replace multi-line block comments with single-line `//` per AGENTS.md "Function Comment Readability Policy". Postbuild strips full-line `//` cleanly (v1.397/v1.398). | 0 bundle (strip), positive readability | |
| E3 | Empty directory cleanup — `src/loaders/`, `src/team-switch/` are present but empty. Cosmetic. | 0 | |

### Tier F — Naming economy (modest memory, large code-clarity)

Identifier text is **66.3% of the bundle** at v1.406 — 577,898 of 872,014 bytes — across 4,991 unique identifiers and 51,626 occurrences. Average function name is **28.6 chars** (1,027 functions, 128,566 bundle bytes). See `conquest_optimization_state.md` "Naming Economy" section for the raw measurements and top-20 expensive identifiers.

**Why this is its own tier.** Renaming doesn't compress the per-PID multiplier (Tier A target), it doesn't strip dead code (Tier C), it doesn't change scope (no-go list). What it does:

- **Bundle bytes:** direct savings, 4KB to 180KB depending on aggression level. Bundle has 176KB headroom currently, so this is *relief, not blocking*.
- **Runtime heap:** identifier strings get interned by the JS runtime. Savings is roughly `unique_name_count × avg_shorten` (paid once per unique name, not per call). Modest — likely 5–20KB heap relief depending on policy.
- **Code review hygiene:** large. Long phase-prefixed names hurt comprehension and pull-request review; this is the actual win.

**Phase-prefix anti-pattern.** 114 unique symbols carry `conquestPhase[2A|2B|3|4|4B]*` prefixes. The prefixes describe *when* the function was written (Phase 2A capture work, Phase 2B spawn-charge, Phase 3 HUD derivation, Phase 4/4B sound/VO queues), not *what* it does. Examples:

| Current name | Intended meaning | Better |
|--------------|-----------------|--------|
| `markHudDirty` (16 calls × 26 chars = 416 bundle bytes) | "mark the HUD as dirty so the next render fires" | `markHudDirty` |
| `applyBleedTick` | "apply one bleed tick to ticket counts" | `applyBleedTick` |
| `syncMappedCapturePointsFromEngine` | "sync mapped capture points from engine state" | `syncMappedCapturePointsFromEngine` |
| `flushCaptureSoundQueue` | "flush the queued capture-tick sound events" | `flushCaptureSoundQueue` |
| `ensureObjectiveVoState` | "ensure VO state for objective exists" | `ensureObjectiveVoState` |

Note: `lifecyclePhase` and `ConquestLifecyclePhase` describe a runtime *state value* ("we are in PRE_MATCH phase right now"), not implementation work — those stay.

| # | Lever | Bundle saved (est.) | Heap saved (est.) | Effort | Risk |
|---|-------|--------------------:|------------------:|--------|------|
| F1 | Strip `conquestPhase[2A|2B|3|4|4B]` prefix from 104 functions, leaving the descriptive remainder. **Resolved (v1.408, pending MP confirm — Wave 2).** Nine collisions disambiguated via module-domain prefix: `spawnCharge*` (Phase 2B), `captureSound*` (Phase 4), `captureVo*` (Phase 4B). One state variable (`conquestPhase2ACaptureTimingConfiguredByObjId`) deliberately out of scope per plan. | **−3,738 bytes** (measured v1.407 → v1.408) | ~1–2 KB | Shipped in ~1 hour via scripted rename + typecheck verification. | **Zero — pure rename.** | **Resolved (v1.408)** |
| F2 | F1 + cap remaining function names at 24 chars where the shorter form stays self-explanatory (e.g. `updateConquestCombatHudForAllPlayers` (36c) → `renderCombatHud` (15c) since `*ForAllPlayers` is implied by the codebase pattern) | ~24,000 bytes | ~6–10 KB | **1–2 days.** Per-symbol judgment call; needs naming review per file. ~700 functions evaluated, maybe 200–400 actually renamed. | **Medium.** Some renames change cognitive shape of code; need pull-request review. |
| F3 | F1 + F2 + audit shared variable names in mega-files (e.g. `ammoResupplyMenuCache` could be `armCache`, already done in some places — make consistent) | ~50,000 bytes | ~12–20 KB | **2–3 days.** Per-file pass over the four mega-files + state types. | **Medium.** Touches widely-imported names; large diff. |
| F4 | Aggressive cap-everything-at-16-chars rewrite | ~122,000 bytes | ~25–40 KB | **1+ week.** Pervasive churn across every file. | **High.** Names lose meaning; review burden enormous; high regression risk. **Not recommended.** |

**Recommendation:** ship F1 first. It's the highest-confidence-per-effort lever — pure cleanup of an actual anti-pattern, low risk, ~4 hour pass, makes future PRs cleaner. F2 piggybacks on F1 only if naming review during F1 surfaces obvious wins. F3 is conditional on F2 producing clean diffs. F4 is documented for completeness but is **not advised** — names are how humans read code, and squeezing them past readability for ~120KB bundle relief that we don't need is a bad trade.

**Naming standard going forward** (informs new code and any rename pass):

1. **Name for what, not when or why.** `markHudDirty`, not `markHudDirty`. `flushCaptureSoundQueue`, not `flushCaptureSoundQueue`. The phase context belongs in the changelog and module-header comment, not in the identifier.
2. **Keep names human-readable and intuitive.** `armCache` is fine; `arSpb_lck_chx_x` isn't. Reasonable shorthand is OK when it's *project conventional* (`pid` for player ID, `vid` for vehicle ID, `obj` for object) but never invent new shorthand for one-off use.
3. **Drop suffixes implied by context.** `*ForAllPlayers` adds no information when every renderer in the file iterates all players. Drop it where the file's intent is unambiguous.
4. **Reserve long names for unambiguous semantics.** If a function does something *exactly* as named by `safeSetUITextLabel`, that's a fine 18-char name — it tells you precisely what it does without surprise.
5. **Type-state names stay explicit.** `lifecyclePhase`, `ConquestLifecyclePhase`, `ConquestFlagVisualPhase` — these describe runtime state, not implementation phases. Keep them.

---

## Justification rules (what counts as "necessary")

The user's bar: *"A variable should exist because it needs to be modifiable due to some dynamic run time event, or some forward facing variable for tuning. Examples of this include accounting for a resolution change, or a movement in space."*

Operationalized rules used to classify candidates above:

1. **Keep** if reassigned at runtime (`let` mutated by an event handler, or a `const` whose object body is mutated).
2. **Keep** if read at 2+ call sites with a meaningful name carrying tuning intent (e.g., `LOW_TIME_THRESHOLD_SECONDS`, `CONQUEST_BLEED_PER_DIFF_PER_SECOND`).
3. **Keep** if the value depends on a runtime input — resolution, spatial position, player count, map config.
4. **Keep** if the name documents a non-obvious magic number (semantic clarity).
5. **Inline** if the value is single-use, immutable, and the literal at the use site reads no worse than the named binding.
6. **Inline** if multiple constants are derivatives of one parent and the parent is the actual tunable (e.g. layout-derived offsets — keep parent, inline derivatives).
7. **Delete** if the symbol has zero readers anywhere in `src/`.

Applying these to `foundation/ui-layout.ts` as a sample: many `*_OFFSET_X`, `*_OFFSET_Y`, `*_PADDING` constants are used at exactly one site and never tuned in 200+ versions. Those are inline candidates. Color triplets and the explicit `LOW_TIME_THRESHOLD_SECONDS` are keepers — they are tuning knobs.

---

## Why per-PID UI is non-negotiable

The temptation when looking at the per-player multiplier table is to ask "what if we made it per-team?" — that would collapse 16 widget trees to 2 and solve the problem. **It can't be done.** Per-PID UI is locked in by two principles:

1. **Interactivity.** When a player hovers, focuses, or clicks a widget, the visual reaction is for that player only. Team- or globally-scoped widgets cause cross-player visual clashes — one player's hover state lights up the button for everyone, one player's focus indicator is everyone's. Gameplay UX breaks.
2. **Responsivity.** When a player connects (initial join, late join, team swap, reconnect), the UI state must be contextual to **them** — their team perspective coloring, their cooldowns, their button-enable state, their engage HUD, their boundary prompts. Without PID scope, a late-joiner inherits whatever stale shared state existed and can't get a contextual view of the match.

These two principles produce the architecture as observed: PID-suffixed widget names (`wn(name, pid)`), per-PID generation tokens for stale-ref invalidation (`combatHudGenerationByPid`), per-PID lazy-build dispatch with per-surface in-flight guards (`triggerLazyBuild(name, pid)` post-Wave-3), per-PID destroy-rebuild for recovery, per-PID-scoped HUD ownership added in `CQ_Bug_9` to fix cross-player clash. None of those are over-engineering — they fall out of the two principles above.

**The implication for memory reclaim:** the per-PID heap multiplier at 16 players is the **inherent cost of doing the UI right**, not waste. The reclaim plan must trim **inside** the per-PID model — drop dead fields, consolidate fragmented small allocations into single parents, remove diff-cache mirrors that the engine can absorb cheaply — not try to widen scope.

The one possible exception is the match clock (M5): it's purely passive, has no interactive elements, and its content is genuinely identical for all viewers. *Maybe* a candidate for global scope, but only if the late-joiner contextual-state path stays correct under team-swap and reconnect. Worth investigating but not assumed.

Everything else stays per-PID. Reclaim works within that constraint.

## Verified safe operations (explicit no-go list)

The reclaim pass must NOT:

- Change UI look (positions, colors, sizes, animations, render cadence visible to the player).
- Change feature behavior (every gameplay event continues to fire identically).
- Modify `src/strings.json` without explicit user approval per [AGENTS.md:75](../AGENTS.md#string-change-authorization-policy).
- Re-introduce `mod.AddUIIcon` (non-functional per [AGENTS.md:58](../AGENTS.md#mod.addUIIcon-is-non-functional)).
- Bypass the dirty-flag HUD contract ([AGENTS.md:139](../AGENTS.md#combat-hud-dirty-flag-contract)).
- Re-introduce pre-seat `mod.Teleport(player, ...)` ([memory: project_teleport_vehicle_spawn_mystery.md](../../../../.claude/projects/c--Users-Soldat-TypeScriptProjects-twlmain/memory/project_teleport_vehicle_spawn_mystery.md)).
- Touch the v1.259 vanilla-spawner architecture (single-persistent-spawner + spawnMutex).
- Skip `bumpVersion` when shipping a code change.
- Increase per-player allocations for any reason short of a user-approved feature add.
- **Convert any interactive or responsivity-dependent widget surface from per-PID to per-team or global scope.** See "Why per-PID UI is non-negotiable" above. The match clock is a possible narrow exception; everything else stays per-PID.

---

## Open questions for user (per `Don't delegate understanding` policy)

These are decisions that change the reclaim plan; flagging them so the user can answer before any code change.

1. **Inline-vs-keep policy for layout constants.** Tier B1 is the highest-ROI tier under the `O1` bucket but is also the most invasive. Options:
   - (a) Aggressive inline pass — strip every single-use, unmutated const; expect ~hundreds of binding removals, some readability cost.
   - (b) Conservative pass — keep all named constants, only delete confirmed-zero-reader entries.
   - (c) Hybrid — inline within mega-files (`ammo-resupply-menu.ts`, `deploy-timer-ui.ts`, `capture-tickets.ts`) only.

   **Recommendation pending user input.**

2. **Diff-cache fields (Tier A2) — are they perf-load-bearing?** Many `last*` fields on widget caches were added for engine-call de-duplication. If `mod.SetUITextLabel` (and friends) tolerate redundant writes cheaply, the diff caches are dead weight. If they don't, removing them re-introduces the per-render cost they were supposed to eliminate. **Suggested test:** flip one cache (e.g. `BoundaryPromptWidgetCacheEntry.lastVisibleState`) to no-op writes, profile the boundary-prompt redraw rate at 16p, decide based on data.

3. **`uiCachePerfByPid` (M13) — keep or strip?** When `FEATURE_PERF_DIAG = false`, this record's writers are stripped but the type and init code still live. Stripping fully would slightly reduce per-pid heap. Re-enabling `FEATURE_PERF_DIAG` later would need to add it back. Keep as-is, or strip in production?

4. **Strings.json dead-key cleanup (Tier C1, C2).** Player-facing string deletion needs explicit approval per AGENTS.md. Want a pre-edit diff? The cleanup is safe but the policy requires sign-off.

5. **Per-player consolidation (Tier A3).** The `armG/armL/armS/armO/armI/armT` set in `State.players.*` was clearly built incrementally. Consolidation is mechanical but touches ~30 read sites in `ammo-resupply-menu.ts`. Is it worth doing now, or batched with a future menu rewrite?

---

## Verification plan after reclaim ships

The 16-player playtest is the single source of truth. No engine telemetry exists for the heap budget.

1. Apply approved Tier A items first (highest ROI per player, lowest risk).
2. `npm run bumpVersion -- -c "<entry>"` and `npm run build`. Confirm bundle still under cap.
3. Run a 16-player playtest. **Pass criteria:** match starts to victory dialog without script termination.
4. If pass: continue with Tier B–E approved items, plus Tier F1 (phase-prefix strip) which is independent and low-risk.
5. If fail: capture termination time + connected pid count. Implement next-tier reclaim. Re-test.

The runtime budget is opaque, so progress is measured only by "does the script terminate?" — bisect by tier accordingly.

---

## Carry-forward notes (still accurate from prior analysis)

These items remain unchanged from the v1.390 baseline; collected here so the prior context stays accessible without re-reading the historical version.

- **Bundle vs strings — two separate caps.** `dist/bundle.ts` is governed by the 1,048,576-byte cap. `dist/bundle.strings.json` is **not** counted against that cap. `FEATURE_*` flags do NOT gate strings. Cleaning dead strings reduces runtime memory, not bundle pressure.
- **Match clock self-drives** via `Clocks.CountDownClock` since v1.337/v1.338. Not a hot path.
- **AreaTriggers require explicit `mod.EnableAreaTrigger(t, true)`** at game-mode start ([CQ_Feat_AreaTrigger_Enable, v1.367](./conquest_issues_summary.md)). Same lesson generalizes to other engine-object enables.
- **TickContext shares `mod.AllPlayers()` per subtick** ([CQ_Perf_TickContext_AllPlayers_Cache, v1.220](./conquest_issues_summary.md)). One open follow-up: `pipeline.ts:125` raw `mod.AllPlayers()` should consume the active TickContext.
- **Combat HUD dirty-flag contract** ([AGENTS.md](../AGENTS.md#combat-hud-dirty-flag-contract)) — every state mutation that affects HUD must call `markHudDirty()`.
- **Engine event reliability is asymmetric** — `OnPlayerEnterVehicle` has known gaps (CQ_Bug_43, #106 v1.383); `OnPlayerExitVehicle` is reliable.
- **`ForcePlayerToSeat` is only reliable inside `OnPlayerDeployed`** (Phase 6 HQ Deploy contract).
- **`SetObjectTransform` is no-op on `Vehicle`** — every post-bind vehicle placement is `mod.Teleport`.
- **`SetObjectTransform` on a persistent `VehicleSpawner` does not propagate at altitude** (v1.331 probe).

---

## File map for reclaim work

The reclaim ladder will touch (in approximate order):

- [state/runtime-types.ts](../src/state/runtime-types.ts) — Tier A1, A4, A5
- [state/runtime-state.ts](../src/state/runtime-state.ts) — Tier A1, A3, A4, A5 init parity
- [state/hud-cache-types.ts](../src/state/hud-cache-types.ts) — Tier A2 (after profiling decision)
- [vehicles/vanilla-spawner.ts](../src/vehicles/vanilla-spawner.ts) — Tier A1 init drop
- [interaction/ammo-resupply-menu.ts](../src/interaction/ammo-resupply-menu.ts) — Tier A3, B1 sample, B3
- [vehicles/deploy-timer-ui.ts](../src/vehicles/deploy-timer-ui.ts) — Tier A2 (largest target)
- [foundation/ui-layout.ts](../src/foundation/ui-layout.ts) — Tier B1
- [ui/conquest/hud-core/constants.ts](../src/ui/conquest/hud-core/constants.ts) — Tier B1
- [src/strings.json](../src/strings.json) — Tier C1, C2 (after approval)
- All `Timers.setTimeout` / `mod.Wait` sites — Tier D audit

Each file change needs the AGENTS.md "Change Log and Versioning Policy" workflow: `npm run bumpVersion -- -c "<entry>"` followed by `npm run build` and `cmd /c npx tsc --pretty false --noEmit`. Bundle-size line in handoff per AGENTS.md "Output Requirements".
