# Air Deploy Jet Pitch + Loadout — Investigation Record (2026-04-20)

Historical reference for the v1.330–v1.332 Air Deploy investigation. Captures the
sister-spawner plan, the v1.331 Phase A probe, and what was learned. Does not
describe current-branch code — see `conquest_issues.md` for the active state.

---

## Timeline

- **v1.328** — Forward Deploy wired end-to-end. Pattern: one persistent
  `VehicleSpawner` per slot; pre-spawn `SetObjectTransform(spawner, forwardPos)`;
  `ForceVehicleSpawnerSpawn`; post-bind `mod.Teleport(vehicle, forwardPos, yaw)`
  to finalize placement. Loadout behavior on Forward Deploy not yet scrutinized.
- **v1.329** — Air Deploy attempt. Used `mod.SetObjectTransform(vehicle, ...)`
  post-bind (instead of `mod.Teleport`) to preserve jet pitch. Regression:
  vehicles landed near HQ with engine-default rotation, never reaching the sky
  point. Root cause: `mod.SetObjectTransform` is a no-op on `Vehicle` objects on
  the current engine build.
- **v1.330** — Reverted to the Forward-Deploy pattern: yaw-only
  `mod.Teleport(vehicle, nextAirPos, yawRad)` post-bind. Air Deploy works for
  position + yaw. Jet pitch (`rotPlane.X = -45°` on Firestorm) is discarded;
  pilots pitch manually after seat.
- **v1.331** — Phase A probe from the sister-spawner plan: skip the post-bind
  Teleport for jets on the theory that the spawner's relocation (pre-spawn
  `SetObjectTransform(spawner, ...)`) might propagate rotation at birth time.
  Regression: jets birthed at the spawner's last authoritative position (HQ)
  rather than `nextAirPos`. Confirmed that spawner relocate at altitude does
  not reliably propagate to `ForceVehicleSpawnerSpawn`; the post-bind Teleport
  is what delivers Air Deploy position.
- **v1.332** — Reverted v1.331 probe. Back to v1.330 heli-equivalent path for
  jets. Pitch remains lost; position + yaw correct.

During v1.332 playtest, the user confirmed two independent issues:
- Jets in v1.331 stayed at HQ with wrong orientation (caused by the probe;
  fixed by the v1.332 revert — verification pending).
- **Forward Deploy and Air Deploy drop the player's vehicle loadout.**
  HQ Deploy respects it. All three paths share one seat code path
  (`onHqSeatPendingPlayerDeployed` → `mod.ForcePlayerToSeat`), so the seat API
  itself is not the differentiator.

---

## Hypotheses for the loadout asymmetry (HQ works, Forward/Air drops)

All three deploy paths route through `onHqSeatPendingPlayerDeployed` and call
`mod.ForcePlayerToSeat(player, vehicle, -1)` inside `OnPlayerDeployed`. What
differs is the **vehicle's spatial and temporal state** between bind and seat.

**Hypothesis 1 — Vehicle position at `DeployPlayer` time.**
HQ vehicle sits at `slot.spawnPos` (HQ pad) when `DeployPlayer` fires. Forward
/ Air vehicle has already been Teleported to the forward/air point by
`doDispatch` post-bind. The engine may gate vehicle loadout application on
vehicle-near-player-deploy-origin at deploy time.

**Hypothesis 2 — Timing / latency between bind and seat.**
The pre-seat Teleport happens immediately after bind (no wait); the seat call
happens after `beginHqSeatFlow`'s 0.5s settle + `DeployPlayer` chain. For HQ,
the vehicle was already placed by `ForceVehicleSpawnerSpawn` (no Teleport
needed). For Forward / Air, a Teleport intervenes. If the engine applies
loadout at some specific moment in the bind→seat window, a Teleport inside
that window could invalidate the loadout association. Same direction as
Hypothesis 1, different proximate cause.

**Hypothesis 3 — Order of operations.**
HQ: bind → wait → deploy → seat. Forward/Air: bind → Teleport → wait → deploy
→ seat. The extra Teleport step between bind and deploy is the only
structural difference. Whether the problem is position (H1), timing (H2), or
the Teleport call itself (H3) is empirically indistinguishable from outside
the engine — they all resolve to the same observable fix: remove the pre-seat
Teleport and relocate only after seat.

