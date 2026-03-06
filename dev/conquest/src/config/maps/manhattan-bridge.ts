// @ts-nocheck
// Module: config/maps/manhattan-bridge -- map config fragment for Manhattan_Bridge

const MAP_CONFIG_FRAGMENT_MANHATTAN_BRIDGE = {
    //Dumbo
    Manhattan_Bridge: {
                                   //posX      posY      posZ 
        team1Base: mod.CreateVector(-263.312,  52.308,  -460.612), team1Name: mod.stringkeys.twl.teams.WEST,
        team2Base: mod.CreateVector( 176.053,  57.474,  -243.843), team2Name: mod.stringkeys.twl.teams.EAST,
        aircraftCeiling: 190,
        hudMaxY: 180,
        hudFloorY: 57,
        useCustomCeiling: false,
        vehicleSpawnYawOffsetDeg: 0,

        team1TankSpawns: [                        //posX      posY      posZ                             rotX      rotY      rotZ
            { slotNumber: 1, pos: mod.CreateVector(-260.317,  52.079,  -451.475), rot: mod.CreateVector( 0.0,      34.687,   0.0),       vehicle: mod.VehicleList.Abrams       },
            { slotNumber: 2, pos: mod.CreateVector(-270.061,  52.079,  -448.680), rot: mod.CreateVector( 0.0,      52.245,   0.0),       vehicle: mod.VehicleList.M2Bradley    },
            { slotNumber: 3, pos: mod.CreateVector(-281.962,  52.079,  -448.604), rot: mod.CreateVector( 0.0,      52.067,   0.0),       vehicle: mod.VehicleList.Abrams       },
            { slotNumber: 4, pos: mod.CreateVector(-294.428,  52.079,  -448.772), rot: mod.CreateVector( 0.0,      40.659,   0.0),       vehicle: mod.VehicleList.M2Bradley    },
        ],
        team2TankSpawns: [                        //posX      posY      posZ                             posX      posY      posZ
            { slotNumber: 1, pos: mod.CreateVector( 205.271,  57.358,  -239.774), rot: mod.CreateVector( 0.0,     -90.0,     0.0),       vehicle: mod.VehicleList.Leopard      },
            { slotNumber: 2, pos: mod.CreateVector( 205.549,  57.358,  -247.822), rot: mod.CreateVector( 0.0,     -90.0,     0.0),       vehicle: mod.VehicleList.CV90         },
            { slotNumber: 3, pos: mod.CreateVector( 205.294,  57.358,  -251.986), rot: mod.CreateVector( 0.0,     -90.0,     0.0),       vehicle: mod.VehicleList.Leopard      },
            { slotNumber: 4, pos: mod.CreateVector( 202.707,  57.358,  -257.240), rot: mod.CreateVector( 0.0,     -90.0,     0.0),       vehicle: mod.VehicleList.CV90         },
        ],
        team1HeliSpawns: [                        //posX      posY      posZ                             rotX      rotY      rotZ
            { slotNumber: 1, pos: mod.CreateVector(-294.619,  51.391,  -462.816), rot: mod.CreateVector( 0.0,      90.308,   0.0),       vehicle: mod.VehicleList.AH64         },
            { slotNumber: 2, pos: mod.CreateVector(-248.193,  50.765,  -484.679), rot: mod.CreateVector( 0.0,      48.708,   0.0),       vehicle: mod.VehicleList.Eurocopter   },
            { slotNumber: 3, pos: mod.CreateVector(-330.070,  52.162,  -440.936), rot: mod.CreateVector( 0.0,      90.418,   0.0),       vehicle: mod.VehicleList.AH64         },
            { slotNumber: 4, pos: mod.CreateVector(-235.514,  50.891,  -503.161), rot: mod.CreateVector( 0.0,      59.224,   0.0),       vehicle: mod.VehicleList.UH60         },
        ],
        team2HeliSpawns: [                        //posX      posY      posZ                             posX      posY      posZ
            { slotNumber: 1, pos: mod.CreateVector( 182.774,  57.278,  -232.360), rot: mod.CreateVector( 0.0,     -104.021,  0.0),       vehicle: mod.VehicleList.AH64         },
            { slotNumber: 2, pos: mod.CreateVector( 173.916,  57.278,  -214.198), rot: mod.CreateVector( 0.0,     -178.439,  0.0),       vehicle: mod.VehicleList.Eurocopter   },
            { slotNumber: 3, pos: mod.CreateVector( 186.823,  57.278,  -211.892), rot: mod.CreateVector( 0.0,     -178.709,  0.0),       vehicle: mod.VehicleList.AH64         },
            { slotNumber: 4, pos: mod.CreateVector( 179.475,  57.278,  -195.944), rot: mod.CreateVector( 0.0,     -90.0,     0.0),       vehicle: mod.VehicleList.UH60_Pax     },
        ],
    },

};



