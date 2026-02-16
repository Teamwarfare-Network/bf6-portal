#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const headerPath = path.join(root, "src", "header-file.ts");
const footerPath = path.join(root, "src", "footer-file.ts");
const stringsPath = path.join(root, "src", "strings.json");
const changelogPath = path.join(root, "src", "Changelog.ts");

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function writeTextIfChanged(filePath, next) {
  const prev = readText(filePath);
  if (prev !== next) {
    fs.writeFileSync(filePath, next, "utf8");
    return true;
  }
  return false;
}

function extractVersion(src, regex, label) {
  const match = src.match(regex);
  if (!match) {
    throw new Error(`Could not read ${label} version.`);
  }
  return match[1];
}

function incrementVersion(version) {
  const match = version.match(/^(\d+)\.(\d+)$/);
  if (!match) {
    throw new Error(`Unsupported version format: ${version}`);
  }

  let major = Number(match[1]);
  const decimals = match[2];
  const width = decimals.length;
  const max = 10 ** width;
  let minor = Number(decimals) + 1;

  if (minor >= max) {
    major += Math.floor(minor / max);
    minor = minor % max;
  }

  return `${major}.${String(minor).padStart(width, "0")}`;
}

function resolveTargetVersion(rawArg, currentVersion) {
  if (!rawArg) {
    return incrementVersion(currentVersion);
  }

  if (!/^\d+\.\d+$/.test(rawArg)) {
    throw new Error(`Invalid target version: ${rawArg}`);
  }

  const expectedDecimals = currentVersion.split(".")[1].length;
  const [majorRaw, minorRaw] = rawArg.split(".");
  if (minorRaw.length !== expectedDecimals) {
    throw new Error(
      `Target version must keep ${expectedDecimals} digits after the decimal (got ${minorRaw.length}).`
    );
  }

  return `${Number(majorRaw)}.${minorRaw}`;
}

function utcStamp(now = new Date()) {
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  const yy = String(now.getUTCFullYear()).slice(-2);
  const hh = String(now.getUTCHours()).padStart(2, "0");
  const mi = String(now.getUTCMinutes()).padStart(2, "0");
  return {
    date: `${mm}.${dd}.${yy}`,
    time: `${hh}:${mi}`,
  };
}

function replaceOrThrow(src, regex, replacer, label) {
  const next = src.replace(regex, replacer);
  if (next === src) {
    throw new Error(`Could not update ${label}.`);
  }
  return next;
}

function updateBrandingTitleVersion(title, targetVersion) {
  const withParen = title.replace(/\(v[0-9]+\.[0-9]+\)/i, `(v${targetVersion})`);
  if (withParen !== title) return withParen;

  const withBareV = title.replace(/\bv[0-9]+\.[0-9]+\b/i, `v${targetVersion}`);
  if (withBareV !== title) return withBareV;

  const withBareVersion = title.replace(/\b[0-9]+\.[0-9]+\b/, targetVersion);
  if (withBareVersion !== title) return withBareVersion;

  return `${title} (v${targetVersion})`;
}

function updateStringsVersion(src, targetVersion) {
  let parsed;
  try {
    parsed = JSON.parse(src);
  } catch (error) {
    throw new Error(`Could not parse strings.json: ${error.message}`);
  }

  const branding = parsed?.twl?.hud?.branding;
  if (!branding || typeof branding.title !== "string") {
    throw new Error(`Could not locate twl.hud.branding.title in strings.json.`);
  }

  branding.title = updateBrandingTitleVersion(branding.title, targetVersion);
  return `${JSON.stringify(parsed, null, 2)}\n`;
}

function runBuild() {
  try {
    execSync("npm run build", {
      cwd: root,
      stdio: "inherit",
      shell: true,
    });
  } catch (error) {
    const status = typeof error?.status === "number" ? error.status : "unknown";
    throw new Error(`Build failed with exit code ${status}.`);
  }
}

function parseCliArgs(argv) {
  let versionArg;
  let commentArg;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === "-c" || arg === "--comment") {
      if (i + 1 >= argv.length) {
        throw new Error(`Missing value for ${arg}.`);
      }
      commentArg = String(argv[i + 1]);
      i += 1;
      continue;
    }

    if (arg.startsWith("--comment=")) {
      commentArg = String(arg.slice("--comment=".length));
      continue;
    }

    if (arg.startsWith("-c=")) {
      commentArg = String(arg.slice(3));
      continue;
    }

    if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    }

    if (versionArg !== undefined) {
      throw new Error(`Unexpected extra positional argument: ${arg}`);
    }
    versionArg = arg;
  }

  return { versionArg, commentArg };
}

