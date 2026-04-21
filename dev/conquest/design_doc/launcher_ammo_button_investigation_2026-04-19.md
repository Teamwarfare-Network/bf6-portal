# Investigation: Launcher Ammo Button May Target Wrong Launcher

**Created:** 2026-04-19
**Status:** Investigation notes only — no fix yet. User needs more testing to reproduce.
**Supersedes:** Previous Supply Boxes wiring plan (shipped v1.325–v1.327).

---

## Context

User suspects the "Launcher Ammo" tile in the ammo-resupply menu occasionally fails to give ammo to the actual launcher the player is holding — i.e. press the button, nothing happens or the wrong slot receives it. This writeup maps the code path, lists plausible failure modes ranked by likelihood, and suggests what to watch for during repro testing. No code changes proposed until we see a reproducible case.

Scope: the **Launcher Ammo** tile only — `giveRocketCharge()` at [ammo-resupply-menu.ts:1213](bf6-portal/dev/conquest/src/interaction/ammo-resupply-menu.ts#L1213). The three launcher-**grant** tiles (RPG/AT4/Stinger) use `giveLauncher()` — different path, called out only where relevant.

---

## How it works today

**The Launcher Ammo button path:**

1. Press dispatches to `giveRocketCharge(eventPlayer, pid)` at [ammo-resupply-menu.ts:2494](bf6-portal/dev/conquest/src/interaction/ammo-resupply-menu.ts#L2494).
2. `giveRocketCharge` reads `State.players.lockerSlots[pid]` and calls `slotWithLauncher(slotsState)` at [line 1217](bf6-portal/dev/conquest/src/interaction/ammo-resupply-menu.ts#L1217). **No live HasEquipment check happens here.**
3. If a slot is returned, it calls `mod.SetInventoryAmmo(player, slot, 1)` (when currently 0) or bumps mag ammo by 1 (when >0). See [lines 1228-1236](bf6-portal/dev/conquest/src/interaction/ammo-resupply-menu.ts#L1228-L1236). Ammo goes to **whatever gadget currently lives in that slot** — the function doesn't re-check that it's still a launcher.
4. `slotWithLauncher` at [line 988](bf6-portal/dev/conquest/src/interaction/ammo-resupply-menu.ts#L988) only returns a slot when the cached entry's `kind === "launcher"`. That tag is set in exactly two places: `recordPlacement()` after our own `giveLauncher()` call ([line 1094](bf6-portal/dev/conquest/src/interaction/ammo-resupply-menu.ts#L1094)), and `probeLauncherSlot()` ([line 2283](bf6-portal/dev/conquest/src/interaction/ammo-resupply-menu.ts#L2283)) which runs once at menu open.

**The probe** ([line 893](bf6-portal/dev/conquest/src/interaction/ammo-resupply-menu.ts#L893)):

- Iterates `ALL_LAUNCHER_VARIANTS` (10 enums), breaks at first `mod.HasEquipment` true → `ownedLauncher`.
- Removes GadgetOne by slot, diffs HasEquipment, restores, infers which slot the launcher lived in.
- Several short-circuits that all set `kind = "launcher"` never:
  - Player is in a vehicle ([line 899](bf6-portal/dev/conquest/src/interaction/ammo-resupply-menu.ts#L899)).
  - Not Engineer class ([line 898](bf6-portal/dev/conquest/src/interaction/ammo-resupply-menu.ts#L898)).
  - `HasEquipment` returned false for every variant in `ALL_LAUNCHER_VARIANTS` ([line 907](bf6-portal/dev/conquest/src/interaction/ammo-resupply-menu.ts#L907)).
  - **Either gadget slot is wielded** at menu open ([line 913](bf6-portal/dev/conquest/src/interaction/ammo-resupply-menu.ts#L913)) — explicit skip to avoid the hand-animation glitch.
  - `multipleFlips` bail when Portal's API misbehaves ([line 938](bf6-portal/dev/conquest/src/interaction/ammo-resupply-menu.ts#L938)).

**Cache lifecycle:** `State.players.lockerSlots[pid]` is seeded on every `openArmMenu()` ([line 2271-2283](bf6-portal/dev/conquest/src/interaction/ammo-resupply-menu.ts#L2271-L2283)) and wiped on `closeArmMenu()` ([line 2241](bf6-portal/dev/conquest/src/interaction/ammo-resupply-menu.ts#L2241)). It is **not** refreshed mid-menu — the 1 Hz refresh loop at [line 1255](bf6-portal/dev/conquest/src/interaction/ammo-resupply-menu.ts#L1255) only repaints the UI from the cached state.

**Gate:** `ammoEnabled` at [line 2153](bf6-portal/dev/conquest/src/interaction/ammo-resupply-menu.ts#L2153) requires `launcherSlotKnown` — so if state has no launcher slot, the tile should be dim and a click silently rejected. In practice however, signature-based redraws may leave the button visually green briefly if state changed.

---

## Suspected failure modes (ranked)

### 1. Probe skipped → silent no-op (MOST LIKELY)

**Scenario:** Player opens the menu while holding a gadget (G1 or G2 wielded). `probeLauncherSlot` bails at [line 913](bf6-portal/dev/conquest/src/interaction/ammo-resupply-menu.ts#L913). `kind` never becomes `"launcher"`. User clicks Launcher Ammo → `slotWithLauncher` returns undefined → `giveRocketCharge` returns false → nothing happens.

**How to repro:** Switch to your launcher (or any gadget slot), walk up to a supply crate, open menu — observe whether the Launcher Ammo tile shows `READY` or `NO LAUNCHER`.

**Evidence in code:** The `initLockerSlotStateFromProbe()` fallback at [line 952-986](bf6-portal/dev/conquest/src/interaction/ammo-resupply-menu.ts#L952-L986) tries to annotate `gadget` but **only if the slot's kind already says `"launcher"`** (it's an annotation pass, not a kind-setter). Comment at [line 957](bf6-portal/dev/conquest/src/interaction/ammo-resupply-menu.ts#L957): "HasEquipment misses some class variants (that's the whole reason we're here)". So if the probe skipped, the fallback doesn't rescue.

### 2. Class-loadout launcher variant not in `ALL_LAUNCHER_VARIANTS`

**Scenario:** Player's kit uses a launcher variant whose enum is missing from the 10-entry list at [line 841-852](bf6-portal/dev/conquest/src/interaction/ammo-resupply-menu.ts#L841-L852). `HasEquipment` returns false for every entry → `ownedLauncher === undefined` → probe bails at [line 907](bf6-portal/dev/conquest/src/interaction/ammo-resupply-menu.ts#L907). Same end state as #1 — button no-ops.

**How to repro:** Try every Engineer class-loadout launcher variant exposed by the game. A post-mortem comment at [line 838-840](bf6-portal/dev/conquest/src/interaction/ammo-resupply-menu.ts#L838-L840) references v1.293 where this exact issue missed class launchers — check whether any variants have been added since.

### 3. Stale cache after mid-menu launcher swap

**Scenario:** Player opens menu (probe runs, launcher in G2 recorded). Before clicking Launcher Ammo, the player somehow swaps to a different slot layout — picked up a crate from the floor, revived with a different kit, dropped the launcher. Cache still says G2 has the launcher; the real launcher is in G1 or gone. `SetInventoryAmmo(player, G2, 1)` writes to G2 which may now hold a non-launcher gadget — **ammo to the wrong slot, wrong item**.

**Assessment:** Mid-menu kit swap without closing is unusual (most menus steal input mode at [line 2289](bf6-portal/dev/conquest/src/interaction/ammo-resupply-menu.ts#L2289)). But if death/revive or any edge case keeps the menu open across kit change, this triggers. Death handling doesn't force-close the menu anywhere I can find — worth verifying.

**How to repro:** Keep menu open, die (teammate revives or spawn-back happens with menu still mounted), observe whether menu is auto-closed. If not, click Launcher Ammo and check which slot's ammo changed.

### 4. `multipleFlips` Portal API surprise

**Scenario:** Probe removes GadgetOne, but the HasEquipment diff reports >1 gadget vanished (Portal bug). Probe bails at [line 938-941](bf6-portal/dev/conquest/src/interaction/ammo-resupply-menu.ts#L938-L941) after best-effort restore. Kind never becomes `"launcher"` → Launcher Ammo no-op.

**Rare but observable if it happens** — hard to repro deterministically.

### 5. Wielding + class-loadout combo

**Scenario:** Engineer with a launcher active in hand (G1 or G2 wielded) AND on a class loadout whose launcher variant is missing from `ALL_LAUNCHER_VARIANTS`. Probe bails on BOTH guards. Double-whammy — button silently dead until user re-opens menu with nothing wielded.

---

## What's NOT broken (ruled out)

- **Variant identity mismatch:** `giveRocketCharge` writes ammo to a **slot**, not a gadget id. So whichever launcher variant sits in that slot receives the ammo — variant mislabeling at open doesn't misroute ammo.
- **Fallback to `GadgetTwo`:** Unlike `giveLauncher()` which uses a fallback slot on unknown state, `giveRocketCharge` refuses outright when state is missing. No risk of writing to a wrong default slot.
- **Hardcoded target:** There is no hardcoded launcher or slot in the ammo path — it's always state-driven.

---

## Critical files

- [bf6-portal/dev/conquest/src/interaction/ammo-resupply-menu.ts](bf6-portal/dev/conquest/src/interaction/ammo-resupply-menu.ts) — all relevant code
  - `giveRocketCharge()` — line 1213
  - `probeLauncherSlot()` — line 893
  - `initLockerSlotStateFromProbe()` — line 952
  - `slotWithLauncher()` — line 988
  - `openArmMenu()` probe seed — line 2271
  - `closeArmMenu()` cache wipe — line 2241
  - `ALL_LAUNCHER_VARIANTS` — line 841
  - `ammoEnabled` gate — line 2153
  - Click dispatch — line 2494

---

## Verification plan (for user testing)

Try each scenario **with a fresh menu open** (no prior click state) and report which ones produce the bug:

1. **Baseline:** Primary weapon wielded, Engineer, default kit launcher, standing still. Open menu, click Launcher Ammo → should work. If this fails we have a deeper issue.
2. **Wielded-gadget open:** Switch to launcher (launcher in hand), walk to crate, open menu, click Launcher Ammo. Expect: probably dim/no-op — confirms failure mode #1.
3. **Switch wield before click:** Open menu with primary wielded (probe runs). Then somehow switch — click still in menu? Usually menu steals input, so this may not be reachable. If it is, mode #3.
4. **Every class loadout:** Cycle through every Engineer class-loadout launcher variant, open menu, click. Any variant that fails = mode #2 candidate. Record the variant name so we can add it to `ALL_LAUNCHER_VARIANTS`.
5. **Post-revive:** Die with menu open (if possible), get revived, click Launcher Ammo. Mode #3.
6. **Two-launcher edge state:** Use Supply Crate from ground + kit launcher to get two launchers in both slots, open menu, click Launcher Ammo — which slot gets it?
7. **Logs:** Add temporary `mod.DisplayCustomNotificationMessage` prints inside `giveRocketCharge` showing `slotsState.g1.kind`, `g2.kind`, and the returned slot on each click. Revert before merging.

---

## Recommended next steps

- **Don't fix yet.** Several failure modes are hypotheses; pick the one that repros and fix that specifically.
- If #1 (wielded-at-open) repros: hardest fix — probe would need a non-destructive path, or we accept silent failure and show a "put launcher away and reopen" message.
- If #2 (missing variant) repros: cheapest fix — add the variant's enum to `ALL_LAUNCHER_VARIANTS`.
- If #3 (stale cache) repros: add a player-death hook that calls `closeArmMenu(pid)`.
- If we see the bug at all but none of these repro: instrument `giveRocketCharge` and capture the state shape on a failing click.

No implementation work in this plan — it's diagnostic scaffolding.
