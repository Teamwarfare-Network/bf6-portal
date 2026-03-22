# Conquest Audit Brief v0.725 | 2026-03-19

Stable audit brief and context anchor for future deep review of the Conquest codebase as understood on 2026-03-19.

This document is not the audit itself. It defines when the audit should be run, what baseline it should use, what questions it must answer, and what output format it should follow so future review work stays consistent even after context-window resets or implementation churn.

## Purpose

Use this brief when returning to the Conquest codebase after a gap, after context has been dropped, or before any broad cleanup / reorganization pass that needs a grounded understanding of current ownership and risk.

The goal is to produce one deep audit that is:

1. anchored to an explicit baseline
2. broad enough to cover the whole active `src` surface
3. structured enough to stay useful during later refactors
4. explicit enough that future audit work does not drift in quality or scope

## Audit Baseline

Unless a later baseline is explicitly locked first, the audit should treat the following as the reference perspective:

- Date perspective: `2026-03-19`
- Repo root: `bf6-portal`
- Mode root: `dev/conquest`
- Primary code surface: `dev/conquest/src`
- Baseline branch snapshot: `feature/conquest_attempt_b`
- Baseline commit snapshot: `35f3d24e4272f9b72636bd9d46267bb6fd4423d7`
- Baseline working-tree bundle version: `v0.725`
- Working-tree note: this perspective may include local Conquest changes beyond `HEAD`; the bundle version is the authoritative snapshot tag for audit naming when that occurs
- Current `src` file count at this perspective: `114`
- Primary design reference: `dev/conquest/design_doc/TWL_Conquest_Design.md`

If a future audit is run against a newer code state, this document should be updated first with the new branch, commit or working-tree state, bundle version, and date perspective rather than silently reusing the `v0.725 | 2026-03-19` framing.

## Audit Trigger

Do not run the full audit while active structural cleanup is still landing without first locking the target baseline.

The audit may be run in either of these cases:

1. The March 19 baseline above is intentionally being audited as a frozen historical checkpoint.
2. A newer branch / commit has been intentionally nominated as the new audit baseline and this brief has been updated to reflect that.

If the codebase is in motion, the audit should begin by naming exactly what commit is being audited and whether the review is:

- historical snapshot review
- current-branch review
- pre-refactor review
- post-refactor validation review

## Scope

### Mandatory Scope

1. Full file inventory and analysis for each active file under `dev/conquest/src`.
2. Architecture mapping across the active runtime, UI, state, interaction, and vehicle systems.
3. Ownership review:
   - does each file own what its name claims
   - are boundaries clear
   - where is ownership duplicated, blurred, or stale
4. Weak-point review:
   - fragile logic
   - dead or clunky paths
   - likely bug sources
   - high-risk lifecycle behavior
5. Feature inventory:
   - what features exist now
   - how they work now
   - what files own them now
6. Human test planning:
   - one-human checklist
   - two-human / MP checklist
7. Prioritized follow-up plan:
   - what should be fixed first
   - what can wait
   - what should not be touched casually

### Optional Scope

Only include these if explicitly requested for that audit run:

1. Code-size reduction opportunities.
2. Historical evolution / commit archaeology.
3. Broad naming-pass cleanup recommendations beyond real ownership issues.

## Evaluation Rubric

When the audit asks whether a file or architecture element is "correct," evaluate it using these questions:

1. Runtime correctness:
   - does the code plausibly behave as intended
   - are obvious bug paths or unsafe assumptions present
2. Ownership correctness:
   - does the file own one coherent responsibility
   - is logic placed where a future maintainer would expect it
3. Design consistency:
   - does the implementation match the current accepted Conquest design intent
   - if not, is the divergence intentional, stale, or unclear
4. Maintenance quality:
   - are naming, comments, and module boundaries helping or hurting future work
5. Cleanup value:
   - can a simplification be made safely
   - would a split / merge / rename reduce ambiguity or just create churn

When code and design disagree, do not silently normalize the difference. Record the mismatch explicitly.

## Required Output Structure

Every full audit should produce these sections in this order:

1. Executive summary
2. Architecture map
3. File inventory matrix
4. File-by-file review
5. Top risks
6. Cleanup / reorganization recommendations
7. Optional code-size reduction opportunities
8. Prioritized follow-up plan
9. Human test plan
10. Open questions / assumptions

If optional code-size analysis was not requested, keep the heading but state that it was intentionally excluded for that run.

## Suggested Templates

### Template A: File Inventory Matrix

Use one row or compact block per file:

- File
- Primary ownership
- Secondary touchpoints
- Status: active / mixed / legacy-shadow / likely dead
- Confidence: high / medium / low

This section should let a reader scan the entire `src` surface quickly before reading the deep review.

### Template B: File-by-File Review Record

Use this as the default per-file review shape:

- File:
- Current stated responsibility:
- Actual owned behavior:
- Correctness verdict: correct / mostly correct / mixed / incorrect
- Ownership fit: tight / acceptable / blurred / wrong
- Key problems:
- Dead or stale paths:
- Duplication / overlap:
- Comments / naming issues:
- Split / merge / rename recommendation:
- Suggested follow-up:
- Risk level: low / medium / high
- Confidence: high / medium / low

### Template C: Architecture Review Record

Use one block per subsystem or major interaction boundary:

- Area:
- Primary files:
- Inputs:
- Outputs:
- State owned:
- UI owned:
- Lifecycle entry points:
- Known coupling points:
- Boundary quality:
- Main problems:
- Recommended correction:

Suggested subsystem slices:

- startup / bootstrap
- ready-dialog
- player interaction
- runtime state
- top HUD
- vehicle HUD
- deploy / spawn fulfillment
- admin-panel
- map / config runtime

### Template D: Risk Record

Use this for the top-risk section:

- Risk:
- Category: performance / crash / unstable UI-lifecycle / architecture
- Trigger path:
- Why it is plausible:
- Likely visible effect:
- Severity:
- Confidence:
- Recommended next action:

### Template E: Feature-to-Test Record

Use one block per feature or feature family:

- Feature:
- Owner files:
- How it works:
- Preconditions:
- One-human checks:
- Two-human / MP checks:
- Edge cases:
- Known deferred gaps:

## Guardrails

1. Do not invent APIs, runtime behavior, or hidden design intent.
2. Distinguish active ownership from legacy residue or compatibility bridges.
3. Prefer precise, actionable criticism over vague style complaints.
4. Do not recommend splits, merges, or renames unless the ownership gain is real.
5. Do not recommend code-size reduction if it would reduce clarity, safety, or feature coverage.
6. Separate findings from assumptions.
7. Mark low-confidence claims clearly.

## Acceptance Criteria For The Audit

A full audit should not be considered complete unless:

1. every active file under `dev/conquest/src` is accounted for exactly once
2. the architecture map covers all major runtime and UI ownership areas
3. the top risks are specific and defensible
4. recommendations are prioritized rather than presented as one flat backlog
5. feature inventory and human tests are explicitly connected
6. open questions and uncertainty are separated from confirmed findings

## Intended Use As A Context Anchor

This document exists so future work can resume with less context loss.

When using it later:

1. read this brief first
2. confirm whether the March 19 baseline still applies
3. if not, update the baseline section before starting the audit
4. use the templates above rather than improvising a new review shape midstream

That keeps future audits comparable across sessions and reduces drift caused by fragmented context windows.
