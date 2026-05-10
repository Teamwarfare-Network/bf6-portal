# spec_cam_integration

Integration analysis for adding **a single spectator slot** driven from the existing Spectate / Coach button.

Companion to [spec_cam_functionality.md](./spec_cam_functionality.md) (PCT toolkit teardown).

**Scope:** one spectator at a time. The spectator clicks the existing Coach button, gets marked ready, and switches to a Godot-placed FixedCamera view. No path/free/preset modes — just "see the match from a placed camera." No in-world interactable.

**Status: Analysis only. No code changes.**

---

## 1. Goal Recap

> "Clicking the coach/spec button turns that player into a spectator (a 'director' in PCT terms). That player is marked as ready when doing so. I don't need any extra functionality besides a single person spectating."

Concretely the contract is:

| Behavior | Expected |
|---|---|
| Coach button active when slot is vacant | Yes — currently disabled with `mod.SetUIButtonEnabled(false)`. Must be re-enabled. |
| Click → become spectator | Yes — switch camera, lock body off-grid, exit ready dialog UI. |
| Spectator marked ready | Yes — `State.players.readyByPid[pid] = true`. |
| Spectator does not block match start | Yes — must be excluded from `areAllActivePlayersReady()` gating. |
| Single-slot only | Yes — second-clicker either gets the button greyed (slot taken) or a no-op. |
| No in-world interactable to enable | Confirmed — we use the panel/dialog button only. |
| Godot-placed camera is fine | Confirmed — same pattern PCT uses. |

Out of scope for this integration:

- Multiple simultaneous spectators.
- Player-target tracking, free-fly camera, path cam, presets.
- Switching between multiple Godot cameras during a match.
- A toggle to leave spectator mid-match (we should still handle "what happens on match end / disconnect" — see §6).

---

## 2. The Coach Button — What Exists Today

The button exists in **two places** because we have two ready surfaces:

### 2.1 Player Ready Up Panel (non-admin viewers)

