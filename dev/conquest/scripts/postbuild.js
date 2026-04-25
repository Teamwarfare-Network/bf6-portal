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
src = src.replace(/\uFEFF/g, "");

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
  modlibSource = modlibSource.replace(/\uFEFF/g, "");
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
  eofFooterFromSource = eofFooterFromSource.replace(/\uFEFF/g, "");
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

// 10b. Dead-code strip: remove code guarded by false compile-time flags.
// The Portal compiler does not evaluate const-false branches, so references inside
// `if (false) foo()` still produce "Cannot find name" errors. Strip them here.
//
// Strategy: two passes. Pass 1 collects FEATURE_* false flags and does inline replacements
// (which may create new `const x = false` values like _pd). Pass 2 re-scans for any
// newly-false consts and strips their `if` blocks too.
{
  function collectFalseFeatureConsts(code) {
    const consts = new Set();
    const regex = /\bconst\s+(FEATURE_\w+)\s*=\s*false\s*;/g;
    let m;
    while ((m = regex.exec(code)) !== null) consts.add(m[1]);
    return consts;
  }

  function collectAllFalseConsts(code, seeds) {
    const consts = new Set(seeds);
    // After inline replacements, scan for any `const <id> = false;` that match known patterns
    const regex = /\bconst\s+(_pd)\s*=\s*false\s*;/gm;
    let m;
    while ((m = regex.exec(code)) !== null) consts.add(m[1]);
    return consts;
  }

  function inlineReplace(code, falsyConsts) {
    const lines = code.split("\n");
    const out = [];
    for (const line of lines) {
      let edited = line;
      for (const flag of falsyConsts) {
        const F = flag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        // Ternary: (FLAG ? expr : fallback) → (fallback)
        edited = edited.replace(new RegExp("\\(" + F + " \\? [^:]+:\\s*([^)]+)\\)", "g"), "($1)");
        // Compound: FLAG && expr → false (stop before ; , and newline)
        edited = edited.replace(new RegExp("\\b" + F + " &&\\s*[^;,\\n]+", "g"), "false");
        // Negated compound: !(FLAG && expr) → true
        edited = edited.replace(new RegExp("!\\(" + F + " &&[^)]+\\)", "g"), "true");
      }
      out.push(edited);
    }
    return out.join("\n");
  }

  function stripDeadBlocks(code, falsyConsts) {
    const lines = code.split("\n");
    const out = [];
    let skipDepth = 0;
    let skipBraced = false;

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();

      if (skipDepth > 0 && skipBraced) {
        for (const ch of trimmed) {
          if (ch === "{") skipDepth++;
          else if (ch === "}") skipDepth--;
        }
        if (skipDepth <= 0) { skipDepth = 0; skipBraced = false; }
        continue;
      }
      if (skipDepth > 0 && !skipBraced) {
        skipDepth = 0;
        continue;
      }

      const ifMatch = trimmed.match(/^if\s*\((\w+)\b/);
      if (ifMatch && falsyConsts.has(ifMatch[1])) {
        if (trimmed.includes("{")) {
          skipDepth = 0;
          for (const ch of trimmed) {
            if (ch === "{") skipDepth++;
            else if (ch === "}") skipDepth--;
          }
          skipBraced = true;
          if (skipDepth <= 0) { skipDepth = 0; skipBraced = false; }
        } else if (trimmed.endsWith(";")) {
          // Complete single-line `if (FLAG) body;` — body is on same line, skip only this line.
        } else {
          // Body is on the next line: `if (FLAG)\n    body;`
          skipDepth = 1;
          skipBraced = false;
        }
        continue;
      }
      out.push(lines[i]);
    }
    return out.join("\n");
  }

  // Pass 1: FEATURE_* flags — block stripping first (handles `if (FLAG && expr) {` cleanly),
  // then inline replacements for non-block usages (assignments, ternaries).
  const featureFlags = collectFalseFeatureConsts(src);
  if (featureFlags.size > 0) {
    src = stripDeadBlocks(src, featureFlags);
    src = inlineReplace(src, featureFlags);

    // Pass 2: pick up derived consts that became false (e.g. _pd) and strip their blocks.
    // Also strip literal `if (false)` blocks produced by inline replacement.
    const allFalsy = collectAllFalseConsts(src, featureFlags);
    allFalsy.add("false");
    // Fix broken double-parens from inline replacement: `if (false))` → `if (false)`
    src = src.replace(/\bif\s*\(false\)\)/g, "if (false)");
    src = stripDeadBlocks(src, allFalsy);

    console.log("postbuild: stripping dead code for false consts: " + [...allFalsy].filter(c => c !== "false").join(", "));
    src = src.replace(/\n{3,}/g, "\n\n");
  }
}
let headerVersionLine = "";
if (fs.existsSync(headerSourcePath)) {
  const headerSource = fs.readFileSync(headerSourcePath, "utf8").replace(/\r\n/g, "\n");
  const headerMatch = headerSource.match(/^\/\/ version: .+$/m);
  headerVersionLine = headerMatch ? headerMatch[0] : "";
}
let footerVersionLine = "";
if (fs.existsSync(footerSourcePath)) {
  const footerSource = fs.readFileSync(footerSourcePath, "utf8").replace(/\r\n/g, "\n");
  const footerMatch = footerSource.match(/^\/\/ EOF version: .+$/m);
  footerVersionLine = footerMatch ? footerMatch[0] : "";
}
src = `${headerVersionLine ? `${headerVersionLine}\n` : ""}${src.replace(/^\n+/, "")}`;
if (footerVersionLine) {
  src = src.replace(/\n+$/, "\n") + footerVersionLine + "\n";
}

// 11. Ensure single trailing newline.
src = src.replace(/\n+$/, "\n");

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
