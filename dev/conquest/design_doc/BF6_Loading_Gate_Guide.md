# Battlefield 6 Portal Loading Gate Guide

## Overview

This guide defines a reliable pattern for holding players at the deploy
screen while your script initializes, then releasing them safely. It
focuses on determinism, user feedback, and fail-safe behavior.

------------------------------------------------------------------------

## Core Principles

### 1) Use the Right Gate

-   **Primary gate (deploy screen):**
    -   `mod.EnablePlayerDeploy(player, false)`
-   **Secondary polish (post-spawn):**
    -   `mod.EnableAllInputRestrictions(player, true)` (short duration
        only)

> Do not rely on input restriction to keep players on the deploy screen.

------------------------------------------------------------------------

### 2) Avoid Blind Delays

Do not use fixed waits like `await mod.Wait(10)` as your only condition.

Instead, define explicit readiness flags: - `globalInitDone` -
`playerUiBuilt[playerId]` - `playerUiWarmed[playerId]` -
`playerReleased[playerId]`

**Release condition:**

    globalInitDone && playerUiBuilt[id] && playerUiWarmed[id]

------------------------------------------------------------------------

### 3) Always Include a Fallback

Add a hard timeout:

    if (elapsed >= timeoutSeconds) releasePlayer(player)

This guarantees no player gets permanently locked.

------------------------------------------------------------------------

### 4) Single Release Function (Idempotent)

All release paths must call the same function.

Responsibilities: - Hide loading UI - Clear input restrictions - Enable
deploy - Mark player as released

Must safely handle multiple calls.

------------------------------------------------------------------------

## UI Strategy

### Build Once, Update Often

-   Create loading UI once per player
-   Use:
    -   `mod.SetUITextLabel()`
    -   `mod.SetUIWidgetVisible()`

Avoid: - Recreating widgets repeatedly - Frequent UI destruction

------------------------------------------------------------------------

### Suggested Loading States

-   "Custom Scripts Loading..."
-   "Initializing systems..."
-   "Building UI..."
-   "Finalizing..."

Optional timeout message: - "Loading took too long. Continuing..."

------------------------------------------------------------------------

## Initialization Structure

### Global Initialization

Run in `OnGameModeStarted`: - Game state - VFX / SFX - Objectives -
Shared systems

Set:

    globalInitDone = true

------------------------------------------------------------------------

### Player Initialization

Run in `OnPlayerJoinGame`: 1. Disable deploy 2. Set redeploy time 3.
Create loading UI 4. Start guarded wait loop

------------------------------------------------------------------------

## Guarded Wait Loop

Pseudo-flow:

    while (player valid):
        if ready:
            releasePlayer()
            break

        if timeout:
            releasePlayer()
            break

        await mod.Wait(0.25)

------------------------------------------------------------------------

## Optional Post-Spawn Lock

In `OnPlayerDeployed`:

    mod.EnableAllInputRestrictions(player, true)
    await mod.Wait(0.5)
    mod.EnableAllInputRestrictions(player, false)

Use only if needed for final UI settling.

------------------------------------------------------------------------

## Cleanup

### On Player Leave

-   Remove player state
-   Clear UI references
-   Prevent ID reuse bugs

------------------------------------------------------------------------

## Best Practices

-   Separate **global** and **per-player** setup
-   Use **idempotent release logic**
-   Validate player each loop
-   Keep UI lightweight
-   Use short polling intervals (0.25-0.5s)

------------------------------------------------------------------------

## Anti-Patterns to Avoid

-   Blind fixed delays
-   Rebuilding UI every tick
-   No timeout fallback
-   Multiple release paths
-   Using input restriction as primary gate
-   Not cleaning up player state

------------------------------------------------------------------------

## Minimal Implementation Flow

### OnGameModeStarted

    globalInitDone = false
    // setup...
    globalInitDone = true

### OnPlayerJoinGame

    EnablePlayerDeploy(false)
    create loading UI
    start wait loop

### Wait Loop

    if ready -> release
    if timeout -> release

### Release

    hide UI
    EnablePlayerDeploy(true)
    mark released

------------------------------------------------------------------------

## Key Insight

There is no engine-level "UI fully loaded" signal.\
You define readiness yourself using controlled steps and short
stabilization waits.

------------------------------------------------------------------------

## Current Conquest Findings

- Verified per-player controls:
  - `EnablePlayerDeploy(player, deployAllowed)`
  - `SetRedeployTime(player, redeployTime)`
  - `EnableAllInputRestrictions(player, restricted)`
- Verified global control:
  - `SetSpawnMode(spawnModes)`
