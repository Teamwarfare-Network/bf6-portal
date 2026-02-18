// @ts-nocheck
// Module: config/maps/sobek-city -- map config fragment for Sobek_City

const MAP_CONFIG_FRAGMENT_SOBEK_CITY = {
    //Sobek City
    Sobek_City: {
                                   //posX      posY      posZ 
        team1Base: mod.CreateVector(-340.465,  92.557,  -110.315), team1Name: mod.stringkeys.twl.teams.WEST,
        team2Base: mod.CreateVector( 200.196,  90.167,   10.717),  team2Name: mod.stringkeys.twl.teams.EAST,
        aircraftCeiling: 150,
        hudMaxY: 270,
        hudFloorY: 91,
        useCustomCeiling: true,
        vehicleSpawnYawOffsetDeg: 0,

        team1TankSpawns: [                        //posX      posY      posZ                             rotX      rotY      rotZ
            { slotNumber: 1, pos: mod.CreateVector(-313.122,  130.109,  91.317),  rot: mod.CreateVector( 0.0,      67.681,   0.0),       vehicle: mod.VehicleList.Abrams       },
            { slotNumber: 2, pos: mod.CreateVector(-306.857,  129.998,  84.500),  rot: mod.CreateVector( 0.0,      49.321,   0.0),       vehicle: mod.VehicleList.M2Bradley    },
            { slotNumber: 3, pos: mod.CreateVector(-309.858,  130.316,  102.124), rot: mod.CreateVector( 0.0,      61.442,   0.0),       vehicle: mod.VehicleList.Abrams       },
            { slotNumber: 4, pos: mod.CreateVector(-310.865,  130.825,  115.098), rot: mod.CreateVector( 0.0,      83.278,   0.0),       vehicle: mod.VehicleList.M2Bradley    },
        ],
        team2TankSpawns: [                        //posX      posY      posZ                             posX      posY      posZ
            { slotNumber: 1, pos: mod.CreateVector( 277.097,  139.725,  451.027), rot: mod.CreateVector( 0.0,     -157.176,  0.0),       vehicle: mod.VehicleList.Leopard      },
            { slotNumber: 2, pos: mod.CreateVector( 285.464,  139.449,  446.823), rot: mod.CreateVector( 0.0,     -137.924,  0.0),       vehicle: mod.VehicleList.CV90         },
            { slotNumber: 3, pos: mod.CreateVector( 270.023,  139.917,  457.538), rot: mod.CreateVector( 0.0,     -156.819,  0.0),       vehicle: mod.VehicleList.Leopard      },
            { slotNumber: 4, pos: mod.CreateVector( 257.938,  139.403,  459.032), rot: mod.CreateVector( 0.0,      162.094,  0.0),       vehicle: mod.VehicleList.CV90         },
        ],
        team1HeliSpawns: [                        //posX      posY      posZ                             rotX      rotY      rotZ
            { slotNumber: 1, pos: mod.CreateVector(-329.600,  91.704,  -102.008), rot: mod.CreateVector( 0.0,      101.481,  0.0),       vehicle: mod.VehicleList.AH64         },
            { slotNumber: 2, pos: mod.CreateVector(-319.809,  91.704,  -86.577),  rot: mod.CreateVector( 0.0,      121.801,  0.0),       vehicle: mod.VehicleList.Eurocopter   },
            { slotNumber: 3, pos: mod.CreateVector(-313.32,   92.297,  -73.7171), rot: mod.CreateVector( 0.0,      113.958,  0.0),       vehicle: mod.VehicleList.AH64         },
            { slotNumber: 4, pos: mod.CreateVector(-352.007,  92.395,  -126.313), rot: mod.CreateVector( 0.0,      23.305,   0.0),       vehicle: mod.VehicleList.UH60         },
        ],
        team2HeliSpawns: [                        //posX      posY      posZ                             posX      posY      posZ
            { slotNumber: 1, pos: mod.CreateVector( 210.864,  90.152,   10.986),  rot: mod.CreateVector( 0.0,     -125.319,  0.0),       vehicle: mod.VehicleList.AH64         },
            { slotNumber: 2, pos: mod.CreateVector( 202.300,  90.151,   23.839),  rot: mod.CreateVector( 0.0,     -129.553,  0.0),       vehicle: mod.VehicleList.Eurocopter   },
            { slotNumber: 3, pos: mod.CreateVector( 225.784,  91.31,    36.228),  rot: mod.CreateVector( 0.0,      140.278,  0.0),       vehicle: mod.VehicleList.AH64         },
            { slotNumber: 4, pos: mod.CreateVector( 232.906,  90.271,  -8.33),    rot: mod.CreateVector( 0.0,     -131.309,  0.0),       vehicle: mod.VehicleList.UH60_Pax     },
        ],
    },
    
};



