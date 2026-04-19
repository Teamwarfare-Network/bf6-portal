# Plan: Slot-Based Remove Probe for Launcher Slot Identification

**Created:** 2026-04-18 (supersedes the v1.306 by-ID remove probe).
**Status:** Drafted for review.
**Base:** v1.307 (v1.306 probe still in source — this plan rips it out and replaces it).

---

## Context

The v1.306 probe called `RemoveEquipment(player, launcherGadgetId)` and watched per-slot ammo to locate the launcher. Playtest showed a destructive failure: with Supply Crate in slot 1 and RPG in slot 2, the probe removed the Supply Crate and it never came back. Either Portal's by-ID `RemoveEquipment` targeted the wrong gadget, or the restore `AddEquipment(..., GadgetTwo)` displaced slot 1 as a side effect. Either way, a by-ID remove can silently destroy the wrong gadget.

**SDK review surfaced a cleaner primitive**: `RemoveEquipment(player, inventorySlot)` — a slot-based overload (confirmed in [reference_bf6_core/mod/functions/RemoveEquipment.md](bf6-portal/dev/reference_bf6_core/mod/functions/RemoveEquipment.md)). Removing **by slot** is unambiguous — we know exactly which slot we're perturbing. Combined with `HasEquipment` polling of every engineer-gadget candidate before/after, we can identify the exact gadget that was in slot 1 by seeing which `HasEquipment` value flipped from true to false. Then we restore the removed gadget with `AddEquipment(player, removedGadget, GadgetOne)`.

**Behavior shortcut** (explicit user requirement): when the engineer has **no** launcher, the probe is skipped entirely. The top-of-locker slot toggle controls which slot the *next* launcher lands in. Once any launcher exists (default loadout, previous placement, kit pickup), the probe takes over as authority — toggle ignored for launcher placement and launcher ammo.

---

## Design

### 1. Revert v1.306 probe

Delete the existing `probeLauncherSlot` function and its call site in `openArmMenu`.

