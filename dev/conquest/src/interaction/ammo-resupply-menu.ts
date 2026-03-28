// @ts-nocheck

const AMMO_RESUPPLY_MENU_SIZE = 860;
const AMMO_RESUPPLY_MENU_BORDER_THICKNESS = 2;
const AMMO_RESUPPLY_MENU_BORDER_PADDING = 1;
const AMMO_RESUPPLY_MENU_BORDER_OVERLAP = 2;
const AMMO_RESUPPLY_ROOT_Y = 50;
const AMMO_RESUPPLY_CLASS_HEADER_Y = -380;
const AMMO_RESUPPLY_CLASS_HEADER_WIDTH = 170;
const AMMO_RESUPPLY_CLASS_HEADER_X = [-250, -84, 96, 276];
const AMMO_RESUPPLY_CLASS_HEADER_KEYS = [STR_UI_ASSAULT, STR_UI_MEDIC, STR_UI_ENGINEER, STR_UI_RECON];
const AMMO_RESUPPLY_TILE_X = 96;
const AMMO_RESUPPLY_TILE_SIZE = 120;
const AMMO_RESUPPLY_TILE_LABEL_WIDTH = 220;
const AMMO_RESUPPLY_TILE_TIMER_WIDTH = 220;
const AMMO_RESUPPLY_TILE_START_Y = -280;
const AMMO_RESUPPLY_TILE_STEP_Y = 126;
const AMMO_RESUPPLY_TILE_LABEL_Y_OFFSET = -30;
const AMMO_RESUPPLY_TILE_TIMER_Y_OFFSET = 34;
const AMMO_RESUPPLY_TILE_ICON_SIZE = 96;
const AMMO_RESUPPLY_TILE_ICON_Y_OFFSET = 8;
const AMMO_RESUPPLY_AMMO_COUNT_Y_OFFSET = -22;
const AMMO_RESUPPLY_AMMO_COUNT_SIZE = 48;
const AMMO_RESUPPLY_CLOSE_BUTTON_Y = 396;
const AMMO_RESUPPLY_CLOSE_BUTTON_WIDTH = 260;
const AMMO_RESUPPLY_CLOSE_BUTTON_HEIGHT = 50;
const AMMO_RESUPPLY_LAUNCHER_PICKUP_COOLDOWN_SECONDS = 180;
const AMMO_RESUPPLY_AMMO_CHARGE_COOLDOWN_SECONDS = 60;
const AMMO_RESUPPLY_AMMO_CHARGE_MAX = 3;
const AMMO_RESUPPLY_LAUNCHER_ROWS = [
    { labelKey: STR_UI_RPG, displayGadget: mod.Gadgets.Launcher_Unguided_Rocket, grantGadget: mod.Gadgets.Launcher_Unguided_Rocket },
    { labelKey: STR_UI_AT4, displayGadget: mod.Gadgets.Launcher_Aim_Guided, grantGadget: mod.Gadgets.Launcher_Aim_Guided },
    { labelKey: STR_UI_STINGER, displayGadget: mod.Gadgets.Launcher_Air_Defense, grantGadget: mod.Gadgets.Launcher_Air_Defense },
    { labelKey: STR_UI_IGLA_MARKED, displayGadget: mod.Gadgets.Launcher_Air_Defense, grantGadget: mod.Gadgets.Launcher_Air_Defense },
] as const;
const AMMO_RESUPPLY_MANAGED_LAUNCHER_GADGETS = [
    mod.Gadgets.Launcher_Unguided_Rocket,
    mod.Gadgets.Launcher_Aim_Guided,
    mod.Gadgets.Launcher_Air_Defense,
] as const;
const AMMO_RESUPPLY_AMMO_CHARGE_ICON_GADGET = mod.Gadgets.Class_Supply_Bag;
const AMMO_RESUPPLY_DISABLED_BUTTON_ALPHA = 0.45;

function ammoResupplyMenuName(kind: string, pid: number, index?: number): string {
    if (typeof index === "number") {
        return `AmmoResupplyMenu${kind}_${pid}_${index}`;
    }
    return `AmmoResupplyMenu${kind}_${pid}`;
}

function isAmmoResupplyMenuOpenForPid(pid: number | undefined): boolean {
    if (pid === undefined) return false;
    return State.players.ammoResupplyMenuVisibleByPid[pid] === true;
}

