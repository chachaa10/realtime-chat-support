# Real-time Chat Support

A real-time helpdesk chat support application. Customers submit tickets describing their issues; agents pick tickets from a queue and resolve them via real-time chat. Built to practice backend engineering (NestJS, WebSockets) with a deliberately separated frontend SPA.

## Language

**Ticket**:
A container for a customer issue request. Holds metadata (subject, status, assignment) and owns the conversation.
_Avoid_: Issue, case, conversation

**Message**:
A single unit of communication within a ticket's conversation. Belongs to exactly one ticket and one author. Immutable once sent.
_Avoid_: Post, reply, comment

**Conversation**:
The message thread attached to a ticket. Not a first-class entity — it's the collection of Messages for a given Ticket.

**Customer**:
A person who submits tickets and participates in their conversation.
_Avoid_: User, client, requester

**Agent**:
A staff member who resolves tickets by responding in the conversation.
Registration is self-service (anyone can sign up with the `agent` role).
Each agent has a configurable capacity of `in_progress` tickets they can work on simultaneously.
Each agent has an availability toggle: Online (visible in queue, can accept) or Away (hidden from queue, existing tickets stay assigned).
_Avoid_: Staff, support rep, operator

**User**:
Either a Customer or an Agent. The base identity handled by better-auth. Role discriminator: `customer | agent`.

**Ticket Status**:
One of: `Open` (submitted, awaiting agent), `In Progress` (agent accepted), `Resolved` (agent marked done), `Cancelled` (customer withdrew while ticket was still Open). States: `open → in_progress → resolved` (terminal), `open → cancelled` (terminal), `in_progress → open` (agent returns ticket to queue, clears assignment). No reopen from resolved or cancelled — customer must create a new ticket.
_Avoid_: Closed, Pending, Awaiting Customer

**Ticket Event**:
An audit record of a status transition on a ticket. Logs the from/to states, who triggered it, and when. Created for every status change including ticket creation. Customer sees a simplified timeline; agent sees the full log.

**Label**:
A predefined tag that can be attached to a ticket for categorization and queue filtering. The label set is seeded in the database (no runtime management UI). Many-to-many with tickets via a join table. Optional at ticket creation. Example values: bug, billing, feature-request, account, urgent.
_Avoid_: Tag, category, priority

**Agent Capacity**:
The maximum number of `in_progress` tickets an agent can hold simultaneously. Configurable per-agent. Default ~5-8. When at capacity, the Accept button shows "At capacity" and is disabled.

**Agent Availability**:
An agent's current work state: Online (visible in queue, can accept tickets) or Away (hidden from queue, existing tickets stay assigned). Toggled by the agent from their profile/header. No auto-idle detection for P0.

**Attachment**:
A file uploaded and linked to either a ticket (at creation time) or a message (in chat). Uploaded via a two-step orphan-then-link flow: file is uploaded to a staging area, gets an upload token, and is linked to the ticket or message on form submission. Orphan attachments (unlinked for >1 hour) are cleaned up. Supports images (inline preview), videos (progressive download with Range header), and documents (download link). MIME validation by magic bytes, not client Content-Type.

**Notification**:
An in-app event record persisted to the database. Notifications are created for specific events (ticket accepted, new message, ticket resolved, ticket returned to queue) and delivered to the relevant user. Auto-marked as read when the user views the related ticket. Also drives browser tab title flash (unread count) and in-app toasts. Delivery through WebSocket while connected; persisted for retrieval on next page load.

**Typing Indicator**:
A real-time signal broadcast via WebSocket to the ticket room when a participant is typing. Sent as a debounced event (no persistence). Indicates real-time activity only — does not imply message delivery or read status.
