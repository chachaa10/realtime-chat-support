import { execSync } from 'node:child_process';
import { existsSync, unlinkSync } from 'node:fs';

export default async function () {
  const dbPath = `${process.cwd()}/test-e2e.db`;

  // Clean stale database files from previous runs to ensure a fresh push
  for (const ext of ['', '-shm', '-wal']) {
    const file = `${dbPath}${ext}`;
    if (existsSync(file)) unlinkSync(file);
  }

  execSync(
    `DRIZZLE_DATABASE_URL=${dbPath} pnpm --filter @repo/database exec drizzle-kit push`,
    { stdio: 'inherit', cwd: process.cwd() },
  );
}
