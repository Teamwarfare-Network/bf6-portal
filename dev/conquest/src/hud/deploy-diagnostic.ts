// @ts-nocheck
// Module: hud/deploy-diagnostic -- per-player deploy-flow trace overlay (v1.239 Phase 1 Part A)
//
// Instruments the production HQ/Air/Forward deploy path with a fixed 8-row HUD so a working F16
// HQ Deploy and a failing F22/AH64/MH6 HQ Deploy can be compared side-by-side. All text comes
// from registered keys in twl.deployDiag.* — rip the module AND those strings together when done.

// Widget ID prefixes live inside the module (not strings/ui-ids.ts) so the postbuild's
// FEATURE_DEPLOY_DIAGNOSTIC=false dead-code pass strips the constants with the rest of the file.
const DD_C = "UI_DEPLOY_DIAG_CONTAINER_";
const DD_V = [
    "UI_DEPLOY_DIAG_ROW_VEHICLE_VALUE_",
    "UI_DEPLOY_DIAG_ROW_MODE_VALUE_",
    "UI_DEPLOY_DIAG_ROW_CLICK_VALUE_",
    "UI_DEPLOY_DIAG_ROW_PREP_VALUE_",
    "UI_DEPLOY_DIAG_ROW_SPAWN_VALUE_",
    "UI_DEPLOY_DIAG_ROW_BIND_VALUE_",
    "UI_DEPLOY_DIAG_ROW_DEPLOY_VALUE_",
    "UI_DEPLOY_DIAG_ROW_SEAT_VALUE_",
];
const DD_ROW_VEHICLE = 0;
const DD_ROW_MODE = 1;
const DD_ROW_CLICK = 2;
const DD_ROW_PREP = 3;
const DD_ROW_SPAWN = 4;
const DD_ROW_BIND = 5;
const DD_ROW_DEPLOY = 6;
const DD_ROW_SEAT = 7;

function deployDiagLabelKeyForRow(row: number): number {
    const k = mod.stringkeys.twl.deployDiag;
    if (row === DD_ROW_VEHICLE) return k.rowVehicle;
    if (row === DD_ROW_MODE) return k.rowMode;
    if (row === DD_ROW_CLICK) return k.rowClick;
    if (row === DD_ROW_PREP) return k.rowPrep;
    if (row === DD_ROW_SPAWN) return k.rowSpawn;
    if (row === DD_ROW_BIND) return k.rowBind;
    if (row === DD_ROW_DEPLOY) return k.rowDeploy;
    return k.rowSeat;
}

function deployDiagEnsureWidgets(player: mod.Player): number | undefined {
    if (!FEATURE_DEPLOY_DIAGNOSTIC) return undefined;
    if (!player || !mod.IsPlayerValid(player)) return undefined;
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return undefined;
    const cid = DD_C + pid;
    if (!safeFind(cid)) {
        mod.AddUIContainer(cid, mod.CreateVector(12, 80, 0), mod.CreateVector(240, 168, 0),
            mod.UIAnchor.TopLeft, mod.GetUIRoot(), true, 0, COLOR_DARK_BLACK, 0.75,
            mod.UIBgFill.Solid, mod.UIDepth.AboveGameUI, player);
    }
    const container = safeFind(cid);
    if (!container) return undefined;
    const pending = mod.Message(mod.stringkeys.twl.deployDiag.pending);
    for (let i = 0; i < 8; i++) {
        const y = i * 18;
        const lid = "UI_DEPLOY_DIAG_L_" + i + "_" + pid;
        const vid = DD_V[i] + pid;
        if (!safeFind(lid)) {
            safeParseUI({
                name: lid, type: "Text", playerId: player,
                position: [4, y], size: [86, 18],
                anchor: mod.UIAnchor.TopLeft, visible: true,
                padding: 0, bgAlpha: 0, bgFill: mod.UIBgFill.None,
                textLabel: mod.Message(deployDiagLabelKeyForRow(i)),
                textColor: [0.6, 0.85, 1], textAlpha: 1, textSize: 12,
                textAnchor: mod.UIAnchor.CenterLeft,
            });
            const w = safeFind(lid);
            if (w) safeSetUIWidgetParent(w, container);
        }
        if (!safeFind(vid)) {
            safeParseUI({
                name: vid, type: "Text", playerId: player,
                position: [94, y], size: [140, 18],
                anchor: mod.UIAnchor.TopLeft, visible: true,
                padding: 0, bgAlpha: 0, bgFill: mod.UIBgFill.None,
                textLabel: pending,
                textColor: [1, 1, 1], textAlpha: 1, textSize: 12,
                textAnchor: mod.UIAnchor.CenterLeft,
            });
            const w = safeFind(vid);
            if (w) safeSetUIWidgetParent(w, container);
        }
    }
    return pid;
}

