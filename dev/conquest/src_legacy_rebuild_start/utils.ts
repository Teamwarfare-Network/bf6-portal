// @ts-nocheck
// Module: utils — Multi-click detector and main base restock

//#region -------------------- MultiClickDetector (triple tap interact) --------------------

//Code Cleanup: Refactor this reference and use TS Template as a tool import during bundling a new distribution instead
class InteractMultiClickDetector {
    private static readonly STATES: Record<number, { lastIsInteracting: boolean; clickCount: number; sequenceStartTime: number }> = {};
    private static readonly WINDOW_MS = 2_000; //Needs to be tuned to facilitate clunky console controls
    private static readonly REQUIRED_CLICKS = 3;

    public static checkMultiClick(player: mod.Player): boolean {
        const playerId = mod.GetObjId(player);
        const isInteracting = safeGetSoldierStateBool(player, mod.SoldierStateBool.IsInteracting);

        let state = this.STATES[playerId];
        if (!state) {
            this.STATES[playerId] = state = {
                lastIsInteracting: isInteracting,
                clickCount: 0,
                sequenceStartTime: 0,
            };
        }

        if (isInteracting === state.lastIsInteracting) return false;
        state.lastIsInteracting = isInteracting;

        if (!isInteracting) return false;

        const now = Date.now();

        if (state.clickCount > 0 && now - state.sequenceStartTime > this.WINDOW_MS) {
            state.clickCount = 0;
        }

        if (state.clickCount === 0) {
            state.sequenceStartTime = now;
            state.clickCount = 1;
            return false;
        }

        if (++state.clickCount !== this.REQUIRED_CLICKS) return false;

        state.clickCount = 0;
        return true;
    }
}

//#endregion ----------------- MultiClickDetector (triple tap interact) --------------------



//#region -------------------- Main Base Restock (area triggers) --------------------

function IsPlayerInOwnMainBase(player: mod.Player, areaTrigger: mod.AreaTrigger): boolean {
    if (!player || !mod.IsPlayerValid(player)) return false;
    const triggerId = mod.GetObjId(areaTrigger);
    const teamId = mod.GetObjId(mod.GetTeam(player));

    return mod.Or(
        mod.And(mod.Equals(triggerId, TEAM1_MAIN_BASE_TRIGGER_ID), mod.Equals(teamId, mod.GetObjId(mod.GetTeam(TeamID.Team1)))),
        mod.And(mod.Equals(triggerId, TEAM2_MAIN_BASE_TRIGGER_ID), mod.Equals(teamId, mod.GetObjId(mod.GetTeam(TeamID.Team2))))
    );
}

function BroadcastMainBaseEvent(
    messageKey: number,
    arg0?: string | number | mod.Player,
    arg1?: string | number | mod.Player
): void {
    const sanitizeArg = (value?: string | number | mod.Player): string | number | mod.Player | undefined => {
        if (value === undefined) return undefined;
        if (mod.IsType(value, mod.Types.Player)) {
            const player = value as mod.Player;
            if (!player || !mod.IsPlayerValid(player)) return mod.stringkeys.twl.system.unknownPlayer;
        }
        return value;
    };

    const safeArg0 = sanitizeArg(arg0);
    const safeArg1 = sanitizeArg(arg1);
    const message = (safeArg0 === undefined)
        ? mod.Message(messageKey)
        : (safeArg1 === undefined)
            ? mod.Message(messageKey, safeArg0)
            : mod.Message(messageKey, safeArg0, safeArg1);
    sendHighlightedWorldLogMessage(message, false, undefined, messageKey);
}

function NotifyAmmoRestocked(player: mod.Player): void {
    sendHighlightedWorldLogMessage(
        mod.Message(STR_AMMO_RESTOCKED),
        true,
        player,
        STR_AMMO_RESTOCKED
    );
}

function RestockGadgetAmmo(player: mod.Player, magAmmo: number): void {
    if (!isPlayerDeployed(player)) return;
    mod.SetInventoryMagazineAmmo(player, mod.InventorySlots.GadgetOne, magAmmo);
    mod.SetInventoryMagazineAmmo(player, mod.InventorySlots.GadgetTwo, magAmmo);
}

//#endregion ----------------- Main Base Restock (area triggers) --------------------
