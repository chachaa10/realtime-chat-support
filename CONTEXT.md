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
_Avoid_: Staff, support rep, operator

**User**:
Either a Customer or an Agent. The base identity handled by better-auth. Role discriminator: `customer | agent`.

**Ticket Status**:
One of: `Open` (submitted, awaiting agent), `In Progress` (agent accepted), `Resolved` (agent marked done), `Cancelled` (customer withdrew while ticket was still Open). States: `open → in_progress → resolved` (terminal), `open → cancelled` (terminal). No reopen from cancelled.
_Avoid_: Closed, Pending, Awaiting Customer

**Ticket Event**:
An audit record of a status transition on a ticket. Logs the from/to states, who triggered it, and when. Created for every status change including ticket creation.

**Label**:
A predefined tag that can be attached to a ticket for categorization and queue filtering. Belongs to a predefined set managed by agents. Many-to-many with tickets via a join table. Optional at ticket creation. Example values: bug, billing, feature-request, account, urgent.
_Avoid_: Tag, category, priority
