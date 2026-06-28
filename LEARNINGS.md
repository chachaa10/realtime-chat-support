# Critical Learnings

## Backend

### Auth

- **Registration flow order**: [×1, 2026-06-28] Create better-auth user FIRST, then profile with real ID — not placeholder-ID-then-update pattern

### Security

- **MIME validation via magic bytes**: [×1, 2026-06-28] Use file-type library for server-side MIME detection; client Content-Type is spoofable

### Database

- **better-sqlite3 busyTimeout + foreign_keys**: [×1, 2026-06-28] Set busyTimeout=5000 and PRAGMA foreign_keys=ON on every connection — SQLite defaults are dangerous
- **Composite index for message ordering**: [×1, 2026-06-28] Messages need (ticketId, createdAt) composite index — single-column misses ORDER BY sort

### Architecture

- **File storage abstraction**: [×1, 2026-06-28] Define FileStorage port/adapter early — LocalFileStorage now, swap to S3 later without controller changes

### ORM/Data Access

- **better-sqlite3 v11 fails on Node 26**: [×1, 2026-06-28] better-sqlite3@11 fails on Node 26 (V8 API: GetPrototype→GetPrototypeV2, PropertyCallbackInfo::This removed). SPIKE found & fixed: upgrade to better-sqlite3@12.
- **drizzle-orm duplicate install type conflict**: [×1, 2026-06-28] Installing drizzle-orm in two workspaces with different zod peer versions creates two node_modules copies. TS type incompatibility (protected member mismatch). Fix: re-export operators (eq/and/or) from one package rather than installing directly in consuming packages.
- **drizzle-kit + drizzle-orm version lock**: [×1, 2026-06-28] drizzle-kit and drizzle-orm must be on matching major versions. v0.30 + v0.41.0 vs 1.0.0-rc.4 both work but mix causes failures. Upgrade both to ^1.0.0-rc.4.

### Monorepo

- **tsdown semver range trap**: [×1, 2026-06-28] tsdown ^0.0.0 resolves to placeholder v0.0.0 not latest. Pin explicitly: ^0.22.3.
- **tsdown ESM output extensions**: [×1, 2026-06-28] tsdown with format:esm outputs .mjs + .d.mts, not .js + .d.ts. Package.json exports field must match actual file extensions.

## Frontend

### CSS/Tailwind

- **Tailwind v4 PostCSS package change**: [×1, 2026-06-28] Tailwind v4 moved PostCSS plugin to separate @tailwindcss/postcss package. Using tailwindcss directly as PostCSS plugin fails with clear error.
