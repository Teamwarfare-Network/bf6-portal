# TWL Conquest Optimization Analysis

Last updated: v1.313 (2026-04-18)
Companion to: `TWL_Conquest_Design.md` (see "Codebase Reference Map" for file/function index) and `conquest_issues.md`.

## Baseline

| Metric | v1.289 | v1.221 (prior pass) | Delta |
|--------|--------|----------|-------|
| Bundle size (script) | 968,479 bytes | 998,868 bytes | −30,389 bytes |
| Bundle limit | 1,048,576 bytes (1 MiB) | same | — |
| Headroom | 80,097 bytes (**7.64%**) | 49,708 bytes (4.74%) | +30,389 bytes / +2.9 pp |
| Source files | 119 .ts + 1 .json | 116 | +3 |
| Total source lines | 29,447 | — | — |
| `mod.AllPlayers()` calls | 29 across 21 files | 44 across 31 files | −15 / −10 files |
| `safeFind()` calls | 342 across ~41 files | ~311 across 33 files | net +31 calls |
| Bundle strings | 20,816 bytes | 20,518 bytes | +298 bytes |

**Headroom status: comfortable.** Recovered from the v1.110 "critically low" 1.0% floor to 7.64%. The v1.258–v1.259 spawner rewrite and flipping `FEATURE_ADMIN_PANEL` to `false` are the two largest contributors. Feature work is unconstrained by bundle size at this time.

## Size Progression

| Version | Bundle | Headroom | Delta | Notable work |
|---------|--------|----------|-------|--------------|
| v1.010 | 1,025,710 | 22,866 (2.2%) | — | Phase 6 complete baseline |
| v1.110 | 1,038,559 | 10,017 (1.0%) | +12,849 | CQ_Bug_39 hardening — low-water mark |
| v1.190 | 995,854 | 52,722 (5.03%) | **−42,705** | Audit pass: 3 dev flags→false, 52 stale widget names, safeFindPlayer hot-path (BUG-A8) |
| v1.213 | 1,001,081 | 47,495 (4.53%) | +5,227 | Phase 10 feature adds; FEATURE_WORLD_ICON_DIAG removed |
| v1.221 | 998,868 | 49,708 (4.74%) | −2,213 | Stability/perf pass: loading-gate asserts, TickContext, dirty-flag HUD, forEachValidPlayer |
| v1.259 | — | — | **−~25K** (est.) | **Vanilla spawner rewrite.** Deleted `deploy-fulfillment.ts` (22.7K), `reservations.ts` (3.3K), `spawner-sequence.ts` (7.8K), `spawner-bind.ts` (12.0K), `spawner-slots.ts` (9.2K), `spawner-bootstrap.ts` (4.8K) → ~60K source gone; `vanilla-spawner.ts` added (~25K). Non-Vanilla deploy paths removed wholesale. |
| v1.276 | — | — | — | `sinkAndDestroyVehicle` consolidation (4 inline destroy sites → 1 wrapper) |
| v1.289 | 968,479 | 80,097 (7.64%) | −30,389 from v1.221 | Phase 6 HQ Deploy (`hq-deploy.ts` ~13K added). All 4 FEATURE_* flags now `false`. |

**Key takeaways:**
- The v1.259 rewrite was the largest single source-size reduction since the v1.190 audit. It closed 6 entangled bug entries (CQ_Bug_49/52/53/54/55 + ActiveSpawnSingletonMPRace) by deleting their host code rather than adding further guards.
- v1.289 is the smallest shipped bundle since project start. All four feature flags are currently `false`; flip any back to `true` to restore ~10–25 KB each for live tuning.
- The v1.214–v1.221 stability/perf items that were "Open" in the previous analysis are now all resolved.

---

## Category 1: File Size Reduction

