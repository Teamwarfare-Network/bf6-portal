# Plan: Fix #95 (uniform 3-rocket cap + at-cap UI) and #96 (zero-ammo launcher slot ID)

**Created:** 2026-04-25
**Issues:** [`#95 CQ_Bug_Launcher_Ammo_Cap_Below_Designed`](./conquest_issues.md), [`#96 CQ_Bug_Launcher_Slot_Identification_Zero_Ammo`](./conquest_issues.md)
**Companion to:** [`tier_1_2_3_cleanup_plan_2026-04-25.md`](./tier_1_2_3_cleanup_plan_2026-04-25.md), [`dynamic_gadget_slot_management_plan.md`](./dynamic_gadget_slot_management_plan.md)

---

## Context

Two adjacent Supply Box menu issues:

- **#95:** The Launcher Ammo tile silently caps below configured per-launcher `maxAmmo` (RPG=4 / AT4=3 / Stinger=4 vs configured 6/5/6). User has decided not to investigate the engine-side cause (out of scope) and is changing the design to a **uniform 3-rocket cap for any launcher**. When at cap, the tile must be visibly gray / "not available" so players don't keep spamming the button.
- **#96:** When a launcher reads 0/0/inactive (engineer cold-spawn with no ammo, or after firing the last rocket), `probeLauncherSlot`'s v1.344 short-circuit cannot identify the slot. It falls through to a destructive `RemoveEquipment(GadgetOne)` probe that risks clobbering non-launcher gadgets if the AddEquipment restore fails. User has rejected the "cache aggressively at deploy/kill events" approach because a player can pick up a different kit at any time, invalidating any pre-menu cache. User's preferred fix: a **non-destructive +1-ammo disambiguation step** that runs at menu-open / launcher-placement, before any destructive probe.

---

## #95 — Uniform 3-rocket cap + at-cap UI

### Files

- [`src/interaction/ammo-resupply-menu.ts`](../src/interaction/ammo-resupply-menu.ts) — config table (lines 67–69), at-cap UI block (lines 2287–2322).
- [`src/strings.json`](../src/strings.json) — new player-facing string (user-approved 2026-04-25).

### Change set

1. **Cap unification.** Edit the `launchers` array at `ammo-resupply-menu.ts:67–69`:
   - RPG: `maxAmmo: 6` → `maxAmmo: 3`
   - AT4: `maxAmmo: 5` → `maxAmmo: 3`
   - Stinger: `maxAmmo: 6` → `maxAmmo: 3`
   - The `pool.maxCount: 4` rate-limit on AT4 stays (orthogonal to per-player cap).

2. **At-cap label.** The existing `atCap` gate at `ammo-resupply-menu.ts:2287–2297` already drives `ammoEnabled = ... && !atCap`, and the tile header color already flips to `COLOR_GRAY` via the existing branch at `:2313`. What's missing is a distinct countdown label for the at-cap state — today the label still reads "Ready" at cap. Add a new branch in the `cd` countdown label block at `:2317–2319`:

   ```
   !isEngineerClass || !hasLauncher
       ? STR_UI_NO_LAUNCHER
       : ammoRemaining > 0 ? clock
       : atCap ? STR_UI_LAUNCHER_AT_CAP    ← new branch
       : STR_UI_READY
   ```

   Color follows the same precedence: `COLOR_GRAY` when atCap, otherwise existing logic at `:2320–2323`.

3. **New string-key (user-approved 2026-04-25).** Add to `strings.json`:
   - Key: `twl.ui.launcher.atCap`
   - Constant: `STR_UI_LAUNCHER_AT_CAP`
   - Value: `"Full"` (user-approved).

   Approval recorded: this satisfies the AGENTS.md `String Change Authorization Policy` requirement for the change set.

4. **Cache-invalidation note.** The tile signature at `:2305–2311` already factors `ammoEnabled`, which already factors `atCap`. So the existing dirty-detection re-renders the tile when `atCap` flips. No signature change needed.

### Why this works

- The `giveRocketCharge` cap-defense gate at `:1341` reads `launcherMaxAmmoFor(gadgetId)` from the same config — automatically lowers to 3 with the config edit. No code change needed at the give-side.
- The user has declared the engine-side reserve clamp is not relevant. With `maxAmmo: 3`, the engine's natural cap (which appears to be 3 for AT4 and 4 for RPG / Stinger per the off-by-2 evidence) is at-or-above 3 for AT4, and above 3 for RPG / Stinger. Our cap becomes the binding constraint for all three; the engine clamp never matters in user-facing behavior.
- The v1.343 read-back-verify at `:1354–1365` continues to refund charges if the engine ever silently no-ops a write — defensive layer remains in place.

