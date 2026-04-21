# Plan: Wire Supply Boxes Checkbox to Ammo-Resupply Gadgets

**Created:** 2026-04-19
**Status:** Drafted for review.
**Base:** v1.324 (post ready-dialog top-border raise).
**Supersedes:** Earlier UI-only plan (shipped v1.315–v1.324).

---

## Context

The previous change added a `Supply Boxes` checkbox (and backing `State.round.modeConfig.supplyBoxesEnabled` + its `confirmed` mirror) to the ready dialog. Right now the field is written but read by nothing.

This change wires it up so the checkbox actually controls the ammo-resupply supply-crate gadgets:

- **Checked (default):** yellow smoke VFX spawns, authored InteractPoint is enabled, `open_ammo_resupply_menu` opens for players — current behavior.
- **Unchecked:** no smoke, no interact prompt, no menu — the gadgets are effectively gone for players.

Per user decision: the toggle must take effect **immediately on Apply** during pre-LIVE warmup (matches the `confirmed` pattern used by other settings). Mid-match toggling is impossible by existing design — the ready dialog disallows config changes once `isMatchLive()`.

Non-goal: Air Deploy and Forward Deploy wiring — those are separate future work.

---

## How it works today (confirmed by research)

- The `ACTIVE_WORLD_INTERACTABLE_CONFIGS` array holds all interact configs, built in [map-runtime.ts:279](bf6-portal/dev/conquest/src/config/map-runtime.ts#L279) from map-authored object IDs. Three action types live in it: `open_ready_dialog`, `open_vehicle_spawn_menu`, `open_ammo_resupply_menu`. Only the last is a supply-box gadget.
- Three call sites produce the supply box's player-visible behavior:
  1. **VFX (yellow smoke)** — [world-interactables.ts:203 `spawnWorldInteractableVfxForActiveConfigs()`](bf6-portal/dev/conquest/src/interaction/world-interactables.ts#L203). Iterates every config, spawns `config.vfx` once, caches by `objId` in `State.conquest.worldInteractableVfxHandleByObjId`. Called at mode-start from [game-mode.ts:29](bf6-portal/dev/conquest/src/game-mode.ts#L29).
  2. **Authored InteractPoint** — [world-interactables.ts:62 `applyWorldInteractableAuthoredInteractPointState()`](bf6-portal/dev/conquest/src/interaction/world-interactables.ts#L62) calls `mod.EnableInteractPoint(..., shouldEnableWorldInteractableAuthoredInteractPoint(config))`. That predicate at [world-interactables.ts:57](bf6-portal/dev/conquest/src/interaction/world-interactables.ts#L57) currently returns `true` unconditionally.
  3. **Menu activation** — [world-interactables.ts:92 `shouldAllowWorldInteractableActivationForPlayer()`](bf6-portal/dev/conquest/src/interaction/world-interactables.ts#L92). For `open_ammo_resupply_menu` it short-circuits to `return true`, and [line 349-351](bf6-portal/dev/conquest/src/interaction/world-interactables.ts#L349-L351) dispatches to `openArmMenu()`.
- `cleanupWorldInteractableVfx()` at [world-interactables.ts:227](bf6-portal/dev/conquest/src/interaction/world-interactables.ts#L227) tears down **all** cached VFX — too coarse for per-toggle use; we need a per-config variant.
- Open ammo-resupply menus can be force-closed via [ammo-resupply-menu.ts:2223 `closeArmMenu(eventPlayer: mod.Player | number)`](bf6-portal/dev/conquest/src/interaction/ammo-resupply-menu.ts#L2223). It accepts either a `Player` or a raw `pid`, short-circuits if the menu isn't open (`isArmOpen(pid)` check), clears `State.players.lockerSlots[pid]`, hides cached widgets, and restores the UI input mode. Safe to call for every player.
- The confirmed-state commit lives in [mode-config-presets.ts:294 `confirmReadyDialogModeConfig()`](bf6-portal/dev/conquest/src/ready-dialog/mode-config-presets.ts#L294); `supplyBoxesEnabled` is already copied into `cfg.confirmed` at [line 315](bf6-portal/dev/conquest/src/ready-dialog/mode-config-presets.ts#L315).
- Pattern to mirror: `isVanillaDeployMode()` in [vanilla-spawner.ts:74](bf6-portal/dev/conquest/src/vehicles/vanilla-spawner.ts#L74) reads `State.round.modeConfig.confirmed.vehicleDeployMethod ?? <default>`. Use the same `confirmed.<field> ?? <default>` shape.

---

## Design

### 1. Two helpers, one module

Add to [world-interactables.ts](bf6-portal/dev/conquest/src/interaction/world-interactables.ts) near the top of the file:

```ts
// A "supply box" interactable is any world interactable whose action opens the ammo resupply menu.
// This is the discriminator used to gate spawning/interacting based on the Supply Boxes checkbox.
function isSupplyBoxWorldInteractable(config: WorldInteractableConfig): boolean {
    return config.action === "open_ammo_resupply_menu";
}

// Reads the confirmed Supply Boxes toggle state. Defaults true so first-match spawn (before any
// Apply has happened) behaves as if checked.
function isSupplyBoxesEnabled(): boolean {
    return State.round.modeConfig.confirmed.supplyBoxesEnabled ?? true;
}
```

### 2. Gate at each of the three call sites

**VFX spawn** — inside the `spawnWorldInteractableVfxForActiveConfigs` loop, after the `config.vfx`/`iconAnchorPos` early-outs:
```ts
if (isSupplyBoxWorldInteractable(config) && !isSupplyBoxesEnabled()) continue;
```

**InteractPoint enablement** — change `shouldEnableWorldInteractableAuthoredInteractPoint` from `return true` to:
```ts
function shouldEnableWorldInteractableAuthoredInteractPoint(config: WorldInteractableConfig): boolean {
    if (isSupplyBoxWorldInteractable(config) && !isSupplyBoxesEnabled()) return false;
    return true;
}
```

**Menu activation** — adjust `shouldAllowWorldInteractableActivationForPlayer`:
```ts
if (config.action === "open_ammo_resupply_menu") {
    return isSupplyBoxesEnabled();
}
```

These three together mean any call that re-evaluates the gates (re-spawn VFX, re-apply InteractPoint state, attempt activation) gets the correct current state. The activation gate is a defensive belt-and-suspenders; if the InteractPoint somehow remains enabled after a disable, the menu still won't open.

### 3. Apply-time resync of already-spawned state

Because mode-start's spawn loop runs before the user ever Applies anything, and a later toggle must affect the world right away, add a resync function in [world-interactables.ts](bf6-portal/dev/conquest/src/interaction/world-interactables.ts):

```ts
// Despawns a single cached VFX by objId (partial counterpart of cleanupWorldInteractableVfx).
function despawnWorldInteractableVfxForObjId(objId: number): void {
    const cache = State.conquest.worldInteractableVfxHandleByObjId;
    const vfx = cache[objId];
    if (!vfx) return;
    try { mod.UnspawnObject(vfx); } catch {}
    delete cache[objId];
}

// Spawns VFX for a single config if not already cached. Shares logic with the bulk spawner;
// guarded by the Supply Boxes gate so it no-ops when supply boxes are disabled.
function ensureWorldInteractableVfxForConfig(config: WorldInteractableConfig): void {
    if (isSupplyBoxWorldInteractable(config) && !isSupplyBoxesEnabled()) return;
    if (!config.vfx || !config.iconAnchorPos) return;
    const cache = State.conquest.worldInteractableVfxHandleByObjId;
    if (cache[config.objId]) return;
    try {
        const spawned = mod.SpawnObject(config.vfx, config.iconAnchorPos, config.vfxRot ?? WORLD_INTERACTABLE_ZERO_ROT);
        if (mod.IsType(spawned, mod.Types.VFX)) {
            const vfx = spawned as mod.VFX;
            mod.EnableVFX(vfx, true);
            mod.SetVFXScale(vfx, 1);
            cache[config.objId] = vfx;
        }
    } catch {}
}

// Called after confirmReadyDialogModeConfig to reflect the newly-confirmed Supply Boxes state on
// already-present gadgets: re-evaluates InteractPoint enablement, syncs VFX to match, and if
// disabling, force-closes any ammo-resupply menu a player currently has open.
function refreshSupplyBoxInteractableStateFromConfirmedConfig(): void {
    const enabled = isSupplyBoxesEnabled();
    for (let i = 0; i < ACTIVE_WORLD_INTERACTABLE_CONFIGS.length; i++) {
        const config = ACTIVE_WORLD_INTERACTABLE_CONFIGS[i];
        if (!isSupplyBoxWorldInteractable(config)) continue;
        applyWorldInteractableAuthoredInteractPointState(config); // picks up the new gate
        if (enabled) {
            ensureWorldInteractableVfxForConfig(config);
        } else {
            despawnWorldInteractableVfxForObjId(config.objId);
        }
    }
    if (!enabled) forceCloseAllOpenSupplyBoxMenus();
}

// When Supply Boxes is disabled mid-warmup, boot any player who has the ammo-resupply menu open
// back to normal play. closeArmMenu no-ops for PIDs without an open menu, so it's safe to sweep.
function forceCloseAllOpenSupplyBoxMenus(): void {
    const cache = State.hudCache.ammoResupplyMenuCache;
    if (!cache) return;
    for (const key in cache) {
        const pid = Number(key);
        if (!isArmOpen(pid)) continue;
        try { closeArmMenu(pid); } catch {}
    }
}
```

### 4. Hook the resync into the Apply path

In [mode-config-presets.ts:294 `confirmReadyDialogModeConfig`](bf6-portal/dev/conquest/src/ready-dialog/mode-config-presets.ts#L294), after the existing confirmed-block assignment (line 315) and the other apply-time refresh calls (~line 329–333), append:

```ts
refreshSupplyBoxInteractableStateFromConfirmedConfig();
```

No changes to `resetReadyDialogModeConfigToDefaults` (it already resets `supplyBoxesEnabled` to true in draft; the next Apply propagates) and no changes to preset-apply (same reasoning). `confirmReadyDialogModeConfig` is the single funnel for "settings took effect".

### 5. Mode-start behavior

No change needed. At mode-start, `State.round.modeConfig.confirmed.supplyBoxesEnabled` is whatever `applyMapConfig()` seeded (true by default per [map-runtime.ts:662](bf6-portal/dev/conquest/src/config/map-runtime.ts#L662)), so `spawnWorldInteractableVfxForActiveConfigs()` + `configureActiveWorldInteractables()` already produce the correct initial state through the new gates in §2.

---

## Files touched

| File | Change |
|---|---|
| `src/interaction/world-interactables.ts` | Add `isSupplyBoxWorldInteractable`, `isSupplyBoxesEnabled`, `despawnWorldInteractableVfxForObjId`, `ensureWorldInteractableVfxForConfig`, `refreshSupplyBoxInteractableStateFromConfirmedConfig`, `forceCloseAllOpenSupplyBoxMenus`. Gate VFX spawn loop, `shouldEnableWorldInteractableAuthoredInteractPoint`, and the `open_ammo_resupply_menu` branch of `shouldAllowWorldInteractableActivationForPlayer`. |
| `src/ready-dialog/mode-config-presets.ts` | Call `refreshSupplyBoxInteractableStateFromConfirmedConfig()` at end of `confirmReadyDialogModeConfig`. |
| `src/Changelog.ts` + version files | Bump via `node scripts/bump-version.js --comment="..."`. |
| `design_doc/conquest_issues.md` | Update the `CQ_Feat_ReadyDialog_Config_Checkboxes_UI_Seed` entry: Supply Boxes is now wired; Air / Forward remain UI-only. |
| `design_doc/supply_boxes_wiring_plan_2026-04-19.md` | New — copy of this plan for historical reference (mirrors the earlier `ready_dialog_config_checkboxes_plan_2026-04-19.md` precedent). |

**Explicitly NOT touched:**
- `src/interaction/ammo-resupply-menu.ts` — we only *call* the existing `closeArmMenu` / `isArmOpen`; no internal changes.
- `src/config/map-runtime.ts` — default-seeding stays true.
- `src/ready-dialog/*` — no UI or state-shape changes.
- Air / Forward deploy code paths — explicit future work.

---

## Risks and mitigations

1. **Other `action` values get misclassified as supply boxes.** Mitigation: `isSupplyBoxWorldInteractable` keys off exact string `"open_ammo_resupply_menu"`; `open_ready_dialog` and `open_vehicle_spawn_menu` are untouched.
2. **VFX despawn leaving a hidden InteractPoint that still triggers.** Mitigation: `refreshSupplyBoxInteractableStateFromConfirmedConfig` calls `applyWorldInteractableAuthoredInteractPointState` which now respects the gate, and the activation-path gate in §2 is a final backstop.
3. **Late joiner syncs during a supply-boxes-off round.** Each join path would re-run mode-start initialization which reads the live-set `confirmed` and gates correctly via §2 — no extra plumbing.
4. **Default-true fallback masking a bug.** If `confirmed.supplyBoxesEnabled` is ever `undefined` we render the gadgets as enabled. This is intentional (matches legacy behavior) but noted.
5. **Mid-match toggle attempt.** Impossible via current UI: the dialog blocks changes once `isMatchLive()`. No runtime check needed.

---

## Verification

**Build:**
- `node scripts/bump-version.js --comment="<msg>"` (runs build + size check)
- Confirm bundle under 1,048,576 bytes.

**Functional matrix (pre-LIVE, single-player smoke test):**
1. Default round: yellow smoke visible at supply crates, interact prompt shows, menu opens.
2. Open ready dialog, uncheck Supply Boxes, Apply. Within ~1s: smoke despawns at every supply crate; walking up produces no interact prompt; hitting interact key does nothing.
2a. Open a supply box menu, then WITHOUT closing it open the ready dialog (another player via admin panel, or self if UX allows), uncheck Supply Boxes, Apply. The open ammo-resupply menu force-closes and input returns to normal play.
3. Re-check Supply Boxes, Apply. Smoke returns; prompts return; menu reopens.
4. Uncheck Supply Boxes, Apply, Ready up, LIVE transition. During LIVE: still no smoke / no prompts / no menu.
5. Check Supply Boxes, Apply, Ready up, LIVE. Full functionality during LIVE.
6. Reset-to-Defaults button → Apply. Supply Boxes goes back to checked and state reconciles.

**Regression checks (feature isolation):**
7. HQ deploy flow (ready-dialog and vehicle-spawn-menu interactables) works identically with Supply Boxes both on and off.
8. Vehicle deploy timer, vanilla spawning, swap team all unaffected.
9. Game mode preset switching unaffected (preset doesn't touch new toggle unless it sets the field).

**Changelog + bump:**
- `node scripts/bump-version.js --comment="wire Supply Boxes checkbox to gadget VFX + InteractPoint + menu; force-close open menus on Apply-disable"`.

---

## Rollback

Single-commit revert restores v1.324 behavior. State shape is unchanged — `supplyBoxesEnabled` was already persisted, it was just not read.
