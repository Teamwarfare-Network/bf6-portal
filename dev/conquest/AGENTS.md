# AGENTS: Conquest BF6 Workflow

This file defines local guardrails for AI agents working in `bf6-portal/dev/conquest`.

## Required Skills

Always use these skills for work in this folder:

- `bf6-portal-mode-creator`
- `bf6-core-reference`

Use `bf6-portal-assistant` when requested or when troubleshooting/explaining behavior.

## Reference Sources

Primary design and product documentation:

- `./design_doc/conquest_design.md` (canonical requirements)
- `./reference_design_documentation` (supporting analyses and references)

Archive (outdated; opt-in only):

- `./reference_design_documentation/archive`
- Use only when the user explicitly asks to consult archive material.

Primary API source of truth (valid symbols and signatures):

- `../reference_bf6_core`

Supporting context:

- `../reference_bf6_portal*/`
- `./reference_*`

Methodology and capability references (pattern guidance only, not code source):
There are multiple implementations in here, all with large files. When using these references, summarize each one individually and ensure complete understanding of those implementations before inferring patterns and methods are applicable.

- `./reference_implementations`

Prompting examples:

- `https://gist.github.com/Quoeiza/8085f142ad8a05ee04b79adcc4ad8fd7`

## API Validity Rules

1. Validate every `mod.*` and `modlib.*` symbol against local files in `reference_bf6_core`.
2. Do not present unverified symbols as valid API calls.
3. If a symbol is missing, mark it as unverified and propose a verified alternative when possible.
4. Prefer exact symbol names and signatures from the local reference files.

## Non-Copy Policy

1. Use folders under `reference_implementations` for methodology, architecture patterns, flow ideas, and capability examples only.
2. Do not directly copy code blocks, large logic chunks, or file structures from these methodology references into production code.
3. Produce original implementations tailored to current project constraints and validated APIs.
4. If a request appears to require direct code copying from methodology references, stop and ask the user for explicit approval before copying.

## mod.AddUIIcon is Non-Functional

1. `mod.AddUIIcon()` accepts arguments and completes without error, but produces NO visible output on any parent type (InteractPoint, authored WorldIcon, spawned WorldIcon).
2. Tested exhaustively in v1.047–v1.059 with multiple parent types, offsets, visibility params, and enum values. Never rendered.
3. Do NOT use `mod.AddUIIcon` or `mod.RemoveUIIcon` for world-space icons in this project.
4. Instead, use per-player **spawned WorldIcon clones** via `mod.SpawnObject(RuntimeSpawn_Common.WorldIcon, ...)` with `SetWorldIconOwner(icon, player)` for per-player visibility.
5. Spawned WorldIcons start with image/text DISABLED — must call `EnableWorldIconImage(icon, true)` and `EnableWorldIconText(icon, true)` after configuration.

## mod.Message String Key Requirement

1. `mod.Message()` does NOT accept arbitrary literal strings. Passing a literal like `mod.Message("hello")` produces "unknown string" at runtime.
2. All text passed to `mod.Message()` must use registered string keys from `src/strings.json` accessed via `mod.stringkeys.*`.
3. For dynamic numeric/text values, use a format pattern string in `strings.json` (e.g. `"{0}"`) and pass the value as a format argument: `mod.Message(mod.stringkeys.twl.hud.clock.digit, 4)`.
4. Format arguments accept `string | number | Player` only. Do not pass nested `mod.Message()` objects as arguments.
5. This applies everywhere `mod.Message` is used: HUD text labels, AddUIIcon text, world log messages, notifications.
6. When in doubt, copy the exact pattern from an existing working call site (e.g. clock digit widget).

## Debugging / Diagnostic Output Policy

