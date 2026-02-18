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
let src = fs.readFileSync(bundlePath, "utf8");

// Normalize to LF so matching is stable on Windows and Linux.
src = src.replace(/\r\n/g, "\n");

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

// 10. Ensure single trailing newline.
src = src.replace(/\n+$/, "\n");

fs.writeFileSync(bundlePath, src);
console.log("postbuild: cleaned bundle.ts (removed markers, incorporated modlib source, moved EOF footer last)");

// 11. Replace bundle.strings.json with source strings.json (preserve original formatting).
const stringsPath = path.resolve(__dirname, "..", "dist", "bundle.strings.json");
const sourceStrings = path.resolve(__dirname, "..", "src", "strings.json");
if (fs.existsSync(stringsPath) && fs.existsSync(sourceStrings)) {
  const stringsContent = fs.readFileSync(sourceStrings, "utf8").replace(/\r\n/g, "\n");
  fs.writeFileSync(stringsPath, stringsContent);
  console.log("postbuild: replaced bundle.strings.json with source copy");
}
