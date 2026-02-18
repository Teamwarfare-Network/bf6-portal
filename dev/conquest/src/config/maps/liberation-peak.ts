// @ts-nocheck
// Module: config/maps/liberation-peak -- map config fragment for Liberation_Peak

const MAP_CONFIG_FRAGMENT_LIBERATION_PEAK = {
    //Capstone
    Liberation_Peak: {
                                   //posX      posY      posZ 
        team1Base: mod.CreateVector(-323.365,  130.452,  83.211),  team1Name: mod.stringkeys.twl.teams.WEST,
        team2Base: mod.CreateVector( 281.887,  139.095,  464.187), team2Name: mod.stringkeys.twl.teams.EAST,
        aircraftCeiling: 160,
        hudMaxY: 635,
        hudFloorY: 139,
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
            { slotNumber: 1, pos: mod.CreateVector(-277.906,  130.461,  95.484),  rot: mod.CreateVector( 0.0,      130.773,  0.0),       vehicle: mod.VehicleList.AH64         },
            { slotNumber: 2, pos: mod.CreateVector(-284.413,  130.632,  85.634),  rot: mod.CreateVector( 0.0,      137.714,  0.0),       vehicle: mod.VehicleList.Eurocopter   },
            { slotNumber: 3, pos: mod.CreateVector(-326.491,  129.927,  82.657),  rot: mod.CreateVector( 0.0,     -23.622,   0.0),       vehicle: mod.VehicleList.AH64         },
            { slotNumber: 4, pos: mod.CreateVector(-348.578,  129.416,  77.118),  rot: mod.CreateVector( 0.0,     -22.475,   0.0),       vehicle: mod.VehicleList.UH60         },
        ],
        team2HeliSpawns: [                        //posX      posY      posZ                             posX      posY      posZ
            { slotNumber: 1, pos: mod.CreateVector( 255.257,  139.435,  459.687), rot: mod.CreateVector( 0.0,     -147.497,  0.0),       vehicle: mod.VehicleList.AH64         },
            { slotNumber: 2, pos: mod.CreateVector( 268.319,  139.781,  452.979), rot: mod.CreateVector( 0.0,     -154.694,  0.0),       vehicle: mod.VehicleList.Eurocopter   },
            { slotNumber: 3, pos: mod.CreateVector( 288.061,  139.34,   447.63),  rot: mod.CreateVector( 0.0,     -152.953,  0.0),       vehicle: mod.VehicleList.AH64         },
            { slotNumber: 4, pos: mod.CreateVector( 315.307,  136.512,  490.611), rot: mod.CreateVector( 0.0,     -144.246,  0.0),       vehicle: mod.VehicleList.UH60_Pax     },
        ],
    },

};



