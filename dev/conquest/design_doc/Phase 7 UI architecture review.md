# Phase 7 UI Architecture Review

Date: 2026-03-29  
Scope: current UI/menu architecture in `bf6-portal/dev/conquest`

## Purpose

This review documents how the current primary UI families are cached, first built, revealed, refreshed, and cleaned up. It also captures where first-open cost still exists, how behavior differs across join/deploy/team-swap/disconnect, and which optimizations should happen next.

Primary references:

- [AGENTS.md](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/AGENTS.md)
- [design_doc/TWL_Conquest_Design.md](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/design_doc/TWL_Conquest_Design.md)

## Executive Summary

The current UI stack is more structured than the menu list suggests:

1. The "Spawn/Deploy Screen Vehicle Menu", "Passive Screen Vehicle Display", and "Live Deploy Vehicle Menu" are one per-player cached vehicle HUD family with different visibility owners/modes.
2. The "Ready up Dialog via Triple Tap" and "Ready up Dialog via static world interactible" are one per-player cached ready-dialog shell with two different triggers.
3. Most UI caches are per-player. Team/shared behavior mainly lives in gameplay state, not in UI widget caches.
4. The critical HUD path is already hidden-built before reveal. The biggest remaining first-use/cold-open risks are:
   - gadget locker on-demand fallback
   - admin panel body lazy build
   - global hidden ready-dialog invalidation on join/leave
5. The main ongoing hot UI work is still the combat HUD scheduler and the gadget locker refresh while open. The gadget locker is no longer every player tick, but it remains the most expensive interactive menu family.

## Latest Playtest Findings

Latest multiplayer playtest using the lightweight `UI CACHE` panel showed:

- `Vehicle` commonly at `Built/Rebuilt 1/1`, `Cold/Invalid 0/1`
- `Ready` commonly at `Built/Rebuilt 2-3/0`, `Cold/Invalid 0/2`
- `Gadget` commonly at `Built/Rebuilt 1/0`, `Cold/Invalid 0/0`

Interpretation:

- The gadget locker is no longer the main lifecycle churn source.
- The largest remaining first-use churn is concentrated in the vehicle HUD family and ready dialog.
- More importantly, players can still reach visible gameplay/menu states while critical UI families are still warming.
- The next architecture step therefore needs to be an explicit loading/warm gate, not just smaller lifecycle tweaks.

Latest loading-gate playtest read after the first implementation passes:

- loading overlay timing is materially better on first join
- the overlay can now persist until menus feel closer to hot
- but players are still able to deploy or move before the script actually intends to release them
- team-swap loading still does not yet match first-join behavior cleanly

Interpretation:

- the current remaining blocker is no longer primarily menu-cache churn
- the current blocker is that the first-join deploy/movement gate is still not authoritative in practice
- the next optimization step is therefore a narrow deploy/spawn gate audit, not another broad UI lifecycle rewrite
- latest confirmed read after `v0.989`:
  - first join is still reaching `DEPLOY_ACCEPT`
  - the gate is already marked released when that happens
  - this proves the remaining problem is early join release ownership, not API incapability
- latest confirmed read after `v0.993`:
  - undeploy during first join could still launch a generic `refresh` warm
  - that generic path could preempt the join-owned loading session
  - therefore first join needs a dedicated deploy-lock latch independent of generic warm flags

## Verified Facts

