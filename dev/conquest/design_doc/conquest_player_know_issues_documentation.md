# TWL Conquest — Known Issues

Working list of player-visible issues we're currently tracking.

> Internal tracking, full investigation history, and resolved-issue archive live in [`conquest_issues.md`](./conquest_issues.md) / [`conquest_issues_summary.md`](./conquest_issues_summary.md).

---

### [Open] Godot Spawner: Cannot spawn directly on flag B in a specific ownership state
Only occurs when a team owns flag B and flag C but not flag A? This is an underlying Godot spawner limitation quirk. Full fix is expected to occur with a planned custom player spawner system in the future. A cascading failure here can mean Air Deploy or Forward deploy spawns can also fail - to avoid this vehicle spawn failure ensure you have the HQ selected first. *(Bug #100)*

### [Fixed - Needs MP Testing] Console Specific Players: deploy screen vehicle spawn buttons overriden by soldier deploy
When Console or controller users used Air Deploy, Forward Deploy or HQ Deploy, they would otherwise spawn on foot due to the engine deploy mechanism eating the button selection first. If this does still occur, the on-foot purple-smoke workaround still works as a backup option. *(Bug #113)*

### [Fixed - Needs MP Testing] Match script can terminate at very high player counts due to memory limitations
Rare, under active investigation and being addressed (Currently resolved with ~24 players, needs verification on higher player counts). *(Bug #109)*

### [Fixed - Needs MP Testing] Possible brief frame stutter on heavy deploy activity
Hitch seems possible when multiple players try to HQ / Forward / Air Deploy in the same window. (Resolved, but needs validation  with >24 players). *(Bug #29)*

### Spectate / Coach button is disabled
Reserved for a future build - this is intentionally greyed out on both the Player Ready Up Panel and the full Ready Dialog. *(by design)*
