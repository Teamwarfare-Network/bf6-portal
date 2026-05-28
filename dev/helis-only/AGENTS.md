# AGENTS: Helis-Only BF6 Workflow — **DRAFT (created 2026-05-25)**

**This file is a DRAFT proposed for review. Do not use as guidance until approved.**

This file defines local guardrails for AI agents working in `bf6-portal/dev/helis-only`. It is intentionally a leaner version of [conquest/AGENTS.md](../conquest/AGENTS.md) — Helis is a smaller, simpler project, and the policies should reflect that without copying Conquest's full ceremony.

Items marked **(ported from Conquest)** apply identically because the underlying engine constraints are the same.
Items marked **(Helis-specific)** differ from Conquest.
Items marked **(deferred)** are present in Conquest but explicitly not adopted yet for Helis — listed so future agents know the precedent exists.

---

## Required Skills

When working in this folder, prefer these skills when available:

- `bf6-portal-mode-creator`
- `bf6-core-reference`

Use `bf6-portal-assistant` when requested or when troubleshooting / explaining behavior.

(Mirrors Conquest convention — confirm with the user whether these skills should be made the default for this folder.)

---

## Reference Sources

**Primary design and product documentation (Helis-only):**
- [`./design_doc/heli_features.md`](./design_doc/heli_features.md) — canonical file/function/state reference.
- [`./design_doc/heli_issues_design.md`](./design_doc/heli_issues_design.md) — known risks + bug inventory + Conquest port candidates.
- [`./design_doc/heli_v_conquest_comp.md`](./design_doc/heli_v_conquest_comp.md) — comparison with Conquest.
- [`./design_doc/heli_improvement_plan.md`](./design_doc/heli_improvement_plan.md) — effort × value action plan.

**Cross-reference to Conquest** (for ported patterns and bug history):
- [`../conquest/AGENTS.md`](../conquest/AGENTS.md) — many policies below were ported from here verbatim.
- [`../conquest/design_doc/conquest_issues_summary.md`](../conquest/design_doc/conquest_issues_summary.md) — Conquest bug history. Cite a `CQ #N` when porting a fix.

**Primary API source of truth** (valid symbols and signatures):
- `../reference_bf6_core` (shared with Conquest)

**Supporting context** (only when the user explicitly references it):
- `../reference_bf6_portal*/`
- `./reference_*` (none currently exist — left here for future)

---

## API Validity Rules (ported from Conquest)

1. Validate every `mod.*` and `modlib.*` symbol against local files in `../reference_bf6_core`.
2. Do not present unverified symbols as valid API calls.
3. If a symbol is missing, mark it as unverified and propose a verified alternative when possible.
4. Prefer exact symbol names and signatures from the local reference files.

---

## Banned / Risky Patterns (ported from Conquest)

These are confirmed broken or unreliable per Conquest's bug history. Helis inherits the same engine constraints.

### `mod.AddUIIcon` is non-functional
1. `mod.AddUIIcon()` accepts arguments and completes without error, but produces NO visible output on any parent type.
2. Conquest exhaustively tested this in v1.047–v1.059. Never rendered.
3. Do NOT use `mod.AddUIIcon` or `mod.RemoveUIIcon` for world-space icons in Helis.
4. Instead, use per-player spawned WorldIcon clones via `mod.SpawnObject(RuntimeSpawn_Common.WorldIcon, ...)` with `SetWorldIconOwner(icon, player)`.
5. Spawned WorldIcons start with image/text DISABLED — call `EnableWorldIconImage(icon, true)` + `EnableWorldIconText(icon, true)` after configuration.
6. **Helis is currently clean of `mod.AddUIIcon`** (confirmed by source scan 2026-05-25).

### `mod.Message` string-key requirement
1. `mod.Message()` does NOT accept arbitrary literal strings. Passing a literal like `mod.Message("hello")` produces "unknown string" at runtime.
2. All text passed to `mod.Message()` must use registered keys from [`src/strings.json`](./src/strings.json) accessed via `mod.stringkeys.*`.
3. For dynamic values, use a format pattern key in `strings.json` (e.g. `"{0}"`) and pass the value as a format argument: `mod.Message(mod.stringkeys.twl.hud.clock.digit, 4)`.
4. Format arguments accept `string | number | Player` only. Do not pass nested `mod.Message()` objects as arguments.
5. **Helis is currently clean** — every `mod.Message` call uses a `STR_*` const or `mod.stringkeys.twl.*` key (confirmed 2026-05-25).

