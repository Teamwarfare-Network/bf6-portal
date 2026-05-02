// @ts-nocheck
// Module: ready-dialog/player-ready-panel -- Wave 4 Ship 2 small panel for non-admins
//
// Built lazily on first triple-tap by non-admin players (Ship 3 wires the routing).
// Distinct widget tree from the existing ready dialog; ~17 widget refs per pid
// vs ~100 for the full dialog. Wave 4 plan v1.1 L10 (new module from scratch),
// L13 ([Claim] always visible -- Ship 6 adds the Claim button widget),
// L14 + D3 (Spectate/Coach disabled with verbatim treatment from existing dialog).
//
// Layout: 640w x 280h centered container with 4 borders. Text rows top-down:
// title (large, centered), Game Host, Game Admin, ready-status. Bottom button
// row (4 buttons): SWAP, READY, COACH (disabled), CLOSE.

const PLAYER_READY_PANEL_WIDTH = 640;
const PLAYER_READY_PANEL_HEIGHT = 280;
const PLAYER_READY_PANEL_BORDER_THICKNESS = 2;
const PLAYER_READY_PANEL_BORDER_PADDING = 1;
const PLAYER_READY_PANEL_BORDER_OVERLAP = 2;

const PLAYER_READY_PANEL_TITLE_Y = -110;
const PLAYER_READY_PANEL_HOST_Y = -60;
const PLAYER_READY_PANEL_ADMIN_Y = -28;
const PLAYER_READY_PANEL_STATUS_Y = 4;

const PLAYER_READY_PANEL_TITLE_SIZE = 22;
const PLAYER_READY_PANEL_TEXT_SIZE = 16;
const PLAYER_READY_PANEL_TEXT_WIDTH = PLAYER_READY_PANEL_WIDTH - 48;
const PLAYER_READY_PANEL_TEXT_HEIGHT = 24;

const PLAYER_READY_PANEL_BUTTON_WIDTH = 140;
const PLAYER_READY_PANEL_BUTTON_HEIGHT = 72;
const PLAYER_READY_PANEL_BUTTON_GAP = 12;
// BottomCenter anchor on this engine: widget's bottom edge aligns with parent's
// bottom edge; positive Y offsets the widget UP into the parent. Y=8 places the
// 72-tall button row 8px above panel bottom (button top at +60 from container
// center, status row bottom at +16 -> 44px gap, no overlap).
const PLAYER_READY_PANEL_BUTTON_ROW_Y = 8;

// CLAIM ADMIN button (Wave 4 Ship 6 / v1.2): top-right corner of the panel, NOT in
// line with the bottom button row (per Q6). Same 140x72 size as the bottom buttons.
// TopRight anchor + (8, 8) offset: 8px padding from the top + right corners.
const PLAYER_READY_PANEL_CLAIM_ADMIN_OFFSET_X = 8;
const PLAYER_READY_PANEL_CLAIM_ADMIN_OFFSET_Y = 8;