function deployDiagSet(player: mod.Player, row: number, messageKey: number): void {
    if (!FEATURE_DEPLOY_DIAGNOSTIC) return;
    const pid = deployDiagEnsureWidgets(player);
    if (pid === undefined) return;
    safeSetUITextLabel(safeFind(DD_V[row] + pid), mod.Message(messageKey));
}

function deployDiagBroadcast(row: number, messageKey: number): void {
    if (!FEATURE_DEPLOY_DIAGNOSTIC) return;
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (p) deployDiagSet(p, row, messageKey);
    }
}

function deployDiagVehicleKey(v: mod.VehicleList | undefined): number {
    const k = mod.stringkeys.twl.deployDiag;
    if (v === mod.VehicleList.F16) return k.vehF16;
    if (v === mod.VehicleList.F22) return k.vehF22;
    if (v === mod.VehicleList.AH64) return k.vehAH64;
    if (v === mod.VehicleList.AH6M) return k.vehMH6;
    if (v === mod.VehicleList.Abrams) return k.vehAbrams;
    return k.vehOther;
}

function deployDiagModeKey(mode: "ground" | "air" | "forward" | "unknown", v: mod.VehicleList | undefined): number {
    const k = mod.stringkeys.twl.deployDiag;
    if (mode === "forward") return k.modeForward;
    if (mode === "ground") return k.modeGround;
    if (mode === "air") return (v !== undefined && isAircraftVehicleType(v)) ? k.modeHq : k.modeAir;
    return k.modeUnknown;
}

// Public setters used from production deploy code. All no-op when FEATURE_DEPLOY_DIAGNOSTIC is off.

function deployDiagBegin(player: mod.Player, v: mod.VehicleList | undefined, mode: "ground" | "air" | "forward" | "unknown"): void {
    if (!FEATURE_DEPLOY_DIAGNOSTIC) return;
    const pid = deployDiagEnsureWidgets(player);
    if (pid === undefined) return;
    const k = mod.stringkeys.twl.deployDiag;
    const pending = k.pending;
    // Reset rows first so stale status from the prior click can't mislead.
    deployDiagSet(player, DD_ROW_PREP, pending);
    deployDiagSet(player, DD_ROW_SPAWN, pending);
    deployDiagSet(player, DD_ROW_BIND, pending);
    deployDiagSet(player, DD_ROW_DEPLOY, pending);
    deployDiagSet(player, DD_ROW_SEAT, pending);
    deployDiagSet(player, DD_ROW_VEHICLE, deployDiagVehicleKey(v));
    deployDiagSet(player, DD_ROW_MODE, deployDiagModeKey(mode, v));
    deployDiagSet(player, DD_ROW_CLICK, k.clickOk);
}

function deployDiagSetClickBlocked(player: mod.Player): void {
    deployDiagSet(player, DD_ROW_CLICK, mod.stringkeys.twl.deployDiag.clickBlocked);
}