| # | Title | Est. Savings | Impact | Effort | Status |
|---|-------|-------------|--------|--------|--------|
| 1 | Gate UI Cache Perf instrumentation behind compile flag | — | — | — | **Resolved** (v1.190 — FEATURE_PERF_DIAG=false) |
| 2 | Compress repetitive widget name generation | 2,000–4,000 bytes | Medium | Medium | **Open (low priority)** |
| 3 | Deduplicate `*ForAllPlayers` boilerplate patterns | — | — | — | **Resolved** (v1.217 `forEachValidPlayer`) |
| 4 | Gate perf diag panel behind compile flag | — | — | — | **Resolved** (v1.190) |
| 5 | Trim Changelog.ts history | — | — | — | **Won't fix** — postbuild strips comments; Changelog ≈ 0 bundle bytes |
| 6 | Audit emitted JSDoc / inline comments | 500–1,500 bytes | Low-Med | Low | **Open (low priority)** |
| 7 | Scrub remaining temp feature flags | — | — | — | **Resolved** — all four flags `false` in v1.289 |
| 8 | **New** — Post-v1.259 spawner dead-code audit | 500–2,000 bytes | Low | Low | **Open** — cross-check references to removed `deploy-fulfillment` / `reservations` / `spawner-*` symbols; scrub any stub imports still surviving in `strings/` or `state/` helper modules |
| 9 | **New** — Deduplicate HQ + Vanilla spawner helpers | 500–1,500 bytes | Low | Low | **Open** — `hq-deploy.ts` and `vanilla-spawner.ts` share small utility shapes (slot lookup, vehicle-type test). Not worth extracting yet unless bundle pressure returns |

### 2. Widget name generation — still open (low priority)

`vehicles/deploy-timer-ui.ts` (2,026 lines), `interaction/ammo-resupply-menu.ts` (2,504 lines), `admin-panel/build.ts` (when enabled, 348 lines), `boundary/prompt-ui.ts` (~477 lines) all build widget names from inline template literals repeating the `prefix_${pid}_${suffix}` pattern hundreds of times. A factory `wn(prefix, ...parts)` would save 2–4 KB. With 7.6% headroom this is not urgent.

### 6. Comment audit — still open (low priority)

Postbuild strips `//` and `/* */` comments, but JSDoc preceding exported members and comments inside preserved string literals may still bleed into the bundle. A one-time audit likely reclaims 500–1,500 bytes.

### 8. Post-v1.259 dead-code audit — new open item

The v1.259 rewrite deleted six files but may have left references (imports, type aliases, stub re-exports) in surviving modules. Quick scan: no hits on `deploy-fulfillment` / `reservations` / `spawner-sequence` / `spawner-bind` / `spawner-slots` / `spawner-bootstrap` in the current source tree — confirms the rewrite was clean. Running `prebuild.js` verification confirms no orphan `// @feature` imports survive. Keep this item open only as a quarterly sanity check.

---

## Category 2: Architecture and Organization

| # | Title | Impact | Effort | Status |
|---|-------|--------|--------|--------|
| 1 | Split `capture-tickets.ts` (2,150 lines) by concern | High | High | **Open — largest logic file** |
| 2 | Introduce shared `forEachValidPlayer()` abstraction | — | — | **Resolved** (v1.217) |
| 3 | Consolidate `hud-warm-state.ts` 40+ getter/setter pairs | Medium | Medium | **Open** |
| 4 | Decouple debug/diagnostics state from core runtime | Medium | Medium | Partially resolved (FEATURE_* flags isolate; some hudDirty + perspective maps still interleaved) |
| 5 | Extract loading gate into self-contained module | Medium | Medium-High | **Open** |
| 6 | **New** — Split `vehicles/deploy-timer-ui.ts` (2,026 lines) into build / render / HQ-wiring | Medium | Medium | **Open** — carries HQ button wiring and Vanilla timer display together; clean split possible |
| 7 | **New** — Split `interaction/ammo-resupply-menu.ts` (2,504 lines) | Medium | Medium | **Open** — grew +496 lines since v1.221 from gadget-delay header, tile gate, class slot-toggle row, and v1.308–v1.313 probe rework; tile builders are extractable |

### Three 2K-line mega-files persist

