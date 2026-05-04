// @ts-nocheck
// Module: index/delay-broadcast -- LIVE-phase delay-elapsed on-screen broadcasts
//
// Displays a transient "X is now available!" text widget at the top-center of the screen
// (just below the engage panel) at the moment each ACTIVE_MAP_CONFIG.roundStart*Delay tunable
// elapses post-LIVE. Each broadcast is visible for DISPLAY_DURATION_MS, then auto-hides.
//
// Schedule: 4 Timers.setTimeout calls fire from startMatch (in conquest-flow.ts), one per
// delay tunable. Token-based cancellation: bumping _activeToken invalidates any in-flight
// callback whose captured token no longer matches.
//
// Per-PID widget cache (per locked architectural rule). Lazy-built on first broadcast for
// each pid; cleaned up via destroyDelayBroadcastWidgetForPid in cleanupHudForPid.
//
// Late-joiner behavior: NO REPLAY. A player joining at LIVE+45s never sees the LIVE+30s
// broadcast — broadcasts are moment-of-unlock announcements, not state indicators. Per user
// direction (5.03.26_conquest_delay_broadcasts_plan.md Q5).
//
// Independent surface (NOT a child of engage-root or combat HUD). Pixel-positioned via
// TopCenter anchor at a Y just below where the engage panel ends. Per user direction (Q3).
//
// Plan archive: design_doc/5.03.26_conquest_delay_broadcasts_plan.md.

namespace DelayBroadcast {
    // Visible duration of each broadcast (ms). Per user direction: 5 seconds.
    const DISPLAY_DURATION_MS = 5000;

    // Layout constants. Width sized to fit the longest broadcast string ("Vehicles can Forward
    // Ground Deploy (Purple Smoke)!" — 50 chars at fontSize 18) with safe horizontal padding.
    // Y picked to land below the engage panel with comfortable clearance. v1.455 initial Y=150
    // overlapped the engage track; v1.456 bumped to Y=220 per SP-test feedback.
    // TopCenter anchor with X=0 means centered horizontally on screen.
    const WIDGET_WIDTH = 600;
    const WIDGET_HEIGHT = 28;
    const WIDGET_Y = 220;
    const WIDGET_X = 0;
    const TEXT_SIZE = 20;
    const BG_ALPHA = 0.75;
    const BG_COLOR: [number, number, number] = [0, 0, 0];
    const TEXT_COLOR: [number, number, number] = [1, 1, 1];

    // Module-level scheduler state. _activeToken bumps on every cancel/restart so an in-flight
    // setTimeout callback can detect it has been invalidated and no-op cleanly.
    let _activeToken: number = 0;
    let _scheduledTimerIds: number[] = [];

    // Public: called from conquest-flow.ts startMatch immediately after lifecycleSetLiveBaseline.
    // Reads ACTIVE_MAP_CONFIG and schedules 4 setTimeouts at the configured delay offsets.
    // Idempotent on the call side: cancelDelayBroadcastsForLive() runs first.
    export function scheduleDelayBroadcastsForLive(): void {
        cancelDelayBroadcastsForLive();
        _activeToken += 1;
        const token = _activeToken;
        scheduleOne(token, ACTIVE_MAP_CONFIG.roundStartAirDelay,            mod.stringkeys.twl.countdown.delayAircraftHqBroadcast);
        scheduleOne(token, ACTIVE_MAP_CONFIG.roundStartAirDeployDelay,      mod.stringkeys.twl.countdown.delayAircraftAirBroadcast);
        scheduleOne(token, ACTIVE_MAP_CONFIG.roundStartForwardDeployDelay,  mod.stringkeys.twl.countdown.delayForwardBroadcast);
        scheduleOne(token, ACTIVE_MAP_CONFIG.roundStartGadgetDelay,         mod.stringkeys.twl.countdown.delayGadgetsBroadcast);
    }

    // Public: called from conquest-flow.ts endMatch + triggerFreshMatchSetup. Bumps the active
    // token (any in-flight callback no-ops on token mismatch), clears all pending Timers handles,
    // and force-hides any currently visible broadcast.
    export function cancelDelayBroadcastsForLive(): void {
        _activeToken += 1;
        for (let i = 0; i < _scheduledTimerIds.length; i++) {
            Timers.clear(_scheduledTimerIds[i]);
        }
        _scheduledTimerIds = [];
        forceHideDelayBroadcastForAllPlayers();
    }

    // Public: called from cleanupHudForPid in player-join-leave.ts on player disconnect.
    // Cancels the per-pid hide timer (if pending) and deletes the widget tree.
    export function destroyDelayBroadcastWidgetForPid(pid: number): void {
        const entry = State.hudCache.delayBroadcastByPid[pid];
        if (!entry) return;
        if (entry.hideTimerId !== undefined) {
            Timers.clear(entry.hideTimerId);
        }
        if (entry.root) {
            try { mod.DeleteUIWidget(entry.root); } catch {}
        }
        if (entry.text) {
            try { mod.DeleteUIWidget(entry.text); } catch {}
        }
        delete State.hudCache.delayBroadcastByPid[pid];
    }

