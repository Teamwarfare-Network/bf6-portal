/**
 * Build verification for conquest development.
 *
 * Default behavior:
 * - Verifies local build artifacts exist and are readable.
 * - Verifies bundle.strings.json parses as JSON.
 * - Does NOT fail on ground-truth diffs (expected for conquest divergence).
 *
 * Optional strict mode:
 * - Set VERIFY_GROUND_TRUTH=1 (or true/yes/on) to re-enable byte-for-byte
 *   comparison against the legacy ground-truth files.
 */

const fs = require("fs");
const path = require("path");

const distDir = path.resolve(__dirname, "..", "dist");
const truthDir = path.resolve(
  __dirname, "..", "..", "..",
  "bf6-portal", "experiences", "TWL Helis Only v0.621", "logic_scripts"
);

const strictTruthCompare = /^(1|true|yes|on)$/i.test(
  process.env.VERIFY_GROUND_TRUTH || ""
);

const builtFiles = [
  { label: "Script (bundle.ts)", built: path.join(distDir, "bundle.ts") },
  { label: "Strings (bundle.strings.json)", built: path.join(distDir, "bundle.strings.json") },
];

const truthPairs = [
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

for (const { label, built } of builtFiles) {
  if (!fs.existsSync(built)) {
    console.error(`FAIL [${label}]: Build output not found - ${built}`);
    allPassed = false;
    continue;
  }

  try {
    const content = fs.readFileSync(built, "utf8");
    if (!content || content.length === 0) {
      console.error(`FAIL [${label}]: Build output is empty`);
      allPassed = false;
      continue;
    }
  } catch (err) {
    console.error(`FAIL [${label}]: Could not read build output - ${err.message}`);
    allPassed = false;
    continue;
  }

  console.log(`PASS [${label}]: Build output exists`);
}

const stringsPath = path.join(distDir, "bundle.strings.json");
if (fs.existsSync(stringsPath)) {
  try {
    JSON.parse(fs.readFileSync(stringsPath, "utf8"));
    console.log("PASS [Strings JSON]: Valid JSON");
  } catch (err) {
    console.error(`FAIL [Strings JSON]: Invalid JSON - ${err.message}`);
    allPassed = false;
  }
}

if (strictTruthCompare) {
  for (const { label, built, truth } of truthPairs) {
    if (!fs.existsSync(built)) {
      console.error(`FAIL [${label}]: Build output not found - ${built}`);
      allPassed = false;
      continue;
    }
    if (!fs.existsSync(truth)) {
      console.error(`FAIL [${label}]: Ground truth not found - ${truth}`);
      allPassed = false;
      continue;
    }

    // Normalize CRLF on both sides so Windows ground-truth files compare cleanly.
    const builtContent = fs.readFileSync(built, "utf8").replace(/\r\n/g, "\n");
    const truthContent = fs.readFileSync(truth, "utf8").replace(/\r\n/g, "\n");

    if (builtContent === truthContent) {
      console.log(`PASS [${label}]: Byte-for-byte match`);
      continue;
    }

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
}

if (!strictTruthCompare) {
  console.log("\nGround-truth comparison is disabled for conquest.");
  console.log("Set VERIFY_GROUND_TRUTH=1 to re-enable strict truth checking.");
}

if (allPassed) {
  console.log("\nVerification passed.");
  process.exit(0);
}

process.exit(1);
