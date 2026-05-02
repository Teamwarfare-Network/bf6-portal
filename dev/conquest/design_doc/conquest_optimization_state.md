# TWL Conquest Optimization State

Last updated: v1.408 (2026-04-27)
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

## Project Stats (v1.420)

| Metric | Value |
|--------|-------|
| Version | 1.420 |
| Source files (`.ts`) | 127 (incl. orphan / feature-flagged; `loading-overlay.ts` is a stub) |
| Source files in bundle | ~114 |
| `dist/bundle.ts` | **847,560 bytes** (unchanged from v1.419 — v1.420 is doc-consistency-sweep only). Wave 3 total: v1.408 → v1.420 = 877,390 → 847,560 bytes = **−29,830 bytes (−3.4%)**. |
| `dist/bundle.strings.json` | 22,153 bytes (separate cap; unchanged) |
| Bundle upload limit | 1,048,576 bytes (1 MiB) |
| Bundle headroom | **201,016 bytes (19.17%)** |
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
| `strings.json` | (n/a) | 22,082 | (separate) | — | Localized strings; not in script bundle but bundled separately. ~8.8KB dead keys (Cat 8). |
| **admin-panel/** | | | | | |
| `admin-panel/build.ts` | 348 | 11,464 | N (FEATURE_ADMIN_PANEL) | — | Admin panel widget construction. |
| `admin-panel/events.ts` | 229 | 8,896 | N (FEATURE_ADMIN_PANEL) | — | Admin panel button handlers. |
| `admin-panel/visibility.ts` | 172 | 6,878 | N (FEATURE_ADMIN_PANEL) | — | Admin panel show/hide/toggle. |
| **boundary/** | | | | | |
| `boundary/enforcement.ts` | 599 | 27,235 | Y | (per-pid `zoneStateByPid` + `activeViolationByPid` not in M ranking — small) | Per-second classifier reads `zoneStateByPid` + `seatKind`; dispatches violation timers. |
| `boundary/prompt-ui.ts` | 477 | 19,160 | Y | **M6** | `BoundaryPromptWidgetCacheEntry` per pid — 12 widget refs + 12 name strings + 3 `last*` diff fields. |
| `boundary/live-prebuild-scheduler.ts` | 100 | 4,400 | Y | — | Wave 3 Ship 6 (v1.415): `BoundaryPromptLivePrebuildScheduler` namespace. At LIVE start, schedules 10 batches (1s spacing) of `ceil(N/10)` pids (cap 8) via `Timers.setTimeout`, each batch dispatching `triggerLazyBuild('boundaryPrompt', pid)`. Snapshot only — late joiners use existing first-violation fallback in `showBoundaryPromptForPlayer`. Token-based cancellation on `endMatch` / `triggerFreshMatchSetup`. |
| **clock/** | | | | | |
| `clock/state.ts` | 254 | 10,838 | Y | — | `Clocks.CountDownClock` driver; per-second tick + critical-flash gate. |
| `clock/timer-instance.ts` | 404 | 17,901 | Y | M5 family | Reusable MM:SS widget builders shared by deploy-timer-ui + countdown. |
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
| `foundation/ui-layout.ts` | 356 | 22,468 | Y | — | All HUD/dialog pixel constants. **Tier B1 inlining target** (~308 const). |
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
| `index/area-triggers.ts` | 124 | 5,546 | Y | — | Capture-point + main-base trigger enter/exit handlers. |
| `index/capture-shared.ts` | 33 | 1,241 | Y | — | Shared helpers for capture-sound + capture-vo. |
| `index/capture-sound.ts` | 203 | 7,913 | Y | — | Phase 4 capture-tick sound queue. |
| `index/capture-tickets.ts` | 2,150 | 87,156 | Y | M3/M11 owner | Phase 2A capture, ticket bleed, HUD dispatch, 7 view models. **Mega-file.** |
| `index/capture-vo.ts` | 376 | 14,753 | Y | — | Phase 4B objective VO queue. |
| `index/conquest-scaffold.ts` | 85 | 3,973 | Y | — | Phase 1 state init scaffold. |
| `index/game-mode.ts` | 186 | 8,376 | Y | — | `OnGameModeStarted` impl + 0.12s main loop. |
| `index/player-deploy.ts` | ~120 | ~5,950 | Y | — | `OnPlayerDeployed`/`OnPlayerUndeploy` impls. v1.418 (Ship 8): `handlePlayerDeployedBeforeRelease`, `reassertUiLoadingAfterUndeploy`, gate-active branches all deleted. |
| `index/player-join-leave.ts` | 192 | 8,325 | Y | — | `OnPlayerJoinGame`/`OnPlayerLeaveGame` impls. v1.410 (Ship 2): join flow calls `triggerLazyBuild('topHudShell', joinPid)` after reset, before gate. v1.412 (Ship 3.5): also calls `SupplyBoxWarmScheduler.enqueueLateJoiner(joinPid)` for LIVE-phase warm tail-append. v1.413 (Ship 4): also calls `triggerLazyBuild('vehicleDeployTimer', joinPid)` for gate-entry warm of the deploy-timer cache. v1.414 (Ship 5): also calls `triggerLazyBuild('combatHud', joinPid)` for gate-entry warm of the combat-HUD cache. |
| `index/player-kpi-events.ts` | 68 | 3,119 | Y | — | KPI event impls (kill, assist, capture). |
| `index/player-loop-inputs.ts` | ~16 | ~600 | Y | — | `OngoingPlayer`, `OnPlayerInteract`, `OnPlayerUIButtonEvent` impls. v1.418 (Ship 8): `enforceUiLoadingGateWhileDeployed`, `maintainUiLoadingGateWhileUnreleased`, `UI_LOADING_GATE_UNDEPLOY_RETRY_SECONDS` deleted; `ongoingPlayerImpl` reduced to deploy-check + interact-point removal/spawn. |
| `index/vehicle-events.ts` | 114 | 5,214 | Y | — | Vehicle enter/exit/spawn/destroy impls. |
| **interaction/** | | | | | |
| `interaction/actions.ts` | ~290 | ~12,600 | Y | — | v1.418 (Ship 8): loading-gate orchestration deleted — `prebuildAllUiFamiliesHidden`, `runLoadingGateUntilReady`, `releaseLoadingGate`, `revealAllUiFamilies`, `hideAllUiFamiliesForPlayer`, `reassertPlayerUiLoadingGateVisuals`, `runTeamSwapLoadingGate`, `holdPlayerAtDeploy`, `applyPlayerDeployAvailability`, `beginLoadingGate`, `enforceHudWarmTransitionDeployBlock`, `isAllUiFamiliesReadyForRelease`, `isCriticalTopHudReadyForPid`/`CombatHud`/`VehicleDeployHud`, `hideCriticalHudForWarmTransition`, `hideTopHudFamilyForWarmTransition`, `hideVehicleSpawnerUiFamilyForPid`, `setClockWidgetCacheVisible`, `setPositionDebugWidgetsVisibleForPid`, `waitForPlayerToBecomeUndeployedForTeamSwap`, `waitForPlayerTeamToSettleForSwap` all gone. File now contains only the prebuild-while-hidden builders called by the lazy-build dispatcher, the per-family render-for-reveal helpers (called from `onPlayerDeployedImpl` via `renderCriticalHudForReveal`), `processReadyDialogSelection` (team-swap with no overlay), and team-swap support helpers. |
| `interaction/ammo-resupply-menu.ts` | 2,772 | 121,401 | Y | **M2** | `AmmoResupplyMenuCacheEntry` per pid — ~100–180 widget refs + arrays. **Largest mega-file.** v1.411 (Ship 3): `openArmMenu` first-interact path routes through `triggerLazyBuild('supplyBox', pid)`. Hide-on-close behavior retained; teardown at disconnect via Wave 1 `destroyArmMenu`. |
| `interaction/build-pacer.ts` | 139 | 5,372 | Y | — | Wave 3 Ship 1 (v1.409): global heavy-build mutex + 10Hz Timers.setTimeout drainer for paced lazy builds. Dormant when queue empty. |
| `interaction/hud-warm-state.ts` | ~55 | ~2,000 | Y | — | v1.418 (Ship 8): swept from 40+ accessors down to 5 — `getReadyDialogStateForPid`, `setCombatHudRevealAllowedForPid`/`isCombatHudRevealAllowedForPid`, `resetReadyDialogSectionSignaturesForPid`, plus `isHudWarmReadyForPid` (always returns true) + `isHudSwapTransitionActiveForPid` (always returns false) kept as constants for backward-compat across clock/help/vehicles/HUD pipeline call sites. |
| `interaction/interact-point.ts` | 191 | ~7,940 | Y | — | Ready-dialog interact point spawn/despawn. v1.416 (Ship 7): `tryOpenReadyDialogForPlayer` calls `triggerLazyBuild('readyDialog', playerId)` immediately before `showReadyDialogUI` so the dispatcher's in-flight guard + error tear-down semantics own the build path. v1.417 (Ship 7 follow-up): deploy-time `warmHiddenReadyDialogCacheForPid(playerId)` call deleted from `spawnReadyDialogInteractPoint` — without this deletion the cache pre-warmed at deploy and the lazy trigger was a no-op. Now the build genuinely fires on first triple-tap. |
| `interaction/lazy-build-registry.ts` | 254 | 9,238 | Y | — | Wave 3 Ship 1 (v1.409): const config map for 6 UI surfaces (combat HUD, top shell, vehicle deploy timer, supply box, ready dialog, boundary prompt) + `triggerLazyBuild(name, pid)` dispatcher with per-surface in-flight guard, mutex acquisition, error retry. |
| `interaction/spawn-selector.ts` | 36 | 974 | Y | — | Phase 1 placeholder for future spawn selection. |
| `interaction/supply-box-warm-scheduler.ts` | 116 | 5,358 | Y | — | Wave 3 Ship 3.5 (v1.412): `SupplyBoxWarmScheduler` namespace owning a 2s/op self-rescheduling `Timers.setTimeout` chain. Persistent queue with late-joiner enqueue. Cancellation via token-bump on endMatch / triggerFreshMatchSetup. |
| `interaction/types.ts` | 74 | 2,999 | Y | — | `readyDialogData_t` + `UiLoadReason` types. |
| `interaction/ui-events-ready.ts` | 232 | 8,607 | Y | — | Ready-dialog button click routing. |
| `interaction/ui-events.ts` | 17 | 789 | Y | — | UI button event dispatcher. |
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
| `ready-dialog/takeoff-gating.ts` | 16 | 652 | Y | — | Aircraft takeoff readiness check. |
| **state/** | | | | | |
| `state/core.ts` | ~99 | ~3,950 | Y | — | `isMatchLive`, round-start delay helpers, world-log. v1.418 (Ship 8): `setAllInputRestrictionsForPlayer` deleted (no callers post-gate-deletion; `mod.EnableAllInputRestrictions` no longer invoked from script). |
| `state/hud-cache-types.ts` | 231 | 7,300 | Y | M1/M2/M4/M5/M6 owner | All HUD cache type defs. **Tier A2 target.** |
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
| `ui/conquest/hud-core/build.ts` | 1,116 | 44,624 | Y | **M3** | Combat HUD widget construction (tickets/flags/engage). |
| `ui/conquest/hud-core/constants.ts` | 402 | 21,092 | Y | — | HUD layout constants (~158 const). **Tier B1 target.** |
| `ui/conquest/hud-core/lifecycle.ts` | 291 | 15,761 | Y | M3 indirect | Show/hide/destroy HUD per pid. |
| `ui/conquest/hud-core/names.ts` | 180 | 5,942 | Y | — | Widget ID generators. |
| `ui/conquest/hud-core/pipeline.ts` | 172 | 6,602 | Y | — | Render queue + dispatch. |
| `ui/conquest/hud-core/render.ts` | 667 | 31,305 | Y | M3 | Visual update (tickets, flags, engage). |
| `ui/conquest/hud-core/state.ts` | 98 | 3,613 | Y | M3 cache | Runtime cache/scheduler state. |
| `ui/conquest/hud-core/toggle.ts` | 13 | 377 | Y | — | HUD mode getter/setter. |
| `ui/conquest/hud-core/types.ts` | 142 | 5,001 | Y | — | `TwlConquestHud*` type defs. |
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
| `vehicles/deploy-timer-ui.ts` | 2,059 | 92,213 | Y | **M1** | `vehicleDeployTimerCache` per pid — ~150–250 widget refs × N rows. **Largest per-pid widget cache. Mega-file.** |
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

### src/interaction/ui-events-ready.ts
Module: ready-dialog and admin-panel toggle button handlers
- `tryConsumeReadyDialogPrimaryClickEvent()` (4) — consume ready dialog click
- `tryHandleReadyDialogPrimaryAction()` (7) — handle ready dialog primary action
- `handleReadyDialogGridKnobClick()` (2) — handle grid knob click
- `handleReadyDialogReadyButtonClick()` (1) — handle ready button click
- `tryHandleReadyDialogButtonEvent()` (1) — handle button event

### src/interaction/ui-events.ts
Module: dispatcher for ready-dialog and admin-panel button handlers
- `teamSwitchButtonEvent()` (1) — handle team switch button

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
- `syncReadyDialogModeActionWidgetsForPid()` (1) — sync action widgets (renders apply-blocked label #105)
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
| `lockerSlots[pid]` | `probeLauncherSlot` first call | `closeArmMenu` (`ammo-resupply-menu.ts:2474`) — fires on menu close, NOT explicit on leave | ⚠ |
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
| `ammoResupplyMenuCache[pid]` | `mkArmCache` on first menu open | `destroyArmMenu` (`ammo-resupply-menu.ts:2045`) called from `resetUiForPlayerOnJoin:18`, `closeArmMenu` (on close), AND `onPlayerLeaveGameImpl:138` (added v1.407, A6). | ✓ (v1.407 fix) |
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

## Naming Economy (v1.406 measurement)

Identifier text — function names, variable names, type names — accounts for **577,898 bytes of the 872,014-byte bundle (~66%)**. That's the inherent cost of having descriptive names; the question is whether the names are *over*-descriptive.

### Bundle-wide identifier facts

| Metric | Value |
|--------|------:|
| Bundle bytes | 872,014 |
| Unique identifiers (excl. JS reserved) | **4,991** |
| Total identifier occurrences | 51,626 |
| Bytes occupied by identifier text | **577,898** (66.3% of bundle) |
| Unique function declarations | **1,027** |
| Avg function name length | **28.6 chars** |
| Total function-name bytes (decl + calls) | **128,566** |

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
