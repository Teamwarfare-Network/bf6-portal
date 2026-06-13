# AGENTS: Aircraft-Duel BF6 Workflow

This file defines local guardrails for AI agents working in `bf6-portal/dev/aircraft-duel`. Aircraft-duel was forked from `bf6-portal/dev/helis-only` at v0.737 (2026-06-01). Everything in this file is inherited from helis-only's AGENTS unless otherwise noted — the engine constraints are the same, so the policies are too.

Items marked **(engine constraint)** apply because the underlying engine forces them — never relax.
Items marked **(project convention)** are choices that the helis-only codebase made and proved out; aircraft-duel inherits them by default but can revisit if the new mode's needs differ.
Items marked **(deferred)** exist in Conquest but are not yet enforced here; documented so future agents know the precedent.

**New chat starting point**: read [`./design_doc/_aircraft_duel_kickoff.md`](./design_doc/_aircraft_duel_kickoff.md) BEFORE anything else. It's the orientation doc for the fork.

---

## Required Skills

When working in this folder, prefer these skills when available:

- `bf6-portal-mode-creator`
- `bf6-core-reference`

Use `bf6-portal-assistant` when requested or when troubleshooting / explaining behavior.

(Inherited from helis-only convention — confirm with the user whether these skills should be made the default for this folder.)

---

## Reference Sources

**Primary orientation doc**:
- [`./design_doc/_aircraft_duel_kickoff.md`](./design_doc/_aircraft_duel_kickoff.md) — fork brief. Self-contained intro to inherited architecture, load-bearing patterns, engine gotchas, and first decisions to make.

**Inherited helis-only docs** (kept in `design_doc/old_archive/` for reference):
- [`./design_doc/old_archive/_helis_source_inventory.md`](./design_doc/old_archive/_helis_source_inventory.md) — file-by-file map + function inventory + GameState shape.
- [`./design_doc/old_archive/heli_features.md`](./design_doc/old_archive/heli_features.md) — feature catalog with perf rankings.
- [`./design_doc/old_archive/heli_issues_design.md`](./design_doc/old_archive/heli_issues_design.md) — static-analysis risk inventory + Conquest-port catalogue.
- [`./design_doc/old_archive/heli_issues.md`](./design_doc/old_archive/heli_issues.md) — active bug tracker. Inherited issues apply to aircraft-duel until proven otherwise.
- [`./design_doc/old_archive/heli_v_conquest_comp.md`](./design_doc/old_archive/heli_v_conquest_comp.md) — comparison with Conquest.
- [`./design_doc/old_archive/heli_improvement_plan.md`](./design_doc/old_archive/heli_improvement_plan.md) — effort × value action plan (some items may already be shipped in v0.7XX).
- [`./design_doc/old_archive/6.01.26_cleanup_polish_analysis.md`](./design_doc/old_archive/6.01.26_cleanup_polish_analysis.md) — ~100 LOC of dead code identified at fork; consider applying as an early commit.

**Cross-reference to Conquest** (for ported patterns and bug history):
- [`../conquest/AGENTS.md`](../conquest/AGENTS.md) — many policies below were ported from here verbatim via helis-only.
- [`../conquest/design_doc/conquest_issues_summary.md`](../conquest/design_doc/conquest_issues_summary.md) — Conquest bug history. Cite a `CQ #N` when porting a fix.

**Cross-reference to helis-only sibling** (for ancestor context):
- [`../helis-only/`](../helis-only/) — the immediate parent. A bug fix landed there does NOT auto-flow here; use `git cherry-pick <sha>` to bring it across.

**Primary API source of truth** (valid symbols and signatures):
- `../reference_bf6_core` (shared with Conquest and helis-only)

**Supporting context** (only when the user explicitly references it):
- `../reference_bf6_portal*/`
- `./reference_*` (none currently exist — left here for future)

---

## API Validity Rules (engine constraint)

1. Validate every `mod.*` and `modlib.*` symbol against local files in `../reference_bf6_core`.
2. Do not present unverified symbols as valid API calls.
3. If a symbol is missing, mark it as unverified and propose a verified alternative when possible.
4. Prefer exact symbol names and signatures from the local reference files.

---

## Banned / Risky Patterns (engine constraint)

These are confirmed broken or unreliable per Conquest's + helis-only's combined bug history. Aircraft-duel inherits the same engine constraints.

