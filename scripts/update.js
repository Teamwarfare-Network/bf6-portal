/**
 * Dependency update script for bf6-portal monorepo.
 *
 * Usage:
 *   node scripts/update.js --experience helis-only   # Update one experience
 *   node scripts/update.js --root                     # Update root deps only
 *   node scripts/update.js --all                      # Update root + all experiences
 *
 * Runs npm-check-updates --target minor + npm install for the selected scope.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const DEV_DIR = path.join(ROOT, 'dev');

const parseArgs = () => {
    const argv = process.argv.slice(2);
    let experience = null;
    let root = false;
    let all = false;

    for (let i = 0; i < argv.length; ++i) {
        if (argv[i] === '--experience' && argv[i + 1]) {
            experience = argv[++i];
        } else if (argv[i] === '--root') {
            root = true;
        } else if (argv[i] === '--all') {
            all = true;
        }
    }

    return { experience, root, all };
};

const updateDir = (dir, label) => {
    const pkgPath = path.join(dir, 'package.json');

    if (!fs.existsSync(pkgPath)) {
        console.error(`  No package.json found in ${dir}`);
        return false;
    }

    console.log(`\n  Updating ${label}...`);
    console.log('  ─────────────────────────────────────────');

    try {
        console.log('  Running npm-check-updates (minor only)...');
        execSync('npx npm-check-updates -u --target minor', {
            cwd: dir,
            stdio: 'inherit',
        });
    } catch {
        console.error(`  npm-check-updates failed for ${label}. Ensure npx can run it.`);
        return false;
    }

    try {
        console.log('\n  Running npm install...');
        execSync('npm install', { cwd: dir, stdio: 'inherit' });
    } catch {
        console.error(`  npm install failed for ${label}.`);
        return false;
    }

    console.log(`  ${label} updated.`);
    return true;
};

const getExperienceDirs = () => {
    if (!fs.existsSync(DEV_DIR)) return [];

    return fs
        .readdirSync(DEV_DIR, { withFileTypes: true })
        .filter((d) => d.isDirectory() && fs.existsSync(path.join(DEV_DIR, d.name, 'package.json')))
        .map((d) => d.name);
};

const { experience, root, all } = parseArgs();

if (!experience && !root && !all) {
    console.error('  Usage: node scripts/update.js --experience <name> | --root | --all');
    process.exit(1);
}

let ok = true;

if (all || root) {
    ok = updateDir(ROOT, 'root') && ok;
}

if (all) {
    for (const name of getExperienceDirs()) {
        ok = updateDir(path.join(DEV_DIR, name), `dev/${name}`) && ok;
    }
} else if (experience) {
    const dir = path.join(DEV_DIR, experience);

    if (!fs.existsSync(dir)) {
        console.error(`  Error: experience directory not found: ${dir}`);
        process.exit(1);
    }

    ok = updateDir(dir, `dev/${experience}`) && ok;
}

console.log('');
console.log(ok ? '  All updates complete.' : '  Some updates failed.');
process.exit(ok ? 0 : 1);
