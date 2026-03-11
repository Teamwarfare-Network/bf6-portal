# bf6-portal monorepo — Agent rules

Project-specific rules for building Portal mods. These apply when editing code in this repo.

---

## Repository structure

This is a monorepo for TWL Battlefield 6 Portal experiences.

```
bf6-portal/
├── package.json              # Root shared tooling (deploy, lint, prettier)
├── scripts/
│   ├── deploy.js             # Multi-experience deploy to Portal
│   └── update.js             # Dependency updater (root + experiences)
├── dev/
│   ├── helis-only/           # TWL Helis Only experience (modular build)
│   │   ├── package.json      # Experience-specific deps (bundler, mod-types)
│   │   ├── src/              # Modular TypeScript source
│   │   ├── dist/             # Build output (bundle.ts, bundle.strings.json)
│   │   └── scripts/          # Experience-specific build scripts
│   └── conquest/             # TWL Conquest experience (modular build)
│       ├── package.json
│       ├── src/
│       ├── dist/
│       └── scripts/
├── bf6-portal/experiences/   # Published experience monoliths (reference/ground truth)
├── eslint.config.js          # ESLint flat config
├── .prettierrc.json          # Prettier config
└── .env.example              # Template for SESSION_ID
```

### Key conventions

- Root is ESM (`"type": "module"`). Experience dirs have their own package.json (CommonJS for build scripts).
- Each experience has its own bundler/mod-types versions in its package.json.
- Shared tooling (deploy, lint, prettier) lives at root. Experience-specific build scripts live in `dev/<name>/scripts/`.
- Deploy: `npm run deploy -- --experience helis-only` (from root) or `npm run deploy` (from experience dir).
- Build: `cd dev/helis-only && npm run build` (experience-specific).

---

## Deploy workflow

1. Get a SESSION_ID from the Portal web editor (browser dev tools → cookies).
2. Copy `.env.example` to `.env` and paste your SESSION_ID.
3. Set `modId` in the experience's package.json (the Portal experience ID from the URL).
4. Run `npm run deploy -- --experience helis-only` to build + deploy.
5. Use `--no-build` to skip the build step. Use `--versionBump minor|major` for non-patch bumps.

---

## Code quality & tooling

- **Lint**: `npm run lint` from root. Warnings are expected on first rollout.
- **Format**: `npm run prettier` to auto-format. `npm run prettier:check` to verify.
- **No any type**: Never use explicit or implicit any types unless absolutely necessary.

---

## The `mod` namespace

- **Injected API**: `mod` is an injected namespace provided by the Portal runtime. It is NOT imported.
- **Type reference**: Use `bf6-portal-mod-types` package (`index.d.ts`) for type definitions.
- **Opaque types**: Custom `mod` types (vectors, object refs) are opaque. Compare with `mod.Equals(a, b)` or `mod.GetObjId(a) == mod.GetObjId(b)`.
- **User-facing strings**: Use `mod.Message(stringKey, ...substitutions)` with keys from `mod.stringkeys` (mapped to `strings.json`).

---

## Architecture & patterns

- **Event-driven**: Prefer event-driven design over polling.
- **Exit-early**: Use early returns to reduce nesting.
- **Per-player state**: Use a registry keyed by player id. Register on join, clean up when invalid or leaving.
- **Constants in one place**: Keep game constants as a dedicated config object; avoid magic numbers.

---

## Bundler behavior

- `bf6-portal-bundler` resolves imports from `index.ts` and concatenates all files in dependency order.
- Import statements are stripped from output. The result is a single flat TypeScript file.
- Each module uses `// @ts-nocheck` because cross-module references don't resolve individually.
- The bundler does NOT do TypeScript compilation — it only concatenates.
- `modlib` is a runtime-injected Portal utility library. The bundler warning about it is expected.

---

## Player validity & cleanup

- **Validate before use**: Check `mod.IsPlayerValid(player)` before relying on a player reference.
- `OnPlayerLeaveGame` does not identify which player left. Check validity to determine who to clean up.
- When invalid: delete UI, clear timers, unspawn owned objects, remove from registries.

---

## Spawning & game objects

- After spawning an object, wait (e.g. 1 second) before applying settings.
- Use `mod.RuntimeSpawn_Common` for spawnable asset enums.
- Call `mod.UnspawnObject(...)` when a spawned object is no longer needed.

---

## Timers

- `await mod.Wait(seconds)` is the only mod timing API. Use for simple inline delays.
- Clear intervals on teardown to avoid leaks.
- Clear before replacing when restarting periodic behavior.
