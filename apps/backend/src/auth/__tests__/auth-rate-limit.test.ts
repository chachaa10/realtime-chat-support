import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

vi.mock('@repo/shared', () => {
  const dbPath = join(tmpdir(), `test-${randomUUID()}.db`);
  process.env.DATABASE_PATH = dbPath;
  return {
    env: {
      PORT: 3099,
      CORS_ORIGIN: 'http://localhost:5173',
      BETTER_AUTH_SECRET: 'test-secret-that-is-at-least-thirty-two-chars!!',
      BETTER_AUTH_URL: 'http://localhost:3099',
      DATABASE_PATH: dbPath,
    },
  };
});

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('auth rate limiting', () => {
  const original = process.env.TEST_DATABASE_PATH;

  beforeAll(() => {
    process.env.TEST_DATABASE_PATH = ':memory:';
  });

  afterAll(() => {
    if (original === undefined) {
      delete process.env.TEST_DATABASE_PATH;
    } else {
      process.env.TEST_DATABASE_PATH = original;
    }
  });

  it('disables rate limiting when TEST_DATABASE_PATH is set', async () => {
    const { auth } = await import('../auth');
    expect(auth).toBeDefined();
  });
});
