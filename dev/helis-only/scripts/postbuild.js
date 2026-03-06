/**
 * Post-build script: cleans bundler artifacts so the output matches
 * the original monolith format expected by the BF6 Portal editor.
 *
 * 1. Normalizes CRLF → LF
 * 2. Removes all `// @ts-nocheck` lines
 * 3. Removes bundler markers (BUNDLED header, SOURCE lines, Module comments)
 * 4. Trims leading blank lines, collapses excessive blanks, normalizes trailing newline
 * 5. Restores the full Modlib region with its import statement
 * 6. Replaces bundle.strings.json with the source copy (preserves original formatting)
 */

const fs = require("fs");
const path = require("path");

const bundlePath = path.resolve(__dirname, "..", "dist", "bundle.ts");
let src = fs.readFileSync(bundlePath, "utf8");

// Normalize to LF so matching works on Windows (CRLF) and Linux (LF)
src = src.replace(/\r\n/g, "\n");

// 1. Remove every `// @ts-nocheck` line (and its trailing newline)
src = src.replace(/^\/\/ @ts-nocheck\n/gm, "");

// 2. Remove the BUNDLED TYPESCRIPT OUTPUT header at the top of the file
src = src.replace(/^\/\/ --- BUNDLED TYPESCRIPT OUTPUT ---\n\n/, "");

// 3. Remove all `// --- SOURCE: src/*.ts ---` marker lines (supports / and \ paths)
src = src.replace(/^\/\/ --- SOURCE: src[\\/].*\.ts ---\n/gm, "");

// 4. Remove all `// Module: ...` comment lines
src = src.replace(/^\/\/ Module: .+\n/gm, "");

// 5. Trim leading blank lines
src = src.replace(/^\n+/, "");

// 6. Collapse runs of 5+ consecutive newlines down to 4 (preserves ≤3-blank-line gaps)
src = src.replace(/\n{5,}/g, "\n\n\n\n");

// 7. Ensure single trailing newline
src = src.replace(/\n+$/, "\n");

// 8. Restore the truncated Modlib region header + import.
//    The bundler strips the import and truncates the region comment to:
//      //#region -------------------- Modlib \n
//    Replace it with the original block.
const truncated =
  "//#region -------------------- Modlib \n" +
  "// TS project comes with local modlib functions, if using that then no need to import modlib\n" +
  "// - There seems to be an error with TS template's project local modlib FilteredArray function (drops all vehicles in vehicle array?!)";

const restored =
  "//#region -------------------- Modlib import --------------------\n" +
  "\n" +
  "// If not using bundled TS project you need to use modlib import\n" +
  "// @ts-ignore - ignores error on Portal webclient with importing modlib\n" +
  "import * as modlib from \"modlib\";\n" +
  "// TS project comes with local modlib functions, if using that then no need to import modlib\n" +
  "// - There seems to be an error with TS template's project local modlib FilteredArray function (drops all vehicles in vehicle array?!)";

if (!src.includes(truncated)) {
  console.error("ERROR: Could not find truncated Modlib region in bundle — has the bundler output changed?");
  process.exit(1);
}

src = src.replace(truncated, restored);

// 9. Ensure EOF metadata always appears at the very end of the script.
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
const eofFooter = eofFooterMatch
  ? eofFooterMatch[0].replace(/\n+$/, "\n")
  : eofFooterFromSource;
if (eofFooter) {
  src = src.replace(eofFooterRegexAll, "");
  // Match canonical formatting: three empty lines before EOF metadata.
  src = src.replace(/\n+$/, "\n\n\n\n") + eofFooter;
}

// 10. Ensure single trailing newline.
src = src.replace(/\n+$/, "\n");

fs.writeFileSync(bundlePath, src);
console.log("postbuild: cleaned bundle.ts (removed markers, restored modlib import, moved EOF footer last)");

// 11. Replace bundle.strings.json with the source copy.
//    The bundler re-serializes with 4-space indent, but the ground truth has
//    non-standard indentation that JSON.stringify can't reproduce. Since there's
//    only one strings.json, just copy the source file with CRLF normalized.
const stringsPath = path.resolve(__dirname, "..", "dist", "bundle.strings.json");
const sourceStrings = path.resolve(__dirname, "..", "src", "strings.json");
if (fs.existsSync(stringsPath) && fs.existsSync(sourceStrings)) {
  const stringsContent = fs.readFileSync(sourceStrings, "utf8").replace(/\r\n/g, "\n");
  fs.writeFileSync(stringsPath, stringsContent);
  console.log("postbuild: replaced bundle.strings.json with source copy");
}
