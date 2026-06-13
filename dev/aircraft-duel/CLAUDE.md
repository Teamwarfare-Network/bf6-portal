# Aircraft-Duel — Agent Quick-Reference

## Project

Aircraft-Duel is a BF6 Portal game mode forked from `helis-only` at v0.737 (fork date: 2026-06-01). It inherits the entire helis-only architecture, codebase, and conventions, but is designed to evolve in its own direction. The actual gameplay differentiator is TBD as of the fork — see the kickoff brief.

- **This is the primary development folder**: `bf6-portal\dev\aircraft-duel`
  - Almost all work happens in here, specifically `bf6-portal\dev\aircraft-duel\src`.
  - The parent `helis-only` folder is a sibling project. Treat it as reference only — bug fixes in helis-only do NOT auto-flow to aircraft-duel.
  - Conquest (`bf6-portal/dev/conquest/`) is the upstream-ancestor project; helis-only was forked from there, and aircraft-duel inherits Conquest patterns via helis-only's evolution. Cross-reference Conquest docs when porting fixes back.

## Rules

- **ALWAYS** read [`./AGENTS.md`](./AGENTS.md) first for current rules, banned API patterns, and process expectations.
- **READ FIRST when starting a new chat**: [`./design_doc/_aircraft_duel_kickoff.md`](./design_doc/_aircraft_duel_kickoff.md) — the fork's orientation doc. Self-contained; explains what was inherited, what NOT to break, engine quirks the helis codebase learned the hard way, and what to decide first.
- **REFERENCE for legacy context** (historical helis docs preserved in `design_doc/old_archive/`):
  - [`./design_doc/old_archive/_helis_source_inventory.md`](./design_doc/old_archive/_helis_source_inventory.md) — file-by-file map + function inventory of the inherited codebase.
  - [`./design_doc/old_archive/heli_features.md`](./design_doc/old_archive/heli_features.md) — feature catalog + perf rankings (as of helis v0.630, still mostly accurate).
  - [`./design_doc/old_archive/heli_issues.md`](./design_doc/old_archive/heli_issues.md) — Conquest-style active bug tracker. **Read first when picking up a debug session** — lists ruled-out hypotheses so you don't re-try them. Inherited issues apply to aircraft-duel until proven otherwise.
  - [`./design_doc/old_archive/heli_v_conquest_comp.md`](./design_doc/old_archive/heli_v_conquest_comp.md) — comparison with Conquest, with porting recommendations.
  - [`./design_doc/old_archive/heli_improvement_plan.md`](./design_doc/old_archive/heli_improvement_plan.md) — effort × value matrix (mostly relevant; some items may already be shipped via v0.7XX work).
  - [`./design_doc/old_archive/6.01.26_cleanup_polish_analysis.md`](./design_doc/old_archive/6.01.26_cleanup_polish_analysis.md) — ~100 LOC of definite dead code identified at fork time; consider doing this cleanup early in aircraft-duel's life before history diverges further.
- **REFERENCE for recent inherited features** (most important to understand because they're load-bearing):
  - [`./design_doc/old_archive/6.01.26_matchup_players_pending_confirmed_plan.md`](./design_doc/old_archive/6.01.26_matchup_players_pending_confirmed_plan.md) — the pending/confirmed mode-config pattern. Every new ready-dialog knob must follow this.
  - [`./design_doc/old_archive/6.01.26_own_team_blue_color_swap_plan.md`](./design_doc/old_archive/6.01.26_own_team_blue_color_swap_plan.md) — viewer-relative team colors. Every new team-anchored widget must register in the appropriate fixup function.
- **REFERENCE Conquest's project docs** when Conquest has fixed something we still need to fix:
  - [`bf6-portal\dev\conquest\AGENTS.md`](../conquest/AGENTS.md) — many policies (string-key system, ASCII guardrail, dirty-flag contract, comment-strip postbuild) apply identically.
  - [`bf6-portal\dev\conquest\design_doc\conquest_issues_summary.md`](../conquest/design_doc/conquest_issues_summary.md) — Conquest bug history; many issues describe code patterns aircraft-duel still has.

## Fork awareness

A bug fix on `feature/helis-only_b` does NOT automatically appear in aircraft-duel. If you find a fix that applies to both, use `git cherry-pick <sha>` to bring it across, or re-implement the equivalent change here.

The Changelog.ts file inside this folder still reads as helis-only's full v0.6XX-v0.737 history because the file was copied verbatim. That history is the actual ancestry of the code in this folder, so it's accurate context — just not "things that happened in aircraft-duel."
