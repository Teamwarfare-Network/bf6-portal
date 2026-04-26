# Plan: Disable HQ Supply Boxes when Match goes LIVE

**Created:** 2026-04-26
**Target ship:** v1.394
**Issue:** new — `CQ_Tweak_HQ_SupplyBox_Disable_OnLive` (#108 — to be logged at implementation time)

---

## Context

The user wants HQ-located supply boxes to disappear (interact point disabled, yellow smoke VFX hidden) when the match goes LIVE. Non-HQ supply boxes (the ones at flags / between flags) should remain available throughout the match.

**Why:** Currently all 8 supply boxes on Firestorm are equally available pre-LIVE and during LIVE. Two of those eight (objIds 1056 and 1057) sit inside each team's main base. Once the match is live, players should be incentivized to leave their HQ to resupply — that means the in-HQ resupply convenience should be removed. Non-HQ boxes (1050-1055) remain available to support gadget cooldown management mid-fight.

The scope is a small data marker + a runtime gate in two places (interact-point enable, VFX spawn) plus a one-time refresh call at the live transition for snappy UX.

---

## Critical findings from exploration

1. **No existing HQ-supply-box classifier in config.** All 8 supply boxes on Firestorm are `ownerTeamId: 0` (neutral), `scope: "point"`, identical `vfx: VFX_YELLOW_SMOKE`. The HQ ones (1056, 1057) are differentiated only by position (~35-40m from each team base anchor). Need an explicit data field — position math is brittle.
2. **Two control points** for "is this supply box active":
   - **Interact point** — `shouldEnableWorldInteractableAuthoredInteractPoint(config)` at [world-interactables.ts:70-73](../src/interaction/world-interactables.ts#L70-L73). Currently checks `isSupplyBoxesEnabled()`. Called from `applyWorldInteractableAuthoredInteractPointState(config)`.
   - **VFX spawn** — `spawnWorldInteractableVfxForActiveConfigs()` at [world-interactables.ts:217-238](../src/interaction/world-interactables.ts#L217-L238) and `ensureWorldInteractableVfxForConfig(config)` (~lines 266-284). Both check `isSupplyBoxesEnabled()`. The first runs every second from the game-loop's onSecond pass.
3. **Match-live transition is a single hook:** `startMatch()` at [conquest-flow.ts:21-61](../src/conquest-flow.ts#L21-L61) sets `phase = MatchPhase.Live` and is the only entry point. Already calls `cleanupMainBaseTeamWorldIconsForLiveTransition()` (line ~32) — that's the natural insertion point for our HQ-supply-box despawn.
4. **`isMatchLive()` is a pure read:** `State.round.phase === MatchPhase.Live` ([state/core.ts:19-20](../src/state/core.ts#L19-L20)). Available everywhere; no need to thread a flag.
5. **VFX hide API:** `despawnWorldInteractableVfxForObjId(objId)` at [world-interactables.ts:256-262](../src/interaction/world-interactables.ts#L256-L262) calls `mod.UnspawnObject(vfx)` and clears the cache entry. Existing helper, no new API needed.

---

## Design choice

Per user direction (2026-04-26): **add a generic per-supply-box flag at the map-config level that marks which boxes should be disabled when the match goes LIVE.** The field is generic and authoring-friendly — any future map author can set this on whichever boxes they want hidden during LIVE play, not tied to "HQ" semantics.

**Field name:** `disableOnLive?: boolean` on the map-config gadget-interactable anchor entry. Default undefined/false (historical behavior — box stays available during LIVE). Set `disableOnLive: true` on individual entries to opt that box out during LIVE.

**Why a flag instead of position math:** position-based detection (distance to team-base anchor) requires radius tuning per map and repeats math every gate call. An explicit data flag is authored once per box, is obvious in the per-map config file, scales cleanly to new maps, and has zero runtime cost beyond a boolean check.

**Why NOT extend the `scope` enum:** existing `scope: "main_base"` is reserved for HQ terminals (ready dialog, vehicle deploy) and engages other code paths in the runtime icon system that don't apply to supply boxes. So this is a separate optional flag, not a scope-value expansion.

---

## Files to modify

| File | Change |
|------|--------|
| [`src/config/types.ts`](../src/config/types.ts) | Add `disableOnLive?: boolean` to the gadget-interactable anchor type AND to `WorldInteractableConfig` (so the flag flows from map-config to runtime config). |
| [`src/config/maps/operation-firestorm.ts`](../src/config/maps/operation-firestorm.ts) | Set `disableOnLive: true` on the two HQ-located gadget interactable anchors (objIds **1056** at Team1 HQ, **1057** at Team2 HQ). |
| [`src/config/map-runtime.ts`](../src/config/map-runtime.ts) | In `buildWorldInteractableConfigsFromMapConfig()` (the function that converts gadgetInteractable anchors into `open_ammo_resupply_menu` configs at line ~289-338), preserve `disableOnLive` from the source anchor onto the constructed runtime config. |
| [`src/interaction/world-interactables.ts`](../src/interaction/world-interactables.ts) | Add `isWorldInteractableDisabledByLive(config)` helper; use in `shouldEnableWorldInteractableAuthoredInteractPoint`, `spawnWorldInteractableVfxForActiveConfigs`, and `ensureWorldInteractableVfxForConfig`. New `refreshDisableOnLiveInteractableStateForLiveTransition()` function for immediate update at match-live. |
| [`src/conquest-flow.ts`](../src/conquest-flow.ts) | In `startMatch()`, call `refreshDisableOnLiveInteractableStateForLiveTransition()` after the existing `cleanupMainBaseTeamWorldIconsForLiveTransition()` call. |

No string changes. No new constants. No bundle pressure beyond ~150-250 bytes for the helper + per-config field carry-through.

---

## Change set

### 1. Type field

In `src/config/types.ts`:
- Add `disableOnLive?: boolean` to the gadget-interactable anchor entry type (the type used in `gadgetInteractableAnchors` or equivalent on `MapConfig`).
- Add `disableOnLive?: boolean` to `WorldInteractableConfig` (the runtime config built from map data).

Default undefined/false → historical behavior (interactable stays available during LIVE).

### 2. Mark the two HQ supply boxes

`src/config/maps/operation-firestorm.ts` lines 44-45 (the existing entries for 1056 and 1057):
- objId 1056 (Team1 HQ supply box): add `disableOnLive: true`
- objId 1057 (Team2 HQ supply box): add `disableOnLive: true`

The other 6 entries (1050-1055, at flags / between flags) stay unchanged — flag defaults to undefined/false → they remain available during LIVE.

### 3. Carry the field through config build

In `buildWorldInteractableConfigsFromMapConfig()` at `src/config/map-runtime.ts`, when constructing each `open_ammo_resupply_menu` config from the source anchor entry, copy `disableOnLive` from the source onto the constructed runtime config object. (One-line addition where the config is built.)

### 4. Runtime gate helper + integration

In `src/interaction/world-interactables.ts`, add:

```ts
// Returns true when the world-interactable is flagged disableOnLive in the map config
// AND the match is currently LIVE. Generic gate: works for any interactable type that
// carries the flag, though the immediate use case is HQ supply boxes. Non-flagged
// interactables and non-live phases bypass entirely (existing rules still apply).
function isWorldInteractableDisabledByLive(config: WorldInteractableConfig): boolean {
    if (config.disableOnLive !== true) return false;
    return isMatchLive();
}
```

Update three call sites:

**4a. `shouldEnableWorldInteractableAuthoredInteractPoint`** (lines 70-73):
```ts
function shouldEnableWorldInteractableAuthoredInteractPoint(config: WorldInteractableConfig): boolean {
    if (isSupplyBoxWorldInteractable(config) && !isSupplyBoxesEnabled()) return false;
    if (isWorldInteractableDisabledByLive(config)) return false;
    return true;
}
```

**4b. `spawnWorldInteractableVfxForActiveConfigs`** (line ~221, the gate before spawn):
```ts
if (isSupplyBoxWorldInteractable(config) && !isSupplyBoxesEnabled()) continue;
if (isWorldInteractableDisabledByLive(config)) continue;  // NEW
```

**4c. `ensureWorldInteractableVfxForConfig`** — same gate, same place.

### 5. Live-transition refresh helper

Add to `world-interactables.ts`:
```ts
// Immediately disables every disableOnLive-flagged world-interactable (interact point + VFX)
// on match-live transition. Without this, the natural per-second refresh would still pick
// up the new state but with up to ~1s of stale VFX visible after match start.
function refreshDisableOnLiveInteractableStateForLiveTransition(): void {
    for (let i = 0; i < ACTIVE_WORLD_INTERACTABLE_CONFIGS.length; i++) {
        const config = ACTIVE_WORLD_INTERACTABLE_CONFIGS[i];
        if (config.disableOnLive !== true) continue;
        applyWorldInteractableAuthoredInteractPointState(config);
        despawnWorldInteractableVfxForObjId(config.objId);
    }
}
```

### 6. Wire into `startMatch()`

In `src/conquest-flow.ts` `startMatch()`, after `cleanupMainBaseTeamWorldIconsForLiveTransition()`:
```ts
cleanupMainBaseTeamWorldIconsForLiveTransition();
refreshDisableOnLiveInteractableStateForLiveTransition();  // NEW
```

By this point in `startMatch()`, `State.round.phase = MatchPhase.Live` has already been set, so `isMatchLive()` returns true inside the helper.

---

## What this does NOT cover

- **Re-enable on match end.** When a match ends and resets to NotReady, the disableOnLive-flagged interactables should re-appear. The existing per-second refresh paths (`ensureActiveWorldInteractablesReady` / `applyWorldInteractableAuthoredInteractPointState` triggered by Apply Config or similar) will pick up the new `!isMatchLive()` state and re-enable. May need an explicit refresh call at match-end if there's a visible delay; **defer to playtest**.
- **Other maps.** Only Firestorm has `disableOnLive: true` set. When new maps are added, the map author chooses which interactables (if any) to mark with the flag. Generic by design — flag could be applied to any future world-interactable type beyond supply boxes if a similar "available pre-LIVE only" UX is wanted.
- **Visual polish.** No fade/dissolve on the VFX disappearing — it just unspawns instantly at the live transition. If that pop is jarring, can layer in `mod.EnableVFX(vfx, false)` followed by a delayed unspawn in a follow-up.

---

## Bundle / build impact

**Estimated total: ~250 bytes.** Headroom at v1.393 is 12,828 bytes (1.22%) — comfortable.

---

## Verification

### Build / typecheck
1. `npm run bumpVersion -- -c "disable HQ supply boxes (interact point + yellow smoke VFX) when match goes LIVE; non-HQ supply boxes unchanged"` → v1.394.
2. `npm run build` PASS (expect ~1,036,000 bytes).
3. `cmd /c npx tsc --pretty false --noEmit` exit 0.

### Behavioral tests (MP playtest)
1. **Pre-LIVE state:** open Ready Dialog, do not start the match. Confirm all 8 supply boxes on Firestorm have yellow smoke visible and interact prompts work (HQ + flag locations).
2. **Match-live transition:** start match. Within 1s of LIVE, confirm:
   - Yellow smoke disappears from HQ supply boxes (objIds 1056 at Team1 HQ, 1057 at Team2 HQ).
   - Interact prompt at HQ supply boxes no longer appears.
3. **Non-HQ unchanged:** confirm the 6 flag/between-flag supply boxes (1050-1055) keep their yellow smoke and remain interactable during LIVE.
4. **Re-enable on match end:** end match. Confirm HQ supply boxes re-appear in the next match's pre-LIVE phase.
5. **Apply Config + Supply Boxes toggle interaction:** toggle "Supply Boxes" off → all 8 disappear. Toggle on → all 8 reappear (pre-LIVE). Start match → only 6 remain.

### Issue tracker
- Log `CQ_Tweak_HQ_SupplyBox_Disable_OnLive` (#108) in `conquest_issues.md` + summary. Status at ship: **Resolved (pending MP confirm)**.
