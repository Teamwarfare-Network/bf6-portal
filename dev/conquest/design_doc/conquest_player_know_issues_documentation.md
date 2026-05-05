# TWL Conquest — Known Issues

Working list of player-visible issues we're currently tracking.

> Internal tracking, full investigation history, and resolved-issue archive live in [`conquest_issues.md`](./conquest_issues.md) / [`conquest_issues_summary.md`](./conquest_issues_summary.md).

---

### [Open] Godot Spawner: Cannot spawn directly on flag B in a specific ownership state
Only occurs when a team owns flag B and flag C but not flag A? This is an underlying Godot spawner limitation quirk. Full fix is expected to occur with a planned custom player spawner system in the future. A cascading failure here can mean Air Deploy or Forward deploy spawns can also fail - to avoid this vehicle spawn failure ensure you have the HQ selected first. *(Bug #100)*

### [Fixed - Needs MP Testing] Match script can terminate at very high player counts due to memory leak
Rare, under active investigation and being addressed (Currently resolved with ~24 players? Needs verification on higher player counts). *(Bug #109)*

### Spectate / Coach button is disabled
Reserved for a future build - this is intentionally greyed out on both the Player Ready Up Panel and the full Ready Dialog. *(by design)*
