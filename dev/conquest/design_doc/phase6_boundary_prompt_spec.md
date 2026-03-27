# Phase 6 Boundary Prompt Spec

Status: Filled implementation baseline with one deferred flow question
Scope: One-off fill-in doc for Phase 6 warning/popup behavior

## Purpose

Use this document to lock the exact prompt behavior for the Phase 6 boundary systems before implementation.

This document should define:
- player-facing text
- countdown presentation
- visual placement
- color/severity treatment
- refresh cadence
- clear/cancel behavior
- fail-state text

This document should not redefine the already-accepted gameplay rules unless explicitly intended.

## Implementation Alignment Notes

- This prompt spec is now the Phase 6 UX baseline for boundary warnings.
- The current Conquest source still has a legacy pre-live `takeoff-gating` helper file, but the active main-base rule is now driven by Godot-authored main-base trigger geometry rather than a separate script Y gate.
- Phase 6 implementation should align the active pre-live main-base rule to this spec, which currently says:
  - force the violating player back to `NOT READY`
  - do not cancel the countdown for now
  - defer the exact countdown-start interaction behavior for later design
- Main-base core and main-base buffer vertical containment are authored in Godot and should be tuned there.
- Ground-combat-zone vertical containment is also authored in Godot; the only script-side exemption is that aircraft are exempt from the grounded out-of-bounds rule.
- Boundary prompts should reuse one unified per-player cached prompt family as much as possible rather than introducing separate ad-hoc widget owners per rule.
- First-pass implementation now includes the cached offender-local center prompt family, timer formatting, per-player visibility/cleanup ownership, kill-on-expiry behavior, and an offender-only `SFX_Alarm` prototype; final acceptance of that warning sound still depends on human review.

## Locked Gameplay Rules

These rules are already accepted in the main design doc and should be treated as implementation constraints unless deliberately changed:

1. Enemy main-base buffer
- active during live play
- entering or remaining in the enemy main-base buffer starts a `3s` leave timer
  - player dies on expiry if still violating the boundary
  - live enemy protected territory is the union of:
  - the enemy main-base core trigger
  - the enemy main-base buffer trigger
- overlapping trigger exits must not clear the violation until the player is outside both

2. Ground combat zone
- applies only while grounded
- leaving or remaining outside the ground combat zone while grounded starts a `10s` return timer
- player dies on expiry if still violating the boundary

3. Own main-base restriction
- before the round is live, players may not leave their own main base
- this should integrate with the existing ready/pre-live flow without breaking it
- leaving or remaining outside your own main base pre-live starts a `10s` kill timer

## Shared Prompt Decisions

Fill these once if all Phase 6 prompts should behave the same way.

- Default placement: Center screen
- Default warning color: How would this be used? Color themes here will be Red, Dark Red, Black and White. 
- Default fail-state color: How would this be used? Color themes here will be Red, Dark Red, Black and White.
- Default countdown style: Countdown in seconds, from a configurable constant unique per prompt. Use the short format `Xs` such as `5s`, `4s`, `3s`, `2s`, `1s`.
- Default refresh cadence: Once per second, but goes away immediately on area trigger leaving, or appears immediately on trigger entering
- Default clear behavior: trigger area leaving
- Use sound/VO with these prompts?: I want to try to use the SFX_Alarm sound, but need to prototype it and hear it before finalizing this design choice. The sound should be heard only by the violating player. Here is example code to reference below. However - very closely reference the patterns we use on the SFX with the flags. There is very careful behavior here we want to maintain on proper patterns, construction, scheduling, ownership and teardown or deletion. Ensure you preview how this is done properly!

const alarm = mod.SpawnObject(
    mod.RuntimeSpawn_Common.SFX_Alarm,
    position,
    mod.CreateVector(0,0,0)
);

mod.EnableSFX(alarm, true);
mod.PlaySound(alarm, 80);

- Show a distinct final failure message after kill?: Just kill them. FUCK THEM, no message.

## Prompt 1: Pre-Live Own Main Base

### Trigger
- When should this appear exactly?: When leaving the main base they are assigned to. 
- Does it appear immediately on crossing the boundary or after a grace moment?: Immediately. 
- Does it apply to infantry only, all players, or all non-aircraft?: Pre-Live, this is for any condition. Players should not leave the main base before its live.

### Message
- Primary text: MATCH IS NOT LIVE: RETURN TO YOUR MAIN BASE!
- Optional secondary text: You will die in X seconds...
- Countdown text, if any: replace the X in the above text, every second. Count down from 10 (constant defined)

### Presentation
- Placement: Center
- Color/severity: Severe; Red/Dark Red, white and black accents.
- Font emphasis / size notes: Large text. In your face.
- Persistent while violating, or pulse once?: Persistent

### Timing
- Refresh cadence: Updates on triggers or once per second for counter
- Does the message change over time?: not except for counter
- Clear behavior when player returns: Dialog just goes away

### Failure Behavior
- Is this warning-only, forced-return, kill, or something else?: forced kill
- Final fail message, if applicable: N/A

### Notes
- Additional constraints: this would be unique per player, instanced per player. Ensure this is cached and can follow existing design patterns. Just toggle visibility of the dialog so its fasty and snappy. On first violation, also force the player back to NOT READY. If a pregame countdown is active, do not cancel it for now. Future behavior at the moment countdown starts is still deferred and needs later design.

## Prompt 2: Live Enemy Main-Base Buffer