**Hypothesis 4 — Vehicle identity / engine bookkeeping.**
`mod.Teleport` on a freshly-spawned vehicle may rebind some internal engine
handle (e.g., clearing a "pending loadout owner" pointer that was set by
`ForceVehicleSpawnerSpawn`). HQ avoids this because no Teleport is called.
This is a variant of H3 with a specific mechanism.

The empirical fix (move Teleport post-seat) addresses all four hypotheses at
once. The probe will not tell us which is correct; it will only tell us
whether the fix works. That is acceptable: we do not need the mechanism, we
need the behavior.

---

## Sister-Spawner Plan (deferred)

The v1.330 plan proposed a per-jet-slot sibling `VehicleSpawner` born with
`rotPlane` (pitch included), relocated per click via
`SetObjectTransform(sibling, ...)`. The central assumption was that spawner
relocate propagates rotation to `ForceVehicleSpawnerSpawn`'s birth transform.
The v1.331 Phase A probe (on the primary spawner) disproved the weaker form
of that assumption — position relocation does not propagate at altitude, let
alone rotation.

The sister-spawner architecture is not refuted outright: it is possible that
spawner birth-rotation is frozen at `SpawnObject` time and relocation is
purely for position (which itself failed at altitude). A sibling born with
pitch would keep that pitch through relocate failures; vehicles would birth
with pitch but at HQ, which is no better than the current state.

**Open probe needed before reviving the plan:** create a runtime
`VehicleSpawner` at ground level with non-zero pitch, fire
`ForceVehicleSpawnerSpawn` without relocation, observe whether the birthed
vehicle inherits the pitch. If yes, pitch-from-birth is real and the sibling
pattern's upper bound is "pitched vehicle at HQ pad" — still a net loss
without position. If no, birth-rotation is engine-determined and the sibling
pattern cannot help.

Jet pitch remains an open polish item. Pilots pitch down manually after seat.

---

## Plan superseded by this record

Original plan (v1.330):
1. **Phase A (probe):** skip post-bind Teleport for jets on air dispatch.
   Tested in v1.331. Failed — jets stayed at HQ. Reverted in v1.332.
2. **Phase B (sister spawner):** per-jet-slot sibling spawner born with
   `rotPlane`, AutoSpawn=off, relocated per click with the primary spawner's
   defuse sequence. Deferred — depends on spawner relocate at altitude, which
   Phase A called into question.

New plan (v1.332 forward): see
`~/.claude/plans/sleepy-juggling-thunder.md` — Phase 1 verifies jet position
(no code change), Phase 2 fixes loadout by deferring Forward/Air Teleport
until after `ForcePlayerToSeat`.

---

## Durable lessons

1. **`mod.SetObjectTransform` on a `Vehicle` is a no-op on the current engine
   build.** Every vehicle placement goes through `mod.Teleport`.
2. **`mod.SetObjectTransform` on a `VehicleSpawner` updates in-scene position
   at ground level (Forward Deploy works), but does not reliably propagate to
   the birthed vehicle's spawn position at altitude.** The post-bind Teleport
   is load-bearing for Air Deploy.
3. **`mod.Teleport` has no pitch/roll signature.** Vehicle rotation post-bind
   is yaw-only. Pitch must come from birth or not at all.
4. **ForcePlayerToSeat is reliable only inside `OnPlayerDeployed`
   (BountyHunter pattern).** Validated in the HQ Deploy, Forward Deploy, and
   Air Deploy flows.
5. **Pre-seat player Teleport is banned.** Broke twice historically (v1.106
   and v1.151). Post-seat vehicle Teleport is not covered by the ban but is
   still experimental — the Phase 2 plan probes it.
6. **All three player-triggered deploy paths (HQ, Forward, Air) share one
   seat code path and one dispatch mutex.** Do not fork these; the claim
   lifecycle (`pendingSpawnOwnerPid` → `pendingSpawnMode` → success hook) is
   the shared contract.
