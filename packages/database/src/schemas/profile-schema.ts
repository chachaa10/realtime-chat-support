import { ROLES } from '@repo/shared';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

import { users } from './auth-schema';

export const profiles = sqliteTable('profiles', {
  id: text('id')
    .primaryKey()
    .references(() => users.id),
  role: text('role', { enum: ROLES as unknown as [string, ...string[]] }).notNull(),
  status: text('status', { enum: ['online', 'away'] }).notNull().default('online'),
  createdAt: integer('created_at').notNull(),
});
