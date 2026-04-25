# Plan: Supply Box menu launcher fixes (#78, #85, #90)

**Created:** 2026-04-22 (post-v1.338)

---

## Context

The Supply Box menu's three open Engineer-launcher bugs share a common root cause in the destructive-probe flow that was meant to make slot identification deterministic. The intended design (enumerate Engineer gadget candidates, remove `GadgetOne`, diff `HasEquipment`, infer which slot held the launcher, restore) is sound and matches user intent. Two implementation gaps are preventing it from working as designed, and a third symptom (the `RemoveEquipment` engine error) lacks instrumentation to diagnose its precondition.

User-visible invariants (confirmed 2026-04-22):
1. Same-launcher tile must NOT re-give (no dup).
2. Different launcher must REPLACE the existing one in the same slot (swap-in-place).
3. Ammo button must give ammo to the slot that holds the launcher.
4. With no launcher equipped, the slot toggle at the top determines placement.

Current behavior (per `conquest_issues.md` #78, #85, #90):
- #90: RPG → AT4 sometimes results in both launchers equipped (no swap; new launcher lands in the toggle's slot).
- #78: AT4 ammo button no-ops on second-slot AT4 in some loadouts.
- #85: `mod.RemoveEquipment` engine error logs at supply-box menu open in some loadouts (JS try/catch recovers; engine logs before catch — same cosmetic class as #39).

### Root cause (single mechanism, three symptoms)

`probeLauncherSlot` at `src/interaction/ammo-resupply-menu.ts:893-950` BAILS at line 913 when either gadget slot is wielded (`g1Active || g2Active`). When this bail fires:

- `State.players.lockerSlots[pid]` is left with neither slot marked `kind="launcher"`.
- `slotWithLauncher(slotsState)` returns `undefined`.
- `giveLauncher()` at line 1064 sees `currentLauncherSlot === undefined` and falls through to `fallbackSlot` (the toggle preference), not the slot that actually holds the launcher → **#90 double-give**.
- `giveRocketCharge()` at lines 1213-1241 also reads `slotWithLauncher`; with `undefined`, it returns false silently → **#78 no-op**.

A secondary contributor in `giveLauncher` (lines 1086-1094): the slot-based `RemoveEquipment(targetSlot)` is wrapped in `try { } catch {}` that silently swallows. If the remove fails, the subsequent `AddEquipment(player, gadget, targetSlot)` may still land in the other free slot. There is no post-`AddEquipment` verification, so an off-target placement is invisible.

The `RemoveEquipment` engine error (#85) is the same engine-logged-before-JS-catch class as #39 (cosmetic in the script execution sense, but masks a real failing precondition). Likely candidates: probing a genuinely empty slot, or a loadout whose launcher variant is missing from `ENGINEER_GADGET_CANDIDATES` at lines 879-887. We have no diagnostic to know which.

Intended outcome: each of the four user invariants holds across all entry conditions (wielded or holstered, any class loadout), and the engine error either disappears or reveals its precondition.

---

## Scope — what this plan changes

Single file: `bf6-portal/dev/conquest/src/interaction/ammo-resupply-menu.ts`. Three discrete changes. No new modules, no API surface changes, no state shape changes.

---

## Specific changes

### Change 1 — Remove the "wielded" bail in `probeLauncherSlot`

**File:** `src/interaction/ammo-resupply-menu.ts:913`

Today: if `g1Active || g2Active`, the function returns `undefined`. This was added to avoid a momentary animation glitch when the player is actively holding a gadget at probe time. The cost — locker state never gets `kind="launcher"` set — is much worse than the cosmetic flicker.

Replace with:
- Snapshot the current active inventory slot via `mod.GetSoldierState(player, mod.SoldierStateNumber.CurrentInventorySlot)` (or the equivalent existing helper if one is already in this file).
- Run the destructive probe as today (snapshot → `RemoveEquipment(GadgetOne)` → diff → restore).
- After restore, `mod.SetActiveInventorySlot(player, savedSlot)` to put the player back on the slot they were holding.

If a robust "current slot" read is not available from `mod.*`, fall back to: always remove and restore, accept the brief glitch, and document it. Glitch is acceptable because (a) the menu is a deliberate interaction with the supply box, not mid-firefight, and (b) the alternative is broken swap-in-place.

### Change 2 — Post-`AddEquipment` verification in `giveLauncher`

**File:** `src/interaction/ammo-resupply-menu.ts:1060-1096`

After the `mod.AddEquipment(eventPlayer, gadget, targetSlot)` call:
- Verify ownership via `mod.HasEquipment(eventPlayer, gadget)` — if false, the give failed entirely; return false.
- If a different launcher is still equipped (any in `ALL_LAUNCHER_VARIANTS` other than `gadget`), the silent `RemoveEquipment(targetSlot)` did not actually clear the prior launcher. Issue a corrective `mod.RemoveEquipment(eventPlayer, otherLauncherEnum)` (by id, since slot is ambiguous after a misfire) and log under `FEATURE_PERF_DIAG`.
- Re-record placement only after verification passes.

This makes `giveLauncher` self-correcting against a silent slot-remove failure. It's a guard against the same family of failure that #85 represents at probe time.

### Change 3 — Diagnostic instrumentation for #85

**File:** `src/interaction/ammo-resupply-menu.ts:893-950` (probe site) and `src/interaction/ammo-resupply-menu.ts:1086-1094` (give site)

Under `FEATURE_PERF_DIAG` (or whichever diag flag is the supply-box convention — confirm before writing), log on each `RemoveEquipment` call:
- Player class (`mod.GetSoldierClass`).
- `IsInVehicle` snapshot.
- For each enum in `ENGINEER_GADGET_CANDIDATES`: `HasEquipment(player, enum)` boolean.
- Active slot (if available) and whether `g1Active`/`g2Active`.
- Which call site (probe / give-remove / give-restore).

The goal is one playtest cycle to capture the loadout state at the moment the engine throws. Hypothesis priority:
1. Slot is genuinely empty when probed (no launcher, no AV mine, no Supply Crate, no EOD Bot in slot 1).
2. Engineer is carrying a gadget variant that isn't in `ENGINEER_GADGET_CANDIDATES`.
3. Some interaction with `IsInVehicle` or a vehicle-passenger state we don't currently filter for.

Once root cause is identified, fix is one of: skip probe when slot is provably empty (read `HasEquipment` on every candidate first); extend `ENGINEER_GADGET_CANDIDATES`; add an `IsInVehicle`-style precondition. The diagnostic is the deliverable; the fix is a follow-up.

---

## What this plan does NOT change

- No change to `State.players.lockerSlots` shape.
- No change to `closeArmMenu` / `openArmMenu` reconciliation flow.
- No change to the Supply Box wiring (3 gates + apply-time resync) — confirmed solid in prior investigation.
- No change to `giveRocketCharge` itself — its bug is downstream of `probeLauncherSlot`'s bail. Change 1 fixes #78 by making `slotWithLauncher` return the right slot.
- No change to the per-launcher ammo cap clamp question on AT4 (existing #78 secondary hypothesis). Defer until Change 1 is verified — the no-op may simply disappear.

---

## Verification

1. **Bump version** with a descriptive `bumpVersion -- -c` message.
2. **Build and load** the mod in test environment.
3. **Manual scenarios** at the Supply Box, one Engineer player:
   - **Invariant 1 (no dup):** Equip RPG via menu. Click RPG tile again. Expect: tile is greyed / no give, no second RPG, no ammo change.
   - **Invariant 2 (swap in place):** Equip RPG via menu. Click AT4 tile. Expect: AT4 only, in the same slot RPG occupied. Verify by holstering and inspecting both gadget slots.
   - **Invariant 2 (wielded):** Equip RPG. Wield it (active slot = launcher). Open Supply Box menu. Click AT4. Expect: AT4 swap-in-place, no double-give. (This is the #90 repro.)
   - **Invariant 3 (ammo):** Equip AT4 in slot 2 via toggle preference. Click ammo button. Expect: AT4 ammo refilled. (#78 repro.)
   - **Invariant 4 (toggle):** No launcher equipped. Set toggle to slot 2. Click RPG. Expect: RPG in slot 2.
4. **#85 check:** Open Supply Box menu in 5+ different Engineer loadouts (with launcher / without launcher / with AV mine / with EOD Bot / wielded gadget). Watch console for `RemoveEquipment` engine errors. If they still appear, capture the diagnostic log and append to `conquest_issues.md` #85.
5. **Supply Box wiring regression check:** Toggle Supply Boxes off in the ready dialog mid-session, confirm InteractPoints disable and any open menus close. (Confirms Change 1's added `SetActiveInventorySlot` doesn't break the force-close path.)
6. **Update `conquest_issues.md`:** Append "Latest findings" with v1.339 (or whatever bump lands) under #78, #85, #90 — resolved if green, partial if any scenario still fails.

---

## Critical files

- `bf6-portal/dev/conquest/src/interaction/ammo-resupply-menu.ts` — only file edited.
  - Lines 893-950 (`probeLauncherSlot`) — Change 1 + Change 3.
  - Lines 1060-1096 (`giveLauncher`) — Change 2 + Change 3.
- `bf6-portal/dev/conquest/design_doc/conquest_issues.md` — updated post-verification with findings under #78, #85, #90.
- `bf6-portal/dev/conquest/design_doc/conquest_issues_summary.md` — status updates if any of the three resolve.

## Reference (read-only, no edits)

- `src/interaction/world-interactables.ts` — Supply Box wiring confirmed solid; not in scope.
- `src/ready-dialog/mode-config-presets.ts:336` — apply-time resync; not in scope.
- `bf6-portal/dev/conquest/design_doc/supply_boxes_wiring_plan_2026-04-19.md` — wiring spec.
- `bf6-portal/dev/conquest/design_doc/dynamic_gadget_slot_management_plan.md` — pre-#77 design intent for the destructive probe.

---

## Out of scope

- AT4 ammo cap clamp investigation (defer; may resolve via Change 1).
- Extending `ENGINEER_GADGET_CANDIDATES` — only if the Change 3 diagnostic confirms a missing variant.
- Refactoring the `try { } catch {}` swallowing pattern broadly — only the give-site is touched.
- Any change to `closeArmMenu` / state-deletion semantics on menu close.
