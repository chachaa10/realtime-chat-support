import { execSync } from 'node:child_process';
import { existsSync, unlinkSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DB_PATH = resolve(ROOT, 'data.db');

if (existsSync(DB_PATH)) unlinkSync(DB_PATH);

execSync('pnpm --filter @repo/database exec drizzle-kit push', {
  cwd: ROOT,
  stdio: 'inherit',
});
