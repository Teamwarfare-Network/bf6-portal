// @ts-nocheck
// Module: ui/conquest/hud-core/toggle -- mode helpers for hard-cut combat HUD runtime

function twlConquestHudGetMode(): TwlConquestHudMode {
    return getConquestHudMode();
}

function twlConquestHudSetMode(mode: TwlConquestHudMode): void {
    setConquestHudMode(mode);
    if (mode === "core") return;
    twlConquestHudHideAllPlayers();
}

