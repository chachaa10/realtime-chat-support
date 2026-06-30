# Agents: Realtime Chat Support

## Monorepo

- Turborepo v2 + pnpm workspaces.
- `turbo.json` at root defines `build` (`dependsOn: ["^build"]`), `test` (`dependsOn: ["^build"]`), `typecheck` (`dependsOn: ["^build"]`).
- Root scripts delegate to turbo (`"build": "turbo build"`). `lint`/`fmt` run at root only (oxlint/oxfmt).
- No cache outputs configured — task orchestration only.
- Workspaces: `apps/frontend`, `apps/backend`, `packages/shared`, `packages/database`.

## Package naming

- Internal packages: `@repo/shared`, `@repo/database`.
- Apps: no scope (just `frontend`, `backend` in their `package.json`).

## Database

- `packages/database/` is NestJS-agnostic. Schema + client factory + `drizzle-kit generate` SQL migrations live here.
- `apps/backend/src/database/database.module.ts` is a thin NestJS wrapper importing `createClient` from `@repo/database`.
- Migrations: SQL files in `packages/database/src/migrations/`.
- Build tool for packages: `tsdown`.

## Build graph

```
@repo/shared ──► frontend
@repo/database ──► backend
@repo/shared ──► backend
```

## Documentation

Key docs in `docs/`:

| File | Contents |
|---|---|
| `01-vision.md` | Product vision, target users, brand personality, key scenarios, domain overview, non-goals |
| `02-requirements.md` | Functional requirements (auth, tickets, messaging, attachments, agent features, UI/UX) with P0/P1/P2 priorities, plus non-functional requirements |
| `03-user-stories.md` | Customer stories (C-1 to C-14) and Agent stories (A-1 to A-17) with acceptance criteria |
| `04-product-backlog.md` | Backlog grouped by priority (P0-P2) with completion status |
| `05-release-plan.md` | Release roadmap: 6 releases from foundation through deploy |
| `CONTEXT.md` | Full domain glossary with definitions, accepted terms, and terms to avoid |
| `decisions.md` | Architectural decisions across backend, frontend, database, WS protocol, notifications, and rejected alternatives |

## Domain glossary

See `docs/CONTEXT.md` for the full glossary.

Key entities:

- **Ticket** — container for a customer issue. Status machine: `open → in_progress → resolved` (terminal), `open → cancelled` (terminal), `in_progress → open` (agent returns to queue). No reopen from resolved or cancelled.
- **Message** — immutable unit of communication on a ticket. Belongs to one ticket and one author.
- **Customer** — submits tickets and chats. Role: `customer`.
- **Agent** — resolves tickets via chat. Self-service registration. Has configurable capacity (~5-8) and Online/Away toggle.
- **User** — base identity (better-auth). Role discriminator: `customer | agent`.
- **Label** — predefined tag seeded in DB. Many-to-many with tickets. No runtime management UI.
- **Ticket Event** — audit log of every status transition. Customer sees simplified timeline; agent sees full log.
- **Attachment** — file linked to a ticket or message. Two-step orphan-then-link upload flow.
- **Notification** — in-app event persisted to DB. Drives feed, tab title flash, toasts. Auto-marked read on viewing related ticket.

## Architecture patterns

### Backend (NestJS)

- **Module layout**: feature modules (e.g., `tickets/`) contain `module.ts`, `controller.ts`, `service.ts`, `gateway.ts` (if WS), `__tests__/`.
- **Mutations**: all CRUD through HTTP endpoints. WebSocket is **broadcast-only**.
- **Auth**: controllers guarded by `JwtAuthGuard` + `RolesGuard`. `@CurrentUser()` decorator extracts user from request.
- **Validation**: `ZodValidationPipe` on controller endpoints, using schemas from `@repo/shared`.
- **Response shape**: `{ data: T }` on success, `{ error: { code, message, errors? } }` on error.
- **Error hierarchy**: `AppError` base class → `NotFoundError` (404), `ForbiddenError` (403), `ConflictError` (409), `ValidationError` (400).
- **DB access**: global `db` proxy from `@repo/database` — no repository layer. Direct Drizzle queries in services.
- **File storage**: `FileStorage` port/adapter. `LocalFileStorage` writes to `uploads/`. Swappable to S3.

### Frontend (React + Vite)

