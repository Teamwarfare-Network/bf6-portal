**DRAFT — NOT YET ACTIVE. Suggestions only, pending human review (created 2026-05-25).**

> This file is modeled after [conquest/CLAUDE.md](../conquest/CLAUDE.md) but adapted to Helis-only's scope and state.
> Until approved, treat this file as **reference, not guidance**. Don't change behavior based on its contents.

---

## Project

This is a project to make a round-based vehicle-only competitive PvP game mode for BF6, marketed under the TWL (Teamwarfare League) ladder. The mode supports both helicopter and tank vehicle game modes within the same code base ("Helis Only - BF6 Vanilla", "Helis Only - TWL Ladder", "Helis Only - TWL Practice", "Helis Only - TWL Custom", plus a tanks branch).

Helis-only and [Conquest](../conquest/) share a common ancestor — Conquest grew out of the original Helis code. Many subsystem shapes (per-pid HUD, vehicle spawner, ready dialog, admin panel, overtime tie-breaker) are isomorphic between the two. **Helis is the smaller, simpler project; Conquest is the larger one with more MP-playtest hardening.**

- This is the primary development folder: `bf6-portal\dev\helis-only`
  - Almost all work happens in here, specifically `bf6-portal\dev\helis-only\src`.
  - Anything outside this folder is reference only unless explicitly called for.

## Rules

- **ALWAYS** read [`bf6-portal\dev\helis-only\AGENTS.md`](./AGENTS.md) for updated documentation and information on rules and process.
- **REFERENCE** these for documentation and design. Consult them for design decisions and consistency:
  - [`bf6-portal\dev\helis-only\design_doc\heli_features.md`](./design_doc/heli_features.md) — file map + function inventory + perf ranking.
  - [`bf6-portal\dev\helis-only\design_doc\heli_v_conquest_comp.md`](./design_doc/heli_v_conquest_comp.md) — comparison with Conquest, with porting recommendations.
- **REFERENCE** for issues. Two complementary docs:
  - [`bf6-portal\dev\helis-only\design_doc\heli_issues.md`](./design_doc/heli_issues.md) — **Conquest-style active bug tracker** (`H_Bug_N` entries). Bugs that have been observed, hypothesized, attempted-to-fix, with status tracked. **Read this first when picking up a debug session** — it lists ruled-out hypotheses so you don't re-try them. Currently open: `H_Bug_1` (2 engine errors on MP join, source unknown after 4 fix attempts).
  - [`bf6-portal\dev\helis-only\design_doc\heli_issues_design.md`](./design_doc/heli_issues_design.md) — static-analysis risk inventory + Conquest-port catalogue + developer punchlist.
- **REFERENCE** for prioritization:
  - [`bf6-portal\dev\helis-only\design_doc\heli_improvement_plan.md`](./design_doc/heli_improvement_plan.md) — effort × value matrix; plan items.
- **REFERENCE** Conquest's project docs when Conquest has fixed something we still need to fix:
  - [`bf6-portal\dev\conquest\AGENTS.md`](../conquest/AGENTS.md) — many policies (string-key system, ASCII guardrail, dirty-flag contract, comment-strip postbuild) apply identically.
  - [`bf6-portal\dev\conquest\design_doc\conquest_issues_summary.md`](../conquest/design_doc/conquest_issues_summary.md) — many issues describe code patterns Helis still has.
