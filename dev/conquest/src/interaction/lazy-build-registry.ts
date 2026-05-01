// @ts-nocheck
// Module: interaction/lazy-build-registry -- Wave 3 per-UI lazy-load config + dispatch
//
// The registry is a const map keyed by UI surface name; every entry encodes its
// build cadence (sync vs paced), hitch budget, mutex participation, and teardown
// trigger. The dispatcher (triggerLazyBuild) resolves the player from pid,
// catches throws, releases mutex/per-surface locks, and lets the next call
// retry cleanly (Wave 3 plan analysis G').
//
// Ship 1 scope: registry + pacer + mutex foundation. No production code path is
// re-routed through triggerLazyBuild yet. Existing prebuild flow in actions.ts
// is unchanged. Subsequent ships re-route per-surface triggers (Ships 2-7) and
// finally delete the bulk prebuild path (Ship 8).
//
// Retune at edit time + bumpVersion. No runtime mutation API is provided; this
// matches AGENTS.md's "explicit human approval" preference.
//
// See design_doc/4.27.26_conquest_wave_3_plan.md analysis A + G' for shape.

type LazyBuildSurfaceName =
    | 'combatHud'
    | 'topHudShell'
    | 'vehicleDeployTimer'
    | 'supplyBox'
    | 'readyDialog'
    | 'boundaryPrompt';

interface LazyBuildConfig {
    name: LazyBuildSurfaceName;
    showPlaceholder: boolean;
    placeholderDelayMs: number;
    hitchBudgetMs: number;
    builder: 'sync' | 'paced';
    pacedOpsPerTick: number;
    serializesWith: LazyBuildSurfaceName[];
    teardownTrigger: 'disconnect' | 'roundEnd' | 'matchEnd' | 'menuClose' | 'never';
}

// Wave 3 plan v1.0 initial values (locked 2026-04-27). Retune by editing this
// map and bumpVersion. To flip a surface to paced builder: change builder to
// 'paced' and set pacedOpsPerTick (>=1).
const LAZY_BUILD_REGISTRY: { readonly [K in LazyBuildSurfaceName]: LazyBuildConfig } = {
    combatHud: {
        name: 'combatHud',
        showPlaceholder: false,
        placeholderDelayMs: 0,
        hitchBudgetMs: 500,
        builder: 'sync',
        pacedOpsPerTick: 0,
        serializesWith: ['vehicleDeployTimer'],
        teardownTrigger: 'disconnect',
    },
    topHudShell: {
        name: 'topHudShell',
        showPlaceholder: false,
        placeholderDelayMs: 0,
        hitchBudgetMs: 500,
        builder: 'sync',
        pacedOpsPerTick: 0,
        serializesWith: [],
        teardownTrigger: 'disconnect',
    },
    vehicleDeployTimer: {
        name: 'vehicleDeployTimer',
        showPlaceholder: true,
        placeholderDelayMs: 100,
        hitchBudgetMs: 300,
        builder: 'sync',
        pacedOpsPerTick: 0,
        serializesWith: ['combatHud'],
        teardownTrigger: 'disconnect',
    },
    supplyBox: {
        name: 'supplyBox',
        showPlaceholder: false,
        placeholderDelayMs: 0,
        hitchBudgetMs: 50,
        builder: 'sync',
        pacedOpsPerTick: 0,
        serializesWith: [],
        teardownTrigger: 'disconnect',
    },
    readyDialog: {
        name: 'readyDialog',
        showPlaceholder: true,
        placeholderDelayMs: 200,
        hitchBudgetMs: 500,
        builder: 'sync',
        pacedOpsPerTick: 0,
        serializesWith: [],
        teardownTrigger: 'roundEnd',
    },
    boundaryPrompt: {
        name: 'boundaryPrompt',
        showPlaceholder: false,
        placeholderDelayMs: 0,
        hitchBudgetMs: 200,
        builder: 'sync',
        pacedOpsPerTick: 0,
        serializesWith: [],
        teardownTrigger: 'matchEnd',
    },
};

// Per-surface in-flight pid set. Re-entrancy guard so we never double-build the
// same surface for the same pid before the first build settles or fails.
// Cleared in triggerLazyBuild's finally block on every dispatch outcome.
const _lazyBuildInFlightByName: { [K in LazyBuildSurfaceName]: Set<number> } = {
    combatHud: new Set<number>(),
    topHudShell: new Set<number>(),
    vehicleDeployTimer: new Set<number>(),
    supplyBox: new Set<number>(),
    readyDialog: new Set<number>(),
    boundaryPrompt: new Set<number>(),
};

const _lazyBuildSuccessByName: { [K in LazyBuildSurfaceName]: number } = {
    combatHud: 0,
    topHudShell: 0,
    vehicleDeployTimer: 0,
    supplyBox: 0,
    readyDialog: 0,
    boundaryPrompt: 0,
};

const _lazyBuildErrorByName: { [K in LazyBuildSurfaceName]: number } = {
    combatHud: 0,
    topHudShell: 0,
    vehicleDeployTimer: 0,
    supplyBox: 0,
    readyDialog: 0,
    boundaryPrompt: 0,
};

