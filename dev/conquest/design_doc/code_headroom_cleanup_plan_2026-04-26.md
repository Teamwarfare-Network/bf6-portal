# Code Headroom Cleanup — Helpers, Mega-File Splits, Dead-Code Discovery (Plan)

**Created:** 2026-04-26
**Baseline:** v1.398 — bundle 878,649 bytes / 169,927 byte headroom / 16.21%
**Target ship range:** v1.399 → v1.408 (multiple independent ships)
**Constraint:** ZERO REGRESSIONS. No gameplay function removed. Pure organizational + helper-extraction work.

---

## Context

Bundle pressure is no longer a concern (v1.397/v1.398 reclaimed ~158 KB via postbuild whitespace + standalone block-comment strips). Headroom is 16.21% — the largest reserve since v1.190.

This plan is a **code-quality and review-readability exercise**:
1. Extract high-frequency call patterns into tiny helpers (largest reclaim is mechanical wrapper extraction).
2. Split three mega-files into single-responsibility sub-modules (bundle-neutral; enables dead-code discovery).
3. Verify and remove dead code surfaced by the splits (small reclaim, big consistency win).
4. Refresh `design_doc/conquest_optimization_analysis.md` for v1.398 reality.

Total estimated bundle reclaim: **~10–12 KB** (helpers ~9–10 KB; dead-code ~0.5–1.5 KB; splits 0 KB by design).

**Architectural constraint:** Flat-bundle TypeScript project (`@ts-nocheck`, no ES imports between functions; `bf6-portal-bundler` resolves `import './foo';` directives and concatenates source files). Splits MUST add corresponding `import` directives in `src/index.ts` (or another upstream module).

---

## Phase 1 — Helper extraction (~9–10 KB reclaim)

### 1.1 — `msg()` wrapper (v1.399)

**Pattern:** `mod.Message(mod.stringkeys.twl.<path>)` × **209 calls** across the codebase.

**Helper** (in `src/foundation/string-keys.ts`):
```ts
function msg(keyId: number): mod.Message { return mod.Message(keyId); }
```

**Replacement:** `mod.Message(mod.stringkeys.twl.foo)` → `msg(mod.stringkeys.twl.foo)`.

**Reclaim:** ~5,016 bytes. **Risk:** NONE.

### 1.2 — Stringkey path aliases (v1.400)

Top 5 highest-frequency `mod.stringkeys.twl.<path>` references aliased once in `src/foundation/string-keys.ts`:

| Path | Count | Alias |
|---|---|---|
| `mod.stringkeys.twl.system.genericCounter` | 63 | `STR_SYS_COUNTER` |
| `mod.stringkeys.twl.hud.clock.digit` | 17 | `STR_HUD_CLOCK_DIGIT` |
| `mod.stringkeys.twl.deployDiag` | 11 | `STR_DEPLOY_DIAG` |
| `mod.stringkeys.twl.system.unknownPlayer` | 10 | `STR_SYS_UNKNOWN_PLAYER` |
| `mod.stringkeys.twl.readyDialog.vehicleShortNoSpawn` | 8 | `STR_RD_VEHICLE_NO_SPAWN` |

**Reclaim:** ~1,417 bytes. **Risk:** NONE.

### 1.3 — `isValidPlayer()` guard helper (v1.401)

**Pattern:** `if (!player || !mod.IsPlayerValid(player)) return;` × **68 calls**.

**Helper** (in `src/state/id-helpers.ts`):
```ts
function isValidPlayer(p: mod.Player | undefined): boolean {
    return !!p && mod.IsPlayerValid(p);
}
```

**Caveat:** Some sites have additional conditions; per-site replacement required to preserve return-type semantics.

**Reclaim:** ~1,632 bytes. **Risk:** LOW.

### 1.4 — `VEC_ZERO` constant (v1.402)

**Pattern:** `mod.CreateVector(0, 0, 0)` × **23 calls**.

**Helper** (in `src/foundation/gameplay.ts`):
```ts
const VEC_ZERO = mod.CreateVector(0, 0, 0);
```

**Reclaim:** ~345 bytes. **Risk:** NONE.

### 1.5 — Optional polish bundle (v1.403, optional)

