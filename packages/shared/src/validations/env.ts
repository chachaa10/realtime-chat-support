import { z } from 'zod';

export const envSchema = z.object({
  PORT: z.coerce.number(),
  CORS_ORIGIN: z.string().min(1, { error: 'CORS_ORIGIN is required' }),
  BETTER_AUTH_SECRET: z.string().min(32, { error: 'BETTER_AUTH_SECRET must be at least 32 characters' }),
  BETTER_AUTH_URL: z.string().url({ error: 'BETTER_AUTH_URL must be a valid URL' }),
  DATABASE_PATH: z.string().optional().default(':memory:'),
  UPLOAD_DIR: z.string().optional().default('uploads'),
});

let _env: z.infer<typeof envSchema> | undefined;

/**
 * Environment variables proxy that validates and caches values
 * Uses lazy loading to avoid parsing environment variables until first access
 *
 * @example
 * ```ts
 * const port = env.PORT;
 * const dbPath = env.DATABASE_PATH;
 * ```
 *
 * @throws {Error} If environment variables are invalid
 */
export const env = new Proxy({} as z.infer<typeof envSchema>, {
  get(_, prop) {
    if (!_env) {
      const result = envSchema.safeParse(process.env);
      if (!result.success) {
        const errors = JSON.stringify(z.treeifyError(result.error), null, 2);
        throw new Error('Invalid environment variables: ' + errors);
      }
      _env = result.data;
    }
    return _env[prop as keyof typeof _env];
  },
});
