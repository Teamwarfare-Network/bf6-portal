# Developer Guide — TWL Helis Only (Modular Build)

This is a competitive helicopter game mode for BF6 Portal. The code is split into 13 TypeScript modules that get bundled into a single script for upload. This guide will get you from zero to making changes and testing them in Portal.

## Prerequisites

You need Git, Node.js, and VS Code. If you already have them, skip to **Getting the Code**.

### Windows

1. Install **Git** from https://git-scm.com/downloads/win — click **Next** through every screen, the defaults are fine.
2. Install **Node.js** from https://nodejs.org/ — download the **LTS** version (big green button on the left). Defaults are fine.
3. Install **VS Code** from https://code.visualstudio.com/ if you don't have it already.

### Linux

Git and Node.js are available through your package manager.

**Ubuntu / Debian:**

```
sudo apt update && sudo apt install git nodejs npm
```

**Fedora:**

```
sudo dnf install git nodejs npm
```

**Arch:**

```
sudo pacman -S git nodejs npm
```

If your distro ships an older Node.js (below v18), install a current LTS version via [nvm](https://github.com/nvm-sh/nvm) instead.

Install **VS Code** from https://code.visualstudio.com/ or through your distro's package manager.

## Getting the Code

1. Open **VS Code**.
2. Pick a folder where you want to work. Your **Documents** folder or **Desktop** are fine. Remember where you put it.
3. Open a terminal inside VS Code: click **Terminal** in the top menu bar, then **New Terminal**. A panel will open at the bottom.
4. In the terminal, navigate to the folder you picked. For example, if you chose your Documents folder:

```
cd ~/Documents
```

5. Clone the repository:

```
git clone https://github.com/Teamwarfare-Network/bf6-portal.git
```

6. Switch to the development branch:

```
cd bf6-portal
git checkout feature/modular-build-pipeline
```

7. Install the build tools:

```
cd dev/helis-only
npm install
```

8. Now open the project in VS Code so you can see all the files: click **File > Open Folder**, navigate to the `bf6-portal` folder you just cloned, and click **Select Folder**.

You're ready to go.

## Project Layout

All the source code lives in `dev/helis-only/src/`:

| File | What it does |
|---|---|
| `index.ts` | Entry point — imports all modules, contains the exported Portal event handlers |
| `types.ts` | Enums, interfaces, and type definitions |
| `config.ts` | Map configs, constants, tuning values |
| `strings.ts` | String key constants for UI messages |
| `state.ts` | Global mutable state (`State.*`) |
| `hud.ts` | HUD widget creation, updates, and per-player caching |
| `vehicles.ts` | Vehicle registration, spawner system, scoring |
| `overtime.ts` | Overtime flag/zone logic |
| `clock.ts` | Round clock, countdown timer |
| `team-switch.ts` | Team-switch interact point and UI |
| `round-flow.ts` | Round start/end, pregame ready-up, match flow |
| `ready-dialog.ts` | Ready-up dialog, join prompt, aircraft ceiling |
| `utils.ts` | Shared helper functions |

`strings.json` contains the Portal string keys (merged into `bundle.strings.json` at build time).

## Making Changes

1. In VS Code, open any file in `dev/helis-only/src/` and make your edits.

2. Open the VS Code terminal (**Terminal > New Terminal** if you closed it) and make sure you're in the right folder:

```
cd dev/helis-only
```

3. Build the bundle:

```
npm run build
```

This produces two files in `dist/`:
- **`bundle.ts`** — the experience script (all 13 modules concatenated)
- **`bundle.strings.json`** — the strings file

4. Upload both files to your Portal experience and test.

5. Repeat — edit, build, upload, test.

### Things to know

- The `mod.*` namespace (e.g. `mod.Wait`, `mod.AllPlayers`) is injected by the Portal runtime. It won't exist locally — that's normal.
- `modlib` is a Portal utility library (also runtime-injected). The build will show a warning about it — that's expected.
- Each module has `// @ts-nocheck` at the top because cross-module references can't resolve individually. This is by design.
- The bundler only concatenates files — it does not compile or type-check TypeScript.

## Sharing Your Changes

When your changes are working and you want to share them with the team:

```
git add -A
git commit -m "Short description of what you changed"
git push
```

If this is your first push, Git may ask you to run:

```
git push --set-upstream origin feature/modular-build-pipeline
```

## Getting Other People's Changes

To pull in changes that others have pushed, open the VS Code terminal and run:

```
cd bf6-portal
git pull
```

Then rebuild:

```
cd dev/helis-only
npm run build
```

The updated `dist/` files are ready to upload.

## If Something Goes Wrong

**Build fails:** Make sure you ran `npm install` in the `dev/helis-only` folder. If it still fails, delete the `node_modules` folder and run `npm install` again.

**Git conflicts or errors:** The simplest fix is to start fresh. Delete the `bf6-portal` folder from your computer and redo the **Getting the Code** steps.

**Portal rejects the upload:** Make sure you're uploading `dist/bundle.ts` (not a file from `src/`) and `dist/bundle.strings.json`.
