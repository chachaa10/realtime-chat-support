# Realtime Chat Support

A real-time helpdesk where customers submit tickets and agents resolve them via
live conversation.

## Register

**Product / App UI.** Design serves the workflow, not itself.

## Users

**Customer** — submits tickets, waits for response, chats with agent.
Uses the app infrequently, under stress (has a problem).

**Agent** — manages a queue of tickets, handles multiple conversations
simultaneously, works 8+ hours/day at a desk.

## Key scenarios

| Actor | Scenario | Outcome |
|---|---|---|
| Customer | Submits a ticket with subject + description | Ticket enters queue with `open` status |
| Agent | Opens ticket queue, picks a ticket | Status changes to `in_progress` |
| Customer + Agent | Chat in real-time | Side-by-side conversation on the ticket |
| Agent | Marks ticket resolved | Status -> `resolved`, customer notified |
| Customer | Cancels their open ticket | Status -> `cancelled` |

## Brand personality

**Focused** — not playful, not corporate. Clear purpose.

**Reliable** — every state is visible, nothing is hidden.

**Efficient** — high information density for agents, clear next actions.

## Physical scene

An agent sits at a desk under office lighting, managing 4-6 active
conversations across a dual-monitor setup.
They need to scan the queue, pick the next ticket, and respond without
cognitive friction.
This is their tool for 8 hours.

The scene forces:
- Light mode with high contrast (office lighting, glare)
- Dark mode for after-hours shifts (support is 24/7)
- Compact layouts — no wasted whitespace for power users
- Clear status signals at a glance (color + text + shape)
- Keyboard-navigable workflows

## Bans

- Gradient text
- Glassmorphism
- Cards with left coloured stripes as sole visual differentiation
- Numbered section markers (01 / 02 / 03)
- SaaS hero-metric template (big number, small label)
- Eyebrow kickers on every section
- border-radius > 16px on containers
- border + wide box-shadow on the same element
