# Product Backlog

Prioritized by business value and dependency order. P0 = must-have for MVP, P1
= important but not blocking, P2 = nice-to-have.

## P0 — Core MVP (Done)

- [x] User registration with email/password + role selection
- [x] User login/logout with JWT sessions (better-auth)
- [x] Auth context with route guards and localStorage persistence
- [x] Role-based access control (customer / agent guards)
- [x] Landing page with product info, features, CTA
- [x] Ticket creation (subject, description, optional labels)
- [x] Ticket list for customers (my tickets)
- [x] Ticket list for agents (queue + my tickets tabs)
- [x] Ticket detail page with status badge and metadata
- [x] Agent accepts ticket from queue (atomic, conflict-safe)
- [x] Agent resolves assigned ticket
- [x] Customer cancels own open ticket
- [x] Ticket Events audit log (every status transition recorded)
- [x] Label management (predefined labels, add/remove on tickets)
- [x] Label filter on queue
- [x] Light/dark mode toggle
- [x] API rate limiting (per-user + global + WS)
- [x] Error hierarchy (AppError subclasses), global exception filters
- [x] File storage port/adapter (LocalFileStorage for uploads/)
- [x] Database schema: profiles, tickets, messages, attachments, ticket_events,
      labels, ticket_labels (Drizzle + SQLite)
- [x] Shared Zod schemas and types (@repo/shared)
- [x] CI pipeline (lint, typecheck, test, build, audit)
- [x] Seed script for development data
- [x] Graceful shutdown with WAL checkpoint

## P0 — Real-time Messaging (Not Started)

### Schema & types — done
- [x] messages table schema in Drizzle (message-schema.ts)
- [x] MessageSchema, SendMessageSchema in @repo/shared
- [x] Message, SendMessageInput type exports
- [x] Drizzle relations defined (messages -> tickets, profiles, attachments)

### Backend — not started
- [ ] Backend Messages module (controller, service, gateway)
- [ ] POST /tickets/:id/messages (send a message)
- [ ] GET /tickets/:id/messages (load history)
- [ ] Socket.io room-per-ticket with JWT handshake auth
- [ ] Broadcast message:sent to ticket room
- [ ] Permission checks: only ticket participants see messages
- [ ] Customer cannot message on resolved/cancelled tickets

### Frontend — not started
- [ ] Frontend chat UI (MessageList + MessageInput components)
- [ ] Socket.io client with JWT auth and auto-reconnect
- [ ] Auto-scroll on new message
- [ ] Typing indicators (WS event + broadcast + UI)
- [ ] Agent capacity enforcement on accept (count `in_progress`, block when at limit)

## P1 — File Attachments

### Storage layer — done
- [x] FileStorage interface (port/adapter pattern)
- [x] LocalFileStorage implementation (writes to uploads/)
- [x] Attachment DB schema (attachments table with FK to messages and tickets)
- [x] AttachmentSchema in @repo/shared

### Endpoints & frontend — not started
- [ ] POST /uploads — multipart upload, 10MB limit, MIME validation
- [ ] GET /uploads/:id — guarded file serving with ticket membership check
- [ ] Frontend file picker in chat input
- [ ] Image preview inline; other files as download links
- [ ] Upload-first flow: upload via POST /uploads, upload token, attach attachmentId to message

## P1 — UX Polish

### Partially done
- [x] Loading skeleton on ticket detail page

### Not started
- [ ] Loading states on ticket list and chat
- [ ] Empty states (no tickets, no messages)
- [ ] Error states with toast notifications
- [ ] Token refresh interceptor (auto-refresh on 401)
- [ ] Connection status indicator (Online / Reconnecting / Offline)
- [ ] Disable message input on resolved/cancelled tickets
- [ ] Socket.io reconnect:sync handshake

## P1 — Agent Features

### Done
- [x] Broadcast ticket:new to agent pool
- [x] Broadcast ticket:accepted to agent pool
- [x] Broadcast ticket:resolved to agent pool
- [x] Broadcast ticket:cancelled to agent pool

### Not started
- [ ] Agent return ticket to queue (in_progress -> open, clear assignment)
- [ ] Agent availability toggle (Online / Away)
- [ ] Agent capacity hint on Accept button ("At capacity")
- [ ] Agent capacity enforcement on accept (count `in_progress`, block when at limit)

## P1 — Notifications

_No schema, backend, or frontend implementation yet._

- [ ] Notification DB schema and types
- [ ] Notification service + controller (backend)
- [ ] Ticket event simplified timeline on customer ticket detail
- [ ] In-app notification feed (bell icon, badge count, notification list)
- [ ] Notification auto-mark read on viewing related ticket
- [ ] Browser tab title flash with unread count
- [ ] In-app toast on new notification

## P2 — Backend Hardening

_Not started._

- [ ] Cursor-based pagination for ticket lists
- [ ] Pagination for message history
- [ ] Orphan attachment cleanup (cron: unattached > 1 hour)
- [ ] Age-based attachment cleanup (cron: older than 30 days)
- [ ] Per-user daily upload cap (50MB)
- [ ] Rate limit response headers (X-RateLimit-Remaining, X-RateLimit-Reset)
- [ ] Range header support on file serving for video seeking

## P2 — Frontend Polish

_Not started._

- [ ] Responsive mobile layout
- [ ] Agent dashboard: queue sorting
- [ ] Upload progress indicator

## P2 — Deploy & Docs

_Not started._

- [ ] Backend deployment config (Docker Compose / Railway)
- [ ] Frontend deployment config (Vercel / Cloudflare Pages)
- [ ] CORS config for production origins
- [ ] README with architecture diagram and setup instructions
- [ ] E2E Playwright test (multi-browser ticket lifecycle)
