# Compile-Time Feature Flag File Exclusion

**Version:** v1.120
**Date:** 2026-04-08
**Bundle before (v1.113):** 1,039,753 bytes (8,823 headroom)
**Bundle current (v1.120):** 981,088 bytes (67,488 headroom)
**Net savings:** 58,665 bytes

---

## Overview

Four compile-time feature flags control whether developer/debug UI features are included in the final bundle. When set to `false`, associated source files are excluded from the bundler's dependency walk, and all external call sites are guarded with `if (FEATURE_*)` checks that become dead code.

**Flags defined in:** `src/config/conquest-constants.ts`

```typescript
const FEATURE_PERF_DIAG = false;       // Performance diagnostic HUD
const FEATURE_POSITION_DEBUG = true;   // Coordinate display (interleaved in admin-panel)
const FEATURE_ADMIN_PANEL = false;     // Admin panel UI/HUD
const FEATURE_JOIN_PROMPT = false;     // Join loading overlay
```

---

## How It Works

The bundler (`bf6-portal-bundler`) walks import statements from `src/index.ts`. Files not imported are never visited and never included in `dist/bundle.ts`.

**Automated via prebuild script (v1.115):** `scripts/prebuild.js` runs before the bundler on every `npm run build`. It reads the `FEATURE_*` constants from `conquest-constants.ts` and auto-comments/uncomments the matching `// @feature`-tagged import lines in `index.ts`.

**To toggle a feature:** Change the constant in `conquest-constants.ts` and rebuild. That's it.

```typescript
// conquest-constants.ts — change this:
const FEATURE_PERF_DIAG = true;   // was false

// Then: npm run build
// prebuild.js auto-uncomments the tagged imports, bundler includes the files.
```

Import lines in `index.ts` are tagged with inline annotations:
```typescript
// import './hud/perf-diag'; // @feature FEATURE_PERF_DIAG
```

The `// @feature FEATURE_NAME` suffix links each import to its flag. The prebuild script matches these tags and toggles the comment prefix. All external call sites are also wrapped in `if (FEATURE_*)` runtime guards that become no-ops when the flag is `false`.

---

## Feature 1: Performance Diagnostic HUD (`FEATURE_PERF_DIAG`)

**Default: FALSE** | **Source bytes: 16,676** | **Files: 2**

| File | Bytes |
|------|-------|
| `src/hud/perf-diag.ts` | 15,136 |
| `src/hud/ui-cache-perf.ts` | 1,540 |

**Import lines (commented out in index.ts):**
```typescript
// import './hud/ui-cache-perf';
// import './hud/perf-diag';
```

**Guarded call sites:**

| File | Line | Function | Guard |
|------|------|----------|-------|
| `src/index/game-mode.ts` | 106 | `_pd` assignment | `FEATURE_PERF_DIAG && State.admin.perfDiagEnabled` |
| `src/index/player-join-leave.ts` | 11 | `resetUiCachePerfCountersForPid` | `if (FEATURE_PERF_DIAG)` |
| `src/index/player-join-leave.ts` | 208 | `cleanupPerfDiagWidgetsForPid` | `if (FEATURE_PERF_DIAG)` |
| `src/interaction/actions.ts` | 376 | `ensurePerfDiagWidgetsForPlayer` | `if (FEATURE_PERF_DIAG)` |
| `src/vehicles/deploy-timer-ui.ts` | 1101-1105 | `incrementUiCachePerfCounter` (3 calls) | `if (FEATURE_PERF_DIAG)` block |
| `src/vehicles/deploy-timer-ui.ts` | 1819 | `incrementUiCachePerfCounter` | `FEATURE_PERF_DIAG && !isUsable...` |
| `src/interaction/ammo-resupply-menu.ts` | 944-958 | `incrementUiCachePerfCounter` (5 calls) | `if (FEATURE_PERF_DIAG)` blocks |
| `src/interaction/ammo-resupply-menu.ts` | 1768 | `incrementUiCachePerfCounter` | `FEATURE_PERF_DIAG && !armCacheOk...` |
| `src/ready-dialog/dialog-build.ts` | 97-98 | `incrementUiCachePerfCounter` (2 calls) | `if (FEATURE_PERF_DIAG)` block |
| `src/ready-dialog/dialog-build.ts` | 108 | `incrementUiCachePerfCounter` | `FEATURE_PERF_DIAG && !isUsable...` |
| `src/ready-dialog/lifecycle.ts` | 145 | `incrementUiCachePerfCounter` | `if (FEATURE_PERF_DIAG)` |