### Player teleport + ForcePlayerToSeat is banned
1. The pattern `mod.Teleport(player, ...)` followed by `mod.ForcePlayerToSeat(...)` broke twice in Conquest (v1.106-v1.108 and v1.151-v1.154). Do not introduce.
2. Vehicle-only teleport (`mod.Teleport(vehicle, ...)`) is OK and is used in Helis at [src/vehicles.ts:452-454](src/vehicles.ts#L452) (spawn-yaw enforcement) and [src/ready-dialog.ts](src/ready-dialog.ts) (soft-ceiling pushback). These are not the banned pattern.
3. **Helis is currently clean of `mod.ForcePlayerToSeat`** (confirmed 2026-05-25).

### Non-ASCII characters are banned in `dist/bundle.ts`
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
3. **Guardrail**: `scripts/postbuild.js` step 11.5 hard-fails the build with `process.exit(1)` if any non-ASCII byte survives. This catches regressions at build time.
4. **Where the constraint applies**:
   - All source TypeScript files (`src/**/*.ts`) for CODE and INLINE comments.
   - Full-line `// ...` comments are stripped at postbuild step 9 (so em-dashes there don't reach the bundle), but writing pure-ASCII even in line comments is defense-in-depth.
5. **Where it does NOT apply**:
   - `src/strings.json` — player-facing strings can contain any Unicode the engine supports.
6. **Helis current state**: `// Module: foo — bar` headers in ~12 files contain em-dashes. Postbuild step 4 strips these lines before the guardrail runs, so they're safe today. **A regression to step 4 would expose all of them.** Improvement plan item A4 proposes replacing the em-dashes with `--` as defense-in-depth.

### `console.log` and the world log are NOT reliable diagnostic surfaces
1. **World log** (`mod.DisplayHighlightedWorldLogMessage`, the script-side `sendHighlightedWorldLogMessage` wrapper) holds at most 4 lines at once and silently fires inconsistently under load. It is for **player-facing gameplay messages only**, not for surfacing diagnostic state.
2. **`console.log`** is unreliable — not confirmed to surface to any visible console in the BF6 Portal runtime.
3. **Helis is currently clean of `console.log`** (confirmed 2026-05-25).
4. **Reliable testable surfaces in BF6 Portal**:
   - **Persistent HUD widget overlay**. Render diagnostic state to a `mod.AddUIText` widget owned by a specific pid. Always-visible, durable, per-pid scoped.
   - **`mod.DisplayNotificationMessage(message, player)`**. Per-player notification; more reliable than world log. Verify durability empirically before relying for repeated probes.
   - **Implicit verification via downstream behavior**. Pure-plumbing changes can defer SP smoke to the next ship that consumes the new state.
   - **Type system + bundle build**. `npx tsc --noEmit` and `npm run bumpVersion` catch shape errors but not runtime correctness.
5. **`FEATURE_PERF_DIAG` is not present in Helis** (Helis has no `FEATURE_*` flags). When proposing diagnostic instrumentation, use the persistent HUD overlay pattern or the telemetry framework in [`heli_improvement_plan.md`](./design_doc/heli_improvement_plan.md) item B5.

---

## String Change Authorization Policy (ported from Conquest)

1. Any player-facing string edit requires explicit human approval before making the change.
2. This includes [`src/strings.json`](./src/strings.json), string-key definitions/usages, and hardcoded UI/world-log text labels.
3. If approval is not explicitly given, do not edit strings; provide proposed string diffs for review only.
4. Approval scope is request-specific; additional unapproved string edits require a new approval.
5. In outputs, identify string files changed and reference the approving user instruction.

---

## Function Comment Readability Policy (ported from Conquest)

1. Every newly added function must have a basic comment directly above it.
2. Comment must state purpose and any key/critical behavior or constraint needed for safe maintenance.
3. For transactional / authority-sensitive functions, include concise notes about ordering, guards, and side effects.
4. When modifying existing functions substantially, add or update comments if current comments are missing or stale.
5. When removing or refactoring code, update nearby comments so they remain accurate.
6. Function names must describe the end-goal behavior clearly (not temporary / mechanical naming).

---

## Comment Bundle-Stripping Behavior (ported from Conquest)

`scripts/postbuild.js` strips comments from the emitted bundle to preserve headroom. Source files are unchanged — these rules describe what survives into `dist/bundle.ts`:

1. **Standalone line comments** (`^[ \t]*// ...`) — STRIPPED at step 9.
2. **Standalone block comments** (`^[ \t]*/* ... */` on its own line(s)) — STRIPPED at step 10.
3. **Inline trailing comments** (`const x = 5; // note`) — SURVIVE. The line-comment regex requires `/` at line start.
4. **Inline block comments** (`code /* note */ code`) — SURVIVE. The block-comment regex requires `/*` at line start AND `*/` at line end.
5. **TypeScript directive comments** (`// @ts-nocheck`, `// @ts-ignore`, `// @ts-expect-error`) — SURVIVE. Negative lookahead in the strip regex preserves them.

Implications for authoring:
- Use JSDoc and section headers freely in source — they cost zero bundle bytes.
- Inline trailing comments DO cost bundle bytes; reserve them for genuinely useful pointers.
- Don't write critical structural info as an inline trailing comment expecting it to vanish — it doesn't.

### Header re-injection (postbuild step 13)

After the comment-strip pass, postbuild re-injects the full [`src/header-file.ts`](src/header-file.ts) content at the very top of `dist/bundle.ts` (versioning + license + attribution). This keeps the legal/credit block visible in the shipped bundle even though all `//` lines were stripped from the body.

(Note: Helis does NOT currently register a `// *<keyword>` strip-from-bundle marker as Conquest does. Source-only project conventions are documented elsewhere instead.)

---

## Code Placement and Structure Policy (Helis-specific)

Helis is a small project (~16k LOC, 19 flat files). The structure policy is intentionally lighter than Conquest's:

1. Place new code in the file whose responsibility most closely matches.
2. **Do not** introduce subfolders speculatively. If a file grows beyond ~3,000 lines AND the contents have clearly separable concerns, propose a split via a plan-mode file rather than acting unilaterally.
3. **Do not** copy Conquest's `src/` subfolder structure wholesale. The Conquest layout reflects 6+ optimization waves; Helis hasn't earned that complexity yet.
4. The two megaliths today are [src/hud.ts](src/hud.ts) (2,878 lines) and [src/ready-dialog.ts](src/ready-dialog.ts) (4,302 lines). Splitting either is tracked as a deliberate plan item — see [improvement plan C1 / C2](./design_doc/heli_improvement_plan.md).

---

## Change Log and Versioning Policy (ported from Conquest)

1. Every implemented code change must include a matching [`src/Changelog.ts`](src/Changelog.ts) entry.
2. Use the existing bump-version workflow whenever a new change is landed:
   - Script path: `./scripts/bump-version.js`
   - Package script: `npm run bumpVersion`
   - Preferred usage: `npm run bumpVersion -- -c "brief changelog entry"`
3. **Always use the bumpVersion script** — never hand-edit version strings across the 4 files ([header-file.ts](src/header-file.ts), [footer-file.ts](src/footer-file.ts), [strings.json](src/strings.json) branding title, [package.json](package.json)). This mirrors the Conquest convention.
4. Do not defer changelog/version updates to later cleanup; update them in the same change set.
5. Immediately after `npm run bumpVersion`, run compile verification before handoff:
   - `npm run build`
   - `cmd /c npx tsc --pretty false --noEmit`
6. Treat any compile error from that post-bump verification as blocking; fix before finalizing.

---

## Bundle Size Limit Policy (ported from Conquest)

1. Battlefield Portal script upload has a hard size limit for emitted script files (1 MiB = 1,048,576 bytes).
2. Treat `dist/bundle.ts` size as blocking when it exceeds 1,048,576 bytes.
3. `scripts/verify.js` enforces this cap and fails verification when exceeded.
4. Before handoff, always run verification and confirm the bundle size check passes.
5. For every implemented code change, report:
   - Current emitted `dist/bundle.ts` size.
   - Bytes remaining below the 1,048,576 byte cap.
   - Direction versus the prior reported implementation (`up` / `down` / `flat`).
6. Use the size data from the post-`bumpVersion` build/verify output as the source of truth; do not estimate or omit it.

**Current headroom** (as of v0.630): ~548,000 bytes free. Helis has substantially more headroom than Conquest (~200k); the per-change pressure to optimize is lower than Conquest's.

---

## Execution Workflow

1. Start from [`./design_doc/heli_features.md`](./design_doc/heli_features.md) to understand the project shape.
2. Cross-reference [`./design_doc/heli_issues_design.md`](./design_doc/heli_issues_design.md) for known bugs/risks in the area you're touching.
3. Validate every planned API call via `../reference_bf6_core/00-api-reference-index.md`.
4. Locate specific symbol docs via `../reference_bf6_core/mod/00-api-index.md` or `../reference_bf6_core/modlib/00-api-index.md`.
5. Open exact symbol files before writing or changing code.
6. **Obtain explicit human approval before any player-facing string edits.**
7. Implement original code using only verified APIs.
8. In outputs, cite local reference file path(s) used for design decisions and API validation.
9. Once completed, present a test plan to be used by a human to confirm the implementation quality. Professional, robust, but succinct.
10. For every code change, include changelog/version updates per the Change Log policy before finalizing.

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

1. **First action of every plan: read `AGENTS.md`.** The planner must load this file's rules into context before drafting any plan, so banned patterns and policies are reflected. The first explicit step of any plan file should be: *"Read [`AGENTS.md`](./AGENTS.md) and [`design_doc/heli_features.md`](./design_doc/heli_features.md) (plus [`heli_issues_design.md`](./design_doc/heli_issues_design.md) for the affected area)."*
2. **Plans are historical references.** Every approved plan must be saved as a permanent file in [`./design_doc/`](./design_doc/) for future agents/humans to reference. Plan-mode's transient file at `~/.claude/plans/<name>.md` is ephemeral; a copy must be persisted to the repo.
3. **Naming convention**: `design_doc/<MM.DD.YY>_heli_<topic>_plan.md` — date front-loaded so files sort chronologically. Examples: `5.25.26_heli_ready_persistence_plan.md`, `6.01.26_heli_telemetry_plan.md`.
4. **Plan structure**:
   - Start with a `## Context` section explaining why the change is being made.
   - List critical files to be modified (or files referenced for read-only context).
   - Reference existing functions/utilities to be reused, with their file paths.
   - Include a verification section describing how to test end-to-end.
   - If the plan implements an item from [`heli_improvement_plan.md`](./design_doc/heli_improvement_plan.md), reference the item ID (e.g., "implements item B1").
5. **One plan per coherent change set.** A single feature design is one plan file. Do not bundle unrelated changes.
6. **Plans persist regardless of outcome.** If the plan ships and works, it stays as a record. If abandoned or superseded, it stays with a header note marking the status (e.g., `*Status: Abandoned 2026-06-01 — superseded by …*`).
7. **A plan file existing is NOT approval to apply it.** Wait for explicit go-ahead from the user before executing. (This is the same convention Conquest uses; ported from Conquest memory `feedback_plans_are_not_instructions_to_execute`.)

---

## New Chat Startup Checklist

1. Confirm this file (`AGENTS.md`) is loaded and being followed.
2. Confirm primary doc source: [`./design_doc/heli_features.md`](./design_doc/heli_features.md).
3. Confirm API source: `../reference_bf6_core`.
4. Confirm cross-reference: [`./design_doc/heli_issues_design.md`](./design_doc/heli_issues_design.md) for known bugs/risks.
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

## IDE Link Policy (ported from Conquest)

1. Local file references in responses should be IDE-openable paths, not browser URLs.
2. Use markdown links with relative paths from the workspace root: `[src/clock.ts](src/clock.ts)` or `[src/clock.ts:42](src/clock.ts#L42)`.
3. Include line numbers when relevant.
4. Link labels must include the project-relative folder path (for example `src/state.ts`), not just a bare filename like `state.ts`.

---

## BEFORE CODING:

1. Confirm you loaded `AGENTS.md`.
2. Confirm you will use [`./design_doc/heli_features.md`](./design_doc/heli_features.md) as primary file/function reference.
3. Confirm you cross-referenced [`./design_doc/heli_issues_design.md`](./design_doc/heli_issues_design.md) for the area you're touching.
4. Confirm you will use `../reference_bf6_core` as API source of truth and validate every `mod.*` / `modlib.*` symbol.
5. Confirm you will create and maintain a task list with statuses (`pending`, `in_progress`, `completed`) before implementation starts.

## AFTER CODING:

- Ensure the [Changelog](src/Changelog.ts) is updated and version is bumped via `npm run bumpVersion -- -c "brief entry"`.
- Run `npm run build` then `cmd /c npx tsc --pretty false --noEmit`.
- Report bundle size delta in the handoff.

---

## Items Deferred from Conquest (not yet adopted in Helis)

These are policies / patterns that exist in Conquest but are not yet enforced in Helis. They are documented here so future agents see the precedent.

| Conquest item | Why deferred for Helis |
|---|---|
| **Combat HUD Dirty-Flag Contract** | Helis has no combat HUD. A scoped version (kills/victory dialog dirty-flag) is proposed as [improvement plan item B3](./design_doc/heli_improvement_plan.md). Don't enforce until B3 ships. |
| **Codebase Reference Map Maintenance Policy** | Helis's `heli_features.md` is the equivalent of `conquest_optimization_state.md` + `conquest_optimization_analysis.md`. Update after `bumpVersion` if structure changes — see Section 10 of `heli_features.md`. |
| **UI Layout Change Protocol** | Helis has no parallel-frame UI lanes problem yet. Adopt only if/when a layout change goes wrong. |
| **Lazy-build dispatcher / `triggerLazyBuild` policy** | Helis builds eagerly. Not yet a problem at current player counts. See [improvement plan item D2](./design_doc/heli_improvement_plan.md). |
| **`FEATURE_PERF_DIAG`** | Helis has no `FEATURE_*` flag machinery. If telemetry per [improvement plan item B5](./design_doc/heli_improvement_plan.md) lands, add a single `ENABLE_TELEMETRY` flag at that time. |
| **Comment strip marker `// *<keyword>`** | Helis does not currently use the marker. Add only if a source-only convention needs special bundle handling. |
