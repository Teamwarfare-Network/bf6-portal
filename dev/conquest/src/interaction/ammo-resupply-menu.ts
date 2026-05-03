// @ts-nocheck
const AMMO_RESUPPLY_MENU_SIZE = 860;
const AMMO_RESUPPLY_MENU_BORDER_THICKNESS = 2;
const AMMO_RESUPPLY_MENU_BORDER_PADDING = 1;
const AMMO_RESUPPLY_MENU_BORDER_OVERLAP = 2;
const AMMO_RESUPPLY_ROOT_Y = 50;
const AMMO_RESUPPLY_CLASS_HEADER_Y = -366;
const AMMO_RESUPPLY_CLASS_HEADER_WIDTH = 170;
const HDR_X = [-264, -88, 88, 264];
const HDR_KEYS = [STR_UI_ASSAULT, STR_UI_ENGINEER, STR_UI_MEDIC, STR_UI_RECON];
const AX = -264;
const EX = -88;
const MX = 88;
const RX = 264;
const AMMO_RESUPPLY_TILE_SIZE = 120;
const AMMO_RESUPPLY_TILE_LABEL_WIDTH = 220;
const AMMO_RESUPPLY_TILE_TIMER_WIDTH = 220;
const SY = -218;
const DY = 126;
const LY = 44;
const SPY = 30;
const TY = 44;
const IS = 52;
const IY = LY;
const CX = -40;
const CY = 44;
const CB = 32;
const CSZ = 16;
const TILE_LABEL_TOP_Y = 5;
const TILE_LABEL_LINE_STEP = 11;
const TILE_LABEL_LINE_HEIGHT = 14;
const TILE_LABEL_SIZE = 16;
const TILE_SCOPE_SIZE = 12;
const TILE_TIMER_SIZE = 18;
const TILE_GROUP_PAD_X = 10;
const TILE_GROUP_PAD_Y = 10;
const TILE_GROUP_HINT_GAP = 16;
const TILE_GROUP_HINT_SIZE = 16;
const TILE_GROUP_BORDER_SIZE_X = AMMO_RESUPPLY_TILE_SIZE + (TILE_GROUP_PAD_X * 2);
const TILE_GROUP_BORDER_COLOR = COLOR_BLUE_DARK;
const TILE_REF_X = 18;
const TILE_REF_Y = 44;
const TILE_REF_WIDTH = 56;
const TILE_REF_SIZE = 12;
const ASSAULT_GROUP_TIMER_GAP = 18;
const ASSAULT_GROUP_TIMER_SIZE = 18;
const LAUNCH_AMMO_ICON_SIZE = 32;
const LAUNCH_AMMO_ICON_Y = IY;
const AMMO_RESUPPLY_CLOSE_BUTTON_Y = 396;
const AMMO_RESUPPLY_CLOSE_BUTTON_WIDTH = 260;
const AMMO_RESUPPLY_CLOSE_BUTTON_HEIGHT = 50;
const AMMO_RESUPPLY_SLOT_TOGGLE_Y = -314;
const AMMO_RESUPPLY_SLOT_TOGGLE_BUTTON_W = 24;
const AMMO_RESUPPLY_SLOT_TOGGLE_BUTTON_H = 24;
const AMMO_RESUPPLY_SLOT_TOGGLE_LABEL_W = 90;

//#region -------------------- Gadget Locker Config --------------------

// Default gadget locker layout matching the original hardcoded items.
const DEFAULT_GADGET_LOCKER_CONFIG: GadgetLockerConfig = {
    assault: [
        { name: "Artillery",     labelKey: STR_UI_ARTILLERY_STRIKE, gadget: mod.Gadgets.CallIn_Artillery_Strike,     slot: mod.InventorySlots.Callins,   cooldownSeconds: 1500, teamShared: true, maxCount: 1, iconSize: 56, iconY: IY },
        { name: "SpawnBeacon",   labelKey: STR_UI_SPAWN_BEACON,     gadget: mod.Gadgets.Deployable_Deploy_Beacon,    slot: mod.InventorySlots.GadgetTwo, cooldownSeconds: 900, teamShared: true, maxCount: 1, iconSize: 36, iconY: IY },
        { name: "AssaultLadder", labelKey: STR_UI_ASSAULT_LADDER,   gadget: mod.Gadgets.Misc_Assault_Ladder,         slot: mod.InventorySlots.GadgetTwo, cooldownSeconds: 600, teamShared: true, maxCount: 1, iconSize: 36, iconY: IY },
    ],
    launchers: [
        { name: "RPG",     labelKey: STR_UI_RPG,     gadget: mod.Gadgets.Launcher_Unguided_Rocket, maxAmmo: 3 },
        { name: "AT4",     labelKey: STR_UI_AT4,     gadget: mod.Gadgets.Launcher_Aim_Guided,      maxAmmo: 3, pool: { maxCount: 4, rechargeSeconds: 180, teamShared: true } },
        { name: "Stinger", labelKey: STR_UI_STINGER, gadget: mod.Gadgets.Launcher_Air_Defense,     maxAmmo: 3 },
    ],
    launcherCooldownSeconds: 180,
    ammoCooldownSeconds: 60,
    ammoMaxCharges: 3,
    medicItems: [
        { name: "MedicGrenadeIntercept", labelKey: STR_UI_GRENADE_INTERCEPT, gadget: mod.Gadgets.Deployable_Grenade_Intercept_System, slot: mod.InventorySlots.GadgetTwo, cooldownSeconds: 180, teamShared: false, maxCount: 1, iconSize: 36, iconY: IY },
        { name: "MedicMissileIntercept", labelKey: STR_UI_MISSILE_INTERCEPT, gadget: mod.Gadgets.Deployable_Missile_Intercept_System, slot: mod.InventorySlots.GadgetTwo, cooldownSeconds: 180, teamShared: false, maxCount: 1, iconSize: 36, iconY: IY },
    ],
    medicSmoke: { name: "MedicSmoke", labelKey: STR_UI_SMOKE_SCREEN, gadget: mod.Gadgets.CallIn_Smoke_Screen, slot: mod.InventorySlots.Callins, cooldownSeconds: 360, teamShared: true, maxCount: 1 },
    recon: [
        { name: "ReconDrone", labelKey: STR_UI_DRONE,                gadget: mod.Gadgets.Deployable_Recon_Drone,         slot: mod.InventorySlots.GadgetTwo, cooldownSeconds: 300, teamShared: false, maxCount: 1, iconSize: 30, iconY: IY },
        { name: "ReconC4",    labelKey: STR_UI_C4,                   gadget: mod.Gadgets.Misc_Demolition_Charge,         slot: mod.InventorySlots.GadgetTwo, cooldownSeconds: 180, teamShared: false, maxCount: 1, iconSize: 40, iconY: IY },
        { name: "ReconAV",    labelKey: STR_UI_ANTI_VEHICLE_GRENADE, gadget: mod.Gadgets.Throwable_Anti_Vehicle_Grenade, slot: mod.InventorySlots.Throwable,  cooldownSeconds: 180, teamShared: false, maxCount: 1, iconSize: 40, iconY: IY },
    ],
    reconSharedCooldownSeconds: 180,
};

let ACTIVE_GADGET_CONFIG: GadgetLockerConfig = DEFAULT_GADGET_LOCKER_CONFIG;

// Applies a per-map gadget locker config override. Falls back to defaults when omitted.
function syncActiveGadgetLockerConfig(override?: GadgetLockerConfig): void {
    ACTIVE_GADGET_CONFIG = override ?? DEFAULT_GADGET_LOCKER_CONFIG;
    resetAllArmTimers();
    State.hudCache.ammoResupplyMenuCache = {};
}

