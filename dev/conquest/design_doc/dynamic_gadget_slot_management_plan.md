# Plan: Dynamic Gadget-Slot Management (Snapshot Probe)

**Created:** 2026-04-18 (replaces completed AT4 team-pool plan — that shipped v1.290–v1.292).
**Status:** Approved. Implementation pending.
**Base:** v1.292.

---

## Context

The gadget-locker currently hardcodes `mod.InventorySlots.GadgetTwo` for every launcher grant and for launcher ammo refills. This produces three user-visible bugs:

1. **Double-gadget**: Player has C4 (class loadout slot 1). Clicks C4 tile → locker writes a second C4 into slot 2. Same for RPG + RPG, Beacon + Beacon, Drone + Drone, etc.
2. **Two launchers**: Player has RPG (slot 1, class). Clicks AT4 → locker writes AT4 into slot 2. Player has two different launchers, which we don't want.
3. **Slot-blind ammo refill**: Launcher Ammo always writes `+1 magazine ammo` to `GadgetTwo`. A player whose launcher is in slot 1 gets no ammo — or worse, we write launcher ammo into whatever non-launcher gadget lives in slot 2.

Goal: make the locker aware of what the player already has and refuse to create duplicates, perform **same-slot launcher replacement**, and route launcher ammo to the actual launcher slot — using a **single snapshot probe at menu open**, no persistent cache, no per-tick work.

---

## API reality (decisive constraints)

Confirmed across `reference_bf6_core` and `reference_sdk_1.2.3`, and corroborated by expert consult:

| We can | We cannot |
|---|---|
| `HasEquipment(player, gadget)` — does the player own it anywhere | Query which gadget is in a specific slot — no `GetEquipmentInSlot` |
| `IsInventorySlotActive(player, slot)` — is this slot currently wielded | Detect kit pickups, equipment changes, class changes — no such events |
| `GetInventoryAmmo(player, slot)` / `GetInventoryMagazineAmmo` — read ammo per slot | Read "which gadget is currently in hand" — no `GetActiveEquipment`/`GetWieldedGadget` |
| `RemoveEquipment(player, gadget)` — remove by gadget ID, no slot needed | **Force-slot-switching as a probe is not viable** — switching gives no new reader. Expert confirms. |
| `isCls(player, mod.SoldierClass.Engineer)` — class filter | Any way to know what's in a slot without layered inference |

**Decisive implications:**
- A persistent cache of "what we placed" is unsafe — kit pickup is undetectable and silently invalidates it.
- Force-switching to probe slots is not actually a probe — there's nothing to read after switching.
- The **only** honest pattern is a snapshot of layered signals at a specific moment (menu open) — `HasEquipment` + `IsInventorySlotActive` + ammo signature + class filter — and accept that it's a confidence model, not certainty. Confidence is very high when signals agree; when they disagree we pick the safest action.