// Returns every widget id owned by the panel, used by the show/hide/destroy helpers
// to iterate uniformly. Order doesn't matter; intent is exhaustive coverage so a
// future widget addition (e.g. Claim button in Ship 6) just appends here.
function getPlayerReadyPanelWidgetIds(pid: number): string[] {
    return [
        UI_PLAYER_READY_PANEL_CONTAINER_ID + pid,
        UI_PLAYER_READY_PANEL_BORDER_TOP_ID + pid,
        UI_PLAYER_READY_PANEL_BORDER_BOTTOM_ID + pid,
        UI_PLAYER_READY_PANEL_BORDER_LEFT_ID + pid,
        UI_PLAYER_READY_PANEL_BORDER_RIGHT_ID + pid,
        UI_PLAYER_READY_PANEL_TITLE_ID + pid,
        UI_PLAYER_READY_PANEL_HOST_LABEL_ID + pid,
        UI_PLAYER_READY_PANEL_ADMIN_LABEL_ID + pid,
        UI_PLAYER_READY_PANEL_READY_STATUS_ID + pid,
        UI_PLAYER_READY_PANEL_BUTTON_SWAP_ID + pid,
        UI_PLAYER_READY_PANEL_BUTTON_SWAP_ID + pid + "_BORDER",
        UI_PLAYER_READY_PANEL_BUTTON_SWAP_LABEL_ID + pid,
        UI_PLAYER_READY_PANEL_BUTTON_READY_ID + pid,
        UI_PLAYER_READY_PANEL_BUTTON_READY_ID + pid + "_BORDER",
        UI_PLAYER_READY_PANEL_BUTTON_READY_LABEL_ID + pid,
        UI_PLAYER_READY_PANEL_BUTTON_COACH_ID + pid,
        UI_PLAYER_READY_PANEL_BUTTON_COACH_ID + pid + "_BORDER",
        UI_PLAYER_READY_PANEL_BUTTON_COACH_LABEL_ID + pid,
        UI_PLAYER_READY_PANEL_BUTTON_CLOSE_ID + pid,
        UI_PLAYER_READY_PANEL_BUTTON_CLOSE_ID + pid + "_BORDER",
        UI_PLAYER_READY_PANEL_BUTTON_CLOSE_LABEL_ID + pid,
        UI_PLAYER_READY_PANEL_BUTTON_CLAIM_ADMIN_ID + pid,
        UI_PLAYER_READY_PANEL_BUTTON_CLAIM_ADMIN_ID + pid + "_BORDER",
        UI_PLAYER_READY_PANEL_BUTTON_CLAIM_ADMIN_LABEL_ID + pid,
    ];
}

