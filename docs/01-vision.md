# Vision: Real-time Chat Support

A real-time helpdesk where customers submit tickets describing their issues and
agents pick them from a queue to resolve via live conversation.

## Target users

**Customer** — submits a ticket, waits for response, chats with an agent.
Uses the app infrequently, under stress (they have a problem that needs solving).

**Agent** — manages a queue of tickets, handles multiple conversations
simultaneously, works 8+ hours/day at a desk.
Needs to scan the queue, pick the next ticket, and respond without cognitive
friction.

## Brand personality

**Focused** — not playful, not corporate. Clear purpose.

**Reliable** — every state is visible, nothing is hidden.

**Efficient** — high information density for agents, clear next actions.

## Key scenarios

| Actor | Scenario | Outcome |
|---|---|---|---|
| Customer | Submits a ticket with subject + description | Ticket enters queue with `open` status |
| Agent | Opens ticket queue, picks a ticket | Status changes to `in_progress` |
| Customer + Agent | Chat in real-time | Side-by-side conversation on the ticket |
| Agent | Marks ticket resolved | Status -> `resolved`, customer notified |
| Customer | Cancels their open ticket | Status -> `cancelled` |
| Agent | Returns ticket to queue | Status -> `open`, agent unassigned, back in pool |
| Customer | Receives notification of agent action | Badge count + tab title flash + toast |

## Domain

Single bounded context: **Ticket Support**.

A **Ticket** is a container for a customer issue request. It holds metadata
(subject, status, assignment, labels) and owns the **Conversation** (the message
thread). A **Message** is a single unit of communication within that
conversation. **Ticket Events** record every status transition as an audit log.
**Labels** categorize tickets for queue filtering.

## Non-goals

- Multi-product or multi-organization support (single workspace)
- Phone or video support (text-only chat)
- Customer satisfaction surveys or CSAT scoring
- Knowledge base / FAQ articles
- Chatbots or automated responses
- Full-text search across tickets or messages
- Email integration (inbound/outbound)
