# Plan: Fix #93 — `GetVehicleFromPlayer` engine error log on Forward Deploy

**Created:** 2026-04-25
**Issue:** [`#93 CQ_Bug_GetVehicleFromPlayer_Boundary_ForwardDeploy`](./conquest_issues.md)
**Predecessor:** v1.369 event-driven seatKind refactor — this plan completes the v1.369 design intent by removing the last per-deploy engine call whose cache is no longer consumed in production.

---

## Context

Spawning with a vehicle from Forward Deploy (and likely other deploy paths) produces engine error log lines:

```
ERROR REPORTED BY GETVEHICLEFROMPLAYER WHILE RUNNING JS SCRIPT.
Failed to perform operation as invalid value encountered.
```

5 instances captured rapid-fire in [v1.372B screenshot](../reference_design_documentation/testing_images/20260425101723_1.jpg). User-reported trigger is Forward Deploy; other deploy timing races (HQ Deploy retries, Air Deploy timing race per v1.368 changelog) likely also fire this. Cosmetic only — no observed gameplay regression — but the engine-logs-before-JS-catch family is the same one we cleaned up systematically in v1.341 (`RemoveEquipment`) and the recent v1.373 launcher work. Worth closing.

## Call-site audit (verified 2026-04-25)

Three sites in [src/](../src/) call `mod.GetVehicleFromPlayer`:

| # | Location | Frequency | Production consumer of result |
|---|---|---|---|
| 1 | [`index/player-deploy.ts:71`](../src/index/player-deploy.ts#L71) (inside `onPlayerDeployedImpl`) | Every `OnPlayerDeployed` event (Forward / HQ / Air / Vanilla / squad / flag) | Seeds `State.players.posDebugVehicleObjIdByPid[pid]` cache |
| 2 | [`boundary/enforcement.ts:530`](../src/boundary/enforcement.ts#L530) (inside `probeSeatKindFromEngineState`) | One-shot at deploy, **only on non-slot deploys** where `mod.GetSoldierState(IsInVehicle)` returned true. Slot-based HQ/Forward/Air deploys take the slot-claim branch at [:438](../src/boundary/enforcement.ts#L438) and never reach line 530. | Classifies aircraft pilot vs ground vehicle for the boundary system. |
| 3 | [`state/id-helpers.ts:43`](../src/state/id-helpers.ts#L43) (inside `safeGetVehicleFromPlayer` wrapper) | Dead — wrapper has zero callers in the codebase. | n/a |

Cache `posDebugVehicleObjIdByPid` consumers:

- [`hud/position-debug.ts:187`](../src/hud/position-debug.ts#L187) — gated by `FEATURE_POSITION_DEBUG`, **which is `false`** ([`config/conquest-constants.ts:7`](../src/config/conquest-constants.ts#L7)) and has been off since v1.190 (80+ versions). Stripped from production bundles.
- [`state/id-helpers.ts:39, :56`](../src/state/id-helpers.ts#L39) — guards inside `safeGetVehicleFromPlayer` (zero callers) and `safeGetPlayerVehicleSeat` (one caller at [`vehicle-events.ts:29`](../src/index/vehicle-events.ts#L29) which fires immediately after the cache is set on line 11 of the same file — the guard always passes).

**Bottom line:** in production builds, call site #1 seeds a cache that nothing reads. It's pure log-noise generation.

## Why the count is "5" per deploy

Most likely Phase 6 / deploy-retry firing `OnPlayerDeployed` multiple times during the seat sequence. v1.288 introduced "poll undeploy completion; retry `DeployPlayer` 3× with 0.4s waits" for HQ Deploy; Forward Deploy may have similar retry paths. Or the errors are aggregated across multiple deploys in the session. The per-fire fix is the same regardless of count.

---

## Recommended fix — Fix A + Fix F

### Fix A — delete the dead cache seed at `player-deploy.ts:65-76`

Remove this block from `onPlayerDeployedImpl`:

```ts
// Sense the actual seated state at deploy -- critical for Air Deploy, where the player
// spawns directly inside a vehicle without an OnPlayerEnterVehicle event. Without this,
// safeGetVehicleFromPlayer returns undefined and classifies an aircraft pilot as on-foot.
delete State.players.posDebugVehicleObjIdByPid[pid];
State.players.posDebugTransformSourceByPid[pid] = "soldier";
try {
    const deployedVehicle = mod.GetVehicleFromPlayer(eventPlayer);
    if (deployedVehicle) {
        State.players.posDebugVehicleObjIdByPid[pid] = getObjId(deployedVehicle);
        State.players.posDebugTransformSourceByPid[pid] = "vehicle";
    }
} catch {}
```

**Why this is safe:**
- `posDebugVehicleObjIdByPid` is consumed only by `FEATURE_POSITION_DEBUG=false`-gated code in production. The seed feeds a dead cache.
- If `FEATURE_POSITION_DEBUG` is ever re-enabled, the cache is still populated by the existing `OnPlayerEnterVehicle` handler at [`vehicle-events.ts:10-12`](../src/index/vehicle-events.ts#L10) for normal deploys. The Air Deploy case (no enter event) loses cache initialization for that feature, which is the position-debug feature's problem to solve, not the boundary system's. The original v1.369 design moved boundary classification to event-driven seatKind, so the boundary system no longer depends on this cache.
- The `safeGetVehicleFromPlayer` and `safeGetPlayerVehicleSeat` wrappers (which gate on the cache) are effectively dead in production and won't be impacted.

**Bundle delta:** estimated ~−100 bytes.

### Fix F — leave `boundary/enforcement.ts:530` as-is

The `probeSeatKindFromEngineState` call site at line 530 is:
- Called only on non-slot deploys (squad/flag spawn into a vehicle — rare, e.g., squad-spawning onto a teammate seated in a passenger slot of a heli).
- Already guarded by `mod.GetSoldierState(IsInVehicle)` returning true on line 524. So `GetVehicleFromPlayer` only fires when the player is genuinely in a vehicle.
- Genuinely needed for boundary correctness: aircraft passengers must classify as `aircraft` so the GCZ exemption applies. There is no event-driven alternative for the squad-spawn-into-aircraft-passenger-seat case (BF6's `OnPlayerEnterVehicle` does not fire for the seat the squad-spawn placed the player into).

If this call ever logs an engine error in practice, that's a separate signal (the player is in a vehicle but the handle is invalid) worth keeping visible. Suppress only if a future playtest shows it firing routinely.

### Files

- [`src/index/player-deploy.ts`](../src/index/player-deploy.ts) — delete lines 65-76 inside `onPlayerDeployedImpl`.

### Bundle / build impact

- Deletion only. Estimated ~−100 bytes.
- Headroom at v1.373: 17,495 bytes (1.67%). Net positive after this change.

---

## Verification

1. Apply changes; bump version: `npm run bumpVersion -- -c "delete dead GetVehicleFromPlayer cache seed in onPlayerDeployedImpl; cache consumed only by FEATURE_POSITION_DEBUG=false code (#93)"`.
2. Build clean (`npm run build`); confirm bundle size delta and headroom.
3. Typecheck clean (`cmd /c npx tsc --pretty false --noEmit` exit 0).
4. Single-player playtest, Firestorm:
   - Forward Deploy a vehicle. Open admin error log. Confirm zero `GetVehicleFromPlayer` engine errors during the deploy sequence.
   - HQ Deploy a vehicle. Same check.
   - Air Deploy an aircraft. Same check.
   - Vanilla deploy (auto-spawned vehicle, walk to it, enter). Same check.
   - On-foot deploy (no vehicle). Same check.
5. Boundary regression check (the v1.369 fix this completes):
   - Forward Deploy ground vehicle. Drive outside the GCZ. Confirm OOB warning appears (boundary classifier still works without the cache).
   - Air Deploy. Fly outside GCZ at altitude. Confirm aircraft is exempt (no false-positive OOB on ground player).
   - Bail from a heli at altitude. Confirm OOB triggers within the post-bail aircraft ceiling check.
6. Squad-spawn smoke test (the `enforcement.ts:530` path that we're leaving alone):
   - Have a teammate in a heli passenger seat. Squad-spawn onto them. Confirm boundary classification is correct (aircraft, not on_foot). If `enforcement.ts:530` fires its own log line in this scenario, that's expected and acceptable.

---

## Out of scope

- **Site #2 (`enforcement.ts:530`).** Leaving as-is per Fix F. Edge case only.
- **Site #3 (`safeGetVehicleFromPlayer`).** Already dead code. Could be deleted in a separate cleanup pass for ~50 more bytes; not worth the risk of an off-by-one in a future feature that wants to re-introduce the cache-gated wrapper. Defer.
- **`FEATURE_POSITION_DEBUG` re-enable.** Independent feature decision; not affected by this fix.

---

## Out of scope (related issues, separate fixes)

- **#94 — `GetInventoryAmmo` engine error on Supply Box menu open.** Same engine-logs-before-JS-catch family. Separate fix planned (mirror the v1.341 `HasEquipment` precheck pattern at the unwrapped call sites in `ammo-resupply-menu.ts`).
- **#3 — `PostSwap_Engage_HUD_FirstEntry`.** Unrelated to this issue.
- **#76 — `Respawn_Redeploy_Timer_Audit`.** Unrelated.
