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
const SY = -268;
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
const ARM_SCHEMA = 5;

//#region -------------------- Gadget Locker Config --------------------

// Default gadget locker layout matching the original hardcoded items.
const DEFAULT_GADGET_LOCKER_CONFIG: GadgetLockerConfig = {
    assault: [
        { name: "Artillery",     labelKey: STR_UI_ARTILLERY_STRIKE, gadget: mod.Gadgets.CallIn_Artillery_Strike,     slot: mod.InventorySlots.Callins,   cooldownSeconds: 360, teamShared: true, maxCount: 1, iconSize: 56, iconY: IY },
        { name: "SpawnBeacon",   labelKey: STR_UI_SPAWN_BEACON,     gadget: mod.Gadgets.Deployable_Deploy_Beacon,    slot: mod.InventorySlots.GadgetTwo, cooldownSeconds: 600, teamShared: true, maxCount: 1, iconSize: 36, iconY: IY },
        { name: "AssaultLadder", labelKey: STR_UI_ASSAULT_LADDER,   gadget: mod.Gadgets.Misc_Assault_Ladder,         slot: mod.InventorySlots.GadgetTwo, cooldownSeconds: 480, teamShared: true, maxCount: 1, iconSize: 36, iconY: IY },
    ],
    launchers: [
        { labelKey: STR_UI_RPG,     gadget: mod.Gadgets.Launcher_Unguided_Rocket },
        { labelKey: STR_UI_AT4,     gadget: mod.Gadgets.Launcher_Aim_Guided },
        { labelKey: STR_UI_STINGER, gadget: mod.Gadgets.Launcher_Air_Defense },
    ],
    launcherCooldownSeconds: 180,
    ammoCooldownSeconds: 60,
    ammoMaxCharges: 3,
    medicItems: [
        { name: "MedicGrenadeIntercept", labelKey: STR_UI_GRENADE_INTERCEPT, gadget: mod.Gadgets.Deployable_Grenade_Intercept_System, slot: mod.InventorySlots.GadgetTwo, cooldownSeconds: 180, teamShared: false, maxCount: 1, iconSize: 36, iconY: IY },
        { name: "MedicMissileIntercept", labelKey: STR_UI_MISSILE_INTERCEPT, gadget: mod.Gadgets.Deployable_Missile_Intercept_System, slot: mod.InventorySlots.GadgetTwo, cooldownSeconds: 180, teamShared: false, maxCount: 1, iconSize: 36, iconY: IY },
    ],
    medicSmoke: { name: "MedicSmoke", labelKey: STR_UI_SMOKE_SCREEN, gadget: mod.Gadgets.CallIn_Smoke_Screen, slot: mod.InventorySlots.Callins, cooldownSeconds: 300, teamShared: true, maxCount: 1 },
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
    const zero = mod.CreateVector(0, 0, 0);
    try {
        State.round.armSfx.handle = mod.SpawnObject(ARM_SFX_PREFAB, zero, zero);
    } catch { State.round.armSfx.handle = undefined; }
    State.round.armSfx.ready = State.round.armSfx.handle !== undefined && State.round.armSfx.handle !== null;
}
// Plays the gadget selection SFX for a specific player.
function playArmSfx(player: mod.Player): void {
    if (!player || !mod.IsPlayerValid(player)) return;
    primeArmSfx();
    if (!State.round.armSfx.ready) return;
    try { mod.PlaySound(State.round.armSfx.handle, ARM_SFX_AMPLITUDE, player); } catch {}
}
function armScope(isTeamShared: boolean): mod.Message {
    return mod.Message(isTeamShared ? STR_UI_ONE_PER_TEAM : STR_UI_ONE_PER_PLAYER);
}
function armChoose(): mod.Message {
    return mod.Message(STR_UI_CHOOSE_ONLY_ONE);
}
const DURATION_LABEL_MAP: Record<number, number> = {
    60: mod.stringkeys.twl.ui.duration1m,
    180: mod.stringkeys.twl.ui.duration3m,
    300: mod.stringkeys.twl.ui.duration5m,
    360: mod.stringkeys.twl.ui.duration6m,
    480: mod.stringkeys.twl.ui.duration8m,
    600: mod.stringkeys.twl.ui.duration10m,
};
function armDur(seconds: number): mod.Message {
    return mod.Message(DURATION_LABEL_MAP[seconds] ?? STR_UI_READY);
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
        sv: ARM_SCHEMA,
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
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return false;
    try {
        return mod.IsSoldierClass(eventPlayer, soldierClass);
    } catch {
        return false;
    }
}
function fmtClock(secondsRemaining: number): mod.Message {
    if (secondsRemaining <= 0) {
        return mod.Message(STR_UI_READY);
    }
    const whole = Math.max(0, Math.ceil(secondsRemaining));
    const minutes = Math.floor(whole / 60);
    const seconds = whole % 60;
    const secondTens = Math.floor(seconds / 10);
    const secondOnes = seconds % 10;
    return mod.Message(
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
        mod.CreateVector(0, 0, 0),
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
            lines[i] ?? mod.Message(STR_UI_READY),
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
    if (cacheEntry.button) mod.EnableUIButtonEvent(cacheEntry.button, mod.UIButtonEvent.FocusIn, true);
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
        mod.Message(STR_UI_READY),
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
        mod.Message(mod.stringkeys.twl.system.genericCounter, defaultCount),
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
        mod.Message(mod.stringkeys.twl.system.genericCounter, defaultCount),
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
function setActVis(
    row: AmmoResupplyMenuActionRowCacheEntry,
    enabled: boolean
): void {
    safeSetUIWidgetBgColor(row.button, enabled ? COLOR_BUTTON_BASE : COLOR_GRAY_DARK);
    safeSetUIWidgetBgAlpha(row.button, enabled ? BUTTON_OPACITY_BASE : DIS_A);
    safeSetUIWidgetBgColor(row.bb, enabled ? COLOR_BUTTON_BORDER : COLOR_GRAY_DARK);
    safeSetUIWidgetBgAlpha(row.bb, enabled ? BUTTON_BORDER_OPACITY : DIS_A);
    if (row.button) mod.SetUIButtonEnabled(row.button, enabled);
}
function setTileVis(
    charge: AmmoResupplyMenuChargeCacheEntry,
    enabled: boolean
): void {
    safeSetUIWidgetBgColor(charge.button, enabled ? COLOR_BUTTON_BASE : COLOR_GRAY_DARK);
    safeSetUIWidgetBgAlpha(charge.button, enabled ? BUTTON_OPACITY_BASE : DIS_A);
    safeSetUIWidgetBgColor(charge.bb, enabled ? COLOR_BUTTON_BORDER : COLOR_GRAY_DARK);
    safeSetUIWidgetBgAlpha(charge.bb, enabled ? BUTTON_BORDER_OPACITY : DIS_A);
    if (charge.button) mod.SetUIButtonEnabled(charge.button, enabled);
}
function refreshOpenArm(teamId: TeamID | 0 = 0, force: boolean = false): void {
    for (const pidKey in State.players.armO) {
        if (State.players.armO[Number(pidKey)] !== true) continue;
        const pid = Number(pidKey);
        const player = safeFindPlayer(pid);
        if (!player || !mod.IsPlayerValid(player)) continue;
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
// Returns true if the player has any launcher from the active gadget config equipped.
function hasManagedL(eventPlayer: mod.Player): boolean {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return false;
    const launchers = ACTIVE_GADGET_CONFIG.launchers;
    for (let i = 0; i < launchers.length; i++) {
        try {
            if (mod.HasEquipment(eventPlayer, launchers[i].gadget)) return true;
        } catch {}
    }
    return false;
}
function giveLauncher(eventPlayer: mod.Player, gadget: number): boolean {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return false;
    try {
        if (mod.HasEquipment(eventPlayer, gadget)) {
            return false;
        }
    } catch {}
    try {
        mod.RemoveEquipment(eventPlayer, mod.InventorySlots.GadgetTwo);
    } catch {}
    try {
        mod.AddEquipment(eventPlayer, gadget, mod.InventorySlots.GadgetTwo);
    } catch {
        return false;
    }
    try {
        mod.SetInventoryAmmo(eventPlayer, mod.InventorySlots.GadgetTwo, 1);
    } catch {}
    try {
        mod.SetInventoryMagazineAmmo(eventPlayer, mod.InventorySlots.GadgetTwo, 0);
    } catch {}
    return true;
}
function giveMedicSmoke(eventPlayer: mod.Player): boolean {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return false;
    const smokeGadget = ACTIVE_GADGET_CONFIG.medicSmoke.gadget;
    let hasSmoke = false;
    try {
        hasSmoke = mod.HasEquipment(eventPlayer, smokeGadget);
    } catch {}
    if (hasSmoke) return false;
    try {
        mod.RemoveEquipment(eventPlayer, mod.InventorySlots.Callins);
    } catch {}
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
function giveAssaultItem(
    eventPlayer: mod.Player,
    gadget: number,
    inventorySlot: mod.InventorySlots,
    forceSwitch: boolean
): boolean {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return false;
    try {
        mod.RemoveEquipment(eventPlayer, inventorySlot);
    } catch {}
    try {
        mod.AddEquipment(eventPlayer, gadget, inventorySlot);
    } catch {
        return false;
    }
    if (forceSwitch) {
        try {
            mod.ForceSwitchInventory(eventPlayer, inventorySlot);
        } catch {}
    }
    return true;
}
function giveReconItem(
    eventPlayer: mod.Player,
    gadget: number,
    inventorySlot: mod.InventorySlots
): boolean {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return false;
    try {
        mod.RemoveEquipment(eventPlayer, inventorySlot);
    } catch {}
    try {
        mod.AddEquipment(eventPlayer, gadget, inventorySlot);
    } catch {
        return false;
    }
    if (inventorySlot === mod.InventorySlots.Throwable) {
        try {
            mod.SetInventoryAmmo(eventPlayer, mod.InventorySlots.Throwable, 2);
        } catch {}
    } else if (gadget === mod.Gadgets.Misc_Demolition_Charge) {
        try {
            mod.SetInventoryAmmo(eventPlayer, mod.InventorySlots.GadgetTwo, 3);
        } catch {}
    }
    return true;
}
function giveRocketCharge(eventPlayer: mod.Player): boolean {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return false;
    if (!hasManagedL(eventPlayer)) return false;
    let ammo = 0;
    let magAmmo = 0;
    try {
        ammo = Math.max(0, mod.GetInventoryAmmo(eventPlayer, mod.InventorySlots.GadgetTwo));
    } catch {}
    try {
        magAmmo = Math.max(0, mod.GetInventoryMagazineAmmo(eventPlayer, mod.InventorySlots.GadgetTwo));
    } catch {}
    if (ammo <= 0) {
        try {
            mod.SetInventoryAmmo(eventPlayer, mod.InventorySlots.GadgetTwo, 1);
        } catch {
            return false;
        }
        return true;
    }
    try {
        mod.SetInventoryMagazineAmmo(eventPlayer, mod.InventorySlots.GadgetTwo, magAmmo + 1);
    } catch {
        return false;
    }
    return true;
}
function updateArmMenu(eventPlayer: mod.Player): void {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
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
        if (!player || !mod.IsPlayerValid(player)) return;
        const objId = getArmObj(pid);
        if (objId === undefined) return;
        const cache = State.hudCache.ammoResupplyMenuCache[pid];
        if (!cache) return;
        refreshArmMenu(player, objId, cache);
    }
}
function buildArmMenuHidden(eventPlayer: mod.Player): AmmoResupplyMenuCacheEntry | undefined {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return undefined;
    const pid = safeGetPlayerId(eventPlayer);
    if (pid === undefined) return undefined;
    let cache = State.hudCache.ammoResupplyMenuCache[pid];
    if (!cache || cache.sv !== ARM_SCHEMA) {
        if (cache) {
            if (FEATURE_PERF_DIAG) {
                incrementUiCachePerfCounter(pid, "gadget", "invalid");
                incrementUiCachePerfCounter(pid, "gadget", "rebuilt");
            }
            destroyArmMenu(pid);
        } else {
            if (FEATURE_PERF_DIAG) incrementUiCachePerfCounter(pid, "gadget", "built");
        }
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
        mod.CreateVector(0, 0, 0),
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
        mod.Message(STR_UI_HELP_EMPTY),
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
        mod.Message(mod.stringkeys.twl.countdown.delayGadgets, 0),
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
            mod.Message(HDR_KEYS[i]),
            eventPlayer,
            root,
            22,
            false,
            READY_DIALOG_LABEL_TEXT_COLOR
        );
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
        if (rowBtn) mod.EnableUIButtonEvent(rowBtn, mod.UIButtonEvent.FocusIn, true);
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
            armScope(false),
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
            mod.Message(STR_UI_READY),
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
            mod.Message(mod.stringkeys.twl.system.genericCounter, 1),
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
            mod.Message(mod.stringkeys.twl.system.genericCounter, 1),
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
        mod.Message(STR_UI_READY),
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
        mod.Message(STR_UI_READY),
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
        mod.Message(STR_UI_READY),
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
        mod.Message(STR_UI_READY),
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
                safeSetUITextLabel(cache.gadgetDelayStatus, mod.Message(key, Math.ceil(gadgetRemaining)));
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
    syncArm(launch, now);
    if (smokeState) syncSmk(smokeState, now);
    if (assaultState) syncAsg(assaultState, now);
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
    const hasLauncher = hasManagedL(eventPlayer);
    const smokeCount = Math.max(0, Math.min(cfg.medicSmoke.maxCount, smokeState?.c ?? 0));
    const smokeRemaining = Math.max(0, (smokeState?.n ?? 0) - now);
    const smokeReady = smokeRemaining <= 0;
    const smokeEnabled = isMedicClass && smokeCount > 0 && smokeReady && !gadgetBlocked;
    const smokeMessage = smokeRemaining > 0 ? fmtClock(smokeRemaining) : mod.Message(STR_UI_READY);
    const smokeOverlayMessage = mod.Message(mod.stringkeys.twl.system.genericCounter, smokeCount);
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
        const enabled = isAssaultClass && assaultGroupRemaining <= 0 && ready && !gadgetBlocked;
        const showSelectedAssaultTimer = isAssaultClass && assaultGroupRemaining > 0 && assaultGroup.s === i;
        const hideAssaultTimer = isAssaultClass && assaultGroupRemaining > 0 && assaultGroup.s !== i;
        const sig = [
            enabled ? 1 : 0,
            count,
            remaining > 0 ? Math.ceil(remaining) : 0,
            showSelectedAssaultTimer ? Math.ceil(assaultGroupRemaining) : 0,
            hideAssaultTimer ? 1 : 0,
            isAssaultClass ? 1 : 0,
            assaultGroupRemaining > 0 ? 1 : 0,
        ].join("|");
        if (tile.sig !== sig) {
            const overlayMessage = mod.Message(mod.stringkeys.twl.system.genericCounter, count);
            setTileHeaderWidgets(tile, item.labelKey, enabled ? COLOR_READY_GREEN : isAssaultClass ? COLOR_GRAY : COLOR_NOT_READY_RED);
            safeSetUITextLabel(
                tile.cd,
                showSelectedAssaultTimer
                    ? fmtClock(assaultGroupRemaining)
                    : (remaining > 0 ? fmtClock(remaining) : mod.Message(STR_UI_READY))
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
            setTileVis(tile, enabled);
            if (tile.i) {
                mod.SetUIImageColor(tile.i, enabled ? COLOR_NOT_READY_RED : COLOR_GRAY);
            }
            tile.sig = sig;
        }
    }
    {
        const sig = [
            smokeEnabled ? 1 : 0,
            smokeCount,
            smokeRemaining > 0 ? Math.ceil(smokeRemaining) : 0,
            isMedicClass ? 1 : 0,
            smokeReady ? 1 : 0,
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
            setTileVis(cache.m, smokeEnabled);
            if (cache.m.i) {
                mod.SetUIImageColor(cache.m.i, smokeEnabled ? COLOR_NOT_READY_RED : COLOR_GRAY);
            }
            cache.m.sig = sig;
        }
    }
    for (let i = 0; i < cache.x.length; i++) {
        const tile = cache.x[i];
        const medicItem = cfg.medicItems[i];
        const enabled = isMedicClass && medicReady && !gadgetBlocked;
        const count = medicReady ? medicItem.maxCount : 0;
        const showSelectedMedicTimer = isMedicClass && medicRemaining > 0 && state.mS === i;
        const sig = [
            enabled ? 1 : 0,
            count,
            medicRemaining > 0 ? Math.ceil(medicRemaining) : 0,
            showSelectedMedicTimer ? 1 : 0,
            isMedicClass ? 1 : 0,
        ].join("|");
        if (tile.sig !== sig) {
            setTileHeaderWidgets(tile, medicItem.labelKey, enabled ? COLOR_READY_GREEN : isMedicClass ? COLOR_GRAY : COLOR_NOT_READY_RED);
            safeSetUITextLabel(tile.cd, medicRemaining > 0 ? fmtClock(medicRemaining) : mod.Message(STR_UI_READY));
            safeSetUITextColor(tile.cd, isMedicClass ? (showSelectedMedicTimer ? COLOR_GRAY : (medicReady ? COLOR_READY_GREEN : COLOR_WARNING_YELLOW)) : COLOR_GRAY);
            safeSetUIWidgetVisible(tile.cd, !isMedicClass || medicRemaining <= 0 || showSelectedMedicTimer);
            safeSetUITextLabel(tile.cs, mod.Message(mod.stringkeys.twl.system.genericCounter, count));
            safeSetUITextLabel(tile.ct, mod.Message(mod.stringkeys.twl.system.genericCounter, count));
            safeSetUITextColor(tile.s, COLOR_GRAY);
            safeSetUITextColor(tile.cs, COLOR_DARK_BLACK);
            safeSetUITextColor(tile.ct, count > 0 ? COLOR_WHITE : COLOR_GRAY);
            setTileVis(tile, enabled);
            if (tile.i) mod.SetUIImageColor(tile.i, enabled ? COLOR_NOT_READY_RED : COLOR_GRAY);
            tile.sig = sig;
        }
    }
    for (let i = 0; i < cache.rows.length; i++) {
        const row = cache.rows[i];
        const launcherEnabled = isEngineerClass && launcherReady && !gadgetBlocked;
        const launcherCount = launcherReady ? 1 : 0;
        const showSelectedLauncherTimer = isEngineerClass && launcherRemaining > 0 && launch.s === i;
        const sig = [
            launcherEnabled ? 1 : 0,
            launcherCount,
            launcherRemaining > 0 ? Math.ceil(launcherRemaining) : 0,
            showSelectedLauncherTimer ? 1 : 0,
            isEngineerClass ? 1 : 0,
        ].join("|");
        if (row.sig !== sig) {
            setTileHeaderWidgets(row, cfg.launchers[i].labelKey, launcherEnabled ? COLOR_READY_GREEN : isEngineerClass ? COLOR_GRAY : COLOR_NOT_READY_RED);
            safeSetUITextLabel(row.cd, launcherRemaining > 0 ? launcherMessage : mod.Message(STR_UI_READY));
            safeSetUITextColor(row.cd, isEngineerClass ? (showSelectedLauncherTimer ? COLOR_GRAY : launcherColor) : COLOR_GRAY);
            safeSetUIWidgetVisible(row.cd, !isEngineerClass || launcherRemaining <= 0 || showSelectedLauncherTimer);
            safeSetUITextLabel(row.cs, mod.Message(mod.stringkeys.twl.system.genericCounter, launcherCount));
            safeSetUITextLabel(row.ct, mod.Message(mod.stringkeys.twl.system.genericCounter, launcherCount));
            safeSetUITextColor(row.cs, COLOR_DARK_BLACK);
            safeSetUITextColor(row.ct, launcherCount > 0 ? COLOR_WHITE : COLOR_GRAY);
            setActVis(row, launcherEnabled);
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
    const ammoEnabled = isEngineerClass && ammoCount > 0 && hasLauncher && !gadgetBlocked;
    const ammoOverlayMessage = mod.Message(mod.stringkeys.twl.system.genericCounter, ammoCount);
    {
        const sig = [
            ammoEnabled ? 1 : 0,
            ammoCount,
            ammoRemaining > 0 ? Math.ceil(ammoRemaining) : 0,
            isEngineerClass ? 1 : 0,
            hasLauncher ? 1 : 0,
        ].join("|");
        if (cache.e.sig !== sig) {
            setTileHeaderWidgets(cache.e, STR_UI_LAUNCHER_AMMO, ammoEnabled ? COLOR_READY_GREEN : isEngineerClass ? COLOR_GRAY : COLOR_NOT_READY_RED);
            safeSetUITextLabel(
                cache.e.cd,
                !isEngineerClass || !hasLauncher
                    ? mod.Message(STR_UI_NO_LAUNCHER)
                    : (ammoRemaining > 0 ? fmtClock(ammoRemaining) : mod.Message(STR_UI_READY))
            );
            safeSetUITextColor(
                cache.e.cd,
                !isEngineerClass || !hasLauncher ? COLOR_GRAY : (ammoRemaining > 0 ? COLOR_WARNING_YELLOW : COLOR_READY_GREEN)
            );
            safeSetUITextLabel(cache.e.cs, ammoOverlayMessage);
            safeSetUITextLabel(cache.e.ct, ammoOverlayMessage);
            safeSetUITextColor(cache.e.s, COLOR_GRAY);
            safeSetUITextColor(cache.e.cs, COLOR_DARK_BLACK);
            safeSetUITextColor(cache.e.ct, ammoEnabled || ammoCount > 0 ? COLOR_WHITE : COLOR_GRAY);
            setTileVis(cache.e, ammoEnabled);
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
        const enabled = isReconClass && ready && !gadgetBlocked;
        const count = ready ? reconItem.maxCount : 0;
        const showSelectedReconTimer = i > 0 && isReconClass && reconSharedRemaining > 0 && state.rgS === i;
        const sig = [
            enabled ? 1 : 0,
            count,
            remaining > 0 ? Math.ceil(remaining) : 0,
            showSelectedReconTimer ? 1 : 0,
            isReconClass ? 1 : 0,
            i,
        ].join("|");
        if (tile.sig !== sig) {
            setTileHeaderWidgets(tile, reconItem.labelKey, enabled ? COLOR_READY_GREEN : isReconClass ? COLOR_GRAY : COLOR_NOT_READY_RED);
            safeSetUITextLabel(tile.cd, remaining > 0 ? fmtClock(remaining) : mod.Message(STR_UI_READY));
            safeSetUITextColor(tile.cd, isReconClass ? (showSelectedReconTimer ? COLOR_GRAY : (ready ? COLOR_READY_GREEN : COLOR_WARNING_YELLOW)) : COLOR_GRAY);
            safeSetUIWidgetVisible(tile.cd, !isReconClass || i === 0 || reconSharedRemaining <= 0 || showSelectedReconTimer);
            safeSetUITextLabel(tile.cs, mod.Message(mod.stringkeys.twl.system.genericCounter, count));
            safeSetUITextLabel(tile.ct, mod.Message(mod.stringkeys.twl.system.genericCounter, count));
            safeSetUITextColor(tile.s, COLOR_GRAY);
            safeSetUITextColor(tile.cs, COLOR_DARK_BLACK);
            safeSetUITextColor(tile.ct, count > 0 ? COLOR_WHITE : COLOR_GRAY);
            setTileVis(tile, enabled);
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
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return false;
    const pid = safeGetPlayerId(eventPlayer);
    if (pid === undefined) return false;
    if (isUiInteractionBlockedForPid(pid)) return false;
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
    const cache = buildArmMenuHidden(eventPlayer);
    if (!cache) return false;
    setArmObj(pid, objId);
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
    // FocusIn fires when a button is navigated-to (controller/keyboard) or hovered (mouse) — update help text before press.
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
            if (helpKey) safeSetUITextLabel(cache.helpText, mod.Message(helpKey));
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
    syncArm(launch, now);
    if (smokeState) syncSmk(smokeState, now);
    if (assaultState) syncAsg(assaultState, now);
    if (assaultTileIndex >= 0) {
        if (!isAssaultClass || !assaultState) return true;
        const item = cfg.assault[assaultTileIndex];
        const asgEntry = assaultState[assaultTileIndex];
        if (!asgEntry) return true;
        const count = asgEntry.c;
        const nextReady = asgEntry.n;
        if (assaultGroup.n > now || count <= 0 || nextReady > now) return true;
        if (giveAssaultItem(eventPlayer, item.gadget, item.slot, item.slot === mod.InventorySlots.Callins)) {
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
        if (giveAssaultItem(eventPlayer, item.gadget, mod.InventorySlots.GadgetTwo, false)) {
            state.mN = now + item.cooldownSeconds;
            state.mS = medicTileIndex;
            playArmSfx(eventPlayer);
            refreshArmMenu(eventPlayer, objId, cache, true);
        }
        return true;
    }
    if (actionIndex >= 0) {
        if (!isEngineerClass || launch.lN > now) return true;
        if (giveLauncher(eventPlayer, cfg.launchers[actionIndex].gadget)) {
            launch.lN = now + cfg.launcherCooldownSeconds;
            launch.s = actionIndex;
            playArmSfx(eventPlayer);
            refreshArmMenu(eventPlayer, objId, cache, true);
        }
        return true;
    }
    if (reconTileIndex >= 0) {
        if (!isReconClass) return true;
        const item = cfg.recon[reconTileIndex];
        const nextReady = reconTileIndex === 0 ? state.rdN : state.rgN;
        if (nextReady > now) return true;
        if (giveReconItem(eventPlayer, item.gadget, item.slot)) {
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
        if (giveRocketCharge(eventPlayer)) {
            launch.aC = Math.max(0, launch.aC - 1);
            if (launch.aC < cfg.ammoMaxCharges && launch.aN <= now) launch.aN = now + cfg.ammoCooldownSeconds;
            playArmSfx(eventPlayer);
            refreshArmMenu(eventPlayer, objId, cache, true);
        }
        return true;
    }
    return false;
}