1. **The world log is NOT a debugging surface.** It is transient, holds at most 4 lines at once, and is unreliable (fires inconsistently, silently breaks under load). `mod.DisplayHighlightedWorldLogMessage` and `sendHighlightedWorldLogMessage` are for **user-facing gameplay notifications only** (e.g. "Match started.", "{Player} has readied up: 3/4"). Never use them to surface diagnostic state for SP smoke or MP verification.
2. **`console.log` is also unreliable.** Existing call sites (e.g. `lazy-build-registry.ts`'s error logger) write to `console.log`, but it is not confirmed to surface to any visible developer console in the BF6 Portal runtime. Do not rely on it for diagnostic verification.
3. **`FEATURE_PERF_DIAG` is broken** even when its flag is true (per `project_perf_diag_broken.md` memory). Do not propose `FEATURE_PERF_DIAG`-gated instrumentation as a verification mechanism.
4. **Reliable testable surfaces in BF6 Portal:**
   - **Persistent HUD widget overlay.** Render diagnostic state to a `mod.AddUIText` widget owned by a specific pid. Always-visible, durable, per-pid scoped. Use this for any SP smoke that requires observing internal state.
   - **In-game UI dialog / panel.** Heavier than a HUD overlay but useful for paginated state inspection.
   - **`mod.DisplayNotificationMessage(message, player)`.** Distinct from world log; appears as a per-player notification. Verify durability empirically before relying on it for repeated probes.
   - **Implicit verification via downstream behavior.** Pure-plumbing changes (no UX surface) can defer SP smoke to the next ship that consumes the new state. If Ship N+1 behaves correctly, Ship N's plumbing is implicitly verified.
   - **Type system + bundle build.** `npx tsc --noEmit` and `npm run bumpVersion` catch shape errors but not runtime correctness.
5. **When proposing SP smoke for a ship**, the proposal must use one of the reliable surfaces above. Proposals that say "look in the world log" or "check console.log" should be rejected during review and re-proposed with a HUD overlay or implicit-verification path.
6. **Existing `console.log` call sites** (e.g. `_logLazyBuildError` in `lazy-build-registry.ts`) are tolerated as best-effort error sinks but are not load-bearing for diagnostics. Do not add new `console.log` instrumentation expecting it to surface anywhere.

## String Change Authorization Policy

1. Any player-facing string edit requires explicit human approval before making the change.
2. This includes `src/strings.json`, string-key definitions/usages, and hardcoded UI/world-log text labels/messages.
3. If approval is not explicitly given, do not edit strings; provide proposed string diffs for review only.
4. Approval scope is request-specific; additional unapproved string edits require a new approval.
5. In outputs, identify string files changed and reference the approving user instruction.

## Function Comment Readability Policy

1. Every newly added function must have a basic comment directly above it.
2. Comment must state purpose and any key/critical behavior or constraint needed for safe maintenance.
3. For transactional/authority-sensitive functions, include concise notes about ordering, guards, and side effects.
4. When modifying existing functions substantially, add/update comments if current comments are missing or stale.
5. When removing or refactoring code, update nearby comments so they remain accurate and do not describe deleted behavior.
6. Function names must describe the end-goal behavior clearly (not temporary/mechanical naming).

## Comment Bundle-Stripping Behavior (postbuild)

`scripts/postbuild.js` strips comments from the emitted bundle to preserve headroom. Source files are unchanged — these rules describe what survives into `dist/bundle.ts`:

1. **Standalone line comments** (`^[ \t]*// ...`) — STRIPPED. Includes JSDoc-style `//` lines, section headers, etc.
2. **Standalone block comments** (`^[ \t]*/* ... */` on its own line(s)) — STRIPPED (v1.398). Includes JSDoc `/** ... */` blocks above functions and types.
3. **Inline trailing comments** (`const x = 5; // note`) — SURVIVE. The line-comment regex requires `/` at line start.
4. **Inline block comments** (`code /* note */ code`) — SURVIVE. The block-comment regex requires `/*` at line start AND `*/` at line end.
5. **TypeScript directive comments** (`// @ts-nocheck`, `// @ts-ignore`, `// @ts-expect-error`) — SURVIVE. Negative lookahead in the strip regex preserves them.

Implications for authoring:
- Use JSDoc and section headers freely in source — they cost zero bundle bytes.
- Inline trailing comments DO cost bundle bytes; reserve them for genuinely useful pointers (subtle invariants, non-obvious whys).
- Don't write critical structural info as an inline trailing comment expecting it to vanish — it doesn't.

### Header re-injection (postbuild step 11)

After the comment-strip pass at step 10, postbuild re-injects the full `src/header-file.ts` content at the very top of `dist/bundle.ts` (versioning + license + attribution). This keeps the legal/credit block visible in the shipped bundle even though all `//` lines were stripped from the body.

The header re-injection runs its own targeted strips before prepending:
- `// @ts-nocheck` lines — STRIPPED (build-time directive only)
- `// Module: ...` lines — STRIPPED (bundler artifact)
- `// *policy[...]` lines — STRIPPED (source-only project conventions; see below)

### Strip-from-bundle marker: `// *<keyword>`

Lines starting with `// *<keyword>` in `src/header-file.ts` are stripped from the bundle by postbuild. This is the project convention for **source-only project conventions** that document rules for whoever's editing but shouldn't ship to the engine.

Currently registered keywords:
- `// *policy` — versioning policies, file-policy notes, naming rules. Stripped by step 11. Confirmed v1.504.

Pattern: `^[ \t]*\/\/\s*\*<keyword>[^\n]*\n` (gm flag). Adding a new keyword requires editing `scripts/postbuild.js` step 11 to register the additional strip pass.

Scope: this convention only applies to `src/header-file.ts`. Other source files have their `//` line comments stripped at step 10 anyway, so the marker is redundant there.

## Non-ASCII Characters Are Banned in dist/bundle.ts

**Confirmed via v1.498 silent-load failure (2026-05-09).** The Portal sandbox SILENTLY rejects scripts containing any non-ASCII byte (anything outside `0x00-0x7F`). When this happens:
- No console error fires.
- No event handlers register.
- No script-side functionality runs (no vehicles spawn, no UIs build, no callbacks fire).
- The mod looks "loaded" in the editor but is effectively dead at runtime.

**Common offenders** (replace with ASCII equivalents):
- Em-dash `—` (U+2014) → use `-` or `--`
- En-dash `–` (U+2013) → use `-`
- Smart quotes `'` `'` `"` `"` (U+2018, U+2019, U+201C, U+201D) → use `'` and `"`
- Arrow `→` `←` (U+2192, U+2190) → use `->` `<-`
- Non-breaking space (U+00A0) → use regular space
- Bullet `•` (U+2022) → use `-` or `*`

**Where this constraint applies:**
- Source TypeScript files (`src/**/*.ts`) — all CODE must be pure ASCII; INLINE COMMENTS (after code, on the same line) must be pure ASCII because the comment-strip pass at postbuild step 10 only removes `^// ...` line-leading comments, not inline `code; // note`.
- FULL-LINE comments (`// ...` at line start) ARE stripped at postbuild and don't reach the bundle, but writing pure-ASCII even there is recommended as defense-in-depth in case stripping ever changes.

**Where it does NOT apply:**
- `src/strings.json` — player-facing strings can contain any Unicode the engine supports. The engine's `mod.Message` system handles these separately from the script bundle.

**Guardrail (2026-05-09).** `scripts/postbuild.js` step 11.5 hard-fails the build with `process.exit(1)` if any non-ASCII byte is found in the emitted bundle, printing the offending line + character + code point. This catches the regression at build time so it never reaches the engine.

## Code Placement and Structure Policy

1. Place new code in the correct domain file/module for the behavior being changed.
2. Do not centralize unrelated logic into monolith files when a domain-specific file already exists.
3. If a file grows beyond practical review/maintenance size, split by ownership/lifecycle boundaries before adding more logic.
4. Keep call flow logical: build/ensure, render/update, lifecycle/cleanup, and interaction code should remain separated.

## Change Log and Versioning Policy

1. Every implemented code change must include a matching `src/Changelog.ts` entry.
2. Use the existing bump-version workflow whenever a new change is landed:
   - Script path: `./scripts/bump-version.js`
   - Package script: `npm run bumpVersion`
   - Preferred usage: `npm run bumpVersion -- -c "brief changelog entry"`
3. Do not defer changelog/version updates to later cleanup; update them in the same change set.
4. Immediately after `npm run bumpVersion`, run compile verification before handoff:
   - `npm run build`
   - `cmd /c npx tsc --pretty false --noEmit`
5. Treat any compile error from that post-bump verification as blocking; fix before finalizing.
6. **Post-bump doc-state refresh.** `bump-version.js` prints a checklist after every successful bump. Follow it: open [`design_doc/conquest_optimization_state.md`](./design_doc/conquest_optimization_state.md) and update the file map / function inventory / Project Stats per the "How to keep this file accurate" section at the bottom of that file. Specifically:
   - Project Stats row (bundle bytes, headroom, version)
   - File map row(s) for any source file with ≥5% line/byte change
   - PPM column if any per-pid state shape changed (cross-reference Mn IDs in [`design_doc/conquest_optimization_analysis.md`](./design_doc/conquest_optimization_analysis.md))
   - Function inventory entries for any added/removed top-level function
   - Compile-Time Feature Flags table if a flag flipped
   This is **additive** to the changelog/version requirement, not a replacement.

## Bundle Size Limit Policy

1. Battlefield Portal script upload has a hard size limit for emitted script files.
2. Treat `dist/bundle.ts` size as blocking when it exceeds `1,048,576` bytes (1 MiB).
3. `scripts/verify.js` must enforce this cap and fail verification when exceeded.
4. Before handoff, always run verification and confirm the bundle size check passes.
5. If size exceeds limit, prioritize removing redundant runtime paths/imports before feature additions.
6. For every implemented code change, report the current emitted bundle size in the final output.
7. Also report remaining headroom below the `1,048,576` byte cap.
8. Also report whether the bundle size went up, went down, or stayed flat versus the previous reported implementation checkpoint.
9. Use the size data from the post-`bumpVersion` build/verify output as the source of truth; do not estimate or omit it.

## Combat HUD Dirty-Flag Contract

1. `updateConquestCombatHudForAllPlayers` gates the per-player combat-HUD write-through on `State.conquest.debug.hudDirty || force`. If nothing marked the HUD dirty since the last tick, the expensive render is skipped.
2. Any mutation to the following state fields MUST call `markHudDirty()` in the same function body as the mutation, otherwise the HUD will stop reflecting the new state until some other unrelated change marks it dirty:
   - `State.conquest.tickets.*`
   - `State.conquest.capture.byObjId[*].ownerTeam`, `.ownerProgressTeam`, `.progress01`, `.onPointTeam1`, `.onPointTeam2`
   - `State.conquest.capture.visualByObjId[*]`
   - `State.conquest.capture.engagedObjIdByPid[*]`
   - `State.conquest.bleed.enabled`
   - `State.conquest.lifecyclePhase`
   - `State.match.isEnded`, `State.match.victoryDialogActive`
   - `State.conquest.debug.perspectiveTeamByPid[*]`
   - `State.players.deployedByPid[*]` (on transition between deployed ↔ not-deployed)
3. PR review must reject any diff mutating these fields without a `markHudDirty()` call in the same function body (exception: cleanup paths that immediately call `twlConquestHudHideAllPlayers()` or `twlConquestHudDestroyPlayer(pid)`).
4. The top-HUD derived-slice refresh (`refreshTopHudDerivedSlicesForAllPlayers`) and animation tick (`twlConquestHudTickAnimation`) are NOT gated — clock VM and animation lerps are time-variant and must run every subtick.
5. Force-render callers (`updateConquestCombatHudForAllPlayers(true)` at line 1998, 2048, area-triggers, spawn-charge, etc.) bypass the gate — leave those force-true wherever an event handler needs a guaranteed immediate render.

## UI Layout Change Protocol

1. For any HUD positioning request, first identify and verify the exact widget names actually rendering on screen.
2. Start with structure/order verification before editing coordinates:
3. Verify parent chain, anchor mode, and whether position is applied in creation path vs cached/reapply path.
4. Do not mix coordinate frames implicitly. Use exactly one frame strategy per HUD lane:
5. Strategy A: absolute positioning per widget under `UIRoot` using `TopLeft` anchors.
6. Strategy B: container-local positioning with explicit parent anchor/frame conversion.
7. If converting from design-doc absolute coordinates to container-local offsets, document the conversion math in code comments before applying edits.
8. Apply layout updates in all active code paths for that widget set: initial creation path and cached/reapply path.
9. After each UI layout change, require a visual verification checkpoint (new screenshot) or user confirmation, before additional UI refactors.
10. Ownership probes (temporary hide/move) are a fallback tool, not default workflow.
11. Use ownership probes only when one verified build shows no expected movement, to confirm actual rendering widget ownership.

## Execution Workflow

1. Start from `./design_doc/conquest_design.md` to understand requirements and intended behavior.
2. Use `./reference_design_documentation` for supporting analysis context.
3. Do not use `./reference_design_documentation/archive` unless explicitly requested by the user.
4. Read methodology references under `./reference_implementations` for approach ideas only.
5. Validate every planned API call via `../reference_bf6_core/00-api-reference-index.md`.
6. Locate specific symbol docs via `../reference_bf6_core/mod/00-api-index.md` or `../reference_bf6_core/modlib/00-api-index.md`.
7. Open exact symbol files before writing or changing code.
8. Obtain explicit human approval before any player-facing string edits.
9. Implement original code using only verified APIs.
10. In outputs, cite local reference file path(s) used for design decisions and API validation.
11. Once completed, present a test plan which will be used by a human to confirm the implementation's quality. This test plan should be professional, robust, but succinct and accurate.
12. For every code change, include changelog/version updates per the Change Log and Versioning Policy before finalizing.

## Task List Protocol

1. Before making edits, create a concise task list for the job.
2. Task list must include, at minimum: requirements review, reference review, API validation, implementation, and verification.
3. Track status explicitly (`pending`, `in_progress`, `completed`) and keep only one item `in_progress` at a time.
4. Update the task list after each meaningful step, and revise it if scope changes.
5. Include the final completed task list summary in the response.

## Plan Protocol

Whenever planning a non-trivial change (anything entering plan mode, or any multi-file or multi-step design), follow these rules:

1. **First action of every plan: read `AGENTS.md`.** The planner must load this file's rules into context before drafting any plan, so locked architectural decisions, banned patterns, and policies are reflected in the plan itself. The first explicit step of any plan file should be: *"Read [`AGENTS.md`](./AGENTS.md) and [`design_doc/conquest_design.md`](./design_doc/conquest_design.md)."*
2. **Plans are historical references.** Every approved plan must be saved as a permanent file in [`./design_doc/`](./design_doc/) for future agents/humans to reference. Plan-mode's transient file at `~/.claude/plans/<name>.md` is ephemeral; a copy must be persisted to the project repo.
3. **Naming convention:** `design_doc/<MM.DD.YY>_conquest_<topic>_plan.md` — date front-loaded so files sort chronologically in directory listings. Examples: `4.27.26_conquest_wave_1_plan.md`, `5.10.26_conquest_lazy_load_plan.md`. The date is when the plan was approved, not when it ships.
4. **Plan structure:**
    - Start with a `## Context` section explaining why the change is being made.
    - List critical files to be modified (or files referenced for read-only context).
    - Reference existing functions/utilities to be reused, with their file paths.
    - Include a verification section describing how to test end-to-end.
    - When the plan is wave-scoped (per [`conquest_optimizations_solutions_4.27.26.md`](./design_doc/conquest_optimizations_solutions_4.27.26.md)), state which wave it implements and reference the wave's items.
5. **One plan per coherent change set.** A "wave" or a single-feature design is one plan file. Do not bundle unrelated changes into a shared plan.
6. **Plans persist regardless of outcome.** If the plan ships and works, it stays as a record of the decision. If the plan is abandoned or superseded, it stays with a header note marking the status (e.g., `*Status: Abandoned 2026-05-01 — superseded by conquest_wave_3_plan_5.05.26.md.*`).

## New Chat Startup Checklist

1. Confirm this file (`AGENTS.md`) is loaded and being followed.
2. Confirm primary doc source: `./design_doc/conquest_design.md`.
3. Confirm API source: `../reference_bf6_core`.
4. Confirm archive policy: `./reference_design_documentation/archive` is outdated and used only if explicitly requested.
5. Confirm non-copy policy for methodology folders.
6. Confirm a task list will be created and maintained during execution.
7. Confirm output will include reference path citations and clearly marked assumptions.

## Output Requirements

1. Separate verified facts from assumptions.
2. Include reference paths for each major API-related decision.
3. If references are incomplete, state the gap explicitly.
4. When methodology references influence design, describe the pattern adapted without pasting their code.
5. Include task list status (completed work and any remaining items).
6. If string edits were made, include the explicit human approval reference in the output.
7. For every implementation handoff, include a bundle-size line with:
   - current `dist/bundle.ts` size
   - bytes remaining below the upload cap
   - direction versus the prior reported implementation (`up` / `down` / `flat`)

## IDE Link Policy

1. Local file references in responses must be IDE-openable paths, not browser URLs.
2. Use absolute workspace paths in markdown links with an IDE-safe target format:
   `/c:/Users/Soldat/TypeScriptProjects/twlmain/...`
3. Include line numbers when possible (for example `:42`) so navigation lands directly in the file.
4. Do not use drive-letter markdown targets like `C:\...` because some clients route those to a browser.
5. Link labels must include the project-relative folder path (for example `src/interaction/actions.ts`), not just a bare filename like `actions.ts`.
6. Always prefer IDE-native local file links for local code/doc references.

## Codebase Reference Map Maintenance Policy

1. The authoritative codebase reference map lives in [`./design_doc/conquest_optimization_state.md`](./design_doc/conquest_optimization_state.md). It contains the file map (lines, bytes, in-bundle status, per-player multiplier IDs) and the per-file function inventory. The companion [`./design_doc/conquest_optimization_analysis.md`](./design_doc/conquest_optimization_analysis.md) holds the reasoning (M1–M15 ranking, reclaim ladder, regime-change discussion).
2. When a major change adds, removes, or renames files or directories under `src/`, update the file map in the same change set.
3. When a major change adds or removes exported functions in high-traffic files (`index/`, `interaction/`, `hud/`, `vehicles/`, `ui/conquest/hud-core/`), add or remove the relevant function-inventory entry.
4. The reference map is a navigation aid, not exhaustive documentation. Keep entries to 1-line descriptions per file and per function.
5. Update the "Project Stats" header (file count, bundle size, headroom, version) after every bumpVersion. The bump-version script prints a post-bump checklist that points at the relevant section of the state file — follow it.
6. M1–M15 IDs are sorted by descending heap impact (M1 = worst). If a per-pid allocator is added or removed, re-rank the table in the analysis doc and propagate ID changes to the PPM column in the state doc. Both sides must stay in sync.

## BEFORE CODING:

1. Confirm you loaded `AGENTS.md`.
2. Confirm you will use `./design_doc/conquest_design.md` as primary requirements source.
3. Confirm `./reference_design_documentation` is supporting analysis context (not canonical requirements).
4. Confirm `./reference_design_documentation/archive` is treated as outdated and will only be used if explicitly requested.
5. Confirm you will use `../reference_bf6_core` as API source of truth and validate every `mod.*` / `modlib.*` symbol.
6. Confirm `./reference_implementations` is methodology-only and you will not copy code directly from its subfolders.
7. Confirm you will create and maintain a task list with statuses (`pending`, `in_progress`, `completed`) before implementation starts.

## AFTER CODING:

- Ensure the Changelog is updated and version is bumped via bumpVersion