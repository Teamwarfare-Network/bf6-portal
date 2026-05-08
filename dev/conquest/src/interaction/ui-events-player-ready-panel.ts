// @ts-nocheck
// Module: interaction/ui-events-player-ready-panel -- Wave 4 Ship 5 sibling button router
// for the non-admin Player Ready Up Panel.
//
// Distinct from ui-events-ready.ts so the panel's 4 buttons (SWAP, READY, COACH-disabled,
// CLOSE) don't share dispatcher state or debounce trackers with the full ready dialog
// (per Wave 4 plan v1.1 L15: "new sibling router file"). Reuses the same primary-click
// debounce primitive (tryConsumeUIButtonPrimaryClickEvent) but with its own per-pid
// tracker map so panel + dialog opens don't cross-cancel each other's debounce windows.
//
// Behavior contract per button:
//   CLOSE -- hides every panel widget for this pid + restores game cursor (UI input off).
//            Mirrors the dialog's cancel action.
//   READY -- delegates to handleReadyDialogReadyButtonClick (the same handler the full
//            dialog uses) so the world-log "X has readied up" notification, the HUD
//            "X / Y PLAYERS READY" line, the global ready-status refresh, and the auto-
//            start gate all fire identically. Then refreshPlayerReadyPanelContentForPid
//            updates the panel's status row in place so the viewer sees their new state.
//   CHANGE TEAMS -- delegates to swapPlayerTeam (force-NOT-READY, processReadyDialogSelection
//            redeploy path, dialog re-render). Refresh updates the panel's status-row team
//            substitution. Note: swap triggers an undeploy/redeploy cycle; the panel cache
//            survives but the player loses input mode during the transition.
//   SPECTATE / COACH -- disabled per Wave 4 plan v1.1 D3. mod.SetUIButtonEnabled(false) at
//            build time should suppress click events at the engine level, but we match the
//            widget defensively to claim the event so it cannot fall through to other
//            sibling routers.

const PLAYER_READY_PANEL_PRIMARY_CLICK_DEBOUNCE_SECONDS = 0.12;
const PLAYER_READY_PANEL_PRIMARY_CLICK_RELEASE_GRACE_SECONDS = 2.0;
const playerReadyPanelLastPrimaryClickByPid: UIButtonPrimaryClickTracker = {};

function tryConsumePlayerReadyPanelPrimaryClickEvent(
    playerId: number,
    widgetName: string,
    eventUIButtonEvent: mod.UIButtonEvent
): boolean {
    return tryConsumeUIButtonPrimaryClickEvent(
        playerReadyPanelLastPrimaryClickByPid,
        playerId,
        widgetName,
        eventUIButtonEvent,
        PLAYER_READY_PANEL_PRIMARY_CLICK_DEBOUNCE_SECONDS,
        PLAYER_READY_PANEL_PRIMARY_CLICK_RELEASE_GRACE_SECONDS
    );
}

// Match a single panel button widget by id and run its action with debounce.
// Returns undefined when the widget name doesn't match (caller falls through to next),
// true when matched (event consumed regardless of whether the action ran or was debounce-suppressed).
function tryHandlePlayerReadyPanelPrimaryAction(
    playerId: number,
    widgetName: string,
    eventUIButtonEvent: mod.UIButtonEvent,
    widgetBaseId: string,
    action: () => void
): boolean | undefined {
    if (widgetName !== widgetBaseId + playerId) return undefined;
    if (!tryConsumePlayerReadyPanelPrimaryClickEvent(playerId, widgetName, eventUIButtonEvent)) return true;
    action();
    return true;
}

// Hides the panel cache widgets for this pid and restores the game cursor.
// Mirrors the cancel action in the full ready dialog.
function closePlayerReadyPanelForViewer(eventPlayer: mod.Player, playerId: number): void {
    hidePlayerReadyPanelForPid(playerId);
    setUIInputModeForPlayer(eventPlayer, false);
}