// Builder invoked by triggerLazyBuild('playerReadyPanel', pid). Idempotent: short-
// circuits if container widget already exists. Built hidden; first show flips
// visibility to true via showPlayerReadyPanelForPid.
function prebuildPlayerReadyPanelHidden(eventPlayer: mod.Player, pid: number): void {
    if (!isValidPlayer(eventPlayer)) return;
    if (safeFind(UI_PLAYER_READY_PANEL_CONTAINER_ID + pid)) return;

    const containerId = UI_PLAYER_READY_PANEL_CONTAINER_ID + pid;
    mod.AddUIContainer(
        containerId,
        VEC_ZERO,
        mod.CreateVector(PLAYER_READY_PANEL_WIDTH, PLAYER_READY_PANEL_HEIGHT, 0),
        mod.UIAnchor.Center,
        mod.GetUIRoot(),
        false,
        10,
        VEC_ZERO,
        0.995,
        mod.UIBgFill.Blur,
        mod.UIDepth.AboveGameUI,
        eventPlayer
    );
    const containerBase = safeFind(containerId);
    if (!containerBase) return;
    mod.SetUIWidgetBgAlpha(containerBase, 0.995);

    // 4 thin borders (top/bottom/left/right) -- mirrors the existing ready-dialog chrome.
    const borderHalfWidth = (PLAYER_READY_PANEL_WIDTH / 2) + PLAYER_READY_PANEL_BORDER_PADDING + (PLAYER_READY_PANEL_BORDER_THICKNESS / 2);
    const borderHalfHeight = (PLAYER_READY_PANEL_HEIGHT / 2) + PLAYER_READY_PANEL_BORDER_PADDING + (PLAYER_READY_PANEL_BORDER_THICKNESS / 2);
    const borderLineWidth = PLAYER_READY_PANEL_WIDTH + (PLAYER_READY_PANEL_BORDER_PADDING * 2) + (PLAYER_READY_PANEL_BORDER_OVERLAP * 2);
    const borderLineHeight = PLAYER_READY_PANEL_HEIGHT + (PLAYER_READY_PANEL_BORDER_PADDING * 2) + (PLAYER_READY_PANEL_BORDER_OVERLAP * 2);

    mod.AddUIContainer(UI_PLAYER_READY_PANEL_BORDER_TOP_ID + pid,
        mod.CreateVector(0, -borderHalfHeight, 0),
        mod.CreateVector(borderLineWidth, PLAYER_READY_PANEL_BORDER_THICKNESS, 0),
        mod.UIAnchor.Center, containerBase, false, 0, READY_DIALOG_BORDER_COLOR, 1, mod.UIBgFill.Solid, mod.UIDepth.AboveGameUI, eventPlayer);
    mod.AddUIContainer(UI_PLAYER_READY_PANEL_BORDER_BOTTOM_ID + pid,
        mod.CreateVector(0, borderHalfHeight, 0),
        mod.CreateVector(borderLineWidth, PLAYER_READY_PANEL_BORDER_THICKNESS, 0),
        mod.UIAnchor.Center, containerBase, false, 0, READY_DIALOG_BORDER_COLOR, 1, mod.UIBgFill.Solid, mod.UIDepth.AboveGameUI, eventPlayer);
    mod.AddUIContainer(UI_PLAYER_READY_PANEL_BORDER_LEFT_ID + pid,
        mod.CreateVector(-borderHalfWidth, 0, 0),
        mod.CreateVector(PLAYER_READY_PANEL_BORDER_THICKNESS, borderLineHeight, 0),
        mod.UIAnchor.Center, containerBase, false, 0, READY_DIALOG_BORDER_COLOR, 1, mod.UIBgFill.Solid, mod.UIDepth.AboveGameUI, eventPlayer);
    mod.AddUIContainer(UI_PLAYER_READY_PANEL_BORDER_RIGHT_ID + pid,
        mod.CreateVector(borderHalfWidth, 0, 0),
        mod.CreateVector(PLAYER_READY_PANEL_BORDER_THICKNESS, borderLineHeight, 0),
        mod.UIAnchor.Center, containerBase, false, 0, READY_DIALOG_BORDER_COLOR, 1, mod.UIBgFill.Solid, mod.UIDepth.AboveGameUI, eventPlayer);

    // Title + content rows. All four are widget-anchored Center on containerBase with
    // posX=0 (horizontal centerline) and textAnchor=Center. The explicit post-build
    // SetUITextAnchor mirrors the proven roster pattern (dialog-build-roster.ts:106) --
    // SetUITextSize inside addReadyDialogText resets the text anchor as a side effect,
    // so we must re-apply it after the function returns.
    //
    // Ship 4 will replace `mod.stringkeys.twl.system.unknownPlayer` (rendered as the
    // literal "Unknown") with real player-name format args. Format args MUST be passed
    // as bare stringkey numbers, not msg()-wrapped Messages -- nested Message args
    // return undefined and trigger the ui-helpers normalizer fallback to readyText.
    const titleWidget = addReadyDialogText(
        UI_PLAYER_READY_PANEL_TITLE_ID + pid,
        0, PLAYER_READY_PANEL_TITLE_Y,
        PLAYER_READY_PANEL_WIDTH - 40, PLAYER_READY_PANEL_TEXT_HEIGHT + 8,
        mod.UIAnchor.Center, mod.UIAnchor.Center,
        msg(mod.stringkeys.twl.playerReadyPanel.title),
        eventPlayer, containerBase, PLAYER_READY_PANEL_TITLE_SIZE, false, COLOR_WHITE
    );
    if (titleWidget) mod.SetUITextAnchor(titleWidget, mod.UIAnchor.Center);

    const hostWidget = addReadyDialogText(
        UI_PLAYER_READY_PANEL_HOST_LABEL_ID + pid,
        0, PLAYER_READY_PANEL_HOST_Y,
        PLAYER_READY_PANEL_TEXT_WIDTH, PLAYER_READY_PANEL_TEXT_HEIGHT,
        mod.UIAnchor.Center, mod.UIAnchor.Center,
        msg(mod.stringkeys.twl.playerReadyPanel.gameHostFormat, mod.stringkeys.twl.system.unknownPlayer),
        eventPlayer, containerBase, PLAYER_READY_PANEL_TEXT_SIZE, false, COLOR_WHITE
    );
    if (hostWidget) mod.SetUITextAnchor(hostWidget, mod.UIAnchor.Center);

    const adminWidget = addReadyDialogText(
        UI_PLAYER_READY_PANEL_ADMIN_LABEL_ID + pid,
        0, PLAYER_READY_PANEL_ADMIN_Y,
        PLAYER_READY_PANEL_TEXT_WIDTH, PLAYER_READY_PANEL_TEXT_HEIGHT,
        mod.UIAnchor.Center, mod.UIAnchor.Center,
        msg(mod.stringkeys.twl.playerReadyPanel.gameAdminFormat, mod.stringkeys.twl.system.unknownPlayer),
        eventPlayer, containerBase, PLAYER_READY_PANEL_TEXT_SIZE, false, COLOR_WHITE
    );
    if (adminWidget) mod.SetUITextAnchor(adminWidget, mod.UIAnchor.Center);

    const statusWidget = addReadyDialogText(
        UI_PLAYER_READY_PANEL_READY_STATUS_ID + pid,
        0, PLAYER_READY_PANEL_STATUS_Y,
        PLAYER_READY_PANEL_TEXT_WIDTH, PLAYER_READY_PANEL_TEXT_HEIGHT,
        mod.UIAnchor.Center, mod.UIAnchor.Center,
        msg(mod.stringkeys.twl.playerReadyPanel.readyStatusNoFormat, mod.stringkeys.twl.system.unknownPlayer),
        eventPlayer, containerBase, PLAYER_READY_PANEL_TEXT_SIZE, false, COLOR_WHITE
    );
    if (statusWidget) mod.SetUITextAnchor(statusWidget, mod.UIAnchor.Center);

    // Bottom button row: SWAP, READY, COACH (disabled per D3), CLOSE. Spaced evenly,
    // anchored bottom-center. Click handlers are NOT wired in Ship 2 -- Ship 5 adds
    // the new sibling router (per L15) that matches these widget IDs.
    const totalButtonRowWidth = (PLAYER_READY_PANEL_BUTTON_WIDTH * 4) + (PLAYER_READY_PANEL_BUTTON_GAP * 3);
    const firstButtonOffsetX = -(totalButtonRowWidth / 2) + (PLAYER_READY_PANEL_BUTTON_WIDTH / 2);

    const swapBorder = addOutlinedButton(
        UI_PLAYER_READY_PANEL_BUTTON_SWAP_ID + pid,
        firstButtonOffsetX,
        PLAYER_READY_PANEL_BUTTON_ROW_Y,
        PLAYER_READY_PANEL_BUTTON_WIDTH, PLAYER_READY_PANEL_BUTTON_HEIGHT,
        mod.UIAnchor.BottomCenter, containerBase, eventPlayer
    );
    addReadyDialogCenteredText(
        UI_PLAYER_READY_PANEL_BUTTON_SWAP_LABEL_ID + pid,
        PLAYER_READY_PANEL_BUTTON_WIDTH, PLAYER_READY_PANEL_BUTTON_HEIGHT,
        msg(mod.stringkeys.twl.readyDialog.buttons.swapTeams),
        eventPlayer, swapBorder ?? containerBase, undefined, false
    );

    const readyBorder = addOutlinedButton(
        UI_PLAYER_READY_PANEL_BUTTON_READY_ID + pid,
        firstButtonOffsetX + (PLAYER_READY_PANEL_BUTTON_WIDTH + PLAYER_READY_PANEL_BUTTON_GAP),
        PLAYER_READY_PANEL_BUTTON_ROW_Y,
        PLAYER_READY_PANEL_BUTTON_WIDTH, PLAYER_READY_PANEL_BUTTON_HEIGHT,
        mod.UIAnchor.BottomCenter, containerBase, eventPlayer
    );
    addReadyDialogCenteredText(
        UI_PLAYER_READY_PANEL_BUTTON_READY_LABEL_ID + pid,
        PLAYER_READY_PANEL_BUTTON_WIDTH, PLAYER_READY_PANEL_BUTTON_HEIGHT,
        msg(mod.stringkeys.twl.readyDialog.buttons.ready),
        eventPlayer, readyBorder ?? containerBase, undefined, false
    );

    const coachBorder = addOutlinedButton(
        UI_PLAYER_READY_PANEL_BUTTON_COACH_ID + pid,
        firstButtonOffsetX + (PLAYER_READY_PANEL_BUTTON_WIDTH + PLAYER_READY_PANEL_BUTTON_GAP) * 2,
        PLAYER_READY_PANEL_BUTTON_ROW_Y,
        PLAYER_READY_PANEL_BUTTON_WIDTH, PLAYER_READY_PANEL_BUTTON_HEIGHT,
        mod.UIAnchor.BottomCenter, containerBase, eventPlayer
    );
    const coachLabel = addReadyDialogCenteredText(
        UI_PLAYER_READY_PANEL_BUTTON_COACH_LABEL_ID + pid,
        PLAYER_READY_PANEL_BUTTON_WIDTH, PLAYER_READY_PANEL_BUTTON_HEIGHT,
        msg(mod.stringkeys.twl.readyDialog.buttons.spectateCoach),
        eventPlayer, coachBorder ?? containerBase, undefined, false
    );
    // Spectate/Coach disabled treatment per D3 -- verbatim from dialog-build-sections.ts:228-238.
    const coachButton = safeFind(UI_PLAYER_READY_PANEL_BUTTON_COACH_ID + pid);
    if (coachButton) {
        mod.SetUIButtonEnabled(coachButton, false);
        mod.SetUIWidgetBgColor(coachButton, COLOR_GRAY_DARK);
        mod.SetUIWidgetBgAlpha(coachButton, 0.45);
    }
    if (coachBorder) {
        mod.SetUIWidgetBgColor(coachBorder, COLOR_GRAY_DARK);
        mod.SetUIWidgetBgAlpha(coachBorder, 0.45);
    }
    if (coachLabel) {
        mod.SetUITextColor(coachLabel, COLOR_GRAY);
    }

    const closeBorder = addOutlinedButton(
        UI_PLAYER_READY_PANEL_BUTTON_CLOSE_ID + pid,
        firstButtonOffsetX + (PLAYER_READY_PANEL_BUTTON_WIDTH + PLAYER_READY_PANEL_BUTTON_GAP) * 3,
        PLAYER_READY_PANEL_BUTTON_ROW_Y,
        PLAYER_READY_PANEL_BUTTON_WIDTH, PLAYER_READY_PANEL_BUTTON_HEIGHT,
        mod.UIAnchor.BottomCenter, containerBase, eventPlayer
    );
    addReadyDialogCenteredText(
        UI_PLAYER_READY_PANEL_BUTTON_CLOSE_LABEL_ID + pid,
        PLAYER_READY_PANEL_BUTTON_WIDTH, PLAYER_READY_PANEL_BUTTON_HEIGHT,
        msg(mod.stringkeys.twl.teamSwitch.buttons.cancel),
        eventPlayer, closeBorder ?? containerBase, undefined, false
    );

    // CLAIM ADMIN button (Wave 4 Ship 6 / v1.2). TopRight-anchored on the container,
    // 8px padded from top + right corners. Same 140x72 size as the bottom-row buttons
    // (per Q6) but visually separate. Built hidden; refreshPlayerReadyPanelContentForPid
    // reveals it only when Admin.isAdminVacant() === true.
    const claimAdminBorder = addOutlinedButton(
        UI_PLAYER_READY_PANEL_BUTTON_CLAIM_ADMIN_ID + pid,
        PLAYER_READY_PANEL_CLAIM_ADMIN_OFFSET_X,
        PLAYER_READY_PANEL_CLAIM_ADMIN_OFFSET_Y,
        PLAYER_READY_PANEL_BUTTON_WIDTH, PLAYER_READY_PANEL_BUTTON_HEIGHT,
        mod.UIAnchor.TopRight, containerBase, eventPlayer
    );
    addReadyDialogCenteredText(
        UI_PLAYER_READY_PANEL_BUTTON_CLAIM_ADMIN_LABEL_ID + pid,
        PLAYER_READY_PANEL_BUTTON_WIDTH, PLAYER_READY_PANEL_BUTTON_HEIGHT,
        msg(mod.stringkeys.twl.playerReadyPanel.claimAdminButton),
        eventPlayer, claimAdminBorder ?? containerBase, undefined, false
    );
}

