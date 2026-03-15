// @ts-nocheck
// Module: compact runtime changelog

//#region -------------------- Changelog / History --------------------

// v0.620: Ready dialog centering follow-up: shift the shared top lane left to match the centered roster plate edges
// v0.620: Ready dialog centering follow-up: shift the shared top lane left to realign the knob grid and apply button with the already-centered roster plate edges
// v0.619: Ready dialog centering follow-up: shift the lower roster plates left by the measured visual offset
// v0.619: Ready dialog centering follow-up: apply a measured left correction to the lower roster plates while keeping the top knob lane centered
// v0.618: Ready dialog centering: derive grid, roster, and apply button from one lane origin
// v0.618: Ready dialog centering pass: derive the apply button, grid, and roster panels from the same lane-left origin instead of mixing TopCenter and TopLeft placement
// v0.617: Ready dialog centering correction: remove the shared inner-lane left bias so the knob grid, apply button, and roster panels resolve to true center
// v0.616: Ready dialog centering pass: shift the shared content lane left so the knob grid, apply button, and roster panels align to the same visual center
// v0.615: Ready dialog row spacing pass: restore tighter knob label/value separation, normalize config arrow glyphs, shrink the players panel, narrow apply button, and widen the roster center gap again
// v0.614: Ready dialog spacing polish: separate knob labels from values, tighten config players stack, narrow apply button, and widen the centered roster gutter
// v0.613: Ready dialog lane alignment: unify knob grid to roster content width, lower knob values, and pull config players support text into the inner panel lane
// v0.612: Ready dialog layout reflow: invalidate stale cached layout, tighten config players row, and nudge knob grid upward for centered retest
// v0.611: Ready dialog polish: recenter top grid and roster panels, lower knob labels into the control lane, color team glyphs, and center lower team labels
// v0.610: Phase_5G_ready-dialog_team-relative_color_and_alignment_polish
// v0.609: Phase_5G_centered_ready-dialog_grid_polish
// v0.608: Phase_5G_ready-dialog_knob_matrix
// v0.607: Phase 5G follow-up: add Firestorm fast-mover spawn placeholders and lock ready-up grid/state-authority layout notes
// v0.606: Phase 5F follow-up: fill Firestorm jet static spawn placeholders from authored screenshot captures
// v0.605: Phase 5F groundwork: add Firestorm jet volume floor/ceiling and cardinal rotation config plus jet spawn placeholders
// v0.603: Phase 5D UI fix: widen deploy HUD root for dual-button layout and refresh Air/Ground button labels every render
// v0.602: Phase 5D/5F follow-up: split ready aircraft deploy into Air Deploy and Ground Deploy button flows
// v0.601: Phase 5F follow-up: refresh Firestorm Team 1 aircraft box corners from updated screenshot captures and flatten floor to max Y
// v0.600: Phase 5F experiment: ground-spawn heli, seat player, then teleport the occupied heli into the bounded air volume
// v0.599: Phase 5F isolation: restore exact helis-only Firestorm heli spawn transforms for static loadout testing
// v0.598: Phase 5F isolation: remap Firestorm heli slots to static ground tank-pad transforms for loadout testing
// v0.597: Phase 5F isolation: disable bounded-air relocation and restore original static aircraft spawn behavior for direct deploy testing
// v0.596: Phase 5F follow-up: use authored heli slot spawns as the fixed ground stage before 1-second air-box lift and player seat
// v0.595: Phase 5F experiment: restore static aircraft spawn, wait 1 second, then lift into the air box before player deploy and seat
// v0.594: Phase 5F experiment: stage aircraft on random ground heli pads before bounded air lift and direct-seat fulfillment
// v0.593: Phase 5F follow-up: add Firestorm Team 2 aircraft box from authored screenshot corners and reduce aircraft volume heights to 100
// v0.591: Phase 5F proof: enable Firestorm Team 1 aircraft volume and randomize aircraft spawn transform inside the authored box
// v0.589: Admin/debug fix: split vehicle rotation into stable facing-driven rotX/rotY plus object-rotation rotZ and move pos labels further left
// v0.588: Admin/debug fix: sample on-foot rotation from object rotation and use direct current vehicle handles for seated transform reads
// v0.587: Admin/debug fix: drive pos/rot sampling from script-owned soldier-vs-vehicle state and retain last-good values across transient read failures
// v0.585: Admin/debug fix: make pos/rot sampling state-driven and resilient so transient on-foot or vehicle read failures no longer kill the loop
// v0.584: Admin/debug follow-up: move the pos row labels further left while leaving the rot row unchanged
// v0.583: Admin/debug fix: use matching position and facing sources on foot and in vehicles so pos and rot update in both states
// v0.582: Admin/debug follow-up: move the pos row labels back left by the same amount and keep the rot row unchanged
// v0.581: Admin/debug follow-up: nudge pos row labels right while leaving the rot row unchanged
// v0.580: Admin/debug fix: restore seated pos updates via vehicle state and keep vehicle rot sampling resilient with fallback
// v0.579: Admin/debug follow-up: use vehicle transform for pos/rot debug while seated and fall back to soldier state on foot
// v0.578: Admin/debug follow-up: nudge the position/rotation numeric value columns right to clear negative-sign overlap with labels
// v0.577: Cleanup: remove dead reservation-era fields/functions after the DEPLOY-button pivot and keep only the live direct-spawn claim helpers
// v0.576: Admin/debug follow-up: center-left align pos/rot labels so they sit on the same vertical line as the numeric values
// v0.575: Admin/debug follow-up: compact the coordinate panel, split labels from values for aligned numeric columns, and color pos labels green with rot labels blue
// v0.574: Admin/debug follow-up: widen coordinate strip to labeled posX/posY/posZ and inferred rotX/rotY/rotZ fields with a two-row black backplate layout
// v0.573: Admin/debug follow-up: port Helis coordinate readout to Conquest with solid black plate, default it on, and switch startup defaults to 1v0 auto-start with 4v4 matchup
// v0.572: Phase 5F infrastructure: add bounded vehicle spawn volume schema, runtime accessors, and Firestorm placeholder map-config entries
// v0.571: Phase 5B UI follow-up: move spawn-timer minute digits right by one more unit
// v0.570: Phase 5B UI follow-up: nudge spawn-timer minute and second digits right while keeping the colon fixed
// v0.569: Phase 5B/5D UI follow-up: tune spawn-timer colon and minute-digit offsets, switch DEPLOY border to a thin outline, and use white base border with black selected border
// v0.568: Phase 5D UI follow-up: align DEPLOY button closer to join-prompt button construction by using a visible native UIButton face with built-in base/focus/pressed states and removing the custom fill stack from the interactive path
// v0.567: Phase 5D UI follow-up: add stable focus-driven DEPLOY button state so controller navigation can drive the same custom visuals and activation path as mouse hover
// v0.566: Phase 5D follow-up: verify configured Firestorm deploy anchors by resolving SpawnPoint objects, clearing UI input before forced deploy, and only accepting the spawn-point path if it actually enters deployed state
// v0.565: Phase 5D infrastructure: add per-team vehicle-deploy spawn point ids to map config and prefer SpawnPlayerFromSpawnPoint for direct vehicle deploys
// v0.562: Phase 5B active-row polish: keep vehicle plate width fixed and display IDLE in the reused owner panel
// v0.561: Phase 5B/5D UI fixes: restore visible vehicle plates, recenter spawn timer glyphs leftward, and hide pending-claim deploy HUD to stop pre-deploy button teleport
// v0.560: Phase 5B timer layout polish: center the colon and equalize MM:SS glyph spacing with explicit 1-unit gaps
// v0.559: Phase 5B UI hardening: stop per-second deploy button widget churn by caching row layout, button visibility, and button visual state
// v0.558: Phase 5B/5D UI/state fix: remove Deploy button blur flicker, right-align rows without empty button lanes, and display current pilot or Idle from live seat state
// v0.557: Phase 5B UI polish: lock Deploy button border to black and keep white text with black drop shadow across all states
// v0.556: Phase 5B UI polish: rename Spawn button to Deploy and use black text with white drop shadow across all button states
// v0.555: Phase 5B UI polish: reduce Spawn button state padding to 1 and use bright-over-dark gradient layering for gray, blue, and green button states
// v0.554: Phase 5B UI polish: convert Spawn button to explicit base/hover/pressed padding model with white border, blur, and gradient states
// v0.553: Phase 5B UI polish: retheme Spawn button states, tighten row spacing, narrow vehicle/status plates, and widen timer digit spacing
// v0.552: Phase 5B/5D UI polish: use script-owned Spawn button fill, clear stale hover state, and move active owner name into the old button lane
// v0.551: Phase 5B UI polish: enlarge Spawn button, tighten row spacing, reduce plate widths, and add explicit white hover state with black border/text
// v0.550: Phase 5B/5D follow-up: move Spawn button left of vehicle name, keep READY visible, and hide active rows while deployed
// v0.549: Phase 5B/5D pivot: replace chopper reservation checkboxes with READY-only direct Spawn buttons and team-wide live timer/status rows
// v0.548: Phase 5C follow-up: replace native checkbox hover visuals with a script-owned white overlay highlight
// v0.547: Phase 5C/5D follow-up: improve checkbox top-edge alignment after hover-fill and immediate auto-resubscribe changes
// v0.546: Phase 5C/5D follow-up: use button hover fill for checkbox highlight and show auto-resubscribe immediately on vehicle destruction
// v0.545: Phase 5C UI follow-up: align checkbox top border flush with the checkbox plate
// v0.544: Phase 5B/5C/5D follow-up: hover uses checkbox backplate highlight and successful spawn arms slot auto-resubscribe on destruction
// v0.543: Phase 5B/5C/5D follow-up: add READY/ACTIVE timer states, team-ready visibility, and cache checkbox border state to reduce 1-second pulse
// v0.542: Phase 5C/5D follow-up: stabilize checkbox hover highlight, persist reservations through spawn, and nudge checkbox top border alignment
// v0.541: Phase 5C follow-up: make vehicle reservation checkbox button visually transparent to stop native pulse
// v0.540: Phase 5C follow-up: remove focus-driven checkbox highlight pulse from vehicle reservation UI
// v0.539: Phase 5C/5D follow-up: suppress startup tracked chopper auto-spawn and make deployed admin timer view read-only
// v0.538: Phase 5D Stage 1: add reserved chopper direct-spawn fulfillment on deploy and suppress auto-spawn for reservation-managed slots
// v0.537: Phase 5C Stage 1 follow-up: persist checkbox highlight state across timer refresh to stop periodic border pulsing
// v0.536: Phase 5C Stage 1 follow-up: persist reservations into round start, reorder deploy rows, and add subscriber-only live timer view with stronger checkbox states
// v0.535: Phase 5C Stage 1: add authoritative vehicle slot reservation buttons, reservation state, and deploy-screen checkbox visuals
// v0.534: Phase 5B Stage 1 follow-up: re-right-align the Firestorm helicopter timer rows, shrink the vehicle box again, and rebalance the timer face around centered digits
// v0.533: Phase 5B Stage 1 follow-up: move the Firestorm helicopter timer rows closer to the right edge, tighten the row gaps, thin the vehicle name box, and shrink the timer face
// v0.532: Phase 5B Stage 1 follow-up: add placeholder player and vehicle boxes, checkbox scaffold, white text styling, and move the Firestorm helicopter timer stack above the minimap
// v0.531: Phase 5B Stage 1 follow-up: right-align Firestorm helicopter timer rows, build the stack upward, and pull the timer block above the minimap
// v0.530: Phase 5B Stage 1: add Firestorm helicopter deploy-screen timer HUD with admin deployed-visibility toggle and reusable timer instances
// v0.529: Phase 5A: add authoritative Firestorm helicopter slot state, availability phases, and matchup-driven enabled count tracking
// v0.528: Phase 4B VO tune: switch enemy capture terminal default from ObjectiveLost to ObjectiveCapturedEnemy after multiplayer validation
// v0.527: Phase 4B VO fix: use per-player VO handles and recent-objective terminal recipient grace to fix contested/lost multiplayer delivery
// v0.526: Phase 4B Stage 3: harden per-flag VO state machine so debounce re-arms only on true state changes and duplicate terminal edges are suppressed
// v0.525: Phase 4B Stage 2: add contested objective VO and enemy terminal variant toggle for ObjectiveLost vs ObjectiveCapturedEnemy
// v0.524: Phase 4B Stage 1: add toggleable objective VO exploration path with recipient-local capturing and terminal flag VO
// v0.523: Phase 5 Stage 1: add authoritative per-slot vehicle respawn timer state and wire existing spawn/respawn flows to that timer owner
// v0.522: Phase 4 Stage 7: decouple capture-sound dispatch from HUD-named gates using shared active-objective occupancy authority
// v0.521: Phase 4 Stage 6: clear per-player capture-sound throttle residue on undeploy and redeploy lifecycle
// v0.520: Phase 4 Stage 5: clear per-player capture-sound throttle residue during team swap lifecycle
// v0.519: Phase 4 Stage 4: clear per-player capture-sound throttle residue on leave and rejoin lifecycle
// v0.518: Phase 4 Stage 3: simplify capture-sound queue to one logical event with recipient-local variant and throttle dispatch
// v0.517: Phase 4 Stage 2: harden capture-sound queue coalescing and add explicit anti-spam diagnostics
// v0.516: Phase 4 Stage 1 follow-up: gate capture-sound recipients by active engaged objective so ticks only play while on the flag
// v0.515: Phase 4 Stage 1 follow-up: remove on-point gate and lower capture-sound producer threshold so capture ticks continue beyond first enter
// v0.514: Phase 4 Stage 1: add conquest capture-sound backbone with queued friendly/enemy tick SFX dispatch
// v0.513: Phase 3C Stage 3: remove dormant legacy combat runtime files and hard-cut active HUD routing to shell plus core only
// v0.512: Phase 3C Stage 2: reroute active combat HUD callers to the dedicated combat dispatcher
// v0.511: Phase 3C Stage 1: extract dedicated top-HUD shell cache and reroute non-combat callers
// v0.510: Tie the final-minute clock color pulse directly to the displayed second for a consistent red alert.
// v0.509: Move the clock plate up slightly and slow the final-minute color pulse to a one-second cadence.
// v0.508: Change the final-minute clock alert to a red-white color pulse and tighten the clock plate width.
// v0.507: Replace final-minute clock flicker with a per-second hide window and narrow the clock plate.
// v0.506: Use authoritative round-clock state for final-minute flash and thin the clock plate further.
// v0.505: Thin the clock plate and move the visible clock container slightly lower.
// v0.504: Increase team-name spacing, lighten team-name shadow rings, and harden final-minute clock flicker visibility.
// v0.503: Keep the clock root visible during final-minute flicker and restore the low-time clock color to team red.
// v0.502: Remove the top-center aux panel, move the clock surface onto its own widget, and fix team-name spacing and shadows.
// v0.501: Refine clock plate, clock shadow/flicker, and aligned ticket team-name shadows
// v0.500: Make clock dark red below 5 minutes and add lightweight final-minute flicker
// v0.499: Align top-left status dock gap with branding left margin
// v0.498: Add player-perspective team names to ticket HUD flanks
// v0.497: Move core engage right counter left by 1 unit
// v0.496: Make the clock plate an explicit owned widget and shrink its final geometry
// v0.495: Tighten clock plate, remove top-row exit flicker, and clear engage state for dead players
// v0.494: Restore root-only branding depth and tighten clock plate geometry
// v0.493: Show popout percent immediately, speed live subtick loop, and lift top-left branding depth
// v0.492: Make flag enter-exit HUD cuts atomic and tighten top HUD containers
// v0.491: Core HUD intermittent mid-round disappear fix: make validation advisory and remove global hide-on-transient core fail-safe
// v0.490: Ready-dialog first-open regression fix: restore deferred warm-cache prebuild on join/deploy to eliminate trickle while keeping startup responsive
// v0.489: Startup latency follow-up: align core legacy suppression comments with one-shot contract
// v0.488: Core HUD startup latency pass: throttle deep validation, make core suppression one-shot only, and make ready-dialog first build reveal atomic
// v0.487: Rollback risky auto dialog warm-cache and reduce core-mode startup/swap destructive HUD purges to cut input/HUD latency
// v0.486: Core HUD perf fix: run legacy suppression one-shot instead of every 0.25s tick; remove extra pre-live HUD tick
// v0.485: Move Ready-dialog warm-cache to join/deploy and keep core HUD refresh active pre-live to remove first-load/team-switch UI latency
// v0.484: Remove lower-left settings summary widget; clear redeploy-delay carryover to reduce startup/team-swap HUD readiness lag
// v0.483: Immediate status-dock refresh on min-player config change and reduce status box width by ~30%
// v0.482: Status line2: show optional '(Z in Server)' when active players exceed configured min total; keep X/Y based on ready/min
// v0.481: Status ready progress now mirrors actual start gate (min-total vs all-active requirement, including team-0 fallback)
// v0.480: Status dock: use configured min-player total for ready denominator and align status text style to upper-left green (keep X/Y yellow)
// v0.479: Status dock phase map: pre-live line1 ready/not-ready + line2 ready count; live/game-over line1 players+mode with line2 LIVE/GAME OVER
// v0.478: Status box live layout: line1 shows players+mode and line2 shows LIVE; keep non-live ready/not-ready flow
// v0.477: Status lane: show 'You are Ready' whenever player is ready pre-live (do not gate on dialog visibility)
// v0.476: Hard-cut status text placement to isolated absolute dock widgets and keep runtime updates label/visibility-only
// v0.475: Fix Portal strict typing: guard status-lane subtree FindUIWidgetWithName calls against undefined root
// v0.474: Restore static top-left status panel lines (LIVE/GAME OVER/NOT READY + ready line) with label-only runtime updates
// v0.473: Docs: update top-left status-lane builder comment to match isolated static test-lane behavior
// v0.472: Hard-cut top-left status lane to isolated static box/text widgets with runtime status writers disabled
// v0.471: Fix status-lane static child placement by removing runtime text transform overrides
// v0.470: Forced static status-lane parent chain normalization (UIRoot->status root->status texts) with fixed build-time anchors and positions
// v0.469: Added explicit status-box proof string and forced centered static status label for ownership verification
// v0.468: Removed all global status-lane fallback lookups; status labels now resolve from static cache-owned lane refs only
// v0.467: Removed remaining runtime legacy status touchpoints; status text updates now target static TwlConquestHudStatusLane widgets only
// v0.466: Moved status-root resolver ownership into hud/status for static status lane and removed clock-module dependency
// v0.465: Rebuilt top-left status lane as static-only TwlConquestHudStatusLane widgets and removed clock status-lane attachment path
// v0.464: Forced static parent ownership and fixed anchor/position normalization for top-left status text widgets at build time
// v0.463: Added status-lane probe offsets: container plus 20 X and status text plus 20 X for ownership validation
// v0.462: Hard-isolated status lane again with fresh TwlConquestHudStatus names and forced hiding of prior status text variants
// v0.461: Locked top-left status text resolution to status container subtree and removed global fallback lookups
// v0.460: Made top-left status lane static-only by removing runtime status text reparent helper path
// v0.459: Hard-cut status lane names to TwlConquestStatus widgets and purge legacy status name collisions
// v0.458: Harden join/leave cleanup for all status text widgets to enforce single static top-left status ownership
// v0.457: Enforce single static top-left status text pair and remove legacy ReadyStatus widget path
// v0.456: Stabilize startup by retiring legacy clock status text creation and keep top-left status ownership static
// v0.455: Static top-left status text parenting/centering, retire legacy status text path, and snap core text-shadow geometry
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
