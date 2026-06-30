import { execSync } from 'node:child_process';

export default async function () {
  const dbPath = `${process.cwd()}/test-e2e.db`;
  execSync(
    `DRIZZLE_DATABASE_URL=${dbPath} pnpm --filter @repo/database exec drizzle-kit push`,
    { stdio: 'inherit', cwd: process.cwd() },
  );
}
