# Requirements

## Functional

### Authentication & Authorization

| ID | Requirement | Priority |
|---|---|---|
| AUTH-1 | Users can register with email + password + role selection (customer/agent) | P0 |
| AUTH-2 | Users can log in with email + password | P0 |
| AUTH-3 | JWT-based sessions with refresh token rotation | P0 |
| AUTH-4 | Users can log out (invalidate session) | P0 |
| AUTH-5 | Route guards redirect unauthenticated users to login | P0 |
| AUTH-6 | Role-based guards restrict customer vs agent endpoints | P0 |
| AUTH-7 | Rate limiting on auth endpoints: 5 attempts/min per email, 3 signups/min | P0 |

### Ticket Management

| ID | Requirement | Priority |
|---|---|---|
| TKT-1 | Customers can create tickets with subject, description, and optional labels | P0 |
| TKT-2 | Customers can view their own tickets (list + detail) | P0 |
| TKT-3 | Customers can cancel their own open tickets | P0 |
| TKT-4 | Agents can view the open ticket queue | P0 |
| TKT-5 | Agents can accept an open ticket (atomic, race-condition safe) | P0 |
| TKT-6 | Agents can view tickets assigned to them | P0 |
| TKT-7 | Agents can resolve tickets assigned to them | P0 |
| TKT-8 | Every status transition is recorded as a Ticket Event (audit log) | P0 |
| TKT-9 | Agents can add/remove labels on tickets | P1 |
| TKT-10 | Ticket lists can be filtered by status and label | P1 |
| TKT-11 | Ticket lists use cursor-based pagination | P2 |
| TKT-12 | Agents can return an assigned ticket to the queue (`in_progress` -> `open`, clears assignment) | P1 |

### Real-time Messaging

| ID | Requirement | Priority |
|---|---|---|
| MSG-1 | Customers and agents can send messages on a ticket | P0 |
| MSG-2 | Messages are broadcast in real-time to all participants in the ticket room | P0 |
| MSG-3 | Message history is loaded on ticket open | P0 |
| MSG-4 | Only ticket participants (customer + assigned agent) can see messages | P0 |
| MSG-5 | Customers cannot send messages on resolved or cancelled tickets | P0 |
| MSG-6 | WebSocket reconnection sync: missed messages delivered on reconnect | P1 |
| MSG-7 | Connection status indicator (Online / Reconnecting / Offline) | P1 |
| MSG-8 | Typing indicators broadcast in real-time to ticket room (debounced, no persistence) | P1 |

### File Attachments

| ID | Requirement | Priority |
|---|---|---|
| ATT-1 | Customers and agents can upload files at two levels: ticket-level (at creation) and message-level (in chat) | P1 |
| ATT-2 | Uploads are limited to 10MB per file | P0 |
| ATT-3 | MIME type validation rejects executables and scripts | P0 |
| ATT-4 | Files are served through a guarded endpoint with ticket membership check | P1 |
| ATT-5 | `Range` header support for video seeking | P2 |
| ATT-6 | Orphan cleanup: unattached files older than 1 hour are deleted | P2 |
| ATT-7 | Age-based cleanup: files older than 30 days are deleted | P2 |
| ATT-8 | Per-user daily upload cap of 50MB | P2 |

### Agent Features

| ID | Requirement | Priority |
|---|---|---|
| AGT-1 | Agents see two queue tabs: "My Tickets" (assigned) and "Queue" (open) | P0 |
| AGT-2 | New tickets broadcast to all connected agents in real-time | P0 |
| AGT-3 | Ticket status changes broadcast to agent pool in real-time | P0 |
| AGT-4 | Agent capacity limit enforced: each agent has a configurable max `in_progress` tickets (default ~5-8) | P0 |
| AGT-5 | Agents can toggle availability: Online (visible in queue, can accept) / Away (hidden from queue, existing tickets stay assigned) | P1 |

### UI / UX

| ID | Requirement | Priority |
|---|---|---|
| UI-1 | Landing page with product information, features, and CTA | P0 |
| UI-2 | Light and dark mode with theme toggle | P0 |
| UI-3 | Responsive layout (mobile-friendly chat) | P2 |
| UI-4 | Loading states (skeleton screens) on all async pages | P1 |
| UI-5 | Empty states for empty ticket lists and conversations | P1 |
| UI-6 | Error states with toast notifications for API failures | P1 |
| UI-7 | Ticket status badges (Open / In Progress / Resolved / Cancelled) | P0 |
| UI-8 | Image preview inline in chat; other files as download links | P1 |
| UI-9 | Upload progress indicator | P2 |
| UI-10 | Auto-scroll on new messages | P0 |
| UI-11 | Disable message input on resolved tickets | P1 |
| UI-12 | In-app notification feed with bell icon, badge count, and notification list | P1 |
| UI-13 | Browser tab title updates with unread notification count | P1 |
| UI-14 | Agent capacity hint: "At capacity" shown on Accept button when agent is at limit | P1 |
| UI-15 | Customer sees simplified ticket event timeline on ticket detail page | P1 |
| UI-16 | Typing indicator in chat UI (shows when the other participant is typing) | P1 |

## Non-functional

| ID | Requirement |
|---|---|
| NFR-1 | Backend: NestJS with Socket.io on Node.js runtime |
| NFR-2 | Frontend: Vite + TanStack Router SPA (no SSR) |
| NFR-3 | Database: SQLite via Drizzle ORM + better-sqlite3 driver |
| NFR-4 | Monorepo: Turborepo v2 + pnpm workspaces |
| NFR-5 | API rate limiting: 100 req/min per-user, 500 req/min global ceiling |
| NFR-6 | WS rate limiting: 1 reconnect:sync/5s per socket, 10 connects/min per IP |
| NFR-7 | Graceful shutdown: drain Socket.io, WAL checkpoint, close SQLite |
| NFR-8 | Security: Helmet headers, body size limit (1MB), CORS, X-Correlation-ID |
| NFR-9 | Auth: better-auth with Drizzle adapter, email/password only |
| NFR-10 | Lint: oxlint, Format: oxfmt |
| NFR-11 | CI: GitHub Actions with lint, typecheck, test, build, audit |
| NFR-12 | IDs: SQLite auto-increment integers |
| NFR-13 | File storage: abstracted behind FileStorage port/adapter (local disk initially, swappable to S3) |
| NFR-14 | MIME validation: magic-byte detection (file-type), not client-supplied Content-Type |
