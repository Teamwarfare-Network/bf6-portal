# Plan: Wire 4 isolated BountyHunter spawn test buttons into admin panel (v1.246)

**Created**: 2026-04-16
**Status**: Ready for implementation

---

## Context

v1.244 and v1.245 both failed to fix HQ Deploy for F22/MH6/Eurocopter/JAS39 by modifying existing spawner infrastructure. The BountyHunter pattern (2s delay + 3-call config + AutoSpawn) was applied to the correct code paths but vehicles still didn't appear — something in the existing scaffolding interferes.

The user demanded a completely isolated test: 4 admin panel buttons that spawn vehicles using ONLY the BountyHunter method, with zero contact to existing vehicle infrastructure (no configureVehicleSpawner, no ForceVehicleSpawnerSpawn, no slot/bind/spawner-sequence/deploy-fulfillment). If these buttons work, the existing infrastructure is the problem. If they don't, the issue is engine-level.

**Already completed** (earlier in this session):
- `src/admin-panel/test-bountyhunter-spawn.ts` — new file, self-contained BountyHunter spawner (157 lines)
- `src/strings.json` — 6 new strings added (bhSpawnF16, bhSpawnAH6M, bhSpawnDirtBike, bhSpawnBlackHawk, bhResultOk, bhResultFail)
- `src/strings/ui-ids.ts` — 8 new widget ID constants added (lines 114-121)

**Remaining**: Wire buttons into admin panel build + events, add import to index.ts, build, bump version.

---

## Changes (3 files)

### 1. `src/index.ts` — Add import for new module

Insert after line 76 (`// import './admin-panel/test-minimal-spawn'; // @feature FEATURE_MIN_SPAWN_TEST`):
```typescript
import './admin-panel/test-bountyhunter-spawn'; // @feature FEATURE_DEPLOY_DIAGNOSTIC
```

### 2. `src/admin-panel/build.ts` — Add 4 BH buttons to `buildAdminPanelWidgets`

Insert after the ground deploy button (row 9, line 130) and before the `if (FEATURE_MIN_SPAWN_TEST)` block (line 132). Use `FEATURE_DEPLOY_DIAGNOSTIC` guard. Use `addMinSpawnTestButton` for compact row layout, same pattern as the FEATURE_MIN_SPAWN_TEST buttons.

```typescript
if (FEATURE_DEPLOY_DIAGNOSTIC) {
    const bhRowY = row0Y + (buttonSizeY + rowSpacingY) * 10;
    const bhRowHeight = 28;
    const bhGapX = 6;
    const bhRowContentWidth = (buttonSizeX + 8 + labelSizeX + 8 + buttonSizeX);
    const bhButtonWidth = Math.floor((bhRowContentWidth - (bhGapX * 3)) / 4);
    addMinSpawnTestButton(eventPlayer, adminContainer, playerId,
        testerBaseX + ((bhButtonWidth + bhGapX) * 0),
        bhRowY, bhButtonWidth, bhRowHeight,
        UI_TEST_BUTTON_BH_F16_ID, UI_TEST_BH_F16_TEXT_ID,
        mod.stringkeys.twl.adminPanel.tester.buttons.bhSpawnF16);
    addMinSpawnTestButton(eventPlayer, adminContainer, playerId,
        testerBaseX + ((bhButtonWidth + bhGapX) * 1),
        bhRowY, bhButtonWidth, bhRowHeight,
        UI_TEST_BUTTON_BH_AH6M_ID, UI_TEST_BH_AH6M_TEXT_ID,
        mod.stringkeys.twl.adminPanel.tester.buttons.bhSpawnAH6M);
    addMinSpawnTestButton(eventPlayer, adminContainer, playerId,
        testerBaseX + ((bhButtonWidth + bhGapX) * 2),
        bhRowY, bhButtonWidth, bhRowHeight,
        UI_TEST_BUTTON_BH_DIRTBIKE_ID, UI_TEST_BH_DIRTBIKE_TEXT_ID,
        mod.stringkeys.twl.adminPanel.tester.buttons.bhSpawnDirtBike);
    addMinSpawnTestButton(eventPlayer, adminContainer, playerId,
        testerBaseX + ((bhButtonWidth + bhGapX) * 3),
        bhRowY, bhButtonWidth, bhRowHeight,
        UI_TEST_BUTTON_BH_BLACKHAWK_ID, UI_TEST_BH_BLACKHAWK_TEXT_ID,
        mod.stringkeys.twl.adminPanel.tester.buttons.bhSpawnBlackHawk);
}
```

Note: If `FEATURE_MIN_SPAWN_TEST` is also true, its buttons start at row 10 too — but since `FEATURE_MIN_SPAWN_TEST = false`, no collision. If both were ever active simultaneously, adjust row index. For now this is fine.