// Public registry accessor. Returns the locked config for a surface; the caller
// should treat the result as read-only.
function getLazyBuildConfig(name: LazyBuildSurfaceName): LazyBuildConfig {
    return LAZY_BUILD_REGISTRY[name];
}

// Telemetry helpers for SP smoke instrumentation. Counts increment on every
// dispatch outcome; not exposed as a runtime tuning surface.
function getLazyBuildSuccessCount(name: LazyBuildSurfaceName): number {
    return _lazyBuildSuccessByName[name];
}

function getLazyBuildErrorCount(name: LazyBuildSurfaceName): number {
    return _lazyBuildErrorByName[name];
}

function isLazyBuildInFlight(name: LazyBuildSurfaceName, pid: number): boolean {
    return _lazyBuildInFlightByName[name].has(pid);
}

// Resolves the per-surface synchronous builder closure. Closes over the
// resolved player + pid so the dispatcher can fire-and-forget without
// re-resolving.
//
// Ship 1 mapping: every surface delegates to the existing prebuild family
// helper in actions.ts (top HUD shell, vehicle deploy timer, combat HUD, ready
// dialog), ammo-resupply-menu.ts (supply box), or boundary/prompt-ui.ts
// (boundary prompt). No surface yet uses a brand-new lazy builder; ships 2-7
// introduce those by replacing the per-surface case body here.
function _resolveLazyBuildHandler(
    name: LazyBuildSurfaceName,
    eventPlayer: mod.Player,
    pid: number
): (() => void) | undefined {
    switch (name) {
        case 'topHudShell':
            return () => prebuildTopLeftUiFamilyWhileHidden(eventPlayer, pid);
        case 'vehicleDeployTimer':
            return () => prebuildVehicleSpawnerUiFamilyWhileHidden(eventPlayer, pid);
        case 'combatHud':
            return () => prebuildCombatHudFamilyWhileHidden(eventPlayer, pid);
        case 'readyDialog':
            return () => prebuildReadyDialogUiFamilyWhileHidden(eventPlayer, pid);
        case 'supplyBox':
            return () => {
                if (!armCacheOk(State.hudCache.ammoResupplyMenuCache[pid])) {
                    prebuildArmMenu(eventPlayer);
                }
            };
        case 'boundaryPrompt':
            return () => {
                ensureBoundaryPromptUiForPlayer(eventPlayer);
            };
    }
    return undefined;
}

// Logs a lazy-build error to the runtime console. World-log emission is
// deferred until a registered string key is approved (AGENTS.md String Change
// Authorization Policy). Console output is sufficient for SP smoke verification.
function _logLazyBuildError(name: string, pid: number, err: unknown): void {
    const errMsg = (err && (err as any).message) ? (err as any).message : String(err);
    try {
        console.log(`[lazy-build:${name}:${pid}] ${errMsg}`);
    } catch {}
}

// Dispatches a lazy build for the named surface and pid.
//
// Behavior contract (Wave 3 plan G'):
//   - Re-entrancy: returns early if a build for (name, pid) is already in flight.
//   - Disconnect guard: returns early if the player is no longer resolvable.
//   - Mutex: surfaces with non-empty serializesWith try to acquire the global
//     heavy-build mutex; if held, the call enqueues a retry op into the paced
//     drainer (10Hz) so the next tick re-enters with the mutex available.
//   - Sync builders run inline; their hitch counts against the caller's frame.
//   - Errors: caught, logged, error counter bumped. The per-surface lock and
//     mutex are released in finally so the next call retries cleanly.
function triggerLazyBuild(name: LazyBuildSurfaceName, pid: number): void {
    const config = LAZY_BUILD_REGISTRY[name];
    if (!config) return;

    const inFlight = _lazyBuildInFlightByName[name];
    if (inFlight.has(pid)) return;

    const eventPlayer = safeFindPlayer(pid);
    if (!eventPlayer || !isValidPlayer(eventPlayer)) return;

    const handler = _resolveLazyBuildHandler(name, eventPlayer, pid);
    if (!handler) return;

    const needsMutex = config.serializesWith.length > 0;
    let mutexAcquired = false;

    if (needsMutex) {
        if (LazyBuildPacer.tryAcquireHeavyBuildMutex(name, pid)) {
            mutexAcquired = true;
        } else {
            // Mutex busy elsewhere -- enqueue a retry op into the paced drainer.
            // Will re-enter triggerLazyBuild on the next 10Hz tick once the
            // current mutex holder releases.
            LazyBuildPacer.enqueueBuildOp(name, pid, () => triggerLazyBuild(name, pid), 1);
            return;
        }
    }

    inFlight.add(pid);
    try {
        handler();
        _lazyBuildSuccessByName[name] = _lazyBuildSuccessByName[name] + 1;
    } catch (err) {
        _lazyBuildErrorByName[name] = _lazyBuildErrorByName[name] + 1;
        _logLazyBuildError(name, pid, err);
    } finally {
        inFlight.delete(pid);
        if (mutexAcquired) {
            LazyBuildPacer.releaseHeavyBuildMutex();
        }
    }
}
