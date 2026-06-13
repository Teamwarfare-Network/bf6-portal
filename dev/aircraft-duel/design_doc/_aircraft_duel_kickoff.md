# Aircraft-Duel — Kickoff Brief

**Date**: 2026-06-01 — written at the moment of forking from helis-only v0.737.
**Status**: First-doc-of-the-new-mode. Designed to be read by a fresh chat with zero context. Read this BEFORE anything else in `design_doc/`.

**What you inherited**: a working ~20K-LOC BF6 Portal game-mode script that just shipped v0.737. The full codebase was copied from `bf6-portal/dev/helis-only/` minus `node_modules` and minus history (this is fork-by-copy, not a git submodule). Run `npm install` in this folder to regenerate `node_modules` before your first build.

---

## What aircraft-duel is (or could be)

The folder name implies aircraft-focused, duel-style (probably 1v1-emphasized) gameplay. **The actual game design hasn't been decided yet** — the parent codebase shipped 7 game modes (Attack Helis BF6 Vanilla / TWL 2v2 / TWL 1v1, All Helis BF6 Vanilla, Little Birds BF6 Vanilla / TWL 2v2 / TWL 1v1, plus Custom). One of the first decisions for this mode is: which of those rules do you keep, and which do you replace?

Until that decision is made, **the script will start up identical to helis-only v0.737** because every gameplay constant and string still references "Helis Only" / "Attack Helis" / etc. You'll likely want to:

1. Decide the rules direction (see "First decisions" below).
2. Rename game-mode strings + the `package.json` "name" field.
3. Prune game modes you don't want before they accumulate more code.

---

## Load-bearing architecture you inherit (don't accidentally break these)

These patterns are non-negotiable for the engine to work correctly. Future work on aircraft-duel should preserve them.

### 1. Per-pid HUD model

Every UI widget is named `XXX_${pid}` and built per player. There is no shared HUD. The `State.hudCache.hudByPid[pid]` map caches the widget refs after construction so subsequent updates don't re-find them. See `hud-scoring-lazy.ts`, `hud-dialog-lazy.ts`, `ready-dialog.ts`, `overtime.ts` for the build patterns.

### 2. Lazy build via `triggerLazyBuild`

Heavy HUD surfaces (top score banner, victory dialog, round-end dialog) are NOT built on `OnPlayerJoinGame` — they're built on demand when first needed. Triggered via `triggerLazyBuild('topHud', pid)` etc. from event handlers. This exists because building ~670 lines of `ParseUI` synchronously on a concurrent-join tick caused frame-budget crashes in the upstream Conquest project (CQ_Bug_40). Don't reintroduce the dogpile.

### 3. Pending / confirmed mode config (v0.732)

Settings the player tweaks in the Ready Dialog live in two parallel shapes:

- `State.round.modeConfig.X` — pending value, mutated live as the user clicks +/-
- `State.round.modeConfig.confirmed.X` — confirmed value, snapshotted only when the user clicks Confirm

The dirty-state diff (`buildReadyDialogModeConfigDiffState`) computes which fields differ and drives the red/green coloring. Side effects (spawn enable, slot force-spawn, kills target update, auto-start gate) fire only on Confirm. **If you add a new ready-dialog knob, follow this pattern** — see `6.01.26_matchup_players_pending_confirmed_plan.md` in `old_archive/` for the canonical example.

### 4. Viewer-relative team colors (v0.737)

Every team-anchored color (panel BGs, text colors, overtime bar fills) is painted per-viewer so each player sees their own team in blue, enemy in red. The helper is `getViewerOwnTeamColor(pid, sourceTeam, ownColor, enemyColor)` in `state.ts`. Four per-surface fixup functions (`applyViewerTeamColorsFor*PidXxx`) run after each surface builds. Central orchestrator `repaintAllViewerTeamColorsForPid` is called from `processTeamSwitch` so colors flip immediately on swap. **If you add a new team-colored widget, register it in the appropriate fixup.** See `6.01.26_own_team_blue_color_swap_plan.md` in `old_archive/`.

**Layout is NOT viewer-relative.** T1 data still lives on the left, T2 on the right, for everyone. Only colors flip. The full layout flip (H-P3 in `5.27.26_heli_proposed_features.md`) is documented but explicitly deferred — read that doc before considering it.

### 5. Restart-needed indicator (v0.733+)

`State.round.needsRestartForVehicleChange` is a sticky flag: set true on Confirm when matchup/vehicle/HP fields changed, cleared on the Restart button. Drives a red label on the Restart button + a red "HP or Vehicle Change - Restart Needed" notice. **Necessary because Confirm updates spawner config but doesn't despawn live vehicles** — players need a visual cue to refresh the world.

---

## Engine quirks the helis codebase learned the hard way

These apply to aircraft-duel too because it's the same engine.

### Build / packaging

