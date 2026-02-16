// @ts-nocheck
// Module: File header, versioning, license, attribution, gamemode description

//#region -------------------- Versioning --------------------

// version: 0.028 | Date: 02.16.26 | Time: 21:30 UTC
// version policy header file: src/header-file.ts
// version policy footer file: src/footer-file.ts
// version policy strings file: src/strings.json
// policy: the string hud.branding.title should display this same version at the end of the title
// policy: increment minor version on every change (UTC)
// policy: major versions reserved for milestone feature releases (primary authors only)
// policy: EOF version line must match the header version and timestamp

//#endregion ----------------- Versioning --------------------



//#region ----------------- License --------------------

// MIT License
// 
// Copyright (c) 2026 teamwarfare.net, uberdubersoldat, polykatana
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

//#endregion ----------------- License --------------------



//#region -------------------- Authors / Attribution --------------------

// Authors: UberDuberSoldat, Polynorblu, Dox
// Code generation, assistance and support by: ChatGPT (OpenAI, GPT-5.2, GPT-5.2-Codex)
//
// This code is sourced controlled here: https://github.com/Teamwarfare-Network/bf6-portal/tree/main
//
// BF6 Portal Community Tools used/referenced:
//  - Portal Community Discord: https://discord.com/invite/battlefield-portal-community-870246147455877181
//  - TypeScript Project Template for Battlefield 6 Portal Scripting by Mike DeLuca: https://github.com/deluca-mike/bf6-portal-scripting-template
//     - Multi-Click detector by Mike DeLuca: https://github.com/deluca-mike/bf6-portal-utils/tree/master/interact-multi-click-detector
//     - Map detector by Mike DeLuca: https://github.com/deluca-mike/bf6-portal-utils/tree/master/map-detector
//  - Team Switch UI Template by TheOzzy: https://github.com/The0zzy/BF6-Portal-TeamSwitchUI
//  - BF6 Portal Assistant by Quoeiza: https://chatgpt.com/g/g-68f28580eefc8191b4cf40bbf2305db3-bf6-portal-assistant
//     - GPT Prompt: https://gist.github.com/Quoeiza/8085f142ad8a05ee04b79adcc4ad8fd7
//  - BF6 User Interface Tool builder by EagleNait: https://tools.bfportal.gg/ui-builder/
//  - Custom Conquest Template by andy6170: https://bfportal.gg/experiences/custom-conquest-template/
//  - Asset Browser by WillToth: https://bf6props.pages.dev/ -- https://github.com/The-Sir-Community/prop_stats/releases/tag/v1.1.2.0

//#endregion ----------------- Authors / Attribution --------------------



//#region -------------------- Gamemode Description --------------------

// This script implements:
//   - Triple-tap "Ready Up" flow (roster, READY toggle, base-gated pre-live readiness)
//   - Continuous live match clock and player-facing top-center HUD status text
//   - Admin panel controls focused on match-clock management and mode start/end actions
//   - Team switching via a single "Swap Teams" button (forces undeploy)
//   - Map configuration runtime (map detect, spawn specs, team naming, ceiling defaults)
//   - Join prompt flow and end-of-match victory/map-end dialog
//
// Glossary (terms):
// - "HUD": always-on per-player overlay (cached by pid).
// - "Dialog": modal UI that enables UI input mode (Team Switch / Victory).
// - "Ready Up": pre-live state where active players set READY before the mode is started.
// - "Continuous live": once started, the mode remains live until explicitly ended.
// - "Map config": per-map base anchors, team names, spawn specs, and ceiling defaults.
//
// Glossary (script semantics)
// - T1 / T2: The two competing teams in this mode; UI may still use Left/Right for layout only.
// - Authoritative state: The single source of truth for mode-critical values; HUD is a projection of that state.
// - Player caches: per-player UI widget refs and per-player readiness/deploy state maps.
//
// Recommendations on tweaking/adjusting/customizing this experience
// - General UI layout tip: Most widgets define an offset via `position: [x, y]`.
// - Change those numbers to nudge that widget relative to its anchor; the perceived direction can vary by anchoring, so verify in-game after edits.
// - Match-clock tuning lives under ROUND_CLOCK_*/ADMIN_ROUND_LENGTH_* constants.

//#endregion -------------------- Gamemode Description --------------------