**Impact:** None. Purely diagnostic. All perf counters become no-ops and the HUD panel is never created.

---

## Feature 2: Coordinate Display / Position Debug (`FEATURE_POSITION_DEBUG`)

**Default: TRUE** | **Source: interleaved in admin-panel/build.ts (~120 lines)**

Position debug code cannot be independently file-excluded — it is interleaved in `admin-panel/build.ts`. When admin panel is excluded, position debug is also excluded. The flag is informational for now.

**State references** in `player-deploy.ts`, `vehicle-events.ts`, `deploy-fulfillment.ts`, `player-join-leave.ts`, `id-helpers.ts` are harmless property assignments/reads with no side effects when the feature is absent.

---

## Feature 3: Admin Panel UI/HUD (`FEATURE_ADMIN_PANEL`)

**Default: FALSE** | **Source bytes: 43,174** | **Files: 4**

| File | Bytes |
|------|-------|
| `src/admin-panel/build.ts` | 27,222 |
| `src/admin-panel/events.ts` | 8,114 |
| `src/admin-panel/visibility.ts` | 6,894 |
| `src/ui/admin/action-counter.ts` | 944 |

**Import lines (commented out in index.ts):**
```typescript
// import './ui/admin/action-counter';
// import './admin-panel/events';
// import './admin-panel/build';
// import './admin-panel/visibility';
```

**Guarded call sites:**

| File | Line | Function | Guard |
|------|------|----------|-------|
| `src/interaction/actions.ts` | 115 | `isAdminPanelWarmForPid` | `FEATURE_ADMIN_PANEL ? ... : true` |
| `src/interaction/actions.ts` | 326 | `prebuildAdminPanelWhileHidden` | `if (FEATURE_ADMIN_PANEL)` |
| `src/interaction/actions.ts` | 368-375 | `renderAdminUiFamilyForReveal` body | `if (FEATURE_ADMIN_PANEL)` block |
| `src/interaction/ui-events.ts` | 15 | `tryHandleAdminTesterButtonEvent` | `FEATURE_ADMIN_PANEL && ...` |
| `src/interaction/ui-events-ready.ts` | 191-199 | `toggleReadyDialogAdminPanel` | `if (FEATURE_ADMIN_PANEL)` block |
| `src/ready-dialog/lifecycle.ts` | 60-63 | `deleteAdminPanelUI` + `setAdminPanelChildWidgetsVisible` | `FEATURE_ADMIN_PANEL && adminPanelBuilt` |
| `src/ready-dialog/lifecycle.ts` | 120-123 | `deleteAdminPanelUI` + `deletePositionDebugWidgetsForPid` | `if (FEATURE_ADMIN_PANEL)` block |
| `src/ui/conquest/top-hud-shell.ts` | 198 | `buildConquestAdminActionCounterWidget` (cache) | `FEATURE_ADMIN_PANEL && ...` |
| `src/ui/conquest/top-hud-shell.ts` | 218 | `buildConquestAdminActionCounterWidget` (cold) | `if (FEATURE_ADMIN_PANEL)` |
| `src/ui/conquest/top-hud-shell.ts` | 227 | `setAdminPanelActionCountText` | `if (FEATURE_ADMIN_PANEL)` |
| `src/index/game-mode.ts` | 88 | `updateAdminPanelActionCountForAllPlayers` | `if (FEATURE_ADMIN_PANEL)` |

