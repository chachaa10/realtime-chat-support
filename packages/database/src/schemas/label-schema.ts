import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';

import { tickets } from './ticket-schema';

export const labels = sqliteTable('labels', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  color: text('color').notNull(),
});

export const ticketLabels = sqliteTable(
  'ticket_labels',
  {
    ticketId: integer('ticket_id')
      .notNull()
      .references(() => tickets.id),
    labelId: integer('label_id')
      .notNull()
      .references(() => labels.id),
  },
  (table) => [primaryKey({ columns: [table.ticketId, table.labelId] })],
);
