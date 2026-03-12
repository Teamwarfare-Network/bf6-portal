// @ts-nocheck
// Module: config/conquest-constants -- Phase 1 conquest scaffold constants (no gameplay activation yet)

const CONQUEST_STARTING_TICKETS = 350;
const CONQUEST_CAPTURE_TIME_SECONDS = 10;
const CONQUEST_NEUTRALIZATION_TIME_SECONDS = 15;
const CONQUEST_BLEED_PER_DIFF_PER_SECOND = 1 / 3;
const CONQUEST_SPAWN_CHARGE_PER_DEPLOY = 1;

// Combat HUD feature gate:
// - false: preserve non-combat UI systems (ready/admin/branding/victory) while combat HUD lanes are disabled.
// - true: enable combat ticket/flag/popout/engage rendering and strict root-chain enforcement.
const CONQUEST_COMBAT_HUD_ENABLED = true;
const CONQUEST_HUD_RUNTIME_DEFAULT_MODE: TwlConquestHudMode = "core";

// Combat HUD render-owner contract:
// - "v2": centered combat-v2 owns combat lanes; legacy combat lane render loop is bypassed.
// - "legacy": legacy combat lane render loop remains active.
const CONQUEST_COMBAT_RENDER_OWNER: "v2" | "legacy" = "legacy";

// Authoritative combat HUD runtime mode:
// - "off": no combat HUD render path writes.
// - "legacy": existing combat HUD methodology only.
// - "core": hard-cut TwlConquestHud pipeline only (new names, isolated path).
function getConquestHudMode(): TwlConquestHudMode {
    let override: unknown = undefined;
    try {
        override = State?.conquest?.debug?.hudModeOverride;
    } catch {
        override = undefined;
    }
    if (override === "off" || override === "legacy" || override === "core") {
        return override;
    }
    return CONQUEST_HUD_RUNTIME_DEFAULT_MODE;
}

function setConquestHudMode(mode: TwlConquestHudMode): void {
    try {
        State.conquest.debug.hudModeOverride = mode;
    } catch {
        // State may not be initialized yet during module load.
    }
}

// Returns true when combat-v2 is the active combat render owner.
function isConquestCombatRenderOwnerV2(): boolean {
    if (getConquestHudMode() !== "legacy") return false;
    return CONQUEST_COMBAT_RENDER_OWNER === "v2";
}
