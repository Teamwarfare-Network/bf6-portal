// @ts-nocheck
// Module: interaction/ui-primary-click -- shared primary-click dedupe helpers for UI buttons

type UIButtonPrimaryClickPhase = "down" | "up";

type UIButtonPrimaryClickTracker = Record<number, {
    widgetName: string;
    atSeconds: number;
    phase: UIButtonPrimaryClickPhase;
}>;

function isUIButtonPrimaryClickEvent(eventUIButtonEvent: mod.UIButtonEvent): boolean {
    return mod.Equals(eventUIButtonEvent, mod.UIButtonEvent.ButtonDown)
        || mod.Equals(eventUIButtonEvent, mod.UIButtonEvent.ButtonUp);
}

function getUIButtonPrimaryClickPhase(eventUIButtonEvent: mod.UIButtonEvent): UIButtonPrimaryClickPhase {
    return mod.Equals(eventUIButtonEvent, mod.UIButtonEvent.ButtonDown) ? "down" : "up";
}

function shouldConsumeUIButtonPrimaryClick(
    tracker: UIButtonPrimaryClickTracker,
    playerId: number,
    widgetName: string,
    eventUIButtonEvent: mod.UIButtonEvent,
    debounceSeconds: number,
    releaseGraceSeconds: number
): boolean {
    const now = mod.GetMatchTimeElapsed();
    const phase = getUIButtonPrimaryClickPhase(eventUIButtonEvent);
    const prior = tracker[playerId];
    if (prior && prior.widgetName === widgetName) {
        if (
            prior.phase === "down"
            && phase === "up"
            && (now - prior.atSeconds) <= releaseGraceSeconds
        ) {
            delete tracker[playerId];
            return false;
        }

        if (
            prior.phase === phase
            && (now - prior.atSeconds) <= debounceSeconds
        ) {
            return false;
        }
    }

    tracker[playerId] = { widgetName, atSeconds: now, phase };
    return true;
}

function tryConsumeUIButtonPrimaryClickEvent(
    tracker: UIButtonPrimaryClickTracker,
    playerId: number,
    widgetName: string,
    eventUIButtonEvent: mod.UIButtonEvent,
    debounceSeconds: number,
    releaseGraceSeconds: number
): boolean {
    if (!isUIButtonPrimaryClickEvent(eventUIButtonEvent)) return false;
    return shouldConsumeUIButtonPrimaryClick(
        tracker,
        playerId,
        widgetName,
        eventUIButtonEvent,
        debounceSeconds,
        releaseGraceSeconds
    );
}
