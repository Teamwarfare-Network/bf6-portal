# Readiness Report 1.0 (v0.539) - Consolidated Top 25

Priority scheme:
- P0: Release blocking correctness or safety risk.
- P1: High impact maintainability or correctness risk.
- P2: Medium impact cleanup or consistency improvements.
- P3: Low impact polish.

## Top 25 Findings (Ranked)

1) [P0] Round/epoch guard for delayed side effects after async waits.
   - Any post-wait action that mutates state/UI should check a round or epoch token before applying.
   - Applies broadly to waits in round flow, spawners, overtime, and vehicle events.
   - Refs: `src/TWL_Tanks_Sandbox_Beta_Script.ts`

2) [P0] UI widget lifetime safety during transitions.
   - Centralize create/delete/visibility writes behind a single safe gate for round-end and cleanup windows.
   - Prevents engine crashes during overlays or undeploy windows.
   - Refs: `src/TWL_Tanks_Sandbox_Beta_Script.ts`

3) [P0] Objective/spatial mutation safety window.
   - Capture point enable/disable and spatial marker toggles must not execute during round-end overlays.
   - Use a safe gate and avoid hard resets in transition windows.
   - Refs: `src/TWL_Tanks_Sandbox_Beta_Script.ts`

4) [P0] Single-run guard for long-running loops (match tick and spawner poll).
   - Ensure `OnGameModeStarted` and the spawner poll cannot run in parallel if restarted.
   - Avoid duplicate infinite loops and double writes.
   - Refs: `src/TWL_Tanks_Sandbox_Beta_Script.ts`

5) [P0] Format-string mismatch for `twl.overLine.subtitle`.
   - The string is defined as a static sentence with no `{0}` placeholder, but the code calls
     `mod.Message(mod.stringkeys.twl.overLine.subtitle, <arg>)` in three places.
   - Current behavior may ignore extra args, but it is inconsistent with the string definition and
     can hide real formatting bugs (or trigger engine-side formatting errors in stricter builds).
   - Decide whether the subtitle should include a placeholder (and update the string) or remove
     the extra argument at call sites.
   - Refs: `src/TWL_Tanks_Sandbox_Beta_Script.ts:11802`, `src/TWL_Tanks_Sandbox_Beta_Script.ts:11882`, `src/TWL_Tanks_Sandbox_Beta_Script.ts:11921`

6) [P1] Vehicle ownership source of truth and invariants.
   - Multiple structures track vehicle ownership and status; document the authoritative store and update order.
   - Prevents drift between arrays/maps and scoring inaccuracies.
   - Refs: `src/TWL_Tanks_Sandbox_Beta_Script.ts`

7) [P1] Round flow state machine documentation and cleanup gating helper.
   - Define allowed transitions (ready, countdown, live, overtime, cleanup) and enforce via a helper.
   - Reduces regression risk when modifying round logic.
   - Refs: `src/TWL_Tanks_Sandbox_Beta_Script.ts`

8) [P1] UI API consistency for visibility and text updates.
   - Mixed direct calls and wrapper usage makes safety expectations unclear.
   - Standardize on wrappers or documented exceptions.
   - Direct-call hotspots still include vehicles-alive HUD, admin panel widgets, and join-prompt widgets.
   - Refs: `src/TWL_Tanks_Sandbox_Beta_Script.ts`

9) [P1] Player identity access and disconnect cleanup consistency.
   - Standardize ObjId/PID access and centralize per-player cleanup to avoid missed fields.
   - Refs: `src/TWL_Tanks_Sandbox_Beta_Script.ts`

10) [P1] Join-time HUD sync should be centralized and should not reset global clock state.
   - Build a single HUD sync path; avoid global cache resets when one player joins.
   - Refs: `src/TWL_Tanks_Sandbox_Beta_Script.ts`

11) [P1] Silent catch blocks should be narrowed or logged in debug mode.
   - Blanket catches hide root causes and create non-deterministic behavior.
   - Refs: `src/TWL_Tanks_Sandbox_Beta_Script.ts`

12) [P1] Overtime HUD update paths and reset functions need consolidation.
   - Multiple update entry points and overlapping reset logic increase drift risk.
   - Refs: `src/TWL_Tanks_Sandbox_Beta_Script.ts`

