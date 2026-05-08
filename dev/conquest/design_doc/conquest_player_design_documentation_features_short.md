# TWL Conquest — Player-Facing Feature Documentation

---

## Custom Dialogs / Interfaces

Walk into and interact with colored smokes to open their menus.

- **Green** → ready up & swap teams (admins configure mode here too)
   - Triple-tap E while on-foot to access this at any time!
- **Purple** → deploy into a vehicle (HQ / Forward / Air Deploy)
- **Yellow** → Supply Box in the field during a live game (@HQ pre-game to preview)

Both main bases have a green + purple pair near spawns, so ready-up and vehicle deploys are always a step away. Yellow Supply Boxes are near objectives during the match; the ones at HQ are pre-game-only previews for testing loadouts.

---

## Game Match Flow

A match runs through four stages:

1. **Pre-game** → Admin configures, vehicles, settings and modes; players warm up, check loadouts and supply box tuning
2. **Ready Up** → Hit READY when you're good to go; match auto-starts when all players are ready
3. **Countdown** → 3-2-1 on the deploy screen, also displays vehicle round-timings
4. **Live** → kill the enemy, capture flags and bleed tickets

Pre-game is the warm-up. Once enough players hit **READY**, countdown begins and the match goes Live. The round ends once a team reaches 0-tickets, or on clock time out (higher tickets wins or a draw if even).

---

## Player Ready Up Panel

Shows the current admin, ready status, or swap teams.

- Opens from any green smoke at your main base
- **'READY'** toggles your status as good to start the match
- **'CLAIM ADMIN'** appears top-right when the admin slot is empty
- **'CHANGE TEAMS'** works at any time, even mid-match
   - Triple-tap E while on-foot to access this at any time

When the admin leaves or gives it up, 'CLAIM ADMIN' appears for everyone — nobody is auto-promoted, somebody has to take it. This is typically whomever hosts the match.

---

## Configurations / Admin Ready Up Panel

Admin's pre-match control panel. Pick vehicles, modes, and settings before the round starts.

- Start from a TWL preset (e.g. 12v12 Conquest), or customize anything (& everything!)
- Center checkboxes pick deploy modes: Vanilla / HQ / Air / Forward / Supply Boxes
- Unsaved changes turn red → **'APPLY CONFIGURATION'** locks changes in
- **'GIVE UP ADMIN'** allows you to yield Admin to another player

Use left/right arrows on each row to cycle vehicle options per team. A preset loads TWL defaults instantly; tweak any setting and the mode flips to "Custom" so you know you're off-template. 

---

## Vehicle Deploy Modes

One menu, multiple ways to get a vehicle. Opens on the deploy screen, or via the purple smoke at HQ.

- Admin picks which modes are on:
   - **Vanilla** → auto-spawns at HQ, walk up and drive (classic BF)
   - **HQ Deploy** → request and you're seated at HQ instantly
      - **Forward Deploy** → ground vehicles drop at a random forward point
      - **Air Deploy** → aircraft drop airborne in your team's sky zone
- Vehicle deploys cost no ticket and don't count as a death

Built to stop pad-camping — if the enemy can't predict where/when vehicles appear, you get real dog-fights instead of farming spawns. Vanilla is classic Battlefield. HQ deploys flip it: nothing auto-spawns, but player request to get seated on demand. Forward and Air deploys extend the HQ deploy capabilities: ground vehicles get pushed up to a forward zone, aircraft drop back in your team's sky zone, both within tuned randomized ranges so its difficult to predict.

---

## Supply Box Gadgets

Interact with yellow smoke for a Supply Box. Find them in the field to grab class-specific gadgets.

- Live match only at objectives (previewable at HQ pre-game)
- Per-player cooldowns and per-team charges → tuning varies by map
- Buttons dim on cooldown; timer shows when they're available again
- Pick which gadget slot gets used at the top

A class-aware gadget vending machine. Each button shows its scope ("1 per player", "1 per team"), a cooldown, and a live timer when locked. Cooldowns persist per player (and per team for shared items) — closing / reopening the menu or visiting a different Supply Box won't reset them.

---

## Conquest HUD & UI

Tickets, clock, capture progress, with an added vehicle ready-status panel

- **Ticket bar** → friendly left/blue, enemy right/red. Chevrons show bleed rate
- **Capture panel** → capture-point progress, status and contest indicators
- **Vehicle list** → friendly HQ vehicles with WAIT / READY / ACTIVE statuses
- **Crown** → shown over the team currently in the lead

Bleed chevrons indicate bleed differentials. Vehicle deploy timers show bars filling in 10% increments.

---

## End Match Victory Panel

End-of-match scoreboard. Winning team, final tickets, rosters, 30 seconds until the next round.

- Crown over the winning team. Final ticket counts in big digits
- Both team rosters and match length

The match wraps up here. Tickets freeze, the winner gets a crown, the result line shows the win margin (or "Draw" if tied). The 30-second window is sized for league captains to capture results.

---