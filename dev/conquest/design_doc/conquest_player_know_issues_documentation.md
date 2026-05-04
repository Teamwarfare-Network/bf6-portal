# TWL Conquest — Known Issues

Working list of player-visible issues we're currently tracking.

> Internal tracking, full investigation history, and resolved-issue archive live in [`conquest_issues.md`](./conquest_issues.md) / [`conquest_issues_summary.md`](./conquest_issues_summary.md).

---

### [Open] Console Specific Players: deploy screen vehicle spawn buttons overriden by soldier deploy
When using a controller, while on the deploy screen, the buttons in the Vehicle Deploy menu (HQ Deploy, Forward Deploy, Air Deploy) don't activate correctly and instead spawn the soldier on foot. This is a known limitation with a workaround: deploy on foot in the HQ, then use the Purple Smoke Vehicle Redeploy menu instead. *(Bug #113)*

### [Open] Godot Spawner: Cannot spawn directly on flag B in a specific ownership state
Only occurs when your team owns flag B and flag C but not flag A. This is an underlying Godot spawner limitation. Full fix is expected to occur with a planned custom player spawner system in the future. *(Bug #100)*

### [Needs Testing] Match script can terminate at very high player counts due to memory limitations
Rare, under active investigation and being addressed (Currently resolved with ~24 players, needs verification on higher player counts). *(Bug #109)*

### [Needs Testing] Possible brief frame stutter on heavy deploy activity
Hitch seems possible when multiple players try to HQ / Forward / Air Deploy in the same window. (Under investigation, but possibly resolved with ~24 players, needs verification on higher player counts). *(Bug #29)*

### Spectate / Coach button is disabled
Reserved for a future build - this is intentionally greyed out on both the Player Ready Up Panel and the full Ready Dialog. *(by design)*