- `cv2(x, y)` for `mod.CreateVector(x, y, 0)` — 26 calls × 14 bytes = ~364 bytes
- Color vector constants — 6 × 15 bytes = ~90 bytes
- `Math.floor(mod.GetMatchTimeElapsed())` helper — 25 × 12 bytes = ~300 bytes
- `safeGetTeam(p)` alias — 15 × 6 bytes = ~90 bytes

Combined: **~844 bytes**.

### Phase 1 totals: ~9,254 bytes across 4–5 ships

---

## Phase 2 — Mega-file splits (bundle-neutral)

Three files split into single-responsibility sub-modules. Bundle byte size stays identical (concatenation order preserved). Value is review readability + dead-code discovery.

### 2.1 — `src/index/capture-tickets.ts` → 9 files (v1.404)

| New file | Functions | ~Lines |
|---|---|---|
| `capture-tickets/capture-config.ts` | mapped config, ensure state, timing, reset helpers | 180 |
| `capture-tickets/bleed.ts` | bleed tick, ownership counts, ticket delta, mirror | 120 |
| `capture-tickets/end-conditions.ts` | end-latch + check end | 80 |
| `capture-tickets/capture-point-events.ts` | tick, lost, captured, owner resolution | 400 |
| `capture-tickets/flag-visual-state.ts` | visual state machine | 520 |
| `capture-tickets/flag-slot-rendering.ts` | flag slot layout + render | 400 |
| `capture-tickets/hud-view-models.ts` | view model derivation + types | 600 |
| `capture-tickets/hud-sync.ts` | dirty mark + publish + dispatch | 180 |
| `capture-tickets/index.ts` (entry) | live tick + sub-tick + viewer helpers | 120 |

Import order in `src/index.ts`: config → bleed/end-conditions → capture-point-events → flag-visual-state → flag-slot-rendering → hud-view-models → hud-sync → index.

### 2.2 — `src/vehicles/deploy-timer-ui.ts` → 9 files (v1.405)

| New file | Functions | ~Lines |
|---|---|---|
| `deploy-timer-ui/labels-and-predicates.ts` | label resolvers + vehicle type predicates | 200 |
| `deploy-timer-ui/widget-factory.ts` | ensure widgets (info plates, buttons, panels, close) | 650 |
| `deploy-timer-ui/widget-state.ts` | visibility setters, visual-state appliers | 250 |
| `deploy-timer-ui/row-rendering.ts` | layout + render row + visibility FSM | 300 |
| `deploy-timer-ui/cache-management.ts` | cache validators, deletion, layout calc | 300 |
| `deploy-timer-ui/hud-initialization.ts` | ensureVehicleDeployTimerHudForPlayer | 600 |
| `deploy-timer-ui/hud-orchestration.ts` | prepare, apply, hide, build render plan, sync input | 400 |
| `deploy-timer-ui/button-events.ts` | tryHandleVehicleDeployTimerButtonEvent | 200 |
| `deploy-timer-ui/index.ts` (entry) | public entry points + invalidation helpers | 200 |

### 2.3 — `src/interaction/ammo-resupply-menu.ts` → 10 files (v1.406)

| New file | Functions | ~Lines |
|---|---|---|
| `ammo-resupply-menu/gadget-config.ts` | DEFAULT/ACTIVE config, sync override | 50 |
| `ammo-resupply-menu/menu-cache.ts` | cache, layout shorthand, SFX | 250 |
| `ammo-resupply-menu/locker-slot-state.ts` | slot owner helpers | 200 |
| `ammo-resupply-menu/slot-probing.ts` | launcher + engineer gadget probe FSM | 400 |
| `ammo-resupply-menu/tile-rendering.ts` | tile builder + header builders | 600 |
| `ammo-resupply-menu/menu-visibility.ts` | show/hide + refreshOpenArm | 150 |
| `ammo-resupply-menu/item-grants.ts` | giveLauncher/Smoke/Assault/Recon/RocketCharge | 300 |
| `ammo-resupply-menu/menu-lifecycle.ts` | build/refresh/destroy + slot toggle row | 1,000 |
| `ammo-resupply-menu/event-routing.ts` | handleArmMenuEvt | 200 |
| `ammo-resupply-menu/index.ts` (entry) | public entry + helpers | 150 |

