# User Stories

## Customer

### Registration & Authentication

**C-1: Register as a customer** ✅
As a prospective customer, I want to sign up with my email and password so that
I can submit support tickets.
_Acceptance:_ Registration form with email, password, role selector. On submit,
account and profile are created, user is redirected to the ticket list.

**C-2: Log in** ✅
As a registered customer, I want to log in with my credentials so that I can
access my tickets.
_Acceptance:_ Login form. On success, JWT stored and user redirected to ticket
list.

**C-3: Stay logged in** ✅
As a customer, I want my session to persist across page reloads so that I don't
need to log in repeatedly.
_Acceptance:_ JWT stored in localStorage. On page load, token is validated. On
expiry, refresh token is used to obtain a new JWT.

### Ticket Management

**C-4: Create a ticket** ✅
As a customer, I want to create a support ticket with a subject and description
so that an agent can help me with my issue.
_Acceptance:_ Form with subject (required), description (required), optional
labels. On submit, ticket appears in "My Tickets" with `open` status. Agents
receive a real-time notification.

**C-5: View my tickets** ✅
As a customer, I want to see a list of all my tickets so that I can track their
status.
_Acceptance:_ "My Tickets" page showing all tickets the customer has created,
sorted by creation date (newest first). Each ticket shows subject, status,
creation date.

**C-6: View ticket detail** ✅
As a customer, I want to see the full details of a ticket including its current
status and assigned agent.
_Acceptance:_ Clicking a ticket opens its detail page showing subject,
description, status badge, agent name (if assigned), timestamps, and labels.

**C-7: Cancel an open ticket** ✅
As a customer, I want to cancel my open ticket if I no longer need help.
_Acceptance:_ Cancel button visible only on `open` tickets. On confirm, status
changes to `cancelled`. Input is disabled. Button is hidden.

### Real-time Chat

**C-8: Chat with an agent** 🚧
As a customer, I want to exchange real-time messages with an agent on my ticket
so that I can get help.
_Acceptance:_ When an agent has accepted the ticket, a chat interface appears.
Messages sent by either party appear in real-time without page refresh.
When the agent is typing, a typing indicator is shown below the message input.

**C-9: Send files in chat** ✅
As a customer, I want to attach files (images, documents) to my messages so
that I can share relevant information.
_Acceptance:_ File picker button in the message input. Selected files are
uploaded and attached to the message. Images appear inline; other files show as
download links.

**C-10: See connection status** ✅
As a customer, I want to see my real-time connection status so that I know if
my messages are being delivered.
_Acceptance:_ Status indicator in the chat UI showing Online, Reconnecting, or
Offline.

**C-11: Cannot message on resolved tickets** ✅
As a customer, I want the message input to be disabled when the ticket is
resolved or cancelled so that I know the conversation is over.
_Acceptance:_ Message input is disabled with a "Ticket is resolved" message.
"Resolved" badge is visible.

**C-12: See typing indicator** 🚧
As a customer, I want to see when the agent is typing so that I know someone is
responding.
_Acceptance:_ When the agent is typing in the chat input, a "Agent is typing..."
indicator appears below the message list. Disappears when typing stops (debounced).

### Notifications

**C-13: Receive in-app notifications** 🚧
As a customer, I want to receive notifications when my ticket is accepted,
returned to queue, or resolved so that I stay informed without refreshing.
_Acceptance:_ A bell icon in the header shows an unread badge count. Clicking it
opens a notification list. Notifications auto-mark as read when I view the
related ticket. Tab title updates with unread count.

**C-14: See ticket event timeline** 🚧
As a customer, I want to see a simplified timeline of status changes on my
ticket so that I understand what's happening.
_Acceptance:_ On the ticket detail page, a timeline shows key events: "Ticket
created", "Agent assigned", "Ticket resolved". Each entry shows the timestamp.

## Agent

### Registration & Authentication

**A-1: Register as an agent** ✅
As a prospective agent, I want to sign up with my email and password and select
the "agent" role so that I can access the agent queue.
_Acceptance:_ Same registration flow as customer, with role set to `agent`.

**A-2: Log in** ✅
As an agent, I want to log in and land on the ticket queue so that I can start
working.
_Acceptance:_ On login, agent is redirected to the ticket queue page.

### Queue Management

