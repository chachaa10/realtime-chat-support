# Plan: Real-time Chat Support

## Architecture

```
apps/frontend  ──HTTP/WS──►  apps/backend  ──►  SQLite (better-sqlite3)
 TanStack Router  │           NestJS (Node.js runtime)
 Vite              │           Socket.io
 shadcn            │           better-auth
                    │           Drizzle ORM
packages/shared    │
 Zod schemas       │
 (shared types)    │
                    │
packages/database   │
 Drizzle schema    │
 client factory     │
 migrations        │
```

## Decisions

| #   | Decision            | Choice                                                                                                                                                                                                                                                                                                                                                                                                           |
| --- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Frontend framework  | TanStack Router + Vite (SPA, no SSR)                                                                                                                                                                                                                                                                                                                                                                             |
| 2   | Real-time transport | Socket.io via `@nestjs/websockets` + `@nestjs/platform-socket.io`                                                                                                                                                                                                                                                                                                                                                |
| 3   | Domain model        | Ticket (Open→In Progress→Resolved, with Reopen→Open and Unassign→Open transitions) owns a conversation of Messages. `closed` terminal state distinct from `resolved` (cannot reopen).                                                                                                                                                                                                                            |
| 4   | Roles               | Customer (submits tickets) + Agent (resolves them)                                                                                                                                                                                                                                                                                                                                                               |
| 5   | Scope               | Core + file attachments (images, videos, documents)                                                                                                                                                                                                                                                                                                                                                              |
| 6   | File storage        | Local disk (uploads/), 10MB max. Guarded `GET /uploads/:id` endpoint with ticket membership check (with `Range` header support for video seeking). **No `ServeStaticModule`**. File storage abstracted behind `FileStorage` port/adapter (`LocalFileStorage` impl) — swap to S3 later without controller changes. MIME validation via magic-byte detection (`file-type`), not client-supplied Content-Type.      |
| 7   | Repo structure      | Turborepo + pnpm monorepo: `apps/frontend`, `apps/backend`, `packages/shared`, `packages/database`. Task pipeline defined in `turbo.json`.                                                                                                                                                                                                                                                                       |
| 8   | Runtime             | pnpm (package manager) + Node.js (runtime). NestJS runs natively. Drizzle ORM uses `better-sqlite3` driver. `tsx` used for running TypeScript directly in dev. `tsdown` for production builds.                                                                                                                                                                                                                   |
| 9   | Database driver     | Drizzle ORM + `@drizzle-orm/better-sqlite3` adapter. Native `better-sqlite3` package with zero runtime deps beyond Node.js.                                                                                                                                                                                                                                                                                      |
| 10  | Test runner         | vitest everywhere. Frontend: React Testing Library + jsdom, critical UI only. Backend: unit (services, 95% critical state machine + 80% rest) + integration (endpoints via supertest with in-memory SQLite). Shared: Zod schema validation. Co-located `__tests__/` per feature. Drizzle wrapped behind repository interfaces (not mocked directly). Factories + mocks in `apps/backend/src/__tests__/helpers/`. |
| 11  | Auth                | JWT via better-auth. better-auth owns identity (internal user/session tables). App adds `profiles` table (Drizzle) keyed to better-auth's user ID for role + name. Registration: create better-auth user first, then profile row with the returned user ID. If profile creation fails, delete better-auth user (or mark incomplete).                                                                             |
| 12  | WS protocol         | HTTP for all CRUD commands (POST/PATCH/GET). WebSocket only for real-time broadcasts (`ticket:new`, `message:sent`, `ticket:status_changed`) and the `reconnect:sync` handshake. No WS mutation events — they duplicate HTTP endpoints.                                                                                                                                                                          |
| 13  | IDs                 | SQLite auto-increment integer. `integer('id').primaryKey({ autoIncrement: true })`.                                                                                                                                                                                                                                                                                                                              |
| 14  | Lint + format       | `oxlint` + `oxfmt`. Separate npm packages. Config: `.oxlintrc.json` + `.oxfmtrc.json` at root.                                                                                                                                                                                                                                                                                                                   |
| 15  | CI/CD               | GitHub Actions. Parallel: lint, `turbo typecheck`, `turbo test`, `turbo build`. `turbo build` runs all builds in parallel (no separate build-backend/build-frontend jobs).                                                                                                                                                                                                                                       |
| 16  | pnpm + Node.js      | pnpm replaces Bun as package manager; Node.js replaces Bun as runtime. NestJS runs natively. Drizzle uses `@drizzle-orm/better-sqlite3`. Spike covers: better-auth adapter integration, WAL checkpoint on `db.close()`, Drizzle query execution.                                                                                                                                                                 |
| 17  | Monorepo tool       | Turborepo v2 with `"tasks"` key. `turbo.json` at root defines `build`, `test`, `typecheck` pipelines. `lint`/`fmt` run at root only (not per-workspace). No cache outputs configured — task orchestration only. Workspace packages: `apps/frontend`, `apps/backend`, `packages/shared`, `packages/database`. CI runs `turbo <task>` per parallel job.                                                            |

