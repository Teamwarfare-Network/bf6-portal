// @ts-nocheck
// Module: config/maps -- map registry and map-name key mappings

import './maps/blackwell-fields';
import './maps/defense-nexus';
import './maps/golf-course';
import './maps/mirak-valley';
import './maps/operation-firestorm';
import './maps/liberation-peak';
import './maps/manhattan-bridge';
import './maps/sobek-city';
import './maps/area-22b';

const MAP_CONFIGS: Record<MapKey, MapConfig> = {
    ...MAP_CONFIG_FRAGMENT_BLACKWELL_FIELDS,
    ...MAP_CONFIG_FRAGMENT_DEFENSE_NEXUS,
    ...MAP_CONFIG_FRAGMENT_GOLF_COURSE,
    ...MAP_CONFIG_FRAGMENT_MIRAK_VALLEY,
    ...MAP_CONFIG_FRAGMENT_OPERATION_FIRESTORM,
    ...MAP_CONFIG_FRAGMENT_LIBERATION_PEAK,
    ...MAP_CONFIG_FRAGMENT_MANHATTAN_BRIDGE,
    ...MAP_CONFIG_FRAGMENT_SOBEK_CITY,
    ...MAP_CONFIG_FRAGMENT_AREA_22B,
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