function getAmmoResupplyMenuObjIdForPid(pid: number | undefined): number | undefined {
    if (pid === undefined) return undefined;
    return State.players.ammoResupplyMenuObjIdByPid[pid];
}

function setAmmoResupplyMenuVisibleForPid(pid: number, visible: boolean): void {
    if (visible) {
        State.players.ammoResupplyMenuVisibleByPid[pid] = true;
        return;
    }
    delete State.players.ammoResupplyMenuVisibleByPid[pid];
}

function setAmmoResupplyMenuObjIdForPid(pid: number, objId: number | undefined): void {
    if (typeof objId === "number") {
        State.players.ammoResupplyMenuObjIdByPid[pid] = objId;
        return;
    }
    delete State.players.ammoResupplyMenuObjIdByPid[pid];
}

function resetAmmoResupplyMenuStateForPid(pid: number): void {
    if (!Number.isInteger(pid)) return;
    delete State.players.ammoResupplyMenuVisibleByPid[pid];
    delete State.players.ammoResupplyMenuObjIdByPid[pid];
}

function ensureAmmoResupplyStateForPidObjId(pid: number, objId: number): {
    launcherSharedReadyAtSeconds: number;
    ammoChargeCount: number;
    ammoChargeNextReadyAtSeconds: number;
} {
    if (!State.players.ammoResupplyStateByPidByObjId[pid]) {
        State.players.ammoResupplyStateByPidByObjId[pid] = {};
    }
    if (!State.players.ammoResupplyStateByPidByObjId[pid][objId]) {
        State.players.ammoResupplyStateByPidByObjId[pid][objId] = {
            launcherSharedReadyAtSeconds: 0,
            ammoChargeCount: AMMO_RESUPPLY_AMMO_CHARGE_MAX,
            ammoChargeNextReadyAtSeconds: 0,
        };
    }
    return State.players.ammoResupplyStateByPidByObjId[pid][objId];
}

function syncAmmoResupplyStateToNow(
    state: {
        launcherSharedReadyAtSeconds: number;
        ammoChargeCount: number;
        ammoChargeNextReadyAtSeconds: number;
    },
    now: number
): void {
    while (
        state.ammoChargeCount < AMMO_RESUPPLY_AMMO_CHARGE_MAX
        && state.ammoChargeNextReadyAtSeconds > 0
        && now >= state.ammoChargeNextReadyAtSeconds
    ) {
        state.ammoChargeCount++;
        if (state.ammoChargeCount < AMMO_RESUPPLY_AMMO_CHARGE_MAX) {
            state.ammoChargeNextReadyAtSeconds += AMMO_RESUPPLY_AMMO_CHARGE_COOLDOWN_SECONDS;
        } else {
            state.ammoChargeNextReadyAtSeconds = 0;
        }
    }
    if (state.ammoChargeCount >= AMMO_RESUPPLY_AMMO_CHARGE_MAX) {
        state.ammoChargeCount = AMMO_RESUPPLY_AMMO_CHARGE_MAX;
        state.ammoChargeNextReadyAtSeconds = 0;
    }
}

