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

## Release 2: Real-time Messaging (Not Started)

### Scope
- Backend Messages module (NestJS)
- POST /tickets/:id/messages — send a message
- GET /tickets/:id/messages — load message history
- Socket.io room-per-ticket with JWT handshake + authorization
- Broadcast message:sent to ticket room
- Permission checks (customer on own ticket, agent on assigned/unassigned)
- Customer cannot message on resolved/cancelled tickets
- Frontend chat UI: MessageList + MessageInput
- Socket.io client with auto-reconnect
- Auto-scroll on new messages
- Typing indicator: WS event + broadcast + debounce + UI
- Agent capacity enforcement: count `in_progress` tickets on accept, block when at limit

### Estimated effort: 1 sprint

## Release 3: File Attachments + UX Polish

### Scope
- POST /uploads — multipart upload with 10MB limit and MIME validation
- GET /uploads/:id — guarded file serving
- Frontend file picker, image preview, upload progress
- Token refresh interceptor
- Connection status indicator
- Loading/empty/error states (skeletons, toasts)
- Socket.io reconnect:sync handshake
- Disable input on resolved tickets

### Estimated effort: 1 sprint

## Release 4: Agent Features + Notifications

### Scope
- Agent return to queue (in_progress -> open, clear assignment)
- Agent availability toggle (Online / Away with queue visibility)
- In-app notification feed (bell icon, badge count, notification list)
- Notification auto-mark read on viewing related ticket
- Browser tab title flash with unread count
- Customer ticket event timeline (simplified)
- Agent capacity hint on Accept button ("At capacity")
- Notification toasts on new events

### Estimated effort: 1 sprint

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
