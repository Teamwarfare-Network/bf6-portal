/**
 * Build verification: compares bundle output against the ground-truth
 * experience files. Exits with code 1 on mismatch so it can gate the build.
 */

const fs = require("fs");
const path = require("path");

const distDir = path.resolve(__dirname, "..", "dist");
const truthDir = path.resolve(
  __dirname, "..", "..", "..",
  "bf6-portal", "experiences", "TWL Helis Only v0.621", "logic_scripts"
);

const pairs = [
  {
    label: "Script (bundle.ts)",
    built: path.join(distDir, "bundle.ts"),
    truth: path.join(truthDir, "TWL_Vehicles_Only_Script.ts"),
  },
  {
    label: "Strings (bundle.strings.json)",
    built: path.join(distDir, "bundle.strings.json"),
    truth: path.join(truthDir, "TWL_Vehicles_Only_Strings.json"),
  },
];

let allPassed = true;

for (const { label, built, truth } of pairs) {
  if (!fs.existsSync(built)) {
    console.error(`FAIL [${label}]: Build output not found — ${built}`);
    allPassed = false;
    continue;
  }
  if (!fs.existsSync(truth)) {
    console.error(`FAIL [${label}]: Ground truth not found — ${truth}`);
    allPassed = false;
    continue;
  }

  // Normalize CRLF on both sides so Windows ground-truth files compare cleanly
  const builtContent = fs.readFileSync(built, "utf8").replace(/\r\n/g, "\n");
  const truthContent = fs.readFileSync(truth, "utf8").replace(/\r\n/g, "\n");

  if (builtContent === truthContent) {
    console.log(`PASS [${label}]: Byte-for-byte match`);
    continue;
  }

  // Mismatch — find the first differing line for debugging
  allPassed = false;
  const builtLines = builtContent.split("\n");
  const truthLines = truthContent.split("\n");

  console.error(`FAIL [${label}]: Content mismatch`);
  console.error(`  Built:  ${builtLines.length} lines`);
  console.error(`  Truth:  ${truthLines.length} lines`);

  const maxLines = Math.max(builtLines.length, truthLines.length);
  for (let i = 0; i < maxLines; i++) {
    const b = builtLines[i];
    const t = truthLines[i];
    if (b !== t) {
      console.error(`  First difference at line ${i + 1}:`);
      console.error(`    Built: ${JSON.stringify(b)}`);
      console.error(`    Truth: ${JSON.stringify(t)}`);
      break;
    }
  }
}

if (allPassed) {
  console.log("\nAll files match ground truth.");
} else {
  process.exit(1);
}
