// @ts-nocheck
// Module: admin/identity -- single-slot admin model. Claim-only; no auto-promotion.
//
// State transitions:
//   - Server cold-start: admin slot is vacant. Every player sees CLAIM ADMIN.
//   - Claim via [CLAIM ADMIN] (any non-admin): claimAdmin(pid) succeeds only if
//     isAdminVacant() (race-guard for two simultaneous clicks -- first wins).
//   - Vacate via [GIVE UP ADMIN] (admin clicks button on existing ready dialog):
//     giveUpAdmin(pid) clears _currentAdminPid. Caller hides the dialog + broadcasts.
//   - Vacate on disconnect: onPlayerLeave clears _currentAdminPid if the leaver was
//     admin; broadcasts so other viewers see vacancy. NO auto-promotion of next-in-
//     server -- the slot stays vacant until someone presses CLAIM ADMIN.
//
// v1.458 (2026-05-04): host concept and auto-promote-first-joiner branch deleted.
// "Host" was never script-authoritative (the engine reports the closest-to-server
// player as first-loaded, not the actual server host), so the displayed name was
// often wrong. The auto-admin path that piggy-backed on host detection went with it.

namespace Admin {
    let _currentAdminPid: number | undefined = undefined;

    // Called from onPlayerLeaveGameImpl. Vacates admin slot (and broadcasts) if the
    // leaver was admin.
    export function onPlayerLeave(pid: number): void {
        if (_currentAdminPid === pid) {
            _currentAdminPid = undefined;
            refreshAllVisiblePlayerReadyPanels();
        }
    }

    export function isAdmin(pid: number): boolean {
        return _currentAdminPid !== undefined && _currentAdminPid === pid;
    }

    export function getCurrentAdminPid(): number | undefined {
        return _currentAdminPid;
    }

    export function isAdminVacant(): boolean {
        return _currentAdminPid === undefined;
    }

    // Atomic claim: succeeds only against a vacant slot. Returns true on success;
    // false if the slot is already occupied (race-condition guard for two non-admins
    // clicking CLAIM ADMIN within the same frame -- first wins). Caller is responsible
    // for the post-claim UX (close panel, broadcast).
    export function claimAdmin(pid: number): boolean {
        if (_currentAdminPid !== undefined) return false;
        _currentAdminPid = pid;
        return true;
    }

    // Atomic give-up: succeeds only if the caller is the current admin. Returns true
    // on success; false if the caller is not admin (defensive -- the GIVE UP ADMIN
    // button only renders inside the admin's dialog, but the click handler is robust
    // to stale state). Caller is responsible for the post-give-up UX (hide dialog,
    // broadcast).
    export function giveUpAdmin(pid: number): boolean {
        if (_currentAdminPid !== pid) return false;
        _currentAdminPid = undefined;
        return true;
    }
}