// Wave 4 Ship 4: refresh the 3 dynamic content rows (Game Host, Game Admin,
// ready status) before the panel becomes visible. Reads live state each call
// so a stale cache cannot show out-of-date names or ready-state.
//
// Format-arg discipline: a connected pid resolves to a live `mod.Player` which
// the engine substitutes as the player's name. A disconnected/unknown pid falls
// back to `mod.stringkeys.twl.system.unknownPlayer` (the bare stringkey number,
// rendered literally as "Unknown"). Format args MUST be Player|number|string;
// nested Message objects return undefined and trip the ui-helpers normalizer.
//
// SetUITextAnchor is re-applied after each safeSetUITextLabel call to mirror
// the proven roster pattern -- engine label updates can reset the text anchor.
function refreshPlayerReadyPanelContentForPid(pid: number): void {
    const viewerPlayer = safeFindPlayer(pid);
    if (!viewerPlayer) return;

    const hostLabel = safeFind(UI_PLAYER_READY_PANEL_HOST_LABEL_ID + pid);
    if (hostLabel) {
        const hostPid = Admin.getHostFirstPid();
        const hostPlayer = hostPid !== undefined ? safeFindPlayer(hostPid) : undefined;
        const hostMsg = hostPlayer
            ? msg(mod.stringkeys.twl.playerReadyPanel.gameHostFormat, hostPlayer)
            : msg(mod.stringkeys.twl.playerReadyPanel.gameHostFormat, mod.stringkeys.twl.system.unknownPlayer);
        safeSetUITextLabel(hostLabel, hostMsg);
        try { mod.SetUITextAnchor(hostLabel, mod.UIAnchor.Center); } catch {}
    }

    const adminLabel = safeFind(UI_PLAYER_READY_PANEL_ADMIN_LABEL_ID + pid);
    if (adminLabel) {
        const adminPid = Admin.getCurrentAdminPid();
        const adminPlayer = adminPid !== undefined ? safeFindPlayer(adminPid) : undefined;
        // v1.436: vacant slot now renders "No Admin" (not "Unknown") via the
        // dedicated noAdminLabel stringkey. "Unknown" is a generic disconnect
        // fallback elsewhere; "No Admin" is the explicit semantic for an
        // intentionally vacant admin slot.
        const adminMsg = adminPlayer
            ? msg(mod.stringkeys.twl.playerReadyPanel.gameAdminFormat, adminPlayer)
            : msg(mod.stringkeys.twl.playerReadyPanel.gameAdminFormat, mod.stringkeys.twl.playerReadyPanel.noAdminLabel);
        safeSetUITextLabel(adminLabel, adminMsg);
        try { mod.SetUITextAnchor(adminLabel, mod.UIAnchor.Center); } catch {}
    }

    const statusLabel = safeFind(UI_PLAYER_READY_PANEL_READY_STATUS_ID + pid);
    if (statusLabel) {
        const isReady = !!State.players.readyByPid[pid];
        const teamNum = safeGetTeamNumberFromPlayer(viewerPlayer, 0);
        const teamKey = getTeamNameKey(teamNum);
        const formatKey = isReady
            ? mod.stringkeys.twl.playerReadyPanel.readyStatusYesFormat
            : mod.stringkeys.twl.playerReadyPanel.readyStatusNoFormat;
        safeSetUITextLabel(statusLabel, msg(formatKey, teamKey));
        try { mod.SetUITextAnchor(statusLabel, mod.UIAnchor.Center); } catch {}
    }

    syncPlayerReadyPanelReadyButtonForPid(pid);
    syncPlayerReadyPanelClaimAdminButtonForPid(pid);
}