### `mod.AddUIIcon` is non-functional
1. `mod.AddUIIcon()` accepts arguments and completes without error, but produces NO visible output on any parent type.
2. Conquest exhaustively tested this in v1.047-v1.059. Never rendered.
3. Do NOT use `mod.AddUIIcon` or `mod.RemoveUIIcon` for world-space icons.
4. Instead, use per-player spawned WorldIcon clones via `mod.SpawnObject(RuntimeSpawn_Common.WorldIcon, ...)` with `SetWorldIconOwner(icon, player)`.
5. Spawned WorldIcons start with image/text DISABLED — call `EnableWorldIconImage(icon, true)` + `EnableWorldIconText(icon, true)` after configuration.

### `mod.Message` string-key requirement
1. `mod.Message()` does NOT accept arbitrary literal strings. Passing a literal like `mod.Message("hello")` produces "unknown string" at runtime.
2. All text passed to `mod.Message()` must use registered keys from [`src/strings.json`](./src/strings.json) accessed via `mod.stringkeys.*`.
3. For dynamic values, use a format pattern key in `strings.json` (e.g. `"{0}"`) and pass the value as a format argument: `mod.Message(mod.stringkeys.twl.hud.clock.digit, 4)`.
4. Format arguments accept `string | number | Player` only. Do not pass nested `mod.Message()` objects as arguments. Max 3 format args per call.

### `mod.CompareVehicleName` is unreliable
1. Returns false even for matching vehicles (confirmed in Conquest CQ_Bug_43, also bit helis at v0.7XX).
2. Classify via the slot-binding cache: `vehicleToSlot[objId]` → `slot.vehicleType` → pure-JS enum switch.

### `mod.SetMaxVehicleHeightLimitScale` is one-way per session
1. Once a custom scale has been applied this session, the engine refuses to revert to 1.0 (Vanilla) without a server restart.
2. The Ready Dialog's ceiling-vanilla-lockout UI was built to prevent the user from accidentally trying — code/UI both block the revert when sticky `hasEverAppliedCustom` is true.

### `GetSoldierState` error gap on undeployed / dead players
1. Engine logs `Failed to apply action to player due to player not being deployed` BEFORE the JS exception is raised. try/catch suppresses the JS error but the world-log line is already written.
2. Wrappers `safeGetSoldierStateBool` / `safeGetSoldierStateVector` (in `state.ts`) gate on both `isPlayerDeployed` AND `isPlayerAlive` to prevent the gap window. Use these — don't call `mod.GetSoldierState` directly.

### `OnPlayerEnterVehicle` drops events; `OnPlayerExitVehicle` is reliable
1. Don't pre-emptively guard the exit side with "in case we missed the enter" defensiveness — it creates worse bugs.
2. For helis-only N=2-8, mod.AllPlayers() scan is preferred over an OnPlayerEnterVehicle-driven cache (the cache fails silently when the event drops or team is unassigned).

