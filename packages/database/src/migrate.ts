import fs from 'node:fs';
import path from 'node:path';

import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

export async function runMigrations(
  db: BetterSQLite3Database,
  migrationsDir?: string,
): Promise<void> {
  const dir = migrationsDir ?? path.resolve(import.meta.dirname, 'migrations');

  const entries = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .toSorted((a, b) => a.name.localeCompare(b.name));

  for (const entry of entries) {
    const sqlFile = path.join(dir, entry.name, 'migration.sql');
    if (fs.existsSync(sqlFile)) {
      const sql = fs.readFileSync(sqlFile, 'utf-8');
      const statements = sql.split('--> statement-breakpoint');
      for (const stmt of statements) {
        const trimmed = stmt.trim();
        if (trimmed) {
          await db.run(trimmed);
        }
      }
    }
  }
}
