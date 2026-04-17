// @ts-nocheck
// Module: admin-panel/test-bountyhunter-spawn -- isolated BountyHunter-pattern vehicle spawner (v1.252)
//
// Four admin-panel buttons that each create a completely fresh runtime VehicleSpawner using ONLY
// the BountyHunter 3-call pattern: SetVehicleSpawnerVehicleType + SetVehicleSpawnerAutoSpawn(true)
// + SetVehicleSpawnerRespawnTime. Spawns vehicle 10m in front of the player's current position.
// After spawn: undeploy player → auto-redeploy → ForcePlayerToSeat during OnPlayerDeployed.
// (ForcePlayerToSeat only works during the engine deploy event chain — all attempts on alive
// on-foot players failed across both BH and minimal-spawn tests.)

const BH_SPAWN_POLL_TIMEOUT_SECONDS = 10.0;
const BH_SPAWN_POLL_INTERVAL_SECONDS = 0.25;
const BH_SPAWN_FIND_RADIUS_METERS = 50.0;
const BH_SPAWN_INIT_DELAY_SECONDS = 2.0;
const BH_SPAWN_FORWARD_OFFSET_METERS = 10.0;

// Per-player cleanup state so repeat clicks destroy previous test artefacts.
interface BhSpawnTestState {
    spawner?: mod.Object;
    vehicle?: mod.Vehicle;
    inFlight: boolean;
}
const bhSpawnTestByPid: { [pid: number]: BhSpawnTestState } = {};

// Pending BH-spawned vehicles awaiting seating on next deploy. Consumed by
// onPlayerDeployedImpl in player-deploy.ts — ForcePlayerToSeat only works
// during the engine's deploy event chain (production-proven pattern).
const bhPendingSeatByPid: { [pid: number]: mod.Vehicle } = {};

function getBhSpawnTestState(pid: number): BhSpawnTestState {
    let s = bhSpawnTestByPid[pid];
    if (!s) {
        s = { inFlight: false };
        bhSpawnTestByPid[pid] = s;
    }
    return s;
}

function cleanupBhSpawnTestArtefacts(pid: number): void {
    const s = bhSpawnTestByPid[pid];
    if (!s) return;
    if (s.vehicle) { try { mod.UnspawnObject(s.vehicle); } catch {} }
    if (s.spawner) { try { mod.UnspawnObject(s.spawner); } catch {} }
    s.spawner = undefined;
    s.vehicle = undefined;
}

