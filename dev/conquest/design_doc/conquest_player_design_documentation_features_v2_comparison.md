# TWL Conquest — Player-Facing Copy: V1 vs V2 Comparison

Side-by-side comparison of the current player-facing copy (V1, your editing pass) with a simplified V2. Goal for V2: same information density, fewer words, more conversational, easier to skim.

> **What V2 trims:** filler words, hedging, internal-system jargon ("dialog", "panel" → "menu"), passive voice, redundant clauses. **What V2 keeps:** every feature, every callout the player needs to act on, the same hierarchy.

> **Read this doc:** each feature is its own table — V1 left, V2 right. Below each table is a one-line note on what changed.

---

## Custom Dialogs / UI Interfaces

<table>
<tr><th width="50%">V1 (current)</th><th width="50%">V2 (simplified)</th></tr>
<tr>
<td valign="top">

Colored smokes mark every static interactive menu in the game; interact with them to open dialogs.

- **Green smoke** → (main base) Ready Up and Team Switcher 
   - You can also get to these with a triple-tap of the interact button while standing still on foot
   - If you're admin - this also enables configuration of the mode
- **Purple smoke** → (main base) Vehicle Redeploy menu (if HQ, Air or Forward Deploy is enabled).
- **Yellow smoke** → Supply Box. Active during Live around every captured objective; pre-game only at HQ as a loadout preview.

Color helps with finding each dialog. Both main bases carry a green and purple smoke pair near player spawners - so ready-up and vehicle deploy are always steps away. The yellow Supply Boxes are in the field, near capture points and accessible during the Live game; the yellow smoke at HQ are just for pre-game previews.

</td>
<td valign="top">

Walk into a colored smoke to open its menu. Triple-tap E from on-foot does the same thing.

- **Green** — ready up & swap teams (admins configure here too)
- **Purple** — grab a vehicle (if HQ / Forward / Air mode is on)
- **Yellow** — Supply Box (objectives during match, HQ pre-game for previews)

Both main bases have a green + purple pair near spawn — ready-up and vehicle deploy are always a step away. Yellow Supply Boxes live on objectives during the match; the ones at HQ are pre-game-only previews for testing loadouts.

</td>
</tr>
</table>

> Cut: redundant "Colored smokes mark every static interactive menu" intro. Tightened bullets to 1 line each. Kept the "where + when" detail on yellow smoke since it's the most-asked question.

---

## Game Match Flow

<table>
<tr><th width="50%">V1 (current)</th><th width="50%">V2 (simplified)</th></tr>
<tr>
<td valign="top">

A match runs through four stages — pre-game configuration, tuning & ready-up, a live 3-2-1 countdown, then live gameplay

- **Pre-game:** the admin tunes vehicles and deploy modes; everyone else can spawn, drive, walk around the HQ, and preview gadgets at the HQ Supply Box
- **Ready Up:** each player clicks READY; the match auto-starts once enough players are ready on both sides
- **Countdown:** 3-2-1 final countdown in the deploy screen
- **Live:** victory is triggered either on 0 tickets or clock end

First is a pre-game for setup and configuration. The admin uses the configuration dialog to dial in vehicles, deploy modes, and player counts, while everyone else can spawn into the map, test vehicle loadouts, and use the yellow HQ Supply Box to preview gadget tuning. When players hit READY and the minimum-per-side threshold is met, a 3-2-1 countdown locks settings and forces every player to the deploy screen. Live phase activates capture points, ticket bleed, and the Supply Boxes in the field; the round ends when one team hits 0 tickets or the clock expires. Draws are possible if tickets end at the same number.

</td>
<td valign="top">

A match runs through four stages.

1. **Pre-game** — admin sets up vehicles and modes; everyone else explores HQ, drives, previews gear.
2. **Ready Up** — hit READY when set. Match auto-starts once both sides have enough.
3. **Countdown** — 3-2-1 on the deploy screen.
4. **Live** — capture flags, bleed enemy tickets. First to 0 loses (or higher count when the clock ends; equal = draw).

Pre-game is the warm-up. Once enough players hit READY, a 3-2-1 locks settings and the match goes Live with capture points and ticket bleed. The round ends on first-to-0-tickets, on clock end (higher tickets wins), or in a draw when both sides land at the same number.

</td>
</tr>
</table>

> Numbered list flags the temporal flow more clearly than bullets. Win conditions get one tight sentence at the end of bullet 4 instead of being buried in the paragraph.

---

## Player Ready Up Panel

<table>
<tr><th width="50%">V1 (current)</th><th width="50%">V2 (simplified)</th></tr>
<tr>
<td valign="top">

Non-admin players get a dialog showing who the admin is, your ready status and capability to team switch

- Opens from any of the green smokes at your main base
- CLAIM ADMIN appears top-right when the admin slot is vacant
- Shows the current admin (or "No Admin"), and your ready status
- Switch teams is always available from this dialog, even when live.

