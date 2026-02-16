// @ts-nocheck
// Module: config/maps -- static map data and map-name key mappings

const MAP_CONFIGS: Record<MapKey, MapConfig> = {

    //Badlands
    Blackwell_Fields: {             
                                   //posX      posY      posZ 
        team1Base: mod.CreateVector(-151.364,  86.948,  -567.672), team1Name: mod.stringkeys.twl.teams.WEST,
        team2Base: mod.CreateVector( 388.231,  71.652,   136.54),  team2Name: mod.stringkeys.twl.teams.EAST,
        aircraftCeiling: 650,
        hudMaxY: 650,
        hudFloorY: 82,
        useCustomCeiling: false,
        // ObjId pattern per zone: AreaTrigger 200+, Sector 300+, WorldIcon 400+, CapturePoint 600+.
        overtimeZones: [
            { areaTriggerObjId: 200, sectorId: 300, worldIconObjId: 400, capturePointObjId: 600 }, // A
            { areaTriggerObjId: 201, sectorId: 301, worldIconObjId: 401, capturePointObjId: 601 }, // B
            { areaTriggerObjId: 202, sectorId: 302, worldIconObjId: 402, capturePointObjId: 602 }, // C
            { areaTriggerObjId: 203, sectorId: 303, worldIconObjId: 403, capturePointObjId: 603 }, // D
            { areaTriggerObjId: 204, sectorId: 304, worldIconObjId: 404, capturePointObjId: 604 }, // E
            { areaTriggerObjId: 205, sectorId: 305, worldIconObjId: 405, capturePointObjId: 605 }, // F
            { areaTriggerObjId: 206, sectorId: 306, worldIconObjId: 406, capturePointObjId: 606 }, // G
            { areaTriggerObjId: 207, sectorId: 307, worldIconObjId: 407, capturePointObjId: 607 }, // H
        ],
        overtimeZoneLettersByMode: {
            tanks: OVERTIME_TANK_ZONE_LETTERS,
            helis: OVERTIME_HELI_ZONE_LETTERS,
        },
       
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

    //Granite_TechCampus
    Defense_Nexus: {
                                   //posX      posY      posZ 
        team1Base: mod.CreateVector(-151.0862, 133.694,  428.018), team1Name: mod.stringkeys.twl.teams.SOUTH,
        team2Base: mod.CreateVector(-107.727,  139.293,  123.248), team2Name: mod.stringkeys.twl.teams.NORTH,
        aircraftCeiling: 650,
        hudMaxY: 650,
        hudFloorY: 82,
        useCustomCeiling: false,
        // ObjId pattern per zone: AreaTrigger 200+, Sector 300+, WorldIcon 400+, CapturePoint 600+.
        overtimeZones: [
            { areaTriggerObjId: 200, sectorId: 300, worldIconObjId: 400, capturePointObjId: 600 }, // A
            { areaTriggerObjId: 201, sectorId: 301, worldIconObjId: 401, capturePointObjId: 601 }, // B
            { areaTriggerObjId: 202, sectorId: 302, worldIconObjId: 402, capturePointObjId: 602 }, // C
            { areaTriggerObjId: 203, sectorId: 303, worldIconObjId: 403, capturePointObjId: 603 }, // D
            { areaTriggerObjId: 204, sectorId: 304, worldIconObjId: 404, capturePointObjId: 604 }, // E
            { areaTriggerObjId: 205, sectorId: 305, worldIconObjId: 405, capturePointObjId: 605 }, // F
            { areaTriggerObjId: 206, sectorId: 306, worldIconObjId: 406, capturePointObjId: 606 }, // G
            { areaTriggerObjId: 207, sectorId: 307, worldIconObjId: 407, capturePointObjId: 607 }, // H
        ],
        overtimeZoneLettersByMode: {
            tanks: OVERTIME_TANK_ZONE_LETTERS,
            helis: OVERTIME_HELI_ZONE_LETTERS,
        },
    
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

    //Granite_ClubHouse
    Golf_Course: {
                                   //posX     posY      posZ 
        team1Base: mod.CreateVector(-764.508, 146.696, -856.193), team1Name: mod.stringkeys.twl.teams.NORTH,
        team2Base: mod.CreateVector(-724.769, 141.317, -271.653), team2Name: mod.stringkeys.twl.teams.SOUTH,
        aircraftCeiling: 650,
        hudMaxY: 650,
        hudFloorY: 82,
        useCustomCeiling: false,
        // ObjId pattern per zone: AreaTrigger 200+, Sector 300+, WorldIcon 400+, CapturePoint 600+.
        overtimeZones: [
            { areaTriggerObjId: 200, sectorId: 300, worldIconObjId: 400, capturePointObjId: 600 }, // A
            { areaTriggerObjId: 201, sectorId: 301, worldIconObjId: 401, capturePointObjId: 601 }, // B
            { areaTriggerObjId: 202, sectorId: 302, worldIconObjId: 402, capturePointObjId: 602 }, // C
            { areaTriggerObjId: 203, sectorId: 303, worldIconObjId: 403, capturePointObjId: 603 }, // D
            { areaTriggerObjId: 204, sectorId: 304, worldIconObjId: 404, capturePointObjId: 604 }, // E
            { areaTriggerObjId: 205, sectorId: 305, worldIconObjId: 405, capturePointObjId: 605 }, // F
            { areaTriggerObjId: 206, sectorId: 306, worldIconObjId: 406, capturePointObjId: 606 }, // G
            { areaTriggerObjId: 207, sectorId: 307, worldIconObjId: 407, capturePointObjId: 607 }, // H
        ],
        overtimeZoneLettersByMode: {
            tanks: OVERTIME_TANK_ZONE_LETTERS,
            helis: OVERTIME_HELI_ZONE_LETTERS,
        },
        
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

    //Tungsten
    Mirak_Valley: {
                                   //posX      posY      posZ 
        team1Base: mod.CreateVector(-505.641,  82.571,  -329.034), team1Name: mod.stringkeys.twl.teams.WEST,
        team2Base: mod.CreateVector( 428.32,   85.215,  -619.339), team2Name: mod.stringkeys.twl.teams.EAST,
        aircraftCeiling: 110,
        hudMaxY: 635,
        hudFloorY: 82,
        useCustomCeiling: true,
        // ObjId pattern per zone: AreaTrigger 200+, Sector 300+, WorldIcon 400+, CapturePoint 600+.
        overtimeZones: [
            { areaTriggerObjId: 200, sectorId: 300, worldIconObjId: 400, capturePointObjId: 600 }, // A
            { areaTriggerObjId: 201, sectorId: 301, worldIconObjId: 401, capturePointObjId: 601 }, // B
            { areaTriggerObjId: 202, sectorId: 302, worldIconObjId: 402, capturePointObjId: 602 }, // C
            { areaTriggerObjId: 203, sectorId: 303, worldIconObjId: 403, capturePointObjId: 603 }, // D
            { areaTriggerObjId: 204, sectorId: 304, worldIconObjId: 404, capturePointObjId: 604 }, // E
            { areaTriggerObjId: 205, sectorId: 305, worldIconObjId: 405, capturePointObjId: 605 }, // F
            { areaTriggerObjId: 206, sectorId: 306, worldIconObjId: 406, capturePointObjId: 606 }, // G
            { areaTriggerObjId: 207, sectorId: 307, worldIconObjId: 407, capturePointObjId: 607 }, // H
        ],
        overtimeZoneLettersByMode: {
            tanks: OVERTIME_TANK_ZONE_LETTERS,
            helis: OVERTIME_HELI_ZONE_LETTERS,
        },
       
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

    //Firestorm
    Operation_Firestorm: {
                                   //posX      posY      posZ 
        team1Base: mod.CreateVector( 570.692,  110.205, -232.341), team1Name: mod.stringkeys.twl.teams.WEST,
        team2Base: mod.CreateVector(-761.869,  133.091,  223.038), team2Name: mod.stringkeys.twl.teams.EAST,
        aircraftCeiling: 130,
        hudMaxY: 735,
        hudFloorY: 132,
        useCustomCeiling: true,
        // ObjId pattern per zone: AreaTrigger 200+, Sector 300+, WorldIcon 400+, CapturePoint 600+.
        overtimeZones: [
            { areaTriggerObjId: 200, sectorId: 300, worldIconObjId: 400, capturePointObjId: 600 }, // A
            { areaTriggerObjId: 201, sectorId: 301, worldIconObjId: 401, capturePointObjId: 601 }, // B
            { areaTriggerObjId: 202, sectorId: 302, worldIconObjId: 402, capturePointObjId: 602 }, // C
            { areaTriggerObjId: 203, sectorId: 303, worldIconObjId: 403, capturePointObjId: 603 }, // D
            { areaTriggerObjId: 204, sectorId: 304, worldIconObjId: 404, capturePointObjId: 604 }, // E
            { areaTriggerObjId: 205, sectorId: 305, worldIconObjId: 405, capturePointObjId: 605 }, // F
            { areaTriggerObjId: 206, sectorId: 306, worldIconObjId: 406, capturePointObjId: 606 }, // G
            { areaTriggerObjId: 207, sectorId: 307, worldIconObjId: 407, capturePointObjId: 607 }, // H
        ],
        overtimeZoneLettersByMode: {
            tanks: OVERTIME_TANK_ZONE_LETTERS,
            helis: OVERTIME_HELI_ZONE_LETTERS,
        },

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

    //Capstone
    Liberation_Peak: {
                                   //posX      posY      posZ 
        team1Base: mod.CreateVector(-323.365,  130.452,  83.211),  team1Name: mod.stringkeys.twl.teams.WEST,
        team2Base: mod.CreateVector( 281.887,  139.095,  464.187), team2Name: mod.stringkeys.twl.teams.EAST,
        aircraftCeiling: 160,
        hudMaxY: 635,
        hudFloorY: 139,
        useCustomCeiling: true,
        // ObjId pattern per zone: AreaTrigger 200+, Sector 300+, WorldIcon 400+, CapturePoint 600+.
        overtimeZones: [
            { areaTriggerObjId: 200, sectorId: 300, worldIconObjId: 400, capturePointObjId: 600 }, // A
            { areaTriggerObjId: 201, sectorId: 301, worldIconObjId: 401, capturePointObjId: 601 }, // B
            { areaTriggerObjId: 202, sectorId: 302, worldIconObjId: 402, capturePointObjId: 602 }, // C
            { areaTriggerObjId: 203, sectorId: 303, worldIconObjId: 403, capturePointObjId: 603 }, // D
            { areaTriggerObjId: 204, sectorId: 304, worldIconObjId: 404, capturePointObjId: 604 }, // E
            { areaTriggerObjId: 205, sectorId: 305, worldIconObjId: 405, capturePointObjId: 605 }, // F
            { areaTriggerObjId: 206, sectorId: 306, worldIconObjId: 406, capturePointObjId: 606 }, // G
            { areaTriggerObjId: 207, sectorId: 307, worldIconObjId: 407, capturePointObjId: 607 }, // H
        ],
        overtimeZoneLettersByMode: {
            tanks: OVERTIME_TANK_ZONE_LETTERS,
            helis: OVERTIME_HELI_ZONE_LETTERS,
        },
        
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

    //Dumbo
    Manhattan_Bridge: {
                                   //posX      posY      posZ 
        team1Base: mod.CreateVector(-263.312,  52.308,  -460.612), team1Name: mod.stringkeys.twl.teams.WEST,
        team2Base: mod.CreateVector( 176.053,  57.474,  -243.843), team2Name: mod.stringkeys.twl.teams.EAST,
        aircraftCeiling: 190,
        hudMaxY: 180,
        hudFloorY: 57,
        useCustomCeiling: false,
        // ObjId pattern per zone: AreaTrigger 200+, Sector 300+, WorldIcon 400+, CapturePoint 600+.
        overtimeZones: [
            { areaTriggerObjId: 200, sectorId: 300, worldIconObjId: 400, capturePointObjId: 600 }, // A
            { areaTriggerObjId: 201, sectorId: 301, worldIconObjId: 401, capturePointObjId: 601 }, // B
            { areaTriggerObjId: 202, sectorId: 302, worldIconObjId: 402, capturePointObjId: 602 }, // C
            { areaTriggerObjId: 203, sectorId: 303, worldIconObjId: 403, capturePointObjId: 603 }, // D
            { areaTriggerObjId: 204, sectorId: 304, worldIconObjId: 404, capturePointObjId: 604 }, // E
            { areaTriggerObjId: 205, sectorId: 305, worldIconObjId: 405, capturePointObjId: 605 }, // F
            { areaTriggerObjId: 206, sectorId: 306, worldIconObjId: 406, capturePointObjId: 606 }, // G
            { areaTriggerObjId: 207, sectorId: 307, worldIconObjId: 407, capturePointObjId: 607 }, // H
        ],
        overtimeZoneLettersByMode: {
            tanks: OVERTIME_TANK_ZONE_LETTERS,
            helis: OVERTIME_HELI_ZONE_LETTERS,
        },
       
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

    //Sobek City
    Sobek_City: {
                                   //posX      posY      posZ 
        team1Base: mod.CreateVector(-340.465,  92.557,  -110.315), team1Name: mod.stringkeys.twl.teams.WEST,
        team2Base: mod.CreateVector( 200.196,  90.167,   10.717),  team2Name: mod.stringkeys.twl.teams.EAST,
        aircraftCeiling: 150,
        hudMaxY: 270,
        hudFloorY: 91,
        useCustomCeiling: true,
        // ObjId pattern per zone: AreaTrigger 200+, Sector 300+, WorldIcon 400+, CapturePoint 600+.
        overtimeZones: [
            { areaTriggerObjId: 200, sectorId: 300, worldIconObjId: 400, capturePointObjId: 600 }, // A
            { areaTriggerObjId: 201, sectorId: 301, worldIconObjId: 401, capturePointObjId: 601 }, // B
            { areaTriggerObjId: 202, sectorId: 302, worldIconObjId: 402, capturePointObjId: 602 }, // C
            { areaTriggerObjId: 203, sectorId: 303, worldIconObjId: 403, capturePointObjId: 603 }, // D
            { areaTriggerObjId: 204, sectorId: 304, worldIconObjId: 404, capturePointObjId: 604 }, // E
            { areaTriggerObjId: 205, sectorId: 305, worldIconObjId: 405, capturePointObjId: 605 }, // F
            { areaTriggerObjId: 206, sectorId: 306, worldIconObjId: 406, capturePointObjId: 606 }, // G
            { areaTriggerObjId: 207, sectorId: 307, worldIconObjId: 407, capturePointObjId: 607 }, // H
        ],
        overtimeZoneLettersByMode: {
            tanks: OVERTIME_TANK_ZONE_LETTERS,
            helis: OVERTIME_HELI_ZONE_LETTERS,
        },
        
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
    
    //Granite Military RND Port
    Area_22B: {
                                   //posX      posY      posZ 
        team1Base: mod.CreateVector( 181.327,  173.193, -399.201), team1Name: mod.stringkeys.twl.teams.WEST,
        team2Base: mod.CreateVector( 782.013,  178.028, -508.792), team2Name: mod.stringkeys.twl.teams.EAST,
        aircraftCeiling: 650,
        hudMaxY: 650,
        hudFloorY: 82,
        useCustomCeiling: false,
        // ObjId pattern per zone: AreaTrigger 200+, Sector 300+, WorldIcon 400+, CapturePoint 600+.
        overtimeZones: [
            { areaTriggerObjId: 200, sectorId: 300, worldIconObjId: 400, capturePointObjId: 600 }, // A
            { areaTriggerObjId: 201, sectorId: 301, worldIconObjId: 401, capturePointObjId: 601 }, // B
            { areaTriggerObjId: 202, sectorId: 302, worldIconObjId: 402, capturePointObjId: 602 }, // C
            { areaTriggerObjId: 203, sectorId: 303, worldIconObjId: 403, capturePointObjId: 603 }, // D
            { areaTriggerObjId: 204, sectorId: 304, worldIconObjId: 404, capturePointObjId: 604 }, // E
            { areaTriggerObjId: 205, sectorId: 305, worldIconObjId: 405, capturePointObjId: 605 }, // F
            { areaTriggerObjId: 206, sectorId: 306, worldIconObjId: 406, capturePointObjId: 606 }, // G
            { areaTriggerObjId: 207, sectorId: 307, worldIconObjId: 407, capturePointObjId: 607 }, // H
        ],
        overtimeZoneLettersByMode: {
            tanks: OVERTIME_TANK_ZONE_LETTERS,
            helis: OVERTIME_HELI_ZONE_LETTERS,
        },
       
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

// MapKey -> Strings.json key mapping for the Ready dialog map label.
const MAP_NAME_STRINGKEYS: Record<MapKey, number> = {
    Blackwell_Fields: mod.stringkeys.twl.maps.blackwellFields,
    Defense_Nexus: mod.stringkeys.twl.maps.defenseNexus,
    Golf_Course: mod.stringkeys.twl.maps.golfCourse,
    Mirak_Valley: mod.stringkeys.twl.maps.mirakValley,
    Operation_Firestorm: mod.stringkeys.twl.maps.operationFirestorm,
    Liberation_Peak: mod.stringkeys.twl.maps.liberationPeak,
    Manhattan_Bridge: mod.stringkeys.twl.maps.manhattanBridge,
    Sobek_City: mod.stringkeys.twl.maps.sobekCity,
    Area_22B: mod.stringkeys.twl.maps.area22B,
};
