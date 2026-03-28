// @ts-nocheck
// Module: ready-dialog/join-prompt-ids -- join prompt widget naming and cleanup helpers

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

//#endregion ----------------- Join Prompt - IDs + Gating --------------------