## Week-by-week plan

### Week 1: Foundation

**Infrastructure**

- Setup oxlint + oxfmt at root with `.oxlintrc.json` + `.oxfmtrc.json`
- Create `turbo.json` at root with `tasks`: `build` (`dependsOn: ["^build"]`), `test` (`dependsOn: ["^build"]`), `typecheck` (`dependsOn: ["^build"]`). Configure `outputs: ["dist/**"]` on build for cache-awareness even if not used yet.
- Root scripts become one-liner pass-throughs: `"build": "turbo build"`, `"test": "turbo test"`, `"typecheck": "turbo typecheck"`. `lint`, `fmt`, `fmt:check` run directly (no turbo).
- Backend is source-direct in development (`tsx src/main.ts` — tsx compiles TS on the fly). CI runs `tsdown src/main.ts --outDir dist` to verify compilation.
- Frontend builds via `vite build` into `dist/`
- `typecheck` runs per-workspace via turbo: `packages/shared`, `packages/database`, `apps/backend`, `apps/frontend`
- Create `.github/workflows/ci.yml` — parallel jobs

**Backend**

- **SPIKE: Validate NestJS on Node.js + better-sqlite3 + Drizzle ORM.** Scaffold minimal NestJS app with one controller, one guard, one Socket.io gateway, one Drizzle query. Integrate better-auth server adapter (validate session creation, JWT issuance, JWT verification in a guard). Verify `better-sqlite3` WAL mode, `busyTimeout`, `PRAGMA foreign_keys = ON`, and checkpoint on `db.close()`. Budget: 1 day. If any piece fails → document and fix.
- Create `apps/backend/src/env.ts` — Zod schema parsing `process.env`, exit on invalid
- Create Drizzle schema at `packages/database/src/schema.ts` — tables: `profiles`, `tickets`, `messages`, `attachments`. No `users` table. Composite index `(ticketId, createdAt)` on messages. Composite index `(messageId, createdAt)` on attachments for orphan cleanup.
- Create `packages/database/src/client.ts` — `createClient(path: string): DrizzleClient` factory. Configure `busyTimeout: 5000` and run `PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;` on open.
- Create `packages/database/src/migrate.ts` — wraps `drizzle-kit generate` SQL runner
- Create `apps/backend/src/database/database.module.ts` — thin NestJS module wrapping `createClient` from `@repo/database`
- Define typed error hierarchy: `AppError` (base), `NotFoundError`, `ForbiddenError`, `ValidationError`, `ConflictError` in `apps/backend/src/common/errors/`. Add `ErrorCode` enum: `'NOT_FOUND' | 'FORBIDDEN' | 'VALIDATION_ERROR' | 'CONFLICT' | 'INTERNAL_ERROR' | 'RATE_LIMITED'`.
- Create global `AppExceptionFilter` catching all `AppError` subclasses + `Error` fallback (returns 500 `INTERNAL_ERROR`). Log every caught error with request path and correlation ID.
- Create `WsExceptionFilter` (extends `BaseWsExceptionFilter`) for WS gateway errors. Standardized error shape across HTTP and WS: `{ code: string, message: string, errors?: Record<string, string[]> }`.
- **Graceful shutdown**: `app.enableShutdownHooks()`, drain Socket.io (`server.close()`), close SQLite via `db.close()`. Handle SIGTERM/SIGINT. Run `PRAGMA wal_checkpoint(TRUNCATE)` before close.
- **Security hardening**: `app.use(helmet())` for security headers. `app.useBodyParser('json', { limit: '1mb' })` to prevent OOM. Add global `X-Correlation-ID` middleware (accept incoming or generate `crypto.randomUUID()`).
- **Migration execution**: Run `packages/database/src/migrate.ts` synchronously before `app.listen()` in `main.ts` — not in a background promise or setTimeout.
- Define `FileStorage` interface (port) in `apps/backend/src/common/`: `{ save(filename, stream): Promise<FileRef>; read(filePath): Promise<Stream>; delete(filePath): Promise<void> }`. Implement `LocalFileStorage` adapter for `uploads/`.
- Define API response contract:
  - Success: `{ data: T }`
  - Error: `{ error: { code: ErrorCode, message: string, errors?: Record<string, string[]> } }`
  - Paginated: `{ data: T[], meta: { cursor: number | null } }` — cursor-based pagination only, no `total` (avoids full table scan).
