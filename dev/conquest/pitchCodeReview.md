# Pitch Code Review

Comment: This is the exact current temporary jet-pitch probe flow entry point that acquires the jet, places it in front of the player, teleports it into the air, applies the selected variation, and shows the probe HUD.

```ts
async function runJetVisualTransformProbeForPlayer(player: mod.Player): Promise<void> {
    if (!player || !mod.IsPlayerValid(player) || !isPlayerDeployed(player)) {
        return;
    }

    const pid = safeGetPlayerId(player);
    if (pid === undefined) return;
    const mode = getJetVisualProbeModeForPid(pid);
    const teamId = safeGetTeamNumberFromPlayer(player, 0);
    const slot = findJetVisualProbeSlotForTeam(teamId);
    const vehicle = await tryAcquireJetVisualProbeVehicle(slot);
    if (!slot || !vehicle) {
        showJetVisualProbeFailureForPlayer(player, mod.stringkeys.twl.debug.jetVisualProbeUnavailable);
        return;
    }

    const placement = tryResolveJetVisualProbePlacement(player);
    if (!placement) {
        showJetVisualProbeFailureForPlayer(player, mod.stringkeys.twl.debug.jetVisualProbePlacementUnavailable);
        return;
    }

    const probe: JetPitchProbeSnapshot = {
        titleKey: mode.titleKey,
        teleportRot: placement.teleportRot,
    };
    hideReadyDialogUI(player);
    sendHighlightedWorldLogMessage(mod.Message(mode.startKey), true, player, mode.startKey);
    await teleportVehicleToTransform(vehicle, placement.probePos, placement.teleportRot);
    await mod.Wait(JET_VISUAL_PROBE_TRANSFORM_DELAY_SECONDS);
    await mode.apply(vehicle, placement.teleportRot, probe);
    showJetPitchProbeHudForPlayer(player, probe);
    advanceJetVisualProbeModeForPid(pid);
}
```

Comment: This is the stable baseline placement helper and it only applies yaw through `mod.Teleport(...)`.

```ts
async function teleportVehicleToTransform(eventVehicle: mod.Vehicle, pos: mod.Vector, rot: mod.Vector): Promise<void> {
    const yawDeg = mod.YComponentOf(rot);
    const yawRad = yawDeg * Math.PI / 180;
    mod.Teleport(eventVehicle, pos, yawRad);
    await mod.Wait(0);
    mod.Teleport(eventVehicle, pos, yawRad);
}
```

Comment: This is the shared degree-to-radian conversion helper used by the current `Rad` variants.

```ts
function createRotationRadiansVectorFromDegrees(rot: mod.Vector): mod.Vector {
    return mod.CreateVector(
        mod.DegreesToRadians(mod.XComponentOf(rot)),
        mod.DegreesToRadians(mod.YComponentOf(rot)),
        mod.DegreesToRadians(mod.ZComponentOf(rot))
    );
}
```

Comment: These are the three exact target rotation builders used by the probe for yaw, `X` pitch, and `Z` pitch.

```ts
function buildJetVisualProbePitchRotationX(teleportRot: mod.Vector): mod.Vector {
    return mod.CreateVector(JET_VISUAL_PROBE_TARGET_PITCH_DEGREES, mod.YComponentOf(teleportRot), 0);
}

function buildJetVisualProbePitchRotationZ(teleportRot: mod.Vector): mod.Vector {
    return mod.CreateVector(0, mod.YComponentOf(teleportRot), JET_VISUAL_PROBE_TARGET_PITCH_DEGREES);
}

function buildJetVisualProbeYawRotation(teleportRot: mod.Vector): mod.Vector {
    return mod.CreateVector(
        0,
        normalizeJetVisualProbeYawDegrees(mod.YComponentOf(teleportRot) + JET_VISUAL_PROBE_TARGET_YAW_DELTA_DEGREES),
        0
    );
}
```

Comment: This is the shared `SetObjectTransform` helper used by the current `TF * Rad` modes, with the readbacks around it.

