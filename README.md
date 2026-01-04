# TWL Tanks Only

Compete in competitive tanks only ladder experiences across 8 maps at [TWL](https://teamwarfare.net/), with rounds and kills tracked in a custom in-game HUD. Compete on the 2v2 Tanks ladder on teamwarfare.net, or use these experience codes to enjoy with your friends, clan mates & teams for tank practice. 
The experiences support 1v1, 2v2, 3v3 and 4v4 configurations!

Tanks Only Experience Codes Supported Today (version 0.259):

| Code | Map Name | Source Code | Portal URL |
|-------|----------|--------|--------|
| **ZMCYW** | All 8 Maps | [Source Code](https://github.com/Teamwarfare-Network/bf6-portal/tree/main/bf6-portal/experiences/TWL%20Tanks%20Only%20-%20All%208%20Maps%20v0.259) |  [Portal URL](https://portal.battlefield.com/bf6/experience/publish/step-three?id=f8631840-e8d4-11f0-91cf-a424ab3a1e8e&teams=0)  |
| **ZMC44** | Blackwell Fields | [Source Code](https://github.com/Teamwarfare-Network/bf6-portal/tree/main/bf6-portal/experiences/TWL%20Tanks%20Only%20-%20Blackwell%20Fields%20v0.259) | [Portal URL](https://portal.battlefield.com/bf6/experience/publish/step-three?id=f5e9c2c0-e8f3-11f0-93bf-bee0dd082586&teams=0) |
| **ZMC52** | Defense Nexus | [Source Code](https://github.com/Teamwarfare-Network/bf6-portal/tree/main/bf6-portal/experiences/TWL%20Tanks%20Only%20-%20Defense%20Nexus%20v0.259) | [Portal URL](https://portal.battlefield.com/bf6/experience/publish/step-one?id=7b816ff0-e8f4-11f0-93bf-bee0dd082586&teams=0) |
| **ZMC9S** | Operation Firestorm | [Source Code](https://github.com/Teamwarfare-Network/bf6-portal/tree/main/bf6-portal/experiences/TWL%20Tanks%20Only%20-%20Operation%20Firestorm%20v0.259) | [Portal URL](https://portal.battlefield.com/bf6/experience/publish/step-three?id=253e51e0-e8f8-11f0-93bf-bee0dd082586&teams=0) |
| **ZMC87** | Manhattan Bridge | [Source Code](https://github.com/Teamwarfare-Network/bf6-portal/tree/main/bf6-portal/experiences/TWL%20Tanks%20Only%20-%20Manhattan%20Bridge%20v0.259) | [Portal URL](https://portal.battlefield.com/bf6/experience/publish/step-three?id=420e6090-e8f7-11f0-93bf-bee0dd082586&teams=0) |
| **ZMC5P** | Golf Course | [Source Code](https://github.com/Teamwarfare-Network/bf6-portal/tree/main/bf6-portal/experiences/TWL%20Tanks%20Only%20-%20Golf%20Course%20v0.259) | [Portal URL](https://portal.battlefield.com/bf6/experience/publish/step-three?id=3d5d4680-e8f5-11f0-91cf-a424ab3a1e8e&teams=0) |
| **ZMC7Y** | Liberation Peak | [Source Code](https://github.com/Teamwarfare-Network/bf6-portal/tree/main/bf6-portal/experiences/TWL%20Tanks%20Only%20-%20Liberation%20Peak%20v0.259) | [Portal URL](https://portal.battlefield.com/bf6/experience/publish/step-three?id=ed6595c0-e8f3-11f0-9110-df17685fc72e&teams=0) |
| **ZMC9Y** | Mirak Valley | [Source Code](https://github.com/Teamwarfare-Network/bf6-portal/tree/main/bf6-portal/experiences/TWL%20Tanks%20Only%20-%20Mirak%20Valley%20v0.259) | [Portal URL](https://portal.battlefield.com/bf6/experience/publish/step-three?id=c8999580-e8f7-11f0-93bf-bee0dd082586&teams=0) |
| **ZMC3A** | Area 22B | [Source Code](https://github.com/Teamwarfare-Network/bf6-portal/tree/main/bf6-portal/experiences/TWL%20Tanks%20Only%20-%20Area%2022B%20v0.259) | [Portal URL](https://portal.battlefield.com/bf6/experience/rules/script?id=5eb320e0-e8f3-11f0-93bf-bee0dd082586&teams=0) |

**Primary features**:
- Round and Tank destruction based scoring - choose your experience configuration: 1v1, 2v2, 3v3 or 4v4
- Only Tank Kills count when the Round is Live (no infantry guns, weapons or gadgets)
- HUD displays Wins/Losses/Ties and Round/Total Kills with match time remaining
- Ready up in your main base -> wait for countdown -> fight 
    - Triple tap your interact keybind to access the Ready Up screen
- Automatic respawn/resets and Round win screens
- Automatic Map victory screen with match results summarized
- Main-base entry/exit tracking with gadget ammo restock and pre-round "over-line" warnings.
  
**Important / Known Limitations**:
- If you don't see a "Vehicle Registration" message pop up when entering your vehicle, get out and get back in! 
    - This vehicle registration is required to ensure accuracy of scoring
    - If you play a live round and notice improper kill records, adjust with the Admin panel (see below)
- Custom Portal experiences cannot edit vehicle loadouts once in-game. If needed, you should reconnect to reconfigure and then rejoin. 
    - Choose, select and activate your optimal/desired MBT, IFV and Engineer class loadouts before joining!
    - If you have issues spawning in, ensure Combat Engineer subclass is chosen when deploying
- If you die during a live round, please wait in your main base until the round finishes.
- If your tank blows up but you don't die, please redeploy to your main base (don't chase enemy tanks with your repair torch).
- Tanks play as they do in Vanilla BF6 right now, we are playtesting changes to health regen or considering loadout restritions. 
    - We and are open to feedback as we playtest possible balance changes/limitations

**Additional Tanks Only Features**:
- Only the Engineer's repair torch and supply crates are allowed as gadgets
- You can repair your tank during combat, or drop a supply crate for ammo but don't stray too far
    - Tanks are "abandoned" and slowly lose health if you get too far from them
- HUD Helper text to give context on Round state and player readiness
- Ready up screen to force all combatants to remain in the main base before Round begins
    - Players are shown as "In Main Base / Not In Main" or "Ready / Not Ready" 
    - Toggle maximum rounds, e.g. decide between "Best of 3 Rounds" or "Best of 7 Rounds", or any desired limit
- Resupply your ammo crates at main base if needed
- Team swap via a single button with forced undeploy from Ready Up screen
- If you leave your main base early, a global notification is displayed, and any Round countdowns are ceased, to ensure map positioning is fair at round start

**Admin Panel**:
- This is an experience in active development, so when issues are discovered - the Admin panel can be used for adjusting round kills, total kills, round wins, ties, etc
- Admin Panel is accessed via a top right button while the Ready Up dialog is visible
- The Admin panel has global audit messaging and admin action counts 
    - Opening the Admin panel gives a global notification, while using the Admin panel buttons displays a message and increments an action counter
    - If any Admin buttons are used, the final victory dialog shows this for awareness/visibility to prevent malicious or sneaky scoreboard tweaks

**Forking / Copying these experiences**:
- MIT License: https://github.com/Teamwarfare-Network/bf6-portal/blob/main/LICENSE
- Reference the URL for the experience, then duplicate it
- Reference the Source Code provided, and make changes locally


If you like this experience, check out the 2v2 Tanks Ladder at TWL: https://teamwarfare.net/ The ladder is open!


These are the outdated/old codes. Use these ONLY if the new codes up top do not work!
| Old v0.129 Codes | Map Name
|---------|--------|
| **ZKBX5** | All 7 Maps 
| **ZKBXE** | Blackwell Fields 
| **ZKBXK** | Defense Nexus
| **ZKBYZ** | Operation Firestorm
| **ZKBYF** | Manhattan Bridge
| **ZKBYP** | Golf Course
| **ZKBZ4** | Liberation Peak
| **ZKBZK** | Mirak Valley