- Enable CORS in `main.ts`: `app.enableCors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173', credentials: true })`
- Configure better-auth with rate limiting:
  - `rateLimit: { enabled: true, window: 60, max: 5 }` for auth endpoints
  - `customRules: { "/sign-in/email": { window: 60, max: 5 }, "/sign-up/email": { window: 60, max: 3 } }`
- Registration flow: create profile row first (with `id` as placeholder or generated), then create better-auth internal user. If better-auth fails, delete the profile row. If better-auth succeeds, update profile with real better-auth user ID.
- JWT guard: verifies token via better-auth, fetches profile for role

**Frontend**

- Scaffold Vite + TanStack Router + shadcn
- Login/register pages
- Auth context (store JWT, auto-attach to fetch)
- Route guards (redirect to login if unauthenticated)

**Shared**

- Zod schemas: `UserSchema`, `LoginSchema`, `RegisterSchema`

**Testing**

- Setup vitest configs per workspace (`vitest.config.ts` at `apps/backend`, `apps/frontend`, `packages/database`)
- Create backend test helpers (`apps/backend/src/__tests__/helpers/factories.ts` + `mocks.ts`)
- Add in-memory SQLite integration test setup in backend vitest config
- Create `@repo/database` smoke test: open `:memory:`, run migrate, verify all tables exist
- Write initial backend service tests
- Write Zod schema validation tests in `packages/shared`

**Verify:** Can register, login, and see a protected page. Migrations run from scratch without error. `busyTimeout` and `foreign_keys` are active on the connection. Helmet headers present on API responses.

### Week 2: Auth + Tickets (Full Stack)

**Backend**

- better-auth integration complete (signup, login, JWT, role-based)
- `profiles` table in Drizzle
- Tickets CRUD module (NestJS):
  - `POST /tickets` (customer creates)
  - `GET /tickets/my` (customer sees own tickets)
  - `GET /tickets/queue` (agent sees open tickets)
  - `GET /tickets/:id` (single ticket detail — needed by frontend detail page)
  - `PATCH /tickets/:id/accept` (agent picks) — atomic `WHERE status='open'` check, throw `ConflictError` if 0 rows affected
  - `PATCH /tickets/:id/resolve` (agent resolves)
- Auth guards on all endpoints
- API-wide rate limiting via `@nestjs/throttler`: 100 req/min per-user (keyed by profile ID), not global. 500 req/min global ceiling as safety net.
- Input validation: Zod pipe on all HTTP endpoints
- WS rate limiting: custom gateway guard, 1 `reconnect:sync`/5s per socket. Connection rate: 10 connects/min per IP. WS events validated against Zod schemas.
- WS events validated against Zod schemas from Week 1 (add `WsValidationPipe` analogous to HTTP pipe)
- Seed script: creates sample customers, agents, tickets for development
- Write tickets service unit tests (state machine, authorization rules)
- Write tickets endpoint integration tests (`supertest` through NestJS testing module)
- Emit `ticket:new` to agent pool on ticket create (HTTP → WS broadcast)

**Frontend**

- Ticket list page (customer view: my tickets)
- Ticket detail page (read-only, before chat)
- Create ticket form (subject + description)
- Agent queue page (list of open tickets)
- Accept ticket button (agent)
- Mark resolved button (agent)