//#endregion -------------------- Gadget Locker Config --------------------
const DIS_A = 0.45;
const HELP_TEXT_Y = 345;
const HELP_TEXT_WIDTH = 800;
// Maps tile name prefix to its help text string key for the hover-driven help line.
const HELP_KEY_MAP: Record<string, number> = {
    Artillery: STR_UI_HELP_ARTILLERY_STRIKE,
    SpawnBeacon: STR_UI_HELP_SPAWN_BEACON,
    AssaultLadder: STR_UI_HELP_ASSAULT_LADDER,
    MedicSmoke: STR_UI_HELP_SMOKE_SCREEN,
    MedicGrenadeIntercept: STR_UI_HELP_GRENADE_INTERCEPT,
    MedicMissileIntercept: STR_UI_HELP_MISSILE_INTERCEPT,
    AmmoCharge: STR_UI_HELP_LAUNCHER_AMMO,
    ReconDrone: STR_UI_HELP_DRONE,
    ReconC4: STR_UI_HELP_C4,
    ReconAV: STR_UI_HELP_ANTI_VEHICLE_GRENADE,
};
// Maps engineer action row index to its help text string key.
const ENG_HELP_KEYS = [STR_UI_HELP_RPG, STR_UI_HELP_AT4, STR_UI_HELP_STINGER];
const ARM_SFX_PREFAB = mod.RuntimeSpawn_Common.SFX_UI_MenuNavigation_Default_PrimarySelect_OneShot2D;
const ARM_SFX_AMPLITUDE = 50;
// Lazy-spawns the gadget selection sound handle on first use.
function primeArmSfx(): void {
    if (State.round.armSfx.ready) return;
    const zero = VEC_ZERO;
    try {
        State.round.armSfx.handle = mod.SpawnObject(ARM_SFX_PREFAB, zero, zero);
    } catch { State.round.armSfx.handle = undefined; }
    State.round.armSfx.ready = State.round.armSfx.handle !== undefined && State.round.armSfx.handle !== null;
}
// Plays the gadget selection SFX for a specific player.
function playArmSfx(player: mod.Player): void {
    if (!isValidPlayer(player)) return;
    primeArmSfx();
    if (!State.round.armSfx.ready) return;
    try { mod.PlaySound(State.round.armSfx.handle, ARM_SFX_AMPLITUDE, player); } catch {}
}
function armScope(isTeamShared: boolean): mod.Message {
    return msg(isTeamShared ? STR_UI_ONE_PER_TEAM : STR_UI_ONE_PER_PLAYER);
}
function armChoose(): mod.Message {
    return msg(STR_UI_CHOOSE_ONLY_ONE);
}
const DURATION_LABEL_MAP: Record<number, number> = {
    60: mod.stringkeys.twl.ui.duration1m,
    180: mod.stringkeys.twl.ui.duration3m,
    300: mod.stringkeys.twl.ui.duration5m,
    360: mod.stringkeys.twl.ui.duration6m,
    420: mod.stringkeys.twl.ui.duration7m,
    480: mod.stringkeys.twl.ui.duration8m,
    600: mod.stringkeys.twl.ui.duration10m,
    900: mod.stringkeys.twl.ui.duration15m,
    1500: mod.stringkeys.twl.ui.duration25m,
};
function armDur(seconds: number): mod.Message {
    return msg(DURATION_LABEL_MAP[seconds] ?? STR_UI_READY);
}
function armGH(count: number): number {
    return AMMO_RESUPPLY_TILE_SIZE + ((Math.max(1, count) - 1) * DY) + (TILE_GROUP_PAD_Y * 2);
}
function armGCY(startY: number, count: number): number {
    return startY + (((Math.max(1, count) - 1) * DY) / 2);
}
function armGHY(centerY: number, height: number): number {
    return centerY + (height / 2) + TILE_GROUP_HINT_GAP;
}
function armGBox(
    name: string,
    posX: number,
    posY: number,
    sizeX: number,
    sizeY: number,
    root: mod.UIWidget,
    eventPlayer: mod.Player
): mod.UIWidget | undefined {
    mod.AddUIContainer(
        name,
        mod.CreateVector(posX, posY, 0),
        mod.CreateVector(sizeX, sizeY, 0),
        mod.UIAnchor.Center,
        root,
        false,
        0,
        TILE_GROUP_BORDER_COLOR,
        1,
        mod.UIBgFill.OutlineThin,
        mod.UIDepth.AboveGameUI,
        eventPlayer
    );
    return safeFind(name);
}
function resetArmTimers(pid: number): void {
    delete State.players.armG[pid];
    delete State.players.armL[pid];
    delete State.players.armS[pid];
}
function resetAllArmTimers(): void {
    State.players.armG = {};
    State.players.armL = {};
    State.players.armS = {};
    State.round.smk = {};
    State.round.asg = {};
    State.round.asgL = {};
    refreshOpenArm(0, true);
}
function ammoResupplyMenuName(kind: string, pid: number, index?: number): string {
    if (typeof index === "number") {
        return `AmmoResupplyMenu${kind}_${pid}_${index}`;
    }
    return `AmmoResupplyMenu${kind}_${pid}`;
}
function isArmOpen(pid: number | undefined): boolean {
    if (pid === undefined) return false;
    return State.players.armO[pid] === true;
}
function getArmObj(pid: number | undefined): number | undefined {
    if (pid === undefined) return undefined;
    return State.players.armI[pid];
}
function setArmOpen(pid: number, visible: boolean): void {
    if (visible) {
        State.players.armO[pid] = true;
        return;
    }
    delete State.players.armO[pid];
    // Drop focus tracking on close so a stale tile key cannot leak into the next session.
    delete State.players.armFocusedTileKeyByPid[pid];
}
function setArmObj(pid: number, objId: number | undefined): void {
    if (typeof objId === "number") {
        State.players.armI[pid] = objId;
        return;
    }
    delete State.players.armI[pid];
}
function mkArmCache(pid: number): AmmoResupplyMenuCacheEntry {
    const cfg = ACTIVE_GADGET_CONFIG;
    const a: AmmoResupplyMenuChargeCacheEntry[] = [];
    for (let i = 0; i < cfg.assault.length; i++) a.push({} as any);
    const rows: AmmoResupplyMenuActionRowCacheEntry[] = [];
    for (let i = 0; i < cfg.launchers.length; i++) rows.push({} as any);
    const x: AmmoResupplyMenuChargeCacheEntry[] = [];
    for (let i = 0; i < cfg.medicItems.length; i++) x.push({} as any);
    const q: AmmoResupplyMenuChargeCacheEntry[] = [];
    for (let i = 0; i < cfg.recon.length; i++) q.push({} as any);
    return {
        rootName: ammoResupplyMenuName("Root", pid),
        h: [],
        a,
        rows,
        m: {},
        x,
        e: {},
        q,
    };
}
function resetArmState(pid: number): void {
    if (!Number.isInteger(pid)) return;
    delete State.players.armO[pid];
    delete State.players.armI[pid];
    delete State.players.armT[pid];
    delete State.players.armFocusedTileKeyByPid[pid];
}
function ensArmG(pid: number): {
    n: number;
    s: number;
} {
    if (!State.players.armG[pid]) {
        State.players.armG[pid] = {
            n: 0,
            s: -1,
        };
    }
    return State.players.armG[pid];
}
// Returns (or initializes) the per-player medic/recon cooldown state. Cooldowns are player-scoped, not per-crate.
function ensArm(pid: number): {
    mN: number;
    mS: number;
    rdN: number;
    rgN: number;
    rgS: number;
} {
    if (!State.players.armS[pid]) {
        State.players.armS[pid] = {
            mN: 0,
            mS: -1,
            rdN: 0,
            rgN: 0,
            rgS: -1,
        };
    }
    return State.players.armS[pid];
}
function ensArmL(pid: number): {
    lN: number;
    aC: number;
    aN: number;
    s: number;
} {
    if (!State.players.armL[pid]) {
        State.players.armL[pid] = {
            lN: 0,
            aC: ACTIVE_GADGET_CONFIG.ammoMaxCharges,
            aN: 0,
            s: -1,
        };
    }
    return State.players.armL[pid];
}
// Returns (or initializes) the per-team assault gadget cooldown array. One {c,n} entry per config assault item.
function ensAsg(teamId: TeamID | 0): Array<{ c: number; n: number }> | undefined {
    if (teamId !== TeamID.Team1 && teamId !== TeamID.Team2) return undefined;
    if (!State.round.asg[teamId]) {
        const cfg = ACTIVE_GADGET_CONFIG;
        const arr: Array<{ c: number; n: number }> = [];
        for (let i = 0; i < cfg.assault.length; i++) {
            arr.push({ c: cfg.assault[i].maxCount, n: 0 });
        }
        State.round.asg[teamId] = arr;
    }
    return State.round.asg[teamId];
}
// Returns (or initializes) the per-team launcher pool array. One entry per config launcher; null when that launcher has no pool.
function ensAsgL(teamId: TeamID | 0): Array<{ c: number; n: number } | null> | undefined {
    if (teamId !== TeamID.Team1 && teamId !== TeamID.Team2) return undefined;
    if (!State.round.asgL[teamId]) {
        const cfg = ACTIVE_GADGET_CONFIG;
        const arr: Array<{ c: number; n: number } | null> = [];
        for (let i = 0; i < cfg.launchers.length; i++) {
            const pool = cfg.launchers[i].pool;
            arr.push(pool ? { c: pool.maxCount, n: 0 } : null);
        }
        State.round.asgL[teamId] = arr;
    }
    return State.round.asgL[teamId];
}
function ensSmk(teamId: TeamID | 0): {
    c: number;
    n: number;
} | undefined {
    if (teamId !== TeamID.Team1 && teamId !== TeamID.Team2) return undefined;
    if (!State.round.smk[teamId]) {
        State.round.smk[teamId] = {
            c: ACTIVE_GADGET_CONFIG.medicSmoke.maxCount,
            n: 0,
        };
    }
    return State.round.smk[teamId];
}
function syncArm(
    state: {
        aC: number;
        aN: number;
        lN?: number;
        s?: number;
    },
    now: number
): void {
    const maxCharges = ACTIVE_GADGET_CONFIG.ammoMaxCharges;
    const chargeCd = ACTIVE_GADGET_CONFIG.ammoCooldownSeconds;
    while (
        state.aC < maxCharges
        && state.aN > 0
        && now >= state.aN
    ) {
        state.aC++;
        if (state.aC < maxCharges) {
            state.aN += chargeCd;
        } else {
            state.aN = 0;
        }
    }
    if (state.aC >= maxCharges) {
        state.aC = maxCharges;
        state.aN = 0;
    }
    if ((state.lN ?? 0) <= now) {
        if (typeof state.lN === "number" && state.lN < now) state.lN = 0;
        if (typeof state.s === "number") state.s = -1;
    }
}
// Ticks each assault item's cooldown: restores count to maxCount once the timer expires.
function syncAsg(
    state: Array<{ c: number; n: number }>,
    now: number
): void {
    const cfg = ACTIVE_GADGET_CONFIG;
    for (let i = 0; i < state.length; i++) {
        const max = cfg.assault[i]?.maxCount ?? 1;
        if (state[i].c < max && state[i].n > 0 && now >= state[i].n) { state[i].c = max; state[i].n = 0; }
    }
}
// Ticks each launcher pool's per-charge drip: refills one charge at a time over rechargeSeconds.
function syncAsgL(
    state: Array<{ c: number; n: number } | null>,
    now: number
): void {
    const cfg = ACTIVE_GADGET_CONFIG;
    for (let i = 0; i < state.length; i++) {
        const entry = state[i];
        const pool = cfg.launchers[i]?.pool;
        if (!entry || !pool) continue;
        while (entry.c < pool.maxCount && entry.n > 0 && now >= entry.n) {
            entry.c++;
            entry.n = entry.c < pool.maxCount ? entry.n + pool.rechargeSeconds : 0;
        }
        if (entry.c >= pool.maxCount) { entry.c = pool.maxCount; entry.n = 0; }
    }
}
function syncSmk(
    state: {
        c: number;
        n: number;
    },
    now: number
): void {
    const max = ACTIVE_GADGET_CONFIG.medicSmoke.maxCount;
    if (
        state.c < max
        && state.n > 0
        && now >= state.n
    ) {
        state.c = max;
        state.n = 0;
    }
    if (state.c >= max) {
        state.c = max;
        state.n = 0;
    }
}
function isCls(eventPlayer: mod.Player, soldierClass: mod.SoldierClass): boolean {
    if (!isValidPlayer(eventPlayer)) return false;
    try {
        return mod.IsSoldierClass(eventPlayer, soldierClass);
    } catch {
        return false;
    }
}
function fmtClock(secondsRemaining: number): mod.Message {
    if (secondsRemaining <= 0) {
        return msg(STR_UI_READY);
    }
    const whole = Math.max(0, Math.ceil(secondsRemaining));
    const minutes = Math.floor(whole / 60);
    const seconds = whole % 60;
    const secondTens = Math.floor(seconds / 10);
    const secondOnes = seconds % 10;
    return msg(
        mod.stringkeys.twl.countdown.clockFormat,
        minutes,
        secondTens,
        secondOnes
    );
}
function mkBrd(
    name: string,
    position: mod.Vector,
    size: mod.Vector,
    root: mod.UIWidget,
    eventPlayer: mod.Player
): mod.UIWidget | undefined {
    mod.AddUIContainer(
        name,
        position,
        size,
        mod.UIAnchor.Center,
        root,
        false,
        0,
        READY_DIALOG_BORDER_COLOR,
        1,
        mod.UIBgFill.Solid,
        mod.UIDepth.AboveGameUI,
        eventPlayer
    );
    return safeFind(name);
}
function addGImg(
    name: string,
    rootX: number,
    rootY: number,
    size: number,
    gadget: number,
    root: mod.UIWidget | undefined,
    eventPlayer: mod.Player
): mod.UIWidget | undefined {
    if (!root) return undefined;
    let widget = safeFind(name);
    if (!widget) {
        try {
            mod.AddUIGadgetImage(
                name,
                mod.CreateVector(rootX, rootY, 0),
                mod.CreateVector(size, size, 0),
                mod.UIAnchor.Center,
                gadget,
                root,
                eventPlayer
            );
        } catch {
            return undefined;
        }
        widget = safeFind(name);
    }
    if (!widget) return undefined;
    safeSetUIWidgetParent(widget, root);
    try {
        mod.SetUIWidgetAnchor(widget, mod.UIAnchor.Center);
    } catch {}
    safeSetUIWidgetPosition(widget, mod.CreateVector(rootX, rootY, 0));
    safeSetUIWidgetSize(widget, mod.CreateVector(size, size, 0));
    safeSetUIWidgetDepth(widget, mod.UIDepth.AboveGameUI);
    safeSetUIWidgetVisible(widget, false);
    return widget;
}
function buildTileContentRoot(
    name: string,
    posX: number,
    posY: number,
    root: mod.UIWidget,
    eventPlayer: mod.Player
): mod.UIWidget | undefined {
    mod.AddUIContainer(
        name,
        mod.CreateVector(posX, posY, 0),
        mod.CreateVector(AMMO_RESUPPLY_TILE_SIZE, AMMO_RESUPPLY_TILE_SIZE, 0),
        mod.UIAnchor.Center,
        root,
        true,
        0,
        VEC_ZERO,
        0,
        mod.UIBgFill.None,
        mod.UIDepth.AboveGameUI,
        eventPlayer
    );
    return safeFind(name);
}
const EH = [0] as const;
const TH = {
    [STR_UI_SMOKE_SCREEN]: [STR_UI_LINE_SMOKE, STR_UI_LINE_ARTILLERY, STR_UI_LINE_CALL_IN],
    [STR_UI_ARTILLERY_STRIKE]: [STR_UI_LINE_ARTILLERY, STR_UI_LINE_CALL_IN],
    [STR_UI_SPAWN_BEACON]: [STR_UI_LINE_SPAWN, STR_UI_LINE_BEACON],
    [STR_UI_ASSAULT_LADDER]: [STR_UI_LINE_ASSAULT, STR_UI_LINE_LADDER],
    [STR_UI_ANTI_VEHICLE_GRENADE]: [STR_UI_LINE_ANTI_VEHICLE, STR_UI_LINE_GRENADE],
    [STR_UI_LAUNCHER_AMMO]: [STR_UI_LINE_LAUNCHER, STR_UI_LINE_AMMO],
    [STR_UI_GRENADE_INTERCEPT]: [STR_UI_LINE_GRENADE, STR_UI_LINE_INTERCEPT],
    [STR_UI_MISSILE_INTERCEPT]: [STR_UI_LINE_MISSILE, STR_UI_LINE_INTERCEPT],
    [STR_UI_C4]: [STR_UI_C4],
    [STR_UI_DRONE]: [STR_UI_DRONE],
    [STR_UI_RPG]: [STR_UI_RPG],
    [STR_UI_AT4]: [STR_UI_AT4],
    [STR_UI_STINGER]: [STR_UI_STINGER],
} as const;
function getTileHeaderLineKeys(labelKey: number): number[] {
    return (TH[labelKey as keyof typeof TH] as unknown as number[]) ?? (EH as unknown as number[]);
}
function buildTileHeaderWidgets(
    cacheEntry: AmmoResupplyMenuChargeCacheEntry | AmmoResupplyMenuActionRowCacheEntry,
    namePrefix: string,
    pid: number,
    parent: mod.UIWidget,
    eventPlayer: mod.Player,
    labelKey: number
): void {
    const lines = getTileHeaderLineKeys(labelKey);
    const ws: (mod.UIWidget | undefined)[] = [];
    for (let i = 0; i < 3; i++) {
        ws[i] = addReadyDialogText(
            ammoResupplyMenuName(`${namePrefix}Label${i + 1}`, pid),
            0,
            TILE_LABEL_TOP_Y + (TILE_LABEL_LINE_STEP * i),
            AMMO_RESUPPLY_TILE_LABEL_WIDTH,
            TILE_LABEL_LINE_HEIGHT,
            mod.UIAnchor.TopCenter,
            mod.UIAnchor.TopCenter,
            lines[i] ?? msg(STR_UI_READY),
            eventPlayer,
            parent,
            TILE_LABEL_SIZE,
            false,
            COLOR_WHITE
        );
    }
    [cacheEntry.l1, cacheEntry.l2, cacheEntry.l3] = ws;
}
function setTileHeaderWidgets(
    cacheEntry: AmmoResupplyMenuChargeCacheEntry | AmmoResupplyMenuActionRowCacheEntry,
    labelKey: number,
    color: mod.Vector
): void {
    const lines = getTileHeaderLineKeys(labelKey);
    const ws = [cacheEntry.l1, cacheEntry.l2, cacheEntry.l3];
    for (let i = 0; i < 3; i++) {
        if (lines[i]) {
            safeSetUITextColor(ws[i], color);
            safeSetUIWidgetVisible(ws[i], true);
            continue;
        }
        safeSetUIWidgetVisible(ws[i], false);
    }
}
function buildTile(
    cacheEntry: AmmoResupplyMenuChargeCacheEntry,
    namePrefix: string,
    pid: number,
    posX: number,
    posY: number,
    labelKey: number,
    scopeLabel: mod.Message,
    displayGadget: number,
    staticSeconds: number,
    defaultCount: number,
    root: mod.UIWidget,
    eventPlayer: mod.Player,
    iconSize: number = IS,
    iconYOffset: number = IY
): void {
    const buttonId = ammoResupplyMenuName(`${namePrefix}Button`, pid);
    cacheEntry.bb = addOutlinedButton(
        buttonId,
        posX,
        posY,
        AMMO_RESUPPLY_TILE_SIZE,
        AMMO_RESUPPLY_TILE_SIZE,
        mod.UIAnchor.Center,
        root,
        eventPlayer,
        1
    );
    cacheEntry.button = safeFind(buttonId);
    if (cacheEntry.button) {
        mod.EnableUIButtonEvent(cacheEntry.button, mod.UIButtonEvent.FocusIn, true);
        mod.EnableUIButtonEvent(cacheEntry.button, mod.UIButtonEvent.FocusOut, true);
    }
    const parent = buildTileContentRoot(
        ammoResupplyMenuName(`${namePrefix}Content`, pid),
        posX,
        posY,
        root,
        eventPlayer
    ) ?? root;
    cacheEntry.i = addGImg(
        ammoResupplyMenuName(`${namePrefix}Icon`, pid),
        posX,
        posY + iconYOffset,
        iconSize,
        displayGadget,
        root,
        eventPlayer
    );
    buildTileHeaderWidgets(cacheEntry, namePrefix, pid, parent, eventPlayer, labelKey);
    cacheEntry.s = addReadyDialogText(
        ammoResupplyMenuName(`${namePrefix}Scope`, pid),
        0,
        SPY,
        AMMO_RESUPPLY_TILE_LABEL_WIDTH,
        18,
        mod.UIAnchor.Center,
        mod.UIAnchor.Center,
        scopeLabel,
        eventPlayer,
        parent,
        TILE_SCOPE_SIZE,
        false,
        COLOR_GRAY
    );
    cacheEntry.cd = addReadyDialogText(
        ammoResupplyMenuName(`${namePrefix}Cooldown`, pid),
        0,
        TY,
        AMMO_RESUPPLY_TILE_TIMER_WIDTH,
        24,
        mod.UIAnchor.Center,
        mod.UIAnchor.Center,
        msg(STR_UI_READY),
        eventPlayer,
        parent,
        TILE_TIMER_SIZE,
        false,
        COLOR_READY_GREEN
    );
    cacheEntry.r = addReadyDialogText(
        ammoResupplyMenuName(`${namePrefix}Ref`, pid),
        TILE_REF_X,
        TILE_REF_Y,
        TILE_REF_WIDTH,
        18,
        mod.UIAnchor.Center,
        mod.UIAnchor.CenterRight,
        armDur(staticSeconds),
        eventPlayer,
        parent,
        TILE_REF_SIZE,
        false,
        COLOR_GRAY
    );
    cacheEntry.cs = addReadyDialogText(
        ammoResupplyMenuName(`${namePrefix}CountShadow`, pid),
        CX + 2,
        CY + 3,
        CB,
        CB,
        mod.UIAnchor.Center,
        mod.UIAnchor.Center,
        msg(STR_SYS_COUNTER, defaultCount),
        eventPlayer,
        parent,
        CSZ,
        false,
        COLOR_DARK_BLACK
    );
    cacheEntry.ct = addReadyDialogText(
        ammoResupplyMenuName(`${namePrefix}Count`, pid),
        CX,
        CY,
        CB,
        CB,
        mod.UIAnchor.Center,
        mod.UIAnchor.Center,
        msg(STR_SYS_COUNTER, defaultCount),
        eventPlayer,
        parent,
        CSZ,
        false,
        COLOR_WHITE
    );
    safeSetUIWidgetDepth(cacheEntry.cs, mod.UIDepth.AboveGameUI);
    safeSetUIWidgetDepth(cacheEntry.ct, mod.UIDepth.AboveGameUI);
    if (cacheEntry.i) {
        mod.SetUIImageColor(cacheEntry.i, COLOR_NOT_READY_RED);
    }
}
function armCacheOk(cache: AmmoResupplyMenuCacheEntry | undefined): boolean {
    if (!cache?.root) return false;
    if (!cache.helpText) return false;
    if (!cache.closeButton || !cache.closeButtonText) return false;
    if (!cache.ag || !cache.ah || !cache.at || !cache.mg || !cache.mh || !cache.mt || !cache.eg || !cache.eh || !cache.et || !cache.rg || !cache.rh || !cache.rt) return false;
    const cfg = ACTIVE_GADGET_CONFIG;
    if (!cache.a || cache.a.length !== cfg.assault.length) return false;
    for (let i = 0; i < cache.a.length; i++) {
        if (!cache.a[i]?.button || !cache.a[i]?.l1 || !cache.a[i]?.s || !cache.a[i]?.cd || !cache.a[i]?.r) return false;
    }
    if (!cache.m?.button || !cache.m.l1 || !cache.m.s || !cache.m.cd || !cache.m.r) return false;
    if (!cache.x || cache.x.length !== cfg.medicItems.length) return false;
    for (let i = 0; i < cache.x.length; i++) {
        if (!cache.x[i]?.button || !cache.x[i]?.l1 || !cache.x[i]?.s || !cache.x[i]?.cd || !cache.x[i]?.r) return false;
    }
    if (!cache.e?.button || !cache.e.l1 || !cache.e.s || !cache.e.cd || !cache.e.r) return false;
    if (!cache.q || cache.q.length !== cfg.recon.length) return false;
    for (let i = 0; i < cache.q.length; i++) {
        if (!cache.q[i]?.button || !cache.q[i]?.l1 || !cache.q[i]?.s || !cache.q[i]?.cd || !cache.q[i]?.r) return false;
    }
    if (!cache.rows || cache.rows.length !== cfg.launchers.length) return false;
    for (let i = 0; i < cache.rows.length; i++) {
        if (!cache.rows[i]?.button || !cache.rows[i]?.l1 || !cache.rows[i]?.s || !cache.rows[i]?.cd || !cache.rows[i]?.r || !cache.rows[i]?.cs || !cache.rows[i]?.ct) return false;
    }
    return true;
}
function showArmMenu(cache: AmmoResupplyMenuCacheEntry | undefined, visible: boolean): void {
    if (!cache?.root) return;
    safeSetUIWidgetVisible(cache.root, visible);
    for (let i = 0; i < cache.a.length; i++) safeSetUIWidgetVisible(cache.a[i]?.i, visible);
    for (let i = 0; i < cache.rows.length; i++) safeSetUIWidgetVisible(cache.rows[i]?.i, visible);
    for (let i = 0; i < cache.x.length; i++) safeSetUIWidgetVisible(cache.x[i]?.i, visible);
    for (let i = 0; i < cache.q.length; i++) safeSetUIWidgetVisible(cache.q[i]?.i, visible);
    safeSetUIWidgetVisible(cache.m?.i, visible);
    safeSetUIWidgetVisible(cache.e?.i, visible);
}
function armInitVisible(cache: AmmoResupplyMenuCacheEntry): void {
    const widgets: Array<mod.UIWidget | undefined> = [
        cache.borderTop, cache.borderBottom, cache.borderLeft, cache.borderRight, cache.title,
        cache.helpText,
        cache.ag, cache.ah, cache.mg, cache.mh, cache.eg, cache.eh, cache.rg, cache.rh,
        cache.closeButtonBorder, cache.closeButton, cache.closeButtonText,
    ];
    if (cache.h) {
        for (let i = 0; i < cache.h.length; i++) widgets.push(cache.h[i]);
    }
    if (cache.st) {
        for (let i = 0; i < cache.st.length; i++) {
            const row = cache.st[i];
            if (!row) continue;
            widgets.push(row.prev, row.prevLabel, row.label, row.next, row.nextLabel);
        }
    }
    const tileLists: Array<Array<AmmoResupplyMenuChargeCacheEntry | AmmoResupplyMenuActionRowCacheEntry>> = [
        cache.a, cache.rows, cache.x, cache.q,
    ];
    for (let i = 0; i < tileLists.length; i++) {
        const list = tileLists[i];
        for (let j = 0; j < list.length; j++) {
            const entry = list[j];
            widgets.push(entry.bb, entry.button, entry.l1, entry.l2, entry.l3, entry.s, entry.cd, entry.r, entry.cs, entry.ct);
        }
    }
    widgets.push(cache.m.bb, cache.m.button, cache.m.l1, cache.m.l2, cache.m.l3, cache.m.s, cache.m.cd, cache.m.r, cache.m.cs, cache.m.ct);
    widgets.push(cache.e.bb, cache.e.button, cache.e.l1, cache.e.l2, cache.e.l3, cache.e.s, cache.e.cd, cache.e.r, cache.e.cs, cache.e.ct);
    for (let i = 0; i < widgets.length; i++) safeSetUIWidgetVisible(widgets[i], true);
    for (let i = 0; i < cache.a.length; i++) safeSetUIWidgetVisible(cache.a[i]?.i, false);
    for (let i = 0; i < cache.rows.length; i++) safeSetUIWidgetVisible(cache.rows[i]?.i, false);
    for (let i = 0; i < cache.x.length; i++) safeSetUIWidgetVisible(cache.x[i]?.i, false);
    for (let i = 0; i < cache.q.length; i++) safeSetUIWidgetVisible(cache.q[i]?.i, false);
    safeSetUIWidgetVisible(cache.m?.i, false);
    safeSetUIWidgetVisible(cache.e?.i, false);
    safeSetUIWidgetVisible(cache.at, false);
    safeSetUIWidgetVisible(cache.mt, false);
    safeSetUIWidgetVisible(cache.et, false);
    safeSetUIWidgetVisible(cache.rt, false);
}
// When focused=true and enabled=false, paints the border with a distinct color so console
// players see where their cursor is on a tile that won't accept a click. The button itself
// also lifts from COLOR_GRAY_DARK to COLOR_GRAY for additional contrast.
function setActVis(
    row: AmmoResupplyMenuActionRowCacheEntry,
    enabled: boolean,
    focused: boolean = false
): void {
    const disabledFocused = !enabled && focused;
    safeSetUIWidgetBgColor(row.button, enabled ? COLOR_BUTTON_BASE : disabledFocused ? COLOR_GRAY : COLOR_GRAY_DARK);
    safeSetUIWidgetBgAlpha(row.button, enabled ? BUTTON_OPACITY_BASE : DIS_A);
    safeSetUIWidgetBgColor(row.bb, disabledFocused ? COLOR_BUTTON_BORDER_DISABLED_FOCUSED : enabled ? COLOR_BUTTON_BORDER : COLOR_GRAY_DARK);
    safeSetUIWidgetBgAlpha(row.bb, disabledFocused ? BUTTON_BORDER_OPACITY : enabled ? BUTTON_BORDER_OPACITY : DIS_A);
    if (row.button) mod.SetUIButtonEnabled(row.button, enabled);
}
function setTileVis(
    charge: AmmoResupplyMenuChargeCacheEntry,
    enabled: boolean,
    focused: boolean = false
): void {
    const disabledFocused = !enabled && focused;
    safeSetUIWidgetBgColor(charge.button, enabled ? COLOR_BUTTON_BASE : disabledFocused ? COLOR_GRAY : COLOR_GRAY_DARK);
    safeSetUIWidgetBgAlpha(charge.button, enabled ? BUTTON_OPACITY_BASE : DIS_A);
    safeSetUIWidgetBgColor(charge.bb, disabledFocused ? COLOR_BUTTON_BORDER_DISABLED_FOCUSED : enabled ? COLOR_BUTTON_BORDER : COLOR_GRAY_DARK);
    safeSetUIWidgetBgAlpha(charge.bb, disabledFocused ? BUTTON_BORDER_OPACITY : enabled ? BUTTON_BORDER_OPACITY : DIS_A);
    if (charge.button) mod.SetUIButtonEnabled(charge.button, enabled);
}
function refreshOpenArm(teamId: TeamID | 0 = 0, force: boolean = false): void {
    for (const pidKey in State.players.armO) {
        if (State.players.armO[Number(pidKey)] !== true) continue;
        const pid = Number(pidKey);
        const player = safeFindPlayer(pid);
        if (!isValidPlayer(player)) continue;
        if (teamId !== 0 && safeGetTeamNumberFromPlayer(player, 0) !== teamId) continue;
        if (!force) {
            updateArmMenu(player);
            continue;
        }
        const objId = getArmObj(pid);
        const cache = State.hudCache.ammoResupplyMenuCache[pid];
        if (objId === undefined || !cache) continue;
        refreshArmMenu(player, objId, cache, true);
    }
}
// Every launcher enum value -- used for detection + sweep so class-loadout launcher variants
// (e.g. Launcher_High_Explosive labelled "RPG" in-game) don't slip past and produce a 2-launcher
// state. A v1.293 post-mortem showed that sweeping only ACTIVE_GADGET_CONFIG.launchers missed
// class launchers whose enum value didn't match any of our 3 tiles.
const ALL_LAUNCHER_VARIANTS: number[] = [
    mod.Gadgets.Launcher_Aim_Guided,
    mod.Gadgets.Launcher_Air_Defense,
    mod.Gadgets.Launcher_Auto_Guided,
    mod.Gadgets.Launcher_Breaching_Projectile,
    mod.Gadgets.Launcher_High_Explosive,
    mod.Gadgets.Launcher_Incendiary_Airburst,
    mod.Gadgets.Launcher_Long_Range,
    mod.Gadgets.Launcher_Smoke_Grenade,
    mod.Gadgets.Launcher_Thermobaric_Grenade,
    mod.Gadgets.Launcher_Unguided_Rocket,
];
// Per-player authoritative locker slot state -- seeded by a one-time probe on menu open,
// then updated on every grant/replace we ourselves service. Replaces the per-click
// buildLockerSnapshot that flip-flopped across launcher variants. See the plan file
// sleepy-juggling-thunder for the full rationale.
// Cheap emptiness precheck: a slot reads 0/0 ammo and is not active. Calling RemoveEquipment
// on a genuinely empty slot is the most common trigger for the engine "RemoveEquipment" warning
// (#85 class). Used by every slot-based give* helper to skip the destructive call when the slot
// is already empty.
function isSlotEmpty(player: mod.Player, slot: mod.InventorySlots): boolean {
    let loaded = 0, mag = 0, active = false;
    try { loaded = mod.GetInventoryAmmo(player, slot); } catch {}
    try { mag = mod.GetInventoryMagazineAmmo(player, slot); } catch {}
    try { active = mod.IsInventorySlotActive(player, slot); } catch {}
    return loaded <= 0 && mag <= 0 && !active;
}
function probeSlot(player: mod.Player, slot: mod.InventorySlots): { kind: "unknown" | "empty" | "launcher" | "gadget"; source: "probed" } {
    // Engineer-class probe: ammo-based slot detection. Used ONLY for Engineer (the only class
    // that places launcher + supply-crate / AV-mine / EOD-bot in GadgetOne/Two with variable
    // ammo state requiring the destructive probe path in probeLauncherSlot). For Assault /
    // Medic / Recon, use the per-class HasEquipment-based probes below (probeAssaultSlot,
    // probeMedicSlot, probeReconSlot) routed via probeSlotForClass(). Fixes CQ_Bug_94 by
    // skipping ammo-based detection for the 3 classes whose slots usually empty -> 4 engine
    // error logs per supply-box open.
    //
    // Never infer "launcher" from ammo here -- a Supply Crate with 1 charge has loaded===1 and
    // would be falsely labelled as launcher, which then fooled slotWithLauncher/launcherSlotKnown
    // (v1.311 playtest: box+EOD loadout, no launcher, toggle slot 2, launcher still landed in
    // slot 1; Launcher Ammo tile was also incorrectly enabled). probeLauncherSlot's HasEquipment
    // diff is the sole authority for the "launcher" kind.
    let loaded = 0, mag = 0, active = false;
    try { loaded = mod.GetInventoryAmmo(player, slot); } catch {}
    try { mag = mod.GetInventoryMagazineAmmo(player, slot); } catch {}
    try { active = mod.IsInventorySlotActive(player, slot); } catch {}
    const populated = loaded > 0 || mag > 0;
    if (populated) return { kind: "gadget", source: "probed" };
    if (active) return { kind: "unknown", source: "probed" };
    return { kind: "empty", source: "probed" };
}

