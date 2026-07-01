import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

import { profiles } from './profile-schema';
import { tickets } from './ticket-schema';

export const MESSAGE_STATUSES = ['sent', 'delivered', 'read'] as const;
export type MessageStatus = (typeof MESSAGE_STATUSES)[number];

export const messages = sqliteTable(
  'messages',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    ticketId: integer('ticket_id')
      .notNull()
      .references(() => tickets.id),
    authorId: text('author_id')
      .notNull()
      .references(() => profiles.id),
    body: text('body').notNull(),
    status: text('status', { enum: MESSAGE_STATUSES }).notNull().default('sent'),
    createdAt: integer('created_at').notNull(),
  },
  (table) => [index('idx_messages_ticket_created').on(table.ticketId, table.createdAt)],
);