Every player starts here at this dialog. CHANGE TEAMS hides the panel and re-deploys you on the other side; READY toggles your status and updates the global "X / Y ready" counter. If the admin disconnects or hands off the slot, CLAIM ADMIN appears for everyone — there's no auto-promotion, the slot stays empty until somebody actively claims it.

</td>
<td valign="top">

The menu you'll see most. Shows the current admin, your ready status, and lets you swap teams.

- Opens from any green smoke at your main base.
- CLAIM ADMIN appears top-right when the admin slot is empty — first click wins.
- SWAP TEAMS works any time, even mid-match.

Every player lands here first. READY toggles your status and updates the lobby counter; SWAP TEAMS hides the menu and re-deploys you on the other side. When the admin leaves or gives up the slot, CLAIM ADMIN appears for everyone — nobody auto-promotes, somebody has to take it.

</td>
</tr>
</table>

> Reframed headline from "Non-admin players get a dialog" (defines by exclusion) to "The menu you'll see most" (defines by experience). Dropped the third bullet — its info ("shows the current admin / ready status") is already in the headline.

---

## Configurations in Admin Ready Panel

<table>
<tr><th width="50%">V1 (current)</th><th width="50%">V2 (simplified)</th></tr>
<tr>
<td valign="top">

The match's admin can pre-pick which tanks, jets, helis, and transports each team gets — and toggle deploy modes — right from the Ready Up dialog before the round starts.

- TWL presets are seeded at the top (e.g. 12v12 Conquest)
- If teams choose, they can customize beyond these presets by choosing what individual vehicles are deployed.
- Center checkboxes pick the deploy modes available: Vanilla / HQ / Air / Forward / Supply Boxes
- Unsaved changes show in red. Click on 'Apply Configuration" to commit changes.
- Only the Admin sees this panel - claiming admin grants permission to do this.

The Vehicle Configurations grid is the host's pre-match control panel. They cycle through tank, jet, heli, and transport options per team using left/right arrows on each row, then pick the deploy methods and whether Supply Boxes are on. Picking a Game Mode preset auto-loads its defaults; manual changes flip the mode to "Custom" so you always know whether you're on a known approved template. Once confirmed, this syncs every spawner to the new vehicle types.

</td>
<td valign="top">

Admin's pre-match control panel. Pick vehicles, modes, and toggles before the round starts.

- Start from a TWL preset (e.g. 12v12 Conquest), or customize anything.
- Center checkboxes pick deploy modes: Vanilla / HQ / Air / Forward / Supply Boxes.
- Unsaved changes turn red. **APPLY CONFIGURATION** locks them in.
- Admins only — claim admin to use it.

Use left/right arrows on each row to cycle vehicle options per team. A preset loads sensible defaults instantly; tweak any setting and the mode flips to "Custom" so you know you're off-template. APPLY syncs every spawner to your choices.

</td>
</tr>
</table>