// Top-level dispatcher invoked from interaction/ui-events.ts:teamSwitchButtonEvent. Tries
// each panel widget in turn; first match claims the event.
function tryHandlePlayerReadyPanelButtonEvent(
    eventPlayer: mod.Player,
    playerId: number,
    widgetName: string,
    eventUIButtonEvent: mod.UIButtonEvent
): boolean {
    const closeHandled = tryHandlePlayerReadyPanelPrimaryAction(
        playerId, widgetName, eventUIButtonEvent,
        UI_PLAYER_READY_PANEL_BUTTON_CLOSE_ID,
        () => closePlayerReadyPanelForViewer(eventPlayer, playerId)
    );
    if (closeHandled !== undefined) return closeHandled;

    const readyHandled = tryHandlePlayerReadyPanelPrimaryAction(
        playerId, widgetName, eventUIButtonEvent,
        UI_PLAYER_READY_PANEL_BUTTON_READY_ID,
        () => {
            // Mirror the CHANGE TEAMS pattern (close before delegating): once the
            // viewer commits ready/not-ready, dismiss the panel + restore cursor so
            // they're back in soldier control immediately. handleReadyDialogReadyButtonClick
            // updates State.players.readyByPid + fires the world-log / HUD refresh /
            // auto-start gate identically to the full dialog path -- no panel refresh
            // needed afterward since the panel is already hidden.
            closePlayerReadyPanelForViewer(eventPlayer, playerId);
            handleReadyDialogReadyButtonClick(eventPlayer, playerId);
        }
    );
    if (readyHandled !== undefined) return readyHandled;

    const swapHandled = tryHandlePlayerReadyPanelPrimaryAction(
        playerId, widgetName, eventUIButtonEvent,
        UI_PLAYER_READY_PANEL_BUTTON_SWAP_ID,
        () => {
            // Mirror processReadyDialogSelection's auto-hide-on-swap (actions.ts:257):
            // swap triggers an undeploy/redeploy, so the panel must close to avoid
            // leaving the viewer staring at a stale, uninteractable widget tree.
            // swapPlayerTeam itself also restores cursor via processReadyDialogSelection's
            // hideReadyDialogUI call; close-then-swap keeps the order parallel to the dialog.
            closePlayerReadyPanelForViewer(eventPlayer, playerId);
            swapPlayerTeam(eventPlayer);
        }
    );
    if (swapHandled !== undefined) return swapHandled;

    // Spectator claim (Ship 2). Wired when the active map authored a spectatorCameraId in
    // MapConfig and the slot is vacant + match is pre-live (gating in syncCoachButtonForPanelPid
    // suppresses the engine-level click for the disabled cases; enterSpectatorMode also
    // defensively re-checks all three gates so a slipped click cannot promote a player
    // mid-match or to a taken slot). Click is consumed regardless so it does not fall
    // through to other sibling routers.
    const coachHandled = tryHandlePlayerReadyPanelPrimaryAction(
        playerId, widgetName, eventUIButtonEvent,
        UI_PLAYER_READY_PANEL_BUTTON_COACH_ID,
        () => {
            closePlayerReadyPanelForViewer(eventPlayer, playerId);
            enterSpectatorMode(eventPlayer, playerId);
        }
    );
    if (coachHandled !== undefined) return coachHandled;

    // Wave 4 Ship 6 / v1.2: CLAIM ADMIN. Only succeeds against a vacant slot
    // (per L17). On success: close panel, restore cursor, broadcast refresh so other
    // panels' Game Admin row updates and CLAIM ADMIN button hides everywhere. The
    // claimer's next triple-tap routes to the dialog (Ship 3 gate now sees isAdmin).
    // On failure (race -- another non-admin claimed first): silent no-op; the
    // claimer's panel is still showing CLAIM ADMIN button and the next refresh
    // broadcast (triggered by the winning claim) will hide it for them.
    //
    // v1.434: defensive isMatchLive() guard. The button is greyed +
    // SetUIButtonEnabled(false) when live (suppressing engine-side clicks), but a
    // raw click event slipping through must not perform an admin handoff since
    // config is locked once the match goes live.
    const claimAdminHandled = tryHandlePlayerReadyPanelPrimaryAction(
        playerId, widgetName, eventUIButtonEvent,
        UI_PLAYER_READY_PANEL_BUTTON_CLAIM_ADMIN_ID,
        () => {
            if (isMatchLive()) return;
            if (!Admin.claimAdmin(playerId)) return;
            // Hide panel widgets but keep cursor up — the admin dialog will replace it.
            hidePlayerReadyPanelForPid(playerId);
            refreshAllVisiblePlayerReadyPanels();
            // Player is now admin; canonical entry routes them straight into the full
            // ready dialog. Reusing tryOpenReadyDialogForPlayer keeps the open path
            // (lazy-build + showReadyDialogUI + error recovery) in one place.
            tryOpenReadyDialogForPlayer(eventPlayer);
        }
    );
    if (claimAdminHandled !== undefined) return claimAdminHandled;

    return false;
}