```ts
async function applyVehicleAirTransformPitchRollDelta(
    eventVehicle: mod.Vehicle,
    rot: mod.Vector,
    probe?: JetPitchProbeSnapshot
): Promise<void> {
    try {
        const currentPos = mod.GetObjectPosition(eventVehicle);
        if (probe) {
            probe.preRot = tryReadJetPitchProbeRotation(eventVehicle);
        }
        if (probe) {
            probe.targetRot = rot;
        }
        const rotationRad = createRotationRadiansVectorFromDegrees(rot);
        mod.SetObjectTransform(eventVehicle, mod.CreateTransform(currentPos, rotationRad));
        if (probe) {
            probe.applyRot = tryReadJetPitchProbeRotation(eventVehicle);
        }
        await mod.Wait(0);
        if (probe) {
            probe.postRot = tryReadJetPitchProbeRotation(eventVehicle);
        }
        await mod.Wait(VEHICLE_AIR_TRANSFORM_PITCH_PROBE_SETTLE_SECONDS);
        if (probe) {
            probe.settleRot = tryReadJetPitchProbeRotation(eventVehicle);
        }
    } catch {
        return;
    }
}
```

Comment: This is the direct `RotateObject` delta test with rad-converted input.

```ts
async function applyJetVisualProbeRotateDelta(
    vehicle: mod.Vehicle,
    rotationDeg: mod.Vector,
    probe: JetPitchProbeSnapshot
): Promise<void> {
    try {
        probe.preRot = tryReadJetPitchProbeRotation(vehicle);
        probe.targetRot = rotationDeg;
        mod.RotateObject(vehicle, createRotationRadiansVectorFromDegrees(rotationDeg));
        probe.applyRot = tryReadJetPitchProbeRotation(vehicle);
        await mod.Wait(0);
        probe.postRot = tryReadJetPitchProbeRotation(vehicle);
        await mod.Wait(VEHICLE_AIR_TRANSFORM_PITCH_PROBE_SETTLE_SECONDS);
        probe.settleRot = tryReadJetPitchProbeRotation(vehicle);
    } catch {
        return;
    }
}
```

Comment: This is the direct `RotateObject` delta test with raw input.

```ts
async function applyJetVisualProbeRotateDeltaRaw(
    vehicle: mod.Vehicle,
    rotationDeg: mod.Vector,
    probe: JetPitchProbeSnapshot
): Promise<void> {
    try {
        probe.preRot = tryReadJetPitchProbeRotation(vehicle);
        probe.targetRot = rotationDeg;
        mod.RotateObject(vehicle, rotationDeg);
        probe.applyRot = tryReadJetPitchProbeRotation(vehicle);
        await mod.Wait(0);
        probe.postRot = tryReadJetPitchProbeRotation(vehicle);
        await mod.Wait(VEHICLE_AIR_TRANSFORM_PITCH_PROBE_SETTLE_SECONDS);
        probe.settleRot = tryReadJetPitchProbeRotation(vehicle);
    } catch {
        return;
    }
}
```

Comment: This is the `MoveObject(..., zeroPositionDelta, rotationDelta)` test with rad-converted input.

```ts
async function applyJetVisualProbeMoveDelta(
    vehicle: mod.Vehicle,
    rotationDeg: mod.Vector,
    probe: JetPitchProbeSnapshot
): Promise<void> {
    try {
        probe.preRot = tryReadJetPitchProbeRotation(vehicle);
        probe.targetRot = rotationDeg;
        mod.MoveObject(vehicle, mod.CreateVector(0, 0, 0), createRotationRadiansVectorFromDegrees(rotationDeg));
        probe.applyRot = tryReadJetPitchProbeRotation(vehicle);
        await mod.Wait(0);
        probe.postRot = tryReadJetPitchProbeRotation(vehicle);
        await mod.Wait(VEHICLE_AIR_TRANSFORM_PITCH_PROBE_SETTLE_SECONDS);
        probe.settleRot = tryReadJetPitchProbeRotation(vehicle);
    } catch {
        return;
    }
}
```