// CQ_Bug_94 fix: HasEquipment-based slot probe scoped to Assault's GadgetOne/Two candidates.
// HasEquipment does not emit the engine error log on miss (unlike GetInventoryAmmo /
// GetInventoryMagazineAmmo which fire "invalid player or inventory item" on every empty-slot
// read). Iteration source is ACTIVE_GADGET_CONFIG.assault filtered by slot, so map overrides
// via applyMapGadgetLockerConfig propagate automatically.
function probeAssaultSlot(player: mod.Player, slot: mod.InventorySlots): { kind: "unknown" | "empty" | "gadget"; gadget?: number; source: "probed" } {
    let active = false;
    try { active = mod.IsInventorySlotActive(player, slot); } catch {}
    const cfg = ACTIVE_GADGET_CONFIG;
    for (let i = 0; i < cfg.assault.length; i++) {
        const item = cfg.assault[i];
        if (item.slot !== slot) continue;
        let owned = false;
        try { owned = mod.HasEquipment(player, item.gadget); } catch {}
        if (owned) return { kind: "gadget", gadget: item.gadget, source: "probed" };
    }
    if (active) return { kind: "unknown", source: "probed" };
    return { kind: "empty", source: "probed" };
}

// Medic per-class probe. Iteration source is ACTIVE_GADGET_CONFIG.medicItems filtered by slot
// (smoke is on Callins, not GadgetOne/Two, so it's correctly skipped here -- tileOwned for
// smoke falls through to its HasEquipment branch).
function probeMedicSlot(player: mod.Player, slot: mod.InventorySlots): { kind: "unknown" | "empty" | "gadget"; gadget?: number; source: "probed" } {
    let active = false;
    try { active = mod.IsInventorySlotActive(player, slot); } catch {}
    const cfg = ACTIVE_GADGET_CONFIG;
    for (let i = 0; i < cfg.medicItems.length; i++) {
        const item = cfg.medicItems[i];
        if (item.slot !== slot) continue;
        let owned = false;
        try { owned = mod.HasEquipment(player, item.gadget); } catch {}
        if (owned) return { kind: "gadget", gadget: item.gadget, source: "probed" };
    }
    if (active) return { kind: "unknown", source: "probed" };
    return { kind: "empty", source: "probed" };
}

// Recon per-class probe. Iteration source is ACTIVE_GADGET_CONFIG.recon filtered by slot
// (AV grenade is on Throwable, not GadgetOne/Two, so it's correctly skipped here -- tileOwned
// for the AV grenade falls through to its HasEquipment branch).
function probeReconSlot(player: mod.Player, slot: mod.InventorySlots): { kind: "unknown" | "empty" | "gadget"; gadget?: number; source: "probed" } {
    let active = false;
    try { active = mod.IsInventorySlotActive(player, slot); } catch {}
    const cfg = ACTIVE_GADGET_CONFIG;
    for (let i = 0; i < cfg.recon.length; i++) {
        const item = cfg.recon[i];
        if (item.slot !== slot) continue;
        let owned = false;
        try { owned = mod.HasEquipment(player, item.gadget); } catch {}
        if (owned) return { kind: "gadget", gadget: item.gadget, source: "probed" };
    }
    if (active) return { kind: "unknown", source: "probed" };
    return { kind: "empty", source: "probed" };
}