13) [P1] State object schema and lifecycle documentation.
   - Document ownership, reset points, and which subsystems may mutate each field.
   - Refs: `src/TWL_Tanks_Sandbox_Beta_Script.ts`

14) [P1] Split oversized functions to restore a human mental model.
   - High-risk functions include: ensureHudForPlayer, createTeamSwitchUI, safeFindPlayer,
     isVehicleEmptyForEntry, teamSwitchButtonEvent, ensureOvertimeHudForPlayer.
   - Refs: `src/TWL_Tanks_Sandbox_Beta_Script.ts`

15) [P2] Raw waits and magic numbers should be named constants.
   - Consolidate timing values and group tunables by subsystem.
   - Refs: `src/TWL_Tanks_Sandbox_Beta_Script.ts`

16) [P2] Naming conventions and terminology alignment.
   - Standardize camelCase/PascalCase usage and align terms (kills vs elims, round vs match).
   - Refs: `src/TWL_Tanks_Sandbox_Beta_Script.ts`

17) [P2] Format-string placeholder arity audit (beyond the P0 overLine mismatch).
   - Ensure all `mod.Message` calls provide the correct number of arguments for their keys.
   - Refs: `src/TWL_Tanks_Sandbox_Beta_Script.ts`, `src/TWL_Tanks_Sandbox_Beta_Strings.strings.json`

18) [P2] Admin panel mutation and audit policy consistency.
   - Centralize admin mutation entry points and make audit messages/guards uniform.
   - Refs: `src/TWL_Tanks_Sandbox_Beta_Script.ts`

19) [P2] Redundant cache resets should be clarified or removed.
   - Example: duplicate `clearSpawnBaseTeamCache()` calls.
   - Refs: `src/TWL_Tanks_Sandbox_Beta_Script.ts`

20) [P2] Legacy UI blocks and dev-only notes remain in the runtime script.
   - Old Team Switch/join prompt blocks and large dev-only notes should move to docs or be removed.
   - Refs: `src/TWL_Tanks_Sandbox_Beta_Script.ts`

21) [P2] Strings hygiene for unused and placeholder keys.
   - Unused keys likely include: twl.debug.adminPos, twl.debug.adminFacing, twl.hud.labels.roundKills.
   - Placeholder strings include: twl.ui.x ("??"), twl.system.debugPlaceholderName (typo).
   - Refs: `src/TWL_Tanks_Sandbox_Beta_Strings.strings.json`

22) [P2] Reduce repeated HUD updates and duplicate player loops.
   - Prefer a shared helper for valid-player iteration and single-pass HUD updates.
   - Refs: `src/TWL_Tanks_Sandbox_Beta_Script.ts`

23) [P2] Separate gameplay state mutations from HUD rendering.
   - Several functions update state and render HUD in the same path; split responsibilities.
   - Refs: `src/TWL_Tanks_Sandbox_Beta_Script.ts`

24) [P3] Versioning and changelog consistency enforcement.
   - Keep header/EOF/strings branding and changelog entries aligned per release.
   - Refs: `src/TWL_Tanks_Sandbox_Beta_Script.ts`, `src/TWL_Tanks_Sandbox_Beta_Strings.strings.json`

25) [P3] TODO: remove dead functions before final 1.0.
   - Explicitly marked unused functions should be removed after confirming no hidden dependencies.
   - Refs: `src/TWL_Tanks_Sandbox_Beta_Script.ts`

## Other Considerations
- Label engine entry points clearly to avoid accidental removal during cleanup.
- Add a short subsystem map or TOC near the top of the script for navigation.
- Standardize broadcast vs player-only messaging semantics and spam gating rules.
- Audit remaining direct `mod.SetUI*` call sites and either wrap or document them.
- Commented-out string reference `twl.notifications.multiclickDetector` should be removed or wired before re-enabling.
- Validate hard-coded team/map labels against the live map pool and server rotation.
- Clarify join prompt skip-tip strategy and skip key lifecycle.
- Move large dev-only comment blocks into docs with short pointers in code.
- Standardize formatting for long parameter lists and nested calls.
- Add invariant comments for global maps/caches (PID vs ObjId, lifecycle).

## Notes
- Re-run the strings scan before 1.0; prior scans indicated 1 missing key (comment-only reference) and 3 unused keys.
