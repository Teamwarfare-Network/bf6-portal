# Plan: v1.360 — Zone Tracker Refactor (single source of truth)

**Created:** 2026-04-25
**Supersedes:** v1.357 GCZ restore plan (complete) and v1.359 fixes that did not resolve persistent bugs.
**Target version:** v1.360
**Archive after exit:** copy to `bf6-portal/dev/conquest/design_doc/zone_tracker_refactor_plan_2026-04-25.md`.

---

## Context

After v1.357 restored fully custom GCZ enforcement, two bugs survived multiple targeted fix attempts:

1. **HQ-back-walk false negative** — Player HQ-deploys (spawns *inside* main-base trigger 500 or 501), then walks out the back of HQ — i.e. crosses the trigger 500/501 boundary in the direction away from buffer 502/503 and away from GCZ trigger 666. Once they have exited 500/501 and are not inside 502/503 or 666, they should be OOB. Currently they are not flagged because `inMainBaseByPid` stays stuck `true` (set on deploy by distance check, never cleared by the trigger exit event because the area-trigger handler updates it from `IsPlayerInOwnMainBase` only on enter/exit of the *main-base* trigger — and the deploy-time setter overrode the post-exit `false`).
2. **Bail-from-aircraft false negative** — Air-deploy player bails from chopper outside GCZ. They should be OOB but are not flagged.

**Root cause** is structural, not logical: boundary state is spread across **five** independently-written booleans (`inMainBaseByPid`, `inGroundCombatZoneByPid`, `inEnemyMainBaseCoreByPid`, `inEnemyMainBaseBufferByPid`, plus implicit "in own buffer" via the same enemy/own buffer logic), with **multiple write paths**:

- `area-triggers.ts` (`onPlayerEnter/ExitAreaTriggerImpl`) writes `inMainBaseByPid` directly via `IsPlayerInOwnMainBase`.
- `enforcement.ts` (`onPlayerEnter/ExitBoundaryAreaTrigger`) writes the GCZ + enemy-HQ + enemy-buffer flags.
- `player-deploy.ts` line 131 (`classifyDeployInOwnMainBase`) overwrites `inMainBaseByPid` via a **100m distance check** every deploy — silently undoing v1.359's fix that removed the unconditional `=true` setter.
- `resetPlayerBoundaryStateOnDeploy` initializes some flags, leaves others stale.

When two writers disagree about the same player's location, whichever writes last wins, and the classifier reads inconsistent state. v1.359 fixed the unconditional setter but missed the distance-check setter four lines later. The fix loop will repeat for every future bug until the architecture changes.

**Intended outcome:** Replace the 5 scattered flags with a single `PlayerZoneState` record updated through one function. All trigger enter/exit events (HQ, buffer, GCZ for both teams) feed into this one function. The classifier becomes a pure read with no fallback / no derivation surprises. The persistent bugs disappear because there is no longer a place for a stale flag to hide.

---

## Design

### Single source of truth

```typescript
type PlayerZoneState = {
    inOwnHQ: boolean;        // trigger 500 (T2) or 501 (T1) for own team
    inOwnBuffer: boolean;    // trigger 502 (T2) or 503 (T1) for own team
    inGCZ: boolean;          // trigger 666
    inEnemyHQ: boolean;      // 500 or 501 for enemy team
    inEnemyBuffer: boolean;  // 502 or 503 for enemy team
};
State.round.boundary.zoneStateByPid: Record<number, PlayerZoneState>;
```

Default record (used on deploy reset) is all `false`. The trigger event for the zone the player spawns inside fires synchronously (HQ deploy → `onPlayerEnterAreaTrigger` for HQ trigger fires); see grace period below for the rare miss.

### Single write path

```typescript
function updateZoneStateOnTriggerTransition(
    player: mod.Player,
    triggerObjId: number,
    entered: boolean
): void {
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return;
    const teamId = safeGetTeamNumberFromPlayer(player, 0);
    if (teamId !== TeamID.Team1 && teamId !== TeamID.Team2) return;

    const ownHqId   = teamId === TeamID.Team1 ? getOwnMainBaseTriggerIdForTeam(TeamID.Team1) : getOwnMainBaseTriggerIdForTeam(TeamID.Team2);
    const ownBufId  = teamId === TeamID.Team1 ? getOwnMainBaseBufferTriggerIdForTeam(TeamID.Team1) : getOwnMainBaseBufferTriggerIdForTeam(TeamID.Team2);
    const enemyHqId = teamId === TeamID.Team1 ? getOwnMainBaseTriggerIdForTeam(TeamID.Team2) : getOwnMainBaseTriggerIdForTeam(TeamID.Team1);
    const enemyBufId= teamId === TeamID.Team1 ? getOwnMainBaseBufferTriggerIdForTeam(TeamID.Team2) : getOwnMainBaseBufferTriggerIdForTeam(TeamID.Team1);
    const gczId     = getGroundCombatZoneTriggerId();

    const state = (State.round.boundary.zoneStateByPid[pid] ??= {
        inOwnHQ: false, inOwnBuffer: false, inGCZ: false, inEnemyHQ: false, inEnemyBuffer: false,
    });

    if (triggerObjId === ownHqId)        state.inOwnHQ       = entered;
    else if (triggerObjId === ownBufId)  state.inOwnBuffer   = entered;
    else if (triggerObjId === gczId)     state.inGCZ         = entered;
    else if (triggerObjId === enemyHqId) state.inEnemyHQ     = entered;
    else if (triggerObjId === enemyBufId)state.inEnemyBuffer = entered;
    else return;

    // Mirror to legacy flag for downstream consumers that have not been migrated.
    State.players.inMainBaseByPid[pid] = state.inOwnHQ;

    refreshPlayerBoundaryState(player);
}
```

