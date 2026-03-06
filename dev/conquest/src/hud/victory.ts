// @ts-nocheck
// Module: hud/victory -- victory dialog content + winner presentation

//#region -------------------- HUD Victory Dialog Updates --------------------

function getElapsedHmsParts(totalSeconds: number): { hours: number; minutes: number; seconds: number } {
    const sec = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const seconds = sec % 60;
    return { hours, minutes, seconds };
}

function updateVictoryDialogRosterSizing(refs: HudRefs, rosterRows: number): void {
    const clampedRows = Math.max(1, Math.min(TEAM_ROSTER_MAX_ROWS, Math.floor(rosterRows)));
    const rosterHeight = VICTORY_DIALOG_ROSTER_ROW_PADDING_TOP + (clampedRows * VICTORY_DIALOG_ROSTER_ROW_HEIGHT) + VICTORY_DIALOG_ROSTER_ROW_PADDING_BOTTOM;
    const dialogHeight = VICTORY_DIALOG_ROSTER_ROW_Y + rosterHeight + VICTORY_DIALOG_BOTTOM_PADDING;

    if (refs.victoryRoot) {
        mod.SetUIWidgetSize(refs.victoryRoot, mod.CreateVector(VICTORY_DIALOG_WIDTH, dialogHeight, 0));
    }
    if (refs.victoryRosterRow) {
        mod.SetUIWidgetSize(refs.victoryRosterRow, mod.CreateVector(VICTORY_DIALOG_ROSTER_ROW_WIDTH, rosterHeight, 0));
    }
    if (refs.victoryRosterLeftContainer) {
        mod.SetUIWidgetSize(refs.victoryRosterLeftContainer, mod.CreateVector(VICTORY_DIALOG_ROSTER_CONTAINER_WIDTH, rosterHeight, 0));
    }
    if (refs.victoryRosterRightContainer) {
        mod.SetUIWidgetSize(refs.victoryRosterRightContainer, mod.CreateVector(VICTORY_DIALOG_ROSTER_CONTAINER_WIDTH, rosterHeight, 0));
    }
}

/**
 * Updates per-player Victory dialog widgets to reflect current match-end state.
 * Notes:
 * - This only updates UI text/visibility; it does not decide winners.
 * - Caller must ensure the dialog is built before updating.
 * - Remaining seconds can wrap at 0 (engine quirk); we clamp to 0 to avoid huge values.
 */
function updateVictoryDialogForPlayer(player: mod.Player, remainingSeconds: number): void {
    // Per-player update for the match-end victory modal.
    // This is called once per second while the victory dialog is active.
    // Determine the target player id; dialog widgets are keyed per-player.
    if (!player || !mod.IsPlayerValid(player)) return;
    const pid = safeGetPlayerId(player);
    if (pid === undefined || isPidDisconnected(pid)) return;
    // Look up cached UI references for this player (if missing, this update becomes a no-op).
    const refs = State.hudCache.hudByPid[pid];
    if (!refs) return;

    if (refs.victoryRoot) {
        // Apply visibility rules for the dialog parts based on match-end state.
        setWidgetVisible(refs.victoryRoot, State.match.victoryDialogActive);
    }

    if (!State.match.victoryDialogActive) {
        return;
    }
    if (refs.victoryRestartText) {
        // Update string-key labels (Strings.json) so the dialog reflects the latest outcome/countdown.
        // Remaining seconds can wrap/roll over on some engine timers at the moment it hits 0.
        // Treat any out-of-range value as 0 to avoid displaying a huge number at the end.
        let displaySeconds = Math.floor(remainingSeconds);
        if (displaySeconds < 0) displaySeconds = 0;
        if (displaySeconds > MATCH_END_DELAY_SECONDS) displaySeconds = 0;
        safeSetUITextLabel(refs.victoryRestartText, mod.Message(mod.stringkeys.twl.victory.restartInFormat, displaySeconds));
    }
    const parts = getElapsedHmsParts(State.match.endElapsedSecondsSnapshot);
    const hours = Math.min(99, Math.max(0, Math.floor(parts.hours)));
    const minutes = Math.min(59, Math.max(0, Math.floor(parts.minutes)));
    const seconds = Math.min(59, Math.max(0, Math.floor(parts.seconds)));

    const hT = Math.floor(hours / 10);
    const hO = hours % 10;
    const mT = Math.floor(minutes / 10);
    const mO = minutes % 10;
    const sT = Math.floor(seconds / 10);
    const sO = seconds % 10;

    if (refs.victoryTimeHoursTens) safeSetUITextLabel(refs.victoryTimeHoursTens, mod.Message(mod.stringkeys.twl.hud.clock.digit, hT));
    if (refs.victoryTimeHoursOnes) safeSetUITextLabel(refs.victoryTimeHoursOnes, mod.Message(mod.stringkeys.twl.hud.clock.digit, hO));
    if (refs.victoryTimeMinutesTens) safeSetUITextLabel(refs.victoryTimeMinutesTens, mod.Message(mod.stringkeys.twl.hud.clock.digit, mT));
    if (refs.victoryTimeMinutesOnes) safeSetUITextLabel(refs.victoryTimeMinutesOnes, mod.Message(mod.stringkeys.twl.hud.clock.digit, mO));
    if (refs.victoryTimeSecondsTens) safeSetUITextLabel(refs.victoryTimeSecondsTens, mod.Message(mod.stringkeys.twl.hud.clock.digit, sT));
    if (refs.victoryTimeSecondsOnes) safeSetUITextLabel(refs.victoryTimeSecondsOnes, mod.Message(mod.stringkeys.twl.hud.clock.digit, sO));

    if (refs.victoryAdminActionsText) {
        const actionCount = Math.max(0, Math.floor(State.admin.actionCount));
        setWidgetVisible(refs.victoryAdminActionsText, actionCount > 0);
        if (actionCount > 0) {
            safeSetUITextLabel(
                refs.victoryAdminActionsText,
                mod.Message(mod.stringkeys.twl.adminPanel.actionCountVictoryFormat, actionCount)
            );
            safeSetUITextColor(refs.victoryAdminActionsText, COLOR_WARNING_YELLOW);
        }
    }

    if (refs.victoryLeftRosterText || refs.victoryRightRosterText) {
        const roster = getRosterDisplayEntries();
        updateVictoryDialogRosterSizing(refs, roster.maxRows);
        for (let i = 0; i < TEAM_ROSTER_MAX_ROWS; i++) {
            const leftWidget = refs.victoryLeftRosterText?.[i];
            if (leftWidget) {
                const leftEntry = roster.team1[i];
                setWidgetVisible(leftWidget, !!leftEntry);
                if (leftEntry) {
                    safeSetUITextLabel(leftWidget, getRosterEntryNameMessage(leftEntry));
                }
            }

            const rightWidget = refs.victoryRightRosterText?.[i];
            if (rightWidget) {
                const rightEntry = roster.team2[i];
                setWidgetVisible(rightWidget, !!rightEntry);
                if (rightEntry) {
                    safeSetUITextLabel(rightWidget, getRosterEntryNameMessage(rightEntry));
                }
            }
        }
    }
}

function updateVictoryDialogForAllPlayers(remainingSeconds: number): void {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(players, i) as mod.Player;
        if (!p || !mod.IsPlayerValid(p)) continue;
        const pid = safeGetPlayerId(p);
        if (pid === undefined || isPidDisconnected(pid)) continue;
        updateVictoryDialogForPlayer(p, remainingSeconds);
    }
}

//#endregion ----------------- HUD Victory Dialog Updates --------------------