**A-3: View the open ticket queue** ✅
As an agent, I want to see all open (unassigned) tickets so that I can pick one
to work on.
_Acceptance:_ "Queue" tab showing all tickets with `open` status and no agent
assigned. Each card shows subject, customer, creation time, labels.

**A-4: View my assigned tickets** ✅
As an agent, I want to see the tickets I'm currently working on so that I can
manage my workload.
_Acceptance:_ "My Tickets" tab showing tickets assigned to me with
`in_progress` status.

**A-5: Accept a ticket** ✅
As an agent, I want to pick a ticket from the queue so that I can start helping
the customer.
_Acceptance:_ "Accept" button on open tickets. Clicking atomically assigns the
ticket to me and changes status to `in_progress`. If another agent already
accepted, a conflict error is shown. If I'm at my capacity limit, the button
shows "At capacity" and is disabled. Ticket is removed from other agents' queues
in real-time.

**A-6: Filter tickets by label** ✅
As an agent, I want to filter the queue by label so that I can find tickets
relevant to my expertise.
_Acceptance:_ Label filter chips above the ticket list. Selecting a label
filters the list to tickets with that label.

**A-7: See new tickets in real-time** ✅
As an agent, I want new tickets to appear in my queue without refreshing the
page so that I can respond quickly.
_Acceptance:_ When a customer creates a ticket, it appears in all connected
agents' queues in real-time.

**A-8: See resolved tickets leave my queue** ✅
As an agent, when I or another agent resolves a ticket, I want it to disappear
from my queue in real-time.
_Acceptance:_ Resolved tickets are removed from the active queue view without
page refresh.

**A-14: Return a ticket to the queue** 🚧
As an agent, I want to return a ticket I picked back to the open queue so that
another agent can handle it.
_Acceptance:_ "Return to queue" button on the ticket detail page (visible only
to the assigned agent). On click, status changes to `open`, assignment is
cleared, ticket appears in the open queue for all agents. Customer sees ticket
status change.

### Real-time Chat

**A-9: Chat with a customer** 🚧
As an agent, I want to exchange real-time messages with a customer on the
ticket so that I can resolve their issue.
_Acceptance:_ Chat interface on the ticket detail page. Messages appear in
real-time. When the customer is typing, a typing indicator is shown.

**A-10: Resolve a ticket** ✅
As an agent, I want to mark a ticket as resolved when the issue is addressed so
that the conversation is concluded.
_Acceptance:_ "Resolve" button on the ticket detail page (visible only to the
assigned agent). On click, status changes to `resolved`, both customer and
agent pool are notified.

**A-11: Send files in chat** ✅
As an agent, I want to attach files to my messages so that I can share
screenshots, documentation, or other resources.
_Acceptance:_ Same upload mechanism as customer-facing chat.

### Label Management

**A-12: Add labels to a ticket** ✅
As an agent, I want to add predefined labels to a ticket so that tickets are
categorized for queue filtering.
_Acceptance:_ Label selector on the ticket detail page. Agents can add labels
from the predefined set.

**A-13: Remove labels from a ticket** ✅
As an agent, I want to remove labels from a ticket when they are no longer
relevant.
_Acceptance:_ Remove button on each attached label. Label is detached from the
ticket.

### Availability

**A-15: Toggle availability** 🚧
As an agent, I want to toggle my availability between Online and Away so that I
can signal when I'm not able to take new tickets.
_Acceptance:_ Toggle in the header or agent profile. When Away, my name is
hidden from the open queue, the Accept button is hidden, and a badge shows
"Away" in the queue UI. Existing `in_progress` tickets stay assigned and I can
still chat. No auto-idle detection for P0.

### Notifications

**A-16: Receive in-app notifications** 🚧
As an agent, I want to receive notifications when new tickets arrive and when
tickets are updated so that I can respond quickly.
_Acceptance:_ A bell icon in the header shows unread badge count. Notifications
for: new ticket in queue, status changes on my tickets. Notifications auto-mark
as read when I view the related ticket. Tab title updates with unread count.

**A-17: See typing indicator** 🚧
As an agent, I want to see when the customer is typing so that I know they're
still engaged.
_Acceptance:_ When the customer is typing, "Customer is typing..." appears below
the message list. Disappears when typing stops (debounced).