// Wave 4 Ship 6 / v1.2: shows the CLAIM ADMIN button only when the admin slot is
// vacant (per L17 + D4). Hides it otherwise. Toggles all three claim-admin widgets
// (button, border, label) together so they appear/disappear as a unit.
//
// v1.434: when the match is live, leave the button visible (so the viewer
// understands the slot is vacant) but apply the live-disabled grey treatment
// matching the READY button -- mod.SetUIButtonEnabled(false) suppresses click
// events at the engine level, and the click handler also guards on isMatchLive()
// defensively. Admin handoff is meaningless during a live match (config is locked).
function syncPlayerReadyPanelClaimAdminButtonForPid(pid: number): void {
    const visible = Admin.isAdminVacant();
    const buttonWidget = safeFind(UI_PLAYER_READY_PANEL_BUTTON_CLAIM_ADMIN_ID + pid);
    const borderWidget = safeFind(UI_PLAYER_READY_PANEL_BUTTON_CLAIM_ADMIN_ID + pid + "_BORDER");
    const labelWidget = safeFind(UI_PLAYER_READY_PANEL_BUTTON_CLAIM_ADMIN_LABEL_ID + pid);

    safeSetUIWidgetVisible(buttonWidget, visible);
    safeSetUIWidgetVisible(borderWidget, visible);
    safeSetUIWidgetVisible(labelWidget, visible);
    if (!visible) return;

    const live = isMatchLive();
    if (buttonWidget) {
        mod.SetUIButtonEnabled(buttonWidget, !live);
        mod.SetUIWidgetBgColor(buttonWidget, live ? COLOR_GRAY_DARK : COLOR_BUTTON_BASE);
        mod.SetUIWidgetBgAlpha(buttonWidget, live ? 0.45 : BUTTON_OPACITY_BASE);
    }
    if (borderWidget) {
        mod.SetUIWidgetBgColor(borderWidget, live ? COLOR_GRAY_DARK : COLOR_BUTTON_BORDER);
        mod.SetUIWidgetBgAlpha(borderWidget, live ? 0.45 : BUTTON_BORDER_OPACITY);
    }
    if (labelWidget) {
        mod.SetUITextColor(labelWidget, live ? COLOR_GRAY : COLOR_WHITE);
    }
}

