// @ts-nocheck
// Module: utils/main-base -- main-base trigger membership + event messaging

//#region -------------------- Main Base Restock (area triggers) --------------------

function IsPlayerInOwnMainBase(player: mod.Player, areaTrigger: mod.AreaTrigger): boolean {
    if (!player || !mod.IsPlayerValid(player)) return false;
    const triggerId = mod.GetObjId(areaTrigger);
    const teamId = mod.GetObjId(mod.GetTeam(player));
    const team1TriggerId = getMainBaseTriggerIdForTeam(TeamID.Team1) ?? TEAM1_MAIN_BASE_TRIGGER_ID;
    const team2TriggerId = getMainBaseTriggerIdForTeam(TeamID.Team2) ?? TEAM2_MAIN_BASE_TRIGGER_ID;

    return mod.Or(
        mod.And(mod.Equals(triggerId, team1TriggerId), mod.Equals(teamId, mod.GetObjId(mod.GetTeam(TeamID.Team1)))),
        mod.And(mod.Equals(triggerId, team2TriggerId), mod.Equals(teamId, mod.GetObjId(mod.GetTeam(TeamID.Team2))))
    );
}

//#endregion ----------------- Main Base Area Trigger Messaging --------------------