### Single read path (classifier)

```typescript
function getDesiredBoundaryViolationKind(player: mod.Player): BoundaryPromptKind | undefined {
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return undefined;
    const state = State.round.boundary.zoneStateByPid[pid];
    if (!state) return undefined;

    // Pre-live: own-HQ enforcement (existing behavior, preserved)
    if (!isLivePhase()) {
        return state.inOwnHQ ? undefined : "main_base_pre_live";
    }

    // Live: own HQ exempts everything
    if (state.inOwnHQ) return undefined;

    // Enemy zones
    if (state.inEnemyHQ)     return "enemy_main_base";
    if (state.inEnemyBuffer) return "enemy_main_base_buffer";

    // Grace window after deploy: trigger enter events may not have settled yet
    const deployedAt = State.players.deployedAtSecondsByPid?.[pid];
    if (deployedAt !== undefined && (mod.GetMatchTimeElapsed() - deployedAt) < GCZ_DEPLOY_GRACE_SECONDS) {
        return undefined;
    }

    // Aircraft pilots/passengers exempt from script GCZ
    const seatedVehicle = safeGetVehicleFromPlayer(player);
    if (seatedVehicle && isAircraftVehicleInstance(seatedVehicle)) return undefined;

    // Foot or non-aircraft vehicle: must be inside GCZ or own buffer
    const inSafeGround = state.inGCZ || state.inOwnBuffer;
    if (!inSafeGround) return "ground_combat_zone";

    // Belt-and-braces foot Y-ceiling
    if (!seatedVehicle) {
        try {
            const pos = safeGetSoldierStateVector(player, mod.SoldierStateVector.GetPosition);
            if (pos && mod.YComponentOf(pos) > AIRCRAFT_BAIL_CEILING_Y) return "ground_combat_zone";
        } catch {}
    }

    return undefined;
}
```

The classifier reads, does not write. No fallback flags, no distance checks, no spawn-mode short-circuits.

---

## Critical files to modify

### 1. `src/state/runtime-types.ts` (around line 314)

In the `boundary` shape:
- **Remove**: `inGroundCombatZoneByPid`, `inEnemyMainBaseCoreByPid`, `inEnemyMainBaseBufferByPid`.
- **Add**: `zoneStateByPid: Record<number, PlayerZoneState>;`

Define `PlayerZoneState` type adjacent (export from runtime-types so enforcement.ts can reference it without circular imports).

In `players` shape: add `deployedAtSecondsByPid: Record<number, number>;` for grace-period check.

### 2. `src/state/runtime-state.ts` (around line 66)

In the `boundary` initializer:
- **Remove**: the three deleted record initializers above.
- **Add**: `zoneStateByPid: {},`

In the `players` initializer: add `deployedAtSecondsByPid: {},`.

### 3. `src/boundary/enforcement.ts`

Six edits:

**(a)** Add `GCZ_DEPLOY_GRACE_SECONDS = 1.5` near other duration constants.

**(b)** Add `updateZoneStateOnTriggerTransition` (full body above).

**(c)** Rewrite `onPlayerEnterBoundaryAreaTrigger` to a single line: `updateZoneStateOnTriggerTransition(player, triggerObjId, true);` — remove every triggerId == X branch.

**(d)** Mirror `onPlayerExitBoundaryAreaTrigger`: `updateZoneStateOnTriggerTransition(player, triggerObjId, false);`

**(e)** Rewrite `getDesiredBoundaryViolationKind` (full body above), removing all reads of the deleted flags and all references to `classifyDeployInOwnMainBase`.

**(f)** `resetPlayerBoundaryStateOnDeploy(player, pid)`:
- `delete State.round.boundary.zoneStateByPid[pid];` — clear stale state from prior round/life.
- Set `State.players.deployedAtSecondsByPid[pid] = mod.GetMatchTimeElapsed();` — start grace window.
- Trigger enter events fire synchronously inside spawn fulfillment for whatever zone the player lands in, so the next-tick read is accurate. Grace covers the rare missed event.

**(g)** `resetPlayerBoundaryStateOnUndeployOrReset(pid)`:
- `delete State.round.boundary.zoneStateByPid[pid];`
- `delete State.players.deployedAtSecondsByPid?.[pid];`
- Remove deletes for the three retired flags.