---

## #96 — Non-destructive +1-ammo disambiguation before destructive probe

### Files

- [`src/interaction/ammo-resupply-menu.ts`](../src/interaction/ammo-resupply-menu.ts) — `probeLauncherSlot` (lines 904–1002).

### Change set — replace the v1.344 short-circuit (lines 929–948) with a `+1`-ammo disambiguation step

New flow inside `probeLauncherSlot`, after the existing setup (HasEquipment-launcher check, active-slot snapshot for `ForceSwitchInventory` restore — keep all of that):

**Step A — Snapshot original state (extend what already exists):**
- `slot1LoadedOrig`, `slot1MagOrig` (already captured at `:937–938`).
- Add `slot2LoadedOrig`, `slot2MagOrig` (currently only captured inside the short-circuit at `:942–943` — hoist to top so we have it for every branch).
- `g1Active`, `g2Active` already captured at `:925–926`.

**Step B — Pre-guard with HasEquipment scan, then probe-write +1 on each candidate slot:**

Sub-step B1 — HasEquipment scan (one pass, results cached for re-use in Step D):
- Build `ownedSet` = list of gadgets in `ENGINEER_GADGET_CANDIDATES ∪ assault ∪ medicItems ∪ recon` for which `HasEquipment(player, g)` returns true. Wrap each call in try/catch.
- If `ownedSet` is empty: player owns nothing in either gadget slot. Skip the rest; return `{slot: undefined, gadget: undefined}`.

Sub-step B2 — Cheap-positive short-circuits (avoid +1 write where ammo state already proves population):
- If slot N reads `(loadedOrig > 0 || magOrig > 0 || gNActive)` already, mark `slotNPopulated = true` without writing. This is the v1.344 short-circuit logic, generalized to apply per-slot.
- If both slots are positive-populated this way, skip Step B3 and go straight to Step C (both populated → Step D).

Sub-step B3 — +1 disambiguation only on slots that are 0/0/inactive AND where a populated state is plausible (player owns at least one gadget):
- For each slot where `slotNPopulated` is not yet decided:
  - `SetInventoryAmmo(slotN, slotNLoadedOrig + 1)`, then `GetInventoryAmmo(slotN)` → `slotNLoadedAfter`.
  - Wrap write + read in try/catch.
  - `slotNPopulated = (slotNLoadedAfter > slotNLoadedOrig)`. If the +1 took, the slot has a gadget. If not, the slot is empty.

Engine-clamp safety: if a fully-loaded launcher is in the slot (loaded already at engine cap), `loadedOrig + 1` may silently no-op. Mitigation: this case already has `slotNPopulated = true` from Sub-step B2's positive-populated check (ammo > 0). So Sub-step B3 only runs against 0/0/inactive slots, where `loadedOrig + 1 == 1` is below any engine cap.

**Step C — Branch on the populated counts:**

| `slot1Populated` | `slot2Populated` | Action |
|---|---|---|
| true | false | Launcher is in slot 1 (player owns launcher per HasEquipment, only slot 1 has anything). Skip destructive probe. Restore both slots' ammo (Step E). Return `{slot: GadgetOne, gadget: ownedLauncher}`. |
| false | true | Launcher is in slot 2 (mirror). Skip destructive probe. Restore. Return `{slot: GadgetTwo, gadget: ownedLauncher}`. |
| true | true | Both slots populated. Destructive probe needed (Step D). |
| false | false | Player owns a launcher per HasEquipment but neither slot accepted +1. Contradiction; bail with `{slot: undefined, gadget: undefined}` so caller falls back. Restore. (Edge case — class-loadout pickup race window where HasEquipment lags slot state. Should be rare.) |

**Step D — Destructive probe (only on both-populated branch):**
- This is the existing destructive-probe block at `:950–1001`. Keep it, but operate on the post-+1 state instead of original. Restore (Step E) sets ammo back to original after the destructive cycle, including undoing the +1.

**Step E — Restore original ammo and active slot:**
- For both slots, regardless of which branch ran:
  - `SetInventoryAmmo(slot, slotNLoadedOrig)`
  - `SetInventoryMagazineAmmo(slot, slotNMagOrig)`
- `ForceSwitchInventory(activeSlotToRestore)` — already in the existing code at `:994–996`; apply on every branch (success path + bail path).

### Empty-slot write avoidance — HasEquipment pre-guard (user-selected 2026-04-25)

To keep engine error logs quiet, the implementation pre-guards the +1 write with a `HasEquipment` scan:

- Before writing +1 to a slot reading 0/0/inactive, walk `HasEquipment` across the union of `ENGINEER_GADGET_CANDIDATES` (defined at `:890–898`) AND the non-launcher managed-gadget list assembled from `ACTIVE_GADGET_CONFIG.assault` + `.medicItems` + `.recon` (the same set already collected at `:1020–1024` inside `initLockerSlotStateFromProbe`).
- If `HasEquipment` returns `false` for every gadget in that union, the player owns nothing that could be in either slot — both slots are demonstrably empty. Short-circuit: return `{slot: undefined, gadget: undefined}` without any +1 write.
- If `HasEquipment` returns `true` for the launcher only (no other managed gadget owned), exactly one slot holds the launcher and the other is empty. Read both slots; the slot with non-zero `loaded || mag || active` is the launcher's slot. If both read 0/0/inactive (cold-spawn empty launcher), still need the +1 disambiguation — but only on slots where some owned gadget *could* live.
- Caching opportunity: build the HasEquipment-owned list once at the start of the probe (it doesn't change during the probe's synchronous lifetime). Reuse it for the destructive-probe `before[]` snapshot at `:951–956` so we don't pay ~10 HasEquipment calls twice on the both-populated branch.

Adds ~10 `HasEquipment` calls per probe, but the probe runs at most twice per menu open (once at `openArmMenu`, plus possibly once at `tryPlaceLauncher` if the user clicks a launcher row). Acceptable cost; eliminates the log noise.

### Combat-interruption mitigation

User's concern: "we need to be careful not to interrupt combat too much with this."

Existing surface:
- `probeLauncherSlot` only runs at `openArmMenu` (`:2421`) and `tryPlaceLauncher` (`:1181`). Not on refresh ticks. Bounded to those two entry points.
- The destructive `RemoveEquipment` step does auto-switch the wielded slot — already mitigated by `ForceSwitchInventory(activeSlotToRestore)`. No regression.
- The +1 step adds two `SetInventoryAmmo` writes + two `GetInventoryAmmo` reads. All synchronous JS — total elapsed time ~microseconds. No `mod.Wait`, no async window. Player cannot close the menu mid-probe because JS doesn't yield.
- Player picking up a kit during the probe is impossible for the same reason (synchronous engine calls; pickup is processed before or after but not during).

No additional combat-guard needed beyond what's already there. The probe completes atomically.

### Why this works for the cold-spawn case

- Engineer cold-spawn with launcher (0 ammo) in slot 2, EOD Bot (any state) in slot 1:
  - Step B: SetInventoryAmmo on slot 1 (EOD Bot exists) → write succeeds → slot1LoadedAfter > orig → populated. SetInventoryAmmo on slot 2 (launcher exists, 0 ammo) → write succeeds → slot2LoadedAfter > orig → populated.
  - Step C → both populated → Step D destructive probe → identifies which slot.
  - Step E → restores both slots' original ammo (including the launcher's 0/0).
- Engineer cold-spawn with launcher (0 ammo) in slot 2, slot 1 empty:
  - Step B: SetInventoryAmmo on slot 1 (empty) → write fails or no-ops → slot1LoadedAfter == orig → not populated. SetInventoryAmmo on slot 2 (launcher) → succeeds → populated.
  - Step C → only slot 2 populated → return `GadgetTwo` immediately. **No destructive probe runs.** No clobber risk.
  - Step E → restores slot 2's ammo to original 0/0; slot 1 untouched.

### Edge case — what if `SetInventoryAmmo` silently succeeds on a truly-empty slot?

The HasEquipment pre-guard (Step B1) eliminates this concern almost entirely: we only write +1 to a slot when the player owns at least one gadget that *could* be in that slot. If the player owns zero managed gadgets, we never write to either slot.

