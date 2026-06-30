import { db, schema } from '@repo/database';
import { env } from '@repo/shared';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
export const auth = betterAuth({
  appName: 'realtime-chat-support',
  database: drizzleAdapter(db, { provider: 'sqlite', schema, camelCase: false, usePlural: true }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: [env.CORS_ORIGIN],
  databaseHooks: {},
  emailAndPassword: {
    enabled: true,
  },
  rateLimit: process.env.TEST_DATABASE_PATH
    ? { enabled: false }
    : {
        enabled: true,
        window: 60,
        max: 5,
        customRules: {
          '/sign-in/email': { window: 60, max: 5 },
          '/sign-up/email': { window: 60, max: 3 },
        },
      },
});
