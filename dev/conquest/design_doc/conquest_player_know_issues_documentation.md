# TWL Conquest — Known Issues

Working list of player-visible issues we're currently tracking. Rough first pass — copy is pending edit.

> Internal tracking, full investigation history, and resolved-issue archive live in [`conquest_issues.md`](./conquest_issues.md) / [`conquest_issues_summary.md`](./conquest_issues_summary.md).

---

### Match script may terminate at very high player counts
Rare, under active investigation. Major heap reductions have shipped; 24+ player MP playtest pending to confirm. *(internal #109)*

### Cannot spawn directly on flag B in a specific ownership state
Only occurs when your team owns flag B and flag C but not flag A. Underlying Godot spawner limitation — full fix is coming with our planned custom player spawner system. *(internal #100)*

### Possible brief frame stutter on heavy deploy activity
Hitch possible when multiple players HQ / Forward / Air Deploy in the same window. Under investigation. *(internal #29)*

### Console: deploy screen vehicle SPAWN buttons unresponsive
On controller, the SPAWN buttons in the Vehicle Deploy menu don't activate from the deploy screen. Workaround: deploy on foot anywhere, then triple-tap the purple smoke at HQ to open the same menu via the live terminal. *(internal #113)*

### Focus highlight missing on disabled gadget slot toggle buttons
Console / controller players navigating to a disabled prev/next button on the Supply Box top row get no visual cue. Cosmetic only. *(internal #99)*

### Spectate / Coach button is disabled
Reserved for a future build — appears greyed out on both the Player Ready Up Panel and the full Ready Dialog. *(by design in V1)*
