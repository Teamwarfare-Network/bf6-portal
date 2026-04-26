# Plan: Block Apply Configuration while late-joiner warm-prime is in flight (#105)

**Created:** 2026-04-26
**Issue:** [`#105 CQ_Bug_HardCrash_LateJoiner_ApplyConfig`](./conquest_issues.md)
**Reported:** v1.380. Pre-LIVE phase. Hard server-process crash with no visible error log. Scenario: one or more late-joiners + another player applying map configuration changes (and possibly team-swapping) at the same time.

---

## Context

User intuition (matches the codebase trace): "we're changing the configuration out from under the late joiner while they load or cache the UI."

Apply Configuration's per-player rebuild paths (deploy-timer HUD, world-interactable icons, vehicle slot retype) iterate via `forEachValidPlayer` and operate on every connected pid. A late-joiner whose own `prebuildAllUiFamiliesHidden` is mid-flight has a partially-populated UI cache — some widget handles cached, others uninitialized. When Apply Config's parallel rebuild touches that pid's widgets, the late-joiner's prebuild and the apply's rebuild collide on the same widget tree without a mutex between them. Engine-level invalid-handle operations on a half-built widget tree (or `mod.UnspawnObject` on a half-wired runtime spawn) are documented hard-crash patterns.

The fix per user direction (2026-04-26): **refuse Apply Configuration while any player still has a warm-prime in flight, with player-visible feedback.** Ship as v1.381.

---

## Files to modify

- [`src/state/runtime-types.ts`](../src/state/runtime-types.ts) — add `warmPrimeActiveByPid: Record<number, boolean>` to the players sub-state.
- [`src/state/runtime-state.ts`](../src/state/runtime-state.ts) — initialize new field to `{}`.
- [`src/interaction/actions.ts`](../src/interaction/actions.ts) — wrap `prebuildAllUiFamiliesHidden` body in `try { warmPrimeActiveByPid[pid] = true; ... } finally { delete warmPrimeActiveByPid[pid]; }` so the flag clears even on early-return / disconnect.
- [`src/ready-dialog/mode-config-presets.ts`](../src/ready-dialog/mode-config-presets.ts) — at the top of `confirmReadyDialogModeConfig`, count active warm-primes; if > 0, emit a world-log notification with the count and return early.
- [`src/index/player-join-leave.ts`](../src/index/player-join-leave.ts) — clear `warmPrimeActiveByPid[pid]` in the leave-cleanup path so a stuck flag from a disconnected player can't permanently block applies.
- [`src/strings.json`](../src/strings.json) — new player-facing string `twl.readyDialog.applyBlockedLoading` (user-approved 2026-04-26).

---

## Change set

### 1. State field

Add to `State.players.warmPrimeActiveByPid: Record<number, boolean>` next to the existing `armO`/`armT` cluster.

### 2. Set/clear flag in the warm-prime path

Wrap `prebuildAllUiFamiliesHidden` body in `try { warmPrimeActiveByPid[pid] = true; ... } finally { delete ...[pid]; }`. The `finally` block guarantees the flag clears even if the player disconnects or an inner `await` throws.

Also clear in `player-join-leave.ts` cleanup so a disconnected-mid-warm pid doesn't leak the flag.

### 3. Guard at Apply Config entry

At the top of `confirmReadyDialogModeConfig`:
```ts
const activeWarmCount = Object.keys(State.players.warmPrimeActiveByPid).length;
if (activeWarmCount > 0) {
    sendHighlightedWorldLogMessage(
        mod.Message(mod.stringkeys.twl.readyDialog.applyBlockedLoading, activeWarmCount),
        true,
        undefined,
        mod.stringkeys.twl.readyDialog.applyBlockedLoading,
    );
    return;
}
```
The dialog state remains "Unsaved changes" so the user can press Apply again once the loaders settle.

### 4. New string-key (user-approved 2026-04-26)

Add to `strings.json` under `twl.readyDialog`:
```json
"applyBlockedLoading": "Cannot apply: {0} player(s) still loading"
```
Constant: `STR_READY_DIALOG_APPLY_BLOCKED_LOADING` (or fit the existing `string-keys.ts` naming).

### 5. Issue tracker

Log new issue `CQ_Bug_HardCrash_LateJoiner_ApplyConfig` (#105) in `conquest_issues.md` and the summary file. Status at ship: **Resolved (pending MP confirm)**.

---

## Bundle / build impact

- ~1 new state field, ~1 new string-key, ~10 lines of guard code, ~5 lines of init/cleanup.
- Estimated: **+200–300 bytes**. Headroom at v1.380 is 14,456 bytes (1.38%) — comfortable.

---

## What this does NOT cover

This is a **single-step targeted fix matching user intuition.** It does not cover:

- **A late-joiner whose warm-prime starts AFTER Apply Configuration begins.** If a join lands during the ~1-2 second window where Apply Config's rebuild iterations are running, the guard does not protect — Apply already passed its check, the new joiner's flag goes up after the check. If the crash recurs after this ship, that's the secondary suspect zone — symmetric guard would be: have the warm-prime path also check `applyConfigInFlight` and yield/wait. Capture as a follow-up if needed.
- **Team-swap mid-Apply.** Team swap also runs its own loading-gate. The same logic could extend to refuse team-swap-during-Apply, but the user's reported crash specifically called out late-joiner so we focus there.
- **Generic instrumentation.** No diagnostic world-log sentinels added in this iteration. If the crash recurs, the recommendation is to ship Phase A diagnostics as v1.382 to capture forensic logs.

---

## Verification

### Build / typecheck
1. Apply changes; bump version: `npm run bumpVersion -- -c "guard Apply Configuration against concurrent late-joiner warm-prime to prevent hard server crash (#105)"`.
2. `npm run build` PASS; capture bundle delta and headroom.
3. `cmd /c npx tsc --pretty false --noEmit` exit 0.

### Behavioral tests

**No-regression (single-player):**
1. Open Ready Dialog. Press Apply. Confirm config applies as before — no false "Cannot apply" message.
2. Verify `warmPrimeActiveByPid[pid]` is `true` immediately after deploy and clears once warm completes.

**Bug-fix path (multiplayer):**
3. Two players. Player A joins (clean). Player B presses Apply. Confirm Apply succeeds.
4. Two players. Player A joins (mid-warm). Within the warm window, Player B presses Apply. Confirm the world-log shows "Cannot apply: 1 player(s) still loading"; Apply does NOT mutate state; "Unsaved changes" indicator remains. Player A finishes warm. Player B presses Apply again. Confirm Apply succeeds the second time.
5. Repro the original 64p+ scenario (multiple late joiners + Apply + team swaps). Confirm no hard server crash.

**Disconnect resilience:**
6. Player A joins, gets stuck mid-warm (force a short network drop / reconnect). Confirm `warmPrimeActiveByPid[A]` clears via the player-leave cleanup OR the `finally` block. Apply by Player B is not permanently blocked.

### Issue tracker
- Log #105 with full implementation summary at ship time.
- Mark status `Resolved (pending MP confirm)` in `conquest_issues_summary.md`.
- If the crash recurs in MP after this ship: re-open + ship the secondary guard (warm-prime-during-Apply detection) as v1.382.
