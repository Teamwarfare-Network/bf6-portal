// @ts-nocheck
// Module: vehicles/vehicle-classification -- authoritative vehicle-type classification shared by spawn and boundary logic

function isAircraftVehicleType(vehicleType: mod.VehicleList): boolean {
    switch (vehicleType) {
        case mod.VehicleList.AH64:
        case mod.VehicleList.Eurocopter:
        case VEHICLE_AH6M:
        case mod.VehicleList.UH60:
        case mod.VehicleList.UH60_Pax:
        case mod.VehicleList.F16:
        case mod.VehicleList.F22:
        case mod.VehicleList.JAS39:
        case mod.VehicleList.SU57:
            return true;
        default:
            return false;
    }
}

function isJetVehicleType(vehicleType: mod.VehicleList): boolean {
    switch (vehicleType) {
        case mod.VehicleList.F16:
        case mod.VehicleList.F22:
        case mod.VehicleList.JAS39:
        case mod.VehicleList.SU57:
            return true;
        default:
            return false;
    }
}

function isTankVehicleType(vehicleType: mod.VehicleList): boolean {
    switch (vehicleType) {
        case mod.VehicleList.Abrams:
        case mod.VehicleList.Leopard:
        case mod.VehicleList.CV90:
        case mod.VehicleList.M2Bradley:
        case mod.VehicleList.Cheetah:
        case mod.VehicleList.Gepard:
            return true;
        default:
            return false;
    }
}

function isAircraftVehicleInstance(vehicle: mod.Vehicle): boolean {
    if (!vehicle) return false;
    return (
        mod.CompareVehicleName(vehicle, mod.VehicleList.AH64)
        || mod.CompareVehicleName(vehicle, mod.VehicleList.Eurocopter)
        || mod.CompareVehicleName(vehicle, VEHICLE_AH6M)
        || mod.CompareVehicleName(vehicle, mod.VehicleList.UH60)
        || mod.CompareVehicleName(vehicle, mod.VehicleList.UH60_Pax)
        || mod.CompareVehicleName(vehicle, mod.VehicleList.F16)
        || mod.CompareVehicleName(vehicle, mod.VehicleList.F22)
        || mod.CompareVehicleName(vehicle, mod.VehicleList.JAS39)
        || mod.CompareVehicleName(vehicle, mod.VehicleList.SU57)
    );
}

// Positive-identification tank detector used only to REJECT engine-default Abrams from binding to
// aircraft slots (CQ_Bug_49). Cheetah/Gepard are intentionally excluded: `CompareVehicleName` returns
// false for them due to the engine enum swap (CQ_Bug_43), so listing them here would risk false
// negatives rather than false positives — but the engine default from `RuntimeSpawn_Common.VehicleSpawner`
// is always Abrams, so catching the main tank models is sufficient for the documented bug.
function isTankVehicleInstance(vehicle: mod.Vehicle): boolean {
    if (!vehicle) return false;
    return (
        mod.CompareVehicleName(vehicle, mod.VehicleList.Abrams)
        || mod.CompareVehicleName(vehicle, mod.VehicleList.Leopard)
        || mod.CompareVehicleName(vehicle, mod.VehicleList.CV90)
        || mod.CompareVehicleName(vehicle, mod.VehicleList.M2Bradley)
    );
}

