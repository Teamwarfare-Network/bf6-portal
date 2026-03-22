// @ts-nocheck
// Module: config/maps/operation-firestorm -- map config fragment for Operation_Firestorm

const MAP_CONFIG_FRAGMENT_OPERATION_FIRESTORM = {
    //Firestorm
    Operation_Firestorm: {
                                   //posX      posY      posZ 
        team1Base: mod.CreateVector( 570.692,  110.205, -232.341), team1Name: mod.stringkeys.twl.teams.WEST,
        team2Base: mod.CreateVector(-761.869,  133.091,  223.038), team2Name: mod.stringkeys.twl.teams.EAST,
        team1VehicleDeploySpawnPointId: 504, // TODO: authored Firestorm Team 1 vehicle-deploy spawn point id
        team2VehicleDeploySpawnPointId: 503, // TODO: authored Firestorm Team 2 vehicle-deploy spawn point id
        aircraftCeiling: 130,
        hudMaxY: 735,
        hudFloorY: 132,
        useCustomCeiling: true,
        vehicleSpawnYawOffsetDeg: 0,
        team1AircraftSpawnVolumes: [ // Add "Aircraft Box 2", "Aircraft Box 3", etc. as more entries in this array.
            {
                label: "Team 1 Aircraft Box 1",
                enabled: false,
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
                enabled: true, // TODO(Phase 5F): author second aircraft box floor corners; then set true.
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
                rotPlane: mod.CreateVector(-75.0, 90.0, 0.0),
            },
        ],
        team2AircraftSpawnVolumes: [ // Add "Aircraft Box 2", "Aircraft Box 3", etc. as more entries in this array.
            {
                label: "Team 2 Aircraft Box 1",
                enabled: false,
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
                enabled: true, // TODO(Phase 5F): author second aircraft box floor corners; then set true.
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
                rotPlane: mod.CreateVector(-75.0, -90.0, 0.0),
            },
        ],
        team1TankSpawnVolumes: [
            {
                label: "Team 1 Tank Box 1",
                enabled: false, // TODO(Phase 5F): fill floor corners, height, and rotation; then set true.
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
                enabled: false, // TODO(Phase 5F): fill floor corners, height, and rotation; then set true.
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
                enabled: false, // TODO(Phase 5F): fill floor corners, height, and rotation; then set true.
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
                enabled: false, // TODO(Phase 5F): fill floor corners, height, and rotation; then set true.
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
        capturePoints: [
            { objId: 600, label: "A", order: 1 },
            { objId: 601, label: "B", order: 2 },
            { objId: 602, label: "C", order: 3 },
        ],

        team1TankSpawns: [                        //posX      posY      posZ                             rotX      rotY      rotZ
            { slotNumber: 1, pos: mod.CreateVector(-790.837,  132.971,  244.616), rot: mod.CreateVector( 0.0,      143.849,  0.0),       vehicle: mod.VehicleList.Abrams       },
            { slotNumber: 2, pos: mod.CreateVector(-785.022,  132.973,  246.953), rot: mod.CreateVector( 0.0,      140.047,  0.0),       vehicle: mod.VehicleList.Cheetah      },
            { slotNumber: 3, pos: mod.CreateVector(-775.140,  132.971,  255.312), rot: mod.CreateVector( 0.0,      143.879,  0.0),       vehicle: mod.VehicleList.M2Bradley    },
            { slotNumber: 4, pos: mod.CreateVector(-770.277,  132.971,  259.296), rot: mod.CreateVector( 0.0,      141.651,  0.0),       vehicle: mod.VehicleList.Abrams       },

        ],
        team2TankSpawns: [                        //posX      posY      posZ                             posX      posY      posZ
            { slotNumber: 1, pos: mod.CreateVector( 601.735,  110.283, -230.246), rot: mod.CreateVector( 0.0,     -119.463,  0.0),       vehicle: mod.VehicleList.Leopard      },
            { slotNumber: 2, pos: mod.CreateVector( 608.379,  110.283, -233.569), rot: mod.CreateVector( 0.0,     -130.425,  0.0),       vehicle: mod.VehicleList.Gepard       },
            { slotNumber: 3, pos: mod.CreateVector( 615.366,  110.283, -243.288), rot: mod.CreateVector( 0.0,     -124.187,  0.0),       vehicle: mod.VehicleList.CV90         },
            { slotNumber: 4, pos: mod.CreateVector( 617.904,  110.297, -249.823), rot: mod.CreateVector( 0.0,     -125.702,  0.0),       vehicle: mod.VehicleList.Leopard      },
        ],
        team1HeliSpawns: [                        //posX      posY      posZ                             rotX      rotY      rotZ
            { slotNumber: 1, pos: mod.CreateVector(-811.597,  132.815,  234.165), rot: mod.CreateVector( 0.0,      105.178,  0.0),       vehicle: mod.VehicleList.AH64         },
            { slotNumber: 2, pos: mod.CreateVector(-767.544,  132.853,  172.755), rot: mod.CreateVector( 0.0,     -167.657,  0.0),       vehicle: mod.VehicleList.UH60         },
            { slotNumber: 3, pos: mod.CreateVector(-782.131,  132.861,  198.011), rot: mod.CreateVector( 0.0,      48.206,   0.0),       vehicle: mod.VehicleList.AH64         },
            { slotNumber: 4, pos: mod.CreateVector(-738.726,  132.861,  209.182), rot: mod.CreateVector( 0.0,      115.606,  0.0),       vehicle: mod.VehicleList.UH60         },

        ],
        team2HeliSpawns: [                        //posX      posY      posZ                             posX      posY      posZ
            { slotNumber: 1, pos: mod.CreateVector( 553.976,  111.283, -256.070), rot: mod.CreateVector( 0.0,     -49.401,   0.0),       vehicle: mod.VehicleList.Eurocopter   },
            { slotNumber: 2, pos: mod.CreateVector( 571.639,  111.174, -202.065), rot: mod.CreateVector( 0.0,     -46.728,   0.0),       vehicle: mod.VehicleList.UH60_Pax     },
            { slotNumber: 3, pos: mod.CreateVector( 647.500,  110.562, -276.828), rot: mod.CreateVector( 0.0,     -126.059,  0.0),       vehicle: mod.VehicleList.AH64         },
            { slotNumber: 4, pos: mod.CreateVector( 636.239,  110.580, -258.841), rot: mod.CreateVector( 0.0,     -129.259,  0.0),       vehicle: mod.VehicleList.UH60_Pax     },
        ],
        team1JetSpawns: [
            { slotNumber: 1, pos: mod.CreateVector(-703.347, 132.686,  259.311), rot: mod.CreateVector(0.0,      0.914,  0.0),   vehicle: mod.VehicleList.F16 },
            { slotNumber: 2, pos: mod.CreateVector(-698.153, 132.564,  291.282), rot: mod.CreateVector(0.0,      0.898,  0.0),   vehicle: mod.VehicleList.F22 },
        ],
        team2JetSpawns: [
            { slotNumber: 1, pos: mod.CreateVector( 612.576, 110.580, -316.309), rot: mod.CreateVector(3.142,   -0.929,  3.142), vehicle: mod.VehicleList.JAS39 },
            { slotNumber: 2, pos: mod.CreateVector( 583.212, 110.595, -309.980), rot: mod.CreateVector(3.142,   -0.946,  3.142), vehicle: mod.VehicleList.SU57 },
        ],
        team1FastMoverSpawns: [
            { slotNumber: 1, pos: mod.CreateVector(-716.127, 132.847,  183.024), rot: mod.CreateVector(0.0,  0.756, 0.0), vehicle: mod.VehicleList.Quadbike  },
            { slotNumber: 2, pos: mod.CreateVector(-734.492, 132.866,  176.553), rot: mod.CreateVector(0.0,  1.565, 0.0), vehicle: mod.VehicleList.Quadbike  },
            { slotNumber: 3, pos: mod.CreateVector(-797.653, 132.861,  211.358), rot: mod.CreateVector(0.0,  1.250, 0.0), vehicle: mod.VehicleList.Marauder  },
            { slotNumber: 4, pos: mod.CreateVector(-776.271, 132.861,  187.308), rot: mod.CreateVector(0.0,  1.166, 0.0), vehicle: mod.VehicleList.Marauder  },
        ],
        team2FastMoverSpawns: [
            { slotNumber: 1, pos: mod.CreateVector( 549.641, 111.434, -239.906), rot: mod.CreateVector(0.0,  0.245, 0.0), vehicle: mod.VehicleList.Quadbike     },
            { slotNumber: 2, pos: mod.CreateVector( 571.273, 110.356, -222.866), rot: mod.CreateVector(0.0, -1.127, 0.0), vehicle: mod.VehicleList.Quadbike     },
            { slotNumber: 3, pos: mod.CreateVector( 582.318, 110.925, -267.865), rot: mod.CreateVector(0.0, -0.237, 0.0), vehicle: mod.VehicleList.Marauder_Pax },
            { slotNumber: 4, pos: mod.CreateVector( 596.913, 110.252, -221.642), rot: mod.CreateVector(0.0, -0.679, 0.0), vehicle: mod.VehicleList.Marauder_Pax },
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
                    team1Ground2: VEHICLE_CHEETAH,
                    team1Ground3: undefined,
                    team1Ground4: undefined,
                    team2Ground1: VEHICLE_LEOPARD,
                    team2Ground2: VEHICLE_GEPARD,
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
                    team1Ground2: VEHICLE_CHEETAH,
                    team1Ground3: undefined,
                    team1Ground4: undefined,
                    team2Ground1: VEHICLE_LEOPARD,
                    team2Ground2: VEHICLE_GEPARD,
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
                    team1Ground2: VEHICLE_CHEETAH,
                    team1Ground3: VEHICLE_M2BRADLEY,
                    team1Ground4: undefined,
                    team2Ground1: VEHICLE_LEOPARD,
                    team2Ground2: VEHICLE_GEPARD,
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



