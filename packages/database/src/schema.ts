import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

export { users, sessions, accounts, verifications, relations } from './schema/auth-schema';

export const profiles = sqliteTable('profiles', {
  id: text('id').primaryKey(), // matches better-auth's internal user ID
  name: text('name').notNull(),
  role: text('role', { enum: ['customer', 'agent'] }).notNull(),
  createdAt: integer('created_at').notNull(), // Unix millis
});

export const tickets = sqliteTable(
  'tickets',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    subject: text('subject').notNull(),
    description: text('description').notNull(),
    status: text('status', { enum: ['open', 'in_progress', 'resolved'] })
      .notNull()
      .default('open'),
    customerId: text('customer_id')
      .notNull()
      .references(() => profiles.id),
    agentId: text('agent_id').references(() => profiles.id),
    createdAt: integer('created_at').notNull(), // Unix millis
    updatedAt: integer('updated_at').notNull(), // Unix millis, set =createdAt on insert
    resolvedAt: integer('resolved_at'), // Unix millis, nullable
  },
  (table) => ({
    statusIdx: index('idx_tickets_status_created').on(table.status, table.createdAt),
    customerIdx: index('idx_tickets_customer').on(table.customerId),
    agentIdx: index('idx_tickets_agent').on(table.agentId),
  }),
);

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
    createdAt: integer('created_at').notNull(), // Unix millis
  },
  (table) => ({
    ticketIdx: index('idx_messages_ticket').on(table.ticketId),
  }),
);

export const attachments = sqliteTable(
  'attachments',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    messageId: integer('message_id').references(() => messages.id),
    ticketId: integer('ticket_id')
      .notNull()
      .references(() => tickets.id),
    uploaderId: text('uploader_id')
      .notNull()
      .references(() => profiles.id),
    fileName: text('file_name').notNull(),
    fileSize: integer('file_size').notNull(),
    mimeType: text('mime_type').notNull(),
    filePath: text('file_path').notNull(),
    createdAt: integer('created_at').notNull(), // Unix millis
  },
  (table) => ({
    ticketIdx: index('idx_attachments_ticket').on(table.ticketId),
    messageIdx: index('idx_attachments_message').on(table.messageId),
    uploaderIdx: index('idx_attachments_uploader').on(table.uploaderId),
  }),
);
