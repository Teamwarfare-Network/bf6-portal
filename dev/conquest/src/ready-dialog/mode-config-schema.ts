// @ts-nocheck
// Module: ready-dialog/mode-config-schema -- shared knob/column metadata for the ready-dialog grid

type ReadyDialogGridKnobSpec = {
    key: string;
    labelKey: number;
};

type ReadyDialogGridColumnSpec = {
    key: string;
    width: number;
    teamId?: TeamID;
    supportVisible?: boolean;
    knobSpecs: readonly ReadyDialogGridKnobSpec[];
};

const READY_DIALOG_MODE_GRID_COLUMN_SPECS: ReadyDialogGridColumnSpec[] = [
    {
        key: "team1Fast",
        width: 158,
        teamId: TeamID.Team1,
        supportVisible: false,
        knobSpecs: [
            { key: READY_DIALOG_TEAM1_FAST_KNOB_KEYS[0], labelKey: mod.stringkeys.twl.readyDialog.transport1Label },
            { key: READY_DIALOG_TEAM1_FAST_KNOB_KEYS[1], labelKey: mod.stringkeys.twl.readyDialog.transport2Label },
            { key: READY_DIALOG_TEAM1_FAST_KNOB_KEYS[2], labelKey: mod.stringkeys.twl.readyDialog.transport3Label },
            { key: READY_DIALOG_TEAM1_FAST_KNOB_KEYS[3], labelKey: mod.stringkeys.twl.readyDialog.transport4Label },
        ],
    },
    {
        key: "team1Ground",
        width: 158,
        teamId: TeamID.Team1,
        supportVisible: false,
        knobSpecs: [
            { key: READY_DIALOG_TEAM1_GROUND_KNOB_KEYS[0], labelKey: mod.stringkeys.twl.readyDialog.tank1Label },
            { key: READY_DIALOG_TEAM1_GROUND_KNOB_KEYS[1], labelKey: mod.stringkeys.twl.readyDialog.tank2Label },
            { key: READY_DIALOG_TEAM1_GROUND_KNOB_KEYS[2], labelKey: mod.stringkeys.twl.readyDialog.tank3Label },
            { key: READY_DIALOG_TEAM1_GROUND_KNOB_KEYS[3], labelKey: mod.stringkeys.twl.readyDialog.tank4Label },
        ],
    },
    {
        key: "team1Air",
        width: 158,
        teamId: TeamID.Team1,
        supportVisible: false,
        knobSpecs: [
            { key: READY_DIALOG_TEAM1_JET_KNOB_KEYS[0], labelKey: mod.stringkeys.twl.readyDialog.jet1Label },
            { key: READY_DIALOG_TEAM1_JET_KNOB_KEYS[1], labelKey: mod.stringkeys.twl.readyDialog.jet2Label },
            { key: READY_DIALOG_TEAM1_HELI_KNOB_KEYS[0], labelKey: mod.stringkeys.twl.readyDialog.heli1Label },
            { key: READY_DIALOG_TEAM1_HELI_KNOB_KEYS[1], labelKey: mod.stringkeys.twl.readyDialog.heli2Label },
        ],
    },
    {
        key: "config",
        width: 216,
        supportVisible: true,
        // v1.314: dropped modeSettings placeholder and the Vehicle Deploy stepper knob. The center
        // column now renders Game Mode + Players as knob rows and 5 deploy/feature checkboxes in
        // dialog-build-mode-config. The "Configuration" header slot is reclaimed for Game Mode.
        knobSpecs: [
            { key: READY_DIALOG_CONFIG_GAME_KNOB_KEY, labelKey: mod.stringkeys.twl.readyDialog.gameModeConfigurationLabel },
            { key: READY_DIALOG_CONFIG_PLAYERS_KNOB_KEY, labelKey: mod.stringkeys.twl.readyDialog.playersLabel },
        ],
    },
    {
        key: "team2Air",
        width: 158,
        teamId: TeamID.Team2,
        supportVisible: false,
        knobSpecs: [
            { key: READY_DIALOG_TEAM2_JET_KNOB_KEYS[0], labelKey: mod.stringkeys.twl.readyDialog.jet1Label },
            { key: READY_DIALOG_TEAM2_JET_KNOB_KEYS[1], labelKey: mod.stringkeys.twl.readyDialog.jet2Label },
            { key: READY_DIALOG_TEAM2_HELI_KNOB_KEYS[0], labelKey: mod.stringkeys.twl.readyDialog.heli1Label },
            { key: READY_DIALOG_TEAM2_HELI_KNOB_KEYS[1], labelKey: mod.stringkeys.twl.readyDialog.heli2Label },
        ],
    },
    {
        key: "team2Ground",
        width: 158,
        teamId: TeamID.Team2,
        supportVisible: false,
        knobSpecs: [
            { key: READY_DIALOG_TEAM2_GROUND_KNOB_KEYS[0], labelKey: mod.stringkeys.twl.readyDialog.tank1Label },
            { key: READY_DIALOG_TEAM2_GROUND_KNOB_KEYS[1], labelKey: mod.stringkeys.twl.readyDialog.tank2Label },
            { key: READY_DIALOG_TEAM2_GROUND_KNOB_KEYS[2], labelKey: mod.stringkeys.twl.readyDialog.tank3Label },
            { key: READY_DIALOG_TEAM2_GROUND_KNOB_KEYS[3], labelKey: mod.stringkeys.twl.readyDialog.tank4Label },
        ],
    },
    {
        key: "team2Fast",
        width: 158,
        teamId: TeamID.Team2,
        supportVisible: false,
        knobSpecs: [
            { key: READY_DIALOG_TEAM2_FAST_KNOB_KEYS[0], labelKey: mod.stringkeys.twl.readyDialog.transport1Label },
            { key: READY_DIALOG_TEAM2_FAST_KNOB_KEYS[1], labelKey: mod.stringkeys.twl.readyDialog.transport2Label },
            { key: READY_DIALOG_TEAM2_FAST_KNOB_KEYS[2], labelKey: mod.stringkeys.twl.readyDialog.transport3Label },
            { key: READY_DIALOG_TEAM2_FAST_KNOB_KEYS[3], labelKey: mod.stringkeys.twl.readyDialog.transport4Label },
        ],
    },
];

