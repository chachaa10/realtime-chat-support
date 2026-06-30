import { resolve } from 'node:path';

import dotenv from 'dotenv';

import { env, envSchema } from './validations/env';

export function initEnv(projectRoot: string) {
  dotenv.config({ path: resolve(projectRoot, '.env') });
  const dbPath = process.env.TEST_DATABASE_PATH ?? process.env.DATABASE_PATH;
  process.env.DATABASE_PATH = dbPath
    ? resolve(projectRoot, dbPath)
    : resolve(projectRoot, 'data.db');
}

export { env, envSchema };