- **Portal sandbox is ASCII-only.** Any non-ASCII byte in `dist/bundle.ts` (em-dash, smart quote, etc.) silently kills script load. There's a postbuild guardrail; don't remove it.
- **The bundler concatenates all `src/*.ts` files** into one `dist/bundle.ts`. Every file has `// @ts-nocheck` at the top because TS can't satisfy both Portal's runtime conventions AND its strict-mode. Type checking happens at the dist bundle level only.
- **`npm run bumpVersion`** updates the version line in `header-file.ts`, `footer-file.ts`, and `strings.json` in one shot. Never hand-edit version strings. Helis-only's `bumpVersion` script doesn't support a `-c` flag (Conquest-only).

### Runtime APIs that misbehave

- **`mod.Message` accepts only string / number / Player args, NOT nested Message objects.** Cap at 3 args. Literal strings produce "unknown string"; must use registered keys from `strings.json` via `mod.stringkeys.*`.
- **`mod.CompareVehicleName` is unreliable** — returns false even for matching vehicles. Classify via the slot-binding cache (`vehicleToSlot[objId]` → `slot.vehicleType` → pure-JS switch).
- **`mod.AddUIIcon` is non-functional** — completes without error but never renders. Use spawned WorldIcon clones with `SetWorldIconOwner` instead.
- **`mod.SetMaxVehicleHeightLimitScale` is observed one-way per session** — once a custom scale has been applied, the engine refuses to revert to vanilla without a server restart. See the ceiling-vanilla-lockout UI for the workaround.
- **`GetSoldierState` throws engine errors for undeployed/dead players** but the error fires BEFORE the JS exception is raised — try/catch can suppress the JS error but the world-log line is already written. Wrappers `safeGetSoldierStateBool` / `Vector` gate on both `isPlayerDeployed` AND `isPlayerAlive` to prevent the gap window.
- **`OnPlayerEnterVehicle` drops events.** `OnPlayerExitVehicle` is reliable. Don't pre-emptively guard the exit side.
- **`mod.IsVehicleOccupied` can return wrong value for some vehicles**. The Restart cleanup teleports empty vehicles to Y=-1000 and damages — but this misses any vehicles that were mid-spawn when cleanup fired. v0.732 made matchup/vehicle changes only fire spawn on Confirm to eliminate that race.
- **`mod.SetCameraTypeForPlayer` (Cameras.Fixed) only takes effect after the player is deployed in-world.**

### Mode predicate gotcha (v0.731)

`isHeliGameMode` was a hardcoded 3-mode list inherited from Conquest's mixed tank+heli ancestry. New modes added later (Twl1v1, plus 4 v0.727+ modes) weren't in the list, so `refreshVehicleSpawnSpecsFromModeConfig` silently fell through to tank specs after Confirm. v0.731 made it return `true` unconditionally. **If you add a tank mode to aircraft-duel, you have to revert this.** Tank-spawn fallback code in `strings.ts:24-46` and `config.ts` `team1TankSpawns` arrays are still there as reference.

### State / cache invariants

- **`State.hudCache.hudByPid` holds widget refs across the player's session.** On disconnect, `OnPlayerLeaveGame` cleans up. Don't assume refs persist across leave/rejoin.
- **`State.flag.lastUiSnapshotByPid` (overtime diff cache) caches text + sizes but NOT colors.** v0.737 color writes intentionally bypass this. If you add a new per-pid value to the overtime HUD, decide if it needs cache invalidation.
- **Diff-state shape coupling**: `ReadyDialogModeConfigDiffState` lists every dirty field. New ready-dialog fields need to be added in three places: the type, the build function, and `applyDirtyStateColorsForPid`. Easy to miss one.

---

## First decisions to make in chat #1

These cut the most code from your future self if decided early:

1. **What's the gameplay?** Is "aircraft-duel" planes-only? Helis-only with stricter 1v1 rules? A renamed clone of helis with one tweak? The fork is mechanical until you decide the differentiator.

2. **Which game modes survive?** Today's 7 modes ship as-is. Most likely: 1-2 stay, the rest get deleted. Pruning early prevents bug fixes from being applied to 6 dead modes.

3. **Rename or repurpose strings?** `gameModeHelisLadder` → `gameModeAircraftDuelLadder`? Or just change the display values in `strings.json` and keep the slugs (cheaper, slightly less clean). The v0.728 rename of "Helis Only - BF6 Vanilla" → "All Helis - BF6 Vanilla" did slug-stable display-rename — that pattern works.

4. **Maps**: keep all 9 or prune? Helis-only ships with Blackwell Fields, Defense Nexus, Golf Course, Mirak Valley, Operation Firestorm, Liberation Peak, Manhattan Bridge, Sobek City, Area 22B. Maps without explicit heli spawns (`team1HeliSpawns`/`team2HeliSpawns`) fall back to `buildHeliSpawnsFromTankSpawns` which uses tank pad positions.