**What still works without admin panel:**
- Auto-start match: `startPregameCountdown()` defined in `countdown-flow.ts` — NOT in admin panel
- Match end (ticket bleed): `endMatch()` defined in `conquest-flow.ts` — NOT in admin panel
- Ready dialog: Ready/cancel/swap buttons in `ui-events-ready.ts` — unaffected
- Victory dialog: `actionCount` display self-hides when count is 0
- Loading gate warm: `isAdminPanelWarmForPid` stubbed to `true` — gate releases faster

**What is lost:** Manual admin-override buttons (clock reset, match length, force start/end, perf diag toggle, position debug toggle, deploy timers toggle, gadget timer reset).

---

## Feature 4: Join Prompt / Tips (`FEATURE_JOIN_PROMPT`)

**Default: FALSE** | **Source bytes: 313 (stubs)** | **Files: 3 stubs**

As of v1.120, the loading overlay was extracted into `src/ready-dialog/loading-overlay.ts` (always included, 6.7K). The three join-prompt files are now empty stubs reserved for future tip/prompt features. `FEATURE_JOIN_PROMPT` controls only these stubs — the loading screen works regardless of the flag.

| File | Bytes | Status |
|------|-------|--------|
| `src/ready-dialog/join-prompt-ids.ts` | 105 | Stub |
| `src/ready-dialog/join-prompt-layout.ts` | 104 | Stub |
| `src/ready-dialog/join-prompt-events.ts` | 104 | Stub |
| `src/ready-dialog/loading-overlay.ts` | 6,737 | **Always included** (not behind flag) |

**Always-included loading overlay functions** (no guards needed):
- `showLoadingOverlayForPlayer(player)` — shows "SCRIPT LOADING" overlay during warm gate
- `hideLoadingOverlayForPlayerId(pid)` — hides overlay without destroying widgets
- `clearLoadingOverlayForPlayerId(pid)` — destroys all overlay widgets
- `joinPromptRootName(pid)` — widget ID helper (name preserved for runtime compatibility)

**No guarded call sites remain.** All loading overlay calls in `actions.ts`, `player-join-leave.ts`, and `deploy-timer-ui.ts` are unconditional.

**Impact:** Loading overlay always appears during the warm gate. Setting `FEATURE_JOIN_PROMPT = false` has no visible effect (stubs are empty). When tips are implemented in the future, they will live in the stub files behind this flag.

---

## Rollback

To restore all features to their pre-v1.114 state:

1. Set all 4 constants to `true` in `conquest-constants.ts`
2. Run `npm run build` — the prebuild script auto-uncomments all tagged imports

The `if (FEATURE_*)` guards remain in the code but evaluate to `true`, adding negligible overhead (boolean check per call).

---

## Bundle Size Summary

| Metric | v1.113 (before flags) | v1.114 (flags added) | v1.120 (overlay extracted) |
|--------|----------------------|---------------------|--------------------------|
| Bundle size | 1,039,753 | 980,620 | 981,088 |
| Headroom | 8,823 | 67,956 | 67,488 |
| Delta vs v1.113 | — | -59,133 | -58,665 |

---

## Test Plan

### SP Test (features excluded):
- Deploy → HUD shows correctly (no perf diag panel, no action counter, no admin toggle button)
- Ready dialog opens/closes normally (admin panel button absent, all other buttons work)
- Team swap + redeploy → loading gate works (deploy blocked until warm, loading overlay appears)
- Ready button toggles, match auto-starts when all ready
- No runtime errors or undefined function crashes

### Re-enable Test (all flags TRUE, imports uncommented):
- All features restored and functional
- Build passes, bundle under limit
- Admin panel opens, perf diag works, join prompt stubs load without error