const READY_DIALOG_MODE_GRID_ALL_KNOB_KEYS: string[] = [];
for (const column of READY_DIALOG_MODE_GRID_COLUMN_SPECS) {
    for (const knob of column.knobSpecs) {
        READY_DIALOG_MODE_GRID_ALL_KNOB_KEYS.push(knob.key);
    }
}

function getReadyDialogModeGridColumnSpecs(): ReadyDialogGridColumnSpec[] {
    return READY_DIALOG_MODE_GRID_COLUMN_SPECS;
}

function getReadyDialogModeGridColumnHeaderMessage(column: ReadyDialogGridColumnSpec): mod.Message {
    switch (column.key) {
        case "team1Fast":
        case "team2Fast":
            return mod.Message(mod.stringkeys.twl.readyDialog.columnFastFormat, getTeamNameKey(column.teamId ?? TeamID.Team1));
        case "team1Ground":
        case "team2Ground":
            return mod.Message(mod.stringkeys.twl.readyDialog.columnGroundFormat, getTeamNameKey(column.teamId ?? TeamID.Team1));
        case "team1Air":
        case "team2Air":
            return mod.Message(mod.stringkeys.twl.readyDialog.columnAirFormat, getTeamNameKey(column.teamId ?? TeamID.Team1));
        case "config":
            // v1.314: config column no longer renders a "Configuration" header — the Game Mode
            // stepper now occupies the header row. Return a blank message; the build path also
            // skips the header widget entirely so no placeholder widget exists to update.
            return mod.Message(mod.stringkeys.twl.system.genericCounter, " ");
        default:
            return mod.Message(mod.stringkeys.twl.readyDialog.configurationColumnLabel);
    }
}

function getReadyDialogModeGridSupportPlaceholder(column: ReadyDialogGridColumnSpec): mod.Message {
    if (column.key === "config") {
        return mod.Message(mod.stringkeys.twl.readyDialog.minPlayersToStartFormat, 0);
    }
    return mod.Message(mod.stringkeys.twl.system.genericCounter, " ");
}

function getReadyDialogModeGridAllKnobKeys(): string[] {
    return READY_DIALOG_MODE_GRID_ALL_KNOB_KEYS;
}

function isReadyDialogModeGridPlaceholderKnobKey(knobKey: string): boolean {
    return knobKey === READY_DIALOG_CONFIG_MODE_SETTINGS_KNOB_KEY;
}

