// @ts-nocheck
// Module: admin/identity -- Wave 4 single-admin model + host slot (v1.2 redesign)
//
// Owns the single-slot admin field, the immutable host slot (first-ever-joiner),
// and the cached host-name Message token. All state is module-private; access via
// the Admin.* exported namespace.
//
// Wave 4 plan v1.2 locked decisions:
//   L8 / L18 / D1 - host fixed at first-ever-join, never reassigned; cached Message
//                   token survives host disconnect (R5 caveat applies).
//   L17           - single-slot admin model (replaces v1.1 ordered join-list).
//                   `_currentAdminPid` is undefined (vacant) or one pid; no list,
//                   no auto-promotion.
//   D4            - on every transition that changes `_currentAdminPid` (claim,
//                   give-up, leave-while-admin), broadcast a refresh to every
//                   visible Player Ready Up Panel so Game Admin row + CLAIM ADMIN
//                   button visibility update live.
//
// State transitions:
//   - First-ever join (server cold-start exception): sets the host slot AND assigns
//     the admin slot to the joiner. This auto-admin fires exactly once per server
//     lifetime, gated on `_hostFirstPid === undefined` -- once host is set the
//     auto-admin path can never fire again (host slot is immutable per L18).
//   - Subsequent joins: no-op. Players landing on a vacant admin slot do NOT inherit
//     it -- they see the panel with CLAIM ADMIN visible and must explicitly press it
//     (per v1.436 / Q2 user clarification: "first connection is an exception").
//   - Vacate via [GIVE UP ADMIN] (admin clicks button on existing ready dialog): clears
//     _currentAdminPid via giveUpAdmin(pid). Caller hides the dialog + broadcasts.
//   - Vacate on disconnect (Q1): onPlayerLeave clears _currentAdminPid if the leaver
//     was admin; broadcasts immediately so other viewers see vacancy. NO auto-promotion
//     of next-in-server -- the slot stays vacant until someone presses CLAIM ADMIN.
//   - Claim via [CLAIM ADMIN] (non-admin clicks button on panel): claimAdmin(pid)
//     succeeds only if isAdminVacant(); caller hides the panel + broadcasts.
//
// Single auto-admin event per server lifetime (first-ever join). All subsequent
// admin-slot writes go through claimAdmin(pid). No reclaim / cooldown; re-claim
// allowed immediately after give-up.

namespace Admin {
    let _currentAdminPid: number | undefined = undefined;
    let _hostFirstPid: number | undefined = undefined;
    let _hostNameMessage: mod.Message | undefined = undefined;

    // Called from onPlayerJoinGameImpl. First-ever join sets host slot + auto-claims
    // the admin slot for the joiner (one-time, server-lifetime exception). Once
    // _hostFirstPid is set the auto-admin branch is permanently inert: subsequent
    // joins -- even into a vacant admin slot -- never auto-promote the joiner.
    export function onPlayerJoin(player: mod.Player, pid: number): void {
        if (_hostFirstPid === undefined && isValidPlayer(player)) {
            _hostFirstPid = pid;
            try { _hostNameMessage = mod.Message(player); } catch {}
            _currentAdminPid = pid;
        }
    }

    // Called from onPlayerLeaveGameImpl. Vacates admin slot (and broadcasts) if the
    // leaver was admin. Host fields stay untouched -- host slot is forever cosmetic
    // and survives disconnect via the cached _hostNameMessage (R5).
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

    export function isHost(pid: number): boolean {
        return _hostFirstPid !== undefined && _hostFirstPid === pid;
    }

    export function getHostFirstPid(): number | undefined {
        return _hostFirstPid;
    }

    export function getHostNameMessage(): mod.Message | undefined {
        return _hostNameMessage;
    }

    // Atomic claim: succeeds only against a vacant slot (per L17). Returns true on
    // success; false if the slot is already occupied (race-condition guard for two
    // non-admins clicking CLAIM ADMIN within the same frame -- first wins).
    // Caller is responsible for the post-claim UX (close panel, broadcast).
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
