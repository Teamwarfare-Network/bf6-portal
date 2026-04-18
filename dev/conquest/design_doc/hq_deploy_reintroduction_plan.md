# Plan: Reintroduce HQ Deploy on v1.276 Vanilla Base

**Created:** 2026-04-17 (replaces earlier cleanup plan — that plan is locked at `design_doc/legacy_spawner_cleanup_plan.md` and not edited here).
**Status:** Phase 1 (v1.277), Phase 2 (v1.278), Phase 3 (v1.279) shipped. Phase 4 in progress.
**Base branch:** committed checkpoint at v1.276.

## Deferred follow-ups (carry into later phases)

- **Live-terminal HQ button is visible but inert.** Phase 3 routes only the deploy-menu path. The on-foot live-terminal button still renders and is pressable; the request handler rejects it but UX is confusing. Fix: hide via `&& !isVehicleDeployLiveTerminalModeForPid(viewerPid)` on `showSpawnButton` / `showGroundButton` — or hold off until Phase 6 makes the live path functional. Decision: leave visible-but-inert for now, user is aware.
- **Warp-to-middle observation during countdown (unreproduced).** User reported Phase 3 playtest that countdown-reset vehicles warped to map center rather than sinking. `sinkAndDestroyVehicle` is byte-identical to v1.276 — no Phase 1–3 change touches the destroy pass. Not reproduced; user will capture more detail on next occurrence. Candidate defensive fix (not applied yet): pass `slot.spawnPos` into the destroy wrapper as fallback when `mod.GetObjectPosition` returns a zero-vector, plus a one-line log of the teleport target.

---

## Context

The v1.258–v1.276 rewrite locked in a stable serial Vanilla vehicle spawner: one persistent `VehicleSpawner` per slot, a serial `spawnMutex` that dispatches via `ForceVehicleSpawnerSpawn`, event-driven bind via `OnVehicleSpawned`, and `Clocks.CountDownClock`-driven respawn. The spawn pathway itself is now boring — we can create the vehicle we want, when we want it, and bind it to the correct slot.

What's missing is **opt-in player-driven deployment**. The user wants to re-enable `VEHICLE_DEPLOY_METHOD_HQ` as a parallel mode selectable from the ready-dialog:

- **Vanilla mode (default, unchanged):** fleet pre-spawns at LIVE, auto-respawns after destruction.
- **HQ mode (new, opt-in):** pads start empty at LIVE. A player presses an HQ button for a specific slot → that slot's spawn is triggered → after the vehicle settles, the requesting player is seated into it. No auto-respawn after destruction — every vehicle comes from a player click.

The user's directives are explicit: **do not copy the deleted `deploy-fulfillment.ts` code**; the spawn mechanism itself (the `doDispatch` / `enqueueDispatch` / `OnVehicleSpawned` bind) must stay unchanged — we only add a *trigger* layer above it and a *seating* layer after the bind resolves.

## Durable constraints (from memory + v1.106–v1.253 history)

- **Pre-seat player teleport is banned.** Broke twice (v1.106–v1.108 and v1.151–v1.154) — engine OOB latch on aircraft, ~10s combat-area kill. Never put `mod.Teleport(player, ...)` immediately before `ForcePlayerToSeat`.
- **`mod.ForcePlayerToSeat` is context-sensitive.** v1.246–v1.252 testing proved it silently fails on on-foot alive players. **BountyHunter pattern (v1.252) proved it works reliably inside the `OnPlayerDeployed` event chain** — this is the only reliable context we've found.
- **`sinkAndDestroyVehicle` (v1.276)** is the canonical destroy wrapper — use it for any HQ-mode cleanup (LIVE start, respawn suppression cleanup).

## Seating strategy — user-directed

HQ Deploy has two trigger surfaces, each with its own seating path:

1. **Deploy-menu surface (PRIMARY — Phase 4 of this plan).** Player is dead, looking at the deploy screen. Player presses the HQ button for a slot. We follow the **BountyHunter pattern**: reserve the slot, dispatch spawn, wait for bind + settle, then route the player through the engine's natural `OnPlayerDeployed` event chain and call `ForcePlayerToSeat` inside that handler. This is the most common case and the proven path.
2. **On-foot surface (DEFERRED — Phase 6).** Player is alive at the main base, presses the interactable, opens the live-deploy menu, picks a slot. Seating an alive player is harder (BountyHunter pattern didn't cover this; `ForcePlayerToSeat` silently fails on alive on-foot players). Scaffolding is left in place in Phase 3; the actual seating experiment happens later and may require undeploy → redeploy → `OnPlayerDeployed` to re-enter the reliable context.

Follow BountyHunter patterns until they're proven non-functional, per the user.

---

## Phased Plan (risk-ascending, one bump per phase)

Each phase ships as a discrete `npm run bumpVersion` so we can bisect. Build + `tsc --noEmit` must pass before each bump.

### Phase 1 — Restore the ready-dialog knob option (no behavior change)

**Goal:** Make HQ selectable in the ready dialog. Nothing else changes.

**Edits:**
- [src/foundation/gameplay.ts](../src/foundation/gameplay.ts) around line 201: add a second entry to `READY_DIALOG_VEHICLE_DEPLOY_METHOD_OPTIONS` mapping to a new or existing `mod.stringkeys.twl.readyDialog.vehicleDeployHq` string key. (String edit requires explicit approval per AGENTS.md.)
- Keep `VEHICLE_DEPLOY_METHOD_DEFAULT = VANILLA` (unchanged).
- Map preset packages in `src/config/maps/*.ts`: leave `.vehicleDeployMethod` defaulting to VANILLA. No preset flips the value.

**Out of scope this phase:** `HQ_FORWARD` and `HQ_FORWARD_AIR` remain excluded — we're only restoring the single `HQ` option for now.

**Automated verification:** Build + typecheck pass.

**User playtest required (Phase 1):**
1. Load into the ready-dialog; cycle the "Vehicle Deploy Method" option. Confirm the readout label flips between **Vanilla** and **HQ** and no other text changes.
2. Start a match with **Vanilla** selected — confirm behavior is byte-identical to v1.276 (fleet pre-spawns at countdown, respawns work).
3. Start a match with **HQ** selected — confirm behavior is STILL identical to Vanilla this phase (the knob has no downstream effect yet; this is the expected null result).
4. Report anything visibly different between Vanilla and HQ at this phase — there should be nothing.

**Bump:** `"hq-deploy: restore HQ option in ready-dialog knob (no behavior yet)"`

---

### Phase 2 — Gate Vanilla auto-spawn + auto-respawn on knob

**Goal:** When HQ is active, pads stay empty. No vehicles spawn automatically — ever.

**Edits in [src/vehicles/vanilla-spawner.ts](../src/vehicles/vanilla-spawner.ts):**
- Add a small helper `isVanillaDeployMode(): boolean` that reads `State.round.modeConfig.confirmed.vehicleDeployMethod`, returns `true` only for VANILLA.
- **Countdown-reset Phase C** (`resetVehicleSlotsAtCountdownStart`, ~line 520): skip the `enqueueDispatch(i)` loop if not VANILLA. Still run the destroy-phase (sink any pre-existing bound vehicles) so pads are clean at LIVE.
- **Vehicle-destroy respawn trigger** (`startRespawnCountdown` call site — trace via `onSlotVehicleDestroyed` in `src/index/vehicle-events.ts`): skip the respawn-clock start if not VANILLA. Slot stays `vehicleId=-1`, `respawnClock=undefined`, waiting for an HQ request.
- **Round-start dispatch loop** in `ensureVehiclesForMatch` (~line 177): also skip if not VANILLA. At LIVE the fleet remains unspawned.

**Note:** `applySpawnerEnablementForMatchup` should STILL run in HQ mode — slots must be `enabled=true` for HQ requests to target them later. We just don't dispatch.

**Automated verification:** Build + typecheck pass. Grep confirms `isVanillaDeployMode()` gates every dispatch call site.

**User playtest required (Phase 2):**
1. **Vanilla regression (critical):** Start a Vanilla match. Walk through full round — fleet spawns at LIVE, destroy a helo and a tank, confirm both auto-respawn after ~2 minutes. Nothing should feel different from v1.276.
2. **HQ empty-pads:** Start an HQ match. Watch the countdown complete and LIVE fire. **Every vehicle pad should be empty.** No Abrams, no helo, nothing.
3. **HQ no-respawn check:** Still in the HQ match, try to trigger a respawn indirectly (e.g., if any vehicle somehow appeared — it shouldn't — destroy it). Confirm no vehicle reappears at any pad over ~3 minutes.
4. **HQ button state:** The deploy-screen HUD rows should still render slot info (rows visible, no buttons yet or buttons inert — buttons wire up in Phase 3).
5. Report any unexpected spawns, any audible vehicle-destroy sound at LIVE, or any difference in Vanilla behavior.

**Bump:** `"hq-deploy: gate vanilla auto-spawn and auto-respawn on deploy-method knob"`

---

### Phase 3 — HQ claim + dispatch wiring (no seating yet)

**Goal:** A player presses an HQ button (in deploy screen or live-deploy menu) → the claimed slot's vehicle spawns at its pad. Player is NOT seated yet — this phase proves the trigger surface works without touching the seating problem.

**New module:** `src/vehicles/hq-deploy.ts` (~150 lines). Owns all HQ-specific logic. Imports nothing from the deleted `deploy-fulfillment.ts`. Structured so each exported function is a single concern.

**Core function:** `requestHqVehicleSpawn(pid: number, slotIndex: number, source: "deploy_menu" | "on_foot"): { ok: boolean; reason?: string }`

Validates and reserves:
1. HQ mode active (else reject).
2. Slot exists + `slot.enabled` + `slot.vehicleId === -1` + `slot.pendingSpawnOwnerPid === undefined`.
3. Player valid + on correct team (`slot.teamId` matches `mod.GetTeamId(player)`).
4. Player-level cooldown not active (track `State.players.hqRequestAtByPid[pid]`, gate ~5s between requests).
5. On success: set `slot.pendingSpawnOwnerPid = pid`, `slot.pendingSpawnMode = source` (reusing the orphaned scaffolding fields that the cleanup plan already reserved for this — confirmed safe per exploration agent).
6. Call `enqueueDispatch(slotIndex)` — same serial mutex the Vanilla path uses at countdown start. No new spawn code.
7. Return `{ ok: true }`.

**Post-bind hook:** Modify `bindSpawnedVehicleToExpectingSlot` in [vanilla-spawner.ts:300](../src/vehicles/vanilla-spawner.ts#L300) to, after the existing bind work, check if `slot.pendingSpawnOwnerPid !== undefined`. If so, call a new `onHqVehicleSpawnedForClaim(slot, vehicle)` hook in `hq-deploy.ts`. Phase 3's implementation of that hook is a no-op stub (logs + clears the claim). Phase 4 fills it in.

**Wire the existing orphan buttons:**
- **Deploy-screen buttons** are rendered in [src/vehicles/deploy-timer-ui.ts](../src/vehicles/deploy-timer-ui.ts). The click handler at ~line 1713 (`onHudArmEventForVehicleDeployTimer`) is currently a no-op. Replace the no-op branch with a call to `requestHqVehicleSpawn(pid, slotIndex, "deploy_menu")`. Parse `slotIndex` from the widget name (the ID is already built per-slot at ~line 79).
- **Live-deploy menu buttons** (from `src/vehicles/deploy-live-menu.ts` — reachable via the `open_vehicle_spawn_menu` interactable): same wiring, with `source = "on_foot"`.
- **Button visibility gate:** slot must be empty (`vehicleId === -1`), enabled, same team, no pending claim, HQ mode active. Existing visibility gates at [deploy-timer-ui.ts:182–185, 1518, 1523](../src/vehicles/deploy-timer-ui.ts#L182-L185) already check `deployFlowTracked` / `pendingSpawnOwnerPid` / `expectingSpawn` — the gate semantics map cleanly to HQ.

**Failure paths:** if `doDispatch` returns without binding (3s timeout + 1s retry → -1), `bindSpawnedVehicleToExpectingSlot` never fires. Add a post-dispatch cleanup that clears `pendingSpawnOwnerPid` so the slot is requestable again. Track this in the existing `doDispatch` flow via a new `slot.pendingClaimExpiresAtSeconds` guard — if bind hasn't happened within N seconds, clear the claim and let the HUD show "request failed, retry."

**Automated verification:** Build + typecheck pass. Unit-testable: `requestHqVehicleSpawn` rejection reasons can be exercised via mocked state.

**User playtest required (Phase 3):**
1. **Deploy-menu dispatch (primary):** Start HQ match. When dead at the deploy screen, press the HQ button for a transport slot. **Expected:** the vehicle appears at its pad within 3 seconds. You remain at the deploy screen (seating is Phase 4).
2. Repeat for a helicopter slot and a tank slot. Same result — vehicle appears within ~3s.
3. **Button visibility gate:** While that slot's vehicle is alive at the pad, its HQ button should disappear or be disabled in the deploy screen.
4. **On-foot interactable dispatch:** Alive at main base, interact with the vehicle-deploy interactable, open the live menu, press a slot's HQ button. **Expected:** vehicle appears at the pad. You remain on foot (seating is Phase 6, deferred).
5. **Cooldown:** Press an HQ button twice within 5s — second press should be rejected (visible as the button flashing / going unresponsive; full UX polish is Phase 5).
6. **Team gate:** Confirm you cannot see / cannot press HQ buttons for the other team's slots.
7. **Destroy + re-request:** Destroy the vehicle you spawned. Pad returns to empty. Button reappears and is pressable again.
8. **Spawn timeout (engineering edge case):** If any HQ request ever fails to bind within 10s, the claim should auto-clear and the button should become pressable again. Watch for stuck "Spawning…" states that never clear.
9. Report any vehicle that spawns at the wrong pad, any slot that stays locked after a destroy, or any button that responds for the wrong team.

**Bump:** `"hq-deploy: per-slot player-triggered dispatch via reused deploy-menu and live-menu buttons (seating stub)"`

---

### Phase 4 — Seating via `OnPlayerDeployed` (BountyHunter pattern, deploy-menu case)

**Goal:** Player at deploy menu presses HQ button → vehicle spawns → **player is seated in driver seat**. BountyHunter pattern: `ForcePlayerToSeat` only inside the `OnPlayerDeployed` event chain.

**Design:** The HQ claim lives through two phases — (1) spawn-pending (from request to `OnVehicleSpawned` bind) and (2) seat-pending (from bind to `OnPlayerDeployed`). The second phase stages the player's deploy and seats them in the event handler.

**New claim state** in `hq-deploy.ts`:
```
interface HqClaim {
  pid: number;
  slotIndex: number;
  vehicleId: number;   // -1 until bind
  source: "deploy_menu" | "on_foot";
  phase: "spawn_pending" | "seat_pending";
  createdAtSeconds: number;
}
// State.hqDeploy.claimsByPid: Record<number, HqClaim>
```

**Flow (deploy-menu path):**
1. Request arrives (Phase 3 wiring). `phase = "spawn_pending"`.
2. `enqueueDispatch(slotIndex)` runs. `doDispatch` eventually fires `OnVehicleSpawned` → `bindSpawnedVehicleToExpectingSlot` runs.
3. `onHqVehicleSpawnedForClaim(slot, vehicle)` fires. Record `claim.vehicleId = getObjId(vehicle)`, transition `phase = "seat_pending"`.
4. **Settle wait:** `await mod.Wait(1.0)` (tunable — BountyHunter used 0.5s, prior attempts used 0.1s; start at 1.0s and tune down after playtest).
5. **Trigger deploy:** call `mod.DeployPlayer(player)` — this triggers the engine's `OnPlayerDeployed` event chain.
6. **In `OnPlayerDeployed`** (new hook in `src/index/player-deploy.ts`): check `State.hqDeploy.claimsByPid[pid]`. If `phase === "seat_pending"`, look up `vehicleId`, resolve the vehicle via `findVehicleById(claim.vehicleId)`, and call `mod.ForcePlayerToSeat(player, vehicle, -1)`. Verify via `mod.GetPlayerVehicleSeat(player) !== -1`.
7. Clear the claim regardless of seat-verify result. If seat verify failed, player is on foot — log + emit a world message but do not retry (player can press E to enter manually).
8. On the slot side: `slot.pendingSpawnOwnerPid` and `slot.pendingSpawnMode` are cleared at step 7.

**Safety clauses:**
- If the player dies / leaves / switches teams between spawn and seat → clear the claim, destroy the vehicle via `sinkAndDestroyVehicle` (no orphaned HQ-spawned vehicles). Hook `OnPlayerDied` and team-switch handlers.
- If 10 seconds pass in `seat_pending` without `OnPlayerDeployed` firing → timeout, clear claim, destroy vehicle (same cleanup path).
- **Never** teleport the player before `ForcePlayerToSeat`. Never.

**Automated verification:** Build + typecheck pass. Runtime logging of `GetPlayerVehicleSeat(player)` after `ForcePlayerToSeat` — post-playtest, review log for seat-verify success rate.

**User playtest required (Phase 4) — this is the critical milestone:**
1. **Primary seating path:** Dead at deploy menu in HQ match. Press HQ button for a **transport slot (quadbike)**. **Expected:** vehicle appears at pad, then within ~1–2 seconds you deploy directly into the driver seat of that vehicle. Not on foot nearby — in the seat.
2. **Repeat for heavy ground:** HQ button for a **tank slot (Abrams)**. Same outcome — spawned into driver seat.
3. **Repeat for aircraft:** HQ button for a **helicopter slot**. Same outcome — spawned into pilot seat. **Aircraft is the highest-risk case** (prior OOB-latch history); watch for the vehicle getting destroyed by engine combat-area logic within ~10s of appearing. If that happens, flag immediately — we have a regression.
4. **Fallback UX check:** If `ForcePlayerToSeat` verification reports `-1` (player on foot at pad instead of in seat), confirm you can still press E to enter manually. No vehicle is orphaned.
5. **Abort paths:** Press HQ button, then immediately leave the deploy menu / switch teams / disconnect before the seat completes. **Expected:** vehicle gets cleaned up (sunk beneath map + destroyed) within 10 seconds. Slot returns to available.
6. **Vanilla regression (still critical at every phase):** Switch back to Vanilla mode, full round — no change from v1.276.
7. **Spam test:** Hammer the HQ button (within cooldown) for multiple slots simultaneously. Confirm each dispatch is serialized (vehicles appear one after another, not all at once) and each seats the correct triggering player.
8. Report: does seat verification pass consistently? Any aircraft OOB kills? Any orphaned vehicles after abort?

**Bump:** `"hq-deploy: seat deploy-menu players into fresh vehicles via OnPlayerDeployed + ForcePlayerToSeat"`

---

### Phase 5 — HUD polish, cooldown UX, error surfaces

**Goal:** The HQ flow *feels* right to the player.

**Edits (all in `src/vehicles/deploy-timer-ui.ts` + `hq-deploy.ts`):**
- **Pending state visualization:** while `phase === "spawn_pending"` or `"seat_pending"`, the slot row shows a spinner / "Spawning…" / "Deploying…" text instead of the button. Reuse the existing respawn-timer widget family (already drawn during Clocks countdown) by repurposing it to show the HQ pending status.
- **Cooldown feedback:** when the 5s per-player cooldown blocks a press, play a "nope" sound or flash the button. No silent rejection.
- **Team mismatch:** other team's buttons are hidden entirely (already the expected visibility gate), but if somehow pressed, reject silently.
- **Post-seat failure:** if `ForcePlayerToSeat` verified `-1` (player on foot at pad), emit a world message key `twl.hq.seatFallback` ("Vehicle ready — climb aboard"). String edit requires explicit approval.
- **Mark HUD dirty** per the Combat HUD Dirty-Flag Contract (AGENTS.md) on every claim state mutation.

**Automated verification:** Build + typecheck pass. HUD dirty-flag contract audited (AGENTS.md §Combat HUD Dirty-Flag Contract).

**User playtest required (Phase 5):**
1. **Spawn-pending UX:** Press HQ button — while vehicle is spawning, the slot row should show clear "Spawning…" / spinner state (no button visible).
2. **Seat-pending UX:** After `OnVehicleSpawned` but before seat completes, row shows "Deploying…" state.
3. **Cooldown UX:** Press the same button twice within 5s — second press produces visible rejection feedback (flash, sound, or message).
4. **Fallback message:** If seat verification reports `-1` in any run, the world-log message "Vehicle ready — climb aboard" (or equivalent approved string) appears.
5. **HUD correctness across teammates:** Another player on your team pressing their HQ button should not affect your HUD state. Confirm per-player pending states are isolated.
6. **No HUD flicker or double-render** during claim transitions. If you see flicker, it's likely a missed `conquestPhase3MarkHudDirty()` call — flag it.
7. Report overall feel — does the flow feel responsive? Are any states confusing?

**Bump:** `"hq-deploy: pending-state HUD, cooldown feedback, fallback message"`

---

### Phase 6 — On-foot seating path (DEFERRED)

**Goal:** When an alive on-foot player presses HQ from the live-deploy menu, seat them into the vehicle without a full undeploy-redeploy round-trip if possible.

**Not implemented in this plan.** Phase 3 already routes on-foot requests through `requestHqVehicleSpawn(..., "on_foot")` and spawns the vehicle; Phase 4 clears the claim with no seat attempt for `source === "on_foot"`. Player lands on foot at the pad and climbs in manually — identical to Vanilla's fleet.

**Future options to evaluate in a separate plan:**
1. Undeploy the player → redeploy → `OnPlayerDeployed` → `ForcePlayerToSeat`. Adds ~1.5s latency and kills loadout state. BountyHunter pattern applied to alive players.
2. PlayerSpawner + SpawnPlayerFromSpawnPoint at the driver-seat position (Phase 8 memory pattern, currently unused in `src/`).
3. Wait for `OnPlayerEnterVehicle` event and just let the player walk to it — arguably acceptable UX for the on-foot case.

Leave the `"on_foot"` source tag + the claim lifecycle intact so none of the above require re-plumbing.

**No bump** — this phase is documentation only.

---

## Files Touched Summary

| Phase | Files | Action |
|---|---|---|
| 1 | `src/foundation/gameplay.ts`, `src/strings.json` (+ string approval) | Add HQ option to knob |
| 2 | `src/vehicles/vanilla-spawner.ts`, `src/index/vehicle-events.ts` | Gate auto-spawn + auto-respawn on `isVanillaDeployMode()` |
| 3 | `src/vehicles/hq-deploy.ts` (new), `src/vehicles/vanilla-spawner.ts` (post-bind hook), `src/vehicles/deploy-timer-ui.ts` (button handler), `src/vehicles/deploy-live-menu.ts` (button handler), `src/state/runtime-state.ts` (claim state), `src/state/runtime-types.ts` (HqClaim type) | Wire triggers + dispatch + claim state |
| 4 | `src/vehicles/hq-deploy.ts`, `src/index/player-deploy.ts` (OnPlayerDeployed hook), `src/vehicles/vanilla-spawner.ts` (cleanup-on-abort) | BountyHunter seating pattern |
| 5 | `src/vehicles/deploy-timer-ui.ts`, `src/vehicles/hq-deploy.ts`, `src/strings.json` (+ string approval) | HUD polish |
| 6 | — | Deferred |

Each phase: `npm run build` → `cmd /c npx tsc --pretty false --noEmit` → `npm run bumpVersion -- -c "…"`.

---

## Critical file references (read before editing)

- [src/vehicles/vanilla-spawner.ts](../src/vehicles/vanilla-spawner.ts) — the stable base; especially `enqueueDispatch`, `doDispatch`, `bindSpawnedVehicleToExpectingSlot`, `resetVehicleSlotsAtCountdownStart`, `sinkAndDestroyVehicle`.
- [src/foundation/gameplay.ts:195-203](../src/foundation/gameplay.ts#L195-L203) — deploy-method constants and options array.
- [src/vehicles/deploy-timer-ui.ts:1713-1829](../src/vehicles/deploy-timer-ui.ts#L1713-L1829) — orphan button click handler (no-op today, will carry HQ dispatch).
- [src/vehicles/deploy-live-menu.ts:58-84](../src/vehicles/deploy-live-menu.ts#L58-L84) — `tryOpenVehicleDeployLiveMenuForPlayer`; still reachable from the main-base interactable.
- [src/state/runtime-types.ts:6-42](../src/state/runtime-types.ts#L6-L42) — `VehicleSpawnerSlot`; `pendingSpawnMode` and `pendingSpawnOwnerPid` are confirmed writer-orphaned and safe to repurpose.
- [src/index/player-deploy.ts:63-132](../src/index/player-deploy.ts#L63-L132) — `onPlayerDeployedImpl`; Phase 4's seat hook lands here.
- [reference_bf6_core/mod/functions/ForcePlayerToSeat.md](../../reference_bf6_core/mod/functions/ForcePlayerToSeat.md) — signature. Treat as only reliable inside `OnPlayerDeployed`.
- [reference_bf6_core/mod/functions/DeployPlayer.md](../../reference_bf6_core/mod/functions/DeployPlayer.md) — verify signature before Phase 4.

---

## Non-negotiable design rules

1. **Do not touch the spawn mechanism itself.** `ForceVehicleSpawnerSpawn` + `OnVehicleSpawned` + serial mutex stay byte-identical. HQ adds a *caller* and a *post-bind hook*, nothing else.
2. **Never call `mod.Teleport` on a player immediately before `ForcePlayerToSeat`.** Banned. Causes engine OOB latch.
3. **`ForcePlayerToSeat` is only used inside `OnPlayerDeployed`.** Any other context is speculative and must not ship without explicit re-evaluation.
4. **No code copied from the deleted `deploy-fulfillment.ts` / `reservations.ts` / `spawner-sequence.ts`.** Every function in `hq-deploy.ts` is written fresh against the v1.276 API.
5. **HQ mode leaves Vanilla mode byte-identical.** All HQ logic is gated on `isVanillaDeployMode()` returning false; VANILLA must remain a zero-diff regression path at every phase.

---

## Rollback

Each phase is a single version bump. Revert any phase without disturbing the others. Phase 1's UI knob is harmless (no branches depend on it until Phase 2 lands). Phases 2–4 each add a single gate or hook that can be reverted in isolation.