Comment: This is the `MoveObject(..., zeroPositionDelta, rotationDelta)` test with raw input.

```ts
async function applyJetVisualProbeMoveDeltaRaw(
    vehicle: mod.Vehicle,
    rotationDeg: mod.Vector,
    probe: JetPitchProbeSnapshot
): Promise<void> {
    try {
        probe.preRot = tryReadJetPitchProbeRotation(vehicle);
        probe.targetRot = rotationDeg;
        mod.MoveObject(vehicle, mod.CreateVector(0, 0, 0), rotationDeg);
        probe.applyRot = tryReadJetPitchProbeRotation(vehicle);
        await mod.Wait(0);
        probe.postRot = tryReadJetPitchProbeRotation(vehicle);
        await mod.Wait(VEHICLE_AIR_TRANSFORM_PITCH_PROBE_SETTLE_SECONDS);
        probe.settleRot = tryReadJetPitchProbeRotation(vehicle);
    } catch {
        return;
    }
}
```

Comment: This is the absolute `SetObjectTransform` test with raw input.

```ts
async function applyJetVisualProbeTransformAbsoluteRaw(
    vehicle: mod.Vehicle,
    rotationDeg: mod.Vector,
    probe: JetPitchProbeSnapshot
): Promise<void> {
    try {
        const currentPos = mod.GetObjectPosition(vehicle);
        probe.preRot = tryReadJetPitchProbeRotation(vehicle);
        probe.targetRot = rotationDeg;
        mod.SetObjectTransform(vehicle, mod.CreateTransform(currentPos, rotationDeg));
        probe.applyRot = tryReadJetPitchProbeRotation(vehicle);
        await mod.Wait(0);
        probe.postRot = tryReadJetPitchProbeRotation(vehicle);
        await mod.Wait(VEHICLE_AIR_TRANSFORM_PITCH_PROBE_SETTLE_SECONDS);
        probe.settleRot = tryReadJetPitchProbeRotation(vehicle);
    } catch {
        return;
    }
}
```

Comment: This is the over-time `SetObjectTransformOverTime` test with raw input.

```ts
async function applyJetVisualProbeTransformOverTimeRaw(
    vehicle: mod.Vehicle,
    rotationDeg: mod.Vector,
    probe: JetPitchProbeSnapshot
): Promise<void> {
    try {
        const currentPos = mod.GetObjectPosition(vehicle);
        probe.preRot = tryReadJetPitchProbeRotation(vehicle);
        probe.targetRot = rotationDeg;
        mod.SetObjectTransformOverTime(
            vehicle,
            mod.CreateTransform(currentPos, rotationDeg),
            JET_VISUAL_PROBE_TRANSFORM_OVERTIME_SECONDS,
            false,
            false
        );
        probe.applyRot = tryReadJetPitchProbeRotation(vehicle);
        await mod.Wait(JET_VISUAL_PROBE_TRANSFORM_OVERTIME_SECONDS);
        probe.postRot = tryReadJetPitchProbeRotation(vehicle);
        await mod.Wait(VEHICLE_AIR_TRANSFORM_PITCH_PROBE_SETTLE_SECONDS);
        probe.settleRot = tryReadJetPitchProbeRotation(vehicle);
    } catch {
        return;
    }
}
```

Comment: This is the exact mode table that maps each admin button cycle state to the concrete helper call being tested.

