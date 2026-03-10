// @ts-nocheck
// Module: compact runtime changelog

//#region -------------------- Changelog / History --------------------

// v0.295: HUD polish: synchronize popout+engage force-hide timing, shift engage status text up 1px, and tint active top-row muted slot dark blue/red by owner (neutral stays gray)
// v0.294: Bleed differential authority correction: reverted to capture-state owner counts and added pre-event neutralization/recapture edge inference in authoritative owner resolver for missed callback windows
// v0.293: Bleed differential transition fix: ownership counts now use visual-authoritative owner state first (capture fallback) to prevent neutralization/recapture stale chevron/bleed windows
// v0.292: Phase3 HUD polish: add per-player projection snapshots (engaged/popout/engage/top-slot neutralization) and transition counters for swap/render regression triage
// v0.291: HUD polish: force-hide popout/engage now uses name-fallback rebind; top-row cleanup path no longer cache-only
// v0.290: HUD polish: top-row slot cache-rebind hardening and force-hide border suppression to prevent active-lane border persistence
// v0.278: CQ_Bug_3 count-source fix: removed deployed-state filter from `GetPlayersOnPoint` counting so first post-swap engage visibility is not suppressed by transient deployed-map desync
// v0.277: CQ_Bug_3 ordering fix: removed deploy-time engage bind clear and enter-time deployed guard so capture-point enter binds survive swap/deploy event ordering and first post-swap neutralization can render
// v0.276: CQ_Bug_3 first-entry fix: capture-point enter no longer ignores binds during swap-pending window, so first valid post-swap objective entry remains bound and renders once swap gate clears
// v0.275: CQ_Bug_3 first-entry follow-up: on-point soldier counting now resolves team from authoritative live player team (no mismatch-drop), preventing first post-swap engage suppression while capturing
// v0.274: CQ_Bug_3 ownership handoff: engage panel now binds on `OnPlayerEnterCapturePoint`/`OnPlayerExitCapturePoint`; removed `GetPlayersOnPoint` engage binding to avoid stale post-swap panel activation
// v0.273: CQ_Bug_3 simplification pass: removed engage candidate/unsuppress swap-confirm state; engage panel authority is now capture sync `engagedObjIdByPid` + deployed + swap-pending gate only
// v0.272: CQ_Bug_3 capture-sample hardening: engage gate restored short swap suppression and capture sync now rejects team-mismatched `GetPlayersOnPoint` echoes before counting/binding (capture-point logic only; no area-trigger dependency)
// v0.271: CQ_Bug_3 deep pass: removed engage dependence on main-base area-trigger state and moved engage activation to capture-point-only stability filtering (consecutive sync samples after swap)
// v0.270: CQ_Bug_3 spawn-false-positive fix: engage is now gated off in main base (`inMainBaseByPid`) and swap-clear suppression was removed from engage render/bind paths to avoid first-valid-entry suppression after team swap
// v0.269: CQ_Bug_3 state-ownership fix: engage now uses sync-pass on-point snapshot as single source (removed render-time GetPlayersOnPoint re-sample), and swap suppression is applied at bind-time to avoid first-entry misses and swap echo flip-flops
// v0.268: CQ_Bug_3 deadlock fix: replaced swap engage off-point release dependency with deterministic short sync-tick suppression window so engage cannot remain permanently blocked after team swap
// v0.267: CQ_Bug_3/6 targeted fix: restored swap-clear off-point release gate in capture sync (suppress stale post-swap engage echoes) and added first-life bleed-chevron core recovery when bleed is active but chevron refs are unresolved
// v0.266: CQ_Bug_3 ownership refactor: engage visibility now uses one gate (deployed + not swap-pending + on-point active objective); removed main-base/swap-clear suppression path from engage bind sync
// v0.265: CQ_Bug_3/6 hardening: engage now base-gated with in-base binding suppression; deploy now forces immediate clean bleed-chevron projection pass for first-life visibility
// v0.264: CQ_Bug_3 authority simplification: engage is now hard-gated by deployed+out-of-main-base and in-base sync binding suppression, preventing swap-spawn stale neutralizing while allowing first legit post-swap capture
// v0.263: CQ_Bug_3 follow-up: swap engage suppression now blocks stale on-point echoes only during short swap-lock window, then releases immediately so first legitimate post-swap capture shows engage panel
// v0.262: CQ_Bug_3/6 authority pass: swap engage now releases only after sync observes deployed off-point sample; deploy seeds perspective team for first-life chevron/team HUD stability
// v0.261: CQ_Bug_3 root fix pass: removed mixed ownership of engage bindings by making `engagedObjIdByPid` sync-pass authoritative only (event capture ticks no longer bind per-player engage state)
// v0.260: removed temporary startup/main-loop fault wrappers from game-mode start path; retained compact ASCII changelog file and prior v0.258 engage rollback for minimal regression surface
// v0.259: startup resiliency hardening: wrapped mode-start initialization and main loop body with fault-isolation guards so single runtime throws cannot kill full script/UI lifecycle
// v0.258: hotfix rollback of v0.257 engage sample/ref-resolution changes after startup-load regression report; restored prior engage sampling/render paths for stability
// v0.257: CQ_Bug_3 stabilization pass: validate on-point samples against player authoritative team before engage bind, and name-first engage widget resolution
// v0.256: CQ_Bug_3 direct-state engage rule: engage visibility keys only off deployed + engagedObjIdByPid
// v0.255: CQ_Bug_3 simplification follow-up: removed engage swap-lock suppression from engage visibility path
// v0.254: CQ_Bug_3 simplification: removed latch-driven unsuppress dependency from engage view derivation
// v0.253: CQ_Bug_3 gate hardening: require authoritative off-point sample before swap-clear release
// v0.252: CQ_Bug_3 authority fix: moved swap-clear release ownership to live tick and blocked stale bind while clearing
// v0.251: CQ_Bug_3 fix: stop resetting unsuppress confirmation inside force-hide path
// v0.250: CQ_Bug_3/4 follow-up: removed deploy-time teardown from swap path and raised unsuppress confirmation to 2 ticks
// v0.249: CQ_Bug_3 stale-overlay hardening: deploy-after-swap authoritative destroy/rebuild for engage widget de-duplication
// v0.248: CQ_Bug_3 regression correction: removed conflicting swap-clear release path and unified lock behavior
// v0.247: CQ_Bug_3 gate stabilization: strict off-point release plus live-tick processing outside HUD-dirty gate
// v0.246: CQ_Bug_3/6 stale-handle hardening: name-based engage/chevron rebinding and suppression-path hide
// v0.245: CQ_Bug_3/6 follow-up: release on first valid on-point sample and add chevron clean-tick refresh
// v0.244: CQ_Bug_6 first-instance stabilization: chevron core-ref backfill and retry render queue
// v0.243: CQ_Bug_3 correction: require deployed off-point clear after swap before engage can show
// v0.242: CQ_Bug_3 refinement: release swap-clear on first valid sample (off-point or valid on-point)
// v0.241: UI polish: crown shadow vertical rebalance
// v0.240: CQ_Bug_3 hard gate: explicit swap-clear required state
// v0.239: CQ_Bug_3 first-entry polish: first valid on-point tick unsuppresses engage panel
// v0.238: UI polish: stronger top crown shadow silhouette
// v0.237: CQ_Bug_3/4/6 recovery: non-destructive swap projection + engage unsuppress confirmation gating
// v0.236: CQ_Bug_3 pass: deploy-after-swap authoritative teardown/rebuild and hidden-until-render strategy
// v0.235: UI polish: crown shadow +1 halo
// v0.234: UI polish: centered all-sides crown shadow halo
// v0.233: CQ_Bug_3/4/6 hardening: force-hide full V2 set on swap start; release via deploy callback
// v0.232: CQ_Bug_4 stabilization: hidden-root rebuild flow and one authoritative redraw after swap
// v0.231: UI polish: ticket leader crown drop-shadow layers
// v0.230: compile-safe CQ_Bug_3/4 + CQ_Bug_6 pass: cached swap refresh, engage clear before release, chevron restack
// v0.229: CQ_Bug_3/4 + CQ_Bug_6 pass: non-destructive swap refresh, root-last reveal, per-render chevron restack
// v0.228: CQ_Bug_1/2/3/4 hardening: swap gate before ensure/build, pending bind block, neutral fill clamp

// Changelog discipline (required):
// - On every `npm run bumpVersion`, append one concise entry here before testing handoff.
// - Keep newest-first ordering and include bug IDs when applicable.
// - Keep this file compact; deep historical notes belong in design docs, not runtime script.

//#endregion ----------------- Changelog / History --------------------
