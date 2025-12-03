# Contributing to TWL BF6 Portal Experiences

This guide explains how to contribute new experiences or modify existing ones for TWL's Battlefield 6 Portal ladders.

## Prerequisites

1. **GitHub Access**: You must be added as a collaborator to this repository. Contact a TWL admin if you need access.
2. **EA Account**: Signed into [portal.battlefield.com/bf6](https://portal.battlefield.com/bf6)
3. **BF6 Portal SDK** (optional): Only needed if doing spatial/map edits

## Workflow Overview

```
draft → testing → approved
  │        │          │
  │        │          └── Ready for ladder play
  │        └── Playtesting in progress
  └── Work in progress
```

All work happens on **feature branches**. The `main` branch is protected and requires pull request review.

---

## Adding a New Experience

### Step 1: Create a Feature Branch

```bash
git checkout main
git pull origin main
git checkout -b add/experience-name
```

Branch naming convention: `add/short-description` (e.g., `add/conquest-10v10`)

### Step 2: Create the Experience Folder

Create a folder under the appropriate ladder slug:

```
experiences/
└── {ladder-slug}/           # e.g., bf6-2v2-tanks, bf6-4v4-vehicles
    └── {experience-name}/   # e.g., armored-warfare-rotation
        ├── logic.json
        ├── spatial/
        │   └── {map-name}.spatial.json
        ├── metadata.json
        └── CHANGELOG.md
```

**Ladder slugs** must match the URL path on teamwarfare.net:
- `https://teamwarfare.net/ladders/bf6-2v2-tanks` → `bf6-2v2-tanks`
- `https://teamwarfare.net/ladders/bf6-4v4-vehicles` → `bf6-4v4-vehicles`

### Step 3: Export and Add Your Files

#### Logic JSON (Rules Editor)

1. Open your experience in [Portal Builder](https://portal.battlefield.com/bf6)
2. Go to **Rules Editor** tab
3. Click **Export to Script** (if using blocks) or copy the script
4. For the full experience config, use browser dev tools:
   - Open Network tab
   - Save your experience
   - Find the PUT/POST request to the experiences API
   - Copy the JSON payload
5. Save as `logic.json` in your experience folder

#### Spatial JSON (Map Edits)

1. In Godot with Portal SDK loaded, after making map edits
2. Click **BFPortal** tab → **Export Current Level**
3. Click **Open Exports** to find the `.spatial.json` file
4. Copy to `spatial/{map-name}.spatial.json`

If your experience uses multiple maps with spatial edits, include one file per map.

### Step 4: Create metadata.json

```json
{
  "name": "Armored Warfare - 3 Map Rotation",
  "description": "First to 11 kills, 15 minute rounds, rotating between Defense Nexus, Manhattan Bridge, and Mirak Valley",
  "ladder": "bf6-2v2-tanks",
  "ladderUrl": "https://teamwarfare.net/ladders/bf6-2v2-tanks",
  "status": "draft",
  "experienceCode": null,
  "portalUrl": null,
  "version": "0.1.0",
  "authors": ["uberdubersoldat"],
  "maps": [
    {
      "name": "Defense Nexus",
      "internalName": "MP_DefenseNexus",
      "hasSpatialEdit": true
    },
    {
      "name": "Manhattan Bridge", 
      "internalName": "MP_ManhattanBridge",
      "hasSpatialEdit": true
    },
    {
      "name": "Mirak Valley",
      "internalName": "MP_MirakValley", 
      "hasSpatialEdit": true
    }
  ],
  "settings": {
    "maxPlayers": 12,
    "scoreLimit": 11,
    "timeLimit": 15
  },
  "created": "2025-12-01",
  "lastUpdated": "2025-12-01"
}
```

#### Status Values

| Status | When to Use |
|--------|-------------|
| `draft` | Initial development, not ready for others to test |
| `testing` | Published to Portal, ready for playtesting feedback |
| `approved` | Verified working, approved for official ladder matches |

#### Experience Code

- Set to `null` while in `draft` status
- Update with the code (e.g., `"zfvxv"`) once published to Portal
- Also update `portalUrl` to the Portal Builder URL for the experience

### Step 5: Create CHANGELOG.md

```markdown
# Changelog

All notable changes to this experience.

## [0.1.0] - 2025-12-01

### Added
- Initial release
- Defense Nexus, Manhattan Bridge, Mirak Valley map support
- Vehicle registration system
- Score tracking (first to 11)
- 15 minute time limit per round
```

### Step 6: Commit and Push

```bash
git add .
git commit -m "Add: Armored Warfare 3-map rotation for bf6-2v2-tanks"
git push origin add/experience-name
```

### Step 7: Open a Pull Request

1. Go to the repository on GitHub
2. Click "Compare & pull request"
3. Fill in the PR template with:
   - What the experience does
   - Which ladder it's for
   - Current status (draft/testing/approved)
   - Any known issues
4. Request review from another contributor

---

## Modifying an Existing Experience

### Step 1: Create a Feature Branch

```bash
git checkout main
git pull origin main
git checkout -b fix/experience-name-description
```

Branch naming:
- `fix/` for bug fixes
- `update/` for feature additions
- `refactor/` for reorganization without functionality changes

### Step 2: Make Your Changes

1. Update the relevant JSON files
2. Update `metadata.json`:
   - Increment the `version` (use [semver](https://semver.org/))
   - Update `lastUpdated` date
   - Change `status` if needed (e.g., back to `testing` if significant changes)
3. Add entry to `CHANGELOG.md`

### Step 3: Sync Changes to Portal

After merging, the experience owner should:
1. Upload updated files to Portal Builder
2. Save/republish the experience
3. Verify the Experience Code is still valid (or update if it changed)
4. Update `metadata.json` with any new codes

### Step 4: Commit, Push, PR

Same as adding a new experience.

---

## Status Transitions

```
draft ──publish──▶ testing ──verify──▶ approved
                       │                   │
                       │    ◀──issues──────┘
                       │
                       └──issues──▶ draft
```

- **draft → testing**: When published to Portal and ready for playtesting
- **testing → approved**: After successful playtests with no blocking issues
- **approved → testing**: When making changes that need re-verification
- **testing → draft**: When major issues require significant rework

---

## File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Experience folder | `kebab-case` | `armored-warfare-rotation` |
| Logic file | `logic.json` | `logic.json` |
| Spatial files | `{map-name}.spatial.json` | `defense-nexus.spatial.json` |
| Metadata | `metadata.json` | `metadata.json` |
| Changelog | `CHANGELOG.md` | `CHANGELOG.md` |

---

## Questions?

- **Discord**: Ask in `#battlefield-6-portal` on the TWL Discord
- **GitHub Issues**: Open an issue for bugs or feature requests