function formatSecondsAsClockLabel(secondsRemaining: number): mod.Message {
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

function createAmmoResupplyBorderLine(
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

function addAmmoResupplyGadgetIcon(
    name: string,
    posX: number,
    posY: number,
    size: number,
    gadget: number,
    parent: mod.UIWidget | undefined,
    eventPlayer: mod.Player
): mod.UIWidget | undefined {
    if (!parent) return undefined;
    let widget = safeFind(name);
    if (!widget) {
        mod.AddUIGadgetImage(
            name,
            mod.CreateVector(posX, posY, 0),
            mod.CreateVector(size, size, 0),
            mod.UIAnchor.Center,
            gadget,
            parent,
            eventPlayer
        );
        widget = safeFind(name);
    }
    if (!widget) return undefined;
    safeSetUIWidgetParent(widget, parent);
    try {
        mod.SetUIWidgetAnchor(widget, mod.UIAnchor.Center);
    } catch {}
    safeSetUIWidgetPosition(widget, mod.CreateVector(posX, posY, 0));
    safeSetUIWidgetSize(widget, mod.CreateVector(size, size, 0));
    safeSetUIWidgetDepth(widget, mod.UIDepth.AboveGameUI);
    safeSetUIWidgetVisible(widget, false);
    return widget;
}

function setAmmoResupplyMenuVisible(cache: AmmoResupplyMenuCacheEntry | undefined, visible: boolean): void {
    if (!cache) return;
    safeSetUIWidgetVisible(cache.root, visible);
    safeSetUIWidgetVisible(cache.borderTop, visible);
    safeSetUIWidgetVisible(cache.borderBottom, visible);
    safeSetUIWidgetVisible(cache.borderLeft, visible);
    safeSetUIWidgetVisible(cache.borderRight, visible);
    safeSetUIWidgetVisible(cache.title, visible);
    for (let i = 0; i < cache.rows.length; i++) {
        const row = cache.rows[i];
        safeSetUIWidgetVisible(row.buttonBorder, visible);
        safeSetUIWidgetVisible(row.button, visible);
        safeSetUIWidgetVisible(row.buttonIcon, visible);
        safeSetUIWidgetVisible(row.labelText, visible);
        safeSetUIWidgetVisible(row.cooldownText, visible);
        if (row.button && !visible) mod.SetUIButtonEnabled(row.button, false);
    }
    if (cache.classHeaders) {
        for (let i = 0; i < cache.classHeaders.length; i++) {
            safeSetUIWidgetVisible(cache.classHeaders[i], visible);
        }
    }
    safeSetUIWidgetVisible(cache.ammoCharge.buttonBorder, visible);
    safeSetUIWidgetVisible(cache.ammoCharge.button, visible);
    safeSetUIWidgetVisible(cache.ammoCharge.buttonIcon, visible);
    safeSetUIWidgetVisible(cache.ammoCharge.labelText, visible);
    safeSetUIWidgetVisible(cache.ammoCharge.cooldownText, visible);
    safeSetUIWidgetVisible(cache.ammoCharge.countShadow, visible);
    safeSetUIWidgetVisible(cache.ammoCharge.countText, visible);
    if (cache.ammoCharge.button && !visible) mod.SetUIButtonEnabled(cache.ammoCharge.button, false);
    safeSetUIWidgetVisible(cache.closeButtonBorder, visible);
    safeSetUIWidgetVisible(cache.closeButton, visible);
    safeSetUIWidgetVisible(cache.closeButtonText, visible);
    if (cache.closeButton) mod.SetUIButtonEnabled(cache.closeButton, visible);
    cache.lastVisibleState = visible;
}

function setAmmoResupplyActionButtonVisualState(
    row: AmmoResupplyMenuActionRowCacheEntry,
    enabled: boolean
): void {
    safeSetUIWidgetBgColor(row.button, enabled ? COLOR_BUTTON_BASE : COLOR_GRAY_DARK);
    safeSetUIWidgetBgAlpha(row.button, enabled ? BUTTON_OPACITY_BASE : AMMO_RESUPPLY_DISABLED_BUTTON_ALPHA);
    safeSetUIWidgetBgColor(row.buttonBorder, enabled ? COLOR_BUTTON_BORDER : COLOR_GRAY_DARK);
    safeSetUIWidgetBgAlpha(row.buttonBorder, enabled ? BUTTON_BORDER_OPACITY : AMMO_RESUPPLY_DISABLED_BUTTON_ALPHA);
    if (row.button) mod.SetUIButtonEnabled(row.button, enabled);
}

function setAmmoResupplyChargeButtonVisualState(
    charge: AmmoResupplyMenuChargeCacheEntry,
    enabled: boolean
): void {
    safeSetUIWidgetBgColor(charge.button, enabled ? COLOR_BUTTON_BASE : COLOR_GRAY_DARK);
    safeSetUIWidgetBgAlpha(charge.button, enabled ? BUTTON_OPACITY_BASE : AMMO_RESUPPLY_DISABLED_BUTTON_ALPHA);
    safeSetUIWidgetBgColor(charge.buttonBorder, enabled ? COLOR_BUTTON_BORDER : COLOR_GRAY_DARK);
    safeSetUIWidgetBgAlpha(charge.buttonBorder, enabled ? BUTTON_BORDER_OPACITY : AMMO_RESUPPLY_DISABLED_BUTTON_ALPHA);
    if (charge.button) mod.SetUIButtonEnabled(charge.button, enabled);
}

function playerHasManagedAmmoLauncher(eventPlayer: mod.Player): boolean {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return false;
    for (let i = 0; i < AMMO_RESUPPLY_MANAGED_LAUNCHER_GADGETS.length; i++) {
        try {
            if (mod.HasEquipment(eventPlayer, AMMO_RESUPPLY_MANAGED_LAUNCHER_GADGETS[i])) return true;
        } catch {}
    }
    return false;
}

function tryGrantAmmoResupplyLauncher(eventPlayer: mod.Player, gadget: number): boolean {
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

function tryGrantAmmoResupplyRocketCharge(eventPlayer: mod.Player): boolean {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return false;
    if (!playerHasManagedAmmoLauncher(eventPlayer)) return false;

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

function updateAmmoResupplyMenuForPlayer(eventPlayer: mod.Player): void {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    const pid = safeGetPlayerId(eventPlayer);
    if (pid === undefined) return;
    if (!isAmmoResupplyMenuOpenForPid(pid)) return;
    const objId = getAmmoResupplyMenuObjIdForPid(pid);
    if (objId === undefined) return;
    const cache = State.hudCache.ammoResupplyMenuCache[pid];
    if (!cache) return;
    refreshAmmoResupplyMenuContentForPlayer(eventPlayer, objId, cache);
}

function ensureAmmoResupplyMenuUiBuiltHidden(eventPlayer: mod.Player): AmmoResupplyMenuCacheEntry | undefined {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return undefined;
    const pid = safeGetPlayerId(eventPlayer);
    if (pid === undefined) return undefined;

    let cache = State.hudCache.ammoResupplyMenuCache[pid];
    if (!cache) {
        cache = {
            rootName: ammoResupplyMenuName("Root", pid),
            classHeaders: [],
            rows: [{}, {}, {}, {}],
            ammoCharge: {},
        };
        State.hudCache.ammoResupplyMenuCache[pid] = cache;
    }

    cache.root = cache.root ?? safeFind(cache.rootName);
    if (cache.root) {
        setAmmoResupplyMenuVisible(cache, false);
        return cache;
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

    cache.borderTop = createAmmoResupplyBorderLine(ammoResupplyMenuName("BorderTop", pid), mod.CreateVector(0, -borderHalfHeight, 0), mod.CreateVector(borderLineWidth, AMMO_RESUPPLY_MENU_BORDER_THICKNESS, 0), root, eventPlayer);
    cache.borderBottom = createAmmoResupplyBorderLine(ammoResupplyMenuName("BorderBottom", pid), mod.CreateVector(0, borderHalfHeight, 0), mod.CreateVector(borderLineWidth, AMMO_RESUPPLY_MENU_BORDER_THICKNESS, 0), root, eventPlayer);
    cache.borderLeft = createAmmoResupplyBorderLine(ammoResupplyMenuName("BorderLeft", pid), mod.CreateVector(-borderHalfWidth, 0, 0), mod.CreateVector(AMMO_RESUPPLY_MENU_BORDER_THICKNESS, borderLineHeight, 0), root, eventPlayer);
    cache.borderRight = createAmmoResupplyBorderLine(ammoResupplyMenuName("BorderRight", pid), mod.CreateVector(borderHalfWidth, 0, 0), mod.CreateVector(AMMO_RESUPPLY_MENU_BORDER_THICKNESS, borderLineHeight, 0), root, eventPlayer);

    for (let i = 0; i < AMMO_RESUPPLY_CLASS_HEADER_KEYS.length; i++) {
        cache.classHeaders![i] = addReadyDialogText(
            ammoResupplyMenuName("ClassHeader", pid, i),
            AMMO_RESUPPLY_CLASS_HEADER_X[i],
            AMMO_RESUPPLY_CLASS_HEADER_Y,
            AMMO_RESUPPLY_CLASS_HEADER_WIDTH,
            42,
            mod.UIAnchor.Center,
            mod.UIAnchor.Center,
            mod.Message(AMMO_RESUPPLY_CLASS_HEADER_KEYS[i]),
            eventPlayer,
            root,
            22,
            false,
            i === 2 ? READY_DIALOG_LABEL_TEXT_COLOR : COLOR_GRAY
        );
    }

    for (let i = 0; i < AMMO_RESUPPLY_LAUNCHER_ROWS.length; i++) {
        const rowY = AMMO_RESUPPLY_TILE_START_Y + (i * AMMO_RESUPPLY_TILE_STEP_Y);
        const buttonId = ammoResupplyMenuName("ActionButton", pid, i);
        cache.rows[i].buttonBorder = addOutlinedButton(
            buttonId,
            AMMO_RESUPPLY_TILE_X,
            rowY,
            AMMO_RESUPPLY_TILE_SIZE,
            AMMO_RESUPPLY_TILE_SIZE,
            mod.UIAnchor.Center,
            root,
            eventPlayer,
            1
        );
        cache.rows[i].button = safeFind(buttonId);
        cache.rows[i].buttonIcon = addAmmoResupplyGadgetIcon(
            ammoResupplyMenuName("ActionButtonIcon", pid, i),
            AMMO_RESUPPLY_TILE_X,
            rowY + AMMO_RESUPPLY_TILE_ICON_Y_OFFSET,
            AMMO_RESUPPLY_TILE_ICON_SIZE,
            AMMO_RESUPPLY_LAUNCHER_ROWS[i].displayGadget,
            root,
            eventPlayer
        );
        cache.rows[i].labelText = addReadyDialogText(
            ammoResupplyMenuName("ActionLabel", pid, i),
            AMMO_RESUPPLY_TILE_X,
            rowY + AMMO_RESUPPLY_TILE_LABEL_Y_OFFSET,
            AMMO_RESUPPLY_TILE_LABEL_WIDTH,
            34,
            mod.UIAnchor.Center,
            mod.UIAnchor.Center,
            mod.Message(AMMO_RESUPPLY_LAUNCHER_ROWS[i].labelKey),
            eventPlayer,
            root,
            20,
            false,
            COLOR_WHITE
        );
        cache.rows[i].cooldownText = addReadyDialogText(
            ammoResupplyMenuName("ActionCooldown", pid, i),
            AMMO_RESUPPLY_TILE_X,
            rowY + AMMO_RESUPPLY_TILE_TIMER_Y_OFFSET,
            AMMO_RESUPPLY_TILE_TIMER_WIDTH,
            28,
            mod.UIAnchor.Center,
            mod.UIAnchor.Center,
            mod.Message(STR_UI_READY),
            eventPlayer,
            root,
            18,
            false,
            COLOR_READY_GREEN
        );
        const rowButtonIcon = cache.rows[i].buttonIcon;
        if (rowButtonIcon) {
            mod.SetUIImageColor(rowButtonIcon, COLOR_NOT_READY_RED);
        }
    }
    const ammoY = AMMO_RESUPPLY_TILE_START_Y + (AMMO_RESUPPLY_LAUNCHER_ROWS.length * AMMO_RESUPPLY_TILE_STEP_Y);
    const ammoButtonId = ammoResupplyMenuName("AmmoChargeButton", pid);
    cache.ammoCharge.buttonBorder = addOutlinedButton(
        ammoButtonId,
        AMMO_RESUPPLY_TILE_X,
        ammoY,
        AMMO_RESUPPLY_TILE_SIZE,
        AMMO_RESUPPLY_TILE_SIZE,
        mod.UIAnchor.Center,
        root,
        eventPlayer,
        1
    );
    cache.ammoCharge.button = safeFind(ammoButtonId);
    cache.ammoCharge.buttonIcon = addAmmoResupplyGadgetIcon(
        ammoResupplyMenuName("AmmoChargeIcon", pid),
        AMMO_RESUPPLY_TILE_X,
        ammoY + AMMO_RESUPPLY_TILE_ICON_Y_OFFSET,
        AMMO_RESUPPLY_TILE_ICON_SIZE,
        AMMO_RESUPPLY_AMMO_CHARGE_ICON_GADGET,
        root,
        eventPlayer
    );
    cache.ammoCharge.labelText = addReadyDialogText(
        ammoResupplyMenuName("AmmoChargeLabel", pid),
        AMMO_RESUPPLY_TILE_X,
        ammoY + AMMO_RESUPPLY_TILE_LABEL_Y_OFFSET,
        AMMO_RESUPPLY_TILE_LABEL_WIDTH,
        34,
        mod.UIAnchor.Center,
        mod.UIAnchor.Center,
        mod.Message(STR_UI_LAUNCHER_AMMO),
        eventPlayer,
        root,
        20,
        false,
        COLOR_WHITE
    );
    cache.ammoCharge.cooldownText = addReadyDialogText(
        ammoResupplyMenuName("AmmoChargeCooldown", pid),
        AMMO_RESUPPLY_TILE_X,
        ammoY + AMMO_RESUPPLY_TILE_TIMER_Y_OFFSET,
        AMMO_RESUPPLY_TILE_TIMER_WIDTH,
        24,
        mod.UIAnchor.Center,
        mod.UIAnchor.Center,
        mod.Message(STR_UI_READY),
        eventPlayer,
        root,
        18,
        false,
        COLOR_READY_GREEN
    );
    cache.ammoCharge.countShadow = addReadyDialogText(
        ammoResupplyMenuName("AmmoChargeCountShadow", pid),
        2,
        AMMO_RESUPPLY_AMMO_COUNT_Y_OFFSET + 3,
        AMMO_RESUPPLY_TILE_SIZE,
        64,
        mod.UIAnchor.Center,
        mod.UIAnchor.Center,
        mod.Message(mod.stringkeys.twl.system.genericCounter, AMMO_RESUPPLY_AMMO_CHARGE_MAX),
        eventPlayer,
        cache.ammoCharge.buttonBorder ?? root,
        AMMO_RESUPPLY_AMMO_COUNT_SIZE,
        false,
        COLOR_DARK_BLACK
    );
    cache.ammoCharge.countText = addReadyDialogText(
        ammoResupplyMenuName("AmmoChargeCount", pid),
        0,
        AMMO_RESUPPLY_AMMO_COUNT_Y_OFFSET,
        AMMO_RESUPPLY_TILE_SIZE,
        64,
        mod.UIAnchor.Center,
        mod.UIAnchor.Center,
        mod.Message(mod.stringkeys.twl.system.genericCounter, AMMO_RESUPPLY_AMMO_CHARGE_MAX),
        eventPlayer,
        cache.ammoCharge.buttonBorder ?? root,
        AMMO_RESUPPLY_AMMO_COUNT_SIZE,
        false,
        COLOR_WHITE
    );
    safeSetUIWidgetDepth(cache.ammoCharge.countShadow, mod.UIDepth.AboveGameUI);
    safeSetUIWidgetDepth(cache.ammoCharge.countText, mod.UIDepth.AboveGameUI);
    if (cache.ammoCharge.buttonIcon) {
        mod.SetUIImageColor(cache.ammoCharge.buttonIcon, COLOR_NOT_READY_RED);
    }

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

    setAmmoResupplyMenuVisible(cache, false);
    return cache;
}

function destroyAmmoResupplyMenuUiForPid(pid: number): void {
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

function refreshAmmoResupplyMenuContentForPlayer(eventPlayer: mod.Player, objId: number, cache: AmmoResupplyMenuCacheEntry): void {
    const pid = safeGetPlayerId(eventPlayer);
    if (pid === undefined) return;
    const state = ensureAmmoResupplyStateForPidObjId(pid, objId);
    const now = mod.GetMatchTimeElapsed();
    syncAmmoResupplyStateToNow(state, now);
    const launcherRemaining = Math.max(0, state.launcherSharedReadyAtSeconds - now);
    const launcherReady = launcherRemaining <= 0;
    const launcherMessage = formatSecondsAsClockLabel(launcherRemaining);
    const launcherColor = launcherReady ? COLOR_READY_GREEN : COLOR_WARNING_YELLOW;
    const hasLauncher = playerHasManagedAmmoLauncher(eventPlayer);

    if (cache.classHeaders) {
        for (let i = 0; i < cache.classHeaders.length; i++) {
            safeSetUITextLabel(cache.classHeaders[i], mod.Message(AMMO_RESUPPLY_CLASS_HEADER_KEYS[i]));
            safeSetUITextColor(cache.classHeaders[i], i === 2 ? READY_DIALOG_LABEL_TEXT_COLOR : COLOR_GRAY);
        }
    }

    for (let i = 0; i < cache.rows.length; i++) {
        const row = cache.rows[i];
        safeSetUITextLabel(row.labelText, mod.Message(AMMO_RESUPPLY_LAUNCHER_ROWS[i].labelKey));
        safeSetUITextLabel(row.cooldownText, launcherMessage);
        safeSetUITextColor(row.cooldownText, launcherColor);
        setAmmoResupplyActionButtonVisualState(row, launcherReady);
        const rowButtonIcon = row.buttonIcon;
        if (rowButtonIcon) {
            mod.SetUIImageColor(rowButtonIcon, launcherReady ? COLOR_NOT_READY_RED : COLOR_GRAY);
        }
        safeSetUITextColor(row.labelText, launcherReady ? COLOR_WHITE : COLOR_GRAY);
    }
    const ammoCount = Math.max(0, Math.min(AMMO_RESUPPLY_AMMO_CHARGE_MAX, state.ammoChargeCount));
    const ammoRemaining = Math.max(0, state.ammoChargeNextReadyAtSeconds - now);
    const ammoEnabled = ammoCount > 0 && hasLauncher;
    safeSetUITextLabel(cache.ammoCharge.labelText, mod.Message(STR_UI_LAUNCHER_AMMO));
    safeSetUITextLabel(
        cache.ammoCharge.cooldownText,
        hasLauncher
            ? (ammoRemaining > 0 ? formatSecondsAsClockLabel(ammoRemaining) : mod.Message(STR_UI_READY))
            : mod.Message(STR_UI_NO_LAUNCHER)
    );
    safeSetUITextColor(
        cache.ammoCharge.cooldownText,
        !hasLauncher ? COLOR_GRAY : (ammoRemaining > 0 ? COLOR_WARNING_YELLOW : COLOR_READY_GREEN)
    );
    safeSetUITextLabel(cache.ammoCharge.countShadow, mod.Message(mod.stringkeys.twl.system.genericCounter, ammoCount));
    safeSetUITextLabel(cache.ammoCharge.countText, mod.Message(mod.stringkeys.twl.system.genericCounter, ammoCount));
    safeSetUITextColor(cache.ammoCharge.labelText, ammoEnabled || ammoCount > 0 ? COLOR_WHITE : COLOR_GRAY);
    safeSetUITextColor(cache.ammoCharge.countShadow, COLOR_DARK_BLACK);
    safeSetUITextColor(cache.ammoCharge.countText, ammoEnabled || ammoCount > 0 ? COLOR_WHITE : COLOR_GRAY);
    setAmmoResupplyChargeButtonVisualState(cache.ammoCharge, ammoEnabled);
    if (cache.ammoCharge.buttonIcon) {
        mod.SetUIImageColor(cache.ammoCharge.buttonIcon, ammoEnabled ? COLOR_NOT_READY_RED : COLOR_GRAY);
    }
}

function closeAmmoResupplyMenuForPlayer(eventPlayer: mod.Player | number): void {
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
    setAmmoResupplyMenuVisibleForPid(pid, false);
    setAmmoResupplyMenuObjIdForPid(pid, undefined);

    const cache = State.hudCache.ammoResupplyMenuCache[pid];
    if (cache) setAmmoResupplyMenuVisible(cache, false);

    if (player && mod.IsPlayerValid(player)) {
        setUIInputModeForPlayer(player, false);
        updateVehicleDeployTimerHudForPlayer(player);
    } else {
        delete State.players.uiInputEnabledByPid[pid];
    }
}

function tryOpenAmmoResupplyMenuForPlayer(eventPlayer: mod.Player, objId: number): boolean {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return false;
    const pid = safeGetPlayerId(eventPlayer);
    if (pid === undefined) return false;
    if (!State.players.deployedByPid[pid]) return false;

    if (State.players.readyDialogData[pid]?.dialogVisible) {
        hideReadyDialogUI(eventPlayer);
    }
    if (isVehicleDeployLiveMenuOpenForPid(pid)) {
        closeVehicleDeployLiveMenuForPlayer(eventPlayer);
    }

    const cache = ensureAmmoResupplyMenuUiBuiltHidden(eventPlayer);
    if (!cache) return false;

    setAmmoResupplyMenuObjIdForPid(pid, objId);
    setAmmoResupplyMenuVisible(cache, true);
    setAmmoResupplyMenuVisibleForPid(pid, true);
    refreshAmmoResupplyMenuContentForPlayer(eventPlayer, objId, cache);
    setUIInputModeForPlayer(eventPlayer, true);
    return true;
}

function prebuildAmmoResupplyMenuUiWhileHidden(eventPlayer: mod.Player): void {
    const cache = ensureAmmoResupplyMenuUiBuiltHidden(eventPlayer);
    if (!cache) return;
    setAmmoResupplyMenuVisible(cache, false);
}

function tryHandleAmmoResupplyMenuButtonEvent(eventPlayer: mod.Player, eventUIWidget: mod.UIWidget, eventUIButtonEvent: mod.UIButtonEvent): boolean {
    const pid = safeGetPlayerId(eventPlayer);
    if (pid === undefined) return false;
    if (!isAmmoResupplyMenuOpenForPid(pid)) return false;

    const widgetName = mod.GetUIWidgetName(eventUIWidget);
    if (!widgetName) return false;
    const closeButtonName = ammoResupplyMenuName("CloseButton", pid);
    const closeButtonLabelName = ammoResupplyMenuName("CloseButtonLabel", pid);
    const closeButtonBorderName = `${closeButtonName}_BORDER`;
    const isCloseWidget = widgetName === closeButtonName || widgetName === closeButtonLabelName || widgetName === closeButtonBorderName;
    const isActionWidget = widgetName.startsWith(ammoResupplyMenuName("ActionButton", pid));
    const chargeButtonName = ammoResupplyMenuName("AmmoChargeButton", pid);
    const chargeButtonBorderName = `${chargeButtonName}_BORDER`;
    const isChargeWidget = widgetName === chargeButtonName || widgetName === chargeButtonBorderName;
    if (!isCloseWidget && !isActionWidget && !isChargeWidget) return false;

    if (!mod.Equals(eventUIButtonEvent, mod.UIButtonEvent.ButtonDown)) {
        if (isCloseWidget && mod.Equals(eventUIButtonEvent, mod.UIButtonEvent.ButtonUp)) {
            closeAmmoResupplyMenuForPlayer(eventPlayer);
            return true;
        }
        return widgetName === closeButtonName
            || widgetName === closeButtonLabelName
            || widgetName === closeButtonBorderName
            || widgetName.startsWith(ammoResupplyMenuName("ActionButton", pid))
            || widgetName === chargeButtonName
            || widgetName === chargeButtonBorderName;
    }

    if (isCloseWidget) {
        closeAmmoResupplyMenuForPlayer(eventPlayer);
        return true;
    }

    const objId = getAmmoResupplyMenuObjIdForPid(pid);
    if (objId === undefined) return true;
    const cache = State.hudCache.ammoResupplyMenuCache[pid];
    if (!cache) return true;
    const state = ensureAmmoResupplyStateForPidObjId(pid, objId);
    const now = mod.GetMatchTimeElapsed();
    syncAmmoResupplyStateToNow(state, now);

    for (let i = 0; i < AMMO_RESUPPLY_LAUNCHER_ROWS.length; i++) {
        if (widgetName !== ammoResupplyMenuName("ActionButton", pid, i)) continue;
        if (state.launcherSharedReadyAtSeconds > now) return true;
        if (tryGrantAmmoResupplyLauncher(eventPlayer, AMMO_RESUPPLY_LAUNCHER_ROWS[i].grantGadget)) {
            state.launcherSharedReadyAtSeconds = now + AMMO_RESUPPLY_LAUNCHER_PICKUP_COOLDOWN_SECONDS;
            refreshAmmoResupplyMenuContentForPlayer(eventPlayer, objId, cache);
        }
        return true;
    }

    if (widgetName === chargeButtonName) {
        if (state.ammoChargeCount <= 0) return true;
        if (tryGrantAmmoResupplyRocketCharge(eventPlayer)) {
            state.ammoChargeCount = Math.max(0, state.ammoChargeCount - 1);
            if (state.ammoChargeCount < AMMO_RESUPPLY_AMMO_CHARGE_MAX && state.ammoChargeNextReadyAtSeconds <= now) {
                state.ammoChargeNextReadyAtSeconds = now + AMMO_RESUPPLY_AMMO_CHARGE_COOLDOWN_SECONDS;
            }
            refreshAmmoResupplyMenuContentForPlayer(eventPlayer, objId, cache);
        }
        return true;
    }

    return false;
}