| File | Lines (v1.313) | Lines (v1.221) | Notes |
|---|---|---|---|
| `index/capture-tickets.ts` | 2,150 | 2,147 | Stable; Phase 2A sync + bleed + 7 combat HUD view models + dispatch |
| `vehicles/deploy-timer-ui.ts` | 2,026 | 2,031 | HQ button wiring and pending-state header (v1.286) added without size growth |
| `interaction/ammo-resupply-menu.ts` | 2,504 | 2,008 | **+496 lines** — gadget-delay status header, launcher tile gating, per-class slot-toggle row (v1.304/v1.305), and the v1.308–v1.313 slot-based HasEquipment-diff probe (`probeLauncherSlot` / `probeSlot` + `ENGINEER_GADGET_CANDIDATES` + `slotWithLauncher` + `lockerSlotToggle` preference persistence) |

A navigability split pass would improve readability with zero bundle impact (bundler concatenates). Priority: low while feature work is active.

### 5. Loading gate extraction — still open

`interaction/actions.ts` (761 lines) hosts the unified loading gate alongside HUD warm/reveal orchestration. Pulling the gate into its own `loading-gate/` subfolder would clarify ownership and let the warm/reveal state live separately. HQ Deploy's `beginHqSeatFlow` touches the gate indirectly via `SetRedeployTime` + `EnablePlayerDeploy` — extraction would also make the late-joiner audit (see `CQ_Polish_Respawn_Redeploy_Timer_Audit`) easier.

---

## Category 3: Crash Risks

| # | Title | Severity | Effort | Status |
|---|-------|----------|--------|--------|
| 1 | `for...in` with `delete` during iteration | Medium | Low | Partially fixed — remaining sites read-only per v1.190 audit |
| 2 | Stale widget references after team swap/reconnect | — | — | **Resolved** (v1.216 generation counter) |
| 3 | Unbounded loading gate polling loop | — | — | **Resolved** (v1.104) |
| 4 | Inverted null guards in hot-path state accessors | — | — | **Won't fix — intentional design** (warm-on-unknown-state per Changelog v1.012) |
| 5 | Race between async loading gate and synchronous deploy event | — | — | **Resolved** (v1.214 invariants; v1.222 reverted telemetry, dual-guard in code closes race) |
| 6 | **New** — HQ Deploy claim timeout orphans | Low | Low | **Resolved** (v1.289) — 10s claim timeout + `sinkAndDestroyVehicle` cleanup confirmed during Phase 6 playtest |
| 7 | **New** — `GetObjectPosition` unreliable at Vanilla→HQ countdown reset | Medium | — | **Mitigated** (v1.283/v1.285) — `sinkAndDestroyVehicle` prefers `slot.spawnPos` over `GetObjectPosition`; lesson captured in memory `project_getobjectposition_unreliable_on_destroy.md` |
| 8 | **New** — `SetRedeployTime` late-joiner global side-effect | Medium | Medium | **Open** — hypothesis: `SetRedeployTime(HUD_WARM_REDEPLOY_BLOCK_SECONDS)` in `holdPlayerAtDeploy` may apply globally rather than per-player. Deferred to polish phase. See `CQ_Polish_Respawn_Redeploy_Timer_Audit` |

---

## Category 4: Performance Overhead

| # | Title | Per-Tick Savings | Status |
|---|-------|-----------------|--------|
| 1 | Cache `mod.AllPlayers()` once per tick | 5–7 engine calls/tick | **Resolved** (v1.219 TickContext) |
| 2 | Gate combat HUD render behind dirty flag | Skip 70–80% of renders | **Resolved** (v1.221) |
| 3 | Replace string signatures with generation counters | Eliminate per-player alloc | **Open** (low priority) |
| 4 | Cache widget refs in hot render paths | Eliminate ~200 safeFind calls | **Resolved** (v1.215) |
| 5 | Skip boundary checks for unmoving/undeployed players | Skip 60–80% of checks | **Resolved** for undeployed (`boundary/enforcement.ts:119`). Position-delta skip for deployed players still open |
| 6 | **New** — HQ Deploy seat-flow polling loop | ~15 × 0.1s checks per on-foot HQ click | **Open (low priority)** — `beginHqSeatFlow` polls `deployedByPid[pid]` 15× at 0.1s to detect undeploy completion. Event-driven subscription to `OnPlayerUndeploy` would remove the poll but the code is infrequent (only fires on HQ on-foot click) so savings are marginal |
| 7 | **New** — `safeFind` call count (342) vs v1.221 (~311) | Minor | **Open (low priority)** — net +31 call sites since v1.221. Mostly from HQ Deploy + gadget-delay polish. Not a hot-path regression per spot-check; keep under watch |

