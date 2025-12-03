# TWL Battlefield 6 Portal Experiences

Community-created Battlefield 6 Portal experiences for [TeamWarfare League](https://teamwarfare.net) competitive ladders.

## What This Repo Contains

This repository stores the exported JSON files from BF6 Portal's visual Rules Editor and Spatial Editor, enabling version control and collaboration on TWL's custom competitive experiences.

Each experience consists of:
- **Logic JSON** — Game rules, scoring, restrictions (exported from Rules Editor)
- **Spatial JSON** — Map modifications, spawn points, boundaries (exported from Spatial Editor)
- **Metadata** — Experience codes, version history, status

## Current Experiences

| Experience | Ladder | Status | Experience Code |
|------------|--------|--------|-----------------|
| [Armored Warfare - 3 Map Rotation](./experiences/bf6-2v2-tanks/armored-warfare-rotation/) | [bf6-2v2-tanks](https://teamwarfare.net/ladders/bf6-2v2-tanks) | ✅ Approved | `zfvxv` |
| [Armored Warfare - Manhattan Bridge](./experiences/bf6-2v2-tanks/armored-warfare-manhattan-bridge/) | [bf6-2v2-tanks](https://teamwarfare.net/ladders/bf6-2v2-tanks) | ✅ Approved | `zgzq8` |
| [Armored Warfare - Mirak Valley](./experiences/bf6-2v2-tanks/armored-warfare-mirak-valley/) | [bf6-2v2-tanks](https://teamwarfare.net/ladders/bf6-2v2-tanks) | ✅ Approved | `zgzqa` |
| [Armored Warfare - Defense Nexus](./experiences/bf6-2v2-tanks/armored-warfare-defense-nexus/) | [bf6-2v2-tanks](https://teamwarfare.net/ladders/bf6-2v2-tanks) | ✅ Approved | `zgzqb` |

## Quick Links

- [Contributing Guide](./CONTRIBUTING.md) — How to add or modify experiences
- [Playtesting Guide](./docs/playtesting-guide.md) — Rules for testing Armored Warfare modes
- [TWL BF6 Ladders](https://teamwarfare.net/ladders) — Live competitive ladders

## Repository Structure

```
bf6-portal/
├── experiences/
│   ├── bf6-2v2-tanks/           # Matches ladder URL slug
│   │   ├── armored-warfare-rotation/
│   │   │   ├── logic.json       # Rules Editor export
│   │   │   ├── spatial/         # Spatial JSONs per map
│   │   │   │   ├── defense-nexus.spatial.json
│   │   │   │   ├── manhattan-bridge.spatial.json
│   │   │   │   └── mirak-valley.spatial.json
│   │   │   ├── metadata.json    # Experience code, version, status
│   │   │   └── CHANGELOG.md
│   │   └── ...
│   └── bf6-4v4-vehicles/        # Another ladder
│       └── ...
├── docs/
│   └── playtesting-guide.md
├── CONTRIBUTING.md
└── README.md
```

## Status Definitions

| Status | Meaning |
|--------|---------|
| 🔨 Draft | Work in progress, not ready for testing |
| 🧪 Testing | Ready for playtesting, gathering feedback |
| ✅ Approved | Verified working, approved for ladder play |

## Contributors

This repository is maintained by trusted TWL community members. See [CONTRIBUTING.md](./CONTRIBUTING.md) for how the contribution process works.

## Links

- **TWL Website**: https://teamwarfare.net
- **BF6 Portal Builder**: https://portal.battlefield.com/bf6
- **TWL Discord**: Join `#battlefield-6-portal` for discussion
