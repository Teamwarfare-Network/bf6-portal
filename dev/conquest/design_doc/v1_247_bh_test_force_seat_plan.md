# Plan: Extend BH test buttons with ForcePlayerToSeat (v1.247)

**Created**: 2026-04-16
**Status**: Ready for implementation

---

## Context

v1.246 proved all 4 vehicle types (F16, AH-6M, DirtBike, BlackHawk) spawn successfully with the isolated BountyHunter 3-call pattern. The next step is proving the full spawn→seat flow works: spawn vehicle + seat the player into it.

BountyHunter does NOT seat players (triple-confirmed: zero calls to ForcePlayerToSeat or any seating API in the entire codebase, verified against latest GitHub commit 0b14696 v0.11.1). The only BF6 Portal API that seats a player is `mod.ForcePlayerToSeat(player, vehicle, seatNumber)` — seat -1 = first available.

Memory note: "Pre-seat player teleport is banned" (broke twice: v1.106-v1.108 and v1.151-v1.154). So: NO teleport before seating.

---

## Change (1 file)

### `src/admin-panel/test-bountyhunter-spawn.ts` — Add ForcePlayerToSeat after vehicle poll

Current (lines 133-135):
```typescript
if (vehicle) {
    state.vehicle = vehicle;
    try { mod.DisplayHighlightedWorldLogMessage(mod.Message(okKey), player); } catch {}
```

New:
```typescript
if (vehicle) {
    state.vehicle = vehicle;
    try { mod.ForcePlayerToSeat(player, vehicle, -1); } catch {}
    try { mod.DisplayHighlightedWorldLogMessage(mod.Message(okKey), player); } catch {}
```

One line added. No teleport. `ForcePlayerToSeat` with seat -1 puts the player in the first available seat regardless of distance.

---

## Verification

1. `npm run build` — must pass, bundle under 1,048,576 bytes
2. `npm run bumpVersion -- -c "diag: extend BH test buttons with ForcePlayerToSeat — proves full spawn+seat flow in isolation"`
3. In-game test: click each BH button while on foot. Expect:
   - Vehicle spawns (proven in v1.246)
   - Player is teleported/seated into the vehicle automatically
   - All 4 types should work (F16, AH-6M, DirtBike, BlackHawk)
4. If seating fails for some types but spawn works: the issue is ForcePlayerToSeat, not spawning
5. If seating works for all: full flow proven, ready to apply to real deploy system
