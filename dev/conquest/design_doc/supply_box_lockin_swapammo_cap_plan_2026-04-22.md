# Plan: Supply Box menu — slot lock-in, swap-ammo bug, per-launcher max cap

**Created:** 2026-04-22 (post-v1.339)

---

## Context

After shipping v1.339 (probe wielded-bail removed, post-AddEquipment verification, slot-1 empty short-circuit), the user wants three follow-on changes:

1. **Stepper lock-in as visual confirmation.** When an Engineer player has a launcher equipped, the Engineer-row slot toggle stepper should disable and replace its label with "Launcher in Slot N". This serves both as developer confirmation that probe-based slot detection works AND as a player-facing signal that the slot is fixed for this launcher.
2. **Swap-then-ammo regression.** User report: "RPG → ammo +1 worked. Got AT4. Ammo button then didn't increment 100% of the time." Code review of v1.339's `giveLauncher` confirms a real regression I introduced: in the swap path where `RemoveEquipment(targetSlot)` silently no-ops and `AddEquipment` lands the new launcher in the sibling slot, the corrective sweep + re-probe runs AFTER `SetInventoryAmmo(targetSlot, ...)` — so preserved ammo lands on the wrong slot, and the re-probe's empty-slot short-circuit can be fooled by a not-yet-set slot. State ends up with launcher recorded at the wrong slot, causing subsequent ammo button clicks to target the wrong slot.
3. **Per-launcher ammo cap.** Codify max launcher ammo: RPG=6, AT4=5, Stinger=6. When the player's launcher slot is at cap (loaded + magazine ≥ max), disable + dim the Launcher Ammo tile so charges aren't wasted on no-op increments. No "MAX" text — just the dim/disable visual matching existing cooldown-disabled treatment.

User invariants from v1.339 plan still hold (no dup, swap-in-place, ammo to launcher slot, toggle drives placement when no launcher). This plan extends them with: stepper visually locks when launcher exists; ammo button hides when capped.

---

## Scope — what this plan changes

Two source files:
- `bf6-portal/dev/conquest/src/interaction/ammo-resupply-menu.ts` — three changes (giveLauncher reorder, stepper render, ammo cap gate).
- `bf6-portal/dev/conquest/src/config/types.ts` — add optional `maxAmmo: number` field to `GadgetLockerLauncherConfig`.

One config touch:
- `DEFAULT_GADGET_LOCKER_CONFIG` in `ammo-resupply-menu.ts:66-70` — add `maxAmmo` to each launcher row (RPG=6, AT4=5, Stinger=6).

One new string:
- `mod.stringkeys.twl.ui.launcherInSlot` = `"Launcher in Slot {0}"` — for stepper lock-in label override.

---

## Specific changes

### Change A — `giveLauncher` reorder (item 2 fix)

**File:** `src/interaction/ammo-resupply-menu.ts:1080-1156` (current giveLauncher).

Reorder operations so the authoritative landed slot is determined BEFORE ammo is set:

1. Read `slotsState`, dup-check, compute `targetSlot` (existingLauncherSlot ?? fallbackSlot) — unchanged.
2. Snapshot `preserveLoaded` / `preserveMag` from current launcher slot — unchanged.
3. `RemoveEquipment(targetSlot)` (silent fail OK) — unchanged.
4. `AddEquipment(gadget, targetSlot)` — unchanged; bail on throw.
5. Verify `HasEquipment(gadget)` — bail if false.
6. Sweep stale launcher variants by id — unchanged loop, but drop the `sweptStale` flag since we always re-probe now.
7. **NEW:** Always call `probeLauncherSlot(eventPlayer)` to get the authoritative `actualSlot`. Fall back to `targetSlot` only if probe returns undefined (e.g., player switched class mid-call).
8. **MOVED:** `SetInventoryAmmo(actualSlot, preserveLoaded)` and `SetInventoryMagazineAmmo(actualSlot, preserveMag)` — now after the probe, targeting the correct slot.
9. **MOVED:** `recordPlacement(pid, actualSlot, gadget, "launcher")`.
10. Downgrade sibling state if it still says `kind="launcher"` from prior state (the original swap-source slot may now be empty post-sweep).