**Shared**

- `TicketSchema`, `CreateTicketSchema`, `TicketStatus` enum

**Verify:** Customer creates ticket, agent sees it in queue, accepts it, resolves it. All CRUD operations work. Rate limits return proper error codes.

### Week 3: Real-time Messaging + File Attachments

**Backend**

- Socket.io gateway module
- Join/leave room per ticket (authenticated via JWT handshake, authorized by ticket membership: customer only their tickets, agent only assigned/unassigned tickets)
- Handle `message:send` → persist → broadcast `message:sent` to room
- GET `/tickets/:id/messages` (load history on open)
- Emit `ticket:status_changed` to room on status transitions (accept, resolve)
- Emit `ticket:resolved` to agent pool (not just room) so all agents' queues update
- `POST /uploads` — multipart upload, store to `uploads/`, 10MB limit via Multer `limits.fileSize`, MIME type validation (reject .exe, .html, etc.)
- `GET /uploads/:id` — guarded endpoint, reads attachment row, checks requester is customer/agent on the ticket, streams file (no buffering). **No `ServeStaticModule`.**
- Upload-first flow: client uploads file via POST `/uploads` → gets `attachmentId` back → includes `attachmentIds[]` in `message:send` payload → server links attachments atomically
- Orphan cleanup via `@nestjs/schedule`: cron job deletes attachments with `messageId IS NULL` and `createdAt < now - 1 hour` (DB row + file on disk). Also age-deletes attachments older than 30 days regardless of status, plus per-user daily upload cap (50MB/day) tracked in-memory.
- Write messages service unit tests (permission checks: agent on unassigned, customer on resolved)
- Write gateway unit tests (`@nestjs/testing` module, mock message service)

**Frontend**

- Socket.io connection with JWT auth
  - Built-in reconnection (exponential backoff, `reconnectionAttempts: Infinity`)
  - On reconnect: emit `reconnect:sync` with open ticket IDs + `lastSeenMessageId`
  - Server responds with current ticket state + missed messages — client replaces local state
  - Handle token expiry during disconnect: on `connect_error` with auth failure, attempt refresh then reconnect
  - Connection status indicator in chat UI (Online / Reconnecting / Offline)
- Chat UI component (message list + input box)
- Auto-scroll on new message
- Load history on mount
- Real-time message list updates
- File picker (input type="file")
- Image preview inline; other files as download links
- Upload progress indicator
- Write `useSocket` hook unit test
- Write `MessageInput` unit test (edge cases: empty body, file too large, disabled state)

**Shared**

- `MessageSchema`, `SendMessageSchema`, `AttachmentSchema`

**Verify:** Two browser windows — customer creates ticket, agent accepts, both send text + file messages in real-time. Status transitions broadcast correctly.

### Week 4: Polish & Edge Cases

**Backend**

- Refresh token flow (better-auth JWT refresh)
- Logout (invalidate token/session)
- Prevent: agent messaging on tickets they don't own
- Prevent: customer messaging on resolved tickets
- Error handling hardening: integration tests for validation errors, auth failures, 404s, rate limit responses
- Pagination for ticket lists (cursor-based)

**Frontend**

- Loading states (skeleton screens)
- Empty states (no tickets, no messages)
- Error states (API down, unauthorized)
- Ticket status badge (Open / In Progress / Resolved)
- Token refresh interceptor (auto-refresh on 401)
- Logout button
- Disable input on resolved tickets
- Toast notifications for errors

**Verify:** Session survives via refresh tokens. Resolved tickets are read-only. Agents can't message another agent's tickets. All states covered.

### Week 5: Polish & Responsive

**Frontend**

- Responsive layout (mobile-friendly chat)
- Agent dashboard polish (queue filtering, sorting)
- Minor UX improvements from real usage

**Backend**

- Input validation hardening (edge cases in Zod schemas)
- Rate limit tuning based on real usage
- Minor: `@nestjs/throttler` rate limit response headers (`X-RateLimit-Remaining`, `X-RateLimit-Reset`)

**Verify:** Chat works on mobile viewport. All CRUD paths work with loading, empty, error states.