function normalizeComment(raw) {
  if (raw === undefined || raw === null) return "";
  const singleLine = String(raw).replace(/\r?\n+/g, " ").trim();
  return singleLine;
}

function updateChangelogHistory(src, targetVersion, comment) {
  if (!comment) return src;

  const regionRegex =
    /(\/\/#region -------------------- Changelog \/ History --------------------\r?\n)([\s\S]*?)(\r?\n\/\/#endregion ----------------- Changelog \/ History --------------------)/;
  const match = src.match(regionRegex);
  if (!match) {
    throw new Error(`Could not locate Changelog / History region in src/Changelog.ts.`);
  }

  const currentBody = match[2].replace(/^\r?\n+/, "").replace(/\s+$/, "");
  const newEntry = `// v${targetVersion}: ${comment}`;
  const nextBody = `\n${newEntry}${currentBody ? `\n${currentBody}` : ""}\n`;

  return src.replace(regionRegex, `$1${nextBody}$3`);
}

function main() {
  const { versionArg, commentArg } = parseCliArgs(process.argv.slice(2));
  const header = readText(headerPath);
  const footer = readText(footerPath);
  const strings = readText(stringsPath);
  const changelog = readText(changelogPath);

  const headerVersion = extractVersion(
    header,
    /\/\/ version:\s*([0-9]+\.[0-9]+)\s*\|/,
    "header"
  );
  const footerVersion = extractVersion(
    footer,
    /\/\/ EOF version:\s*([0-9]+\.[0-9]+)\s*\|/,
    "footer"
  );

  if (headerVersion !== footerVersion) {
    throw new Error(
      `Version mismatch: header=${headerVersion}, footer=${footerVersion}. Fix this first.`
    );
  }

  const targetVersion = resolveTargetVersion(versionArg, headerVersion);
  const commentFromEnv =
    process.env.npm_config_comment ?? process.env.npm_config_c ?? process.env.npm_config_call;
  const changelogComment = normalizeComment(
    commentArg !== undefined ? commentArg : commentFromEnv
  );
  const stamp = utcStamp();

  const nextHeader = replaceOrThrow(
    header,
    /\/\/ version:\s*[0-9]+\.[0-9]+\s*\|\s*Date:\s*[0-9]{2}\.[0-9]{2}\.[0-9]{2}\s*\|\s*Time:\s*[0-9]{2}:[0-9]{2}\s*UTC/,
    `// version: ${targetVersion} | Date: ${stamp.date} | Time: ${stamp.time} UTC`,
    "header version line"
  );

  const nextFooter = replaceOrThrow(
    footer,
    /\/\/ EOF version:\s*[0-9]+\.[0-9]+\s*\|\s*Date:\s*[0-9]{2}\.[0-9]{2}\.[0-9]{2}\s*\|\s*Time:\s*[0-9]{2}:[0-9]{2}\s*UTC/,
    `// EOF version: ${targetVersion} | Date: ${stamp.date} | Time: ${stamp.time} UTC`,
    "footer version line"
  );

  const nextStrings = updateStringsVersion(strings, targetVersion);
  const nextChangelog = updateChangelogHistory(changelog, targetVersion, changelogComment);

  const changedHeader = writeTextIfChanged(headerPath, nextHeader);
  const changedFooter = writeTextIfChanged(footerPath, nextFooter);
  const changedStrings = writeTextIfChanged(stringsPath, nextStrings);
  const changedChangelog = writeTextIfChanged(changelogPath, nextChangelog);

  console.log(`Version bumped to ${targetVersion}`);
  console.log(`UTC timestamp: ${stamp.date} ${stamp.time}`);
  console.log(`Updated:`);
  if (changedHeader) console.log(`- ${path.relative(root, headerPath)}`);
  if (changedFooter) console.log(`- ${path.relative(root, footerPath)}`);
  if (changedStrings) console.log(`- ${path.relative(root, stringsPath)}`);
  if (changedChangelog) console.log(`- ${path.relative(root, changelogPath)}`);
  if (changelogComment) {
    console.log(`Changelog entry: // v${targetVersion}: ${changelogComment}`);
  }

  console.log(`Running build...`);
  runBuild();
}

try {
  main();
} catch (error) {
  console.error(`ERROR: ${error.message}`);
  process.exit(1);
}