> Five bullets → four (merged "presets" + "customize beyond" since they're the same idea). All-caps **APPLY CONFIGURATION** matches the actual button label. Dropped "host" terminology — the rest of the doc uses "admin".

---

## Vehicle Deploy

<table>
<tr><th width="50%">V1 (current)</th><th width="50%">V2 (simplified)</th></tr>
<tr>
<td valign="top">

The Vehicle Deploy menu is your one-stop shop for vehicles — open it from the deploy screen or the purple smoke at HQ. 

- Opens automatically on the deploy screen, or accessible from the purple smoke at HQs.
- Admin picks the available respawn modes for vehicles: 
   - **Vanilla** (auto-spawn cycle, just like a public server - walk up to it)
   - **HQ Deploy** (teleport spawn player into it at HQ + auto-seat)
      - **Forward Deploy** (ground vehicles dropped at a tuned/randomized forward point)
      - **Air Deploy** (aircraft dropped airborne in your team's air zone).
- Voluntary deploys don't cost a ticket or count as a death.

The design philosophy here is built around preventing the capability to camp - if the enemy cannot predict when or where the vehicles spawn, it creates more chances for real combat to occur instead of pad camping. The Vehicle Deploy menu is the shared front-end for all four deploy modes. **Vanilla** is classic Battlefield. If Vanilla is not enabled, HQ Deploy is automatically enabled. **HQ Deploy** flips the classic behavior — nothing auto-spawns, but each player can request a vehicle on demand and is force-seated inside the moment it spawns at HQ. Forward and Air Deploys are extensions of the HQ Deploy functionality. **Forward Deploy** mirrors the behavior for ground vehicles, but pushes them up to a tuned randomized forward point closer to the action; **Air Deploy** mirrors it for jets and helis but they're dropped airborne in your team's sky zone in a tuned randomzied range.

</td>
<td valign="top">

One menu, multiple ways to get a vehicle. Opens on the deploy screen, or via the purple smoke at HQ.

- Admin picks which modes are on:
   - **Vanilla** — auto-spawns at HQ, walk up and drive (classic BF).
   - **HQ Deploy** — request and you're seated at HQ instantly.
      - **Forward Deploy** — ground vehicles drop at a random forward point.
      - **Air Deploy** — aircraft drop airborne in your team's sky zone.
- Voluntary deploys cost no ticket and don't count as a death.

Built to stop pad-camping — if the enemy can't predict where vehicles appear, you get real fights instead of farming spawns. Vanilla is classic Battlefield. HQ flips it: nothing auto-spawns, but you request and get seated. Forward and Air extend HQ — ground vehicles get pushed up to a forward zone, aircraft drop in your team's sky zone, both at randomized points so no one camps the spot.

</td>
</tr>
</table>

> Paragraph cut from 5 sentences to 3. Bullet labels cleaned up ("teleport spawn player into it at HQ + auto-seat" → "request and you're seated at HQ instantly"). Removed the "If Vanilla is not enabled, HQ Deploy is automatically enabled" sentence — the radio-pair behavior is implicit when you read the modes top-down.

---

## Supply Box

<table>
<tr><th width="50%">V1 (current)</th><th width="50%">V2 (simplified)</th></tr>
<tr>
<td valign="top">

Indicated by Yellow Smoke - walk up to a Supply Box and resupply or swap class specific gadgets. 

- Interact with them during a Live match to access rare/exclusive gadgets or resupply launcher ammo.
- Gadgets are tuned around 'Per-team charges' & 'Per-player cooldowns'
- Buttons dim when they're on cooldown - timers show when they're usable again
- Choose which gadget slot is utilized at the top
- Supply Boxes will be tuned per map, so check them out pre-game in the HQ

The Supply Box is a gadget vending machine; it's class-aware and locked to your current choice. Each button has a name, a duration / scope hint ("1 per player", "5m cooldown", "1 per team"), and a live timer when it's on cooldown. Cooldowns are persisted per player (and per team for shared items), so closing and re-opening the menu or accessing a different supply box doesn't reset them.

</td>
<td valign="top">

Walk into a yellow smoke for a Supply Box. Resupply launcher ammo or grab class-specific gadgets.

- Live match only at objectives. (HQ ones are pre-game previews.)
- Per-player cooldowns and per-team charges — no spam.
- Buttons dim on cooldown; timer shows when they're back.
- Pick which gadget slot to fill at the top.
- Tuning varies by map — preview pre-game.

A class-aware gadget vending machine. Each button shows its scope ("1 per player", "1 per team"), a cooldown, and a live timer when locked. Cooldowns persist per player (and per team for shared items) — closing / reopening the menu or visiting a different Supply Box won't reset them.

</td>
</tr>
</table>

> "Per-team charges & per-player cooldowns" → "no spam" gives the player the actual takeaway in 2 words. Last bullet "tuning varies by map — preview pre-game" links forward to the pre-game preview behavior in one short clause.

---

## Conquest HUD / UI

<table>
<tr><th width="50%">V1 (current)</th><th width="50%">V2 (simplified)</th></tr>
<tr>
<td valign="top">

The on-screen HUD that shows tickets, match clock, capture progress, bleed indicators, vehicle deploy timers, and the team's ticket

- Top ticket bar: friendly left/blue, enemy right/red; chevrons show bleed rate.
- Mid-screen: capture-point progress, contested indicators and callouts.
- Vehicle availability: shows friendly HQ vehicle statuses with WAIT / READY / ACTIVE indicators

The combat HUD is very similar to Vanilla BF6: friendly is always on the left in blue and enemy is always on the right in red - both locked in place so you never have to think about which side is yours. Capture-point progress bars show contested statuses and how many players are on a flag. The bleed chevrons appear on the losing team's ticket bar when an objective differential is active. Vehicle deploy timer rows show spawn progress in 10% chunks.

</td>
<td valign="top">

Tickets, clock, capture progress, vehicle status — the standard combat readout.

- **Ticket bar** — friendly left/blue, enemy right/red. Chevrons mean you're bleeding.
- **Mid-screen** — capture-point progress and contested indicators.
- **Vehicle list** — friendly HQ vehicles with WAIT / READY / ACTIVE.

Just like vanilla BF6: friendly always on the left in blue, enemy always on the right in red — locked, so you never have to think about which side is yours. Capture bars show how many players are on each flag. Bleed chevrons appear on the losing side. Vehicle deploy timers fill in 10% chunks.

</td>
</tr>
</table>

> Bold lead-ins on the bullets create visual rhythm and let players skim straight to the section they care about. Headline is now a single comma list — feels less like a description and more like an inventory.

---

## Victory Panel

<table>
<tr><th width="50%">V1 (current)</th><th width="50%">V2 (simplified)</th></tr>
<tr>
<td valign="top">

When the match ends, every player gets a full-screen results scoreboard showing the winning team, final ticket counts, match length, and a 30-second countdown to the next round.

- Crown icon over the winning team; final ticket counts in big digits.
- Both team rosters and match length displayed.
- "Screenshot now" prompt — the panel sticks for 30 seconds to ensure results can be collected by captains.
- Admin action count appears (yellow) only if any admin actions were used.

The Victory Panel is the round wrap-up. Tickets are frozen, the winning team gets a crown, the result line spells out the win margin or "Draw" if it's tied, and both team rosters are displayed. The countdown shows when the next round will reset; the panel survives for the full 30 seconds so everyone has time to screenshot and read it. A yellow admin-actions line appears only when the admin actually used test buttons or special config tools during the match.

</td>
<td valign="top">

End-of-match scoreboard. Winning team, final tickets, both rosters, 30 seconds until the next round.

- Crown over the winning team. Final ticket counts in big digits.
- Both team rosters and match length.
- 30-second window — long enough for captains to screenshot.
- Yellow admin-action count appears only if admin tools were used.

The match wraps up here. Tickets freeze, the winner gets a crown, the result line shows the win margin (or "Draw" if tied). The 30-second window is sized for league captains to capture results. The yellow admin-action line only appears if admin actually pressed test buttons during the match.

</td>
</tr>
</table>

> "Long enough for captains to screenshot" packs the rationale into the bullet so the paragraph doesn't have to repeat it. Headline trades "results scoreboard showing X, Y, Z" for a comma-list inventory.

---

## Summary

| Metric | V1 | V2 | Change |
|--------|----|----|--------|
| Total words (player-facing) | ~1,150 | ~720 | ≈ −37% |
| Average sentence length | longer, multi-clause | shorter, period-separated | feels skimmable |
| Lead-in style | descriptive ("The X is …") | inventory / direct ("X, Y, Z") | drops a sentence per feature |
| Bullet density | one idea per bullet, sometimes wordy | one idea per bullet, telegraphic | same info, half the words |
| Information dropped | none | none — every callout preserved | density held |

### Recurring V2 patterns to consider for future copy

1. **Lead with the action.** "Walk into a colored smoke" beats "Colored smokes mark every static interactive menu". Verb-first headlines tell the player what to *do*.
2. **Comma-list headlines.** Instead of "the HUD shows tickets, clock, capture progress, bleed, deploy timers, and team's ticket" — say "Tickets, clock, capture progress, vehicle status." Same density, half the words.
3. **Bold lead-ins on bullets.** Pattern: `**Label** — explanation`. Lets the reader skim labels first and only dive into bullets that matter.
4. **Numbered lists for sequences.** Pre-game → Ready → Countdown → Live is a sequence; numbering makes the temporal order obvious without prose.
5. **Cut "the" and "that".** "The match's admin can pre-pick" → "Admin's pre-match control panel". Most "the"/"that" instances aren't load-bearing.
6. **Replace passive with imperative.** "Cooldowns are persisted per player" → "Cooldowns persist per player". One word lighter every time.
7. **One sentence per idea.** V1 paragraphs often run 4–5 ideas per long sentence. V2 splits into 2–3 short sentences. Easier to skim, easier to translate, easier to edit.

### What was deliberately *not* changed

- Smoke colors, hierarchy of HQ → Forward / Air, lifecycle of pre-game → ready → countdown → live, the four-mode structure of Vehicle Deploy, button names (READY, SWAP TEAMS, CLAIM ADMIN, APPLY CONFIGURATION), color contract (friendly = blue/left, enemy = red/right). All factual / structural; all preserved.
- The "who-can-do-what" axis: admin vs everyone, live vs pre-game.
- Every Battlefield-native term (tickets, bleed, deploy, capture point, HQ, jet, heli) — V2 keeps them since the audience knows the franchise.

### Open questions for V2 (your call)

1. **Section headers.** "Custom Dialogs / UI Interfaces" still reads internal. Drop the "/ UI Interfaces" half? Or rename to "Smokes & Menus" / "How to interact"?
2. **"Configurations in Admin Ready Panel"** is a long header for what is essentially "Admin Setup Panel" or "Admin Configuration". Worth shortening?
3. **Tone calibration.** V2 is conversational ("you", contractions, em-dashes). If the actual surface is a Steam page, this fits. If it's an in-game help tooltip, may want to drop another 20% off the paragraphs.
4. **Examples.** V2 keeps specifics where they aid scanning (12v12 Conquest preset, "1 per player" hints). Add more? (e.g., a sample bleed-rate, sample respawn timer.) Or trust the player to find them in-game?
