import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { initEnv } from '@repo/shared/init-env';

const __dirname = dirname(fileURLToPath(import.meta.url));
initEnv(resolve(__dirname, '../../..'));
export { env } from '@repo/shared';