[src/ready-dialog/player-ready-panel.ts:211-237](../src/ready-dialog/player-ready-panel.ts#L211)

Built lazily on first triple-tap by non-admin players. The COACH button is the third of four bottom buttons (SWAP / READY / **COACH** / CLOSE), 140×72 px each.

Today's treatment is "static disabled":

```ts
// player-ready-panel.ts:225-237
mod.SetUIButtonEnabled(coachButton, false);
mod.SetUIWidgetBgColor(coachButton, COLOR_GRAY_DARK);
mod.SetUIWidgetBgAlpha(coachButton, 0.45);
// + border + label color → COLOR_GRAY
```

Widget IDs (pid-suffixed):

```ts
UI_PLAYER_READY_PANEL_BUTTON_COACH_ID + pid
UI_PLAYER_READY_PANEL_BUTTON_COACH_ID + pid + "_BORDER"
UI_PLAYER_READY_PANEL_BUTTON_COACH_LABEL_ID + pid
```

Click router currently claims the event but does nothing:

```ts
// src/interaction/ui-events-player-ready-panel.ts:116-118
if (widgetName === UI_PLAYER_READY_PANEL_BUTTON_COACH_ID + playerId) {
    return true;
}
```

### 2.2 Full Ready Dialog (admin viewer)

[src/ready-dialog/dialog-build-sections.ts:206-238](../src/ready-dialog/dialog-build-sections.ts#L206) — same disabled treatment, same widget-id pattern (`UI_READY_DIALOG_BUTTON_COACH_ID + pid`).

The router for the full ready dialog is [src/interaction/ui-events-ready.ts](../src/interaction/ui-events-ready.ts) (`tryHandleReadyDialogButtonEvent`). It does not currently match the COACH widget at all — clicks fall through into the no-op default.

### 2.3 String

`mod.stringkeys.twl.readyDialog.buttons.spectateCoach` → `"SPECTATE / COACH"` ([strings.json:251](../src/strings.json#L251)).

### 2.4 Conclusion

The button is present but is a "planned slot" only. Wiring it up is the integration work — the visual and widget-id scaffolding is already correct. **No string changes are needed**, which keeps us out of the String Change Authorization Policy (AGENTS.md §"String Change Authorization").

---

## 3. Camera API Validity Check

Validated against the SDK source-of-truth and the local API reference per AGENTS.md "API Validity Rules" §1.

### 3.1 Camera + view APIs

| Symbol | reference_bf6_core | reference_sdk_1.2.3 | Verdict |
|---|---|---|---|
| `mod.Cameras.FirstPerson` | listed | listed | Valid |
| `mod.Cameras.Free` | listed | listed (value 2) | Valid |
| `mod.Cameras.ThirdPerson` | listed | listed (value 3) | Valid |
| `mod.Cameras.Fixed` | **NOT listed** | listed (value 1) | **Valid but doc gap.** |
| `mod.GetFixedCamera(n)` | not in `00-functions-index.md` | [index.d.ts:27605](../reference_sdk_1.2.3/code/types/mod/index.d.ts#L27605) → opaque `FixedCamera` | **Valid; doc gap.** |
| `mod.SetCameraTypeForPlayer(player, cam, idx?)` | listed (3-arg overload) | [index.d.ts:26304-26307](../reference_sdk_1.2.3/code/types/mod/index.d.ts#L26304) | Valid |
| `mod.SetCameraTypeForAll(cam, idx?)` | listed | [index.d.ts:26298-26301](../reference_sdk_1.2.3/code/types/mod/index.d.ts#L26298) | Valid (not used by our flow — global). |
| `mod.SetObjectTransform(obj, transform)` | listed | listed | Valid |
| `mod.UndeployPlayer(player)` | listed | listed | Valid |
| `mod.UndeployAllPlayers()` | listed | [index.d.ts:26400](../reference_sdk_1.2.3/code/types/mod/index.d.ts#L26400) | Valid (not used — bulk undeploy). |
| `mod.DeployPlayer(player)` | listed | [index.d.ts:26587](../reference_sdk_1.2.3/code/types/mod/index.d.ts#L26587) | Valid (force-deploy, useful for I-4 mitigation C). |
| `mod.SpawnPlayerFromSpawnPoint(player, id)` | listed | [index.d.ts:26593](../reference_sdk_1.2.3/code/types/mod/index.d.ts#L26593) | Valid (force-deploy at specific spawn point). |
| `mod.Teleport(player, vec, rad)` | listed | [index.d.ts:26602](../reference_sdk_1.2.3/code/types/mod/index.d.ts#L26602) | Valid |
| `mod.SetRedeployTime(player, sec)` | listed | [index.d.ts:26397](../reference_sdk_1.2.3/code/types/mod/index.d.ts#L26397) | Valid (already used in conquest at deploy time). |
| `mod.EnableInputRestriction(player, kind, bool)` | listed | listed | Valid |
| `mod.EnableAllInputRestrictions(player, bool)` | listed | [index.d.ts:26608](../reference_sdk_1.2.3/code/types/mod/index.d.ts#L26608) | Valid |
| `mod.RestrictedInputs.*` | listed | [index.d.ts:448-470](../reference_sdk_1.2.3/code/types/mod/index.d.ts#L448) | Valid (CameraPitch, CameraYaw, Crouch, CycleFire, CyclePrimary, FireWeapon, Interact, Jump, MoveForwardBack, MoveLeftRight, Prone, Reload, Select{Character/Melee/OpenGadget/Primary/Secondary/Throwable}Gadget, Sprint, Zoom). |
| `mod.SetTeam(player, team)` | listed | listed | **Valid; arity = `Team` opaque (see I-2).** |

### 3.2 Engine spectator system (newly identified — not in our previous analysis)

The SDK 1.2.3 has a built-in spectator system that I missed on the first pass. Documenting it here so we can decide whether to use it or work around it.

| Symbol | Location | Behavior |
|---|---|---|
| `mod.SpawnModes.Spectating` | [index.d.ts:25369-25373](../reference_sdk_1.2.3/code/types/mod/index.d.ts#L25369) — `enum SpawnModes { AutoSpawn, Deploy, Spectating }` | Enum value. |
| `mod.SetSpawnMode(spawnModes)` | [index.d.ts:26590](../reference_sdk_1.2.3/code/types/mod/index.d.ts#L26590) — comment: *"Determines if players are spawned automatically or not."* | **Global, not per-player.** Setting `Spectating` puts the entire mode into spectator behavior. |
| `mod.SpectatingGroup` | [index.d.ts:25374-25378](../reference_sdk_1.2.3/code/types/mod/index.d.ts#L25374) — `enum SpectatingGroup { All, Squad, Team }` | Enum for the next two functions. |
| `mod.SetSpectatingFiltersForAll(group, ownSquadOnly, ownTeamOnly)` | [index.d.ts:26310](../reference_sdk_1.2.3/code/types/mod/index.d.ts#L26310) — comment: *"Sets the spectating filters. SpectatingGroup sets the selectable players in the spectating UI. ownSquadOnly and ownTeamOnly limit whether a player can spectate other squads/teams after currently spectated one is eliminated."* | Engine-side filter for which players appear in the spectator UI. |
| `mod.SetSpectatingFiltersForPlayer(player, group, ownSquadOnly, ownTeamOnly)` | [index.d.ts:26317](../reference_sdk_1.2.3/code/types/mod/index.d.ts#L26317) | Per-player variant. |

**Implications for our design:**

- **`SpawnModes.Spectating` is mode-wide, not per-player.** Setting it would put EVERY player into spectator behavior, which is the opposite of what we want (single spectator inside a normal Conquest match). **Not usable for our case.**
- **`SetSpectatingFiltersForPlayer` exists** — implies the engine has a built-in spectator UI (presumably a player-cycling overlay) that we may or may not see when our spectator is undeployed. We don't know how this UI gates on / off — see new Issue I-12 below.
- **`DeployPlayer(player)` and `SpawnPlayerFromSpawnPoint(player, id)`** are useful for I-4 mitigation (C) — if we choose to keep the spectator deployed, we can use these to force a clean spawn at a known location (the team's main base or a Godot SpawnPoint near the spectator camera).
- **No per-player `SetPlayerSpawnMode` exists.** There is no clean engine-level way to put one player into spectator mode while leaving others alone.

> **Conclusion:** the new APIs do NOT change our recommended approach (Godot Fixed camera + per-pid camera-type swap). They DO add a new question (I-12) about engine spectator UI interference, and they give us better tools for the I-4 mitigation (C) deploy-at-base path.

### 3.3 Action item

The analysis treats `mod.Cameras.Fixed` and `mod.GetFixedCamera()` as available based on the SDK definitions. They are not in the auto-generated reference_bf6_core index, but the SDK 1.2.3 source clearly shows them. Before any implementation we should sanity-test these with a tiny in-game probe to confirm the runtime accepts them. Mark as "verified-by-SDK, unverified-at-runtime."

---

## 4. Existing Systems This Touches

Each of the following is currently authoritative for some aspect of the player lifecycle. The spectator flow has to coexist with all of them.

### 4.1 Active-player roster gate

[src/ready-dialog/roster-active.ts:45-80](../src/ready-dialog/roster-active.ts#L45) — `getActivePlayers()` returns only players whose team is `TeamID.Team1` or `TeamID.Team2`.

[src/ready-dialog/roster-active.ts:105-134](../src/ready-dialog/roster-active.ts#L105) — `areAllActivePlayersReady()` **only checks team1/team2 members**, with one fallback: when `activeCount === 0` (i.e. no one has been assigned a team yet — pre-deploy team 0), it walks `mod.AllPlayers()` and requires all valid pids to be ready.

This is the load-bearing detail for the spectator design: **if we move the spectator off Team1/Team2, they're auto-excluded from the ready gate.** No special `if (isSpectator) skip` carve-out is needed.

### 4.2 Boundary / OOB enforcement

[src/boundary/enforcement.ts](../src/boundary/enforcement.ts) — `getDesiredBoundaryViolationKind` early-returns `undefined` on three conditions checked in order ([enforcement.ts:223-227](../src/boundary/enforcement.ts#L223)):

```ts
if (!isPlayerDeployed(player)) return undefined;
if (!isPlayerAliveForBoundary(player)) return undefined;
if (State.match.isEnded) return undefined;
```

The first check is a hard guard against undeployed players triggering OOB — i.e. **a player on the deploy screen will not be killed for being "out of bounds."** A spectator parked off the map (or on a Godot camera object far from any combat zone) will not fire boundary violations **provided we keep them undeployed**.

Additionally, `state.inOwnHQ`, `state.inEnemyHQ`, etc. all default `false` and only get flipped by `OnPlayerEnter/ExitAreaTrigger`. If the spectator never crosses a boundary trigger volume, no zone state ever flips — even if we kept them deployed. (Note we are **not** going to keep them deployed; the safe design is undeployed.)

### 4.3 Vehicle slot ownership

[src/index/vehicle-events.ts](../src/index/vehicle-events.ts) and [src/state/runtime-types.ts:23-42](../src/state/runtime-types.ts#L23) — `VehicleSpawnerSlot.activeOwnerPid` is set on `OnPlayerEnterVehicle` and cleared on exit / undeploy / leave. A spectator cannot own a vehicle slot because they're undeployed; the existing cleanup paths in `onPlayerUndeployImpl` and `onPlayerLeaveGameImpl` already null the owner if a stale claim exists.

### 4.4 Ready-dialog interact point

[src/index/player-deploy.ts:73](../src/index/player-deploy.ts#L73) — `spawnReadyDialogInteractPoint(eventPlayer)` is called on every deploy. A spectator is not deployed, so no interact point is spawned. The triple-tap path that opens the panel is also gated on `OngoingPlayer` running with `isPlayerDeployed`. Spectators don't get a triple-tap option to re-open anything — which is exactly what we want for "single spectator, no extras."

### 4.5 KPI tracking

[src/state/runtime-types.ts:434-442](../src/state/runtime-types.ts#L434) — `State.players.kpiByPid[pid]` exists per pid; populated by `onPlayerEarnedKill / Assist`. A spectator never deals damage and never dies, so the KPI row stays at zeros / undefined and is harmless. The scoreboard (`scoreboardSyncTick`) iterates active deployed players and ignores undeployed/no-team pids in practice (all-zero rows would just appear under whichever team they're nominally on).

### 4.6 HUD rendering

[src/hud/conquest-scaffold.ts](../src/hud/conquest-scaffold.ts) and the `twlConquestHud*` family. Combat HUD ticks gated on `isHudWarmReadyForPid && !isHudSwapTransitionActive && isCombatHudRevealAllowed` and on a successful `twlConquestHudEnsurePlayerGraph`. A spectator who never deploys won't have `combatHudGenerationByPid` initialized via the deploy path; the HUD will simply not show their combat overlay. Top-HUD (clock, ready line, etc.) is built on join via the lazy-build cohort and is independent of deploy state — it would still render for the spectator. **This is desirable** — they should see the match clock, ticket count, etc.

### 4.7 Per-pid widget destruction on leave

[src/index/player-join-leave.ts:161-219](../src/index/player-join-leave.ts#L161) — `onPlayerLeaveGameImpl` is exhaustive and tears down everything by pid. Whatever spectator-only state we add must be added to that function's cleanup list.

### 4.8 Game-mode loop cadence

[src/index/game-mode.ts:120-180](../src/index/game-mode.ts#L120) — runs at ~120 ms cadence (the Wave 4-era v1.087 figure cited in `OngoingGlobal` comments). One-second-boundary work runs at 1 Hz. Per-pid per-tick work goes through `OngoingPlayer` (~30 Hz, engine-driven) but only if `isPlayerDeployed`.

If we want the camera to follow a Godot-placed *static* camera, we don't need any per-tick loop at all — Portal will hold the FixedCamera object's transform constant indefinitely once `mod.SetCameraTypeForPlayer(spec, Cameras.Fixed, id)` is called. **This is the headline performance win versus PCT, which is a per-tick math furnace.**

---

## 5. Recommended Integration Path

This is the simplest viable design that satisfies the constraints. Alternatives are listed in §5.5.

### 5.1 State

Add one new field to `State.players`:

```ts
// in state/runtime-types.ts → GameState.players
spectatorPid: number | null   // single-slot, null when vacant
```

Mirrors the `Admin._currentAdminPid` pattern (a single nullable scalar, not a map). One pid is the canonical spectator; everything else derives from it.

`State.players.readyByPid[spectatorPid]` is set to `true` on entry and stays that way. No special "spectator-ready" flag — they go through the normal ready bookkeeping.

### 5.2 Map-config: Godot Fixed Camera ID

Add a new field to `MapConfig` for the spectator-camera objId, similar to how `mainBaseTriggerIdTeam1/2` and `groundCombatZoneTriggerId` are already declared. One per map. Resolved at game-mode start via `mod.GetFixedCamera(id)` and cached in a module-level `let _spectatorCameraObject: mod.FixedCamera | null = null`.

If a map ships without the field (or the lookup fails), the COACH button should stay disabled on that map. Fallback is "no spectator slot on this map" rather than crashing.

### 5.3 Click handler (`enterSpectatorMode`)

New handler in a new file (per AGENTS.md §"Code Placement"): `src/spectator/spectator-action.ts`. Public function `enterSpectatorMode(eventPlayer, pid)`:

1. Bail if `_spectatorCameraObject === null` (map has no camera).
2. Bail if `State.players.spectatorPid !== null && State.players.spectatorPid !== pid` (slot taken).
3. Bail if `isMatchLive()` — config-locked, see Issue I-3.
4. Set `State.players.spectatorPid = pid`.
5. Set `State.players.readyByPid[pid] = true` (mirror of `handleReadyDialogReadyButtonClick` ready path).
6. Move the player off Team1/Team2 (see §5.6 for the team-assignment question).
7. `mod.UndeployPlayer(eventPlayer)` — they fall back to the deploy screen.
8. `mod.SetCameraTypeForPlayer(eventPlayer, mod.Cameras.Fixed, _spectatorCameraId)` to attach their view to the Godot camera.
9. Hide their panel + restore cursor (`closePlayerReadyPanelForViewer`-equivalent).
10. Cleanup combat HUD: `twlConquestHudDestroyPlayer(pid)` + `delete State.conquest.capture.engagedObjIdByPid[pid]` + `markHudDirty()`.
11. Refresh other panels' COACH button visibility: every other player's Coach button should now read "SLOT TAKEN" disabled OR stay greyed-out — see §6 Issue I-1.
12. World-log notification: `"{Player} is now spectating"` — **requires a new string key**, which means human approval per AGENTS.md "String Change Authorization" before that line ships.
13. `tryAutoStartMatchIfAllReady(eventPlayer)` — same call path as ready-button.

### 5.4 Click router wiring

Two router files to touch:

- [src/interaction/ui-events-player-ready-panel.ts:116-118](../src/interaction/ui-events-player-ready-panel.ts#L116) — replace the no-op claim with a delegated call to `enterSpectatorMode(eventPlayer, playerId)` via `tryHandlePlayerReadyPanelPrimaryAction(...)`. Pattern matches the existing READY/SWAP/CLOSE branches — fully orthogonal, debounced via the existing primary-click tracker.
- [src/interaction/ui-events-ready.ts](../src/interaction/ui-events-ready.ts) — add a parallel match for `UI_READY_DIALOG_BUTTON_COACH_ID + playerId` so the admin's full ready dialog wires the same handler. Uses `tryHandleReadyDialogPrimaryAction(...)`.

Both routers must enable the button in their respective build paths. Currently `dialog-build-sections.ts:228` and `player-ready-panel.ts:226` call `mod.SetUIButtonEnabled(coachButton, false)`. The replacement is a `syncCoachButtonForPid(pid)` style helper modeled on `syncPlayerReadyPanelClaimAdminButtonForPid` ([player-ready-panel.ts:337-361](../src/ready-dialog/player-ready-panel.ts#L337)) — flips enabled / colors based on:

| Slot state | Match state | COACH button |
|---|---|---|
| Vacant or owned by viewer | Pre-live | Enabled, white treatment |
| Vacant | Live | Disabled, grey treatment (config locked) |
| Taken by other viewer | Pre-live or live | Disabled, grey treatment |

### 5.5 Alternative paths considered (and why not picked)

**A. Use a custom "free cam" loop (PCT-style).** Far more code, per-tick `mod.SetObjectTransform` overhead, hidden control room, raycasts. Out of scope; user explicitly said no extra functionality.

**B. Don't undeploy — keep them deployed somewhere safe.** Bad: requires the boundary system to know about a "spectator-exempt" pid, requires the HQ trigger to leave them alone, opens the door to OOB false positives. Far more invariants to violate.

**C. Move them to a real spectator team.** Best if Portal supports it (see §6 Issue I-2). The team enum could plausibly accept `mod.GetTeam(0)` (the neutral/observer team); needs probe.

### 5.6 Team-assignment question (decision needed)

`getActivePlayers()` filters on `getTeamNumber(mod.GetTeam(p)) === Team1 || === Team2`. Anything else → excluded. Three options:

1. **`mod.SetTeam(player, mod.GetTeam(0))`** — assign to team 0 (neutral). Clean if Portal accepts it. Risk: untested in this codebase; engine may reject or silently no-op.
2. **`mod.SetTeam(player, mod.GetTeam(3))`** or higher — explicit spectator team. Same risk; if it works, it's the most semantically correct.
3. **Leave them on Team1/Team2 and add an `isSpectatorByPid` filter in `getActivePlayers()`.** Avoids any team-API risk. Adds one boolean check to the per-call active-roster build.

**Recommendation: try option (3) first.** It's the lowest-risk, fully-script-side solution. The only cost is editing `getActivePlayers` and `areAllActivePlayersReady` to skip the spectator pid. Roster UI still shows the spectator on their team, which is fine — they're a coach for that team anyway.

If team-assignment becomes desirable later (e.g. for engine scoreboard display), option (1) or (2) can be tested in isolation.

---

## 6. Issues Itemized

Each issue has an ID `I-N`, a severity (Blocking / Important / Watch), a brief description, and a mitigation.

### I-1 — Coach button state must broadcast across viewers (Important)

When player A enters spectator mode, every other player's panel/dialog needs their COACH button to flip to "SLOT TAKEN" disabled treatment. Without this, player B clicks COACH after A took the slot → silent rejection in `enterSpectatorMode` step 2. Confusing UX.

**Mitigation:** mirror the `refreshAllVisiblePlayerReadyPanels()` broadcast pattern ([player-ready-panel.ts:372-378](../src/ready-dialog/player-ready-panel.ts#L372)) on every spectator state transition (claim + release). Add a `syncCoachButtonForPid(pid)` sibling to the existing `syncPlayerReadyPanelClaimAdminButtonForPid` and call it from the broadcast loop.

### I-2 — `mod.SetTeam(player, mod.GetTeam(0 | 3))` runtime acceptance is unverified (Watch)

The local API reference does not show a test matrix for non-`Team1/Team2` arguments to `mod.SetTeam`. We don't know whether the engine accepts an "observer" team assignment.

**Mitigation:** §5.6 recommends NOT touching `SetTeam` at all and instead filtering in `getActivePlayers`. Defers the question.

### I-3 — Mid-match spectator entry could break ticket parity (Important)

If a deployed player on Team1 (with kills, captures, etc.) hits COACH during a live match, the team loses a body. Conquest ticket flow assumes both teams stay at the configured size. Specifically, `tryUpdateBleedFromCounts` ([capture-tickets.ts](../src/index/capture-tickets.ts)) does not know about spectator carve-outs.

**Mitigation:** match the existing CLAIM-ADMIN-while-live policy ([player-ready-panel.ts:347-353](../src/ready-dialog/player-ready-panel.ts#L347)) — disable the COACH button entirely while `isMatchLive()`. Spectator mode is a pre-match-only commitment.

### I-4 — Spectator on the deploy screen sees the deploy menu instead of the camera (Blocking)

`mod.UndeployPlayer` puts the player on the deploy screen, where the engine's own deploy UI takes over. Calling `mod.SetCameraTypeForPlayer(player, Cameras.Fixed, id)` while on that screen may not visually swap the camera — the deploy UI's spawn-point preview camera may be authoritative until they actually deploy.

**This is the single biggest unknown in the whole design.** PCT solves the equivalent problem by keeping the director **deployed and parked in a hidden control room**, then `SetCameraTypeForPlayer(..., Fixed, id)`. That works because the player object is in the world, just hidden.

**Mitigation options:**

A. **Test-first:** verify whether `Cameras.Fixed` works on an undeployed player. If yes, we're done — simplest path.

B. **PCT-style hidden body**: spawn a sealed mini-room near the Godot camera (or off-map at high altitude), `mod.Teleport` the spectator there after a forced deploy, lock all input restrictions (`mod.EnableInputRestriction(player, RestrictedInputs.{FireWeapon, Reload, Sprint, Crouch, Prone, Jump, Interact, CycleFire, CyclePrimary, MoveForwardBack, MoveLeftRight, SelectMelee, SelectThrowable, SelectSecondary, SelectPrimary, SelectOpenGadget, SelectCharacterGadget, Zoom, CameraPitch, CameraYaw}, true)` — then `SetCameraTypeForPlayer(..., Fixed, id)`. Heavier but matches a known-working pattern.

C. **Deploy them to a normal spawn point and immediately `SetCameraTypeForPlayer`**: the player body sits at their main base, harmlessly, while their view is the Godot camera. The boundary system needs to know not to OOB them while deployed — this either means the spectator pid is exempted from `getDesiredBoundaryViolationKind` OR they're moved to a team where main-base is automatically in-bounds (which is just their existing team — Team1/Team2 main-base). Adds an `isSpectatorByPid` check in the boundary classifier.

**Recommendation: try (A) first via a quick probe**, fall back to (C) if (A) fails — (C) is mid-weight. Avoid (B) unless both fail; the hidden-room pattern is a lot of mass for a single-feature add.

### I-5 — World-log entry text needs a new string key (Watch)

§5.3 step 12 implies `"{0} is now spectating"`. AGENTS.md "String Change Authorization Policy" requires human approval. This is **not blocking the technical design**, only the implementation handoff. A quieter alternative: omit the world-log message and use the player-ready-up message that already fires on `handleReadyDialogReadyButtonClick`. Spectator mode doesn't *need* its own announcement.

### I-6 — Returning to play (re-deploy) is undefined (Important)

The user said "I do not need any extra functionality besides a single person spectating." Strictly read, that means no exit path mid-match. But:

- **Match end:** the match-end flow ([conquest-flow.ts:84-95](../src/conquest-flow.ts#L84)) should clear `State.players.spectatorPid` and `mod.SetCameraTypeForPlayer(spec, Cameras.FirstPerson)` on the spectator so the victory dialog renders correctly.
- **Disconnect:** `onPlayerLeaveGameImpl` must `delete State.players.spectatorPid` if it equals the leaver's pid, broadcast a refresh, and free the slot. Otherwise the slot is permanently consumed across reconnects.

**Mitigation:** add cleanup hooks at three sites:

1. `onPlayerLeaveGameImpl` ([player-join-leave.ts:161](../src/index/player-join-leave.ts#L161)) — clear if pid matches.
2. `endGameModeForTeamNum` / match-end path ([capture-tickets.ts:1636+](../src/index/capture-tickets.ts#L1636)) — clear + reset camera type for the spectator.
3. `triggerFreshMatchSetup` reset path ([conquest-flow.ts:123](../src/conquest-flow.ts#L123)) — clear so the next match starts vacant.

### I-7 — KPI / scoreboard rows for the spectator (Watch)

The spectator stays on Team1/Team2 (per §5.6 recommendation) and has zeros in `kpiByPid`. The scoreboard renderer iterates active players and would show their name with K/D/A/Score=0/0/0/0. Cosmetically odd but not a bug. If we want them hidden from the scoreboard, the scoreboard iteration in [src/kpi/scoreboard-tab.ts](../src/kpi/scoreboard-tab.ts) needs a single `if (pid === State.players.spectatorPid) continue` skip.

### I-8 — Vehicle slot ownership while spectating (Watch)

If a Team1 player owning a vehicle slot hits COACH, the vehicle is orphaned. The existing `onPlayerUndeployImpl` ([player-deploy.ts:82-90](../src/index/player-deploy.ts#L82)) already clears `slot.activeOwnerPid === pid`, so the in-flight cleanup path is correct. But the vehicle itself stays in the world without an owner — somebody else can hop in. That's fine, it's the existing redeploy behavior. No special handling needed.

### I-9 — Enable-button race vs. lazy build (Watch)

`prebuildPlayerReadyPanelHidden` builds the panel hidden on triple-tap, then `showPlayerReadyPanelForPid` flips visibility. The COACH button's enabled state must be applied in `refreshPlayerReadyPanelContentForPid`, not in `prebuildPlayerReadyPanelHidden` — else the value is frozen at build time and never updates as other viewers claim/release the slot. Mirror the `syncPlayerReadyPanelReadyButtonForPid` ([player-ready-panel.ts:383-407](../src/ready-dialog/player-ready-panel.ts#L383)) pattern, which is called from the refresh path, not the build path.

### I-10 — Boundary state mirror: `inMainBaseByPid` will leak (Watch)

If we use Mitigation (C) of I-4 (deploy them, swap camera), they're alive at their HQ, so `state.inOwnHQ === true` is set by the area-trigger enter event, and `State.players.inMainBaseByPid[pid] === true` ([enforcement.ts:205](../src/boundary/enforcement.ts#L205)). That mirror is consumed by `world-interactables.ts` and `takeoff-gating.ts`, which would interpret the spectator as "in main base" — which is harmless (no one is going to gate on a spectator's takeoff state). But if we change to Mitigation (B) (hidden room), the spectator is teleported away from any zone trigger and their `inMainBaseByPid` would stay false; downstream consumers of that flag don't care about pids without a deploy event, so still benign. **No action needed; flag for awareness.**

### I-11 — `OngoingPlayer` tick won't fire (Informational)

`ongoingPlayerImpl` early-returns on `!isPlayerDeployed`. The spectator gets no per-tick processing — which is the desired performance characteristic. **This is a feature, not an issue.**

### I-12 — Engine-side spectator UI may compete with our Fixed camera (Important — newly identified)

The SDK 1.2.3 exposes `mod.SetSpectatingFiltersForPlayer(player, group, ownSquadOnly, ownTeamOnly)` (see §3.2). Per the SDK doc comment, this *"sets the selectable players in the spectating UI"*. This implies that when a player is in some "spectator state" (probably: dead and not auto-respawning, OR `SetSpawnMode(Spectating)` is set globally), the engine renders its own player-cycling spectator UI on top of their view.

**Unknown:** does this engine UI also render when we put a player on the deploy screen via `mod.UndeployPlayer` and immediately attach them to a Fixed camera via `mod.SetCameraTypeForPlayer(p, Cameras.Fixed, id)`? Three possibilities:

1. **Engine spectator UI does NOT render** because the player is on the deploy screen, not in a "spectating" state. Our Fixed camera takes over cleanly. **Best case.**
2. **Engine spectator UI renders** alongside our Fixed camera, producing a confusing dual-UI mess. We'd need to either suppress it (no clear API to do so — the spectator-filter functions configure it, they don't disable it) or accept the layered UI.
3. **Engine spectator UI hijacks the camera** and our `Cameras.Fixed` swap is overridden until the player is in a deployed state. This collapses to I-4 (mitigation C: deploy-at-base) being the only viable path.

**Mitigation:** add to the runtime probe set (§9.1). Specifically, on the test build:

- Set up a Godot FixedCamera + a deploy-screen-routed player.
- Try `mod.UndeployPlayer(p)` then `mod.SetCameraTypeForPlayer(p, Cameras.Fixed, id)`.
- Observe what the player sees: deploy menu + Fixed view? Spectator UI + Fixed view? Or clean Fixed view?

This is the same probe that resolves I-4 — they're tangled. One playtest answers both.

**Defensive note:** the existing Conquest flow does not call `mod.SetSpawnMode` anywhere (verified via grep). Adding our spectator should also NOT call `SetSpawnMode(Spectating)` because that would put EVERY player into spectator mode (the function is global). Stay away from `SetSpawnMode` entirely; only use the per-player `SetCameraTypeForPlayer` and `SetSpectatingFiltersForPlayer` (the latter only if I-12 probe shows the engine spectator UI is in play and we want to constrain its filters).

---

## 7. Performance Assessment

> **Reconciliation note vs. [spec_cam_functionality.md](./spec_cam_functionality.md).** That document warned that the PCT toolkit "runs ~30 times/sec and does heavy math + occasional `mod.RayCast`" and explicitly flagged it as a per-tick cost worth measuring. **That warning was about PCT specifically — its three camera modes (path / free / preset) all animate the FixedCamera by re-calling `mod.SetObjectTransform` every tick.** Our integration deliberately avoids that pattern: a static Godot-placed camera is set once and held by the engine. The per-tick math furnace is **not** in our design. Costs below are honest about what we DO incur, not "literally zero."

### 7.1 What our design intentionally does NOT do (vs. PCT)

| PCT cost | Frequency in PCT | Our design |
|---|---|---|
| `mod.SetObjectTransform(camera, ...)` per tick | ~30 Hz, every camera-active tick | **Never.** Camera is Godot-placed and not moved. |
| Yaw/Pitch math + `LerpAngleRad` smoothing | Every tick in path/free/preset | **Never.** No camera smoothing logic at all. |
| `mod.RayCast` for free-cam wall correction | Every 5 ticks (~6 Hz) while free cam is active | **Never.** No collision query. |
| Bezier path resampling | Per-claim + on parameter changes | **Never.** No path. |
| VFX spawn loop + weighted random selection | Every `vfxConfig.checkInterval` (~4 Hz) | **Never.** No VFX. |
| Director per-tick action-state polling (jump/fire/aim/crouch/prone) | ~30 Hz | **Never.** Spectator is undeployed; `OngoingPlayer` short-circuits on `!isPlayerDeployed`. |
| Player-target hit-test (cone-narrow icon aim) | Every tick in path-cam setup | **Never.** No targeting. |

**This is the core reason the cost profile is different.** PCT is a real-time camera animation system; our integration is a "lock view to fixed point until match ends" system. The two are different cost classes by design, not by accident.

### 7.2 What our design DOES cost

These are the actual incremental costs, listed honestly. None are per-tick math; most are bounded one-shots or one extra branch per pre-existing iteration.

| Cost source | When it runs | Honest estimate | Notes |
|---|---|---|---|
| Engine call: `mod.SetCameraTypeForPlayer(spec, Cameras.Fixed, id)` | Once on claim, once on release | Sub-millisecond engine call × 2 | Same cost class as `mod.Teleport`. |
| Engine call: `mod.UndeployPlayer(spec)` | Once on claim | Sub-millisecond engine call | Triggers `OnPlayerUndeploy` (existing handlers run). |
| `twlConquestHudDestroyPlayer(spec)` | Once on claim | ~25 `mod.DeleteUIWidget` calls | Already paid on team-swap and disconnect; well-characterized. |
| `refreshAllVisiblePlayerReadyPanels()` | On claim + on release + on disconnect | O(built-panel-pids × ~12 engine calls) | Existing function, existing cost shape. |
| `getActivePlayers()` adds one branch per iter | Every active-roster build (NOT per-tick — only on state change paths) | One `if (pid === spectatorPid) continue` per active player | The active-roster build itself is already O(N); adding a branch is in the noise. |
| `getDesiredBoundaryViolationKind` for the spectator pid | Per-second tick, per pid | One extra early-return on `!isPlayerDeployed` | The classifier walks all players anyway; the spectator pid hits the existing `!isPlayerDeployed` guard at line 225 of [enforcement.ts](../src/boundary/enforcement.ts#L225). Zero new branch. |
| `OngoingPlayer` for the spectator pid | ~30 Hz engine-driven | **Skipped.** `ongoingPlayerImpl` early-returns on `!isPlayerDeployed` ([player-loop-inputs.ts:5](../src/index/player-loop-inputs.ts#L5)). | Zero new work. |
| `forEachValidPlayer` iterations | Various existing iterators | The spectator pid is iterated like any other valid player | No new iteration cost; existing N+1 walks. |
| `syncCoachButtonForPid` per panel viewer | On state edges only (claim/release/disconnect) | ~5 engine calls per panel pid | Comparable to the existing `syncPlayerReadyPanelClaimAdminButtonForPid`. Not per-tick. |

**Steady-state per-tick incremental cost: zero new tick-rate work.** All new costs fire on state edges (claim, release, disconnect, match end), not on the tick clock.

### 7.3 Where this differs from PCT in two sentences

PCT's per-tick math is unavoidable for *animating* a camera. We're not animating one — the engine holds the FixedCamera transform for us — so the entire per-tick pipeline that PCT spends ~30 Hz on simply doesn't exist in our design.

### 7.4 Caveats / things worth measuring

- **Engine cost of `mod.SetCameraTypeForPlayer(player, Cameras.Fixed, id)` is unmeasured locally.** I'm assuming it's sub-millisecond like other engine calls but have no benchmark. Worth profiling on first integration.
- **`twlConquestHudDestroyPlayer` cost on a fully-built combat HUD has been characterized** in the optimization analysis as bounded; if our spectator entered while the combat HUD was active, the destruction cost is the same as a team-swap.
- **If we choose I-4 mitigation (C) (deploy-at-base + boundary skip)** instead of (A) (stay undeployed), the spectator pid IS deployed, which means the boundary classifier will run them through the full zone-state machinery. The skip-branch I propose adds one `if (pid === spectatorPid) return undefined` early in `getDesiredBoundaryViolationKind`. That's still trivial — single branch evaluation per second tick — but it IS a new branch on a hot path. Honest framing.
- **If we ever extend this to an animated camera** (player-tracking, free-fly, path), we re-enter PCT's cost regime. The "free" claim only holds for the static-Godot-camera scope.

### 7.5 Bundle size impact (estimate)

- One new file `src/spectator/spectator-action.ts` — likely 80-120 LOC including comments.
- One new file `src/spectator/coach-button-sync.ts` — likely 40-60 LOC.
- Edits to ~6 existing files for wiring (router x2, state type, boundary skip, scoreboard skip, leave-cleanup, match-end cleanup).
- Total estimated bundle delta: ~3-4 KB of source. Per AGENTS.md "Comment Bundle-Stripping Behavior" — JSDoc and standalone line/block comments are stripped at postbuild, so the emitted-bundle delta is ~1.5-2.5 KB. Within the 1,048,576-byte cap; current bundle has substantial headroom per [conquest_optimization_state.md](./conquest_optimization_state.md).

---

## 8. Clashes With Current Functionality

This is the "what could break?" itemization. Each is cross-referenced to §6 if mitigation is needed.

| Clash | Risk | Notes |
|---|---|---|
| Boundary OOB → kills spectator | Low | `!isPlayerDeployed` early return guards this; verified in [enforcement.ts:225](../src/boundary/enforcement.ts#L225). |
| Ready-gate blocks match start because spectator isn't ready | None | Spectator is set ready synchronously in step 5 of §5.3. |
| Spectator counted toward `min-players-to-start` | Yes if not handled | `getAutoStartMinPlayerCounts().total` is compared against `active.all.length`. If we filter spectator out of `active.all`, the comparison correctly reflects fighters only. **Required mitigation in `getActivePlayers`.** |
| Team-swap from spectator state | Yes | If the panel still shows SWAP for the spectator, clicking it would `mod.SetTeam` while their camera is fixed. Best to grey out SWAP as well while `pid === spectatorPid`. (Or: hide the panel entirely for spectator.) |
| Vehicle redeploy flow | Low | Spectator can't enter vehicles; their slot ownership is cleared by undeploy path. |
| HUD swap-transition state machine | None | `teamSwapHudResetPendingByPid` is set on team-swap; spectator entry is not a swap. |
| Triple-tap to re-open panel | None | Gated on `isPlayerDeployed`. |
| `OnPlayerEnterAreaTrigger` events fire while spectating | Possible | If we use Mitigation (C) of I-4 (deploy them at base), they're inside the main-base trigger. Boundary classifier early-returns on `!isPlayerDeployed` (won't fire) — wait, they ARE deployed in (C). Need an `isSpectatorByPid` skip in the classifier. **See I-10.** |
| Match-end victory dialog rendering | Yes | Spectator still needs to see the victory dialog. They're on Team1/Team2 (per §5.6 recommendation), so the existing dialog renders correctly. Clear `spectatorPid` and reset camera before victory snapshot — see I-6. |
| Reconnecting spectator mid-match | Yes | Pid changes on disconnect; previous `spectatorPid` becomes stale. `onPlayerLeaveGameImpl` must clear it. New connection comes in clean (no spectator state), and the COACH button shows as available again. |
| Spectator team-swap leaks ready state | None | Team-swap path forces `readyByPid = false` via `swapPlayerTeam`, but the spectator can't reach the SWAP button if we grey it out. Even if they could, falling out of spectator + onto Team2 + not-ready is a recoverable state. |

---

## 9. Integration Requirements (Checklist)

### 9.1 Things the integrator must verify before coding

- [ ] **Probe `mod.Cameras.Fixed` + `mod.GetFixedCamera(id)` at runtime.** Confirms the SDK 1.2.3 enum value behaves. AGENTS.md API Validity Rules require we treat unverified symbols cautiously.
- [ ] **Probe behavior of `SetCameraTypeForPlayer(undeployed_player, Cameras.Fixed, id)`.** Resolves I-4 — does the camera actually swap on the deploy screen, or only on a deployed player?
- [ ] **Probe whether the engine renders its own spectator UI on top of our Fixed camera** (I-12). Same in-game test as the I-4 probe; observe whether the engine displays a player-cycling overlay.
- [ ] **Pick deploy strategy** — undeployed (simplest) vs. deployed-at-base (mid-weight) vs. deployed-in-hidden-room (PCT-style). §6 I-4.
- [ ] **Pick team strategy** — recommended option (3): keep on Team1/Team2, filter via `isSpectatorByPid`. §5.6.
- [ ] **Confirm no existing call to `mod.SetSpawnMode`.** Verified at analysis time via grep; re-verify before commit since `SetSpawnMode(Spectating)` is global and would break the design (I-12 defensive note).

### 9.2 Files to touch (estimated)

| File | Change |
|---|---|
| New: `src/spectator/spectator-action.ts` | `enterSpectatorMode`, `exitSpectatorMode`, `getSpectatorPid`, `isSpectator(pid)` helpers. |
| New: `src/spectator/coach-button-sync.ts` | `syncCoachButtonForPid` parallel to `syncPlayerReadyPanelClaimAdminButtonForPid`. |
| `src/state/runtime-types.ts` | Add `spectatorPid: number \| null` under `State.players`. |
| `src/state/runtime.ts` | Initialize `spectatorPid = null` in fresh-state factory. |
| `src/ready-dialog/player-ready-panel.ts` | Replace static-disabled COACH treatment with `syncCoachButtonForPid` call from refresh path. Also grey SWAP when `pid === spectatorPid`. |
| `src/ready-dialog/dialog-build-sections.ts` | Same treatment for the full ready dialog COACH. |
| `src/interaction/ui-events-player-ready-panel.ts` | Replace the no-op COACH branch (line 116-118) with delegated call. |
| `src/interaction/ui-events-ready.ts` | Add the COACH match for the admin's ready dialog. |
| `src/ready-dialog/roster-active.ts` | `getActivePlayers` skips spectator pid. |
| `src/index/player-join-leave.ts` | `onPlayerLeaveGameImpl` clears `spectatorPid` + broadcasts. |
| `src/conquest-flow.ts` | Match-end / fresh-setup paths clear `spectatorPid` + reset spectator camera. |
| `src/config/maps.ts` (or wherever `MapConfig` is defined) | Add `spectatorCameraId?: number` field. |
| `src/Changelog.ts` | Per AGENTS.md "Change Log and Versioning Policy". |

(Estimate: 8-10 files. Comparable to a Wave 4 small ship.)

### 9.3 Verification plan

Per AGENTS.md "Debugging / Diagnostic Output Policy" — diagnostics must use a reliable surface (HUD widget overlay or implicit downstream verification).

| Verification | Method |
|---|---|
| Camera actually swaps for spectator | Visual confirmation via screenshot — observer sees Godot camera view, fighter sees combat view. |
| Match starts when spectator + (active-1) ready | Live test: 1 admin + 1 fighter + 1 spectator, all ready → countdown begins. |
| Spectator does not block start | Live test: spectator stays not-ready (button greyed pre-claim), other players ready → countdown does NOT begin. After spectator claims, → countdown begins. |
| Slot is single-occupant | Live test: pid B clicks COACH after pid A claimed → button is greyed for B, click is silent no-op. |
| OOB does not kill spectator | Live test: leave spectator at Godot camera position for 30s (longer than the 6-10s OOB timer); confirm no death. |
| Spectator disconnect frees slot | Live test: A claims, A disconnects, B's panel updates → COACH enabled again. |
| Match-end resets spectator | Live test: spectator claims, match runs, match ends → spectator's camera returns to first-person, victory dialog visible. |

The first verification needs a HUD widget overlay if visual confirmation isn't conclusive (i.e. add a debug text widget showing "spec=<pid>" so we can verify state mutation independent of camera behavior).

---

## 10. Open Questions

These are items that the analysis cannot resolve without implementation or runtime testing.

1. **Does `mod.Cameras.Fixed` work for an undeployed player?** Empirical. (See I-4.)
2. **Does the engine render its own spectator UI on top of our Fixed-camera attachment?** Empirical. (See I-12.) The SDK 1.2.3 `SetSpectatingFiltersForPlayer` API implies a built-in spectator UI exists; whether it activates for our use case is unknown.
3. **Can we detect when the engine puts the spectator into the deploy screen UI and suppress that overlay?** Open. PCT bypasses by keeping the player deployed (mitigation C of I-4 mirrors that pattern with `mod.DeployPlayer` or `mod.SpawnPlayerFromSpawnPoint`, both confirmed available in SDK 1.2.3).
4. **What happens to `mod.SetCameraTypeForPlayer(player, Fixed, id)` if `id` is invalid (Godot camera missing)?** Empirical — guess: silent no-op or throw. Wrap in try/catch and log.
5. **If the spectator has the panel/dialog hidden cache from before claim, is the cache stale after claim?** No: the cache survives, and refresh-on-show repopulates from current state. But verify the COACH button stays in correct state if the spectator un-spectates (post-match) and re-opens the panel.
6. **Do we want the spectator to see the combat HUD?** As written they don't — it's gated on `isHudWarmReadyForPid` + deploy event. If we want them to see captures/tickets, we'd need a different gate. Not strictly required by the user's spec.
7. **Should the existing top-HUD "X / Y PLAYERS READY" line count the spectator?** Depends on §5.6. If we filter them out of `getActivePlayers`, the X/Y line uses fighter counts only, which is the cleanest UX.
8. **Is `SetSpectatingFiltersForPlayer` worth calling at all?** Only if I-12 probe shows the engine spectator UI is in play. If we end up with the engine spectator overlay alongside our Fixed camera, calling `SetSpectatingFiltersForPlayer(spec, SpectatingGroup.Team, false, false)` could constrain its filters to the spectator's team. Don't call it preemptively — it might activate the very UI we don't want.

---

## 11. Summary

A single-spectator slot is **achievable as a small, mostly-additive change** layered on the existing Coach button and ready-dialog system. The headline characteristics:

- **Camera trick:** `mod.SetCameraTypeForPlayer(spec, Cameras.Fixed, id)` against a Godot-placed camera. Static. No per-tick math.
- **State:** one nullable pid (`State.players.spectatorPid`) is the source of truth.
- **Body:** keep them undeployed if Portal allows the camera swap; fall back to "deployed at base + boundary skip" if not. Either path is well-supported by SDK 1.2.3 APIs.
- **Ready gate:** filter the spectator out of `getActivePlayers`. Spectator is set ready, but doesn't count toward the gate.
- **Boundary:** undeployed-path is naturally OOB-immune via the existing `!isPlayerDeployed` early-return. Deployed-fallback needs a `pid === spectatorPid` skip in `getDesiredBoundaryViolationKind`.
- **Lifecycle:** clear on disconnect, on match end, on fresh setup. Hooks already exist; just need to wire them.
- **Performance:** **zero new per-tick work.** Static Godot camera = no animation = none of the per-tick math that PCT uses for its three camera modes. All new costs (~30 widget destructions, two engine calls, one broadcast refresh) fire on state edges only. See §7 for honest cost breakdown vs. PCT's per-tick `SetObjectTransform` furnace. **NOT "literally zero," but cost-class lower than any animated camera approach.**
- **Engine spectator UI:** the SDK has a built-in spectator system (`SpawnModes.Spectating` + `SetSpectatingFiltersForPlayer`) but it's mode-wide, not per-player, so we don't use it. There IS a question (I-12) about whether the engine renders its own spectator UI on top of our Fixed-camera attached player — same probe as I-4 resolves it.
- **The blockers:** I-4 (camera-on-undeployed runtime test) AND I-12 (engine spectator UI interaction). Both resolved by the same in-game probe. Must be done before commit. If I-4 fails, bias to deploy-at-base with a boundary skip — not the PCT-style hidden-room approach (overkill for one spectator).

If the I-4/I-12 probes resolve favorably, this is roughly a single-ship change: similar mass to Wave 4 Ship 6 (CLAIM ADMIN button), with the same per-pid sync pattern. **Not analogous to integrating PCT** — we deliberately exclude the per-tick camera animation that makes PCT a per-tick math furnace.

---

*Sources consulted: [src/ready-dialog/player-ready-panel.ts](../src/ready-dialog/player-ready-panel.ts), [src/ready-dialog/dialog-build-sections.ts](../src/ready-dialog/dialog-build-sections.ts), [src/interaction/ui-events-player-ready-panel.ts](../src/interaction/ui-events-player-ready-panel.ts), [src/interaction/ui-events-ready.ts](../src/interaction/ui-events-ready.ts), [src/ready-dialog/roster-active.ts](../src/ready-dialog/roster-active.ts), [src/ready-dialog/auto-start.ts](../src/ready-dialog/auto-start.ts), [src/ready-dialog/swap-action.ts](../src/ready-dialog/swap-action.ts), [src/boundary/enforcement.ts](../src/boundary/enforcement.ts), [src/index/player-deploy.ts](../src/index/player-deploy.ts), [src/index/player-join-leave.ts](../src/index/player-join-leave.ts), [src/index/game-mode.ts](../src/index/game-mode.ts), [src/index.ts](../src/index.ts), [src/state/runtime-types.ts](../src/state/runtime-types.ts), [src/foundation/gameplay.ts](../src/foundation/gameplay.ts), [src/interaction/actions.ts](../src/interaction/actions.ts), [reference_bf6_core mod/enumerations/Cameras.md](../../reference_bf6_core/mod/enumerations/Cameras.md), [reference_bf6_core mod/functions/SetCameraTypeForPlayer.md](../../reference_bf6_core/mod/functions/SetCameraTypeForPlayer.md), [reference_bf6_core mod/functions/SetTeam.md](../../reference_bf6_core/mod/functions/SetTeam.md), [reference_sdk_1.2.3 code/types/mod/index.d.ts](../../reference_sdk_1.2.3/code/types/mod/index.d.ts), [spec_cam_functionality.md](./spec_cam_functionality.md), [AGENTS.md](../AGENTS.md). Date: 2026-05-08.*
