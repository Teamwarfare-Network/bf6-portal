# TWL Conquest Optimization State

Last updated: v1.454 (2026-05-03) — v1.454 vehicle deploy timer row spacing tightened: `ROW_HEIGHT` 30→22 + `ROW_GAP_Y` 2→1, dropping the per-row stride from 32px to 23px (~28% reduction; tightest possible without clipping the 20-tall spawn button). Visible gap between adjacent rows drops from ~12px to ~3px. v1.453 finalized engage-status backplate dimensions (98 wide × 14 tall, Y +2). v1.451 dropped team-name backplates. Net +1 widget/pid in M3 vs pre-v1.449 (~92 → ~93). v1.449 originally added 3 backplates; v1.450–v1.453 iteratively tightened/reduced. Recovers some of the legibility lost when Wave 6 Ship 1c eliminated the 8-layer compass shadow rings on those text widgets. CQ_Bug_94 supply-box engine-log noise SHIPPED at v1.447+v1.448. Wave 6 Ship 0+1c+1d SHIPPED at v1.443+v1.444; CQ_Bug_58 ready-state auto-unready tuning SHIPPED at v1.445; CQ_Tweak_WAIT_Label SHIPPED at v1.446. All MP playtest validation pending (see [`5.02.26_conquest_wave_6_plan.md`](./5.02.26_conquest_wave_6_plan.md), [`5.02.26_conquest_ready_tuning_plan.md`](./5.02.26_conquest_ready_tuning_plan.md), [`5.03.26_conquest_supplybox_medic_fix_plan.md`](./5.03.26_conquest_supplybox_medic_fix_plan.md), [`conquest_mp_ongoing_tests.md`](./conquest_mp_ongoing_tests.md)).
Sister doc to: [`conquest_optimization_analysis.md`](./conquest_optimization_analysis.md). The analysis doc contains the *reasoning* (reclaim ladder, regime change, justification rules); this doc contains the *facts* (file map + function inventory).

This is a per-file state log, ordered by path. It tracks four things:

1. **Inclusion** — which files actually ship in `dist/bundle.ts` (vs. which are excluded by feature flags or orphaned).
2. **Lines / Bytes** — raw source size measured at v1.406.
3. **Per-Player Multipliers (PPM)** — cross-reference to the `Mn` IDs in [`conquest_optimization_analysis.md`](./conquest_optimization_analysis.md). **`M1` is the worst-impact allocator at 16 players; `M15` is the least.** The numeric ID *is* the rank (sorted descending by expected retained heap). A file's PPM column lists which allocators it owns or contributes to.
4. **Functions** — top-level + exported callable surface, one-liner each.

The file is meant to grow with the optimization work. Each ship of a Tier A/B/C/D item should refresh the row's metrics and prune any function entries that have been removed.

---

## Compile-Time Feature Flags

Source: [`config/conquest-constants.ts`](../src/config/conquest-constants.ts).

| Flag | Current value | Files excluded when `false` | Bundle impact |
|------|---------------|----------------------------|--------------|
| `FEATURE_PERF_DIAG` | `false` (and **non-functional even when `true`**) | `hud/perf-diag.ts`, `hud/ui-cache-perf.ts` | ~8–10K source stripped |
| `FEATURE_ADMIN_PANEL` | `false` | `admin-panel/build.ts`, `admin-panel/events.ts`, `admin-panel/visibility.ts`, `ui/admin/action-counter.ts` | ~28K source stripped (per v1.334 measurement; stale) |
| `FEATURE_JOIN_PROMPT` | `false` | (3 stub files no longer present on disk) | ~0 |
| `FEATURE_POSITION_DEBUG` | `false` | `hud/position-debug.ts` | ~18K source stripped |

**Strip mechanism:** `prebuild.js` reads `// @feature FEATURE_*` markers above each `import` line in `index.ts` and comments out the import when the flag is `false`; `postbuild.js` then dead-strips `if (FEATURE_*)` blocks. Source files remain on disk but never reach `dist/bundle.ts`.

**Two limitations to remember:**

- `FEATURE_*` flags do **not** gate `strings.json` keys. Disabled features still bundle their player-facing strings.
- `FEATURE_*` flags do **not** gate per-pid runtime state shape. Field defs and lazy init in `runtime-types.ts` / `runtime-state.ts` still occupy heap once populated, even if the writers are stripped.

**Orphan modules (NOT in bundle, NOT feature-flagged either):**

- `hud/deploy-diagnostic.ts` (218 lines) — referenced only inside its own file via a no-longer-declared `FEATURE_DEPLOY_DIAGNOSTIC`. Not imported in `index.ts`.

---

## Project Stats (v1.454)

**v1.454 (2026-05-03) — Vehicle deploy timer row spacing tighten.** UI tuning pass: rows in the vehicle deploy timer HUD were visually too far apart (~12px of empty space between adjacent rows). Tightened the per-row stride by reducing both `VEHICLE_DEPLOY_TIMER_ROW_HEIGHT` (30→22) and `VEHICLE_DEPLOY_TIMER_ROW_GAP_Y` (2→1) in `foundation/ui-layout.ts`. Both constants are consumed only by `getVehicleDeployTimerRowBaseY()` in `vehicles/deploy-timer-ui.ts` (line 269) which computes each row's baseY via `CONTENT_HEIGHT - ROW_HEIGHT - ((ROW_HEIGHT + ROW_GAP_Y) * index)`. New stride = 22 + 1 = 23 (was 32). Visible gap between adjacent button bottoms drops from ~12px to ~3px. **Constraint:** ROW_HEIGHT bottoms out at the 20-tall spawn-button height + 2px slack (going lower would clip buttons). Bundle delta: 0 (constant value change only).

**v1.453 (2026-05-03) — Engage-status backplate dimension finalize v2.** SP feedback on v1.452: backplate top was touching the engage-track bar above (no visual separation), and there was still visible empty space inside the box below the rendered glyphs. Root cause: text widget at fontSize 18 has a bounding box of 18px tall but the actual rendered all-caps glyphs occupy only ~12-14px (font line-height padding). v1.453 backs only the visible glyph area:
- `ENGAGE_STATUS_BOX_HEIGHT = 18 → 14` — covers only the cap-height of the rendered glyphs.
- `ENGAGE_STATUS_BOX_Y = Y → Y + 2` — shifts box down 2px so its top sits below the engage-track bar.
- Width unchanged (98 — stable since v1.452).

Bundle delta: −31 bytes (869,755 → 869,724 — constant value + comment change).

**v1.452 (2026-05-03) — Engage-status backplate dimension finalize.** SP feedback on v1.451: NEUTRALIZING text was clipping at width 90, and the box still had visible vertical space above/below the text. **v1.452 fixes:**
- `ENGAGE_STATUS_BOX_WIDTH = 90 → 98` — NEUTRALIZING fits with a thin margin.
- `ENGAGE_STATUS_BOX_HEIGHT = 22 → 18` — exact text widget bounding-box height (later refined v1.453).
- `ENGAGE_STATUS_BOX_Y = (Y - 2) → Y` — no vertical offset since no padding (later refined v1.453).

Bundle delta: −8 bytes (869,763 → 869,755 — comment-only change in `constants.ts`).

**v1.451 (2026-05-03) — Conquest HUD backplates v3: scope-reduce + tighten.** SP-test feedback on v1.450:
- **Team-name backplates removed.** "The team names I'd actually like to remove the panels behind them now. They're not important and the spacing looks weird, and I don't want to make it dynamic to fit larger team names." Removed both blue + red team-name backplate construction (build.ts), cache assignments, render-pass visibility toggles, lifecycle hide entries, types.ts cache fields, and names.ts generators. The `TWL_CONQUEST_HUD_TEXT_BOX_PADDING` constant also became unused and was dropped.
- **Engage status backplate tightened from width 110 → 90** for a closer fit around the longest status string "NEUTRALIZING" per "It can still be shrunk more around the NEUTRALIZING TEXT" feedback. All other engage-status box dimensions (height 22, X centered at 31, Y 14) carry forward from v1.450.

Net widget count: M3 (combat HUD) drops back to ~93 widgets/pid (v1.450 was ~95). Bundle delta: −2,074 bytes (871,837 → 869,763 — 2 backplate construction blocks deleted).

**v1.450 (2026-05-03) — Conquest HUD backplates v2 polish.** Visual feedback on v1.449: team-name backplates were 8px taller than the tickets backplate beside them (vertical padding made them visually misaligned in the top HUD row); engage-status backplate was a wide bar that overlapped the chevron / ticket-diff area below the tickets row. **v1.450 fixes:**
- **Team-name backplates:** dropped vertical padding so height matches text height (28 = same as tickets backplate height). Horizontal padding (+4 each side) preserved for breathing room. Y position back to original team-label Y. Visual: now exactly the same height as the tickets backplate beside them.
- **Engage status backplate:** new dedicated dimension constants in `constants.ts` — `ENGAGE_STATUS_BOX_WIDTH = 110` (just barely fits "NEUTRALIZING" — the longest of the 4 status strings — at fontSize 18), `ENGAGE_STATUS_BOX_HEIGHT = 22` (text + 2px vertical pad each side), `ENGAGE_STATUS_BOX_X = 21` (centered in the 152-wide engage root), `ENGAGE_STATUS_BOX_Y = 14` (text Y - 2px). Visual: tight backplate that sits just behind the status text, no longer overlapping adjacent HUD elements.

Net widget count unchanged from v1.449 (still +3 widgets/pid in M3). Bundle delta v1.450: +111 bytes (871,726 → 871,837 — 4 new constants).

**v1.449 (2026-05-03) — Conquest HUD backplates: team names + engage status.** New `Container` widgets behind 3 text surfaces (`ticketBlueTeamName`, `ticketRedTeamName`, `engageStatus`). Reuses the existing tickets-box visual style — `mod.UIBgFill.Blur`, `bgColor = TWL_CONQUEST_HUD_COLOR_BOX_BG`, `bgAlpha = TWL_CONQUEST_HUD_TICKET_BOX_ALPHA = 0.75`. Built BEFORE the corresponding text widget for correct z-order. Visibility toggled in lockstep with the text widgets via `render.ts` (show path) + `lifecycle.ts` (hide paths — both `twlConquestHudHidePlayer` and `twlConquestHudHideObjectiveFocusForPid`). Recovers legibility lost when Wave 6 Ship 1c (v1.443) eliminated the 8-layer compass shadow rings — those 3 text widgets had no other dark-backdrop fallback. **Bundle delta: +3,337 bytes** (868,389 → 871,726). M3 (combat HUD) widget count: ~92 → ~95 widgets/pid.

**v1.447+v1.448 (2026-05-03) — CQ_Bug_94 supply-box engine-log noise fix (two-step).** Per [`5.03.26_conquest_supplybox_medic_fix_plan.md`](./5.03.26_conquest_supplybox_medic_fix_plan.md).

- **v1.447 (menu-open path):** per-class HasEquipment-based slot probes added for Assault/Medic/Recon (`probeAssaultSlot`, `probeMedicSlot`, `probeReconSlot`); small dispatcher `probeSlotForClass` routes by class. Engineer's `probeSlot` untouched ("works best it can" per user direction; launcher detection requires its destructive-probe semantics). Wired into `initLockerSlotStateFromProbe` (first-open) + `reprobeSiblingGadgetSlot` (placement-time sibling re-probe). **Bundle delta: +2,614 bytes** (866,137 → 868,751).
- **v1.448 (placement path follow-up):** SP-test of v1.447 surfaced "still triggers as a medic and as assault" — the placement path was still emitting engine log via `isSlotEmpty()` (which itself calls `GetInventoryAmmo` + `GetInventoryMagazineAmmo`). Dropped the `if (!isSlotEmpty(targetSlot)) { RemoveEquipment(targetSlot); }` precheck from `giveMedicSmoke`, `giveAssaultItem`, `giveReconItem`. AddEquipment cleanly clobbers the slot; users own slot choice via the slot-toggle UI; dup prevention via gray-out (HasEquipment) remains. Engineer's `giveLauncher` LEFT UNTOUCHED (launcher swap-in-place needs slot-targeted RemoveEquipment). **Bundle delta: −362 bytes** (868,751 → 868,389).