- The top HUD shell is cached per player in `State.hudCache.topHudShellByPid` and ensured by [src/ui/conquest/top-hud-shell.ts:96](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/ui/conquest/top-hud-shell.ts:96).
- The combat HUD is cached per player, scheduler-driven, and updated at `0.12s` intervals via [src/ui/conquest/hud-core/pipeline.ts:85](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/ui/conquest/hud-core/pipeline.ts:85) and [src/ui/conquest/hud-core/constants.ts:3](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/ui/conquest/hud-core/constants.ts:3).
- The vehicle deploy/passive/live HUD is a single cached family per player in `State.hudCache.vehicleDeployTimerCache`, built by [src/vehicles/deploy-timer-ui.ts:1093](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/vehicles/deploy-timer-ui.ts:1093), hidden-prebuilt by [src/vehicles/deploy-timer-ui.ts:1789](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/vehicles/deploy-timer-ui.ts:1789), and revealed by [src/vehicles/deploy-timer-ui.ts:1805](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/vehicles/deploy-timer-ui.ts:1805).
- The ready dialog is cached per player through `readyDialogData.uiBuilt/uiLayoutVersion`, hidden-built by [src/ready-dialog/dialog-build.ts:76](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/ready-dialog/dialog-build.ts:76), and shown by [src/ready-dialog/dialog-build.ts:88](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/ready-dialog/dialog-build.ts:88).
- The gadget locker is cached per player in `State.hudCache.ammoResupplyMenuCache`, built hidden by [src/interaction/ammo-resupply-menu.ts:887](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/interaction/ammo-resupply-menu.ts:887), prebuilt by [src/interaction/ammo-resupply-menu.ts:1697](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/interaction/ammo-resupply-menu.ts:1697), and opened by [src/interaction/ammo-resupply-menu.ts:1677](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/interaction/ammo-resupply-menu.ts:1677).
- The admin panel toggle is ensured as part of the ready dialog shell, but the full admin panel body is still lazy-built on first toggle in [src/admin-panel/visibility.ts:119](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/admin-panel/visibility.ts:119).
- Verified BF6 loading-gate API surface:
  - per-player:
    - `EnablePlayerDeploy(player, deployAllowed)`
    - `SetRedeployTime(player, redeployTime)`
    - `EnableAllInputRestrictions(player, restricted)`
  - global:
    - `SetSpawnMode(spawnModes)`
- Current Conquest `src` does not call `SetSpawnMode(...)` / `AutoSpawn`, so the remaining first-join deploy leak is not currently explained by a global auto-spawn setting.
- New-player join, disconnect, and team-swap all explicitly reset or invalidate pieces of the UI stack:
  - join: [src/index/player-join-leave.ts:142](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/index/player-join-leave.ts:142)
  - leave: [src/index/player-join-leave.ts:177](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/index/player-join-leave.ts:177)
  - team swap: [src/interaction/actions.ts:564](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/interaction/actions.ts:564) and [src/interaction/actions.ts:379](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/interaction/actions.ts:379)

## UI Family Inventory

| Surface | Owner / Builder | Cache | First Client Build | Prebuilt Before Use? | Reveal / Hide Model | Scope |
|---|---|---|---|---|---|---|
| HUD shell | [src/ui/conquest/top-hud-shell.ts:96](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/ui/conquest/top-hud-shell.ts:96) | `State.hudCache.topHudShellByPid[pid]` | during critical HUD warm | Yes | mostly persistent shell widgets toggled visible/invisible | per player |
| Combat HUD | [src/ui/conquest/hud-core/pipeline.ts:38](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/ui/conquest/hud-core/pipeline.ts:38) | combat HUD runtime entry + shell | during critical HUD warm | Yes | hidden render first, then root-only reveal | per player |
| Vehicle HUD family | [src/vehicles/deploy-timer-ui.ts:1093](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/vehicles/deploy-timer-ui.ts:1093) | `State.hudCache.vehicleDeployTimerCache[pid]` | during critical warm or later hidden prebuild | Yes for normal flow | hidden prebuild, reveal/update preserves visibility owner | per player |
| Spawn/Deploy Screen Vehicle Menu | same family as vehicle HUD | same cache | same | same | passive/deploy owner state | per player view of team/global vehicle slots |
| Passive Screen Vehicle Display | same family as vehicle HUD | same cache | same | same | passive mode on same shell | per player view of team/global vehicle slots |
| Live Deploy Vehicle Menu | [src/vehicles/deploy-live-menu.ts:57](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/vehicles/deploy-live-menu.ts:57) | uses vehicle HUD cache + `liveVehicleDeployMenuVisibleByPid` | no separate shell | Yes if vehicle HUD cache already exists | same shell, different mode owner and close chrome | per player |
| Ready up Dialog | [src/ready-dialog/dialog-build.ts:76](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/ready-dialog/dialog-build.ts:76) | `readyDialogData.uiBuilt/uiLayoutVersion` | hidden build | Yes | hidden-build then reveal; close hides, not destroy | per player |
| Ready up via Triple Tap | [src/index/player-loop-inputs.ts:7](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/index/player-loop-inputs.ts:7) -> [src/interaction/interact-point.ts:6](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/interaction/interact-point.ts:6) | same ready dialog cache | warms before spawning interact point | Usually yes | same shared ready-dialog show path | per player |
| Ready up via static world interactible | [src/interaction/world-interactables.ts:305](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/interaction/world-interactables.ts:305) | same ready dialog cache | no separate shell | Usually yes | same shared ready-dialog show path | per player |
| Gadget Menu | [src/interaction/ammo-resupply-menu.ts:887](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/interaction/ammo-resupply-menu.ts:887) | `State.hudCache.ammoResupplyMenuCache[pid]` | hidden build | Not guaranteed; still has on-demand fallback | cached root show/hide | per player UI, mixed per-player and per-team data |
| Admin Panel Menu | [src/admin-panel/visibility.ts:119](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/admin-panel/visibility.ts:119) | toggle cached with ready dialog; body lazy | first toggle open | No, body is lazy | build on open, destroy on close | per player |

