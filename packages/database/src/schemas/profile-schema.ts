import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

import { users } from './auth-schema';

export const profiles = sqliteTable('profiles', {
  id: text('id').primaryKey().references(users.id),
  role: text('role', { enum: ['customer', 'agent'] }).notNull(),
  createdAt: integer('created_at').notNull(),
});