### Phase 2 risks
1. Top-level mutable `let` must remain single-file private. Mutable maps (`conquestPhase2ACaptureTimingConfiguredByObjId`, `ACTIVE_GADGET_CONFIG`) confined to one sub-file.
2. Forward function references — function declarations are hoisted; safe within a file. Across files, ensure import order respects call dependencies.
3. Bundle equivalence verified by `diff <(sort old) <(sort new)` — only line-order differences allowed.

---

## Phase 3 — Dead-code discovery (post-split, ~0.5–1.5 KB reclaim)

| Symbol | File (post-split) | Reason flagged |
|---|---|---|
| `conquestPhase2ASyncMappedCapturePointsFromEngine` | `capture-tickets/capture-point-events.ts` | Defined but no production callsite |
| `getVehicleDeployActiveOwnerNameMessage` | `deploy-timer-ui/widget-state.ts` | No caller renders the result |
| `clearVehicleDeployActionButtonStateForAllRows` | `deploy-timer-ui/widget-state.ts` | Cleanup-only callers |
| `resetArmState(pid)` | `ammo-resupply-menu/menu-cache.ts` | Init-only; never reset post-init |
| `EH` constant | `ammo-resupply-menu/menu-cache.ts` | Defined but never referenced |
| `force` parameter on `refreshOpenArm` | `ammo-resupply-menu/menu-visibility.ts` | Never used inside function |

**Verification protocol per candidate:**
1. Targeted symbol grep across full `src/` tree.
2. Cross-check admin-panel/perf-diag/position-debug for hidden references.
3. Check Changelog.ts (mentions don't count as references).
4. Remove function + cascading dead callers/initializers.

**Ship as v1.407** (combined removal).

---

## Phase 4 — Update `conquest_optimization_analysis.md` (v1.408)

### Required updates

1. TL;DR rewrite for 16.21% headroom + v1.397/v1.398 reclaim history.
2. "Bundle vs. Strings" — update bundle figure 1,036,250 → 878,649.
3. Size Progression table — add v1.396, v1.397, v1.398, plus Phase 1 ships.
4. "RECOVERED" → "COMFORTABLE" framing.
5. R1 (burn-rate) — downgrade.
6. Implementation Priority — re-rank; Cat 7, Cat 1.1/1.2/R7 are now polish, not defense.
7. Add Cat 9 (helpers) + Cat 10 (mega-file splits) for this plan's work.

### Sections that don't need updates (still accurate)
- Cat 2 (hot paths), Cat 4 (Clock/Timer), Cat 5 (crash risks), Cat 6 (dead functions resolved v1.384), all 12 supersession notes, R3, R4, R6.

---

## Files to modify

### Phase 1
- `src/foundation/string-keys.ts` — `msg()` + 5 aliases
- `src/foundation/gameplay.ts` — `VEC_ZERO` + optional helpers
- `src/state/id-helpers.ts` — `isValidPlayer()` + optional `safeGetTeam()`
- ~50 source files — find-replace call sites

### Phase 2
- 28 new sub-files under three new directories
- Original three mega-files become `index.ts` entry points
- `src/index.ts` — update imports

### Phase 3
- 4–6 source files (mostly Phase 2 sub-modules)

### Phase 4
- `design_doc/conquest_optimization_analysis.md`

---

## Aggregate ROI

| Phase | Bytes | Effort | Risk |
|---|---|---|---|
| Phase 1 (helpers) | ~9,254 | ~3 hrs | NONE/LOW |
| Phase 2 (splits) | 0 | ~6 hrs | LOW |
| Phase 3 (dead-code) | ~500–1,500 | ~1 hr | LOW |
| Phase 4 (doc) | 0 | ~30 min | NONE |
| **Total** | **~10–11 KB** | **~10 hrs** | **LOW** |

---

## Rollback strategy

Every ship is a single-commit revert. Phase 1 helpers revert individually. Phase 2 splits revert file-by-file. Phase 3 is a single combined ship; revert restores all flagged candidates.

Bundle is at 16.21% headroom today — no urgency means the work can pause at any phase without bundle pressure resuming.
