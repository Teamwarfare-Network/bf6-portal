// @ts-nocheck
// Module: interaction/spawn-selector -- Phase 1 seam for future conquest spawn selection policy

type ConquestSpawnSelectionReason =
    | "deploy"
    | "forced_redeploy"
    | "team_switch"
    | "admin_move"
    | "phase_transition"
    | "reconnect";

type ConquestSpawnSelectorInput = {
    pid: number;
    teamId: TeamID;
    reason: ConquestSpawnSelectionReason;
    preferredFlagObjId?: number;
};

type ConquestSpawnSelectorResult = {
    denied: boolean;
    fallbackUsed: boolean;
    selectedSpawnObjId?: number;
    reason: string;
};

// Phase 1 contract seam only.
// Custom selection is intentionally deferred to later phases.
function conquestSelectSpawnPoint(_input: ConquestSpawnSelectorInput): ConquestSpawnSelectorResult {
    return {
        denied: true,
        fallbackUsed: false,
        selectedSpawnObjId: undefined,
        reason: "phase1_scaffold_no_custom_spawn_selection",
    };
}
