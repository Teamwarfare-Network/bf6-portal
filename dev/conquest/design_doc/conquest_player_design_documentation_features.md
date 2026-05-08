# TWL Conquest — Player-Facing Feature Documentation

Player-readable summaries of the features that make up TWL Conquest. Tone is Steam-page / Discord-post: friendly, layman-readable, Battlefield terms allowed.

> **Audience:** end users (Steam page, Discord, in-game help). Player-facing content lives in the top half of this doc; the [Internal / Working Notes](#internal--working-notes) section at the bottom is editorial context only — NOT for player consumption.

> **Known issues / limitations** are tracked separately and intentionally NOT mixed into these summaries.

---

## TWL Conquest Table of Contents

**Player-facing features**
- [Custom Dialogs / Interfaces](#custom-dialogs--interfaces)
- [Game Match Flow](#game-match-flow)
- [Player Ready Up Panel](#player-ready-up-panel)
- [Configurations / Admin Ready Up Panel](#configurations--admin-ready-up-panel)
- [Vehicle Deploy Modes](#vehicle-deploy-modes)
- [Supply Box Gadgets](#supply-box-gadgets)
- [Conquest HUD & UI](#conquest-hud--ui)
- [End Match Victory Panel](#end-match-victory-panel)

---

## Custom Dialogs / Interfaces

Walk into and interact with colored smokes to open their menus.

- **Green** → ready up & swap teams (admins configure mode here too)
   - Triple-tap E while on-foot to access this at any time
- **Purple** → deploy into a vehicle (HQ / Forward / Air Deploy)
- **Yellow** → Supply Box in the field during a live game (@HQ pre-game to previews)

Both main bases have a green + purple pair near spawn, so ready-up and vehicle deploy are always a step away. Yellow Supply Boxes are near objectives during the match; the ones at HQ are pre-game-only previews for testing loadouts.

---

## Game Match Flow

A match runs through four stages:

1. **Pre-game** → Admin configures, vehicles, settings and modes; players warm up, check loadouts and supply box tuning
2. **Ready Up** → Hit READY when you're good to go; match auto-starts when all players are ready
3. **Countdown** → 3-2-1 on the deploy screen, also displays vehicle round-timings
4. **Live** → kill the enemy, capture flags and bleed tickets

Pre-game is the warm-up. Once enough players hit READY, countdown begins and the match goes Live. The round ends once a team reaches 0-tickets, or on clock time out (higher tickets wins or a draw if even).

---

## Player Ready Up Panel

Shows the current admin, ready status, and lets you swap teams.

- Opens from any green smoke at your main base
- **'READY'** toggles your status as good to start 
- **'CLAIM ADMIN'** appears top-right when the admin slot is empty
- **'CHANGE TEAMS'** works at any time, even mid-match
   - Triple-tap E while on-foot to access this at any time

When the admin leaves or gives it up, 'CLAIM ADMIN' appears for everyone — nobody is auto-promoted, somebody has to take it. This is typically whomever hosts the match.

---

## Configurations / Admin Ready Up Panel

Admin's pre-match control panel. Pick vehicles, modes, and settings before the round starts.

- Start from a TWL preset (e.g. 12v12 Conquest), or customize anything (& everything!)
- Center checkboxes pick deploy modes: Vanilla / HQ / Air / Forward / Supply Boxes.
- Unsaved changes turn red → **'APPLY CONFIGURATION'** locks changes in
- **'GIVE UP ADMIN'** allows you to yield Admin to another player.

Use left/right arrows on each row to cycle vehicle options per team. A preset loads TWL defaults instantly; tweak any setting and the mode flips to "Custom" so you know you're off-template. 

---

## Vehicle Deploy Modes

One menu, multiple ways to get a vehicle. Opens on the deploy screen, or via the purple smoke at HQ.

- Admin picks which modes are on:
   - **Vanilla** → auto-spawns at HQ, walk up and drive (classic BF).
   - **HQ Deploy** → request and you're seated at HQ instantly.
      - **Forward Deploy** → ground vehicles drop at a random forward point.
      - **Air Deploy** → aircraft drop airborne in your team's sky zone.
- Vehicle deploys cost no ticket and don't count as a death.

Built to stop pad-camping — if the enemy can't predict where vehicles appear, you get real fights instead of farming spawns. Vanilla is classic Battlefield. HQ flips it: nothing auto-spawns, but you request and get seated on demand. Forward and Air extend the HQ deploy capabilities — ground vehicles get pushed up to a forward zone, aircraft drop back in your team's sky zone, both at tuned randomized points so its difficult to predict or camp.

---

## Supply Box Gadgets

Interact with yellow smoke for a Supply Box. Grab class-specific gadgets.

- Live match only at objectives (previewable at HQ pre-game)
- Per-player cooldowns and per-team charges → tuning varies by map
- Buttons dim on cooldown; timer shows when they're available again
- Pick which gadget slot gets used at the top

A class-aware gadget vending machine. Each button shows its scope ("1 per player", "1 per team"), a cooldown, and a live timer when locked. Cooldowns persist per player (and per team for shared items) — closing / reopening the menu or visiting a different Supply Box won't reset them.

---

## Conquest HUD & UI

Tickets, clock, capture progress, with an added vehicle ready-status panel

- **Ticket bar** → friendly left/blue, enemy right/red. Chevrons show bleed rate
- **Capture panel** → capture-point progress, status and contest indicators
- **Vehicle list** → friendly HQ vehicles with WAIT / READY / ACTIVE statuses
- **Crown** → shown over the team currently in the lead

Bleed chevrons indicate bleed differentials. Vehicle deploy timers show bars filling in 10% increments.

---

## End Match Victory Panel

End-of-match scoreboard. Winning team, final tickets, rosters, 30 seconds until the next round.

- Crown over the winning team. Final ticket counts in big digits
- Both team rosters and match length

The match wraps up here. Tickets freeze, the winner gets a crown, the result line shows the win margin (or "Draw" if tied). The 30-second window is sized for league captains to capture results.

---

# Internal / Working Notes

> Everything below this point is editorial context for refining the player-facing copy above. NOT for player consumption.

---

## Cross-feature insights

A few patterns are worth calling out because they shape several features at once and would be worth highlighting (or downplaying) consistently in the player-facing copy:

### Smoke-as-wayfinding is the entire dialog model

The three smokes (green / purple / yellow) are the player's mental map for "what menu opens here". Every dialog the player sees is anchored to one of those colors, and the triple-tap is the only input gesture they need to learn. Player-facing copy should lead with the smoke, not the menu name — *"walk into the green smoke and triple-tap"* reads better than *"open the Player Ready Up Panel via the interact point at your main base"*. The Custom Dialogs section sets that vocabulary up front; every other feature can refer back to it instead of re-explaining how the menu opens.

### "Ready up" is two surfaces, not one

The full **Ready Up dialog** (admin only) and the **Player Ready Up Panel** (everyone else) are different UIs that solve different jobs. The dialog is a configuration suite; the panel is a status board with a swap/ready/claim button row. When the player-facing copy talks about "ready up", we should probably refer to the panel — that's what 99% of players ever see. The dialog is "the host's settings menu", which is a separate concept. Both are opened by the **green smoke**.

### Vehicle Deploy is one feature with four modes — match the player's mental model

The Vehicle Deploy menu and the four deploy modes (Vanilla / HQ / Forward / Air) live as a single feature in this doc because that's how players experience it: one menu, one SPAWN button, four different outcomes depending on what the admin enabled. Mechanically they all share the same persistent spawner, the same `enqueueDispatch` mutex, the same `OnVehicleSpawned` bind path, and (for HQ/Air/Forward) the same `ForcePlayerToSeat` post-deploy hook — so explaining them as siblings is accurate as well as friendly. From a player's POV the four feel like:
- **Vanilla** = "drive up and press E"
- **HQ** = "click a vehicle, spawn at HQ"
- **Forward** = "click a tank, spawn closer to the action"
- **Air** = "click a jet/heli, spawn in the air"

The admin checkbox layout reinforces the relationship (Air and Forward are children of HQ — they only mean anything in HQ mode), so player copy should respect that hierarchy: "HQ Deploy is on" is the parent statement, "Air Deploy is enabled" is a refinement.

### "Bars instead of digits" is a global rule with one exception

Every countdown in the game is a 10-chunk progress bar except the master clock at the top of the HUD, which stays digital MM:SS. The master clock is the canonical time source — players check it the way they'd check their watch. Everything else (vehicle cooldowns, supply-box gadget cooldowns, post-LIVE air/forward delays) is ambient because the exact number doesn't matter, only the "almost ready" feel. If a player asks "how long until the tank?", the answer they want is "soon" or "wait" — not "47.3 seconds".

### Color is locked: blue = friendly = left, red = enemy = right

Not negotiable. Every UI surface respects it. The bleed-chevron color *inversion* (left chevrons on the blue bar are red, right chevrons on the red bar are blue) is the one place we deliberately violate the rule, and it's because chevrons mean "you are bleeding" — they need contrast against their own bar, and the inverted color reads correctly as "the enemy is doing this to you".

### Admin is claim-only

The **Admin** slot is the *active* configuration owner and can be passed around: every match starts with the slot vacant, anyone can press CLAIM ADMIN to take it, the current admin can press GIVE UP ADMIN to release it, and an admin disconnect vacates immediately. New joiners do *not* automatically inherit a vacant admin slot — somebody has to actively press CLAIM ADMIN. This is a deliberate lock-in: passive vacancy beats accidental promotion. (Pre-v1.459 there was a "first-ever joiner becomes admin" exception piggy-backed on a Host concept; the engine reports the closest-to-server player as first-loaded rather than the actual server host, so the inferred Host was often wrong and the auto-admin path went with it.)

### Spawn-charge applies to deaths, not deploys

Every death-respawn cycle costs your team 1 ticket. But voluntary deploy actions (clicking HQ Deploy / Air Deploy / Forward Deploy / SWAP TEAMS while alive) do *not* cost a ticket — they're UX actions, not deaths. This is invisible to the player as a number, but it's a visible behavior: spamming HQ Deploy doesn't drain your team. Worth thinking about whether to surface this in the player-facing copy or leave it as a quiet "feels right" property.

### The match has clear life stages

`NOT_READY → PRE_MATCH → LIVE_MATCH → POST_MATCH → RESET`. Most player-facing copy doesn't need to name the stages, but there are a few moments where it leaks: the round-start delays on Air/Forward Deploy ("you can't air deploy yet — the round just started"), the live-disable on CLAIM ADMIN / SWAP TEAMS, and the Victory Panel's 30-second reset countdown. We should pick consistent vocabulary in the player copy: "pre-match" / "match" / "post-match" is plain enough. "Phase" or "lifecycle" is jargon and should stay internal.

---

## Exhaustive details

Per-feature working notes for refining the player-facing copy above. Source-file references and code-level detail; not for player consumption.

### Custom Dialogs / UI Interfaces — Detail

- VFX prefab constants in [`src/foundation/gameplay.ts:209-212`](../src/foundation/gameplay.ts#L209-L212):
  - `VFX_GREEN_SMOKE  = mod.RuntimeSpawn_Common.FX_Granite_Strike_Smoke_Marker_Green`
  - `VFX_VIOLET_SMOKE = mod.RuntimeSpawn_Common.FX_Granite_Strike_Smoke_Marker_Violet`
  - `VFX_YELLOW_SMOKE = mod.RuntimeSpawn_Common.FX_Granite_Strike_Smoke_Marker_Yellow`
  - (`VFX_RED_SMOKE` exists in code but is not currently authored on any map.)
- ObjId allocation contract (CF-120, locked):
  - Main-base interactables start at `1000`, authored as **even/odd pairs**:
    - **Even objId → green smoke → ready dialog** (e.g. 1000, 1002, 1004, 1006...)
    - **Odd objId → purple smoke → vehicle spawn menu** (e.g. 1001, 1003, 1005, 1007...)
  - **Point interactables `1050–1099` → yellow smoke → ammo resupply / supply box.**
  - Parity / range rules are validator checks; the map-config entry is the source of truth.
- Yellow smoke at HQ vs at objectives:
  - Two yellow smokes at HQ on Operation Firestorm have `disableOnLive: true` (objIds 1056, 1057 — coords match each team's HQ pad). These are **pre-game-only loadout previews** and turn off when Live starts.
  - The remaining yellow smokes (objIds 1050-1055) are **at objectives** and stay active during Live.
  - The flag is set per-objId in the map config — `disableOnLive: true` is the discriminator; default is "always on".
- Purple smoke / Vanilla mode interaction (open consistency note — see [Open consistency notes](#open-consistency-notes) #1):
  - Player-facing copy says the purple smoke appears *"if HQ, Air or Forward Deploy is enabled"*. Source today does NOT gate purple-smoke VFX or its interact-point on the deploy mode — purple smokes are hard-coded in the map config and remain visible in pure Vanilla mode (where the menu opens but has no SPAWN buttons). If the gate is intended player behavior, ship a `disableInVanilla` flag (mirror of `disableOnLive`) on the purple-smoke anchors. If not, soften the player-facing wording.
- Authored on each map under `mainBaseInteractableObjIds[]` and `gadgetInteractableObjIds[]` in [`src/config/maps/operation-firestorm.ts`](../src/config/maps/operation-firestorm.ts).
- Each smoke is paired with a runtime-authored `InteractPoint` and a runtime-spawned `WorldIcon` clone (per-player visibility via `SetWorldIconOwner`, since `mod.AddUIIcon` is non-functional on this engine — see AGENTS.md "mod.AddUIIcon is Non-Functional").
- Triple-tap detection: [`src/utils/multi-click.ts`](../src/utils/multi-click.ts) — three E-presses within a short window count as a triple-tap event.
- Triple-tap requirement is **on the ground + on foot**, not literally "standing still" (player-facing wording is loose). `spawnReadyDialogInteractPoint` in [`src/interaction/interact-point.ts`](../src/interaction/interact-point.ts) polls `IsOnGround` before placing the InteractPoint; movement during the poll does not block the spawn.
- Triple-tap routing chokepoint: [`src/interaction/interact-point.ts:tryOpenReadyDialogForPlayer`](../src/interaction/interact-point.ts) (green-smoke path); supply-box and vehicle deploy menus follow analogous open paths through their respective lazy-build dispatchers.
- Visibility gating on the green smoke main-base interactable: shown only while the player is deployed inside their own HQ on the team that owns the terminal (CF-121). Authored `InteractPoint`s are shared; script gates activation by team / HQ state.
- Red smoke is reserved for future use (visual marker color is allocated but not currently consumed).

### Game Match Flow — Detail

- Lifecycle states (CF-69): `NOT_READY → PRE_MATCH → LIVE_MATCH → POST_MATCH → RESET`.
- Authoritative state field: `State.conquest.lifecyclePhase` in [`src/state/runtime.ts`](../src/state/runtime.ts).
- **Pre-game phase:** vehicles auto-spawn (Vanilla mode) or stand by for player request (HQ mode); ticket counts initialized to starting tickets (CF-1: 400) but no bleed; capture points neutral and not contested; spawn-charge does not apply; `prelive_main_base` boundary kind is active.
- **Ready up gate:** ready states tracked per pid via `State.players.readyByPid`. Auto-start trigger fires when both teams have at least `State.round.modeConfig.confirmed.autoStartMinActivePlayers` players ready ([`src/ready-dialog/auto-start.ts`](../src/ready-dialog/auto-start.ts)). Auto-unready only triggers locked at exactly 2 (CQ_Bug_58 / v1.445): SWAP TEAMS, and admin config change.
- **Countdown phase:** 3-2-1 staggered text + VO via [`src/ready-dialog/countdown-flow.ts`](../src/ready-dialog/countdown-flow.ts) and [`src/ready-dialog/pregame-ui.ts`](../src/ready-dialog/pregame-ui.ts). Digital countdown (one of the rare digital-countdown exemptions because the literal number reads better than ambient indication).
- **LIVE start transition:** forced redeploy of all players, fleet sink + re-spawn from confirmed config, `disableOnLive: true` interactables turn off (HQ Supply Box previews), `prelive_main_base` boundary disappears, `ground_combat_zone` and `enemy_main_base_buffer` boundaries activate, capture-point timing engages (CF-9: 20s capture, 20s neutralize), bleed math goes live (CF-2: `1 ticket × differential / 3 seconds`), spawn-charge applies on every deploy except first-live-spawn (CF-117 / CF-76).
- **Match-end priority (CF-7 / CF-60 / CF-75):** tickets first, clock second; draw if both teams reach 0 in the same evaluation window. Single owner authority: `end_CheckAndEndMatch(...)` is the only function that may transition to end state (CF-70).
- **End-latch atomicity (CF-101 / CF-110):** all end paths route through one global latch + atomic snapshot freeze. After `endLatched = true`: no further ticket drains, spawn-charge deductions, KPI mutations. Read-only UI projection only; Victory Panel renders from the snapshot, not live state.
- **Post-match phase:** Victory Panel sticks for `MATCH_END_DELAY_SECONDS` (currently 30s); cursor-disabled, screenshot-friendly.
- **Reset cycle:** clears all ready states (`resetReadyStateForAllPlayers`), KPI counters reset (CF-44 boundary), fleet sunk and re-spawned, lifecycle returns to `NOT_READY`. Admin can manually trigger via the admin panel's MATCH START / MATCH END / CLOCK RESET buttons (CF-88: admin actions route through authoritative gameplay paths, never parallel state machines).
- Identity policy (CF-99 / CF-107 / CF-108, V1): session-scoped pid only. Reconnect = new identity, no continuity. Late joiner during Live does NOT grant a fresh first-live-spawn exemption.
- Player-facing copy claim "Draws are possible if tickets end at the same number" — true for the both-teams-hit-0-simultaneously case (CF-7), and true at clock-end if both teams have equal positive tickets. If teams have unequal positive tickets at clock-end, higher tickets wins (no draw).

### Player Ready Up Panel — Detail

- Source: [`src/ready-dialog/player-ready-panel.ts`](../src/ready-dialog/player-ready-panel.ts) (~448 lines); event routing in [`src/interaction/ui-events-player-ready-panel.ts`](../src/interaction/ui-events-player-ready-panel.ts).
- Built lazily via `triggerLazyBuild('playerReadyPanel', pid)` from [`src/interaction/interact-point.ts:tryOpenReadyDialogForPlayer`](../src/interaction/interact-point.ts) — single chokepoint, branches on `Admin.isAdmin(pid)`. Admin → full ready dialog; non-admin → this panel.
- Container is 640w × 280h, centered, with 4-line border chrome mirroring the full dialog.
- Content rows (centered): Title (large), Game Admin name (or "No Admin"), team-aware ready status line. Game Host row removed v1.459 (Host was never script-authoritative — engine reports closest-to-server player as first-loaded, not the actual server host).
- Bottom button row: SWAP TEAMS, READY/NOT READY (label flips), SPECTATE/COACH (disabled, greyed — D3 verbatim from full dialog), CLOSE.
- **Live-disable matrix:** READY button greys + disables on Live (`syncPlayerReadyPanelReadyButtonForPid` checks `isMatchLive()`). CLAIM ADMIN button greys + disables on Live (`syncPlayerReadyPanelClaimAdminButtonForPid`). **SWAP TEAMS button has NO `isMatchLive()` guard** — it stays enabled and clickable throughout Live, which is what the player-facing claim "SWAP TEAMS works any time, even mid-match" relies on. SPECTATE/COACH stays disabled regardless of phase (V1 placeholder).
- Player-facing copy says *"Every player lands here first"*. Source-side that's true because every match starts with `Admin.isAdminVacant() === true` — every player is initially a non-admin and uses this panel until somebody claims.
- CLAIM ADMIN button: top-right, 8px padded. Visibility owned by `syncPlayerReadyPanelClaimAdminButtonForPid` which gates on `Admin.isAdminVacant()`. Live-disabled state: greyed + click-disabled, but stays visible (so the viewer understands the slot is vacant and that handoff is locked during Live).
- Refresh broadcast: any admin transition (claim / give-up / admin-disconnect) calls `refreshAllVisiblePlayerReadyPanels` so every viewer's Game Admin row + CLAIM ADMIN visibility update in lock-step.
- READY auto-close behavior on the panel mirrors the dialog's path: hide → restore cursor → fire `handleReadyDialogReadyButtonClick` (world log, ready-count, auto-start gate) — single shared handler.
- Identity / handoff rules (v1.459):
  - **No auto-promotion ever.** Every match starts with `Admin.isAdminVacant() === true`; CLAIM ADMIN visible to every viewer until someone presses it.
  - Admin disconnect → slot vacates immediately, no auto-promotion of next-in-server.
  - Two simultaneous CLAIM ADMIN clicks → first wins atomically (`Admin.claimAdmin` returns false on contended slot).
  - GIVE UP ADMIN (button on the full ready dialog) releases the slot for someone else to claim.
  - **CLAIM ADMIN auto-opens the admin dialog (v1.460):** after a successful claim, the panel hides and the new admin is canonical-routed straight into the full ready dialog (`tryOpenReadyDialogForPlayer`) — no second triple-tap required. Cursor stays up across the panel-hide → dialog-show transition.
- Auto-unready triggers locked at exactly 2 (CQ_Bug_58 / v1.445): SWAP TEAMS click, and admin config change → APPLY. Death/respawn does NOT clear ready. Walking out of the main base does NOT clear ready.

### Configurations in Admin Ready Panel — Detail

- Built in [`src/ready-dialog/dialog-build.ts`](../src/ready-dialog/dialog-build.ts) and [`src/ready-dialog/dialog-build-mode-config.ts`](../src/ready-dialog/dialog-build-mode-config.ts); column schema in [`src/ready-dialog/mode-config-schema.ts`](../src/ready-dialog/mode-config-schema.ts).
- Center column structure (v1.314+): Game Mode stepper at top, then five checkboxes in left sub-col (Vanilla / HQ / Air-indented / Forward-indented / Supply Boxes), Players stepper below.
- Vanilla and HQ are a radio pair. Toggling Vanilla while Air or Forward is on force-clears them (the impossible "Vanilla + Air/Forward" combo never reaches state). This is also why the player-facing copy can say "If Vanilla is not enabled, HQ Deploy is automatically enabled."
- Air and Forward auto-flip the parent to HQ when clicked from a Vanilla state — single-click ergonomic, per [`src/ready-dialog/mode-config-presets.ts`](../src/ready-dialog/mode-config-presets.ts).
- Vehicle knob rows: 4 ground + 4 air (jet/heli) + 4 transport per team. Plus an "Aircraft Ceiling" tunable when applicable.
- Knobs back into `State.round.modeConfig` (draft) vs `State.round.modeConfig.confirmed` (committed). Visible diff state tints the unsaved-changes label red until APPLY.
- **Button label is "APPLY CONFIGURATION"** — verified against [`src/strings.json`](../src/strings.json) `"confirmSettingsLabel": "APPLY CONFIGURATION"`. Use this exact phrasing in player-facing copy (current copy uses "Apply Configuration" — fine, just note the all-caps button rendering).
- APPLY pipeline: `confirmReadyDialogModeConfig` → `refreshVehicleSpawnSpecsFromModeConfig` → `applyVehicleSpawnSpecsToExistingSlots` → `applySpawnerEnablementForMatchup` → invalidate timer HUD signatures → rebuild deploy-timer HUD → `forceUnreadyApplierAfterConfirm` (admin un-readies themselves; `requireReadyReconfirmAfterConfigChange` un-readies all other previously-ready players).
- The dialog is the *expensive* surface — ~100 widgets per built admin instance — and is built lazily on first triple-tap. v1.421+ restricts the rich grid to a single Admin slot to avoid paying the cost on every player.
- "Confirmation UIs concentrate on host" is a locked design philosophy entry (Wave 4 Ship 4 / `conquest_optimizations_solutions_4.27.26.md` #4). The word "host" here is the historical doc-section name; the implementation is the Admin slot per the [Admin is claim-only](#admin-is-claim-only) insight.

### Vehicle Deploy — Detail

**Source files**
- Menu rendering + spawn button names: [`src/vehicles/deploy-timer-ui.ts`](../src/vehicles/deploy-timer-ui.ts).
- Alive-player live-terminal ownership: [`src/vehicles/deploy-live-menu.ts`](../src/vehicles/deploy-live-menu.ts).
- Vanilla spawner architecture: [`src/vehicles/vanilla-spawner.ts`](../src/vehicles/vanilla-spawner.ts) (~596 lines).
- HQ / Forward / Air request paths: [`src/vehicles/hq-deploy.ts`](../src/vehicles/hq-deploy.ts).
- Forward sampling: [`src/vehicles/forward-spawn-volume.ts`](../src/vehicles/forward-spawn-volume.ts).
- Air sampling: [`src/vehicles/air-spawn-volume.ts`](../src/vehicles/air-spawn-volume.ts).
- Per-map vehicle slot inventory: [`src/config/maps/operation-firestorm.ts`](../src/config/maps/operation-firestorm.ts) etc.

**Menu open paths (two contexts)**
- **Deploy screen (dead player):** revealed automatically as part of `renderVehicleSpawnerUiFamilyForReveal` → `revealVehicleDeployTimerHudForPlayer`.
- **On-foot live terminal (alive player at purple smoke):** `tryOpenVehicleDeployLiveMenuForPlayer(eventPlayer)` — closes any open arm menu / ready dialog, sets `setVehicleDeployLiveMenuVisibleForPid(pid, true)`, enables UI input mode, calls `revealVehicleDeployTimerHudForPlayer`. Closes via `closeVehicleDeployLiveMenuForPlayer` (restores input mode, hides the timer HUD family).
- Per-pid state field: `State.players.liveVehicleDeployMenuVisibleByPid[pid]`. Allocator: `setVehicleDeployLiveMenuVisibleForPid`. Deallocator: `resetVehicleDeployLiveMenuStateForPid` (called from `cleanupHudForPid`).
- Lazy build: `triggerLazyBuild('vehicleDeployTimer', pid)` — built on first deploy menu open. Wave 6 stagger places it at +50ms after `topHudShell` to distribute join cost.
- Console / controller note: SPAWN buttons from the deploy screen now work correctly on controller (resolved at v1.466 via two ships — see [issue #113](./conquest_issues.md)). v1.465 moved the click action to fire on the first primary-click event via `tryConsumeUIButtonPrimaryClickEvent` dedupe (matches team-swap pattern that was always console-friendly); v1.466 added a per-player `mod.EnablePlayerDeploy(player, false)` block during the HQ-claim window so the engine's deploy-on-foot action can't strand the player on foot before the vehicle binds. The on-foot purple-smoke path still works identically — no behavior regression in the live-terminal source path. Per-player only via centralized helper `setVehicleDeployEngineDeployBlockForPid(pid, blocked)` in [`src/vehicles/hq-deploy.ts`](../src/vehicles/hq-deploy.ts) — does NOT touch the global `mod.EnableAllPlayerDeploy` countdown gate. **Open consistency note: the player-facing known-issues doc still lists #113 as Open — needs to be reconciled (see [Open consistency notes](#open-consistency-notes) #2).**

**Mode gates**
- Vanilla: `isVanillaDeployMode()` — `confirmed.vehicleDeployMethod === VEHICLE_DEPLOY_METHOD_VANILLA`.
- HQ: `isHqDeployMode()` — `confirmed.vehicleDeployMethod >= VEHICLE_DEPLOY_METHOD_HQ`.
- Forward: `isForwardDeployEnabled()` — `confirmed.forwardDeployEnabled === true`. Orthogonal to HQ enum tier.
- Air: `isAirDeployEnabled()` — `confirmed.airDeployEnabled === true`. Orthogonal to HQ enum tier.
- Admin checkboxes: Vanilla and HQ are a radio pair; Air and Forward are children of HQ that auto-flip the parent on click. Toggling Vanilla while Air/Forward is on force-clears them.

**Vanilla architecture (v1.258 rewrite)**
- One persistent `VehicleSpawner` per slot, never destroyed. Pre-existing parallel-spawn paths and reservation systems are deleted; do not reintroduce.
- Spawn dispatch: `enqueueDispatch(slotIndex)` chains onto a Promise mutex (`spawnMutex`); each `doDispatch` calls `mod.ForceVehicleSpawnerSpawn`, awaits `OnVehicleSpawned`, binds to slot via `bindSpawnedVehicleToExpectingSlot`. `currentlyExpectingSlotIndex` lets a delayed event arriving after timeout drop cleanly.
- Respawn: `OnVehicleDestroyed` is the only respawn trigger; `Clocks.CountDownClock` drives the 120s timer and surfaces remaining time to the deploy-timer HUD.
- Vehicle destroy: every tracked vehicle goes through `sinkAndDestroyVehicle` (X/Z preserved, teleport to Y=-1000, lethal damage 1.5s later — explosion muffled beneath the pad).
- Mid-match config change: `applyVehicleSpawnSpecsToExistingSlots` re-applies the 8-setter spawner config block; pre-existing fleet is sunk before new types take over.

**HQ / Forward / Air request flow (shared)**
- Three entry points, one per mode: `requestHqVehicleSpawn` / `requestForwardVehicleSpawn` / `requestAirVehicleSpawn`, all with `source: "deploy_menu" | "on_foot"`.
- Validation chain (rejects with reason): cooldown, claim_in_flight, slot_disabled, slot_occupied, slot_claimed, slot_busy, respawn_cooldown, team_mismatch, bad_team, plus mode-specific checks (aircraft-only / ground-only).
- Reservation: `slot.pendingSpawnOwnerPid = pid`, `slot.pendingSpawnMode = "ground" | "forward" | "air"`, `slot.hqSource = source`. Single-claim-per-player via `findSlotForHqClaim(pid)`.
- Dispatch reuses Vanilla's `enqueueDispatch` channel — no new spawn code; HQ / Forward / Air are callers, not parallel systems.
- Claim timeout: 10s via `scheduleHqClaimTimeout`. If still bound at timeout (seat never fired), the orphan vehicle is sunk via `sinkAndDestroyVehicle` and slot flags clear.
- Cooldown: 5-second per-player gate via `State.hqDeploy.lastRequestAtSecondsByPid`. (Player-facing copy doesn't surface the exact cooldown; the deploy-timer HUD is the visible signal.)

**Post-bind seat flow ("BountyHunter pattern", v1.252-validated)**
- `onHqVehicleSpawnedForClaim` → `beginHqSeatFlow` → 0.5s settle → for `on_foot` source: mark `vehicle_deploy` exempt, `mod.SetRedeployTime(0)`, `mod.UndeployPlayer`, poll for undeploy registration, `mod.DeployPlayer` → `OnPlayerDeployed` fires → `onHqSeatPendingPlayerDeployed` calls `mod.ForcePlayerToSeat(player, vehicle, -1)` inside the deploy event handler.
- For `deploy_menu` source: skips the undeploy/redeploy step (player is already dead at deploy screen).
- `ForcePlayerToSeat` is reliable only inside the `OnPlayerDeployed` event handler — that's the BountyHunter pattern's load-bearing constraint.

**Forward / Air post-seat relocation**
- HQ mode: vehicle stays at `slot.spawnPos` (HQ pad) through the `DeployPlayer` chain. No pre-seat or post-seat Teleport needed.
- Forward / Air: snapshot `forwardTargetPos` / `airTargetPos` in `onHqSeatPendingPlayerDeployed` BEFORE `onForwardSpawnSuccess` / `onAirSpawnSuccess` re-seed for the next click. After `ForcePlayerToSeat` completes, `mod.Teleport(vehicle, targetPos, yawRad)` relocates the vehicle (with the seated player aboard).
- Validated: `mod.Teleport(vehicle, ...)` carries the seated occupant. No visible pop because the player is still in the deploy UI during the HQ-pad occupancy window.
- Spawner restore: `onForwardSpawnSuccess` / `onAirSpawnSuccess` snap `slot.spawner` back to HQ pad and re-seed the next sample point.

**Forward / Air spawn-volume sampling**
- Forward: triangle-split + barycentric sample of authored quad in X/Z, weighted by triangle area. Free-space guard validates landing point isn't inside an obstacle (CQ_Feat_Forward_Deploy_FreeSpace / Issue #57 / v1.207).
- Air: floor X/Z from triangle sampling + additive altitude (jets in `[floorY + jetSpawnFloor, floorY + jetSpawnCeiling]`, helis in `[floorY, floorY + heliSpawnCeiling]`). Jets use `volume.rotPlane`; helis use `volume.rotHeli`.
- Per-slot pre-sampled point: `slot.nextForwardPos` / `nextAirPos` seeded by `seedNextForwardTransformForSlot` / `seedNextAirTransformForSlot` at slot init, countdown-reset, and after every successful spawn — so consecutive clicks never reuse coordinates.

**Round-start lockouts (Air / Forward only)**
- Air: `isRoundStartAirDeployDelayActive()` and `isRoundStartAirDelayActive()` — both gates must clear.
- Forward: `isRoundStartForwardDeployDelayActive()` gate.
- Pregame countdown UI ([`src/ready-dialog/countdown-flow.ts`](../src/ready-dialog/countdown-flow.ts)) surfaces these as staggered delay lines so players know when each unlocks.

**Ticket / spawn-charge / death-count interaction**
- Spawn-charge exemption: `markNextDeployReason(pid, "vehicle_deploy")` — alive on-foot vehicle deploys (HQ / Forward / Air) do NOT charge a ticket (CF-91 / v1.393).
- Death-then-deploy from deploy screen still charges a ticket (the player consumed a death-respawn anyway).
- Vanilla mode: no spawn-charge interaction with the menu — players just walk up and press E.
- "Don't count as a death" claim in player-facing copy: the on-foot HQ/Forward/Air path calls `mod.UndeployPlayer` then `mod.DeployPlayer`. `OnPlayerDied` is NOT fired for the undeploy path (it's only an engine-level event for actual kills), so the player's death KPI count does not increment. Confirmed by absence of any `vehicle_deploy`-conditioned `OnPlayerDied` handling.

**Menu rendering details**
- Slot rendering: `getVehicleDeployVisibleSlotsForPlayer(player)` returns the per-team filtered visible slot list; row index → slot index mapping is what `requestHqVehicleSpawn(player, pid, rowIndex, source)` resolves with `visibleSlots[rowIndex]`.
- Per-row spawn button names: `getVehicleDeploySpawnButtonName(pid, rowIndex)` → `${UI_VEHICLE_DEPLOY_TIMER_SPAWN_BUTTON_ID}${pid}_${rowIndex}` (per-pid + per-row uniqueness).
- Per-mode buttons: `getVehicleDeployGroundButtonName` (forward); generic SPAWN button maps to HQ for ground or air based on slot type + admin config.
- Aircraft vs ground gating: `doesVehicleTypeSupportAirDeploy` / `doesVehicleTypeSupportGroundDeploy` / `doesVehicleTypeSupportForwardDeploy` gate which deploy buttons render per row.
- Status text via `setReusableTimerStatus`: "READY" (green), "ACTIVE" (slot occupied), "SPAWNING" (mid-dispatch), "DEPLOYING" (post-bind seat flow). Timer mode renders the Wave 5 decile-chunk fill bar with "WAIT" label centered (CQ_Tweak_WAIT_Label / v1.446).
- HUD repaint: `updateVehicleDeployTimerHudForAllPlayers()` is called after every state edge.
- Vanilla mode interaction: menu still shows row state (timer / READY / ACTIVE) for situational awareness, but SPAWN buttons are absent.
- Admin override: `isVehicleDeployTimerAdminOverrideEnabledForPid(pid)` lets the admin force the timers visible at all times for testing (admin panel toggle: "DEPLOY TIMERS VISIBLE ON / OFF").
- Disabled slots stay hidden in the HUD; admin can re-enable via the Ready Up dialog vehicle knobs.

**Banned patterns (across all modes)**
- `mod.Teleport(player, ...)` immediately before `ForcePlayerToSeat` — broke twice in v1.106-v1.108 and v1.151-v1.154. See `project_teleport_vehicle_spawn_mystery.md` memory.
- Pre-seat vehicle Teleport in `doDispatch` for forward/air paths — drops vehicle loadout. v1.333/v1.334 fix moved both to post-seat.
- `mod.SetObjectTransform` on a `Vehicle` instance — no-op on the current engine build.
- `mod.SetObjectTransform` on a persistent `VehicleSpawner` to relocate at altitude — does not reliably propagate (v1.331 probe).

**Engine event reliability (asymmetric)**
- `OnPlayerEnterVehicle` drops events under load (CQ_Bug_43 / Issue #106). Code that depends on a fresh `seatKind` on entry must include a safety-net engine re-probe.
- `OnPlayerExitVehicle` is reliable.

**Known limitations**
- Jet pitch on Air Deploy is lost (yaw-only Teleport) — accepted as-is, pilots pitch manually after seat (Issue #85, closed accepted).

### Supply Box — Detail

- Source: [`src/interaction/ammo-resupply-menu.ts`](../src/interaction/ammo-resupply-menu.ts) (~2866 lines — the largest single feature module).
- Per-class tile groups (config in `DEFAULT_GADGET_LOCKER_CONFIG`):
  - **Assault:** Artillery Strike (1500s, team-shared, 1 max), Spawn Beacon (900s, team-shared, 1 max), Assault Ladder (600s, team-shared, 1 max).
  - **Engineer:** RPG / AT4 / Stinger ammo charges (3 charges max, 60s recharge per charge, 180s launcher cooldown, AT4 has team pool 4-max + 180s recharge).
  - **Medic:** Grenade Intercept + Missile Intercept (180s each, per-player, 1 max), Smoke Screen (360s team-shared, 1 max).
  - **Recon:** Recon Drone (300s, per-player, 1 max), C4 (180s), AV Grenade (180s) — share a 180s family cooldown.
- **Per-map override capability:** `syncActiveGadgetLockerConfig(override?: GadgetLockerConfig)` swaps `ACTIVE_GADGET_CONFIG` to a map-specific config when the map ships one — backs the player-facing "Supply Boxes will be tuned per map" claim. Falls back to `DEFAULT_GADGET_LOCKER_CONFIG` otherwise.
- "Choose which gadget slot is utilized at the top" (player-facing bullet) refers to the per-class slot-toggle row introduced in v1.304-v1.305 with persistence at v1.313 — toggle preference sticks across menu close/reopen via `State.players.lockerSlotToggle[pid]`.
- Lazy-built per pid via `triggerLazyBuild('supplyBox', pid)` — never built for players who don't open it.
- Class detection: `isCls(player, soldierClass)` + `getPlayerClassHdrIndex(player)` — only the player's own class column is interactive; others are dimmed.
- Slot-state initialization: `initLockerSlotStateFromProbe(pid, player)` reads the player's current inventory once on first open via per-class probes (`probeAssaultSlot`, `probeMedicSlot`, `probeReconSlot`, `probeLauncherSlot`). Engineer probes use `mod.GetInventoryAmmo`; Medic/Assault/Recon probes use `mod.HasEquipment`-based scoped probes (v1.447) to avoid engine log noise on empty / non-ammoable slots.
- Timer surface: `fmtClock(secondsRemaining)` formats a per-tile countdown widget; tile dim/owned state via `tileOwned` reads from the per-pid slot state.
- Cooldown state lives on `State.players.armG / armL / armS / armI / armO / armT / armFocusedTileKeyByPid`; team-shared cooldowns on `State.round.smk / asg / asgL`.
- Help text line: hovering a tile shows a short description (e.g. STR_UI_HELP_SPAWN_BEACON) below the menu.
- Sound: `playArmSfx` plays the gadget selection SFX on tile click.
- Per-class menus = supply boxes scoped to a single class's tiles (proposal #6 in `conquest_optimizations_solutions_4.27.26.md` Wave 5) — would cut the menu's widget count to 1/4. Not yet shipped.
- Heap impact: M2 in the heap-pressure ranking — second-largest per-player retained allocator after the ready dialog.

### Conquest HUD / UI — Detail

- Surfaces, by file:
  - **Top HUD shell** (clock, branding, status dock, help text container, victory dialog root): [`src/ui/conquest/top-hud-shell.ts`](../src/ui/conquest/top-hud-shell.ts) + [`src/clock/ui.ts`](../src/clock/ui.ts).
  - **Combat HUD** (tickets, flags, capture progress, chevrons, engage panel, popout): [`src/ui/conquest/hud-core/`](../src/ui/conquest/hud-core/) — split across `build.ts`, `render.ts`, `pipeline.ts`, `lifecycle.ts`, `state.ts`, `validate.ts`, `toggle.ts`, `names.ts`.
  - **Vehicle deploy timer HUD** (per-slot rows): [`src/vehicles/deploy-timer-ui.ts`](../src/vehicles/deploy-timer-ui.ts) + [`src/vehicles/timers.ts`](../src/vehicles/timers.ts).
  - **Boundary prompt:** [`src/boundary/prompt-ui.ts`](../src/boundary/prompt-ui.ts).
  - **Help text + status text** (state line, ready count): [`src/hud/help-visibility.ts`](../src/hud/help-visibility.ts) + [`src/hud/status.ts`](../src/hud/status.ts).
  - **Player Ready Up panel + full ready dialog:** see their dedicated entries above.
- Player-facing bullets dropped the master clock + boundary prompt callouts. Both still ship; they're just not surfaced in the headline copy. Master clock = top center, MM:SS digital — the canonical match-time reference (critical-time flash threshold + low-time threshold drive the color pulse). Boundary prompt = full-screen warning with a 5-second digital subtitle when you stray into `prelive_main_base`, `enemy_main_base_buffer`, or `ground_combat_zone`. Worth re-adding to the player copy if the audience needs the full HUD inventory.
- Color contract (locked, CF-13): friendly = left + blue, enemy = right + red. Chevron color inversion (Wave 6): bleeding-team chevrons render in the *opposite* color on each ticket bar (left chevrons on blue bar = red, right chevrons on red bar = blue) for contrast post-shadow-removal.
- Render policy: dirty-flag gated. `updateConquestCombatHudForAllPlayers` only re-renders when `State.conquest.debug.hudDirty || force`. Every state mutation that affects the HUD must call `markHudDirty()` (see AGENTS.md "Combat HUD Dirty-Flag Contract").
- Top-HUD derived-slice refresh and animation tick are NOT gated — clock and animation lerps run every subtick.
- Per-PID widget caching: every cached widget name carries `_${pid}` via `wn(name, pid)` to avoid namespace collisions; widgets are owned by individual players via `playerId` in the safeParseUI calls.
- Wave 5 (v1.439): every non-master-clock countdown converted to a 10-decile chunk progress bar. Pattern: `mod.SetUIWidgetSize` integer-pixel fill updates gated by a per-decile diff cache, so updates fire ~10x per countdown regardless of duration. Status modes ("READY", "ACTIVE", "SPAWNING", "DEPLOYING") render as text via `setReusableTimerStatus` alongside the bar.
- Wave 6 (v1.443): combat HUD shadow-ring layers eliminated via the helper-short-circuit pattern — ~280 widget refs reclaimed per pid, ~75% combat HUD size reduction. Bleed chevron colors inverted to compensate for the lost shadow-halo contrast.
- Lazy-build entry: combat HUD builds via `triggerLazyBuild('combatHud', pid)` on first deploy event. Vehicle deploy timer HUD via `triggerLazyBuild('vehicleDeployTimer', pid)` on first deploy menu open. Top HUD shell via `triggerLazyBuild('topHudShell', pid)` immediately on join.
- Stagger-on-join (v1.443): `topHudShell` immediate, `vehicleDeployTimer` +50ms, `combatHud` +150ms — distributes the join cost across 3 frames.
- Boundary prompt LIVE-batched prebuild (Wave 3.6): at LIVE transition, sweeps player set in 10 batches over 10 seconds so the build cost doesn't all land on frame 0.
- Boundary kinds rendered: `prelive_main_base`, `enemy_main_base_buffer`, `ground_combat_zone`. 5-second digital subtitle stays digital (literal number reads better).

### Victory Panel — Detail

- Source: [`src/ui/dialog/victory-build.ts`](../src/ui/dialog/victory-build.ts) (build), [`src/ui/dialog/victory.ts`](../src/ui/dialog/victory.ts) (update / per-tick refresh), with end-snapshot in [`src/state/runtime.ts`](../src/state/runtime.ts) under `State.conquest.endRace.endSnapshot`.
- Lifecycle: built as part of the top-HUD shell `triggerLazyBuild('topHudShell', pid)` chain so it's ready at match end; visibility flipped via `State.match.victoryDialogActive`.
- End-latch atomicity (CF-101 / CF-110): once `endLatched = true`, no further ticket drains, spawn-charge deductions, or KPI mutations. Victory panel renders from the frozen `endSnapshot`, not live state.
- Snapshot fields: `winnerTeam`, `team1Tickets`, `team2Tickets`, plus elapsed-time clock from `State.match.endElapsedSecondsSnapshot`.
- Mandatory display fields (CF-16): winner + final tickets, elapsed time, admin actions used (if any), per-player kills/deaths/captures/assists, team averages from scoreboard columns.
- KPI scoring formula (CF-38): `score = kills × 100 + assists × 50 + captures × 300 + revives × 50 − deaths × 0`. Sort: score (desc), KDR (desc), assists (desc).
- KDR display (CF-39 / CF-79 / CF-83): floored to one decimal. Deaths = 0 with kills > 0 → display "infinity"; internal sort uses raw `kills`.
- Roster: `getRosterDisplayEntries()` returns `team1`, `team2`, `maxRows` — the dialog auto-resizes via `updateVictoryDialogRosterSizing` to fit the visible row count without leaving gaps.
- Restart countdown: `MATCH_END_DELAY_SECONDS` (currently 30) — `victoryRestartText` updated once per second with a clamp to 0 to avoid the engine-quirk wraparound at 0.
- The 30-second window is sized for **TWL competitive use** — captains screenshot the result for league recording, per the player-facing copy. If the competitive use case ever changes, this constant is the dial to tune (faster turnaround for casual play, longer for tournament arbitration).
- Admin-actions line: only visible when `State.admin.actionCount > 0`; rendered in `COLOR_WARNING_YELLOW`.
- Result text: green (`mod.CreateVector(0, 1, 0)`) for win; red (`mod.CreateVector(1, 0, 0)`) for draw.
- "Victory screen XvY settings unification" (Issue #86 / CQ_Feat_Victory_Screen_Unify_Settings) is open — settings line currently diverges across round-end / admin / HQ panels.

---

## Open consistency notes

Items where the player-facing copy makes a claim that doesn't match what's currently in the source. Fix one side or the other to converge.

1. **Purple smoke gating in Vanilla mode.** Player copy under [Custom Dialogs / UI Interfaces](#custom-dialogs--ui-interfaces) says the purple smoke appears *"if HQ, Air or Forward Deploy is enabled"*. Source today does NOT gate the purple-smoke VFX or its InteractPoint on the deploy mode — purple smokes are hard-coded as map-config entries (verified at [`src/config/maps/operation-firestorm.ts`](../src/config/maps/operation-firestorm.ts) odd objIds 1001, 1003, 1005…). In pure Vanilla mode the menu still opens but contains no SPAWN buttons. **Resolve by either:** (a) shipping a `disableInVanilla` flag on the purple-smoke anchors mirroring the existing `disableOnLive` pattern, or (b) softening the player-facing wording to drop the conditional.

2. **Issue #113 status (console deploy-screen SPAWN buttons).** The Vehicle Deploy exhaustive detail in this doc says #113 is **resolved at v1.466**. The player-facing known-issues doc ([`conquest_player_know_issues_documentation.md`](./conquest_player_know_issues_documentation.md)) and the internal tracking ([`conquest_issues.md`](./conquest_issues.md), [`conquest_issues_summary.md`](./conquest_issues_summary.md)) still list #113 as **Open**. If the v1.466 fix is in place and verified, close #113 in all three docs. If still observable on console, revert this doc's claim to "in progress" and keep the workaround note.

3. **"APPLY CONFIGURATION" button label.** V2 player copy renders the button as **APPLY CONFIGURATION** (all caps, bolded) which matches the actual button text per [`src/strings.json`](../src/strings.json) `"confirmSettingsLabel"`. Resolved at the V1→V2 cutover.

4. *(Resolved at V1→V2 cutover)* Triple-tap "while standing still" wording was loose in V1; V2 says *"Triple-tap E from on-foot does the same thing"* which matches the source-side requirement (on-ground + on-foot via `spawnReadyDialogInteractPoint`'s `IsOnGround` poll).

---

## V1 archive (player-facing copy, superseded)

The pre-V2 player-facing copy, kept here for reference. Side-by-side comparison and design rationale for the V1→V2 simplification live in [`conquest_player_design_documentation_features_v2_comparison.md`](./conquest_player_design_documentation_features_v2_comparison.md).

### V1 — Custom Dialogs / Interfaces

Colored smokes mark every static interactive menu in the game; interact with them to open dialogs.

- **Green smoke** → (main base) Ready Up and Team Switcher 
   - You can also get to these with a triple-tap of the interact button while standing still on foot
   - If you're admin - this also enables configuration of the mode
- **Purple smoke** → (main base) Vehicle Redeploy menu (if HQ, Air or Forward Deploy is enabled)
- **Yellow smoke** → Supply Box. Active during Live around every captured objective; pre-game only at HQ as a loadout preview

Color helps with finding each dialog. Both main bases carry a green and purple smoke pair near player spawners - so ready-up and vehicle deploy are always steps away. The yellow Supply Boxes are in the field, near capture points and accessible during the Live game; the yellow smoke at HQ are just for pre-game previews.

### V1 — Game Match Flow

A match runs through four stages — pre-game configuration, tuning & ready-up, a live 3-2-1 countdown, then live gameplay

- **Pre-game:** the admin tunes vehicles and deploy modes; everyone else can spawn, drive, walk around the HQ, and preview gadgets at the HQ Supply Box
- **Ready Up:** each player clicks READY; the match auto-starts once enough players are ready on both sides
- **Countdown:** 3-2-1 final countdown in the deploy screen
- **Live:** victory is triggered either on 0 tickets or clock end

First is a pre-game for setup and configuration. The admin uses the configuration dialog to dial in vehicles, deploy modes, and player counts, while everyone else can spawn into the map, test vehicle loadouts, and use the yellow HQ Supply Box to preview gadget tuning. When players hit READY and the minimum-per-side threshold is met, a 3-2-1 countdown locks settings and forces every player to the deploy screen. Live phase activates capture points, ticket bleed, and the Supply Boxes in the field; the round ends when one team hits 0 tickets or the clock expires. Draws are possible if tickets end at the same number.

### V1 — Player Ready Up Panel

Non-admin players get a dialog showing who the admin is, your ready status and capability to team switch

- Opens from any of the green smokes at your main base
- CLAIM ADMIN appears top-right when the admin slot is vacant
- Shows the current admin (or "No Admin"), and your ready status
- Switch teams is always available from this dialog, even when live

Every player starts here at this dialog. CHANGE TEAMS hides the panel and re-deploys you on the other side; READY toggles your status and updates the global "X / Y ready" counter. If the admin disconnects or hands off the slot, CLAIM ADMIN appears for everyone — there's no auto-promotion, the slot stays empty until somebody actively claims it.

### V1 — Configurations / Admin Ready Up Panel

The match's admin can pre-pick which tanks, jets, helis, and transports each team gets — and toggle deploy modes — right from the Ready Up dialog before the round starts.

- TWL presets are seeded at the top (e.g. 12v12 Conquest)
- If teams choose, they can customize beyond these presets by choosing what individual vehicles are deployed.
- Center checkboxes pick the deploy modes available: Vanilla / HQ / Air / Forward / Supply Boxes
- Unsaved changes show in red. Click on 'Apply Configuration" to commit changes
- Only the Admin sees this panel - claiming admin grants permission to do this

The Vehicle Configurations grid is the host's pre-match control panel. They cycle through tank, jet, heli, and transport options per team using left/right arrows on each row, then pick the deploy methods and whether Supply Boxes are on. Picking a Game Mode preset auto-loads its defaults; manual changes flip the mode to "Custom" so you always know whether you're on a known approved template. Once confirmed, this syncs every spawner to the new vehicle types.

### V1 — Vehicle Deploy Modes

The Vehicle Deploy menu is your one-stop shop for vehicles — open it from the deploy screen or the purple smoke at HQ. 

- Opens automatically on the deploy screen, or accessible from the purple smoke at HQs
- Admin picks the available respawn modes for vehicles: 
   - **Vanilla** (auto-spawn cycle, just like a public server - walk up to it)
   - **HQ Deploy** (teleport spawn player into it at HQ + auto-seat)
      - **Forward Deploy** (ground vehicles dropped at a tuned/randomized forward point)
      - **Air Deploy** (aircraft dropped airborne in your team's air zone)
- Voluntary deploys don't cost a ticket or count as a death.

The design philosophy here is built around preventing the capability to camp - if the enemy cannot predict when or where the vehicles spawn, it creates more chances for real combat to occur instead of pad camping. The Vehicle Deploy menu is the shared front-end for all four deploy modes. **Vanilla** is classic Battlefield. If Vanilla is not enabled, HQ Deploy is automatically enabled. **HQ Deploy** flips the classic behavior — nothing auto-spawns, but each player can request a vehicle on demand and is force-seated inside the moment it spawns at HQ. Forward and Air Deploys are extensions of the HQ Deploy functionality. **Forward Deploy** mirrors the behavior for ground vehicles, but pushes them up to a tuned randomized forward point closer to the action; **Air Deploy** mirrors it for jets and helis but they're dropped airborne in your team's sky zone in a tuned randomzied range.

### V1 — Supply Box Gadgets

Indicated by Yellow Smoke - walk up to a Supply Box and resupply or swap class specific gadgets. 

- Interact with them during a Live match to access rare/exclusive gadgets or resupply launcher ammo.
- Gadgets are tuned around 'Per-team charges' & 'Per-player cooldowns'
- Buttons dim when they're on cooldown - timers show when they're usable again
- Choose which gadget slot is utilized at the top
- Supply Boxes will be tuned per map, so check them out pre-game in the HQ

The Supply Box is a gadget vending machine; it's class-aware and locked to your current choice. Each button has a name, a duration / scope hint ("1 per player", "5m cooldown", "1 per team"), and a live timer when it's on cooldown. Cooldowns are persisted per player (and per team for shared items), so closing and re-opening the menu or accessing a different supply box doesn't reset them.

### V1 — Conquest HUD & UI

The on-screen HUD that shows tickets, match clock, capture progress, bleed indicators, vehicle deploy timers, and the team's ticket

- Top ticket bar: friendly left/blue, enemy right/red; chevrons show bleed rate.
- Mid-screen: capture-point progress, contested indicators and callouts.
- Vehicle availability: shows friendly HQ vehicle statuses with WAIT / READY / ACTIVE indicators
- Crown shows current team in the lead if the match were to end

The combat HUD is very similar to Vanilla BF6: friendly is always on the left in blue and enemy is always on the right in red - both locked in place so you never have to think about which side is yours. Capture-point progress bars show contested statuses and how many players are on a flag. The bleed chevrons appear on the losing team's ticket bar when an objective differential is active. Vehicle deploy timer rows show spawn progress in 10% chunks.

### V1 — End Match Victory Panel

When the match ends, every player gets a results scoreboard showing the winning team, final ticket counts, match length, and a 30-second countdown to the next round.

- Crown icon over the winning team; final ticket counts in big digits.
- Both team rosters and match length displayed.
- "Screenshot now" prompt — the panel sticks for 30 seconds to ensure results can be collected by captains.
- Admin action count appears (yellow) only if any admin actions were used.

The Victory Panel is the round wrap-up. Tickets are frozen, the winning team gets a crown, the result line spells out the win margin or "Draw" if it's tied, and both team rosters are displayed. The countdown shows when the next round will reset; the panel survives for the full 30 seconds so everyone has time to screenshot and read it. A yellow admin-actions line appears only when the admin actually used test buttons or special config tools during the match.
