// @ts-nocheck
// Module: config/maps/area-22b -- map config fragment for Area_22B

const MAP_CONFIG_FRAGMENT_AREA_22B = {
    //Granite Military RND Port
    Area_22B: {
                                   //posX      posY      posZ 
        team1Base: mod.CreateVector( 181.327,  173.193, -399.201), team1Name: mod.stringkeys.twl.teams.WEST,
        team2Base: mod.CreateVector( 782.013,  178.028, -508.792), team2Name: mod.stringkeys.twl.teams.EAST,
        aircraftCeiling: 650,
        hudMaxY: 650,
        hudFloorY: 82,
        useCustomCeiling: false,
        vehicleSpawnYawOffsetDeg: 0,

        team1TankSpawns: [                        //posX      posY      posZ                             rotX      rotY      rotZ
            { slotNumber: 1, pos: mod.CreateVector( 203.464,  173.651, -404.496), rot: mod.CreateVector( 0.0,      152.721,  0.0),       vehicle: mod.VehicleList.Abrams       },
            { slotNumber: 2, pos: mod.CreateVector( 198.157,  173.651, -411.804), rot: mod.CreateVector( 0.0,      152.632,  0.0),       vehicle: mod.VehicleList.M2Bradley    },
            { slotNumber: 3, pos: mod.CreateVector( 196.606,  173.521, -426.489), rot: mod.CreateVector( 0.0,      152.899,  0.0),       vehicle: mod.VehicleList.M2Bradley    },
            { slotNumber: 4, pos: mod.CreateVector( 195.018,  173.655, -440.699), rot: mod.CreateVector( 0.0,      152.543,  0.0),       vehicle: mod.VehicleList.Abrams       },
        ],
        team2TankSpawns: [                        //posX      posY      posZ                             posX      posY      posZ
            { slotNumber: 1, pos: mod.CreateVector( 805.706,  177.624, -474.481), rot: mod.CreateVector( 0.0,     -159.419,  0.0),       vehicle: mod.VehicleList.Leopard      },
            { slotNumber: 2, pos: mod.CreateVector( 799.506,  177.669, -490.156), rot: mod.CreateVector( 0.0,     -157.548,  0.0),       vehicle: mod.VehicleList.CV90         },
            { slotNumber: 3, pos: mod.CreateVector( 792.561,  177.628, -506.645), rot: mod.CreateVector( 0.0,     -156.924,  0.0),       vehicle: mod.VehicleList.CV90         },
            { slotNumber: 4, pos: mod.CreateVector( 786.340,  177.605, -520.613), rot: mod.CreateVector( 0.0,     -155.083,  0.0),       vehicle: mod.VehicleList.Leopard      },
        ],
    },
};



