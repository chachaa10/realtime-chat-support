import DatabaseConstructor from 'better-sqlite3';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

import * as schema from './schema';

let rawDb: DatabaseConstructor.Database | undefined;
let dbInstance: BetterSQLite3Database<typeof schema> | undefined;

export function createClient(dbPath?: string) {
  const resolvedPath = dbPath ?? ':memory:';
  const sqliteClient = new DatabaseConstructor(resolvedPath);
  sqliteClient.pragma('journal_mode = WAL');
  return drizzle({ client: sqliteClient, schema });
}

export function getDb(): BetterSQLite3Database<typeof schema> {
  if (!dbInstance) {
    const defaultPath = process.env.TEST_DATABASE_PATH ?? process.env.DATABASE_PATH ?? ':memory:';
    rawDb = new DatabaseConstructor(defaultPath);
    rawDb.pragma('journal_mode = WAL');
    dbInstance = drizzle({ client: rawDb, schema });
  }
  return dbInstance;
}

export function closeDb(): void {
  if (!rawDb) return;
  rawDb.exec('PRAGMA wal_checkpoint(TRUNCATE)');
  rawDb.close();
  rawDb = undefined;
  dbInstance = undefined;
}

export const db = new Proxy({} as BetterSQLite3Database<typeof schema>, {
  get(target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});

export type DbClient = BetterSQLite3Database<typeof schema>;
