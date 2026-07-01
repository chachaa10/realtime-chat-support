# Release Plan

## Release 1: Foundation + Tickets CRUD (Complete)

### Delivered

- Backend: NestJS bootstrap with helmet, CORS, correlation ID, graceful shutdown
- Database: full Drizzle schema (profiles, tickets, messages, attachments,
  ticket_events, labels, ticket_labels) with migrations and seed script
- Auth: better-auth integration, JWT, registration profile hook, role guards
- Tickets: full CRUD with state machine (create, list, detail, accept, resolve,
  cancel), labels add/remove, ticket event recording
- Error handling: AppError hierarchy, global HTTP + WS exception filters
- Rate limiting: ThrottlerModule, per-user guard, WS guard
- File storage: FileStorage port/adapter (LocalFileStorage)
- Frontend: Vite + TanStack Router + shadcn scaffold
- Frontend: login/register, auth context, route guards
- Frontend: ticket list (customer + agent views), detail page, create form
- Frontend: agent queue tabs (My/Queue), label filter
- Frontend: landing page with full sections
- Frontend: light/dark theme toggle
- Shared: all Zod schemas and types
- CI: GitHub Actions with lint, typecheck, test, build, audit
- API response contract: success, error, paginated shapes

## Release 2: Real-time Messaging (Complete)

### Delivered

- Backend Messages module (MessagesService, MessagesController, MessagesModule)
- POST /tickets/:id/messages — send a message with permission checks
- GET /tickets/:id/messages — load message history
- Socket.io room-per-ticket with cookie-based auth + token fallback
- join:ticket / leave:ticket event handlers with permission verification
- Broadcast message:sent to ticket room on every message
- Permission checks: customer on own ticket, agent on any ticket
- Customer blocked from sending on resolved/cancelled tickets
- Frontend chat UI: MessageBubble, MessageList (auto-scroll), MessageInput
- Socket.io client with WebSocket transport and auto-reconnect
- Typing indicator: debounced WS event, relay via gateway, UI in MessageList
- Agent capacity enforcement: count in_progress tickets, reject at max 8
- 12 integration tests for MessagesService

## Release 3: File Attachments + UX Polish (Complete)

### Delivered

- FileStorage port/adapter with LocalFileStorage (saves to `uploads/`)
- MIME validation by magic bytes (rejects executables/scripts)
- POST /uploads — multipart upload with 10MB limit, returns attachment object
- GET /uploads/:id — guarded file serving with ticket membership check
- Upload module registered in AppModule with DI
- Message attachment linking: `sendMessage` accepts `attachmentIds`, links orphan attachments
- Enriched message responses include `attachments[]` via `MessageWithAttachments` type
- Socket.io `reconnect:sync` handshake: server returns missed messages since timestamp
- Frontend upload API wrapper with XHR progress tracking
- File picker in chat input, image preview inline, other files as download links
- Connection status indicator (Online/Reconnecting/Offline)
- Toast notification system (sonner) with error toasts on mutations
- 401 session expiry handling: clear state + redirect to login (excludes auth endpoints)
- Reconnect:sync on frontend: emits on socket `connect` when cache has messages
- Loading/empty/error states on MessageList and chat views
- 13 integration tests for FileStorage, upload controller, attachment linking, and gateway
- All CI checks passing (lint, typecheck, test, build, E2E)

## Release 4: Agent Features + Notifications (Complete)

### Delivered

- Backend: return to queue endpoint with state transition `in_progress → open`
- Backend: agent availability profile field (`online`/`away`) with toggle endpoint
- Backend: availability enforcement on ticket accept (away agents rejected)
- Backend: capacity status endpoint (`GET /tickets/capacity-status`)
- Backend: notifications table schema, service, controller, broadcaster
- Backend: per-user Socket.io rooms for targeted notification delivery
- Backend: notification creation integrated into ticket state machine (accept, resolve, return) and message sending
- Frontend: return-to-queue button on assigned in-progress tickets
- Frontend: agent availability toggle in sidebar
- Frontend: capacity-aware Accept button (shows "At capacity" / "You are away")
- Frontend: notification bell with unread badge + dropdown list
- Frontend: real-time notification toasts via Socket.io
- Frontend: tab title flash with unread count
- Frontend: auto-mark notifications read on ticket view
- Frontend: customer ticket event timeline (simplified)
- All CI checks passing: 121 tests across 10 test files, typecheck clean

## Release 5: Backend Hardening + Frontend Polish

### Scope

- Cursor-based pagination for tickets and messages
- Orphan and age-based attachment cleanup (cron jobs)
- Per-user daily upload cap
- Rate limit response headers
- Range header support for video
- Responsive mobile layout
- Agent dashboard sorting

### Estimated effort: 1 sprint

## Release 6: Deploy

### Scope

- Backend: Docker Compose or Railway/Render deployment
- Frontend: Vercel or Cloudflare Pages
- CORS config for production origins
- README with architecture diagram, setup, demo script
- E2E Playwright test (multi-browser ticket lifecycle)

### Estimated effort: 1 sprint
