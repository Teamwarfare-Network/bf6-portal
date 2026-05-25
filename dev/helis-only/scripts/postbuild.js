/**
 * Post-build script: clean bundler artifacts so output matches BF6 Portal editor expectations.
 *
 * 1) Normalize CRLF -> LF
 * 2) Remove `// @ts-nocheck`
 * 3) Remove bundler SOURCE markers and Module comments
 * 4) Normalize blank lines / trailing newline
 * 5) Incorporate src/foundation/modlib.ts block directly into bundle
 * 6) Move EOF metadata footer to the very end
 * 7) Replace dist strings with source strings.json formatting
 */

const fs = require("fs");
const path = require("path");

const bundlePath = path.resolve(__dirname, "..", "dist", "bundle.ts");
const headerSourcePath = path.resolve(__dirname, "..", "src", "header-file.ts");
let src = fs.readFileSync(bundlePath, "utf8");

// Normalize to LF so matching is stable on Windows and Linux.
src = src.replace(/\r\n/g, "\n");
src = src.replace(/﻿/g, "");

// 1. Remove every `// @ts-nocheck` line.
src = src.replace(/^\/\/ @ts-nocheck\n/gm, "");

// 2. Remove bundler output header line.
src = src.replace(/^\/\/ --- BUNDLED TYPESCRIPT OUTPUT ---\n\n/, "");

// 3. Remove all source marker lines (supports / and \ path separators).
src = src.replace(/^\/\/ --- SOURCE: src[\\/].*\.ts ---\n/gm, "");

// 4. Remove all `// Module: ...` marker lines.
src = src.replace(/^\/\/ Module: .+\n/gm, "");

// 5. Trim leading blank lines.
src = src.replace(/^\n+/, "");

// 6. Collapse runs of 5+ newlines down to 4.
src = src.replace(/\n{5,}/g, "\n\n\n\n");

// 7. Ensure single trailing newline.
src = src.replace(/\n+$/, "\n");

// 8. Incorporate src/foundation/modlib.ts directly (bundler currently truncates this section).
const modlibSourcePath = path.resolve(__dirname, "..", "src", "foundation", "modlib.ts");
if (fs.existsSync(modlibSourcePath)) {
  let modlibSource = fs.readFileSync(modlibSourcePath, "utf8").replace(/\r\n/g, "\n");
  modlibSource = modlibSource.replace(/﻿/g, "");
  modlibSource = modlibSource.replace(/^\/\/ @ts-nocheck\n/gm, "");
  modlibSource = modlibSource.replace(/^\/\/ Module: .+\n/gm, "");
  modlibSource = modlibSource.replace(/^\n+/, "");
  modlibSource = modlibSource.replace(/\n+$/, "\n");

  // Remove any existing truncated or stale modlib section from the bundled output.
  src = src.replace(
    /^\/\/#region -------------------- Modlib import --------------------\n[\s\S]*?\/\/#endregion ----------------- Modlib import --------------------\n?/m,
    ""
  );
  src = src.replace(
    /^\/\/ TS project comes with local modlib functions, if using that then no need to import modlib\n\/\/ - There seems to be an error with TS template's project local modlib FilteredArray function \(drops all vehicles in vehicle array\?!\)\n\n\/\/#endregion ----------------- Modlib import --------------------\n?/m,
    ""
  );

  // Insert the exact source block after the header/changelog comment regions.
  // Preferred anchor: end of "Portal Naming Notes". Fallback: right before gameplay constants.
  const portalNamingEnd = "//#endregion -------------------- Portal Naming Notes --------------------\n";
  const constantsStart = "//#region -------------------- Constant, Enums and Types --------------------\n";
  let insertIndex = -1;

  const portalIndex = src.indexOf(portalNamingEnd);
  if (portalIndex >= 0) {
    insertIndex = portalIndex + portalNamingEnd.length;
  } else {
    const constantsIndex = src.indexOf(constantsStart);
    if (constantsIndex >= 0) {
      insertIndex = constantsIndex;
    }
  }

  if (insertIndex >= 0) {
    const before = src.slice(0, insertIndex).replace(/\n+$/, "\n\n");
    const after = src.slice(insertIndex).replace(/^\n+/, "\n");
    src = before + modlibSource + "\n" + after;
  } else {
    // Last resort if anchors drift in future edits.
    src = modlibSource + "\n" + src.replace(/^\n+/, "");
  }
}

