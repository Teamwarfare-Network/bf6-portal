// @ts-nocheck
// Module: config/maps/defense-nexus -- map config fragment for Defense_Nexus

const MAP_CONFIG_FRAGMENT_DEFENSE_NEXUS = {
    //Granite_TechCampus
    Defense_Nexus: {
                                   //posX      posY      posZ 
        team1Base: mod.CreateVector(-151.0862, 133.694,  428.018), team1Name: mod.stringkeys.twl.teams.SOUTH,
        team2Base: mod.CreateVector(-107.727,  139.293,  123.248), team2Name: mod.stringkeys.twl.teams.NORTH,
        aircraftCeiling: 650,
        hudMaxY: 650,
        hudFloorY: 82,
        useCustomCeiling: false,
        vehicleSpawnYawOffsetDeg: 0, 

        team1TankSpawns: [                        //posX      posY      posZ                             rotX      rotY      rotZ
            { slotNumber: 1, pos: mod.CreateVector(-185.503,  136.596,  454.617), rot: mod.CreateVector( 0.0,     -165.834,  0.0),       vehicle: mod.VehicleList.M2Bradley    },
            { slotNumber: 2, pos: mod.CreateVector(-179.109,  136.146,  453.327), rot: mod.CreateVector( 0.0,     -158.526,  0.0),       vehicle: mod.VehicleList.M2Bradley    },
            { slotNumber: 3, pos: mod.CreateVector(-174.172,  135.140,  449.380), rot: mod.CreateVector( 0.0,     -149.256,  0.0),       vehicle: mod.VehicleList.Abrams       },
            { slotNumber: 4, pos: mod.CreateVector(-168.293,  134.067,  442.935), rot: mod.CreateVector( 0.0,     -135.442,  0.0),       vehicle: mod.VehicleList.M2Bradley    },
        ],
        team2TankSpawns: [                        //posX      posY      posZ                             posX      posY      posZ
            { slotNumber: 1, pos: mod.CreateVector(-108.824,  138.815,  112.209), rot: mod.CreateVector( 0.0,     -44.984,   0.0),       vehicle: mod.VehicleList.CV90         },
            { slotNumber: 2, pos: mod.CreateVector(-104.153,  138.530,  115.034), rot: mod.CreateVector( 0.0,     -44.717,   0.0),       vehicle: mod.VehicleList.CV90         },
            { slotNumber: 3, pos: mod.CreateVector(-101.378,  138.544,  119.263), rot: mod.CreateVector( 0.0,     -44.806,   0.0),       vehicle: mod.VehicleList.Leopard      },
            { slotNumber: 4, pos: mod.CreateVector(-116.566,  138.852,  104.175), rot: mod.CreateVector( 0.0,     -44.895,   0.0),       vehicle: mod.VehicleList.CV90         },
        ],
    },

};



