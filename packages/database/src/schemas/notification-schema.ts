import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

import { profiles } from './profile-schema';
import { tickets } from './ticket-schema';

export const notifications = sqliteTable('notifications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id')
    .notNull()
    .references(() => profiles.id),
  type: text('type', {
    enum: [
      'ticket_assigned',
      'ticket_resolved',
      'ticket_cancelled',
      'ticket_returned',
      'new_message',
    ],
  }).notNull(),
  ticketId: integer('ticket_id')
    .notNull()
    .references(() => tickets.id),
  message: text('message').notNull(),
  isRead: integer('is_read').notNull().default(0),
  createdAt: integer('created_at').notNull(),
});