// 9. Ensure EOF metadata always appears at end of file.
const eofFooterRegexSingle = /\/\/#region -------------------- EOF Metadata --------------------\n[\s\S]*?\/\/#endregion -------------------- EOF Metadata --------------------\n?/m;
const eofFooterRegexAll = /\/\/#region -------------------- EOF Metadata --------------------\n[\s\S]*?\/\/#endregion -------------------- EOF Metadata --------------------\n?/gm;
const footerSourcePath = path.resolve(__dirname, "..", "src", "footer-file.ts");

let eofFooterFromSource = "";
if (fs.existsSync(footerSourcePath)) {
  eofFooterFromSource = fs.readFileSync(footerSourcePath, "utf8").replace(/\r\n/g, "\n");
  eofFooterFromSource = eofFooterFromSource.replace(/﻿/g, "");
  eofFooterFromSource = eofFooterFromSource.replace(/^\/\/ @ts-nocheck\n/gm, "");
  eofFooterFromSource = eofFooterFromSource.replace(/^\/\/ Module: .+\n/gm, "");
  eofFooterFromSource = eofFooterFromSource.replace(/^\n+/, "");
  eofFooterFromSource = eofFooterFromSource.replace(/\n+$/, "\n");
}

const eofFooterMatch = src.match(eofFooterRegexSingle);
const eofFooter = eofFooterMatch ? eofFooterMatch[0].replace(/\n+$/, "\n") : eofFooterFromSource;
if (eofFooter) {
  src = src.replace(eofFooterRegexAll, "");
  src = src.replace(/\n+$/, "\n\n\n\n") + eofFooter;
}

// 10. Strip full-line comments from the emitted bundle to preserve headroom.
//     Preserve TS directive comments (@ts-nocheck / @ts-ignore / @ts-expect-error).
src = src.replace(/^[ \t]*\/\/(?!\s*@ts-(?:nocheck|ignore|expect-error)\b).*\n/gm, "");
src = src.replace(/\n{3,}/g, "\n\n");

// 10a. Strip standalone /* ... */ block comments (single-line and multi-line).
//      Only matches blocks where /* is at line start (with optional leading whitespace) AND
//      */ is at line end (with optional trailing whitespace before the newline).
//      Inline blocks that share a line with code (e.g. `() => { /* swallow */ }`) are
//      preserved by the at-line-start + at-line-end constraints.
src = src.replace(/^[ \t]*\/\*[\s\S]*?\*\/[ \t]*\n/gm, "");

// 10c. Strip leading whitespace (indentation) from every line.
//      BF6 Portal engine ignores indentation; removing it reclaims ~150 KB of bundle headroom.
//      Applied after comment stripping so that pass doesn't leave behind indentation-whitespace
//      on now-blank lines.
//      Safe because the bundle has no multi-line template literals or string literals whose
//      content depends on leading whitespace.
src = src.replace(/^[ \t]+/gm, "");

// 10d. Collapse consecutive blank lines to a single blank line.
//      After stripping comments and indentation, many blank-line runs accumulate.
src = src.replace(/\n{3,}/g, "\n\n");