// Wave 4 Ship 6 / v1.2 (D4): broadcast refresh to every Player Ready Up Panel that
// has been built, after a transition that changes admin state (claim, give-up, or
// admin disconnect via Admin.onPlayerLeave). Re-renders the Game Admin row content
// + flips CLAIM ADMIN button visibility on every viewer's panel in lock-step.
//
// We refresh built-but-hidden caches too (cost: ~12 engine calls per pid). This
// keeps the cache labels in sync with current admin state so a future show flips
// straight to correct content -- no flash of stale data, and no need to track
// per-pid visibility state separately.
function refreshAllVisiblePlayerReadyPanels(): void {
    forEachValidPlayer((_player, pid) => {
        const container = safeFind(UI_PLAYER_READY_PANEL_CONTAINER_ID + pid);
        if (!container) return;
        refreshPlayerReadyPanelContentForPid(pid);
    });
}

// Mirrors syncReadyToggleButtonWidgetsForPid (roster-render.ts:210) for the panel's
// READY button: label flips between READY/NOT READY based on the viewer's ready state,
// and the button is greyed + disabled when the match is live (config-locked phase).
function syncPlayerReadyPanelReadyButtonForPid(pid: number): void {
    const buttonWidget = safeFind(UI_PLAYER_READY_PANEL_BUTTON_READY_ID + pid);
    const borderWidget = safeFind(UI_PLAYER_READY_PANEL_BUTTON_READY_ID + pid + "_BORDER");
    const labelWidget = safeFind(UI_PLAYER_READY_PANEL_BUTTON_READY_LABEL_ID + pid);
    if (!labelWidget) return;

    const isReady = !!State.players.readyByPid[pid];
    const live = isMatchLive();
    const labelMsg = isReady
        ? msg(mod.stringkeys.twl.readyDialog.buttons.notReady)
        : msg(mod.stringkeys.twl.readyDialog.buttons.ready);

    safeSetUITextLabel(labelWidget, labelMsg);

    if (buttonWidget) {
        mod.SetUIButtonEnabled(buttonWidget, !live);
        mod.SetUIWidgetBgColor(buttonWidget, live ? COLOR_GRAY_DARK : COLOR_BUTTON_BASE);
        mod.SetUIWidgetBgAlpha(buttonWidget, live ? 0.45 : BUTTON_OPACITY_BASE);
    }
    if (borderWidget) {
        mod.SetUIWidgetBgColor(borderWidget, live ? COLOR_GRAY_DARK : COLOR_BUTTON_BORDER);
        mod.SetUIWidgetBgAlpha(borderWidget, live ? 0.45 : BUTTON_BORDER_OPACITY);
    }
    mod.SetUITextColor(labelWidget, live ? COLOR_GRAY : COLOR_WHITE);
}