### 1. TickContext — still working as designed

`mod.AllPlayers()` call count dropped from 44 (v1.221) to 29 (v1.289). The remaining 29 split roughly into: 4 inside `tick-context.ts` itself (the snapshot owners), ~10 in event handlers that don't have an ambient TickContext, and the rest in one-shot lifecycle transitions. Further reductions would require expanding the ambient-context model into event handlers — not worth the complexity gain vs. the per-event call overhead.

### 2. Dirty-flag combat HUD — still working as designed

AGENTS.md `Combat HUD Dirty-Flag Contract` lists 9 state fields that must call `conquestPhase3MarkHudDirty()` on mutation. Phase 6 HQ Deploy added claim-state mutations to that contract (pending-state HUD signal in v1.286). No regression observed.

### 3. Generation counters for signatures — still open

Several HUD families still use string-signature diffs (`"v:${visible}|pid:${pid}|count:${n}"` style) to decide whether to repaint. Converting to monotonic counters eliminates the per-player string alloc. Low priority while headroom is healthy.

---

## Implementation Priority (v1.290+)

Headroom at 7.64% is comfortable. Optimization is **not blocking** feature work. Priorities are driven by stability and navigability.

### Stability (do before polish phase)

1. **Category 3 Item 8** — Late-joiner `SetRedeployTime` audit. Open. Already tracked in `CQ_Polish_Respawn_Redeploy_Timer_Audit` and memory `project_respawn_redeploy_timer_polish.md`.
2. **CQ_Bug_Abrams_Substitution_Transport_Slot_Regression** (open in issues doc) — heli/ground knob toggle can produce wrong-vehicle at countdown start. Fresh diagnostic pass required.

### Navigability (opportunistic)

3. **Category 2 Item 1** — Split `capture-tickets.ts` (2,150 lines) into 4 files by view-model concern.
4. **Category 2 Item 6** — Split `deploy-timer-ui.ts` (2,026 lines) — extract HQ button wiring into `hq-deploy-buttons.ts` alongside the existing `hq-deploy.ts`.
5. **Category 2 Item 5** — Extract loading gate module (makes Stability Item 1 easier).
6. **Category 2 Item 7** — Split `ammo-resupply-menu.ts` (2,008 lines).

### Bundle (only if a large feature needs room)

7. **Category 1 Item 2** — Widget-name factory (~2–4 KB).
8. **Category 1 Item 6** — Emitted-comment audit (~0.5–1.5 KB).

### Cleanup / validation

9. **CQ_Polish_MP_Validation_v1.214_to_v1.221** — pending-playtest scenarios from the stability/perf pass.
10. MP validation of the v1.259 spawner rewrite under real client concurrency — the old `ActiveSpawnSingletonMPRace` symptom is theoretically impossible now, but confirm in MP.
11. Validate + close the "Likely resolved" cohort of `CQ_Bug_*` issues during MP playtest (CQ_Bug_21, 26, 30).

---

## Supersession notes (for future analyzers)

- **Do not re-open CQ_Bug_49 / 52 / 53 / 54 / 55 / ActiveSpawnSingletonMPRace.** Their host code paths were deleted wholesale in v1.259. The bugs cannot recur in their original form. If similar-looking symptoms appear in the Vanilla or HQ spawner, they require a fresh diagnostic — do not port the old guards.
- **Do not re-introduce `mod.Teleport(player, ...)` immediately before `ForcePlayerToSeat`.** Banned permanently (memory `project_teleport_vehicle_spawn_mystery.md`). The engine OOB latch has caused two multi-version regressions.
- **`ForcePlayerToSeat` is only reliable inside `OnPlayerDeployed`.** Confirmed across v1.246–v1.252 testing and the Phase 6 HQ Deploy playtest. Any new seating pathway must route through that event.
- **The dirty-flag HUD contract is load-bearing.** Any new per-player state that affects combat HUD rendering must call `conquestPhase3MarkHudDirty()` on mutation. See AGENTS.md "Combat HUD Dirty-Flag Contract".
