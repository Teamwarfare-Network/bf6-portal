// @ts-nocheck
// Module: foundation/modlib -- shared modlib import for local helpers

//#region -------------------- Modlib import --------------------

// If not using bundled TS project you need to use modlib import.
// @ts-ignore - ignores error on Portal webclient with importing modlib
import * as modlib from "modlib";
// TS project comes with local modlib functions, if using that then no need to import modlib
// - There seems to be an error with TS template's project local modlib FilteredArray function (drops all vehicles in vehicle array?!)

//#endregion ----------------- Modlib import --------------------
