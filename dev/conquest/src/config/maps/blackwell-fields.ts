// @ts-nocheck
// Module: config/maps/blackwell-fields -- map config fragment for Blackwell_Fields

const MAP_CONFIG_FRAGMENT_BLACKWELL_FIELDS = {
    //Badlands
    Blackwell_Fields: {             
                                   //posX      posY      posZ 
        team1Base: mod.CreateVector(-151.364,  86.948,  -567.672), team1Name: mod.stringkeys.twl.teams.WEST,
        team2Base: mod.CreateVector( 388.231,  71.652,   136.54),  team2Name: mod.stringkeys.twl.teams.EAST,
        aircraftCeiling: 650,
        hudMaxY: 650,
        hudFloorY: 82,
        useCustomCeiling: false,
        vehicleSpawnYawOffsetDeg: 0,

        team1TankSpawns: [                        //posX      posY      posZ                             posX      posY      posZ
            { slotNumber: 1, pos: mod.CreateVector(-163.285,  86.96,   -570.254), rot: mod.CreateVector( 0.0,      45.0,     0.0),       vehicle: mod.VehicleList.Abrams       },
            { slotNumber: 2, pos: mod.CreateVector(-169.559,  86.915,  -560.168), rot: mod.CreateVector( 0.0,      45.0,     0.0),       vehicle: mod.VehicleList.Abrams       },
            { slotNumber: 3, pos: mod.CreateVector(-178.174,  87.159,  -551.206), rot: mod.CreateVector( 0.0,      45.0,     0.0),       vehicle: mod.VehicleList.Abrams       },
            { slotNumber: 4, pos: mod.CreateVector(-185.833,  87.159,  -540.949), rot: mod.CreateVector( 0.0,      45.0,     0.0),       vehicle: mod.VehicleList.M2Bradley    },
        ],
        team2TankSpawns: [                        //posX      posY      posZ                             posX      posY      posZ
            { slotNumber: 1, pos: mod.CreateVector( 403.575,  71.227,   144.594), rot: mod.CreateVector( 0.0,     -90.0,     0.0),       vehicle: mod.VehicleList.Leopard      },
            { slotNumber: 2, pos: mod.CreateVector( 404.054,  71.227,   131.966), rot: mod.CreateVector( 0.0,     -90.0,     0.0),       vehicle: mod.VehicleList.Leopard      },
            { slotNumber: 3, pos: mod.CreateVector( 403.575,  71.227,   118.571), rot: mod.CreateVector( 0.0,     -90.0,     0.0),       vehicle: mod.VehicleList.Leopard      },
            { slotNumber: 4, pos: mod.CreateVector( 403.274,  71.227,   105.886), rot: mod.CreateVector( 0.0,     -90.0,     0.0),       vehicle: mod.VehicleList.CV90         },
        ],
    },

};