5. **Aircraft-duel-specific mechanics?** Some candidates:
   - Plane support (currently only helis are spawn-enabled — `team1HeliSpawns` / `team2HeliSpawns` arrays). Adding planes is bigger than it sounds because plane handling, soft-ceiling logic, and the takeoff-limit warning all assume helis.
   - First-to-N air-to-air kills (current logic counts any vehicle destruction).
   - Single-life mechanic (current logic already does "one vehicle per round" but you could tighten it).

6. **Should the cleanup analysis (Tier 1-3 in `old_archive/6.01.26_cleanup_polish_analysis.md`) be applied as the first commit?** ~100 LOC of definite dead code is cheaper to delete BEFORE the fork's history starts diverging.

---

## Where to look for deeper context

Inside `design_doc/old_archive/`:

| File | What's there | Read when |
|---|---|---|
| `_helis_source_inventory.md` | File-by-file map of all 19 .ts files, function inventory, GameState shape | First — overall orientation |
| `heli_features.md` | Full feature catalog with perf rankings | When picking which features to keep |
| `heli_v_conquest_comp.md` | What helis-only has vs the upstream Conquest project | When considering porting Conquest features back |
| `heli_improvement_plan.md` | Prioritized improvement backlog | When picking what to ship next |
| `heli_issues.md` | Conquest-style bug tracker — open + ruled-out hypotheses | When debugging — check this BEFORE hypothesizing |
| `heli_issues_design.md` | Static-analysis risk inventory + Conquest-port catalogue | When auditing risk |
| `6.01.26_*` | Most recent plans — viewer colors, pending/confirmed refactor, cleanup analysis | Recent context |
| `5.27.26_heli_proposed_features.md` | The H-P3 viewer-oriented HUD full proposal (the layout flip we deferred) | If considering the full HUD-orient flip |
| Older `5.XX.26_*` plans | One-off feature plans from v0.5-v0.7 era | Reference when working on those specific systems |

Inside the source itself:

- `src/Changelog.ts` — comment-only version history (~850 lines, going back to v0.6XX). Useful for understanding why a constant has its current value or why a function looks the way it does.
- `src/AGENTS.md` (root of folder) — documentation conventions + project rules.
- `src/CLAUDE.md` (root of folder) — agent-specific guidance for working on this codebase.

---

## Suggested first chat actions

1. **Make the first commit on `feature/aircraft-duel`** (or whatever branch name was chosen) before mutating anything: `git add dev/aircraft-duel; git commit -m "Fork aircraft-duel from helis-only v0.737"`. Establishes a clean baseline for `git log --oneline -- dev/aircraft-duel/` to read meaningfully later.

2. **Run `npm install` and `npm run build`** in `dev/aircraft-duel/`. Confirm the build is clean before changing anything. If `npm run build` succeeds, the fork is mechanically sound.

3. **Update `package.json` name** from `"twl-helis-only"` to `"twl-aircraft-duel"` (or similar). Single-line change, immediately disambiguates the two projects.

4. **Decide on the gameplay differentiator** (item 1 above). Without it, every other decision is premature.

5. **Optionally do the cleanup pass first** — Tier 1 from `6.01.26_cleanup_polish_analysis.md`. ~100 LOC dead code removal, zero risk, saves ~5 KB bundle, cheaper to do now than after divergence.

6. **Don't immediately split the codebase further.** The 5,540-line `ready-dialog.ts` and 2,396-line `overtime.ts` files are scary but functional. Splitting them is in the helis improvement backlog (P2-7, P2-8) but never shipped. Leave the architecture alone until the new mode's design forces a change.

---

## What we lost in the fork

- **Git history of the aircraft-duel files**. Each file's `git blame` on `dev/aircraft-duel/src/X.ts` will show one commit (the fork) for every line. To see WHY a line is what it is, you'll need to cross-reference against `dev/helis-only/src/X.ts` history.
- **Automatic flow of helis-only bugfixes**. A bug fix on `feature/helis-only_b` will not appear in `feature/aircraft-duel`. Use `git cherry-pick <sha>` if you find a fix that applies to both.
- **The `Changelog.ts` file is now historically inaccurate** — every entry from v0.6XX-v0.737 reads as "shipped in helis-only" but is now also "the starting point of aircraft-duel." Decide whether to keep the helis-history block (for context) or trim it to just "forked from helis-only v0.737".

---

## TL;DR for the next chat

You're inheriting a working, polished, ~20K-LOC game-mode script. The architecture is sound, the engine quirks are documented, the recent UX work is fresh. **Don't break the per-pid HUD model, the pending/confirmed mode config flow, or the viewer-relative team colors** — those are load-bearing. **Decide what aircraft-duel actually IS** before doing more mechanical work, because every system in the codebase is shaped around helis-only's specific rules.

Read this file first. Then read `_helis_source_inventory.md` for orientation. Then read whichever plan in `old_archive/6.01.26_*.md` is closest to the work you're about to do.
