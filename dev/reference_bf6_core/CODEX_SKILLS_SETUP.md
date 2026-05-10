# BF6 Codex Skills Setup

## Purpose

Document how to configure local Codex skills so BF6 API usage is validated against this repository's reference folders.

## Required Skills

Create these three skills under your local Codex skills directory:

- `bf6-core-reference`
- `bf6-portal-assistant`
- `bf6-portal-mode-creator`

Default local skill directory:

- Windows: `%USERPROFILE%/.codex/skills`

## Reference Folder Mapping

- `bf6-core-reference` -> `<repo-root>/bf6-portal/dev/reference_bf6_core`
- `bf6-portal-assistant` + `bf6-portal-mode-creator` -> `<repo-root>/bf6-portal/dev/reference_bf6_portal*/`

`<repo-root>` is where this repo is checked out on the current machine.

## Setup Steps

1. Create the three skill folders in `%USERPROFILE%/.codex/skills/`.
2. Add a `SKILL.md` in each folder with the same skill names listed above.
3. In each `SKILL.md`, set reference paths to your local `<repo-root>` absolute path.
4. Enforce API validation behavior in each skill: verify every `mod.*` or `modlib.*` symbol against files in `reference_bf6_core`, do not present unverified symbols as valid API calls, and cite exact local reference files used.

## API Source of Truth

For symbol validation, use:

- `reference_bf6_core/00-api-reference-index.md`
- `reference_bf6_core/mod/00-api-index.md`
- `reference_bf6_core/modlib/00-api-index.md`
- category folders under `reference_bf6_core/mod` and `reference_bf6_core/modlib`

## Optional Bootstrap Command

If `skill-creator` is installed locally, scaffold skills with:

```powershell
$base = "$env:USERPROFILE/.codex/skills"
$creator = "$env:USERPROFILE/.codex/skills/.system/skill-creator/scripts"

python "$creator/init_skill.py" bf6-core-reference --path $base
python "$creator/init_skill.py" bf6-portal-assistant --path $base
python "$creator/init_skill.py" bf6-portal-mode-creator --path $base
```

Then replace template `SKILL.md` files with the configured BF6 versions.
