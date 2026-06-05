// @ts-nocheck
// Module: gamemode description, mechanics, and glossary (source-only documentation)

//#region -------------------- Gamemode Description --------------------

// This script implements:
//   - Vehicle scoring + round/match flow (start/end, timers, victory dialog)
//   - Main-base enter/exit tracking (ammo restock + base state)
//   - Triple-tap "Ready Up" dialog (roster, ready states, base gating, auto-start)
//   - Team switching via a single "Swap Teams" button (forces undeploy)
//   - Overtime tie-breaker objective capture (randomized flag, staged visibility/activation, capture HUD + resolution)
//
// This experience is a round-based, vehicle-only scoring mode:
// - Vehicles become "registered" to a team when they spawn and/or the first time a player enters them.
// - When a registered vehicle is destroyed during a LIVE round, the opposing team earns +1 Round Kill.
// - A round ends when a team reaches the Round Kill target (e.g. 2 kills for 2v2) or the round clock expires.
// - Tie-breaker objective: a random flag becomes visible at half-time (based on round length) but remains locked.
// - The objective unlocks at 1:00 remaining; capture is vehicle-only and progress is script-driven.
// - Capture speed scales with 2/3/4 vehicle majorities, and neutral reset/pushback accelerates until neutral (0.5).
// - At clock expiry, objective progress decides the winner; exact neutral (0.5) falls back to round kills.
// - Entering/Exiting main-base provides a gadget ammo restock so players can rearm/resupply if needed mid match or post match
// - Match record (wins/losses/ties) is tracked across rounds; HUD is a projection of that authoritative state.
// - Round end and Victory end dialogs communicate results in timed windows for clarity
//
// Glossary (terms):
// - "Round Kills": points earned this round (vehicle-destruction points).
// - "Total Kills": lifetime match total (if used/shown); not required for win condition.
// - "Registered vehicle": a vehicle currently stored in the team's registered list (GlobalVariables 0/1).
// - "Last driver": best-effort owner used for messaging only; not authoritative for scoring.
// - "HUD": always-on per-player overlay (cached by pid).
// - "Dialog": modal UI that enables UI input mode (Team Switch / Victory).
// - "Overtime objective": the tie-breaker flag selected from the map's A-G set.
// - "Overtime stage": None -> Visible (locked) -> Active (capturable).
// - "Overtime progress": 0.5 is neutral; >0.5 favors Team 1, <0.5 favors Team 2.
// - "Vehicle majority": unique vehicles in the zone used for capture multipliers.
//
// Glossary (script semantics)
// - T1 / T2: The two competing teams in this mode; UI may still use Left/Right for layout only.
// - Match totals: Counters that persist across rounds (e.g., total kills, match wins).
// - Round counters: Counters that reset on round start (e.g., round kills, round clock).
// - Authoritative state: The single source of truth for match-critical counters; HUD is a projection of this state.
// - Overtime state derives from the round clock (half-time reveal, 1:00 unlock) and drives HUD visibility.
//
// Recommendations on tweaking/adjusting/customizing this experience
// - General UI layout tip: Most widgets define an offset via `position: [x, y]`.
// - Change those numbers to nudge that widget relative to its anchor; the perceived direction can vary by anchoring, so verify in-game after edits.
// - Overtime/tie-breaker tuning lives under OVERTIME_* constants (timing, capture rate, multipliers, UI layout).

//#endregion -------------------- Gamemode Description --------------------
