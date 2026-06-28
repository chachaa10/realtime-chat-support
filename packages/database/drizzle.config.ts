import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/schema.ts',
  out: './src/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: 'file:../../data.db',
  },
  strict: true,
  verbose: true,
});
