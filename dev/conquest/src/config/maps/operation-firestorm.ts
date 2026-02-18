// @ts-nocheck
// Module: config/maps/operation-firestorm -- map config fragment for Operation_Firestorm

const MAP_CONFIG_FRAGMENT_OPERATION_FIRESTORM = {
    //Firestorm
    Operation_Firestorm: {
                                   //posX      posY      posZ 
        team1Base: mod.CreateVector( 570.692,  110.205, -232.341), team1Name: mod.stringkeys.twl.teams.WEST,
        team2Base: mod.CreateVector(-761.869,  133.091,  223.038), team2Name: mod.stringkeys.twl.teams.EAST,
        aircraftCeiling: 130,
        hudMaxY: 735,
        hudFloorY: 132,
        useCustomCeiling: true,
        vehicleSpawnYawOffsetDeg: 0,

        team1TankSpawns: [                        //posX      posY      posZ                             rotX      rotY      rotZ
            { slotNumber: 1, pos: mod.CreateVector(-790.837,  132.971,  244.616), rot: mod.CreateVector( 0.0,      143.849,  0.0),       vehicle: mod.VehicleList.Abrams       },
            { slotNumber: 2, pos: mod.CreateVector(-785.022,  132.973,  246.953), rot: mod.CreateVector( 0.0,      140.047,  0.0),       vehicle: mod.VehicleList.Abrams       },
            { slotNumber: 3, pos: mod.CreateVector(-775.140,  132.971,  255.312), rot: mod.CreateVector( 0.0,      143.879,  0.0),       vehicle: mod.VehicleList.M2Bradley    },
            { slotNumber: 4, pos: mod.CreateVector(-770.277,  132.971,  259.296), rot: mod.CreateVector( 0.0,      141.651,  0.0),       vehicle: mod.VehicleList.Abrams       },

        ],
        team2TankSpawns: [                        //posX      posY      posZ                             posX      posY      posZ
            { slotNumber: 1, pos: mod.CreateVector( 601.735,  110.283, -230.246), rot: mod.CreateVector( 0.0,     -119.463,  0.0),       vehicle: mod.VehicleList.Leopard      },
            { slotNumber: 2, pos: mod.CreateVector( 608.379,  110.283, -233.569), rot: mod.CreateVector( 0.0,     -130.425,  0.0),       vehicle: mod.VehicleList.Leopard      },
            { slotNumber: 3, pos: mod.CreateVector( 615.366,  110.283, -243.288), rot: mod.CreateVector( 0.0,     -124.187,  0.0),       vehicle: mod.VehicleList.CV90         },
            { slotNumber: 4, pos: mod.CreateVector( 617.904,  110.297, -249.823), rot: mod.CreateVector( 0.0,     -125.702,  0.0),       vehicle: mod.VehicleList.Leopard      },
        ],
        team1HeliSpawns: [                        //posX      posY      posZ                             rotX      rotY      rotZ
            { slotNumber: 1, pos: mod.CreateVector(-811.597,  132.815,  234.165), rot: mod.CreateVector( 0.0,      105.178,  0.0),       vehicle: mod.VehicleList.AH64         },
            { slotNumber: 2, pos: mod.CreateVector(-767.544,  132.853,  172.755), rot: mod.CreateVector( 0.0,     -167.657,  0.0),       vehicle: mod.VehicleList.Eurocopter   },
            { slotNumber: 3, pos: mod.CreateVector(-782.131,  132.861,  198.011), rot: mod.CreateVector( 0.0,      48.206,   0.0),       vehicle: mod.VehicleList.AH64         },
            { slotNumber: 4, pos: mod.CreateVector(-738.726,  132.861,  209.182), rot: mod.CreateVector( 0.0,      115.606,  0.0),       vehicle: mod.VehicleList.UH60         },

        ],
        team2HeliSpawns: [                        //posX      posY      posZ                             posX      posY      posZ
            { slotNumber: 1, pos: mod.CreateVector( 553.976,  111.283, -256.070), rot: mod.CreateVector( 0.0,     -49.401,   0.0),       vehicle: mod.VehicleList.AH64         },
            { slotNumber: 2, pos: mod.CreateVector( 571.639,  111.174, -202.065), rot: mod.CreateVector( 0.0,     -46.728,   0.0),       vehicle: mod.VehicleList.Eurocopter   },
            { slotNumber: 3, pos: mod.CreateVector( 647.500,  110.562, -276.828), rot: mod.CreateVector( 0.0,     -126.059,  0.0),       vehicle: mod.VehicleList.AH64         },
            { slotNumber: 4, pos: mod.CreateVector( 636.239,  110.580, -258.841), rot: mod.CreateVector( 0.0,     -129.259,  0.0),       vehicle: mod.VehicleList.UH60_Pax     },
        ],
    },

};



