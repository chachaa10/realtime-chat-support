import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '../../..');
dotenv.config({ path: resolve(projectRoot, '.env') });

process.env.DATABASE_PATH = resolve(projectRoot, 'data.db');

export { env } from '@repo/shared';