## What Is Cached, And How

### 1. Top HUD shell

- Cache: `State.hudCache.topHudShellByPid[pid]`
- Owner: [src/ui/conquest/top-hud-shell.ts:96](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/ui/conquest/top-hud-shell.ts:96)
- Method:
  - ensure shell root and child refs
  - rebind refs by widget name if handles drift
  - rebuild only when critical refs are incomplete
- This is a true per-player persistent shell.

### 2. Combat HUD

- Cache: combat HUD runtime entry, not stored in `hudCache` but maintained by the combat HUD runtime/pipeline
- Owner: [src/ui/conquest/hud-core/pipeline.ts:38](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/ui/conquest/hud-core/pipeline.ts:38)
- Method:
  - ensure player graph
  - hidden render first
  - reveal root only when warm and reveal-allowed
  - scheduler refresh every `0.12s`
- This is already architected as a warmed, revealed shell rather than a rebuild-per-open dialog.

### 3. Vehicle HUD family

- Cache: `State.hudCache.vehicleDeployTimerCache[pid]`
- Owner: [src/vehicles/deploy-timer-ui.ts:1093](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/vehicles/deploy-timer-ui.ts:1093)
- Method:
  - shell and rows created once
  - hidden prebuild parks the root offscreen and invisible
  - reveal path and passive refresh path share the same cache
  - render signatures skip unchanged updates
- This one shell serves:
  - undeployed passive display
  - deploy screen vehicle rows
  - live deploy terminal mode

### 4. Ready dialog

- Cache: `State.players.readyDialogData[pid]`
- Owner: [src/ready-dialog/dialog-build.ts:76](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/ready-dialog/dialog-build.ts:76) and [src/ready-dialog/lifecycle.ts:91](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/ready-dialog/lifecycle.ts:91)
- Method:
  - hidden shell built once for current layout version
  - open path is intended to be a pure reveal
  - hidden caches are invalidated when roster/map state changes underneath them
- Important detail:
  - join/leave invalidates hidden ready-dialog caches for all players, not just the affected player.

### 5. Gadget locker

- Cache: `State.hudCache.ammoResupplyMenuCache[pid]`
- Runtime state:
  - per-player open/object selection: `players.armO`, `players.armI`
  - per-player global launcher/choose-one state: `players.armG`, `players.armL`
  - per-player per-locker state: `players.armS[pid][objId]`
  - per-team shared smoke/assault state: `round.smk`, `round.asg`
- Owner: [src/interaction/ammo-resupply-menu.ts:887](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/interaction/ammo-resupply-menu.ts:887)
- Method:
  - schema-based cache record
  - hidden build available
  - root show/hide
  - refresh throttled to once per second while open, with forced refresh on interaction/state change
  - diff caching on many row/tile render paths
- Important detail:
  - it is cached, but not guaranteed warm. `openArmMenu(...)` still falls back to building on demand.

### 6. Admin panel

- Cache:
  - toggle widgets are ensured with ready dialog shell
  - full admin container/body is not persisted
- Owner: [src/admin-panel/visibility.ts:47](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/admin-panel/visibility.ts:47) and [src/admin-panel/visibility.ts:119](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/admin-panel/visibility.ts:119)
- Method:
  - toggle button exists with ready dialog shell
  - open builds admin body
  - close deletes admin body but keeps toggle path
- This is intentionally lazy today.

## When Menus Are First Built Client Side

### Critical warm path

`warmCriticalHudForPlayer(...)` is the main first-build owner for the always-needed UI:

- top HUD shell
- vehicle HUD shell
- combat HUD

References:

- [src/interaction/actions.ts:467](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/interaction/actions.ts:467)
- [src/interaction/actions.ts:185](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/interaction/actions.ts:185)

### Deferred warm path after reveal

After critical HUD reveal, deferred prebuild is staggered:

