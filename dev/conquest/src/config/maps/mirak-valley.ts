// @ts-nocheck
// Module: config/maps/mirak-valley -- map config fragment for Mirak_Valley

const MAP_CONFIG_FRAGMENT_MIRAK_VALLEY = {
    //Tungsten
    Mirak_Valley: {
                                   //posX      posY      posZ 
        team1Base: mod.CreateVector(-505.641,  82.571,  -329.034), team1Name: mod.stringkeys.twl.teams.WEST,
        team2Base: mod.CreateVector( 428.32,   85.215,  -619.339), team2Name: mod.stringkeys.twl.teams.EAST,
        aircraftCeiling: 110,
        hudMaxY: 635,
        hudFloorY: 82,
        useCustomCeiling: true,
        vehicleSpawnYawOffsetDeg: 0,

        team1TankSpawns: [                        //posX      posY      posZ                             rotX      rotY      rotZ
            { slotNumber: 1, pos: mod.CreateVector(-497.328,  81.909,  -320.058), rot: mod.CreateVector( 0.0,      90.0,     0.0),       vehicle: mod.VehicleList.Abrams       },
            { slotNumber: 2, pos: mod.CreateVector(-493.699,  82.167,  -330.616), rot: mod.CreateVector( 0.0,      87.0,     0.0),       vehicle: mod.VehicleList.Abrams       },
            { slotNumber: 3, pos: mod.CreateVector(-488.869,  82.556,  -340.723), rot: mod.CreateVector( 0.0,      85.0,     0.0),       vehicle: mod.VehicleList.M2Bradley    },
            { slotNumber: 4, pos: mod.CreateVector(-485.335,  83.244,  -351.327), rot: mod.CreateVector( 0.0,      84.500,   0.0),       vehicle: mod.VehicleList.Abrams       },
        ],
        team2TankSpawns: [                        //posX      posY      posZ                             posX      posY      posZ
            { slotNumber: 1, pos: mod.CreateVector( 423.155,  85.160,  -609.593), rot: mod.CreateVector( 0.0,     -41.212,   0.0),       vehicle: mod.VehicleList.Leopard      },
            { slotNumber: 2, pos: mod.CreateVector( 412.416,  85.442,  -610.044), rot: mod.CreateVector( 0.0,     -45.580,   0.0),       vehicle: mod.VehicleList.Leopard      },
            { slotNumber: 3, pos: mod.CreateVector( 400.396,  85.775,  -610.576), rot: mod.CreateVector( 0.0,     -47.719,   0.0),       vehicle: mod.VehicleList.CV90         },
            { slotNumber: 4, pos: mod.CreateVector( 388.667,  86.085,  -611.596), rot: mod.CreateVector( 0.0,     -44.956,   0.0),       vehicle: mod.VehicleList.Leopard      },
        ],
        team1HeliSpawns: [                        //posX      posY      posZ                             rotX      rotY      rotZ
            { slotNumber: 1, pos: mod.CreateVector(-500.019,  81.257,  -292.899), rot: mod.CreateVector( 0.0,      98.404,   0.0),       vehicle: mod.VehicleList.AH64         },
            { slotNumber: 2, pos: mod.CreateVector(-498.055,  82.222,  -328.527), rot: mod.CreateVector( 0.0,      50.634,   0.0),       vehicle: mod.VehicleList.Eurocopter   },
            { slotNumber: 3, pos: mod.CreateVector(-512.883,  80.713,  -269.728), rot: mod.CreateVector( 0.0,      61.967,   0.0),       vehicle: mod.VehicleList.AH64         },
            { slotNumber: 4, pos: mod.CreateVector(-481.267,  82.761,  -345.178), rot: mod.CreateVector( 0.0,      29.312,   0.0),       vehicle: mod.VehicleList.UH60         },
        ],
        team2HeliSpawns: [                        //posX      posY      posZ                             posX      posY      posZ
            { slotNumber: 1, pos: mod.CreateVector( 454.968,  84.306,  -612.495), rot: mod.CreateVector( 0.0,     -4.780,    0.0),       vehicle: mod.VehicleList.AH64         },
            { slotNumber: 2, pos: mod.CreateVector( 461.746,  83.898,  -585.902), rot: mod.CreateVector( 0.0,     -157.452,  0.0),       vehicle: mod.VehicleList.Eurocopter   },
            { slotNumber: 3, pos: mod.CreateVector( 496.253,  83.173,  -600.711), rot: mod.CreateVector( 0.0,     -90.251,   0.0),       vehicle: mod.VehicleList.AH64         },
            { slotNumber: 4, pos: mod.CreateVector( 427.213,  85.239,  -587.691), rot: mod.CreateVector( 0.0,     -92.212,   0.0),       vehicle: mod.VehicleList.UH60_Pax     },
        ],
    },

};



