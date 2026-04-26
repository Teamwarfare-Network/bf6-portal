// @ts-nocheck
// Module: config/conquest-constants -- Phase 1 conquest scaffold constants (no gameplay activation yet)

// Compile-time feature flags: when FALSE, associated source files are excluded from the bundle
// and all external call sites are guarded to no-op. Toggle the matching imports in index.ts.
const FEATURE_PERF_DIAG = false;
const FEATURE_POSITION_DEBUG = false;
const FEATURE_ADMIN_PANEL = false;
const FEATURE_JOIN_PROMPT = false;

// When a player bails from an aircraft with world-Y above this threshold they are killed
// instantly. Vanilla engine only XZ-clips CombatVolume, so foot players above the
// GroundCombatVolume ceiling would otherwise drift without grey-zone enforcement.
const AIRCRAFT_BAIL_CEILING_Y = 200;

const CONQUEST_STARTING_TICKETS = 400;
const CONQUEST_CAPTURE_TIME_SECONDS = 20;
const CONQUEST_NEUTRALIZATION_TIME_SECONDS = 20;
const CONQUEST_BLEED_PER_DIFF_PER_SECOND = 1 / 3;
const CONQUEST_SPAWN_CHARGE_PER_DEPLOY = 1;

// Combat HUD feature gate:
// - false: preserve non-combat UI systems (ready/admin/branding/victory) while combat HUD lanes are disabled.
// - true: enable combat ticket/flag/popout/engage rendering and strict root-chain enforcement.
const CONQUEST_COMBAT_HUD_ENABLED = true;
const CONQUEST_HUD_RUNTIME_DEFAULT_MODE: TwlConquestHudMode = "core";
const CONQUEST_CAPTURE_SOUND_ENABLED = true;
const CONQUEST_CAPTURE_SOUND_FLUSH_SECONDS = 0.5;
const CONQUEST_CAPTURE_SOUND_MIN_COOLDOWN_SECONDS = 1.0;
const CONQUEST_CAPTURE_SOUND_PROGRESS_DELTA_MIN = 0.001;
const CONQUEST_CAPTURE_SOUND_AMPLITUDE = 0.5;
const CONQUEST_CAPTURE_SOUND_FRIENDLY_PREFAB = mod.RuntimeSpawn_Common.SFX_UI_Gamemode_Shared_CaptureObjectives_CapturingTickFriendly_OneShot2D;
const CONQUEST_CAPTURE_SOUND_ENEMY_PREFAB = mod.RuntimeSpawn_Common.SFX_UI_Gamemode_Shared_CaptureObjectives_CapturingTickEnemy_OneShot2D;
const CONQUEST_CAPTURE_VO_ENABLED = true;
const CONQUEST_CAPTURE_VO_CONTESTED_ENABLED = true;
const CONQUEST_CAPTURE_VO_FLUSH_SECONDS = 0.12;
const CONQUEST_CAPTURE_VO_MIN_COOLDOWN_SECONDS = 4.0;
const CONQUEST_CAPTURE_VO_TERMINAL_RECENT_SECONDS = 6.0;
const CONQUEST_CAPTURE_VO_RUNTIME_PREFAB = mod.RuntimeSpawn_Common.SFX_VOModule_OneShot2D;
const CONQUEST_CAPTURE_VO_ENEMY_TERMINAL_MODE: "lost" | "captured_enemy" = "captured_enemy";

// Authoritative combat HUD runtime mode:
// - "off": no combat HUD render path writes.
// - "core": hard-cut TwlConquestHud pipeline only (new names, isolated path).
function getConquestHudMode(): TwlConquestHudMode {
    let override: unknown = undefined;
    try {
        override = State?.conquest?.debug?.hudModeOverride;
    } catch {
        override = undefined;
    }
    if (override === "off" || override === "core") {
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