```ts
const JET_VISUAL_PROBE_MODES: JetVisualProbeModeSpec[] = [
    {
        buttonKey: mod.stringkeys.twl.adminPanel.tester.buttons.jetVisualProbeTransformYaw,
        titleKey: mod.stringkeys.twl.debug.jetProbeTitleTransformYaw,
        startKey: mod.stringkeys.twl.debug.jetProbeStartTransformYaw,
        apply: async (vehicle, teleportRot, probe) => {
            await applyVehicleAirTransformPitchRollDelta(vehicle, buildJetVisualProbeYawRotation(teleportRot), probe);
        },
    },
    {
        buttonKey: mod.stringkeys.twl.adminPanel.tester.buttons.jetVisualProbeTransformPitchX,
        titleKey: mod.stringkeys.twl.debug.jetProbeTitleTransformPitchX,
        startKey: mod.stringkeys.twl.debug.jetProbeStartTransformPitchX,
        apply: async (vehicle, teleportRot, probe) => {
            await applyVehicleAirTransformPitchRollDelta(vehicle, buildJetVisualProbePitchRotationX(teleportRot), probe);
        },
    },
    {
        buttonKey: mod.stringkeys.twl.adminPanel.tester.buttons.jetVisualProbeTransformPitchZ,
        titleKey: mod.stringkeys.twl.debug.jetProbeTitleTransformPitchZ,
        startKey: mod.stringkeys.twl.debug.jetProbeStartTransformPitchZ,
        apply: async (vehicle, teleportRot, probe) => {
            await applyVehicleAirTransformPitchRollDelta(vehicle, buildJetVisualProbePitchRotationZ(teleportRot), probe);
        },
    },
    {
        buttonKey: mod.stringkeys.twl.adminPanel.tester.buttons.jetVisualProbeRotatePitchX,
        titleKey: mod.stringkeys.twl.debug.jetProbeTitleRotatePitchX,
        startKey: mod.stringkeys.twl.debug.jetProbeStartRotatePitchX,
        apply: async (vehicle, _teleportRot, probe) => {
            await applyJetVisualProbeRotateDelta(vehicle, mod.CreateVector(JET_VISUAL_PROBE_TARGET_PITCH_DEGREES, 0, 0), probe);
        },
    },
    {
        buttonKey: mod.stringkeys.twl.adminPanel.tester.buttons.jetVisualProbeRotatePitchZ,
        titleKey: mod.stringkeys.twl.debug.jetProbeTitleRotatePitchZ,
        startKey: mod.stringkeys.twl.debug.jetProbeStartRotatePitchZ,
        apply: async (vehicle, _teleportRot, probe) => {
            await applyJetVisualProbeRotateDelta(vehicle, mod.CreateVector(0, 0, JET_VISUAL_PROBE_TARGET_PITCH_DEGREES), probe);
        },
    },
    {
        buttonKey: mod.stringkeys.twl.adminPanel.tester.buttons.jetVisualProbeMovePitchX,
        titleKey: mod.stringkeys.twl.debug.jetProbeTitleMovePitchX,
        startKey: mod.stringkeys.twl.debug.jetProbeStartMovePitchX,
        apply: async (vehicle, _teleportRot, probe) => {
            await applyJetVisualProbeMoveDelta(vehicle, mod.CreateVector(JET_VISUAL_PROBE_TARGET_PITCH_DEGREES, 0, 0), probe);
        },
    },
    {
        buttonKey: mod.stringkeys.twl.adminPanel.tester.buttons.jetVisualProbeMovePitchZ,
        titleKey: mod.stringkeys.twl.debug.jetProbeTitleMovePitchZ,
        startKey: mod.stringkeys.twl.debug.jetProbeStartMovePitchZ,
        apply: async (vehicle, _teleportRot, probe) => {
            await applyJetVisualProbeMoveDelta(vehicle, mod.CreateVector(0, 0, JET_VISUAL_PROBE_TARGET_PITCH_DEGREES), probe);
        },
    },
    {
        buttonKey: mod.stringkeys.twl.adminPanel.tester.buttons.jetVisualProbeTransformYawRaw,
        titleKey: mod.stringkeys.twl.debug.jetProbeTitleTransformYawRaw,
        startKey: mod.stringkeys.twl.debug.jetProbeStartTransformYawRaw,
        apply: async (vehicle, teleportRot, probe) => {
            await applyJetVisualProbeTransformAbsoluteRaw(vehicle, buildJetVisualProbeYawRotation(teleportRot), probe);
        },
    },
    {
        buttonKey: mod.stringkeys.twl.adminPanel.tester.buttons.jetVisualProbeTransformPitchXRaw,
        titleKey: mod.stringkeys.twl.debug.jetProbeTitleTransformPitchXRaw,
        startKey: mod.stringkeys.twl.debug.jetProbeStartTransformPitchXRaw,
        apply: async (vehicle, teleportRot, probe) => {
            await applyJetVisualProbeTransformAbsoluteRaw(vehicle, buildJetVisualProbePitchRotationX(teleportRot), probe);
        },
    },
    {
        buttonKey: mod.stringkeys.twl.adminPanel.tester.buttons.jetVisualProbeTransformPitchZRaw,
        titleKey: mod.stringkeys.twl.debug.jetProbeTitleTransformPitchZRaw,
        startKey: mod.stringkeys.twl.debug.jetProbeStartTransformPitchZRaw,
        apply: async (vehicle, teleportRot, probe) => {
            await applyJetVisualProbeTransformAbsoluteRaw(vehicle, buildJetVisualProbePitchRotationZ(teleportRot), probe);
        },
    },
    {
        buttonKey: mod.stringkeys.twl.adminPanel.tester.buttons.jetVisualProbeRotatePitchXRaw,
        titleKey: mod.stringkeys.twl.debug.jetProbeTitleRotatePitchXRaw,
        startKey: mod.stringkeys.twl.debug.jetProbeStartRotatePitchXRaw,
        apply: async (vehicle, _teleportRot, probe) => {
            await applyJetVisualProbeRotateDeltaRaw(vehicle, mod.CreateVector(JET_VISUAL_PROBE_TARGET_PITCH_DEGREES, 0, 0), probe);
        },
    },
    {
        buttonKey: mod.stringkeys.twl.adminPanel.tester.buttons.jetVisualProbeRotatePitchZRaw,
        titleKey: mod.stringkeys.twl.debug.jetProbeTitleRotatePitchZRaw,
        startKey: mod.stringkeys.twl.debug.jetProbeStartRotatePitchZRaw,
        apply: async (vehicle, _teleportRot, probe) => {
            await applyJetVisualProbeRotateDeltaRaw(vehicle, mod.CreateVector(0, 0, JET_VISUAL_PROBE_TARGET_PITCH_DEGREES), probe);
        },
    },
    {
        buttonKey: mod.stringkeys.twl.adminPanel.tester.buttons.jetVisualProbeMovePitchXRaw,
        titleKey: mod.stringkeys.twl.debug.jetProbeTitleMovePitchXRaw,
        startKey: mod.stringkeys.twl.debug.jetProbeStartMovePitchXRaw,
        apply: async (vehicle, _teleportRot, probe) => {
            await applyJetVisualProbeMoveDeltaRaw(vehicle, mod.CreateVector(JET_VISUAL_PROBE_TARGET_PITCH_DEGREES, 0, 0), probe);
        },
    },
    {
        buttonKey: mod.stringkeys.twl.adminPanel.tester.buttons.jetVisualProbeMovePitchZRaw,
        titleKey: mod.stringkeys.twl.debug.jetProbeTitleMovePitchZRaw,
        startKey: mod.stringkeys.twl.debug.jetProbeStartMovePitchZRaw,
        apply: async (vehicle, _teleportRot, probe) => {
            await applyJetVisualProbeMoveDeltaRaw(vehicle, mod.CreateVector(0, 0, JET_VISUAL_PROBE_TARGET_PITCH_DEGREES), probe);
        },
    },
    {
        buttonKey: mod.stringkeys.twl.adminPanel.tester.buttons.jetVisualProbeTransformOverTimeYawRaw,
        titleKey: mod.stringkeys.twl.debug.jetProbeTitleTransformOverTimeYawRaw,
        startKey: mod.stringkeys.twl.debug.jetProbeStartTransformOverTimeYawRaw,
        apply: async (vehicle, teleportRot, probe) => {
            await applyJetVisualProbeTransformOverTimeRaw(vehicle, buildJetVisualProbeYawRotation(teleportRot), probe);
        },
    },
    {
        buttonKey: mod.stringkeys.twl.adminPanel.tester.buttons.jetVisualProbeTransformOverTimePitchXRaw,
        titleKey: mod.stringkeys.twl.debug.jetProbeTitleTransformOverTimePitchXRaw,
        startKey: mod.stringkeys.twl.debug.jetProbeStartTransformOverTimePitchXRaw,
        apply: async (vehicle, teleportRot, probe) => {
            await applyJetVisualProbeTransformOverTimeRaw(vehicle, buildJetVisualProbePitchRotationX(teleportRot), probe);
        },
    },
    {
        buttonKey: mod.stringkeys.twl.adminPanel.tester.buttons.jetVisualProbeTransformOverTimePitchZRaw,
        titleKey: mod.stringkeys.twl.debug.jetProbeTitleTransformOverTimePitchZRaw,
        startKey: mod.stringkeys.twl.debug.jetProbeStartTransformOverTimePitchZRaw,
        apply: async (vehicle, teleportRot, probe) => {
            await applyJetVisualProbeTransformOverTimeRaw(vehicle, buildJetVisualProbePitchRotationZ(teleportRot), probe);
        },
    },
];
```

