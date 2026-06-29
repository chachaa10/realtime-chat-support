import DatabaseConstructor from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

import * as schema from './schema';

const dbPath = process.env.DATABASE_PATH ?? ':memory:';
const client = new DatabaseConstructor(dbPath);
client.pragma('journal_mode = WAL');
export const db = drizzle({ client, schema });
export type DbClient = typeof db;