- Current Conquest `src` does not call `SetSpawnMode(...)` / `AutoSpawn`.
- Current playtests show:
  - loading overlay timing is improving
  - menu warmth is improving
  - but first-join deploy and movement are still not being blocked authoritatively
- That means the next debugging step is not another broad UI rewrite.
- The next debugging step is a narrow first-join deploy-release audit:
  - record every place deploy becomes enabled
  - confirm whether `OnPlayerDeployed` can still arrive while unreleased
  - confirm whether the undeploy/input-restriction fallback wins that race

------------------------------------------------------------------------

## Conquest Implementation Guardrails

These rules exist to stop the loading-gate work from drifting into broad,
hard-to-debug lifecycle changes.

### 1) First Join Comes Before Team Swap

- Prove the first-join deploy contract first.
- Do not broaden work to team-swap parity until first join is proven.
- Team swap should later reuse the same contract, not invent a second one.

### 2) Instrument Before Changing Behavior Again

Before another deploy/spawn fix is attempted, instrument these points:

- `OnPlayerJoinGame`
- deploy enable/disable ownership
- `OnPlayerDeployed`
- `OnPlayerUndeploy`
- input restriction on/off
- forced undeploy attempts

Record:

- player id
- loading session id / reason
- gate active / released state
- deploy enabled state
- overlay shown state
- input restriction state
- undeploy attempt time
- whether the player still reached world state

### 3) Use a Small State Machine

The first-join loading path should be readable in one pass.

Recommended ownership split:

- `beginJoinLoadingGate(...)`
- `holdPlayerAtDeploy(...)`
- `handlePlayerDeployedBeforeRelease(...)`
- `releaseJoinLoadingGate(...)`

For Conquest specifically:

- first join should be a single-stage pre-deploy gate
- do not split first join into a join-only in-world finalize stage
- generic warm helpers may decide readiness, but they must not authorize join deploy
- only `releaseJoinLoadingGate(...)` should own the final first-join deploy release
- first join should also own a dedicated deploy-lock latch from join start until release
- generic refresh/undeploy/finalize paths must not clear that deploy-lock latch

Each function should have a short comment describing:

- purpose
- ordering constraints
- side effects

### 4) Do Not Chase Global Spawn Settings Without Proof

- `SetSpawnMode(...)` is global and should not be changed speculatively.
- Current Conquest `src` does not use `SetSpawnMode(...)` / `AutoSpawn`.
- If global spawn-mode work is revisited, it must be justified by
  measured evidence, not inference.

### 5) Separate UI Warm From Deploy Authority

These are related but not identical concerns:

- UI warm/caching decides when the player should be released.
- deploy authority decides whether the player can reach world state.
- post-deploy input restriction is a backup safety net, not the primary
  deploy gate.

If deploy is still leaking, solve that race directly before adding more
UI-warm complexity.

Current Conquest corrective rule:

- the BF6 deploy APIs are already proven to work in this project
- if first join still leaks, treat it as script-side early release ownership
- fix the release owner, not the API choice
- latest tightened read:
  - generic warm state and join deploy authority should be separated
  - use a dedicated join deploy-lock latch so generic warm helpers cannot accidentally release deploy
  - treat UI readiness as a script-owned handshake, not a one-pass cache check:
    - create/build the owned widget tree
    - force a visible or writable pass
    - wait `1-2` frames
    - write visibility/content again
    - require a few stable polls after visible reveal before deploy release
  - if the real first-open cost still only exists after spawn, hand off into a short post-deploy finalize under full input restriction:
    - deploy may occur
    - movement/input must remain blocked
    - release only after the real first-open prime has completed

### 6) Separate Overlay Lifecycle From Deploy Authority

This became a concrete failure in Conquest team-swap work.

Do not use one helper that both:

- shows the loading overlay
- enforces deploy blocking

Why:

- deploy authority is often reasserted from many paths:
  - wait loops
  - undeploy handlers
  - recapture fallbacks
  - ongoing maintenance
- overlay visibility should not be re-shown from all of those paths

Required contract:

- one loading session has:
  - one authoritative show owner
  - one authoritative hide owner
- any other path may:
  - keep deploy blocked
  - keep input restricted
  - force undeploy
- but may not re-show the overlay just because it is reasserting authority

If this is violated, the usual failure modes are:

- flicker
- hide then come back
- no-show because the single-show budget was consumed too early

------------------------------------------------------------------------

## Final Recommendation

Treat loading as a **state machine**, not a delay.

This makes your experience: - Predictable - Debuggable - Safe from
deadlocks
