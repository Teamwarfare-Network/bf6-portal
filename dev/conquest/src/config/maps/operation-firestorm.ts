// @ts-nocheck
// Module: config/maps/operation-firestorm -- map config fragment for Operation_Firestorm

// ObjId ownership, active allocations, and reserved ranges are documented in OBJ_ID_RUBRIC.md.

const MAP_CONFIG_FRAGMENT_OPERATION_FIRESTORM = {
    //Firestorm
    Operation_Firestorm: {
                                   //posX      posY      posZ 
        team1Base: mod.CreateVector(-761.869,  133.091,  223.038), team1Name: mod.stringkeys.twl.teams.WEST,
        team2Base: mod.CreateVector( 570.692,  110.205, -232.341), team2Name: mod.stringkeys.twl.teams.EAST,
        team1MainBaseTriggerId: 501, 
        team2MainBaseTriggerId: 500, 
        team1MainBaseBufferTriggerId: 503,
        team2MainBaseBufferTriggerId: 502, 
        groundCombatZoneTriggerId: 666,
        groundCombatZoneCeilingY: 200, // GroundCombatVolume: points y=100 (floor) + height=100 = ceiling y=200; from MP_TWL_Conquest11_FireStorm.spatial.json
        team1VehicleDeploySpawnPointId: 551, //tied to Godot Spawner
        team2VehicleDeploySpawnPointId: 550, //tied to Godot Spawner
        mainBaseInteractableObjIds: [1000, 1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008, 1009, 1010, 1011, 1012, 1013, 1014, 1015],
        mainBaseInteractableAnchors: [
            { objId: 1000, ownerTeamId: TeamID.Team2, pos: mod.CreateVector(543.660, 114.503, -222.605), vfx: VFX_GREEN_SMOKE, rot: mod.CreateVector(-90, 0, 0) },
            { objId: 1001, ownerTeamId: TeamID.Team2, pos: mod.CreateVector(540.783, 114.503, -225.179), vfx: VFX_VIOLET_SMOKE, rot: mod.CreateVector(-90, 0, 0) },
            { objId: 1002, ownerTeamId: TeamID.Team2, pos: mod.CreateVector(576.474, 113.856, -179.954), vfx: VFX_GREEN_SMOKE, rot: mod.CreateVector(-90, 0, 0) },
            { objId: 1003, ownerTeamId: TeamID.Team2, pos: mod.CreateVector(572.784, 113.856, -181.087), vfx: VFX_VIOLET_SMOKE, rot: mod.CreateVector(-90, 0, 0) },
            { objId: 1004, ownerTeamId: TeamID.Team2, pos: mod.CreateVector(642.969, 112.215, -245.541), vfx: VFX_GREEN_SMOKE, rot: mod.CreateVector(-90, 0, 0) },
            { objId: 1005, ownerTeamId: TeamID.Team2, pos: mod.CreateVector(640.976, 112.408, -242.724), vfx: VFX_VIOLET_SMOKE, rot: mod.CreateVector(-90, 0, 0) },
            { objId: 1006, ownerTeamId: TeamID.Team2, pos: mod.CreateVector(565.159, 113.899, -281.681), vfx: VFX_GREEN_SMOKE, rot: mod.CreateVector(-90, 0, 0) },
            { objId: 1007, ownerTeamId: TeamID.Team2, pos: mod.CreateVector(561.822, 113.899, -279.824), vfx: VFX_VIOLET_SMOKE, rot: mod.CreateVector(-90, 0, 0) },
            { objId: 1008, ownerTeamId: TeamID.Team1, pos: mod.CreateVector(-810.319, 134.252, 200.224), vfx: VFX_GREEN_SMOKE, rot: mod.CreateVector(-90, 0, 0) },
            { objId: 1009, ownerTeamId: TeamID.Team1, pos: mod.CreateVector(-809.334, 134.266, 203.858), vfx: VFX_VIOLET_SMOKE, rot: mod.CreateVector(-90, 0, 0) },
            { objId: 1010, ownerTeamId: TeamID.Team1, pos: mod.CreateVector(-756.764, 134.248, 161.880), vfx: VFX_GREEN_SMOKE, rot: mod.CreateVector(-90, 0, 0) },
            { objId: 1011, ownerTeamId: TeamID.Team1, pos: mod.CreateVector(-759.567, 134.258, 159.426), vfx: VFX_VIOLET_SMOKE, rot: mod.CreateVector(-90, 0, 0) },
            { objId: 1012, ownerTeamId: TeamID.Team1, pos: mod.CreateVector(-712.187, 134.310, 201.762), vfx: VFX_GREEN_SMOKE, rot: mod.CreateVector(-90, 0, 0) },
            { objId: 1013, ownerTeamId: TeamID.Team1, pos: mod.CreateVector(-715.728, 134.284, 200.155), vfx: VFX_VIOLET_SMOKE, rot: mod.CreateVector(-90, 0, 0) },
            { objId: 1014, ownerTeamId: TeamID.Team1, pos: mod.CreateVector(-774.771, 133.960, 278.100), vfx: VFX_GREEN_SMOKE, rot: mod.CreateVector(-90, 0, 0) },
            { objId: 1015, ownerTeamId: TeamID.Team1, pos: mod.CreateVector(-771.480, 133.919, 279.972), vfx: VFX_VIOLET_SMOKE, rot: mod.CreateVector(-90, 0, 0) },
        ],
        gadgetInteractableObjIds: [1050, 1051, 1052, 1053, 1054, 1055, 1056, 1057],
        gadgetInteractableAnchors: [
            { objId: 1050, ownerTeamId: 0, pos: mod.CreateVector(-310.151, 134.754, -38.6218), vfx: VFX_YELLOW_SMOKE, rot: mod.CreateVector(-90, 0, 0) },
            { objId: 1051, ownerTeamId: 0, pos: mod.CreateVector(-294.866, 134.908, -128.322), vfx: VFX_YELLOW_SMOKE, rot: mod.CreateVector(-90, 0, 0) },
            { objId: 1052, ownerTeamId: 0, pos: mod.CreateVector(-115.607, 125.677, -176.179), vfx: VFX_YELLOW_SMOKE, rot: mod.CreateVector(-90, 0, 0) },
            { objId: 1053, ownerTeamId: 0, pos: mod.CreateVector(-102.937, 124.363, -0.645716), vfx: VFX_YELLOW_SMOKE, rot: mod.CreateVector(-90, 0, 0) },
            { objId: 1054, ownerTeamId: 0, pos: mod.CreateVector(102.078, 122.168, -152.41), vfx: VFX_YELLOW_SMOKE, rot: mod.CreateVector(-90, 0, 0) },
            { objId: 1055, ownerTeamId: 0, pos: mod.CreateVector(79.5491, 120.983, -57.5276), vfx: VFX_YELLOW_SMOKE, rot: mod.CreateVector(-90, 0, 0) },
            { objId: 1056, ownerTeamId: 0, pos: mod.CreateVector(-726.711, 133.687, 203.667), vfx: VFX_YELLOW_SMOKE, rot: mod.CreateVector(-90, 0, 0) },
            { objId: 1057, ownerTeamId: 0, pos: mod.CreateVector(602.304, 111.096, -223.565), vfx: VFX_YELLOW_SMOKE, rot: mod.CreateVector(-90, 0, 0) },
        ],
        aircraftCeiling: 130,
        hudMaxY: 735,
        hudFloorY: 132,
        useCustomCeiling: false,
        vehicleSpawnYawOffsetDeg: 0,
        team1AircraftSpawnVolumes: [ // Add "Aircraft Box 2", "Aircraft Box 3", etc. as more entries in this array.
            {
                label: "Team 1 Aircraft Box 1",
                enabled: false, //old box just outside main base
                floorCorners: [
                    mod.CreateVector(-449.608, 250.000, 614.305),
                    mod.CreateVector(-610.555, 250.000, 792.820),
                    mod.CreateVector(-1165.077, 250.000, 506.148),
                    mod.CreateVector(-1006.251, 250.000, 364.662),
                ] as [mod.Vector, mod.Vector, mod.Vector, mod.Vector],
                heliSpawnCeiling: 200.0,
                jetSpawnFloor: 1000.0 - 250,
                jetSpawnCeiling: 800.0 - 250,
                rotHeli: mod.CreateVector(0.0, 125, 0.0),
                rotPlane: mod.CreateVector(-75.0, 125.0, 0.0),
            },
            {
                label: "Team 1 Aircraft Box 2",
                enabled: true, 
                floorCorners: [
                    mod.CreateVector(-1700.0, 250.0, -1450.0),
                    mod.CreateVector(-1950.0, 250.0, -1450.0),
                    mod.CreateVector(-1950.0, 250.0,  1300.0),
                    mod.CreateVector(-1700.0, 250.0,  1300.0),
                ] as [mod.Vector, mod.Vector, mod.Vector, mod.Vector],
                heliSpawnCeiling: 200.0,
                jetSpawnFloor: 1000.0 - 250,
                jetSpawnCeiling: 800.0 - 250,
                rotHeli: mod.CreateVector(0.0, 90, 0.0),
                rotPlane: mod.CreateVector(-45.0, 90.0, 0.0),
            },
        ],
        team2AircraftSpawnVolumes: [ // Add "Aircraft Box 2", "Aircraft Box 3", etc. as more entries in this array.
            {
                label: "Team 2 Aircraft Box 1",
                enabled: false,  //old box just outside main base
                floorCorners: [
                    mod.CreateVector(289.297, 250.000, -820.513),
                    mod.CreateVector(465.372, 250.000, -984.494),
                    mod.CreateVector(1034.105, 250.000, -196.395),
                    mod.CreateVector(855.555, 250.000, -139.933),
                ] as [mod.Vector, mod.Vector, mod.Vector, mod.Vector],
                heliSpawnCeiling: 200.0,
                jetSpawnFloor: 1000.0 - 250,
                jetSpawnCeiling: 800.0 - 250,
                rotHeli: mod.CreateVector(0.0, -55.0, 0.0),
                rotPlane: mod.CreateVector(-75.0, -55.0, 0.0),
            },
            {
                label: "Team 2 Aircraft Box 2",
                enabled: true,
                floorCorners: [
                    mod.CreateVector(1700.0, 250.0, 1300.0),
                    mod.CreateVector(1450.0, 250.0, 1300.0),
                    mod.CreateVector(1450.0, 250.0,-1450.0),
                    mod.CreateVector(1700.0, 250.0,-1450.0),
                ] as [mod.Vector, mod.Vector, mod.Vector, mod.Vector],
                heliSpawnCeiling: 200.0,
                jetSpawnFloor: 1000.0 - 250,
                jetSpawnCeiling: 800.0 - 250,
                rotHeli: mod.CreateVector(0.0, -90, 0.0),
                rotPlane: mod.CreateVector(-45.0, -90.0, 0.0),
            },
        ],
        team1TankSpawnVolumes: [
            {
                label: "Team 1 Tank Box 1",
                enabled: false, //before setting true, needs user definition and setup and button code added for "forward spawner"
                floorCorners: [
                    mod.CreateVector(0.0, 0.0, 0.0),
                    mod.CreateVector(0.0, 0.0, 0.0),
                    mod.CreateVector(0.0, 0.0, 0.0),
                    mod.CreateVector(0.0, 0.0, 0.0),
                ] as [mod.Vector, mod.Vector, mod.Vector, mod.Vector],
                heliSpawnCeiling: 0.0,
                jetSpawnFloor: 0.0,
                jetSpawnCeiling: 0.0,
                rotHeli: mod.CreateVector(0.0, 0.0, 0.0),
                rotPlane: mod.CreateVector(0.0, 0.0, 0.0),
            },
            {
                label: "Team 1 Tank Box 2",
                enabled: false, //before setting true, needs user definition and setup and button code added?
                floorCorners: [
                    mod.CreateVector(0.0, 0.0, 0.0),
                    mod.CreateVector(0.0, 0.0, 0.0),
                    mod.CreateVector(0.0, 0.0, 0.0),
                    mod.CreateVector(0.0, 0.0, 0.0),
                ] as [mod.Vector, mod.Vector, mod.Vector, mod.Vector],
                heliSpawnCeiling: 0.0,
                jetSpawnFloor: 0.0,
                jetSpawnCeiling: 0.0,
                rotHeli: mod.CreateVector(0.0, 0.0, 0.0),
                rotPlane: mod.CreateVector(0.0, 0.0, 0.0),
            },
        ],
        team2TankSpawnVolumes: [
            {
                label: "Team 2 Tank Box 1",
                enabled: false, //before setting true, needs user definition and setup and button code added for "forward spawner"
                floorCorners: [
                    mod.CreateVector(0.0, 0.0, 0.0),
                    mod.CreateVector(0.0, 0.0, 0.0),
                    mod.CreateVector(0.0, 0.0, 0.0),
                    mod.CreateVector(0.0, 0.0, 0.0),
                ] as [mod.Vector, mod.Vector, mod.Vector, mod.Vector],
                heliSpawnCeiling: 0.0,
                jetSpawnFloor: 0.0,
                jetSpawnCeiling: 0.0,
                rotHeli: mod.CreateVector(0.0, 0.0, 0.0),
                rotPlane: mod.CreateVector(0.0, 0.0, 0.0),
            },
            {
                label: "Team 2 Tank Box 2",
                enabled: false, //before setting true, needs user definition and setup and button code added?
                floorCorners: [
                    mod.CreateVector(0.0, 0.0, 0.0),
                    mod.CreateVector(0.0, 0.0, 0.0),
                    mod.CreateVector(0.0, 0.0, 0.0),
                    mod.CreateVector(0.0, 0.0, 0.0),
                ] as [mod.Vector, mod.Vector, mod.Vector, mod.Vector],
                heliSpawnCeiling: 0.0,
                jetSpawnFloor: 0.0,
                jetSpawnCeiling: 0.0,
                rotHeli: mod.CreateVector(0.0, 0.0, 0.0),
                rotPlane: mod.CreateVector(0.0, 0.0, 0.0),
            },
        ],
        capturePoints: [ //600-606 reserved for Maximum 7 flags, must be in spatial data and in order for Engine HUD display logic
            { objId: 600, label: "A", order: 1 },
            { objId: 601, label: "B", order: 2 },
            { objId: 602, label: "C", order: 3 },
        ],

        team1TankSpawns: [                        //posX      posY      posZ                             rotX      rotY      rotZ
            { slotNumber: 1, pos: mod.CreateVector(-790.837,  132.971,  244.616), rot: mod.CreateVector( 0.0,      143.849,  0.0)},
            { slotNumber: 2, pos: mod.CreateVector(-785.022,  132.973,  246.953), rot: mod.CreateVector( 0.0,      140.047,  0.0)},
            { slotNumber: 3, pos: mod.CreateVector(-775.140,  132.971,  255.312), rot: mod.CreateVector( 0.0,      143.879,  0.0)},
            { slotNumber: 4, pos: mod.CreateVector(-770.277,  132.971,  259.296), rot: mod.CreateVector( 0.0,      141.651,  0.0)},

        ],
        team2TankSpawns: [                        //posX      posY      posZ                             posX      posY      posZ
            { slotNumber: 1, pos: mod.CreateVector( 601.735,  110.283, -230.246), rot: mod.CreateVector( 0.0,     -119.463,  0.0)},
            { slotNumber: 2, pos: mod.CreateVector( 608.379,  110.283, -233.569), rot: mod.CreateVector( 0.0,     -130.425,  0.0)},
            { slotNumber: 3, pos: mod.CreateVector( 615.366,  110.283, -243.288), rot: mod.CreateVector( 0.0,     -124.187,  0.0)},
            { slotNumber: 4, pos: mod.CreateVector( 617.904,  110.297, -249.823), rot: mod.CreateVector( 0.0,     -125.702,  0.0)},
        ],
        team1HeliSpawns: [                        //posX      posY      posZ                             rotX      rotY      rotZ
            { slotNumber: 1, pos: mod.CreateVector(-811.597,  132.815,  234.165), rot: mod.CreateVector( 0.0,      105.178,  0.0)},
            { slotNumber: 2, pos: mod.CreateVector(-767.544,  132.853,  172.755), rot: mod.CreateVector( 0.0,     -167.657,  0.0)},
            { slotNumber: 3, pos: mod.CreateVector(-782.131,  132.861,  198.011), rot: mod.CreateVector( 0.0,      48.206,   0.0)},
            { slotNumber: 4, pos: mod.CreateVector(-738.726,  132.861,  209.182), rot: mod.CreateVector( 0.0,      115.606,  0.0)},

        ],
        team2HeliSpawns: [                        //posX      posY      posZ                             posX      posY      posZ
            { slotNumber: 1, pos: mod.CreateVector( 553.976,  111.283, -256.070), rot: mod.CreateVector( 0.0,     -49.401,   0.0)},
            { slotNumber: 2, pos: mod.CreateVector( 571.639,  111.174, -202.065), rot: mod.CreateVector( 0.0,     -46.728,   0.0)},
            { slotNumber: 3, pos: mod.CreateVector( 647.500,  110.562, -276.828), rot: mod.CreateVector( 0.0,     -126.0,    0.0)},
            { slotNumber: 4, pos: mod.CreateVector( 636.239,  110.580, -258.841), rot: mod.CreateVector( 0.0,     -129.259,  0.0)},
        ],
        team1JetSpawns: [
            { slotNumber: 1, pos: mod.CreateVector(-703.347, 132.686,  259.311), rot: mod.CreateVector(0.0,      52.372,  0.0)},
            { slotNumber: 2, pos: mod.CreateVector(-698.153, 132.564,  291.282), rot: mod.CreateVector(0.0,      51.454,  0.0)},
        ],
        team2JetSpawns: [
            { slotNumber: 1, pos: mod.CreateVector( 612.576, 110.580, -316.309), rot: mod.CreateVector(180.0,   -126.0,   180.0)},
            { slotNumber: 2, pos: mod.CreateVector( 583.212, 110.595, -309.980), rot: mod.CreateVector(180.0,   -126.0,   180.0)},
        ],
        team1FastMoverSpawns: [
            { slotNumber: 1, pos: mod.CreateVector(-716.127, 132.847,  183.024), rot: mod.CreateVector(0.0,  134.0,  0.0)},
            { slotNumber: 2, pos: mod.CreateVector(-734.492, 132.866,  176.553), rot: mod.CreateVector(0.0,  89.668, 0.0)},
            { slotNumber: 3, pos: mod.CreateVector(-797.653, 132.861,  211.358), rot: mod.CreateVector(0.0,  71.620, 0.0)},
            { slotNumber: 4, pos: mod.CreateVector(-776.271, 132.861,  187.308), rot: mod.CreateVector(0.0,  66.811, 0.0)},
        ],
        team2FastMoverSpawns: [
            { slotNumber: 1, pos: mod.CreateVector( 549.641, 111.434, -239.906), rot: mod.CreateVector(0.0,  14.037, 0.0)},
            { slotNumber: 2, pos: mod.CreateVector( 571.273, 110.356, -222.866), rot: mod.CreateVector(0.0, -64.556, 0.0)},
            { slotNumber: 3, pos: mod.CreateVector( 582.318, 110.925, -267.865), rot: mod.CreateVector(0.0, -13.579, 0.0)},
            { slotNumber: 4, pos: mod.CreateVector( 596.913, 110.252, -221.642), rot: mod.CreateVector(0.0, -90.0,   0.0)},
        ],
        readyDialogPresetPackages: {
            [mod.stringkeys.twl.readyDialog.gameModeConquest8v8]: {
                playersPerSide: 8,
                vehicleSelectionByKey: {
                    team1Jet1: undefined,
                    team1Jet2: undefined,
                    team2Jet1: undefined,
                    team2Jet2: undefined,

                    team1Heli1: VEHICLE_AH6M,
                    team1Heli2: undefined,
                    team2Heli1: VEHICLE_AH6M,
                    team2Heli2: undefined,

                    team1Ground1: VEHICLE_ABRAMS,
                    team1Ground2: undefined,
                    team1Ground3: undefined,
                    team1Ground4: undefined,
                    team2Ground1: VEHICLE_LEOPARD,
                    team2Ground2: undefined,
                    team2Ground3: undefined,
                    team2Ground4: undefined,

                    team1Fast1: VEHICLE_QUADBIKE,
                    team1Fast2: VEHICLE_FLYER60,
                    team1Fast3: undefined,
                    team1Fast4: undefined,
                    team2Fast1: VEHICLE_QUADBIKE,
                    team2Fast2: VEHICLE_FLYER60,
                    team2Fast3: undefined,
                    team2Fast4: undefined,
                },
            },
            [mod.stringkeys.twl.readyDialog.gameModeConquest10v10]: {
                playersPerSide: 10,
                vehicleSelectionByKey: {
                    team1Jet1: VEHICLE_F16,
                    team1Jet2: undefined,
                    team2Jet1: VEHICLE_JAS39,
                    team2Jet2: undefined,

                    team1Heli1: VEHICLE_AH6M,
                    team1Heli2: undefined,
                    team2Heli1: VEHICLE_AH6M,
                    team2Heli2: undefined,

                    team1Ground1: VEHICLE_ABRAMS,
                    team1Ground2: VEHICLE_GEPARD,    // Engine "Gepard" = actual Cheetah 1A2
                    team1Ground3: undefined,
                    team1Ground4: undefined,
                    team2Ground1: VEHICLE_LEOPARD,
                    team2Ground2: VEHICLE_CHEETAH,  // Engine "Cheetah" = actual GE-26 PAX (Gepard)
                    team2Ground3: undefined,
                    team2Ground4: undefined,

                    team1Fast1: VEHICLE_QUADBIKE,
                    team1Fast2: VEHICLE_FLYER60,
                    team1Fast3: VEHICLE_UH60,
                    team1Fast4: VEHICLE_QUADBIKE,
                    team2Fast1: VEHICLE_QUADBIKE,
                    team2Fast2: VEHICLE_FLYER60,
                    team2Fast3: VEHICLE_UH60_PAX,
                    team2Fast4: VEHICLE_QUADBIKE,
                },
            },
            [mod.stringkeys.twl.readyDialog.gameModeConquest12v12]: {
                playersPerSide: 12,
                vehicleSelectionByKey: {
                    team1Jet1: VEHICLE_F16,
                    team1Jet2: undefined,
                    team2Jet1: VEHICLE_JAS39,
                    team2Jet2: undefined,

                    team1Heli1: VEHICLE_AH64,
                    team1Heli2: VEHICLE_AH6M,
                    team2Heli1: VEHICLE_EUROCOPTER,
                    team2Heli2: VEHICLE_AH6M,

                    team1Ground1: VEHICLE_ABRAMS,
                    team1Ground2: VEHICLE_GEPARD,    // Engine "Gepard" = actual Cheetah 1A2
                    team1Ground3: undefined,
                    team1Ground4: undefined,
                    team2Ground1: VEHICLE_LEOPARD,
                    team2Ground2: VEHICLE_CHEETAH,  // Engine "Cheetah" = actual GE-26 PAX (Gepard)
                    team2Ground3: undefined,
                    team2Ground4: undefined,

                    team1Fast1: VEHICLE_QUADBIKE,
                    team1Fast2: VEHICLE_FLYER60,
                    team1Fast3: VEHICLE_UH60,
                    team1Fast4: VEHICLE_QUADBIKE,
                    team2Fast1: VEHICLE_QUADBIKE,
                    team2Fast2: VEHICLE_FLYER60,
                    team2Fast3: VEHICLE_UH60_PAX,
                    team2Fast4: VEHICLE_QUADBIKE,
                },
            },
            [mod.stringkeys.twl.readyDialog.gameModeConquest16v16]: {
                playersPerSide: 16,
                vehicleSelectionByKey: {
                    team1Jet1: VEHICLE_F16,
                    team1Jet2: undefined,
                    team2Jet1: VEHICLE_JAS39,
                    team2Jet2: undefined,

                    team1Heli1: VEHICLE_AH64,
                    team1Heli2: VEHICLE_AH6M,
                    team2Heli1: VEHICLE_EUROCOPTER,
                    team2Heli2: VEHICLE_AH6M,

                    team1Ground1: VEHICLE_ABRAMS,
                    team1Ground2: VEHICLE_GEPARD,    // Engine "Gepard" = actual Cheetah 1A2
                    team1Ground3: VEHICLE_M2BRADLEY,
                    team1Ground4: undefined,
                    team2Ground1: VEHICLE_LEOPARD,
                    team2Ground2: VEHICLE_CHEETAH,  // Engine "Cheetah" = actual GE-26 PAX (Gepard)
                    team2Ground3: VEHICLE_CV90,
                    team2Ground4: undefined,

                    team1Fast1: VEHICLE_QUADBIKE,
                    team1Fast2: VEHICLE_FLYER60,
                    team1Fast3: VEHICLE_UH60,
                    team1Fast4: VEHICLE_QUADBIKE,
                    team2Fast1: VEHICLE_QUADBIKE,
                    team2Fast2: VEHICLE_FLYER60,
                    team2Fast3: VEHICLE_UH60_PAX,
                    team2Fast4: VEHICLE_QUADBIKE,
                },
            },
        },
    },

};