### 3. `src/admin-panel/events.ts` — Add 4 click handlers + switch cases

**Handlers**: Insert after `groundDeployAllHandled` (line 209) and before the `if (FEATURE_MIN_SPAWN_TEST)` block (line 211):

```typescript
if (FEATURE_DEPLOY_DIAGNOSTIC) {
    const bhF16Handled = tryHandleAdminPanelPrimaryAction(
        playerId, widgetName, eventUIButtonEvent, UI_TEST_BUTTON_BH_F16_ID,
        () => { runBhSpawnTestF16(eventPlayer); }
    );
    if (bhF16Handled !== undefined) return bhF16Handled;

    const bhAH6MHandled = tryHandleAdminPanelPrimaryAction(
        playerId, widgetName, eventUIButtonEvent, UI_TEST_BUTTON_BH_AH6M_ID,
        () => { runBhSpawnTestAH6M(eventPlayer); }
    );
    if (bhAH6MHandled !== undefined) return bhAH6MHandled;

    const bhDirtBikeHandled = tryHandleAdminPanelPrimaryAction(
        playerId, widgetName, eventUIButtonEvent, UI_TEST_BUTTON_BH_DIRTBIKE_ID,
        () => { runBhSpawnTestDirtBike(eventPlayer); }
    );
    if (bhDirtBikeHandled !== undefined) return bhDirtBikeHandled;

    const bhBlackHawkHandled = tryHandleAdminPanelPrimaryAction(
        playerId, widgetName, eventUIButtonEvent, UI_TEST_BUTTON_BH_BLACKHAWK_ID,
        () => { runBhSpawnTestBlackHawk(eventPlayer); }
    );
    if (bhBlackHawkHandled !== undefined) return bhBlackHawkHandled;
}
```

**Switch fall-through cases**: Add 4 new cases after `UI_TEST_BUTTON_MIN_SPAWN_SPWN_ID` (line 270):

```typescript
case UI_TEST_BUTTON_BH_F16_ID + playerId:
case UI_TEST_BUTTON_BH_AH6M_ID + playerId:
case UI_TEST_BUTTON_BH_DIRTBIKE_ID + playerId:
case UI_TEST_BUTTON_BH_BLACKHAWK_ID + playerId:
```

---

## Files to modify

| File | Change |
|---|---|
| [src/index.ts](bf6-portal/dev/conquest/src/index.ts) | Add import for `test-bountyhunter-spawn` after line 76 |
| [src/admin-panel/build.ts](bf6-portal/dev/conquest/src/admin-panel/build.ts) | Add 4 BH buttons under `FEATURE_DEPLOY_DIAGNOSTIC` after row 9, before `FEATURE_MIN_SPAWN_TEST` |
| [src/admin-panel/events.ts](bf6-portal/dev/conquest/src/admin-panel/events.ts) | Add 4 BH handlers + 4 switch cases under `FEATURE_DEPLOY_DIAGNOSTIC` |

## Existing utilities reused

- `addMinSpawnTestButton` — [build.ts:179](bf6-portal/dev/conquest/src/admin-panel/build.ts#L179) (compact button builder)
- `tryHandleAdminPanelPrimaryAction` — [events.ts:22](bf6-portal/dev/conquest/src/admin-panel/events.ts#L22) (debounced click handler)
- `runBhSpawnTestF16/AH6M/DirtBike/BlackHawk` — [test-bountyhunter-spawn.ts:145-156](bf6-portal/dev/conquest/src/admin-panel/test-bountyhunter-spawn.ts#L145-L156) (already written)
- `VEHICLE_AH6M`, `VEHICLE_DIRTBIKE` — [foundation/gameplay.ts:191-193](bf6-portal/dev/conquest/src/foundation/gameplay.ts#L191-L193) (custom enum casts)

## Verification

1. `npm run build` — must pass, bundle under 1,048,576 bytes
2. `npm run bumpVersion -- -c "diag: add 4 isolated BountyHunter spawn test buttons to admin panel (F16/AH-6M/DirtBike/BlackHawk) — zero contact with existing vehicle infrastructure, proves whether BountyHunter pattern works independently"`
3. In-game: open admin panel, click each of the 4 BH buttons, observe:
   - F16 button: should spawn F16 near (0, 350, 0)
   - AH-6M button: should spawn Little Bird near (50, 250, 50)
   - DirtBike button: should spawn DirtBike near (-200, 140, 100)
   - BlackHawk button: should spawn UH60 near (100, 140, -100)
   - Success: highlighted world log "BH OK" message
   - Failure: highlighted world log "BH FAIL" message after 10s timeout
4. If F16 works but others don't: confirms engine-level issue with vehicle types, not our infrastructure
5. If all 4 work: confirms our existing infrastructure is the problem, and BountyHunter pattern is valid
