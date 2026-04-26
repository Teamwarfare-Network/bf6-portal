# Plan: Disabled-but-focused button indicator for Supply Box menu

**Created:** 2026-04-25
**Issue:** to be assigned a CQ_Polish_* number at implementation time.
**Predecessor / context:** `launcher_ammo_fixes_plan_2026-04-25.md` (v1.373) and `get_vehicle_from_player_fix_plan_2026-04-25.md` (v1.374) — same Supply Box menu surface; this plan extends UX rather than fixes a bug.

---

## Context

Console / controller players have no visual cue when navigating across disabled tiles in the Supply Box (gadget supply) menu. The currently-focused tile has no visible focus indicator when disabled, so players can be "selecting" a button without knowing it. Need a distinct disabled-focused visual that is clearly the focused tile while still reading as disabled.

The Supply Box menu in [`src/interaction/ammo-resupply-menu.ts`](../src/interaction/ammo-resupply-menu.ts) renders ~15 tiles (assault/medic/engineer/recon class trays + launcher rows + close button). Many start disabled (wrong class, gadget cooldown active, ammo at cap, gadget round-start delay, etc.). The engine fires `FocusIn` events on disabled buttons (already wired and consumed for help-text updates at [:2568](../src/interaction/ammo-resupply-menu.ts#L2568)) — so navigation works — but no visual feedback paints when the player lands on a disabled tile. Console feedback consumers complain.

The project keeps using `safeSetUIWidgetBgColor` / `safeSetUIWidgetBgAlpha` to paint button states (rather than the SDK's `SetUIButtonColor{Base,Disabled,Focused,Hover,Pressed}` primitives). Migrating the whole tile system is a bigger refactor; the user has chosen the script-driven custom focus visual route for this fix.

---

## Recommended approach (user-selected 2026-04-25)

**Visual:** brighter gray + colored border ring on the disabled-focused tile. Avoid yellow (user direction). Default proposal: `COLOR_WHITE_LOW` (light cool blue-white, `#D5EBF9`, [`gameplay.ts:85`](../src/foundation/gameplay.ts#L85)) — already in the palette and visually distinct from the existing dim-gray border. Open to swap to `COLOR_BLUE` or `COLOR_WHITE` in review if the cool-white reads too pale on console.

**Scope:** Supply Box menu only. Other menus untouched.

**Strategy:** script-driven custom focus visual. Reuse the existing per-tile `bb` (button border) widget — change its color/alpha based on enabled+focused state. No new widgets created. Track focused tile per pid in `State`.

---

## Files to modify

- [`src/interaction/ammo-resupply-menu.ts`](../src/interaction/ammo-resupply-menu.ts) — extend `setTileVis` and `setActVis`, wire `FocusOut` event, extend `handleArmMenuEvt` to track focus, repaint affected tiles on focus transition. Include focus state in the per-tile signature so existing dirty-detection re-renders pick up focus changes.
- [`src/state/runtime-types.ts`](../src/state/runtime-types.ts) — add `armFocusedTileKeyByPid?: Record<number, string>` to the players sub-state.
- [`src/state/runtime-state.ts`](../src/state/runtime-state.ts) — initialize the new field to `{}`.
- [`src/foundation/ui-layout.ts`](../src/foundation/ui-layout.ts) — add `COLOR_BUTTON_BORDER_DISABLED_FOCUSED` constant (alias `COLOR_WHITE_LOW` for now; named so future palette tweaks don't propagate).

---

## Change set

### 1. State field for focused tile per pid

Add `armFocusedTileKeyByPid: Record<number, string>` to `State.players` ([`runtime-types.ts`](../src/state/runtime-types.ts) and [`runtime-state.ts`](../src/state/runtime-state.ts)). Key format mirrors the existing widget-name parsing at [`handleArmMenuEvt:2501+`](../src/interaction/ammo-resupply-menu.ts#L2501): e.g. `"e"` (launcher ammo), `"q:0"` (engineer tile 0), `"a:2"` (assault tile 2), `"row:1"` (action row 1), etc. Single string identifier per tile.

### 2. New focus-color constant

In [`ui-layout.ts`](../src/foundation/ui-layout.ts) near the existing `COLOR_BUTTON_*` block:

```ts
// Border color used when a disabled tile is currently focused (controller / keyboard).
// Distinct from COLOR_BUTTON_BORDER (enabled-default gray) and COLOR_GRAY_DARK (disabled-default).
const COLOR_BUTTON_BORDER_DISABLED_FOCUSED = COLOR_WHITE_LOW;
```

Player-facing? No — this is a color constant, not a string-key. No AGENTS.md `String Change Authorization Policy` trigger.

### 3. Wire `FocusOut` events on every tile + action-row button

Today only `FocusIn` is wired ([:624](../src/interaction/ammo-resupply-menu.ts#L624), [:1633](../src/interaction/ammo-resupply-menu.ts#L1633)). Add a parallel call:
```ts
mod.EnableUIButtonEvent(button, mod.UIButtonEvent.FocusOut, true);
```
at both sites.

### 4. Extend `setTileVis` and `setActVis` to take a `focused` parameter

```ts
function setTileVis(charge, enabled, focused = false) {
    safeSetUIWidgetBgColor(charge.button, enabled ? COLOR_BUTTON_BASE : COLOR_GRAY_DARK);
    safeSetUIWidgetBgAlpha(charge.button, enabled ? BUTTON_OPACITY_BASE : DIS_A);
    const borderColor =
        !enabled && focused ? COLOR_BUTTON_BORDER_DISABLED_FOCUSED
        : enabled ? COLOR_BUTTON_BORDER
        : COLOR_GRAY_DARK;
    const borderAlpha =
        !enabled && focused ? BUTTON_BORDER_OPACITY  // full opacity when disabled-focused
        : enabled ? BUTTON_BORDER_OPACITY
        : DIS_A;
    safeSetUIWidgetBgColor(charge.bb, borderColor);
    safeSetUIWidgetBgAlpha(charge.bb, borderAlpha);
    if (charge.button) mod.SetUIButtonEnabled(charge.button, enabled);
}
```
Same shape for `setActVis`. Default `focused=false` keeps every existing call site behavior-identical.

Optional: also slightly brighten `charge.button` background when `!enabled && focused` (e.g. `COLOR_GRAY` instead of `COLOR_GRAY_DARK`) so the tile feels lifted, matching the user's "brighter gray + border ring" preference. Bundle-cheap.

### 5. Pass focus state from refresh sites

Every call to `setTileVis(tile, enabled)` and `setActVis(row, enabled)` in `refreshArmMenu` must read `State.players.armFocusedTileKeyByPid[pid]` and pass `focused = (focusedKey === thisTileKey)`. Tile keys must be stable strings the focus event handler can produce from the focused widget's name.

Existing call sites to update:
- [`:2225`](../src/interaction/ammo-resupply-menu.ts#L2225) (a-tray tiles), [`:2250`](../src/interaction/ammo-resupply-menu.ts#L2250) (medic), [`:2282`](../src/interaction/ammo-resupply-menu.ts#L2282) (recon), [`:2318`](../src/interaction/ammo-resupply-menu.ts#L2318) (action rows), [`:2380`](../src/interaction/ammo-resupply-menu.ts#L2380) (launcher ammo `e`), [`:2415`](../src/interaction/ammo-resupply-menu.ts#L2415) (q-tray engineer tiles).

### 6. Extend per-tile signatures to include focus state

Each tile's `sig` string at [:2305-2311](../src/interaction/ammo-resupply-menu.ts#L2305) and similar blocks: append `focused ? "f" : "u"` (focused vs unfocused). When focus changes from one tile to another, both tiles' sigs flip and dirty-detection repaints them.

### 7. Update `handleArmMenuEvt` to handle FocusIn / FocusOut

Inside the existing FocusIn block at [:2568](../src/interaction/ammo-resupply-menu.ts#L2568), after the help-text update:
```ts
const tileKey = resolveTileKeyFromWidget(widgetName, pid, ...indices);
if (tileKey !== undefined) {
    State.players.armFocusedTileKeyByPid[pid] = tileKey;
    refreshArmMenu(eventPlayer, objId, cache);  // signature flip on focused tile + previous-focused tile triggers repaint
}
```

Add a parallel FocusOut block:
```ts
if (mod.Equals(eventUIButtonEvent, mod.UIButtonEvent.FocusOut)) {
    const tileKey = resolveTileKeyFromWidget(widgetName, pid, ...indices);
    if (tileKey !== undefined && State.players.armFocusedTileKeyByPid[pid] === tileKey) {
        delete State.players.armFocusedTileKeyByPid[pid];
        refreshArmMenu(eventPlayer, objId, cache);
    }
    return true;
}
```

`resolveTileKeyFromWidget` is a small helper that derives the stable tile key from the widget-name-parsing already done in `handleArmMenuEvt` (assaultTileIndex / medicTileIndex / reconTileIndex / actionIndex / isMedicWidget / isChargeWidget / etc.). Encode as `"a:N"`, `"medic"`, `"q:N"`, `"row:N"`, `"e"`, `"x:N"` (mirroring cache field names: `a[]`, `m`, `q[]`, `rows[]`, `e`, `x[]`).

### 8. Cleanup on menu close + player leave

`closeArmMenu(pid)` and `cleanupArmMenuForPid(pid)` (and the player-join-leave handler) should `delete State.players.armFocusedTileKeyByPid[pid]` so a stale focus key cannot leak into the next session.

---

## Bundle / build impact

- ~1 new state field, ~1 new color constant, ~30 lines for the focus tracking + key resolver, ~1 line per `setTileVis`/`setActVis` call site (~7 sites).
- Estimated: **+300–400 bytes**. Headroom at v1.374: 17,913 bytes (1.71%) — comfortable.

No new widgets, no new string-keys, no new per-tick work. Per-event work runs only on FocusIn / FocusOut transitions.

---

## Combat / performance considerations

- `probeLauncherSlot`-class concerns don't apply here (no engine inventory writes).
- FocusIn / FocusOut firing rate is bounded by player navigation speed — at most ~5/sec on a controller stick mash. Each event triggers one `refreshArmMenu` call (which is already gated by the per-tile signature and only repaints tiles whose sig changed: typically just the prev-focused and new-focused tile).
- Synchronous; no `mod.Wait`; no async windows.

---

## Verification

1. Apply changes. Bump version: `npm run bumpVersion -- -c "supply box menu: disabled-focused border indicator for console controller navigation"`.
2. Build clean (`npm run build`). Confirm bundle below 1,048,576 bytes; capture delta.
3. Typecheck clean: `cmd /c npx tsc --pretty false --noEmit` exit 0.
4. Single-player test, controller (or simulated controller via keyboard arrow keys if testing in editor):
   - Open Supply Box menu as Engineer with at least 2 disabled tiles (e.g., a launcher already at cap, an out-of-cooldown tile).
   - Navigate across enabled and disabled tiles. Confirm:
     - Enabled-focused tile uses existing engine focus visual (no regression).
     - Disabled-focused tile shows the new white-low / cool border ring AND a slightly brighter background (per #4 optional).
     - Disabled-unfocused tile uses existing dim-gray (no regression).
     - Moving focus from disabled→enabled→disabled transitions paint correctly (no stuck focus visuals on stale tiles).
5. Class swap test:
   - Open Supply Box, navigate to a disabled tile, swap classes (which changes the enabled state of many tiles). Confirm focus visual stays on the same tile and updates if its enabled state flipped.
6. Round-start gadget delay test:
   - Open Supply Box during the pre-LIVE gadget delay (all tiles disabled via `gadgetBlocked`). Navigate; confirm every tile shows the disabled-focused indicator on its turn. After delay expires, confirm visual reverts to enabled-focused on tiles that re-enable.
7. Close-and-reopen test:
   - Close menu while a tile is focused. Reopen. Confirm focus state from previous session does not leak (no stale border ring on a tile that wasn't focused yet).
8. Mouse hover regression check:
   - With mouse, hover over a disabled tile. Confirm the disabled-focused visual fires (Hover and Focus events follow the same path on most engines). If not — acceptable; controller navigation is the primary target.

---

## Out of scope

- **Other menus** (Ready Dialog, Vehicle Deploy, etc.) — same fix could apply later; build a shared utility if/when extending. User explicitly scoped to Supply Box only for this iteration.
- **Migration to SDK button-state primitives** (`SetUIButtonColor{Base,Disabled,Focused,...}`) — larger refactor; would replace the `safeSetUIWidgetBgColor` pattern across the entire tile system. Capture as a future cleanup issue if desired; not needed for this fix.
- **Hover state styling (mouse)** — engine `HoverIn` / `HoverOut` events not wired. Mouse hover on a disabled tile may or may not fire FocusIn depending on engine behavior. If players need explicit hover styling, separate task.
- **Issue-tracker entry numbering** — assign a CQ_Bug_*/CQ_Polish_* number when logging into [`conquest_issues.md`](./conquest_issues.md) and [`conquest_issues_summary.md`](./conquest_issues_summary.md) at implementation time.
