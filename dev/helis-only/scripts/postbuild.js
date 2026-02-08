/**
 * Post-build script: cleans bundler artifacts so the output matches
 * the original monolith format expected by the BF6 Portal editor.
 *
 * 1. Removes all `// @ts-nocheck` lines (top-level + per-module)
 * 2. Restores the full Modlib region with its import statement
 */

const fs = require("fs");
const path = require("path");

const bundlePath = path.resolve(__dirname, "..", "dist", "bundle.ts");
let src = fs.readFileSync(bundlePath, "utf8");

// Normalize to LF so matching works on Windows (CRLF) and Linux (LF)
src = src.replace(/\r\n/g, "\n");

// 1. Remove every `// @ts-nocheck` line (and its trailing newline)
src = src.replace(/^\/\/ @ts-nocheck\n/gm, "");

// 2. Restore the truncated Modlib region header + import.
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

fs.writeFileSync(bundlePath, src);
console.log("postbuild: removed @ts-nocheck lines and restored modlib import");