### Week 6: README, Resume Polish, Deploy

**Documentation**

- README with: architecture diagram, setup instructions, tech stack
- Demo script (steps to show a full ticket lifecycle)

**Deploy**

- Backend: Docker Compose or Railway/Render deployment (single-instance — SQLite is single-writer)
- Frontend: Vercel or Cloudflare Pages
- CORS config for production origins

**Resume bullets** (draft)

- Built real-time helpdesk chat with NestJS + Socket.io + SQLite on Node.js
- JWT auth with role-based access (Customer / Agent)
- pnpm workspaces monorepo with shared Zod schemas between frontend and backend
- Feature-based frontend structure co-locating routes, components, hooks, and utils
- Real-time bidirectional messaging with Socket.io room-per-ticket model
- Rate limited (HTTP + WS), gracefully shutting down, guarded file serving with ticket authorization

**Verify:** Deploy both services. Full ticket lifecycle works on production URLs.

## Entities (Drizzle schema)

Located at `packages/database/src/schema.ts`. Note: better-auth manages its own tables (`user`, `session`, `account`, `verification`) internally. Do not add them here.

```ts
// packages/database/src/schema.ts
import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

export const profiles = sqliteTable('profiles', {
  id: text('id').primaryKey(), // matches better-auth's internal user ID
  name: text('name').notNull(),
  role: text('role', { enum: ['customer', 'agent'] }).notNull(),
  createdAt: integer('created_at').notNull(), // Unix millis
});

export const tickets = sqliteTable(
  'tickets',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    subject: text('subject').notNull(),
    description: text('description').notNull(),
    status: text('status', { enum: ['open', 'in_progress', 'resolved'] })
      .notNull()
      .default('open'),
    customerId: text('customer_id')
      .notNull()
      .references(() => profiles.id),
    agentId: text('agent_id').references(() => profiles.id),
    createdAt: integer('created_at').notNull(), // Unix millis
    updatedAt: integer('updated_at').notNull(), // Unix millis, set =createdAt on insert
    resolvedAt: integer('resolved_at'), // Unix millis, nullable
  },
  (table) => ({
    statusIdx: index('idx_tickets_status_created').on(table.status, table.createdAt),
    customerIdx: index('idx_tickets_customer').on(table.customerId),
    agentIdx: index('idx_tickets_agent').on(table.agentId),
  }),
);

export const messages = sqliteTable(
  'messages',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    ticketId: integer('ticket_id')
      .notNull()
      .references(() => tickets.id),
    authorId: text('author_id')
      .notNull()
      .references(() => profiles.id),
    body: text('body').notNull(),
    createdAt: integer('created_at').notNull(), // Unix millis
  },
  (table) => ({
    ticketIdx: index('idx_messages_ticket').on(table.ticketId),
  }),
);

export const attachments = sqliteTable(
  'attachments',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    messageId: integer('message_id').references(() => messages.id),
    ticketId: integer('ticket_id')
      .notNull()
      .references(() => tickets.id),
    uploaderId: text('uploader_id')
      .notNull()
      .references(() => profiles.id),
    fileName: text('file_name').notNull(),
    fileSize: integer('file_size').notNull(),
    mimeType: text('mime_type').notNull(),
    filePath: text('file_path').notNull(),
    createdAt: integer('created_at').notNull(), // Unix millis
  },
  (table) => ({
    ticketIdx: index('idx_attachments_ticket').on(table.ticketId),
    messageIdx: index('idx_attachments_message').on(table.messageId),
    uploaderIdx: index('idx_attachments_uploader').on(table.uploaderId),
  }),
);
```

## Socket.io events

WS is for real-time broadcasts only. All mutations go through HTTP endpoints.

