// @ts-nocheck
// Module: config/maps -- map registry and map-name key mappings

import './maps/operation-firestorm';

const MAP_CONFIGS: Record<MapKey, MapConfig> = {
    ...MAP_CONFIG_FRAGMENT_OPERATION_FIRESTORM,
};

// MapKey -> Strings.json key mapping for the Ready dialog map label.
const MAP_NAME_STRINGKEYS: Record<MapKey, number> = {
    Operation_Firestorm: mod.stringkeys.twl.maps.operationFirestorm,
};