1. vehicle HUD if still cold
2. gadget locker
3. ready dialog

Reference:

- [src/interaction/actions.ts:442](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/interaction/actions.ts:442)

### Ready dialog triple tap path

The triple-tap path warms the hidden ready-dialog cache before spawning the interact point:

- [src/interaction/interact-point.ts:29](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/interaction/interact-point.ts:29)

### Gadget locker

The gadget locker may be prebuilt by deferred warm, but it can still be built on the actual open action:

- [src/interaction/ammo-resupply-menu.ts:1677](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/interaction/ammo-resupply-menu.ts:1677)

### Admin panel

The admin panel body is still first-built on first toggle open:

- [src/admin-panel/visibility.ts:119](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/admin-panel/visibility.ts:119)

## Are Menus Prebuilt Then Just Toggled Visible?

### Yes

- top HUD shell
- combat HUD shell/root
- vehicle HUD family
- ready dialog shell

These families are intended to be hidden-built first and then revealed/hidden without recreating the tree.

### Partially

- gadget locker

It supports hidden prebuild and cached show/hide, but the open path still contains an on-demand build fallback if the cache is missing or invalid.

### No

- admin panel body

The toggle path is cached, but the panel body is still lazy-built on open and deleted on close.

## Order of Operations

### New player joining mid-match

1. initialize ready-dialog/player runtime
2. invalidate hidden ready-dialog caches for all players
3. wait `0.1`
4. hard-reset the joining player UI state
5. run critical HUD warm
6. build ready dialog hidden for the joining player

References:

- [src/index/player-join-leave.ts:142](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/index/player-join-leave.ts:142)
- [src/index/player-join-leave.ts:169](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/index/player-join-leave.ts:169)

### Player deploy

1. require HUD warm to be ready or force undeploy
2. reveal critical HUD
3. start deferred hidden prebuild after reveal
4. spawn ready-dialog interact point

References:

- [src/index/player-deploy.ts:11](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/index/player-deploy.ts:11)
- [src/index/player-deploy.ts:51](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/index/player-deploy.ts:51)
- [src/index/player-deploy.ts:54](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/index/player-deploy.ts:54)

### Ready dialog open

Both triggers converge to the same call:

- [src/interaction/interact-point.ts:50](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/interaction/interact-point.ts:50)

That call:

1. closes conflicting menus
2. enables UI input
3. reveals the already-built hidden ready dialog if available

### Live deploy menu open

1. closes conflicting menus
2. marks live menu visible
3. invalidates viewer render cache
4. reveals the cached vehicle HUD family in live-terminal mode

Reference:

- [src/vehicles/deploy-live-menu.ts:57](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/vehicles/deploy-live-menu.ts:57)

### Gadget locker open

1. closes ready dialog/live deploy if needed
2. builds hidden cache if missing
3. refreshes while hidden
4. reveals cached root

Reference:

- [src/interaction/ammo-resupply-menu.ts:1677](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/interaction/ammo-resupply-menu.ts:1677)

### Team switch

1. close ready dialog
2. close gadget locker
3. reset player gadget timers
4. hide critical HUD and vehicle surface
5. switch team
6. run team-swap HUD warm controller
7. invalidate and rebuild hidden ready dialog cache for the switching player

References:

- [src/interaction/actions.ts:564](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/interaction/actions.ts:564)
- [src/interaction/actions.ts:379](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/interaction/actions.ts:379)

### Disconnect

1. mark disconnected
2. close live deploy and gadget menu state
3. remove interact point
4. hard-delete HUD caches
5. destroy ready dialog
6. delete per-player runtime records
7. invalidate hidden ready-dialog caches for all players
8. refresh vehicle HUD for all players

Reference:

- [src/index/player-join-leave.ts:177](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/index/player-join-leave.ts:177)

## Per Player vs Per Team

### Per-player

- all UI widget caches in `State.hudCache`
- ready dialog shell/admin visibility
- combat HUD
- live deploy menu visibility ownership
- gadget locker UI cache and open state
- gadget locker local/class-group selection state
- ready interact point

References:

- [src/state/hud-cache-types.ts:1](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/state/hud-cache-types.ts:1)
- [src/state/runtime-types.ts:368](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/state/runtime-types.ts:368)

### Per-team or globally shared gameplay state that drives UI

- conquest round/team state
- vehicle spawner slots
- gadget locker smoke/artillery shared cooldown state

References:

- [src/state/runtime-types.ts:335](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/state/runtime-types.ts:335)
- [src/state/runtime-types.ts:350](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/state/runtime-types.ts:350)
- [src/state/runtime-types.ts:410](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/state/runtime-types.ts:410)

Important distinction:

- The UI shells themselves are not shared across players.
- Shared/team behavior is data-driven and then rendered into each player's own cached shell.

## Key Findings

### 1. There are only a few true UI families

The menu list reads as nine surfaces, but the architecture is closer to five families:

1. top HUD shell
2. combat HUD
3. vehicle HUD family
4. ready dialog family
5. gadget locker family
6. admin panel body as a lazy sub-surface of ready dialog

That matters because optimization should target family ownership and warm paths, not every visible surface separately.

### 2. First-open spikes are most likely cold-build collisions, not steady-state menu refresh

The clearest remaining cold-build sources are:

- gadget locker on-demand fallback
- admin panel first-toggle body build
- hidden ready-dialog invalidation for all players on join/leave

This matches the observed "another player opens something for the first time and everyone feels it" pattern.

### 3. Ready-dialog global invalidation is a likely cross-player culprit

Both join and leave currently call:

- [src/index/player-join-leave.ts:164](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/index/player-join-leave.ts:164)
- [src/index/player-join-leave.ts:209](/c:/Users/Soldat/TypeScriptProjects/twlmain/bf6-portal/dev/conquest/src/index/player-join-leave.ts:209)

That means one player entering/leaving can make other players pay a fresh hidden rebuild later.

### 4. The gadget locker is the least mature lifecycle contract

It is much better than before, but it still differs from the ready dialog and vehicle HUD in one important way:

- it is cached
- it is prebuild-capable
- but it is not yet guaranteed warm before first use

That keeps a cold-open path alive.

### 5. Admin panel is intentionally lazy, but that is now a clear tradeoff

This is probably acceptable because usage frequency is low, but it should be treated as an explicit choice:

- keep it lazy and accept first-toggle cost
- or prebuild the body hidden if admin responsiveness matters more than warm-time cost

### 6. UI performance risk is more about widget writes than timer math

The timer values themselves are cheap. The expensive parts are:

- hidden tree creation
- full refresh passes on open surfaces
- global invalidations that force later rebuilds

### 7. The project now needs a formal loading-gate contract

The latest playtest reframes the problem:

- the issue is not only that some menus are cold
- the issue is that players can interact, deploy, and observe partial UI creation while the system is still warming

That means the architecture now needs an explicit contract for:

- when a player is still in loading/warm state
- what actions are blocked during that state
- what conditions release the player into normal interaction
- how the system fails open safely if a warm step misbehaves

## Recommendations

### Top recommendations

1. Add a formal loading/warm gate that blocks deploy and production interaction until critical UI families are ready, with a deterministic fail-safe release path.
2. Stop invalidating hidden ready-dialog caches for all players on ordinary join/leave unless the shared data truly changed for everyone.
3. Remove visible first-use churn from the vehicle HUD family and ready dialog before resuming broader feature work.

## Locked Decisions

These decisions were explicitly confirmed after review and should be treated as the current architecture direction.

### 1. Gadget locker prebuild policy

- The gadget locker should be hidden-built before first interact.
- It should warm late in the deferred order, second to last.
- The admin panel remains last.
- A fallback open-time build path can remain for safety, but it should be treated as an exception path and signal that prebuild coverage failed.

### 2. Admin panel policy

- The admin panel body is lowest prebuild priority.
- It should prebuild when possible, but it is acceptable for worst-case timing to remain lazy.
- This keeps low-frequency admin cost from competing with higher-priority gameplay UI surfaces.

### 3. Ready-dialog invalidation policy

- Do not globally destroy hidden ready-dialog shells on ordinary join/leave.
- Preserve hidden shells whenever possible.
- Invalidate only affected ready-dialog content sections/signatures unless a true shared layout rebuild is required.
- Functionality takes priority over performance; if correctness requires broader invalidation, correctness wins.

### 4. First-open hitch reduction priority order

1. Deploy vehicle menu
2. Ready dialog
3. Live deploy menu

### 5. Instrumentation policy

- Add lightweight UI lifecycle instrumentation.
- It must be stable and not introduce unknown-string issues.
- It should be visible to all players at game start during tuning.
- Add an admin-panel control to disable the instrumentation display.
- This instrumentation can also seed a future KPI/debug surface.

### 6. Vehicle HUD family policy

