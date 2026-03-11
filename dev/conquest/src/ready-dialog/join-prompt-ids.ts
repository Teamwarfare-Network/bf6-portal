// @ts-nocheck
// Module: ready-dialog/join-prompt-ids -- join prompt ids, gating, and tip sequencing

//#region -------------------- Join Prompt - IDs + Gating --------------------

function joinPromptRootName(pid: number): string { return "join_prompt_root_" + pid; }
// Returns the panel widget id for the player's join prompt.
function joinPromptPanelName(pid: number): string { return "join_prompt_panel_" + pid; }
// Returns the title label widget id for the player's join prompt.
function joinPromptTitleName(pid: number): string { return "join_prompt_title_" + pid; }
// Returns the body label widget id for the player's join prompt.
function joinPromptBodyName(pid: number): string { return "join_prompt_body_" + pid; }
// Returns the dismiss button widget id for the player's join prompt.
function joinPromptButtonName(pid: number): string { return "join_prompt_dismiss_" + pid; }
// Returns the dismiss button border widget id for the player's join prompt.
function joinPromptButtonBorderName(pid: number): string { return joinPromptButtonName(pid) + "_BORDER"; }
// Returns the dismiss button text widget id for the player's join prompt.
function joinPromptButtonTextName(pid: number): string { return "join_prompt_dismiss_text_" + pid; }
// Returns the never-show button widget id for the player's join prompt.
function joinPromptNeverShowButtonName(pid: number): string { return "join_prompt_never_show_" + pid; }
// Returns the never-show button border widget id for the player's join prompt.
function joinPromptNeverShowButtonBorderName(pid: number): string { return joinPromptNeverShowButtonName(pid) + "_BORDER"; }
// Returns the never-show button text widget id for the player's join prompt.
function joinPromptNeverShowButtonTextName(pid: number): string { return "join_prompt_never_show_text_" + pid; }

const JOIN_PROMPT_SUPPRESSION_REASON_NONE = 0;
const JOIN_PROMPT_SUPPRESSION_REASON_POLICY_DISABLED = 1;
const JOIN_PROMPT_SUPPRESSION_REASON_NEVER_SHOW = 2;
const JOIN_PROMPT_SUPPRESSION_REASON_ALREADY_OPEN = 3;

// Deletes a join prompt widget safely when tearing down prompt UI elements.
function deleteJoinPromptWidget(name: string): void {
    const w = safeFind(name);
    if (!w) return;
    // Best-effort delete: widget may already be gone during undeploy/reconnect churn.
    try {
        mod.DeleteUIWidget(w);
    } catch {
        // Intentionally silent to avoid engine-side crashes on invalid handles.
    }
}

// Returns true when this player disabled join prompts for the active map.
function isJoinPromptSuppressedForPlayer(pid: number): boolean {
    return !!State.players.joinPromptNeverShowByPidMap[pid]?.[ACTIVE_MAP_KEY];
}

// Records join-prompt suppression policy telemetry so disabled behavior is explicit in state.
function setJoinPromptSuppressionStateForPid(pid: number, suppressionReason: number): void {
    State.players.joinPromptLastSuppressionReasonByPid[pid] = suppressionReason;
    if (suppressionReason === JOIN_PROMPT_SUPPRESSION_REASON_POLICY_DISABLED) {
        State.players.joinPromptPolicyDisabledByPid[pid] = true;
        State.players.joinPromptPolicySuppressedCountByPid[pid] = (State.players.joinPromptPolicySuppressedCountByPid[pid] ?? 0) + 1;
        State.players.joinPromptLastPolicySuppressedAtSecondsByPid[pid] = Math.floor(mod.GetMatchTimeElapsed());
        return;
    }
    State.players.joinPromptPolicyDisabledByPid[pid] = false;
}

// Persist "Never Show Again" per-map so other maps can still show the prompt
function setJoinPromptSuppressedForPlayer(pid: number): void {
    if (!State.players.joinPromptNeverShowByPidMap[pid]) {
        State.players.joinPromptNeverShowByPidMap[pid] = {};
    }
    State.players.joinPromptNeverShowByPidMap[pid][ACTIVE_MAP_KEY] = true;
    setJoinPromptSuppressionStateForPid(pid, JOIN_PROMPT_SUPPRESSION_REASON_NEVER_SHOW);
}

// Lightweight gating used for both join-time and undeploy prompts (join-time "only once" is tracked separately).
function shouldShowJoinPromptForPlayer(player: mod.Player): boolean {
    if (!player || !mod.IsPlayerValid(player)) return false;
    const pid = safeGetPlayerId(player);
    if (pid === undefined) return false;
    ensureJoinPromptStateForPid(pid);
    if (!SHOW_HELP_TEXT_PROMPT_ON_JOIN) {
        setJoinPromptSuppressionStateForPid(pid, JOIN_PROMPT_SUPPRESSION_REASON_POLICY_DISABLED);
        deleteJoinPromptWidget(joinPromptRootName(pid));
        return false;
    }
    if (isJoinPromptSuppressedForPlayer(pid)) {
        setJoinPromptSuppressionStateForPid(pid, JOIN_PROMPT_SUPPRESSION_REASON_NEVER_SHOW);
        return false;
    }
    if (safeFind(joinPromptRootName(pid))) {
        setJoinPromptSuppressionStateForPid(pid, JOIN_PROMPT_SUPPRESSION_REASON_ALREADY_OPEN);
        return false;
    }
    setJoinPromptSuppressionStateForPid(pid, JOIN_PROMPT_SUPPRESSION_REASON_NONE);
    return true;
}

