/**
 * Prebuild script: sync @feature-tagged imports in src/index.ts with compile-time
 * feature flag constants in src/config/conquest-constants.ts.
 *
 * For each import line tagged with `// @feature FEATURE_NAME`:
 *   - If the flag is true  → uncomment the import (enable)
 *   - If the flag is false → comment out the import (disable)
 *
 * This runs before the bundler so changing a constant and rebuilding is all that's needed.
 */

const fs = require("fs");
const path = require("path");

const constantsPath = path.resolve(__dirname, "..", "src", "config", "conquest-constants.ts");
const indexPath = path.resolve(__dirname, "..", "src", "index.ts");

// Parse FEATURE_* constants from conquest-constants.ts.
function parseFeatureFlags(source) {
    const flags = {};
    const regex = /const\s+(FEATURE_\w+)\s*=\s*(true|false)\s*;/g;
    let match;
    while ((match = regex.exec(source)) !== null) {
        flags[match[1]] = match[2] === "true";
    }
    return flags;
}

// Process index.ts: toggle imports based on their @feature tag.
function syncImports(source, flags) {
    return source.replace(/^(\/\/ )?(import\s+['"].*?['"];?\s*\/\/\s*@feature\s+(\w+).*)$/gm,
        (fullMatch, commentPrefix, importContent, flagName) => {
            const enabled = flags[flagName];
            if (enabled === undefined) {
                console.warn(`  prebuild: unknown feature flag "${flagName}" — leaving line unchanged`);
                return fullMatch;
            }
            if (enabled) {
                // Uncomment: strip leading "// " if present
                return importContent;
            } else {
                // Comment out: add "// " prefix if not already commented
                return commentPrefix ? fullMatch : "// " + importContent;
            }
        }
    );
}

// Main
const constantsSource = fs.readFileSync(constantsPath, "utf8");
const flags = parseFeatureFlags(constantsSource);
const flagEntries = Object.entries(flags);

if (flagEntries.length === 0) {
    console.log("prebuild: no FEATURE_* flags found — skipping");
    process.exit(0);
}

console.log("prebuild: feature flags:");
for (const [name, enabled] of flagEntries) {
    console.log(`  ${name} = ${enabled}`);
}

const indexSource = fs.readFileSync(indexPath, "utf8");
const updated = syncImports(indexSource, flags);

if (updated !== indexSource) {
    fs.writeFileSync(indexPath, updated);
    console.log("prebuild: updated index.ts imports");
} else {
    console.log("prebuild: index.ts imports already in sync");
}
