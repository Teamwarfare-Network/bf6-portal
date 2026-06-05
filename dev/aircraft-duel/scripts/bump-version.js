#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const headerPath = path.join(root, "src", "header-file.ts");
const footerPath = path.join(root, "src", "footer-file.ts");
const stringsPath = path.join(root, "src", "strings.json");

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function writeTextIfChanged(filePath, next) {
  const prev = readText(filePath);
  if (prev !== next) {
    fs.writeFileSync(filePath, next, "utf8");
  }
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

function main() {
  const header = readText(headerPath);
  const footer = readText(footerPath);
  const strings = readText(stringsPath);

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

  const targetVersion = resolveTargetVersion(process.argv[2], headerVersion);
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

  const nextStrings = replaceOrThrow(
    strings,
    /("title"\s*:\s*"[^"\r\n]*\(v)([0-9]+\.[0-9]+)(\)[^"\r\n]*")/,
    `$1${targetVersion}$3`,
    "strings branding title"
  );

  writeTextIfChanged(headerPath, nextHeader);
  writeTextIfChanged(footerPath, nextFooter);
  writeTextIfChanged(stringsPath, nextStrings);

  console.log(`Version bumped to ${targetVersion}`);
  console.log(`UTC timestamp: ${stamp.date} ${stamp.time}`);
  console.log(`Updated:`);
  console.log(`- ${path.relative(root, headerPath)}`);
  console.log(`- ${path.relative(root, footerPath)}`);
  console.log(`- ${path.relative(root, stringsPath)}`);
}

try {
  main();
} catch (error) {
  console.error(`ERROR: ${error.message}`);
  process.exit(1);
}