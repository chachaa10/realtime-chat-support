import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

import { messages } from './message-schema';
import { profiles } from './profile-schema';
import { tickets } from './ticket-schema';

export const attachments = sqliteTable(
  'attachments',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    messageId: integer('message_id').references(messages.id),
    ticketId: integer('ticket_id')
      .notNull()
      .references(tickets.id),
    uploaderId: text('uploader_id')
      .notNull()
      .references(profiles.id),
    fileName: text('file_name').notNull(),
    fileSize: integer('file_size').notNull(),
    mimeType: text('mime_type').notNull(),
    filePath: text('file_path').notNull(),
    createdAt: integer('created_at').notNull(),
  },
  (table) => [
    index('idx_attachments_ticket').on(table.ticketId),
    index('idx_attachments_msg_created').on(table.messageId, table.createdAt),
    index('idx_attachments_uploader').on(table.uploaderId),
  ],
);
