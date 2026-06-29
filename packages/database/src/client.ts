import DatabaseConstructor from 'better-sqlite3';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

import * as schema from './schema';

export function createClient(dbPath?: string) {
  const resolvedPath = dbPath ?? ':memory:';
  const sqliteClient = new DatabaseConstructor(resolvedPath);
  sqliteClient.pragma('journal_mode = WAL');
  const db = drizzle({ client: sqliteClient, schema });
  return db;
}

export function closeDb<T extends Record<string, unknown>>(db: BetterSQLite3Database<T>): void {
  const client = (db as any)['$client'] as DatabaseConstructor.Database;
  client.exec('PRAGMA wal_checkpoint(TRUNCATE)');
  client.close();
}

const defaultPath = process.env.TEST_DATABASE_PATH ?? process.env.DATABASE_PATH ?? ':memory:';
export const db = createClient(defaultPath);
export type DbClient = BetterSQLite3Database<typeof schema>;
