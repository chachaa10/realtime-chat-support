import { TICKET_STATUSES } from '@repo/shared';
import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

import { profiles } from './profile-schema';

export const tickets = sqliteTable(
  'tickets',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    subject: text('subject').notNull(),
    description: text('description').notNull(),
    status: text('status', {
      enum: TICKET_STATUSES as unknown as [string, ...string[]],
    })
      .notNull()
      .default('open'),
    customerId: text('customer_id')
      .notNull()
      .references(() => profiles.id),
    agentId: text('agent_id').references(() => profiles.id),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
    resolvedAt: integer('resolved_at'),
    cancelledAt: integer('cancelled_at'),
  },
  (table) => [
    index('idx_tickets_status_created').on(table.status, table.createdAt),
    index('idx_tickets_customer').on(table.customerId),
    index('idx_tickets_agent').on(table.agentId),
  ],
);
