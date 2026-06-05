# Helis-Only Lazy-Load HUD Architecture

**Status**: Active as of v0.691 (Phase E shipped).
**Origin plan**: [5.30.26_heli_lazy_load_hud_refactor_plan.md](./5.30.26_heli_lazy_load_hud_refactor_plan.md)

This doc is the handoff reference for the lazy-load HUD infrastructure that landed across v0.687-v0.691 (Phases 0, A, B, E). It describes what builds when, which file owns each surface, and where to wire new lazy surfaces. Read this before adding new HUD widgets or debugging "widget didn't appear" / "value didn't update" issues.

---

## Why this exists

The BF6 Portal sandbox enforces a ~1000ms per-frame engine evaluation budget. Concurrent player joins (≥5 simultaneously) ran the full `ensureHudForPlayer` body in the same engine tick, and the cumulative `modlib.ParseUI` cost exceeded the budget → script termination. Conquest calls this **CQ_Bug_40**.

Phases A + B moved ~1,505 lines of widget construction out of the join tick. The remaining eager work in the renamed `ensureEagerHudShellForPlayer` is small and bounded.

---

## What's eager vs lazy

### Eager (runs in `OnPlayerJoinGame` via `ensureEagerHudShellForPlayer`)

| Surface | File | Notes |
|---|---|---|
| Upper-Left branding box | `hud.ts` | "teamwarfare . net | TWL Vehicles" header |
| Upper-Left settings summary | `hud.ts` | Game Mode / Aircraft Ceiling / Vehicle Health / Vehicles T1+T2 / Matchup / Players rows |
| Altimeter (root + card + warning label) | `hud.ts` | Eager since v0.674 — lazy version had silent positioning bugs we couldn't pin down across 8 attempts. Don't revert without an isolated test. |
| Spawn-disabled live text | `hud.ts` (`ensureSpawnDisabledLiveText`) | Allocated lazily-first-use but called eagerly from cache init |
| Cache write to `State.hudCache.hudByPid[pid]` | `hud.ts` | Required: lazy builders read `refs` from this map |
| Settings_* ref resolution | `hud.ts` | Settings text widgets are eager so their refs resolve here |
| Tutorial join prompt (overlay) | `ready-dialog.ts` (`createJoinPromptForPlayer`) | Built lazily on first join via `OnPlayerJoinGame`'s post-OPD branch; eager from user perspective |

### Lazy (deferred via `triggerLazyBuild(surface, pid)`)

| Surface | Module file | Build function | Trigger site | Trigger event |
|---|---|---|---|---|
| `topHud` | `hud-scoring-lazy.ts` | `ensureTopHudScoringUiBuiltHidden` | `index.ts` `OnPlayerDeployed` | First deploy per player |
| `roundEndDialog` | `hud-dialog-lazy.ts` | `ensureRoundEndDialogUiBuiltHidden` | `hud.ts` `updateRoundEndDialogForPlayer` | Round-end (round-flow.ts:530) |
| `victoryDialog` | `hud-dialog-lazy.ts` | `ensureVictoryDialogUiBuiltHidden` | `hud.ts` `updateVictoryDialogForPlayer` | Match-victory (gated by `State.match.victoryDialogActive`) |

### Already lazy without registry routing (Phase C deferred)

| Surface | Trigger | Build site | Notes |
|---|---|---|---|
| Ready Dialog | Triple-tap interact point | `ready-dialog.ts` `createTeamSwitchUI` | Has its own idempotent cache check |
| Admin Panel | Admin button click in Ready Dialog | `ready-dialog.ts` `ensureAdminPanelWidgets` | Has its own cache check |
| Altitude warning dialog | First time pilot crosses warning ceiling | `hud.ts` `ensureAltitudeWarningUiForPlayer` | Lazy first-show |
| Overtime HUD | First time player enters overtime zone | `overtime.ts` `ensureOvertimeHudForPlayer` | Lazy first-show |

Phase C of the refactor (route Ready Dialog + Admin Panel through `triggerLazyBuild` for telemetry consistency + add `LAYOUT_VERSION` invalidation hooks) is deferred because both are already lazy and the work has no frame-budget benefit.

---

## Registry mechanics

### `src/lazy-build.ts`

Defines the surface-name union, registry, in-flight set, telemetry counters, and dispatcher. To add a new lazy surface:

1. Extend `LazyBuildSurfaceName` union with the new name.
2. Add a `LazyBuildConfig` entry to `LAZY_BUILD_REGISTRY` with `teardownTrigger`.
3. Add the new name as a key in `_lazyBuildInFlightByName`, `_lazyBuildSuccessByName`, `_lazyBuildErrorByName`.
4. Add a `case` to `_resolveLazyBuildHandler` returning a closure that calls your ensure function.
5. Wire `triggerLazyBuild('yourSurface', pid)` at the trigger site.

### `triggerLazyBuild(name, pid)` contract

- **Re-entrancy**: returns early if a build for `(name, pid)` is already in flight.
- **Disconnect guard**: returns early if `safeFindPlayer(pid)` is undefined.
- **Sync**: builders run inline; their hitch counts against the caller's frame.
- **Errors**: caught silently; error counter bumped. Per-surface lock released in `finally`.
- **Telemetry**: `getLazyBuildSuccessCount(name)` / `getLazyBuildErrorCount(name)` available for diagnostics.

---

## Ensure-function contract

Every `ensureXUiBuiltHidden(player)` follows this shape (see `hud-dialog-lazy.ts` for examples):