**Game constraint we can lean on:** The base-game spawn menu **cannot give a player two launchers in one loadout.** Only one launcher slot exists in class loadouts. This means the only way to produce a 2-launcher state is via our own locker (today's bug) or a kit pickup from a player whose locker-granted launcher landed in a different slot than their class launcher. Since we're fixing the locker to sole-equip launchers in section 3, post-fix reality is **at most one launcher owned at any time**. Anywhere we detect a single launcher-shape + active-slot signal, that slot is THE launcher slot — no "which of multiple launchers is this" ambiguity. This tightens both the swap-target and the ammo-routing decisions: if we can identify any launcher slot, we use it for both.

---

## Design

### 1. Snapshot probe at menu open (the core mechanism)

When the player opens the gadget locker (and on every `refreshArmMenu` pass for that player), we build a fresh `LockerSnapshot` for that one player. The snapshot lives on the stack / in per-pass locals — **nothing persists across menu sessions**.

```ts
type LockerSnapshot = {
    owned: Record<number, boolean>;       // gadgetId -> HasEquipment result, for every gadget the locker cares about
    launcherSlot?: mod.InventorySlots;    // Best-guess slot for the player's launcher, or undefined if no managed launcher owned
    launcherGadget?: number;              // Which known launcher they own (RPG / AT4 / Stinger), if any
    launcherSlotConfidence: "high" | "low" | "none";
};

function buildLockerSnapshot(player: mod.Player): LockerSnapshot {
    const snap: LockerSnapshot = {
        owned: {},
        launcherSlot: undefined,
        launcherGadget: undefined,
        launcherSlotConfidence: "none",
    };

    // 1. Per-gadget ownership (every gadget the locker grants).
    for (const tile of allLockerGadgetIds()) {
        snap.owned[tile] = mod.HasEquipment(player, tile);
    }

    // 2. Launcher slot identification via layered signals.
    //    Class is NOT used as a scoring signal — the launcher column is already class-gated at
    //    the click handler (isEngineerClass), so this code only runs for Engineers; adding a
    //    class bias would double-weight an already-present filter.
    const launchers = ACTIVE_GADGET_CONFIG.launchers;
    const ownedLaunchers = launchers.filter(L => snap.owned[L.gadget]);

    if (ownedLaunchers.length === 1) {
        snap.launcherGadget = ownedLaunchers[0].gadget;

        const g1Active = mod.IsInventorySlotActive(player, mod.InventorySlots.GadgetOne);
        const g2Active = mod.IsInventorySlotActive(player, mod.InventorySlots.GadgetTwo);
        const g1Ammo   = mod.GetInventoryAmmo(player, mod.InventorySlots.GadgetOne);
        const g2Ammo   = mod.GetInventoryAmmo(player, mod.InventorySlots.GadgetTwo);

        // Launcher ammo signature: loaded == 1. Empty slot returns 0. Many gadgets share
        // loaded==1 shape (beacons, some deployables) — shape alone is not conclusive, which
        // is why it's combined with active-slot below.
        const g1LauncherShape = g1Ammo === 1;
        const g2LauncherShape = g2Ammo === 1;

        let scoreG1 = 0, scoreG2 = 0;
        if (g1Active) scoreG1 += 3;
        if (g2Active) scoreG2 += 3;
        if (g1LauncherShape) scoreG1 += 2;
        if (g2LauncherShape) scoreG2 += 2;

        if (scoreG1 === 0 && scoreG2 === 0) {
            snap.launcherSlotConfidence = "none";                     // no signals at all
        } else if (scoreG1 === scoreG2) {
            snap.launcherSlot = mod.InventorySlots.GadgetTwo;         // tie -> slot 2 fallback
            snap.launcherSlotConfidence = "low";
        } else {
            snap.launcherSlot = scoreG1 > scoreG2 ? mod.InventorySlots.GadgetOne : mod.InventorySlots.GadgetTwo;
            // "high" only when the winner has active + shape together (≥5); otherwise shape alone is "low".
            snap.launcherSlotConfidence = Math.max(scoreG1, scoreG2) >= 5 ? "high" : "low";
        }
    } else if (ownedLaunchers.length > 1) {
        // Post-fix, this should be unreachable — game can't give 2 launchers, sole-equip prevents it here.
        // If it somehow happens (pre-fix-save state, etc.), mark unknown; the sweep in giveLauncher
        // collapses back to one launcher, self-healing the state.
        snap.launcherSlotConfidence = "none";
    }
    // ownedLaunchers.length === 0 => snap.launcherGadget undefined, no slot.

    return snap;
}
```

The snapshot is built per-player at the top of `refreshArmMenu` and re-used for that render + any click handler that fires before the next refresh. Click handlers receive the snapshot alongside the cache.

### 2. Double-copy prevention (works without any slot info)

Every `give*` helper gets a `HasEquipment(player, gadget)` guard at the very top. If true → return `false`. Click-handler sites already treat a `false` return as "no grant, no cooldown" — no downstream changes needed.

- `giveLauncher` — add guard
- `giveMedicSmoke` — already has it
- `giveAssaultItem` — add
- `giveReconItem` — add
- `giveRocketCharge` — N/A (this is a refill, handled separately below)

### 3. Launcher sole-equip policy + **same-slot** replacement

This is the replacement for the user's concern: if the player's launcher is in slot 1, the new launcher lands in slot 1 (not slot 2). Their slot 2 gadget is preserved.

```ts
function giveLauncher(player: mod.Player, newLauncher: number, snap: LockerSnapshot): boolean {
    if (mod.HasEquipment(player, newLauncher)) return false; // dup -> silent reject

    // Determine target slot BEFORE removing the old launcher, because removing changes ammo/active signals.
    let targetSlot: mod.InventorySlots;
    if (snap.launcherSlot !== undefined && snap.launcherSlotConfidence !== "none") {
        targetSlot = snap.launcherSlot;  // same-slot replacement
    } else {
        targetSlot = mod.InventorySlots.GadgetTwo;  // safe default (no existing launcher, or ambiguous)
    }

    // Sweep known launchers by gadget ID (no slot needed for removal).
    for (const L of ACTIVE_GADGET_CONFIG.launchers) {
        if (L.gadget === newLauncher) continue;
        if (mod.HasEquipment(player, L.gadget)) {
            mod.RemoveEquipment(player, L.gadget);
        }
    }

    mod.AddEquipment(player, newLauncher, targetSlot);
    mod.SetInventoryAmmo(player, targetSlot, 1);
    mod.SetInventoryMagazineAmmo(player, targetSlot, 0);
    return true;
}
```

Behaviors:
- Player has RPG slot 1 → clicks AT4 → RPG removed, AT4 added to slot 1. Their slot 2 gadget is untouched. ✓
- Player has RPG slot 2 (earlier locker grant) → clicks AT4 → RPG removed, AT4 added to slot 2. ✓
- Player has no launcher → clicks AT4 → AT4 added to slot 2 (clean default). ✓
- Ambiguous probe (shouldn't happen often) → safe default slot 2. The sweep still removes the old launcher, so we never end up with two.

### 4. Launcher ammo: route to the detected launcher slot

User's quote: *"If we can detect the player has a launcher at all — why aren't we just adding ammo to that slot?"* — exactly right. And because the game enforces at-most-one-launcher (see API reality above), the detected slot IS the launcher slot — no disambiguation needed. Same `launcherSlot` we use for replacement is the one we refill. Rewrite `giveRocketCharge`:

```ts
function giveRocketCharge(player: mod.Player, snap: LockerSnapshot): boolean {
    if (snap.launcherGadget === undefined) return false;  // no managed launcher owned
    if (snap.launcherSlot === undefined) return false;    // probe couldn't identify slot -> no-op (honest)

    const slot = snap.launcherSlot;
    const loaded = mod.GetInventoryAmmo(player, slot);
    if (loaded <= 0) {
        mod.SetInventoryAmmo(player, slot, 1);
        return true;
    }
    const mag = mod.GetInventoryMagazineAmmo(player, slot);
    mod.SetInventoryMagazineAmmo(player, slot, mag + 1);
    return true;
}
```

- Owner's slot identified with any confidence → refill there. (Same slot the swap path would target — consistent behavior.)
- Owner's slot totally unidentifiable (no signals at all) → no-op; don't write to a slot we have no evidence for. (Rare — requires launcher owned but empty-loaded AND neither gadget slot active.)

### 5. UI feedback (so clicks aren't mysterious)

In `refreshArmMenu`'s per-tile render, consult `snap.owned[tile.gadget]` to disable tiles the player already has. Extend `row.sig` with a `playerAlreadyHas` flag so the tile repaints when ownership flips.

- **Assault / Medic / Recon tiles**: disable + gray when `snap.owned[tile.gadget]` is true. Keep existing cooldown/count text on the disabled tile.
- **Launcher tiles (RPG/AT4/Stinger)**: disable + gray a specific launcher tile when `snap.owned[that.gadget]` is true. Other two launchers remain selectable (subject to existing swap cooldown + pool rules).
- **Launcher Ammo tile**: disabled when `snap.launcherGadget === undefined` (no managed launcher owned) OR when `snap.launcherSlot === undefined`. Otherwise behaves like today.

This matches the user's intent: "they already have it → tile shouldn't do anything."

### 6. Refresh coupling

All new logic is per-player. `refreshArmMenu(eventPlayer, ...)` already runs per-player and is the natural owner. Team-shared refreshes (`refreshOpenArm(teamId, true)`) continue to exist for pool-count changes and team-shared cooldowns — these do NOT need the snapshot. Snapshot is strictly a player-scoped concept.

### 7. What we are NOT doing

- **No persistent cache.** No `placedSlotByPidByGadgetId`. The snapshot is stack-local per render pass. Fresh every `refreshArmMenu` call. Kit pickup invalidates naturally because the next snapshot re-reads `HasEquipment`.
- **No per-tick scanning.** The snapshot is event-driven: `refreshArmMenu` is called on menu open, class change, pool state change, cooldown change, player click — not on every tick.
- **No force-switching.** Per expert and API review, this gives no new information.
- **No kit-pickup event subscription.** None exists in either SDK.

---

## Files touched

| File | Change |
|---|---|
| `src/interaction/ammo-resupply-menu.ts` | Add `LockerSnapshot` type + `buildLockerSnapshot()`; add `allLockerGadgetIds()` helper; thread snapshot through `refreshArmMenu` and click handlers; `HasEquipment` dup guards in every `give*`; rewrite `giveLauncher` to use same-slot replacement; rewrite `giveRocketCharge` to use snapshot-identified slot; tile-disable logic in render loop + updated `row.sig` |
| Nothing else | No state schema changes, no config-type changes, no strings.json changes |

---

## Non-negotiables

1. **No persistent slot cache.** Snapshot is built per render pass and thrown away.
2. **Same-slot replacement for launchers** when the probe identifies a slot with any confidence.
3. **Safe default (slot 2)** only when the player has no existing launcher, or when signals are truly ambiguous.
4. **Silent reject on dup with no cooldown consumed.**
5. **No force-switching.** Not a viable probe.
6. **Per-player refresh only** — never surface per-player state through team-shared repaint paths.

---

## Verification

**Build:**
- `npm run build` → `cmd /c npx tsc --pretty false --noEmit` → clean.

**Playtest (your testing matrix):**

1. **Dup-click C4 (Recon class loadout):**
   - Spawn Recon with C4 in default loadout. Open locker, click C4 tile.
   - **Expected:** Nothing happens. No SFX. No cooldown tick. Tile renders disabled.

2. **Dup-click RPG (Engineer class loadout):**
   - Spawn Engineer with RPG as class launcher. Open locker, click RPG tile.
   - **Expected:** Nothing happens. RPG tile renders disabled. No swap-cooldown firing.

3. **Same-slot launcher swap — class loadout case:**
   - Spawn Engineer with RPG (slot 1). Put something in slot 2 first if you can (or verify default is empty). Open locker, click AT4.
   - **Expected:** RPG gone from slot 1. AT4 is in **slot 1** (not slot 2). Any pre-existing slot 2 gadget is UNTOUCHED. Swap cooldown starts.

4. **Same-slot launcher swap — locker-granted case:**
   - Fresh Engineer spawn. Click RPG in locker → RPG lands in slot 2 (safe default).
   - Wait for swap cooldown, then click Stinger.
   - **Expected:** RPG replaced by Stinger, still in slot 2.

5. **Launcher ammo on class-loadout launcher (the bug fix):**
   - Spawn Engineer with class RPG (slot 1). Use launcher until magazine is low. Open locker, click Launcher Ammo.
   - **Expected:** Slot 1 magazine ammo increments by 1 (not slot 2).

6. **Launcher ammo on locker-granted launcher:**
   - Spawn Engineer. Pick AT4 from locker (slot 2). Fire. Click Launcher Ammo.
   - **Expected:** Slot 2 magazine ammo increments by 1.

7. **Launcher ammo with no launcher owned:**
   - Spawn a non-Engineer class that doesn't have a launcher. Open locker.
   - **Expected:** Launcher Ammo tile rendered disabled.

8. **Kit pickup stale-info test (the expert-flagged scenario):**
   - Player A has AT4 via locker (slot 2 per earlier click). Player B (on the ground, dead) has an RPG from class loadout in slot 1.
   - A picks up B's kit. A's inventory is now whatever B had — let's say RPG slot 1 + something in slot 2.
   - A opens locker. Snapshot probes fresh: `HasEquipment(RPG) = true`, `HasEquipment(AT4) = false` (kit pickup replaced). `IsInventorySlotActive` and ammo signature point at slot 1.
   - **Expected:** Snapshot correctly identifies RPG in slot 1. Launcher Ammo refills slot 1. No stale data. ✓
   - Click AT4 tile → RPG removed by gadget ID, AT4 placed in slot 1 (snapshot-identified). Other slot 2 gadget preserved. ✓

9. **Worst-case probe failure:**
   - Rare scenario — player holds primary/throwable (not gadget slot), magazine ammo depleted on launcher, etc. Snapshot confidence = "low" or "none".
   - Launcher Ammo tile click: either no-op (if `launcherSlot` undefined) or refills the guessed slot (low confidence default → GadgetTwo).
   - Same-slot swap: falls back to GadgetTwo for placement. Any existing slot 1 launcher still removed via gadget ID sweep. Player ends with one launcher in slot 2.

10. **Rapid re-open:**
    - Close locker, pick up kit, re-open. Snapshot rebuilds. New ownership reflected immediately.

**Version bump:** `npm run bumpVersion -- -c "ammo-locker: snapshot-probe dynamic slot management (dup prevent + same-slot launcher swap + honest launcher ammo)"`.

---

## Rollback

Single-version bump. No schema changes. Revert is a pure function-body revert in `ammo-resupply-menu.ts`. No downstream dependencies.
