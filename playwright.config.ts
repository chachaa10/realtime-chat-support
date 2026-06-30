import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 10000,
  retries: 0,
  fullyParallel: true,
  workers: 2,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    actionTimeout: 5000,
  },
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',
  webServer: [
    {
      command:
        'PORT=3099 CORS_ORIGIN=http://localhost:5173 BETTER_AUTH_SECRET=18AwKC4Qx2pBE3g1PEfrgdExiZnPuIfM BETTER_AUTH_URL=http://localhost:3099 TEST_DATABASE_PATH=$(pwd)/test-e2e.db NODE_ENV=test pnpm --filter backend dev',
      port: 3099,
      reuseExistingServer: false,
      timeout: 20000,
    },
    {
      command: 'VITE_API_URL=http://localhost:3099 pnpm --filter frontend dev',
      port: 5173,
      reuseExistingServer: false,
      timeout: 20000,
    },
  ],
});