// Reveal: refresh dynamic content first, then flip visibility on every cached
// widget for the panel. Refresh-before-show guarantees no flash of stale data.
//
// v1.438 bugfix: skip the CLAIM ADMIN button widgets in the visibility loop --
// their visibility is owned by syncPlayerReadyPanelClaimAdminButtonForPid (called
// inside refresh above) and depends on Admin.isAdminVacant(). Pre-fix, the loop
// here was forcing all three claim-admin widgets visible=true after the sync had
// just set them invisible (admin exists -> button should be hidden), making the
// button incorrectly visible AND clickable when an admin was in place.
function showPlayerReadyPanelForPid(pid: number): void {
    refreshPlayerReadyPanelContentForPid(pid);
    const claimAdminButtonId = UI_PLAYER_READY_PANEL_BUTTON_CLAIM_ADMIN_ID + pid;
    const claimAdminBorderId = UI_PLAYER_READY_PANEL_BUTTON_CLAIM_ADMIN_ID + pid + "_BORDER";
    const claimAdminLabelId = UI_PLAYER_READY_PANEL_BUTTON_CLAIM_ADMIN_LABEL_ID + pid;
    for (const widgetId of getPlayerReadyPanelWidgetIds(pid)) {
        if (widgetId === claimAdminButtonId) continue;
        if (widgetId === claimAdminBorderId) continue;
        if (widgetId === claimAdminLabelId) continue;
        safeSetUIWidgetVisible(safeFind(widgetId), true);
    }
}

// Hide: flips visibility off on every cached widget. Cache survives until
// disconnect (per Wave 3 Ship 7 supply-box / ready-dialog pattern).
function hidePlayerReadyPanelForPid(pid: number): void {
    for (const widgetId of getPlayerReadyPanelWidgetIds(pid)) {
        safeSetUIWidgetVisible(safeFind(widgetId), false);
    }
}

// Hard cleanup: invoked from cleanupHudForPid on player leave.
function destroyPlayerReadyPanelForPid(pid: number): void {
    for (const widgetId of getPlayerReadyPanelWidgetIds(pid)) {
        const widget = safeFind(widgetId);
        if (widget) {
            try { mod.DeleteUIWidget(widget); } catch {}
        }
    }
}
