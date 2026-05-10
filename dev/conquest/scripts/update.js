/**
 * One-click dependency update: bumps minor/patch versions and reinstalls.
 */

const { execSync } = require("child_process");

const cwd = require("path").resolve(__dirname, "..");

console.log("Checking for dependency updates (minor/patch only)...\n");

try {
  execSync("npx npm-check-updates -u --target minor", { cwd, stdio: "inherit" });
} catch {
  console.error("npm-check-updates failed — are you online?");
  process.exit(1);
}

console.log("\nInstalling updated dependencies...\n");

try {
  execSync("npm install", { cwd, stdio: "inherit" });
} catch {
  console.error("npm install failed.");
  process.exit(1);
}

console.log("\nDependencies updated. Run `npm run build` to verify the build.");