- Keep the shared-family architecture for passive vehicle display, deploy screen vehicle menu, and live deploy menu.
- Rework internals for correctness/performance if needed, but do not split the family unless performance or correctness clearly forces it.

### 7. Prebuild goal

- All primary menus except the admin panel should exist client-side before first deliberate player interaction.

### 8. Loading-gate policy

- The game should be allowed to hold the player in a lightweight loading state while critical UI families warm.
- During that state, the player should not be able to:
  - deploy
  - trigger production menu interactions
  - bypass the warm process with alternate interact paths
- The loading gate must be fail-safe:
  - no permanent lockout
  - no indefinite loading if one warm path fails
  - deterministic release behavior for first join, late join, and live-match join
- Implementation direction:
  - extend the current deploy-block / HUD-warm controller rather than building a second parallel loading system
  - define readiness as script-authoritative:
    - global bootstrap ready
    - per-player critical UI families warm and cache-usable
  - release criteria should cover:
    - top HUD shell
    - combat HUD
    - vehicle HUD family
    - ready dialog hidden shell
    - gadget locker hidden shell
  - cache-usable is necessary but not sufficient:
    - the loading gate must not release purely because hidden caches exist
    - it must also wait for the player-visible reveal path and hot-open priming to complete
  - admin panel body remains outside the release criteria because it is lowest-priority and may stay lazy
  - all production menu entry points should consult the same loading-state contract:
    - ready dialog
    - gadget locker
    - live deploy menu
    - world-interactable menu paths
    - triple-tap `E`
  - one idempotent release function must own both the success path and the timeout/fallback path
  - success criteria should be explicit readiness flags and cache-usable checks, not a blind fixed wait
  - deploy lock should remain the primary gate; any post-deploy input restriction should be secondary polish only
  - use a lightweight persistent loading overlay rather than transient notification messages so the player sees one stable state instead of trickling menu construction

### 9. Testing requirement

- If UI lifecycle or invalidation is reworked, testing must be robust and explicit.
- A major rearchitecture without a strong verification pass is not acceptable.

### Detailed plan

#### Priority 1: finish normalizing lifecycle contracts

Make every primary UI family follow one of two explicit models:

- persistent hidden-built shell, reveal/hide only
- intentional lazy body with documented low-frequency usage

Target state:

- top HUD shell: keep as is
- combat HUD: keep as is
- vehicle HUD family: keep as is
- ready dialog: keep as is, but narrow invalidation scope
- gadget locker: remove cold-open fallback as the normal path
- admin panel: decide explicitly whether it stays lazy

Before any of that ships, add a formal loading/warm gate so players cannot enter production interaction states while the critical families are still building.

#### Priority 2: narrow invalidation blast radius

Review every "invalidate for all players" path and ask:

- is the underlying shared data actually stale for all players?
- or can this be limited to the affected pid/team/viewers?

Immediate candidate:

- hidden ready-dialog invalidation on join/leave

#### Priority 3: add build/rebuild instrumentation

Track, per player and UI family:

- first build count
- hidden rebuild count
- reveal count
- forced invalidation reason

Display direction:

- lightweight summary visible to all players at match start while tuning
- admin-panel control to disable it

Without that, cold-open spike work stays guess-driven.

#### Priority 4: make the loading gate phase-aware and fail-safe

The loading contract must behave correctly for:

- first join pre-live
- first join while live
- late join while live
- team swap / redeploy warm transitions

It must also have a release safety policy:

- release when the required families are confirmed ready
- or release on a deterministic timeout/fallback path that still leaves the player playable

Mechanically, this should be implemented by extending the current deploy-block / HUD-warm controller, not by creating a second unrelated loading subsystem. The current Conquest code already blocks deploy for a critical HUD warm window, but that contract is still too narrow because deferred menu warm continues after reveal. The next implementation should therefore reuse the existing warm token and deploy-availability ownership, expand the required family set, and make menu-entry blocking share the same loading-state truth.

### Loading-gate hardening notes

The first implementation proved the deployment/menu block, but it still keyed release too early:

- hidden cache usable
- gate released
- visible reveal work continued afterward

That sequence is not good enough for player experience. The stronger contract must be:

1. loading session started
2. loading overlay shown for that session
3. hidden critical HUD families built
4. hidden production-menu families built
5. player-visible reveal completed
6. deploy released
7. post-deploy finalize completed
8. hot-open paths fully usable

The architecture therefore needs explicit per-player flags beyond simple `active/released` booleans:

- loading session id / reason
- overlay shown for current session
- critical reveal complete
- production menus warm
- post-deploy finalize active
- ready-dialog hot-open ready
- gadget-menu hot-open ready
- released

This is especially important for:

- team swap
- late join while live
- first deliberate use of the static HQ ready dialog

Those paths have shown that "cache exists" and "feels hot to the player" are not the same thing.

The practical implication is a two-stage loading gate:

- Stage A: pre-deploy hold
  - player stays on deploy
  - critical hidden warm completes
  - visible critical reveal settles
  - deploy is released
- Stage B: post-deploy finalize
  - loading overlay may persist/reappear briefly in-world
  - player movement/fire/look input is restricted
  - deployed-only UI/runtime pieces settle
  - first deliberate production interactions are then unblocked

### Current unresolved loading-gate gap

The current first implementation improved the timing of the loading overlay and menu warmth, but the latest playtests show a more specific failure:

- first-join deploy is still not being held authoritatively
- players can still deploy and move while the script considers the loading gate active
- this means the next debugging pass must focus on deploy/spawn timing, not just UI readiness flags

Current best read:

- the problem is not currently explained by `SetSpawnMode(AutoSpawn)`, because Conquest is not using it in `src`
- the likely remaining causes are:
  - deploy being re-enabled earlier than intended
  - `OnPlayerDeployed` arriving before the loading gate expects
  - the undeploy/input-restriction fallback losing a race after the player already enters world state

So the immediate next task is a first-join deploy-release audit:

1. record every place `EnablePlayerDeploy(..., true)` can be reached for that player
2. confirm whether `OnPlayerDeployed` fires while the loading gate still says unreleased
3. confirm whether the current undeploy fallback is actually winning that race
4. only after that, bring team-swap loading behavior up to the same standard

### Anti-Drift Implementation Contract

The next pass should follow this narrower contract exactly.

#### Scope order

1. first-join deploy authority
2. first-join ready-dialog first-open heat
3. team-swap parity

Do not broaden scope out of that order.

#### Reduced first-join state machine

The first-join loading path should be reduced to four clearly owned functions:

1. `beginJoinLoadingGate(...)`
   - start loading session
   - show loading overlay
   - disable deploy

2. `holdPlayerAtDeploy(...)`
   - maintain deploy-disabled state until readiness or timeout
   - no menu logic in this function

3. `handlePlayerDeployedBeforeRelease(...)`
   - if the player still reaches world state early:
     - apply full input restriction
     - attempt undeploy immediately
     - keep the loading overlay visible

4. `releaseJoinLoadingGate(...)`
   - clear loading overlay
   - clear temporary restrictions
   - enable deploy
   - mark the session released

This is the smallest version of the design that still matches the intended contract.

Current corrective rule:

- first join should remain pre-deploy-first by default
- if the real first Ready-open cost still only exists after spawn, hand off into one short join-owned post-deploy finalize under full input restriction
- generic warm/reveal helpers may not own join deploy release
- only `releaseJoinLoadingGate(...)` may authorize first-join deploy
- first join must own a dedicated deploy-lock latch from `beginJoinLoadingGate(...)` until `releaseJoinLoadingGate(...)`
- no non-join path may clear that latch

#### Required instrumentation

Before another behavioral change is attempted, instrument these observable points:

- `OnPlayerJoinGame`
- deploy enable/disable ownership
- `OnPlayerDeployed`
- `OnPlayerUndeploy`
- input restriction on/off
- forced undeploy attempts

For each event, record:

- player id
- loading session id / reason
- current gate active / released state
- current deploy enabled state
- current overlay shown state
- current input restriction state
- timestamp or elapsed match time

#### Proof standard

The first-join contract is only considered proven when the trace shows:

1. deploy stays disabled until intended release, or
2. if deployment still occurs, the player is immediately frozen and recaptured, and
3. no alternate path re-enables deploy before the release function owns that decision
4. `DEPLOY_ACCEPT` does not occur before `releaseJoinLoadingGate(...)` owns the final release decision
5. if the loading screen is still visible, deploy is still blocked

#### Team-swap rollback note

The staged team-swap loading-session attempt that ran from `v1.005` through `v1.008` should be treated as failed architecture, not as a base to extend.

What failed:

- the same helper owned both:
  - overlay visibility
  - deploy blocking
