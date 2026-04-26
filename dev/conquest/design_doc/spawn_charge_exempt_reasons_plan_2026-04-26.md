# Spawn-Charge Exempt Reasons — Plan

**Created:** 2026-04-26
**Target ship:** v1.393
**Issue:** No tracker entry yet — derives from MP playtest tuning conversation 2026-04-26 around bleed calibration #103.

---

## Problem statement

The Phase 2B spawn-charge system ([spawn-charge.ts:197 `conquestPhase2BOnPlayerDeployed`](../src/state/spawn-charge.ts#L197)) subtracts 1 ticket from a player's team on every chargeable deploy event. Deploy events fire from `OnPlayerDeployed` and resolve a "reason" via `conquestPhase2BResolvePendingReason`.

**6 reasons exist** ([runtime-types.ts:139-145](../src/state/runtime-types.ts#L139-L145)):
- `deploy` (default — death-respawn)
- `forced_redeploy`
- `team_switch`
- `admin_move`
- `phase_transition`
- `reconnect`

**All 6 currently charge.** The charge function does not consult reason for charge/no-charge gating; it only uses reason for diagnostic counters (`deployCountByReason` and `chargedCountByReason`).

### Two specific cases that should NOT charge tickets

1. **Vehicle deploy from on-foot** — Player is alive on-foot at HQ. They walk to the HQ-Deploy / Forward-Deploy / Air-Deploy interactable and choose to spawn into a vehicle. The seat flow at [hq-deploy.ts:295-296](../src/vehicles/hq-deploy.ts#L295-L296) fires:
   ```
   SetRedeployTime(0) → UndeployPlayer → DeployPlayer → ForcePlayerToSeat
   ```
   The `DeployPlayer` triggers `OnPlayerDeployed` → spawn-charge resolves to default reason `"deploy"` → 1 ticket subtracted. **The player did not die — they voluntarily grabbed a vehicle. Charging is wrong.**

2. **Team switch redeploy** — Player presses "Change Teams" pre-game. The flow at [actions.ts:752](../src/interaction/actions.ts#L752) calls `forceUndeployPlayer(eventPlayer, "team_switch")`, which marks reason `team_switch` and undeploys. The subsequent redeploy on the new team fires `OnPlayerDeployed` → spawn-charge → 1 ticket. **The player did not die — team-swap is a UX action, not a death event. Charging is wrong.**

The reason `team_switch` is already wired (the flow correctly marks it). The fix for case 2 is just to make that reason exempt in the charge function.

The reason `vehicle_deploy` does not yet exist. The fix for case 1 needs a new reason added to the union, plus a marker call in the on-foot seat flow.

---

## Design choice: exempt-set vs per-reason flag

**Option A — Hardcoded exempt-set in charge function:**
```ts
const reason = conquestPhase2BResolvePendingReason(pid);
conquestPhase2BIncrementReasonCounter(State.conquest.spawnCharge.deployCountByReason, reason);
if (reason === "vehicle_deploy" || reason === "team_switch") return;
// ... existing charge logic
```

**Option B — Reason metadata table:**
```ts
const REASON_EXEMPT_FROM_CHARGE: Record<ConquestSpawnChargeReason, boolean> = {
    deploy: false,
    forced_redeploy: false,
    team_switch: true,         // exempt
    admin_move: false,
    phase_transition: false,
    reconnect: false,
    vehicle_deploy: true,      // exempt
};
// ...
if (REASON_EXEMPT_FROM_CHARGE[reason]) return;
```

**Pick:** Option A. Simpler, one-liner, matches the existing function's idiom (uses inline reason checks elsewhere e.g. `conquestPhase2BGetReasonCode`). Option B costs more bundle bytes for the same behavior and adds a maintenance surface.

---

## Touch points

| File | Change |
|------|--------|
| [`src/state/runtime-types.ts:139-145`](../src/state/runtime-types.ts#L139-L145) | Add `\| "vehicle_deploy"` to `ConquestSpawnChargeReason` union. |
| [`src/state/runtime-state.ts:134-150`](../src/state/runtime-state.ts#L134-L150) | Add `vehicle_deploy: 0,` to both `deployCountByReason` and `chargedCountByReason` initializer object literals. |
| [`src/index/conquest-scaffold.ts:21-37`](../src/index/conquest-scaffold.ts#L21-L37) | Same — add `vehicle_deploy: 0,` to both reset initializers. |
| [`src/state/spawn-charge.ts:9-10`](../src/state/spawn-charge.ts#L9-L10) | Add `vehicle_deploy: 0,` to `conquestPhase2BNewReasonCounterState` factory. |
| [`src/state/spawn-charge.ts:28`](../src/state/spawn-charge.ts#L28) | Add `if (reason === "vehicle_deploy") return 7;` (next available code) to `conquestPhase2BGetReasonCode`. |
| [`src/state/spawn-charge.ts:35-42`](../src/state/spawn-charge.ts#L35-L42) | Add `+ counters.vehicle_deploy` to `conquestPhase2BGetReasonCounterTotal` if it explicitly enumerates all reasons. |
| [`src/state/spawn-charge.ts:208`](../src/state/spawn-charge.ts#L208) (immediately after `IncrementReasonCounter` for `deployCountByReason`) | Add `if (reason === "vehicle_deploy" || reason === "team_switch") return;` |
| [`src/vehicles/hq-deploy.ts:295`](../src/vehicles/hq-deploy.ts#L295) (immediately before `mod.SetRedeployTime(player, 0)`) | Add `if (pid !== undefined) conquestPhase2BMarkNextDeployReason(pid, "vehicle_deploy");` |

---

## What stays exempt vs charged after this fix

**Exempt (no charge):**
- `vehicle_deploy` — alive on-foot → HQ/Forward/Air vehicle deploy. NEW.
- `team_switch` — pre-game / live team-swap UX action. NEWLY EXEMPT (was charging before this fix).

**Still charged:**
- `deploy` — default death-respawn
- `forced_redeploy` — admin force-redeploy / arbitration
- `admin_move` — admin teleport/repositioning that triggers a redeploy
- `phase_transition` — match-phase-driven redeploy (e.g. live transition)
- `reconnect` — reconnect after disconnect mid-match

The charged set is the "involuntary or death-equivalent" set. The exempt set is the "voluntary UX action that synthetically fires a deploy event" set.

---

## Diagnostic preservation

The `deployCountByReason` increment runs **before** the exempt check, so all deploys are counted in diagnostics regardless of charge outcome. Only `chargedCountByReason` reflects actual ticket impact. This preserves the existing telemetry shape.

The `lastChargedDeploySeq` / `lastChargeAtSeconds` / `lastReason` transaction state is updated only on successful charge (existing behavior). Exempt deploys do not update transaction state — meaning a sequence like `vehicle_deploy → death-respawn` will charge the death normally without false-duplicate-suspicion.

---

## What this does NOT cover

- **Deploy from death screen with vehicle pick** — if a player is dead at the deploy menu and selects "spawn directly into a vehicle" (the `slot.hqSource === "deploy_menu"` branch in hq-deploy.ts), this still charges 1 ticket. Correct: the player consumed a death-respawn anyway; charging is appropriate.
- **`forced_redeploy` reason** — used by various arbitration/cleanup paths; charging is correct (the player didn't initiate it, but a ticket is still consumed for the actual respawn that happens).
- **`reconnect`** — if a disconnected player rejoins, their next deploy is marked `reconnect` and charges. This matches "you used a ticket and we treat it as a continuation of your prior session." Could be debated, but not in scope for this plan.

---

## Bundle delta estimate

- ~30 bytes new union member + reason code branch
- ~40 bytes counter initializer additions across 4 sites
- ~30 bytes exempt early-return in charge function
- ~40 bytes mark-reason call in hq-deploy.ts on-foot branch
- **Total: ~140-200 bytes**

---

## Verification plan

### Build / typecheck
1. `npm run bumpVersion -- -c "..."` → v1.393.
2. `npm run build` PASS (bundle size in 1,035–1,036K range).
3. `cmd /c npx tsc --pretty false --noEmit` exit 0.

### Behavioral tests (MP playtest)
1. **Baseline death respawn** — player dies, redeploys on-foot. Expect: 1 ticket subtracted from their team. (Unchanged.)
2. **Vehicle HQ Deploy from on-foot** — player alive at HQ, presses HQ-Deploy interactable, spawns into a tank. Expect: **0 tickets subtracted**. Diagnostic counter `deployCountByReason.vehicle_deploy` increments by 1.
3. **Forward Deploy from on-foot** — same pattern as #2 with Forward Deploy. Expect: 0 tickets.
4. **Air Deploy from on-foot** — same with Air Deploy. Expect: 0 tickets.
5. **Team swap pre-game** — player presses Change Teams. Expect: 0 tickets subtracted (was 1 before this fix).
6. **Death → vehicle deploy from deploy menu** — if reachable, player dies and selects vehicle from the deploy screen. Expect: 1 ticket (death-respawn cost stands).

### Regression checks
- `chargedCountByReason` totals should match charge events visible in admin debug HUD (if perfDiag enabled).
- No "duplicate-charge suspicion" increments in the exempt paths.

---

## Issue tracker

Log new issue `CQ_Tweak_SpawnCharge_Exempt_Vehicle_And_TeamSwitch` (#107) on ship. Status: **Resolved (v1.393) pending MP confirmation.**
