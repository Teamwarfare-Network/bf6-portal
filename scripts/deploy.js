/**
 * Multi-experience deploy script for BF6 Portal.
 *
 * Usage:
 *   node scripts/deploy.js --experience helis-only [--versionBump patch|minor|major] [--no-build]
 *   node scripts/deploy.js --experience conquest --versionBump minor
 *
 * Reads experienceName, version, and modId from the experience's package.json.
 * SESSION_ID comes from the root .env file. MOD_ID env var overrides modId from package.json.
 */

import { Clients } from '@bf6mods/portal';
import { TextEncoder } from 'node:util';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(ROOT, '.env') });

const BLACKLIST = ['911', '69', '420', '88', '666'];

const isVersionBlacklisted = (version) => {
    const withoutDots = version.replace(/\./g, '');
    return BLACKLIST.some((s) => withoutDots.includes(s));
};

const fileContentsToBase64 = (filePath, isJson = false) => {
    const contents = fs.readFileSync(filePath, 'utf8');
    return new TextEncoder().encode(isJson ? JSON.stringify(JSON.parse(contents)) : contents);
};

const createTsAttachment = (filePath, version = '1.0.0') => ({
    id: crypto.randomUUID().toString(),
    version,
    filename: `${path.parse(filePath).name}.ts`,
    isProcessable: true,
    processingStatus: 2,
    attachmentData: { original: fileContentsToBase64(filePath) },
    attachmentType: 2,
    errors: [],
});

const createStringsAttachment = (filePath, version = '1.0.0') => ({
    id: crypto.randomUUID().toString(),
    version,
    filename: `${path.parse(filePath).name}.json`,
    isProcessable: true,
    processingStatus: 2,
    attachmentData: { original: fileContentsToBase64(filePath, true) },
    attachmentType: 4,
    errors: [],
});

const updateAttachments = (attachments, codeFilePath, stringsFilePath, version) =>
    attachments.map((attachment) => {
        if (attachment.attachmentType === 2) return createTsAttachment(codeFilePath, version);
        if (attachment.attachmentType === 4) return createStringsAttachment(stringsFilePath, version);
        return attachment;
    });

const bumpVersion = (version, versionBump) => {
    const parts = version.split('.').map((s) => parseInt(s, 10) || 0);
    let [major = 0, minor = 0, patch = 0] = parts;
    let candidate;

    do {
        if (versionBump === 'patch') {
            patch += 1;
            candidate = `${major}.${minor}.${patch}`;
        } else if (versionBump === 'minor') {
            minor += 1;
            patch = 0;
            candidate = `${major}.${minor}.${patch}`;
        } else if (versionBump === 'major') {
            major += 1;
            minor = 0;
            patch = 0;
            candidate = `${major}.${minor}.${patch}`;
        } else {
            return version;
        }
    } while (isVersionBlacklisted(candidate));

    return candidate;
};

const parseArgs = () => {
    const argv = process.argv.slice(2);
    let experience = null;
    let versionBump = 'patch';
    let noBuild = false;

    for (let i = 0; i < argv.length; ++i) {
        if (argv[i] === '--experience' && argv[i + 1]) {
            experience = argv[++i];
        } else if (argv[i] === '--versionBump' && argv[i + 1]) {
            const value = argv[++i];
            if (['patch', 'minor', 'major'].includes(value)) versionBump = value;
        } else if (argv[i] === '--no-build') {
            noBuild = true;
        }
    }

    return { experience, versionBump, noBuild };
};

const { experience, versionBump, noBuild } = parseArgs();

if (!experience) {
    console.error('  Error: --experience <name> is required (e.g., helis-only, conquest)');
    process.exit(1);
}

const experienceDir = path.join(ROOT, 'dev', experience);

if (!fs.existsSync(experienceDir)) {
    console.error(`  Error: experience directory not found: ${experienceDir}`);
    process.exit(1);
}

