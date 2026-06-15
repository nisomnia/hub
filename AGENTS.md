<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown,
Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management,
package management, and frontend tooling in a single global CLI called `vp`.
Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and
`vp build`. Run `vp help` to print a list of commands and `vp <command> --help`
for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at
https://viteplus.dev/guide/.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts
      necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run
      `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->

## Monorepo Structure

This is a Bun-based monorepo managed by Vite+ with workspaces under `apps/*`,
`packages/*`, and `tools/*`.

| Directory        | Contents                                     |
| ---------------- | -------------------------------------------- |
| `apps/api`       | Hono HTTP API with Drizzle ORM (postgres-js) |
| `packages/utils` | Shared utilities built with `vp pack`        |

### Package Manager

- **Bun** (`bun@1.3.14`) — use `bun install`, not `npm` or `pnpm`.
- Lockfile: `bun.lock`.
- Node version requirement: `>=22.12.0`.

### Root Scripts

| Command           | What it does                                              |
| ----------------- | --------------------------------------------------------- |
| `vp run ready`    | Full verification: `vp check` + all tests + all builds    |
| `vp run dev`      | Runs `website#dev` (currently `apps/api` is the only app) |
| `vp run -r test`  | Run tests in all workspace packages recursively           |
| `vp run -r build` | Build all workspace packages recursively                  |

## Code Style

- Never add comments or JSDoc to source code. Code should be self-documenting.
- Always use `@/` absolute imports (e.g. `from "@/db"`). Never use `../` parent
  relative imports — enforced by `import/no-relative-parent-imports`.
- Prefer functional programming: use factory functions and plain objects instead
  of classes. Avoid `class`, `new`, and `this` in application code. Third-party
  library APIs (e.g. `Hono`, `Proxy`, `Error`) are exceptions when no functional
  alternative exists.

## Code Quality & Workflow

### Staged Hooks (Pre-commit)

The `.vite-hooks/pre-commit` hook runs `vp staged`, which automatically:

- `vp check --fix` on all files
- `vp lint --fix` on `*.{ts,tsx}`
- `vp fmt --write` on `*.{js,ts,tsx,json,md,yaml,yml,css}`

### Formatting Rules (from `vite.config.ts`)

- `printWidth: 80`, `tabWidth: 2`, `semi: false`, `singleQuote: false`,
  `trailingComma: "all"`
- Import sorting enforced with custom workspace groups (`ui`, `auth`, `db`,
  `env`, `logger`, `rpc`, `shared`, etc.)
- Tailwind CSS function sorting enabled for `cn`, `cva`, `clsx`

### Linting Rules (from `vite.config.ts`)

- Type-aware linting enabled (`typeAware: true`, `typeCheck: true`)
- `no-console` is an error except for `error`, `warn`, `info`
- `no-explicit-any` is an error
- `consistent-type-imports` is a warning (prefer `type-imports`)
- Test files (`*.test.ts`, `*.test.tsx`, `tests/**/*.ts`) relax `require-await`,
  `no-explicit-any`, and `no-unused-vars`

## TypeScript

- Root `tsconfig.json` uses `nodenext` module resolution with
  `allowImportingTsExtensions: true`.
- Packages should extend this or set their own `moduleResolution: nodenext`.

## `apps/api` — Hono API

- **Runtime**: Bun (`bun run --hot src/index.ts` for dev)
- **Framework**: Hono
- **Database**: Drizzle ORM + postgres-js
- **Validation**: Zod
- **Schema**: `src/db/schema/` exports all tables (ad, article, article-comment,
  feed, genre, language, media, movie, overview, production-company, status,
  topic, user)
- **Migrations**: `src/db/migrations/` — managed by `drizzle-kit`

## `packages/utils`

- Built with `vp pack` (tsdown / Rolldown)
- `dts.tsgo: true` for fast type generation
- Entry: `src/index.ts` → `dist/index.mjs`

## Environment & Dependencies

- Shared dependency versions are declared in the root `package.json` `"catalog"`
  field.
- Root `overrides` pins `vite` and `vitest` to the catalog versions.
- `drizzle-zod` is installed at the root level.

## Quick Reference

```bash
# Install everything
bun install

# Run the API dev server
bun run --hot apps/api/src/index.ts
# Or via package script:
cd apps/api && bun run dev

# Format / lint / typecheck everything
vp check

# Test everything
vp run -r test

# Build everything
vp run -r build

# Full CI check
vp run ready
```

## Gotchas

- Do not use plain `vite` or `vitest` CLI directly — always go through `vp`.
- `vp run dev` at root references `website#dev` but the workspace is named
  `api`; run `cd apps/api && bun run dev` instead.
- Migrations are in `apps/api/src/db/migrations/` and are ignored by the
  formatter/linter.
- `routeTree.gen.ts` is ignored by formatter/linter (likely for TanStack Router
  if added later).
