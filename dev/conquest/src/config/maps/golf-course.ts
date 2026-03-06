// @ts-nocheck
// Module: config/maps/golf-course -- map config fragment for Golf_Course

const MAP_CONFIG_FRAGMENT_GOLF_COURSE = {
    //Granite_ClubHouse
    Golf_Course: {
                                   //posX     posY      posZ 
        team1Base: mod.CreateVector(-764.508, 146.696, -856.193), team1Name: mod.stringkeys.twl.teams.NORTH,
        team2Base: mod.CreateVector(-724.769, 141.317, -271.653), team2Name: mod.stringkeys.twl.teams.SOUTH,
        aircraftCeiling: 650,
        hudMaxY: 650,
        hudFloorY: 82,
        useCustomCeiling: false,
        vehicleSpawnYawOffsetDeg: 0,

        team1TankSpawns: [                        //posX      posY      posZ                             rotX      rotY      rotZ
            { slotNumber: 1, pos: mod.CreateVector(-765.032,  146.068, -863.307), rot: mod.CreateVector( 0.0,     -21.908,   0.0),       vehicle: mod.VehicleList.M2Bradley    },
            { slotNumber: 2, pos: mod.CreateVector(-758.398,  146.524, -861.890), rot: mod.CreateVector( 0.0,      9.287,    0.0),       vehicle: mod.VehicleList.M2Bradley    },
            { slotNumber: 3, pos: mod.CreateVector(-751.234,  147.373, -859.009), rot: mod.CreateVector( 0.0,      10.000,   0.0),       vehicle: mod.VehicleList.Abrams       },
            { slotNumber: 4, pos: mod.CreateVector(-741.779,  148.919, -856.751), rot: mod.CreateVector( 0.0,      20.000,   0.0),       vehicle: mod.VehicleList.M2Bradley    },
        ],
        team2TankSpawns: [                        //posX      posY      posZ                             posX      posY      posZ
            { slotNumber: 1, pos: mod.CreateVector(-722.800,  140.997, -275.980), rot: mod.CreateVector( 0.0,      138.357,  0.0),       vehicle: mod.VehicleList.CV90         },
            { slotNumber: 2, pos: mod.CreateVector(-716.045,  140.555, -270.219), rot: mod.CreateVector( 0.0,      138.357,  0.0),       vehicle: mod.VehicleList.CV90         },
            { slotNumber: 3, pos: mod.CreateVector(-709.327,  140.680, -264.968), rot: mod.CreateVector( 0.0,      138.179,  0.0),       vehicle: mod.VehicleList.Leopard      },
            { slotNumber: 4, pos: mod.CreateVector(-702.080,  140.625, -259.772), rot: mod.CreateVector( 0.0,      139.248,  0.0),       vehicle: mod.VehicleList.CV90         },
        ],
    },

};