Why this order works against the slot-1 short-circuit: by the time the probe runs, `RemoveEquipment(targetSlot)` and `AddEquipment(gadget, targetSlot)` and the sweep have all run. Inventory state reflects reality. The probe's short-circuit "slot 1 has 0/0 ammo and not active → launcher in slot 2" is correct in this state because either (a) launcher really is in slot 2, or (b) launcher is in slot 1 but a fresh AddEquipment leaves the slot's `GetInventoryMagazineAmmo` >0 (launchers spawn with default mag ammo). Need to verify (b) at probe-time — if the API returns 0 for a freshly-added launcher with no `SetInventoryAmmo` yet, the short-circuit could still mis-fire. Mitigation: pre-write a tiny `SetInventoryAmmo(targetSlot, 1)` immediately after AddEquipment to guarantee the slot reads as non-empty for the probe. The real `preserveLoaded` overwrites it post-probe at step 8.

### Change B — Stepper lock-in (item 1)

**File:** `src/interaction/ammo-resupply-menu.ts:2002-2028` (toggle render block in `refreshArmMenu`).

Inside the `for (let i = 0; i < 4; i++)` loop, when rendering the Engineer row (`i === 1`, the engineer class HDR index), check `slotWithLauncher(slotsState)`:

- If a launcher slot is known: override `enabled = false`, override the label to `mod.Message(STR_UI_LAUNCHER_IN_SLOT, launcherSlotNumber)` where `launcherSlotNumber` is `1` or `2`. Apply standard disabled visuals (alpha = `DIS_A`, `SetUIButtonEnabled(false)`).
- Otherwise: existing behavior (enable iff `i === currentClassIdx`, label = "Gadget Slot {choice}").

This is a localized 8-line addition inside the existing render loop. No new render path, no cache invalidation needed (the loop already runs every refresh).

**String addition:** `src/strings.json` under `twl.ui` — add `"launcherInSlot": "Launcher in Slot {0}"`. Add `STR_UI_LAUNCHER_IN_SLOT = mod.stringkeys.twl.ui.launcherInSlot` in `src/foundation/string-keys.ts`.

Visual: dimmed prev/next buttons + dimmed label is the existing pattern for non-active class rows. The lock-in case uses the same dim treatment but with a different label string. Confirms to the player AND to the dev that the system has detected the slot.

### Change C — Per-launcher max ammo cap (item 3)

**File 1:** `src/config/types.ts:69-78` (`GadgetLockerLauncherConfig`).

Add optional field:
```ts
maxAmmo?: number; // Per-launcher cap on loaded + magazine ammo (e.g., RPG=6, AT4=5, Stinger=6). Omit to skip cap.
```

**File 2:** `src/interaction/ammo-resupply-menu.ts:66-70` (DEFAULT_GADGET_LOCKER_CONFIG launchers).

Annotate each row:
```ts
{ name: "RPG",     labelKey: STR_UI_RPG,     gadget: mod.Gadgets.Launcher_Unguided_Rocket, maxAmmo: 6 },
{ name: "AT4",     labelKey: STR_UI_AT4,     gadget: mod.Gadgets.Launcher_Aim_Guided, maxAmmo: 5, pool: { ... } },
{ name: "Stinger", labelKey: STR_UI_STINGER, gadget: mod.Gadgets.Launcher_Air_Defense, maxAmmo: 6 },
```

**File 2:** `src/interaction/ammo-resupply-menu.ts:2205-2210` (ammo tile enabled state in `refreshArmMenu`).

Extend `ammoEnabled` to include a "not at cap" check:
- Read `currentLauncherSlot = slotWithLauncher(slotsState)`.
- If `currentLauncherSlot !== undefined`, look up the launcher gadget id in state (`slotsState.g1.gadget` or `g2.gadget`), find matching `cfg.launchers` row, get its `maxAmmo`.
- Read `loaded = GetInventoryAmmo(eventPlayer, currentLauncherSlot)` and `mag = GetInventoryMagazineAmmo(...)`.
- `atCap = maxAmmo !== undefined && (loaded + mag) >= maxAmmo`.
- `ammoEnabled = isEngineerClass && ammoCount > 0 && launcherSlotKnown && !gadgetBlocked && !atCap`.

Visual: existing disabled treatment (gray / dim) — Q1 confirmed no extra label. The tile already paints gray when `ammoEnabled` is false; adding `atCap` to the gating preserves that with no further widget changes.

**File 2:** `src/interaction/ammo-resupply-menu.ts:1268-1297` (`giveRocketCharge`).

Add a defensive cap check at the top: read the same launcher's `maxAmmo`, compute `loaded + mag`, return `false` early if at cap. Belt-and-braces against a click that races the UI refresh.

---

## What this plan does NOT change