```ts
function ensureMySurfaceUiBuiltHidden(player: mod.Player): void {
    if (!player || !mod.IsPlayerValid(player)) return;
    const pid = safeGetPlayerId(player);
    if (pid === undefined || isPidDisconnected(pid)) return;

    const refs = State.hudCache.hudByPid[pid];
    if (!refs) return;  // eager shell hasn't built yet -- caller will retry

    // Idempotency: detect via a stable widget for this surface
    const existing = safeFind(`MySurfaceRoot_${pid}`);
    if (existing) {
        bindMySurfaceRefsByName(refs, pid);  // re-bind in case refs got wiped
        return;
    }

    const root = modlib.ParseUI({ /* ... */ });
    if (root) refs.roots.push(root);
    bindMySurfaceRefsByName(refs, pid);
    // optionally: seed visible values from State
}
```

Key invariants:
- **Idempotent**: safe to call multiple times. First call builds, subsequent calls re-bind refs.
- **Refs live on `State.hudCache.hudByPid[pid]`** — same `HudRefs` object that `ensureEagerHudShellForPlayer` populates. Lazy builds write to additional fields on that same entry.
- **Pre-build update safety**: consumer functions (`setCounterText`, `safeSetUITextLabel`, etc.) defensive-check undefined widget refs and no-op. Values stay authoritative in `State`; widgets are projections.
- **No await inside the build** — builders run synchronously to keep the re-entrancy guard's semantics simple. If you need async work, wrap the trigger call in a `void (async () => { ... })()` and have the async wrapper call `triggerLazyBuild` after its awaits resolve.

---

## Cache invariant

`ensureEagerHudShellForPlayer`'s cache-hit check at the top of the function:

```ts
const cached = State.hudCache.hudByPid[pid];
if (cached && cached.settingsGameModeText) {
    // ... cache-hit path ...
    return cached;
}
```

The check uses `cached.settingsGameModeText` because settings widgets are the only eager widgets whose refs are populated unconditionally at the end of the eager build. If you ever change the eager scope, update this invariant — otherwise repeat calls to `ensureEagerHudShellForPlayer` for the same pid will re-run the full build.

---

## Trigger timing reference

| When | What fires | Why this timing |
|---|---|---|
| `OnPlayerJoinGame` | `ensureEagerHudShellForPlayer` (eager scope only) | Player needs branding + settings panel visible while on deploy screen |
| `OnPlayerDeployed` | `triggerLazyBuild('topHud', pid)` | Scoring HUD only matters once player is in-world; deploys are naturally staggered |
| Round-end (`round-flow.ts` `endRound` → `updateRoundEndDialogForAllPlayers`) | `triggerLazyBuild('roundEndDialog', pid)` per player | Dialog appears exactly when round ends; build cost spread across one update tick |
| Match-end (`round-flow.ts` `scheduleFinalRoundVictory` → `updateVictoryDialogForAllPlayers`) | `triggerLazyBuild('victoryDialog', pid)` per player, **gated by `State.match.victoryDialogActive`** | Gate is required because `updateVictoryDialogForPlayer` is also called from `ensureEagerHudShellForPlayer`'s cache init as a defensive no-op; without the gate, OPJG would trigger the build |

---

## Debugging "widget didn't appear"

1. **Check whether the build fired**: `getLazyBuildSuccessCount('surface')` should increment after the trigger event. If it doesn't, the trigger site isn't being called.
2. **Check whether the build errored**: `getLazyBuildErrorCount('surface')` increments on throw. The error itself is swallowed; add a `console.log` in the catch block to surface it during debug.
3. **Check whether the refs are bound**: `State.hudCache.hudByPid[pid].xRoot` should be a non-null UIWidget after the build runs. If it's undefined, `bindXRefsByName` failed — verify the widget names in the bind helper match the ParseUI tree.
4. **Check the cache invariant**: if `cached.settingsGameModeText` is undefined, the eager shell never ran. Check `OnPlayerJoinGame` flow.
5. **Check for orphaned widgets from a prior script reload**: widgets persist across reloads. `safeFind` may return a stale widget that doesn't match current code. Renaming the widget IDs (with a version suffix like `Altimeter_v674_*`) forces a clean slate.

---

## Anti-patterns to avoid

- **Don't call `ensureEagerHudShellForPlayer` from inside a lazy builder** — the eager shell may not be ready, and you'll get a stack of redundant safeFind no-ops.
- **Don't add `await mod.Wait(...)` inside an ensure function** — the re-entrancy guard releases in `finally`; if you await, the lock holds across the await and other triggers stack up.
- **Don't seed counter values from outside the surface that owns them** — e.g., `setHudWinCountersForAllPlayers` should only call `setCounterText` on `refs.leftWinsText`; the lazy `seedTopHudFromState` is responsible for seeding from State on first build. Mixing the two creates a "who-overwrites-whom" race when both fire in the same tick.
- **Don't trigger a lazy surface from OPJG** — the whole point of the refactor is to keep OPJG light. If you need a surface visible immediately on join, it belongs in the eager shell.

---

## Future work

- **Phase C** (deferred): route Ready Dialog + Admin Panel through `triggerLazyBuild`. Pure bookkeeping — adds telemetry counters + a place to hang `LAYOUT_VERSION` invalidation. No frame-budget benefit.
- **Phase D** (deferred): revert altimeter to lazy using the new `ensureHud*` helpers from `lazy-build.ts`. Currently eager + stable; revert adds risk for no gain.
- **MP concurrent-join validation**: the load-bearing test for whether Phases A+B fixed the crash. Run with ≥5 simultaneous joins; if termination still occurs, the next deferral target is probably `ensureClockUIAndGetCache` or `rebuildOvertimeUiForPlayer` (both still eager in OPJG).
- **Frame-budget instrumentation**: if the crash recurs, add timing probes around each OPJG step that log ms-per-section to a HUD widget. Data > guessing.
