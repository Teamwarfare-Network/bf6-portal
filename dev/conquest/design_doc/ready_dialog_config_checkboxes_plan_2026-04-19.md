# Plan: Ready Dialog Config Column — Checkbox Deploy Toggles + Supply Boxes Toggle (UI-only)

**Created:** 2026-04-19
**Status:** Drafted for review — revised per user feedback to scope as UI-only.
**Base:** v1.313 (post-gadget-locker work).
**Shipped:** v1.315.

> Historical reference. Preserved from `~/.claude/plans/sleepy-juggling-thunder.md` at ship time.

---

## Context

Why: The ready-dialog center column currently has a single Vehicle Deploy stepper with two states (`Vanilla Deploy` / `HQ Deploy`) and no way to enable the previously-planned Air Deploy or Forward Deploy features. It also has no toggle for the Supply Boxes (ammo-resupply) feature.

**Scope of this change (UI-only):** Build the checkbox column in the ready dialog and the state that backs it. Do NOT wire the new checkboxes (Air, Forward, Supply Boxes) to any downstream behavior — those features will be built in a separate future change. The Vanilla ↔ HQ pair continues to drive the existing `vehicleDeployMethod` enum (both values are already wired to real behavior today). Air, Forward, and Supply Boxes checkboxes get new state fields that nothing reads yet.

User directives captured:
1. Remove the "Configuration" column header.
2. Move the Game Mode stepper (master toggle: `TWL Conquest 10v10`, etc.) up one row so it sits in line with the other column headers (WEST/EAST/etc.). Keep the stepper fully functional — it is NOT being replaced.
3. Rename the Game Mode sub-header from `Game Mode:` → `Game Mode Configuration:`.
4. Remove the Vehicle Deploy left/right stepper.
5. Add 5 checkbox rows in its place:
   - `[ ] Vanilla Deploy`
   - `[ ] HQ Deploy`
   - `  [ ] Air Deploy`       (indented under HQ)
   - `  [ ] Forward Deploy`   (indented under HQ)
   - `[ ] Supply Boxes`
6. Boxes are clickable; checked shows `[X]`, unchecked `[ ]`.
7. Linkage rules:
   - Vanilla and HQ are mutually exclusive; exactly one MUST be checked.
   - Clicking the one that is already on flips to the other (radio pair via toggles).
   - Air / Forward are orthogonal children of HQ (each independently on/off).
   - Clicking Air or Forward while Vanilla is on auto-switches to HQ and enables the child.
   - Supply Boxes is fully orthogonal.
8. Valid Vanilla/HQ/Air/Forward combinations: `V`, `H`, `HA`, `HAF`, `HF`.
9. Default at round start: `Vanilla` + `Supply Boxes`.
10. Air/Forward/Supply Boxes checkbox state persists through Apply/Reset/presets like any other knob, but nothing reads it downstream in this change.
11. Air/Forward render identically regardless of whether Vanilla or HQ is active. The `X` character inside the box is the only visual cue — no dimming, no greyed border.
12. Leave a second sub-column of empty space inside the Configuration column for future checkboxes.

Checkpoint exists for rollback.

---

## Current state (as researched)

