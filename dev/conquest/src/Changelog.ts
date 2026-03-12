// @ts-nocheck
// Module: compact runtime changelog

//#region -------------------- Changelog / History --------------------

// v0.454: Force top-left status text ownership/layout, retire legacy ready lane visibility, and realign core bar/chevron/shadow tuning
// v0.453: Fix top-left status text ownership, recenter ticket chevrons, and normalize HUD shadow ring symmetry
// v0.452: Fix top-left status lane parenting, reduce startup HUD churn, and snap core ticket bars to pixel grid
// v0.451: HUD core pass: fix swap reveal delay, restore top-left status lane, tune shadow rings, and restore flag border ownership
// v0.450: Fix bug 4: hide combat HUD until team-switch rebuild completes
// v0.449: bug4 swap gate: keep combat HUD hidden/destroyed while team-swap reset is pending until deploy rebuild release
// v0.448: hud top-row borders: restore visible border alpha and gate border color/visibility to authoritative full ownership state
// v0.447: hud status lane follow-up: enforce reparent after build/refresh and align top-left status panel height with branding
// v0.446: hud polish: pixel-snap ticket bars, top-left status stack relocation, engage/letter shadow parity, and first-boot core HUD fault isolation
// v0.445: hud-core: convert objective and popout letter shadows to symmetric 8-way ring halos
// v0.444: size-cut: removed header game-mode description block and pruned inactive combat-v2 runtime imports to shim
// v0.443: process: enforce 1MiB bundle size cap in verify and document guardrail in AGENTS
// v0.442: bundle-size: remove runtime Changelog import from entrypoint
// v0.441: hud-core: harden shadow-ring array access to tolerate stale entries during hide/render
// v0.440: hud-core: restore differential bleed chevrons, add reusable shadow-ring profiles for chevrons+percents, and nudge engage/percent lane Y
// v0.439: hud-core: make popout/engage first-frame reveals atomic and stabilize chevron visibility/shadow cleanup
// v0.438: hud-core: remove ticket shadows, tune legacy shadow offsets, harden chevrons visibility, and tighten popout/engage spacing
// v0.437: hud-core: lower popout, tighten engage gap, restore chevrons visibility, add combat text drop-shadows
// v0.436: hud-core engage lane: pixel-snap root x to stabilize symmetric count-box gap alignment
// v0.435: hud-core: add percent chip backgrounds and tune ticket/popout/engage vertical alignment
// v0.434: hud visibility: prevent help text from reappearing after team swap in live match
// v0.433: hud-core positioning: move ticket counter row down to bar lane and lower popout lane
// v0.432: hud-core parity: lower stack slightly, compute core leader team for ticket lead indicators, add engage count chip backgrounds, and keep bleed chevrons static-visible
// v0.431: hud-core tickets: hide center slash separator
// v0.430: hud-core positioning: lower full combat stack and normalize ticket counter/slash row alignment
// v0.429: hud-core: lower combat stack below clock via dedicated top-stack offset
// v0.428: hud-core build-pass pulse fix + localized fallback label keys
// v0.427: runtime ticket layout + snapshot fallback + objective label stabilization
// v0.426: fix core ticket bar start-fill ratio and align ticket spacing to configured objective count
// v0.425: rollback recent core hud runtime experiments to isolate startup no-load while keeping HQ fail-open guard
// v0.424: harden startup map detection: fail-open HQ probe to prevent full experience boot abort
// v0.423: stabilize core hud flicker: isolate per-player runtime faults, add capture sample grace, harden flag letter fallback
// v0.422: Core HUD parity/cadence pass: restored legacy ticket spacing model and moved live capture sync to sub-second updates
// v0.421: Core HUD surface visibility fix: apply solid-fill + alpha on ticket bars, flag slots, popout, and engage track
// v0.420: Core HUD root acquisition fix: relax TopHudRoot validation and add fallback binding for hud-core build
// v0.419: HUD core recovery pass: prevent mode-off latch on transient faults and stabilize shared HUD palette constants
// v0.417: HUD core phase-3 pass: ticket boxes+borders+crowns, inline flags, popout, engage panel, and bleed chevrons in isolated render path
// v0.416: Core HUD visibility hardening: make strict ref validation advisory so combat lane still renders after recovery
// v0.415: Core combat HUD visibility fix: use twl.system.slash key and clear hudModeOverride on startup scaffold
// v0.414: HUD core runtime failsafe: isolate startup/live loops from HUD exceptions; start spawners before HUD warmup
// v0.413: Hard-cut HUD core scaffold: TwlConquestHud isolated root chain + early centering probe
// v0.412: CQ_Bug_9 isolate v2 owner: stop legacy combat build in ensureHudForPlayer
// v0.411: CQ_Bug_9 v2 containment: startup hard purge + first-ensure duplicate purge + centered root-chain validation
// v0.410: phase3 hud: isolate v2 combat loop + fail-open optional widgets
// v0.409: v2 owner flow fix: keep non-combat HUD updates active while suppressing legacy combat lanes
// v0.408: enable combat HUD gate for v2-only centering validation pass
// v0.407: combat HUD single-owner cutover: suppress legacy combat render path when v2 owner is active
// v0.406: disable combat HUD feature gate to restore baseline non-combat verification
// v0.405: enable combat HUD feature gate for in-game v2 testing
// v0.404: combat-v2: add ticket bleed-chevron widgets and render counts from bleed differential
// v0.403: combat-v2: add ticket leader border widgets with per-side render + lifecycle cleanup
// v0.402: combat-v2: run main lane render each cadence tick (remove stale dirty gating)
// v0.401: combat-v2: render active popout/engage lanes and add lifecycle hide/destroy coverage
// v0.400: combat v2 flags lane scaffolded (7 centered slots with label/fill render) and lifecycle hide/destroy coverage added
// v0.399: combat v2 tickets lane scaffolded (bars/counters) under deterministic v2 root chain; hidden when combat gate is off
// v0.398: combat v2 now builds/pins deterministic root chain (TopHudRoot->CombatV2->tickets/flags) with explicit hide/destroy lifecycle on swap/cleanup
// v0.397: combat v2 scaffold added (layout/cache/lifecycle/render/scheduler owners) plus join prompt policy-disabled suppression tracking
// v0.396: combat HUD isolation gate; preserve ready/admin/branding/victory paths while combat HUD is disabled
// v0.391: HUD subtree ref-owner enforcement: Conquest cached/build ensure now rebinds tickets/flags/popout/engage refs from pinned centered subtrees only (no global same-name lookup), and live critical checks now validate child-parent ownership for ticket containers/bars and flag slot roots so off-root/top-left handles are hard-rejected and rebuilt
// v0.390: HUD critical-ref geometry gate: live render critical checks now require centered anchor+position for TopHudRoot/ConquestCombatHudRoot/TicketsRoot/FlagsRoot (not just parent-chain), forcing rebuild whenever a top-left root chain appears
// v0.389: HUD root-owner hardening: removed cached name-based combat-root hydration, moved critical/ref validation to cached root-handle identity (`topHudRoot` + `conquestCombatRoot`), and removed ticket-counter hot-path parent rebinding so render updates cannot drift core widgets to top-left frames
// v0.388: HUD rebuild-loop fix: replaced fragile parent-name critical check with direct parent-widget identity validation and enforced layout-revision rebuild from the live render loop so stale cached trees are rebuilt once instead of oscillating/flickering
// v0.387: HUD centering architecture shift: moved Conquest tickets/flags roots to direct UIRoot TopCenter centering (clock-style), removed ConquestCombatHudRoot as active parent authority, and relaxed critical-ref parent validation to shared-parent consistency for deterministic center-frame rendering
// v0.386: HUD centering reliability pass: switched TopHudRoot/ConquestCombatHudRoot creation to ParseUI containers and added one-time per-PID HUD layout revision rebuild so stale cached root trees cannot bypass centered parent-chain normalization
// v0.385: HUD root-chain correction: switched combat HUD authority to TopHudRoot->ConquestCombatHudRoot, removed ConquestHudRoot active path, and aligned critical-ref parent checks to teardown spec
// v0.384: Conquest root enforcement: ensure now rejects stale cached HUD trees not parented under ConquestHudRoot->ConquestCombatHudRoot, hard-purges them, and rebuilds a single deterministic per-PID Conquest HUD tree.
// v0.383: Conquest HUD file split: moved Conquest HUD ensure/build owner from hud/build.ts into ui/conquest/hud-build.ts and switched index wiring; Conquest combat parent chain now uses dedicated ConquestHudRoot.
// v0.382: Conquest HUD root isolation: added dedicated ConquestHudRoot per PID, reparented combat HUD under it (no shared TopHudRoot parent), and updated lifecycle/cleanup/critical-ref parent-chain checks.
// v0.381: HUD lifecycle simplification: removed cached parent-chain validation/recovery path and replaced with hard stale-tree purge + deterministic rebuild when no per-PID HUD cache exists.
// v0.380: HUD teardown pass: centralized conquest lifecycle ownership, removed dead absolute-layout path, pinned tickets/flags roots to centered combat root x=0, and made bleed chevrons ticket-root local.
// v0.379: HUD centering anchor unification: ticket/flag roots now stay TopCenter under ConquestCombatHudRoot and pin to combat-center X, removing TopLeft conversion drift in root placement
// v0.378: HUD parent-chain authority gate: critical-ref validation now requires TopHudRoot -> ConquestCombatHudRoot -> Tickets/Flags chain and forces a clean per-PID rebuild when stale/left-anchored roots are detected
// v0.377: HUD centering simplification: introduced one centered ConquestCombatHudRoot per PID under TopHudRoot and pinned tickets/flags as static local children to eliminate split parent-chain drift on aspect changes
// v0.376: HUD centering fix: root pin path now reparents before setting TopCenter anchor so tickets/flags roots cannot reset to top-left during parent assignment
// v0.375: HUD root simplification: removed lifecycle-version mechanism, collapsed combat roots back under centered TopHudRoot, and stripped per-refresh clock reparent/position rewrites from cached path
// v0.374: HUD legacy-chain removal: removed TopHudRoot legacy Container_Top* reparent path so only explicit centered Conquest combat root chain controls top combat HUD placement
// v0.373: HUD owner-path simplification: removed lifecycle-token gating and made update loop always use ensureHudForPlayer so centered combat base-root parenting is enforced through a single per-PID owner path
// v0.372: HUD lifecycle migration: bumped per-PID lifecycle version to force one-time rebuild into centered ConquestCombatHudRoot base container for all existing players
// v0.371: HUD base-root centering pass: moved combat tickets/flags under single centered ConquestCombatHudRoot and removed magic combat root width by deriving from ticket root geometry
// v0.370: HUD stability pass: set tickets/flags combat roots visible by default and rely on per-element state visibility to prevent native HUD fallback windows while preserving per-PID lifecycle ownership
// v0.369: CQ_Bug_9 lifecycle hardening: added one-time per-PID HUD lifecycle migration token to rebuild stale trees, while keeping runtime HUD updates cache/visibility-driven and root placement deterministic
// v0.368: CQ_Bug_9 architecture pass: removed schema-coupled live HUD bootstrap, added strict per-PID critical-ref ownership validation, and pinned top combat roots to centered TopHudRoot with cached-path layout churn removed
// v0.367: HUD architecture simplification: removed runtime top-combat absolute-layout writer (cached/build ensure path) and moved to static ParseUI creation flow with schema 41 rebuild
// v0.366: HUD lifecycle cleanup: include centered lane roots in join/leave teardown to prevent stale top-lane containers across reconnects/swap churn
// v0.365: HUD centering hardening: added centered lane roots for tickets/flags under TopHudRoot and migrated combat-root normalization to lane-local [0,0] with schema 40 rebuild
// v0.364: HUD centering chain: parent Conquest tickets/flags roots to centered TopHudRoot (clock frame) and schema 39 rebuild to purge stale left-anchored trees
// v0.363: CQ_Bug_9 simplification pass: removed unused live root normalizer and migration probes from capture HUD loop; retained ensureHudForPlayer as single top-combat layout owner with PID root-ownership guard.
// v0.362: CQ_Bug_9 kickoff: added per-player cached-root ownership guard and removed live-tick root normalization/schema probing from conquest HUD render path to enforce single-owner HUD lifecycle.
// v0.361: HUD centering migration: bumped schema to force one-time rebuild after reparent-before-anchor root fix so stale top-lane trees are fully replaced.
// v0.360: HUD centering fix: reparent-before-anchor on top combat root normalization to prevent anchor reset to TopLeft on tickets/flags/engage chain.
// v0.359: HUD centering hard reset: top combat roots now parent directly to UIRoot (TopCenter, X=0) and schema bumped to rebuild stale left-anchored trees.
// v0.358: HUD centering: apply top-root normalization in ensure/build path so tickets/flags/engage do not default left in pre-live phases.
// v0.357: HUD root-missing guardrail: rebuild on any missing top combat root and block fallback child/engage projection to prevent left-edge drift; schema 36
// v0.356: HUD centering authority reset: ticket/flag roots now TopCenter X=0 with capture-normalizer as single runtime writer; removed competing root writes from build/status and forced schema rebuild
// v0.355: HUD centering model shift: tickets/flags roots now TopLeft with explicit centered X under TopHudRoot; schema 34 rebuild for stale-root purge
// v0.354: HUD centering chain: force schema rebuild and normalize tickets/flags top roots under TopHudRoot at X=0 TopCenter
// v0.352: Top HUD centering hardening: explicit centered X projection for tickets/flags roots on top-lane canvas, engage root explicit local centering, and runtime purge of legacy top-core container trees
// v0.351: HUD legacy-root purge: delete all Conquest DebugRoot/triplet leftovers every ensure and force schema rebuild to remove left/top-left stale overlays
// v0.350: HUD centering chain fix: parent tickets/flags/engage to TopHudRoot, remove clock-parent fallback, reset live root X offsets, and force schema rebuild for stale tree cleanup
// v0.349: HUD diagnostics: forced runtime X-shift probe on top combat roots to verify active HUD writer path and isolate non-responsive centering chain
// v0.348: HUD root authority normalization: live update now reapplies centered parent/anchor/position for tickets/flags/engage roots on active refs/name chain to prevent stale root drift
// v0.347: HUD migration chain completion: migration bootstrap now purges top-root/clock duplicates and forces schema rebuild path before HUD ensure to eliminate stale lane transforms
// v0.346: HUD migration dependency hardening: one-time per-player migration token now forces full HUD rebuild on this schema so stale-but-populated trees cannot bypass centering fixes
// v0.345: HUD bootstrap dependency fix: clean-frame cache/schema probe now forces rebuild when HUD cache is missing/stale after hot reload, preventing stale top-lane trees from persisting
// v0.344: HUD centering chain fix: deterministic top-frame/clock schema purge, refs-first root resolution, and runtime stale-lookup hardening for tickets/flags/engage
// v0.343: HUD centering-only correction: reverted top combat roots to TopCenter with zero-X placement (no TopLeft centering math), schema rebuild
// v0.342: HUD first-build alignment fix: removed post-clock realignment path and enforced build order so clock root is ensured before conquest HUD roots are created/positioned
// v0.341: HUD alignment reliability fix: added one-time post-clock lane realignment pass so tickets/flags bind to MatchTimerRoot even when HUD builds before clock root creation
// v0.340: HUD centerline hard-lock: bootstrap now parents tickets/flags to MatchTimerRoot when available (TopHudRoot fallback) so top lanes share the exact clock centerline on all aspects
// v0.339: HUD parent-frame audit fix: unified clock + tickets/flags/engage bootstrap parenting under centered TopHudRoot and schema-rebuilt to eliminate split-frame aspect-ratio drift
// v0.338: HUD centering authority cleanup: removed runtime root normalization path, set tickets/flags/engage roots TopCenter at build/bootstrap only, and bumped HUD schema for clean tree rebuilds
// v0.337: HUD root authority pass: re-center ticket/flag roots each render against clock/top-center parent to eliminate stale parent/anchor drift
// v0.336: HUD centering anchor shift: parent ticket/flag lanes to MatchTimerRoot centerline and keep relative deltas; schema rebuild
// v0.335: HUD centerline rebuild: derive ticket/flag root X from top-center line and preserve B-slot-relative deltas; normalize bootstrap path to parent-only
// v0.334: Center-space HUD fix: unified ticket/flag layout to centered root-local coordinates (TopCenter roots), removed mixed absolute/root sizing in update path
// v0.333: HUD centering fix follow-up: ticket/flag roots now TopLeft under centered TopHudRoot canvas (static placement), schema rebuild
// v0.332: HUD centering fix: removed per-update root normalization, enforced TopCenter on ticket/flag roots, schema bump for one-time rebuild
// v0.331: HUD centering pass: static TopCenter anchors for tickets/flags roots and engage root; removed per-update alignment path
// v0.330: HUD centering hardening: live-name-first widget rebinding, centered root normalization for tickets/flags/engage, stale-cache mitigation
// v0.317: HUD projection finalization: removed temporary absolute-layout toggle branches and normalized TopHudRoot parent/anchor/size each ensure pass to prevent stale-root drift across aspect-ratio/layout iterations
// v0.316: HUD centering correction: restored authoritative absolute layout path and added runtime root-width X compensation offset for conquest combat HUD projection (keeps existing Y geometry/tuning unchanged)
// v0.315: HUD centering fallback: disabled absolute UIRoot projection for conquest combat HUD so tickets/flags/popout/engage remain in native TopCenter root-local layout for better non-16:9 alignment
// v0.314: HUD alignment hardening: parent conquest tickets/flags lanes and bleed-chevron overlays to centered TopHudRoot so top combat HUD stays centered across non-16:9 aspect ratios (Y geometry unchanged)
// v0.313: HUD layout: global +10 Y shift for non-clock HUD groups (tickets/flags/help/ready/upper-left/admin), while match clock position remains unchanged
// v0.312: HUD layout scaling: objective-count-driven outward ticket spacing, flag row centered in middle lane at ticket-bar centerline, and upward stack shift for percent/popout/engage
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