    // Internal. Schedules a single broadcast at delaySeconds * 1000 ms in the future. Skips
    // unset (undefined) and zero/negative delays — those mean "feature is unlocked from LIVE
    // start, no announcement needed".
    function scheduleOne(token: number, delaySeconds: number | undefined, stringKey: number): void {
        if (delaySeconds === undefined || delaySeconds <= 0) return;
        const timerId = Timers.setTimeout(() => {
            if (token !== _activeToken) return;
            broadcastToAllPlayers(stringKey);
        }, delaySeconds * 1000);
        _scheduledTimerIds.push(timerId);
    }

    // Internal. Fires a broadcast to every valid player: lazy-builds the widget if needed,
    // sets the text label, makes it visible, and schedules an auto-hide setTimeout.
    function broadcastToAllPlayers(stringKey: number): void {
        const message = msg(stringKey);
        forEachValidPlayer((player, pid) => {
            const cache = ensureDelayBroadcastWidget(pid, player);
            if (!cache?.root || !cache?.text) return;
            // Cancel any in-flight hide timer for this pid so back-to-back broadcasts (edge case;
            // tunables should never overlap per the firestorm config "delays must be >5s from
            // all other delays!" comment) cleanly restart the visibility window instead of
            // hiding mid-display.
            if (cache.hideTimerId !== undefined) {
                Timers.clear(cache.hideTimerId);
                cache.hideTimerId = undefined;
            }
            safeSetUITextLabel(cache.text, message);
            safeSetUIWidgetVisible(cache.root, true);
            safeSetUIWidgetVisible(cache.text, true);
            cache.hideTimerId = Timers.setTimeout(() => {
                cache.hideTimerId = undefined;
                safeSetUIWidgetVisible(cache.text, false);
                safeSetUIWidgetVisible(cache.root, false);
            }, DISPLAY_DURATION_MS);
        });
    }

    // Internal. Lazy-builds the per-pid widget on first broadcast. Returns the cache entry
    // (or undefined if the build failed). Subsequent broadcasts reuse the cached widget.
    function ensureDelayBroadcastWidget(pid: number, player: mod.Player): DelayBroadcastWidgetCacheEntry | undefined {
        const existing = State.hudCache.delayBroadcastByPid[pid];
        if (existing?.root && existing?.text) return existing;

        const rootName = `DelayBroadcastRoot_${pid}`;
        const textName = `DelayBroadcastText_${pid}`;

        // Defensive cleanup of any orphan widgets from a prior interrupted build.
        for (let i = 0; i < 4; i++) {
            const w = safeFind(rootName);
            if (!w) break;
            try { mod.DeleteUIWidget(w); } catch { break; }
        }
        for (let i = 0; i < 4; i++) {
            const w = safeFind(textName);
            if (!w) break;
            try { mod.DeleteUIWidget(w); } catch { break; }
        }

        safeParseUI({
            name: rootName,
            type: "Container",
            playerId: player,
            anchor: mod.UIAnchor.TopCenter,
            position: [WIDGET_X, WIDGET_Y],
            size: [WIDGET_WIDTH, WIDGET_HEIGHT],
            visible: false,
            bgColor: BG_COLOR,
            bgAlpha: BG_ALPHA,
            bgFill: mod.UIBgFill.Blur,
        });

        safeParseUI({
            name: textName,
            type: "Text",
            playerId: player,
            anchor: mod.UIAnchor.TopCenter,
            position: [WIDGET_X, WIDGET_Y],
            size: [WIDGET_WIDTH, WIDGET_HEIGHT],
            visible: false,
            bgAlpha: 0,
            textLabel: msg(mod.stringkeys.twl.countdown.delayAircraftHqBroadcast),
            textColor: TEXT_COLOR,
            textAlpha: 1,
            textSize: TEXT_SIZE,
            textAnchor: mod.UIAnchor.Center,
        });

        const root = safeFind(rootName) as mod.UIWidget | undefined;
        const text = safeFind(textName) as mod.UIWidget | undefined;
        if (!root || !text) return undefined;

        const entry: DelayBroadcastWidgetCacheEntry = { root, text, hideTimerId: undefined };
        State.hudCache.delayBroadcastByPid[pid] = entry;
        return entry;
    }

    // Internal. Hides every currently-built broadcast widget. Called from cancelDelayBroadcastsForLive.
    function forceHideDelayBroadcastForAllPlayers(): void {
        const cache = State.hudCache.delayBroadcastByPid;
        for (const pidStr of Object.keys(cache)) {
            const entry = cache[Number(pidStr)];
            if (!entry) continue;
            if (entry.hideTimerId !== undefined) {
                Timers.clear(entry.hideTimerId);
                entry.hideTimerId = undefined;
            }
            safeSetUIWidgetVisible(entry.text, false);
            safeSetUIWidgetVisible(entry.root, false);
        }
    }
}
