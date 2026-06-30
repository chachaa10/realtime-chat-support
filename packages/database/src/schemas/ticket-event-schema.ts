import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

import { profiles } from './profile-schema';
import { tickets } from './ticket-schema';

export const ticketEvents = sqliteTable(
  'ticket_events',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    ticketId: integer('ticket_id')
      .notNull()
      .references(() => tickets.id),
    fromStatus: text('from_status', {
      enum: ['open', 'in_progress', 'resolved', 'cancelled'],
    }),
    toStatus: text('to_status', {
      enum: ['open', 'in_progress', 'resolved', 'cancelled'],
    }).notNull(),
    actorId: text('actor_id')
      .notNull()
      .references(() => profiles.id),
    reason: text('reason'),
    createdAt: integer('created_at').notNull(),
  },
  (table) => [index('idx_events_ticket_created').on(table.ticketId, table.createdAt)],
);
