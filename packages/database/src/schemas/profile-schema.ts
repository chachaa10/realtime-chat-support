import { ROLES } from '@repo/shared';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

import { users } from './auth-schema';

export const profiles = sqliteTable('profiles', {
  id: text('id')
    .primaryKey()
    .references(() => users.id),
  role: text('role', { enum: ROLES as unknown as [string, ...string[]] }).notNull(),
  createdAt: integer('created_at').notNull(),
});