- **Center column build:** [bf6-portal/dev/conquest/src/ready-dialog/mode-config-schema.ts:54-64](../src/ready-dialog/mode-config-schema.ts#L54-L64) declares the `config` column with 4 knob specs: `gameMode`, `modeSettings` (placeholder, hidden via `isReadyDialogModeGridPlaceholderKnobKey`), `vehicles`, `players`.
- **Knob row builder:** [bf6-portal/dev/conquest/src/ready-dialog/dialog-build-mode-config.ts:34-171](../src/ready-dialog/dialog-build-mode-config.ts#L34-L171) builds every knob row as `[dec] [label+value] [inc]` at 26×24 px per button.
- **Column header text:** `getReadyDialogModeGridColumnHeaderMessage()` in [mode-config-schema.ts:114-129](../src/ready-dialog/mode-config-schema.ts#L114-L129) → string key `twl.readyDialog.configurationColumnLabel`.
- **Vehicle Deploy state:** integer `State.round.modeConfig.vehicleDeployMethod` with `VANILLA=0` and `HQ=1` actively reachable via UI. Two ordering constants (`HQ_FORWARD=2`, `HQ_FORWARD_AIR=3`) exist but are unreachable via UI; downstream gates using `>= HQ_FORWARD` / `=== HQ_FORWARD_AIR` stay dead code in this change. Defined in [bf6-portal/dev/conquest/src/foundation/gameplay.ts:195-206](../src/foundation/gameplay.ts#L195-L206).
- **Live consumers of `vehicleDeployMethod` (leave all untouched):**
  - [src/vehicles/vanilla-spawner.ts:74-77](../src/vehicles/vanilla-spawner.ts#L74-L77) `isVanillaDeployMode()`
  - [src/vehicles/hq-deploy.ts:40-42](../src/vehicles/hq-deploy.ts#L40-L42) `isHqDeployMode()`
  - [src/vehicles/deploy-timer-ui.ts:163,1513-1516](../src/vehicles/deploy-timer-ui.ts#L1513-L1516)
  - [src/ready-dialog/countdown-flow.ts:100-106](../src/ready-dialog/countdown-flow.ts#L100-L106)
  - [src/ready-dialog/mode-config-readout.ts:223,287-289](../src/ready-dialog/mode-config-readout.ts#L223) (readout label for the old stepper — see §5)
  - [src/ready-dialog/mode-config-presets.ts:25,106-107,124,141,189-197,217](../src/ready-dialog/mode-config-presets.ts#L25)
  - [src/config/map-runtime.ts:663](../src/config/map-runtime.ts#L663)
- **Click handler pattern:** [src/interaction/ui-events-ready.ts:39-69](../src/interaction/ui-events-ready.ts#L39-L69) parses widget name → `knobKey` + `delta`, routes to setter, calls `updateReadyDialogModeConfigForAllVisibleViewers()`.
- **Reconfirm on change:** every setter calls `requireReadyReconfirmAfterConfigChange(changedBy)` so a player who already hit Ready gets un-readied when anything changes.
- **Commit path:** `confirmReadyDialogModeConfig` in [mode-config-presets.ts:199-238](../src/ready-dialog/mode-config-presets.ts#L199-L238) copies draft → `confirmed`. Consumers read `confirmed.*`.

---

## Design

### 1. State model — minimal additions, no rewrites

Keep `vehicleDeployMethod: number` exactly as it is. It continues to be the source of truth for Vanilla vs HQ, read by all existing consumers unchanged. The Vanilla/HQ checkboxes are a new UI surface over the same field:
- `Vanilla checkbox checked` ↔ `vehicleDeployMethod === VEHICLE_DEPLOY_METHOD_VANILLA`
- `HQ checkbox checked` ↔ `vehicleDeployMethod === VEHICLE_DEPLOY_METHOD_HQ`

Add **three new fields** for the three new checkboxes (Air, Forward, Supply Boxes). These fields are written by the UI but read by nothing downstream in this change. They exist so the UI state persists through Apply / Reset / preset apply.

`src/foundation/gameplay.ts` — in `ReadyDialogModeConfig` and its `confirmed` sub-type:
```ts
airDeployEnabled: boolean;       // default false
forwardDeployEnabled: boolean;   // default false
supplyBoxesEnabled: boolean;     // default true
```

No changes to `VEHICLE_DEPLOY_METHOD_*` constants, `READY_DIALOG_VEHICLE_DEPLOY_METHOD_OPTIONS`, or any enum-reading call site. Keep all obsolete-looking strings (`vehicleDeployLabel`, `vehicleDeployVanilla`, etc.) per user request.

### 2. No downstream consumer changes

Explicitly out of scope for this change:
- `vanilla-spawner.ts`, `hq-deploy.ts`, `deploy-timer-ui.ts`, `countdown-flow.ts`, `world-interactables.ts` — all untouched.
- The dead-code gates `hqDeployAllowed` / `forwardDeployAllowed` / `airDeployAllowed` in `deploy-timer-ui.ts:1513-1516` stay dead.
- `open_ammo_resupply_menu` in `world-interactables.ts` stays unconditional. Supply Boxes checkbox state is stored but not yet enforced.

Future work (tracked separately): wire Air/Forward into spawn flow; wire Supply Boxes into the ammo-resupply interactable.

### 3. UI — checkbox row builder

The `config` column's `knobSpecs` array becomes `[gameMode, players]` — drop `modeSettings` placeholder and `vehicles` (old stepper). The checkbox block is rendered by a new dedicated helper (not a knob), between Game Mode and Players.

**Column layout inside the 216px-wide `config` column:**
- Left sub-column: 104 px — holds all 5 checkboxes.
- 8 px gap.
- Right sub-column: 104 px — reserved blank for future checkboxes.

```
columnX      = existing config column X
leftSubColX  = columnX            (offset 0)
leftSubColW  = 104
rightSubColX = columnX + 112      (reserved — no widgets rendered)
rightSubColW = 104

rowH_check   = 20
indentChild  = 20 (within left sub-col)
boxSize      = 14 × 14
```

**Header behavior:**
- For the `config` column, `getReadyDialogModeGridColumnHeaderMessage()` returns a blank message AND the header widget is skipped entirely (not created-then-hidden) so the row is free for the Game Mode stepper.
- All 6 other columns keep their existing team/role headers.

**Game Mode row relocation:**
- The `gameMode` knob row builds at `rowY = 0` (the Y slot the "Configuration" header used to occupy) so it sits in line with the WEST/EAST headers in the other columns.
- The existing `gameMode` label above the stepper changes from `"Game Mode:"` → `"Game Mode Configuration:"` via a new/renamed string key (see §7).

**Y layout (column-local):**
```
Y = 0    → Game Mode stepper (was "Configuration" header slot)
Y = 30   → [Checkbox] Vanilla Deploy         (left sub-col, no indent)
Y = 50   → [Checkbox] HQ Deploy              (left sub-col, no indent)
Y = 70   →   [Checkbox] Air Deploy           (left sub-col, indent +20)
Y = 90   →   [Checkbox] Forward Deploy       (left sub-col, indent +20)
Y = 110  → [Checkbox] Supply Boxes           (left sub-col, no indent)
Y = 130  → Players stepper
Y = 150+ → Support text / unsaved-changes label
```

Action button row remains at `buttonRowY = 144`; the Players row at Y=130 with 24 px value panel ends at ~Y=154 which may intrude on the action row. Mitigation: deleting the `modeSettings` placeholder (hidden spacer, ~30 px recovered) keeps the column within budget. Final Y values will be tuned during implementation if measurements show residual collision; the layout above is the target.

**Per-checkbox widget tree (left sub-column only):**
- Outlined square `addOutlinedButton`, 14×14, at `leftSubColX + indent` — clickable hit target.
- Centered text inside the box: `"X"` when checked, `" "` when unchecked.
- Label text panel to the right: starts at `leftSubColX + indent + boxSize + 4`, width `leftSubColW − indent − boxSize − 4`, font size 12, left-anchored.

Widget IDs get a new prefix `UI_READY_DIALOG_CONFIG_CHECKBOX_*` to avoid collision with knob-row caches. Each checkbox has a stable key: `vanilla`, `hq`, `air`, `forward`, `supplyBoxes`.

### 4. Click handler + linkage rules

Add a handler branch in [src/interaction/ui-events-ready.ts](../src/interaction/ui-events-ready.ts) matching the new widget-name prefix; dispatch to per-checkbox toggle setters. Shares the existing primary-click debouncer.

New setters in [src/ready-dialog/mode-config-presets.ts](../src/ready-dialog/mode-config-presets.ts):

```ts
function toggleReadyDialogVanillaDeploy(changedBy?: Player) {
    // Clicking Vanilla always flips the Vanilla/HQ pair.
    // If Vanilla is on → switch to HQ (children preserved).
    // If Vanilla is off (HQ is on) → switch to Vanilla; force-clear Air/Forward.
    const cfg = State.round.modeConfig;
    if (cfg.vehicleDeployMethod === VEHICLE_DEPLOY_METHOD_VANILLA) {
        cfg.vehicleDeployMethod = VEHICLE_DEPLOY_METHOD_HQ;
    } else {
        cfg.vehicleDeployMethod = VEHICLE_DEPLOY_METHOD_VANILLA;
        cfg.airDeployEnabled = false;
        cfg.forwardDeployEnabled = false;
    }
    requireReadyReconfirmAfterConfigChange(changedBy);
    updateReadyDialogModeConfigForAllVisibleViewers();
}

function toggleReadyDialogHqDeploy(changedBy?: Player) {
    // Mirror: clicking HQ flips the pair.
    const cfg = State.round.modeConfig;
    if (cfg.vehicleDeployMethod === VEHICLE_DEPLOY_METHOD_HQ) {
        cfg.vehicleDeployMethod = VEHICLE_DEPLOY_METHOD_VANILLA;
        cfg.airDeployEnabled = false;
        cfg.forwardDeployEnabled = false;
    } else {
        cfg.vehicleDeployMethod = VEHICLE_DEPLOY_METHOD_HQ;
    }
    requireReadyReconfirmAfterConfigChange(changedBy);
    updateReadyDialogModeConfigForAllVisibleViewers();
}

function toggleReadyDialogAirDeploy(changedBy?: Player) {
    const cfg = State.round.modeConfig;
    if (cfg.vehicleDeployMethod === VEHICLE_DEPLOY_METHOD_VANILLA) {
        cfg.vehicleDeployMethod = VEHICLE_DEPLOY_METHOD_HQ;  // auto-switch parent
        cfg.airDeployEnabled = true;
    } else {
        cfg.airDeployEnabled = !cfg.airDeployEnabled;
    }
    requireReadyReconfirmAfterConfigChange(changedBy);
    updateReadyDialogModeConfigForAllVisibleViewers();
}

function toggleReadyDialogForwardDeploy(changedBy?: Player) { /* mirror of Air */ }

function toggleReadyDialogSupplyBoxes(changedBy?: Player) {
    const cfg = State.round.modeConfig;
    cfg.supplyBoxesEnabled = !(cfg.supplyBoxesEnabled ?? true);
    requireReadyReconfirmAfterConfigChange(changedBy);
    updateReadyDialogModeConfigForAllVisibleViewers();
}
```

Post-mutation invariants:
- `vehicleDeployMethod ∈ {VANILLA, HQ}` (never HQ_FORWARD or HQ_FORWARD_AIR).
- If `vehicleDeployMethod === VANILLA`, then `airDeployEnabled === false && forwardDeployEnabled === false`.

### 5. Render path

Extend `updateReadyDialogModeConfigForPid()` in [mode-config-readout.ts](../src/ready-dialog/mode-config-readout.ts) to write the `X`/blank glyph into each checkbox's inner text widget based on live state, and render the label with the dirty tint (red) when live ≠ confirmed for that specific checkbox. The old Vehicle Deploy readout (lines 287-289) is removed since the stepper is gone. Include the 3 new booleans and `vehicleDeployMethod` in the render signature.

### 6. Preset apply + confirm + reset

- `applyReadyDialogModePresetForGameMode`: presetPackage continues to set `vehicleDeployMethod` (unchanged). If a preset wants to seed Air/Forward/SupplyBoxes it can supply the new fields; otherwise they default to `false/false/true` on preset apply for consistency. `src/config/types.ts` gets the three new optional fields on the preset type. Map preset data only needs migration if the user wants non-default seeds — default-case maps don't need edits.
- `resetReadyDialogModeConfigToDefaults`: set `vehicleDeployMethod = VANILLA`, `airDeployEnabled = false`, `forwardDeployEnabled = false`, `supplyBoxesEnabled = true`.
- `confirmReadyDialogModeConfig`: copy all 3 new fields into `cfg.confirmed` alongside the existing copies.
- `buildReadyDialogModeConfigDiffState`: add individual dirty flags for the 3 new fields. The existing `vehicleDeployMethodDirty` stays for the Vanilla/HQ pair.

### 7. Strings

User has pre-approved adding new strings as needed. New keys in `src/strings.json`:
- `twl.readyDialog.gameModeConfigurationLabel` — `"Game Mode Configuration:"` (replaces use of `gameModeLabel`; the old key is kept but no longer rendered).
- `twl.readyDialog.vanillaDeployCheckboxLabel` — `"Vanilla Deploy"`.
- `twl.readyDialog.hqDeployCheckboxLabel` — `"HQ Deploy"`.
- `twl.readyDialog.airDeployCheckboxLabel` — `"Air Deploy"`.
- `twl.readyDialog.forwardDeployCheckboxLabel` — `"Forward Deploy"`.
- `twl.readyDialog.supplyBoxesCheckboxLabel` — `"Supply Boxes"`.
- `twl.ui.checkMarkChecked` — `"X"`.
- `twl.ui.checkMarkEmpty` — `" "`.

Per-AGENTS.md string policy is satisfied by the user's blanket "add new strings as you need" approval for this change. Obsolete `vehicleDeploy*` strings are kept per user direction.

---

## Files touched

| File | Change |
|---|---|
| `src/foundation/gameplay.ts` | Add 3 new optional boolean fields (`airDeployEnabled`, `forwardDeployEnabled`, `supplyBoxesEnabled`) to `ReadyDialogModeConfig` and its `confirmed` sub-type. Leave enum + options array intact. |
| `src/state/runtime-state.ts` | Initialize new booleans in draft + confirmed blocks (air=false, forward=false, supplyBoxes=true). |
| `src/config/types.ts` | Add 3 new optional fields to the map-preset type. |
| `src/config/map-runtime.ts` | Seed defaults for new fields during init. |
| `src/ready-dialog/mode-config-schema.ts` | Drop `modeSettings` and `vehicles` from `config` column's knobSpecs; override `config` column header to return blank message; update schema consumers if they enumerate knobs. |
| `src/ready-dialog/mode-config-presets.ts` | Remove `setReadyDialogVehicleDeployMethod` (old stepper setter); add 5 new toggle setters; extend reset/confirm/preset-apply to include new fields. |
| `src/ready-dialog/mode-config-readout.ts` | Remove old Vehicle Deploy readout block; add checkbox glyph+label render path; update render signature. |
| `src/ready-dialog/dialog-build-mode-config.ts` | Skip header widget creation for `config` column; move Game Mode row to Y=0; add a checkbox-block builder rendering the 5 rows in the left sub-column; leave right sub-column empty. |
| `src/strings/ui-ids.ts` | Add `UI_READY_DIALOG_CONFIG_CHECKBOX_BOX_ID`, `..._BOX_TEXT_ID`, `..._LABEL_ID`, `..._ROW_ID` prefixes. |
| `src/interaction/ui-events-ready.ts` | Handler branch for checkbox widget names → dispatch to toggle setters. |
| `src/strings.json` | Add 8 new string keys (§7). |
| `src/Changelog.ts` + version files | Bump via `npm run bumpVersion -- -c "ready-dialog: replace vehicle-deploy stepper with checkboxes; seed Air/Forward/SupplyBoxes toggles (UI-only)"`. |
| `design_doc/TWL_Conquest_Design.md` | Update the ready-dialog column description to reflect the new Configuration layout. |
| `design_doc/conquest_issues.md` | Log a new entry for the UI seeding work; note Air/Forward/SupplyBoxes wiring remains TODO. |

**Explicitly NOT touched:**
- `src/vehicles/vanilla-spawner.ts`
- `src/vehicles/hq-deploy.ts`
- `src/vehicles/deploy-timer-ui.ts`
- `src/ready-dialog/countdown-flow.ts`
- `src/interaction/world-interactables.ts`

---

## Risks and mitigations

1. **Action button Y=144 collision.** Checkbox block + Players row could crowd the Apply/Reset button row. **Mitigation:** deleting the `modeSettings` placeholder (30 px) plus tight rowH_check buys enough headroom. Measure during implementation; tighten to rowH_check=18 if needed.

2. **`mode-config-schema.ts` enumerators.** Removing `vehicles`/`modeSettings` from the knobSpecs array may break any code that iterates over them expecting fixed indices. **Mitigation:** grep `knobSpecs` and `config` column accesses before editing; the schema is typically iterated by key, not index.

3. **Render signature caching.** Missing any of the 4 relevant fields (`vehicleDeployMethod`, 3 new booleans) in the signature would leave stale glyphs on screen. **Mitigation:** include all four explicitly in the signature builder.

4. **Preset apply resetting new fields unexpectedly.** If we zero the new booleans every time a game-mode preset is applied, users may be surprised. **Mitigation:** only reset new fields on preset apply when the preset explicitly sets them (optional-field semantics), mirroring how `vehicleDeployMethod` is handled today.

5. **Reconfirm behavior.** Every toggle un-readies the clicker — intentional, matches existing knob behavior. Documented.

6. **Late-joiner sync.** New fields flow through the existing `confirmed`-mirror sync path; no extra plumbing needed.

---

## Verification

Build + bundle:
- `npm run build`
- `cmd /c npx tsc --pretty false --noEmit`
- Confirm `dist/bundle.ts` is under 1,048,576 bytes; report headroom vs. v1.313.

Functional test matrix (UI-only — no gameplay regression expected outside Vanilla/HQ toggle behavior):
1. **Default round:** launch into ready-dialog. `Configuration` header gone. Game Mode stepper sits in the top row aligned with WEST/EAST headers. Sub-header reads `Game Mode Configuration:`. Vanilla + Supply Boxes checked; HQ/Air/Forward unchecked. Right sub-column is empty space.
2. **Vanilla ↔ HQ flip:** click Vanilla while on → HQ checks, Vanilla unchecks. Click HQ while on → Vanilla checks, HQ unchecks. Air/Forward clear on return-to-Vanilla.
3. **HA:** with HQ on, click Air → Air checks. Apply. Expected: `vehicleDeployMethod === HQ`, `airDeployEnabled === true`. (No visible spawn behavior change — wiring is future work.)
4. **HAF:** check Forward. Apply. All three flags correct in confirmed state.
5. **HF:** uncheck Air. Apply.
6. **Auto-switch from Vanilla:** with Vanilla on, click Air directly → Vanilla clears, HQ checks, Air checks.
7. **Supply Boxes toggle:** toggle off, Apply. Confirmed state reflects false. (Interactable still works — wiring is future work.)
8. **Vanilla regression:** with Vanilla checked + Applied, vanilla auto-spawn still triggers at LIVE (existing behavior, `vehicleDeployMethod === VANILLA` unchanged).
9. **HQ regression:** with HQ checked + Applied, HQ deploy timer UI appears exactly as before.
10. **Unsaved changes indicator:** toggle without Apply → dirty label shows; readied player un-readies.
11. **Reset to Default:** returns to Vanilla + SupplyBoxes; Air/Forward off.
12. **Game Mode preset apply:** switching presets updates `vehicleDeployMethod` as before; new checkboxes update if preset defines them.

MP:
13. Two admins concurrently toggling different checkboxes; final confirmed state consistent after both Apply.
14. Late joiner renders confirmed state correctly on dialog open.

Version bump:
- `npm run bumpVersion -- -c "ready-dialog: replace vehicle-deploy stepper with checkboxes; seed Air/Forward/SupplyBoxes toggles (UI-only)"`

---

## Rollback

Roll back via the user's existing checkpoint. State shape is additive (new optional fields on in-memory config); no persisted migration needed.

---

## Ship notes (added at commit time)

- Shipped as v1.315. Bundle 1,002,244 / 1,048,576 bytes (46,332 headroom).
- `CQ_Feat_ReadyDialog_Config_Checkboxes_UI_Seed` entry added to `conquest_issues.md`.
- Air/Forward/SupplyBoxes wiring to downstream consumers remains TODO (future change).