const packageJsonPath = path.join(experienceDir, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const experienceName = packageJson.experienceName ?? experience;
const currentVersion = packageJson.version ?? '0.0.0';
const modId = process.env.MOD_ID || packageJson.modId;

if (!modId) {
    console.error('  Error: No modId found. Set MOD_ID env var or add "modId" to experience package.json.');
    process.exit(1);
}

const sessionId = process.env.SESSION_ID;

if (!sessionId) {
    console.error('  Error: SESSION_ID not set. Copy .env.example to .env and fill in your session ID.');
    process.exit(1);
}

const scriptPath = path.join(experienceDir, 'dist', 'bundle.ts');
const stringsPath = path.join(experienceDir, 'dist', 'bundle.strings.json');
const newVersion = bumpVersion(currentVersion, versionBump);

console.log('');
console.log('  Deploy');
console.log('  ─────────────────────────────────────────');
console.log('  Experience: ', experience);
console.log('  Script:     ', scriptPath);
console.log('  Strings:    ', stringsPath);
console.log('  Version:    ', currentVersion, '→', newVersion, `(${versionBump})`);
console.log('  Name:       ', `${experienceName} v${newVersion}`);
console.log('  ─────────────────────────────────────────');
console.log('');

if (!noBuild) {
    console.log('  Building...');
    try {
        execSync('npm run build', { cwd: experienceDir, stdio: 'inherit' });
    } catch {
        console.error('  Build failed. Fix errors and retry, or use --no-build to skip.');
        process.exit(1);
    }
    console.log('');
}

if (!fs.existsSync(scriptPath)) {
    console.error(`  Error: build output not found: ${scriptPath}`);
    console.error('  Run the build first, or check your experience build config.');
    process.exit(1);
}

process.stdout.write('  Authenticating...');
const clients = await new Clients().authenticate({ sessionId });
process.stdout.write('\r\x1b[K  Authenticated.\n');

process.stdout.write('  Fetching experience...');
const { playElement, playElementDesign } = await clients.play.getPlayElement({
    id: modId,
    includeDenied: true,
});
process.stdout.write(`\r\x1b[K  Fetched: ${playElement?.name ?? modId}\n`);

const newAttachments = updateAttachments(playElementDesign?.attachments, scriptPath, stringsPath, newVersion);

const updatedPlayElement = {
    id: modId,
    name: `${experienceName} v${newVersion}`,
    description: playElement?.description,
    designMetadata: playElementDesign?.designMetadata,
    mapRotation: playElementDesign?.mapRotation,
    mutators: playElementDesign?.mutators,
    assetCategories: playElementDesign?.assetCategories,
    originalModRules: playElementDesign?.modRules?.compatibleRules?.original,
    playElementSettings: playElement?.playElementSettings,
    publishState: 1,
    modLevelDataId: playElementDesign?.modLevelDataId,
    thumbnailUrl: playElement?.thumbnailUrl,
    attachments: newAttachments,
};

process.stdout.write(`  Updating experience to version ${newVersion} (this may take up to 10 seconds)...`);

const updateStart = Date.now();

try {
    const result = await clients.play.updatePlayElement(updatedPlayElement);

    for (const attachment of result.playElementDesign?.attachments ?? []) {
        const errorCount = attachment.errors?.length ?? 0;
        if (errorCount > 0) throw new Error(`${attachment.filename} has ${errorCount} errors.`);
    }

    const elapsed = ((Date.now() - updateStart) / 1000).toFixed(1);
    process.stdout.write(`\r\x1b[K  Updated to version ${newVersion} in ${elapsed} seconds.\n`);

    process.stdout.write('  Writing package.json...');
    packageJson.version = newVersion;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 4) + '\n');
    process.stdout.write(`\r\x1b[K  package.json updated.\n`);
    console.log('  Done.');
} catch (err) {
    const elapsed = ((Date.now() - updateStart) / 1000).toFixed(1);
    process.stdout.write(`\r\x1b[K  Update failed after ${elapsed} seconds.\n`);
    console.error('');
    console.error('  Error:', err?.message ?? String(err));
    if (err?.stack) {
        console.error('');
        console.error(err.stack);
    }
    console.error('');
    process.exit(1);
}