**Combined v1.447+v1.448 result:** non-Engineer classes (Medic, Assault, Recon) emit ZERO `GetInventoryAmmo`/`GetInventoryMagazineAmmo` engine error log entries on either menu-open OR placement. Engineer remains as before (cosmetic log noise on cold-spawn opens accepted as out of scope). Heap-pressure contributor against the same envelope Wave 6 just relieved (#109 family) eliminated. **Net bundle delta: +2,252 bytes** (866,137 → 868,389).

**Three earlier landings on 2026-05-02:**
- **v1.443+v1.444 — Wave 6 Ship 0+1c+1d + chevron color polish.** Bundled per [`5.02.26_conquest_wave_6_plan.md`](./5.02.26_conquest_wave_6_plan.md) v0.2 lock decisions L1-L8 + Wave 6 follow-up Q on chevron contrast.
- **v1.445 — `CQ_Bug_58` ready-state auto-unready tuning.** Per [`5.02.26_conquest_ready_tuning_plan.md`](./5.02.26_conquest_ready_tuning_plan.md). Removed deploy-event auto-unready (`player-deploy.ts:42-43`) + the `notePreliveMainBaseViolation` helper and both its callers (`enforcement.ts:330`, `area-triggers.ts:112`). Auto-unready triggers reduced to two: SWAP TEAMS + admin config change. **Bundle delta: −754 bytes** (865,958 → 865,204).
- **v1.446 — `CQ_Tweak_WAIT_Label`.** Vehicle deploy timer rows now show a "WAIT" label drawn on top of the red/gray progress bar (black text, centered, visible only in timer mode). New `barText` widget on `ReusableTimerWidgetCacheEntry`; new `twl.ui.wait` string key; new `buildReusableTimerBarText` helper inserted in the children array AFTER `buildReusableTimerBarFill` so it draws on top in z-order. Wired through purge/ensure/all three visibility setters (`setReusableTimerProgress`, `setReusableTimerStatus`, `setReusableTimerVisible`). **Bundle delta: +933 bytes script + 30 bytes strings** (script 865,204 → 866,137; strings 22,548 → 22,578). M1 cache (`vehicleDeployTimerCache`) grew by 1 widget per row × N rows × N pids; small per-pid heap impact noted in [`conquest_optimization_analysis.md`](./conquest_optimization_analysis.md) M1 row.

**Wave 6 Ship 0+1c+1d highlights (retained from prior version):** Three changes:
- **Ship 0** — `maxPasses` default reduced from 128 (or 64) to 4 in four `safeFind` retry loops: `twlConquestHudDeleteAllByName` ([lifecycle.ts:4](../src/ui/conquest/hud-core/lifecycle.ts#L4) — DOMINANT contributor, ~5,120 ops on disconnect), `cleanupHudForPid`'s local `deleteAllByName` ([player-join-leave.ts:39](../src/index/player-join-leave.ts#L39)), `resetUiForPlayerOnJoin`'s local `deleteAllByName` ([player-join-leave.ts:19](../src/index/player-join-leave.ts#L19)), and `deleteAllReusableTimerWidgetsByName` ([timer-instance.ts:67](../src/clock/timer-instance.ts#L67)). Pid-namespaced widget IDs via `wn()` only produce duplicates after an interrupted prior cleanup; 4 passes is 4× tolerance for that edge case while cutting ~95% of `safeFind` ops on the dominant common path. **No heap reclaim; ~70% of disconnect-spike CPU reclaim** (the dominant cost was the 128-pass loop, not the actual delete work).
- **Ship 1c** — `twlConquestHudBuildShadowRingProfile` ([constants.ts:256](../src/ui/conquest/hud-core/constants.ts#L256)) now returns `[]`, eliminating ALL 8-layer compass-direction shadow rings in the combat HUD via single-source change. Every `Ensure`/`Render`/`Hide`/`Delete` consumer iterates the profile, so empty-profile cascades to zero work without touching call sites. **~280 widgets/pid reclaim (~75% of M3 cache).** Combat HUD widget count drops from ~372 to ~92/pid. Both join build cost and disconnect destroy cost drop proportionally. Crown shadow image widgets (2 widgets/pid, single image type, outside the ring system) preserved — Wave 7 candidate. Original 8-layer profile preserved in [`reference_implementations/reference_conquest_attempt_d/src/ui/conquest/hud-core/constants.ts`](../reference_implementations/reference_conquest_attempt_d/src/ui/conquest/hud-core/constants.ts) for restoration if any surface needs single-offset shadow back.
- **Ship 1d** — staggered the 3 sync `triggerLazyBuild` calls in [`onPlayerJoinGameImpl`](../src/index/player-join-leave.ts#L121) across 3 frames: `topHudShell` immediate, `vehicleDeployTimer` at `Timers.setTimeout(50ms)`, `combatHud` at `Timers.setTimeout(150ms)`. R6 (pid-validity race) resolved by existing guard in `triggerLazyBuild` (lines 236-237 — `safeFindPlayer` + `isValidPlayer` short-circuit on disconnect during the deferred window).

**Net measured impact:** bundle bytes 866,524 → 865,958 (**−566 bytes**). Heap reclaim: ~280 widgets/pid in M3 (combat HUD) — likely moves M3 below M2 (supply box) in `conquest_optimization_analysis.md` heap-impact ranking; refresh that doc post-MP-test once impact is confirmed. Ship 2 (coalesced post-leave refresh) deferred per L5; revisit only if MP playtest still shows disconnect spike at 13-15p after this bundle.

| Metric | Value |
|--------|-------|
| Version | 1.454 |
| Source files (`.ts`) | 130 (incl. orphan / feature-flagged; `loading-overlay.ts` is a stub) |
| Source files in bundle | ~117 |
| `dist/bundle.ts` | **869,724 bytes** (v1.443 −566 Wave 6; v1.445 −754 CQ_Bug_58; v1.446 +933 WAIT label; v1.447 +2,614 CQ_Bug_94 menu-open; v1.448 −362 CQ_Bug_94 placement; v1.449 +3,337 HUD backplates; v1.450 +111 backplate polish; v1.451 −2,074 backplate scope-reduce; v1.452 −8 backplate dimension finalize; v1.453 −31 backplate dimension finalize v2; v1.454 0 row spacing tighten = net +3,766 vs v1.442). |
| `dist/bundle.strings.json` | 22,578 bytes (unchanged — no string changes in v1.447–v1.454) |
| Bundle upload limit | 1,048,576 bytes (1 MiB) |
| Bundle headroom | **178,852 bytes (17.06%)** |
| Total raw `src/` size | ~1,533,756 bytes (~1.5 MB) |
| Build pipeline | `prebuild.js` → `bf6-portal-bundler` → `postbuild.js` → `verify.js` |
| Entry point | `src/index.ts` (20 Portal event handler exports) |
| Empty reserved dirs | `src/loaders/`, `src/team-switch/` |
| **Binding constraint (v1.406)** | **Mod Evaluator JS heap at 16 concurrent players** ([#109](./conquest_issues.md#cq_bug_16player_playtest_js_memory_limit-109)) |

---

## File Map

Legend:
- **PPM** column: per-player multiplier IDs from [`conquest_optimization_analysis.md`](./conquest_optimization_analysis.md). **`M1` = worst-impact allocator, `M15` = least.** Lower number = bigger heap retention at 16 players. Empty = no per-pid heap allocator on the file's hot path. `M*/Mn owner` = file owns the type/init for that allocator. `M* indirect` = file reads or mutates it without owning the storage.
- **In bundle** column: `Y` = imported in `index.ts` and ships; `N (FEAT_X)` = stripped when feature flag is false; `N (orphan)` = on disk but unreachable; `N (strip)` = comment-only / version-only file emitted near-zero bytes.

| File | Lines | Bytes | In bundle | PPM | Notes |
|------|------:|------:|:---------:|:---:|-------|
| `Changelog.ts` | 1,072 | 174,698 | N (strip) | — | Version history; postbuild strips full-line `//` to ~0 bundle bytes. |
| `header-file.ts` | 71 | 4,121 | Y | — | Version line + license; postbuild re-injects only the version. |
| `footer-file.ts` | 2 | 74 | Y | — | EOF version marker. |
| `index.ts` | 241 | 9,663 | Y | — | Entry: imports + 20 Portal event handler exports. |
| `types.ts` | 8 | 247 | Y | — | Foundation type shim (re-exports from `foundation/`). |
| `conquest-flow.ts` | 175 | ~6,990 | Y | — | start/end match, clock binding, match length config. v1.412 (Ship 3.5): `startMatch` kicks off `SupplyBoxWarmScheduler.startWarmStaggerForLive()`; `endMatch` + `triggerFreshMatchSetup` cancel it. v1.415 (Ship 6): same three sites also call `BoundaryPromptLivePrebuildScheduler.startBoundaryPromptPrebuildForLive()` / `cancelBoundaryPromptPrebuild()`. |
| `strings.json` | (n/a) | ~22,112 | (separate) | — | Localized strings; not in script bundle but bundled separately. ~8.8KB dead keys (Cat 8). v1.446: added `twl.ui.wait` ("WAIT") under `twl.ui` for the new vehicle deploy timer bar label. |
| **admin/** | | | | | |
| `admin/identity.ts` | 104 | ~4,800 | Y | — | Wave 4 Ship 1 (v1.421); Ship 6 / v1.2 redesign (v1.431); v1.3 follow-up (v1.436): single-slot admin model with one-time auto-admin (first-ever-join exception) + NO subsequent auto-promotion. Module-level state: `_currentAdminPid: number \| undefined`, `_hostFirstPid: number \| undefined`, `_hostNameMessage: mod.Message \| undefined`. Public API: `onPlayerJoin(player, pid)` (first-ever-join branch sets host slot AND auto-assigns admin slot, gated on `_hostFirstPid === undefined` so it fires exactly once per server lifetime; subsequent joins are no-ops), `onPlayerLeave(pid)` (auto-vacates admin slot if leaver was admin + broadcasts via `refreshAllVisiblePlayerReadyPanels`), `isAdmin(pid)`, `getCurrentAdminPid()`, `isAdminVacant()`, `isHost(pid)`, `getHostFirstPid()`, `getHostNameMessage()`, `claimAdmin(pid)` (succeeds only if vacant), `giveUpAdmin(pid)` (succeeds only if pid is current admin). Wired into `onPlayerJoinGameImpl` + `onPlayerLeaveGameImpl`. v1.436: removed the unconditional `_currentAdminPid = pid` line that auto-promoted any joiner landing on a vacant slot; admin auto-assignment now lives inside the first-ever-join branch only. |
| **admin-panel/** | | | | | |
| `admin-panel/build.ts` | 348 | 11,464 | N (FEATURE_ADMIN_PANEL) | — | Admin panel widget construction. |
| `admin-panel/events.ts` | 229 | 8,896 | N (FEATURE_ADMIN_PANEL) | — | Admin panel button handlers. |
| `admin-panel/visibility.ts` | 172 | 6,878 | N (FEATURE_ADMIN_PANEL) | — | Admin panel show/hide/toggle. |
| **boundary/** | | | | | |
| `boundary/enforcement.ts` | 592 | 27,489 | Y | (per-pid `zoneStateByPid` + `activeViolationByPid` not in M ranking — small) | Per-second classifier reads `zoneStateByPid` + `seatKind`; dispatches violation timers. **v1.445 (CQ_Bug_58)**: deleted `notePreliveMainBaseViolation` function (13 lines) + its caller block in `refreshPlayerBoundaryState` (3 lines) — leaving the main base pre-live no longer auto-unreadies the player. |
| `boundary/prompt-ui.ts` | 477 | 19,160 | Y | **M6** | `BoundaryPromptWidgetCacheEntry` per pid — 12 widget refs + 12 name strings + 3 `last*` diff fields. |
| `boundary/live-prebuild-scheduler.ts` | 100 | 4,400 | Y | — | Wave 3 Ship 6 (v1.415): `BoundaryPromptLivePrebuildScheduler` namespace. At LIVE start, schedules 10 batches (1s spacing) of `ceil(N/10)` pids (cap 8) via `Timers.setTimeout`, each batch dispatching `triggerLazyBuild('boundaryPrompt', pid)`. Snapshot only — late joiners use existing first-violation fallback in `showBoundaryPromptForPlayer`. Token-based cancellation on `endMatch` / `triggerFreshMatchSetup`. |
| **clock/** | | | | | |
| `clock/state.ts` | 254 | 10,838 | Y | — | `Clocks.CountDownClock` driver; per-second tick + critical-flash gate. |
| `clock/timer-instance.ts` | 386 | 16,423 | Y | M5 family + M1 contributor | Reusable progress-bar widget builders shared by deploy-timer-ui (countdown caller migrated). v1.439 (Wave 5 Ship 1): replaced 5-digit MM:SS clock display with 10-step decile-chunk progress bar (`buildReusableTimerBarBorder` + `buildReusableTimerBarFill`); removed `setReusableTimerSeconds` + `setReusableTimerColor`; added `setReusableTimerProgress(cache, elapsedFraction)`. Net -8 widgets per timer instance + ~150 fewer lines of code. **v1.443 (Wave 6 Ship 0)**: `deleteAllReusableTimerWidgetsByName` `maxPasses` default dropped from 64 → 4. Common path is 1 pass; 4× tolerance for interrupted-prior-cleanup edge case. **v1.446 (CQ_Tweak_WAIT_Label)**: new `buildReusableTimerBarText` helper added; black "WAIT" text widget at the bar's coords (overlapping border + fill), centered, `cfg.fontSize - 2`, drawn last in z-order so it appears on top of the red fill. Wired into `purgeReusableTimerInstance` (cleanup), `ensureReusableTimerInstance` (cache resolve + validity check + post-parse find), and all three visibility setters (`setReusableTimerProgress`, `setReusableTimerStatus`, `setReusableTimerVisible`) so it shows in timer mode and hides alongside the bar in non-timer status modes. +1 widget per row across every M1/M5 timer instance. |
| `clock/ui.ts` | 325 | 14,152 | Y | **M5** | `clockWidgetCache[pid]` ~14 widget refs + 3 diff fields. |
| **config/** | | | | | |
| `config/conquest-constants.ts` | 65 | 3,087 | Y | — | Feature flags + gameplay tuning constants. |
| `config/map-runtime.ts` | 794 | 35,312 | Y | — | Map detection + spawn-spec rebuild + spawner relocation. Largest config file. |
| `config/maps.ts` | 15 | 423 | Y | — | Map registry loader. |
| `config/maps/operation-firestorm.ts` | 305 | 18,576 | Y | — | Firestorm vehicle slots, capture points, HQ smoke colors. Types/data only. |
| `config/runtime.ts` | 93 | 5,222 | Y | — | Active-map state + capture/interactable index lookups. |
| `config/types.ts` | 136 | 8,246 | Y | — | `MapConfig`, `CapturePointConfig`, `VehicleSpawnSpec` type defs. |
| **foundation/** | | | | | |
| `foundation/bf6-utils/callback-handler.ts` | 47 | 1,771 | Y | — | Portal callback dispatcher (types/constants only). |
| `foundation/bf6-utils/clocks.ts` | 276 | 9,218 | Y | — | `Clocks.CountDownClock` runtime. |
| `foundation/bf6-utils/logging.ts` | 97 | 3,313 | Y | — | Diagnostic log helpers (types/constants only). |
| `foundation/bf6-utils/timers.ts` | 101 | 3,039 | Y | — | `Timers.setTimeout` / `setInterval` wrappers. |
| `foundation/gameplay.ts` | 376 | 20,877 | Y | — | `TeamID`, `MatchPhase`, vehicle lists, presets, color tables. |
| `foundation/modlib.ts` | 13 | 638 | Y | — | Portal SDK import wrapper. |
| `foundation/string-keys.ts` | 115 | 8,507 | Y | — | `STR_*` const aliases for `mod.stringkeys.twl.*`. Hosts `msg()` helper (v1.399). |
| `foundation/ui-layout.ts` | ~360 | ~22,560 | Y | — | All HUD/dialog pixel constants. **Tier B1 inlining target** (~308 const). **v1.454**: `VEHICLE_DEPLOY_TIMER_ROW_HEIGHT` 30→22 + `VEHICLE_DEPLOY_TIMER_ROW_GAP_Y` 2→1 (row stride 32→23, ~28% tighter; visual: row gap ~12px → ~3px). |
| **hud/** | | | | | |
| `hud/conquest-scaffold.ts` | 9 | 306 | Y | — | Phase 1 HUD seam (no-op placeholder). |
| `hud/deploy-diagnostic.ts` | 218 | 10,334 | N (orphan) | — | Not imported in `index.ts`; references undeclared `FEATURE_DEPLOY_DIAGNOSTIC`. Candidate for delete. |
| `hud/help-visibility.ts` | 57 | 2,410 | Y | — | Top-center help/ready text visibility. |
| `hud/perf-diag.ts` | 345 | 14,768 | N (FEATURE_PERF_DIAG) | — | Performance diagnostic HUD. **Currently non-functional even when flag is enabled** — confirmed 2026-04-27. Do not propose using this for live profiling. |
| `hud/position-debug.ts` | 359 | 18,321 | N (FEATURE_POSITION_DEBUG) | — | Coordinate display HUD. |
| `hud/status.ts` | 564 | 21,890 | Y | — | Top-left status dock + 32 internal helpers. |
| `hud/ui-cache-perf.ts` | 35 | 1,540 | N (FEATURE_PERF_DIAG) | — | UI cache counter infrastructure. |
| `hud/update-helpers.ts` | 28 | 1,161 | Y | — | Admin action counter sync. |
| **index/** (Portal event handler impls) | | | | | |
| `index/area-triggers.ts` | ~119 | ~5,330 | Y | — | Capture-point + main-base trigger enter/exit handlers. **v1.445 (CQ_Bug_58)**: removed `notePreliveMainBaseViolation` call + its inner `if (!isMatchLive())` wrapper from `onPlayerExitAreaTriggerImpl` (5 lines); refresh broadcasts kept (ready dialog still shows IN/NOT IN MAIN BASE indicators on trigger exit). |
| `index/capture-shared.ts` | 33 | 1,241 | Y | — | Shared helpers for capture-sound + capture-vo. |
| `index/capture-sound.ts` | 203 | 7,913 | Y | — | Phase 4 capture-tick sound queue. |
| `index/capture-tickets.ts` | 2,150 | 87,156 | Y | M3/M11 owner | Phase 2A capture, ticket bleed, HUD dispatch, 7 view models. **Mega-file.** |
| `index/capture-vo.ts` | 376 | 14,753 | Y | — | Phase 4B objective VO queue. |
| `index/conquest-scaffold.ts` | 85 | 3,973 | Y | — | Phase 1 state init scaffold. |
| `index/game-mode.ts` | 186 | 8,376 | Y | — | `OnGameModeStarted` impl + 0.12s main loop. |
| `index/player-deploy.ts` | ~118 | ~5,890 | Y | — | `OnPlayerDeployed`/`OnPlayerUndeploy` impls. v1.418 (Ship 8): `handlePlayerDeployedBeforeRelease`, `reassertUiLoadingAfterUndeploy`, gate-active branches all deleted. **v1.445 (CQ_Bug_58)**: removed unconditional `readyByPid = false` + `delete readyNeedsReconfirmByPid` from `onPlayerDeployedImpl` (2 lines) — the engine `OnPlayerDeployed` callback no longer auto-unreadies the player on respawn-after-death or any other deploy event. |
| `index/player-join-leave.ts` | 199 | ~8,520 | Y | — | `OnPlayerJoinGame`/`OnPlayerLeaveGame` impls. v1.410 (Ship 2): join flow calls `triggerLazyBuild('topHudShell', joinPid)` after reset, before gate. v1.412 (Ship 3.5): also calls `SupplyBoxWarmScheduler.enqueueLateJoiner(joinPid)` for LIVE-phase warm tail-append. v1.413 (Ship 4): also calls `triggerLazyBuild('vehicleDeployTimer', joinPid)` for gate-entry warm of the deploy-timer cache. v1.414 (Ship 5): also calls `triggerLazyBuild('combatHud', joinPid)` for gate-entry warm of the combat-HUD cache. **v1.443 (Wave 6 Ship 0)**: `maxPasses` defaults dropped from 64 → 4 in `resetUiForPlayerOnJoin`'s local `deleteAllByName` and from 128 → 4 in `cleanupHudForPid`'s local copy. **v1.443 (Wave 6 Ship 1d)**: 3 sync `triggerLazyBuild` calls staggered — `topHudShell` immediate, `vehicleDeployTimer` at `Timers.setTimeout(50ms)`, `combatHud` at `Timers.setTimeout(150ms)`. R6 (pid-validity race) covered by existing `triggerLazyBuild` guard. |
| `index/player-kpi-events.ts` | 68 | 3,119 | Y | — | KPI event impls (kill, assist, capture). |
| `index/player-loop-inputs.ts` | ~16 | ~600 | Y | — | `OngoingPlayer`, `OnPlayerInteract`, `OnPlayerUIButtonEvent` impls. v1.418 (Ship 8): `enforceUiLoadingGateWhileDeployed`, `maintainUiLoadingGateWhileUnreleased`, `UI_LOADING_GATE_UNDEPLOY_RETRY_SECONDS` deleted; `ongoingPlayerImpl` reduced to deploy-check + interact-point removal/spawn. |
| `index/vehicle-events.ts` | 114 | 5,214 | Y | — | Vehicle enter/exit/spawn/destroy impls. |
| **interaction/** | | | | | |
| `interaction/actions.ts` | ~290 | ~12,600 | Y | — | v1.418 (Ship 8): loading-gate orchestration deleted — `prebuildAllUiFamiliesHidden`, `runLoadingGateUntilReady`, `releaseLoadingGate`, `revealAllUiFamilies`, `hideAllUiFamiliesForPlayer`, `reassertPlayerUiLoadingGateVisuals`, `runTeamSwapLoadingGate`, `holdPlayerAtDeploy`, `applyPlayerDeployAvailability`, `beginLoadingGate`, `enforceHudWarmTransitionDeployBlock`, `isAllUiFamiliesReadyForRelease`, `isCriticalTopHudReadyForPid`/`CombatHud`/`VehicleDeployHud`, `hideCriticalHudForWarmTransition`, `hideTopHudFamilyForWarmTransition`, `hideVehicleSpawnerUiFamilyForPid`, `setClockWidgetCacheVisible`, `setPositionDebugWidgetsVisibleForPid`, `waitForPlayerToBecomeUndeployedForTeamSwap`, `waitForPlayerTeamToSettleForSwap` all gone. File now contains only the prebuild-while-hidden builders called by the lazy-build dispatcher, the per-family render-for-reveal helpers (called from `onPlayerDeployedImpl` via `renderCriticalHudForReveal`), `processReadyDialogSelection` (team-swap with no overlay), and team-swap support helpers. |
| `interaction/ammo-resupply-menu.ts` | 2,866 | 127,961 | Y | **M2** | `AmmoResupplyMenuCacheEntry` per pid — ~100–180 widget refs + arrays. **Largest mega-file.** v1.411 (Ship 3): `openArmMenu` first-interact path routes through `triggerLazyBuild('supplyBox', pid)`. Hide-on-close behavior retained; teardown at disconnect via Wave 1 `destroyArmMenu`. **v1.447 (CQ_Bug_94 menu-open path)**: 3 new HasEquipment-based per-class probes (`probeAssaultSlot`, `probeMedicSlot`, `probeReconSlot`) + dispatcher (`probeSlotForClass`); wired into `initLockerSlotStateFromProbe` + `reprobeSiblingGadgetSlot`. **v1.448 (CQ_Bug_94 placement path)**: dropped `isSlotEmpty` + slot-targeted RemoveEquipment precheck from `giveMedicSmoke`, `giveAssaultItem`, `giveReconItem` (was the remaining `GetInventoryAmmo` source). Engineer's `probeSlot` + `giveLauncher` + `giveRocketCharge` untouched (launcher detection + swap-in-place need destructive-probe + slot-targeted clear semantics). Combined: non-Engineer classes emit zero `GetInventoryAmmo`/`GetInventoryMagazineAmmo` engine error log entries on either menu-open or placement. Net ~+87 lines / ~+2.25KB across both versions. |
| `interaction/build-pacer.ts` | 139 | 5,372 | Y | — | Wave 3 Ship 1 (v1.409): global heavy-build mutex + 10Hz Timers.setTimeout drainer for paced lazy builds. Dormant when queue empty. |
| `interaction/hud-warm-state.ts` | ~55 | ~2,000 | Y | — | v1.418 (Ship 8): swept from 40+ accessors down to 5 — `getReadyDialogStateForPid`, `setCombatHudRevealAllowedForPid`/`isCombatHudRevealAllowedForPid`, `resetReadyDialogSectionSignaturesForPid`, plus `isHudWarmReadyForPid` (always returns true) + `isHudSwapTransitionActiveForPid` (always returns false) kept as constants for backward-compat across clock/help/vehicles/HUD pipeline call sites. |
| `interaction/interact-point.ts` | 183 | ~8,200 | Y | — | Ready-dialog interact point spawn/despawn. v1.416 (Ship 7): `tryOpenReadyDialogForPlayer` calls `triggerLazyBuild('readyDialog', playerId)` immediately before `showReadyDialogUI` so the dispatcher's in-flight guard + error tear-down semantics own the build path. v1.417 (Ship 7 follow-up): deploy-time `warmHiddenReadyDialogCacheForPid(playerId)` call deleted from `spawnReadyDialogInteractPoint` — without this deletion the cache pre-warmed at deploy and the lazy trigger was a no-op. Now the build genuinely fires on first triple-tap. v1.424 (Wave 4 Ship 3): `tryOpenReadyDialogForPlayer` branches on `Admin.isAdmin(playerId)` — non-admins route to `triggerLazyBuild('playerReadyPanel', playerId)` + `showPlayerReadyPanelForPid(playerId)`; admins keep the full ready-dialog flow. Shared menu-close + cursor-enable prep is unbranched; route-specific build/show + error recovery live inside their respective conditionals. |
| `interaction/lazy-build-registry.ts` | 254 | 9,238 | Y | — | Wave 3 Ship 1 (v1.409): const config map for 6 UI surfaces (combat HUD, top shell, vehicle deploy timer, supply box, ready dialog, boundary prompt) + `triggerLazyBuild(name, pid)` dispatcher with per-surface in-flight guard, mutex acquisition, error retry. |
| `interaction/spawn-selector.ts` | 36 | 974 | Y | — | Phase 1 placeholder for future spawn selection. |
| `interaction/supply-box-warm-scheduler.ts` | 116 | 5,358 | Y | — | Wave 3 Ship 3.5 (v1.412): `SupplyBoxWarmScheduler` namespace owning a 2s/op self-rescheduling `Timers.setTimeout` chain. Persistent queue with late-joiner enqueue. Cancellation via token-bump on endMatch / triggerFreshMatchSetup. |
| `interaction/types.ts` | 74 | 2,999 | Y | — | `readyDialogData_t` + `UiLoadReason` types. |
| `interaction/ui-events-player-ready-panel.ts` | ~105 | ~4,200 | Y | — | Wave 4 Ship 5 (v1.429): sibling button router for the non-admin Player Ready Up Panel (per L15). 4 buttons: CLOSE (hide+restore cursor), READY (delegates to handleReadyDialogReadyButtonClick + refresh panel), CHANGE TEAMS (delegates to swapPlayerTeam + refresh panel), SPECTATE/COACH (no-op claim). Independent debounce tracker so panel + dialog clicks don't cross-cancel. |
| `interaction/ui-events-ready.ts` | 232 | 8,607 | Y | — | Ready-dialog button click routing. |
| `interaction/ui-events.ts` | 18 | ~860 | Y | — | UI button event dispatcher. v1.429: added `tryHandlePlayerReadyPanelButtonEvent` call after the dialog handler. |
| `interaction/ui-primary-click.ts` | 72 | 2,241 | Y | — | Primary-click debounce helpers. |
| `interaction/world-interactables.ts` | 457 | 19,654 | Y | **M8** | Per-pid spawned WorldIcon clones; `ensureMainBaseTeamIconForPlayer`. |
| **kpi/** | | | | | |
| `kpi/kpi-state.ts` | 113 | 4,028 | Y | **M12** | Per-pid `{kills, deaths, assists, captures, score, dirty, deathsBaseline}`. |
| `kpi/scoreboard-tab.ts` | 113 | 4,186 | Y | — | Custom two-team scoreboard sync. |
| **ready-dialog/** | | | | | |
| `ready-dialog/auto-start.ts` | 18 | 801 | Y | — | All-ready auto-start gate. |
| `ready-dialog/countdown-flow.ts` | 166 | 7,245 | Y | — | Pregame countdown orchestration. |
| `ready-dialog/dialog-build-mode-config.ts` | 485 | 16,904 | Y | — | 7-column knob grid + 5 checkboxes. |
| `ready-dialog/dialog-build-roster.ts` | 226 | 6,881 | Y | — | Roster panel construction. |
| `ready-dialog/dialog-build-sections.ts` | 265 | 7,947 | Y | — | Header/map + bottom-button sections. |
| `ready-dialog/dialog-build.ts` | 328 | 14,652 | Y | — | Root dialog assembly + section orchestration. |
| `ready-dialog/lifecycle.ts` | 205 | 8,849 | Y | — | Dialog open/close/destroy. |
| `ready-dialog/loading-overlay.ts` | 5 | ~280 | N (stub) | — | v1.418 (Ship 8): file emptied; loading overlay UX deleted with the loading gate. Import removed from `index.ts`. Stub remains on disk only. |
| `ready-dialog/matchup-summary.ts` | 109 | 4,907 | Y | — | Team names + matchup readouts. |
| `ready-dialog/mode-config-aircraft-ceiling.ts` | 43 | 2,522 | Y | — | Aircraft ceiling control. |
| `ready-dialog/mode-config-presets.ts` | 387 | 19,961 | Y | — | Vehicle preset packages (1v1 → 4v4) + apply. |
| `ready-dialog/mode-config-readout.ts` | 418 | 19,797 | Y | — | Vehicle selection readout. |
| `ready-dialog/mode-config-schema.ts` | 150 | 6,886 | Y | — | Knob/column metadata. |
| `ready-dialog/pregame-ui.ts` | 212 | 8,419 | Y | — | Pregame countdown widgets + delay-line cache. |
| `ready-dialog/ready-reset.ts` | 18 | 789 | Y | — | Reset all-player ready state. |
| `ready-dialog/roster-active.ts` | 138 | 5,475 | Y | — | Active-player selection + roster entries. |
| `ready-dialog/roster-render.ts` | 270 | 13,122 | Y | — | Roster widget rendering + ready-toggle. |
| `ready-dialog/swap-action.ts` | 29 | 1,534 | Y | — | Single-button team swap. |
| `ready-dialog/player-ready-panel.ts` | 431 | 22,384 | Y | — | Wave 4 Ship 2 (v1.423): non-admin Player Ready Up Panel skeleton. ~20 widgets/pid post-Ship-6 (was ~17 pre-claim-button). Hidden builder + show/hide/destroy. Bound to lazy-build registry surface `playerReadyPanel`. Spectate/Coach button uses verbatim D3 disabled treatment. Ship 3 polish (v1.426/427): centering fix; button row Y reposition + height doubled 36->72. Ship 4 (v1.428): `refreshPlayerReadyPanelContentForPid` wires Game Host / Game Admin / ready status. Ship 6 / v1.2 (v1.431): added CLAIM ADMIN button (TopRight anchor, vacancy-gated visibility via `syncPlayerReadyPanelClaimAdminButtonForPid`); added `refreshAllVisiblePlayerReadyPanels` broadcast helper called from claim/give-up/admin-disconnect transitions. Ship 6 polish v1.434: CLAIM ADMIN live-disable styling (greyed + SetUIButtonEnabled(false) when match is live). |
| `ready-dialog/takeoff-gating.ts` | 16 | 652 | Y | — | Aircraft takeoff readiness check. |
| **state/** | | | | | |
| `state/core.ts` | ~99 | ~3,950 | Y | — | `isMatchLive`, round-start delay helpers, world-log. v1.418 (Ship 8): `setAllInputRestrictionsForPlayer` deleted (no callers post-gate-deletion; `mod.EnableAllInputRestrictions` no longer invoked from script). |
| `state/hud-cache-types.ts` | 228 | 7,316 | Y | M1/M2/M4/M5/M6 owner | All HUD cache type defs. **Tier A2 target.** v1.439 (Wave 5 Ship 1): `ReusableTimerWidgetCacheEntry` shape change — 10 digit/shadow widget refs + `lastDisplayedSeconds` removed; 2 bar widget refs + `lastDecile` added. **v1.446 (CQ_Tweak_WAIT_Label)**: added `barText?: mod.UIWidget` for the centered WAIT label drawn on top of the timer bar. |
| `state/id-helpers.ts` | 167 | 6,640 | Y | — | `safe*` accessors: `isValidPlayer`, `safeFind`, `safeGetPlayerId`. |
| `state/lifecycle-guardrails.ts` | 66 | 2,120 | Y | — | Phase transition guards. |
| `state/player-iteration.ts` | 18 | 828 | Y | — | `forEachValidPlayer` shared helper (v1.217). |
| `state/player-lookup.ts` | 20 | 606 | Y | — | `safeFindPlayer` by pid (v1.190). |
| `state/runtime-state.ts` | 258 | 8,863 | Y | — | `State` singleton init. |
| `state/runtime-types.ts` | 507 | 19,667 | Y | M1/M4/M7/M9/M11 owner | `GameState` shape + `VehicleSpawnerSlot`. **Tier A1 + Cat 7 target.** |
| `state/runtime.ts` | 6 | 160 | Y | — | Composition shim. |
| `state/spawn-charge.ts` | 255 | 10,878 | Y | — | Phase 2B spawn-charge reason matrix + transactions. |
| `state/tick-context.ts` | 33 | 1,301 | Y | — | Per-tick `mod.AllPlayers()` cache (v1.220). |
| `state/ui-helpers.ts` | 375 | 12,451 | Y | — | Widget builder helpers (`wn`, `addOutlinedButton`, `safeParseUI`). |
| **strings/** | | | | | |
| `strings/ui-ids.ts` | 137 | 9,096 | Y | — | Widget ID + string-key constants. |
| **ui/admin/** | | | | | |
| `ui/admin/action-counter.ts` | 26 | 936 | N (FEATURE_ADMIN_PANEL) | — | Admin action event counter display. |
| **ui/branding/** | | | | | |
| `ui/branding/top-left.ts` | 217 | 9,216 | Y | — | Title/version/status panel. |
| **ui/conquest/** | | | | | |
| `ui/conquest/hud-core/build.ts` | 1,146 | 46,381 | Y | **M3** | Combat HUD widget construction (tickets/flags/engage). **v1.444 (Wave 6 chevron polish)**: chevron initial colors swapped — left chevron (on blue bar) now `TWL_CONQUEST_HUD_COLOR_RED` + `CONQUEST_HUD_TICKET_BLEED_CHEVRON_ENEMY_RGB`; right chevron (on red bar) now `TWL_CONQUEST_HUD_COLOR_BLUE` + `CONQUEST_HUD_TICKET_BLEED_CHEVRON_FRIENDLY_RGB`. Crown image shadows preserved (2 widgets/pid, outside ring system — Wave 7 candidate). **v1.449 (HUD backplates)**: 3 new `twlConquestHudEnsureContainer` calls added — `ticketBlueTeamNameBox`, `ticketRedTeamNameBox`, `engageStatusBox`. **v1.450 (HUD backplates v2)**: team-name dimensions polished; engage box switched to dedicated constants. **v1.451 (HUD backplates v3)**: removed both team-name backplates entirely (build sites + cache assignments); engage status backplate is the only remaining HUD-text backplate. |
| `ui/conquest/hud-core/constants.ts` | ~415 | ~20,960 | Y | — | HUD layout constants (~158 const). **Tier B1 target.** **v1.443 (Wave 6 Ship 1c)**: `twlConquestHudBuildShadowRingProfile` rewritten to return `[]` regardless of args. Single-source change cascades through every `Ensure`/`Render`/`Hide`/`Delete` consumer in `build.ts`/`render.ts`/`lifecycle.ts` — eliminates ~280 widgets/pid (~75% of M3 cache). Original 8-layer compass-direction ring builder preserved in [`reference_implementations/reference_conquest_attempt_d/src/ui/conquest/hud-core/constants.ts`](../reference_implementations/reference_conquest_attempt_d/src/ui/conquest/hud-core/constants.ts) for restoration. **v1.449**: added `TWL_CONQUEST_HUD_TEXT_BOX_PADDING = 4`. **v1.450**: added 4 dedicated engage-status box constants. **v1.451**: removed `TWL_CONQUEST_HUD_TEXT_BOX_PADDING` (unused after team-name backplates dropped); engage `_BOX_WIDTH` tightened 110→90. **v1.452**: engage `_BOX_WIDTH = 98`, `_BOX_HEIGHT = 18` (full text bounding box), `_BOX_Y = ENGAGE_STATUS_Y`. **v1.453**: engage box dimensions finalized — `_BOX_HEIGHT = 14` (covers only visible glyph cap-height; the 18px text widget had ~4px padding the backplate didn't need to back), `_BOX_Y = ENGAGE_STATUS_Y + 2` (top no longer touches engage-track bar). Width unchanged at 98. |
| `ui/conquest/hud-core/lifecycle.ts` | ~292 | ~16,000 | Y | M3 indirect | Show/hide/destroy HUD per pid. **v1.443 (Wave 6 Ship 0)**: `twlConquestHudDeleteAllByName` `maxPasses` default dropped from 128 → 4. This was the dominant disconnect-spike contributor pre-Wave-6 (~5,120 ops on disconnect across ~40 calls); now ~160 ops in the common path. **Post-Ship-1c**: `twlConquestHudHideShadowRing` and `twlConquestHudDeleteShadowRingByBaseName` still exist but iterate the now-empty profile, so they're effectively no-ops on the ring path. **v1.449/v1.451 (HUD backplates)**: hide entry added for `engageStatusBox` in both `twlConquestHudHidePlayer` and `twlConquestHudHideObjectiveFocusForPid`. v1.449's team-name backplate hide entries removed in v1.451 (team-name backplates dropped). |
| `ui/conquest/hud-core/names.ts` | ~184 | ~6,090 | Y | — | Widget ID generators. **v1.449**: 3 new generators for the HUD backplates. **v1.451**: 2 generators removed (team-name backplates dropped) — only `twlConquestHudEngageStatusBoxName` remains. |
| `ui/conquest/hud-core/pipeline.ts` | 172 | 6,602 | Y | — | Render queue + dispatch. |
| `ui/conquest/hud-core/render.ts` | ~669 | ~31,470 | Y | M3 | Visual update (tickets, flags, engage). **v1.444 (Wave 6 chevron polish)**: render-pass `safeSetUITextColor` calls inverted — left chevron now `TWL_CONQUEST_HUD_COLOR_BLEED_CHEVRON_RED`, right chevron now `TWL_CONQUEST_HUD_COLOR_BLEED_CHEVRON_BLUE` — for contrast post-shadow-removal + reinforced "enemy is bleeding you" semantic. Shadow ring render helpers (`twlConquestHudRenderShadowRingText`) now iterate empty profile (post-Ship-1c) and short-circuit at `if (!ring) return` / zero-length loop. **v1.449/v1.451 (HUD backplates)**: 2 `safeSetUIWidgetVisible` toggles on `engageStatusBox` (engage hide + show branches). v1.449's team-name backplate visibility toggles removed in v1.451 (team-name backplates dropped). |
| `ui/conquest/hud-core/state.ts` | 98 | 3,613 | Y | M3 cache | Runtime cache/scheduler state. |
| `ui/conquest/hud-core/toggle.ts` | 13 | 377 | Y | — | HUD mode getter/setter. |
| `ui/conquest/hud-core/types.ts` | ~143 | ~5,070 | Y | — | `TwlConquestHud*` type defs. **v1.449/v1.451**: 1 optional cache field for the engage-status backplate (`engageStatusBox?`). v1.449's team-name backplate cache fields (`ticketBlueTeamNameBox?` + `ticketRedTeamNameBox?`) removed in v1.451. |
| `ui/conquest/hud-core/validate.ts` | 156 | 8,528 | Y | — | Strict centered root-chain validation. |
| `ui/conquest/top-hud-shell.ts` | 237 | 9,918 | Y | **M4** | `topHudShellByPid` ~25 widget refs + 2 roster arrays per pid. |
| **ui/dialog/** | | | | | |
| `ui/dialog/victory-build.ts` | 527 | 24,692 | Y | M4 (in TopHudShellRefs) | Victory dialog widget construction. |
| `ui/dialog/victory.ts` | 172 | 8,622 | Y | — | Victory dialog content + winner presentation. |
| **ui/ready/** | | | | | |
| `ui/ready/ready-line.ts` | 141 | 5,586 | Y | — | Top-center help/ready containers. |
| **utils/** | | | | | |
| `utils/main-base.ts` | 20 | 973 | Y | — | `IsPlayerInOwnMainBase` check. |
| `utils/multi-click.ts` | 51 | 1,901 | Y | — | Multi-click detection. |
| **vehicles/** | | | | | |
| `vehicles/air-spawn-volume.ts` | 104 | 4,259 | Y | — | Air-deploy volume picker + altitude/rotation sampler. |
| `vehicles/array-helpers.ts` | 20 | 969 | Y | — | Engine array helpers for vehicle registry. |
| `vehicles/deploy-live-menu.ts` | 87 | 3,318 | Y | — | Live-terminal deploy menu visibility. |
| `vehicles/deploy-timer-ui.ts` | 2,053 | ~91,500 | Y | **M1** | `vehicleDeployTimerCache` per pid — **post-v1.439 ~140-235 widget refs × N rows** (Wave 5 Ship 1 dropped 8 per row from the timer slot). **Largest per-pid widget cache. Mega-file.** Two call sites updated to compute `elapsedFraction` from total + remaining seconds; cache-shape visibility check + reset path updated for the new bar widgets / `lastDecile` field. |
| `vehicles/forward-spawn-volume.ts` | 73 | 2,944 | Y | — | Forward-deploy volume sampler. |
| `vehicles/hq-deploy.ts` | 425 | 23,168 | Y | — | Phase 6 HQ Deploy + Forward/Air request paths + post-seat Teleport. |
| `vehicles/ownership.ts` | 69 | 2,702 | Y | — | Last-driver tracking for spawned vehicles. |
| `vehicles/registration.ts` | 31 | 1,534 | Y | — | Team vehicle registry + base team inference. |
| `vehicles/spawn-volume-math.ts` | 52 | 2,430 | Y | — | Pure triangle/quad math for volume sampling. |
| `vehicles/spawner-budget.ts` | 39 | 1,601 | Y | — | Audit persistent VehicleSpawner count vs 40-budget ceiling. |
| `vehicles/timers.ts` | 20 | 1,026 | Y | — | Slot-time accessors for `Clocks` countdowns. |
| `vehicles/vanilla-spawner.ts` | 597 | 27,207 | Y | — | Vanilla spawner (v1.258 rewrite). 11 dead `VehicleSpawnerSlot` write fields here = **Tier A1**. |
| `vehicles/vehicle-classification.ts` | 78 | 3,104 | Y | — | Aircraft/jet/tank/heli type guards. |

---

## Function Inventory

For each in-bundle file: every top-level function (`function`, `export function`, top-level arrow const) with one-line purpose. Files marked `(no functions; types/constants only)` have type defs / const tables only — those modules have no callable surface but contribute heap via their constant/type loads. Mega-files list only the externally-callable surface; their internal helpers are summarized.

### Usage annotation convention

Every function entry ends with a parenthesized usage tag:

| Tag | Meaning |
|-----|---------|
| `(N)` | **Static call-site count.** Plain integer = called from N locations in `src/`. Concrete, grep-counted. Higher N = wider-blast-radius helper (e.g. `safeFind` (323), `msg` (326), `wn` (215)). `(0)` = currently unused / dead candidate. |
| `(TIER~N)` | **Hot-path entry point.** TIER tells you the runtime cadence; the `~N` tail is the static call count. The static count understates true frequency for these functions. TIER buckets: |
| ↳ `XL` | Runs every game-loop subtick (~8/sec). For per-player variants, multiplied by player count. *Examples:* `ongoingPlayerImpl()` (XL~1), `updateConquestCombatHudForAllPlayers()` (XL~9), `twlConquestHudTickFrame()` (XL~1). |
| ↳ `L` | Runs every second (second-boundary work). *Examples:* `tickBoundaryEnforcement()` (L~1), `onLiveTick()` (L~1). |
| ↳ `M` | Runs on common gameplay events (deploy, vehicle entry, capture edge, kill). *Examples:* `onPlayerDeployedImpl()` (M~1), `onVehicleSpawnedImpl()` (M~1). |
| ↳ `S` | Runs on rare gameplay events (match start/end, team swap, join, leave). *Examples:* `onPlayerJoinGameImpl()` (S~1), `startMatch()` (S~3). |
| ↳ `XS` | Runs once or near-once (mode startup, scaffold init). *Examples:* `onGameModeStartedImpl()` (XS~1), `initializeConquestPhase1Scaffold()` (XS~1). |
| `(engine)` | **Engine-fired Portal callback.** No script-side callers; the Portal runtime fires these at event boundaries. All 22 entries in `src/index.ts` are tagged this way. The matching `*Impl` function in `src/index/*` carries the cadence tier (e.g., `OngoingPlayer` (engine) → `ongoingPlayerImpl()` (XL~1)). |

**How to use this:** scan each file's section. A high `(N)` plain count tells you the function is widely used (often a helper) — touch it carefully. A `(XL~)` or `(L~)` prefix tells you the function fires frequently — its body is on a heap-multiplied hot path. A `(0)` count is a delete candidate.

### src/admin/identity.ts
Module: Wave 4 Ship 1 (v1.422) + Ship 6 / v1.2 redesign (v1.431) — single-slot admin model + host slot. `Admin` namespace with module-level state + public accessors.
- `Admin.onPlayerJoin()` (1 — `onPlayerJoinGameImpl`) — first-ever join: sets host slot AND auto-assigns admin slot to the joiner (one-time server-lifetime exception, gated on `_hostFirstPid === undefined`). Subsequent joins are no-ops; vacant admin slots stay vacant until someone presses CLAIM ADMIN (v1.436 — no auto-promotion of later joiners).
- `Admin.onPlayerLeave()` (1 — `onPlayerLeaveGameImpl`) — vacates admin slot if leaver was admin (per Q1) and broadcasts via `refreshAllVisiblePlayerReadyPanels`. Host fields stay untouched (cosmetic; survive disconnect via cached Message per R5).
- `Admin.isAdmin()` (2 — Ship 3 router + ui-events-ready guard) — returns true iff `_currentAdminPid === pid`
- `Admin.getCurrentAdminPid()` (1 — Ship 4 panel refresh) — returns the current admin pid or undefined
- `Admin.isAdminVacant()` (1 — Ship 6 panel claim-button visibility) — returns true iff `_currentAdminPid === undefined`
- `Admin.isHost()` (0) — returns true if pid matches `_hostFirstPid` (kept for future use)
- `Admin.getHostFirstPid()` (1 — Ship 4 panel refresh) — returns the recorded first-pid or undefined
- `Admin.getHostNameMessage()` (0 — kept for cached-Message host display path; Ship 4 chose live-Player route instead)
- `Admin.claimAdmin()` (1 — Ship 6 CLAIM ADMIN handler) — atomic: succeeds only if `isAdminVacant()`; returns true on success, false on race (someone else claimed first)
- `Admin.giveUpAdmin()` (1 — Ship 6 GIVE UP ADMIN handler) — atomic: succeeds only if `pid === _currentAdminPid`; returns true on success, false otherwise

### src/boundary/enforcement.ts
Module: boundary occupancy, prompt, and kill-timer enforcement
- `getBoundaryDurationSeconds()` (1) — return kill duration by violation kind
- `getBoundaryWarningDelaySeconds()` (1) — return warning delay before enforcement timer starts
- `isPlayerAliveForBoundary()` (2) — check if player is alive and valid for boundary logic
- `hasValidBoundaryAlarmHandle()` (5) — validate SFX handle for cleanup safety
- `safeUnspawnBoundaryAlarmHandle()` (1) — conditionally unspawn boundary alarm SFX
- `cleanupBoundaryAlarmRuntime()` (1) — reset all boundary alarm handles on reset
- `primeBoundaryAlarmRuntime()` (1) — initialize boundary alarm sound system
- `playBoundaryAlarmForPlayer()` (1) — trigger boundary violation alarm sound
- `getEnemyTeamId()` (2) — resolve opposite team from current team
- `enableBoundaryAreaTriggers()` (1) — activate configured boundary area triggers
- `getOrInitZoneStateForPid()` (3) — ensure zone tracking state for player
- `classifyVehicleSeatKind()` (2) — determine aircraft vs ground vehicle from seat
- `setPlayerSeatKind()` (3) — record current vehicle seat classification
- `updateZoneStateOnTriggerTransition()` (2) — track trigger enter/exit for zones
- `getDesiredBoundaryViolationKind()` (1) — resolve active violation type for player
- `notePreliveMainBaseViolation()` (2) — mark violation detected during pre-live phase
- `tryKillBoundaryPlayer()` (1) — apply kill enforcement after warning timeout
- `clearBoundaryViolationForPid()` (6) — reset violation state and cleanup UI
- `refreshPlayerBoundaryState()` (5) — recompute violation state from current position
- `runBoundaryViolationEnforcementLoop()` (1) — async enforcement loop per player
- `refreshBoundaryStateForAllPlayers()` (3) — update violation state batch per second
- `tickBoundaryEnforcement()` (L~1) — per-tick boundary enforcement entry point
- `onPlayerEnterBoundaryAreaTrigger()` (engine) — handle area trigger enter event
- `onPlayerExitBoundaryAreaTrigger()` (engine) — handle area trigger exit event
- `resetPlayerBoundaryStateOnDeploy()` (1) — clear violations on spawn and seed zones
- `seedZoneStateFromSpawnContext()` (1) — inherit zone membership from spawn location
- `findNearestDeployedTeammatePid()` (1) — search nearby teammates for zone inheritance
- `tryInheritZonesFromNearbyTeammate()` (1) — copy zone state from teammate if close
- `probeSeatKindFromEngineState()` (1) — sample vehicle seat from current engine state
- `isPlayerWithinOwnMainBaseAnchorRadius()` (1) — check if at HQ within anchor radius
- `resetPlayerBoundaryStateOnUndeployOrReset()` (4) — cleanup violations on undeploy
- `clearActiveBoundaryViolationsForAllPlayers()` (5) — batch cleanup at match end

### src/boundary/prompt-ui.ts
Module: cached per-player center-screen boundary warning prompt family
- `boundaryPromptRootName()` (4) — generate root widget ID for pid
- `boundaryPromptBorderName()` (3) — generate border widget ID for pid
- `boundaryPromptTitle1Name()` (3) / `boundaryPromptTitle1ShadowName()` (3) — generate title widget IDs
- `boundaryPromptTitle2Name()` (3) / `boundaryPromptTitle2ShadowName()` (3) — generate secondary title IDs
- `boundaryPromptSubtitleName()` (2) / `boundaryPromptSubtitleShadowName()` (2) — generate subtitle IDs
- `boundaryPromptLeftIconName()` (3) / `boundaryPromptLeftIconShadowName()` (3) — generate left icon IDs
- `boundaryPromptRightIconName()` (3) / `boundaryPromptRightIconShadowName()` (3) — generate right icon IDs
- `getBoundaryPromptTitle1Message()` (3) — get primary title by violation kind
- `getBoundaryPromptTitle2Message()` (3) — get secondary title by violation kind
- `getBoundaryPromptSubtitleMessage()` (3) — get subtitle by remaining seconds
- `resolveBoundaryPromptCacheRefs()` (3) — resolve cached widget references
- `setBoundaryPromptVisible()` (3) — show/hide boundary prompt UI
- `ensureBoundaryPromptUiForPlayer()` (1) — build or reuse boundary prompt for player
- `showBoundaryPromptForPlayer()` (1) — display prompt with violation info
- `hideBoundaryPromptForPid()` (4) — hide prompt by player ID
- `destroyBoundaryPromptUiForPid()` (3) — cleanup and destroy prompt widgets

### src/boundary/live-prebuild-scheduler.ts
Module: Wave 3 Ship 6 (v1.415) — LIVE-phase 10-batch staggered prebuild of boundary prompt widget tree. Snapshot-only (no late-joiner queue); first-violation fallback in `showBoundaryPromptForPlayer` covers any pid not warmed.
- `BoundaryPromptLivePrebuildScheduler.startBoundaryPromptPrebuildForLive()` (1) — kicked off at LIVE start by `conquest-flow.ts:startMatch`; bumps token, snapshots connected pids, schedules 10 batches at +0s..+9s
- `BoundaryPromptLivePrebuildScheduler.cancelBoundaryPromptPrebuild()` (2) — invoked from `endMatch` and `triggerFreshMatchSetup`; bumps token, clears pending Timers handles
- `BoundaryPromptLivePrebuildScheduler.isBoundaryPromptPrebuildActive()` (0) — read-only telemetry helper
- internal: `collectConnectedPidsOrdered()`

### src/clock/state.ts
Module: clock runtime state, reset, tick update, and duration adjustment
- `onClockSecond()` (0) — handle per-second clock tick from Clocks subsystem
- `onClockComplete()` (0) — handle clock expired event
- `resetMatchClock()` (3) — reset clock to specific duration
- `setMatchClockPreview()` (5) — set clock display without countdown active
- `getRemainingSeconds()` (4) — get current remaining time on clock
- `shouldClockUseCriticalFlashSubtick()` (0) — check if final-seconds flash is active
- `isClockCriticalColorPulseLowAtRemaining()` (2) — check if pulse animation low at time
- `adjustMatchClockBySeconds()` (2) — adjust clock duration by delta
- `resetMatchClockToDefault()` (1) — reset to configured round duration
- `updateAllPlayersClock()` (L~6) — sync clock display to all players

### src/clock/timer-instance.ts
Module: reusable MM:SS timer widget helpers for clock-adjacent UI
- `deleteAllReusableTimerWidgetsByName()` (50) — batch destroy timer widgets by name
- `purgeReusableTimerInstance()` (2) — cleanup timer cache entry for player
- `buildReusableTimerDigit()` (4) / `buildReusableTimerDigitShadow()` (4) — create digit + shadow
- `buildReusableTimerColon()` (1) / `buildReusableTimerColonShadow()` (1) — create separator + shadow
- `buildReusableTimerStatus()` (1) / `buildReusableTimerStatusShadow()` (1) — create status label + shadow
- `normalizeReusableTimerInstance()` (2) — normalize root and digit containers
- `ensureReusableTimerInstance()` (1) — build or cache reusable timer UI
- `setReusableTimerSeconds()` (2) — update displayed time
- `setReusableTimerStatus()` (5) — update status text
- `setReusableTimerColor()` (2) — apply color to timer
- `setReusableTimerVisible()` (2) — show/hide timer

### src/clock/ui.ts
Module: clock widget build, cache, and digit rendering helpers
- `ensureClockUIAndGetCache()` (3) — build or return cached match clock widget
- `buildClockSurface()` (1) — construct clock root and digit graph
- `normalizeClockRootAndPlate()` (2) — setup clock root positioning and depth
- `buildDigit()` (4) / `buildDigitShadow()` (4) — create digit element + shadow
- `buildColon()` (1) / `buildColonShadow()` (1) — create MM:SS separator + shadow
- `setDigitCached()` (24) — update digit image from cache
- `setColonCached()` (6) — update colon image
- `setClockColorCached()` (3) — apply color to all clock elements
- `setClockVisibilityCached()` (2) — show/hide clock

### src/config/conquest-constants.ts
Module: Phase 1 conquest scaffold constants
- `getConquestHudMode()` (5) — get current HUD mode setting
- `setConquestHudMode()` (1) — set HUD display mode

### src/config/map-runtime.ts
Module: map detection/apply and spawn-preset helpers
- `getMapNameKey()` (2) — get localized name key for map
- `buildHeliSpawnsFromTankSpawns()` (2) — create helicopter spawns above tank spawns
- `resolveHeliSpawnsForTeam()` (5) — extract configured heli spawns for team
- `cloneVehicleSpawnAnchors()` (1) — deep copy spawn anchor array
- `getReadyDialogVehicleOptionsForKnobKey()` (5) — get vehicle choices for knob
- `isTransportHeliVehicleType()` (2) — check if vehicle is transport helicopter
- `getReadyDialogVehicleSelectionLabelKey()` (1) — get UI label key for selection
- `getReadyDialogVehicleSelectionCount()` (1) — count available vehicle options
- `getReadyDialogVehicleOptionIndexForVehicle()` (2) — find index of vehicle in options
- `getReadyDialogSelectedVehicleForKnobKey()` (4) — get selected vehicle for knob
- `remapVehicleSpawnAnchorsForRuntime()` (2) — adjust spawn anchors for live map
- `createVehicleSpawnSpec()` (3) — create spawn specification from anchor+vehicle
- `getVehicleBootstrapTypeForKnobKey()` (2) — get default vehicle for knob
- `buildRuntimeVehicleSlotInventorySpecsFromKnobs()` (3) — convert knob selections to slot specs
- `buildRuntimeTransportSlotInventoryForTeam()` (1) — build transport spawner specs
- `buildRuntimeVehicleSlotInventoryForTeam()` (2) — build all vehicle spawner specs for team
- `buildSelectedVehicleSpawnSpecsFromKnobs()` (6) — extract specs from current selections
- `buildSelectedTransportSpawnSpecsForTeam()` (2) — extract transport specs from selections
- `getReadyDialogPresetPackage()` (4) — get preset for game mode
- `isValidConfiguredObjId()` (5) — type-safe object ID validation
- `addUniqueValidationWarning()` (3) — record config validation issue
- `isObjIdWithinInclusiveRange()` (1) — check object ID range membership
- `classifyMainBaseInteractableActionFromObjId()` (1) — resolve HQ action type
- `buildWorldInteractableConfigsFromMapConfig()` (1) — extract HQ/supply config
- `buildMapConfigObjIdValidationEntries()` (1) — generate validation checklist
- `buildMapConfigValidationWarnings()` (1) — validate map config integrity
- `syncActiveMapValidationWarnings()` (1) — update validation state
- `replayActiveMapValidationWarningsToPlayer()` (2) — show validation issues
- `replayActiveMapValidationWarningsToAllPlayers()` (1) — batch warning broadcast
- `buildReadyDialogVehicleSelectionIndexFromPresetPackage()` (1) — apply preset selections
- `buildReadyDialogVehicleSelectionIndexByGameMode()` (6) — apply game-mode defaults
- `syncReadyDialogVehicleSelectionsFromActiveMapConfig()` (0) — push selections to UI
- `refreshSelectedVehicleSpawnPoolsFromModeConfig()` (2) — update spawn pool from config
- `resolveVehicleSpawnVolumes()` (4) — extract spawn volumes from config
- `refreshVehicleSpawnSpecsFromModeConfig()` (2) — rebuild slot specs from config
- `relocateSlotSpawner()` (1) — move spawner to new position
- `applyVehicleSpawnSpecsToExistingSlots()` (2) — update vehicle type on slots
- `applyMapConfig()` (1) — activate map configuration
- `getMainBaseTriggerIdForTeam()` (6) — get HQ boundary trigger for team
- `getMainBaseBufferTriggerIdForTeam()` (4) — get HQ buffer zone trigger for team
- `getGroundCombatZoneTriggerId()` (2) — get GCZ boundary trigger
- `getVehicleSpawnVolumesForTeam()` (6) — get spawn volumes for team
- `detectMapKeyFromHqs()` (1) — infer map from HQ anchor positions
- `findMatchupPresetIndex()` (1) — find preset matching player count

### src/config/maps.ts
(no functions; types/constants only)

### src/config/maps/operation-firestorm.ts
(no functions; types/constants only)

### src/config/runtime.ts
Module: active map state, derived spawn specs, and runtime map constants
- `rebuildActiveCapturePointConfigIndex()` (2) — rebuild capture point lookup
- `getActiveCapturePointConfigByObjId()` (2) — get capture config by object ID
- `rebuildActiveWorldInteractableConfigIndex()` (2) — rebuild HQ/supply lookup
- `syncActiveWorldInteractableConfigs()` (1) — update interactable configurations
- `getActiveWorldInteractableConfigByObjId()` (1) — get HQ/supply config by object ID

### src/config/types.ts
(no functions; types/constants only)

### src/conquest-flow.ts
Module: continuous-live flow orchestration and phase-state helpers
- `forceSpawnAllReadyVehicleSlots()` (1) — immediately spawn all vehicles
- `bindClockExpiryForContinuousMode()` (1) — setup continuous mode end-on-clock
- `startMatch()` (S~3) — transition to live phase with initial state setup
- `endMatch()` (S~3) — trigger victory and phase transition
- `triggerFreshMatchSetup()` (0) — reset match without phase change
- `clampMatchLengthSeconds()` (4) — enforce min/max duration
- `getConfiguredMatchLengthSeconds()` (10) — get current round duration
- `syncAdminMatchLengthLabelForAllPlayers()` (3) — update admin UI duration label

### src/footer-file.ts
(no functions; EOF version marker)

### src/foundation/bf6-utils/callback-handler.ts
(no functions; types/constants only)

### src/foundation/bf6-utils/clocks.ts
(no functions; types/constants only — `Clocks.CountDownClock` runtime)

### src/foundation/bf6-utils/logging.ts
(no functions; types/constants only)

### src/foundation/bf6-utils/timers.ts
(no functions; types/constants only — `Timers.setTimeout` / `setInterval` exposure)

### src/foundation/gameplay.ts
(no functions; types/constants only)

### src/foundation/modlib.ts
(no functions; types/constants only)

### src/foundation/string-keys.ts
- `msg()` (326) — create localized message from string key ID (v1.399 helper used by ~345 sites)

### src/foundation/ui-layout.ts
(no functions; types/constants only — ~308 const, **Tier B1 inlining target**)

### src/header-file.ts
(no functions; version + license)

### src/hud/conquest-scaffold.ts
Module: Phase 1 conquest HUD seam
- `refreshConquestScaffoldHudForAllPlayers()` (1) — update phase 1 scaffold HUD

### src/hud/help-visibility.ts
Module: ready-dialog visibility and top-center help/ready text visibility
- `updateHelpTextVisibilityForPid()` (13) — update help text for player
- `updateHelpTextVisibilityForPlayer()` (1) — sync help visibility per player
- `updateHelpTextVisibilityForAllPlayers()` (6) — batch help text update

### src/hud/status.ts
Module: counter helpers, phase/help text, ready counts, safe widget setters (32 internal helpers — top-level surface only listed in source)

### src/hud/update-helpers.ts
Module: HUD state sync helpers and admin action count
- `updateAdminPanelActionCountForAllPlayers()` (2) — sync action count to all
- `handleAdminPanelAction()` (12) — process admin panel button action

### src/index.ts
- 22 Portal event handler exports — `OnGameModeStarted` (engine), `OnPlayerJoinGame` (engine), `OnPlayerLeaveGame` (engine), `OnPlayerDeployed` (engine), `OnPlayerUndeploy` (engine), `OngoingPlayer` (engine), `OngoingGlobal` (engine), `OnPlayerInteract` (engine), `OnPlayerUIButtonEvent` (engine), `OnPlayerEnterVehicle` (engine), `OnPlayerExitVehicle` (engine), `OnVehicleSpawned` (engine), `OnVehicleDestroyed` (engine), `OngoingCapturePoint` (engine), `OnCapturePointLost` (engine), `OnCapturePointCaptured` (engine), `OnPlayerEnterCapturePoint` (engine), `OnPlayerExitCapturePoint` (engine), `OnPlayerEnterAreaTrigger` (engine), `OnPlayerExitAreaTrigger` (engine), `OnPlayerEarnedKill` (engine), `OnPlayerEarnedKillAssist` (engine). Each delegates to the matching `*Impl` in `src/index/*`.

### src/index/area-triggers.ts
Module: capture-point tick suppression and main-base trigger handlers
- `ongoingCapturePointImpl()` (L~1) — per-capture ongoing handler implementation
- `onCapturePointLostImpl()` (M~1) — capture lost handler implementation
- `onCapturePointCapturedImpl()` (M~1) — capture won handler implementation
- `isMappedConquestCapturePointObjId()` (1) — check if point is conquest-mapped
- `onPlayerEnterCapturePointImpl()` (M~1) — player enter capture zone implementation
- `onPlayerExitCapturePointImpl()` (M~1) — player exit capture zone implementation
- `onPlayerEnterAreaTriggerImpl()` (M~1) — player enter boundary trigger implementation
- `onPlayerExitAreaTriggerImpl()` (M~1) — player exit boundary trigger implementation

### src/index/capture-shared.ts
Module: shared helpers for capture-sound and capture-vo subsystems
- `conquestCaptureHasValidHandle()` (9) — validate SFX handle
- `conquestCaptureSafeUnspawnHandle()` (4) — conditional SFX unspawn
- `conquestCaptureFilterThrottleMapByPid()` (2) — filter throttle map by player

### src/index/capture-sound.ts
Module: Phase 4 isolated capture-sound backbone and V1 capture-tick dispatch
- `cleanupSoundRuntimeHandles()` (1) — destroy sound handles
- `resetCaptureSoundQueueState()` (2) — clear sound state
- `captureSoundOnNotLiveReset()` (2) — reset sound on pre-live transition
- `captureSoundOnMatchLiveStart()` (1) — prime sound system on live start
- `captureSoundOnPlayerLeaveOrResetPid()` (4) — cleanup player sound state
- `primeSoundRuntime()` (3) — initialize sound system
- `getCaptureSoundThrottleKey()` (2) — get throttle category for event
- `getCaptureSoundRecipientThrottleKey()` (1) — get throttle per recipient
- `queueCaptureSoundEvent()` (1) — queue sound event for processing
- `captureSoundOnCapturePointStateSample()` (1) — handle state change
- `getCaptureSoundRecipientsForEvent()` (1) — resolve affected players
- `getCaptureSoundHandleForRecipient()` (1) — get SFX handle for player
- `flushCaptureSoundQueue()` (XL~1) — process all queued sounds (plus 1 internal helper)

### src/index/capture-tickets.ts
Module: Phase 2A capture routing, ticket bleed, end checks, and combat HUD dispatch (mega-file ~2,150 lines)
- `clamp01()` (2) — clamp value to 0-1 range
- `shouldCountPlayerAsActiveOnPoint()` (5) — check player activity
- `clearInactiveEngagedObjectiveOwners()` (1) — reset inactive ownership
- `markHudDirty()` (16) — mark HUD for refresh
- `shouldRunCombatHud()` (0) — check if combat HUD active
- `refreshTopHudDerivedSlicesForAllPlayers()` (XL~1) — update HUD for all
- `publishTopHudDerivedSlicesForPid()` (3) — sync HUD values to player
- `ensureTopHudDerivedSlicesForPid()` (1) — ensure HUD cache for player
- `publishDerivedHudSlicesForPid()` (0) — apply HUD state to player
- `conquestShouldTreatPidAsActiveObjectiveOccupant()` (4) — check objective presence
- `shouldRenderEngageForPid()` (2) — check if engage indicator visible
- `getRenderableActiveObjIdForPid()` (2) — get focused objective for player
- `getPerspectiveTeams()` (0) — resolve allied/enemy teams for viewer
- `getOrderedMappedCaptureStates()` (1) — get ordered capture states
- `getTicketBarRatio()` (0) — compute progress bar ratio
- `getTicketLeaderTeam()` (1) — get team with more tickets
- `getBleedChevronCountsForPerspective()` (1) — get bleed indicator count
- `deriveConquestHudHelpReadyViewModel()` (3) — generate help/ready display state
- `deriveConquestHudClockViewModel()` (3) — generate clock display state
- `deriveConquestHudStatusViewModel()` (3) — generate status display state
- `deriveConquestHudEngageViewModel()` (1) — generate engage indicator state
- `computeFlagFillHeight()` (2) — calculate capture fill height
- `shouldFillFromTopForEnemy()` (2) — check fill direction
- `isFlagFullyOwnedForHud()` (2) — check if flag fully captured
- `deriveConquestHudFlagsViewModel()` (1) — generate all flag display states
- `deriveConquestHudActiveFlagPopoutViewModel()` (1) — generate popout state
- `deriveHudViewModelForPlayer()` (1) — generate complete HUD state for player
- `getCenteredFlagSlots()` (1) — get layout-centered flag positions
- `getFallbackFlagToken()` (1) — get fallback flag token
- `getFlagLetterStringKey()` (2) — get flag label key
- `createDefaultFlagVisualState()` (4) — init flag visual state
- `ensureFlagVisualState()` (5) — cache flag visual state
- `normalizeVisualSample()` (1) — normalize visual sample
- `resolveFlagVisualState()` (1) — resolve flag visual state
- `hasVisualStateChanged()` (1) — check if visual state dirty
- `refreshFlagVisualState()` (1) — update flag visual state
- `getFlagSlotVisual()` (2) — get flag slot visual config
- `getFlagPercentDisplay()` (2) — get progress percent display
- `getEngageStatusKey()` (1) — get engage status label key
- `buildHiddenEngageDisplay()` (3) — build engage HUD while hidden
- `getFlagEngageDisplayForViewer()` (1) — get engage state for viewer
- `getMappedConfigsInOrder()` (2) — get ordered capture configs
- `buildMappedCaptureIndexFromConfig()` (2) — build lookup index
- `ensureCaptureState()` (3) — ensure capture state exists
- `resetCaptureTimingConfigCache()` (2) — clear timing cache
- `configureCaptureTimingForPoint()` (4) — configure capture timing
- `applyCaptureTimingForMappedPoints()` (2) — apply timing to all captures
- `resetLiveState()` (1) — reset state on live start
- `resetNotLiveState()` (2) — reset state on pre-live
- `mirrorTicketsToEngineScore()` (3) — sync tickets to engine score
- `getOwnershipCounts()` (2) — count owned captures by team
- `applyTicketDelta()` (2) — apply ticket change
- `tryLatchEnd()` (5) — check if match should end
- `applyBleedTick()` (1) — apply ticket bleed
- `checkEndCondition()` (3) — check end condition
- `onCapturePointTick()` (3) — per-capture ongoing handler
- `resolveAuthoritativeOwnerTeam()` (1) — determine capture owner
- `onCapturePointLost()` (1) — handle capture lost
- `onCapturePointCaptured()` (1) — handle capture won
- `syncMappedCapturePointsFromEngine()` (1) — sync engine state
- `hasOwnerTeamForProgressReset()` (1) — check if progress resets
- `updateConquestCombatHudForAllPlayers()` (XL~9) — update combat HUD for all players
- `refreshLiveCaptureStateSubtick()` (XL~1) — subtick capture refresh
- `onLiveTick()` (L~1) — per-second capture tick (plus 2 internal helpers)

### src/index/capture-vo.ts
Module: Phase 4B isolated objective VO exploration path
- `cleanupAllVoiceOverRuntimeHandles()` (1) — destroy VO handles
- `ensureObjectiveVoState()` (4) — ensure VO state exists
- `clearNonTerminalThrottleForObjective()` (1) — clear throttle
- `transitionObjectiveVoState()` (3) — transition VO state
- `resetCaptureVoQueueState()` (2) — clear VO state
- `captureVoOnNotLiveReset()` (2) — reset VO on pre-live transition
- `captureVoOnMatchLiveStart()` (1) — prime VO on live start
- `captureVoOnPlayerLeaveOrResetPid()` (4) — cleanup player VO state
- `ensureVoiceOverRuntimeForPid()` (1) — ensure VO runtime for player
- `queueCaptureVoEvent()` (4) — queue VO event
- `resolveVoiceOverFlagForObjective()` (1) — get VO flag
- `resolveVoiceOverEventForRecipient()` (1) — resolve VO event
- `markRecentObjectivePresence()` (2) — track objective presence
- `refreshRecentPresence()` (1) — update presence tracking
- `wasRecentlyActiveOnObjective()` (1) — check recent activity
- `getCaptureVoRecipientsForEvent()` (1) — resolve affected players
- `getCaptureVoRecipientThrottleKey()` (1) — get throttle key per recipient
- `captureVoOnCapturePointStateSample()` (1) — handle capture state change
- `onCapturePointLostVoEdge()` (1) — handle capture lost edge
- `onCapturePointCapturedVoEdge()` (1) — handle capture won edge
- `flushCaptureVoiceOverQueue()` (XL~1) — process queued VO events

### src/index/conquest-scaffold.ts
Module: Phase 1 conquest state reset/wiring seam
- `initializeConquestPhase1Scaffold()` (XS~1) — initialize phase 1 scaffold

### src/index/game-mode.ts
Module: mode start loop and top-level initialization
- `onGameModeStartedImpl()` (XS~1) — entry point: init state, build HUD, start spawner, main loop

### src/index/player-deploy.ts
- `deferForcedUndeploy()` (2) — schedule delayed player undeploy
- `onPlayerDeployedImpl()` (M~1) — player spawn handler implementation (v1.418 Ship 8: gate-active branch removed; just initializes per-pid state, calls `renderCriticalHudForReveal`, spawns interact-point)
- `onPlayerUndeployImpl()` (M~1) — player undeploy handler implementation (v1.418 Ship 8: gate-active reassert branch removed)

### src/index/player-join-leave.ts
Module: join/leave lifecycle handlers and join-time UI reset
- `resetUiForPlayerOnJoin()` (1) — reset UI state on player join
- `cleanupHudForPid()` (1) — cleanup HUD for disconnecting player
- `onPlayerJoinGameImpl()` (S~1) — player join handler implementation
- `onPlayerLeaveGameImpl()` (S~1) — player leave handler implementation

### src/index/player-kpi-events.ts
Module: KPI event handler implementations for kills, assists, and capture attribution
- `onPlayerEarnedKillImpl()` (M~1) — record kill event
- `onPlayerEarnedKillAssistImpl()` (M~1) — record kill assist event
- `onCapturePointCapturedKpiImpl()` (M~1) — record capture event

### src/index/player-loop-inputs.ts
- `ongoingPlayerImpl()` (XL~1) — per-player ongoing tick implementation (v1.418 Ship 8: gate enforce/maintain helpers deleted; reduced to deploy-check + interact-point removal/spawn)
- `onPlayerInteractImpl()` (M~1) — player interact handler implementation
- `onPlayerUIButtonEventImpl()` (M~1) — UI button event handler implementation

### src/index/vehicle-events.ts
Module: player vehicle enter/exit and vehicle spawn/destroy handlers
- `onPlayerEnterVehicleImpl()` (M~1) — player vehicle enter handler implementation
- `onPlayerExitVehicleImpl()` (M~1) — player vehicle exit handler implementation
- `onVehicleSpawnedImpl()` (M~1) — vehicle spawn handler implementation
- `onVehicleDestroyedImpl()` (M~1) — vehicle destroy handler implementation

### src/interaction/actions.ts
Module: HUD warm/reveal helpers + lazy-build per-family builders + team-swap orchestration. v1.418 (Ship 8) deleted the loading-gate orchestration; this file shrank from ~745 to ~290 lines.
- `refreshClockForPlayer()` (2) — refresh clock display (called from clock module; widget visibility now always-on post-Ship-8)
- `refreshCombatHudForPlayer()` (0) — refresh combat HUD
- `prebuildTopLeftUiFamilyWhileHidden()` (1) / `prebuildVehicleSpawnerUiFamilyWhileHidden()` (1) / `prebuildCombatHudFamilyWhileHidden()` (1) / `prebuildReadyDialogUiFamilyWhileHidden()` (1) — per-family hidden builders called by the lazy-build dispatcher
- `renderTopLeftUiFamilyImmediate()` (2) / `renderTopLeftUiFamilyForReveal()` (2) / `renderVehicleSpawnerUiFamilyForReveal()` (3) / `armCombatHudFamilyForSchedulerReveal()` (2) / `renderAdminUiFamilyForReveal()` (2) — per-family reveal helpers (called from `renderCriticalHudForReveal` on deploy + ready-dialog close)
- `getPositionDebugWidgetIds()` (1) / `deletePositionDebugWidgetsForPid()` (1) — position debug widget helpers
- `renderCriticalHudForReveal()` (2) — atomic critical HUD reveal (called from `onPlayerDeployedImpl` and ready-dialog close)
- `cleanupConquestHudForTeamSwap()` (1) / `refreshConquestHudAfterTeamSwap()` (1) — team-swap HUD cleanup/refresh
- `forceUndeployPlayer()` (1) — force player undeploy (used by team-swap path)
- `processReadyDialogSelection()` (2) — team-swap action: snap-to-deploy with no overlay (v1.418 Ship 8: removed `beginLoadingGate`/`enforceHudWarmTransitionDeployBlock`/`reassertPlayerUiLoadingGateVisuals`/`runTeamSwapLoadingGate` calls)

### src/interaction/ammo-resupply-menu.ts
Module: gadget locker menu for supply-box interaction (mega-file ~2,769 lines; 59 internal helpers). External callers use `openArmMenu` / `closeArmMenu` / `armRefreshFrame` / `resetArmState` / `resetArmTimers` / `probeLauncherSlot` / `probeSlot` / `slotWithLauncher` / `syncActiveGadgetLockerConfig`. Owns largest per-pid widget cache (M2).

### src/interaction/build-pacer.ts
Module: Wave 3 Ship 1 (v1.409) — global heavy-build mutex + 10Hz Timers.setTimeout drainer. Surface namespace `LazyBuildPacer`. Dormant when queue is empty. No `mod.Wait` anywhere.
- `LazyBuildPacer.tryAcquireHeavyBuildMutex()` (1) — synchronous mutex acquire; returns false when held
- `LazyBuildPacer.releaseHeavyBuildMutex()` (1) — paired release for finally-block use
- `LazyBuildPacer.isHeavyBuildMutexHeld()` (0) / `getHeavyBuildMutexHolderName()` (0) / `getHeavyBuildMutexHolderPid()` (0) — mutex inspection helpers
- `LazyBuildPacer.enqueueBuildOp()` (1) — append paced op + start drainer if dormant
- `LazyBuildPacer.getPendingOpCount()` (0) / `isDrainerActive()` (0) / `getDrainerTickCount()` (0) — drainer telemetry

### src/interaction/hud-warm-state.ts
Module: per-pid ready-dialog state accessor + combat-HUD reveal flag. v1.418 (Ship 8) swept this from 40+ accessors to 5 — the loading-gate machinery is gone.
- `getReadyDialogStateForPid()` (~30) — get ready dialog state for player
- `setCombatHudRevealAllowedForPid()` (1) / `isCombatHudRevealAllowedForPid()` (2) — control combat HUD reveal flag (set true on deploy, read by HUD pipeline)
- `resetReadyDialogSectionSignaturesForPid()` (2) — reset dialog signatures so the next refresh cannot early-out on stale content
- `isHudWarmReadyForPid()` (~11) — always returns `true` (legacy reader kept for backward-compat across clock/help/vehicles/HUD pipeline)
- `isHudSwapTransitionActiveForPid()` (~5) — always returns `false` (legacy reader; team-swap no longer routes through a gated swap transition)

### src/interaction/interact-point.ts
Module: deploy interact-point lifecycle and ready-dialog trigger logic
- `spawnReadyDialogInteractPoint()` (2) — create deploy interact point
- `tryOpenReadyDialogForPlayer()` (2) — open ready dialog if nearby point
- `teamSwitchInteractPointActivated()` (1) — team swap button triggered
- `removeReadyDialogInteractPoint()` (3) — destroy deploy point
- `isVelocityBeyond()` (1) — check if velocity exceeds threshold
- `checkReadyDialogInteractPointRemoval()` (1) — remove point if conditions met
- `initReadyDialogData()` (11) — initialize dialog state

### src/interaction/lazy-build-registry.ts
Module: Wave 3 Ship 1 (v1.409) — per-UI lazy-load config table + dispatch entry point. `const LAZY_BUILD_REGISTRY` covers six surfaces: combatHud, topHudShell, vehicleDeployTimer, supplyBox, readyDialog, boundaryPrompt. No production caller routes through `triggerLazyBuild` yet; ships 2-7 wire per-surface triggers.
- `getLazyBuildConfig()` (0) — return locked config for a surface
- `getLazyBuildSuccessCount()` (0) / `getLazyBuildErrorCount()` (0) / `isLazyBuildInFlight()` (0) — telemetry/in-flight inspection
- `triggerLazyBuild()` (0) — dispatcher; per-surface in-flight guard, mutex acquire (or paced retry), error catch, retry-on-next-call
- internal: `_resolveLazyBuildHandler()`, `_logLazyBuildError()`

### src/interaction/spawn-selector.ts
Module: Phase 1 seam for future conquest spawn selection policy
- `conquestSelectSpawnPoint()` (0) — select spawn point for player (placeholder)

### src/interaction/supply-box-warm-scheduler.ts
Module: Wave 3 Ship 3.5 (v1.412) — staggered LIVE-phase warm of supply box widget tree. 2s/pid cadence, persistent queue with late-joiner enqueue, token-based cancellation.
- `SupplyBoxWarmScheduler.startWarmStaggerForLive()` (1) — kicked off at LIVE start by `conquest-flow.ts:startMatch`; bumps token, snapshots connected pids, schedules first trigger at +2s
- `SupplyBoxWarmScheduler.cancelWarmStagger()` (2) — invoked from `endMatch` and `triggerFreshMatchSetup`; bumps token, clears queue + pending Timers handle
- `SupplyBoxWarmScheduler.enqueueLateJoiner()` (1) — invoked from `onPlayerJoinGameImpl`; appends pid to queue tail when LIVE active; restarts chain if drained
- `SupplyBoxWarmScheduler.isWarmStaggerActive()` (0) — read-only telemetry helper
- internal: `scheduleNext()`, `collectConnectedPidsOrdered()`

### src/interaction/types.ts
(no functions; types/constants only)

### src/interaction/ui-events-player-ready-panel.ts
Module: Wave 4 Ship 5 (v1.429) — sibling button router for the non-admin Player Ready Up Panel (per L15). Independent debounce tracker so panel + dialog click windows don't cross-cancel.
- `tryConsumePlayerReadyPanelPrimaryClickEvent()` (1) — consume panel click via own per-pid tracker
- `tryHandlePlayerReadyPanelPrimaryAction()` (3) — match a single panel button by id and run its action with debounce
- `closePlayerReadyPanelForViewer()` (1) — hide panel widgets + restore game cursor
- `tryHandlePlayerReadyPanelButtonEvent()` (1 — `ui-events.ts` dispatcher) — top-level: CLOSE / READY / CHANGE TEAMS / SPECTATE-COACH (no-op claim)

### src/interaction/ui-events-ready.ts
Module: ready-dialog and admin-panel toggle button handlers
- `tryConsumeReadyDialogPrimaryClickEvent()` (4) — consume ready dialog click
- `tryHandleReadyDialogPrimaryAction()` (7) — handle ready dialog primary action
- `handleReadyDialogGridKnobClick()` (2) — handle grid knob click
- `handleReadyDialogReadyButtonClick()` (2 — own dispatcher + Ship 5 panel router) — handle ready button click
- `tryHandleReadyDialogButtonEvent()` (1) — handle button event

### src/interaction/ui-events.ts
Module: dispatcher for ready-dialog and admin-panel button handlers
- `teamSwitchButtonEvent()` (1) — handle team switch button; v1.429 added `tryHandlePlayerReadyPanelButtonEvent` call after the dialog handler

### src/interaction/ui-primary-click.ts
Module: shared primary-click dedupe helpers for UI buttons
- `isUIButtonPrimaryClickEvent()` (1) — check if primary click event
- `getUIButtonPrimaryClickPhase()` (1) — get click phase
- `shouldConsumeUIButtonPrimaryClick()` (1) — check if should consume click
- `tryConsumeUIButtonPrimaryClickEvent()` (2) — consume click event

### src/interaction/world-interactables.ts
Module: per-team HQ WorldIcons (pre-game only) and runtime-spawned smoke markers
- `isSupplyBoxWorldInteractable()` (4) — check if interactable is supply box
- `isSupplyBoxesEnabled()` (6) — check if supply boxes enabled
- `getWorldInteractableRuntimeIconTextKey()` (1) — get icon text key
- `getWorldInteractableRuntimeIconStyle()` (1) — get icon style
- `hideAuthoredWorldInteractableIconPresentation()` (1) — hide authored icon
- `isWorldInteractableDisabledByLive()` (3) — check if disabled by live
- `shouldEnableWorldInteractableAuthoredInteractPoint()` (1) — check if interactable
- `applyWorldInteractableAuthoredInteractPointState()` (3) — apply interactable state
- `shouldShowWorldInteractableRuntimeIconForPlayer()` (1) — check if should show icon
- `shouldAllowWorldInteractableActivationForPlayer()` (1) — check if can activate
- `getWorldInteractableIconHandleForTeam()` (1) / `setWorldInteractableIconHandleForTeam()` (1) — team icon handle accessors
- `resolveWorldInteractableIconPosition()` (1) — resolve icon position
- `ensureMainBaseTeamIconForPlayer()` (1) — ensure HQ icon for player
- `syncWorldInteractableRuntimeIconForPlayer()` (1) / `syncWorldInteractableRuntimeIconsForPlayer()` (4) / `syncWorldInteractableRuntimeIconsForAllPlayers()` (0) — sync icons
- `cleanupMainBaseTeamWorldIconsForLiveTransition()` (1) — cleanup icons on live
- `spawnWorldInteractableVfxForActiveConfigs()` (2) — spawn VFX for HQ
- `cleanupWorldInteractableVfx()` (2) — cleanup VFX
- `refreshDisableOnLiveInteractableStateForLiveTransition()` (1) — refresh on live
- `despawnWorldInteractableVfxForObjId()` (2) — despawn VFX by object ID
- `ensureWorldInteractableVfxForConfig()` (1) — ensure VFX for config
- `refreshSupplyBoxInteractableStateFromConfirmedConfig()` (1) — refresh supply state
- `forceCloseAllOpenSupplyBoxMenus()` (1) — close all supply menus
- `refreshWorldInteractableVfx()` (1) — refresh all VFX
- `cleanupWorldInteractableRuntimeIconsForPid()` (3) — cleanup icons for player
- `cleanupActiveWorldInteractableRuntimeIconsForAllPlayers()` (1) — cleanup all icons
- `configureWorldInteractablePresentation()` (1) — configure presentation
- `configureActiveWorldInteractables()` (2) — configure interactables
- `ensureActiveWorldInteractablesReady()` (L~2) — ensure ready
- `tryHandleWorldInteractableActivation()` (1) — handle interactable activation

### src/kpi/kpi-state.ts
Module: per-player KPI tracking: kills, deaths, assists, captures, computed score
- `kpiInitForPid()` (9) — initialize KPI state for player
- `kpiRecalcScore()` (5) — recalculate computed score
- `kpiRecordKill()` (M~1) / `kpiRecordDeath()` (M~0) / `kpiRecordAssist()` (M~1) / `kpiRecordCapture()` (M~1) — record events
- `kpiInitWithBaselineForPlayer()` (S~1) — initialize with baseline from player
- `kpiCleanupForPid()` (1) — cleanup KPI state for player
- `kpiResetAll()` (2) — reset all KPI state
- `kpiSnapshotDeathBaselines()` (2) — snapshot death baseline

### src/kpi/scoreboard-tab.ts
Module: custom two-team tab scoreboard configuration and per-player value sync
- `configureScoreboard()` (1) — configure scoreboard columns and sorting
- `updateScoreboardForPlayer()` (2) — update scoreboard for player
- `updateScoreboardForAllPlayers()` (1) — update scoreboard for all
- `updateScoreboardTeamScores()` (1) — update team score values
- `scoreboardSyncTick()` (L~1) — per-second scoreboard sync tick

### src/ready-dialog/auto-start.ts
- `tryAutoStartMatchIfAllReady()` (S~2) — start match if all players ready

### src/ready-dialog/countdown-flow.ts
- `cancelPregameCountdown()` (1) — cancel countdown sequence
- `undeployAllDeployedPlayers()` (1) — undeploy all deployed players
- `startPregameCountdown()` (2) — start countdown sequence
- `isPregameCountdownStillValid()` (4) — check if countdown still valid
- `getPregameCountdownColor()` (1) — get countdown color
- `animatePregameCountdownSize()` (1) — animate countdown size
- `runPregameCountdown()` (S~1) — execute countdown animation

### src/ready-dialog/dialog-build-mode-config.ts
- `buildReadyDialogGridText()` (5) — build grid text widget
- `buildReadyDialogGridKnobRow()` (3) — build knob row
- `buildReadyDialogConfigCheckboxRow()` (1) — build checkbox row
- `buildReadyDialogConfigColumn()` (1) — build config column
- `buildReadyDialogModeConfigSection()` (1) — build mode config section

### src/ready-dialog/dialog-build-roster.ts
- `buildReadyDialogRosterSection()` (1) — build roster panel

### src/ready-dialog/dialog-build-sections.ts
- `buildReadyDialogHeaderAndMapSection()` (1) — build header/map section
- `buildReadyDialogBottomButtonsSection()` (1) — build button section

### src/ready-dialog/dialog-build.ts
- `refreshReadyDialogSectionsForReveal()` (2) — refresh sections for reveal
- `finalizeReadyDialogVisibility()` (3) — finalize dialog visibility
- `markReadyDialogLayoutBuilt()` (3) — mark layout as built
- `refreshReadyDialogSectionsWhileHidden()` (1) — refresh while hidden
- `refreshReadyDialogSectionsForWarmPrime()` (3) — refresh for warm prime
- `ensureReadyDialogUiBuiltHidden()` (4) — ensure UI built while hidden
- `showReadyDialogUI()` (3) — show dialog UI
- `createReadyDialogUI()` (1) — create dialog UI

### src/ready-dialog/lifecycle.ts
- `getReadyDialogChromeWidgetIds()` (2) / `getReadyDialogAdminToggleWidgetIds()` (1) — widget ID getters
- `setReadyDialogWidgetGroupVisible()` (2) / `deleteReadyDialogWidgetGroup()` (1) — group operations
- `setReadyDialogChromeVisible()` (1) / `setReadyDialogAdminToggleVisible()` (1) — chrome/admin visibility
- `deleteReadyDialogChromeWidgets()` (1) — delete chrome widgets
- `resetReadyDialogAdminFamily()` (1) — reset admin family
- `hideReadyDialogUI()` (11) / `closeReadyDialogForAllPlayers()` (1) / `destroyReadyDialogUI()` (3) — close/destroy
- `invalidateHiddenReadyDialogCacheForPid()` (1) / `invalidateHiddenReadyDialogCacheForAllPlayers()` (1) — cache invalidation
- `refreshBuiltReadyDialogCachesForAllPlayers()` (2) — refresh caches for all
- `refreshOrEnsureReadyDialogHiddenForPid()` (0) — refresh or ensure for player
- `isReadyDialogUiCacheUsableForPid()` (6) — check if cache usable

### src/ready-dialog/loading-overlay.ts
Module: DELETED in Wave 3 Ship 8 (v1.418). File is now a stub; not in bundle. Loading-overlay UX gone with the loading gate; players snap to deploy screen on first-join and team-swap.

### src/ready-dialog/matchup-summary.ts
- `updateTeamNameWidgetsForPid()` (1) / `updateTeamNameWidgetsForAllPlayers()` (1) — team name updates
- `updateMatchupLabelForAllPlayers()` (1) — update matchup label for all
- `buildAutoStartMinPlayerCounts()` (2) / `getAutoStartMinPlayerCounts()` (3) / `getReadyDialogDraftAutoStartMinPlayerCounts()` (3) — min-player config helpers
- `updateMatchupReadoutsForAllPlayers()` (0) — update readouts for all
- `setAutoStartMinActivePlayers()` (1) — set min active player count
- `applyMatchupPresetInternal()` (1) / `applyMatchupPreset()` (0) — preset apply

### src/ready-dialog/mode-config-aircraft-ceiling.ts
- `disableCustomAircraftCeilingAndRestoreDefault()` (1) — disable custom ceiling
- `syncAircraftCeilingFromMapConfig()` (1) — sync ceiling from config

### src/ready-dialog/mode-config-presets.ts
- `getReadyDialogConfirmedAutoStartMinActivePlayers()` (2) — get confirmed min players
- `buildReadyDialogModeConfigDiffState()` (3) — build config diff
- `isReadyDialogModeConfigDirtyForKnobKey()` (4) — check if config dirty
- `isReadyDialogGameModeCustom()` (4) — check if mode custom
- `getReadyDialogPresetPlayersPerSide()` (4) — get preset player count
- `shouldApplyCustomCeilingForGameMode()` (0) / `shouldApplyCustomCeilingForConfig()` (0) — custom ceiling check
- `requireReadyReconfirmAfterConfigChange()` (10) — check if require reconfirm
- `ensureCustomGameModeForManualChange()` (8) — ensure custom mode for change
- `isReadyDialogModePresetActive()` (1) — check if preset active
- `applyReadyDialogModePresetForGameMode()` (1) — apply preset for mode
- `resetReadyDialogModeConfigToDefaults()` (1) — reset to defaults
- `setReadyDialogGameModeIndex()` (1) / `setReadyDialogAircraftCeiling()` (0) / `setReadyDialogVehicleSelectionIndexByKey()` (1) — knob setters
- `toggleReadyDialogVanillaDeployCheckbox()` (1) / `toggleReadyDialogHqDeployCheckbox()` (1) / `toggleReadyDialogAirDeployCheckbox()` (1) / `toggleReadyDialogForwardDeployCheckbox()` (1) / `toggleReadyDialogSupplyBoxesCheckbox()` (1) — checkbox toggles
- `confirmReadyDialogModeConfig()` (S~1) — confirm config changes (the original #105 warm-prime guard was deleted in v1.418 Ship 8 along with `warmPrimeActiveByPid`; the lazy-build dispatcher's per-surface in-flight guard is the new line of defense)
- `forceUnreadyApplierAfterConfirm()` (1) — force unready after confirm

### src/ready-dialog/mode-config-readout.ts
- `buildReadyDialogMapSignature()` (1) — build map signature display
- `updateReadyDialogMapLabelForPid()` (5) / `updateReadyDialogMapLabelForAllPlayers()` (1) — map label
- `updateReadyDialogGridColumnHeaderForPid()` (1) / `updateReadyDialogGridKnobLabelForPid()` (1) / `updateReadyDialogGridKnobValueForPid()` (3) — knob labels
- `setReadyDialogGridKnobValueColorForPid()` (4) — set value color
- `updateReadyDialogGridSupportForPid()` (1) — update grid support
- `setReadyDialogGridKnobButtonsVisibleForPid()` (2) / `setReadyDialogGridKnobRowVisibleForPid()` (2) — visibility
- `setReadyDialogGridColumnHeaderColorForPid()` (1) — set header color
- `setReadyDialogGridKnobPanelThemeForPid()` (2) / `setReadyDialogGridKnobButtonGlyphColorForPid()` (2) — theme/glyph
- `syncReadyDialogModeActionWidgetsForPid()` (1) — sync action widgets (renders apply-blocked label #105). v1.435 (Ship 7): added GIVE UP ADMIN live-disable styling (greyed + SetUIButtonEnabled(false) when match is live), mirroring RESET treatment
- `getReadyDialogViewerTeamVisuals()` (1) / `getReadyDialogPlayersValueMessage()` (1) / `getReadyDialogMinPlayersSupportMessage()` (1) — visual lookups
- `buildReadyDialogModeConfigSignature()` (1) — build mode signature
- `updateReadyDialogModeConfigForPid()` (7) — update mode config for player
- `isReadyDialogConfigCheckboxChecked()` (1) — check if checkbox checked
- `updateReadyDialogConfigCheckboxesForPid()` (1) — update checkboxes for player
- `updateReadyDialogModeConfigForAllVisibleViewers()` (22) / `updateReadyDialogModeConfigForAllHiddenBuiltCaches()` (3) — broadcast updates

### src/ready-dialog/mode-config-schema.ts
- `getReadyDialogModeGridColumnSpecs()` (2) — get column specifications
- `getReadyDialogModeGridColumnHeaderMessage()` (2) — get column header message
- `getReadyDialogModeGridSupportPlaceholder()` (1) — get support placeholder
- `getReadyDialogModeGridAllKnobKeys()` (1) — get all knob keys
- `isReadyDialogModeGridPlaceholderKnobKey()` (4) — check if placeholder key

### src/ready-dialog/pregame-ui.ts
- `getPregameCountdownDelayValueForIndex()` (1) — get countdown delay value
- `ensureCountdownUIAndGetWidget()` (3) — ensure countdown UI
- `setPregameCountdownVisualForAllPlayers()` (2) / `setPregameCountdownSizeForAllPlayers()` (1) — set visuals
- `invalidateCountdownWidgetCacheForAllPlayers()` (1) — invalidate cache
- `ensurePregameCountdownDelayLineWidgetsForPlayer()` (1) — ensure delay line
- `showPregameCountdownDelayLineForAllPlayers()` (4) — show delay line
- `hidePregameCountdownForAllPlayers()` (6) — hide countdown

### src/ready-dialog/ready-reset.ts
- `resetReadyStateForAllPlayers()` (1) — reset ready state for all

### src/ready-dialog/roster-active.ts
- `getActivePlayers()` (3) — get list of active players
- `buildRosterDisplayEntries()` (2) / `getRosterDisplayEntries()` (3) — roster entry getters
- `getRosterEntryNameMessage()` (4) — get entry name message
- `areAllActivePlayersReady()` (3) — check if all ready

### src/ready-dialog/roster-render.ts
- `applyReadyDialogRowColors()` (4) / `applyReadyDialogViewerTeamColors()` (1) — color appliers
- `buildReadyDialogRosterSignature()` (1) — build roster signature
- `renderReadyDialogForViewer()` (2) / `renderReadyDialogForAllVisibleViewers()` (12) — render
- `refreshReadyDialogRosterForViewer()` (6) — refresh roster for viewer
- `syncReadyToggleButtonWidgetsForPid()` (6) / `updateReadyToggleButtonForViewer()` (3) / `updateReadyToggleButtonsForAllBuiltReadyDialogs()` (3) — toggle button updates
- `refreshReadyStatusForAllBuiltReadyDialogs()` (6) — refresh status for all

### src/ready-dialog/player-ready-panel.ts
Module: Wave 4 Ship 2 (v1.423) — Player Ready Up Panel skeleton (built lazily on first triple-tap by non-admins via Ship 3 routing).
- `getPlayerReadyPanelWidgetIds()` (3) — internal helper; returns the list of widget IDs owned by the panel for show/hide/destroy iteration
- `prebuildPlayerReadyPanelHidden()` (1 — registry dispatcher) — builds the widget tree hidden; idempotent; ~17 widgets
- `refreshPlayerReadyPanelContentForPid()` (3 — `showPlayerReadyPanelForPid` + Ship 5 button router + Ship 6 broadcast) — Ship 4 (v1.428): reads live state and updates the 3 dynamic labels (Game Host / Game Admin / ready status) via safeSetUITextLabel; live-Player as format arg if pid connected, else unknownPlayer fallback. Ship 5 polish (v1.430): also calls `syncPlayerReadyPanelReadyButtonForPid` to update the READY button label. Ship 6 (v1.431): also calls `syncPlayerReadyPanelClaimAdminButtonForPid` to flip CLAIM ADMIN visibility.
- `syncPlayerReadyPanelReadyButtonForPid()` (1 — `refreshPlayerReadyPanelContentForPid`) — Ship 5 polish (v1.430): toggles READY button label between READY/NOT READY based on `State.players.readyByPid`; greys + disables button when match is live (mirrors roster-render `syncReadyToggleButtonWidgetsForPid`)
- `syncPlayerReadyPanelClaimAdminButtonForPid()` (1 — `refreshPlayerReadyPanelContentForPid`) — Ship 6 (v1.431): toggles CLAIM ADMIN button + border + label visibility together based on `Admin.isAdminVacant()` (per L17 / D4)
- `refreshAllVisiblePlayerReadyPanels()` (3 — `Admin.onPlayerLeave` + Ship 6 CLAIM/GIVE-UP handlers) — Ship 6 (v1.431): broadcast helper; iterates connected pids and refreshes every panel whose container exists (built or built-but-hidden) so Game Admin row + CLAIM ADMIN visibility stay in lock-step across all viewers after admin transitions
- `showPlayerReadyPanelForPid()` (1 — Ship 3 router) — Ship 4: refreshes dynamic content first, then flips visibility on every cached widget
- `hidePlayerReadyPanelForPid()` (0 — Ship 5+) — flips visibility off (cache survives until disconnect)
- `destroyPlayerReadyPanelForPid()` (1 — `cleanupHudForPid`) — hard cleanup on player leave; iterates widget IDs and DeleteUIWidget each

### src/ready-dialog/swap-action.ts
- `swapPlayerTeam()` (S~2) — swap player to other team

### src/ready-dialog/takeoff-gating.ts
- `isPlayerInMainBaseForReady()` (6) — check if player at HQ
- `checkTakeoffLimitForAllPlayers()` (L~1) — enforce takeoff limits

### src/state/core.ts
- `setUIInputModeForPlayer()` (15) — set UI input mode
- `isMatchLive()` (64) — check if match is live
- `getSecondsSinceLive()` (7) — get seconds since live start
- `isRoundStartAirDelayActive()` (2) / `isRoundStartAirDeployDelayActive()` (3) / `isRoundStartForwardDeployDelayActive()` (3) / `isRoundStartGadgetDelayActive()` (2) — round-start delay checks
- `getRoundStartAirDelayRemainingSeconds()` (2) / `getRoundStartGadgetDelayRemainingSeconds()` (1) — delay remaining accessors
- `hasPlayersOnTeam()` (1) — check if team has players
- `sendHighlightedWorldLogMessage()` (16) — send highlighted world log message
- `endGameModeForTeamNum()` (1) — end game mode for team

### src/state/hud-cache-types.ts
(no functions; types/constants only — owns M1, M2, M4, M5, M6 cache shapes)

### src/state/id-helpers.ts
Module: object/player/team guards and safe widget lookup
- `isValidPlayer()` (162) — type-predicate guard `p is mod.Player` (v1.401–v1.405 helper)
- `getObjId()` (10) / `safeGetObjId()` (9) — get object ID
- `safeGetPlayerId()` (83) — safely get player ID
- `safeGetVehicleFromPlayer()` (0) / `safeGetPlayerVehicleSeat()` (2) — vehicle accessors
- `isPidDisconnected()` (15) — check if player disconnected
- `getTeamNumber()` (10) / `safeGetTeamNumberFromPlayer()` (32) — team number
- `isPlayerDeployed()` (22) — check if player deployed
- `safeGetSoldierStateBool()` (12) / `safeGetSoldierStateVector()` (8) — soldier state safe accessors
- `getTeamNameKey()` (24) — get team name key
- `getUiSafePlayerPidMessage()` (1) / `getUiSafePlayerMessage()` (1) — UI-safe message helpers
- `safeFind()` (323) — safely find element

### src/state/lifecycle-guardrails.ts
- `applyLegacyLifecycleSnapshot()` (3) — apply legacy state snapshot
- `lifecycleSetNotReadyBaseline()` (2) / `lifecycleSetLiveBaseline()` (1) / `lifecycleTrySetGameOver()` (1) — lifecycle baselines

### src/state/player-iteration.ts
- `forEachValidPlayer()` (24) — iterate valid players (v1.217 shared helper)

### src/state/player-lookup.ts
- `safeFindPlayer()` (18) — safely find player by ID (v1.190 hot-path helper)

### src/state/runtime-state.ts
(no functions; types/constants only — `State` singleton)

### src/state/runtime-types.ts
(no functions; types/constants only — owns `GameState`, `VehicleSpawnerSlot`, M1/M4/M7/M9/M11)

### src/state/runtime.ts
(no functions; composition shim)

### src/state/spawn-charge.ts
- `newReasonCounterState()` (2) — create new counter state
- `incrementReasonCounter()` (2) — increment counter
- `getReasonCode()` (1) — get reason code
- `getReasonCounterTotal()` (2) — get total counter
- `maybeEmitDebugSnapshot()` (4) — emit debug snapshot
- `ensureDeployTxn()` (1) — ensure deploy transaction
- `resolvePendingReason()` (1) — resolve pending reason
- `markNextDeployReason()` (4) — mark next deploy reason
- `clearPidSessionState()` (2) — clear player session state
- `trackIdentityFallbackCounters()` (1) — track fallback counters
- `resetSpawnChargeState()` (2) — reset spawn charge state
- `spawnChargeOnMatchLiveStart()` (1) / `spawnChargeOnNotLiveReset()` (2) — phase transitions
- `onPlayerJoinSpawnCharge()` (1) / `onPlayerLeaveSpawnCharge()` (1) — player lifecycle
- `onPlayerDeployedSpawnCharge()` (1) — on player deployed (charge gate)

### src/state/tick-context.ts
- `beginTickContext()` (1) / `endTickContext()` (2) / `getActiveTickContext()` (1) — per-tick `mod.AllPlayers()` cache helpers (v1.220)

### src/state/ui-helpers.ts
- `wn()` (215) — generate widget name (factory; v1.190 used by 230+ sites)
- `addOutlinedButton()` (20) — add outlined button
- `normalizeParseUITextConfigNode()` (3) — normalize UI config
- `safeParseUI()` (31) — safely parse UI XML
- `addCenteredButtonText()` (8) — add centered button text
- `addReadyDialogText()` (39) / `addReadyDialogCenteredText()` (11) — ready dialog text
- `applyReadyDialogLabelTextColor()` (0) / `applyAdminPanelLabelTextColor()` (2) — color appliers
- `buildReadyDialogButtonSignature()` (1) — build button signature
- `refreshReadyDialogButtonTextForPid()` (0) — refresh button text

### src/strings/ui-ids.ts
(no functions; types/constants only)

### src/types.ts
(no functions; types/constants only)

### src/ui/branding/top-left.ts
- `deleteAllBrandingWidgetsByName()` (27) — delete branding widgets
- `applyTopLeftBrandingDepthForPid()` (1) — apply branding depth
- `buildConquestBrandingTopLeftWidgets()` (1) — build branding widgets
- `buildConquestStaticStatusLaneWidgets()` (1) — build status lane

### src/ui/conquest/hud-core/build.ts
Module: build/repair owner for hard-cut combat HUD root graph (mega-file ~1,116 lines)
- `twlConquestHudEnsureContainer()` (23) — ensure HUD container
- `twlConquestHudApplySolidSurfaceStyle()` (11) — apply surface style
- `twlConquestHudEnsureText()` (15) — ensure text widget
- `twlConquestHudEnsureShadowRingText()` (11) — ensure shadow text (4-widget stack per glyph)
- `twlConquestHudEnsureImage()` (4) — ensure image widget
- `twlConquestHudEnsurePlayerGraph()` (4) — ensure full player HUD graph (M3 owner)

### src/ui/conquest/hud-core/constants.ts
- `twlConquestHudGetLayoutFlagCount()` (2) — get flag count
- `twlConquestHudBuildTicketLayout()` (3) — build ticket layout
- `twlConquestHudGetTicketBlueTeamLabelRootX()` (3) / `twlConquestHudGetTicketRedTeamLabelRootX()` (4) — team label X
- `twlConquestHudBuildShadowRingProfile()` (8) — build shadow profile

### src/ui/conquest/hud-core/lifecycle.ts
- `twlConquestHudDeleteAllByName()` (53) — delete HUD by name
- `twlConquestHudHideShadowRing()` (16) / `twlConquestHudDeleteShadowRingByBaseName()` (11) — shadow ring ops
- `twlConquestHudSetRootParked()` (3) — park HUD root
- `twlConquestHudHidePlayer()` (8) / `twlConquestHudHideRootOnly()` (3) / `twlConquestHudRevealRootOnly()` (1) — visibility ops
- `twlConquestHudHideObjectiveFocusForPid()` (3) — hide objective focus
- `twlConquestHudHideAllPlayers()` (5) — hide all player HUDs
- `twlConquestHudDestroyPlayer()` (6) / `twlConquestHudDestroyAllPlayers()` (1) — destroy HUDs

### src/ui/conquest/hud-core/names.ts
Module: deterministic widget IDs (38 internal helper-name generators; no externally-callable surface beyond them)

### src/ui/conquest/hud-core/pipeline.ts
- `twlConquestHudBootRuntime()` (0) — bootstrap HUD runtime
- `twlConquestHudRecoverEntry()` (2) — recover HUD entry
- `twlConquestHudFailSafeOff()` (3) — fail-safe off
- `twlConquestHudProcessPlayerFrame()` (2) — process player frame
- `twlConquestHudPrimePlayerFrame()` (2) — prime player frame
- `twlConquestHudTickFrame()` (XL~1) — tick frame (gated by hudDirty per AGENTS.md contract)
- `twlConquestHudTickAnimation()` (XL~1) — tick animation (not gated; time-variant)

### src/ui/conquest/hud-core/render.ts
- `twlConquestHudClamp01()` (5) — clamp to 0-1
- `twlConquestHudRenderShadowRingText()` (22) — render shadow text
- `twlConquestHudGetFlagLetter()` (3) / `twlConquestHudGetFlagLetterStringKey()` (2) — flag letter helpers
- `twlConquestHudGetMappedRowByObjId()` (1) — get mapped row
- `twlConquestHudResolveObjectiveLabelLetter()` (2) — resolve label letter
- `twlConquestHudGetPerspectiveTeamsForPlayer()` (1) — get perspective teams
- `twlConquestHudBuildFallbackObjectives()` (1) — build fallback objectives
- `twlConquestHudBuildSnapshotForPlayer()` (2) — build player snapshot
- `twlConquestHudGetColorForTeam()` (1) — get team color
- `twlConquestHudRenderPlayerFrame()` (3) — render player frame

### src/ui/conquest/hud-core/state.ts
- `twlConquestHudEnsureEntry()` (1) — ensure cache entry
- `twlConquestHudGetEntry()` (9) — get cache entry
- `twlConquestHudRemoveEntry()` (1) — remove cache entry
- `twlConquestHudForEachEntry()` (4) — iterate entries
- `twlConquestHudResetSchedulerState()` (5) — reset scheduler
- `twlConquestHudHasBootstrapPurgeDone()` (1) / `twlConquestHudMarkBootstrapPurgeDone()` (1) / `twlConquestHudResetBootstrapPurge()` (1) — bootstrap purge tracking
- `twlConquestHudClearAllEntries()` (2) — clear all entries

### src/ui/conquest/hud-core/toggle.ts
- `twlConquestHudGetMode()` (0) / `twlConquestHudSetMode()` (0) — mode getter/setter

### src/ui/conquest/hud-core/types.ts
(no functions; types/constants only)

### src/ui/conquest/hud-core/validate.ts
- `twlConquestHudWidgetHasParent()` (35) / `twlConquestHudWidgetHasAnchor()` (4) / `twlConquestHudWidgetHasPosition()` (11) — widget property checks
- `twlConquestHudValidateCriticalRefs()` (1) — validate critical refs

### src/ui/conquest/top-hud-shell.ts
Module: dedicated non-combat top HUD shell ensure/cache owner (M4)
- `deleteAllTopHudShellWidgetsByName()` (8) — delete top HUD widgets
- `getTopHudShellRefsForPid()` (7) — get top HUD refs
- `bindTopHudShellRefsByName()` (3) — bind top HUD refs
- `hasTopLeftHudShellRefs()` (3) / `hasCriticalTopHudShellRefs()` (0) — ref presence checks
- `purgeTopHudShellArtifactsForPid()` (1) — purge artifacts
- `buildHudTeamSwapButton()` (3) / `bindHudTeamSwapRefsByName()` (3) / `deleteHudTeamSwapWidgetsForPid()` (1) — team swap button
- `updateHudTeamSwapButtonVisibilityForPid()` (5) / `updateHudTeamSwapButtonVisibilityForAllPlayers()` (4) — team swap visibility
- `ensureTopHudShellForPlayer()` (7) — ensure shell for player

### src/ui/dialog/victory-build.ts
- `bindVictoryDialogRefsByName()` (2) — bind victory dialog refs
- `buildVictoryDialogWidgets()` (1) — build victory dialog

### src/ui/dialog/victory.ts
- `getElapsedHmsParts()` (1) — get elapsed time parts
- `updateVictoryDialogRosterSizing()` (1) — update roster sizing
- `updateVictoryDialogForPlayer()` (4) / `updateVictoryDialogForAllPlayers()` (2) — update

### src/ui/ready/ready-line.ts
- `deleteAllTopCenterAuxWidgetsByName()` (7) — delete aux widgets
- `buildConquestTopCenterAuxWidgets()` (1) — build aux widgets

### src/utils/main-base.ts
- `IsPlayerInOwnMainBase()` (3) — check if player in own HQ

### src/utils/multi-click.ts
(no functions; types/constants only)

### src/vehicles/air-spawn-volume.ts
- `sampleRandomPointInAirVolume()` (1) — sample random air point
- `pickAirVolumeForTeam()` (1) — pick air volume for team
- `sampleAirSpawnTransformForSlot()` (1) — sample air spawn transform
- `seedNextAirTransformForSlot()` (3) — seed next air transform

### src/vehicles/array-helpers.ts
- `arrayContainsVehicle()` (2) — check if vehicle in array
- `arrayRemoveVehicle()` (4) — remove vehicle from array

### src/vehicles/deploy-live-menu.ts
- `isVehicleDeployLiveMenuOpenForPid()` (5) — check if menu open
- `setVehicleDeployLiveMenuVisibleForPid()` (3) — show/hide menu
- `resetVehicleDeployLiveMenuStateForPid()` (2) — reset menu state
- `closeVehicleDeployLiveMenuForPlayer()` (5) — close menu for player
- `tryOpenVehicleDeployLiveMenuForPlayer()` (1) — try open menu

### src/vehicles/deploy-timer-ui.ts
Module: Firestorm helicopter deploy/live timer display with direct spawn buttons (mega-file ~2,059 lines; 58 internal helpers). External callers use `updateVehicleDeployTimerHudForAllPlayers` / `prebuildVehicleDeployTimerHudHiddenForPlayer` / `revealVehicleDeployTimerHudForPlayer` / `buildVehicleDeployTimerRenderPlan` / `applyVehicleDeployTimerRenderPlanContent`. Owns largest per-pid widget cache (M1).

### src/vehicles/forward-spawn-volume.ts
- `pickForwardVolumeForTeam()` (1) — pick forward volume
- `sampleForwardSpawnTransformForSlot()` (1) — sample forward spawn
- `seedNextForwardTransformForSlot()` (3) — seed next forward

### src/vehicles/hq-deploy.ts
- `isHqDeployMode()` (4) / `isForwardDeployEnabled()` (1) / `isAirDeployEnabled()` (1) — mode/feature gates
- `requestHqVehicleSpawn()` (2) — request HQ spawn
- `findSlotForHqClaim()` (6) — find slot for HQ claim
- `scheduleHqClaimTimeout()` (3) — schedule HQ claim timeout
- `requestForwardVehicleSpawn()` (1) — request forward spawn
- `requestAirVehicleSpawn()` (1) — request air spawn
- `onHqVehicleSpawnedForClaim()` (1) — HQ vehicle spawned
- `beginHqSeatFlow()` (1) — begin HQ seating
- `onHqSeatPendingPlayerDeployed()` (1) — HQ seat player deployed (post-seat Teleport pattern v1.333/v1.334)
- `onForwardSpawnSuccess()` (3) / `onAirSpawnSuccess()` (3) — spawn success hooks

### src/vehicles/ownership.ts
- `getVehicleId()` (2) — get vehicle ID
- `setLastDriver()` (1) / `popLastDriver()` (1) / `clearLastDriverByVehicleObjId()` (1) — last-driver tracking

### src/vehicles/registration.ts
- `registerVehicleToTeam()` (2) — register vehicle to team
- `clearSpawnBaseTeamCache()` (1) — clear team cache

### src/vehicles/spawn-volume-math.ts
- `triangleAreaXZ()` (3) — calculate triangle area
- `samplePointInTriangle()` (3) — sample point in triangle
- `volumeQuadAreaXZ()` (2) — calculate quad area
- `sampleRandomFloorPointInVolume()` (2) — sample random point

### src/vehicles/spawner-budget.ts
- `countPersistentVehicleSpawners()` (1) — count active spawners
- `auditSpawnerBudgetAtRoundStart()` (XS~1) — audit spawner budget

### src/vehicles/timers.ts
- `getVehicleSlotRespawnRemainingSeconds()` (4) — get respawn time
- `refreshVehicleSlotAuthoritativeState()` (1) — refresh slot state

### src/vehicles/vanilla-spawner.ts
Module: serial dispatch + Clocks-based respawn (v1.258 rewrite)
- `enqueueDispatch()` (8) — enqueue spawn request (mutex-serialized)
- `configureVehicleSpawner()` (3) — configure spawner
- `findVehicleById()` (8) — find vehicle by ID
- `isVanillaDeployMode()` (4) — check if vanilla mode
- `clearVehicleReservationForPid()` (2) — clear reservation
- `sinkAndDestroyVehicle()` (5) — destroy vehicle (canonical wrapper v1.276)
- `revealVehicleSpawnerUiAfterStartup()` (1) — reveal spawner UI
- `startVanillaVehicleSpawnerSystem()` (XS~1) — start spawner system
- `addVanillaSpawnerSlot()` (2) — add spawner slot (initializes 11 dead `VehicleSpawnerSlot` fields — Tier A1)
- `doDispatch()` (1) — execute dispatch (forward/air branches early-return v1.333/v1.334)
- `forceSpawnAndAwaitBind()` (2) — force spawn and bind
- `bindSpawnedVehicleToExpectingSlot()` (1) — bind spawned vehicle (`OnVehicleSpawned` (engine) callback)
- `onSlotVehicleDestroyed()` (1) — vehicle destroyed
- `startRespawnCountdown()` (1) — start respawn timer (`Clocks.CountDownClock`)
- `setSpawnerSlotEnabled()` (2) — enable/disable slot
- `applySpawnerEnablementForMatchup()` (5) — apply enablement
- `resetVehicleSlotsAtCountdownStart()` (1) — reset slots

### src/vehicles/vehicle-classification.ts
- `isAircraftVehicleType()` (8) / `isJetVehicleType()` (2) / `isTankVehicleType()` (0) — type-level checks
- `isAircraftVehicleInstance()` (0) / `isTankVehicleInstance()` (0) — instance-level checks

---

## Lifecycle Map — per-PID state allocator/deallocator pairing (v1.406 audit)

**Why this section exists.** Per-PID state grows on player join and must shrink on player leave; if a field is set on join (or deploy, or first interaction) and never `delete`d on leave, server memory grows monotonically across the join/leave churn of a long-running session. This section pairs every per-PID state field with its allocator and deallocator events, flagging suspects where the pair is missing or fragile.

**Audit methodology.** Each field below was checked by:
1. Locating the field declaration in `src/state/runtime-types.ts`.
2. Grepping for write sites (`State.<path>[pid] = ...`) — the allocator surface.
3. Grepping for delete sites (`delete State.<path>[pid]`) — the deallocator surface.
4. Walking the call graph from `onPlayerLeaveGameImpl` to verify each delete actually fires on player disconnect.

**Status legend:**
- ✓ **Paired** — set on a known event, deleted on player leave (or earlier explicit cleanup).
- ⚠ **Partial** — paired in normal flow, but with a known edge case (e.g., team swap, mid-warm disconnect, error path).
- ❌ **Leak suspect** — write sites exist; no `delete` site reachable from `onPlayerLeaveGameImpl`. Verify and fix or document why immortal-by-design.

### Per-PID state inventory

#### `State.players.*`

| Field | Allocator | Deallocator | Status |
|-------|-----------|-------------|:------:|
| `readyDialogData[pid]` | `initReadyDialogData` (on join) | `onPlayerLeaveGameImpl:173` | ✓ |
| `readyByPid[pid]` | Ready toggle / reset paths | `onPlayerLeaveGameImpl:152` | ✓ |
| `readyNeedsReconfirmByPid[pid]` | Config change handlers | `onPlayerLeaveGameImpl:153` | ✓ |
| `readyMessageCooldownByPid[pid]` | Ready broadcast throttle | `onPlayerLeaveGameImpl:154` | ✓ |
| `inMainBaseByPid[pid]` | Boundary trigger transitions | `onPlayerLeaveGameImpl:170` | ✓ |
| `worldInteractableIconByPidByObjId[pid]` | `ensureMainBaseTeamIconForPlayer` (per WorldIcon) | `cleanupWorldInteractableRuntimeIconsForPid` (called from `onPlayerLeaveGameImpl:138`) | ✓ |
| `armO[pid]` / `armI[pid]` / `armT[pid]` | Gadget menu open paths | `onPlayerLeaveGameImpl:157-159` + `resetArmState` | ✓ |
| `armFocusedTileKeyByPid[pid]` | FocusIn handler | `onPlayerLeaveGameImpl:160` + `setArmOpen(pid, false)` | ✓ |
| ~~`warmPrimeActiveByPid[pid]`~~ | DELETED in v1.418 Ship 8 (along with `prebuildAllUiFamiliesHidden`). | — | — |
| `armG[pid]` / `armL[pid]` / `armS[pid]` | Gadget cooldown ensure helpers | `onPlayerLeaveGameImpl:162-164` + `resetArmTimers(pid)` | ✓ |
| `lockerSlots[pid]` | `probeLauncherSlot` first call | `closeArmMenu` (`ammo-resupply-menu.ts:2551`; actual `delete` at line 2569) — fires on menu close, NOT explicit on leave | ⚠ |
| `lockerSlotToggle[pid]` | First locker open | **No deallocator** found in `src/`. Persists by design (player preference across menu reopen) | ❌ |
| `uiCachePerfByPid[pid]` | `resetUiCachePerfCountersForPid` | `onPlayerLeaveGameImpl:165` | ✓ (also Tier A5 strip candidate) |
| `deployedByPid[pid]` | `onPlayerDeployedImpl` / `onPlayerUndeployImpl` | `onPlayerLeaveGameImpl:171` | ✓ |
| `deployedAtSecondsByPid[pid]` | `onPlayerDeployedImpl` | `resetPlayerBoundaryStateOnUndeployOrReset` (boundary/enforcement.ts:577, called from `onPlayerLeaveGameImpl:141`) | ✓ |
| `disconnectedByPid[pid]` | `onPlayerLeaveGameImpl:135` (set on leave) | `onPlayerJoinGameImpl:100` (cleared on rejoin) | ✓ — intentional reconnect tracker |
| `uiInputEnabledByPid[pid]` | UI input mode helpers | `onPlayerLeaveGameImpl:155` | ✓ |
| `liveVehicleDeployMenuVisibleByPid[pid]` | `setVehicleDeployLiveMenuVisibleForPid` | `onPlayerLeaveGameImpl:156` + `resetVehicleDeployLiveMenuStateForPid` | ✓ |
| `posDebugTransformSourceByPid[pid]` | Position-debug toggle | `onPlayerLeaveGameImpl:167` | ✓ (also Tier A4 strip candidate) |
| `posDebugVehicleObjIdByPid[pid]` | Vehicle-enter cache seed | `onPlayerLeaveGameImpl:168` | ✓ (also Tier A4 strip candidate) |
| `kpiByPid[pid]` | `kpiInitForPid` / `kpiInitWithBaselineForPlayer` | `kpiCleanupForPid` (called from `onPlayerLeaveGameImpl:169`) | ✓ |

#### `State.conquest.debug.*`

| Field | Allocator | Deallocator | Status |
|-------|-----------|-------------|:------:|
| `hudGenerationByPid[pid]` | First HUD render | `cleanupHudForPid` (`player-join-leave.ts:80`) | ✓ |
| `combatHudGenerationByPid[pid]` | First combat-HUD render | `cleanupHudForPid:81` | ✓ |
| `teamSwapRefreshTokenByPid[pid]` | Team-swap dispatch | `cleanupHudForPid:82` (also reset on join `:104`) | ✓ |
| `teamSwapHudResetPendingByPid[pid]` | Team-swap dispatch | `cleanupHudForPid:83` | ✓ |
| `perspectiveTeamByPid[pid]` | Join handler `:111` | `cleanupHudForPid:84` | ✓ |
| `teamSwapPerspectiveLockUntilByPid[pid]` | Team-swap dispatch | `cleanupHudForPid:85` | ✓ |
| `engageHiddenUntilDeployByPid[pid]` | Join handler `:105` | `cleanupHudForPid:86` | ✓ |
| `hudStatusVmByPid[pid]` | `refreshTopHudDerivedSlicesForAllPlayers` | `cleanupHudForPid:87` | ✓ (also M11 churn — rebuilt every dirty tick) |
| `hudHelpReadyVmByPid[pid]` | Same | `cleanupHudForPid:88` | ✓ (M11 churn) |
| `hudClockVmByPid[pid]` | Same | `cleanupHudForPid:89` | ✓ (M11 churn) |

#### `State.conquest.capture.*`

| Field | Allocator | Deallocator | Status |
|-------|-----------|-------------|:------:|
| `engagedObjIdByPid[pid]` | `onPlayerEnterCapturePointImpl` | `onPlayerExitCapturePointImpl`, `onPlayerDeployedImpl`, `onPlayerUndeployImpl`, `cleanupConquestHudForTeamSwap`, `processReadyDialogSelection` (team-swap path post-Ship-8), HUD pipeline recovery — **5 delete sites** (was 6 pre-v1.418; `runTeamSwapLoadingGate` deleted in Ship 8). **Not deleted explicitly in `onPlayerLeaveGameImpl`** but preceding `cleanupHudForPid` chain may handle it via team-swap path. | ⚠ |

#### `State.conquest.spawnCharge.*`

| Field | Allocator | Deallocator | Status |
|-------|-----------|-------------|:------:|
| `firstLiveSpawnExemptByPid[pid]` | `spawnChargeOnMatchLiveStart` | `clearPidSessionState` (called from `onPlayerLeaveSpawnCharge` ← `onPlayerLeaveGameImpl:172`) | ✓ |
| `deployTxnByPid[pid]` | `ensureDeployTxn` (lazy on first deploy) | Same path | ✓ |
| `pendingReasonByPid[pid]` | `markNextDeployReason` | Same path + cleared at deploy time | ✓ |

#### `State.conquest.vo.*`

| Field | Allocator | Deallocator | Status |
|-------|-----------|-------------|:------:|
| `runtimeHandleByPid[pid]` | `ensureVoiceOverRuntimeForPid` | `captureVoOnPlayerLeaveOrResetPid` (`capture-vo.ts:82`) ← `onPlayerLeaveGameImpl:143` | ✓ |
| `handlesReadyByPid[pid]` | Same path | `capture-vo.ts:83` | ✓ |
| `recentActiveObjIdByPid[pid]` | `markRecentObjectivePresence` | `capture-vo.ts:84` | ✓ |
| `recentActiveAtSecondsByPid[pid]` | Same | `capture-vo.ts:85` | ✓ |

#### `State.round.boundary.*`

| Field | Allocator | Deallocator | Status |
|-------|-----------|-------------|:------:|
| `zoneStateByPid[pid]` | `getOrInitZoneStateForPid`, trigger enter handlers, `seedZoneStateFromSpawnContext` | `resetPlayerBoundaryStateOnUndeployOrReset` (`enforcement.ts:425, :576`) called from `onPlayerLeaveGameImpl:141` | ✓ |
| `activeViolationByPid[pid]` | `refreshPlayerBoundaryState` (when violation begins) | `clearBoundaryViolationForPid` (`enforcement.ts:303`) called from undeploy/leave paths | ✓ |

#### `State.hudCache.*`

| Field | Allocator | Deallocator | Status |
|-------|-----------|-------------|:------:|
| `topHudShellByPid[pid]` | `ensureTopHudShellForPlayer` | `cleanupHudForPid:79` | ✓ |
| `clockWidgetCache[pid]` | `ensureClockUIAndGetCache` | `cleanupHudForPid:76` | ✓ |
| `countdownWidgetCache[pid]` | `ensureCountdownUIAndGetWidget` | `cleanupHudForPid:77` | ✓ |
| `vehicleDeployTimerCache[pid]` | First viewer render | `cleanupHudForPid:78` (also `resetUiForPlayerOnJoin:35` defensively) | ✓ |
| `ammoResupplyMenuCache[pid]` | `mkArmCache` on first menu open | `destroyArmMenu` (`ammo-resupply-menu.ts:2140`) called from `resetUiForPlayerOnJoin`, `closeArmMenu` (on close), AND `onPlayerLeaveGameImpl:151` (added v1.407, A6). | ✓ (v1.407 fix) |
| `boundaryPromptCache[pid]` | `ensureBoundaryPromptUiForPlayer` | `destroyBoundaryPromptUiForPid` (`prompt-ui.ts:475`) called from `cleanupHudForPid:73` | ✓ |

#### `State.hqDeploy.*`

| Field | Allocator | Deallocator | Status |
|-------|-----------|-------------|:------:|
| `lastRequestAtSecondsByPid[pid]` | HQ deploy request rate-limit | `onPlayerLeaveGameImpl:158` (added v1.407, A7). All 7 read sites in `vehicles/hq-deploy.ts` use `?? -999` fallback so absence reads as "no recent request". | ✓ (v1.407 fix) |

### Resolved leak suspects (v1.407 — Wave 1)

Both leaks identified in the v1.406 audit shipped fixes in v1.407 (Tier A6, A7 in [`conquest_optimization_analysis.md`](./conquest_optimization_analysis.md)). Pending MP confirmation per [`conquest_mp_ongoing_tests.md`](./conquest_mp_ongoing_tests.md) Wave 1 entries.

1. **`State.hudCache.ammoResupplyMenuCache[pid]` (M2 — XL scale)** — fixed by adding `destroyArmMenu(pid)` to `onPlayerLeaveGameImpl` after `resetArmState(pid)` (v1.407, [`src/index/player-join-leave.ts:138`](../src/index/player-join-leave.ts#L138)).
2. **`State.hqDeploy.lastRequestAtSecondsByPid[pid]`** — fixed by adding `delete State.hqDeploy.lastRequestAtSecondsByPid[pid]` to the per-pid delete cluster in `onPlayerLeaveGameImpl` (v1.407, [`src/index/player-join-leave.ts:158`](../src/index/player-join-leave.ts#L158)).

### Findings — partial / intentional immortals to verify

- **`State.players.lockerSlotToggle[pid]`** — no leave-time delete, but the design intent is "player preference persists across menu close/reopen." Should it persist across player leave too? If a player disconnects and rejoins, do they get their old slot toggle or a fresh one? Verify with user; if reset-on-leave is desired, add a delete to `onPlayerLeaveGameImpl`.
- **`State.conquest.capture.engagedObjIdByPid[pid]`** — 6 delete sites cover deploy, undeploy, exit-capture-point, team-swap cleanup. Probably no leak in practice (the player is undeployed before `onPlayerLeaveGameImpl` clears state, which would have already cleared engagement). But no defense-in-depth delete on the leave handler. Consider adding for robustness.

### Slot-keyed lifecycle (one-line audit)

`State.vehicles.slots[]` entries are NOT per-pid — they're indexed by slot number, which is bounded by map config (~16 on Firestorm). They have their own lifecycle (created at `applyMapConfig`, never deleted; mutated by spawner state machine). Not a leak axis. The `activeOwnerPid` field within a slot IS player-keyed and gets cleared in `onPlayerLeaveGameImpl:147-150`. ✓

### Maintenance contract for this section

Whenever a `Record<number, T>` per-PID state field is added or removed:
1. Update the inventory table above with allocator + deallocator + status.
2. If status would be ❌ **Leak suspect**, do not ship the field without a `delete` in `onPlayerLeaveGameImpl` (or a documented `⚠ Partial` justification with explicit cleanup hook on undeploy/team-swap).
3. Cross-reference to the Mn ID (or note "not in M ranking") for runtime cost context.
4. Trace the full path from `onPlayerLeaveGameImpl` to the delete — don't accept "probably gets cleared somewhere"; verify.

---

## Naming Economy (v1.406 baseline + v1.454 re-measurement)

Identifier text — function names, variable names, type names — accounts for the bulk of the bundle. That's the inherent cost of having descriptive names; the question is whether the names are *over*-descriptive.

> **Re-measured v1.454, 2026-05-03.** v1.454 column added via `grep -oE '[A-Za-z_$][A-Za-z0-9_$]*' dist/bundle.ts` + JS-keyword filter. Methodology may differ slightly from v1.406's tool (which was unspecified) — the magnitudes are comparable but exact unique-count differences may reflect filter-list differences rather than real code growth. The v1.406 detail tables below (length distribution, top-20 expensive identifiers, hypothetical shortening savings) were NOT re-measured — those require deeper instrumentation than grep, and the underlying semantic story has not changed.

### Bundle-wide identifier facts

| Metric | v1.454 (re-measured) | v1.406 (baseline) | Delta |
|--------|---------------------:|------------------:|-------|
| Bundle bytes | **869,724** | 872,014 | −2,290 (−0.3%) |
| Unique identifiers (filtered) | **5,858** | 4,991 | +867 (+17.4%) — likely partly filter-methodology, partly Wave 3-6 additions |
| Total identifier occurrences | **54,365** | 51,626 | +2,739 (+5.3%) |
| Bytes occupied by identifier text | **602,527** (69.3% of bundle) | 577,898 (66.3%) | +24,629 bytes / +3.0pp |
| Unique function declarations | **951** | 1,027 | −76 (−7.4%) — F1 stripped 104 phase-prefix funcs at v1.408; offset by Wave 3-6 additions |
| Avg function name length | **27.54 chars** | 28.6 chars | −1.06 chars (−3.7%) — F1's prefix-strip effect |
| Sum of function declaration name bytes | **26,190** *(declarations only)* | 128,566 *(decl + calls)* | not directly comparable — different methodology |

### Identifier length distribution (unique names, all kinds)

Most identifiers cluster between 7–22 chars. The right tail past ~30 chars contains the costly ones — when those have many call sites, they dominate.

```
len  1-10:  1,346 unique  (cheap helpers, common locals)
len 11-20:  1,640 unique  (typical names)
len 21-30:    974 unique  (verbose; many phase-prefixed)
len 31-40:    711 unique  (over-described)
len 41-50:    268 unique  (very long)
len 51+:      41 unique   (extreme — should be reviewed)
extremes:   62, 69, 72-char single names exist
```

### Top 20 most expensive identifiers (length × occurrences)

| Bundle bytes | Uses × len | Identifier |
|-------------:|:----------|------------|
| 10,653 | 3551 × 3 | `mod` |
| 8,030 | 730 × 11 | `eventPlayer` |
| 7,414 | 337 × 22 | `safeSetUIWidgetVisible` |
| 6,189 | 2063 × 3 | `pid` |
| 5,525 | 1105 × 5 | `State` |
| 3,888 | 324 × 12 | `CreateVector` |
| 3,830 | 383 × 10 | `stringkeys` |
| 3,710 | 742 × 5 | `cache` |
| 3,630 | 605 × 6 | `player` |
| 3,360 | 420 × 8 | `conquest` |
| 3,072 | 384 × 8 | `UIWidget` |
| 2,736 | 342 × 8 | `UIAnchor` |
| 2,289 | 327 × 7 | `players` |
| 2,240 | 320 × 7 | `widgets` |
| 2,120 | 265 × 8 | `playerId` |
| 2,112 | 264 × 8 | `safeFind` |
| 2,106 | 117 × 18 | `safeSetUITextLabel` |
| 2,054 | 158 × 13 | `isValidPlayer` |
| 1,866 | 311 × 6 | `Player` |
| 1,785 | 51 × 35 | `deleteAllReusableTimerWidgetsByName` |

**Reading the table:** the top entries are mostly names that are already short or are SDK-fixed (`mod`, `pid`, `State`, `Player`, `UIWidget`). Below them are heavily-used helpers we own — `safeSetUIWidgetVisible` (22 chars × 337 uses = 7.4KB), `safeSetUITextLabel` (18 × 117), `isValidPlayer` (13 × 158). And single-use long names like `deleteAllReusableTimerWidgetsByName` (35 × 51 = 1.8KB).

### Phase-named anti-pattern (resolved v1.408 — Tier F1)

**Status: Resolved (v1.408, pending MP confirm).** All 104 phase-prefixed functions had their `conquestPhase[2A|2B|3|4|4B]` prefix stripped. Nine collisions resolved via module-domain disambiguation: Phase 2B → `spawnCharge*`, Phase 4 → `captureSound*`, Phase 4B → `captureVo*`. See [`./conquest_optimization_analysis.md`](./conquest_optimization_analysis.md) Tier F1 row.

#### Historical measurement (v1.406 baseline, pre-rename)

| Metric | Value |
|--------|------:|
| Unique phase-named functions | **104** |
| Bundle bytes occupied by phase names | **11,736** |
| Avg phase prefix length | 13.5 chars |

#### Actual measurement (v1.408 post-rename)

| Metric | Value |
|--------|------:|
| Bundle delta from F1 (v1.407 → v1.408) | **−3,738 bytes** |
| Remaining phase-prefixed identifiers | 1 — `conquestPhase2ACaptureTimingConfiguredByObjId` (state variable; out-of-scope per Wave 2 plan) |

The residual state variable in `src/index/capture-tickets.ts` was deliberately left untouched — Wave 2 scope was function names only. Type / variable / state-field renames (including this one) are eligible for a future cleanup pass if pursued.

### Hypothetical shortening savings

| Approach | Bundle bytes saved | Identifiers affected |
|----------|-------------------:|---------------------:|
| Cap all names at 12 chars | 176,729 (~20% bundle) | 3,253 |
| Cap all names at 16 chars | 122,216 (~14%) | 2,576 |
| Cap all names at 20 chars | 83,166 (~10%) | 2,033 |
| Cap all names at 24 chars | 54,859 (~6%) | 1,614 |
| Cap all names at 30 chars | 25,093 (~3%) | 1,039 |
| Cap function names only at 16 chars | 51,163 | 900 |
| Cap function names only at 20 chars | 36,208 | 824 |
| Cap function names only at 24 chars | 24,061 | 701 |
| Cap function names only at 30 chars | 10,918 | 456 |
| Strip `conquestPhaseNX` prefix only | 4,436 | 114 |

**Reading these:** "Cap at N" is purely hypothetical — it assumes every long name could shorten to N chars while staying unique and intuitive, which isn't true. The realistic policy (see analysis doc Tier F) lands between "Strip phase prefix only" and "Cap function names only at 24 chars" depending on how aggressive we want the rename pass.

### What this saves at runtime (vs. bundle)

Two budgets, two effects:

- **Bundle bytes (upload cap):** direct savings as above. Bundle is currently 872KB / 1MB cap = 176KB headroom, so this is *relief, not blocking*.
- **Runtime heap (Mod Evaluator memory):** identifier strings are typically interned by the JS runtime — paid once per unique string regardless of call count. Estimated savings is ~ **(unique-name × avg-shorten) ÷ 2** because of interning amortization. For "Cap function names only at 24 chars": ~12KB heap savings, not 24KB. Modest.

The honest takeaway: **renaming is mostly a code-clarity win, with bundle-byte and modest heap upside**. It's not a load-bearing memory reclaim like Tier A, but it pairs cleanly with the per-PID-cache thinning since the names *of* per-pid widget-cache fields are themselves part of the bundle.

---

## Code-Comment-Deficiency Hotspots (v1.454 audit, 2026-05-03)

A read-only inventory of TypeScript files / functions / blocks where the existing comments are insufficient to explain the intent. Per AGENTS.md "Function Comment Readability Policy", every top-level function should have a one-line purpose comment describing intent + non-obvious side effects/constraints. These items would benefit a future code-cleanup pass — they are NOT tracked as "bugs" in `conquest_issues.md` because the code is functionally correct; the deficiency is purely for human-comprehension/maintainability.

**Severity legend:**
- **HIGH** — complex algorithm or state machine with no rationale comment; confusing to a future reader without prior context
- **MEDIUM** — clarity loss but understandable on careful read
- **LOW** — nice-to-have purpose comments

**Deficiency category legend:**
- `NO_PURPOSE_COMMENT` — top-level function lacks the AGENTS.md one-line purpose comment
- `COMMENT_RESTATES_NAME` — comment exists but adds no information beyond the function name
- `COMPLEX_NO_RATIONALE` — long function (>30 lines) with non-obvious branching but no inline rationale for WHY the branches are ordered as they are
- `MAGIC_NUMBER` — numeric value used without naming or context
- `UNEXPLAINED_TS_CAST` — `as any` / `as unknown as T` cast without inline rationale
- `EMPTY_CATCH_NO_WHY` — `try { … } catch {}` without comment explaining what error is being absorbed and why silently
- `ENGINE_QUIRK_WORKAROUND_UNDOC` — workaround for an engine quirk without a comment naming the quirk

### High-priority hotspots

| File | Function / Range | Category | Severity | Suggested comment |
|------|-----------------|----------|:--------:|------------------|
| `interaction/ammo-resupply-menu.ts` | `probeSlot()` — line 882 | COMPLEX_NO_RATIONALE | HIGH | Classifies inventory slot state with branch precedence (empty/unknown/launcher/gadget); used to seed menu tile state at open. Branch order is semantically load-bearing — document the precedence rule. |
| `interaction/ammo-resupply-menu.ts` | `giveLauncher()` — line 1268 | COMPLEX_NO_RATIONALE | HIGH | Multi-step launcher grant: slot validation, ammo set, pool decrement, slot-conflict fallback. Document the pool-decrement-on-success rule and the slot-conflict fallback path. |
| `interaction/ammo-resupply-menu.ts` | `giveMedicSmoke()` — line 1347 | COMPLEX_NO_RATIONALE | HIGH | Team-shared smoke pool management with fallback to give-ammo when smoke unavailable. Document the team-shared semantic. |
| `vehicles/deploy-timer-ui.ts` | `ensureVehicleDeployInfoPlate()` — line 342 | COMPLEX_NO_RATIONALE | HIGH | Row construction cascade with interdependent anchor math. Document the row-element ordering and anchor cascade. |
| `vehicles/deploy-timer-ui.ts` | `ensureVehicleDeployActionButtonWidgets()` — line 459 | COMPLEX_NO_RATIONALE | HIGH | Button cascade with similar interdependent positioning. Document the spawn/ground/air button placement cascade. |
| `boundary/enforcement.ts` | `getDesiredBoundaryViolationKind()` — line 223 | COMPLEX_NO_RATIONALE | HIGH | Multi-branch violation classifier (prelive base / own-HQ / enemy-buffer / GCZ-grace / aircraft / Y-ceiling). Branch precedence is semantically load-bearing — document the priority rule and the GCZ_DEPLOY_GRACE_SECONDS rationale. |

### Medium-priority hotspots

| File | Function / Range | Category | Severity | Suggested comment |
|------|-----------------|----------|:--------:|------------------|
| `interaction/ammo-resupply-menu.ts` | `armDur()` — line 150 | NO_PURPOSE_COMMENT | MEDIUM | Looks up localized duration label for cooldown display, falls back to ready string. |
| `interaction/ammo-resupply-menu.ts` | `armGBox()` — line 162 | NO_PURPOSE_COMMENT | MEDIUM | Spawns bordered container widget for gadget tiles; wraps `mod.AddUIContainer` + anchor/depth setup. |
| `interaction/ammo-resupply-menu.ts` | `resetAllArmTimers()` — line 192 | NO_PURPOSE_COMMENT | MEDIUM | Globally resets all per-player timers + team-shared medic/launcher pools; called on config sync. |
| `interaction/ammo-resupply-menu.ts` | `mkArmCache()` — line 231 | NO_PURPOSE_COMMENT | MEDIUM | Allocates fresh cache entry structure mirroring `ACTIVE_GADGET_CONFIG`; used on first menu open per pid. |
| `vehicles/deploy-timer-ui.ts` | `getVehicleDeployLabelKey()` — line 18 | COMPLEX_NO_RATIONALE | MEDIUM | Maps `VehicleList` enum → HUD label string key; missing fallback comment on unexpected/new enum values. |
| `index/capture-tickets.ts` | `shouldCountPlayerAsActiveOnPoint()` — line 13 | NO_PURPOSE_COMMENT | MEDIUM | Gate for capture-state updates; player must be valid + deployed + alive + not man-down to count engagement. |
| `index/capture-tickets.ts` | `clearInactiveEngagedObjectiveOwners()` — line 38 | COMPLEX_NO_RATIONALE | MEDIUM | Scans engaged players + clears ownership for invalid soldiers; keeps HUD state aligned with death/undeploy edge cases. |
| `index/player-deploy.ts` | `deferForcedUndeploy()` — line 3 | NO_PURPOSE_COMMENT | MEDIUM | Async forced undeploy with 100ms defer to allow frame processing; wraps `UndeployPlayer` in try-catch. |

### Low-priority hotspots

| File | Function / Range | Category | Severity | Suggested comment |
|------|-----------------|----------|:--------:|------------------|
| `interaction/ammo-resupply-menu.ts` | `armGH()` — line 153 | NO_PURPOSE_COMMENT | LOW | Computes container height scaling with tile count; `DY` is vertical spacing step. |
| `interaction/ammo-resupply-menu.ts` | `armGCY()` — line 156 | NO_PURPOSE_COMMENT | LOW | Centers group container vertically; used for UI positioning relative to row base. |
| `interaction/ammo-resupply-menu.ts` | `armGHY()` — line 159 | NO_PURPOSE_COMMENT | LOW | Positions hint text below group; calculated from group center and height. |
| `interaction/ammo-resupply-menu.ts` | `resetArmTimers()` — line 187 | COMMENT_RESTATES_NAME | LOW | Clears per-player gadget + launcher + medic cooldown timers (used on join/leave). |
| `interaction/ammo-resupply-menu.ts` | `ammoResupplyMenuName()` — line 201 | NO_PURPOSE_COMMENT | LOW | Generates scoped widget name for ammo menu root/subcontainer; used for `safeFind`/`Delete`. |
| `interaction/ammo-resupply-menu.ts` | `isArmOpen()` — line 207 | COMMENT_RESTATES_NAME | LOW | Returns true if ammo resupply menu is currently open for player. |
| `interaction/ammo-resupply-menu.ts` | `getArmObj()` — line 211 | COMMENT_RESTATES_NAME | LOW | Returns object ID of menu's root widget or undefined if not created. |
| `interaction/ammo-resupply-menu.ts` | `setArmOpen()` — line 215 | NO_PURPOSE_COMMENT | LOW | Marks menu open or closed; clears focus on close to prevent stale tile-focus leak. |
| `interaction/ammo-resupply-menu.ts` | `setArmObj()` — line 224 | COMMENT_RESTATES_NAME | LOW | Caches menu's root widget ID for quick lookup; deletes when menu destroyed. |
| `vehicles/deploy-timer-ui.ts` | `getVehicleDeployTimerAdminToggleLabelKey()` — line 4 | NO_PURPOSE_COMMENT | LOW | Returns admin-mode toggle label (on/off) based on override enablement for player. |
| `ui/conquest/hud-core/build.ts` | `twlConquestHudApplySolidSurfaceStyle()` — line 44 | NO_PURPOSE_COMMENT | LOW | Normalizes surface widget fill mode + alpha; inline comment "keep HUD alive if fill unavailable" exists but no top-level intent. |

### Secondary findings — engine-quirk + magic-number underdocs

These are patterns rather than single-function fixes:

- **`ammo-resupply-menu.ts:131`** — `catch {}` after `mod.PlaySound()`. Should note: SFX handle may be invalidated; fail-silent to preserve menu responsiveness.
- **`ammo-resupply-menu.ts:877–879`** — Three sequential `catch {}` on inventory API calls. Should note: engine returns may be unavailable during loading transitions; treat errors as zero/false for slot classification. (See related v1.447 / v1.448 `CQ_Bug_94` resolution which addressed these same APIs from the engine-error-log angle — the JS-side wrap is preserved per same family pattern.)
- **`vehicles/vanilla-spawner.ts:92, 98`** — `catch {}` on vector component extraction. Should note: `GetObjectPosition` unreliable during vehicle transitions per memory `project_getobjectposition_unreliable_on_destroy.md`; fallback to zero assumes slot-context caller passes `spawnPos`.
- **`boundary/enforcement.ts:13`** — `GCZ_DEPLOY_GRACE_SECONDS = 1.5`. Inline comment exists but should be elevated to a top-level docstring on the const definition explaining the post-spawn settle window rationale (see `CQ_Feat_Squad_Spawn_Zone_Inheritance` v1.370 for the related design discussion in [`conquest_issues.md`](./conquest_issues.md)).
- **`interaction/ammo-resupply-menu.ts:153–161`** — Multiple layout constants (`DY=126`, `SPY=30`, `LY`, etc.) with abbreviation-heavy names. Suggest a docstring at the const group explaining abbreviated meanings, OR (per Tier B1 in [`conquest_optimization_analysis.md`](./conquest_optimization_analysis.md)) inline the values where used.
- **`interaction/ammo-resupply-menu.ts:234, 236–240`** — Bare `as any` casts in `mkArmCache` loop initialization. Should explain: initial cache entries are typed empty objects; real widget refs assigned during build pass.

### Summary table

| File | Hotspot count | Severity mix |
|------|--------------:|--------------|
| `interaction/ammo-resupply-menu.ts` | 15 | 1 HIGH, 5 MEDIUM, 9 LOW |
| `vehicles/deploy-timer-ui.ts` | 5 | 2 HIGH, 2 MEDIUM, 1 LOW |
| `index/capture-tickets.ts` | 2 | 1 HIGH, 1 MEDIUM |
| `index/player-deploy.ts` | 1 | 0 HIGH, 1 MEDIUM, 0 LOW |
| `boundary/enforcement.ts` | 1 | 1 HIGH, 0 MEDIUM, 0 LOW |
| `ui/conquest/hud-core/build.ts` | 1 | 0 HIGH, 0 MEDIUM, 1 LOW |
| **Total** | **25** | **5 HIGH, 10 MEDIUM, 10 LOW** |

### Actionable notes for a future cleanup pass

1. **Abbreviation glossary first.** `ammo-resupply-menu.ts` uses single/double-letter constants (`AX`, `EX`, `MX`, `RX` for class headers; `DY`, `LY`, `SPY` for layout). Adding a glossary at the top of the const group (~lines 2–10) unblocks comprehension of every consumer site without per-call-site changes.
2. **Branch-precedence comments on the 6 HIGH items.** Each of the 6 `COMPLEX_NO_RATIONALE` HIGH items has semantically load-bearing branch ordering (e.g., `getDesiredBoundaryViolationKind`'s violation-priority chain). A 3-5 line block comment at the top of each function explaining "why these branches in this order" would prevent future regressions where a maintainer reorders thinking it's cosmetic.
3. **Empty-catch convention header.** Add a section header comment at the top of files heavy with `catch {}` (e.g., `ammo-resupply-menu.ts`, `vanilla-spawner.ts`) explaining the project convention: engine API calls are wrapped because the engine may invalidate object handles or return errors during transitions; silent failure preserves responsiveness. Then individual sites only need a tag like `// CQ_Bug_43-class` instead of full re-explanation.
4. **Maintenance contract.** This audit was a one-time read-only sweep. To keep it useful long-term, treat new HIGH-severity additions (any new `COMPLEX_NO_RATIONALE` ≥30-line function landing without a docstring) as a soft block on PR merge — not a hard gate, but called out in code review.

### Maintenance contract for THIS section

- Re-run an Explore audit pass on every major version (~v1.470) to catch new hotspots.
- When a HIGH item gets cleanup, move the row to a "Resolved" subsection with the version reference (don't delete — preserves the historical pattern record).
- Items added to source code with proper purpose comments do NOT need to be added here; this list is the inventory of what's MISSING.

---

## How to keep this file accurate

1. **After every `bumpVersion`:** refresh the Project Stats row, the bundle bytes/headroom in the file map, and update Lines/Bytes for any file that grew or shrank by ≥5%.
2. **After any function add/remove:** add/remove the entry under its file's section. New functions should follow AGENTS.md's "Function Comment Readability Policy" (one-line purpose comment in source) — copy that comment to the entry. **Include a usage annotation** per the convention above:
   - For plain helpers, run `rg -c "\b<name>\("` across `src/` and subtract 1 for the declaration. Append `(N)`.
   - For hot-path entry points (a function called from the 0.12s game-loop body, the per-second second-boundary section, or a Portal event handler), prefix with the cadence tier: `(XL~N)`, `(L~N)`, `(M~N)`, `(S~N)`, or `(XS~N)`.
   - For engine-fired Portal callbacks in `src/index.ts`, use `(engine)`.
   When a function moves between hot and cold (added or removed call sites in `index/game-mode.ts`), re-evaluate the tier prefix.
3. **After any `state/*` field add/remove that scales per-pid:** update the PPM column on the file map AND add/remove an entry in the **Lifecycle Map** above (allocator + deallocator + status). Add/remove an `Mn` entry in [`conquest_optimization_analysis.md`](./conquest_optimization_analysis.md) if it scales per-pid. Cross-reference all three.
4. **No new per-PID `Record<number, T>` field ships without a `delete` site reachable from `onPlayerLeaveGameImpl`.** If the field is intentionally immortal across leaves (e.g. a reconnect tracker), document the rationale on the Lifecycle Map row with status ⚠.
5. **After any feature-flag flip:** update the Compile-Time Feature Flags table and the `In bundle` column for the affected files.
6. **Scope discipline:** files NOT in the bundle (excluded by feature flags or orphaned) belong on the file map but should NOT have function-inventory sections. Their callable surface is irrelevant to runtime memory.