| Event                   | Direction       | Payload                                               | Notes                                                                                         |
| ----------------------- | --------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `ticket:new`            | Server→Agent    | `{ ticket }`                                          | Broadcast to agent pool when customer creates a ticket via HTTP POST                          |
| `agent:assigned`        | Server→Customer | `{ ticketId, agent }`                                 | Sent to ticket customer when agent accepts via HTTP PATCH                                     |
| `ticket:accepted`       | Server→Agent    | `{ ticketId }`                                        | Broadcast to agent pool (removes ticket from other agents' queues)                            |
| `ticket:resolved`       | Server→Room     | `{ ticketId }`                                        | Broadcast to ticket room + agent pool                                                         |
| `ticket:status_changed` | Server→Room     | `{ ticketId, status, updatedAt }`                     | Generic status transition broadcast (accept, resolve). All connected clients update UI.       |
| `message:sent`          | Server→Room     | `{ message }`                                         | Broadcast after `message:send` HTTP is persisted                                              |
| `file:uploaded`         | Server→Room     | `{ attachment }`                                      | Broadcast after upload completes via HTTP POST `/uploads`                                     |
| `reconnect:sync`        | Client→Server   | `{ ticketIds: number[], lastSeenMessageId?: number }` | On reconnect. Server responds via ack with `{ tickets: TicketState[], messages: Message[] }`. |

**WS error contract:** Every client→server event uses Socket.io acknowledgements. Server calls the callback with `undefined` on success, or `{ code: string, message: string, errors?: Record<string, string[]> }` on failure (same shape as HTTP errors — no wrapping `error` key on WS). For server-initiated errors (e.g., connection rejected, kicked from room), server emits a generic `error` event with the same shape. A `WsExceptionFilter` (NestJS) ensures unhandled gateway exceptions follow this contract.

## Testing Strategy

### Principles

- **Tiered coverage targets:** Critical state machine logic (open→in_progress→resolved→reopen→open): 95% lines, 100% branches. Service layer (auth rules, message permissions): 80% lines, 70% branches. Controllers/guards: no strict threshold (covered by integration tests).
- **Frontend tests only for critical UI** — chat input, socket hooks, ticket form. Skip simple presentational components (low risk, maintained by shadcn).
- **Integration tests for backend endpoints** — `supertest` + `@nestjs/testing` with in-memory SQLite (`:memory:`) validates controllers, guards, pipes, and services against a real database (not mocked). Run migrations before suite, truncate between tests.
- **WS integration tests** — one happy-path test per event type: boot NestJS with real Socket.io server, connect `socket.io-client` in-process, verify HTTP mutation → WS broadcast round-trip. Catches event name / payload contract drift.
- **E2E (minimal):** One Playwright script: open two browser contexts, create ticket, send messages from each side, verify delivery. Covers the multi-process flow that unit/integration tests miss.

### Tooling

| Layer     | Tool                          | Notes                                                      |
| --------- | ----------------------------- | ---------------------------------------------------------- |
| Runner    | vitest                        | Single config per workspace. `vitest run` in CI.           |
| Frontend  | React Testing Library + jsdom | Co-located in `features/*/__tests__/`                      |
| Backend   | vitest + supertest            | Co-located in `*/__tests__/`. Mock Drizzle client.         |
| Shared    | vitest                        | `packages/shared/src/__tests__/` for Zod schema validation |
| Socket.io | `@nestjs/testing`             | Instantiate gateway, mock service deps. No real WS client. |

### Fixtures

Backend test helpers are co-located at `apps/backend/src/__tests__/helpers/`:

```
apps/backend/src/
  ├── auth/
  │   ├── auth.service.ts
  │   ├── auth.service.test.ts
  │   └── ... (co-located tests)
  ├── tickets/...
  └── __tests__/             (shared test infra)
      └── helpers/
          ├── factories.ts   (buildUser, buildCustomer, buildAgent, buildTicket, buildMessage)
          └── mocks.ts       (mockDrizzle — returns a mocked db instance)
```

Each feature's `__tests__/` imports from `../__tests__/helpers/` or defines feature-specific mocks inline.

### Coverage

| Target                     | Threshold                | Enforced                           |
| -------------------------- | ------------------------ | ---------------------------------- |
| Backend state machine      | 95% lines, 100% branches | vitest config + CI                 |
| Backend services (rest)    | 80% lines, 70% branches  | vitest config + CI                 |
| Backend controllers/guards | none                     | Integration tests cover implicitly |
| Frontend                   | none                     | Manual review for critical paths   |
| Shared schemas             | none                     | Tests pass/fail                    |

### CI test job

Runs `turbo test` in CI. Each workspace has its own vitest config; Turbo runs them in parallel. WS integration tests use a separate vitest config that runs sequentially (shared Socket.io server).

### CI security job (added to CI/CD)

Parallel job: `pnpm audit --prod` to catch known vulnerabilities in runtime dependencies. Runs alongside lint/typecheck/test/build.

## Directories

```
realtime-chat-support/
├── package.json            (root — pnpm workspaces, scripts)
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── .npmrc
├── .github/
│   └── workflows/
│       └── ci.yml
├── turbo.json              (Turborepo task pipeline)
├── oxlint.json             (oxlint config)
├── oxfmtrc.json            (oxfmt config)
├── CONTEXT.md
├── apps/
│   ├── frontend/
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── vitest.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   ├── index.html
│   │   └── src/
│   │       ├── main.tsx
│   │       ├── routes/              (TanStack Router file-based)
│   │       │   ├── __root.tsx
│   │       │   ├── index.tsx        (redirect based on role)
│   │       │   ├── login.tsx
│   │       │   ├── register.tsx
│   │       │   └── tickets/
│   │       │       ├── index.tsx    (customer: my / agent: queue)
│   │       │       ├── new.tsx      (create ticket)
│   │       │       └── $ticketId.tsx (detail + chat)
│   │       └── features/            (feature-based grouping)
│   │           ├── auth/
│   │           │   ├── components/
│   │           │   │   ├── LoginForm.tsx
│   │           │   │   └── RegisterForm.tsx
│   │           │   └── utils/
│   │           │       └── auth.ts  (better-auth client)
│   │           ├── tickets/
│   │           │   ├── components/
│   │           │   │   ├── TicketCard.tsx
│   │           │   │   ├── TicketStatusBadge.tsx
│   │           │   │   └── chat/
│   │           │   │       ├── MessageList.tsx
│   │           │   │       └── MessageInput.tsx
│   │           │   ├── hooks/
│   │           │   │   └── useSocket.ts
│   │           │   └── utils/
│   │           │       ├── api.ts   (ticket fetch wrappers)
│   │           │       └── socket.ts
│   │           └── ui/              (shadcn components)
│   │               └── ...
│   └── backend/
│       ├── package.json
│       ├── tsconfig.json
│       ├── vitest.config.ts
│       └── src/
│           ├── main.ts
│           ├── env.ts               (Zod env config)
│           ├── app.module.ts
│           ├── auth/                (feature: NestJS module)
│           │   ├── auth.module.ts
│           │   ├── auth.controller.ts
│           │   ├── auth.service.ts
│           │   └── guards/
│           │       └── jwt-auth.guard.ts
│           ├── tickets/
│           │   ├── tickets.module.ts
│           │   ├── tickets.controller.ts
│           │   ├── tickets.service.ts
│           │   └── tickets.gateway.ts
│           ├── messages/
│           │   ├── messages.module.ts
│           │   ├── messages.service.ts
│           │   ├── messages.controller.ts
│           │   └── messages.gateway.ts
│           ├── database/             (NestJS wrapper — imports @repo/database)
│           │   └── database.module.ts
│           └── common/              (shared infra)
│               ├── errors/
│               │   ├── app-error.ts
│               │   ├── not-found-error.ts
│               │   ├── forbidden-error.ts
│               │   ├── validation-error.ts
│               │   ├── conflict-error.ts
│               │   ├── app-exception-filter.ts
│               │   └── ws-exception-filter.ts
│               ├── roles.decorator.ts
│               └── zod-validation.pipe.ts
└── packages/
    ├── shared/
    │   ├── package.json       (name: "@repo/shared")
    │   ├── tsconfig.json
    │   └── src/
    │       ├── schemas/
    │       │   ├── user.ts
    │       │   ├── ticket.ts
    │       │   └── message.ts
    │       ├── types/
    │       │   ├── ticket.ts
    │       │   └── message.ts
    │       └── index.ts
    └── database/
        ├── package.json       (name: "@repo/database")
        ├── tsconfig.json
        ├── tsdown.config.ts
        └── src/
            ├── schema.ts      (all Drizzle tables)
            ├── client.ts      (createClient() — returns Drizzle instance)
            ├── migrate.ts     (run migrations entry point)
            ├── migrations/    (SQL files from drizzle-kit generate)
            └── index.ts
```