### Trigger
- Exact start condition: Player enters the enemy main base buffer with a trigger, or remains inside the enemy main-base protected territory formed by the overlapping main-base core and buffer triggers
- Does re-entry restart the timer from full?: Yes
- Does the timer pause or fully clear when leaving the buffer?: The prompt fully clears when leaving the enemy protected territory.
- Does aircraft ignore this rule?: No
- Does being in a vehicle change this rule?: No. Current design applies this buffer rule to players on foot and players in vehicles alike.

### Message
- Primary text: ENEMY MAIN BASE OUT OF BOUNDS: LEAVE NOW!
- Optional secondary text: You will die in X seconds...
- Countdown text format: replace the X in the above text, every second. Count down from 3 (constant defined)

### Presentation
- Placement: Center
- Color/severity: Severe; Red/Dark Red, white and black accents.
- Font emphasis / size notes: Large text. In your face.
- Persistent while violating, or pulse once?: Persistent
- Any iconography: Yes, but explore existing UI patterns on how to do this properly! Do not ignore this! Try a white icon, with a black drop shadow. I want to use a warning icon here, here is some example, dont user verbatim though:

let icon = mod.AddUIImage(
    "warning_icon",
    mod.CreateVector(0, 0, 0),
    mod.CreateVector(50, 50, 0),
    mod.UIAnchor.Center,
    mod.UIImageType.Warning,
    player
);

mod.SetUIImageColor(icon, mod.CreateVector(0, 0, 0)); // use a white constant not a vector raw

### Timing
- Refresh cadence:  Updates on triggers or once per second for counter
- Do you want per-second countdown updates?: yes
- Clear behavior when safe again: yes

### Failure Behavior
- Final failure text after kill: None, just kill them
- Should the kill reason be explicit?: Not sure what this means. They can just be killed. If we're classifying this kill behind the scenes, we can make one for this "Enemy Buffer Zone Kill"? But I'm not sure this is needed.

### Notes
- Additional constraints: this would be unique per player, instanced per player. Ensure this is cached and can follow existing design patterns. Just toggle visibility of the dialog so its fasty and snappy. Unify this prompt family with the others as much as possible.

## Prompt 3: Ground Combat Zone

### Trigger
- Exact start condition: Leaving the Ground Combat Zone
- What qualifies as grounded for the prompt design intent?: Not in an aircraft, Helicopter or Plane. This includes skydiving being classified as "Grounded".
- Should the prompt disappear instantly when airborne?: The prompt should clear when the player is back inside the Godot-authored ground combat zone or when the player is in an aircraft.

### Message
- Primary text: YOU ARE OUT OF BOUNDS: RETURN NOW!
- Optional secondary text: You will die in X seconds...
- Countdown text format: replace the X in the above text, every second. Count down from 10 (constant defined)

### Presentation
- Placement: Center
- Color/severity: Severe; Red/Dark Red, white and black accents.
- Font emphasis / size notes: Large text. In your face.
- Persistent while violating, or pulse once?: Persistent
- Any iconography: Yes, but explore existing UI patterns on how to do this properly! Do not ignore this! Try a white icon, with a black drop shadow. I want to use a warning icon here, here is some example, dont user verbatim though:

let icon = mod.AddUIImage(
    "warning_icon",
    mod.CreateVector(0, 0, 0),
    mod.CreateVector(50, 50, 0),
    mod.UIAnchor.Center,
    mod.UIImageType.Warning,
    player
);

mod.SetUIImageColor(icon, mod.CreateVector(0, 0, 0)); // use a white constant not a vector raw

### Timing
- Refresh cadence:  Updates on triggers or once per second for counter
- Do you want per-second countdown updates?: yes
- Clear behavior when safe again: yes

### Failure Behavior
- Final failure text after kill: None, just kill them
- Should the kill reason be explicit?: Not sure what this means. They can just be killed. If we're classifying this kill behind the scenes, we can make one for this "Out of Bounds Kill"? But I'm not sure this is needed.

### Notes
- Additional constraints: this would be unique per player, instanced per player. Ensure this is cached and can follow existing design patterns. Just toggle visibility of the dialog so its fasty and snappy. Unify this prompt family with the others as much as possible.

## Consistency Rules

Use this section to define any shared rules that all three prompts must follow.

- Shared terminology: SFX
- Should prompts always say `main base`, `main base buffer`, or more player-friendly wording?: See above
- Should prompts use `death in N` language or softer wording until final seconds?: see above
- Should all countdown prompts use the same number formatting?: yes, use `Xs`
- Should all prompts use the same placement family?: yes, unify the prompt family as much as possible

## Open Questions

- Question 1: Finalize what should happen the moment a pregame countdown starts if a player then violates the pre-live own-main-base rule. This is explicitly deferred for later design.
- Question 2: Review the live offender-only `SFX_Alarm` prototype and decide whether it should remain the chosen warning sound.
- Question 3: Decide later whether pre-live countdown-affecting violations should also produce a global notice in addition to the offender-local center prompt.

## Acceptance Checklist

- [ ] Pre-live own-main-base prompt copy is approved
- [ ] Enemy main-base buffer prompt copy is approved
- [ ] Ground combat-zone prompt copy is approved
- [ ] Countdown format is approved
- [ ] Placement is approved
- [ ] Color/severity treatment is approved
- [ ] Clear/cancel behavior is approved
- [ ] Fail-state messaging is approved
- [ ] Prompt terminology is consistent across all three systems
