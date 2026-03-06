// @ts-nocheck
// Module: state/player-lookup -- safe player lookup by pid

function safeFindPlayer(pid: number): mod.Player | undefined {
    try {
        const players = mod.AllPlayers();
        const count = mod.CountOf(players);
        for (let i = 0; i < count; i++) {
            const p = mod.ValueInArray(players, i) as mod.Player;
            if (!p || !mod.IsPlayerValid(p)) continue;
        if (mod.GetObjId(p) === pid) return p;
    }
    return undefined;
    } catch {
        return undefined;
    }
}

//#endregion ----------------- Shared ID helpers --------------------