### 4. `src/index/area-triggers.ts`

In `onPlayerEnterAreaTriggerImpl` and `onPlayerExitAreaTriggerImpl`:
- **Delete** the direct writes to `State.players.inMainBaseByPid` via `IsPlayerInOwnMainBase`. The mirror inside `updateZoneStateOnTriggerTransition` is now the only writer.
- The existing tail call to `onPlayerEnterBoundaryAreaTrigger` / `onPlayerExitBoundaryAreaTrigger` becomes the single update path.

### 5. `src/index/player-deploy.ts`

- **Delete** the entire `classifyDeployInOwnMainBase` function (lines 9–29).
- **Delete** the call at line 131 (the `State.players.inMainBaseByPid[pid] = classifyDeployInOwnMainBase(...)` block including the comment about overwriting the optimistic seed).
- **Delete** the `pendingDirectSpawnMode` and `directSpawnDeployResult` locals at lines 124–125 if they are only used by the deleted call (verify with grep — the `if (directSpawnDeployResult.consumedDeploy) return;` at line 142 also goes; that branch never fires now).
- The vehicle-cache probe at lines 96–104 stays (it correctly seeds `posDebugTransformSourceByPid` for the HUD path).

### 6. Downstream consumers of `inMainBaseByPid` (verify, do not refactor)

`world-interactables.ts:94` and `takeoff-gating.ts:7` (per Task 7 in summary) read `inMainBaseByPid`. These keep working because `updateZoneStateOnTriggerTransition` mirrors `inOwnHQ → inMainBaseByPid` on every transition. **No edit needed**, but verify via grep that no other callers depend on the deleted/changed flags.

---

## Out of scope

- `SetMaxVehicleHeightLimitScale` aircraft ceiling (mode-config-aircraft-ceiling.ts) — orthogonal feature, untouched.
- SDK Surrounding Area calls — already removed in v1.357, do not reintroduce.
- Spatial trigger geometry — user authored, do not modify.
- Any new map configs — only Operation Firestorm.
- String keys — all already exist.

---

## Verification / test plan

After implementation, version bump, and build:

### Bug-repro scenarios (the two that drove this refactor)

1. **HQ-back-walk**: HQ-deploy on Team 1 (spawn inside trigger 501), walk out the back of trigger 501 (away from buffer 503 and away from GCZ 666). **Trigger event chain:** `onPlayerExitAreaTrigger(triggerObjId=501)` fires → `updateZoneStateOnTriggerTransition(player, 501, false)` → `state.inOwnHQ = false`, mirrors to `inMainBaseByPid = false` → `refreshPlayerBoundaryState` runs classifier → not inOwnHQ, not in GCZ, not in own buffer → returns `"ground_combat_zone"`. **Expected:** within ~1s of crossing the trigger 501 exit edge, "YOU ARE OUT OF BOUNDS" + 10s kill countdown.
2. **Bail-from-chopper**: Air-deploy a heli, fly outside GCZ 666 (still inside AirCombatVolume), bail. **Expected:** within ~1s of bail, OOB warning + countdown.

### Regression matrix

3. HQ deploy → no warning (own HQ exempts).
4. Forward deploy (inside GCZ 666) → no warning.
5. Air deploy (heli/jet) → no warning, then fly out of GCZ → still no warning (aircraft exempt). Fly out of AirCombatVolume → vanilla engine grey-zone (untouched).
6. Foot inside GCZ → no warning. Foot above Y=200 inside GCZ → OOB.
7. Tank/CV90/Bradley inside GCZ → no warning. Same vehicle outside GCZ → OOB.
8. Foot enters enemy HQ trigger → "enemy main base" violation. Enters enemy buffer → buffer violation.
9. Foot in own buffer (502/503) → no warning (own buffer is safe ground).
10. Pre-live phase → only "main_base_pre_live" enforcement, no GCZ.
11. Match end → no stuck warning HUD.
12. Late joiner → grace period prevents flicker; trigger enter on spawn populates state.

### Build health

- `npm run bumpVersion -- -c "Refactor boundary state to single PlayerZoneState; one update path; classifier is pure read; fixes HQ-back-walk and bail-from-chopper false negatives"`
- `npm run build` → PASS, bundle below 1,048,576 bytes.
- `cmd /c npx tsc --pretty false --noEmit` → exit 0.
- Bundle size expected to **decrease slightly** vs v1.359 (1,030,484 bytes) — net deletion of `classifyDeployInOwnMainBase` + scattered branches outweighs the new PlayerZoneState plumbing.

---

## Design doc updates (post-implementation)

- `design_doc/TWL_Conquest_Design.md` — boundary section: replace flag-list description with `PlayerZoneState` record + single update path.
- `design_doc/conquest_issues.md` — close the v1.358–v1.359 bug arc with `CQ_Feat_Zone_Tracker_Refactor` entry: structural fix (one writer, one reader), not another targeted patch.
- `design_doc/zone_tracker_refactor_plan_2026-04-25.md` — frozen archive of this plan after exit.