Comment: This is the exact temporary HUD block that shows the current probe readbacks for the visible jet test.

```ts
function showJetPitchProbeHudForPlayer(player: mod.Player, snapshot: JetPitchProbeSnapshot | undefined): void {
    if (!player || !mod.IsPlayerValid(player) || !snapshot) return;
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return;

    const container = ensureJetPitchProbeContainerForPlayer(player, pid);
    if (!container) return;
    safeSetUIWidgetVisible(container, true);

    const title = ensureJetPitchProbeTextWidget(
        player,
        pid,
        "Title",
        JET_PITCH_PROBE_TITLE_Y,
        snapshot.titleKey ?? mod.stringkeys.twl.debug.jetPitchProbeTitle,
        JET_PITCH_PROBE_COLOR_TITLE,
        JET_PITCH_PROBE_TITLE_SIZE
    );
    syncJetPitchProbeLine(
        player,
        pid,
        "Teleport",
        JET_PITCH_PROBE_LINE_Y + (JET_PITCH_PROBE_LINE_GAP_Y * 0),
        mod.stringkeys.twl.debug.jetAirTeleportRot,
        snapshot.teleportRot
    );
    syncJetPitchProbeLine(
        player,
        pid,
        "Target",
        JET_PITCH_PROBE_LINE_Y + (JET_PITCH_PROBE_LINE_GAP_Y * 1),
        mod.stringkeys.twl.debug.jetAirTargetRot,
        snapshot.targetRot
    );
    syncJetPitchProbeLine(
        player,
        pid,
        "Pre",
        JET_PITCH_PROBE_LINE_Y + (JET_PITCH_PROBE_LINE_GAP_Y * 2),
        mod.stringkeys.twl.debug.jetAirPreRot,
        snapshot.preRot
    );
    syncJetPitchProbeLine(
        player,
        pid,
        "Apply",
        JET_PITCH_PROBE_LINE_Y + (JET_PITCH_PROBE_LINE_GAP_Y * 3),
        mod.stringkeys.twl.debug.jetAirApplyRot,
        snapshot.applyRot
    );
    syncJetPitchProbeLine(
        player,
        pid,
        "Post",
        JET_PITCH_PROBE_LINE_Y + (JET_PITCH_PROBE_LINE_GAP_Y * 4),
        mod.stringkeys.twl.debug.jetAirPostRot,
        snapshot.postRot
    );
    syncJetPitchProbeLine(
        player,
        pid,
        "Settle",
        JET_PITCH_PROBE_LINE_Y + (JET_PITCH_PROBE_LINE_GAP_Y * 5),
        mod.stringkeys.twl.debug.jetAirSettleRot,
        snapshot.settleRot
    );
    syncJetPitchProbeLine(
        player,
        pid,
        "Seat",
        JET_PITCH_PROBE_LINE_Y + (JET_PITCH_PROBE_LINE_GAP_Y * 6),
        mod.stringkeys.twl.debug.jetAirSeatRot,
        snapshot.seatRot
    );

    safeSetUIWidgetVisible(title, true);
}
```