### Player teleport + ForcePlayerToSeat is banned
1. The pattern `mod.Teleport(player, ...)` followed by `mod.ForcePlayerToSeat(...)` broke twice in Conquest (v1.106-v1.108 and v1.151-v1.154) and again in helis (v1.246-v1.252 ForcePlayerToSeat unreliable across all contexts). Do not introduce.
2. Vehicle-only teleport (`mod.Teleport(vehicle, ...)`) is OK and is used in Helis at [src/vehicles.ts:452-454](src/vehicles.ts#L452) (spawn-yaw enforcement) and [src/ready-dialog.ts](src/ready-dialog.ts) (soft-ceiling pushback). These are not the banned pattern.

### Non-ASCII characters are banned in `dist/bundle.ts` (engine constraint)
1. The Portal sandbox SILENTLY rejects scripts containing any non-ASCII byte (anything outside `0x00-0x7F`). When this happens:
   - No console error fires.
   - No event handlers register.
   - The mod looks "loaded" in the editor but is effectively dead at runtime.
2. **Common offenders** (replace with ASCII equivalents):
   - Em-dash `—` (U+2014) → use `-` or `--`
   - En-dash `–` (U+2013) → use `-`
   - Smart quotes `'` `'` `"` `"` (U+2018, U+2019, U+201C, U+201D) → use `'` and `"`
   - Arrow `→` `←` (U+2192, U+2190) → use `->` `<-`
   - Non-breaking space (U+00A0) → use regular space
   - Bullet `•` (U+2022) → use `-` or `*`
3. **Guardrail**: `scripts/postbuild.js` hard-fails the build with `process.exit(1)` if any non-ASCII byte survives. This catches regressions at build time.
4. **Where the constraint applies**:
   - All source TypeScript files (`src/**/*.ts`) for CODE and INLINE comments.
   - Full-line `// ...` comments are stripped at postbuild (so em-dashes there don't reach the bundle), but writing pure-ASCII even in line comments is defense-in-depth.
5. **Where it does NOT apply**:
   - `src/strings.json` — player-facing strings can contain any Unicode the engine supports.

### `console.log` and the world log are NOT reliable diagnostic surfaces
1. **World log** (`mod.DisplayHighlightedWorldLogMessage`, the script-side `sendHighlightedWorldLogMessage` wrapper) holds at most 4 lines at once and silently fires inconsistently under load. It is for **player-facing gameplay messages only**, not for surfacing diagnostic state.
2. **`console.log`** is unreliable — not confirmed to surface to any visible console in the BF6 Portal runtime.
3. **Reliable testable surfaces in BF6 Portal**:
   - **Persistent HUD widget overlay**. Render diagnostic state to a `mod.AddUIText` widget owned by a specific pid. Always-visible, durable, per-pid scoped.
   - **`mod.DisplayNotificationMessage(message, player)`**. Per-player notification; more reliable than world log. Verify durability empirically before relying for repeated probes.
   - **Implicit verification via downstream behavior**. Pure-plumbing changes can defer SP smoke to the next ship that consumes the new state.
   - **Type system + bundle build**. `npx tsc --noEmit` and `npm run bumpVersion` catch shape errors but not runtime correctness.
4. **`FEATURE_PERF_DIAG` is not present**. When proposing diagnostic instrumentation, use the persistent HUD overlay pattern.

---

## Load-Bearing Architecture (inherited from helis-only)

These patterns are non-negotiable for the engine to work correctly. Do not refactor casually — each one solves a real production bug.

### Per-pid HUD model
Every UI widget is named `XXX_${pid}` and built per player. There is no shared HUD. `State.hudCache.hudByPid[pid]` caches widget refs after construction. See [`src/hud-scoring-lazy.ts`](src/hud-scoring-lazy.ts), [`src/hud-dialog-lazy.ts`](src/hud-dialog-lazy.ts), [`src/ready-dialog.ts`](src/ready-dialog.ts), [`src/overtime.ts`](src/overtime.ts).

### Lazy build via `triggerLazyBuild`
Heavy HUD surfaces are built on demand, not at `OnPlayerJoinGame`. This eliminates the concurrent-join frame-budget cliff (parent project CQ_Bug_40). Don't reintroduce eager dogpile.

### Pending / confirmed mode config (v0.732 in helis lineage)
Settings the player tweaks in the Ready Dialog live in two parallel shapes:
- `State.round.modeConfig.X` — pending value (mutated live as user clicks +/-)
- `State.round.modeConfig.confirmed.X` — confirmed value (snapshotted on Confirm click)

Dirty-state diff drives red/green coloring. Side effects fire only on Confirm. **New ready-dialog knobs must follow this pattern.** Canonical example: [`./design_doc/old_archive/6.01.26_matchup_players_pending_confirmed_plan.md`](./design_doc/old_archive/6.01.26_matchup_players_pending_confirmed_plan.md).

### Viewer-relative team colors (v0.737 in helis lineage)
Team-anchored colors are painted per-viewer via `getViewerOwnTeamColor` helper in `state.ts`. Four per-surface fixup functions repaint after each surface builds; orchestrator `repaintAllViewerTeamColorsForPid` fires on `processTeamSwitch`. **New team-colored widgets must register in the appropriate fixup.** Canonical example: [`./design_doc/old_archive/6.01.26_own_team_blue_color_swap_plan.md`](./design_doc/old_archive/6.01.26_own_team_blue_color_swap_plan.md).

### Restart-needed indicator (v0.733+ in helis lineage)
`State.round.needsRestartForVehicleChange` sticky flag set on Confirm when vehicle/HP/matchup fields changed, cleared on Restart. Drives red Restart-button label + warning text. Necessary because Confirm updates spawner config but doesn't despawn live vehicles.

---

## String Change Authorization Policy (project convention)

1. Any player-facing string edit requires explicit human approval before making the change.
2. This includes [`src/strings.json`](src/strings.json), string-key definitions/usages, and hardcoded UI/world-log text labels.
3. If approval is not explicitly given, do not edit strings; provide proposed string diffs for review only.
4. Approval scope is request-specific; additional unapproved string edits require a new approval.
5. In outputs, identify string files changed and reference the approving user instruction.

---

## Function Comment Readability Policy (project convention)

1. Every newly added function must have a basic comment directly above it.
2. Comment must state purpose and any key/critical behavior or constraint needed for safe maintenance.
3. For transactional / authority-sensitive functions, include concise notes about ordering, guards, and side effects.
4. When modifying existing functions substantially, add or update comments if current comments are missing or stale.
5. When removing or refactoring code, update nearby comments so they remain accurate.
6. Function names must describe the end-goal behavior clearly (not temporary / mechanical naming).

---

## Comment Bundle-Stripping Behavior (engine constraint)

`scripts/postbuild.js` strips comments from the emitted bundle to preserve headroom. Source files are unchanged — these rules describe what survives into `dist/bundle.ts`:

1. **Standalone line comments** (`^[ \t]*// ...`) — STRIPPED.
2. **Standalone block comments** (`^[ \t]*/* ... */` on its own line(s)) — STRIPPED.
3. **Inline trailing comments** (`const x = 5; // note`) — SURVIVE.
4. **Inline block comments** (`code /* note */ code`) — SURVIVE.
5. **TypeScript directive comments** (`// @ts-nocheck`, `// @ts-ignore`, `// @ts-expect-error`) — SURVIVE. Negative lookahead in the strip regex preserves them.

Implications for authoring:
- Use JSDoc and section headers freely in source — they cost zero bundle bytes.
- Inline trailing comments DO cost bundle bytes; reserve them for genuinely useful pointers.
- Don't write critical structural info as an inline trailing comment expecting it to vanish — it doesn't.

### Header re-injection (postbuild)

After the comment-strip pass, postbuild re-injects the full [`src/header-file.ts`](src/header-file.ts) content at the very top of `dist/bundle.ts` (versioning + license + attribution). This keeps the legal/credit block visible in the shipped bundle even though all `//` lines were stripped from the body.

---

## Code Placement and Structure Policy

Aircraft-duel inherits helis-only's ~20K LOC codebase across 22 flat files. Structure policy is intentionally light:

1. Place new code in the file whose responsibility most closely matches.
2. **Do not** introduce subfolders speculatively. If a file grows beyond ~3,000 lines AND the contents have clearly separable concerns, propose a split via a plan-mode file rather than acting unilaterally.
3. **Do not** copy Conquest's `src/` subfolder structure wholesale. The Conquest layout reflects 6+ optimization waves; aircraft-duel hasn't earned that complexity yet.
4. **The megaliths inherited from helis-only**: [`src/ready-dialog.ts`](src/ready-dialog.ts) (~5,540 lines), [`src/overtime.ts`](src/overtime.ts) (~2,396 lines), [`src/hud.ts`](src/hud.ts) (~1,966 lines), [`src/state.ts`](src/state.ts) (~1,362 lines). Splitting any is deliberate plan-mode work.
5. Aircraft-duel may eventually diverge enough from helis-only that some files become irrelevant or need replacement. When that happens, prefer renaming/replacing entire files rather than partial edits that leave the file role muddled.

---

## Change Log and Versioning Policy

1. Every implemented code change must include a matching [`src/Changelog.ts`](src/Changelog.ts) entry.
2. **The inherited Changelog.ts contains the full helis-only v0.6XX-v0.737 history** because the file was copied verbatim at fork. That history is accurate ancestry for the code in this folder. Aircraft-duel entries should be added at the top.
3. Use the existing bump-version workflow whenever a new change is landed:
   - Script path: `./scripts/bump-version.js`
   - Package script: `npm run bumpVersion`
4. **Always use the bumpVersion script** — never hand-edit version strings across the 4 files it touches ([header-file.ts](src/header-file.ts) `// version:` line, [footer-file.ts](src/footer-file.ts) `// EOF version:` line, [strings.json](src/strings.json) `branding.title` `(vX.XXX)` suffix, [package.json](package.json) `"version"` field).
5. **Helis-only's `bumpVersion` script does NOT support a `-c` flag** (that's Conquest-only). For aircraft-duel, run `npm run bumpVersion` with no args to auto-increment, then hand-edit the Changelog entry separately.
6. Do not defer changelog/version updates to later cleanup; update them in the same change set.
7. Immediately after `npm run bumpVersion`, run compile verification before handoff:
   - `npm run build`
   - `cmd /c npx tsc --pretty false --noEmit`
8. Treat any compile error from that post-bump verification as blocking; fix before finalizing.

---

## Bundle Size Limit Policy (engine constraint)

1. Battlefield Portal script upload has a hard size limit for emitted script files (1 MiB = 1,048,576 bytes).
2. Treat `dist/bundle.ts` size as blocking when it exceeds 1,048,576 bytes.
3. `scripts/verify.js` enforces this cap and fails verification when exceeded.
4. Before handoff, always run verification and confirm the bundle size check passes.
5. For every implemented code change, report:
   - Current emitted `dist/bundle.ts` size.
   - Bytes remaining below the 1,048,576 byte cap.
   - Direction versus the prior reported implementation (`up` / `down` / `flat`).
6. Use the size data from the post-`bumpVersion` build/verify output as the source of truth; do not estimate or omit it.

**Current headroom** (as of fork at v0.737): ~479,000 bytes free (569 KB used of 1024 KB cap, ~45% remaining).

---

## Execution Workflow

1. Start from [`./design_doc/_aircraft_duel_kickoff.md`](./design_doc/_aircraft_duel_kickoff.md) for orientation.
2. Cross-reference [`./design_doc/old_archive/heli_issues_design.md`](./design_doc/old_archive/heli_issues_design.md) for known bugs/risks in the area you're touching.
3. Cross-reference [`./design_doc/old_archive/_helis_source_inventory.md`](./design_doc/old_archive/_helis_source_inventory.md) for file/function inventory.
4. Validate every planned API call via `../reference_bf6_core/00-api-reference-index.md`.
5. Locate specific symbol docs via `../reference_bf6_core/mod/00-api-index.md` or `../reference_bf6_core/modlib/00-api-index.md`.
6. Open exact symbol files before writing or changing code.
7. **Obtain explicit human approval before any player-facing string edits.**
8. Implement original code using only verified APIs.
9. In outputs, cite local reference file path(s) used for design decisions and API validation.
10. Once completed, present a test plan to be used by a human to confirm the implementation quality. Professional, robust, but succinct.
11. For every code change, include changelog/version updates per the Change Log policy before finalizing.

---

## Task List Protocol

1. Before making edits, create a concise task list for the job.
2. Task list must include, at minimum: requirements review, reference review, API validation, implementation, and verification.
3. Track status explicitly (`pending`, `in_progress`, `completed`) and keep only one item `in_progress` at a time.
4. Update the task list after each meaningful step, and revise it if scope changes.
5. Include the final completed task list summary in the response.

---

## Plan Protocol

Whenever planning a non-trivial change (anything entering plan mode, or any multi-file or multi-step design), follow these rules:

1. **First action of every plan: read `AGENTS.md`.** The planner must load this file's rules into context before drafting any plan, so banned patterns and policies are reflected. The first explicit step of any plan file should be: *"Read [`AGENTS.md`](./AGENTS.md) and [`design_doc/_aircraft_duel_kickoff.md`](./design_doc/_aircraft_duel_kickoff.md) (plus relevant `old_archive/heli_*.md` for the affected area)."*
2. **Plans are historical references.** Every approved plan must be saved as a permanent file in [`./design_doc/`](./design_doc/) for future agents/humans to reference. Plan-mode's transient file at `~/.claude/plans/<name>.md` is ephemeral; a copy must be persisted to the repo.
3. **Naming convention**: `design_doc/<MM.DD.YY>_ad_<topic>_plan.md` — date front-loaded so files sort chronologically, `ad_` prefix to distinguish from inherited helis docs. Examples: `6.05.26_ad_plane_support_plan.md`, `6.10.26_ad_first_to_n_kills_plan.md`.
4. **Plan structure**:
   - Start with a `## Context` section explaining why the change is being made.
   - List critical files to be modified (or files referenced for read-only context).
   - Reference existing functions/utilities to be reused, with their file paths.
   - Include a verification section describing how to test end-to-end.
5. **One plan per coherent change set.** A single feature design is one plan file. Do not bundle unrelated changes.
6. **Plans persist regardless of outcome.** If the plan ships and works, it stays as a record. If abandoned or superseded, it stays with a header note marking the status (e.g., `*Status: Abandoned 2026-06-15 — superseded by ...*`).
7. **A plan file existing is NOT approval to apply it.** Wait for explicit go-ahead from the user before executing.

---

## Git / Fork-Awareness Policy

1. Aircraft-duel forked from helis-only at v0.737 (2026-06-01). The Changelog history before that date represents the actual ancestry of the code in this folder — keep it.
2. A bug fix landed on `feature/helis-only_b` (the helis-only branch) does NOT automatically appear in aircraft-duel. If a fix applies to both:
   - Preferred: `git cherry-pick <sha>` from helis-only's branch.
   - Acceptable: re-implement the equivalent change with a Changelog entry noting "Cherry-pick equivalent of helis-only v0.XXX <description>".
3. When investigating a bug, check `git log -- bf6-portal/dev/helis-only/src/<same-filename>` to see if helis-only has already debugged the same issue. Aircraft-duel inherits helis-only's first ~6 months of bug history.
4. Don't push directly to `feature/helis-only_b` from this folder. Aircraft-duel work belongs on its own branch.

---

## New Chat Startup Checklist

1. Confirm this file (`AGENTS.md`) is loaded and being followed.
2. Confirm primary orientation doc: [`./design_doc/_aircraft_duel_kickoff.md`](./design_doc/_aircraft_duel_kickoff.md).
3. Confirm API source: `../reference_bf6_core`.
4. Confirm bug-tracker cross-reference: [`./design_doc/old_archive/heli_issues.md`](./design_doc/old_archive/heli_issues.md) (inherited bugs apply until proven fixed).
5. Confirm a task list will be created and maintained during execution.
6. Confirm output will include reference path citations and clearly marked assumptions.

---

## Output Requirements

1. Separate verified facts from assumptions.
2. Include reference paths for each major API-related decision.
3. If references are incomplete, state the gap explicitly.
4. Include task list status (completed work and any remaining items).
5. If string edits were made, include the explicit human approval reference in the output.
6. For every implementation handoff, include a bundle-size line with:
   - current `dist/bundle.ts` size
   - bytes remaining below the upload cap
   - direction versus the prior reported implementation (`up` / `down` / `flat`)

---

## IDE Link Policy

1. Local file references in responses should be IDE-openable paths, not browser URLs.
2. Use markdown links with relative paths from the workspace root: `[src/clock.ts](src/clock.ts)` or `[src/clock.ts:42](src/clock.ts#L42)`.
3. Include line numbers when relevant.
4. Link labels must include the project-relative folder path (for example `src/state.ts`), not just a bare filename like `state.ts`.

---

## BEFORE CODING:

1. Confirm you loaded `AGENTS.md`.
2. Confirm you will use [`./design_doc/_aircraft_duel_kickoff.md`](./design_doc/_aircraft_duel_kickoff.md) as primary orientation reference.
3. Confirm you cross-referenced inherited [`./design_doc/old_archive/heli_issues.md`](./design_doc/old_archive/heli_issues.md) for the area you're touching.
4. Confirm you will use `../reference_bf6_core` as API source of truth and validate every `mod.*` / `modlib.*` symbol.
5. Confirm you will create and maintain a task list with statuses (`pending`, `in_progress`, `completed`) before implementation starts.

## AFTER CODING:

- Ensure the [Changelog](src/Changelog.ts) is updated (new entry at top) and version is bumped via `npm run bumpVersion`.
- Run `npm run build` then `cmd /c npx tsc --pretty false --noEmit`.
- Report bundle size delta in the handoff.

---

## Items Deferred from Conquest (not yet adopted)

These are policies / patterns that exist in Conquest but are not yet enforced in aircraft-duel (or helis-only). Documented here so future agents see the precedent.

| Conquest item | Status / why deferred |
|---|---|
| **Combat HUD Dirty-Flag Contract** | No combat HUD exists. Scoped version (kills/victory dialog dirty-flag) was proposed as helis B3; status unknown post-fork. |
| **Codebase Reference Map Maintenance Policy** | The inherited `_helis_source_inventory.md` is the equivalent; may need an aircraft-duel-specific update once the codebase diverges meaningfully. |
| **UI Layout Change Protocol** | No parallel-frame UI lanes problem yet. Adopt only if/when a layout change goes wrong. |
| **`FEATURE_PERF_DIAG`** | No `FEATURE_*` flag machinery yet. Add a single `ENABLE_TELEMETRY` flag if/when telemetry instrumentation lands. |
| **Comment strip marker `// *<keyword>`** | Not currently used. Add only if a source-only convention needs special bundle handling. |