// Routes a slot probe to the per-class probe function. Engineer keeps the original ammo-based
// probeSlot (variable launcher ammo state requires the destructive probe path). Non-Engineer
// classes use the HasEquipment-based per-class probes which never trigger the engine error log.
// Unknown class (no class assigned yet, edge case) returns a safe "empty" default.
function probeSlotForClass(player: mod.Player, slot: mod.InventorySlots): { kind: "unknown" | "empty" | "launcher" | "gadget"; gadget?: number; source: "probed" } {
    if (isCls(player, mod.SoldierClass.Engineer)) return probeSlot(player, slot);
    if (isCls(player, mod.SoldierClass.Assault)) return probeAssaultSlot(player, slot);
    if (isCls(player, mod.SoldierClass.Support)) return probeMedicSlot(player, slot);
    if (isCls(player, mod.SoldierClass.Recon)) return probeReconSlot(player, slot);
    return { kind: "empty", source: "probed" };
}
// The only gadgets an engineer can hold in GadgetOne/GadgetTwo: Supply Crate, AV Mine,
// Launcher (any variant), or EOD Bot. Launcher variants are enumerated so the HasEquipment
// diff can restore the exact variant; AV Mine has three variants (standard + Acoustic +
// Tripwire) so all three are included. Supply Crate is actually Deployable_Vehicle_Supply_Crate
// at runtime (v1.310 playtest: Class_Supply_Bag alone missed it -> slot 1 crate removed and
// never restored). Class_Supply_Bag is kept as a belt-and-braces entry for class variants.
// Any gadget we miss that lived in slot 1 would be invisible to the probe and lost on restore.
const ENGINEER_GADGET_CANDIDATES: number[] = [
    ...ALL_LAUNCHER_VARIANTS,
    mod.Gadgets.Misc_Anti_Vehicle_Mine,
    mod.Gadgets.Misc_Acoustic_Sensor_AV_Mine,
    mod.Gadgets.Misc_Tripwire_Sensor_AV_Mine,
    mod.Gadgets.Deployable_EOD_Bot,
    mod.Gadgets.Deployable_Vehicle_Supply_Crate,
    mod.Gadgets.Class_Supply_Bag,
];
// Identifies which gadget slot holds the player's launcher. Two-stage probe:
//   1. Cheap-positive: a slot with ammo > 0 OR active wield is populated; skip writes there.
//   2. +1-ammo disambiguation: for any slot reading 0/0/inactive, write +1 ammo and re-read.
//      An empty slot's write silently no-ops (no item to write to) so it stays at 0. A slot
//      holding a 0-ammo launcher accepts the +1 -> reads as 1. This non-destructive test
//      replaces the v1.344 fall-through-to-destructive-probe path for the cold-spawn case.
//   3. Destructive RemoveEquipment + HasEquipment-diff fallback fires only when BOTH slots
//      are populated (one has the launcher, one has a non-launcher gadget). Restores the
//      removed gadget via AddEquipment + ammo snapshot.
// Always restores both slots' original ammo + active wield slot before returning.
// Shortcut: no launcher owned means no probe runs and the toggle drives the next placement.
function probeLauncherSlot(player: mod.Player): {
    slot: mod.InventorySlots | undefined;
    gadget: number | undefined;
} {
    if (!isValidPlayer(player)) return { slot: undefined, gadget: undefined };
    if (!isCls(player, mod.SoldierClass.Engineer)) return { slot: undefined, gadget: undefined };
    if (safeGetSoldierStateBool(player, mod.SoldierStateBool.IsInVehicle, false)) return { slot: undefined, gadget: undefined };
    let ownedLauncher: number | undefined = undefined;
    for (let i = 0; i < ALL_LAUNCHER_VARIANTS.length; i++) {
        const L = ALL_LAUNCHER_VARIANTS[i];
        let owned = false;
        try { owned = mod.HasEquipment(player, L); } catch {}
        if (owned) { ownedLauncher = L; break; }
    }
    if (ownedLauncher === undefined) return { slot: undefined, gadget: undefined };
    // Snapshot which slot the player is wielding so we can ForceSwitchInventory back after the
    // destructive probe. Removing GadgetOne while it's the active slot auto-switches the player;
    // the previous "skip if either gadget wielded" bail avoided that animation glitch but left
    // locker state without kind="launcher", breaking swap-in-place (#90) and ammo lookup (#78).
    let activeSlotToRestore: mod.InventorySlots | undefined = undefined;
    let g1Active = false, g2Active = false;
    try { g1Active = mod.IsInventorySlotActive(player, mod.InventorySlots.GadgetOne); } catch {}
    try { g2Active = mod.IsInventorySlotActive(player, mod.InventorySlots.GadgetTwo); } catch {}
    if (g1Active) activeSlotToRestore = mod.InventorySlots.GadgetOne;
    else if (g2Active) activeSlotToRestore = mod.InventorySlots.GadgetTwo;
    // Snapshot ammo on both slots up front so every branch can restore to original.
    let slot1Loaded = 0, slot1Mag = 0;
    let slot2Loaded = 0, slot2Mag = 0;
    try { slot1Loaded = mod.GetInventoryAmmo(player, mod.InventorySlots.GadgetOne); } catch {}
    try { slot1Mag = mod.GetInventoryMagazineAmmo(player, mod.InventorySlots.GadgetOne); } catch {}
    try { slot2Loaded = mod.GetInventoryAmmo(player, mod.InventorySlots.GadgetTwo); } catch {}
    try { slot2Mag = mod.GetInventoryMagazineAmmo(player, mod.InventorySlots.GadgetTwo); } catch {}
    // Cached HasEquipment scan over the engineer candidate set. Used both as the destructive
    // probe's `before[]` baseline AND (implicitly via ownedLauncher above at line 911-918) as
    // the proof that some launcher exists. Hoisted to top so we pay the ~7-call cost once per
    // probe regardless of which branch runs.
    const before: { gadget: number; had: boolean }[] = [];
    for (let i = 0; i < ENGINEER_GADGET_CANDIDATES.length; i++) {
        const g = ENGINEER_GADGET_CANDIDATES[i];
        let had = false;
        try { had = mod.HasEquipment(player, g); } catch {}
        before.push({ gadget: g, had });
    }
    // Restore helper: write original loaded+mag back to a slot, and force-switch back to the
    // pre-probe wielded slot. Called at every exit branch (success or bail) to leave the
    // player in their pre-probe state. Note this also undoes any +1 write applied in step B3.
    const restoreOriginalState = () => {
        try { mod.SetInventoryAmmo(player, mod.InventorySlots.GadgetOne, slot1Loaded); } catch {}
        try { mod.SetInventoryMagazineAmmo(player, mod.InventorySlots.GadgetOne, slot1Mag); } catch {}
        try { mod.SetInventoryAmmo(player, mod.InventorySlots.GadgetTwo, slot2Loaded); } catch {}
        try { mod.SetInventoryMagazineAmmo(player, mod.InventorySlots.GadgetTwo, slot2Mag); } catch {}
        if (activeSlotToRestore !== undefined) {
            try { mod.ForceSwitchInventory(player, activeSlotToRestore); } catch {}
        }
    };
    // Step B2 — cheap-positive populated check (no writes): a slot with any ammo or active
    // wield state must hold a gadget. v1.344 short-circuit logic, generalized per-slot.
    let slot1Populated = slot1Loaded > 0 || slot1Mag > 0 || g1Active;
    let slot2Populated = slot2Loaded > 0 || slot2Mag > 0 || g2Active;
    // Step B3 — +1 ammo disambiguation for slots reading 0/0/inactive. A slot accepts a +1
    // write iff a gadget exists there; an empty slot's write is silently dropped (no item to
    // write to) and the read-back stays at 0. We test both ambiguous slots and decide
    // populated state from the read-back. This is the non-destructive disambiguator that
    // replaces the v1.344 fall-through-to-probe path for the cold-spawn 0-ammo launcher case.
    if (!slot1Populated) {
        try { mod.SetInventoryAmmo(player, mod.InventorySlots.GadgetOne, slot1Loaded + 1); } catch {}
        let slot1After = 0;
        try { slot1After = mod.GetInventoryAmmo(player, mod.InventorySlots.GadgetOne); } catch {}
        slot1Populated = slot1After > slot1Loaded;
    }
    if (!slot2Populated) {
        try { mod.SetInventoryAmmo(player, mod.InventorySlots.GadgetTwo, slot2Loaded + 1); } catch {}
        let slot2After = 0;
        try { slot2After = mod.GetInventoryAmmo(player, mod.InventorySlots.GadgetTwo); } catch {}
        slot2Populated = slot2After > slot2Loaded;
    }
    // Step C — branch on the four populated combinations. Three of four avoid the destructive
    // probe entirely; only both-populated requires it (we know exactly one slot has the
    // launcher and one has a non-launcher gadget; need the diff to identify which is which).
    if (slot1Populated && !slot2Populated) {
        // Only slot 1 has a gadget -> launcher is in slot 1.
        restoreOriginalState();
        return { slot: mod.InventorySlots.GadgetOne, gadget: ownedLauncher };
    }
    if (!slot1Populated && slot2Populated) {
        // Only slot 2 has a gadget -> launcher is in slot 2.
        restoreOriginalState();
        return { slot: mod.InventorySlots.GadgetTwo, gadget: ownedLauncher };
    }
    if (!slot1Populated && !slot2Populated) {
        // Player owns a launcher per HasEquipment but neither slot accepted +1. Contradiction;
        // bail with undefined so the caller falls back to the slot-toggle preference rather
        // than trust wrong authoritative state. Edge case — narrow class-loadout pickup race
        // window where HasEquipment lags slot state.
        restoreOriginalState();
        return { slot: undefined, gadget: undefined };
    }
    // Step D — both slots populated. Run the destructive probe to identify which slot held
    // the launcher (the +1 writes have already executed, but Step E restores original ammo).
    try { mod.RemoveEquipment(player, mod.InventorySlots.GadgetOne); } catch {
        restoreOriginalState();
        return { slot: undefined, gadget: undefined };
    }
    let removedFromSlot1: number | undefined = undefined;
    let multipleFlips = false;
    for (let i = 0; i < before.length; i++) {
        const b = before[i];
        if (!b.had) continue;
        let stillHas = true;
        try { stillHas = mod.HasEquipment(player, b.gadget); } catch {}
        if (!stillHas) {
            if (removedFromSlot1 !== undefined) { multipleFlips = true; break; }
            removedFromSlot1 = b.gadget;
        }
    }
    // API surprise: more than one gadget disappeared. Best-effort restore the launcher and
    // bail so downstream falls back to the heuristic rather than trust wrong authoritative
    // state.
    if (multipleFlips) {
        try { mod.AddEquipment(player, ownedLauncher, mod.InventorySlots.GadgetOne); } catch {}
        restoreOriginalState();
        return { slot: undefined, gadget: undefined };
    }
    // Restore the removed gadget to slot 1. If nothing flipped, slot 1 was empty post-+1 (we
    // shouldn't reach here in that case — Step C handled it — but be defensive). AddEquipment
    // seeds default ammo, so the Step E restore call below re-applies the pre-probe snapshot
    // to avoid silently topping the player off.
    if (removedFromSlot1 !== undefined) {
        try { mod.AddEquipment(player, removedFromSlot1, mod.InventorySlots.GadgetOne); } catch {}
    }
    // Step E — restore both slots to original ammo + active wield state.
    restoreOriginalState();
    // Launcher vanished from slot 1 -> launcher was in slot 1. Otherwise it must be in slot 2.
    const launcherSlot = removedFromSlot1 === ownedLauncher
        ? mod.InventorySlots.GadgetOne
        : mod.InventorySlots.GadgetTwo;
    return { slot: launcherSlot, gadget: ownedLauncher };
}
function initLockerSlotStateFromProbe(pid: number, player: mod.Player): void {
    // CQ_Bug_94 fix: route through the class dispatcher. Engineer keeps the original ammo-based
    // probeSlot; Assault/Medic/Recon use HasEquipment-based per-class probes that don't emit
    // the "invalid player or inventory item" engine error log on empty slots.
    const g1 = probeSlotForClass(player, mod.InventorySlots.GadgetOne);
    const g2 = probeSlotForClass(player, mod.InventorySlots.GadgetTwo);
    // Attach owned launchers to whichever slot has kind="launcher". HasEquipment misses some
    // class variants (that's the whole reason we're here), but any launcher it DOES see we
    // want annotated so click-dup-reject works for the common case.
    for (let i = 0; i < ALL_LAUNCHER_VARIANTS.length; i++) {
        const lg = ALL_LAUNCHER_VARIANTS[i];
        let owned = false;
        try { owned = mod.HasEquipment(player, lg); } catch {}
        if (!owned) continue;
        if (g1.kind === "launcher" && (g1 as any).gadget === undefined) { (g1 as any).gadget = lg; continue; }
        if (g2.kind === "launcher" && (g2 as any).gadget === undefined) { (g2 as any).gadget = lg; continue; }
    }
    // Attach owned non-launcher managed gadgets (C4, Drone, Beacon, Ladder, Intercepts) to
    // whichever gadget slot has kind="gadget" and no id yet. Best-effort -- used for tile
    // dup-dim on menu open before the user places anything.
    const cfg = ACTIVE_GADGET_CONFIG;
    const nonLauncherManaged: number[] = [];
    for (const a of cfg.assault) nonLauncherManaged.push(a.gadget);
    for (const m of cfg.medicItems) nonLauncherManaged.push(m.gadget);
    for (const r of cfg.recon) nonLauncherManaged.push(r.gadget);
    for (let i = 0; i < nonLauncherManaged.length; i++) {
        const g = nonLauncherManaged[i];
        let owned = false;
        try { owned = mod.HasEquipment(player, g); } catch {}
        if (!owned) continue;
        if (g1.kind === "gadget" && (g1 as any).gadget === undefined) { (g1 as any).gadget = g; continue; }
        if (g2.kind === "gadget" && (g2 as any).gadget === undefined) { (g2 as any).gadget = g; continue; }
    }
    State.players.lockerSlots[pid] = {
        g1: g1 as any,
        g2: g2 as any,
        initializedAt: mod.GetMatchTimeElapsed(),
    };
}
function slotWithLauncher(slotsState: any): mod.InventorySlots | undefined {
    if (!slotsState) return undefined;
    if (slotsState.g1.kind === "launcher") return mod.InventorySlots.GadgetOne;
    if (slotsState.g2.kind === "launcher") return mod.InventorySlots.GadgetTwo;
    return undefined;
}
// Returns the per-launcher ammo cap (loaded + magazine) for the gadget id, or undefined if
// no cap is configured. Used to dim the launcher ammo tile when the player is at max.
function launcherMaxAmmoFor(gadgetId: number | undefined): number | undefined {
    if (gadgetId === undefined) return undefined;
    const launchers = ACTIVE_GADGET_CONFIG.launchers;
    for (let i = 0; i < launchers.length; i++) {
        if (launchers[i].gadget === gadgetId) return launchers[i].maxAmmo;
    }
    return undefined;
}
function ownedByLockerState(slotsState: any, gadgetId: number): boolean {
    if (!slotsState) return false;
    if (slotsState.g1.gadget === gadgetId) return true;
    if (slotsState.g2.gadget === gadgetId) return true;
    return false;
}
// Owned check for a tile. Gadget-slot tiles consult state (authoritative post-probe).
// Callins / Throwable tiles fall back to HasEquipment since we don't model those slots.
function tileOwned(eventPlayer: mod.Player, slotsState: any, gadgetId: number, inventorySlot: mod.InventorySlots | undefined): boolean {
    if (inventorySlot === mod.InventorySlots.GadgetOne || inventorySlot === mod.InventorySlots.GadgetTwo) {
        return ownedByLockerState(slotsState, gadgetId);
    }
    try { return mod.HasEquipment(eventPlayer, gadgetId); } catch { return false; }
}
function recordPlacement(pid: number, slot: mod.InventorySlots, gadgetId: number, kind: "launcher" | "gadget"): void {
    const slotsState = State.players.lockerSlots[pid];
    if (!slotsState) return;
    const entry = slot === mod.InventorySlots.GadgetOne ? slotsState.g1 : slot === mod.InventorySlots.GadgetTwo ? slotsState.g2 : undefined;
    if (!entry) return;
    entry.kind = kind;
    entry.gadget = gadgetId;
    entry.source = "placed";
}
// Re-probes the sibling gadget slot after a placement so state reflects side effects of the
// gadget-id sweep (e.g. a class-loadout C4 in GadgetOne getting removed when we placed C4 in
// GadgetTwo). Only overwrites when we don't already know the sibling's id -- a known locker-
// placed gadget should not be downgraded to an anonymous probe reading.
function reprobeSiblingGadgetSlot(pid: number, placedSlot: mod.InventorySlots, player: mod.Player): void {
    if (placedSlot !== mod.InventorySlots.GadgetOne && placedSlot !== mod.InventorySlots.GadgetTwo) return;
    const slotsState = State.players.lockerSlots[pid];
    if (!slotsState) return;
    const placedIsG1 = placedSlot === mod.InventorySlots.GadgetOne;
    const siblingEntry = placedIsG1 ? slotsState.g2 : slotsState.g1;
    if (siblingEntry.gadget !== undefined) return;
    const siblingSlot = placedIsG1 ? mod.InventorySlots.GadgetTwo : mod.InventorySlots.GadgetOne;
    // CQ_Bug_94 fix: route through the class dispatcher (same reason as initLockerSlotStateFromProbe).
    // Sibling re-probe fires after every gadget placement on Assault/Medic/Recon paths too, so
    // it would also emit engine error log noise if it kept calling Engineer's probeSlot directly.
    const fresh = probeSlotForClass(player, siblingSlot);
    siblingEntry.kind = fresh.kind;
    siblingEntry.source = "probed";
    // If the per-class probe identified a specific gadget, attach it to the sibling entry. The
    // existing init-time non-launcher attachment loop only fires on initLockerSlotStateFromProbe;
    // we replicate that behavior here so sibling-re-probe results are equally annotated.
    if (fresh.gadget !== undefined && siblingEntry.gadget === undefined) {
        siblingEntry.gadget = fresh.gadget;
    }
}
// Returns the HDR_KEYS-order class index (0=Assault,1=Engineer,2=Medic,3=Recon) for the player,
// or undefined if the class isn't one of the four.
function getPlayerClassHdrIndex(player: mod.Player): number | undefined {
    if (!isValidPlayer(player)) return undefined;
    if (isCls(player, mod.SoldierClass.Assault)) return 0;
    if (isCls(player, mod.SoldierClass.Engineer)) return 1;
    if (isCls(player, mod.SoldierClass.Support)) return 2;
    if (isCls(player, mod.SoldierClass.Recon)) return 3;
    return undefined;
}
// Creates the per-player slot-toggle state if absent, defaulting every class to Gadget Slot 2.
function ensureSlotToggleState(pid: number): void {
    if (State.players.lockerSlotToggle[pid]) return;
    State.players.lockerSlotToggle[pid] = { slotByClass: [2, 2, 2, 2] };
}
// Returns the inventory slot that the player's class toggle currently points to. Defaults to
// GadgetTwo when state is missing or the class index is out of range.
function slotFromToggle(pid: number, classHdrIndex: number): mod.InventorySlots {
    const state = State.players.lockerSlotToggle[pid];
    if (!state || classHdrIndex < 0 || classHdrIndex > 3) return mod.InventorySlots.GadgetTwo;
    const choice = state.slotByClass[classHdrIndex];
    return choice === 1 ? mod.InventorySlots.GadgetOne : mod.InventorySlots.GadgetTwo;
}
// Grants a launcher. Reads the authoritative per-player slot state for dup-reject and target
// selection; updates state on success. Non-negotiable: any launcher tile click always targets
// whichever slot currently holds a launcher (per state). Only when no launcher exists in
// either slot do we fall back to GadgetTwo. Ammo is preserved across the swap.
function giveLauncher(eventPlayer: mod.Player, gadget: number, pid: number, fallbackSlot: mod.InventorySlots): boolean {
    if (!isValidPlayer(eventPlayer)) return false;
    const slotsState = State.players.lockerSlots[pid];
    if (!slotsState) return false;
    if (ownedByLockerState(slotsState, gadget)) return false; // dup -> silent reject
    const currentLauncherSlot = slotWithLauncher(slotsState);
    const targetSlot: mod.InventorySlots = currentLauncherSlot !== undefined
        ? currentLauncherSlot
        : fallbackSlot;
    // Preserve launcher-in-slot ammo across the swap -- rocket ammo is fungible from the
    // player's perspective for RPG/AT4/Stinger.
    let preserveLoaded = 1;
    let preserveMag = 0;
    try {
        const a = mod.GetInventoryAmmo(eventPlayer, targetSlot);
        if (a > 0) preserveLoaded = a;
    } catch {}
    try {
        const m = mod.GetInventoryMagazineAmmo(eventPlayer, targetSlot);
        if (m > 0) preserveMag = m;
    } catch {}
    // Clear the target slot via slot-based remove only. By-id RemoveEquipment is unreliable in
    // Portal (v1.306 bug: RemoveEquipment(player, launcherId) can take the wrong gadget -- e.g.
    // a Supply Crate in the sibling slot) so the previous launcher-id sweep is removed. The
    // probe at menu-open keeps `targetSlot` pointed at the real launcher slot, so this
    // slot-based remove clears the existing launcher without touching the sibling slot.
    if (!isSlotEmpty(eventPlayer, targetSlot)) {
        try { mod.RemoveEquipment(eventPlayer, targetSlot); } catch {}
    }
    try {
        mod.AddEquipment(eventPlayer, gadget, targetSlot);
    } catch {
        return false;
    }
    // Verify the give actually landed. If a different launcher is still equipped, the slot-based
    // RemoveEquipment above silently failed (Portal API can no-op without throwing) and the new
    // launcher ended up in the sibling slot, leaving us with two launchers (#90). Sweep stale
    // launchers by id and re-record state from a fresh probe so swap-in-place stays accurate.
    let verified = false;
    try { verified = mod.HasEquipment(eventPlayer, gadget); } catch {}
    if (!verified) return false;
    // Sweep stale launcher variants by id. The slot-based RemoveEquipment above may have
    // silently no-op'd, leaving a prior launcher in the sibling slot.
    for (let i = 0; i < ALL_LAUNCHER_VARIANTS.length; i++) {
        const L = ALL_LAUNCHER_VARIANTS[i];
        if (L === gadget) continue;
        let stillHas = false;
        try { stillHas = mod.HasEquipment(eventPlayer, L); } catch {}
        if (!stillHas) continue;
        try { mod.RemoveEquipment(eventPlayer, L); } catch {}
    }
    // Pre-write a sentinel ammo value on targetSlot so the probe's slot-1-empty short-circuit
    // does not mis-fire on a freshly added launcher whose magazine read may be 0. The real
    // preserveLoaded value overwrites this after the probe identifies the authoritative slot.
    try { mod.SetInventoryAmmo(eventPlayer, targetSlot, 1); } catch {}
    // Re-probe to learn the authoritative slot the launcher actually landed in. The sweep
    // above (or the original RemoveEquipment no-op) can leave the launcher in the sibling
    // slot; we must SetInventoryAmmo on the slot that actually holds the launcher, not the
    // slot we asked AddEquipment to use.
    let actualSlot: mod.InventorySlots = targetSlot;
    const fresh = probeLauncherSlot(eventPlayer);
    if (fresh.slot !== undefined) {
        actualSlot = fresh.slot;
    }
    try { mod.SetInventoryAmmo(eventPlayer, actualSlot, preserveLoaded); } catch {}
    try { mod.SetInventoryMagazineAmmo(eventPlayer, actualSlot, preserveMag); } catch {}
    recordPlacement(pid, actualSlot, gadget, "launcher");
    // Downgrade the sibling slot if state still flags it as a launcher -- the swap-source slot
    // may now be empty after the sweep.
    const slotsAfter = State.players.lockerSlots[pid];
    if (slotsAfter) {
        const sibling = actualSlot === mod.InventorySlots.GadgetOne ? slotsAfter.g2 : slotsAfter.g1;
        if (sibling.kind === "launcher") {
            sibling.kind = sibling.gadget ? "gadget" : "unknown";
            sibling.source = "probed";
        }
    }
    return true;
}
function giveMedicSmoke(eventPlayer: mod.Player): boolean {
    if (!isValidPlayer(eventPlayer)) return false;
    const smokeGadget = ACTIVE_GADGET_CONFIG.medicSmoke.gadget;
    let hasSmoke = false;
    try {
        hasSmoke = mod.HasEquipment(eventPlayer, smokeGadget);
    } catch {}
    if (hasSmoke) return false;
    // CQ_Bug_94 follow-up (v1.448): dropped the isSlotEmpty + slot-targeted RemoveEquipment
    // precheck. isSlotEmpty calls GetInventoryAmmo/GetInventoryMagazineAmmo which fire the
    // engine "invalid item" log on empty slots. AddEquipment cleanly clobbers if Callins holds
    // a different callin gadget; users own slot choice. Dup-prevention for THIS gadget is
    // handled by the HasEquipment check above (line 1352).
    try {
        mod.AddEquipment(eventPlayer, smokeGadget, mod.InventorySlots.Callins);
    } catch {}
    try {
        hasSmoke = mod.HasEquipment(eventPlayer, smokeGadget);
    } catch {}
    if (hasSmoke) return true;
    try {
        mod.AddEquipment(eventPlayer, smokeGadget);
    } catch {}
    try {
        hasSmoke = mod.HasEquipment(eventPlayer, smokeGadget);
    } catch {}
    return hasSmoke;
}
// Grants an assault/medic-row gadget into a specific slot. Dup check consults lockerSlots
// state for gadget-slot placements (authoritative) and HasEquipment for Callins/Throwable.
function giveAssaultItem(
    eventPlayer: mod.Player,
    gadget: number,
    inventorySlot: mod.InventorySlots,
    forceSwitch: boolean,
    pid: number
): boolean {
    if (!isValidPlayer(eventPlayer)) return false;
    const slotsState = State.players.lockerSlots[pid];
    if (inventorySlot === mod.InventorySlots.GadgetOne || inventorySlot === mod.InventorySlots.GadgetTwo) {
        if (ownedByLockerState(slotsState, gadget)) return false;
    } else {
        try {
            if (mod.HasEquipment(eventPlayer, gadget)) return false;
        } catch {}
    }
    const targetSlot = inventorySlot;
    // Gadget-id sweep: removes any existing copy in any slot before we place. Mirrors the
    // launcher-variant sweep in giveLauncher. Intended to catch class-loadout gadgets that
    // HasEquipment can't see (e.g. class C4 in GadgetOne while tile targets GadgetTwo).
    let hasGadget = false;
    try { hasGadget = mod.HasEquipment(eventPlayer, gadget); } catch {}
    if (hasGadget) {
        try { mod.RemoveEquipment(eventPlayer, gadget); } catch {}
    }
    // CQ_Bug_94 follow-up (v1.448): dropped the isSlotEmpty + slot-targeted RemoveEquipment
    // precheck. isSlotEmpty calls GetInventoryAmmo/GetInventoryMagazineAmmo which fire the
    // engine "invalid item" log on empty slots. AddEquipment cleanly clobbers if the slot
    // already holds something else; users own the slot choice via the slot-toggle UI. Dup-
    // prevention for THIS gadget is handled by ownedByLockerState (line 1387) for GadgetOne/Two
    // and HasEquipment (line 1390) for non-Gadget slots, plus the gadget-id sweep above (1397).
    try {
        mod.AddEquipment(eventPlayer, gadget, targetSlot);
    } catch {
        return false;
    }
    if (forceSwitch) {
        try {
            mod.ForceSwitchInventory(eventPlayer, targetSlot);
        } catch {}
    }
    if (targetSlot === mod.InventorySlots.GadgetOne || targetSlot === mod.InventorySlots.GadgetTwo) {
        recordPlacement(pid, targetSlot, gadget, "gadget");
        reprobeSiblingGadgetSlot(pid, targetSlot, eventPlayer);
    }
    return true;
}
// Grants a recon-column gadget into a specific slot. Dup check consults lockerSlots state
// for gadget-slot placements (authoritative) and HasEquipment for Throwable.
function giveReconItem(
    eventPlayer: mod.Player,
    gadget: number,
    inventorySlot: mod.InventorySlots,
    pid: number
): boolean {
    if (!isValidPlayer(eventPlayer)) return false;
    const slotsState = State.players.lockerSlots[pid];
    if (inventorySlot === mod.InventorySlots.GadgetOne || inventorySlot === mod.InventorySlots.GadgetTwo) {
        if (ownedByLockerState(slotsState, gadget)) return false;
    } else {
        try {
            if (mod.HasEquipment(eventPlayer, gadget)) return false;
        } catch {}
    }
    const targetSlot = inventorySlot;
    // Gadget-id sweep: removes any existing copy in any slot before we place. Mirrors the
    // launcher-variant sweep in giveLauncher -- class C4 / Drone in the non-target slot would
    // otherwise produce a double-equip when HasEquipment misses the class variant.
    let hasGadget = false;
    try { hasGadget = mod.HasEquipment(eventPlayer, gadget); } catch {}
    if (hasGadget) {
        try { mod.RemoveEquipment(eventPlayer, gadget); } catch {}
    }
    // CQ_Bug_94 follow-up (v1.448): dropped the isSlotEmpty + slot-targeted RemoveEquipment
    // precheck. isSlotEmpty calls GetInventoryAmmo/GetInventoryMagazineAmmo which fire the
    // engine "invalid item" log on empty slots. AddEquipment cleanly clobbers if the slot
    // already holds something else; users own the slot choice via the slot-toggle UI. Dup-
    // prevention for THIS gadget (esp. C4 / Drone) is handled by ownedByLockerState +
    // HasEquipment dup checks above + the gadget-id sweep at line 1446.
    try {
        mod.AddEquipment(eventPlayer, gadget, targetSlot);
    } catch {
        return false;
    }
    if (targetSlot === mod.InventorySlots.Throwable) {
        try {
            mod.SetInventoryAmmo(eventPlayer, mod.InventorySlots.Throwable, 2);
        } catch {}
    } else if (gadget === mod.Gadgets.Misc_Demolition_Charge) {
        try {
            mod.SetInventoryAmmo(eventPlayer, targetSlot, 3);
        } catch {}
    }
    if (targetSlot === mod.InventorySlots.GadgetOne || targetSlot === mod.InventorySlots.GadgetTwo) {
        recordPlacement(pid, targetSlot, gadget, "gadget");
        reprobeSiblingGadgetSlot(pid, targetSlot, eventPlayer);
    }
    return true;
}
// Refills launcher ammo. Targets whichever slot state reports as holding a launcher.
// Returns false (and consumes no charge) when no launcher slot is tracked.
function giveRocketCharge(eventPlayer: mod.Player, pid: number): boolean {
    if (!isValidPlayer(eventPlayer)) return false;
    const slotsState = State.players.lockerSlots[pid];
    if (!slotsState) return false;
    const slot = slotWithLauncher(slotsState);
    if (slot === undefined) return false;
    let ammo = 0;
    let magAmmo = 0;
    try {
        ammo = Math.max(0, mod.GetInventoryAmmo(eventPlayer, slot));
    } catch {}
    try {
        magAmmo = Math.max(0, mod.GetInventoryMagazineAmmo(eventPlayer, slot));
    } catch {}
    // Cap defense: belt-and-braces against a click that races the UI refresh's atCap gate.
    const launcherGadget = slot === mod.InventorySlots.GadgetOne ? slotsState.g1.gadget : slotsState.g2.gadget;
    const maxAmmo = launcherMaxAmmoFor(launcherGadget);
    if (maxAmmo !== undefined && (ammo + magAmmo) >= maxAmmo) return false;
    const totalBefore = ammo + magAmmo;
    const usedChamberPath = ammo <= 0;
    if (usedChamberPath) {
        try { mod.SetInventoryAmmo(eventPlayer, slot, 1); } catch { return false; }
    } else {
        try { mod.SetInventoryMagazineAmmo(eventPlayer, slot, magAmmo + 1); } catch { return false; }
    }
    // Read-back verify: the launcher API can silently no-op a chamber/magazine write right
    // after a fire or probe (engine auto-reload races with our write). If the total didn't
    // move, retry via the other path once. Cap-safe because the up-front gate ensures
    // totalBefore + 1 <= maxAmmo.
    let verifyLoaded = 0, verifyMag = 0;
    try { verifyLoaded = Math.max(0, mod.GetInventoryAmmo(eventPlayer, slot)); } catch {}
    try { verifyMag = Math.max(0, mod.GetInventoryMagazineAmmo(eventPlayer, slot)); } catch {}
    if (verifyLoaded + verifyMag > totalBefore) return true;
    if (usedChamberPath) {
        try { mod.SetInventoryMagazineAmmo(eventPlayer, slot, verifyMag + 1); } catch {}
    } else {
        try { mod.SetInventoryAmmo(eventPlayer, slot, verifyLoaded + 1); } catch {}
    }
    let finalLoaded = 0, finalMag = 0;
    try { finalLoaded = Math.max(0, mod.GetInventoryAmmo(eventPlayer, slot)); } catch {}
    try { finalMag = Math.max(0, mod.GetInventoryMagazineAmmo(eventPlayer, slot)); } catch {}
    return (finalLoaded + finalMag) > totalBefore;
}
function updateArmMenu(eventPlayer: mod.Player): void {
    if (!isValidPlayer(eventPlayer)) return;
    const pid = safeGetPlayerId(eventPlayer);
    if (pid === undefined) return;
    if (!isArmOpen(pid)) return;
    const objId = getArmObj(pid);
    if (objId === undefined) return;
    const cache = State.hudCache.ammoResupplyMenuCache[pid];
    if (!cache) return;
    refreshArmMenu(eventPlayer, objId, cache);
}
// Self-terminating 1Hz loop that drives gadget cooldown timer display while the arm menu is open.
// Launched once on openArmMenu(); terminates when the menu closes, player becomes invalid, or token is superseded.
async function runArmMenuRefreshLoop(pid: number, token: number): Promise<void> {
    while (true) {
        await mod.Wait(1.0);
        if (State.players.armT[pid] !== token) return;
        if (!isArmOpen(pid)) return;
        const player = safeFindPlayer(pid);
        if (!isValidPlayer(player)) return;
        const objId = getArmObj(pid);
        if (objId === undefined) return;
        const cache = State.hudCache.ammoResupplyMenuCache[pid];
        if (!cache) return;
        refreshArmMenu(player, objId, cache);
    }
}
function buildArmMenuHidden(eventPlayer: mod.Player): AmmoResupplyMenuCacheEntry | undefined {
    if (!isValidPlayer(eventPlayer)) return undefined;
    const pid = safeGetPlayerId(eventPlayer);
    if (pid === undefined) return undefined;
    let cache = State.hudCache.ammoResupplyMenuCache[pid];
    if (!cache) {
        if (FEATURE_PERF_DIAG) incrementUiCachePerfCounter(pid, "gadget", "built");
        cache = mkArmCache(pid);
        State.hudCache.ammoResupplyMenuCache[pid] = cache;
    }
    cache.root = cache.root ?? safeFind(cache.rootName);
    if (cache.root) {
        if (!armCacheOk(cache)) {
            if (FEATURE_PERF_DIAG) {
                incrementUiCachePerfCounter(pid, "gadget", "invalid");
                incrementUiCachePerfCounter(pid, "gadget", "rebuilt");
            }
            destroyArmMenu(pid);
            cache = mkArmCache(pid);
            State.hudCache.ammoResupplyMenuCache[pid] = cache;
        } else {
            return cache;
        }
    }
    mod.AddUIContainer(
        cache.rootName,
        mod.CreateVector(0, AMMO_RESUPPLY_ROOT_Y, 0),
        mod.CreateVector(AMMO_RESUPPLY_MENU_SIZE, AMMO_RESUPPLY_MENU_SIZE, 0),
        mod.UIAnchor.Center,
        mod.GetUIRoot(),
        false,
        10,
        VEC_ZERO,
        0.995,
        mod.UIBgFill.Blur,
        mod.UIDepth.AboveGameUI,
        eventPlayer
    );
    cache.root = safeFind(cache.rootName);
    if (!cache.root) return undefined;
    const root = cache.root;
    mod.SetUIWidgetBgAlpha(root, 0.995);
    const borderHalfWidth = (AMMO_RESUPPLY_MENU_SIZE / 2) + AMMO_RESUPPLY_MENU_BORDER_PADDING + (AMMO_RESUPPLY_MENU_BORDER_THICKNESS / 2);
    const borderHalfHeight = (AMMO_RESUPPLY_MENU_SIZE / 2) + AMMO_RESUPPLY_MENU_BORDER_PADDING + (AMMO_RESUPPLY_MENU_BORDER_THICKNESS / 2);
    const borderLineWidth = AMMO_RESUPPLY_MENU_SIZE + (AMMO_RESUPPLY_MENU_BORDER_PADDING * 2) + (AMMO_RESUPPLY_MENU_BORDER_OVERLAP * 2);
    const borderLineHeight = AMMO_RESUPPLY_MENU_SIZE + (AMMO_RESUPPLY_MENU_BORDER_PADDING * 2) + (AMMO_RESUPPLY_MENU_BORDER_OVERLAP * 2);
    cache.borderTop = mkBrd(ammoResupplyMenuName("BorderTop", pid), mod.CreateVector(0, -borderHalfHeight, 0), mod.CreateVector(borderLineWidth, AMMO_RESUPPLY_MENU_BORDER_THICKNESS, 0), root, eventPlayer);
    cache.borderBottom = mkBrd(ammoResupplyMenuName("BorderBottom", pid), mod.CreateVector(0, borderHalfHeight, 0), mod.CreateVector(borderLineWidth, AMMO_RESUPPLY_MENU_BORDER_THICKNESS, 0), root, eventPlayer);
    cache.borderLeft = mkBrd(ammoResupplyMenuName("BorderLeft", pid), mod.CreateVector(-borderHalfWidth, 0, 0), mod.CreateVector(AMMO_RESUPPLY_MENU_BORDER_THICKNESS, borderLineHeight, 0), root, eventPlayer);
    cache.borderRight = mkBrd(ammoResupplyMenuName("BorderRight", pid), mod.CreateVector(borderHalfWidth, 0, 0), mod.CreateVector(AMMO_RESUPPLY_MENU_BORDER_THICKNESS, borderLineHeight, 0), root, eventPlayer);
    const cfg = ACTIVE_GADGET_CONFIG;
    const assaultStartY = SY;
    const assaultGroupHeight = armGH(cfg.assault.length);
    const assaultGroupCenterY = armGCY(assaultStartY, cfg.assault.length);
    const assaultHintY = armGHY(assaultGroupCenterY, assaultGroupHeight);
    const medicInterceptStartY = SY;
    const medicGroupHeight = armGH(cfg.medicItems.length);
    const medicGroupCenterY = armGCY(medicInterceptStartY, cfg.medicItems.length);
    const medicHintY = armGHY(medicGroupCenterY, medicGroupHeight);
    const medicY = medicHintY + 34 + (AMMO_RESUPPLY_TILE_SIZE / 2);
    const engineerStartY = SY;
    const engineerGroupHeight = armGH(cfg.launchers.length);
    const engineerGroupCenterY = armGCY(engineerStartY, cfg.launchers.length);
    const engineerHintY = armGHY(engineerGroupCenterY, engineerGroupHeight);
    const ammoY = engineerHintY + 34 + (AMMO_RESUPPLY_TILE_SIZE / 2);
    const reconSharedCount = Math.max(1, cfg.recon.length - 1);
    const reconSharedStartY = SY;
    const reconGroupHeight = armGH(reconSharedCount);
    const reconGroupCenterY = armGCY(reconSharedStartY, reconSharedCount);
    const reconHintY = armGHY(reconGroupCenterY, reconGroupHeight);
    const reconDroneY = reconHintY + 34 + (AMMO_RESUPPLY_TILE_SIZE / 2);
    // Help text line at the top, showing a description of the hovered button.
    cache.helpText = addReadyDialogText(
        ammoResupplyMenuName("HelpText", pid),
        0,
        HELP_TEXT_Y,
        HELP_TEXT_WIDTH,
        28,
        mod.UIAnchor.Center,
        mod.UIAnchor.Center,
        msg(STR_UI_HELP_EMPTY),
        eventPlayer,
        root,
        22,
        false,
        COLOR_WHITE
    );
    // Gadget round-start delay status line (above class headers). Hidden by default; refreshArmMenu
    // toggles it during pre-LIVE and while roundStartGadgetDelay is active.
    cache.gadgetDelayStatus = addReadyDialogText(
        ammoResupplyMenuName("GadgetDelayStatus", pid),
        0,
        -410,
        HELP_TEXT_WIDTH,
        30,
        mod.UIAnchor.Center,
        mod.UIAnchor.Center,
        msg(mod.stringkeys.twl.countdown.delayGadgets, 0),
        eventPlayer,
        root,
        22,
        false,
        COLOR_WARNING_YELLOW
    );
    if (cache.gadgetDelayStatus) safeSetUIWidgetVisible(cache.gadgetDelayStatus, false);
    for (let i = 0; i < HDR_KEYS.length; i++) {
        cache.h![i] = addReadyDialogText(
            ammoResupplyMenuName("ClassHeader", pid, i),
            HDR_X[i],
            AMMO_RESUPPLY_CLASS_HEADER_Y,
            AMMO_RESUPPLY_CLASS_HEADER_WIDTH,
            32,
            mod.UIAnchor.Center,
            mod.UIAnchor.Center,
            msg(HDR_KEYS[i]),
            eventPlayer,
            root,
            22,
            false,
            READY_DIALOG_LABEL_TEXT_COLOR
        );
        buildSlotToggleRow(cache, pid, i, root, eventPlayer);
    }
    for (let i = 0; i < cfg.assault.length; i++) {
        const tileY = assaultStartY + (i * DY);
        const item = cfg.assault[i];
        buildTile(
            cache.a[i],
            item.name,
            pid,
            AX,
            tileY,
            item.labelKey,
            armScope(item.teamShared),
            item.gadget,
            item.cooldownSeconds,
            item.maxCount,
            root,
            eventPlayer,
            item.iconSize ?? IS,
            item.iconY ?? IY
        );
    }
    buildTile(
        cache.m,
        cfg.medicSmoke.name,
        pid,
        MX,
        medicY,
        cfg.medicSmoke.labelKey,
        armScope(cfg.medicSmoke.teamShared),
        cfg.medicSmoke.gadget,
        cfg.medicSmoke.cooldownSeconds,
        cfg.medicSmoke.maxCount,
        root,
        eventPlayer
    );
    for (let i = 0; i < cfg.medicItems.length; i++) {
        const tileY = medicInterceptStartY + (i * DY);
        const item = cfg.medicItems[i];
        buildTile(
            cache.x[i],
            item.name,
            pid,
            MX,
            tileY,
            item.labelKey,
            armScope(item.teamShared),
            item.gadget,
            item.cooldownSeconds,
            item.maxCount,
            root,
            eventPlayer,
            item.iconSize ?? IS,
            item.iconY ?? IY
        );
    }
    for (let i = 0; i < cfg.launchers.length; i++) {
        const launcherItem = cfg.launchers[i];
        const rowY = engineerStartY + (i * DY);
        const buttonId = ammoResupplyMenuName("ActionButton", pid, i);
        cache.rows[i].bb = addOutlinedButton(
            buttonId,
            EX,
            rowY,
            AMMO_RESUPPLY_TILE_SIZE,
            AMMO_RESUPPLY_TILE_SIZE,
            mod.UIAnchor.Center,
            root,
            eventPlayer,
            1
        );
        cache.rows[i].button = safeFind(buttonId);
        const rowBtn = cache.rows[i].button;
        if (rowBtn) {
            mod.EnableUIButtonEvent(rowBtn, mod.UIButtonEvent.FocusIn, true);
            mod.EnableUIButtonEvent(rowBtn, mod.UIButtonEvent.FocusOut, true);
        }
        const rowParent = buildTileContentRoot(
            ammoResupplyMenuName("ActionContent", pid, i),
            EX,
            rowY,
            root,
            eventPlayer
        ) ?? root;
        cache.rows[i].i = addGImg(
            ammoResupplyMenuName("ActionButtonIcon", pid, i),
            EX,
            rowY + IY,
            IS,
            launcherItem.gadget,
            root,
            eventPlayer
        );
        buildTileHeaderWidgets(cache.rows[i], `Action${i}`, pid, rowParent, eventPlayer, launcherItem.labelKey);
        cache.rows[i].s = addReadyDialogText(
            ammoResupplyMenuName("ActionScope", pid, i),
            0,
            SPY,
            AMMO_RESUPPLY_TILE_LABEL_WIDTH,
            18,
            mod.UIAnchor.Center,
            mod.UIAnchor.Center,
            launcherItem.pool?.teamShared
                ? msg(STR_UI_N_PER_TEAM, launcherItem.pool.maxCount)
                : armScope(false),
            eventPlayer,
            rowParent,
            TILE_SCOPE_SIZE,
            false,
            COLOR_GRAY
        );
        cache.rows[i].cd = addReadyDialogText(
            ammoResupplyMenuName("ActionCooldown", pid, i),
            0,
            TY,
            AMMO_RESUPPLY_TILE_TIMER_WIDTH,
            28,
            mod.UIAnchor.Center,
            mod.UIAnchor.Center,
            msg(STR_UI_READY),
            eventPlayer,
            rowParent,
            TILE_TIMER_SIZE,
            false,
            COLOR_READY_GREEN
        );
        cache.rows[i].r = addReadyDialogText(
            ammoResupplyMenuName("ActionRef", pid, i),
            TILE_REF_X,
            TILE_REF_Y,
            TILE_REF_WIDTH,
            18,
            mod.UIAnchor.Center,
            mod.UIAnchor.CenterRight,
            armDur(cfg.launcherCooldownSeconds),
            eventPlayer,
            rowParent,
            TILE_REF_SIZE,
            false,
            COLOR_GRAY
        );
        cache.rows[i].cs = addReadyDialogText(
            ammoResupplyMenuName("ActionCountShadow", pid, i),
            CX + 2,
            CY + 3,
            CB,
            CB,
            mod.UIAnchor.Center,
            mod.UIAnchor.Center,
            msg(STR_SYS_COUNTER, 1),
            eventPlayer,
            rowParent,
            CSZ,
            false,
            COLOR_DARK_BLACK
        );
        cache.rows[i].ct = addReadyDialogText(
            ammoResupplyMenuName("ActionCount", pid, i),
            CX,
            CY,
            CB,
            CB,
            mod.UIAnchor.Center,
            mod.UIAnchor.Center,
            msg(STR_SYS_COUNTER, 1),
            eventPlayer,
            rowParent,
            CSZ,
            false,
            COLOR_WHITE
        );
        const rowButtonIcon = cache.rows[i].i;
        if (rowButtonIcon) {
            mod.SetUIImageColor(rowButtonIcon, COLOR_NOT_READY_RED);
        }
    }
    buildTile(
        cache.e,
        "AmmoCharge",
        pid,
        EX,
        ammoY,
        STR_UI_LAUNCHER_AMMO,
        armScope(false),
        mod.Gadgets.Class_Supply_Bag,
        cfg.ammoCooldownSeconds,
        cfg.ammoMaxCharges,
        root,
        eventPlayer,
        LAUNCH_AMMO_ICON_SIZE,
        LAUNCH_AMMO_ICON_Y
    );
    for (let i = 0; i < cfg.recon.length; i++) {
        const tileY = i === 0 ? reconDroneY : reconSharedStartY + ((i - 1) * DY);
        const item = cfg.recon[i];
        buildTile(
            cache.q[i],
            item.name,
            pid,
            RX,
            tileY,
            item.labelKey,
            armScope(item.teamShared),
            item.gadget,
            item.cooldownSeconds,
            item.maxCount,
            root,
            eventPlayer,
            item.iconSize ?? IS,
            item.iconY ?? IY
        );
    }
    cache.ag = armGBox(
        ammoResupplyMenuName("AssaultGroup", pid),
        AX,
        assaultGroupCenterY,
        TILE_GROUP_BORDER_SIZE_X,
        assaultGroupHeight,
        root,
        eventPlayer
    );
    cache.ah = addReadyDialogText(
        ammoResupplyMenuName("AssaultGroupHint", pid),
        AX,
        assaultHintY,
        AMMO_RESUPPLY_TILE_LABEL_WIDTH,
        18,
        mod.UIAnchor.Center,
        mod.UIAnchor.Center,
        armChoose(),
        eventPlayer,
        root,
        TILE_GROUP_HINT_SIZE,
        false,
        COLOR_BLUE
    );
    cache.at = addReadyDialogText(
        ammoResupplyMenuName("AssaultGroupTimer", pid),
        AX,
        assaultHintY + ASSAULT_GROUP_TIMER_GAP,
        AMMO_RESUPPLY_TILE_LABEL_WIDTH,
        22,
        mod.UIAnchor.Center,
        mod.UIAnchor.Center,
        msg(STR_UI_READY),
        eventPlayer,
        root,
        ASSAULT_GROUP_TIMER_SIZE,
        false,
        COLOR_WARNING_YELLOW
    );
    cache.mg = armGBox(
        ammoResupplyMenuName("MedicGroup", pid),
        MX,
        medicGroupCenterY,
        TILE_GROUP_BORDER_SIZE_X,
        medicGroupHeight,
        root,
        eventPlayer
    );
    cache.mh = addReadyDialogText(
        ammoResupplyMenuName("MedicGroupHint", pid),
        MX,
        medicHintY,
        AMMO_RESUPPLY_TILE_LABEL_WIDTH,
        18,
        mod.UIAnchor.Center,
        mod.UIAnchor.Center,
        armChoose(),
        eventPlayer,
        root,
        TILE_GROUP_HINT_SIZE,
        false,
        COLOR_BLUE
    );
    cache.mt = addReadyDialogText(
        ammoResupplyMenuName("MedicGroupTimer", pid),
        MX,
        medicHintY + ASSAULT_GROUP_TIMER_GAP,
        AMMO_RESUPPLY_TILE_LABEL_WIDTH,
        22,
        mod.UIAnchor.Center,
        mod.UIAnchor.Center,
        msg(STR_UI_READY),
        eventPlayer,
        root,
        ASSAULT_GROUP_TIMER_SIZE,
        false,
        COLOR_WARNING_YELLOW
    );
    cache.eg = armGBox(
        ammoResupplyMenuName("EngineerGroup", pid),
        EX,
        engineerGroupCenterY,
        TILE_GROUP_BORDER_SIZE_X,
        engineerGroupHeight,
        root,
        eventPlayer
    );
    cache.eh = addReadyDialogText(
        ammoResupplyMenuName("EngineerGroupHint", pid),
        EX,
        engineerHintY,
        AMMO_RESUPPLY_TILE_LABEL_WIDTH,
        18,
        mod.UIAnchor.Center,
        mod.UIAnchor.Center,
        armChoose(),
        eventPlayer,
        root,
        TILE_GROUP_HINT_SIZE,
        false,
        COLOR_BLUE
    );
    cache.et = addReadyDialogText(
        ammoResupplyMenuName("EngineerGroupTimer", pid),
        EX,
        engineerHintY + ASSAULT_GROUP_TIMER_GAP,
        AMMO_RESUPPLY_TILE_LABEL_WIDTH,
        22,
        mod.UIAnchor.Center,
        mod.UIAnchor.Center,
        msg(STR_UI_READY),
        eventPlayer,
        root,
        ASSAULT_GROUP_TIMER_SIZE,
        false,
        COLOR_WARNING_YELLOW
    );
    cache.rg = armGBox(
        ammoResupplyMenuName("ReconGroup", pid),
        RX,
        reconGroupCenterY,
        TILE_GROUP_BORDER_SIZE_X,
        reconGroupHeight,
        root,
        eventPlayer
    );
    cache.rh = addReadyDialogText(
        ammoResupplyMenuName("ReconGroupHint", pid),
        RX,
        reconHintY,
        AMMO_RESUPPLY_TILE_LABEL_WIDTH,
        18,
        mod.UIAnchor.Center,
        mod.UIAnchor.Center,
        armChoose(),
        eventPlayer,
        root,
        TILE_GROUP_HINT_SIZE,
        false,
        COLOR_BLUE
    );
    cache.rt = addReadyDialogText(
        ammoResupplyMenuName("ReconGroupTimer", pid),
        RX,
        reconHintY + ASSAULT_GROUP_TIMER_GAP,
        AMMO_RESUPPLY_TILE_LABEL_WIDTH,
        22,
        mod.UIAnchor.Center,
        mod.UIAnchor.Center,
        msg(STR_UI_READY),
        eventPlayer,
        root,
        ASSAULT_GROUP_TIMER_SIZE,
        false,
        COLOR_WARNING_YELLOW
    );
    cache.closeButtonBorder = addOutlinedButton(
        ammoResupplyMenuName("CloseButton", pid),
        0,
        AMMO_RESUPPLY_CLOSE_BUTTON_Y,
        AMMO_RESUPPLY_CLOSE_BUTTON_WIDTH,
        AMMO_RESUPPLY_CLOSE_BUTTON_HEIGHT,
        mod.UIAnchor.Center,
        root,
        eventPlayer,
        1
    );
    cache.closeButton = safeFind(ammoResupplyMenuName("CloseButton", pid));
    cache.closeButtonText = addCenteredButtonText(
        ammoResupplyMenuName("CloseButtonLabel", pid),
        AMMO_RESUPPLY_CLOSE_BUTTON_WIDTH,
        AMMO_RESUPPLY_CLOSE_BUTTON_HEIGHT,
        mod.stringkeys.twl.teamSwitch.buttons.cancel,
        eventPlayer,
        cache.closeButtonBorder ?? root,
        28
    );
    armInitVisible(cache);
    showArmMenu(cache, false);
    return cache;
}
// Builds one [<] Gadget Slot N [>] row under a class header. Interactivity is controlled by
// refreshArmMenu based on the player's current class.
function buildSlotToggleRow(
    cache: AmmoResupplyMenuCacheEntry,
    pid: number,
    i: number,
    root: mod.UIWidget,
    eventPlayer: mod.Player
): void {
    const centerX = HDR_X[i];
    const buttonW = AMMO_RESUPPLY_SLOT_TOGGLE_BUTTON_W;
    const buttonH = AMMO_RESUPPLY_SLOT_TOGGLE_BUTTON_H;
    const labelW = AMMO_RESUPPLY_SLOT_TOGGLE_LABEL_W;
    const y = AMMO_RESUPPLY_SLOT_TOGGLE_Y;
    const prevX = centerX - (labelW / 2) - (buttonW / 2);
    const nextX = centerX + (labelW / 2) + (buttonW / 2);
    const prevName = ammoResupplyMenuName("SlotTogglePrev", pid, i);
    const labelName = ammoResupplyMenuName("SlotToggleLabel", pid, i);
    const nextName = ammoResupplyMenuName("SlotToggleNext", pid, i);
    const prevLabelName = ammoResupplyMenuName("SlotTogglePrevLabel", pid, i);
    const nextLabelName = ammoResupplyMenuName("SlotToggleNextLabel", pid, i);

    const prevBorder = addOutlinedButton(prevName, prevX, y, buttonW, buttonH, mod.UIAnchor.Center, root, eventPlayer, 1);
    const prevLabel = addReadyDialogCenteredText(
        prevLabelName,
        buttonW,
        buttonH,
        msg(mod.stringkeys.twl.ui.left),
        eventPlayer,
        prevBorder ?? root,
        14
    );
    const label = addReadyDialogText(
        labelName,
        centerX,
        y,
        labelW,
        buttonH,
        mod.UIAnchor.Center,
        mod.UIAnchor.Center,
        msg(STR_UI_GADGET_SLOT_LABEL, 2),
        eventPlayer,
        root,
        14,
        true,
        READY_DIALOG_LABEL_TEXT_COLOR
    );
    const nextBorder = addOutlinedButton(nextName, nextX, y, buttonW, buttonH, mod.UIAnchor.Center, root, eventPlayer, 1);
    const nextLabel = addReadyDialogCenteredText(
        nextLabelName,
        buttonW,
        buttonH,
        msg(mod.stringkeys.twl.ui.right),
        eventPlayer,
        nextBorder ?? root,
        14
    );
    const prevButton = safeFind(prevName);
    const nextButton = safeFind(nextName);
    if (!cache.st) cache.st = [];
    cache.st[i] = {
        prev: prevButton ?? prevBorder,
        prevLabel,
        label,
        next: nextButton ?? nextBorder,
        nextLabel,
    };
}
function destroyArmMenu(pid: number): void {
    for (let i = 0; i < 32; i++) {
        const widget = safeFind(ammoResupplyMenuName("Root", pid));
        if (!widget) break;
        try {
            mod.DeleteUIWidget(widget);
        } catch {
            break;
        }
    }
    delete State.hudCache.ammoResupplyMenuCache[pid];
}
function refreshArmMenu(eventPlayer: mod.Player, objId: number, cache: AmmoResupplyMenuCacheEntry, force: boolean = false): void {
    const pid = safeGetPlayerId(eventPlayer);
    if (pid === undefined) return;
    // Currently-focused tile key drives the disabled-focused border indicator. Read once at the
    // top of the refresh so each tile site can do an O(1) identity check.
    const focusedKey = State.players.armFocusedTileKeyByPid[pid];
    const cfg = ACTIVE_GADGET_CONFIG;
    const assaultGroup = ensArmG(pid);
    const state = ensArm(pid);
    const launch = ensArmL(pid);
    const now = mod.GetMatchTimeElapsed();
    const nowSecond = Math.max(0, Math.floor(now));
    if (!force && cache.lastRefreshSecond === nowSecond) return;
    cache.lastRefreshSecond = nowSecond;
    // Round-start gadget delay: locks all tiles pre-LIVE and for N seconds after match goes LIVE.
    // Status widget at the top of the menu shows remaining time whenever this gate is active.
    const gadgetBlocked = !isMatchLive() || isRoundStartGadgetDelayActive();
    const gadgetRemaining = getRoundStartGadgetDelayRemainingSeconds();
    const gadgetStatusVisible = gadgetBlocked && gadgetRemaining > 0;
    if (cache.gadgetDelayStatus) {
        // Pre-LIVE shows the descriptive "after match is Live" string; post-LIVE shows a counting
        // "will be available in {0}s" variant that reads correctly while the delay is ticking.
        const gadgetLive = isMatchLive();
        const gSig = (gadgetStatusVisible ? 1 : 0) + "|" + (gadgetLive ? 1 : 0) + "|" + Math.ceil(gadgetRemaining);
        if (cache.gadgetDelayStatusSig !== gSig) {
            if (gadgetStatusVisible) {
                const key = gadgetLive
                    ? mod.stringkeys.twl.countdown.delayGadgetsLive
                    : mod.stringkeys.twl.countdown.delayGadgets;
                safeSetUITextLabel(cache.gadgetDelayStatus, msg(key, Math.ceil(gadgetRemaining)));
                safeSetUIWidgetVisible(cache.gadgetDelayStatus, true);
            } else {
                safeSetUIWidgetVisible(cache.gadgetDelayStatus, false);
            }
            cache.gadgetDelayStatusSig = gSig;
        }
    }
    const teamId = safeGetTeamNumberFromPlayer(eventPlayer, 0);
    const isAssaultClass = isCls(eventPlayer, mod.SoldierClass.Assault);
    const isMedicClass = isCls(eventPlayer, mod.SoldierClass.Support);
    const isEngineerClass = isCls(eventPlayer, mod.SoldierClass.Engineer);
    const isReconClass = isCls(eventPlayer, mod.SoldierClass.Recon);
    const smokeState = ensSmk(teamId);
    const assaultState = ensAsg(teamId);
    const launcherPoolState = ensAsgL(teamId);
    syncArm(launch, now);
    if (smokeState) syncSmk(smokeState, now);
    if (assaultState) syncAsg(assaultState, now);
    if (launcherPoolState) syncAsgL(launcherPoolState, now);
    if (assaultGroup.n <= now) {
        assaultGroup.n = 0;
        assaultGroup.s = -1;
    }
    if ((state.mN ?? 0) <= now) {
        state.mN = 0;
        state.mS = -1;
    }
    if ((state.rgN ?? 0) <= now) {
        state.rgN = 0;
        state.rgS = -1;
    }
    const assaultGroupRemaining = Math.max(0, assaultGroup.n - now);
    const launcherRemaining = Math.max(0, launch.lN - now);
    const launcherReady = launcherRemaining <= 0;
    const launcherMessage = fmtClock(launcherRemaining);
    const launcherColor = launcherReady ? COLOR_READY_GREEN : COLOR_WARNING_YELLOW;
    // Authoritative per-player slot state, seeded on menu open and kept in sync by give* calls.
    // Tile dup-dim and launcher-slot visibility all read from this; no per-tick re-probing.
    const slotsState = State.players.lockerSlots[pid];
    const launcherSlotKnown = slotWithLauncher(slotsState) !== undefined;
    const hasLauncher = launcherSlotKnown;
    const smokeCount = Math.max(0, Math.min(cfg.medicSmoke.maxCount, smokeState?.c ?? 0));
    const smokeRemaining = Math.max(0, (smokeState?.n ?? 0) - now);
    const smokeReady = smokeRemaining <= 0;
    const smokeAlreadyHas = tileOwned(eventPlayer, slotsState, cfg.medicSmoke.gadget, cfg.medicSmoke.slot);
    const smokeEnabled = isMedicClass && smokeCount > 0 && smokeReady && !gadgetBlocked && !smokeAlreadyHas;
    const smokeMessage = smokeRemaining > 0 ? fmtClock(smokeRemaining) : msg(STR_UI_READY);
    const smokeOverlayMessage = msg(STR_SYS_COUNTER, smokeCount);
    const medicRemaining = Math.max(0, (state.mN ?? 0) - now);
    const medicReady = medicRemaining <= 0;
    const reconDroneRemaining = Math.max(0, state.rdN - now);
    const reconSharedRemaining = Math.max(0, state.rgN - now);
    if (cache.h) {
        for (let i = 0; i < cache.h.length; i++) {
            const active = (i === 0 && isAssaultClass) || (i === 1 && isEngineerClass) || (i === 2 && isMedicClass) || (i === 3 && isReconClass);
            safeSetUITextColor(cache.h[i], active ? COLOR_READY_GREEN : COLOR_NOT_READY_RED);
        }
    }
    const toggleState = State.players.lockerSlotToggle[pid];
    if (cache.st && toggleState) {
        const currentClassIdx = getPlayerClassHdrIndex(eventPlayer);
        const launcherSlot = slotWithLauncher(slotsState);
        const launcherSlotNumber = launcherSlot === mod.InventorySlots.GadgetOne ? 1 : 2;
        for (let i = 0; i < 4; i++) {
            const row = cache.st[i];
            if (!row) continue;
            const choice = toggleState.slotByClass[i];
            // Engineer row locks to "Launcher in Slot N" once a launcher is equipped -- visual
            // confirmation that probe-based slot detection is authoritative and the slot is fixed.
            const lockedByLauncher = i === 1 && launcherSlot !== undefined;
            if (lockedByLauncher) {
                safeSetUITextLabel(row.label, msg(STR_UI_LAUNCHER_IN_SLOT, launcherSlotNumber));
            } else {
                safeSetUITextLabel(row.label, msg(STR_UI_GADGET_SLOT_LABEL, choice));
            }
            const enabled = i === currentClassIdx && !lockedByLauncher;
            const btnAlpha = enabled ? BUTTON_OPACITY_BASE : DIS_A;
            const borderAlpha = enabled ? BUTTON_BORDER_OPACITY : DIS_A;
            if (row.prev) {
                try { mod.SetUIButtonEnabled(row.prev, enabled); } catch {}
                safeSetUIWidgetBgAlpha(row.prev, btnAlpha);
            }
            if (row.next) {
                try { mod.SetUIButtonEnabled(row.next, enabled); } catch {}
                safeSetUIWidgetBgAlpha(row.next, btnAlpha);
            }
            const prevBorder = safeFind(ammoResupplyMenuName("SlotTogglePrev", pid, i) + "_BORDER");
            const nextBorder = safeFind(ammoResupplyMenuName("SlotToggleNext", pid, i) + "_BORDER");
            if (prevBorder) safeSetUIWidgetBgAlpha(prevBorder, borderAlpha);
            if (nextBorder) safeSetUIWidgetBgAlpha(nextBorder, borderAlpha);
            safeSetUITextAlpha(row.prevLabel, enabled ? 1 : DIS_A);
            safeSetUITextAlpha(row.nextLabel, enabled ? 1 : DIS_A);
            safeSetUITextAlpha(row.label, enabled ? 1 : DIS_A);
        }
    }
    safeSetUITextColor(cache.at, COLOR_WARNING_YELLOW);
    if (assaultGroupRemaining > 0) {
        safeSetUITextLabel(cache.at, fmtClock(assaultGroupRemaining));
        safeSetUIWidgetVisible(cache.at, true);
    } else {
        safeSetUIWidgetVisible(cache.at, false);
    }
    safeSetUITextColor(cache.mt, COLOR_WARNING_YELLOW);
    if (isMedicClass && medicRemaining > 0) {
        safeSetUITextLabel(cache.mt, fmtClock(medicRemaining));
        safeSetUIWidgetVisible(cache.mt, true);
    } else {
        safeSetUIWidgetVisible(cache.mt, false);
    }
    safeSetUITextColor(cache.et, COLOR_WARNING_YELLOW);
    if (isEngineerClass && launcherRemaining > 0) {
        safeSetUITextLabel(cache.et, launcherMessage);
        safeSetUIWidgetVisible(cache.et, true);
    } else {
        safeSetUIWidgetVisible(cache.et, false);
    }
    safeSetUITextColor(cache.rt, COLOR_WARNING_YELLOW);
    if (isReconClass && reconSharedRemaining > 0) {
        safeSetUITextLabel(cache.rt, fmtClock(reconSharedRemaining));
        safeSetUIWidgetVisible(cache.rt, true);
    } else {
        safeSetUIWidgetVisible(cache.rt, false);
    }
    for (let i = 0; i < cache.a.length; i++) {
        const tile = cache.a[i];
        const item = cfg.assault[i];
        const asgEntry = assaultState?.[i];
        const count = Math.max(0, Math.min(item.maxCount, asgEntry?.c ?? 0));
        const remaining = Math.max(0, (asgEntry?.n ?? 0) - now);
        const ready = count > 0 && remaining <= 0;
        const alreadyHas = tileOwned(eventPlayer, slotsState, item.gadget, item.slot);
        const enabled = isAssaultClass && assaultGroupRemaining <= 0 && ready && !gadgetBlocked && !alreadyHas;
        const showSelectedAssaultTimer = isAssaultClass && assaultGroupRemaining > 0 && assaultGroup.s === i;
        const hideAssaultTimer = isAssaultClass && assaultGroupRemaining > 0 && assaultGroup.s !== i;
        const focused = focusedKey === `a:${i}`;
        const sig = [
            enabled ? 1 : 0,
            count,
            remaining > 0 ? Math.ceil(remaining) : 0,
            showSelectedAssaultTimer ? Math.ceil(assaultGroupRemaining) : 0,
            hideAssaultTimer ? 1 : 0,
            isAssaultClass ? 1 : 0,
            assaultGroupRemaining > 0 ? 1 : 0,
            alreadyHas ? 1 : 0,
            focused ? 1 : 0,
        ].join("|");
        if (tile.sig !== sig) {
            const overlayMessage = msg(STR_SYS_COUNTER, count);
            setTileHeaderWidgets(tile, item.labelKey, enabled ? COLOR_READY_GREEN : isAssaultClass ? COLOR_GRAY : COLOR_NOT_READY_RED);
            safeSetUITextLabel(
                tile.cd,
                showSelectedAssaultTimer
                    ? fmtClock(assaultGroupRemaining)
                    : (remaining > 0 ? fmtClock(remaining) : msg(STR_UI_READY))
            );
            safeSetUITextColor(
                tile.cd,
                !isAssaultClass ? COLOR_GRAY
                    : showSelectedAssaultTimer ? COLOR_GRAY
                        : hideAssaultTimer ? COLOR_GRAY
                        : remaining > 0 ? COLOR_WARNING_YELLOW
                            : assaultGroupRemaining > 0 ? COLOR_GRAY
                                : COLOR_READY_GREEN
            );
            safeSetUIWidgetVisible(tile.cd, !hideAssaultTimer);
            safeSetUITextLabel(tile.cs, overlayMessage);
            safeSetUITextLabel(tile.ct, overlayMessage);
            safeSetUITextColor(tile.s, remaining > 0 ? COLOR_NOT_READY_RED : COLOR_GRAY);
            safeSetUITextColor(tile.cs, COLOR_DARK_BLACK);
            safeSetUITextColor(tile.ct, count > 0 ? COLOR_WHITE : COLOR_GRAY);
            setTileVis(tile, enabled, focused);
            if (tile.i) {
                mod.SetUIImageColor(tile.i, enabled ? COLOR_NOT_READY_RED : COLOR_GRAY);
            }
            tile.sig = sig;
        }
    }
    {
        const focused = focusedKey === "m";
        const sig = [
            smokeEnabled ? 1 : 0,
            smokeCount,
            smokeRemaining > 0 ? Math.ceil(smokeRemaining) : 0,
            isMedicClass ? 1 : 0,
            smokeReady ? 1 : 0,
            smokeAlreadyHas ? 1 : 0,
            focused ? 1 : 0,
        ].join("|");
        if (cache.m.sig !== sig) {
            setTileHeaderWidgets(cache.m, STR_UI_SMOKE_SCREEN, smokeEnabled ? COLOR_READY_GREEN : isMedicClass ? COLOR_GRAY : COLOR_NOT_READY_RED);
            safeSetUITextLabel(cache.m.cd, smokeMessage);
            safeSetUITextColor(cache.m.cd, isMedicClass ? (smokeReady ? COLOR_READY_GREEN : COLOR_WARNING_YELLOW) : COLOR_GRAY);
            safeSetUITextLabel(cache.m.cs, smokeOverlayMessage);
            safeSetUITextLabel(cache.m.ct, smokeOverlayMessage);
            safeSetUITextColor(cache.m.s, smokeRemaining > 0 ? COLOR_NOT_READY_RED : COLOR_GRAY);
            safeSetUITextColor(cache.m.cs, COLOR_DARK_BLACK);
            safeSetUITextColor(cache.m.ct, smokeCount > 0 ? COLOR_WHITE : COLOR_GRAY);
            setTileVis(cache.m, smokeEnabled, focused);
            if (cache.m.i) {
                mod.SetUIImageColor(cache.m.i, smokeEnabled ? COLOR_NOT_READY_RED : COLOR_GRAY);
            }
            cache.m.sig = sig;
        }
    }
    for (let i = 0; i < cache.x.length; i++) {
        const tile = cache.x[i];
        const medicItem = cfg.medicItems[i];
        const medicAlreadyHas = tileOwned(eventPlayer, slotsState, medicItem.gadget, medicItem.slot);
        const enabled = isMedicClass && medicReady && !gadgetBlocked && !medicAlreadyHas;
        const count = medicReady ? medicItem.maxCount : 0;
        const showSelectedMedicTimer = isMedicClass && medicRemaining > 0 && state.mS === i;
        const focused = focusedKey === `x:${i}`;
        const sig = [
            enabled ? 1 : 0,
            count,
            medicRemaining > 0 ? Math.ceil(medicRemaining) : 0,
            showSelectedMedicTimer ? 1 : 0,
            isMedicClass ? 1 : 0,
            medicAlreadyHas ? 1 : 0,
            focused ? 1 : 0,
        ].join("|");
        if (tile.sig !== sig) {
            setTileHeaderWidgets(tile, medicItem.labelKey, enabled ? COLOR_READY_GREEN : isMedicClass ? COLOR_GRAY : COLOR_NOT_READY_RED);
            safeSetUITextLabel(tile.cd, medicRemaining > 0 ? fmtClock(medicRemaining) : msg(STR_UI_READY));
            safeSetUITextColor(tile.cd, isMedicClass ? (showSelectedMedicTimer ? COLOR_GRAY : (medicReady ? COLOR_READY_GREEN : COLOR_WARNING_YELLOW)) : COLOR_GRAY);
            safeSetUIWidgetVisible(tile.cd, !isMedicClass || medicRemaining <= 0 || showSelectedMedicTimer);
            safeSetUITextLabel(tile.cs, msg(STR_SYS_COUNTER, count));
            safeSetUITextLabel(tile.ct, msg(STR_SYS_COUNTER, count));
            safeSetUITextColor(tile.s, COLOR_GRAY);
            safeSetUITextColor(tile.cs, COLOR_DARK_BLACK);
            safeSetUITextColor(tile.ct, count > 0 ? COLOR_WHITE : COLOR_GRAY);
            setTileVis(tile, enabled, focused);
            if (tile.i) mod.SetUIImageColor(tile.i, enabled ? COLOR_NOT_READY_RED : COLOR_GRAY);
            tile.sig = sig;
        }
    }
    for (let i = 0; i < cache.rows.length; i++) {
        const row = cache.rows[i];
        const launcherItem = cfg.launchers[i];
        const pool = launcherItem.pool;
        const poolEntry = pool ? launcherPoolState?.[i] : null;
        const poolCount = pool ? (poolEntry?.c ?? 0) : 1;
        const poolRemaining = pool ? Math.max(0, (poolEntry?.n ?? 0) - now) : 0;
        const poolReady = !pool || poolCount > 0;
        const launcherAlreadyHas = ownedByLockerState(slotsState, launcherItem.gadget);
        const launcherEnabled = isEngineerClass && launcherReady && poolReady && !gadgetBlocked && !launcherAlreadyHas;
        const launcherCount = pool ? poolCount : (launcherReady ? 1 : 0);
        const showSelectedLauncherTimer = isEngineerClass && launcherRemaining > 0 && launch.s === i;
        const focused = focusedKey === `row:${i}`;
        const sig = [
            launcherEnabled ? 1 : 0,
            launcherCount,
            launcherRemaining > 0 ? Math.ceil(launcherRemaining) : 0,
            pool ? Math.ceil(poolRemaining) : 0,
            showSelectedLauncherTimer ? 1 : 0,
            isEngineerClass ? 1 : 0,
            pool ? 1 : 0,
            launcherAlreadyHas ? 1 : 0,
            focused ? 1 : 0,
        ].join("|");
        if (row.sig !== sig) {
            setTileHeaderWidgets(row, launcherItem.labelKey, launcherEnabled ? COLOR_READY_GREEN : isEngineerClass ? COLOR_GRAY : COLOR_NOT_READY_RED);
            safeSetUITextLabel(row.cd, launcherRemaining > 0 ? launcherMessage : msg(STR_UI_READY));
            safeSetUITextColor(row.cd, isEngineerClass ? (showSelectedLauncherTimer ? COLOR_GRAY : launcherColor) : COLOR_GRAY);
            safeSetUIWidgetVisible(row.cd, !isEngineerClass || launcherRemaining <= 0 || showSelectedLauncherTimer);
            safeSetUITextLabel(row.cs, msg(STR_SYS_COUNTER, launcherCount));
            safeSetUITextLabel(row.ct, msg(STR_SYS_COUNTER, launcherCount));
            safeSetUITextColor(row.cs, COLOR_DARK_BLACK);
            safeSetUITextColor(row.ct, launcherCount > 0 ? COLOR_WHITE : COLOR_GRAY);
            setActVis(row, launcherEnabled, focused);
            const rowButtonIcon = row.i;
            if (rowButtonIcon) {
                mod.SetUIImageColor(rowButtonIcon, launcherEnabled ? COLOR_NOT_READY_RED : COLOR_GRAY);
            }
            safeSetUITextColor(row.s, COLOR_GRAY);
            row.sig = sig;
        }
    }
    const ammoCount = Math.max(0, Math.min(cfg.ammoMaxCharges, launch.aC));
    const ammoRemaining = Math.max(0, launch.aN - now);
    // Per-launcher cap gate: when the launcher slot is at max ammo (loaded + magazine), dim the
    // tile so charges aren't wasted on no-op increments. Caps are configured per-launcher in
    // ACTIVE_GADGET_CONFIG (RPG=6, AT4=5, Stinger=6); omitting maxAmmo skips the gate.
    let atCap = false;
    if (launcherSlotKnown) {
        const launcherSlot = slotWithLauncher(slotsState)!;
        const launcherGadget = launcherSlot === mod.InventorySlots.GadgetOne ? slotsState.g1.gadget : slotsState.g2.gadget;
        const maxAmmo = launcherMaxAmmoFor(launcherGadget);
        if (maxAmmo !== undefined) {
            let loaded = 0, mag = 0;
            try { loaded = Math.max(0, mod.GetInventoryAmmo(eventPlayer, launcherSlot)); } catch {}
            try { mag = Math.max(0, mod.GetInventoryMagazineAmmo(eventPlayer, launcherSlot)); } catch {}
            atCap = (loaded + mag) >= maxAmmo;
        }
    }
    // Ammo enabled only when state says a launcher slot exists. giveRocketCharge refuses when
    // slotWithLauncher is undefined, so we must not render a "ready" tile that would consume
    // a charge for nothing.
    const ammoEnabled = isEngineerClass && ammoCount > 0 && launcherSlotKnown && !gadgetBlocked && !atCap;
    const ammoOverlayMessage = msg(STR_SYS_COUNTER, ammoCount);
    {
        const focused = focusedKey === "e";
        const sig = [
            ammoEnabled ? 1 : 0,
            ammoCount,
            ammoRemaining > 0 ? Math.ceil(ammoRemaining) : 0,
            isEngineerClass ? 1 : 0,
            hasLauncher ? 1 : 0,
            atCap ? 1 : 0,
            focused ? 1 : 0,
        ].join("|");
        if (cache.e.sig !== sig) {
            setTileHeaderWidgets(cache.e, STR_UI_LAUNCHER_AMMO, ammoEnabled ? COLOR_READY_GREEN : isEngineerClass ? COLOR_GRAY : COLOR_NOT_READY_RED);
            safeSetUITextLabel(
                cache.e.cd,
                !isEngineerClass || !hasLauncher
                    ? msg(STR_UI_NO_LAUNCHER)
                    : (ammoRemaining > 0
                        ? fmtClock(ammoRemaining)
                        : (atCap ? msg(STR_UI_LAUNCHER_AT_CAP) : msg(STR_UI_READY)))
            );
            safeSetUITextColor(
                cache.e.cd,
                !isEngineerClass || !hasLauncher || !launcherSlotKnown
                    ? COLOR_GRAY
                    : (ammoRemaining > 0
                        ? COLOR_WARNING_YELLOW
                        : (atCap ? COLOR_GRAY : COLOR_READY_GREEN))
            );
            safeSetUITextLabel(cache.e.cs, ammoOverlayMessage);
            safeSetUITextLabel(cache.e.ct, ammoOverlayMessage);
            safeSetUITextColor(cache.e.s, COLOR_GRAY);
            safeSetUITextColor(cache.e.cs, COLOR_DARK_BLACK);
            safeSetUITextColor(cache.e.ct, ammoEnabled || ammoCount > 0 ? COLOR_WHITE : COLOR_GRAY);
            setTileVis(cache.e, ammoEnabled, focused);
            if (cache.e.i) {
                mod.SetUIImageColor(cache.e.i, ammoEnabled ? COLOR_NOT_READY_RED : COLOR_GRAY);
            }
            cache.e.sig = sig;
        }
    }
    for (let i = 0; i < cache.q.length; i++) {
        const tile = cache.q[i];
        const reconItem = cfg.recon[i];
        const remaining = i === 0 ? reconDroneRemaining : reconSharedRemaining;
        const ready = remaining <= 0;
        const reconAlreadyHas = tileOwned(eventPlayer, slotsState, reconItem.gadget, reconItem.slot);
        const enabled = isReconClass && ready && !gadgetBlocked && !reconAlreadyHas;
        const count = ready ? reconItem.maxCount : 0;
        const showSelectedReconTimer = i > 0 && isReconClass && reconSharedRemaining > 0 && state.rgS === i;
        const focused = focusedKey === `q:${i}`;
        const sig = [
            enabled ? 1 : 0,
            count,
            remaining > 0 ? Math.ceil(remaining) : 0,
            showSelectedReconTimer ? 1 : 0,
            isReconClass ? 1 : 0,
            i,
            reconAlreadyHas ? 1 : 0,
            focused ? 1 : 0,
        ].join("|");
        if (tile.sig !== sig) {
            setTileHeaderWidgets(tile, reconItem.labelKey, enabled ? COLOR_READY_GREEN : isReconClass ? COLOR_GRAY : COLOR_NOT_READY_RED);
            safeSetUITextLabel(tile.cd, remaining > 0 ? fmtClock(remaining) : msg(STR_UI_READY));
            safeSetUITextColor(tile.cd, isReconClass ? (showSelectedReconTimer ? COLOR_GRAY : (ready ? COLOR_READY_GREEN : COLOR_WARNING_YELLOW)) : COLOR_GRAY);
            safeSetUIWidgetVisible(tile.cd, !isReconClass || i === 0 || reconSharedRemaining <= 0 || showSelectedReconTimer);
            safeSetUITextLabel(tile.cs, msg(STR_SYS_COUNTER, count));
            safeSetUITextLabel(tile.ct, msg(STR_SYS_COUNTER, count));
            safeSetUITextColor(tile.s, COLOR_GRAY);
            safeSetUITextColor(tile.cs, COLOR_DARK_BLACK);
            safeSetUITextColor(tile.ct, count > 0 ? COLOR_WHITE : COLOR_GRAY);
            setTileVis(tile, enabled, focused);
            if (tile.i) {
                mod.SetUIImageColor(tile.i, enabled ? COLOR_NOT_READY_RED : COLOR_GRAY);
            }
            tile.sig = sig;
        }
    }
}
function closeArmMenu(eventPlayer: mod.Player | number): void {
    let pid: number | undefined;
    let player: mod.Player | undefined;
    if (mod.IsType(eventPlayer, mod.Types.Player)) {
        player = eventPlayer as mod.Player;
        pid = safeGetPlayerId(player);
    } else {
        pid = eventPlayer as number;
        player = safeFindPlayer(pid);
    }
    if (pid === undefined) return;
    if (!isArmOpen(pid)) return;
    setArmOpen(pid, false);
    setArmObj(pid, undefined);
    // Wipe the probed slot contents so the next open re-probes fresh (avoids drift from
    // between-session respawns, kit pickups, class changes). The slot toggle is a player
    // preference -- preserve it across close/reopen. Round-start reset still clears it via
    // State.players wipe.
    delete State.players.lockerSlots[pid];
    const cache = State.hudCache.ammoResupplyMenuCache[pid];
    if (cache) showArmMenu(cache, false);
    if (player && mod.IsPlayerValid(player)) {
        setUIInputModeForPlayer(player, false);
        updateVehicleDeployTimerHudForPlayer(player);
    } else {
        delete State.players.uiInputEnabledByPid[pid];
    }
}
function openArmMenu(eventPlayer: mod.Player, objId: number): boolean {
    if (!isValidPlayer(eventPlayer)) return false;
    const pid = safeGetPlayerId(eventPlayer);
    if (pid === undefined) return false;
    if (!State.players.deployedByPid[pid]) return false;
    if (State.players.readyDialogData[pid]?.dialogVisible) {
        hideReadyDialogUI(eventPlayer);
    }
    if (isVehicleDeployLiveMenuOpenForPid(pid)) {
        closeVehicleDeployLiveMenuForPlayer(eventPlayer);
    }
    if (FEATURE_PERF_DIAG && !armCacheOk(State.hudCache.ammoResupplyMenuCache[pid])) {
        incrementUiCachePerfCounter(pid, "gadget", "cold");
    }
    // Wave 3 Ship 3 (v1.411): route through registry. Dispatcher's supplyBox handler
    // short-circuits on cache hit, so subsequent opens are still essentially free.
    triggerLazyBuild('supplyBox', pid);
    const cache = State.hudCache.ammoResupplyMenuCache[pid];
    if (!cache || !armCacheOk(cache)) return false;
    setArmObj(pid, objId);
    // Seed authoritative slot state BEFORE the first refresh so tile dup-dim and the Launcher
    // Ammo enable flag read from accurate data on the opening frame.
    initLockerSlotStateFromProbe(pid, eventPlayer);
    const probed = probeLauncherSlot(eventPlayer);
    if (probed.slot !== undefined && probed.gadget !== undefined) {
        const slotsState = State.players.lockerSlots[pid];
        if (slotsState) {
            const siblingEntry = probed.slot === mod.InventorySlots.GadgetOne
                ? slotsState.g2 : slotsState.g1;
            if (siblingEntry.kind === "launcher") {
                siblingEntry.kind = siblingEntry.gadget ? "gadget" : "unknown";
                siblingEntry.source = "probed";
            }
        }
        recordPlacement(pid, probed.slot, probed.gadget, "launcher");
    }
    ensureSlotToggleState(pid);
    refreshArmMenu(eventPlayer, objId, cache, true);
    showArmMenu(cache, true);
    setArmOpen(pid, true);
    setUIInputModeForPlayer(eventPlayer, true);
    // Launch self-terminating 1Hz loop to drive cooldown timer display; supersedes any prior loop for this player.
    const armToken = (State.players.armT[pid] ?? 0) + 1;
    State.players.armT[pid] = armToken;
    void runArmMenuRefreshLoop(pid, armToken);
    return true;
}
function prebuildArmMenu(eventPlayer: mod.Player): void {
    const cache = buildArmMenuHidden(eventPlayer);
    if (!cache) return;
    showArmMenu(cache, false);
}
function handleArmMenuEvt(eventPlayer: mod.Player, eventUIWidget: mod.UIWidget, eventUIButtonEvent: mod.UIButtonEvent): boolean {
    const pid = safeGetPlayerId(eventPlayer);
    if (pid === undefined || !isArmOpen(pid)) return false;
    const widgetName = mod.GetUIWidgetName(eventUIWidget);
    if (!widgetName) return false;
    const closeButtonName = ammoResupplyMenuName("CloseButton", pid);
    const closeButtonLabelName = ammoResupplyMenuName("CloseButtonLabel", pid);
    const closeButtonBorderName = `${closeButtonName}_BORDER`;
    const medicButtonName = ammoResupplyMenuName("MedicSmokeButton", pid);
    const medicButtonBorderName = `${medicButtonName}_BORDER`;
    const chargeButtonName = ammoResupplyMenuName("AmmoChargeButton", pid);
    const chargeButtonBorderName = `${chargeButtonName}_BORDER`;
    const isCloseWidget =
        widgetName === closeButtonName
        || widgetName === closeButtonLabelName
        || widgetName === closeButtonBorderName
        || widgetName.indexOf(closeButtonName) >= 0
        || widgetName.indexOf(closeButtonLabelName) >= 0;
    const isMedicWidget = widgetName === medicButtonName || widgetName === medicButtonBorderName;
    const isChargeWidget = widgetName === chargeButtonName || widgetName === chargeButtonBorderName;
    let toggleClassIdx = -1;
    for (let i = 0; i < 4; i++) {
        const prevName = ammoResupplyMenuName("SlotTogglePrev", pid, i);
        const nextName = ammoResupplyMenuName("SlotToggleNext", pid, i);
        if (widgetName === prevName || widgetName === `${prevName}_BORDER`
            || widgetName === nextName || widgetName === `${nextName}_BORDER`) {
            toggleClassIdx = i;
            break;
        }
    }
    if (toggleClassIdx >= 0) {
        if (!mod.Equals(eventUIButtonEvent, mod.UIButtonEvent.ButtonDown)) return true;
        const currentClassIdx = getPlayerClassHdrIndex(eventPlayer);
        if (toggleClassIdx !== currentClassIdx) return true;
        ensureSlotToggleState(pid);
        const ts = State.players.lockerSlotToggle[pid];
        if (!ts) return true;
        ts.slotByClass[toggleClassIdx] = ts.slotByClass[toggleClassIdx] === 1 ? 2 : 1;
        playArmSfx(eventPlayer);
        const objId = getArmObj(pid);
        const cache = State.hudCache.ammoResupplyMenuCache[pid];
        if (objId !== undefined && cache) refreshArmMenu(eventPlayer, objId, cache, true);
        return true;
    }
    const cfg = ACTIVE_GADGET_CONFIG;
    let medicTileIndex = -1;
    for (let i = 0; i < cfg.medicItems.length; i++) {
        const buttonName = ammoResupplyMenuName(`${cfg.medicItems[i].name}Button`, pid);
        if (widgetName === buttonName || widgetName === `${buttonName}_BORDER`) { medicTileIndex = i; break; }
    }
    let assaultTileIndex = -1;
    for (let i = 0; i < cfg.assault.length; i++) {
        const buttonName = ammoResupplyMenuName(`${cfg.assault[i].name}Button`, pid);
        if (widgetName === buttonName || widgetName === `${buttonName}_BORDER`) { assaultTileIndex = i; break; }
    }
    let reconTileIndex = -1;
    for (let i = 0; i < cfg.recon.length; i++) {
        const buttonName = ammoResupplyMenuName(`${cfg.recon[i].name}Button`, pid);
        if (widgetName === buttonName || widgetName === `${buttonName}_BORDER`) { reconTileIndex = i; break; }
    }
    let actionIndex = -1;
    for (let i = 0; i < cfg.launchers.length; i++) {
        const buttonName = ammoResupplyMenuName("ActionButton", pid, i);
        if (widgetName === buttonName || widgetName === `${buttonName}_BORDER`) { actionIndex = i; break; }
    }
    if (!isCloseWidget && !isMedicWidget && !isChargeWidget && medicTileIndex < 0 && assaultTileIndex < 0 && reconTileIndex < 0 && actionIndex < 0) return false;
    // Stable per-tile key used by refreshArmMenu's per-tile sig + the disabled-focused border
    // indicator (see setTileVis / setActVis). Close button is intentionally excluded — it's
    // always enabled, so the disabled-focused state is never reachable.
    let tileKey: string | undefined;
    if (isMedicWidget) tileKey = "m";
    else if (isChargeWidget) tileKey = "e";
    else if (assaultTileIndex >= 0) tileKey = `a:${assaultTileIndex}`;
    else if (medicTileIndex >= 0) tileKey = `x:${medicTileIndex}`;
    else if (actionIndex >= 0) tileKey = `row:${actionIndex}`;
    else if (reconTileIndex >= 0) tileKey = `q:${reconTileIndex}`;
    // FocusIn fires when a button is navigated-to (controller/keyboard) or hovered (mouse) —
    // update help text and track the focused tile so the next refresh paints the disabled-
    // focused border indicator on it (and clears it from the previous focused tile).
    if (mod.Equals(eventUIButtonEvent, mod.UIButtonEvent.FocusIn)) {
        const cache = State.hudCache.ammoResupplyMenuCache[pid];
        if (cache?.helpText) {
            let helpKey: number | undefined;
            if (assaultTileIndex >= 0) helpKey = HELP_KEY_MAP[cfg.assault[assaultTileIndex].name];
            else if (isMedicWidget) helpKey = HELP_KEY_MAP[cfg.medicSmoke.name];
            else if (medicTileIndex >= 0) helpKey = HELP_KEY_MAP[cfg.medicItems[medicTileIndex].name];
            else if (actionIndex >= 0) helpKey = ENG_HELP_KEYS[actionIndex];
            else if (isChargeWidget) helpKey = STR_UI_HELP_LAUNCHER_AMMO;
            else if (reconTileIndex >= 0) helpKey = HELP_KEY_MAP[cfg.recon[reconTileIndex].name];
            if (helpKey) safeSetUITextLabel(cache.helpText, msg(helpKey));
        }
        if (tileKey !== undefined) {
            const objId = getArmObj(pid);
            if (cache && objId !== undefined && State.players.armFocusedTileKeyByPid[pid] !== tileKey) {
                State.players.armFocusedTileKeyByPid[pid] = tileKey;
                refreshArmMenu(eventPlayer, objId, cache, true);
            }
        }
        return true;
    }
    // FocusOut clears the focus indicator when the player navigates away from a tile (only if
    // the leaving tile is still the one we have tracked — guards against out-of-order events).
    if (mod.Equals(eventUIButtonEvent, mod.UIButtonEvent.FocusOut)) {
        if (tileKey !== undefined && State.players.armFocusedTileKeyByPid[pid] === tileKey) {
            const objId = getArmObj(pid);
            const cache = State.hudCache.ammoResupplyMenuCache[pid];
            delete State.players.armFocusedTileKeyByPid[pid];
            if (cache && objId !== undefined) {
                refreshArmMenu(eventPlayer, objId, cache, true);
            }
        }
        return true;
    }
    if (!mod.Equals(eventUIButtonEvent, mod.UIButtonEvent.ButtonDown)) {
        if (isCloseWidget && mod.Equals(eventUIButtonEvent, mod.UIButtonEvent.ButtonUp)) closeArmMenu(eventPlayer);
        return true;
    }
    if (isCloseWidget) {
        closeArmMenu(eventPlayer);
        return true;
    }
    // Round-start gadget delay blocks all tile grants. Menu stays open, previews/help still work.
    if (!isMatchLive() || isRoundStartGadgetDelayActive()) return true;
    const objId = getArmObj(pid);
    const cache = State.hudCache.ammoResupplyMenuCache[pid];
    if (objId === undefined || !cache) return true;
    const state = ensArm(pid);
    const launch = ensArmL(pid);
    const assaultGroup = ensArmG(pid);
    const now = mod.GetMatchTimeElapsed();
    const teamId = safeGetTeamNumberFromPlayer(eventPlayer, 0);
    const isAssaultClass = isCls(eventPlayer, mod.SoldierClass.Assault);
    const isMedicClass = isCls(eventPlayer, mod.SoldierClass.Support);
    const isEngineerClass = isCls(eventPlayer, mod.SoldierClass.Engineer);
    const isReconClass = isCls(eventPlayer, mod.SoldierClass.Recon);
    const smokeState = ensSmk(teamId);
    const assaultState = ensAsg(teamId);
    const launcherPoolState = ensAsgL(teamId);
    syncArm(launch, now);
    if (smokeState) syncSmk(smokeState, now);
    if (assaultState) syncAsg(assaultState, now);
    if (launcherPoolState) syncAsgL(launcherPoolState, now);
    if (assaultTileIndex >= 0) {
        if (!isAssaultClass || !assaultState) return true;
        const item = cfg.assault[assaultTileIndex];
        const asgEntry = assaultState[assaultTileIndex];
        if (!asgEntry) return true;
        const count = asgEntry.c;
        const nextReady = asgEntry.n;
        if (assaultGroup.n > now || count <= 0 || nextReady > now) return true;
        const assaultSlot = (item.slot === mod.InventorySlots.GadgetOne || item.slot === mod.InventorySlots.GadgetTwo)
            ? slotFromToggle(pid, 0)
            : item.slot;
        if (giveAssaultItem(eventPlayer, item.gadget, assaultSlot, assaultSlot === mod.InventorySlots.Callins, pid)) {
            const next = now + item.cooldownSeconds;
            assaultGroup.n = next;
            assaultGroup.s = assaultTileIndex;
            asgEntry.c = 0;
            asgEntry.n = next;
            playArmSfx(eventPlayer);
            refreshOpenArm(teamId, true);
        }
        return true;
    }
    if (isMedicWidget) {
        if (!isMedicClass || !smokeState || smokeState.c <= 0 || smokeState.n > now) return true;
        if (giveMedicSmoke(eventPlayer)) {
            smokeState.c = 0;
            smokeState.n = now + cfg.medicSmoke.cooldownSeconds;
            playArmSfx(eventPlayer);
            refreshOpenArm(teamId, true);
        }
        return true;
    }
    if (medicTileIndex >= 0) {
        if (!isMedicClass || (state.mN ?? 0) > now) return true;
        const item = cfg.medicItems[medicTileIndex];
        if (giveAssaultItem(eventPlayer, item.gadget, slotFromToggle(pid, 2), false, pid)) {
            state.mN = now + item.cooldownSeconds;
            state.mS = medicTileIndex;
            playArmSfx(eventPlayer);
            refreshArmMenu(eventPlayer, objId, cache, true);
        }
        return true;
    }
    if (actionIndex >= 0) {
        if (!isEngineerClass || launch.lN > now) return true;
        const launcherItem = cfg.launchers[actionIndex];
        const pool = launcherItem.pool;
        const poolEntry = pool ? launcherPoolState?.[actionIndex] : undefined;
        if (pool && (!poolEntry || poolEntry.c <= 0)) return true;
        if (giveLauncher(eventPlayer, launcherItem.gadget, pid, slotFromToggle(pid, 1))) {
            launch.lN = now + cfg.launcherCooldownSeconds;
            launch.s = actionIndex;
            if (pool && poolEntry) {
                poolEntry.c -= 1;
                if (poolEntry.n <= now) poolEntry.n = now + pool.rechargeSeconds;
            }
            playArmSfx(eventPlayer);
            if (pool) refreshOpenArm(teamId, true);
            else refreshArmMenu(eventPlayer, objId, cache, true);
        }
        return true;
    }
    if (reconTileIndex >= 0) {
        if (!isReconClass) return true;
        const item = cfg.recon[reconTileIndex];
        const nextReady = reconTileIndex === 0 ? state.rdN : state.rgN;
        if (nextReady > now) return true;
        const reconSlot = (item.slot === mod.InventorySlots.GadgetOne || item.slot === mod.InventorySlots.GadgetTwo)
            ? slotFromToggle(pid, 3)
            : item.slot;
        if (giveReconItem(eventPlayer, item.gadget, reconSlot, pid)) {
            if (reconTileIndex === 0) state.rdN = now + item.cooldownSeconds;
            else {
                state.rgN = now + item.cooldownSeconds;
                state.rgS = reconTileIndex;
            }
            playArmSfx(eventPlayer);
            refreshArmMenu(eventPlayer, objId, cache, true);
        }
        return true;
    }
    if (isChargeWidget) {
        if (launch.aC <= 0) return true;
        if (giveRocketCharge(eventPlayer, pid)) {
            launch.aC = Math.max(0, launch.aC - 1);
            if (launch.aC < cfg.ammoMaxCharges && launch.aN <= now) launch.aN = now + cfg.ammoCooldownSeconds;
            playArmSfx(eventPlayer);
            refreshArmMenu(eventPlayer, objId, cache, true);
        }
        return true;
    }
    return false;
}