- No change to `probeLauncherSlot` itself (v1.339 changes stand).
- No change to `closeArmMenu`, `openArmMenu`, or the Supply Box wiring (3 gates + apply-time resync).
- No change to non-launcher tiles, smoke, intercepts, recon items.
- No change to other classes' stepper rows (they retain existing per-class enable behavior).
- No new state fields. The launcher gadget id is already tracked in `lockerSlots[pid].gN.gadget` post-`recordPlacement`.

---

## Verification

1. **Build clean:** `npm run bumpVersion -- -c "..."`. TS compile + bundle size budget.
2. **Manual scenarios** at the Supply Box, one Engineer player:
   - **Stepper lock-in (Change B):** Spawn as Engineer with no launcher. Open menu. Stepper for Engineer row enabled, label "Gadget Slot 2". Click RPG. Stepper now disabled, label "Launcher in Slot 2" (or 1 if toggle was set to 1). Confirm prev/next don't react. Switch to a different class (if possible mid-session) — Engineer stepper drops to dim-disabled with the "Launcher in Slot N" label still visible. Switch back to Engineer — stepper still locked, label still says correct slot.
   - **Swap path correctness (Change A):** Equip RPG via menu. Click ammo +1 — verify mag ammo bumped. Click AT4. Click ammo +1 — verify ammo lands on AT4 (the launcher you actually have). Repeat 5x. **Critical:** confirm ammo always lands on the current launcher slot, never the sibling.
   - **Wielded swap (Change A interaction with v1.339):** Equip RPG. Wield it (active = launcher). Open menu. Click AT4. Click ammo. Verify swap-in-place AND ammo lands correctly.
   - **Cap (Change C):** Equip RPG (max 6). Click ammo until tile dims. Verify clicking the dimmed tile is a no-op. Verify `loaded + mag === 6`. Swap to AT4 (max 5). Verify the tile re-enables (AT4 starts under cap). Click ammo until dim. Verify `loaded + mag === 5`. Swap to Stinger (max 6). Repeat.
   - **No-launcher case:** No launcher equipped. Stepper active, label "Gadget Slot N". Toggle works. Ammo tile dim (already covered by `launcherSlotKnown`).
3. **Append findings to `conquest_issues.md`** under #78 (likely now resolved by Change A), #90 (already addressed v1.339, re-confirm), and a new appendix capturing the v1.339-introduced `giveLauncher` ordering bug + this fix. Add the per-launcher cap as a closed item under polish.

---

## Critical files

- `bf6-portal/dev/conquest/src/interaction/ammo-resupply-menu.ts` — three discrete changes (giveLauncher reorder ~lines 1080-1156, refreshArmMenu stepper block ~2002-2028, refreshArmMenu ammo tile gate ~2205-2210, giveRocketCharge guard ~1268-1297, DEFAULT_GADGET_LOCKER_CONFIG launchers ~66-70).
- `bf6-portal/dev/conquest/src/config/types.ts:69-78` — add `maxAmmo?` to `GadgetLockerLauncherConfig`.
- `bf6-portal/dev/conquest/src/strings.json` under `twl.ui` — add `launcherInSlot`.
- `bf6-portal/dev/conquest/src/foundation/string-keys.ts` — add `STR_UI_LAUNCHER_IN_SLOT` constant.
- `bf6-portal/dev/conquest/design_doc/conquest_issues.md` — post-test updates.

## Reference (read-only, no edits)

- `src/interaction/ammo-resupply-menu.ts:1983` — `launcherSlotKnown = slotWithLauncher(slotsState) !== undefined` (re-used for cap check).
- `src/interaction/ammo-resupply-menu.ts:988-993` — `slotWithLauncher` returns `mod.InventorySlots.GadgetOne | GadgetTwo | undefined`.
- `src/interaction/ammo-resupply-menu.ts:1008-1016` — `recordPlacement` sets `entry.kind`, `entry.gadget`.
- `src/interaction/ammo-resupply-menu.ts:893-973` — `probeLauncherSlot` (the v1.339 authority).

---

## Out of scope

- Per-map override of `maxAmmo` (would need wiring through `syncActiveGadgetLockerConfig`). Default config carries the caps; map-specific tuning is a follow-up if needed.
- Changing the stepper lock-in label string for non-Engineer classes (other classes don't have the launcher concept).
- Generalizing the cap concept beyond launchers (e.g., gadget cooldown shortening). Out of scope.
- Any change to the Admin Panel reclaim arithmetic or `conquest_optimization_analysis.md`.