// Core BountyHunter-pattern spawn at the player's current position + forward offset.
async function runBhSpawnTest(
    player: mod.Player,
    vehicleType: mod.VehicleList
): Promise<void> {
    if (!FEATURE_ADMIN_PANEL) return;
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return;

    const state = getBhSpawnTestState(pid);
    if (state.inFlight) return;
    state.inFlight = true;

    const okKey = mod.stringkeys.twl.adminPanel.tester.buttons.bhResultOk;
    const failKey = mod.stringkeys.twl.adminPanel.tester.buttons.bhResultFail;

    try {
        cleanupBhSpawnTestArtefacts(pid);

        // Get the player's current position and spawn 10m in front of them.
        const playerPos = mod.GetObjectPosition(player);
        const playerFwd = mod.GetSoldierState(player, mod.SoldierStateVector.GetFacingDirection);
        const spawnPos = mod.CreateVector(
            mod.XComponentOf(playerPos) + mod.XComponentOf(playerFwd) * BH_SPAWN_FORWARD_OFFSET_METERS,
            mod.YComponentOf(playerPos),
            mod.ZComponentOf(playerPos) + mod.ZComponentOf(playerFwd) * BH_SPAWN_FORWARD_OFFSET_METERS
        );
        const spawnRot = mod.CreateVector(0, 0, 0);

        // Step 1: Create a fresh runtime VehicleSpawner in front of the player.
        let spawner: mod.VehicleSpawner | undefined;
        try {
            spawner = mod.SpawnObject(
                mod.RuntimeSpawn_Common.VehicleSpawner, spawnPos, spawnRot
            ) as mod.VehicleSpawner;
        } catch { spawner = undefined; }
        if (!spawner) {
            try { mod.DisplayHighlightedWorldLogMessage(mod.Message(failKey), player); } catch {}
            return;
        }
        state.spawner = spawner;

        // Step 2: BountyHunter pattern — wait 2 seconds for engine to initialize the spawner.
        await mod.Wait(BH_SPAWN_INIT_DELAY_SECONDS);

        // Step 3: Destroy any default vehicle that auto-spawned during the 2s wait.
        const staleVehicles = mod.AllVehicles();
        const staleCount = mod.CountOf(staleVehicles);
        for (let i = 0; i < staleCount; i++) {
            const sv = mod.ValueInArray(staleVehicles, i) as mod.Vehicle;
            if (!sv) continue;
            try {
                const svPos = mod.GetObjectPosition(sv);
                if (mod.DistanceBetween(svPos, spawnPos) <= BH_SPAWN_FIND_RADIUS_METERS) {
                    mod.UnspawnObject(sv);
                }
            } catch {}
        }

        // Step 4: BountyHunter 3-call pattern — ONLY these 3 API calls, nothing else.
        mod.SetVehicleSpawnerVehicleType(spawner, vehicleType);
        mod.SetVehicleSpawnerAutoSpawn(spawner, true);
        mod.SetVehicleSpawnerRespawnTime(spawner, 0);

        // Step 5: Poll for any vehicle near the spawn position.
        let vehicle: mod.Vehicle | undefined;
        const deadline = mod.GetMatchTimeElapsed() + BH_SPAWN_POLL_TIMEOUT_SECONDS;
        while (mod.GetMatchTimeElapsed() < deadline) {
            const allVeh = mod.AllVehicles();
            const count = mod.CountOf(allVeh);
            for (let i = 0; i < count; i++) {
                const v = mod.ValueInArray(allVeh, i) as mod.Vehicle;
                if (!v) continue;
                try {
                    const vPos = mod.GetObjectPosition(v);
                    if (mod.DistanceBetween(vPos, spawnPos) <= BH_SPAWN_FIND_RADIUS_METERS) {
                        vehicle = v;
                        break;
                    }
                } catch {}
            }
            if (vehicle) break;
            await mod.Wait(BH_SPAWN_POLL_INTERVAL_SECONDS);
        }

        // Step 6: Disable auto-spawn so the temp spawner doesn't keep producing vehicles.
        try { mod.SetVehicleSpawnerAutoSpawn(spawner, false); } catch {}

        if (vehicle) {
            state.vehicle = vehicle;
            // Store pending seat for the deploy handler to consume. ForcePlayerToSeat only
            // works during the engine's OnPlayerDeployed event chain (all admin-panel tests
            // with alive-on-foot players have failed; only the production deploy path works).
            bhPendingSeatByPid[pid] = vehicle;
            try { mod.DisplayHighlightedWorldLogMessage(mod.Message(okKey), player); } catch {}
            // Undeploy → redeploy cycle puts the player through OnPlayerDeployed,
            // where the deploy handler picks up bhPendingSeatByPid and seats them.
            await mod.Wait(0.5);
            try { mod.UndeployPlayer(player); } catch {}
            await mod.Wait(1.0);
            try { mod.DeployPlayer(player); } catch {}
        } else {
            try { mod.DisplayHighlightedWorldLogMessage(mod.Message(failKey), player); } catch {}
        }
    } finally {
        state.inFlight = false;
    }
}

// Public entry points — one per admin button.
function runBhSpawnTestF16(player: mod.Player): void {
    void runBhSpawnTest(player, mod.VehicleList.F16);
}
function runBhSpawnTestAH6M(player: mod.Player): void {
    void runBhSpawnTest(player, VEHICLE_AH6M);
}
function runBhSpawnTestDirtBike(player: mod.Player): void {
    void runBhSpawnTest(player, VEHICLE_DIRTBIKE);
}
function runBhSpawnTestBlackHawk(player: mod.Player): void {
    void runBhSpawnTest(player, mod.VehicleList.UH60);
}
