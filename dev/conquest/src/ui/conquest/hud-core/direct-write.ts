// @ts-nocheck
// Module: ui/conquest/hud-core/direct-write -- zero-validation text widget accessors for combat HUD hot path
//
// The combat HUD pipeline guarantees widget handle validity within each tick frame:
// - Single-threaded engine: no interrupt between pipeline check and render
// - Generation-stamp rebuild runs before render (pipeline.ts:51-62)
// - Per-frame stale-entry cleanup removes disconnected pids (pipeline.ts:141-149)
//
// These helpers skip resolveLiveUITextWidget (hud/status.ts:144-155) -- the defensive
// re-resolution by name that costs a GetUITextSize engine call per write, plus potential
// GetUIWidgetName + safeFind cascade on stale handles. For the combat HUD at 10p, this
// eliminates ~900 engine calls per frame.
//
// Scoped to combat HUD only. Other subsystems continue using safeSet* from hud/status.ts.

function directSetUITextLabel(widget: mod.UIWidget | undefined, label: mod.Message): void {
    if (!widget) return;
    try { mod.SetUITextLabel(widget, label); } catch {}
}

function directSetUITextColor(widget: mod.UIWidget | undefined, color: mod.Vector): void {
    if (!widget) return;
    try { mod.SetUITextColor(widget, color); } catch {}
}

function directSetUITextAlpha(widget: mod.UIWidget | undefined, alpha: number): void {
    if (!widget) return;
    try { mod.SetUITextAlpha(widget, alpha); } catch {}
}
