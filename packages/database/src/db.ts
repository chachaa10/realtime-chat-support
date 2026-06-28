import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { env } from '@repo/shared';
import * as schema from './schema';

export const client = createClient({ url: env.DB_FILE_NAME });
export const db = drizzle({ client, schema });
export type DbClient = typeof db;