function deployDiagSetPrep(player: mod.Player, outcome: "ok" | "failed" | "skip" | "hud-blocked" | "no-slot" | "fail-enabled" | "fail-vid" | "fail-expecting" | "fail-respawn" | "fail-retry" | "fail-timer" | "fail-gated" | "entered" | "fulfill-entry" | "fulfill-no-slot" | "fulfill-bad-mode" | "fulfill-can't" | "fulfill-gotveh" | "fulfill-seatocc" | "fulfill-notready" | "fulfill-nospawn" | "fulfill-token" | "fulfill-ok"): void {
    const k = mod.stringkeys.twl.deployDiag;
    let key = k.prepFailed;
    if (outcome === "ok") key = k.prepOk;
    else if (outcome === "skip") key = k.prepSkip;
    else if (outcome === "hud-blocked") key = k.prepHudBlocked;
    else if (outcome === "no-slot") key = k.prepNoSlot;
    else if (outcome === "fail-enabled") key = k.prepFailedEnabled;
    else if (outcome === "fail-vid") key = k.prepFailedVid;
    else if (outcome === "fail-expecting") key = k.prepFailedExpecting;
    else if (outcome === "fail-respawn") key = k.prepFailedRespawn;
    else if (outcome === "fail-retry") key = k.prepFailedRetry;
    else if (outcome === "fail-timer") key = k.prepFailedTimer;
    else if (outcome === "fail-gated") key = k.prepFailedGated;
    else if (outcome === "entered") key = k.prepEntered;
    else if (outcome === "fulfill-entry") key = k.prepFulfillEntry;
    else if (outcome === "fulfill-no-slot") key = k.prepFulfillNoSlot;
    else if (outcome === "fulfill-bad-mode") key = k.prepFulfillBadMode;
    else if (outcome === "fulfill-can't") key = k.prepFulfillCantFulfill;
    else if (outcome === "fulfill-gotveh") key = k.prepFulfillGotVeh;
    else if (outcome === "fulfill-seatocc") key = k.prepFulfillSeatOcc;
    else if (outcome === "fulfill-notready") key = k.prepFulfillNotReady;
    else if (outcome === "fulfill-nospawn") key = k.prepFulfillNoSpawn;
    else if (outcome === "fulfill-token") key = k.prepFulfillTokenChange;
    else if (outcome === "fulfill-ok") key = k.prepFulfillOk;
    deployDiagSet(player, DD_ROW_PREP, key);
}

function deployDiagSetSpawn(player: mod.Player, outcome: "ok" | "timeout" | "substituted"): void {
    const k = mod.stringkeys.twl.deployDiag;
    deployDiagSet(player, DD_ROW_SPAWN, outcome === "ok" ? k.spawnOk : outcome === "timeout" ? k.spawnTimeout : k.spawnSubstituted);
}

function deployDiagSetBind(player: mod.Player, outcome: "ok" | "reject-abrams" | "reject-type" | "not-expecting"): void {
    const k = mod.stringkeys.twl.deployDiag;
    const key = outcome === "ok" ? k.bindOk
        : outcome === "reject-abrams" ? k.bindRejectAbrams
            : outcome === "reject-type" ? k.bindRejectType
                : k.bindNotExpecting;
    deployDiagSet(player, DD_ROW_BIND, key);
}

function deployDiagSetDeploy(player: mod.Player, outcome: "state-ok" | "timeout"): void {
    const k = mod.stringkeys.twl.deployDiag;
    deployDiagSet(player, DD_ROW_DEPLOY, outcome === "state-ok" ? k.deployStateOk : k.deployTimeout);
}

function deployDiagSetSeat(player: mod.Player, outcome: "verify-ok" | "verify-failed" | "retry-neg1"): void {
    const k = mod.stringkeys.twl.deployDiag;
    const key = outcome === "verify-ok" ? k.seatVerifyOk
        : outcome === "verify-failed" ? k.seatVerifyFailed
            : k.seatRetryNeg1;
    deployDiagSet(player, DD_ROW_SEAT, key);
}

// Broadcast variants emit to every live player — used where the caller does not know which
// player clicked (bind path triggered via OnVehicleSpawned).
function deployDiagBroadcastBind(outcome: "ok" | "reject-abrams" | "reject-type" | "not-expecting"): void {
    const k = mod.stringkeys.twl.deployDiag;
    const key = outcome === "ok" ? k.bindOk
        : outcome === "reject-abrams" ? k.bindRejectAbrams
            : outcome === "reject-type" ? k.bindRejectType
                : k.bindNotExpecting;
    deployDiagBroadcast(DD_ROW_BIND, key);
}

function deployDiagBroadcastSpawn(outcome: "ok" | "timeout" | "substituted"): void {
    const k = mod.stringkeys.twl.deployDiag;
    const key = outcome === "ok" ? k.spawnOk : outcome === "timeout" ? k.spawnTimeout : k.spawnSubstituted;
    deployDiagBroadcast(DD_ROW_SPAWN, key);
}