// Join prompt sequencing helpers:
// These keep the prompt flow deterministic and low-risk by only adjusting
// in-memory per-player state and selecting string keys accordingly.
function ensureJoinPromptStateForPid(pid: number): void {
    if (State.players.joinPromptReadyDialogOpenedByPid[pid] === undefined) {
        State.players.joinPromptReadyDialogOpenedByPid[pid] = false;
    }
    if (State.players.joinPromptTipIndexByPid[pid] === undefined) {
        State.players.joinPromptTipIndexByPid[pid] = 0;
    }
    if (State.players.joinPromptTipsUnlockedByPid[pid] === undefined) {
        State.players.joinPromptTipsUnlockedByPid[pid] = false;
    }
}

// Marks that the player successfully opened the Ready Up dialog (true unlock event).
// Ensures the next prompt shows mandatory2 before tips begin.
function markJoinPromptReadyDialogOpened(pid: number): void {
    ensureJoinPromptStateForPid(pid);
    if (State.players.joinPromptReadyDialogOpenedByPid[pid]) return;
    State.players.joinPromptReadyDialogOpenedByPid[pid] = true;
    if ((State.players.joinPromptTipIndexByPid[pid] ?? 0) < 1) {
        State.players.joinPromptTipIndexByPid[pid] = 1;
    }
}

// Arms a one-shot flag when a player triggers the triple-tap detector.
// This lets us require the multi-click path before unlocking join prompt tips.
function armJoinPromptTripleTapForPid(pid: number): void {
    State.players.joinPromptTripleTapArmedByPid[pid] = true;
}

// Consumes and clears the one-shot triple-tap armed flag for this player.
function consumeJoinPromptTripleTapForPid(pid: number): boolean {
    if (!State.players.joinPromptTripleTapArmedByPid[pid]) return false;
    State.players.joinPromptTripleTapArmedByPid[pid] = false;
    return true;
}

// Returns true for body sequence keys that should be skipped in rotation.
function isJoinPromptBodyKeySkipped(key: number): boolean {
    return JOIN_PROMPT_BODY_SEQUENCE_SKIP_KEYS.indexOf(key) !== -1;
}

// Resolves the next usable body sequence index while skipping disabled keys.
function findNextJoinPromptSequenceIndex(startIndex: number): number {
    const max = JOIN_PROMPT_BODY_SEQUENCE_KEYS.length;
    if (max <= 0) return 0;
    for (let offset = 0; offset < max; offset++) {
        const idx = (startIndex + offset) % max;
        const key = JOIN_PROMPT_BODY_SEQUENCE_KEYS[idx];
        if (!isJoinPromptBodyKeySkipped(key)) return idx;
    }
    return 0;
}

// Returns the clamped sequence index for this player.
function getJoinPromptSequenceIndexForPid(pid: number): number {
    ensureJoinPromptStateForPid(pid);
    const raw = Math.floor(State.players.joinPromptTipIndexByPid[pid] ?? 0);
    const max = JOIN_PROMPT_BODY_SEQUENCE_KEYS.length;
    const clamped = (raw >= 0 && raw < max) ? raw : 0;
    const resolved = findNextJoinPromptSequenceIndex(clamped);
    State.players.joinPromptTipIndexByPid[pid] = resolved;
    return resolved;
}

// Selects the body key for the prompt based on unlock + sequence state.
function getJoinPromptBodyKeyForPid(pid: number): number {
    ensureJoinPromptStateForPid(pid);
    if (!State.players.joinPromptReadyDialogOpenedByPid[pid]) {
        return STR_JOIN_PROMPT_BODY_MANDATORY1;
    }
    const index = getJoinPromptSequenceIndexForPid(pid);
    if (index >= 2) {
        State.players.joinPromptTipsUnlockedByPid[pid] = true;
    }
    return JOIN_PROMPT_BODY_SEQUENCE_KEYS[index];
}

// Chooses the dismiss label based on whether tips are unlocked.
function getJoinPromptDismissLabelKeyForPid(pid: number): number {
    ensureJoinPromptStateForPid(pid);
    return State.players.joinPromptTipsUnlockedByPid[pid]
        ? STR_JOIN_PROMPT_DISMISS_SHOW_MORE_TIPS
        : STR_JOIN_PROMPT_DISMISS;
}

// Never Show Again is only available after tips are unlocked.
function shouldShowJoinPromptNeverShowButtonForPid(pid: number): boolean {
    ensureJoinPromptStateForPid(pid);
    return State.players.joinPromptReadyDialogOpenedByPid[pid] && State.players.joinPromptTipsUnlockedByPid[pid];
}

// Advances the sequence only after the player has unlocked tips.
function advanceJoinPromptSequenceOnDismiss(pid: number): void {
    ensureJoinPromptStateForPid(pid);
    if (!State.players.joinPromptReadyDialogOpenedByPid[pid]) {
        State.players.joinPromptTipIndexByPid[pid] = 0;
        return;
    }
    const current = getJoinPromptSequenceIndexForPid(pid);
    const next = findNextJoinPromptSequenceIndex(current + 1);
    State.players.joinPromptTipIndexByPid[pid] = next;
    if (next >= 2) {
        State.players.joinPromptTipsUnlockedByPid[pid] = true;
    }
}

//#endregion ----------------- Join Prompt - IDs + Gating --------------------
