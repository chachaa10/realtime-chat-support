import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number(),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  CORS_ORIGIN: z.string().min(1, 'CORS_ORIGIN is required'),
  BETTER_AUTH_SECRET: z.string().min(32, 'BETTER_AUTH_SECRET is required'),
  BETTER_AUTH_URL: z.url().min(1, 'BETTER_AUTH_URL is required'),
  DB_FILE_NAME: z.string().min(1, 'DB_FILE_NAME is required'),
});

let _env: z.infer<typeof envSchema> | undefined;

/**
 * Environment variables proxy that validates and caches values
 * Uses lazy loading to avoid parsing environment variables until first access
 *
 * @example
 * ```ts
 * const port = env.PORT;
 * const databaseUrl = env.DATABASE_URL;
 * ```
 *
 * @throws {Error} If environment variables are invalid
 *
 * @see {@link envSchema} for the schema definition
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