- Remove function body at [ammo-resupply-menu.ts:868-919](bf6-portal/dev/conquest/src/interaction/ammo-resupply-menu.ts#L868-L919).
- Remove the call block at [ammo-resupply-menu.ts:2247-2259](bf6-portal/dev/conquest/src/interaction/ammo-resupply-menu.ts#L2247-L2259).

### 2. New primitive: `ENGINEER_GADGET_CANDIDATES`

A flat list of every `mod.Gadgets.*` value an engineer could plausibly hold in a gadget slot. We must enumerate exhaustively — any gadget we miss becomes invisible to the diff and, if it happened to be in slot 1, will be lost without restoration.

Implementation-time discovery step: grep `mod.Gadgets.*` in [reference_bf6_core/mod/enumerations/Gadgets.md](bf6-portal/dev/reference_bf6_core/mod/enumerations/Gadgets.md) and pick every entry that could belong to an engineer loadout. Seed list (extend as the enum review reveals more):

- `ALL_LAUNCHER_VARIANTS` (all 10 launcher enum values, already defined at [ammo-resupply-menu.ts:841](bf6-portal/dev/conquest/src/interaction/ammo-resupply-menu.ts#L841))
- `mod.Gadgets.Class_Supply_Bag` (Supply Crate — already referenced at [ammo-resupply-menu.ts:1547](bf6-portal/dev/conquest/src/interaction/ammo-resupply-menu.ts#L1547))
- Anti-Tank Mines enum (TBD — look for `AT_Mine`, `Anti_Tank_Mine`, `Explosive_Mine`)
- EOD Bot enum (TBD — `EOD`, `Bot`, `Drone`)
- Repair Tool enum if it surfaces via `HasEquipment` (TBD)
- Any other engineer-slotted gadget the SDK exposes

The constant lives near `ALL_LAUNCHER_VARIANTS` and can simply concatenate it with the non-launcher set.

### 3. New probe function

Replace the old `probeLauncherSlot` with a slot-based-remove-and-diff probe. Sketch:

```ts
// Returns the slot holding the launcher (if any) with high confidence. Short-circuits when
// the probe would be unsafe or unnecessary. Uses slot-based RemoveEquipment -- the slot to
// perturb is known; the gadget that disappears from HasEquipment tells us what was there.
function probeLauncherSlot(player: mod.Player): {
    slot: mod.InventorySlots | undefined;
    gadget: number | undefined;
} {
    if (!player || !mod.IsPlayerValid(player)) return { slot: undefined, gadget: undefined };
    if (!isCls(player, mod.SoldierClass.Engineer)) return { slot: undefined, gadget: undefined };
    if (safeGetSoldierStateBool(player, mod.SoldierStateBool.IsInVehicle, false)) return { slot: undefined, gadget: undefined };

    // Shortcut: no launcher owned -> nothing to probe. Toggle will drive the next launcher placement.
    let ownedLauncher: number | undefined = undefined;
    for (const L of ALL_LAUNCHER_VARIANTS) {
        let owned = false;
        try { owned = mod.HasEquipment(player, L); } catch {}
        if (owned) { ownedLauncher = L; break; }
    }
    if (ownedLauncher === undefined) return { slot: undefined, gadget: undefined };

    // Skip when either gadget slot is wielded -- removing the active slot causes a hand
    // animation glitch the player can feel.
    let g1Active = false, g2Active = false;
    try { g1Active = mod.IsInventorySlotActive(player, mod.InventorySlots.GadgetOne); } catch {}
    try { g2Active = mod.IsInventorySlotActive(player, mod.InventorySlots.GadgetTwo); } catch {}
    if (g1Active || g2Active) return { slot: undefined, gadget: undefined };

    // Snapshot HasEquipment for every engineer candidate before perturbing.
    const before: { gadget: number; had: boolean }[] = [];
    for (const g of ENGINEER_GADGET_CANDIDATES) {
        let had = false;
        try { had = mod.HasEquipment(player, g); } catch {}
        before.push({ gadget: g, had });
    }

    // Remove whatever is in slot 1 (unambiguous -- we specify the slot, not an id).
    try { mod.RemoveEquipment(player, mod.InventorySlots.GadgetOne); } catch {
        return { slot: undefined, gadget: undefined };
    }

    // Find the single gadget that flipped from true to false.
    let removedFromSlot1: number | undefined = undefined;
    for (const b of before) {
        if (!b.had) continue;
        let stillHas = true;
        try { stillHas = mod.HasEquipment(player, b.gadget); } catch {}
        if (!stillHas) {
            if (removedFromSlot1 !== undefined) {
                // Multiple flips -- API surprise. Bail (no restoration path that's safe).
                // Attempt best-effort: restore the launcher we already identified.
                try { mod.AddEquipment(player, ownedLauncher, mod.InventorySlots.GadgetOne); } catch {}
                return { slot: undefined, gadget: undefined };
            }
            removedFromSlot1 = b.gadget;
        }
    }

    // Restore whatever we removed. If nothing flipped, slot 1 was empty -- no restore needed.
    if (removedFromSlot1 !== undefined) {
        try { mod.AddEquipment(player, removedFromSlot1, mod.InventorySlots.GadgetOne); } catch {}
        // Post-restore verification. If the gadget is still missing, we've lost it. Log and
        // continue -- no deeper recovery available.
        let restored = true;
        try { restored = mod.HasEquipment(player, removedFromSlot1); } catch {}
        if (!restored) {
            // Diagnostic only -- the player's loadout is now broken. Do not spin on retries.
        }
    }

    // Interpret: if the launcher vanished from slot 1, launcher lives in slot 1. Otherwise the
    // launcher is in slot 2 (it survived a slot 1 probe, so it cannot be in slot 1).
    const launcherSlot = removedFromSlot1 === ownedLauncher
        ? mod.InventorySlots.GadgetOne
        : mod.InventorySlots.GadgetTwo;

    return { slot: launcherSlot, gadget: ownedLauncher };
}
```

Key differences from v1.306:

| v1.306 | This plan |
|---|---|
| `RemoveEquipment(player, launcherId)` -- by id | `RemoveEquipment(player, InventorySlots.GadgetOne)` -- by slot |
| Ammo delta to locate launcher | `HasEquipment` diff to identify the exact gadget removed |
| Restore launcher blindly, even on ambiguous delta | Only restore the gadget we positively identified as removed |
| No post-restore verification | Verify `HasEquipment` is true after restore |

### 4. Wire into `openArmMenu`

Same wiring location as v1.306 (right after `initLockerSlotStateFromProbe`). Identical state update via `recordPlacement` and sibling-slot cleanup:

```ts
initLockerSlotStateFromProbe(pid, eventPlayer);
const probed = probeLauncherSlot(eventPlayer);
if (probed.slot !== undefined && probed.gadget !== undefined) {
    const slotsState = State.players.lockerSlots[pid];
    if (slotsState) {
        const siblingEntry = probed.slot === mod.InventorySlots.GadgetOne
            ? slotsState.g2 : slotsState.g1;
        if (siblingEntry.kind === "launcher") {
            siblingEntry.kind = siblingEntry.gadget ? "gadget" : "unknown";
            siblingEntry.source = "probed";
        }
    }
    recordPlacement(pid, probed.slot, probed.gadget, "launcher");
}
ensureSlotToggleState(pid);
```

### 5. Behavior after placement

No changes required to downstream consumers; existing logic already does the right thing once state is authoritative:

- [`slotWithLauncher`](bf6-portal/dev/conquest/src/interaction/ammo-resupply-menu.ts#L957) — returns the probed slot.
- [`giveLauncher`](bf6-portal/dev/conquest/src/interaction/ammo-resupply-menu.ts#L1029) — targets `slotWithLauncher` when it resolves (clobber-in-place); falls back to the toggle-supplied `fallbackSlot` only when no launcher exists. The latter is exactly the "no launcher → toggle decides" shortcut.
- [`giveRocketCharge`](bf6-portal/dev/conquest/src/interaction/ammo-resupply-menu.ts#L1189) — refills `slotWithLauncher` or returns false when there's no launcher (the Launcher Ammo tile is already gated by `launcherSlotKnown` in the menu refresh path).

### 6. Edge cases

| Case | Behavior |
|---|---|
| Engineer with no launcher | Shortcut — probe returns undefined without perturbing anything. Toggle drives next launcher placement via `giveLauncher` fallback. |
| Non-engineer opens locker | Shortcut — probe returns undefined. |
| Engineer in vehicle | Shortcut — probe returns undefined. |
| Either gadget slot wielded | Shortcut — probe returns undefined (avoids hand animation glitch). |
| Slot 1 empty | `HasEquipment` diff shows zero flips. No restoration needed. Launcher must be in slot 2 (we confirmed one exists). `launcherSlot = GadgetTwo`. |
| Slot 1 holds the launcher | Launcher variant flips T→F. Restore with `AddEquipment(launcher, GadgetOne)`. `launcherSlot = GadgetOne`. |
| Slot 1 holds a non-launcher gadget | That gadget flips T→F. Restore with `AddEquipment(that_gadget, GadgetOne)`. Launcher is in slot 2. `launcherSlot = GadgetTwo`. |
| Multiple gadgets flip after slot 1 remove (API surprise) | Best-effort restore of the owned launcher to slot 1; return undefined so downstream falls back to the existing heuristic rather than setting wrong authoritative state. |
| Restore verification fails | Loadout is broken. No retry (retry may make it worse). State not updated. Residual risk — playtest will surface whether it actually happens. |
| Gadget not in `ENGINEER_GADGET_CANDIDATES` lived in slot 1 | Invisible to the diff → zero flips detected → we infer "slot 1 empty" → don't restore. Player loses that gadget. **Mitigation: exhaustive enumeration during implementation.** |

### 7. Non-goals

- No change to the per-class slot toggle UI (v1.304/v1.305 work unchanged).
- No change to non-launcher gadget routing (Assault / Medic / Recon continue to use the toggle).
- No deploy-time probing.
- No frame-wait / `mod.Wait` introduced. The v1.306 probe read `GetInventoryAmmo` synchronously after `RemoveEquipment` and the delta was observable — `HasEquipment` is expected to behave the same. If playtest shows stale reads, we'll add a `mod.Wait(0)` between remove and diff.

---

## Files touched

| File | Change |
|---|---|
| [src/interaction/ammo-resupply-menu.ts](bf6-portal/dev/conquest/src/interaction/ammo-resupply-menu.ts) | Delete old `probeLauncherSlot`. Add `ENGINEER_GADGET_CANDIDATES` constant near `ALL_LAUNCHER_VARIANTS`. Add new slot-based `probeLauncherSlot`. Call site inside `openArmMenu` stays structurally the same. |

No state-type changes. No new strings. No UI changes. No schema bump (state does not survive map loads, per prior discussion).

---

## Verification

**Build:** `npm run build` → clean.

**Playtest matrix** (Engineer class, various loadouts):

1. **Default Engineer loadout (Supply Crate slot 1 + RPG slot 2).** Spawn. Open locker. Click Launcher Ammo.
   - Expected: Supply Crate charge count unchanged (regression gate vs v1.306). Launcher rocket count on slot 2 increments.

2. **Launcher in slot 1 + other gadget in slot 2.** Open locker. Click Launcher Ammo.
   - Expected: launcher ammo lands in slot 1. Slot 2 gadget unchanged.

3. **Launcher only (slot 2, slot 1 empty).** Open locker. Click Launcher Ammo.
   - Expected: no restore happens (slot 1 was empty), probe infers launcher in slot 2, ammo lands correctly.

4. **No launcher (engineer without launcher variant).** Open locker. Toggle to slot 1, click an RPG tile.
   - Expected: launcher lands in slot 1 (toggle honored). Reopen locker: probe now identifies slot 1. Click Launcher Ammo → ammo lands in slot 1.

5. **Swap launcher (toggle says slot 1, existing launcher in slot 2).** Click AT4 tile.
   - Expected: AT4 replaces RPG **in slot 2** (probe-authoritative, toggle ignored for launcher clobber). Never two launchers.

6. **Kit pickup mid-life.** Grab a kit that relocates the launcher. Reopen locker.
   - Expected: next probe reflects new slot, ammo lands correctly.

7. **Engineer in vehicle / gadget slot wielded.** Probe short-circuits. No perturbation visible.

8. **Non-Engineer opens menu.** No probe runs.

9. **Visual artifact check.** Observe whether the slot 1 remove/add is perceptible. If yes, note severity; consider tightening wielded-slot gate.

**Version bump:** `npm run bumpVersion -- -c "gadget-locker: slot-based remove probe with HasEquipment diff"`.

---

## Rollback

Single version bump. Revert: remove the new `probeLauncherSlot` and `ENGINEER_GADGET_CANDIDATES`, remove the call site in `openArmMenu`. State shape unchanged.
