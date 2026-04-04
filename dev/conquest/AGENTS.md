# AGENTS: Conquest BF6 Workflow

This file defines local guardrails for AI agents working in `bf6-portal/dev/conquest`.

## Required Skills

Always use these skills for work in this folder:

- `bf6-portal-mode-creator`
- `bf6-core-reference`

Use `bf6-portal-assistant` when requested or when troubleshooting/explaining behavior.

## Reference Sources

Primary design and product documentation:

- `./design_doc/TWL_Conquest_Design.md` (canonical requirements)
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

1. Start from `./design_doc/TWL_Conquest_Design.md` to understand requirements and intended behavior.
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

## New Chat Startup Checklist

1. Confirm this file (`AGENTS.md`) is loaded and being followed.
2. Confirm primary doc source: `./design_doc/TWL_Conquest_Design.md`.
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

1. The authoritative codebase reference map lives in `./design_doc/TWL_Conquest_Design.md` under the "Codebase Reference Map" section.
2. When a major change adds, removes, or renames files or directories under `src/`, update the reference map in the same change set.
3. When a major change adds or removes exported functions in high-traffic files (index/, interaction/, hud/), add a brief note to the relevant file entry.
4. The reference map is a navigation aid, not exhaustive documentation. Keep entries to 1-line descriptions per file and per function.
5. Update the "Project Stats" header (line count, bundle size, version) after every bumpVersion.

## BEFORE CODING:

1. Confirm you loaded `AGENTS.md`.
2. Confirm you will use `./design_doc/TWL_Conquest_Design.md` as primary requirements source.
3. Confirm `./reference_design_documentation` is supporting analysis context (not canonical requirements).
4. Confirm `./reference_design_documentation/archive` is treated as outdated and will only be used if explicitly requested.
5. Confirm you will use `../reference_bf6_core` as API source of truth and validate every `mod.*` / `modlib.*` symbol.
6. Confirm `./reference_implementations` is methodology-only and you will not copy code directly from its subfolders.
7. Confirm you will create and maintain a task list with statuses (`pending`, `in_progress`, `completed`) before implementation starts.

## AFTER CODING:

- Ensure the Changelog is updated and version is bumped via bumpVersion