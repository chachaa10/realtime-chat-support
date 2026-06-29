import { defineRelations } from 'drizzle-orm';

import { attachments } from './schemas/attachment-schema';
import { users, sessions, accounts, verifications } from './schemas/auth-schema';
import { messages } from './schemas/message-schema';
import { profiles } from './schemas/profile-schema';
import { ticketEvents } from './schemas/ticket-event-schema';
import { tickets } from './schemas/ticket-schema';

export {
  users,
  sessions,
  accounts,
  verifications,
  profiles,
  tickets,
  messages,
  attachments,
  ticketEvents,
};

export const relations = defineRelations(
  {
    users,
    sessions,
    accounts,
    verifications,
    profiles,
    tickets,
    messages,
    attachments,
    ticketEvents,
  },
  (r) => ({
    users: {
      sessions: r.many.sessions(),
      accounts: r.many.accounts(),
    },
    sessions: {
      user: r.one.users({
        from: r.sessions.userId,
        to: r.users.id,
      }),
    },
    accounts: {
      user: r.one.users({
        from: r.accounts.userId,
        to: r.users.id,
      }),
    },
    profiles: {
      ticketsAsCustomer: r.many.tickets({
        from: r.profiles.id,
        to: r.tickets.customerId,
      }),
      ticketsAsAgent: r.many.tickets({
        from: r.profiles.id,
        to: r.tickets.agentId,
      }),
      messages: r.many.messages({
        from: r.profiles.id,
        to: r.messages.authorId,
      }),
      attachments: r.many.attachments({
        from: r.profiles.id,
        to: r.attachments.uploaderId,
      }),
      ticketEvents: r.many.ticketEvents({
        from: r.profiles.id,
        to: r.ticketEvents.actorId,
      }),
    },
    tickets: {
      customer: r.one.profiles({
        from: r.tickets.customerId,
        to: r.profiles.id,
      }),
      agent: r.one.profiles({
        from: r.tickets.agentId,
        to: r.profiles.id,
      }),
      messages: r.many.messages({
        from: r.tickets.id,
        to: r.messages.ticketId,
      }),
      attachments: r.many.attachments({
        from: r.tickets.id,
        to: r.attachments.ticketId,
      }),
      events: r.many.ticketEvents({
        from: r.tickets.id,
        to: r.ticketEvents.ticketId,
      }),
    },
    messages: {
      ticket: r.one.tickets({
        from: r.messages.ticketId,
        to: r.tickets.id,
      }),
      author: r.one.profiles({
        from: r.messages.authorId,
        to: r.profiles.id,
      }),
      attachments: r.many.attachments({
        from: r.messages.id,
        to: r.attachments.messageId,
      }),
    },
    attachments: {
      ticket: r.one.tickets({
        from: r.attachments.ticketId,
        to: r.tickets.id,
      }),
      message: r.one.messages({
        from: r.attachments.messageId,
        to: r.messages.id,
      }),
      uploader: r.one.profiles({
        from: r.attachments.uploaderId,
        to: r.profiles.id,
      }),
    },
    ticketEvents: {
      ticket: r.one.tickets({
        from: r.ticketEvents.ticketId,
        to: r.tickets.id,
      }),
      actor: r.one.profiles({
        from: r.ticketEvents.actorId,
        to: r.profiles.id,
      }),
    },
  }),
);