// Restore full header block (versioning / license / attribution) at the very top of the bundle.
// Comment-strip pass at step 10 above removes line-leading // comments from the bundle body, so
// the header content has already been wiped from the concatenated source by this point. Re-inject
// it AFTER the strip so the license/attribution survives. Strip @ts-nocheck and // Module: lines
// from the header source (they're build-time directives, not bundle content). Also strip lines
// starting with `// *policy` — these are source-only project conventions documenting versioning
// rules, not content meant for the shipped bundle. Pattern: any leading whitespace + `//` +
// optional whitespace + `*policy` + anything to end of line.
let headerContent = "";
if (fs.existsSync(headerSourcePath)) {
  let headerSource = fs.readFileSync(headerSourcePath, "utf8").replace(/\r\n/g, "\n");
  headerSource = headerSource.replace(/﻿/g, "");
  headerSource = headerSource.replace(/^\/\/ @ts-nocheck\n/gm, "");
  headerSource = headerSource.replace(/^\/\/ Module: .+\n/gm, "");
  headerSource = headerSource.replace(/^[ \t]*\/\/\s*\*policy[^\n]*\n/gm, "");
  headerSource = headerSource.replace(/\n{3,}/g, "\n\n");
  headerSource = headerSource.replace(/^\n+/, "");
  headerSource = headerSource.replace(/\n+$/, "\n");
  headerContent = headerSource;
}
let footerVersionLine = "";
if (fs.existsSync(footerSourcePath)) {
  const footerSource = fs.readFileSync(footerSourcePath, "utf8").replace(/\r\n/g, "\n");
  const footerMatch = footerSource.match(/^\/\/ EOF version: .+$/m);
  footerVersionLine = footerMatch ? footerMatch[0] : "";
}
src = `${headerContent ? `${headerContent}\n` : ""}${src.replace(/^\n+/, "")}`;
if (footerVersionLine) {
  src = src.replace(/\n+$/, "\n") + footerVersionLine + "\n";
}

// 11. Ensure single trailing newline.
src = src.replace(/\n+$/, "\n");

// 11.5. Sanity check: Portal sandbox rejects scripts containing non-ASCII characters
//       SILENTLY at load time (no console error, no event handlers register, no functionality).
//       Hit in v1.498 via a single em-dash in an inline comment after a delete statement
//       that survived the comment-strip pass at step 10. Fail the build hard so the offending
//       bundle never ships. Common offenders are em-dash, en-dash, smart quotes, arrows,
//       and non-breaking space.
//       Strings with non-ASCII content belong in src/strings.json, which the engine handles
//       via mod.Message and is not subject to this constraint.
const nonAsciiMatch = src.match(/[^\x00-\x7F]/);
if (nonAsciiMatch) {
  const idx = src.indexOf(nonAsciiMatch[0]);
  const before = src.substring(0, idx);
  const lineNumber = before.split("\n").length;
  const lineStart = before.lastIndexOf("\n") + 1;
  const lineEndIdx = src.indexOf("\n", idx);
  const line = src.substring(lineStart, lineEndIdx === -1 ? src.length : lineEndIdx);
  const codePoint = nonAsciiMatch[0].codePointAt(0).toString(16).toUpperCase().padStart(4, "0");
  console.error("postbuild: ERROR - non-ASCII character found in dist/bundle.ts at line " + lineNumber);
  console.error("  Character: U+" + codePoint + " (" + nonAsciiMatch[0] + ")");
  console.error("  Line: " + line);
  console.error("  Portal sandbox rejects scripts with non-ASCII characters SILENTLY (no runtime error).");
  console.error("  Fix: replace with ASCII equivalent. Common offenders: em-dash, en-dash, smart quotes, arrows.");
  console.error("  Note: full-line // comments are stripped at step 10, but inline comments after code are PRESERVED.");
  process.exit(1);
}

fs.writeFileSync(bundlePath, src);
console.log("postbuild: cleaned bundle.ts (removed markers, incorporated modlib source, moved EOF footer last)");

// 12. Replace bundle.strings.json with source strings.json (preserve original formatting).
const stringsPath = path.resolve(__dirname, "..", "dist", "bundle.strings.json");
const sourceStrings = path.resolve(__dirname, "..", "src", "strings.json");
if (fs.existsSync(stringsPath) && fs.existsSync(sourceStrings)) {
  const stringsContent = fs.readFileSync(sourceStrings, "utf8").replace(/\r\n/g, "\n");
  fs.writeFileSync(stringsPath, stringsContent);
  console.log("postbuild: replaced bundle.strings.json with source copy");
}