The remaining narrow edge case: player owns exactly one gadget; both slots read 0/0/inactive; we write +1 to both (we don't yet know which slot has the gadget). If the engine accepts +1 on the empty slot (phantom-populated), we'd misclassify both as populated and run the destructive probe. Outcome of destructive probe in that case: `RemoveEquipment(GadgetOne)` on either branch correctly identifies which slot held the real gadget via the HasEquipment diff. So the worst-case path still produces correct behavior, just at the cost of an unnecessary destructive cycle. Acceptable.

---

## Bundle / build impact

- **#95:** ~1 line change to config + ~3 lines for new label branch + 1 string-key entry in `strings.json`. Net: <100 bytes.
- **#96:** Replaces ~20 lines (the v1.344 short-circuit block) with ~40 lines (the +1 probe + branch logic + restore). Keeps the existing destructive-probe block untouched. Net: ~+500 bytes estimated.

Headroom at v1.372: 1.53% (16,086 bytes free). Both changes fit comfortably.

---

## Verification

### #95 — uniform cap + at-cap UI

1. Apply changes; bump version per AGENTS.md (`npm run bumpVersion -- -c "..."`).
2. Build clean (`npm run build`); confirm bundle size delta and headroom.
3. Single-player playtest, Engineer class, Firestorm:
   - Spawn with each launcher (RPG / AT4 / Stinger). For each:
     - Open Supply Box menu. Confirm Launcher Ammo tile is enabled (green header), countdown reads "Ready" (or current ammo timer if cooling).
     - Click Launcher Ammo. Confirm ammo total goes 1→2→3 (verify via admin position-debug or temporary log).
     - At total = 3, click again. Confirm tile grays out (header `COLOR_GRAY`, countdown label is "Full" with `COLOR_GRAY`), charge NOT consumed.
     - Fire one rocket → total drops to 2. Confirm tile re-enables on next menu refresh tick.

### #96 — zero-ammo probe

1. Apply changes; bump version; build clean.
2. SDK behavior probe (skippable since HasEquipment pre-guard eliminates dependence on the empty-slot write behavior). If desired for documentation: spawn a non-engineer (e.g. Assault) with empty GadgetOne. Call `SetInventoryAmmo(player, GadgetOne, 1)` from a debug button; read back; log result. Outcome doesn't change the implementation either way.
3. Engineer cold-spawn case (no kit pickup yet):
   - Spawn engineer with default loadout (launcher + EOD Bot). Open Supply Box menu IMMEDIATELY. Click Launcher Ammo. Confirm ammo lands in the launcher slot, EOD Bot is intact.
   - Repeat with launcher in slot 1 (toggled) instead of slot 2.
4. Post-fire-empty case:
   - Engineer spawn → fire all rockets to 0. Open Supply Box menu. Click Launcher Ammo. Confirm ammo lands in the launcher slot (now non-zero), EOD Bot intact.
5. Mid-life kit pickup case (the one that motivated rejecting the "cache at events" approach):
   - Engineer spawn. Walk to a different class kit drop, pick it up. Now player is e.g. Assault. Walk to a Supply Box and open menu. Confirm Launcher Ammo tile is correctly disabled (player no longer engineer / no launcher).
   - Reverse: pickup an engineer kit mid-life having been Assault. Open Supply Box. Confirm probe runs at menu-open, identifies launcher slot fresh, no clobber.
6. Combat-interruption check:
   - Engineer in active firefight, mid-aim with launcher wielded. Quickly open Supply Box menu (e.g. close to a smoke marker). Confirm: probe runs, ammo restored to original, wielded slot restored via `ForceSwitchInventory`. No visible weapon-swap jitter.
7. Both-slots-populated (existing destructive-probe path) regression:
   - Engineer spawn with RPG (some ammo) + EOD Bot (some ammo). Open menu. Confirm probe identifies launcher correctly, no gadget loss.
8. Cold + empty-slot case:
   - Engineer spawn with ONLY a launcher in slot 2 (no slot 1 gadget). Open menu. Confirm probe short-circuits to slot 2 without touching slot 1 destructively (no engine error log lines from empty-slot RemoveEquipment).

### Ship sequencing — single version (user-selected 2026-04-25)

Both fixes ship together in one version bump. Single playtest cycle covers both. If a regression appears, the per-issue test plans above isolate which fix introduced it.

Version-bump command:
- `npm run bumpVersion -- -c "uniform 3-rocket launcher cap with at-cap 'Full' label; +1-ammo HasEquipment-guarded probe replaces v1.344 short-circuit for 0-ammo launcher slot ID"`
- After bump: `npm run build` (confirm bundle below 1,048,576 bytes); `cmd /c npx tsc --pretty false --noEmit` (exit 0).
- Update `conquest_issues.md` and `conquest_issues_summary.md` entries for #95 and #96 to "Resolved (vX.Y) — pending MP confirmation".

---

## Out of scope (not addressed by this plan)

- **#94 — `GetInventoryAmmo` engine error log on Supply Box open.** Separate fix planned (audit unwrapped call sites + add `HasEquipment` precheck).
- **Engine-side ammo cap investigation for #95.** User explicitly out-of-scoped. We're trusting the off-by-2 pattern is engine-clamp behavior and shipping the design change without a probe playtest.
- **Cache-at-events for #96.** Explicitly rejected by user — kit pickup mid-life invalidates any pre-menu cache. Probe-at-menu-open is the right pattern.
- **Per-class slot-toggle preference integration.** The `lockerSlots[pid]` slot-toggle preference is already respected by `giveLauncher` placement; #96 doesn't change that path. The probe simply identifies what's currently in each slot.
