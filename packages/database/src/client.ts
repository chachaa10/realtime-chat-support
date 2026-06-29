import DatabaseConstructor from 'better-sqlite3';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

import * as schema from './schema';

const clientMap = new WeakMap<BetterSQLite3Database<typeof schema>, DatabaseConstructor.Database>();

export function createClient(dbPath?: string) {
  const resolvedPath = dbPath ?? ':memory:';
  const sqliteClient = new DatabaseConstructor(resolvedPath);
  sqliteClient.pragma('journal_mode = WAL');
  const db = drizzle({ client: sqliteClient, schema });
  clientMap.set(db, sqliteClient);
  return db;
}

export function closeDb(db: BetterSQLite3Database<typeof schema>): void {
  const client = clientMap.get(db);
  if (!client) return;
  client.exec('PRAGMA wal_checkpoint(TRUNCATE)');
  client.close();
  clientMap.delete(db);
}

const defaultPath = process.env.TEST_DATABASE_PATH ?? process.env.DATABASE_PATH ?? ':memory:';
export const db = createClient(defaultPath);
export type DbClient = BetterSQLite3Database<typeof schema>;