- repeated team-swap reassert paths called that helper from:
  - undeploy handling
  - wait-for-undeploy loops
  - wait-for-team-settle loops
  - ongoing recapture/authority maintenance
- this created a system where the overlay could:
  - flicker multiple times
  - disappear and come back
  - or be suppressed entirely depending on when the "already shown" flag was consumed

Current redesign constraint:

- a loading session must have:
  - one authoritative overlay show owner
  - one authoritative overlay hide owner
  - separate helpers for:
    - overlay visibility
    - deploy authority
    - recapture / undeploy fallback
- team swap should be redesigned from the earlier baseline, not by continuing the reverted staged-release branch

#### Newcomer startup path

For a new engineer resuming this work, the fastest useful read order is:

1. `design_doc/conquest_issues.md`
   - current baseline
   - rolled-back branches
   - guardrails
2. `src/interaction/actions.ts`
   - loading-session ownership
3. `src/interaction/hud-warm-state.ts`
   - state model / traces
4. `src/index/player-deploy.ts`
   - deploy acceptance / recapture / finalize
5. `src/ready-dialog/dialog-build.ts`
   - Ready warm path
6. `src/interaction/world-interactables.ts`
   - static HQ Ready entry

Do not start by changing team swap again.

The fastest safe resumption order is:

1. prove first-join deploy authority
2. prove static HQ Ready first-open latency ownership
3. redesign team swap from the older baseline

#### Proven checkpoints

Do not re-run these proofs unless the underlying contract is changed intentionally:

- `v0.982`: hard audit lock proved deploy can be blocked indefinitely
- `v0.998`: fixed-delay proof proved deploy can later be released on demand
- `v0.999+`: conservative first-join time floor improved safety but did not prove readiness correctness
- `v1.003`: visible post-deploy loading / visible Ready prime caused unacceptable regressions
- `v1.005-v1.007`: staged team-swap loading-session branch failed and was rolled back

Interpretation:

- the missing piece is not BF6 API capability
- the missing piece is authoritative release ownership plus a trustworthy readiness definition

#### Readability requirement

The first-join loading path should remain readable in one pass.

- keep function names aligned to end-goal behavior
- add concise header comments above newly added or substantially rewritten functions
- do not hide deploy authority behind unrelated menu-warm helpers

#### Priority 5: keep hot refreshes event-driven or second-gated

Current state is mostly good:

- combat HUD: scheduler with explicit cadence
- ready dialog: event-driven
- vehicle HUD: event-driven/update-driven with render signatures
- gadget locker: once-per-second while open

Next step is to keep reducing unnecessary writes, not add more loops.

## Assumptions And Gaps

- No material API assumptions were needed for this review.
- This document is based on current code paths and cache ownership, not live profiling traces.
- The exact runtime cost of each family still needs instrumentation if you want hard build-time numbers instead of architectural inference.

## Immediate Optimization Sequence

1. Instrument and prove the first-join deploy-release timeline so deploy and movement are authoritatively blocked per player until intended release.
2. Verify whether `OnPlayerDeployed` can still arrive while the loading gate says unreleased, and whether the undeploy/input-restriction fallback is winning that race.
3. Route all production menu entry points through the same loading-state guard so the player cannot bypass the warm contract through a different path.
4. Bring team-swap loading behavior up to the same standard only after the first-join contract is proven.
5. Remove or narrow global ready-dialog hidden-cache invalidation on join/leave.
6. Eliminate unnecessary rebuild churn in the vehicle HUD family and ready dialog.
7. Move gadget locker from "prebuild-capable" to "guaranteed hidden-built before interactable use".
8. Decide whether admin panel body remains lazy.
9. Re-test first-open scenarios with two players:
   - one player already in a menu
   - second player opens a different menu for the first time
10. Run a robust regression pass after lifecycle changes, not just spot checks:
   - join mid-match
   - undeploy/redeploy
   - ready dialog via both trigger paths
   - passive vehicle HUD after live deploy menu use
   - gadget locker open across multiple lockers
   - team switch while hidden caches already exist

Do not insert additional speculative fixes between steps `1` and `2`.
The next pass must first produce evidence for the deploy-release race.

## Bottom Line

The current UI architecture is not fundamentally ad hoc. Most of it is already shell-based, per-player cached, and reveal-oriented.

The remaining instability/performance issues are concentrated in three areas:

1. cold-open paths still allowed to exist
2. global invalidation wider than necessary
3. missing instrumentation around first-build and rebuild behavior

That is the right optimization target for the next phase.