- **Routes**: thin route files in `src/routes/` that delegate to feature components. Route tree assembled in `router.ts`.
- **Features**: self-contained modules in `src/features/` with `components/`, `hooks/` (TanStack Query), `utils/` (API client).
- **UI components**: shadcn primitives in `src/components/ui/` (Base UI + CVA). Custom components in `src/design-system/`.
- **CSS**: Tailwind v4 native (`@theme`, `@layer`) with OKLCH design tokens. Dark mode via `.dark` class.
- **Forms**: `react-hook-form` + `@hookform/resolvers` + Zod schemas.
- **Auth**: `AuthProvider` (context) persists user + role to localStorage. Token sent as cookie via `credentials: 'include'`.

### Shared package (`@repo/shared`)

- **Validation schemas**: Zod v4 schemas in `src/validations/<domain>-validation.ts`.
- **Types**: `z.infer` type aliases in `src/types/<domain>.ts`.
- Built with `tsdown`. Imported by both frontend and backend.

### Database package (`@repo/database`)

- **ORM**: Drizzle ORM + better-sqlite3. WAL journal mode.
- **Client**: singleton `createClient(path?)` → `getDb()` / `closeDb()`. Global `db` Proxy for lazy init.
- **Schema**: 10 tables under `src/schemas/`. Relations defined with `defineRelations`.
- **Migrations**: SQL files generated by `drizzle-kit generate` in timestamp-named dirs under `src/migrations/`. Run via `runMigrations()`.
- **Seed**: `src/seed.ts` uses faker to create sample agents, customers, labels, tickets.

## Coding conventions

- **Semicolons**: none. **Quotes**: single. **Indent**: 2 spaces.
- **Naming**: kebab-case for files and dirs (`ticket-status-badge.tsx`). PascalCase for React components/classes (`TicketCard.tsx`, `AppError`). camelCase for functions/vars. UPPER_SNAKE_CASE for constants. `index.ts` for barrel exports.
- **Imports**: externals first, blank line, then internal. `import type` preferred for type-only imports.
- **Async**: async/await, no raw promises.
- **Code style**: early returns, `const` over `let`, `for...of` over `forEach`.
- **Types**: derive from Zod with `z.infer` — avoid hand-written interfaces that duplicate schemas.
- **Backend response**: always use factory functions from `common/api-response.ts`.

## Testing conventions

- **Runner**: Vitest with `globals: true` everywhere.
- **Backend tests**: integration-style with real SQLite in temp files. Use `TestingModule` from `@nestjs/testing`. Mock `@repo/shared` for env vars. Clean up DB in `afterAll`.
- **Unit tests**: mock `auth` and `db` modules with `vi.mock`. Use `vi.hoisted()` for hoisted mock variables.
- **Factories**: use helpers from `apps/backend/src/__tests__/helpers/factories.ts` — `buildUser()`, `buildCustomer()`, `buildAgent()`, `buildTicket()`, `buildMessage()` with overrides.
- **Mocks**: `mockDb()` from `apps/backend/src/__tests__/helpers/mocks.ts` for stubbed DB calls.
- **File placement**: co-locate `__tests__/` directory inside each feature module (e.g., `tickets/__tests__/tickets.service.test.ts`).
- **Test naming**: `<target>.test.ts` (e.g., `tickets.service.test.ts`, `client.test.ts`).
- **Frontend tests**: use `environment: 'jsdom'`. Minimal so far — write tests for new features.
- **E2E**: Playwright in `e2e/` directory at root. Multi-browser ticket lifecycle.

## Reference

| Tool              | Docs                         |
| ----------------- | ---------------------------- |
| React / React DOM | https://react.dev            |
| Vite              | https://vite.dev             |
| TanStack Router   | https://tanstack.com/router  |
| TanStack Query    | https://tanstack.com/query   |
| Tailwind CSS v4   | https://tailwindcss.com      |
| Base UI           | https://base-ui.com          |
| shadcn/ui         | https://ui.shadcn.com        |
| NestJS            | https://docs.nestjs.com      |
| Socket.io         | https://socket.io/docs       |
| Drizzle ORM       | https://orm.drizzle.team     |
| better-auth       | https://better-auth.com/docs |
| Zod               | https://zod.dev              |
| react-hook-form   | https://react-hook-form.com  |
| Turborepo         | https://turborepo.dev/docs   |
| pnpm              | https://pnpm.io/workspaces   |
| tsdown            | https://tsdown.dev           |
| Oxlint / Oxfmt    | https://oxc.rs               |
| Vitest            | https://vitest.dev           |
| Playwright        | https://playwright.dev       |
